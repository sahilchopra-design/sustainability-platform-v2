# Api::Aviation_Climate
**Module ID:** `api::aviation_climate` · **Route:** `/api/v1/aviation-climate` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/aviation-climate/corsia` | `corsia` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/saf-compliance` | `saf_compliance` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/ira-45z` | `ira_45z` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/eu-ets` | `eu_ets` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/iata-nzc` | `iata_nzc` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/aircraft-stranding` | `aircraft_stranding` | api/v1/routes/aviation_climate.py |
| POST | `/api/v1/aviation-climate/full-assessment` | `full_assessment` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/corsia-phases` | `ref_corsia_phases` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/saf-mandates` | `ref_saf_mandates` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/aircraft-intensity` | `ref_aircraft_intensity` | api/v1/routes/aviation_climate.py |
| GET | `/api/v1/aviation-climate/ref/iata-nzc-pathway` | `ref_iata_nzc_pathway` | api/v1/routes/aviation_climate.py |

### 2.3 Engine `aviation_climate_engine` (services/aviation_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AviationClimateEngine.calculate_corsia_obligation` | entity_id, icao_designator, baseline_tco2, actual_tco2, phase, eligible_routes_pct |  |
| `AviationClimateEngine.assess_saf_compliance` | entity_id, total_fuel_uplift_t, saf_blended_t, year, jurisdiction |  |
| `AviationClimateEngine.calculate_ira_45z` | entity_id, saf_volume_gge, saf_pathway, lifecycle_ci |  |
| `AviationClimateEngine.assess_eu_ets_aviation` | entity_id, intra_eea_co2_t, year, eua_price_eur |  |
| `AviationClimateEngine.assess_iata_nzc` | entity_id, current_intensity, fleet_mix, saf_pct, year |  |
| `AviationClimateEngine.model_aircraft_stranding` | entity_id, fleet_data |  |
| `AviationClimateEngine.generate_full_assessment` | entity_id, operator_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/aviation-climate/ref/aircraft-intensity** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/aviation-climate/ref/corsia-phases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/aviation-climate/ref/iata-nzc-pathway** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/aviation-climate/ref/saf-mandates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/aviation-climate/aircraft-stranding** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `aviation_climate_engine` — extracted transformation lines:**
```python
growth_tco2 = max(0.0, actual_tco2 - baseline_tco2)
eligible_growth = growth_tco2 * eligible_routes_pct / 100.0
offsetting_obligation = eligible_growth * offset_factor
offset_cost_usd = offsetting_obligation * CORSIA_CREDIT_PRICE
blend_pct = saf_blended_t / max(total_fuel_uplift_t, 1.0) * 100.0
mandate_pct = REFUELEU_SAF_MANDATES[mandate_years[-1]]
compliance_gap_pct = max(0.0, mandate_pct - blend_pct)
gap_volume_t = compliance_gap_pct / 100.0 * total_fuel_uplift_t
penalty_per_tonne_gap = 50.0 * 44.0  # EUR/tonne gap
penalty_usd = gap_volume_t * penalty_per_tonne_gap * 1.10  # EUR to USD ~1.10
reduction_pct = max(0.0, (baseline_ci - lifecycle_ci) / baseline_ci * 100.0)
total_credit_usd = saf_volume_gge * credit_per_gge if eligible else 0.0
free_allocation = intra_eea_co2_t * free_alloc_pct / 100.0
surrender_gap = max(0.0, obligation_allowances - free_allocation)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).