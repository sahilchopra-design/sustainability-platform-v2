## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide defines a single *Climate Pulse Score*
> `P = 0.4·PhysRisk + 0.4·TransRisk + 0.2·CarbonIntensity`. **No such composite score is computed
> anywhere in the page.** The dashboard instead reports five *weight-averaged* portfolio metrics
> (wITR, WACI, physVaR, transVaR, avgGreenRev) over 150 `sr()`-seeded holdings. The tier-A backend
> (`portfolio_analytics_engine.py`, a real PCAF/WACI engine over Postgres assets) is **not invoked by
> this page** — the frontend is self-contained synthetic data. §8 specifies the composite the guide
> promises.

### 7.1 What the module computes

For 150 synthetic holdings, portfolio KPIs are exposure-weighted means (weight `h.weight`, total
`totalW`):

```js
wITR    = Σ h.itr·h.weight / totalW                     // implied temperature rise (°C)
waci    = Σ h.carbonIntensity·h.weight / totalW         // WACI (tCO2e/$M)
physVaR = Σ h.physicalRiskScore·h.weight / totalW       // mean physical score (0–100)
transVaR= Σ h.transitionRiskScore·h.weight / totalW     // mean transition score (0–100)
avgGreenRev = Σ h.greenRevenuePct·h.weight / totalW     // green revenue %
```

All are guarded `totalW > 0 ? … : 0`. Scope emissions per holding are back-derived from carbon
intensity and market cap:
```js
scope1 = carbonIntensity · 0.30 · marketCapBn · 0.01
scope2 = carbonIntensity · 0.20 · marketCapBn · 0.01
scope3Up = scope3Dn = carbonIntensity · 0.25 · marketCapBn · 0.01     // 30/20/25/25 split
```

A decarbonisation pathway compares Paris/budget/actual glidepaths:
```js
parisTarget = baseCI·(1 − reduction·0.95)   // near-full decarbonisation
budget      = baseCI·(1 − reduction·0.85)
actual      = baseCI·(1 − reduction·0.45)   // portfolio lags target
```

### 7.2 Parameterisation / seed rubric

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `carbonIntensity` | `10 + sr(i·13)·990` | 10–1000 tCO2e/$M | synthetic demo value |
| `physicalRiskScore` | `sr(i·17)·100` | 0–100 | synthetic demo value |
| `transitionRiskScore` | `sr(i·19)·100` | 0–100 | synthetic demo value |
| `itr` | `1.3 + sr(i·23)·3.2` | 1.3–4.5 °C | synthetic; plausible ITR band |
| `greenRevenuePct` | `sr(i·29)·60` | 0–60 % | synthetic demo value |
| `weight` | `RAW_WEIGHTS[i]/TOTAL_W·100`, `RAW_WEIGHTS = sr(i·7+1)+0.1` | Σ=100 % | synthetic; normalised |
| `marketCapBn` | `0.5 + sr(i·31)·499` | $0.5–500B | synthetic demo value |
| scope 1/2/3 | derived 30/20/25/25 of `CI·mktCap·0.01` | — | heuristic split, not GHG-Protocol |

The 30/20/25/25 scope split is a fixed heuristic applied to *every* holding regardless of sector — a
utility and a bank get the same scope mix, which is unrealistic (banks are ~99 % Scope 3).

### 7.3 Calculation walkthrough

1. `RAW_WEIGHTS` seeded then normalised so `Σ weight = 100 %`.
2. Each holding's six risk primitives drawn from independent `sr()` streams.
3. Filters (search, sector, ITR range, weight floor) produce `filteredHoldings`.
4. `totalW = Σ filtered weight`; the five KPIs are weight-averages over the filtered set.
5. `radarData` normalises the KPIs onto a 0–100 radar (WACI ÷10, greenRev ×100/60).
6. `scopeAttribution` re-aggregates scope emissions by sector.

### 7.4 Worked example

Two holdings pass the filter: A (`weight 2 %`, `itr 3.0`, `CI 600`), B (`weight 1 %`, `itr 1.8`,
`CI 200`). `totalW = 3`.

