# Damage Function Calculator
**Module ID:** `damage-function-calculator` · **Route:** `/damage-function-calculator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models climate economic damage functions from the DICE, PAGE, and FUND Integrated Assessment Models, computing GDP loss under different warming trajectories and allowing comparison of damage function parameterisations, discount rates, and socioeconomic scenarios.

> **Business value:** Enables economists, risk managers, and policy analysts to understand the range of economic damage estimates under different climate scenarios, assess the sensitivity of impact estimates to model choice and discount rate, and quantify the economic case for transition investment.

**How an analyst works this module:**
- Select IAM damage function (DICE/PAGE/FUND/Burke) from the model picker
- Warming Trajectory tab inputs temperature pathway to 2100 under selected NGFS/RCP scenario
- Damage Function tab plots GDP loss vs temperature for each model with uncertainty bands
- Discount Rate Sensitivity panel shows SCC sensitivity to 1.4%, 2.5%, 5% discount rates
- Regional Breakdown (FUND) shows country-level damage disaggregation
- Model Comparison tab overlays all four damage functions to illustrate parameterisation uncertainty

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `DF_STANDARDS`, `KpiCard`, `RETURN_PERIODS`, `SCENARIOS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_CLASSES` | 6 | `label`, `value`, `alphaKey` |
| `SCENARIOS` | 6 | `label`, `mult`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;` |
| `intensity` | `(i / (numPoints - 1)) * maxIntensity;` |
| `baseLossFrac` | `Math.min(0.9, 0.02 * Math.pow(rp, 0.55) * (1 + sr(i * 7) * 0.15));` |
| `adjLoss` | `baseLossFrac * scenarioMult;` |
| `lossUsd` | `assetValue * Math.min(0.95, adjLoss);` |
| `damageCurve` | `useMemo(() => generateDamageCurve(standard, assetObj?.alphaKey \|\| 'residential', maxIntensity), [standard, assetClass]);  // EP curve const epCurve = useMemo(() => generateEPCurve(assetValue, standard, assetObj?.alphaKey, scenario), [assetValue, standard, assetClass, scenario]);` |
| `pointLossUsd` | `assetValue * pointDR.dr;` |
| `probBand` | `(1 / epCurve[i - 1].returnPeriod) - (1 / epCurve[i].returnPeriod);` |
| `standardComparison` | `useMemo(() => Object.keys(DF_STANDARDS).map(s => {` |
| `pmlPct` | `(pml / assetValue) * 100;` |
| `label` | `rp === 100 ? '1-in-100 (Insurance standard)' : rp === 250 ? '1-in-250 (Solvency II / ECB CST)' : rp === 500 ? '1-in-500 (Severe stress)' : '1-in-1000 (Extreme tail)';` |
| `val` | `Math.round(pml100 * pcts[i]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `RETURN_PERIODS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Damage at 2°C (DICE) | — | Nordhaus DICE-2023R | Estimated annual GDP loss at 2°C warming; considered an underestimate by many economists |
| Global Damage at 4°C (Burke) | — | Burke et al. 2015 | Empirical damage estimate at 4°C using GDP-temperature panel regression with country fixed effects |
| Social Cost of Carbon (DICE, 3% disc.) | — | Nordhaus DICE-2023R | Present value of future GDP damages from one additional tonne of CO₂ emissions |
| Fat-Tail Probability (PAGE) | — | Hope PAGE09 | Probability of catastrophic damage scenarios (>20% GDP loss) under PAGE probabilistic model |
| Regional Heterogeneity | — | FUND 3.9 | Tropical developing regions experience 2–5× higher per-capita damage than global average |
- **NGFS/RCP temperature pathways** → Input decadal temperature trajectories to damage function models → **GDP loss trajectory per warming scenario**
- **DICE/PAGE/FUND model parameters** → Calibrate damage functions, compute annual GDP damage and SCC → **Damage function curves and SCC estimates**
- **World Bank regional GDP data** → Apply FUND regional damage weights, compute heterogeneous impacts → **Regional GDP damage by country group**

## 5 · Intermediate Transformation Logic
**Methodology:** IAM Damage Function Modelling
**Headline formula:** `D(T) = 1 - 1/(1 + α₁T + α₂T²)`

