# ML Forecasting & Risk Engine
**Module ID:** `renewable-ml-forecasting` · **Route:** `/renewable-ml-forecasting` · **Tier:** B (frontend-computed) · **EP code:** RE-ML1 · **Sprint:** RE

## 1 · Overview
Quantitative machine learning and probabilistic forecasting engine for renewable energy portfolio risk management. Implements Monte Carlo (Box-Muller), Bayesian Normal-Normal conjugate updating, OLS factor regression with seasonality, 3-state HMM ENSO climate regime detection (La Niña / Neutral / El Niño), portfolio VaR, ensemble forecasting, and long-range stress scenarios across 18 analytical tabs.

> **Business value:** Designed for RE portfolio managers, quantitative risk analysts at infrastructure funds, and independent engineers needing probabilistic yield forecasting beyond deterministic P50 models. Provides the full probabilistic toolkit — Monte Carlo, Bayesian updating, OLS factor models, and ENSO regime detection — in a unified engine that replaces fragmented Python scripts and Excel Monte Carlo add-ins used in RE investment risk management.

**How an analyst works this module:**
- Set P50 GWh and 6 uncertainty sigma values in the left Uncertainty panel; open "Monte Carlo Dist." tab for the Box-Muller 1,000-run distribution — P10/P50/P90/P99 exceedance percentiles update in real time
- Navigate to "Bayesian Posterior" tab — enter prior mean/σ and add observed production months; posterior mean and credible interval shrink toward the data as n grows (Normal-Normal conjugate update)
- Open "OLS Regression" tab for the GHI factor model: β₁ (GHI slope), R² decomposition, residual time series analysis, and temperature interaction term; low R² flags operational underperformance vs resource variability
- Check "HMM Regimes" tab for 3-state La Niña / Neutral / El Niño Markov regime detection; Viterbi path shows most likely climate state sequence; regime-adjusted P50 generation differs by ±5-15% by geography
- Review "Forecast vs Actual" for model backtesting accuracy and "Model Comparison" for individual vs ensemble MAPE comparison across Monte Carlo, Bayesian, OLS, and HMM models
- Open "Ensemble" tab for the information-ratio weighted model combination; "Feature Importance" shows which input factors (GHI, temperature, humidity, ENSO index) drive the most forecast variance
- Navigate to "Portfolio VaR" tab — set the solar-wind correlation (default 0.20); portfolio VaR = σ_port × 1.645 × Revenue shows the diversification benefit vs sum of individual VaRs; covariance matrix displayed
- Use "Stress Testing" tab with Severe (−15% GHI, +20% price vol) or Extreme (−25% GHI, La Niña + drought compounding) scenarios to stress-test DSCR breach probability and revenue at risk
- Check "Seasonality" tab for monthly production patterns and ENSO-driven seasonal shifts; "Degradation" tab combines Arrhenius calendar aging with Monte Carlo uncertainty bands across the forecast horizon
- Open "Uncertainty Decomp." to see variance attribution by source; "Long-Range Scenarios" for 2030/2040 climate-adjusted forecasts; "Live API" to fetch NASA POWER irradiance for the selected portfolio site

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `KpiCard`, `MONTHS_SHORT`, `SecHdr`, `SectionTitle`, `SelectBtn`, `Slider`, `Tab01MonteCarlo`, `Tab02Bayesian`, `Tab03OLS`, `Tab04HMM`, `Tab05ForecastActual`, `Tab06ModelComparison`, `Tab07PortfolioVaR`, `Tab08StressTesting`, `Tab09Seasonality`, `Tab10Degradation`, `Tab11Ensemble`, `Tab12FeatureImportance`, `Tab13CrossValidation`, `Tab14RevenueForecast`, `Tab15UncertaintyDecomp`, `Tab16LongRange`, `Tab17Backtesting`, `Tab18LiveAPI`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 3 | `color`, `genMult`, `priceMult`, `degradAdj` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sorted` | `[...results].sort((a, b) => a - b);` |
| `mean` | `results.reduce((s, v) => s + v, 0) / Math.max(1, nRuns);` |
| `variance` | `results.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, nRuns);` |
| `priorSigma` | `priorMean * priorSigmaFrac / 100;` |
| `obsSigma` | `priorMean * obsSigmaFrac / 100;` |
| `priorVar` | `priorSigma * priorSigma;` |
| `obsVar` | `obsSigma * obsSigma;` |
| `posteriorVar` | `1 / (1 / priorVar + n / obsVar);` |
| `posteriorMean` | `posteriorVar * (priorMean / priorVar + n * obsMean / obsVar);` |
| `xMean` | `X.reduce((s, v) => s + v, 0) / n;` |
| `yMean` | `y.reduce((s, v) => s + v, 0) / n;` |
| `ssXX` | `X.reduce((s, x) => s + Math.pow(x - xMean, 2), 0);` |
| `ssXY` | `X.reduce((s, x, i) => s + (x - xMean) * (y[i] - yMean), 0);` |
| `beta1` | `ssXX > 0 ? ssXY / ssXX : 0;` |
| `beta0` | `yMean - beta1 * xMean;` |
| `yHat` | `X.map(x => beta0 + beta1 * x);` |
| `residuals` | `y.map((v, i) => v - yHat[i]);` |
| `ssRes` | `residuals.reduce((s, v) => s + v * v, 0);` |
| `ssTot` | `y.reduce((s, v) => s + Math.pow(v - yMean, 2), 0);` |
| `rmse` | `Math.sqrt(ssRes / Math.max(1, n));` |
| `mae` | `actual.reduce((s, v, i) => s + Math.abs(v - forecast[i]), 0) / n;` |
| `mse` | `actual.reduce((s, v, i) => s + Math.pow(v - forecast[i], 2), 0) / n;` |
| `mape` | `actual.reduce((s, v, i) => s + Math.abs((v - forecast[i]) / Math.max(0.01, Math.abs(v))), 0) / n * 100;` |
| `meanAct` | `actual.reduce((s, v) => s + v, 0) / n;` |
| `bias` | `actual.reduce((s, v, i) => s + (forecast[i] - v), 0) / n;` |
| `persistence` | `actual.slice(0, -1);` |
| `msePersist` | `persistence.reduce((s, v, i) => s + Math.pow(v - actualShifted[i], 2), 0) / Math.max(1, persistence.length);` |
| `skillScore` | `msePersist > 0 ? 1 - mse / msePersist : 0;` |
| `revenues` | `assets.map(a => a.p50 * revenuePerMWh / 1000);` |
| `sigmas` | `assets.map(a => a.sigma * revenues[assets.indexOf(a)]);` |
| `portfolioSigma` | `Math.sqrt(Math.max(0, portVar));` |
| `totalRev` | `revenues.reduce((s, v) => s + v, 0);` |
| `varP95` | `portfolioSigma * 1.645;` |
| `varP99` | `portfolioSigma * 2.326;` |
| `cvarP95` | `portfolioSigma * 2.063;` |
| `uncertainties` | `useMemo(() => ({ resource: resourceSigPct / 100, wake: wakeSigPct / 100, availability: availSigPct / 100, degradation: degradSigPct / 100, curtailment: curtailSigPct / 100, soiling: soilingSigPct / 100 }), [resourceSigPct, wakeSigPct, availSigPct, degradSigPct, curtailSigPct, soilingSigPct]);` |
| `mcResults` | `useMemo(() => runMonteCarlo(p50GWh, uncertainties, nMCRuns, 42), [p50GWh, uncertainties, nMCRuns]);  // ── Bayesian observations (synthetic from inputs) ── const observations = useMemo(() => { return Array.from({ length: nObs }, (_, i) => { const noise = (sr(i * 37 + 5) - 0.5) * 2 * priorMean * obsSigPct / 100;` |
| `monthlyActual` | `useMemo(() => { const monthlyP50 = p50GWh / 12;` |
| `year` | `Math.floor(i / 12);` |
| `annualFactor` | `0.92 + sr(year * 17 + 3) * 0.16;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MONTHS_SHORT`, `SCENARIOS`, `SCENARIO_COLORS`, `STATE_COLORS`, `STATE_LABELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Monte Carlo P90 | `Box-Muller combined σ across 6 uncertainty sources` | Engineering assessment | P90 10-year exceedance (divide σ by √10 for multi-year); used for lender base case; combines resource, technical, and curtailment uncertainty in quadrature |
| Bayesian Posterior Mean | `μ₁ = σ₁²(μ₀/σ₀² + Σxᵢ/σ²)` | Bayesian update model | Posterior shrinks toward observed data as number of observations grows; prior dominates with few observations; converges to sample mean with many observations |
| OLS R² (GHI factor) | `SSExplained / SSTotal = 1 − SSRes/SSTotal` | OLS regression | How much generation variance is explained by irradiance alone; high R² indicates good resource tracking; low R² signals operational issues or data quality problems |
| HMM Regime Probability | `Forward-backward algorithm; Viterbi for state sequence` | ENSO forecast (IRI, BOM) | La Niña → lower solar irradiance in tropical Americas + Australia; El Niño → higher irradiance in same zones; NAO and IOD also modelled via toggles |
| Portfolio VaR (95%) | `σ_port = √(wᵀΣw); VaR = σ_port × 1.645 × Revenue` | Variance-covariance | Revenue at risk at 95% confidence; benefit of diversification measured by VaR reduction vs sum-of-individual VaRs; solar-wind correlation ~0.20 gives 15–25% VaR reduction |
| Ensemble Forecast MAPE | `Σ|actual − forecast|/|actual| / n × 100` | Backtesting model | Mean absolute percentage error; ensemble typically outperforms any individual model by 10–25% on MAPE; weighted ensemble uses information ratio optimisation |
| Degradation Trajectory | `Arrhenius calendar aging bands (P10/P50/P90)` | Manufacturer + NREL | 25-year production forecast with Arrhenius uncertainty bands; P10 degradation (pessimistic) used for lender DCF; replacement scenario NPV quantifies augmentation value |
- **Portfolio technical specs (P50 GWh, capacity MW, technology mix)** → Monte Carlo Box-Muller × 1,000 runs with 6 uncertainty σ inputs → **P10/P50/P90/P99 generation distribution, VaR, exceedance curve**
- **12 months of observed production data (user input)** → Bayesian Normal-Normal conjugate update → **Posterior mean and σ, shrinkage toward data vs prior, updated P50/P90**
- **ENSO regime probability (IRI/BOM seasonal outlook)** → HMM 3-state transition matrix + Viterbi decoding → **Regime-adjusted P50, probability of La Niña/Neutral/El Niño persistence, generation adjustment factor**

## 5 · Intermediate Transformation Logic
**Methodology:** Bayesian Conjugate Update + HMM Viterbi + Box-Muller Monte Carlo
**Headline formula:** `μ₁ = σ₁²(μ₀/σ₀² + Σxᵢ/σ²); σ₁² = 1/(1/σ₀² + n/σ²); VaR₉₅ = σ_port × 1.645 × Revenue`

Monte Carlo uses Box-Muller transform: z = √(−2 ln u₁) × cos(2π u₂); combined σ from 6 uncertainty sources (resource, wake, availability, degradation, curtailment, soiling) in quadrature. Bayesian Normal-Normal: posterior mean μ₁ = σ₁²(μ₀/σ₀² + Σxᵢ/σ_obs²); posterior σ₁² = 1/(1/σ₀² + n/σ_obs²). HMM: 3 states (La Niña/Normal/El Niño) with 3×3 calibrated transition matrix; Viterbi decoding finds most likely state path. OLS: β₁ = ΣΔXΔY / ΣΔX², R² from SS decomposition. Ensemble: weighted average of MC + Bayesian + OLS + HMM-adjusted forecasts; weights from information ratio minimisation.

**Standards:** ['IPCC AR5 WG1 Ch.14 — ENSO', 'IEA Solar Resource Forecasting', 'AEMO Probabilistic Forecasting Framework']
**Reference documents:** IPCC AR5 WG1 Chapter 14 — Climate Phenomena and their Relevance for Future Regional Climate Change (ENSO); IEA — Solar PV Forecasting and Uncertainty Estimation (2020); Gelman, A. et al. — Bayesian Data Analysis, 3rd Edition (CRC Press, 2013); NREL — Probabilistic Energy Forecasting for Solar Power Systems (2022); Diebold, F.X. & Mariano, R.S. — Comparing Predictive Accuracy, JBES 1995 (Forecast evaluation)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — one component only.** The guide claims a **Hidden Markov Model
> with Viterbi decoding and a forward-backward algorithm** ("Viterbi decoding finds most likely
> state path"; "Forward-backward algorithm"). **The code implements neither.** `hmmStates` is a
> **forward Markov-chain simulation**: starting from the user-selected ENSO regime, it draws a
> random next-state at each future month from the transition matrix row (`sr(i×31+7)` against
> cumulative row probabilities) — a legitimate, correctly-implemented stochastic simulation, but
> conceptually different from Viterbi (which finds the *most likely* state sequence given observed
> emissions via dynamic programming) or forward-backward (which computes state-occupancy
> probabilities given observations). There are no observations or emission-likelihood model feeding
> the "HMM" at all — it is a pure transition-matrix random walk. Every other claimed technique
> (Box-Muller Monte Carlo, Bayesian Normal-Normal conjugate update, OLS regression, VaR z-scores,
> MAPE/skill-score backtesting) **is** genuinely and correctly implemented — documented below.

### 7.1 What the module computes (verified against the code, not just the guide)

```js
// Box-Muller Monte Carlo — literally matches the guide's formula
z = sqrt(-2·ln(u1)) × cos(2π·u2)

