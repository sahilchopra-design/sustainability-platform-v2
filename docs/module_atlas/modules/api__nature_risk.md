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
| `NatureRiskSpatialService.get_spatial_overlaps` | lat, lng, radius_km, include_flood, include_wildfire, include_slr | Query all spatial hazard layers for the given point. |
| `NatureRiskSpatialService.batch_get_spatial_overlaps` | assets, radius_km, lat_key, lng_key | Run spatial overlap queries for a list of assets. |
| `NatureRiskSpatialService.to_dict` | result | Serialise SpatialOverlapResult to a JSON-safe dict. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`

**Database tables:** `DB` *(shared)*, `ERM`, `WDPA`, `assets_pg` *(shared)*, `collections` *(shared)*, `csrd_entity_registry` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `esrs_e3_water`, `esrs_e4_biodiversity`, `fastapi` *(shared)*, `insects`, `policies` *(shared)*, `portfolios_pg` *(shared)*, `request` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-risk/biodiversity/sites** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'array', 'len': 17, 'item0_keys': ['id', 'site_name', 'site_type', 'country_code', 'latitude', 'longitude', 'area_km2', 'designation_year', 'iucn_category', 'ecosystem_type', 'key_species', 'data_source']}`

**GET /api/v1/nature-risk/csrd-entities/biodiversity** — status `failed`, provenance ['db-empty'], source tables: `csrd_entity_registry`, `esrs_e4_biodiversity`
Output: `None`

**GET /api/v1/nature-risk/csrd-entities/water** — status `failed`, provenance ['db-empty'], source tables: `csrd_entity_registry`, `esrs_e3_water`
Output: `None`

**GET /api/v1/nature-risk/dashboard/summary** — status `passed`, provenance ['db-empty'], source tables: `csrd_entity_registry`, `esrs_e3_water`, `esrs_e4_biodiversity`
Output: `{'type': 'object', 'keys': ['total_assessments', 'high_risk_entities', 'critical_risk_entities', 'water_risk_exposure', 'biodiversity_overlaps', 'gbf_alignment', 'sector_breakdown', 'trend_data'], 'n_keys': 8}`

**GET /api/v1/nature-risk/encore/dependencies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 56, 'item0_keys': ['id', 'sector_code', 'sector_name', 'subsector_code', 'subsector_name', 'ecosystem_service', 'dependency_type', 'dependency_score', 'dependency_description', 'data_quality']}`

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
```

**Engine `nature_risk_spatial` — extracted transformation lines:**
```python
result = svc.get_spatial_overlaps(lat=51.5, lng=-0.1, radius_km=10.0)
radius_m = radius_km * 1000
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).