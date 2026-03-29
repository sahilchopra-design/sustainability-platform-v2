import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Treemap,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// ── DB Schema: All Supabase tables from Alembic 001–067 ─────────────────────
const DB_SCHEMA = {
  Emissions: [
    { name:'company_emissions', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'year',t:'int'},{n:'scope1_tco2e',t:'numeric'},{n:'scope2_tco2e',t:'numeric'},{n:'scope3_tco2e',t:'numeric'},{n:'intensity',t:'numeric'},{n:'dqs',t:'int'},{n:'verification_status',t:'varchar'}
    ], rows:12480, size:'18.2 MB', indexes:['ix_company_emissions_company_id','ix_company_emissions_year'] },
    { name:'financed_emissions_v2', cols:[
      {n:'id',t:'uuid',pk:true},{n:'portfolio_id',t:'uuid',fk:'portfolios_pg.id'},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'period',t:'varchar'},{n:'scope1_fe',t:'numeric'},{n:'scope2_fe',t:'numeric'},{n:'scope3_fe',t:'numeric'},{n:'attribution_factor',t:'numeric'},{n:'dqs',t:'int'}
    ], rows:8640, size:'12.1 MB', indexes:['ix_fe_v2_portfolio_id','ix_fe_v2_company_id'] },
    { name:'carbon_credits', cols:[
      {n:'id',t:'uuid',pk:true},{n:'project_name',t:'varchar'},{n:'registry',t:'varchar'},{n:'vintage',t:'int'},{n:'type',t:'varchar'},{n:'volume_tco2e',t:'numeric'},{n:'price',t:'numeric'},{n:'status',t:'varchar'}
    ], rows:3200, size:'4.1 MB', indexes:['ix_carbon_credits_registry'] },
    { name:'sbti_targets', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'target_type',t:'varchar'},{n:'base_year',t:'int'},{n:'target_year',t:'int'},{n:'reduction_pct',t:'numeric'},{n:'scope',t:'varchar'},{n:'status',t:'varchar'}
    ], rows:1850, size:'2.3 MB', indexes:['ix_sbti_company_id'] },
    { name:'avoided_emissions', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'methodology',t:'varchar'},{n:'baseline_tco2e',t:'numeric'},{n:'avoided_tco2e',t:'numeric'},{n:'year',t:'int'}
    ], rows:2100, size:'2.8 MB', indexes:['ix_avoided_emissions_company_id'] },
  ],
  Portfolio: [
    { name:'company_profiles', cols:[
      {n:'id',t:'uuid',pk:true},{n:'ticker',t:'varchar',unique:true},{n:'name',t:'varchar'},{n:'sector',t:'varchar'},{n:'sub_industry',t:'varchar'},{n:'country',t:'varchar'},{n:'market_cap',t:'numeric'},{n:'employees',t:'int'},{n:'revenue',t:'numeric'},{n:'created_at',t:'timestamptz'}
    ], rows:15200, size:'22.4 MB', indexes:['ix_cp_ticker','ix_cp_sector','ix_cp_country'] },
    { name:'portfolios_pg', cols:[
      {n:'id',t:'uuid',pk:true},{n:'name',t:'varchar'},{n:'aum',t:'numeric'},{n:'currency',t:'varchar'},{n:'sfdr_class',t:'varchar'},{n:'benchmark',t:'varchar'},{n:'created_at',t:'timestamptz'}
    ], rows:48, size:'0.1 MB', indexes:['ix_portfolios_pg_sfdr'] },
    { name:'portfolio_holdings', cols:[
      {n:'id',t:'uuid',pk:true},{n:'portfolio_id',t:'uuid',fk:'portfolios_pg.id'},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'weight',t:'numeric'},{n:'shares',t:'int'},{n:'asset_class',t:'varchar'},{n:'pcaf_class',t:'int'},{n:'outstanding',t:'numeric'},{n:'acquisition_date',t:'date'}
    ], rows:4320, size:'5.6 MB', indexes:['ix_ph_portfolio_id','ix_ph_company_id'] },
    { name:'esg_ratings', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'provider',t:'varchar'},{n:'rating',t:'varchar'},{n:'score',t:'numeric'},{n:'date',t:'date'},{n:'methodology',t:'varchar'}
    ], rows:21600, size:'14.8 MB', indexes:['ix_esg_company_id','ix_esg_provider'] },
    { name:'green_bonds', cols:[
      {n:'id',t:'uuid',pk:true},{n:'issuer_id',t:'uuid',fk:'company_profiles.id'},{n:'amount',t:'numeric'},{n:'coupon',t:'numeric'},{n:'maturity',t:'date'},{n:'use_of_proceeds',t:'varchar'},{n:'icma_aligned',t:'bool'},{n:'spo_provider',t:'varchar'}
    ], rows:1240, size:'1.8 MB', indexes:['ix_green_bonds_issuer'] },
  ],
  Regulatory: [
    { name:'eu_taxonomy_activities', cols:[
      {n:'id',t:'uuid',pk:true},{n:'nace_code',t:'varchar'},{n:'activity',t:'varchar'},{n:'objective',t:'varchar'},{n:'tsc_threshold',t:'numeric'},{n:'dnsh_criteria',t:'jsonb'}
    ], rows:620, size:'1.2 MB', indexes:['ix_taxonomy_nace'] },
    { name:'sfdr_pai_indicators', cols:[
      {n:'id',t:'uuid',pk:true},{n:'portfolio_id',t:'uuid',fk:'portfolios_pg.id'},{n:'indicator_num',t:'int'},{n:'value',t:'numeric'},{n:'unit',t:'varchar'},{n:'coverage_pct',t:'numeric'},{n:'period',t:'varchar'}
    ], rows:5760, size:'4.2 MB', indexes:['ix_sfdr_portfolio_id'] },
    { name:'csrd_esrs_datapoints', cols:[
      {n:'id',t:'uuid',pk:true},{n:'entity_id',t:'uuid'},{n:'standard',t:'varchar'},{n:'topic',t:'varchar'},{n:'datapoint',t:'varchar'},{n:'value',t:'text'},{n:'assurance_level',t:'varchar'}
    ], rows:34200, size:'28.6 MB', indexes:['ix_csrd_entity','ix_csrd_standard'] },
    { name:'issb_disclosures', cols:[
      {n:'id',t:'uuid',pk:true},{n:'entity_id',t:'uuid'},{n:'standard',t:'varchar'},{n:'metric',t:'varchar'},{n:'value',t:'text'},{n:'period',t:'varchar'}
    ], rows:8400, size:'6.1 MB', indexes:['ix_issb_entity'] },
    { name:'uk_sdr_labels', cols:[
      {n:'id',t:'uuid',pk:true},{n:'fund_id',t:'uuid'},{n:'label_category',t:'varchar'},{n:'label_status',t:'varchar'},{n:'review_date',t:'date'}
    ], rows:320, size:'0.3 MB', indexes:['ix_sdr_fund'] },
    { name:'sec_climate_filings', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'filing_type',t:'varchar'},{n:'period',t:'varchar'},{n:'ghg_disclosed',t:'bool'},{n:'scenario_analysis',t:'bool'}
    ], rows:1800, size:'2.4 MB', indexes:['ix_sec_climate_company'] },
  ],
  Risk: [
    { name:'climate_var_results', cols:[
      {n:'id',t:'uuid',pk:true},{n:'portfolio_id',t:'uuid',fk:'portfolios_pg.id'},{n:'scenario',t:'varchar'},{n:'physical_var',t:'numeric'},{n:'transition_var',t:'numeric'},{n:'total_var',t:'numeric'},{n:'confidence',t:'numeric'},{n:'date',t:'date'}
    ], rows:2880, size:'3.4 MB', indexes:['ix_cvar_portfolio_id','ix_cvar_scenario'] },
    { name:'stress_test_results', cols:[
      {n:'id',t:'uuid',pk:true},{n:'portfolio_id',t:'uuid',fk:'portfolios_pg.id'},{n:'scenario_id',t:'varchar'},{n:'sector',t:'varchar'},{n:'pd_migration',t:'numeric'},{n:'lgd_change',t:'numeric'},{n:'cet1_impact',t:'numeric'}
    ], rows:4200, size:'5.1 MB', indexes:['ix_stress_portfolio'] },
    { name:'physical_risk_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'asset_id',t:'uuid'},{n:'hazard_type',t:'varchar'},{n:'rcp_scenario',t:'varchar'},{n:'exposure_score',t:'numeric'},{n:'vulnerability',t:'numeric'},{n:'time_horizon',t:'varchar'}
    ], rows:9600, size:'8.2 MB', indexes:['ix_pra_asset','ix_pra_hazard'] },
    { name:'transition_risk_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'scenario',t:'varchar'},{n:'carbon_price_impact',t:'numeric'},{n:'stranded_asset_risk',t:'numeric'},{n:'policy_risk',t:'numeric'}
    ], rows:7200, size:'6.8 MB', indexes:['ix_tra_company'] },
    { name:'sovereign_climate_risk', cols:[
      {n:'id',t:'uuid',pk:true},{n:'country_code',t:'varchar'},{n:'physical_score',t:'numeric'},{n:'transition_score',t:'numeric'},{n:'ndgain_score',t:'numeric'},{n:'year',t:'int'}
    ], rows:3800, size:'3.2 MB', indexes:['ix_scr_country'] },
    { name:'catastrophe_models', cols:[
      {n:'id',t:'uuid',pk:true},{n:'peril',t:'varchar'},{n:'region',t:'varchar'},{n:'aal',t:'numeric'},{n:'oel_100',t:'numeric'},{n:'oel_250',t:'numeric'}
    ], rows:1400, size:'1.6 MB', indexes:['ix_cat_peril'] },
  ],
  Nature: [
    { name:'nature_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'biodiversity_score',t:'numeric'},{n:'water_stress',t:'numeric'},{n:'deforestation_risk',t:'numeric'},{n:'tnfd_stage',t:'varchar'}
    ], rows:6400, size:'5.8 MB', indexes:['ix_nature_company'] },
    { name:'water_risk_metrics', cols:[
      {n:'id',t:'uuid',pk:true},{n:'asset_id',t:'uuid'},{n:'basin',t:'varchar'},{n:'stress_score',t:'numeric'},{n:'withdrawal_m3',t:'numeric'},{n:'regulatory_risk',t:'varchar'}
    ], rows:4800, size:'4.2 MB', indexes:['ix_water_asset'] },
    { name:'deforestation_alerts', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'commodity',t:'varchar'},{n:'region',t:'varchar'},{n:'alert_date',t:'date'},{n:'hectares',t:'numeric'},{n:'confidence',t:'numeric'}
    ], rows:11200, size:'9.4 MB', indexes:['ix_defor_company','ix_defor_date'] },
    { name:'ocean_risk_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'region',t:'varchar'},{n:'sst_anomaly',t:'numeric'},{n:'acidification_ph',t:'numeric'},{n:'coral_risk',t:'varchar'},{n:'fisheries_impact',t:'numeric'}
    ], rows:2400, size:'2.1 MB', indexes:['ix_ocean_region'] },
    { name:'circular_economy_metrics', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'circularity_score',t:'numeric'},{n:'recycled_input_pct',t:'numeric'},{n:'waste_diversion_pct',t:'numeric'},{n:'product_lifetime_yrs',t:'numeric'}
    ], rows:3600, size:'3.0 MB', indexes:['ix_circular_company'] },
  ],
  Transport: [
    { name:'vessels', cols:[
      {n:'id',t:'uuid',pk:true},{n:'imo_number',t:'varchar',unique:true},{n:'name',t:'varchar'},{n:'type',t:'varchar'},{n:'dwt',t:'numeric'},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'cii_grade',t:'varchar'},{n:'eexi_compliant',t:'bool'},{n:'fuel_type',t:'varchar'}
    ], rows:1600, size:'2.2 MB', indexes:['ix_vessels_imo','ix_vessels_company'] },
    { name:'airlines', cols:[
      {n:'id',t:'uuid',pk:true},{n:'iata_code',t:'varchar',unique:true},{n:'name',t:'varchar'},{n:'region',t:'varchar'},{n:'fleet_size',t:'int'},{n:'annual_co2',t:'numeric'},{n:'corsia_phase',t:'varchar'},{n:'saf_pct',t:'numeric'}
    ], rows:420, size:'0.5 MB', indexes:['ix_airlines_iata'] },
    { name:'ev_fleet_metrics', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'fleet_size',t:'int'},{n:'ev_pct',t:'numeric'},{n:'tco_savings',t:'numeric'},{n:'co2_avoided',t:'numeric'}
    ], rows:800, size:'0.8 MB', indexes:['ix_ev_fleet_company'] },
    { name:'saf_blending_data', cols:[
      {n:'id',t:'uuid',pk:true},{n:'airline_id',t:'uuid',fk:'airlines.id'},{n:'saf_volume_litres',t:'numeric'},{n:'blend_pct',t:'numeric'},{n:'feedstock',t:'varchar'},{n:'certification',t:'varchar'},{n:'period',t:'varchar'}
    ], rows:640, size:'0.6 MB', indexes:['ix_saf_airline'] },
  ],
  ClimateTech: [
    { name:'climate_scenarios', cols:[
      {n:'id',t:'uuid',pk:true},{n:'name',t:'varchar'},{n:'provider',t:'varchar'},{n:'warming_target',t:'numeric'},{n:'carbon_price_2030',t:'numeric'},{n:'description',t:'text'}
    ], rows:24, size:'0.1 MB', indexes:['ix_scenarios_name'] },
    { name:'engagement_tracking', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'topic',t:'varchar'},{n:'engagement_date',t:'date'},{n:'status',t:'varchar'},{n:'escalation_level',t:'int'},{n:'next_milestone',t:'varchar'}
    ], rows:3200, size:'2.8 MB', indexes:['ix_engagement_company'] },
    { name:'pcaf_asset_classes', cols:[
      {n:'id',t:'uuid',pk:true},{n:'class_number',t:'int'},{n:'description',t:'varchar'},{n:'data_quality_guidance',t:'text'},{n:'attribution_method',t:'varchar'}
    ], rows:7, size:'0.01 MB', indexes:[] },
    { name:'temperature_scores', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'scope',t:'varchar'},{n:'temp_score',t:'numeric'},{n:'confidence',t:'numeric'},{n:'methodology',t:'varchar'}
    ], rows:4500, size:'3.8 MB', indexes:['ix_temp_score_company'] },
    { name:'climate_credit_risk', cols:[
      {n:'id',t:'uuid',pk:true},{n:'borrower_id',t:'uuid',fk:'company_profiles.id'},{n:'pd_baseline',t:'numeric'},{n:'pd_stressed',t:'numeric'},{n:'lgd_adj',t:'numeric'},{n:'ead',t:'numeric'},{n:'scenario',t:'varchar'}
    ], rows:5400, size:'4.6 MB', indexes:['ix_ccr_borrower'] },
    { name:'gar_loans', cols:[
      {n:'id',t:'uuid',pk:true},{n:'bank_id',t:'uuid'},{n:'borrower_id',t:'uuid',fk:'company_profiles.id'},{n:'amount',t:'numeric'},{n:'taxonomy_aligned',t:'bool'},{n:'objective',t:'varchar'},{n:'nace_code',t:'varchar'},{n:'reporting_period',t:'varchar'}
    ], rows:7200, size:'6.2 MB', indexes:['ix_gar_bank','ix_gar_borrower'] },
  ],
  Transition: [
    { name:'transition_plans', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'plan_version',t:'int'},{n:'target_year',t:'int'},{n:'interim_targets',t:'jsonb'},{n:'capex_aligned_pct',t:'numeric'},{n:'governance_score',t:'numeric'},{n:'credibility_score',t:'numeric'},{n:'last_updated',t:'date'}
    ], rows:1600, size:'3.4 MB', indexes:['ix_tp_company'] },
    { name:'gfanz_sector_pathways', cols:[
      {n:'id',t:'uuid',pk:true},{n:'sector',t:'varchar'},{n:'sub_sector',t:'varchar'},{n:'year',t:'int'},{n:'intensity_target',t:'numeric'},{n:'benchmark_source',t:'varchar'},{n:'convergence_pct',t:'numeric'}
    ], rows:2400, size:'2.0 MB', indexes:['ix_gfanz_sector'] },
    { name:'act_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'sector',t:'varchar'},{n:'overall_rating',t:'varchar'},{n:'commitment_score',t:'numeric'},{n:'target_score',t:'numeric'},{n:'action_score',t:'numeric'},{n:'consistency_score',t:'numeric'}
    ], rows:1200, size:'1.4 MB', indexes:['ix_act_company'] },
    { name:'net_zero_commitments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'commitment_year',t:'int'},{n:'target_year',t:'int'},{n:'scope_coverage',t:'varchar'},{n:'interim_target_2030',t:'numeric'},{n:'verification_body',t:'varchar'}
    ], rows:1800, size:'1.6 MB', indexes:['ix_nzc_company'] },
    { name:'esg_ratings_history', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'provider',t:'varchar'},{n:'rating',t:'varchar'},{n:'score',t:'numeric'},{n:'date',t:'date'},{n:'previous_rating',t:'varchar'},{n:'change_reason',t:'text'}
    ], rows:32400, size:'18.6 MB', indexes:['ix_erh_company','ix_erh_provider','ix_erh_date'] },
    { name:'greenwashing_flags', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'claim_type',t:'varchar'},{n:'evidence',t:'text'},{n:'severity',t:'int'},{n:'detection_date',t:'date'},{n:'resolved',t:'bool'}
    ], rows:2800, size:'4.2 MB', indexes:['ix_gw_company','ix_gw_date'] },
  ],
  Materiality: [
    { name:'dcm_methodologies', cols:[
      {n:'id',t:'uuid',pk:true},{n:'methodology_name',t:'varchar'},{n:'framework',t:'varchar'},{n:'sector_applicability',t:'varchar'},{n:'financial_weight',t:'numeric'},{n:'impact_weight',t:'numeric'},{n:'stakeholder_weight',t:'numeric'},{n:'regulatory_weight',t:'numeric'},{n:'temporal_weight',t:'numeric'},{n:'geographic_weight',t:'numeric'},{n:'version',t:'int'},{n:'effective_date',t:'date'}
    ], rows:56, size:'0.2 MB', indexes:['ix_dcm_framework'] },
    { name:'materiality_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'topic',t:'varchar'},{n:'financial_materiality',t:'numeric'},{n:'impact_materiality',t:'numeric'},{n:'double_materiality',t:'numeric'},{n:'confidence',t:'numeric'},{n:'methodology_id',t:'uuid',fk:'dcm_methodologies.id'},{n:'assessment_date',t:'date'}
    ], rows:8400, size:'7.2 MB', indexes:['ix_ma_company','ix_ma_topic'] },
    { name:'spatial_assets', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'asset_name',t:'varchar'},{n:'asset_type',t:'varchar'},{n:'latitude',t:'numeric'},{n:'longitude',t:'numeric'},{n:'geom',t:'geometry'},{n:'country',t:'varchar'}
    ], rows:14200, size:'22.4 MB', indexes:['ix_spatial_company','ix_spatial_geom'] },
  ],
  Governance: [
    { name:'audit_log', cols:[
      {n:'id',t:'uuid',pk:true},{n:'user_id',t:'uuid'},{n:'action',t:'varchar'},{n:'entity_type',t:'varchar'},{n:'entity_id',t:'uuid'},{n:'timestamp',t:'timestamptz'},{n:'session_id',t:'uuid'},{n:'ip_address',t:'inet'}
    ], rows:248000, size:'142.6 MB', indexes:['ix_audit_user','ix_audit_timestamp','ix_audit_entity'] },
    { name:'supplier_assessments', cols:[
      {n:'id',t:'uuid',pk:true},{n:'supplier_id',t:'uuid'},{n:'esg_score',t:'numeric'},{n:'scope3_contribution',t:'numeric'},{n:'engagement_status',t:'varchar'},{n:'corrective_actions',t:'int'}
    ], rows:5400, size:'4.6 MB', indexes:['ix_supplier_id'] },
    { name:'board_compositions', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'member_name',t:'varchar'},{n:'role',t:'varchar'},{n:'gender',t:'varchar'},{n:'independence',t:'bool'},{n:'tenure_years',t:'int'},{n:'esg_expertise',t:'bool'}
    ], rows:7800, size:'6.4 MB', indexes:['ix_board_company'] },
    { name:'executive_compensation', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'executive_name',t:'varchar'},{n:'role',t:'varchar'},{n:'total_comp',t:'numeric'},{n:'esg_linked_pct',t:'numeric'},{n:'year',t:'int'}
    ], rows:4200, size:'3.8 MB', indexes:['ix_exec_comp_company'] },
    { name:'proxy_votes', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'resolution',t:'varchar'},{n:'category',t:'varchar'},{n:'for_pct',t:'numeric'},{n:'against_pct',t:'numeric'},{n:'meeting_date',t:'date'}
    ], rows:9600, size:'8.2 MB', indexes:['ix_proxy_company','ix_proxy_date'] },
    { name:'controversy_events', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'category',t:'varchar'},{n:'severity',t:'int'},{n:'description',t:'text'},{n:'date',t:'date'},{n:'resolved',t:'bool'}
    ], rows:6800, size:'12.4 MB', indexes:['ix_controversy_company','ix_controversy_date'] },
  ],
  Social: [
    { name:'human_rights_risks', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'risk_category',t:'varchar'},{n:'severity',t:'int'},{n:'country',t:'varchar'},{n:'mitigation_status',t:'varchar'}
    ], rows:4200, size:'3.6 MB', indexes:['ix_hr_risk_company'] },
    { name:'living_wage_data', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'country',t:'varchar'},{n:'living_wage_gap_pct',t:'numeric'},{n:'workforce_covered_pct',t:'numeric'}
    ], rows:3200, size:'2.4 MB', indexes:['ix_lw_company'] },
    { name:'modern_slavery_indicators', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'supply_chain_tier',t:'int'},{n:'risk_score',t:'numeric'},{n:'due_diligence_status',t:'varchar'},{n:'statement_published',t:'bool'}
    ], rows:5600, size:'4.8 MB', indexes:['ix_ms_company'] },
    { name:'community_impact_metrics', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'community',t:'varchar'},{n:'investment_usd',t:'numeric'},{n:'jobs_created',t:'int'},{n:'sentiment_score',t:'numeric'}
    ], rows:2800, size:'2.2 MB', indexes:['ix_community_company'] },
    { name:'health_safety_metrics', cols:[
      {n:'id',t:'uuid',pk:true},{n:'company_id',t:'uuid',fk:'company_profiles.id'},{n:'ltir',t:'numeric'},{n:'fatalities',t:'int'},{n:'near_misses',t:'int'},{n:'training_hours',t:'numeric'},{n:'year',t:'int'}
    ], rows:4800, size:'3.4 MB', indexes:['ix_hs_company'] },
  ],
};

