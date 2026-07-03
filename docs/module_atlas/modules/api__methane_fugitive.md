# Api::Methane_Fugitive
**Module ID:** `api::methane_fugitive` · **Route:** `/api/v1/methane-fugitive` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/methane-fugitive/gwp-impact` | `gwp_impact_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/eu-regulation` | `eu_regulation_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/ogmp-level` | `ogmp_level_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/super-emitters` | `super_emitters_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/abatement-curve` | `abatement_curve_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/ldar-compliance` | `ldar_compliance_endpoint` | api/v1/routes/methane_fugitive.py |
| POST | `/api/v1/methane-fugitive/methane-intensity` | `methane_intensity_endpoint` | api/v1/routes/methane_fugitive.py |
| GET | `/api/v1/methane-fugitive/ref/gwp-values` | `get_gwp_values` | api/v1/routes/methane_fugitive.py |
| GET | `/api/v1/methane-fugitive/ref/ogmp-levels` | `get_ogmp_levels` | api/v1/routes/methane_fugitive.py |
| GET | `/api/v1/methane-fugitive/ref/eu-methane-timeline` | `get_eu_methane_timeline` | api/v1/routes/methane_fugitive.py |

### 2.3 Engine `methane_fugitive_engine` (services/methane_fugitive_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | val, lo, hi |  |
| `_round` | val, digits |  |
| `_days_since` | date_str |  |
| `calculate_methane_gwp_impact` | entity_id, ch4_kt_pa, n2o_kt_pa |  |
| `assess_eu_methane_regulation` | entity_id, sector, ch4_emissions_t_pa, country_code, compliance_attestations, emissions_allowance_t_pa | Compliance requirement statuses are FACTS about the entity and cannot be |
| `assess_ogmp_level` | entity_id, measurement_approach, source_level_data, third_party_verified, company_level_data |  |
| `detect_super_emitters` | entity_id, facilities | A facility's CH4 emission rate is a measured ENTITY metric. Facilities that |
| `calculate_methane_abatement_curve` | entity_id, sector, total_ch4_kt_pa, methane_commodity_value_usd_per_t, carbon_price_usd_per_tco2e | Per-measure cost and abatement potential come from the published IEA MACC |
| `assess_ldar_compliance` | entity_id, facility_count, last_inspection_date, leak_detection_method |  |
| `compute_methane_intensity` | entity_id, sector, production_volume, production_unit, ch4_emissions_t_pa |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `entry`, `fastapi` *(shared)*, `force` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/methane-fugitive/ref/eu-methane-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'official_title', 'scope', 'key_provisions', 'timeline', 'external_suppliers'], 'n_keys': 6}`

**GET /api/v1/methane-fugitive/ref/gwp-values** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'gwp_timeframes', 'notes'], 'n_keys': 3}`

**GET /api/v1/methane-fugitive/ref/ogmp-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'administrator', 'eu_requirements', 'levels'], 'n_keys': 4}`

**POST /api/v1/methane-fugitive/abatement-curve** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/methane-fugitive/eu-regulation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `methane_fugitive_engine` — extracted transformation lines:**
```python
ch4_gwp100 = ch4_kt_pa * GWP_100_CH4  # kt CO2e
ch4_gwp20 = ch4_kt_pa * GWP_20_CH4
n2o_gwp100 = n2o_kt_pa * GWP_100_N2O
n2o_gwp20 = n2o_kt_pa * GWP_20_N2O
total_gwp100 = ch4_gwp100 + n2o_gwp100  # kt CO2e
total_gwp20 = ch4_gwp20 + n2o_gwp20
short_term_ratio = _round(total_gwp20 / total_gwp100, 3) if total_gwp100 > 0 else 1.0
significance_flag = total_gwp20 > total_gwp100 * 0.10
excess_t = max(0.0, ch4_emissions_t_pa - emissions_allowance_t_pa)
gap_to_eu_min = max(0, eu_min_2026 - current_level)
ch4_kg_hr = ch4_t_pa * 1000 / 8760
satellite_detectable = ch4_kg_hr > (IMEO_SATELLITE_THRESHOLD_T_HR * 1000 / 1)  # >25 t/hr
satellite_prob = _round(min(0.95, ch4_kg_hr / (IMEO_SATELLITE_THRESHOLD_T_HR * 1000) * 0.8), 3)
total_ch4_t = total_ch4_kt_pa * 1000
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).