// =============================================================================
// ENH-016: SFDR RTS Annex II-V Template Generator
// =============================================================================
// Covers: Annex II  (Pre-contractual Art.8)
//         Annex III (Pre-contractual Art.9)
//         Annex IV  (Periodic Art.8)
//         Annex V   (Periodic Art.9)
// Reference: Commission Delegated Regulation (EU) 2022/1288 (SFDR Level 2 RTS)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Template Metadata
// ---------------------------------------------------------------------------
export const SFDR_TEMPLATES = {
  'Annex II': { title: 'Pre-contractual disclosure (Article 8)', sections: 12, article: 8, type: 'pre-contractual' },
  'Annex III': { title: 'Pre-contractual disclosure (Article 9)', sections: 14, article: 9, type: 'pre-contractual' },
  'Annex IV': { title: 'Periodic disclosure (Article 8)', sections: 10, article: 8, type: 'periodic' },
  'Annex V': { title: 'Periodic disclosure (Article 9)', sections: 12, article: 9, type: 'periodic' }
};

// ---------------------------------------------------------------------------
// 2. PAI Indicators (Annex I Table 1 - Mandatory)
// ---------------------------------------------------------------------------
const MANDATORY_PAI_INDICATORS = [
  { indicator: 1, category: 'GHG emissions', metric: 'GHG emissions (Scope 1, 2, 3, Total)', unit: 'tCO2e', field: 'ghg_emissions' },
  { indicator: 2, category: 'GHG emissions', metric: 'Carbon footprint', unit: 'tCO2e/EUR M invested', field: 'carbon_footprint' },
  { indicator: 3, category: 'GHG emissions', metric: 'GHG intensity of investee companies', unit: 'tCO2e/EUR M revenue', field: 'ghg_intensity' },
  { indicator: 4, category: 'GHG emissions', metric: 'Exposure to companies active in the fossil fuel sector', unit: '%', field: 'fossil_fuel_exposure' },
  { indicator: 5, category: 'GHG emissions', metric: 'Share of non-renewable energy consumption and production', unit: '%', field: 'non_renewable_energy' },
  { indicator: 6, category: 'GHG emissions', metric: 'Energy consumption intensity per high impact climate sector', unit: 'GWh/EUR M revenue', field: 'energy_intensity' },
  { indicator: 7, category: 'Biodiversity', metric: 'Activities negatively affecting biodiversity-sensitive areas', unit: '%', field: 'biodiversity_impact' },
  { indicator: 8, category: 'Water', metric: 'Emissions to water', unit: 'tonnes', field: 'water_emissions' },
  { indicator: 9, category: 'Waste', metric: 'Hazardous waste and radioactive waste ratio', unit: 'tonnes', field: 'hazardous_waste' },
  { indicator: 10, category: 'Social', metric: 'Violations of UN Global Compact principles and OECD Guidelines', unit: '%', field: 'ungc_violations' },
  { indicator: 11, category: 'Social', metric: 'Lack of processes and compliance mechanisms to monitor UNGC/OECD', unit: '%', field: 'ungc_no_process' },
  { indicator: 12, category: 'Social', metric: 'Unadjusted gender pay gap', unit: '%', field: 'gender_pay_gap' },
  { indicator: 13, category: 'Social', metric: 'Board gender diversity', unit: '%', field: 'board_gender_diversity' },
  { indicator: 14, category: 'Social', metric: 'Exposure to controversial weapons', unit: '%', field: 'controversial_weapons' }
];

