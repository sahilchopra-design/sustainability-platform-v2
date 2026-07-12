## 7 · Methodology Deep Dive

The guide frames this as an **Adaptation Benefit-Cost Ratio** tool (`ABCR = NPV(RiskReduction)/CapEx`).
The code delivers a per-measure **ROI/payback** calculator plus a building-level hazard-composite and
resilience score, but the ABCR it computes is a simplified undiscounted ratio (no NPV term structure) — a
modelling simplification. All buildings are synthetic (`sr()` seeded).

### 7.1 What the module computes

Per synthetic building, an 8-hazard composite drives resilience, cost-of-inaction and insurance:
```js
hazards[j].score = floor(10 + sr(i·31 + j·7)·90)                 // 10–100 per hazard
composite   = floor( Σ hazards.score / hazards.length )          // mean hazard
resilience  = floor( 100 − composite·(0.6 + s6·0.4) )            // inverse, noise-scaled
costOfInaction = floor( value · (composite/100) · 0.15 )         // 15% of at-risk value
insurancePremium = floor( value · 0.003 · (1 + composite/100) )  // 30bp base, hazard-loaded
adaptedInsurance = floor( insurancePremium · (0.6 + resilience/100·0.3) )
```
Adaptation-measure economics (the ABCR/ROI core):
```js
benefit = floor( selBldg.costOfInaction · m.riskReduction/100 )   // avoided loss
cost    = floor( m.costPerSqm · selBldg.area )
roi     = cost>0 ? ((benefit·m.paybackYrs − cost)/cost·100) : 0    // % return over payback window
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Hazard score | `10 + sr(i·31+j·7)·90` | synthetic demo value |
| Cost-of-inaction rate | `0.15 × value × composite/100` | heuristic (15% loss fraction) |
| Insurance base rate | `0.003` (30 bp of value) | heuristic |
| Value by type | Office 4,500 / Retail 3,200 / Resi 5,500 / Ind 2,000 £/m² | heuristic sector cap-values |
| UHI effect | `1.5 + sr(i·37)·4.5` °C | synthetic (urban-heat-island range) |
| `m.riskReduction`, `m.costPerSqm`, `m.paybackYrs` | per adaptation measure | seed-schema heuristic |

Rating bands: hazard score >70 Critical, >50 High, >30 Medium, else Low.

### 7.3 Calculation walkthrough

Seeds set type/city/area/value/yearBuilt → 8 hazards scored → `composite` mean → `resilience`
(inverse) → `costOfInaction` and `insurancePremium`. Portfolio aggregates: `avgComposite`, `criticalCount`
(composite>70), `avgResilience`, `totalCostInaction`, and a `hazardDist` stacked count per hazard. The
adaptation tab computes `benefit/cost/roi` per measure for the selected building; projection tabs
(`floodProjection`, `heatProjection`) extrapolate to the 2090s on fixed decade steps.

### 7.4 Worked example

Building: Office, `area=10,000 m²` → value ≈ 10,000·4,500·(0.8+0.4·s4≈1.0) = **£45.0M**; hazards averaging
`composite=60`. Adaptation measure with `riskReduction=40%`, `costPerSqm=£120`, `paybackYrs=8`:

| Step | Computation | Result |
|---|---|---|
| Resilience | 100 − 60·(0.6+0.4·s6≈0.8) | ≈ **52** |
| Cost of inaction | 45.0M · 0.60 · 0.15 | **£4.05M** |
| Insurance premium | 45.0M · 0.003 · (1+0.60) | **£216k** |
| Adapted premium | 216k · (0.6 + 0.52·0.3) | **£164k** |
| Measure benefit | 4.05M · 0.40 | £1.62M avoided/yr-equiv |
| Measure cost | 120 · 10,000 | £1.20M |
| ROI | (1.62M·8 − 1.20M)/1.20M·100 | **+980%** over 8-yr window |

The ROI is a multi-year cumulative figure (benefit × payback − cost), not an annualised IRR — read it as
lifetime return, not p.a.

### 7.5 Data provenance & limitations

- **All building and hazard data synthetic** (`sr()` PRNG); hazard scores are independent random draws, not
  return-period intensities from a peril model.
- ABCR/ROI omits discounting (guide's NPV term is absent) and uses `costOfInaction` as the sole benefit —
  no ecosystem-service or insurance co-benefit in the ROI, unlike the guide's multi-benefit BCR.
- Resilience is a linear inverse of composite; no engineering residual-risk factors per measure.

**Framework alignment:** UNEP *Adaptation Gap Report 2023* (flood ABCR 4:1–9:1 cited) · World Bank
*Economics of Climate Adaptation* / Invest4Climate BCR methodology · IPCC AR6 WG2 Ch.17 decision-making
(asset-life extension). The page's benefit-cost logic approximates ECA-style avoided-loss ratios.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Rank adaptation measures for an asset/portfolio by a *discounted* benefit-cost
ratio and residual-risk-adjusted payback, supporting capex prioritisation and resilience certification.

**8.2 Conceptual approach.** Probabilistic **Economics of Climate Adaptation (ECA)** loss-curve framework
(Swiss Re/McKinsey ECA) combined with damage functions from a catastrophe model (RMS/JRC), giving
discounted avoided Average Annual Loss as benefit — the industry-standard adaptation appraisal.

**8.3 Mathematical specification.**
```
AAL_baseline = Σ_rp  P(rp)·Damage(hazard_rp, asset)           (exceedance-probability loss curve)
AAL_adapted  = Σ_rp  P(rp)·Damage(hazard_rp·(1−η_measure), asset)
Benefit_PV   = Σ_t (AAL_baseline − AAL_adapted)·DF_t + EcosystemServices_PV + InsuranceSaving_PV
ABCR = Benefit_PV / (CapEx + PV(OpEx))       ;    payback = min t : Σ≤t benefit ≥ CapEx
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Return-period losses | Damage(rp) | RMS/AIR or JRC depth-damage curves |
| Measure efficacy | η | engineering attenuation studies (IUCN NbS, seawall specs) |
| Discount rate | r | HM Treasury Green Book / social discount rate |
| Ecosystem value | EcoServices | TEEB / Nature Conservancy valuations |

**8.4 Data requirements.** Asset geocode, replacement value, height; hazard exceedance curves per peril
(UKCP18, JRC, NOAA); measure efficacy library; discount rate. Free: JRC/NOAA hazard; vendor: RMS/AIR AAL.

**8.5 Validation & benchmarking.** Reconcile ABCR distribution against UNEP 4:1–9:1 flood range; sensitivity
on η and r; backtest avoided-loss vs observed post-retrofit claims where available.

**8.6 Limitations & model risk.** Deep-uncertainty in forward hazard intensification; efficacy transfer
across contexts; co-benefit monetisation contested. Fallback: undiscounted single-peril ratio with
conservative η when loss curves unavailable.
