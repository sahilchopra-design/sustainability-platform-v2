# Transition Alpha Signal Generator
**Module ID:** `transition-alpha-signal-generator` · **Route:** `/transition-alpha-signal-generator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Generates equity alpha signals from ESG transition indicators including SBT adoption, green capex, stranded asset exposure and climate policy sensitivity; back-tests signals against historical equity returns.

> **Business value:** MSCI research shows climate-aware equity strategies generated +1.8% annual alpha vs conventional benchmarks over 2016–2023, with the SBT adoption signal showing strongest statistical significance.

**How an analyst works this module:**
- Construct transition factor universe from ESG and fundamental data
- Estimate factor loadings via panel regression on historical returns
- Generate forward-looking alpha scores by company
- Back-test long-short signal portfolio with transaction costs
- Integrate signal into portfolio construction process

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTEST_DATA`, `COUNTRIES_TA`, `DECAY_CURVES`, `KpiCard`, `SECURITIES`, `SIGNAL_COLORS`, `SIGNAL_HALF_LIFE`, `SIGNAL_IC`, `SIGNAL_KEYS`, `SIGNAL_NAMES`, `TABS`, `TA_SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `TA_SECTORS[Math.floor(sr(i * 7 + 1) * TA_SECTORS.length)];` |
| `signals` | `SIGNAL_KEYS.map((k, si) => +(sr(i * (si + 3) + si * 11 + 2) * 100).toFixed(1));` |
| `alpha` | `signals.reduce((s, x) => s + x, 0) / signals.length;` |
| `prevAlpha` | `signals.reduce((s, x, si) => s + sr(i * (si + 5) + si * 13 + 3) * 100, 0) / signals.length;` |
| `btRet` | `sr(i * 31 + 15) * 0.12 - 0.04;` |
| `tStat` | `sr(i * 37 + 17) * 3 + 0.5;` |
| `halfLife` | `Math.floor(sr(i * 43 + 21) * 21 + 3);` |
| `SIGNAL_IC` | `SIGNAL_KEYS.map((k, i) => +(sr(i * 13 + 77) * 0.16 + 0.02).toFixed(4));` |
| `SIGNAL_HALF_LIFE` | `SIGNAL_KEYS.map((k, i) => Math.floor(sr(i * 17 + 88) * 21 + 3));` |
| `DECAY_CURVES` | `SIGNAL_KEYS.map((k, ki) => {` |
| `monthly` | `sr(i * 7 + 3) * 0.03 - 0.008;` |
| `normWeights` | `useMemo(() => { const sum = signalWeights.reduce((s, w) => s + w, 0);` |
| `scoredSecurities` | `useMemo(() => { return SECURITIES.map(s => { const signals = SIGNAL_KEYS.map(k => s[k]);` |
| `composite` | `signals.reduce((acc, v, i) => acc + normWeights[i] * v, 0);` |
| `sorted` | `useMemo(() => [...scoredSecurities].sort((a, b) => b.compositeAlpha - a.compositeAlpha), [scoredSecurities]);` |
| `alphaDist` | `useMemo(() => { const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));` |
| `icTotalWeight` | `SIGNAL_IC.reduce((s, x) => s + x, 0);` |
| `ic_score` | `SIGNAL_KEYS.reduce((acc, k, i) => acc + (SIGNAL_IC[i] / (icTotalWeight \|\| 1)) * s[k], 0);` |
| `longPortfolio` | `useMemo(() => { const tw = q1.reduce((s, x) => s + x.weight, 0);` |
| `shortPortfolio` | `useMemo(() => { const tw = q4.reduce((s, x) => s + x.weight, 0);` |
| `lsPortfolio` | `useMemo(() => longShortToggle ? [...longPortfolio, ...shortPortfolio] : longPortfolio, [longShortToggle, longPortfolio, shortPortfolio]);  const sectorTilts = useMemo(() => { return TA_SECTORS.map(sec => { const lw = lsPortfolio.filter(s => s.sector === sec).reduce((s, x) => s + x.portWeight, 0);` |
| `btSlice` | `BACKTEST_DATA.slice(Math.max(0, BACKTEST_DATA.length - (btPeriods[backtestPeriod] \|\| 60)));` |
| `returns` | `btSlice.map(d => d.monthlyAlpha / 100);` |
| `mean` | `returns.reduce((s, x) => s + x, 0) / returns.length;` |
| `std` | `Math.sqrt(returns.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (returns.length \|\| 1));` |
| `sharpe` | `std > 0 ? mean / std * Math.sqrt(12) : 0;` |
| `maxDd` | `Math.min(...btSlice.map(d => d.drawdown));` |
| `ic6` | `+(ic0 * Math.pow(0.5, 6 / hl)).toFixed(4);` |
| `ic12` | `+(ic0 * Math.pow(0.5, 12 / hl)).toFixed(4);` |
| `ic24` | `+(ic0 * Math.pow(0.5, 24 / hl)).toFixed(4);` |
| `avgA` | `sh.reduce((s, x) => s + x.compositeAlpha, 0) / sh.length;` |
| `maxA` | `Math.max(...sh.map(x => x.compositeAlpha));` |
| `minA` | `Math.min(...sh.map(x => x.compositeAlpha));` |
| `avgIR2` | `sh.reduce((s, x) => s + x.informationRatio, 0) / sh.length;` |
| `avgBT` | `sh.reduce((s, x) => s + x.backtestedReturn, 0) / sh.length * 100;` |
| `avgT` | `sh.reduce((s, x) => s + x.tStatistic, 0) / sh.length;` |
| `avgMom` | `sh.reduce((s, x) => s + x.momentum6M, 0) / sh.length;` |
| `contrib` | `filtered.length > 0 ? w * filtered.reduce((s, x) => s + x[SIGNAL_KEYS[i]], 0) / filtered.length : 0;` |
| `plus10` | `contrib * (1 + 0.1 / (w \|\| 0.001));` |
| `minus10` | `contrib * (1 - 0.1 / (w \|\| 0.001));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_TA`, `SIGNAL_COLORS`, `SIGNAL_KEYS`, `SIGNAL_NAMES`, `TABS`, `TA_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Signal Sharpe Ratio | — | Backtest Engine | Risk-adjusted return of long-short transition alpha portfolio over 5-year backtest period. |
| 12-Month Forward Alpha | — | Factor Model | Predicted alpha from current factor exposures vs benchmark over next 12 months. |
| Factor Correlation to Mkt | — | Factor Analytics | Low market β of transition factor; provides diversified alpha uncorrelated to broad market. |
- **Company ESG Data, Financial Fundamentals, Price Returns History** → Factor construction + panel regression + backtest engine → **Alpha signal scores, factor performance attribution, portfolio integration reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Alpha Factor
**Headline formula:** `TAα = β₁ × SBT + β₂ × GreenCapex – β₃ × StrandedAsset`

Multi-factor linear combination of positive (SBT adoption, green capex) and negative (stranded assets) transition signals; β coefficients estimated from historical return attribution.

**Standards:** ['MSCI ESG Alpha Research 2023', 'Robeco Sustainability Inside 2022']
**Reference documents:** MSCI ESG Alpha Research Series 2023; Robeco Sustainability Inside 2022; PRI Academic Network ESG Factors in Equity Pricing; AQR Fact, Fiction and ESG Investing

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real factor estimation on ingested returns and signals (analytics ladder: rung 1 → 4)

**What.** The §7 flag: the guide's `TAα = β₁×SBT + β₂×GreenCapex − β₃×StrandedAsset` with betas "estimated from historical return attribution" is not implemented — there are no SBT/green-capex/stranded-asset inputs, the composite is a user-weighted average of 8 independently `sr()`-seeded signals, and the per-security backtest returns, t-stats, and information ratios are statistically disconnected from the very signals they claim to evaluate (§7.6). The one correct piece is the IC exponential-decay formula (`IC(m)=IC₀×0.5^(m/half-life)`), applied to fabricated inputs. This module claims predictive analytics (rung 4) while sitting at rung 1 fabrication.

**How.** (1) Ingest real inputs: company signal scores from the platform's ESG/fundamental data and price-return history (market-data ingesters exist per the roadmap's rung-4 note that "the 19 ingesters provide the time series"). (2) Actually estimate factor loadings: panel regression of forward returns on lagged signal exposures (statsmodels, already in the environment) — betas become fitted coefficients with standard errors, not user sliders. (3) Compute IC and half-life from the realised signal-return relationship, not random draws — then the decay curves describe something real. (4) Build a genuine backtest: rank on the estimated composite, form quartile long/short books, compute Sharpe/drawdown from actual realised returns (the Sharpe arithmetic is already correct, §7.3 — it just needs real returns). (5) Model card per Atlas §8 (rung-4 regulatory-defensibility requirement).

**Prerequisites (hard).** This is the platform's most fabrication-heavy module — every `sr()`-seeded signal, IC, backtest, and t-stat must be deleted, exactly what `check_no_fabricated_random.py` polices; a genuine returns panel and signal history are the real build. **Acceptance:** betas carry regression standard errors; reported ICs reproduce from the signal-return panel; a security's backtest stat derives from its own signal exposure, not an independent seed.

### 9.2 Evolution B — Quant-signal research copilot with tool-called backtests (LLM tier 2)

**What.** A copilot for a quant PM: "which transition signal has the highest IC net of decay?", "backtest an SBT-tilted long/short over 2018–2024 with 20bps costs", "why is the composite's t-stat only 0.9?" — answered from real factor statistics and executed backtests, never from generated numbers.

**How.** Strictly gated on Evolution A: until real estimation exists, a tool-calling copilot over this module would launder random IC/t-stat values into authoritative-sounding quant claims — the worst outcome for a signal-generation tool whose entire value is statistical credibility. Post-Evolution-A, tool schemas derive from the backtest/estimation endpoints (the module has no backend today — EP code None — so the routes are built in Evolution A); grounding corpus is this Atlas record plus the fitted model card. The no-fabrication validator is essential here: every Sharpe, IC, and beta in an answer must trace to a tool call, with the "show work" expander exposing the regression window and return series (roadmap Tier-2 provenance UX). The copilot refuses forward-alpha point predictions without their confidence interval — a signal tool that quotes alpha without error bars is precisely the failure the platform's honest-nulls convention guards against.

**Prerequisites (hard).** Evolution A end-to-end plus a `bench_llm.py` adversarial probe ("what's the exact alpha of security X?" → must return with CI or refuse). **Acceptance:** every statistic traces to a tool output; no point alpha appears without its standard error; questions answerable only from fabricated fields (pre-Evolution-A) are refused.