const ALL_TABLES = Object.entries(DB_SCHEMA).flatMap(([domain,tables])=>tables.map(t=>({...t,domain})));
const TOTAL_ROWS = ALL_TABLES.reduce((a,t)=>a+t.rows,0);
const TOTAL_SIZE_MB = ALL_TABLES.reduce((a,t)=>a+parseFloat(t.size),0);

// ── SQL Query Templates ──────────────────────────────────────────────────────
const SQL_TEMPLATES = [
  { name:'Portfolio Financed Emissions', sql:"SELECT fe.portfolio_id, p.name AS portfolio, c.name AS company,\n       fe.scope1_fe, fe.scope2_fe, fe.scope3_fe, fe.attribution_factor\nFROM financed_emissions_v2 fe\nJOIN portfolios_pg p ON fe.portfolio_id = p.id\nJOIN company_profiles c ON fe.company_id = c.id\nWHERE fe.period = '2025-Q4'\nORDER BY fe.scope1_fe DESC\nLIMIT 50;" },
  { name:'Company ESG Ratings', sql:"SELECT c.name, c.ticker, c.sector,\n       e.provider, e.rating, e.score, e.date\nFROM esg_ratings e\nJOIN company_profiles c ON e.company_id = c.id\nWHERE e.date >= '2025-01-01'\nORDER BY c.name, e.provider;" },
  { name:'Climate VaR by Scenario', sql:"SELECT scenario,\n       COUNT(*) AS portfolios,\n       ROUND(AVG(total_var), 4) AS avg_var,\n       ROUND(MAX(total_var), 4) AS max_var,\n       ROUND(AVG(confidence), 2) AS avg_confidence\nFROM climate_var_results\nGROUP BY scenario\nORDER BY avg_var DESC;" },
  { name:'SFDR PAI Indicators', sql:"SELECT p.name AS portfolio, s.indicator_num,\n       s.value, s.unit, s.coverage_pct\nFROM sfdr_pai_indicators s\nJOIN portfolios_pg p ON s.portfolio_id = p.id\nWHERE s.period = '2025'\nORDER BY s.indicator_num;" },
  { name:'Audit Trail (Last 100)', sql:"SELECT a.timestamp, a.user_id, a.action,\n       a.entity_type, a.entity_id, a.ip_address\nFROM audit_log a\nORDER BY a.timestamp DESC\nLIMIT 100;" },
  { name:'SBTi Target Status', sql:"SELECT c.name, c.sector, s.target_type,\n       s.base_year, s.target_year, s.reduction_pct,\n       s.scope, s.status\nFROM sbti_targets s\nJOIN company_profiles c ON s.company_id = c.id\nWHERE s.status IN ('Committed', 'Targets Set')\nORDER BY s.target_year;" },
  { name:'Physical Risk Hotspots', sql:"SELECT hazard_type,\n       COUNT(*) AS assessments,\n       ROUND(AVG(exposure_score), 2) AS avg_exposure,\n       ROUND(AVG(vulnerability), 2) AS avg_vulnerability\nFROM physical_risk_assessments\nGROUP BY hazard_type\nORDER BY avg_exposure DESC;" },
  { name:'Green Bond Issuance', sql:"SELECT c.name AS issuer, gb.amount, gb.coupon,\n       gb.maturity, gb.use_of_proceeds,\n       gb.icma_aligned, gb.spo_provider\nFROM green_bonds gb\nJOIN company_profiles c ON gb.issuer_id = c.id\nORDER BY gb.amount DESC\nLIMIT 25;" },
  { name:'CSRD Data Completeness', sql:"SELECT standard, topic,\n       COUNT(*) AS datapoints,\n       COUNT(CASE WHEN value IS NOT NULL THEN 1 END) AS filled,\n       ROUND(100.0 * COUNT(CASE WHEN value IS NOT NULL THEN 1 END) / COUNT(*), 1) AS coverage_pct\nFROM csrd_esrs_datapoints\nGROUP BY standard, topic\nORDER BY standard, topic;" },
  { name:'Nature Risk Summary', sql:"SELECT c.name, c.sector,\n       n.biodiversity_score, n.water_stress,\n       n.deforestation_risk, n.tnfd_stage\nFROM nature_assessments n\nJOIN company_profiles c ON n.company_id = c.id\nWHERE n.deforestation_risk > 0.7\nORDER BY n.deforestation_risk DESC;" },
  { name:'Board Diversity Analysis', sql:"SELECT c.name,\n       COUNT(*) AS board_size,\n       ROUND(100.0 * SUM(CASE WHEN b.gender = 'Female' THEN 1 ELSE 0 END) / COUNT(*), 1) AS female_pct,\n       ROUND(AVG(b.tenure_years), 1) AS avg_tenure,\n       SUM(CASE WHEN b.independence THEN 1 ELSE 0 END) AS independent_count\nFROM board_compositions b\nJOIN company_profiles c ON b.company_id = c.id\nGROUP BY c.name\nORDER BY female_pct DESC;" },
  { name:'Deforestation Alerts', sql:"SELECT d.commodity, d.region,\n       COUNT(*) AS alerts,\n       SUM(d.hectares) AS total_hectares,\n       ROUND(AVG(d.confidence), 2) AS avg_confidence\nFROM deforestation_alerts d\nWHERE d.alert_date >= '2025-01-01'\nGROUP BY d.commodity, d.region\nORDER BY total_hectares DESC;" },
  { name:'Stress Test CET1 Impact', sql:"SELECT st.scenario_id, st.sector,\n       ROUND(AVG(st.pd_migration), 4) AS avg_pd_migration,\n       ROUND(AVG(st.lgd_change), 4) AS avg_lgd_change,\n       ROUND(AVG(st.cet1_impact), 4) AS avg_cet1_impact\nFROM stress_test_results st\nGROUP BY st.scenario_id, st.sector\nORDER BY avg_cet1_impact;" },
  { name:'Vessel CII Grades', sql:"SELECT cii_grade, fuel_type,\n       COUNT(*) AS vessel_count,\n       ROUND(AVG(dwt), 0) AS avg_dwt\nFROM vessels\nGROUP BY cii_grade, fuel_type\nORDER BY cii_grade;" },
  { name:'EU Taxonomy Alignment', sql:"SELECT objective,\n       COUNT(*) AS activities,\n       ROUND(AVG(tsc_threshold), 2) AS avg_threshold\nFROM eu_taxonomy_activities\nGROUP BY objective\nORDER BY activities DESC;" },
  { name:'Temperature Alignment', sql:"SELECT c.name, c.sector, ts.scope,\n       ts.temp_score, ts.confidence, ts.methodology\nFROM temperature_scores ts\nJOIN company_profiles c ON ts.company_id = c.id\nWHERE ts.temp_score > 2.0\nORDER BY ts.temp_score DESC\nLIMIT 50;" },
  { name:'Transition Plan Credibility', sql:"SELECT c.name, tp.plan_version,\n       tp.target_year, tp.capex_aligned_pct,\n       tp.credibility_score, tp.governance_score\nFROM transition_plans tp\nJOIN company_profiles c ON tp.company_id = c.id\nWHERE tp.credibility_score < 50\nORDER BY tp.credibility_score ASC;" },
  { name:'Materiality Double Assessment', sql:"SELECT c.name, ma.topic,\n       ma.financial_materiality, ma.impact_materiality,\n       ma.double_materiality, ma.confidence\nFROM materiality_assessments ma\nJOIN company_profiles c ON ma.company_id = c.id\nWHERE ma.double_materiality > 0.7\nORDER BY ma.double_materiality DESC;" },
  { name:'GAR Taxonomy Alignment', sql:"SELECT g.reporting_period, g.objective,\n       COUNT(*) AS loan_count,\n       SUM(g.amount) AS total_amount,\n       ROUND(100.0 * SUM(CASE WHEN g.taxonomy_aligned THEN 1 ELSE 0 END) / COUNT(*), 1) AS aligned_pct\nFROM gar_loans g\nGROUP BY g.reporting_period, g.objective\nORDER BY g.reporting_period, aligned_pct DESC;" },
  { name:'Supplier ESG Scores', sql:"SELECT sa.esg_score, sa.engagement_status,\n       COUNT(*) AS suppliers,\n       ROUND(AVG(sa.scope3_contribution), 2) AS avg_scope3\nFROM supplier_assessments sa\nGROUP BY sa.esg_score, sa.engagement_status\nORDER BY sa.esg_score DESC;" },
  { name:'Greenwashing Hotspots', sql:"SELECT c.name, c.sector,\n       COUNT(*) AS flags,\n       MAX(gf.severity) AS max_severity,\n       SUM(CASE WHEN gf.resolved THEN 0 ELSE 1 END) AS unresolved\nFROM greenwashing_flags gf\nJOIN company_profiles c ON gf.company_id = c.id\nGROUP BY c.name, c.sector\nHAVING COUNT(*) > 1\nORDER BY unresolved DESC;" },
  { name:'Climate Credit Risk PD Shift', sql:"SELECT c.name, ccr.scenario,\n       ccr.pd_baseline, ccr.pd_stressed,\n       ROUND(ccr.pd_stressed - ccr.pd_baseline, 4) AS pd_delta,\n       ccr.lgd_adj, ccr.ead\nFROM climate_credit_risk ccr\nJOIN company_profiles c ON ccr.borrower_id = c.id\nWHERE ccr.pd_stressed > 0.05\nORDER BY pd_delta DESC\nLIMIT 30;" },
];

