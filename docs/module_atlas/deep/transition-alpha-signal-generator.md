## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a 3-factor linear alpha model
> `TAα = β₁×SBT + β₂×GreenCapex − β₃×StrandedAsset` with betas "estimated from historical return
> attribution." **The code does not implement this model.** There is no SBT-adoption, green-capex,
> or stranded-asset input anywhere in the file. Instead, the composite alpha score is a
> **user-adjustable weighted average of 8 unrelated ESG/transition signal scores** (Carbon
> Efficiency, Green Revenue Growth, Capex Alignment, Regulatory Risk, Physical Risk Management,
> Engagement Score, Disclosure Quality, Supply Chain Risk), none of which is estimated via
> regression — they are independently seeded random numbers. The sections below document the code
> as it actually behaves.

### 7.1 What the module computes

150 synthetic securities are generated with 8 independent 0–100 "signal" scores per security.
The headline composite is a **linear weighted average**, not a regression-estimated factor model:

```
compositeAlpha = Σᵢ normWeight_i × signal_i        (i = 1..8, weights user-adjustable, default equal 12.5% each)
IC-weighted alternative = Σᵢ (SIGNAL_IC_i / ΣIC) × signal_i
```

### 7.2 Parameterisation

| Element | Formula / range | Provenance |
|---|---|---|
| 8 signal names | Carbon Efficiency, Green Rev Growth, Capex Alignment, Regulatory Risk, Phys Risk Mgmt, Engagement Score, Disclosure Quality, Supply Chain Risk | Platform-defined transition-signal taxonomy, loosely modelled on real quant-ESG factor families (MSCI, Robeco) |
| Signal scores | `sr(i×(si+3)+si×11+2)×100` per security/signal | Synthetic demo value, 0–100 |
| `SIGNAL_IC` | `sr(i×13+77)×0.16+0.02` → 0.02–0.18 | Synthetic per-signal Information Coefficient; the 0.02–0.18 range is realistic for real-world equity factors (typical monthly IC 0.02–0.10 is considered good) but the specific numbers are not fitted from data |
| `SIGNAL_HALF_LIFE` | `⌊sr(i×17+88)×21+3⌋` → 3–24 months | Synthetic signal-decay half-life |
| `backtestedReturn` | `sr(i×31+15)×0.12−0.04` → −4% to +8% | Synthetic per-security backtested return, independent of the security's own signal scores |
| `tStatistic` | `sr(i×37+17)×3+0.5` → 0.5–3.5 | Synthetic; not derived from the backtested return series shown alongside it |
| `informationRatio` | `sr(i×41+19)×0.8+0.1` → 0.1–0.9 | Synthetic |
| `weight` (portfolio) | `sr(i×53+23)×0.015+0.001` → 0.1%–1.6% | Synthetic per-security portfolio weight, not market-cap or float-based |

### 7.3 Calculation walkthrough

1. **Composite alpha**: signal weights (default equal at 12.5% each, user-adjustable via sliders)
   are normalised to sum to 1, then dot-producted with the security's 8 signal scores.
2. **IC-weighted score** (alternate view): weights each signal by its `SIGNAL_IC / ΣIC` instead of
   the user slider — i.e. two different weighting schemes exist on the page and are not required to
   agree.
3. **Quartile long/short construction**: securities sorted by `compositeAlpha`; Q1 (top quartile)
   forms the long book, Q4 (bottom quartile) the short book if `longShortToggle` is on. Book weights
   renormalise each quartile's `weight` field to sum to 1 within the quartile.
4. **Backtest statistics**: `BACKTEST_DATA` is a single, portfolio-level 60-month synthetic series
   (2020–2025) built by cumulative-summing `monthly = sr(i×7+3)×0.03−0.008` (mean ≈ +1% monthly);
   Sharpe is then computed properly from that series: `mean/std × √12`, and max drawdown as
   `min(cumAlpha_t − running_max)` — the Sharpe/drawdown arithmetic itself is correct, but the
   underlying monthly returns are random, not attributable to the signal universe.
