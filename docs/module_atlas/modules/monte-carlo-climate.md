# Monte Carlo Climate Engine
**Module ID:** `monte-carlo-climate` · **Route:** `/monte-carlo-climate` · **Tier:** A (backend vertical) · **EP code:** EP-CH1 · **Sprint:** CH

## 1 · Overview
5,000-path Monte Carlo simulation across carbon price, GDP, energy price, and technology cost with tail risk analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CORR_LABELS`, `CORR_MATRIX`, `Card`, `NGFS_DIST`, `Pill`, `Ref`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `shock` | `boxMuller() * (dist.vol / 100) * corrAdj + (dist.mean / 100) / horizon;` |
| `var95` | `annualVals[Math.floor(nPaths * 0.05)];` |
| `var99` | `annualVals[Math.floor(nPaths * 0.01)];` |
| `cvar995` | `annualVals.slice(0, Math.floor(nPaths * 0.005)).reduce((s, v) => s + v, 0) / Math.floor(nPaths * 0.005);` |
| `vals` | `paths.map(p => p[y].value).sort((a, b) => a - b);` |
| `sim` | `useMemo(() => simulatePaths(Math.min(nPaths, 2000), horizon, dist, corrAdj), [nPaths, horizon, dist, corrAdj]);` |
| `min` | `sorted[0], max = sorted[sorted.length - 1];` |
| `step` | `(max - min) / bins;` |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CORR_LABELS`, `CORR_MATRIX`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Paths | — | Simulation | Monte Carlo sample size |
| VaR 99% | `Path quantile` | Model | 99th percentile loss |
| CVaR 99.5% | `Tail conditional mean` | Model | Average loss in worst 0.5% of scenarios |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/monte-carlo/health** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'engine', 'method', 'scenarios'], 'n_keys': 4}`

**POST /api/v1/monte-carlo/quick** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['success', 'time_horizon', 'n_assets', 'total_exposure', 'scenario_comparison'], 'n_keys': 5}`

**POST /api/v1/monte-carlo/run** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Correlated Monte Carlo simulation
**Headline formula:** `VaR(99%) = quantile(losses, 0.99) from 5000 Cholesky-correlated paths`
**Standards:** ['NGFS', 'IMF']

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
| `monte-carlo-uncertainty-engine` | engine:monte_carlo_engine, table:dataclasses |
| `monte-carlo-var` | engine:monte_carlo_engine, table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |