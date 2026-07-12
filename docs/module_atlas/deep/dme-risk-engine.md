## 7 · Methodology Deep Dive

The DME Risk Engine is the **parent quant library** the other DME pages port from ("exact port from
dme-platform/src/lib/calculations.ts"). It bundles a velocity/acceleration signal engine, EMA smoothing,
z-score regime classification, the **four-branch PD strategy**, and VaR/WACC/LCR/DMI/EL calculations —
applied to holdings enriched from `GLOBAL_COMPANY_MASTER`. No guide record was supplied, so no mismatch
flag; the caveat is on synthetic fallback data.

### 7.1 What the module computes

**Signal dynamics:**
```js
velocity(cur, prev, Δt)     = Δt>0 ? (cur−prev)/Δt : 0
acceleration(v, vPrev, Δt)  = Δt>0 ? (v−vPrev)/Δt : 0
emaSmooth(raw, prevEma, α)  = α·raw + (1−α)·prevEma
zScore(v, μ, σ)             = σ>0 ? (v−μ)/σ : 0
regime(z) = z≤1 Normal | z≤2 Elevated | z≤3 Critical | else Extreme
```
**Four-branch PD** (identical to dme-entity):
```
A pdExponential = pdBase·exp(α·velT)
B pdMertonDD    = Φ(−d2), d2 = d1 − σ√T, on stranded-haircut-adjusted assets
C pdTabular     = pdBase·{low 1.05, med 1.30, high 2.00, severe 3.25}[band]
D pdMultifactor = pdBase·exp(αT·velT + βP·velP + γS·velS)   // 3-factor velocity
```
**Risk & capital calcs:**
```
VaR_realtime = varBase + exposure·βRep·accelRep            // acceleration-driven VaR uplift
WACC_adj     = wE(cE+esgEqPrem) + wD(cD+esgDebtSpread)(1−tax) ; bpsChange vs baseline
DMI          = impact·0.40 + risk·0.40 + opportunity·0.20
EL           = PD·LGD·EAD
LCR_adj      = HQLA / (netOutflows·esgStressMult) · 100     // ESG-stressed liquidity
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Regime z bands | 1 / 2 / 3 | z-score thresholds (Normal→Extreme) |
| ESG-band PD mult. | low 1.05 / med 1.30 / high 2.00 / severe 3.25 | `pdTabular` heuristic |
| DMI weights | impact .40 / risk .40 / opportunity .20 | fixed |
| Multifactor branch | αT·velT + βP·velP + γS·velS | transition/physical/social velocities |
| RISK_CHANNELS | 6 | transmission-channel taxonomy (seed schema) |

Branch D adds a **social velocity** term (γS·velS) beyond dme-entity's two-factor version. Inputs
(pdBase, velocities, asset value, vol, EAD, HQLA) are `sRand(seed)=frac(sin(seed+1)×10⁴)` fallbacks where
the master lacks them.

### 7.3 Calculation walkthrough

1. Holdings loaded from `ra_portfolio_v1` / master; each enriched with seeded velocities and financials.
2. Signal engine: raw materiality → EMA → velocity → acceleration → z-score → regime.
3. Four PD branches → consensus (weighting set by the consuming view).
4. VaR uses **acceleration** (not just level) — a momentum-sensitive tail measure; WACC isolates the ESG
   premium in bps; EL = PD·LGD·EAD; LCR stressed by an ESG multiplier.
5. `RISK_CHANNELS` (6) organises outputs by transmission channel for a radar/heatmap.

### 7.4 Worked example (velocity → regime → VaR)

Materiality series raw 62 (prev 55), Δt=1 → velocity = 7. Prev velocity 4 → acceleration = 3.
EMA(α=0.3): 0.3·62 + 0.7·58 = 18.6 + 40.6 = 59.2. With μ=50, σ=8: z = (59.2−50)/8 = 1.15 → **Elevated**.
VaR_realtime with varBase=$40M, exposure=$500M, βRep=0.0002, accelRep=3:
`40 + 500·0.0002·3 = 40 + 0.30 = $40.3M`. Branch A PD with pdBase 2%, α 0.15, velT 0.5:
`0.02·exp(0.075) = 0.02·1.0779 = 2.16%`.

### 7.5 Data provenance & limitations

- Holdings can be real (user portfolio matched to master), but velocities, acceleration, HQLA and many
  financials are **synthetic** via `sRand`, so signal dynamics are largely driven by seeded noise.
- The velocity/acceleration engine is mechanically correct finite-difference; VaR's acceleration term is
  a bespoke momentum overlay, not a standard historical/parametric VaR.
- Regime z uses fixed thresholds; without a real rolling μ/σ, "regime" is a static banding of the seeded
  z-score.
- Merton and multifactor PD are genuine but on random inputs.

**Framework alignment:** **Merton/KMV** structural PD; **IFRS 9** EL = PD·LGD·EAD; **Basel III LCR** (here
ESG-stressed); CAPM-based WACC with an ESG premium; **NGFS/EBA** transition-velocity PD conditioning. The
velocity/acceleration "materiality dynamics" framing is the platform's own signal-processing layer (EMA +
z-score regime), analogous to momentum/volatility-regime models in market risk.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production materiality-dynamics + credit-risk engine: real-time signal velocity/acceleration, regime
detection, multi-branch PD, and climate-stressed EL/VaR/LCR for the covered book.

### 8.2 Conceptual approach
Replace fixed z-bands with a **data-driven regime model** (rolling z or Markov-switching) and calibrate PD
branches to real data (Merton/KMV anchor + logit + climate-conditioned drift). VaR moves from the ad-hoc
acceleration term to a proper historical/EVT tail. Benchmarks: Moody's EDF, RiskMetrics/FRTB VaR, EBA
climate stress test, NGFS Phase IV.

### 8.3 Mathematical specification
```
Signal: v_t = ΔS_t/Δt; a_t = Δv_t/Δt; z_t = (EMA_t − μ_roll)/σ_roll (36-window)
Regime: Markov-switching on z (states Normal/Elevated/Critical/Extreme), posterior via forward-backward
PD: Merton (de-levered σ_A, climate drift) ⊕ logit ⊕ multifactor; blend by inverse-variance
VaR_α = −quantile_α(P&L) with EVT (GPD) tail for α≥0.99
EL_life = Σ_t marginalPD_t·LGD·EAD_t·DF_t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Rolling window | 36 | regime stability |
| Climate drift | — | NGFS Phase IV |
| σ_A | — | de-levered equity vol |
| EVT tail ξ | — | GPD fit to loss exceedances |
| LGD | — | PCAF / recoveries |

### 8.4 Data requirements
Time-series materiality signals (for velocity), issuer financials/vol, default history for logit, HQLA
schedule for LCR, NGFS scenario variables. Platform holds the calc library, `RISK_CHANNELS` taxonomy and
`climate_scenarios` tables.

### 8.5 Validation & benchmarking plan
Regime-model likelihood and stability backtest; PD calibration/Gini; VaR backtest (Kupiec/Christoffersen);
reconcile PD vs Moody's EDF and EL vs IFRS 9 provisions; confirm the acceleration-VaR is superseded by a
backtested tail measure.

### 8.6 Limitations & model risk
Finite-difference velocity is noise-sensitive on sparse signals; acceleration-driven VaR lacks a
distributional basis. Conservative fallback: require corroborated signal movement before a regime change
and use the max-of-branches PD when models disagree.
