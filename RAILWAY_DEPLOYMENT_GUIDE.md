# Production Deployment Guide — Railway + Supabase

Step-by-step deployment of the full platform — every UI module, every API engine, with
DB-backed **module-level access sharing** for the team.

---

## 0. Is the application deployment-ready? (assessment)

**Yes — as of this branch.** Full inventory and the evidence behind the answer:

| Layer | Inventory | Verification |
|---|---|---|
| Frontend UI modules | **251 routes / 255 nav entries / 40 domain groups** | Browser E2E: 252/252 pages render in the production bundle, 12/12 deep-interaction |
| Backend API | **258 routers, 400+ endpoints** | Boots cleanly on uvicorn; 2,152 integration tests pass against the live API |
| Calculation engines | **~290 service engines** (`backend/services/`) + frontend JS engines | Engine unit suites green; 15/15 frontend engine invariant tests |
| Database | **82 alembic migrations + reconciliation (088)** | Fresh-database replay to head verified in one shot |
| Data lineage | 88 registered engines, 228 edges | 80/80 lineage tests, zero orphan references |
| Module registry & access | 251 modules seeded in Supabase with per-module access flags | RLS verified by role-impersonation |

**Deployment blockers found & fixed in this pass** (they would have broken a Railway deploy):
1. **48 modules hardcoded `http://localhost:8001`** (7 even pointed at the wrong port `8000`) — every
   API-backed feature would have called the *user's own machine* in production. All now use
   `process.env.REACT_APP_BACKEND_URL` with a localhost fallback for local dev.
2. **`requirements.txt` contained `emergentintegrations==0.1.0`**, which does not exist on PyPI —
   `pip install` failed, which is why full dependency installs silently broke. Removed (verified unused).
3. **No process configs** — added `backend/Procfile`, `backend/railway.json` (with `alembic upgrade head`
   as pre-deploy + `/docs` healthcheck), `backend/.python-version`, and `frontend/railway.json`
   (static build served by `serve` with SPA fallback).
4. The migration-chain and schema-drift fixes from the E2E pass (see `E2E_TEST_REPORT.md` §7) are
   prerequisites for step 2 below — deploying from any earlier commit will fail at migration time.

---

## 1. Target architecture

```
                    ┌──────────────────────────── Railway project ───────────────────────────┐
Team browsers ───▶  │  frontend service (static)          backend service (uvicorn)          │
 (anywhere)         │  Node 18+ · npm run build            Python 3.11 · 258 routers          │
                    │  npx serve -s build -l $PORT   ───▶  uvicorn server:app --port $PORT    │
                    └───────────┬──────────────────────────────────┬──────────────────────────┘
                                │ (browser, publishable key)       │ DATABASE_URL (session pooler)
                                ▼                                  ▼
                    Supabase "New App" project          Supabase backend DB project
                    platform_modules / _access /        82-migration schema + engine tables
                    _usage / _deployments               (dme_*, cbam_*, esrs_*, …)
                    = module registry & ACCESS          = calculation data
```

Two Supabase projects are already in use by the team — keep that separation:
- **`New App`** (`ynxmxgjdivriakhxxptk`) — module registry + access control (seeded with all 251 modules).
- **Backend engine DB** — the project in `backend/.env` (currently "Scenario Analysis") holding
  migrated engine tables. You can also start a fresh project (§2, path B).

## 2. Supabase — database setup

### Path A — existing backend project (recommended: keeps existing data)

1. Supabase Dashboard → your backend project → **Connect** → copy the **Session pooler** URI
   (port 5432): `postgresql://postgres.<ref>:<password>@aws-x-<region>.pooler.supabase.com:5432/postgres`
2. Because the production schema was historically patched by hand, just align the version stamp and
   let the new reconciliation migration run (it's idempotent — a no-op where columns already exist):
   ```bash
   cd backend
   DATABASE_URL='<pooler uri>' alembic stamp 087        # if alembic_version is absent/behind
   DATABASE_URL='<pooler uri>' alembic upgrade head     # applies 088 reconciliation
   ```

### Path B — fresh Supabase project

1. Create the project, copy the Session-pooler `DATABASE_URL`.
2. SQL Editor → enable PostGIS and create the four tables that predate the migration chain
   (documented prerequisites — they were created outside alembic on the original DB):
   ```sql
   create extension if not exists postgis;
   create table alembic_version (version_num varchar(255) primary key);
   create table counterparty (id uuid primary key default gen_random_uuid(),
     name text, sector text, country text, nace_code text, created_at timestamptz default now());
   create table scenario (id uuid primary key default gen_random_uuid(),
     name text, created_at timestamptz default now());
   create table dh_data_sources (id text primary key, name text not null, category text,
     sub_category text, description text, access_type text, base_url text,
     sync_enabled boolean default false, sync_schedule text, status text default 'active',
     priority text, last_sync_at timestamptz, last_sync_status text,
     records_count bigint default 0, config jsonb default '{}'::jsonb,
     created_at timestamptz default now(), updated_at timestamptz default now());
   ```
3. Run the chain from your machine (one shot — verified): `DATABASE_URL='<uri>' alembic upgrade head`
   *(or skip — the Railway pre-deploy command in §3 does it on first deploy).*

### Registry project (module access) — already done

`platform_modules`, `platform_module_access`, `platform_module_usage`, `platform_deployments`
are live in the **New App** project with RLS enabled and all 251 modules seeded. Nothing to do here.

## 3. Railway — backend service

1. **railway.com → New Project → Deploy from GitHub repo** → select
   `sahilchopra-design/sustainability-platform-v2` (install the Railway GitHub app if prompted).
2. On the new service → **Settings → Root Directory: `backend`**. Railway/Nixpacks picks up
   `.python-version` (3.11), `requirements.txt`, and `railway.json` automatically:
   pre-deploy `alembic upgrade head` → start `uvicorn server:app --host 0.0.0.0 --port $PORT`
   → healthcheck `/docs`.
3. **Variables** tab — set:

   | Variable | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | Supabase session-pooler URI from §2 | required |
   | `SECRET_KEY` | `openssl rand -hex 32` | required |
   | `REQUIRE_AUTH` | `false` initially | flip to `true` once auth flows are configured |
   | `RATE_LIMIT_ENABLED` | `true` | keep the limiter on in production |
   | `ALLOWED_ORIGINS` | `https://<frontend>.up.railway.app` | fill in after §4; comma-separated |
   | `SUPABASE_URL` / `SUPABASE_ANON_KEY` | from the backend Supabase project | used by Supabase-backed routes |
   | `EODHD_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY` | optional | live market/ESG feeds; engines degrade gracefully without them |

4. **Deploy**, then verify:
   ```bash
   curl https://<backend>.up.railway.app/docs                          # 200
   curl -X POST https://<backend>.up.railway.app/api/v1/cbam/seed      # {"products":15,...}
   curl https://<backend>.up.railway.app/api/v1/stranded-assets/dashboard
   ```
5. Settings → **Networking → Generate Domain** if not auto-created (this is `<backend>.up.railway.app`).

## 4. Railway — frontend service

1. Same Railway project → **+ New → GitHub Repo** → same repository →
   **Settings → Root Directory: `frontend`**. `frontend/railway.json` provides
   build (`npm ci && npm run build`) and start (`npx serve -s build -l $PORT`, SPA fallback included —
   all 251 module routes deep-link correctly).
2. **Variables** (build-time — CRA inlines them during `npm run build`):

   | Variable | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | `https://<backend>.up.railway.app` |
   | `REACT_APP_SUPABASE_URL` | *(optional — baked default is the team New App project)* |
   | `REACT_APP_SUPABASE_ANON_KEY` | *(optional, same)* |

3. Deploy → Generate Domain → open `https://<frontend>.up.railway.app/team-access-hub`.

## 5. Wire-up + register the deployment

1. Back on the **backend** service, set `ALLOWED_ORIGINS=https://<frontend>.up.railway.app`
   (add `http://localhost:3000` if you still want local dev against prod API) → redeploy.
2. Register the deployment so the Team Access Hub shows the canonical URL to everyone —
   Supabase (**New App**) SQL Editor:
   ```sql
   insert into platform_deployments (url, environment, git_branch, git_commit, notes)
   values ('https://<frontend>.up.railway.app', 'production',
           'claude/climate-risk-collateral-framework-fo8asf', '<commit sha>',
           'Railway production — backend https://<backend>.up.railway.app');
   ```

## 6. Module-level access sharing

Access is controlled **per module, for the whole team, live from the database** — no redeploys.
The mechanism is the `platform_module_access` table (New App project) + the Team Access Hub UI
(`/team-access-hub`), protected by RLS: the deployed app's publishable key can only *read* flags
and log usage; all *changes* go through the Supabase dashboard, which every team member already has.

**Semantics** — one row per module (`route` is the key):
- `access_level`: `open` (unrestricted) · `team` (default — all team members) · `admin` (restricted)
- `enabled`: kill-switch — `false` greys the module out in the directory instantly for everyone
- `owner_email`: module steward, shown in the hub
- `notes`: free text (e.g. "under revision until Q3")

**Cookbook** (run in New App → SQL Editor; takes effect on every user's next page load):
```sql
-- Share a single module with the whole team (default state)
update platform_module_access set access_level='team', enabled=true, updated_at=now()
where route = '/climate-collateral-framework';

-- Restrict one module to admins and assign a steward
update platform_module_access
set access_level='admin', owner_email='sahil.chopra@aaimpactinc.com', updated_at=now()
where route = '/model-governance';

-- Grant/disable an entire domain group at once (module-level, group-wide)
update platform_module_access a set enabled=false, notes='Group under audit', updated_at=now()
from platform_modules m
where m.route=a.route and m.nav_group='Financed Emissions & Climate Banking';

-- Assign every module in a group to one team member
update platform_module_access a set owner_email='analyst@aaimpactinc.com', updated_at=now()
from platform_modules m where m.route=a.route and m.nav_group='Quant ESG & Portfolio';

-- Audit: what changed recently, what is off, who owns what
select route, access_level, enabled, owner_email, updated_at
from platform_module_access order by updated_at desc limit 25;

-- Usage: which modules the team actually opens (fed by the deployed app)
select route, count(*) opens, max(occurred_at) last_open
from platform_module_usage group by route order by opens desc limit 20;
```

**Current enforcement model & the upgrade path**: today these are *team-shared visibility flags* —
ideal for coordinating one team where everyone is trusted (matching "every member already has DB
access"). The `admin` level is advisory in the UI, not cryptographically enforced per user, because
the app ships without login. To upgrade to **hard per-user enforcement** later: enable Supabase Auth
on the New App project, add a `module_grants(user_id, route)` table, and replace the read policy on
`platform_module_access` with one that joins `auth.uid()` against grants — the frontend service
layer (`moduleRegistryService.js`) already isolates every read, so nothing else changes.

## 7. Post-deploy smoke checklist

- [ ] `https://<frontend>.up.railway.app/` — home renders, nav shows 40 groups
- [ ] Deep links work: `/climate-collateral-framework`, `/team-access-hub`, `/dme-dashboard`
- [ ] Team Access Hub → Deployment tab shows **Team DB: Connected** and **Registry: Live**
- [ ] An API-backed module round-trips (e.g. SFDR PAI or Regulatory Capital calculators return results)
- [ ] `POST /api/v1/cbam/seed` then CBAM endpoints return data
- [ ] Disable a test module in `platform_module_access` → hub greys it out on reload → re-enable
- [ ] Usage rows appear in `platform_module_usage` after clicking "Open" links in the hub

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Backend build fails on pip | You're deploying a commit older than this branch (`emergentintegrations` still in requirements) — deploy this branch |
| Pre-deploy migration fails on fresh DB | §2 Path B prerequisites (PostGIS + 4 tables) not created |
| Frontend calls fail with CORS errors | `ALLOWED_ORIGINS` on the backend doesn't include the frontend domain — set + redeploy |
| API-backed modules call `localhost:8001` in prod | `REACT_APP_BACKEND_URL` wasn't set at **build** time — set the variable and redeploy the frontend (rebuild required, it's compile-time) |
| Sporadic 429s under heavy team use | Expected — production limiter is on; raise tier limits in `middleware/rate_limiter.py` or scale replicas |
| Module flags don't change anything | You edited the wrong Supabase project — access lives in **New App**, engine data in the backend project |
| `/docs` healthcheck times out on first deploy | Cold pip install + 82 migrations can exceed 5 min — raise `healthcheckTimeout`, redeploy |

## 9. Security notes

- Keep `RATE_LIMIT_ENABLED=true` and set a strong `SECRET_KEY` in production.
- The publishable Supabase key in the frontend is safe by design (RLS-scoped, read + usage-insert only).
- ⚠ Open advisory (pre-existing): **69 legacy tables in the New App project have RLS disabled**
  (`dme_*`, `esrs_*`, `repo_*`, …) — anyone with the anon key can modify them. Remediation pattern in
  `TEAM_DEPLOYMENT_GUIDE.md` §6; recommended before widening access beyond the team.
- `REQUIRE_AUTH=false` means API endpoints are open at the network level — acceptable behind team-only
  URL sharing, but flip to `true` + configure auth before any external exposure.
