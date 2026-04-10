/**
 * MODULE REGISTRY — full list of platform modules organized by domain group.
 * Used by the admin panel for visual module access management.
 * No DB dependency — this is the authoritative front-end registry.
 */

export const MODULE_REGISTRY = [
  {
    group: 'Disclosure & Reporting',
    icon: '📋',
    color: '#1d4ed8',
    modules: [
      { path: '/sfdr-classification',       label: 'SFDR Fund Classification' },
      { path: '/sfdr-pai',                   label: 'SFDR PAI Indicators' },
      { path: '/sfdr-art9',                  label: 'SFDR Article 9 Monitor' },
      { path: '/sfdr-v2',                    label: 'SFDR v2 Reporting' },
      { path: '/sfdr-pai-dashboard',         label: 'SFDR PAI Dashboard' },
      { path: '/csrd-dma',                   label: 'CSRD DMA Assessment' },
      { path: '/csrd-xbrl',                  label: 'CSRD XBRL Tagging' },
      { path: '/csrd-esrs-full',             label: 'CSRD ESRS Full Suite' },
      { path: '/csrd-esrs-automation',       label: 'CSRD ESRS Automation' },
      { path: '/issb-tcfd',                  label: 'ISSB / TCFD Alignment' },
      { path: '/issb-materiality',           label: 'ISSB Materiality' },
      { path: '/issb-disclosure',            label: 'ISSB Disclosure Engine' },
    ],
  },
  {
    group: 'Climate Alignment',
    icon: '🌡️',
    color: '#dc2626',
    modules: [
      { path: '/paris-alignment',            label: 'Paris Alignment' },
      { path: '/portfolio-temperature-score',label: 'Portfolio Temperature Score' },
      { path: '/temperature-alignment',      label: 'Temperature Alignment Tool' },
      { path: '/net-zero-tracker',           label: 'Net Zero Tracker' },
      { path: '/scope3-engine',              label: 'Scope 3 Engine' },
      { path: '/climate-var',                label: 'Climate VaR' },
    ],
  },
  {
    group: 'Portfolio Analytics',
    icon: '📊',
    color: '#065f46',
    modules: [
      { path: '/pcaf-financed-emissions',    label: 'PCAF Financed Emissions' },
      { path: '/eu-taxonomy',                label: 'EU Taxonomy Alignment' },
      { path: '/green-bond-analytics',       label: 'Green Bond Analytics' },
      { path: '/green-bond-portfolio-analytics', label: 'Green Bond Portfolio' },
      { path: '/portfolio-manager',          label: 'Portfolio Manager' },
      { path: '/integrated-carbon-emissions',label: 'Integrated Carbon Emissions' },
      { path: '/eu-taxonomy-calculator',     label: 'EU Taxonomy Calculator' },
    ],
  },
  {
    group: 'Physical & Climate Risk',
    icon: '🌊',
    color: '#0891b2',
    modules: [
      { path: '/physical-risk-portfolio',    label: 'Physical Risk Portfolio' },
      { path: '/physical-hazard-map',        label: 'Physical Hazard Map' },
      { path: '/water-risk-analytics',       label: 'Water Risk Analytics' },
      { path: '/physical-risk-pricing',      label: 'Physical Risk Pricing' },
      { path: '/real-time-climate-intelligence', label: 'Real-Time Climate Intelligence' },
      { path: '/climate-portfolio-construction', label: 'Climate Portfolio Construction' },
    ],
  },
  {
    group: 'Sovereign & Country Risk',
    icon: '🗺️',
    color: '#7c3aed',
    modules: [
      { path: '/sovereign-climate-risk',     label: 'Sovereign Climate Risk' },
      { path: '/sovereign-physical-risk',    label: 'Sovereign Physical Risk' },
      { path: '/sovereign-esg-scorer',       label: 'Sovereign ESG Scorer' },
      { path: '/country-risk-dashboard',     label: 'Country Risk Dashboard' },
      { path: '/emerging-market-climate',    label: 'EM Climate Risk' },
    ],
  },
  {
    group: 'Carbon Markets',
    icon: '🌐',
    color: '#1b3a5c',
    modules: [
      { path: '/carbon-credit-engine-hub',   label: 'Carbon Credit Engine Hub' },
      { path: '/carbon-credit-portfolio',    label: 'Carbon Credit Portfolio' },
      { path: '/carbon-methodology-comparison', label: 'Methodology Comparison' },
      { path: '/article6-markets',           label: 'Article 6 Markets' },
      { path: '/voluntary-carbon-market',    label: 'Voluntary Carbon Market' },
      { path: '/carbon-pricing-analytics',   label: 'Carbon Pricing Analytics' },
    ],
  },
  {
    group: 'Climate Stress Testing',
    icon: '⚡',
    color: '#b45309',
    modules: [
      { path: '/stress-test-orchestrator',   label: 'Stress Test Orchestrator' },
      { path: '/scenario-stress-test',       label: 'Scenario Stress Test' },
      { path: '/ngfs-scenarios',             label: 'NGFS Scenarios' },
      { path: '/stochastic-scenarios',       label: 'Stochastic Scenarios' },
      { path: '/cascading-default-modeler',  label: 'Cascading Default Modeler' },
      { path: '/central-bank-climate',       label: 'Central Bank Climate' },
    ],
  },
  {
    group: 'Insurance & Actuarial',
    icon: '🏥',
    color: '#065f46',
    modules: [
      { path: '/climate-actuarial-hub',      label: 'Climate Actuarial Hub' },
      { path: '/catastrophe-modelling',      label: 'Catastrophe Modelling' },
      { path: '/parametric-insurance',       label: 'Parametric Insurance' },
      { path: '/reinsurance-climate',        label: 'Reinsurance Climate' },
      { path: '/pandemic-climate-nexus',     label: 'Pandemic-Climate Nexus' },
      { path: '/insurance-transition-risk',  label: 'Insurance Transition Risk' },
    ],
  },
  {
    group: 'Impact & SDG',
    icon: '🌱',
    color: '#4a7c59',
    modules: [
      { path: '/impact-measurement',         label: 'Impact Measurement' },
      { path: '/sdg-alignment',              label: 'SDG Alignment' },
      { path: '/social-impact',              label: 'Social Impact' },
      { path: '/just-transition-intelligence', label: 'Just Transition' },
      { path: '/equitable-earth',            label: 'Equitable Earth' },
      { path: '/undp-blended-finance',       label: 'UNDP Blended Finance' },
    ],
  },
  {
    group: 'ESG Intelligence',
    icon: '🧠',
    color: '#6d28d9',
    modules: [
      { path: '/esg-ratings-aggregator',     label: 'ESG Ratings Aggregator' },
      { path: '/sentiment-analysis',         label: 'ESG Sentiment Analysis' },
      { path: '/ai-sentiment',               label: 'AI Sentiment Engine' },
      { path: '/peer-transition-benchmarker', label: 'Peer Benchmarker' },
      { path: '/esg-controversy-monitor',    label: 'Controversy Monitor' },
      { path: '/credit-integrity-dd',        label: 'Credit Integrity DD' },
    ],
  },
  {
    group: 'Nature & Biodiversity',
    icon: '🌿',
    color: '#166534',
    modules: [
      { path: '/nature-capital-accounting',  label: 'Nature Capital Accounting' },
      { path: '/biodiversity-credit-engine', label: 'Biodiversity Credits' },
      { path: '/tnfd-reporting',             label: 'TNFD Reporting' },
      { path: '/deforestation-risk',         label: 'Deforestation Risk' },
      { path: '/ecosystem-services',         label: 'Ecosystem Services' },
    ],
  },
  {
    group: 'Macro & Transition',
    icon: '📈',
    color: '#9f1239',
    modules: [
      { path: '/macro-transition',           label: 'Macro Transition Risk' },
      { path: '/stranded-assets',            label: 'Stranded Assets' },
      { path: '/climate-litigation-risk',    label: 'Climate Litigation Risk' },
      { path: '/transition-finance',         label: 'Transition Finance' },
      { path: '/paris-transition-monitor',   label: 'Paris Transition Monitor' },
    ],
  },
  {
    group: 'Credit & Structured Finance',
    icon: '🏦',
    color: '#991b1b',
    modules: [
      { path: '/structured-credit-climate',  label: 'Structured Credit Climate' },
      { path: '/green-loan-analytics',       label: 'Green Loan Analytics' },
      { path: '/climate-risk-capital',       label: 'Climate Risk Capital' },
      { path: '/supervisory-analytics',      label: 'Supervisory Analytics' },
      { path: '/pcaf-sovereign',             label: 'PCAF Sovereign' },
    ],
  },
  {
    group: 'Dynamic Materiality',
    icon: '⚖️',
    color: '#0369a1',
    modules: [
      { path: '/dynamic-materiality-engine', label: 'Dynamic Materiality Engine' },
      { path: '/double-materiality',         label: 'Double Materiality' },
      { path: '/act-assessment',             label: 'ACT Assessment' },
      { path: '/digital-product-passport',   label: 'Digital Product Passport' },
      { path: '/supply-chain-carbon',        label: 'Supply Chain Carbon' },
    ],
  },
  {
    group: 'Real-Time & AI',
    icon: '⚡',
    color: '#0f766e',
    modules: [
      { path: '/real-time-climate-data',     label: 'Real-Time Climate Data' },
      { path: '/ai-risk-scanner',            label: 'AI Risk Scanner' },
      { path: '/climate-news-monitor',       label: 'Climate News Monitor' },
      { path: '/regulatory-radar',           label: 'Regulatory Radar' },
      { path: '/predictive-risk-engine',     label: 'Predictive Risk Engine' },
    ],
  },
];

// Flattened list of all paths for quick lookups
export const ALL_MODULE_PATHS = MODULE_REGISTRY.flatMap(g => g.modules.map(m => m.path));

// Total module count
export const TOTAL_MODULES = ALL_MODULE_PATHS.length;

// Get label for a path
export const getModuleLabel = (path) => {
  for (const g of MODULE_REGISTRY) {
    const m = g.modules.find(m => m.path === path);
    if (m) return m.label;
  }
  return path;
};

// Get group for a path
export const getModuleGroup = (path) => {
  for (const g of MODULE_REGISTRY) {
    if (g.modules.some(m => m.path === path)) return g.group;
  }
  return 'Other';
};
