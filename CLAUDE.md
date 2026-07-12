# CLAUDE.md — A² Intelligence Platform (Risk Analytics)

Operating manual for Claude Code sessions in this repo. Everything here is measured or
hard-won, not aspirational. Companion docs: `docs/PROJECT_OVERVIEW.md` (what this is),
`docs/CRITICAL_REVIEW_UAT_AUDIT.md` (known bugs/gaps/UAT), `docs/DEPLOYMENT.md`
(deploy runbook), `docs/module_atlas/` (per-module documentation, 999 modules).

## What this is (one paragraph)

Sustainability & risk analytics platform: React SPA (853 feature modules, 26 sectors)
+ FastAPI monolith (293 route files, 298 quant engines, 2,528 endpoints) + Supabase
PostgreSQL (584 tables, PostGIS) + 19 real-data ingesters. Branch `remediation-v1` is
the working branch; `main` is behind. Deployed (eventually) as ONE Docker service on
Railway serving the built frontend from FastAPI.

---

## ⛔ Non-negotiable rules

1. **Never fabricate data.** No `Math.random()`/`np.random`/seeded-PRNG values
   presented as real analytics. Missing data → honest nulls + `insufficient_data` /
   `data_availability` fields, or clearly-labeled seeded/demo fallback. The CI
   guardrail `backend/tools/check_no_fabricated_random.py` (workflow
   `no-fabricated-random.yml`) enforces this — run it after touching backend code.
2. **Never trust a subagent's "done" report.** Verify ground truth directly: DB row
   counts, live curl, file existence. This has caught silent 0-row ingester failures,
   a hemisphere-sized data gap, and import errors that "successful" agents reported.
3. **Verify live before claiming success.** Build-green ≠ correct. Restart the backend
   (no hot-reload here) and curl the endpoint; load the page in the preview browser.
4. **Single-writer discipline** for shared hotspots: `frontend/src/App.js`,
   `frontend/src/navGroups.js`, `backend/server.py`. When running parallel agents,
   exactly one writer touches these; everyone else reports diffs for the coordinator
   to apply.
5. **Flat agents** — subagents must not spawn their own subagents.
6. **Never commit/echo secrets.** `backend/.env` is gitignored — keep it that way.
   Never print `SECRET_KEY`/`DATABASE_URL` values; redact when inspecting. Production
   `SECRET_KEY` is generated fresh into Railway's UI, never into the repo.
   `REACT_APP_DEV_AUTH` must never be true in a deployable build (build-time flag,
   bakes into the bundle).
7. **Additive by default.** Don't remove existing functionality while extending a
   module; don't "clean up" unrelated code in passing. ~150 known duplicate route
   registrations exist — leave them unless specifically tasked.
8. **Archive, don't delete**, anything data-like; and ask before destructive DB ops.

## Critical environment facts

- **Windows 11**, Git Bash + PowerShell. Frontend node: `/c/Program Files/nodejs/node.exe`
  (`node_modules` resolution works from `frontend/` — run npm via the full path:
  `/c/Program\ Files/nodejs/node.exe ".../npm-cli.js" run build`).
- **Backend deps are pinned and fragile**: `fastapi==0.110.1`, `starlette==0.37.2`.
  Starlette ≥0.40 silently breaks `include_router`. Never install streamlit (pulls
  starlette≥0.40) into this environment.
- **DB**: Supabase project `kytzcbipsghprsqoalvi` (us-east-2), PostGIS 3.3.7 enabled.
  Connect via `backend/db/base.py` (`load_dotenv()` finds `backend/.env`). Alembic's
  `env.py` does NOT load dotenv — export `DATABASE_URL` first if running alembic CLI.
- **Alembic is broken by design-debt**: two heads (`136`, `155`), DB stamped at
  `135_add_rbac_system`, `alembic upgrade` fails with a stamp-overlap error. Pattern
  for schema changes: write the migration FILE for documentation, then apply the same
  DDL directly via a Python script against `db.base.engine`. Do not attempt the head
  merge unless explicitly asked (deliberately deferred).
- **No backend hot-reload** in the dev launch config — restart `risk-analytics-backend`
  after Python edits.
- **`module_nav.py` caches `docs/module_atlas/module_tags.json` + `atlas.json` with
  `@lru_cache` at startup** — restart the backend after editing atlas artifacts.
- **Auth**: `REQUIRE_AUTH` in `backend/.env` is currently `true` (production posture)
  → all mutating requests 401 without a session; GETs pass. `AuditMiddleware` always on.
  Public prefixes: `/api/health`, `/api/auth*`, `/api/v1/refdata`, `/api/v1/*/ref/*`, docs.

