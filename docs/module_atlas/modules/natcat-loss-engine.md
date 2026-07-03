# NatCat Loss Engine
**Module ID:** `natcat-loss-engine` · **Route:** `/natcat-loss-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Probabilistic natural catastrophe loss modelling engine covering flood, windstorm, earthquake, wildfire, and tropical cyclone perils using industry-standard exceedance probability (EP) curve methodology. Computes average annual loss (AAL), probable maximum loss (PML), and return period loss estimates for property and infrastructure portfolios. Integrates RCP/SSP climate change factors to project loss escalation under warming scenarios.

> **Business value:** Enables insurers, reinsurers, and real asset managers to quantify, stress test, and disclose natural catastrophe loss exposure with climate change projection, supporting reinsurance structuring, Solvency II SCR computation, and TCFD physical risk quantification.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AAL_BY_PERIL`, `EP_DATA`, `Kpi`, `PERILS`, `PERIL_COLORS`, `PORTFOLIO_EXPOSURE`, `RADAR_DATA`, `REGIONS`, `SCENARIOS`, `SCENARIO_COMPARISON`, `SCENARIO_MULT`, `Section`, `Sel`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(d)}K` : `$${n.toFixed` |
| `pct` | `(n, d = 1) => `${(n * 100).toFixed(d)}%`;` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `EP_DATA` | `[1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000].map((rp, i) => ({` |
| `AAL_BY_PERIL` | `PERILS.map((p, i) => ({` |
| `PORTFOLIO_EXPOSURE` | `REGIONS.map((r, i) => ({` |
| `SCENARIO_COMPARISON` | `SCENARIOS.map((s, i) => ({` |
| `RADAR_DATA` | `PERILS.map((p, i) => ({` |
| `aal` | `Math.round(1820 * mult * 1e6);` |
| `pml100` | `Math.round(3100 * mult * 1e6);` |
| `pml250` | `Math.round(4600 * mult * 1e6);` |
| `pmlPct` | `((pml100 / (portfolioValue * 1e9)) * 100).toFixed(1);` |
| `epFiltered` | `EP_DATA.map(d => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EP_DATA`, `PERILS`, `REGIONS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average Annual Loss (USD) | — | EP curve integration | Long-run expected annual loss from natural catastrophe events per insured or exposure portfolio |
| PML 250-year (USD) | — | EP curve at T=250 return period | Loss expected to be exceeded once in 250 years; typical regulatory and reinsurance treaty reference point |
| Climate Change AAL Uplift (%) | — | RCP 8.5 climate factor application | Percentage increase in AAL under RCP 8.5 2050 climate change relative to current climate baseline |
| Coefficient of Variation (AAL) | — | Loss distribution moments | Ratio of standard deviation to mean of simulated annual losses; higher values indicate greater loss volatility |
- **Property exposure data (geocoded)** → Geocode to peril hazard grid; look up hazard intensity from regional hazard module → **Site-level hazard intensity distribution per peril**
- **Vulnerability function library** → Match construction type and occupancy to damage function; compute mean damage ratio per intensity → **Site-level loss ratio distribution for convolution with exposure**
- **EP curve aggregation engine** → Simulate 10,000 event loss table years; sort; build exceedance probability curve → **Portfolio EP curve, AAL, PML table, and return period loss estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** Probable Maximum Loss
**Headline formula:** `PMLᵀ = EP_curve⁻¹(1/T)`
**Standards:** ['AIR Worldwide Catastrophe Modelling Methodology', 'RMS Risk Modelling Platform Documentation', 'ISO 31010:2019 Risk Assessment Techniques', 'IPCC AR6 WG1 Extremes Assessment Chapter 11']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).