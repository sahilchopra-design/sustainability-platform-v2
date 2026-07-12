# City Climate Risk Rating
**Module ID:** `city-climate-risk-rating` · **Route:** `/city-climate-risk-rating` · **Tier:** B (frontend-computed) · **EP code:** EP-DM3 · **Sprint:** DM

## 1 · Overview
Provides comprehensive climate risk ratings for cities combining physical hazard exposure, adaptive capacity, and socioeconomic vulnerability. Models climate-adjusted municipal credit ratings, insurance pricing implications, and city bond spread impacts.

> **Business value:** Essential for municipal bond fund managers incorporating climate risk into city credit analysis, city governments benchmarking climate resilience, and insurers pricing municipal risk. Aligned with Moody's and S&P climate-adjusted municipal rating methodologies.

**How an analyst works this module:**
- Select city for climate risk rating
- Input multi-hazard exposure scores
- Calculate adaptive capacity offset
- Model credit rating climate adjustment
- Generate Moody's/S&P comparable city climate risk report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `RISK_TIERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `physRisk` | `Math.round(20 + sr(i * 3) * 80);` |
| `floodR` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `heatR` | `+(1 + sr(i * 11) * 9).toFixed(1);` |
| `slrR` | `+(1 + sr(i * 13) * 9).toFixed(1);` |
| `droughtR` | `+(1 + sr(i * 17) * 9).toFixed(1);` |
| `airQ` | `+(1 + sr(i * 19) * 9).toFixed(1);` |
| `econRes` | `Math.round(20 + sr(i * 23) * 80);` |
| `infraVuln` | `+(1 + sr(i * 29) * 9).toFixed(1);` |
| `creditImpact` | `+(sr(i * 31) * 4).toFixed(1);` |
| `adaptBudget` | `+(0.1 + sr(i * 37) * 9.9).toFixed(1);` |
| `climDebt` | `+(1 + sr(i * 41) * 9).toFixed(1);` |
| `avgPhysRisk` | `filtered.length ? (filtered.reduce((s, c) => s + c.physicalRiskScore, 0) / filtered.length).toFixed(0) : '0';` |
| `igRiskPct` | `filtered.length ? (filtered.filter(c => c.investmentGradeRisk).length / filtered.length * 100).toFixed(0) : '0';` |
| `totalAdapt` | `filtered.reduce((s, c) => s + c.adaptationBudget, 0).toFixed(1);` |
| `avgCredit` | `filtered.length ? (filtered.reduce((s, c) => s + c.creditRatingImpact, 0) / filtered.length).toFixed(1) : '0';` |
| `regionRisk` | `REGIONS.map(r => {` |
| `top5` | `[...filtered].sort((a, b) => b.physicalRiskScore - a.physicalRiskScore).slice(0, 5);` |
| `radarData` | `['floodRisk', 'heatRisk', 'seaLevelRisk', 'droughtRisk', 'airQualityRisk'].map(dim => {` |
| `entry` | `{ dimension: dim.replace('Risk', '').replace(/([A-Z])/g, ' $1').trim() };` |
| `scatterData` | `filtered.map(c => ({ x: c.adaptationBudget, y: c.physicalRiskScore, name: c.name }));` |
| `creditByRegion` | `REGIONS.map(r => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `COLORS`, `REGIONS`, `RISK_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cities at High Physical Risk | — | C40 Cities Climate Risk 2023 | 800+ cities face significant physical climate risk by 2050 — 1/3 of all major urban centres |
| Climate Credit Impact | — | Moody's Climate Risk Assessment 2022 | Climate risk can cause 1–3 notch credit rating downgrade for exposed coastal/drought-prone cities |
| Municipal Bond Climate Premium | — | S&P Municipal Climate Risk Research 2023 | Climate-exposed municipalities pay 15–40 bps spread premium — growing as investors price risk |
- **Multi-hazard city exposure data (flood, heat, drought)** → Physical risk scoring → **City-level physical risk score by hazard and scenario**
- **City adaptive capacity indicators (income, governance, investment)** → Adaptive capacity calculation → **Net climate risk after adaptive capacity offset**
- **Municipal bond yield data + city financial metrics** → Spread impact modelling → **Climate risk premium in municipal bond pricing**

