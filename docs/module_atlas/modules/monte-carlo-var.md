# Monte Carlo VaR
**Module ID:** `monte-carlo-var` · **Route:** `/monte-carlo-var` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monte Carlo simulation engine for climate risk Value at Risk (VaR) computation, modelling the distribution of portfolio losses under stochastic climate transition and physical risk scenarios. Supports full revaluation simulation with 10,000+ paths, tail risk analytics (CVaR/Expected Shortfall), and copula-based cross-asset correlation structures. Provides regulatory climate stress testing input for ICAAP and ORSA frameworks.

> **Business value:** Enables risk managers to quantify the distribution of climate-driven portfolio losses with statistical rigour, supporting ICAAP climate stress test requirements, capital buffer sizing, and investor climate risk disclosures.

**How an analyst works this module:**
- Define the portfolio positions and select asset-level climate risk factor sensitivities from the risk model library
- Configure simulation parameters: number of paths, time horizon, correlation structure, and climate factor volatility
- Run simulation and review the loss distribution histogram with VaR and CVaR markers at selected confidence levels
- Decompose VaR by climate risk factor (carbon price, physical hazard, policy shock) using factor attribution
- Export simulation results for ICAAP climate stress test section and regulatory capital quantification

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
| `idx95` | `Math.floor((i + 1) * 0.05);` |
| `result` | `runMonteCarlo(holdings, { ...baseConfig, scenario: sc, iterations: Math.min(baseConfig.iterations, 5000) });` |
| `csv` | `[headers.join(','), ...rows.map(r => headers.map(h => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `fmt` | `(v, d = 2) => v != null ? v.toFixed(d) : '--';` |
| `fmtM` | `(v) => v != null ? `$${Math.abs(v).toFixed(1)}M` : '--';` |
| `fmtPct` | `(v) => v != null ? `${(v * 100).toFixed(2)}%` : '--';` |
| `holdings` | `useMemo(() => rawHoldings.map(h => enrichHolding(h)), [rawHoldings]);` |
| `sectorMean` | `Math.abs(params.means[idx]) * horizon;` |
| `sectorVol` | `params.vols[idx] * Math.sqrt(horizon);` |
| `marginalVar` | `sectorVol * zScore * exp;` |
| `componentVar` | `totalExp > 0 ? (exp / totalExp) * totalVar : 0;` |
| `pctOfTotal` | `totalVar > 0 ? (componentVar / totalVar * 100) : 0;` |
| `rows` | `results.histogram.map(h => ({ bin_start: h.bin, frequency: h.count, midpoint: h.midpoint }));` |

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

Portfolio loss distribution is generated by simulating correlated climate risk factor paths (carbon price, physical hazard frequency, stranded asset write-downs) using Cholesky-decomposed correlated normal variates. Full revaluation of each portfolio position at each simulation path produces the empirical loss distribution. CVaR is the expected loss in the tail beyond the VaRα confidence threshold (typically α = 0.95 or 0.99).

**Standards:** ['BCBS Climate-related Financial Risks Principles 2021', 'EIOPA Climate Change Stress Test Methodology 2022', 'ECB 2022 Climate Stress Test Scenarios', 'Glasserman Monte Carlo Methods in Financial Engineering 2003']
**Reference documents:** BCBS Principles for the Effective Management and Supervision of Climate-related Financial Risks 2021; ECB Economy-wide Climate Stress Test â€” Methodology and Results 2021; EIOPA Climate Change Stress Testing Insurance Sector 2022; Glasserman â€” Monte Carlo Methods in Financial Engineering (Springer 2003); NGFS Climate Scenarios for Central Banks and Supervisors 2023

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
| `monte-carlo-climate` | engine:monte_carlo_engine, table:dataclasses |
| `monte-carlo-uncertainty-engine` | engine:monte_carlo_engine, table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |

## 7 · Methodology Deep Dive

This module's client-side engine is genuinely well-built — real Cholesky decomposition over an
11-sector GICS correlation matrix, correlated normal shocks, full portfolio revaluation per
simulation path, and proper tail statistics. It does **not**, however, call the platform's backend
`monte_carlo_engine.py` (a separate, real, Vasicek-VaR / NGFS-PD-calibrated engine) despite the guide
describing capabilities (ICAAP/ORSA regulatory submission, factor-attribution SHAP) that live only in
that unconnected backend. No mismatch blockquote is needed for the core simulation mechanics — they
match the guide closely — but the backend disconnect is a material limitation documented in §7.6.

### 7.1 What the module computes

```js
// Box-Muller (deterministic, sr()-seeded)
boxMuller() = sqrt(-2·ln(u1))·cos(2π·u2)

// Cholesky decomposition, standard algorithm, of the 11×11 SECTOR_CORRELATIONS.matrix
L[i][j] via forward substitution; L[i][i] = sqrt(matrix[i][i] − Σ_{k<j} L[i][k]²)

