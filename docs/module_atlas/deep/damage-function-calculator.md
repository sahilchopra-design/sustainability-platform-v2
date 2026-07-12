## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **macro-economic IAM damage functions** —
> DICE/PAGE/FUND/Burke, `D(T)=1−1/(1+α₁T+α₂T²)`, social cost of carbon, GDP-loss-vs-temperature. **The
> code implements something entirely different: asset-level *physical* damage functions** — JRC
> flood depth-damage, HAZUS-MH, FEMA P-58 wind fragility, and WBGT heat-productivity curves, producing
> asset damage ratios and exceedance-probability (loss) curves. No IAM, no SCC, no temperature-GDP
> function exists. The sections document the physical-damage engine the code actually runs.

### 7.1 What the module computes

Two real curve generators plus an EP curve:

```js
// Depth-damage / fragility curve (per standard + asset class)
JRC/HAZUS (exponential):  DR = min(1, 1 − exp(−(intensity/α)^β))
FEMA P-58 (lognormal fragility): DR = min(1, 1/(1+exp(−(ln(intensity/θ)/β_d))))
WBGT (linear productivity):      DR = clamp(0,1, (intensity − threshold)·slope)

// Exceedance-probability (return-period loss) curve
baseLossFrac = min(0.9, 0.02·rp^0.55·(1 + sr(i·7)·0.15))     // note: seeded ±15% jitter
adjLoss      = baseLossFrac · scenarioMult
lossUsd      = assetValue · min(0.95, adjLoss)
exceedancePct= 100 / rp
```

PML/AAL analytics then read the EP curve at the 100/250/500/1000-year return periods.

### 7.2 Parameterisation / scoring rubric

| Standard | Formula | Params | Provenance |
|---|---|---|---|
| JRC (PESETA IV) | `1−exp(−(d/α)^β)` | residential α1.5 β0.8; commercial α2.0 β0.75; infra α2.8 β0.9 | **real** — JRC EUR 29711 EN |
| HAZUS-MH (FEMA) | damage-state exponential | residential α1.2 β1.1; … | **real** — FEMA HAZUS |
| FEMA P-58 | lognormal fragility `Φ[(ln IM − ln θ)/β]` | θ 45/55/65, β_d 0.5–0.6 | **real** — FEMA P-58 |
| WBGT (ISO 7933) | `(WBGT−threshold)·slope` | moderate thr 25 slope 0.067 | **real** — ISO 7933 / OSHA heat stress |
| Scenario multipliers | current 1.0 / SSP1-2.6 1.15 / SSP2-4.5 1.35 / SSP5-8.5 1.68 / SSP5-8.5@2100 2.42 | curated (IPCC SSP escalation) |
| EP base-loss | `0.02·rp^0.55·(1+sr·0.15)` | power-law tail **with seeded ±15% jitter** |

The damage-curve *shapes and parameters are genuine* (real hazard-engineering standards); the EP curve
is a synthetic power-law with a small seeded perturbation, scaled by the scenario multiplier.

### 7.3 Calculation walkthrough

User picks standard + asset class → `generateDamageCurve` produces DR-vs-intensity (20 points).
`generateEPCurve` maps 10 return periods (2…1000yr) to losses, escalated by the chosen SSP multiplier.
`standardComparison` overlays all standards; PML = loss at a chosen return period; `pmlPct =
pml/assetValue·100`. AAL is the probability-weighted integral over the EP curve (`probBand =
1/rp_{i-1} − 1/rp_i`).

### 7.4 Worked example (commercial RE, JRC, 2 m flood; and 250-yr PML under SSP5-8.5)

