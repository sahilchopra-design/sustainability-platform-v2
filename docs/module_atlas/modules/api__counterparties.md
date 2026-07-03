# Api::Counterparties
**Module ID:** `api::counterparties` · **Route:** `/counterparties` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/counterparties` | `list_counterparties` | api/v1/routes/counterparties.py |
| GET | `/counterparties/{counterparty_id}` | `get_counterparty` | api/v1/routes/counterparties.py |
| POST | `/counterparties` | `create_counterparty` | api/v1/routes/counterparties.py |
| PATCH | `/counterparties/{counterparty_id}` | `update_counterparty` | api/v1/routes/counterparties.py |
| DELETE | `/counterparties/{counterparty_id}` | `delete_counterparty` | api/v1/routes/counterparties.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `api` *(shared)*, `counterparty`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /counterparties** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /counterparties/{counterparty_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /counterparties** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /counterparties/{counterparty_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /counterparties/{counterparty_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).