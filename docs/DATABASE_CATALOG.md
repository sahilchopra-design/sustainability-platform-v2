# Database Catalog — public schema

*Generated 2026-07-07 from live `pg_stat_user_tables` (row counts are planner estimates, exact enough for inventory). Supabase project `kytzcbipsghprsqoalvi`, PostGIS 3.3.7. **577 tables · ~350,457 rows · 425 empty (73%)**. Empty is often BY DESIGN (write-side tables for mutation endpoints, awaiting-first-use module verticals, deferred sources like WDPA) — see docs/CRITICAL_REVIEW_UAT_AUDIT.md B2 before treating any empty table as a bug. Schema largely predates tracked Alembic migrations (created via direct DDL); `geometry` marks PostGIS tables.*

## Summary by group

| Group | Tables | Rows | Populated |
|---|---|---|---|
| Reference data layer (Tier-1 public) | 27 | 289,138 | 8/27 |
| Data hub (dh_*) — ingested source mirrors | 28 | 21,735 | 14/28 |
| Spatial / physical-risk digital twin | 16 | 23,475 | 12/16 |
| Entity & counterparty golden source | 10 | 18 | 2/10 |
| Portfolios & holdings | 39 | 83 | 10/39 |
| Carbon & credits | 16 | 22 | 3/16 |
| Climate scenarios & stress | 58 | 8,072 | 15/58 |
| Regulatory & disclosure (CSRD/SFDR/ISSB/EU/BRSR) | 58 | 5,079 | 12/58 |
| DME (Dynamic Materiality Engine) | 19 | 27 | 2/19 |
| Energy & power | 29 | 274 | 16/29 |
| Financial instruments & markets | 17 | 44 | 7/17 |
| Auth, RBAC, audit & platform ops | 33 | 374 | 8/33 |
| Hub / analysis workspaces | 14 | 929 | 8/14 |
| Domain-specific module tables | 213 | 1,187 | 35/213 |
| **Total** | **577** | **350,457** | **152/577** |

## Reference data layer (Tier-1 public)  (27 tables, 289,138 rows)

| Table | Rows |
|---|---|
| `reference_data_points` | 254,424 |
| `reference_data_records` | 29,484 |
| `gri_standards` | 2,230 |
| `csrd_esrs_catalog` | 1,184 |
| `dh_reference_data` | 1,120 |
| `gri_esrs_mapping` | 649 |
| `reference_data_sources` | 31 |
| `dme_brsr_esrs_crosswalk` | 16 |

**Empty (19):** `agri_crop_risk`, `csrd_esrs_disclosures`, `esrs_e1_carbon_price`, `esrs_e1_energy`, `esrs_e1_financial_effects`, `esrs_e1_ghg_emissions`, `esrs_e1_ghg_removals`, `esrs_e2_e5_assessments`, `esrs_e2_pollution`, `esrs_e3_water`, `esrs_e4_biodiversity`, `esrs_e5_circular`, `esrs_g1_conduct`, `esrs_s1_workforce`, `gri_content_index_assessments`, `gri_emissions_disclosures`, `gri_material_topic_assessments`, `gri_standards_reports`, `gri_topic_disclosures`

## Data hub (dh_*) — ingested source mirrors  (28 tables, 21,735 rows)

| Table | Rows |
|---|---|
| `dh_sbti_companies` | 14,034 |
| `dh_crrem_pathways` | 3,906 |
| `dh_country_risk_indices` | 3,090 |
| `dh_ca100_assessments` | 169 |
| `dh_data_sources` | 124 |
| `dh_grid_emission_factors` | 120 |
| `dh_source_assessments` | 103 |
| `dh_irena_lcoe` | 72 |
| `dh_application_kpis` | 51 |
| `dh_violation_tracker` | 18 |
| `dh_controversy_scores` | 15 |
| `dh_gdelt_events` | 15 |
| `dh_gdelt_gkg` | 10 |
| `dh_sync_jobs` | 8 |

