# Cross-Functional Use Case Assessment — A2 Intelligence
## Date: 2026-03-16

---

## Use Case 1: Full CSRD/ESRS Compliance Workflow

**Target Workflow**: Company registers entity → runs double materiality assessment → maps material topics to ESRS standards → collects 330 quantitative data points → generates XBRL-tagged disclosure → produces PDF report with gap analysis → submits to regulator.

**Modules Participating**: csrd_entity_service, double_materiality_engine, esrs_* (14 ESRS datapoint tables), xbrl_export_service, regulatory_report_compiler, csrd_ingest_service, peer_benchmark_engine, disclosure_completeness, gap_tracker.

**Current Capability**: MOSTLY COMPLETE
- Entity registry: YES (csrd_entity_registry table + service)
- Double materiality: YES (1,525 LOC engine with EFRAG IG1 methodology)
- ESRS data points: YES (330 quantitative DPs across 14 tables from migration 014)
- XBRL export: YES (routes exist for generate + parse)
- Gap analysis: YES (csrd_gap_tracker table)
- Peer benchmarking: YES (3,502 LOC engine)
- PDF report upload/extraction: YES (migration 016, csrd_report_uploads)

**Workflow Breaks**:
- Data collection forms for 330 DPs not wired on frontend
- No workflow state machine (draft → review → approved → submitted)
- No assurance workflow (internal → limited → reasonable assurance)
- XBRL validation against ESRS taxonomy not confirmed
- No PDF report GENERATION (only extraction from uploaded PDFs)

**Operational Friction**: HIGH — user must manually collect data outside the app, then enter it
**Auditability**: GOOD (audit_log middleware captures all writes, entity registry tracks lineage)
**Differentiation Value**: VERY HIGH — automated CSRD with gap highlighting saves €200-500K/year per entity

**Recommendation**: Build data collection wizard + workflow state machine + report generation template.

---

## Use Case 2: Bank Climate Transition Risk Assessment

**Target Workflow**: Bank defines credit portfolio → assigns NACE sectors → runs transition risk scenarios (NGFS) → calculates climate-adjusted PD/LGD → produces ECL overlays → generates regulatory report → stress tests under multiple scenarios.

**Modules Participating**: portfolio_analytics_engine_v2, climate_transition_risk_engine, ecl_climate_engine, scenario_analysis_engine, stress_test_runner, basel_capital_engine, factor_overlay_engine, sovereign_climate_risk_engine, dme_velocity_engine, dme_alert_engine.

**Current Capability**: MOSTLY COMPLETE
- Portfolio management: YES (DB-backed CRUD, 1,980 LOC)
- Transition risk: YES (1,345 LOC with NGFS v2 scenarios)
- ECL climate: YES (1,303 LOC with PD/LGD/EAD adjustments)
- Scenario analysis: YES (1,084 LOC with 5 NGFS scenarios)
- Stress testing: YES
- Basel capital: YES (1,688 LOC)
- Factor overlay: YES (1,414 LOC with 31 registries)

**Workflow Breaks**:
- Portfolio data must be entered manually (no CSV import for loan books)
- No batch processing for large portfolios (1000+ exposures)
- Scenario comparison dashboard exists but may use seed data on frontend
- No regulatory report template for EBA/PRA climate stress test submissions

**Operational Friction**: MEDIUM
**Auditability**: GOOD (lineage tracks data flow, audit middleware logs all operations)
**Differentiation Value**: HIGH — combines ECL + transition + contagion + sentiment in one platform

**Recommendation**: Add CSV portfolio import + batch processing + EBA stress test report template.

---

## Use Case 3: Supply Chain Decarbonization

**Target Workflow**: Company maps supply chain → identifies Scope 3 hotspots → screens for EUDR/CSDDD compliance → calculates supplier-level emissions → sets SBTi targets → tracks trajectory → flags non-compliant suppliers.

**Modules Participating**: supply_chain_engine, eudr_engine, csddd_engine, carbon_calculator_v2, sbti_target_engine, agriculture_risk_calculator, dme_greenwashing_engine, sentiment_analysis_engine.

**Current Capability**: PARTIAL
- Scope 3 categories: YES (supply_chain_engine)
- EUDR screening: YES (7 commodities, 63 HS codes, 55 countries)
- CSDDD due diligence: YES (18 adverse impact categories)
- SBTi targets: YES (trajectory calculation)
- Greenwashing detection: YES (CUSUM divergence)

**Workflow Breaks**:
- No supplier onboarding/self-assessment portal
- No automated supply chain mapping from procurement data
- Traceability verification requires manual geolocation input
- No supplier scoring dashboard aggregating all compliance checks

