# Api::Organisations
**Module ID:** `api::organisations` · **Route:** `/api/v1/organisations` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/organisations/` | `list_organisations` | api/v1/routes/organisations.py |
| GET | `/api/v1/organisations/mine` | `get_my_org` | api/v1/routes/organisations.py |
| GET | `/api/v1/organisations/{org_id}` | `get_organisation` | api/v1/routes/organisations.py |
| POST | `/api/v1/organisations/` | `create_organisation` | api/v1/routes/organisations.py |
| PUT | `/api/v1/organisations/{org_id}` | `update_organisation` | api/v1/routes/organisations.py |
| GET | `/api/v1/organisations/{org_id}/members` | `list_org_members` | api/v1/routes/organisations.py |
| POST | `/api/v1/organisations/{org_id}/members` | `add_org_member` | api/v1/routes/organisations.py |

### 2.3 Engine `demo_portfolio_seeder` (services/demo_portfolio_seeder.py)
| Function | Args | Purpose |
|---|---|---|
| `DemoPortfolioSeeder.seed_for_org` | org_id | Create (or skip if already exists) a demo portfolio for *org_id*. |
| `DemoPortfolioSeeder._create_portfolio` | org_id |  |
| `DemoPortfolioSeeder._create_assets` | portfolio_id, org_id_str |  |
| `DemoPortfolioSeeder._create_analysis_run` | portfolio | Pre-populate one analysis run so dashboard charts render immediately. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`, `real-db`

**Database tables:** `__future__` *(shared)*, `an` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/organisations/** — status `passed`, provenance ['real-db'], source tables: `organisations`
Output: `{'type': 'object', 'keys': ['total', 'organisations'], 'n_keys': 2}`

**GET /api/v1/organisations/mine** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['organisation', 'message'], 'n_keys': 2}`

**GET /api/v1/organisations/{org_id}** — status `failed`, provenance ['db-empty'], source tables: `organisations`
Output: `None`

**GET /api/v1/organisations/{org_id}/members** — status `passed`, provenance ['db-empty'], source tables: `org_users`
Output: `{'type': 'object', 'keys': ['org_id', 'members'], 'n_keys': 2}`

**POST /api/v1/organisations/** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `demo_portfolio_seeder` — extracted transformation lines:**
```python
exposure = round(base_exp * jitter, -3)  # round to nearest 1000
market_value=round(exposure * rng.uniform(0.92, 1.08), -3),
base_pd=round(pd * rng.uniform(0.90, 1.10), 5),
base_lgd=round(lgd * rng.uniform(0.95, 1.05), 3),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).