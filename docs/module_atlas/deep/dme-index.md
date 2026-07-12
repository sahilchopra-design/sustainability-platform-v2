## 7 · Methodology Deep Dive

The DME Dynamic Materiality Index (EP-BE3) is an **index-construction** module: it blends a financial-risk
score, an ESG score and a momentum (velocity) component into a single **DMI**, smooths it with an EMA,
classifies a regime by z-score, and reports portfolio concentration (HHI) and rank agreement (Spearman)
vs an ESG-rating proxy. The guide's DMI framing matches the code here (unlike sibling DME pages), so **no
mismatch flag** — the caveat is only that all 40 entities are synthetic.

### 7.1 What the module computes

```js
DMI = frScore·0.40 + esgScore·0.40 + clamp(velScore,0,100)·0.20        (DEFAULT_WEIGHTS)
```
with two nested composites:
```
frScore  = frVar·0.30 + frPd·0.30 + frWacc·0.20 + frLiq·0.20           (FR_W)
esgScore = esgGov·0.25 + esgEnv·0.35 + esgSoc·0.20 + esgReg·0.20        (ESG_W)
```
**Momentum** comes from a 24-quarter history smoothed and differenced:
```
emaHistory = EMA(rawHistory, α=0.2):  e_i = 0.2·v_i + 0.8·e_{i−1}
velocity(e, lag=4)_i = (e_i − e_{i−lag}) / max(1e-4, |e_{i−lag}|)       // 4-qtr % change
velScore = clamp(50 + lastVelocity·200, 0, 100)                        // centred at 50
```
**Regime** by fixed-parameter z-score: `z = (DMI − 55)/14`, banded Normal/Elevated/Critical/Extreme.
**Portfolio** analytics: `HHI = Σ wᵢ²` (concentration) and `Spearman(x,y) = 1 − 6Σd²/(n(n²−1))`
(rank correlation of DMI vs an ESG proxy series).

### 7.2 Parameterisation / scoring rubric

| Weight set | Values | Provenance |
|---|---|---|
| DMI top level | FR 0.40 / ESG 0.40 / Velocity 0.20 | `DEFAULT_WEIGHTS` (user-configurable, Tab 2) |
| FR sub-components | VaR 0.30 / PD 0.30 / WACC 0.20 / Liquidity 0.20 | `FR_W` — heuristic |
| ESG sub-components | Env 0.35 / Gov 0.25 / Soc 0.20 / Reg 0.20 | `ESG_W` — env-weighted heuristic |
| EMA α | 0.20 | smoothing constant |
| Velocity lag | 4 quarters | 1-year momentum |
| Regime z params | mean 55, std 14 | fixed (not sample-estimated) |

Seeded sub-scores (all `sr()`): frVar 20–95, frPd 15–95, frWacc 25–95, frLiq 10–95; esgGov 20–95,
esgEnv 15–95, esgSoc 25–95, esgReg 10–95; rawHistory 40–95 over 24 quarters.

### 7.3 Calculation walkthrough

1. `ENTITIES` (40) each get seeded FR and ESG sub-scores → `frScore`, `esgScore`.
2. A 24-quarter `rawHistory` is EMA-smoothed; the last 4-quarter velocity → `velScore`.
3. `DMI` = weighted blend; `z = (DMI−55)/14` → regime.
4. Portfolio tab computes HHI over entity weights and Spearman(DMI, ESG-proxy) for validity checks.
5. Alerts trigger off DMI regime crossings.

### 7.4 Worked example