**Empty (14):** `dh_climate_trace_emissions`, `dh_gem_coal_plant_units`, `dh_gem_coal_plants`, `dh_gfw_tree_cover_loss`, `dh_kpi_mappings`, `dh_nature_spatial_overlaps`, `dh_ngfs_scenario_data`, `dh_owid_co2_energy`, `dh_query_logs`, `dh_saved_queries`, `dh_sec_edgar_filings`, `dh_source_fields`, `dh_wdpa_protected_areas`, `dh_yfinance_market_data`

## Spatial / physical-risk digital twin  (16 tables, 23,475 rows)

| Table | Rows |
|---|---|
| `spatial_ref_sys` | 8,500 |
| `ref_wildfire_zones` *(geometry)* | 5,378 |
| `ref_earthquake_zones` *(geometry)* | 4,500 |
| `ref_cyclone_zones` *(geometry)* | 4,470 |
| `ref_sea_level_zones` *(geometry)* | 152 |
| `ref_cbam_vulnerability` | 105 |
| `ref_big_climate_db` | 100 |
| `ref_cbam_default_values` | 100 |
| `ref_owid_co2` | 50 |
| `ref_owid_energy` | 50 |
| `ref_flood_zones` *(geometry)* | 48 |
| `ref_data_source_registry` | 22 |

**Empty (4):** `physical_hazard_assessments`, `physical_hazard_scores`, `ref_protected_areas`, `spatial_hazard_profiles`

## Entity & counterparty golden source  (10 tables, 18 rows)

| Table | Rows |
|---|---|
| `csrd_entity_registry` | 15 |
| `entity_lei` | 3 |

**Empty (8):** `boj_entity_assessments`, `brsr_entity_disclosures`, `di_counterparty_emissions`, `entity_sanctions`, `entity_screening_results`, `sentiment_entity_scores`, `sfdr_entity_classifications`, `taxonomy_entity_alignments`

## Portfolios & holdings  (39 tables, 83 rows)

| Table | Rows |
|---|---|
| `assets_pg` | 24 |
| `portfolio_reports` | 19 |
| `energy_stranded_assets_register` | 10 |
| `portfolio_property_holdings` | 9 |
| `valuation_assets` | 8 |
| `infrastructure_asset` | 3 |
| `portfolio_analytics` | 3 |
| `portfolios_pg` | 3 |
| `pcaf_portfolio_results` | 2 |
| `pcaf_portfolios` | 2 |

**Empty (29):** `agricultural_assets`, `assets`, `carbon_portfolio`, `cdr_portfolio_analyses`, `di_loan_portfolio_rows`, `di_loan_portfolio_uploads`, `di_real_estate_assets`, `dme_portfolio_climate_var_runs`, `exposure_assessments`, `hydrogen_portfolio_analyses`, `impact_portfolio_holdings`, `insurance_portfolios`, `maritime_fleet_portfolios`, `mining_assets`, `nature_market_portfolios`, `pcaf_holding_quality_scores`, `pcaf_portfolio_quality_reports`, `pe_portfolio_companies`, `portfolio_climate_risk`, `portfolios`, `power_generation_assets`, `re_portfolio_analytics`, `real_asset_capex_milestones`, `real_asset_capex_plans`, `real_asset_decarb_assessments`, `shipping_fleet_portfolios`, `sovereign_portfolio_assessments`, `taxonomy_portfolio_alignments`, `transition_finance_portfolios`

## Carbon & credits  (16 tables, 22 rows)

| Table | Rows |
|---|---|
| `carbon_emission_factor` | 8 |
| `carbon_pricing_reference` | 8 |
| `carbon_methodology` | 6 |

**Empty (13):** `biodiversity_credit_assessments`, `blue_carbon_projects`, `carbon_calculation`, `carbon_credit_quality_scores`, `carbon_credit_registry_records`, `carbon_markets_intel_assessments`, `carbon_price_ets_assessments`, `carbon_project`, `carbon_report`, `carbon_scenario`, `cdm_tool`, `cdm_tool_execution`, `issb_s2_offset_plan`

