/**
 * METRIC JOURNEYS -- Complete lifecycle of every key datapoint
 * Sprint AK -- Cross-Module Data Integration Layer
 *
 * Documents the COMPLETE JOURNEY of every key metric/datapoint through the
 * platform -- from raw source ingestion through every transformation,
 * intermediary stage, and final presentation. A "data biography" per metric.
 *
 * 50 journeys x 9 stages = 450 stage records.
 *
 * CRITICAL: Deterministic seeded RNG -- no Math.random().
 */

// Deterministic seeded RNG
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

let _seed = 900;
const rand = () => { _seed++; return sr(_seed); };
const randRange = (lo, hi) => lo + rand() * (hi - lo);
const round2 = (v) => Math.round(v * 100) / 100;

// ========================================================================
//  STAGE DEFINITIONS
// ========================================================================

export const STAGE_DEFINITIONS = {
  SOURCE:         'Raw data as received from external provider or company disclosure',
  INGESTION:      'Loaded into staging tables with metadata and import timestamp',
  VALIDATION:     'Quality checks, unit conversion, outlier detection, cross-source reconciliation',
  TRANSFORMATION: 'Entity resolution, temporal alignment, production table storage',
  ENRICHMENT:     'Derived metrics, benchmarking, trend calculation',
  AGGREGATION:    'Portfolio-level attribution and rollup',
  INTERPRETATION: 'Contextual comparison (vs benchmark, target, regulation, trend)',
  PRESENTATION:   'Module-specific visualization and formatting',
  ACTION:         'Decision triggers and workflow integration',
};

const STAGES = Object.keys(STAGE_DEFINITIONS);

// ========================================================================
//  METRIC JOURNEYS -- 50 complete journeys (9 stages each)
// ========================================================================

