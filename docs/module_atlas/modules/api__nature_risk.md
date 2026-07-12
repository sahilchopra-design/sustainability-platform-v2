# Api::Nature_Risk
**Module ID:** `api::nature_risk` · **Route:** `/api/v1/nature-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-risk/scenarios` | `create_scenario` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/scenarios` | `list_scenarios` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/scenarios/{scenario_id}` | `get_scenario` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/leap-assessments` | `create_leap_assessment` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/leap-assessments` | `list_leap_assessments` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/leap-assessments/calculate` | `calculate_leap_assessment` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/encore/sectors` | `list_encore_sectors` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/encore/dependencies` | `get_encore_dependencies` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/encore/ecosystem-services` | `list_ecosystem_services` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/water-risk/locations` | `create_water_risk_location` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/water-risk/locations` | `list_water_risk_locations` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/water-risk/analyze` | `analyze_water_risk` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/water-risk/locations/{location_id}/risk-report` | `get_water_risk_report` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/biodiversity/sites` | `list_biodiversity_sites` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/biodiversity/overlaps/calculate` | `calculate_biodiversity_overlaps` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/biodiversity/spatial-overlaps` | `spatial_biodiversity_overlaps` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/biodiversity/spatial-overlaps/batch` | `spatial_biodiversity_overlaps_batch` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/portfolio/analyze` | `analyze_portfolio_nature_risk` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/portfolio/{portfolio_id}/nature-exposure` | `get_portfolio_nature_exposure` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/gbf-alignment` | `create_gbf_alignment` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/gbf-alignment/{entity_type}/{entity_id}` | `get_gbf_alignment` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/gbf-targets` | `list_gbf_targets` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/dashboard/summary` | `get_nature_risk_dashboard` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/reports/tnfd-disclosure` | `generate_tnfd_disclosure` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/import/encore-data` | `import_encore_data` | api/v1/routes/nature_risk.py |
| POST | `/api/v1/nature-risk/import/biodiversity-sites` | `import_biodiversity_sites` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/csrd-entities/biodiversity` | `get_csrd_biodiversity_data` | api/v1/routes/nature_risk.py |
| GET | `/api/v1/nature-risk/csrd-entities/water` | `get_csrd_water_data` | api/v1/routes/nature_risk.py |

### 2.3 Engine `nature_risk_calculator` (services/nature_risk_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `LEAPAssessmentCalculator.calculate_leap_assessment` | entity_data, scenario, include_water_risk, include_biodiversity | Calculate complete LEAP assessment for an entity. |
| `LEAPAssessmentCalculator._calculate_locate_phase` | entity_data, include_biodiversity | Calculate LOCATE phase score. |
| `LEAPAssessmentCalculator._calculate_evaluate_phase` | entity_data, locate_result | Calculate EVALUATE phase score. |
| `LEAPAssessmentCalculator._calculate_assess_phase` | entity_data, scenario, locate_result, evaluate_result, include_water_risk | Calculate ASSESS phase score. |
| `LEAPAssessmentCalculator._calculate_prepare_phase` | entity_data, assess_result | Calculate PREPARE phase score. |
| `LEAPAssessmentCalculator._calculate_overall_score` | locate, evaluate, assess, prepare | Calculate weighted overall LEAP score. |
| `LEAPAssessmentCalculator._score_to_rating` | score | Convert numerical score to risk rating. |
| `LEAPAssessmentCalculator._get_encore_dependencies` | sector_code | Get ENCORE dependencies for a sector. |
| `LEAPAssessmentCalculator._calculate_water_risk_contribution` | entity_data, scenario | Calculate water risk contribution to assessment. |
| `WaterRiskCalculator.calculate_water_risk` | location_data, scenario, include_projections | Calculate comprehensive water risk for a location. |
| `WaterRiskCalculator._get_baseline_indicators` | location_data | Extract baseline water risk indicators. |
| `WaterRiskCalculator._get_projected_indicators` | location_data, year, scenario | Get projected indicators for a given year and scenario. |
| `WaterRiskCalculator._calculate_composite_score` | indicators | Calculate composite water risk score from indicators. |
| `WaterRiskCalculator._score_to_level` | score | Convert score to risk level. |
| `WaterRiskCalculator._identify_key_risks` | indicators | Identify key water risk factors. |
| `WaterRiskCalculator._estimate_financial_impact` | location_data, baseline_score, projected_scores, scenario | Estimate financial impact of water risks. |
| `WaterRiskCalculator._generate_water_recommendations` | indicators, key_risks | Generate water risk management recommendations. |
| `WaterRiskCalculator.calculate_portfolio_water_risk` | locations, scenario | Calculate aggregated water risk for a portfolio of locations. |
| `BiodiversityOverlapCalculator.calculate_overlaps` | asset_data, asset_type, buffer_distances | Calculate overlaps between asset and biodiversity sites. |
| `BiodiversityOverlapCalculator._haversine_distance` | lat1, lon1, lat2, lon2 | Calculate distance between two points using Haversine formula. |
| `BiodiversityOverlapCalculator._calculate_impact_score` | overlaps | Calculate overall biodiversity impact score. |
| `BiodiversityOverlapCalculator._determine_mitigation` | overlaps | Determine required mitigation measures. |
| `PortfolioNatureRiskCalculator.calculate_portfolio_nature_risk` | holdings, scenarios, include_collateral_impact | Calculate comprehensive nature risk for a portfolio. |
| `PortfolioNatureRiskCalculator._calculate_nature_financial_impact` | holding, leap_result, scenario, include_collateral | Calculate financial impact of nature risks on a holding. |
| `PortfolioNatureRiskCalculator._aggregate_portfolio_results` | holding_results | Aggregate portfolio-level metrics. |
| `get_encore_amplifier` | sector_nace, cap | Return ENCORE ecosystem dependency amplifier for a NACE sector code. Used to amplify integrated climate risk scores for nature-dependent sectors. Args: sector_nace: NACE code (e.g. "A.01.1", "C.20", "B") cap: Maximum amplifier value (default 2.0) Returns: float: amplifier >= 1.0, capped at cap |
| `get_nature_risk_amplifiers_for_portfolio` | entities, cap | Compute ENCORE amplifiers for a list of entities. Args: entities: List of dicts with keys: entity_id, sector_nace cap: Maximum amplifier Returns: dict: {entity_id: amplifier_float} |

### 2.3 Engine `nature_risk_seed_data` (services/nature_risk_seed_data.py)
| Function | Args | Purpose |
|---|---|---|
| `get_all_encore_sectors` |  | Get all ENCORE sectors. |
| `get_encore_dependencies_by_sector` | sector_code | Get ENCORE dependencies for a specific sector. |
| `get_default_scenarios` |  | Get default nature risk scenarios. |
| `get_sample_biodiversity_sites` |  | Get sample biodiversity sites from WDPA, KBA, Ramsar, etc. |
| `get_sample_water_risk_locations` |  | Get sample water risk locations with Aqueduct data. |

### 2.3 Engine `nature_risk_spatial` (services/nature_risk_spatial.py)
| Function | Args | Purpose |
|---|---|---|
| `NatureRiskSpatialService.get_spatial_overlaps` | lat, lng, radius_km, include_flood, include_wildfire, include_slr, max_results_per_layer | Query all spatial hazard layers for the given point. Args: lat, lng: WGS 84 coordinates. radius_km: Search radius for proximity queries (protected areas). include_flood/wildfire/slr: Toggle individual hazard layers. max_results_per_layer: Cap on results returned per layer. Returns: SpatialOverlapResult with PostGIS data or haversine fallback. |
| `NatureRiskSpatialService.batch_get_spatial_overlaps` | assets, radius_km, lat_key, lng_key | Run spatial overlap queries for a list of assets. Args: assets: List of asset dicts with lat/lng fields. radius_km: Protected area search radius. lat_key / lng_key: Key names in asset dict for lat/lng. Returns: Dict keyed by asset id (or index) → SpatialOverlapResult. |
| `NatureRiskSpatialService.to_dict` | result | Serialise SpatialOverlapResult to a JSON-safe dict. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`