## Climate scenarios & stress  (58 tables, 8,072 rows)

| Table | Rows |
|---|---|
| `ngfs_scenario_timeseries` | 7,328 |
| `cat_risk_climate_scenarios` | 217 |
| `scenario_series` | 144 |
| `hub_scenarios` | 102 |
| `ngfs_scenario_parameters` | 96 |
| `sovereign_climate_assessments` | 48 |
| `scenarios` | 43 |
| `ngfs_scenarios_v2` | 27 |
| `ecl_scenario_results` | 24 |
| `ecl_climate_overlays` | 18 |
| `dme_ngfs_scenario_pathways` | 8 |
| `scenario_versions` | 7 |
| `ngfs_scenarios` | 6 |
| `custom_scenarios_v2` | 2 |
| `ngfs_data_sources` | 2 |

**Empty (43):** `boj_scenario_results`, `cdp_climate_assessments`, `climate_assessment_methodologies`, `climate_assessment_results`, `climate_assessment_runs`, `climate_delta_reports`, `climate_finance_assessments`, `climate_finance_flows`, `climate_litigation_assessments`, `climate_litigation_cases`, `climate_physical_risk_scores`, `climate_stress_scenarios`, `climate_stress_test_results`, `climate_stress_test_runs`, `climate_transition_risk_scores`, `climate_valuation_adjustments`, `country_climate_regulatory_risk`, `eiopa_stress_runs`, `eiopa_stress_scenarios`, `ets_price_scenarios`, `health_climate_assessments`, `health_climate_scenarios`, `hkma_climate_assessments`, `hkma_stress_scenarios`, `hydrogen_project_scenarios`, `insurance_climate_assessments`, `insurance_climate_entities`, `iorp_scenario_results`, `iorp_stress_runs`, `issb_s2_scenario_analysis`, `ngfs_time_series`, `policy_climate_risk_scores`, `prudential_climate_capital_overlays`, `prudential_climate_risk_assessments`, `re_climate_var`, `scenario_impact_previews`, `scenario_results`, `solvency_ii_climate_stress`, `sovereign_debt_climate_assessments`, `sovereign_debt_scenarios`, `supply_chain_climate_risk`, `valuation_scenarios`, `water_stress_reference`

## Regulatory & disclosure (CSRD/SFDR/ISSB/EU/BRSR)  (58 tables, 5,079 rows)

| Table | Rows |
|---|---|
| `dme_brsr_core_metrics` | 3,631 |
| `dme_brsr_companies` | 1,323 |
| `cbam_certificate_price` | 24 |
| `cbam_country_risk` | 20 |
| `regulatory_entities` | 18 |
| `eu_taxonomy_assessments` | 17 |
| `cbam_product_category` | 15 |
| `sfdr_pai_disclosures` | 14 |
| `eu_taxonomy_activities` | 9 |
| `issb_assessments` | 5 |
| `cbam_supplier` | 2 |
| `cbam_embedded_emissions` | 1 |

**Empty (46):** `asean_taxonomy_activities`, `brsr_disclosures`, `cbam_compliance_report`, `cbam_cost_projection`, `cbam_verifier`, `compiled_regulatory_reports`, `csrd_disclosure_index`, `ctp_cbam_liabilities`, `ctp_china_esg_disclosures`, `epc_regulatory_requirements`, `esrs2_general_disclosures`, `eu_ets_allocations`, `eu_ets_compliance`, `eu_ets_installations`, `eu_ets_price_forecasts`, `eu_gbs_issuances`, `eu_gbs_reports`, `eu_taxonomy_alignment`, `eu_taxonomy_gar_runs`, `eudr_compliance`, `eudr_compliance_evidence`, `fi_eu_taxonomy_kpis`, `issb_disclosure_relief_tracker`, `issb_disclosures`, `issb_risk_opportunity_register`, `issb_s1_general`, `issb_s2_assessments`, `issb_s2_climate`, `issb_s2_time_horizons`, `issb_sasb_industry_metrics`, `regulatory_action_plans`, `regulatory_penalty_assessments`, `sec_ghg_disclosures`, `sf_taxonomy_alignments`, `sfdr_annex_runs`, `sfdr_annex_sections`, `sfdr_pai_assessments`, `sfdr_pai_indicator_values`, `sfdr_pai_indicators`, `sfdr_product_classification`, `sfdr_product_pai_results`, `sfdr_product_reports`, `social_taxonomy_assessments`, `taxonomy_activity_assessments`, `tcfd_disclosures`, `tnfd_disclosure_assessments`

