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
