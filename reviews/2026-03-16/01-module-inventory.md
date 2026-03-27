# Module Inventory — A2 Intelligence
## Date: 2026-03-16

---

## Platform Scale Summary

| Metric | Count |
|--------|-------|
| **Backend Service Files** | 158 |
| **Backend Route Files** | 137 |
| **Alembic Migrations** | 54 (001-054) |
| **Middleware Layers** | 5 (CORS, RateLimit, RequestLogger, Auth, Audit) |
| **Frontend Feature Dirs** | ~30+ |
| **Frontend Routes** | ~70 |
| **Frontend Nav Items** | ~65 |
| **Total Backend Python LOC** | ~110,936 (services only) |
| **DB Tables (estimated)** | 200+ |
| **Lineage Modules** | ~73 |
| **Lineage Edges** | ~229 |
| **Registered FastAPI Routers** | ~137 |

---

## Module Inventory by Review Bucket

### 1. COMPLIANCE & REPORTING

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| CSRD/ESRS Reporting | csrd_entity_service.py, esrs_*.py | ~2,500 | Complete | CRITICAL |
| SFDR PAI (Art 4) | sfdr_pai_engine.py | 2,044 | Complete | CRITICAL |
| EU Taxonomy | eu_taxonomy_engine.py | 1,152 | Complete | HIGH |
| ISSB S1/S2 | issb_*.py, sasb_industry_engine.py | ~1,800 | Complete | HIGH |
| Regulatory Report Compiler | regulatory_report_compiler.py | 1,543 | Complete | HIGH |
| XBRL Export/Ingestion | xbrl_export_service.py, xbrl_ingest_service.py | ~800 | Complete | HIGH |
| SEC Climate Disclosure | sec_climate_engine.py | ~530 | Complete | MEDIUM |
| BRSR (India) | asia_regulatory_engine.py | ~650 | Complete | MEDIUM |
| Double Materiality | double_materiality_engine.py | 1,525 | Complete | HIGH |
| Peer Benchmark | peer_benchmark_engine.py | 3,502 | Complete | HIGH |
| Disclosure Frameworks (TNFD/CDP/GRI) | tnfd_assessment_engine.py, cdp_scoring_engine.py | ~2,100 | Complete | HIGH |

### 2. CARBON ACCOUNTING & EMISSIONS

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| Carbon Calculator v1+v2 | carbon_calculator.py, carbon_calculator_v2.py | ~1,200 | Complete | CRITICAL |
| Methodology Engine (56 CDM/VCS) | methodology_engine.py | 1,611 | Complete | HIGH |
| CDM Tools | cdm_tools_engine.py | 2,537 | Complete | MEDIUM |
| Activity Guide Catalog | activity_guide_catalog.py | 6,218 | Complete | MEDIUM |
| Facilitated Emissions (PCAF C) | facilitated_emissions_engine.py | ~700 | Complete | HIGH |
| Insurance Emissions (PCAF B) | insurance_emissions_engine.py | ~500 | Complete | HIGH |
| PCAF Quality Engine | pcaf_quality_engine.py | 1,631 | Complete | HIGH |
| CBAM Calculator | cbam_calculator.py | ~800 | Complete | HIGH |

### 3. CLIMATE RISK & SCENARIO ANALYSIS

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| Physical Risk Engine | climate_physical_risk_engine.py | 1,154 | Complete | CRITICAL |
| Transition Risk Engine | climate_transition_risk_engine.py | 1,345 | Complete | CRITICAL |
| Scenario Analysis Engine | scenario_analysis_engine.py | 1,084 | Complete | HIGH |
| ECL Climate Engine | ecl_climate_engine.py | 1,303 | Complete | CRITICAL |
| Monte Carlo Simulation | monte_carlo_engine.py | ~600 | Complete | HIGH |
| Stress Test Runner | stress_test_runner.py | ~500 | Complete | HIGH |
| Sovereign Climate Risk | sovereign_climate_risk_engine.py | ~430 | Complete | MEDIUM |

### 4. NATURE / BIODIVERSITY

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| Nature Risk Calculator | nature_risk_calculator.py | 980 | Partial (no PostGIS) | HIGH |
| TNFD Assessment | tnfd_assessment_engine.py | 1,096 | Complete | HIGH |

### 5. MATERIALITY & STAKEHOLDER

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| Double Materiality Engine | double_materiality_engine.py | 1,525 | Complete | CRITICAL |
| DME Velocity Engine | dme_velocity_engine.py | ~190 | Complete | HIGH |
| DME Alert Engine | dme_alert_engine.py | ~185 | Complete | HIGH |
| DME DMI Engine | dme_dmi_engine.py | ~195 | Complete | HIGH |
| DME Contagion Engine | dme_contagion_engine.py | ~250 | Complete | MEDIUM |
| DME Greenwashing Engine | dme_greenwashing_engine.py | ~195 | Complete | MEDIUM |
| DME NLP Pulse Engine | dme_nlp_pulse_engine.py | ~195 | Complete | MEDIUM |
| DME Policy Tracker | dme_policy_tracker_engine.py | ~210 | Complete | MEDIUM |
| DME Factor Registry | dme_factor_registry.py | ~550 | Complete | HIGH |
| Sentiment Analysis Engine | sentiment_analysis_engine.py | ~600 | Complete | HIGH |
| Engagement Tracker | engagement_tracker.py | ~400 | Complete | MEDIUM |
| CA100+ Benchmark | ca100_benchmark_engine.py | ~500 | Complete | MEDIUM |

