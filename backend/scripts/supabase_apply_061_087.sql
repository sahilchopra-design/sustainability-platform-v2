BEGIN;

-- Running upgrade 060 -> 061

CREATE TABLE mifid_preference_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    client_id TEXT NOT NULL, 
    client_name TEXT NOT NULL, 
    investor_type TEXT, 
    risk_profile TEXT, 
    preference_category_a_min_pct FLOAT, 
    preference_category_b_min_pct FLOAT, 
    preference_category_c BOOLEAN, 
    total_products_assessed INTEGER, 
    matched_count INTEGER, 
    match_rate_pct FLOAT, 
    adjustment_recommended BOOLEAN, 
    matched_products JSONB, 
    suitability_notes JSONB, 
    preferences_snapshot JSONB, 
    cross_framework JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_mifid_preference_assessments_client_id ON mifid_preference_assessments (client_id);

CREATE INDEX ix_mifid_preference_assessments_assessment_id ON mifid_preference_assessments (assessment_id);

CREATE TABLE tcfd_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    sector TEXT, 
    disclosure_year INTEGER, 
    overall_score FLOAT, 
    maturity_level INTEGER, 
    maturity_name TEXT, 
    blocking_gaps JSONB, 
    priority_actions JSONB, 
    recommendation_assessments JSONB, 
    sector_supplement JSONB, 
    cross_framework JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_tcfd_assessments_entity_id ON tcfd_assessments (entity_id);

CREATE INDEX ix_tcfd_assessments_assessment_id ON tcfd_assessments (assessment_id);

CREATE TABLE tcfd_pillar_results (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    tcfd_assessment_id TEXT NOT NULL, 
    pillar_id TEXT NOT NULL, 
    pillar_name TEXT, 
    total_recommendations INTEGER, 
    fully_disclosed INTEGER, 
    partially_disclosed INTEGER, 
    not_disclosed INTEGER, 
    pillar_score FLOAT, 
    blocking_gaps JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(tcfd_assessment_id) REFERENCES tcfd_assessments (assessment_id) ON DELETE CASCADE
);

CREATE INDEX ix_tcfd_pillar_results_tcfd_assessment_id ON tcfd_pillar_results (tcfd_assessment_id);

