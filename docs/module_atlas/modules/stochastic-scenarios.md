# Stochastic Scenario Generator
**Module ID:** `stochastic-scenarios` · **Route:** `/stochastic-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Economic scenario generation (ESG) for stress testing. Correlated paths for interest rates, GDP, equity, credit spreads, and carbon prices using Vasicek and Cholesky correlated models.

> **Business value:** Stochastic economic scenarios are the foundation of Solvency II Internal Models, ORSA stress tests, pension liability valuations, and IFRS 17 insurance contract accounting. Climate scenarios add a new dimension of carbon price and physical hazard paths to the standard ESG framework.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ChartTooltip`, `DEFAULT_PARAMS`, `DIST_OPTIONS`, `SCENARIO_COUNTS`, `StochasticScenariosPage`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `carbonImpact` | `-(scenario.carbonPrice / 150 - 1) * 0.08;` |
| `tempImpact` | `-(scenario.temperature - 1.5) * 0.03;` |
| `techImpact` | `scenario.techBreakthrough * 0.04;` |
| `strandingImpact` | `-(scenario.stranding / 100) * 0.15;` |
| `physicalImpact` | `-(scenario.physicalDamage / 100) * 0.12;` |
| `scenario` | `{ id: i + 1 };` |
| `sigma2` | `Math.log(1 + Math.pow(config.vol / Math.max(config.mean, 0.001), 2));` |
| `logMean` | `Math.log(Math.max(config.mean, 0.001)) - 0.5 * sigma2;` |
| `sorted` | `[...arr].sort((a, b) => a - b);` |
| `idx` | `(p / 100) * (sorted.length - 1);` |
| `step` | `(mx - mn) / bins \|\| 1;` |
| `idx` | `Math.floor((v - mn) / step);` |
| `projectedImpacts` | `scenarios.map(s => {` |
| `annualized` | `s.portfolioImpact * t;` |
| `vals` | `scenarios.map(s => s[k]);` |
| `impactVals` | `scenarios.map(s => s.portfolioImpact);` |
| `csv` | `[headers.join(','), ...data.map(r => headers.map(h => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIST_OPTIONS`, `SCENARIO_COUNTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Path Count | — | Configurable | Monte Carlo sample size |
| Variables | — | ESG | IR, GDP, equity, credit, FX, carbon |
| Horizon | — | Projection | Long-horizon for insurance/pension use cases |
- **Historical financial data** → Model calibration → **ESG parameters**
- **Cholesky correlation matrix** → Correlated path generation → **1000+ stochastic scenarios**
- **Stochastic scenarios** → Risk metric calculation → **VaR, CVaR, SCR**

## 5 · Intermediate Transformation Logic
**Methodology:** Correlated stochastic ESG
**Headline formula:** `dX = κ(θ-X)dt + σdW; Correlated paths via Cholesky L decomposition of Σ`
**Standards:** ['Vasicek (1977)', 'Black-Karasinski', 'Wilkie ESG']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).