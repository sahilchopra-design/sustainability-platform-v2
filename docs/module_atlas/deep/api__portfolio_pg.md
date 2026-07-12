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