// ---------------------------------------------------------------------------
// 3. Optional PAI Indicators (Table 2 & 3 selections)
// ---------------------------------------------------------------------------
const OPTIONAL_PAI_ENVIRONMENT = [
  { indicator: 'E1', category: 'Emissions', metric: 'Investments in companies without carbon emission reduction initiatives', unit: '%', field: 'no_carbon_reduction' },
  { indicator: 'E2', category: 'Emissions', metric: 'Breakdown of energy consumption by type of non-renewable sources', unit: 'GWh', field: 'energy_breakdown' },
  { indicator: 'E3', category: 'Water', metric: 'Water usage and recycling', unit: 'm3', field: 'water_usage' },
  { indicator: 'E4', category: 'Waste', metric: 'Non-recycled waste ratio', unit: 'tonnes', field: 'non_recycled_waste' },
  { indicator: 'E5', category: 'Nature', metric: 'Natural species and protected areas', unit: 'count', field: 'species_areas' },
  { indicator: 'E6', category: 'Nature', metric: 'Deforestation', unit: 'hectares', field: 'deforestation' }
];

const OPTIONAL_PAI_SOCIAL = [
  { indicator: 'S1', category: 'Social', metric: 'Lack of human rights policy', unit: '%', field: 'no_hr_policy' },
  { indicator: 'S2', category: 'Social', metric: 'Rate of accidents', unit: 'per 10k employees', field: 'accident_rate' },
  { indicator: 'S3', category: 'Social', metric: 'Number of days lost to injuries/illness', unit: 'days', field: 'days_lost' },
  { indicator: 'S4', category: 'Social', metric: 'Lack of whistleblower protection', unit: '%', field: 'no_whistleblower' },
  { indicator: 'S5', category: 'Social', metric: 'Incidents of discrimination', unit: 'count', field: 'discrimination_incidents' },
  { indicator: 'S6', category: 'Social', metric: 'Excessive CEO pay ratio', unit: 'ratio', field: 'ceo_pay_ratio' }
];

// ---------------------------------------------------------------------------
// 4. Pre-Contractual Disclosure: Article 9
// ---------------------------------------------------------------------------
export function generatePreContractualArt9(fundData) {
  const fd = fundData || {};
  return {
    annex: 'Annex III',
    article: 9,
    type: 'pre-contractual',
    generatedAt: new Date().toISOString(),
    fundName: fd.fundName || 'Unnamed Fund',
    legalEntityIdentifier: fd.lei || '',
    sections: [
      {
        id: 'sustainability_objective',
        order: 1,
        title: 'What is the sustainable investment objective of this financial product?',
        content: buildSustainabilityObjective(fd),
        required: true
      },
      {
        id: 'no_significant_harm',
        order: 2,
        title: 'How do the sustainable investments not cause significant harm to any environmental or social sustainable investment objective?',
        content: buildDNSH(fd),
        required: true
      },
      {
        id: 'sustainability_indicators',
        order: 3,
        title: 'What sustainability indicators are used to measure the attainment of the sustainable investment objective?',
        content: buildIndicators(fd),
        required: true
      },
      {
        id: 'investment_strategy',
        order: 4,
        title: 'What is the investment strategy used to attain the sustainable investment objective?',
        content: buildInvestmentStrategy(fd),
        required: true
      },
      {
        id: 'asset_allocation',
        order: 5,
        title: 'What is the asset allocation and the minimum share of sustainable investments?',
        content: buildAssetAllocation(fd),
        required: true
      },
      {
        id: 'monitoring',
        order: 6,
        title: 'How is the sustainable investment objective monitored?',
        content: buildMonitoring(fd),
        required: true
      },
      {
        id: 'methodologies',
        order: 7,
        title: 'What are the methodologies used to measure the attainment of the sustainable investment objective?',
        content: buildMethodologies(fd),
        required: true
      },
      {
        id: 'data_sources',
        order: 8,
        title: 'What are the data sources used to attain the sustainable investment objective?',
        content: buildDataSources(fd),
        required: true
      },
      {
        id: 'limitations',
        order: 9,
        title: 'What are the limitations to the methodologies and data?',
        content: buildLimitations(fd),
        required: true
      },
      {
        id: 'due_diligence',
        order: 10,
        title: 'What due diligence is carried out on the underlying assets?',
        content: buildDueDiligence(fd),
        required: true
      },
      {
        id: 'engagement_policies',
        order: 11,
        title: 'What engagement policies are implemented?',
        content: buildEngagement(fd),
        required: true
      },
      {
        id: 'benchmark',
        order: 12,
        title: 'Is a specific index designated as a reference benchmark?',
        content: buildBenchmark(fd),
        required: true
      },
      {
        id: 'taxonomy_alignment',
        order: 13,
        title: 'How is the EU Taxonomy alignment of investments determined?',
        content: buildTaxonomyAlignment(fd),
        required: true
      },
      {
        id: 'minimum_safeguards',
        order: 14,
        title: 'What is the minimum share of investments aligned with the EU Taxonomy?',
        content: buildMinimumSafeguards(fd),
        required: true
      }
    ],
    paiIndicators: generatePAITable(fd),
    taxonomyAlignment: generateTaxonomyChart(fd),
    assetAllocationChart: generateAssetAllocationChart(fd)
  };
}

