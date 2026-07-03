# Monte Carlo VaR
**Module ID:** `monte-carlo-var` · **Route:** `/monte-carlo-var` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monte Carlo simulation engine for climate risk Value at Risk (VaR) computation, modelling the distribution of portfolio losses under stochastic climate transition and physical risk scenarios. Supports full revaluation simulation with 10,000+ paths, tail risk analytics (CVaR/Expected Shortfall), and copula-based cross-asset correlation structures. Provides regulatory climate stress testing input for ICAAP and ORSA frameworks.

> **Business value:** Enables risk managers to quantify the distribution of climate-driven portfolio losses with statistical rigour, supporting ICAAP climate stress test requirements, capital buffer sizing, and investor climate risk disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `MonteCarloVarPage`, `SCENARIO_PARAMS`, `SECTOR_ALIASES`, `SECTOR_CORRELATIONS`, `SECTOR_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `diag` | `matrix[i][i] - sum;` |
| `clean` | `sector.replace(/\s+/g, '');` |
| `totalExposure` | `Object.values(sectorExposures).reduce((s, v) => s + v, 0) \|\| 1;` |
| `mean` | `params.means[idx] * horizon;` |
| `vol` | `params.vols[idx] * Math.sqrt(horizon);` |
| `sectorReturn` | `mean + vol * correlatedZ[idx];` |
| `sortedLosses` | `Array.from(portfolioLosses).sort((a, b) => b - a);` |
| `varAtLevel` | `(level) => sortedLosses[Math.floor(iterations * (1 - level))] \|\| 0;` |
| `tailCount95` | `Math.max(1, Math.floor(iterations * 0.05));` |
| `cvar95` | `sortedLosses.slice(0, tailCount95).reduce((s, v) => s + v, 0) / tailCount95;` |
| `meanLoss` | `sumLoss / iterations;` |
| `variance` | `sumSq / iterations - meanLoss * meanLoss;` |
| `stdLoss` | `Math.sqrt(Math.max(0, variance));` |
| `minLoss` | `sortedLosses[iterations - 1];` |
| `binWidth` | `(maxLoss - minLoss) / bins \|\| 1;` |
| `idx` | `Math.min(bins - 1, Math.max(0, Math.floor((portfolioLosses[i] - minLoss) / binWidth)));` |
| `sectorVarContrib` | `SECTOR_CORRELATIONS.sectors.map((sec, idx) => ({` |
| `sorted` | `[...tempArr].sort((a, b) => b - a);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/monte-carlo/health` | `monte_carlo_health` | api/v1/routes/monte_carlo.py |
| POST | `/api/v1/monte-carlo/run` | `run_monte_carlo` | api/v1/routes/monte_carlo.py |
| POST | `/api/v1/monte-carlo/quick` | `quick_scenario_comparison` | api/v1/routes/monte_carlo.py |

### 2.3 Engine `monte_carlo_engine` (services/monte_carlo_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PercentileResult.to_dict` |  |  |
| `AssetLevelResult.to_dict` |  |  |
| `_percentile_result` | arr | Build PercentileResult from a 1-D NumPy array. |
| `_gelman_rubin_rhat` | arr | Split-chain Gelman-Rubin R-hat diagnostic. |
| `_effective_n` | arr, max_lag | Geyer (1992) initial monotone sequence estimator for effective sample size. |
| `MonteCarloEngine._base_pd_adjustments` | assets, scenario, time_horizon | Compute deterministic climate-adjusted PDs (M,). |
| `MonteCarloEngine._vasicek_var` | pd_adj, lgd_adj, ead_adj, rho, quantile | Vasicek one-factor VaR across N simulations. |
| `MonteCarloEngine.run` | assets, scenario, time_horizon, uncertainty, compare_scenarios | Run Monte Carlo simulation for a portfolio of assets. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate VaR (95%, 1-yr, USD) | — | Monte Carlo simulation output | Maximum expected climate-driven portfolio loss not exceeded in 95% of simulated scenarios |
| CVaR/Expected Shortfall (95%) | — | Tail expectation of simulation distribution | Average loss in the worst 5% of simulated climate scenarios; more sensitive to tail risk than VaR |
| Simulation Paths | — | Configurable engine parameter | Number of Monte Carlo paths run; more paths reduce sampling error in tail estimates |
| Carbon Price Shock Contribution (%) | — | SHAP factor attribution | Share of total CVaR attributable to carbon price transition risk factor |
- **Portfolio position data** → Map positions to climate risk factor sensitivities; assign sector and geography → **Position-level risk factor loading matrix**
- **Climate risk factor model** → Generate correlated factor paths via Cholesky decomposition; apply to factor loadings → **Simulated loss distribution across all Monte Carlo paths**
- **NGFS scenario calibration data** → Align factor volatility and shock distributions to NGFS Disorderly / Hot House scenarios → **Scenario-conditioned simulation inputs for regulatory stress test submission**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/monte-carlo/health** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'engine', 'method', 'scenarios'], 'n_keys': 4}`

**POST /api/v1/monte-carlo/quick** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['success', 'time_horizon', 'n_assets', 'total_exposure', 'scenario_comparison'], 'n_keys': 5}`

**POST /api/v1/monte-carlo/run** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Monte Carlo Climate VaR
**Headline formula:** `CVaRα = E[L | L > VaRα]`
**Standards:** ['BCBS Climate-related Financial Risks Principles 2021', 'EIOPA Climate Change Stress Test Methodology 2022', 'ECB 2022 Climate Stress Test Scenarios', 'Glasserman Monte Carlo Methods in Financial Engineering 2003']

**Engine `monte_carlo_engine` — extracted transformation lines:**
```python
half = n // 2
w = (float(np.var(c1, ddof=1)) + float(np.var(c2, ddof=1))) / 2.0
b = (half / 1) * (float(np.mean(c1)) - float(np.mean(c2))) ** 2
var_est = ((half - 1) / half) * w + b / half
rhat = math.sqrt(var_est / w) if w > 0 else 1.0
x = arr - np.mean(arr)
ess = n / max(1.0 + 2 * rho_sum, 1.0)
VaR_i = EAD_i × LGD_i × Φ((Φ^{-1}(PD_i) - √ρ × Φ^{-1}(q)) / √(1-ρ))
pd_safe = np.clip(pd_adj, 1e-6, 1.0 - 1e-6)
var_portfolio = np.sum(ead_adj * lgd_adj * conditional_pd, axis=1)  # (N,)
lgd_adj = np.clip(lgds_base[np.newaxis, :] * lgd_mult, 0.0, 1.0)   # (N, M)
ead_adj = exposures[np.newaxis, :] * exp_mult                        # (N, M)
el_matrix    = ead_adj * pd_adj * lgd_adj                            # (N, M)
loss_rate     = np.where(total_ead_sim > 0, el_portfolio / total_ead_sim, 0.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).
**Shared engines (edits propagate!):** `monte_carlo_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `monte-carlo-climate` | engine:monte_carlo_engine, table:dataclasses |
| `monte-carlo-uncertainty-engine` | engine:monte_carlo_engine, table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |