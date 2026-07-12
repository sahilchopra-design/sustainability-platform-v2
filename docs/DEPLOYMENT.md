# Deploying to Railway

**Deployment model (chosen 2026-07-12): two services.**
- **Backend** → Railway, **Nixpacks** builder, service root = `backend/`
  (config: `backend/railway.json`). Runs `uvicorn server:app`, health check
  `/api/health`. **No migration at deploy** (see the Alembic note below).
- **Frontend** → deployed separately (Vercel or a second Railway service from
  `frontend/`). It talks to the backend over `REACT_APP_BACKEND_URL`, so CORS
  must be configured on the backend (`ALLOWED_ORIGINS`) to allow the frontend
  origin — they are NOT same-origin in this model.

> An earlier single-service Dockerfile model (one image serving the built
> frontend from FastAPI) was removed 2026-07-12 in favour of the above. The
> root `Dockerfile` / `railway.json` / `.dockerignore` no longer exist; do not
> reintroduce them unless you deliberately switch models. `backend/server.py`
> can still statically serve `frontend/build/` if present, but that path is
> unused here.

Database is already solved: this repo connects to the **"Scenario Analysis"**
Supabase project (`kytzcbipsghprsqoalvi`, us-east-2) — already a managed,
always-on Postgres reachable from anywhere. Nothing to do there.

## ⚠️ Do NOT migrate at deploy time (Alembic is multi-head)
`backend/railway.json` intentionally has **no** `preDeployCommand`. Alembic
currently has **4 heads** (`058c`, `088_reconcile_orm_schema_drift`, `136`,
`155`) after the 2026-07-12 branch merge, so `alembic upgrade head` is
ambiguous and fails — and the Supabase DB is already fully populated (schema
created out-of-band). If a `preDeployCommand: alembic upgrade head` ever
reappears in the Railway config, **the deploy will fail** at the pre-deploy
step. Schema changes are applied via direct DDL against the DB, never at
deploy. (Resolving the 4 heads into one clean chain is a separate, deferred
task — see CLAUDE.md.)

## What's already prepared in this repo
- `backend/railway.json` — Nixpacks builder, `uvicorn server:app` start
  command, `/api/health` health check, no pre-deploy migration. Backend boots
  clean and merged-area endpoints return 200 (verified live 2026-07-12).
- `backend/Procfile` (`web: uvicorn server:app …`) and `backend/.python-version`
  — Nixpacks/Railway backend runtime hints.
- `frontend/nixpacks.toml` — disables the Nixpacks build-cache mount (a stuck
  `node_modules/.cache` mount was breaking `npm ci`); only relevant if the
  frontend is built on Railway/Nixpacks rather than Vercel.
- **RBAC hard-block is done.** `ProtectedRoute` is fully wired into `App.js`
  (842 references) and server-side `allowed_module_paths` enforcement is live
  — this used to be a separate pending work item blocking deploy; it isn't
  anymore. See §"What changed for the RBAC hard-block" below for the (now
  historical) detail.
- **Backend test pass (2026-07-05)**: ran the full 292-domain/2,528-endpoint
  E2E lineage harness plus the 12-case quant-engine benchmark
  (`backend/benchmark/bench_quant.py`, 12/12 PASS) and the no-fabricated-data
  guardrail (0 hits). Found and fixed 6 real live bugs surfaced by the sweep
  (portfolio analytics null-datetime crash, a wrong SQL column name, a stale
  import, missing dict keys, and a private-attribute access) — all confirmed
  fixed via live re-test. See `docs/module_atlas` session memory / git log
  around 2026-07-05 for detail if something regresses.
- **RBAC hard-block is done.** `ProtectedRoute` is fully wired into `App.js`
  (842 references) and server-side `allowed_module_paths` enforcement is live
  — this used to be a separate pending work item blocking deploy; it isn't
  anymore. See §"What changed for the RBAC hard-block" below for the (now
  historical) detail.
- **Backend test pass (2026-07-05)**: ran the full 292-domain/2,528-endpoint
  E2E lineage harness plus the 12-case quant-engine benchmark
  (`backend/benchmark/bench_quant.py`, 12/12 PASS) and the no-fabricated-data
  guardrail (0 hits). Found and fixed 6 real live bugs surfaced by the sweep
  (portfolio analytics null-datetime crash, a wrong SQL column name, a stale
  import, missing dict keys, and a private-attribute access) — all confirmed
  fixed via live re-test. See `docs/module_atlas` session memory / git log
  around 2026-07-05 for detail if something regresses.

## Before you deploy — real blockers as of 2026-07-05

These are not yet done and Railway can't reflect this codebase until they are:

1. **Commit and push.** As of 2026-07-05 there are **1,353 uncommitted files**
   and **61 commits on `remediation-v1` not yet pushed** to
   `origin/remediation-v1` (which does exist and is tracked — just behind).
   Railway deploys from the GitHub repo, so none of this session's work
   (including the bug fixes above) is deployable until it's committed and
   pushed.
2. **Generate a real `SECRET_KEY` for production.** The current
   `backend/.env` value is still the literal dev placeholder
   (`...change-in-production`) — do not reuse it. Generate one with
   `python -c "import secrets; print(secrets.token_hex(32))"` and paste it
   directly into Railway's Variables tab (never into the repo).
3. **Confirm `frontend/.env` does not set `REACT_APP_DEV_AUTH=true`.**
   Verified clean as of 2026-07-05, but this is a build-time flag that gets
   compiled into the JS bundle — worth a final look right before you kick off
   the Railway build, since it can't be toggled off afterward without a
   rebuild. See the warning under step 4 below for why this matters.

Not a blocker, but worth knowing: the DB has two divergent Alembic migration
heads (a long-standing, deferred issue — not something introduced by recent
work). This does **not** block this deployment because Railway connects to
the existing, already-populated Supabase project and never runs
`alembic upgrade` against it. It would only matter if you ever needed to spin
up a *fresh* empty database (e.g. a staging environment) — flag it then, not
now.

## Steps you need to do (require your Railway login — I can't do these for you)

1. **Create a Railway account** at railway.app if you don't have one, and
   connect your GitHub account.
2. **New Project → backend service.** Deploy from GitHub repo
   (`sahilchopra-design/sustainability-platform-v2`, `main` branch), and set the
   service **root directory to `backend/`** so Railway reads `backend/railway.json`
   (Nixpacks). Deploy the **frontend separately** (Vercel pointed at `frontend/`,
   or a second Railway service rooted at `frontend/`).
3. **Set environment variables** on the BACKEND service's Variables tab.
   Copy the *values* from your local `backend/.env` (never share that file
   directly — copy values one at a time into Railway's UI):

   | Variable | Production value |
   |---|---|
   | `DATABASE_URL` | same as local (points at Supabase already) |
   | `SUPABASE_URL` | same as local |
   | `SUPABASE_ANON_KEY` | same as local |
   | `SECRET_KEY` | freshly generated value — see "Before you deploy" item 2 above, don't reuse the dev value |
   | `REQUIRE_AUTH` | `true` (was `false` in dev — production must gate mutating requests) |
   | `ALLOWED_ORIGINS` | the **frontend's** deployed origin(s), comma-separated, e.g. `https://your-frontend.vercel.app` — because in the two-service model the browser calls the backend cross-origin. Get this after the frontend deploys; a redeploy/var-update on the backend closes the loop. |
   | `ENVIRONMENT` | `production` |
   | `PLATFORM_BASE_URL` | the frontend origin (used in invite-email links) |

   On the FRONTEND service/Vercel, set `REACT_APP_BACKEND_URL` to the backend's
   deployed URL (build-time — the frontend must be rebuilt if it changes).
   | `ALPHA_VANTAGE_API_KEY` / `EODHD_API_KEY` / `FINNHUB_API_KEY` | same as local, only if those live-data integrations matter for your team's use |
   | `YFINANCE_ENABLED` | same as local |

   Optional, for the email-invite flow to actually send emails (currently
   commented out in local `.env` — pick one):
   - `SENDGRID_API_KEY` (sign up at sendgrid.com, free tier 100 emails/day), or
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` (e.g. Gmail SMTP)

4. **Deploy.** Railway/Nixpacks installs `backend/requirements.txt` and starts
   `uvicorn server:app`; confirm `/api/health` returns `{"status":"healthy"}`
   once live. Deploy the frontend (Vercel: `npm run build`, output `build/`).
   There is **no** pre-deploy migration step (see the Alembic warning above) —
   if the deploy ever hangs/fails on `alembic upgrade`, remove that
   `preDeployCommand` from the Railway config.

   `REACT_APP_DEV_AUTH` is a React *build-time* variable — it gets compiled
   directly into the JS bundle by `npm run build` (the frontend build
   stage), so it can't be toggled later from the dashboard the way
   backend env vars can. If it were `true` in the build, it would auto-log-in
   any visitor and bypass the RBAC hard-block entirely on the frontend
   regardless of the backend's `REQUIRE_AUTH` setting — see "Before you
   deploy" item 3 above (already verified clean, but Railway builds fresh
   from your repo each time, so it's worth a final glance if you've touched
   `frontend/.env` since).
5. **Invite your team.** Once deployed and `REQUIRE_AUTH=true`, use the
   existing admin invite flow (`/admin` → Invites tab, or `POST
   /api/admin/invites`) to send each teammate a role + module-preset +
   any per-user module overrides. This is the RBAC system already built into
   the app — see `docs/module_atlas/deep/rbac-admin.md` or the admin panel
   itself for the available presets.

## What changed for the RBAC hard-block (historical — now done)
A previously-dead `ProtectedRoute` component has been wired into `App.js` so
restricted modules are actually blocked (not just hidden from nav), plus
server-side enforcement of `allowed_module_paths` on the backend. Confirmed
present (842 references in `App.js`) as of 2026-07-05 — `REQUIRE_AUTH=true`
in production now actually gates something. This section is kept for
history; there's nothing left to do here before deploying.

## Local pre-deploy smoke test (optional)
```bash
# backend — the exact Railway start command, from backend/
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001
#   then: curl http://localhost:8001/api/health  → {"status":"healthy",...}
# frontend — the exact Vercel/Nixpacks build
cd frontend && REACT_APP_BACKEND_URL=http://localhost:8001 npm run build
#   serves from build/ ; verify it targets the backend URL above
```
Verified live 2026-07-12: the backend boots and merged-area endpoints
(`/api/v1/regulatory-calendar/frameworks`, `/api/v1/lineage/module-graph`,
`/api/v1/global-physical-risk/coverage-stats`,
`/api/v1/portfolio-analytics/portfolios`) all return 200; the frontend build
compiles. The first real backend build is still Railway's Nixpacks run.
