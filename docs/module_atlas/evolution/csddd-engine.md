## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its backend; build the supplier-triage formula (analytics ladder: rung 1 → 2)

**What.** §7's flag has two parts: the page's 60 companies and all their
impact/grievance/SBTi/transition metrics are `sr()`-seeded, and the backend
`csddd_engine.py` behind 11 routes is "not wired into the default page". The one
real piece — the Scope & Timeline classifier with correct Art. 2 thresholds, groups,
and application dates (2027/28/29, transposition 26 Jul 2026) — proves the module
can do regulatory logic properly. The guide's triage formula
`SupplierRisk = f(Country × Sector × Spend × Audit)` exists nowhere. Evolution A
wires and builds.

**How.** (1) Wiring: the adverse-impact and value-chain tabs consume
`POST /csddd/adverse-impacts` and `/value-chain-mapping`, with the six ref GETs
(`/ref/adverse-impacts`, `/ref/high-risk-sectors`, `/ref/dd-obligations`…) as the
reference layer — deleting the seeded 60-company generator. (2) Triage engine: the
guide's four-factor product implemented server-side — country risk from ITUC/WGI
curated tables (shared with `csddd-compliance`'s Evolution A — build the country-
risk refdata once), sector risk from the module's own `/ref/high-risk-sectors`
endpoint, spend materiality from entered supplier spend, audit adjustment for
SMETA/SA8000 certification flags — producing the risk-tiered supplier queue the
overview promises. (3) Supplier registry persistence (a `csddd_suppliers` table)
with the questionnaire workflow tracking response states — the module's operational
identity. (4) Harness fixtures for the four POSTs.

**Prerequisites (hard).** PRNG purge; the shared country-risk refdata; supplier
data entry/import path. **Acceptance:** the Scope classifier still reproduces its
Art. 2 outputs (regression); a DRC-cobalt supplier outranks a German-services one
via the documented factor product; every displayed metric traces to an endpoint or
an entered record.

### 9.2 Evolution B — Questionnaire and grievance triage analyst (LLM tier 2)

**What.** The module's promised workflow — screening questionnaires, impact
register population, grievance case management — is textual work at scale.
Evolution B staffs it: questionnaire responses get first-pass analysis (flag
contradictions, map answers to CSDDD Annex impact categories, propose register
entries with quoted response passages); grievance intake gets structured triage
(category, severity indicators, escalation recommendation per the documented
rules) — every proposal queued for human confirmation, preserving the audit trail
that is this module's entire regulatory value.

**How.** Tier-2 with gated writes: read tools over the supplier registry and
`/ref/adverse-impacts` category definitions; proposals persist as drafts pending
confirmation. Classification prompts ground on the 15 curated impact categories and
the OECD sector-guidance texts; a response that evidences no impact yields "no
adverse impact indicated", never a manufactured finding. Grievance summaries cite
the case record verbatim.

**Prerequisites (hard).** Evolution A's registry and questionnaire persistence
(there is nothing real to triage today); category definitions and OECD texts
embedded; RBAC on the confirmation workflow. **Acceptance:** register-entry
proposals carry quoted questionnaire evidence; classification precision ≥90% on a
hand-labelled response set before auto-queueing; no proposal enters the register
without a named human confirmer in the audit log.