// ---------------------------------------------------------------------------
// 5. Pre-Contractual Disclosure: Article 8
// ---------------------------------------------------------------------------
export function generatePreContractualArt8(fundData) {
  const fd = fundData || {};
  return {
    annex: 'Annex II',
    article: 8,
    type: 'pre-contractual',
    generatedAt: new Date().toISOString(),
    fundName: fd.fundName || 'Unnamed Fund',
    legalEntityIdentifier: fd.lei || '',
    sections: [
      {
        id: 'environmental_characteristics',
        order: 1,
        title: 'What environmental and/or social characteristics are promoted by this financial product?',
        content: buildEnvironmentalCharacteristics(fd),
        required: true
      },
      {
        id: 'no_sustainable_objective',
        order: 2,
        title: 'What sustainable investment objective does this financial product partially intend to make?',
        content: fd.sustainableInvestmentPct > 0
          ? `This product commits to a minimum of ${fd.sustainableInvestmentPct || 0}% sustainable investments.`
          : 'This product promotes environmental/social characteristics but does not have as its objective sustainable investment.',
        required: true
      },
      {
        id: 'sustainability_indicators',
        order: 3,
        title: 'What sustainability indicators are used to measure the attainment of each characteristic?',
        content: buildIndicators(fd),
        required: true
      },
      {
        id: 'investment_strategy',
        order: 4,
        title: 'What is the investment strategy used to meet the environmental/social characteristics?',
        content: buildInvestmentStrategy(fd),
        required: true
      },
      {
        id: 'asset_allocation',
        order: 5,
        title: 'What is the asset allocation planned for this financial product?',
        content: buildAssetAllocation(fd),
        required: true
      },
      {
        id: 'monitoring',
        order: 6,
        title: 'How are the environmental/social characteristics and sustainability indicators monitored?',
        content: buildMonitoring(fd),
        required: true
      },
      {
        id: 'methodologies',
        order: 7,
        title: 'What are the methodologies to measure how environmental/social characteristics are met?',
        content: buildMethodologies(fd),
        required: true
      },
      {
        id: 'data_sources',
        order: 8,
        title: 'What are the data sources used?',
        content: buildDataSources(fd),
        required: true
      },
      {
        id: 'limitations',
        order: 9,
        title: 'What are the limitations to the methodologies and data?',
        content: buildLimitations(fd),
        required: true
      },
      {
        id: 'due_diligence',
        order: 10,
        title: 'What due diligence is carried out on underlying assets?',
        content: buildDueDiligence(fd),
        required: true
      },
      {
        id: 'engagement_policies',
        order: 11,
        title: 'What engagement policies are in place?',
        content: buildEngagement(fd),
        required: true
      },
      {
        id: 'benchmark',
        order: 12,
        title: 'Is a specific index designated as a reference benchmark?',
        content: buildBenchmark(fd),
        required: true
      }
    ],
    paiIndicators: generatePAITable(fd),
    assetAllocationChart: generateAssetAllocationChart(fd)
  };
}

