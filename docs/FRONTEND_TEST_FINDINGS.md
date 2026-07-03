# A² Intelligence — Frontend Render/Health Test Findings

_In-browser sweep of all **805 static routes** against the live backend (`:8001`, on the
fixed deps). Per route captured: render success (root content), console + React errors,
uncaught window errors, and failed XHR/fetch (HTTP ≥ 400)._

## Headline result

**805 / 805 routes rendered — 0 crashes, 0 blank pages.** Every module mounts and renders
content under the redesigned shell. Only **6 routes** flagged any issue, and only **1** is a
real runtime error.

| Outcome | Count |
|---|---|
| Rendered content | **805 / 805** |
| Routes with console/React error | 4 |
| Routes with failed API call | 2 |
| Blank / crashed | **0** |

## Corrections (real frontend bugs)

### C-FE1 · P1 · Uncaught TypeError on `/re-portfolio-dashboard`
`Cannot read properties of undefined (reading 'includes')`
Root cause: `features/re-portfolio-dashboard/pages/REPortfolioDashboardPage.jsx:184`
```js
props.filter(p => p.regulation.includes(r))   // p.regulation is undefined for some property
```
The page assumes every property has a `regulation` field. **Fix:** null-guard both filters on
that line — `(p.regulation || '').includes(r)` (or `|| []` if it's an array). Page still rendered,
but the throw breaks the `regulations` memo / that section.

### C-FE2 · P3 · React key warnings (3 pages)
Non-unique or missing `key` props when rendering lists:
- `sector-benchmarking` — "two children with the same key"
- `client-report` → `ClientReportPage`
- `regulatory-calendar` → `RegulatoryCalendarPage`

**Fix:** give each mapped child a stable, unique `key` (id/code, not index or a repeated value).
Cosmetic in dev, but unstable keys can cause subtle reorder/duplication bugs.

## Observations (expected — not frontend bugs)

### O-FE1 · Admin endpoints 401 on `/admin` and `/module-navigator`
`GET /api/admin/users`, `/api/admin/modules/status`, `/api/admin/presets`,
`/api/admin/refinement/assignments` → **401**. The dev auto-auth session isn't an authorized
admin, so the admin API correctly rejects it. Not a render bug; the pages still render (with
empty/guarded admin data). Verify these are gated behind real RBAC in production.

## Methodology & scope caveats

- **What it covers:** mount-time render health + load-time API calls for every static route,
  against the real backend. Catches import/chunk errors, render-time exceptions, React warnings,
  and failed initial API requests.
- **What it does NOT cover:** user interactions (clicks, form input, tab switches), late-arriving
  async errors after the ~35 ms per-route settle, and routes with path params (`/x/:id`) which
  were excluded (805 of 809 routes are static and were tested).
- **Backend dependency:** run with `:8001` healthy (post dep-pin). Most pages' API calls
  succeeded — only the admin-auth 401s surfaced — which both confirms the backend fix and means
  the frontend is largely resilient to its data source.

## Re-run
The sweep harness is an in-page script driven via the preview tools (no install). Route list:
`frontend/public/__sweep_routes.json` (temporary — safe to delete). To re-run, re-inject the
harness and drive `window.__ROUTES__` in batches (see session notes).