// Per simulation: 11 independent standard normals z, correlated via L
correlatedZ[i] = Σ_{j≤i} L[i][j] × z[j]                        // correlatedZ = L·z

// Per sector with nonzero exposure:
sectorReturn = mean_sector×horizon + vol_sector×√horizon × correlatedZ[sector]
portfolioReturn += (exposure_sector/totalExposure) × sectorReturn
portfolioLoss = −portfolioReturn × totalExposure

// Across all simulations:
VaR(level) = sortedLosses[floor(iterations×(1−level))]          // sortedLosses descending
CVaR95 = mean(sortedLosses[0 : floor(iterations×0.05)])          // worst 5% average
mean, variance, std computed via running sums; histogram via equal-width binning
```

Sector exposures are aggregated from real (or session-loaded) portfolio holdings via
`GLOBAL_COMPANY_MASTER`, mapped to one of 11 GICS-like sectors via `sectorIndex()` (with an
alias table for friendly sector names, defaulting to Financials if unmapped).

### 7.2 Parameterisation

| Structure | Values | Provenance |
|---|---|---|
| `SECTOR_CORRELATIONS.matrix` (11×11) | e.g. Energy×Materials = 0.72, Energy×Utilities = 0.68, IT×CommServices = 0.65 | Hand-calibrated correlation structure; directionally sensible (carbon-intensive sectors cluster; IT/Comm Services cluster; Health Care/Cons Staples are low-correlation defensives) — not fit to observed historical sector-return correlations |
| `SCENARIO_PARAMS` (3 scenarios: transition/physical/combined) | per-sector annual mean shocks −0.32 to +0.08, vols 0.05–0.20 | Directionally correct (Energy/Utilities/Materials hit hardest under transition; Utilities/RealEstate hit hardest under physical) — magnitudes are illustrative, not calibrated to a specific NGFS/IPCC pathway |
| `combined` scenario means | = roughly `transition + physical` per sector (e.g. Energy: −0.30 ≈ −0.25 + −0.10 with some non-additivity) | Approximates additive combination of the two risk channels, not a jointly-modelled interaction |
| Confidence levels | 95%/99%/99.9% (implicit via `varAtLevel`) | Standard regulatory VaR reporting levels |

### 7.3 Calculation walkthrough

1. **Portfolio setup** — holdings enriched via `enrichHolding()`, sector-mapped, exposures aggregated
   into an 11-bucket vector.
2. **Simulation** — for each of `iterations` runs (user-configurable, capped at 5,000 for the
   scenario-comparison sweep per line: `Math.min(baseConfig.iterations, 5000)`), draw 11 independent
   normals, correlate via `L`, compute each exposed sector's shocked return, weight by exposure share,
   sum to portfolio return, negate to get loss.
3. **Tail statistics** — `sortedLosses` (descending) indexed at `floor(N×(1−level))` for VaR; average
   of the worst 5% for CVaR95 — both standard, correctly-implemented empirical quantile estimators.
4. **Sector attribution** — `sectorVarContrib` computes each sector's marginal/component VaR
   (`marginalVar = sectorVol×zScore×exposure`; `componentVar = (exposure/totalExp)×totalVar`) — a
   real (if simplified, delta-normal-style) VaR decomposition, not a full Euler-allocation from the
   simulated distribution itself.
5. **Scenario comparison** — re-runs the full simulation for each of the 3 scenarios to produce a
   side-by-side comparison table.
6. **Export** — CSV export of histogram bins and summary statistics.

### 7.4 Worked example

Two-sector illustrative portfolio: 60% Energy, 40% Utilities exposure, `transition` scenario,
`horizon=1`. `Energy`: mean=−0.25, vol=0.15. `Utilities`: mean=−0.20, vol=0.14.
`SECTOR_CORRELATIONS.matrix[Energy][Utilities] = 0.68`. Cholesky of the 2×2 submatrix
`[[1,0.68],[0.68,1]]`: `L = [[1,0],[0.68, sqrt(1−0.68²)]] = [[1,0],[0.68, 0.733]]`.
For one draw `z=[0.5, −0.3]` (illustrative standard normals): `correlatedZ_Energy = 1×0.5 = 0.5`;
`correlatedZ_Utilities = 0.68×0.5 + 0.733×(−0.3) = 0.34 − 0.220 = 0.120`.
`Energy return = −0.25 + 0.15×0.5 = −0.175`. `Utilities return = −0.20 + 0.14×0.120 = −0.183`.
`Portfolio return = 0.6×(−0.175) + 0.4×(−0.183) = −0.105 − 0.0732 = −0.1782`.
`Loss (per $1 exposure) = +0.1782`, i.e. **17.8% loss** for this single simulated path — repeating
across thousands of paths and taking the 5th percentile produces the reported VaR95.

### 7.5 Companion analytics

- **Fairness/attribution tables** absent here (that pattern lives in `ml-risk-scorer`); this module's
  companion analytics are the sector VaR contribution table and the 3-scenario comparison, both
  genuinely computed.

### 7.6 Data provenance & limitations

- **Correlation matrix and scenario means/vols are hand-calibrated, not empirically fit** — directionally
  reasonable but should not be presented as measured from historical sector returns or NGFS model
  output without independent calibration.
- **Does not call the backend `monte_carlo_engine.py`**, which independently implements a real
  Vasicek one-factor VaR with NGFS-Phase-IV-calibrated PD via `PDAdjustmentCalculator`, Gelman-Rubin
  convergence diagnostics, and Basel Pillar 2-aligned methodology documentation. The two engines are
  methodologically different (this page: correlated-shock full-revaluation on portfolio *returns*;
  backend: Vasicek asset-value model on *credit losses*) and should not be assumed interchangeable —
  a genuine integration would need to decide which model is authoritative for which use case (market
  risk vs credit risk framing).
- Sector VaR contribution uses a simplified marginal-VaR formula rather than deriving contributions
  directly from the simulated joint distribution (e.g. via conditional expectation given the tail
  event) — acceptable as an approximation but should be labelled as such in any regulatory submission.

**Framework alignment:** BCBS Climate-related Financial Risks Principles 2021 (portfolio VaR/CVaR
framing consistent) · Glasserman *Monte Carlo Methods in Financial Engineering* (Cholesky-correlated
shock methodology is textbook-correct per Glasserman Ch. 2–3) · NGFS scenario taxonomy (transition/
physical/combined scenario framing correctly reflects NGFS's core scenario axes, though calibration
is illustrative) · ICAAP/ORSA (named in guide as the regulatory use case; this module produces the
right *type* of output — VaR/CVaR distribution — but the backend engine, not this frontend page, is
the one built to the Basel Pillar 2/Vasicek standard a real ICAAP submission would require).

## 9 · Future Evolution

### 9.1 Evolution A — Backend unification with real portfolio positions (analytics ladder: rung 2 → 3)

**What.** Connect this page's genuinely well-built client-side simulator (§7 confirms real Cholesky over the 11-sector GICS correlation matrix, full revaluation per path, proper VaR/CVaR tail statistics) to the platform's backend `monte_carlo_engine.py` — a separate, real, Vasicek-VaR/NGFS-PD-calibrated engine exposed at `POST /api/v1/monte-carlo/run` that this page never calls — and run it over actual `portfolios_pg` holdings instead of manually entered sector exposures. The guide's ICAAP/ORSA and factor-attribution claims live only in that unconnected backend today.

**How.** (1) Add a portfolio selector reading `portfolios_pg` (the populated table; `portfolios` is empty) and mapping holdings to the 11 GICS sectors for exposure vectors. (2) Route simulation through `/run` so the Vasicek/NGFS calibration, the engine's Gelman-Rubin convergence diagnostic (`rhat` computation visible in §5's extracted lines), and asset-level results (`AssetLevelResult`) replace the browser loop for portfolios above a size threshold; keep the client path for instant small-N exploration, labelled as the uncalibrated variant. (3) Calibrate the `SECTOR_CORRELATIONS` matrix from ingested market-data history rather than hardcoded values, with the estimation window documented per Atlas §8 model-card convention.

**Prerequisites.** `POST /run` currently `skipped` in the lineage sweep — exercise under auth with a portfolio-shaped fixture; correlation-matrix recalibration changes every VaR number, so pin a fixed-seed reference case in `bench_quant` before switching. **Acceptance:** same portfolio via client and backend paths reported side-by-side with documented divergence; VaR responds to real holding changes in `portfolios_pg`.

### 9.2 Evolution B — Risk-desk analyst with tool-called stress runs (LLM tier 2)

**What.** A tool-calling analyst that operates the simulator conversationally: "run 10,000 paths on the growth portfolio at 99% over 3 years", "which sector drives the tail?", "how much does halving energy exposure cut CVaR?" — executed as calls to `POST /api/v1/monte-carlo/run` and `/quick`, with answers narrating only returned statistics. Factor attribution comes from the engine's per-sector loss decomposition, not from the LLM's intuition about which sectors are risky.

**How.** Tool schemas from the module's 3 OpenAPI operations; system prompt from this page's §5/§7.1 methodology (Cholesky mechanics, percentile-VaR definitions) so explanations are technically correct for an ICAAP audience. Stochastic-output discipline: every quoted VaR carries seed, path count, and engine version in a "show work" expander (roadmap Tier-2 provenance UX); comparisons between runs must hold the seed fixed or disclose sampling error. The no-fabrication validator matches all numerics against tool outputs in-session.

**Prerequisites.** Evolution A's backend wiring (the analyst should drive the calibrated engine, not the browser loop); engine version stamps in `/run` responses per the roadmap's engine-registry work. **Acceptance:** every numeric traceable to a tool call; asking for ICAAP capital numbers the engine does not produce (e.g. Pillar 2 add-on) yields a refusal with a pointer to what it does compute.