## DME (Dynamic Materiality Engine)  (19 tables, 27 rows)

| Table | Rows |
|---|---|
| `dme_biodiversity_sites` | 17 |
| `dme_water_risk_locations` | 10 |

**Empty (17):** `dme_alert_rules`, `dme_alerts`, `dme_contagion_events`, `dme_contagion_network`, `dme_contagion_simulations`, `dme_dmi_config`, `dme_dmi_scores`, `dme_factor_definitions`, `dme_factor_values`, `dme_greenwash_signals`, `dme_greenwash_watchlist`, `dme_nlp_pulse`, `dme_nlp_signals`, `dme_policy_events`, `dme_policy_velocity`, `dme_velocity_config`, `dme_velocity_timeseries`

## Energy & power  (29 tables, 274 rows)

| Table | Rows |
|---|---|
| `power_plant_trajectories` | 140 |
| `ctp_entities` | 20 |
| `energy_renewable_pipeline` | 16 |
| `power_plant_assessments` | 16 |
| `power_plants` | 14 |
| `ctp_marketplace_listings` | 8 |
| `ctp_ndc_pathways` | 8 |
| `energy_csrd_e1_climate` | 8 |
| `energy_financials` | 8 |
| `energy_generation_mix` | 8 |
| `ctp_ets_positions` | 7 |
| `ctp_supplier_requirements` | 6 |
| `ctp_trade_corridors` | 5 |
| `energy_entities` | 4 |
| `energy_transition_pathway` | 3 |
| `power_plant` | 3 |

**Empty (13):** `ctp_export_products`, `ctp_marketplace_orders`, `ctp_marketplace_transactions`, `energy_csrd_e2_pollution`, `energy_csrd_e3_water`, `energy_csrd_e4_biodiversity`, `energy_csrd_e5_circular`, `energy_csrd_g1_governance`, `energy_csrd_s1_workforce`, `energy_transition_pipeline`, `green_hydrogen_assessments`, `hydrogen_project_assessments`, `power_plant_emissions`

## Financial instruments & markets  (17 tables, 44 rows)

| Table | Rows |
|---|---|
| `fi_csrd_e1_climate` | 8 |
| `fi_green_finance` | 8 |
| `fi_loan_books` | 8 |
| `fi_paris_alignment` | 8 |
| `fi_entities` | 4 |
| `fi_financed_emissions` | 4 |
| `fi_financials` | 4 |

**Empty (10):** `cbi_certified_bonds`, `cbi_market_snapshots`, `dfi_instruments`, `fi_csrd_g1_governance`, `fi_csrd_s1_workforce`, `financial_instruments`, `ils_cat_bonds`, `just_transition_bonds`, `pe_deals`, `transition_loan_book_positions`

## Auth, RBAC, audit & platform ops  (33 tables, 374 rows)

| Table | Rows |
|---|---|
| `user_sessions_pg` | 235 |
| `hub_sync_logs` | 61 |
| `users_pg` | 38 |
| `module_review_status` | 30 |
| `rbac_role_presets` | 7 |
| `rbac_access_invites` | 1 |
| `rbac_user_profiles` | 1 |
| `scheduled_reports` | 1 |

