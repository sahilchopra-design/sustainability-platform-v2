# Data Catalog — Sustainability & Risk Analytics Platform

**Version:** 1.0 | **Date:** 2026-03-16 | **Status:** Live

---

## Executive Summary

This data catalog documents the complete data architecture of the Sustainability & Risk Analytics Platform — a FastAPI (Python) + React (JavaScript) application backed by PostgreSQL (Supabase). The platform spans 30+ analytical modules across climate risk, regulatory compliance, portfolio analytics, carbon accounting, and nature risk. It serves 12 named personas across Finance, Energy, Manufacturing, and Supply Chain sectors.

The catalog covers:
- Platform architecture and technology stack
- Persona registry (12 users across 4 sectors)
- Module inventory with DB table mappings and migration references
- Persona-to-module data coverage matrix
- API endpoint directory
- Data quality scoring (PCAF DQS scale)

All database tables are provisioned via 52 Alembic migration files (001–052) applied to Supabase PostgreSQL.

---

## 1. Platform Architecture

| Attribute | Detail |
|---|---|
| Backend Framework | FastAPI (Python) |
| Frontend Framework | React (JavaScript) |
| Database | PostgreSQL via Supabase |
| ORM / Migrations | SQLAlchemy + Alembic (52 migration files, 001–052) |
| Authentication | Deferred (auth.py scaffolded, not enforced) |
| Source Files | 437+ |
| Git Commits | 729+ |
| Primary Branch | main |
| Repo | sahilchopra-design/sustainability-platform (Private) |

### Technology Composition

| Layer | Technology | Share |
|---|---|---|
| Backend | Python (FastAPI, SQLAlchemy, Pydantic) | ~62% |
| Frontend | JavaScript (React, Recharts, Axios) | ~38% |

### Known Architectural Constraints

| Constraint | Status |
|---|---|
| Authentication / RBAC | Not enforced — deferred |
| Audit trail (audit_log table) | Partial — migration 010 adds audit_log; no UI wired |
| Cross-module FK linkage | Migration 042 adds company_profile_id FKs on 5 entity tables |
| Spatial queries (PostGIS) | Not enabled — lat/lng stored as float columns |
| Time-series architecture (TimescaleDB) | Not implemented |

---

## 2. Persona Registry

The platform is designed around 12 named personas spanning four sectors. Each persona is associated with a specific entity and role, driving the seed data and module access patterns.

| Persona ID | Name | Role Type | Sector | Entity |
|---|---|---|---|---|
| EU_BANK_INVESTMENT_LEAD | Thomas Krieger | Investment Lead | Finance | FirstEuro Bank AG |
| EU_BANK_ANALYTICS_LEAD | Priya Sharma | Analytics Lead | Finance | FirstEuro Bank AG |
| EU_BANK_SUSTAINABILITY_LEAD | Ingrid Larsen | Sustainability Lead | Finance | FirstEuro Bank AG |
| UTILITY_INVESTMENT_LEAD | Lars Andersen | Investment Lead | Energy | NordWind AG |
| UTILITY_ANALYTICS_LEAD | Sofie Hansen | Analytics Lead | Energy | NordWind AG |
| OIL_GAS_SUSTAINABILITY_LEAD | James McAllister | Sustainability Lead | Energy | AtlanticPetroleum plc |
| MANUFACTURER_ANALYTICS_LEAD | Klaus Weber | Analytics Lead | Manufacturing | EuroAuto GmbH |
| RETAILER_SUSTAINABILITY_LEAD | Marie Dubois | Sustainability Lead | Supply Chain | PanEuro Retail SA |
| MANUFACTURER_INVESTMENT_LEAD | Sofia Russo | Investment Lead | Manufacturing | EuroAuto GmbH |
| STEEL_ANALYTICS_LEAD | Erik Johansson | Analytics Lead | Manufacturing | EuroSteel AG |
| PHARMA_SUSTAINABILITY_LEAD | Nadia Hassan | Sustainability Lead | Supply Chain | PharmaCo BV |
| REAL_ESTATE_INVESTMENT_LEAD | Henrik Müller | Investment Lead | Finance | PropFund AG |

---

## 3. Module Inventory

### 3.1 Module → DB Table Mapping

