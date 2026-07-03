# Energy Transition Commodity Risk
**Module ID:** `et-commodity-risk` · **Route:** `/et-commodity-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses price risk and supply security risk for critical minerals and energy commodities essential to the low-carbon transition, including lithium, cobalt, copper, nickel, rare earths, and green hydrogen. Integrates supply concentration metrics, demand projection models, and commodity price scenario analysis under IEA NZE and Stated Policies pathways. Supports portfolio stress testing, supply chain due diligence, and transition risk financial modelling.

> **Business value:** Equips portfolio managers and risk teams with a systematic framework for quantifying critical mineral supply risk, running transition commodity stress tests, and engaging with investee companies on supply chain resilience strategies essential for the energy transition.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEMAND_SURGE`, `Kpi`, `MINERALS_LIST`, `PORTFOLIO`, `PRICE_SCENARIOS`, `REVENUE_AT_RISK`, `SCENARIOS`, `SCENARIO_COLORS`, `SECTOR_EXPOSURE`, `SUPPLY_CHAIN_RISK`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `(n, d = 1) => isFinite(+n) ? `${parseFloat(n).toFixed(d)}%` : '—%';` |
| `usd` | `(n, d = 1) => isFinite(+n) ? `$${parseFloat(n).toFixed(d)}B` : '$—B';` |
| `li_exp` | `Math.round(sr(i * 5)  * 35);` |
| `co_exp` | `Math.round(sr(i * 7)  * 20);` |
| `ni_exp` | `Math.round(sr(i * 9)  * 25);` |
| `cu_exp` | `Math.round(sr(i * 11) * 30);` |
| `ree_exp` | `Math.round(sr(i * 13) * 15);` |
| `total_exp` | `Math.round((li_exp + co_exp + ni_exp + cu_exp + ree_exp) / 5);` |
| `scenario_risk` | `Math.round(20 + sr(i * 17) * 60);` |
| `DEMAND_SURGE` | `MINERALS_LIST.map((m, mi) => {` |
| `PRICE_SCENARIOS` | `MINERALS_LIST.map((m, mi) => ({` |
| `SECTOR_EXPOSURE` | `['EV OEMs', 'Battery Mfg', 'Renewables', 'Grid Infra', 'Mining', 'Chemical Processing', 'Utilities', 'Oil & Gas Transition'].map((s, i) => ({` |
| `totalWeight` | `PORTFOLIO.reduce((a, p) => a + p.weight, 0);` |
| `avgMineralExp` | `totalWeight > 0 ? (PORTFOLIO.reduce((a, p) => a + p.total_mineral_exposure * p.weight, 0) / totalWeight).toFixed(1) : '0.0';` |
| `avgRevRisk` | `totalWeight > 0 ? (PORTFOLIO.reduce((a, p) => a + p.revenue_at_risk_pct * p.weight, 0) / totalWeight).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MINERALS_LIST`, `REVENUE_AT_RISK`, `SCENARIOS`, `SECTOR_EXPOSURE`, `SUPPLY_CHAIN_RISK`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Supply Concentration (HHI) | — | USGS / IEA | Herfindahl index of mine production by country; cobalt (DRC >70%) and rare earths (China >60%) score near 10,0 |
| Demand-Supply Gap (% by 2030) | — | IEA Critical Minerals 2024 | Projected percentage demand exceeding supply under NZE scenario by 2030; positive gap flags supply security ri |
| Price Volatility (σ annualised %) | — | LME/CME Price Data | Annualised realised price volatility; lithium carbonate 2022 volatility exceeded 80%, creating severe input co |
| Portfolio Critical Mineral Exposure ($M) | — | Supply Chain Mapping | Financial exposure to critical mineral price risk in portfolio companies' input cost structures; primary stres |
- **USGS and IEA production data by mine and country** → Compute HHI by mineral and production stage (mining vs. refining vs. processing); identify bottleneck stages → **Supply concentration score by mineral and processing stage**
- **IEA NZE and STEPS demand projections by technology** → Sum mineral requirements across solar, wind, EV, grid storage, and hydrogen technologies; compare to production forecasts → **Demand-supply gap by scenario and mineral (2025â€“2040)**
- **LME/CME commodity price history** → Compute realised volatility at 1-year and 3-year windows; calibrate price stress scenarios for input cost modelling → **Price volatility surface and stress scenarios by commodity**

## 5 · Intermediate Transformation Logic
**Methodology:** Commodity Transition Risk Score
**Headline formula:** `CTR = w_c × Concentration + w_d × DemandPressure + w_p × PriceVolatility + w_s × SubstitutionDifficulty`
**Standards:** ['IEA Critical Minerals Market Review 2024', 'World Bank Minerals for Climate Action 2023', 'BloombergNEF Critical Minerals Outlook 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).