## Dev servers (use preview tools, not raw Bash)

Defined in `.claude/launch.json`:

| Name | What | Port |
|---|---|---|
| `risk-analytics-backend` | uvicorn server.py | 8001 |
| `risk-analytics-dev` | CRA dev server | 3000 |
| `risk-analytics-prod` | serve frontend/build | 4001 |
| `lineage-dashboard` | static lineage report | 4505 |

## Test & verification commands

```bash
# Quant engine benchmarks (12 hand-computed reference cases) — expect 12/12 PASS
python backend/benchmark/bench_quant.py

# Anti-fabrication guardrail — expect 0 hits
python backend/tools/check_no_fabricated_random.py

# E2E lineage harness (from backend/): one domain / all 292 domains
python lineage/run.py <domain>          # e.g. physical-risk-pricing
python lineage/run.py --all             # full sweep, ~25 min, read-only (skips mutations)
python lineage/run.py --list

# Production frontend build (also the de-facto frontend regression gate)
cd frontend && npm run build            # via the full node path on this machine
```

There is **no pytest/jest suite** — do not go looking for one; the four things above
plus live curls ARE the test surface. When you fix an engine bug, pin it as a new case
in `bench_quant.py`.

**Lineage-sweep triage discipline**: most "failed" endpoints are harness artifacts
(mock `Request` objects → `'str' object has no attribute ...`; synthetic UUIDs → 404;
enum validators rejecting `TEST_*` strings). Before calling anything a bug, curl the
real endpoint on the running server. The harness's error label frequently differs from
the real-traffic failure mode.

## Engine layer — canonical facts

