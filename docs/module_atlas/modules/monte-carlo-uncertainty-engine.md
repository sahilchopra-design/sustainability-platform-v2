# Monte Carlo Uncertainty Engine
**Module ID:** `monte-carlo-uncertainty-engine` · **Route:** `/monte-carlo-uncertainty-engine` · **Tier:** A (backend vertical) · **EP code:** EP-DQ3 · **Sprint:** DQ

## 1 · Overview
Implements GUM JCGM 100:2008 and Monte Carlo JCGM 101:2008 uncertainty quantification for carbon credit projects. Calculates combined standard uncertainty, expanded uncertainty (k=2, 95%), and probabilistic emission reduction distributions for CDM EB65 Annex 29 compliance.

> **Business value:** Required for all CDM and VCS projects undergoing third-party verification (VVB). Provides JCGM 100/101-grade uncertainty analysis with EB65 deduction table application — the primary mechanism by which CDM EB protects credit integrity.

**How an analyst works this module:**
- Input emission reduction formula and uncertainty sources
- Calculate sensitivity coefficients analytically
- Apply GUM propagation formula for combined uncertainty
- Run Monte Carlo simulation with Box-Muller normal sampling
- Apply CDM EB65 deduction table to final ER quantity

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `METHODOLOGIES`, `PARAM_NAMES`, `PARAM_UNITS`, `PARAM_WEIGHTS`, `PROJECTS`, `REGISTRIES`, `SECTORS`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `Tab7`, `Tab8`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DQ_LEVELS` | 6 | `label`, `desc`, `color` |
| `DISC_TABLE` | 5 | `disc`, `basis` |
| `VVB_ACCRED` | 5 | `req`, `ref` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['ACM0002','AMS-I.D','VM0007','VM0015','VM0042','ACM0006','AMS-III.D','VM0011','GS-METH-COOK','ACM0001','VM0017','AMS-II.G','VM0021','GS-METH-WIND','ACM0012'];` |
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
| `creditsAtRisk` | `projects.filter(p => p.u_c > 10).reduce((a, p) => a + p.claimed, 0);` |
| `totalDiscount` | `projects.reduce((a, p) => a + (p.claimed - p.net), 0);` |
| `avgDq` | `projects.length ? projects.reduce((a, p) => a + p.dq, 0) / projects.length : 0;` |
| `contribs` | `valid.map(r => {` |
| `totalSq` | `contribs.reduce((a, b) => a + b, 0);` |
| `contrib` | `(!isNaN(u) && !isNaN(c)) ? Math.pow(c * u, 2) : null;` |
| `share` | `(contrib !== null && totalSq > 0) ? (contrib / totalSq * 100) : 0;` |
| `sim` | `useMemo(() => { // Box-Muller via sr() — JCGM 101:2008 const N = 200;` |
| `sig` | `param.value * (param.u_pct / 100) / Math.max(0.01, param.sensitivity);` |
| `sorted` | `[...outcomes].sort((a, b) => a - b);` |
| `mean` | `outcomes.reduce((a, b) => a + b, 0) / N;` |
| `variance` | `outcomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / N;` |
| `std` | `Math.sqrt(Math.max(0, variance));` |
| `skew` | `std > 0 ? outcomes.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / N : 0;` |
| `kurt` | `std > 0 ? outcomes.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / N - 3 : 0;` |
| `maxV` | `sorted[N - 1];` |
| `binW` | `Math.max(1, (maxV - minV) / 10);` |
| `bins` | `Array.from({ length: 10 }, (_, b) => ({ lo: minV + b * binW, hi: minV + (b + 1) * binW, n: 0 }));` |
| `maxN` | `Math.max(1, ...bins.map(b => b.n));` |
| `conv` | `[50, 100, 150, 200].map(k => {` |
| `tornado` | `useMemo(() => { return [...proj.params].map((param, p) => { const sigma  = param.value * (param.u_pct / 100);` |
| `erHigh` | `proj.claimed + param.sensitivity * sigma;` |

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
**Frontend seed datasets:** `ASSURANCE`, `COUNTRIES`, `DISC_TABLE`, `DQ_LEVELS`, `EVIDENCE`, `METHODOLOGIES`, `PARAM_NAMES`, `PARAM_UNITS`, `PARAM_WEIGHTS`, `REGISTRIES`, `SAMPLING`, `SCOPES`, `SECTORS`, `TABS`, `UPGRADE_ACTIONS`, `VVB_ACCRED`

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

