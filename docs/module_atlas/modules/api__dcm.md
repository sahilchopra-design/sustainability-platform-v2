# Api::Dcm
**Module ID:** `api::dcm` · **Route:** `/api/v1/dcm` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dcm/calculate` | `run_calculation` | api/v1/routes/dcm.py |
| POST | `/api/v1/dcm/batch` | `run_batch` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/methodologies` | `get_methodologies` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/sectors` | `get_sector_list` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/standards` | `get_standard_list` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/methodologies/{code}` | `get_methodology_detail` | api/v1/routes/dcm.py |
| POST | `/api/v1/dcm/compare` | `compare_methodologies` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/ref/project-types` | `get_project_types` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/ref/cdr-pathways` | `get_cdr_pathways` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/ref/article6-guidance` | `get_article6_guidance` | api/v1/routes/dcm.py |

### 2.3 Engine `dcm_engine` (services/dcm_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_result` | methodology, version, sector, project_type, standard, baseline |  |
| `ACM0004_WasteWaterMethane` | inputs | ACM0004 v10: Treatment of Wastewater (methane recovery/destruction) |
| `ACM0011_FuelSwitchBiomass` | inputs | ACM0011 v11: Fuel Switching from Coal/Oil/Gas to Biomass |
| `ACM0013_ImprovedRiceCultivation` | inputs | ACM0013 v5: Avoiding CH4 Emissions from Rice Cultivation |
| `ACM0015_AgriculturalN2O` | inputs | ACM0015 v5: N2O Reductions from Improved Nitrogen Management |
| `ACM0016_BRT` | inputs | ACM0016 v7: Mass Rapid Transit (BRT/Metro/LRT) |
| `ACM0017_IndustrialN2O` | inputs | ACM0017 v4: Industrial N2O Reduction (Nitric Acid / Adipic Acid) |
| `ACM0018_BiomassElectricity` | inputs | ACM0018 v6: Electricity Generation from Biomass in Power-Only Plants |
| `ACM0019_CoalBedMethane` | inputs | ACM0019 v6: Coal Bed Methane / Coal Mine Methane (Capture and Use) |
| `ACM0020_CleanWater` | inputs | ACM0020 v4: Baseline and Monitoring for Clean Drinking Water |
| `ACM0021_EnergyEfficiencyIndustry` | inputs | ACM0021 v1.1: Energy Efficiency Improvements in Industrial Facilities |
| `ACM0024_ElectricVehicles` | inputs | ACM0024 v1: Promotion of Electric Vehicles |
| `ACM0025_ZeroEmissionBuses` | inputs | ACM0025 v1: Zero-Emission Buses (electric/hydrogen BEB/HEB) |
| `AM0001_HFCFromHCFC22` | inputs | AM0001 v7: HFC-23 Destruction from HCFC-22 Plants |
| `AM0014_NaturalGasFugitives` | inputs | AM0014 v4: Natural Gas Fugitive Emission Reductions |
| `AM0026_WasteHeatCement` | inputs | AM0026 v4: Waste Heat Recovery for Power Generation in Cement Plants |
| `AM0057_GreenHydrogen` | inputs | AM0057 v3: Hydrogen from Electrolysis (Green Hydrogen Production) |
| `AM0075_CarbonCapture` | inputs | AM0075 v3: Carbon Capture and Storage (CCS) from Industrial Processes |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `host`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dcm/methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 56, 'item0_keys': ['code', 'name', 'sector', 'standard', 'project_type']}`

**GET /api/v1/dcm/methodologies/{code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/dcm/ref/article6-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['article_6_2', 'article_6_4', 'corresponding_adjustments', 'corsia'], 'n_keys': 4}`

**GET /api/v1/dcm/ref/cdr-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['pathway', 'code', 'current_cost_usd_per_t', '2030_cost_projection_usd_per_t', 'permanence', 'co_benefits', 'readiness']}`

**GET /api/v1/dcm/ref/project-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 56, 'item0_keys': ['project_type', 'sector', 'example_standard', 'example_code']}`

## 5 · Intermediate Transformation Logic

**Engine `dcm_engine` — extracted transformation lines:**
```python
er = baseline - project - leakage
ncb = er + removals
annual_cod = cod_in * days  # kg COD/year
ch4_kg = annual_cod * ch4_factor * 0.67
ch4_destroyed = ch4_kg * destruction_eff
energy_kwh = (ch4_destroyed / 0.67) * 9.97 * biogas_to_elec  # m3 → kWh (rough)
avoided_elec = (energy_kwh / 1000) * grid_ef  # tCO2e
project_net = max(project - avoided_elec, 0)
transport_emission_factor = 0.062  # kgCO2e/tonne-km (typical truck)
biomass_mass_tonnes = annual_consumption_tj * biomass_fraction * 1000 / 15.6  # NCV 15.6 GJ/t
leakage = (biomass_mass_tonnes * transport_distance_km * transport_emission_factor) / 1e6
pkm_total = ridership_daily * avg_trip_km * days
pkm_shifted = pkm_total * modal_shift_pct
baseline = pkm_shifted * car_ef / 1e9  # → tCO2e
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).