# Api::Analyst_Portfolios
**Module ID:** `api::analyst_portfolios` · **Route:** `/api/v1/analyst-portfolios` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/analyst-portfolios/` | `list_analyst_portfolios` | api/v1/routes/analyst_portfolios.py |
| GET | `/api/v1/analyst-portfolios/{portfolio_id}` | `get_analyst_portfolio` | api/v1/routes/analyst_portfolios.py |
| GET | `/api/v1/analyst-portfolios/{portfolio_id}/gap-assessment` | `get_portfolio_gap_assessment` | api/v1/routes/analyst_portfolios.py |
| POST | `/api/v1/analyst-portfolios/seed` | `seed_demo_portfolios` | api/v1/routes/analyst_portfolios.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `CSRD` *(shared)*, `DB` *(shared)*, `__future__` *(shared)*, `csrd_entity_registry` *(shared)*, `csrd_kpi_values` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `extracted`, `fastapi` *(shared)*, `peer` *(shared)*, `peer_benchmark_engine` *(shared)*, `portfolios_pg` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/analyst-portfolios/** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['portfolios'], 'n_keys': 1}`

**GET /api/v1/analyst-portfolios/{portfolio_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/analyst-portfolios/{portfolio_id}/gap-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/analyst-portfolios/seed** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).