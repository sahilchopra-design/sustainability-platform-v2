# Api::Exports
**Module ID:** `api::exports` · **Route:** `/exports` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/exports/portfolios/{portfolio_id}/report` | `download_portfolio_report` | api/v1/routes/exports.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `api` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `latest`, `sqlalchemy` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /exports/portfolios/{portfolio_id}/report** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).