297 engine modules / 231k LOC / 3,264 functions in `backend/services/`. Full inventory:
`docs/ENGINE_CATALOG.md` (regenerable — script pattern in that file's header). Trust
tiers: 12 bench-pinned (`bench_quant.py`) ⊂ 293 atlas-audited ⊂ all lineage-traced.
When you modify ANY engine: (1) read its Atlas deep-dive first, (2) re-run bench_quant
if it's one of the 12, (3) update the deep-dive after, (4) if you fixed a formula, pin
it as a new bench case. The biggest engines are NOT the safest — `activity_guide_catalog`
(6.2k LOC), `data_lineage_service` (5.4k), `peer_benchmark_engine` (3.5k) have no
numerical pins at all.

## Data layer — canonical facts

- **`portfolios_pg` (PortfolioPG) is the portfolio table.** The legacy `portfolios`
  table/model is EMPTY and its non-v1 router is dead. Never write to `portfolios`.
- **Raw-SQL-inserted rows bypass ORM Python-side defaults** → old rows can have NULL
  `updated_at`/etc. even where the model says non-null. When building responses, use
  `row.get("x") or fallback` — NOT `row.get("x", fallback)` (doesn't fire on
  existing-but-None keys). This exact bug class has shipped twice.
- **Entity golden source**: `entity_lei` (GLEIF), self-healing resolve with
  `resolution_tier: local_cache | live_gleif_fallback | no_match`.
- **Physical-risk digital twin**: `ref_earthquake_zones` (4,500) / `ref_cyclone_zones`
  (4,470) / `ref_wildfire_zones` (5,378) / `ref_flood_zones` (48) / `ref_sea_level_zones`
  (152) / `ref_protected_areas` (0 — WDPA license deferred, intentional). Query via the
  `spatial.py` pattern `ST_Within(ST_SetSRID(ST_MakePoint(:lng,:lat),4326), zone_boundary)`.
  Note geometry column types vary (`ref_wildfire_zones` is MULTIPOLYGON — wrap inserts
  in `ST_Multi(...)`); check `geometry_columns` before inserting.
- **Ingesters** (`backend/ingestion/`, subclass `BaseIngester`, registered in
  `manager.py`): bulk-fetch-then-locally-aggregate — never one API call per grid cell.
  In per-row upsert loops, `db.rollback()` in the except branch or one bad row poisons
  the whole Postgres transaction (shipped bug, fixed, don't reintroduce).
- **Key-gated integrations** follow the graceful-fallback convention: unset key →
  labeled seeded data, never a crash. All keys documented in `backend/.env.example`.
- **DB shape (measured 2026-07-06)**: 577 public tables, ~350k rows, **74% of tables
  empty — usually by design** (write-side verticals, mutation endpoints, deferred
  sources). Full catalog with per-table row counts: `docs/DATABASE_CATALOG.md`;
  suspicious-empties triage: `docs/CRITICAL_REVIEW_UAT_AUDIT.md` §B2c. Before
  seeding/“fixing” an empty table, check those two docs — emptiness is often a
  decision, not a bug. 82% of all rows live in the refdata backbone
  (`reference_data_points/records`); `entity_lei` currently has 3 rows (JIT cache —
  bulk ingest fixed but never run at scale).

## Frontend conventions

- **Every module page defines its own local `T` theme object** (DM Sans / JetBrains
  Mono; navy/gold institutional palette). Only `App.js` chrome is global. Match the
  existing T of a page when editing it.
- **Adding a module needs THREE wirings** (App.js alone is not enough):
  1. `App.js`: lazy import + `<Route>` (wrapped in `ProtectedRoute`).
  2. `frontend/src/navGroups.js`: nav entry `{path, label, badge, code}` in the right
     group — this is what the sidebar/command palette actually read. Check the EP code
     is unused first (`grep "code: 'E###'" navGroups.js` — collisions have happened).
  3. `docs/module_atlas/`: guide entry (`module_guides.json`), sector tag
     (`module_tags.json`), then `python scripts/build_module_atlas.py`; deep-dive at
     `docs/module_atlas/deep/<id>.md` (§7 methodology + §8 model spec — follow
     `deep/asset-exposure-explorer.md` as the exemplar). Restart backend (lru_cache).
  - Alternative (preferred for refined modules): per-feature `module.config.js`
    manifest via `moduleRegistry.auto.js` — handles route+nav in one file.
- **Live/Demo badging**: any panel that can show non-live data must badge it
  (idle/loading/live/unavailable states; see `AIGovernancePage.jsx` pattern). Honest
  empty states over fabricated fallbacks, always.
- **navGroups.js is imported by SectorSidebar/CommandPalette — never import App.js
  from those components** (circular-import TDZ crash; that's why navGroups.js exists).

## Backend conventions

- New routers: `backend/api/v1/routes/<name>.py`, `APIRouter(prefix="/api/v1/<kebab>")`,
  import + `include_router` in `server.py` (keep the two lines near related domains,
  with the one-line comment convention). Check prefix collisions before registering.
- Engines live in `backend/services/`, are import-cheap (no I/O at import time), and
  document their formulas in docstrings — the Atlas builder AST-extracts them.
- Route handlers validate inputs defensively: coerce query-param types explicitly,
  guard None numerics (`float(x or 0)` where semantically safe, else 422).
- Public reference endpoints go under the router's `/ref/...` path (auth-exempt by
  middleware pattern).
- Error style: raise `HTTPException` with actionable detail; unexpected exceptions are
  caught by middleware into a generic 500 envelope with request-id.

## Module Atlas (the documentation system)

`docs/module_atlas/` — atlas.json (machine-readable), `modules/*.md` (generated),
`deep/*.md` (hand-authored §7 Methodology Deep Dive + §8 Model Specification),
`module_guides.json` (per-route guide data), `module_tags.json` (sector taxonomy —
also drives the live navigation sectors endpoint). Regenerate with
`python scripts/build_module_atlas.py` (idempotent; merges deep/ content into
modules/). The atlas is the single source of truth for "what does this module compute
and where do its numbers come from" — keep it current when you change methodology.

## Git & deployment

- Work happens on `remediation-v1`. Commit only when asked; the repo routinely carries
  a large uncommitted working set — do not "helpfully" commit it.
- `.claude/worktrees/` contains ~30 historical agent worktrees — ignore them.
- Deploy runbook: `docs/DEPLOYMENT.md` (Railway, single service, env-var table,
  pre-deploy blocker checklist). The DB is never migrated at deploy time.
- Known-open bugs and the missing-test inventory live in
  `docs/CRITICAL_REVIEW_UAT_AUDIT.md` — check it before filing "new" findings.

## Working style that fits this repo

- Scale carefully: this codebase rewards **measuring before asserting** (counts,
  grep, live checks) — many docs/memories drift behind the code.
- When fanning out parallel agents: give each a named file scope, forbid shared-file
  writes (rule 4), require each to end with its own live verification, and
  independently spot-check at least one agent's claim per wave.
- When touching anything with a formula: read the module's Atlas deep-dive first,
  update it after, and consider whether bench_quant should pin the behavior.
- Prefer extending existing infrastructure (ingestion framework, refdata layer,
  spatial.py patterns, EntityAutocomplete, useReferenceData) over building parallel
  new mechanisms — grep first; this platform almost always already has the scaffold.
