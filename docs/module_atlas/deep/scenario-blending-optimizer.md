## 7 · Methodology Deep Dive

This module implements a genuine, if simplified, **single-observation Bayesian Model Averaging**
(BMA) over the 5 NGFS scenarios — a real posterior-weighting calculation, not PRNG fabrication for
the headline weights (though the underlying scenario emissions paths themselves are seeded).

### 7.1 What the module computes

```
likelihood_k = exp(-|scenario_k.value(2025) - lastObserved| x 0.8)     // per NGFS scenario k
posteriorWeight_k = likelihood_k / Sum(likelihood_j for all j)          // normalised to sum to 1
blendedPath(year) = Sum(SCENARIO_PATHS[k][year].value x posteriorWeight_k)   // weighted blend
compositeTemp = Sum(NGFS[k].temp2100 x bmaWeights[k])
```
This is a correct application of Bayesian Model Averaging's core mechanic: `P(scenario|data) ∝
Likelihood(data|scenario) × Prior(scenario)`, with an implicit **uniform prior** (all 5 scenarios
equally likely a priori) and a **Laplace-kernel likelihood** based on the absolute distance between
each scenario's 2025 emissions projection and the last real observed data point.

### 7.2 Parameterisation

| Component | Value | Provenance |
|---|---|---|
| `OBSERVED_EMISSIONS` (2015-2025) | 36.2 → 38.1 GtCO2/yr | Plausible real-world global CO2 emissions trajectory (broadly consistent with actual Global Carbon Project figures, including the real 2020 COVID dip to 35.4Gt) — reasonable reference data, not independently verified line-by-line against GCP's published series |
| `SCENARIO_PATHS` | 5 NGFS scenario paths, 2025-2060, generated via `base + slope×i + noise` | `base=38` (2025 starting point matches the last observed year), `slope` per scenario: CP +0.25/yr (still rising), DT -0.15/yr, B2C -0.55/yr, DNZ -0.72/yr, NZ50 -0.95/yr (steepest decline) — directionally correct ordering (more ambitious scenarios decline faster), slopes are illustrative not fitted to actual NGFS model output |
| Likelihood kernel | `exp(-diff × 0.8)` | Reasonable functional form (higher likelihood for scenarios closer to observed data) but the `0.8` decay constant is an author choice, not derived from an estimated observation-noise variance |
| NGFS scenario table | `temp2100`, `carbonPrice2050`, `emPeak`, `gdpLoss` per scenario | Real NGFS Phase-consistent scenario characteristics (CP 3.0C/2030 peak, NZ50 1.5C/2023 peak — directionally correct ordering matching actual NGFS Phase IV scenario definitions) |

### 7.3 Calculation walkthrough

1. `computeBMAWeights(observed)` takes only the **single most recent** observed data point
   (`lastObs = observed[observed.length-1].obs`, i.e. 2025's 38.1 GtCO2) and compares it against
   each scenario's **single** 2025 projected value — a one-point likelihood evaluation, not a
   full-series likelihood over all 11 observed years (2015-2025). A more rigorous BMA would
   accumulate log-likelihood across the entire observed history.
2. `diff = |scenario.value(2025) - lastObs|`; `likelihood = exp(-diff × 0.8)` — an exponentially
   decaying weight, so scenarios whose 2025 projection nearly matches the observed 38.1 Gt get
   much higher posterior weight than scenarios that diverge.
3. `weights[k] = likelihood_k / Σlikelihood` — correct normalisation, guaranteeing weights sum to
   1.0 (a defining BMA property).
4. `blendPaths(weights)` produces a probability-weighted composite emissions trajectory through
   2060, plus retains each individual scenario path for comparison.
5. **Custom Blend Builder** tab lets a user override the BMA weights directly (`customWeights`,
   auto-normalised via `customNorm = w / Σw`), producing a user-defined blend for scenario
   exploration independent of the data-driven posterior.

### 7.4 Worked example

If each scenario's 2025 projected value (illustrative, from `generateScenarioPath` noise) is:
CP=38.05, DT=37.98, B2C=37.85, DNZ=37.80, NZ50=37.75, and `lastObs=38.1`:
```
diff_CP=0.05, diff_DT=0.12, diff_B2C=0.25, diff_DNZ=0.30, diff_NZ50=0.35
likelihood_CP  = exp(-0.05x0.8) = exp(-0.04) = 0.9608
likelihood_DT  = exp(-0.12x0.8) = exp(-0.096) = 0.9085
likelihood_B2C = exp(-0.25x0.8) = exp(-0.20) = 0.8187
likelihood_DNZ = exp(-0.30x0.8) = exp(-0.24) = 0.7866
likelihood_NZ50= exp(-0.35x0.8) = exp(-0.28) = 0.7558
totalLike = 0.9608+0.9085+0.8187+0.7866+0.7558 = 4.2304
weight_CP  = 0.9608/4.2304 = 22.7%
weight_DT  = 0.9085/4.2304 = 21.5%
weight_B2C = 0.8187/4.2304 = 19.4%
weight_DNZ = 0.7866/4.2304 = 18.6%
weight_NZ50= 0.7558/4.2304 = 17.9%
```
This illustrates a key limitation: because emissions are currently still near their historical
peak, the "Current Policies" scenario (still rising) gets the **highest** posterior weight under
this single-point likelihood test — matching the guide's cited "CP:32%" as the largest weight
component (exact split depends on the precise noise realisation).

### 7.5 Data provenance & limitations

- The BMA weighting mechanism itself is genuinely and correctly implemented (proper likelihood-to-
  posterior normalisation).
- It evaluates only a **single observed data point** (the latest year) rather than the full 11-year
  observed series, which is a meaningful simplification — a rigorous implementation (as in Raftery
  et al.'s BMA methodology, cited in the guide) would accumulate likelihood contributions across
  the whole time series, making the posterior far more discriminating and stable year-to-year.
- The likelihood decay constant (`0.8`) is not derived from an estimated observation-error variance
  — a real implementation would calibrate this from the historical residual spread between
  scenario projections and realised emissions.
- `SCENARIO_PATHS` themselves are generated via a linear trend + small PRNG noise, not sourced from
  actual NGFS/IIASA scenario-database model output — the *shapes* are directionally correct but not
  the literal published NGFS trajectories.

**Framework alignment:** Raftery et al. Bayesian Model Averaging methodology (core weighting
mechanic correctly implemented, single-point rather than full-series likelihood) · NGFS Phase-
consistent scenario characteristics (temp2100/carbonPrice2050/emPeak/gdpLoss values directionally
accurate) · Global Carbon Project observed emissions (plausible reference series, not verified
against the live GCP dataset).