// ── Alembic Migrations 001–067 ───────────────────────────────────────────────
const MIGRATIONS = [
  {id:'001',name:'initial_schema',tables:['company_profiles'],cols:10,status:'applied',date:'2025-08-15'},
  {id:'002',name:'add_portfolios',tables:['portfolios_pg','portfolio_holdings'],cols:16,status:'applied',date:'2025-08-16'},
  {id:'003',name:'add_emissions_tables',tables:['company_emissions'],cols:9,status:'applied',date:'2025-08-18'},
  {id:'004',name:'add_esg_ratings',tables:['esg_ratings'],cols:7,status:'applied',date:'2025-08-20'},
  {id:'005',name:'add_financed_emissions',tables:['financed_emissions_v2'],cols:9,status:'applied',date:'2025-08-22'},
  {id:'006',name:'add_climate_var',tables:['climate_var_results'],cols:8,status:'applied',date:'2025-08-25'},
  {id:'007',name:'add_stress_tests',tables:['stress_test_results'],cols:7,status:'applied',date:'2025-08-27'},
  {id:'008',name:'add_eu_taxonomy',tables:['eu_taxonomy_activities'],cols:6,status:'applied',date:'2025-09-01'},
  {id:'009',name:'add_sfdr_pai',tables:['sfdr_pai_indicators'],cols:7,status:'applied',date:'2025-09-03'},
  {id:'010',name:'add_audit_log',tables:['audit_log'],cols:8,status:'applied',date:'2025-09-05'},
  {id:'011',name:'add_physical_risk',tables:['physical_risk_assessments'],cols:7,status:'applied',date:'2025-09-08'},
  {id:'012',name:'add_transition_risk',tables:['transition_risk_assessments'],cols:6,status:'applied',date:'2025-09-10'},
  {id:'013',name:'add_sbti_targets',tables:['sbti_targets'],cols:8,status:'applied',date:'2025-09-12'},
  {id:'014',name:'add_vessels',tables:['vessels'],cols:9,status:'applied',date:'2025-09-15'},
  {id:'015',name:'add_airlines',tables:['airlines'],cols:8,status:'applied',date:'2025-09-17'},
  {id:'016',name:'add_green_bonds',tables:['green_bonds'],cols:8,status:'applied',date:'2025-09-20'},
  {id:'017',name:'add_carbon_credits',tables:['carbon_credits'],cols:8,status:'applied',date:'2025-09-22'},
  {id:'018',name:'add_nature_assessments',tables:['nature_assessments'],cols:6,status:'applied',date:'2025-09-25'},
  {id:'019',name:'add_supplier_assessments',tables:['supplier_assessments'],cols:6,status:'applied',date:'2025-09-27'},
  {id:'020',name:'add_csrd_esrs',tables:['csrd_esrs_datapoints'],cols:7,status:'applied',date:'2025-10-01'},
  {id:'021',name:'add_water_risk',tables:['water_risk_metrics'],cols:6,status:'applied',date:'2025-10-04'},
  {id:'022',name:'add_deforestation',tables:['deforestation_alerts'],cols:7,status:'applied',date:'2025-10-07'},
  {id:'023',name:'add_ocean_risk',tables:['ocean_risk_assessments'],cols:6,status:'applied',date:'2025-10-10'},
  {id:'024',name:'add_circular_economy',tables:['circular_economy_metrics'],cols:6,status:'applied',date:'2025-10-13'},
  {id:'025',name:'add_board_compositions',tables:['board_compositions'],cols:8,status:'applied',date:'2025-10-16'},
  {id:'026',name:'add_exec_compensation',tables:['executive_compensation'],cols:7,status:'applied',date:'2025-10-19'},
  {id:'027',name:'add_proxy_votes',tables:['proxy_votes'],cols:7,status:'applied',date:'2025-10-22'},
  {id:'028',name:'add_controversy_events',tables:['controversy_events'],cols:7,status:'applied',date:'2025-10-25'},
  {id:'029',name:'add_human_rights',tables:['human_rights_risks'],cols:6,status:'applied',date:'2025-10-28'},
  {id:'030',name:'add_living_wage',tables:['living_wage_data'],cols:5,status:'applied',date:'2025-10-31'},
  {id:'031',name:'add_modern_slavery',tables:['modern_slavery_indicators'],cols:6,status:'applied',date:'2025-11-03'},
  {id:'032',name:'add_community_impact',tables:['community_impact_metrics'],cols:6,status:'applied',date:'2025-11-06'},
  {id:'033',name:'add_health_safety',tables:['health_safety_metrics'],cols:7,status:'applied',date:'2025-11-09'},
  {id:'034',name:'add_sovereign_climate',tables:['sovereign_climate_risk'],cols:6,status:'applied',date:'2025-11-12'},
  {id:'035',name:'add_catastrophe_models',tables:['catastrophe_models'],cols:6,status:'applied',date:'2025-11-15'},
  {id:'036',name:'add_avoided_emissions',tables:['avoided_emissions'],cols:6,status:'applied',date:'2025-11-18'},
  {id:'037',name:'add_ev_fleet',tables:['ev_fleet_metrics'],cols:6,status:'applied',date:'2025-11-21'},
  {id:'038',name:'add_issb_disclosures',tables:['issb_disclosures'],cols:6,status:'applied',date:'2025-11-24'},
  {id:'039',name:'add_sec_climate',tables:['sec_climate_filings'],cols:6,status:'applied',date:'2025-11-27'},
  {id:'040',name:'add_emission_indexes',tables:[],cols:0,status:'applied',date:'2025-12-01',note:'Added composite indexes on company_emissions(company_id, year)'},
  {id:'041',name:'add_portfolio_views',tables:[],cols:0,status:'applied',date:'2025-12-04',note:'Created materialized views for portfolio aggregates'},
  {id:'042',name:'add_climate_scenarios',tables:['climate_scenarios'],cols:5,status:'applied',date:'2025-12-08'},
  {id:'043',name:'add_engagement_tracking',tables:['engagement_tracking'],cols:7,status:'applied',date:'2025-12-12'},
  {id:'044',name:'add_pcaf_asset_classes',tables:['pcaf_asset_classes'],cols:5,status:'applied',date:'2025-12-16'},
  {id:'045',name:'add_gar_loans',tables:['gar_loans'],cols:8,status:'applied',date:'2025-12-20'},
  {id:'046',name:'add_temperature_scores',tables:['temperature_scores'],cols:6,status:'applied',date:'2025-12-24'},
  {id:'047',name:'add_climate_credit_risk',tables:['climate_credit_risk'],cols:7,status:'applied',date:'2026-01-02'},
  {id:'048',name:'add_esg_ratings_history',tables:['esg_ratings_history'],cols:8,status:'applied',date:'2026-01-06'},
  {id:'049',name:'add_greenwashing_flags',tables:['greenwashing_flags'],cols:7,status:'applied',date:'2026-01-10'},
  {id:'050',name:'add_transition_plans',tables:['transition_plans'],cols:9,status:'applied',date:'2026-01-14'},
  {id:'051',name:'add_gfanz_pathways',tables:['gfanz_sector_pathways'],cols:7,status:'applied',date:'2026-01-18'},
  {id:'052',name:'add_act_assessments',tables:['act_assessments'],cols:8,status:'applied',date:'2026-01-22'},
  {id:'053',name:'add_nz_commitments',tables:['net_zero_commitments'],cols:7,status:'applied',date:'2026-01-26'},
  {id:'054',name:'add_dcm_methodologies',tables:['dcm_methodologies'],cols:12,status:'applied',date:'2026-01-30'},
  {id:'055',name:'add_materiality_engine',tables:['materiality_assessments'],cols:9,status:'applied',date:'2026-02-03'},
  {id:'056',name:'add_postgis_extensions',tables:[],cols:0,status:'applied',date:'2026-02-07',note:'Enabled PostGIS extensions for spatial queries'},
  {id:'057',name:'add_spatial_assets',tables:['spatial_assets'],cols:8,status:'applied',date:'2026-02-10'},
  {id:'058',name:'add_e29_e31_tables',tables:['sll_slb_instruments','regulatory_horizon_items','sentiment_scores'],cols:21,status:'applied',date:'2026-02-14'},
  {id:'059',name:'add_e32_e34_tables',tables:['export_credit_assessments','loss_damage_claims','nature_capital_accounts'],cols:19,status:'applied',date:'2026-02-18'},
  {id:'060',name:'add_uk_sdr_tables',tables:['uk_sdr_labels'],cols:5,status:'applied',date:'2026-02-22'},
  {id:'061',name:'add_e35_supply_chain',tables:['supply_chain_nodes','conflict_mineral_sources'],cols:14,status:'pending',date:null},
  {id:'062',name:'add_sovereign_v2',tables:['sovereign_debt_sustainability','sovereign_social_index'],cols:12,status:'pending',date:null},
  {id:'063',name:'add_insurance_tables',tables:['parametric_contracts','reinsurance_climate_treaties'],cols:14,status:'pending',date:null},
  {id:'064',name:'add_real_estate_esg',tables:['building_energy_ratings','green_certifications'],cols:12,status:'pending',date:null},
  {id:'065',name:'add_agri_tables',tables:['agri_biodiversity_metrics','regenerative_ag_practices'],cols:11,status:'pending',date:null},
  {id:'066',name:'add_health_climate',tables:['heat_mortality_models','air_quality_finance_metrics'],cols:10,status:'pending',date:null},
  {id:'067',name:'add_e36_e39_tables',tables:['sanctions_screening','energy_security_metrics','pandemic_climate_nexus','critical_mineral_supply'],cols:24,status:'pending',date:null},
];

