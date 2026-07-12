# Api::Parameter_Governance
**Module ID:** `api::parameter_governance` · **Route:** `/api/v1/parameters` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/parameters` | `list_parameters` | api/v1/routes/parameter_governance.py |
| POST | `/api/v1/parameters` | `propose_parameter` | api/v1/routes/parameter_governance.py |
| GET | `/api/v1/parameters/change-requests` | `list_change_requests` | api/v1/routes/parameter_governance.py |
| GET | `/api/v1/parameters/{param_id}` | `get_parameter` | api/v1/routes/parameter_governance.py |
| POST | `/api/v1/parameters/{param_id}/approve` | `approve_parameter` | api/v1/routes/parameter_governance.py |
| POST | `/api/v1/parameters/{param_id}/reject` | `reject_parameter` | api/v1/routes/parameter_governance.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `__future__` *(shared)*, `calculation_parameters`, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `parameter_change_requests`, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/parameters** — status `passed`, provenance ['db-empty'], source tables: `calculation_parameters`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/parameters/change-requests** — status `passed`, provenance ['db-empty'], source tables: `parameter_change_requests`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/parameters/{param_id}** — status `failed`, provenance ['db-empty'], source tables: `calculation_parameters`
Output: `None`

**POST /api/v1/parameters** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/parameters/{param_id}/approve** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/parameters/{param_id}/reject** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `parameter_governance` domain (`/api/v1/parameters`) is a **four-eyes (dual-control)
approval workflow** for model calibration constants — NGFS scenario parameters, PCAF factors,
PD calibrations, stranded-asset assumptions, carbon prices. It has no calculation engine;
its "methodology" is a governance state machine over two Postgres tables, aligned with EBA
Guidelines on Internal Governance (EBA/GL/2021/05 §§57-64).

### 7.1 What the module computes

Nothing numeric. It enforces a **propose → review → approve/reject** lifecycle so that no
single user can silently change a model parameter that feeds the quant engines. State is held
in `calculation_parameters` (the versioned parameter registry) and
`parameter_change_requests` (the approval queue).

### 7.2 Parameterisation / scoring rubric

**Parameter categories** (free-text but conventionally): `scenario`, `pcaf`, `pd`,
`stranded`, `carbon`, `custom`. Each proposed parameter carries `parameter_name`, a category,
a numeric/text/JSON value, a unit, a **source citation** (e.g. `"NGFS Phase 4 (2023)"`), an
effective/expiry date, and a mandatory `justification`.

**Approval states:** `pending` → `approved` | `rejected`. There is no scoring rubric — the
control is binary and requires a second actor (the reviewer) distinct from the proposer.

### 7.3 Calculation walkthrough

1. `POST /parameters` (`propose_parameter`): computes the next version as
   `COALESCE(MAX(version),0)+1` for that `parameter_name`, inserts a new
   `calculation_parameters` row with `approval_status = 'pending'`, and creates a paired
   `parameter_change_requests` row (also `pending`). Returns the new parameter id + change
   request id.
2. `GET /parameters/change-requests?status=pending` — the reviewer's approval queue.
3. `POST /parameters/{id}/approve`: a **guarded update** —
   `UPDATE … SET approval_status='approved' WHERE id=:pid AND approval_status='pending'
   RETURNING …`. If no row is returned (already approved/rejected, or not found), it 404s,
   preventing double-approval. The paired change request is stamped with the reviewer comment
   and `reviewed_at = NOW()`.
4. `POST /parameters/{id}/reject`: symmetric guarded update to `rejected`.
5. `GET /parameters/{id}`: returns the parameter with its full `change_request_history`.

Listing (`GET /parameters`) filters by category and status (default `approved`) and orders by
category, name, and descending version — so callers see the latest approved value first.

### 7.4 Worked example

A risk officer proposes bumping the Current-Policies PD multiplier from 1.55 to 1.58:

- `POST /parameters` with `parameter_name="ngfs_current_policies_pd_mult"`,
  `parameter_category="pd"`, `value_numeric=1.58`, `source="NGFS Phase 4 (2023)"`,
  `justification="Recalibrated to latest NGFS vintage"`. Suppose the prior max version was 2 →
  new row is version 3, status `pending`; a change request id is returned.
- The parameter is **not yet live**: `list_parameters(status="approved")` still returns
  version 2 (1.55).
- A second officer calls `POST /parameters/{id}/approve` with a comment. The guarded
  `UPDATE … WHERE approval_status='pending'` flips version 3 to `approved`; the change request
  records the reviewer comment and timestamp. Version 3 (1.58) now surfaces as the active value.
- If the first officer tried to self-approve twice, the second call returns 404 (row already
  `approved`).

### 7.5 Data provenance & limitations

- Pure DB workflow — **no synthetic data, no PRNG, no numeric derivation**. Every value is
  operator-supplied with a source citation.
- The route does **not** cryptographically enforce that approver ≠ proposer; segregation of
  duties relies on the calling application passing distinct users. The endpoints capture
  `reviewer_id`/`reviewer_comment` for the audit trail but the guard is on the `pending` state,
  not on actor identity.
- All write paths wrap in try/except with `db.rollback()` on error and surface HTTP 500,
  keeping the two tables consistent.

**Framework alignment:** **EBA/GL/2021/05 (Internal Governance)** — §§57-64 require documented
controls and segregation of duties over risk-model parameters; the versioned registry +
dual-control queue implements the "four-eyes" principle. By forcing a `source` and
`justification` on every proposal, the module also supports **model-risk-management (SR 11-7 /
TRIM)** expectations that model inputs be traceable and independently validated before use.

## 9 · Future Evolution

### 9.1 Evolution A — Bind the governance registry to the live engines it governs (analytics ladder: rung 1 → 2)

**What.** A four-eyes (dual-control) approval workflow for model calibration constants —
NGFS parameters, PCAF factors, PD calibrations, stranded-asset assumptions, carbon prices —
aligned to EBA GL/2021/05 §§57–64. No numeric engine: it's a `propose → review →
approve/reject` state machine over `calculation_parameters` (versioned registry) and
`parameter_change_requests` (approval queue), each parameter carrying a source citation,
effective/expiry dates, and a mandatory justification. The atlas shows both tables
**db-empty** and the write endpoints `skipped`/`failed` under the harness — the workflow
exists but isn't actually wired to any engine's constants yet. Evolution A closes that loop.

**How.** (1) Make the engines *read* their constants from `calculation_parameters` at
runtime instead of hardcoding them — start with the highest-risk calibrations the
`model_validation` inventory tracks (PD floors, carbon prices, NGFS multipliers), so an
approved parameter change actually propagates. This is the systemic fix for the platform's
recurring "static reference table" limitation across dozens of modules. (2) Enforce
effective/expiry dating so historical engine runs are reproducible with the parameters in
force at the time (ties to model-validation provenance). (3) Seed the registry from the
existing hardcoded constants with their source citations. (4) Confirm the write path
(propose/approve/reject) works end-to-end.

**Prerequisites.** Engines refactored to read from the registry (large but high-leverage);
the write endpoints repaired. **Acceptance:** an approved carbon-price change alters a
downstream engine's output without a code deploy; a historical run reproduces with
period-correct parameters; the registry is populated with cited sources.

### 9.2 Evolution B — Model-governance copilot for the parameter approval queue (LLM tier 2)

**What.** A copilot for the second line: "what parameter changes are pending, who proposed
them, and what's the cited source?" (calling `/parameters/change-requests`), and — for
approvers — "approve param X" via the gated `/{param_id}/approve` endpoint under
confirmation, with a full audit trail.

**How.** Read endpoints (`/parameters`, `/change-requests`, `/{param_id}`) are freely
callable; approve/reject are the RBAC-gated mutating actions requiring explicit
confirmation and inheriting the approver's session — a textbook four-eyes tool where the
copilot must never self-approve. It grounds every answer in registry rows and their
justifications, and can flag governance risks (e.g. a parameter past its expiry still in
use). Pairs with the `model_validation` copilot as the platform's governance desk.

**Prerequisites.** Evolution A's live binding for the copilot to explain a parameter's
actual downstream impact; the dual-control rule must forbid the same user proposing and
approving. **Acceptance:** every pending change, proposer, and source cited traces to a
registry row; approve/reject requires confirmation, logs to audit, and enforces four-eyes
separation; the copilot refuses to approve a change it (or the requesting user) proposed.