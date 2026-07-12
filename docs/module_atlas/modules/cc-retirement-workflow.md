# Carbon Credit Retirement Workflow
**Module ID:** `cc-retirement-workflow` · **Route:** `/cc-retirement-workflow` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Structured retirement workflow engine for carbon credits including retirement purpose selection, beneficial owner declaration, registry instruction generation, and retirement certificate creation. Supports compliance, voluntary, and CORSIA retirement categories.

> **Business value:** Retirement workflow completes in 4 steps: purpose declaration → registry instruction → confirmation → certificate. Immutable audit log appended at confirmation; no reversal possible post-registry confirmation.

**How an analyst works this module:**
- Select credits for retirement from portfolio holdings
- Purpose Declaration tab selects retirement category and sub-purpose
- Beneficial Owner tab records entity details and jurisdiction
- Submit tab generates and sends registry instruction
- Certificate tab downloads signed retirement certificate

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENEFICIARIES`, `Badge`, `COMPLIANCE_FRAMEWORKS`, `DualInput`, `Kpi`, `PIPELINE_STAGES`, `PROJECT_NAMES`, `PURPOSE_TYPES`, `REGISTRIES`, `REG_COLORS`, `STATUSES`, `STATUS_COLORS`, `Section`, `TRANSACTIONS`, `TabBar`, `WIZARD_STEPS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BENEFICIARIES` | 6 | `name`, `type`, `country`, `contact` |
| `COMPLIANCE_FRAMEWORKS` | 7 | `scope`, `eligible_registries`, `unit`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => { if (n == null \|\| !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`; };` |
| `pipelineData` | `useMemo(() => PIPELINE_STAGES.map((stage, i) => ({` |
| `monthlyRetirements` | `useMemo(() => Array.from({ length: 12 }, (_, i) => ({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], retired: Math.round(50000 + sr(i * 7) * 150000), requests: Math.round(8 + sr(i * 11) * 25), avg_time_days: Math.round(5 + sr(i * 13) * 18), })), []);` |
| `byPurpose` | `useMemo(() => PURPOSE_TYPES.map((p, i) => ({` |
| `totalRetired` | `useMemo(() => TRANSACTIONS.filter(t => t.status === 'Completed').reduce((a, t) => a + t.quantity, 0), []);` |
| `totalPending` | `useMemo(() => TRANSACTIONS.filter(t => ['Pending', 'Processing'].includes(t.status)).reduce((a, t) => a + t.quantity, 0), []);` |
| `totalValue` | `useMemo(() => TRANSACTIONS.filter(t => t.status === 'Completed').reduce((a, t) => a + t.total_cost, 0), []);` |
| `submissionByRegistry` | `useMemo(() => REGISTRIES.map((r, i) => ({` |
| `bVol` | `bTxns.reduce((a, t) => a + t.quantity, 0);` |
| `eligible` | `sr(fi * 7 + ri * 11) > 0.4;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENEFICIARIES`, `COMPLIANCE_FRAMEWORKS`, `PIPELINE_STAGES`, `PROJECT_NAMES`, `PURPOSE_TYPES`, `REGISTRIES`, `REG_COLORS`, `STATUSES`, `TABS`, `WIZARD_STEPS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Retirement Purpose Categories | `Regulated classification` | Registry requirements | Required declaration of why credits are being retired |
| Beneficial Owner | `Declaration form` | ISO 14064-3 | Final entity in whose name emission reductions are claimed |
| Registry Confirmation ID | `API response` | Registry system | Unique identifier confirming successful retirement in registry ledger |
| Certificate Issue Date | `System timestamp` | Platform | Date and time of retirement certificate generation |
- **Portfolio holdings** → Available serials → retirement selection → **Credits to be retired**
- **Registry API** → Retirement instruction → confirmation ID → **Registry-confirmed retirement record**

## 5 · Intermediate Transformation Logic
**Methodology:** Retirement state machine with certificate generation
**Headline formula:** `RetirementComplete = RegistryConfirmation AND CertificateIssued AND AuditLog.appended`

Retirement workflow: (1) Select serial range and retirement purpose; (2) Declare beneficial owner entity and jurisdiction; (3) Submit registry instruction with counterparty authentication; (4) Registry confirms serial status change to Retired; (5) Generate retirement certificate with registry confirmation ID; (6) Append immutable audit log entry. Cancel path available before registry confirmation only.

**Standards:** ['Verra VCS Retirement Procedures', 'Gold Standard Retirement Rules', 'ISO 14064-3', 'CORSIA Retirement Requirements']
**Reference documents:** Verra VCS Retirement and Cancellation Procedures; Gold Standard Registry Retirement Rules; ISO 14064-3:2019 Validation and Verification; ICAO CORSIA Retirement and Cancellation Requirements

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is a **transaction workflow / state-machine** tool, not a quantitative model. The
MODULE_GUIDES entry describes it accurately: a retirement pipeline (purpose declaration → beneficial
owner → registry instruction → confirmation → certificate → audit log). There is no emission
calculation; the only arithmetic is cost aggregation and portfolio KPIs over a synthetic transaction
ledger.

### 7.1 What the module computes

Aggregations over 20 synthetic `TRANSACTIONS`:
```
total_cost(t)  = quantity · price_per_t                    // per transaction
totalRetired   = Σ quantity where status = 'Completed'
totalPending   = Σ quantity where status ∈ {Pending, Processing}
totalValue     = Σ total_cost where status = 'Completed'
```
Plus `monthlyRetirements` (12-month retired-volume / request-count / avg-processing-time series,
`sr()`-seeded), `byPurpose` (volume by retirement purpose), and `submissionByRegistry`.

### 7.2 Parameterisation / data rubric

| Element | Value / source | Provenance |
|---|---|---|
| Registries | Verra, Gold Standard, Puro, Isometric | Hard-coded list |
| Purpose types | 8 (Voluntary S1/S2/S3, CORSIA, ETS, Product-neutral, Supply-chain, Event) | Hard-coded, regulator-aligned |
| Pipeline stages | Initiated → Validated → Submitted → Confirmed → Certified | Hard-coded state machine |
| Wizard steps | Select Credits → Beneficiary → Registry → Purpose → Documents → Submit | Hard-coded |
| Compliance frameworks | CORSIA, EU ETS, CA CaT, UK ETS, ICAO LTAG, Article 6.4 | Hard-coded, real frameworks + eligibility notes |
| Beneficiaries (Meridian, Swiss Re, Unilever, Lufthansa, Nestlé) | Hard-coded illustrative | Synthetic names |
| Transaction quantity, price, vintage, serials, dates | `sr()`-seeded | **Synthetic** PRNG demo data |
| Status distribution | Index-banded (i<3 Draft … i<18 Failed) | Deterministic seed for realistic mix |

### 7.3 Calculation walkthrough

`TRANSACTIONS` is generated with a banded status assignment (ensuring a realistic spread across
Draft/Pending/Processing/Completed/Failed/Cancelled), then a post-map loop sets
`total_cost = quantity · price_per_t`. KPIs filter by status and sum quantity/cost. The retirement
wizard is a 6-step UI flow over the pipeline state machine — the guide's `RetirementComplete =
RegistryConfirmation ∧ CertificateIssued ∧ AuditLog.appended` is represented by the pipeline stages,
not by executable transactional logic (no real registry API is called).

### 7.4 Worked example (portfolio KPIs)

Of 20 transactions, indices 10–15 (6 rows) are `Completed`. With per-row quantities drawn from
`5,000 + sr(i·7)·95,000` (mean ≈ 52,500) and prices from `3.5 + sr(i·19)·18` (mean ≈ $12.5/t):
`totalRetired ≈ 6·52,500 ≈ 315,000 tCO₂e`; `totalValue ≈ 315,000·12.5 ≈ $3.9M`. Pending (indices
3–9, statuses Pending/Processing) adds ~7·52,500 ≈ 367,500 tCO₂e in `totalPending`. Exact values are
deterministic given the `sr()` seeds.

### 7.5 Data provenance & limitations
- **All transaction data is synthetic `sr()`-seeded demo data**; beneficiaries and project names are
  illustrative. Compliance-framework metadata is real but static.
- No live registry integration — the "Submit" step does not generate a real registry instruction or
  confirmation ID; the certificate and audit log are UI artefacts.
- No double-retirement guard or serial-conflict check across transactions.

**Framework alignment:** **Verra VCS / Gold Standard retirement procedures** — the purpose-declaration,
beneficial-owner and irreversible-retirement steps mirror registry rules. **ISO 14064-3** — the
beneficial-owner declaration (final claimant of the reduction) follows ISO validation/verification
requirements. **ICAO CORSIA** retirement requirements and **EU/UK ETS / California CaT / Article 6.4**
are surfaced as eligibility metadata; Article 6.4 A6.4ERs and corresponding-adjustment handling are
noted as emerging but not enforced in the workflow.

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