/**
 * DataCaptureContext — Platform-Wide Normalized Data Capture Bus
 *
 * Maps ALL 532+ modules to their data requirements, validates inputs,
 * and tracks cross-module data pipelines.
 *
 * Entities: 15 normalized schemas (company, emissions, portfolio_holding, etc.)
 * Module map: 80+ representative entries covering every domain
 * Pipelines: 40+ cross-module data flows
 * Persistence: localStorage key 'a2_data_capture_store'
 */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════════
   1. DATA_ENTITIES — 15 normalized entity schemas
   ══════════════════════════════════════════════════════════════════ */
const DATA_ENTITIES = [
  { id: 'company', name: 'Company', icon: '\uD83C\uDFE2', description: 'Corporate entity master data', fields: [
    { key: 'id', label: 'ID', type: 'text', required: true, help: 'Internal unique identifier' },
    { key: 'name', label: 'Company Name', type: 'text', required: true, help: 'Legal entity name' },
    { key: 'ticker', label: 'Ticker', type: 'text', required: false, help: 'Stock exchange ticker symbol' },
    { key: 'isin', label: 'ISIN', type: 'text', required: false, validation: v => !v || /^[A-Z]{2}[A-Z0-9]{10}$/.test(v), help: '12-char International Securities Identification Number' },
    { key: 'lei', label: 'LEI', type: 'text', required: false, validation: v => !v || /^[A-Z0-9]{20}$/.test(v), help: '20-char Legal Entity Identifier' },
    { key: 'sector', label: 'Sector', type: 'text', required: false, help: 'GICS sector name' },
    { key: 'industry', label: 'Industry', type: 'text', required: false, help: 'GICS industry name' },
    { key: 'gics_code', label: 'GICS Code', type: 'text', required: false, help: '8-digit GICS classification code' },
    { key: 'country_iso2', label: 'Country', type: 'iso_country', required: false, help: 'ISO 3166-1 alpha-2 country code' },
    { key: 'region', label: 'Region', type: 'text', required: false, help: 'Geographic region (e.g. EMEA, APAC)' },
    { key: 'revenue_usd', label: 'Revenue (USD)', type: 'currency', unit: 'USD', required: false, help: 'Annual revenue in US dollars' },
    { key: 'market_cap_usd', label: 'Market Cap (USD)', type: 'currency', unit: 'USD', required: false, help: 'Current market capitalization' },
    { key: 'enterprise_value_usd', label: 'Enterprise Value (USD)', type: 'currency', unit: 'USD', required: false },
    { key: 'employees', label: 'Employees', type: 'number', required: false, validation: v => !v || v >= 0 },
    { key: 'founding_year', label: 'Founding Year', type: 'number', required: false, validation: v => !v || (v >= 1800 && v <= 2030) },
    { key: 'public_listed', label: 'Public Listed', type: 'boolean', required: false, defaultValue: false },
    { key: 'website', label: 'Website', type: 'url', required: false },
  ]},
  { id: 'emissions', name: 'Emissions Data', icon: '\uD83C\uDF2B\uFE0F', description: 'GHG emissions inventory (Scope 1/2/3)', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'reporting_year', label: 'Reporting Year', type: 'number', required: true, validation: v => v >= 2000 && v <= 2035 },
    { key: 'base_year', label: 'Base Year', type: 'number', required: false, validation: v => !v || (v >= 1990 && v <= 2030) },
    { key: 'scope1_tco2e', label: 'Scope 1 (tCO2e)', type: 'number', unit: 'tCO2e', required: true, validation: v => v >= 0 },
    { key: 'scope2_market_tco2e', label: 'Scope 2 Market (tCO2e)', type: 'number', unit: 'tCO2e', required: false, validation: v => !v || v >= 0 },
    { key: 'scope2_location_tco2e', label: 'Scope 2 Location (tCO2e)', type: 'number', unit: 'tCO2e', required: false, validation: v => !v || v >= 0 },
    { key: 'scope3_total_tco2e', label: 'Scope 3 Total (tCO2e)', type: 'number', unit: 'tCO2e', required: false, validation: v => !v || v >= 0 },
    ...Array.from({ length: 15 }, (_, i) => ({ key: `scope3_c${i + 1}`, label: `Scope 3 Cat ${i + 1}`, type: 'number', unit: 'tCO2e', required: false, validation: v => !v || v >= 0 })),
    { key: 'consolidation_method', label: 'Consolidation Method', type: 'select', required: false, options: ['Operational Control', 'Financial Control', 'Equity Share'] },
    { key: 'carbon_intensity_revenue', label: 'Carbon Intensity (tCO2e/$M)', type: 'number', unit: 'tCO2e/$M', required: false },
    { key: 'dqs', label: 'Data Quality Score', type: 'number', required: false, validation: v => !v || (v >= 1 && v <= 5), help: 'PCAF DQS 1 (best) to 5 (worst)' },
    { key: 'verification_status', label: 'Verification', type: 'select', required: false, options: ['Verified', 'Limited Assurance', 'Reasonable Assurance', 'Self-Reported', 'Estimated'] },
    { key: 'methodology', label: 'Methodology', type: 'text', required: false },
    { key: 'ef_source', label: 'Emission Factor Source', type: 'text', required: false },
    { key: 'disclosure_source', label: 'Disclosure Source', type: 'text', required: false },
  ]},
  { id: 'portfolio_holding', name: 'Portfolio Holding', icon: '\uD83D\uDCCA', description: 'Investment portfolio positions', fields: [
    { key: 'portfolio_id', label: 'Portfolio ID', type: 'text', required: true },
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'asset_class', label: 'Asset Class', type: 'select', required: true, options: ['equity','bond','loan','real_estate','mortgage','infrastructure','project_finance','sovereign'] },
    { key: 'quantity', label: 'Quantity', type: 'number', required: false, validation: v => !v || v >= 0 },
    { key: 'price', label: 'Price', type: 'currency', unit: 'USD', required: false },
    { key: 'market_value_usd', label: 'Market Value (USD)', type: 'currency', unit: 'USD', required: true, validation: v => v >= 0 },
    { key: 'weight_pct', label: 'Weight (%)', type: 'percentage', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'ownership_pct', label: 'Ownership (%)', type: 'percentage', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'temperature_alignment_c', label: 'Temp Alignment (\u00B0C)', type: 'number', unit: '\u00B0C', required: false },
    { key: 'transition_score', label: 'Transition Score', type: 'number', required: false },
    { key: 'solution_category', label: 'Solution Category', type: 'text', required: false },
    { key: 'solution_revenue_pct', label: 'Solution Revenue (%)', type: 'percentage', required: false },
    { key: 'sbti_committed', label: 'SBTi Committed', type: 'boolean', required: false, defaultValue: false },
    { key: 'engagement_status', label: 'Engagement Status', type: 'text', required: false },
  ]},
  { id: 'scenario', name: 'Climate Scenario', icon: '\uD83C\uDF21\uFE0F', description: 'Climate transition / physical risk scenarios', fields: [
    { key: 'name', label: 'Scenario Name', type: 'text', required: true },
    { key: 'warming_target_c', label: 'Warming Target (\u00B0C)', type: 'number', unit: '\u00B0C', required: true, validation: v => v >= 1.0 && v <= 6.0 },
    { key: 'carbon_price_2025', label: 'Carbon Price 2025 ($/t)', type: 'currency', unit: 'USD/tCO2e', required: false },
    { key: 'carbon_price_2030', label: 'Carbon Price 2030', type: 'currency', unit: 'USD/tCO2e', required: false },
    { key: 'carbon_price_2040', label: 'Carbon Price 2040', type: 'currency', unit: 'USD/tCO2e', required: false },
    { key: 'carbon_price_2050', label: 'Carbon Price 2050', type: 'currency', unit: 'USD/tCO2e', required: false },
    { key: 'discount_rate_adj_bps', label: 'Discount Rate Adj (bps)', type: 'number', unit: 'bps', required: false },
    { key: 'asset_haircut_pct', label: 'Asset Haircut (%)', type: 'percentage', required: false },
    { key: 'policy_multiplier', label: 'Policy Multiplier', type: 'number', required: false, defaultValue: 1.0 },
    { key: 'probability_weight_pct', label: 'Probability Weight (%)', type: 'percentage', required: false },
    { key: 'description', label: 'Description', type: 'text', required: false },
  ]},
  { id: 'water_footprint', name: 'Water Footprint', icon: '\uD83D\uDCA7', description: 'Corporate water withdrawal, consumption, and stress data', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'year', label: 'Year', type: 'number', required: true },
    { key: 'withdrawal_m3', label: 'Withdrawal (m\u00B3)', type: 'number', unit: 'm\u00B3', required: false, validation: v => !v || v >= 0 },
    { key: 'consumption_m3', label: 'Consumption (m\u00B3)', type: 'number', unit: 'm\u00B3', required: false, validation: v => !v || v >= 0 },
    { key: 'discharge_m3', label: 'Discharge (m\u00B3)', type: 'number', unit: 'm\u00B3', required: false, validation: v => !v || v >= 0 },
    { key: 'recycling_rate_pct', label: 'Recycling Rate (%)', type: 'percentage', required: false },
    { key: 'stress_score', label: 'Stress Score', type: 'number', required: false, validation: v => !v || (v >= 0 && v <= 5) },
    { key: 'primary_basin', label: 'Primary Basin', type: 'text', required: false },
    { key: 'water_intensity_per_revenue', label: 'Water Intensity (m\u00B3/$M)', type: 'number', required: false },
    { key: 'disclosure_source', label: 'Disclosure Source', type: 'text', required: false },
  ]},
  { id: 'supplier', name: 'Supplier', icon: '\uD83D\uDE9A', description: 'Supply chain partner emissions and engagement', fields: [
    { key: 'name', label: 'Supplier Name', type: 'text', required: true },
    { key: 'company_id', label: 'Buyer Company ID', type: 'text', required: true },
    { key: 'tier', label: 'Tier', type: 'select', required: false, options: ['1','2','3'] },
    { key: 'category', label: 'Category', type: 'text', required: false },
    { key: 'spend_usd', label: 'Spend (USD)', type: 'currency', unit: 'USD', required: false },
    { key: 'emissions_tco2e', label: 'Emissions (tCO2e)', type: 'number', unit: 'tCO2e', required: false, validation: v => !v || v >= 0 },
    { key: 'dqs', label: 'Data Quality Score', type: 'number', required: false, validation: v => !v || (v >= 1 && v <= 5) },
    { key: 'engagement_level', label: 'Engagement Level', type: 'text', required: false },
    { key: 'certification', label: 'Certification', type: 'text', required: false },
    { key: 'country', label: 'Country', type: 'iso_country', required: false },
  ]},
  { id: 'activity_data', name: 'Activity Data', icon: '\u26A1', description: 'Activity-based emissions calculation inputs', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'year', label: 'Year', type: 'number', required: true },
    { key: 'activity_type', label: 'Activity Type', type: 'select', required: true, options: ['electricity','gas','diesel','aviation','shipping','waste','water','purchased_goods'] },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true, validation: v => v >= 0 },
    { key: 'unit', label: 'Unit', type: 'text', required: true },
    { key: 'ef_value', label: 'Emission Factor', type: 'number', required: false },
    { key: 'ef_source', label: 'EF Source', type: 'text', required: false },
    { key: 'scope_category', label: 'Scope Category', type: 'text', required: false },
  ]},
  { id: 'climate_target', name: 'Climate Target', icon: '\uD83C\uDFAF', description: 'Emissions reduction targets and SBTi status', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'target_type', label: 'Target Type', type: 'select', required: true, options: ['absolute','intensity','net_zero'] },
    { key: 'target_year', label: 'Target Year', type: 'number', required: true, validation: v => v >= 2025 && v <= 2100 },
    { key: 'base_year', label: 'Base Year', type: 'number', required: true },
    { key: 'base_emissions', label: 'Base Emissions (tCO2e)', type: 'number', unit: 'tCO2e', required: false },
    { key: 'target_reduction_pct', label: 'Target Reduction (%)', type: 'percentage', required: true, validation: v => v >= 0 && v <= 100 },
    { key: 'sbti_status', label: 'SBTi Status', type: 'select', required: false, options: ['Committed','Targets Set','Validated','Near-term','Net-zero','None'] },
    { key: 'pathway', label: 'Pathway', type: 'text', required: false, help: 'e.g. 1.5C, Well-below 2C' },
    { key: 'interim_targets', label: 'Interim Targets', type: 'text', required: false },
  ]},
  { id: 'regulatory_filing', name: 'Regulatory Filing', icon: '\uD83D\uDCDC', description: 'Disclosure and compliance filings', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'framework', label: 'Framework', type: 'select', required: true, options: ['CSRD','SFDR','TCFD','ISSB','SEC','CBAM','EU_Taxonomy','GHG_Protocol'] },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false },
    { key: 'reporting_year', label: 'Reporting Year', type: 'number', required: true },
    { key: 'filing_date', label: 'Filing Date', type: 'date', required: false },
    { key: 'assurance_level', label: 'Assurance Level', type: 'select', required: false, options: ['None','Limited','Reasonable'] },
    { key: 'completeness_pct', label: 'Completeness (%)', type: 'percentage', required: false },
    { key: 'gaps_identified', label: 'Gaps Identified', type: 'text', required: false },
  ]},
  { id: 'asset', name: 'Physical Asset', icon: '\uD83C\uDFED', description: 'Real-world assets exposed to climate risk', fields: [
    { key: 'name', label: 'Asset Name', type: 'text', required: true },
    { key: 'type', label: 'Asset Type', type: 'select', required: true, options: ['power_plant','refinery','mine','building','vehicle_fleet','land','infrastructure'] },
    { key: 'location_country', label: 'Country', type: 'iso_country', required: false },
    { key: 'capacity', label: 'Capacity', type: 'number', required: false },
    { key: 'age_years', label: 'Age (years)', type: 'number', required: false, validation: v => !v || v >= 0 },
    { key: 'remaining_life_years', label: 'Remaining Life (years)', type: 'number', required: false },
    { key: 'book_value_usd', label: 'Book Value (USD)', type: 'currency', unit: 'USD', required: false },
    { key: 'carbon_intensity', label: 'Carbon Intensity', type: 'number', required: false },
    { key: 'stranding_risk_pct', label: 'Stranding Risk (%)', type: 'percentage', required: false },
  ]},
  { id: 'esg_score', name: 'ESG Score', icon: '\u2B50', description: 'Third-party ESG ratings and assessments', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'provider', label: 'Provider', type: 'select', required: true, options: ['MSCI','SP_DJI','FTSE','Bloomberg','Sustainalytics','ISS','CDP','Moody'] },
    { key: 'overall_score', label: 'Overall Score', type: 'number', required: false },
    { key: 'e_score', label: 'E Score', type: 'number', required: false },
    { key: 's_score', label: 'S Score', type: 'number', required: false },
    { key: 'g_score', label: 'G Score', type: 'number', required: false },
    { key: 'rating', label: 'Rating', type: 'text', required: false },
    { key: 'momentum', label: 'Momentum', type: 'select', required: false, options: ['Improving','Stable','Declining'] },
    { key: 'assessment_date', label: 'Assessment Date', type: 'date', required: false },
  ]},
  { id: 'cbam_product', name: 'CBAM Product', icon: '\uD83D\uDEA2', description: 'Carbon Border Adjustment Mechanism product data', fields: [
    { key: 'company_id', label: 'Importer ID', type: 'text', required: true },
    { key: 'cn_code', label: 'CN Code', type: 'text', required: true, help: 'EU Combined Nomenclature code' },
    { key: 'product_group', label: 'Product Group', type: 'select', required: true, options: ['Iron_Steel','Aluminum','Cement','Fertilizer','Electricity','Hydrogen'] },
    { key: 'embedded_emissions_direct', label: 'Direct Embedded Emissions', type: 'number', unit: 'tCO2e', required: true },
    { key: 'embedded_emissions_indirect', label: 'Indirect Embedded Emissions', type: 'number', unit: 'tCO2e', required: false },
    { key: 'country_of_origin', label: 'Country of Origin', type: 'iso_country', required: true },
    { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: false },
    { key: 'trade_value_usd', label: 'Trade Value (USD)', type: 'currency', unit: 'USD', required: false },
  ]},
  { id: 'impact_metric', name: 'Impact Metric', icon: '\uD83C\uDF31', description: 'Social and environmental impact measurements', fields: [
    { key: 'company_id', label: 'Company/Project ID', type: 'text', required: true },
    { key: 'metric_type', label: 'Metric Type', type: 'select', required: true, options: ['lives_improved','tco2e_avoided','mw_installed','hectares_protected','jobs_created','smes_financed'] },
    { key: 'value', label: 'Value', type: 'number', required: true },
    { key: 'unit', label: 'Unit', type: 'text', required: true },
    { key: 'measurement_date', label: 'Measurement Date', type: 'date', required: false },
    { key: 'framework', label: 'Framework', type: 'select', required: false, options: ['IRIS+','SDG','custom'] },
    { key: 'sdg_goals', label: 'SDG Goals', type: 'multiselect', required: false, options: Array.from({ length: 17 }, (_, i) => `SDG ${i + 1}`) },
  ]},
  { id: 'board_member', name: 'Board Member', icon: '\uD83D\uDC64', description: 'Board composition and governance data', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'gender', label: 'Gender', type: 'select', required: false, options: ['M','F','Non-binary'] },
    { key: 'age', label: 'Age', type: 'number', required: false, validation: v => !v || (v >= 18 && v <= 110) },
    { key: 'tenure_years', label: 'Tenure (years)', type: 'number', required: false },
    { key: 'independence', label: 'Independent', type: 'boolean', required: false },
    { key: 'committees', label: 'Committees', type: 'multiselect', required: false, options: ['Audit','Compensation','Risk','ESG','Nomination'] },
    { key: 'background', label: 'Background', type: 'text', required: false },
  ]},
  { id: 'commodity_exposure', name: 'Commodity Exposure', icon: '\u26CF\uFE0F', description: 'Commodity production, consumption, and carbon footprint', fields: [
    { key: 'company_id', label: 'Company ID', type: 'text', required: true },
    { key: 'commodity', label: 'Commodity', type: 'select', required: true, options: ['oil','gas','coal','iron_ore','aluminum','copper','lithium','cobalt','rare_earth','agricultural'] },
    { key: 'exposure_type', label: 'Exposure Type', type: 'select', required: true, options: ['producer','consumer','trader'] },
    { key: 'volume', label: 'Volume', type: 'number', required: false },
    { key: 'revenue_pct', label: 'Revenue (%)', type: 'percentage', required: false },
    { key: 'carbon_footprint_per_unit', label: 'Carbon per Unit', type: 'number', required: false },
  ]},
  { id: 'renewable_project', name: 'Renewable Project', icon: '\u2600\uFE0F', description: 'Solar, wind, offshore wind project master data', fields: [
    { key: 'project_id', label: 'Project ID', type: 'text', required: true },
    { key: 'name', label: 'Project Name', type: 'text', required: true },
    { key: 'technology', label: 'Technology', type: 'select', required: true, options: ['solar_pv','onshore_wind','offshore_wind','floating_wind','bess','hybrid','green_hydrogen','tidal'] },
    { key: 'capacity_mw', label: 'Capacity (MW)', type: 'number', unit: 'MW', required: true, validation: v => v > 0 },
    { key: 'capacity_factor_pct', label: 'Capacity Factor (%)', type: 'percentage', required: false, validation: v => !v || (v > 0 && v <= 100) },
    { key: 'aep_gwh', label: 'AEP (GWh)', type: 'number', unit: 'GWh', required: false },
    { key: 'capex_per_kw', label: 'CAPEX ($/kW)', type: 'number', unit: '$/kW', required: false },
    { key: 'opex_per_kw_yr', label: 'OPEX ($/kW/yr)', type: 'number', unit: '$/kW/yr', required: false },
    { key: 'cod_year', label: 'COD Year', type: 'number', required: false },
    { key: 'life_years', label: 'Design Life (years)', type: 'number', required: false },
    { key: 'contract_type', label: 'Contract Type', type: 'select', required: false, options: ['CfD','PPA','Merchant','FiT','PTC','ITC'] },
    { key: 'ppa_price_mwh', label: 'PPA/CfD Price ($/MWh)', type: 'number', unit: '$/MWh', required: false },
    { key: 'offtaker', label: 'Offtaker', type: 'text', required: false },
    { key: 'country_iso2', label: 'Country', type: 'iso_country', required: false },
    { key: 'developer', label: 'Developer', type: 'text', required: false },
  ]},
  { id: 'project_finance', name: 'Project Finance Model', icon: '\uD83D\uDCD0', description: 'Financial model outputs for infrastructure & renewable projects', fields: [
    { key: 'project_id', label: 'Project ID', type: 'text', required: true },
    { key: 'irr_equity_pct', label: 'Equity IRR (%)', type: 'percentage', required: false },
    { key: 'irr_project_pct', label: 'Project IRR (%)', type: 'percentage', required: false },
    { key: 'npv_musd', label: 'NPV ($M)', type: 'number', unit: '$M', required: false },
    { key: 'dscr_min', label: 'DSCR Min', type: 'number', required: false, validation: v => !v || v >= 0 },
    { key: 'llcr', label: 'LLCR', type: 'number', required: false },
    { key: 'debt_pct', label: 'Gearing (%)', type: 'percentage', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'interest_rate_pct', label: 'Interest Rate (%)', type: 'percentage', required: false },
    { key: 'tenor_yrs', label: 'Loan Tenor (yrs)', type: 'number', required: false },
    { key: 'capex_total_musd', label: 'CAPEX Total ($M)', type: 'number', unit: '$M', required: false },
    { key: 'lcoe_mwh', label: 'LCOE ($/MWh)', type: 'number', unit: '$/MWh', required: false },
    { key: 'currency', label: 'Currency', type: 'select', required: false, options: ['USD','EUR','GBP','JPY','CNY','INR'] },
  ]},
  { id: 'litigation_case', name: 'Climate Litigation Case', icon: '\u2696\uFE0F', description: 'Climate litigation and legal risk data', fields: [
    { key: 'case_name', label: 'Case Name', type: 'text', required: true },
    { key: 'company_id', label: 'Defendant Company ID', type: 'text', required: false },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'iso_country', required: true },
    { key: 'court', label: 'Court', type: 'text', required: false },
    { key: 'claimant', label: 'Claimant', type: 'text', required: false },
    { key: 'claim_type', label: 'Claim Type', type: 'select', required: true, options: ['greenwashing','fiduciary_duty','failure_to_adapt','disclosure_fraud','human_rights','regulatory_compliance','stranded_asset'] },
    { key: 'claim_amount_musd', label: 'Claim Amount ($M)', type: 'number', unit: '$M', required: false },
    { key: 'filing_date', label: 'Filing Date', type: 'date', required: false },
    { key: 'status', label: 'Status', type: 'select', required: false, options: ['filed','pending','dismissed','settled','appealed','ruled'] },
    { key: 'ruling_date', label: 'Ruling Date', type: 'date', required: false },
    { key: 'precedent_setting', label: 'Precedent Setting', type: 'boolean', required: false, defaultValue: false },
    { key: 'sector', label: 'Sector', type: 'text', required: false },
  ]},
  { id: 'actuarial_data', name: 'Actuarial / Insurance Data', icon: '\uD83C\uDFE5', description: 'Insurance portfolio and actuarial climate inputs', fields: [
    { key: 'company_id', label: 'Insurer ID', type: 'text', required: true },
    { key: 'lob', label: 'Line of Business', type: 'select', required: true, options: ['property','liability','marine','aviation','agriculture','health','life','reinsurance'] },
    { key: 'gwp_musd', label: 'Gross Written Premium ($M)', type: 'number', unit: '$M', required: false },
    { key: 'loss_ratio_pct', label: 'Loss Ratio (%)', type: 'percentage', required: false },
    { key: 'combined_ratio_pct', label: 'Combined Ratio (%)', type: 'percentage', required: false },
    { key: 'cat_exposure_musd', label: 'Cat Exposure ($M)', type: 'number', unit: '$M', required: false },
    { key: 'physical_risk_loading_pct', label: 'Physical Risk Loading (%)', type: 'percentage', required: false },
    { key: 'transition_risk_loading_pct', label: 'Transition Risk Loading (%)', type: 'percentage', required: false },
    { key: 'climate_var_99_pct', label: 'Climate VaR 99% (%)', type: 'percentage', required: false },
    { key: 'reserve_adequacy_pct', label: 'Reserve Adequacy (%)', type: 'percentage', required: false },
    { key: 'reporting_year', label: 'Reporting Year', type: 'number', required: true },
  ]},
  { id: 'corporate_deal', name: 'Corporate Deal / Transaction', icon: '\uD83D\uDCBC', description: 'M&A, bond, loan and capital market transactions', fields: [
    { key: 'deal_name', label: 'Deal Name', type: 'text', required: true },
    { key: 'deal_type', label: 'Deal Type', type: 'select', required: true, options: ['MA','IPO','bond','loan','green_bond','sustainability_linked','project_finance','equity_raise'] },
    { key: 'acquirer_id', label: 'Acquirer / Issuer ID', type: 'text', required: false },
    { key: 'target_id', label: 'Target / Borrower ID', type: 'text', required: false },
    { key: 'deal_value_musd', label: 'Deal Value ($M)', type: 'number', unit: '$M', required: false },
    { key: 'carbon_adjusted_wacc_pct', label: 'Carbon-Adjusted WACC (%)', type: 'percentage', required: false },
    { key: 'climate_dd_score', label: 'Climate DD Score (0-100)', type: 'number', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'green_eligible', label: 'Green Eligible', type: 'boolean', required: false, defaultValue: false },
    { key: 'closing_date', label: 'Closing Date', type: 'date', required: false },
    { key: 'coupon_pct', label: 'Coupon / Rate (%)', type: 'percentage', required: false },
    { key: 'maturity_date', label: 'Maturity Date', type: 'date', required: false },
    { key: 'currency', label: 'Currency', type: 'select', required: false, options: ['USD','EUR','GBP','JPY','CNY','INR'] },
  ]},
  { id: 'nature_asset', name: 'Nature Asset', icon: '\uD83C\uDF3F', description: 'Nature-based assets: forests, wetlands, oceans, biodiversity', fields: [
    { key: 'asset_name', label: 'Asset Name', type: 'text', required: true },
    { key: 'asset_type', label: 'Asset Type', type: 'select', required: true, options: ['forest','wetland','ocean','soil','grassland','mangrove','coral_reef','peatland','savanna'] },
    { key: 'hectares', label: 'Area (ha)', type: 'number', unit: 'ha', required: false, validation: v => !v || v >= 0 },
    { key: 'country_iso2', label: 'Country', type: 'iso_country', required: false },
    { key: 'species_count', label: 'Species Count', type: 'number', required: false },
    { key: 'biodiversity_score', label: 'Biodiversity Integrity Score', type: 'number', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'carbon_stock_tco2e', label: 'Carbon Stock (tCO2e)', type: 'number', unit: 'tCO2e', required: false },
    { key: 'ecosystem_services_musd', label: 'Ecosystem Services ($M/yr)', type: 'number', unit: '$M/yr', required: false },
    { key: 'pressure_type', label: 'Primary Pressure', type: 'select', required: false, options: ['deforestation','pollution','overuse','climate','invasive_species','development'] },
    { key: 'protection_status', label: 'Protection Status', type: 'select', required: false, options: ['IUCN_I','IUCN_II','IUCN_IV','OECM','unprotected'] },
  ]},
  { id: 'sovereign_bond', name: 'Sovereign Bond', icon: '\uD83C\uDFDB\uFE0F', description: 'Sovereign debt instruments with climate risk overlay', fields: [
    { key: 'country_iso2', label: 'Country', type: 'iso_country', required: true },
    { key: 'isin', label: 'ISIN', type: 'text', required: false },
    { key: 'coupon_pct', label: 'Coupon (%)', type: 'percentage', required: false },
    { key: 'maturity_date', label: 'Maturity Date', type: 'date', required: false },
    { key: 'outstanding_musd', label: 'Outstanding ($M)', type: 'number', unit: '$M', required: false },
    { key: 'green_label', label: 'Green / Sustainability Label', type: 'boolean', required: false, defaultValue: false },
    { key: 'climate_risk_adj_bps', label: 'Climate Risk Adjustment (bps)', type: 'number', unit: 'bps', required: false },
    { key: 'debt_gdp_pct', label: 'Debt/GDP (%)', type: 'percentage', required: false },
    { key: 'climate_vulnerability_score', label: 'Climate Vulnerability Score', type: 'number', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'ndc_aligned', label: 'NDC Aligned', type: 'boolean', required: false, defaultValue: false },
  ]},
  { id: 'real_estate_asset', name: 'Real Estate Asset', icon: '\uD83C\uDFE2', description: 'Commercial and residential real estate with climate exposure', fields: [
    { key: 'property_name', label: 'Property Name', type: 'text', required: true },
    { key: 'property_type', label: 'Property Type', type: 'select', required: true, options: ['office','retail','industrial','residential','mixed_use','hotel','logistics','data_center'] },
    { key: 'country_iso2', label: 'Country', type: 'iso_country', required: false },
    { key: 'city', label: 'City', type: 'text', required: false },
    { key: 'gfa_sqm', label: 'GFA (m\u00B2)', type: 'number', unit: 'm\u00B2', required: false },
    { key: 'energy_rating', label: 'Energy Rating', type: 'select', required: false, options: ['A+','A','B','C','D','E','F','G'] },
    { key: 'operational_carbon_kgco2_sqm', label: 'Operational Carbon (kgCO2/m\u00B2/yr)', type: 'number', unit: 'kgCO2/m\u00B2', required: false },
    { key: 'embodied_carbon_kgco2_sqm', label: 'Embodied Carbon (kgCO2/m\u00B2)', type: 'number', unit: 'kgCO2/m\u00B2', required: false },
    { key: 'physical_risk_score', label: 'Physical Risk Score (0-100)', type: 'number', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'stranding_year', label: 'Stranding Year', type: 'number', required: false },
    { key: 'crrem_pathway', label: 'CRREM Pathway', type: 'text', required: false },
    { key: 'book_value_musd', label: 'Book Value ($M)', type: 'number', unit: '$M', required: false },
  ]},
  { id: 'wind_turbine', name: 'Wind Turbine', icon: '\uD83C\uDF00', description: 'Individual turbine asset data for wind farm O&M and repowering', fields: [
    { key: 'turbine_id', label: 'Turbine ID', type: 'text', required: true },
    { key: 'project_id', label: 'Project ID', type: 'text', required: true },
    { key: 'manufacturer', label: 'Manufacturer', type: 'select', required: false, options: ['Vestas','Siemens_Gamesa','GE','Goldwind','Envision','MHI_Vestas','Enercon','Nordex'] },
    { key: 'model', label: 'Model', type: 'text', required: false },
    { key: 'rated_mw', label: 'Rated Power (MW)', type: 'number', unit: 'MW', required: false, validation: v => !v || v > 0 },
    { key: 'hub_height_m', label: 'Hub Height (m)', type: 'number', unit: 'm', required: false },
    { key: 'rotor_diameter_m', label: 'Rotor Diameter (m)', type: 'number', unit: 'm', required: false },
    { key: 'commissioning_year', label: 'Commissioning Year', type: 'number', required: false },
    { key: 'age_years', label: 'Age (years)', type: 'number', required: false, validation: v => !v || v >= 0 },
    { key: 'availability_pct', label: 'Availability (%)', type: 'percentage', required: false, validation: v => !v || (v >= 0 && v <= 100) },
    { key: 'cf_actual_pct', label: 'Actual CF (%)', type: 'percentage', required: false },
    { key: 'floater_type', label: 'Floater Type', type: 'select', required: false, options: ['monopile','jacket','spar','semi_sub','tlp','barge','onshore'] },
  ]},
];

