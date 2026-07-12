## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry cites `CityRiskRating = w_P ×
> PhysicalHazard − w_A × AdaptiveCapacity + w_V × Vulnerability` and `MuniBondSpreadImpact =
> BaseSpread × (1 + ClimateRiskPremium)`, "calibrated from Moody's empirical analysis".
> **Neither formula exists in the code.** In `CityClimateRiskRatingPage.jsx` the physical-risk
> score, hazard sub-scores, resilience, and credit-rating impact are all *independent* seeded-
> PRNG draws — no weighted composite, no adaptive-capacity offset, no spread model. The only
> genuine scenario math is two linear stress multipliers on the heat and sea-level charts.
> Sections below document the code as it actually behaves.

### 7.1 What the module computes

80 cities (real names — Miami, Rotterdam, Jakarta, Lagos… — assigned round-robin to 5 regions
via `i % 5`, which mis-regions many, e.g. city order does not match region cycling) each carry
13 synthetic fields on `sr(s)=frac(sin(s+1)·10⁴)`:

| Field | Formula | Range |
|---|---|---|
| `physicalRiskScore` | `round(20 + sr(i·3)·80)` | 20–100 |
| `floodRisk`/`heatRisk`/`seaLevelRisk`/`droughtRisk`/`airQualityRisk` | `1 + sr(i·k)·9` (k = 7/11/13/17/19) | 1–10 |
| `economicResilienceScore` | `round(20 + sr(i·23)·80)` | 20–100 |
| `creditRatingImpact` | `sr(i·31)·4` | 0–4 notches |
| `adaptationBudget` | `0.1 + sr(i·37)·9.9` | $0.1–10B |
| `climateDebtRisk` | `1 + sr(i·41)·9` | 1–10 |
| `population` | `0.5 + sr(i·43)·19.5` | 0.5–20 M |

Two derived flags use a threshold rubric on the physical score alone:
`investmentGradeRisk = physRisk > 65` and
`riskTier: <35 Low, <55 Medium, <75 High, else Critical`.

### 7.2 Scenario stress multipliers (the only live model)

Two sliders drive linear what-if scaling on chart series (never on the stored scores):

```js
// Heat tab — heatScenario ∈ [1.5, 4.0] °C, step 0.5
stressed_heat = min(10, heatRisk × (1 + (heatScenario − 1.5) × 0.1))
// SLR tab — slrScenario ∈ [10, 200] cm, step 10
stressed_slr  = min(10, seaLevelRisk × (1 + (slrScenario − 50) / 200))
```

Interpretation: +1°C of warming above 1.5°C inflates heat risk by 10% (so +4°C ⇒ ×1.25); each
extra metre of SLR above the 50cm baseline inflates SLR risk by 50% (200cm ⇒ ×1.75). Both are
capped at the 10-point scale ceiling. The multiplier slopes (0.1/°C, 1/200 per cm) are
unattributed synthetic demo constants, not IPCC damage-function calibrations.

### 7.3 Calculation walkthrough

Filters (region / riskTier / IG-risk) → `filtered` → four KPIs, all guarded against empty
sets: `avgPhysRisk = Σscore/n`, `igRiskPct = count(IG)/n·100`, `totalAdapt = Σbudget`,
`avgCredit = Σnotches/n`. Chart pipelines: `regionRisk` (mean physical score per region),
`top5` (copied-array sort by physical score, top 5) feeding a 5-hazard radar,
`scatterData = {x: adaptationBudget, y: physicalRiskScore}` (an adaptation-vs-risk scatter that
is structurally uncorrelated because both are independent draws), and `creditByRegion` (mean
notch impact per region).

### 7.4 Worked example — city i = 0 (Miami)

All seeds collapse to `sr(0) ≈ 0.7098` at i = 0: `physicalRiskScore = round(20 + 0.7098·80)` =
**77** → riskTier **Critical** (≥75) and `investmentGradeRisk = true` (77 > 65);
`creditRatingImpact = 0.7098·4 ≈ 2.8` notches. On the Heat tab at the +3.0°C slider setting:
`stressed = min(10, heatRisk × (1 + 1.5·0.1)) = heatRisk × 1.15`. With `heatRisk = 1 +
0.7098·9 ≈ 7.4`, stressed = **8.5**. Under the default full universe these values enter
`avgPhysRisk` (80-city mean) and Miami appears in `top5`.

### 7.5 Data provenance & limitations

- **All city data is synthetic** (seeded PRNG); no ND-GAIN, C40, WRI Aqueduct or Moody's data
  is loaded despite real city names inviting that reading. The region assignment `i % 5`
  contradicts the name list ordering (e.g. 'London' lands in whatever region index 10 maps to).
- Hazard sub-scores, composite score, resilience and credit impact are mutually independent
  draws — the composite is *not* a function of the sub-scores, so the radar and the headline
  rating can contradict each other.
- Credit impact (0–4 notches) is a uniform draw, unrelated to physical score; the guide's
  Moody's-style "hazard minus adaptive capacity" logic is absent.
- Scenario multipliers are linear, hazard-agnostic and applied only to two chart tabs.

### 7.6 Framework alignment

- **Moody's *Cities and Climate Change Risk* (2021)** — guide's anchor. Moody's actual approach
  scores hazard exposure against economic/fiscal adaptive capacity to derive credit-relevant
  net risk; only the *vocabulary* survives here (IG-risk flag, notch impact).
- **S&P municipal climate methodology** — S&P embeds climate in its Environmental credit
  factors, adjusting the Institutional/Economy scores; the 15–40bps spread premium quoted in
  the guide's dataPoints is literature-consistent but never computed in code.
- **C40 / IPCC AR6 WGII Ch.8** — cited context for urban hazard exposure; the 5-hazard taxonomy
  (flood/heat/SLR/drought/air) is a reasonable simplification of AR6 urban risk chains.

## 8 · Model Specification — City Climate Risk Rating & Muni Spread Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Produce a defensible city-level climate risk rating and a municipal-bond spread impact for the
80-city universe, supporting muni fund screening and city benchmarking. Horizon: 2030/2050
under 3 scenarios (SSP1-2.6, SSP2-4.5, SSP5-8.5).

### 8.2 Conceptual approach

Hazard–exposure–vulnerability composite per **IPCC AR6 risk framing**, operationalised the way
**Moody's (climate-adjusted municipal analysis)** and **ND-GAIN Urban** structure it: net risk
= exposure-weighted hazard minus adaptive capacity. Spread impact estimated from the empirical
muni-climate literature (Painter 2020 *JFE*; Goldsmith-Pinkham et al. 2023 SLR exposure
premia), the same evidence base S&P cites.

### 8.3 Mathematical specification

```
H_c,s,t  = Σ_h w_h · z(hazard_h,c,s,t)          // 5 hazards, z-scored vs universe
E_c      = z(pop_density, assets_exposed)        // exposure index
V_c      = 1 − z(GDP_pc, fiscal_headroom, adaptation_spend/GDP)   // vulnerability
Risk_c   = 100 · Φ(0.5·H + 0.25·E + 0.25·V)      // 0–100 rating, Φ = normal CDF squashing
ΔSpread_c = β_SLR·SLRexp_c + β_heat·HDDΔ_c + β_flood·EAL_c/GDP_c   // bps
Notches_c = clamp(round(ΔSpread_c / 25), 0, 3)   // ≈25bps per notch, IG muni curve
```

| Parameter | Value / source |
|---|---|
| Hazard weights `w_h` | Start equal (0.2); recalibrate by regression on EM-DAT city-loss frequencies |
| Hazard fields | WRI Aqueduct floods (free), Copernicus/ERA5 heat, IPCC AR6 interactive atlas SLR, SPEI drought |
| `β_SLR` | ≈ 5–8 bps per 1% of property in SLR zone — Goldsmith-Pinkham et al. (2023) |
| `β_flood` | EAL/GDP slope from Painter (2020): long-maturity climate-exposed munis pay ~+15–40bps |
| Adaptive capacity | GDP per capita (OECD metro DB), fiscal balance (city CAFRs), C40 adaptation-plan flag |
| 25 bps/notch | Typical IG muni spread step, MSRB EMMA trade data |

### 8.4 Data requirements

City hazard layers (Aqueduct, AR6 atlas — free), exposure (GHSL population/built-up, free),
fiscal metrics (city financial statements; Moody's/S&P rating actions), muni spreads (MSRB
EMMA, free). Platform reuse: ND-GAIN and WRI Aqueduct seeds already exist in the public-data
layer (GAP-wiring seed files); PostGIS hazard tables from migrations 057–067.

### 8.5 Validation & benchmarking plan

Backtest ΔSpread against realised muni spreads for a 50-city US sample (target: sign-correct,
R² ≥ 0.15 — climate premia are small); rank-correlate Risk_c against ND-GAIN Urban and C40
assessments (ρ ≥ 0.6); event study on hurricane landfalls (spread widening capture);
sensitivity: weights ±50%, scenario swap SSP2→SSP5 must be monotone risk-increasing.

### 8.6 Limitations & model risk

Muni climate premia are empirically small and US-centric — extrapolation to non-US cities is
weakly identified; adaptive-capacity data is inconsistent across jurisdictions; hazard layers
have coastal-resolution error for SLR. Fallbacks: floor ΔSpread at 0, report rating with a
data-quality tier (A–D by input coverage), and suppress notch translation where the city has
no rated debt.
