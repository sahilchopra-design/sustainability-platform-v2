# Api::Health_Climate
**Module ID:** `api::health_climate` · **Route:** `/api/v1/health-climate` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/health-climate/heat-stress` | `heat_stress_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/air-quality` | `air_quality_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/vector-disease` | `vector_disease_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/food-security-health` | `food_security_health_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/financial-impact` | `financial_impact_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/who-climate-health` | `who_climate_health_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/composite` | `composite_endpoint` | api/v1/routes/health_climate.py |
| GET | `/api/v1/health-climate/ref/who-guidelines` | `get_who_guidelines` | api/v1/routes/health_climate.py |
| GET | `/api/v1/health-climate/ref/lancet-indicators` | `get_lancet_indicators` | api/v1/routes/health_climate.py |
| GET | `/api/v1/health-climate/ref/country-profiles` | `get_country_profiles` | api/v1/routes/health_climate.py |

### 2.3 Engine `health_climate_engine` (services/health_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | val, lo, hi |  |
| `_round` | val, digits |  |
| `_country_profile` | country_code |  |
| `assess_heat_stress_risk` | entity_id, country_code, outdoor_worker_pct, sector, wbgt_observed_c |  |
| `assess_air_quality_risk` | entity_id, country_code, sector, annual_production, pm25_observed_ugm3, no2_observed_ugm3 |  |
| `assess_vector_disease_risk` | entity_id, country_code, rcp_scenario, prevention_cost_per_worker_usd, workforce_at_risk |  |
| `model_food_security_health` | entity_id, country_code, supply_chain_exposure, commodity_climate_scores |  |
| `calculate_health_financial_impact` | entity_id, country_code, employee_count, outdoor_pct, sector, daily_wage_usd |  |
| `assess_who_climate_health` | entity_id, country_code |  |
| `compute_health_climate_composite` | entity_id, entity_name, country_code, sector, employee_count, annual_production |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `heat`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/health-climate/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'note', 'profiles', 'wbgt_thresholds'], 'n_keys': 4}`

**GET /api/v1/health-climate/ref/lancet-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'publication', 'indicator_domains'], 'n_keys': 3}`

**GET /api/v1/health-climate/ref/who-guidelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'publication_date', 'eu_directive', 'pollutants', 'notes'], 'n_keys': 5}`

**POST /api/v1/health-climate/air-quality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/health-climate/composite** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `health_climate_engine` — extracted transformation lines:**
```python
deg_above_threshold = max(0.0, wbgt_max - WBGT_PRODUCTIVITY_BASE)
productivity_loss = _round(min(50.0, deg_above_threshold * 10 * outdoor_fraction), 1)
rcp45_increase = _round(mortality * 0.30, 2)
rcp85_increase = _round(mortality * 0.60, 2)
wbgt_f = wbgt_max * 9 / 5 + 32
osha_compliant = wbgt_f < 90  # deterministic 90°F WBGT-equiv threshold
mortality_per_100k = _round(pm25 * 0.6, 1)
pm25_excess = max(0.0, pm25 - EU_AQD_PM25)
compliance_cost = _round(pm25_excess * annual_production * 0.005, 0)  # $5/unit/μg excess
health_liability = _round(mortality_per_100k * annual_production * 0.001, 0)
change_pct = _round(data[scenario_key] * 100, 1)
prevention_cost = None  # insufficient_data: no prevention budget/workforce input supplied
decade = (2050 - 2024) / 10
caloric_deficit_risk = _round(2.5 * decade * (1 + (100 - food_score) / 200), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).