# Deploying to Railway

This app is set up for **single-service deployment**: one Docker image builds
the React frontend and serves it directly from the FastAPI backend process
(`backend/server.py` mounts `frontend/build/` as static files whenever that
directory exists — see the "Serve frontend build" section near the bottom of
the file). One Railway service, one URL, no CORS to configure between
frontend and backend since they're same-origin in production.

Database is already solved: this repo connects to the **"Scenario Analysis"**
Supabase project (`kytzcbipsghprsqoalvi`, us-east-2) — already a managed,
always-on Postgres reachable from anywhere. Nothing to do there.

## What's already prepared in this repo
- `Dockerfile` (repo root) — multi-stage build: Node builds the frontend,
  Python installs backend deps and serves everything via `uvicorn`. Reviewed
  2026-07-05: sound (package-lock.json present for reproducible `npm ci`,
  correct Python/dep pins) — not yet build-tested locally since this
  environment has no Docker installed; the real build-test will be Railway's
  own first deploy.
- `.dockerignore` — excludes `.git`, `node_modules`, `__pycache__`,
  `backend/.env` (secrets are never baked into the image — see below), and
  large non-essential artifacts (lineage output, module atlas docs, etc.).
  Confirmed clean 2026-07-05.
- `railway.json` — points Railway at the root Dockerfile, wires the existing
  `/api/health` endpoint as the health check (confirmed live: returns
  `{"status":"healthy",...}`).
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
2. **New Project → Deploy from GitHub repo** → select this repo
   (`sahilchopra-design/sustainability-platform-v2`) and the `remediation-v1`
   branch (or `main`, once merged — make sure whichever branch you pick
   actually has the commit/push from step 1 above on it). Railway will
   auto-detect `railway.json` / the root `Dockerfile`.
3. **Set environment variables** in the Railway service's Variables tab.
   Copy the *values* from your local `backend/.env` (never share that file
   directly — copy values one at a time into Railway's UI):

   | Variable | Production value |
   |---|---|
   | `DATABASE_URL` | same as local (points at Supabase already) |
   | `SUPABASE_URL` | same as local |
   | `SUPABASE_ANON_KEY` | same as local |
   | `SECRET_KEY` | freshly generated value — see "Before you deploy" item 2 above, don't reuse the dev value |
   | `REQUIRE_AUTH` | `true` (was `false` in dev — production must gate mutating requests) |
   | `ALLOWED_ORIGINS` | the Railway-assigned domain, e.g. `https://your-app.up.railway.app` (Railway shows this after first deploy — you'll need one redeploy after you know the domain, or set a custom domain first) |
   | `ENVIRONMENT` | `production` |
   | `PLATFORM_BASE_URL` | same as `ALLOWED_ORIGINS`, used in invite emails |
   | `ALPHA_VANTAGE_API_KEY` / `EODHD_API_KEY` / `FINNHUB_API_KEY` | same as local, only if those live-data integrations matter for your team's use |
   | `YFINANCE_ENABLED` | same as local |

   Optional, for the email-invite flow to actually send emails (currently
   commented out in local `.env` — pick one):
   - `SENDGRID_API_KEY` (sign up at sendgrid.com, free tier 100 emails/day), or
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` (e.g. Gmail SMTP)

4. **Deploy.** Railway builds the Dockerfile and starts the service. Watch
   the build logs for the frontend `npm run build` step (can take a few
   minutes) and confirm `/api/health` returns `{"status": "healthy"}` once
   live.

   `REACT_APP_DEV_AUTH` is a React *build-time* variable — it gets compiled
   directly into the JS bundle by `npm run build` (the Dockerfile's frontend
   stage), so it can't be toggled later from Railway's dashboard the way
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

## Local production-mode smoke test (optional, before deploying)
```bash
cd frontend && npm run build && cd ..
docker build -t risk-analytics .
docker run -p 8001:8001 --env-file backend/.env risk-analytics
# visit http://localhost:8001 — should serve the built frontend + API from one process
```
Not run in this dev environment (no local Docker install) — the Dockerfile
was reviewed statically instead (see "What's already prepared" above). If
you have Docker locally, running this once before your first Railway deploy
is still the fastest way to catch a build-time surprise before paying for a
Railway build cycle.
