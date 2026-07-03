# Api::Entity_Data
**Module ID:** `api::entity_data` · **Route:** `/api/v1/entity-data` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/entity-data/entities` | `list_entities` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}` | `entity_profile` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}/carbon` | `entity_carbon_inputs` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}/ecl` | `entity_ecl_inputs` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}/nature` | `entity_nature_inputs` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}/stranded` | `entity_stranded_inputs` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}/sector` | `entity_sector_inputs` | api/v1/routes/entity_data.py |
| GET | `/api/v1/entity-data/{entity_id}/portfolio-asset` | `entity_portfolio_asset` | api/v1/routes/entity_data.py |

### 2.3 Engine `csrd_entity_service` (services/csrd_entity_service.py)
| Function | Args | Purpose |
|---|---|---|
| `get_entity_list` | db | Return all 8 CSRD entities with a top-level summary. |
| `get_entity_profile` | entity_id, db | Return the complete cross-module data profile for one entity. |
| `get_carbon_inputs` | entity_id, db | Return pre-filled inputs for the Carbon Calculator module. |
| `get_ecl_inputs` | entity_id, db | Return pre-filled inputs for the ECL/Climate Risk module. |
| `get_nature_inputs` | entity_id, db | Return pre-filled inputs for the Nature Risk / TNFD module. |
| `get_stranded_inputs` | entity_id, db | Return pre-filled inputs for the Stranded Asset Calculator. |
| `get_sector_inputs` | entity_id, db | Return pre-filled inputs for the Sector Assessments module (Power Plant / Energy). |
| `get_portfolio_asset_spec` | entity_id, db | Return an assets_pg-compatible record for this entity. |
| `_row_to_dict` | row |  |
| `_get_ghg` | entity_id, db |  |
| `_get_energy` | entity_id, db |  |
| `_get_water` | entity_id, db |  |
| `_get_biodiversity` | entity_id, db |  |
| `_get_pollution` | entity_id, db |  |
| `_get_circular` | entity_id, db |  |
| `_get_workforce` | entity_id, db |  |
| `_get_governance` | entity_id, db |  |
| `_get_financial_effects` | entity_id, db |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `real` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/entity-data/entities** — status `passed`, provenance ['real-db'], source tables: `csrd_entity_registry`, `energy_entities`, `energy_generation_mix`, `esrs_e1_energy`, `esrs_e1_ghg_emissions`, `esrs_s1_workforce`
Output: `{'type': 'object', 'keys': ['entities'], 'n_keys': 1}`

**GET /api/v1/entity-data/{entity_id}** — status `failed`, provenance ['db-empty'], source tables: `csrd_entity_registry`
Output: `None`

**GET /api/v1/entity-data/{entity_id}/carbon** — status `failed`, provenance ['db-empty'], source tables: `csrd_entity_registry`
Output: `None`

**GET /api/v1/entity-data/{entity_id}/ecl** — status `failed`, provenance ['db-empty'], source tables: `csrd_entity_registry`
Output: `None`

**GET /api/v1/entity-data/{entity_id}/nature** — status `failed`, provenance ['db-empty'], source tables: `csrd_entity_registry`
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `csrd_entity_service` — extracted transformation lines:**
```python
total_ead_eur = total_ead * 1_000_000 if total_ead else None  # mEUR → EUR
exposure = float(ent[4]) * 0.05 if ent[4] else 1000.0  # 5% of balance sheet
market_value = float(ent[3]) * 0.08 if ent[3] else 800.0  # 8% of revenue
exposure = float(lb[0]) * 0.01  # 1% sample slice
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).