# Sustainability Platform — Plan Status Report
**Date:** 2026-03-10
**Platform Version:** 52 migrations · ~150 services · 129 route files · 1 branch (main)
**Stack:** FastAPI (Python) + React (JavaScript) + PostgreSQL (Supabase)

---

## Executive Summary

The platform has undergone massive expansion since the initial Council Review (2026-03-08 baseline). All 19 sessions from `FUNCTIONAL_GAPS_AND_PLAN.md` are complete. All 6 chunks from `IMPLEMENTATION_PLAN_V2.md` are complete. An additional wave of regulatory/specialist engines has been built since, covering EUDR, CSDDD, Sovereign Climate Risk, SEC Climate, GRI, SASB, TNFD, Transition Plans, Double Materiality, SFDR PAI, XBRL Ingestion, Residential RE, RICS ESG, Spatial Hazard, and more.

**Estimated Backend Completeness: ~92%**
**Frontend Completeness: ~65%** (most new engines lack frontend panels)
**Production Readiness: ~45%** (auth/RBAC, CI/CD, task queue, monitoring still missing)

---

## Part 1: Database Migrations — Status

| Migration | Purpose | Status |
|-----------|---------|--------|
| 001–005 | CBAM, Stranded, Nature, RE Valuation, Portfolio Analytics | ✅ Applied |
| 006–010 | Financial Risk, Supply Chain, Sector, Regulatory, Unified Valuation | ✅ Applied |
| 011–012 | FI tables, Energy Developer tables | ✅ Applied |
| 013–015 | CSRD KPI store, ESRS IG3/ISSB S1-S2, ISSB SASB/risk/scenario | ✅ Applied |
| 016 | CSRD report uploads (PDF pipeline) | ✅ Applied |
| 017 | PostGIS extension | ✅ Migration exists (may need Supabase toggle) |
| 018 | Time-series tables | ✅ Applied |
| 019 | Extend assets / PCAF | ✅ Applied |
| 021–029 | Company profiles, data intake, merge, engagement, RBAC, audit log, parameter governance, Asia regulatory, China trade | ✅ Applied |
| 030–036 | WDPA/GFW/GEM, violations, GDELT, CA100, ESRS AR/DR, GRI, CDM tools | ✅ Applied |
| 037–038 | Fund structure tables, PE tables | ✅ Applied |
| 039–040 | Climate risk assessments, AM/agriculture expanded | ✅ Applied |
| 041–043 | Facilitated/insurance emissions, cross-module entity linkage, RE/nature/spatial FKs | ✅ Applied |
| 044–046 | Regulatory reports / EU ETS, EUDR, CSDDD + Sovereign Climate | ✅ Applied |
| 047 | SEC Climate + GRI Standards tables | ✅ Applied |
| 048 | SASB assessments + Model Validation tables | ✅ Applied |
| 049 | TNFD + CDP assessment tables | ✅ Applied |
| 050 | PCAF quality + Basel capital tables | ✅ Applied |
| 051 | EU Taxonomy + Transition Plan tables | ✅ Applied |
| 052 | Double Materiality + SFDR PAI tables | ✅ Applied |
| **020** | ⚠️ Gap in chain (019→021 jump) | **Needs verification** |

---

## Part 2: Backend Services — Completion by Domain

### 2A. Core Calculators
| Service | Status | Notes |
|---------|--------|-------|
| Carbon Calculator v1 + v2 | ✅ Production | Scope 1/2/3, DEFRA, GHG Protocol |
| CBAM Calculator | ✅ Production | EU Art. 7, 21, 31 |
| Stranded Asset Calculator | ✅ Production | Reserves, plants, infra, tech |
| Nature Risk (TNFD LEAP) | ✅ Production | Water, biodiversity; no PostGIS yet |
| Real Estate Valuation | ✅ Production | Income / Cost / Sales Comparison |
| Scenario Analysis (NGFS) | ✅ Production | Net Zero 2050, Delayed, Current Policies |
| PD Calculator | ✅ Production | Basel PD; EAD/LGD/ECL now separate services |
| Sustainability Certs (GRESB/LEED/BREEAM) | ✅ Production | 6 frameworks |
| Methodology Engine | ✅ Production | 56+ CDM/VCS/Gold Standard |

### 2B. Financial Risk Stack (FI)
| Service | Status | Notes |
|---------|--------|-------|
| ECL Climate Engine | ✅ Production | IFRS 9 Stage 1/2/3 with NGFS overlays |
| PCAF WACI + Temperature | ✅ Production | Full scope 1/2/3 financed emissions |
| PCAF-ECL Bridge | ✅ Production | 54 test cases |
| EAD Calculator | ✅ Complete | Basel CCF by asset class, off-B/S |
| GAR Calculator | ✅ Complete | Art. 449a CRR, 6 env. objectives |
| Counterparty Climate Scorer | ✅ Complete | Composite score 0-100, A+ to D- |
| Stress Test Runner | ✅ Complete | Multi-scenario, stage migration matrix |
| PD Backtester | ✅ Complete | Gini, KS, Brier, Hosmer-Lemeshow |
| LGD Downturn Engine | ✅ Complete | Frye-Jacobs, TTC vs PIT, collateral haircuts |
| Vintage Analyzer | ✅ Complete | Cohort-based ECL tracking |
| Banking Risk Engine | ✅ Complete | NSFR, LCR, IRRBB, large exposures, AML/KYC, OpRisk |
| Insurance Risk Engine | ✅ Complete | Life/P&C/health/reinsurance, Solvency II |
| PCAF Facilitated Emissions | ✅ Complete | Part C — bond/equity/securitisation/syndicated loans |
| PCAF Insurance Emissions | ✅ Complete | Part B — motor/property/commercial/life |

### 2C. Asset Management
| Service | Status | Notes |
|---------|--------|-------|
| Portfolio Analytics Engine v2 | ✅ Complete | Real DB, dashboard, heatmap, VaR all live |
| AM Engine | ✅ Complete | ESG attribution, Paris alignment, green bond screening, LP analytics, ESG optimization |
| Fund Structure Engine | ✅ Complete | Fund, share class, holdings, LP, benchmarks |
| ESG Attribution Engine | ✅ Complete | Brinson-Fachler decomposition |
| Benchmark Analytics | ✅ Complete | Tracking error, active share, information ratio |
| SFDR Report Generator | ✅ Complete | Art. 8/9 periodic report, PAI indicators |
| Exclusion List Engine | ✅ Complete | Weapons, tobacco, coal, arctic O&G |

### 2D. Real Estate / REIT
| Service | Status | Notes |
|---------|--------|-------|
| CRREM Stranding Engine | ✅ Production | Carbon intensity vs. pathway |
| RE CLVaR Engine | ✅ Production | Climate VaR for RE |
| RE Portfolio Engine | ✅ Complete | NAV roll-up, CRREM wiring, EPC distribution |
| EPC Transition Engine | ✅ Complete | EU MEPS by country, stranding risk score |
| Retrofit Planner | ✅ Complete | NPV/payback per measure, portfolio budget |
| Green Premium Engine | ✅ Complete | Rent differential by certification / EPC |
| Tenant ESG Tracker | ✅ Complete | Green lease clauses, occupancy ESG score |
| Residential RE Engine | ✅ Complete | New in latest wave |
| RICS ESG Engine | ✅ Complete | RICS ESG assessment framework |
| Spatial Hazard Service | ✅ Complete | Flood/heat/fire overlay (PostGIS via migration 017) |

### 2E. VC / PE
| Service | Status | Notes |
|---------|--------|-------|
| PE Deal Engine | ✅ Complete | Pipeline, ESG screening scorecard, red flags |
| PE Portfolio Monitor | ✅ Complete | KPI tracker, traffic light dashboard |
| PE Value Creation | ✅ Complete | Improvement levers, exit value impact |
| PE Reporting Engine | ✅ Complete | ILPA ESG Data Convergence aligned GP/LP report |
| PE Impact Framework | ✅ Complete | IRIS+ metrics, SDG mapping |
| PE IRR Sensitivity | ✅ Complete | Carbon pricing, regulation, green premium, stranding |

