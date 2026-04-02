# Session Handoff — Risk Analytics / Sustainability Platform

> **How to use this file:** Open this folder in Claude Code, then say:
> _"Read HANDOFF.md and resume the session from where we left off."_

---

## Identity & Repository

| Key | Value |
|-----|-------|
| **Repo** | `sahilchopra-design/sustainability-platform-v2` (Private) |
| **Active branch** | `remediation-v1` |
| **Main branch** | `main` |
| **Branch is** | 71 commits ahead of `main` |
| **Last commit** | `c7ec5a9` — Chore: remove tracked __pycache__ files, add @tanstack/react-query deps |
| **Working dir** | `C:\Users\SahilChopra\Documents\Risk Analytics` |

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI (Python 3.12), SQLAlchemy, Alembic |
| Frontend | React 18 + react-scripts (CRA), Recharts, Axios, **@tanstack/react-query v5** |
| Database | PostgreSQL via Supabase |
| Node | `/c/Program Files/nodejs/node.exe` — node_modules NOT in frontend dir, they're at repo root level |
| Auth (dev) | `REQUIRE_AUTH=false` in `.env` — AuditMiddleware always on |

---

## Platform Scale

| Metric | Count |
|--------|-------|
| Routed frontend modules | ~270+ (App.js routes) |
| Frontend feature dirs | 343 |
| Backend service files | 293 |
| Nav domains | 43 |
| Alembic migrations | 001–087 (codebase), ~060 applied to Supabase |
| Bundle size | ~3.63 MB gzipped |

---

## Critical Rules — Read Before Touching Anything

1. **DB table:** Always use `portfolios_pg` (model `PortfolioPG`). The `portfolios` table (`PortfolioSQL`) is **EMPTY** — do not use it.
2. **Node path:** `/c/Program Files/nodejs/node.exe` — run builds as `"/c/Program Files/nodejs/node.exe" node_modules/react-scripts/bin/react-scripts.js build`
3. **Auth:** `REQUIRE_AUTH=false` in dev. `require_role()` lives in `backend/api/dependencies.py`.
4. **Demo banner:** `frontend/src/components/GlobalDemoBanner.jsx` — amber sticky banner, dismiss with `D` key. Shown when `isFallback` or `!apiReachable`.
5. **No random data:** All generated data uses seed-based deterministic functions (`sr()` seeded random) — no `Math.random()`.
6. **App.js pattern:** Every new module needs 4 additions: import, `<Route>`, navConfig entry, ROUTE_TITLES entry.
7. **Alembic:** Migrations 001–087 exist in code. Only ~060 applied to Supabase. Do not blindly run `upgrade head` — generate SQL first and review.

---

## Theme Object (T)

Defined in `frontend/src/styles/theme.js` (or inline in some pages):

```js
// Fonts
DM Sans (body) + JetBrains Mono (data/monospace) — Google Fonts

// Key colors
navy: '#0f172a'      // primary dark
navyD: '#0a0f1e'     // deeper navy
gold: '#d4a853'      // accent / active
goldD: '#b8922f'     // darker gold
cream: '#f8f6f0'     // background
teal: '#0e7490'      // transition planning nav group
amber: '#b45309'     // ESG ratings nav group
green: '#059669'     // decarbonisation nav group
purple: '#7c3aed'    // regulatory nav group
red: '#dc2626'
mono: 'JetBrains Mono, monospace'
```

---

## Shell Layout (Bloomberg-tier redesign)

- **Header:** 44px, gold gradient accent line (2px), monospace breadcrumbs, live 24h clock
- **Sidebar:** 252px, gold left-border on active item, search box with result counter
- **Status bar:** 24px, full monospace, pipe delimiters, pulsing CONNECTED dot
- **Dashboard:** "Platform Command Center", 6-col KPI strip with deltas, domain filter chips

---

## Sprint History (Sprints A → AX)

| Sprint | Theme | Modules |
|--------|-------|---------|
| A–J | Core platform (carbon calc, CBAM, ECL, RE, portfolio, supply chain, regulatory) | ~60 |
| K | Supply Chain & Scope 3 | 6 |
| L | Private Markets (PE/VC) | 6 |
| M | Nature & Biodiversity (TNFD LEAP) | 6 |
| N | Social & Human Capital | 6 |
| O | Sovereign & Macro ESG | 6 |
| P | Data Infrastructure & Live Feeds | 6 |
| Q | Taxonomy & Classification | 6 |
| R | Client & Reporting Automation | 6 |
| S | Data Management Engine | 6 |
| T | Dynamic Materiality Engine | 6 |
| U | DME Platform + Backend Engines | 9 |
| V | Governance & Audit Trail | 8 |
| W | AI & NLP Analytics | 6 |
| X | Impact Measurement & SDG Finance | 6 |
| Y | Commodity Lifecycle Intelligence | 10 |
| Z | Consumer Carbon Intelligence | 6 |
| AA | Climate Finance Architecture | 6 |
| AB | Macro & Systemic Risk Intelligence | 6 |
| AC | Nature, Environment & Physical Risk | 6 |
| AD | Social & Just Transition | 6 |
| AE | Corporate Governance & Executive Intelligence | 6 |
| AF | Quantitative ESG & Portfolio Intelligence | 6 |
| AG | Private Markets & Alternative Credit ESG | 6 |
| AH | Regulatory Reporting & Disclosure Automation | 6 |
| AI | Corporate Decarbonisation & SBTi Intelligence | 6 |
| AJ | Financed Emissions & Climate Banking Analytics | 6 |
| AK | ESG Ratings Intelligence & Provider Analytics | 6 |
| AL | Transition Planning & Net Zero Alignment Intelligence | 6 |
| AM | Climate Fintech & Digital MRV Intelligence | 6 |
| AN | Sustainable Transport & Logistics Decarbonisation | 6 |
| AO | Scope 4 / Avoided Emissions & Climate Solutions | 6 |
| AP | Supply Chain ESG & Scope 3 Value Chain Intelligence | 6 |
| AQ | Sovereign ESG & Country-Level Climate Risk Intelligence | 6 |
| AR | Insurance Climate Risk | 6 |
| AS | Real Estate Climate | 6 |
| AT | Agriculture ESG | 6 |
| AU | Climate & Health Nexus Finance | 6 |
| AV | Geopolitical Risk & Climate Security Intelligence | 6 |
| AW | Impact Measurement & SDG Alignment Intelligence | 6 |
| AX | Sovereign & Country Climate Risk Intelligence | 6 |

**Next sprint: AY**

---

## Work Done on `remediation-v1` Branch (key commits)

```
c7ec5a9  Chore: remove __pycache__ from git + add @tanstack/react-query v5
53a4987  Fix: 3 case-sensitivity import errors in App.js
068b3cb  Sprint AX: Sovereign & Country Climate Risk Intelligence (6 modules)
0fc5e3f  P1: Repair Alembic migration chain + generate Supabase upgrade SQL
37d757e  P0: Auth/RBAC — wire Depends(get_current_user) to 6 highest-value routes
ce648e8  ENH-015/017/029 CLOSED: 34/34 backlog items complete (100%)
becaec5  Remediation v1: 48-module interactivity uplift & code quality pass
```

---

## Alembic Migrations State

- **Codebase head:** `087_add_e116_e119_tables.py`
- **Applied to Supabase:** ~migration 060 (uk_sdr tables)
- **Migrations 061–087** exist in code but have NOT been applied to Supabase yet
- To apply: generate SQL first (`alembic upgrade <rev> --sql`), review, then apply via Supabase SQL editor

### E-series engine migrations map
| Migration | Tables |
|-----------|--------|
| 061 | E12–E15 |
| 062 | E16–E19 |
| 063 | E20–E23 (EBA Pillar 3 ESG T1–T10) |
| 064 | E24–E27 |
| 065 | E28–E31 |
| 066 | E32–E35 |
| 067 | E36–E39 (prior codebase head) |
| 068–087 | E40–E119 |

---

## Backend Engines (backend/services/)

Core engines: `carbon_calculator`, `cbam_calculator`, `stranded_asset_calculator`, `nature_risk`, `real_estate_valuation`, `scenario_analysis`, `pd_calculator`, `methodology_engine` (56+ methodologies), `sustainability_calculator`, `portfolio_analytics_v2`, `facilitated_emissions_engine`, `insurance_emissions_engine`, `factor_overlay_engine`, `eudr_engine`, `csddd_engine`, `sovereign_climate_risk_engine`, `am_engine`, `agriculture_risk_engine`, `lineage_orchestrator`

E-series engines: `e6.py` through `e119.py` (Stewardship → full regulatory suite)

---

## Frontend Page Pattern

```jsx
// File: frontend/src/features/<slug>/pages/<Name>Page.jsx
// App.js additions needed for every new page:

// 1. Import (top of file)
import FooPage from './features/foo/pages/FooPage';

// 2. Route (inside <Routes>)
<Route path="/foo" element={<FooPage />} />

// 3. Nav item (in navConfig array)
{ label: 'Foo Label', path: '/foo', group: 'GroupName' }

// 4. ROUTE_TITLES
'/foo': 'Foo Label',
```

Each page uses:
- `useState` for local state, no Redux
- Recharts (`BarChart`, `LineChart`, `AreaChart`, `PieChart`, `RadarChart`)
- Deterministic seed data (`sr()` function)
- Tab bar at top switching between sub-views
- `Section`, `KpiCard`, `Row`, `Inp`, `Sel`, `Btn` primitives

---

## Known Open Gaps / Next Work

### Technical debt
- **P0-4:** No cross-module FK linkage enforced (migration 042 partial)
- **P0-6:** No TimescaleDB time-series architecture
- **Migrations 061–087:** Not yet applied to Supabase — need SQL review + apply
- **`scan_low.js` / `tmp_scan.js`** in `frontend/src/` — temp analysis scripts, not committed, can be deleted

### Reference data still missing
- WHO mortality data
- NatCat loss data
- IPCC AR6 damage functions
- Basel III NSFR/LCR
- FATF AML data
- FAO crop yield data

### @tanstack/react-query v5
- Added to `package.json` in last commit but **not yet wired up** in the app
- `QueryClient` / `QueryClientProvider` not yet added to `App.js` or `index.js`

---

## How to Start the Dev Server

```bash
# Backend (from repo root)
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (from repo root — node_modules are at root, not inside frontend/)
"/c/Program Files/nodejs/node.exe" node_modules/react-scripts/bin/react-scripts.js start
# OR from frontend/ dir:
cd frontend && "/c/Program Files/nodejs/node.exe" ../node_modules/react-scripts/bin/react-scripts.js start
```

---

## Git Workflow

```bash
# Current branch
git checkout remediation-v1

# Push (already tracked)
git push

# Create PR to main when ready
# (gh CLI not installed — use GitHub web UI)
# URL: https://github.com/sahilchopra-design/sustainability-platform-v2/compare/main...remediation-v1
```

---

## Memory Files (auto-memory system)

