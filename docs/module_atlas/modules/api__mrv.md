# Api::Mrv
**Module ID:** `api::mrv` · **Route:** `/api/v1/mrv` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/mrv/tier-assessment` | `post_mrv_tier` | api/v1/routes/mrv.py |
| POST | `/api/v1/mrv/satellite-coverage` | `post_satellite_coverage` | api/v1/routes/mrv.py |
| POST | `/api/v1/mrv/improvement-plan` | `post_improvement_plan` | api/v1/routes/mrv.py |
| GET | `/api/v1/mrv/ref/tiers` | `get_mrv_tiers` | api/v1/routes/mrv.py |
| GET | `/api/v1/mrv/ref/standards` | `get_verification_standards` | api/v1/routes/mrv.py |
| GET | `/api/v1/mrv/ref/satellite-platforms` | `get_satellite_platforms` | api/v1/routes/mrv.py |
| GET | `/api/v1/mrv/ref/verification-bodies` | `get_verification_bodies` | api/v1/routes/mrv.py |
| GET | `/api/v1/mrv/ref/uncertainty-tiers` | `get_uncertainty_tiers` | api/v1/routes/mrv.py |

### 2.3 Engine `mrv_engine` (services/mrv_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_tier_midpoint_uncertainty` | tier | Midpoint of the published typical-uncertainty range for an MRV tier. |
| `_dqs_from_uncertainty` | uncertainty_pct |  |
| `assess_mrv_tier` | entity_id, facility_type, current_capabilities, measured_uncertainty_pct | Assess MRV tier (1-5) and generate upgrade roadmap. |
| `calculate_data_quality` | entity_id, emission_sources, measurement_methods, cdp_disclosures, ai_anomaly_report | Score MRV data quality using IPCC uncertainty tiers, PCAF DQS 1-5, |
| `_build_ai_assessment` | ai_anomaly_report | Build the AI quality-assessment block from a real anomaly report, or an |
| `_build_cdp_compliance` | cdp_disclosures | Build the CDP CDSB compliance block from caller-supplied disclosure |
| `verify_satellite_coverage` | entity_id, lat, lng, facility_size_ha, cloud_cover_pct | Assess satellite GHG detection coverage for a facility location. |
| `score_verification_readiness` | entity_id, standard, scope_1_2_3, readiness_inputs, issa_requirements_met | Score verification readiness against ISO 14064-3, ISAE 3410, ISSA 5000. |
| `_opt_float` | value | Coerce to float if a real value is present; else None (no fabrication). |
| `generate_mrv_improvement_plan` | entity_id, current_tier, target_tier, budget_usd, points_per_technology, data_quality_uplift_usd_pa | Generate MRV upgrade plan from current_tier to target_tier. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `current`, `data` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mrv/ref/satellite-platforms** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['satellite_platforms'], 'n_keys': 1}`

**GET /api/v1/mrv/ref/standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standards'], 'n_keys': 1}`

**GET /api/v1/mrv/ref/tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mrv_tiers'], 'n_keys': 1}`

**GET /api/v1/mrv/ref/uncertainty-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ipcc_uncertainty_tiers', 'cdp_cdsb_requirements'], 'n_keys': 2}`

**GET /api/v1/mrv/ref/verification-bodies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['verification_bodies'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `mrv_engine` — extracted transformation lines:**
```python
orbit_factor = 1.0 + abs(lat) / 90.0 * 0.5
target_tier = max(current_tier + 1, min(5, target_tier))
total_3yr = capex + annual_opex * 3
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).