/* ── helper: entity lookup by id ── */
const ENTITY_MAP = Object.fromEntries(DATA_ENTITIES.map(e => [e.id, e]));

/* ══════════════════════════════════════════════════════════════════
   2. MODULE_DATA_MAP — Route-to-data-requirement mapping
   ══════════════════════════════════════════════════════════════════ */
const MODULE_DATA_MAP = {
  // ── Carbon & Emissions ──
  'integrated-carbon-emissions':     { name: 'Integrated Carbon Emissions', code: 'F-001', domain: 'carbon', requiredEntities: ['company','emissions'], optionalEntities: ['portfolio_holding','activity_data'], specificFields: { emissions: ['scope1_tco2e','scope2_market_tco2e','scope3_total_tco2e','dqs'] }, outputs: [{ name: 'Financed Emissions', entity: 'emissions', description: 'Attributed emissions by holding' }] },
  'scope3-engine':                   { name: 'Scope 3 Engine', code: 'F-002', domain: 'carbon', requiredEntities: ['company','emissions','supplier'], optionalEntities: ['activity_data'], specificFields: { emissions: ['scope3_c1','scope3_c2','scope3_c3','scope3_c4','scope3_c5','scope3_c6','scope3_c7','scope3_c8','scope3_c9','scope3_c10','scope3_c11','scope3_c12','scope3_c13','scope3_c14','scope3_c15'] }, outputs: [{ name: 'Category Breakdown', entity: 'emissions', description: 'Scope 3 by all 15 categories' }] },
  'carbon-calculator':              { name: 'Carbon Calculator', code: 'F-003', domain: 'carbon', requiredEntities: ['activity_data'], optionalEntities: ['company'], specificFields: {}, outputs: [{ name: 'Calculated Emissions', entity: 'emissions', description: 'Emissions from activity data' }] },
  'carbon-accounting-ai':           { name: 'Carbon Accounting AI', code: 'F-004', domain: 'carbon', requiredEntities: ['company','activity_data'], optionalEntities: ['emissions'], specificFields: {}, outputs: [{ name: 'AI-Classified Emissions', entity: 'emissions', description: 'ML-classified scope allocations' }] },
  'carbon-budget':                  { name: 'Carbon Budget', code: 'F-005', domain: 'carbon', requiredEntities: ['company','emissions','climate_target'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'real-time-emissions-monitor':    { name: 'Real-Time Emissions Monitor', code: 'F-006', domain: 'carbon', requiredEntities: ['company','activity_data'], optionalEntities: [], specificFields: {}, outputs: [] },
  'spending-carbon':                { name: 'Spend-Based Carbon', code: 'F-007', domain: 'carbon', requiredEntities: ['company','supplier'], optionalEntities: ['activity_data'], specificFields: { supplier: ['spend_usd','category'] }, outputs: [{ name: 'Spend Emissions', entity: 'emissions', description: 'EEIO-based spend estimates' }] },
  'carbon-economy':                 { name: 'Carbon Economy', code: 'F-008', domain: 'carbon', requiredEntities: ['company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'carbon-wallet':                  { name: 'Carbon Wallet', code: 'F-009', domain: 'carbon', requiredEntities: ['activity_data'], optionalEntities: [], specificFields: {}, outputs: [] },
  'consumer-carbon-hub':            { name: 'Consumer Carbon Hub', code: 'F-010', domain: 'carbon', requiredEntities: ['activity_data'], optionalEntities: [], specificFields: {}, outputs: [] },
  'carbon-reduction-projects':      { name: 'Carbon Reduction Projects', code: 'F-011', domain: 'carbon', requiredEntities: ['company','emissions','climate_target'], optionalEntities: [], specificFields: {}, outputs: [] },
  'carbon-removal':                 { name: 'Carbon Removal', code: 'F-012', domain: 'carbon', requiredEntities: ['company'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'carbon-forward-curve':           { name: 'Carbon Forward Curve', code: 'F-013', domain: 'carbon', requiredEntities: ['scenario'], optionalEntities: [], specificFields: {}, outputs: [] },
  'internal-carbon-price':          { name: 'Internal Carbon Price', code: 'F-014', domain: 'carbon', requiredEntities: ['company','emissions','scenario'], optionalEntities: [], specificFields: {}, outputs: [] },
  'live-carbon-price-monitor':      { name: 'Live Carbon Price Monitor', code: 'F-015', domain: 'carbon', requiredEntities: [], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  // ── PCAF & Financed ──
  'pcaf-financed-emissions':        { name: 'PCAF Financed Emissions', code: 'P-001', domain: 'pcaf', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: ['esg_score'], specificFields: { portfolio_holding: ['asset_class','market_value_usd','ownership_pct'], emissions: ['scope1_tco2e','scope2_market_tco2e','dqs'] }, outputs: [{ name: 'Financed Emissions', entity: 'emissions', description: 'PCAF-attributed portfolio emissions' }] },
  'pcaf-universal-attributor':      { name: 'PCAF Universal Attributor', code: 'P-002', domain: 'pcaf', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: [], specificFields: {}, outputs: [] },
  'financed-emissions-attributor':  { name: 'Financed Emissions Attributor', code: 'P-003', domain: 'pcaf', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: [], specificFields: {}, outputs: [] },
  'pcaf-india-brsr':                { name: 'PCAF India BRSR', code: 'P-004', domain: 'pcaf', requiredEntities: ['company','emissions'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'portfolio-carbon-accounting':    { name: 'Portfolio Carbon Accounting', code: 'P-005', domain: 'pcaf', requiredEntities: ['portfolio_holding','emissions'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'portfolio-temperature-score':    { name: 'Portfolio Temperature Score', code: 'P-006', domain: 'pcaf', requiredEntities: ['portfolio_holding','emissions','climate_target'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'portfolio-decarbonization':      { name: 'Portfolio Decarbonization', code: 'P-007', domain: 'pcaf', requiredEntities: ['portfolio_holding','emissions','climate_target'], optionalEntities: [], specificFields: {}, outputs: [] },
  'paris-alignment':                { name: 'Paris Alignment', code: 'P-008', domain: 'pcaf', requiredEntities: ['portfolio_holding','emissions','scenario'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  // ── CBAM & Trade ──
  'cbam-compliance':                { name: 'CBAM Compliance', code: 'C-001', domain: 'cbam', requiredEntities: ['company','cbam_product'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'trade-carbon-policy':            { name: 'Trade Carbon Policy', code: 'C-002', domain: 'cbam', requiredEntities: ['company','commodity_exposure'], optionalEntities: ['cbam_product'], specificFields: {}, outputs: [] },
  'aviation-corsia':                { name: 'Aviation CORSIA', code: 'C-003', domain: 'cbam', requiredEntities: ['company','emissions','activity_data'], optionalEntities: [], specificFields: { activity_data: ['activity_type'] }, outputs: [] },
  // ── Compliance & Disclosure ──
  'csrd-readiness':                 { name: 'CSRD Readiness', code: 'D-001', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'csrd-dma':                       { name: 'CSRD Double Materiality', code: 'D-002', domain: 'disclosure', requiredEntities: ['company'], optionalEntities: ['emissions','esg_score','impact_metric'], specificFields: {}, outputs: [] },
  'csrd-xbrl':                      { name: 'CSRD iXBRL', code: 'D-003', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: [], specificFields: {}, outputs: [] },
  'csrd-esrs-automation':           { name: 'CSRD ESRS Automation', code: 'D-004', domain: 'disclosure', requiredEntities: ['company','emissions'], optionalEntities: ['water_footprint','board_member','impact_metric'], specificFields: {}, outputs: [] },
  'csrd-esrs-full':                 { name: 'CSRD ESRS Full Suite', code: 'D-005', domain: 'disclosure', requiredEntities: ['company','emissions','water_footprint','board_member'], optionalEntities: ['impact_metric','supplier','esg_score'], specificFields: {}, outputs: [] },
  'sfdr-pai':                       { name: 'SFDR PAI', code: 'D-006', domain: 'disclosure', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: ['water_footprint','board_member','esg_score'], specificFields: {}, outputs: [] },
  'sfdr-classification':            { name: 'SFDR Classification', code: 'D-007', domain: 'disclosure', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'sfdr-art9':                      { name: 'SFDR Article 9', code: 'D-008', domain: 'disclosure', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'sfdr-v2':                        { name: 'SFDR v2 Reporting', code: 'D-009', domain: 'disclosure', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['board_member','water_footprint'], specificFields: {}, outputs: [] },
  'issb-tcfd':                      { name: 'ISSB/TCFD', code: 'D-010', domain: 'disclosure', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['climate_target','regulatory_filing'], specificFields: {}, outputs: [] },
  'issb-disclosure':                { name: 'ISSB Disclosure', code: 'D-011', domain: 'disclosure', requiredEntities: ['company','emissions'], optionalEntities: ['scenario','regulatory_filing'], specificFields: {}, outputs: [] },
  'issb-materiality':               { name: 'ISSB Materiality', code: 'D-012', domain: 'disclosure', requiredEntities: ['company'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  // ── Climate Risk & Capital ──
  'climate-capital-adequacy':       { name: 'Climate Capital Adequacy', code: 'R-001', domain: 'climate_risk', requiredEntities: ['portfolio_holding','company','emissions','scenario'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'climate-cvar-suite':             { name: 'Climate CVaR Suite', code: 'R-002', domain: 'climate_risk', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions','asset'], specificFields: {}, outputs: [] },
  'climate-risk-premium':           { name: 'Climate Risk Premium', code: 'R-003', domain: 'climate_risk', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'enterprise-climate-risk':        { name: 'Enterprise Climate Risk', code: 'R-004', domain: 'climate_risk', requiredEntities: ['company','emissions','asset','scenario'], optionalEntities: ['portfolio_holding'], specificFields: {}, outputs: [] },
  'systemic-climate-risk':          { name: 'Systemic Climate Risk', code: 'R-005', domain: 'climate_risk', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'supervisory-stress-orchestrator':{ name: 'Supervisory Stress Orchestrator', code: 'R-006', domain: 'climate_risk', requiredEntities: ['portfolio_holding','company','emissions','scenario'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'transition-risk-dashboard':      { name: 'Transition Risk Dashboard', code: 'R-007', domain: 'climate_risk', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'transition-risk-dcf':            { name: 'Transition Risk DCF', code: 'R-008', domain: 'climate_risk', requiredEntities: ['company','emissions','scenario'], optionalEntities: [], specificFields: {}, outputs: [] },
  'climate-transition-risk':        { name: 'Climate Transition Risk', code: 'R-009', domain: 'climate_risk', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['commodity_exposure'], specificFields: {}, outputs: [] },
  'asset-valuation-engine':         { name: 'Asset Valuation Engine', code: 'R-010', domain: 'climate_risk', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  // ── Water & Physical ──
  'water-risk-analytics':           { name: 'Water Risk Analytics', code: 'W-001', domain: 'physical', requiredEntities: ['company','water_footprint'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'physical-risk-portfolio':        { name: 'Physical Risk Portfolio', code: 'W-002', domain: 'physical', requiredEntities: ['portfolio_holding','asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'physical-hazard-map':            { name: 'Physical Hazard Map', code: 'W-003', domain: 'physical', requiredEntities: ['asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'physical-risk-pricing':          { name: 'Physical Risk Pricing', code: 'W-004', domain: 'physical', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'sovereign-physical-risk':        { name: 'Sovereign Physical Risk', code: 'W-005', domain: 'physical', requiredEntities: ['scenario'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'climate-migration':              { name: 'Climate Migration', code: 'W-006', domain: 'physical', requiredEntities: ['scenario'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  // ── Supply Chain ──
  'supply-chain-carbon':            { name: 'Supply Chain Carbon', code: 'S-001', domain: 'supply_chain', requiredEntities: ['company','supplier','emissions'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'supplier-emissions-tracker':     { name: 'Supplier Emissions Tracker', code: 'S-002', domain: 'supply_chain', requiredEntities: ['supplier'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'scope3-upstream-tracker':        { name: 'Scope 3 Upstream Tracker', code: 'S-003', domain: 'supply_chain', requiredEntities: ['company','supplier','emissions'], optionalEntities: [], specificFields: { emissions: ['scope3_c1','scope3_c2','scope3_c3','scope3_c4'] }, outputs: [] },
  'food-supply-chain-emissions':    { name: 'Food Supply Chain Emissions', code: 'S-004', domain: 'supply_chain', requiredEntities: ['supplier','activity_data'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'procurement-carbon-tracker':     { name: 'Procurement Carbon Tracker', code: 'S-005', domain: 'supply_chain', requiredEntities: ['supplier'], optionalEntities: ['company','activity_data'], specificFields: {}, outputs: [] },
  // ── ESG & Benchmarking ──
  'esg-ratings-hub':                { name: 'ESG Ratings Hub', code: 'E-001', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'benchmark-analytics':            { name: 'Benchmark Analytics', code: 'E-002', domain: 'esg', requiredEntities: ['company','emissions'], optionalEntities: ['esg_score','climate_target'], specificFields: {}, outputs: [] },
  'board-diversity':                { name: 'Board Diversity', code: 'E-003', domain: 'esg', requiredEntities: ['company','board_member'], optionalEntities: [], specificFields: {}, outputs: [] },
  'act-assessment':                 { name: 'ACT Assessment', code: 'E-004', domain: 'esg', requiredEntities: ['company','emissions','climate_target'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'peer-transition-benchmarker':    { name: 'Peer Transition Benchmarker', code: 'E-005', domain: 'esg', requiredEntities: ['company','emissions','climate_target'], optionalEntities: [], specificFields: {}, outputs: [] },
  'sentiment-analysis':             { name: 'Sentiment Analysis', code: 'E-006', domain: 'esg', requiredEntities: ['company'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'ai-sentiment':                   { name: 'AI Sentiment', code: 'E-007', domain: 'esg', requiredEntities: ['company'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'esg-report-parser':              { name: 'ESG Report Parser', code: 'E-008', domain: 'esg', requiredEntities: ['company'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [{ name: 'Parsed ESG Data', entity: 'esg_score', description: 'Extracted ESG metrics from reports' }] },
  // ── Carbon Credits & Offsets ──
  'carbon-credit-pricing':          { name: 'Carbon Credit Pricing', code: 'CC-001', domain: 'carbon_credits', requiredEntities: [], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'carbon-market-intelligence':     { name: 'Carbon Market Intelligence', code: 'CC-002', domain: 'carbon_credits', requiredEntities: [], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'offset-portfolio-tracker':       { name: 'Offset Portfolio Tracker', code: 'CC-003', domain: 'carbon_credits', requiredEntities: ['company'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'corporate-offset-optimizer':     { name: 'Corporate Offset Optimizer', code: 'CC-004', domain: 'carbon_credits', requiredEntities: ['company','emissions','climate_target'], optionalEntities: [], specificFields: {}, outputs: [] },
  'offset-permanence-risk':         { name: 'Offset Permanence Risk', code: 'CC-005', domain: 'carbon_credits', requiredEntities: [], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'em-carbon-credit-hub':           { name: 'EM Carbon Credit Hub', code: 'CC-006', domain: 'carbon_credits', requiredEntities: [], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  // ── Impact & SDG ──
  'social-impact':                  { name: 'Social Impact', code: 'I-001', domain: 'impact', requiredEntities: ['company','impact_metric'], optionalEntities: ['board_member'], specificFields: {}, outputs: [] },
  'impact-measurement-hub':         { name: 'Impact Measurement Hub', code: 'I-002', domain: 'impact', requiredEntities: ['impact_metric'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'undp-blended-finance':           { name: 'UNDP Blended Finance', code: 'I-003', domain: 'impact', requiredEntities: ['impact_metric'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'equitable-earth':                { name: 'Equitable Earth', code: 'I-004', domain: 'impact', requiredEntities: ['company','impact_metric'], optionalEntities: [], specificFields: {}, outputs: [] },
  'vc-impact':                      { name: 'VC Impact', code: 'I-005', domain: 'impact', requiredEntities: ['company','impact_metric'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  // ── Insurance & Sovereign ──
  'catastrophe-modelling':          { name: 'Catastrophe Modelling', code: 'IN-001', domain: 'insurance', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'parametric-insurance':           { name: 'Parametric Insurance', code: 'IN-002', domain: 'insurance', requiredEntities: ['asset','scenario'], optionalEntities: [], specificFields: {}, outputs: [] },
  'reinsurance-climate':            { name: 'Reinsurance Climate', code: 'IN-003', domain: 'insurance', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'sovereign-climate-risk':         { name: 'Sovereign Climate Risk', code: 'IN-004', domain: 'insurance', requiredEntities: ['scenario'], optionalEntities: ['commodity_exposure'], specificFields: {}, outputs: [] },
  'sovereign-esg-scorer':           { name: 'Sovereign ESG Scorer', code: 'IN-005', domain: 'insurance', requiredEntities: ['esg_score'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'insurance-transition':           { name: 'Insurance Transition', code: 'IN-006', domain: 'insurance', requiredEntities: ['company','scenario'], optionalEntities: ['asset','emissions'], specificFields: {}, outputs: [] },
  // ── Renewable Energy ──
  'solar-project-finance':            { name: 'Solar Project Finance', code: 'RE-001', domain: 'renewable_energy', requiredEntities: ['renewable_project','project_finance'], optionalEntities: ['scenario','company'], specificFields: {}, outputs: [] },
  'solar-resource-performance':       { name: 'Solar Resource Performance', code: 'RE-002', domain: 'renewable_energy', requiredEntities: ['renewable_project'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'renewable-ml-forecasting':         { name: 'Renewable ML Forecasting', code: 'RE-003', domain: 'renewable_energy', requiredEntities: ['renewable_project'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'renewable-portfolio-intelligence': { name: 'Renewable Portfolio Intelligence', code: 'RE-004', domain: 'renewable_energy', requiredEntities: ['renewable_project','portfolio_holding'], optionalEntities: ['scenario','company'], specificFields: {}, outputs: [] },
  'renewable-project-pipeline':       { name: 'Renewable Project Pipeline', code: 'RE-005', domain: 'renewable_energy', requiredEntities: ['renewable_project'], optionalEntities: ['company','project_finance'], specificFields: {}, outputs: [] },
  'renewable-asset-management':       { name: 'Renewable Asset Management', code: 'RE-006', domain: 'renewable_energy', requiredEntities: ['renewable_project','asset'], optionalEntities: ['project_finance'], specificFields: {}, outputs: [] },
  'ppa-analytics':                    { name: 'PPA Analytics', code: 'RE-007', domain: 'renewable_energy', requiredEntities: ['renewable_project'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'ppa-revenue-analytics':            { name: 'PPA Revenue Analytics', code: 'RE-008', domain: 'renewable_energy', requiredEntities: ['renewable_project','project_finance'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'wind-energy-finance':              { name: 'Wind Energy Finance', code: 'RE-009', domain: 'renewable_energy', requiredEntities: ['renewable_project','project_finance'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  're-portfolio-dashboard':           { name: 'RE Portfolio Dashboard', code: 'RE-010', domain: 'renewable_energy', requiredEntities: ['renewable_project','portfolio_holding'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'bess-grid-analytics':              { name: 'BESS Grid Analytics', code: 'RE-011', domain: 'renewable_energy', requiredEntities: ['renewable_project'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'energy-storage-analytics':         { name: 'Energy Storage Analytics', code: 'RE-012', domain: 'renewable_energy', requiredEntities: ['renewable_project','asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'green-hydrogen':                   { name: 'Green Hydrogen', code: 'RE-013', domain: 'renewable_energy', requiredEntities: ['renewable_project'], optionalEntities: ['activity_data','scenario'], specificFields: {}, outputs: [] },
  'green-hydrogen-economics-df':      { name: 'Green Hydrogen Economics', code: 'RE-014', domain: 'renewable_energy', requiredEntities: ['renewable_project','project_finance'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'nuclear-smr-viability':            { name: 'Nuclear SMR Viability', code: 'RE-015', domain: 'renewable_energy', requiredEntities: ['asset','project_finance'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'battery-ev-analytics':             { name: 'Battery EV Analytics', code: 'RE-016', domain: 'renewable_energy', requiredEntities: ['asset'], optionalEntities: ['activity_data','scenario'], specificFields: {}, outputs: [] },
  'ev-transition-finance':            { name: 'EV Transition Finance', code: 'RE-017', domain: 'renewable_energy', requiredEntities: ['company','asset'], optionalEntities: ['project_finance','scenario'], specificFields: {}, outputs: [] },
  'ev-fleet-finance':                 { name: 'EV Fleet Finance', code: 'RE-018', domain: 'renewable_energy', requiredEntities: ['company','asset'], optionalEntities: ['project_finance'], specificFields: {}, outputs: [] },
  'sustainable-aviation-fuel':        { name: 'Sustainable Aviation Fuel', code: 'RE-019', domain: 'renewable_energy', requiredEntities: ['company','activity_data'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'sustainable-transport-hub':        { name: 'Sustainable Transport Hub', code: 'RE-020', domain: 'renewable_energy', requiredEntities: ['company'], optionalEntities: ['activity_data','asset','scenario'], specificFields: {}, outputs: [] },
  // ── Offshore Wind ──
  'offshore-wind-resource':           { name: 'Offshore Wind Resource', code: 'OW-001', domain: 'offshore_wind', requiredEntities: ['renewable_project'], optionalEntities: ['scenario','asset'], specificFields: {}, outputs: [] },
  'floating-offshore-wind':           { name: 'Floating Offshore Wind', code: 'OW-002', domain: 'offshore_wind', requiredEntities: ['renewable_project','project_finance'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'offshore-wind-finance':            { name: 'Offshore Wind Finance', code: 'OW-003', domain: 'offshore_wind', requiredEntities: ['renewable_project','project_finance'], optionalEntities: ['scenario','company'], specificFields: {}, outputs: [] },
  'offshore-grid-infrastructure':     { name: 'Offshore Grid Infrastructure', code: 'OW-004', domain: 'offshore_wind', requiredEntities: ['renewable_project','asset'], optionalEntities: ['project_finance'], specificFields: {}, outputs: [] },
  'offshore-wind-om':                 { name: 'Offshore Wind O&M', code: 'OW-005', domain: 'offshore_wind', requiredEntities: ['renewable_project','wind_turbine'], optionalEntities: ['asset','project_finance'], specificFields: {}, outputs: [] },
  'wind-repowering-intelligence':     { name: 'Wind Repowering Intelligence', code: 'OW-006', domain: 'offshore_wind', requiredEntities: ['wind_turbine','renewable_project'], optionalEntities: ['project_finance','scenario'], specificFields: {}, outputs: [] },
  // ── Climate Litigation ──
  'climate-litigation':                  { name: 'Climate Litigation', code: 'LIT-001', domain: 'climate_litigation', requiredEntities: ['litigation_case','company'], optionalEntities: ['emissions','regulatory_filing'], specificFields: {}, outputs: [] },
  'climate-litigation-risk-scorer':      { name: 'Climate Litigation Risk Scorer', code: 'LIT-002', domain: 'climate_litigation', requiredEntities: ['company','emissions'], optionalEntities: ['litigation_case','esg_score'], specificFields: {}, outputs: [] },
  'climate-legal-intelligence-dashboard':{ name: 'Climate Legal Intelligence Dashboard', code: 'LIT-003', domain: 'climate_litigation', requiredEntities: ['litigation_case'], optionalEntities: ['company','regulatory_filing'], specificFields: {}, outputs: [] },
  'stranded-asset-litigation-tracker':   { name: 'Stranded Asset Litigation Tracker', code: 'LIT-004', domain: 'climate_litigation', requiredEntities: ['litigation_case','asset'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'stranded-asset-analyzer':             { name: 'Stranded Asset Analyzer', code: 'LIT-005', domain: 'climate_litigation', requiredEntities: ['asset','company','scenario'], optionalEntities: ['emissions','commodity_exposure'], specificFields: {}, outputs: [] },
  'stranded-asset-watchlist':            { name: 'Stranded Asset Watchlist', code: 'LIT-006', domain: 'climate_litigation', requiredEntities: ['company','asset'], optionalEntities: ['scenario','commodity_exposure'], specificFields: {}, outputs: [] },
  'stranded-assets':                     { name: 'Stranded Assets', code: 'LIT-007', domain: 'climate_litigation', requiredEntities: ['company','asset','scenario'], optionalEntities: ['emissions','commodity_exposure'], specificFields: {}, outputs: [] },
  'vintage-cohort-stranded':             { name: 'Vintage Cohort Stranded', code: 'LIT-008', domain: 'climate_litigation', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'stranded-recovery-pathways':          { name: 'Stranded Recovery Pathways', code: 'LIT-009', domain: 'climate_litigation', requiredEntities: ['asset','company','scenario'], optionalEntities: ['project_finance'], specificFields: {}, outputs: [] },
  'energy-decommissioning-liability':    { name: 'Energy Decommissioning Liability', code: 'LIT-010', domain: 'climate_litigation', requiredEntities: ['asset','company'], optionalEntities: ['scenario','project_finance'], specificFields: {}, outputs: [] },
  'decommissioning-cost-engine':         { name: 'Decommissioning Cost Engine', code: 'LIT-011', domain: 'climate_litigation', requiredEntities: ['asset','company'], optionalEntities: ['project_finance','scenario'], specificFields: {}, outputs: [] },
  'disclosure-adequacy-analyzer':        { name: 'Disclosure Adequacy Analyzer', code: 'LIT-012', domain: 'climate_litigation', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  // ── Supervisory ──
  'climate-stress-test-suite':           { name: 'Climate Stress Test Suite', code: 'SUP-001', domain: 'supervisory', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions','asset'], specificFields: {}, outputs: [] },
  'climate-stress-test':                 { name: 'Climate Stress Test', code: 'SUP-002', domain: 'supervisory', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'regulatory-stress-submission':        { name: 'Regulatory Stress Submission', code: 'SUP-003', domain: 'supervisory', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'regulatory-capital':                  { name: 'Regulatory Capital', code: 'SUP-004', domain: 'supervisory', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['scenario','asset'], specificFields: {}, outputs: [] },
  'solvency-capital-climate':            { name: 'Solvency Capital Climate', code: 'SUP-005', domain: 'supervisory', requiredEntities: ['company','asset','scenario'], optionalEntities: ['actuarial_data'], specificFields: {}, outputs: [] },
  'climate-reserve-adequacy':            { name: 'Climate Reserve Adequacy', code: 'SUP-006', domain: 'supervisory', requiredEntities: ['actuarial_data','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'central-bank-climate':                { name: 'Central Bank Climate', code: 'SUP-007', domain: 'supervisory', requiredEntities: ['portfolio_holding','scenario','company'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'rbi-climate-risk':                    { name: 'RBI Climate Risk', code: 'SUP-008', domain: 'supervisory', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'climate-var-engine':                  { name: 'Climate VaR Engine', code: 'SUP-009', domain: 'supervisory', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'climate-risk-budget-allocator':       { name: 'Climate Risk Budget Allocator', code: 'SUP-010', domain: 'supervisory', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  // ── Actuarial Insurance ──
  'climate-mortality-longevity':         { name: 'Climate Mortality Longevity', code: 'ACT-001', domain: 'actuarial_insurance', requiredEntities: ['actuarial_data','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'climate-claims-forecasting':          { name: 'Climate Claims Forecasting', code: 'ACT-002', domain: 'actuarial_insurance', requiredEntities: ['actuarial_data','asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'climate-insurance':                   { name: 'Climate Insurance', code: 'ACT-003', domain: 'actuarial_insurance', requiredEntities: ['actuarial_data','asset'], optionalEntities: ['scenario','company'], specificFields: {}, outputs: [] },
  'insurance-portfolio-climate':         { name: 'Insurance Portfolio Climate', code: 'ACT-004', domain: 'actuarial_insurance', requiredEntities: ['actuarial_data','portfolio_holding'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'insurance-protection-gap':            { name: 'Insurance Protection Gap', code: 'ACT-005', domain: 'actuarial_insurance', requiredEntities: ['actuarial_data','asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'insurance-climate-hub':               { name: 'Insurance Climate Hub', code: 'ACT-006', domain: 'actuarial_insurance', requiredEntities: ['actuarial_data'], optionalEntities: ['asset','company','scenario'], specificFields: {}, outputs: [] },
  'underwriting-esg':                    { name: 'Underwriting ESG', code: 'ACT-007', domain: 'actuarial_insurance', requiredEntities: ['company','esg_score'], optionalEntities: ['actuarial_data','asset'], specificFields: {}, outputs: [] },
  'pandemic-climate-nexus':              { name: 'Pandemic Climate Nexus', code: 'ACT-008', domain: 'actuarial_insurance', requiredEntities: ['scenario'], optionalEntities: ['actuarial_data','company'], specificFields: {}, outputs: [] },
  'pandemic-climate-finance':            { name: 'Pandemic Climate Finance', code: 'ACT-009', domain: 'actuarial_insurance', requiredEntities: ['company','scenario'], optionalEntities: ['actuarial_data'], specificFields: {}, outputs: [] },
  'climate-health-hub':                  { name: 'Climate Health Hub', code: 'ACT-010', domain: 'actuarial_insurance', requiredEntities: ['company','scenario'], optionalEntities: ['actuarial_data','impact_metric'], specificFields: {}, outputs: [] },
  'climate-health-risk-analytics':       { name: 'Climate Health Risk Analytics', code: 'ACT-011', domain: 'actuarial_insurance', requiredEntities: ['asset','scenario'], optionalEntities: ['actuarial_data'], specificFields: {}, outputs: [] },
  'health-adaptation-finance':           { name: 'Health Adaptation Finance', code: 'ACT-012', domain: 'actuarial_insurance', requiredEntities: ['company','scenario'], optionalEntities: ['impact_metric','actuarial_data'], specificFields: {}, outputs: [] },
  'heat-mortality-risk':                 { name: 'Heat Mortality Risk', code: 'ACT-013', domain: 'actuarial_insurance', requiredEntities: ['asset','scenario'], optionalEntities: ['actuarial_data'], specificFields: {}, outputs: [] },
  'heat-stress-finance':                 { name: 'Heat Stress Finance', code: 'ACT-014', domain: 'actuarial_insurance', requiredEntities: ['company','asset','scenario'], optionalEntities: ['actuarial_data'], specificFields: {}, outputs: [] },
  // ── Corporate Finance ──
  'climate-wacc-engine':                 { name: 'Climate WACC Engine', code: 'CF-001', domain: 'corporate_finance', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['corporate_deal'], specificFields: {}, outputs: [] },
  'green-debt-structuring':              { name: 'Green Debt Structuring', code: 'CF-002', domain: 'corporate_finance', requiredEntities: ['company','corporate_deal'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'climate-ma-due-diligence':            { name: 'Climate M&A Due Diligence', code: 'CF-003', domain: 'corporate_finance', requiredEntities: ['company','emissions','corporate_deal'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'carbon-adjusted-valuation':           { name: 'Carbon-Adjusted Valuation', code: 'CF-004', domain: 'corporate_finance', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['corporate_deal','asset'], specificFields: {}, outputs: [] },
  'treasury-climate-risk':               { name: 'Treasury Climate Risk', code: 'CF-005', domain: 'corporate_finance', requiredEntities: ['company','scenario'], optionalEntities: ['corporate_deal','emissions'], specificFields: {}, outputs: [] },
  'climate-capital-markets':             { name: 'Climate Capital Markets', code: 'CF-006', domain: 'corporate_finance', requiredEntities: ['company','corporate_deal'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'climate-derivatives':                 { name: 'Climate Derivatives', code: 'CF-007', domain: 'corporate_finance', requiredEntities: ['scenario'], optionalEntities: ['company','corporate_deal'], specificFields: {}, outputs: [] },
  'climate-financial-statements':        { name: 'Climate Financial Statements', code: 'CF-008', domain: 'corporate_finance', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'climate-credit-risk-analytics':       { name: 'Climate Credit Risk Analytics', code: 'CF-009', domain: 'corporate_finance', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: ['scenario','corporate_deal'], specificFields: {}, outputs: [] },
  'credit-risk-analytics':               { name: 'Credit Risk Analytics', code: 'CF-010', domain: 'corporate_finance', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'credit-quality-screener':             { name: 'Credit Quality Screener', code: 'CF-011', domain: 'corporate_finance', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','portfolio_holding'], specificFields: {}, outputs: [] },
  'covenant-breach-predictor':           { name: 'Covenant Breach Predictor', code: 'CF-012', domain: 'corporate_finance', requiredEntities: ['company','portfolio_holding','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'structured-credit-climate':           { name: 'Structured Credit Climate', code: 'CF-013', domain: 'corporate_finance', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'climate-credit-integration':          { name: 'Climate Credit Integration', code: 'CF-014', domain: 'corporate_finance', requiredEntities: ['portfolio_holding','company','emissions','scenario'], optionalEntities: [], specificFields: {}, outputs: [] },
  'climate-mortgage-analytics':          { name: 'Climate Mortgage Analytics', code: 'CF-015', domain: 'corporate_finance', requiredEntities: ['real_estate_asset','scenario'], optionalEntities: ['company','portfolio_holding'], specificFields: {}, outputs: [] },
  'green-securitisation':                { name: 'Green Securitisation', code: 'CF-016', domain: 'corporate_finance', requiredEntities: ['company','corporate_deal'], optionalEntities: ['real_estate_asset','renewable_project'], specificFields: {}, outputs: [] },
  // ── AI & NLP ──
  'ai-hub':                            { name: 'AI Hub', code: 'AI-001', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['esg_score','emissions','regulatory_filing'], specificFields: {}, outputs: [] },
  'ai-governance':                     { name: 'AI Governance', code: 'AI-002', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['regulatory_filing','esg_score'], specificFields: {}, outputs: [] },
  'ai-data-live-platform':             { name: 'AI Data Live Platform', code: 'AI-003', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'ai-compliance-agent':               { name: 'AI Compliance Agent', code: 'AI-004', domain: 'ai_nlp', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['esg_score','emissions'], specificFields: {}, outputs: [] },
  'sentiment-pipeline':                { name: 'Sentiment Pipeline', code: 'AI-005', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'nlp-disclosure-parser':             { name: 'NLP Disclosure Parser', code: 'AI-006', domain: 'ai_nlp', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'esg-narrative-intelligence':        { name: 'ESG Narrative Intelligence', code: 'AI-007', domain: 'ai_nlp', requiredEntities: ['company','esg_score'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'narrative-intelligence':            { name: 'Narrative Intelligence', code: 'AI-008', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['esg_score','regulatory_filing'], specificFields: {}, outputs: [] },
  'anomaly-detection':                 { name: 'Anomaly Detection', code: 'AI-009', domain: 'ai_nlp', requiredEntities: ['company','emissions'], optionalEntities: ['esg_score','portfolio_holding'], specificFields: {}, outputs: [] },
  'anomaly-detection-engine':          { name: 'Anomaly Detection Engine', code: 'AI-010', domain: 'ai_nlp', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'llm-esg-extractor':                 { name: 'LLM ESG Extractor', code: 'AI-011', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['regulatory_filing','esg_score','emissions'], specificFields: {}, outputs: [] },
  'ensemble-prediction-engine':        { name: 'Ensemble Prediction Engine', code: 'AI-012', domain: 'ai_nlp', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['portfolio_holding'], specificFields: {}, outputs: [] },
  'predictive-esg':                    { name: 'Predictive ESG', code: 'AI-013', domain: 'ai_nlp', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','portfolio_holding'], specificFields: {}, outputs: [] },
  'ml-risk-scorer':                    { name: 'ML Risk Scorer', code: 'AI-014', domain: 'ai_nlp', requiredEntities: ['company','esg_score','emissions'], optionalEntities: ['portfolio_holding','scenario'], specificFields: {}, outputs: [] },
  'ml-taxonomy-scoring':               { name: 'ML Taxonomy Scoring', code: 'AI-015', domain: 'ai_nlp', requiredEntities: ['company','esg_score'], optionalEntities: ['regulatory_filing','portfolio_holding'], specificFields: {}, outputs: [] },
  'ml-feature-engineering':            { name: 'ML Feature Engineering', code: 'AI-016', domain: 'ai_nlp', requiredEntities: ['company','emissions'], optionalEntities: ['esg_score','portfolio_holding'], specificFields: {}, outputs: [] },
  'ai-engagement':                     { name: 'AI Engagement', code: 'AI-017', domain: 'ai_nlp', requiredEntities: ['company','esg_score'], optionalEntities: [], specificFields: {}, outputs: [] },
  'quantitative-nlp-research':         { name: 'Quantitative NLP Research', code: 'AI-018', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['esg_score','regulatory_filing'], specificFields: {}, outputs: [] },
  'climate-news-sentiment-feed':       { name: 'Climate News Sentiment Feed', code: 'AI-019', domain: 'ai_nlp', requiredEntities: ['company'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'esg-time-series-forecaster':        { name: 'ESG Time Series Forecaster', code: 'AI-020', domain: 'ai_nlp', requiredEntities: ['company','esg_score','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  // ── Nature & Biodiversity ──
  'nature-hub':                        { name: 'Nature Hub', code: 'NAT-001', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset'], optionalEntities: ['impact_metric','scenario'], specificFields: {}, outputs: [] },
  'nature-capital-accounting':         { name: 'Nature Capital Accounting', code: 'NAT-002', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'biodiversity-credits':              { name: 'Biodiversity Credits', code: 'NAT-003', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','impact_metric'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'biodiversity-footprint':            { name: 'Biodiversity Footprint', code: 'NAT-004', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset'], optionalEntities: ['supplier','activity_data'], specificFields: {}, outputs: [] },
  'nature-based-adaptation':           { name: 'Nature-Based Adaptation', code: 'NAT-005', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','scenario'], optionalEntities: ['company','impact_metric'], specificFields: {}, outputs: [] },
  'nbs-finance':                       { name: 'NbS Finance', code: 'NAT-006', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','project_finance'], optionalEntities: ['impact_metric','company'], specificFields: {}, outputs: [] },
  'agri-biodiversity':                 { name: 'Agri Biodiversity', code: 'NAT-007', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','company'], optionalEntities: ['supplier','activity_data'], specificFields: {}, outputs: [] },
  'regenerative-agriculture':          { name: 'Regenerative Agriculture', code: 'NAT-008', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset'], optionalEntities: ['activity_data','impact_metric'], specificFields: {}, outputs: [] },
  'blue-carbon-finance':               { name: 'Blue Carbon Finance', code: 'NAT-009', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','project_finance'], optionalEntities: ['impact_metric','scenario'], specificFields: {}, outputs: [] },
  'ocean-health-finance':              { name: 'Ocean Health Finance', code: 'NAT-010', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','scenario'], optionalEntities: ['impact_metric','company'], specificFields: {}, outputs: [] },
  'ecosystem-services':                { name: 'Ecosystem Services', code: 'NAT-011', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','company'], optionalEntities: ['impact_metric','scenario'], specificFields: {}, outputs: [] },
  'tnfd-leap':                         { name: 'TNFD LEAP', code: 'NAT-012', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset'], optionalEntities: ['impact_metric','regulatory_filing'], specificFields: {}, outputs: [] },
  'land-use-carbon':                   { name: 'Land Use Carbon', code: 'NAT-013', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset','emissions'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'land-use-change-finance':           { name: 'Land Use Change Finance', code: 'NAT-014', domain: 'nature_biodiversity', requiredEntities: ['nature_asset','company'], optionalEntities: ['project_finance','scenario'], specificFields: {}, outputs: [] },
  'land-use-deforestation':            { name: 'Land Use Deforestation', code: 'NAT-015', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset','supplier'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'deforestation-risk':                { name: 'Deforestation Risk', code: 'NAT-016', domain: 'nature_biodiversity', requiredEntities: ['company','supplier','nature_asset'], optionalEntities: ['commodity_exposure'], specificFields: {}, outputs: [] },
  'commodity-deforestation':           { name: 'Commodity Deforestation', code: 'NAT-017', domain: 'nature_biodiversity', requiredEntities: ['company','commodity_exposure','nature_asset'], optionalEntities: ['supplier'], specificFields: {}, outputs: [] },
  'agri-finance-hub':                  { name: 'Agri Finance Hub', code: 'NAT-018', domain: 'nature_biodiversity', requiredEntities: ['company','nature_asset'], optionalEntities: ['project_finance','impact_metric'], specificFields: {}, outputs: [] },
  'agricultural-climate-risk':         { name: 'Agricultural Climate Risk', code: 'NAT-019', domain: 'nature_biodiversity', requiredEntities: ['company','asset','scenario'], optionalEntities: ['nature_asset','activity_data'], specificFields: {}, outputs: [] },
  'food-system-transition':            { name: 'Food System Transition', code: 'NAT-020', domain: 'nature_biodiversity', requiredEntities: ['company','supplier'], optionalEntities: ['nature_asset','scenario','activity_data'], specificFields: {}, outputs: [] },
  'sustainable-agriculture-investment':{ name: 'Sustainable Agriculture Investment', code: 'NAT-021', domain: 'nature_biodiversity', requiredEntities: ['company','project_finance'], optionalEntities: ['nature_asset','impact_metric'], specificFields: {}, outputs: [] },
  'water-food-energy-nexus':           { name: 'Water Food Energy Nexus', code: 'NAT-022', domain: 'nature_biodiversity', requiredEntities: ['company','water_footprint','nature_asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'water-stress':                      { name: 'Water Stress', code: 'NAT-023', domain: 'nature_biodiversity', requiredEntities: ['company','water_footprint'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'water-risk':                        { name: 'Water Risk', code: 'NAT-024', domain: 'nature_biodiversity', requiredEntities: ['company','water_footprint','asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'water-agriculture-risk':            { name: 'Water Agriculture Risk', code: 'NAT-025', domain: 'nature_biodiversity', requiredEntities: ['company','water_footprint','nature_asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  // ── Sovereign & EM ──
  'sovereign-hub':                     { name: 'Sovereign Hub', code: 'SOV-001', domain: 'sovereign_em', requiredEntities: ['sovereign_bond'], optionalEntities: ['esg_score','scenario'], specificFields: {}, outputs: [] },
  'sovereign-esg':                     { name: 'Sovereign ESG', code: 'SOV-002', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','esg_score'], optionalEntities: ['scenario','emissions'], specificFields: {}, outputs: [] },
  'sovereign-esg-hub':                 { name: 'Sovereign ESG Hub', code: 'SOV-003', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','esg_score'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'sovereign-green-bond-analytics':    { name: 'Sovereign Green Bond Analytics', code: 'SOV-004', domain: 'sovereign_em', requiredEntities: ['sovereign_bond'], optionalEntities: ['impact_metric','scenario'], specificFields: {}, outputs: [] },
  'sovereign-climate-intelligence':    { name: 'Sovereign Climate Intelligence', code: 'SOV-005', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','scenario'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'sovereign-debt-sustainability':     { name: 'Sovereign Debt Sustainability', code: 'SOV-006', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','scenario'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'sovereign-social-index':            { name: 'Sovereign Social Index', code: 'SOV-007', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','esg_score'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'sovereign-swf':                     { name: 'Sovereign SWF', code: 'SOV-008', domain: 'sovereign_em', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['sovereign_bond','scenario'], specificFields: {}, outputs: [] },
  'sovereign-nature-risk':             { name: 'Sovereign Nature Risk', code: 'SOV-009', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','nature_asset'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'em-climate-risk':                   { name: 'EM Climate Risk', code: 'SOV-010', domain: 'sovereign_em', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['sovereign_bond','portfolio_holding'], specificFields: {}, outputs: [] },
  'em-debt-climate-risk':              { name: 'EM Debt Climate Risk', code: 'SOV-011', domain: 'sovereign_em', requiredEntities: ['portfolio_holding','sovereign_bond','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'em-sovereign-climate-debt':         { name: 'EM Sovereign Climate Debt', code: 'SOV-012', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','scenario'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'frontier-market-climate':           { name: 'Frontier Market Climate', code: 'SOV-013', domain: 'sovereign_em', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond','portfolio_holding'], specificFields: {}, outputs: [] },
  'africa-climate-finance':            { name: 'Africa Climate Finance', code: 'SOV-014', domain: 'sovereign_em', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond','impact_metric','project_finance'], specificFields: {}, outputs: [] },
  'asean-gcc-transition':              { name: 'ASEAN GCC Transition', code: 'SOV-015', domain: 'sovereign_em', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond','emissions'], specificFields: {}, outputs: [] },
  'china-india-transition':            { name: 'China India Transition', code: 'SOV-016', domain: 'sovereign_em', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['sovereign_bond'], specificFields: {}, outputs: [] },
  'latam-transition':                  { name: 'LatAm Transition', code: 'SOV-017', domain: 'sovereign_em', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond','emissions'], specificFields: {}, outputs: [] },
  'jetp-analytics':                    { name: 'JETP Analytics', code: 'SOV-018', domain: 'sovereign_em', requiredEntities: ['sovereign_bond','scenario'], optionalEntities: ['company','impact_metric'], specificFields: {}, outputs: [] },
  'geo-transition-nexus':              { name: 'Geo Transition Nexus', code: 'SOV-019', domain: 'sovereign_em', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond','emissions'], specificFields: {}, outputs: [] },
  'mdb-climate-finance':               { name: 'MDB Climate Finance', code: 'SOV-020', domain: 'sovereign_em', requiredEntities: ['project_finance','impact_metric'], optionalEntities: ['sovereign_bond','scenario'], specificFields: {}, outputs: [] },
  'mdb-climate-finance-dh':            { name: 'MDB Climate Finance DH', code: 'SOV-021', domain: 'sovereign_em', requiredEntities: ['project_finance'], optionalEntities: ['sovereign_bond','impact_metric'], specificFields: {}, outputs: [] },
  // ── Real Estate & Infrastructure ──
  'real-estate-esg-hub':               { name: 'Real Estate ESG Hub', code: 'RE2-001', domain: 'real_estate', requiredEntities: ['real_estate_asset','esg_score'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'real-estate-carbon-analytics':       { name: 'Real Estate Carbon Analytics', code: 'RE2-002', domain: 'real_estate', requiredEntities: ['real_estate_asset','emissions'], optionalEntities: ['activity_data','company'], specificFields: {}, outputs: [] },
  'real-estate-climate-risk':           { name: 'Real Estate Climate Risk', code: 'RE2-003', domain: 'real_estate', requiredEntities: ['real_estate_asset','scenario'], optionalEntities: ['company','asset'], specificFields: {}, outputs: [] },
  'real-estate-valuation':              { name: 'Real Estate Valuation', code: 'RE2-004', domain: 'real_estate', requiredEntities: ['real_estate_asset','scenario'], optionalEntities: ['company','project_finance'], specificFields: {}, outputs: [] },
  'infrastructure-esg':                 { name: 'Infrastructure ESG', code: 'RE2-005', domain: 'real_estate', requiredEntities: ['asset','esg_score'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'infrastructure-climate-resilience':  { name: 'Infrastructure Climate Resilience', code: 'RE2-006', domain: 'real_estate', requiredEntities: ['asset','scenario'], optionalEntities: ['company','real_estate_asset'], specificFields: {}, outputs: [] },
  'infrastructure-resilience-scorer':   { name: 'Infrastructure Resilience Scorer', code: 'RE2-007', domain: 'real_estate', requiredEntities: ['asset','scenario'], optionalEntities: ['real_estate_asset','company'], specificFields: {}, outputs: [] },
  'infrastructure-valuation':           { name: 'Infrastructure Valuation', code: 'RE2-008', domain: 'real_estate', requiredEntities: ['asset','project_finance'], optionalEntities: ['scenario','company'], specificFields: {}, outputs: [] },
  'crrem':                              { name: 'CRREM', code: 'RE2-009', domain: 'real_estate', requiredEntities: ['real_estate_asset'], optionalEntities: ['scenario','company'], specificFields: {}, outputs: [] },
  'green-building-certification':       { name: 'Green Building Certification', code: 'RE2-010', domain: 'real_estate', requiredEntities: ['real_estate_asset'], optionalEntities: ['company','activity_data'], specificFields: {}, outputs: [] },
  'green-building-cert':                { name: 'Green Building Cert', code: 'RE2-011', domain: 'real_estate', requiredEntities: ['real_estate_asset'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'green-building-valuation':           { name: 'Green Building Valuation', code: 'RE2-012', domain: 'real_estate', requiredEntities: ['real_estate_asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'green-building-code-finance':        { name: 'Green Building Code Finance', code: 'RE2-013', domain: 'real_estate', requiredEntities: ['real_estate_asset','project_finance'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'building-energy-performance':        { name: 'Building Energy Performance', code: 'RE2-014', domain: 'real_estate', requiredEntities: ['real_estate_asset','activity_data'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'tenant-engagement-esg':              { name: 'Tenant Engagement ESG', code: 'RE2-015', domain: 'real_estate', requiredEntities: ['real_estate_asset','company'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'property-physical-risk':             { name: 'Property Physical Risk', code: 'RE2-016', domain: 'real_estate', requiredEntities: ['real_estate_asset','scenario'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'residential-re-assessment':          { name: 'Residential RE Assessment', code: 'RE2-017', domain: 'real_estate', requiredEntities: ['real_estate_asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'coastal-flood-risk-finance':         { name: 'Coastal Flood Risk Finance', code: 'RE2-018', domain: 'real_estate', requiredEntities: ['asset','scenario'], optionalEntities: ['real_estate_asset','company'], specificFields: {}, outputs: [] },
  'port-climate-risk':                  { name: 'Port Climate Risk', code: 'RE2-019', domain: 'real_estate', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'city-climate-risk-rating':           { name: 'City Climate Risk Rating', code: 'RE2-020', domain: 'real_estate', requiredEntities: ['scenario'], optionalEntities: ['asset','real_estate_asset','sovereign_bond'], specificFields: {}, outputs: [] },
  'city-net-zero-tracker':              { name: 'City Net Zero Tracker', code: 'RE2-021', domain: 'real_estate', requiredEntities: ['company','scenario'], optionalEntities: ['real_estate_asset','emissions'], specificFields: {}, outputs: [] },
  'urban-climate-adaptation':           { name: 'Urban Climate Adaptation', code: 'RE2-022', domain: 'real_estate', requiredEntities: ['scenario','asset'], optionalEntities: ['real_estate_asset','company'], specificFields: {}, outputs: [] },
  'urban-mobility-transition':          { name: 'Urban Mobility Transition', code: 'RE2-023', domain: 'real_estate', requiredEntities: ['company','scenario'], optionalEntities: ['asset','activity_data'], specificFields: {}, outputs: [] },
  'smart-city-climate-finance':         { name: 'Smart City Climate Finance', code: 'RE2-024', domain: 'real_estate', requiredEntities: ['company','project_finance'], optionalEntities: ['real_estate_asset','scenario'], specificFields: {}, outputs: [] },
  // ── Green Finance & Bonds ──
  'green-bond-portfolio-analytics':     { name: 'Green Bond Portfolio Analytics', code: 'GF-001', domain: 'green_finance', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['esg_score','corporate_deal'], specificFields: {}, outputs: [] },
  'green-bond-portfolio-optimizer':     { name: 'Green Bond Portfolio Optimizer', code: 'GF-002', domain: 'green_finance', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['corporate_deal'], specificFields: {}, outputs: [] },
  'green-asset-ratio':                  { name: 'Green Asset Ratio', code: 'GF-003', domain: 'green_finance', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['corporate_deal','real_estate_asset'], specificFields: {}, outputs: [] },
  'green-loan-framework':               { name: 'Green Loan Framework', code: 'GF-004', domain: 'green_finance', requiredEntities: ['company','corporate_deal'], optionalEntities: ['emissions','climate_target'], specificFields: {}, outputs: [] },
  'eu-taxonomy':                        { name: 'EU Taxonomy', code: 'GF-005', domain: 'green_finance', requiredEntities: ['company','esg_score','regulatory_filing'], optionalEntities: ['emissions','activity_data'], specificFields: {}, outputs: [] },
  'eu-taxonomy-engine':                 { name: 'EU Taxonomy Engine', code: 'GF-006', domain: 'green_finance', requiredEntities: ['company','esg_score'], optionalEntities: ['regulatory_filing','activity_data'], specificFields: {}, outputs: [] },
  'impact-bond-analytics':              { name: 'Impact Bond Analytics', code: 'GF-007', domain: 'green_finance', requiredEntities: ['corporate_deal','impact_metric'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'social-bond':                        { name: 'Social Bond', code: 'GF-008', domain: 'green_finance', requiredEntities: ['company','corporate_deal','impact_metric'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'sdg-bond-impact':                    { name: 'SDG Bond Impact', code: 'GF-009', domain: 'green_finance', requiredEntities: ['corporate_deal','impact_metric'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'cat-bond-ils':                       { name: 'Cat Bond ILS', code: 'GF-010', domain: 'green_finance', requiredEntities: ['actuarial_data','scenario'], optionalEntities: ['company','corporate_deal'], specificFields: {}, outputs: [] },
  'municipal-green-bond':               { name: 'Municipal Green Bond', code: 'GF-011', domain: 'green_finance', requiredEntities: ['corporate_deal','impact_metric'], optionalEntities: ['sovereign_bond','scenario'], specificFields: {}, outputs: [] },
  'greenium-signal':                    { name: 'Greenium Signal', code: 'GF-012', domain: 'green_finance', requiredEntities: ['corporate_deal','company'], optionalEntities: ['esg_score','scenario'], specificFields: {}, outputs: [] },
  'transition-bond-credibility':        { name: 'Transition Bond Credibility', code: 'GF-013', domain: 'green_finance', requiredEntities: ['company','corporate_deal','climate_target'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'blended-finance':                    { name: 'Blended Finance', code: 'GF-014', domain: 'green_finance', requiredEntities: ['project_finance','impact_metric'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'blended-finance-structurer':         { name: 'Blended Finance Structurer', code: 'GF-015', domain: 'green_finance', requiredEntities: ['project_finance','impact_metric','company'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'climate-blended-finance':            { name: 'Climate Blended Finance', code: 'GF-016', domain: 'green_finance', requiredEntities: ['project_finance','company'], optionalEntities: ['impact_metric','scenario','sovereign_bond'], specificFields: {}, outputs: [] },
  'climate-bond-index-tracker':         { name: 'Climate Bond Index Tracker', code: 'GF-017', domain: 'green_finance', requiredEntities: ['portfolio_holding','corporate_deal'], optionalEntities: ['company','esg_score'], specificFields: {}, outputs: [] },
  'adaptation-finance':                 { name: 'Adaptation Finance', code: 'GF-018', domain: 'green_finance', requiredEntities: ['project_finance','scenario'], optionalEntities: ['company','impact_metric'], specificFields: {}, outputs: [] },
  'loss-and-damage-finance':            { name: 'Loss and Damage Finance', code: 'GF-019', domain: 'green_finance', requiredEntities: ['scenario','impact_metric'], optionalEntities: ['company','sovereign_bond'], specificFields: {}, outputs: [] },
  'loss-damage':                        { name: 'Loss & Damage', code: 'GF-020', domain: 'green_finance', requiredEntities: ['scenario'], optionalEntities: ['impact_metric','sovereign_bond','company'], specificFields: {}, outputs: [] },
  'climate-finance-hub':                { name: 'Climate Finance Hub', code: 'GF-021', domain: 'green_finance', requiredEntities: ['company','project_finance'], optionalEntities: ['corporate_deal','impact_metric'], specificFields: {}, outputs: [] },
  'climate-finance-tracker':            { name: 'Climate Finance Tracker', code: 'GF-022', domain: 'green_finance', requiredEntities: ['company','project_finance'], optionalEntities: ['impact_metric','scenario'], specificFields: {}, outputs: [] },
  'climate-tech':                       { name: 'Climate Tech', code: 'GF-023', domain: 'green_finance', requiredEntities: ['company','project_finance'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'cleantech-investment':               { name: 'Cleantech Investment', code: 'GF-024', domain: 'green_finance', requiredEntities: ['company','project_finance'], optionalEntities: ['emissions','impact_metric'], specificFields: {}, outputs: [] },
  'air-quality-finance':                { name: 'Air Quality Finance', code: 'GF-025', domain: 'green_finance', requiredEntities: ['company','project_finance'], optionalEntities: ['activity_data','scenario'], specificFields: {}, outputs: [] },
  'air-quality-investment':             { name: 'Air Quality Investment', code: 'GF-026', domain: 'green_finance', requiredEntities: ['company','scenario'], optionalEntities: ['activity_data','impact_metric'], specificFields: {}, outputs: [] },
  'circular-economy-finance':           { name: 'Circular Economy Finance', code: 'GF-027', domain: 'green_finance', requiredEntities: ['company','activity_data'], optionalEntities: ['project_finance','impact_metric'], specificFields: {}, outputs: [] },
  'circular-economy-tracker':           { name: 'Circular Economy Tracker', code: 'GF-028', domain: 'green_finance', requiredEntities: ['company','activity_data'], optionalEntities: ['supplier','emissions'], specificFields: {}, outputs: [] },
  'climate-solution-taxonomy':          { name: 'Climate Solution Taxonomy', code: 'GF-029', domain: 'green_finance', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','regulatory_filing'], specificFields: {}, outputs: [] },
  'green-taxonomy-navigator':           { name: 'Green Taxonomy Navigator', code: 'GF-030', domain: 'green_finance', requiredEntities: ['company','esg_score','regulatory_filing'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'climate-nature-repo':                { name: 'Climate Nature Repo', code: 'GF-031', domain: 'green_finance', requiredEntities: ['company','nature_asset'], optionalEntities: ['sovereign_bond','corporate_deal'], specificFields: {}, outputs: [] },
  'sll-slb-v2':                         { name: 'SLL/SLB v2', code: 'GF-032', domain: 'green_finance', requiredEntities: ['company','corporate_deal','climate_target'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'ndc-alignment-tracker':              { name: 'NDC Alignment Tracker', code: 'GF-033', domain: 'green_finance', requiredEntities: ['company','climate_target','scenario'], optionalEntities: ['sovereign_bond','regulatory_filing'], specificFields: {}, outputs: [] },
  // ── Governance & Social ──
  'board-climate-competence':           { name: 'Board Climate Competence', code: 'GOV-001', domain: 'governance_social', requiredEntities: ['company','board_member'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'board-climate-oversight':            { name: 'Board Climate Oversight', code: 'GOV-002', domain: 'governance_social', requiredEntities: ['company','board_member'], optionalEntities: ['esg_score','regulatory_filing'], specificFields: {}, outputs: [] },
  'board-composition':                  { name: 'Board Composition', code: 'GOV-003', domain: 'governance_social', requiredEntities: ['company','board_member'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'governance-hub':                     { name: 'Governance Hub', code: 'GOV-004', domain: 'governance_social', requiredEntities: ['company','board_member','esg_score'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'corporate-governance':               { name: 'Corporate Governance', code: 'GOV-005', domain: 'governance_social', requiredEntities: ['company','board_member'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'diversity-equity-inclusion':         { name: 'Diversity Equity Inclusion', code: 'GOV-006', domain: 'governance_social', requiredEntities: ['company','board_member'], optionalEntities: ['esg_score','impact_metric'], specificFields: {}, outputs: [] },
  'human-rights-dd':                    { name: 'Human Rights DD', code: 'GOV-007', domain: 'governance_social', requiredEntities: ['company','supplier'], optionalEntities: ['impact_metric','regulatory_filing'], specificFields: {}, outputs: [] },
  'human-rights-risk':                  { name: 'Human Rights Risk', code: 'GOV-008', domain: 'governance_social', requiredEntities: ['company','supplier'], optionalEntities: ['commodity_exposure','impact_metric'], specificFields: {}, outputs: [] },
  'forced-labour':                      { name: 'Forced Labour', code: 'GOV-009', domain: 'governance_social', requiredEntities: ['company','supplier'], optionalEntities: ['commodity_exposure','impact_metric'], specificFields: {}, outputs: [] },
  'modern-slavery-intel':               { name: 'Modern Slavery Intel', code: 'GOV-010', domain: 'governance_social', requiredEntities: ['company','supplier'], optionalEntities: ['impact_metric','esg_score'], specificFields: {}, outputs: [] },
  'living-wage':                        { name: 'Living Wage', code: 'GOV-011', domain: 'governance_social', requiredEntities: ['company','supplier'], optionalEntities: ['impact_metric','board_member'], specificFields: {}, outputs: [] },
  'living-wage-tracker':                { name: 'Living Wage Tracker', code: 'GOV-012', domain: 'governance_social', requiredEntities: ['company','supplier','impact_metric'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'anti-corruption':                    { name: 'Anti-Corruption', code: 'GOV-013', domain: 'governance_social', requiredEntities: ['company','esg_score'], optionalEntities: ['board_member','regulatory_filing'], specificFields: {}, outputs: [] },
  'conflict-minerals':                  { name: 'Conflict Minerals', code: 'GOV-014', domain: 'governance_social', requiredEntities: ['company','supplier','commodity_exposure'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'indigenous-rights-fpic':             { name: 'Indigenous Rights FPIC', code: 'GOV-015', domain: 'governance_social', requiredEntities: ['company','nature_asset'], optionalEntities: ['impact_metric','supplier'], specificFields: {}, outputs: [] },
  'executive-pay-analytics':            { name: 'Executive Pay Analytics', code: 'GOV-016', domain: 'governance_social', requiredEntities: ['company','board_member'], optionalEntities: ['esg_score','emissions'], specificFields: {}, outputs: [] },
  'climate-executive-pay':              { name: 'Climate Executive Pay', code: 'GOV-017', domain: 'governance_social', requiredEntities: ['company','board_member','climate_target'], optionalEntities: ['esg_score','emissions'], specificFields: {}, outputs: [] },
  'proxy-voting-climate':               { name: 'Proxy Voting Climate', code: 'GOV-018', domain: 'governance_social', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['esg_score','board_member'], specificFields: {}, outputs: [] },
  'proxy-voting-intel':                 { name: 'Proxy Voting Intel', code: 'GOV-019', domain: 'governance_social', requiredEntities: ['company','portfolio_holding','board_member'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'shareholder-activism':               { name: 'Shareholder Activism', code: 'GOV-020', domain: 'governance_social', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['board_member','esg_score'], specificFields: {}, outputs: [] },
  'shareholder-climate-engagement':     { name: 'Shareholder Climate Engagement', code: 'GOV-021', domain: 'governance_social', requiredEntities: ['company','portfolio_holding','esg_score'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'shareholder-resolution-analyzer':    { name: 'Shareholder Resolution Analyzer', code: 'GOV-022', domain: 'governance_social', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['board_member','esg_score'], specificFields: {}, outputs: [] },
  'corporate-just-transition':          { name: 'Corporate Just Transition', code: 'GOV-023', domain: 'governance_social', requiredEntities: ['company','climate_target'], optionalEntities: ['impact_metric','supplier'], specificFields: {}, outputs: [] },
  'workforce-transition-tracker':       { name: 'Workforce Transition Tracker', code: 'GOV-024', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['supplier','scenario'], specificFields: {}, outputs: [] },
  'green-jobs-growth':                  { name: 'Green Jobs Growth', code: 'GOV-025', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'green-jobs-pipeline-tracker':        { name: 'Green Jobs Pipeline Tracker', code: 'GOV-026', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'worker-heat-stress':                 { name: 'Worker Heat Stress', code: 'GOV-027', domain: 'governance_social', requiredEntities: ['company','asset','scenario'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'employee-wellbeing':                 { name: 'Employee Wellbeing', code: 'GOV-028', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'mental-health-climate-risk':         { name: 'Mental Health Climate Risk', code: 'GOV-029', domain: 'governance_social', requiredEntities: ['company','scenario'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'workplace-health-safety':            { name: 'Workplace Health Safety', code: 'GOV-030', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'community-climate-resilience':       { name: 'Community Climate Resilience', code: 'GOV-031', domain: 'governance_social', requiredEntities: ['company','scenario'], optionalEntities: ['impact_metric','nature_asset'], specificFields: {}, outputs: [] },
  'community-impact':                   { name: 'Community Impact', code: 'GOV-032', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['nature_asset'], specificFields: {}, outputs: [] },
  'social-license-risk':                { name: 'Social License Risk', code: 'GOV-033', domain: 'governance_social', requiredEntities: ['company','esg_score'], optionalEntities: ['impact_metric','supplier'], specificFields: {}, outputs: [] },
  'stakeholder-impact':                 { name: 'Stakeholder Impact', code: 'GOV-034', domain: 'governance_social', requiredEntities: ['company','impact_metric'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'conflict-stability-tracker':         { name: 'Conflict Stability Tracker', code: 'GOV-035', domain: 'governance_social', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond'], specificFields: {}, outputs: [] },
  'wellbeing-adjusted-returns':         { name: 'Wellbeing-Adjusted Returns', code: 'GOV-036', domain: 'governance_social', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['impact_metric','esg_score'], specificFields: {}, outputs: [] },
  // ── Scenario & Stress Testing ──
  'ngfs-scenarios':                      { name: 'NGFS Scenarios', code: 'SCN-001', domain: 'scenario_stress', requiredEntities: ['scenario'], optionalEntities: ['portfolio_holding','company','emissions'], specificFields: {}, outputs: [] },
  'ngfs-iea-scenario':                   { name: 'NGFS IEA Scenario', code: 'SCN-002', domain: 'scenario_stress', requiredEntities: ['scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'stochastic-scenarios':                { name: 'Stochastic Scenarios', code: 'SCN-003', domain: 'scenario_stress', requiredEntities: ['scenario','portfolio_holding'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'scenario-blending-optimizer':         { name: 'Scenario Blending Optimizer', code: 'SCN-004', domain: 'scenario_stress', requiredEntities: ['scenario','portfolio_holding'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'scenario-conditional-prediction':     { name: 'Scenario Conditional Prediction', code: 'SCN-005', domain: 'scenario_stress', requiredEntities: ['scenario','company','portfolio_holding'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'monte-carlo-climate':                 { name: 'Monte Carlo Climate', code: 'SCN-006', domain: 'scenario_stress', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'monte-carlo-var':                     { name: 'Monte Carlo VaR', code: 'SCN-007', domain: 'scenario_stress', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'monte-carlo-uncertainty-engine':      { name: 'Monte Carlo Uncertainty Engine', code: 'SCN-008', domain: 'scenario_stress', requiredEntities: ['scenario'], optionalEntities: ['portfolio_holding','company','emissions'], specificFields: {}, outputs: [] },
  'tail-risk-analyzer':                  { name: 'Tail Risk Analyzer', code: 'SCN-009', domain: 'scenario_stress', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'copula-tail-risk':                    { name: 'Copula Tail Risk', code: 'SCN-010', domain: 'scenario_stress', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'compound-event-modeler':              { name: 'Compound Event Modeler', code: 'SCN-011', domain: 'scenario_stress', requiredEntities: ['asset','scenario'], optionalEntities: ['company','portfolio_holding'], specificFields: {}, outputs: [] },
  'damage-function-calculator':          { name: 'Damage Function Calculator', code: 'SCN-012', domain: 'scenario_stress', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'climate-physical-risk':               { name: 'Climate Physical Risk', code: 'SCN-013', domain: 'scenario_stress', requiredEntities: ['asset','scenario'], optionalEntities: ['company','portfolio_holding'], specificFields: {}, outputs: [] },
  'physical-transition-nexus':           { name: 'Physical Transition Nexus', code: 'SCN-014', domain: 'scenario_stress', requiredEntities: ['company','asset','scenario'], optionalEntities: ['portfolio_holding','emissions'], specificFields: {}, outputs: [] },
  'physical-risk-early-warning':         { name: 'Physical Risk Early Warning', code: 'SCN-015', domain: 'scenario_stress', requiredEntities: ['asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'regional-climate-impact':             { name: 'Regional Climate Impact', code: 'SCN-016', domain: 'scenario_stress', requiredEntities: ['scenario'], optionalEntities: ['asset','company','sovereign_bond'], specificFields: {}, outputs: [] },
  'regional-economic-impact':            { name: 'Regional Economic Impact', code: 'SCN-017', domain: 'scenario_stress', requiredEntities: ['scenario','company'], optionalEntities: ['sovereign_bond','asset'], specificFields: {}, outputs: [] },
  'natcat-loss-engine':                  { name: 'NatCat Loss Engine', code: 'SCN-018', domain: 'scenario_stress', requiredEntities: ['asset','actuarial_data','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'implied-temp-regression':             { name: 'Implied Temperature Regression', code: 'SCN-019', domain: 'scenario_stress', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'climate-displacement-risk':           { name: 'Climate Displacement Risk', code: 'SCN-020', domain: 'scenario_stress', requiredEntities: ['scenario'], optionalEntities: ['asset','company'], specificFields: {}, outputs: [] },
  'climate-migration-risk':              { name: 'Climate Migration Risk', code: 'SCN-021', domain: 'scenario_stress', requiredEntities: ['scenario'], optionalEntities: ['company','asset'], specificFields: {}, outputs: [] },
  'tech-disruption-watchlist':           { name: 'Tech Disruption Watchlist', code: 'SCN-022', domain: 'scenario_stress', requiredEntities: ['company','scenario'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'tech-displacement-modeler':           { name: 'Tech Displacement Modeler', code: 'SCN-023', domain: 'scenario_stress', requiredEntities: ['company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  // ── Transition Planning & Net Zero ──
  'transition-planning-hub':             { name: 'Transition Planning Hub', code: 'TPN-001', domain: 'transition_planning', requiredEntities: ['company','climate_target'], optionalEntities: ['emissions','scenario','regulatory_filing'], specificFields: {}, outputs: [] },
  'transition-plan-builder':             { name: 'Transition Plan Builder', code: 'TPN-002', domain: 'transition_planning', requiredEntities: ['company','climate_target','emissions'], optionalEntities: ['scenario','regulatory_filing'], specificFields: {}, outputs: [] },
  'net-zero-portfolio-alignment':        { name: 'Net Zero Portfolio Alignment', code: 'TPN-003', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','climate_target'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'net-zero-portfolio-builder':          { name: 'Net Zero Portfolio Builder', code: 'TPN-004', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['climate_target','scenario','emissions'], specificFields: {}, outputs: [] },
  'net-zero-credibility-index':          { name: 'Net Zero Credibility Index', code: 'TPN-005', domain: 'transition_planning', requiredEntities: ['company','climate_target'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'net-zero-commitment-tracker':         { name: 'Net Zero Commitment Tracker', code: 'TPN-006', domain: 'transition_planning', requiredEntities: ['company','climate_target'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'decarbonisation-hub':                 { name: 'Decarbonisation Hub', code: 'TPN-007', domain: 'transition_planning', requiredEntities: ['company','emissions','climate_target'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'decarbonisation-roadmap':             { name: 'Decarbonisation Roadmap', code: 'TPN-008', domain: 'transition_planning', requiredEntities: ['company','emissions','climate_target','scenario'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'sbti-target-setter':                  { name: 'SBTi Target Setter', code: 'TPN-009', domain: 'transition_planning', requiredEntities: ['company','emissions','climate_target'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'sbti-credibility-scorer':             { name: 'SBTi Credibility Scorer', code: 'TPN-010', domain: 'transition_planning', requiredEntities: ['company','climate_target'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'sbti-climate-trace':                  { name: 'SBTi Climate Trace', code: 'TPN-011', domain: 'transition_planning', requiredEntities: ['company','emissions','climate_target'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'gfanz-sector-pathways':               { name: 'GFANZ Sector Pathways', code: 'TPN-012', domain: 'transition_planning', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'target-vs-action-tracker':            { name: 'Target vs Action Tracker', code: 'TPN-013', domain: 'transition_planning', requiredEntities: ['company','climate_target','emissions'], optionalEntities: ['scenario','regulatory_filing'], specificFields: {}, outputs: [] },
  'climate-benchmark-constructor':       { name: 'Climate Benchmark Constructor', code: 'TPN-014', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario','climate_target'], specificFields: {}, outputs: [] },
  'multi-dim-transition-scorer':         { name: 'Multi-Dim Transition Scorer', code: 'TPN-015', domain: 'transition_planning', requiredEntities: ['company','emissions','climate_target'], optionalEntities: ['esg_score','scenario'], specificFields: {}, outputs: [] },
  'transition-credibility':              { name: 'Transition Credibility', code: 'TPN-016', domain: 'transition_planning', requiredEntities: ['company','climate_target','emissions'], optionalEntities: ['esg_score','regulatory_filing'], specificFields: {}, outputs: [] },
  'transition-finance':                  { name: 'Transition Finance', code: 'TPN-017', domain: 'transition_planning', requiredEntities: ['company','corporate_deal','climate_target'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'transition-finance-screener':         { name: 'Transition Finance Screener', code: 'TPN-018', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['climate_target','corporate_deal'], specificFields: {}, outputs: [] },
  'transition-reg-reporting':            { name: 'Transition Reg Reporting', code: 'TPN-019', domain: 'transition_planning', requiredEntities: ['company','regulatory_filing','climate_target'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'transition-alpha-signal-generator':   { name: 'Transition Alpha Signal Generator', code: 'TPN-020', domain: 'transition_planning', requiredEntities: ['company','emissions','portfolio_holding'], optionalEntities: ['climate_target','scenario'], specificFields: {}, outputs: [] },
  'abatement-cost-curve':                { name: 'Abatement Cost Curve', code: 'TPN-021', domain: 'transition_planning', requiredEntities: ['company','emissions','activity_data'], optionalEntities: ['scenario','climate_target'], specificFields: {}, outputs: [] },
  'negative-emissions-tech':             { name: 'Negative Emissions Tech', code: 'TPN-022', domain: 'transition_planning', requiredEntities: ['company','activity_data'], optionalEntities: ['scenario','impact_metric'], specificFields: {}, outputs: [] },
  'scope4-avoided-emissions':            { name: 'Scope 4 Avoided Emissions', code: 'TPN-023', domain: 'transition_planning', requiredEntities: ['company','emissions','activity_data'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'climate-policy-intelligence':         { name: 'Climate Policy Intelligence', code: 'TPN-024', domain: 'transition_planning', requiredEntities: ['company','scenario'], optionalEntities: ['regulatory_filing','sovereign_bond'], specificFields: {}, outputs: [] },
  'climate-policy':                      { name: 'Climate Policy', code: 'TPN-025', domain: 'transition_planning', requiredEntities: ['company','scenario'], optionalEntities: ['regulatory_filing','sovereign_bond'], specificFields: {}, outputs: [] },
  'climate-reg-policy-tracker':          { name: 'Climate Reg Policy Tracker', code: 'TPN-026', domain: 'transition_planning', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'regulatory-horizon':                  { name: 'Regulatory Horizon', code: 'TPN-027', domain: 'transition_planning', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'regulatory-change-radar':             { name: 'Regulatory Change Radar', code: 'TPN-028', domain: 'transition_planning', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['scenario','esg_score'], specificFields: {}, outputs: [] },
  'carbon-aware-allocation':             { name: 'Carbon-Aware Allocation', code: 'TPN-029', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario','climate_target'], specificFields: {}, outputs: [] },
  'portfolio-transition-alignment':      { name: 'Portfolio Transition Alignment', code: 'TPN-030', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','climate_target'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'portfolio-climate-pulse':             { name: 'Portfolio Climate Pulse', code: 'TPN-031', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'portfolio-climate-var':               { name: 'Portfolio Climate VaR', code: 'TPN-032', domain: 'transition_planning', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'portfolio-stress-test-drilldown':     { name: 'Portfolio Stress Test Drilldown', code: 'TPN-033', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'portfolio-optimizer':                 { name: 'Portfolio Optimizer', code: 'TPN-034', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['scenario','esg_score','emissions'], specificFields: {}, outputs: [] },
  'portfolio-suite':                     { name: 'Portfolio Suite', code: 'TPN-035', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario','climate_target'], specificFields: {}, outputs: [] },
  'climate-portfolio-optimizer':         { name: 'Climate Portfolio Optimizer', code: 'TPN-036', domain: 'transition_planning', requiredEntities: ['portfolio_holding','company','emissions','scenario'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  // ── Geopolitical & Trade ──
  'geopolitical-dashboard':              { name: 'Geopolitical Dashboard', code: 'GEO-001', domain: 'geopolitical', requiredEntities: ['company','scenario'], optionalEntities: ['commodity_exposure','sovereign_bond'], specificFields: {}, outputs: [] },
  'geopolitical-esg-hub':                { name: 'Geopolitical ESG Hub', code: 'GEO-002', domain: 'geopolitical', requiredEntities: ['company','esg_score'], optionalEntities: ['sovereign_bond','commodity_exposure'], specificFields: {}, outputs: [] },
  'geopolitical-risk-index':             { name: 'Geopolitical Risk Index', code: 'GEO-003', domain: 'geopolitical', requiredEntities: ['company','scenario'], optionalEntities: ['sovereign_bond','commodity_exposure'], specificFields: {}, outputs: [] },
  'geopolitical-ai-gov':                 { name: 'Geopolitical AI Gov', code: 'GEO-004', domain: 'geopolitical', requiredEntities: ['company','scenario'], optionalEntities: ['esg_score','sovereign_bond'], specificFields: {}, outputs: [] },
  'climate-trade-flow-analytics':        { name: 'Climate Trade Flow Analytics', code: 'GEO-005', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure'], optionalEntities: ['scenario','cbam_product'], specificFields: {}, outputs: [] },
  'critical-minerals':                   { name: 'Critical Minerals', code: 'GEO-006', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'critical-mineral-geopolitics':        { name: 'Critical Mineral Geopolitics', code: 'GEO-007', domain: 'geopolitical', requiredEntities: ['commodity_exposure','scenario'], optionalEntities: ['company','sovereign_bond'], specificFields: {}, outputs: [] },
  'critical-mineral-geo-risk':           { name: 'Critical Mineral Geo Risk', code: 'GEO-008', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure','scenario'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'critical-mineral-constraint':         { name: 'Critical Mineral Constraint', code: 'GEO-009', domain: 'geopolitical', requiredEntities: ['commodity_exposure','scenario'], optionalEntities: ['company','renewable_project'], specificFields: {}, outputs: [] },
  'commodity-hub':                       { name: 'Commodity Hub', code: 'GEO-010', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'commodity-intelligence':              { name: 'Commodity Intelligence', code: 'GEO-011', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure'], optionalEntities: ['scenario','esg_score'], specificFields: {}, outputs: [] },
  'commodity-inventory':                 { name: 'Commodity Inventory', code: 'GEO-012', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'commodity-derivatives-climate':       { name: 'Commodity Derivatives Climate', code: 'GEO-013', domain: 'geopolitical', requiredEntities: ['commodity_exposure','scenario'], optionalEntities: ['company','portfolio_holding'], specificFields: {}, outputs: [] },
  'et-commodity-risk':                   { name: 'ET Commodity Risk', code: 'GEO-014', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure','scenario'], optionalEntities: ['portfolio_holding'], specificFields: {}, outputs: [] },
  'climate-commodity-analytics':         { name: 'Climate Commodity Analytics', code: 'GEO-015', domain: 'geopolitical', requiredEntities: ['company','commodity_exposure','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'sanctions-climate-finance':           { name: 'Sanctions Climate Finance', code: 'GEO-016', domain: 'geopolitical', requiredEntities: ['company','scenario'], optionalEntities: ['commodity_exposure','sovereign_bond'], specificFields: {}, outputs: [] },
  'sanctions-trade-monitor':             { name: 'Sanctions Trade Monitor', code: 'GEO-017', domain: 'geopolitical', requiredEntities: ['company'], optionalEntities: ['commodity_exposure','sovereign_bond'], specificFields: {}, outputs: [] },
  'sanctions-watchlist':                 { name: 'Sanctions Watchlist', code: 'GEO-018', domain: 'geopolitical', requiredEntities: ['company'], optionalEntities: ['sovereign_bond','commodity_exposure'], specificFields: {}, outputs: [] },
  'shipping-decarbonisation':            { name: 'Shipping Decarbonisation', code: 'GEO-019', domain: 'geopolitical', requiredEntities: ['company','activity_data','emissions'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'maritime-imo-compliance':             { name: 'Maritime IMO Compliance', code: 'GEO-020', domain: 'geopolitical', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'transport-decarbonisation':           { name: 'Transport Decarbonisation', code: 'GEO-021', domain: 'geopolitical', requiredEntities: ['company','activity_data','emissions'], optionalEntities: ['asset','scenario'], specificFields: {}, outputs: [] },
  'grid-stability-transition':           { name: 'Grid Stability Transition', code: 'GEO-022', domain: 'geopolitical', requiredEntities: ['company','asset','scenario'], optionalEntities: ['renewable_project'], specificFields: {}, outputs: [] },
  'energy-security-transition':          { name: 'Energy Security Transition', code: 'GEO-023', domain: 'geopolitical', requiredEntities: ['company','scenario'], optionalEntities: ['commodity_exposure','renewable_project','sovereign_bond'], specificFields: {}, outputs: [] },
  'energy-transition-analytics':         { name: 'Energy Transition Analytics', code: 'GEO-024', domain: 'geopolitical', requiredEntities: ['company','scenario','emissions'], optionalEntities: ['commodity_exposure','renewable_project'], specificFields: {}, outputs: [] },
  'energy-transition-dashboard':         { name: 'Energy Transition Dashboard', code: 'GEO-025', domain: 'geopolitical', requiredEntities: ['company','scenario'], optionalEntities: ['emissions','renewable_project'], specificFields: {}, outputs: [] },
  'energy-transition-lending':           { name: 'Energy Transition Lending', code: 'GEO-026', domain: 'geopolitical', requiredEntities: ['company','corporate_deal'], optionalEntities: ['renewable_project','scenario'], specificFields: {}, outputs: [] },
  // ── Private Markets ──
  'pe-esg-diligence':                    { name: 'PE ESG Diligence', code: 'PM-001', domain: 'private_markets', requiredEntities: ['company','esg_score','emissions'], optionalEntities: ['board_member','corporate_deal'], specificFields: {}, outputs: [] },
  'pe-vc-esg':                           { name: 'PE/VC ESG', code: 'PM-002', domain: 'private_markets', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','impact_metric'], specificFields: {}, outputs: [] },
  'pe-deal-pipeline':                    { name: 'PE Deal Pipeline', code: 'PM-003', domain: 'private_markets', requiredEntities: ['company','corporate_deal'], optionalEntities: ['esg_score','emissions'], specificFields: {}, outputs: [] },
  'private-credit':                      { name: 'Private Credit', code: 'PM-004', domain: 'private_markets', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['corporate_deal','scenario'], specificFields: {}, outputs: [] },
  'private-credit-climate':              { name: 'Private Credit Climate', code: 'PM-005', domain: 'private_markets', requiredEntities: ['company','portfolio_holding','scenario'], optionalEntities: ['emissions','corporate_deal'], specificFields: {}, outputs: [] },
  'private-markets-esg-hub':             { name: 'Private Markets ESG Hub', code: 'PM-006', domain: 'private_markets', requiredEntities: ['company','esg_score','portfolio_holding'], optionalEntities: ['emissions','corporate_deal'], specificFields: {}, outputs: [] },
  'private-markets-hub':                 { name: 'Private Markets Hub', code: 'PM-007', domain: 'private_markets', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['esg_score','corporate_deal'], specificFields: {}, outputs: [] },
  'fund-of-funds':                       { name: 'Fund of Funds', code: 'PM-008', domain: 'private_markets', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['esg_score','scenario'], specificFields: {}, outputs: [] },
  'co-investment':                       { name: 'Co-Investment', code: 'PM-009', domain: 'private_markets', requiredEntities: ['company','portfolio_holding','corporate_deal'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'lp-reporting':                        { name: 'LP Reporting', code: 'PM-010', domain: 'private_markets', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['esg_score','impact_metric','emissions'], specificFields: {}, outputs: [] },
  'climate-banking-hub':                 { name: 'Climate Banking Hub', code: 'PM-011', domain: 'private_markets', requiredEntities: ['company','portfolio_holding'], optionalEntities: ['corporate_deal','scenario','emissions'], specificFields: {}, outputs: [] },
  'export-credit-esg':                   { name: 'Export Credit ESG', code: 'PM-012', domain: 'private_markets', requiredEntities: ['company','corporate_deal'], optionalEntities: ['esg_score','scenario'], specificFields: {}, outputs: [] },
  // ── Data Infrastructure ──
  'data-hub-ingester':                   { name: 'Data Hub Ingester', code: 'DI-001', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions','portfolio_holding'], specificFields: {}, outputs: [{ name: 'Ingested Records', entity: 'company', description: 'Bulk-imported entity records' }] },
  'data-source-registry':                { name: 'Data Source Registry', code: 'DI-002', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'data-source-manager':                 { name: 'Data Source Manager', code: 'DI-003', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'data-governance':                     { name: 'Data Governance', code: 'DI-004', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions','portfolio_holding'], specificFields: {}, outputs: [] },
  'data-lineage':                        { name: 'Data Lineage', code: 'DI-005', domain: 'data_infra', requiredEntities: ['company'], optionalEntities: ['emissions','portfolio_holding'], specificFields: {}, outputs: [] },
  'data-quality-monitor':                { name: 'Data Quality Monitor', code: 'DI-006', domain: 'data_infra', requiredEntities: ['company','emissions'], optionalEntities: ['portfolio_holding','esg_score'], specificFields: {}, outputs: [] },
  'data-quality-dashboard':              { name: 'Data Quality Dashboard', code: 'DI-007', domain: 'data_infra', requiredEntities: ['company','emissions'], optionalEntities: ['portfolio_holding'], specificFields: {}, outputs: [] },
  'data-validation':                     { name: 'Data Validation', code: 'DI-008', domain: 'data_infra', requiredEntities: ['company'], optionalEntities: ['emissions','portfolio_holding'], specificFields: {}, outputs: [] },
  'data-reconciliation':                 { name: 'Data Reconciliation', code: 'DI-009', domain: 'data_infra', requiredEntities: ['company','emissions'], optionalEntities: ['portfolio_holding'], specificFields: {}, outputs: [] },
  'data-versioning':                     { name: 'Data Versioning', code: 'DI-010', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'etl-pipeline':                        { name: 'ETL Pipeline', code: 'DI-011', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions','activity_data'], specificFields: {}, outputs: [] },
  'api-gateway-monitor':                 { name: 'API Gateway Monitor', code: 'DI-012', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'api-orchestration':                   { name: 'API Orchestration', code: 'DI-013', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'live-feed-manager':                   { name: 'Live Feed Manager', code: 'DI-014', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'iot-emissions-tracker':               { name: 'IoT Emissions Tracker', code: 'DI-015', domain: 'data_infra', requiredEntities: ['company','activity_data'], optionalEntities: ['asset','emissions'], specificFields: {}, outputs: [] },
  'calculation-engine-monitor':          { name: 'Calculation Engine Monitor', code: 'DI-016', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  'model-governance':                    { name: 'Model Governance', code: 'DI-017', domain: 'data_infra', requiredEntities: ['company'], optionalEntities: ['esg_score','regulatory_filing'], specificFields: {}, outputs: [] },
  'ml-governance-dashboard':             { name: 'ML Governance Dashboard', code: 'DI-018', domain: 'data_infra', requiredEntities: ['company'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'satellite-climate-monitor':           { name: 'Satellite Climate Monitor', code: 'DI-019', domain: 'data_infra', requiredEntities: ['asset','company'], optionalEntities: ['nature_asset','scenario'], specificFields: {}, outputs: [] },
  'climate-data-marketplace':            { name: 'Climate Data Marketplace', code: 'DI-020', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions','scenario'], specificFields: {}, outputs: [] },
  'reference-data-explorer':             { name: 'Reference Data Explorer', code: 'DI-021', domain: 'data_infra', requiredEntities: [], optionalEntities: ['company','emissions','activity_data'], specificFields: {}, outputs: [] },
  'db-explorer':                         { name: 'DB Explorer', code: 'DI-022', domain: 'data_infra', requiredEntities: [], optionalEntities: [], specificFields: {}, outputs: [] },
  // ── Carbon domain additions ──
  'carbon-footprint-intelligence':       { name: 'Carbon Footprint Intelligence', code: 'F-016', domain: 'carbon', requiredEntities: ['company','emissions'], optionalEntities: ['activity_data','supplier'], specificFields: {}, outputs: [] },
  'scope3-category-analytics':           { name: 'Scope 3 Category Analytics', code: 'F-017', domain: 'carbon', requiredEntities: ['company','emissions'], optionalEntities: ['supplier','activity_data'], specificFields: {}, outputs: [] },
  'scope3-materiality-engine':           { name: 'Scope 3 Materiality Engine', code: 'F-018', domain: 'carbon', requiredEntities: ['company','emissions'], optionalEntities: ['supplier','activity_data','scenario'], specificFields: {}, outputs: [] },
  'embodied-carbon':                     { name: 'Embodied Carbon', code: 'F-019', domain: 'carbon', requiredEntities: ['company','activity_data'], optionalEntities: ['emissions','asset'], specificFields: {}, outputs: [] },
  'digital-product-passport':            { name: 'Digital Product Passport', code: 'F-020', domain: 'carbon', requiredEntities: ['company','activity_data'], optionalEntities: ['supplier','emissions'], specificFields: {}, outputs: [] },
  'lifecycle-assessment':                { name: 'Lifecycle Assessment', code: 'F-021', domain: 'carbon', requiredEntities: ['company','activity_data'], optionalEntities: ['supplier','emissions'], specificFields: {}, outputs: [] },
  'product-carbon-handprint':            { name: 'Product Carbon Handprint', code: 'F-022', domain: 'carbon', requiredEntities: ['company','activity_data','emissions'], optionalEntities: ['supplier'], specificFields: {}, outputs: [] },
  'avoided-emissions-hub':               { name: 'Avoided Emissions Hub', code: 'F-023', domain: 'carbon', requiredEntities: ['company','emissions','activity_data'], optionalEntities: ['scenario','impact_metric'], specificFields: {}, outputs: [] },
  'avoided-emissions-portfolio':         { name: 'Avoided Emissions Portfolio', code: 'F-024', domain: 'carbon', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'hydrogen-economy-modeler':            { name: 'Hydrogen Economy Modeler', code: 'F-025', domain: 'carbon', requiredEntities: ['company','activity_data'], optionalEntities: ['renewable_project','scenario'], specificFields: {}, outputs: [] },
  // ── PCAF domain additions ──
  'portfolio-manager':                   { name: 'Portfolio Manager', code: 'P-009', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['climate_target','scenario'], specificFields: {}, outputs: [] },
  'holdings-deep-dive':                  { name: 'Holdings Deep Dive', code: 'P-010', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['esg_score','climate_target'], specificFields: {}, outputs: [] },
  'temperature-alignment':               { name: 'Temperature Alignment', code: 'P-011', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions','climate_target'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'temperature-alignment-waterfall':     { name: 'Temperature Alignment Waterfall', code: 'P-012', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['climate_target','scenario'], specificFields: {}, outputs: [] },
  'climate-aware-allocation':            { name: 'Climate-Aware Allocation', code: 'P-013', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions','scenario'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'fi-client-portfolio-analyzer':        { name: 'FI Client Portfolio Analyzer', code: 'P-014', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'fi-concentration-monitor':            { name: 'FI Concentration Monitor', code: 'P-015', domain: 'pcaf', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'fi-instrument-exposure':              { name: 'FI Instrument Exposure', code: 'P-016', domain: 'pcaf', requiredEntities: ['portfolio_holding','company'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'fi-line-of-business':                 { name: 'FI Line of Business', code: 'P-017', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','actuarial_data'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'fi-regulatory-capital-overlay':       { name: 'FI Regulatory Capital Overlay', code: 'P-018', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'fi-transition-dashboard':             { name: 'FI Transition Dashboard', code: 'P-019', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','emissions','scenario'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'owid-evic-analytics':                 { name: 'OWID EVIC Analytics', code: 'P-020', domain: 'pcaf', requiredEntities: ['company','portfolio_holding','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'fixed-income-esg':                    { name: 'Fixed Income ESG', code: 'P-021', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'real-assets-climate':                 { name: 'Real Assets Climate', code: 'P-022', domain: 'pcaf', requiredEntities: ['asset','portfolio_holding'], optionalEntities: ['company','scenario','real_estate_asset'], specificFields: {}, outputs: [] },
  'private-assets-transition':           { name: 'Private Assets Transition', code: 'P-023', domain: 'pcaf', requiredEntities: ['portfolio_holding','company','scenario'], optionalEntities: ['corporate_deal','emissions'], specificFields: {}, outputs: [] },
  'cross-asset-contagion':               { name: 'Cross-Asset Contagion', code: 'P-024', domain: 'pcaf', requiredEntities: ['portfolio_holding','scenario'], optionalEntities: ['company','emissions'], specificFields: {}, outputs: [] },
  // ── ESG domain additions ──
  'esg-ratings-comparator':              { name: 'ESG Ratings Comparator', code: 'E-009', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'esg-portfolio-optimizer':             { name: 'ESG Portfolio Optimizer', code: 'E-010', domain: 'esg', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'esg-screener':                        { name: 'ESG Screener', code: 'E-011', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','climate_target'], specificFields: {}, outputs: [] },
  'esg-integration-dashboard':           { name: 'ESG Integration Dashboard', code: 'E-012', domain: 'esg', requiredEntities: ['company','esg_score','portfolio_holding'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'esg-factor-alpha':                    { name: 'ESG Factor Alpha', code: 'E-013', domain: 'esg', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'esg-factor-attribution':              { name: 'ESG Factor Attribution', code: 'E-014', domain: 'esg', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'esg-data-quality':                    { name: 'ESG Data Quality', code: 'E-015', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','regulatory_filing'], specificFields: {}, outputs: [] },
  'esg-controversy':                     { name: 'ESG Controversy', code: 'E-016', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['board_member'], specificFields: {}, outputs: [] },
  'esg-momentum-scanner':                { name: 'ESG Momentum Scanner', code: 'E-017', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['portfolio_holding','emissions'], specificFields: {}, outputs: [] },
  'esg-governance-scorer':               { name: 'ESG Governance Scorer', code: 'E-018', domain: 'esg', requiredEntities: ['company','board_member','esg_score'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'esg-value-chain':                     { name: 'ESG Value Chain', code: 'E-019', domain: 'esg', requiredEntities: ['company','esg_score','supplier'], optionalEntities: ['emissions','activity_data'], specificFields: {}, outputs: [] },
  'esg-backtesting':                     { name: 'ESG Backtesting', code: 'E-020', domain: 'esg', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'controversy-monitor':                 { name: 'Controversy Monitor', code: 'E-021', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['board_member'], specificFields: {}, outputs: [] },
  'controversy-materiality':             { name: 'Controversy Materiality', code: 'E-022', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['board_member','regulatory_filing'], specificFields: {}, outputs: [] },
  'controversy-rating-impact':           { name: 'Controversy Rating Impact', code: 'E-023', domain: 'esg', requiredEntities: ['company','esg_score','portfolio_holding'], optionalEntities: [], specificFields: {}, outputs: [] },
  'greenwashing-detection':              { name: 'Greenwashing Detection', code: 'E-024', domain: 'esg', requiredEntities: ['company','esg_score','regulatory_filing'], optionalEntities: ['emissions','climate_target'], specificFields: {}, outputs: [] },
  'greenwashing-detector':               { name: 'Greenwashing Detector', code: 'E-025', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['regulatory_filing','climate_target'], specificFields: {}, outputs: [] },
  'greenwashing-exposure-monitor':       { name: 'Greenwashing Exposure Monitor', code: 'E-026', domain: 'esg', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'ratings-methodology-decoder':         { name: 'Ratings Methodology Decoder', code: 'E-027', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'ratings-migration-momentum':          { name: 'Ratings Migration Momentum', code: 'E-028', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['portfolio_holding'], specificFields: {}, outputs: [] },
  'peer-clustering-segmentation':        { name: 'Peer Clustering Segmentation', code: 'E-029', domain: 'esg', requiredEntities: ['company','esg_score','emissions'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'sector-benchmarking':                 { name: 'Sector Benchmarking', code: 'E-030', domain: 'esg', requiredEntities: ['company','emissions','esg_score'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'sector-peer-benchmarking-engine':     { name: 'Sector Peer Benchmarking Engine', code: 'E-031', domain: 'esg', requiredEntities: ['company','emissions','esg_score'], optionalEntities: ['climate_target','portfolio_holding'], specificFields: {}, outputs: [] },
  'sector-sustainability-benchmark':     { name: 'Sector Sustainability Benchmark', code: 'E-032', domain: 'esg', requiredEntities: ['company','emissions','esg_score'], optionalEntities: ['climate_target'], specificFields: {}, outputs: [] },
  'sector-transition-scorecard':         { name: 'Sector Transition Scorecard', code: 'E-033', domain: 'esg', requiredEntities: ['company','emissions','scenario'], optionalEntities: ['esg_score','climate_target'], specificFields: {}, outputs: [] },
  'quant-esg-hub':                       { name: 'Quant ESG Hub', code: 'E-034', domain: 'esg', requiredEntities: ['company','esg_score','portfolio_holding'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'quant-dashboard':                     { name: 'Quant Dashboard', code: 'E-035', domain: 'esg', requiredEntities: ['portfolio_holding','company','esg_score'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'social-alternative-data':             { name: 'Social Alternative Data', code: 'E-036', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'social-hub':                          { name: 'Social Hub', code: 'E-037', domain: 'esg', requiredEntities: ['company','esg_score','impact_metric'], optionalEntities: ['board_member'], specificFields: {}, outputs: [] },
  'social-taxonomy':                     { name: 'Social Taxonomy', code: 'E-038', domain: 'esg', requiredEntities: ['company','esg_score'], optionalEntities: ['impact_metric','regulatory_filing'], specificFields: {}, outputs: [] },
  'gri-alignment':                       { name: 'GRI Alignment', code: 'E-039', domain: 'esg', requiredEntities: ['company','regulatory_filing','emissions'], optionalEntities: ['esg_score','board_member'], specificFields: {}, outputs: [] },
  'gresb-scoring':                       { name: 'GRESB Scoring', code: 'E-040', domain: 'esg', requiredEntities: ['company','real_estate_asset','esg_score'], optionalEntities: ['board_member','regulatory_filing'], specificFields: {}, outputs: [] },
  'iris-metrics':                        { name: 'IRIS+ Metrics', code: 'E-041', domain: 'esg', requiredEntities: ['company','impact_metric','esg_score'], optionalEntities: ['board_member'], specificFields: {}, outputs: [] },
  'esms':                                { name: 'ESMS', code: 'E-042', domain: 'esg', requiredEntities: ['company','esg_score','regulatory_filing'], optionalEntities: ['board_member','emissions'], specificFields: {}, outputs: [] },
  'esrs-datapoint-navigator':            { name: 'ESRS Datapoint Navigator', code: 'E-043', domain: 'esg', requiredEntities: ['company','regulatory_filing','emissions'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'framework-interop':                   { name: 'Framework Interop', code: 'E-044', domain: 'esg', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['esg_score','emissions'], specificFields: {}, outputs: [] },
  'multi-standard-compliance':           { name: 'Multi-Standard Compliance', code: 'E-045', domain: 'esg', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  // ── Supply Chain additions ──
  'supply-chain-contagion':              { name: 'Supply Chain Contagion', code: 'S-006', domain: 'supply_chain', requiredEntities: ['company','supplier','scenario'], optionalEntities: ['commodity_exposure'], specificFields: {}, outputs: [] },
  'supply-chain-emissions-mapper':       { name: 'Supply Chain Emissions Mapper', code: 'S-007', domain: 'supply_chain', requiredEntities: ['company','supplier','emissions'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'supply-chain-esg-hub':                { name: 'Supply Chain ESG Hub', code: 'S-008', domain: 'supply_chain', requiredEntities: ['company','supplier','esg_score'], optionalEntities: ['emissions','board_member'], specificFields: {}, outputs: [] },
  'supply-chain-labor-climate':          { name: 'Supply Chain Labor Climate', code: 'S-009', domain: 'supply_chain', requiredEntities: ['company','supplier','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'supply-chain-map':                    { name: 'Supply Chain Map', code: 'S-010', domain: 'supply_chain', requiredEntities: ['company','supplier'], optionalEntities: ['commodity_exposure','emissions'], specificFields: {}, outputs: [] },
  'supply-chain-network-viz':            { name: 'Supply Chain Network Viz', code: 'S-011', domain: 'supply_chain', requiredEntities: ['company','supplier'], optionalEntities: ['commodity_exposure'], specificFields: {}, outputs: [] },
  'supply-chain-resilience':             { name: 'Supply Chain Resilience', code: 'S-012', domain: 'supply_chain', requiredEntities: ['company','supplier','scenario'], optionalEntities: ['commodity_exposure'], specificFields: {}, outputs: [] },
  'procurement-climate-risk':            { name: 'Procurement Climate Risk', code: 'S-013', domain: 'supply_chain', requiredEntities: ['company','supplier','scenario'], optionalEntities: ['commodity_exposure','emissions'], specificFields: {}, outputs: [] },
  'green-procurement-intelligence':      { name: 'Green Procurement Intelligence', code: 'S-014', domain: 'supply_chain', requiredEntities: ['company','supplier'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'supplier-esg-scorecard':              { name: 'Supplier ESG Scorecard', code: 'S-015', domain: 'supply_chain', requiredEntities: ['company','supplier','esg_score'], optionalEntities: ['emissions','board_member'], specificFields: {}, outputs: [] },
  'supplier-engagement':                 { name: 'Supplier Engagement', code: 'S-016', domain: 'supply_chain', requiredEntities: ['company','supplier'], optionalEntities: ['climate_target','esg_score'], specificFields: {}, outputs: [] },
  'energy-supplier-network':             { name: 'Energy Supplier Network', code: 'S-017', domain: 'supply_chain', requiredEntities: ['company','supplier','renewable_project'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'csddd-compliance':                    { name: 'CSDDD Compliance', code: 'S-018', domain: 'supply_chain', requiredEntities: ['company','supplier','regulatory_filing'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'csddd-engine':                        { name: 'CSDDD Engine', code: 'S-019', domain: 'supply_chain', requiredEntities: ['company','supplier','regulatory_filing'], optionalEntities: ['impact_metric'], specificFields: {}, outputs: [] },
  'eudr-engine':                         { name: 'EUDR Engine', code: 'S-020', domain: 'supply_chain', requiredEntities: ['company','supplier','nature_asset'], optionalEntities: ['commodity_exposure','regulatory_filing'], specificFields: {}, outputs: [] },
  'plastics-pollution-finance':          { name: 'Plastics Pollution Finance', code: 'S-021', domain: 'supply_chain', requiredEntities: ['company','activity_data'], optionalEntities: ['supplier','emissions'], specificFields: {}, outputs: [] },
  'waste-to-energy-finance':             { name: 'Waste-to-Energy Finance', code: 'S-022', domain: 'supply_chain', requiredEntities: ['company','activity_data','project_finance'], optionalEntities: ['emissions','renewable_project'], specificFields: {}, outputs: [] },
  'resource-efficiency-analytics':       { name: 'Resource Efficiency Analytics', code: 'S-023', domain: 'supply_chain', requiredEntities: ['company','activity_data','emissions'], optionalEntities: ['supplier'], specificFields: {}, outputs: [] },
  // ── Disclosure additions ──
  'sec-climate-disclosure':              { name: 'SEC Climate Disclosure', code: 'D-013', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['scenario','esg_score'], specificFields: {}, outputs: [] },
  'sec-climate-rule':                    { name: 'SEC Climate Rule', code: 'D-014', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'uk-sdr':                              { name: 'UK SDR', code: 'D-015', domain: 'disclosure', requiredEntities: ['company','portfolio_holding','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'xbrl-climate-taxonomy':               { name: 'XBRL Climate Taxonomy', code: 'D-016', domain: 'disclosure', requiredEntities: ['company','regulatory_filing','emissions'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'xbrl-export-wizard':                  { name: 'XBRL Export Wizard', code: 'D-017', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'xbrl-ingestion':                      { name: 'XBRL Ingestion', code: 'D-018', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'brsr-bridge':                         { name: 'BRSR Bridge', code: 'D-019', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['board_member','esg_score'], specificFields: {}, outputs: [] },
  'sfdr-pai-dashboard':                  { name: 'SFDR PAI Dashboard', code: 'D-020', domain: 'disclosure', requiredEntities: ['company','emissions','portfolio_holding','water_footprint','board_member'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'double-materiality':                  { name: 'Double Materiality', code: 'D-021', domain: 'disclosure', requiredEntities: ['company','esg_score'], optionalEntities: ['emissions','board_member','regulatory_filing'], specificFields: {}, outputs: [] },
  'double-materiality-workshop':         { name: 'Double Materiality Workshop', code: 'D-022', domain: 'disclosure', requiredEntities: ['company','esg_score','regulatory_filing'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'materiality-hub':                     { name: 'Materiality Hub', code: 'D-023', domain: 'disclosure', requiredEntities: ['company','esg_score','regulatory_filing'], optionalEntities: ['emissions','board_member'], specificFields: {}, outputs: [] },
  'materiality-scenarios':               { name: 'Materiality Scenarios', code: 'D-024', domain: 'disclosure', requiredEntities: ['company','esg_score','scenario'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'materiality-trends':                  { name: 'Materiality Trends', code: 'D-025', domain: 'disclosure', requiredEntities: ['company','esg_score'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'disclosure-hub':                      { name: 'Disclosure Hub', code: 'D-026', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'assurance-readiness-engine':          { name: 'Assurance Readiness Engine', code: 'D-027', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'assessment-audit-trail-v2':           { name: 'Assessment Audit Trail v2', code: 'D-028', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['esg_score','emissions'], specificFields: {}, outputs: [] },
  'report-generator':                    { name: 'Report Generator', code: 'D-029', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['esg_score','board_member'], specificFields: {}, outputs: [] },
  'report-quality-engine':               { name: 'Report Quality Engine', code: 'D-030', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'reporting-hub':                       { name: 'Reporting Hub', code: 'D-031', domain: 'disclosure', requiredEntities: ['company','regulatory_filing','emissions'], optionalEntities: ['esg_score','board_member'], specificFields: {}, outputs: [] },
  'sustainability-report-builder':       { name: 'Sustainability Report Builder', code: 'D-032', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing','board_member'], optionalEntities: ['esg_score','water_footprint'], specificFields: {}, outputs: [] },
  'comprehensive-reporting':             { name: 'Comprehensive Reporting', code: 'D-033', domain: 'disclosure', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['esg_score','board_member','water_footprint'], specificFields: {}, outputs: [] },
  'stewardship-report-generator':        { name: 'Stewardship Report Generator', code: 'D-034', domain: 'disclosure', requiredEntities: ['company','portfolio_holding','esg_score'], optionalEntities: ['board_member','regulatory_filing'], specificFields: {}, outputs: [] },
  'global-disclosure-tracker':           { name: 'Global Disclosure Tracker', code: 'D-035', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'regulatory-deadline-tracker':         { name: 'Regulatory Deadline Tracker', code: 'D-036', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'regulatory-enforcement-monitor':      { name: 'Regulatory Enforcement Monitor', code: 'D-037', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['esg_score'], specificFields: {}, outputs: [] },
  'regulatory-gap':                      { name: 'Regulatory Gap', code: 'D-038', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  'regulatory-submission':               { name: 'Regulatory Submission', code: 'D-039', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'regulatory-calendar':                 { name: 'Regulatory Calendar', code: 'D-040', domain: 'disclosure', requiredEntities: ['company','regulatory_filing'], optionalEntities: [], specificFields: {}, outputs: [] },
  'policy-regulatory-impact':            { name: 'Policy Regulatory Impact', code: 'D-041', domain: 'disclosure', requiredEntities: ['company','regulatory_filing','scenario'], optionalEntities: ['emissions','esg_score'], specificFields: {}, outputs: [] },
  // ── Carbon Credits additions ──
  'cc-engine-hub':                       { name: 'CC Engine Hub', code: 'CC-007', domain: 'carbon_credits', requiredEntities: ['company','impact_metric'], optionalEntities: ['scenario','climate_target'], specificFields: {}, outputs: [] },
  'cc-portfolio-analytics':              { name: 'CC Portfolio Analytics', code: 'CC-008', domain: 'carbon_credits', requiredEntities: ['company','impact_metric','portfolio_holding'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'cc-arr-reforestation':                { name: 'CC ARR Reforestation', code: 'CC-009', domain: 'carbon_credits', requiredEntities: ['nature_asset','impact_metric'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'cc-redd-wetlands-hub':                { name: 'CC REDD+ Wetlands Hub', code: 'CC-010', domain: 'carbon_credits', requiredEntities: ['nature_asset','impact_metric'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'cc-bicrs-hub':                        { name: 'CC BICRS Hub', code: 'CC-011', domain: 'carbon_credits', requiredEntities: ['company','impact_metric'], optionalEntities: ['nature_asset','scenario'], specificFields: {}, outputs: [] },
  'cc-ccs-biochar-hub':                  { name: 'CC CCS Biochar Hub', code: 'CC-012', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'cc-clean-cooking':                    { name: 'CC Clean Cooking', code: 'CC-013', domain: 'carbon_credits', requiredEntities: ['company','impact_metric','activity_data'], optionalEntities: ['nature_asset'], specificFields: {}, outputs: [] },
  'cc-dac':                              { name: 'CC DAC', code: 'CC-014', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'cc-energy-efficiency-hub':            { name: 'CC Energy Efficiency Hub', code: 'CC-015', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'cc-grid-renewables':                  { name: 'CC Grid Renewables', code: 'CC-016', domain: 'carbon_credits', requiredEntities: ['company','renewable_project','impact_metric'], optionalEntities: ['activity_data'], specificFields: {}, outputs: [] },
  'cc-ifm-credits':                      { name: 'CC IFM Credits', code: 'CC-017', domain: 'carbon_credits', requiredEntities: ['nature_asset','impact_metric'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  'cc-industrial-gases':                 { name: 'CC Industrial Gases', code: 'CC-018', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'cc-landfill-wastewater':              { name: 'CC Landfill Wastewater', code: 'CC-019', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'cc-livestock-methane':                { name: 'CC Livestock Methane', code: 'CC-020', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['emissions'], specificFields: {}, outputs: [] },
  'cc-methodology-comparison':           { name: 'CC Methodology Comparison', code: 'CC-021', domain: 'carbon_credits', requiredEntities: [], optionalEntities: ['company','impact_metric','scenario'], specificFields: {}, outputs: [] },
  'cc-mineralization':                   { name: 'CC Mineralization', code: 'CC-022', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'cc-registry-hub':                     { name: 'CC Registry Hub', code: 'CC-023', domain: 'carbon_credits', requiredEntities: ['company','impact_metric'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'cc-retirement-workflow':              { name: 'CC Retirement Workflow', code: 'CC-024', domain: 'carbon_credits', requiredEntities: ['company','impact_metric','climate_target'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'cc-rice-cultivation':                 { name: 'CC Rice Cultivation', code: 'CC-025', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['nature_asset'], specificFields: {}, outputs: [] },
  'cc-soil-carbon':                      { name: 'CC Soil Carbon', code: 'CC-026', domain: 'carbon_credits', requiredEntities: ['nature_asset','activity_data','impact_metric'], optionalEntities: ['company','scenario'], specificFields: {}, outputs: [] },
  'cdm-methodology-calculator':          { name: 'CDM Methodology Calculator', code: 'CC-027', domain: 'carbon_credits', requiredEntities: ['company','activity_data'], optionalEntities: ['impact_metric','scenario'], specificFields: {}, outputs: [] },
  'blockchain-carbon-registry':          { name: 'Blockchain Carbon Registry', code: 'CC-028', domain: 'carbon_credits', requiredEntities: ['company','impact_metric'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'vcm-integrity':                       { name: 'VCM Integrity', code: 'CC-029', domain: 'carbon_credits', requiredEntities: ['company','impact_metric'], optionalEntities: ['regulatory_filing','scenario'], specificFields: {}, outputs: [] },
  'vcm-registry-analytics':             { name: 'VCM Registry Analytics', code: 'CC-030', domain: 'carbon_credits', requiredEntities: ['company','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'baseline-additionality-analyzer':     { name: 'Baseline Additionality Analyzer', code: 'CC-031', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'digital-mrv':                         { name: 'Digital MRV', code: 'CC-032', domain: 'carbon_credits', requiredEntities: ['company','activity_data','impact_metric'], optionalEntities: ['asset','nature_asset'], specificFields: {}, outputs: [] },
  'india-ccts':                          { name: 'India CCTS', code: 'CC-033', domain: 'carbon_credits', requiredEntities: ['company','emissions','regulatory_filing'], optionalEntities: ['impact_metric','activity_data'], specificFields: {}, outputs: [] },
  'article6-markets':                    { name: 'Article 6 Markets', code: 'CC-034', domain: 'carbon_credits', requiredEntities: ['scenario','sovereign_bond'], optionalEntities: ['company','impact_metric'], specificFields: {}, outputs: [] },
  'crypto-climate':                      { name: 'Crypto Climate', code: 'CC-035', domain: 'carbon_credits', requiredEntities: ['company','activity_data','emissions'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  // ── Impact additions ──
  'impact-hub':                          { name: 'Impact Hub', code: 'I-006', domain: 'impact', requiredEntities: ['company','impact_metric'], optionalEntities: ['esg_score','portfolio_holding'], specificFields: {}, outputs: [] },
  'impact-verification':                 { name: 'Impact Verification', code: 'I-007', domain: 'impact', requiredEntities: ['company','impact_metric'], optionalEntities: ['regulatory_filing'], specificFields: {}, outputs: [] },
  'impact-weighted-accounts':            { name: 'Impact Weighted Accounts', code: 'I-008', domain: 'impact', requiredEntities: ['company','impact_metric','emissions'], optionalEntities: ['board_member'], specificFields: {}, outputs: [] },
  'just-transition':                     { name: 'Just Transition', code: 'I-009', domain: 'impact', requiredEntities: ['company','impact_metric','climate_target'], optionalEntities: ['emissions','scenario'], specificFields: {}, outputs: [] },
  'just-transition-finance':             { name: 'Just Transition Finance', code: 'I-010', domain: 'impact', requiredEntities: ['company','project_finance','impact_metric'], optionalEntities: ['scenario'], specificFields: {}, outputs: [] },
  'just-transition-finance-hub':         { name: 'Just Transition Finance Hub', code: 'I-011', domain: 'impact', requiredEntities: ['company','project_finance','impact_metric'], optionalEntities: ['sovereign_bond','scenario'], specificFields: {}, outputs: [] },
  'just-transition-intelligence':        { name: 'Just Transition Intelligence', code: 'I-012', domain: 'impact', requiredEntities: ['company','impact_metric','scenario'], optionalEntities: ['emissions','supplier'], specificFields: {}, outputs: [] },
  'fossil-fuel-worker-transition':       { name: 'Fossil Fuel Worker Transition', code: 'I-013', domain: 'impact', requiredEntities: ['company','impact_metric','scenario'], optionalEntities: ['supplier'], specificFields: {}, outputs: [] },
  'equitable-earth-methodologies':       { name: 'Equitable Earth Methodologies', code: 'I-014', domain: 'impact', requiredEntities: ['company','impact_metric'], optionalEntities: ['emissions','nature_asset'], specificFields: {}, outputs: [] },
  'client-transition-command-center':    { name: 'Client Transition Command Center', code: 'I-015', domain: 'impact', requiredEntities: ['company','climate_target','portfolio_holding'], optionalEntities: ['emissions','regulatory_filing'], specificFields: {}, outputs: [] },
  // ── Physical additions ──
  'ocean-marine-risk':                   { name: 'Ocean Marine Risk', code: 'W-007', domain: 'physical', requiredEntities: ['asset','nature_asset','scenario'], optionalEntities: ['company','actuarial_data'], specificFields: {}, outputs: [] },
  'fisheries-climate-risk':              { name: 'Fisheries Climate Risk', code: 'W-008', domain: 'physical', requiredEntities: ['company','nature_asset','scenario'], optionalEntities: ['asset'], specificFields: {}, outputs: [] },
  'air-quality-health-risk':             { name: 'Air Quality Health Risk', code: 'W-009', domain: 'physical', requiredEntities: ['company','asset','scenario'], optionalEntities: ['actuarial_data'], specificFields: {}, outputs: [] },
  // ── Insurance additions ──
  'pc-climate-pricing':                  { name: 'P&C Climate Pricing', code: 'IN-007', domain: 'insurance', requiredEntities: ['actuarial_data','asset','scenario'], optionalEntities: ['company'], specificFields: {}, outputs: [] },
  // ── Reference Data ──
  'ceda-emission-factors':          { name: 'CEDA Emission Factors', code: 'REF-001', domain: 'reference', requiredEntities: [], optionalEntities: ['activity_data'], specificFields: {}, outputs: [{ name: 'Emission Factors', entity: 'activity_data', description: 'CEDA EEIO emission factors' }] },
  'big-climate-database':           { name: 'Big Climate Database', code: 'REF-002', domain: 'reference', requiredEntities: [], optionalEntities: ['company'], specificFields: {}, outputs: [{ name: 'Climate Data', entity: 'company', description: 'Comprehensive climate company data' }] },
  'epd-lca-database':               { name: 'EPD LCA Database', code: 'REF-003', domain: 'reference', requiredEntities: [], optionalEntities: ['activity_data'], specificFields: {}, outputs: [{ name: 'LCA Data', entity: 'activity_data', description: 'Environmental Product Declarations' }] },
};

/* ══════════════════════════════════════════════════════════════════
   3. DATA_PIPELINES — Cross-module data flows
   ══════════════════════════════════════════════════════════════════ */
const DATA_PIPELINES = [
  { from: 'integrated-carbon-emissions', to: 'pcaf-financed-emissions', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e','scope3_total_tco2e'], description: 'Emissions inventory feeds PCAF attribution' },
  { from: 'pcaf-financed-emissions', to: 'portfolio-temperature-score', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e','carbon_intensity_revenue'], description: 'Financed emissions feed ITR calculation' },
  { from: 'portfolio-temperature-score', to: 'paris-alignment', entity: 'portfolio_holding', fields: ['temperature_alignment_c'], description: 'Portfolio temp scores feed Paris alignment check' },
  { from: 'scope3-engine', to: 'integrated-carbon-emissions', entity: 'emissions', fields: ['scope3_c1','scope3_c2','scope3_c3','scope3_c4','scope3_c5','scope3_c6','scope3_c7','scope3_c8','scope3_c9','scope3_c10','scope3_c11','scope3_c12','scope3_c13','scope3_c14','scope3_c15'], description: 'Scope 3 breakdown feeds total emissions' },
  { from: 'carbon-calculator', to: 'integrated-carbon-emissions', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e'], description: 'Activity-based calcs feed emissions inventory' },
  { from: 'ceda-emission-factors', to: 'carbon-calculator', entity: 'activity_data', fields: ['ef_value','ef_source'], description: 'CEDA factors feed calculator' },
  { from: 'ceda-emission-factors', to: 'spending-carbon', entity: 'activity_data', fields: ['ef_value'], description: 'EEIO factors feed spend-based estimates' },
  { from: 'spending-carbon', to: 'scope3-engine', entity: 'emissions', fields: ['scope3_c1'], description: 'Spend-based purchased goods feed Scope 3 Cat 1' },
  { from: 'supplier-emissions-tracker', to: 'supply-chain-carbon', entity: 'supplier', fields: ['emissions_tco2e','dqs'], description: 'Supplier-level data feeds supply chain module' },
  { from: 'supply-chain-carbon', to: 'scope3-engine', entity: 'emissions', fields: ['scope3_c1','scope3_c2','scope3_c4'], description: 'Supply chain emissions feed upstream categories' },
  { from: 'integrated-carbon-emissions', to: 'sfdr-pai', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e','carbon_intensity_revenue'], description: 'Emissions feed SFDR PAI indicators 1-6' },
  { from: 'integrated-carbon-emissions', to: 'csrd-xbrl', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e','scope3_total_tco2e'], description: 'Emissions tagged for ESRS E1 iXBRL filing' },
  { from: 'water-risk-analytics', to: 'sfdr-pai', entity: 'water_footprint', fields: ['stress_score','withdrawal_m3'], description: 'Water data feeds SFDR PAI #8 (water)' },
  { from: 'board-diversity', to: 'sfdr-pai', entity: 'board_member', fields: ['gender','independence'], description: 'Board data feeds SFDR PAI #13 (gender gap)' },
  { from: 'esg-ratings-hub', to: 'sfdr-classification', entity: 'esg_score', fields: ['overall_score','e_score'], description: 'ESG scores feed SFDR Art 6/8/9 classification' },
  { from: 'climate-capital-adequacy', to: 'supervisory-stress-orchestrator', entity: 'scenario', fields: ['asset_haircut_pct','carbon_price_2030'], description: 'Capital adequacy scenarios feed stress orchestrator' },
  { from: 'climate-cvar-suite', to: 'climate-risk-premium', entity: 'portfolio_holding', fields: ['market_value_usd'], description: 'CVaR outputs inform risk premium' },
  { from: 'enterprise-climate-risk', to: 'climate-capital-adequacy', entity: 'asset', fields: ['stranding_risk_pct','carbon_intensity'], description: 'Enterprise risk feeds capital adequacy' },
  { from: 'transition-risk-dcf', to: 'asset-valuation-engine', entity: 'asset', fields: ['book_value_usd','stranding_risk_pct'], description: 'Transition DCF feeds asset valuation' },
  { from: 'physical-hazard-map', to: 'physical-risk-portfolio', entity: 'asset', fields: ['location_country','stranding_risk_pct'], description: 'Hazard data feeds portfolio physical risk' },
  { from: 'physical-risk-portfolio', to: 'catastrophe-modelling', entity: 'asset', fields: ['book_value_usd','location_country'], description: 'Portfolio physical risk feeds cat modelling' },
  { from: 'catastrophe-modelling', to: 'parametric-insurance', entity: 'asset', fields: ['book_value_usd'], description: 'Cat model losses inform parametric triggers' },
  { from: 'catastrophe-modelling', to: 'reinsurance-climate', entity: 'asset', fields: ['book_value_usd'], description: 'Cat model feeds reinsurance pricing' },
  { from: 'cbam-compliance', to: 'trade-carbon-policy', entity: 'cbam_product', fields: ['embedded_emissions_direct','product_group'], description: 'CBAM product data feeds trade policy analysis' },
  { from: 'act-assessment', to: 'peer-transition-benchmarker', entity: 'climate_target', fields: ['target_type','target_reduction_pct','sbti_status'], description: 'ACT scores feed peer benchmarking' },
  { from: 'integrated-carbon-emissions', to: 'carbon-budget', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e','scope3_total_tco2e'], description: 'Total emissions feed budget tracker' },
  { from: 'carbon-budget', to: 'climate-target', entity: 'climate_target', fields: ['target_reduction_pct','pathway'], description: 'Budget analysis informs target setting' },
  { from: 'pcaf-financed-emissions', to: 'portfolio-decarbonization', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e'], description: 'Financed emissions feed decarb pathways' },
  { from: 'big-climate-database', to: 'esg-ratings-hub', entity: 'company', fields: ['sector','industry','country_iso2'], description: 'Climate DB company data feeds ESG hub' },
  { from: 'esg-report-parser', to: 'csrd-readiness', entity: 'regulatory_filing', fields: ['completeness_pct','gaps_identified'], description: 'Parsed reports feed CSRD gap analysis' },
  { from: 'carbon-credit-pricing', to: 'corporate-offset-optimizer', entity: 'scenario', fields: ['carbon_price_2025'], description: 'Credit prices feed offset optimization' },
  { from: 'corporate-offset-optimizer', to: 'offset-portfolio-tracker', entity: 'impact_metric', fields: ['value','metric_type'], description: 'Optimized offsets feed portfolio tracker' },
  { from: 'offset-permanence-risk', to: 'corporate-offset-optimizer', entity: 'impact_metric', fields: ['value'], description: 'Permanence risk scores constrain offset selection' },
  { from: 'social-impact', to: 'undp-blended-finance', entity: 'impact_metric', fields: ['value','sdg_goals'], description: 'Social impact metrics feed blended finance' },
  { from: 'issb-tcfd', to: 'issb-disclosure', entity: 'regulatory_filing', fields: ['completeness_pct','framework'], description: 'TCFD alignment feeds ISSB disclosure' },
  { from: 'csrd-dma', to: 'csrd-esrs-full', entity: 'regulatory_filing', fields: ['gaps_identified'], description: 'DMA material topics feed ESRS datapoint selection' },
  { from: 'csrd-esrs-full', to: 'csrd-xbrl', entity: 'regulatory_filing', fields: ['completeness_pct'], description: 'ESRS data feeds iXBRL tagging engine' },
  { from: 'sfdr-pai', to: 'sfdr-v2', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e','carbon_intensity_revenue'], description: 'PAI calculations feed SFDR v2 template' },
  { from: 'sfdr-classification', to: 'sfdr-art9', entity: 'portfolio_holding', fields: ['weight_pct'], description: 'Classification feeds Article 9 eligibility' },
  { from: 'sentiment-analysis', to: 'esg-ratings-hub', entity: 'esg_score', fields: ['momentum'], description: 'Sentiment signals feed ESG momentum scoring' },
  { from: 'sovereign-climate-risk', to: 'sovereign-esg-scorer', entity: 'esg_score', fields: ['e_score'], description: 'Sovereign climate risk feeds ESG E-pillar' },
  { from: 'water-risk-analytics', to: 'csrd-esrs-full', entity: 'water_footprint', fields: ['withdrawal_m3','consumption_m3','stress_score'], description: 'Water data feeds ESRS E3 disclosure' },
  { from: 'physical-risk-pricing', to: 'insurance-transition', entity: 'asset', fields: ['stranding_risk_pct'], description: 'Physical risk pricing feeds insurance transition' },
  // ── New pipelines: Renewable & Offshore Wind ──
  { from: 'offshore-wind-resource', to: 'offshore-wind-finance', entity: 'renewable_project', fields: ['capacity_mw','aep_gwh','capacity_factor_pct'], description: 'Wind resource AEP feeds finance model' },
  { from: 'offshore-wind-finance', to: 'offshore-wind-om', entity: 'project_finance', fields: ['irr_equity_pct','dscr_min','capex_total_musd'], description: 'Finance model parameters feed O&M planning' },
  { from: 'offshore-wind-om', to: 'wind-repowering-intelligence', entity: 'wind_turbine', fields: ['age_years','availability_pct','cf_actual_pct'], description: 'O&M data informs repowering decision' },
  { from: 'solar-project-finance', to: 'renewable-portfolio-intelligence', entity: 'project_finance', fields: ['irr_equity_pct','npv_musd','lcoe_mwh'], description: 'Project finance KPIs feed portfolio intelligence' },
  { from: 'solar-resource-performance', to: 'solar-project-finance', entity: 'renewable_project', fields: ['aep_gwh','capacity_factor_pct'], description: 'Resource data feeds project finance model' },
  { from: 'renewable-ml-forecasting', to: 'renewable-portfolio-intelligence', entity: 'renewable_project', fields: ['aep_gwh','capacity_factor_pct'], description: 'ML forecasts feed portfolio analytics' },
  // ── New pipelines: Litigation & Stranded Assets ──
  { from: 'climate-litigation', to: 'stranded-asset-litigation-tracker', entity: 'litigation_case', fields: ['claim_type','status','claim_amount_musd'], description: 'Litigation cases feed stranded asset legal risk' },
  { from: 'climate-litigation-risk-scorer', to: 'enterprise-climate-risk', entity: 'company', fields: ['sector'], description: 'Litigation risk score feeds enterprise risk' },
  // ── New pipelines: Actuarial & Supervisory ──
  { from: 'climate-claims-forecasting', to: 'climate-reserve-adequacy', entity: 'actuarial_data', fields: ['cat_exposure_musd','loss_ratio_pct'], description: 'Claims forecasts feed reserve adequacy' },
  { from: 'solvency-capital-climate', to: 'regulatory-capital', entity: 'actuarial_data', fields: ['climate_var_99_pct'], description: 'Solvency capital feeds regulatory capital overlay' },
  // ── New pipelines: Corporate Finance ──
  { from: 'climate-wacc-engine', to: 'climate-ma-due-diligence', entity: 'company', fields: ['sector'], description: 'Climate-adjusted WACC feeds M&A due diligence' },
  { from: 'climate-ma-due-diligence', to: 'carbon-adjusted-valuation', entity: 'corporate_deal', fields: ['climate_dd_score','deal_value_musd'], description: 'M&A DD outputs feed valuation adjustment' },
  { from: 'green-debt-structuring', to: 'greenium-signal', entity: 'corporate_deal', fields: ['coupon_pct','green_eligible'], description: 'Green bond terms feed greenium signal' },
  // ── New pipelines: Real Estate ──
  { from: 'crrem', to: 'real-estate-climate-risk', entity: 'real_estate_asset', fields: ['stranding_year','operational_carbon_kgco2_sqm'], description: 'CRREM stranding year feeds RE climate risk' },
  { from: 'real-estate-climate-risk', to: 'real-estate-valuation', entity: 'real_estate_asset', fields: ['physical_risk_score','stranding_year'], description: 'RE climate risk feeds property valuation' },
  // ── New pipelines: Nature & Biodiversity ──
  { from: 'nature-capital-accounting', to: 'tnfd-leap', entity: 'nature_asset', fields: ['biodiversity_score','ecosystem_services_musd','carbon_stock_tco2e'], description: 'Nature capital data feeds TNFD LEAP assessment' },
  { from: 'biodiversity-footprint', to: 'nature-capital-accounting', entity: 'nature_asset', fields: ['biodiversity_score','hectares'], description: 'Biodiversity footprint feeds capital accounting' },
  // ── New pipelines: Sovereign ──
  { from: 'sovereign-green-bond-analytics', to: 'sovereign-esg-hub', entity: 'sovereign_bond', fields: ['climate_risk_adj_bps','green_label'], description: 'Green bond data feeds sovereign ESG assessment' },
  { from: 'em-climate-risk', to: 'em-debt-climate-risk', entity: 'scenario', fields: ['warming_target_c','carbon_price_2030'], description: 'EM climate risk scenarios feed debt risk analysis' },
  // ── New pipelines: AI & NLP ──
  { from: 'nlp-disclosure-parser', to: 'esg-narrative-intelligence', entity: 'regulatory_filing', fields: ['completeness_pct','gaps_identified'], description: 'Parsed disclosures feed narrative intelligence' },
  { from: 'anomaly-detection', to: 'data-quality-dashboard', entity: 'emissions', fields: ['scope1_tco2e','scope2_market_tco2e'], description: 'Anomaly flags feed data quality scoring' },
  // ── New pipelines: Transition Planning ──
  { from: 'transition-plan-builder', to: 'gfanz-sector-pathways', entity: 'climate_target', fields: ['target_reduction_pct','pathway','sbti_status'], description: 'Transition plans feed GFANZ sector alignment' },
  { from: 'sbti-target-setter', to: 'net-zero-credibility-index', entity: 'climate_target', fields: ['sbti_status','target_reduction_pct'], description: 'SBTi targets feed net zero credibility scoring' },
  // ── New pipelines: Carbon Credits ──
  { from: 'cc-engine-hub', to: 'corporate-offset-optimizer', entity: 'impact_metric', fields: ['value','metric_type'], description: 'Credit engine outputs feed offset optimizer' },
  { from: 'digital-mrv', to: 'cc-registry-hub', entity: 'impact_metric', fields: ['value','measurement_date','framework'], description: 'MRV-verified credits flow to registry' },
];

/* ══════════════════════════════════════════════════════════════════
   4. DOMAIN_GROUPS — Module grouping for UI
   ══════════════════════════════════════════════════════════════════ */
const DOMAIN_GROUPS = [
  { id: 'carbon', name: 'Carbon & Emissions', icon: '\uD83C\uDF2B\uFE0F', color: '#4f46e5', moduleCount: 15, description: 'GHG inventory, Scope 1/2/3, carbon calculators' },
  { id: 'pcaf', name: 'PCAF & Financed Emissions', icon: '\uD83C\uDFE6', color: '#0891b2', moduleCount: 8, description: 'PCAF attribution, portfolio temperature, Paris alignment' },
  { id: 'cbam', name: 'CBAM & Trade', icon: '\uD83D\uDEA2', color: '#b45309', moduleCount: 3, description: 'Carbon border adjustment, trade policy, CORSIA' },
  { id: 'disclosure', name: 'Compliance & Disclosure', icon: '\uD83D\uDCDC', color: '#7c3aed', moduleCount: 12, description: 'CSRD, SFDR, ISSB/TCFD, SEC, EU Taxonomy' },
  { id: 'climate_risk', name: 'Climate Risk & Capital', icon: '\u26A0\uFE0F', color: '#dc2626', moduleCount: 10, description: 'CVaR, capital adequacy, stress testing, transition risk' },
  { id: 'physical', name: 'Water & Physical Risk', icon: '\uD83D\uDCA7', color: '#0284c7', moduleCount: 6, description: 'Water analytics, hazard mapping, physical risk pricing' },
  { id: 'supply_chain', name: 'Supply Chain', icon: '\uD83D\uDE9A', color: '#059669', moduleCount: 5, description: 'Supplier tracking, procurement carbon, food chain' },
  { id: 'esg', name: 'ESG & Benchmarking', icon: '\u2B50', color: '#d97706', moduleCount: 8, description: 'ESG ratings, board diversity, sentiment, ACT assessment' },
  { id: 'carbon_credits', name: 'Carbon Credits & Offsets', icon: '\uD83C\uDF3F', color: '#16a34a', moduleCount: 6, description: 'Credit pricing, market intelligence, offset optimization' },
  { id: 'impact', name: 'Impact & SDG', icon: '\uD83C\uDF31', color: '#9333ea', moduleCount: 5, description: 'Social impact, UNDP blended finance, SDG mapping' },
  { id: 'insurance', name: 'Insurance & Sovereign', icon: '\uD83C\uDFE5', color: '#991b1b', moduleCount: 6, description: 'Catastrophe modelling, parametric, sovereign ESG' },
  { id: 'reference', name: 'Reference Data', icon: '\uD83D\uDCDA', color: '#475569', moduleCount: 3, description: 'CEDA factors, Big Climate DB, EPD/LCA database' },
  { id: 'renewable_energy', name: 'Solar & Renewable Energy', icon: '\u2600\uFE0F', color: '#f59e0b', moduleCount: 20, description: 'Solar PV, wind, BESS, PPA, RE portfolio analytics' },
  { id: 'offshore_wind', name: 'Offshore Wind & Marine', icon: '\uD83C\uDF0A', color: '#0369a1', moduleCount: 6, description: 'Offshore wind resource, LCOE, finance, O&M, repowering' },
  { id: 'climate_litigation', name: 'Climate Litigation & Legal', icon: '\u2696\uFE0F', color: '#4338ca', moduleCount: 12, description: 'Climate litigation risk, stranded asset law, legal intelligence' },
  { id: 'supervisory', name: 'Climate Risk Capital & Supervisory', icon: '\uD83C\uDFE6', color: '#991b1b', moduleCount: 10, description: 'Supervisory stress, regulatory capital, solvency' },
  { id: 'actuarial_insurance', name: 'Insurance Climate Actuarial', icon: '\uD83C\uDFE5', color: '#065f46', moduleCount: 14, description: 'Climate actuarial, mortality, cat modelling, protection gap' },
  { id: 'corporate_finance', name: 'Corporate Finance & Capital Markets', icon: '\uD83D\uDCBC', color: '#1e3a5f', moduleCount: 16, description: 'Climate WACC, M&A DD, green debt, capital markets' },
  { id: 'ai_nlp', name: 'AI, NLP & Real-Time Intelligence', icon: '\uD83E\uDD16', color: '#6d28d9', moduleCount: 20, description: 'AI ESG, NLP parsing, sentiment, anomaly detection' },
  { id: 'nature_biodiversity', name: 'Nature & Biodiversity', icon: '\uD83C\uDF3F', color: '#16a34a', moduleCount: 25, description: 'Nature capital, biodiversity, NbS, blue carbon, TNFD' },
  { id: 'sovereign_em', name: 'Sovereign & Emerging Markets', icon: '\uD83C\uDF0D', color: '#0c4a6e', moduleCount: 21, description: 'Sovereign bonds, EM climate risk, JETP, regional analytics' },
  { id: 'real_estate', name: 'Real Estate & Infrastructure', icon: '\uD83C\uDFE2', color: '#78350f', moduleCount: 24, description: 'Real estate ESG, CRREM, green buildings, infrastructure resilience' },
  { id: 'green_finance', name: 'Green Finance & Bonds', icon: '\uD83C\uDF31', color: '#14532d', moduleCount: 33, description: 'Green bonds, EU Taxonomy, blended finance, impact bonds' },
  { id: 'governance_social', name: 'Governance & Social', icon: '\uD83E\uDD1D', color: '#7c2d12', moduleCount: 36, description: 'Board governance, human rights, DEI, living wage, stewardship' },
  { id: 'scenario_stress', name: 'Scenario & Stress Testing', icon: '\uD83D\uDCCA', color: '#1e40af', moduleCount: 23, description: 'NGFS, Monte Carlo, stochastic, CVaR, tail risk' },
  { id: 'transition_planning', name: 'Transition Planning & Net Zero', icon: '\uD83C\uDFAF', color: '#047857', moduleCount: 36, description: 'Transition plans, net zero, SBTi, decarbonisation roadmaps' },
  { id: 'geopolitical', name: 'Geopolitical & Trade', icon: '\uD83C\uDF10', color: '#374151', moduleCount: 26, description: 'Geopolitical ESG, trade flow, critical minerals, sanctions' },
  { id: 'private_markets', name: 'Private Markets & PE/VC', icon: '\uD83C\uDFD7\uFE0F', color: '#6b21a8', moduleCount: 12, description: 'PE ESG diligence, VC impact, private credit, fund analytics' },
  { id: 'data_infra', name: 'Data Infrastructure & Ops', icon: '\uD83D\uDDC3\uFE0F', color: '#475569', moduleCount: 22, description: 'Data ingestion, governance, lineage, API, ETL pipelines' },
];

/* ══════════════════════════════════════════════════════════════════
   5. HELPERS — Validation and utilities
   ══════════════════════════════════════════════════════════════════ */
const LS_KEY = 'a2_data_capture_store';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveToStorage = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* quota */ }
};

const generateId = () => `dc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const validateField = (field, value) => {
  if (field.required && (value === undefined || value === null || value === '')) {
    return { valid: false, message: `${field.label} is required` };
  }
  if (value === undefined || value === null || value === '') return { valid: true, message: null };
  if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
    if (typeof value !== 'number' || isNaN(value)) return { valid: false, message: `${field.label} must be a number` };
  }
  if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { valid: false, message: `${field.label} must be a valid email` };
  }
  if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
    return { valid: false, message: `${field.label} must be a valid URL` };
  }
  if (field.type === 'iso_country' && value && !/^[A-Z]{2}$/.test(value)) {
    return { valid: false, message: `${field.label} must be a 2-letter ISO country code` };
  }
  if (field.type === 'boolean' && typeof value !== 'boolean') {
    return { valid: false, message: `${field.label} must be true or false` };
  }
  if (field.validation && !field.validation(value)) {
    return { valid: false, message: `${field.label} failed validation` };
  }
  return { valid: true, message: null };
};

/* ══════════════════════════════════════════════════════════════════
   6. CONTEXT + PROVIDER
   ══════════════════════════════════════════════════════════════════ */
const DataCaptureContext = createContext(null);

export function DataCaptureProvider({ children }) {
  const [capturedData, setCapturedData] = useState(loadFromStorage);

  /* ── persist on every change ── */
  const persist = useCallback((next) => {
    setCapturedData(next);
    saveToStorage(next);
  }, []);

  /* ── validateRecord ── */
  const validateRecord = useCallback((entityId, data) => {
    const entity = ENTITY_MAP[entityId];
    if (!entity) return { valid: false, errors: [{ field: '_entity', message: `Unknown entity: ${entityId}` }] };
    const errors = [];
    for (const field of entity.fields) {
      const result = validateField(field, data[field.key]);
      if (!result.valid) errors.push({ field: field.key, message: result.message });
    }
    return { valid: errors.length === 0, errors };
  }, []);

  /* ── addRecord ── */
  const addRecord = useCallback((entityId, data) => {
    const validation = validateRecord(entityId, data);
    if (!validation.valid) return { success: false, errors: validation.errors };
    const record = { ...data, _id: generateId(), _capturedAt: new Date().toISOString(), _capturedBy: 'user' };
    const next = { ...capturedData, [entityId]: [...(capturedData[entityId] || []), record] };
    persist(next);
    return { success: true, record };
  }, [capturedData, persist, validateRecord]);

  /* ── updateRecord ── */
  const updateRecord = useCallback((entityId, recordId, data) => {
    const records = capturedData[entityId] || [];
    const idx = records.findIndex(r => r._id === recordId);
    if (idx === -1) return { success: false, errors: [{ field: '_id', message: 'Record not found' }] };
    const merged = { ...records[idx], ...data };
    const validation = validateRecord(entityId, merged);
    if (!validation.valid) return { success: false, errors: validation.errors };
    const updated = [...records];
    updated[idx] = { ...merged, _capturedAt: new Date().toISOString() };
    persist({ ...capturedData, [entityId]: updated });
    return { success: true, record: updated[idx] };
  }, [capturedData, persist, validateRecord]);

  /* ── deleteRecord ── */
  const deleteRecord = useCallback((entityId, recordId) => {
    const records = capturedData[entityId] || [];
    const next = { ...capturedData, [entityId]: records.filter(r => r._id !== recordId) };
    persist(next);
  }, [capturedData, persist]);

  /* ── getRecords ── */
  const getRecords = useCallback((entityId, filters) => {
    let records = capturedData[entityId] || [];
    if (filters && typeof filters === 'object') {
      records = records.filter(r => Object.entries(filters).every(([k, v]) => r[k] === v));
    }
    return records;
  }, [capturedData]);

  /* ── getEntitySchema ── */
  const getEntitySchema = useCallback((entityId) => ENTITY_MAP[entityId] || null, []);

  /* ── getModuleRequirements ── */
  const getModuleRequirements = useCallback((routePath) => MODULE_DATA_MAP[routePath] || null, []);

  /* ── getModulePipelines ── */
  const getModulePipelines = useCallback((routePath) => {
    const upstream = DATA_PIPELINES.filter(p => p.to === routePath);
    const downstream = DATA_PIPELINES.filter(p => p.from === routePath);
    return { upstream, downstream };
  }, []);

  /* ── getDataCoverage ── */
  const getDataCoverage = useCallback((routePath) => {
    const mod = MODULE_DATA_MAP[routePath];
    if (!mod) return 0;
    const required = mod.requiredEntities || [];
    if (required.length === 0) return 100;
    let filled = 0;
    for (const eid of required) {
      const records = capturedData[eid] || [];
      if (records.length > 0) filled++;
    }
    return Math.round((filled / required.length) * 100);
  }, [capturedData]);

  /* ── searchRecords ── */
  const searchRecords = useCallback((query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = [];
    for (const [entityId, records] of Object.entries(capturedData)) {
      for (const rec of records) {
        const match = Object.values(rec).some(v => typeof v === 'string' && v.toLowerCase().includes(q));
        if (match) results.push({ entityId, record: rec });
      }
    }
    return results;
  }, [capturedData]);

  /* ── getEntityConsumers ── */
  const getEntityConsumers = useCallback((entityId) => {
    return Object.entries(MODULE_DATA_MAP)
      .filter(([, m]) => (m.requiredEntities || []).includes(entityId) || (m.optionalEntities || []).includes(entityId))
      .map(([route, m]) => ({ route, name: m.name, required: (m.requiredEntities || []).includes(entityId) }));
  }, []);

  /* ── exportRecords ── */
  const exportRecords = useCallback((entityId, format = 'csv') => {
    const records = capturedData[entityId] || [];
    if (records.length === 0) return null;
    const entity = ENTITY_MAP[entityId];
    if (!entity) return null;
    const keys = entity.fields.map(f => f.key);
    const header = keys.join(',');
    const rows = records.map(r => keys.map(k => {
      const v = r[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
      return String(v);
    }).join(','));
    return [header, ...rows].join('\n');
  }, [capturedData]);

  /* ── stats ── */
  const stats = useMemo(() => {
    const entries = Object.entries(capturedData);
    const totalRecords = entries.reduce((sum, [, recs]) => sum + recs.length, 0);
    const totalEntities = entries.filter(([, recs]) => recs.length > 0).length;
    const allModules = Object.keys(MODULE_DATA_MAP).length;
    let coveredModules = 0;
    for (const route of Object.keys(MODULE_DATA_MAP)) {
      const mod = MODULE_DATA_MAP[route];
      const req = mod.requiredEntities || [];
      if (req.length === 0 || req.every(eid => (capturedData[eid] || []).length > 0)) coveredModules++;
    }
    return { totalRecords, totalEntities, coveragePct: allModules > 0 ? Math.round((coveredModules / allModules) * 100) : 0 };
  }, [capturedData]);

  const value = useMemo(() => ({
    capturedData, addRecord, updateRecord, deleteRecord, getRecords,
    getEntitySchema, getModuleRequirements, getModulePipelines, getDataCoverage,
    validateRecord, searchRecords, getEntityConsumers, exportRecords, stats,
    entities: DATA_ENTITIES, entityMap: ENTITY_MAP, moduleMap: MODULE_DATA_MAP,
    pipelines: DATA_PIPELINES, domainGroups: DOMAIN_GROUPS,
  }), [capturedData, addRecord, updateRecord, deleteRecord, getRecords,
    getEntitySchema, getModuleRequirements, getModulePipelines, getDataCoverage,
    validateRecord, searchRecords, getEntityConsumers, exportRecords, stats]);

  return <DataCaptureContext.Provider value={value}>{children}</DataCaptureContext.Provider>;
}

export function useDataCapture() {
  const ctx = useContext(DataCaptureContext);
  if (!ctx) throw new Error('useDataCapture must be used within a DataCaptureProvider');
  return ctx;
}

export { DATA_ENTITIES, ENTITY_MAP, MODULE_DATA_MAP, DATA_PIPELINES, DOMAIN_GROUPS };
export default DataCaptureContext;
