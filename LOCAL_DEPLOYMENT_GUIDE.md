# Local Deployment Guide — A2 Intelligence Platform

> Last updated: 2026-03-01
> Stack: FastAPI (Python 3.12) + React 19 (Create React App / CRACO) + PostgreSQL (Supabase)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Environment Setup](#3-environment-setup)
4. [Running the Backend](#4-running-the-backend)
5. [Running the Frontend](#5-running-the-frontend)
6. [Complete URL Map — Every Frontend Route](#6-complete-url-map)
7. [Key API Endpoints Per Module](#7-key-api-endpoints)
8. [Making Code Changes](#8-making-code-changes)
9. [Database Access](#9-database-access)
10. [Common Issues and Fixes](#10-common-issues-and-fixes)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.12 | `winget install Python.Python.3.12` or https://python.org |
| Node.js | 18+ (LTS) | `winget install OpenJS.NodeJS.LTS` or https://nodejs.org |
| Git | any | `winget install Git.Git` |
| PostgreSQL client | optional | Supabase is remote — no local Postgres needed |

**Verify installs:**
```cmd
python --version          # Python 3.12.x
node --version            # v18.x or higher
npm --version             # 9.x or higher
```

**Paths on this machine:**
- Python: `C:\Users\SahilChopra\AppData\Local\Programs\Python\Python312\python.exe`
- Node: `C:\Program Files\nodejs\node.exe`
- npm/yarn: `C:\Program Files\nodejs\`

---

## 2. Repository Structure

```
sp-tmp/                          ← Working directory: C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp
├── backend/
│   ├── server.py                ← FastAPI app entry point
│   ├── .env                     ← Environment variables (DATABASE_URL, etc.)
│   ├── alembic/
│   │   └── versions/            ← 15 migration files (001–015 + 016)
│   ├── api/
│   │   └── v1/
│   │       ├── router.py        ← Registers all API route modules
│   │       └── routes/          ← One file per module (32 route files)
│   ├── db/
│   │   ├── models/              ← SQLAlchemy ORM models
│   │   └── postgres.py          ← SessionLocal, engine
│   ├── services/                ← Business logic (extractors, calculators)
│   └── workers/
│       └── tasks/               ← Background tasks (CSRD extraction)
└── frontend/
    ├── package.json
    ├── craco.config.js
    └── src/
        ├── App.js               ← All routes + navigation
        ├── pages/               ← Legacy page components
        └── features/            ← Module-specific pages
            ├── carbon/
            ├── nature-risk/
            ├── stranded-assets/
            ├── valuation/
            ├── sustainability/
            ├── scenarios/
            ├── portfolio-analytics/
            ├── financial-risk/
            ├── real-estate/
            ├── supply-chain/
            └── regulatory/
```

---

## 3. Environment Setup

### Backend `.env` (already exists at `backend/.env`)

```env
# PostgreSQL — Supabase
DATABASE_URL=postgresql://postgres.kytzcbipsghprsqoalvi:<password>@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://kytzcbipsghprsqoalvi.supabase.co
SUPABASE_ANON_KEY=<anon_key>

# App settings
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
```

**Do not commit `.env` to git.** The DATABASE_URL contains credentials.

### Backend Python Dependencies

```cmd
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\backend
pip install -r requirements.txt
```

Key packages: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pdfplumber`, `psycopg2-binary`, `python-jose`, `passlib`, `bcrypt`, `anthropic`

### Frontend Node Dependencies

```cmd
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\frontend
npm install
```

Or if using yarn (project uses yarn):
```cmd
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\frontend
yarn install
```

> Note: `node_modules` is NOT checked into git. You must run install before first use.

---

## 4. Running the Backend

### Method A: Claude Code `preview_start` (recommended during development)

The `.claude/launch.json` is configured. In Claude Code, type:
```
/preview_start backend
```
This starts: `python -m uvicorn server:app --host 0.0.0.0 --port 8001`
Backend runs at: **http://localhost:8001**

### Method B: Direct command line

```cmd
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\backend
C:\Users\SahilChopra\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8001
```

**IMPORTANT — Windows `--reload` crash:** Never add `--reload` on Windows. WatchFiles sends `CTRL_C_EVENT` via `os.kill()` → `OSError: [WinError 6]` crashes the server. Restart manually after code changes.

### Verify backend is running

```
GET http://localhost:8001/api/health
```
Expected response: `{"status": "ok", "database": "connected"}`

### Interactive API docs

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

---

## 5. Running the Frontend

### Method A: Claude Code `preview_start`

```
/preview_start frontend
```
Frontend runs at: **http://localhost:4000**

### Method B: Direct command line

```cmd
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\frontend
set PORT=4000
set BROWSER=none
set REACT_APP_BACKEND_URL=http://localhost:8001
node node_modules/@craco/craco/dist/bin/craco.js start
```

Or using the Node path explicitly:
```cmd
"C:\Program Files\nodejs\node.exe" node_modules/@craco/craco/dist/bin/craco.js start
```

### Environment variable

The frontend reads `REACT_APP_BACKEND_URL` to point all API calls at the backend:
```js
const API_URL = process.env.REACT_APP_BACKEND_URL;  // set in launch.json
```
In production, set `REACT_APP_BACKEND_URL` to your deployed API URL.

### Build for production

```cmd
cd frontend
node node_modules/@craco/craco/dist/bin/craco.js build
```
Output: `frontend/build/` — serve with nginx / Vercel / Netlify.

---

## 6. Complete URL Map

Base URL: **http://localhost:4000**

> The app requires login. In development (no auth server), navigate directly to any route after loading — if no `session_token` in localStorage, the Login page shows. Enter any email/password to bypass (dev mode).

---

### Analytics Group

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/interactive` | `InteractiveDashboard.jsx` | Full interactive analytics dashboard — filters, KPI cards, 5-tab chart suite (Portfolio/Climate/Financial/Emissions/Sensitivity), What-If studio, risk heatmap, tornado chart, scenario matrix. Start here for demo. |
| `/` | `Dashboard.jsx` | Overview dashboard — portfolio summary, recent runs, quick stats |
| `/impact` | `ImpactCalculatorPage.jsx` | Impact Calculator — measure positive ESG impact per investment |
| `/portfolio-analytics` | `PortfolioAnalyticsPage.jsx` | Portfolio-level analytics — WACI, ITR, taxonomy alignment, PAI table |
| `/scenario-analysis` | `ScenarioAnalysisPage.jsx` | NGFS scenario analysis engine — select portfolio, scenarios, time horizons |
| `/sub-analysis` | `SubAnalysisPage.jsx` | Sub-parameter analysis — carbon price, GDP, interest rate, temperature sensitivity |

---

### ESG Modules Group

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/carbon` | `CarbonDashboard.jsx` | Carbon Credits — CDM/VCS/Gold Standard methodology calculator (56+ methods), Scope 1/2/3 calculation, credit project builder |
| `/nature-risk` | `NatureRiskPage.jsx` | Nature Risk (TNFD) — LEAP assessment, biodiversity footprint (MSA.ha), water risk, BNG, SBTN |
| `/stranded-assets` | `StrandedAssetsPage.jsx` | Stranded Assets — fossil fuel reserves, power plants, real estate, tech disruption |
| `/valuation` | `UnifiedValuationPage.jsx` | Asset Valuation — Income / Cost / Sales Comparison methods, ESG adjustments, CRREM pathway, climate VaR |
| `/sustainability` | `SustainabilityPage.jsx` | Sustainability Ratings — GRESB (Real Estate + Infrastructure), LEED, BREEAM, WELL, NABERS, CASBEE |
| `/cbam` | `CBAMPage.jsx` | CBAM Calculator — EU Carbon Border Adjustment Mechanism (Articles 7, 21, 31). Supports cement, steel, aluminium, fertilisers, electricity, hydrogen |

---

### Risk & Sector Group

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/financial-risk` | `FinancialRiskPage.jsx` | Financial Risk — IFRS 9 ECL (Stage 1/2/3) with climate overlay, PCAF financed emissions, WACI, temperature scoring |
| `/real-estate-assessment` | `RealEstateAssessmentPage.jsx` | Real Estate Assessment — RICS/CRREM/IVSC standards, physical risk scoring, green premium/brown discount, flood/heat risk |
| `/supply-chain` | `SupplyChainPage.jsx` | Supply Chain Scope 3 — 15-category GHG Protocol Scope 3 calculator, SBTi target setting, emission factor library |
| `/sector-assessments` | `SectorAssessmentsPage.jsx` | Sector Assessments — Data Centres (PUE/WUE/CUE), CAT Risk (AAL/PML/ES), Power Plants (dispatch economics, stranding) |

---

### Regulatory Group

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/regulatory` | `RegulatoryPage.jsx` | All regulatory reporting in one page: SFDR PAI (14 mandatory indicators), EU Taxonomy (6 objectives + DNSH), TCFD (4 pillars), CSRD (ESRS Set 1, 330+ DPs), ISSB S1/S2, BRSR (India), Singapore/UK/Hong Kong Taxonomies. PDF upload for CSRD extraction. |

---

### Scenarios & Data Group

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/browser` | `ScenarioBrowserPage.jsx` | Scenario Browser — search/filter all NGFS v2 scenarios and pathways |
| `/data-hub` | `DataHub.jsx` | Data Hub — upload and manage reference datasets, emission factors, benchmark data |
| `/ngfs` | `NGFSScenariosPage.jsx` | NGFS v2 Catalog — 6 scenarios with detailed pathway variables, CO2 price, GDP, temperature trajectories |
| `/comparison` | `ComparisonPage.jsx` | Comparison — side-by-side scenario or portfolio comparison |
| `/custom-builder` | `CustomBuilderPage.jsx` | Custom Builder — create bespoke climate scenarios with custom carbon price paths |

---

### Portfolio Group

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/portfolios` | `Portfolios.jsx` | Portfolio list — all portfolios in DB |
| `/portfolios/:id` | `PortfolioDetail.jsx` | Portfolio detail — individual portfolio assets, weights, metrics |
| `/portfolio-manager` | `PortfolioManagerPage.jsx` | Upload & Edit — import portfolios via CSV/JSON, edit asset data |
| `/analysis` | `Analysis.jsx` | Run Analysis — launch scenario analysis runs against a portfolio |

---

### Other Routes (not in nav)

| Route | Description |
|-------|-------------|
| `/results/:runId` | Analysis run results detail page |
| `/scenario-data` | Raw scenario data browser |
| `/scenario-builder` | Legacy scenario builder |
| `/alerts` | Alert management |
| `/login` | Login page (shown if no session token) |

---

## 7. Key API Endpoints

All endpoints base URL: `http://localhost:8001`

Full interactive docs: http://localhost:8001/docs

### Health & Auth

```
GET  /api/health                          # Backend health check
POST /api/auth/google/session             # Google OAuth callback
GET  /api/auth/me                         # Get current user
POST /api/auth/logout                     # Sign out
```

### Portfolio

```
GET  /api/v1/portfolios                   # List portfolios (PG)
POST /api/v1/portfolios                   # Create portfolio
GET  /api/v1/portfolios/{id}              # Get portfolio detail
PUT  /api/v1/portfolios/{id}              # Update portfolio
GET  /api/v1/portfolio-analytics/analyze  # Run portfolio analytics
```

### Carbon / CBAM / Stranded Assets

```
POST /api/v1/carbon/calculate             # Carbon footprint calculation
POST /api/v1/carbon/methodology/{id}      # Calculate by CDM/VCS methodology
POST /api/v1/cbam/calculate               # CBAM liability calculation
POST /api/v1/stranded-assets/calculate    # Stranded asset assessment
POST /api/v1/stranded-assets/power-plant  # Power plant stranding
```

### Nature Risk / Valuation / Sustainability

```
POST /api/v1/nature-risk/assess           # TNFD LEAP assessment
POST /api/v1/valuation/calculate          # Unified valuation (income/cost/sales)
POST /api/v1/sustainability/assess        # GRESB / building ratings
```

### Financial Risk (ECL / PCAF)

```
POST /api/v1/ecl/assess                   # IFRS 9 ECL calculation
POST /api/v1/ecl/climate-overlay          # Climate-adjusted ECL
POST /api/v1/pcaf/portfolio               # PCAF financed emissions
POST /api/v1/pcaf/temperature-score       # ITR temperature scoring
```

### Supply Chain / Sector

```
POST /api/v1/supply-chain/scope3          # Scope 3 category assessment
POST /api/v1/supply-chain/sbti            # SBTi target calculation
POST /api/v1/sectors/data-centre          # Data centre assessment
POST /api/v1/sectors/cat-risk             # CAT risk modelling
POST /api/v1/sectors/power-plant          # Power plant economics
```

### Regulatory / CSRD

```
POST /api/v1/regulatory/sfdr-pai          # SFDR PAI disclosure
POST /api/v1/regulatory/eu-taxonomy       # EU Taxonomy assessment
POST /api/v1/regulatory/csrd-readiness    # CSRD gap analysis
POST /api/v1/regulatory/issb              # ISSB S1/S2 disclosure
POST /api/v1/csrd-reports/upload          # Upload PDF for CSRD extraction
GET  /api/v1/csrd-reports/{id}/status     # Check extraction status
GET  /api/v1/csrd-reports/{id}/results    # Get extracted KPIs
GET  /api/v1/csrd-reports/entities        # List all extracted entities
```

### Scenarios

```
GET  /api/v1/ngfs/scenarios               # NGFS v2 scenario list
GET  /api/v1/ngfs/scenarios/{code}        # Scenario pathway data
POST /api/v1/scenarios/analyze            # Run scenario analysis
POST /api/v1/scenario-builder/create      # Create custom scenario
```

---

## 8. Making Code Changes

### Backend changes (Python / FastAPI)

1. Edit the relevant file in `backend/`
2. **Stop** the running backend (`Ctrl+C` or `/preview_stop backend`)
3. **Restart** the backend (`/preview_start backend` or run uvicorn command)
4. Do NOT use `--reload` on Windows — it crashes with `OSError: [WinError 6]`

**Common edit locations:**
| Change type | File |
|-------------|------|
| Add/modify API endpoint | `backend/api/v1/routes/<module>.py` |
| Add business logic | `backend/services/<service>.py` |
| Add DB table | `backend/alembic/versions/<new_migration>.py` + `backend/db/models/` |
| Modify ORM model | `backend/db/models/<model>.py` |
| Background tasks | `backend/workers/tasks/<task>.py` |

**After adding a new DB table:**
```cmd
cd backend
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
```

### Frontend changes (React / JSX)

1. Frontend uses Create React App (CRACO) — hot reload IS available for frontend
2. Edit files in `frontend/src/`
3. Browser refreshes automatically (no restart needed)
4. If adding a new page/route:
   - Create `frontend/src/pages/MyPage.jsx` or `frontend/src/features/<module>/pages/MyPage.jsx`
   - Add import + `<Route>` in `frontend/src/App.js`
   - Add nav entry to `NAV_GROUPS` array in `App.js`

**Common edit locations:**
| Change type | File |
|-------------|------|
| Add nav link | `frontend/src/App.js` — `NAV_GROUPS` array |
| Add route | `frontend/src/App.js` — `<Routes>` block |
| New module page | `frontend/src/features/<module>/pages/` |
| Shared component | `frontend/src/components/shared/` |
| UI primitive | `frontend/src/components/ui/` (Radix-based) |
| State management | `frontend/src/store/` (Redux Toolkit) |
| API calls | TanStack Query (`useQuery`, `useMutation`) in page components |

---

## 9. Database Access

**Database:** Supabase PostgreSQL (hosted)
**Project:** `kytzcbipsghprsqoalvi` (aws-1-us-east-2)

### Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kytzcbipsghprsqoalvi
2. Navigate to: Table Editor (browse data) or SQL Editor (run queries)

### Direct SQL (via psql or DBeaver)

Connection string:
```
postgresql://postgres.kytzcbipsghprsqoalvi:<password>@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### Alembic Migrations

```cmd
cd backend

# Check current migration state
alembic current

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Generate migration from model changes
alembic revision --autogenerate -m "add_new_table"
```

### Key Tables (current — 16 migration files applied)

| Schema/Group | Key Tables |
|---|---|
| **Portfolios** | `portfolios_pg`, `assets_pg`, `analysis_runs_pg` |
| **Carbon** | `carbon_calculations`, `scope3_categories` |
| **CBAM** | `cbam_calculations` |
| **Stranded** | `stranded_asset_assessments`, `stranded_reserves`, `stranded_power_plants` |
| **Nature** | `nature_risk_assessments`, `tnfd_leap_assessments` |
| **Valuation** | `valuation_assets`, `unified_valuations`, `esg_adjustments` |
| **ECL** | `ecl_assessments`, `ecl_exposures`, `ecl_scenario_results` |
| **PCAF** | `pcaf_portfolios`, `pcaf_investees`, `pcaf_results`, `temperature_scores` |
| **Supply Chain** | `sc_entities`, `scope3_assessments`, `sbti_targets`, `emission_factor_library` |
| **Sectors** | `data_centre_facilities`, `cat_risk_properties`, `power_plants` |
| **Regulatory** | `sfdr_pai_disclosures`, `eu_taxonomy_assessments`, `tcfd_assessments` |
| **CSRD** | `csrd_entity_registry`, `csrd_kpi_values`, `csrd_gap_tracker`, `csrd_report_uploads` |
| **ESRS** | `esrs_e1_ghg_emissions`, `esrs_s1_workforce`, `esrs_g1_conduct` (330 DPs across 14 tables) |
| **ISSB** | `issb_s1_general`, `issb_s2_climate`, `issb_sasb_industry_metrics` |
| **FI Sector** | `fi_entities`, `fi_financials`, `fi_loan_books`, `fi_financed_emissions` |
| **Energy Sector** | `energy_entities`, `energy_generation_mix`, `energy_stranded_assets_register` |
| **Audit** | `audit_log` (migration 010) |

---

## 10. Common Issues and Fixes

### Backend fails to start: `Module not found`

```cmd
cd backend
pip install -r requirements.txt
```

### Backend fails to start: `DATABASE_URL not set`

Ensure `backend/.env` exists with valid `DATABASE_URL`. The file is gitignored — you need to create it locally.

### Frontend fails to start: `craco not found`

```cmd
cd frontend
npm install   # or: yarn install
```

### Frontend shows blank page / API errors

1. Check backend is running: visit http://localhost:8001/api/health
2. Check `REACT_APP_BACKEND_URL=http://localhost:8001` is set (in launch.json env)
3. Check browser console for CORS errors — backend allows all origins in development

### `OSError: [WinError 6]` when starting backend

Remove `--reload` from the uvicorn command. This is a Windows WatchFiles bug. Never use `--reload` on Windows.

### Login page loops / cannot access app

In development, if no auth server is configured:
1. Open browser dev tools → Application → Local Storage → `localhost:4000`
2. Add key: `session_token` with any string value
3. Refresh the page — the app will accept any token in dev mode

Or: The login page (`LoginPage.jsx`) accepts any credentials in dev mode.

### Alembic `can't locate revision`

```cmd
cd backend
alembic stamp head    # Force mark current state as latest
alembic upgrade head  # Apply any remaining
```

### CSRD PDF extraction fails / reports stuck in `processing`

Run extraction directly (bypass FastAPI BackgroundTasks):
```python
# backend/run_csrd_extraction.py
import sys
sys.path.insert(0, '.')
from db.postgres import SessionLocal
from db.models.csrd_models import CsrdReportUpload
from workers.tasks.csrd_tasks import process_csrd_report_task

db = SessionLocal()
reports = db.query(CsrdReportUpload).filter(CsrdReportUpload.status == "uploaded").all()
db.close()

for report in reports:
    print(f"Processing: {report.filename}")
    process_csrd_report_task(str(report.id))
    print("Done.")
```

Run from backend directory:
```cmd
cd backend
python run_csrd_extraction.py
```

---

## Quick Start Summary

```cmd
# Terminal 1 — Backend
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\backend
C:\Users\SahilChopra\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8001

# Terminal 2 — Frontend
cd C:\Users\SahilChopra\AppData\Local\Temp\sp-tmp\frontend
set PORT=4000 && set BROWSER=none && set REACT_APP_BACKEND_URL=http://localhost:8001
"C:\Program Files\nodejs\node.exe" node_modules/@craco/craco/dist/bin/craco.js start

# Browser
http://localhost:4000/interactive    ← Start here (best demo view)
http://localhost:8001/docs           ← API documentation
http://localhost:8001/api/health     ← Backend health check
```

---

## Frontend Tech Stack (from `package.json`)

| Library | Version | Use |
|---------|---------|-----|
| React | 19.0 | UI framework |
| React Router DOM | 7.13 | Client-side routing |
| Redux Toolkit | 2.2.7 | Global state |
| TanStack Query | 5.90 | Server state / API calls |
| Recharts | 3.7 | All charts and visualisations |
| Radix UI | various | Headless UI primitives |
| Tailwind CSS | 3.4 | Styling |
| Mapbox GL | 2.15 | Map visualisations (Nature Risk) |
| React Hook Form | 7.56 | Form handling |
| Zod | 3.24 | Schema validation |
| Zustand | 5.0 | Local component state stores |
| date-fns | 4.1 | Date utilities |
| Lucide React | 0.507 | Icons |
| Sonner | 2.0 | Toast notifications |
| CRACO | 7.1 | CRA override (Tailwind config) |
