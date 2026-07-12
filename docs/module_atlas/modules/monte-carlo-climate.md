# Monte Carlo Climate Engine
**Module ID:** `monte-carlo-climate` · **Route:** `/monte-carlo-climate` · **Tier:** A (backend vertical) · **EP code:** EP-CH1 · **Sprint:** CH

## 1 · Overview
5,000-path Monte Carlo simulation across carbon price, GDP, energy price, and technology cost with tail risk analysis.

**How an analyst works this module:**
- Configure path count (1000-10000), distribution, and correlation
- Fan Chart shows confidence bands over 30-year horizon
- Tail Risk tab shows VaR/CVaR at multiple confidence levels
- Path Explorer lets you examine individual simulation paths

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
| `sensitivityData` | `useMemo(() => { return [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(mult => { const s = simulatePaths(500, horizon, { ...dist, vol: dist.vol * mult }, corrAdj);` |

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
| `_gelman_rubin_rhat` | arr | Split-chain Gelman-Rubin R-hat diagnostic. Values < 1.1 indicate convergence; < 1.05 is ideal. |
| `_effective_n` | arr, max_lag | Geyer (1992) initial monotone sequence estimator for effective sample size. |
| `MonteCarloEngine._base_pd_adjustments` | assets, scenario, time_horizon | Compute deterministic climate-adjusted PDs (M,). |
| `MonteCarloEngine._vasicek_var` | pd_adj, lgd_adj, ead_adj, rho, quantile | Vasicek one-factor VaR across N simulations. Inputs shapes: pd_adj (N,M), lgd_adj (N,M), ead_adj (N,M). Returns VaR (N,). VaR_i = EAD_i × LGD_i × Φ((Φ^{-1}(PD_i) - √ρ × Φ^{-1}(q)) / √(1-ρ)) Portfolio VaR = sum_i VaR_i (asset independence across idiosyncratic) |
| `MonteCarloEngine.run` | assets, scenario, time_horizon, uncertainty, compare_scenarios | Run Monte Carlo simulation for a portfolio of assets. Args: assets: Portfolio of AssetInput objects. scenario: Primary NGFS scenario: "Orderly" / "Disorderly" / "Hot house world". time_horizon: Target year: 2030 / 2040 / 2050. uncertainty: UncertaintyParams (defaults if None). compare_scenarios:Whether to include cross-scenario comparison table. Returns: MonteCarloResult with full distribution out |