Sensitivity coefficients (∂f/∂xᵢ) derived analytically for CDM emission reduction formula; MC supplement uses Box-Muller normal sampling; combined uncertainty applies coverage factor k=2 for 95% confidence; deduction table from EB65

**Standards:** ['GUM JCGM 100:2008 — Guide to the Expression of Uncertainty in Measurement', 'JCGM 101:2008 — Supplement 1 to GUM (Monte Carlo)', 'CDM EB65 Annex 29 — Uncertainty Assessment Procedure', 'ISO 14064-3:2019 §6.7 — Uncertainty in GHG Statements']
**Reference documents:** JCGM 100:2008 — Evaluation of Measurement Data — Guide to the Expression of Uncertainty in Measurement (GUM); JCGM 101:2008 — Supplement 1 to GUM — Propagation of distributions using a Monte Carlo method; CDM EB65 Annex 29 — Procedure for Uncertainty Assessment of Emission Reductions (2011); ISO 14064-3:2019 Section 6.7 — Uncertainty in GHG Statements

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
| `monte-carlo-var` | engine:monte_carlo_engine, table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `greenwashing-detector` | table:dataclasses |
| `greenwashing-detection` | table:dataclasses |
| `climate-underwriting-workbench` | table:dataclasses |
| `carbon-offtake-structurer` | table:dataclasses |
| `greenwashing-exposure-monitor` | table:dataclasses |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (deduction table only).** The guide states the CDM EB65 Annex 29
> deduction schedule as `U<10%→0%, U<20%→3%, U<30%→5%, U<50%→10%, U≥50%→ineligible`. **The code
> implements a different schedule**: `discount = u_c<5 ? 0 : u_c<10 ? 2 : u_c<20 ? 5 : 10` — different
> breakpoints (5/10/20 vs 10/20/30/50) and different percentages (0/2/5/10 vs 0/3/5/10, with no
> "ineligible" ceiling at all). The code also applies the discount to the **combined standard
> uncertainty `u_c`**, not the **expanded uncertainty `U_95` (=2×u_c)** that CDM guidance conventionally
> references at a stated confidence level. The rest of the module — the GUM combined-uncertainty
> formula itself, the Monte Carlo supplement, sensitivity/tornado analysis, and DQ scoring — is
> genuinely and correctly implemented per JCGM 100/101:2008. Sections below document both.

### 7.1 What the module computes

For 30 synthetic carbon-credit projects (5 uncertainty parameters each — Net Electricity Generated,
Grid Emission Factor, Project Emissions, Leakage Factor, Baseline Emissions):