### 2F. Energy Sector
| Service | Status | Notes |
|---------|--------|-------|
| Generation Transition Planner | ✅ Complete | Phase-out sequencing, capex, just transition |
| Grid EF Trajectory | ✅ Complete | 30 countries, 2024-2050, NGFS scenarios |
| Renewable Project Engine | ✅ Complete | P50/P90 wind/solar, LCOE, IRR |
| PPA Risk Scorer | ✅ Complete | Counterparty, price, tenor, curtailment, regulatory |
| Methane OGMP | ✅ Complete | 5 reporting levels, OGMP 2.0 intensity benchmarks |
| Scope 3 Cat 11 Engine | ✅ Complete | End-use combustion for fossil fuel producers |
| CSRD Auto-Populate | ✅ Complete | Auto-fill ESRS E1-E5 from operational data |
| Green Hydrogen Calculator | ✅ Production | LCOH, electrolyser efficiency |

### 2G. Regulatory & Reporting
| Service | Status | Notes |
|---------|--------|-------|
| XBRL Export Engine | ✅ Complete | iXBRL + XBRL XML, ESRS ESEF tagging |
| XBRL Ingestion Engine | ✅ Complete | Parse incoming XBRL filings |
| Disclosure Completeness Engine | ✅ Complete | Per-standard completeness %, traffic light |
| Trend Analytics Engine | ✅ Complete | YoY, CAGR, peer percentile, sparklines |
| Entity 360 Engine | ✅ Complete | Cross-module KPI aggregation by entity |
| Regulatory Report Compiler | ✅ Complete | Compiled regulatory reports |
| SFDR PAI Engine | ✅ Complete | 18 PAI indicators, SFDR RTS |
| CSRD Auto-Populate | ✅ Complete | ESRS mapping from operational data |
| CSRD Extractor | ✅ Production | PDF extraction, 8+ entities |
| SEC Climate Engine | ✅ Complete | Reg S-K 1501-1505, Reg S-X 14-02, attestation |
| GRI Standards Engine | ✅ Complete | 18 topic standards, 4 sector standards, SDG linkage |
| SASB Industry Engine | ✅ Complete | 20 SASB sectors, industry-specific metrics |
| TNFD Assessment Engine | ✅ Complete | LEAP, dependencies, financial materiality |
| Transition Plan Engine | ✅ Complete | Paris targets, board oversight, milestones |
| Validation Summary Engine | ✅ Complete | Cross-model validation |
| Double Materiality Engine | ✅ Complete (migration 052) | Impact + financial materiality scoring |

### 2H. Overlay & Cross-Cutting
| Service | Status | Notes |
|---------|--------|-------|
| Factor Overlay Engine | ✅ Complete | 31 ESG/Geo/Tech registries, 12 FI×LOB overlays |
| Data Lineage Service | ✅ Complete | DAG of 47+ modules, DQS propagation |
| Lineage Orchestrator | ✅ Complete | Platform health, reference data gaps, bridge health |
| Reference Data Catalog | ✅ Complete | 6 domains, stale/missing detection |
| Technology Risk Engine | ✅ Complete | Automation disruption, AI adoption, digital readiness |
| EUDR Engine | ✅ Complete | 7 commodities, 55 countries, Art. 4-12 DD |
| CSDDD Engine | ✅ Complete | Art. 2 scope, 18 adverse impacts, 9 DD obligations |
| Sovereign Climate Risk Engine | ✅ Complete | 51 countries, 5 NGFS scenarios, rating adjustment |
| Agriculture Risk Engine (expanded) | ✅ Complete | Methane, disease outbreak, BNG, weather-index |
| China Trade Engine | ✅ Production | 6 bridges, geopolitical supply chain |
| Asia Regulatory Engine | ✅ Production | MAS, HKMA, SEBI, JFSA frameworks |

---

## Part 3: API Routes — Completion (129 route files)

All major route groups are present. Key additions since last review:
`ead`, `lgd_vintage`, `stress_testing`, `re_portfolio`, `epc_retrofit`, `green_premium_tenant`, `fund_management`, `attribution_benchmark`, `sfdr_exclusion`, `pe_reporting`, `renewable_ppa`, `energy_transition`, `energy_emissions`, `xbrl_export`, `disclosure_trends`, `reference_catalog`, `insurance_risk`, `banking_risk`, `am`, `agriculture_expanded`, `factor_overlays`, `facilitated_emissions`, `eudr`, `csddd`, `sovereign_climate_risk`, `sec_climate`, `gri_standards`, `sasb_industry`, `tnfd_assessment`, `transition_plan`, `sfdr_pai`, `residential_re`, `rics_esg`, `spatial_hazard`, `validation_summary`, `technology`, `regulatory_reports`