**Engine `monte_carlo_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `NGFS_SCENARIOS` | `['Orderly', 'Disorderly', 'Hot house world']` |

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

Four correlated random variables drawn via Cholesky decomposition. Fan chart shows p5/p25/p50/p75/p95 bands. Tail risk: VaR(95%), VaR(99%), CVaR(99.5%), Expected Shortfall. Distribution options: Normal, Student-t, GEV.

**Standards:** ['NGFS', 'IMF']
**Reference documents:** NGFS Phase 5 Distribution Parameters; IMF GDP Shock Distributions

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
w = ead_adj / np.where(total_ead_sim[:, np.newaxis] > 0,
hhi = np.sum(w ** 2, axis=1)                                         # (N,)
el_sc  = float(np.sum(exposures * pd_sc * lgds_base))
cf_sc  = float(np.sum(exposures * ei) * cp_sc / 1000.0)
waci_sc = float(np.sum(exposures * ei) / total_exp if total_exp > 0 else 0)
pd_safe_sc  = np.clip(pd_sc, 1e-6, 1.0 - 1e-6)
var_sc = float(np.sum(exposures * lgds_base * cond_pd_sc))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **9** other module(s).
**Shared engines (edits propagate!):** `monte_carlo_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `monte-carlo-uncertainty-engine` | engine:monte_carlo_engine, table:dataclasses |
| `monte-carlo-var` | engine:monte_carlo_engine, table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide states "Four correlated random variables
> drawn via Cholesky decomposition" over carbon price, GDP, energy price, and technology cost. **The
> page simulates only ONE variable at a time** (whichever is selected in the `variable` dropdown);
> the 4×4 `CORR_MATRIX` is displayed as a static reference table on the Correlation Matrix tab but is
> never Cholesky-decomposed or applied to jointly simulate the four variables — cross-variable
> correlation is instead approximated by a single manual `corrAdj` scalar (0.5×–2.0×) that uniformly
> scales the volatility term. Everything else — the Box-Muller transform, percentile-based VaR/CVaR/
> ES, the fan chart, and the sensitivity sweep — is genuinely and correctly implemented. This module
> does NOT call the backend `monte_carlo_engine.py` (a separately real, Vasicek/NGFS-calibrated
> engine — see `monte-carlo-var.md` for where that backend's true JS counterpart lives).

### 7.1 What the module computes

A single-variable, multi-path random walk with drift, using a deterministic Box-Muller transform
seeded by the platform's `sr()` PRNG:

```js
boxMuller() = sqrt(-2·ln(u1)) · cos(2π·u2)                    // u1,u2 from sequential sr() draws
shock  = boxMuller() × (dist.vol/100) × corrAdj + (dist.mean/100)/horizon
cumReturn += shock                                              // per year, accumulated over `horizon`
annualVals = [cumReturn×100 for each of nPaths simulated paths], sorted ascending

var95   = annualVals[floor(nPaths×0.05)]
var99   = annualVals[floor(nPaths×0.01)]
cvar995 = mean(annualVals[0 : floor(nPaths×0.005)])            // average of worst 0.5% outcomes
es      = mean(annualVals[0 : floor(nPaths×0.05)])             // average of worst 5% (Expected Shortfall)
```

### 7.2 Parameterisation

| Variable | Mean / Vol / Skew | Provenance |
|---|---|---|
| Carbon Price | 85 / 42 / +0.35 | Labelled "NGFS Phase 5 Distributions" in the guide; plausible order-of-magnitude for a 2050 carbon-price endpoint but not traceable to a specific NGFS scenario output table in this file |
| GDP Shock | −2.1 / 3.8 / −0.6 | Negative skew (left-tail risk) is a reasonable qualitative choice for climate-transition GDP shocks |
| Energy Price Change | 18 / 28 / +0.45 | Illustrative |
| Tech Cost Reduction | −35 / 15 / −0.25 | Illustrative — negative mean encodes expected cost decline |
| `CORR_MATRIX` (4×4) | e.g. Carbon×GDP = −0.42, Carbon×Energy = +0.65 | Directionally sensible signs (carbon price up ↔ GDP down; carbon price up ↔ energy price up) but **never consumed by the simulation** |
| `corrAdj` slider | 0.5×–2.0×, manual | Stand-in for the correlation matrix's effect — a single scalar cannot reproduce a 4-variable correlation structure |

Note: `skew` is defined per variable but never referenced anywhere in `simulatePaths` — the
Box-Muller draw is symmetric (standard normal), so the stated skew parameters have no effect on the
simulated distribution despite being displayed as if they shape it.

### 7.3 Calculation walkthrough

1. **Simulation Dashboard** — `sim = simulatePaths(min(nPaths,2000), horizon, dist, corrAdj)`; note
   the page silently **caps simulated paths at 2,000** even if the user sets `nPaths` higher (e.g. the
   default 5,000 shown in the header `Pill` is the *requested* count, not necessarily the *simulated*
   count).
2. **Fan Chart** — `buildFanChart` computes p5/p25/p50/p75/p95 at each year across all simulated
   paths — genuine cross-path percentile banding.
3. **Tail Risk Analysis** — 50-bin histogram of `annualVals`, with bins left of `var95` flagged
   `isLeftTail` for red-shading.
4. **Correlation Matrix tab** — renders `CORR_MATRIX` as a static heat-table; informational only, per
   §7.1.
5. **Parameter Sensitivity** — re-runs `simulatePaths(500, horizon, {...dist, vol: dist.vol×mult},
   corrAdj)` for 7 volatility multipliers (50%–200%), producing a genuine sensitivity table of how
   VaR95/VaR99/ES scale with volatility.
6. **Path Explorer** — renders the first 20 of the simulated paths as line traces.

### 7.4 Worked example

For `variable='carbon_price'` (mean=85, vol=42), `horizon=30`, `corrAdj=1.0`, seed reset to 42 each
run: `_mc_idx` starts at 42. First shock: `u1=sr(42)`, `u2=sr(43)`. `sr(42)=frac(sin(43)×10⁴)`.
`sin(43 rad) ≈ 0.5306` → `x=5306.35` → `sr(42)≈0.353`. `sr(43)=frac(sin(44)×10⁴)`; `sin(44)≈0.0177`→
`x≈176.6`→`sr(43)≈0.628`. `boxMuller = sqrt(-2·ln(0.353))·cos(2π·0.628) = sqrt(2.081)·cos(3.945) ≈
1.443×(−0.694) ≈ −1.001`. `shock = −1.001×(42/100)×1.0 + (85/100)/30 = −0.4204 + 0.0283 = −0.392`.
This is year-1's cumulative return contribution (−39.2 percentage points on a scale where the terminal
value is `cumReturn×100`) — illustrating how a single large negative Box-Muller draw can dominate an
early simulation year before mean-reversion (there is none — this is a pure random walk) evens out
over 30 years.

