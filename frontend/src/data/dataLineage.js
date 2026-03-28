/**
 * DATA LINEAGE REGISTRY — Platform-wide Data Flow Documentation
 * Sprint AK — Cross-Module Data Integration Layer
 *
 * Documents every data flow path in the platform:
 *   - Source data origins (company master, emission factors, reference data)
 *   - Transformation functions (dataFlowService.js)
 *   - Destination modules consuming each flow
 *   - Methodology references and update frequency
 *
 * 35 data flows covering all major analytical pipelines.
 * Lineage graph for visualization in DataLineageExplorer module.
 */

// ═══════════════════════════════════════════════════════════════════════════════
//  DATA FLOWS — 35 documented pipelines
// ═══════════════════════════════════════════════════════════════════════════════

export const DATA_FLOWS = [

  // ── EMISSIONS → PCAF → TEMPERATURE → CLIMATE VAR ──────────────────────────

  {
    id: 'DF001',
    name: 'Company Emissions → Financed Emissions',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.ghg_scope1/2/3',
    transform: 'dataFlowService.computeFinancedEmissions',
    destination: ['pcaf-financed-emissions', 'climate-banking-hub', 'portfolio-temperature-score'],
    methodology: 'PCAF Standard v2',
    frequency: 'Quarterly',
    description: 'Company-reported Scope 1/2/3 emissions flow through PCAF attribution to produce holding-level financed emissions.',
    dataQualityDependency: 'DQS 1-5 from company disclosure quality',
  },
  {
    id: 'DF002',
    name: 'Financed Emissions → Portfolio Temperature',
    source: 'dataFlowService.computeFinancedEmissions.holdings[]',
    transform: 'dataFlowService.computePortfolioTemperature',
    destination: ['temperature-alignment', 'portfolio-suite', 'sbti-dashboard'],
    methodology: 'PACTA/SBTi Temperature Rating',
    frequency: 'Quarterly',
    description: 'Holding-level financed emissions combined with SBTi target status to compute weighted portfolio temperature score.',
    dataQualityDependency: 'Requires SBTi target validation + verified emissions',
  },
  {
    id: 'DF003',
    name: 'Company Emissions → Climate VaR',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.ghg_scope1 + physical_risk_score',
    transform: 'dataFlowService.computeClimateVaR',
    destination: ['portfolio-climate-var', 'climate-physical-risk', 'climate-transition-risk'],
    methodology: 'Delta-Normal CVaR with NGFS scenarios',
    frequency: 'Quarterly',
    description: 'Carbon intensity and physical exposure feed into scenario-conditioned VaR model producing portfolio-level climate risk.',
    dataQualityDependency: 'NGFS scenario parameters + company carbon intensity',
  },
  {
    id: 'DF004',
    name: 'Portfolio Holdings → PCAF Attribution',
    source: 'mockPortfolio.holdings[].outstandingAmount + assetClass',
    transform: 'dataFlowService.computeFinancedEmissions',
    destination: ['pcaf-financed-emissions', 'pcaf-india-brsr', 'portfolio-manager'],
    methodology: 'PCAF v2 Attribution Factor',
    frequency: 'On portfolio update',
    description: 'Portfolio outstanding amounts and EVIC values determine the attribution factor linking investor to company emissions.',
    dataQualityDependency: 'Outstanding amount accuracy + EVIC timeliness',
  },
  {
    id: 'DF005',
    name: 'Temperature Score → SBTi Dashboard',
    source: 'dataFlowService.computePortfolioTemperature.portfolioTemp',
    transform: 'none (direct consumption)',
    destination: ['sbti-dashboard', 'corporate-decarbonisation', 'net-zero-tracker'],
    methodology: 'PACTA/SBTi',
    frequency: 'Quarterly',
    description: 'Portfolio temperature score displayed on SBTi alignment dashboard with sector decomposition.',
    dataQualityDependency: 'Upstream PACTA computation quality',
  },

  // ── ESG RATINGS → CONSENSUS → CONTROVERSY → GREENWASHING ─────────────────

  {
    id: 'DF006',
    name: 'ESG Provider Scores → Consensus Rating',
    source: 'enrichmentService.esg_scores{msci,sustainalytics,sp_global,cdp,iss,refinitiv}',
    transform: 'dataFlowService.computeESGConsensus',
    destination: ['esg-dashboard', 'esg-screener', 'esg-data-quality'],
    methodology: 'Multi-Provider Weighted Consensus',
    frequency: 'Monthly',
    description: 'Raw scores from 6 ESG rating providers normalised to 0-100 and weighted to produce consensus + divergence.',
    dataQualityDependency: 'Provider coverage (min 3 of 6 for reliable consensus)',
  },
  {
    id: 'DF007',
    name: 'ESG Consensus → Greenwashing Detection',
    source: 'dataFlowService.computeESGConsensus.divergence + consensus',
    transform: 'greenwashingAnalysis (inline)',
    destination: ['greenwashing-detector', 'esg-controversy', 'esg-report-parser'],
    methodology: 'Divergence-Based Greenwashing Screening',
    frequency: 'Monthly',
    description: 'High ESG divergence scores combined with controversy data flag potential greenwashing risk.',
    dataQualityDependency: 'Divergence threshold calibration',
  },
  {
    id: 'DF008',
    name: 'Company Controversies → Controversy Score',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.controversies[]',
    transform: 'controversyScoring (inline)',
    destination: ['esg-controversy', 'greenwashing-detector', 'esg-screener'],
    methodology: 'UNGC/RepRisk controversy framework',
    frequency: 'Daily (event-driven)',
    description: 'Controversy events mapped to severity scores and linked to ESG pillar impacts.',
    dataQualityDependency: 'Event freshness and classification accuracy',
  },
  {
    id: 'DF009',
    name: 'ESG Consensus → Portfolio ESG Score',
    source: 'dataFlowService.computeESGConsensus per holding',
    transform: 'weightedAverage (inline)',
    destination: ['portfolio-manager', 'portfolio-suite', 'esg-backtesting'],
    methodology: 'AUM-Weighted Portfolio ESG',
    frequency: 'Monthly',
    description: 'Holding-level consensus scores aggregated to portfolio level using AUM weights.',
    dataQualityDependency: 'Consensus availability across all holdings',
  },
  {
    id: 'DF010',
    name: 'ESG Divergence → ESG Data Quality',
    source: 'dataFlowService.computeESGConsensus.divergence',
    transform: 'qualityAssessment (inline)',
    destination: ['esg-data-quality', 'api-orchestration'],
    methodology: 'BCBS 239 Data Quality',
    frequency: 'Monthly',
    description: 'Provider divergence metrics feed data quality assessment for regulatory reporting.',
    dataQualityDependency: 'Provider coverage completeness',
  },

  // ── TRANSITION PLAN → GFANZ → ACT → CREDIBILITY ──────────────────────────

  {
    id: 'DF011',
    name: 'Company Data → Transition Readiness',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.sbti_status + net_zero_target_year + capex_green_pct',
    transform: 'dataFlowService.computeTransitionReadiness',
    destination: ['transition-finance', 'corporate-decarbonisation', 'sbti-dashboard'],
    methodology: 'TPT Framework + GFANZ + ACT',
    frequency: 'Semi-annual',
    description: 'Company transition plan elements scored across 5 TPT dimensions with GFANZ pathway alignment.',
    dataQualityDependency: 'Company disclosure of transition plan elements',
  },
  {
    id: 'DF012',
    name: 'Transition Readiness → GFANZ Alignment',
    source: 'dataFlowService.computeTransitionReadiness.gfanzAlignment',
    transform: 'none (direct consumption)',
    destination: ['transition-finance', 'net-zero-tracker', 'climate-banking-hub'],
    methodology: 'GFANZ Sectoral Pathways',
    frequency: 'Semi-annual',
    description: 'GFANZ alignment score determines whether company transition plans align with sector-specific net-zero pathways.',
    dataQualityDependency: 'TPT readiness score accuracy',
  },
  {
    id: 'DF013',
    name: 'Transition Readiness → ACT Maturity',
    source: 'dataFlowService.computeTransitionReadiness.actGrade',
    transform: 'none (direct consumption)',
    destination: ['corporate-decarbonisation', 'transition-finance'],
    methodology: 'ACT Initiative Grading (A-E)',
    frequency: 'Annual',
    description: 'ACT maturity grade (A-E) derived from TPT readiness score for credibility assessment.',
    dataQualityDependency: 'Comprehensive TPT element coverage',
  },
  {
    id: 'DF014',
    name: 'SBTi Status → Temperature & Transition',
    source: 'sbtiCompanies.js + globalCompanyMaster sbti_status',
    transform: 'dataFlowService.computePortfolioTemperature + computeTransitionReadiness',
    destination: ['sbti-dashboard', 'temperature-alignment', 'transition-finance'],
    methodology: 'SBTi Target Validation',
    frequency: 'Quarterly (SBTi publishes monthly)',
    description: 'SBTi target approval status is a key input for both temperature scoring and transition readiness.',
    dataQualityDependency: 'SBTi database synchronisation lag',
  },

  // ── AVOIDED EMISSIONS → HANDPRINT → PORTFOLIO IMPACT ─────────────────────

  {
    id: 'DF015',
    name: 'Company Data → Avoided Emissions',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.revenue_usd_mn + sector + product_carbon_reduction_pct',
    transform: 'dataFlowService.computeAvoidedEmissions',
    destination: ['avoided-emissions', 'carbon-handprint', 'portfolio-impact'],
    methodology: 'GHG Protocol Scope 4',
    frequency: 'Annual',
    description: 'Baseline vs product lifecycle emissions with market share attribution to compute net avoided emissions.',
    dataQualityDependency: 'Product-level LCA data availability',
  },
  {
    id: 'DF016',
    name: 'Avoided Emissions → Handprint Ratio',
    source: 'dataFlowService.computeAvoidedEmissions.handprintRatio',
    transform: 'none (direct consumption)',
    destination: ['carbon-handprint', 'portfolio-impact', 'impact-reporting'],
    methodology: 'Handprint = Avoided / Own Footprint',
    frequency: 'Annual',
    description: 'Handprint ratio compares avoided emissions to own operational footprint for impact measurement.',
    dataQualityDependency: 'Avoided emissions calculation quality',
  },
  {
    id: 'DF017',
    name: 'Avoided Emissions → Portfolio Impact Score',
    source: 'dataFlowService.computeAvoidedEmissions per holding',
    transform: 'weightedSum (inline)',
    destination: ['portfolio-impact', 'portfolio-suite'],
    methodology: 'AUM-Weighted Portfolio Avoided',
    frequency: 'Annual',
    description: 'Holding-level avoided emissions summed for total portfolio positive impact reporting.',
    dataQualityDependency: 'Consistent LCA methodology across holdings',
  },

  // ── CREDIT RISK — CLIMATE-ADJUSTED ────────────────────────────────────────

  {
    id: 'DF018',
    name: 'Company Data → Climate Credit Risk',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.credit_rating + ghg_scope1 + physical_risk_score',
    transform: 'dataFlowService.computeCreditRisk',
    destination: ['climate-credit-risk', 'climate-banking-hub', 'private-credit-climate'],
    methodology: 'NGFS Climate Credit Risk / ECB Guide',
    frequency: 'Quarterly',
    description: 'Base PD adjusted with transition risk (carbon cost) and physical risk overlays under NGFS scenarios.',
    dataQualityDependency: 'Credit rating accuracy + emission data quality',
  },
  {
    id: 'DF019',
    name: 'Climate PD → Expected Credit Loss',
    source: 'dataFlowService.computeCreditRisk.climateAdjustedPD',
    transform: 'ECL = PD * LGD * EAD (inline)',
    destination: ['climate-credit-risk', 'climate-banking-hub', 'financial-statements'],
    methodology: 'IFRS 9 ECL with Climate Overlay',
    frequency: 'Quarterly',
    description: 'Climate-adjusted PD flows into ECL calculation for banking book provisioning under IFRS 9.',
    dataQualityDependency: 'PD model validation + LGD/EAD parameters',
  },
  {
    id: 'DF020',
    name: 'NGFS Scenarios → VaR + Credit Risk',
    source: 'dataFlowService.SUPPORTED_SCENARIOS',
    transform: 'dataFlowService.computeClimateVaR + computeCreditRisk',
    destination: ['portfolio-climate-var', 'climate-credit-risk', 'transition-scenario-modeller'],
    methodology: 'NGFS Phase IV Scenarios',
    frequency: 'Annual (scenario update)',
    description: 'NGFS scenario parameters (carbon prices, physical multipliers) calibrate both VaR and credit risk models.',
    dataQualityDependency: 'NGFS vintage + scenario parameter calibration',
  },

  // ── TAXONOMY & GREEN ASSET RATIO ──────────────────────────────────────────

  {
    id: 'DF021',
    name: 'Company Data → Green Asset Ratio',
    source: 'globalCompanyMaster.GLOBAL_COMPANY_MASTER.taxonomy_alignment_pct + green_revenue_pct',
    transform: 'dataFlowService.computeGreenAssetRatio',
    destination: ['green-asset-ratio', 'taxonomy-hub', 'sfdr-reporting'],
    methodology: 'EU Taxonomy Regulation Art. 8',
    frequency: 'Annual',
    description: 'Taxonomy-aligned exposures divided by total CRR covered assets for Pillar 3 GAR disclosure.',
    dataQualityDependency: 'Company taxonomy alignment reporting completeness',
  },
  {
    id: 'DF022',
    name: 'GAR → SFDR PAI Indicators',
    source: 'dataFlowService.computeGreenAssetRatio.byObjective[]',
    transform: 'sfdrPaiMapping (inline)',
    destination: ['sfdr-reporting', 'regulatory-disclosure-hub'],
    methodology: 'SFDR RTS Annex I',
    frequency: 'Annual',
    description: 'Green Asset Ratio objective breakdown maps to SFDR Principal Adverse Impact indicators.',
    dataQualityDependency: 'GAR objective-level granularity',
  },
  {
    id: 'DF023',
    name: 'Taxonomy Alignment → CBI Bond Screening',
    source: 'referenceData.cbiTaxonomy + globalCompanyMaster taxonomy_alignment_pct',
    transform: 'cbiScreening (inline)',
    destination: ['green-bond-analytics', 'taxonomy-hub'],
    methodology: 'CBI Taxonomy + EU GBS',
    frequency: 'On bond issuance',
    description: 'Company taxonomy alignment checked against CBI sector criteria for green bond eligibility.',
    dataQualityDependency: 'CBI taxonomy version + bond use-of-proceeds',
  },

  // ── TRANSPORT → IMO CII → CORSIA → EV TCO ────────────────────────────────

  {
    id: 'DF024',
    name: 'Emission Factors → Transport Carbon',
    source: 'emissionFactors.TRANSPORT_FACTORS',
    transform: 'transportEmissionCalc (inline)',
    destination: ['carbon-calculator', 'imo-cii-rating', 'corsia-aviation'],
    methodology: 'UK DEFRA GHG Conversion Factors 2023',
    frequency: 'Annual (DEFRA update)',
    description: 'DEFRA transport emission factors (gCO2e/km) feed all transport carbon calculations.',
    dataQualityDependency: 'DEFRA publication vintage',
  },
  {
    id: 'DF025',
    name: 'Shipping Data → IMO CII Rating',
    source: 'globalCompanyMaster shipping fleet data + emissionFactors.TRANSPORT_FACTORS',
    transform: 'imoCiiCalculation (inline)',
    destination: ['imo-cii-rating', 'transport-emissions'],
    methodology: 'IMO MEPC.352(78) CII Framework',
    frequency: 'Annual (IMO reporting cycle)',
    description: 'Ship fuel consumption and distance data produce Carbon Intensity Indicator ratings (A-E).',
    dataQualityDependency: 'Vessel-level fuel and voyage data accuracy',
  },
  {
    id: 'DF026',
    name: 'Aviation Data → CORSIA Offset',
    source: 'globalCompanyMaster airline fleet data + emissionFactors.TRANSPORT_FACTORS',
    transform: 'corsiaOffsetCalc (inline)',
    destination: ['corsia-aviation', 'transport-emissions'],
    methodology: 'ICAO CORSIA SARPs',
    frequency: 'Annual',
    description: 'Airline CO2 emissions above baseline trigger offset obligations under CORSIA scheme.',
    dataQualityDependency: 'Route-level emission monitoring data',
  },
  {
    id: 'DF027',
    name: 'Vehicle Data → EV TCO Comparison',
    source: 'emissionFactors.TRANSPORT_FACTORS + referenceData energy prices',
    transform: 'evTcoModel (inline)',
    destination: ['ev-tco-comparison', 'consumer-carbon'],
    methodology: 'Lifecycle TCO (ICCT methodology)',
    frequency: 'Quarterly',
    description: 'ICE vs EV total cost of ownership including fuel/electricity, maintenance, depreciation, and carbon externality.',
    dataQualityDependency: 'Energy price updates + vehicle efficiency data',
  },

  // ── REFERENCE DATA → MULTIPLE CONSUMERS ───────────────────────────────────

  {
    id: 'DF028',
    name: 'Carbon Prices → Climate Risk Models',
    source: 'carbonPrices.js (EU ETS, UK ETS, RGGI, CCA, KAU, NZ ETS)',
    transform: 'dataFlowService.computeClimateVaR + computeCreditRisk',
    destination: ['portfolio-climate-var', 'climate-credit-risk', 'carbon-market', 'climate-policy'],
    methodology: 'Market prices + NGFS projections',
    frequency: 'Daily (market) / Annual (projections)',
    description: 'Observed carbon allowance prices and NGFS projected paths calibrate transition risk in VaR and credit models.',
    dataQualityDependency: 'Carbon market data feed timeliness',
  },
  {
    id: 'DF029',
    name: 'Grid Emission Factors → Scope 2 Estimation',
    source: 'gridIntensity.js (country/region grid factors)',
    transform: 'scope2LocationBased (inline)',
    destination: ['carbon-accounting-ai', 'pcaf-financed-emissions', 'scope-tracker'],
    methodology: 'IEA / EPA eGRID / CEA India',
    frequency: 'Annual',
    description: 'Location-based Scope 2 factors (tCO2e/MWh) applied to electricity consumption for companies lacking reported Scope 2.',
    dataQualityDependency: 'Grid factor vintage and granularity (national vs sub-national)',
  },
  {
    id: 'DF030',
    name: 'Sector Benchmarks → Peer Comparison',
    source: 'sectorBenchmarks.js (sector averages for E/S/G + emissions)',
    transform: 'peerRanking (inline)',
    destination: ['benchmark-analytics', 'esg-dashboard', 'sector-analysis'],
    methodology: 'GICS L2 sector aggregation',
    frequency: 'Quarterly',
    description: 'Sector-level emission and ESG averages enable peer-relative positioning and benchmarking.',
    dataQualityDependency: 'Sector sample size and coverage',
  },
  {
    id: 'DF031',
    name: 'Country Emissions → Sovereign Risk',
    source: 'countryEmissions.js (NDC targets, historical emissions)',
    transform: 'sovereignClimateRisk (inline)',
    destination: ['climate-policy', 'green-central-banking', 'systemic-esg-risk'],
    methodology: 'UNFCCC NDC + IEA WEO',
    frequency: 'Annual',
    description: 'Country-level emission trajectories and NDC targets feed sovereign climate risk assessments.',
    dataQualityDependency: 'NDC reporting completeness + historical data accuracy',
  },

  // ── PORTFOLIO HOLDINGS → ALL PORTFOLIO-LEVEL MODULES ──────────────────────

  {
    id: 'DF032',
    name: 'Portfolio Holdings → Portfolio Manager',
    source: 'mockPortfolio.holdings[] + globalCompanyMaster enrichment',
    transform: 'portfolioAggregation (inline)',
    destination: ['portfolio-manager', 'portfolio-suite', 'portfolio-optimizer'],
    methodology: 'AUM-weighted aggregation',
    frequency: 'On portfolio update',
    description: 'Raw holding weights, amounts, and asset classes distributed to all portfolio analytics modules.',
    dataQualityDependency: 'Portfolio data completeness and recency',
  },
  {
    id: 'DF033',
    name: 'Holdings → Carbon Budget Tracker',
    source: 'dataFlowService.computeFinancedEmissions + SBTi glide path',
    transform: 'carbonBudgetAllocation (inline)',
    destination: ['carbon-budget', 'net-zero-tracker', 'sbti-dashboard'],
    methodology: 'SBTi 1.5°C Carbon Budget',
    frequency: 'Quarterly',
    description: 'Portfolio financed emissions compared against 1.5°C-aligned carbon budget with glide path tracking.',
    dataQualityDependency: 'Financed emissions accuracy + budget methodology',
  },
  {
    id: 'DF034',
    name: 'Holdings + ESG → ESG Factor Backtesting',
    source: 'mockPortfolio.holdings[] + dataFlowService.computeESGConsensus',
    transform: 'factorBacktest (inline)',
    destination: ['esg-backtesting', 'esg-factor-attribution'],
    methodology: 'Factor regression (Fama-French + ESG)',
    frequency: 'Monthly',
    description: 'Portfolio ESG scores combined with return data for factor attribution and backtesting analysis.',
    dataQualityDependency: 'Time-series depth + ESG score stability',
  },
  {
    id: 'DF035',
    name: 'All Modules → Regulatory Disclosure Hub',
    source: 'dataFlowService.* (all pipeline outputs)',
    transform: 'disclosureAggregation (inline)',
    destination: ['regulatory-disclosure-hub', 'csrd-esrs', 'issb-disclosure', 'uk-sdr', 'sec-climate-rule'],
    methodology: 'Multi-framework disclosure mapping',
    frequency: 'Annual / Semi-annual',
    description: 'All computed metrics aggregated and mapped to CSRD/ESRS, ISSB S2, UK SDR, and SEC disclosure templates.',
    dataQualityDependency: 'Upstream pipeline completeness across all modules',
  },
];