// ---------------------------------------------------------------------------
// 6. Periodic Report: Article 9
// ---------------------------------------------------------------------------
export function generatePeriodicArt9(fundData, periodData) {
  const fd = fundData || {};
  const pd = periodData || {};
  return {
    annex: 'Annex V',
    article: 9,
    type: 'periodic',
    generatedAt: new Date().toISOString(),
    reportingPeriod: { start: pd.periodStart || '', end: pd.periodEnd || '' },
    fundName: fd.fundName || 'Unnamed Fund',
    sections: [
      {
        id: 'objective_attainment',
        order: 1,
        title: 'To what extent was the sustainable investment objective of this financial product met?',
        content: buildObjectiveAttainment(fd, pd),
        required: true
      },
      {
        id: 'benchmark_comparison',
        order: 2,
        title: 'How did the sustainability indicators perform compared to the designated benchmark?',
        content: buildBenchmarkComparison(fd, pd),
        required: true
      },
      {
        id: 'top_investments',
        order: 3,
        title: 'What were the top investments of this financial product?',
        content: buildTopInvestments(pd),
        required: true
      },
      {
        id: 'asset_allocation_actual',
        order: 4,
        title: 'What was the actual asset allocation?',
        content: buildActualAllocation(pd),
        required: true
      },
      {
        id: 'actions_taken',
        order: 5,
        title: 'What actions have been taken to attain the sustainable investment objective?',
        content: buildActionsTaken(pd),
        required: true
      },
      {
        id: 'dnsh_performance',
        order: 6,
        title: 'How did the sustainable investments not cause significant harm during the period?',
        content: buildDNSHPerformance(pd),
        required: true
      },
      {
        id: 'data_quality',
        order: 7,
        title: 'What was the data coverage and quality?',
        content: buildDataQuality(pd),
        required: true
      },
      {
        id: 'engagement_outcomes',
        order: 8,
        title: 'What were the outcomes of engagement activities?',
        content: buildEngagementOutcomes(pd),
        required: true
      },
      {
        id: 'taxonomy_alignment_actual',
        order: 9,
        title: 'What was the actual EU Taxonomy alignment?',
        content: buildTaxonomyAlignmentActual(pd),
        required: true
      },
      {
        id: 'comparative_table',
        order: 10,
        title: 'How does this period compare to previous periods?',
        content: buildComparativeTable(fd, pd),
        required: true
      },
      {
        id: 'pai_performance',
        order: 11,
        title: 'What was the PAI indicator performance?',
        content: generatePAITablePeriodic(fd, pd),
        required: true
      },
      {
        id: 'regulatory_notes',
        order: 12,
        title: 'Additional regulatory disclosures',
        content: buildRegulatoryNotes(fd, pd),
        required: false
      }
    ],
    paiIndicators: generatePAITablePeriodic(fd, pd),
    taxonomyAlignment: generateTaxonomyChart(fd)
  };
}

// ---------------------------------------------------------------------------
// 7. Periodic Report: Article 8
// ---------------------------------------------------------------------------
export function generatePeriodicArt8(fundData, periodData) {
  const fd = fundData || {};
  const pd = periodData || {};
  return {
    annex: 'Annex IV',
    article: 8,
    type: 'periodic',
    generatedAt: new Date().toISOString(),
    reportingPeriod: { start: pd.periodStart || '', end: pd.periodEnd || '' },
    fundName: fd.fundName || 'Unnamed Fund',
    sections: [
      { id: 'characteristics_met', order: 1, title: 'To what extent were the environmental/social characteristics met?', content: buildCharacteristicsMet(fd, pd), required: true },
      { id: 'top_investments', order: 2, title: 'What were the top investments?', content: buildTopInvestments(pd), required: true },
      { id: 'asset_allocation_actual', order: 3, title: 'What was the actual asset allocation?', content: buildActualAllocation(pd), required: true },
      { id: 'indicator_performance', order: 4, title: 'What was the performance of sustainability indicators?', content: buildIndicatorPerformance(pd), required: true },
      { id: 'actions_taken', order: 5, title: 'What actions were taken to meet characteristics?', content: buildActionsTaken(pd), required: true },
      { id: 'engagement_outcomes', order: 6, title: 'What were the engagement outcomes?', content: buildEngagementOutcomes(pd), required: true },
      { id: 'data_quality', order: 7, title: 'What was the data quality?', content: buildDataQuality(pd), required: true },
      { id: 'comparative_table', order: 8, title: 'How does this period compare to previous periods?', content: buildComparativeTable(fd, pd), required: true },
      { id: 'pai_performance', order: 9, title: 'What was the PAI indicator performance?', content: generatePAITablePeriodic(fd, pd), required: true },
      { id: 'regulatory_notes', order: 10, title: 'Additional disclosures', content: buildRegulatoryNotes(fd, pd), required: false }
    ],
    paiIndicators: generatePAITablePeriodic(fd, pd)
  };
}

