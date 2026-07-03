# Api::Energy_Emissions
**Module ID:** `api::energy_emissions` · **Route:** `/api/v1/energy-emissions` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/energy-emissions/scope3-cat11` | `scope3_cat11` | api/v1/routes/energy_emissions.py |
| POST | `/api/v1/energy-emissions/csrd-auto-populate` | `csrd_auto_populate` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/methane-source-categories` | `ref_methane_categories` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/ogmp-levels` | `ref_ogmp_levels` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/abatement-measures` | `ref_abatement_measures` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/fuel-combustion-efs` | `ref_fuel_efs` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/product-use-profiles` | `ref_product_profiles` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/esrs-mappings` | `ref_esrs_mappings` | api/v1/routes/energy_emissions.py |
| GET | `/api/v1/energy-emissions/ref/esrs-minimums` | `ref_esrs_minimums` | api/v1/routes/energy_emissions.py |

### 2.3 Engine `csrd_auto_populate` (services/csrd_auto_populate.py)
| Function | Args | Purpose |
|---|---|---|
| `CSRDAutoPopulateEngine.populate` | entity_name, module_outputs, reporting_year | Map module outputs to ESRS data points. |
| `CSRDAutoPopulateEngine.get_mappings` |  |  |
| `CSRDAutoPopulateEngine.get_esrs_minimums` |  |  |

### 2.3 Engine `methane_ogmp` (services/methane_ogmp.py)
| Function | Args | Purpose |
|---|---|---|
| `MethaneOGMPEngine.assess_facility` | facility_name, sources, production_bcm_yr | Assess methane emissions for a facility. |
| `MethaneOGMPEngine._build_pathway` | results | Build prioritised reduction pathway (cheapest abatement first). |
| `MethaneOGMPEngine.get_source_categories` |  |  |
| `MethaneOGMPEngine.get_ogmp_levels` |  |  |
| `MethaneOGMPEngine.get_abatement_measures` |  |  |

### 2.3 Engine `scope3_cat11` (services/scope3_cat11.py)
| Function | Args | Purpose |
|---|---|---|
| `Scope3Cat11Engine.assess` | fuels, products, reporting_year, revenue_m_eur | Calculate Category 11 emissions. |
| `Scope3Cat11Engine.get_fuel_efs` |  |  |
| `Scope3Cat11Engine.get_product_profiles` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `module` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-emissions/ref/abatement-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ldar', 'vapour_recovery', 'instrument_air', 'dry_seal', 'enclosed_flare', 'continuous_monitoring'], 'n_keys': 6}`

**GET /api/v1/energy-emissions/ref/esrs-mappings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E1-6_GHG_scope1', 'E1-6_GHG_scope2_lb', 'E1-6_GHG_scope2_mb', 'E1-6_GHG_scope3_total', 'E1-6_GHG_intensity_revenue', 'E1-9_carbon_price_internal', 'E1-9_transition_risk_eur', 'E1-9_physical_r`

**GET /api/v1/energy-emissions/ref/esrs-minimums** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'], 'n_keys': 10}`

**GET /api/v1/energy-emissions/ref/fuel-combustion-efs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crude_oil_bbl', 'natural_gas_mcf', 'lng_tonne', 'thermal_coal_tonne', 'coking_coal_tonne', 'diesel_litre', 'gasoline_litre', 'jet_fuel_litre', 'lpg_tonne', 'naphtha_tonne'], 'n_keys': 10}`

**GET /api/v1/energy-emissions/ref/methane-source-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['venting', 'flaring', 'fugitive_wellhead', 'fugitive_processing', 'fugitive_transmission', 'fugitive_distribution', 'pneumatic_devices', 'compressor_seals', 'tanks_loading', 'other'], 'n_keys'`

## 5 · Intermediate Transformation Logic

**Engine `csrd_auto_populate` — extracted transformation lines:**
```python
rate = (pop_count / total * 100) if total > 0 else 0
```

**Engine `methane_ogmp` — extracted transformation lines:**
```python
tch4 = src.activity_bcm_yr * src.custom_ef_tch4_bcm
co2e_100 = tch4 * GWP_100
co2e_20 = tch4 * GWP_20
intensity = total_tch4 / activity_total if activity_total > 0 else 0
abatement_pct = (total_abatement / total_tch4 * 100) if total_tch4 > 0 else 0
weighted_level = sum(r.ogmp_level * r.emissions_tch4 for r in results) / total_tch4
weighted_level = sum(s.ogmp_level for s in sources) / len(sources) if sources else 0
```

**Engine `scope3_cat11` — extracted transformation lines:**
```python
elec_tco2 = annual_elec * p.grid_ef_tco2_mwh / 1000
annual_per_unit = elec_tco2 + fuel_tco2
lifetime_per_unit = annual_per_unit * lifetime
total_lifetime = lifetime_per_unit * p.units_sold
total_cat11 = total_fuel + total_product
top_pct = (top[1] / total_cat11 * 100) if total_cat11 > 0 else 0
intensity = total_cat11 / revenue_m_eur if revenue_m_eur > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).