| Module Key | Page Route | DB Tables | Migration(s) | Persistence |
|---|---|---|---|---|
| banking_capital | /banking-capital | fi_entities, fi_financials, fi_loan_books, fi_green_finance, fi_financed_emissions | 011 | DB-backed |
| carbon | /carbon-credits | — | — | Calc only |
| cbam | /cbam | — | — | Calc only |
| supply_chain | /supply-chain | sc_entities, scope3_assessments, sbti_targets, emission_factor_library | 007 | DB-backed |
| financial_risk | /financial-risk | ecl_assessments, ecl_exposures, ecl_scenario_results, pcaf_portfolios | 006 | DB-backed |
| portfolio | /portfolio-analytics | portfolios_pg, assets_pg, analysis_runs | 001–005 | DB-backed |
| scenario | /scenario-analysis | analysis_runs, scenario_results | 002 | DB-backed |
| real_estate | /asset-valuation | valuation_assets, unified_valuations, method_results, esg_adjustments | 010 | DB-backed |
| gar_ets | /gar-ets | eu_ets_installations, eu_ets_allocations, eu_ets_compliance | 044 | DB-backed |
| regulatory | /regulatory | regulatory_entities, sfdr_pai_disclosures, eu_taxonomy_assessments, tcfd_assessments, csrd_readiness, issb_assessments | 009, 013–016 | DB-backed |
| nature_risk | /nature-risk | nature_assessments, spatial_hazard_profiles | 043 | DB-backed |
| stranded_assets | /stranded-assets | — | — | Calc only |
| sustainability | /sustainability | — | — | Calc only (GRESB/LEED/BREEAM) |
| eu_regulatory | /regulatory | eudr_operators, eudr_due_diligence, csddd_entities, csddd_assessments | 045, 046 | DB-backed |
| project_finance | /project-finance | — | — | Calc only |
| energy_transition | /energy-transition | energy_entities, energy_generation_mix, energy_stranded_assets_register | 012 | DB-backed |
| climate_risk | /climate-risk | climate_assessment_runs (via company_profile_id FK) | 043 | DB-backed |
| stress_testing | /stress-testing | ecl_assessments, ecl_climate_overlays | 006 | DB-backed |
| residential_re | /residential-re | residential_re_valuations, rics_esg_assessments | 043 | DB-backed |
| valuation | /asset-valuation | valuation_assets, unified_valuations | 010 | DB-backed |
| asset_management | /asset-management | am_assessments | 040 | DB-backed |
| double_materiality | /regulatory | csrd_materiality_topics, csrd_disclosure_index | 013 | DB-backed |
| sfdr_pai | /regulatory | sfdr_pai_disclosures | 009 | DB-backed |
| sovereign_climate | /sovereign-climate-risk | sovereign_climate_assessments, sovereign_portfolio_assessments | 046 | DB-backed |
| green_hydrogen | /green-hydrogen | — | — | Calc only |
| technology_risk | /technology-risk | — | — | Calc only (factor registries in-memory) |
| sector_assessments | /sector-assessments | data_centre_assessments, cat_risk_assessments, power_plant_assessments | 008 | DB-backed |
| country_risk | /country-risk | sovereign_climate_assessments | 046 | DB-backed |
| monte_carlo | /monte-carlo | — | — | Calc only |

### 3.2 Migration File Index

