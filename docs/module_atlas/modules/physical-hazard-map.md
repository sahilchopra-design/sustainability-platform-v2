# Physical Hazard Map
**Module ID:** `physical-hazard-map` · **Route:** `/physical-hazard-map` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-peril physical climate hazard mapping across asset locations using gridded climate datasets and SSP scenarios.

> **Business value:** Provides asset-level physical hazard intelligence across six perils under multiple SSP scenarios for integration into risk pricing and portfolio stress-testing.

**How an analyst works this module:**
- Select SSP scenario and time horizon.
- Upload or geocode asset coordinates.
- View per-peril hazard tiles and composite score.
- Export location-level hazard report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_CLASSES`, `COUNTRIES`, `KpiCard`, `PERILS`, `RISK_BG`, `RISK_COLOR`, `SCENARIOS`, `SectionTitle`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PERILS` | 9 | `label`, `icon`, `color`, `standard` |
| `SCENARIOS` | 6 | `label`, `year`, `mult`, `color`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `sr(i * 13);` |
| `hazardScores` | `PERILS.reduce((acc, p) => {` |
| `composite` | `Math.round(Object.values(hazardScores).reduce((a, b) => a + b, 0) / PERILS.length);` |
| `avgComposite` | `filteredAssets.length ? Math.round(filteredAssets.reduce((s, a) => s + a.composite, 0) / filteredAssets.length * scenarioMult) : 0;` |
| `totalExposure` | `filteredAssets.reduce((s, a) => s + a.value, 0);` |
| `perilData` | `PERILS.map(p => ({` |
| `countryData` | `COUNTRIES.map((c, i) => {` |
| `avgScore` | `assets.length ? Math.round(assets.reduce((s, a) => s + a.composite, 0) / assets.length * scenarioMult) : 0;` |
| `radarData` | `PERILS.map(p => {` |
| `adj` | `Math.min(100, Math.round(a.composite * scenarioMult));` |
| `pct` | `(filteredAssets.length ? (count / filteredAssets.length) * 100 : 0).toFixed(0);` |
| `scores` | `filteredAssets.map(a => Math.min(100, Math.round((a[selectedPeril] \|\| 0) * scenarioMult)));` |
| `scenarioProgression` | `SCENARIOS.map(s => ({` |
| `score` | `Math.min(100, Math.round((a[selectedPeril] \|\| 0) * scenarioMult));` |
| `adjScore` | `Math.min(100, Math.round(a.composite * scenarioMult));` |
| `aScore` | `aAssets.length ? aAssets.reduce((s, x) => s + (x[p.id] \|\| 0), 0) / aAssets.length : 0;` |
| `bScore` | `bAssets.length ? bAssets.reduce((s, x) => s + (x[p.id] \|\| 0), 0) / bAssets.length : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/physical-hazard/score-hazard` | `score_hazard` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/composite-risk` | `composite_risk` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/financial-impact` | `financial_impact` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/crrem-check` | `crrem_check` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/full-assessment` | `full_assessment` | api/v1/routes/physical_hazard.py |
| GET | `/api/v1/physical-hazard/ref/hazard-profiles` | `ref_hazard_profiles` | api/v1/routes/physical_hazard.py |
| GET | `/api/v1/physical-hazard/ref/country-hazard` | `ref_country_hazard` | api/v1/routes/physical_hazard.py |
| GET | `/api/v1/physical-hazard/ref/adaptation-measures` | `ref_adaptation_measures` | api/v1/routes/physical_hazard.py |

### 2.3 Engine `physical_hazard_engine` (services/physical_hazard_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PhysicalHazardEngine.score_hazard` | entity_id, hazard_type, country_code, asset_type, climate_scenario, time_horizon, base_hazard_override, vulnerability_override | Score a single hazard for an asset in a given country. Returns hazard_score 0-100, scenario-adjusted intensities, exposure_level, vulnerability_score, and adaptation guidance. base_hazard_override (0-100) supplies a real site-level hazard exposure (e.g. from a WRI Aqueduct / JRC pixel lookup) when the country/hazard pair is absent from COUNTRY_BASE_HAZARD; vulnerability_override (0-1) supplies an  |
| `PhysicalHazardEngine.compute_composite_risk` | entity_id, hazard_scores | Compute weighted composite hazard score. Weights: flood 20%, wildfire 15%, heat_stress 20%, sea_level_rise 15%, cyclone 15%, drought 10%, subsidence 5%. Hazards absent from ``hazard_scores`` are excluded and the remaining weights are renormalised over the supplied subset (no fabricated fill-in). Missing hazards are reported in ``missing_hazards``. |
| `PhysicalHazardEngine.estimate_financial_impact` | entity_id, composite_score, asset_type, asset_value_mn, damage_curve_multiplier | Estimate property damage, business interruption, and adaptation CAPEX. Deterministic damage-function estimates driven by the composite hazard score. ``damage_curve_multiplier`` optionally supplies a real site/asset-specific damage-function calibration (e.g. from a vulnerability curve library); when omitted it defaults to the model central estimate (1.0). Returns an ``insufficient_data`` payload wh |
| `PhysicalHazardEngine.check_crrem_alignment` | entity_id, asset_type, climate_scenario | Check CRREM pathway compliance and stranding year for the asset. |
| `PhysicalHazardEngine.full_assessment` | entity_id, asset_name, asset_type, country_code, climate_scenario, time_horizon, asset_value_mn | Complete physical hazard assessment combining all methods. |
| `PhysicalHazardEngine.get_hazard_profiles` |  |  |
| `PhysicalHazardEngine.get_country_base_hazard` |  |  |
| `PhysicalHazardEngine.get_asset_vulnerability` |  |  |
| `PhysicalHazardEngine.get_adaptation_measures` |  |  |

**Engine `physical_hazard_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `HAZARD_PROFILES` | `{'flood': {'description': 'Riverine and coastal flood risk', 'data_source': 'JRC_EFAS_Global + WRI_Aqueduct_4.0', 'intensity_metric': '1-in-100yr flood depth (m)', 'rcp26_multiplier': 1.1, 'rcp45_multiplier': 1.3, 'rcp85_multiplier': 1.8}, 'wildfire': {'description': 'Wildfire hazard index (FWI)', '` |
| `COUNTRY_BASE_HAZARD` | `{'BD': {'flood': 90, 'cyclone': 85, 'heat_stress': 70, 'drought': 40, 'sea_level_rise': 88}, 'PH': {'flood': 75, 'cyclone': 90, 'heat_stress': 65, 'drought': 45, 'sea_level_rise': 70}, 'IN': {'flood': 65, 'heat_stress': 75, 'drought': 60, 'cyclone': 55}, 'CN': {'flood': 60, 'heat_stress': 55, 'droug` |
| `ASSET_VULNERABILITY` | `{'office_building': {'flood': 0.6, 'heat_stress': 0.4, 'wildfire': 0.5}, 'industrial_plant': {'flood': 0.8, 'heat_stress': 0.6, 'wildfire': 0.7}, 'data_centre': {'flood': 0.9, 'heat_stress': 0.9, 'wildfire': 0.8}, 'retail': {'flood': 0.7, 'heat_stress': 0.5, 'wildfire': 0.6}, 'residential': {'flood'` |
| `CRREM_STRANDING_YEARS` | `{'office_building': {'RCP8.5': 2035, 'RCP4.5': 2042, 'RCP2.6': 2055}, 'industrial_plant': {'RCP8.5': 2030, 'RCP4.5': 2038, 'RCP2.6': 2048}, 'residential': {'RCP8.5': 2038, 'RCP4.5': 2045, 'RCP2.6': 2058}, 'retail': {'RCP8.5': 2033, 'RCP4.5': 2040, 'RCP2.6': 2052}}` |
| `ADAPTATION_MEASURES` | `{'flood': 'Install flood barriers, raise critical equipment, waterproof building envelope', 'wildfire': 'Create defensible space, fire-resistant construction materials, vegetation management', 'heat_stress': 'Cool roofs, green infrastructure, HVAC upgrade, passive cooling design', 'sea_level_rise': ` |
| `COMPOSITE_WEIGHTS` | `{'flood': 0.2, 'wildfire': 0.15, 'heat_stress': 0.2, 'sea_level_rise': 0.15, 'cyclone': 0.15, 'drought': 0.1, 'subsidence': 0.05}` |
| `EXPOSURE_LEVELS` | `[(80, 'very_high'), (60, 'high'), (40, 'medium'), (20, 'low'), (0, 'very_low')]` |
| `RISK_TIERS` | `[(75, 'critical'), (55, 'high'), (35, 'medium'), (15, 'low'), (0, 'negligible')]` |
| `CURRENT_YEAR` | `2026` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `country`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `COUNTRIES`, `PERILS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peak Flood Depth (m) | — | JBA/Fathom | Modelled 1-in-100-year inundation depth at asset centroid. |
| Wildfire Hazard Index | — | FIRMS/EFFIS | Normalised 0–1 fire weather index under SSP5-8.5 by 2050. |
| Heat Stress Days/yr | — | ERA5 Reanalysis | Annual days exceeding 35°C wet-bulb threshold at location. |
- **Gridded hazard rasters + asset coordinates** → Bilinear interpolation to asset point; peril normalisation; weighted aggregation → **Per-asset multi-peril hazard scores + composite index**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/physical-hazard/ref/adaptation-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['flood', 'wildfire', 'heat_stress', 'sea_level_rise', 'cyclone', 'drought', 'subsidence'], 'n_keys': 7}`

**GET /api/v1/physical-hazard/ref/country-hazard** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['BD', 'PH', 'IN', 'CN', 'US', 'AU', 'ES', 'DE', 'NL', 'GB', 'JP', 'BR', 'ZA', 'NG', 'ID'], 'n_keys': 15}`

**GET /api/v1/physical-hazard/ref/hazard-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['flood', 'wildfire', 'heat_stress', 'sea_level_rise', 'cyclone', 'drought', 'subsidence'], 'n_keys': 7}`

**POST /api/v1/physical-hazard/composite-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-hazard/crrem-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-hazard/financial-impact** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-hazard/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-hazard/score-hazard** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Hazard Score
**Headline formula:** `H = Σ(wᵢ × perilᵢ) / Σwᵢ`

Weighted aggregation of normalised peril intensities across flood, heat, drought, wind, wildfire, and sea-level rise.

**Standards:** ['IPCC AR6 WG1', 'JBA Flood Data']
**Reference documents:** IPCC AR6 Chapter 12: Climate Change Information for Regional Impact Assessment; JBA Global Flood Model Technical Documentation

**Engine `physical_hazard_engine` — extracted transformation lines:**
```python
years_forward = max(0, horizon_year - CURRENT_YEAR)
time_factor = 1.0 + (years_forward / 100) * (multiplier - 1.0)
hazard_score = min(100.0, round(base_score * time_factor, 2))
vulnerability_score = round(vuln_fraction * 100, 2) if vuln_fraction is not None else None
return_period_20yr = round(base_score * 0.6 * multiplier, 2) if base_score is not None else None
return_period_100yr = round(base_score * 1.0 * multiplier, 2) if base_score is not None else None
property_damage_pct = round(composite_score * 0.4 * curve, 2)
business_interruption_days = round(composite_score * 0.5 * curve)
stranded_value_risk_pct = round(composite_score * 0.25 * curve, 2)
property_damage_value_mn = round(asset_value_mn * property_damage_pct / 100, 3)
stranded_value_mn = round(asset_value_mn * stranded_value_risk_pct / 100, 3)
crrem_pathway_compliant = stranding_year > CURRENT_YEAR + 10
years_to_stranding = stranding_year - CURRENT_YEAR
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A **real, well-built backend engine** exists at
> `backend/services/physical_hazard_engine.py` (routes registered under `/api/v1/physical-hazard/*`
> — `score-hazard`, `composite-risk`, `financial-impact`, `crrem-check`, `full-assessment`) that
> implements exactly what the guide describes: IPCC AR6 WG2 + JRC Climate Hazard Atlas-referenced
> country/hazard base scores, RCP-scenario multipliers, honest-null handling when reference data is
> missing, and CRREM stranding-year checks. **The frontend page does not call any of these
> endpoints.** `grep` for `fetch(`/`axios.` in `PhysicalHazardMapPage.jsx` returns no matches — the
> page instead generates its own **independent, uniformly-averaged synthetic dataset** with a
> different peril taxonomy (8 perils, splitting flood into riverine/coastal/pluvial) and a different
> scenario-multiplier table (5 SSP/current bands) than the backend engine's 7-hazard,
> weighted-composite (`COMPOSITE_WEIGHTS`) design. This is a "correct engine, unused" pattern rather
> than a "no real model" pattern — §7 documents both; §8 recommends wiring instead of building anew.

### 7.1 What the frontend actually computes

```js
hazardScores[perilId] = round(sr(i*7 + PERILS.indexOf(peril)) × 85 + 10)     // 10–95, independent per peril
composite              = round(Σ hazardScores / PERILS.length)                // simple unweighted mean
avgComposite            = round(mean(filteredAssets.composite) × scenarioMult)
```

40 synthetic assets are generated across 15 countries and 6 asset classes; each of 8 perils gets an
independent random score, and the composite is a **plain arithmetic mean** — not the guide's stated
`H = Σ(wᵢ×perilᵢ)/Σwᵢ` weighted aggregation.

### 7.2 What the backend engine actually computes (unused by this page)

```python
composite_hazard_score = Σ(score_h × weight_h) / Σ(weight_h used)   # renormalises over available hazards only
```

| Hazard | Weight | Data source cited |
|---|---|---|
| Flood | 0.20 | JRC_EFAS_Global + WRI_Aqueduct_4.0 |
| Heat stress | 0.20 | IPCC_AR6_Atlas + ERA5 |
| Wildfire | 0.15 | JRC_GWIS + Copernicus_EFFIS |
| Sea level rise | 0.15 | IPCC_AR6_SLR + CoastalDEM |
| Cyclone | 0.15 | IBTrACS + CMIP6 |
| Drought | 0.10 | SPEI_Global_DB + CRU_TS4 |
| Subsidence | 0.05 | InSAR_Global + Peat_Depth_Atlas |

The engine's `score_hazard()` looks up a country/hazard base score from a real-country-profile table
(`COUNTRY_BASE_HAZARD`, 15 countries with hazard-specific 0–100 scores — e.g. Bangladesh flood=90,
Australia wildfire=80), applies an RCP scenario multiplier (1.0–2.2 by hazard and RCP band) and a
time-horizon amplification factor, and — critically — **returns an honest `null` with
`source="insufficient_data"` when neither a reference-data entry nor a caller override exists**,
rather than fabricating a neutral-prior number. This null-propagates through
`compute_composite_risk` (renormalises weights over only the hazards actually scored) and
`estimate_financial_impact` (returns a full `insufficient_data` payload rather than a fake dollar
figure) — a deliberately conservative, audit-friendly design.

### 7.3 Frontend calculation walkthrough

1. **Asset generation**: 40 assets, each drawing all 8 peril scores independently
   (`sr(i*7+perilIndex)`) — no country-base-hazard lookup, so e.g. a Bangladesh asset and a Germany
   asset have statistically identical flood-risk distributions, which is physically wrong (the
   backend engine's `COUNTRY_BASE_HAZARD` table correctly differentiates these).
2. **Scenario multiplier**: `SCENARIOS` (5 bands: Current→1.00, SSP1-2.6→1.15, SSP2-4.5→1.35,
   SSP5-8.5(2050)→1.68, SSP5-8.5(2100)→2.42) scales the composite and per-peril/country/radar
   aggregates uniformly — this is a genuine scenario-stress mechanic, just applied on top of
   unweighted, non-country-differentiated base scores.
3. **Composite/risk tier**: `composite > 65 → High`, `> 40 → Medium`, else `Low` — a simple
   threshold rubric distinct from the backend's 5-tier `RISK_TIERS` (critical/high/medium/low/
   negligible at 75/55/35/15/0).
4. **CRREM alignment**: the backend's `check_crrem_alignment()` (stranding-year lookup by asset type
   and RCP scenario, e.g. office building RCP8.5→2035) has no corresponding call or logic in this
   page at all.

### 7.4 Worked example (frontend, as actually shown to users)

Asset index `i=8`, SSP5-8.5 (2050) scenario (`mult=1.68`):

| Peril | `sr(8×7 + perilIdx)×85+10` | Illustrative result |
|---|---|---|
| Riverine flood (idx 0) | sr(56)×85+10 | e.g. 52 |
| Wildfire (idx 3) | sr(59)×85+10 | e.g. 71 |
| Extreme heat (idx 4) | sr(60)×85+10 | e.g. 38 |
| Composite (unweighted mean of 8) | (52+…+38+…)/8 | e.g. 55 |
| Scenario-adjusted composite | 55 × 1.68 | **92.4** (capped at 100 in downstream display logic elsewhere) |

There is no path in the visible code from this number to a dollar-denominated property-damage or
adaptation-CAPEX estimate — that logic exists only in the unused backend
`estimate_financial_impact()`.

### 7.5 Data provenance & limitations

- **Frontend hazard scores are pure `sr()`-seeded synthetic data**, not country- or asset-type
  differentiated, despite the country/asset-class filters implying that differentiation exists.
- **A correctly-designed backend engine with honest-null handling, weighted composite scoring, and
  CRREM alignment sits unused** — this is the highest-value integration gap found in this module: no
  new model needs to be designed, it needs to be *wired up*.
- The frontend's 8-peril taxonomy (splitting flood into riverine/coastal/pluvial) doesn't map
  1:1 onto the backend's 7-hazard taxonomy (single "flood" category) — reconciling them requires a
  taxonomy decision, not just an API call.

**Framework alignment:** IPCC AR6 WG2 and JRC Climate Hazard Atlas are genuinely implemented — in
the backend engine, which this page doesn't call. The page's own SSP-scenario labelling (SSP1-2.6,
SSP2-4.5, SSP5-8.5) is directionally correct IPCC terminology, applied as a uniform multiplier rather
than the engine's hazard-specific RCP multiplier table.

## 8 · Model Specification

**Status: specification — not yet implemented as the data source for this page (a compliant engine
already exists in the backend and should be wired in rather than re-specified from scratch).**

### 8.1 Purpose & scope
Serve country/asset-type-differentiated, weighted-composite physical hazard scores with honest
missing-data handling to the frontend hazard map, replacing the current uniform-random,
unweighted-mean placeholder.

### 8.2 Conceptual approach
Wire `PhysicalHazardMapPage.jsx` to `POST /api/v1/physical-hazard/full-assessment` per asset (or a
batched variant), replacing the local `ASSETS` generator. This mirrors how BlackRock Aladdin Climate
and MSCI Climate VaR separate a "hazard data service" (the engine) from "portfolio view" (the UI) —
the engine here is already benchmark-consistent (weighted composite renormalised over available
hazards, honest nulls) and doesn't need re-design, only integration.

### 8.3 Mathematical specification (already implemented in the engine — restated for reference)
See §7.2's weighted-composite formula and `COMPOSITE_WEIGHTS` table; no new maths required. The one
gap to close: the frontend's 3-way flood split (riverine/coastal/pluvial) needs either (a) collapsing
to the engine's single `flood` hazard, or (b) extending `HAZARD_PROFILES`/`COUNTRY_BASE_HAZARD` in
the engine to carry the 3-way split, whichever preserves more information for underwriting use.

### 8.4 Data requirements
Already met by the engine's static reference tables (`COUNTRY_BASE_HAZARD`, `ASSET_VULNERABILITY`,
`CRREM_STRANDING_YEARS`). To go beyond illustrative country-level scores, source real site-level
raster lookups (JRC EFAS, WRI Aqueduct 4.0 API, JRC GWIS) keyed by asset lat/long — the engine's
`base_hazard_override` parameter already supports injecting such a value when available.

### 8.5 Validation & benchmarking plan
Once wired, reconcile country-level base hazard scores against WRI Aqueduct's own published country
rankings and IPCC AR6 Atlas regional summaries; unit-test that `missing_hazards` renormalisation in
`compute_composite_risk` behaves correctly at the frontend layer (no silent zero-fill).

### 8.6 Limitations & model risk
Even once wired, the engine's country-level base hazard is a coarse proxy for site-level risk — a
production deployment should prioritise the `base_hazard_override` path with real gridded-raster
lookups over the static country table for material single-asset underwriting decisions.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the unused backend engine into the map (analytics ladder: rung 2 → 4)

**What.** §7 documents a "correct engine, unused" pattern: a real, well-built `physical_hazard_engine.py` exists at `/api/v1/physical-hazard/*` (`score-hazard`, `composite-risk`, `financial-impact`, `crrem-check`, `full-assessment`) implementing IPCC AR6 WG2 + JRC Climate Hazard Atlas base scores, RCP multipliers, honest-null handling, weighted-composite renormalisation over available hazards, and CRREM stranding-year checks — but `PhysicalHazardMapPage.jsx` calls none of them, instead generating its own synthetic dataset with a *different* peril taxonomy (8 vs 7) and a *different* scenario-multiplier table, using a plain unweighted mean instead of the engine's `Σ(score×weight)/Σweight`. §8 explicitly recommends wiring, not rebuilding.

**How.** (1) Replace the frontend's synthetic generation with calls to `POST /full-assessment` (and the granular `score-hazard`/`composite-risk`/`financial-impact`/`crrem-check` for the per-tab drill-downs), so the map renders the engine's real weighted composite and CRREM checks; the three reference GETs (`hazard-profiles`, `country-hazard`, `adaptation-measures`, all `passed`) drive the pickers and the Adaptation Options content. (2) Reconcile the peril taxonomy — adopt the engine's 7-hazard design (the frontend's flood-split is cosmetic). (3) Rung-4: upgrade the engine's country-level base scores to the Physical Risk Digital Twin's per-coordinate `ref_*_zones` grids so two assets in the same country differ by micro-location — the same asset-resolution ladder the flagship `physical-risk-pricing` module follows.

**Prerequisites.** `POST /composite-risk` is `skipped` in the lineage sweep (needs a request fixture) and REQUIRE_AUTH gates POSTs — exercise under auth first. **Acceptance:** the map renders engine output (weighted composite, not the frontend mean); same-country assets at different coordinates differ; no `sr()` in hazard scores.

### 9.2 Evolution B — Asset-hazard assessment copilot (LLM tier 2)

**What.** A copilot for the workflow §1 describes: "score these asset coordinates for flood and heat under SSP5-8.5", "what's the financial impact and is this real-estate asset CRREM-stranded?", "which adaptation measures reduce the composite most?" — executed against the real hazard engine's five endpoints, decomposing the composite into per-peril contributions.

**How.** Tool schemas from the module's OpenAPI operations; system prompt from this Atlas page's §5 (the weighted-composite formula, `H = Σwᵢperilᵢ/Σwᵢ`) and the IPCC AR6 / JRC references named in §5. The CRREM-stranding and financial-impact answers are tool calls to `crrem-check`/`financial-impact`; adaptation recommendations cite `/ref/adaptation-measures`. The engine's honest-null handling must surface as "no reference data for this hazard/location" rather than an invented score, and the fabrication validator matches every hazard/loss figure to a tool response.

**Prerequisites (hard).** Evolution A — the copilot must call the real engine, not narrate the frontend's current synthetic scores; the POST-auth blocker must be resolved. **Acceptance:** every hazard/composite/loss figure traces to an endpoint call; CRREM verdicts come from `crrem-check`; the copilot returns honest-null where reference data is missing.