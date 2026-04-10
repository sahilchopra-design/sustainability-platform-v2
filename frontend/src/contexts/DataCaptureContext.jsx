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