| Output | Computation | Result |
|---|---|---|
| wITR | (3.0·2 + 1.8·1)/3 = 7.8/3 | 2.60 °C |
| waci | (600·2 + 200·1)/3 = 1400/3 | 466.7 tCO2e/$M |

Guide's "Pulse Score" (were it implemented) on A alone with physScore 50, transScore 40, CI 600:
`0.4·50 + 0.4·40 + 0.2·(600/10) = 20 + 16 + 12 = 48` — but the code never produces this number.

### 7.5 Data provenance & limitations

- **All 150 holdings synthetic** via `sr(seed)=frac(sin(seed+1)×10⁴)`; ISINs are `US0000000ⁿX`
  placeholders. The real PCAF backend engine is dormant relative to this page.
- No composite Pulse Score, no live feed, no alert-threshold evaluation — the guide's "real-time
  surveillance / alerting" is not built.
- Scope split is a flat 30/20/25/25 heuristic; ITR is a raw draw, not derived from targets/trajectory.

**Framework alignment:** PCAF *Global GHG Accounting Standard* — WACI (`Σ wᵢ·CIᵢ`) matches the PCAF
weighted-average carbon-intensity definition · SBTi/TCFD — ITR is the forward-looking temperature
metric (SBTi derives it from target ambition vs a science-based pathway; here it is a synthetic draw)
· NGFS — named for physical/transition framing, not used computationally.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** *(This composite-Pulse spec is shared in
spirit across the portfolio-analytics family; here it is scoped to the real-time surveillance score.)*

### 8.1 Purpose & scope
Compute a single 0–100 Climate Pulse Score per portfolio and per holding, updated on data refresh,
with configurable deterioration alerts — for climate risk officers running continuous surveillance.

### 8.2 Conceptual approach
A **normalised weighted-composite index** (mirroring MSCI Climate VaR component roll-ups and
BlackRock Aladdin Climate factor scores) over three standardised pillars, plus an **EWMA change
detector** for alerting (mirroring RiskMetrics volatility-of-signal triggers).

### 8.3 Mathematical specification
```
z_k(h)    = (x_k(h) − μ_k) / σ_k                       # standardise each pillar k over universe
Pillar_P  = Φ(z_phys)·100 ; Pillar_T = Φ(z_trans)·100 ; Pillar_C = Φ(z_CI)·100
Pulse(h)  = w_P·Pillar_P + w_T·Pillar_T + w_C·Pillar_C           # w = 0.4/0.4/0.2 (guide)
Pulse_pf  = Σ_h weight_h·Pulse(h)
EWMA_t    = λ·Pulse_pf,t + (1−λ)·EWMA_{t−1}
Alert     = 1{ Pulse_pf,t − EWMA_t > κ·σ_pulse }
```

| Parameter | Calibration source |
|---|---|
| `μ_k, σ_k` | cross-sectional moments of physical/transition scores; MSCI/S&P Trucost distributions |
| `w_P,w_T,w_C` | 0.4/0.4/0.2 per guide; validate via PCA loadings |
| `λ` | EWMA decay ≈0.94 (RiskMetrics daily convention) |
| `κ` | alert sensitivity ≈2 (2σ); ops-tuned |

### 8.4 Data requirements
`physical_risk_score`, `transition_risk_score`, `carbon_intensity`, `weight`, timestamped refreshes.
Sources: platform PCAF engine (WACI already produced), hazard-mapping engine, news/controversy feed
for intraday deltas. The five weight-averages already exist; only standardisation + EWMA are new.

### 8.5 Validation & benchmarking plan
Backtest Pulse against realised drawdowns of climate-tilted vs benchmark portfolios; reconcile the
carbon pillar against PCAF WACI; sensitivity-test weights and κ on historical controversy events.

### 8.6 Limitations & model risk
Standardisation moments drift with universe composition; alert flapping if κ too low. Conservative
fallback: report raw pillar percentiles alongside the composite and require 2 consecutive breaches
before firing an alert.