// ---------------------------------------------------------------------------
// 8. PAI Table Generator
// ---------------------------------------------------------------------------
export function generatePAITable(fundData) {
  const fd = fundData || {};
  const holdings = fd.holdings || [];
  const totalNav = fd.totalNav || holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;

  return {
    mandatory: MANDATORY_PAI_INDICATORS.map(pai => {
      const value = fd[pai.field] ?? computePAIFromHoldings(pai.field, holdings, totalNav);
      return {
        indicator: pai.indicator,
        category: pai.category,
        metric: pai.metric,
        value: value !== null ? round(value, 2) : 'N/A',
        unit: pai.unit,
        coverage: computeCoverage(pai.field, holdings),
        explanation: value === null ? 'Data not available for this indicator' : ''
      };
    }),
    optional_environment: OPTIONAL_PAI_ENVIRONMENT.slice(0, 1).map(pai => ({
      indicator: pai.indicator,
      metric: pai.metric,
      value: fd[pai.field] ?? 'N/A',
      unit: pai.unit
    })),
    optional_social: OPTIONAL_PAI_SOCIAL.slice(0, 1).map(pai => ({
      indicator: pai.indicator,
      metric: pai.metric,
      value: fd[pai.field] ?? 'N/A',
      unit: pai.unit
    }))
  };
}

function generatePAITablePeriodic(fundData, periodData) {
  const base = generatePAITable(fundData);
  const pd = periodData || {};
  return {
    ...base,
    periodStart: pd.periodStart || '',
    periodEnd: pd.periodEnd || '',
    previousPeriod: pd.previousPAI || null,
    yoyChange: base.mandatory.map(pai => {
      const prev = (pd.previousPAI || []).find(p => p.indicator === pai.indicator);
      if (!prev || pai.value === 'N/A' || prev.value === 'N/A') return { indicator: pai.indicator, change: 'N/A' };
      return { indicator: pai.indicator, change: round(pai.value - prev.value, 2), direction: pai.value < prev.value ? 'improved' : 'deteriorated' };
    })
  };
}

function computePAIFromHoldings(field, holdings, totalNav) {
  if (!holdings || holdings.length === 0) return null;
  switch (field) {
    case 'ghg_emissions': return holdings.reduce((s, h) => s + (h.scope1 || 0) + (h.scope2 || 0), 0);
    case 'carbon_footprint': return (holdings.reduce((s, h) => s + (h.scope1 || 0) + (h.scope2 || 0), 0) / (totalNav / 1e6)) || 0;
    case 'ghg_intensity': return holdings.reduce((s, h) => s + ((h.scope1 || 0) + (h.scope2 || 0)) * (h.weight || 0), 0);
    case 'fossil_fuel_exposure': return (holdings.filter(h => h.fossilFuel).length / holdings.length) * 100;
    case 'board_gender_diversity': return avg(holdings.map(h => h.boardGenderPct).filter(v => v != null));
    case 'gender_pay_gap': return avg(holdings.map(h => h.genderPayGap).filter(v => v != null));
    case 'controversial_weapons': return (holdings.filter(h => h.controversialWeapons).length / holdings.length) * 100;
    default: return null;
  }
}