**Operational Friction**: HIGH
**Differentiation Value**: MEDIUM (many competitors in supply chain ESG)

**Recommendation**: Defer — focus on bank/insurer workflows first.

---

## Use Case 4: ESG Investor Data Room

**Target Workflow**: Fund manager creates SFDR-classified fund → calculates PAI indicators → produces pre-contractual/periodic disclosures → benchmarks against peers → provides investor-ready ESG data room.

**Modules Participating**: sfdr_pai_engine, eu_taxonomy_engine, portfolio_analytics_engine_v2, peer_benchmark_engine, fund_management_engine, double_materiality_engine, regulatory_report_compiler.

**Current Capability**: MOSTLY COMPLETE
- SFDR PAI: YES (2,044 LOC, full Art 4 RTS implementation)
- EU Taxonomy: YES (1,152 LOC)
- Fund management: YES (LP analytics, exclusion screening)
- Peer benchmark: YES (3,502 LOC)

**Workflow Breaks**:
- No pre-contractual disclosure template (SFDR Annex II/III)
- No periodic reporting template (SFDR Art 11)
- No data room sharing/export functionality
- No investor self-service portal

**Operational Friction**: MEDIUM
**Differentiation Value**: HIGH — fund managers spend 3-6 months on SFDR disclosures

**Recommendation**: Build SFDR Annex templates + data room export.

---

## Use Case 5: CBAM Compliance

**Target Workflow**: Importer identifies CBAM-goods → calculates embedded emissions → determines CBAM certificates needed → tracks quarterly declarations → links to EU ETS prices.

**Modules Participating**: cbam_calculator, carbon_calculator_v2, eu_taxonomy_engine.

**Current Capability**: COMPLETE
- Articles 7, 21, 31: YES (fully implemented)
- Embedded emissions: YES
- Certificate calculation: YES

**Workflow Breaks**:
- No quarterly declaration workflow
- No EU ETS price feed integration
- No supplier data collection forms

**Operational Friction**: MEDIUM
**Differentiation Value**: MEDIUM

---

## Use Case 6: Climate Risk-Adjusted Credit Decisioning

**Target Workflow**: Loan officer receives application → system runs climate risk overlay on standard PD → factors in physical + transition risk → adjusts LGD for stranded assets → produces climate-adjusted ECL → generates risk memo.

**Modules Participating**: ecl_climate_engine, climate_physical_risk_engine, climate_transition_risk_engine, stranded_asset_calculator, factor_overlay_engine, dme_velocity_engine, sentiment_analysis_engine, model_validation_framework.

**Current Capability**: MOSTLY COMPLETE
- Climate ECL: YES (1,303 LOC)
- Physical risk: YES (1,154 LOC)
- Transition risk: YES (1,345 LOC)
- Stranded assets: YES (1,757 LOC)
- Model validation: YES (1,013 LOC)
- Sentiment overlay: YES (PD ±15% adjustment)

**Workflow Breaks**:
- No credit application workflow/form
- No integration with core banking systems
- No risk memo generation template
- Single-entity assessment only (no batch)

**Operational Friction**: HIGH (requires manual data entry for each counterparty)
**Differentiation Value**: VERY HIGH — regulators (EBA, PRA) requiring climate in credit processes

**Recommendation**: Build credit application form + batch assessment + risk memo template.

---

## Use Case 7: Stranded Asset Identification & Valuation

**Target Workflow**: Analyst identifies asset portfolio → classifies by energy type → runs stranding probability models → calculates write-down scenarios → factors in tech disruption → produces impairment analysis.

**Modules Participating**: stranded_asset_calculator, unified_valuation_engine, technology_risk_engine, scenario_analysis_engine, factor_overlay_engine.

**Current Capability**: COMPLETE
- Reserves, power plants, infrastructure: YES (1,757 LOC)
- Tech disruption filters: YES
- Valuation: YES (income/cost/sales comparison)

**Workflow Breaks**:
- No batch asset upload
- Results not persisted (in-memory calculation)

---

## Ranked Summary

| Use Case | Completeness | Business Value | Difficulty | Priority |
|----------|-------------|---------------|------------|----------|
| CSRD/ESRS Compliance | Mostly Complete | VERY HIGH | Medium | **P0** |
| Climate Credit Decisioning | Mostly Complete | VERY HIGH | Medium | **P1** |
| ESG Investor Data Room | Mostly Complete | HIGH | Medium | **P1** |
| Bank Transition Risk | Mostly Complete | HIGH | Low | **P1** |
| CBAM Compliance | Complete | MEDIUM | Low | **P2** |
| Stranded Asset Valuation | Complete | MEDIUM | Low | **P2** |
| Supply Chain Decarb | Partial | MEDIUM | High | **P3** |
