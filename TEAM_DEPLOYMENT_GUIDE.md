# Team Deployment & Module Access Guide

How to give every team member remote access to **all 251 modules & workflows** on the platform,
with shared module-access control and telemetry running on the team's Supabase database
(which everyone already has access to).

**In-app companion**: the **Team Access Hub** module (`/team-access-hub`, nav: Data Infrastructure)
shows the live module directory, access matrix, DB connectivity, and registered deployment URLs.

---

## 1. Architecture

```
Team members (browser, anywhere)
        │
        ▼
Vercel (static SPA)  ── vercel.json rewrites every /route → index.html
        │                so ALL 251 module routes deep-link correctly
        ▼
React app (frontend/)
        │  src/services/supabaseClient.js  (zero-dependency PostgREST client)
        ▼
Supabase "New App" project  (https://ynxmxgjdivriakhxxptk.supabase.co)
        ├─ platform_modules         canonical catalog (251 routes, 40 groups)   [RLS: read]
        ├─ platform_module_access   per-module access level + enable/disable    [RLS: read]
        ├─ platform_module_usage    append-only usage pings from the app        [RLS: read + insert]
        ├─ platform_deployments     registry of deployed URLs                   [RLS: read]
        └─ dme_* / esrs_* / pcaf_* / repo_*   existing domain datasets (backend engines)
```

The frontend key is the **publishable** key — safe in the browser by design; RLS restricts it
to read + usage-insert. All *writes* (access changes, deployment records) go through the
Supabase dashboard, which the whole team already uses.

## 2. Deploy for remote access (one-time, ~5 minutes)

1. **Vercel → New Project → import** `sahilchopra-design/sustainability-platform-v2`.
   The root `vercel.json` is picked up automatically:
   - build: `cd frontend && react-app-rewired build`
   - output: `frontend/build`
   - SPA rewrite: every path serves `index.html`, so `https://<app>.vercel.app/climate-collateral-framework`
     (and all 250 other routes) load directly.
2. **Environment variables — optional.** The app ships with working defaults for the team
   Supabase project. To override (different project / rotated key), set in Vercel:
   `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` (see `frontend/.env.example`).
3. **Deploy**, then **record the URL** so the Team Access Hub shows it to everyone:
   ```sql
   insert into platform_deployments (url, environment, git_branch, git_commit, notes)
   values ('https://<your-app>.vercel.app', 'production',
           'claude/climate-risk-collateral-framework-fo8asf', '<commit sha>', 'Initial team deployment');
   ```
4. **Share the URL.** Every module is now remotely accessible to every team member.
   Module opens from the hub are logged to `platform_module_usage`.

**Alternative (no Vercel):** any static host works — `cd frontend && npm run build`, then serve
`frontend/build` with SPA fallback (`npx serve -s build`; `serve` is already a devDependency).

## 3. Managing module access (shared, instant, no redeploy)

Access flags live in `platform_module_access` and apply to **all** deployed clients on next load.
Edit in the Supabase dashboard (Table Editor or SQL):

```sql
-- Disable a module for everyone (kill-switch)
update platform_module_access set enabled = false, notes = 'Under revision', updated_at = now()
where route = '/sec-climate-rule';

-- Restrict a module to admins
update platform_module_access set access_level = 'admin', owner_email = 'sahil.chopra@aaimpactinc.com'
where route = '/model-governance';

-- Assign an owner to every module in a group
update platform_module_access a set owner_email = 'analyst@aaimpactinc.com'
from platform_modules m where m.route = a.route and m.nav_group = 'Financed Emissions & Climate Banking';

-- What is the team actually using?
select route, count(*) opens, max(occurred_at) last_open
from platform_module_usage group by route order by opens desc limit 20;
```

Levels: `open` (unrestricted) · `team` (default — all team members) · `admin` (restricted).
`enabled = false` greys the module out in the hub directory.

## 4. Keeping the registry in sync with the code

`App.js` `NAV_GROUPS` is the source of truth. After adding/renaming modules:

```bash
cd frontend
node scripts/generate-module-catalog.js
```

This regenerates:
- `src/data/moduleCatalog.js` — the offline fallback baked into the bundle (commit it), and
- `scripts/module_seed.sql` — an idempotent upsert; run it in the Supabase SQL editor
  (git-ignored; regenerate any time).

Note: 255 nav entries map to **251 unique routes** — 4 routes (`/double-materiality`,
`/climate-policy`, `/just-transition`, `/crrem`) intentionally appear in two nav groups;
the registry is keyed by route.

## 5. Local development

```bash
cd frontend && npm install && npm start        # http://localhost:3000
```
No `.env` needed (defaults reach the team DB). The backend (`backend/`, FastAPI on :8001,
proxied by CRA) is optional — all Sprint-era modules and the Team Access Hub are self-contained
or talk to Supabase directly.

## 6. Security posture & ⚠ open advisory

**New `platform_*` tables** were created with RLS **enabled** and least-privilege policies,
verified end-to-end: anon key can read the registry and insert usage events (`open`/`export`/`error`
only); attempts to insert into the registry, log other event types, or update access flags are denied.

**⚠ Pre-existing advisory (action recommended):** Supabase flags **69 pre-existing tables** in this
project (`dme_*`, `esrs_*`, `repo_*`, `book1_*`, `pcaf_*`, etc.) with **RLS disabled** — anyone with
the anon key can read *and modify* every row of those tables. This predates this change and is not
altered by it, because enabling RLS without adding policies would instantly break the backend engines
and any dashboards reading those tables.

Recommended remediation (run per table, batched by domain, after confirming which services write to them):
```sql
alter table public.<table> enable row level security;
create policy "<table>_read" on public.<table> for select to anon, authenticated using (true);
-- add insert/update policies only for the roles that actually write
```
The full advisory (table list + generated `ALTER TABLE` statements) is in
Supabase → Advisors → Security for the "New App" project.

## 7. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Hub shows "Registry: Fallback" | DB unreachable or env vars point at wrong project — check Deployment & Connectivity tab; app still fully works from the baked-in catalog |
| 404 on a module URL after deploy | SPA rewrite missing — ensure root `vercel.json` is used (repo root as Vercel project root, not `frontend/`) |
| Access change not visible | Client caches nothing, but the page must be reloaded; verify the row in `platform_module_access` |
| Usage events not appearing | RLS only allows events `open`/`export`/`error`; check the browser console for 4xx on `platform_module_usage` |
| Key rotated | Update `REACT_APP_SUPABASE_ANON_KEY` in Vercel env + redeploy, or commit the new default in `supabaseClient.js` |
