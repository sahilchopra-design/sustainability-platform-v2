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
