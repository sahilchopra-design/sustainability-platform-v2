# Stranded Asset Analyzer
**Module ID:** `stranded-asset-analyzer` · **Route:** `/stranded-asset-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-CA2 · **Sprint:** CA

## 1 · Overview
Stranded asset write-down schedule with exponential decay model, residual value curves using half-life decay, 8-sector stranded asset matrix, and remediation pathways for converting stranded assets to productive use.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `SCENARIOS`, `SCENARIO_COLORS`, `SCENARIO_KEYS`, `SCENARIO_NGFS_KEY`, `SECTORS`, `SECTOR_HAZARD`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `strandedPct` | `sector[`stranded_pct_${sk}`] / 100;` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `progress` | `(yr - start) / Math.max(1, end - start);` |
| `strandedPct` | `sector[`stranded_pct_${sk}`] / 100;` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `halfLife` | `Math.max(1, (sector.full_stranded - sector.write_down_start) / 2);` |
| `TABS` | `['Sector Overview', 'Write-Down Schedule', 'Residual Value Curves', 'Bubble Map', 'Remediation Pathways', 'Default Risk Model'];` |
| `totalAum` | `SECTORS.reduce((s, x) => s + x.aum, 0);` |
| `totalStranded` | `SECTORS.reduce((s, x) => s + x.aum * x[`stranded_pct_${sk}`] / 100, 0);` |
| `totalCapex` | `SECTORS.reduce((s, x) => s + x.capex_locked, 0);` |
| `avgStranded` | `totalAum > 0 ? (totalStranded / totalAum) * 100 : 0;` |
| `bubbleData` | `SECTORS.map(s => ({` |
| `allScenarioData` | `SCENARIOS.map((sc, i) => ({` |
| `years` | `Array.from({ length: 27 }, (_, i) => 2024 + i);` |
| `total` | `SECTORS.reduce((acc, s) => {` |
| `strandedVal` | `s.aum * spct / 100;` |
| `pd10` | `(1 - surv10) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SCENARIOS`, `SCENARIO_COLORS`, `SECTORS`, `SECTOR_HAZARD`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Stranded % | `Sector × Scenario matrix` | Carbon Tracker | Percentage of sector assets at risk of stranding under given scenario |
| Write-Down Half-Life | `Sector-specific` | Model calibration | Time for residual value to decline by 50% |
| Remediation IRR | `Conversion CapEx model` | Sector studies | Internal rate of return on converting stranded assets to green use |

## 5 · Intermediate Transformation Logic
**Methodology:** Exponential decay write-down model
**Headline formula:** `WriteDown(t) = InitialValue × StrandedPct × (1 - exp(-λ·t))`
**Standards:** ['Carbon Tracker', 'IAS 36', 'NGFS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).