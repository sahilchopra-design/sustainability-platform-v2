# Multi-Stakeholder Council Review Report
## Sustainability Analytics Platform — Comprehensive Gap Assessment

**Report Date:** 2026-03-08
**Platform Version:** 729 commits, 437 source files
**Stack:** FastAPI (Python) + React (JavaScript) + PostgreSQL (Supabase)
**Assessed By:** Multi-Stakeholder Review Council (6 Primary Councils + 6 Sub-Councils)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Inventory Summary](#2-platform-inventory-summary)
3. [Module-by-Module Gap Analysis](#3-module-by-module-gap-analysis)
4. [Cross-Functional Use Case Assessment](#4-cross-functional-use-case-assessment)
5. [Data Schema & Analytics Enhancement Review](#5-data-schema--analytics-enhancement-review)
6. [Stakeholder-Specific Recommendations](#6-stakeholder-specific-recommendations)
7. [Competitive Positioning](#7-competitive-positioning)
8. [Prioritized Product Roadmap](#8-prioritized-product-roadmap)

---

## 1. Executive Summary

### Overall Maturity Scores by Council

| Council | Score | Verdict |
|---------|-------|---------|
| Chief Sustainability Officer | 6.5/10 | Strong domain coverage; weak on audit trail & compliance export |
| ESG Data & Analytics Manager | 7.0/10 | Excellent calculation breadth (70+ services); data quality hierarchy needs work |
| Investor Relations & Reporting | 5.5/10 | Missing XBRL, ESG rating alignment, peer benchmark export |
| Risk Management | 7.5/10 | Strong NGFS scenarios, ECL, VaR, Monte Carlo; missing physical risk granularity |
| Technology & Integration | 4.0/10 | No auth, no CI/CD, no caching, no monitoring, hardcoded secrets |
| End-User Experience | 6.0/10 | Good dashboard design; missing error boundaries, search, keyboard shortcuts |

**Overall Platform Maturity: 6.1/10** (Development stage, not production-ready)

### Top 10 Critical Gaps

| # | Gap | Impact | Affected Stakeholders |
|---|-----|--------|-----------------------|
| 1 | No RBAC / authentication enforcement | Data breach, institutional non-compliance | All |
| 2 | No CI/CD pipeline | Error-prone manual deployments | Technology, Risk |
| 3 | No XBRL export | Cannot submit CSRD/ISSB to EU regulators | CSO, Investor Relations |
| 4 | Hardcoded secrets in .env (committed to git) | Credential exposure | Technology, Security |
| 5 | No persistent task queue (Celery/RQ) | CSRD PDF extraction unreliable; background jobs lost on restart | ESG Data Managers |
| 6 | No error monitoring (Sentry/APM) | Undetected production failures | Technology, All Users |
| 7 | Portfolio analytics cross-module linkage | Each module is a data island; no unified portfolio view | CSO, Risk, Investor Relations |
| 8 | No rate limiting | API abuse, DDoS vulnerability on expensive calculations | Technology |
| 9 | Physical risk granularity (no PostGIS adoption) | Spatial queries blocked; nature risk uses flat lat/lng | Risk Management, Nature Sub-Council |
| 10 | No global error boundary (frontend) | Unhandled component errors crash entire page | End Users |

### Top 10 Enhancement Opportunities

| # | Opportunity | Business Value | Effort |
|---|-------------|---------------|--------|
| 1 | AI-powered CSRD PDF extraction (upgrade from regex to LLM) | 10x faster onboarding of new entities | Medium |
| 2 | Unified Entity 360 dashboard (cross-module KPI view) | Single pane of glass for portfolio managers | Medium |
| 3 | Real-time physical risk maps (PostGIS + Mapbox GL) | Visual risk assessment for CROs | Medium |
| 4 | XBRL tagged export for CSRD/ISSB | Regulatory submission readiness | High |
| 5 | Predictive emissions forecasting (time-series ML) | Proactive SBTi target management | High |
| 6 | Automated double materiality scoring | Reduce manual assessment effort by 70% | Medium |
| 7 | Supplier portal for Scope 3 data collection | Direct primary data from Tier 1-3 suppliers | High |
| 8 | Command palette (Cmd+K) with global search | Power user productivity boost | Low |
| 9 | Webhook/event system for external integrations | Enterprise ERP/GRC/DWH connectivity | Medium |
| 10 | Mobile-responsive executive dashboard | C-suite on-the-go access | Low |

---

## 2. Platform Inventory Summary

### Backend Services (70 modules, ~48,600 LOC)

| Category | Modules | LOC | Status |
|----------|---------|-----|--------|
| Core Calculators (Carbon, CBAM, Stranded, Nature, RE, Scenarios, PD, Sustainability) | 9 | ~6,100 | Production |
| Advanced Financial (ECL, PCAF, Scope 3, LGD, VaR, Monte Carlo, Unified Valuation, CRREM) | 8 | ~6,800 | Production |
| Sector-Specific (Mining, Agriculture, Shipping, Steel, Green H2, Just Transition, Insurance) | 7 | ~2,300 | Production |
| Portfolio & Scenario Engines | 4 | ~3,100 | Production |
| Methodology & CDM Tools (56+ methodologies, 43 CDM tools) | 2 | ~4,150 | Production |
| Activity Guide Catalog (105 activities) | 1 | 6,218 | Production |
| Data Integration & Enrichment (Data Hub, CBI, Peer Benchmark, NGFS) | 8 | ~5,700 | Production |
| Reporting & Export | 6 | ~2,600 | Production |
| CSRD & Regulatory | 3 | ~2,100 | Production |
| Calculation & Orchestration | 6 | ~1,800 | Production |
| Specialized Engines (Project Finance, RE CLVaR, Impact, Time-series) | 5 | ~2,100 | Production |
| Admin & Utility | 7 | ~3,300 | Production |
| Regulatory & Governance (Asia, China Trade) | 3 | ~2,300 | Production |

### Database Schema (120+ tables, 36 migrations)

| Domain | Tables | FK Links | Audit Trail | Time-Series |
|--------|--------|----------|-------------|-------------|
| Core Portfolio | 5 | Strong | Partial | No |
| CBAM | 8 | Strong | Yes | Yes (date-indexed) |
| Stranded Assets | 6 | To counterparty | Partial | TimescaleDB candidate |
| Nature Risk (TNFD) | 6 | Weak | Partial | Yes (biodiversity) |
| Financial Risk (ECL/PCAF) | 8 | Medium | Yes | No |
| Supply Chain (Scope 3) | 8 | Strong | Partial | No |
| Sector Assessments | ~9 | Medium | Minimal | No |
| Regulatory (SFDR/TCFD/CSRD/ISSB) | 9 | Weak | Minimal | No |
| Unified Valuation | 7 | Medium | Partial | No |
| Financial Institutions | 13 | Strong | Yes | No |
| Energy Developers | 13 | Strong | Yes | No |
| CSRD KPI Store (Cross-Sector) | 13 | Central bridge | Yes | Yes (year) |
| ESRS IG3 + ISSB S1/S2 | ~40 | Strong | No | Yes (reporting year) |
| RBAC & Audit | 3+ | Strong | Immutable log | Partitioned |

### Frontend (229 files, 12,595 LOC)

| Category | Count | Coverage |
|----------|-------|----------|
| Pages | 22 | All major modules |
| Feature Modules | 21 | Carbon, Nature, Stranded, Valuation, Sustainability, Regulatory, PCAF, ECL, Supply Chain, Sectors |
| UI Components (shadcn/Radix) | 46 | Full design system |
| Navigation Groups | 8 | Pulse, Analytics, ESG, Risk, Regulatory, Scenarios, Portfolio, Data Intake |
| Routes | 60+ | Comprehensive |

### API Surface (76 route files, 731 endpoints)

| Method | Count | Auth Protected | Paginated |
|--------|-------|----------------|-----------|
| GET | ~450 | 0% | ~30% |
| POST | ~200 | 0% | N/A |
| PUT/PATCH | ~50 | 0% | N/A |
| DELETE | ~30 | 0% | N/A |

### Frameworks Supported (30+)

GHG Protocol, PCAF v2, SFDR, TCFD, CSRD/ESRS, ISSB S1/S2, EU Taxonomy, GRESB, LEED, BREEAM, WELL, NABERS, CASBEE, IPCC AR6, RICS Red Book, IVS, USPAP, TEGoVA, Basel III/IV, IFRS 9/13, EBA GL, NGFS, CRREM, NZBA, IMO CII/EEXI, SBTi, ILO Just Transition, Solvency II, CBAM, SASB, GRI

---

## 3. Module-by-Module Gap Analysis

### 3.1 Carbon Accounting Module

**Overall Rating: 7.5/10**
- Functionality: 8/10
- Data Coverage: 8/10
- Calculation Engine: 9/10
- User Experience: 7/10
- Output Quality: 6/10

**Strengths:**
- 56+ CDM/VCS/Gold Standard/CAR/ACR methodologies implemented
- 43 CDM methodological tools as standalone calculators
- 105-activity guide catalog with plain-language input requirements
- Scope 1/2/3 emission calculations with IPCC default factors
- Grid emission factor auto-resolution from country code (TOOL07)
- Tool chain execution per methodology (46 methodologies mapped)
- Monte Carlo simulation for credit risk (10k draws)
- Quality scoring (AAA-CCC rating)

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No Scope 3 Category 15 (Investments) | Financial institutions cannot calculate financed emissions via carbon module | High | FI CSOs, PCAF |
| No facility-level tracking | Cannot disaggregate company emissions by site | Medium | Energy companies |
| No vintage year tracking | Carbon credit portfolios lack vintage-based risk assessment | Medium | Carbon credit investors |
| No registry integration | No Verra/Gold Standard/ACR API connection for real-time credit verification | High | Carbon markets |
| No CORSIA compliance | Aviation sector carbon offsetting framework missing | Low | Airlines |
| No Article 6 (Paris) accounting | Corresponding adjustments for international transfers not modeled | Medium | Governments, project developers |

**Enhancement Recommendations:**
- Integrate Verra/GS API for live credit verification (Medium effort)
- Add facility-level emission tracking linked to GHG Protocol Corporate Standard (High effort)
- Implement vintage-weighted portfolio risk scoring (Low effort)

---

### 3.2 CBAM Calculator

**Overall Rating: 7.0/10**
- Functionality: 7/10
- Data Coverage: 7/10
- Calculation Engine: 8/10
- User Experience: 6/10
- Output Quality: 6/10

**Strengths:**
- Articles 7, 21, 31 fully implemented
- Product category classification with CN/HS codes
- Embedded emissions calculation (direct + indirect)
- Cost projection with scenario analysis
- Country risk scoring with carbon pricing database

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No CBAM product expansion (Phase 2) | Only initial categories; missing downstream processed goods | High | EU importers |
| No supplier CBAM certificate workflow | Cannot collect actual emissions data from non-EU producers | High | Supply chain managers |
| No CBAM quarterly report generation | Cannot generate XML submission format for national authorities | High | Compliance teams |
| No actual vs default value comparison | Cannot show benefit of using actual vs default emission values | Medium | Importers |
| No precursor tracking | Complex goods with multiple precursors not modeled | Medium | Chemical/steel importers |

---

### 3.3 Financial Risk Module (ECL + PCAF)

**Overall Rating: 8.0/10**
- Functionality: 8/10
- Data Coverage: 8/10
- Calculation Engine: 9/10
- User Experience: 7/10
- Output Quality: 7/10

**Strengths:**
- IFRS 9 ECL with 3-stage model (12-month, lifetime, credit-impaired)
- 9 Basel III/IV asset classes
- NGFS scenario overlays for climate-adjusted PD/LGD
- PCAF v2.0 with 10 asset classes and DQS 1-5 hierarchy
- WACI calculation (tCO2e per EUR M revenue)
- Temperature alignment scoring
- SFDR PAI indicator generation
- EBA GL/2022/16 compliant SICR triggers

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No EAD model | Exposure at Default not independently modeled (CCF missing) | High | Banks, CROs |
| No LGD downturn | Through-the-cycle vs point-in-time LGD not differentiated | Medium | Credit risk modelers |
| No portfolio concentration risk | HHI calculated but no Granularity Adjustment or name concentration | Medium | Portfolio managers |
| No PCAF Scope 3 financed emissions | Only Scope 1+2 financed; Scope 3 required for PCAF v2 enhanced | High | FI CSOs |
| No sovereign bond climate risk | Government bonds excluded from climate stress testing | Medium | Asset managers |
| No real estate mortgage granularity | Residential vs commercial mortgage EPC ratings not differentiated | Medium | Mortgage lenders |

---

### 3.4 Nature Risk Module (TNFD LEAP)

**Overall Rating: 5.5/10**
- Functionality: 6/10
- Data Coverage: 5/10
- Calculation Engine: 6/10
- User Experience: 5/10
- Output Quality: 5/10

**Strengths:**
- TNFD LEAP 4-phase framework (Locate/Evaluate/Assess/Prepare)
- Water risk scoring (WRI Aqueduct compatible)
- Biodiversity impact scoring (MSA, BII, species richness)
- Portfolio-level nature risk aggregation

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No PostGIS spatial queries | Float lat/lng only; cannot do polygon intersection, buffer analysis, or proximity queries | High | Nature risk analysts |
| No ENCORE integration | Ecosystem service dependency mapping not connected to ENCORE database | High | TNFD reporters |
| No IBAT/WDPA protected area overlay | Cannot identify assets near World Heritage Sites or Key Biodiversity Areas | High | Biodiversity analysts |
| No deforestation monitoring | No satellite/NDVI time-series for forest cover change detection | Medium | EUDR compliance |
| No ocean/marine risk | Coastal and marine ecosystem risk not modeled | Medium | Blue economy investors |
| No ecosystem service valuation | Cannot monetize natural capital dependencies | Medium | Impact investors |

---

### 3.5 Stranded Asset Calculator

**Overall Rating: 7.5/10**
- Functionality: 8/10
- Data Coverage: 7/10
- Calculation Engine: 8/10
- User Experience: 7/10
- Output Quality: 7/10

**Strengths:**
- Reserve impairment NPV under multiple scenarios
- Power plant IRR/breakeven analysis
- Infrastructure valuation (pipelines, refineries, LNG terminals)
- Technology disruption tracking (EV, H2, CCS)
- Portfolio-level stranding analysis
- 2-45yr horizons with carbon price paths

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No hydrogen-ready asset scoring | Cannot differentiate H2-compatible infrastructure from stranded | Medium | Energy companies |
| No CCS retrofit feasibility | Carbon capture retrofit costs not modeled per asset | Medium | Oil & gas |
| No just transition cost overlay | Worker retraining/community costs not linked to asset retirement | Medium | Governments, unions |

---

### 3.6 Sustainability Certification Module

**Overall Rating: 7.0/10**
- Functionality: 7/10
- Data Coverage: 8/10
- Calculation Engine: 7/10
- User Experience: 7/10
- Output Quality: 6/10

**Strengths:**
- 6 building certification frameworks (GRESB, LEED, BREEAM, WELL, NABERS, CASBEE)
- Rent premium modeling (2-20% by certification level)
- Operating cost savings quantification (8-10% reduction)
- Cap rate compression (15-70 bps)
- Portfolio-level sustainability scoring

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No CRREM alignment visualization | CRREM decarbonization pathways exist in engine but not in certification UI | High | RE investors |
| No EPC rating integration | Energy Performance Certificate data not linked to certification scores | Medium | EU property managers |
| No GRESB real-time scoring | Scores calculated once; no continuous monitoring/update | Medium | RE fund managers |

---

### 3.7 Regulatory Reporting Module

**Overall Rating: 6.0/10**
- Functionality: 7/10
- Data Coverage: 6/10
- Calculation Engine: 5/10
- User Experience: 5/10
- Output Quality: 4/10

**Strengths:**
- 14 regulatory panels (SFDR PAI, EU Taxonomy, TCFD, CSRD/ESRS, ISSB S1/S2, BRSR, UK TCFD, SEC Climate, APRA CPG 229, EU ETS, EUDR, GRI 305, SF Taxonomies)
- ESRS IG3 with 330+ quantitative data points from actual Excel
- ISSB SASB 20-sector industry metrics
- CSRD PDF extraction pipeline (8 real annual reports processed)
- Double materiality assessment framework
- Cross-sector entity registry (csrd_entity_registry bridge table)

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No XBRL export | Cannot generate ESEF/iXBRL tagged files for regulatory submission | Critical | EU companies (CSRD) |
| No disclosure completeness checker | Cannot validate that all mandatory ESRS data points are present | High | Report preparers |
| No regulatory change tracking | No notification when ESRS/ISSB requirements are updated | Medium | Compliance teams |
| No multi-year trend reporting | KPI values stored per year but no trend visualization or YoY comparison | Medium | Investor Relations |
| No assurance workflow | Assurance log exists but no workflow for auditor access/sign-off | High | External auditors |
| No CSRD digital taxonomy mapping | Data points not mapped to official EFRAG XBRL taxonomy | High | CSRD reporters |

---

### 3.8 Supply Chain Module

**Overall Rating: 6.5/10**
- Functionality: 7/10
- Data Coverage: 6/10
- Calculation Engine: 7/10
- User Experience: 6/10
- Output Quality: 5/10

**Strengths:**
- All 15 GHG Protocol Scope 3 categories
- 5 calculation methods (spend-based, average, hybrid, supplier-specific, physical)
- SBTi target setting and trajectory tracking
- Emission factor library (IEA/DEFRA/EPA/ecoinvent/IPCC)
- Supply chain tier mapping (Tier 1-3)
- Hotspot analysis and reduction opportunities

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No supplier portal | Cannot collect primary data from suppliers (only manual entry) | High | SC managers |
| No Tier 3+ deep network modeling | Only Tier 1-3; cascading supply chain impact not modeled | Medium | Manufacturing |
| No EUDR compliance module | Deforestation-free product tracing not integrated | High | EU importers |
| No circular economy metrics | Waste reduction, recycling rates, material circularity not tracked | Medium | Manufacturing |
| No supplier engagement scoring | Cannot track/score supplier decarbonization engagement quality | Medium | Procurement |

---

### 3.9 Portfolio Analytics Engine

**Overall Rating: 7.0/10**
- Functionality: 7/10
- Data Coverage: 7/10
- Calculation Engine: 8/10
- User Experience: 7/10
- Output Quality: 6/10

**Strengths:**
- Ported from mocked to real PostgreSQL (assets_pg)
- PCAF DQS 1-5 hierarchy with intelligent fallback
- Portfolio health scoring engine
- Alert engine with threshold monitoring
- Glidepath tracking (Paris alignment trajectory)
- Peer benchmarking with sector percentile ranking
- Export to PDF/Excel

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| No unified portfolio view | Carbon, PCAF, ECL, nature risk portfolios are separate data islands | High | Portfolio managers |
| No attribution analysis | Cannot decompose portfolio risk changes into factor contributions | High | Investment teams |
| No real-time data feeds | All portfolio data is batch-loaded; no live market data | Medium | Trading desks |
| No benchmark index comparison | Cannot compare portfolio against MSCI ESG Leaders, S&P Paris-Aligned | Medium | Fund managers |

---

### 3.10 Interactive Analytics Dashboard

**Overall Rating: 8.0/10**
- Functionality: 9/10
- Data Coverage: 7/10
- Calculation Engine: 8/10
- User Experience: 8/10
- Output Quality: 7/10

**Strengths:**
- 1,696 LOC with 5 analytical tabs
- Collapsible filter sidebar with multi-select scenarios
- What-If parameter studio (carbon price, interest rate, GDP, temperature target)
- Chart type switcher (bar/line/area/pie/radar)
- Risk heatmap (scenario x sector)
- Tornado chart, PD/LGD scatter, ECL by stage, WACI, Paris alignment
- Deterministic seed-based data generation (instant re-render on filter changes)

**Critical Gaps:**

| Gap | Description | Impact | Stakeholders |
|-----|-------------|--------|--------------|
| Deterministic seed data | Dashboard uses seed-based data generation, not real portfolio data | High | All users |
| No drill-down to asset level | Cannot click through from portfolio KPI to individual asset detail | Medium | Analysts |
| No export of chart state | Cannot save/share current filter + chart configuration | Medium | Report preparers |
| No annotation/commentary | Cannot add notes or commentary to dashboard views | Low | C-suite |

---

## 4. Cross-Functional Use Case Assessment

### Use Case 1: Full CSRD/ESRS Compliance Workflow

**Current Capability: 55%**

| Step | Module | Status | Gap |
|------|--------|--------|-----|
| Double materiality assessment | csrd_materiality_topics | Implemented | No stakeholder engagement workflow |
| Data collection (ESRS data points) | csrd_esrs_catalog + csrd_kpi_values | Implemented | Manual entry only; no data collection templates |
| PDF extraction from existing reports | csrd_extractor + csrd_ingest_service | Working (8 entities) | Regex-based; misses complex layouts |
| Calculation engine (climate metrics) | carbon_calculator_v2, ecl_climate_engine | Implemented | Not auto-linked to ESRS data points |
| Gap analysis vs ESRS requirements | csrd_gap_tracker | Implemented | No disclosure completeness % |
| Reporting (ESRS disclosure templates) | regulatory module, 14 panels | Frontend exists | No structured ESRS report generator |
| XBRL tagging | -- | Missing | Cannot submit to national authorities |
| Audit trail (assurance readiness) | csrd_assurance_log, audit_log | Partial | No auditor portal or sign-off workflow |

**Workflow Breaks:**
- Calculation outputs from carbon/ECL engines must be manually entered into CSRD KPI store
- No automated ESRS disclosure template population from calculated values
- No XBRL output = cannot complete regulatory submission

**Recommendation:** Build automated ESRS data point population pipeline from calculation engines; add XBRL export; create auditor read-only portal.

---

### Use Case 2: Bank Climate Transition Risk Assessment (EBA/ECB)

**Current Capability: 70%**

| Step | Module | Status | Gap |
|------|--------|--------|-----|
| Counterparty climate risk profiling | fi_entities + sector classification | Implemented | No NACE Rev.2 auto-classification |
| Scenario analysis (NGFS) | scenario_analysis_engine, ngfs_seeder | 6 NGFS scenarios implemented | No custom scenario overlay |
| Portfolio emissions (PCAF) | pcaf_waci_engine | DQS 1-5 hierarchy | No Scope 3 financed emissions |
| Credit risk adjustment (PD/LGD) | pd_calculator, lgd_calculator | Climate overlays per sector/scenario | No EAD model; no downturn LGD |
| ECL staging (IFRS 9) | ecl_climate_engine | 3-stage model | No vintage analysis |
| Pillar 3 disclosure | regulatory module | Template exists | No EBA ITS format export |
| Green Asset Ratio | fi_taxonomy_kpis | Table exists | Calculation not automated |

**Workflow Breaks:**
- PCAF portfolio emissions feed does not auto-update ECL climate overlays
- No automated Green Asset Ratio calculation from EU Taxonomy assessment
- Pillar 3 output cannot be exported in EBA ITS XML format

---

### Use Case 3: Supply Chain Decarbonization Program

**Current Capability: 45%**

| Step | Module | Status | Gap |
|------|--------|--------|-----|
| Supplier onboarding | sc_entities, supply_chain_tiers | Master data exists | No supplier self-service portal |
| Scope 3 Cat 1 calculation | supply_chain_scope3_engine | All 15 categories | Spend-based default; no primary data collection |
| Supplier engagement tracking | engagement_tracker | Route exists | No engagement scoring algorithm |
| Target setting (SBTi) | sbti_targets, sbti_trajectories | Implemented | No SBTi validation API integration |
| Supplier scorecard | -- | Missing | No supplier ESG scorecard generation |
| Progress tracking | sbti_trajectories | Year-by-year milestones | No supplier-level decomposition |

**Workflow Breaks:**
- Cannot collect primary emissions data from suppliers (no portal)
- Scope 3 calculation defaults to spend-based when supplier-specific data unavailable
- No supplier-level target allocation from portfolio SBTi target

---

### Use Case 4: ESG Data Room for Investors

**Current Capability: 50%**

| Step | Module | Status | Gap |
|------|--------|--------|-----|
| Climate metrics compilation | All calculators | Implemented | Not aggregated into single view |
| Investor-ready templates | export_service, report_generator | PDF/Excel export | No ESG questionnaire response templates |
| Peer benchmarking | peer_benchmark_engine | 3,502 LOC; sector percentiles | No external peer data (only internal) |
| Historical trends | csrd_kpi_values (year), pcaf_time_series | Partial | No multi-year trend visualization |
| ESG rating alignment | -- | Missing | No MSCI/Sustainalytics/S&P methodology mapping |

---

### Use Case 5: CBAM Compliance for EU Importers

**Current Capability: 60%**

| Step | Module | Status | Gap |
|------|--------|--------|-----|
| Product coverage identification | cbam_product_category (CN/HS codes) | Initial categories | No Phase 2 expansion (downstream goods) |
| Embedded emissions calculation | CBAMEmissionsCalculator (Scope 1+2) | Implemented | No precursor tracking for complex goods |
| Default vs actual values | -- | Partial | No comparison dashboard |
| Quarterly reporting | cbam_compliance_report | Table exists | No XML/PDF report generation for submission |
| Carbon cost estimation | CBAMCostProjector | Scenario-based | No real-time EU ETS price feed |
| Supplier data collection | cbam_supplier | Master data | No CBAM-specific data request workflow |

---

## 5. Data Schema & Analytics Enhancement Review

### 5.1 Data Model Assessment

**Strengths:**
- 120+ tables across 36 well-structured migrations
- Central bridge table (csrd_entity_registry) linking FI, Energy, SC entities
- Immutable audit_log with monthly partitioning and checksums
- JSONB columns for flexible scenario/assumption storage
- PostGIS extension enabled (migration 017)
- TimescaleDB hypertable candidates identified (migration 018)

**Limitations:**

| Issue | Severity | Description |
|-------|----------|-------------|
| No counterparty master table | P0 | Stranded asset/nature risk FKs point to nonexistent table |
| No soft-delete strategy | P0 | CASCADE deletes destroy historical data permanently |
| PostGIS not adopted | P1 | Extension enabled but spatial tables still use float lat/lng |
| TimescaleDB not activated | P1 | Hypertable creation SQL not executed |
| No version tracking on ESRS/ISSB DPs | P1 | Cannot track regulatory requirement changes across reporting years |
| PCAF attribution not normalized | P1 | investee_id -> company master link missing |
| Temperature scores disconnected | P2 | Two separate temperature calculation streams not linked |
| 40% of tables lack updated_at | P2 | Cannot track last modification time |

### 5.2 Data Gap Analysis

| Data Category | Current Coverage | Missing Elements | Recommended Sources |
|---------------|-----------------|------------------|---------------------|
| Emissions Factors | Regional grid (15 countries), IPCC 8 fuels | Product-specific LCA, real-time grid EF | ecoinvent 3.10, DEFRA 2025, Electricity Maps API |
| Physical Risk | Basic flood/wildfire scoring | Chronic risk (drought, heat stress, sea level rise), probabilistic models | WRI Aqueduct 4.0, JBA Risk, XDI, Munich Re NatCat |
| Biodiversity | MSA, BII, species richness scores | Protected area proximity, deforestation alerts, ecosystem service valuation | IBAT, WDPA, Global Forest Watch, ENCORE |
| Carbon Pricing | EU ETS default, CBAM projections | Real-time ETS/CCA prices, voluntary market prices | ICE, Refinitiv, Verra, Gold Standard registries |
| Peer Benchmarks | Internal portfolio benchmarks | External sector benchmarks, ESG rating distributions | MSCI ESG Research, S&P Global Trucost, CDP |
| Supply Chain | Tier 1-3 supplier mapping | Deep supply chain networks, transport routes, water dependencies | Ecovadis, CDP Supply Chain, TradeLens |
| Real Estate | 12 US regions, 5 property types | Global markets, EPC data, renovation cost databases | CRREM, EPC registers, RS Means International |

### 5.3 Analytics Enhancement Roadmap

| Capability | Business Value | Complexity | Priority |
|------------|---------------|------------|----------|
| Predictive emissions forecasting (ARIMA/Prophet) | Proactive SBTi target management | Medium | Q2 2026 |
| Automated double materiality scoring (NLP on annual reports) | 70% reduction in manual assessment | Medium | Q2 2026 |
| Physical risk geographic heatmaps (PostGIS + Mapbox) | Visual CRO decision support | Medium | Q2 2026 |
| AI-powered CSRD PDF extraction (LLM upgrade from regex) | 10x faster entity onboarding | Medium | Q3 2026 |
| Supply chain network graph visualization (D3.js force layout) | Identify concentration and cascading risks | Low | Q3 2026 |
| Portfolio attribution analysis (Brinson-Fachler for ESG) | Investment team decision support | High | Q3 2026 |
| Automated gap analysis vs regulatory requirements | Real-time compliance status | Low | Q2 2026 |
| Statistical peer benchmarking (z-scores, percentile ranking) | Investor-grade positioning | Low | Q2 2026 |

---

## 6. Stakeholder-Specific Recommendations

### For Large Energy Companies

**Focus Areas:**
- Stranded asset retirement scheduling with just transition cost overlays
- CSRD E1-E5 pillar completion (all 5 environmental ESRS topics)
- Scope 1+2 facility-level emission tracking
- CRREM decarbonization pathway alignment for real assets

**Quick Wins:**
- Wire CRREM engine output to sustainability certification UI (1 week)
- Add generation mix YoY trend chart to energy entity dashboard (1 week)
- Export stranded asset register as Board-ready PDF with scenario commentary (2 weeks)

**Strategic Additions:**
- Methane emission monitoring (OGMP 2.0 framework) (2 months)
- Renewable pipeline IRR calculator with subsidy scenarios (1 month)
- Physical risk overlay on asset map (PostGIS adoption) (1 month)

### For Financial Institutions

**Focus Areas:**
- EAD model completion (CCF by asset class)
- PCAF Scope 3 financed emissions
- Green Asset Ratio automated calculation
- EBA Pillar 3 ESG ITS export format
- Counterparty-level climate risk scoring

**Quick Wins:**
- Link PCAF portfolio emissions to ECL climate overlay inputs (2 weeks)
- Auto-calculate Green Asset Ratio from EU Taxonomy assessments (2 weeks)
- Add portfolio-level Paris alignment gauge to dashboard (1 week)

**Strategic Additions:**
- Real-time credit decision API (PD adjustment per counterparty + scenario) (2 months)
- Mortgage portfolio EPC stratification and CRREM alignment (6 weeks)
- Sovereign bond climate risk module (NGFS GDP impacts) (2 months)

### For SMEs (Manufacturing / Supply Chain)

**Focus Areas:**
- Simplified Scope 3 Category 1 calculator (spend-based with industry averages)
- CBAM compliance for EU exports (embedded emissions + quarterly reporting)
- Supplier data collection templates (Excel/CSV)
- SBTi near-term target calculator

**Quick Wins:**
- Create simplified Scope 3 calculator page with 5 input fields (1 week)
- Generate CBAM quarterly report PDF from existing calculation (2 weeks)
- Provide downloadable supplier data collection Excel template (3 days)

**Strategic Additions:**
- Supplier self-service portal for primary data submission (3 months)
- Circular economy metrics tracker (waste, recycling, material flows) (2 months)
- EUDR product-level deforestation tracing (3 months)

---

## 7. Competitive Positioning

### Feature Parity Gaps

| Competitor | Feature | Gap in Platform | Importance |
|------------|---------|-----------------|------------|
| Workiva | XBRL/iXBRL tagging for ESRS | No XBRL export | Critical for EU |
| Persefoni | Automated Scope 3 data collection (supplier portal) | Manual entry only | High |
| Watershed | Real-time carbon accounting with ERP integration | Batch-only, no ERP connectors | High |
| MSCI ESG Manager | ESG rating methodology alignment | No rating agency mapping | Medium |
| Sphera | Product LCA carbon footprinting | No product-level LCA | Medium |
| Ecovadis | Supplier ESG scorecards with benchmarking | No supplier scoring | Medium |
| WRI Aqueduct | Interactive water risk mapping | No spatial analysis (no PostGIS) | Medium |
| CDP Disclosure | Questionnaire response automation | No CDP template integration | Medium |

### Differentiation Opportunities

| Opportunity | Why It Matters | Effort |
|-------------|---------------|--------|
| 43 CDM tools as standalone API | No competitor offers CDM tools as a service | Done |
| 105-activity guide for carbon credits | Unique accessibility layer for non-experts | Done |
| Unified cross-module entity registry | Single entity ID across all ESG dimensions (unique architecture) | Partial |
| AI-powered CSRD extraction from PDFs | Automated onboarding of any company from public reports | Medium |
| Integrated climate + nature + social risk | Most competitors are single-pillar; triple-bottom-line is rare | High |
| Real-time What-If parameter studio | Live recalculation beats static report tools | Done |
| Sector-specific calculators (mining, agriculture, shipping, steel, green H2) | Deep vertical coverage vs horizontal-only platforms | Done |

---

## 8. Prioritized Product Roadmap

### Immediate (Next 4 weeks) -- P0

| # | Item | Category | Effort | Owner |
|---|------|----------|--------|-------|
| 1 | Enforce RBAC on all 731 API endpoints | Security | 2 weeks | Backend |
| 2 | Rotate hardcoded secrets; move to env vars | Security | 2 days | DevOps |
| 3 | Add global error boundary to React app | Frontend | 2 days | Frontend |
| 4 | Create GitHub Actions CI pipeline (lint + test + type check) | DevOps | 1 week | DevOps |
| 5 | Add rate limiting (slowapi) on POST/calculation endpoints | Security | 3 days | Backend |
| 6 | Integrate Sentry for error monitoring (backend + frontend) | Observability | 3 days | Full stack |
| 7 | Wire PCAF portfolio emissions to ECL climate overlay | Integration | 1 week | Backend |
| 8 | Replace BackgroundTasks with Celery + Redis for CSRD extraction | Infrastructure | 2 weeks | Backend |

### Short-term (Q2 2026) -- P1

| # | Item | Category | Effort | Owner |
|---|------|----------|--------|-------|
| 1 | XBRL/iXBRL export for CSRD/ISSB regulatory submission | Compliance | 4 weeks | Backend |
| 2 | Adopt PostGIS for spatial queries; migrate nature risk tables | Data | 3 weeks | Backend + DB |
| 3 | Unified Entity 360 dashboard (cross-module KPI view) | Frontend | 3 weeks | Full stack |
| 4 | Automated ESRS disclosure completeness checker | Compliance | 2 weeks | Backend |
| 5 | EAD model (Credit Conversion Factors by asset class) | Financial Risk | 2 weeks | Backend |
| 6 | Predictive emissions forecasting (time-series ML) | Analytics | 3 weeks | Data Science |
| 7 | CBAM quarterly report PDF generation | Compliance | 2 weeks | Backend |
| 8 | Command palette (Cmd+K) with global search | UX | 1 week | Frontend |
| 9 | Add structured logging (JSON) + request/response middleware | Observability | 1 week | Backend |
| 10 | Counterparty master table creation + FK alignment | Data | 2 weeks | Backend + DB |

### Medium-term (H2 2026) -- P2

| # | Item | Category | Effort | Owner |
|---|------|----------|--------|-------|
| 1 | Supplier self-service portal for Scope 3 data collection | Supply Chain | 8 weeks | Full stack |
| 2 | AI-powered CSRD PDF extraction (LLM upgrade from regex) | AI/ML | 6 weeks | Backend |
| 3 | Physical risk geographic heatmaps (PostGIS + Mapbox GL) | Nature Risk | 4 weeks | Full stack |
| 4 | ESG rating agency methodology mapping (MSCI, S&P, Sustainalytics) | Investor Relations | 4 weeks | Backend |
| 5 | Portfolio attribution analysis (Brinson-Fachler for ESG factors) | Analytics | 4 weeks | Backend |
| 6 | EBA Pillar 3 ESG ITS XML export | Compliance | 3 weeks | Backend |
| 7 | Webhook/event system for external integrations | Architecture | 4 weeks | Backend |
| 8 | Mobile-responsive executive dashboard | UX | 3 weeks | Frontend |
| 9 | Redis caching layer for portfolio analytics queries | Performance | 2 weeks | Backend |
| 10 | CDP questionnaire response automation | Compliance | 4 weeks | Full stack |

### Long-term (2027+) -- P3

| # | Item | Category | Effort | Owner |
|---|------|----------|--------|-------|
| 1 | Real-time market data feeds (carbon prices, ETS, credit registries) | Data | 8 weeks | Backend |
| 2 | Multi-tenant SaaS architecture with per-org data isolation | Architecture | 12 weeks | Full stack |
| 3 | NLP-powered automated materiality assessment from news/reports | AI/ML | 8 weeks | Data Science |
| 4 | Sovereign bond climate risk module (NGFS GDP impacts) | Financial Risk | 6 weeks | Backend |
| 5 | Product-level LCA carbon footprinting (ecoinvent integration) | Carbon | 8 weeks | Backend |
| 6 | EUDR product-level deforestation tracing | Compliance | 8 weeks | Full stack |
| 7 | Circular economy metrics module (waste, recycling, material flows) | Sustainability | 6 weeks | Full stack |
| 8 | Kubernetes deployment with auto-scaling | Infrastructure | 6 weeks | DevOps |

---

## Infrastructure Readiness Scorecard

```
+------------------------------------------------------------------+
| COMPONENT                        | SCORE  | STATUS                |
+------------------------------------------------------------------+
| Domain Coverage (70 services)    | 85%    | Excellent             |
| Calculation Engine Accuracy      | 80%    | Strong                |
| Database Architecture            | 75%    | Good (120+ tables)    |
| Frontend UX/Design               | 70%    | Good (shadcn/Radix)   |
| API Surface (731 endpoints)      | 65%    | Broad but inconsistent|
| Data Quality Framework           | 55%    | PCAF DQS implemented  |
| Testing (31 files, 195 tests)    | 50%    | Partial coverage      |
| Export/Reporting                  | 45%    | PDF/Excel only        |
| Authentication/RBAC              | 15%    | JWT exists, unenforced|
| Error Monitoring                 | 5%     | None                  |
| CI/CD Pipeline                   | 0%     | None                  |
| Caching/Performance              | 10%    | lru_cache only        |
| Rate Limiting                    | 0%     | None                  |
| Background Task Queue            | 15%    | In-memory only        |
+------------------------------------------------------------------+
| OVERALL PRODUCTION READINESS     | 41%    | DEVELOPMENT STAGE     |
+------------------------------------------------------------------+
```

---

**Report prepared by Multi-Stakeholder Review Council**
**Assessment date: 2026-03-08**
**Next review scheduled: Q2 2026 (post-P0 remediation)**