| Migration Range | Tables Provisioned | Domain |
|---|---|---|
| 001–005 | portfolios_pg, assets_pg, analysis_runs, scenario_results | Core portfolio analytics |
| 006 | ecl_assessments, ecl_exposures, ecl_scenario_results, ecl_climate_overlays, pcaf_portfolios, pcaf_investees, pcaf_results, temperature_scores | ECL / PCAF financial risk |
| 007 | sc_entities, scope3_assessments, scope3_activities, sbti_targets, sbti_trajectories, emission_factor_library, supply_chain_tiers | Supply chain / Scope 3 |
| 008 | data_centre_facilities/assessments, cat_risk_properties/assessments/climate_scenarios, power_plants/assessments/trajectories | Sector physical risk |
| 009 | regulatory_entities, sfdr_pai_disclosures, eu_taxonomy_assessments/activities, tcfd_assessments, csrd_readiness, issb_assessments, sf_taxonomy_alignments, regulatory_action_plans | Core regulatory |
| 010 | valuation_assets, unified_valuations, method_results, esg_adjustments, nature_assessments (TNFD/BNG), climate_valuation_adjustments, comparable_sales, audit_log | Valuation + nature |
| 011 | fi_entities, fi_financials, fi_loan_books, fi_green_finance, fi_financed_emissions, fi_paris_alignment, fi_csrd_e1_climate, fi_csrd_s1_workforce, fi_csrd_g1_governance, fi_eu_taxonomy_kpis | FI-specific CSRD + capital |
| 012 | energy_entities, energy_financials, energy_generation_mix, energy_csrd_e1–e5, energy_csrd_s1_workforce, energy_csrd_g1_governance, energy_renewable_pipeline, energy_stranded_assets_register | Energy sector CSRD |
| 013 | csrd_entity_registry, csrd_framework_applicability, csrd_esrs_catalog, csrd_kpi_values, csrd_materiality_topics, csrd_disclosure_index, csrd_peer_benchmarks, csrd_gap_tracker, csrd_data_lineage, csrd_assurance_log, csrd_action_tracker, csrd_target_registry, csrd_transition_plan | CSRD master schema |
| 014 | esrs2_general_disclosures, esrs_e1–e5 (energy/GHG/pollution/water/biodiversity/circular), esrs_s1_workforce, esrs_g1_conduct, issb_s1_general, issb_s2_climate | ESRS IG3 (~330 DPs) + IFRS S1/S2 |
| 015 | issb_sasb_industry_metrics, issb_s2_scenario_analysis, issb_s2_offset_plan, issb_disclosure_relief_tracker, issb_risk_opportunity_register, issb_s2_time_horizons | ISSB SASB metrics + IFRS S2 detail |
| 016 | csrd_report_uploads | CSRD PDF ingestion pipeline |
| 040 | am_assessments, agriculture_methane_assessments, agriculture_disease_assessments, agriculture_bng_assessments | Asset management + agriculture |
| 041 | facilitated_emissions_v2, insurance_emissions | PCAF Part B (insurance) + Part C (facilitated) |
| 042 | cross_module_entity_linkage (LEI uniqueness, company_profile_id FKs) | Cross-module entity bridge |
| 043 | nature_re_assessments, spatial_hazard_profiles, residential_re_valuations, rics_esg_assessments; company_profile_id FKs on valuation_assets / ecl_assessments / pcaf_portfolios / climate_assessment_runs | Residential RE + nature + spatial |
| 044 | compiled_regulatory_reports, compiled_report_sections, eu_ets_installations, eu_ets_allocations, eu_ets_compliance, eu_ets_price_forecasts, brsr_entity_disclosures | EU ETS + BRSR + compiled reports |
| 045 | eudr_operators, eudr_due_diligence, eudr_commodity_lots, eudr_supply_chain_links, eudr_geolocation_proofs, eudr_compliance_evidence | EUDR compliance |
| 046 | csddd_entities, csddd_assessments, csddd_adverse_impacts, csddd_value_chain_links, csddd_grievance_cases, sovereign_climate_assessments, sovereign_portfolio_assessments | CSDDD + sovereign climate risk |

---

## 4. Persona × Module Data Coverage Matrix

### 4.1 Finance Personas

#### EU_BANK_INVESTMENT_LEAD — Thomas Krieger (FirstEuro Bank AG)

| Module | Key Data Points |
|---|---|
| banking_capital | IRB PD=0.82%, LGD=35%, RWA=€28.4B, Basel IV SA floors applied |
| gar_ets | GAR=12.3%, Taxonomy eligible=44.1%, Total assets=€195B |
| portfolio | WACI=142 tCO2/€M revenue, Green share=14.2% |
| financial_risk | ECL base=€1.85B, adverse scenario ECL=€3.42B |
| stress_testing | Climate transition ECL add-on=€890M |
| climate_risk | entity_id=FEB-DE-001, NACE=K64, Frankfurt (50.11°N, 8.68°E) |
| sfdr_pai | Article 8 fund, AUM=€195B, GHG Scope 1=2.8M tCO2 |
| double_materiality | 18 mandatory DPs, 14 voluntary DPs |
| sovereign_climate | 12-country portfolio, exposure-weighted climate VaR |

#### EU_BANK_ANALYTICS_LEAD — Priya Sharma (FirstEuro Bank AG)

| Module | Key Data Points |
|---|---|
| portfolio | WACI=142, PCAF financed emissions focus |
| financial_risk | PCAF DQS analysis across loan book |
| climate_risk | entity_id=FEB-DE-001, scenario=net_zero_2050 |
| banking_capital | Same entity base as Investment Lead |

#### EU_BANK_SUSTAINABILITY_LEAD — Ingrid Larsen (FirstEuro Bank AG)

| Module | Key Data Points |
|---|---|
| regulatory | CSRD ESRS E1/S1/G1 disclosures |
| sfdr_pai | 14 mandatory Principal Adverse Indicators |
| gar_ets | EU Taxonomy KPI reporting |
| climate_risk | entity_id=FEB-DE-001 |
| double_materiality | Full double materiality assessment |