// ═══════════════════════════════════════════════════════════════════════════════
//  LINEAGE GRAPH — Nodes and Edges for Visualization
// ═══════════════════════════════════════════════════════════════════════════════

const NODE_TYPES = {
  DATA_SOURCE:   'data_source',
  TRANSFORM:     'transform',
  MODULE:        'module',
  REFERENCE:     'reference',
};

export const LINEAGE_GRAPH = {

  nodes: [
    // ── Data Sources ────────────────────────────────────────────────────────
    { id: 'src-company-master',     type: NODE_TYPES.DATA_SOURCE, label: 'Company Master (India)',     file: 'companyMaster.js',           records: '50+ companies' },
    { id: 'src-global-master',      type: NODE_TYPES.DATA_SOURCE, label: 'Global Company Master',      file: 'globalCompanyMaster.js',     records: '400+ companies across 14 exchanges' },
    { id: 'src-portfolio',          type: NODE_TYPES.DATA_SOURCE, label: 'Portfolio Holdings',          file: 'mockPortfolio.js',           records: 'Variable per portfolio' },
    { id: 'src-enrichment',         type: NODE_TYPES.DATA_SOURCE, label: 'Enrichment Service',          file: 'enrichmentService.js',       records: 'EODHD + Alpha Vantage' },
    { id: 'src-sbti',               type: NODE_TYPES.DATA_SOURCE, label: 'SBTi Companies',              file: 'sbtiCompanies.js',           records: '4,500+ committed companies' },
    { id: 'src-tcfd',               type: NODE_TYPES.DATA_SOURCE, label: 'TCFD Adoption',               file: 'tcfdAdoption.js',            records: 'TCFD-aligned reporters' },

    // ── Reference Data ──────────────────────────────────────────────────────
    { id: 'ref-emission-factors',   type: NODE_TYPES.REFERENCE,   label: 'Emission Factors',            file: 'emissionFactors.js',         source: 'UK DEFRA 2023 / EPA eGRID' },
    { id: 'ref-carbon-prices',      type: NODE_TYPES.REFERENCE,   label: 'Carbon Prices',               file: 'carbonPrices.js',            source: 'EU ETS, UK ETS, RGGI, CCA, KAU' },
    { id: 'ref-grid-intensity',     type: NODE_TYPES.REFERENCE,   label: 'Grid Intensity',              file: 'gridIntensity.js',           source: 'IEA / EPA eGRID / CEA India' },
    { id: 'ref-sector-benchmarks',  type: NODE_TYPES.REFERENCE,   label: 'Sector Benchmarks',           file: 'sectorBenchmarks.js',        source: 'GICS L2 aggregation' },
    { id: 'ref-country-emissions',  type: NODE_TYPES.REFERENCE,   label: 'Country Emissions',           file: 'countryEmissions.js',        source: 'UNFCCC / IEA WEO' },
    { id: 'ref-cbi-taxonomy',       type: NODE_TYPES.REFERENCE,   label: 'CBI Green Bond Taxonomy',     file: 'referenceData/cbiTaxonomy.js', source: 'Climate Bonds Initiative' },
    { id: 'ref-commodity-data',     type: NODE_TYPES.REFERENCE,   label: 'Commodity Data',              file: 'referenceData/commodityDataService.js', source: 'World Bank / IMF' },
    { id: 'ref-imf-climate',        type: NODE_TYPES.REFERENCE,   label: 'IMF Climate Service',         file: 'referenceData/imfClimateService.js', source: 'IMF Climate Change Indicators' },

    // ── Transformation Functions ────────────────────────────────────────────
    { id: 'tx-financed-emissions',  type: NODE_TYPES.TRANSFORM,   label: 'PCAF Financed Emissions',     fn: 'computeFinancedEmissions',     methodology: 'PCAF v2' },
    { id: 'tx-temperature',         type: NODE_TYPES.TRANSFORM,   label: 'Temperature Score',           fn: 'computePortfolioTemperature',  methodology: 'PACTA/SBTi' },
    { id: 'tx-climate-var',         type: NODE_TYPES.TRANSFORM,   label: 'Climate VaR',                 fn: 'computeClimateVaR',            methodology: 'Delta-Normal CVaR' },
    { id: 'tx-gar',                 type: NODE_TYPES.TRANSFORM,   label: 'Green Asset Ratio',           fn: 'computeGreenAssetRatio',       methodology: 'EU Taxonomy Art.8' },
    { id: 'tx-esg-consensus',       type: NODE_TYPES.TRANSFORM,   label: 'ESG Consensus',               fn: 'computeESGConsensus',          methodology: 'Multi-Provider' },
    { id: 'tx-transition',          type: NODE_TYPES.TRANSFORM,   label: 'Transition Readiness',        fn: 'computeTransitionReadiness',   methodology: 'TPT/GFANZ/ACT' },
    { id: 'tx-avoided',             type: NODE_TYPES.TRANSFORM,   label: 'Avoided Emissions',           fn: 'computeAvoidedEmissions',      methodology: 'GHG Scope 4' },
    { id: 'tx-credit-risk',         type: NODE_TYPES.TRANSFORM,   label: 'Climate Credit Risk',         fn: 'computeCreditRisk',            methodology: 'NGFS/ECB' },

    // ── Destination Modules ─────────────────────────────────────────────────
    { id: 'mod-pcaf',               type: NODE_TYPES.MODULE,      label: 'PCAF Financed Emissions',     path: '/pcaf-financed-emissions',   sprint: 'AJ' },
    { id: 'mod-temp-align',         type: NODE_TYPES.MODULE,      label: 'Temperature Alignment',       path: '/temperature-alignment',     sprint: 'E' },
    { id: 'mod-climate-var',        type: NODE_TYPES.MODULE,      label: 'Portfolio Climate VaR',        path: '/portfolio-climate-var',     sprint: 'D' },
    { id: 'mod-climate-banking',    type: NODE_TYPES.MODULE,      label: 'Climate Banking Hub',          path: '/climate-banking-hub',       sprint: 'AJ' },
    { id: 'mod-portfolio-manager',  type: NODE_TYPES.MODULE,      label: 'Portfolio Manager',            path: '/portfolio-manager',         sprint: 'F' },
    { id: 'mod-portfolio-suite',    type: NODE_TYPES.MODULE,      label: 'Portfolio Suite Dashboard',    path: '/portfolio-suite',           sprint: 'G' },
    { id: 'mod-esg-dashboard',      type: NODE_TYPES.MODULE,      label: 'ESG Dashboard',                path: '/esg-dashboard',             sprint: 'C' },
    { id: 'mod-esg-screener',       type: NODE_TYPES.MODULE,      label: 'ESG Screening Engine',         path: '/esg-screener',              sprint: 'F' },
    { id: 'mod-esg-data-quality',   type: NODE_TYPES.MODULE,      label: 'ESG Data Quality',             path: '/esg-data-quality',          sprint: 'E' },
    { id: 'mod-esg-controversy',    type: NODE_TYPES.MODULE,      label: 'ESG Controversy',              path: '/esg-controversy',           sprint: 'E' },
    { id: 'mod-greenwashing',       type: NODE_TYPES.MODULE,      label: 'Greenwashing Detector',        path: '/greenwashing-detector',     sprint: 'T' },
    { id: 'mod-transition-finance', type: NODE_TYPES.MODULE,      label: 'Transition Finance',           path: '/transition-finance',        sprint: 'E' },
    { id: 'mod-sbti-dashboard',     type: NODE_TYPES.MODULE,      label: 'SBTi Dashboard',               path: '/sbti-dashboard',            sprint: 'AI' },
    { id: 'mod-corporate-decarb',   type: NODE_TYPES.MODULE,      label: 'Corporate Decarbonisation',    path: '/corporate-decarbonisation', sprint: 'AI' },
    { id: 'mod-net-zero-tracker',   type: NODE_TYPES.MODULE,      label: 'Net Zero Tracker',             path: '/net-zero-tracker',          sprint: 'AI' },
    { id: 'mod-taxonomy-hub',       type: NODE_TYPES.MODULE,      label: 'Taxonomy Hub',                 path: '/taxonomy-hub',              sprint: 'Q' },
    { id: 'mod-sfdr',               type: NODE_TYPES.MODULE,      label: 'SFDR Reporting',               path: '/sfdr-reporting',            sprint: 'AH' },
    { id: 'mod-carbon-budget',      type: NODE_TYPES.MODULE,      label: 'Carbon Budget Tracker',        path: '/carbon-budget',             sprint: 'G' },
    { id: 'mod-benchmark',          type: NODE_TYPES.MODULE,      label: 'Benchmark Analytics',          path: '/benchmark-analytics',       sprint: 'J' },
    { id: 'mod-physical-risk',      type: NODE_TYPES.MODULE,      label: 'Physical Risk Engine',         path: '/climate-physical-risk',     sprint: 'H' },
    { id: 'mod-transition-risk',    type: NODE_TYPES.MODULE,      label: 'Transition Risk Engine',       path: '/climate-transition-risk',   sprint: 'H' },
    { id: 'mod-carbon-calc',        type: NODE_TYPES.MODULE,      label: 'Carbon Calculator',            path: '/carbon-calculator',         sprint: 'Z' },
    { id: 'mod-imo-cii',            type: NODE_TYPES.MODULE,      label: 'IMO CII Rating',               path: '/imo-cii-rating',            sprint: 'AJ' },
    { id: 'mod-corsia',             type: NODE_TYPES.MODULE,      label: 'CORSIA Aviation',              path: '/corsia-aviation',           sprint: 'AJ' },
    { id: 'mod-ev-tco',             type: NODE_TYPES.MODULE,      label: 'EV TCO Comparison',            path: '/ev-tco-comparison',         sprint: 'AJ' },
    { id: 'mod-climate-policy',     type: NODE_TYPES.MODULE,      label: 'Climate Policy Tracker',       path: '/climate-policy',            sprint: 'O' },
    { id: 'mod-esg-backtesting',    type: NODE_TYPES.MODULE,      label: 'ESG Factor Backtesting',       path: '/esg-backtesting',           sprint: 'J' },
    { id: 'mod-disclosure-hub',     type: NODE_TYPES.MODULE,      label: 'Regulatory Disclosure Hub',    path: '/disclosure-hub',            sprint: 'AH' },
    { id: 'mod-csrd',               type: NODE_TYPES.MODULE,      label: 'CSRD/ESRS Automation',         path: '/csrd-esrs',                 sprint: 'AH' },
    { id: 'mod-issb',               type: NODE_TYPES.MODULE,      label: 'ISSB Disclosure',              path: '/issb-disclosure',           sprint: 'AH' },
    { id: 'mod-green-bond',         type: NODE_TYPES.MODULE,      label: 'Green Bond Analytics',         path: '/green-bond-analytics',      sprint: 'N' },
    { id: 'mod-carbon-market',      type: NODE_TYPES.MODULE,      label: 'Carbon Market',                path: '/carbon-market',             sprint: 'P' },
    { id: 'mod-green-central-bank', type: NODE_TYPES.MODULE,      label: 'Green Central Banking',        path: '/green-central-banking',     sprint: 'AB' },
    { id: 'mod-systemic-risk',      type: NODE_TYPES.MODULE,      label: 'Systemic ESG Risk',            path: '/systemic-esg-risk',         sprint: 'AB' },
    { id: 'mod-private-credit',     type: NODE_TYPES.MODULE,      label: 'Private Credit Climate',       path: '/private-credit-climate',    sprint: 'AG' },
    { id: 'mod-esg-report-parser',  type: NODE_TYPES.MODULE,      label: 'ESG Report Parser',            path: '/esg-report-parser',         sprint: 'W' },
    { id: 'mod-portfolio-optimizer', type: NODE_TYPES.MODULE,     label: 'Portfolio Optimizer',          path: '/portfolio-optimizer',       sprint: 'H' },
    { id: 'mod-scenario-modeller',  type: NODE_TYPES.MODULE,      label: 'Transition Scenario Modeller', path: '/transition-scenario-modeller', sprint: 'AB' },
    { id: 'mod-carbon-accounting',  type: NODE_TYPES.MODULE,      label: 'Carbon Accounting AI',         path: '/carbon-accounting-ai',      sprint: 'E' },
    { id: 'mod-pcaf-india',         type: NODE_TYPES.MODULE,      label: 'PCAF India BRSR',              path: '/pcaf-india-brsr',           sprint: 'E' },
    { id: 'mod-factor-attribution', type: NODE_TYPES.MODULE,      label: 'ESG Factor Attribution',       path: '/esg-factor-attribution',    sprint: 'AB' },
  ],

  edges: [
    // ── Source → Transform ──────────────────────────────────────────────────
    { from: 'src-global-master',    to: 'tx-financed-emissions',  flow: 'DF001', label: 'Scope 1/2/3 + EVIC' },
    { from: 'src-portfolio',        to: 'tx-financed-emissions',  flow: 'DF004', label: 'Holdings + amounts' },
    { from: 'src-global-master',    to: 'tx-temperature',         flow: 'DF002', label: 'SBTi status + intensity' },
    { from: 'src-portfolio',        to: 'tx-temperature',         flow: 'DF002', label: 'Holding weights' },
    { from: 'src-global-master',    to: 'tx-climate-var',         flow: 'DF003', label: 'Carbon intensity + physical' },
    { from: 'src-portfolio',        to: 'tx-climate-var',         flow: 'DF003', label: 'Market values' },
    { from: 'src-global-master',    to: 'tx-gar',                 flow: 'DF021', label: 'Taxonomy alignment %' },
    { from: 'src-portfolio',        to: 'tx-gar',                 flow: 'DF021', label: 'Exposures' },
    { from: 'src-enrichment',       to: 'tx-esg-consensus',       flow: 'DF006', label: 'Provider scores' },
    { from: 'src-global-master',    to: 'tx-transition',          flow: 'DF011', label: 'Transition plan data' },
    { from: 'src-sbti',             to: 'tx-transition',          flow: 'DF014', label: 'SBTi target status' },
    { from: 'src-global-master',    to: 'tx-avoided',             flow: 'DF015', label: 'Revenue + product data' },
    { from: 'src-global-master',    to: 'tx-credit-risk',         flow: 'DF018', label: 'Credit rating + emissions' },
    { from: 'src-portfolio',        to: 'tx-credit-risk',         flow: 'DF018', label: 'EAD + LGD + maturity' },

    // ── Reference → Transform ───────────────────────────────────────────────
    { from: 'ref-carbon-prices',    to: 'tx-climate-var',         flow: 'DF028', label: 'Carbon price paths' },
    { from: 'ref-carbon-prices',    to: 'tx-credit-risk',         flow: 'DF028', label: 'Carbon cost overlay' },
    { from: 'ref-emission-factors', to: 'tx-financed-emissions',  flow: 'DF024', label: 'Sector intensity fallback' },
    { from: 'ref-grid-intensity',   to: 'tx-financed-emissions',  flow: 'DF029', label: 'Scope 2 estimation' },
    { from: 'ref-sector-benchmarks',to: 'tx-esg-consensus',       flow: 'DF030', label: 'Peer benchmarks' },
    { from: 'ref-cbi-taxonomy',     to: 'tx-gar',                 flow: 'DF023', label: 'Green bond criteria' },

    // ── Transform → Transform (chaining) ────────────────────────────────────
    { from: 'tx-financed-emissions',to: 'tx-temperature',         flow: 'DF002', label: 'Holding emissions' },

    // ── Transform → Module ──────────────────────────────────────────────────
    { from: 'tx-financed-emissions',to: 'mod-pcaf',               flow: 'DF001', label: 'Financed emissions' },
    { from: 'tx-financed-emissions',to: 'mod-climate-banking',    flow: 'DF001', label: 'Banking book FE' },
    { from: 'tx-financed-emissions',to: 'mod-portfolio-manager',  flow: 'DF004', label: 'PCAF attribution' },
    { from: 'tx-financed-emissions',to: 'mod-pcaf-india',         flow: 'DF004', label: 'India BRSR PCAF' },
    { from: 'tx-financed-emissions',to: 'mod-carbon-budget',      flow: 'DF033', label: 'Budget tracking' },
    { from: 'tx-temperature',       to: 'mod-temp-align',         flow: 'DF002', label: 'Portfolio temp' },
    { from: 'tx-temperature',       to: 'mod-sbti-dashboard',     flow: 'DF005', label: 'SBTi alignment' },
    { from: 'tx-temperature',       to: 'mod-portfolio-suite',    flow: 'DF005', label: 'KPI card' },
    { from: 'tx-temperature',       to: 'mod-net-zero-tracker',   flow: 'DF005', label: 'Net zero progress' },
    { from: 'tx-climate-var',       to: 'mod-climate-var',        flow: 'DF003', label: 'CVaR 95%' },
    { from: 'tx-climate-var',       to: 'mod-physical-risk',      flow: 'DF003', label: 'Physical VaR' },
    { from: 'tx-climate-var',       to: 'mod-transition-risk',    flow: 'DF003', label: 'Transition VaR' },
    { from: 'tx-climate-var',       to: 'mod-scenario-modeller',  flow: 'DF020', label: 'Scenario results' },
    { from: 'tx-gar',               to: 'mod-taxonomy-hub',       flow: 'DF021', label: 'GAR %' },
    { from: 'tx-gar',               to: 'mod-sfdr',               flow: 'DF022', label: 'PAI mapping' },
    { from: 'tx-gar',               to: 'mod-green-bond',         flow: 'DF023', label: 'Eligibility' },
    { from: 'tx-esg-consensus',     to: 'mod-esg-dashboard',      flow: 'DF006', label: 'Consensus score' },
    { from: 'tx-esg-consensus',     to: 'mod-esg-screener',       flow: 'DF006', label: 'Screen thresholds' },
    { from: 'tx-esg-consensus',     to: 'mod-esg-data-quality',   flow: 'DF010', label: 'Divergence' },
    { from: 'tx-esg-consensus',     to: 'mod-greenwashing',       flow: 'DF007', label: 'Divergence flags' },
    { from: 'tx-esg-consensus',     to: 'mod-esg-controversy',    flow: 'DF008', label: 'Controversy link' },
    { from: 'tx-esg-consensus',     to: 'mod-esg-backtesting',    flow: 'DF034', label: 'Factor data' },
    { from: 'tx-esg-consensus',     to: 'mod-factor-attribution', flow: 'DF034', label: 'ESG factor' },
    { from: 'tx-transition',        to: 'mod-transition-finance', flow: 'DF011', label: 'Readiness score' },
    { from: 'tx-transition',        to: 'mod-corporate-decarb',   flow: 'DF011', label: 'ACT grade' },
    { from: 'tx-transition',        to: 'mod-sbti-dashboard',     flow: 'DF014', label: 'Alignment' },
    { from: 'tx-transition',        to: 'mod-net-zero-tracker',   flow: 'DF012', label: 'GFANZ alignment' },
    { from: 'tx-avoided',           to: 'mod-carbon-calc',        flow: 'DF015', label: 'Avoided tCO2e' },
    { from: 'tx-avoided',           to: 'mod-portfolio-suite',    flow: 'DF017', label: 'Impact score' },
    { from: 'tx-credit-risk',       to: 'mod-climate-banking',    flow: 'DF018', label: 'Climate PD' },
    { from: 'tx-credit-risk',       to: 'mod-private-credit',     flow: 'DF018', label: 'ECL delta' },

    // ── Reference → Module (direct) ────────────────────────────────────────
    { from: 'ref-emission-factors', to: 'mod-imo-cii',            flow: 'DF025', label: 'Transport factors' },
    { from: 'ref-emission-factors', to: 'mod-corsia',             flow: 'DF026', label: 'Aviation factors' },
    { from: 'ref-emission-factors', to: 'mod-ev-tco',             flow: 'DF027', label: 'Vehicle factors' },
    { from: 'ref-emission-factors', to: 'mod-carbon-calc',        flow: 'DF024', label: 'All transport' },
    { from: 'ref-emission-factors', to: 'mod-carbon-accounting',  flow: 'DF029', label: 'Scope factors' },
    { from: 'ref-carbon-prices',    to: 'mod-carbon-market',      flow: 'DF028', label: 'Market prices' },
    { from: 'ref-carbon-prices',    to: 'mod-climate-policy',     flow: 'DF028', label: 'Policy prices' },
    { from: 'ref-country-emissions',to: 'mod-climate-policy',     flow: 'DF031', label: 'NDC targets' },
    { from: 'ref-country-emissions',to: 'mod-green-central-bank', flow: 'DF031', label: 'Sovereign risk' },
    { from: 'ref-country-emissions',to: 'mod-systemic-risk',      flow: 'DF031', label: 'Country emissions' },
    { from: 'ref-sector-benchmarks',to: 'mod-benchmark',          flow: 'DF030', label: 'Sector averages' },
    { from: 'ref-sector-benchmarks',to: 'mod-esg-dashboard',      flow: 'DF030', label: 'Peer context' },

    // ── Portfolio → Module (direct) ─────────────────────────────────────────
    { from: 'src-portfolio',        to: 'mod-portfolio-suite',    flow: 'DF032', label: 'Holdings' },
    { from: 'src-portfolio',        to: 'mod-portfolio-optimizer', flow: 'DF032', label: 'Weights' },
    { from: 'src-portfolio',        to: 'mod-esg-backtesting',    flow: 'DF034', label: 'Historical' },

    // ── Aggregation → Disclosure ────────────────────────────────────────────
    { from: 'mod-portfolio-suite',  to: 'mod-disclosure-hub',     flow: 'DF035', label: 'All KPIs' },
    { from: 'mod-disclosure-hub',   to: 'mod-csrd',               flow: 'DF035', label: 'ESRS datapoints' },
    { from: 'mod-disclosure-hub',   to: 'mod-issb',               flow: 'DF035', label: 'IFRS S2 metrics' },
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
//  Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/** Get all flows that feed into a specific module */
export const getFlowsForModule = (modulePath) =>
  DATA_FLOWS.filter(f => f.destination.some(d => modulePath.includes(d)));

/** Get all flows originating from a specific data source */
export const getFlowsFromSource = (sourcePattern) =>
  DATA_FLOWS.filter(f => f.source.includes(sourcePattern));

/** Get upstream dependencies for a node in the lineage graph */
export const getUpstream = (nodeId) =>
  LINEAGE_GRAPH.edges.filter(e => e.to === nodeId).map(e => ({
    ...e,
    node: LINEAGE_GRAPH.nodes.find(n => n.id === e.from),
  }));

/** Get downstream consumers for a node in the lineage graph */
export const getDownstream = (nodeId) =>
  LINEAGE_GRAPH.edges.filter(e => e.from === nodeId).map(e => ({
    ...e,
    node: LINEAGE_GRAPH.nodes.find(n => n.id === e.to),
  }));

/** Trace full path from source to final module */
export const tracePath = (fromId, toId, visited = new Set()) => {
  if (fromId === toId) return [[fromId]];
  if (visited.has(fromId)) return [];
  visited.add(fromId);
  const nextEdges = LINEAGE_GRAPH.edges.filter(e => e.from === fromId);
  const paths = [];
  for (const edge of nextEdges) {
    const subPaths = tracePath(edge.to, toId, new Set(visited));
    for (const sp of subPaths) {
      paths.push([fromId, ...sp]);
    }
  }
  return paths;
};

/** Get summary statistics for the lineage graph */
export const getGraphStats = () => ({
  totalFlows: DATA_FLOWS.length,
  totalNodes: LINEAGE_GRAPH.nodes.length,
  totalEdges: LINEAGE_GRAPH.edges.length,
  dataSources: LINEAGE_GRAPH.nodes.filter(n => n.type === 'data_source').length,
  transforms: LINEAGE_GRAPH.nodes.filter(n => n.type === 'transform').length,
  modules: LINEAGE_GRAPH.nodes.filter(n => n.type === 'module').length,
  referenceData: LINEAGE_GRAPH.nodes.filter(n => n.type === 'reference').length,
  methodologies: [...new Set(DATA_FLOWS.map(f => f.methodology))],
  frequencies: [...new Set(DATA_FLOWS.map(f => f.frequency))],
});