function computeCoverage(field, holdings) {
  if (!holdings || holdings.length === 0) return '0%';
  const mapped = { ghg_emissions: ['scope1', 'scope2'], carbon_footprint: ['scope1', 'scope2'], board_gender_diversity: ['boardGenderPct'] };
  const fields = mapped[field] || [field];
  const covered = holdings.filter(h => fields.some(f => h[f] != null)).length;
  return `${round((covered / holdings.length) * 100, 0)}%`;
}

// ---------------------------------------------------------------------------
// 9. Taxonomy Chart Generator
// ---------------------------------------------------------------------------
export function generateTaxonomyChart(fundData) {
  const fd = fundData || {};
  return {
    taxonomyAlignedPct: fd.taxonomyAlignedPct || 0,
    taxonomyEligiblePct: fd.taxonomyEligiblePct || 0,
    nonTaxonomyPct: 100 - (fd.taxonomyAlignedPct || 0) - (fd.taxonomyEligiblePct || 0),
    objectiveBreakdown: {
      climateMitigation: fd.climateMitigationPct || 0,
      climateAdaptation: fd.climateAdaptationPct || 0,
      waterMarine: fd.waterMarinePct || 0,
      circularEconomy: fd.circularEconomyPct || 0,
      pollutionPrevention: fd.pollutionPreventionPct || 0,
      biodiversity: fd.biodiversityPct || 0
    },
    gas_fossil_nuclear: {
      fossilGas: fd.fossilGasPct || 0,
      nuclear: fd.nuclearPct || 0
    }
  };
}

// ---------------------------------------------------------------------------
// 10. Asset Allocation Chart
// ---------------------------------------------------------------------------
function generateAssetAllocationChart(fundData) {
  const fd = fundData || {};
  return {
    '#1 Aligned with E/S characteristics': fd.alignedPct || 80,
    '#1A Sustainable': fd.sustainablePct || 45,
    '#1A-i Taxonomy-aligned': fd.taxonomyAlignedPct || 20,
    '#1A-ii Other environmental': fd.otherEnvironmentalPct || 15,
    '#1A-iii Social': fd.socialPct || 10,
    '#1B Other E/S characteristics': (fd.alignedPct || 80) - (fd.sustainablePct || 45),
    '#2 Other': 100 - (fd.alignedPct || 80),
    minimumSustainablePct: fd.minimumSustainablePct || 40,
    minimumTaxonomyPct: fd.minimumTaxonomyPct || 15
  };
}

// ---------------------------------------------------------------------------
// 11. Section Content Builders
// ---------------------------------------------------------------------------
function buildSustainabilityObjective(fd) {
  return {
    objective: fd.sustainabilityObjective || 'The fund aims to make sustainable investments contributing to environmental objectives under the EU Taxonomy.',
    environmentalObjectives: fd.environmentalObjectives || ['Climate change mitigation', 'Climate change adaptation'],
    socialObjectives: fd.socialObjectives || [],
    doNoSignificantHarm: true
  };
}

function buildDNSH(fd) {
  return {
    paiConsideration: 'Principal Adverse Impact indicators are systematically considered to ensure no significant harm.',
    mandatoryPAIs: MANDATORY_PAI_INDICATORS.length,
    screeningCriteria: fd.dnshCriteria || ['UNGC compliance', 'OECD Guidelines adherence', 'EU Taxonomy DNSH criteria'],
    minimumSafeguards: fd.minimumSafeguards || 'Alignment with OECD Guidelines for Multinational Enterprises and UN Guiding Principles on Business and Human Rights'
  };
}

function buildEnvironmentalCharacteristics(fd) {
  return {
    characteristics: fd.esCharacteristics || ['Low carbon intensity', 'ESG best-in-class selection', 'Exclusion of controversial sectors'],
    environmentalFocus: fd.environmentalFocus || 'Climate change mitigation and pollution prevention',
    socialFocus: fd.socialFocus || 'Labour rights and community impact'
  };
}

