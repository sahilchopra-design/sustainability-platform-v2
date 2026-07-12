# A² Intelligence Platform — Multi-Dimensional Project Overview

*Snapshot date: 2026-07-06 · branch `remediation-v1` · all counts measured live, not estimated.*

---

## 1 · What this is

A² Intelligence (AA Impact Inc.) is a **sustainability-and-risk analytics platform**: a
single-page React application backed by a FastAPI monolith, delivering ~850 routed
analytical modules across 26 sectors — climate risk, carbon markets, energy & power
finance, regulatory disclosure, supply chain, manufacturing decarbonization, sovereign
risk, insurance/catastrophe, real estate, nature & biodiversity, and the capital-markets
instruments that connect them. It is a *calculation platform*, not a dashboard veneer:
293 backend quantitative engines implement named methodologies (PCAF, NGFS, Basel III,
Solvency II, EU Taxonomy, CBAM, TCFD/ISSB, FRTB, XVA) against a 584-table PostgreSQL
database populated by 19 real-data ingesters.

**Core design creed (enforced, not aspirational):** no fabricated data. Every number
shown is either computed by a real engine, ingested from a named public source, or
explicitly labeled as seeded/demo. A CI-gated guardrail
(`backend/tools/check_no_fabricated_random.py`) fails the build if random-number
generation masquerades as data anywhere in the backend.

---

## 2 · Dimension: Inventory (measured 2026-07-06)

| Asset | Count | Where |
|---|---|---|
| Frontend feature modules | 853 dirs / 852 routed | `frontend/src/features/*` |
| Atlas-documented modules (incl. backend-only domains) | 999 records | `docs/module_atlas/atlas.json` |
| Sector-tagged modules | 992 across 26 sectors | `docs/module_atlas/module_tags.json` |
| Tier-A modules (full backend vertical) | 363 | tags: `tier: A` |
| Backend route files | 293 | `backend/api/v1/routes/` |
| Live HTTP endpoints (lineage-harness census) | 2,528 | 292 testable domains |
| Backend engines/services | 298 files | `backend/services/` |
| Data ingesters (BaseIngester subclasses) | 19 | `backend/ingestion/` |
| Alembic migration files | 150 | `backend/alembic/versions/` |
| Live PostgreSQL tables | 584 | Supabase `kytzcbipsghprsqoalvi` |
| Navigation sectors (sidebar groups) | 26 | `frontend/src/navGroups.js` + module_tags |

## 3 · Dimension: Architecture

```
┌─ React SPA (CRA + react-app-rewired) ─────────────────────────────┐
│  App.js (routing shell, ~2700 lines) + navGroups.js (nav data)    │
│  853 lazy-loaded feature modules, each with its own local T theme │
│  Command palette · sector sidebar · pinned/recent · guided mode   │
└──────────────────────── same-origin in prod ──────────────────────┘
┌─ FastAPI monolith (backend/server.py) ────────────────────────────┐
│  Middleware stack (outermost→in): CORS → RateLimit → RequestLog   │
│    → Auth (REQUIRE_AUTH gate + per-module RBAC) → Audit → Demo    │
│  293 routers under /api/v1/* (+ legacy /api/auth, /api/admin)     │
│  298 engines in services/ — pure-Python quant methodologies       │
│  19 ingesters (scheduler-capable) — GLEIF, USGS, IBTrACS, GWIS,   │
│    OpenFEMA, SEC EDGAR, GDELT, Climate TRACE, NGFS, OWID, WDPA…   │
└───────────────────────────────────────────────────────────────────┘
┌─ PostgreSQL (Supabase, us-east-2) + PostGIS 3.3.7 ────────────────┐
│  584 tables: portfolios_pg (canonical), entity_lei golden source, │
│  6 ref_*_zones hazard grids (physical-risk digital twin),         │
│  ~221k rows Tier-1 reference data (/api/v1/refdata)               │
└───────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions and why:**

- **Single-service deployment** — one Docker image builds the React bundle and serves
  it from FastAPI (`frontend/build/` mounted as static). No CORS in production, one
  Railway service, one URL. See `docs/DEPLOYMENT.md`.
- **Per-module theming** — every page defines its own local `T` theme object (DM Sans /
  JetBrains Mono, navy/gold institutional palette). Only `App.js` chrome is
  platform-global. This lets 850+ modules evolve independently without a cascading
  design-system dependency.
- **Auto-discovery pilot** — `frontend/src/moduleRegistry.auto.js` globs per-feature
  `module.config.js` manifests so refined modules can declare route+nav+guide in their
  own folder instead of editing shared hotspots (App.js / navGroups.js). One adopter so
  far (`real-estate-carbon-analytics`); the manual lists still drive everything else.
- **Schema created out-of-band** — most of the 584 live tables predate tracked
  migrations (created via direct DDL during development). Alembic has **two heads**
  (136, 155) and the DB is stamped at `135_add_rbac_system`; `alembic upgrade` cannot
  currently run. Deliberate deferral: production connects to the existing populated DB
  and never migrates. Matters only for a hypothetical fresh-DB environment.
- **Honest-data degradation** — engines report `data_availability` / `resolution_tier`
  / `insufficient_data` rather than zero-filling or fabricating when a source is
  missing. Frontend pages show Live/Demo badges and "nothing shown in place of real
  data" states.

## 4 · Dimension: Sector coverage (module counts)

| Sector | Modules | Flagship examples |
|---|---|---|
| Cross-Cutting / Other | 112 | Entity 360, data intake, advanced report studio |
| Energy & Power | 102 | PPA structuring, hydrogen/P2X, BESS, nuclear, geothermal, grid carbon |
| Regulatory & Disclosure Infrastructure | 90 | CSRD/ESRS, SFDR, ISSB S2, XBRL export, regulatory calendar |
| Carbon Markets & Credits | 83 | Carbon Credit Engine (21 modules), VCM integrity, Article 6/ITMO, CCTS |
| Climate Physical & Transition Risk Science | 69 | Physical Risk Pricing (E104), Global Physical Risk Atlas (E121), stress-test orchestrator (E100) |
| Financial Services & Capital Markets | 58 | Financial Modeling Studio (NGFS-integrated PF model), DCM engine (56 methodologies), XVA/FRTB |
| Corporate Climate Strategy | 49 | Transition finance, net-zero execution, DME (Dynamic Materiality Engine) |
| Governance, Social & Human Capital | 44 | RBAC admin, just transition, human capital |
| AI/ML & Data Platform | 42 | Anomaly detection, NLP research, AI governance |
| Sovereign, Macro & Systemic | 35 | Sovereign-corporate bridge, UCDP conflict nowcast, country risk |
| + 16 further sectors | 308 | Real estate, nature, insurance/CAT, PCAF, agriculture, transport, industrials, circular economy, commodities, health… |

The four **primary user constituencies** (see `docs/CRITICAL_REVIEW_UAT_AUDIT.md` for
persona-level review): financial services (risk/portfolio/credit), energy & power desk,
supply chain & trade, and industrials/manufacturing.

## 4b · Dimension: Calculation engine layer (ultra-detail)

**Scale (AST-measured 2026-07-06):** 297 engine modules · 231,734 lines · 3,264
functions in `backend/services/`. Full per-engine inventory (docstring, classes,
function count, LOC, grouped by methodology domain): **`docs/ENGINE_CATALOG.md`**
(regenerable by script).

**Domain taxonomy of the 297 engines:**

| Domain | Engines | Representative flagships |
|---|---|---|
| Climate risk (physical & transition) | 41 | `physical_risk_pricing_engine` (E104: 30-country peril baselines from INFORM/ND-GAIN/Swiss Re CatNet, NGFS Phase-IV amplifiers, trapezoidal EP-curve EAL, logistic stranding), `global_physical_risk_engine` (E121: 5-hazard composite w/ missing-data re-normalization), `climate_stress_test_engine`, `climate_integrated_risk` (physical×transition interaction terms) |
| Regulatory disclosure | 29 | `sfdr_pai_engine` (2,044 LOC, PAI + DNSH + entity classification), `eba_pillar3_engine` (honest-nulls GAR/PCAF disclosures), CSRD/ESRS catalog engines, XBRL export/ingest pipeline, CBAM cost projector (official 2026–34 phase-out pinned) |
| Capital markets, valuation & portfolio | 21 | `portfolio_analytics_engine_v2`, DCM engine (56 methodologies), XVA suite, VaR calculator (true-Φ copula, MC + parametric), Financial Modeling Studio backend (NGFS-integrated PF model + QMC) |
| Nature, biodiversity, water & land | 18 | TNFD LEAP, water stewardship (AWS standard), EUDR/deforestation, GBIF screening |
| PCAF / financed & avoided emissions | 13 | `pcaf_wacie_engine` (hand-verified financed S1/S2 + WACI + weighted DQS), PCAF sovereign (deterministic attribution, honest NDC nulls), scope-3 category engines |
| Materiality, engagement & strategy | 12 | DME (Dynamic Materiality Engine, ML/NLP-assisted), `peer_benchmark_engine` (3,502 LOC disclosure-gap assessment), stewardship engine (GFANZ/CA100+/NZIF frameworks) |
| Carbon markets & credits | 11 | `cdm_tools_engine` (50 CDM methodological tools, 2,538 LOC), `carbon_calculator_v2` (landfill CH₄ density + REDD baselines, bench-pinned), VCM integrity, Article 6/ITMO pricing |
| Data platform, lineage & AI/ML | 11 | `data_lineage_service` (5,423 LOC module-dependency graph + BCBS-239 gap analysis), anomaly detection, document similarity |
| Prudential & banking regulation | 8 | `basel_capital_engine` (retail R-routing, PD floors, climate quarantine, 72.5% output floor — all bench-pinned), `basel3_liquidity_engine` (LCR/NSFR, conservative unmapped factors), ECL climate engine, FRTB |
| Supply chain & trade | 8 | Scope-3 supply chain, UN Comtrade flows, critical minerals (EU CRM Act/IRMA), maritime fleet |
| Energy & power finance | 7 | `renewable_project_engine` (discounted-denominator LCOE + bisection IRR, bench-pinned), PPA XVA (binomial lattice EE), tax-equity flip solver, BESS revenue stacking |
| Sovereign, macro & geopolitical | 6 | Sovereign-corporate bridge, UCDP conflict nowcast, country-risk indices (CPI/FSI/FH/GII) |
| Entity & reference data | 6 | GLEIF resolution (`resolution_tier` self-healing), sanctions screening, violation tracker |
| Real estate & built environment | 5 | `real_estate_valuation_engine` (DCF NOI escalation bench-pinned; known Decimal×float defect in 2 endpoints — see review doc B1), CRREM pathways, green-premium hedonic (real OLS on real UK data) |
| Insurance & actuarial | 3 | `eiopa_stress_engine` (Solvency II SCR correlation aggregation, bench-pinned), IORP II ORA, climate insurance (PML-based physical VaR) |
| Other / cross-cutting | 98 | Report studio, activity-guide catalog (6,218 LOC), entity 360, assessment runner/methodology manager, India/Asia overlays, hub engines |

**Engine design contract (uniform across the layer):**
- Pure-Python, import-cheap (no I/O at import), formulas in docstrings (AST-extracted
  into the Atlas §2.3/§5 per module).
- Deterministic — same inputs ⇒ same outputs; PRNG-as-data purged and CI-gated. Where
  Monte Carlo is legitimate (VaR), the copula uses the true normal CDF (the tanh
  approximation that understated tail defaults up to 55× is fixed and bench-pinned).
- **Honest degradation**: missing inputs produce `insufficient_data` / `data_availability`
  / `null` + note — never zero-fills, never invented defaults. Verified in bench_quant
  for Pillar 3, PCAF sovereign NDC, and the 5-hazard composite.
- Reference constants carry provenance comments (INFORM 2023, NGFS Phase IV, Swiss Re
  sigma, IPCC AR6 table numbers) — auditable at the line level via the Atlas deep-dives.

**Verification tiers (which engines you can trust how much):**
1. **Bench-pinned (12)** — hand-computed reference cases in `bench_quant.py`: VaR,
   PCAF WACI, PCAF sovereign, renewable LCOE/IRR, carbon calc v2, EIOPA SCR, Basel
   capital, CBAM, RE DCF, climate stress determinism, climate-insurance VaR, EBA
   Pillar 3, Basel liquidity.
2. **Atlas-audited (293)** — 2026-06→07 MRM audit: methodology read + §7/§8 deep-dive
   authored + fabrication purge; ~65 defects fixed across the sweep.
3. **Lineage-traced (all reachable)** — call-tree + SQL provenance recorded per
   endpoint in `backend/lineage_output/traces/`.
Gap between tiers 1 and 2 (285 engines with no numerical pin) is the top item in the
missing-test inventory (review doc §B3).

## 4c · Dimension: Backend database (ultra-detail)

**Scale (live `pg_stat_user_tables`, 2026-07-06):** 577 public tables ·
~350,457 rows · **425 empty (74%)**. Full table-by-table inventory with row counts,
grouped, populated-vs-empty split: **`docs/DATABASE_CATALOG.md`**. Supabase project
`kytzcbipsghprsqoalvi` (us-east-2), PostGIS 3.3.7; also on the instance: Supabase
system schemas (auth 23, storage 8 tables) — untouched by the app, which does its own
auth in `public`.

**Why 74% empty is (mostly) by design, not rot** — the platform's module-vertical
scaffold creates write-side tables when a module is built, populated on first user
action; mutation endpoints are deliberately never exercised by the read-only test
harness; some sources are deferred (WDPA license). The review doc §B2 tracks which
empty tables are *suspicious* vs expected.

**Row-mass distribution (where the data actually lives):**

| Group | Tables | Rows | Populated | Reading |
|---|---|---|---|---|
| Reference data layer (Tier-1 public) | 27 | 289,138 | 20/27 | 82% of all rows: `reference_data_points` (254k), `reference_data_records` (29k), GRI/ESRS catalogs |
| Spatial / physical-risk digital twin | 16 | 23,475 | 9/16 | 5 hazard grids + `spatial_ref_sys`; `ref_protected_areas` empty (WDPA deferred) |
| Data hub (`dh_*`) ingested mirrors | 28 | 21,735 | 15/28 | SBTi 14k, CRREM 3.9k, country-risk 3.1k |
| Climate scenarios & stress | 58 | 8,072 | 12/58 | NGFS timeseries 7.3k dominates |
| Regulatory & disclosure | 58 | 5,079 | 14/58 | ESRS/CSRD catalogs, BRSR |
| Hub / analysis workspaces | 14 | 929 | 7/14 | User-created comparisons/uploads |
| Auth, RBAC, audit & ops | 33 | 374 | 18/33 | Users, sessions, module registry, sync jobs |
| Energy & power | 29 | 274 | 9/29 | Market data seeds (EA-hybrid-v3) |
| Portfolios & holdings | 39 | 83 | 8/39 | 3 portfolios / their holdings — **functional but thin; volume-untested** |
| Financial instruments | 17 | 44 | 5/17 | |
| DME | 19+24 dme_* | 3,685* | | *BRSR metrics 3.6k live in dme_brsr_* (counted under their group) |
| Entity golden source | 10 | 18 | 3/10 | **`entity_lei` = 3 rows** — JIT-resolve works; weekly bulk ingest never run at scale (finding §B2) |
| Domain-specific module tables | 213 | 1,187 | ~40/213 | The long tail: per-module verticals awaiting first use |

**Canonical tables every session should know:**
- `portfolios_pg` / holdings — THE portfolio store (legacy `portfolios` is empty+dead).
- `reference_data_points/records` — the shared refdata backbone behind `/api/v1/refdata`.
- `entity_lei` — golden entity record (currently JIT-cache-only, 3 rows).
- `ref_{earthquake,cyclone,wildfire,flood,sea_level}_zones` (+`ref_protected_areas`) —
  PostGIS hazard grids; geometry types VARY per table (some POLYGON, wildfire
  MULTIPOLYGON) — check `geometry_columns` before inserting.
- `ngfs_scenario_timeseries` — 7.3k scenario paths feeding stress/transition engines.
- `audit_*` (18 tables) — populated by always-on AuditMiddleware.
- `dh_data_sources` + `sync_jobs` — ingester registry/telemetry (note: `cost` column
  is varchar(10); long values fail non-blockingly — known wart).

**Schema-governance reality:** ~most tables were created via direct DDL during
development, not tracked migrations; Alembic (150 migration files, two heads 136/155,
DB stamped at `135_add_rbac_system`) cannot currently upgrade and is used as
*documentation* of intent. Consequences that have caused real bugs: ORM Python-side
defaults don't apply to raw-SQL-inserted rows (NULL `updated_at` class), and column
names can drift from engine assumptions (`total_var_pct` vs actual `climate_var_pct` —
fixed 2026-07-05). Any schema change follows the established pattern: write the
migration file for the record, apply DDL directly, verify via `information_schema`.

## 5 · Dimension: Data layer

**Golden sources & reference data**
- `entity_lei` — GLEIF golden entity record; weekly bulk ingester + JIT live-resolve
  fallbacks (`resolution_tier: local_cache | live_gleif_fallback | no_match`); typeahead,
  ISIN/BIC resolution; consumed by counterparty graph, sanctions screening, sovereign bridge.
- `/api/v1/refdata` — Tier-1 public reference layer, 7 sources / ~221k rows, shared
  `useReferenceData` hook on the frontend.
- Physical-risk digital twin — 5 populated PostGIS hazard grids (earthquake 4,500 rows
  USGS ComCat · cyclone 4,470 NOAA IBTrACS · wildfire 5,378 GWIS/EFFIS · flood 48
  OpenFEMA+precip proxy · sea-level 152 IPCC AR6), composite scoring engine
  (`global_physical_risk_engine.py`), queried via `spatial.py`'s `ST_Within` pattern.
  `ref_protected_areas` (WDPA) intentionally empty pending license resolution.

**Live external integrations (key-gated ones degrade to labeled seeded data, never crash):**
GLEIF, OpenFIGI, UN Comtrade, EIA, ENTSO-E, UCDP, HM Land Registry, UK EPC, Overture
Maps buildings (S3 Parquet 2-phase scan), NASA POWER, Open-Meteo, USGS, NOAA IBTrACS,
GWIS, OpenFEMA, SEC EDGAR, GDELT, Climate TRACE, NGFS, OWID, yfinance, sanctions lists,
SBTi, Violation Tracker. Env keys documented in `backend/.env.example`.

**Critical data rules**
- `portfolios_pg` is the canonical portfolio table — the legacy `portfolios` (SQL model)
  is EMPTY and its legacy router is dead (404, unmounted).
- Rows inserted via raw SQL bypass ORM Python-side defaults — NULL `updated_at` on old
  rows is a known class of bug (fixed in portfolio_analytics 2026-07-05; watch for the
  pattern elsewhere).

## 6 · Dimension: Security, auth & governance

- **Auth model**: bearer/cookie sessions; `REQUIRE_AUTH=true` gates all mutating
  `/api/*` verbs (safe methods always pass); per-module RBAC (`allowed_module_paths`)
  enforced middleware-side even for GETs when a user resolves, plus frontend
  `ProtectedRoute` hard-block (wired throughout App.js). Public prefixes: health, auth,
  invites, refdata, `/api/v1/*/ref/*`, docs.
- **Invites**: admin panel flow (`/admin` → Invites) with role + module-preset +
  per-user overrides; SendGrid or SMTP.
- **Audit**: `AuditMiddleware` always on (independent of REQUIRE_AUTH). Request logger
  with request-IDs; sliding-window in-memory rate limiter (single-instance scope).
- **Secrets**: `backend/.env` gitignored and docker-ignored; `.env.example` documents
  every variable; no hardcoded secrets in tracked source (grep-audited 2026-07-05).
  `SECRET_KEY` must be freshly generated for production (currently a dev placeholder).
  `REACT_APP_DEV_AUTH` is a build-time frontend auth bypass — must never be true in a
  deployed build (verified clean).

## 7 · Dimension: Quality machinery (what "tested" means here)

There is **no conventional pytest/jest suite** (0 test files). The platform's quality
surface is instead:

1. **`backend/benchmark/bench_quant.py`** — 12 numerical benchmarks validating flagship
   engines against hand-computed references (VaR MC/parametric, PCAF WACI, sovereign
   attribution, LCOE/IRR, landfill CH₄, Solvency II SCR aggregation, Basel retail
   routing/PD floors/output floor, CBAM phase-out, RE DCF, stress-test determinism,
   climate-insurance VaR, Pillar 3 honest nulls, NSFR conservatism). 12/12 PASS.
2. **`backend/tools/check_no_fabricated_random.py`** — anti-fabrication guardrail,
   CI-gated via `.github/workflows/no-fabricated-random.yml`. 0 hits.
3. **`backend/lineage/`** — E2E data-lineage harness: instruments every route function,
   traces call trees + SQL + provenance, sweeps all 292 domains / 2,528 endpoints.
   Latest full sweep: 1,363 passed · 530 failed (triaged: ~98% harness-mock artifacts
   and expected-404s; 6 genuine bugs found and fixed 2026-07-05) · 635 mutation
   endpoints skipped (read-only protection). Output: `backend/lineage_output/` +
   `lineage_dashboard/`.
4. **Production build** as regression gate — `npm run build` exit 0, warnings treated
   as signal.
5. **Live smoke discipline** — every wave of work ends with endpoint-level curl
   verification against the running server; agent self-reports are never trusted
   without a direct DB/HTTP ground-truth check (this catches real bugs: silent 0-row
   ingester failures, hemisphere-gap data bugs, import errors).
6. **UAT history** — REM-33 → REM-57 cycles, ~385+ P0/P1 fixes, all cleared.

**Known gaps in the quality surface** (also see the critical review doc): no unit tests
around the 298 engines beyond the 12 benchmarked; no frontend interaction tests; the
lineage harness cannot exercise mutation endpoints or `Request`-dependent handlers;
50 npm audit findings (all dev-tooling scope).

## 8 · Dimension: Operations & deployment

- **Target**: Railway single service, Docker multi-stage (Node build → Python serve),
  health check `/api/health`, DB already-populated Supabase (never migrated at deploy).
  Full runbook incl. pre-deploy blockers: `docs/DEPLOYMENT.md`.
- **Dev**: `.claude/launch.json` defines `risk-analytics-backend` (uvicorn :8001),
  `risk-analytics-dev` (CRA :3000), `risk-analytics-prod` (serve build :4001),
  `lineage-dashboard` (:4505). Frontend node lives at `/c/Program Files/nodejs/node.exe`.
- **Deployment blockers as of 2026-07-06**: (1) ~1,353 uncommitted files + 61 unpushed
  commits on `remediation-v1`; (2) production `SECRET_KEY` not yet generated. Everything
  else verified ready.
- **Pinned dependency hazard**: `fastapi==0.110.1` / `starlette==0.37.2` — drift
  silently breaks `include_router` (streamlit pulls starlette>=0.40; keep it out of
  this venv).

## 9 · Dimension: History (major arcs)

| Era | Arc |
|---|---|
| Sprints A–J → EL (2026-03 → 04) | Core platform build-out: ~150 sprint-letter module waves across every sector; DCM engine; carbon credit engine; energy sprints (H₂, BESS, nuclear, geothermal, SAF, green steel, CDR); India green economy; impact advisory |
| Remediation era (2026-04 → 06) | UAT REM-33→57 (~385 P0/P1 fixes); PRNG standardization (~128 modules); fabrication purge Waves 0–3 + CI guardrail; MRM audit of 293 engines |
| Atlas & intelligence (2026-07-02→04) | Module Atlas: 963→999 documented modules with §7 methodology + §8 model-spec deep dives; Notion wiki push (963/963); ~65-fix consolidated backlog cleared; cross-module synthesis (`docs/PLATFORM_INTELLIGENCE.md`) |
| Navigation & data era (2026-07-04→05) | Command palette + sector nav shell; NX/NX2 use-case batches (32 modules); GLEIF golden source; wave-1 external data (8 sources); physical-risk digital twin (5 hazard grids + composite engine + atlas page) |
| Deployment prep (2026-07-05→06) | Full test sweep (6 live bugs found+fixed), deployment runbook updated, this overview |

## 10 · Dimension: Risk register (platform-level)

| Risk | Severity | Mitigation state |
|---|---|---|
| Two Alembic heads / out-of-band schema | Low now, high for any fresh-DB future | Documented; deferred deliberately; direct-DDL workaround pattern established |
| 1,353 uncommitted files | High (single-machine loss exposure) | Flagged as deploy blocker; awaiting user's commit-split decision |
| No unit-test suite around 286 unbenchmarked engines | Medium | bench_quant covers flagships; lineage sweep covers reachability; gap documented |
| In-memory rate limiter | Low (single instance) | Documented; needs Redis only if scaled horizontally |
| WDPA license (non-commercial terms, ingester exists) | Medium before client presentations | Explicitly deferred by user decision; `ref_protected_areas` kept empty |
| Key-gated integrations unset in prod (EIA, ENTSO-E, UCDP…) | Low | Graceful labeled-fallback convention platform-wide |
| Single-maintainer bus factor | High | This document + Module Atlas + memory system are the mitigation |

---

*Companion documents: `docs/CRITICAL_REVIEW_UAT_AUDIT.md` (persona-aligned critical
review), `CLAUDE.md` (working conventions for Claude Code sessions),
`docs/DEPLOYMENT.md` (deploy runbook), `docs/module_atlas/` (per-module documentation),
`docs/PLATFORM_INTELLIGENCE.md` (cross-module synthesis).*