5. **Signal decay curves**: `IC(m) = SIGNAL_IC × 0.5^(m/half_life)` — a textbook exponential-decay
   formula (used correctly), applied to the synthetic IC/half-life pair per signal.
6. **Sensitivity ("what-if ±10%")**: `contrib × (1 ± 0.1/w)` for each signal's weight — flexes each
   signal weight by 10 percentage points (of its own weight) and re-reports the filtered
   sub-portfolio's average signal value.

### 7.4 Worked example (Security #1, `i=0`)

| Field | Computation | Result |
|---|---|---|
| Sector | `⌊sr(1)×9⌋=8` | **Real Estate** |
| Signal scores (8) | `sr(si×11+2)×100`, si=0..7 | 20.0, 7.4, 48.2, 21.1, 73.1, 72.6, 15.2, 11.3 |
| Composite alpha (equal weights) | mean of the 8 | **33.6** |
| Prior-period alpha | independent PRNG draw, mean of 8 | **43.5** |
| 6-month momentum | `33.6 − 43.5` | **−9.9** |
| Backtested return | `sr(15)×0.12−0.04` | **+7.6%** |
| t-statistic | `sr(17)×3+0.5` | **0.88** (not significant at conventional thresholds) |
| Information ratio | `sr(19)×0.8+0.1` | **0.46** |
| Signal half-life | `⌊sr(21)×21+3⌋` | **13 months** |
| Signal-0 IC(t=6) | `IC₀=0.1455 × 0.5^(6/17)` | **0.114** |

### 7.5 Companion analytics

- **Factor Analysis tab** — displays `SIGNAL_IC`/`SIGNAL_HALF_LIFE` bar charts and the decay curves;
  a genuine exponential-decay computation, but over synthetic IC inputs.
- **Portfolio Construction** — long/short quartile books with sector-tilt aggregation (`Σ portWeight`
  by sector for long vs short legs).
- **Backtesting Results** — cumulative alpha, monthly alpha, and drawdown chart from the single
  synthetic 60-month series, with Sharpe recomputed live per selected lookback (`btPeriods`).
- **Signal Decay Analysis** — table of IC at 6/12/24 months per signal using the half-life decay
  formula.

### 7.6 Data provenance & limitations

- **All data is synthetic demo data**, generated by `sr(s)=frac(sin(s+1)×10⁴)` for security-level
  fields and the same PRNG for the shared 60-month backtest series. No real market prices, company
  fundamentals, or ESG scores are ingested.
- **No econometric estimation exists anywhere in the module.** The guide's claim of "β coefficients
  estimated from historical return attribution" describes a real quant-factor workflow (panel
  regression of forward returns on lagged signal exposures) that this module does not perform — the
  signal-to-alpha mapping is a user-set linear weight, and the IC/half-life "estimates" are
  themselves random draws, not computed from the backtest series.
- The backtest, t-statistics, and information ratios shown per security are **statistically
  disconnected** from that security's own signal scores — a security with low signal scores can
  show a high `informationRatio` because the two are independently seeded.
- Signal decay (`IC(m)=IC₀×0.5^(m/half-life)`) is the one genuinely correct piece of applied
  quant-finance math in the module — it is the standard textbook exponential half-life decay
  formula, just applied to fabricated IC/half-life inputs.

### 7.7 Framework alignment

- **MSCI ESG Alpha Research** / **Robeco Sustainability Inside** (cited in the guide): both are real
  published studies on ESG/transition factor premia; the module borrows their conceptual framing
  (transition signals should predict abnormal returns) but does not replicate either paper's
  estimation methodology.
- **Information Coefficient (IC) and half-life decay**: standard quantitative-equity concepts
  (Grinold & Kahn, *Active Portfolio Management*) correctly implemented as formulas, but calibrated
  to synthetic rather than empirically fitted values.
- **Quartile long/short construction**: standard factor-investing portfolio construction technique,
  correctly implemented as a ranking-and-bucketing operation.