Damage ratio at inundation depth 2.0 m, commercial (α=2.0, β=0.75):
```
DR = 1 − exp(−(2.0/2.0)^0.75) = 1 − exp(−1) = 1 − 0.368 = 0.632  → 63.2% damage
```
EP curve at the 250-year return period (`rp=250`, i index in RETURN_PERIODS), SSP5-8.5 (mult 1.68):
```
baseLossFrac = min(0.9, 0.02·250^0.55·(1+sr·0.15)) ≈ 0.02·19.3·~1.07 ≈ 0.413
adjLoss      = 0.413·1.68 = 0.694 → capped at 0.95
lossUsd (commercial $500M) = 500e6·0.694 = $347M ;  exceedancePct = 100/250 = 0.4%
```
The depth-damage arithmetic is exact and standard; the 250-yr loss inherits the seeded jitter and the
curated SSP multiplier.

### 7.5 Data provenance & limitations

- **Damage-function forms and parameters are real** hazard-engineering standards (JRC, HAZUS, FEMA
  P-58, ISO 7933) with inline citations.
- **The EP (return-period loss) curve is a synthetic power law** (`0.02·rp^0.55`) with a seeded ±15%
  jitter and curated SSP multipliers — not a fitted regional hazard model.
- The guide's IAM/SCC content is entirely unimplemented; this is an asset physical-risk tool, not a
  climate-economics tool.

**Framework alignment:** JRC PESETA IV flood depth-damage · FEMA HAZUS-MH · FEMA P-58 performance-based
fragility · ISO 7933 WBGT heat stress · IPCC SSP scenario escalation (1.5°C→SSP1-2.6 … SSP5-8.5).
Solvency II / ECB CST 1-in-250 and 1-in-100 insurance return periods are used as PML read-points. The
damage functions are faithful; the loss-frequency curve is a placeholder for a real hazard model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The exceedance-probability curve is a seeded
power law, not a calibrated hazard-loss model.

**8.1 Purpose & scope.** Produce asset-level PML/AAL and full loss exceedance curves per peril, asset
class and climate scenario, for insurance pricing and physical-risk capital.

**8.2 Conceptual approach.** A catastrophe-model **hazard × exposure × vulnerability** pipeline — the
structure of RMS/Moody's and Verisk cat models: a stochastic hazard event set (frequency + intensity)
convolved with the (real) vulnerability curves and exposure, integrated to an EP curve. Scenario
conditioning follows IPCC SSP / NGFS physical pathways.

**8.3 Mathematical specification.**
```
Hazard: intensity i at site with rate λ(i, scenario)              # regional IDF/event set
Vulnerability: DR = f_standard(i, assetClass)                     # JRC/HAZUS/FEMA (implemented)
Event loss: L_e = Σ_sites Value·DR(i_e)
EP curve: P(L > ℓ) = 1 − exp(−Σ_e λ_e·1[L_e>ℓ])                    # from event set, not power law
AAL = ∫ ℓ dF(ℓ) = Σ_e λ_e·L_e ;  PML_T = loss at return period T
```

| Parameter | Source |
|---|---|
| Hazard frequency λ | regional flood/wind hazard maps (JRC, NOAA, WRI Aqueduct) |
| Vulnerability curves | JRC/HAZUS/FEMA/ISO (already in module) |
| Scenario intensity shift | IPCC SSP / NGFS physical pathways |
| Exposure | asset register (value, location, class) |

**8.4 Data requirements.** Stochastic event set or hazard IDF curves per peril/region/scenario; asset
exposure with geocoding; vulnerability curves (exist). Vendors: RMS, Verisk, Fathom (flood); free: WRI
Aqueduct, JRC flood maps, NOAA. Only the hazard event set is missing.

**8.5 Validation & benchmarking.** Reconcile AAL/PML to vendor cat-model outputs on shared portfolios;
backtest EP curve against historical loss data (EM-DAT, NatCat); verify scenario multipliers against
IPCC intensity shifts; sensitivity to vulnerability-curve choice.

**8.6 Limitations & model risk.** Loss-frequency is the dominant uncertainty (the current power law is a
placeholder); vulnerability curves are region-generic; correlated multi-site events need a real event
set. Fallback: report EP under multiple hazard datasets and flag single-curve reliance.
