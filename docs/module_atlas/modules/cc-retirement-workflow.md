# Carbon Credit Retirement Workflow
**Module ID:** `cc-retirement-workflow` · **Route:** `/cc-retirement-workflow` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Structured retirement workflow engine for carbon credits including retirement purpose selection, beneficial owner declaration, registry instruction generation, and retirement certificate creation. Supports compliance, voluntary, and CORSIA retirement categories.

> **Business value:** Retirement workflow completes in 4 steps: purpose declaration → registry instruction → confirmation → certificate. Immutable audit log appended at confirmation; no reversal possible post-registry confirmation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENEFICIARIES`, `Badge`, `COMPLIANCE_FRAMEWORKS`, `DualInput`, `Kpi`, `PIPELINE_STAGES`, `PROJECT_NAMES`, `PURPOSE_TYPES`, `REGISTRIES`, `REG_COLORS`, `STATUSES`, `STATUS_COLORS`, `Section`, `TRANSACTIONS`, `TabBar`, `WIZARD_STEPS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => { if (n == null \|\| !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >=` |
| `pipelineData` | `useMemo(() => PIPELINE_STAGES.map((stage, i) => ({` |
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
**Standards:** ['Verra VCS Retirement Procedures', 'Gold Standard Retirement Rules', 'ISO 14064-3', 'CORSIA Retirement Requirements']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).