---

### 4.2 Energy Personas

#### UTILITY_INVESTMENT_LEAD — Lars Andersen (NordWind AG)

| Module | Key Data Points |
|---|---|
| project_finance | Bornholm II 500MW offshore wind; CAPEX=€1.425B; DSCR target=1.35x; PPA=€82/MWh |
| energy_transition | Country=DE; 3 plants (offshore wind, solar PV, CCGT); scenario=net_zero_2050 |
| green_hydrogen | 100MW RFNBO-compliant electrolyser; CAPEX=€820/kW |
| stranded_assets | CCGT 420MW at risk; stranding probability 2030=45% |
| climate_risk | entity_id=NW-DE-001; NACE=D35; Offshore (54.9°N, 14.6°E) |

#### UTILITY_ANALYTICS_LEAD — Sofie Hansen (NordWind AG)

| Module | Key Data Points |
|---|---|
| energy_transition | Same NordWind fleet; ENTSO-E 2024 grid emission factor=0.385 tCO2/MWh |
| climate_risk | entity_id=NW-DE-002; physical risk score=4.1 (storm); transition risk=1.8 |

#### OIL_GAS_SUSTAINABILITY_LEAD — James McAllister (AtlanticPetroleum plc)

| Module | Key Data Points |
|---|---|
| energy_transition | Country=GB; North Sea assets; scenario=delayed_transition |
| carbon | Scope 1=8.2M tCO2; methane intensity=0.18% of production |
| climate_risk | entity_id=ATP-GB-001; NACE=B06; Aberdeen (57.15°N, -2.09°E) |
| eu_regulatory | CSDDD scope: non-EU Group 1; DD compliance score=62/100 |

---

### 4.3 Manufacturing Personas

#### MANUFACTURER_ANALYTICS_LEAD — Klaus Weber (EuroAuto GmbH)

| Module | Key Data Points |
|---|---|
| supply_chain | Scope 3 total=6.85M tCO2e; SBTi approved; 1.5°C pathway |
| energy_transition | Country=DE; EV production=280,000 units/year |
| project_finance | Zwickau EV Battery Gigafactory; CAPEX=€2.2B |
| climate_risk | entity_id=EAG-DE-001; NACE=C29; Munich (48.14°N, 11.58°E) |

#### RETAILER_SUSTAINABILITY_LEAD — Marie Dubois (PanEuro Retail SA)

| Module | Key Data Points |
|---|---|
| supply_chain | Scope 3 total=965k tCO2e; SBTi approved |
| cbam | Cross-border steel and aluminium import screening |
| climate_risk | entity_id=PRS-FR-001; NACE=G47; Paris (48.86°N, 2.35°E) |

#### MANUFACTURER_INVESTMENT_LEAD — Sofia Russo (EuroAuto GmbH)

| Module | Key Data Points |
|---|---|
| stranded_assets | ICE fleet book value=€2.1B at risk; EV transition target=2030 |
| climate_risk | entity_id=EAG-DE-002 |

#### STEEL_ANALYTICS_LEAD — Erik Johansson (EuroSteel AG)

| Module | Key Data Points |
|---|---|
| gar_ets | Installation=DE_ETS_EUST_001; HAL=3.15M t allowances; carbon price=€63/t; carbon leakage listed |
| energy_transition | BF-BOF blast furnaces + EAF electric arc; scenario=delayed_transition; H2-DRI decarbonisation roadmap |
| green_hydrogen | 500MW H2-DRI electrolyser; RFNBO-compliant; CAPEX=€780/kW |
| climate_risk | entity_id=ESG-DE-001; NACE=C24; Essen (51.46°N, 7.01°E); flood_zone=true |

---

### 4.4 Supply Chain / Other Personas

#### PHARMA_SUSTAINABILITY_LEAD — Nadia Hassan (PharmaCo BV)

| Module | Key Data Points |
|---|---|
| nature_risk | Water risk score=4.5; biodiversity footprint=1,450M species-area; TNFD LEAP phase=Assess |
| sustainability | BREEAM Excellent target; current score=72 |
| climate_risk | entity_id=PCB-NL-001; NACE=C21; Amsterdam (52.37°N, 4.90°E) |

#### REAL_ESTATE_INVESTMENT_LEAD — Henrik Müller (PropFund AG)