### 7.5 Data provenance & limitations

- **Single-variable simulation, not the stated 4-variable correlated system** — the most consequential
  finding: results for "Carbon Price" risk do not reflect its stated negative correlation with GDP or
  positive correlation with energy prices; switching the `variable` dropdown runs an entirely
  independent simulation with no cross-variable consistency.
- **`skew` parameters are decorative** — displayed in `NGFS_DIST` but not used by the symmetric
  Box-Muller draw.
- **Silent path-count cap** (2,000 even when `nPaths=5,000` requested) could mislead a user comparing
  displayed "Paths: 5,000" against the actual (smaller) sample the percentiles are computed from.
- This is a pure random-walk (no mean reversion, no jump-diffusion) — reasonable for a first-order
  approximation of long-run scenario uncertainty but not a full NGFS-scenario stochastic process
  model.
- Does not call the backend `monte_carlo_engine.py`; the correlated, multi-asset, Vasicek-VaR version
  of this concept genuinely exists in `monte-carlo-var`'s client-side engine (11-sector Cholesky) —
  see that module's deep dive.

**Framework alignment:** NGFS scenario distributions (named, parameter magnitudes plausible, not
traceable to a specific NGFS output vintage) · Box-Muller normal transform (correctly implemented) ·
Standard VaR/CVaR/Expected-Shortfall percentile definitions (correctly implemented) · IMF GDP shock
distributions (named in guide references, not directly sourced in code).

## 9 · Future Evolution

### 9.1 Evolution A — True joint simulation via the backend engine (analytics ladder: rung 2 → 3)

**What.** Close the module's documented single-variable gap. §7's mismatch flag: the page simulates only ONE variable at a time via Box-Muller, and the 4×4 `CORR_MATRIX` (carbon price, GDP, energy price, technology cost) is displayed but never Cholesky-decomposed — cross-correlation is faked by a single `corrAdj` volatility scalar. Meanwhile the platform's backend `monte_carlo_engine.py` (shared by 3 modules, exposed at `POST /api/v1/monte-carlo/run` and `/quick`, with a real Gelman-Rubin `rhat` convergence diagnostic already in its code) sits uncalled by this page.

**How.** (1) Move simulation server-side: the page posts its config (paths, horizon, distribution, and now the full `CORR_MATRIX`) to `/run`; the engine performs genuine 4-variable Cholesky-correlated draws, returning fan-chart percentiles and VaR/CVaR/ES it already structures via `PercentileResult`/`AssetLevelResult`. (2) Calibrate distribution parameters to the named sources — NGFS Phase 5 carbon-price vintages and IMF GDP shock distributions — loaded from the refdata layer rather than hardcoded means/vols. (3) Pin the engine in `bench_quant`: fixed-seed reference run asserting VaR95/CVaR99.5 within tolerance, plus an rhat < 1.1 convergence gate surfaced in the UI.

**Prerequisites.** The lineage sweep marks `POST /run` as `skipped` (needs a request-shape fixture) — exercise it under auth first; keep the client-side Box-Muller path as an offline fallback labelled as uncorrelated. **Acceptance:** setting the carbon↔energy correlation to 0 vs 0.8 measurably changes joint tail loss; identical seeds reproduce identical fan charts.

### 9.2 Evolution B — Scenario copilot with tool-called re-simulation (LLM tier 2)

**What.** A copilot on the EP-CH1 page answering "why is CVaR 99.5 so much worse under Student-t?" from the actual simulation output (fan-chart percentiles, tail statistics, distribution config), and executing what-ifs — "re-run with 10,000 paths under GEV", "compare disorderly vs hot-house carbon paths" — as tool calls against `POST /api/v1/monte-carlo/run` and `/quick`, never generating simulated numbers itself.

**How.** Tool schemas from the module's 3 OpenAPI operations (health/run/quick); system prompt from this Atlas page's §5 formulas and §7.1 walkthrough so the copilot explains Box-Muller, percentile-VaR, and the fan-chart bands correctly. Because Monte Carlo output is stochastic, the copilot must always report the seed and path count alongside any quoted statistic, and the no-fabrication validator matches quoted numerics against the session's tool responses. `/quick` (already `passed` in the lineage sweep) is the cheap first tool — scenario comparison without a full run.

**Prerequisites.** Evolution A preferred but not blocking — a tier-1 explainer over the current client-side results is shippable now, provided it discloses the single-variable limitation verbatim from §7 rather than describing the displayed correlation matrix as applied. **Acceptance:** every statistic in an answer traceable to a tool response; asking for cross-variable joint tail probabilities before Evolution A lands yields the honest "the current engine simulates one variable at a time" disclosure.