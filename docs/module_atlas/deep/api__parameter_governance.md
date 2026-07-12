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