| Module | Key Data Points |
|---|---|
| sustainability | GRESB score=82/100; 4 Stars; 78th percentile; 82 assets; AUM=€2.8B |
| valuation | Frankfurt office; cap rate=3.85%; BREEAM green premium=8.5% |
| residential_re | EPC rating=C; CRREM pathway target 2030=130 kWh/m² |
| climate_risk | entity_id=PFA-DE-001; NACE=L68; flood_zone=true; physical risk score=5.2 |

---

## 5. API Endpoint Directory

### 5.1 Core Financial & Portfolio

| Endpoint Prefix | Service File | DB Tables Accessed | Notes |
|---|---|---|---|
| /api/v1/portfolio | portfolio_analytics.py | portfolios_pg, assets_pg, analysis_runs | CRUD + dashboard + heatmap + sectors + emissions |
| /api/v1/ecl | ecl_engine.py | ecl_assessments, ecl_exposures, ecl_scenario_results | ECL base/adverse/downside scenarios |
| /api/v1/pcaf | pcaf_service.py | pcaf_portfolios, pcaf_investees, pcaf_results | PCAF financed emissions; DQS scoring |
| /api/v1/am | am_engine.py | am_assessments | ESG attribution, Paris alignment, green bond, LP analytics |

### 5.2 Climate & Physical Risk

| Endpoint Prefix | Service File | DB Tables Accessed | Notes |
|---|---|---|---|
| /api/v1/climate-risk | climate_risk_engine.py | climate_assessment_runs, ecl_climate_overlays | Physical + transition risk by NACE/location |
| /api/v1/sovereign-climate-risk | sovereign_climate_risk_engine.py | sovereign_climate_assessments, sovereign_portfolio_assessments | 51 country profiles, 5 NGFS scenarios |
| /api/v1/nature-risk | nature_risk_calculator.py | nature_assessments, spatial_hazard_profiles | TNFD LEAP, water risk, biodiversity |

### 5.3 Energy & Sector

| Endpoint Prefix | Service File | DB Tables Accessed | Notes |
|---|---|---|---|
| /api/v1/eu-ets | gar_ets_engine.py | eu_ets_installations, eu_ets_allocations, eu_ets_compliance | EU ETS + GAR calculation |
| /api/v1/energy-transition | energy_transition_engine.py | energy_entities, energy_generation_mix | ENTSO-E grid factors, stranded asset register |
| /api/v1/project-finance | project_finance_service.py | None (calc only) | DSCR, IRR, debt sizing |
| /api/v1/agriculture-engine | agriculture_risk_engine.py | agriculture_bng_assessments | Methane intensity, disease outbreak, BNG (DEFRA Metric 4.0) |

### 5.4 Regulatory & Compliance

| Endpoint Prefix | Service File | DB Tables Accessed | Notes |
|---|---|---|---|
| /api/v1/eudr | eudr_engine.py | eudr_operators, eudr_due_diligence, eudr_commodity_lots | 7 commodities, 55 countries, Art 4(2) DDS generation |
| /api/v1/csddd | csddd_engine.py | csddd_entities, csddd_assessments, csddd_adverse_impacts | 6 scope groups, 18 adverse impact categories, 9 DD obligations |
| /api/v1/sustainability | sustainability_calculator.py | None (calc only) | GRESB, LEED, BREEAM, WELL, NABERS, CASBEE |

### 5.5 Analytics & Overlays

| Endpoint Prefix | Service File | DB Tables Accessed | Notes |
|---|---|---|---|
| /api/v1/factor-overlays | factor_overlay_engine.py | None (in-memory registries) | 31 ESG/Geo/Tech factor registries, 12 FI×LOB methods |

---

## 6. Key DB Table Reference

### 6.1 Portfolio & Financial Risk Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| portfolios_pg | 001 | id (UUID) | name, currency, benchmark, created_at |
| assets_pg | 001 | id (UUID) | portfolio_id (FK), asset_class, sector, country |
| analysis_runs | 002 | id (UUID) | portfolio_id (FK), scenario, run_date, status |
| ecl_assessments | 006 | id (UUID) | entity_id, stage (1/2/3), pd, lgd, ead, ecl |
| ecl_exposures | 006 | id (UUID) | assessment_id (FK), exposure_type, outstanding_balance |
| ecl_scenario_results | 006 | id (UUID) | assessment_id (FK), scenario_name, ecl_amount |
| ecl_climate_overlays | 006 | id (UUID) | assessment_id (FK), scenario, climate_ecl_add_on |
| pcaf_portfolios | 006 | id (UUID) | name, asset_class, total_financed_emissions |
| pcaf_investees | 006 | id (UUID) | portfolio_id (FK), company_name, revenue, enterprise_value |
| pcaf_results | 006 | id (UUID) | portfolio_id (FK), dqs_score, attribution_factor |

