# DME Scenarios
**Module ID:** `dme-scenarios` · **Route:** `/dme-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scenario-based materiality evolution projections showing how ESG topic scores are expected to change under different macro, policy, and physical climate futures. Integrates NGFS, IEA, and IPCC scenario pathways with DME topic drivers to produce forward materiality trajectories. Scenario comparison highlights which topics diverge most between pathways.

> **Business value:** Equips strategy and risk teams with a forward-looking view of how ESG materiality will evolve under different macro scenarios, supporting resilient strategy design and TCFD scenario analysis disclosure requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CATEGORY_COLORS`, `KpiCard`, `LS_PORTFOLIO`, `NGFS_SCENARIOS`, `SECTOR_PATHWAYS`, `SectionHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(v, d = 1) => v == null ? '—' : typeof v === 'number' ? (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(1` |
| `exposureFactor` | `fossilRevPct * carbonIntensity * carbonPrice / 1e6;` |
| `pdDelta` | `scenarioPD - basePD;` |
| `exposure` | `(c.market_cap_usd_mn \|\| 500) * (0.01 + sr(h, 1) * 0.04);` |
| `basePD` | `0.005 + sr(h, 2) * 0.04;` |
| `baseWACC` | `0.06 + sr(h, 3) * 0.06;` |
| `physExposure` | `0.1 + sr(h, 4) * 0.6;` |
| `transExposure` | `0.1 + sr(h, 5) * 0.7;` |
| `fossilRevPct` | `c.sector === 'Energy' ? 0.4 + sr(h, 6) * 0.5 : c.sector === 'Utilities' ? 0.2 + sr(h, 6) * 0.4 : sr(h, 6) * 0.15;` |
| `carbonIntensity` | `(c.ghg_intensity_tco2e_per_mn \|\| 200 + sr(h, 7) * 800);` |
| `timeH` | `(horizon - 2025) / 5;` |
| `entityResults` | `targetHoldings.map(h => {` |
| `sectorMult` | `1 + sp.carbon_price_sensitivity * (carbonPrice / 100);` |
| `strandProb` | `strandedAssetProbability(h.fossilRevPct, carbonPrice, h.carbonIntensity / 1000, timeH);` |
| `timeH` | `(yr - 2025) / 5;` |
| `sectorMult` | `1 + sp.carbon_price_sensitivity * (carbonPrice / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scenario Set | — | NGFS scenario library | Number and source of macro-climate scenarios used as inputs to materiality evolution modelling |
| Highest Divergence Topic | — | Scenario comparison engine | Topic with the largest materiality score difference between the most and least stringent scenarios |
| Portfolio Avg Materiality (2030, NZ2050) | — | DME scenario projection | Projected exposure-weighted portfolio materiality score in 2030 under Net Zero 2050 scenario |
| Portfolio Avg Materiality (2030, HHW) | — | DME scenario projection | Projected portfolio materiality score in 2030 under Hot House World (3°C+) scenario |
- **NGFS/IEA/IPCC scenario parameter sets (policy, physical, technology)** → Topic driver mapping: which scenario parameters affect which DME topic scores → **Topic-scenario sensitivity matrix**
- **DME current materiality scores (baseline)** → Forward projection using scenario parameter trajectories and topic driver sensitivities → **Materiality score time series per topic per scenario to 2050**
- **Scenario comparison engine** → Cross-scenario materiality divergence calculation → **Divergence heatmap and ranking of topics by scenario sensitivity**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario Materiality Shift
**Headline formula:** `SMSₛᵢ = EMSᵢᵀ − EMSᵢ₀ = f(Policyₛ, Physicalₛ, Technologyₛ)`
**Standards:** ['NGFS Scenarios 2023', 'IPCC AR6 SSP Pathways', 'TCFD Scenario Analysis Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).