Full memory is stored in:
`C:\Users\SahilChopra\.claude\projects\C--Users-SahilChopra-Documents-Risk-Analytics\memory\`

Key files:
- `MEMORY.md` — index
- `sprints_index.md` — all sprints A–AX
- `platform_state.md` — backend engines, migrations, DB schema
- `frontend_conventions.md` — React patterns, theme, routing
- `project_2026-03-28_session.md` — UI redesign + AJ/AK/AL sprint details

---

## The Plan — What Comes Next

> Full plan docs: `PLAN_STATUS.md`, `WORK_PLAN.md`, `FUNCTIONAL_GAPS_AND_PLAN.md`, `IMPLEMENTATION_PLAN_V2.md`

### Priority 0 — Infrastructure (blocking production / demo)

| # | Task | Status | Notes |
|---|------|--------|-------|
| P0-1 | Auth/RBAC enforcement on write routes | ⚠️ Partial | `Depends(get_current_user)` wired to 6 route groups on `remediation-v1`. Still many unprotected write endpoints. Full sweep needed. |
| P0-2 | Frontend build passes (`npm run build`) | ❓ Not verified | Must pass clean before any PR to main |
| P0-3 | Backend startup clean (no import errors) | ❓ Not verified | Run `uvicorn backend.main:app` and check for 500s / import failures |
| P0-4 | Migration chain gap at revision 020 | ⚠️ Open | Alembic chain jumps 019 → 021. Add or verify missing revision. |
| P0-5 | Apply migrations 061–087 to Supabase | ❌ Not done | Generate SQL with `--sql` flag, review, apply via Supabase SQL editor |

### Priority 1 — Frontend Coverage (new engines have no UI)

These backend engines are complete but have zero frontend panels. Build in sprint order:

| # | Engine | Sprint target | Nav group |
|---|--------|---------------|-----------|
| F-1 | EUDR Engine | Sprint AY | "Regulatory" |
| F-2 | CSDDD Engine | Sprint AY | "Regulatory" |
| F-3 | Entity 360 (cross-module unified view) | Sprint AY | "Analytics" |
| F-4 | Double Materiality workshop UI (ESRS VSME) | Sprint AZ | "ESG" |
| F-5 | SFDR PAI full disclosure dashboard | Sprint AZ | "Regulatory" |
| F-6 | XBRL Export wizard | Sprint AZ | "Regulatory" |
| F-7 | Sovereign Climate Risk panel | Sprint BA | "Risk & Macro" |
| F-8 | SEC Climate Disclosure panel | Sprint BA | "Regulatory" |
| F-9 | PE Deal Pipeline + Fund Structure UI | Sprint BB | "Private Markets" |
| F-10 | Technology Risk panel | Sprint BB | "Risk & Sector" |
| F-11 | Residential RE assessment panel | Sprint BC | "Real Estate" |
| F-12 | XBRL Ingestion filing import workflow | Sprint BC | "Data" |

**~12 sprint-modules of frontend work outstanding for existing engines.**

### Priority 2 — @tanstack/react-query Wiring

`@tanstack/react-query` v5 was added to `package.json` but **not wired up yet**.

Steps:
1. Add `QueryClient` + `QueryClientProvider` to `frontend/src/index.js`
2. Optionally add `ReactQueryDevtools` to `App.js` (dev only)
3. Migrate the highest-traffic data fetching hooks (portfolio, dashboard) to `useQuery`

```jsx
// index.js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

### Priority 3 — Data Hub Ingesters

The Data Hub scaffold exists (54 files). The actual ingestion runners do not exist yet.
Build order (each is ~M effort, 1 session per 3–4 ingesters):

```
BaseIngester + APScheduler → GLEIF LEI → OWID CO2 → yfinance EVIC
→ SBTi Registry → Climate TRACE → Sanctions (OFAC/EU/UN)
→ WDPA + GFW spatial → SEC EDGAR XBRL → GDELT BigQuery
```

### Priority 4 — Infrastructure / Production Readiness

| Task | Notes |
|------|-------|
| CI/CD pipeline (GitHub Actions) | Lint → test → build on PR |
| Sentry / APM error monitoring | Wire to FastAPI middleware |
| Celery/RQ task queue | Replace synchronous PDF extraction |
| PostGIS spatial queries | `spatial_hazard_service.py` needs `ST_Within`/`ST_Intersects` |
| Multi-tenancy `org_id` FK audit | Ensure `org_id` on all core tables |
| TimescaleDB time-series | `migration 018` exists; services don't use it yet |

### Session Efficiency Rules (from WORK_PLAN.md)

1. **One theme per session** — don't mix backend engine work with frontend restyling
2. **Cap at 8–10 file creates OR 5–6 large file edits per session**
3. **Migrations are cheap** — batch multiple together
4. **Frontend components are expensive** — JSX files 400–1000+ lines; limit 3–4 per session
5. **Always commit at end of session**
6. **Read only what you need** — don't read 2000-line files to edit 20 lines

### Platform Completeness Estimates (as of 2026-04-02)

| Layer | Completeness |
|-------|-------------|
| Backend engines | ~95% |
| API routes | ~90% |
| Frontend modules | ~270+ routed, but ~12 new engines lack any UI |
| Migrations applied to Supabase | ~69% (001–060 of 087) |
| Auth/RBAC enforcement | ~30% of routes |
| Production readiness | ~50% |

---

*Generated: 2026-04-02 | Branch: remediation-v1 | Commit: c7ec5a9*