**Database tables:** `DB` *(shared)*, `ERM`, `WDPA`, `assets_pg` *(shared)*, `collections` *(shared)*, `csrd_entity_registry` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `esrs_e3_water`, `esrs_e4_biodiversity`, `fastapi` *(shared)*, `insects`, `policies` *(shared)*, `portfolios_pg` *(shared)*, `request` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-risk/biodiversity/sites** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'array', 'len': 17, 'item0_keys': ['id', 'site_name', 'site_type', 'country_code', 'latitude', 'longitude', 'area_km2', 'designation_year', 'iucn_category', 'ecosystem_type', 'key_species', 'data_source']}`

**GET /api/v1/nature-risk/csrd-entities/biodiversity** — status `passed`, provenance ['db-empty'], source tables: `csrd_entity_registry`, `esrs_e4_biodiversity`
Output: `{'type': 'object', 'keys': ['reporting_year', 'entities', 'summary'], 'n_keys': 3}`

**GET /api/v1/nature-risk/csrd-entities/water** — status `passed`, provenance ['db-empty'], source tables: `csrd_entity_registry`, `esrs_e3_water`
Output: `{'type': 'object', 'keys': ['reporting_year', 'entities', 'summary'], 'n_keys': 3}`

**GET /api/v1/nature-risk/dashboard/summary** — status `passed`, provenance ['db-empty'], source tables: `csrd_entity_registry`, `esrs_e3_water`, `esrs_e4_biodiversity`
Output: `{'type': 'object', 'keys': ['total_assessments', 'high_risk_entities', 'critical_risk_entities', 'water_risk_exposure', 'biodiversity_overlaps', 'gbf_alignment', 'sector_breakdown', 'trend_data'], 'n_keys': 8}`

**GET /api/v1/nature-risk/encore/dependencies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 56, 'item0_keys': ['id', 'sector_code', 'sector_name', 'subsector_code', 'subsector_name', 'ecosystem_service', 'dependency_type', 'dependency_score', 'dependency_description', 'data_quality']}`

**GET /api/v1/nature-risk/encore/ecosystem-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 10, 'item0_keys': ['id', 'name', 'category', 'description']}`

**GET /api/v1/nature-risk/encore/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 18, 'item0_keys': ['code', 'name', 'subsectors']}`

**GET /api/v1/nature-risk/gbf-alignment/{entity_type}/{entity_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 2, 'item0_keys': ['id', 'entity_id', 'entity_type', 'target_number', 'target_description', 'alignment_status', 'alignment_score', 'reporting_year', 'created_at']}`

## 5 · Intermediate Transformation Logic

**Engine `nature_risk_calculator` — extracted transformation lines:**
```python
value_chain_coverage = sum(1 for v in value_chain.values() if v) / max(len(value_chain), 1)
locate_score = sum(score_components.values()) / len(score_components) if score_components else 2.5
evaluate_score = sum(score_components.values()) / len(score_components) if score_components else 3.0
transition_avg = sum(transition_values) / len(transition_values)
opportunity_avg = sum(opportunity_scores.values()) / len(opportunity_scores)
assess_score = sum(score_components.values()) / len(score_components) if score_components else 2.5
prepare_score = sum(score_components.values()) / len(score_components) if score_components else 2.0
stress_adjustment = temp_increase * 0.3
cost_increase_factor = baseline_score * 0.1
projected_cost = base_water_cost * (1 + cost_increase_factor)
annual_water_cost = annual_withdrawal * projected_cost
disruption_probability = min(baseline_score / 10, 0.5)
disruption_impact = annual_water_cost * disruption_probability * 5
mitigation_capex = annual_withdrawal * 0.5 if baseline_score > 3 else 0
delta_lat = math.radians(lat2 - lat1)
delta_lon = math.radians(lon2 - lon1)
a = math.sin(delta_lat / 2) ** 2 + \
c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
capex_increase = risk_score * 2  # 2% per risk point
opex_increase = risk_score * 1.5  # 1.5% per risk point
revenue_at_risk = risk_score * 3  # 3% per risk point
collateral_impact = risk_score * 2.5  # 2.5% per risk point
haircut_recommendation = min(risk_score * 5, 50)  # Max 50%
```

**Engine `nature_risk_spatial` — extracted transformation lines:**
```python
result = svc.get_spatial_overlaps(lat=51.5, lng=-0.1, radius_km=10.0)
radius_m = radius_km * 1000
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `nature_risk` domain (`/api/v1/nature-risk`) implements **TNFD LEAP** nature-risk
assessment plus WRI-Aqueduct-style water risk and Haversine biodiversity-overlap
analysis. Engines: `nature_risk_calculator.py`, `nature_risk_seed_data.py`,
`nature_risk_spatial.py`.

### 7.1 What the module computes

Three independent calculators, orchestrated by `PortfolioNatureRiskCalculator`:

1. **LEAP assessment** (`LEAPAssessmentCalculator`) — a 0–5 risk score for each of the
   four TNFD LEAP phases, combined by fixed weights:

   ```
   overall = 0.20·Locate + 0.25·Evaluate + 0.35·Assess + 0.20·Prepare
   ```

   Each phase score is the **mean of its sub-components** (each 0–5).
2. **Water risk** (`WaterRiskCalculator`) — a weighted composite of six Aqueduct-style
   indicators, projected to 2030/2040/2050.
3. **Biodiversity overlap** (`BiodiversityOverlapCalculator`) — Haversine distance from an
   asset to sample protected sites, scored by proximity band × site sensitivity.

### 7.2 Parameterisation / scoring rubric

**LEAP phase weights** (`PHASE_WEIGHTS`) — Locate 0.20, Evaluate 0.25, Assess 0.35,
Prepare 0.20. Assess is weighted highest, reflecting TNFD's emphasis on risk/opportunity
sizing. **Provenance:** platform-set weights consistent with TNFD LEAP guidance.

**Risk-rating thresholds** (`RISK_THRESHOLDS`): low <2, medium-low ≥2, medium ≥3,
medium-high ≥4, high ≥4.5, critical ≥5.

**Water composite weights** (`_calculate_composite_score`):

| Indicator | Weight |
|---|---|
| Water stress | 0.35 |
| Drought risk | 0.20 |
| Groundwater decline | 0.15 |
| Interannual variability | 0.10 |
| Seasonal variability | 0.10 |
| Flood risk | 0.10 |

Score capped at 5. Projection adds `stress_adjustment = (scenario_temp − 1.1)·0.3` to
water stress and `(temp−1.1)·0.2` to drought (1.1 °C = present warming baseline).

**Biodiversity severity** (`IMPACT_SEVERITY`): direct overlap 1.0, 5 km buffer 0.7, 10 km
0.4, 25 km 0.2. **Site sensitivity** (`SITE_SENSITIVITY`): World Heritage 1.0, Ramsar 0.9,
Key Biodiversity Area 0.85, Protected Area 0.8, IBA 0.75.

**ENCORE NACE amplifiers** (`_ENCORE_NACE_AMPLIFIERS`, 1.0–2.0): Agriculture (A) 1.80,
Mining (B) 1.60, Water/waste (E) 1.45, Manufacturing (C) 1.25, Finance (K) 1.00 — used to
amplify climate-integrated risk for nature-dependent sectors. Cited source: "ENCORE
database v2 / TNFD-LEAP calibration".

### 7.3 Calculation walkthrough

`calculate_portfolio_nature_risk(holdings, scenarios)` loops every holding × scenario:
`calculate_leap_assessment` → per-phase scores → weighted overall → rating. Then
`_calculate_nature_financial_impact` converts the risk score to financial deltas:

```
capex_increase%   = risk_score · 2       (2% per risk point)
opex_increase%    = risk_score · 1.5
revenue_at_risk%  = risk_score · 3
estimated_impact  = exposure · revenue_at_risk% / 100
collateral haircut% = min(risk_score · 5, 50)
```

Portfolio aggregate reports mean LEAP scores, high/critical counts, total exposure-at-risk,
and a dependency-frequency breakdown.

### 7.4 Worked example

Holding with `exposure = $100M`, biome_exposure = 3 exposed biomes, geolocated
(latitude set), value-chain coverage 0.6; ENCORE dependency avg 3.5, impact avg 3.0, two
material dependencies; physical acute/chronic 3.5/2.5, transition avg 3.0; has strategy but
no targets/metrics.

- **Locate:** biome `min(3·0.8,5)=2.4`; geo `5`; value-chain `0.6·5=3.0` → mean `3.47`.
- **Evaluate:** dependency 3.5, impact 3.0, materiality `min(2·1.5,5)=3.0` → mean `3.17`.
- **Assess:** physical `(3.5+2.5)/2=3.0`, transition 3.0, opportunities 2.5 → mean `2.83`.
- **Prepare:** strategy 4.0, targets 1.5, disclosure 1.0 → mean `2.17`.
- **Overall:** `0.20·3.47 + 0.25·3.17 + 0.35·2.83 + 0.20·2.17 = 2.91` → **rating "medium"**.
- **Financial:** revenue_at_risk `2.91·3 = 8.7%` → impact `$100M·0.087 = $8.7M`; collateral
  haircut `min(2.91·5,50)=14.6%`.

### 7.5 Water & biodiversity companion analytics

`calculate_water_risk` returns baseline + projected composite, key risk factors (flagged at
≥3), a financial impact estimate (`annual_water_cost = withdrawal·(1+baseline·0.1)`;
disruption = cost·min(baseline/10,0.5)·5), and recommendations. `calculate_overlaps` uses
the Haversine formula (R = 6371 km) to classify sites as direct (<1 km) or buffer overlaps,
scoring `Σ severity·sensitivity` capped at 5 and emitting mitigation requirements.

### 7.6 Data provenance & limitations

- **Seed data is illustrative.** `get_sample_biodiversity_sites` (17 real WDPA/Ramsar/KBA
  sites with genuine coordinates) and `get_sample_water_risk_locations` (10 sites with
  plausible Aqueduct-style scores) are curated demo values, not a live WDPA/Aqueduct feed.
  ENCORE dependency scores are a hand-built database keyed by 18 sector codes.
- No seeded-PRNG (`sr()`) fabrication here — all numbers are either curated constants or
  deterministic functions of caller inputs.
- Financial-impact coefficients (2%/1.5%/3% per risk point) are simplifying linear proxies,
  not calibrated damage functions.
- The default LEAP sub-scores (2.5 neutral) mean an under-specified entity returns a
  mid-range score rather than an error.

**Framework alignment:** **TNFD LEAP** — the four-phase Locate/Evaluate/Assess/Prepare
scaffold is implemented directly with phase weights. **ENCORE** — the WWF/UNEP-FI/Global
Canopy database of sector dependencies/impacts on ecosystem services is approximated by the
NACE amplifier table and per-sector dependency records. **WRI Aqueduct** — the six water
indicators and 0–5 stress bands mirror Aqueduct's baseline water-stress taxonomy. **GBF** —
Prepare-phase target-setting checks reference Kunming-Montréal Global Biodiversity Framework
target alignment (endpoint `/gbf-alignment/{entity_type}/{entity_id}`).

## 9 · Future Evolution

### 9.1 Evolution A — Replace mock biodiversity sites and linear financial mappings with grounded data (analytics ladder: rung 2 → 4)

**What.** The domain implements TNFD LEAP (`overall = 0.20·Locate + 0.25·Evaluate +
0.35·Assess + 0.20·Prepare`, each phase the mean of sub-components), WRI-Aqueduct-style
water risk projected to 2030/2040/2050, and Haversine biodiversity-overlap scoring. Two
honest defects surface in the atlas: `/biodiversity/sites` returns **mock-sample** data
(17 seeded sites, not real WDPA), and `csrd-entities/biodiversity|water` trace
**db-empty**. The financial translation is also crude linear scaling
(`capex_increase = risk_score × 2`, `revenue_at_risk = risk_score × 3`, `disruption_impact
= annual_water_cost × prob × 5`). Evolution A grounds both.

**How.** (1) Replace the mock biodiversity sites with the real WDPA layer from the
`nature_data` module (its `dh_wdpa_protected_areas` table) so overlap scoring uses actual
protected areas, and populate `esrs_e3_water`/`esrs_e4_biodiversity` so the CSRD-entity
endpoints return real disclosures. (2) Replace the linear `risk_score × k` financial
factors with calibrated damage functions tied to sector water-cost sensitivity and
transition-demand data. (3) Project water risk stochastically across the 2030/2040/2050
horizons the engine already scaffolds (rung 4). (4) Bench-pin the LEAP weighting and
Haversine scoring.

**Prerequisites.** `nature_data` WDPA integration; `esrs_e3_water`/`esrs_e4_biodiversity`
seeding (D0/D1); sector damage-function calibration source. **Acceptance:**
`/biodiversity/sites` returns real WDPA rows (provenance no longer `mock-sample`);
CSRD-entity endpoints return `passed` real-db; financial factors carry calibration
provenance; LEAP and water projections bench-pinned.

### 9.2 Evolution B — TNFD LEAP assessment copilot (LLM tier 2)

**What.** A copilot that walks an entity through LEAP — creating scenarios
(`POST /scenarios`), running `/leap-assessments/calculate`, and narrating the phase scores,
water-risk trajectory, and biodiversity overlaps — plus ENCORE dependency lookups via
`/encore/dependencies`, each figure tool-sourced.

**How.** The rich endpoint set (scenarios, LEAP assessments, ENCORE sectors/dependencies,
biodiversity sites, CSRD-entity screens) makes a strong tier-2 tool surface; the LEAP
phase-weight structure lets the copilot explain *why* Assess dominates the score. Scenario
creation and assessment persistence are the gated write actions. Strong tier-3 node in the
counterparty/supply-chain nature-screening chain alongside `nature_data` and
`nature_capital`.

**Prerequisites.** Evolution A's mock-sample fix is important — a copilot narrating
biodiversity overlaps against 17 seeded sites would present fabricated proximity as real.
Until then it must disclose the sample basis. **Acceptance:** every LEAP score, water
figure, and overlap traces to a tool response; the copilot discloses when biodiversity
data is mock-sample vs real WDPA; CSRD-entity questions against empty ESRS tables return
a coverage disclaimer, not invented disclosures.