Entity with frVar=60, frPd=50, frWacc=70, frLiq=40:
`frScore = 60·0.30 + 50·0.30 + 70·0.20 + 40·0.20 = 18+15+14+8 = 55.0`.
ESG with gov=65, env=70, soc=55, reg=60: `esgScore = 65·0.25 + 70·0.35 + 55·0.20 + 60·0.20
= 16.25+24.5+11+12 = 63.75`.
Suppose lastVelocity = +0.08 → `velScore = clamp(50 + 0.08·200,0,100) = 66`.
`DMI = 55·0.40 + 63.75·0.40 + 66·0.20 = 22 + 25.5 + 13.2 = 60.7`.
`z = (60.7 − 55)/14 = 0.41` → **Normal** (z ≤ 1). Positive momentum lifts DMI above its FR/ESG mean.

### 7.5 Data provenance & limitations

- **All 40 entities synthetic**, via `sr(seed)=frac(sin(seed+1)×10⁴)`; the 24-quarter histories are
  `sr()`-generated random walks, so EMA/velocity operate on noise, not real signals.
- Regime z uses **fixed** mean 55 / std 14 rather than the sample distribution, so the regime bands are
  effectively pre-set thresholds (z=1 ↔ DMI=69, z=2 ↔ DMI=83…), not adaptive.
- `velScore` normalisation (`50 + vel·200`) is a linear heuristic; large single-quarter moves saturate.

**Framework alignment:** an internal **composite-index** methodology in the spirit of ESG index
construction (MSCI/S&P DJSI weighting of E/S/G pillars) plus a momentum overlay. EMA smoothing and
z-score regime classification are standard time-series techniques; HHI is the **Herfindahl-Hirschman**
concentration index; Spearman ρ is the rank-agreement check used to validate a new score against an
established rating (here an ESG-rating proxy).

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Dynamic Materiality Index that fuses real financial-risk and ESG signals into a monitorable
composite with defensible momentum and regime states, for the covered universe — supporting watchlist
triage and early-warning alerting.

### 8.2 Conceptual approach
Treat the DMI as a **multi-factor composite with a data-driven regime model**: pillar scores from real
inputs, EWMA momentum, and a **rolling-window z-score / HMM regime** rather than fixed mean-55/std-14.
Benchmarks: MSCI ESG rating pillar aggregation, S&P DJSI CSA weighting, and standard factor-index
construction (equal-risk-contribution weighting).

### 8.3 Mathematical specification
```
frScoreᵢ  = Σ_k w_k · standardise(riskFactor_{i,k})     (VaR, PD, WACC uplift, liquidity)
esgScoreᵢ = Σ_p w_p · pillarScore_{i,p}                 (E/S/G/Reg, exposure-weighted)
DMIᵢ,t    = a·frᵢ,t + b·esgᵢ,t + c·momentumᵢ,t ,  a+b+c=1
momentum  = (EWMA_λ(DMI)_t − EWMA_λ(DMI)_{t−4}) / |EWMA_{t−4}|
z_i,t     = (DMIᵢ,t − μ_roll)/σ_roll  (36-period rolling)   or HMM state posterior
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Pillar weights | w_p | SASB/MSCI materiality by sector |
| Factor standardisation | — | cross-sectional z within sector |
| EWMA λ | 0.2 (α) | tuned to signal half-life |
| Rolling window | 36 quarters | regime stability vs responsiveness |

### 8.4 Data requirements
Real per-entity VaR/PD/WACC/liquidity (from DME Financial Risk), E/S/G/Reg pillar scores (CDP, SBTi,
controversies), and a licensed ESG rating for Spearman validation. Platform already produces the FR
components in `dme-financial-risk` and holds `reference_data` ESG feeds.

### 8.5 Validation & benchmarking plan
Spearman ρ of DMI vs licensed ESG ratings ≥ 0.5; regime-transition frequency sanity check; backtest that
DMI deterioration leads realised credit/ESG events; sensitivity of DMI rank order to ±20% weight shifts.

### 8.6 Limitations & model risk
Composite indices hide offsetting moves across pillars; fixed weights are subjective. Momentum on noisy
inputs generates false regime flips. Conservative fallback: require corroborating raw-signal movement
before firing a regime-change alert, and disclose the weight scheme alongside the score.
