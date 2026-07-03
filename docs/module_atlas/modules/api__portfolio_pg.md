# Api::Portfolio_Pg
**Module ID:** `api::portfolio_pg` · **Route:** `/api/pg` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/pg/portfolios` | `list_portfolios` | api/v1/routes/portfolio_pg.py |
| POST | `/api/pg/portfolios` | `create_portfolio` | api/v1/routes/portfolio_pg.py |
| GET | `/api/pg/portfolios/{pid}` | `get_portfolio` | api/v1/routes/portfolio_pg.py |
| PUT | `/api/pg/portfolios/{pid}` | `update_portfolio` | api/v1/routes/portfolio_pg.py |
| DELETE | `/api/pg/portfolios/{pid}` | `delete_portfolio` | api/v1/routes/portfolio_pg.py |
| POST | `/api/pg/portfolios/{pid}/assets` | `add_asset` | api/v1/routes/portfolio_pg.py |
| DELETE | `/api/pg/portfolios/{pid}/assets/{aid}` | `remove_asset` | api/v1/routes/portfolio_pg.py |
| POST | `/api/pg/portfolios/seed-sample` | `seed_sample_portfolio` | api/v1/routes/portfolio_pg.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `middleware` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/pg/portfolios** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/pg/portfolios/{pid}** — status `failed`, provenance ['db-empty'], source tables: `portfolios_pg`
Output: `None`

**POST /api/pg/portfolios** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/pg/portfolios/seed-sample** — status `skipped`, provenance ['mock-sample'], source tables: —
Output: `None`

**PUT /api/pg/portfolios/{pid}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).