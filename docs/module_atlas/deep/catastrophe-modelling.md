## 7 · Methodology Deep Dive

The Catastrophe Modelling module is a substantive probabilistic cat-model dashboard aligned with its guide.
It implements the hazard-exposure-vulnerability-financial (H-E-V-F) framing via a 15-peril library with
return-period losses, a parametric OEP/AEP exceedance curve, climate-warming uplift factors, Lloyd's RDS
scenarios, and chain-ladder loss development — using a real historical event dataset. The EP curve is a
parametric approximation rather than a full stochastic event-set integration, so §8 specifies the production
engine.

### 7.1 What the module computes

Portfolio and peril loss metrics plus a climate-adjusted exceedance-probability curve:

```js
totalAAL   = Σ PERILS.avgAnnualLoss_mn                     // average annual loss
pml100/250 = Σ PERILS.returnPeriod{100,250}yr_mn          // probable maximum loss
oepLoss    = base × (0.001 + (1 − ep)^2.5 × (0.15 + sr·0.08))  // occurrence EP curve
aepLoss    = oepLoss × (0.7 + sr·0.2)                     // aggregate EP (< OEP)
climateAdj = oepLoss × {+1.5°C:1.08, +2°C:1.18, +3°C:1.35, +4°C:1.55}  // warming uplift
climateAdjAAL = AAL × CLIMATE_FACTORS[peril][warmingKey]
```

The `(1 − ep)^2.5` exponent gives the exceedance curve its characteristic convex tail — larger losses at
lower exceedance probabilities. Loss development uses chain-ladder age-to-age factors.

### 7.2 Parameterisation

**Peril library** (`PERILS`, 15–16 rows — provenance: RMS/AIR/CoreLogic taxonomy; loss levels are
directionally realistic industry figures):

| Peril | AAL ($M) | 100yr RP ($M) | 250yr RP ($M) | Trend %/decade | Climate influence |
|---|---|---|---|---|---|
| Hurricane/Typhoon | 42,000 | 180,000 | 310,000 | +8.2 | Dominant |
| Earthquake | 28,000 | 250,000 | 480,000 | +0.5 | Limited |
| Flood (riverine) | 35,000 | — | — | +12.1 | High |

**Climate warming uplift** (`climateAdj` factors 1.08/1.18/1.35/1.55 for +1.5/+2/+3/+4 °C) — monotonic and
peril-specific via `CLIMATE_FACTORS`; earthquake (geological) carries ~1.0 (climate-independent), hurricane/
flood carry the largest uplift, correctly reflecting attribution science.

**Real historical events** (`MAJOR_CAT_EVENTS`, imported from `data/catastropheEvents`) drive the event-set
explorer and country statistics. **Lloyd's RDS scenarios** (`RDS_SCENARIOS`, 9 rows) and `PORTFOLIOS`
(4 rows with exposure, AAL bps, limits, deductibles, reinstatements) are structured reinsurance inputs.

**Synthetic dispersion** (`sr()`): the per-point noise on the EP curve and some event-generator fields; the
peril library, climate factors, and historical events are real/curated.

### 7.3 Calculation walkthrough

The dashboard sums AAL and PML across perils. The EP-Curve Builder generates OEP points from the parametric
`base × (1−ep)^2.5` form, derives AEP as a fraction of OEP, and overlays four warming-adjusted curves. The
Climate-Scenarios tab scales each peril's AAL by its warming factor. Loss-Development computes chain-ladder
factors from the paid-loss triangle to project ultimates.

### 7.4 Worked example (EP curve + climate uplift)

Portfolio `totalExposure_bn = 100` → `base = 100 × 1000 = 100,000 ($M scale)`. At exceedance probability
`ep = 0.01` (100-year return period):
`oepLoss = 100,000 × (0.001 + (1 − 0.01)^2.5 × 0.19) = 100,000 × (0.001 + 0.9752×0.19) = 100,000 × 0.186 =
~18,600 $M`. Under +2 °C: `climateAdj20 = 18,600 × 1.18 = ~21,950 $M` — an ~18% loss uplift at the 100-year
level from warming. AEP at the same point ≈ `18,600 × 0.8 = ~14,900 $M` (aggregate < occurrence, as
expected).

### 7.5 Data provenance & limitations

- **Peril loss levels, climate factors, and historical events are real/curated**; the EP-curve dispersion and
  some event-generator fields are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- **The EP curve is a parametric approximation** (`(1−ep)^2.5`), not an integration over a 50k–100k-year
  stochastic event set (the guide's method) — it captures the tail shape but not location-level correlation.
- Climate uplift is a scalar per peril/warming level, not a re-simulated hazard field; no secondary-uncertainty
  or demand-surge modelling.

**Framework alignment:** AIR Touchstone / RMS RiskLink — the H-E-V-F structure and OEP/AEP outputs the module
mirrors · Swiss Re Sigma — the historical nat-cat loss figures · Lloyd's Realistic Disaster Scenarios — the
RDS stress set · IPCC SSP — the warming-level uplift factors · Solvency II SCR — the PML/return-period metrics
feed capital allocation. See §8 for the stochastic-event-set engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The parametric EP curve should be replaced by a
stochastic-event-set integration.

### 8.1 Purpose & scope
Produce OEP/AEP loss curves and PMLs for an insurance portfolio from a stochastic catastrophe event set with
location-level exposure and vulnerability, climate-conditioned, for pricing, reinsurance, and Solvency II
capital.

### 8.2 Conceptual approach
Full H-E-V-F simulation over a 50k–100k-year stochastic event set (AIR/RMS methodology), benchmarked against
AIR Touchstone and RMS RiskLink. Hazard intensity × vulnerability damage function × exposure → per-event
loss; aggregate to annual OEP/AEP. Climate conditioning re-weights event frequencies and shifts severity.

### 8.3 Mathematical specification

```
Loss_e = Σ_loc  Exposure_loc × DamageFn_loc(Intensity_e,loc)      per stochastic event e
OEP(x) = P( max_e∈year Loss_e > x )                               occurrence exceedance
AEP(x) = P( Σ_e∈year Loss_e > x )                                 aggregate exceedance
AAL    = (1/N_years) Σ_years Σ_e Loss_e
PML_T  = OEP^{-1}(1/T)                                            T-year return-period loss
Climate: λ_e' = λ_e·(1+κ_freq),  Intensity_e' = Intensity_e·(1+κ_sev)   per peril, per SSP
```

| Parameter | Symbol | Source |
|---|---|---|
| Event set | {e}, λ_e | AIR/RMS stochastic catalogue |
| Damage functions | DamageFn | vulnerability curves by construction/occupancy |
| Exposure | Exposure_loc | policy/asset database (geocoded) |
| Climate uplift | κ_freq, κ_sev | IPCC SSP + peril attribution |

### 8.4 Data requirements
Geocoded exposure with construction/occupancy, licensed event set + vulnerability curves, climate uplift
tables. Platform holds the peril library, historical events, and portfolio scaffolds; missing: the stochastic
catalogue and location-level exposure.

### 8.5 Validation & benchmarking plan
Reconcile AAL/PML against a vendor model (AIR/RMS) for the same portfolio (±30–50% epistemic band). Backtest
against realised annual losses. Sensitivity to damage-function and climate-κ choices. Validate OEP<->AEP
consistency.

### 8.6 Limitations & model risk
Cat-model uncertainty is ±30–50% — present ranges. Secondary uncertainty (event footprint variability) and
demand surge materially affect the tail; omit-at-peril. Climate attribution factors are contested — show
base and uplifted curves separately.