**Empty (25):** `audit_log`, `audit_log_2026_01`, `audit_log_2026_02`, `audit_log_2026_03`, `audit_log_2026_04`, `audit_log_2026_05`, `audit_log_2026_06`, `audit_log_2026_07`, `audit_log_2026_08`, `audit_log_2026_09`, `audit_log_2026_10`, `audit_log_2026_11`, `audit_log_2026_12`, `audit_log_2027_01`, `audit_log_2027_04`, `audit_log_2027_07`, `audit_log_2027_10`, `audit_log_default`, `module_refinement_assignments`, `org_users`, `rbac_module_access`, `sentiment_module_feeds`, `user_module_favorites`, `user_module_recents`, `valuation_audit_log`

## Hub / analysis workspaces  (14 tables, 929 rows)

| Table | Rows |
|---|---|
| `hub_trajectories` | 884 |
| `hub_sources` | 20 |
| `csrd_report_uploads` | 12 |
| `hub_consistency_checks` | 4 |
| `hub_alerts` | 3 |
| `hub_comparisons` | 3 |
| `hub_gap_analyses` | 2 |
| `hub_favorites` | 1 |

**Empty (6):** `analysis_runs`, `analysis_runs_pg`, `compiled_report_sections`, `esg_data_quality_reports`, `file_uploads`, `sasb_peer_comparisons`

## Domain-specific module tables  (213 tables, 1,187 rows)

| Table | Rows |
|---|---|
| `csrd_peer_benchmarks` | 216 |
| `cat_risk_assessments` | 121 |
| `csrd_kpi_values` | 105 |
| `company_profiles` | 97 |
| `sbti_trajectories` | 84 |
| `cat_risk_properties` | 80 |
| `ep_recarb1_properties` | 80 |
| `csrd_materiality_topics` | 75 |
| `scope3_activities` | 74 |
| `emission_factor_library` | 60 |
| `emission_factors` | 21 |
| `sc_entities` | 18 |
| `scope3_assessments` | 18 |
| `tcfd_assessments` | 18 |
| `pcaf_investees` | 16 |
| `data_centre_assessments` | 11 |
| `data_centre_facilities` | 9 |
| `di_internal_config` | 8 |
| `ecl_exposures` | 8 |
| `comparable_sales` | 7 |
| `sbti_targets` | 7 |
| `supply_chain_tiers` | 7 |
| `csrd_readiness_assessments` | 6 |
| `ecl_assessments` | 6 |
| `nature_assessments` | 6 |
| `properties` | 6 |
| `facilitated_emissions_v2` | 4 |
| `insurance_emissions` | 4 |
| `fossil_fuel_reserve` | 3 |
| `alembic_version` | 2 |
| `di_project_finance` | 2 |
| `organisations` | 2 |
| `parameter_customizations` | 2 |
| `simulation_runs` | 2 |
| `temperature_scores` | 2 |

