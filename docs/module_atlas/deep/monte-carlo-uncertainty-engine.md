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
