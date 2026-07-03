# Carbon Certificate Management
**Module ID:** `cc-certificate-mgmt` · **Route:** `/cc-certificate-mgmt` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
End-to-end lifecycle management for verified carbon certificates: issuance, transfer, retirement, and cancellation workflows across Verra VCS, Gold Standard, and CAR registries. Tracks serial numbers, vintage years, and beneficial ownership chains.

> **Business value:** Certificate lifecycle tracked from issuance through retirement. Retired serials permanently locked; audit trail immutable.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_ENTRIES`, `BATCHES`, `Badge`, `CREDITS`, `CREDIT_STATUSES`, `DualInput`, `Kpi`, `METHODOLOGIES`, `PROJECT_NAMES`, `REGISTRIES`, `REG_COLORS`, `STATUS_COLORS`, `Section`, `TRANSFERS`, `TabBar`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => { if (n == null \|\| !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >=` |
| `METHODOLOGIES` | `['VM0015 (REDD+)', 'VM0006 (Biomass)', 'GS Cookstove', 'Puro Biochar', 'VM0042 (Blue Carbon)', 'ACM0002 (Grid RE)', 'AMS-I.E (Solar)', 'Iso CDR-001'];` |
| `qty` | `Math.round(5000 + sr(i * 7) * 95000);` |
| `bCredits` | `CREDITS.filter(c => c.batch_id === `BATCH-${String.fromCharCode(65 + i)}1` \|\| c.batch_id === `BATCH-${String.fromCharCode(65 + i)}2`);` |
| `totalAvailable` | `useMemo(() => CREDITS.filter(c => c.status === 'Available').reduce((a, c) => a + c.quantity, 0), []);` |
| `totalReserved` | `useMemo(() => CREDITS.filter(c => c.status === 'Reserved').reduce((a, c) => a + c.quantity, 0), []);` |
| `totalRetired` | `useMemo(() => CREDITS.filter(c => c.status === 'Retired').reduce((a, c) => a + c.quantity, 0), []);` |
| `totalValue` | `useMemo(() => CREDITS.reduce((a, c) => a + c.quantity * c.price, 0), []);` |
| `vintageData` | `useMemo(() => VINTAGES.map((yr, i) => {` |
| `agingAnalysis` | `useMemo(() => VINTAGES.map((yr, i) => {` |
| `age` | `2024 - yr;` |
| `inventoryByRegistry` | `useMemo(() => REGISTRIES.map((r, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_STATUSES`, `METHODOLOGIES`, `PROJECT_NAMES`, `REGISTRIES`, `REG_COLORS`, `TABS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Certificate Serial | `Registry-id – Project – Vintage – Seq` | Registry API | Unique identifier preventing double-counting across registries |
| Vintage Year | `Project verification period` | Registry records | Year in which emission reductions or removals occurred |
| Retirement Purpose | `Beneficial owner declaration` | ISO 14064-3 | Stated end-use governs registry retirement category |
| Transfer Chain | `Ledger audit trail` | Registry logs | Number of ownership transfers from issuance to final retirement |
- **Registry API** → Serial issuance data → certificate ledger → **Live certificate positions**
- **Verification reports** → Audit documents → certificate attributes → **Vintage and project metadata**

## 5 · Intermediate Transformation Logic
**Methodology:** Certificate lifecycle state machine with audit ledger
**Headline formula:** `CertState ∈ {Issued, Reserved, Transferred, Retired, Cancelled}`
**Standards:** ['Verra VCS Registry', 'Gold Standard Registry', 'Climate Action Reserve', 'ISO 14064-3']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).