CREATE TABLE eu_gbs_issuances (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    bond_id TEXT NOT NULL, 
    issuer_name TEXT NOT NULL, 
    bond_type TEXT, 
    principal_amount FLOAT, 
    currency TEXT, 
    overall_compliant BOOLEAN, 
    compliance_score FLOAT, 
    taxonomy_alignment_pct FLOAT, 
    dnsh_status TEXT, 
    er_status TEXT, 
    gbfs_completeness_pct FLOAT, 
    is_sovereign BOOLEAN, 
    blocking_gaps JSONB, 
    warnings JSONB, 
    environmental_objectives JSONB, 
    priority_actions JSONB, 
    standards_comparison JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_eu_gbs_issuances_bond_id ON eu_gbs_issuances (bond_id);

CREATE INDEX ix_eu_gbs_issuances_issuer_name ON eu_gbs_issuances (issuer_name);

CREATE TABLE eu_gbs_reports (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    bond_id TEXT NOT NULL, 
    report_type TEXT NOT NULL, 
    reporting_period TEXT, 
    compliant BOOLEAN, 
    total_allocated_pct FLOAT, 
    taxonomy_aligned_pct FLOAT, 
    unallocated_pct FLOAT, 
    allocation_by_objective JSONB, 
    geographic_breakdown JSONB, 
    impact_indicators JSONB, 
    alignment_maintained BOOLEAN, 
    gaps JSONB, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(bond_id) REFERENCES eu_gbs_issuances (bond_id) ON DELETE CASCADE
);

CREATE INDEX ix_eu_gbs_reports_bond_id ON eu_gbs_reports (bond_id);

CREATE TABLE priips_kid_records (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    kid_id TEXT NOT NULL, 
    product_id TEXT NOT NULL, 
    product_name TEXT NOT NULL, 
    product_type TEXT, 
    isin TEXT, 
    manufacturer TEXT, 
    sfdr_classification TEXT, 
    rhp_years INTEGER, 
    annual_volatility FLOAT, 
    credit_quality TEXT, 
    taxonomy_alignment_pct FLOAT, 
    market_risk_class INTEGER, 
    credit_risk_class INTEGER, 
    final_sri INTEGER, 
    total_cost_pct FLOAT, 
    riy_pct FLOAT, 
    ongoing_cost_pct FLOAT, 
    kid_completeness_pct FLOAT, 
    validation_gaps JSONB, 
    warnings JSONB, 
    performance_scenarios JSONB, 
    cost_summary JSONB, 
    cross_framework JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (kid_id)
);

CREATE INDEX ix_priips_kid_records_product_id ON priips_kid_records (product_id);

CREATE INDEX ix_priips_kid_records_isin ON priips_kid_records (isin);

CREATE TABLE priips_esg_inserts (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    kid_id TEXT NOT NULL, 
    insert_type TEXT NOT NULL, 
    required BOOLEAN, 
    sfdr_article TEXT, 
    text_block TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(kid_id) REFERENCES priips_kid_records (kid_id) ON DELETE CASCADE
);

CREATE INDEX ix_priips_esg_inserts_kid_id ON priips_esg_inserts (kid_id);

UPDATE alembic_version SET version_num='061' WHERE alembic_version.version_num = '060';

-- Running upgrade 061 -> 062

CREATE TABLE esma_fund_name_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    fund_id TEXT NOT NULL, 
    fund_name TEXT NOT NULL, 
    fund_type TEXT, 
    sfdr_classification TEXT, 
    esg_investment_pct FLOAT, 
    required_threshold_pct FLOAT, 
    threshold_met BOOLEAN, 
    overall_compliant BOOLEAN, 
    compliance_score FLOAT, 
    detected_terms JSONB, 
    term_categories JSONB, 
    blocking_gaps JSONB, 
    compliance_gaps JSONB, 
    applicable_exclusions JSONB, 
    recommendations JSONB, 
    sfdr_alignment TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_esma_fund_name_assessments_fund_id ON esma_fund_name_assessments (fund_id);

CREATE TABLE sl_finance_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    instrument_id TEXT NOT NULL, 
    issuer_name TEXT NOT NULL, 
    instrument_type TEXT NOT NULL, 
    tenor_years INTEGER, 
    issuance_amount FLOAT, 
    currency TEXT, 
    overall_score FLOAT, 
    principles_compliant BOOLEAN, 
    step_up_triggered BOOLEAN, 
    coupon_step_up_bps FLOAT, 
    spo_required BOOLEAN, 
    spo_status TEXT, 
    blocking_gaps JSONB, 
    kpi_assessments JSONB, 
    component_assessments JSONB, 
    recommendations JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_sl_finance_assessments_instrument_id ON sl_finance_assessments (instrument_id);

CREATE INDEX ix_sl_finance_assessments_issuer_name ON sl_finance_assessments (issuer_name);

CREATE TABLE ifrs_s1_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    industry TEXT, 
    reporting_year INTEGER, 
    overall_score FLOAT, 
    overall_compliant BOOLEAN, 
    blocking_gaps JSONB, 
    pillar_results JSONB, 
    applied_reliefs JSONB, 
    industry_sasb_codes JSONB, 
    priority_actions JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_ifrs_s1_assessments_entity_id ON ifrs_s1_assessments (entity_id);

CREATE INDEX ix_ifrs_s1_assessments_reporting_year ON ifrs_s1_assessments (reporting_year);

CREATE TABLE eu_taxonomy_gar_runs (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_year INTEGER, 
    total_covered_assets FLOAT, 
    gar_numerator FLOAT, 
    gar_pct FLOAT, 
    btar_numerator FLOAT, 
    btar_covered_assets FLOAT, 
    btar_pct FLOAT, 
    bsar_pct FLOAT, 
    taxonomy_eligible_pct FLOAT, 
    taxonomy_aligned_pct FLOAT, 
    asset_breakdown JSONB, 
    dnsh_assessments JSONB, 
    min_safeguards JSONB, 
    gaps JSONB, 
    recommendations JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_eu_taxonomy_gar_runs_entity_id ON eu_taxonomy_gar_runs (entity_id);

CREATE INDEX ix_eu_taxonomy_gar_runs_reporting_year ON eu_taxonomy_gar_runs (reporting_year);

UPDATE alembic_version SET version_num='062' WHERE alembic_version.version_num = '061';

-- Running upgrade 062 -> 063

CREATE TABLE eba_pillar3_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    institution_type TEXT, 
    total_assets_bn FLOAT, 
    templates_completed JSONB, 
    compliance_score FLOAT, 
    missing_mandatory JSONB, 
    template_scores JSONB, 
    next_disclosure_date TEXT, 
    financed_emissions_intensity FLOAT, 
    carbon_related_assets_pct FLOAT, 
    taxonomy_aligned_pct FLOAT, 
    physical_risk_heatmap JSONB, 
    financed_emissions_by_sector JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_eba_pillar3_assessments_entity_id ON eba_pillar3_assessments (entity_id);

CREATE INDEX ix_eba_pillar3_assessments_assessment_id ON eba_pillar3_assessments (assessment_id);

CREATE TABLE scope3_category_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    nace_code TEXT, 
    revenue_bn FLOAT, 
    headcount INTEGER, 
    material_categories JSONB, 
    flag_applicable BOOLEAN, 
    total_scope3_tco2e FLOAT, 
    sbti_coverage_pct FLOAT, 
    category_results JSONB, 
    portfolio_scope3 JSONB, 
    flag_split JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_scope3_category_assessments_entity_id ON scope3_category_assessments (entity_id);

CREATE TABLE sfdr_product_reports (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    report_id TEXT NOT NULL, 
    product_id TEXT NOT NULL, 
    product_name TEXT NOT NULL, 
    sfdr_article TEXT, 
    reporting_period TEXT, 
    sustainable_investment_pct FLOAT, 
    taxonomy_aligned_pct FLOAT, 
    benchmark_index TEXT, 
    report_completeness_pct FLOAT, 
    section_gaps JSONB, 
    warnings JSONB, 
    pai_coverage_pct FLOAT, 
    verified_sustainable_investment_pct FLOAT, 
    taxonomy_by_objective JSONB, 
    website_disclosure_complete BOOLEAN, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (report_id)
);

CREATE INDEX ix_sfdr_product_reports_product_id ON sfdr_product_reports (product_id);

CREATE TABLE sfdr_product_pai_results (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    report_id TEXT NOT NULL, 
    indicator_id TEXT NOT NULL, 
    indicator_name TEXT, 
    value FLOAT, 
    unit TEXT, 
    coverage_pct FLOAT, 
    benchmark_value FLOAT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_sfdr_product_pai_results_report_id ON sfdr_product_pai_results (report_id);

CREATE TABLE biodiversity_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    sector TEXT, 
    assessment_type TEXT, 
    tnfd_overall_maturity INTEGER, 
    tnfd_pillar_scores JSONB, 
    tnfd_gaps JSONB, 
    msa_footprint_km2 FLOAT, 
    msa_by_land_use JSONB, 
    sbtn_readiness_score FLOAT, 
    sbtn_steps_complete INTEGER, 
    sbtn_target_types JSONB, 
    cbd_gbf_alignment TEXT, 
    cbd_gbf_sub_element_scores JSONB, 
    transition_finance_pct FLOAT, 
    cross_framework JSONB, 
    priority_actions JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_biodiversity_assessments_entity_id ON biodiversity_assessments (entity_id);

CREATE INDEX ix_biodiversity_assessments_assessment_id ON biodiversity_assessments (assessment_id);

UPDATE alembic_version SET version_num='063' WHERE alembic_version.version_num = '062';

-- Running upgrade 063 -> 064

CREATE TABLE issb_s2_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    industry_sector TEXT, 
    reporting_period TEXT, 
    governance_score FLOAT, 
    strategy_score FLOAT, 
    risk_mgmt_score FLOAT, 
    metrics_targets_score FLOAT, 
    overall_compliance_pct FLOAT, 
    scenario_analysis JSONB, 
    physical_risks JSONB, 
    transition_risks JSONB, 
    climate_opportunities JSONB, 
    scope1_tco2e FLOAT, 
    scope2_tco2e FLOAT, 
    scope3_tco2e FLOAT, 
    financed_emissions_tco2e FLOAT, 
    internal_carbon_price FLOAT, 
    climate_capex_pct FLOAT, 
    cross_industry_metrics JSONB, 
    industry_metrics JSONB, 
    disclosure_gaps JSONB, 
    tcfd_cross_reference JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_issb_s2_assessments_entity_id ON issb_s2_assessments (entity_id);

CREATE INDEX ix_issb_s2_assessments_assessment_id ON issb_s2_assessments (assessment_id);

CREATE TABLE gri_standards_reports (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    report_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_period TEXT, 
    gri_1_compliance_pct FLOAT, 
    gri_2_compliance_pct FLOAT, 
    gri_3_compliance_pct FLOAT, 
    material_topics JSONB, 
    topic_boundary JSONB, 
    gri_300_scores JSONB, 
    content_index JSONB, 
    overall_compliance_pct FLOAT, 
    assurance_level TEXT, 
    gri_service_level TEXT, 
    disclosure_gaps JSONB, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (report_id)
);

CREATE INDEX ix_gri_standards_reports_entity_id ON gri_standards_reports (entity_id);

CREATE TABLE gri_topic_disclosures (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    report_id TEXT NOT NULL, 
    gri_standard TEXT NOT NULL, 
    standard_name TEXT, 
    is_material BOOLEAN, 
    disclosures_completed JSONB, 
    disclosures_omitted JSONB, 
    compliance_pct FLOAT, 
    data_quality TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_gri_topic_disclosures_report_id ON gri_topic_disclosures (report_id);

CREATE TABLE tpt_transition_plans (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    plan_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    entity_type TEXT, 
    plan_year INTEGER, 
    foundations_score FLOAT, 
    implementation_score FLOAT, 
    engagement_score FLOAT, 
    metrics_targets_score FLOAT, 
    governance_score FLOAT, 
    finance_score FLOAT, 
    overall_quality_score FLOAT, 
    quality_tier TEXT, 
    net_zero_target_year INTEGER, 
    interim_targets JSONB, 
    key_actions JSONB, 
    gap_analysis JSONB, 
    cross_framework JSONB, 
    financed_emissions_target JSONB, 
    capex_green_pct FLOAT, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (plan_id)
);

CREATE INDEX ix_tpt_transition_plans_entity_id ON tpt_transition_plans (entity_id);

CREATE INDEX ix_tpt_transition_plans_plan_id ON tpt_transition_plans (plan_id);

CREATE TABLE pcaf_sovereign_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    country_code TEXT NOT NULL, 
    country_name TEXT NOT NULL, 
    outstanding_amount_mn FLOAT, 
    gdp_bn FLOAT, 
    government_debt_bn FLOAT, 
    attribution_factor FLOAT, 
    sovereign_ghg_inventory_tco2e FLOAT, 
    financed_emissions_tco2e FLOAT, 
    emissions_intensity FLOAT, 
    pcaf_dqs INTEGER, 
    ndc_target_pct FLOAT, 
    ndc_alignment TEXT, 
    climate_risk_score FLOAT, 
    national_circumstances JSONB, 
    portfolio_context JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_pcaf_sovereign_assessments_entity_id ON pcaf_sovereign_assessments (entity_id);

CREATE INDEX ix_pcaf_sovereign_assessments_country_code ON pcaf_sovereign_assessments (country_code);

UPDATE alembic_version SET version_num='064' WHERE alembic_version.version_num = '063';

-- Running upgrade 064 -> 065

CREATE TABLE esrs_e2_e5_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_period TEXT, 
    e2_material BOOLEAN, 
    e2_compliance_pct FLOAT, 
    e2_air_pollutants JSONB, 
    e2_water_pollutants JSONB, 
    e2_soil_pollutants JSONB, 
    e2_substances_of_concern JSONB, 
    e2_disclosure_gaps JSONB, 
    e3_material BOOLEAN, 
    e3_compliance_pct FLOAT, 
    e3_water_withdrawal_m3 FLOAT, 
    e3_water_discharge_m3 FLOAT, 
    e3_water_consumption_m3 FLOAT, 
    e3_water_stress_pct FLOAT, 
    e3_water_intensity FLOAT, 
    e3_disclosure_gaps JSONB, 
    e4_material BOOLEAN, 
    e4_compliance_pct FLOAT, 
    e4_sensitive_areas_pct FLOAT, 
    e4_land_use_change_ha FLOAT, 
    e4_species_affected JSONB, 
    e4_ecosystem_services_dep JSONB, 
    e4_disclosure_gaps JSONB, 
    e5_material BOOLEAN, 
    e5_compliance_pct FLOAT, 
    e5_material_inflows_t FLOAT, 
    e5_recycled_content_pct FLOAT, 
    e5_waste_generated_t FLOAT, 
    e5_circularity_rate_pct FLOAT, 
    e5_disclosure_gaps JSONB, 
    overall_compliance_pct FLOAT, 
    material_topics_count INTEGER, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_esrs_e2_e5_assessments_entity_id ON esrs_e2_e5_assessments (entity_id);

CREATE TABLE greenwashing_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    product_or_entity TEXT, 
    claims_submitted INTEGER, 
    claims_flagged INTEGER, 
    overall_risk_score FLOAT, 
    risk_tier TEXT, 
    eu_reg_2023_2441_score FLOAT, 
    fca_consumer_duty_score FLOAT, 
    substantiation_gaps JSONB, 
    misleading_terms_found JSONB, 
    label_verification JSONB, 
    remediation_steps JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_greenwashing_assessments_entity_id ON greenwashing_assessments (entity_id);

CREATE TABLE greenwashing_claim_results (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    claim_text TEXT, 
    claim_type TEXT, 
    risk_level TEXT, 
    substantiation_score FLOAT, 
    issues_found JSONB, 
    regulatory_refs JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_greenwashing_claim_results_assessment_id ON greenwashing_claim_results (assessment_id);

CREATE TABLE carbon_credit_quality_scores (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    score_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    project_id TEXT, 
    project_name TEXT, 
    standard TEXT, 
    methodology TEXT, 
    project_type TEXT, 
    vintage_year INTEGER, 
    volume_tco2e FLOAT, 
    ccp_label BOOLEAN, 
    additionality_score FLOAT, 
    permanence_risk_score FLOAT, 
    co_benefits_score FLOAT, 
    overall_quality_score FLOAT, 
    quality_tier TEXT, 
    corsia_eligible BOOLEAN, 
    article6_eligible BOOLEAN, 
    price_range_usd JSONB, 
    issues JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (score_id)
);

CREATE INDEX ix_carbon_credit_quality_scores_entity_id ON carbon_credit_quality_scores (entity_id);

CREATE INDEX ix_carbon_credit_quality_scores_standard ON carbon_credit_quality_scores (standard);

CREATE TABLE climate_stress_test_runs (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    run_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    framework TEXT, 
    scenarios JSONB, 
    time_horizon TEXT, 
    loan_book_bn FLOAT, 
    total_exposure_bn FLOAT, 
    baseline_cet1_pct FLOAT, 
    stressed_cet1_pct FLOAT, 
    cet1_depletion_bps FLOAT, 
    total_credit_losses_bn FLOAT, 
    total_impairment_pct FLOAT, 
    worst_scenario TEXT, 
    climate_var_pct FLOAT, 
    summary_results JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (run_id)
);

CREATE INDEX ix_climate_stress_test_runs_entity_id ON climate_stress_test_runs (entity_id);

CREATE TABLE climate_stress_test_results (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    run_id TEXT NOT NULL, 
    scenario_id TEXT NOT NULL, 
    nace_sector TEXT, 
    exposure_bn FLOAT, 
    pd_migration_bps FLOAT, 
    lgd_uplift_pct FLOAT, 
    expected_loss_bn FLOAT, 
    collateral_haircut_pct FLOAT, 
    stranded_asset_pct FLOAT, 
    carbon_cost_impact_mn FLOAT, 
    revenue_impact_pct FLOAT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_climate_stress_test_results_run_id ON climate_stress_test_results (run_id);

UPDATE alembic_version SET version_num='065' WHERE alembic_version.version_num = '064';

-- Running upgrade 065 -> 066

CREATE TABLE tnfd_leap_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    sector TEXT, 
    reporting_period TEXT, 
    locate_score FLOAT, 
    priority_locations JSONB, 
    value_chain_scope JSONB, 
    sensitive_ecosystems JSONB, 
    evaluate_score FLOAT, 
    dependencies JSONB, 
    impacts JSONB, 
    ecosystem_condition JSONB, 
    assess_score FLOAT, 
    material_risks JSONB, 
    material_opportunities JSONB, 
    risk_magnitude TEXT, 
    opportunity_magnitude TEXT, 
    prepare_score FLOAT, 
    strategy_response JSONB, 
    targets_set JSONB, 
    disclosure_completeness_pct FLOAT, 
    overall_leap_score FLOAT, 
    leap_maturity TEXT, 
    cross_framework JSONB, 
    priority_actions JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_tnfd_leap_assessments_entity_id ON tnfd_leap_assessments (entity_id);

CREATE TABLE net_zero_target_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    entity_type TEXT, 
    framework TEXT, 
    base_year INTEGER, 
    net_zero_target_year INTEGER, 
    near_term_target_year INTEGER, 
    near_term_reduction_pct FLOAT, 
    long_term_reduction_pct FLOAT, 
    scope1_covered BOOLEAN, 
    scope2_covered BOOLEAN, 
    scope3_covered BOOLEAN, 
    sbti_validation_status TEXT, 
    sbti_pathway TEXT, 
    flag_target BOOLEAN, 
    temperature_score FLOAT, 
    pathway_gap_pct FLOAT, 
    interim_milestones JSONB, 
    residual_emissions_plan JSONB, 
    beyond_value_chain JSONB, 
    cross_framework JSONB, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_net_zero_target_assessments_entity_id ON net_zero_target_assessments (entity_id);

CREATE TABLE net_zero_pathway_records (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    year INTEGER NOT NULL, 
    required_emissions_tco2e FLOAT, 
    projected_emissions_tco2e FLOAT, 
    gap_tco2e FLOAT, 
    on_track BOOLEAN, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_net_zero_pathway_records_assessment_id ON net_zero_pathway_records (assessment_id);

CREATE TABLE esg_data_quality_reports (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    report_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_period TEXT, 
    overall_quality_score FLOAT, 
    overall_coverage_pct FLOAT, 
    e_pillar_score FLOAT, 
    s_pillar_score FLOAT, 
    g_pillar_score FLOAT, 
    estimated_indicators_pct FLOAT, 
    provider_divergence JSONB, 
    dqs_profile JSONB, 
    data_gaps JSONB, 
    material_gaps JSONB, 
    improvement_actions JSONB, 
    bcbs239_score FLOAT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (report_id)
);

CREATE INDEX ix_esg_data_quality_reports_entity_id ON esg_data_quality_reports (entity_id);

CREATE TABLE esg_data_quality_indicators (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    report_id TEXT NOT NULL, 
    indicator_id TEXT NOT NULL, 
    indicator_name TEXT, 
    pillar TEXT, 
    source TEXT, 
    coverage_pct FLOAT, 
    quality_score FLOAT, 
    dqs INTEGER, 
    estimation_method TEXT, 
    is_material BOOLEAN, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_esg_data_quality_indicators_report_id ON esg_data_quality_indicators (report_id);

CREATE TABLE regulatory_penalty_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    annual_turnover_mn FLOAT, 
    regulations_assessed JSONB, 
    violations_found INTEGER, 
    max_penalty_mn FLOAT, 
    expected_penalty_mn FLOAT, 
    penalty_by_regulation JSONB, 
    csrd_compliance_pct FLOAT, 
    sfdr_compliance_pct FLOAT, 
    taxonomy_compliance_pct FLOAT, 
    eudr_compliance_pct FLOAT, 
    csddd_compliance_pct FLOAT, 
    supervisory_authority JSONB, 
    whistleblower_risk TEXT, 
    remediation_priority JSONB, 
    enforcement_timeline JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_regulatory_penalty_assessments_entity_id ON regulatory_penalty_assessments (entity_id);

UPDATE alembic_version SET version_num='066' WHERE alembic_version.version_num = '065';

-- Running upgrade 066 -> 067

CREATE TABLE basel3_liquidity_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_date TEXT, 
    scenario_id TEXT, 
    lcr_pct FLOAT, 
    hqla_stock_mn FLOAT, 
    hqla_level1_mn FLOAT, 
    hqla_level2a_mn FLOAT, 
    hqla_level2b_mn FLOAT, 
    net_outflow_30d_mn FLOAT, 
    gross_outflow_mn FLOAT, 
    gross_inflow_mn FLOAT, 
    climate_hqla_haircut_bps FLOAT, 
    nsfr_pct FLOAT, 
    asf_mn FLOAT, 
    rsf_mn FLOAT, 
    asf_breakdown JSONB, 
    rsf_breakdown JSONB, 
    survival_horizon_days INTEGER, 
    liquidity_at_risk_mn FLOAT, 
    stress_outflow_deposit_mn FLOAT, 
    stress_outflow_wholesale_mn FLOAT, 
    eve_sensitivity_pct FLOAT, 
    nii_sensitivity_pct FLOAT, 
    duration_gap_years FLOAT, 
    concentration_risk_score FLOAT, 
    monitoring_metrics JSONB, 
    stress_assumptions JSONB, 
    regulatory_breaches JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_basel3_liquidity_assessments_entity_id ON basel3_liquidity_assessments (entity_id);

CREATE TABLE basel3_liquidity_time_buckets (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    bucket TEXT NOT NULL, 
    assets_mn FLOAT, 
    liabilities_mn FLOAT, 
    gap_mn FLOAT, 
    cumulative_gap_mn FLOAT, 
    eve_delta_mn FLOAT, 
    nii_delta_mn FLOAT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_basel3_liquidity_time_buckets_assessment_id ON basel3_liquidity_time_buckets (assessment_id);

CREATE TABLE social_taxonomy_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_period TEXT, 
    assessment_type TEXT, 
    decent_work_score FLOAT, 
    living_standards_score FLOAT, 
    inclusive_communities_score FLOAT, 
    social_taxonomy_aligned_pct FLOAT, 
    dnsh_social_flags INTEGER, 
    sfdr_sustainable_investment_pct FLOAT, 
    sfdr_dnsh_pass BOOLEAN, 
    sfdr_governance_pass BOOLEAN, 
    imp_what_score FLOAT, 
    imp_who_score FLOAT, 
    imp_how_much_score FLOAT, 
    imp_contribution_score FLOAT, 
    imp_risk_score FLOAT, 
    imp_composite_score FLOAT, 
    sdg_alignment JSONB, 
    iris_plus_metrics JSONB, 
    additionality_score FLOAT, 
    beneficiaries_reached INTEGER, 
    living_wage_coverage_pct FLOAT, 
    gender_pay_gap_pct FLOAT, 
    reporting_standard TEXT, 
    cross_framework JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_social_taxonomy_assessments_entity_id ON social_taxonomy_assessments (entity_id);

CREATE TABLE impact_portfolio_holdings (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    holding_id TEXT NOT NULL, 
    holding_name TEXT, 
    weight_pct FLOAT, 
    imp_composite_score FLOAT, 
    sdg_primary TEXT, 
    art9_eligible BOOLEAN, 
    dnsh_flag BOOLEAN, 
    governance_flag BOOLEAN, 
    additionality_score FLOAT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_impact_portfolio_holdings_assessment_id ON impact_portfolio_holdings (assessment_id);

CREATE TABLE forced_labour_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    sector TEXT, 
    reporting_year INTEGER, 
    supply_chain_nodes_screened INTEGER, 
    high_risk_suppliers_pct FLOAT, 
    ilo_indicator_flags JSONB, 
    eu_flr_import_risk TEXT, 
    art7_investigation_trigger BOOLEAN, 
    art8_database_match BOOLEAN, 
    uk_msa_score FLOAT, 
    uk_msa_disclosure_areas_met INTEGER, 
    california_scatca_compliance BOOLEAN, 
    lksg_prohibited_practice_flag BOOLEAN, 
    compliance_programme_maturity TEXT, 
    audit_coverage_pct FLOAT, 
    grievance_mechanism_score FLOAT, 
    remediation_cases_open INTEGER, 
    csrd_s2_linkage JSONB, 
    csddd_hr01_linkage JSONB, 
    priority_actions JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_forced_labour_assessments_entity_id ON forced_labour_assessments (entity_id);

CREATE TABLE forced_labour_supplier_nodes (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    supplier_id TEXT NOT NULL, 
    supplier_name TEXT, 
    country_code TEXT, 
    sector TEXT, 
    tier INTEGER, 
    ilo_risk_score FLOAT, 
    eu_flr_risk_level TEXT, 
    audit_status TEXT, 
    sa8000_certified BOOLEAN, 
    ilo_indicators_triggered JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_forced_labour_supplier_nodes_assessment_id ON forced_labour_supplier_nodes (assessment_id);

CREATE TABLE transition_finance_classifications (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    classification_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    sector TEXT, 
    reporting_period TEXT, 
    gfanz_category TEXT, 
    tpt_sector_pathway_alignment_pct FLOAT, 
    singapore_gtt_tier TEXT, 
    japan_gx_eligible BOOLEAN, 
    transition_plan_credibility_score FLOAT, 
    credibility_rating TEXT, 
    strategy_score FLOAT, 
    implementation_score FLOAT, 
    governance_score FLOAT, 
    disclosure_score FLOAT, 
    emissions_intensity_current FLOAT, 
    emissions_intensity_2030_target FLOAT, 
    ngfs_pathway_benchmark_2030 FLOAT, 
    alignment_gap_pct FLOAT, 
    capex_low_carbon_pct FLOAT, 
    transition_finance_ratio_pct FLOAT, 
    gar_pct FLOAT, 
    brown_overhang_mn FLOAT, 
    bond_type_recommendation TEXT, 
    kpi_ambition_score FLOAT, 
    cross_framework JSONB, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (classification_id)
);

CREATE INDEX ix_transition_finance_classifications_entity_id ON transition_finance_classifications (entity_id);

CREATE TABLE transition_loan_book_positions (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    classification_id TEXT NOT NULL, 
    exposure_id TEXT NOT NULL, 
    borrower_name TEXT, 
    sector TEXT, 
    exposure_mn FLOAT, 
    gfanz_category TEXT, 
    sector_pathway_gap_pct FLOAT, 
    credibility_score FLOAT, 
    financing_type TEXT, 
    maturity_year INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_transition_loan_book_positions_classification_id ON transition_loan_book_positions (classification_id);

UPDATE alembic_version SET version_num='067' WHERE alembic_version.version_num = '066';

-- Running upgrade 067 -> 068

CREATE TABLE csrd_dma_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_period TEXT, 
    sector TEXT, 
    nace_code TEXT, 
    context_understanding_score FLOAT, 
    stakeholder_identification_score FLOAT, 
    impact_identification_score FLOAT, 
    financial_materiality_score FLOAT, 
    dma_process_completeness_pct FLOAT, 
    material_topics_count INTEGER, 
    impact_material_count INTEGER, 
    financial_material_count INTEGER, 
    both_material_count INTEGER, 
    stakeholders_engaged INTEGER, 
    stakeholder_types JSONB, 
    engagement_quality_score FLOAT, 
    material_topics JSONB, 
    non_material_topics JSONB, 
    esrs_standards_applicable JSONB, 
    assurance_readiness_pct FLOAT, 
    cross_framework JSONB, 
    priority_actions JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_csrd_dma_assessments_entity_id ON csrd_dma_assessments (entity_id);

CREATE TABLE csrd_dma_topics (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    topic_id TEXT NOT NULL, 
    topic_name TEXT, 
    esrs_standard TEXT, 
    impact_severity_score FLOAT, 
    impact_likelihood_score FLOAT, 
    impact_materiality_score FLOAT, 
    impact_type TEXT, 
    value_chain_location TEXT, 
    financial_magnitude_score FLOAT, 
    financial_likelihood_score FLOAT, 
    financial_materiality_score FLOAT, 
    financial_risk_type TEXT, 
    is_material BOOLEAN, 
    materiality_basis TEXT, 
    stakeholder_salience_score FLOAT, 
    priority_rank INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_csrd_dma_topics_assessment_id ON csrd_dma_topics (assessment_id);

CREATE TABLE physical_hazard_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    asset_name TEXT NOT NULL, 
    asset_type TEXT, 
    lat FLOAT, 
    lng FLOAT, 
    country_code TEXT, 
    climate_scenario TEXT, 
    time_horizon TEXT, 
    composite_hazard_score FLOAT, 
    risk_tier TEXT, 
    primary_hazard TEXT, 
    flood_risk_score FLOAT, 
    wildfire_risk_score FLOAT, 
    heat_stress_score FLOAT, 
    sea_level_rise_score FLOAT, 
    cyclone_risk_score FLOAT, 
    drought_risk_score FLOAT, 
    subsidence_risk_score FLOAT, 
    property_damage_pct FLOAT, 
    business_interruption_days INTEGER, 
    stranded_value_risk_pct FLOAT, 
    adaptation_capex_mn FLOAT, 
    crrem_pathway_compliant BOOLEAN, 
    stranding_year INTEGER, 
    cross_framework JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_physical_hazard_assessments_entity_id ON physical_hazard_assessments (entity_id);

CREATE TABLE physical_hazard_scores (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    hazard_type TEXT NOT NULL, 
    hazard_score FLOAT, 
    return_period_20yr FLOAT, 
    return_period_100yr FLOAT, 
    exposure_level TEXT, 
    vulnerability_score FLOAT, 
    adaptation_measure TEXT, 
    data_source TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_physical_hazard_scores_assessment_id ON physical_hazard_scores (assessment_id);

CREATE TABLE avoided_emissions_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    entity_name TEXT NOT NULL, 
    reporting_year INTEGER, 
    assessment_type TEXT, 
    methodology TEXT, 
    enabled_emissions_tco2e FLOAT, 
    substitution_emissions_tco2e FLOAT, 
    facilitated_avoided_tco2e FLOAT, 
    total_avoided_tco2e FLOAT, 
    baseline_scenario_emissions_tco2e FLOAT, 
    net_benefit_tco2e FLOAT, 
    additionality_score FLOAT, 
    attribution_factor FLOAT, 
    data_quality_score FLOAT, 
    third_party_verified BOOLEAN, 
    article6_eligible BOOLEAN, 
    itmo_units_mn FLOAT, 
    credit_price_usd FLOAT, 
    sbti_bvcm_eligible BOOLEAN, 
    science_based_claim BOOLEAN, 
    cross_framework JSONB, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_avoided_emissions_assessments_entity_id ON avoided_emissions_assessments (entity_id);

CREATE TABLE avoided_emissions_activities (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    activity_id TEXT NOT NULL, 
    activity_name TEXT, 
    activity_type TEXT, 
    product_service TEXT, 
    functional_unit TEXT, 
    quantity FLOAT, 
    baseline_intensity_kgco2e FLOAT, 
    solution_intensity_kgco2e FLOAT, 
    avoided_per_unit_kgco2e FLOAT, 
    total_avoided_tco2e FLOAT, 
    attribution_factor FLOAT, 
    additionality_basis TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_avoided_emissions_activities_assessment_id ON avoided_emissions_activities (assessment_id);

CREATE TABLE green_hydrogen_assessments (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    project_name TEXT NOT NULL, 
    country_code TEXT, 
    production_pathway TEXT, 
    electrolysis_technology TEXT, 
    capacity_mw FLOAT, 
    annual_production_ktpa FLOAT, 
    eu_delegated_act_compliant BOOLEAN, 
    renewable_electricity_pct FLOAT, 
    additionality_met BOOLEAN, 
    temporal_correlation_met BOOLEAN, 
    geographical_correlation_met BOOLEAN, 
    carbon_intensity_kgco2e_kgh2 FLOAT, 
    eu_taxonomy_aligned BOOLEAN, 
    lcoh_usd_per_kgh2 FLOAT, 
    capex_per_kw FLOAT, 
    opex_annual_mn FLOAT, 
    electricity_cost_mwh FLOAT, 
    capacity_factor_pct FLOAT, 
    discount_rate_pct FLOAT, 
    h2_subsidy_scheme TEXT, 
    subsidy_value_usd_per_kgh2 FLOAT, 
    net_lcoh_after_subsidy FLOAT, 
    gfanz_category TEXT, 
    sustainable_finance_label TEXT, 
    cross_framework JSONB, 
    warnings JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (assessment_id)
);

CREATE INDEX ix_green_hydrogen_assessments_entity_id ON green_hydrogen_assessments (entity_id);

CREATE TABLE hydrogen_project_scenarios (
    id TEXT DEFAULT gen_random_uuid()::text NOT NULL, 
    assessment_id TEXT NOT NULL, 
    scenario_name TEXT NOT NULL, 
    year INTEGER, 
    electrolyser_cost_per_kw FLOAT, 
    electricity_price_mwh FLOAT, 
    capacity_factor_pct FLOAT, 
    carbon_intensity_kgco2e_kgh2 FLOAT, 
    lcoh_usd_per_kgh2 FLOAT, 
    parity_achieved BOOLEAN, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_hydrogen_project_scenarios_assessment_id ON hydrogen_project_scenarios (assessment_id);

UPDATE alembic_version SET version_num='068' WHERE alembic_version.version_num = '067';

-- Running upgrade 068 -> 069

CREATE TABLE IF NOT EXISTS biodiversity_finance_v2_assessments (
            id                           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                    TEXT NOT NULL,
            entity_name                  TEXT,
            assessment_date              DATE,
            assessment_type              TEXT,
            -- TNFD LEAP composite
            leap_locate_score            NUMERIC(5,2),
            leap_evaluate_score          NUMERIC(5,2),
            leap_assess_score            NUMERIC(5,2),
            leap_prepare_score           NUMERIC(5,2),
            leap_composite_score         NUMERIC(5,2),
            -- PBAF attribution
            pbaf_attribution_factor      NUMERIC(10,6),
            pbaf_method                  TEXT,
            -- ENCORE scoring
            nature_dependency_score      NUMERIC(5,2),
            nature_impact_score          NUMERIC(5,2),
            high_dependency_services     JSONB,
            -- MSA footprint (mean species abundance)
            msa_footprint_km2            NUMERIC(15,4),
            msa_loss_fraction            NUMERIC(8,6),
            -- GBF/COP15 30x30 alignment
            gbf_target15_aligned         BOOLEAN,
            cop15_30x30_contribution_pct NUMERIC(8,4),
            -- BNG (DEFRA Metric 4.0)
            bng_baseline_units           NUMERIC(10,2),
            bng_post_development_units   NUMERIC(10,2),
            bng_net_gain_pct             NUMERIC(8,2),
            bng_credit_required          BOOLEAN,
            -- BFFI (PDF/m2/yr)
            bffi_score                   NUMERIC(8,4),
            -- Materiality
            materiality_rating           TEXT,
            priority_ecosystems          JSONB,
            -- Cross-framework linkages
            tnfd_esrs_e4_aligned         BOOLEAN,
            gri_304_disclosure_score     NUMERIC(5,2),
            eu_taxonomy_dnsh_nature      BOOLEAN,
            sbtn_target_aligned          BOOLEAN,
            -- Meta
            notes                        TEXT,
            created_at                   TIMESTAMPTZ DEFAULT NOW(),
            updated_at                   TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS biodiversity_ecosystem_services (
            id                           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id                TEXT NOT NULL,
            ecosystem_service_id         TEXT NOT NULL,
            ecosystem_service_name       TEXT,
            encore_category              TEXT,
            dependency_level             TEXT,
            dependency_score             NUMERIC(5,2),
            impact_driver                TEXT,
            impact_magnitude             TEXT,
            impact_score                 NUMERIC(5,2),
            materiality_flag             BOOLEAN,
            mitigation_measure           TEXT,
            residual_risk_score          NUMERIC(5,2),
            location_specific            BOOLEAN,
            hotspot_flag                 BOOLEAN,
            created_at                   TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS prudential_climate_risk_assessments (
            id                              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                       TEXT NOT NULL,
            entity_name                     TEXT,
            institution_type                TEXT,
            reporting_date                  DATE,
            regulator                       TEXT,
            -- Scenario framework
            scenario_framework              TEXT,
            scenarios_assessed              JSONB,
            ngfs_version                    TEXT,
            -- CET1 stress results (percentage points)
            baseline_cet1_pct               NUMERIC(6,3),
            stressed_cet1_orderly           NUMERIC(6,3),
            stressed_cet1_disorderly        NUMERIC(6,3),
            stressed_cet1_hot_house         NUMERIC(6,3),
            cet1_depletion_max_ppts         NUMERIC(6,3),
            cet1_breaches_minimum           BOOLEAN,
            -- Credit risk impacts
            pd_migration_orderly_bps        NUMERIC(8,2),
            pd_migration_disorderly_bps     NUMERIC(8,2),
            lgd_increase_orderly_pct        NUMERIC(6,2),
            lgd_increase_disorderly_pct     NUMERIC(6,2),
            ecl_increase_orderly_musd       NUMERIC(15,2),
            ecl_increase_disorderly_musd    NUMERIC(15,2),
            -- Market risk
            market_risk_loss_orderly_musd   NUMERIC(15,2),
            market_risk_loss_disorderly_musd NUMERIC(15,2),
            -- ICAAP Pillar 2
            icaap_climate_add_on_pct        NUMERIC(6,3),
            pillar2b_buffer_recommendation_pct NUMERIC(6,3),
            srep_climate_finding            TEXT,
            -- Basel SRP 43.1
            srp431_categorisation           TEXT,
            srp431_review_date              DATE,
            -- EBA SREP
            eba_srep_climate_score          INTEGER,
            -- Total regulatory buffer
            total_climate_capital_buffer_pct NUMERIC(6,3),
            total_climate_rwa_uplift_pct    NUMERIC(6,3),
            -- Time horizons
            short_term_horizon_yrs          INTEGER,
            medium_term_horizon_yrs         INTEGER,
            long_term_horizon_yrs           INTEGER,
            -- BOE BES specific
            boe_bes_round                   TEXT,
            boe_bes_llt_loss_musd           NUMERIC(15,2),
            boe_bes_elt_loss_musd           NUMERIC(15,2),
            -- ECB CST specific
            ecb_cst_round                   TEXT,
            ecb_cst_transition_loss_musd    NUMERIC(15,2),
            ecb_cst_physical_loss_musd      NUMERIC(15,2),
            -- Notes
            notes                           TEXT,
            created_at                      TIMESTAMPTZ DEFAULT NOW(),
            updated_at                      TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS prudential_climate_capital_overlays (
            id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id                  TEXT NOT NULL,
            segment_name                   TEXT NOT NULL,
            segment_exposure_usd           NUMERIC(18,2),
            transition_risk_rating         TEXT,
            physical_risk_rating           TEXT,
            brown_share_pct                NUMERIC(6,2),
            stranded_asset_exposure_usd    NUMERIC(15,2),
            climate_var_95_pct_usd         NUMERIC(15,2),
            rwa_uplift_pct                 NUMERIC(6,3),
            capital_add_on_usd             NUMERIC(15,2),
            sector_nace                    TEXT,
            crrem_stranding_year           INTEGER,
            scenario_used                  TEXT,
            created_at                     TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS carbon_markets_intel_assessments (
            id                              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                       TEXT NOT NULL,
            entity_name                     TEXT,
            assessment_date                 DATE,
            purpose                         TEXT,
            -- Portfolio totals
            total_credits_tco2e             NUMERIC(15,2),
            total_spend_usd                 NUMERIC(15,2),
            weighted_avg_price_usd          NUMERIC(8,2),
            -- VCMI Claims Code
            vcmi_claim_level                TEXT,
            vcmi_claim_eligible             BOOLEAN,
            vcmi_mitigation_contribution_pct NUMERIC(8,2),
            vcmi_credibility_score          NUMERIC(5,2),
            -- ICVCM CCPs (10 criteria)
            icvcm_ccp_pass_rate_pct         NUMERIC(6,2),
            icvcm_governance_score          NUMERIC(5,2),
            icvcm_emissions_impact_score    NUMERIC(5,2),
            icvcm_sustainable_dev_score     NUMERIC(5,2),
            icvcm_safeguards_score          NUMERIC(5,2),
            -- CORSIA Phase 2
            corsia_eligible_pct             NUMERIC(6,2),
            corsia_approved_schemes         JSONB,
            corsia_phase                    TEXT,
            -- Article 6.2 / 6.4
            article6_itmo_volume_tco2e      NUMERIC(15,2),
            article6_2_bilateral_pct        NUMERIC(6,2),
            article6_4_mechanism_pct        NUMERIC(6,2),
            corresponding_adjustment_pct    NUMERIC(6,2),
            -- Portfolio quality
            weighted_vintage_year           NUMERIC(6,1),
            methodologies_used              JSONB,
            co_benefit_premium_avg_pct      NUMERIC(6,2),
            high_integrity_share_pct        NUMERIC(6,2),
            registries_used                 JSONB,
            -- Pricing model
            fair_value_usd_per_tco2e        NUMERIC(8,2),
            price_premium_discount_pct      NUMERIC(6,2),
            vintage_discount_factor         NUMERIC(6,4),
            additionality_premium_usd       NUMERIC(6,2),
            co_benefit_premium_usd          NUMERIC(6,2),
            -- Notes
            notes                           TEXT,
            created_at                      TIMESTAMPTZ DEFAULT NOW(),
            updated_at                      TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS carbon_credit_registry_records (
            id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id                  TEXT NOT NULL,
            registry                       TEXT NOT NULL,
            project_id                     TEXT,
            project_name                   TEXT,
            methodology_code               TEXT,
            project_type                   TEXT,
            country_code                   TEXT,
            vintage_year                   INTEGER,
            volume_tco2e                   NUMERIC(15,2),
            price_usd                      NUMERIC(8,2),
            total_cost_usd                 NUMERIC(15,2),
            -- Quality flags
            icvcm_ccp_pass                 BOOLEAN,
            vcmi_eligible                  BOOLEAN,
            corsia_eligible                BOOLEAN,
            article6_corresponding_adj     BOOLEAN,
            sdg_contributions              JSONB,
            -- Integrity scores (0-10)
            additionality_score            NUMERIC(5,2),
            permanence_score               NUMERIC(5,2),
            leakage_score                  NUMERIC(5,2),
            measurability_score            NUMERIC(5,2),
            overall_quality_score          NUMERIC(5,2),
            -- Status
            retirement_status              TEXT,
            retirement_date                DATE,
            serial_number                  TEXT,
            created_at                     TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS just_transition_assessments (
            id                                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                           TEXT NOT NULL,
            entity_name                         TEXT,
            assessment_date                     DATE,
            sector                              TEXT,
            geography                           TEXT,
            -- ILO Just Transition (5 dimensions, score 0-100)
            ilo_dim1_macro_policy_score         NUMERIC(5,2),
            ilo_dim2_enterprise_policy_score    NUMERIC(5,2),
            ilo_dim3_social_protection_score    NUMERIC(5,2),
            ilo_dim4_active_labour_score        NUMERIC(5,2),
            ilo_dim5_community_score            NUMERIC(5,2),
            ilo_jt_composite_score              NUMERIC(5,2),
            ilo_jt_classification               TEXT,
            -- ESRS Social (scores 0-100)
            esrs_s1_own_workforce_score         NUMERIC(5,2),
            esrs_s2_supply_chain_score          NUMERIC(5,2),
            esrs_s3_affected_communities_score  NUMERIC(5,2),
            esrs_s4_consumers_users_score       NUMERIC(5,2),
            esrs_social_composite_score         NUMERIC(5,2),
            -- SEC Human Capital (Reg S-K Item 101c)
            sec_item101c_total_employees        INTEGER,
            sec_item101c_turnover_pct           NUMERIC(6,2),
            sec_item101c_union_pct              NUMERIC(6,2),
            sec_item101c_training_hrs_pa        NUMERIC(8,1),
            sec_hc_disclosure_quality           TEXT,
            -- Living Wage (Anker Methodology)
            living_wage_gap_pct                 NUMERIC(6,2),
            median_wage_to_living_wage_ratio    NUMERIC(6,3),
            living_wage_countries_covered       INTEGER,
            anker_benchmark_usd_month           NUMERIC(10,2),
            -- Worker Displacement
            automation_risk_high_pct            NUMERIC(6,2),
            transition_displacement_pct         NUMERIC(6,2),
            reskilling_investment_usd_pa        NUMERIC(12,2),
            displacement_timeline_yrs           NUMERIC(4,1),
            just_transition_fund_usd            NUMERIC(15,2),
            -- JT Finance (CBI — 8 criteria)
            cbi_jt_criteria_met                 INTEGER,
            jt_finance_eligible                 BOOLEAN,
            -- Overall
            overall_jt_score                    NUMERIC(5,2),
            risk_rating                         TEXT,
            key_gaps                            JSONB,
            recommendations                     JSONB,
            -- Cross-framework
            csrd_s_topics_material              JSONB,
            ungp_pillar_ii_aligned              BOOLEAN,
            oecd_rbc_aligned                    BOOLEAN,
            -- Meta
            notes                               TEXT,
            created_at                          TIMESTAMPTZ DEFAULT NOW(),
            updated_at                          TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS just_transition_stakeholder_impacts (
            id                               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id                    TEXT NOT NULL,
            stakeholder_type                 TEXT NOT NULL,
            stakeholder_group                TEXT,
            affected_count                   INTEGER,
            geography                        TEXT,
            -- Impact
            impact_severity                  TEXT,
            impact_type                      TEXT,
            impact_timeline                  TEXT,
            impact_description               TEXT,
            -- Mitigation
            mitigation_measures              JSONB,
            mitigation_effectiveness_pct     NUMERIC(5,2),
            residual_impact_score            NUMERIC(5,2),
            monitoring_mechanism             TEXT,
            -- Engagement
            stakeholder_engagement_done      BOOLEAN,
            engagement_quality               TEXT,
            grievance_mechanism_available    BOOLEAN,
            grievance_cases_open             INTEGER,
            -- ESRS linkage
            esrs_standard                    TEXT,
            material_topic                   TEXT,
            -- SBTi / ILO linkage
            sbti_flag_sector                 BOOLEAN,
            ilo_indicator_ref                TEXT,
            created_at                       TIMESTAMPTZ DEFAULT NOW()
        );

UPDATE alembic_version SET version_num='069' WHERE alembic_version.version_num = '068';

-- Running upgrade 069 -> 070

CREATE TABLE IF NOT EXISTS shipping_vessel_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            vessel_name                 TEXT,
            imo_number                  TEXT,
            vessel_type                 TEXT,
            gross_tonnage               NUMERIC(12,2),
            deadweight_tonnage          NUMERIC(12,2),
            built_year                  INTEGER,
            flag_state                  TEXT,
            assessment_year             INTEGER,
            -- CII Annual Rating
            cii_attained                NUMERIC(8,4),
            cii_required                NUMERIC(8,4),
            cii_rating                  TEXT,
            cii_reduction_target_pct    NUMERIC(6,2),
            cii_stranding_year          INTEGER,
            -- EEXI Technical Efficiency
            eexi_attained               NUMERIC(8,4),
            eexi_required               NUMERIC(8,4),
            eexi_compliant              BOOLEAN,
            epl_applied                 BOOLEAN,
            epl_power_limit_kw          NUMERIC(10,2),
            -- Poseidon Principles
            pp_alignment_score          NUMERIC(8,4),
            pp_climate_score            NUMERIC(8,4),
            pp_required_trajectory      NUMERIC(8,4),
            pp_reporting_year           INTEGER,
            -- FuelEU Maritime
            fueleu_ghg_intensity_wtw    NUMERIC(10,4),
            fueleu_target_2025          NUMERIC(10,4),
            fueleu_target_2030          NUMERIC(10,4),
            fueleu_target_2050          NUMERIC(10,4),
            fueleu_penalty_eur          NUMERIC(15,2),
            fueleu_compliant_2025       BOOLEAN,
            -- Sea Cargo Charter
            scc_aer_attained            NUMERIC(8,4),
            scc_aer_required            NUMERIC(8,4),
            scc_aligned                 BOOLEAN,
            -- EU ETS Shipping
            ets_obligation_allowances   NUMERIC(12,2),
            ets_free_allocation         NUMERIC(12,2),
            ets_surrender_gap           NUMERIC(12,2),
            ets_surrender_cost_eur      NUMERIC(15,2),
            -- Alternative Fuels
            current_fuel_type           TEXT,
            alternative_fuel_readiness  TEXT,
            lcv_current_mjt             NUMERIC(8,2),
            lcv_alternative_mjt         NUMERIC(8,2),
            fuel_switch_capex_usd       NUMERIC(15,2),
            fuel_switch_payback_yrs     NUMERIC(6,2),
            -- Notes
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS shipping_fleet_portfolios (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            portfolio_entity_id         TEXT NOT NULL,
            portfolio_name              TEXT,
            assessment_date             DATE,
            total_vessels               INTEGER,
            total_dwt                   NUMERIC(15,2),
            -- Fleet CII Distribution
            cii_a_count                 INTEGER,
            cii_b_count                 INTEGER,
            cii_c_count                 INTEGER,
            cii_d_count                 INTEGER,
            cii_e_count                 INTEGER,
            fleet_avg_cii_rating        TEXT,
            -- Portfolio Alignment
            pp_portfolio_alignment_score NUMERIC(8,4),
            pp_aligned_pct              NUMERIC(6,2),
            -- FuelEU Portfolio
            fueleu_fleet_avg_ghg        NUMERIC(10,4),
            fueleu_total_penalty_eur    NUMERIC(18,2),
            fueleu_compliant_vessels_pct NUMERIC(6,2),
            -- EU ETS Portfolio
            ets_total_obligation        NUMERIC(15,2),
            ets_total_surrender_gap     NUMERIC(15,2),
            -- Transition Plan
            fleet_renewal_plan          JSONB,
            alt_fuel_investment_usd     NUMERIC(18,2),
            stranding_risk_summary      JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS aviation_operator_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            operator_name               TEXT,
            icao_designator             TEXT,
            operator_type               TEXT,
            assessment_year             INTEGER,
            -- CORSIA Phase 2
            corsia_phase                TEXT,
            corsia_eligible             BOOLEAN,
            corsia_baseline_tco2        NUMERIC(15,2),
            corsia_actual_tco2          NUMERIC(15,2),
            corsia_growth_factor        NUMERIC(8,6),
            corsia_offsetting_obligation_tco2 NUMERIC(15,2),
            corsia_offset_cost_usd      NUMERIC(15,2),
            corsia_eligible_units_used  JSONB,
            -- SAF Blending
            saf_blend_pct_current       NUMERIC(6,3),
            saf_blend_mandate_2025      NUMERIC(6,3),
            saf_blend_mandate_2030      NUMERIC(6,3),
            saf_blend_mandate_2050      NUMERIC(6,3),
            saf_compliance_gap_pct      NUMERIC(6,3),
            saf_cost_premium_usd_tonne  NUMERIC(8,2),
            saf_total_compliance_cost_usd NUMERIC(15,2),
            ira_45z_credit_eligible     BOOLEAN,
            ira_45z_credit_usd_per_gge  NUMERIC(6,2),
            -- EU ETS Aviation
            ets_aviation_allowances_free NUMERIC(12,2),
            ets_aviation_obligation      NUMERIC(12,2),
            ets_aviation_surrender_gap   NUMERIC(12,2),
            ets_aviation_cost_eur        NUMERIC(15,2),
            -- IATA NZC Pathway
            iata_nzc_efficiency_pct      NUMERIC(6,2),
            iata_nzc_saf_pct             NUMERIC(6,2),
            iata_nzc_carbon_removal_pct  NUMERIC(6,2),
            iata_nzc_offset_pct          NUMERIC(6,2),
            iata_nzc_alignment_score     NUMERIC(5,2),
            -- Aircraft Stranding
            fleet_avg_age_yrs            NUMERIC(5,1),
            high_emission_aircraft_pct   NUMERIC(6,2),
            stranded_asset_risk_usd      NUMERIC(15,2),
            stranding_year_median        INTEGER,
            -- Notes
            notes                        TEXT,
            created_at                   TIMESTAMPTZ DEFAULT NOW(),
            updated_at                   TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS aviation_aircraft_profiles (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            aircraft_type               TEXT NOT NULL,
            aircraft_count              INTEGER,
            avg_age_yrs                 NUMERIC(5,1),
            fuel_burn_kg_per_hr         NUMERIC(8,2),
            co2_intensity_gco2_per_pkm  NUMERIC(8,4),
            range_km                    NUMERIC(8,1),
            -- Stranding analysis
            stranding_year              INTEGER,
            remaining_useful_life_yrs   NUMERIC(5,1),
            book_value_usd              NUMERIC(15,2),
            climate_adjusted_value_usd  NUMERIC(15,2),
            stranded_value_usd          NUMERIC(15,2),
            -- SAF compatibility
            saf_compatible              BOOLEAN,
            saf_blend_max_pct           NUMERIC(6,2),
            hydrogen_ready              BOOLEAN,
            electric_hybrid_candidate   BOOLEAN,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS commercial_re_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            asset_name                  TEXT,
            asset_type                  TEXT,
            gross_floor_area_m2         NUMERIC(12,2),
            location_country            TEXT,
            location_city               TEXT,
            construction_year           INTEGER,
            assessment_date             DATE,
            -- CRREM 2.0
            crrem_asset_type            TEXT,
            crrem_energy_intensity_kwh_m2 NUMERIC(10,2),
            crrem_co2_intensity_kgco2_m2 NUMERIC(10,4),
            crrem_pathway_2030          NUMERIC(10,4),
            crrem_pathway_2050          NUMERIC(10,4),
            crrem_stranding_year        INTEGER,
            crrem_stranding_risk        TEXT,
            crrem_overconsumption_gap   NUMERIC(10,4),
            -- EPC / EPBD 2024
            epc_rating_current          TEXT,
            epc_rating_target_2030      TEXT,
            epc_primary_energy_kwh_m2   NUMERIC(10,2),
            epbd_renovation_required    BOOLEAN,
            epbd_minimum_threshold      TEXT,
            epbd_compliance_deadline    TEXT,
            -- GRESB Real Estate
            gresb_score                 NUMERIC(5,1),
            gresb_management_score      NUMERIC(5,1),
            gresb_performance_score     NUMERIC(5,1),
            gresb_rating                TEXT,
            gresb_peer_group            TEXT,
            gresb_data_coverage_pct     NUMERIC(6,2),
            -- REFI Protocol
            refi_physical_risk_score    NUMERIC(5,2),
            refi_transition_risk_score  NUMERIC(5,2),
            refi_composite_score        NUMERIC(5,2),
            refi_risk_tier              TEXT,
            -- NABERS
            nabers_energy_stars         NUMERIC(3,1),
            nabers_water_stars          NUMERIC(3,1),
            nabers_indoor_stars         NUMERIC(3,1),
            nabers_waste_stars          NUMERIC(3,1),
            -- Green Lease
            green_lease_present         BOOLEAN,
            green_lease_clauses         JSONB,
            green_lease_score           NUMERIC(5,2),
            -- Financial
            asset_value_usd             NUMERIC(18,2),
            annual_noi_usd              NUMERIC(15,2),
            green_premium_pct           NUMERIC(6,2),
            brown_discount_pct          NUMERIC(6,2),
            -- Notes
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS commercial_re_retrofit_plans (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            retrofit_measure            TEXT NOT NULL,
            measure_category            TEXT,
            capex_usd                   NUMERIC(12,2),
            annual_energy_saving_kwh    NUMERIC(12,2),
            annual_co2_saving_kgco2     NUMERIC(12,2),
            annual_cost_saving_usd      NUMERIC(12,2),
            simple_payback_yrs          NUMERIC(6,2),
            npv_usd                     NUMERIC(12,2),
            irr_pct                     NUMERIC(6,2),
            epc_improvement             TEXT,
            crrem_year_improvement      INTEGER,
            implementation_priority     TEXT,
            implementation_timeline     TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS infrastructure_project_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            project_type                TEXT,
            sector                      TEXT,
            country                     TEXT,
            total_project_cost_usd      NUMERIC(18,2),
            debt_amount_usd             NUMERIC(18,2),
            equity_amount_usd           NUMERIC(15,2),
            construction_start          DATE,
            operation_start             DATE,
            project_lifetime_yrs        INTEGER,
            assessment_date             DATE,
            -- Equator Principles IV
            ep_category                 TEXT,
            ep_requirements_score       NUMERIC(5,2),
            ep_esap_required            BOOLEAN,
            ep_monitoring_required      BOOLEAN,
            ep_grievance_mechanism      BOOLEAN,
            ep_independent_review       BOOLEAN,
            ep_10_principles_scores     JSONB,
            ep_overall_compliant        BOOLEAN,
            -- IFC Performance Standards
            ifc_ps1_score               NUMERIC(5,2),
            ifc_ps2_score               NUMERIC(5,2),
            ifc_ps3_score               NUMERIC(5,2),
            ifc_ps4_score               NUMERIC(5,2),
            ifc_ps5_score               NUMERIC(5,2),
            ifc_ps6_score               NUMERIC(5,2),
            ifc_ps7_score               NUMERIC(5,2),
            ifc_ps8_score               NUMERIC(5,2),
            ifc_composite_score         NUMERIC(5,2),
            ifc_overall_compliant       BOOLEAN,
            -- OECD Common Approaches
            oecd_tier                   TEXT,
            oecd_env_screening          TEXT,
            oecd_env_review_required    BOOLEAN,
            -- Paris Alignment
            pa_mitigation_aligned       BOOLEAN,
            pa_adaptation_aligned       BOOLEAN,
            pa_climate_governance       BOOLEAN,
            pa_overall_aligned          BOOLEAN,
            pa_alignment_score          NUMERIC(5,2),
            pa_ghg_reduction_tco2_pa    NUMERIC(15,2),
            -- DSCR Climate Stress
            dscr_baseline               NUMERIC(6,3),
            dscr_physical_stress        NUMERIC(6,3),
            dscr_transition_stress      NUMERIC(6,3),
            dscr_combined_stress        NUMERIC(6,3),
            dscr_breaches_covenant      BOOLEAN,
            -- Climate Label
            cbi_certified               BOOLEAN,
            icma_gbf_aligned            BOOLEAN,
            sdg_label                   TEXT,
            -- Notes
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS infrastructure_blended_finance (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            structure_type              TEXT NOT NULL,
            -- Tranche structure
            senior_debt_usd             NUMERIC(15,2),
            senior_debt_rate_pct        NUMERIC(6,3),
            mezzanine_debt_usd          NUMERIC(15,2),
            mezzanine_rate_pct          NUMERIC(6,3),
            first_loss_tranche_usd      NUMERIC(15,2),
            first_loss_provider         TEXT,
            equity_usd                  NUMERIC(15,2),
            grant_component_usd         NUMERIC(15,2),
            -- MDB/DFI participation
            mdb_guarantee_usd           NUMERIC(15,2),
            mdb_name                    TEXT,
            concessional_debt_usd       NUMERIC(15,2),
            concessional_rate_pct       NUMERIC(6,3),
            -- Additionality
            additionality_type          TEXT,
            crowding_in_ratio           NUMERIC(6,3),
            private_finance_mobilised   NUMERIC(15,2),
            -- Blended finance metrics
            oecd_additionality_score    NUMERIC(5,2),
            blended_irr_pct             NUMERIC(6,3),
            private_sector_irr_pct      NUMERIC(6,3),
            -- SDG alignment
            sdg_targets                 JSONB,
            impact_metrics              JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

UPDATE alembic_version SET version_num='070' WHERE alembic_version.version_num = '069';

-- Running upgrade 070 -> 071

CREATE TABLE IF NOT EXISTS nbs_project_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            project_type                TEXT,
            country_code                TEXT,
            area_ha                     NUMERIC(15,2),
            assessment_date             DATE,
            -- IUCN Global Standard v2.0
            iucn_gs_criteria_met        INTEGER,
            iucn_gs_total_criteria      INTEGER,
            iucn_gs_score               NUMERIC(5,2),
            iucn_gs_standard_met        BOOLEAN,
            iucn_gs_safeguards_score    NUMERIC(5,2),
            -- REDD+
            redd_reference_level_tco2_pa NUMERIC(15,2),
            redd_actual_emissions_tco2_pa NUMERIC(15,2),
            redd_avoided_deforestation_tco2_pa NUMERIC(15,2),
            redd_leakage_belt_pct       NUMERIC(6,2),
            redd_buffer_pool_pct        NUMERIC(6,2),
            redd_net_credits_tco2_pa    NUMERIC(15,2),
            redd_methodology            TEXT,
            redd_jurisdictional         BOOLEAN,
            -- Blue Carbon
            blue_carbon_type            TEXT,
            blue_carbon_area_ha         NUMERIC(12,2),
            blue_carbon_seq_rate_tco2_ha_pa NUMERIC(8,4),
            blue_carbon_total_seq_tco2_pa NUMERIC(15,2),
            blue_carbon_permanence_risk TEXT,
            tidal_hydrology_restored    BOOLEAN,
            -- Soil Carbon
            soil_carbon_ipcc_tier       INTEGER,
            soil_carbon_delta_tco2_ha_pa NUMERIC(8,4),
            soil_carbon_total_tco2_pa   NUMERIC(15,2),
            soil_carbon_permanence_risk TEXT,
            soil_carbon_measurement_uncertainty_pct NUMERIC(6,2),
            -- ARR
            arr_above_ground_tco2_pa    NUMERIC(15,2),
            arr_below_ground_tco2_pa    NUMERIC(15,2),
            arr_soil_carbon_tco2_pa     NUMERIC(15,2),
            arr_total_tco2_pa           NUMERIC(15,2),
            arr_native_species          BOOLEAN,
            -- AFOLU net balance
            afolu_sequestration_tco2_pa NUMERIC(15,2),
            afolu_n2o_emissions_tco2e_pa NUMERIC(12,2),
            afolu_ch4_emissions_tco2e_pa NUMERIC(12,2),
            afolu_net_balance_tco2e_pa  NUMERIC(15,2),
            -- Co-benefits
            biodiversity_cobenefit_score NUMERIC(5,2),
            water_cobenefit_score       NUMERIC(5,2),
            livelihoods_cobenefit_score NUMERIC(5,2),
            cobenefit_premium_pct       NUMERIC(6,2),
            -- Credit quality
            icvcm_ccp_compatible        BOOLEAN,
            overall_credit_quality_score NUMERIC(5,2),
            estimated_credit_price_usd  NUMERIC(8,2),
            -- Notes
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS nbs_sequestration_timeseries (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            year                        INTEGER NOT NULL,
            sequestration_tco2          NUMERIC(15,2),
            emissions_tco2e             NUMERIC(12,2),
            net_balance_tco2e           NUMERIC(15,2),
            cumulative_tco2e            NUMERIC(15,2),
            buffer_pool_contribution    NUMERIC(12,2),
            credits_issued_tco2         NUMERIC(12,2),
            reversal_risk_flag          BOOLEAN,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS water_risk_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            facility_name               TEXT,
            latitude                    NUMERIC(10,6),
            longitude                   NUMERIC(10,6),
            country_code                TEXT,
            basin_name                  TEXT,
            sector                      TEXT,
            assessment_date             DATE,
            -- WRI Aqueduct 4.0
            aqueduct_water_stress       NUMERIC(5,2),
            aqueduct_water_depletion    NUMERIC(5,2),
            aqueduct_interannual_variability NUMERIC(5,2),
            aqueduct_seasonal_variability NUMERIC(5,2),
            aqueduct_groundwater_decline NUMERIC(5,2),
            aqueduct_coastal_eutrophication NUMERIC(5,2),
            aqueduct_untreated_wastewater NUMERIC(5,2),
            aqueduct_overall_score      NUMERIC(5,2),
            aqueduct_risk_tier          TEXT,
            -- CDP Water Security
            cdp_water_score             TEXT,
            cdp_a_list_eligible         BOOLEAN,
            cdp_governance_score        NUMERIC(5,2),
            cdp_risk_quantification_score NUMERIC(5,2),
            cdp_target_score            NUMERIC(5,2),
            -- ESRS E3
            esrs_e3_withdrawal_m3_pa    NUMERIC(15,2),
            esrs_e3_consumption_m3_pa   NUMERIC(15,2),
            esrs_e3_discharge_m3_pa     NUMERIC(15,2),
            esrs_e3_recycled_pct        NUMERIC(6,2),
            esrs_e3_water_intensive     BOOLEAN,
            esrs_e3_disclosure_score    NUMERIC(5,2),
            -- TNFD water dependency
            tnfd_water_dependency_score NUMERIC(5,2),
            tnfd_encore_water_services  JSONB,
            -- Financial impact
            revenue_at_risk_pct         NUMERIC(6,2),
            compliance_cost_usd_pa      NUMERIC(12,2),
            capex_resilience_usd        NUMERIC(12,2),
            -- Physical risk (RCP scenarios)
            physical_risk_rcp26         TEXT,
            physical_risk_rcp45         TEXT,
            physical_risk_rcp85         TEXT,
            -- Overall
            materiality_rating          TEXT,
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS water_footprint_calculations (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            product_or_process          TEXT NOT NULL,
            blue_water_m3_per_unit      NUMERIC(12,4),
            green_water_m3_per_unit     NUMERIC(12,4),
            grey_water_m3_per_unit      NUMERIC(12,4),
            total_footprint_m3_per_unit NUMERIC(12,4),
            annual_volume_units         NUMERIC(15,2),
            total_blue_m3_pa            NUMERIC(15,2),
            total_green_m3_pa           NUMERIC(15,2),
            total_grey_m3_pa            NUMERIC(15,2),
            hotspot_flag                BOOLEAN,
            methodology                 TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS food_system_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            entity_name                 TEXT,
            sector                      TEXT,
            assessment_date             DATE,
            reporting_year              INTEGER,
            -- SBTi FLAG
            flag_sector                 TEXT,
            flag_land_mitigation_tco2_pa NUMERIC(15,2),
            flag_removal_tco2_pa        NUMERIC(15,2),
            flag_reduction_tco2_pa      NUMERIC(15,2),
            flag_target_year            INTEGER,
            flag_base_year              INTEGER,
            flag_target_pct             NUMERIC(6,2),
            flag_target_met             BOOLEAN,
            flag_science_based          BOOLEAN,
            -- FAO crop yield impact
            primary_crop                TEXT,
            growing_region              TEXT,
            baseline_yield_t_ha         NUMERIC(8,3),
            yield_impact_rcp26_pct      NUMERIC(6,2),
            yield_impact_rcp45_pct      NUMERIC(6,2),
            yield_impact_rcp85_pct      NUMERIC(6,2),
            adaptation_yield_gain_pct   NUMERIC(6,2),
            revenue_at_risk_usd_pa      NUMERIC(15,2),
            -- TNFD Food LEAP
            tnfd_leap_score             NUMERIC(5,2),
            nature_dependency_score     NUMERIC(5,2),
            nature_impact_score         NUMERIC(5,2),
            tnfd_water_dependency       NUMERIC(5,2),
            tnfd_biodiversity_risk      TEXT,
            -- EUDR deforestation-free
            eudr_commodity_screened     TEXT,
            eudr_country_risk_tier      TEXT,
            eudr_deforestation_free     BOOLEAN,
            eudr_cutoff_date_compliant  BOOLEAN,
            eudr_geolocation_verified   BOOLEAN,
            -- ICTI
            icti_scope                  TEXT,
            icti_score                  NUMERIC(5,2),
            -- Agricultural financed emissions
            ag_scope1_tco2e_pa          NUMERIC(15,2),
            ag_scope2_tco2e_pa          NUMERIC(12,2),
            ag_scope3_cat1_tco2e_pa     NUMERIC(15,2),
            ag_total_emissions_tco2e_pa NUMERIC(15,2),
            -- LDN
            ldn_status                  TEXT,
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS flag_target_settings (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            target_type                 TEXT NOT NULL,
            sector                      TEXT,
            commodity                   TEXT,
            base_year                   INTEGER,
            target_year                 INTEGER,
            base_emissions_tco2e        NUMERIC(15,2),
            target_emissions_tco2e      NUMERIC(15,2),
            required_reduction_pct      NUMERIC(6,2),
            current_trajectory_pct      NUMERIC(6,2),
            gap_pct                     NUMERIC(6,2),
            interventions               JSONB,
            sbti_approved               BOOLEAN,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS circular_economy_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            entity_name                 TEXT,
            sector                      TEXT,
            assessment_date             DATE,
            reporting_year              INTEGER,
            -- ESRS E5
            esrs_e5_resource_inflows_t  NUMERIC(15,2),
            esrs_e5_recycled_inflows_pct NUMERIC(6,2),
            esrs_e5_resource_outflows_t NUMERIC(15,2),
            esrs_e5_waste_t             NUMERIC(12,2),
            esrs_e5_recycled_outflows_pct NUMERIC(6,2),
            esrs_e5_crm_dependency      BOOLEAN,
            esrs_e5_crm_list            JSONB,
            esrs_e5_disclosure_score    NUMERIC(5,2),
            esrs_e5_target_set          BOOLEAN,
            -- EMF Material Circularity Indicator
            mci_recycled_input_fraction NUMERIC(6,4),
            mci_waste_recovery_fraction NUMERIC(6,4),
            mci_utility_factor          NUMERIC(6,4),
            mci_score                   NUMERIC(6,4),
            mci_benchmark               NUMERIC(6,4),
            mci_gap_to_benchmark        NUMERIC(6,4),
            -- WBCSD CTI
            cti_circular_product_design NUMERIC(5,2),
            cti_waste_recovery          NUMERIC(5,2),
            cti_recycled_content        NUMERIC(5,2),
            cti_product_lifetime        NUMERIC(5,2),
            cti_composite_score         NUMERIC(5,2),
            cti_tier                    TEXT,
            -- EPR Compliance
            epr_packaging_liable        BOOLEAN,
            epr_packaging_cost_eur_pa   NUMERIC(12,2),
            epr_ewaste_liable           BOOLEAN,
            epr_ewaste_cost_eur_pa      NUMERIC(12,2),
            epr_battery_liable          BOOLEAN,
            epr_battery_cost_eur_pa     NUMERIC(12,2),
            epr_total_cost_eur_pa       NUMERIC(12,2),
            -- CRM (EU CRM Act 2023)
            crm_dependency_score        NUMERIC(5,2),
            crm_supply_risk_score       NUMERIC(5,2),
            crm_recycled_content_pct    NUMERIC(6,2),
            crm_2030_target_gap         NUMERIC(6,2),
            -- LCA
            lca_cradle_to_gate_kgco2e   NUMERIC(12,4),
            lca_cradle_to_cradle_kgco2e NUMERIC(12,4),
            lca_circularity_benefit_pct NUMERIC(6,2),
            -- Overall
            overall_circularity_score   NUMERIC(5,2),
            risk_rating                 TEXT,
            investment_needed_usd       NUMERIC(15,2),
            notes                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ DEFAULT NOW()
        );

CREATE TABLE IF NOT EXISTS material_flow_analyses (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT NOT NULL,
            material_name               TEXT NOT NULL,
            material_category           TEXT,
            crm_flag                    BOOLEAN,
            -- Inflows
            primary_input_t_pa          NUMERIC(12,2),
            recycled_input_t_pa         NUMERIC(12,2),
            bio_based_input_t_pa        NUMERIC(12,2),
            total_inflow_t_pa           NUMERIC(12,2),
            recycled_input_pct          NUMERIC(6,2),
            -- Outflows
            product_output_t_pa         NUMERIC(12,2),
            reused_output_t_pa          NUMERIC(12,2),
            recycled_output_t_pa        NUMERIC(12,2),
            waste_disposed_t_pa         NUMERIC(12,2),
            recovery_rate_pct           NUMERIC(6,2),
            -- Supply risk
            hhi_supply_concentration    NUMERIC(6,2),
            top_supplier_country        TEXT,
            supply_risk_score           NUMERIC(5,2),
            -- Decarbonisation
            embodied_carbon_kgco2e_t    NUMERIC(10,4),
            recycled_carbon_saving_pct  NUMERIC(6,2),
            -- EU 2030 targets
            eu_2030_extraction_target_pct NUMERIC(6,2),
            eu_2030_processing_target_pct NUMERIC(6,2),
            eu_2030_recycling_target_pct NUMERIC(6,2),
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );

UPDATE alembic_version SET version_num='071' WHERE alembic_version.version_num = '070';

-- Running upgrade 071 -> 077

CREATE TABLE IF NOT EXISTS crypto_climate_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- asset details
            asset_name                  TEXT,
            ticker                      TEXT,
            consensus_mechanism         TEXT,
            -- energy metrics
            annual_energy_twh           NUMERIC(12,4),
            lower_bound_twh             NUMERIC(12,4),
            upper_bound_twh             NUMERIC(12,4),
            ghg_intensity_gco2_per_tx   NUMERIC(12,4),
            mining_renewable_pct        NUMERIC(5,2),
            mining_carbon_intensity     NUMERIC(8,2),
            -- total footprint
            total_tco2e_per_year        NUMERIC(15,2),
            -- MiCA compliance
            mica_compliance_level       TEXT,
            mica_score                  NUMERIC(5,2),
            mica_gaps                   JSONB,
            -- tokenised green assets
            is_tokenised_green_asset    BOOLEAN DEFAULT FALSE,
            rwa_framework               TEXT,
            tokenisation_premium_bps    NUMERIC(6,2),
            -- PCAF financed emissions
            financed_emissions_tco2e    NUMERIC(15,2),
            pcaf_dqs                    INTEGER,
            -- scores
            overall_score               NUMERIC(5,2),
            climate_risk_tier           TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_crypto_climate_entity ON crypto_climate_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS crypto_portfolio_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- portfolio totals
            total_holdings              INTEGER,
            total_exposure_usd          NUMERIC(20,2),
            total_tco2e_per_year        NUMERIC(15,2),
            weighted_avg_ghg_intensity  NUMERIC(12,4),
            portfolio_renewable_pct     NUMERIC(5,2),
            -- by consensus mechanism
            pow_exposure_pct            NUMERIC(5,2),
            pos_exposure_pct            NUMERIC(5,2),
            -- MiCA
            mica_compliant_pct          NUMERIC(5,2),
            -- financed emissions
            total_financed_emissions    NUMERIC(15,2),
            weighted_avg_dqs            NUMERIC(4,2),
            -- scores
            portfolio_climate_score     NUMERIC(5,2),
            climate_risk_tier           TEXT,
            holdings_detail             JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_crypto_portfolio_entity ON crypto_portfolio_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS ai_governance_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            system_name                 TEXT,
            assessment_date             DATE,
            -- EU AI Act
            eu_ai_act_risk_tier         TEXT,
            eu_ai_act_score             NUMERIC(5,2),
            eu_ai_act_obligations       JSONB,
            eu_ai_act_gaps              JSONB,
            -- NIST AI RMF
            nist_rmf_score              NUMERIC(5,2),
            nist_govern_score           NUMERIC(5,2),
            nist_map_score              NUMERIC(5,2),
            nist_measure_score          NUMERIC(5,2),
            nist_manage_score           NUMERIC(5,2),
            -- OECD AI Principles
            oecd_score                  NUMERIC(5,2),
            oecd_gaps                   JSONB,
            -- AI Energy
            training_energy_mwh         NUMERIC(12,2),
            annual_inference_mwh        NUMERIC(12,2),
            annual_tco2e                NUMERIC(10,2),
            -- Algorithmic Bias
            bias_severity               TEXT,
            bias_metrics                JSONB,
            protected_characteristics   JSONB,
            -- Model Card
            model_card_completeness_pct NUMERIC(5,2),
            model_card_gaps             JSONB,
            -- Composite
            governance_score            NUMERIC(5,2),
            environmental_score         NUMERIC(5,2),
            social_score                NUMERIC(5,2),
            composite_score             NUMERIC(5,2),
            maturity_tier               TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_ai_governance_entity ON ai_governance_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_ai_governance_tier ON ai_governance_assessments(eu_ai_act_risk_tier);;

CREATE TABLE IF NOT EXISTS ai_portfolio_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- portfolio summary
            total_systems               INTEGER,
            high_risk_systems           INTEGER,
            unacceptable_risk_systems   INTEGER,
            -- energy
            total_training_mwh          NUMERIC(15,2),
            total_inference_mwh_pa      NUMERIC(15,2),
            total_tco2e_pa              NUMERIC(12,2),
            -- governance
            avg_composite_score         NUMERIC(5,2),
            avg_eu_ai_act_score         NUMERIC(5,2),
            avg_nist_rmf_score          NUMERIC(5,2),
            avg_bias_severity_score     NUMERIC(5,2),
            -- portfolio tier
            portfolio_maturity_tier     TEXT,
            systems_detail              JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_ai_portfolio_entity ON ai_portfolio_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS carbon_accounting_ai_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- GHG Protocol compliance
            ghg_compliance_score        NUMERIC(5,2),
            ghg_compliance_status       TEXT,
            ghg_gaps                    JSONB,
            -- Emission Factor matching
            ef_match_count              INTEGER,
            ef_avg_confidence           NUMERIC(5,2),
            ef_avg_dqs                  NUMERIC(4,2),
            ef_matches                  JSONB,
            -- Scope 3 classification
            scope3_classified_count     INTEGER,
            scope3_avg_confidence       NUMERIC(5,2),
            scope3_categories_used      JSONB,
            flag_split                  JSONB,
            -- DQS derivation
            auto_dqs_score              NUMERIC(4,2),
            dqs_improvement_potential   NUMERIC(4,2),
            -- XBRL tagging
            xbrl_tagged_count           INTEGER,
            xbrl_completeness_pct       NUMERIC(5,2),
            xbrl_mandatory_gaps         JSONB,
            -- CDP scoring
            cdp_climate_score           TEXT,
            cdp_water_score             TEXT,
            cdp_composite               NUMERIC(5,2),
            -- Data gaps
            gap_count                   INTEGER,
            materiality_weighted_gap    NUMERIC(5,2),
            gap_recommendations         JSONB,
            -- overall
            automation_readiness_score  NUMERIC(5,2),
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_carbon_ai_entity ON carbon_accounting_ai_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS ef_match_records (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT,
            activity_description        TEXT,
            matched_ef_source           TEXT,
            matched_ef_value            NUMERIC(12,6),
            matched_ef_unit             TEXT,
            scope3_category             TEXT,
            confidence_score            NUMERIC(5,4),
            dqs_level                   INTEGER,
            ghg_protocol_category       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_ef_match_assessment ON ef_match_records(assessment_id);;

CREATE TABLE IF NOT EXISTS climate_insurance_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            insurer_name                TEXT,
            insurer_type                TEXT,
            assessment_date             DATE,
            -- IAIS compliance
            iais_score                  NUMERIC(5,2),
            iais_status                 TEXT,
            iais_governance_score       NUMERIC(5,2),
            iais_strategy_score         NUMERIC(5,2),
            iais_risk_mgmt_score        NUMERIC(5,2),
            iais_disclosure_score       NUMERIC(5,2),
            iais_gaps                   JSONB,
            -- Climate VaR
            climate_var_physical        NUMERIC(15,2),
            climate_var_transition      NUMERIC(15,2),
            climate_var_liability       NUMERIC(15,2),
            climate_var_total           NUMERIC(15,2),
            climate_var_pct_capital     NUMERIC(6,2),
            -- ORSA stress
            pre_stress_solvency_ratio   NUMERIC(6,2),
            post_stress_solvency_ratio  NUMERIC(6,2),
            scr_uplift_pct              NUMERIC(6,2),
            worst_case_scenario         TEXT,
            orsa_checklist_score        NUMERIC(5,2),
            -- NatCat exposure
            total_exposure_bn           NUMERIC(15,2),
            aal_pct                     NUMERIC(6,4),
            pml_1_in_100_pct            NUMERIC(6,4),
            pml_1_in_250_pct            NUMERIC(6,4),
            -- Protection gap
            protection_gap_pct          NUMERIC(5,2),
            insured_loss_ratio          NUMERIC(5,2),
            -- casualty liability
            do_exposure_m               NUMERIC(12,2),
            eo_exposure_m               NUMERIC(12,2),
            pollution_exposure_m        NUMERIC(12,2),
            -- overall
            overall_climate_risk_score  NUMERIC(5,2),
            climate_risk_tier           TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_climate_insurance_entity ON climate_insurance_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_climate_insurance_type ON climate_insurance_assessments(insurer_type);;

CREATE TABLE IF NOT EXISTS parametric_insurance_designs (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            product_name                TEXT,
            index_type                  TEXT,
            trigger_threshold           NUMERIC(12,4),
            exit_threshold              NUMERIC(12,4),
            max_payout_usd              NUMERIC(15,2),
            min_payout_usd              NUMERIC(15,2),
            annual_premium_usd          NUMERIC(15,2),
            premium_loading_pct         NUMERIC(5,2),
            basis_risk_score            NUMERIC(5,4),
            expected_annual_payout      NUMERIC(15,2),
            loss_ratio_expected         NUMERIC(5,2),
            payout_structure            JSONB,
            historical_trigger_freq     NUMERIC(5,2),
            climate_adj_trigger_freq    NUMERIC(5,2),
            country_code                TEXT,
            peril                       TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_parametric_entity ON parametric_insurance_designs(entity_id);;

UPDATE alembic_version SET version_num='077' WHERE alembic_version.version_num = '071';

-- Running upgrade 077 -> 078

CREATE TABLE IF NOT EXISTS sbtn_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- SBTN 5-Step process
            step1_assess_score          NUMERIC(5,2),
            step1_high_impact_sectors   JSONB,
            step1_dependency_exposure   JSONB,
            step2_interpret_score       NUMERIC(5,2),
            step2_material_locations    JSONB,
            step2_priority_areas        JSONB,
            step3_measure_score         NUMERIC(5,2),
            step3_msa_km2_footprint     NUMERIC(15,4),
            step3_ecosystem_services    JSONB,
            step4_targets_set           INTEGER,
            step4_science_based_pct     NUMERIC(5,2),
            step4_target_detail         JSONB,
            step5_disclosure_score      NUMERIC(5,2),
            step5_tnfd_aligned          BOOLEAN DEFAULT FALSE,
            -- TNFD v1.0 metrics
            tnfd_governance_score       NUMERIC(5,2),
            tnfd_strategy_score         NUMERIC(5,2),
            tnfd_risk_mgmt_score        NUMERIC(5,2),
            tnfd_metrics_score          NUMERIC(5,2),
            tnfd_composite              NUMERIC(5,2),
            tnfd_gaps                   JSONB,
            -- EU Nature Restoration Law
            nrl_exposure_score          NUMERIC(5,2),
            nrl_habitat_types           JSONB,
            nrl_restoration_liability_m NUMERIC(12,2),
            -- GBF Target 3 (30x30)
            gbf_t3_protected_area_pct   NUMERIC(5,2),
            gbf_t3_exposure             JSONB,
            -- ENCORE ecosystem services
            encore_dependencies         JSONB,
            encore_impacts              JSONB,
            encore_financial_exposure_m NUMERIC(15,2),
            -- composite
            nature_strategy_score       NUMERIC(5,2),
            nature_maturity_tier        TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_sbtn_entity ON sbtn_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_sbtn_tier ON sbtn_assessments(nature_maturity_tier);;

CREATE TABLE IF NOT EXISTS nature_target_registry (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            target_type                 TEXT,
            target_scope                TEXT,
            baseline_year               INTEGER,
            target_year                 INTEGER,
            baseline_value              NUMERIC(15,4),
            target_value                NUMERIC(15,4),
            unit                        TEXT,
            science_based               BOOLEAN DEFAULT FALSE,
            sbtn_step                   INTEGER,
            verification_body           TEXT,
            status                      TEXT DEFAULT 'set',
            progress_pct                NUMERIC(5,2),
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_nature_target_entity ON nature_target_registry(entity_id);;

CREATE TABLE IF NOT EXISTS green_securitisation_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            deal_name                   TEXT,
            assessment_date             DATE,
            -- structure
            structure_type              TEXT,
            total_issuance_m            NUMERIC(15,2),
            senior_tranche_m            NUMERIC(15,2),
            mezzanine_tranche_m         NUMERIC(15,2),
            junior_tranche_m            NUMERIC(15,2),
            -- EU GBS compliance
            eu_gbs_aligned              BOOLEAN DEFAULT FALSE,
            eu_gbs_score                NUMERIC(5,2),
            eu_gbs_gaps                 JSONB,
            taxonomy_alignment_pct      NUMERIC(5,2),
            dnsh_pass                   BOOLEAN,
            min_safeguards_pass         BOOLEAN,
            -- Climate VaR pass-through
            pool_climate_var_physical   NUMERIC(15,2),
            pool_climate_var_transition NUMERIC(15,2),
            pool_weighted_pd_climate    NUMERIC(5,4),
            pool_weighted_lgd_climate   NUMERIC(5,4),
            climate_credit_enhancement  NUMERIC(5,2),
            -- covered bond ESG
            is_covered_bond             BOOLEAN DEFAULT FALSE,
            ecbc_label_eligible         BOOLEAN DEFAULT FALSE,
            covered_bond_esv_score      NUMERIC(5,2),
            -- ABS/RMBS
            is_rmbs                     BOOLEAN DEFAULT FALSE,
            energy_efficiency_pct       NUMERIC(5,2),
            epc_distribution            JSONB,
            crrem_aligned_pct           NUMERIC(5,2),
            -- ESRS SPV disclosure
            esrs_spv_applicable         BOOLEAN DEFAULT FALSE,
            esrs_spv_disclosure_score   NUMERIC(5,2),
            -- overall
            green_securitisation_score  NUMERIC(5,2),
            deal_tier                   TEXT,
            greenium_bps                NUMERIC(6,2),
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_green_sec_entity ON green_securitisation_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_green_sec_type ON green_securitisation_assessments(structure_type);;

CREATE TABLE IF NOT EXISTS structured_pool_assets (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            deal_id                     TEXT,
            asset_type                  TEXT,
            asset_count                 INTEGER,
            total_balance_m             NUMERIC(15,2),
            avg_ltv                     NUMERIC(5,2),
            avg_dscr                    NUMERIC(5,2),
            taxonomy_eligible_pct       NUMERIC(5,2),
            taxonomy_aligned_pct        NUMERIC(5,2),
            epc_a_b_pct                 NUMERIC(5,2),
            physical_risk_exposure_pct  NUMERIC(5,2),
            transition_risk_exposure_pct NUMERIC(5,2),
            avg_pd_base                 NUMERIC(5,4),
            avg_pd_climate              NUMERIC(5,4),
            sector_breakdown            JSONB,
            geography_breakdown         JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_pool_deal ON structured_pool_assets(deal_id);;

CREATE TABLE IF NOT EXISTS digital_product_passport_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            product_name                TEXT,
            product_category            TEXT,
            gtin_ean                    TEXT,
            assessment_date             DATE,
            -- EU ESPR compliance
            espr_applicable             BOOLEAN DEFAULT FALSE,
            espr_regulation_ref         TEXT,
            espr_score                  NUMERIC(5,2),
            espr_status                 TEXT,
            espr_gaps                   JSONB,
            -- DPP schema completeness
            dpp_completeness_pct        NUMERIC(5,2),
            dpp_mandatory_fields        INTEGER,
            dpp_completed_fields        INTEGER,
            dpp_schema_version          TEXT,
            -- Lifecycle GHG
            lifecycle_scope1_tco2e      NUMERIC(12,4),
            lifecycle_scope2_tco2e      NUMERIC(12,4),
            lifecycle_scope3_tco2e      NUMERIC(12,4),
            lifecycle_total_tco2e       NUMERIC(12,4),
            lifecycle_method            TEXT,
            carbon_footprint_per_unit   NUMERIC(10,6),
            -- Circularity
            recycled_content_pct        NUMERIC(5,2),
            recyclability_score         NUMERIC(5,2),
            durability_score            NUMERIC(5,2),
            repairability_score         NUMERIC(5,2),
            circularity_index           NUMERIC(5,2),
            -- EU Battery Regulation
            is_battery_product          BOOLEAN DEFAULT FALSE,
            battery_carbon_footprint    NUMERIC(10,4),
            battery_recycled_content    JSONB,
            battery_supply_chain_dd     BOOLEAN DEFAULT FALSE,
            battery_regulation_score    NUMERIC(5,2),
            -- EPR liability
            epr_scheme_country          TEXT,
            epr_annual_levy_eur         NUMERIC(12,2),
            epr_exemption_applicable    BOOLEAN DEFAULT FALSE,
            -- overall
            dpp_readiness_score         NUMERIC(5,2),
            espr_tier                   TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_dpp_entity ON digital_product_passport_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_dpp_category ON digital_product_passport_assessments(product_category);;

CREATE TABLE IF NOT EXISTS product_lifecycle_stages (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT,
            stage_name                  TEXT,
            stage_code                  TEXT,
            tco2e                       NUMERIC(12,6),
            energy_mwh                  NUMERIC(12,4),
            water_m3                    NUMERIC(12,4),
            waste_tonnes                NUMERIC(12,4),
            primary_activity            TEXT,
            ef_source                   TEXT,
            data_quality_score          INTEGER,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lifecycle_assessment ON product_lifecycle_stages(assessment_id);;

CREATE TABLE IF NOT EXISTS adaptation_finance_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            country_code                TEXT,
            assessment_date             DATE,
            -- GFMA adaptation taxonomy
            adaptation_category         TEXT,
            adaptation_subcategory      TEXT,
            gfma_aligned                BOOLEAN DEFAULT FALSE,
            gfma_score                  NUMERIC(5,2),
            -- resilience delta
            baseline_physical_risk_score NUMERIC(5,2),
            post_investment_risk_score  NUMERIC(5,2),
            resilience_delta            NUMERIC(5,2),
            risk_reduction_pct          NUMERIC(5,2),
            -- GARI methodology
            gari_score                  NUMERIC(5,2),
            gari_tier                   TEXT,
            adaptation_effectiveness    NUMERIC(5,2),
            maladaptation_risk          NUMERIC(5,2),
            -- investment sizing
            total_investment_m          NUMERIC(15,2),
            public_finance_m            NUMERIC(15,2),
            private_finance_m           NUMERIC(15,2),
            blended_ratio               NUMERIC(5,2),
            expected_lives_protected    INTEGER,
            cost_per_beneficiary_usd    NUMERIC(10,2),
            -- NPV / BCR
            adaptation_npv_m            NUMERIC(15,2),
            benefit_cost_ratio          NUMERIC(6,2),
            discount_rate_pct           NUMERIC(4,2),
            appraisal_horizon_years     INTEGER,
            -- NAP alignment
            nap_country_aligned         BOOLEAN DEFAULT FALSE,
            nap_priority_area           TEXT,
            ndcs_aligned                BOOLEAN DEFAULT FALSE,
            -- MDB / climate finance
            mdb_financing_eligible      BOOLEAN DEFAULT FALSE,
            mdb_facility               TEXT,
            gcf_eligible                BOOLEAN DEFAULT FALSE,
            gef_eligible                BOOLEAN DEFAULT FALSE,
            -- UNFCCC LT-LEDS
            lt_leds_aligned             BOOLEAN DEFAULT FALSE,
            rcp_scenario_designed_for   TEXT,
            climate_horizon_year        INTEGER,
            -- physical hazards addressed
            hazards_addressed           JSONB,
            sector                      TEXT,
            -- overall
            adaptation_score            NUMERIC(5,2),
            bankability_tier            TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_adaptation_entity ON adaptation_finance_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_adaptation_country ON adaptation_finance_assessments(country_code);
        CREATE INDEX IF NOT EXISTS idx_adaptation_tier ON adaptation_finance_assessments(bankability_tier);;

CREATE TABLE IF NOT EXISTS adaptation_portfolio_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- portfolio summary
            total_projects              INTEGER,
            total_investment_m          NUMERIC(15,2),
            avg_resilience_delta        NUMERIC(5,2),
            avg_benefit_cost_ratio      NUMERIC(6,2),
            avg_gari_score              NUMERIC(5,2),
            -- by category
            category_breakdown          JSONB,
            country_breakdown           JSONB,
            hazard_breakdown            JSONB,
            -- finance structure
            public_finance_pct          NUMERIC(5,2),
            private_finance_pct         NUMERIC(5,2),
            blended_pct                 NUMERIC(5,2),
            gcf_eligible_pct            NUMERIC(5,2),
            -- alignment
            nap_aligned_pct             NUMERIC(5,2),
            ndc_aligned_pct             NUMERIC(5,2),
            gfma_aligned_pct            NUMERIC(5,2),
            -- portfolio score
            portfolio_adaptation_score  NUMERIC(5,2),
            portfolio_tier              TEXT,
            projects_detail             JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_adapt_portfolio_entity ON adaptation_portfolio_assessments(entity_id);;

UPDATE alembic_version SET version_num='078' WHERE alembic_version.version_num = '077';

-- Running upgrade 078 -> 079

CREATE TABLE IF NOT EXISTS internal_carbon_price_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- ICP mechanism
            mechanism_type              TEXT,
            shadow_price_eur_tco2       NUMERIC(8,2),
            fee_eur_tco2                NUMERIC(8,2),
            price_trajectory            JSONB,
            price_scenario              TEXT,
            -- SBTi alignment
            sbti_icp_guidance_met       BOOLEAN DEFAULT FALSE,
            sbti_recommended_min_eur    NUMERIC(8,2),
            sbti_alignment_score        NUMERIC(5,2),
            -- Scope cost allocation
            scope1_cost_eur             NUMERIC(15,2),
            scope2_cost_eur             NUMERIC(15,2),
            scope3_cost_eur             NUMERIC(15,2),
            total_carbon_cost_eur       NUMERIC(15,2),
            carbon_cost_pct_ebitda      NUMERIC(5,2),
            -- Carbon budget
            remaining_budget_tco2       NUMERIC(15,2),
            budget_exhaustion_year      INTEGER,
            annual_reduction_required_pct NUMERIC(5,2),
            -- Net-zero economics
            nze_investment_eur          NUMERIC(15,2),
            nze_opex_savings_eur        NUMERIC(15,2),
            nze_npv_eur                 NUMERIC(15,2),
            nze_payback_years           NUMERIC(5,2),
            nze_irr_pct                 NUMERIC(5,2),
            abatement_cost_curve        JSONB,
            -- EU ETS shadow
            ets_shadow_price_eur        NUMERIC(8,2),
            ets_phase4_exposure_eur     NUMERIC(15,2),
            ets2_exposure_eur           NUMERIC(15,2),
            -- overall
            icp_maturity_score          NUMERIC(5,2),
            icp_maturity_tier           TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_icp_entity ON internal_carbon_price_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS carbon_budget_tracking (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            budget_year                 INTEGER NOT NULL,
            scenario                    TEXT,
            budget_tco2                 NUMERIC(15,2),
            actual_tco2                 NUMERIC(15,2),
            variance_tco2               NUMERIC(15,2),
            cumulative_budget_tco2      NUMERIC(15,2),
            cumulative_actual_tco2      NUMERIC(15,2),
            on_track                    BOOLEAN DEFAULT TRUE,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_budget_entity_year ON carbon_budget_tracking(entity_id, budget_year);;

CREATE TABLE IF NOT EXISTS social_bond_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            bond_name                   TEXT,
            assessment_date             DATE,
            total_issuance_m            NUMERIC(15,2),
            currency                    TEXT DEFAULT 'EUR',
            -- ICMA SBP 4 core components
            use_of_proceeds_score       NUMERIC(5,2),
            process_evaluation_score    NUMERIC(5,2),
            management_proceeds_score   NUMERIC(5,2),
            reporting_score             NUMERIC(5,2),
            sbp_composite_score         NUMERIC(5,2),
            sbp_aligned                 BOOLEAN DEFAULT FALSE,
            sbp_gaps                    JSONB,
            -- Use of proceeds
            project_categories          JSONB,
            primary_category            TEXT,
            excluded_activities         JSONB,
            -- Target population
            target_populations          JSONB,
            beneficiaries_count         INTEGER,
            geographic_coverage         JSONB,
            -- Social KPIs
            kpis_defined                INTEGER,
            kpis_quantified             INTEGER,
            kpi_details                 JSONB,
            -- SDG mapping
            sdg_alignment               JSONB,
            primary_sdg                 INTEGER,
            sdg_count                   INTEGER,
            -- Impact reporting
            impact_report_committed     BOOLEAN DEFAULT FALSE,
            impact_report_score         NUMERIC(5,2),
            -- External review
            has_spo                     BOOLEAN DEFAULT FALSE,
            spo_provider                TEXT,
            -- overall
            impact_score                NUMERIC(5,2),
            bond_tier                   TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_social_bond_entity ON social_bond_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS social_impact_kpis (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT,
            kpi_name                    TEXT,
            kpi_category                TEXT,
            baseline_value              NUMERIC(15,4),
            target_value                NUMERIC(15,4),
            unit                        TEXT,
            measurement_method          TEXT,
            verification_source         TEXT,
            sdg_target                  TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_social_kpi_assessment ON social_impact_kpis(assessment_id);;

CREATE TABLE IF NOT EXISTS climate_financial_statement_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            reporting_period            TEXT,
            assessment_date             DATE,
            -- IFRS S2 financial effects
            ifrs_s2_score               NUMERIC(5,2),
            financial_effects_disclosed BOOLEAN DEFAULT FALSE,
            transition_risk_revenue_impact_m  NUMERIC(15,2),
            transition_risk_cost_impact_m     NUMERIC(15,2),
            physical_risk_asset_impact_m      NUMERIC(15,2),
            climate_opportunity_revenue_m     NUMERIC(15,2),
            -- IAS 36 climate impairment
            ias36_assessment_required   BOOLEAN DEFAULT FALSE,
            ias36_climate_triggers      JSONB,
            potential_impairment_m      NUMERIC(15,2),
            impairment_tested_assets    JSONB,
            -- Carbon provision
            carbon_provision_required_m NUMERIC(15,2),
            carbon_provision_basis      TEXT,
            ets_allowance_deficit       NUMERIC(10,2),
            -- Stranded asset write-down
            stranded_asset_exposure_m   NUMERIC(15,2),
            write_down_trigger_year     INTEGER,
            write_down_amount_m         NUMERIC(15,2),
            -- Climate P&L
            climate_adjusted_revenue_m  NUMERIC(15,2),
            climate_adjusted_ebitda_m   NUMERIC(15,2),
            climate_adjusted_pat_m      NUMERIC(15,2),
            climate_ebitda_impact_pct   NUMERIC(5,2),
            -- TCFD financial scenario table
            scenario_1_5c_impact_m      NUMERIC(15,2),
            scenario_2c_impact_m        NUMERIC(15,2),
            scenario_3c_impact_m        NUMERIC(15,2),
            scenario_detail             JSONB,
            -- Disclosure completeness
            disclosure_completeness_pct NUMERIC(5,2),
            disclosure_gaps             JSONB,
            -- overall
            climate_financial_risk_score NUMERIC(5,2),
            materiality_tier            TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_climate_fs_entity ON climate_financial_statement_assessments(entity_id);;

CREATE TABLE IF NOT EXISTS em_climate_risk_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            country_code                TEXT NOT NULL,
            assessment_date             DATE,
            -- Country climate risk
            physical_risk_score         NUMERIC(5,2),
            transition_readiness_score  NUMERIC(5,2),
            ndc_ambition_score          NUMERIC(5,2),
            climate_vulnerability_index NUMERIC(5,2),
            nd_gain_score               NUMERIC(5,2),
            -- IFC PS6 biodiversity
            ifc_ps6_applicable          BOOLEAN DEFAULT FALSE,
            ifc_ps6_score               NUMERIC(5,2),
            critical_habitat_exposure   BOOLEAN DEFAULT FALSE,
            biodiversity_offset_required BOOLEAN DEFAULT FALSE,
            -- Green finance market
            green_bond_market_size_bn   NUMERIC(10,2),
            green_bond_pipeline_bn      NUMERIC(10,2),
            sustainable_finance_depth   NUMERIC(5,2),
            local_currency_risk         NUMERIC(5,2),
            -- Transition risk factors
            fossil_fuel_dependency_pct  NUMERIC(5,2),
            renewable_capacity_gw       NUMERIC(8,2),
            carbon_intensity_gdp        NUMERIC(8,4),
            just_transition_risk        NUMERIC(5,2),
            policy_regulatory_risk      NUMERIC(5,2),
            -- Concessional finance opportunity
            gcf_allocation_bn           NUMERIC(8,2),
            dfi_pipeline_bn             NUMERIC(8,2),
            blended_finance_potential   NUMERIC(5,2),
            -- GEMS loss data
            gems_historical_loss_bn     NUMERIC(10,2),
            gems_climate_uplift_pct     NUMERIC(5,2),
            -- overall
            em_climate_composite        NUMERIC(5,2),
            risk_tier                   TEXT,
            opportunity_tier            TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_em_climate_entity ON em_climate_risk_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_em_climate_country ON em_climate_risk_assessments(country_code);;

CREATE TABLE IF NOT EXISTS em_portfolio_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            total_countries             INTEGER,
            total_exposure_m            NUMERIC(15,2),
            avg_physical_risk           NUMERIC(5,2),
            avg_transition_risk         NUMERIC(5,2),
            avg_ndc_ambition            NUMERIC(5,2),
            high_risk_exposure_pct      NUMERIC(5,2),
            climate_var_em_m            NUMERIC(15,2),
            green_finance_opportunity_m NUMERIC(15,2),
            country_breakdown           JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_em_portfolio_entity ON em_portfolio_assessments(entity_id);;

UPDATE alembic_version SET version_num='079' WHERE alembic_version.version_num = '078';

-- Running upgrade 079 -> 080

CREATE TABLE IF NOT EXISTS biodiversity_credit_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            assessment_date             DATE,
            -- Credit type & standard
            credit_type                 TEXT,
            standard                    TEXT,
            methodology_code            TEXT,
            -- BNG DEFRA Metric 4.0
            habitat_units_baseline      NUMERIC(12,4),
            habitat_units_post          NUMERIC(12,4),
            biodiversity_net_gain_pct   NUMERIC(5,2),
            bng_10pct_met               BOOLEAN DEFAULT FALSE,
            distinctiveness_score       NUMERIC(5,2),
            -- Verra VM0033 / TNFD
            msa_km2_baseline            NUMERIC(15,4),
            msa_km2_post                NUMERIC(15,4),
            msa_uplift_pct              NUMERIC(5,2),
            tnfd_pillar_scores          JSONB,
            tnfd_composite              NUMERIC(5,2),
            -- Ecosystem services valuation
            provisioning_services_m     NUMERIC(12,2),
            regulating_services_m       NUMERIC(12,2),
            cultural_services_m         NUMERIC(12,2),
            supporting_services_m       NUMERIC(12,2),
            total_ecosystem_value_m     NUMERIC(12,2),
            -- GBF Kunming-Montreal Target 15
            gbf_t15_disclosure_score    NUMERIC(5,2),
            gbf_t15_dependencies        JSONB,
            gbf_t15_impacts             JSONB,
            gbf_t15_gaps                JSONB,
            -- Credit pricing & market
            credit_price_usd            NUMERIC(8,2),
            credits_generated           NUMERIC(12,2),
            market_value_usd_m          NUMERIC(12,2),
            additionality_score         NUMERIC(5,2),
            permanence_risk_score       NUMERIC(5,2),
            -- SBTN alignment
            sbtn_step1_score            NUMERIC(5,2),
            sbtn_step3_msa_footprint    NUMERIC(15,4),
            sbtn_aligned                BOOLEAN DEFAULT FALSE,
            -- Plan Vivo
            plan_vivo_eligible          BOOLEAN DEFAULT FALSE,
            community_benefit_pct       NUMERIC(5,2),
            -- overall
            biodiversity_credit_score   NUMERIC(5,2),
            credit_quality_tier         TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_bio_credit_entity ON biodiversity_credit_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_bio_credit_standard ON biodiversity_credit_assessments(standard);;

CREATE TABLE IF NOT EXISTS nature_market_transactions (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            transaction_date            DATE,
            transaction_type            TEXT,
            credit_standard             TEXT,
            habitat_type                TEXT,
            units_transacted            NUMERIC(12,4),
            price_per_unit_usd          NUMERIC(8,2),
            total_value_usd             NUMERIC(15,2),
            registry_id                 TEXT,
            project_country             TEXT,
            vintate_year                INTEGER,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_nature_mkt_entity ON nature_market_transactions(entity_id);;

CREATE TABLE IF NOT EXISTS just_transition_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            country_code                TEXT,
            region                      TEXT,
            assessment_date             DATE,
            -- Sector & workforce impact
            primary_sector              TEXT,
            affected_workers            INTEGER,
            fossil_fuel_jobs_at_risk    INTEGER,
            green_jobs_created          INTEGER,
            net_jobs_impact             INTEGER,
            avg_wage_fossil_eur         NUMERIC(8,2),
            avg_wage_green_eur          NUMERIC(8,2),
            wage_transition_gap_pct     NUMERIC(5,2),
            -- ILO Just Transition scoring
            ilo_social_dialogue_score   NUMERIC(5,2),
            ilo_skills_reskilling_score NUMERIC(5,2),
            ilo_social_protection_score NUMERIC(5,2),
            ilo_active_labour_score     NUMERIC(5,2),
            ilo_community_invest_score  NUMERIC(5,2),
            ilo_composite_score         NUMERIC(5,2),
            ilo_jt_tier                 TEXT,
            -- EU Just Transition Fund eligibility
            eu_jtf_eligible             BOOLEAN DEFAULT FALSE,
            eu_jtf_allocation_m         NUMERIC(12,2),
            territorial_just_plan_score NUMERIC(5,2),
            -- PPCA & coal community risk
            ppca_aligned                BOOLEAN DEFAULT FALSE,
            coal_dependency_pct         NUMERIC(5,2),
            coal_community_risk_score   NUMERIC(5,2),
            phase_out_year              INTEGER,
            -- Climate Investment Funds
            cif_eligible                BOOLEAN DEFAULT FALSE,
            cif_facility               TEXT,
            concessional_finance_m      NUMERIC(12,2),
            -- Community resilience
            community_gdp_dependency_pct NUMERIC(5,2),
            stranded_infrastructure_m   NUMERIC(12,2),
            reskilling_cost_m           NUMERIC(12,2),
            transition_timeline_years   INTEGER,
            -- overall
            just_transition_score       NUMERIC(5,2),
            transition_risk_tier        TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_jt_entity ON just_transition_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_jt_country ON just_transition_assessments(country_code);
        CREATE INDEX IF NOT EXISTS idx_jt_tier ON just_transition_assessments(transition_risk_tier);;

CREATE TABLE IF NOT EXISTS community_impact_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT,
            community_name              TEXT,
            community_type              TEXT,
            population                  INTEGER,
            fossil_employment_pct       NUMERIC(5,2),
            alternative_employers       INTEGER,
            skills_transferability_score NUMERIC(5,2),
            infrastructure_quality_score NUMERIC(5,2),
            social_cohesion_score       NUMERIC(5,2),
            transition_vulnerability    TEXT,
            recommended_interventions   JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_community_impact_assessment ON community_impact_assessments(assessment_id);;

CREATE TABLE IF NOT EXISTS cdr_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            cdr_type                    TEXT,
            assessment_date             DATE,
            -- CDR volumes
            removal_capacity_tco2_yr    NUMERIC(15,2),
            actual_removal_tco2_yr      NUMERIC(15,2),
            utilisation_rate_pct        NUMERIC(5,2),
            cumulative_removal_tco2     NUMERIC(15,2),
            -- Oxford CDR Principles scoring
            oxford_additionality_score  NUMERIC(5,2),
            oxford_permanence_score     NUMERIC(5,2),
            oxford_monitoring_score     NUMERIC(5,2),
            oxford_leakage_score        NUMERIC(5,2),
            oxford_composite_score      NUMERIC(5,2),
            oxford_tier                 TEXT,
            -- Permanence risk
            permanence_years            INTEGER,
            reversal_risk_score         NUMERIC(5,2),
            buffer_pool_pct             NUMERIC(5,2),
            -- Article 6.4 (Paris Agreement)
            article_64_eligible         BOOLEAN DEFAULT FALSE,
            itmo_eligible               BOOLEAN DEFAULT FALSE,
            corresponding_adjustment    BOOLEAN DEFAULT FALSE,
            host_country_ndc_contrib    BOOLEAN DEFAULT FALSE,
            -- Technology readiness
            trl_level                   INTEGER,
            lcoe_usd_tco2              NUMERIC(8,2),
            cost_trajectory_2030        NUMERIC(8,2),
            cost_trajectory_2050        NUMERIC(8,2),
            -- Co-benefits
            biodiversity_cobenefit      NUMERIC(5,2),
            water_cobenefit             NUMERIC(5,2),
            social_cobenefit            NUMERIC(5,2),
            sdg_alignment               JSONB,
            -- Financing
            capex_m                     NUMERIC(12,2),
            opex_m_yr                   NUMERIC(12,2),
            blended_finance_eligible    BOOLEAN DEFAULT FALSE,
            frontier_eligible           BOOLEAN DEFAULT FALSE,
            credit_price_usd_tco2       NUMERIC(8,2),
            -- IPCC AR6 alignment
            ipcc_cdr_category           TEXT,
            ipcc_scalability_rating     TEXT,
            -- overall
            cdr_quality_score           NUMERIC(5,2),
            cdr_quality_tier            TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_cdr_entity ON cdr_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_cdr_type ON cdr_assessments(cdr_type);;

CREATE TABLE IF NOT EXISTS cdr_project_registry (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_type                TEXT,
            registry                    TEXT,
            country_code                TEXT,
            capacity_tco2_yr            NUMERIC(15,2),
            status                      TEXT DEFAULT 'pipeline',
            first_delivery_year         INTEGER,
            offtake_price_usd           NUMERIC(8,2),
            offtake_volume_tco2_yr      NUMERIC(12,2),
            buyer_type                  TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_cdr_registry_entity ON cdr_project_registry(entity_id);;

CREATE TABLE IF NOT EXISTS climate_litigation_risk_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- Litigation exposure profile
            sector                      TEXT,
            jurisdiction                TEXT,
            entity_type                 TEXT,
            -- UNEP/Sabin case taxonomy
            greenwashing_risk_score     NUMERIC(5,2),
            disclosure_liability_score  NUMERIC(5,2),
            transition_planning_risk    NUMERIC(5,2),
            physical_risk_liability     NUMERIC(5,2),
            carbon_major_exposure       NUMERIC(5,2),
            human_rights_climate_risk   NUMERIC(5,2),
            -- Fiduciary duty (Duties X Framework)
            fiduciary_duty_score        NUMERIC(5,2),
            fiduciary_gaps              JSONB,
            stewardship_adequacy_score  NUMERIC(5,2),
            -- D&O liability
            do_exposure_m               NUMERIC(12,2),
            do_trigger_scenarios        JSONB,
            securities_litigation_risk  NUMERIC(5,2),
            -- Attribution science risk
            attribution_science_applicable BOOLEAN DEFAULT FALSE,
            mhc_attribution_score       NUMERIC(5,2),
            physical_damage_attributable_pct NUMERIC(5,2),
            -- Regulatory enforcement risk
            sec_risk_score              NUMERIC(5,2),
            fca_risk_score              NUMERIC(5,2),
            esma_risk_score             NUMERIC(5,2),
            csrd_penalty_exposure_m     NUMERIC(12,2),
            -- Active cases / precedents
            active_cases_count          INTEGER DEFAULT 0,
            precedent_cases             JSONB,
            jurisdiction_risk_score     NUMERIC(5,2),
            -- Financial quantification
            max_litigation_exposure_m   NUMERIC(15,2),
            expected_litigation_cost_m  NUMERIC(15,2),
            litigation_provision_m      NUMERIC(12,2),
            insurance_coverage_m        NUMERIC(12,2),
            -- overall
            litigation_risk_score       NUMERIC(5,2),
            risk_tier                   TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_litigation_entity ON climate_litigation_risk_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_litigation_sector ON climate_litigation_risk_assessments(sector);
        CREATE INDEX IF NOT EXISTS idx_litigation_tier ON climate_litigation_risk_assessments(risk_tier);;

CREATE TABLE IF NOT EXISTS litigation_case_registry (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            case_name                   TEXT,
            case_type                   TEXT,
            jurisdiction                TEXT,
            court_level                 TEXT,
            filing_year                 INTEGER,
            status                      TEXT DEFAULT 'active',
            plaintiff_type              TEXT,
            claim_amount_m              NUMERIC(12,2),
            outcome                     TEXT,
            settlement_amount_m         NUMERIC(12,2),
            precedent_value             TEXT,
            sabin_case_id               TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_lit_case_entity ON litigation_case_registry(entity_id);;

UPDATE alembic_version SET version_num='080' WHERE alembic_version.version_num = '079';

-- Running upgrade 080 -> 081

CREATE TABLE IF NOT EXISTS water_risk_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- WRI AQUEDUCT 4.0 scores
            baseline_water_stress       NUMERIC(5,2),
            interannual_variability     NUMERIC(5,2),
            seasonal_variability        NUMERIC(5,2),
            groundwater_depletion       NUMERIC(5,2),
            riverine_flood_risk         NUMERIC(5,2),
            coastal_eutrophication      NUMERIC(5,2),
            aqueduct_overall_score      NUMERIC(5,2),
            aqueduct_risk_tier          TEXT,
            -- CDP Water Security scoring
            cdp_water_score             TEXT,
            cdp_governance_score        NUMERIC(5,2),
            cdp_risk_assessment_score   NUMERIC(5,2),
            cdp_targets_score           NUMERIC(5,2),
            cdp_performance_score       NUMERIC(5,2),
            cdp_a_list_eligible         BOOLEAN DEFAULT FALSE,
            -- TNFD E3 water metrics
            water_withdrawal_m3         NUMERIC(15,2),
            water_consumption_m3        NUMERIC(15,2),
            water_discharge_m3          NUMERIC(15,2),
            water_recycled_pct          NUMERIC(5,2),
            water_stressed_area_pct     NUMERIC(5,2),
            tnfd_water_disclosure_score NUMERIC(5,2),
            -- AWS Standard v2.0
            aws_balance_score           NUMERIC(5,2),
            aws_engagement_score        NUMERIC(5,2),
            aws_governance_score        NUMERIC(5,2),
            aws_overall_score           NUMERIC(5,2),
            aws_certification_eligible  BOOLEAN DEFAULT FALSE,
            -- CEO Water Mandate commitment
            cwm_committed               BOOLEAN DEFAULT FALSE,
            cwm_targets_set             INTEGER DEFAULT 0,
            cwm_stewardship_score       NUMERIC(5,2),
            -- Financial exposure
            water_opex_risk_m           NUMERIC(12,2),
            water_regulatory_risk_m     NUMERIC(12,2),
            water_stranded_asset_risk_m NUMERIC(12,2),
            total_water_financial_risk_m NUMERIC(15,2),
            -- Stewardship bond eligibility
            water_bond_eligible         BOOLEAN DEFAULT FALSE,
            water_bond_framework_score  NUMERIC(5,2),
            -- overall
            water_risk_score            NUMERIC(5,2),
            water_risk_tier             TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_water_risk_entity ON water_risk_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_water_risk_tier ON water_risk_assessments(water_risk_tier);;

CREATE TABLE IF NOT EXISTS water_stewardship_targets (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            target_type                 TEXT,
            baseline_year               INTEGER,
            target_year                 INTEGER,
            baseline_m3                 NUMERIC(15,2),
            target_m3                   NUMERIC(15,2),
            reduction_pct               NUMERIC(5,2),
            verification_standard       TEXT,
            catchment_specific          BOOLEAN DEFAULT FALSE,
            progress_pct                NUMERIC(5,2),
            on_track                    BOOLEAN DEFAULT TRUE,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_water_target_entity ON water_stewardship_targets(entity_id);;

CREATE TABLE IF NOT EXISTS critical_minerals_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            assessment_date             DATE,
            -- Supply chain exposure
            minerals_assessed           JSONB,
            primary_mineral             TEXT,
            total_spend_m               NUMERIC(12,2),
            supply_chain_tiers_covered  INTEGER,
            -- IEA criticality scores
            iea_demand_growth_score     NUMERIC(5,2),
            iea_supply_concentration    NUMERIC(5,2),
            iea_geopolitical_risk       NUMERIC(5,2),
            iea_substitutability        NUMERIC(5,2),
            iea_criticality_composite   NUMERIC(5,2),
            -- EU CRM Act compliance
            eu_crm_act_applicable       BOOLEAN DEFAULT FALSE,
            eu_crm_strategic_mineral    BOOLEAN DEFAULT FALSE,
            eu_crm_critical_mineral     BOOLEAN DEFAULT FALSE,
            eu_crm_audit_required       BOOLEAN DEFAULT FALSE,
            eu_crm_compliance_score     NUMERIC(5,2),
            eu_crm_gaps                 JSONB,
            -- IRMA responsible mining
            irma_applicable             BOOLEAN DEFAULT FALSE,
            irma_score                  NUMERIC(5,2),
            irma_tier                   TEXT,
            irma_gaps                   JSONB,
            -- OECD Due Diligence
            oecd_ddg_score              NUMERIC(5,2),
            oecd_5step_compliance       JSONB,
            conflict_mineral_risk       BOOLEAN DEFAULT FALSE,
            conflict_region_exposure    JSONB,
            -- Transition exposure
            ev_battery_exposure_m       NUMERIC(12,2),
            solar_pv_exposure_m         NUMERIC(12,2),
            wind_turbine_exposure_m     NUMERIC(12,2),
            grid_storage_exposure_m     NUMERIC(12,2),
            total_transition_exposure_m NUMERIC(15,2),
            -- Price & supply risk
            price_volatility_score      NUMERIC(5,2),
            supply_disruption_prob_pct  NUMERIC(5,2),
            concentration_hhi           NUMERIC(8,2),
            top3_country_share_pct      NUMERIC(5,2),
            -- overall
            crm_risk_score              NUMERIC(5,2),
            crm_risk_tier               TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_crm_entity ON critical_minerals_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_crm_mineral ON critical_minerals_assessments(primary_mineral);;

CREATE TABLE IF NOT EXISTS mineral_supply_chain_map (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT,
            mineral_name                TEXT,
            tier_level                  INTEGER,
            supplier_country            TEXT,
            supplier_name               TEXT,
            annual_volume_t             NUMERIC(12,2),
            spend_m                     NUMERIC(10,2),
            conflict_risk               BOOLEAN DEFAULT FALSE,
            irma_certified              BOOLEAN DEFAULT FALSE,
            certification_body          TEXT,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_mineral_scm_assessment ON mineral_supply_chain_map(assessment_id);;

CREATE TABLE IF NOT EXISTS nbs_finance_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            project_name                TEXT,
            nbs_category                TEXT,
            country_code                TEXT,
            biome_type                  TEXT,
            assessment_date             DATE,
            -- IUCN NbS Global Standard v2.0
            iucn_criterion_1_score      NUMERIC(5,2),
            iucn_criterion_2_score      NUMERIC(5,2),
            iucn_criterion_3_score      NUMERIC(5,2),
            iucn_criterion_4_score      NUMERIC(5,2),
            iucn_criterion_5_score      NUMERIC(5,2),
            iucn_criterion_6_score      NUMERIC(5,2),
            iucn_criterion_7_score      NUMERIC(5,2),
            iucn_criterion_8_score      NUMERIC(5,2),
            iucn_composite_score        NUMERIC(5,2),
            iucn_nbs_tier               TEXT,
            -- Carbon co-benefits
            carbon_sequestration_tco2_yr NUMERIC(12,2),
            carbon_sequestration_total  NUMERIC(15,2),
            carbon_credit_eligible      BOOLEAN DEFAULT FALSE,
            carbon_credit_standard      TEXT,
            vcm_credit_price_usd        NUMERIC(8,2),
            -- Biodiversity co-benefits
            species_protected_count     INTEGER,
            habitat_area_ha             NUMERIC(12,2),
            msa_uplift_pct              NUMERIC(5,2),
            gbf_target_2_contribution   NUMERIC(5,2),
            -- Water co-benefits
            watershed_protection_m3_yr  NUMERIC(12,2),
            water_quality_improvement   NUMERIC(5,2),
            -- Social co-benefits
            communities_benefited       INTEGER,
            indigenous_peoples_involved BOOLEAN DEFAULT FALSE,
            livelihoods_supported       INTEGER,
            -- VCMI Core Carbon Claims
            vcmi_claim_eligible         TEXT,
            vcmi_integrity_score        NUMERIC(5,2),
            -- Economics
            total_investment_m          NUMERIC(12,2),
            annual_maintenance_m        NUMERIC(10,2),
            carbon_revenue_m_yr         NUMERIC(10,2),
            ecosystem_service_revenue_m NUMERIC(10,2),
            npv_m                       NUMERIC(12,2),
            irr_pct                     NUMERIC(5,2),
            payback_years               NUMERIC(5,2),
            -- Blended finance
            public_finance_m            NUMERIC(10,2),
            private_finance_m           NUMERIC(10,2),
            philanthropic_m             NUMERIC(10,2),
            gcf_eligible                BOOLEAN DEFAULT FALSE,
            -- overall
            nbs_quality_score           NUMERIC(5,2),
            nbs_bankability_tier        TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_nbs_entity ON nbs_finance_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_nbs_category ON nbs_finance_assessments(nbs_category);
        CREATE INDEX IF NOT EXISTS idx_nbs_tier ON nbs_finance_assessments(nbs_bankability_tier);;

CREATE TABLE IF NOT EXISTS sfdr_art9_assessments (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            entity_id                   TEXT NOT NULL,
            fund_name                   TEXT,
            assessment_date             DATE,
            -- Fund classification
            current_article_classification TEXT,
            target_article              TEXT,
            aum_m                       NUMERIC(15,2),
            currency                    TEXT DEFAULT 'EUR',
            -- Art 9 eligibility criteria
            sustainable_investment_pct  NUMERIC(5,2),
            taxonomy_aligned_pct        NUMERIC(5,2),
            social_sustainable_pct      NUMERIC(5,2),
            governance_screen_pass      BOOLEAN DEFAULT FALSE,
            -- RTS Annex I/II pre-contractual
            investment_objective_score  NUMERIC(5,2),
            impact_strategy_score       NUMERIC(5,2),
            additionality_claim         TEXT,
            impact_measurement_score    NUMERIC(5,2),
            engagement_policy_score     NUMERIC(5,2),
            rts_annex_completeness_pct  NUMERIC(5,2),
            -- PAI indicators (14 mandatory)
            pai_ghg_scope1_2            NUMERIC(12,4),
            pai_carbon_footprint        NUMERIC(8,4),
            pai_ghg_intensity           NUMERIC(8,4),
            pai_fossil_fuel_exposure    NUMERIC(5,2),
            pai_renewable_energy_pct    NUMERIC(5,2),
            pai_energy_consumption      NUMERIC(10,2),
            pai_biodiversity_violation  BOOLEAN DEFAULT FALSE,
            pai_water_emission          NUMERIC(10,2),
            pai_hazardous_waste         NUMERIC(10,2),
            pai_ungc_oecd_violation     BOOLEAN DEFAULT FALSE,
            pai_ungc_compliance_pct     NUMERIC(5,2),
            pai_gender_pay_gap          NUMERIC(5,2),
            pai_board_gender_diversity  NUMERIC(5,2),
            pai_controversial_weapons   BOOLEAN DEFAULT FALSE,
            -- Impact KPIs
            impact_kpis_defined         INTEGER DEFAULT 0,
            impact_kpis_measured        INTEGER DEFAULT 0,
            impact_kpis                 JSONB,
            -- SFDR downgrades (post-ESMA Q&A 2023)
            downgrade_risk_score        NUMERIC(5,2),
            downgrade_triggers          JSONB,
            esma_qa_compliance          BOOLEAN DEFAULT FALSE,
            -- DNSH verification
            dnsh_climate_mitigation     BOOLEAN DEFAULT FALSE,
            dnsh_climate_adaptation     BOOLEAN DEFAULT FALSE,
            dnsh_water                  BOOLEAN DEFAULT FALSE,
            dnsh_circular               BOOLEAN DEFAULT FALSE,
            dnsh_pollution              BOOLEAN DEFAULT FALSE,
            dnsh_biodiversity           BOOLEAN DEFAULT FALSE,
            dnsh_all_pass               BOOLEAN DEFAULT FALSE,
            -- Overall
            art9_eligibility_score      NUMERIC(5,2),
            art9_eligible               BOOLEAN DEFAULT FALSE,
            compliance_tier             TEXT,
            -- metadata
            raw_input                   JSONB,
            full_result                 JSONB,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_art9_entity ON sfdr_art9_assessments(entity_id);
        CREATE INDEX IF NOT EXISTS idx_art9_fund ON sfdr_art9_assessments(fund_name);
        CREATE INDEX IF NOT EXISTS idx_art9_eligible ON sfdr_art9_assessments(art9_eligible);;

CREATE TABLE IF NOT EXISTS sfdr_art9_portfolio_holdings (
            id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            assessment_id               TEXT,
            holding_name                TEXT,
            isin                        TEXT,
            weight_pct                  NUMERIC(6,3),
            sustainable_investment      BOOLEAN DEFAULT FALSE,
            taxonomy_aligned_pct        NUMERIC(5,2),
            pai_data_quality            INTEGER,
            engagement_active           BOOLEAN DEFAULT FALSE,
            exclusion_criteria_met      BOOLEAN DEFAULT TRUE,
            dnsh_pass                   BOOLEAN DEFAULT FALSE,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_art9_holdings_assessment ON sfdr_art9_portfolio_holdings(assessment_id);;

UPDATE alembic_version SET version_num='081' WHERE alembic_version.version_num = '080';

-- Running upgrade 081 -> 082

CREATE TABLE vcm_integrity_assessments (
    id SERIAL NOT NULL, 
    assessment_ref VARCHAR(64) NOT NULL, 
    project_id VARCHAR(64), 
    registry VARCHAR(32), 
    methodology VARCHAR(64), 
    project_type VARCHAR(64), 
    vintage_year INTEGER, 
    volume_tco2e NUMERIC(18, 4), 
    price_usd_t NUMERIC(10, 4), 
    ccp_scores JSONB, 
    ccp_composite NUMERIC(5, 4), 
    ccp_label_eligible BOOLEAN, 
    ccp_blocking_issues JSONB, 
    vcmi_claim_tier VARCHAR(32), 
    vcmi_score NUMERIC(5, 4), 
    vcmi_sbti_aligned BOOLEAN, 
    vcmi_residual_emissions_pct NUMERIC(5, 4), 
    oxford_score NUMERIC(5, 4), 
    oxford_principle_scores JSONB, 
    oxford_shift_to_removal BOOLEAN, 
    oxford_storage_type VARCHAR(32), 
    permanence_risk VARCHAR(16), 
    additionality_score NUMERIC(5, 4), 
    leakage_risk_pct NUMERIC(5, 4), 
    mrvv_quality VARCHAR(16), 
    corsia_eligible BOOLEAN, 
    article6_eligible BOOLEAN, 
    integrity_tier VARCHAR(8), 
    recommendations JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (assessment_ref)
);

CREATE TABLE carbon_credit_registry (
    id SERIAL NOT NULL, 
    registry_name VARCHAR(32) NOT NULL, 
    serial_number VARCHAR(128), 
    project_id VARCHAR(64), 
    vintage_start DATE, 
    vintage_end DATE, 
    quantity_issued NUMERIC(18, 4), 
    quantity_retired NUMERIC(18, 4), 
    retirement_reason VARCHAR(64), 
    retirement_beneficiary VARCHAR(128), 
    country_of_origin VARCHAR(3), 
    ccp_label BOOLEAN, 
    corsia_eligible BOOLEAN, 
    metadata JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE social_taxonomy_assessments (
    id SERIAL NOT NULL, 
    assessment_ref VARCHAR(64) NOT NULL, 
    entity_name VARCHAR(256), 
    entity_lei VARCHAR(20), 
    nace_code VARCHAR(8), 
    sector VARCHAR(64), 
    obj1_decent_work_score NUMERIC(5, 4), 
    obj2_access_services_score NUMERIC(5, 4), 
    obj3_inclusive_communities NUMERIC(5, 4), 
    social_taxonomy_composite NUMERIC(5, 4), 
    social_taxonomy_eligible BOOLEAN, 
    social_taxonomy_aligned BOOLEAN, 
    social_dnsh_pass BOOLEAN, 
    ilo_convention_scores JSONB, 
    ilo_composite NUMERIC(5, 4), 
    ilo_violations JSONB, 
    csddd_social_impacts JSONB, 
    csddd_social_score NUMERIC(5, 4), 
    csddd_hrdd_compliance VARCHAR(16), 
    ungp_hrdd_scores JSONB, 
    ungp_composite NUMERIC(5, 4), 
    living_wage_compliance BOOLEAN, 
    gender_pay_gap_pct NUMERIC(5, 2), 
    union_coverage_pct NUMERIC(5, 2), 
    injury_rate_per_200k NUMERIC(8, 4), 
    child_labour_flag BOOLEAN, 
    forced_labour_flag BOOLEAN, 
    gap_analysis JSONB, 
    action_plan JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (assessment_ref)
);

CREATE TABLE supply_chain_hrdd_assessments (
    id SERIAL NOT NULL, 
    assessment_ref VARCHAR(64) NOT NULL, 
    company_name VARCHAR(256), 
    supply_chain_tier INTEGER, 
    supplier_country VARCHAR(3), 
    sector VARCHAR(64), 
    ungp_risk_tier VARCHAR(16), 
    oecd_ddg_step_scores JSONB, 
    ilo_core_breaches JSONB, 
    remediation_actions JSONB, 
    verification_status VARCHAR(16), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (assessment_ref)
);

CREATE TABLE green_hydrogen_assessments (
    id SERIAL NOT NULL, 
    assessment_ref VARCHAR(64) NOT NULL, 
    facility_name VARCHAR(256), 
    country VARCHAR(3), 
    production_capacity_mw NUMERIC(12, 2), 
    electrolyser_type VARCHAR(32), 
    electricity_source VARCHAR(32), 
    rfnbo_eligible BOOLEAN, 
    ghg_intensity_kgco2_per_kgh2 NUMERIC(8, 4), 
    ghg_threshold_met BOOLEAN, 
    additionality_met BOOLEAN, 
    temporal_correlation_met BOOLEAN, 
    geographical_correlation_met BOOLEAN, 
    rfnbo_composite_score NUMERIC(5, 4), 
    repowereu_target_alignment VARCHAR(32), 
    domestic_production_share NUMERIC(5, 4), 
    import_share NUMERIC(5, 4), 
    lcoh_usd_per_kgh2 NUMERIC(8, 4), 
    electrolyser_capex_usd_kw NUMERIC(10, 2), 
    capacity_factor NUMERIC(5, 4), 
    stack_lifetime_hrs INTEGER, 
    efficiency_kwh_per_kgh2 NUMERIC(6, 2), 
    h2cfd_eligible BOOLEAN, 
    h2cfd_strike_price_usd_kg NUMERIC(8, 4), 
    h2cfd_reference_price_usd_kg NUMERIC(8, 4), 
    h2cfd_support_duration_yrs INTEGER, 
    certification_scheme VARCHAR(32), 
    certification_status VARCHAR(16), 
    recommendations JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (assessment_ref)
);

CREATE TABLE rfnbo_compliance_checks (
    id SERIAL NOT NULL, 
    assessment_ref VARCHAR(64) NOT NULL, 
    check_date DATE, 
    electricity_source_verified BOOLEAN, 
    hourly_matching_evidence VARCHAR(256), 
    ghg_audit_report_ref VARCHAR(128), 
    certification_body VARCHAR(64), 
    compliance_status VARCHAR(16), 
    next_audit_date DATE, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE transition_finance_assessments (
    id SERIAL NOT NULL, 
    assessment_ref VARCHAR(64) NOT NULL, 
    entity_name VARCHAR(256), 
    entity_lei VARCHAR(20), 
    sector VARCHAR(64), 
    nace_code VARCHAR(8), 
    assessment_date DATE, 
    tpt_foundations_score NUMERIC(5, 4), 
    tpt_implementation_score NUMERIC(5, 4), 
    tpt_engagement_score NUMERIC(5, 4), 
    tpt_metrics_score NUMERIC(5, 4), 
    tpt_governance_score NUMERIC(5, 4), 
    tpt_finance_score NUMERIC(5, 4), 
    tpt_composite NUMERIC(5, 4), 
    tpt_quality_tier VARCHAR(16), 
    sbti_near_term_validated BOOLEAN, 
    sbti_long_term_validated BOOLEAN, 
    sbti_net_zero_target BOOLEAN, 
    sbti_flag_sector BOOLEAN, 
    sbti_1_5c_aligned BOOLEAN, 
    sbti_score NUMERIC(5, 4), 
    rtz_pledge BOOLEAN, 
    rtz_plan BOOLEAN, 
    rtz_proceed BOOLEAN, 
    rtz_publish BOOLEAN, 
    rtz_account BOOLEAN, 
    rtz_score NUMERIC(5, 4), 
    rtz_membership VARCHAR(64), 
    portfolio_temperature_c NUMERIC(4, 2), 
    waci_tco2e_per_m_revenue NUMERIC(10, 4), 
    engagement_coverage_pct NUMERIC(5, 4), 
    paris_aligned_assets_pct NUMERIC(5, 4), 
    tnfd_leap_integrated BOOLEAN, 
    nature_dependencies_identified BOOLEAN, 
    nature_targets_set BOOLEAN, 
    sbtn_steps_completed INTEGER, 
    transition_instrument VARCHAR(32), 
    kpi_ambition_score NUMERIC(5, 4), 
    spt_calibration VARCHAR(16), 
    credibility_score NUMERIC(5, 4), 
    credibility_tier VARCHAR(16), 
    red_flags JSONB, 
    recommendations JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (assessment_ref)
);

CREATE TABLE net_zero_commitment_tracker (
    id SERIAL NOT NULL, 
    entity_name VARCHAR(256), 
    entity_lei VARCHAR(20), 
    commitment_date DATE, 
    target_year INTEGER, 
    interim_target_2030 NUMERIC(5, 2), 
    interim_target_2035 NUMERIC(5, 2), 
    interim_target_2040 NUMERIC(5, 2), 
    base_year INTEGER, 
    base_year_emissions_tco2e NUMERIC(18, 4), 
    current_year_emissions_tco2e NUMERIC(18, 4), 
    scope_coverage VARCHAR(16), 
    initiative_memberships JSONB, 
    status VARCHAR(16), 
    last_verified DATE, 
    verification_body VARCHAR(64), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

UPDATE alembic_version SET version_num='082' WHERE alembic_version.version_num = '081';

-- Running upgrade 082 -> 083

CREATE TABLE stress_test_orchestrations (
    id VARCHAR(36) NOT NULL, 
    entity_id VARCHAR(36) NOT NULL, 
    entity_name VARCHAR(255) NOT NULL, 
    entity_type VARCHAR(50), 
    jurisdiction VARCHAR(10), 
    regulatory_framework VARCHAR(50), 
    ngfs_phase VARCHAR(10), 
    scenarios_run JSONB, 
    total_exposure_bn NUMERIC(18, 4), 
    baseline_cet1_pct NUMERIC(8, 4), 
    stressed_cet1_pct NUMERIC(8, 4), 
    cet1_depletion_pp NUMERIC(8, 4), 
    pass_threshold_pct NUMERIC(8, 4), 
    stress_test_pass BOOLEAN, 
    physical_risk_el_bn NUMERIC(18, 4), 
    transition_risk_el_bn NUMERIC(18, 4), 
    macro_gdp_shock_pct NUMERIC(8, 4), 
    macro_unemployment_shock_pp NUMERIC(8, 4), 
    sector_breakdown JSONB, 
    pd_migration_matrix JSONB, 
    lgd_uplift_by_sector JSONB, 
    regulatory_submission_ready BOOLEAN, 
    submission_template JSONB, 
    assessment_date DATE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE stress_test_scenario_results (
    id VARCHAR(36) NOT NULL, 
    orchestration_id VARCHAR(36) NOT NULL, 
    scenario_id VARCHAR(50), 
    scenario_name VARCHAR(200), 
    time_horizon_year INTEGER, 
    expected_loss_bn NUMERIC(18, 4), 
    pd_uplift_pct NUMERIC(8, 4), 
    lgd_uplift_pct NUMERIC(8, 4), 
    carbon_price_usd NUMERIC(10, 2), 
    gdp_deviation_pct NUMERIC(8, 4), 
    temp_rise_c NUMERIC(6, 3), 
    physical_risk_el_bn NUMERIC(18, 4), 
    transition_risk_el_bn NUMERIC(18, 4), 
    climate_var_pct NUMERIC(8, 4), 
    sector_results JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE sscf_assessments (
    id VARCHAR(36) NOT NULL, 
    buyer_entity_id VARCHAR(36), 
    buyer_name VARCHAR(255) NOT NULL, 
    programme_type VARCHAR(50), 
    programme_size_mn NUMERIC(18, 4), 
    currency VARCHAR(3), 
    supplier_count INTEGER, 
    tier_1_supplier_count INTEGER, 
    tier_2_plus_count INTEGER, 
    sscf_framework VARCHAR(50), 
    esg_kpi_count INTEGER, 
    kpi_categories JSONB, 
    spt_threshold_discount_bps NUMERIC(8, 2), 
    spt_penalty_bps NUMERIC(8, 2), 
    oecd_ddg_step INTEGER, 
    csddd_cascade_compliant BOOLEAN, 
    scope3_cat1_covered BOOLEAN, 
    supplier_esg_avg_score NUMERIC(8, 4), 
    high_risk_suppliers_pct NUMERIC(8, 4), 
    cahra_suppliers_pct NUMERIC(8, 4), 
    conflict_mineral_exposure BOOLEAN, 
    overall_sscf_score NUMERIC(8, 4), 
    sscf_eligible BOOLEAN, 
    assessment_date DATE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE supplier_esg_scorecards (
    id VARCHAR(36) NOT NULL, 
    sscf_id VARCHAR(36) NOT NULL, 
    supplier_name VARCHAR(255), 
    supplier_country VARCHAR(3), 
    tier INTEGER, 
    nace_code VARCHAR(10), 
    annual_spend_mn NUMERIC(18, 4), 
    ghg_intensity NUMERIC(12, 4), 
    water_intensity NUMERIC(12, 4), 
    labour_risk_score NUMERIC(8, 4), 
    safety_ltifr NUMERIC(10, 6), 
    diversity_score NUMERIC(8, 4), 
    csddd_adverse_impacts JSONB, 
    ilo_compliance JSONB, 
    conflict_mineral_flag BOOLEAN, 
    cahra_flag BOOLEAN, 
    overall_esg_score NUMERIC(8, 4), 
    risk_tier VARCHAR(20), 
    discount_rate_bps NUMERIC(8, 2), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE double_materiality_assessments (
    id VARCHAR(36) NOT NULL, 
    entity_id VARCHAR(36), 
    entity_name VARCHAR(255) NOT NULL, 
    nace_sector VARCHAR(10), 
    employee_count INTEGER, 
    csrd_wave INTEGER, 
    reporting_year INTEGER, 
    esrs_topics_assessed INTEGER, 
    material_topics_count INTEGER, 
    impact_material_count INTEGER, 
    financial_material_count INTEGER, 
    double_material_count INTEGER, 
    e1_climate_material BOOLEAN, 
    e2_pollution_material BOOLEAN, 
    e3_water_material BOOLEAN, 
    e4_biodiversity_material BOOLEAN, 
    e5_circular_material BOOLEAN, 
    s1_workforce_material BOOLEAN, 
    s2_workers_chain_material BOOLEAN, 
    s3_communities_material BOOLEAN, 
    s4_consumers_material BOOLEAN, 
    g1_conduct_material BOOLEAN, 
    stakeholder_engagement_complete BOOLEAN, 
    iro_identification_complete BOOLEAN, 
    materiality_matrix JSONB, 
    esrs_omissions JSONB, 
    completeness_score NUMERIC(8, 4), 
    assurance_ready BOOLEAN, 
    assessment_date DATE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE csrd_iro_registry (
    id VARCHAR(36) NOT NULL, 
    dma_id VARCHAR(36) NOT NULL, 
    iro_type VARCHAR(20), 
    esrs_topic VARCHAR(10), 
    iro_description TEXT, 
    time_horizon VARCHAR(20), 
    value_chain_position VARCHAR(30), 
    impact_likelihood NUMERIC(8, 4), 
    impact_severity NUMERIC(8, 4), 
    impact_scale NUMERIC(8, 4), 
    impact_scope NUMERIC(8, 4), 
    impact_irremediable BOOLEAN, 
    financial_likelihood NUMERIC(8, 4), 
    financial_magnitude NUMERIC(8, 4), 
    impact_material BOOLEAN, 
    financial_material BOOLEAN, 
    double_material BOOLEAN, 
    linked_policy TEXT, 
    linked_target TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE temperature_alignment_assessments (
    id VARCHAR(36) NOT NULL, 
    portfolio_id VARCHAR(36), 
    portfolio_name VARCHAR(255) NOT NULL, 
    fi_type VARCHAR(50), 
    total_aum_bn NUMERIC(18, 4), 
    methodology VARCHAR(50), 
    base_year INTEGER, 
    target_year INTEGER, 
    portfolio_itr_c NUMERIC(6, 3), 
    waci_tco2_mn_revenue NUMERIC(12, 4), 
    scope1_financed_mtco2 NUMERIC(18, 4), 
    scope2_financed_mtco2 NUMERIC(18, 4), 
    scope3_financed_mtco2 NUMERIC(18, 4), 
    total_financed_mtco2 NUMERIC(18, 4), 
    portfolio_coverage_pct NUMERIC(8, 4), 
    data_quality_score NUMERIC(8, 4), 
    paris_aligned BOOLEAN, 
    sbti_fi_target_set BOOLEAN, 
    sbti_near_term_yr INTEGER, 
    sbti_long_term_yr INTEGER, 
    reduction_required_pct NUMERIC(8, 4), 
    reduction_achieved_pct NUMERIC(8, 4), 
    on_track BOOLEAN, 
    engagement_priority_assets JSONB, 
    sector_temperature_breakdown JSONB, 
    pacta_results JSONB, 
    assessment_date DATE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE sector_alignment_targets (
    id VARCHAR(36) NOT NULL, 
    assessment_id VARCHAR(36) NOT NULL, 
    sector VARCHAR(50), 
    nace_codes JSONB, 
    sector_exposure_bn NUMERIC(18, 4), 
    sector_exposure_pct NUMERIC(8, 4), 
    sector_itr_c NUMERIC(6, 3), 
    sector_waci NUMERIC(12, 4), 
    sbti_pathway_pct_reduction_2030 NUMERIC(8, 4), 
    sbti_pathway_pct_reduction_2050 NUMERIC(8, 4), 
    actual_reduction_pct NUMERIC(8, 4), 
    alignment_gap_pp NUMERIC(8, 4), 
    aligned BOOLEAN, 
    engagement_priority VARCHAR(20), 
    pacta_aligned_pct NUMERIC(8, 4), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

UPDATE alembic_version SET version_num='083' WHERE alembic_version.version_num = '082';

-- Running upgrade 083 -> 084

CREATE TABLE physical_risk_pricing_assessments (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_name VARCHAR(255), 
    asset_class VARCHAR(50), 
    country_iso VARCHAR(3), 
    latitude NUMERIC(9, 6), 
    longitude NUMERIC(9, 6), 
    asset_value_usd NUMERIC(18, 2), 
    ngfs_scenario VARCHAR(50), 
    time_horizon VARCHAR(20), 
    flood_risk_score NUMERIC(5, 4), 
    cyclone_risk_score NUMERIC(5, 4), 
    wildfire_risk_score NUMERIC(5, 4), 
    earthquake_risk_score NUMERIC(5, 4), 
    heatwave_risk_score NUMERIC(5, 4), 
    sea_level_rise_score NUMERIC(5, 4), 
    drought_risk_score NUMERIC(5, 4), 
    precipitation_change_score NUMERIC(5, 4), 
    expected_annual_loss_usd NUMERIC(18, 2), 
    probable_max_loss_100yr_usd NUMERIC(18, 2), 
    stranding_probability NUMERIC(5, 4), 
    insurance_protection_gap_pct NUMERIC(5, 2), 
    climate_var_95_usd NUMERIC(18, 2), 
    physical_risk_premium_bps NUMERIC(8, 2), 
    composite_physical_risk_score NUMERIC(5, 4), 
    risk_tier VARCHAR(20), 
    damage_function_source VARCHAR(100), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE natcat_loss_estimates (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    peril VARCHAR(50), 
    return_period_years INTEGER, 
    loss_usd NUMERIC(18, 2), 
    loss_pct_of_value NUMERIC(5, 2), 
    insured_loss_usd NUMERIC(18, 2), 
    uninsured_loss_usd NUMERIC(18, 2), 
    damage_function_type VARCHAR(50), 
    climate_adjustment_factor NUMERIC(5, 3), 
    confidence_interval_low NUMERIC(18, 2), 
    confidence_interval_high NUMERIC(18, 2), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES physical_risk_pricing_assessments (id)
);

CREATE TABLE esg_data_quality_assessments (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_name VARCHAR(255), 
    reporting_year INTEGER, 
    framework VARCHAR(50), 
    bcbs239_accuracy_score NUMERIC(5, 2), 
    bcbs239_completeness_score NUMERIC(5, 2), 
    bcbs239_consistency_score NUMERIC(5, 2), 
    bcbs239_timeliness_score NUMERIC(5, 2), 
    bcbs239_governance_score NUMERIC(5, 2), 
    bcbs239_overall_score NUMERIC(5, 2), 
    cdp_coverage_pct NUMERIC(5, 2), 
    msci_coverage_pct NUMERIC(5, 2), 
    bloomberg_coverage_pct NUMERIC(5, 2), 
    refinitiv_coverage_pct NUMERIC(5, 2), 
    iss_coverage_pct NUMERIC(5, 2), 
    scope1_dqs INTEGER, 
    scope2_dqs INTEGER, 
    scope3_dqs INTEGER, 
    weighted_dqs NUMERIC(4, 2), 
    assurance_standard VARCHAR(50), 
    assurance_level VARCHAR(30), 
    assurance_provider VARCHAR(100), 
    assurance_scope TEXT, 
    material_misstatement_risk VARCHAR(20), 
    ai_imputed_fields INTEGER, 
    imputation_confidence NUMERIC(5, 2), 
    overall_data_quality_tier VARCHAR(20), 
    gaps_identified JSONB, 
    remediation_plan JSONB, 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE data_verification_logs (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    data_field VARCHAR(200), 
    reported_value TEXT, 
    verified_value TEXT, 
    variance_pct NUMERIC(8, 2), 
    verification_source VARCHAR(100), 
    bcbs239_principle VARCHAR(50), 
    dqs_tier INTEGER, 
    flag_type VARCHAR(30), 
    flag_description TEXT, 
    resolved BOOLEAN, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES esg_data_quality_assessments (id)
);

CREATE TABLE climate_derivatives_assessments (
    id SERIAL NOT NULL, 
    product_type VARCHAR(50), 
    underlying VARCHAR(100), 
    notional_usd NUMERIC(18, 2), 
    tenor_years NUMERIC(4, 1), 
    strike_value NUMERIC(12, 4), 
    current_spot NUMERIC(12, 4), 
    fair_value_usd NUMERIC(18, 2), 
    delta NUMERIC(8, 6), 
    gamma NUMERIC(8, 6), 
    vega NUMERIC(8, 6), 
    theta NUMERIC(8, 6), 
    implied_volatility NUMERIC(6, 4), 
    risk_premium_pct NUMERIC(6, 4), 
    attachment_point NUMERIC(18, 2), 
    exhaustion_point NUMERIC(18, 2), 
    expected_loss_pct NUMERIC(6, 4), 
    spread_bps NUMERIC(8, 2), 
    catastrophe_peril VARCHAR(50), 
    trigger_type VARCHAR(30), 
    isda_confirmation_type VARCHAR(50), 
    ccp_eligible BOOLEAN, 
    clearing_venue VARCHAR(50), 
    regulatory_classification VARCHAR(50), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE structured_product_registry (
    id SERIAL NOT NULL, 
    product_id VARCHAR(50), 
    product_name VARCHAR(255), 
    product_type VARCHAR(50), 
    issuer VARCHAR(255), 
    issuance_date DATE, 
    maturity_date DATE, 
    notional_usd NUMERIC(18, 2), 
    coupon_pct NUMERIC(5, 3), 
    climate_trigger_description TEXT, 
    underlying_climate_index VARCHAR(100), 
    rating VARCHAR(10), 
    esg_classification VARCHAR(50), 
    isin VARCHAR(20), 
    metadata JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (product_id)
);

CREATE TABLE sovereign_swf_assessments (
    id SERIAL NOT NULL, 
    fund_name VARCHAR(255), 
    fund_type VARCHAR(50), 
    country_iso VARCHAR(3), 
    aum_usd_bn NUMERIC(12, 2), 
    iwg_swf_score NUMERIC(5, 2), 
    esg_policy_score NUMERIC(5, 2), 
    exclusion_policy_score NUMERIC(5, 2), 
    engagement_policy_score NUMERIC(5, 2), 
    climate_integration_score NUMERIC(5, 2), 
    fossil_fuel_exclusions INTEGER, 
    conduct_exclusions INTEGER, 
    weapons_exclusions INTEGER, 
    exclusion_aum_impact_pct NUMERIC(5, 2), 
    portfolio_temperature_c NUMERIC(4, 2), 
    fossil_fuel_exposure_pct NUMERIC(5, 2), 
    green_investment_pct NUMERIC(5, 2), 
    paris_alignment_score NUMERIC(5, 2), 
    ngfs_scenario_used VARCHAR(50), 
    divestment_commitment BOOLEAN, 
    divestment_target_year INTEGER, 
    divestment_progress_pct NUMERIC(5, 2), 
    intergenerational_equity_score NUMERIC(5, 2), 
    sdg_alignment_score NUMERIC(5, 2), 
    overall_esg_tier VARCHAR(20), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE fossil_fuel_divestment_tracker (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    company_name VARCHAR(255), 
    isin VARCHAR(20), 
    sector VARCHAR(100), 
    sub_sector VARCHAR(100), 
    holding_value_usd NUMERIC(18, 2), 
    holding_pct_portfolio NUMERIC(6, 4), 
    exclusion_criterion VARCHAR(100), 
    exclusion_status VARCHAR(20), 
    carbon_intensity NUMERIC(10, 2), 
    stranded_asset_risk VARCHAR(20), 
    divestment_priority INTEGER, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES sovereign_swf_assessments (id)
);

UPDATE alembic_version SET version_num='084' WHERE alembic_version.version_num = '083';

-- Running upgrade 084 -> 085

CREATE TABLE regulatory_capital_assessments (
    id SERIAL NOT NULL, 
    institution_id VARCHAR(100), 
    institution_name VARCHAR(255), 
    institution_type VARCHAR(50), 
    reporting_date DATE, 
    total_assets_eur_bn NUMERIC(12, 2), 
    sa_cr_rwa_eur_bn NUMERIC(12, 2), 
    irb_rwa_eur_bn NUMERIC(12, 2), 
    output_floor_rwa_eur_bn NUMERIC(12, 2), 
    applicable_rwa_eur_bn NUMERIC(12, 2), 
    frtb_sa_rwa_eur_bn NUMERIC(12, 2), 
    frtb_ima_rwa_eur_bn NUMERIC(12, 2), 
    sa_ccr_ead_eur_bn NUMERIC(12, 2), 
    cva_rwa_eur_bn NUMERIC(12, 2), 
    op_risk_rwa_eur_bn NUMERIC(12, 2), 
    total_rwa_eur_bn NUMERIC(12, 2), 
    cet1_ratio_pct NUMERIC(5, 2), 
    tier1_ratio_pct NUMERIC(5, 2), 
    total_capital_ratio_pct NUMERIC(5, 2), 
    leverage_ratio_pct NUMERIC(5, 2), 
    nsfr_pct NUMERIC(5, 2), 
    lcr_pct NUMERIC(5, 2), 
    climate_rwa_addon_pct NUMERIC(5, 2), 
    climate_adjusted_cet1_pct NUMERIC(5, 2), 
    p2r_climate_addon_bps NUMERIC(6, 2), 
    optimization_opportunities JSONB, 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE capital_optimization_actions (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    action_type VARCHAR(50), 
    target_portfolio VARCHAR(100), 
    rwa_reduction_eur_bn NUMERIC(10, 2), 
    cet1_impact_bps NUMERIC(6, 2), 
    implementation_cost_eur_mn NUMERIC(10, 2), 
    regulatory_approval_required BOOLEAN, 
    timeline_months INTEGER, 
    priority_score INTEGER, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES regulatory_capital_assessments (id)
);

CREATE TABLE climate_policy_assessments (
    id SERIAL NOT NULL, 
    jurisdiction VARCHAR(100), 
    assessment_date DATE, 
    ndc_ambition_score NUMERIC(5, 2), 
    ndc_target_year INTEGER, 
    ndc_ghg_reduction_pct NUMERIC(5, 2), 
    ndc_base_year INTEGER, 
    carbon_price_current NUMERIC(8, 2), 
    carbon_price_2030_target NUMERIC(8, 2), 
    carbon_price_nze_corridor NUMERIC(8, 2), 
    carbon_pricing_gap NUMERIC(8, 2), 
    policy_stringency_score NUMERIC(5, 2), 
    transition_risk_score NUMERIC(5, 2), 
    policy_credibility_score NUMERIC(5, 2), 
    regulatory_pipeline_count INTEGER, 
    fit_for_55_alignment_pct NUMERIC(5, 2), 
    ira_coverage_pct NUMERIC(5, 2), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE policy_regulation_tracker (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    regulation_name VARCHAR(255), 
    jurisdiction VARCHAR(100), 
    policy_package VARCHAR(100), 
    status VARCHAR(30), 
    effective_date DATE, 
    sectors_affected TEXT[], 
    carbon_price_impact NUMERIC(8, 2), 
    compliance_deadline DATE, 
    portfolio_impact_score NUMERIC(5, 2), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES climate_policy_assessments (id)
);

CREATE TABLE export_credit_esg_assessments (
    id SERIAL NOT NULL, 
    transaction_id VARCHAR(100), 
    exporter_country VARCHAR(3), 
    importer_country VARCHAR(3), 
    sector VARCHAR(100), 
    transaction_value_usd NUMERIC(18, 2), 
    tenor_years INTEGER, 
    eca_name VARCHAR(100), 
    oecd_arrangement_compliance BOOLEAN, 
    sector_understanding_applicable BOOLEAN, 
    berne_union_esg_score NUMERIC(5, 2), 
    common_approaches_applicable BOOLEAN, 
    ifc_performance_standards_met BOOLEAN, 
    equator_principles_applicable BOOLEAN, 
    carbon_intensity_tco2_musd NUMERIC(10, 2), 
    fossil_fuel_classification VARCHAR(30), 
    green_classification BOOLEAN, 
    miga_coverage_eligible BOOLEAN, 
    esg_risk_tier VARCHAR(20), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE esg_controversy_assessments (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_name VARCHAR(255), 
    assessment_date DATE, 
    sustainalytics_controversy_level INTEGER, 
    reprisk_risk_rating VARCHAR(10), 
    reprisk_peak_rri INTEGER, 
    active_incidents_count INTEGER, 
    severe_incidents_count INTEGER, 
    environmental_incidents INTEGER, 
    social_incidents INTEGER, 
    governance_incidents INTEGER, 
    media_coverage_intensity VARCHAR(20), 
    ngo_campaign_active BOOLEAN, 
    regulatory_investigation_active BOOLEAN, 
    litigation_risk_score NUMERIC(5, 2), 
    revenue_at_risk_pct NUMERIC(5, 2), 
    reputational_risk_score NUMERIC(5, 2), 
    remediation_adequacy_score NUMERIC(5, 2), 
    controversy_trend VARCHAR(20), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE controversy_incident_registry (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    incident_id VARCHAR(50), 
    incident_date DATE, 
    incident_type VARCHAR(100), 
    esg_category VARCHAR(10), 
    severity VARCHAR(20), 
    source VARCHAR(100), 
    jurisdiction VARCHAR(100), 
    financial_penalty_usd NUMERIC(18, 2), 
    remediation_status VARCHAR(30), 
    ungc_violation BOOLEAN, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES esg_controversy_assessments (id)
);

UPDATE alembic_version SET version_num='085' WHERE alembic_version.version_num = '084';

-- Running upgrade 085 -> 086

CREATE TABLE crrem_assessments (
    id SERIAL NOT NULL, 
    asset_id VARCHAR(100), 
    asset_name VARCHAR(255), 
    building_type VARCHAR(50), 
    country_iso VARCHAR(3), 
    gross_floor_area_m2 NUMERIC(10, 2), 
    construction_year INTEGER, 
    current_epc_rating VARCHAR(5), 
    current_energy_intensity_kwh_m2 NUMERIC(8, 2), 
    current_carbon_intensity_kgco2_m2 NUMERIC(8, 2), 
    crrem_15c_pathway_kgco2_m2_2030 NUMERIC(8, 2), 
    crrem_20c_pathway_kgco2_m2_2030 NUMERIC(8, 2), 
    stranding_year_15c INTEGER, 
    stranding_year_20c INTEGER, 
    stranding_risk_tier VARCHAR(20), 
    energy_performance_gap_pct NUMERIC(5, 2), 
    retrofit_capex_eur_m2 NUMERIC(8, 2), 
    retrofit_npv_eur NUMERIC(18, 2), 
    green_premium_pct NUMERIC(5, 2), 
    brown_discount_pct NUMERIC(5, 2), 
    gresb_score NUMERIC(5, 2), 
    target_epc_rating VARCHAR(5), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE retrofit_action_plans (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    measure_type VARCHAR(100), 
    energy_saving_kwh_yr NUMERIC(12, 2), 
    carbon_saving_tco2_yr NUMERIC(8, 2), 
    capex_eur NUMERIC(12, 2), 
    payback_years NUMERIC(4, 1), 
    irr_pct NUMERIC(5, 2), 
    epc_improvement VARCHAR(10), 
    implementation_phase INTEGER, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES crrem_assessments (id)
);

CREATE TABLE loss_damage_finance_assessments (
    id SERIAL NOT NULL, 
    country_iso VARCHAR(3), 
    country_name VARCHAR(255), 
    vulnerability_group VARCHAR(30), 
    assessment_year INTEGER, 
    economic_loss_usd_bn NUMERIC(12, 2), 
    non_economic_loss_score NUMERIC(5, 2), 
    insured_loss_pct NUMERIC(5, 2), 
    protection_gap_usd_bn NUMERIC(12, 2), 
    warsaw_mechanism_eligibility BOOLEAN, 
    santiago_network_eligible BOOLEAN, 
    cop28_fund_eligible BOOLEAN, 
    gcf_raf_score NUMERIC(5, 2), 
    climate_attribution_pct NUMERIC(5, 2), 
    loss_trend_5yr VARCHAR(20), 
    rapid_response_finance_needed_usd_mn NUMERIC(10, 2), 
    parametric_trigger_design JSONB, 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE forced_labour_assessments (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_name VARCHAR(255), 
    sector VARCHAR(100), 
    supply_chain_origin_countries TEXT[], 
    uk_msa_compliant BOOLEAN, 
    uk_msa_statement_quality VARCHAR(20), 
    eu_fl_reg_compliant BOOLEAN, 
    uflpa_exposure BOOLEAN, 
    uflpa_xinjiang_exposure_pct NUMERIC(5, 2), 
    ilo_indicator_score NUMERIC(5, 2), 
    child_labour_risk_score NUMERIC(5, 2), 
    forced_labour_risk_score NUMERIC(5, 2), 
    debt_bondage_risk_score NUMERIC(5, 2), 
    recruitment_fee_risk_score NUMERIC(5, 2), 
    high_risk_supplier_count INTEGER, 
    audit_coverage_pct NUMERIC(5, 2), 
    grievance_mechanism_score NUMERIC(5, 2), 
    remediation_programme_score NUMERIC(5, 2), 
    overall_risk_tier VARCHAR(20), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE supply_chain_labour_map (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    tier INTEGER, 
    supplier_name VARCHAR(255), 
    country_iso VARCHAR(3), 
    commodity VARCHAR(100), 
    ilo_risk_flag BOOLEAN, 
    uflpa_flag BOOLEAN, 
    cahra_flag BOOLEAN, 
    audit_status VARCHAR(30), 
    audit_scheme VARCHAR(50), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES forced_labour_assessments (id)
);

CREATE TABLE sll_slb_v2_assessments (
    id SERIAL NOT NULL, 
    instrument_id VARCHAR(100), 
    instrument_type VARCHAR(20), 
    issuer_name VARCHAR(255), 
    sector VARCHAR(100), 
    notional_usd NUMERIC(18, 2), 
    tenor_years NUMERIC(4, 1), 
    framework VARCHAR(30), 
    kpi_count INTEGER, 
    kpi_materiality_score NUMERIC(5, 2), 
    spt_ambition_score NUMERIC(5, 2), 
    sda_aligned BOOLEAN, 
    baseline_year INTEGER, 
    spt_observation_date_1 DATE, 
    spt_observation_date_2 DATE, 
    margin_step_up_bps NUMERIC(5, 2), 
    margin_step_down_bps NUMERIC(5, 2), 
    coupon_adjustment_mechanism VARCHAR(30), 
    verifier_type VARCHAR(50), 
    greenwashing_risk_score NUMERIC(5, 2), 
    overall_quality_score NUMERIC(5, 2), 
    icma_alignment_pct NUMERIC(5, 2), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

UPDATE alembic_version SET version_num='086' WHERE alembic_version.version_num = '085';

-- Running upgrade 086 -> 087

CREATE TABLE nature_capital_accounting_assessments (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_name VARCHAR(255), 
    reporting_year INTEGER, 
    land_area_ha NUMERIC(12, 2), 
    ecosystem_extent_ha NUMERIC(12, 2), 
    ecosystem_condition_index NUMERIC(5, 3), 
    ecosystem_service_value_usd NUMERIC(18, 2), 
    ncp_scope VARCHAR(30), 
    ncp_business_value_usd NUMERIC(18, 2), 
    ncp_social_value_usd NUMERIC(18, 2), 
    tev_use_value_usd NUMERIC(18, 2), 
    tev_non_use_value_usd NUMERIC(18, 2), 
    tev_total_usd NUMERIC(18, 2), 
    tnfd_locate_score NUMERIC(5, 2), 
    tnfd_evaluate_score NUMERIC(5, 2), 
    tnfd_assess_score NUMERIC(5, 2), 
    tnfd_prepare_score NUMERIC(5, 2), 
    tnfd_overall_score NUMERIC(5, 2), 
    sbtn_readiness_step INTEGER, 
    sbtn_freshwater_target_set BOOLEAN, 
    sbtn_land_target_set BOOLEAN, 
    sbtn_ocean_target_set BOOLEAN, 
    nature_positive_composite NUMERIC(5, 2), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE ecosystem_service_valuations (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    ecosystem_service VARCHAR(100), 
    service_sub_type VARCHAR(100), 
    valuation_method VARCHAR(50), 
    physical_quantity NUMERIC(14, 2), 
    physical_unit VARCHAR(50), 
    monetary_value_usd NUMERIC(18, 2), 
    uncertainty_range_pct NUMERIC(5, 2), 
    data_quality_tier VARCHAR(20), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES nature_capital_accounting_assessments (id)
);

CREATE TABLE regulatory_horizon_assessments (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_type VARCHAR(50), 
    jurisdiction VARCHAR(100), 
    scan_date DATE, 
    horizon_years INTEGER, 
    total_regulations_tracked INTEGER, 
    high_impact_regulations INTEGER, 
    implementation_readiness_score NUMERIC(5, 2), 
    compliance_cost_estimate_usd_mn NUMERIC(10, 2), 
    regulatory_change_velocity VARCHAR(20), 
    top_priority_regulation VARCHAR(255), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE horizon_regulation_pipeline (
    id SERIAL NOT NULL, 
    assessment_id INTEGER, 
    regulation_name VARCHAR(255), 
    short_name VARCHAR(50), 
    regulator VARCHAR(100), 
    jurisdiction VARCHAR(100), 
    topic VARCHAR(50), 
    current_status VARCHAR(30), 
    expected_in_force_date DATE, 
    compliance_deadline DATE, 
    entity_applicability BOOLEAN, 
    impact_score INTEGER, 
    readiness_gap_score INTEGER, 
    estimated_compliance_cost_usd_mn NUMERIC(10, 2), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(assessment_id) REFERENCES regulatory_horizon_assessments (id)
);

CREATE TABLE climate_tech_assessments (
    id SERIAL NOT NULL, 
    technology_name VARCHAR(255), 
    technology_category VARCHAR(50), 
    ctvc_sector VARCHAR(50), 
    assessment_date DATE, 
    trl INTEGER, 
    global_capacity_gw NUMERIC(10, 2), 
    annual_deployment_gw NUMERIC(10, 2), 
    iea_nze_target_2030_gw NUMERIC(10, 2), 
    deployment_gap_pct NUMERIC(5, 2), 
    learning_rate_pct NUMERIC(5, 2), 
    current_lcoe_usd_mwh NUMERIC(8, 2), 
    target_lcoe_2030_usd_mwh NUMERIC(8, 2), 
    target_lcoe_2050_usd_mwh NUMERIC(8, 2), 
    annual_investment_usd_bn NUMERIC(10, 2), 
    iea_required_2030_usd_bn NUMERIC(10, 2), 
    vc_deal_count_ytd INTEGER, 
    vc_investment_usd_bn NUMERIC(10, 2), 
    patent_intensity_score NUMERIC(5, 2), 
    abatement_potential_gtco2_yr NUMERIC(8, 2), 
    mac_usd_tco2 NUMERIC(8, 2), 
    investment_attractiveness_score NUMERIC(5, 2), 
    full_results JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE comprehensive_report_runs (
    id SERIAL NOT NULL, 
    entity_id VARCHAR(100), 
    entity_name VARCHAR(255), 
    reporting_year INTEGER, 
    report_type VARCHAR(30), 
    frameworks_included TEXT[], 
    completeness_score NUMERIC(5, 2), 
    mandatory_dp_count INTEGER, 
    disclosed_dp_count INTEGER, 
    estimated_dp_count INTEGER, 
    missing_dp_count INTEGER, 
    xbrl_tagged BOOLEAN, 
    pdf_generated BOOLEAN, 
    esap_submission_ready BOOLEAN, 
    assurance_level VARCHAR(20), 
    data_lineage_score NUMERIC(5, 2), 
    cross_framework_consistency_score NUMERIC(5, 2), 
    report_url TEXT, 
    xbrl_url TEXT, 
    generation_status VARCHAR(20), 
    full_report_data JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE TABLE report_framework_sections (
    id SERIAL NOT NULL, 
    run_id INTEGER, 
    framework VARCHAR(30), 
    section_name VARCHAR(255), 
    disclosure_reference VARCHAR(100), 
    completeness_pct NUMERIC(5, 2), 
    source_modules TEXT[], 
    cross_reference JSONB, 
    content_summary TEXT, 
    quality_flag VARCHAR(20), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(run_id) REFERENCES comprehensive_report_runs (id)
);

UPDATE alembic_version SET version_num='087' WHERE alembic_version.version_num = '086';

COMMIT;