---

## Part 4: Frontend — Completion

### Confirmed Pages (wired into App.js)
| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/` | ✅ Real DB data |
| Portfolio Manager | `/portfolios` | ✅ Real DB |
| Interactive Analytics | `/interactive` | ✅ Built (seed-based data) |
| Financial Risk | `/financial-risk` | ✅ Built |
| Real Estate Assessment | `/real-estate-assessment` | ✅ Built |
| Supply Chain | `/supply-chain` | ✅ Built |
| Sector Assessments | `/sector-assessments` | ✅ Built |
| Regulatory | `/regulatory` | ✅ Built (7 panels) |
| Scenario Builder | `/scenario-builder` | ✅ Built |
| NGFS Scenarios | `/ngfs` | ✅ Built |
| CBAM | `/cbam` | ✅ Built |
| Data Hub | `/data-hub` | ✅ Scaffold |
| Carbon Calculator | `/carbon` | ✅ Built |
| Stranded Assets | `/stranded-assets` | ✅ Built |

### Frontend Gaps (New Engines Need Panels)
| New Engine | Frontend Panel | Status |
|------------|----------------|--------|
| EUDR Engine | EUDR Compliance panel | ❌ Missing |
| CSDDD Engine | CSDDD panel | ❌ Missing |
| Sovereign Climate Risk | Sovereign Risk panel | ❌ Missing |
| SEC Climate Disclosure | SEC panel | ❌ Missing |
| GRI Standards | GRI dashboard | ❌ Missing |
| SASB Industry | SASB panel | ❌ Missing |
| TNFD Assessment | TNFD dashboard | ❌ Missing |
| Transition Plan | Transition Plan panel | ❌ Missing |
| Double Materiality | DMA workshop UI | ❌ Missing |
| SFDR PAI (full) | PAI disclosure dashboard | ❌ Missing |
| XBRL Export | Export wizard | ❌ Missing |
| Entity 360 | Cross-module entity view | ❌ Missing |
| PE Deal Pipeline | PE screens | ❌ Missing |
| Fund Structure | Fund/holdings management | ❌ Missing |
| XBRL Ingestion | Filing import workflow | ❌ Missing |
| Residential RE | Residential assessment | ❌ Missing |
| Technology Risk | Tech risk panel | ❌ Missing |

**~17 new backend engines lack any frontend UI.**

---

## Part 5: Critical Infrastructure Gaps (Still Open)

| Gap | Priority | Status |
|-----|----------|--------|
| **Auth / RBAC enforcement** — auth.py exists but not enforced on routes | P0 | ❌ Not done |
| **CI/CD pipeline** | P0 | ❌ Not done |
| **Hardcoded secrets in .env** | P0 | ❌ Not done |
| **Persistent task queue (Celery/RQ)** — background PDF extraction unreliable | P0 | ❌ Not done |
| **Error monitoring (Sentry / APM)** | P1 | ❌ Not done |
| **PostGIS adoption wired** — migration 017 exists but spatial queries not used in services | P1 | ⚠️ Partial |
| **Migration chain gap** — revision 020 missing (019→021 jump) | P1 | ⚠️ Needs fix |
| **Frontend builds passing** (`npm run build`) | P1 | ❓ Not verified |
| **Backend startup clean** (no import errors) | P1 | ❓ Not verified |
| **Time-series architecture (TimescaleDB)** — migration 018 exists, not used by services | P2 | ❌ Not done |
| **Multi-tenancy (org_id on all tables)** — organisations table exists (migration 025) but FK not on all tables | P2 | ⚠️ Partial |

---

## Part 6: WORK_PLAN.md Track Status

### TRACK 1 — DB Migrations (COMPLETE)
- Migrations 001–052 all exist. 017 (PostGIS) and 018 (time-series) applied.
- **Remaining:** Verify migration 020 gap; confirm all applied to Supabase.

### TRACK 2 — Data Hub Ingestion Pipelines
| Ingester | Status |
|----------|--------|
| BaseIngester + APScheduler | ❓ Unknown (services/data_hub_service.py exists) |
| GLEIF LEI bulk | ❓ |
| Sanctions (OFAC/EU/UN) | ❓ |
| Climate TRACE | ❓ |
| NGFS Scenarios Portal | ❓ |
| OWID CO2/energy | ❓ |
| SEC EDGAR XBRL | ❓ — `xbrl_ingestion_engine.py` exists (partial?) |
| yfinance/FMP EVIC | ❓ |
| Violation Tracker | ✅ violations routes exist |
| WDPA + GFW spatial | ✅ migration 030 + nature_data routes exist |
| GEM GCPT | ✅ energy_data routes exist |
| IRENA LCOE + CRREM + Grid EFs | ✅ reference_data routes |
| SBTi Target Registry | ✅ sat_coal_checker / supply chain |
| GDELT BigQuery | ✅ gdelt_controversy routes exist |

### TRACK 3 — Backend Fixes
| Task | Status |
|------|--------|
| B1: Portfolio Analytics v2 wired | ✅ Done (2026-03-08) |
| B2: Auth/RBAC middleware enforcement | ❌ Still deferred |
| B3: Audit trail wired to write endpoints | ⚠️ Table exists (026), middleware unknown |
| B4: PCAF DQS aggregation | ✅ DQS in facilitated_emissions service |
| B5: SAT Coal Phase-Out checker | ✅ sat_coal_checker route exists |
| B6: PCAF Listed Equity | ✅ pcaf_asset_classes route exists |
| B7: Migration chain fix (019→021) | ❓ Not verified |

### TRACK 4 — Frontend Completion
| Task | Status |
|------|--------|
| F1: Scenario Builder routing | ✅ Built |
| F2: Portfolio Analytics page real API | ✅ Done |
| F3: Data Intake status dashboard | ❓ data_intake route exists |
| F4: NZBA Glidepath Tracker | ✅ glidepath routes exist |
| F5: CRREM Pathway chart | ✅ crrem_stranding_engine + RE portfolio |
| F6: Geothermal Panel | ✅ geothermal route exists |
| F7: IRENA Five Pillars | ✅ irena_five_pillars route exists |

---

## Part 7: Recommended Next Sessions

### Priority 1 — Infrastructure (MUST DO before any production demo)
1. **Auth enforcement** — add `current_user = Depends(get_current_user)` to write routes
2. **Backend smoke test** — verify `uvicorn server:app` loads cleanly (all 129 route files registered)
3. **Frontend build** — `npm run build` must pass; fix any missing imports
4. **Migration 020 gap** — add or verify missing revision file

### Priority 2 — Frontend Coverage (new engines need UI)
5. **EUDR + CSDDD panels** — two high-value regulatory engines with zero frontend
6. **Entity 360 dashboard** — cross-module unified view (engine complete, no UI)
7. **Double Materiality workshop UI** — ESRS VSME double materiality assessment
8. **SFDR PAI full disclosure dashboard**
9. **XBRL Export wizard** — let users generate regulatory filings

### Priority 3 — Data Completeness
10. **Verify Data Hub ingesters** — confirm GLEIF, Sanctions, yfinance are live
11. **Wire PostGIS queries** — spatial_hazard_service.py should use ST_Within/ST_Intersects
12. **Multi-tenancy FK audit** — ensure `org_id` FK is present on all core tables

---

## Part 8: Services Count Summary

| Category | Services | Status |
|----------|----------|--------|
| Core Calculators | 9 | ✅ Production |
| FI Risk Stack | 14 | ✅ Complete |
| Asset Management | 7 | ✅ Complete |
| Real Estate | 10 | ✅ Complete |
| VC / PE | 6 | ✅ Complete |
| Energy Sector | 8 | ✅ Complete |
| Regulatory / Reporting | 17 | ✅ Complete |
| Overlay & Cross-Cutting | 13 | ✅ Complete |
| Sector Specialists (Agri/Mining/Shipping/Steel/H2) | 7 | ✅ Production |
| Portfolio / Scenario Engines | 8 | ✅ Production |
| Utility / Infrastructure | 21 | ✅ Production |
| **TOTAL** | **~120 active services** | |

**Route files: 129 · Migration files: 52 · Frontend pages: ~30**

---

*Last updated: 2026-03-10 | Generated by Claude Code*
