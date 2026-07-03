# Monte Carlo Uncertainty Engine
**Module ID:** `monte-carlo-uncertainty-engine` · **Route:** `/monte-carlo-uncertainty-engine` · **Tier:** A (backend vertical) · **EP code:** EP-DQ3 · **Sprint:** DQ

## 1 · Overview
Implements GUM JCGM 100:2008 and Monte Carlo JCGM 101:2008 uncertainty quantification for carbon credit projects. Calculates combined standard uncertainty, expanded uncertainty (k=2, 95%), and probabilistic emission reduction distributions for CDM EB65 Annex 29 compliance.

> **Business value:** Required for all CDM and VCS projects undergoing third-party verification (VVB). Provides JCGM 100/101-grade uncertainty analysis with EB65 deduction table application — the primary mechanism by which CDM EB protects credit integrity.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `METHODOLOGIES`, `PARAM_NAMES`, `PARAM_UNITS`, `PARAM_WEIGHTS`, `PROJECTS`, `REGISTRIES`, `SECTORS`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `Tab7`, `Tab8`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['ACM0002','AMS-I.D','VM0007','VM0015','VM0042','ACM0006','AMS-III.D','VM0011','GS-METH-COOK','ACM0001','VM0017','AMS-II.G','VM0021','GS-METH-WIND','A` |
| `PARAM_UNITS` | `['MWh/yr','tCO₂/MWh','tCO₂e/yr','tCO₂e/yr','tCO₂e/yr'];` |
| `PARAM_WEIGHTS` | `[0.40, 0.35, 0.10, 0.05, 0.10]; // importance for DQ weighting` |
| `SECTORS` | `['Solar','Wind','Cookstove','REDD+','Biogas','Landfill','Hydro','Reforestation','Methane','EE Buildings'];` |
| `baseER` | `Math.round(5000 + sr(i * 13) * 95000);` |
| `params` | `PARAM_NAMES.map((name, p) => {` |
| `val` | `1000 + sr(i * 7  + p) * 50000;` |
| `u_pct` | `2    + sr(i * 11 + p) * 22;          // uncertainty %` |
| `c_i` | `0.5  + sr(i * 17 + p) * 1.5;         // sensitivity coefficient` |
| `u_c_sq` | `params.reduce((acc, p) => acc + Math.pow(p.sensitivity * (p.u_pct / 100), 2), 0);` |
| `u_c` | `Math.sqrt(u_c_sq) * 100; // as percentage` |
| `U_95` | `2 * u_c;                 // k=2` |
| `net` | `Math.round(baseER * (1 - discount / 100));` |
| `sigma` | `baseER * (u_c / 100) / 2;` |
| `P50` | `Math.round(baseER - 0.05  * sigma);` |
| `P95` | `Math.round(baseER + 1.645 * sigma);` |
| `dqScores` | `params.map((_, p) => 1 + sr(i * 23 + p) * 4);` |
| `avgUc` | `projects.length ? projects.reduce((a, p) => a + p.u_c, 0) / projects.length : 0;` |

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
**Frontend seed datasets:** `ASSURANCE`, `COUNTRIES`, `DISC_TABLE`, `DQ_LEVELS`, `EVIDENCE`, `METHODOLOGIES`, `PARAM_NAMES`, `PARAM_UNITS`, `PARAM_WEIGHTS`, `REGISTRIES`, `SAMPLING`, `SCOPES`, `SECTORS`, `TABS`, `UPGRADE_ACTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDM Uncertainty Deduction Table | — | CDM EB65 Annex 29 para 12 | EB65 uncertainty deduction: U<10%→0%, U<20%→3%, U<30%→5%, U<50%→10%, U≥50%→project ineligible |
| Typical CDM Project Uncertainty | — | CDM EB 2022 Analysis | Most CDM projects achieve ±8–18% expanded uncertainty (k=2) — measurement and activity data dominant sources |
| MC Simulation Convergence | — | JCGM 101:2008 §5.9 | JCGM 101 recommends ≥10,000 Monte Carlo trials for 95% CI convergence |
- **Measurement equipment calibration records** → Uncertainty type A/B classification → **Standard uncertainty by source with sensitivity coefficients**
- **Activity data time series (metered or estimated)** → Uncertainty propagation → **Combined standard uncertainty u_c for total ER**
- **CDM EB65 deduction table parameters** → ER adjustment → **Verified emission reduction after uncertainty deduction**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/monte-carlo/health** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'engine', 'method', 'scenarios'], 'n_keys': 4}`

**POST /api/v1/monte-carlo/quick** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['success', 'time_horizon', 'n_assets', 'total_exposure', 'scenario_comparison'], 'n_keys': 5}`

**POST /api/v1/monte-carlo/run** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** GUM Combined Uncertainty
**Headline formula:** `u_c(y) = √[Σ(∂f/∂xᵢ)² × u²(xᵢ) + 2Σᵢ<ⱼ(∂f/∂xᵢ)(∂f/∂xⱼ)u(xᵢ,xⱼ)]; U = k × u_c (k=2 for 95% CI)`
**Standards:** ['GUM JCGM 100:2008 — Guide to the Expression of Uncertainty in Measurement', 'JCGM 101:2008 — Supplement 1 to GUM (Monte Carlo)', 'CDM EB65 Annex 29 — Uncertainty Assessment Procedure', 'ISO 14064-3:2019 §6.7 — Uncertainty in GHG Statements']

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
| `monte-carlo-var` | engine:monte_carlo_engine, table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |