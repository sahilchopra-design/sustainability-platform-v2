## 7 · Methodology Deep Dive

### 7.1 What the module computes

25 real named large-caps (`RAW_COMPANIES` — ExxonMobil, JPMorgan, Microsoft, Unilever, etc.) each get 6
synthetic factor-signal scores (`SIGNALS`: ESG Momentum, Controversy Reversal, Disclosure Quality,
Greenwashing Reversal, SBTi Initiator, Narrative Tone Shift), generated via `sr(s)=frac(sin(s+1)×10⁴)`. Each
signal also carries a **separately hardcoded** headline `ic` (information coefficient) and `sharpe` figure
in the static `SIGNALS` array, independent of the Monte-Carlo-style backtest built by `buildBacktest`:

```js
score      = round(sr(seed)×80 + 10)                         // 10–90
direction  = score>60 ? 'long' : score<35 ? 'short' : 'neutral'
ret1m/3m/6m = (sr(seed+n) − c) × scale                        // per-signal simulated forward returns
```

`buildBacktest(sigId, sigIdx)` independently simulates 72 months (2020–2025) of long/short/long-short
returns and compounds them into cumulative return paths, then computes standard portfolio statistics.

### 7.2 Parameterisation

| Signal | Static `ic` | Static `sharpe` | Status |
|---|---|---|---|
| SBTi Initiator | 0.165 | 1.34 | Active |
| ESG Momentum | 0.142 | 1.18 | Active |
| Disclosure Quality | 0.118 | 0.91 | Active |
| Narrative Tone Shift | 0.109 | 0.88 | Active |
| Controversy Reversal | 0.097 | 0.74 | Active |
| Greenwashing Reversal | 0.083 | 0.61 | **Paused** |

These headline IC/Sharpe figures are **fixed constants set once in the `SIGNALS` array**, not computed —
they are illustrative of what a real IC/Sharpe range for ESG-alpha factors looks like in published
literature (typical published ESG factor ICs range ~0.02–0.15), but are not derived from the page's own
`buildBacktest` simulation.

| Backtest return construction | Formula |
|---|---|
| Benchmark monthly return | `(sr(seed) − 0.48) × 0.06` → ≈ ±3% monthly |
| Long return | `benchRet + (sr(seed+1) − 0.42)×0.04 + 0.3%` → long book beats benchmark by a small positive skew |
| Short return | `−(benchRet + (sr(seed+2) − 0.52)×0.03)` → short book profits when benchmark falls |
| Long-short return | `longRet + shortRet` |

The `−0.42`/`−0.52` offset constants (rather than `−0.5`) bias the long book to a positive mean and the
short book to a slightly negative mean by construction — i.e. **the backtest is seeded to produce a
profitable long-short strategy for every signal**, not to test whether it is profitable.

### 7.3 Calculation walkthrough

1. For each of the 6 signals, 72 monthly returns are simulated and compounded: `longCum *= (1+longRet)`,
   similarly for `shortCum`, `lsCum`, `benchCum` — producing 4 parallel cumulative-return series.
2. **Risk statistics** computed directly from the simulated `lsReturns` series:
   ```js
   mean = Σ lsReturns / N;  std = sqrt(Σ(r-mean)² / N)
   ann  = mean × 12;         annS = std × √12                    // annualised return & vol
   sortS = neg.length ? std / (sqrt(mean(neg²)) × √12) : 0        // labelled "Sortino" but uses std, not mean, as numerator
   maxDD = −|sr(sigIdx×3+1)×0.12 + 0.05|                          // independently random, NOT derived from the cumulative path
   ```
   **Two issues worth flagging**: (a) `sortS` divides *total volatility* (`std`) by annualised downside
   deviation — the standard Sortino ratio divides *annualised excess return* (`ann − MAR`) by downside
   deviation, so this metric is mislabelled/miscalculated relative to its name; (b) `maxDD` is drawn from an
   independent `sr()` call rather than computed from the actual `lsCum` path minimum, so the displayed max
   drawdown is not guaranteed to be consistent with the cumulative return chart shown alongside it.