```js
// GUM combined standard uncertainty — JCGM 100:2008 §5 (law of propagation of uncertainty,
// simplified to the uncorrelated-inputs case: no cross-covariance terms)
u_c = sqrt( Σ_p (sensitivity_p × u_pct_p/100)² ) × 100          // as a percentage of the output

U_95 = 2 × u_c                                                    // coverage factor k=2 ⇒ ~95% CI

// CDM EB65-style discount schedule (see mismatch note above for the actual thresholds used)
discount = u_c<5 ? 0% : u_c<10 ? 2% : u_c<20 ? 5% : 10%
net_issuable = claimed_ER × (1 − discount/100)

// P5/P50/P95 via normal approximation
sigma = claimed_ER × (u_c/100) / 2
P5  = claimed_ER − 1.645×sigma      // one-sided 5th percentile, standard normal z=1.645
P50 = claimed_ER − 0.05×sigma       // small negative bias — see §7.6
P95 = claimed_ER + 1.645×sigma

// Data-quality composite (1-5 scale, importance-weighted by the same weights used for sensitivity)
dq = Σ_p PARAM_WEIGHTS[p] × dqScore_p                            // PARAM_WEIGHTS = [0.40,0.35,0.10,0.05,0.10]
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `PARAM_WEIGHTS` | [0.40, 0.35, 0.10, 0.05, 0.10] | Reflects genuine CDM/ISO 14064-2 practice: Net Electricity Generated and Grid Emission Factor dominate uncertainty in grid-connected renewable-energy methodologies (ACM0002/ACM0006), consistent with real CDM EB uncertainty analyses |
| Per-project `u_pct` range | 2–24% | Consistent with the guide's cited "±8–18% typical CDM project uncertainty" |
| Per-project `sensitivity` (c_i) | 0.5–2.0 | Illustrative sensitivity coefficients; a real implementation would derive these analytically as ∂ER/∂x_i for the specific CDM methodology's emission-reduction formula, as the guide's `brief` field itself states |
| `discount` schedule | see mismatch note | Internally consistent (monotonic, correctly gated) but numerically diverges from the guide's stated EB65 table |
| Z-value for P5/P95 | 1.645 | Correct one-sided 95%/5% normal quantile |

### 7.3 Calculation walkthrough

1. **Uncertainty Portfolio tab** — table of all 30 projects with `u_c`, `U_95`, claimed/P5/P50/P95,
   discount%, net issuable, DQ score; portfolio KPIs (`avgUc`, `highRisk` count where `u_c>10`,
   `creditsAtRisk`, `totalDiscount`, `avgDq`) computed via real `reduce`/`filter` over the 30 rows.
2. **GUM Calculator tab** — a genuinely interactive 8-row calculator: user enters parameter name,
   value, unit, type (A/B per ISO Guide to Uncertainty — Type A statistical, Type B judgment-based),
   `u_pct`, and `c_i`; `results` recomputes `u_c = sqrt(Σ(c_i×u_i)²)` live — this is the real GUM
   formula from §7.1 applied interactively, not a static display.
3. **Monte Carlo Simulation tab** — per the JSON assignment's extracted code, a `sim` block explicitly
   comments "Box-Muller via sr() — JCGM 101:2008", generating `N=200` simulated outcomes per parameter
   using `sig = value×(u_pct/100)/max(0.01, sensitivity)` as the per-draw standard deviation, then
   computing empirical mean/variance/skewness/kurtosis and a 10-bin histogram from the simulated
   outcomes — this is a genuine (if small-N, N=200 vs JCGM 101's recommended ≥10,000) Monte Carlo
   uncertainty propagation, not a lookup table.
4. **Sensitivity Analysis (tornado) tab** — `erHigh = claimed + sensitivity×sigma` per parameter,
   producing a genuine one-at-a-time sensitivity tornado ranking parameters by their contribution to
   output uncertainty.
5. **Data Quality Scoring / Uncertainty Discount / VVB Verification Scope / Confidence Interval Report
   tabs** — present the derived `dq`, `discount`, and `U_95` figures in report-ready formats.

### 7.4 Worked example

Project with `baseER=50,000 tCO2e`, and 5 parameters with `(sensitivity, u_pct)` pairs:
(1.2, 4%), (1.5, 8%), (0.8, 6%), (0.6, 15%), (1.0, 5%):

| Param | c_i | u_pct | c_i×u_i | (c_i×u_i)² |
|---|---|---|---|---|
| Net Elec. Gen. | 1.2 | 4% | 0.048 | 0.002304 |
| Grid EF | 1.5 | 8% | 0.120 | 0.014400 |
| Project Emissions | 0.8 | 6% | 0.048 | 0.002304 |
| Leakage Factor | 0.6 | 15% | 0.090 | 0.008100 |
| Baseline Emissions | 1.0 | 5% | 0.050 | 0.002500 |

`Σ(c_i×u_i)² = 0.029608` → `u_c = sqrt(0.029608)×100 = 17.2%`. `U_95 = 34.4%`.
Under the **code's** schedule: `u_c=17.2% ⇒ discount=5%` → `net = 50,000×0.95 = 47,500 tCO2e`.
Under the **guide's stated** schedule: `U=17.2%<20% ⇒ deduction=3%` (if the guide intends `u_c`) or,
if the guide's "U" means the expanded `U_95=34.4%`, that falls in the `<50%→10%` band — three
different possible answers (5%, 3%, or 10%) depending on which schedule and which uncertainty
statistic is used, illustrating exactly why the mismatch in §-heading matters for a credit-issuance
decision.

### 7.5 Data provenance & limitations

- **All 30 projects are synthetic** (`sr()`-seeded), though the `u_pct` ranges and `PARAM_WEIGHTS`
  are realistically calibrated to real CDM grid-renewable-energy uncertainty practice.
- **The discount schedule numerically diverges from the guide's stated EB65 table** (see blockquote) —
  this should be reconciled against the actual CDM EB65 Annex 29 text before being used for any real
  credit-issuance decision.
- **P50 has a small built-in negative bias** (`−0.05×sigma`), an unusual (if minor) departure from an
  unbiased normal approximation — worth understanding before treating P50 as an unbiased median
  estimator.
- Monte Carlo sample size (`N=200`) is well below JCGM 101:2008's own recommended ≥10,000 trials for
  95% CI convergence (a figure the guide itself correctly cites) — the simulated moments (skewness,
  kurtosis) will have non-trivial sampling error at N=200.

**Framework alignment:** JCGM 100:2008 (GUM) — combined-uncertainty propagation formula correctly
implemented for the uncorrelated-inputs case · JCGM 101:2008 (Monte Carlo supplement) — implemented
via Box-Muller sampling, though at a much smaller N than the standard recommends · CDM EB65 Annex 29 —
named and structurally present as a discount schedule, but with numerically different thresholds than
the guide asserts (needs reconciliation against the primary source) · ISO 14064-3:2019 §6.7 —
Type A/B uncertainty classification correctly reflected in the GUM Calculator's `type` field.

## 9 · Future Evolution

### 9.1 Evolution A — Correct EB65 deduction schedule + full JCGM 101 adaptive Monte Carlo (analytics ladder: rung 2 → 3)

**What.** Fix the module's documented regulatory defect and then complete the JCGM 101 implementation. §7's mismatch flag: the code's deduction schedule (`u_c<5→0%, <10→2%, <20→5%, else 10%`) uses different breakpoints and percentages than CDM EB65 Annex 29 (`U<10%→0, <20→3, <30→5, <50→10, ≥50→ineligible`), omits the ineligibility ceiling entirely, and applies the discount to combined standard uncertainty `u_c` instead of expanded uncertainty `U_95 = 2×u_c`. For a module whose stated business value is VVB verification support, a wrong deduction table is a P1 correctness issue, not a style choice.

**How.** (1) Encode the EB65 Annex 29 table verbatim, keyed on `U_95`, with the ≥50% ineligible outcome rendered honestly (net issuable = 0, flagged). (2) Replace the normal-approximation P5/P50/P95 (§7.1 notes a small negative bias in the P50 formula) with the actual JCGM 101 adaptive Monte Carlo: propagate the 5 parameter distributions through the ER formula with the standard-required trial-doubling until the 95% interval endpoints stabilise. (3) Pin both against JCGM 101's published worked example and one hand-computed CDM case in `bench_quant`.

**Prerequisites.** Downstream check: any of the 30 synthetic projects' displayed net-issuable figures will change — release note required; the 3-module shared `monte_carlo_engine` must not be touched without regression runs. **Acceptance:** a project with U_95 = 55% shows "ineligible", matching EB65; JCGM 101 worked example reproduces within stated tolerance.

### 9.2 Evolution B — Verification-audit copilot for VVB submissions (LLM tier 1 → 2)

**What.** A copilot that walks a carbon-project developer through uncertainty assessment the way a DOE/VVB reviewer would: "why did my ERs get a 5% deduction?", "which parameter dominates my combined uncertainty?", "what would reducing grid-EF uncertainty to 3% buy me?" — answered from the page's real GUM decomposition (per-parameter sensitivity × uncertainty contributions, the tornado analysis §7 confirms is genuinely implemented) and, for what-ifs, by re-invoking the calculation rather than estimating.

**How.** Tier 1 first: system prompt from this Atlas page's §5 GUM formula and §7 walkthrough, answering strictly from the currently rendered decomposition — the JCGM 100/101 and EB65 reference documents named in §5 form the citation corpus so regulatory assertions quote the standard, not model memory. Tier 2 adds tool calls: the what-if above becomes a parameter-modified recalculation through the module's compute path (today client-side; through `POST /api/v1/monte-carlo/run` once server-side), with the fabrication validator matching every quoted uncertainty percentage to a computed output.

**Prerequisites (hard).** Evolution A's deduction-table fix must land first — a copilot confidently explaining the current non-EB65 schedule to a project developer preparing a real CDM submission would be actively harmful. **Acceptance:** deduction explanations cite the EB65 threshold applied; asking "will my VVB accept this?" yields a scoped refusal (the module computes uncertainty, not verification outcomes).