## 9 · Future Evolution

### 9.1 Evolution A — Persisted retirement pipeline with enforced state transitions (analytics ladder: rung 1 → 2)

**What.** §7 correctly classifies this as a workflow/state-machine tool with no
quantitative model — the wizard, purpose taxonomy (8 types), compliance-framework
matrix, and 20-transaction ledger are all frontend seeds, and the monthly-retirement
series is `sr()`-seeded. Evolution A gives the workflow a real spine: a
`cc_retirement_requests` table with the documented five-stage pipeline (purpose →
beneficial owner → instruction → confirmation → certificate) enforced server-side,
an append-only audit log at confirmation (the guide's headline
`RetirementComplete = Confirmation AND Certificate AND AuditLog.appended` becomes a DB
invariant), and the cancel-before-confirmation-only rule as a checked transition.

**How.** (1) New router `api/v1/routes/cc_retirement.py` with per-stage POST endpoints;
transitions validated against `PIPELINE_STAGES` order, illegal jumps rejected with the
current stage cited. (2) Certificate generation as a deterministic, hash-stamped PDF/
JSON artifact referencing the audit entry. (3) Replace the seeded monthly series with
aggregates over real requests — honest empty state until volume exists, per platform
convention. AuditMiddleware already logs every call, complementing the domain audit
table.

**Prerequisites.** REQUIRE_AUTH posture decided for mutating endpoints (the documented
platform-wide POST-blocking issue applies here); the seeded random series is a defect
to delete, not keep. **Acceptance:** cancelling a confirmed retirement returns 409;
every completed request has exactly one immutable audit entry and one certificate whose
hash verifies.

### 9.2 Evolution B — Retirement-desk copilot with guarded execution (LLM tier 2)

**What.** An assistant that drives the wizard conversationally: "retire 5kt of our
2021 REDD+ credits for CORSIA, beneficiary Acme Air, Ireland" is parsed into the
staged tool calls against Evolution A's endpoints — with every mutating step gated
behind explicit user confirmation per the tier-2 rule, since retirement is
irreversible by design. It also explains the compliance-framework matrix ("can Puro
credits satisfy an ETS obligation?") from the seeded `COMPLIANCE_FRAMEWORKS` table.

**How.** Tool schemas from the new router's OpenAPI spec; the copilot fills wizard
fields but the confirm-stage call requires a human click (mirroring the no-reversal
rule); the no-fabrication validator checks quantities and serials against tool
responses. Framework-eligibility answers cite the matrix row, not general knowledge.

**Prerequisites (hard).** Evolution A is strictly first — there is nothing to execute
today, and a copilot simulating retirements against seed data would be theatre.
RBAC scoping so the copilot inherits the user's registry permissions. **Acceptance:**
an end-to-end conversational retirement produces the same DB trail as the manual
wizard; the copilot never fires the confirmation endpoint without a recorded user
approval.
