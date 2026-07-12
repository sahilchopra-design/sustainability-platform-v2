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
