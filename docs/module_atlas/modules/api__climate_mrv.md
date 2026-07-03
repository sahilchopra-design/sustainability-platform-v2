# Api::Climate_Mrv
**Module ID:** `api::climate_mrv` · **Route:** `/api/v1/climate-mrv` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-mrv/assess-mrv-system` | `post_assess_mrv_system` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/score-satellite-coverage` | `post_score_satellite_coverage` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/calculate-data-quality` | `post_calculate_data_quality` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/assess-digital-maturity` | `post_assess_digital_mrv_maturity` | api/v1/routes/climate_mrv.py |
| POST | `/api/v1/climate-mrv/generate-report` | `post_generate_mrv_report` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/satellite-systems` | `get_satellite_systems` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/iso14064-checklist` | `get_iso14064_checklist` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/mrv-system-types` | `get_mrv_system_types` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/maturity-levels` | `get_maturity_levels` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/pcaf-dqs` | `get_pcaf_dqs` | api/v1/routes/climate_mrv.py |
| GET | `/api/v1/climate-mrv/ref/sector-emission-factors` | `get_sector_emission_factors` | api/v1/routes/climate_mrv.py |

### 2.3 Engine `climate_mrv_engine` (services/climate_mrv_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `assess_mrv_system` | entity_id, facility_name, sector, mrv_type, annual_emissions_tco2e, measured_accuracy_pct | Assess an MRV system: ISO 14064-3 level, data quality, digital MRV |
| `score_satellite_coverage` | entity_id, lat, lng, facility_type, co2_detection_threshold_kt_yr | Score satellite coverage: TROPOMI/Sentinel-5P methane detection, |
| `calculate_data_quality_score` | entity_id, data_sources, measured_timeliness_pct, measured_uncertainty_pct | Calculate PCAF DQS 1-5 mapping, CDP completeness, IPCC Tier level, |
| `assess_digital_mrv_maturity` | entity_id, current_systems, cost_overrides_usd | Assess digital MRV maturity: 5-level model (manual→autonomous), |
| `_roadmap_actions` | from_level, to_level |  |
| `generate_mrv_report` | entity_id, self_assessment | Generate comprehensive MRV compliance report: ISO 14064-3 checklist, |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `mrv_assessments`, `mrv_data_streams`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-mrv/ref/iso14064-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'standard', 'count'], 'n_keys': 4}`

**GET /api/v1/climate-mrv/ref/maturity-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/climate-mrv/ref/mrv-system-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

**GET /api/v1/climate-mrv/ref/pcaf-dqs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source'], 'n_keys': 3}`

**GET /api/v1/climate-mrv/ref/satellite-systems** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic

**Engine `climate_mrv_engine` — extracted transformation lines:**
```python
data_quality_score = round(sum(measured_dims) / len(measured_dims), 1)
overall_score = round((detectable_count / len(satellite_results)) * 100.0, 1) if satellite_results else 0.0
avg_coverage = total_coverage / n_sources if n_sources else 50.0
third_party_verified = verified_sources >= n_sources * 0.5
target_level = min(5, current_level + 2)
step_cost = round((cost_low + cost_high) / 2.0, 0)
overall_compliance_score = round(sum(_assessed) / len(_assessed), 1) if _assessed else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).