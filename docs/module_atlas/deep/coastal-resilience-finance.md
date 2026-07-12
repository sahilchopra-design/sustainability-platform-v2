## 7 · Methodology Deep Dive

This module (Sprint DY) computes a genuine **discounted benefit** for coastal protection — it uses an annuity
present-value formula, which is more rigorous than most benefit-cost modules on the platform. The city and
protection-measure datasets are curated demo values; the stranding calculation is a simple heuristic.

### 7.1 What the module computes

Present value of annual resilience benefit uses a closed-form annuity factor:
```js
pvBenefit = (lifeYrs > 0 && discountRate > 0)
   ? annBenefit · (1 − (1 + discountRate/100)^(−lifeYrs)) / (discountRate/100)   // annuity PV
   : annBenefit · lifeYrs                                                        // undiscounted fallback
```
Portfolio and stranding:
```js
totalProtected = Σ CITIES.protectedValue
avgBcr         = Σ CITIES.bcrAvg / CITIES.length        // guard: length>0
strandedfraction = min(0.95, floodRisk/100 · (1 + slrM2050))
strandedValue    = protectedValue · strandedfraction · 0.3
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `CITIES` (9: slrM2050, floodRisk, investedGbn, protectedValue, bcrAvg, popAtRisk, annDamageBn) | seed schema | curated demo (coastal cities) |
| `PROTECTION_MEASURES` (8: capexMPerKm, maintenancePct, lifespanYr, co2TPerM, bcrTypical, naturalInfra) | seed schema | curated (seawall/living-shoreline/mangrove) |
| `SLR_SCENARIOS` (7: slr_rcp26/45/85, assetExposureGtn) | seed schema | RCP sea-level-rise pathways |
| `FINANCE_INSTRUMENTS` (7: provider, mechanism, trigger) | seed schema | FEMA BRIC / cat-bond / resilience-bond reference |
| Stranding cap | `0.95` | heuristic ceiling |
| Stranding realised-loss factor | `0.3` | heuristic (30% of at-risk value actually lost) |

Guide anchors: coastal BCR 3–8× (FEMA/Swiss Re); mangrove wave-height −29%/100m (IUCN/TNC); FEMA BCA
threshold 1.0×.

### 7.3 Calculation walkthrough

User sets `annBenefit`, `lifeYrs`, `discountRate` → `pvBenefit` via the annuity factor → BCR compares
`pvBenefit` to project CapEx (from `PROTECTION_MEASURES`). City-level: `strandedfraction` scales flood risk
by sea-level-rise multiplier, capped at 0.95, and `strandedValue` applies a 30% realised-loss factor to
protected value. `avgBcr`/`totalProtected`/`totalInvested` roll up the 9 cities.

### 7.4 Worked example

Annual avoided-loss benefit `annBenefit = $10M`, `lifeYrs = 30`, `discountRate = 5%`:
```
annuity factor = (1 − 1.05^(−30)) / 0.05 = (1 − 0.2314)/0.05 = 15.372
pvBenefit = 10M · 15.372 = $153.7M
```
Against a seawall CapEx of $26M, `BCR = 153.7/26 = 5.9×` — squarely in the guide's 3–8× coastal range and
above the FEMA 1.0× threshold. City stranding for `floodRisk = 60`, `slrM2050 = 0.5m`:
```
strandedfraction = min(0.95, 0.60·(1+0.5)) = min(0.95, 0.90) = 0.90
strandedValue = protectedValue·0.90·0.3 = 27% of protected value
```

### 7.5 Data provenance & limitations

- City and measure datasets are **curated demo data**; benefits are user-input or stored, not derived from a
  probabilistic storm-surge AAL model (the guide's RMS North Atlantic reference is aspirational).
- `pvBenefit` correctly discounts, but treats benefit as a flat annuity — no growth in AAL under rising SLR,
  no return-period loss curve.
- Stranding uses two fixed heuristics (0.95 cap, 0.3 realised-loss); no insurance-premium co-benefit in the
  PV (unlike the guide's multi-benefit BCR).

**Framework alignment:** FEMA Benefit-Cost Analysis Reference Guide v6.0 (BCR, 1.0× threshold, BRIC grants) ·
NOAA Coastal Resilience Investment Framework · Swiss Re Institute NbS for Coastal Resilience · IUCN/Nature
Conservancy mangrove attenuation (−29%/100m). The annuity-PV benefit mirrors FEMA discounted avoided-loss.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute a FEMA-grade, probabilistic multi-benefit BCR for coastal protection
(seawall / living shoreline / mangrove), including insurance and ecosystem co-benefits, for project finance
and FEMA BRIC eligibility.

**8.2 Conceptual approach.** Probabilistic AAL from a storm-surge exceedance curve (RMS/AIR North Atlantic)
with intervention-specific attenuation, discounted per FEMA BCA, plus monetised ecosystem services (TNC
mangrove valuation) — the multi-benefit coastal BCR standard.

**8.3 Mathematical specification.**
```
AAL = ∫ P(surge > x) · Damage(x, exposure) dx
Benefit_PV = Σ_t [ (AAL_base − AAL_withProject)_t + InsuranceSaving_t + EcoServices_t ] / (1+r)^t
   AAL_withProject uses surge reduced by attenuation η(measure, width)
BCR = Benefit_PV / (CapEx + Σ_t OpEx_t/(1+r)^t)
StrandedValue = exposure · P(inundation | SLR_2050) · lossFraction
```

| Parameter | Source |
|---|---|
| Surge exceedance curve | RMS/AIR or NOAA SLOSH |
| Attenuation η | IUCN/TNC (mangrove −50–70%/500m); engineering specs (seawall) |
| Discount rate r | FEMA/OMB Circular A-94 |
| SLR pathway | IPCC AR6 RCP2.6/4.5/8.5 |

**8.4 Data requirements.** Coastal bathymetry, asset exposure/values, surge model, measure attenuation,
insurance premiums. Free: NOAA SLOSH, IPCC SLR; vendor: RMS/AIR, Swiss Re premium data.

**8.5 Validation & benchmarking.** Reconcile BCR vs FEMA 3–8× and Swiss Re; sensitivity on η and r; backtest
avoided-loss vs post-project claims.

**8.6 Limitations & model risk.** Deep uncertainty in SLR tails; attenuation transfer across sites; ecosystem
valuation contested. Fallback: single return-period (100-yr) benefit with η floor when full loss curve
unavailable.
