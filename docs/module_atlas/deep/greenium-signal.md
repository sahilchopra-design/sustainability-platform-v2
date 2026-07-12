## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *greenium* engine — asset-swap-spread
> differential between a green bond and its matched conventional (`Greenium = ASW_conv − ASW_green`),
> matched-pair tables, cubic-spline curve interpolation. **None of that is in the code.** The page
> (EP-BD1) is a **5-model technical momentum signal ensemble** over 40 synthetic equity/ETF price
> series: it computes returns, vol-adjusted Sharpe, RSI, moving-average ratio and an ESG boost, then
> emits BUY/SELL/NEUTRAL with position sizing. "Greenium" survives only as a cosmetic field
> (`greenPremium = sr(i*23)*0.8 − 0.1`, unused in the signal). Sections below document the momentum
> ensemble that the code actually runs.

### 7.1 What the module computes

For each instrument a feature vector is built from its 90-day price history (`computeFeatures`):

```js
ret1/ret5/ret20 = price[n-1]/price[n-k] − 1          // 1/5/20-day momentum
vol20 = sqrt( mean(rets20²) )                         // 20-day realised vol
rsi   = al===0 ? 100 : 100 − 100/(1 + ag/al)          // 14-day RSI (Wilder-style, simple avg)
ma20, ma50 = simple moving averages
```

The 5-model ensemble (`generateSignal`) combines weighted sub-scores:

```js
m1 = (ret20>0.05 ? 0.6 : ret20<−0.05 ? −0.6 : ret20×8) × 0.25   // momentum/value
m2 = clamp(sharpe×2, −1, 1) × 0.30,  sharpe = ret20/vol20        // vol-adjusted
m3 = (rsi<30 ? 0.8 : rsi>70 ? −0.8 : (50−rsi)/50) × 0.20         // RSI mean-reversion
m4 = (maRatio>1.02 ? 0.5 : maRatio<0.98 ? −0.5 : 0) × 0.10       // MA-ratio "volume"
m5 = ((esg−50)/50) × 0.15                                        // ESG boost
composite = m1+m2+m3+m4+m5
signal = composite>0.15 ? BUY : composite<−0.15 ? SELL : NEUTRAL
confidence = min(1, |composite|/0.4)
```

### 7.2 Parameterisation / scoring rubric

| Model | Weight | Trigger logic | Provenance |
|---|---|---|---|
| M1 Momentum/Value | 0.25 | 20-day return, saturated at ±0.6 beyond ±5% | Standard momentum factor |
| M2 Vol-Adjusted Sharpe | 0.30 | ret20/vol20, ×2 then clamped ±1 | Sharpe-style risk-adjusted |
| M3 RSI Mean-Reversion | 0.20 | RSI<30 buy, >70 sell | Wilder RSI convention (14) |
| M4 Volume Confirmation | 0.10 | MA20/MA50 ratio (a *proxy*, not real volume) | MA crossover heuristic |
| M5 ESG Boost | 0.15 | (esg−50)/50, esg∈[30,95] | Platform ESG overlay |

Risk limits (constants): `MAX_POSITION_PCT = 5%`, `STOP_LOSS_PCT = 8%`, `MAX_SECTOR_CONC = 25%`.
Position size = `min(5, |score|×20)`; stop-loss = `last × (1 − 0.08)`.

### 7.3 Calculation walkthrough

`genUniverse(40)` builds each instrument: `genPrices(90, i*7, 50+sr(i*11)*200)` simulates a
90-step random walk with drift `(sr(seed+i)−0.48)×0.03` (a slight negative drift bias, −0.48 not
−0.50). Features → signal → position size. The 52-week `BACKTEST` is fully synthetic:
`cumReturn = i×0.42 + noise`, `benchmark = i×0.28 + noise`, so headline alpha ≈ (0.42−0.28)×52 ≈ +7.3
by construction. Sector exposure sums position sizes per sector against the 25% cap.

### 7.4 Worked example (one instrument)

Suppose features resolve to `ret20 = +0.08`, `vol20 = 0.04`, `rsi = 62`, `ma20/ma50 = 1.03`,
`esg = 80`:

| Model | Computation | Sub-score |
|---|---|---|
| m1 | ret20 > 0.05 → 0.6 × 0.25 | +0.150 |
| m2 | sharpe = 0.08/0.04 = 2.0 → clamp(4,±1)=1 × 0.30 | +0.300 |
| m3 | rsi 62 (30–70) → (50−62)/50 = −0.24 × 0.20 | −0.048 |
| m4 | maRatio 1.03 > 1.02 → 0.5 × 0.10 | +0.050 |
| m5 | (80−50)/50 = 0.6 × 0.15 | +0.090 |
| composite | sum | **+0.542** |
| signal | > 0.15 | **BUY** |
| confidence | min(1, 0.542/0.4) | **1.00** |
| position | min(5, 0.542×20) | **5.0%** (capped) |

Strong momentum + high Sharpe + ESG boost overwhelm the mild RSI drag → max-conviction BUY at the 5%
position cap.

### 7.5 Data provenance & limitations

- **Everything is synthetic.** Prices, volumes, ESG scores, the "greenium" field and the 52-week
  backtest all come from the `sr(seed)=frac(sin(seed+1)×10⁴)` PRNG. There are no real bonds, spreads,
  or ASW curves — despite the module name.
- The "Volume Confirmation" model uses an MA20/MA50 *ratio*, not the volume series it stores.
- The backtest's outperformance is hard-wired (0.42 vs 0.28 slope), not a re-run of the signal — it
  cannot be used to validate the ensemble.
- RSI uses simple (not exponential Wilder-smoothed) averages over exactly the last 14 deltas.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** (The code runs a momentum ensemble on
synthetic equities; the guide's greenium engine does not exist.)

**8.1 Purpose & scope.** Estimate and track the greenium — the yield/spread concession on labelled
green bonds vs matched conventional bonds — by issuer, sector, currency and maturity, to time green
issuance and identify secondary relative value.

**8.2 Conceptual approach.** Matched-pair asset-swap-spread differential with issuer-curve
interpolation, per ICMA Greenium WG and ECB OP 285 ("The Greenium Matters"); where no direct
conventional twin exists, fit the issuer's ASW term structure by (Nelson-Siegel or cubic spline) and
read the interpolated conventional ASW at the green bond's tenor — mirroring the German Bund green-twin
method and Bloomberg BVAL relative-value framework.

**8.3 Mathematical specification.**
```
For a green bond g with matched conventional c:  Greenium_g = ASW_c − ASW_g   (bps, usually <0)
No direct twin → fit issuer ASW curve:  ASW(τ) = NS(τ; β₀,β₁,β₂,λ)  (or cubic spline)
   Greenium_g = ASW_fit(τ_g) − ASW_g
Cross-sectional decomposition:  Greenium_i = α + β·Duration_i + Σ γ_s·Sector_s + δ·CertQuality_i + ε_i
Rolling σ (90-day) of the greenium series = supply/flow stress indicator
```

| Parameter | Source |
|---|---|
| ASW inputs (yield, swap curve) | Bloomberg BVAL / ICE |
| Green bond universe | ICMA registry / CBI database |
| Matched-pair criteria | issuer, seniority, currency, ±6m maturity, coupon type |
| Curve model | Nelson-Siegel β / spline knots |
| Benchmark greenium | ECB OP 285: EUR IG −4 to −8 bps; sovereign −2 to −5 |

**8.4 Data requirements.** Per-bond ISIN, ASW/z-spread, maturity, seniority, currency, green label +
certification (ICMA GBP / EU GBS / CBI), issuer curve. None currently exist on the page (synthetic
equities only); would need a bond reference-data feed.

**8.5 Validation.** Reconcile computed greenium against ECB OP 285 and Bloomberg Intelligence tracker
levels; back-test whether widening greenium precedes green issuance windows; stability test on
curve-fit residuals; matched-pair vs curve-interpolated agreement check.

**8.6 Limitations & model risk.** Matched pairs are scarce and illiquid → curve interpolation carries
model risk; greenium is small (single-digit bps) relative to bid-offer noise; certification quality
is hard to quantify. Conservative fallback: report matched-pair greenium only where a same-issuer twin
exists, flag interpolated estimates.

**Framework alignment:** ICMA Green Bond Principles / Greenium WG — greenium definition and matched-
pair method; ECB Occasional Paper 285 — empirical greenium benchmarks; Bloomberg BVAL — ASW pricing;
EU Green Bond Standard / CBI — the certification-quality control in the cross-sectional regression.
