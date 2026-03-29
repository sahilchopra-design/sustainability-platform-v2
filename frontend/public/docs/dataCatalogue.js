// ═══════════════════════════════════════════════════════════════════════════════
// DATA CATALOGUE — Complete platform data inventory
// Maps: Source → DB Table → Transformation → Frontend Module
// Generated: 2026-03-28 | Alembic migrations 001–067
// ═══════════════════════════════════════════════════════════════════════════════

/** Deterministic seeded random — NO Math.random() */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATA_CATALOGUE — Every datapoint with full lineage
// ─────────────────────────────────────────────────────────────────────────────

export const DATA_CATALOGUE = [

  // ═══════════════════════════════════════════════════════════════════════════
  // EMISSIONS DOMAIN (DC001–DC030)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC001', name: 'Company Scope 1 Emissions',
    description: 'Direct GHG emissions from owned/controlled sources (Scope 1)',
    source: { type: 'API', provider: 'CDP / Company Disclosure', frequency: 'Annual', format: 'CSV/API' },
    db: { schema: 'public', table: 'assets_pg', column: 'scope1_tco2e', type: 'NUMERIC(18,2)', migration: '019_extend_assets_pcaf', foreignKeys: ['entity_lei → company_profiles.entity_lei'] },
    quality: { dqs: 2, verification: 'Third-party assured', coverage: '85%', freshness: 'Annual (FY2024)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Raw CDP/GRI submission', output: 'assets_pg.scope1_tco2e', logic: 'Parse CSV, validate units, convert to tCO2e', intermediary: 'staging.raw_emissions' },
      { stage: 2, name: 'Normalization', input: 'scope1_tco2e raw', output: 'assets_pg.scope1_tco2e (cleaned)', logic: 'Convert all units to tCO2e using GWP-100 AR6 factors', intermediary: 'staging.normalized_emissions' },
      { stage: 3, name: 'Attribution', input: 'scope1 + outstanding + EVIC', output: 'pcaf_investees.financed_scope1', logic: 'PCAF: attribution_factor = outstanding/EVIC × scope1', intermediary: 'analytics.pcaf_attribution' },
      { stage: 4, name: 'Aggregation', input: 'financed scope1 per holding', output: 'pcaf_portfolio_results.total_scope1_fe', logic: 'SUM(attributed_scope1) across portfolio', intermediary: 'analytics.portfolio_aggregates' },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'scope1FE', tab: 'Portfolio Builder' },
      { module: 'climate-banking-hub', field: 'totalScope1', tab: 'Executive Dashboard' },
      { module: 'temperature-alignment', field: 'emissionsInput', tab: 'Holdings Screener' },
      { module: 'climate-stress-test', field: 'sectorEmissions', tab: 'Sector PD Migration' },
    ],
    lineage: 'CDP Disclosure → staging.raw_emissions → assets_pg.scope1_tco2e → pcaf_investees → pcaf_portfolio_results → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC002', name: 'Company Scope 2 Emissions (Location-Based)',
    description: 'Indirect GHG emissions from purchased electricity, heat, steam — location-based method',
    source: { type: 'API', provider: 'CDP / Company Disclosure', frequency: 'Annual', format: 'CSV/API' },
    db: { schema: 'public', table: 'assets_pg', column: 'scope2_tco2e', type: 'NUMERIC(18,2)', migration: '019_extend_assets_pcaf', foreignKeys: ['entity_lei → company_profiles.entity_lei'] },
    quality: { dqs: 2, verification: 'Third-party assured', coverage: '82%', freshness: 'Annual (FY2024)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Raw scope 2 disclosure', output: 'assets_pg.scope2_tco2e', logic: 'Parse, validate location-based vs market-based', intermediary: 'staging.raw_emissions' },
      { stage: 2, name: 'Grid Factor Application', input: 'scope2 + grid_intensity', output: 'Validated scope2', logic: 'Cross-check against IEA grid factors per country', intermediary: 'staging.grid_validated' },
      { stage: 3, name: 'Attribution', input: 'scope2 + attribution_factor', output: 'pcaf_investees.financed_scope2', logic: 'PCAF: AF × scope2_tco2e', intermediary: 'analytics.pcaf_attribution' },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'scope2FE', tab: 'Portfolio Builder' },
      { module: 'carbon-accounting-ai', field: 'scope2Input', tab: 'Emissions Breakdown' },
    ],
    lineage: 'CDP → staging → assets_pg.scope2_tco2e → pcaf_investees → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC003', name: 'Company Scope 3 Emissions',
    description: 'Value chain indirect GHG emissions — all 15 categories',
    source: { type: 'API', provider: 'CDP / Estimate Models', frequency: 'Annual', format: 'CSV/API' },
    db: { schema: 'public', table: 'assets_pg', column: 'scope3_tco2e', type: 'NUMERIC(18,2)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 4, verification: 'Estimated (sector-average)', coverage: '45%', freshness: 'Annual (FY2024)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Disclosed or estimated scope 3', output: 'assets_pg.scope3_tco2e', logic: 'Accept reported; fill gaps with PCAF estimation', intermediary: 'staging.scope3_raw' },
      { stage: 2, name: 'Estimation', input: 'Revenue + sector EF', output: 'Estimated scope3', logic: 'revenue_eur × sector_emission_factor (EXIOBASE)', intermediary: 'staging.scope3_estimated' },
      { stage: 3, name: 'Attribution', input: 'scope3 + AF', output: 'pcaf_investees.financed_scope3', logic: 'PCAF: AF × scope3_tco2e', intermediary: 'analytics.pcaf_scope3' },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'scope3FE', tab: 'Holdings Detail' },
      { module: 'supply-chain-intelligence', field: 'scope3Upstream', tab: 'Supply Chain Map' },
    ],
    lineage: 'CDP/Estimate → assets_pg.scope3_tco2e → pcaf_investees → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC004', name: 'Scope 2 Market-Based Emissions',
    description: 'Scope 2 using contractual instruments (RECs, PPAs, residual mix)',
    source: { type: 'API', provider: 'Company Disclosure / RE100', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'company_profiles', column: 'scope2_market_tco2e', type: 'NUMERIC(18,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Third-party assured where available', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Market-based disclosure', output: 'company_profiles.scope2_market_tco2e', logic: 'Parse contractual instrument type, validate REC serial numbers', intermediary: 'staging.scope2_market' },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'scope2MarketBased', tab: 'Dual Reporting' },
      { module: 'climate-financial-statements', field: 'marketBasedE', tab: 'GHG Accounts' },
    ],
    lineage: 'Disclosure → company_profiles → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC005', name: 'DEFRA Emission Factors',
    description: 'UK DEFRA/BEIS GHG conversion factors for Scope 1/2/3 activities',
    source: { type: 'Static', provider: 'UK DEFRA', frequency: 'Annual', format: 'XLSX' },
    db: { schema: 'public', table: 'emission_factors', column: 'factor_value', type: 'NUMERIC(12,6)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Government published', coverage: '100%', freshness: '2025 factors' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'DEFRA XLSX download', output: 'emission_factors', logic: 'Parse all sheets (fuels, transport, materials, waste)', intermediary: 'staging.defra_raw' },
      { stage: 2, name: 'Lookup', input: 'Activity type + fuel', output: 'factor_value kgCO2e/unit', logic: 'Match on activity_type + fuel_type + unit', intermediary: null },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'emissionFactorDEFRA', tab: 'Factor Library' },
      { module: 'lifecycle-assessment', field: 'transportEF', tab: 'Impact Calculation' },
    ],
    lineage: 'DEFRA XLSX → emission_factors → calculation engine → Frontend',
    unit: 'kgCO2e/unit', updateFrequency: 'Annual', owner: 'Reference Data Team',
  },
  {
    id: 'DC006', name: 'EPA Emission Factors',
    description: 'US EPA GHG emission factors for stationary/mobile combustion',
    source: { type: 'Static', provider: 'US EPA', frequency: 'Annual', format: 'PDF/CSV' },
    db: { schema: 'public', table: 'emission_factors', column: 'factor_value', type: 'NUMERIC(12,6)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Government published', coverage: '100%', freshness: '2025 factors' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'EPA AP-42 / eGRID', output: 'emission_factors', logic: 'Parse stationary combustion + grid tables', intermediary: 'staging.epa_raw' },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'emissionFactorEPA', tab: 'Factor Library' },
    ],
    lineage: 'EPA → emission_factors → Frontend',
    unit: 'kgCO2e/unit', updateFrequency: 'Annual', owner: 'Reference Data Team',
  },
  {
    id: 'DC007', name: 'IPCC AR6 GWP Values',
    description: 'Global Warming Potential (100-yr) for CH4, N2O, SF6, HFCs, PFCs, NF3',
    source: { type: 'Static', provider: 'IPCC AR6 WG1', frequency: 'Per assessment cycle', format: 'Reference table' },
    db: { schema: 'public', table: 'emission_factors', column: 'gwp_100', type: 'NUMERIC(10,2)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Peer-reviewed science', coverage: '100%', freshness: 'AR6 (2021)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'IPCC AR6 Table 7.SM.7', output: 'emission_factors (gwp rows)', logic: 'Manual entry from IPCC supplementary material', intermediary: null },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'gwpFactors', tab: 'GWP Conversion' },
      { module: 'pcaf-financed-emissions', field: 'gwpLookup', tab: 'Methodology' },
    ],
    lineage: 'IPCC AR6 → emission_factors → calculation engine',
    unit: 'dimensionless (CO2-equivalent multiplier)', updateFrequency: 'Per IPCC cycle (~7 yr)', owner: 'Reference Data Team',
  },
  {
    id: 'DC008', name: 'Grid Carbon Intensity by Country',
    description: 'Electricity grid emission factor per kWh by country/region',
    source: { type: 'API', provider: 'IEA / Ember / electricityMap', frequency: 'Annual', format: 'CSV/API' },
    db: { schema: 'public', table: 'grid_intensity', column: 'intensity_gco2_kwh', type: 'NUMERIC(8,2)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'IEA official statistics', coverage: '95% of countries', freshness: '2024 data' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'IEA World Energy Outlook + Ember', output: 'grid_intensity', logic: 'Match country_iso3 + year, store gCO2/kWh', intermediary: 'staging.grid_raw' },
      { stage: 2, name: 'Scope 2 Calc', input: 'grid_intensity + electricity_kwh', output: 'Scope 2 location-based', logic: 'scope2 = consumption_kwh × grid_factor / 1000', intermediary: null },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'gridFactor', tab: 'Scope 2 Calculator' },
      { module: 'crrem', field: 'gridDecarbPath', tab: 'Grid Decarbonisation' },
    ],
    lineage: 'IEA/Ember → grid_intensity → scope2 calculation → Frontend',
    unit: 'gCO2/kWh', updateFrequency: 'Annual', owner: 'Reference Data Team',
  },
  {
    id: 'DC009', name: 'PCAF Financed Emissions — Scope 1',
    description: 'Portfolio-level attributed Scope 1 emissions per PCAF Standard v2',
    source: { type: 'Computed', provider: 'Internal PCAF Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_results', column: 'total_scope1_fe', type: 'NUMERIC(18,2)', migration: '006_add_financial_risk_tables', foreignKeys: ['portfolio_id → pcaf_portfolios.id'] },
    quality: { dqs: 3, verification: 'Portfolio-weighted DQS', coverage: '90%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Holding Lookup', input: 'portfolios_pg holdings', output: 'List of assets + outstanding', logic: 'Join portfolios_pg → assets_pg on holding_id', intermediary: null },
      { stage: 2, name: 'Attribution', input: 'outstanding + EVIC + scope1', output: 'pcaf_investees rows', logic: 'AF = outstanding/EVIC; financed = AF × scope1', intermediary: 'pcaf_investees' },
      { stage: 3, name: 'Aggregation', input: 'All investee financed_scope1', output: 'pcaf_portfolio_results', logic: 'SUM(financed_scope1) grouped by portfolio', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'portfolioScope1FE', tab: 'Summary Dashboard' },
      { module: 'pcaf-india-brsr', field: 'scope1FinancedTotal', tab: 'BRSR Mapping' },
    ],
    lineage: 'assets_pg → pcaf_investees → pcaf_portfolio_results → Frontend',
    unit: 'tCO2e', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC010', name: 'PCAF Financed Emissions — Scope 2',
    description: 'Portfolio-level attributed Scope 2 emissions per PCAF Standard v2',
    source: { type: 'Computed', provider: 'Internal PCAF Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_results', column: 'total_scope2_fe', type: 'NUMERIC(18,2)', migration: '006_add_financial_risk_tables', foreignKeys: ['portfolio_id → pcaf_portfolios.id'] },
    quality: { dqs: 3, verification: 'Portfolio-weighted DQS', coverage: '88%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Attribution', input: 'AF × scope2_tco2e', output: 'pcaf_investees.financed_scope2', logic: 'Per-holding scope2 attribution', intermediary: 'pcaf_investees' },
      { stage: 2, name: 'Aggregation', input: 'All investee financed_scope2', output: 'pcaf_portfolio_results', logic: 'SUM(financed_scope2)', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'portfolioScope2FE', tab: 'Summary Dashboard' },
    ],
    lineage: 'assets_pg → pcaf_investees → pcaf_portfolio_results → Frontend',
    unit: 'tCO2e', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC011', name: 'PCAF Financed Emissions — Scope 3',
    description: 'Portfolio-level attributed Scope 3 emissions per PCAF Standard v2',
    source: { type: 'Computed', provider: 'Internal PCAF Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_results', column: 'total_scope3_fe', type: 'NUMERIC(18,2)', migration: '006_add_financial_risk_tables', foreignKeys: ['portfolio_id → pcaf_portfolios.id'] },
    quality: { dqs: 4, verification: 'Estimated — high uncertainty', coverage: '45%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Attribution', input: 'AF × scope3_tco2e', output: 'pcaf_investees.financed_scope3', logic: 'Per-holding scope3 attribution (where available)', intermediary: 'pcaf_investees' },
      { stage: 2, name: 'Aggregation', input: 'All investee financed_scope3', output: 'pcaf_portfolio_results', logic: 'SUM(financed_scope3)', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'portfolioScope3FE', tab: 'Holdings Detail' },
    ],
    lineage: 'assets_pg → pcaf_investees → pcaf_portfolio_results → Frontend',
    unit: 'tCO2e', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC012', name: 'Carbon Intensity (Revenue)',
    description: 'Emissions intensity normalised by revenue — tCO2e per EUR million',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_results', column: 'carbon_intensity_tco2_per_meur', type: 'FLOAT', migration: '050_add_pcaf_quality_basel_capital_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Computed from DQS-scored inputs', coverage: '80%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'total_emissions + annual_revenue', output: 'carbon_intensity', logic: 'tCO2e / (revenue_eur / 1_000_000)', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'waci', tab: 'WACI Analysis' },
      { module: 'esg-data-quality', field: 'intensityBenchmark', tab: 'Peer Comparison' },
    ],
    lineage: 'assets_pg emissions + revenue → pcaf_portfolio_results.carbon_intensity → Frontend',
    unit: 'tCO2e/EUR M', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC013', name: 'PCAF Attribution Factor',
    description: 'Outstanding amount / EVIC — determines share of investee emissions',
    source: { type: 'Computed', provider: 'Internal PCAF Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'assets_pg', column: 'attribution_factor', type: 'NUMERIC(10,6)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Deterministic calculation', coverage: '95%', freshness: 'Real-time' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'outstanding_amount + evic_eur', output: 'attribution_factor', logic: 'MIN(outstanding / EVIC, 1.0)', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'attributionFactor', tab: 'Attribution Detail' },
    ],
    lineage: 'assets_pg.outstanding + assets_pg.evic → attribution_factor → Frontend',
    unit: 'ratio (0-1)', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC014', name: 'PCAF Data Quality Score',
    description: 'PCAF DQS 1-5 per holding — measures reliability of emissions data',
    source: { type: 'Computed', provider: 'Internal DQS Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'assets_pg', column: 'pcaf_dqs', type: 'SMALLINT', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Rule-based assignment', coverage: '100%', freshness: 'Real-time' },
    pipeline: [
      { stage: 1, name: 'DQS Assignment', input: 'Data source type + verification', output: 'pcaf_dqs (1-5)', logic: 'DQS tree: verified reported=1, reported=2, physical=3, EEIO=4, sector avg=5', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'dqsScore', tab: 'Quality Dashboard' },
      { module: 'esg-data-quality', field: 'pcafDqs', tab: 'DQS Distribution' },
    ],
    lineage: 'Data source metadata → pcaf_dqs rule engine → assets_pg.pcaf_dqs → Frontend',
    unit: 'score (1-5)', updateFrequency: 'On-demand', owner: 'Data Quality Team',
  },
  {
    id: 'DC015', name: 'PCAF Holding Quality Scores (Composite)',
    description: 'Multi-dimensional PCAF quality: emissions, completeness, timeliness, granularity, methodology',
    source: { type: 'Computed', provider: 'Internal DQS Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_holding_quality_scores', column: 'weighted_dqs', type: 'FLOAT', migration: '050_add_pcaf_quality_basel_capital_tables', foreignKeys: ['holding_id → assets_pg.id'] },
    quality: { dqs: 1, verification: 'Rule-based', coverage: '100%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: '5 DQS dimensions per holding', output: 'weighted_dqs', logic: 'Weighted average: 40% emissions + 20% completeness + 15% timeliness + 15% granularity + 10% methodology', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'compositeDqs', tab: 'Quality Deep-Dive' },
    ],
    lineage: 'pcaf_holding_quality_scores → Frontend',
    unit: 'score (1.0-5.0)', updateFrequency: 'On-demand', owner: 'Data Quality Team',
  },
  {
    id: 'DC016', name: 'PCAF Portfolio Quality Report',
    description: 'Portfolio-level aggregated DQS with distribution and improvement roadmap',
    source: { type: 'Computed', provider: 'Internal', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_quality_reports', column: 'portfolio_weighted_dqs', type: 'FLOAT', migration: '050_add_pcaf_quality_basel_capital_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Computed', coverage: '100%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'All pcaf_holding_quality_scores for portfolio', output: 'portfolio_weighted_dqs', logic: 'Outstanding-weighted average DQS', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'portfolioDqs', tab: 'Portfolio DQS Report' },
    ],
    lineage: 'pcaf_holding_quality_scores → pcaf_portfolio_quality_reports → Frontend',
    unit: 'score (1.0-5.0)', updateFrequency: 'On-demand', owner: 'Data Quality Team',
  },
  {
    id: 'DC017', name: 'EVIC (Enterprise Value Including Cash)',
    description: 'Denominator for PCAF attribution factor — market cap + total debt + cash',
    source: { type: 'API', provider: 'Bloomberg / Refinitiv', frequency: 'Quarterly', format: 'API' },
    db: { schema: 'public', table: 'assets_pg', column: 'evic_eur', type: 'NUMERIC(18,2)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Market data provider', coverage: '90%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Market cap + debt + cash', output: 'evic_eur', logic: 'EVIC = market_cap + total_debt + preferred_equity + minority_interest', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'evic', tab: 'Attribution Detail' },
    ],
    lineage: 'Bloomberg/Refinitiv → assets_pg.evic_eur → PCAF AF calc → Frontend',
    unit: 'EUR', updateFrequency: 'Quarterly', owner: 'Market Data Team',
  },
  {
    id: 'DC018', name: 'PCAF Asset Class',
    description: 'PCAF Standard Part A asset class classification for each holding',
    source: { type: 'Manual', provider: 'Portfolio Manager', frequency: 'On-trade', format: 'Enum' },
    db: { schema: 'public', table: 'assets_pg', column: 'pcaf_asset_class', type: 'VARCHAR(50)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Manual classification', coverage: '100%', freshness: 'Real-time' },
    pipeline: [
      { stage: 1, name: 'Classification', input: 'Instrument type', output: 'pcaf_asset_class', logic: 'Map to: listed_equity | corporate_bonds | business_loans | project_finance | mortgages | commercial_re | motor_vehicle', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'assetClass', tab: 'Asset Class Breakdown' },
    ],
    lineage: 'Trade booking → assets_pg.pcaf_asset_class → Frontend',
    unit: 'category', updateFrequency: 'On-trade', owner: 'Portfolio Operations',
  },
  {
    id: 'DC019', name: 'Avoided Emissions (Scope 4)',
    description: 'Emissions avoided by products/services compared to baseline — not in GHG Protocol',
    source: { type: 'Computed', provider: 'Company Disclosure / Internal Model', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'company_profiles', column: 'avoided_emissions_tco2e', type: 'NUMERIC(18,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 4, verification: 'Self-reported / modelled', coverage: '30%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Company avoided-emissions claim', output: 'company_profiles.avoided_emissions_tco2e', logic: 'Validate baseline methodology, apply ICMA guidelines', intermediary: null },
    ],
    consumers: [
      { module: 'carbon-removal', field: 'avoidedEmissions', tab: 'CDR vs Avoided' },
      { module: 'impact-weighted-accounts', field: 'avoidedImpact', tab: 'Environmental P&L' },
    ],
    lineage: 'Company claim → company_profiles → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC020', name: 'SBTi Alignment Flag',
    description: 'Whether the company has an SBTi-validated science-based target',
    source: { type: 'API', provider: 'SBTi Target Dashboard', frequency: 'Monthly', format: 'CSV/API' },
    db: { schema: 'public', table: 'assets_pg', column: 'sbti_aligned', type: 'BOOLEAN', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'SBTi validation', coverage: '100%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'SBTi target list download', output: 'assets_pg.sbti_aligned', logic: 'Match on company name / LEI, set TRUE if near-term or net-zero validated', intermediary: null },
    ],
    consumers: [
      { module: 'temperature-alignment', field: 'sbtiFlag', tab: 'Target Validation' },
      { module: 'transition-finance', field: 'sbtiStatus', tab: 'Transition Readiness' },
    ],
    lineage: 'SBTi Dashboard → assets_pg.sbti_aligned → Frontend',
    unit: 'boolean', updateFrequency: 'Monthly', owner: 'ESG Data Team',
  },
  {
    id: 'DC021', name: 'Net-Zero Commitment Flag',
    description: 'Whether the company has a public net-zero commitment',
    source: { type: 'API', provider: 'Race to Zero / GFANZ', frequency: 'Monthly', format: 'CSV' },
    db: { schema: 'public', table: 'assets_pg', column: 'net_zero_committed', type: 'BOOLEAN', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Public pledge registry', coverage: '100%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'GFANZ / Race to Zero member list', output: 'assets_pg.net_zero_committed', logic: 'Match on entity name/LEI, set TRUE if pledge found', intermediary: null },
    ],
    consumers: [
      { module: 'transition-finance', field: 'netZeroFlag', tab: 'Commitment Tracker' },
      { module: 'climate-banking-hub', field: 'nzCommitment', tab: 'Net Zero Scorecard' },
    ],
    lineage: 'GFANZ registry → assets_pg.net_zero_committed → Frontend',
    unit: 'boolean', updateFrequency: 'Monthly', owner: 'ESG Data Team',
  },
  {
    id: 'DC022', name: 'Transition Plan Status',
    description: 'Status of entity climate transition plan: not_started → validated → on_track',
    source: { type: 'Manual', provider: 'Engagement Team / TPT', frequency: 'Semi-annual', format: 'Enum' },
    db: { schema: 'public', table: 'assets_pg', column: 'transition_plan_status', type: 'VARCHAR(50)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Analyst assessment', coverage: '70%', freshness: 'Semi-annual' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'TPT framework evaluation', output: 'transition_plan_status', logic: 'Score plan against TPT criteria, assign status enum', intermediary: null },
    ],
    consumers: [
      { module: 'transition-finance', field: 'tpStatus', tab: 'Plan Assessment' },
      { module: 'ai-engagement', field: 'transitionStatus', tab: 'Engagement Priority' },
    ],
    lineage: 'Engagement Team → assets_pg.transition_plan_status → Frontend',
    unit: 'category', updateFrequency: 'Semi-annual', owner: 'Engagement Team',
  },
  {
    id: 'DC023', name: 'Sector Average Emission Factor',
    description: 'EXIOBASE / EEIO sector-average emission factors for Scope 3 estimation',
    source: { type: 'Static', provider: 'EXIOBASE / PCAF DB', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'emission_factors', column: 'factor_value', type: 'NUMERIC(12,6)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 5, verification: 'Model-based', coverage: '100%', freshness: 'EXIOBASE v3.8' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'EXIOBASE sector intensities', output: 'emission_factors (sector_average type)', logic: 'Map NACE/GICS sectors to tCO2e/EUR M revenue', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'sectorEF', tab: 'Estimation Methodology' },
      { module: 'carbon-accounting-ai', field: 'eeioFactor', tab: 'Scope 3 Estimation' },
    ],
    lineage: 'EXIOBASE → emission_factors → PCAF estimation engine → Frontend',
    unit: 'tCO2e/EUR M revenue', updateFrequency: 'Annual', owner: 'Reference Data Team',
  },
  {
    id: 'DC024', name: 'Facilitated Emissions',
    description: 'Emissions from capital markets facilitation (underwriting, arranging)',
    source: { type: 'Computed', provider: 'Internal PCAF Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'facilitated_emissions', column: 'facilitated_tco2e', type: 'NUMERIC(18,2)', migration: '041_add_facilitated_insurance_emissions_tables', foreignKeys: [] },
    quality: { dqs: 4, verification: 'Model-based (PCAF Part C)', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Deal Mapping', input: 'Underwriting/arranging mandates', output: 'deal_emissions_base', logic: 'Map deal to issuer emissions via LEI', intermediary: 'staging.deals_mapped' },
      { stage: 2, name: 'Attribution', input: 'Bank share of deal + issuer emissions', output: 'facilitated_tco2e', logic: 'facility_share × issuer_total_emissions', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'facilitatedEmissions', tab: 'Capital Markets' },
      { module: 'climate-banking-hub', field: 'facilitatedTotal', tab: 'Facilitated Tab' },
    ],
    lineage: 'Deal records → issuer emissions → facilitated_emissions → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC025', name: 'Insurance-Associated Emissions',
    description: 'Emissions from insurance underwriting portfolios (PCAF Part C)',
    source: { type: 'Computed', provider: 'Internal PCAF Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'insurance_associated_emissions', column: 'insured_emissions_tco2e', type: 'NUMERIC(18,2)', migration: '041_add_facilitated_insurance_emissions_tables', foreignKeys: [] },
    quality: { dqs: 4, verification: 'Model-based', coverage: '50%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Premium Attribution', input: 'GWP premium + insured emissions', output: 'insured_emissions_tco2e', logic: 'premium_share × insured_entity_emissions', intermediary: null },
    ],
    consumers: [
      { module: 'climate-insurance', field: 'insuredEmissions', tab: 'Underwriting Emissions' },
    ],
    lineage: 'Insurance portfolio → insurance_associated_emissions → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'Insurance Analytics Team',
  },
  {
    id: 'DC026', name: 'Methane Emissions (CH4)',
    description: 'Methane-specific emissions for oil & gas, agriculture, waste sectors',
    source: { type: 'API', provider: 'OGMP 2.0 / IEA Methane Tracker', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'methane_emissions_tco2e', type: 'NUMERIC(18,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 3, verification: 'OGMP Level 4-5 where available', coverage: '40%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'OGMP / satellite data', output: 'methane_emissions', logic: 'Convert CH4 tonnes to tCO2e using GWP-100 (29.8)', intermediary: null },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'methaneEmissions', tab: 'GHG Breakdown' },
    ],
    lineage: 'OGMP/IEA → company_profiles → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC027', name: 'Biogenic Emissions',
    description: 'CO2 from biogenic sources (biomass combustion) — reported separately per GHG Protocol',
    source: { type: 'API', provider: 'Company Disclosure', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'company_profiles', column: 'biogenic_emissions_tco2', type: 'NUMERIC(18,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Reported separately', coverage: '25%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'GHG Protocol biogenic memo', output: 'biogenic_emissions_tco2', logic: 'Parse biogenic CO2 — kept outside scope totals', intermediary: null },
    ],
    consumers: [
      { module: 'carbon-accounting-ai', field: 'biogenicCO2', tab: 'Biogenic Memo' },
    ],
    lineage: 'Disclosure → company_profiles → Frontend',
    unit: 'tCO2', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC028', name: 'Weighted Average Carbon Intensity (WACI)',
    description: 'TCFD metric: portfolio-weight × (scope1+2 / revenue) per holding',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_results', column: 'waci_tco2_per_meur', type: 'FLOAT', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Computed', coverage: '85%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Per-Holding', input: 'weight × (scope1+scope2) / revenue', output: 'holding_waci', logic: 'TCFD WACI formula per PCAF guidance', intermediary: null },
      { stage: 2, name: 'Aggregation', input: 'SUM(holding_waci)', output: 'portfolio waci', logic: 'Sum across portfolio', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'waci', tab: 'TCFD Metrics' },
      { module: 'climate-financial-statements', field: 'waciMetric', tab: 'Climate KPIs' },
    ],
    lineage: 'assets_pg → WACI calc → pcaf_portfolio_results → Frontend',
    unit: 'tCO2e/EUR M revenue', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC029', name: 'Total Carbon Footprint',
    description: 'Sum of all financed emissions (Scope 1+2) per EUR M invested — TCFD metric',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'pcaf_portfolio_results', column: 'carbon_footprint_tco2_per_meur', type: 'FLOAT', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Computed', coverage: '85%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'Total FE (S1+S2) / portfolio AUM', output: 'carbon_footprint', logic: 'total_financed_scope12 / (aum / 1_000_000)', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'carbonFootprint', tab: 'TCFD Metrics' },
    ],
    lineage: 'pcaf_portfolio_results totals / AUM → Frontend',
    unit: 'tCO2e/EUR M invested', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC030', name: 'Year-on-Year Emissions Change',
    description: 'Percentage change in financed emissions vs prior reporting period',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'time_series_data', column: 'value', type: 'NUMERIC(18,4)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Computed from verified periods', coverage: '75%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Comparison', input: 'FE(t) vs FE(t-1)', output: 'yoy_change_pct', logic: '(FE_current - FE_prior) / FE_prior × 100', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'yoyChange', tab: 'Trend Analysis' },
      { module: 'climate-banking-hub', field: 'emissionsTrend', tab: 'Executive Dashboard' },
    ],
    lineage: 'time_series_data (2 periods) → calculation → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Climate Analytics Team',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ESG RATINGS DOMAIN (DC031–DC055)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC031', name: 'MSCI ESG Rating',
    description: 'MSCI ESG rating from CCC to AAA (7-point scale)',
    source: { type: 'API', provider: 'MSCI ESG Research', frequency: 'Monthly', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'msci_esg_rating', type: 'VARCHAR(5)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'MSCI methodology', coverage: '8,700+ companies', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'MSCI ESG API feed', output: 'company_profiles.msci_esg_rating', logic: 'Map letter rating + score (0-10)', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'msciRating', tab: 'Ratings Overview' },
      { module: 'esg-controversy', field: 'msciBaseline', tab: 'Rating Impact' },
      { module: 'predictive-esg', field: 'msciTarget', tab: 'Rating Prediction' },
    ],
    lineage: 'MSCI API → company_profiles → Frontend',
    unit: 'letter (CCC–AAA)', updateFrequency: 'Monthly', owner: 'ESG Data Team',
  },
  {
    id: 'DC032', name: 'Sustainalytics ESG Risk Score',
    description: 'Morningstar Sustainalytics ESG Risk Rating — unmanaged risk exposure',
    source: { type: 'API', provider: 'Sustainalytics', frequency: 'Monthly', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'sustainalytics_risk_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Sustainalytics methodology', coverage: '14,000+ companies', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Sustainalytics feed', output: 'company_profiles', logic: 'Store risk score (0-100) and risk category', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'sustainalyticsScore', tab: 'Ratings Overview' },
      { module: 'anomaly-detection', field: 'esgRiskInput', tab: 'ESG Anomaly Detection' },
    ],
    lineage: 'Sustainalytics → company_profiles → Frontend',
    unit: 'score (0-100, lower=better)', updateFrequency: 'Monthly', owner: 'ESG Data Team',
  },
  {
    id: 'DC033', name: 'ISS ESG Corporate Rating',
    description: 'ISS ESG corporate rating on A+ to D- scale',
    source: { type: 'API', provider: 'ISS ESG', frequency: 'Quarterly', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'iss_esg_score', type: 'VARCHAR(5)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'ISS methodology', coverage: '9,000+ companies', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ISS ESG feed', output: 'company_profiles.iss_esg_score', logic: 'Map letter grade + numeric score', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'issScore', tab: 'Ratings Comparison' },
    ],
    lineage: 'ISS ESG → company_profiles → Frontend',
    unit: 'letter (A+ to D-)', updateFrequency: 'Quarterly', owner: 'ESG Data Team',
  },
  {
    id: 'DC034', name: 'CDP Climate Score',
    description: 'CDP climate change programme score (A to D-)',
    source: { type: 'API', provider: 'CDP', frequency: 'Annual', format: 'CSV/API' },
    db: { schema: 'public', table: 'company_profiles', column: 'cdp_climate_score', type: 'VARCHAR(5)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'CDP methodology', coverage: '13,000+ disclosers', freshness: 'Annual (Dec)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'CDP scores release', output: 'company_profiles.cdp_climate_score', logic: 'Map letter score, store disclosure status', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'cdpScore', tab: 'Ratings Overview' },
      { module: 'carbon-accounting-ai', field: 'cdpDisclosure', tab: 'Data Sources' },
    ],
    lineage: 'CDP → company_profiles → Frontend',
    unit: 'letter (A to D-)', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC035', name: 'S&P Global ESG Score',
    description: 'S&P Global ESG Score from Corporate Sustainability Assessment (CSA)',
    source: { type: 'API', provider: 'S&P Global', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'sp_esg_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'S&P CSA methodology', coverage: '10,000+ companies', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'S&P CSA scores', output: 'company_profiles.sp_esg_score', logic: 'Store total score (0-100) + E/S/G pillars', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'spScore', tab: 'Ratings Overview' },
    ],
    lineage: 'S&P CSA → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC036', name: 'Bloomberg ESG Disclosure Score',
    description: 'Bloomberg ESG disclosure score based on reported datapoints',
    source: { type: 'API', provider: 'Bloomberg', frequency: 'Continuous', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'bloomberg_esg_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Bloomberg data collection', coverage: '11,000+ companies', freshness: 'Continuous' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Bloomberg terminal feed', output: 'company_profiles.bloomberg_esg_score', logic: 'Store score (0-100)', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'bbgScore', tab: 'Ratings Overview' },
    ],
    lineage: 'Bloomberg → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Continuous', owner: 'ESG Data Team',
  },
  {
    id: 'DC037', name: 'ESG Consensus Score',
    description: 'Averaged consensus across MSCI, Sustainalytics, ISS, CDP, S&P, Bloomberg',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 'esg_consensus_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Multi-provider average', coverage: '80%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Normalization', input: 'All 6 provider scores', output: 'Normalised 0-100 scale', logic: 'Min-max normalize each to 0-100, handle missing', intermediary: 'staging.normalized_ratings' },
      { stage: 2, name: 'Consensus', input: 'Normalised scores', output: 'esg_consensus_score', logic: 'Weighted average (equal weight for available providers)', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'consensusScore', tab: 'Consensus Dashboard' },
      { module: 'predictive-esg', field: 'consensusInput', tab: 'Model Features' },
    ],
    lineage: 'All providers → normalization → consensus calc → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Monthly', owner: 'ESG Analytics Team',
  },
  {
    id: 'DC038', name: 'ESG Ratings Divergence Score',
    description: 'Standard deviation across normalised ESG ratings — measures disagreement',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 'esg_divergence_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Statistical measure', coverage: '80%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'Normalised provider scores', output: 'divergence_score', logic: 'STDDEV(normalised_scores) across available providers', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'divergenceScore', tab: 'Divergence Analysis' },
      { module: 'anomaly-detection', field: 'ratingDivergence', tab: 'Anomaly Flags' },
    ],
    lineage: 'Normalised ratings → STDDEV → company_profiles → Frontend',
    unit: 'score (0-50, higher=more divergent)', updateFrequency: 'Monthly', owner: 'ESG Analytics Team',
  },
  {
    id: 'DC039', name: 'Controversy Count',
    description: 'Number of active ESG controversies from RepRisk/GDELT',
    source: { type: 'API', provider: 'RepRisk / GDELT', frequency: 'Daily', format: 'API' },
    db: { schema: 'public', table: 'gdelt_controversy_events', column: 'event_count', type: 'INTEGER', migration: '032_add_gdelt_controversy_tables', foreignKeys: ['entity_id → company_profiles.id'] },
    quality: { dqs: 2, verification: 'NLP-validated', coverage: '90%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'GDELT/RepRisk event feed', output: 'gdelt_controversy_events', logic: 'Match entity via name/LEI, classify severity', intermediary: 'staging.controversy_raw' },
      { stage: 2, name: 'Aggregation', input: 'Events per entity', output: 'Controversy count + max severity', logic: 'COUNT events, MAX severity in rolling 12m window', intermediary: null },
    ],
    consumers: [
      { module: 'esg-controversy', field: 'controversyCount', tab: 'Controversy Timeline' },
      { module: 'sentiment-analysis', field: 'negativeEvents', tab: 'News Sentiment' },
    ],
    lineage: 'GDELT/RepRisk → gdelt_controversy_events → Frontend',
    unit: 'count', updateFrequency: 'Daily', owner: 'ESG Monitoring Team',
  },
  {
    id: 'DC040', name: 'Controversy Severity Score',
    description: 'Maximum severity of active controversies (1-5 scale)',
    source: { type: 'Computed', provider: 'Internal NLP Engine', frequency: 'Daily', format: 'Calculated' },
    db: { schema: 'public', table: 'gdelt_controversy_events', column: 'severity_score', type: 'INTEGER', migration: '032_add_gdelt_controversy_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'NLP + analyst review', coverage: '90%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'NLP Classification', input: 'Event text + source', output: 'severity_score (1-5)', logic: 'NLP severity model: 1=low, 2=moderate, 3=significant, 4=high, 5=severe', intermediary: null },
    ],
    consumers: [
      { module: 'esg-controversy', field: 'severityMax', tab: 'Risk Heatmap' },
      { module: 'ai-engagement', field: 'controversySeverity', tab: 'Engagement Urgency' },
    ],
    lineage: 'Event text → NLP model → severity_score → Frontend',
    unit: 'score (1-5)', updateFrequency: 'Daily', owner: 'ESG Monitoring Team',
  },
  {
    id: 'DC041', name: 'E Pillar Score',
    description: 'Environmental pillar score (normalised 0-100)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 'e_pillar_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Multi-source composite', coverage: '80%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'Provider E-pillar sub-scores', output: 'e_pillar_score', logic: 'Normalise + weight: emissions(30%), resource(25%), waste(20%), biodiversity(15%), water(10%)', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'ePillar', tab: 'Pillar Breakdown' },
      { module: 'double-materiality', field: 'envScore', tab: 'Impact Assessment' },
    ],
    lineage: 'Provider E-scores → normalization → company_profiles.e_pillar_score → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Monthly', owner: 'ESG Analytics Team',
  },
  {
    id: 'DC042', name: 'S Pillar Score',
    description: 'Social pillar score (normalised 0-100)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 's_pillar_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Multi-source composite', coverage: '80%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'Provider S-pillar sub-scores', output: 's_pillar_score', logic: 'Normalise + weight: labour(30%), H&S(25%), community(20%), supply chain(15%), product(10%)', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'sPillar', tab: 'Pillar Breakdown' },
      { module: 'social-taxonomy', field: 'socialScore', tab: 'Social Assessment' },
    ],
    lineage: 'Provider S-scores → normalization → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Monthly', owner: 'ESG Analytics Team',
  },
  {
    id: 'DC043', name: 'G Pillar Score',
    description: 'Governance pillar score (normalised 0-100)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 'g_pillar_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Multi-source composite', coverage: '80%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'Provider G-pillar sub-scores', output: 'g_pillar_score', logic: 'Normalise + weight: board(35%), exec comp(25%), shareholder rights(20%), audit(10%), anti-corruption(10%)', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'gPillar', tab: 'Pillar Breakdown' },
      { module: 'ai-governance', field: 'govScore', tab: 'Governance Assessment' },
    ],
    lineage: 'Provider G-scores → normalization → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Monthly', owner: 'ESG Analytics Team',
  },
  {
    id: 'DC044', name: 'UNGC Compliance Status',
    description: 'UN Global Compact signatory status and compliance flag',
    source: { type: 'API', provider: 'UNGC Participant Database', frequency: 'Monthly', format: 'CSV' },
    db: { schema: 'public', table: 'reference_violations', column: 'ungc_status', type: 'VARCHAR(50)', migration: '031_add_reference_violations_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'UNGC official register', coverage: '100% of signatories', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'UNGC participant list', output: 'reference_violations.ungc_status', logic: 'Match entity, store: active | non-communicating | delisted | non-signatory', intermediary: null },
    ],
    consumers: [
      { module: 'esg-controversy', field: 'ungcStatus', tab: 'Norms Screening' },
      { module: 'sfdr-art9', field: 'ungcCompliance', tab: 'SFDR Exclusions' },
    ],
    lineage: 'UNGC → reference_violations → Frontend',
    unit: 'category', updateFrequency: 'Monthly', owner: 'ESG Data Team',
  },
  {
    id: 'DC045', name: 'OECD Guidelines Violations',
    description: 'OECD MNE Guidelines violation instances from NCP complaints',
    source: { type: 'API', provider: 'OECD NCP Database', frequency: 'Quarterly', format: 'CSV' },
    db: { schema: 'public', table: 'reference_violations', column: 'oecd_violations', type: 'JSONB', migration: '031_add_reference_violations_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Official NCP records', coverage: '100% of NCP cases', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'OECD NCP case records', output: 'reference_violations', logic: 'Match entity, store case details and status', intermediary: null },
    ],
    consumers: [
      { module: 'esg-controversy', field: 'oecdViolations', tab: 'Norms Screening' },
      { module: 'forced-labour', field: 'oecdFlags', tab: 'HRDD Assessment' },
    ],
    lineage: 'OECD NCP → reference_violations → Frontend',
    unit: 'count + detail', updateFrequency: 'Quarterly', owner: 'ESG Data Team',
  },
  {
    id: 'DC046', name: 'CA100+ Engagement Status',
    description: 'Climate Action 100+ company engagement status and benchmark results',
    source: { type: 'API', provider: 'CA100+ Benchmark', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'ca100_company_benchmarks', column: 'benchmark_data', type: 'JSONB', migration: '033_add_ca100_country_risk', foreignKeys: [] },
    quality: { dqs: 1, verification: 'CA100+ published benchmark', coverage: '170 focus companies', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'CA100+ Net Zero Benchmark', output: 'ca100_company_benchmarks', logic: 'Store indicator scores across 10 dimensions', intermediary: null },
    ],
    consumers: [
      { module: 'ai-engagement', field: 'ca100Status', tab: 'Engagement Targets' },
      { module: 'transition-finance', field: 'ca100Benchmark', tab: 'Benchmark Results' },
    ],
    lineage: 'CA100+ → ca100_company_benchmarks → Frontend',
    unit: 'benchmark scores', updateFrequency: 'Annual', owner: 'Engagement Team',
  },
  {
    id: 'DC047', name: 'ESG Sentiment Score',
    description: 'NLP-derived sentiment from news/social media on ESG topics per entity',
    source: { type: 'Computed', provider: 'Internal NLP Pipeline', frequency: 'Daily', format: 'Calculated' },
    db: { schema: 'public', table: 'esg_sentiment_scores', column: 'sentiment_composite', type: 'NUMERIC(5,2)', migration: '054_add_factor_registry_and_sentiment', foreignKeys: [] },
    quality: { dqs: 3, verification: 'NLP model validated', coverage: '70%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Collection', input: 'News feeds + social media', output: 'Raw text corpus', logic: 'Filter ESG-relevant articles by entity', intermediary: 'staging.news_raw' },
      { stage: 2, name: 'NLP Scoring', input: 'Text corpus', output: 'sentiment_composite', logic: 'TF-IDF + FinBERT sentiment → composite -1 to +1', intermediary: null },
    ],
    consumers: [
      { module: 'sentiment-analysis', field: 'sentimentScore', tab: 'Sentiment Dashboard' },
      { module: 'esg-controversy', field: 'sentimentOverlay', tab: 'News Sentiment' },
    ],
    lineage: 'News/Social → NLP pipeline → esg_sentiment_scores → Frontend',
    unit: 'score (-1 to +1)', updateFrequency: 'Daily', owner: 'AI Analytics Team',
  },
  {
    id: 'DC048', name: 'ESG Factor Returns',
    description: 'Factor-model returns attributable to ESG rating changes',
    source: { type: 'Computed', provider: 'Internal Factor Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'esg_factor_registry', column: 'factor_return', type: 'NUMERIC(10,6)', migration: '054_add_factor_registry_and_sentiment', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Backtested factor model', coverage: '85%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Factor Construction', input: 'ESG score changes + returns', output: 'esg_factor_registry', logic: 'Long-short portfolio: top vs bottom quintile ESG, residualize vs Fama-French', intermediary: null },
    ],
    consumers: [
      { module: 'predictive-esg', field: 'esgFactorReturn', tab: 'Factor Attribution' },
    ],
    lineage: 'Returns + ESG scores → factor model → esg_factor_registry → Frontend',
    unit: 'return (%)', updateFrequency: 'Monthly', owner: 'Quant Research Team',
  },
  {
    id: 'DC049', name: 'RepRisk Index (RRI)',
    description: 'RepRisk reputational risk index based on ESG-related incidents',
    source: { type: 'API', provider: 'RepRisk', frequency: 'Daily', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'reprisk_index', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'RepRisk methodology', coverage: '200,000+ entities', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'RepRisk API', output: 'company_profiles.reprisk_index', logic: 'Store RRI (0-100) + peak RRI + trend', intermediary: null },
    ],
    consumers: [
      { module: 'esg-controversy', field: 'repRiskIndex', tab: 'RepRisk Overview' },
    ],
    lineage: 'RepRisk → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Daily', owner: 'ESG Data Team',
  },
  {
    id: 'DC050', name: 'ESG Momentum Score',
    description: '12-month rate of change in consensus ESG score — identifies improvers/laggards',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Monthly', format: 'Calculated' },
    db: { schema: 'public', table: 'time_series_data', column: 'value', type: 'NUMERIC(18,4)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Computed from time series', coverage: '75%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'consensus_score(t) vs consensus_score(t-12m)', output: 'momentum_score', logic: '(score_now - score_12m_ago) / score_12m_ago × 100', intermediary: null },
    ],
    consumers: [
      { module: 'predictive-esg', field: 'esgMomentum', tab: 'Momentum Signals' },
      { module: 'ai-engagement', field: 'momentumFlag', tab: 'Watch List' },
    ],
    lineage: 'time_series_data → momentum calc → Frontend',
    unit: '% change', updateFrequency: 'Monthly', owner: 'ESG Analytics Team',
  },
  {
    id: 'DC051', name: 'Proxy Voting Record',
    description: 'Proxy voting decisions on ESG-related resolutions per company',
    source: { type: 'Manual', provider: 'Stewardship Team / ISS Proxy', frequency: 'Per-AGM', format: 'CSV' },
    db: { schema: 'public', table: 'engagement_records', column: 'voting_record', type: 'JSONB', migration: '024_engagement_tracker', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Internal stewardship record', coverage: '100% of voted proxies', freshness: 'Per-AGM' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ISS ProxyExchange + internal decisions', output: 'engagement_records', logic: 'Store: resolution_id, vote(for/against/abstain), rationale, ESG category', intermediary: null },
    ],
    consumers: [
      { module: 'ai-engagement', field: 'proxyVotes', tab: 'Voting Record' },
    ],
    lineage: 'ISS Proxy → engagement_records → Frontend',
    unit: 'vote records', updateFrequency: 'Per-AGM', owner: 'Stewardship Team',
  },
  {
    id: 'DC052', name: 'Engagement Milestone Status',
    description: 'Active engagement status with portfolio companies on ESG issues',
    source: { type: 'Manual', provider: 'Engagement Team', frequency: 'Quarterly', format: 'Internal tracker' },
    db: { schema: 'public', table: 'engagement_records', column: 'engagement_status', type: 'VARCHAR(50)', migration: '024_engagement_tracker', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Internal records', coverage: '100%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Tracking', input: 'Engagement meeting notes', output: 'engagement_records', logic: 'Track: initiated | in_progress | milestone_achieved | escalated | completed', intermediary: null },
    ],
    consumers: [
      { module: 'ai-engagement', field: 'engagementStatus', tab: 'Engagement Pipeline' },
      { module: 'reporting-hub', field: 'engagementStats', tab: 'Stewardship Report' },
    ],
    lineage: 'Engagement team → engagement_records → Frontend',
    unit: 'category', updateFrequency: 'Quarterly', owner: 'Engagement Team',
  },
  {
    id: 'DC053', name: 'TCFD Maturity Score',
    description: 'TCFD-recommended disclosures maturity across 11 recommendations',
    source: { type: 'Manual', provider: 'Analyst Assessment', frequency: 'Annual', format: 'Structured assessment' },
    db: { schema: 'public', table: 'tcfd_assessments', column: 'overall_maturity', type: 'NUMERIC(3,1)', migration: '009_add_regulatory_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Analyst review', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'Company reports + TCFD template', output: 'tcfd_assessments', logic: 'Score 0-5 across Governance, Strategy, Risk Mgmt, Metrics pillars', intermediary: null },
    ],
    consumers: [
      { module: 'issb-tcfd', field: 'tcfdMaturity', tab: 'TCFD Scorecard' },
      { module: 'comprehensive-reporting', field: 'tcfdScore', tab: 'Framework Coverage' },
    ],
    lineage: 'Company reports → analyst → tcfd_assessments → Frontend',
    unit: 'score (0-5)', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC054', name: 'EU Taxonomy Alignment Percentage (Turnover)',
    description: 'Share of company turnover aligned with EU Taxonomy objectives',
    source: { type: 'API', provider: 'Company Disclosure / Analyst', frequency: 'Annual', format: 'Structured' },
    db: { schema: 'public', table: 'taxonomy_entity_alignments', column: 'turnover_alignment_pct', type: 'FLOAT', migration: '051_add_eu_taxonomy_transition_plan_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Company reported + analyst review', coverage: '50%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Activity Assessment', input: 'NACE activities + TSC', output: 'taxonomy_activity_assessments', logic: 'Evaluate SC + DNSH + minimum safeguards per activity', intermediary: 'taxonomy_activity_assessments' },
      { stage: 2, name: 'Entity Aggregation', input: 'Activity-level alignment', output: 'taxonomy_entity_alignments', logic: 'Sum aligned_turnover / total_turnover', intermediary: null },
    ],
    consumers: [
      { module: 'eu-taxonomy', field: 'turnoverAlignment', tab: 'Entity Assessment' },
      { module: 'eu-taxonomy-engine', field: 'taxonomyPct', tab: 'Alignment Dashboard' },
      { module: 'sfdr-art9', field: 'taxonomyAlignment', tab: 'Sustainable Investment' },
    ],
    lineage: 'Company disclosure → taxonomy_activity_assessments → taxonomy_entity_alignments → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Taxonomy Team',
  },
  {
    id: 'DC055', name: 'Green Asset Ratio (GAR)',
    description: 'Financial institution taxonomy-aligned assets / total banking book',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'taxonomy_portfolio_alignments', column: 'green_asset_ratio', type: 'FLOAT', migration: '051_add_eu_taxonomy_transition_plan_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Computed from entity alignments', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Portfolio Mapping', input: 'Banking book + entity alignments', output: 'taxonomy_portfolio_alignments', logic: 'Weight taxonomy-aligned by exposure; GAR = aligned_exposures / total_exposures', intermediary: null },
    ],
    consumers: [
      { module: 'eu-taxonomy-engine', field: 'gar', tab: 'Portfolio GAR' },
      { module: 'regulatory-capital', field: 'garInput', tab: 'Pillar 3 ESG' },
    ],
    lineage: 'taxonomy_entity_alignments → portfolio weighting → taxonomy_portfolio_alignments.gar → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIMATE RISK DOMAIN (DC056–DC085)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC056', name: 'Physical Risk — Flood Score',
    description: 'Asset-level flood hazard score based on climate projections',
    source: { type: 'API', provider: 'Munich Re / WRI Aqueduct', frequency: 'Annual', format: 'API/GeoJSON' },
    db: { schema: 'public', table: 'climate_physical_risk_scores', column: 'hazard_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: ['result_id → climate_assessment_results.id'] },
    quality: { dqs: 2, verification: 'Model-based (CMIP6)', coverage: '80%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Geolocation', input: 'Asset lat/lng from spatial_asset_mapping', output: 'Grid cell assignment', logic: 'Map asset coordinates to hazard grid (0.5° resolution)', intermediary: null },
      { stage: 2, name: 'Hazard Scoring', input: 'Grid cell hazard data', output: 'flood_score (0-1)', logic: 'Combine return-period probability × depth × duration per RCP', intermediary: null },
    ],
    consumers: [
      { module: 'physical-risk-pricing', field: 'floodScore', tab: 'Hazard Map' },
      { module: 'climate-stress-test', field: 'physicalFlood', tab: 'Physical Risk' },
      { module: 'crrem', field: 'floodHazard', tab: 'Asset Risk' },
    ],
    lineage: 'CMIP6 → hazard model → spatial_asset_mapping → climate_physical_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'Annual', owner: 'Climate Risk Team',
  },
  {
    id: 'DC057', name: 'Physical Risk — Heat Stress Score',
    description: 'Asset-level chronic heat stress score (days >35°C, wet-bulb threshold)',
    source: { type: 'API', provider: 'Copernicus / ERA5', frequency: 'Annual', format: 'NetCDF/API' },
    db: { schema: 'public', table: 'climate_physical_risk_scores', column: 'hazard_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'CMIP6 ensemble', coverage: '80%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Projection', input: 'CMIP6 temperature projections', output: 'Exceedance days per grid', logic: 'Count days > 35°C per SSP scenario at asset location', intermediary: null },
    ],
    consumers: [
      { module: 'physical-risk-pricing', field: 'heatScore', tab: 'Hazard Map' },
      { module: 'loss-damage', field: 'heatExposure', tab: 'L&D Assessment' },
    ],
    lineage: 'CMIP6 → heat model → climate_physical_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'Annual', owner: 'Climate Risk Team',
  },
  {
    id: 'DC058', name: 'Physical Risk — Water Stress Score',
    description: 'Asset-level water stress ratio (demand/supply) from WRI Aqueduct',
    source: { type: 'API', provider: 'WRI Aqueduct', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'climate_physical_risk_scores', column: 'hazard_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'WRI model validated', coverage: '85%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Query', input: 'Asset coordinates → Aqueduct API', output: 'water_stress_ratio', logic: 'Retrieve baseline + projected water stress (demand/supply)', intermediary: null },
    ],
    consumers: [
      { module: 'water-risk', field: 'waterStress', tab: 'Water Stress Map' },
      { module: 'physical-risk-pricing', field: 'waterScore', tab: 'Hazard Map' },
    ],
    lineage: 'WRI Aqueduct → climate_physical_risk_scores → Frontend',
    unit: 'ratio (0-5)', updateFrequency: 'Annual', owner: 'Climate Risk Team',
  },
  {
    id: 'DC059', name: 'Physical Risk — Storm/Cyclone Score',
    description: 'Tropical cyclone and windstorm exposure score',
    source: { type: 'API', provider: 'Munich Re NatCatSERVICE', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'climate_physical_risk_scores', column: 'hazard_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'NatCat model', coverage: '75%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Location + NatCat model', output: 'storm_score', logic: 'Combine cyclone frequency × intensity × vulnerability', intermediary: null },
    ],
    consumers: [
      { module: 'physical-risk-pricing', field: 'stormScore', tab: 'Hazard Map' },
      { module: 'climate-insurance', field: 'cycloneExposure', tab: 'NatCat Pricing' },
    ],
    lineage: 'NatCat model → climate_physical_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'Annual', owner: 'Climate Risk Team',
  },
  {
    id: 'DC060', name: 'Physical Risk — Composite Score',
    description: 'Weighted composite physical risk score across all hazards',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_assessment_results', column: 'physical_risk_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Multi-hazard composite', coverage: '80%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'All hazard scores for entity', output: 'physical_risk_score', logic: 'Weighted avg: flood(30%) + heat(25%) + water(25%) + storm(20%)', intermediary: null },
    ],
    consumers: [
      { module: 'physical-risk-pricing', field: 'compositePhysical', tab: 'Risk Summary' },
      { module: 'climate-stress-test', field: 'physicalRiskScore', tab: 'Scenario Output' },
    ],
    lineage: 'climate_physical_risk_scores → aggregation → climate_assessment_results → Frontend',
    unit: 'score (0-1)', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC061', name: 'Transition Risk — Policy Score',
    description: 'Exposure to policy/regulatory transition risk (carbon pricing, regulation)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_transition_risk_scores', column: 'risk_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Model-based', coverage: '70%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Sector + jurisdiction + carbon price', output: 'policy_risk_score', logic: 'Score based on carbon price exposure, regulatory stringency, compliance cost', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'policyRisk', tab: 'Transition Risk' },
      { module: 'climate-policy', field: 'policyScore', tab: 'Policy Tracker' },
    ],
    lineage: 'Carbon prices + regulatory data → scoring model → climate_transition_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC062', name: 'Transition Risk — Technology Score',
    description: 'Exposure to technology disruption risk (stranded assets, substitution)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_transition_risk_scores', column: 'risk_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Model-based', coverage: '70%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Sector + technology adoption curve', output: 'tech_risk_score', logic: 'Score: R&D spend, patent portfolio, tech readiness vs peers', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'techRisk', tab: 'Transition Risk' },
      { module: 'climate-tech', field: 'techDisruption', tab: 'Technology Assessment' },
    ],
    lineage: 'Tech adoption data → scoring → climate_transition_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC063', name: 'Transition Risk — Market Score',
    description: 'Market-driven transition risk (demand shifts, commodity prices)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_transition_risk_scores', column: 'risk_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Model-based', coverage: '70%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Revenue mix + demand scenarios', output: 'market_risk_score', logic: 'Score: revenue-at-risk under demand shift scenarios', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'marketRisk', tab: 'Transition Risk' },
    ],
    lineage: 'Demand scenarios → scoring → climate_transition_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC064', name: 'Transition Risk — Reputation Score',
    description: 'Reputational transition risk from climate-related stigma',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_transition_risk_scores', column: 'risk_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Model-based + sentiment', coverage: '65%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Sentiment + controversy + sector stigma', output: 'reputation_risk', logic: 'Combine sentiment_score + controversy_severity + sector fossil_fuel_pct', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'reputationRisk', tab: 'Transition Risk' },
      { module: 'climate-litigation', field: 'litigationRisk', tab: 'Litigation Exposure' },
    ],
    lineage: 'Sentiment + controversies → scoring → climate_transition_risk_scores → Frontend',
    unit: 'score (0-1)', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC065', name: 'Transition Risk — Composite Score',
    description: 'Weighted composite transition risk across all TCFD categories',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_assessment_results', column: 'transition_risk_score', type: 'NUMERIC(5,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Multi-factor composite', coverage: '70%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'Policy + Tech + Market + Reputation', output: 'transition_risk_score', logic: 'Weighted: policy(35%) + tech(25%) + market(25%) + reputation(15%)', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'compositeTransition', tab: 'Risk Summary' },
      { module: 'dme-risk-engine', field: 'transitionRisk', tab: 'DME Risk Input' },
    ],
    lineage: 'climate_transition_risk_scores → aggregation → climate_assessment_results → Frontend',
    unit: 'score (0-1)', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC066', name: 'Climate Value-at-Risk (CVaR)',
    description: 'Portfolio-level climate VaR under NGFS scenarios',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'climate_assessment_results', column: 'climate_var', type: 'NUMERIC(18,2)', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Scenario-based model', coverage: '70%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Scenario Application', input: 'NGFS scenario params + portfolio', output: 'Per-holding PnL impact', logic: 'Apply carbon price × emissions + physical damage × exposure', intermediary: null },
      { stage: 2, name: 'VaR Aggregation', input: 'Holding-level impacts', output: 'portfolio CVaR', logic: '95th percentile loss across Monte Carlo scenarios', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'climateVaR', tab: 'VaR Output' },
      { module: 'stress-test-orchestrator', field: 'cvarInput', tab: 'ECB/EBA Test' },
      { module: 'dme-risk-engine', field: 'climateVaR', tab: 'VaR Analysis' },
    ],
    lineage: 'NGFS scenarios + portfolio → CVaR model → climate_assessment_results → Frontend',
    unit: 'EUR', updateFrequency: 'On-demand', owner: 'Climate Risk Team',
  },
  {
    id: 'DC067', name: 'Implied Temperature Rise (ITR)',
    description: 'Portfolio temperature alignment in °C above pre-industrial (SBTi methodology)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'temperature_scores', column: 'implied_temp_rise', type: 'NUMERIC(4,2)', migration: '006_add_financial_risk_tables', foreignKeys: ['portfolio_id → pcaf_portfolios.id'] },
    quality: { dqs: 3, verification: 'SBTi/PACTA methodology', coverage: '75%', freshness: 'On recalc' },
    pipeline: [
      { stage: 1, name: 'Target Mapping', input: 'SBTi targets + emissions trajectory', output: 'Per-company ITR', logic: 'Map disclosed target to temperature using SBTi temperature scoring', intermediary: null },
      { stage: 2, name: 'Portfolio Weighting', input: 'Holding weights × company ITR', output: 'Portfolio ITR', logic: 'WACI-weighted temperature score', intermediary: null },
    ],
    consumers: [
      { module: 'temperature-alignment', field: 'portfolioITR', tab: 'Temperature Dashboard' },
      { module: 'climate-banking-hub', field: 'tempAlignment', tab: 'Net Zero Tracker' },
    ],
    lineage: 'SBTi targets → scoring model → temperature_scores → Frontend',
    unit: '°C', updateFrequency: 'On-demand', owner: 'Climate Analytics Team',
  },
  {
    id: 'DC068', name: 'NGFS Scenario Parameters',
    description: 'NGFS Phase IV scenario macro variables (GDP, carbon price, energy mix, temperature)',
    source: { type: 'Static', provider: 'NGFS / IIASA', frequency: 'Per NGFS phase', format: 'CSV' },
    db: { schema: 'public', table: 'climate_assessment_methodologies', column: 'config', type: 'JSONB', migration: '039_add_climate_risk_assessment_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'NGFS official scenarios', coverage: '100%', freshness: 'Phase IV (2023)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'NGFS Scenario Explorer download', output: 'methodology config JSONB', logic: 'Parse 6 scenarios × time horizons, store as structured config', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'ngfsParams', tab: 'Scenario Selection' },
      { module: 'stress-test-orchestrator', field: 'ngfsScenarios', tab: 'Scenario Library' },
      { module: 'dme-scenarios', field: 'ngfsConfig', tab: 'NGFS Explorer' },
    ],
    lineage: 'NGFS Explorer → climate_assessment_methodologies.config → Frontend',
    unit: 'various (GDP%, $/tCO2, °C)', updateFrequency: 'Per NGFS phase', owner: 'Reference Data Team',
  },
  {
    id: 'DC069', name: 'Stranded Asset Risk Score',
    description: 'Probability and financial impact of asset stranding under net-zero pathways',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'stranded_assets', column: 'stranding_risk_score', type: 'NUMERIC(5,2)', migration: '002_add_stranded_asset_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Model-based', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'Reserve life + carbon budget + policy trajectory', output: 'stranding_probability', logic: 'Compare remaining carbon budget vs reserve/capacity', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'strandedRisk', tab: 'Stranded Assets' },
      { module: 'transition-finance', field: 'strandingRisk', tab: 'Asset Viability' },
    ],
    lineage: 'Reserve data + carbon budgets → stranded_assets → Frontend',
    unit: 'score (0-1)', updateFrequency: 'Annual', owner: 'Climate Risk Team',
  },
  {
    id: 'DC070', name: 'ECL Climate Overlay — PD Adjustment',
    description: 'Climate-adjusted probability of default overlay on IFRS 9 ECL',
    source: { type: 'Computed', provider: 'Internal ECL Engine', frequency: 'Quarterly', format: 'Calculated' },
    db: { schema: 'public', table: 'ecl_climate_overlays', column: 'pd_climate_adjusted', type: 'NUMERIC(8,6)', migration: '006_add_financial_risk_tables', foreignKeys: ['assessment_id → ecl_assessments.id'] },
    quality: { dqs: 3, verification: 'Model-based overlay', coverage: '80%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Base PD', input: 'ecl_exposures.pd_base', output: 'Base PD', logic: 'PD from internal rating model', intermediary: null },
      { stage: 2, name: 'Climate Overlay', input: 'Base PD + physical/transition scores', output: 'pd_climate_adjusted', logic: 'PD_adj = PD_base × (1 + climate_multiplier)', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'climateAdjPD', tab: 'PD Migration Matrix' },
      { module: 'regulatory-capital', field: 'eclClimateOverlay', tab: 'IFRS 9 Impact' },
    ],
    lineage: 'ecl_exposures.pd_base + climate scores → ecl_climate_overlays → Frontend',
    unit: 'probability (0-1)', updateFrequency: 'Quarterly', owner: 'Credit Risk Team',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCIAL DOMAIN (DC071–DC095)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC071', name: 'Market Capitalisation',
    description: 'Current market capitalisation of listed companies',
    source: { type: 'API', provider: 'Bloomberg / Refinitiv', frequency: 'Daily', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'market_cap_eur', type: 'NUMERIC(18,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Exchange data', coverage: '100% listed', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Market data feed', output: 'company_profiles.market_cap_eur', logic: 'shares_outstanding × current_price × fx_rate', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'marketCap', tab: 'EVIC Components' },
      { module: 'dme-entity', field: 'mktCap', tab: 'Entity Profile' },
    ],
    lineage: 'Exchange → company_profiles.market_cap_eur → Frontend',
    unit: 'EUR', updateFrequency: 'Daily', owner: 'Market Data Team',
  },
  {
    id: 'DC072', name: 'Annual Revenue',
    description: 'Company annual revenue for WACI denominator and carbon intensity',
    source: { type: 'API', provider: 'Bloomberg / Company Filing', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'assets_pg', column: 'annual_revenue_eur', type: 'NUMERIC(18,2)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Audited financials', coverage: '95%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Financial statements', output: 'assets_pg.annual_revenue_eur', logic: 'Convert to EUR at FY-end FX rate', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'revenue', tab: 'WACI Calculation' },
      { module: 'dme-entity', field: 'annualRevenue', tab: 'Financial Overview' },
    ],
    lineage: 'Company filings → assets_pg.annual_revenue_eur → Frontend',
    unit: 'EUR', updateFrequency: 'Annual', owner: 'Market Data Team',
  },
  {
    id: 'DC073', name: 'Outstanding Amount',
    description: 'Current outstanding exposure to each holding (for PCAF AF numerator)',
    source: { type: 'Internal', provider: 'Portfolio Management System', frequency: 'Daily', format: 'Database' },
    db: { schema: 'public', table: 'assets_pg', column: 'outstanding_amount', type: 'NUMERIC(18,2)', migration: '019_extend_assets_pcaf', foreignKeys: ['portfolio_id → portfolios_pg.id'] },
    quality: { dqs: 1, verification: 'System of record', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Extraction', input: 'Portfolio management system', output: 'assets_pg.outstanding_amount', logic: 'Pull current balance/market value per holding', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'outstanding', tab: 'Attribution Detail' },
    ],
    lineage: 'Portfolio system → assets_pg.outstanding_amount → PCAF AF calc → Frontend',
    unit: 'EUR', updateFrequency: 'Daily', owner: 'Portfolio Operations',
  },
  {
    id: 'DC074', name: 'Credit Rating',
    description: 'External credit rating from S&P/Moody\'s/Fitch (mapped to PD)',
    source: { type: 'API', provider: 'S&P / Moodys / Fitch', frequency: 'On-change', format: 'API' },
    db: { schema: 'public', table: 'ecl_exposures', column: 'credit_rating', type: 'VARCHAR(10)', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Rating agency', coverage: '70%', freshness: 'On-change' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Rating agency feed', output: 'ecl_exposures.credit_rating', logic: 'Map to master scale (AAA → D), store agency + outlook', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'creditRating', tab: 'Credit Quality' },
      { module: 'regulatory-capital', field: 'extRating', tab: 'SA-CR Weights' },
    ],
    lineage: 'Rating agencies → ecl_exposures.credit_rating → Frontend',
    unit: 'letter rating', updateFrequency: 'On-change', owner: 'Credit Risk Team',
  },
  {
    id: 'DC075', name: 'Probability of Default (PD)',
    description: 'Through-the-cycle and point-in-time PD for IFRS 9 staging',
    source: { type: 'Computed', provider: 'Internal Credit Model', frequency: 'Quarterly', format: 'Calculated' },
    db: { schema: 'public', table: 'ecl_exposures', column: 'pd_base', type: 'NUMERIC(8,6)', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Internal model validated', coverage: '95%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Financial ratios + qualitative factors', output: 'pd_base', logic: 'Logistic regression PD model with macro overlay', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'basePD', tab: 'PD Distribution' },
      { module: 'dme-risk-engine', field: 'pdInput', tab: 'Risk Engine' },
    ],
    lineage: 'Financials → PD model → ecl_exposures.pd_base → Frontend',
    unit: 'probability (0-1)', updateFrequency: 'Quarterly', owner: 'Credit Risk Team',
  },
  {
    id: 'DC076', name: 'Loss Given Default (LGD)',
    description: 'Expected loss severity at default — supervisory or internal estimate',
    source: { type: 'Computed', provider: 'Internal Credit Model', frequency: 'Quarterly', format: 'Calculated' },
    db: { schema: 'public', table: 'ecl_exposures', column: 'lgd', type: 'NUMERIC(6,4)', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Supervisory / internal', coverage: '95%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Estimation', input: 'Collateral + seniority + workout data', output: 'lgd', logic: 'LGD = 1 - recovery_rate (downturn adjusted)', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'lgd', tab: 'Loss Parameters' },
      { module: 'regulatory-capital', field: 'lgdInput', tab: 'IRB Parameters' },
    ],
    lineage: 'Collateral data → LGD model → ecl_exposures.lgd → Frontend',
    unit: '% (0-100)', updateFrequency: 'Quarterly', owner: 'Credit Risk Team',
  },
  {
    id: 'DC077', name: 'Exposure at Default (EAD)',
    description: 'Expected exposure at the time of default including undrawn commitments',
    source: { type: 'Computed', provider: 'Internal Model', frequency: 'Quarterly', format: 'Calculated' },
    db: { schema: 'public', table: 'ecl_exposures', column: 'ead', type: 'NUMERIC(18,2)', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Internal model', coverage: '95%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'Drawn + CCF × undrawn', output: 'ead', logic: 'EAD = drawn_amount + CCF × (limit - drawn)', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'ead', tab: 'Exposure Summary' },
      { module: 'regulatory-capital', field: 'eadInput', tab: 'RWA Calculation' },
    ],
    lineage: 'Loan system → EAD calc → ecl_exposures.ead → Frontend',
    unit: 'EUR', updateFrequency: 'Quarterly', owner: 'Credit Risk Team',
  },
  {
    id: 'DC078', name: 'Expected Credit Loss (ECL)',
    description: 'IFRS 9 expected credit loss — probability-weighted across scenarios',
    source: { type: 'Computed', provider: 'Internal ECL Engine', frequency: 'Quarterly', format: 'Calculated' },
    db: { schema: 'public', table: 'ecl_assessments', column: 'total_ecl_gbp', type: 'NUMERIC(18,2)', migration: '006_add_financial_risk_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'IFRS 9 compliant model', coverage: '100%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Per-Exposure', input: 'PD × LGD × EAD per stage', output: 'exposure-level ECL', logic: 'Stage 1: 12m PD; Stage 2/3: lifetime PD', intermediary: 'ecl_exposures' },
      { stage: 2, name: 'Scenario Weighting', input: '4 scenario ECLs + probabilities', output: 'Weighted ECL', logic: 'ECL = Σ(scenario_prob × scenario_ECL)', intermediary: 'ecl_scenario_results' },
      { stage: 3, name: 'Portfolio Aggregation', input: 'All exposure ECLs', output: 'total_ecl_gbp', logic: 'SUM across portfolio', intermediary: null },
    ],
    consumers: [
      { module: 'climate-stress-test', field: 'eclTotal', tab: 'ECL Summary' },
      { module: 'climate-financial-statements', field: 'eclProvision', tab: 'P&L Impact' },
    ],
    lineage: 'PD×LGD×EAD → scenario weighting → ecl_assessments.total_ecl_gbp → Frontend',
    unit: 'GBP', updateFrequency: 'Quarterly', owner: 'Credit Risk Team',
  },
  {
    id: 'DC079', name: 'Green Bond Flag',
    description: 'Whether a bond is classified as green/sustainable per ICMA GBP or EU GBS',
    source: { type: 'API', provider: 'CBI / Bloomberg', frequency: 'On-issuance', format: 'API' },
    db: { schema: 'public', table: 'assets_pg', column: 'green_bond_flag', type: 'BOOLEAN', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'CBI certification / SPO', coverage: '100%', freshness: 'On-issuance' },
    pipeline: [
      { stage: 1, name: 'Classification', input: 'CBI database + Bloomberg BCLASS', output: 'green_bond_flag', logic: 'TRUE if CBI-certified or Bloomberg green bond tag', intermediary: null },
    ],
    consumers: [
      { module: 'green-securitisation', field: 'greenBond', tab: 'Green Bond Screening' },
      { module: 'sdg-bond-impact', field: 'greenFlag', tab: 'Bond Classification' },
    ],
    lineage: 'CBI/Bloomberg → assets_pg.green_bond_flag → Frontend',
    unit: 'boolean', updateFrequency: 'On-issuance', owner: 'Fixed Income Team',
  },
  {
    id: 'DC080', name: 'SLB Covenant KPIs',
    description: 'Sustainability-Linked Bond KPI targets and current performance',
    source: { type: 'Manual', provider: 'Bond Documentation', frequency: 'Annual', format: 'Structured' },
    db: { schema: 'public', table: 'assets_pg', column: 'slb_covenants', type: 'JSONB', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Bond prospectus', coverage: '100% of SLBs', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Extraction', input: 'Bond framework + annual SPT report', output: 'slb_covenants JSONB', logic: 'Store: kpi_name, baseline, target, current, coupon_step', intermediary: null },
    ],
    consumers: [
      { module: 'sll-slb-v2', field: 'slbKPIs', tab: 'Covenant Tracking' },
    ],
    lineage: 'Bond docs → assets_pg.slb_covenants → Frontend',
    unit: 'various (per KPI)', updateFrequency: 'Annual', owner: 'Fixed Income Team',
  },
  {
    id: 'DC081', name: 'Basel III CET1 Ratio',
    description: 'Common Equity Tier 1 capital ratio for banks/FIs',
    source: { type: 'API', provider: 'Company Disclosure / Pillar 3', frequency: 'Quarterly', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'cet1_ratio_pct', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Regulatory filing', coverage: '100% of banks', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Pillar 3 disclosure', output: 'company_profiles.cet1_ratio_pct', logic: 'CET1 / RWA × 100', intermediary: null },
    ],
    consumers: [
      { module: 'regulatory-capital', field: 'cet1Ratio', tab: 'Capital Adequacy' },
      { module: 'dme-entity', field: 'cet1', tab: 'Prudential Metrics' },
    ],
    lineage: 'Pillar 3 → company_profiles.cet1_ratio_pct → Frontend',
    unit: '%', updateFrequency: 'Quarterly', owner: 'Regulatory Team',
  },
  {
    id: 'DC082', name: 'Risk-Weighted Assets (RWA)',
    description: 'Total risk-weighted assets for banks (credit + market + operational)',
    source: { type: 'API', provider: 'Pillar 3 Disclosure', frequency: 'Quarterly', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'rwa_eur', type: 'NUMERIC(18,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Regulatory filing', coverage: '100% of banks', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Pillar 3 templates', output: 'company_profiles.rwa_eur', logic: 'Sum credit RWA + market RWA + operational RWA', intermediary: null },
    ],
    consumers: [
      { module: 'regulatory-capital', field: 'totalRWA', tab: 'RWA Breakdown' },
    ],
    lineage: 'Pillar 3 → company_profiles.rwa_eur → Frontend',
    unit: 'EUR', updateFrequency: 'Quarterly', owner: 'Regulatory Team',
  },
  {
    id: 'DC083', name: 'Portfolio Holding Weight',
    description: 'Current weight of each holding in the portfolio (%)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Daily', format: 'Calculated' },
    db: { schema: 'public', table: 'assets_pg', column: 'weight_pct', type: 'NUMERIC(8,4)', migration: '019_extend_assets_pcaf', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System computed', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'holding MV / portfolio AUM', output: 'weight_pct', logic: 'weight = market_value / SUM(market_values) × 100', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'holdingWeight', tab: 'Portfolio Builder' },
      { module: 'dme-portfolio', field: 'allocationPct', tab: 'Portfolio View' },
    ],
    lineage: 'assets_pg MV / portfolio AUM → weight_pct → Frontend',
    unit: '%', updateFrequency: 'Daily', owner: 'Portfolio Operations',
  },
  {
    id: 'DC084', name: 'Sector Allocation',
    description: 'Portfolio weight by GICS sector',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Daily', format: 'Calculated' },
    db: { schema: 'public', table: 'portfolio_analytics', column: 'sector_allocation', type: 'JSONB', migration: '005_add_portfolio_analytics_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System computed', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'Holding weights grouped by GICS sector', output: 'sector_allocation JSONB', logic: 'SUM(weight) GROUP BY gics_sector', intermediary: null },
    ],
    consumers: [
      { module: 'dme-portfolio', field: 'sectorAlloc', tab: 'Allocation Analysis' },
      { module: 'pcaf-financed-emissions', field: 'sectorBreakdown', tab: 'Sector View' },
    ],
    lineage: 'assets_pg → sector grouping → portfolio_analytics.sector_allocation → Frontend',
    unit: '% per sector', updateFrequency: 'Daily', owner: 'Portfolio Operations',
  },
  {
    id: 'DC085', name: 'Country Allocation',
    description: 'Portfolio weight by country of domicile',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Daily', format: 'Calculated' },
    db: { schema: 'public', table: 'portfolio_analytics', column: 'country_allocation', type: 'JSONB', migration: '005_add_portfolio_analytics_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System computed', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Aggregation', input: 'Holding weights grouped by country', output: 'country_allocation JSONB', logic: 'SUM(weight) GROUP BY headquarters_country', intermediary: null },
    ],
    consumers: [
      { module: 'dme-portfolio', field: 'countryAlloc', tab: 'Geography View' },
      { module: 'em-climate-risk', field: 'emExposure', tab: 'EM Allocation' },
    ],
    lineage: 'assets_pg → country grouping → portfolio_analytics.country_allocation → Frontend',
    unit: '% per country', updateFrequency: 'Daily', owner: 'Portfolio Operations',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGULATORY DOMAIN (DC086–DC110)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC086', name: 'SFDR PAI #1 — GHG Emissions',
    description: 'SFDR mandatory PAI indicator 1: Scope 1+2+3 financed GHG emissions',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'sfdr_pai_indicator_values', column: 'calculated_value', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: ['assessment_id → sfdr_pai_assessments.id'] },
    quality: { dqs: 3, verification: 'Computed from PCAF', coverage: '85%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Mapping', input: 'pcaf_portfolio_results scope totals', output: 'PAI_1 value', logic: 'Map financed scope1+2+3 to PAI 1 template', intermediary: null },
    ],
    consumers: [
      { module: 'sfdr-art9', field: 'pai1', tab: 'PAI Dashboard' },
      { module: 'sfdr-classification', field: 'paiGHG', tab: 'PAI Indicators' },
    ],
    lineage: 'pcaf_portfolio_results → sfdr_pai_indicator_values (PAI_1) → Frontend',
    unit: 'tCO2e', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC087', name: 'SFDR PAI #2 — Carbon Footprint',
    description: 'SFDR mandatory PAI indicator 2: Carbon footprint per EUR M invested',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'sfdr_pai_indicator_values', column: 'calculated_value', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Computed', coverage: '85%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'Total FE / current value of investments', output: 'PAI_2 value', logic: 'Σ(scope1+2 FE) / portfolio_aum × 1M', intermediary: null },
    ],
    consumers: [
      { module: 'sfdr-art9', field: 'pai2', tab: 'PAI Dashboard' },
      { module: 'sfdr-classification', field: 'paiFootprint', tab: 'PAI Indicators' },
    ],
    lineage: 'pcaf_portfolio_results → calculation → sfdr_pai_indicator_values (PAI_2) → Frontend',
    unit: 'tCO2e/EUR M invested', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC088', name: 'SFDR PAI #3 — GHG Intensity',
    description: 'SFDR mandatory PAI indicator 3: GHG intensity of investee companies',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'sfdr_pai_indicator_values', column: 'calculated_value', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Computed', coverage: '80%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'Per-company (scope1+2) / revenue, then weight', output: 'PAI_3 value', logic: 'Weighted avg: Σ(weight × company_scope12 / company_revenue)', intermediary: null },
    ],
    consumers: [
      { module: 'sfdr-art9', field: 'pai3', tab: 'PAI Dashboard' },
    ],
    lineage: 'Company emissions + revenue → WACI → sfdr_pai_indicator_values (PAI_3) → Frontend',
    unit: 'tCO2e/EUR M revenue', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC089', name: 'SFDR PAI #4 — Fossil Fuel Exposure',
    description: 'SFDR mandatory PAI indicator 4: Share of investments in fossil fuel companies',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'sfdr_pai_indicator_values', column: 'calculated_value', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Sector classification', coverage: '95%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Screening', input: 'GICS sector + revenue breakdown', output: 'fossil_fuel_flag per holding', logic: 'Flag if >5% revenue from fossil fuel extraction/generation', intermediary: null },
      { stage: 2, name: 'Aggregation', input: 'Flagged holdings weights', output: 'PAI_4 value', logic: 'SUM(weight) where fossil_fuel_flag = TRUE', intermediary: null },
    ],
    consumers: [
      { module: 'sfdr-art9', field: 'pai4', tab: 'PAI Dashboard' },
      { module: 'sfdr-classification', field: 'fossilExposure', tab: 'Exclusion Screening' },
    ],
    lineage: 'Sector data → screening → sfdr_pai_indicator_values (PAI_4) → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC090', name: 'SFDR Entity Classification',
    description: 'SFDR article classification: Article 6, 8, 8+, or 9',
    source: { type: 'Manual', provider: 'Product Team', frequency: 'On-change', format: 'Enum' },
    db: { schema: 'public', table: 'sfdr_entity_classifications', column: 'classification', type: 'VARCHAR(20)', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Legal classification', coverage: '100%', freshness: 'On-change' },
    pipeline: [
      { stage: 1, name: 'Classification', input: 'Product documentation', output: 'SFDR classification', logic: 'Assess: sustainability objective → Art 9; promotes ESG → Art 8; other → Art 6', intermediary: null },
    ],
    consumers: [
      { module: 'sfdr-classification', field: 'articleClass', tab: 'Classification Dashboard' },
      { module: 'reporting-hub', field: 'sfdrClass', tab: 'Product Overview' },
    ],
    lineage: 'Product docs → sfdr_entity_classifications → Frontend',
    unit: 'category', updateFrequency: 'On-change', owner: 'Product Legal Team',
  },
  {
    id: 'DC091', name: 'Double Materiality Assessment — Impact Score',
    description: 'CSRD double materiality impact severity score per ESRS topic',
    source: { type: 'Manual', provider: 'Materiality Team', frequency: 'Annual', format: 'Structured assessment' },
    db: { schema: 'public', table: 'dma_topic_scores', column: 'impact_severity', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: ['assessment_id → dma_assessments.id'] },
    quality: { dqs: 2, verification: 'Stakeholder-validated', coverage: '100% ESRS topics', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Stakeholder input + analysis', output: 'impact_severity per topic', logic: 'severity = MAX(scale × scope, irremediability) per EFRAG guidance', intermediary: null },
    ],
    consumers: [
      { module: 'double-materiality', field: 'impactScore', tab: 'Materiality Matrix' },
      { module: 'dme-dashboard', field: 'materialityInput', tab: 'DME Materiality' },
    ],
    lineage: 'Stakeholder engagement → dma_topic_scores.impact_severity → Frontend',
    unit: 'score (0-5)', updateFrequency: 'Annual', owner: 'Materiality Team',
  },
  {
    id: 'DC092', name: 'Double Materiality Assessment — Financial Score',
    description: 'CSRD double materiality financial risk/opportunity score per ESRS topic',
    source: { type: 'Manual', provider: 'Materiality Team', frequency: 'Annual', format: 'Structured assessment' },
    db: { schema: 'public', table: 'dma_topic_scores', column: 'financial_score', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Risk-assessed', coverage: '100% ESRS topics', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Financial analysis + scenario assessment', output: 'financial_score', logic: 'MAX(risk_likelihood × risk_magnitude, opportunity_magnitude)', intermediary: null },
    ],
    consumers: [
      { module: 'double-materiality', field: 'financialScore', tab: 'Materiality Matrix' },
    ],
    lineage: 'Financial analysis → dma_topic_scores.financial_score → Frontend',
    unit: 'score (0-5)', updateFrequency: 'Annual', owner: 'Materiality Team',
  },
  {
    id: 'DC093', name: 'CSRD Readiness Score',
    description: 'CSRD/ESRS gap analysis readiness score (0-100)',
    source: { type: 'Manual', provider: 'Regulatory Team', frequency: 'Quarterly', format: 'Assessment' },
    db: { schema: 'public', table: 'csrd_readiness_assessments', column: 'overall_readiness', type: 'NUMERIC(5,2)', migration: '009_add_regulatory_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Analyst assessment', coverage: '100%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'ESRS topic-by-topic gap analysis', output: 'overall_readiness', logic: 'Average of topic-level readiness weighted by materiality', intermediary: 'csrd_topic_assessments' },
    ],
    consumers: [
      { module: 'comprehensive-reporting', field: 'csrdReadiness', tab: 'Readiness Dashboard' },
      { module: 'regulatory-horizon', field: 'csrdScore', tab: 'Regulatory Pipeline' },
    ],
    lineage: 'Gap analysis → csrd_topic_assessments → csrd_readiness_assessments → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Quarterly', owner: 'Regulatory Team',
  },
  {
    id: 'DC094', name: 'ISSB S2 Maturity Score',
    description: 'IFRS S2 climate disclosure maturity assessment',
    source: { type: 'Manual', provider: 'Regulatory Team', frequency: 'Annual', format: 'Assessment' },
    db: { schema: 'public', table: 'issb_assessments', column: 'overall_maturity', type: 'NUMERIC(3,1)', migration: '009_add_regulatory_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Analyst assessment', coverage: '80%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'IFRS S2 requirement mapping', output: 'maturity per requirement', logic: 'Score 0-5 across Governance, Strategy, Risk Mgmt, Metrics', intermediary: null },
    ],
    consumers: [
      { module: 'issb-tcfd', field: 'issbMaturity', tab: 'ISSB Scorecard' },
      { module: 'comprehensive-reporting', field: 'issbScore', tab: 'Framework Coverage' },
    ],
    lineage: 'IFRS S2 mapping → issb_assessments → Frontend',
    unit: 'score (0-5)', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC095', name: 'BRSR Disclosure Score',
    description: 'SEBI BRSR (India) disclosure completeness score',
    source: { type: 'Manual', provider: 'Regulatory Team', frequency: 'Annual', format: 'Assessment' },
    db: { schema: 'public', table: 'brsr_disclosures', column: 'overall_score', type: 'NUMERIC(5,2)', migration: '009_add_regulatory_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Analyst assessment', coverage: '100% of Indian listed', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'BRSR template + annual report', output: 'brsr_disclosures', logic: 'Score completeness across 9 NVG-SEG principles', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-india-brsr', field: 'brsrScore', tab: 'BRSR Assessment' },
    ],
    lineage: 'Annual report → brsr_disclosures → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Annual', owner: 'Regulatory Team',
  },
  {
    id: 'DC096', name: 'EU ETS Carbon Price',
    description: 'EU Emissions Trading System carbon permit price (EUR/tCO2)',
    source: { type: 'API', provider: 'ICE / EEX', frequency: 'Daily', format: 'API' },
    db: { schema: 'public', table: 'carbon_prices', column: 'price_eur', type: 'NUMERIC(10,2)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Exchange traded', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ICE ECX front-month EUA', output: 'carbon_prices (scheme=EU_ETS)', logic: 'Store daily close, volume, open interest', intermediary: null },
    ],
    consumers: [
      { module: 'vcm-integrity', field: 'euEtsPrice', tab: 'Carbon Markets' },
      { module: 'climate-stress-test', field: 'carbonPrice', tab: 'Carbon Price Scenarios' },
      { module: 'internal-carbon-price', field: 'euEts', tab: 'Benchmark Prices' },
    ],
    lineage: 'ICE/EEX → carbon_prices → Frontend',
    unit: 'EUR/tCO2', updateFrequency: 'Daily', owner: 'Market Data Team',
  },
  {
    id: 'DC097', name: 'UK ETS Carbon Price',
    description: 'UK Emissions Trading Scheme carbon permit price (GBP/tCO2)',
    source: { type: 'API', provider: 'ICE', frequency: 'Daily', format: 'API' },
    db: { schema: 'public', table: 'carbon_prices', column: 'price_eur', type: 'NUMERIC(10,2)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Exchange traded', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ICE UKA front-month', output: 'carbon_prices (scheme=UK_ETS)', logic: 'Store daily close, convert to EUR', intermediary: null },
    ],
    consumers: [
      { module: 'vcm-integrity', field: 'ukEtsPrice', tab: 'Carbon Markets' },
      { module: 'internal-carbon-price', field: 'ukEts', tab: 'Benchmark Prices' },
    ],
    lineage: 'ICE → carbon_prices → Frontend',
    unit: 'GBP/tCO2', updateFrequency: 'Daily', owner: 'Market Data Team',
  },
  {
    id: 'DC098', name: 'California Cap-and-Trade Price',
    description: 'California CCA carbon allowance price (USD/tCO2)',
    source: { type: 'API', provider: 'ICE', frequency: 'Daily', format: 'API' },
    db: { schema: 'public', table: 'carbon_prices', column: 'price_eur', type: 'NUMERIC(10,2)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Exchange traded', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ICE CCA contract', output: 'carbon_prices (scheme=CALIFORNIA)', logic: 'Store daily close', intermediary: null },
    ],
    consumers: [
      { module: 'vcm-integrity', field: 'ccaPrice', tab: 'Carbon Markets' },
    ],
    lineage: 'ICE → carbon_prices → Frontend',
    unit: 'USD/tCO2', updateFrequency: 'Daily', owner: 'Market Data Team',
  },
  {
    id: 'DC099', name: 'RGGI Carbon Price',
    description: 'Regional Greenhouse Gas Initiative allowance price (USD/short ton)',
    source: { type: 'API', provider: 'RGGI Auctions', frequency: 'Quarterly', format: 'CSV' },
    db: { schema: 'public', table: 'carbon_prices', column: 'price_eur', type: 'NUMERIC(10,2)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Auction results', coverage: '100%', freshness: 'Quarterly' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'RGGI auction clearing price', output: 'carbon_prices (scheme=RGGI)', logic: 'Convert $/short ton to $/tCO2e', intermediary: null },
    ],
    consumers: [
      { module: 'vcm-integrity', field: 'rggiPrice', tab: 'Carbon Markets' },
    ],
    lineage: 'RGGI → carbon_prices → Frontend',
    unit: 'USD/tCO2', updateFrequency: 'Quarterly', owner: 'Market Data Team',
  },
  {
    id: 'DC100', name: 'GRI Standards Mapping',
    description: 'GRI Standards disclosure mapping (85 disclosures across 26 topic standards)',
    source: { type: 'Static', provider: 'GRI Standards Board', frequency: 'Per revision', format: 'Structured' },
    db: { schema: 'public', table: 'gri_standards', column: 'standard_data', type: 'JSONB', migration: '035_add_gri_standards_and_mapping', foreignKeys: [] },
    quality: { dqs: 1, verification: 'GRI official', coverage: '100%', freshness: 'GRI 2021 update' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'GRI Standards reference', output: 'gri_standards', logic: 'Parse all topic standards, requirements, and cross-references', intermediary: null },
    ],
    consumers: [
      { module: 'gri-alignment', field: 'griStandards', tab: 'Standards Library' },
      { module: 'framework-interop', field: 'griMapping', tab: 'Cross-Framework Map' },
    ],
    lineage: 'GRI Standards → gri_standards → Frontend',
    unit: 'reference data', updateFrequency: 'Per GRI revision', owner: 'Reference Data Team',
  },
  {
    id: 'DC101', name: 'ESRS Datapoint Catalogue',
    description: 'CSRD ESRS datapoint catalogue (1,100+ datapoints across E1-G1)',
    source: { type: 'Static', provider: 'EFRAG', frequency: 'Per ESRS update', format: 'Structured' },
    db: { schema: 'public', table: 'esrs_catalog_items', column: 'item_data', type: 'JSONB', migration: '034_enhance_esrs_catalog_ar_dr', foreignKeys: [] },
    quality: { dqs: 1, verification: 'EFRAG official', coverage: '100%', freshness: 'ESRS Set 1 (2023)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'EFRAG XBRL taxonomy + IG docs', output: 'esrs_catalog_items', logic: 'Parse disclosure requirements, application requirements, data types', intermediary: null },
    ],
    consumers: [
      { module: 'comprehensive-reporting', field: 'esrsCatalog', tab: 'ESRS Datapoints' },
      { module: 'double-materiality', field: 'esrsTopics', tab: 'Topic Selection' },
    ],
    lineage: 'EFRAG → esrs_catalog_items → Frontend',
    unit: 'reference data', updateFrequency: 'Per ESRS revision', owner: 'Reference Data Team',
  },
  {
    id: 'DC102', name: 'PCAF DQS Weight Lookup',
    description: 'PCAF DQS dimension weights by asset class (methodology reference)',
    source: { type: 'Static', provider: 'PCAF Secretariat', frequency: 'Per PCAF version', format: 'Reference table' },
    db: { schema: 'public', table: 'emission_factors', column: 'factor_value', type: 'NUMERIC(12,6)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'PCAF Standard v2', coverage: '100%', freshness: 'v2 (2022)' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'PCAF Standard Annex', output: 'emission_factors (type=pcaf_weight)', logic: 'Store weight per DQS level per asset class', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'dqsWeights', tab: 'Methodology Reference' },
    ],
    lineage: 'PCAF Standard → emission_factors → DQS engine → Frontend',
    unit: 'weight (0-1)', updateFrequency: 'Per PCAF version', owner: 'Reference Data Team',
  },
  {
    id: 'DC103', name: 'IMO Decarbonisation Pathway',
    description: 'IMO GHG Strategy pathway targets for maritime sector (CII/EEXI thresholds)',
    source: { type: 'Static', provider: 'IMO MEPC', frequency: 'Per regulation update', format: 'Reference table' },
    db: { schema: 'public', table: 'emission_factors', column: 'factor_value', type: 'NUMERIC(12,6)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'IMO official', coverage: '100%', freshness: 'IMO 2023 Strategy' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'IMO MEPC resolutions', output: 'emission_factors (type=imo_pathway)', logic: 'Store annual CII boundary values and EEXI thresholds by ship type', intermediary: null },
    ],
    consumers: [
      { module: 'climate-derivatives', field: 'imoTargets', tab: 'Maritime Compliance' },
    ],
    lineage: 'IMO MEPC → emission_factors → Frontend',
    unit: 'gCO2/tonne-mile', updateFrequency: 'Per IMO update', owner: 'Reference Data Team',
  },
  {
    id: 'DC104', name: 'CORSIA Baseline Emissions',
    description: 'ICAO CORSIA baseline emissions for aviation sector offsetting requirements',
    source: { type: 'Static', provider: 'ICAO', frequency: 'Per CORSIA phase', format: 'Reference table' },
    db: { schema: 'public', table: 'emission_factors', column: 'factor_value', type: 'NUMERIC(12,6)', migration: '018_time_series_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'ICAO official', coverage: '100%', freshness: 'CORSIA Phase 1' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ICAO CORSIA documentation', output: 'emission_factors (type=corsia_baseline)', logic: 'Store baseline year emissions, growth factors, SAF credits', intermediary: null },
    ],
    consumers: [
      { module: 'vcm-integrity', field: 'corsiaBaseline', tab: 'Aviation Offsets' },
    ],
    lineage: 'ICAO → emission_factors → Frontend',
    unit: 'tCO2/RPK', updateFrequency: 'Per CORSIA phase', owner: 'Reference Data Team',
  },
  {
    id: 'DC105', name: 'CBAM Product Benchmarks',
    description: 'EU CBAM product-level carbon intensity benchmarks for border adjustment',
    source: { type: 'Static', provider: 'EU Commission', frequency: 'Annual', format: 'Reference table' },
    db: { schema: 'public', table: 'ets_product_benchmarks', column: 'benchmark_value', type: 'NUMERIC(12,6)', migration: '056_add_ets_product_benchmarks', foreignKeys: [] },
    quality: { dqs: 1, verification: 'EU regulation', coverage: '100% CBAM products', freshness: '2024 benchmarks' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'EU CBAM Implementing Regulation', output: 'ets_product_benchmarks', logic: 'Store product-level tCO2e/tonne benchmarks for cement, steel, aluminium, fertiliser, electricity, hydrogen', intermediary: null },
    ],
    consumers: [
      { module: 'export-credit-esg', field: 'cbamBenchmark', tab: 'CBAM Calculator' },
      { module: 'climate-policy', field: 'cbamRates', tab: 'Trade Policy Impact' },
    ],
    lineage: 'EU regulation → ets_product_benchmarks → Frontend',
    unit: 'tCO2e/tonne product', updateFrequency: 'Annual', owner: 'Reference Data Team',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NATURE / SOCIAL / BIODIVERSITY DOMAIN (DC106–DC130)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC106', name: 'Biodiversity Footprint (MSA)',
    description: 'Mean Species Abundance impact — biodiversity footprint metric',
    source: { type: 'Computed', provider: 'GLOBIO / Internal Model', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'nature_risk_assessment', column: 'assess_results', type: 'JSONB', migration: '003_add_nature_risk_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'GLOBIO model', coverage: '50%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Spatial Overlap', input: 'Asset locations + WDPA/KBA layers', output: 'Proximity to protected/key biodiversity areas', logic: 'Buffer analysis around asset coordinates', intermediary: 'spatial_asset_mapping' },
      { stage: 2, name: 'Impact Scoring', input: 'Land use + sector + proximity', output: 'MSA impact', logic: 'GLOBIO: MSA loss = f(land_use_type, intensity, proximity_to_KBA)', intermediary: null },
    ],
    consumers: [
      { module: 'corporate-nature-strategy', field: 'msaFootprint', tab: 'Biodiversity Impact' },
      { module: 'biodiversity-credits', field: 'msaBaseline', tab: 'BNG Calculation' },
    ],
    lineage: 'GLOBIO + spatial data → nature_risk_assessment → Frontend',
    unit: 'MSA.km²', updateFrequency: 'Annual', owner: 'Nature Analytics Team',
  },
  {
    id: 'DC107', name: 'Water Stress Score (Aqueduct)',
    description: 'WRI Aqueduct overall water risk score per asset location',
    source: { type: 'API', provider: 'WRI Aqueduct 4.0', frequency: 'Annual', format: 'API/GeoJSON' },
    db: { schema: 'public', table: 'nature_risk_assessment', column: 'evaluate_results', type: 'JSONB', migration: '003_add_nature_risk_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'WRI model validated', coverage: '85%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Query', input: 'Asset lat/lng', output: 'Aqueduct risk scores', logic: 'API query per location → baseline water stress, future projections', intermediary: null },
    ],
    consumers: [
      { module: 'water-risk', field: 'aqueductScore', tab: 'Water Risk Map' },
      { module: 'physical-risk-pricing', field: 'waterRisk', tab: 'Multi-Hazard View' },
    ],
    lineage: 'WRI Aqueduct → nature_risk_assessment.evaluate_results → Frontend',
    unit: 'score (0-5)', updateFrequency: 'Annual', owner: 'Nature Analytics Team',
  },
  {
    id: 'DC108', name: 'Deforestation Risk Score',
    description: 'Supply chain deforestation risk via Global Forest Watch alerts',
    source: { type: 'API', provider: 'Global Forest Watch / EUDR', frequency: 'Monthly', format: 'API' },
    db: { schema: 'public', table: 'gfw_deforestation_alerts', column: 'risk_score', type: 'NUMERIC(5,2)', migration: '030_add_wdpa_gfw_gem_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Satellite-verified', coverage: '70%', freshness: 'Monthly' },
    pipeline: [
      { stage: 1, name: 'Alert Monitoring', input: 'GFW GLAD/RADD alerts', output: 'gfw_deforestation_alerts', logic: 'Match sourcing regions to deforestation alerts within buffer', intermediary: null },
    ],
    consumers: [
      { module: 'corporate-nature-strategy', field: 'deforestRisk', tab: 'Deforestation Monitor' },
      { module: 'esg-value-chain', field: 'deforestAlert', tab: 'Supply Chain Risk' },
    ],
    lineage: 'GFW satellites → gfw_deforestation_alerts → Frontend',
    unit: 'score (0-1)', updateFrequency: 'Monthly', owner: 'Nature Analytics Team',
  },
  {
    id: 'DC109', name: 'Ecosystem Dependency Score',
    description: 'TNFD LEAP dependency score on ecosystem services per asset',
    source: { type: 'Computed', provider: 'Internal TNFD Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'ecosystem_dependency', column: 'dependency_score', type: 'NUMERIC(3,2)', migration: '003_add_nature_risk_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'ENCORE/TNFD framework', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'ENCORE Mapping', input: 'Sector + location + ecosystem type', output: 'dependency_score (0-1)', logic: 'Map sector to ENCORE dependency ratings, overlay with local ecosystem status', intermediary: null },
    ],
    consumers: [
      { module: 'corporate-nature-strategy', field: 'dependencyScore', tab: 'LEAP Evaluate' },
      { module: 'nature-capital-accounting', field: 'ecosystemDep', tab: 'Natural Capital' },
    ],
    lineage: 'ENCORE + spatial → ecosystem_dependency → Frontend',
    unit: 'score (0-1)', updateFrequency: 'Annual', owner: 'Nature Analytics Team',
  },
  {
    id: 'DC110', name: 'TNFD LEAP Alignment Score',
    description: 'TNFD LEAP framework alignment score (0-100)',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'nature_risk_assessment', column: 'tnfd_alignment_score', type: 'NUMERIC(5,2)', migration: '003_add_nature_risk_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Framework assessment', coverage: '60%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'LEAP phase scores (Locate, Evaluate, Assess, Prepare)', output: 'tnfd_alignment_score', logic: 'Weighted average across 4 LEAP phases', intermediary: null },
    ],
    consumers: [
      { module: 'corporate-nature-strategy', field: 'tnfdScore', tab: 'TNFD Scorecard' },
    ],
    lineage: 'LEAP phases → nature_risk_assessment.tnfd_alignment_score → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Annual', owner: 'Nature Analytics Team',
  },
  {
    id: 'DC111', name: 'Board Gender Diversity %',
    description: 'Percentage of female board members',
    source: { type: 'API', provider: 'Bloomberg / Company Filing', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'board_female_pct', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Company disclosure', coverage: '90%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Proxy statement / annual report', output: 'company_profiles.board_female_pct', logic: 'female_directors / total_directors × 100', intermediary: null },
    ],
    consumers: [
      { module: 'social-taxonomy', field: 'boardDiversity', tab: 'Social Metrics' },
      { module: 'esg-data-quality', field: 'genderDiv', tab: 'Governance Indicators' },
    ],
    lineage: 'Company filings → company_profiles.board_female_pct → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'ESG Data Team',
  },
  {
    id: 'DC112', name: 'Living Wage Gap',
    description: 'Gap between company minimum wage and living wage benchmark',
    source: { type: 'Computed', provider: 'Internal Model / WageIndicator', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 'living_wage_gap_pct', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 4, verification: 'Estimated', coverage: '30%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Estimation', input: 'Disclosed wages + country living wage', output: 'living_wage_gap_pct', logic: '(living_wage - min_paid_wage) / living_wage × 100', intermediary: null },
    ],
    consumers: [
      { module: 'social-taxonomy', field: 'livingWageGap', tab: 'Labour Standards' },
      { module: 'forced-labour', field: 'wageIndicator', tab: 'Labour Risk' },
    ],
    lineage: 'Disclosure + benchmarks → company_profiles → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Social Analytics Team',
  },
  {
    id: 'DC113', name: 'Human Rights Risk Score',
    description: 'Supply chain human rights risk score based on country + sector + incidents',
    source: { type: 'Computed', provider: 'Internal Model', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'company_profiles', column: 'human_rights_risk_score', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Model-based', coverage: '50%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Scoring', input: 'Sourcing countries + sector risk + incidents', output: 'human_rights_risk_score', logic: 'Combine: country_freedom_index × sector_risk × incident_factor', intermediary: null },
    ],
    consumers: [
      { module: 'forced-labour', field: 'hrRiskScore', tab: 'Human Rights Assessment' },
      { module: 'social-taxonomy', field: 'hrRisk', tab: 'Social Risk Map' },
    ],
    lineage: 'Country + sector data + incidents → model → company_profiles → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Annual', owner: 'Social Analytics Team',
  },
  {
    id: 'DC114', name: 'Protected Area Proximity',
    description: 'Distance from asset to nearest WDPA protected area / Key Biodiversity Area',
    source: { type: 'API', provider: 'WDPA / IBAT', frequency: 'Annual', format: 'GeoJSON' },
    db: { schema: 'public', table: 'wdpa_protected_areas', column: 'distance_km', type: 'NUMERIC(10,2)', migration: '030_add_wdpa_gfw_gem_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'UNEP-WCMC', coverage: '100% of WDPA', freshness: 'Monthly updates' },
    pipeline: [
      { stage: 1, name: 'Spatial Query', input: 'Asset lat/lng + WDPA polygons', output: 'distance_km to nearest PA', logic: 'ST_Distance or Haversine from asset to nearest WDPA boundary', intermediary: null },
    ],
    consumers: [
      { module: 'corporate-nature-strategy', field: 'protectedProximity', tab: 'Spatial Analysis' },
      { module: 'nbs-finance', field: 'wdpaOverlap', tab: 'NbS Site Selection' },
    ],
    lineage: 'WDPA + asset coords → proximity calc → Frontend',
    unit: 'km', updateFrequency: 'Annual', owner: 'Nature Analytics Team',
  },
  {
    id: 'DC115', name: 'SFDR PAI #7 — Biodiversity Sensitive Areas',
    description: 'SFDR mandatory PAI: share of investments in companies with operations near biodiversity-sensitive areas',
    source: { type: 'Computed', provider: 'Internal Engine', frequency: 'Annual', format: 'Calculated' },
    db: { schema: 'public', table: 'sfdr_pai_indicator_values', column: 'calculated_value', type: 'FLOAT', migration: '052_add_double_materiality_sfdr_pai_tables', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Spatial model', coverage: '70%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Screening', input: 'Protected area proximity + portfolio weights', output: 'PAI_7 value', logic: 'SUM(weight) where distance_to_KBA < 10km', intermediary: null },
    ],
    consumers: [
      { module: 'sfdr-art9', field: 'pai7', tab: 'PAI Dashboard' },
    ],
    lineage: 'WDPA proximity → screening → sfdr_pai_indicator_values → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Nature Analytics Team',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORT DOMAIN (DC116–DC130)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC116', name: 'Fleet CII Rating',
    description: 'IMO Carbon Intensity Indicator rating (A-E) per vessel',
    source: { type: 'API', provider: 'IMO DCS / ClassNK', frequency: 'Annual', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'fleet_cii_avg', type: 'VARCHAR(1)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 2, verification: 'IMO DCS verified', coverage: '80%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Calculation', input: 'Fuel consumption + distance + DWT', output: 'CII = CO2 / (capacity × distance)', logic: 'Per IMO MEPC.337(76) formula, compare to ref line + reduction factor', intermediary: null },
    ],
    consumers: [
      { module: 'climate-derivatives', field: 'ciiRating', tab: 'Maritime CII' },
    ],
    lineage: 'IMO DCS → CII calculation → company_profiles → Frontend',
    unit: 'letter (A-E)', updateFrequency: 'Annual', owner: 'Transport Analytics Team',
  },
  {
    id: 'DC117', name: 'EEXI Compliance Score',
    description: 'Energy Efficiency Existing Ship Index compliance status',
    source: { type: 'API', provider: 'ClassNK / Lloyd\'s Register', frequency: 'On survey', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'eexi_compliant', type: 'BOOLEAN', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Classification society', coverage: '85%', freshness: 'On survey' },
    pipeline: [
      { stage: 1, name: 'Assessment', input: 'Vessel technical data', output: 'EEXI attained vs required', logic: 'EEXI_attained ≤ EEXI_required → compliant', intermediary: null },
    ],
    consumers: [
      { module: 'climate-derivatives', field: 'eexiCompliant', tab: 'Maritime Compliance' },
    ],
    lineage: 'Classification society → company_profiles.eexi_compliant → Frontend',
    unit: 'boolean', updateFrequency: 'On survey', owner: 'Transport Analytics Team',
  },
  {
    id: 'DC118', name: 'SAF Blend Percentage',
    description: 'Sustainable Aviation Fuel blend percentage in airline operations',
    source: { type: 'API', provider: 'Airline Disclosure / IATA', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'company_profiles', column: 'saf_blend_pct', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Self-reported', coverage: '50%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Airline sustainability report', output: 'saf_blend_pct', logic: 'SAF volume / total fuel volume × 100', intermediary: null },
    ],
    consumers: [
      { module: 'vcm-integrity', field: 'safBlend', tab: 'Aviation Decarbonisation' },
    ],
    lineage: 'Airline disclosure → company_profiles.saf_blend_pct → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Transport Analytics Team',
  },
  {
    id: 'DC119', name: 'EV Fleet Penetration %',
    description: 'Electric vehicle penetration in company fleet',
    source: { type: 'API', provider: 'Company Disclosure', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'company_profiles', column: 'ev_fleet_pct', type: 'NUMERIC(5,2)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 3, verification: 'Self-reported', coverage: '40%', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'Fleet composition data', output: 'ev_fleet_pct', logic: 'BEV + PHEV vehicles / total fleet × 100', intermediary: null },
    ],
    consumers: [
      { module: 'transition-finance', field: 'evPenetration', tab: 'Fleet Transition' },
    ],
    lineage: 'Company data → company_profiles.ev_fleet_pct → Frontend',
    unit: '%', updateFrequency: 'Annual', owner: 'Transport Analytics Team',
  },
  {
    id: 'DC120', name: 'Spatial Asset Location',
    description: 'Lat/lng coordinates for physical assets (real estate, infrastructure, vessels)',
    source: { type: 'Manual', provider: 'Asset Registry', frequency: 'On-change', format: 'Coordinates' },
    db: { schema: 'public', table: 'spatial_asset_mapping', column: 'latitude, longitude', type: 'NUMERIC(9,6), NUMERIC(10,6)', migration: '003_add_nature_risk_tables', foreignKeys: ['asset_id → assets_pg.id'] },
    quality: { dqs: 1, verification: 'Geocoded', coverage: '70%', freshness: 'On-change' },
    pipeline: [
      { stage: 1, name: 'Geocoding', input: 'Address or coordinates', output: 'lat/lng', logic: 'Forward geocode via Google/OSM, validate within country bbox', intermediary: null },
    ],
    consumers: [
      { module: 'physical-risk-pricing', field: 'assetLocation', tab: 'Asset Map' },
      { module: 'crrem', field: 'propertyCoords', tab: 'Property Map' },
    ],
    lineage: 'Asset registry → geocoding → spatial_asset_mapping → Frontend',
    unit: 'degrees (lat/lng)', updateFrequency: 'On-change', owner: 'Asset Data Team',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERENCE DATA & MISC (DC121–DC135)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'DC121', name: 'Company Profile — Core Identity',
    description: 'Master entity record: legal name, LEI, ISIN, ticker, jurisdiction, sector codes',
    source: { type: 'API', provider: 'GLEIF / Bloomberg / Manual', frequency: 'On-change', format: 'API' },
    db: { schema: 'public', table: 'company_profiles', column: 'legal_name, entity_lei, isin_primary', type: 'VARCHAR', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'GLEIF registry', coverage: '100%', freshness: 'On-change' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'GLEIF + Bloomberg reference', output: 'company_profiles core columns', logic: 'Match on LEI, enrich with GICS/NACE/SIC codes', intermediary: null },
    ],
    consumers: [
      { module: 'dme-entity', field: 'entityProfile', tab: 'Overview' },
      { module: 'esg-data-quality', field: 'entityMaster', tab: 'Entity Lookup' },
    ],
    lineage: 'GLEIF/Bloomberg → company_profiles → all modules',
    unit: 'identity fields', updateFrequency: 'On-change', owner: 'Reference Data Team',
  },
  {
    id: 'DC122', name: 'Portfolio Master Record',
    description: 'Portfolio entity: name, type, AUM, strategy, inception date',
    source: { type: 'Internal', provider: 'Portfolio Management System', frequency: 'Daily', format: 'Database' },
    db: { schema: 'public', table: 'portfolios_pg', column: 'name, aum, portfolio_type', type: 'VARCHAR, NUMERIC, VARCHAR', migration: '005_add_portfolio_analytics_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System of record', coverage: '100%', freshness: 'Daily' },
    pipeline: [
      { stage: 1, name: 'Sync', input: 'Portfolio management system', output: 'portfolios_pg', logic: 'Daily sync of portfolio metadata + AUM', intermediary: null },
    ],
    consumers: [
      { module: 'dme-portfolio', field: 'portfolioMeta', tab: 'Portfolio Overview' },
      { module: 'pcaf-financed-emissions', field: 'portfolioInfo', tab: 'Portfolio Select' },
    ],
    lineage: 'Portfolio system → portfolios_pg → all portfolio modules',
    unit: 'entity record', updateFrequency: 'Daily', owner: 'Portfolio Operations',
  },
  {
    id: 'DC123', name: 'GICS Sector Classification',
    description: 'MSCI/S&P GICS sector/industry/sub-industry hierarchy',
    source: { type: 'API', provider: 'MSCI / S&P', frequency: 'Annual', format: 'Reference table' },
    db: { schema: 'public', table: 'company_profiles', column: 'gics_sector, gics_industry', type: 'VARCHAR', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'GICS standard', coverage: '100% listed', freshness: 'Annual review' },
    pipeline: [
      { stage: 1, name: 'Classification', input: 'GICS lookup by ISIN/LEI', output: 'gics_sector + gics_industry', logic: 'Map from GICS code to sector/industry names', intermediary: null },
    ],
    consumers: [
      { module: 'pcaf-financed-emissions', field: 'gicsSector', tab: 'Sector Breakdown' },
      { module: 'climate-stress-test', field: 'sectorClass', tab: 'Sector PD' },
    ],
    lineage: 'GICS standard → company_profiles → Frontend',
    unit: 'classification', updateFrequency: 'Annual', owner: 'Reference Data Team',
  },
  {
    id: 'DC124', name: 'NACE Sector Classification',
    description: 'EU NACE Rev.2 sector classification for EU Taxonomy mapping',
    source: { type: 'Static', provider: 'Eurostat', frequency: 'Per revision', format: 'Reference table' },
    db: { schema: 'public', table: 'company_profiles', column: 'nace_code', type: 'VARCHAR(10)', migration: '021_add_company_profiles', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Eurostat standard', coverage: '95%', freshness: 'NACE Rev.2' },
    pipeline: [
      { stage: 1, name: 'Mapping', input: 'GICS → NACE crosswalk', output: 'nace_code', logic: 'Apply GICS-to-NACE mapping table + manual override', intermediary: null },
    ],
    consumers: [
      { module: 'eu-taxonomy-engine', field: 'naceCode', tab: 'Activity Screening' },
      { module: 'double-materiality', field: 'naceSector', tab: 'Topic Relevance' },
    ],
    lineage: 'GICS → NACE crosswalk → company_profiles.nace_code → Frontend',
    unit: 'classification code', updateFrequency: 'Per revision', owner: 'Reference Data Team',
  },
  {
    id: 'DC125', name: 'Audit Trail Record',
    description: 'System audit log for all data changes with user/timestamp/before/after',
    source: { type: 'Internal', provider: 'AuditMiddleware', frequency: 'Real-time', format: 'Auto-generated' },
    db: { schema: 'public', table: 'audit_log', column: 'action, table_name, record_id, changes', type: 'JSONB', migration: '026_add_audit_log', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System generated', coverage: '100%', freshness: 'Real-time' },
    pipeline: [
      { stage: 1, name: 'Capture', input: 'Any API write operation', output: 'audit_log entry', logic: 'AuditMiddleware intercepts, captures before/after state', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'auditTrail', tab: 'Change History' },
    ],
    lineage: 'Any write → AuditMiddleware → audit_log → Frontend',
    unit: 'log entry', updateFrequency: 'Real-time', owner: 'Platform Team',
  },
  {
    id: 'DC126', name: 'Parameter Governance Record',
    description: 'Model parameter change governance — approval chain, version history',
    source: { type: 'Internal', provider: 'Governance Module', frequency: 'On-change', format: 'Structured' },
    db: { schema: 'public', table: 'parameter_governance', column: 'parameter_value, approval_status', type: 'JSONB', migration: '027_add_parameter_governance', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Approval workflow', coverage: '100%', freshness: 'On-change' },
    pipeline: [
      { stage: 1, name: 'Submission', input: 'Parameter change request', output: 'parameter_governance entry', logic: 'Store proposed value + justification, route to approver', intermediary: null },
    ],
    consumers: [
      { module: 'dme-risk-engine', field: 'paramGovernance', tab: 'Model Governance' },
    ],
    lineage: 'Change request → approval → parameter_governance → Frontend',
    unit: 'governance record', updateFrequency: 'On-change', owner: 'Model Risk Team',
  },
  {
    id: 'DC127', name: 'Organisation Record',
    description: 'Multi-tenant organisation with RBAC roles and subscription tier',
    source: { type: 'Internal', provider: 'Auth Module', frequency: 'On-change', format: 'Database' },
    db: { schema: 'public', table: 'organisations', column: 'name, subscription_tier', type: 'VARCHAR', migration: '025_add_organisations_rbac', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System record', coverage: '100%', freshness: 'Real-time' },
    pipeline: [
      { stage: 1, name: 'Registration', input: 'Org signup', output: 'organisations record', logic: 'Create org, assign admin role, set tier', intermediary: null },
    ],
    consumers: [
      { module: 'client-portal', field: 'orgProfile', tab: 'Organisation Settings' },
    ],
    lineage: 'Registration → organisations → RBAC → Frontend',
    unit: 'entity record', updateFrequency: 'On-change', owner: 'Platform Team',
  },
  {
    id: 'DC128', name: 'Data Intake Pipeline Status',
    description: 'Status of data ingestion pipelines — file uploads, API syncs, validations',
    source: { type: 'Internal', provider: 'Data Intake Module', frequency: 'Real-time', format: 'Database' },
    db: { schema: 'public', table: 'data_intake_jobs', column: 'status, error_count, row_count', type: 'VARCHAR, INTEGER', migration: '022_add_data_intake_tables', foreignKeys: [] },
    quality: { dqs: 1, verification: 'System status', coverage: '100%', freshness: 'Real-time' },
    pipeline: [
      { stage: 1, name: 'Tracking', input: 'File upload / API sync trigger', output: 'data_intake_jobs', logic: 'Track: queued → processing → validating → complete/failed', intermediary: null },
    ],
    consumers: [
      { module: 'esg-data-quality', field: 'pipelineStatus', tab: 'Data Pipeline' },
    ],
    lineage: 'Upload/sync → data_intake_jobs → Frontend',
    unit: 'job record', updateFrequency: 'Real-time', owner: 'Data Engineering Team',
  },
  {
    id: 'DC129', name: 'Sovereign Climate Risk Index',
    description: 'Country-level climate vulnerability index (ND-GAIN adapted)',
    source: { type: 'API', provider: 'ND-GAIN / IMF', frequency: 'Annual', format: 'CSV' },
    db: { schema: 'public', table: 'country_climate_risk', column: 'climate_risk_index', type: 'NUMERIC(5,2)', migration: '033_add_ca100_country_risk', foreignKeys: [] },
    quality: { dqs: 1, verification: 'Academic/IMF', coverage: '180+ countries', freshness: 'Annual' },
    pipeline: [
      { stage: 1, name: 'Ingestion', input: 'ND-GAIN index + IMF climate indicators', output: 'country_climate_risk', logic: 'Store vulnerability + readiness + exposure scores per country', intermediary: null },
    ],
    consumers: [
      { module: 'em-climate-risk', field: 'sovereignClimate', tab: 'Country Risk Map' },
      { module: 'sovereign-swf', field: 'climateVulnerability', tab: 'Sovereign ESG' },
    ],
    lineage: 'ND-GAIN/IMF → country_climate_risk → Frontend',
    unit: 'score (0-100)', updateFrequency: 'Annual', owner: 'Macro Analytics Team',
  },
  {
    id: 'DC130', name: 'DME Risk Engine — Composite Score',
    description: 'Dynamic Materiality Engine composite risk score per entity',
    source: { type: 'Computed', provider: 'DME Engine', frequency: 'On-demand', format: 'Calculated' },
    db: { schema: 'public', table: 'dme_entity_scores', column: 'composite_score', type: 'NUMERIC(5,2)', migration: '053_add_dme_integration_tables', foreignKeys: [] },
    quality: { dqs: 2, verification: 'Multi-factor model', coverage: '80%', freshness: 'On-demand' },
    pipeline: [
      { stage: 1, name: 'Factor Aggregation', input: 'Physical + transition + ESG + financial factors', output: 'composite_score', logic: '4-branch PD model: physical, transition, credit, market weighted per sector', intermediary: null },
    ],
    consumers: [
      { module: 'dme-dashboard', field: 'compositeScore', tab: 'Executive Dashboard' },
      { module: 'dme-entity', field: 'riskScore', tab: 'Entity Deep-Dive' },
      { module: 'dme-risk-engine', field: 'dmeScore', tab: 'Risk Engine Output' },
    ],
    lineage: 'All risk inputs → DME 4-branch model → dme_entity_scores → Frontend',
    unit: 'score (0-100)', updateFrequency: 'On-demand', owner: 'DME Team',
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// 2. DB_TABLE_MAP — Maps every Alembic table to its catalogue entries
// ─────────────────────────────────────────────────────────────────────────────

export const DB_TABLE_MAP = {
  // Initial schema
  'company_profiles': ['DC001','DC002','DC003','DC004','DC019','DC020','DC021','DC022','DC026','DC027','DC031','DC032','DC033','DC034','DC035','DC036','DC037','DC038','DC041','DC042','DC043','DC049','DC050','DC071','DC072','DC081','DC082','DC111','DC112','DC113','DC116','DC117','DC118','DC119','DC121','DC123','DC124'],
  'assets_pg': ['DC001','DC002','DC003','DC013','DC014','DC017','DC018','DC020','DC021','DC022','DC023','DC072','DC073','DC079','DC080','DC083'],
  'portfolios_pg': ['DC073','DC083','DC084','DC085','DC122'],
  'portfolio_analytics': ['DC084','DC085','DC122'],

  // 001–003 tables
  'cbam_declarations': ['DC105'],
  'stranded_assets': ['DC069'],
  'nature_risk_assessment': ['DC106','DC107','DC109','DC110'],
  'ecosystem_dependency': ['DC109'],
  'spatial_asset_mapping': ['DC114','DC120'],

  // 005–006 financial
  'ecl_assessments': ['DC078'],
  'ecl_exposures': ['DC074','DC075','DC076','DC077'],
  'ecl_scenario_results': ['DC078'],
  'ecl_climate_overlays': ['DC070'],
  'pcaf_portfolios': ['DC009','DC010','DC011'],
  'pcaf_investees': ['DC009','DC010','DC011','DC013'],
  'pcaf_portfolio_results': ['DC009','DC010','DC011','DC012','DC028','DC029'],
  'temperature_scores': ['DC067'],

  // 009 regulatory
  'regulatory_entities': ['DC090','DC093','DC094','DC095'],
  'sfdr_pai_disclosures': ['DC086','DC087','DC088','DC089'],
  'eu_taxonomy_assessments': ['DC054'],
  'tcfd_assessments': ['DC053'],
  'csrd_readiness_assessments': ['DC093'],
  'csrd_topic_assessments': ['DC093'],
  'issb_assessments': ['DC094'],
  'brsr_disclosures': ['DC095'],

  // 018 time series
  'time_series_data': ['DC030','DC050'],
  'emission_factors': ['DC005','DC006','DC007','DC023','DC102','DC103','DC104'],
  'grid_intensity': ['DC008'],
  'carbon_prices': ['DC096','DC097','DC098','DC099'],

  // 022–027 platform
  'data_intake_jobs': ['DC128'],
  'engagement_records': ['DC046','DC051','DC052'],
  'organisations': ['DC127'],
  'audit_log': ['DC125'],
  'parameter_governance': ['DC126'],

  // 030–035 geospatial & standards
  'wdpa_protected_areas': ['DC114'],
  'gfw_deforestation_alerts': ['DC108'],
  'reference_violations': ['DC044','DC045'],
  'gdelt_controversy_events': ['DC039','DC040'],
  'ca100_company_benchmarks': ['DC046'],
  'country_climate_risk': ['DC129'],
  'esrs_catalog_items': ['DC101'],
  'gri_standards': ['DC100'],

  // 039 climate risk
  'climate_assessment_methodologies': ['DC068'],
  'climate_assessment_results': ['DC060','DC065','DC066'],
  'climate_physical_risk_scores': ['DC056','DC057','DC058','DC059','DC060'],
  'climate_transition_risk_scores': ['DC061','DC062','DC063','DC064','DC065'],

  // 041 facilitated/insurance
  'facilitated_emissions': ['DC024'],
  'insurance_associated_emissions': ['DC025'],

  // 050–056 PCAF quality, taxonomy, DMA, SFDR
  'pcaf_holding_quality_scores': ['DC015'],
  'pcaf_portfolio_quality_reports': ['DC016'],
  'taxonomy_activity_assessments': ['DC054'],
  'taxonomy_entity_alignments': ['DC054'],
  'taxonomy_portfolio_alignments': ['DC055'],
  'dma_assessments': ['DC091','DC092'],
  'dma_topic_scores': ['DC091','DC092'],
  'dma_stakeholder_engagements': ['DC091'],
  'sfdr_pai_assessments': ['DC086','DC087','DC088','DC089','DC115'],
  'sfdr_pai_indicator_values': ['DC086','DC087','DC088','DC089','DC115'],
  'sfdr_entity_classifications': ['DC090'],
  'ets_product_benchmarks': ['DC105'],

  // 053–054 DME
  'dme_entity_scores': ['DC130'],
  'esg_sentiment_scores': ['DC047'],
  'esg_factor_registry': ['DC048'],
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. MODULE_DATA_MAP — Maps every frontend module to catalogue entries consumed
// ─────────────────────────────────────────────────────────────────────────────

export const MODULE_DATA_MAP = {
  // ── Core Climate & Emissions ──
  'pcaf-financed-emissions': ['DC001','DC002','DC003','DC009','DC010','DC011','DC012','DC013','DC014','DC015','DC016','DC017','DC018','DC023','DC024','DC028','DC029','DC030','DC054','DC073','DC083','DC084','DC102','DC122','DC123'],
  'climate-banking-hub': ['DC001','DC009','DC021','DC024','DC025','DC028','DC030','DC067'],
  'temperature-alignment': ['DC001','DC002','DC020','DC067'],
  'carbon-accounting-ai': ['DC001','DC002','DC003','DC004','DC005','DC006','DC007','DC008','DC023','DC026','DC027','DC034'],
  'carbon-removal': ['DC019','DC026'],
  'internal-carbon-price': ['DC096','DC097','DC098','DC099'],
  'vcm-integrity': ['DC096','DC097','DC098','DC099','DC104','DC118'],
  'crypto-climate': ['DC008','DC096'],

  // ── Climate Risk ──
  'climate-stress-test': ['DC001','DC056','DC057','DC058','DC059','DC060','DC061','DC062','DC063','DC064','DC065','DC066','DC068','DC069','DC070','DC074','DC075','DC076','DC077','DC078','DC096','DC123'],
  'stress-test-orchestrator': ['DC066','DC068'],
  'physical-risk-pricing': ['DC056','DC057','DC058','DC059','DC060','DC120'],
  'climate-derivatives': ['DC103','DC116','DC117'],
  'climate-insurance': ['DC025','DC059'],
  'climate-litigation': ['DC064'],
  'em-climate-risk': ['DC085','DC129'],
  'crrem': ['DC008','DC056','DC120'],
  'loss-damage': ['DC057'],

  // ── ESG Data & Ratings ──
  'esg-data-quality': ['DC031','DC032','DC033','DC034','DC035','DC036','DC037','DC038','DC041','DC042','DC043','DC049','DC050','DC125','DC128'],
  'esg-controversy': ['DC039','DC040','DC044','DC045','DC047','DC049'],
  'sentiment-analysis': ['DC039','DC047'],
  'anomaly-detection': ['DC032','DC038'],
  'predictive-esg': ['DC031','DC037','DC048','DC050'],

  // ── Engagement & Stewardship ──
  'ai-engagement': ['DC022','DC040','DC046','DC050','DC051','DC052'],

  // ── Sustainable Finance ──
  'green-securitisation': ['DC079'],
  'green-hydrogen': ['DC096'],
  'social-bond': ['DC079'],
  'sscf': ['DC079'],
  'sll-slb-v2': ['DC080'],
  'transition-finance': ['DC020','DC021','DC022','DC046','DC069'],
  'adaptation-finance': ['DC056','DC057'],
  'just-transition': ['DC112'],
  'sdg-bond-impact': ['DC079'],

  // ── Nature & Biodiversity ──
  'corporate-nature-strategy': ['DC106','DC108','DC109','DC110','DC114'],
  'biodiversity-credits': ['DC106'],
  'nbs-finance': ['DC114'],
  'nature-capital-accounting': ['DC109'],
  'water-risk': ['DC058','DC107'],
  'critical-minerals': ['DC108'],

  // ── Regulatory & Taxonomy ──
  'eu-taxonomy': ['DC054'],
  'eu-taxonomy-engine': ['DC054','DC055','DC124'],
  'sfdr-classification': ['DC086','DC087','DC088','DC089','DC090'],
  'sfdr-art9': ['DC044','DC054','DC086','DC087','DC088','DC089','DC090','DC115'],
  'double-materiality': ['DC041','DC091','DC092','DC101','DC124'],
  'issb-tcfd': ['DC053','DC094'],
  'comprehensive-reporting': ['DC053','DC093','DC094','DC100','DC101'],
  'regulatory-horizon': ['DC093'],
  'climate-policy': ['DC061','DC096','DC105'],
  'social-taxonomy': ['DC042','DC111','DC112','DC113'],
  'regulatory-capital': ['DC070','DC076','DC077','DC081','DC082','DC055'],
  'export-credit-esg': ['DC105'],
  'pcaf-india-brsr': ['DC009','DC095'],

  // ── DME Suite ──
  'dme-dashboard': ['DC091','DC130'],
  'dme-risk-engine': ['DC065','DC066','DC075','DC126','DC130'],
  'dme-entity': ['DC071','DC072','DC081','DC121','DC130'],
  'dme-scenarios': ['DC068'],
  'dme-alerts': ['DC130'],
  'dme-contagion': ['DC130'],
  'dme-portfolio': ['DC083','DC084','DC085','DC122'],
  'dme-competitive': ['DC130'],

  // ── Reporting Suite ──
  'reporting-hub': ['DC052','DC090'],
  'report-generator': ['DC054','DC086','DC093'],
  'client-portal': ['DC127'],
  'scheduled-reports': ['DC128'],
  'regulatory-submission': ['DC086','DC093','DC094','DC095'],

  // ── Impact ──
  'impact-weighted-accounts': ['DC019'],
  'iris-metrics': ['DC041','DC042','DC043'],
  'blended-finance': ['DC079'],
  'impact-verification': ['DC019'],

  // ── AI Analytics ──
  'esg-report-parser': ['DC101'],
  'document-similarity': ['DC101'],
  'ai-governance': ['DC043'],

  // ── Commodity & Supply Chain ──
  'commodity-intelligence': ['DC096'],
  'lifecycle-assessment': ['DC005','DC006'],
  'esg-value-chain': ['DC108'],

  // ── Other Specialist ──
  'climate-financial-statements': ['DC004','DC028','DC078'],
  'sovereign-swf': ['DC129'],
  'climate-tech': ['DC062'],
  'forced-labour': ['DC045','DC112','DC113'],
  'digital-product-passport': ['DC108'],
  'equator-principles': ['DC060','DC065'],
  'esms': ['DC060','DC113'],
  'framework-interop': ['DC100','DC101'],
  'gri-alignment': ['DC100'],
  'taxonomy-hub': ['DC054','DC086','DC094','DC100'],
};


// ─────────────────────────────────────────────────────────────────────────────
// 4. TRANSFORMATION_REGISTRY — Every transformation with input/output/logic
// ─────────────────────────────────────────────────────────────────────────────

export const TRANSFORMATION_REGISTRY = [
  { id: 'TR001', name: 'PCAF Attribution Factor', input: ['DC073','DC017'], output: 'DC013', formula: 'MIN(outstanding / EVIC, 1.0)', methodology: 'PCAF Standard v2 — Part A' },
  { id: 'TR002', name: 'PCAF Financed Scope 1', input: ['DC001','DC013'], output: 'DC009', formula: 'attribution_factor × scope1_tco2e', methodology: 'PCAF Standard v2' },
  { id: 'TR003', name: 'PCAF Financed Scope 2', input: ['DC002','DC013'], output: 'DC010', formula: 'attribution_factor × scope2_tco2e', methodology: 'PCAF Standard v2' },
  { id: 'TR004', name: 'PCAF Financed Scope 3', input: ['DC003','DC013'], output: 'DC011', formula: 'attribution_factor × scope3_tco2e', methodology: 'PCAF Standard v2' },
  { id: 'TR005', name: 'WACI Calculation', input: ['DC001','DC002','DC072','DC083'], output: 'DC028', formula: 'Σ(weight × (scope1+scope2) / revenue)', methodology: 'TCFD / PCAF' },
  { id: 'TR006', name: 'Carbon Footprint', input: ['DC009','DC010','DC122'], output: 'DC029', formula: 'total_FE_scope12 / (AUM / 1M)', methodology: 'TCFD' },
  { id: 'TR007', name: 'Carbon Intensity (Revenue)', input: ['DC001','DC002','DC072'], output: 'DC012', formula: '(scope1 + scope2) / (revenue / 1M)', methodology: 'TCFD' },
  { id: 'TR008', name: 'DQS Composite Score', input: ['DC014'], output: 'DC015', formula: '0.4×dqs_emissions + 0.2×completeness + 0.15×timeliness + 0.15×granularity + 0.1×methodology', methodology: 'PCAF Standard v2' },
  { id: 'TR009', name: 'Portfolio DQS', input: ['DC015','DC073'], output: 'DC016', formula: 'Σ(outstanding_weight × holding_dqs)', methodology: 'PCAF Standard v2' },
  { id: 'TR010', name: 'ESG Consensus', input: ['DC031','DC032','DC033','DC034','DC035','DC036'], output: 'DC037', formula: 'AVG(normalised_scores) for available providers', methodology: 'Internal — equal-weight normalised' },
  { id: 'TR011', name: 'ESG Divergence', input: ['DC031','DC032','DC033','DC034','DC035','DC036'], output: 'DC038', formula: 'STDDEV(normalised_scores)', methodology: 'Statistical' },
  { id: 'TR012', name: 'Physical Risk Composite', input: ['DC056','DC057','DC058','DC059'], output: 'DC060', formula: '0.30×flood + 0.25×heat + 0.25×water + 0.20×storm', methodology: 'Internal multi-hazard framework' },
  { id: 'TR013', name: 'Transition Risk Composite', input: ['DC061','DC062','DC063','DC064'], output: 'DC065', formula: '0.35×policy + 0.25×tech + 0.25×market + 0.15×reputation', methodology: 'TCFD 4-category' },
  { id: 'TR014', name: 'Climate VaR', input: ['DC060','DC065','DC096','DC073'], output: 'DC066', formula: 'Monte Carlo: Σ(carbon_price × emissions + physical_damage × exposure) → 95th %ile', methodology: 'Internal CVaR model' },
  { id: 'TR015', name: 'Implied Temperature Rise', input: ['DC001','DC002','DC020','DC083'], output: 'DC067', formula: 'SBTi temperature scoring: map targets to °C overshoot, weight by portfolio', methodology: 'SBTi / PACTA' },
  { id: 'TR016', name: 'ECL Calculation', input: ['DC075','DC076','DC077'], output: 'DC078', formula: 'ECL = PD × LGD × EAD (stage-weighted, scenario probability-weighted)', methodology: 'IFRS 9' },
  { id: 'TR017', name: 'Climate PD Overlay', input: ['DC075','DC060','DC065'], output: 'DC070', formula: 'PD_adj = PD_base × (1 + f(physical_score, transition_score))', methodology: 'BoE/ECB guidance' },
  { id: 'TR018', name: 'SFDR PAI #1', input: ['DC009','DC010','DC011'], output: 'DC086', formula: 'Scope 1+2+3 financed emissions (absolute)', methodology: 'SFDR RTS Annex I Table 1' },
  { id: 'TR019', name: 'SFDR PAI #2', input: ['DC009','DC010','DC122'], output: 'DC087', formula: 'Total FE (S1+S2) / current value of investments × 1M', methodology: 'SFDR RTS Annex I Table 1' },
  { id: 'TR020', name: 'SFDR PAI #3', input: ['DC001','DC002','DC072','DC083'], output: 'DC088', formula: 'Σ(weight × investee_scope12 / investee_revenue)', methodology: 'SFDR RTS Annex I Table 1' },
  { id: 'TR021', name: 'EU Taxonomy Alignment (Turnover)', input: ['DC054'], output: 'DC054', formula: 'aligned_turnover / total_turnover × 100', methodology: 'EU Taxonomy Regulation 2020/852' },
  { id: 'TR022', name: 'Green Asset Ratio', input: ['DC054','DC073'], output: 'DC055', formula: 'Σ(taxonomy_aligned_exposure) / total_banking_book', methodology: 'CRR Art. 449a' },
  { id: 'TR023', name: 'DMA Impact Severity', input: ['DC091'], output: 'DC091', formula: 'MAX(scale × scope, irremediability)', methodology: 'EFRAG IG1' },
  { id: 'TR024', name: 'DMA Financial Score', input: ['DC092'], output: 'DC092', formula: 'MAX(risk_likelihood × risk_magnitude, opportunity_magnitude)', methodology: 'EFRAG IG1' },
  { id: 'TR025', name: 'Scope 3 Estimation (EEIO)', input: ['DC072','DC023'], output: 'DC003', formula: 'revenue_eur × sector_emission_factor', methodology: 'PCAF / EXIOBASE' },
  { id: 'TR026', name: 'Sector Allocation', input: ['DC083','DC123'], output: 'DC084', formula: 'SUM(weight) GROUP BY gics_sector', methodology: 'Portfolio analytics' },
  { id: 'TR027', name: 'Country Allocation', input: ['DC083','DC121'], output: 'DC085', formula: 'SUM(weight) GROUP BY headquarters_country', methodology: 'Portfolio analytics' },
  { id: 'TR028', name: 'ESG Momentum', input: ['DC037','DC050'], output: 'DC050', formula: '(consensus_now - consensus_12m_ago) / consensus_12m_ago × 100', methodology: 'Internal momentum signal' },
  { id: 'TR029', name: 'E Pillar Composite', input: ['DC031','DC032','DC033','DC034','DC035','DC036'], output: 'DC041', formula: 'Normalised E-sub-scores: emissions(30%) + resource(25%) + waste(20%) + bio(15%) + water(10%)', methodology: 'Internal pillar methodology' },
  { id: 'TR030', name: 'S Pillar Composite', input: ['DC031','DC032','DC033','DC034','DC035','DC036'], output: 'DC042', formula: 'Normalised S-sub-scores: labour(30%) + H&S(25%) + community(20%) + supply(15%) + product(10%)', methodology: 'Internal pillar methodology' },
  { id: 'TR031', name: 'G Pillar Composite', input: ['DC031','DC032','DC033','DC034','DC035','DC036'], output: 'DC043', formula: 'Normalised G-sub-scores: board(35%) + comp(25%) + shareholder(20%) + audit(10%) + anti-corrupt(10%)', methodology: 'Internal pillar methodology' },
  { id: 'TR032', name: 'Facilitated Emissions Attribution', input: ['DC001','DC002','DC003'], output: 'DC024', formula: 'bank_deal_share × issuer_total_emissions', methodology: 'PCAF Standard Part C' },
  { id: 'TR033', name: 'Insurance-Associated Attribution', input: ['DC001','DC002'], output: 'DC025', formula: 'premium_share × insured_entity_emissions', methodology: 'PCAF Standard Part C' },
  { id: 'TR034', name: 'YoY Emissions Change', input: ['DC009','DC030'], output: 'DC030', formula: '(FE_current - FE_prior) / FE_prior × 100', methodology: 'TCFD trend metric' },
  { id: 'TR035', name: 'Scope 2 Location-Based', input: ['DC008','DC002'], output: 'DC002', formula: 'electricity_kwh × grid_factor / 1000', methodology: 'GHG Protocol Scope 2 Guidance' },
  { id: 'TR036', name: 'Stranded Asset Probability', input: ['DC069','DC096'], output: 'DC069', formula: 'Compare remaining_carbon_budget vs reserve_life under carbon_price_trajectory', methodology: 'Carbon Tracker methodology' },
  { id: 'TR037', name: 'Holding Weight', input: ['DC073','DC122'], output: 'DC083', formula: 'market_value / SUM(market_values) × 100', methodology: 'Standard portfolio math' },
  { id: 'TR038', name: 'SFDR PAI #4 Fossil Screening', input: ['DC123','DC083'], output: 'DC089', formula: 'SUM(weight) WHERE fossil_fuel_revenue_pct > 5%', methodology: 'SFDR RTS Annex I' },
  { id: 'TR039', name: 'SFDR PAI #7 Biodiversity', input: ['DC114','DC083'], output: 'DC115', formula: 'SUM(weight) WHERE distance_to_KBA < 10km', methodology: 'SFDR RTS Annex I' },
  { id: 'TR040', name: 'CSRD Readiness', input: ['DC093','DC101'], output: 'DC093', formula: 'AVG(topic_readiness × materiality_weight) across ESRS topics', methodology: 'Internal CSRD gap analysis' },
  { id: 'TR041', name: 'MSA Biodiversity Footprint', input: ['DC120','DC114','DC106'], output: 'DC106', formula: 'GLOBIO: MSA_loss = f(land_use, intensity, KBA_proximity)', methodology: 'GLOBIO4 / TNFD' },
  { id: 'TR042', name: 'DME Composite Risk Score', input: ['DC060','DC065','DC075','DC037'], output: 'DC130', formula: '4-branch: w1×physical + w2×transition + w3×credit + w4×market (sector-calibrated)', methodology: 'DME proprietary model' },
  { id: 'TR043', name: 'CII Rating Calculation', input: ['DC116'], output: 'DC116', formula: 'CII = CO2_emitted / (DWT × distance); compare to ref_line × (1 - reduction_factor)', methodology: 'IMO MEPC.337(76)' },
  { id: 'TR044', name: 'EVIC Calculation', input: ['DC071'], output: 'DC017', formula: 'EVIC = market_cap + total_debt + preferred_equity + minority_interest', methodology: 'PCAF Standard v2' },
  { id: 'TR045', name: 'NLP Sentiment Composite', input: ['DC047'], output: 'DC047', formula: 'TF-IDF weighted FinBERT scores → -1 to +1 composite', methodology: 'Internal NLP pipeline' },
  { id: 'TR046', name: 'Controversy Severity NLP', input: ['DC039'], output: 'DC040', formula: 'NLP severity classifier: event_text → severity(1-5)', methodology: 'Internal NLP + analyst rules' },
  { id: 'TR047', name: 'Water Stress Ratio', input: ['DC058'], output: 'DC107', formula: 'water_demand / water_supply per basin', methodology: 'WRI Aqueduct 4.0' },
  { id: 'TR048', name: 'GWP Conversion', input: ['DC007'], output: 'DC001', formula: 'tCO2e = Σ(gas_mass × GWP_100_AR6)', methodology: 'IPCC AR6 GWP-100' },
  { id: 'TR049', name: 'ECL Scenario Weighting', input: ['DC078'], output: 'DC078', formula: 'ECL_weighted = Σ(scenario_probability × scenario_ECL) across 4 scenarios', methodology: 'IFRS 9 multiple scenarios' },
  { id: 'TR050', name: 'Basel RWA (SA-CR)', input: ['DC074','DC077'], output: 'DC082', formula: 'RWA = EAD × risk_weight(rating_grade)', methodology: 'CRR2 / Basel IV SA-CR' },
];


// ─────────────────────────────────────────────────────────────────────────────
// 5. Utility — lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Find catalogue entry by ID */
export const getCatalogueEntry = (id) => DATA_CATALOGUE.find(e => e.id === id);

/** Find all entries for a given DB table */
export const getEntriesForTable = (tableName) => {
  const ids = DB_TABLE_MAP[tableName] || [];
  return ids.map(id => getCatalogueEntry(id)).filter(Boolean);
};

/** Find all entries consumed by a frontend module */
export const getEntriesForModule = (moduleSlug) => {
  const ids = MODULE_DATA_MAP[moduleSlug] || [];
  return ids.map(id => getCatalogueEntry(id)).filter(Boolean);
};

/** Find all transformations that produce a given output */
export const getTransformationsForOutput = (outputId) =>
  TRANSFORMATION_REGISTRY.filter(t => t.output === outputId);

/** Find all transformations that consume a given input */
export const getTransformationsForInput = (inputId) =>
  TRANSFORMATION_REGISTRY.filter(t => t.input.includes(inputId));

/** Seeded pseudo-random accessor for reproducible test data generation */
export const seededValue = (catalogueId, seed) => {
  const idx = parseInt(catalogueId.replace('DC', ''), 10);
  return sr(idx * 31 + (seed || 0));
};
