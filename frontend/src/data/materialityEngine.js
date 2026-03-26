/**
 * Dynamic Materiality Calculation Engine v1.0
 *
 * Core computation engine for CSRD/ESRS double materiality assessment.
 * All 6 Sprint T modules import from this single source of truth.
 *
 * Usage:
 *   import { MaterialityEngine } from '../../data/materialityEngine';
 *   const assessment = MaterialityEngine.assessCompany(company);
 *   const portfolio  = MaterialityEngine.assessPortfolio(holdings);
 *
 * Pure JavaScript — NO React, NO JSX, NO recharts.
 */

import { GLOBAL_COMPANY_MASTER } from './globalCompanyMaster';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: ESRS TOPIC DEFINITIONS (10 topics, 30 sub-topics)
// ═══════════════════════════════════════════════════════════════

const ESRS_TOPICS = [
  {
    id: 'E1', name: 'Climate Change', esrs: 'ESRS E1', pillar: 'Environmental',
    subtopics: [
      { id: 'E1-1', name: 'Climate change mitigation' },
      { id: 'E1-2', name: 'Climate change adaptation' },
      { id: 'E1-3', name: 'Energy' },
    ],
    financial_indicators: {
      revenue_impact: 'Carbon pricing, stranded assets, demand shifts',
      cost_impact: 'Compliance costs, energy costs, insurance premiums',
      capital_impact: 'Cost of capital, investor exclusions, green bond access',
      asset_impact: 'Asset impairment, stranded infrastructure',
    },
    impact_indicators: {
      scale: 'Global emissions contribution',
      scope: 'Reversibility of climate damage',
      irremediability: 'Long-term atmospheric persistence of GHGs',
    },
  },
  {
    id: 'E2', name: 'Pollution', esrs: 'ESRS E2', pillar: 'Environmental',
    subtopics: [
      { id: 'E2-1', name: 'Pollution of air' },
      { id: 'E2-2', name: 'Pollution of water' },
      { id: 'E2-3', name: 'Pollution of soil' },
    ],
    financial_indicators: {
      revenue_impact: 'Clean-up liabilities, product bans',
      cost_impact: 'Remediation costs, fines, permit restrictions',
      capital_impact: 'Litigation risk, regulatory penalties',
      asset_impact: 'Contaminated site devaluation',
    },
    impact_indicators: {
      scale: 'Volume and toxicity of pollutants released',
      scope: 'Geographic spread of contamination',
      irremediability: 'Persistence of pollutants in ecosystems',
    },
  },
  {
    id: 'E3', name: 'Water & Marine Resources', esrs: 'ESRS E3', pillar: 'Environmental',
    subtopics: [
      { id: 'E3-1', name: 'Water consumption' },
      { id: 'E3-2', name: 'Water withdrawals' },
      { id: 'E3-3', name: 'Marine resources' },
    ],
    financial_indicators: {
      revenue_impact: 'Water scarcity limiting production, pricing volatility',
      cost_impact: 'Water treatment costs, extraction permits',
      capital_impact: 'Operational continuity risk in water-stressed regions',
      asset_impact: 'Facility shutdowns due to water unavailability',
    },
    impact_indicators: {
      scale: 'Total water withdrawal relative to local availability',
      scope: 'Number of water-stressed basins affected',
      irremediability: 'Aquifer depletion, marine habitat destruction',
    },
  },
  {
    id: 'E4', name: 'Biodiversity & Ecosystems', esrs: 'ESRS E4', pillar: 'Environmental',
    subtopics: [
      { id: 'E4-1', name: 'Direct drivers of biodiversity loss' },
      { id: 'E4-2', name: 'Impacts on species' },
      { id: 'E4-3', name: 'Impacts on ecosystems' },
    ],
    financial_indicators: {
      revenue_impact: 'Supply chain disruption from ecosystem degradation',
      cost_impact: 'Biodiversity offsets, habitat restoration costs',
      capital_impact: 'Regulatory restrictions on land use',
      asset_impact: 'Land value impairment near degraded ecosystems',
    },
    impact_indicators: {
      scale: 'Hectares of habitat affected, species impacted',
      scope: 'Proximity to protected or critical habitats',
      irremediability: 'Species extinction, irreversible habitat loss',
    },
  },
  {
    id: 'E5', name: 'Resource Use & Circular Economy', esrs: 'ESRS E5', pillar: 'Environmental',
    subtopics: [
      { id: 'E5-1', name: 'Resource inflows' },
      { id: 'E5-2', name: 'Resource outflows (waste)' },
      { id: 'E5-3', name: 'Circular economy practices' },
    ],
    financial_indicators: {
      revenue_impact: 'Circular revenue models, product-as-a-service',
      cost_impact: 'Raw material price volatility, waste disposal costs',
      capital_impact: 'Extended producer responsibility liabilities',
      asset_impact: 'Obsolete linear production infrastructure',
    },
    impact_indicators: {
      scale: 'Volume of virgin resource consumption',
      scope: 'Waste generation and landfill contribution',
      irremediability: 'Non-recyclable material accumulation',
    },
  },
  {
    id: 'S1', name: 'Own Workforce', esrs: 'ESRS S1', pillar: 'Social',
    subtopics: [
      { id: 'S1-1', name: 'Working conditions' },
      { id: 'S1-2', name: 'Equal treatment & opportunities' },
      { id: 'S1-3', name: 'Other work-related rights' },
    ],
    financial_indicators: {
      revenue_impact: 'Talent retention, productivity, brand reputation',
      cost_impact: 'Litigation, compensation, training investment',
      capital_impact: 'Social license to operate, union relations',
      asset_impact: 'Human capital depreciation',
    },
    impact_indicators: {
      scale: 'Number of workers affected',
      scope: 'Severity of labour rights issues',
      irremediability: 'Long-term health impacts, career damage',
    },
  },
  {
    id: 'S2', name: 'Workers in the Value Chain', esrs: 'ESRS S2', pillar: 'Social',
    subtopics: [
      { id: 'S2-1', name: 'Working conditions in supply chain' },
      { id: 'S2-2', name: 'Equal treatment in supply chain' },
      { id: 'S2-3', name: 'Child and forced labour prevention' },
    ],
    financial_indicators: {
      revenue_impact: 'Supply chain disruption, boycotts',
      cost_impact: 'Due diligence costs, supplier switching costs',
      capital_impact: 'EU CSDDD compliance exposure',
      asset_impact: 'Brand value impairment from supply chain scandals',
    },
    impact_indicators: {
      scale: 'Size of supply chain workforce exposed',
      scope: 'Number of high-risk supplier jurisdictions',
      irremediability: 'Forced/child labour exploitation severity',
    },
  },
  {
    id: 'S3', name: 'Affected Communities', esrs: 'ESRS S3', pillar: 'Social',
    subtopics: [
      { id: 'S3-1', name: 'Community economic impacts' },
      { id: 'S3-2', name: 'Community social impacts' },
      { id: 'S3-3', name: 'Indigenous peoples\' rights' },
    ],
    financial_indicators: {
      revenue_impact: 'Social license withdrawal, project delays',
      cost_impact: 'Community investment, resettlement costs',
      capital_impact: 'Permitting risk, reputational damage',
      asset_impact: 'Project cancellations, operational shutdowns',
    },
    impact_indicators: {
      scale: 'Population directly affected',
      scope: 'Number of communities impacted',
      irremediability: 'Displacement, cultural heritage destruction',
    },
  },
  {
    id: 'S4', name: 'Consumers & End-Users', esrs: 'ESRS S4', pillar: 'Social',
    subtopics: [
      { id: 'S4-1', name: 'Information-related impacts (privacy)' },
      { id: 'S4-2', name: 'Personal safety of consumers' },
      { id: 'S4-3', name: 'Social inclusion of consumers' },
    ],
    financial_indicators: {
      revenue_impact: 'Customer trust, market share, product recalls',
      cost_impact: 'GDPR fines, product liability, safety compliance',
      capital_impact: 'Data breach class actions, regulatory sanctions',
      asset_impact: 'Brand value destruction from consumer harm',
    },
    impact_indicators: {
      scale: 'Number of consumers/users affected',
      scope: 'Severity of data or safety incidents',
      irremediability: 'Health damage, identity theft persistence',
    },
  },
  {
    id: 'G1', name: 'Business Conduct', esrs: 'ESRS G1', pillar: 'Governance',
    subtopics: [
      { id: 'G1-1', name: 'Corporate culture & business ethics' },
      { id: 'G1-2', name: 'Anti-corruption & bribery' },
      { id: 'G1-3', name: 'Political engagement & lobbying' },
    ],
    financial_indicators: {
      revenue_impact: 'Contract disqualification, market exclusion',
      cost_impact: 'Fines, legal costs, compliance programme costs',
      capital_impact: 'Investor exclusions, governance premium/discount',
      asset_impact: 'Debarment from public contracts',
    },
    impact_indicators: {
      scale: 'Scope of corrupt or unethical practices',
      scope: 'Jurisdictions and value chain tiers affected',
      irremediability: 'Institutional trust erosion, systemic corruption',
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// SECTION 2: SECTOR-SPECIFIC DEFAULT MATERIALITY SCORES
// ═══════════════════════════════════════════════════════════════

/**
 * For each of 11 GICS sectors, default financial_materiality (0-100)
 * and impact_materiality (0-100) for each ESRS topic.
 * These are the starting point — adjusted by company-specific data.
 */
const SECTOR_MATERIALITY_DEFAULTS = {
  Energy: {
    E1: { financial: 95, impact: 98 },
    E2: { financial: 80, impact: 85 },
    E3: { financial: 70, impact: 65 },
    E4: { financial: 60, impact: 70 },
    E5: { financial: 40, impact: 45 },
    S1: { financial: 65, impact: 60 },
    S2: { financial: 55, impact: 65 },
    S3: { financial: 70, impact: 75 },
    S4: { financial: 30, impact: 25 },
    G1: { financial: 75, impact: 70 },
  },
  Materials: {
    E1: { financial: 85, impact: 90 },
    E2: { financial: 85, impact: 88 },
    E3: { financial: 75, impact: 70 },
    E4: { financial: 80, impact: 85 },
    E5: { financial: 70, impact: 75 },
    S1: { financial: 60, impact: 55 },
    S2: { financial: 70, impact: 75 },
    S3: { financial: 65, impact: 70 },
    S4: { financial: 35, impact: 30 },
    G1: { financial: 65, impact: 60 },
  },
  Industrials: {
    E1: { financial: 75, impact: 70 },
    E2: { financial: 65, impact: 60 },
    E3: { financial: 60, impact: 55 },
    E4: { financial: 50, impact: 55 },
    E5: { financial: 55, impact: 50 },
    S1: { financial: 70, impact: 65 },
    S2: { financial: 60, impact: 65 },
    S3: { financial: 55, impact: 60 },
    S4: { financial: 45, impact: 40 },
    G1: { financial: 60, impact: 55 },
  },
  'Consumer Discretionary': {
    E1: { financial: 55, impact: 50 },
    E2: { financial: 45, impact: 40 },
    E3: { financial: 40, impact: 35 },
    E4: { financial: 35, impact: 40 },
    E5: { financial: 60, impact: 55 },
    S1: { financial: 65, impact: 60 },
    S2: { financial: 80, impact: 85 },
    S3: { financial: 40, impact: 35 },
    S4: { financial: 75, impact: 70 },
    G1: { financial: 55, impact: 50 },
  },
  'Consumer Staples': {
    E1: { financial: 65, impact: 60 },
    E2: { financial: 55, impact: 50 },
    E3: { financial: 55, impact: 60 },
    E4: { financial: 75, impact: 80 },
    E5: { financial: 70, impact: 65 },
    S1: { financial: 55, impact: 50 },
    S2: { financial: 85, impact: 90 },
    S3: { financial: 60, impact: 65 },
    S4: { financial: 80, impact: 75 },
    G1: { financial: 50, impact: 45 },
  },
  'Health Care': {
    E1: { financial: 40, impact: 35 },
    E2: { financial: 55, impact: 50 },
    E3: { financial: 35, impact: 30 },
    E4: { financial: 30, impact: 35 },
    E5: { financial: 50, impact: 45 },
    S1: { financial: 60, impact: 55 },
    S2: { financial: 45, impact: 50 },
    S3: { financial: 40, impact: 45 },
    S4: { financial: 90, impact: 85 },
    G1: { financial: 75, impact: 70 },
  },
  Financials: {
    E1: { financial: 60, impact: 30 },
    E2: { financial: 20, impact: 15 },
    E3: { financial: 15, impact: 10 },
    E4: { financial: 25, impact: 20 },
    E5: { financial: 15, impact: 10 },
    S1: { financial: 55, impact: 50 },
    S2: { financial: 35, impact: 30 },
    S3: { financial: 40, impact: 35 },
    S4: { financial: 70, impact: 65 },
    G1: { financial: 85, impact: 80 },
  },
  'Information Technology': {
    E1: { financial: 45, impact: 30 },
    E2: { financial: 25, impact: 20 },
    E3: { financial: 50, impact: 40 },
    E4: { financial: 15, impact: 10 },
    E5: { financial: 40, impact: 35 },
    S1: { financial: 65, impact: 60 },
    S2: { financial: 50, impact: 55 },
    S3: { financial: 25, impact: 20 },
    S4: { financial: 85, impact: 80 },
    G1: { financial: 60, impact: 55 },
  },
  'Communication Services': {
    E1: { financial: 35, impact: 25 },
    E2: { financial: 20, impact: 15 },
    E3: { financial: 40, impact: 30 },
    E4: { financial: 10, impact: 10 },
    E5: { financial: 25, impact: 20 },
    S1: { financial: 55, impact: 50 },
    S2: { financial: 30, impact: 25 },
    S3: { financial: 30, impact: 25 },
    S4: { financial: 90, impact: 85 },
    G1: { financial: 65, impact: 60 },
  },
  Utilities: {
    E1: { financial: 90, impact: 95 },
    E2: { financial: 75, impact: 80 },
    E3: { financial: 85, impact: 80 },
    E4: { financial: 65, impact: 70 },
    E5: { financial: 50, impact: 45 },
    S1: { financial: 60, impact: 55 },
    S2: { financial: 40, impact: 35 },
    S3: { financial: 70, impact: 75 },
    S4: { financial: 55, impact: 50 },
    G1: { financial: 65, impact: 60 },
  },
  'Real Estate': {
    E1: { financial: 70, impact: 65 },
    E2: { financial: 40, impact: 35 },
    E3: { financial: 75, impact: 70 },
    E4: { financial: 45, impact: 50 },
    E5: { financial: 55, impact: 50 },
    S1: { financial: 50, impact: 45 },
    S2: { financial: 30, impact: 25 },
    S3: { financial: 60, impact: 65 },
    S4: { financial: 40, impact: 35 },
    G1: { financial: 55, impact: 50 },
  },
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: COMPANY-SPECIFIC MATERIALITY ADJUSTMENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Adjusts sector default materiality based on company-specific data.
 * Uses real data from GLOBAL_COMPANY_MASTER to modify scores.
 *
 * Adjustment factors:
 * - GHG Intensity: Companies above sector median get E1 financial +10-20
 * - ESG Score: Low ESG (<40) increases S1/G1 impact materiality
 * - SBTi Status: Committed -> E1 financial -5 (lower transition risk)
 * - Transition Risk: High (>70) -> E1 financial +15
 * - Employees: Large workforce (>50K) -> S1 more material
 * - Sector-specific: Energy with high scope1 -> E1 even higher
 */
function computeCompanyAdjustments(company) {
  const adj = {};
  const c = company;

  // Sector peers for relative comparisons
  const sectorPeers = GLOBAL_COMPANY_MASTER.filter(p => p.sector === c.sector);
  const medianIntensity = median(sectorPeers.map(p => p.ghg_intensity_tco2e_per_mn || 0));
  const companyIntensity = c.ghg_intensity_tco2e_per_mn || 0;
  const medianEsg = median(sectorPeers.map(p => p.esg_score || 50));

  // E1 Climate — carbon intensity relative to sector + transition risk + SBTi
  adj.E1 = {
    financial: clamp(
      (companyIntensity > medianIntensity * 1.5 ? 15 : companyIntensity > medianIntensity ? 5 : -5) +
      ((c.transition_risk_score || 50) > 70 ? 10 : (c.transition_risk_score || 50) > 50 ? 5 : 0) +
      (c.sbti_committed ? -5 : 5),
      -20, 25
    ),
    impact: clamp(
      ((c.scope1_mt || 0) > 10 ? 15 : (c.scope1_mt || 0) > 1 ? 8 : 0) +
      (companyIntensity > medianIntensity * 2 ? 10 : 0),
      -10, 25
    ),
  };

  // E2 Pollution — heavy industry sectors and low-ESG companies
  const pollutionSectors = ['Energy', 'Materials', 'Utilities'];
  const pollutionImpactSectors = ['Energy', 'Materials', 'Utilities', 'Consumer Staples'];
  adj.E2 = {
    financial: (pollutionSectors.includes(c.sector) ? 5 : -5) +
      ((c.esg_score || 50) < 35 ? 8 : 0),
    impact: (pollutionImpactSectors.includes(c.sector) ? 8 : -3) +
      ((c.scope1_mt || 0) > 5 ? 5 : 0),
  };

  // E3 Water — water-intensive sectors
  const waterSectors = ['Energy', 'Materials', 'Utilities', 'Consumer Staples'];
  adj.E3 = {
    financial: waterSectors.includes(c.sector) ? 8 : -5,
    impact: waterSectors.includes(c.sector) ? 10 : -5,
  };

  // E4 Biodiversity — land-intensive and extractive sectors
  const bioFinSectors = ['Energy', 'Materials', 'Consumer Staples', 'Real Estate'];
  const bioImpSectors = ['Energy', 'Materials', 'Consumer Staples'];
  adj.E4 = {
    financial: bioFinSectors.includes(c.sector) ? 8 : -8,
    impact: bioImpSectors.includes(c.sector) ? 12 : -5,
  };

  // E5 Circular Economy — manufacturing & consumer product sectors
  const circularFinSectors = ['Materials', 'Consumer Discretionary', 'Consumer Staples', 'Industrials'];
  const circularImpSectors = ['Materials', 'Consumer Discretionary', 'Consumer Staples'];
  adj.E5 = {
    financial: circularFinSectors.includes(c.sector) ? 5 : -5,
    impact: circularImpSectors.includes(c.sector) ? 8 : -3,
  };

  // S1 Own Workforce — large companies more material, low-ESG more risk
  const empFactor = (c.employees || 0) > 100000 ? 10 : (c.employees || 0) > 10000 ? 5 : 0;
  const esgPenalty = (c.esg_score || 50) < 40 ? 10 : 0;
  adj.S1 = {
    financial: empFactor + esgPenalty,
    impact: empFactor + 3,
  };

  // S2 Value Chain Workers — consumer-facing & materials sectors
  const vcwSectors = ['Consumer Discretionary', 'Consumer Staples', 'Materials'];
  adj.S2 = {
    financial: vcwSectors.includes(c.sector) ? 10 : -5,
    impact: vcwSectors.includes(c.sector) ? 15 : -3,
  };

  // S3 Communities — extractive, infrastructure & real estate
  const commSectors = ['Energy', 'Materials', 'Real Estate', 'Utilities'];
  adj.S3 = {
    financial: commSectors.includes(c.sector) ? 8 : -5,
    impact: (commSectors.includes(c.sector) ? 12 : -3) +
      ((c.scope1_mt || 0) > 5 ? 5 : 0),
  };

  // S4 Consumers — B2C and data-handling sectors
  const consumerSectors = ['Health Care', 'Information Technology', 'Communication Services',
    'Consumer Discretionary', 'Consumer Staples', 'Financials'];
  const consumerImpSectors = ['Health Care', 'Information Technology',
    'Communication Services', 'Consumer Staples'];
  adj.S4 = {
    financial: consumerSectors.includes(c.sector) ? 8 : -5,
    impact: consumerImpSectors.includes(c.sector) ? 10 : -3,
  };

  // G1 Business Conduct — high-ESG-risk companies, relative to sector
  const esgGap = (c.esg_score || 50) - medianEsg;
  adj.G1 = {
    financial: (c.esg_score || 50) < 40 ? 15 : (c.esg_score || 50) < 60 ? 5 : -5,
    impact: (c.esg_score || 50) < 40 ? 12 : esgGap < -10 ? 5 : 0,
  };

  return adj;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: CORE ASSESSMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Assess double materiality for a single company.
 * Returns scores for all 10 ESRS topics with classification.
 */
function assessCompany(company, threshold = 50) {
  const sector = company.sector || 'Financials';
  const defaults = SECTOR_MATERIALITY_DEFAULTS[sector] || SECTOR_MATERIALITY_DEFAULTS['Financials'];
  const adjustments = computeCompanyAdjustments(company);

  const overrides = loadOverrides();

  const topics = ESRS_TOPICS.map(topic => {
    const base = defaults[topic.id] || { financial: 50, impact: 50 };
    const adj = adjustments[topic.id] || { financial: 0, impact: 0 };

    const overrideKey = `${company.ticker}_${topic.id}`;
    const manual = overrides[overrideKey] || {};

    const financial = clamp(manual.financial ?? (base.financial + adj.financial), 0, 100);
    const impact = clamp(manual.impact ?? (base.impact + adj.impact), 0, 100);

    const financial_material = financial >= threshold;
    const impact_material = impact >= threshold;

    return {
      id: topic.id,
      name: topic.name,
      esrs: topic.esrs,
      pillar: topic.pillar,
      subtopics: topic.subtopics,
      financial_score: Math.round(financial),
      impact_score: Math.round(impact),
      financial_material,
      impact_material,
      doubly_material: financial_material && impact_material,
      material: financial_material || impact_material,
      quadrant: financial_material && impact_material ? 'Double' :
                financial_material ? 'Financial Only' :
                impact_material ? 'Impact Only' : 'Not Material',
      adjustment_financial: Math.round(adj.financial),
      adjustment_impact: Math.round(adj.impact),
      has_override: !!overrides[overrideKey],
    };
  });

  // Sort copies for summary without mutating topics array
  const byFinancial = [...topics].sort((a, b) => b.financial_score - a.financial_score);
  const byImpact = [...topics].sort((a, b) => b.impact_score - a.impact_score);

  return {
    company: { ticker: company.ticker, name: company.name, sector },
    topics,
    summary: {
      total_material: topics.filter(t => t.material).length,
      doubly_material: topics.filter(t => t.doubly_material).length,
      financial_only: topics.filter(t => t.quadrant === 'Financial Only').length,
      impact_only: topics.filter(t => t.quadrant === 'Impact Only').length,
      not_material: topics.filter(t => !t.material).length,
      avg_financial: Math.round(topics.reduce((s, t) => s + t.financial_score, 0) / topics.length),
      avg_impact: Math.round(topics.reduce((s, t) => s + t.impact_score, 0) / topics.length),
      top_financial: byFinancial[0]?.id,
      top_impact: byImpact[0]?.id,
    },
    threshold,
    assessed_at: new Date().toISOString(),
  };
}

/**
 * Assess portfolio-level materiality (weighted by holding weight).
 */
function assessPortfolio(holdings, threshold = 50) {
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100;

  const companyAssessments = holdings.map(h => ({
    ...assessCompany(h.company || h, threshold),
    weight: h.weight || 0,
  }));

  // Weight-average scores per topic
  const portfolioTopics = ESRS_TOPICS.map(topic => {
    let weightedFinancial = 0;
    let weightedImpact = 0;
    companyAssessments.forEach(ca => {
      const topicData = ca.topics.find(t => t.id === topic.id);
      if (topicData) {
        weightedFinancial += (ca.weight / totalWeight) * topicData.financial_score;
        weightedImpact += (ca.weight / totalWeight) * topicData.impact_score;
      }
    });

    const financial = Math.round(weightedFinancial);
    const impact = Math.round(weightedImpact);

    return {
      id: topic.id,
      name: topic.name,
      esrs: topic.esrs,
      pillar: topic.pillar,
      financial_score: financial,
      impact_score: impact,
      financial_material: financial >= threshold,
      impact_material: impact >= threshold,
      doubly_material: financial >= threshold && impact >= threshold,
      material: financial >= threshold || impact >= threshold,
      quadrant: financial >= threshold && impact >= threshold ? 'Double' :
                financial >= threshold ? 'Financial Only' :
                impact >= threshold ? 'Impact Only' : 'Not Material',
    };
  });

  return {
    portfolioTopics,
    companyAssessments,
    summary: {
      holdings: holdings.length,
      total_material: portfolioTopics.filter(t => t.material).length,
      doubly_material: portfolioTopics.filter(t => t.doubly_material).length,
      financial_only: portfolioTopics.filter(t => t.quadrant === 'Financial Only').length,
      impact_only: portfolioTopics.filter(t => t.quadrant === 'Impact Only').length,
      avg_financial: Math.round(portfolioTopics.reduce((s, t) => s + t.financial_score, 0) / portfolioTopics.length),
      avg_impact: Math.round(portfolioTopics.reduce((s, t) => s + t.impact_score, 0) / portfolioTopics.length),
    },
    threshold,
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: TREND & FORECAST ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * 17 drivers (7 regulatory + 5 scientific + 5 market) that move
 * materiality scores over time.  Each driver has:
 *   - impact_topics: which ESRS topics it affects
 *   - trend: 'increasing' | 'decreasing'
 *   - strength: 'very_high' | 'high' | 'medium' | 'low'
 */
const TREND_DRIVERS = [
  // ── Regulatory drivers ─────────────────────────────────────
  { id: 'REG-01', name: 'EU CBAM Carbon Border Adjustment', category: 'regulatory',
    impact_topics: ['E1', 'E5'], trend: 'increasing', strength: 'very_high',
    description: 'Carbon border tariffs increase financial materiality of climate & resource use' },
  { id: 'REG-02', name: 'EU CSDDD Value Chain Due Diligence', category: 'regulatory',
    impact_topics: ['S2', 'S3', 'G1'], trend: 'increasing', strength: 'very_high',
    description: 'Mandatory supply chain due diligence elevates social topic materiality' },
  { id: 'REG-03', name: 'EU Taxonomy Expansion', category: 'regulatory',
    impact_topics: ['E1', 'E2', 'E3', 'E4', 'E5'], trend: 'increasing', strength: 'high',
    description: 'Taxonomy coverage broadens which environmental topics are material' },
  { id: 'REG-04', name: 'TNFD Nature Reporting', category: 'regulatory',
    impact_topics: ['E4', 'E3'], trend: 'increasing', strength: 'high',
    description: 'Nature-related disclosures raise biodiversity and water materiality' },
  { id: 'REG-05', name: 'SEC Climate Disclosure (US)', category: 'regulatory',
    impact_topics: ['E1'], trend: 'increasing', strength: 'medium',
    description: 'US SEC rules increase climate financial materiality for dual-listed firms' },
  { id: 'REG-06', name: 'AI Regulation (EU AI Act)', category: 'regulatory',
    impact_topics: ['S4', 'G1'], trend: 'increasing', strength: 'high',
    description: 'AI governance raises consumer/end-user and business conduct materiality' },
  { id: 'REG-07', name: 'Plastics Treaty Negotiations', category: 'regulatory',
    impact_topics: ['E2', 'E5'], trend: 'increasing', strength: 'medium',
    description: 'Global plastics treaty will elevate pollution and circular economy materiality' },

  // ── Scientific drivers ─────────────────────────────────────
  { id: 'SCI-01', name: 'Climate Tipping Points Research', category: 'scientific',
    impact_topics: ['E1', 'E4'], trend: 'increasing', strength: 'very_high',
    description: 'Evidence of approaching tipping points accelerates climate materiality' },
  { id: 'SCI-02', name: 'Biodiversity Loss Acceleration', category: 'scientific',
    impact_topics: ['E4', 'E3'], trend: 'increasing', strength: 'high',
    description: 'Mass extinction evidence drives nature-related materiality upward' },
  { id: 'SCI-03', name: 'PFAS/Forever Chemicals Research', category: 'scientific',
    impact_topics: ['E2', 'S4'], trend: 'increasing', strength: 'high',
    description: 'Growing evidence of PFAS harm increases pollution and consumer materiality' },
  { id: 'SCI-04', name: 'Water Stress Projections', category: 'scientific',
    impact_topics: ['E3'], trend: 'increasing', strength: 'medium',
    description: 'Climate models project worsening water scarcity in key industrial basins' },
  { id: 'SCI-05', name: 'Social Inequality Data', category: 'scientific',
    impact_topics: ['S1', 'S3'], trend: 'increasing', strength: 'medium',
    description: 'Growing inequality research raises workforce and community materiality' },

  // ── Market drivers ─────────────────────────────────────────
  { id: 'MKT-01', name: 'Sustainable Finance Growth', category: 'market',
    impact_topics: ['E1', 'E4', 'S1'], trend: 'increasing', strength: 'high',
    description: 'Growing ESG AUM increases financial materiality across topics' },
  { id: 'MKT-02', name: 'Consumer ESG Awareness', category: 'market',
    impact_topics: ['S2', 'S4', 'E5'], trend: 'increasing', strength: 'medium',
    description: 'Consumer demand for sustainable products raises social/circular materiality' },
  { id: 'MKT-03', name: 'Insurance Climate Repricing', category: 'market',
    impact_topics: ['E1', 'E3'], trend: 'increasing', strength: 'high',
    description: 'Insurers withdrawing from climate-exposed regions amplifies financial materiality' },
  { id: 'MKT-04', name: 'Litigation Wave (Climate/Greenwashing)', category: 'market',
    impact_topics: ['E1', 'G1'], trend: 'increasing', strength: 'high',
    description: 'Climate litigation and greenwashing suits increase legal financial materiality' },
  { id: 'MKT-05', name: 'ESG Backlash / Anti-ESG Movement', category: 'market',
    impact_topics: ['E1', 'S1'], trend: 'decreasing', strength: 'low',
    description: 'Political ESG backlash modestly reduces perceived materiality in some markets' },
];

const STRENGTH_MAP = { very_high: 5, high: 3, medium: 2, low: 1 };

/**
 * Forecast how materiality scores change over time.
 * @param {string} topicId - ESRS topic ID (e.g. 'E1')
 * @param {number} currentScore - Current materiality score (0-100)
 * @param {number} yearsForward - Years to project (1-15)
 * @returns {number} Forecasted score (0-100)
 */
function forecastMateriality(topicId, currentScore, yearsForward) {
  let adjustment = 0;
  TREND_DRIVERS.forEach(d => {
    if (d.impact_topics.includes(topicId)) {
      const strength = STRENGTH_MAP[d.strength] || 0;
      const direction = d.trend === 'increasing' ? 1 : -1;
      // Logarithmic decay — strongest impact in early years, tapering off
      adjustment += direction * strength * Math.log2(1 + yearsForward) * 0.8;
    }
  });
  return clamp(Math.round(currentScore + adjustment), 0, 100);
}

/**
 * Generate full forecast trajectory for a topic.
 * @param {string} topicId - ESRS topic ID
 * @param {number} currentScore - Current score
 * @param {number[]} years - Target years
 * @returns {{ year: number, score: number }[]}
 */
function forecastTrajectory(topicId, currentScore, years = [2026, 2027, 2028, 2030, 2035]) {
  const baseYear = 2025;
  return years.map(yr => ({
    year: yr,
    score: forecastMateriality(topicId, currentScore, yr - baseYear),
  }));
}

/**
 * Forecast all topics for an assessment, returning a year-by-year matrix.
 */
function forecastAssessment(assessment, years = [2026, 2027, 2028, 2030, 2035]) {
  return assessment.topics.map(topic => ({
    id: topic.id,
    name: topic.name,
    current_financial: topic.financial_score,
    current_impact: topic.impact_score,
    financial_trajectory: forecastTrajectory(topic.id, topic.financial_score, years),
    impact_trajectory: forecastTrajectory(topic.id, topic.impact_score, years),
  }));
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: STAKEHOLDER IMPACT QUANTIFICATION
// ═══════════════════════════════════════════════════════════════

const STAKEHOLDER_GROUPS = [
  { id: 'investors', name: 'Investors & Shareholders',
    esrs_topics: ['E1', 'G1', 'S1'],
    channels: ['Shareholder value', 'Dividend stability', 'ESG risk premium'] },
  { id: 'employees', name: 'Employees & Workers',
    esrs_topics: ['S1', 'S2', 'G1'],
    channels: ['Working conditions', 'Fair wages', 'Health & safety'] },
  { id: 'customers', name: 'Customers & Consumers',
    esrs_topics: ['S4', 'E5', 'G1'],
    channels: ['Product safety', 'Data privacy', 'Fair pricing'] },
  { id: 'suppliers', name: 'Supply Chain Partners',
    esrs_topics: ['S2', 'E5', 'G1'],
    channels: ['Fair procurement', 'Payment terms', 'Capacity building'] },
  { id: 'communities', name: 'Local Communities',
    esrs_topics: ['S3', 'E2', 'E4'],
    channels: ['Employment', 'Environmental quality', 'Infrastructure'] },
  { id: 'environment', name: 'Natural Environment',
    esrs_topics: ['E1', 'E2', 'E3', 'E4', 'E5'],
    channels: ['Emissions', 'Pollution', 'Resource depletion'] },
  { id: 'regulators', name: 'Regulators & Policymakers',
    esrs_topics: ['G1', 'E1', 'S1'],
    channels: ['Compliance', 'Tax contribution', 'Policy engagement'] },
  { id: 'civil_society', name: 'Civil Society & NGOs',
    esrs_topics: ['S3', 'E4', 'G1'],
    channels: ['Transparency', 'Accountability', 'Advocacy targets'] },
];

/**
 * Sector-level stakeholder weighting — how important each stakeholder group
 * is for each sector (0.0 to 1.0).
 */
const SECTOR_STAKEHOLDER_WEIGHTS = {
  Energy:                     { investors: 0.85, employees: 0.70, customers: 0.50, suppliers: 0.60, communities: 0.90, environment: 0.95, regulators: 0.90, civil_society: 0.85 },
  Materials:                  { investors: 0.75, employees: 0.75, customers: 0.55, suppliers: 0.70, communities: 0.80, environment: 0.90, regulators: 0.80, civil_society: 0.70 },
  Industrials:                { investors: 0.70, employees: 0.80, customers: 0.60, suppliers: 0.65, communities: 0.60, environment: 0.70, regulators: 0.70, civil_society: 0.55 },
  'Consumer Discretionary':   { investors: 0.75, employees: 0.65, customers: 0.85, suppliers: 0.80, communities: 0.40, environment: 0.50, regulators: 0.55, civil_society: 0.60 },
  'Consumer Staples':         { investors: 0.70, employees: 0.60, customers: 0.90, suppliers: 0.85, communities: 0.55, environment: 0.65, regulators: 0.60, civil_society: 0.70 },
  'Health Care':              { investors: 0.80, employees: 0.70, customers: 0.95, suppliers: 0.50, communities: 0.50, environment: 0.35, regulators: 0.90, civil_society: 0.75 },
  Financials:                 { investors: 0.90, employees: 0.65, customers: 0.80, suppliers: 0.35, communities: 0.45, environment: 0.30, regulators: 0.95, civil_society: 0.60 },
  'Information Technology':   { investors: 0.85, employees: 0.80, customers: 0.85, suppliers: 0.55, communities: 0.35, environment: 0.40, regulators: 0.75, civil_society: 0.65 },
  'Communication Services':   { investors: 0.80, employees: 0.60, customers: 0.90, suppliers: 0.40, communities: 0.45, environment: 0.25, regulators: 0.80, civil_society: 0.75 },
  Utilities:                  { investors: 0.75, employees: 0.65, customers: 0.70, suppliers: 0.50, communities: 0.85, environment: 0.90, regulators: 0.90, civil_society: 0.80 },
  'Real Estate':              { investors: 0.80, employees: 0.50, customers: 0.60, suppliers: 0.45, communities: 0.75, environment: 0.65, regulators: 0.70, civil_society: 0.55 },
};

/**
 * Compute stakeholder impact scores for a company.
 * Combines sector weighting with company ESG score to derive positive
 * and negative impact per stakeholder group.
 */
function assessStakeholderImpact(company) {
  const sectorWeights = SECTOR_STAKEHOLDER_WEIGHTS[company.sector] ||
    SECTOR_STAKEHOLDER_WEIGHTS['Financials'];
  const esgNorm = (company.esg_score || 50) / 100;
  const sizeBoost = (company.employees || 0) > 50000 ? 1.1 : 1.0;

  return STAKEHOLDER_GROUPS.map(sg => {
    const weight = sectorWeights[sg.id] || 0.5;
    const positive = clamp(Math.round(weight * esgNorm * sizeBoost * 100), 0, 100);
    const negative = clamp(Math.round(weight * (1 - esgNorm) * 80), 0, 100);
    const net = positive - negative;
    const salience = weight >= 0.8 ? 'Critical' : weight >= 0.6 ? 'High' : weight >= 0.4 ? 'Moderate' : 'Low';
    return {
      id: sg.id,
      name: sg.name,
      esrs_topics: sg.esrs_topics,
      channels: sg.channels,
      positive,
      negative,
      net,
      salience,
      weight: Math.round(weight * 100),
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: CONTROVERSY-MATERIALITY LINKAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Maps 20 controversy types to ESRS topics they validate.
 * When a controversy occurs, it confirms (or reveals gaps in)
 * the materiality assessment.
 */
const CONTROVERSY_ESRS_MAP = {
  'emissions_violation':           ['E1'],
  'carbon_fraud':                  ['E1', 'G1'],
  'greenwashing':                  ['E1', 'G1'],
  'pollution_incident':            ['E2'],
  'toxic_spill':                   ['E2', 'E3'],
  'water_contamination':           ['E2', 'E3'],
  'deforestation':                 ['E4'],
  'habitat_destruction':           ['E4'],
  'waste_dumping':                 ['E2', 'E5'],
  'labor_violation':               ['S1'],
  'workplace_safety':              ['S1'],
  'discrimination':                ['S1'],
  'child_labor':                   ['S2'],
  'forced_labor':                  ['S2'],
  'supply_chain_abuse':            ['S2', 'S3'],
  'community_displacement':        ['S3'],
  'indigenous_rights':             ['S3'],
  'data_breach':                   ['S4', 'G1'],
  'product_safety':                ['S4'],
  'bribery_corruption':            ['G1'],
};

/**
 * Link a controversy event to material topics.
 * Returns which ESRS topics are affected and whether they were
 * already flagged as material by the assessment.
 *
 * @param {{ type: string, severity: number, date: string }} controversy
 * @param {object} companyAssessment - Result of assessCompany()
 * @returns {{ topicId, wasMaterial, wasDoublyMaterial, validated, gap, severity }[]}
 */
function linkControversyToMateriality(controversy, companyAssessment) {
  const mappedTopics = CONTROVERSY_ESRS_MAP[controversy.type] || [];
  const severity = controversy.severity || 50;

  return mappedTopics.map(topicId => {
    const topicAssessment = companyAssessment.topics.find(t => t.id === topicId);
    const wasMaterial = topicAssessment?.material || false;
    const wasDoublyMaterial = topicAssessment?.doubly_material || false;
    return {
      topicId,
      topicName: topicAssessment?.name || topicId,
      wasMaterial,
      wasDoublyMaterial,
      validated: wasMaterial,
      gap: !wasMaterial,
      severity,
      financial_score: topicAssessment?.financial_score || 0,
      impact_score: topicAssessment?.impact_score || 0,
      recommended_adjustment: !wasMaterial ? Math.min(severity * 0.3, 20) : 0,
    };
  });
}

/**
 * Analyse all controversies for a company and return aggregate linkage stats.
 */
function analyseControversies(controversies, companyAssessment) {
  const allLinks = controversies.flatMap(c => linkControversyToMateriality(c, companyAssessment));

  const byTopic = {};
  allLinks.forEach(link => {
    if (!byTopic[link.topicId]) {
      byTopic[link.topicId] = { topicId: link.topicId, topicName: link.topicName,
        count: 0, validated: 0, gaps: 0, avg_severity: 0 };
    }
    byTopic[link.topicId].count += 1;
    byTopic[link.topicId].validated += link.validated ? 1 : 0;
    byTopic[link.topicId].gaps += link.gap ? 1 : 0;
    byTopic[link.topicId].avg_severity += link.severity;
  });

  Object.values(byTopic).forEach(t => {
    t.avg_severity = t.count > 0 ? Math.round(t.avg_severity / t.count) : 0;
  });

  return {
    total_controversies: controversies.length,
    total_links: allLinks.length,
    validated: allLinks.filter(l => l.validated).length,
    gaps: allLinks.filter(l => l.gap).length,
    gap_rate: allLinks.length > 0
      ? Math.round((allLinks.filter(l => l.gap).length / allLinks.length) * 100) : 0,
    by_topic: Object.values(byTopic),
    links: allLinks,
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 8: SCENARIO SIMULATION
// ═══════════════════════════════════════════════════════════════

const MATERIALITY_SCENARIOS = [
  {
    id: 'regulatory_acceleration', name: 'Regulatory Acceleration',
    description: 'Accelerated global sustainability regulation (CSRD expansion, CSDDD, CBAM phase-in)',
    adjustments: { E1: 20, E2: 15, E3: 12, E4: 18, E5: 10, S1: 8, S2: 15, S3: 12, S4: 5, G1: 15 },
  },
  {
    id: 'market_driven', name: 'Market-Driven Transition',
    description: 'Market forces lead transition — investor pressure, consumer demand, insurance repricing',
    adjustments: { E1: 15, E2: 8, E3: 5, E4: 10, E5: 12, S1: 5, S2: 8, S3: 5, S4: 10, G1: 8 },
  },
  {
    id: 'backlash', name: 'ESG Backlash',
    description: 'Political ESG backlash weakens environmental focus, governance scrutiny increases',
    adjustments: { E1: -5, E2: -3, E3: -2, E4: -5, E5: -3, S1: 5, S2: 3, S3: 0, S4: 8, G1: 10 },
  },
  {
    id: 'nature_crisis', name: 'Nature Crisis',
    description: 'Ecosystem collapse triggers emergency biodiversity and water regulations',
    adjustments: { E1: 5, E2: 20, E3: 25, E4: 30, E5: 15, S1: 10, S2: 15, S3: 20, S4: 10, G1: 5 },
  },
  {
    id: 'tech_disruption', name: 'Technology Disruption',
    description: 'AI and digital transformation reshape social/governance materiality landscape',
    adjustments: { E1: 3, E2: 0, E3: 5, E4: 0, E5: 8, S1: 15, S2: 5, S3: 3, S4: 20, G1: 18 },
  },
];

/**
 * Apply scenario adjustments to a materiality assessment.
 * Returns a new assessment object with adjusted scores and scenario metadata.
 */
function applyScenario(assessment, scenarioId) {
  const scenario = MATERIALITY_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return assessment;
  const thresh = assessment.threshold || 50;

  const topics = assessment.topics.map(topic => {
    const adj = scenario.adjustments[topic.id] || 0;
    const newFinancial = clamp(topic.financial_score + adj, 0, 100);
    const newImpact = clamp(topic.impact_score + Math.round(adj * 0.7), 0, 100);
    const fm = newFinancial >= thresh;
    const im = newImpact >= thresh;
    return {
      ...topic,
      financial_score: newFinancial,
      impact_score: newImpact,
      financial_material: fm,
      impact_material: im,
      doubly_material: fm && im,
      material: fm || im,
      quadrant: fm && im ? 'Double' : fm ? 'Financial Only' : im ? 'Impact Only' : 'Not Material',
      scenario_delta_financial: adj,
      scenario_delta_impact: Math.round(adj * 0.7),
      prev_financial: topic.financial_score,
      prev_impact: topic.impact_score,
    };
  });

  return {
    ...assessment,
    topics,
    summary: {
      ...assessment.summary,
      total_material: topics.filter(t => t.material).length,
      doubly_material: topics.filter(t => t.doubly_material).length,
      financial_only: topics.filter(t => t.quadrant === 'Financial Only').length,
      impact_only: topics.filter(t => t.quadrant === 'Impact Only').length,
      not_material: topics.filter(t => !t.material).length,
      avg_financial: Math.round(topics.reduce((s, t) => s + t.financial_score, 0) / topics.length),
      avg_impact: Math.round(topics.reduce((s, t) => s + t.impact_score, 0) / topics.length),
    },
    scenario: scenario.name,
    scenario_id: scenario.id,
    scenario_description: scenario.description,
  };
}

/**
 * Compare baseline vs all scenarios for quick heatmap rendering.
 */
function compareAllScenarios(assessment) {
  return MATERIALITY_SCENARIOS.map(s => {
    const adjusted = applyScenario(assessment, s.id);
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      topics: adjusted.topics.map(t => ({
        id: t.id,
        financial_score: t.financial_score,
        impact_score: t.impact_score,
        delta_financial: t.scenario_delta_financial,
        delta_impact: t.scenario_delta_impact,
        material: t.material,
        quadrant: t.quadrant,
      })),
      summary: adjusted.summary,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION 9: CSRD DISCLOSURE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Maps each ESRS topic to its specific disclosure requirements.
 */
const ESRS_DISCLOSURE_MAP = {
  E1: [
    { standard: 'ESRS E1', disclosure: 'E1-1', name: 'Transition plan for climate change mitigation' },
    { standard: 'ESRS E1', disclosure: 'E1-2', name: 'Policies - climate change mitigation and adaptation' },
    { standard: 'ESRS E1', disclosure: 'E1-3', name: 'Actions and resources - climate change' },
    { standard: 'ESRS E1', disclosure: 'E1-4', name: 'Targets - climate change mitigation and adaptation' },
    { standard: 'ESRS E1', disclosure: 'E1-5', name: 'Energy consumption and mix' },
    { standard: 'ESRS E1', disclosure: 'E1-6', name: 'Gross Scopes 1, 2, 3 and Total GHG emissions' },
    { standard: 'ESRS E1', disclosure: 'E1-7', name: 'GHG removals and GHG mitigation projects' },
    { standard: 'ESRS E1', disclosure: 'E1-8', name: 'Internal carbon pricing' },
    { standard: 'ESRS E1', disclosure: 'E1-9', name: 'Anticipated financial effects - climate change' },
  ],
  E2: [
    { standard: 'ESRS E2', disclosure: 'E2-1', name: 'Policies - pollution' },
    { standard: 'ESRS E2', disclosure: 'E2-2', name: 'Actions and resources - pollution' },
    { standard: 'ESRS E2', disclosure: 'E2-3', name: 'Targets - pollution' },
    { standard: 'ESRS E2', disclosure: 'E2-4', name: 'Pollution of air, water and soil' },
    { standard: 'ESRS E2', disclosure: 'E2-5', name: 'Substances of concern and very high concern' },
    { standard: 'ESRS E2', disclosure: 'E2-6', name: 'Anticipated financial effects - pollution' },
  ],
  E3: [
    { standard: 'ESRS E3', disclosure: 'E3-1', name: 'Policies - water and marine resources' },
    { standard: 'ESRS E3', disclosure: 'E3-2', name: 'Actions and resources - water and marine resources' },
    { standard: 'ESRS E3', disclosure: 'E3-3', name: 'Targets - water and marine resources' },
    { standard: 'ESRS E3', disclosure: 'E3-4', name: 'Water consumption' },
    { standard: 'ESRS E3', disclosure: 'E3-5', name: 'Anticipated financial effects - water/marine' },
  ],
  E4: [
    { standard: 'ESRS E4', disclosure: 'E4-1', name: 'Transition plan for biodiversity' },
    { standard: 'ESRS E4', disclosure: 'E4-2', name: 'Policies - biodiversity and ecosystems' },
    { standard: 'ESRS E4', disclosure: 'E4-3', name: 'Actions and resources - biodiversity' },
    { standard: 'ESRS E4', disclosure: 'E4-4', name: 'Targets - biodiversity and ecosystems' },
    { standard: 'ESRS E4', disclosure: 'E4-5', name: 'Impact metrics - biodiversity' },
    { standard: 'ESRS E4', disclosure: 'E4-6', name: 'Anticipated financial effects - biodiversity' },
  ],
  E5: [
    { standard: 'ESRS E5', disclosure: 'E5-1', name: 'Policies - resource use and circular economy' },
    { standard: 'ESRS E5', disclosure: 'E5-2', name: 'Actions and resources - circular economy' },
    { standard: 'ESRS E5', disclosure: 'E5-3', name: 'Targets - resource use and circular economy' },
    { standard: 'ESRS E5', disclosure: 'E5-4', name: 'Resource inflows' },
    { standard: 'ESRS E5', disclosure: 'E5-5', name: 'Resource outflows' },
    { standard: 'ESRS E5', disclosure: 'E5-6', name: 'Anticipated financial effects - circular economy' },
  ],
  S1: [
    { standard: 'ESRS S1', disclosure: 'S1-1', name: 'Policies - own workforce' },
    { standard: 'ESRS S1', disclosure: 'S1-2', name: 'Processes for engaging with workers' },
    { standard: 'ESRS S1', disclosure: 'S1-3', name: 'Remediation processes' },
    { standard: 'ESRS S1', disclosure: 'S1-4', name: 'Actions on material impacts - own workforce' },
    { standard: 'ESRS S1', disclosure: 'S1-5', name: 'Targets - own workforce' },
    { standard: 'ESRS S1', disclosure: 'S1-6', name: 'Characteristics of employees' },
    { standard: 'ESRS S1', disclosure: 'S1-7', name: 'Characteristics of non-employees' },
    { standard: 'ESRS S1', disclosure: 'S1-8', name: 'Collective bargaining coverage' },
    { standard: 'ESRS S1', disclosure: 'S1-9', name: 'Diversity metrics' },
  ],
  S2: [
    { standard: 'ESRS S2', disclosure: 'S2-1', name: 'Policies - value chain workers' },
    { standard: 'ESRS S2', disclosure: 'S2-2', name: 'Processes for engaging with value chain workers' },
    { standard: 'ESRS S2', disclosure: 'S2-3', name: 'Remediation processes - value chain' },
    { standard: 'ESRS S2', disclosure: 'S2-4', name: 'Actions on material impacts - value chain workers' },
    { standard: 'ESRS S2', disclosure: 'S2-5', name: 'Targets - value chain workers' },
  ],
  S3: [
    { standard: 'ESRS S3', disclosure: 'S3-1', name: 'Policies - affected communities' },
    { standard: 'ESRS S3', disclosure: 'S3-2', name: 'Processes for engaging with communities' },
    { standard: 'ESRS S3', disclosure: 'S3-3', name: 'Remediation processes - communities' },
    { standard: 'ESRS S3', disclosure: 'S3-4', name: 'Actions on material impacts - communities' },
    { standard: 'ESRS S3', disclosure: 'S3-5', name: 'Targets - affected communities' },
  ],
  S4: [
    { standard: 'ESRS S4', disclosure: 'S4-1', name: 'Policies - consumers and end-users' },
    { standard: 'ESRS S4', disclosure: 'S4-2', name: 'Processes for engaging with consumers' },
    { standard: 'ESRS S4', disclosure: 'S4-3', name: 'Remediation processes - consumers' },
    { standard: 'ESRS S4', disclosure: 'S4-4', name: 'Actions on material impacts - consumers' },
    { standard: 'ESRS S4', disclosure: 'S4-5', name: 'Targets - consumers and end-users' },
  ],
  G1: [
    { standard: 'ESRS G1', disclosure: 'G1-1', name: 'Business conduct policies and corporate culture' },
    { standard: 'ESRS G1', disclosure: 'G1-2', name: 'Management of relationships with suppliers' },
    { standard: 'ESRS G1', disclosure: 'G1-3', name: 'Prevention and detection of corruption/bribery' },
    { standard: 'ESRS G1', disclosure: 'G1-4', name: 'Confirmed incidents of corruption/bribery' },
    { standard: 'ESRS G1', disclosure: 'G1-5', name: 'Political influence and lobbying activities' },
    { standard: 'ESRS G1', disclosure: 'G1-6', name: 'Payment practices' },
  ],
};

/**
 * Given material topics, return required ESRS disclosures.
 * Cross-cutting standards (ESRS 1, ESRS 2) are always required.
 */
function getRequiredDisclosures(materialTopics) {
  const disclosures = [
    { standard: 'ESRS 2', disclosure: 'GOV-1', name: 'Role of administrative, management and supervisory bodies', always_required: true },
    { standard: 'ESRS 2', disclosure: 'GOV-2', name: 'Information provided to and sustainability matters addressed by bodies', always_required: true },
    { standard: 'ESRS 2', disclosure: 'GOV-3', name: 'Integration of sustainability performance in incentive schemes', always_required: true },
    { standard: 'ESRS 2', disclosure: 'GOV-4', name: 'Statement on due diligence', always_required: true },
    { standard: 'ESRS 2', disclosure: 'GOV-5', name: 'Risk management and internal controls', always_required: true },
    { standard: 'ESRS 2', disclosure: 'SBM-1', name: 'Strategy, business model and value chain', always_required: true },
    { standard: 'ESRS 2', disclosure: 'SBM-2', name: 'Interests and views of stakeholders', always_required: true },
    { standard: 'ESRS 2', disclosure: 'SBM-3', name: 'Material impacts, risks and opportunities', always_required: true },
    { standard: 'ESRS 2', disclosure: 'IRO-1', name: 'Description of process to identify material impacts, risks, opportunities', always_required: true },
    { standard: 'ESRS 2', disclosure: 'IRO-2', name: 'Disclosure Requirements in ESRS covered by sustainability statement', always_required: true },
  ];

  const topicList = Array.isArray(materialTopics) ? materialTopics :
    (materialTopics?.topics?.filter(t => t.material) || []);

  topicList.forEach(topic => {
    const id = topic.id || topic;
    const topicDisclosures = ESRS_DISCLOSURE_MAP[id] || [];
    topicDisclosures.forEach(d => disclosures.push({
      ...d,
      topic: id,
      always_required: false,
    }));
  });

  return {
    total: disclosures.length,
    cross_cutting: disclosures.filter(d => d.always_required).length,
    topic_specific: disclosures.filter(d => !d.always_required).length,
    disclosures,
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 10: ISSB vs CSRD COMPARISON
// ═══════════════════════════════════════════════════════════════

/**
 * Compare what is material under ISSB (financial only) vs CSRD (double).
 * Shows which additional topics become material under double materiality.
 */
function compareISSBvCSRD(assessment) {
  const comparison = assessment.topics.map(topic => ({
    id: topic.id,
    name: topic.name,
    pillar: topic.pillar,
    financial_score: topic.financial_score,
    impact_score: topic.impact_score,
    issb_material: topic.financial_material,
    csrd_material: topic.material,
    csrd_additional: !topic.financial_material && topic.impact_material,
    framework_gap: topic.impact_material && !topic.financial_material ? 'CSRD only' :
                   topic.financial_material && !topic.impact_material ? 'Both' : 'Aligned',
  }));

  return {
    topics: comparison,
    summary: {
      issb_material_count: comparison.filter(t => t.issb_material).length,
      csrd_material_count: comparison.filter(t => t.csrd_material).length,
      csrd_additional_count: comparison.filter(t => t.csrd_additional).length,
      additional_topics: comparison.filter(t => t.csrd_additional).map(t => t.name),
      coverage_gap_pct: comparison.length > 0
        ? Math.round((comparison.filter(t => t.csrd_additional).length / Math.max(1, comparison.filter(t => t.csrd_material).length)) * 100)
        : 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 11: PERSISTENCE (localStorage)
// ═══════════════════════════════════════════════════════════════

const LS_OVERRIDES   = 'ra_materiality_overrides_v1';
const LS_ASSESSMENTS = 'ra_materiality_assessments_v1';
const LS_HISTORY     = 'ra_materiality_history_v1';

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}'); }
  catch { return {}; }
}

function saveOverride(ticker, topicId, financial, impact) {
  const overrides = loadOverrides();
  overrides[`${ticker}_${topicId}`] = {
    financial,
    impact,
    updated: new Date().toISOString(),
  };
  localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
}

function clearOverride(ticker, topicId) {
  const overrides = loadOverrides();
  delete overrides[`${ticker}_${topicId}`];
  localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
}

function clearAllOverrides() {
  localStorage.removeItem(LS_OVERRIDES);
}

function saveAssessment(assessment) {
  localStorage.setItem(LS_ASSESSMENTS, JSON.stringify(assessment));
  const history = loadAssessmentHistory();
  history.push({
    timestamp: new Date().toISOString(),
    company: assessment.company,
    summary: assessment.summary,
  });
  if (history.length > 50) history.shift();
  localStorage.setItem(LS_HISTORY, JSON.stringify(history));
}

function loadSavedAssessment() {
  try { return JSON.parse(localStorage.getItem(LS_ASSESSMENTS) || 'null'); }
  catch { return null; }
}

function loadAssessmentHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); }
  catch { return []; }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 12: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function median(arr) {
  const s = arr.filter(v => v > 0).sort((a, b) => a - b);
  if (s.length === 0) return 0;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Compute a color grade for a materiality score (for UI consumption).
 * Returns a CSS-safe color string.
 */
function scoreColor(score) {
  if (score >= 80) return '#ef4444'; // red — very high materiality
  if (score >= 60) return '#f97316'; // orange — high
  if (score >= 40) return '#eab308'; // yellow — moderate
  if (score >= 20) return '#22c55e'; // green — low
  return '#6b7280';                   // gray — minimal
}

/**
 * Classify a materiality score into a human-readable label.
 */
function scoreLabel(score) {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low';
  return 'Minimal';
}

/**
 * Get pillar summary (Environmental / Social / Governance averages).
 */
function pillarSummary(topics) {
  const pillars = {};
  topics.forEach(t => {
    if (!pillars[t.pillar]) pillars[t.pillar] = { financial: [], impact: [], count: 0 };
    pillars[t.pillar].financial.push(t.financial_score);
    pillars[t.pillar].impact.push(t.impact_score);
    pillars[t.pillar].count += 1;
  });
  return Object.entries(pillars).map(([pillar, data]) => ({
    pillar,
    avg_financial: Math.round(data.financial.reduce((a, b) => a + b, 0) / data.count),
    avg_impact: Math.round(data.impact.reduce((a, b) => a + b, 0) / data.count),
    topic_count: data.count,
  }));
}

// ═══════════════════════════════════════════════════════════════
// SECTION 13: MASTER EXPORT
// ═══════════════════════════════════════════════════════════════

export const MaterialityEngine = {
  // Core data
  ESRS_TOPICS,
  SECTOR_MATERIALITY_DEFAULTS,
  MATERIALITY_SCENARIOS,
  TREND_DRIVERS,
  STAKEHOLDER_GROUPS,
  SECTOR_STAKEHOLDER_WEIGHTS,
  CONTROVERSY_ESRS_MAP,
  ESRS_DISCLOSURE_MAP,

  // Assessment functions
  assessCompany,
  assessPortfolio,
  computeCompanyAdjustments,

  // Trend & Forecast
  forecastMateriality,
  forecastTrajectory,
  forecastAssessment,

  // Stakeholder
  assessStakeholderImpact,

  // Controversy
  linkControversyToMateriality,
  analyseControversies,

  // Scenarios
  applyScenario,
  compareAllScenarios,

  // CSRD/ISSB
  getRequiredDisclosures,
  compareISSBvCSRD,

  // Persistence
  saveOverride,
  clearOverride,
  clearAllOverrides,
  loadOverrides,
  saveAssessment,
  loadSavedAssessment,
  loadAssessmentHistory,

  // Utilities
  scoreColor,
  scoreLabel,
  pillarSummary,
  clamp,
  median,
};

export default MaterialityEngine;