**Empty (178):** `agricultural_emissions`, `agriculture_bng_assessments`, `agriculture_disease_assessments`, `agriculture_entities`, `agriculture_methane_assessments`, `agriculture_risk_assessments`, `ai_model_emissions`, `ai_model_governance_logs`, `ai_risk_assessments`, `am_assessments`, `asean_entities`, `assurance_criterion_results`, `assurance_readiness_runs`, `aviation_aircraft_profiles`, `aviation_operator_assessments`, `avoided_emissions_activities`, `avoided_emissions_assessments`, `basel3_liquidity_assessments`, `basel3_liquidity_time_buckets`, `basel_capital_adequacy_dashboard`, `basel_capital_requirements`, `basel_liquidity_assessments`, `biodiversity_assessments`, `biodiversity_ecosystem_services`, `biodiversity_finance_v2_assessments`, `biodiversity_sensitivity`, `blended_finance_assessments`, `blended_finance_structures`, `blue_economy_assessments`, `calculation_parameters`, `cat_risk_models`, `cdp_water_assessments`, `cdr_project_assessments`, `circular_economy_assessments`, `cloud_emissions`, `commercial_re_assessments`, `commercial_re_retrofit_plans`, `crrem_pathways`, `csddd_adverse_impacts`, `csddd_assessments`, `csddd_entities`, `csddd_grievance_cases`, `csddd_value_chain_links`, `csrd_action_tracker`, `csrd_assurance_log`, `csrd_data_lineage`, `csrd_dma_assessments`, `csrd_dma_topics`, `csrd_framework_applicability`, `csrd_gap_tracker`, `csrd_target_registry`, `csrd_transition_plan`, `data_center_metrics`, `data_centers`, `di_shipping_fleet`, `di_steel_borrowers`, `dma_assessments`, `dma_stakeholder_engagements`, `dma_topic_scores`, `eba_pillar3_assessments`, `ecl_calculations`, `engagement_commitments`, `engagement_entities`, `engagement_escalations`, `engagement_log`, `entities`, `esg_data_quality_indicators`, `esg_ma_assessments`, `esg_ma_checklist_items`, `esg_ratings_assessments`, `esg_ratings_divergence_details`, `esma_fund_name_assessments`, `eudr_commodity_lots`, `eudr_due_diligence`, `eudr_geolocation_proofs`, `eudr_operators`, `eudr_supply_chain_links`, `flag_target_settings`, `food_system_assessments`, `forced_labour_assessments`, `forced_labour_supplier_nodes`, `greenwashing_assessments`, `greenwashing_claim_results`, `hardware_lifecycle`, `hkma_entities`, `ifrs_s1_assessments`, `infrastructure_blended_finance`, `infrastructure_project_assessments`, `iorp_ora_results`, `just_transition_assessments`, `just_transition_stakeholder_impacts`, `loss_damage_assessments`, `loss_damage_parametric_designs`, `mapping_templates`, `maritime_ship_assessments`, `material_flow_analyses`, `methane_assessments`, `methane_facility_measurements`, `methodology_tool_dependency`, `mifid_preference_assessments`, `mining_emissions`, `mining_entities`, `mining_risk_assessments`, `model_lifecycle_transitions`, `model_validation_backtests`, `model_validation_champion_challenger`, `model_validation_inventory`, `mrv_assessments`, `mrv_data_points`, `mrv_data_streams`, `nature_capital_assessments`, `nature_capital_services`, `nature_re_assessments`, `nbs_project_assessments`, `nbs_sequestration_timeseries`, `net_zero_pathway_records`, `net_zero_target_assessments`, `parameter_change_requests`, `pboc_entities`, `pboc_green_finance_records`, `pcaf_data_quality_assessments`, `pcaf_financed_emissions`, `pcaf_sovereign_assessments`, `pcaf_time_series`, `pe_screening_scores`, `pe_sector_risk_heatmap`, `pipeline_run_log`, `platform_alerts`, `priips_esg_inserts`, `priips_kid_records`, `re_properties`, `re_valuations`, `residential_re_valuations`, `rics_esg_assessments`, `sasb_industry_assessments`, `sasb_materiality_assessments`, `scope3_category_assessments`, `scope3_category_details`, `scope3_category_emissions`, `sec_filer_assessments`, `sec_financial_effects`, `sec_materiality_assessments`, `sector_classifications`, `sector_ghg_benchmarks`, `sentiment_signals`, `sentiment_sources`, `sentiment_topic_trends`, `shipping_vessel_assessments`, `sl_finance_assessments`, `supplier_emission_benchmarks`, `supplier_esg_assessments`, `suppliers`, `tcfd_pillar_results`, `tech_esg_scorecard`, `tnfd_leap_assessments`, `tnfd_leap_readiness`, `tnfd_materiality_assessments`, `tpt_transition_plans`, `trade_finance_assessments`, `trade_finance_esg_covenants`, `trade_finance_suppliers`, `transition_finance_assessments`, `transition_finance_classifications`, `transition_plan_assessments`, `transition_plan_cross_framework_maps`, `transition_plan_sector_pathways`, `transition_plan_targets`, `uk_sdr_agr_results`, `uk_sdr_assessments`, `uk_sdr_label_results`, `unified_valuations`, `validation_errors`, `valuation_comparable_sales`, `valuation_esg_adjustments`, `valuation_method_results`, `valuations`, `water_footprint_calculations`, `water_risk_assessments`