function buildIndicators(fd) {
  return fd.indicators || [
    { name: 'Weighted average carbon intensity', unit: 'tCO2e/EUR M revenue', target: 'Below benchmark by 30%' },
    { name: 'Share of investments in fossil fuels', unit: '%', target: 'Below 5%' },
    { name: 'Board gender diversity', unit: '%', target: 'Above 30%' },
    { name: 'UNGC compliance', unit: '%', target: '100% compliant' }
  ];
}

function buildInvestmentStrategy(fd) {
  return {
    strategy: fd.investmentStrategy || 'Best-in-class ESG selection combined with negative screening and active engagement.',
    bindingElements: fd.bindingElements || ['Minimum ESG rating of BBB', 'Exclusion list applied', 'Carbon budget limit'],
    goodGovernance: fd.goodGovernance || 'Companies are assessed on management structures, employee relations, remuneration of staff, and tax compliance.'
  };
}

function buildAssetAllocation(fd) {
  return generateAssetAllocationChart(fd);
}

function buildMonitoring(fd) {
  return { frequency: fd.monitoringFrequency || 'Quarterly', method: fd.monitoringMethod || 'Automated ESG scoring with manual override for controversies', escalation: 'ESG committee review for holdings breaching thresholds' };
}

function buildMethodologies(fd) {
  return { primary: fd.methodology || 'Proprietary ESG scoring framework combining 50+ indicators', dataSources: fd.dataSources || ['MSCI ESG', 'Sustainalytics', 'CDP', 'Bloomberg ESG'], calculation: 'Weighted average of individual ESG scores at portfolio level' };
}

function buildDataSources(fd) {
  return { providers: fd.dataProviders || ['MSCI', 'Sustainalytics', 'ISS ESG', 'CDP', 'Bloomberg'], coverage: fd.dataCoverage || '92% of NAV', estimations: fd.estimationPct || '8% estimated using sector proxies', quality: fd.dataQuality || 'Annual review of data provider accuracy and methodology' };
}

function buildLimitations(fd) {
  return { limitations: fd.limitations || ['Data coverage gaps for small-cap and emerging market issuers', 'Time lag in ESG data availability (6-12 months)', 'Methodological differences across data providers'], mitigations: fd.mitigations || ['Use of multiple data providers for cross-validation', 'Proprietary estimation models for missing data', 'Direct engagement with issuers for data verification'] };
}

function buildDueDiligence(fd) {
  return { process: fd.dueDiligence || 'Multi-stage ESG due diligence including screening, in-depth analysis, and ongoing monitoring.', frequency: 'Continuous screening; full review quarterly' };
}

function buildEngagement(fd) {
  return { policy: fd.engagementPolicy || 'Active ownership through voting and direct engagement on ESG issues.', topics: fd.engagementTopics || ['Climate transition plans', 'Board diversity', 'Supply chain due diligence'], escalation: fd.escalationPolicy || 'Divestment as last resort after 12 months of unsuccessful engagement' };
}

function buildBenchmark(fd) {
  return { designated: fd.benchmarkDesignated || false, name: fd.benchmarkName || 'N/A', type: fd.benchmarkType || '', methodology: fd.benchmarkMethodology || '' };
}

function buildTaxonomyAlignment(fd) {
  return generateTaxonomyChart(fd);
}

function buildMinimumSafeguards(fd) {
  return { minimumTaxonomyPct: fd.minimumTaxonomyPct || 0, description: 'Compliance with minimum safeguards as defined in Article 18 of the Taxonomy Regulation.' };
}

function buildObjectiveAttainment(fd, pd) {
  return { met: pd.objectiveMet ?? true, summary: pd.attainmentSummary || 'The sustainable investment objective was met during the reporting period.', indicators: pd.indicatorResults || [] };
}

function buildBenchmarkComparison(fd, pd) {
  return { benchmarkReturn: pd.benchmarkReturn || 'N/A', fundReturn: pd.fundReturn || 'N/A', esgComparison: pd.esgComparison || 'N/A' };
}