Nordhaus DICE quadratic damage function: D(T) = α₂T² where α₂ = 0.00236 (calibrated to 2.5°C = 1.3% GDP loss). PAGE09 uses probabilistic damage with mean=D(T)+ε and fat right tail. FUND applies sector-disaggregated (agriculture, coastal, health, energy, ecosystems) damage with regional heterogeneity. Burke et al. empirical nonlinear GDP-temperature function shows 6.7% permanent GDP loss per 1°C above historical optimum.

**Standards:** ['Nordhaus DICE-2023R', 'Hope PAGE09', 'Anthoff & Tol FUND 3.9', 'Burke et al. 2015']
**Reference documents:** Nordhaus (2023) DICE-2023R Documentation; Hope (2006) PAGE09 Integrated Assessment Model; Anthoff & Tol (2014) FUND Version 3.9; Burke, Hsiang & Miguel (2015) Global Non-linear Effect of Temperature on Economic Production

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Fit the EP curve to the platform's hazard grids; resolve the identity split (analytics ladder: rung 2 → 3)

**What.** §7's flag is a wrong-domain finding with a twist: the guide promises IAM
macro-damage functions (DICE/PAGE/FUND, SCC), while the code implements *asset-level
physical* damage functions — and implements them well: real JRC PESETA IV
depth-damage, HAZUS-MH, FEMA P-58 lognormal fragility, and ISO 7933 WBGT curves
with cited parameters. The weak link is the exceedance-probability curve: a
synthetic power law (`0.02·rp^0.55`) with seeded ±15% jitter and curated SSP
multipliers — so PML/AAL read-points rest on a placeholder loss-frequency model.
Evolution A keeps the physical identity (the code is right; the guide entry should
be corrected) and replaces the EP placeholder.

**How.** (1) EP curve from data: for a geolocated asset, build return-period hazard
intensities from the digital-twin grids (flood depths, cyclone wind, FWI) and pass
them through the module's own genuine damage functions — intensity → DR → loss —
instead of asserting a loss power law; this mirrors the physical-risk-pricing
exemplar's resolution cascade and should share its 6-return-period convention.
(2) Remove the `sr()` jitter (guardrail conventions); uncertainty comes from
parameter bands on the damage functions (JRC publishes α/β ranges), which is
honest and explainable. (3) Calibration check: AAL for a benchmark asset against
OpenFEMA NFIP claims density where coverage allows — the rung-3 test. (4) Guide
correction: either re-title toward physical damage functions or add the IAM layer
as a separate, clearly-scoped tab if the platform wants SCC analytics (the sibling
scc modules are the better home).

**Prerequisites.** Grid coverage for the asset's perils (honest `resolution_tier`
fallback); the guide-entry correction so documentation stops promising IAMs.
**Acceptance:** the EP curve derives from grid intensities through the cited
damage functions; zero PRNG in the loss path; the benchmark AAL comparison is
published in the output payload.

### 9.2 Evolution B — Damage-curve explainer for underwriting and engineering users (LLM tier 1)

**What.** The module's real asset is its curated library of engineering standards —
exactly the material practitioners half-remember. Evolution B is a copilot that
explains curve choices and outputs: "why does FEMA P-58 give a lower damage ratio
than HAZUS at 40 m/s for commercial?" (different functional forms — lognormal
fragility vs exponential — with the actual parameters quoted), "which standard
applies to my asset?" (mapping asset class and peril to the right curve family),
and "what does the 1-in-250 PML mean under Solvency II?" — grounded in §7.2's
parameter table with its inline citations and the page's computed curves.

**How.** Tier-1 RAG: this Atlas record plus the standards' citation metadata;
current curve state (standard, asset class, scenario multiplier) passes as context.
Every parameter quoted must match the table; the copilot flags the EP curve's
provenance honestly (placeholder pre-Evolution A, grid-derived after). No
endpoints exist, so tool-calling waits on a backend port of the curve engine —
which Evolution A's grid integration will force anyway.

**Prerequisites.** Corpus embedding (D3); Evolution A for EP-curve claims beyond
the disclosure. **Acceptance:** parameter quotes match the cited standards; curve
recommendations are consistent with the asset-class mapping table; SSP multiplier
questions get the curated-value answer with its IPCC framing, not invented
precision.