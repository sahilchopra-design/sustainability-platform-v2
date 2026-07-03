# Carbon Registry Hub
**Module ID:** `cc-registry-hub` · **Route:** `/cc-registry-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Unified interface for carbon credit registry operations across Verra VCS, Gold Standard, Climate Action Reserve, ACR, and CDM. Provides account management, serial number tracking, cross-registry deduplication, and CORSIA eligibility screening.

> **Business value:** Registry Hub provides single-pane view of credits across 5 registries. CORSIA eligibility requires vintage ≥2016 and approved programme. Cross-registry deduplication prevents double-counting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API_STATUS`, `Badge`, `ERROR_LOG`, `GS_WORKFLOW`, `Kpi`, `METHODOLOGIES`, `PROJECTS`, `PURO_WORKFLOW`, `REGISTRIES`, `REGISTRY_DETAILS`, `Section`, `TabBar`, `VERRA_WORKFLOW`, `WorkflowTable`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => { if (n == null \|\| !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >=` |
| `REGISTRY_DETAILS` | `REGISTRIES.map((r, i) => ({` |
| `API_STATUS` | `REGISTRIES.map((r, i) => ({` |
| `TABS` | `['Registry Overview', 'Verra VCS Panel', 'Gold Standard Panel', 'Puro & Isometric Panel', 'Cross-Registry Analytics', 'API Health & Sync'];` |
| `totalIssued` | `useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.issued_total, 0), []);` |
| `totalRetired` | `useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.retired_total, 0), []);` |
| `totalProjects` | `useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.active_projects, 0), []);` |
| `portfolioByRegistry` | `useMemo(() => REGISTRY_DETAILS.map(r => ({` |
| `methodologyCoverage` | `useMemo(() => METHODOLOGIES.slice(0, 8).map((m, i) => ({` |
| `feeComparison` | `useMemo(() => REGISTRY_DETAILS.map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GS_WORKFLOW`, `METHODOLOGIES`, `PURO_WORKFLOW`, `REGISTRIES`, `TABS`, `VERRA_WORKFLOW`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Account Balance | `Registry API query` | Registry system | Current available credits in each registry account by project and vintage |
| CORSIA Eligible % | `Eligible credits / total × 100` | ICAO CORSIA list | Share of portfolio meeting CORSIA aviation offset criteria |
| Cross-Registry Duplicates | `Serial intersection across registries` | Deduplication engine | Credits appearing in more than one registry (should be zero) |
| Pending Retirements | `Reserved but not yet retired` | Registry queue | Volume in reservation status awaiting retirement instruction |
- **Registry APIs** → Account positions → unified balance → **Cross-registry portfolio view**
- **CORSIA approved list** → Programme eligibility → CORSIA flag → **Aviation-eligible credit volume**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-registry serial deduplication and CORSIA eligibility matrix
**Headline formula:** `DuplicateFlag = serial_i ∈ RegistrySet_j (j ≠ registry_i); CORSIAEligible = vintage ≥ 2016 AND standard ∈ CORSIAApprovedList`
**Standards:** ['ICAO CORSIA Eligible Fuels & Credits', 'Verra Registry Procedures', 'Gold Standard Registry Rules', 'CDM Registry Manual']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).