// ── Data Lineage Definitions ─────────────────────────────────────────────────
const LINEAGE_MAP = {
  'company_emissions.scope1_tco2e': { source:'Climate TRACE / CDP', transform:'Unit normalization (tCO2e)', engines:['E01_ScopeAnalyzer','E03_IntensityCalc'], modules:['EmissionsOverview','CarbonFootprint'], freshness:'2026-03-15', coverage:94.2 },
  'company_emissions.scope2_tco2e': { source:'CDP / Company Filings', transform:'Market-based conversion', engines:['E01_ScopeAnalyzer','E03_IntensityCalc'], modules:['EmissionsOverview','ScopeBreakdown'], freshness:'2026-03-15', coverage:91.8 },
  'company_emissions.scope3_tco2e': { source:'CDP / Estimated (EEIO)', transform:'Category aggregation + EEIO fill', engines:['E01_ScopeAnalyzer','E05_Scope3Estimator'], modules:['Scope3Explorer','ValueChainEmissions'], freshness:'2026-03-10', coverage:72.4 },
  'financed_emissions_v2.scope1_fe': { source:'company_emissions + portfolio_holdings', transform:'PCAF attribution: emissions * attribution_factor', engines:['E07_FinancedEmissions'], modules:['PcafFinancedEmissions','ClimateFootprint'], freshness:'2026-03-18', coverage:88.6 },
  'esg_ratings.score': { source:'MSCI / S&P / Sustainalytics / ISS / CDP / Refinitiv', transform:'Provider-specific normalization (0-100)', engines:['E12_ESGRatingsAggregator'], modules:['EsgRatingsComparator','RatingsMethodologyDecoder'], freshness:'2026-03-20', coverage:96.1 },
  'climate_var_results.total_var': { source:'climate_var_results (computed)', transform:'physical_var + transition_var (Monte Carlo 10k sims)', engines:['E08_ClimateVaR'], modules:['ClimateVaRDashboard','PortfolioRiskOverview'], freshness:'2026-03-12', coverage:100.0 },
  'physical_risk_assessments.exposure_score': { source:'Climate TRACE / NASA GISS / WRI Aqueduct', transform:'Geospatial overlay + hazard probability', engines:['E10_PhysicalRisk'], modules:['PhysicalRiskMap','AssetExposure'], freshness:'2026-03-08', coverage:85.3 },
  'nature_assessments.biodiversity_score': { source:'ENCORE / TNFD / IBAT', transform:'Dependency & impact scoring (0-100)', engines:['E18_NatureLossRisk'], modules:['NatureLossRisk','BiodiversityDashboard'], freshness:'2026-03-05', coverage:78.9 },
  'csrd_esrs_datapoints.value': { source:'Company filings / Manual entry', transform:'ESRS standard mapping + validation', engines:['E20_CsrdAutomation'], modules:['CsrdEsrsAutomation','DisclosureHub'], freshness:'2026-03-22', coverage:64.7 },
  'sbti_targets.reduction_pct': { source:'SBTi Database / Company filings', transform:'Annualized rate calculation', engines:['E15_SbtiTracker'], modules:['SbtiTargetSetter','DecarbonisationRoadmap'], freshness:'2026-03-01', coverage:82.1 },
  'green_bonds.amount': { source:'Bloomberg / CBI Database', transform:'Currency normalization (USD)', engines:['E22_GreenBondAnalyzer'], modules:['GreenBondDashboard','ClimateFinanceHub'], freshness:'2026-03-18', coverage:97.5 },
  'audit_log.action': { source:'Application middleware', transform:'None (raw event capture)', engines:['AuditMiddleware'], modules:['AuditTrail','AdminConsole'], freshness:'2026-03-29 (real-time)', coverage:100.0 },
  'transition_risk_assessments.carbon_price_impact': { source:'NGFS Scenarios / IMF WEO', transform:'Sector-level carbon cost pass-through model', engines:['E09_TransitionRisk','E08_ClimateVaR'], modules:['TransitionRiskMap','ClimateStressTest'], freshness:'2026-03-10', coverage:89.4 },
  'stress_test_results.cet1_impact': { source:'climate_var_results + portfolio_holdings', transform:'Regulatory capital deduction (PD migration * LGD)', engines:['E08_ClimateVaR','E47_ClimateCredit'], modules:['ClimateStressTest','RegulatoryCapital'], freshness:'2026-03-14', coverage:92.0 },
  'eu_taxonomy_activities.tsc_threshold': { source:'EU TEG / Platform on Sustainable Finance', transform:'NACE code mapping + threshold lookup', engines:['E08_Taxonomy'], modules:['GreenTaxonomyNavigator','EuTaxonomyAlignment'], freshness:'2026-02-28', coverage:100.0 },
  'sfdr_pai_indicators.value': { source:'company_emissions + esg_ratings + nature_assessments', transform:'PAI formula per indicator number (SFDR Delegated Regulation)', engines:['E20_SfdrReporting'], modules:['SfdrV2Reporting','DisclosureHub'], freshness:'2026-03-20', coverage:86.3 },
  'vessels.cii_grade': { source:'IMO DCS / ClassNK / LR', transform:'CII rating calculation (AER method)', engines:['E14_ShippingEmissions'], modules:['MaritimeCompliance','VesselDashboard'], freshness:'2026-03-12', coverage:94.8 },
  'deforestation_alerts.hectares': { source:'Global Forest Watch / GLAD Alerts', transform:'Satellite pixel aggregation (30m resolution)', engines:['E19_Deforestation'], modules:['LandUseDeforestation','CommodityDeforestation'], freshness:'2026-03-25', coverage:88.2 },
  'temperature_scores.temp_score': { source:'SBTi / company_emissions + sbti_targets', transform:'SDA pathway alignment (degree Celsius)', engines:['E46_TemperatureScore'], modules:['PortfolioTemperatureScore','NetZeroPortfolioBuilder'], freshness:'2026-03-16', coverage:76.5 },
  'materiality_assessments.double_materiality': { source:'dcm_methodologies + company filings', transform:'Weighted average: financial * impact materiality', engines:['E55_DynamicMateriality'], modules:['CsrdEsrsAutomation','MaterialityMatrix'], freshness:'2026-03-18', coverage:71.2 },
  'greenwashing_flags.severity': { source:'NLP analysis of company disclosures + news', transform:'Claim-evidence gap scoring (1-5)', engines:['E49_GreenwashDetector'], modules:['GreenwashingDetector','EsgRatingsHub'], freshness:'2026-03-22', coverage:83.6 },
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.text },
  header: { background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'20px 32px' },
  headerRow: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  title: { fontSize:22, fontWeight:700, color:T.navy, fontFamily:T.mono, letterSpacing:'-0.5px' },
  subtitle: { fontSize:13, color:T.textMut, fontFamily:T.mono, marginTop:4 },
  badge: { display:'inline-block', fontSize:11, fontFamily:T.mono, padding:'2px 8px', borderRadius:4, fontWeight:600 },
  tabBar: { display:'flex', gap:0, borderBottom:`2px solid ${T.border}`, background:T.surface, padding:'0 32px' },
  tab: (active) => ({ padding:'12px 20px', fontSize:13, fontWeight:600, fontFamily:T.mono, cursor:'pointer', borderBottom:active?`2px solid ${T.gold}`:'2px solid transparent', color:active?T.navy:T.textMut, marginBottom:-2, background:'transparent', border:'none', transition:'all 0.15s' }),
  body: { padding:'24px 32px' },
  card: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, marginBottom:16 },
  cardH: { padding:'14px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' },
  cardB: { padding:'18px' },
  label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:T.textMut, fontFamily:T.mono },
  mono: { fontFamily:T.mono, fontSize:12 },
  monoSm: { fontFamily:T.mono, fontSize:11 },
  grid2: { display:'grid', gridTemplateColumns:'280px 1fr', gap:16 },
  grid3: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 },
  input: { width:'100%', padding:'8px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontFamily:T.mono, fontSize:12, background:T.bg, color:T.text, outline:'none' },
  btn: (color=T.gold) => ({ padding:'8px 16px', borderRadius:6, border:'none', background:color, color:'#fff', fontSize:12, fontWeight:600, fontFamily:T.mono, cursor:'pointer' }),
  btnOutline: { padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:'transparent', color:T.textSec, fontSize:11, fontWeight:600, fontFamily:T.mono, cursor:'pointer' },
  tag: (color) => ({ display:'inline-block', fontSize:10, fontWeight:700, fontFamily:T.mono, padding:'2px 7px', borderRadius:3, background:color+'18', color, marginRight:4 }),
  th: { fontSize:11, fontWeight:700, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px', padding:'8px 12px', textAlign:'left', borderBottom:`1px solid ${T.border}`, background:T.surfaceH, position:'sticky', top:0 },
  td: { fontSize:12, fontFamily:T.mono, padding:'7px 12px', borderBottom:`1px solid ${T.bg}`, color:T.text },
  sidebar: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' },
  sidebarGroup: { padding:'10px 14px', fontSize:11, fontWeight:700, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.5px', background:T.surfaceH, borderBottom:`1px solid ${T.border}` },
  sidebarItem: (active) => ({ padding:'8px 14px 8px 22px', fontSize:12, fontFamily:T.mono, cursor:'pointer', background:active?T.gold+'15':'transparent', color:active?T.navy:T.textSec, borderLeft:active?`3px solid ${T.gold}`:'3px solid transparent', transition:'all 0.12s' }),
  sqlEditor: { width:'100%', minHeight:200, padding:'14px', fontFamily:T.mono, fontSize:13, lineHeight:1.6, background:'#1e293b', color:'#e2e8f0', border:'none', borderRadius:8, resize:'vertical', outline:'none', tabSize:2 },
  resultContainer: { maxHeight:400, overflow:'auto', border:`1px solid ${T.border}`, borderRadius:6 },
  statBox: { background:T.surfaceH, borderRadius:6, padding:'14px 18px', textAlign:'center' },
  statVal: { fontSize:22, fontWeight:700, fontFamily:T.mono, color:T.navy },
  statLabel: { fontSize:11, color:T.textMut, fontFamily:T.mono, marginTop:2 },
  lineageNode: (type) => ({ display:'inline-block', padding:'8px 14px', borderRadius:6, fontSize:12, fontFamily:T.mono, fontWeight:600, border:`1px solid ${type==='source'?T.teal:type==='engine'?T.gold:type==='module'?T.navyL:T.border}`, background:type==='source'?T.teal+'12':type==='engine'?T.gold+'12':type==='module'?T.navyL+'12':T.surfaceH, color:type==='source'?T.teal:type==='engine'?T.gold:type==='module'?T.navyL:T.textSec }),
  lineageArrow: { display:'inline-block', margin:'0 12px', fontSize:16, color:T.textMut },
  migrationRow: (status) => ({ display:'grid', gridTemplateColumns:'60px 1fr 200px 100px 90px', gap:8, padding:'8px 14px', borderBottom:`1px solid ${T.bg}`, background:status==='pending'?T.amber+'08':'transparent', alignItems:'center' }),
};

// ── Helper: Generate sample data rows for a table ────────────────────────────
const generateSampleRows = (table, count=20) => {
  return Array.from({length:count},(_,i)=>{
    const row = {};
    table.cols.forEach((col,ci)=>{
      const seed = i*100+ci*17;
      if(col.pk) row[col.n] = `${table.name.substring(0,3)}-${String(i+1).padStart(4,'0')}`;
      else if(col.fk) row[col.n] = `${col.fk.split('.')[0].substring(0,3)}-${String(Math.floor(sr(seed)*500)+1).padStart(4,'0')}`;
      else if(col.t==='numeric') row[col.n] = +(sr(seed)*1000).toFixed(2);
      else if(col.t==='int') row[col.n] = Math.floor(sr(seed)*1000);
      else if(col.t==='bool') row[col.n] = sr(seed)>0.5?'true':'false';
      else if(col.t==='date') row[col.n] = `2025-${String(Math.floor(sr(seed)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(seed+1)*28)+1).padStart(2,'0')}`;
      else if(col.t==='timestamptz') row[col.n] = `2026-03-${String(Math.floor(sr(seed)*28)+1).padStart(2,'0')}T${String(Math.floor(sr(seed+2)*24)).padStart(2,'0')}:${String(Math.floor(sr(seed+3)*60)).padStart(2,'0')}:00Z`;
      else if(col.t==='jsonb') row[col.n] = '{...}';
      else if(col.t==='text') row[col.n] = ['Assessment complete','Pending review','Data validated','Requires update','Verified'][Math.floor(sr(seed)*5)];
      else if(col.t==='inet') row[col.n] = `${Math.floor(sr(seed)*255)}.${Math.floor(sr(seed+1)*255)}.${Math.floor(sr(seed+2)*255)}.${Math.floor(sr(seed+3)*255)}`;
      else row[col.n] = ['Active','Pending','Complete','In Progress','Approved','Draft','Under Review','Committed','Targets Set','High','Medium','Low','Critical','Moderate'][Math.floor(sr(seed)*14)];
    });
    return row;
  });
};

// ── Helper: Simulate query execution ─────────────────────────────────────────
const simulateQueryResults = (sql, seed=42) => {
  const cols = [];
  const selectMatch = sql.match(/SELECT\s+([\s\S]*?)\s+FROM/i);
  if(selectMatch) {
    const parts = selectMatch[1].split(',').map(s=>s.trim());
    parts.forEach(p => {
      const asMatch = p.match(/\bAS\s+(\w+)/i);
      const name = asMatch ? asMatch[1] : p.replace(/.*\./, '').replace(/[()]/g,'').replace(/ROUND|AVG|COUNT|SUM|MAX|MIN|CASE|WHEN|THEN|ELSE|END/gi,'').trim().split(/\s+/)[0];
      if(name && name.length > 0 && name !== '*') cols.push(name);
    });
  }
  if(cols.length===0) cols.push('id','col1','col2','col3','col4');
  const rowCount = Math.floor(sr(seed*7)*40)+5;
  const rows = Array.from({length:rowCount},(_,i)=>{
    const row={};
    cols.forEach((c,ci)=>{
      const s=i*100+ci*31+seed;
      if(c.includes('name')||c.includes('portfolio')||c.includes('company')||c.includes('issuer')) row[c]=['Alpha Fund','Beta Growth','Gamma ESG','Delta Impact','Epsilon Green','Zeta Climate','Eta Transition','Theta Nature','Iota Social','Kappa Gov'][i%10];
      else if(c.includes('pct')||c.includes('coverage')||c.includes('confidence')) row[c]=+(sr(s)*100).toFixed(1);
      else if(c.includes('count')||c.includes('size')||c.includes('portfolios')||c.includes('activities')||c.includes('assessments')||c.includes('alerts')||c.includes('datapoints')||c.includes('filled')) row[c]=Math.floor(sr(s)*500)+1;
      else if(c.includes('var')||c.includes('impact')||c.includes('migration')||c.includes('change')||c.includes('score')||c.includes('threshold')||c.includes('exposure')||c.includes('vulnerability')) row[c]=+(sr(s)*0.5-0.1).toFixed(4);
      else if(c.includes('amount')||c.includes('total')||c.includes('savings')||c.includes('hectares')) row[c]=+(sr(s)*10000).toFixed(0);
      else if(c.includes('scenario')||c.includes('type')||c.includes('grade')||c.includes('status')||c.includes('sector')||c.includes('category')||c.includes('region')||c.includes('commodity')||c.includes('objective')||c.includes('fuel')) row[c]=['NGFS Current Policies','NGFS Net Zero 2050','NGFS Delayed','Hot House World','Orderly','Disorderly'][i%6];
      else if(c.includes('date')||c.includes('timestamp')) row[c]=`2026-03-${String(Math.floor(sr(s)*28)+1).padStart(2,'0')}`;
      else if(c.includes('indicator')) row[c]=Math.floor(sr(s)*18)+1;
      else if(c.includes('dwt')) row[c]=Math.floor(sr(s)*200000)+5000;
      else row[c]=+(sr(s)*100).toFixed(2);
    });
    return row;
  });
  return { cols, rows, rowCount, execTime:Math.floor(sr(seed*3)*800)+50 };
};

// ── Helper: Explain plan simulation ──────────────────────────────────────────
const simulateExplainPlan = (sql) => {
  const hasJoin = /JOIN/i.test(sql);
  const hasGroup = /GROUP BY/i.test(sql);
  const hasWhere = /WHERE/i.test(sql);
  const hasOrder = /ORDER BY/i.test(sql);
  const hasLimit = /LIMIT/i.test(sql);
  const steps = [];
  if(hasJoin) steps.push({ op:'Hash Join', cost:'124.50..892.30', rows:500, width:128, note:'Inner join on FK index' });
  if(hasWhere) steps.push({ op:'Index Scan', cost:'0.42..45.80', rows:120, width:64, note:'Using btree index' });
  else steps.push({ op:'Seq Scan', cost:'0.00..1245.00', rows:5000, width:96, note:'Full table scan' });
  if(hasGroup) steps.push({ op:'HashAggregate', cost:'892.30..920.50', rows:25, width:48, note:'Group key hashing' });
  if(hasOrder) steps.push({ op:'Sort', cost:'920.50..925.80', rows:25, width:48, note:hasLimit?'Top-N heapsort':'Quicksort in memory' });
  if(hasLimit) steps.push({ op:'Limit', cost:'925.80..926.00', rows:parseInt(sql.match(/LIMIT\s+(\d+)/i)?.[1]||'50'), width:48, note:'Row limit applied' });
  return steps;
};

// ══════════════════════════════════════════════════════════════════════════════
// ── TAB 1: Table Browser ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const TableBrowser = () => {
  const [selectedTable, setSelectedTable] = useState(ALL_TABLES[0]?.name||'');
  const [columnSearch, setColumnSearch] = useState('');
  const [showRelationships, setShowRelationships] = useState(false);

  const table = useMemo(()=>ALL_TABLES.find(t=>t.name===selectedTable),[selectedTable]);
  const sampleRows = useMemo(()=>table?generateSampleRows(table,20):[],[table]);

  const columnSearchResults = useMemo(()=>{
    if(!columnSearch||columnSearch.length<2) return [];
    const q=columnSearch.toLowerCase();
    return ALL_TABLES.flatMap(t=>t.cols.filter(c=>c.n.toLowerCase().includes(q)).map(c=>({table:t.name,domain:t.domain,col:c.n,type:c.t,pk:c.pk,fk:c.fk})));
  },[columnSearch]);

  const fkRelationships = useMemo(()=>{
    return ALL_TABLES.flatMap(t=>t.cols.filter(c=>c.fk).map(c=>({from:t.name,fromCol:c.n,to:c.fk.split('.')[0],toCol:c.fk.split('.')[1]})));
  },[]);

  const domainSizes = useMemo(()=>Object.entries(DB_SCHEMA).map(([domain,tables])=>({
    domain, tables:tables.length, rows:tables.reduce((a,t)=>a+t.rows,0), size:tables.reduce((a,t)=>a+parseFloat(t.size),0).toFixed(1)
  })),[]);

  return (
    <div>
      {/* Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        <div style={S.statBox}><div style={S.statVal}>{ALL_TABLES.length}</div><div style={S.statLabel}>TABLES</div></div>
        <div style={S.statBox}><div style={S.statVal}>{ALL_TABLES.reduce((a,t)=>a+t.cols.length,0)}</div><div style={S.statLabel}>COLUMNS</div></div>
        <div style={S.statBox}><div style={S.statVal}>{(TOTAL_ROWS/1000).toFixed(0)}K</div><div style={S.statLabel}>TOTAL ROWS</div></div>
        <div style={S.statBox}><div style={S.statVal}>{TOTAL_SIZE_MB.toFixed(0)} MB</div><div style={S.statLabel}>TOTAL SIZE</div></div>
        <div style={S.statBox}><div style={S.statVal}>{fkRelationships.length}</div><div style={S.statLabel}>FK RELATIONS</div></div>
      </div>

      {/* Column Search */}
      <div style={{...S.card,marginBottom:16}}>
        <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
          <span style={{...S.label,minWidth:120}}>COLUMN SEARCH</span>
          <input style={{...S.input,flex:1}} placeholder='Search across all tables (e.g. "scope1", "company_id", "score")...' value={columnSearch} onChange={e=>setColumnSearch(e.target.value)} />
          <button style={S.btnOutline} onClick={()=>setShowRelationships(!showRelationships)}>{showRelationships?'Hide':'Show'} FK Map</button>
        </div>
        {columnSearchResults.length > 0 && (
          <div style={{maxHeight:200,overflow:'auto',borderTop:`1px solid ${T.border}`}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}>TABLE</th><th style={S.th}>DOMAIN</th><th style={S.th}>COLUMN</th><th style={S.th}>TYPE</th><th style={S.th}>CONSTRAINTS</th>
              </tr></thead>
              <tbody>{columnSearchResults.slice(0,30).map((r,i)=>(
                <tr key={i} style={{cursor:'pointer'}} onClick={()=>{setSelectedTable(r.table);setColumnSearch('');}}>
                  <td style={{...S.td,color:T.navyL,fontWeight:600}}>{r.table}</td>
                  <td style={S.td}><span style={S.tag(T.teal)}>{r.domain}</span></td>
                  <td style={{...S.td,fontWeight:600}}>{r.col}</td>
                  <td style={{...S.td,color:T.amber}}>{r.type}</td>
                  <td style={S.td}>{r.pk&&<span style={S.tag(T.gold)}>PK</span>}{r.fk&&<span style={S.tag(T.navyL)}>FK {r.fk}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
            {columnSearchResults.length > 30 && <div style={{padding:8,textAlign:'center',...S.monoSm,color:T.textMut}}>+{columnSearchResults.length-30} more matches</div>}
          </div>
        )}
      </div>

      {/* FK Relationships Panel */}
      {showRelationships && (
        <div style={{...S.card,marginBottom:16}}>
          <div style={S.cardH}><span style={{...S.label,fontSize:12}}>FOREIGN KEY RELATIONSHIPS ({fkRelationships.length})</span></div>
          <div style={{...S.cardB,maxHeight:300,overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}>FROM TABLE</th><th style={S.th}>COLUMN</th><th style={S.th}></th><th style={S.th}>TO TABLE</th><th style={S.th}>COLUMN</th>
              </tr></thead>
              <tbody>{fkRelationships.map((r,i)=>(
                <tr key={i}>
                  <td style={{...S.td,fontWeight:600,color:T.navyL}}>{r.from}</td>
                  <td style={S.td}>{r.fromCol}</td>
                  <td style={{...S.td,textAlign:'center',color:T.gold,fontSize:16}}>&#8594;</td>
                  <td style={{...S.td,fontWeight:600,color:T.teal}}>{r.to}</td>
                  <td style={S.td}>{r.toCol}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Domain Size Chart */}
      <div style={{...S.card,marginBottom:16}}>
        <div style={S.cardH}><span style={{...S.label,fontSize:12}}>TABLE SIZE BY DOMAIN</span></div>
        <div style={{padding:'12px 18px'}}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={domainSizes} layout="vertical" margin={{left:100}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{fontSize:11,fontFamily:T.mono,fill:T.textMut}} />
              <YAxis type="category" dataKey="domain" tick={{fontSize:11,fontFamily:T.mono,fill:T.textSec}} width={90} />
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:12,borderRadius:6,border:`1px solid ${T.border}`}} />
              <Bar dataKey="rows" fill={T.gold} radius={[0,4,4,0]} name="Rows" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Domain Distribution Pie + Table Size Ranking */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={S.card}>
          <div style={S.cardH}><span style={S.label}>ROWS BY DOMAIN</span></div>
          <div style={{padding:'12px 18px',display:'flex',alignItems:'center'}}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={domainSizes} dataKey="rows" nameKey="domain" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} label={({domain,percent})=>`${domain} ${(percent*100).toFixed(0)}%`} style={{fontSize:10,fontFamily:T.mono}}>
                  {domainSizes.map((d,i)=><Cell key={i} fill={[T.navy,T.gold,T.teal,T.sage,T.navyL,T.amber,T.red,T.green,'#7c3aed','#0e7490'][i%10]} />)}
                </Pie>
                <Tooltip contentStyle={{fontFamily:T.mono,fontSize:12,borderRadius:6,border:`1px solid ${T.border}`}} formatter={(v)=>`${v.toLocaleString()} rows`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><span style={S.label}>TOP 10 TABLES BY ROW COUNT</span></div>
          <div style={{padding:'8px 18px',maxHeight:200,overflow:'auto'}}>
            {[...ALL_TABLES].sort((a,b)=>b.rows-a.rows).slice(0,10).map((t,i)=>(
              <div key={t.name} style={{display:'flex',alignItems:'center',gap:10,padding:'5px 0',borderBottom:`1px solid ${T.bg}`}}>
                <span style={{...S.monoSm,color:T.textMut,width:18,textAlign:'right'}}>{i+1}</span>
                <span style={{...S.monoSm,fontWeight:600,color:T.navy,flex:1}}>{t.name}</span>
                <div style={{width:120,height:8,background:T.bg,borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:`${(t.rows/TOTAL_ROWS)*100*4}%`,height:'100%',background:T.gold,borderRadius:4,maxWidth:'100%'}} />
                </div>
                <span style={{...S.monoSm,color:T.textMut,minWidth:60,textAlign:'right'}}>{t.rows.toLocaleString()}</span>
                <span style={{...S.monoSm,color:T.textMut,minWidth:50,textAlign:'right'}}>{t.size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schema Version Banner */}
      <div style={{...S.card,marginBottom:16,background:T.navy+'06'}}>
        <div style={{padding:'10px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <span style={{...S.monoSm,color:T.textMut}}>SCHEMA VERSION</span>
            <span style={{...S.mono,fontWeight:700,color:T.gold}}>Alembic head: 067_add_e36_e39_tables</span>
          </div>
          <div style={{display:'flex',gap:12}}>
            <span style={{...S.monoSm,color:T.textMut}}>Total FK relationships: {fkRelationships.length}</span>
            <span style={{...S.monoSm,color:T.textMut}}>Total indexes: {ALL_TABLES.reduce((a,t)=>a+t.indexes.length,0)}</span>
            <span style={{...S.monoSm,color:T.textMut}}>PostGIS enabled</span>
          </div>
        </div>
      </div>

      {/* Main: Sidebar + Detail */}
      <div style={S.grid2}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,background:T.surfaceH}}>
            <span style={{...S.monoSm,color:T.textMut}}>SCHEMA v067 | {ALL_TABLES.length} tables</span>
          </div>
          <div style={{maxHeight:600,overflow:'auto'}}>
            {Object.entries(DB_SCHEMA).map(([domain,tables])=>(
              <div key={domain}>
                <div style={S.sidebarGroup}>{domain} ({tables.length})</div>
                {tables.map(t=>(
                  <div key={t.name} style={S.sidebarItem(selectedTable===t.name)} onClick={()=>setSelectedTable(t.name)}>
                    {t.name} <span style={{color:T.textMut,fontSize:10,marginLeft:6}}>{t.rows.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Table Detail */}
        {table ? (
          <div>
            {/* Table header */}
            <div style={{...S.card}}>
              <div style={S.cardH}>
                <div>
                  <span style={{fontSize:16,fontWeight:700,fontFamily:T.mono,color:T.navy}}>{table.name}</span>
                  <span style={{...S.tag(T.teal),marginLeft:10}}>{table.domain}</span>
                </div>
                <div style={{display:'flex',gap:16,...S.monoSm,color:T.textMut}}>
                  <span>{table.rows.toLocaleString()} rows</span>
                  <span>{table.size}</span>
                  <span>{table.cols.length} cols</span>
                </div>
              </div>

              {/* Columns */}
              <div style={{borderBottom:`1px solid ${T.border}`}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>
                    <th style={S.th}>#</th><th style={S.th}>COLUMN</th><th style={S.th}>TYPE</th><th style={S.th}>CONSTRAINTS</th>
                  </tr></thead>
                  <tbody>{table.cols.map((c,i)=>(
                    <tr key={i}>
                      <td style={{...S.td,color:T.textMut,width:40}}>{i+1}</td>
                      <td style={{...S.td,fontWeight:600}}>{c.n}</td>
                      <td style={{...S.td,color:T.amber}}>{c.t}</td>
                      <td style={S.td}>
                        {c.pk&&<span style={S.tag(T.gold)}>PRIMARY KEY</span>}
                        {c.unique&&<span style={S.tag(T.teal)}>UNIQUE</span>}
                        {c.fk&&<span style={S.tag(T.navyL)}>FK &#8594; {c.fk}</span>}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>

              {/* Indexes */}
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${T.border}`}}>
                <div style={{...S.label,marginBottom:8}}>INDEXES ({table.indexes.length})</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {table.indexes.map((idx,i)=>(
                    <span key={i} style={{...S.monoSm,padding:'3px 8px',background:T.surfaceH,borderRadius:4,border:`1px solid ${T.border}`}}>{idx}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Data */}
            <div style={{...S.card,marginTop:16}}>
              <div style={S.cardH}>
                <span style={{...S.label,fontSize:12}}>SAMPLE DATA (first 20 rows)</span>
                <button style={S.btnOutline}>Export CSV</button>
              </div>
              <div style={S.resultContainer}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:table.cols.length*120}}>
                  <thead><tr>{table.cols.map((c,i)=><th key={i} style={S.th}>{c.n}</th>)}</tr></thead>
                  <tbody>{sampleRows.map((row,ri)=>(
                    <tr key={ri} style={{background:ri%2===0?'transparent':T.bg+'80'}}>
                      {table.cols.map((c,ci)=><td key={ci} style={{...S.td,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row[c.n]}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:T.textMut,...S.mono,height:200}}>Select a table from the sidebar</div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── TAB 2: SQL Query Editor ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const SQLQueryEditor = () => {
  const [sql, setSql] = useState(SQL_TEMPLATES[0].sql);
  const [results, setResults] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [showExplain, setShowExplain] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(SQL_TEMPLATES[0].name);
  const [resultsPage, setResultsPage] = useState(0);
  const PAGE_SIZE = 15;

  const handleRun = useCallback(() => {
    const seed = sql.length*7+sql.charCodeAt(0);
    const res = simulateQueryResults(sql, seed);
    setResults(res);
    setResultsPage(0);
    setQueryHistory(prev=>[{sql:sql.substring(0,80)+(sql.length>80?'...':''),time:new Date().toISOString().replace('T',' ').substring(0,19),execMs:res.execTime,rows:res.rowCount},...prev].slice(0,20));
  },[sql]);

  const handleTemplateChange = useCallback((name)=>{
    const tpl = SQL_TEMPLATES.find(t=>t.name===name);
    if(tpl){setSql(tpl.sql);setSelectedTemplate(name);setResults(null);setShowExplain(false);}
  },[]);

  const explainPlan = useMemo(()=>simulateExplainPlan(sql),[sql]);

  const pagedRows = useMemo(()=>{
    if(!results) return [];
    return results.rows.slice(resultsPage*PAGE_SIZE,(resultsPage+1)*PAGE_SIZE);
  },[results,resultsPage]);

  const totalPages = results ? Math.ceil(results.rows.length/PAGE_SIZE) : 0;

  // SQL syntax highlighting (simple)
  const highlightedSQL = useMemo(()=>{
    if(!sql) return '';
    return sql
      .replace(/(SELECT|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|AND|OR|IN|AS|NOT|NULL|IS|BETWEEN|LIKE|EXISTS|CASE|WHEN|THEN|ELSE|END|DISTINCT|COUNT|AVG|SUM|MAX|MIN|ROUND|DESC|ASC|LEFT|RIGHT|INNER|OUTER|FULL|UNION|ALL|INTO|VALUES|SET|WITH)\b/gi, '<kw>$1</kw>')
      .replace(/'([^']*)'/g, '<str>\'$1\'</str>')
      .replace(/\b(\d+\.?\d*)\b/g, '<num>$1</num>');
  },[sql]);

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16}}>
        {/* Editor */}
        <div>
          {/* Template Selector */}
          <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center'}}>
            <span style={S.label}>TEMPLATE</span>
            <select style={{...S.input,flex:1,maxWidth:320}} value={selectedTemplate} onChange={e=>handleTemplateChange(e.target.value)}>
              {SQL_TEMPLATES.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <button style={S.btn(T.gold)} onClick={handleRun}>&#9654; Run Query</button>
            <button style={S.btnOutline} onClick={()=>setShowExplain(!showExplain)}>{showExplain?'Hide':'Show'} Explain</button>
          </div>

          {/* SQL Editor */}
          <div style={{position:'relative',marginBottom:16}}>
            <textarea style={S.sqlEditor} value={sql} onChange={e=>setSql(e.target.value)} spellCheck={false} />
            <div style={{position:'absolute',top:4,right:12,...S.monoSm,color:'#64748b'}}>{sql.split('\n').length} lines</div>
          </div>

          {/* Syntax Highlight Preview */}
          <div style={{...S.card,marginBottom:16}}>
            <div style={S.cardH}><span style={S.label}>SYNTAX PREVIEW</span></div>
            <pre style={{padding:'14px 18px',fontFamily:T.mono,fontSize:12,lineHeight:1.6,margin:0,background:T.surfaceH,overflow:'auto',maxHeight:180,whiteSpace:'pre-wrap'}}>
              {sql.split('\n').map((line,li)=>(
                <div key={li}>
                  <span style={{color:T.textMut,display:'inline-block',width:30,textAlign:'right',marginRight:12,userSelect:'none'}}>{li+1}</span>
                  {line.split(/(\b(?:SELECT|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|AND|OR|AS|NOT|NULL|IS|IN|CASE|WHEN|THEN|ELSE|END|DISTINCT|COUNT|AVG|SUM|MAX|MIN|ROUND|DESC|ASC|LEFT|RIGHT|INNER|OUTER)\b|'[^']*'|\b\d+\.?\d*\b)/gi).map((part,pi)=>{
                    if(/^(SELECT|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|AND|OR|AS|NOT|NULL|IS|IN|CASE|WHEN|THEN|ELSE|END|DISTINCT|COUNT|AVG|SUM|MAX|MIN|ROUND|DESC|ASC|LEFT|RIGHT|INNER|OUTER)$/i.test(part)) return <span key={pi} style={{color:T.navyL,fontWeight:700}}>{part}</span>;
                    if(/^'.*'$/.test(part)) return <span key={pi} style={{color:T.green}}>{part}</span>;
                    if(/^\d+\.?\d*$/.test(part)) return <span key={pi} style={{color:T.amber}}>{part}</span>;
                    return <span key={pi}>{part}</span>;
                  })}
                </div>
              ))}
            </pre>
          </div>

          {/* Explain Plan */}
          {showExplain && (
            <div style={{...S.card,marginBottom:16}}>
              <div style={S.cardH}><span style={S.label}>EXPLAIN PLAN (estimated)</span></div>
              <div style={S.cardB}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>
                    <th style={S.th}>OPERATION</th><th style={S.th}>COST</th><th style={S.th}>ROWS</th><th style={S.th}>WIDTH</th><th style={S.th}>NOTE</th>
                  </tr></thead>
                  <tbody>{explainPlan.map((step,i)=>(
                    <tr key={i}>
                      <td style={{...S.td,fontWeight:600,paddingLeft:14+i*16}}>{i>0?'-> ':''}{step.op}</td>
                      <td style={{...S.td,color:T.amber}}>{step.cost}</td>
                      <td style={S.td}>{step.rows}</td>
                      <td style={S.td}>{step.width}</td>
                      <td style={{...S.td,color:T.textMut}}>{step.note}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Execution Stats */}
          {results && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
              <div style={{...S.statBox,padding:'10px 14px'}}>
                <div style={{...S.statVal,fontSize:18,color:T.green}}>{results.execTime}ms</div>
                <div style={{...S.statLabel,fontSize:10}}>EXEC TIME</div>
              </div>
              <div style={{...S.statBox,padding:'10px 14px'}}>
                <div style={{...S.statVal,fontSize:18}}>{results.rowCount}</div>
                <div style={{...S.statLabel,fontSize:10}}>ROWS RETURNED</div>
              </div>
              <div style={{...S.statBox,padding:'10px 14px'}}>
                <div style={{...S.statVal,fontSize:18}}>{results.cols.length}</div>
                <div style={{...S.statLabel,fontSize:10}}>COLUMNS</div>
              </div>
              <div style={{...S.statBox,padding:'10px 14px'}}>
                <div style={{...S.statVal,fontSize:18,color:results.execTime<200?T.green:results.execTime<500?T.amber:T.red}}>{results.execTime<200?'FAST':results.execTime<500?'OK':'SLOW'}</div>
                <div style={{...S.statLabel,fontSize:10}}>PERFORMANCE</div>
              </div>
              <div style={{...S.statBox,padding:'10px 14px'}}>
                <div style={{...S.statVal,fontSize:18}}>{(results.rowCount*results.cols.length*12/1024).toFixed(1)}KB</div>
                <div style={{...S.statLabel,fontSize:10}}>EST. PAYLOAD</div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results && (
            <div style={S.card}>
              <div style={S.cardH}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={S.label}>RESULTS</span>
                  <span style={{...S.monoSm,color:T.green}}>{results.rowCount} rows</span>
                  <span style={{...S.monoSm,color:T.textMut}}>{results.execTime}ms</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {totalPages>1 && (
                    <>
                      <button style={S.btnOutline} onClick={()=>setResultsPage(p=>Math.max(0,p-1))} disabled={resultsPage===0}>Prev</button>
                      <span style={S.monoSm}>{resultsPage+1}/{totalPages}</span>
                      <button style={S.btnOutline} onClick={()=>setResultsPage(p=>Math.min(totalPages-1,p+1))} disabled={resultsPage>=totalPages-1}>Next</button>
                    </>
                  )}
                  <button style={S.btnOutline}>Export CSV</button>
                </div>
              </div>
              <div style={S.resultContainer}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:results.cols.length*130}}>
                  <thead><tr>{results.cols.map((c,i)=><th key={i} style={S.th}>{c}</th>)}</tr></thead>
                  <tbody>{pagedRows.map((row,ri)=>(
                    <tr key={ri} style={{background:ri%2===0?'transparent':T.bg+'80'}}>
                      {results.cols.map((c,ci)=><td key={ci} style={{...S.td,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row[c]}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Query History */}
        <div style={S.sidebar}>
          <div style={S.sidebarGroup}>QUERY HISTORY ({queryHistory.length})</div>
          <div style={{maxHeight:700,overflow:'auto'}}>
            {queryHistory.length===0 ? (
              <div style={{padding:14,...S.monoSm,color:T.textMut}}>No queries executed yet. Run a query to see history.</div>
            ) : queryHistory.map((h,i)=>(
              <div key={i} style={{padding:'10px 14px',borderBottom:`1px solid ${T.bg}`,cursor:'pointer'}} onClick={()=>{const tpl=SQL_TEMPLATES.find(t=>h.sql.startsWith(t.sql.substring(0,40)));if(tpl)setSql(tpl.sql);}}>
                <div style={{...S.monoSm,color:T.navy,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.sql}</div>
                <div style={{display:'flex',gap:8,...S.monoSm,color:T.textMut}}>
                  <span>{h.time}</span>
                  <span style={{color:T.green}}>{h.execMs}ms</span>
                  <span>{h.rows} rows</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── TAB 3: Data Lineage View ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const DataLineageView = () => {
  const [selectedColumn, setSelectedColumn] = useState('company_emissions.scope1_tco2e');
  const [lineageDepth, setLineageDepth] = useState('full');

  const lineage = LINEAGE_MAP[selectedColumn];
  const lineageKeys = Object.keys(LINEAGE_MAP);

  const coverageData = useMemo(()=>lineageKeys.map(k=>({
    name:k.split('.')[1],
    table:k.split('.')[0],
    coverage:LINEAGE_MAP[k].coverage,
  })),[]);

  const freshnessData = useMemo(()=>lineageKeys.map(k=>{
    const f = LINEAGE_MAP[k].freshness;
    const d = f.includes('real-time') ? 0 : Math.floor((new Date('2026-03-29')-new Date(f.substring(0,10)))/(1000*60*60*24));
    return { name:k.split('.')[1], table:k.split('.')[0], daysOld:d, freshness:f };
  }),[]);

  const impactAnalysis = useMemo(()=>{
    if(!lineage) return [];
    return lineage.engines.map(eng=>({engine:eng,modules:lineage.modules,impact:lineage.coverage<80?'HIGH':'LOW'}));
  },[lineage]);

  return (
    <div>
      {/* Column Selector */}
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <span style={S.label}>TRACE COLUMN</span>
        <select style={{...S.input,flex:1,maxWidth:400}} value={selectedColumn} onChange={e=>setSelectedColumn(e.target.value)}>
          {lineageKeys.map(k=><option key={k} value={k}>{k}</option>)}
        </select>
        <span style={S.label}>DEPTH</span>
        <select style={{...S.input,maxWidth:120}} value={lineageDepth} onChange={e=>setLineageDepth(e.target.value)}>
          <option value="1">1 Hop</option>
          <option value="2">2 Hops</option>
          <option value="full">Full Chain</option>
        </select>
      </div>

      {lineage && (
        <>
          {/* Lineage Chain */}
          <div style={{...S.card,marginBottom:16}}>
            <div style={S.cardH}><span style={S.label}>DATA LINEAGE CHAIN</span></div>
            <div style={{padding:'24px 18px',display:'flex',alignItems:'center',flexWrap:'wrap',gap:8}}>
              {/* Source */}
              <div style={S.lineageNode('source')}>{lineage.source}</div>
              <span style={S.lineageArrow}>&#8594;</span>

              {/* Transform */}
              {(lineageDepth==='2'||lineageDepth==='full') && (
                <>
                  <div style={S.lineageNode('transform')}>{lineage.transform}</div>
                  <span style={S.lineageArrow}>&#8594;</span>
                </>
              )}

              {/* Column */}
              <div style={{...S.lineageNode('column'),borderColor:T.gold,background:T.gold+'20',color:T.gold}}>
                {selectedColumn}
              </div>

              {(lineageDepth==='full') && (
                <>
                  <span style={S.lineageArrow}>&#8594;</span>
                  {/* Engines */}
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {lineage.engines.map((eng,i)=>(
                      <div key={i} style={S.lineageNode('engine')}>{eng}</div>
                    ))}
                  </div>
                  <span style={S.lineageArrow}>&#8594;</span>
                  {/* Modules */}
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {lineage.modules.map((mod,i)=>(
                      <div key={i} style={S.lineageNode('module')}>{mod}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:16}}>
            <div style={S.statBox}>
              <div style={{...S.statVal,color:lineage.coverage>=90?T.green:lineage.coverage>=75?T.amber:T.red}}>{lineage.coverage}%</div>
              <div style={S.statLabel}>COVERAGE</div>
            </div>
            <div style={S.statBox}>
              <div style={{...S.statVal,fontSize:16}}>{lineage.freshness}</div>
              <div style={S.statLabel}>LAST UPDATED</div>
            </div>
            <div style={S.statBox}>
              <div style={S.statVal}>{lineage.engines.length}</div>
              <div style={S.statLabel}>ENGINES</div>
            </div>
            <div style={S.statBox}>
              <div style={S.statVal}>{lineage.modules.length}</div>
              <div style={S.statLabel}>MODULES</div>
            </div>
          </div>

          {/* Impact Analysis */}
          <div style={{...S.card,marginBottom:16}}>
            <div style={S.cardH}><span style={S.label}>IMPACT ANALYSIS: IF THIS COLUMN IS NULL</span></div>
            <div style={S.cardB}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  <th style={S.th}>ENGINE</th><th style={S.th}>AFFECTED MODULES</th><th style={S.th}>IMPACT</th>
                </tr></thead>
                <tbody>{impactAnalysis.map((ia,i)=>(
                  <tr key={i}>
                    <td style={{...S.td,fontWeight:600}}>{ia.engine}</td>
                    <td style={S.td}>{ia.modules.join(', ')}</td>
                    <td style={S.td}><span style={S.tag(ia.impact==='HIGH'?T.red:T.green)}>{ia.impact}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Coverage Chart */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={S.card}>
          <div style={S.cardH}><span style={S.label}>DATA COVERAGE BY COLUMN (%)</span></div>
          <div style={{padding:'12px 18px'}}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageData} layout="vertical" margin={{left:140}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fontFamily:T.mono,fill:T.textMut}} />
                <YAxis type="category" dataKey="name" tick={{fontSize:10,fontFamily:T.mono,fill:T.textSec}} width={130} />
                <Tooltip contentStyle={{fontFamily:T.mono,fontSize:12,borderRadius:6,border:`1px solid ${T.border}`}} />
                <Bar dataKey="coverage" fill={T.teal} radius={[0,4,4,0]}>
                  {coverageData.map((d,i)=>(
                    <Cell key={i} fill={d.coverage>=90?T.green:d.coverage>=75?T.amber:T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardH}><span style={S.label}>DATA FRESHNESS (DAYS SINCE UPDATE)</span></div>
          <div style={{padding:'12px 18px'}}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={freshnessData} layout="vertical" margin={{left:140}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{fontSize:11,fontFamily:T.mono,fill:T.textMut}} />
                <YAxis type="category" dataKey="name" tick={{fontSize:10,fontFamily:T.mono,fill:T.textSec}} width={130} />
                <Tooltip contentStyle={{fontFamily:T.mono,fontSize:12,borderRadius:6,border:`1px solid ${T.border}`}} formatter={(v)=>`${v} days ago`} />
                <Bar dataKey="daysOld" fill={T.gold} radius={[0,4,4,0]}>
                  {freshnessData.map((d,i)=>(
                    <Cell key={i} fill={d.daysOld<=7?T.green:d.daysOld<=14?T.amber:T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Lineage Table */}
      <div style={{...S.card,marginTop:16}}>
        <div style={S.cardH}><span style={S.label}>ALL TRACKED COLUMNS ({lineageKeys.length})</span></div>
        <div style={{...S.cardB,maxHeight:400,overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={S.th}>COLUMN</th><th style={S.th}>SOURCE</th><th style={S.th}>TRANSFORM</th><th style={S.th}>ENGINES</th><th style={S.th}>COVERAGE</th><th style={S.th}>FRESHNESS</th>
            </tr></thead>
            <tbody>{lineageKeys.map((k,i)=>{
              const l=LINEAGE_MAP[k];
              return (
                <tr key={i} style={{cursor:'pointer',background:k===selectedColumn?T.gold+'10':'transparent'}} onClick={()=>setSelectedColumn(k)}>
                  <td style={{...S.td,fontWeight:600,color:T.navyL}}>{k}</td>
                  <td style={{...S.td,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.source}</td>
                  <td style={{...S.td,fontSize:11,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.transform}</td>
                  <td style={S.td}>{l.engines.join(', ')}</td>
                  <td style={S.td}><span style={{...S.tag(l.coverage>=90?T.green:l.coverage>=75?T.amber:T.red)}}>{l.coverage}%</span></td>
                  <td style={{...S.td,fontSize:11}}>{l.freshness}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── TAB 4: Migration Tracker ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const MigrationTracker = () => {
  const [selectedMigration, setSelectedMigration] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredMigrations = useMemo(()=>{
    if(filterStatus==='all') return MIGRATIONS;
    return MIGRATIONS.filter(m=>m.status===filterStatus);
  },[filterStatus]);

  const appliedCount = MIGRATIONS.filter(m=>m.status==='applied').length;
  const pendingCount = MIGRATIONS.filter(m=>m.status==='pending').length;
  const totalTables = MIGRATIONS.reduce((a,m)=>a+m.tables.length,0);
  const totalCols = MIGRATIONS.reduce((a,m)=>a+m.cols,0);

  const migrationTimeline = useMemo(()=>{
    const months = {};
    MIGRATIONS.filter(m=>m.date).forEach(m=>{
      const mo = m.date.substring(0,7);
      if(!months[mo]) months[mo]={month:mo,count:0,tables:0};
      months[mo].count++;
      months[mo].tables+=m.tables.length;
    });
    return Object.values(months);
  },[]);

  const generateMigrationSQL = useCallback((mig) => {
    if(mig.tables.length===0) return mig.note || '-- No DDL changes (index/view modification only)';
    return mig.tables.map(t=>{
      const tableObj = ALL_TABLES.find(tb=>tb.name===t);
      if(!tableObj) return `CREATE TABLE ${t} (\n  -- Schema defined in migration ${mig.id}\n);`;
      return `CREATE TABLE ${t} (\n${tableObj.cols.map(c=>`  ${c.n} ${c.t.toUpperCase()}${c.pk?' PRIMARY KEY':''}${c.unique?' UNIQUE':''}${c.fk?` REFERENCES ${c.fk}`:''}${c.n!=='id'?' NOT NULL':''}`).join(',\n')}\n);\n\n${tableObj.indexes.map(idx=>`CREATE INDEX ${idx} ON ${t} (${idx.replace(/^ix_\w+_/,'')});`).join('\n')}`;
    }).join('\n\n');
  },[]);

  const generateRollbackSQL = useCallback((mig) => {
    if(mig.tables.length===0) return `-- Rollback migration ${mig.id}: ${mig.name}\n-- Reverse index/view changes`;
    return mig.tables.map(t=>`DROP TABLE IF EXISTS ${t} CASCADE;`).join('\n');
  },[]);

  return (
    <div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
        <div style={S.statBox}><div style={S.statVal}>{MIGRATIONS.length}</div><div style={S.statLabel}>MIGRATIONS</div></div>
        <div style={S.statBox}><div style={{...S.statVal,color:T.green}}>{appliedCount}</div><div style={S.statLabel}>APPLIED</div></div>
        <div style={S.statBox}><div style={{...S.statVal,color:T.amber}}>{pendingCount}</div><div style={S.statLabel}>PENDING</div></div>
        <div style={S.statBox}><div style={S.statVal}>{totalTables}</div><div style={S.statLabel}>TABLES CREATED</div></div>
        <div style={S.statBox}><div style={S.statVal}>{totalCols}</div><div style={S.statLabel}>COLUMNS ADDED</div></div>
        <div style={{...S.statBox,background:T.amber+'12'}}>
          <div style={{...S.statVal,fontSize:14,color:T.amber}}>~060</div>
          <div style={S.statLabel}>SUPABASE HEAD</div>
        </div>
      </div>

      {/* Alembic Head Banner */}
      <div style={{...S.card,marginBottom:16,background:T.navy+'08'}}>
        <div style={{padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <span style={{...S.mono,fontWeight:700,color:T.navy}}>Alembic Codebase Head:</span>
            <span style={{...S.mono,marginLeft:8,color:T.gold,fontWeight:700}}>067_add_e36_e39_tables</span>
          </div>
          <div style={{display:'flex',gap:12}}>
            <span style={{...S.badge,background:T.green+'18',color:T.green}}>60 applied to Supabase</span>
            <span style={{...S.badge,background:T.amber+'18',color:T.amber}}>7 pending (061-067)</span>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div style={{...S.card,marginBottom:16}}>
        <div style={S.cardH}><span style={S.label}>MIGRATION TIMELINE</span></div>
        <div style={{padding:'12px 18px'}}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={migrationTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{fontSize:10,fontFamily:T.mono,fill:T.textMut}} />
              <YAxis tick={{fontSize:11,fontFamily:T.mono,fill:T.textMut}} />
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:12,borderRadius:6,border:`1px solid ${T.border}`}} />
              <Bar dataKey="count" fill={T.navyL} radius={[4,4,0,0]} name="Migrations" />
              <Bar dataKey="tables" fill={T.gold} radius={[4,4,0,0]} name="Tables" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter + List */}
      <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center'}}>
        <span style={S.label}>FILTER</span>
        <button style={{...S.btnOutline,...(filterStatus==='all'?{background:T.navy,color:'#fff',borderColor:T.navy}:{})}} onClick={()=>setFilterStatus('all')}>All ({MIGRATIONS.length})</button>
        <button style={{...S.btnOutline,...(filterStatus==='applied'?{background:T.green,color:'#fff',borderColor:T.green}:{})}} onClick={()=>setFilterStatus('applied')}>Applied ({appliedCount})</button>
        <button style={{...S.btnOutline,...(filterStatus==='pending'?{background:T.amber,color:'#fff',borderColor:T.amber}:{})}} onClick={()=>setFilterStatus('pending')}>Pending ({pendingCount})</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Migration List */}
        <div style={{...S.card}}>
          <div style={S.cardH}><span style={S.label}>MIGRATIONS ({filteredMigrations.length})</span></div>
          <div style={{maxHeight:500,overflow:'auto'}}>
            {filteredMigrations.map((m,i)=>(
              <div key={m.id} style={{...S.migrationRow(m.status),cursor:'pointer',background:selectedMigration===m.id?(m.status==='pending'?T.amber+'15':T.gold+'10'):(m.status==='pending'?T.amber+'06':'transparent')}} onClick={()=>setSelectedMigration(m.id)}>
                <span style={{...S.mono,fontWeight:700,color:T.textMut}}>{m.id}</span>
                <div>
                  <div style={{...S.mono,fontWeight:600,color:T.navy,fontSize:12}}>{m.name}</div>
                  {m.tables.length>0 && <div style={{...S.monoSm,color:T.textMut,marginTop:2}}>+{m.tables.length} table{m.tables.length>1?'s':''}, {m.cols} cols</div>}
                  {m.note && <div style={{...S.monoSm,color:T.textMut,marginTop:2}}>{m.note}</div>}
                </div>
                <div style={{...S.monoSm,color:T.textMut}}>{m.date||'Not applied'}</div>
                <span style={S.tag(m.status==='applied'?T.green:T.amber)}>{m.status.toUpperCase()}</span>
                <span style={{...S.monoSm,color:T.textMut}}>{m.tables.join(', ').substring(0,30)||'---'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Detail */}
        <div>
          {selectedMigration ? (() => {
            const mig = MIGRATIONS.find(m=>m.id===selectedMigration);
            if(!mig) return null;
            return (
              <>
                <div style={S.card}>
                  <div style={S.cardH}>
                    <span style={{...S.mono,fontWeight:700,color:T.navy}}>Migration {mig.id}: {mig.name}</span>
                    <span style={S.tag(mig.status==='applied'?T.green:T.amber)}>{mig.status.toUpperCase()}</span>
                  </div>
                  <div style={S.cardB}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                      <div><span style={S.label}>APPLIED DATE</span><div style={{...S.mono,marginTop:4}}>{mig.date||'Pending'}</div></div>
                      <div><span style={S.label}>TABLES AFFECTED</span><div style={{...S.mono,marginTop:4}}>{mig.tables.length>0?mig.tables.join(', '):'None (index/view change)'}</div></div>
                      <div><span style={S.label}>COLUMNS ADDED</span><div style={{...S.mono,marginTop:4}}>{mig.cols}</div></div>
                      <div><span style={S.label}>DEPENDENCY</span><div style={{...S.mono,marginTop:4}}>
                        {parseInt(mig.id)>1?`${String(parseInt(mig.id)-1).padStart(3,'0')} &#8594; ${mig.id}`:'Initial migration'}
                      </div></div>
                    </div>
                  </div>
                </div>

                {/* SQL Preview */}
                <div style={{...S.card,marginTop:12}}>
                  <div style={S.cardH}><span style={S.label}>MIGRATION SQL</span></div>
                  <pre style={{padding:'14px 18px',fontFamily:T.mono,fontSize:11,lineHeight:1.5,margin:0,background:'#1e293b',color:'#e2e8f0',borderRadius:'0 0 8px 8px',overflow:'auto',maxHeight:250,whiteSpace:'pre-wrap'}}>
                    {generateMigrationSQL(mig)}
                  </pre>
                </div>

                {/* Rollback */}
                <div style={{...S.card,marginTop:12}}>
                  <div style={S.cardH}>
                    <span style={S.label}>ROLLBACK SQL</span>
                    <span style={{...S.tag(T.red),fontSize:10}}>DANGER</span>
                  </div>
                  <pre style={{padding:'14px 18px',fontFamily:T.mono,fontSize:11,lineHeight:1.5,margin:0,background:'#450a0a',color:'#fca5a5',borderRadius:'0 0 8px 8px',overflow:'auto',maxHeight:120,whiteSpace:'pre-wrap'}}>
                    {generateRollbackSQL(mig)}
                  </pre>
                </div>
              </>
            );
          })() : (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:T.textMut,...S.mono,height:200,border:`1px dashed ${T.border}`,borderRadius:8}}>
              Select a migration to view details
            </div>
          )}

          {/* Dependency Chain (mini) */}
          <div style={{...S.card,marginTop:16}}>
            <div style={S.cardH}><span style={S.label}>MIGRATION DEPENDENCY CHAIN</span></div>
            <div style={{padding:'14px 18px',display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
              {MIGRATIONS.slice(0,20).map((m,i)=>(
                <React.Fragment key={m.id}>
                  <span style={{...S.monoSm,padding:'2px 6px',borderRadius:3,background:m.status==='applied'?T.green+'15':T.amber+'15',color:m.status==='applied'?T.green:T.amber,fontWeight:selectedMigration===m.id?700:400,cursor:'pointer',border:selectedMigration===m.id?`1px solid ${T.gold}`:'1px solid transparent'}} onClick={()=>setSelectedMigration(m.id)}>
                    {m.id}
                  </span>
                  {i<19 && <span style={{color:T.textMut,fontSize:10}}>&#8594;</span>}
                </React.Fragment>
              ))}
              <span style={{...S.monoSm,color:T.textMut}}>... &#8594;</span>
              {MIGRATIONS.slice(-10).map((m,i)=>(
                <React.Fragment key={m.id}>
                  <span style={{...S.monoSm,padding:'2px 6px',borderRadius:3,background:m.status==='applied'?T.green+'15':T.amber+'15',color:m.status==='applied'?T.green:T.amber,fontWeight:selectedMigration===m.id?700:400,cursor:'pointer',border:selectedMigration===m.id?`1px solid ${T.gold}`:'1px solid transparent'}} onClick={()=>setSelectedMigration(m.id)}>
                    {m.id}
                  </span>
                  {i<9 && <span style={{color:T.textMut,fontSize:10}}>&#8594;</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Pending Migrations Detail */}
          <div style={{...S.card,marginTop:16}}>
            <div style={{...S.cardH,background:T.amber+'08'}}>
              <span style={{...S.label,color:T.amber}}>PENDING MIGRATIONS (NOT APPLIED TO SUPABASE)</span>
              <span style={{...S.badge,background:T.amber+'18',color:T.amber}}>061 - 067</span>
            </div>
            <div style={S.cardB}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  <th style={S.th}>ID</th><th style={S.th}>NAME</th><th style={S.th}>TABLES</th><th style={S.th}>COLUMNS</th><th style={S.th}>RISK</th><th style={S.th}>ESTIMATED TIME</th>
                </tr></thead>
                <tbody>{MIGRATIONS.filter(m=>m.status==='pending').map((m,i)=>(
                  <tr key={m.id} style={{background:i%2===0?'transparent':T.amber+'04'}}>
                    <td style={{...S.td,fontWeight:700,color:T.amber}}>{m.id}</td>
                    <td style={{...S.td,fontWeight:600}}>{m.name}</td>
                    <td style={S.td}>{m.tables.join(', ')||'---'}</td>
                    <td style={S.td}>{m.cols}</td>
                    <td style={S.td}><span style={S.tag(m.cols>15?T.amber:T.green)}>{m.cols>15?'MEDIUM':'LOW'}</span></td>
                    <td style={{...S.td,color:T.textMut}}>{Math.ceil(m.cols*0.3)+2}s est.</td>
                  </tr>
                ))}</tbody>
              </table>
              <div style={{marginTop:12,padding:'10px 14px',background:T.amber+'08',borderRadius:6,...S.monoSm,color:T.amber}}>
                Total pending: {pendingCount} migrations | {MIGRATIONS.filter(m=>m.status==='pending').reduce((a,m)=>a+m.tables.length,0)} new tables | {MIGRATIONS.filter(m=>m.status==='pending').reduce((a,m)=>a+m.cols,0)} columns to add
              </div>
            </div>
          </div>

          {/* Migration Health Summary */}
          <div style={{...S.card,marginTop:16}}>
            <div style={S.cardH}><span style={S.label}>MIGRATION HEALTH</span></div>
            <div style={{padding:'14px 18px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div style={{padding:12,borderRadius:6,background:T.green+'08',border:`1px solid ${T.green}20`}}>
                  <div style={{...S.monoSm,color:T.green,fontWeight:700}}>SCHEMA DRIFT</div>
                  <div style={{...S.mono,marginTop:6,color:T.text}}>7 migrations ahead of Supabase. Last sync: migration 060 (2026-02-22). No conflicts detected.</div>
                </div>
                <div style={{padding:12,borderRadius:6,background:T.teal+'08',border:`1px solid ${T.teal}20`}}>
                  <div style={{...S.monoSm,color:T.teal,fontWeight:700}}>INDEX COVERAGE</div>
                  <div style={{...S.mono,marginTop:6,color:T.text}}>All FK columns indexed. {ALL_TABLES.reduce((a,t)=>a+t.indexes.length,0)} indexes total. No missing coverage on high-cardinality columns.</div>
                </div>
                <div style={{padding:12,borderRadius:6,background:T.gold+'08',border:`1px solid ${T.gold}20`}}>
                  <div style={{...S.monoSm,color:T.gold,fontWeight:700}}>ROLLBACK READINESS</div>
                  <div style={{...S.mono,marginTop:6,color:T.text}}>All pending migrations have verified rollback SQL. No data-destructive operations in 061-067. Safe to apply in sequence.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:'browser', label:'Table Browser', icon:'\u25A6' },
  { id:'sql', label:'SQL Query Editor', icon:'\u25B7' },
  { id:'lineage', label:'Data Lineage View', icon:'\u2194' },
  { id:'migrations', label:'Migration Tracker', icon:'\u2630' },
];

export default function DbExplorerPage() {
  const [activeTab, setActiveTab] = useState('browser');

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerRow}>
          <div>
            <div style={S.title}>DB EXPLORER</div>
            <div style={S.subtitle}>
              DATABASE ADMIN {'&'} SQL QUERY CONSOLE | SUPABASE POSTGRESQL | ALEMBIC 067 HEAD | {ALL_TABLES.length} TABLES | {(TOTAL_ROWS/1000).toFixed(0)}K ROWS | {TOTAL_SIZE_MB.toFixed(0)} MB
            </div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <span style={{...S.badge,background:T.green+'18',color:T.green}}>CONNECTED</span>
            <span style={{...S.badge,background:T.navy+'12',color:T.navy}}>v067</span>
            <span style={{...S.monoSm,color:T.textMut}}>2026-03-29 UTC</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        {TABS.map(tab=>(
          <button key={tab.id} style={S.tab(activeTab===tab.id)} onClick={()=>setActiveTab(tab.id)}>
            <span style={{marginRight:6}}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={S.body}>
        {activeTab==='browser' && <TableBrowser />}
        {activeTab==='sql' && <SQLQueryEditor />}
        {activeTab==='lineage' && <DataLineageView />}
        {activeTab==='migrations' && <MigrationTracker />}
      </div>

      {/* Connection Info Panel */}
      {activeTab==='browser' && (
        <div style={{margin:'0 32px 16px',padding:'12px 18px',background:T.navy+'06',borderRadius:8,border:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:24}}>
            <div><span style={{...S.monoSm,color:T.textMut}}>HOST</span><div style={{...S.mono,marginTop:2}}>db.supabase.co</div></div>
            <div><span style={{...S.monoSm,color:T.textMut}}>PORT</span><div style={{...S.mono,marginTop:2}}>5432</div></div>
            <div><span style={{...S.monoSm,color:T.textMut}}>DATABASE</span><div style={{...S.mono,marginTop:2}}>postgres</div></div>
            <div><span style={{...S.monoSm,color:T.textMut}}>SSL</span><div style={{...S.mono,marginTop:2,color:T.green}}>Enabled (verify-full)</div></div>
            <div><span style={{...S.monoSm,color:T.textMut}}>POOL</span><div style={{...S.mono,marginTop:2}}>pgBouncer (transaction mode)</div></div>
          </div>
          <div style={{display:'flex',gap:12}}>
            <span style={{...S.badge,background:T.green+'18',color:T.green}}>LATENCY 12ms</span>
            <span style={{...S.badge,background:T.navy+'12',color:T.navy}}>POSTGRESQL 15.4</span>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <div style={{position:'sticky',bottom:0,background:T.navy,padding:'6px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`2px solid ${T.gold}`}}>
        <div style={{display:'flex',gap:20,...S.monoSm,color:T.goldL}}>
          <span>SUPABASE | us-east-1</span>
          <span>POSTGRESQL 15.4</span>
          <span>ALEMBIC {MIGRATIONS.length} migrations</span>
        </div>
        <div style={{display:'flex',gap:20,...S.monoSm,color:'#94a3b8'}}>
          <span>APPLIED: {MIGRATIONS.filter(m=>m.status==='applied').length}/67</span>
          <span>PENDING: {MIGRATIONS.filter(m=>m.status==='pending').length}</span>
          <span>TABLES: {ALL_TABLES.length}</span>
          <span>ROWS: {(TOTAL_ROWS/1000).toFixed(0)}K</span>
        </div>
      </div>
    </div>
  );
}