### 6. SUPPLY CHAIN ESG

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| EUDR Compliance | eudr_engine.py | 1,045 | Complete | HIGH |
| CSDDD (EU) | csddd_engine.py | ~520 | Complete | HIGH |
| Supply Chain Scope 3 | supply_chain_engine.py | ~600 | Complete | HIGH |
| China Trade Platform | china_trade_engine.py | 1,606 | Complete | MEDIUM |

### 7. FINANCE / SECTOR-SPECIFIC

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| Portfolio Analytics v2 | portfolio_analytics_engine_v2.py | 1,980 | Complete (DB-backed) | CRITICAL |
| Basel Capital Engine | basel_capital_engine.py | 1,688 | Complete | HIGH |
| Stranded Asset Calculator | stranded_asset_calculator.py | 1,757 | Complete | HIGH |
| Unified Valuation Engine | unified_valuation_engine.py | 1,603 | Complete | HIGH |
| RE Portfolio Engine | re_portfolio_engine.py | 1,133 | Complete | HIGH |
| Factor Overlay Engine | factor_overlay_engine.py | 1,414 | Complete | HIGH |
| Asset Management Engine | am_engine.py | ~800 | Complete | HIGH |
| Agriculture Risk | agriculture_risk_calculator.py | ~600 | Complete | MEDIUM |
| Technology Risk Engine | technology_risk_engine.py | 986 | Complete | MEDIUM |
| Model Validation Framework | model_validation_framework.py | 1,013 | Complete | HIGH |
| Transition Plan Engine | transition_plan_engine.py | 1,130 | Complete | HIGH |

### 8. PLATFORM / INTEGRATION / SECURITY

| Module | Service File | LOC | Completeness | Business Criticality |
|--------|-------------|-----|--------------|---------------------|
| Data Lineage Service | data_lineage_service.py | 2,882 | Complete | HIGH |
| Lineage Orchestrator | lineage_orchestrator.py | ~550 | Complete | HIGH |
| Entity Resolution | entity_resolution_service.py | ~400 | Complete | HIGH |
| Auth Middleware | middleware/auth_middleware.py | ~150 | Complete | CRITICAL |
| Audit Middleware | middleware/audit_middleware.py | ~264 | Complete | CRITICAL |
| Rate Limiter | middleware/rate_limiter.py | ~100 | Complete | HIGH |
| Request Logger | middleware/request_logger.py | ~80 | Complete | MEDIUM |
| Error Handler | middleware/error_handler.py | ~100 | Complete | MEDIUM |
| Auth Dependencies (RBAC) | api/dependencies.py | 175 | Complete | CRITICAL |
| Enrichment Service | enrichment_service.py | ~300 | Complete | MEDIUM |
| Ingestion Pipeline | ingestion/ (directory) | ~500 | Partial | HIGH |
| Scheduled Reports | scheduled_reports_service.py | ~300 | Partial | MEDIUM |

---

## Top 10 Modules to Review First

| Rank | Module | Reason |
|------|--------|--------|
| 1 | **Portfolio Analytics v2 + ECL** | Core revenue-generating engine; if this fails, no product |
| 2 | **CSRD/ESRS Reporting** | Highest regulatory urgency (2025-2026 EU mandates) |
| 3 | **Auth + RBAC + Audit** | Enterprise deployment gate; already built but needs verification |
| 4 | **Scenario Analysis + Stress Testing** | Differentiator; connects to 10+ downstream modules |
| 5 | **SFDR PAI + Double Materiality** | Mandatory for EU fund managers (Art 4 RTS) |
| 6 | **Carbon Calculator v2 + PCAF** | Foundational for all emissions-based modules |
| 7 | **DME Velocity + Contagion + Sentiment** | Newest integration; highest novelty and differentiation risk |
| 8 | **Data Lineage + Entity Resolution** | Platform backbone; determines data quality propagation |
| 9 | **Factor Overlay Engine + Registry** | Cross-cutting; affects all module outputs |
| 10 | **Regulatory Report Compiler + XBRL** | Export/delivery layer; where users extract value |

---

## High-Risk Blind Spots

1. **Test Coverage**: No test files detected in the codebase. Zero automated tests = zero regression safety. Any code change risks breaking downstream modules silently.

2. **CORS Wide Open**: `allow_origins=["*"]` — fine for dev, critical vulnerability for production. Any website can make authenticated requests.

3. **Auth Enforcement Coverage**: Auth middleware and RBAC dependencies exist, but unclear how many of the 137 route files actually USE `Depends(get_current_user)` vs. being fully open.

4. **DB Query vs. In-Memory Split**: 25/158 services use DB sessions. The rest compute in-memory with seed/demo data. This means ~84% of modules have no persistent state — fine for calculations, but users can't save results.

5. **No CI/CD Pipeline**: No GitHub Actions, no test runner config, no deployment scripts detected.

6. **Supabase Single-Point**: All data in one Supabase instance with connection string in .env. No backup strategy, no read replicas, no connection pooling config visible.

7. **Frontend API Wiring**: Many frontend pages use seed-based deterministic data. Need to verify how many pages actually call backend APIs vs. generating fake data client-side.

8. **No Webhook/Event System**: 73 modules with 229 edges in the lineage graph, but no actual event propagation system. Modules can't notify each other of changes.

9. **Migration Ordering Risk**: 54 migrations with at least one prior stale-head incident (029 stale row). Future migrations could conflict.

10. **Single-Developer Risk**: 729 commits, no PR review process, no code review gates. Bus factor = 1.