function buildTopInvestments(pd) {
  return { holdings: (pd.topHoldings || []).slice(0, 15).map(h => ({ name: h.name, sector: h.sector, country: h.country, weight: h.weight, esgRating: h.esgRating })) };
}

function buildActualAllocation(pd) {
  return { sustainablePct: pd.actualSustainablePct || 0, taxonomyAlignedPct: pd.actualTaxonomyPct || 0, otherPct: 100 - (pd.actualSustainablePct || 0), deviation: pd.allocationDeviation || 'Within tolerance' };
}

function buildActionsTaken(pd) {
  return { actions: pd.actions || ['Engaged 15 companies on climate targets', 'Divested from 3 non-compliant issuers', 'Voted on 120 ESG-related shareholder proposals'] };
}

function buildDNSHPerformance(pd) {
  return { paiBreaches: pd.paiBreaches || 0, remediationActions: pd.remediationActions || 'No material breaches identified' };
}

function buildDataQuality(pd) {
  return { coveragePct: pd.dataCoveragePct || 92, estimatedPct: pd.estimatedPct || 8, providerChanges: pd.providerChanges || 'None' };
}

function buildEngagementOutcomes(pd) {
  return { companiesEngaged: pd.companiesEngaged || 0, successfulOutcomes: pd.successfulOutcomes || 0, ongoingDialogues: pd.ongoingDialogues || 0, escalations: pd.escalations || 0 };
}

function buildTaxonomyAlignmentActual(pd) {
  return { actualAlignedPct: pd.actualTaxonomyPct || 0, verificationMethod: pd.taxonomyVerification || 'Third-party data providers and issuer disclosures' };
}

function buildComparativeTable(fd, pd) {
  return { periods: pd.comparativePeriods || [], note: 'Comparative data available from the second reporting period onwards.' };
}

function buildRegulatoryNotes(fd, pd) {
  return { sfdrVersion: '2022/1288', lastAmendment: '2023/363', disclaimer: 'This disclosure is prepared in accordance with the SFDR Level 2 Regulatory Technical Standards.' };
}

function buildCharacteristicsMet(fd, pd) {
  return { met: pd.characteristicsMet ?? true, summary: pd.characteristicsSummary || 'Environmental and social characteristics were promoted as intended.' };
}

function buildIndicatorPerformance(pd) {
  return { indicators: pd.indicatorResults || [], summary: pd.performanceSummary || '' };
}

// ---------------------------------------------------------------------------
// 12. Export Utility
// ---------------------------------------------------------------------------
export function exportTemplate(template, format = 'json') {
  if (format === 'json') {
    return {
      format: 'json',
      content: template,
      metadata: {
        annex: template.annex,
        article: template.article,
        type: template.type,
        fundName: template.fundName,
        generatedAt: template.generatedAt,
        sectionCount: (template.sections || []).length
      }
    };
  }

  if (format === 'html') {
    const sections = (template.sections || []).map(s =>
      `<section id="${s.id}"><h2>${s.order}. ${s.title}</h2><div class="content">${JSON.stringify(s.content, null, 2)}</div></section>`
    ).join('\n');

    return {
      format: 'html',
      content: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${template.annex} - ${template.fundName}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:2rem}h1{color:#1e3a5f}h2{color:#2d5f8a;border-bottom:1px solid #ddd;padding-bottom:0.5rem}section{margin:1.5rem 0}.content{padding:1rem;background:#f9f9f9;border-radius:4px}</style></head><body><h1>${template.annex}: ${SFDR_TEMPLATES[template.annex]?.title || ''}</h1><p><strong>Fund:</strong> ${template.fundName}</p><p><strong>Generated:</strong> ${template.generatedAt}</p>${sections}</body></html>`,
      metadata: { annex: template.annex, sectionCount: (template.sections || []).length }
    };
  }

  return { format: 'json', content: template };
}

// ---------------------------------------------------------------------------
// 13. Helpers
// ---------------------------------------------------------------------------
function round(v, d) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

function avg(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