### 6.2 Supply Chain Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| sc_entities | 007 | id (UUID) | company_name, nace_code, country, annual_revenue |
| scope3_assessments | 007 | id (UUID) | entity_id (FK), category (1-15), emissions_tco2 |
| scope3_activities | 007 | id (UUID) | assessment_id (FK), activity_type, spend, quantity |
| sbti_targets | 007 | id (UUID) | entity_id (FK), pathway, base_year, target_year |
| sbti_trajectories | 007 | id (UUID) | target_id (FK), year, emissions_reduction_pct |
| emission_factor_library | 007 | id (UUID) | activity_type, unit, ef_value, source, year |
| supply_chain_tiers | 007 | id (UUID) | entity_id (FK), tier_level, supplier_count |

### 6.3 Energy & Sector Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| energy_entities | 012 | id (UUID) | company_name, sub_sector, country, installed_capacity_mw |
| energy_generation_mix | 012 | id (UUID) | entity_id (FK), fuel_type, generation_gwh, emission_factor |
| energy_stranded_assets_register | 012 | id (UUID) | entity_id (FK), asset_type, book_value, stranding_year |
| eu_ets_installations | 044 | id (UUID) | installation_id, operator_id, nace_code, sector |
| eu_ets_allocations | 044 | id (UUID) | installation_id (FK), year, free_allocation, hal |
| eu_ets_compliance | 044 | id (UUID) | installation_id (FK), year, verified_emissions, surrender_status |
| data_centre_assessments | 008 | id (UUID) | facility_id, pue, it_load_mw, tier_rating |
| cat_risk_assessments | 008 | id (UUID) | property_id, peril, return_period, aai_loss |
| power_plant_assessments | 008 | id (UUID) | plant_id, fuel_type, capacity_mw, lcoe |

### 6.4 Regulatory & CSRD Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| csrd_entity_registry | 013 | id (UUID) | lei, company_name, nace_code, reporting_year |
| csrd_esrs_catalog | 013 | id (UUID) | esrs_standard, dp_code, dp_name, mandatory |
| csrd_kpi_values | 013 | id (UUID) | entity_id (FK), dp_code, value, unit, year |
| csrd_materiality_topics | 013 | id (UUID) | entity_id (FK), esrs_topic, impact_materiality, financial_materiality |
| csrd_disclosure_index | 013 | id (UUID) | entity_id (FK), dp_code, disclosed, source |
| csrd_gap_tracker | 013 | id (UUID) | entity_id (FK), dp_code, gap_type, remediation_status |
| csrd_report_uploads | 016 | id (UUID) | entity_registry_id (FK), status, kpis_extracted, gaps_found, extraction_summary (JSONB) |
| sfdr_pai_disclosures | 009 | id (UUID) | entity_id (FK), pai_indicator, value, reference_period |
| eu_taxonomy_assessments | 009 | id (UUID) | entity_id (FK), activity_code, eligible_pct, aligned_pct |
| issb_assessments | 009 | id (UUID) | entity_id (FK), standard (S1/S2), disclosure_period |
| issb_sasb_industry_metrics | 015 | id (UUID) | entity_id (FK), sasb_sector, metric_code, value |
| issb_risk_opportunity_register | 015 | id (UUID) | entity_id (FK), risk_type, time_horizon, financial_effect |

### 6.5 Nature Risk & Real Estate Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| nature_assessments | 043 | id (UUID) | entity_id (FK), framework (TNFD), leap_phase, water_risk_score |
| spatial_hazard_profiles | 043 | id (UUID) | entity_id (FK), lat, lng, flood_zone, sea_level_rise_m |
| residential_re_valuations | 043 | id (UUID) | property_id, epc_rating, crrem_target_2030, retrofit_cost |
| rics_esg_assessments | 043 | id (UUID) | property_id, rics_score, green_premium_pct |
| valuation_assets | 010 | id (UUID) | asset_type, location, gross_area_sqm, nla_sqm |
| unified_valuations | 010 | id (UUID) | asset_id (FK), method, valuation_date, value |
| method_results | 010 | id (UUID) | valuation_id (FK), method_type, capitalised_value, dcf_value |
| esg_adjustments | 010 | id (UUID) | valuation_id (FK), factor, adjustment_pct |

### 6.6 Sovereign Climate & EUDR/CSDDD Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| sovereign_climate_assessments | 046 | id (UUID) | country_code, scenario, composite_score, notch_adjustment, spread_delta_bps |
| sovereign_portfolio_assessments | 046 | id (UUID) | portfolio_id (FK), weighted_composite, climate_var |
| eudr_operators | 045 | id (UUID) | operator_name, country, commodity_type |
| eudr_due_diligence | 045 | id (UUID) | operator_id (FK), dd_score, compliant, dds_ref_number |
| eudr_commodity_lots | 045 | id (UUID) | operator_id (FK), hs_code, country_of_origin, cutoff_compliant |
| eudr_geolocation_proofs | 045 | id (UUID) | lot_id (FK), geom_type (point/polygon), area_ha |
| csddd_entities | 046 | id (UUID) | lei, company_name, employee_count, worldwide_turnover |
| csddd_assessments | 046 | id (UUID) | entity_id (FK), scope_group, dd_score, overall_status |
| csddd_adverse_impacts | 046 | id (UUID) | assessment_id (FK), category (HR-xx/ENV-xx), severity |
| csddd_value_chain_links | 046 | id (UUID) | assessment_id (FK), tier, supplier_count, completeness_pct |
| csddd_grievance_cases | 046 | id (UUID) | entity_id (FK), case_type, status, resolution_date |

### 6.7 Asset Management & Cross-Module Tables

| Table | Migration | Primary Key | Notable Columns |
|---|---|---|---|
| am_assessments | 040 | id (UUID) | entity_id (FK), module_type, run_date, result_json (JSONB) |
| facilitated_emissions_v2 | 041 | id (UUID) | deal_id, deal_type, green_classification, computed_emissions |
| insurance_emissions | 041 | id (UUID) | policy_id, insurance_type, premium, computed_insured_emissions |
| cross_module_entity_linkage | 042 | id (UUID) | lei (UNIQUE), company_profile_id (FK on 5 entity tables) |
| compiled_regulatory_reports | 044 | id (UUID) | entity_id (FK), framework, reporting_year, status |
| brsr_entity_disclosures | 044 | id (UUID) | entity_id (FK), principle, disclosure_text, year |

---

## 7. Data Quality Framework

### 7.1 PCAF DQS Score Reference

The platform uses the PCAF Data Quality Score (DQS) on a 1–5 scale (1=highest quality, 5=lowest):

| Score | Description | Example Sources |
|---|---|---|
| 1 | Verified/direct measurement | Primary metering, direct MRV |
| 2 | Audited company reporting | Annual financial statements, certified energy bills |
| 3 | Company reporting (unaudited) | ESG reports, CDP disclosures, company estimates |
| 4 | Industry averages / proxies | Spend-based factors, ENCORE database, model projections |
| 5 | Default factors / no data | Sectoral defaults, generic EF databases |

### 7.2 Module-Level DQS Ratings

| Module | DQS Score | Basis |
|---|---|---|
| banking_capital | 2 | Audited financial statements |
| carbon — Scope 1 | 1 | Direct measurement / primary MRV |
| carbon — Scope 2 | 2 | Market-based energy attribute certificates |
| carbon — Scope 3 | 4 | Industry averages and spend-based methods |
| portfolio_analytics | 3 | Company reporting plus estimation models |
| nature_risk | 4 | ENCORE database spatial overlays |
| sovereign_climate | 3 | ND-GAIN index and public sovereign data |
| stranded_assets | 4 | Model-based forward projection |

---

## 8. Cross-Module Data Lineage Summary

The platform includes a lineage orchestrator (`backend/services/lineage_orchestrator.py`) that tracks data flow across ~47 modules and ~93 dependency edges. Key dependency patterns are summarised below.

### 8.1 Critical Data Bridges

| Bridge | Source Module(s) | Target Module(s) | Status |
|---|---|---|---|
| PCAF → ECL | pcaf_portfolios, pcaf_results | ecl_climate_overlays, stress_testing | Active |
| CSRD Auto-Populate | csrd_kpi_values, csrd_materiality_topics | regulatory reports, gap_tracker | Active |
| Entity 360 | cross_module_entity_linkage, company_profile | all entity tables (via LEI) | Active (migration 042) |
| Climate Risk Integration | climate_assessment_runs | ecl_climate_overlays, sovereign_climate | Active |
| Supply Chain → EUDR | scope3_assessments, sc_entities | eudr_due_diligence, eudr_commodity_lots | Active |

### 8.2 Known Reference Data Gaps