export const METRIC_JOURNEYS = [

  // =====================================================================
  //  CORE METRICS (15 journeys: MJ001 - MJ015)
  // =====================================================================

  // -- MJ001: Scope 1 GHG Emissions --
  {
    id: 'MJ001',
    metric: 'Scope 1 GHG Emissions',
    unit: 'tCO2e',
    category: 'Core',
    journey: [
      {
        stage: 'SOURCE',
        description: 'Company reports Scope 1 emissions in annual sustainability report / CDP Climate Change questionnaire (C6.1)',
        datapoint: 'Raw reported value in company-chosen unit (tCO2, tCO2e, ktCO2)',
        source: 'CDP API / Company PDF / Bloomberg ESG',
        format: 'CSV / JSON / PDF extraction',
        frequency: 'Annual (lag: 3-6 months post fiscal year-end)',
        quality: 'Varies: assured (DQS 1-2) vs unassured (DQS 3-4) vs estimated (DQS 5)',
        example: { company: 'Shell plc', value: 68_000_000, unit: 'tCO2e', year: 2023, assured: true, assurer: 'KPMG' },
      },
      {
        stage: 'INGESTION',
        description: 'Raw data loaded into staging table with source metadata',
        dbTable: 'staging.raw_emissions_import',
        dbColumns: ['source_id', 'company_ref', 'metric_code', 'raw_value', 'raw_unit', 'reporting_period', 'import_timestamp'],
        validation: 'Schema validation, duplicate detection, source reconciliation',
        example: { table: 'staging.raw_emissions_import', row: { source_id: 'CDP-2023-SHELL', raw_value: 68000000, raw_unit: 'tCO2e' } },
      },
      {
        stage: 'VALIDATION',
        description: 'Data quality checks: unit conversion, outlier detection, year-on-year variance, cross-source reconciliation',
        checks: [
          'Unit standardization: convert all to tCO2e using GWP-100 (IPCC AR6)',
          'Outlier detection: flag if YoY change > 50%',
          'Cross-source check: compare CDP vs Annual Report vs Bloomberg',
          'Completeness: flag if Scope 1 reported but Scope 2 missing',
        ],
        dbTable: 'staging.validated_emissions',
        qualityScore: 'DQS assigned based on source + assurance + methodology',
        example: { status: 'PASS', dqs: 2, flags: [], yoyChange: '-3.2%' },
      },
      {
        stage: 'TRANSFORMATION',
        description: 'Validated emissions stored in production table, linked to company profile via LEI/ISIN',
        dbTable: 'company_emissions',
        dbColumns: ['company_profile_id', 'reporting_year', 'scope1_tco2e', 'scope2_location_tco2e', 'scope2_market_tco2e', 'scope3_tco2e', 'dqs', 'source_ref'],
        transformation: 'Entity resolution (fuzzy match company name -> company_profiles.id), temporal alignment to fiscal year',
        example: { company_profile_id: 42, reporting_year: 2023, scope1_tco2e: 68000000, dqs: 2 },
      },
      {
        stage: 'ENRICHMENT',
        description: 'Emissions enriched with derived metrics: intensity, sector benchmark, year-on-year trend',
        derivedMetrics: [
          { name: 'Carbon Intensity', formula: 'scope1 / revenue_usd_m', unit: 'tCO2e/$M', example: '68M / $381,000M = 178.5' },
          { name: 'Sector Percentile', formula: 'percentile_rank(intensity) within sector', example: 'P85 (high emitter within Energy)' },
          { name: 'YoY Trend', formula: '(current - previous) / previous', example: '-3.2% reduction' },
        ],
        dbTable: 'analytics.emissions_enriched',
      },
      {
        stage: 'AGGREGATION',
        description: 'Company emissions attributed to portfolio holdings using PCAF methodology',
        methodology: 'PCAF Standard v2, Asset Class 1 (Listed Equity): attribution = outstanding / EVIC',
        formula: 'Financed Scope 1 = (outstanding_amount / evic) * scope1_tco2e',
        example: { outstanding: 500_000_000, evic: 210_000_000_000, scope1: 68_000_000, financed: 161_905, unit: 'tCO2e' },
        dbTable: 'analytics.pcaf_attribution',
        consumers: ['pcaf-financed-emissions', 'climate-banking-hub', 'portfolio-temperature-score'],
      },
      {
        stage: 'INTERPRETATION',
        description: 'Financed emissions contextualized for decision-making',
        interpretations: [
          { context: 'vs benchmark', value: 'Portfolio: 312 tCO2e/$M vs MSCI ACWI: 180 tCO2e/$M -> 73% above benchmark' },
          { context: 'vs target', value: 'NZAM 2030 target: 150 tCO2e/$M -> 52% reduction needed' },
          { context: 'vs regulation', value: 'SFDR PAI 1 disclosure: 312 tCO2e/$M (mandatory)' },
          { context: 'trend', value: '-8% YoY -> on track for -4.2% annual reduction pace' },
        ],
      },
      {
        stage: 'PRESENTATION',
        description: 'Displayed across multiple modules with context-appropriate visualization',
        presentations: [
          { module: 'pcaf-financed-emissions', tab: 'Portfolio Builder', viz: 'KPI card + asset class breakdown bar', value: '305.29M tCO2e' },
          { module: 'climate-banking-hub', tab: 'Executive Dashboard', viz: 'Trend line + peer comparison', value: '312 tCO2e/$M' },
          { module: 'portfolio-temperature-score', tab: 'Holdings Screener', viz: 'Column in sortable table', value: 'Per-holding financed emissions' },
          { module: 'disclosure-hub', tab: 'SFDR PAI', viz: 'PAI 1 field auto-populated', value: '312 tCO2e/$M invested' },
        ],
      },
      {
        stage: 'ACTION',
        description: 'Insights drive specific user actions',
        actions: [
          { trigger: 'Financed emissions > benchmark', action: 'Engagement letter to top 10 emitters', module: 'transition-planning-hub', tab: 'Engagement Pipeline' },
          { trigger: 'DQS > 3 for key holdings', action: 'Request verified data from company', module: 'pcaf-financed-emissions', tab: 'DQS Improvement Wizard' },
          { trigger: 'YoY increase detected', action: 'Flag for IC review + voting decision', module: 'esg-ratings-hub', tab: 'Consensus & Alerts' },
        ],
      },
    ],
  },

  // -- MJ002: Scope 2 GHG Emissions --
  {
    id: 'MJ002',
    metric: 'Scope 2 GHG Emissions (Location & Market-Based)',
    unit: 'tCO2e',
    category: 'Core',
    journey: [
      {
        stage: 'SOURCE',
        description: 'Company reports Scope 2 emissions in two methods: location-based (grid average) and market-based (contractual instruments)',
        datapoint: 'Dual reporting: location-based tCO2e + market-based tCO2e',
        source: 'CDP (C6.2, C6.3) / GHG Protocol Scope 2 Guidance / Company Annual Report',
        format: 'CSV / JSON / PDF extraction',
        frequency: 'Annual',
        quality: 'DQS 1-3 typical; market-based requires EAC/REC evidence',
        example: { company: 'Microsoft Corp', location: 3_200_000, market: 180_000, unit: 'tCO2e', year: 2023 },
      },
      {
        stage: 'INGESTION',
        description: 'Both location-based and market-based values ingested as paired record',
        dbTable: 'staging.raw_emissions_import',
        dbColumns: ['source_id', 'company_ref', 'scope2_location_raw', 'scope2_market_raw', 'raw_unit', 'reporting_period'],
        validation: 'Pair completeness check: both methods should be present per GHG Protocol',
        example: { row: { scope2_location_raw: 3200000, scope2_market_raw: 180000, unit: 'tCO2e' } },
      },
      {
        stage: 'VALIDATION',
        description: 'Cross-validate location vs market gap, grid factor reasonableness, REC evidence',
        checks: [
          'Location-market delta analysis: large gap requires renewable energy certificate evidence',
          'Grid factor reasonableness: compare implied grid factor vs IEA country average',
          'Temporal match: ensure grid factors and energy consumption align on same reporting year',
          'Double counting: verify RECs are not resold or expired',
        ],
        dbTable: 'staging.validated_emissions',
        qualityScore: 'DQS 1-2 if both methods + third-party verification; DQS 3-4 if one method only',
        example: { status: 'PASS', dqs: 2, flags: ['LARGE_MARKET_DELTA'], delta_pct: '-94%' },
      },
      {
        stage: 'TRANSFORMATION',
        description: 'Production storage with dual columns for both accounting methods',
        dbTable: 'company_emissions',
        dbColumns: ['company_profile_id', 'reporting_year', 'scope2_location_tco2e', 'scope2_market_tco2e'],
        transformation: 'Entity resolution via LEI, unit normalization to tCO2e, FY alignment',
        example: { company_profile_id: 88, reporting_year: 2023, scope2_location_tco2e: 3200000, scope2_market_tco2e: 180000 },
      },
      {
        stage: 'ENRICHMENT',
        description: 'Grid-specific intensity, renewable procurement rate, additionality assessment',
        derivedMetrics: [
          { name: 'Renewable Procurement Rate', formula: '1 - (market / location)', unit: '%', example: '1 - (180K/3.2M) = 94.4%' },
          { name: 'Implied Grid Factor', formula: 'scope2_location / total_electricity_mwh', unit: 'tCO2e/MWh', example: '0.42 tCO2e/MWh' },
          { name: 'RE100 Progress', formula: 'renewable_pct vs RE100 target year', example: '94% achieved vs 100% by 2025' },
        ],
        dbTable: 'analytics.emissions_enriched',
      },
      {
        stage: 'AGGREGATION',
        description: 'Portfolio-level Scope 2 using PCAF attribution, choice of location or market method per user preference',
        methodology: 'PCAF v2 with user toggle: location-based (conservative) vs market-based (incentivizes procurement)',
        formula: 'Financed Scope 2 = (outstanding / EVIC) * scope2_method_tco2e',
        example: { method: 'market', portfolio_scope2: 42_300, unit: 'tCO2e' },
        dbTable: 'analytics.pcaf_attribution',
        consumers: ['pcaf-financed-emissions', 'climate-banking-hub'],
      },
      {
        stage: 'INTERPRETATION',
        description: 'Scope 2 contextualized by renewable energy procurement and grid decarbonization trends',
        interpretations: [
          { context: 'vs benchmark', value: 'Portfolio market Scope 2: 18 tCO2e/$M vs benchmark 65 tCO2e/$M -> 72% below' },
          { context: 'renewable trend', value: '78% of portfolio companies have RE procurement strategy' },
          { context: 'grid sensitivity', value: 'Location-based 5x higher than market -> grid risk if RECs unavailable' },
        ],
      },
      {
        stage: 'PRESENTATION',
        description: 'Dual display: location vs market toggle in emission dashboards',
        presentations: [
          { module: 'pcaf-financed-emissions', tab: 'Scope Breakdown', viz: 'Stacked bar (location vs market)', value: '42.3K tCO2e' },
          { module: 'corporate-decarbonisation', tab: 'Renewable Energy', viz: 'RE procurement waterfall', value: '94% RE coverage' },
          { module: 'disclosure-hub', tab: 'CSRD E1', viz: 'Dual disclosure field', value: 'Both methods reported' },
        ],
      },
      {
        stage: 'ACTION',
        description: 'Triggers related to renewable energy procurement gaps',
        actions: [
          { trigger: 'Market < 20% of Location', action: 'Flag strong RE procurement, positive for engagement', module: 'transition-planning-hub' },
          { trigger: 'Location only reported', action: 'Request market-based from company via engagement', module: 'pcaf-financed-emissions' },
          { trigger: 'No scope 2 at all', action: 'Estimate using revenue-based sector proxy', module: 'pcaf-financed-emissions', tab: 'DQS Improvement Wizard' },
        ],
      },
    ],
  },

  // -- MJ003: Scope 3 GHG Emissions --
  {
    id: 'MJ003',
    metric: 'Scope 3 GHG Emissions',
    unit: 'tCO2e',
    category: 'Core',
    journey: [
      {
        stage: 'SOURCE',
        description: 'Company reports Scope 3 categories 1-15 per GHG Protocol Corporate Value Chain standard; coverage varies widely',
        datapoint: 'Scope 3 total + category breakdown (often incomplete: avg company reports 6 of 15 categories)',
        source: 'CDP (C6.5) / PCAF Data / ISS / MSCI estimated Scope 3',
        format: 'CSV / JSON / modeled estimates',
        frequency: 'Annual (lag 6-12 months); estimated models updated quarterly',
        quality: 'DQS 2-3 for reported; DQS 4-5 for modeled/estimated',
        example: { company: 'Apple Inc', scope3_total: 23_100_000, categories_reported: 8, year: 2023 },
      },
      {
        stage: 'INGESTION',
        description: 'Category-level Scope 3 ingested with coverage flags',
        dbTable: 'staging.raw_scope3_import',
        dbColumns: ['source_id', 'company_ref', 'scope3_category', 'value_tco2e', 'method', 'coverage_pct', 'reporting_period'],
        validation: 'Category mapping to GHG Protocol 1-15; estimated vs reported flag',
        example: { row: { scope3_category: 'Cat_11_Use_of_Sold_Products', value_tco2e: 15200000, method: 'reported' } },
      },
      {
        stage: 'VALIDATION',
        description: 'Cross-validate total vs sum of categories; check for materiality gaps; compare reported vs third-party estimates',
        checks: [
          'Sum check: ensure S3 total >= sum of reported categories',
          'Materiality gaps: flag if Cat 11 (Use of Sold Products) missing for Energy/Autos',
          'Model comparison: reported vs ISS/MSCI estimates within 40% tolerance',
          'Double counting: check for Scope 3 Cat 1 overlap with supplier Scope 1',
        ],
        dbTable: 'staging.validated_scope3',
        qualityScore: 'DQS weighted by category: reported categories DQS 2-3, estimated DQS 4-5',
        example: { status: 'WARN', flags: ['MISSING_CAT11', 'ESTIMATE_DEVIATION_48%'], dqs: 4 },
      },
      {
        stage: 'TRANSFORMATION',
        description: 'Gap-filled Scope 3 stored: reported categories prioritized, remaining estimated via EEIO model',
        dbTable: 'company_emissions',
        dbColumns: ['company_profile_id', 'reporting_year', 'scope3_tco2e', 'scope3_categories_json', 'scope3_reported_pct', 'scope3_estimation_method'],
        transformation: 'Hybrid approach: use company-reported where available, fill gaps with EEIO or sector-average',
        example: { scope3_tco2e: 23100000, scope3_reported_pct: 72, estimation_method: 'hybrid_eeio_fill' },
      },
      {
        stage: 'ENRICHMENT',
        description: 'Supply chain hotspot analysis, category concentration, upstream/downstream split',
        derivedMetrics: [
          { name: 'Upstream vs Downstream', formula: 'sum(Cat 1-8) / sum(Cat 9-15)', example: '35% upstream / 65% downstream' },
          { name: 'Supply Chain Hotspot', formula: 'max(category / total)', example: 'Cat 11 = 66% of total S3' },
          { name: 'Coverage Score', formula: 'categories_reported / material_categories', example: '8/12 = 67%' },
        ],
        dbTable: 'analytics.scope3_enriched',
      },
      {
        stage: 'AGGREGATION',
        description: 'Portfolio Scope 3 with double-counting adjustment between investee companies',
        methodology: 'PCAF v2 Scope 3 guidance + double-counting removal (intercompany netting)',
        formula: 'Financed S3 = sum(attribution_factor_i * scope3_i) - double_count_adj',
        example: { raw_financed_s3: 1_250_000, double_count_adj: 87_000, net_financed_s3: 1_163_000 },
        dbTable: 'analytics.pcaf_attribution',
        consumers: ['pcaf-financed-emissions', 'supply-chain-esg', 'transition-planning-hub'],
      },
      {
        stage: 'INTERPRETATION',
        description: 'Scope 3 interpreted with emphasis on data quality limitations and sectoral materiality',
        interpretations: [
          { context: 'materiality', value: 'S3 is 85% of total for Financials -> portfolio impact dominated by value chain' },
          { context: 'data quality', value: 'Only 38% of portfolio S3 based on reported data (DQS 1-3)' },
          { context: 'target alignment', value: 'SBTi net-zero requires S3 coverage if >40% of total -> 89% of portfolio exposed' },
        ],
      },
      {
        stage: 'PRESENTATION',
        description: 'Category-level breakdown in dedicated Scope 3 analysis views',
        presentations: [
          { module: 'pcaf-financed-emissions', tab: 'Scope 3 Deep Dive', viz: 'Treemap by category', value: '1.16M tCO2e net' },
          { module: 'supply-chain-esg', tab: 'Carbon Hotspots', viz: 'Sankey flow: upstream->company->downstream', value: 'Category flow' },
          { module: 'disclosure-hub', tab: 'CSRD E1.6', viz: 'Category table with data quality flags', value: 'Full breakdown' },
        ],
      },
      {
        stage: 'ACTION',
        description: 'Scope 3 actions focus on data improvement and engagement',
        actions: [
          { trigger: 'DQS 5 for >50% of portfolio S3', action: 'CDP Non-Disclosure campaign targeting', module: 'pcaf-financed-emissions', tab: 'DQS Improvement Wizard' },
          { trigger: 'Cat 11 material but missing', action: 'Product lifecycle engagement with company', module: 'transition-planning-hub' },
          { trigger: 'S3 > 10x S1+S2', action: 'Value chain decarbonization assessment needed', module: 'corporate-decarbonisation' },
        ],
      },
    ],
  },

  // -- MJ004: Carbon Intensity --
  {
    id: 'MJ004',
    metric: 'Carbon Intensity (Revenue-Based)',
    unit: 'tCO2e/$M Revenue',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Combines company emissions (S1+S2) with financial data (revenue)', source: 'Emissions: CDP/Bloomberg | Financials: Bloomberg/Refinitiv', frequency: 'Annual; financials quarterly', quality: 'Compound DQS: emission quality * financial data timeliness', example: { company: 'TotalEnergies', emissions: 38_700_000, revenue_usd_m: 218_000, intensity: 177.5 } },
      { stage: 'INGESTION', description: 'Emissions and financial data joined on company_profile_id in staging', dbTable: 'staging.intensity_staging', dbColumns: ['company_profile_id', 'scope1_tco2e', 'scope2_tco2e', 'revenue_usd_m', 'reporting_year'], validation: 'Temporal alignment check: emissions year must match financial year', example: { row: { emissions: 38700000, revenue_usd_m: 218000 } } },
      { stage: 'VALIDATION', description: 'Revenue currency conversion to USD, inflation adjustment, emissions-revenue year match', checks: ['FX conversion at annual average rate (IMF WEO)', 'Revenue > 0 check (exclude pre-revenue companies)', 'Flag if intensity implies unreasonable emission factor'], dbTable: 'staging.validated_intensity', qualityScore: 'Composite: max(emission_dqs, financial_dqs)', example: { status: 'PASS', intensity: 177.5, unit: 'tCO2e/$M' } },
      { stage: 'TRANSFORMATION', description: 'Stored as derived column on company_emissions table', dbTable: 'company_emissions', transformation: 'carbon_intensity = (scope1 + scope2_location) / revenue_usd_m', example: { company_profile_id: 42, carbon_intensity: 177.5 } },
      { stage: 'ENRICHMENT', description: 'Sector rank, benchmark distance, intensity trajectory extrapolation', derivedMetrics: [{ name: 'Sector Percentile', formula: 'rank within GICS sector', example: 'P72 in Energy' }, { name: 'vs Paris Pathway', formula: 'intensity - IEA NZE sector target', example: '177.5 - 95 = +82.5 tCO2e/$M above pathway' }], dbTable: 'analytics.intensity_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio WACI = sum(weight_i * intensity_i)', methodology: 'TCFD recommended: Weighted Average Carbon Intensity', formula: 'WACI = sum(portfolio_weight * carbon_intensity)', example: { portfolio_waci: 245.3, unit: 'tCO2e/$M', benchmark_waci: 180.0 }, dbTable: 'analytics.waci_portfolio', consumers: ['pcaf-financed-emissions', 'climate-banking-hub', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'WACI vs benchmark, sector contribution, decarbonization pace', interpretations: [{ context: 'vs benchmark', value: 'Portfolio WACI 245 vs MSCI ACWI 180 -> 36% above' }, { context: 'decomposition', value: 'Energy sector contributes 68% of total WACI despite 12% weight' }] },
      { stage: 'PRESENTATION', description: 'WACI displayed as headline metric on climate dashboards', presentations: [{ module: 'pcaf-financed-emissions', tab: 'Portfolio Summary', viz: 'KPI card with benchmark comparison bar', value: '245.3 tCO2e/$M' }, { module: 'climate-banking-hub', tab: 'Executive Dashboard', viz: 'Trend line (5yr)', value: 'WACI trajectory' }] },
      { stage: 'ACTION', description: 'WACI above target triggers portfolio rebalancing review', actions: [{ trigger: 'WACI > benchmark + 30%', action: 'Sector allocation review flagged for CIO', module: 'climate-banking-hub' }, { trigger: 'WACI trend increasing', action: 'Quarterly stewardship escalation', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ005: Financed Emissions --
  {
    id: 'MJ005',
    metric: 'Financed Emissions (PCAF)',
    unit: 'tCO2e',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Combines portfolio holdings data with company emissions and EVIC/balance sheet', source: 'Holdings: Internal PMS | Emissions: CDP/Bloomberg | EVIC: Bloomberg/S&P', frequency: 'Quarterly recalculation', quality: 'DQS 1-5 per holding; portfolio-weighted DQS', example: { holdings_count: 450, asset_classes: ['Listed Equity', 'Corporate Bond', 'Sovereign'] } },
      { stage: 'INGESTION', description: 'Portfolio positions joined with emission and financial data per PCAF asset class rules', dbTable: 'staging.pcaf_staging', dbColumns: ['portfolio_id', 'holding_id', 'isin', 'outstanding_amount', 'asset_class', 'scope1_tco2e', 'scope2_tco2e', 'evic', 'total_debt_equity'], validation: 'Asset class mapping, EVIC availability check', example: { row: { isin: 'GB00BP6MXD84', outstanding: 5_000_000, evic: 210_000_000_000 } } },
      { stage: 'VALIDATION', description: 'Attribution factor reasonableness, asset class consistency, EVIC timeliness', checks: ['Attribution factor < 1.0', 'EVIC date within 18 months', 'Outstanding < total portfolio AUM', 'Asset class classification per PCAF v2 rules'], dbTable: 'staging.validated_pcaf', qualityScore: 'Portfolio weighted DQS', example: { status: 'PASS', avg_dqs: 2.7, coverage: '94%' } },
      { stage: 'TRANSFORMATION', description: 'PCAF attribution per asset class stored in production analytics', dbTable: 'analytics.pcaf_attribution', transformation: 'Listed Equity: outstanding/EVIC | Corp Bond: outstanding/total_debt_equity | Sovereign: GDP-based', example: { portfolio_id: 1, total_financed_s1s2: 305_290_000, unit: 'tCO2e' } },
      { stage: 'ENRICHMENT', description: 'DQS distribution, asset class decomposition, year-on-year change attribution', derivedMetrics: [{ name: 'DQS Distribution', formula: 'histogram of holding-level DQS', example: 'DQS1: 35%, DQS2: 28%, DQS3: 22%, DQS4: 10%, DQS5: 5%' }, { name: 'Attribution Decomposition', formula: 'change = portfolio_effect + emission_effect + interaction', example: 'Total -8%: portfolio rebalancing -3%, company reduction -6%, interaction +1%' }], dbTable: 'analytics.pcaf_enriched' },
      { stage: 'AGGREGATION', description: 'Roll up across portfolios, asset classes, sectors, and time', methodology: 'PCAF Standard v2 multi-asset aggregation', formula: 'Firm-wide = sum across all portfolios and asset classes', example: { firm_total: 12_400_000_000, unit: 'tCO2e', portfolios: 24 }, dbTable: 'analytics.pcaf_firm_aggregate', consumers: ['pcaf-financed-emissions', 'climate-banking-hub', 'disclosure-hub', 'net-zero-tracker'] },
      { stage: 'INTERPRETATION', description: 'Financed emissions vs NZAM targets, regulatory thresholds, peer benchmarks', interpretations: [{ context: 'vs NZAM', value: '305M tCO2e vs 2025 interim target 280M -> 9% above glidepath' }, { context: 'data quality', value: 'Weighted DQS 2.7 -> meets PCAF minimum but improvement needed for DQS4-5 segment' }] },
      { stage: 'PRESENTATION', description: 'Primary metric on PCAF module; feeds into all climate reporting modules', presentations: [{ module: 'pcaf-financed-emissions', tab: 'Portfolio Builder', viz: 'KPI card + asset class waterfall + DQS heatmap', value: '305.29M tCO2e' }, { module: 'climate-banking-hub', tab: 'NZAM Tracker', viz: 'Glidepath chart (actual vs target)', value: 'Progress bar' }, { module: 'disclosure-hub', tab: 'SFDR PAI', viz: 'Auto-populated PAI 1 field', value: '305.29M tCO2e' }] },
      { stage: 'ACTION', description: 'Primary trigger for net-zero action plans and regulatory filings', actions: [{ trigger: 'Above NZAM glidepath', action: 'Sector deep-dive and top-10 emitter engagement plan', module: 'transition-planning-hub' }, { trigger: 'DQS5 holdings > 10%', action: 'Data quality improvement campaign', module: 'pcaf-financed-emissions', tab: 'DQS Improvement Wizard' }] },
    ],
  },

  // -- MJ006: Portfolio Temperature Score --
  {
    id: 'MJ006',
    metric: 'Portfolio Temperature Score',
    unit: 'deg C',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Company-level targets from SBTi database + base year emissions + target year/ambition', source: 'SBTi Target Dashboard / CDP / Company Net Zero Plans', frequency: 'Quarterly SBTi updates; annual CDP', quality: 'Binary: SBTi-validated vs self-declared; target type (near/long-term)', example: { company: 'Unilever', target: 'SBTi 1.5C near-term', base_year: 2019, target_year: 2030, reduction: '-50%' } },
      { stage: 'INGESTION', description: 'SBTi targets linked to company profile; implicit temperature derived from target ambition', dbTable: 'staging.sbti_targets_import', dbColumns: ['company_profile_id', 'target_type', 'base_year', 'target_year', 'reduction_pct', 'sbti_status', 'scope_coverage'], validation: 'SBTi status validation (committed/approved/validated)', example: { row: { sbti_status: 'validated', implied_temp: 1.65 } } },
      { stage: 'VALIDATION', description: 'Target credibility check, pathway consistency, scope coverage adequacy', checks: ['Target covers >95% of Scope 1+2', 'Linear pathway implies reasonable annual reduction rate', 'Base year emissions verified', 'Target year within SBTi maximum horizon'], dbTable: 'staging.validated_temperature', qualityScore: 'High (SBTi validated) / Medium (committed) / Low (self-declared)', example: { status: 'PASS', credibility: 'High', implied_temp: 1.65 } },
      { stage: 'TRANSFORMATION', description: 'Company-level implied temperature stored and projected forward', dbTable: 'analytics.company_temperature', transformation: 'PACTA methodology: regress target trajectory onto sector decarbonization pathway, derive implied temperature', example: { company_profile_id: 88, implied_temp: 1.65, methodology: 'PACTA_SBTi' } },
      { stage: 'ENRICHMENT', description: 'Company temperature vs sector pathway, overshoot assessment, credibility score', derivedMetrics: [{ name: 'Pathway Gap', formula: 'implied_temp - sector_1.5C_pathway', example: '1.65 - 1.50 = +0.15C above 1.5C pathway' }, { name: 'Credibility Score', formula: 'weighted(target_ambition, track_record, capex_alignment)', example: '72/100' }], dbTable: 'analytics.temperature_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio temperature = ownership-weighted average of company temperatures', methodology: 'SBTi Portfolio Temperature Rating / TCFD recommended metric', formula: 'Portfolio Temp = sum(weight_i * company_temp_i) for S1+S2; separate for S3', example: { portfolio_temp: 2.4, unit: 'deg C', s1s2: 2.1, s3: 2.8 }, dbTable: 'analytics.portfolio_temperature', consumers: ['portfolio-temperature-score', 'sbti-dashboard', 'net-zero-tracker'] },
      { stage: 'INTERPRETATION', description: 'Temperature contextualized vs Paris Agreement goals', interpretations: [{ context: 'vs Paris', value: '2.4C -> between well-below 2C and 2C scenarios' }, { context: 'sector hot spots', value: 'Energy at 3.1C pulls portfolio 0.4C higher' }, { context: 'target coverage', value: '62% of portfolio has SBTi targets (by weight)' }] },
      { stage: 'PRESENTATION', description: 'Temperature thermometer visualization and sector heatmap', presentations: [{ module: 'portfolio-temperature-score', tab: 'Temperature Dashboard', viz: 'Thermometer gauge + sector heatmap', value: '2.4 deg C' }, { module: 'sbti-dashboard', tab: 'Alignment Overview', viz: 'Target coverage pie + temperature trend', value: '62% coverage' }, { module: 'net-zero-tracker', tab: 'Progress', viz: 'Glidepath with temperature overlay', value: 'Trajectory chart' }] },
      { stage: 'ACTION', description: 'Temperature misalignment triggers engagement and rebalancing', actions: [{ trigger: 'Portfolio > 2.0C', action: 'Identify top 20 contributors and initiate CA100+ engagement', module: 'transition-planning-hub' }, { trigger: 'Company > 3.5C, weight > 1%', action: 'Escalation to IC for position review', module: 'portfolio-temperature-score' }] },
    ],
  },

  // -- MJ007: Climate VaR --
  {
    id: 'MJ007',
    metric: 'Climate Value-at-Risk (CVaR)',
    unit: '% portfolio value',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'NGFS climate scenarios (Orderly/Disorderly/Hot House) + company carbon intensity + asset location data', source: 'NGFS Phase IV / IPCC SSP scenarios / Company locations from asset register', frequency: 'Scenario updates: biennial; company data: annual; recalculated quarterly', quality: 'Model uncertainty: scenario x model x parameter', example: { scenarios: ['Net Zero 2050', 'Delayed Transition', 'Current Policies'], horizons: [2030, 2040, 2050] } },
      { stage: 'INGESTION', description: 'Scenario parameters, company exposures, and physical hazard data loaded', dbTable: 'staging.climate_var_inputs', dbColumns: ['scenario_id', 'company_profile_id', 'carbon_price_path', 'physical_hazard_scores', 'revenue_at_risk_pct'], validation: 'Scenario completeness and version check', example: { row: { scenario: 'Net_Zero_2050', carbon_price_2030: 130, unit: 'USD/tCO2' } } },
      { stage: 'VALIDATION', description: 'Scenario parameter bounds, physical hazard consistency, carbon price path monotonicity', checks: ['Carbon price path non-decreasing for transition scenarios', 'Physical hazard scores within historical calibration bounds', 'Company coverage > 85% of portfolio by weight'], dbTable: 'staging.validated_climate_var', qualityScore: 'Model confidence: high (listed equity) / medium (fixed income) / low (alternatives)', example: { status: 'PASS', coverage: '92%' } },
      { stage: 'TRANSFORMATION', description: 'Delta-normal CVaR computation per scenario and time horizon', dbTable: 'analytics.climate_var', transformation: 'Transition CVaR: carbon_price * emission_intensity * margin_sensitivity; Physical CVaR: expected_loss from hazard exposure', example: { scenario: 'Delayed_Transition', cvar_2030: -0.08, cvar_2050: -0.22 } },
      { stage: 'ENRICHMENT', description: 'Scenario spread, sector decomposition, physical vs transition split', derivedMetrics: [{ name: 'Scenario Spread', formula: 'max(CVaR) - min(CVaR) across scenarios', example: 'Spread: -6% to -22% = 16pp range' }, { name: 'Physical/Transition Split', formula: 'physical_cvar / total_cvar', example: '35% physical / 65% transition' }], dbTable: 'analytics.climate_var_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio-level CVaR aggregated with diversification benefit', methodology: 'Scenario-conditioned CVaR with copula-based diversification', formula: 'Portfolio CVaR = sum(holding_cvar) * (1 - diversification_benefit)', example: { portfolio_cvar: -0.12, diversification_benefit: 0.15 }, dbTable: 'analytics.portfolio_climate_var', consumers: ['portfolio-climate-var', 'climate-physical-risk', 'climate-transition-risk'] },
      { stage: 'INTERPRETATION', description: 'CVaR interpreted across scenarios for board-level risk appetite', interpretations: [{ context: 'orderly', value: '-6% CVaR in Orderly: manageable with existing hedges' }, { context: 'disorderly', value: '-18% CVaR in Delayed Transition: material capital impairment risk' }, { context: 'physical', value: '-4.2% from physical hazards by 2050 under Hot House' }] },
      { stage: 'PRESENTATION', description: 'Scenario fan chart with clickable drill-down to sector/holding level', presentations: [{ module: 'portfolio-climate-var', tab: 'Scenario Analysis', viz: 'Fan chart (3 scenarios x 3 horizons)', value: '-6% to -22%' }, { module: 'climate-physical-risk', tab: 'Physical VaR', viz: 'Map overlay with facility-level exposure', value: '-4.2% physical' }, { module: 'climate-transition-risk', tab: 'Transition VaR', viz: 'Carbon price sensitivity waterfall', value: '-14% transition' }] },
      { stage: 'ACTION', description: 'CVaR breaches risk appetite trigger hedging or divestment review', actions: [{ trigger: 'Disorderly CVaR > -15%', action: 'Board risk committee escalation with hedging proposal', module: 'portfolio-climate-var' }, { trigger: 'Physical CVaR concentrated in <5 holdings', action: 'Geographic diversification assessment', module: 'climate-physical-risk' }] },
    ],
  },

  // -- MJ008: EU Taxonomy Green Asset Ratio --
  {
    id: 'MJ008',
    metric: 'EU Taxonomy Green Asset Ratio (GAR)',
    unit: '%',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Company-reported EU Taxonomy eligibility and alignment data per 6 environmental objectives', source: 'Company NFRD/CSRD reports / Bloomberg EU Taxonomy data / ISS ESG', frequency: 'Annual (mandatory from FY2024 for large companies)', quality: 'Self-reported; third-party verification emerging', example: { company: 'Siemens AG', taxonomy_eligible: 62, taxonomy_aligned: 38, unit: '%' } },
      { stage: 'INGESTION', description: 'Taxonomy KPIs (turnover, capex, opex alignment) ingested per objective', dbTable: 'staging.raw_taxonomy_import', dbColumns: ['company_ref', 'objective', 'turnover_eligible_pct', 'turnover_aligned_pct', 'capex_aligned_pct', 'dnsh_pass', 'minimum_safeguards'], validation: 'Schema mapping to EU Taxonomy Regulation Art. 8 template', example: { row: { company: 'Siemens', objective: 'climate_mitigation', turnover_aligned_pct: 38 } } },
      { stage: 'VALIDATION', description: 'DNSH criteria verification, minimum safeguards compliance, double counting across objectives', checks: ['Aligned <= Eligible (mathematical constraint)', 'DNSH evidence for each substantial contribution claim', 'No double counting across 6 objectives', 'Minimum safeguards: OECD Guidelines + UN Guiding Principles'], dbTable: 'staging.validated_taxonomy', qualityScore: 'High if CSRD-reported + assured; Low if estimated', example: { status: 'PASS', flags: ['DNSH_PARTIAL'] } },
      { stage: 'TRANSFORMATION', description: 'Company-level taxonomy data linked to holdings, aggregated using weighting approach', dbTable: 'analytics.taxonomy_alignment', transformation: 'Weighted by portfolio exposure: GAR = sum(weight * aligned_pct) for eligible exposures', example: { portfolio_gar: 24.5, eligible_pct: 58.0 } },
      { stage: 'ENRICHMENT', description: 'Objective decomposition, capex vs turnover comparison, transition potential', derivedMetrics: [{ name: 'Transition Capex Ratio', formula: 'capex_aligned / turnover_aligned', example: '1.8x -> forward-looking investment in green' }, { name: 'Objective Breakdown', formula: 'per-objective aligned %', example: 'Mitigation: 28%, Adaptation: 4%, Water: 2%' }], dbTable: 'analytics.taxonomy_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio-level GAR per EBA ITS template requirements', methodology: 'EBA ITS on Pillar 3 ESG: GAR calculated per asset class with exposure weights', formula: 'GAR = sum(taxonomy_aligned_exposure) / sum(total_covered_exposure)', example: { portfolio_gar: 24.5, covered_exposure: 8_200_000_000 }, dbTable: 'analytics.gar_portfolio', consumers: ['eu-taxonomy-dashboard', 'disclosure-hub', 'green-bond-manager'] },
      { stage: 'INTERPRETATION', description: 'GAR vs peer average, regulatory minimum expectations, trend trajectory', interpretations: [{ context: 'vs peers', value: 'GAR 24.5% vs European AM average 18% -> above peer median' }, { context: 'regulatory', value: 'No minimum GAR required, but SFDR Art. 9 funds expected > 50%' }, { context: 'trend', value: 'GAR increased from 16% to 24.5% in 2 years driven by energy transition capex' }] },
      { stage: 'PRESENTATION', description: 'EU Taxonomy dashboard with objective sunburst and fund-level comparison', presentations: [{ module: 'eu-taxonomy-dashboard', tab: 'GAR Overview', viz: 'Sunburst by objective + KPI toggle (turnover/capex/opex)', value: '24.5%' }, { module: 'disclosure-hub', tab: 'EBA Pillar 3', viz: 'EBA template auto-fill', value: '24.5% GAR' }, { module: 'sfdr-reporting', tab: 'Art. 8/9 Compliance', viz: 'Fund comparison bar chart', value: 'Per-fund GAR' }] },
      { stage: 'ACTION', description: 'Low GAR triggers green investment pipeline review', actions: [{ trigger: 'Art. 9 fund GAR < 50%', action: 'Compliance alert: may not meet Art. 9 investor expectations', module: 'sfdr-reporting' }, { trigger: 'Capex aligned >> Turnover aligned', action: 'Positive signal: company investing in transition', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ009: ESG Consensus Score --
  {
    id: 'MJ009',
    metric: 'ESG Consensus Score',
    unit: '0-100 scale',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Raw ESG ratings from 6+ providers with different scales, methodologies, and coverage', source: 'MSCI ESG (AAA-CCC) / Sustainalytics (0-50 risk) / ISS QualityScore (1-10) / Refinitiv (0-100) / S&P CSA (0-100) / Bloomberg ESG (0-100)', frequency: 'Monthly to quarterly depending on provider', quality: 'Provider-dependent; known divergence problem (correlation ~0.54 across providers)', example: { company: 'JPMorgan', msci: 'A', sustainalytics: 24.5, iss: 4, refinitiv: 68, sp_csa: 71 } },
      { stage: 'INGESTION', description: 'Multi-provider ratings ingested with scale metadata for normalization', dbTable: 'staging.raw_esg_ratings', dbColumns: ['company_ref', 'provider', 'rating_raw', 'scale_type', 'pillar_e', 'pillar_s', 'pillar_g', 'last_update'], validation: 'Provider API validation, staleness check, coverage mapping', example: { row: { provider: 'MSCI', rating_raw: 'A', scale: 'AAA-CCC', date: '2023-11-15' } } },
      { stage: 'VALIDATION', description: 'Normalize all scales to 0-100, detect provider reversals, flag significant divergence', checks: ['Scale normalization: MSCI letter->numeric, Sustainalytics inverse (lower=better)', 'Provider divergence: flag if spread > 2 standard deviations', 'Staleness: flag ratings > 12 months old', 'Revision detection: track upgrades/downgrades'], dbTable: 'staging.validated_esg_ratings', qualityScore: 'Coverage count: number of providers covering company', example: { status: 'PASS', normalized: { msci: 71, sustainalytics: 62, iss: 60, refinitiv: 68, sp_csa: 71 } } },
      { stage: 'TRANSFORMATION', description: 'Consensus score computed using trimmed mean of normalized ratings', dbTable: 'analytics.esg_consensus', transformation: 'Trimmed mean (drop highest/lowest) of normalized 0-100 scores; pillar-level sub-scores', example: { company_profile_id: 88, consensus_score: 66.5, e_pillar: 72, s_pillar: 61, g_pillar: 68 } },
      { stage: 'ENRICHMENT', description: 'Divergence index, momentum signal, sector rank, controversy overlay', derivedMetrics: [{ name: 'Divergence Index', formula: 'stdev of normalized provider scores', example: 'DI = 4.8 (low divergence)' }, { name: 'Momentum', formula: '6-month change in consensus', example: '+3.2 points (positive momentum)' }, { name: 'Sector Rank', formula: 'percentile within GICS sector', example: 'P68 in Financials' }], dbTable: 'analytics.esg_consensus_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio weighted ESG score and pillar decomposition', methodology: 'Weight-averaged consensus with adjustable provider weighting', formula: 'Portfolio ESG = sum(weight_i * consensus_score_i)', example: { portfolio_esg: 64.2, e: 68, s: 59, g: 66 }, dbTable: 'analytics.portfolio_esg', consumers: ['esg-ratings-hub', 'portfolio-suite', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Consensus score contextualized vs benchmark and investment universe', interpretations: [{ context: 'vs benchmark', value: 'Portfolio ESG 64.2 vs MSCI World 61.8 -> slight overweight to ESG leaders' }, { context: 'divergence', value: '12% of holdings have high divergence (DI > 15) -> manual review needed' }] },
      { stage: 'PRESENTATION', description: 'Multi-provider radar chart with consensus overlay', presentations: [{ module: 'esg-ratings-hub', tab: 'Consensus View', viz: 'Radar chart (6 providers) with consensus line', value: '66.5 consensus' }, { module: 'portfolio-suite', tab: 'ESG Summary', viz: 'Portfolio vs benchmark bar', value: '64.2 vs 61.8' }] },
      { stage: 'ACTION', description: 'Divergence and downgrade triggers', actions: [{ trigger: 'High divergence + negative momentum', action: 'Analyst deep-dive and engagement assessment', module: 'esg-ratings-hub', tab: 'Divergence Alert' }, { trigger: 'Consensus drops >10 pts', action: 'Automatic watchlist addition', module: 'esg-ratings-hub' }] },
    ],
  },

  // -- MJ010: Controversy Severity --
  {
    id: 'MJ010',
    metric: 'Controversy Severity Score',
    unit: '0-5 severity scale',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'ESG controversy events from multiple news and research providers', source: 'RepRisk / Sustainalytics Controversies / MSCI ESG Controversies / NLP news feeds', frequency: 'Daily (news) / Monthly (provider severity updates)', quality: 'NLP-sourced events may have false positives; provider-curated higher quality', example: { company: 'Meta Platforms', event: 'Data privacy class action lawsuit', severity: 4, date: '2024-01-15' } },
      { stage: 'INGESTION', description: 'Raw controversy events with NLP entity resolution and category tagging', dbTable: 'staging.raw_controversies', dbColumns: ['source_id', 'company_ref', 'headline', 'category', 'severity_raw', 'event_date', 'source_url'], validation: 'Entity disambiguation, duplicate event detection (same incident from multiple sources)', example: { row: { headline: 'Meta faces class action over AI data use', severity_raw: 4 } } },
      { stage: 'VALIDATION', description: 'De-duplication, severity calibration, resolution status tracking', checks: ['Cross-source de-duplication using NLP similarity > 0.85', 'Severity calibration against historical distribution', 'False positive review for NLP-sourced events', 'Resolution tracking: ongoing vs resolved vs escalated'], dbTable: 'staging.validated_controversies', qualityScore: 'Provider-sourced: High | NLP-only: Medium', example: { status: 'PASS', unique_events: 3, max_severity: 4 } },
      { stage: 'TRANSFORMATION', description: 'Company-level controversy severity score: max severity with decay function', dbTable: 'analytics.company_controversies', transformation: 'Severity = max(severity_i * decay(days_since_event, halflife=180)) across active events', example: { company_profile_id: 88, current_severity: 3.8, active_events: 3 } },
      { stage: 'ENRICHMENT', description: 'Category concentration, recurrence pattern, sector benchmark, PAI flags', derivedMetrics: [{ name: 'Category Concentration', formula: 'max_category_pct of events', example: 'Data Privacy: 67% of events' }, { name: 'Recurrence Flag', formula: 'same_category_events in 2yr window > 3', example: 'RECURRING: Privacy issues' }, { name: 'SFDR PAI Flag', formula: 'severity >= 3 and UNGC violation', example: 'PAI 10/11 triggered' }], dbTable: 'analytics.controversies_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio controversy exposure: weighted count and max severity', methodology: 'Portfolio-weighted severity + controversy count by category', formula: 'Portfolio Controversy = sum(weight_i * severity_i) / sum(weight_i * has_controversy_i)', example: { portfolio_severity: 2.1, holdings_with_controversies: 34, pct: '42%' }, dbTable: 'analytics.portfolio_controversies', consumers: ['esg-ratings-hub', 'greenwash-detector', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Severity contextualized for fiduciary and regulatory compliance', interpretations: [{ context: 'SFDR PAI', value: '8 holdings flagged for UNGC violations -> PAI 10 mandatory disclosure' }, { context: 'vs benchmark', value: 'Portfolio avg severity 2.1 vs benchmark 1.8 -> slightly higher exposure' }] },
      { stage: 'PRESENTATION', description: 'Timeline visualization with severity heatmap and drill-down', presentations: [{ module: 'esg-ratings-hub', tab: 'Controversy Feed', viz: 'Event timeline + severity heatmap', value: 'Active: 34 companies' }, { module: 'greenwash-detector', tab: 'Red Flags', viz: 'Controversy + claims matrix', value: 'Greenwash risk flag' }, { module: 'disclosure-hub', tab: 'SFDR PAI 10-14', viz: 'Auto-populated UNGC violation count', value: '8 holdings flagged' }] },
      { stage: 'ACTION', description: 'Severity >= 4 triggers immediate review and potential exclusion', actions: [{ trigger: 'Severity 5 (Very Severe)', action: 'Immediate IC escalation, potential exclusion review', module: 'esg-ratings-hub' }, { trigger: 'Recurring Category', action: 'Focused engagement on systemic issue', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ011: TPT Readiness Score --
  {
    id: 'MJ011',
    metric: 'Transition Plan Taskforce (TPT) Readiness',
    unit: '0-100 score',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Assessment of company transition plan against TPT Disclosure Framework elements', source: 'Company transition plans / CDP SBTi target data / ACT assessment / Capex disclosures', frequency: 'Annual assessment', quality: 'Qualitative scoring with quantitative anchors', example: { company: 'BP plc', tpt_elements_scored: 14, overall: 58, year: 2024 } },
      { stage: 'INGESTION', description: 'Element-level scores ingested for 5 TPT pillars', dbTable: 'staging.raw_tpt_assessment', dbColumns: ['company_ref', 'pillar', 'element', 'score_0_100', 'evidence_summary', 'assessment_date'], validation: 'Pillar completeness and score range check', example: { row: { pillar: 'Ambition', element: 'Net Zero Target', score: 72 } } },
      { stage: 'VALIDATION', description: 'Evidence quality, internal consistency of pillar scores, comparability normalization', checks: ['Each element backed by documentary evidence', 'Pillar scores internally consistent (ambition vs action)', 'Cross-company calibration for comparability'], dbTable: 'staging.validated_tpt', qualityScore: 'Assessment depth: Full (14 elements) vs Partial (5 pillars only)', example: { status: 'PASS', assessed_elements: 14, overall: 58 } },
      { stage: 'TRANSFORMATION', description: 'Normalized TPT score stored with pillar decomposition', dbTable: 'analytics.company_tpt', transformation: 'Weighted pillar aggregation: Ambition 25%, Action 30%, Accountability 20%, Governance 15%, Engagement 10%', example: { company_profile_id: 42, tpt_score: 58, ambition: 72, action: 45, accountability: 62, governance: 55, engagement: 48 } },
      { stage: 'ENRICHMENT', description: 'Credibility score overlay, sector benchmark, improvement velocity', derivedMetrics: [{ name: 'Credibility Score', formula: 'action_score / ambition_score', example: '45/72 = 0.63 -> moderate say-do gap' }, { name: 'Sector Rank', formula: 'percentile within sector', example: 'P55 in Energy (above median)' }], dbTable: 'analytics.tpt_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio TPT readiness and credibility distribution', methodology: 'Weight-averaged TPT score with credibility overlay', formula: 'Portfolio TPT = sum(weight * tpt_score); Credibility = sum(weight * credibility)', example: { portfolio_tpt: 52.3, credibility: 0.68, high_ambition_low_action: '18% of portfolio' }, dbTable: 'analytics.portfolio_tpt', consumers: ['transition-planning-hub', 'sbti-dashboard', 'corporate-decarbonisation'] },
      { stage: 'INTERPRETATION', description: 'TPT readiness vs regulatory expectations and peer benchmark', interpretations: [{ context: 'regulatory', value: 'FCA PS23/16 requires transition plan disclosure -> 42% of UK holdings have TPT-aligned plans' }, { context: 'credibility gap', value: '18% of portfolio high ambition, low action -> engagement priority' }] },
      { stage: 'PRESENTATION', description: 'TPT spider chart and pillar comparison across portfolio', presentations: [{ module: 'transition-planning-hub', tab: 'TPT Assessment', viz: 'Spider chart (5 pillars) + sector comparison', value: '52.3 portfolio readiness' }, { module: 'corporate-decarbonisation', tab: 'Credibility Dashboard', viz: 'Scatter: ambition vs action', value: 'Credibility gap view' }] },
      { stage: 'ACTION', description: 'Low readiness or credibility gap triggers engagement', actions: [{ trigger: 'TPT < 40 for top-10 holding', action: 'Formal engagement letter requesting transition plan', module: 'transition-planning-hub' }, { trigger: 'Credibility < 0.5', action: 'Vote against climate resolution at AGM', module: 'transition-planning-hub', tab: 'Voting Pipeline' }] },
    ],
  },

  // -- MJ012: Avoided Emissions --
  {
    id: 'MJ012',
    metric: 'Avoided Emissions (Scope 4)',
    unit: 'tCO2e avoided',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Company-reported product-level avoided emissions using WRI guidance or proprietary methodology', source: 'Company sustainability reports / ICMA avoided emissions database / Climate bonds taxonomy', frequency: 'Annual', quality: 'Low standardization; methodology varies; no mandatory assurance', example: { company: 'Vestas', avoided: 175_000_000, methodology: 'Grid displacement factor', year: 2023 } },
      { stage: 'INGESTION', description: 'Raw avoided emissions claims with methodology classification', dbTable: 'staging.raw_avoided_emissions', dbColumns: ['company_ref', 'product_category', 'avoided_tco2e', 'methodology_type', 'baseline_scenario', 'reporting_year'], validation: 'Methodology classification: displacement / substitution / enabling', example: { row: { product: 'wind_turbines', avoided: 175000000, methodology: 'displacement' } } },
      { stage: 'VALIDATION', description: 'Baseline scenario reasonableness, additionality check, double counting prevention', checks: ['Baseline scenario is reasonable (not extreme)', 'Additionality: would emissions have been avoided anyway?', 'Product-level attribution (not company-wide claim)', 'No double counting with customer Scope 2 reductions'], dbTable: 'staging.validated_avoided', qualityScore: 'High: third-party verified methodology | Low: unsubstantiated claims', example: { status: 'WARN', flags: ['BASELINE_AGGRESSIVE'] } },
      { stage: 'TRANSFORMATION', description: 'Avoided emissions stored with credibility classification', dbTable: 'analytics.avoided_emissions', transformation: 'Credibility tier: Tier 1 (verified, conservative baseline), Tier 2 (reasonable), Tier 3 (aggressive/unverified)', example: { avoided_tco2e: 175000000, credibility_tier: 1 } },
      { stage: 'ENRICHMENT', description: 'Enablement ratio, net climate contribution, portfolio-level impact', derivedMetrics: [{ name: 'Enablement Ratio', formula: 'avoided / (S1+S2+S3)', example: '175M / 1.2M = 146x enablement' }, { name: 'Net Climate Contribution', formula: 'avoided - total_emissions', example: '175M - 1.2M = +173.8M net positive' }], dbTable: 'analytics.avoided_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio avoided emissions: PCAF-attributed share of company avoided emissions', methodology: 'PCAF attribution applied to avoided emissions (same factor as financed)', formula: 'Financed Avoided = attribution_factor * avoided_tco2e', example: { portfolio_avoided: 12_400_000, credibility_weighted: 9_200_000 }, dbTable: 'analytics.portfolio_avoided', consumers: ['corporate-decarbonisation', 'green-bond-manager', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Avoided vs financed emissions: net contribution assessment', interpretations: [{ context: 'net impact', value: 'Financed avoided 9.2M vs financed actual 305M -> net still negative but improving' }, { context: 'solution companies', value: '12 holdings are net-positive climate contributors (avoided > emitted)' }] },
      { stage: 'PRESENTATION', description: 'Avoided emissions waterfall and net contribution chart', presentations: [{ module: 'corporate-decarbonisation', tab: 'Impact Dashboard', viz: 'Waterfall: emitted vs avoided, net bar', value: '12.4M tCO2e avoided' }, { module: 'green-bond-manager', tab: 'Impact Reporting', viz: 'Project-level avoided emissions', value: 'Per green bond impact' }] },
      { stage: 'ACTION', description: 'Avoided emissions claims validated before marketing as impact', actions: [{ trigger: 'Credibility Tier 3 used in marketing', action: 'Greenwash risk alert', module: 'greenwash-detector' }, { trigger: 'Net positive company identified', action: 'Impact investment opportunity flag', module: 'corporate-decarbonisation' }] },
    ],
  },

  // -- MJ013: IMO CII Rating --
  {
    id: 'MJ013',
    metric: 'IMO Carbon Intensity Indicator (CII) Rating',
    unit: 'A-E rating',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Ship-level fuel consumption and distance data from IMO Data Collection System (DCS)', source: 'IMO DCS / Poseidon Principles Reporting / ClassNK / DNV Fleet Data', frequency: 'Annual (calendar year), operational data daily', quality: 'High for DCS-reported; estimated for non-reporting vessels', example: { vessel: 'Ever Given', imo_number: 9811000, cii_value: 8.12, rating: 'C', year: 2023 } },
      { stage: 'INGESTION', description: 'Vessel-level CII data with fleet linkage to shipping company', dbTable: 'staging.raw_cii_import', dbColumns: ['imo_number', 'vessel_name', 'ship_type', 'dwt', 'fuel_consumption_mt', 'distance_nm', 'reporting_year'], validation: 'IMO number validation, ship type classification', example: { row: { imo: 9811000, fuel_mt: 42000, distance_nm: 85000 } } },
      { stage: 'VALIDATION', description: 'Fuel-distance plausibility, ship type CII reference line, flag state consistency', checks: ['AER calculation: CO2 / (DWT * distance)', 'CII reference line by ship type and DWT', 'Rating boundary check (A-E thresholds per MEPC.354)', 'Fleet-level consistency'], dbTable: 'staging.validated_cii', qualityScore: 'DCS-reported: High | Estimated: Low', example: { status: 'PASS', aer: 8.12, rating: 'C', boundary: { a: 6.5, b: 7.8, c: 9.2, d: 10.5 } } },
      { stage: 'TRANSFORMATION', description: 'CII ratings stored per vessel, aggregated to fleet/company level', dbTable: 'analytics.vessel_cii', transformation: 'Vessel CII -> fleet average CII (DWT-weighted) -> company CII profile', example: { company: 'Maersk', fleet_avg_cii: 'B', vessels_d_or_e: 12, pct: '8%' } },
      { stage: 'ENRICHMENT', description: 'Fleet trajectory, regulatory risk (D/E vessels), retrofit potential', derivedMetrics: [{ name: 'D/E Vessel Risk', formula: 'count(rating in [D,E]) / total_fleet', example: '8% of fleet rated D or E -> regulatory risk' }, { name: 'CII Trajectory', formula: 'projected CII vs tightening reference lines', example: 'Fleet will hit D average by 2028 without intervention' }], dbTable: 'analytics.cii_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio shipping exposure weighted by fleet CII quality', methodology: 'Poseidon Principles alignment score methodology', formula: 'Portfolio CII = sum(exposure_i * fleet_cii_score_i) / total_shipping_exposure', example: { portfolio_cii: 'B+', shipping_exposure_usd: 2_400_000_000 }, dbTable: 'analytics.portfolio_shipping_cii', consumers: ['maritime-poseidon', 'climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'CII fleet rating vs IMO 2030/2050 targets', interpretations: [{ context: 'regulatory', value: '8% of financed fleet D/E rated -> corrective action plan required under MARPOL' }, { context: 'trajectory', value: 'Without fleet renewal, average hits D by 2028 -> stranded asset risk' }] },
      { stage: 'PRESENTATION', description: 'Fleet heatmap by CII rating and ship type', presentations: [{ module: 'maritime-poseidon', tab: 'CII Dashboard', viz: 'Fleet heatmap (ship type x rating) + trajectory chart', value: 'B+ fleet average' }, { module: 'climate-banking-hub', tab: 'Shipping Risk', viz: 'D/E exposure bar', value: '8% high-risk fleet' }] },
      { stage: 'ACTION', description: 'D/E vessels trigger covenant review and engagement', actions: [{ trigger: 'Fleet > 15% D/E vessels', action: 'Loan covenant trigger review', module: 'maritime-poseidon' }, { trigger: 'CII trajectory worsening', action: 'Engagement on fleet renewal / retrofit plan', module: 'maritime-poseidon', tab: 'Engagement' }] },
    ],
  },

  // -- MJ014: Biodiversity Footprint --
  {
    id: 'MJ014',
    metric: 'Biodiversity Footprint (MSA.km2)',
    unit: 'MSA.km2',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Company impact on biodiversity measured using Mean Species Abundance (MSA) loss methodology', source: 'CDC Biodiversite / ENCORE / TNFD LEAP data / IBAT (IUCN) / GLOBIO model', frequency: 'Annual model update; spatial data refreshed biannually', quality: 'Model-based estimates; high uncertainty; emerging methodology', example: { company: 'Glencore', msa_loss: 42.5, unit: 'MSA.km2', year: 2023, drivers: ['land_use', 'pollution', 'climate_change'] } },
      { stage: 'INGESTION', description: 'Modeled biodiversity impacts by pressure type and geographic location', dbTable: 'staging.raw_biodiversity_import', dbColumns: ['company_ref', 'pressure_type', 'msa_loss', 'location_lat', 'location_lon', 'ecosystem_type', 'model_version'], validation: 'Spatial validation, pressure type classification', example: { row: { pressure: 'land_use', msa_loss: 28.3, ecosystem: 'tropical_forest' } } },
      { stage: 'VALIDATION', description: 'Model output bounds check, ecosystem sensitivity weighting, double counting across pressures', checks: ['MSA loss within historical calibration bounds', 'Protected area proximity check (IUCN categories)', 'Pressure overlap adjustment', 'Company-to-site attribution methodology'], dbTable: 'staging.validated_biodiversity', qualityScore: 'Model confidence: High for land use, Medium for pollution, Low for climate change pressure', example: { status: 'PASS', total_msa_loss: 42.5, confidence: 'Medium' } },
      { stage: 'TRANSFORMATION', description: 'Company-level biodiversity footprint linked to company profile', dbTable: 'analytics.company_biodiversity', transformation: 'Sum MSA loss across pressures and sites, link to company via asset register', example: { company_profile_id: 42, total_msa_loss: 42.5, dominant_pressure: 'land_use' } },
      { stage: 'ENRICHMENT', description: 'Ecosystem sensitivity, species at risk proximity, TNFD risk categorization', derivedMetrics: [{ name: 'Protected Area Proximity', formula: 'distance_to_nearest_IUCN_category_1_2', example: '< 10km for 3 operations -> high sensitivity' }, { name: 'TNFD Risk Category', formula: 'mapped to TNFD LEAP categories', example: 'Physical: high dependency on pollinators' }], dbTable: 'analytics.biodiversity_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio biodiversity footprint: PCAF-attributed MSA loss', methodology: 'Adapted PCAF: attribution_factor * company_msa_loss', formula: 'Portfolio Biodiversity = sum(attribution * msa_loss_i)', example: { portfolio_msa_loss: 8.4, unit: 'MSA.km2' }, dbTable: 'analytics.portfolio_biodiversity', consumers: ['biodiversity-module', 'disclosure-hub', 'tnfd-reporting'] },
      { stage: 'INTERPRETATION', description: 'Biodiversity footprint contextualized for TNFD and investment risk', interpretations: [{ context: 'TNFD', value: '72% of portfolio has material biodiversity dependency per ENCORE' }, { context: 'regulatory', value: 'CSRD ESRS E4 requires biodiversity disclosure from FY2025' }] },
      { stage: 'PRESENTATION', description: 'Geospatial map with biodiversity hotspot overlay', presentations: [{ module: 'biodiversity-module', tab: 'Impact Map', viz: 'Heatmap of MSA loss by location + species at risk markers', value: '8.4 MSA.km2' }, { module: 'disclosure-hub', tab: 'CSRD E4', viz: 'TNFD LEAP table auto-fill', value: 'Material impact disclosure' }] },
      { stage: 'ACTION', description: 'High biodiversity impact triggers engagement on nature-positive strategy', actions: [{ trigger: 'Operations near Key Biodiversity Area', action: 'TNFD-aligned engagement on no-net-loss commitment', module: 'biodiversity-module' }, { trigger: 'MSA loss increasing YoY', action: 'Escalate: request science-based target for nature', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ015: Board Diversity --
  {
    id: 'MJ015',
    metric: 'Board Gender Diversity',
    unit: '% female directors',
    category: 'Core',
    journey: [
      { stage: 'SOURCE', description: 'Board composition data: gender, independence, tenure, skills matrix', source: 'Bloomberg Board Composition / ISS Governance / Company proxy statement', frequency: 'Updated on board change events; comprehensive annual update', quality: 'High: proxy statements are regulated disclosure', example: { company: 'Apple Inc', total_directors: 8, female: 4, female_pct: 50, year: 2024 } },
      { stage: 'INGESTION', description: 'Director-level records with demographic and skill attributes', dbTable: 'staging.raw_board_composition', dbColumns: ['company_ref', 'director_name', 'gender', 'independent', 'tenure_years', 'committee_memberships', 'skills'], validation: 'Director count reconciliation with proxy statement', example: { row: { director: 'Monica Lozano', gender: 'F', independent: true, tenure: 6 } } },
      { stage: 'VALIDATION', description: 'Gender coding accuracy, total director count match, independence classification', checks: ['Director count matches latest proxy filing', 'Gender classification verified against multiple sources', 'Independence per local governance code definition', 'Stale data: flag if > 6 months since last board change'], dbTable: 'staging.validated_board', qualityScore: 'High for large-cap (multiple sources); Medium for small-cap', example: { status: 'PASS', total: 8, female: 4, independent: 6 } },
      { stage: 'TRANSFORMATION', description: 'Board composition stored with diversity metrics', dbTable: 'analytics.company_governance', transformation: 'female_pct = female_directors / total_directors; independence_pct = independent / total', example: { company_profile_id: 88, female_pct: 50, independence_pct: 75 } },
      { stage: 'ENRICHMENT', description: 'Vs regulatory thresholds, sector benchmark, trend analysis', derivedMetrics: [{ name: 'Regulatory Compliance', formula: 'female_pct vs jurisdiction threshold', example: '50% vs EU 40% target = Compliant' }, { name: 'Sector Rank', formula: 'percentile in sector', example: 'P92 in Technology' }], dbTable: 'analytics.governance_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio weighted board diversity and compliance rate', methodology: 'Weight-averaged gender diversity + binary compliance count', formula: 'Portfolio Diversity = sum(weight * female_pct); Compliance Rate = count(compliant) / total', example: { portfolio_female_pct: 36.2, compliance_rate: 78 }, dbTable: 'analytics.portfolio_governance', consumers: ['esg-ratings-hub', 'disclosure-hub', 'sfdr-reporting'] },
      { stage: 'INTERPRETATION', description: 'Board diversity contextualized for governance and regulatory compliance', interpretations: [{ context: 'SFDR PAI', value: 'PAI 13: board gender diversity 36.2% -> mandatory disclosure' }, { context: 'regulatory', value: '78% of EU holdings meet 40% female director target' }] },
      { stage: 'PRESENTATION', description: 'Governance dashboard with board composition visuals', presentations: [{ module: 'esg-ratings-hub', tab: 'Governance Pillar', viz: 'Board composition pie + trend line', value: '36.2% female' }, { module: 'disclosure-hub', tab: 'SFDR PAI 13', viz: 'Auto-populated mandatory field', value: '36.2%' }] },
      { stage: 'ACTION', description: 'Below-threshold diversity triggers proxy voting and engagement', actions: [{ trigger: 'Female directors < 30%', action: 'Vote against nominating committee chair at AGM', module: 'esg-ratings-hub', tab: 'Voting Pipeline' }, { trigger: 'Zero female directors', action: 'Exclusion list candidate review', module: 'esg-ratings-hub' }] },
    ],
  },

  // =====================================================================
  //  DERIVED METRICS (15 journeys: MJ016 - MJ030)
  // =====================================================================

  // -- MJ016: WACI --
  {
    id: 'MJ016',
    metric: 'Weighted Average Carbon Intensity (WACI)',
    unit: 'tCO2e/$M Revenue',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Derived from MJ004 (Carbon Intensity) weighted by portfolio positions', source: 'Upstream: company_emissions + portfolio holdings', frequency: 'Quarterly', quality: 'Composite of emission DQS and financial data quality', example: { portfolio: 'Global Equity Fund', waci: 245.3, benchmark: 180.0 } },
      { stage: 'INGESTION', description: 'Pre-computed carbon intensities joined with current portfolio weights', dbTable: 'analytics.waci_staging', dbColumns: ['portfolio_id', 'holding_id', 'portfolio_weight', 'carbon_intensity'], validation: 'Weight sum = 100%, no negative weights', example: { row: { weight: 0.032, intensity: 178.5 } } },
      { stage: 'VALIDATION', description: 'Weight integrity, intensity coverage, benchmark alignment', checks: ['Portfolio weights sum to 100% +/- 0.1%', 'Carbon intensity available for > 90% of portfolio by weight', 'Benchmark WACI calculated with same methodology'], dbTable: 'analytics.waci_validated', qualityScore: 'Coverage-weighted quality', example: { status: 'PASS', coverage: '94%', weighted_dqs: 2.3 } },
      { stage: 'TRANSFORMATION', description: 'WACI = sum(w_i * CI_i) stored as portfolio-level metric', dbTable: 'analytics.waci_portfolio', transformation: 'Weighted sum of carbon intensities; TCFD-recommended metric', example: { portfolio_waci: 245.3, benchmark_waci: 180.0 } },
      { stage: 'ENRICHMENT', description: 'Sector decomposition, benchmark distance, trajectory projection', derivedMetrics: [{ name: 'Benchmark Delta', formula: 'WACI_portfolio - WACI_benchmark', example: '+65.3 tCO2e/$M (36% above)' }, { name: 'Sector Contribution', formula: 'weight_sector * (CI_sector - CI_benchmark_sector)', example: 'Energy: +44.2 tCO2e/$M contribution' }], dbTable: 'analytics.waci_enriched' },
      { stage: 'AGGREGATION', description: 'WACI aggregated across fund range, reported at firm level', methodology: 'AUM-weighted WACI across all funds', formula: 'Firm WACI = sum(AUM_fund * WACI_fund) / sum(AUM_fund)', example: { firm_waci: 198.5, funds_count: 24 }, dbTable: 'analytics.waci_firm', consumers: ['climate-banking-hub', 'disclosure-hub', 'net-zero-tracker'] },
      { stage: 'INTERPRETATION', description: 'WACI vs NZAM commitment, regulatory threshold, peer comparison', interpretations: [{ context: 'NZAM', value: 'Firm WACI 198.5 vs 2025 target 175 -> 13% above glidepath' }, { context: 'TCFD', value: 'TCFD recommended metric: 245.3 tCO2e/$M for Global Equity Fund' }] },
      { stage: 'PRESENTATION', description: 'WACI waterfall with sector attribution', presentations: [{ module: 'pcaf-financed-emissions', tab: 'WACI Analysis', viz: 'Waterfall: sector contributions to WACI delta', value: '245.3 tCO2e/$M' }, { module: 'climate-banking-hub', tab: 'TCFD Metrics', viz: 'WACI trend line with benchmark', value: 'Time series' }] },
      { stage: 'ACTION', description: 'WACI above target triggers sector allocation review', actions: [{ trigger: 'WACI > target + 20%', action: 'Sector weight constraints tightened in optimization', module: 'climate-banking-hub' }, { trigger: 'WACI trend increasing 2 consecutive quarters', action: 'Portfolio manager review with CIO', module: 'pcaf-financed-emissions' }] },
    ],
  },

  // -- MJ017: DQS Weighted Average --
  {
    id: 'MJ017',
    metric: 'Data Quality Score (Weighted Average)',
    unit: 'DQS 1-5 scale',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'PCAF Data Quality Score per holding from emission source quality', source: 'Upstream: PCAF attribution with DQS per holding', frequency: 'Quarterly', quality: 'Meta-metric: quality of quality measurement', example: { portfolio: 'Global Equity', avg_dqs: 2.7, dqs1_pct: 35, dqs5_pct: 5 } },
      { stage: 'INGESTION', description: 'Holding-level DQS scores joined with portfolio weights', dbTable: 'analytics.dqs_staging', dbColumns: ['portfolio_id', 'holding_id', 'dqs', 'weight', 'emission_source'], validation: 'DQS in range 1-5, every holding has DQS assignment', example: { row: { holding: 'Shell', dqs: 1, weight: 0.028 } } },
      { stage: 'VALIDATION', description: 'DQS completeness check, methodology consistency', checks: ['100% of holdings have DQS assigned', 'DQS methodology consistent with PCAF v2 decision tree', 'Historical DQS trend available for year-on-year comparison'], dbTable: 'analytics.dqs_validated', qualityScore: 'N/A (this IS the quality metric)', example: { status: 'PASS', coverage: '100%' } },
      { stage: 'TRANSFORMATION', description: 'Weighted average DQS and distribution histogram stored', dbTable: 'analytics.portfolio_dqs', transformation: 'Weighted DQS = sum(financed_emission_weight * dqs) / sum(financed_emission_weight)', example: { weighted_dqs: 2.7, distribution: { dqs1: 35, dqs2: 28, dqs3: 22, dqs4: 10, dqs5: 5 } } },
      { stage: 'ENRICHMENT', description: 'DQS improvement trajectory, upgrade candidates, sector quality comparison', derivedMetrics: [{ name: 'Improvement Candidates', formula: 'holdings with DQS4-5 AND active CDP responder', example: '12 holdings could upgrade DQS if engaged' }, { name: 'YoY Improvement', formula: 'current_dqs - prior_dqs', example: '-0.3 improvement (from 3.0 to 2.7)' }], dbTable: 'analytics.dqs_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level DQS across all portfolios', methodology: 'AUM-weighted DQS across fund range', formula: 'Firm DQS = sum(AUM * weighted_dqs) / total_AUM', example: { firm_dqs: 2.9 }, dbTable: 'analytics.dqs_firm', consumers: ['pcaf-financed-emissions', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'DQS vs PCAF targets and peer benchmarks', interpretations: [{ context: 'target', value: 'PCAF signatory commitment: DQS < 2.5 by 2026 -> currently 2.7, improvement needed' }, { context: 'peer', value: 'Peer median DQS: 3.1 -> our 2.7 is above average quality' }] },
      { stage: 'PRESENTATION', description: 'DQS distribution heatmap and improvement waterfall', presentations: [{ module: 'pcaf-financed-emissions', tab: 'DQS Improvement Wizard', viz: 'Distribution bar chart + improvement candidates table', value: 'DQS 2.7' }, { module: 'disclosure-hub', tab: 'PCAF Disclosure', viz: 'DQS disclosure template', value: 'Weighted DQS 2.7' }] },
      { stage: 'ACTION', description: 'DQS improvement campaign targeting', actions: [{ trigger: 'DQS > 3.0', action: 'Launch CDP Non-Disclosure Campaign for DQS5 holdings', module: 'pcaf-financed-emissions' }, { trigger: '12 upgrade candidates identified', action: 'Data request letters to company IR teams', module: 'pcaf-financed-emissions', tab: 'DQS Improvement Wizard' }] },
    ],
  },

  // -- MJ018: Portfolio Temperature Alignment --
  {
    id: 'MJ018',
    metric: 'Portfolio Temperature Alignment Gap',
    unit: 'deg C gap',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Derived from MJ006 (Temperature Score) vs Paris-aligned target pathway', source: 'Portfolio temperature + IEA NZE / NGFS pathways', frequency: 'Quarterly', quality: 'Compound uncertainty: model + scenario + data', example: { portfolio_temp: 2.4, target: 1.5, gap: 0.9 } },
      { stage: 'INGESTION', description: 'Portfolio temperature alongside scenario pathway benchmarks', dbTable: 'analytics.alignment_staging', dbColumns: ['portfolio_id', 'portfolio_temp', 'scenario', 'target_temp', 'gap'], validation: 'Scenario version check', example: { row: { temp: 2.4, scenario: 'IEA_NZE', target: 1.5 } } },
      { stage: 'VALIDATION', description: 'Alignment gap calculation verified against multiple pathway definitions', checks: ['Gap = portfolio_temp - target_temp', 'Multiple scenarios: 1.5C, WB2C, 2C', 'Sector-level decomposition available'], dbTable: 'analytics.alignment_validated', qualityScore: 'Reflects upstream temperature score quality', example: { status: 'PASS', gap_1_5: 0.9, gap_wb2: 0.4 } },
      { stage: 'TRANSFORMATION', description: 'Alignment gap stored per scenario and decomposed by sector', dbTable: 'analytics.alignment_gap', transformation: 'Sector decomposition: which sectors contribute most to gap', example: { total_gap: 0.9, energy_contribution: 0.42, materials_contribution: 0.18 } },
      { stage: 'ENRICHMENT', description: 'Required reduction pace, engagement effectiveness projection', derivedMetrics: [{ name: 'Required Reduction Pace', formula: 'gap / years_to_target', example: '0.9C / 6 years = -0.15C per year needed' }, { name: 'Engagement Impact', formula: 'if top-20 emitters align, portfolio impact', example: 'Top-20 alignment would close 0.6C of 0.9C gap' }], dbTable: 'analytics.alignment_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level alignment gap across all portfolios', methodology: 'AUM-weighted alignment gap', formula: 'Firm gap = sum(AUM * gap) / total_AUM', example: { firm_gap: 0.7 }, dbTable: 'analytics.firm_alignment', consumers: ['net-zero-tracker', 'portfolio-temperature-score', 'sbti-dashboard'] },
      { stage: 'INTERPRETATION', description: 'Alignment gap translated to required actions and feasibility', interpretations: [{ context: 'feasibility', value: '-0.15C/year required pace vs historical -0.05C/year achieved -> 3x acceleration needed' }, { context: 'levers', value: 'Engagement (0.6C), sector rotation (0.2C), divestment (0.1C)' }] },
      { stage: 'PRESENTATION', description: 'Gap waterfall with sector attribution and action levers', presentations: [{ module: 'net-zero-tracker', tab: 'Alignment Gap', viz: 'Gap waterfall: sector contributions + action levers', value: '0.9C gap to 1.5C' }, { module: 'sbti-dashboard', tab: 'Pathway', viz: 'Trajectory vs target pathway', value: 'Gap trend line' }] },
      { stage: 'ACTION', description: 'Alignment gap > threshold triggers net-zero action plan update', actions: [{ trigger: 'Gap > 0.5C to 1.5C', action: 'Update NZAM action plan with sector constraints', module: 'net-zero-tracker' }, { trigger: 'Gap widening QoQ', action: 'Emergency stewardship review', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ019: Sector Pathway Gap --
  {
    id: 'MJ019',
    metric: 'Sector Decarbonization Pathway Gap',
    unit: 'tCO2e/$M vs pathway',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Company carbon intensity vs IEA NZE sector-specific pathway', source: 'IEA Net Zero by 2050 / TPI sector benchmarks / PACTA sector pathways', frequency: 'Annual pathway update, quarterly company data refresh', quality: 'Pathway uncertainty + company data quality', example: { sector: 'Steel', company_intensity: 1850, pathway_2030: 1100, gap: 750 } },
      { stage: 'INGESTION', description: 'Sector pathways loaded alongside company-level intensities by sector', dbTable: 'analytics.pathway_staging', dbColumns: ['sector', 'year', 'pathway_intensity', 'company_profile_id', 'company_intensity'], validation: 'Sector classification consistency', example: { row: { sector: 'Steel', company: 'ArcelorMittal', intensity: 1850, pathway: 1100 } } },
      { stage: 'VALIDATION', description: 'Pathway version alignment, sector classification, intensity unit consistency', checks: ['Same year for company and pathway comparison', 'Sector mapping consistent (GICS vs NACE vs custom)', 'Physical intensity where available (e.g. tCO2/t steel)'], dbTable: 'analytics.pathway_validated', qualityScore: 'High for high-emitting sectors; Low for diversified companies', example: { status: 'PASS' } },
      { stage: 'TRANSFORMATION', description: 'Gap calculated: positive = above pathway (lagging), negative = below (leading)', dbTable: 'analytics.sector_pathway_gap', transformation: 'gap = company_intensity - pathway_intensity_for_year', example: { gap: 750, direction: 'lagging', pct_above: '68%' } },
      { stage: 'ENRICHMENT', description: 'Gap trajectory, catch-up required, peer comparison', derivedMetrics: [{ name: 'Annual Catch-up Required', formula: 'gap / years_to_net_zero', example: '750 / 27 = -28 tCO2e/$M per year' }, { name: 'Peer Rank', formula: 'rank within sector by gap', example: 'P45 -> middle of pack' }], dbTable: 'analytics.pathway_gap_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio-weighted pathway gap across sectors', methodology: 'Weight-averaged gap; sector contribution analysis', formula: 'Portfolio Gap = sum(weight * gap) for each sector', example: { portfolio_gap: 180, worst_sector: 'Oil & Gas', best_sector: 'Technology' }, dbTable: 'analytics.portfolio_pathway', consumers: ['corporate-decarbonisation', 'transition-planning-hub'] },
      { stage: 'INTERPRETATION', description: 'Pathway gaps interpreted for credibility and investment risk', interpretations: [{ context: 'transition risk', value: 'Steel companies 68% above pathway -> exposed to carbon pricing risk' }, { context: 'engagement', value: '12 companies above pathway in high-impact sectors -> engagement priority' }] },
      { stage: 'PRESENTATION', description: 'Company vs pathway trajectory chart with sector lens', presentations: [{ module: 'corporate-decarbonisation', tab: 'Sector Pathways', viz: 'Line chart: company trajectory vs sector pathway', value: '+750 gap' }, { module: 'transition-planning-hub', tab: 'Engagement Targets', viz: 'Gap heatmap by sector and company', value: 'Sector prioritization' }] },
      { stage: 'ACTION', description: 'Large pathway gap triggers engagement escalation', actions: [{ trigger: 'Gap > sector 75th percentile', action: 'Targeted decarbonization engagement', module: 'corporate-decarbonisation' }, { trigger: 'Gap increasing 2+ years', action: 'Escalation: vote against climate plan', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ020: Credibility Score --
  {
    id: 'MJ020',
    metric: 'Transition Plan Credibility Score',
    unit: '0-100',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Composite of target ambition, historical track record, capex alignment, and governance strength', source: 'SBTi targets + historical emissions + capital expenditure plans + governance data', frequency: 'Annual comprehensive; quarterly interim updates', quality: 'Multi-factor composite with different quality per component', example: { company: 'BP', credibility: 45, ambition: 72, track_record: 28, capex_alignment: 35, governance: 55 } },
      { stage: 'INGESTION', description: 'Four sub-component scores ingested from upstream metrics', dbTable: 'analytics.credibility_staging', dbColumns: ['company_profile_id', 'ambition_score', 'track_record_score', 'capex_score', 'governance_score'], validation: 'All four sub-scores available', example: { row: { ambition: 72, track_record: 28, capex: 35, governance: 55 } } },
      { stage: 'VALIDATION', description: 'Sub-score range check, internal consistency validation', checks: ['All scores 0-100', 'Track record vs ambition: large gap flags greenwash risk', 'Capex alignment evidence required'], dbTable: 'analytics.credibility_validated', qualityScore: 'High if all 4 components data-rich', example: { status: 'PASS', credibility: 45 } },
      { stage: 'TRANSFORMATION', description: 'Weighted composite stored with sub-component decomposition', dbTable: 'analytics.company_credibility', transformation: 'Credibility = 0.25*ambition + 0.35*track_record + 0.25*capex + 0.15*governance', example: { credibility: 45, classification: 'Moderate Risk' } },
      { stage: 'ENRICHMENT', description: 'Say-do gap, greenwash risk flag, improvement trajectory', derivedMetrics: [{ name: 'Say-Do Gap', formula: 'ambition - track_record', example: '72 - 28 = 44 point gap -> HIGH' }, { name: 'Greenwash Risk', formula: 'if say_do_gap > 30 AND credibility < 50', example: 'FLAGGED: high ambition, low delivery' }], dbTable: 'analytics.credibility_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio credibility score and greenwash exposure', methodology: 'Weight-averaged credibility; binary greenwash count', formula: 'Portfolio Credibility = sum(w * credibility); Greenwash Count = count(flagged)', example: { portfolio_credibility: 58, greenwash_flagged: 8, pct: '12%' }, dbTable: 'analytics.portfolio_credibility', consumers: ['transition-planning-hub', 'greenwash-detector', 'corporate-decarbonisation'] },
      { stage: 'INTERPRETATION', description: 'Credibility interpreted for greenwash risk and engagement priority', interpretations: [{ context: 'greenwash', value: '12% of portfolio flagged for high say-do gap -> reputational risk' }, { context: 'engagement', value: '8 holdings with credibility < 40 -> priority engagement list' }] },
      { stage: 'PRESENTATION', description: 'Scatter plot: ambition vs track record with greenwash flagging', presentations: [{ module: 'greenwash-detector', tab: 'Credibility Matrix', viz: 'Scatter: ambition (x) vs track record (y) with greenwash zone', value: '8 flagged' }, { module: 'transition-planning-hub', tab: 'Engagement Priority', viz: 'Ranked table by credibility gap', value: 'Priority list' }] },
      { stage: 'ACTION', description: 'Low credibility triggers escalated engagement or exclusion review', actions: [{ trigger: 'Credibility < 30', action: 'Formal escalation: demand corrective action plan within 12 months', module: 'transition-planning-hub' }, { trigger: 'Greenwash flag + recent green bond', action: 'Review green bond allocation for potential sell', module: 'green-bond-manager' }] },
    ],
  },

  // -- MJ021: Enablement Ratio --
  {
    id: 'MJ021',
    metric: 'Enablement Ratio',
    unit: 'ratio (avoided / emitted)',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Ratio of avoided emissions to emitted emissions per company', source: 'Upstream: MJ001 (Scope 1) + MJ012 (Avoided Emissions)', frequency: 'Annual', quality: 'Dependent on avoided emissions methodology quality', example: { company: 'Vestas', avoided: 175_000_000, emitted: 1_200_000, ratio: 145.8 } },
      { stage: 'INGESTION', description: 'Avoided and emitted totals joined per company', dbTable: 'analytics.enablement_staging', dbColumns: ['company_profile_id', 'total_emitted', 'total_avoided', 'enablement_ratio'], validation: 'Both values positive', example: { row: { emitted: 1200000, avoided: 175000000 } } },
      { stage: 'VALIDATION', description: 'Ratio bounds check, avoided emissions credibility filter', checks: ['Only Tier 1 and Tier 2 credibility avoided emissions included', 'Emitted includes S1+S2 minimum', 'Ratio > 1000x flagged for review'], dbTable: 'analytics.enablement_validated', qualityScore: 'Tied to avoided emissions credibility tier', example: { status: 'PASS', ratio: 145.8 } },
      { stage: 'TRANSFORMATION', description: 'Enablement ratio stored per company with credibility weighting', dbTable: 'analytics.enablement_ratio', transformation: 'ratio = avoided_tco2e / (scope1 + scope2 + scope3)', example: { company_profile_id: 42, enablement_ratio: 145.8 } },
      { stage: 'ENRICHMENT', description: 'Net climate contribution classification, solution company identification', derivedMetrics: [{ name: 'Net Climate Class', formula: 'if ratio > 1 -> Net Positive; else Net Negative', example: 'Vestas: Net Positive (145x)' }, { name: 'Solution Company Flag', formula: 'ratio > 5 AND credibility Tier 1-2', example: 'TRUE' }], dbTable: 'analytics.enablement_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio enablement and net impact', methodology: 'PCAF-attributed avoided vs emitted', formula: 'Portfolio Enablement = sum(attributed_avoided) / sum(attributed_emitted)', example: { portfolio_enablement: 0.04, net_contribution: -293_000_000 }, dbTable: 'analytics.portfolio_enablement', consumers: ['corporate-decarbonisation', 'green-bond-manager'] },
      { stage: 'INTERPRETATION', description: 'Portfolio net climate contribution contextualized', interpretations: [{ context: 'net impact', value: 'Portfolio enables 12.4M tCO2e avoided but finances 305M -> net negative (-293M)' }, { context: 'solution allocation', value: '8% of portfolio in Net Positive companies (ratio > 1)' }] },
      { stage: 'PRESENTATION', description: 'Net contribution waterfall', presentations: [{ module: 'corporate-decarbonisation', tab: 'Net Impact', viz: 'Waterfall: emitted, avoided, net', value: 'Enablement 0.04' }] },
      { stage: 'ACTION', description: 'Target increased allocation to solution companies', actions: [{ trigger: 'Solution company allocation < 10%', action: 'Screen for additional climate solution investments', module: 'corporate-decarbonisation' }] },
    ],
  },

  // -- MJ022: Net Climate Impact --
  {
    id: 'MJ022',
    metric: 'Net Climate Impact',
    unit: 'tCO2e net',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Financed emissions minus attributed avoided emissions', source: 'MJ005 (Financed Emissions) + MJ012 (Avoided Emissions)', frequency: 'Quarterly', quality: 'Highest uncertainty metric: compounds emission and avoided quality', example: { financed: 305_000_000, avoided: 12_400_000, net: -292_600_000 } },
      { stage: 'INGESTION', description: 'Pre-computed financed and avoided joined at portfolio level', dbTable: 'analytics.net_impact_staging', dbColumns: ['portfolio_id', 'financed_tco2e', 'avoided_tco2e', 'net_tco2e'], validation: 'Both components from same reporting period', example: { row: { financed: 305000000, avoided: 12400000 } } },
      { stage: 'VALIDATION', description: 'Period alignment, credibility weighting of avoided', checks: ['Same temporal reference period', 'Avoided emissions limited to Tier 1-2 credibility', 'No double counting between portfolios'], dbTable: 'analytics.net_impact_validated', qualityScore: 'Low-Medium: experimental metric with high uncertainty', example: { status: 'PASS', net: -292600000 } },
      { stage: 'TRANSFORMATION', description: 'Net impact stored with uncertainty bands', dbTable: 'analytics.net_climate_impact', transformation: 'net = financed - avoided; uncertainty = +/- 30% for avoided component', example: { net: -292600000, lower_bound: -296320000, upper_bound: -288880000 } },
      { stage: 'ENRICHMENT', description: 'Trajectory projection, breakeven analysis', derivedMetrics: [{ name: 'Breakeven Date', formula: 'when does net cross zero at current trajectory', example: 'At current trajectory: never (avoided growing too slowly)' }, { name: 'Required Avoided Growth', formula: 'CAGR needed for net = 0 by 2050', example: '18% CAGR in avoided emissions needed' }], dbTable: 'analytics.net_impact_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level net climate impact', methodology: 'Sum across all portfolios', formula: 'Firm Net = sum(portfolio_net)', example: { firm_net: -12_400_000_000 }, dbTable: 'analytics.firm_net_impact', consumers: ['corporate-decarbonisation', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Net impact framed as climate contribution narrative', interpretations: [{ context: 'narrative', value: 'Firm finances 12.4B tCO2e but enables only 0.5B avoided -> significant net negative contributor' }, { context: 'trajectory', value: 'Net improving -4% YoY driven by portfolio decarbonization' }] },
      { stage: 'PRESENTATION', description: 'Net impact dashboard with trajectory', presentations: [{ module: 'corporate-decarbonisation', tab: 'Net Impact', viz: 'Dual bar (financed vs avoided) + net line', value: '-292.6M tCO2e net' }] },
      { stage: 'ACTION', description: 'Net impact trajectory informs strategic allocation', actions: [{ trigger: 'Net worsening YoY', action: 'Strategy review: increase green revenue exposure', module: 'corporate-decarbonisation' }] },
    ],
  },

  // -- MJ023: Momentum Signal --
  {
    id: 'MJ023',
    metric: 'ESG Momentum Signal',
    unit: 'z-score',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Rolling change in ESG consensus score over 6 and 12-month windows', source: 'MJ009 (ESG Consensus) time series', frequency: 'Monthly', quality: 'Requires consistent 12+ month history', example: { company: 'Tesla', momentum_6m: 2.1, momentum_12m: 1.8, direction: 'positive' } },
      { stage: 'INGESTION', description: 'Historical consensus scores loaded for rolling window computation', dbTable: 'analytics.momentum_staging', dbColumns: ['company_profile_id', 'date', 'consensus_score', 'e_score', 's_score', 'g_score'], validation: 'Minimum 12 monthly observations required', example: { row: { date: '2024-01', score: 58.2 } } },
      { stage: 'VALIDATION', description: 'Time series continuity, outlier detection in changes', checks: ['No gaps > 2 months in time series', 'Month-on-month change < 15 points (outlier check)', 'Provider consistency (no methodology changes mid-series)'], dbTable: 'analytics.momentum_validated', qualityScore: 'High if 18+ months history; Medium if 12-18', example: { status: 'PASS', history_months: 24 } },
      { stage: 'TRANSFORMATION', description: 'Z-score of 6-month change relative to sector distribution', dbTable: 'analytics.esg_momentum', transformation: 'z = (change_6m - sector_mean_change) / sector_stdev_change', example: { z_score: 2.1, percentile: 98, interpretation: 'Strong positive outlier' } },
      { stage: 'ENRICHMENT', description: 'Pillar-level momentum, catalyst identification, alpha signal', derivedMetrics: [{ name: 'Pillar Decomposition', formula: 'momentum per E/S/G pillar', example: 'E: +1.8, S: +0.8, G: +0.3 -> Environment-led improvement' }, { name: 'Alpha Signal', formula: 'if momentum z > 1.5 AND consensus < 60', example: 'BUY signal: improving from low base' }], dbTable: 'analytics.momentum_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio momentum distribution and signal count', methodology: 'Count of positive/negative signals; distribution skew', formula: 'Portfolio Momentum = sum(weight * z_score)', example: { portfolio_momentum: 0.34, positive_signals: 18, negative_signals: 8 }, dbTable: 'analytics.portfolio_momentum', consumers: ['esg-ratings-hub', 'portfolio-suite'] },
      { stage: 'INTERPRETATION', description: 'Momentum signal interpreted for investment decision support', interpretations: [{ context: 'alpha', value: '18 positive signals -> portfolio positioned for ESG upgrade cycle' }, { context: 'risk', value: '8 negative momentum holdings -> potential downgrade risk' }] },
      { stage: 'PRESENTATION', description: 'Momentum scatter plot and signal feed', presentations: [{ module: 'esg-ratings-hub', tab: 'Momentum Radar', viz: 'Scatter: current score (x) vs momentum (y) with signal zones', value: '18 buy signals' }] },
      { stage: 'ACTION', description: 'Strong momentum signals feed into portfolio optimization', actions: [{ trigger: 'Momentum z > 2.0, consensus < 50', action: 'ESG alpha opportunity flagged for PM', module: 'esg-ratings-hub' }, { trigger: 'Momentum z < -2.0', action: 'Risk alert: potential ESG downgrade imminent', module: 'esg-ratings-hub' }] },
    ],
  },

  // -- MJ024: Alpha Signal --
  {
    id: 'MJ024',
    metric: 'ESG Alpha Signal',
    unit: 'expected basis points',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Combined ESG momentum + value factor (low-score improvers) + controversy reversal', source: 'MJ023 (Momentum) + MJ009 (Consensus) + MJ010 (Controversy)', frequency: 'Monthly', quality: 'Backtested model; forward-looking uncertainty', example: { company: 'Meta Platforms', alpha_bps: 45, signal: 'BUY', confidence: 0.72 } },
      { stage: 'INGESTION', description: 'Factor inputs joined for alpha model computation', dbTable: 'analytics.alpha_staging', dbColumns: ['company_profile_id', 'momentum_z', 'consensus_score', 'controversy_reversal', 'sector_adjustment'], validation: 'All factor inputs available', example: { row: { momentum_z: 2.1, consensus: 48, reversal: true } } },
      { stage: 'VALIDATION', description: 'Factor availability, lookback consistency, turnover constraint check', checks: ['All 3 factors available for >80% of universe', 'Signal stability: not flipping monthly', 'Sector neutrality maintained'], dbTable: 'analytics.alpha_validated', qualityScore: 'Backtested R-squared: 0.12 (modest but significant)', example: { status: 'PASS', coverage: '88%' } },
      { stage: 'TRANSFORMATION', description: 'Alpha signal = weighted combination of ESG factors', dbTable: 'analytics.esg_alpha', transformation: 'alpha = 0.5*momentum_z + 0.3*value_factor + 0.2*reversal_factor; normalize cross-sectionally', example: { alpha_bps: 45, signal: 'BUY', confidence: 0.72 } },
      { stage: 'ENRICHMENT', description: 'Factor attribution, sector alpha, implementation cost estimate', derivedMetrics: [{ name: 'Factor Attribution', formula: 'contribution per factor', example: 'Momentum: +22bps, Value: +15bps, Reversal: +8bps' }, { name: 'Net Alpha', formula: 'gross_alpha - estimated_transaction_cost', example: '45 - 8 = 37bps net' }], dbTable: 'analytics.alpha_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio expected alpha from ESG signal overlay', methodology: 'Signal-weighted alpha; turnover-constrained', formula: 'Portfolio Alpha = sum(active_weight_change * alpha_i)', example: { expected_alpha_bps: 28, turnover: '12%' }, dbTable: 'analytics.portfolio_alpha', consumers: ['esg-ratings-hub', 'portfolio-suite'] },
      { stage: 'INTERPRETATION', description: 'Alpha signal contextualized with risk-return tradeoff', interpretations: [{ context: 'expected return', value: '28bps expected alpha from ESG signal overlay -> equivalent to 0.28% annual' }, { context: 'risk', value: 'Tracking error increase: +0.15% -> information ratio improvement of 0.19' }] },
      { stage: 'PRESENTATION', description: 'Alpha signal table with implementation recommendations', presentations: [{ module: 'esg-ratings-hub', tab: 'Alpha Signals', viz: 'Signal table: company, direction, bps, confidence', value: '42 active signals' }] },
      { stage: 'ACTION', description: 'Alpha signals feed into portfolio construction', actions: [{ trigger: 'Signal confidence > 70%', action: 'Include in ESG-optimized portfolio construction', module: 'portfolio-suite' }] },
    ],
  },

  // -- MJ025: Poseidon Alignment Score --
  {
    id: 'MJ025',
    metric: 'Poseidon Principles Alignment Score',
    unit: 'alignment delta %',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Vessel-level AER compared to IMO 2050 decarbonization trajectory', source: 'IMO DCS / Poseidon Principles annual disclosure / Ship registry', frequency: 'Annual', quality: 'High for DCS reporting vessels', example: { vessel: 'CMA CGM Jacques Saade', aer: 7.2, trajectory: 8.5, aligned: true, delta: '-15%' } },
      { stage: 'INGESTION', description: 'Vessel AER and trajectory values loaded per ship type', dbTable: 'staging.poseidon_import', dbColumns: ['imo_number', 'ship_type', 'dwt', 'aer_actual', 'aer_trajectory', 'alignment_delta'], validation: 'Ship type classification, AER calculation verification', example: { row: { imo: 9454448, aer: 7.2, trajectory: 8.5 } } },
      { stage: 'VALIDATION', description: 'AER formula verification, trajectory version alignment, outlier detection', checks: ['AER = total_co2 / (dwt * distance)', 'Trajectory from IMO MEPC.354 annex', 'AER < 0.5 or > 50 flagged as outlier'], dbTable: 'staging.poseidon_validated', qualityScore: 'High if all vessels DCS-compliant', example: { status: 'PASS' } },
      { stage: 'TRANSFORMATION', description: 'Alignment delta stored per vessel, aggregated to loan level', dbTable: 'analytics.poseidon_alignment', transformation: 'delta_pct = (aer_actual - aer_trajectory) / aer_trajectory; aligned if delta < 0', example: { delta: -0.15, aligned: true } },
      { stage: 'ENRICHMENT', description: 'Fleet alignment score, loan exposure, ship type breakdown', derivedMetrics: [{ name: 'Fleet Alignment', formula: 'exposure-weighted average delta across vessels', example: 'Fleet alignment: -8% (below trajectory = good)' }], dbTable: 'analytics.poseidon_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio shipping loan alignment score', methodology: 'Poseidon Principles Annual Disclosure Methodology', formula: 'Portfolio Alignment = sum(loan_amount * delta) / sum(loan_amount)', example: { portfolio_alignment: -0.05, aligned_pct: '72%' }, dbTable: 'analytics.portfolio_poseidon', consumers: ['maritime-poseidon', 'climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'Poseidon alignment vs peer banks and trajectory tightening', interpretations: [{ context: 'vs peers', value: 'Our shipping book -5% aligned vs signatory average -2%' }, { context: 'tightening', value: 'IMO trajectory tightens 2% per year -> current alignment buffer = 3 years' }] },
      { stage: 'PRESENTATION', description: 'Fleet alignment dashboard with vessel-level drill-down', presentations: [{ module: 'maritime-poseidon', tab: 'Portfolio Alignment', viz: 'Ship type alignment bars + individual vessel dots', value: '-5% aligned' }] },
      { stage: 'ACTION', description: 'Misaligned vessels trigger covenant review', actions: [{ trigger: 'Vessel > +10% above trajectory', action: 'Covenant review for specific loan', module: 'maritime-poseidon' }] },
    ],
  },

  // -- MJ026: EEXI Compliance --
  {
    id: 'MJ026',
    metric: 'EEXI Compliance Status',
    unit: 'binary + attained value',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Energy Efficiency Existing Ship Index from technical assessment per IMO MEPC.351', source: 'ClassNK / Lloyd Register / DNV / Flag State Survey', frequency: 'One-time (survey at first dry-dock after Jan 2023)', quality: 'High: technical survey-based', example: { vessel: 'MSC Gulsun', eexi_attained: 4.82, eexi_required: 5.21, compliant: true } },
      { stage: 'INGESTION', description: 'EEXI survey results ingested per vessel', dbTable: 'staging.raw_eexi_import', dbColumns: ['imo_number', 'eexi_attained', 'eexi_required', 'compliance_method', 'survey_date'], validation: 'Attained vs required comparison', example: { row: { attained: 4.82, required: 5.21, method: 'engine_power_limitation' } } },
      { stage: 'VALIDATION', description: 'Survey authority check, calculation method verification', checks: ['Recognized classification society', 'Attained < Required for compliance', 'Compliance method documented'], dbTable: 'staging.eexi_validated', qualityScore: 'High: regulatory survey data', example: { status: 'PASS', compliant: true } },
      { stage: 'TRANSFORMATION', description: 'Compliance status with margin and method stored', dbTable: 'analytics.vessel_eexi', transformation: 'compliance = attained < required; margin = (required - attained) / required', example: { compliant: true, margin: '7.5%' } },
      { stage: 'ENRICHMENT', description: 'Fleet compliance rate, non-compliant vessel risk assessment', derivedMetrics: [{ name: 'Fleet Compliance Rate', formula: 'count(compliant) / total_fleet', example: '94% fleet compliant' }, { name: 'Stranding Risk', formula: 'non-compliant vessels near regulatory deadline', example: '6% of fleet at risk of detention' }], dbTable: 'analytics.eexi_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio EEXI compliance by shipping exposure', methodology: 'Binary compliance weighted by loan exposure', formula: 'Compliance Rate = sum(compliant_exposure) / sum(total_shipping_exposure)', example: { compliance_rate: '94%', non_compliant_exposure: 145_000_000 }, dbTable: 'analytics.portfolio_eexi', consumers: ['maritime-poseidon'] },
      { stage: 'INTERPRETATION', description: 'EEXI non-compliance as credit risk factor', interpretations: [{ context: 'regulatory', value: '6% non-compliant -> vessels may be detained at port' }, { context: 'credit risk', value: 'Non-compliant vessels lose trading capability -> revenue risk' }] },
      { stage: 'PRESENTATION', description: 'Compliance status grid by vessel and method', presentations: [{ module: 'maritime-poseidon', tab: 'EEXI Status', viz: 'Grid: vessel x compliance method with status color', value: '94% compliant' }] },
      { stage: 'ACTION', description: 'Non-compliance triggers loan covenant review', actions: [{ trigger: 'Non-compliant vessel on loan book', action: 'Issue borrower notice requiring compliance plan', module: 'maritime-poseidon' }] },
    ],
  },

  // -- MJ027: SAF Blend Cost --
  {
    id: 'MJ027',
    metric: 'Sustainable Aviation Fuel (SAF) Blend Cost Impact',
    unit: 'USD/gallon premium',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'SAF pricing, mandate trajectories, and airline fuel consumption data', source: 'IATA SAF Dashboard / Argus / Platts / ReFuelEU mandates', frequency: 'Monthly pricing; annual mandate updates', quality: 'Pricing: spot market quality | Mandates: regulatory certainty', example: { airline: 'Lufthansa', saf_blend_pct: 5, cost_premium: 2.85, year: 2024 } },
      { stage: 'INGESTION', description: 'SAF prices, mandate %, and airline fuel consumption loaded', dbTable: 'staging.saf_cost_import', dbColumns: ['airline_id', 'saf_blend_pct', 'saf_price_gal', 'jet_a1_price_gal', 'annual_fuel_gal', 'mandate_jurisdiction'], validation: 'Price range reasonableness', example: { row: { saf_price: 6.50, jet_a1: 3.65, premium: 2.85 } } },
      { stage: 'VALIDATION', description: 'Price premium calculation, mandate compliance verification', checks: ['SAF premium = saf_price - jet_a1_price (positive)', 'Blend % meets jurisdiction mandate', 'Total cost impact within airline EBITDA tolerance'], dbTable: 'staging.saf_validated', qualityScore: 'High for spot prices; Medium for forward projections', example: { status: 'PASS', premium: 2.85, mandate_compliant: true } },
      { stage: 'TRANSFORMATION', description: 'Airline-level SAF cost impact stored and projected', dbTable: 'analytics.airline_saf_cost', transformation: 'annual_cost_impact = fuel_consumption * blend_pct * premium_per_gallon', example: { annual_impact_usd: 425_000_000, pct_of_ebitda: 8.5 } },
      { stage: 'ENRICHMENT', description: 'Mandate trajectory cost projection, competitive impact assessment', derivedMetrics: [{ name: 'ReFuelEU Cost by 2030', formula: 'projected SAF cost under 6% mandate', example: '$2.1B annual by 2030 at current premium' }, { name: 'Cost Pass-Through', formula: 'estimated ticket price increase per pax', example: '+$4.50 per average flight' }], dbTable: 'analytics.saf_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio aviation exposure and SAF cost materiality', methodology: 'Exposure-weighted SAF cost as % of revenue', formula: 'Portfolio SAF Impact = sum(weight * saf_cost_pct_revenue)', example: { portfolio_saf_impact: 0.8, pct_of_revenue: '0.8%' }, dbTable: 'analytics.portfolio_saf', consumers: ['aviation-corsia', 'climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'SAF cost as transition risk factor for aviation exposure', interpretations: [{ context: 'earnings impact', value: 'SAF mandate increases airline costs 8-15% of EBITDA by 2030' }, { context: 'competitive', value: 'Airlines with SAF offtake agreements have cost advantage' }] },
      { stage: 'PRESENTATION', description: 'SAF cost waterfall and mandate timeline', presentations: [{ module: 'aviation-corsia', tab: 'SAF Economics', viz: 'Cost waterfall: jet fuel + SAF premium + carbon offset', value: '$2.85/gal premium' }] },
      { stage: 'ACTION', description: 'High SAF cost exposure triggers credit review', actions: [{ trigger: 'SAF cost > 12% EBITDA projected', action: 'Credit risk adjustment for aviation exposure', module: 'aviation-corsia' }] },
    ],
  },

  // -- MJ028: Physical Risk VaR --
  {
    id: 'MJ028',
    metric: 'Physical Risk VaR',
    unit: '% asset value at risk',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Asset-level physical hazard exposure from climate models under SSP scenarios', source: 'Munich Re NATHAN / Swiss Re CatNet / NGFS Phase IV physical variables / GeoAsset Project', frequency: 'Climate models: decadal update; asset data: annual', quality: 'Model resolution: ~25km grid; asset geocoding accuracy varies', example: { company: 'TSMC', hazards: ['water_stress', 'flood', 'typhoon'], exposure_score: 78, asset_value_at_risk: 0.12 } },
      { stage: 'INGESTION', description: 'Geocoded asset locations overlaid with hazard maps per SSP scenario', dbTable: 'staging.physical_risk_import', dbColumns: ['company_ref', 'asset_id', 'lat', 'lon', 'hazard_type', 'intensity_ssp245', 'intensity_ssp585', 'vulnerability'], validation: 'Geocoding accuracy, hazard map version', example: { row: { lat: 24.78, lon: 120.98, hazard: 'flood', intensity_ssp585: 0.82 } } },
      { stage: 'VALIDATION', description: 'Hazard intensity calibration, vulnerability curve selection, asset coverage', checks: ['Hazard maps validated against historical event data', 'Vulnerability curves appropriate for asset/industry type', 'Asset coverage > 70% of revenue for company'], dbTable: 'staging.physical_validated', qualityScore: 'High for major facilities; Low for supply chain nodes', example: { status: 'PASS', coverage: '85%' } },
      { stage: 'TRANSFORMATION', description: 'Expected loss calculated per asset and aggregated to company', dbTable: 'analytics.physical_risk_var', transformation: 'expected_loss = sum(hazard_probability * vulnerability * exposure_value) per asset, summed to company', example: { company_physical_var: 0.12, dominant_hazard: 'water_stress' } },
      { stage: 'ENRICHMENT', description: 'Chronic vs acute split, adaptation potential, insurance coverage assessment', derivedMetrics: [{ name: 'Chronic/Acute Split', formula: 'chronic (water stress, heat) vs acute (flood, cyclone)', example: '60% chronic / 40% acute' }, { name: 'Adaptation Score', formula: 'company disclosed adaptation measures effectiveness', example: 'Moderate: 40% of exposure has mitigation plan' }], dbTable: 'analytics.physical_risk_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio physical VaR aggregated with spatial diversification', methodology: 'PCAF-attributed physical VaR with geographic diversification benefit', formula: 'Portfolio Physical VaR = sum(attribution * company_var) * (1 - geo_diversification)', example: { portfolio_physical_var: 0.042, diversification: 0.25 }, dbTable: 'analytics.portfolio_physical_var', consumers: ['climate-physical-risk', 'portfolio-climate-var'] },
      { stage: 'INTERPRETATION', description: 'Physical risk contextualized by geography and hazard type', interpretations: [{ context: 'SSP2-4.5', value: '-4.2% portfolio value at risk from physical hazards by 2050' }, { context: 'SSP5-8.5', value: '-7.8% in high-warming scenario -> 86% increase in physical risk' }] },
      { stage: 'PRESENTATION', description: 'Geospatial physical risk map with hazard layers', presentations: [{ module: 'climate-physical-risk', tab: 'Risk Map', viz: 'Interactive map: company assets color-coded by physical VaR', value: '-4.2% VaR' }] },
      { stage: 'ACTION', description: 'High physical exposure triggers engagement on adaptation', actions: [{ trigger: 'Single-asset concentration > 20% of company revenue in high-risk zone', action: 'Engagement on business continuity and adaptation plan', module: 'climate-physical-risk' }] },
    ],
  },

  // -- MJ029: Transition Risk PD --
  {
    id: 'MJ029',
    metric: 'Transition Risk-Adjusted Probability of Default',
    unit: 'basis points PD adjustment',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Climate-adjusted PD overlay combining carbon intensity, stranded asset exposure, and policy risk', source: 'Internal credit model + NGFS scenarios + company carbon data', frequency: 'Quarterly PD recalculation', quality: 'Model-dependent; regulatory guidance from ECB/EBA still evolving', example: { company: 'RWE AG', base_pd_bps: 45, transition_adjustment_bps: 12, adjusted_pd: 57 } },
      { stage: 'INGESTION', description: 'Base PD combined with climate risk factors for overlay calculation', dbTable: 'analytics.transition_pd_staging', dbColumns: ['company_profile_id', 'base_pd', 'carbon_intensity', 'stranded_asset_pct', 'policy_exposure_score'], validation: 'Base PD from approved credit model', example: { row: { base_pd: 0.0045, carbon_intensity: 1850, stranded_pct: 35 } } },
      { stage: 'VALIDATION', description: 'Model parameter bounds, scenario consistency, backtesting results', checks: ['Climate adjustment < 50% of base PD (reasonableness cap)', 'Scenario parameters from approved NGFS version', 'Backtested against historical default patterns'], dbTable: 'analytics.transition_pd_validated', qualityScore: 'Medium: emerging methodology with limited backtesting', example: { status: 'PASS', adjustment: 12 } },
      { stage: 'TRANSFORMATION', description: 'Climate-adjusted PD stored alongside base PD', dbTable: 'analytics.climate_adjusted_pd', transformation: 'adjusted_pd = base_pd * (1 + transition_factor); factor derived from carbon price sensitivity model', example: { adjusted_pd_bps: 57, transition_add_on: 12 } },
      { stage: 'ENRICHMENT', description: 'Sector comparison, expected loss impact, capital charge estimate', derivedMetrics: [{ name: 'Expected Loss Impact', formula: 'delta_EL = (adjusted_pd - base_pd) * LGD * EAD', example: 'Additional EL: $2.4M for this exposure' }, { name: 'Capital Impact', formula: 'incremental RWA from PD uplift', example: '+$45M RWA' }], dbTable: 'analytics.transition_pd_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio-level transition risk capital and expected loss impact', methodology: 'ECB climate stress test methodology adapted for ongoing risk management', formula: 'Portfolio EL add-on = sum(delta_pd * lgd * ead)', example: { portfolio_el_addon: 45_000_000, rwa_impact: 890_000_000 }, dbTable: 'analytics.portfolio_transition_risk', consumers: ['climate-transition-risk', 'climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'Transition PD add-on contextualized for capital planning', interpretations: [{ context: 'capital', value: '+$890M RWA from transition risk -> 0.3% CET1 ratio impact' }, { context: 'stress test', value: 'Delayed transition scenario: RWA impact doubles to $1.8B' }] },
      { stage: 'PRESENTATION', description: 'Transition PD overlay dashboard with sector heatmap', presentations: [{ module: 'climate-transition-risk', tab: 'PD Overlay', viz: 'Sector heatmap of PD add-on + top exposures table', value: '+12bps avg adjustment' }] },
      { stage: 'ACTION', description: 'Material PD uplift triggers credit limit review', actions: [{ trigger: 'Adjusted PD crosses rating boundary', action: 'Credit committee review for limit reduction', module: 'climate-transition-risk' }] },
    ],
  },

  // -- MJ030: Stranded Asset Date --
  {
    id: 'MJ030',
    metric: 'Stranded Asset Date',
    unit: 'year of economic stranding',
    category: 'Derived',
    journey: [
      { stage: 'SOURCE', description: 'Fossil fuel reserves and carbon budget analysis per IPCC remaining budget', source: 'Company reserve reports / Rystad Energy / IEA WEO / Carbon Tracker', frequency: 'Annual', quality: 'Reserve data: high | Carbon budget allocation: scenario-dependent', example: { company: 'ExxonMobil', proved_reserves_mmboe: 15_200, carbon_budget_share: 8_400, stranding_year: 2038 } },
      { stage: 'INGESTION', description: 'Reserve data and carbon budget shares loaded per energy company', dbTable: 'staging.stranded_asset_import', dbColumns: ['company_ref', 'reserve_type', 'volume_mmboe', 'carbon_content_mtco2', 'budget_scenario', 'budget_share_mtco2'], validation: 'Reserve classification (proved/probable/possible)', example: { row: { reserves: 15200, carbon_content: 6400, budget_1_5c: 4200 } } },
      { stage: 'VALIDATION', description: 'Carbon budget allocation method, reserve classification consistency', checks: ['Reserve classification per SEC/PRMS standards', 'Carbon budget from IPCC SR1.5 remaining budget', 'Allocation method: pro-rata by current production'], dbTable: 'staging.stranded_validated', qualityScore: 'High for proved reserves; speculative for probable', example: { status: 'PASS' } },
      { stage: 'TRANSFORMATION', description: 'Stranding year = when cumulative production exhausts budget share', dbTable: 'analytics.stranded_asset_date', transformation: 'stranding_year = current_year + budget_share / annual_production_rate', example: { stranding_year: 2038, reserves_at_risk_pct: 44 } },
      { stage: 'ENRICHMENT', description: 'Value at risk from stranded reserves, diversification into renewables', derivedMetrics: [{ name: 'Reserve Value at Risk', formula: 'unburnable_reserves * reserve_price', example: '$58B of reserves potentially stranded' }, { name: 'Transition Readiness', formula: 'renewable_capex / total_capex', example: '22% of capex in low-carbon' }], dbTable: 'analytics.stranded_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio stranded asset exposure aggregated', methodology: 'Exposure to companies with stranding dates before 2050', formula: 'Stranded Exposure = sum(weight where stranding_year < 2050)', example: { stranded_exposure_pct: 8.2, value: 4_100_000_000 }, dbTable: 'analytics.portfolio_stranded', consumers: ['climate-transition-risk', 'portfolio-climate-var'] },
      { stage: 'INTERPRETATION', description: 'Stranded asset risk interpreted for long-term portfolio returns', interpretations: [{ context: 'value at risk', value: '8.2% of portfolio in companies with pre-2050 stranding date -> $4.1B exposed' }, { context: 'trajectory', value: 'Stranding dates pulling earlier as carbon budgets tighten' }] },
      { stage: 'PRESENTATION', description: 'Timeline visualization of stranding dates by holding', presentations: [{ module: 'climate-transition-risk', tab: 'Stranded Assets', viz: 'Timeline: company stranding dates with exposure bars', value: '2038 median stranding' }] },
      { stage: 'ACTION', description: 'Near-term stranding triggers divestment review', actions: [{ trigger: 'Stranding date < 2035', action: 'Urgent divestment review for fossil fuel positions', module: 'climate-transition-risk' }] },
    ],
  },

  // =====================================================================
  //  REGULATORY METRICS (10 journeys: MJ031 - MJ040)
  // =====================================================================

  // -- MJ031: SFDR PAI 1 (GHG Emissions) --
  {
    id: 'MJ031',
    metric: 'SFDR PAI 1 — GHG Emissions (Scope 1+2+3)',
    unit: 'tCO2e',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'Total Scope 1+2+3 financed emissions as per SFDR RTS Annex I Table 1', source: 'Upstream: MJ001 + MJ002 + MJ003 through PCAF attribution', frequency: 'Annual (reference period = calendar year)', quality: 'PAI 1 requires all scopes; Scope 3 starting from June 2024', example: { fund: 'Article 8 ESG Fund', pai_1_s1: 12_400, pai_1_s2: 3_200, pai_1_s3: 85_000, pai_1_total: 100_600 } },
      { stage: 'INGESTION', description: 'Financed emissions for SFDR-reporting fund pulled from PCAF analytics', dbTable: 'analytics.sfdr_pai_staging', dbColumns: ['fund_id', 'reference_period', 'pai_indicator', 'value', 'unit', 'methodology'], validation: 'Fund classification (Art. 6/8/9), reference period alignment', example: { row: { fund: 'Art8_ESG', pai: 'PAI_1', scope1: 12400, scope2: 3200, scope3: 85000 } } },
      { stage: 'VALIDATION', description: 'RTS template compliance, scope completeness, calculation methodology verification', checks: ['All three scopes present (S3 mandatory from 2024)', 'Methodology consistent with RTS Annex I', 'Current vs prior period available for comparison', 'Coverage: PAI calculated on >90% of fund NAV'], dbTable: 'analytics.sfdr_pai_validated', qualityScore: 'Regulatory: must be disclosed regardless of quality', example: { status: 'PASS', coverage: '94%', methodology: 'PCAF_v2' } },
      { stage: 'TRANSFORMATION', description: 'PAI 1 values formatted per RTS template with mandatory fields', dbTable: 'analytics.sfdr_pai_disclosure', transformation: 'Format to RTS Annex I Table 1: impact, metric, current value, prior value, explanation, actions', example: { current: 100600, prior: 108200, change: '-7%', explanation: 'Portfolio decarbonization and engagement with top emitters' } },
      { stage: 'ENRICHMENT', description: 'Year-on-year change, actions taken, engagement outcomes linked', derivedMetrics: [{ name: 'YoY Change', formula: '(current - prior) / prior', example: '-7% reduction' }, { name: 'Actions Linked', formula: 'engagement outcomes tied to PAI improvement', example: '3 companies reduced emissions after engagement' }], dbTable: 'analytics.sfdr_pai_enriched' },
      { stage: 'AGGREGATION', description: 'Entity-level PAI aggregated across all SFDR-reporting funds', methodology: 'EBA/ESMA guidance: entity-level aggregate PAI statement', formula: 'Entity PAI 1 = sum across all Art. 8/9 funds', example: { entity_total: 450_000, funds: 12 }, dbTable: 'analytics.sfdr_entity_pai', consumers: ['sfdr-reporting', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'PAI 1 interpreted for SFDR entity-level disclosure narrative', interpretations: [{ context: 'narrative', value: 'Total financed GHG across 12 Art. 8/9 funds: 450K tCO2e, down 7% YoY' }, { context: 'actions', value: 'Key actions: engagement with 25 high-emitters, 3 successful reduction outcomes' }] },
      { stage: 'PRESENTATION', description: 'SFDR PAI disclosure template auto-populated', presentations: [{ module: 'sfdr-reporting', tab: 'PAI Statement', viz: 'RTS Annex I Table 1 auto-fill', value: '100.6K tCO2e (fund level)' }, { module: 'disclosure-hub', tab: 'SFDR', viz: 'Entity-level PAI dashboard', value: '450K tCO2e (entity)' }] },
      { stage: 'ACTION', description: 'PAI disclosure deadline triggers data collection and sign-off', actions: [{ trigger: 'June 30 deadline approaching', action: 'PAI calculation freeze, compliance review, board sign-off', module: 'sfdr-reporting' }, { trigger: 'PAI increased YoY', action: 'Explanation narrative required: identify causes and remedial actions', module: 'sfdr-reporting' }] },
    ],
  },

  // -- MJ032: SFDR PAI 2 (Carbon Footprint) --
  {
    id: 'MJ032',
    metric: 'SFDR PAI 2 — Carbon Footprint',
    unit: 'tCO2e per EUR M invested',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'Financed emissions normalized by EUR invested (current value of all investments)', source: 'PAI 1 (financed emissions) / fund NAV in EUR', frequency: 'Annual', quality: 'Inherited from PAI 1 quality + FX conversion accuracy', example: { fund: 'Article 9 Impact Fund', pai_2: 245, unit: 'tCO2e/EUR M' } },
      { stage: 'INGESTION', description: 'PAI 1 emissions divided by fund AUM in EUR', dbTable: 'analytics.sfdr_pai_staging', dbColumns: ['fund_id', 'pai_1_total', 'fund_nav_eur', 'pai_2_value'], validation: 'NAV in EUR at reference date', example: { row: { pai_1: 100600, nav_eur: 410_000_000, pai_2: 245 } } },
      { stage: 'VALIDATION', description: 'FX conversion date, NAV timing, PAI 1 consistency', checks: ['EUR conversion at period-end ECB rate', 'NAV from audited fund accounts', 'PAI 2 = PAI 1 / (NAV / 1M)'], dbTable: 'analytics.sfdr_pai2_validated', qualityScore: 'Inherited from PAI 1', example: { status: 'PASS', pai_2: 245 } },
      { stage: 'TRANSFORMATION', description: 'PAI 2 stored with EUR NAV reference', dbTable: 'analytics.sfdr_pai_disclosure', transformation: 'PAI 2 = total_financed_emissions / (fund_nav_eur / 1_000_000)', example: { pai_2: 245, unit: 'tCO2e/EUR M invested' } },
      { stage: 'ENRICHMENT', description: 'Peer comparison, fund-level ranking, intensity improvement tracking', derivedMetrics: [{ name: 'Peer Rank', formula: 'percentile among Art. 8/9 peers', example: 'P62 among European ESG funds' }], dbTable: 'analytics.sfdr_pai2_enriched' },
      { stage: 'AGGREGATION', description: 'Entity-level carbon footprint', methodology: 'Weighted average across funds', formula: 'Entity CF = sum(fund_emissions) / sum(fund_nav)', example: { entity_cf: 198 }, dbTable: 'analytics.sfdr_entity_pai', consumers: ['sfdr-reporting', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Carbon footprint benchmark and improvement trajectory', interpretations: [{ context: 'vs peers', value: 'PAI 2: 245 tCO2e/EUR M vs peer median 310 -> below peer average (positive)' }] },
      { stage: 'PRESENTATION', description: 'PAI 2 card on SFDR dashboard', presentations: [{ module: 'sfdr-reporting', tab: 'PAI Statement', viz: 'KPI card with YoY comparison and peer benchmark', value: '245 tCO2e/EUR M' }] },
      { stage: 'ACTION', description: 'PAI 2 increasing triggers review', actions: [{ trigger: 'PAI 2 > prior year', action: 'Mandatory explanation in PAI statement', module: 'sfdr-reporting' }] },
    ],
  },

  // -- MJ033: SFDR PAI 3 (GHG Intensity) --
  {
    id: 'MJ033',
    metric: 'SFDR PAI 3 — GHG Intensity of Investee Companies',
    unit: 'tCO2e/EUR M revenue',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'Weighted average GHG intensity of investee companies (WACI equivalent for SFDR)', source: 'MJ004 (Carbon Intensity) converted to EUR', frequency: 'Annual', quality: 'Composite: emission + revenue + FX quality', example: { fund: 'ESG Leaders Fund', pai_3: 312, unit: 'tCO2e/EUR M revenue' } },
      { stage: 'INGESTION', description: 'Company-level intensities weighted by portfolio allocation', dbTable: 'analytics.sfdr_pai3_staging', dbColumns: ['fund_id', 'company_profile_id', 'weight', 'ghg_intensity_eur'], validation: 'Revenue converted to EUR at annual average rate', example: { row: { weight: 0.032, intensity_eur: 178.5 } } },
      { stage: 'VALIDATION', description: 'EUR revenue conversion, weight sum, coverage check', checks: ['Revenue in EUR using ECB annual average rate', 'Weights sum to 100%', 'Coverage > 80% of NAV'], dbTable: 'analytics.sfdr_pai3_validated', qualityScore: 'Same as PAI 1-2', example: { status: 'PASS', pai_3: 312 } },
      { stage: 'TRANSFORMATION', description: 'WACI in EUR terms formatted for SFDR disclosure', dbTable: 'analytics.sfdr_pai_disclosure', transformation: 'PAI 3 = sum(weight * company_ghg_intensity_eur)', example: { pai_3: 312, unit: 'tCO2e/EUR M revenue' } },
      { stage: 'ENRICHMENT', description: 'Sector contribution to PAI 3, improvement actions', derivedMetrics: [{ name: 'Sector Attribution', formula: 'sector contribution to WACI', example: 'Energy: 68% of total WACI' }], dbTable: 'analytics.sfdr_pai3_enriched' },
      { stage: 'AGGREGATION', description: 'Entity-level GHG intensity', methodology: 'AUM-weighted WACI across funds', formula: 'Entity PAI 3 = sum(AUM * PAI_3) / sum(AUM)', example: { entity_pai_3: 278 }, dbTable: 'analytics.sfdr_entity_pai', consumers: ['sfdr-reporting', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'PAI 3 provides intensity view complementing absolute PAI 1', interpretations: [{ context: 'complementary', value: 'PAI 3 (intensity) adjusts for portfolio size; PAI 1 (absolute) does not' }] },
      { stage: 'PRESENTATION', description: 'PAI 3 in SFDR disclosure template', presentations: [{ module: 'sfdr-reporting', tab: 'PAI Statement', viz: 'PAI 3 row in Table 1 with sector decomposition', value: '312 tCO2e/EUR M' }] },
      { stage: 'ACTION', description: 'PAI 3 feeds into Article 8/9 product monitoring', actions: [{ trigger: 'PAI 3 > category benchmark', action: 'Product classification review: does fund still meet Art. 8/9 commitments?', module: 'sfdr-reporting' }] },
    ],
  },

  // -- MJ034: EU Taxonomy GAR (Regulatory Filing) --
  {
    id: 'MJ034',
    metric: 'EU Taxonomy GAR — EBA Pillar 3 Filing',
    unit: '% of covered assets',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'Detailed Taxonomy GAR per EBA ITS templates for credit institutions', source: 'MJ008 (GAR) formatted per EBA ITS on Pillar 3 ESG', frequency: 'Annual (semi-annual starting 2025)', quality: 'Regulatory filing: must meet EBA data quality standards', example: { bank: 'BNP Paribas', gar_turnover: 24.5, gar_capex: 31.2, gar_opex: 18.8 } },
      { stage: 'INGESTION', description: 'Taxonomy alignment data structured per EBA template rows', dbTable: 'analytics.eba_gar_staging', dbColumns: ['entity_id', 'kpi_type', 'objective', 'nace_sector', 'eligible_eur', 'aligned_eur', 'total_covered_eur'], validation: 'EBA template schema validation', example: { row: { kpi: 'turnover', objective: 'climate_mitigation', aligned: 8_200_000_000 } } },
      { stage: 'VALIDATION', description: 'EBA template completeness, NACE sector mapping, DNSH compliance', checks: ['All mandatory rows populated', 'NACE mapping consistent with EU Taxonomy Delegated Acts', 'DNSH and minimum safeguards evidence trail', 'Total covered = sum of all exposures as defined by CRR Art. 449a'], dbTable: 'analytics.eba_gar_validated', qualityScore: 'Regulatory: subject to supervisory review', example: { status: 'PASS', completeness: '100%' } },
      { stage: 'TRANSFORMATION', description: 'GAR computed per KPI and objective, stored in EBA ITS format', dbTable: 'analytics.eba_pillar3_gar', transformation: 'GAR = aligned_exposure / total_covered_exposure per KPI and objective', example: { gar_turnover: 24.5, gar_capex: 31.2 } },
      { stage: 'ENRICHMENT', description: 'Peer comparison, trend, regulatory expectation alignment', derivedMetrics: [{ name: 'Peer Benchmark', formula: 'GAR vs EU bank median', example: '24.5% vs median 18% -> above average' }], dbTable: 'analytics.eba_gar_enriched' },
      { stage: 'AGGREGATION', description: 'Group-level GAR across all covered exposures', methodology: 'EBA ITS on Pillar 3 ESG disclosures', formula: 'Group GAR = consolidated aligned / consolidated covered', example: { group_gar: 24.5 }, dbTable: 'analytics.eba_group_gar', consumers: ['disclosure-hub', 'eu-taxonomy-dashboard'] },
      { stage: 'INTERPRETATION', description: 'GAR as indicator of green lending strategy effectiveness', interpretations: [{ context: 'strategy', value: 'GAR 24.5% reflects green lending strategy; target 35% by 2027' }] },
      { stage: 'PRESENTATION', description: 'EBA Pillar 3 template auto-populated with sign-off workflow', presentations: [{ module: 'disclosure-hub', tab: 'EBA Pillar 3', viz: 'EBA ITS template with auto-fill and validation status', value: 'GAR 24.5%' }] },
      { stage: 'ACTION', description: 'Filing deadline triggers data freeze and sign-off', actions: [{ trigger: 'Filing deadline T-30 days', action: 'Data freeze, validation sweep, board sign-off initiation', module: 'disclosure-hub' }] },
    ],
  },

  // -- MJ035: CSRD E1 Emissions Disclosure --
  {
    id: 'MJ035',
    metric: 'CSRD ESRS E1 — Climate Change Emissions Disclosure',
    unit: 'tCO2e + narrative',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'ESRS E1 requires S1+S2+S3 emissions, targets, transition plan, and financial effects', source: 'MJ001-MJ003 (emissions) + MJ011 (TPT) + MJ007 (CVaR) for financial materiality', frequency: 'Annual (first reports FY2024 for large PIEs)', quality: 'Must meet ESRS quality requirements; limited assurance initially', example: { company: 'Siemens', esrs_e1_s1: 800_000, esrs_e1_s2: 150_000, esrs_e1_s3: 5_200_000 } },
      { stage: 'INGESTION', description: 'ESRS E1 datapoints mapped from emissions database and transition assessments', dbTable: 'analytics.csrd_e1_staging', dbColumns: ['company_id', 'datapoint_ref', 'value', 'unit', 'narrative', 'cross_ref_to_financials'], validation: 'ESRS datapoint catalogue mapping (E1-1 through E1-9)', example: { row: { datapoint: 'E1-6_Gross_Scope1', value: 800000, unit: 'tCO2e' } } },
      { stage: 'VALIDATION', description: 'ESRS disclosure requirement completeness, double materiality assessment', checks: ['All mandatory E1 datapoints present', 'Materiality assessment documented', 'Limited assurance readiness', 'Financial effects quantified where material'], dbTable: 'analytics.csrd_e1_validated', qualityScore: 'CSRD: auditor-reviewed', example: { status: 'PASS', completeness: '92%', mandatory_met: true } },
      { stage: 'TRANSFORMATION', description: 'ESRS E1 structured disclosure package prepared', dbTable: 'analytics.csrd_e1_disclosure', transformation: 'Datapoints formatted per EFRAG XBRL taxonomy; narrative sections drafted', example: { package: 'E1_Siemens_FY2024', datapoints: 45, narratives: 8 } },
      { stage: 'ENRICHMENT', description: 'Cross-reference with other ESRS standards (E2-E5, S1-S4, G1)', derivedMetrics: [{ name: 'E1 Completeness', formula: 'populated_datapoints / required_datapoints', example: '92% complete' }], dbTable: 'analytics.csrd_e1_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio CSRD readiness and E1 quality across investee companies', methodology: 'Weight-averaged CSRD readiness; coverage analysis', formula: 'CSRD Coverage = count(companies with E1 disclosure) / total_eu_investees', example: { coverage: '68%', avg_completeness: '85%' }, dbTable: 'analytics.portfolio_csrd', consumers: ['disclosure-hub', 'csrd-automation'] },
      { stage: 'INTERPRETATION', description: 'CSRD compliance as data quality improvement driver', interpretations: [{ context: 'data quality', value: 'CSRD will improve S1+S2 data quality for EU companies from DQS 3 avg to DQS 1-2' }] },
      { stage: 'PRESENTATION', description: 'CSRD E1 template with auto-fill and gap analysis', presentations: [{ module: 'csrd-automation', tab: 'ESRS E1', viz: 'Template with populated fields, gap flags, and narrative drafts', value: '92% complete' }] },
      { stage: 'ACTION', description: 'Incomplete E1 triggers engagement with investee companies', actions: [{ trigger: 'EU investee missing E1 disclosure', action: 'Engagement on CSRD readiness support', module: 'csrd-automation' }] },
    ],
  },

  // -- MJ036: UK SDR Label Classification --
  {
    id: 'MJ036',
    metric: 'UK SDR — Sustainability Label Classification',
    unit: 'label category',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'Fund characteristics assessed against FCA SDR label criteria (Focus/Improvers/Impact/Mixed Goals)', source: 'Fund documentation + sustainability objective + KPIs + investment policy', frequency: 'Continuous (label maintained)', quality: 'Regulatory: FCA-approved labeling', example: { fund: 'UK Stewardship Fund', label: 'Sustainability Improvers', basis: 'Measurable improvement in sustainability profile over time' } },
      { stage: 'INGESTION', description: 'Fund-level SDR characteristics and KPIs loaded', dbTable: 'analytics.sdr_classification_staging', dbColumns: ['fund_id', 'sustainability_objective', 'kpi_set', 'baseline_metrics', 'improvement_targets'], validation: 'FCA SDR Regulation schedule criteria mapping', example: { row: { objective: 'Improve carbon intensity -30% by 2028', kpi: 'WACI', baseline: 312 } } },
      { stage: 'VALIDATION', description: 'Label qualification criteria check against FCA rules', checks: ['Objective clear and measurable', 'KPIs quantified with baseline and target', 'Investment policy consistent with label', 'Consumer-facing disclosure meets naming and marketing rules'], dbTable: 'analytics.sdr_validated', qualityScore: 'Regulatory: subject to FCA supervision', example: { status: 'PASS', label: 'Sustainability Improvers' } },
      { stage: 'TRANSFORMATION', description: 'SDR label and ongoing monitoring metrics stored', dbTable: 'analytics.sdr_labels', transformation: 'Label assigned + monitoring dashboard configured with KPIs', example: { fund_id: 15, label: 'Sustainability Improvers', kpis: ['WACI', 'ESG_Consensus', 'Engagement_Rate'] } },
      { stage: 'ENRICHMENT', description: 'KPI progress tracking against sustainability objective', derivedMetrics: [{ name: 'KPI Progress', formula: 'current vs target trajectory', example: 'WACI: 285 vs target 218 by 2028 -> on track (-6%/yr needed, achieving -4%/yr)' }], dbTable: 'analytics.sdr_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level SDR product breakdown', methodology: 'Count and AUM by label category', formula: 'Firm SDR = categorize all UK-distributed funds', example: { improvers: 4, focus: 2, impact: 1, unlabeled: 8, total_labeled_aum: 12_000_000_000 }, dbTable: 'analytics.sdr_firm', consumers: ['uk-sdr-module', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'SDR labeling as competitive differentiator and compliance requirement', interpretations: [{ context: 'compliance', value: '7 of 15 UK funds labeled -> 47% labeling rate, above industry average' }] },
      { stage: 'PRESENTATION', description: 'SDR label dashboard with KPI monitoring', presentations: [{ module: 'uk-sdr-module', tab: 'Label Management', viz: 'Fund cards with label, KPIs, and progress indicators', value: '7 labeled funds' }] },
      { stage: 'ACTION', description: 'KPI underperformance risks label loss', actions: [{ trigger: 'KPI off-track for 2 consecutive quarters', action: 'Remediation plan to restore trajectory before FCA review', module: 'uk-sdr-module' }] },
    ],
  },

  // -- MJ037: SEC Climate Rule Reg S-K --
  {
    id: 'MJ037',
    metric: 'SEC Climate Rule — Reg S-K Climate Disclosure',
    unit: 'S1+S2 tCO2e + qualitative',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'SEC final rule requires Scope 1+2 emissions disclosure for Large Accelerated Filers + climate risk narrative', source: 'Company emission data (MJ001-MJ002) + governance and risk management processes', frequency: 'Annual (phased: LAF from FY2025, AF from FY2026)', quality: 'SEC-filed: subject to SOX controls and audit', example: { company: 'Apple Inc', scope1_2: 3_380_000, governance: 'Board-level climate committee', strategy: 'Net zero by 2030' } },
      { stage: 'INGESTION', description: 'S1+S2 emissions + risk governance + financial statement effects loaded', dbTable: 'analytics.sec_climate_staging', dbColumns: ['company_ref', 'filer_status', 'scope1_tco2e', 'scope2_tco2e', 'governance_narrative', 'risk_management_narrative', 'financial_effects'], validation: 'Filer status determination (LAF/AF/NAF)', example: { row: { filer: 'LAF', scope1: 1200000, scope2: 2180000 } } },
      { stage: 'VALIDATION', description: 'Filer status classification, emission attestation readiness, GHG Protocol compliance', checks: ['Filer category correct per SEC rules', 'GHG Protocol methodology applied', 'Attestation: limited assurance required for LAF', 'Material climate expenditure disclosed'], dbTable: 'analytics.sec_climate_validated', qualityScore: 'SEC-filed: highest quality expectation', example: { status: 'PASS', attestation: 'limited_assurance' } },
      { stage: 'TRANSFORMATION', description: 'SEC disclosure package formatted per Reg S-K Item 1502-1504', dbTable: 'analytics.sec_climate_disclosure', transformation: 'Item 1502 (Governance), Item 1503 (Strategy/Risk Mgmt), Item 1504 (Metrics/Targets)', example: { items_complete: true } },
      { stage: 'ENRICHMENT', description: 'Peer comparison for SEC registrants, compliance monitoring', derivedMetrics: [{ name: 'Peer Compliance Rate', formula: 'SEC registrants with climate disclosure / total registrants', example: '78% of LAF have disclosed for FY2025' }], dbTable: 'analytics.sec_climate_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio exposure to SEC climate rule registrants and compliance status', methodology: 'Count and AUM exposure to SEC registrants by compliance status', formula: 'Compliance Rate = compliant_registrants / total_registrants', example: { registrant_count: 180, compliant: 140, compliance_rate: '78%' }, dbTable: 'analytics.portfolio_sec_climate', consumers: ['sec-climate-rule', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'SEC rule compliance as data quality catalyst for US holdings', interpretations: [{ context: 'data quality', value: 'SEC rule will improve US-listed DQS from avg 3.2 to 1.5 for S1+S2' }] },
      { stage: 'PRESENTATION', description: 'SEC climate disclosure monitoring dashboard', presentations: [{ module: 'sec-climate-rule', tab: 'Compliance Monitor', viz: 'Registrant compliance grid + timeline to deadlines', value: '78% compliant' }] },
      { stage: 'ACTION', description: 'Non-compliant registrant triggers engagement', actions: [{ trigger: 'Registrant missing SEC climate filing', action: 'Engagement on disclosure readiness', module: 'sec-climate-rule' }] },
    ],
  },

  // -- MJ038: TCFD Strategy Metric --
  {
    id: 'MJ038',
    metric: 'TCFD Strategy — Climate Scenario Analysis',
    unit: 'narrative + quantified risk',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'TCFD Strategy pillar requires scenario analysis across 1.5C, 2C, and >3C pathways', source: 'MJ007 (CVaR) + NGFS scenarios + internal risk models', frequency: 'Annual (TCFD report)', quality: 'Model-dependent; disclosure quality varies widely', example: { entity: 'Asset Manager X', scenarios: 3, time_horizons: ['2030', '2050'], quantified: true } },
      { stage: 'INGESTION', description: 'Scenario analysis outputs consolidated from CVaR model', dbTable: 'analytics.tcfd_strategy_staging', dbColumns: ['entity_id', 'scenario', 'horizon', 'physical_impact', 'transition_impact', 'resilience_assessment'], validation: 'TCFD recommendation alignment check', example: { row: { scenario: 'Net Zero 2050', horizon: 2050, transition_impact: -0.06 } } },
      { stage: 'VALIDATION', description: 'Scenario specification adequacy, time horizon coverage, quantification quality', checks: ['At least 3 scenarios (orderly, disorderly, hot house)', 'Short, medium, and long-term horizons', 'Quantified financial impact where feasible', 'Resilience narrative addresses all scenarios'], dbTable: 'analytics.tcfd_strategy_validated', qualityScore: 'High: fully quantified | Medium: partial quantification | Low: qualitative only', example: { status: 'PASS', quantification: 'full' } },
      { stage: 'TRANSFORMATION', description: 'TCFD strategy pillar output packaged for report', dbTable: 'analytics.tcfd_strategy', transformation: 'Structured narrative + scenario table + risk heatmap', example: { package: 'TCFD_Strategy_2024', sections: ['scenario_description', 'impact_quantification', 'resilience_assessment'] } },
      { stage: 'ENRICHMENT', description: 'TCFD alignment score, peer comparison, gap analysis', derivedMetrics: [{ name: 'TCFD Alignment Score', formula: 'coverage of 11 TCFD recommendations', example: '9/11 recommendations addressed = 82%' }], dbTable: 'analytics.tcfd_enriched' },
      { stage: 'AGGREGATION', description: 'TCFD disclosure quality across investee companies', methodology: 'TCFD Implementation Index scoring', formula: 'Portfolio TCFD Score = sum(weight * tcfd_alignment_score)', example: { portfolio_tcfd: 68 }, dbTable: 'analytics.portfolio_tcfd', consumers: ['disclosure-hub', 'issb-disclosure'] },
      { stage: 'INTERPRETATION', description: 'TCFD strategy as investor communication tool', interpretations: [{ context: 'stakeholder', value: 'Fully quantified scenario analysis demonstrates fiduciary risk management' }] },
      { stage: 'PRESENTATION', description: 'TCFD report section with scenario charts', presentations: [{ module: 'disclosure-hub', tab: 'TCFD', viz: 'Scenario fan chart + resilience narrative', value: 'TCFD Strategy section' }] },
      { stage: 'ACTION', description: 'TCFD report deadline triggers data compilation', actions: [{ trigger: 'TCFD report cycle start', action: 'Initiate scenario analysis refresh and narrative drafting', module: 'disclosure-hub' }] },
    ],
  },

  // -- MJ039: ISSB S2 Physical Risk --
  {
    id: 'MJ039',
    metric: 'ISSB IFRS S2 — Climate-Related Physical Risk Disclosure',
    unit: 'asset-level exposure + financial impact',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'IFRS S2 requires disclosure of physical risk exposure, vulnerability, and financial effects', source: 'MJ028 (Physical VaR) + asset location data + insurance coverage', frequency: 'Annual (S2 effective from January 2025)', quality: 'Asset-level geocoding + climate model resolution', example: { company: 'TSMC', physical_risk: 'water_stress + flood', financial_effect: 'revenue_at_risk_12%', concentration: 'Taiwan_85%' } },
      { stage: 'INGESTION', description: 'Physical risk exposure mapped to IFRS S2 disclosure requirements', dbTable: 'analytics.issb_s2_physical_staging', dbColumns: ['company_ref', 'hazard', 'exposure_value', 'vulnerability', 'financial_effect', 'adaptation_plan'], validation: 'IFRS S2 para 21-22 alignment', example: { row: { hazard: 'water_stress', exposure: 0.12, adaptation: 'diversification_plan' } } },
      { stage: 'VALIDATION', description: 'IFRS S2 disclosure completeness, quantification standards', checks: ['Current and anticipated physical risks identified', 'Financial effects quantified or explained', 'Resilience of strategy assessed', 'Geographic concentration disclosed'], dbTable: 'analytics.issb_s2_validated', qualityScore: 'Subject to assurance per IFRS S2 requirements', example: { status: 'PASS', completeness: '88%' } },
      { stage: 'TRANSFORMATION', description: 'IFRS S2 physical risk section formatted', dbTable: 'analytics.issb_s2_disclosure', transformation: 'Structured per S2 paragraphs 21-22 with quantified financial effects', example: { sections: ['risk_identification', 'financial_effects', 'resilience'] } },
      { stage: 'ENRICHMENT', description: 'Cross-framework mapping (ISSB to CSRD to TCFD)', derivedMetrics: [{ name: 'Framework Interop', formula: 'ISSB S2 maps to CSRD E1 and TCFD Strategy', example: 'Single data collection serves 3 frameworks' }], dbTable: 'analytics.issb_s2_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio ISSB S2 disclosure quality and physical risk exposure', methodology: 'Weight-averaged disclosure quality + aggregate physical exposure', formula: 'Portfolio S2 Coverage = count(S2_compliant) / total_holdings', example: { s2_coverage: '52%', physical_exposure: 0.042 }, dbTable: 'analytics.portfolio_issb', consumers: ['issb-disclosure', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'ISSB S2 as global baseline for physical risk disclosure', interpretations: [{ context: 'convergence', value: 'ISSB S2 adopted in 20+ jurisdictions -> standardized physical risk data forthcoming' }] },
      { stage: 'PRESENTATION', description: 'ISSB S2 disclosure template with pre-populated fields', presentations: [{ module: 'issb-disclosure', tab: 'IFRS S2 Physical', viz: 'Template with auto-fill from physical risk model', value: '52% coverage' }] },
      { stage: 'ACTION', description: 'Low S2 coverage triggers data collection engagement', actions: [{ trigger: 'Company in ISSB-adopting jurisdiction without S2 disclosure', action: 'Engagement on S2 readiness', module: 'issb-disclosure' }] },
    ],
  },

  // -- MJ040: EBA Pillar 3 ESG Risk --
  {
    id: 'MJ040',
    metric: 'EBA Pillar 3 ESG — Prudential Disclosure',
    unit: 'multiple templates',
    category: 'Regulatory',
    journey: [
      { stage: 'SOURCE', description: 'EBA ITS on Pillar 3 ESG requires credit quality by ESG risk, transition, and physical risk data', source: 'Internal credit book + climate risk models + EU Taxonomy alignment', frequency: 'Annual (semi-annual from 2025)', quality: 'Regulatory filing: supervisory review quality', example: { bank: 'Deutsche Bank', templates: 10, scope: 'Banking book + trading book' } },
      { stage: 'INGESTION', description: 'Credit exposures segmented by NACE sector, maturity, and climate risk for EBA templates', dbTable: 'analytics.eba_p3_staging', dbColumns: ['entity_id', 'template_ref', 'nace_sector', 'maturity_bucket', 'exposure_eur', 'transition_risk_class', 'physical_risk_class'], validation: 'EBA ITS template structure validation', example: { row: { template: 'Template_1_Banking_Book', nace: 'C.24_Steel', exposure: 2_400_000_000 } } },
      { stage: 'VALIDATION', description: 'Completeness of all 10 EBA templates, sector mapping accuracy, risk classification', checks: ['All 10 templates populated', 'NACE 4-digit classification for all exposures', 'Maturity buckets: <5yr, 5-10yr, 10-20yr, >20yr', 'Transition and physical risk class per EBA guidance'], dbTable: 'analytics.eba_p3_validated', qualityScore: 'Regulatory: must pass EBA quality checks', example: { status: 'PASS', templates_complete: 10 } },
      { stage: 'TRANSFORMATION', description: 'EBA Pillar 3 ESG templates populated and formatted', dbTable: 'analytics.eba_pillar3_disclosure', transformation: '10 templates per EBA ITS: banking book climate, taxonomy, top-20 carbon-intensive, scope 3 financed', example: { templates: 10, exposures_covered_eur: 450_000_000_000 } },
      { stage: 'ENRICHMENT', description: 'Peer comparison, trend vs prior filing, gap analysis', derivedMetrics: [{ name: 'High-Carbon Exposure', formula: 'NACE sectors with high transition risk / total', example: '18% of banking book in high-carbon NACE sectors' }], dbTable: 'analytics.eba_p3_enriched' },
      { stage: 'AGGREGATION', description: 'Group-level consolidated Pillar 3 ESG', methodology: 'EBA consolidation requirements', formula: 'Group level = consolidated exposures across all entities', example: { group_total_exposure: 450_000_000_000, high_carbon_pct: 18 }, dbTable: 'analytics.eba_p3_group', consumers: ['disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Pillar 3 ESG as supervisory tool and market discipline mechanism', interpretations: [{ context: 'supervisory', value: '18% high-carbon exposure -> within ECB supervisory expectation range (15-25%)' }] },
      { stage: 'PRESENTATION', description: 'EBA Pillar 3 ESG template pack with validation status', presentations: [{ module: 'disclosure-hub', tab: 'EBA Pillar 3 ESG', viz: '10 EBA templates with auto-fill and QA status indicators', value: '10 templates ready' }] },
      { stage: 'ACTION', description: 'Filing deadline drives end-to-end workflow', actions: [{ trigger: 'Filing deadline T-60 days', action: 'Initiate data freeze, template population, quality assurance, sign-off chain', module: 'disclosure-hub' }] },
    ],
  },

  // =====================================================================
  //  AGGREGATED INSIGHTS (10 journeys: MJ041 - MJ050)
  // =====================================================================

  // -- MJ041: Portfolio Net Zero Alignment --
  {
    id: 'MJ041',
    metric: 'Portfolio Net Zero Alignment Score',
    unit: '% portfolio aligned to net zero by 2050',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Composite of temperature score, SBTi targets, and transition plan credibility across all holdings', source: 'MJ006 (Temperature) + MJ011 (TPT) + MJ020 (Credibility) + SBTi targets', frequency: 'Quarterly', quality: 'Multi-factor composite; varies by component', example: { portfolio: 'Global Equity', aligned_pct: 42, achieving_pct: 18, committed_pct: 24, not_aligned_pct: 58 } },
      { stage: 'INGESTION', description: 'Holding-level net zero classification from multiple upstream scores', dbTable: 'analytics.nz_alignment_staging', dbColumns: ['portfolio_id', 'holding_id', 'weight', 'nz_category', 'temperature', 'sbti_status', 'credibility'], validation: 'All classification inputs available', example: { row: { company: 'Shell', weight: 0.028, category: 'Committed', temperature: 2.8, sbti: 'committed' } } },
      { stage: 'VALIDATION', description: 'Classification consistency, methodology alignment with NZAM/PAII framework', checks: ['Classification per IIGCC Net Zero Investment Framework', 'Categories: Achieving, Aligned, Aligning, Committed, Not Aligned', 'All holdings classified (no unclassified > 5% by weight)'], dbTable: 'analytics.nz_alignment_validated', qualityScore: 'Framework-dependent; IIGCC NZIF is leading standard', example: { status: 'PASS', unclassified: '2%' } },
      { stage: 'TRANSFORMATION', description: 'Portfolio-level alignment distribution stored', dbTable: 'analytics.portfolio_nz_alignment', transformation: 'Categorize each holding; weight-average categories', example: { achieving: 18, aligned: 12, aligning: 12, committed: 24, not_aligned: 34 } },
      { stage: 'ENRICHMENT', description: 'Alignment trajectory, engagement leverage, exclusion candidates', derivedMetrics: [{ name: 'Alignment Velocity', formula: 'QoQ change in aligned + achieving %', example: '+2pp last quarter' }, { name: 'Engagement Leverage', formula: 'committeed + aligning as engagement opportunity', example: '36% of portfolio is engagement opportunity' }], dbTable: 'analytics.nz_alignment_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level net zero alignment across all portfolios', methodology: 'NZAM commitment: 100% net zero by 2050 across AUM', formula: 'Firm NZ Alignment = sum(AUM * aligned_pct) / total_AUM', example: { firm_aligned: 38, firm_aum: 120_000_000_000 }, dbTable: 'analytics.firm_nz_alignment', consumers: ['net-zero-tracker', 'disclosure-hub', 'transition-planning-hub'] },
      { stage: 'INTERPRETATION', description: 'Net zero alignment as headline commitment metric', interpretations: [{ context: 'NZAM', value: '38% aligned at firm level vs NZAM 2030 interim target of 50%' }, { context: 'trend', value: '+8pp improvement in 12 months driven by engagement and SBTi uptake' }] },
      { stage: 'PRESENTATION', description: 'Net zero tracker dashboard with alignment waterfall', presentations: [{ module: 'net-zero-tracker', tab: 'Alignment Dashboard', viz: 'Stacked bar by IIGCC category + trajectory line', value: '42% aligned' }, { module: 'disclosure-hub', tab: 'NZAM Report', viz: 'Annual NZAM reporting template', value: 'Firm: 38%' }] },
      { stage: 'ACTION', description: 'Alignment below glidepath triggers action plan refresh', actions: [{ trigger: 'Firm alignment < NZAM glidepath', action: 'Refresh net zero action plan: identify engagement, tilting, and exclusion levers', module: 'net-zero-tracker' }, { trigger: 'Not Aligned > 40%', action: 'Prioritize top-50 not-aligned for engagement or portfolio review', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ042: Engagement Pipeline Progress --
  {
    id: 'MJ042',
    metric: 'Engagement Pipeline Progress',
    unit: '% milestones achieved',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Tracking of engagement activities (letters, meetings, escalations) and milestone achievements', source: 'Internal CRM / Engagement tracking system / Proxy voting records', frequency: 'Continuous (event-driven)', quality: 'Internal data: high accuracy but subjective milestone assessment', example: { campaigns: 42, active: 35, milestones_hit: 68, escalations: 8 } },
      { stage: 'INGESTION', description: 'Engagement records linked to company profiles and ESG themes', dbTable: 'analytics.engagement_staging', dbColumns: ['campaign_id', 'company_profile_id', 'theme', 'start_date', 'milestones_json', 'status', 'last_activity'], validation: 'Campaign completeness, milestone definition check', example: { row: { campaign: 'Shell_Climate_2023', theme: 'net_zero', milestones: 4, achieved: 2 } } },
      { stage: 'VALIDATION', description: 'Milestone definition consistency, outcome attribution rigor', checks: ['Milestones clearly defined at campaign start', 'Outcomes attributable (not coincidental)', 'Escalation pathway documented', 'Timeline within reasonable bounds'], dbTable: 'analytics.engagement_validated', qualityScore: 'Subjective component: milestone assessment involves judgment', example: { status: 'PASS', campaigns_valid: 42 } },
      { stage: 'TRANSFORMATION', description: 'Campaign-level progress scores stored with timeline', dbTable: 'analytics.engagement_progress', transformation: 'progress = milestones_achieved / milestones_total per campaign', example: { campaign: 'Shell_Climate_2023', progress: 0.50, milestones: '2 of 4' } },
      { stage: 'ENRICHMENT', description: 'Theme aggregation, success rate, portfolio impact', derivedMetrics: [{ name: 'Theme Success Rate', formula: 'successful_campaigns / total by theme', example: 'Climate: 45% milestone rate vs Governance: 62%' }, { name: 'Portfolio Impact', formula: 'if milestone achieved, estimated emission reduction', example: '3 companies set SBTi targets -> est. 2M tCO2e reduction' }], dbTable: 'analytics.engagement_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level engagement pipeline metrics', methodology: 'Count-based and weight-based aggregation', formula: 'Overall Progress = sum(achieved) / sum(milestones)', example: { overall_progress: 0.48, active_campaigns: 35, successful: 12 }, dbTable: 'analytics.firm_engagement', consumers: ['transition-planning-hub', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Engagement effectiveness for stewardship reporting', interpretations: [{ context: 'stewardship', value: '48% milestone rate -> above PRI median 35%' }, { context: 'impact', value: '12 successful campaigns linked to measurable ESG improvement' }] },
      { stage: 'PRESENTATION', description: 'Engagement pipeline with Kanban board and milestone tracking', presentations: [{ module: 'transition-planning-hub', tab: 'Engagement Pipeline', viz: 'Kanban board (stages) + milestone progress bars per campaign', value: '35 active campaigns' }] },
      { stage: 'ACTION', description: 'Stalled campaigns trigger escalation', actions: [{ trigger: 'Campaign stalled > 12 months without milestone', action: 'Escalation to voting/divestment consideration', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ043: Board Report Overall Score --
  {
    id: 'MJ043',
    metric: 'Board Report — Overall ESG Risk Score',
    unit: '0-100 composite',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Executive summary composite combining climate, ESG, controversy, and compliance metrics', source: 'All upstream metrics: MJ001-MJ042', frequency: 'Quarterly board reporting cycle', quality: 'Composite: aggregation of all underlying quality scores', example: { quarter: 'Q4 2024', overall: 68, climate: 62, esg: 72, controversy: 55, compliance: 82 } },
      { stage: 'INGESTION', description: 'Pre-computed pillar scores pulled from respective analytics tables', dbTable: 'analytics.board_report_staging', dbColumns: ['reporting_period', 'climate_score', 'esg_score', 'controversy_score', 'compliance_score', 'data_quality_score'], validation: 'All pillar scores available and current', example: { row: { climate: 62, esg: 72, controversy: 55, compliance: 82 } } },
      { stage: 'VALIDATION', description: 'Pillar score currency check, anomaly detection in quarter-on-quarter changes', checks: ['All pillar data from same reference period', 'QoQ change < 15 points per pillar (anomaly flag)', 'Underlying data completeness > 80%'], dbTable: 'analytics.board_report_validated', qualityScore: 'Composite of underlying pillar qualities', example: { status: 'PASS', qoq_change: '+2.1' } },
      { stage: 'TRANSFORMATION', description: 'Weighted composite score with configurable pillar weights', dbTable: 'analytics.board_report', transformation: 'Overall = 0.35*climate + 0.25*esg + 0.20*controversy + 0.20*compliance', example: { overall: 68 } },
      { stage: 'ENRICHMENT', description: 'Trend, peer rank, key driver analysis', derivedMetrics: [{ name: 'Key Driver', formula: 'pillar with largest QoQ change', example: 'Controversy improved +5 pts (resolved Meta lawsuit)' }, { name: 'Risk Rating', formula: 'overall < 40: High Risk; 40-60: Moderate; > 60: Low Risk', example: 'Low Risk (68)' }], dbTable: 'analytics.board_report_enriched' },
      { stage: 'AGGREGATION', description: 'Group-level ESG risk score', methodology: 'AUM-weighted across all portfolios', formula: 'Group Score = sum(AUM * overall) / total_AUM', example: { group_score: 65 }, dbTable: 'analytics.board_report_group', consumers: ['climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'Board-ready narrative with traffic light indicators', interpretations: [{ context: 'board', value: 'Overall 68 (Low Risk): Climate pillar slightly below target; Compliance strong' }, { context: 'action items', value: '3 priority action items for board consideration' }] },
      { stage: 'PRESENTATION', description: 'Executive dashboard with traffic light summary', presentations: [{ module: 'climate-banking-hub', tab: 'Executive Dashboard', viz: 'Traffic light scorecard (4 pillars) + trend sparklines + action items', value: 'Overall: 68' }] },
      { stage: 'ACTION', description: 'Board report triggers governance actions', actions: [{ trigger: 'Any pillar drops to Red (< 40)', action: 'Board risk committee deep-dive requested', module: 'climate-banking-hub' }] },
    ],
  },

  // -- MJ044: Cross-Framework Compliance % --
  {
    id: 'MJ044',
    metric: 'Cross-Framework Compliance Rate',
    unit: '% of requirements met',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Compliance status across SFDR, CSRD, TCFD, ISSB, UK SDR, SEC, EBA mapped to unified requirement set', source: 'MJ031-MJ040 (all regulatory metrics)', frequency: 'Quarterly', quality: 'Binary compliance per requirement; some subjective assessment', example: { total_requirements: 142, met: 118, pct: 83 } },
      { stage: 'INGESTION', description: 'Requirement-level compliance status from each regulatory module', dbTable: 'analytics.compliance_staging', dbColumns: ['framework', 'requirement_ref', 'status', 'evidence_ref', 'owner', 'deadline'], validation: 'Requirement catalogue completeness', example: { row: { framework: 'SFDR', requirement: 'PAI_1_disclosure', status: 'compliant' } } },
      { stage: 'VALIDATION', description: 'Evidence verification, deadline tracking, owner assignment', checks: ['Each requirement has assigned owner', 'Evidence documented and reviewable', 'Upcoming deadlines flagged', 'Cross-framework overlap identified to avoid duplication'], dbTable: 'analytics.compliance_validated', qualityScore: 'Internal assessment quality', example: { status: 'PASS', gaps: 24 } },
      { stage: 'TRANSFORMATION', description: 'Unified compliance matrix stored', dbTable: 'analytics.compliance_matrix', transformation: 'Binary compliance per requirement; framework x requirement grid', example: { total: 142, met: 118, pct: 83, critical_gaps: 5 } },
      { stage: 'ENRICHMENT', description: 'Gap prioritization, deadline proximity, remediation effort estimate', derivedMetrics: [{ name: 'Critical Gaps', formula: 'non-compliant with deadline < 90 days', example: '5 critical gaps requiring immediate attention' }, { name: 'Remediation Effort', formula: 'estimated person-days to close all gaps', example: '120 person-days' }], dbTable: 'analytics.compliance_enriched' },
      { stage: 'AGGREGATION', description: 'Overall compliance rate and framework-level breakdown', methodology: 'Simple count-based compliance rate', formula: 'Compliance % = met / total * 100', example: { overall: 83, sfdr: 92, csrd: 78, tcfd: 88, sec: 75 }, dbTable: 'analytics.compliance_aggregate', consumers: ['disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Compliance gaps prioritized by deadline and materiality', interpretations: [{ context: 'priority', value: '5 critical gaps: 3 CSRD E1 datapoints, 2 SFDR calculation updates' }, { context: 'trend', value: 'Compliance improved from 75% to 83% over 12 months' }] },
      { stage: 'PRESENTATION', description: 'Compliance heatmap across frameworks', presentations: [{ module: 'disclosure-hub', tab: 'Compliance Matrix', viz: 'Framework x requirement heatmap (green/amber/red)', value: '83% compliant' }] },
      { stage: 'ACTION', description: 'Gaps trigger remediation workflow', actions: [{ trigger: 'Critical gap with deadline < 30 days', action: 'Emergency remediation sprint assigned to gap owner', module: 'disclosure-hub' }] },
    ],
  },

  // -- MJ045: Data Quality Portfolio Average --
  {
    id: 'MJ045',
    metric: 'Data Quality Portfolio Average',
    unit: 'composite score 0-100',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Meta-metric tracking data quality across all ESG data consumed by the platform', source: 'All upstream data sources: coverage, timeliness, accuracy, consistency', frequency: 'Monthly', quality: 'Quality of quality measurement; requires calibration', example: { portfolio: 'Global Equity', dq_overall: 72, coverage: 88, timeliness: 65, accuracy: 78, consistency: 62 } },
      { stage: 'INGESTION', description: 'Quality dimensions computed per data domain and holding', dbTable: 'analytics.data_quality_staging', dbColumns: ['portfolio_id', 'holding_id', 'domain', 'coverage_score', 'timeliness_score', 'accuracy_score', 'consistency_score'], validation: 'All four dimensions computed', example: { row: { domain: 'emissions', coverage: 94, timeliness: 72, accuracy: 85, consistency: 68 } } },
      { stage: 'VALIDATION', description: 'Dimension calibration against known benchmarks', checks: ['Coverage: % of holdings with data by domain', 'Timeliness: average data age in months', 'Accuracy: cross-source agreement rate', 'Consistency: methodology change frequency'], dbTable: 'analytics.data_quality_validated', qualityScore: 'Meta: self-referential quality assessment', example: { status: 'PASS' } },
      { stage: 'TRANSFORMATION', description: 'Composite DQ score = weighted average of 4 dimensions', dbTable: 'analytics.data_quality_composite', transformation: 'DQ = 0.30*coverage + 0.25*timeliness + 0.25*accuracy + 0.20*consistency', example: { dq_composite: 72 } },
      { stage: 'ENRICHMENT', description: 'Improvement trajectory, weak domain identification, provider comparison', derivedMetrics: [{ name: 'Weakest Domain', formula: 'min of 4 dimension scores', example: 'Consistency: 62 -> multiple methodology changes detected' }], dbTable: 'analytics.data_quality_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-level data quality across all portfolios', methodology: 'AUM-weighted DQ composite', formula: 'Firm DQ = sum(AUM * dq) / total_AUM', example: { firm_dq: 69 }, dbTable: 'analytics.firm_data_quality', consumers: ['climate-banking-hub', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Data quality as enabler for reliable ESG analytics', interpretations: [{ context: 'reliability', value: 'DQ 72 -> moderate confidence in analytics outputs; timeliness biggest concern' }] },
      { stage: 'PRESENTATION', description: 'Data quality dashboard with domain breakdown', presentations: [{ module: 'climate-banking-hub', tab: 'Data Quality', viz: 'Radar chart (4 dimensions) + trend line', value: 'DQ: 72' }] },
      { stage: 'ACTION', description: 'Low data quality triggers provider review or engagement', actions: [{ trigger: 'DQ < 60 for any domain', action: 'Data provider review and potential supplementary sourcing', module: 'climate-banking-hub' }] },
    ],
  },

  // -- MJ046: Sector Rotation Signal --
  {
    id: 'MJ046',
    metric: 'ESG-Driven Sector Rotation Signal',
    unit: 'overweight / underweight recommendation',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Combined signal from carbon pricing risk, regulatory tightening, and ESG momentum by sector', source: 'MJ004 (Intensity) + MJ019 (Pathway Gap) + MJ023 (Momentum) by sector', frequency: 'Monthly', quality: 'Multi-factor model; backtested but forward-looking', example: { sector: 'Utilities', signal: 'overweight', basis: 'improving intensity + strong regulatory tailwind' } },
      { stage: 'INGESTION', description: 'Sector-level aggregated metrics from upstream company data', dbTable: 'analytics.sector_signal_staging', dbColumns: ['sector', 'avg_intensity', 'pathway_gap', 'avg_momentum', 'regulatory_score'], validation: 'Sector coverage adequacy', example: { row: { sector: 'Utilities', intensity: 420, gap: -80, momentum: 1.2, regulatory: 72 } } },
      { stage: 'VALIDATION', description: 'Signal stability check, backtesting results, factor correlation', checks: ['Signal not flipping monthly (stability > 3 months)', 'Backtest: information ratio > 0.3 for last 5 years', 'Factor independence: correlation < 0.7 between inputs'], dbTable: 'analytics.sector_signal_validated', qualityScore: 'Backtest quality: in-sample vs out-of-sample performance', example: { status: 'PASS', stability: '4 months', ir: 0.42 } },
      { stage: 'TRANSFORMATION', description: 'Composite sector signal computed and ranked', dbTable: 'analytics.sector_rotation_signal', transformation: 'signal = 0.40*pathway_improvement + 0.30*momentum + 0.30*regulatory_tailwind; rank sectors', example: { top_3: ['Utilities', 'Technology', 'Healthcare'], bottom_3: ['Oil & Gas', 'Mining', 'Steel'] } },
      { stage: 'ENRICHMENT', description: 'Implementation cost, tracking error impact, historical performance', derivedMetrics: [{ name: 'TE Impact', formula: 'tracking error change from sector tilt', example: '+0.4% TE for recommended tilts' }], dbTable: 'analytics.sector_signal_enriched' },
      { stage: 'AGGREGATION', description: 'Recommended sector tilts for portfolio construction', methodology: 'Signal-weighted sector over/underweight', formula: 'Tilt = signal * max_active_weight', example: { tilts: { utilities: '+2%', oil_gas: '-3%', technology: '+1.5%' } }, dbTable: 'analytics.sector_tilts', consumers: ['portfolio-suite', 'climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'Sector rotation framed as ESG-integrated portfolio construction', interpretations: [{ context: 'alpha', value: 'ESG sector tilt historically added +40bps annually' }] },
      { stage: 'PRESENTATION', description: 'Sector signal dashboard with tilt recommendations', presentations: [{ module: 'portfolio-suite', tab: 'Sector Signals', viz: 'Ranked sector table with signal strength and recommended tilt', value: 'Top: Utilities' }] },
      { stage: 'ACTION', description: 'Signal changes trigger rebalancing consideration', actions: [{ trigger: 'Sector signal flip (from OW to UW)', action: 'Alert PM for rebalancing review', module: 'portfolio-suite' }] },
    ],
  },

  // -- MJ047: Controversy Exposure Index --
  {
    id: 'MJ047',
    metric: 'Controversy Exposure Index',
    unit: '0-100 index',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Portfolio-level controversy exposure combining severity, breadth, and recurrence', source: 'MJ010 (Controversy Severity) aggregated with breadth and recurrence dimensions', frequency: 'Monthly', quality: 'NLP + provider curated; moderate false positive rate', example: { portfolio: 'Global Equity', index: 32, companies_exposed: 34, critical_events: 3 } },
      { stage: 'INGESTION', description: 'Controversy events aggregated to portfolio level with dimension scoring', dbTable: 'analytics.controversy_index_staging', dbColumns: ['portfolio_id', 'total_events', 'weighted_severity', 'breadth_score', 'recurrence_score'], validation: 'All dimension inputs current', example: { row: { events: 78, severity: 2.1, breadth: 0.42, recurrence: 0.15 } } },
      { stage: 'VALIDATION', description: 'Index component calibration, historical range check', checks: ['Index components within historical range', 'Sensitivity test: single-event impact bounded', 'Time decay function applied correctly'], dbTable: 'analytics.controversy_index_validated', qualityScore: 'Monthly recalibration against universe', example: { status: 'PASS', index: 32 } },
      { stage: 'TRANSFORMATION', description: 'Composite index = f(severity, breadth, recurrence)', dbTable: 'analytics.controversy_exposure_index', transformation: 'Index = 0.50*severity + 0.30*breadth + 0.20*recurrence; scaled 0-100', example: { index: 32, interpretation: 'Low-Moderate exposure' } },
      { stage: 'ENRICHMENT', description: 'Category breakdown, trend, peer comparison', derivedMetrics: [{ name: 'Top Category', formula: 'category with most weighted events', example: 'Environmental: 38% of events' }], dbTable: 'analytics.controversy_index_enriched' },
      { stage: 'AGGREGATION', description: 'Firm-wide controversy exposure', methodology: 'AUM-weighted index', formula: 'Firm Index = sum(AUM * index) / total_AUM', example: { firm_index: 28 }, dbTable: 'analytics.firm_controversy', consumers: ['esg-ratings-hub', 'climate-banking-hub'] },
      { stage: 'INTERPRETATION', description: 'Index level drives reputational risk assessment', interpretations: [{ context: 'reputation', value: 'Index 32 (Low-Moderate): no immediate reputational concern but 3 critical events to monitor' }] },
      { stage: 'PRESENTATION', description: 'Controversy exposure dashboard with event feed', presentations: [{ module: 'esg-ratings-hub', tab: 'Controversy Index', viz: 'Index gauge + event timeline + category breakdown', value: 'Index: 32' }] },
      { stage: 'ACTION', description: 'Index breach triggers risk review', actions: [{ trigger: 'Index > 60 (High Exposure)', action: 'Risk committee notification with top events summary', module: 'esg-ratings-hub' }] },
    ],
  },

  // -- MJ048: Technology Readiness Score --
  {
    id: 'MJ048',
    metric: 'Climate Technology Readiness Score',
    unit: '0-100 composite',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Assessment of portfolio companies technology readiness for low-carbon transition', source: 'Patent data (PATSTAT) + R&D spend + low-carbon capex + technology partnerships', frequency: 'Annual', quality: 'Patent data high quality; R&D allocation estimates moderate', example: { company: 'Toyota', score: 72, green_patents: 3200, clean_rd_pct: 45, partnerships: 8 } },
      { stage: 'INGESTION', description: 'Technology readiness indicators collected per company', dbTable: 'analytics.tech_readiness_staging', dbColumns: ['company_profile_id', 'green_patent_count', 'clean_rd_pct', 'low_carbon_capex_pct', 'partnership_count', 'technology_trl'], validation: 'Indicator coverage check', example: { row: { patents: 3200, rd_pct: 45, capex_pct: 28, partnerships: 8 } } },
      { stage: 'VALIDATION', description: 'Patent relevance filtering, R&D allocation methodology review', checks: ['Patents classified using IPC green codes (Y02)', 'R&D allocation distinguishes clean from conventional', 'Capex split verified against capital plan disclosures'], dbTable: 'analytics.tech_readiness_validated', qualityScore: 'High for large companies with patent data; Lower for SMEs', example: { status: 'PASS' } },
      { stage: 'TRANSFORMATION', description: 'Composite technology readiness score calculated', dbTable: 'analytics.tech_readiness', transformation: 'score = 0.30*patent_score + 0.25*rd_score + 0.25*capex_score + 0.20*partnership_score', example: { company_profile_id: 42, tech_score: 72 } },
      { stage: 'ENRICHMENT', description: 'Sector rank, technology maturity classification, transition pathway fit', derivedMetrics: [{ name: 'Technology Maturity', formula: 'avg TRL of clean technology portfolio', example: 'TRL 7-8 (demonstration to deployment)' }], dbTable: 'analytics.tech_readiness_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio technology readiness distribution', methodology: 'Weight-averaged tech readiness', formula: 'Portfolio Tech Score = sum(weight * tech_score)', example: { portfolio_tech: 58, leaders: '22% above 70' }, dbTable: 'analytics.portfolio_tech', consumers: ['corporate-decarbonisation', 'transition-planning-hub'] },
      { stage: 'INTERPRETATION', description: 'Tech readiness as credibility indicator for transition plans', interpretations: [{ context: 'credibility', value: 'High tech readiness + high ambition = credible transition plan' }] },
      { stage: 'PRESENTATION', description: 'Technology readiness scatter with sector lens', presentations: [{ module: 'corporate-decarbonisation', tab: 'Tech Readiness', viz: 'Scatter: tech score (x) vs ambition (y) with sector color', value: 'Portfolio: 58' }] },
      { stage: 'ACTION', description: 'Low tech readiness flags transition risk', actions: [{ trigger: 'High-emitter with tech score < 30', action: 'Engagement on technology strategy and R&D investment', module: 'transition-planning-hub' }] },
    ],
  },

  // -- MJ049: Supply Chain Carbon Hotspot --
  {
    id: 'MJ049',
    metric: 'Supply Chain Carbon Hotspot Map',
    unit: 'tCO2e by supply chain tier',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Scope 3 Category 1 (Purchased Goods) mapped by supplier industry and geography', source: 'MJ003 (Scope 3) + EEIO models (EXIOBASE/GTAP) + company supplier disclosures', frequency: 'Annual', quality: 'EEIO resolution: sector x country; company-specific data rare', example: { company: 'Apple', hotspot_tier1: 'Semiconductor Manufacturing (Taiwan)', hotspot_share: 0.42 } },
      { stage: 'INGESTION', description: 'Scope 3 Cat 1 decomposed by supplier sector and geography using EEIO model', dbTable: 'analytics.supply_chain_staging', dbColumns: ['company_profile_id', 'supplier_sector', 'supplier_country', 'estimated_tco2e', 'method', 'confidence'], validation: 'EEIO model version and resolution check', example: { row: { sector: 'Semiconductors', country: 'TW', tco2e: 2100000, confidence: 'medium' } } },
      { stage: 'VALIDATION', description: 'EEIO output reasonableness, comparison with disclosed supplier data where available', checks: ['EEIO estimates calibrated against known sector intensities', 'Where supplier data available, compare with model estimate', 'Geographic allocation consistent with known supply chain'], dbTable: 'analytics.supply_chain_validated', qualityScore: 'Low-Medium: EEIO model inherently approximate', example: { status: 'PASS', calibration: 'within 30% of disclosed' } },
      { stage: 'TRANSFORMATION', description: 'Supply chain carbon map stored per company with tier decomposition', dbTable: 'analytics.supply_chain_carbon', transformation: 'Hierarchical: Tier 1 (direct suppliers) -> Tier 2 (supplier suppliers) -> upstream', example: { tier1_total: 3200000, top_5_sectors: ['Semiconductors', 'Mining', 'Chemicals', 'Logistics', 'Steel'] } },
      { stage: 'ENRICHMENT', description: 'Geographic concentration risk, sector transition risk overlay', derivedMetrics: [{ name: 'Geographic Concentration', formula: 'top-country share of supply chain emissions', example: 'Taiwan: 42% of supply chain carbon' }, { name: 'Transition Risk Overlay', formula: 'supply chain exposed to carbon pricing by jurisdiction', example: '58% of supply chain in carbon-priced jurisdictions by 2030' }], dbTable: 'analytics.supply_chain_enriched' },
      { stage: 'AGGREGATION', description: 'Portfolio-level supply chain hotspot analysis', methodology: 'Attribution-weighted supply chain maps across holdings', formula: 'Portfolio Hotspot = sum(attribution * supply_chain_sector_emission)', example: { top_hotspot: 'Asian Semiconductor Manufacturing', portfolio_exposure: 0.15 }, dbTable: 'analytics.portfolio_supply_chain', consumers: ['supply-chain-esg', 'corporate-decarbonisation'] },
      { stage: 'INTERPRETATION', description: 'Supply chain hotspots as engagement and risk management targets', interpretations: [{ context: 'engagement', value: 'Semiconductor manufacturing is #1 supply chain hotspot -> engage companies on supplier programs' }] },
      { stage: 'PRESENTATION', description: 'Supply chain Sankey diagram and geographic heatmap', presentations: [{ module: 'supply-chain-esg', tab: 'Carbon Hotspots', viz: 'Sankey: portfolio -> company -> supplier sector + geographic heatmap', value: 'Top: Semiconductor MFG' }] },
      { stage: 'ACTION', description: 'Concentrated supply chain risk triggers engagement', actions: [{ trigger: 'Single supply chain sector > 30% of portfolio S3', action: 'Thematic engagement campaign targeting sector decarbonization', module: 'supply-chain-esg' }] },
    ],
  },

  // -- MJ050: Investment Impact Ratio --
  {
    id: 'MJ050',
    metric: 'Investment Impact Ratio',
    unit: 'ratio (weighted outcomes per $M invested)',
    category: 'Aggregated Insight',
    journey: [
      { stage: 'SOURCE', description: 'Composite impact metric: emissions reduced, jobs created, clean energy deployed per $M invested', source: 'All upstream impact metrics + green bond impact reports + project-level data', frequency: 'Annual', quality: 'Varies by component: some verified, some estimated', example: { fund: 'Impact Fund', tco2e_reduced_per_m: 85, clean_mwh_per_m: 420, jobs_per_m: 0.8 } },
      { stage: 'INGESTION', description: 'Impact indicators collected per investment and normalized by investment size', dbTable: 'analytics.impact_ratio_staging', dbColumns: ['portfolio_id', 'holding_id', 'investment_usd', 'tco2e_reduced', 'clean_mwh', 'jobs_supported', 'beneficiaries'], validation: 'Impact measurement methodology documented', example: { row: { investment: 5000000, tco2e_reduced: 425, clean_mwh: 2100, jobs: 4 } } },
      { stage: 'VALIDATION', description: 'Additionality check, attribution methodology, double counting prevention', checks: ['Impact is additional (would not have occurred without investment)', 'Attribution proportional to investment stake', 'No double counting with co-investors', 'Methodology aligned with IMP or IRIS+ framework'], dbTable: 'analytics.impact_validated', qualityScore: 'High for project finance; Medium for listed equity', example: { status: 'PASS', additionality: 'verified' } },
      { stage: 'TRANSFORMATION', description: 'Impact ratios calculated per $M invested', dbTable: 'analytics.impact_ratio', transformation: 'ratio_i = impact_metric_i / (investment_usd / 1_000_000)', example: { tco2e_per_m: 85, clean_mwh_per_m: 420, jobs_per_m: 0.8 } },
      { stage: 'ENRICHMENT', description: 'SDG mapping, impact efficiency comparison, blended finance leverage', derivedMetrics: [{ name: 'SDG Alignment', formula: 'impact mapped to SDG targets', example: 'SDG 7: Clean Energy (primary), SDG 13: Climate Action, SDG 8: Decent Work' }, { name: 'Impact Efficiency', formula: 'vs peer fund impact ratios', example: 'P75 for tCO2e reduced per $M vs impact fund peers' }], dbTable: 'analytics.impact_enriched' },
      { stage: 'AGGREGATION', description: 'Fund-level and firm-level impact ratios', methodology: 'Investment-weighted impact aggregation', formula: 'Fund Impact Ratio = sum(impact) / sum(investment) per metric', example: { fund_tco2e_per_m: 85, fund_mwh_per_m: 420 }, dbTable: 'analytics.portfolio_impact', consumers: ['corporate-decarbonisation', 'green-bond-manager', 'disclosure-hub'] },
      { stage: 'INTERPRETATION', description: 'Impact ratios contextualized for impact reporting and investor communication', interpretations: [{ context: 'impact report', value: 'Every $1M invested avoids 85 tCO2e, generates 420 MWh clean energy, supports 0.8 jobs' }, { context: 'vs peers', value: 'Top quartile for carbon impact, median for clean energy, below median for jobs' }] },
      { stage: 'PRESENTATION', description: 'Impact dashboard with per-$M visualization', presentations: [{ module: 'corporate-decarbonisation', tab: 'Impact Metrics', viz: 'Per-$M impact cards + SDG alignment wheel', value: '85 tCO2e/$M' }, { module: 'green-bond-manager', tab: 'Impact Report', viz: 'Bond-level impact allocation table', value: 'Project impacts' }] },
      { stage: 'ACTION', description: 'Impact ratios feed into impact measurement and management (IMM)', actions: [{ trigger: 'Impact ratio declining YoY', action: 'Review portfolio for impact drift and rebalance toward higher-impact opportunities', module: 'corporate-decarbonisation' }, { trigger: 'Below peer median on key metric', action: 'Source new impact investments with higher expected ratios', module: 'green-bond-manager' }] },
    ],
  },
];


// ========================================================================
//  JOURNEY INDEX -- Multiple access patterns
// ========================================================================

export const JOURNEY_INDEX = {
  // Lookup by metric name -> journey ID
  byMetric: {
    'Scope 1':                     'MJ001',
    'Scope 2':                     'MJ002',
    'Scope 3':                     'MJ003',
    'Carbon Intensity':            'MJ004',
    'Financed Emissions':          'MJ005',
    'Temperature Score':           'MJ006',
    'Climate VaR':                 'MJ007',
    'EU Taxonomy GAR':             'MJ008',
    'ESG Consensus':               'MJ009',
    'Controversy Severity':        'MJ010',
    'TPT Readiness':               'MJ011',
    'Avoided Emissions':           'MJ012',
    'CII Rating':                  'MJ013',
    'Biodiversity Footprint':      'MJ014',
    'Board Diversity':             'MJ015',
    'WACI':                        'MJ016',
    'DQS Weighted Average':        'MJ017',
    'Temperature Alignment Gap':   'MJ018',
    'Sector Pathway Gap':          'MJ019',
    'Credibility Score':           'MJ020',
    'Enablement Ratio':            'MJ021',
    'Net Climate Impact':          'MJ022',
    'ESG Momentum':                'MJ023',
    'Alpha Signal':                'MJ024',
    'Poseidon Alignment':          'MJ025',
    'EEXI Compliance':             'MJ026',
    'SAF Blend Cost':              'MJ027',
    'Physical Risk VaR':           'MJ028',
    'Transition Risk PD':          'MJ029',
    'Stranded Asset Date':         'MJ030',
    'SFDR PAI 1':                  'MJ031',
    'SFDR PAI 2':                  'MJ032',
    'SFDR PAI 3':                  'MJ033',
    'EU Taxonomy GAR Filing':      'MJ034',
    'CSRD E1':                     'MJ035',
    'UK SDR Label':                'MJ036',
    'SEC Climate Rule':            'MJ037',
    'TCFD Strategy':               'MJ038',
    'ISSB S2 Physical':            'MJ039',
    'EBA Pillar 3 ESG':            'MJ040',
    'Net Zero Alignment':          'MJ041',
    'Engagement Progress':         'MJ042',
    'Board Report Score':          'MJ043',
    'Cross-Framework Compliance':  'MJ044',
    'Data Quality Average':        'MJ045',
    'Sector Rotation Signal':      'MJ046',
    'Controversy Index':           'MJ047',
    'Technology Readiness':        'MJ048',
    'Supply Chain Hotspot':        'MJ049',
    'Investment Impact Ratio':     'MJ050',
  },

  // Lookup by module -> which journeys flow through it
  byModule: {
    'pcaf-financed-emissions':      ['MJ001', 'MJ002', 'MJ003', 'MJ004', 'MJ005', 'MJ016', 'MJ017'],
    'climate-banking-hub':          ['MJ001', 'MJ002', 'MJ004', 'MJ005', 'MJ006', 'MJ007', 'MJ016', 'MJ025', 'MJ029', 'MJ043', 'MJ045', 'MJ046'],
    'portfolio-temperature-score':  ['MJ001', 'MJ006', 'MJ018'],
    'portfolio-climate-var':        ['MJ007', 'MJ028', 'MJ030'],
    'climate-physical-risk':        ['MJ007', 'MJ028'],
    'climate-transition-risk':      ['MJ007', 'MJ029', 'MJ030'],
    'esg-ratings-hub':              ['MJ001', 'MJ009', 'MJ010', 'MJ015', 'MJ023', 'MJ024', 'MJ047'],
    'disclosure-hub':               ['MJ001', 'MJ002', 'MJ004', 'MJ005', 'MJ008', 'MJ014', 'MJ015', 'MJ031', 'MJ032', 'MJ033', 'MJ034', 'MJ035', 'MJ038', 'MJ039', 'MJ040', 'MJ041', 'MJ044', 'MJ045', 'MJ050'],
    'transition-planning-hub':      ['MJ001', 'MJ006', 'MJ011', 'MJ014', 'MJ018', 'MJ019', 'MJ020', 'MJ041', 'MJ042', 'MJ048'],
    'sbti-dashboard':               ['MJ006', 'MJ018'],
    'corporate-decarbonisation':    ['MJ002', 'MJ003', 'MJ012', 'MJ019', 'MJ020', 'MJ021', 'MJ022', 'MJ048', 'MJ049', 'MJ050'],
    'greenwash-detector':           ['MJ010', 'MJ020'],
    'sfdr-reporting':               ['MJ008', 'MJ015', 'MJ031', 'MJ032', 'MJ033'],
    'eu-taxonomy-dashboard':        ['MJ008', 'MJ034'],
    'green-bond-manager':           ['MJ008', 'MJ012', 'MJ020', 'MJ050'],
    'net-zero-tracker':             ['MJ005', 'MJ016', 'MJ018', 'MJ041'],
    'maritime-poseidon':            ['MJ013', 'MJ025', 'MJ026'],
    'aviation-corsia':              ['MJ027'],
    'biodiversity-module':          ['MJ014'],
    'supply-chain-esg':             ['MJ003', 'MJ049'],
    'uk-sdr-module':                ['MJ036'],
    'sec-climate-rule':             ['MJ037'],
    'issb-disclosure':              ['MJ038', 'MJ039'],
    'csrd-automation':              ['MJ035'],
    'portfolio-suite':              ['MJ009', 'MJ023', 'MJ024', 'MJ046'],
  },

  // Lookup by stage -> all journey IDs
  byStage: {
    SOURCE:         METRIC_JOURNEYS.map(j => j.id),
    INGESTION:      METRIC_JOURNEYS.map(j => j.id),
    VALIDATION:     METRIC_JOURNEYS.map(j => j.id),
    TRANSFORMATION: METRIC_JOURNEYS.map(j => j.id),
    ENRICHMENT:     METRIC_JOURNEYS.map(j => j.id),
    AGGREGATION:    METRIC_JOURNEYS.map(j => j.id),
    INTERPRETATION: METRIC_JOURNEYS.map(j => j.id),
    PRESENTATION:   METRIC_JOURNEYS.map(j => j.id),
    ACTION:         METRIC_JOURNEYS.map(j => j.id),
  },

  // Lookup by regulation -> which journeys serve that regulation
  byRegulation: {
    'SFDR':         ['MJ001', 'MJ002', 'MJ003', 'MJ004', 'MJ005', 'MJ008', 'MJ010', 'MJ015', 'MJ016', 'MJ031', 'MJ032', 'MJ033'],
    'CSRD':         ['MJ001', 'MJ002', 'MJ003', 'MJ008', 'MJ014', 'MJ015', 'MJ035'],
    'EU Taxonomy':  ['MJ008', 'MJ034'],
    'TCFD':         ['MJ004', 'MJ006', 'MJ007', 'MJ016', 'MJ038'],
    'ISSB':         ['MJ001', 'MJ002', 'MJ007', 'MJ028', 'MJ039'],
    'UK SDR':       ['MJ036'],
    'SEC Climate':  ['MJ001', 'MJ002', 'MJ037'],
    'EBA Pillar 3': ['MJ008', 'MJ029', 'MJ034', 'MJ040'],
    'IMO/MARPOL':   ['MJ013', 'MJ025', 'MJ026'],
    'ICAO/CORSIA':  ['MJ027'],
    'SBTi':         ['MJ006', 'MJ011', 'MJ018', 'MJ020'],
    'NZAM':         ['MJ005', 'MJ016', 'MJ018', 'MJ041'],
    'TNFD':         ['MJ014'],
    'GHG Protocol': ['MJ001', 'MJ002', 'MJ003', 'MJ004'],
    'PCAF':         ['MJ001', 'MJ002', 'MJ003', 'MJ005', 'MJ017'],
    'Poseidon':     ['MJ025'],
  },

  // Lookup by category
  byCategory: {
    'Core':               METRIC_JOURNEYS.filter(j => j.category === 'Core').map(j => j.id),
    'Derived':            METRIC_JOURNEYS.filter(j => j.category === 'Derived').map(j => j.id),
    'Regulatory':         METRIC_JOURNEYS.filter(j => j.category === 'Regulatory').map(j => j.id),
    'Aggregated Insight': METRIC_JOURNEYS.filter(j => j.category === 'Aggregated Insight').map(j => j.id),
  },
};


// ========================================================================
//  HELPER: Get journey by ID or metric name
// ========================================================================

export const getJourneyById = (id) => METRIC_JOURNEYS.find(j => j.id === id);
export const getJourneyByMetric = (name) => {
  const id = JOURNEY_INDEX.byMetric[name];
  return id ? getJourneyById(id) : null;
};
export const getJourneysForModule = (moduleSlug) => {
  const ids = JOURNEY_INDEX.byModule[moduleSlug] || [];
  return ids.map(getJourneyById).filter(Boolean);
};
export const getJourneysForRegulation = (regulation) => {
  const ids = JOURNEY_INDEX.byRegulation[regulation] || [];
  return ids.map(getJourneyById).filter(Boolean);
};

export default METRIC_JOURNEYS;