// Bayesian Normal-Normal conjugate update — literally matches
posteriorVar  = 1 / (1/priorVar + n/obsVar)
posteriorMean = posteriorVar × (priorMean/priorVar + n×obsMean/obsVar)

// OLS regression — literally matches
beta1 = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²
beta0 = ȳ - beta1·x̄
R²    = 1 - SSRes/SSTot

// Portfolio VaR — literally matches, correct normal-distribution quantiles
VaR95  = σ_port × 1.645 × Revenue     // z_0.95 = 1.645 ✓
VaR99  = σ_port × 2.326 × Revenue     // z_0.99 = 2.326 ✓
CVaR95 = σ_port × 2.063 × Revenue     // Expected Shortfall multiplier for Normal at 95% ✓ (φ(1.645)/0.05 ≈ 2.063)

// Forecast skill vs naive persistence baseline
skillScore = 1 − MSE_model / MSE_persistence

// "HMM" — actually a forward Markov-chain simulation, not Viterbi
for each future month: sample next state from transition matrix row via sr(), no emission model
```

### 7.2 Parameterisation

| Component | Constants | Provenance |
|---|---|---|
| Monte Carlo uncertainty sources | 6: resource, wake, availability, degradation, curtailment, soiling | Real physical uncertainty taxonomy for wind/solar yield assessments, correctly combined in quadrature (implied by the code summing variances before taking √) |
| VaR z-scores | 1.645 (95%), 2.326 (99%), 2.063 (CVaR95) | Correct standard-normal quantiles/expected-shortfall multipliers |
| HMM transition matrix (user-adjustable) | La Niña row 70/25/5%, Neutral row 15/70/15%, El Niño row 5/25/70% | Synthetic but structurally sound — diagonal-dominant (persistent regimes), correct row-stochastic (sums to 100% per row) |
| Degradation trajectory | "0.35–0.70%/yr" per guide, Arrhenius calendar-aging framing | Consistent with published PV degradation literature (NREL), not independently verified line-by-line in code |
| ENSO La Niña/El Niño multipliers | user-adjustable | Directionally consistent with IPCC AR5 Ch.14's description of ENSO's regional irradiance effects |

### 7.3 Calculation walkthrough

1. **Monte Carlo Dist. tab**: `runMonteCarlo(p50GWh, uncertainties, nRuns, seed)` draws `nRuns`
   Box-Muller normal variates, combines the 6 uncertainty σ's in quadrature into a
   `combinedSigma`, and produces a full P10/P50/P90/P99 generation distribution — a genuinely
   correct Monte Carlo implementation (not a single-formula shortcut).
2. **Bayesian Posterior tab**: user enters prior mean/σ and synthetic monthly observations
   (`observations`, generated via `sr()` noise around the prior for demo purposes since real
   observed data isn't available); the Normal-Normal conjugate update correctly shrinks the
   posterior toward the observed mean as `n` grows — exactly the behaviour the guide describes.
3. **OLS Regression tab**: regresses generation on a GHI (irradiance) factor via closed-form OLS;
   computes RMSE, and — per the JSON extraction — the residual/R² decomposition is a correct
   sum-of-squares split (`SSRes`/`SSTot`).
4. **HMM Regimes tab**: as described in the mismatch flag — a forward random-walk simulation over
   the user's transition matrix, correctly probability-normalised per row, but not Viterbi/
   forward-backward.
5. **Forecast vs Actual / Model Comparison tabs**: `mae`, `mse`, `mape` (guarded with
   `Math.max(0.01, |actual|)` to avoid division by zero), `bias`, and `skillScore` (vs a
   persistence — i.e. "tomorrow = today" — naive baseline) are all correctly-implemented standard
   forecast-verification metrics (matching Diebold-Mariano-style forecast evaluation practice
   cited in the guide's references).
6. **Portfolio VaR tab**: `revenues = assets.map(p50 × price/1000)`; `sigmas` scaled per asset;
   `portfolioSigma = √(portVar)` — the JSON extraction shows a portfolio variance aggregation
   consistent with `σ_port = √(wᵀΣw)` when a correlation term is included (correlation input
   referenced in guide's user-interaction text as "solar-wind correlation, default 0.20").
7. **Ensemble tab**: combines MC/Bayesian/OLS/HMM-adjusted forecasts — an "information ratio
   minimisation" weighting is claimed; not independently re-derived in this review, but the
   ensemble concept (weighted combination of independent forecasts) is standard practice.

### 7.4 Worked example — Bayesian posterior update

`priorMean=450 GWh`, `priorSigmaFrac=8%` → `priorSigma=36 GWh`, `priorVar=1,296`;
5 observations averaging `obsMean=470 GWh`, `obsSigmaFrac=5%` → `obsSigma=22.5 GWh`,
`obsVar=506.25`:

| Step | Formula | Result |
|---|---|---|
| `posteriorVar` | `1/(1/1296 + 5/506.25)` | `1/(0.000772+0.009877)=1/0.010649=` **93.9** |
| `posteriorMean` | `93.9×(450/1296 + 5×470/506.25)` | `93.9×(0.3472+4.642)=93.9×4.989=` **≈468.5 GWh** |

The posterior (468.5) sits much closer to the observed mean (470) than the prior (450) — correctly
demonstrating that with 5 observations at a tighter σ than the prior, the data dominates the
update, exactly the behaviour Bayesian conjugate updating should produce.

### 7.5 Forecast-accuracy rubric

| Metric | Formula | "Good" threshold (per guide) |
|---|---|---|
| MAPE | `Σ|actual−forecast|/|actual| / n × 100` | <5% excellent for day-ahead solar |
| Skill score | `1 − MSE_model/MSE_persistence` | >0 means model beats naive persistence |

### 7.6 Companion analytics

18 tabs: Asset setup, Monte Carlo Dist., Bayesian Posterior, OLS Regression, HMM Regimes, Model
Comparison, Forecast vs Actual, Seasonality, Degradation, Portfolio VaR, Ensemble, Feature
Importance, Uncertainty Decomp., Stress Testing, Long-Range Scenarios, Live API (NASA POWER
irradiance fetch), plus others referenced by tab index.

### 7.7 Data provenance & limitations

- **Statistical machinery is genuinely, correctly implemented** — Box-Muller, Bayesian conjugate
  update, OLS closed-form regression, and standard-normal VaR/CVaR quantiles all match their
  textbook formulas exactly, verified against the code (not just the guide's claims). This is
  among the most mathematically rigorous modules reviewed in this batch.
- **The "HMM" is a forward Markov-chain simulator, not an HMM with Viterbi/forward-backward
  decoding** — no emission/observation model exists to condition the state estimate on real
  irradiance data, so "Viterbi path" and "Regime Probability from forward-backward" claims in the
  guide should be corrected to describe a Monte Carlo regime *simulation* instead.
- Bayesian "observations" are synthetic (`sr()`-seeded noise around the prior) rather than real
  user-uploaded monthly production data in the reviewed code path — the Bayesian *math* is real,
  but the demo inputs feeding it are fabricated unless a user supplies their own observations.
- Degradation trajectory bands (Arrhenius calendar-aging) are referenced in the guide but this
  review did not independently verify an Arrhenius-equation implementation in code; treat as
  unconfirmed rather than verified.

**Framework alignment:** Gelman et al. *Bayesian Data Analysis* — Normal-Normal conjugate update
correctly implemented per the textbook closed-form · Diebold & Mariano (1995) — MAPE/skill-score
forecast evaluation against a persistence baseline is consistent with standard forecast-comparison
practice · IPCC AR5 WG1 Ch.14 (ENSO) — La Niña/El Niño regional irradiance effect direction is
correctly represented via the state multipliers, though the state *transition dynamics* are a
user-configurable random walk, not fitted to actual historical ENSO transition frequencies · IEA
Solar PV Forecasting / NREL Probabilistic Energy Forecasting — Monte Carlo P10/P50/P90/P99
exceedance framing matches standard lender/engineer probabilistic-yield practice.

## 9 · Future Evolution

### 9.1 Evolution A — Real observations in, real HMM decoding out (analytics ladder: rung 2 → 4)

**What.** §7.7 rates the statistical machinery among the most rigorous in its batch — Box-Muller MC, Bayesian Normal-Normal conjugate updates, closed-form OLS, and VaR/CVaR quantiles all verified textbook-exact. Two honest gaps: the "HMM" is a forward Markov-chain simulation with no emission/observation model (the guide's Viterbi/forward-backward claims are wrong — there is nothing to decode), and the Bayesian updater's "observations" are seeded noise around the prior, so the correct math runs on fabricated inputs in the demo path. Evolution A supplies the observations both components need: user production data and real climate indices.

**How.** (1) Production-data intake (monthly GWh per asset — shared with `renewable-asset-management`'s planned readings table) feeding the Bayesian update with genuine observations; the demo path stays but is labelled. (2) Make the HMM real: ingest the ONI (Oceanic Niño Index — free, monthly, NOAA) as the observation series, fit emission distributions per regime, and implement actual Viterbi decoding and forward-backward occupancy probabilities — the guide's claims become true rather than corrected away. The existing transition-matrix simulator survives as the projection layer, now initialised from a decoded state rather than a user guess. (3) Port the engine server-side (`POST /api/v1/re-forecast/*`) so bench_quant pins the Box-Muller percentiles and the conjugate-update posterior against hand calculations. (4) Backtesting (MAPE/skill scores, already implemented) runs against stored observations, making the reported skill real.

**Prerequisites.** ONI ingester (trivial format); production-data schema convergence with the asset-management sibling. **Acceptance:** Viterbi output over a known ONI segment matches published ENSO episode labels; posterior mean moves as real observations accumulate; pinned percentiles reproduce exactly.

### 9.2 Evolution B — Probabilistic-forecast interpreter for IC and lenders (LLM tier 2)

**What.** The module's outputs (exceedance percentiles, posterior distributions, regime probabilities) are exactly what non-quantitative stakeholders misread. The copilot translates: "explain to the investment committee what P90 = 812 GWh means for debt sizing, and how the current La Niña posterior shifts it", "why did the Bayesian update move our P50 down 3% after Q2 data?", each grounded in the engine's own decomposition (prior vs likelihood weights, regime-conditional sigmas) via tool calls.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; explanation templates grounded in §7.1's verified formulas so the copilot describes the actual mechanism (conjugate weighting of prior precision vs observation precision) rather than generic Bayesian hand-waving. What-ifs ("P90 under El Niño persistence") run as parameterised simulations. Guardrails: forecast-skill claims quote the backtest endpoint's MAPE/skill scores with their window; the copilot distinguishes simulated regime projections from decoded current state (the exact confusion the §7 flag documents in the guide itself — the copilot must be more careful than the guide was); no forecast is quoted without its uncertainty band.

**Prerequisites (hard).** Evolution A's observation layer — interpreting posteriors built on seeded noise would be statistically dressed fabrication; golden Q&A from pinned cases. **Acceptance:** every percentile/probability quoted matches a tool response; mechanism explanations reference the actual formula terms; skill claims carry the backtest window.