| Gap | Module Affected | Impact |
|---|---|---|
| WHO mortality data | factor_overlay (air quality) | Air quality mortality factor is modelled |
| NatCat historical loss database | cat_risk_assessments | CAT risk uses proxies |
| IPCC AR6 damage functions | climate_risk, sovereign_climate | Damage curves are approximated |
| Basel III NSFR/LCR live data | banking_capital | Liquidity ratios are calculated from inputs |
| FAO crop yield database | agriculture_risk | Yield factors use IPCC Tier 1 defaults |
| EUDR geospatial boundary data | eudr_geolocation_proofs | Polygon validation uses area heuristic |
| DEFRA BNG Metric 4.0 live API | agriculture_bng_assessments | BNG uses static habitat unit tables |
| FATF country risk list | eudr_engine, csddd_engine | Country risk tiers are manually maintained |

---

## 9. Regulatory Framework Coverage

| Regulation / Standard | Module(s) | Coverage Level |
|---|---|---|
| EU CSRD (ESRS E1–E5, S1, G1) | regulatory, double_materiality | ~330 ESRS IG3 quantitative DPs (migration 014) |
| SFDR (PAI 14 mandatory) | sfdr_pai | Full PAI table; Art 6/8/9 classification |
| EU Taxonomy (2020/852) | regulatory, gar_ets | Eligible + aligned revenue/capex/opex KPIs |
| TCFD (4 pillars) | regulatory | Governance, Strategy, Risk Mgmt, Metrics & Targets |
| ISSB IFRS S1 + S2 | regulatory | Full S1/S2 taxonomy; SASB 20 sectors (migration 015) |
| BRSR (India) | regulatory | Entity-level disclosures; 9 NVG-RL principles |
| EU ETS (MRV) | gar_ets | Installation-level verified emissions + allocation |
| CBAM (EU 2023/956) | cbam | Articles 7, 21, 31; 6 sectors |
| EUDR (EU 2023/1115) | eu_regulatory | 7 commodities, 63 HS codes, Art 4(2) DDS |
| EU CSDDD (2024/1760) | eu_regulatory | Art 2 scope, Art 6 impacts, Art 5–13 DD obligations |
| PCAF (Parts B and C) | financial_risk, gar_ets | Financed + facilitated + insurance emissions |
| GRI (300/400 series) | regulatory | Linked via CSRD ESRS cross-references |
| SEC Climate Disclosure (Reg S-K 1500 series) | sec_climate | 5 filer categories, Reg S-X 14-02, attestation |

---

## 10. Glossary

| Term | Definition |
|---|---|
| DQS | PCAF Data Quality Score (1–5; 1=best) |
| GAR | Green Asset Ratio — EU Taxonomy aligned assets as % of total covered assets |
| WACI | Weighted Average Carbon Intensity (tCO2e per €M revenue) |
| HAL | Historical Activity Level — EU ETS free allocation benchmark |
| DSCR | Debt Service Coverage Ratio |
| RFNBO | Renewable Fuels of Non-Biological Origin (EU hydrogen standard) |
| CRREM | Carbon Risk Real Estate Monitor — sector-specific decarbonisation pathways |
| TNFD | Taskforce on Nature-related Financial Disclosures |
| LEAP | TNFD framework phases: Locate, Evaluate, Assess, Prepare |
| NGFS | Network for Greening the Financial System (climate scenarios) |
| BNG | Biodiversity Net Gain (DEFRA Metric 4.0) |
| ESRS | European Sustainability Reporting Standards |
| ECL | Expected Credit Loss (IFRS 9) |
| LGD | Loss Given Default |
| EAD | Exposure at Default |
| PD | Probability of Default |
| DD | Due Diligence |
| DDS | Due Diligence Statement (EUDR Art 4(2)) |
| LEI | Legal Entity Identifier (ISO 17442) |
| NACE | EU statistical classification of economic activities |
| IRB | Internal Ratings-Based approach (Basel III/IV capital) |
| RWA | Risk-Weighted Assets |
| VaR | Value at Risk |
| PACTA | Paris Agreement Capital Transition Assessment |
| HHI | Herfindahl-Hirschman Index (concentration measure) |
| LCR | Liquidity Coverage Ratio |
| BF-BOF | Blast Furnace — Basic Oxygen Furnace (primary steelmaking) |
| EAF | Electric Arc Furnace (secondary steelmaking) |
| H2-DRI | Hydrogen-based Direct Reduced Iron |
| PPA | Power Purchase Agreement |

---

*Document generated 2026-03-16. Maintained alongside the platform codebase at `C:\Users\SahilChopra\Documents\Risk Analytics\DATA_CATALOG.md`.*
