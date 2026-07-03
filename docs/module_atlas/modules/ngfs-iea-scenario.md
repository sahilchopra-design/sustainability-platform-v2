# NGFS/IEA Scenario Analytics
**Module ID:** `ngfs-iea-scenario` · **Route:** `/ngfs-iea-scenario` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates NGFS climate scenarios with IEA Net Zero energy pathway data to provide a comprehensive macroeconomic and sectoral transition risk framework for financial analysis.

> **Business value:** Provides banks, asset managers, and supervisors with a harmonised view of NGFS and IEA scenario data to support rigorous, internally consistent transition risk assessments across investment and lending portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CP_DATA`, `CP_YEARS`, `ENSEMBLE_METHODS`, `IPCC_CATS`, `PROVIDERS`, `PROVIDER_COLOR`, `RISK_COLOR`, `SCENARIOS`, `VARIABLES`, `VAR_DATA`, `VAR_YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `15 + sc.code.length * 2;` |
| `CP_DATA` | `CP_YEARS.map(yr => {` |
| `VAR_DATA` | `(varKey) => VAR_YEARS.map((yr, i) => {` |
| `raw` | `SCENARIOS.map(s => Math.exp(-0.5*Math.pow((s.temp - targetTemp)/sigma, 2)));` |
| `sum` | `Math.max(1e-10, raw.reduce((a,b)=>a+b,0)); // floor guard: prevents NaN/Infinity if targetTemp far from all scenario temps` |
| `raw` | `SCENARIOS.map((_, i) => 0.02 + sr(i * 77 + method.length) * 0.15);` |
| `sum` | `raw.reduce((a,b)=>a+b,0);` |
| `RISK_COLOR` | `{ 'Low': T.green, 'Low-Med': '#65a30d', 'Med': T.teal, 'High': T.amber, 'V.High': T.red, 'None': T.slate };` |
| `ensembleWeightData` | `SCENARIOS.slice(0, 8).map((sc, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CP_YEARS`, `ENSEMBLE_METHODS`, `IPCC_CATS`, `PROVIDERS`, `SCENARIOS`, `VAR_YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Scenarios Available | — | NGFS 2023 | Six canonical scenarios from Net Zero 2050 (orderly) to Current Policies (hot house world), each with GDP, inf |
| IEA NZE Carbon Price 2030 | — | IEA WEO 2023 | Carbon price required in advanced economies by 2030 on the IEA Net Zero Emissions by 2050 pathway. |
- **NGFS scenario data portal, IEA WEO data download, IPCC AR6 scenario explorer** → Scenario reconciliation, variable path interpolation, sector risk computation → **Integrated scenario dashboards, sector transition trajectories, portfolio stress outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated Transition Risk Score
**Headline formula:** `ITRS = w₁×NGFSMacroImpact + w₂×IEAEnergyShift + w₃×PolicyCarbonPrice`
**Standards:** ['NGFS Phase IV 2023', 'IEA WEO 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).