## 5 · Intermediate Transformation Logic
**Methodology:** City Climate Risk Rating
**Headline formula:** `CityRiskRating = w_P × PhysicalHazard - w_A × AdaptiveCapacity + w_V × Vulnerability; MuniBondSpreadImpact = BaseSpread × (1 + ClimateRiskPremium)`

Adaptive capacity subtracts from hazard to produce net risk; spread impact multiplier calibrated from Moody's empirical analysis of climate-exposed municipal bonds

**Standards:** ["Moody's Cities and Climate Change Risk 2021", 'S&P Global Ratings Climate Risk Assessment Framework', 'C40 City Climate Risk Assessment', 'IPCC AR6 WGII Chapter 8 — Cities']
**Reference documents:** Moody's Investors Service — Cities and Climate Change Risk (2021); S&P Global Ratings — How We Apply Climate Risk in Municipal Bond Ratings; C40 Cities Climate Risk and Adaptation Framework; IPCC AR6 WGII Chapter 8 — Cities, Settlements and Key Infrastructure

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Rate real cities from the platform's own hazard grids (analytics ladder: rung 1 → 3)

**What.** §7 documents the module's core defect: 80 real city names (Miami, Rotterdam,
Jakarta, Lagos…) carry 13 *independent* PRNG-drawn fields — hazard sub-scores, physical
risk, resilience, and credit impact are unrelated to each other and to the cities, and
the `i % 5` region assignment mis-regions many. Meanwhile the platform already
operates a Physical Risk Digital Twin: five populated `ref_*_zones` PostGIS grids
(earthquake, cyclone, wildfire, flood, sea-level from USGS/IBTrACS/GWIS/OpenFEMA/
IPCC-AR6) with a composite scoring engine. Evolution A replaces the fabricated fields
with per-city hazard lookups from those grids at each city's actual coordinates, then
implements the guide's advertised composite
(`CityRiskRating = w_P·Hazard − w_A·AdaptiveCapacity + w_V·Vulnerability`) with
adaptive-capacity proxies from curated sources (GDP per capita, C40 membership,
adaptation-plan status).

**How.** (1) City gazetteer table (name, lat/lon, region — fixing the mis-regioning) →
digital-twin composite score per city via the existing scoring engine's resolution
cascade. (2) The weighted composite as a pure function with documented weights; the
two genuine stress multipliers (heat, sea-level charts) retained and wired to grid
values. (3) Muni-spread impact deferred or shipped as a clearly-labelled illustrative
multiplier until an empirical calibration source exists — do not fake the Moody's
calibration the guide claims.

**Prerequisites (hard).** PRNG purge is the deliverable; flood/sea-level grid coverage
is currently sparse (48/152 rows) so `resolution_tier` honesty is mandatory for cities
outside coverage. **Acceptance:** Miami and Rotterdam differ on flood/SLR sub-scores
in the direction the grids dictate; every sub-score traces to a grid query or a cited
proxy; zero `sr()` calls remain.

### 9.2 Evolution B — Municipal risk copilot (LLM tier 2)

**What.** Post-Evolution A, an analyst assistant over real ratings: "why is Jakarta
rated worse than Singapore?" answered by decomposing the composite into grid-sourced
hazard terms and capacity proxies, "show the top-10 sea-level-exposed cities in our
coverage", "what would a stronger adaptation program do to Lagos's score?" as a
tool-called re-run with the capacity input changed. Tool surface: the digital twin's
existing composite-scoring endpoints plus the new city-rating function.

**How.** Tool schemas over the twin's scoring API filtered via the atlas endpoint map;
per the tier-2 contract every score and sub-score in an answer matches a tool response;
the "show work" expander lists grid tables consulted and each lookup's
`resolution_tier`, so sparse-coverage cities are visibly lower-confidence.

**Prerequisites (hard).** Evolution A complete — narrating today's seeded numbers
about real cities would be fabrication attached to real names, the platform's worst
provenance pattern. **Acceptance:** a comparative-rating explanation cites grid values
reproducible by direct query; the copilot flags any city scored on country-level
fallback rather than grid resolution.