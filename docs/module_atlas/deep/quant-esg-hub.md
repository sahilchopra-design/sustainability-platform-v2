## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **ESG signal-construction and backtesting
> platform**: `S = α·ΔESG_momentum + β·ESG_level + γ·controversy_penalty`, signal IC 0.06, RepRisk
> NLP, 10-year backtest. **None of this exists.** The module is a **filter/sort/paginate screener**
> over 50 synthetic "strategies" whose every performance metric (Sharpe, alpha, beta, vol, ESG score,
> IC-like fields) is an **independent `sr()` draw**. There is no signal, no backtest, no information
> coefficient, no controversy pipeline. The KPI cards and charts are correct averages over fabricated
> data.

### 7.1 What the module computes

`genData(50)` builds 50 strategies; each field is a labelled random draw (`s(idx) = sr(i·idx+idx)`):

```js
sharpe    = 0.1 + s(31)·2.4        alpha  = −2 + s(37)·8        beta = 0.2 + s(41)·1.6
vol       = 3 + s(43)·22           maxDD  = −2 − s(47)·28       infoRatio = −0.5 + s(53)·2.5
esgScore  = 20 + s(59)·75          carbonInt = 10 + s(61)·490   turnover = 5 + s(67)·145
trackingError = 0.5 + s(71)·6.5    factorExp = −1 + s(73)·3     corrSP500 = 0.1 + s(79)·0.85
sortino/calmar, aum, ytdReturn, env/soc/govScore, q1..q4  — all further sr() draws
```

**Portfolio KPIs** (correct arithmetic on the seeded book): count, `avgSharpe`, `avgAlpha`, `avgVol`,
`totalAum`, `avgEsg` — simple means/sums over the filtered set. Charts: category distribution, risk
distribution, a 6-axis radar of averaged sub-scores, per-category performance, and a Q1–Q4 "trend"
(four independent draws averaged).

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| Strategy names | 50-name list | hand-authored (realistic ESG-strategy names) |
| category / sector / risk | `sr()` index into fixed lists | synthetic |
| sharpe / alpha / beta / vol | independent `sr()` ranges | **synthetic seeded** |
| esgScore / carbonInt | `sr()` ranges | synthetic |
| IC-like fields (infoRatio, factorExp) | `sr()` | synthetic; **no realised-return correlation** |
| q1–q4 | independent `sr()` | synthetic; not a time series |

Every metric is mutually independent — a strategy's Sharpe, alpha, beta, and vol bear no analytic
relationship (a real strategy's Sharpe ≈ (return−rf)/vol, which will not hold here).

### 7.3 Calculation walkthrough

1. `genData(50)` seeds 50 strategies from flat index.
2. Filters (search / category / sector / risk) subset; sort; paginate (12/page).
3. `kpis` averages Sharpe/alpha/vol/ESG, sums AUM over the filtered set.
4. Radar/category/trend charts re-aggregate the same seeded fields.

### 7.4 Worked example

No estimation pipeline to trace. For strategy i=1: `s(31) = sr(1·31+31) = sr(62)`. If `sr(62) ≈ 0.50`,
`sharpe = 0.1 + 0.50·2.4 = 1.30`. Independently, `s(43) = sr(86)`; if `≈0.30`, `vol = 3 + 0.30·22 =
9.6%`; `s(37)=sr(74)`; if `≈0.60`, `alpha = −2 + 0.60·8 = 2.8%`. Note that `alpha/vol = 0.29` bears no
relation to the drawn `sharpe = 1.30` — confirming the metrics are internally inconsistent noise.

### 7.5 Data provenance & limitations

- **All 50 strategies are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **No signal, backtest, or IC**: the guide's ESG-signal composite and information coefficient are
  absent — `infoRatio`/`factorExp` are random labels, not correlations with forward returns.
- Metrics are mutually independent, so risk-return identities (Sharpe, Calmar, Sortino) do not
  reconcile across a row.
- "Quarterly trend" is four independent draws, not a return series.
- Strategy names are real-flavoured (SFDR Art 9, Paris Aligned, Gender Lens) but attach to noise.

**Framework alignment:** The page name-checks **AQR ESG integration research** and **MSCI factor
research** as the intellectual backdrop. A real ESG factor platform (e.g. AQR/MSCI Barra) constructs a
signal, forms long-short quantile portfolios, and measures the **information coefficient** (rank
correlation of signal with forward return) and factor Sharpe over a backtest — none of which the code
performs. Genuine implementation requires §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Construct an ESG composite signal, backtest it as a long-short factor, and
report information coefficient, factor Sharpe, turnover, and IC decay, for a securities universe.

**8.2 Conceptual approach.** Standard **quant factor construction and evaluation**, mirroring (i) AQR
factor methodology and (ii) MSCI Barra factor research: z-score the signal cross-sectionally, form
quantile portfolios, and evaluate predictive power via IC and factor returns.

**8.3 Mathematical specification.**
Signal: `S_it = ωm·z(ΔESG_it) + ωl·z(ESG_it) − ωc·controversyPenalty_it`, weights ω summing to 1;
`z(·)` = cross-sectional standardisation at date t.
Factor return: `f_t = r̄_{top quintile,t+1} − r̄_{bottom quintile,t+1}` (dollar-neutral).
Information coefficient: `IC_t = rankCorr(S_·t, r_·,t+1)`; report mean IC and IC t-stat.
Factor Sharpe: `mean(f_t)/std(f_t)·√12`. Turnover: `Σ|w_{t}−w_{t−1}|/2`. IC decay: IC vs horizon h.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Signal weights | ωm,ωl,ωc | tune via CV; AQR-style priors |
| Controversy penalty | controversyPenalty | RepRisk RRI / Sustainalytics events |
| Quantiles | 5 | standard |
| Universe / horizon | – | 10-yr monthly (guide's stated design) |

**8.4 Data requirements.** ESG level + momentum (rating time series), controversy events, price
returns, sector. Sources: MSCI/Sustainalytics ratings, RepRisk, price feed. Platform holds none as
live data — only seeded constants.

**8.5 Validation & benchmarking.** Report IC, IC t-stat, factor Sharpe with confidence intervals;
compare to AQR/MSCI published ESG-factor results; guard against look-ahead (point-in-time ratings) and
data-mining (out-of-sample and multiple-testing adjustment).

**8.6 Limitations & model risk.** ESG-factor premia are weak and time-varying; ratings revisions cause
look-ahead bias. Conservative fallback: report OOS IC only, disclose universe and turnover, and never
present a Sharpe/IC without confidence bounds.