3. **Factor Overlay / FF5 loadings** (`FF5_FACTORS`: Market, SMB, HML, RMW, CMA) — per-signal factor
   loadings and an `alpha`/`alphaTstat` are computed as `sig.ic×0.8 + sr()×0.04` and
   `sr()×2+1.5` respectively — i.e. **alpha is partly derived from the static `ic` constant** (§7.2), giving
   a thin causal link between the headline table and the Fama-French decomposition, but the t-stat is purely
   random.
4. **Composite scoring / long-short portfolio construction** — `longPort`/`shortPort` are the top/bottom 10
   companies by a signal's `score`; portfolio weights are the raw scores (`totalLongWt`) and
   `100 − score` for shorts (`totalShortWt`) — an equal-ish, score-proportional weighting, not
   mean-variance optimised.

### 7.4 Worked example

ESG Momentum signal, one simulated month: `benchRet ≈ 1.2%`, `longRet ≈ benchRet + 0.9% + 0.3% = 2.4%`,
`shortRet ≈ −(benchRet + 0.4%) = −1.6%`, `lsRet = 2.4% − 1.6% = 0.8%`. Compounding 72 such months typically
produces a positive `lsCum` because of the systematic `−0.42`/`−0.52` bias in §7.2 — this is a designed
demo outcome, not a genuine backtested edge.

Sortino computation for a hypothetical signal: `std=1.8%`, downside deviation (annualised) `=4.5%` →
`sortS = 1.8/4.5 = 0.40` — note this number is **not** an excess-return-to-downside-risk ratio as the
Sortino name implies; a real Sortino using `ann=9.6%` would instead be `9.6/4.5=2.13`, a materially
different (and more standard) figure.

### 7.5 Companion analytics on the page

- **IC decay / IC stability tabs** — `icDecayData` across `IC_HORIZONS`, and 72-month rolling IC series per
  signal (`icStability`), both `sr()`-seeded independent of the backtest returns.
- **Transaction-cost impact** (`tcImpact`) — derives a "net Sharpe after costs" from `sig.sharpe` (the
  static constant), not from the simulated backtest's own computed Sharpe (`ann/annS`), so the two Sharpe
  figures shown on the page (static-table Sharpe vs. backtest-computed Sharpe) can diverge for the same
  signal.

### 7.6 Data provenance & limitations

- **All company signal scores, monthly returns, and factor loadings are synthetic**, generated by
  `sr(seed)=frac(sin(seed+1)×10⁴)`; company names/tickers/market caps are real-world illustrative anchors,
  not live market data.
- **The backtest is constructed to succeed**: the `−0.42`/`−0.52` mean offsets in the long/short return
  formulas guarantee a positive expected long-short return for every signal, so the "backtest" cannot fail
  or demonstrate a signal with negative alpha — a genuine backtesting tool must allow for signals that don't
  work.
- **The Sortino ratio formula is non-standard** (uses total std rather than mean/excess-return as the
  numerator) — see §7.3(a). `maxDD` is independently randomised rather than computed from the actual
  cumulative-return path — see §7.3(b).
- **Two disconnected sources of truth for Sharpe/IC** exist on the page: the static `SIGNALS[].ic`/`.sharpe`
  constants, and the live-computed `ann/annS` from `buildBacktest` — they are not reconciled.

**Framework alignment:** the signal taxonomy (ESG Momentum, Controversy Reversal, Disclosure Quality
Improvement, Greenwashing Reversal, SBTi-commitment early-mover, NLP-derived Narrative Tone) reflects
genuine, published categories of ESG/sentiment alpha research (AQR, MSCI Barra factor literature cited in
the guide) · Fama-French 5-factor model (Market, SMB, HML, RMW, CMA) is the correct, standard academic
factor set used for the attribution decomposition · Information Coefficient and annualised Sharpe/Sortino
are the correct standard quant metrics for factor evaluation, though as noted above the Sortino
implementation and the maxDD sourcing deviate from their standard definitions in this specific
implementation.
