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

**DELETE /api/pg/portfolios/{pid}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/pg/portfolios/{pid}/assets** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /api/pg/portfolios/{pid}/assets/{aid}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `portfolio_pg` domain (`/api/pg`) is the platform's **PostgreSQL-backed portfolio CRUD**
layer (`portfolio_pg.py`), replacing the legacy MongoDB endpoints. It manages
`PortfolioPG` / `AssetPG` / `AnalysisRunPG` records with org-scoped multi-tenant isolation. It
is a data-management surface, not a quantitative engine — the only "computation" is roll-up
aggregation and a sample-portfolio seeder.

### 7.1 What the module computes

CRUD over portfolios and their assets, plus lightweight aggregation in the list/detail views:

```
num_assets     = len(portfolio.assets)
total_exposure = Σ asset.exposure
```

Each asset carries the fields downstream engines need: `asset_type`, `company_sector`,
`exposure`, `market_value`, `base_pd`, `base_lgd`, `rating`, `maturity_years`.

### 7.2 Parameterisation / scoring rubric

No scoring rubric. Default asset shape (`AssetCreate`): type Bond, sector "Power Generation",
`base_pd = 0.02`, `base_lgd = 0.45`, rating BBB, maturity 5 yr — sensible placeholders so a
minimally-specified asset still feeds the ECL/PCAF engines. Org scoping is enforced by
`apply_org_filter(query, PortfolioPG, request)` and `get_request_org_id(request)` from the auth
middleware, so tenants only ever see their own portfolios.

### 7.3 Calculation walkthrough

- `GET /portfolios`: lists org-filtered portfolios, each with `num_assets` and `total_exposure`
  computed inline.
- `POST /portfolios`: creates a `PortfolioPG` stamped with the request's `org_id`, then bulk-
  inserts any `assets` supplied in the body.
- `GET /portfolios/{pid}`, `PUT`, `DELETE`: single-portfolio read/update/delete.
- `POST /portfolios/{pid}/assets`, `DELETE /portfolios/{pid}/assets/{aid}`: asset-level
  add/remove.
- `POST /portfolios/seed-sample`: provisions a demonstration portfolio (parallels the demo
  seeder used at org creation).

Writes require an authenticated user (`Depends(get_current_user)`); the `org_id` is derived
from the request context rather than trusted from the body.

### 7.4 Worked example

`POST /api/pg/portfolios` with `{name: "EU Credit Book", assets: [{company_name: "PetroCo",
company_sector: "Energy", exposure: 150000000, base_pd: 0.02, base_lgd: 0.48, rating: "BBB",
maturity_years: 6}]}`:

1. A `PortfolioPG` row is created with `org_id` = the caller's org.
2. One `AssetPG` row is inserted linked to the new portfolio id.
3. A subsequent `GET /portfolios` returns the portfolio with `num_assets = 1` and
   `total_exposure = 150,000,000`.

Because the asset carries `base_pd`/`base_lgd`/`rating`/`sector`, it is immediately consumable
by the ECL climate overlay, PCAF financed-emissions and NGFS scenario engines.

### 7.5 Data provenance & limitations

- **Pure persistence** — no synthetic analytics, no `sr()` PRNG. Values are whatever the caller
  supplies; `seed-sample` inserts clearly-labelled demonstration data.
- Aggregations (`num_assets`, `total_exposure`) are computed in Python over the loaded asset
  collection on each request rather than in SQL — fine for demo-scale books, less efficient for
  very large portfolios.
- Multi-tenant isolation depends entirely on the auth middleware's `apply_org_filter`; there is
  no row-level DB policy in this layer.

**Framework alignment:** This is infrastructure that *enables* the regulatory engines rather
than implementing a framework itself. The asset schema deliberately mirrors the inputs of
**IFRS 9 ECL** (PD/LGD/rating/maturity), **PCAF** (sector for emission-factor lookup) and
**NGFS scenario** analysis, so a portfolio created here can be run through the full climate-risk
stack without transformation. Org scoping supports jurisdiction-aware **CSRD/SFDR** applicability
downstream.

## 9 · Future Evolution

### 9.1 Evolution A — Harden the CRUD substrate and make roll-ups analytics-grade (analytics ladder: rung 1 → 2)

**What.** This is the platform's PostgreSQL-backed portfolio CRUD layer (replacing the legacy
Mongo endpoints) over `PortfolioPG`/`AssetPG`/`AnalysisRunPG` with org-scoped isolation via
`apply_org_filter`. It's data-management, not a quant engine — the only computation is
`num_assets = len(assets)` and `total_exposure = Σ exposure`, plus a sample seeder. Critically,
§4.2 shows the core reads trace **failed** (`GET /portfolios` and `/{pid}`) — the platform's
single most foundational data surface, on which the ECL/PCAF/health engines all depend, is not
passing the lineage harness. Evolution A hardens it.

**How.** (1) Fix the failing `GET /portfolios` and `/{pid}` paths (likely the org-filter/auth
interaction under the harness given `REQUIRE_AUTH`) so the foundational reads are reliable — this
is a correctness prerequisite for almost every downstream module in this slice. (2) Enrich the
list/detail roll-ups with the sector/asset-class/rating distributions downstream engines
recompute, so callers get a portfolio profile in one call. (3) Enforce the D2 multi-tenancy
posture here (RLS under the app-layer org filter) since this is the tenant-data chokepoint. (4)
Ensure the default asset shape (`base_pd=0.02`, `base_lgd=0.45`, BBB) is clearly labelled a
placeholder so downstream engines don't treat it as real data.

**Prerequisites.** Auth/org-filter behaviour under the harness diagnosed; RLS rollout (D2).
**Acceptance:** `GET /portfolios` and `/{pid}` return `passed`; list/detail include distribution
roll-ups; cross-tenant reads blocked at the DB layer; placeholder asset defaults flagged in the
response.

### 9.2 Evolution B — Portfolio-management copilot (LLM tier 2)

**What.** A copilot that manages the book conversationally — "create a portfolio, add these five
holdings, and show me the exposure by sector" — executing `POST /portfolios`,
`POST /{pid}/assets`, and reading the roll-ups, all under org-scoped RBAC.

**How.** A mixed read/write tool surface: list/get are free; create/update/delete portfolio and
add/remove asset are the gated mutating actions requiring confirmation and inheriting the user's
org session (the org filter is enforced in-route). The copilot narrates real portfolio state and
never claims an asset was added without an `AssetPG` row. This is the data-entry front door the
tier-3 Desk Orchestrator uses before routing to analytics copilots (health, PCAF, ECL) that read
the same `portfolios_pg` table.

**Prerequisites.** Evolution A's read fix — a copilot listing portfolios from a failing endpoint
would report nothing or error; RBAC confirmation UX for writes. **Acceptance:** every portfolio,
asset, and total-exposure figure traces to a tool response; write actions require confirmation,
respect org scoping, and log to audit; a cross-org access attempt is refused by the inherited
filter and the copilot explains why.