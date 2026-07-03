# Api::Cdm_Tools
**Module ID:** `api::cdm_tools` · **Route:** `/api/v1/cdm-tools` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/cdm-tools/` | `list_tools` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/categories` | `list_tool_categories` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/for-methodology/{methodology_code}` | `tools_for_methodology` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/{tool_code}` | `get_tool` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/{tool_code}/defaults` | `get_tool_defaults` | api/v1/routes/cdm_tools.py |
| POST | `/api/v1/cdm-tools/{tool_code}/calculate` | `calculate_tool` | api/v1/routes/cdm_tools.py |
| POST | `/api/v1/cdm-tools/batch` | `batch_calculate` | api/v1/routes/cdm_tools.py |
| POST | `/api/v1/cdm-tools/chain/{methodology_code}` | `chain_calculate` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities` | `list_activities` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/for-user/{user_type}` | `activities_for_user` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/search` | `search_activities_endpoint` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/{activity_id}` | `get_activity` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/{activity_id}/inputs` | `get_activity_inputs` | api/v1/routes/cdm_tools.py |

### 2.3 Engine `activity_guide_catalog` (services/activity_guide_catalog.py)
| Function | Args | Purpose |
|---|---|---|
| `get_all_activities` |  | Return all activities in the catalog. |
| `get_activities_by_sector` | sector | Return activities filtered by sector name (case-insensitive). |
| `get_activities_by_user_type` | user_type | Return activities where the given user type is listed. |
| `get_activities_for_methodology` | methodology_code | Return activities that reference the given methodology code. |
| `get_activity_detail` | activity_id | Return a single activity by its ID, or None if not found. |
| `search_activities` | query | Full-text search across activity name, description, sector, and user types. |
| `get_activities_by_value_chain` | position | Return activities by value chain position (upstream / core / downstream). |
| `get_activities_by_scale` | scale | Return activities filtered by scale (Micro / Small / Large). |

### 2.3 Engine `cdm_tools_engine` (services/cdm_tools_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_tool01` | inputs | TOOL01 -- Demonstration and assessment of additionality. |
| `calculate_tool02` | inputs | TOOL02 -- Combined tool to identify baseline scenario and demonstrate additionality. |
| `calculate_tool03` | inputs | TOOL03 -- CO2 emissions from fossil fuel combustion. |
| `calculate_tool04` | inputs | TOOL04 -- Emissions from solid waste disposal sites (First Order Decay). |
| `calculate_tool05` | inputs | TOOL05 -- Emissions from electricity consumption. |
| `calculate_tool06` | inputs | TOOL06 -- Project emissions from flaring. |
| `calculate_tool07` | inputs | TOOL07 -- Grid emission factor (Operating Margin / Build Margin / Combined Margin). |
| `calculate_tool08` | inputs | TOOL08 -- Mass flow of a GHG in a gaseous stream. |
| `calculate_tool09` | inputs | TOOL09 -- Baseline efficiency of thermal or electric energy generation systems. |
| `calculate_tool10` | inputs | TOOL10 -- Remaining lifetime of equipment. |
| `calculate_tool11` | inputs | TOOL11 -- Assessment of the validity of the original/current baseline. |
| `calculate_tool12` | inputs | TOOL12 -- Freight transport emissions. |
| `calculate_tool13` | inputs | TOOL13 -- Composting emissions (CH4 + N2O). |
| `calculate_tool14` | inputs | TOOL14 -- Anaerobic digester emissions. |
| `calculate_tool15` | inputs | TOOL15 -- Upstream leakage emissions from fossil fuel use. |
| `calculate_tool16` | inputs | TOOL16 -- Emissions from biomass. |
| `calculate_tool17` | inputs | TOOL17 -- Inter-urban / long-distance cargo transport baseline. |
| `calculate_tool18` | inputs | TOOL18 -- Urban/mass passenger transport baseline emissions. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `collections` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cdm-tools/** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'tools'], 'n_keys': 2}`

**GET /api/v1/cdm-tools/activities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'activities'], 'n_keys': 2}`

**GET /api/v1/cdm-tools/activities/for-user/{user_type}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'activities'], 'n_keys': 2}`

**GET /api/v1/cdm-tools/activities/search** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['query', 'total', 'activities'], 'n_keys': 3}`

**GET /api/v1/cdm-tools/activities/{activity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `cdm_tools_engine` — extracted transformation lines:**
```python
co2_tonnes = fc_tonnes * ncv * ef_co2 / 1000.0
BE_CH4 = SUM[ W_x * DOC_x * DOCf * F * (16/12) * (1-OX) * MCF ]
ch4_tonnes = w * doc * doc_f * fraction_ch4 * (16.0 / 12.0) * (1.0 - oxidation) * mcf / 1000.0
total_co2e = total_ch4_tonnes * gwp_ch4
PE_elec = EC (MWh) * EF_grid (tCO2/MWh).
emissions_tco2 = electricity_mwh * ef_grid
PE_flare = Q (m3) * EF (tCO2/m3) * (1 - destruction_efficiency / 100).
pe_flare = gas_volume_m3 * ef_tco2_per_m3 * (1.0 - destruction_eff / 100.0)
ef_cm = w_om * om_ef + w_bm * bm_ef
v_m_stp = 22.414  # L/mol at STP
v_m_actual = v_m_stp * (temperature_k / 273.15) * (101.325 / pressure_kpa)  # L/mol
v_m_m3 = v_m_actual / 1000.0  # m3/mol
mw_kg_per_mol = molecular_weight / 1000.0
mass_flow_kg_hr = volumetric_flow_m3_hr * concentration_fraction * mw_kg_per_mol / v_m_m3
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).