/**
 * ENH-018: Double Materiality Assessment (DMA) Methodology
 *
 * Implements the CSRD / ESRS 1 Chapter 3 framework for conducting
 * Impact-Risk-Opportunity (IRO) assessments under the European
 * Sustainability Reporting Standards.
 *
 * References:
 *   ESRS 1 General Requirements, paragraphs 38–62 (EFRAG Nov 2022)
 *   ESRS 2 General Disclosures, IRO-1 & IRO-2
 *   EFRAG Implementation Guidance IG 1 — Materiality Assessment (Dec 2023)
 *
 * Approach: Double materiality = impact materiality ∪ financial materiality
 *   A topic is material if it is material from EITHER perspective.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. METHODOLOGY DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const DMA_METHODOLOGY = {
  version: '1.0.0',
  standard: 'ESRS 1, Chapter 3, paragraphs 38-62',
  approach: 'Double materiality (impact + financial)',
  effectiveDate: '2025-01-01',
  guidanceRef: 'EFRAG IG 1 — Materiality Assessment Implementation Guidance',

  steps: [
    {
      id: 1,
      name: 'Stakeholder Identification',
      esrsRef: 'ESRS 1 para 22',
      description: 'Map affected stakeholders including workers, communities, consumers, and value-chain actors',
      deliverable: 'Stakeholder map with engagement plan',
      inputs: ['Value chain analysis', 'Business model description', 'Sector context'],
      outputs: ['Stakeholder register', 'Engagement plan', 'Prioritisation matrix'],
    },
    {
      id: 2,
      name: 'Universe of Sustainability Matters',
      esrsRef: 'ESRS 1 para 38-40',
      description: 'Start with the full list of ESRS topical standards as the minimum universe of sustainability matters',
      deliverable: 'Matter longlist (all ESRS sub-topics)',
      inputs: ['ESRS topic list', 'Sector-specific guidance (ESRS sector standards)'],
      outputs: ['Longlist of 90+ sub-sub-topics', 'Sector relevance flags'],
    },
    {
      id: 3,
      name: 'Impact Materiality Assessment',
      esrsRef: 'ESRS 1 para 43-48',
      description: 'Assess actual and potential impacts using severity (magnitude × scope × irremediability) and likelihood',
      deliverable: 'Impact scores for each sub-topic',
      inputs: ['Stakeholder input', 'Operational data', 'Value chain mapping'],
      outputs: ['Impact severity scores', 'Impact likelihood scores', 'Combined impact materiality scores'],
    },
    {
      id: 4,
      name: 'Financial Materiality Assessment',
      esrsRef: 'ESRS 1 para 49-55',
      description: 'Assess sustainability-related risks and opportunities by magnitude of potential financial effect and likelihood',
      deliverable: 'Financial materiality scores',
      inputs: ['Risk registers', 'Strategic plans', 'Financial models'],
      outputs: ['Financial magnitude scores', 'Financial likelihood scores', 'Combined financial materiality scores'],
    },
    {
      id: 5,
      name: 'Materiality Determination',
      esrsRef: 'ESRS 1 para 56-60',
      description: 'Apply thresholds to combined scores; a topic is material if it exceeds either the impact or financial threshold',
      deliverable: 'Material topics list with rationale',
      inputs: ['Impact scores', 'Financial scores', 'Company-set thresholds'],
      outputs: ['Material topics list', 'Excluded topics with rationale', 'Threshold documentation'],
    },
    {
      id: 6,
      name: 'Validation & Sign-off',
      esrsRef: 'ESRS 2 IRO-1, BP-2',
      description: 'Board or management body reviews and formally approves the materiality assessment',
      deliverable: 'Signed DMA report',
      inputs: ['Draft materiality matrix', 'Stakeholder feedback summary'],
      outputs: ['Board-approved DMA', 'Disclosure datapoints list', 'Audit trail'],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SCORING CRITERIA
// ═══════════════════════════════════════════════════════════════════════════════

export const SCORING_CRITERIA = {
  impact: {
    severity: {
      scale: [1, 2, 3, 4, 5],
      dimensions: ['magnitude', 'scope', 'irremediability'],
      labels: ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'],
      guidance: {
        magnitude: 'How serious is the impact on people or the environment?',
        scope: 'How widespread is the impact (number of affected stakeholders)?',
        irremediability: 'How difficult is it to reverse the negative impact?',
      },
    },
    likelihood: {
      scale: [1, 2, 3, 4, 5],
      labels: ['Remote', 'Unlikely', 'Possible', 'Likely', 'Almost certain'],
      percentageRanges: ['<5%', '5–20%', '20–50%', '50–80%', '>80%'],
    },
    formula: 'Impact Score = (magnitude + scope + irremediability) / 3 × likelihood',
    threshold: 9.0,
    note: 'For actual (already occurring) impacts, likelihood is set to 5',
  },
  financial: {
    magnitude: {
      scale: [1, 2, 3, 4, 5],
      labels: ['Negligible', 'Minor', 'Moderate', 'Major', 'Critical'],
      revenueImpact: ['<0.5%', '0.5–2%', '2–5%', '5–15%', '>15%'],
    },
    likelihood: {
      scale: [1, 2, 3, 4, 5],
      labels: ['Remote', 'Unlikely', 'Possible', 'Likely', 'Almost certain'],
      percentageRanges: ['<5%', '5–20%', '20–50%', '50–80%', '>80%'],
    },
    formula: 'Financial Score = magnitude × likelihood',
    threshold: 9.0,
    note: 'Considers both risks (potential negative) and opportunities (potential positive)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ESRS TOPICS & PRE-ASSESSED SCORES (50-company cross-sector average)
// ═══════════════════════════════════════════════════════════════════════════════

export const ESRS_TOPIC_ASSESSMENTS = [
  { id: 'E1',  topic: 'E1 Climate Change',                     impactScore: 4.2, financialScore: 3.8, material: true,  disclosureCount: 12 },
  { id: 'E2',  topic: 'E2 Pollution',                          impactScore: 2.5, financialScore: 2.1, material: false, disclosureCount: 8  },
  { id: 'E3',  topic: 'E3 Water & Marine Resources',           impactScore: 2.8, financialScore: 2.4, material: false, disclosureCount: 6  },
  { id: 'E4',  topic: 'E4 Biodiversity & Ecosystems',          impactScore: 3.1, financialScore: 2.0, material: true,  disclosureCount: 9  },
  { id: 'E5',  topic: 'E5 Resource Use & Circular Economy',    impactScore: 2.9, financialScore: 2.6, material: false, disclosureCount: 7  },
  { id: 'S1',  topic: 'S1 Own Workforce',                      impactScore: 3.8, financialScore: 3.2, material: true,  disclosureCount: 17 },
  { id: 'S2',  topic: 'S2 Workers in the Value Chain',         impactScore: 3.4, financialScore: 2.5, material: true,  disclosureCount: 10 },
  { id: 'S3',  topic: 'S3 Affected Communities',               impactScore: 2.7, financialScore: 1.9, material: false, disclosureCount: 8  },
  { id: 'S4',  topic: 'S4 Consumers & End-users',              impactScore: 3.0, financialScore: 2.8, material: true,  disclosureCount: 9  },
  { id: 'G1',  topic: 'G1 Business Conduct',                   impactScore: 3.5, financialScore: 3.6, material: true,  disclosureCount: 11 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SECTOR ADJUSTMENT FACTORS
// ═══════════════════════════════════════════════════════════════════════════════

const SECTOR_ADJUSTMENTS = {
  Energy:             { E1: 1.4, E2: 1.3, E4: 1.2, S2: 1.1, G1: 1.1 },
  Utilities:          { E1: 1.5, E2: 1.2, E3: 1.3, S1: 1.0, G1: 1.0 },
  Materials:          { E1: 1.2, E2: 1.4, E5: 1.3, S1: 1.1, S2: 1.2 },
  Industrials:        { E1: 1.1, E2: 1.1, E5: 1.1, S1: 1.1, S2: 1.0 },
  'Consumer Disc.':   { E5: 1.2, S2: 1.3, S4: 1.2, G1: 1.0, E1: 1.0 },
  'Consumer Staples': { E1: 1.0, E3: 1.2, E4: 1.3, S2: 1.3, S4: 1.2 },
  Healthcare:         { S1: 1.2, S4: 1.4, G1: 1.2, E2: 1.1, E5: 1.0 },
  Financials:         { E1: 1.1, S1: 1.1, G1: 1.3, S3: 1.0, E4: 0.8 },
  Technology:         { E1: 1.0, E5: 1.1, S1: 1.2, S4: 1.1, G1: 1.2 },
  'Real Estate':      { E1: 1.3, E3: 1.1, E5: 1.2, S1: 1.0, S3: 1.1 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DMA MATRIX GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a DMA matrix for a specific company in a given sector.
 * Applies sector adjustment factors to the cross-sector baseline.
 *
 * @param {string} companyName — display name
 * @param {string} sector — GICS sector name
 * @param {Object} overrides — optional per-topic score overrides { E1: { impactScore, financialScore } }
 * @returns {Object} matrix data suitable for bubble-chart visualisation
 */
export function generateDMAMatrix(companyName, sector, overrides = {}) {
  const adj = SECTOR_ADJUSTMENTS[sector] || {};

  const topics = ESRS_TOPIC_ASSESSMENTS.map((t) => {
    const sectorMult = adj[t.id] || 1.0;
    const ov = overrides[t.id] || {};

    const impactScore = ov.impactScore ?? Math.min(5, t.impactScore * sectorMult);
    const financialScore = ov.financialScore ?? Math.min(5, t.financialScore * sectorMult);

    const impactThresholdMet = impactScore >= SCORING_CRITERIA.impact.threshold / 5;
    const financialThresholdMet = financialScore >= SCORING_CRITERIA.financial.threshold / 5;
    const material = impactThresholdMet || financialThresholdMet;

    return {
      id: t.id,
      topic: t.topic,
      impactScore: Math.round(impactScore * 100) / 100,
      financialScore: Math.round(financialScore * 100) / 100,
      material,
      quadrant: material
        ? (impactThresholdMet && financialThresholdMet ? 'Double Material' : impactThresholdMet ? 'Impact Only' : 'Financial Only')
        : 'Not Material',
      disclosureCount: t.disclosureCount,
    };
  });

  return {
    company: companyName,
    sector,
    assessmentDate: new Date().toISOString().slice(0, 10),
    methodology: DMA_METHODOLOGY.version,
    topics,
    summary: {
      totalTopics: topics.length,
      materialTopics: topics.filter((t) => t.material).length,
      doubleMaterial: topics.filter((t) => t.quadrant === 'Double Material').length,
      impactOnly: topics.filter((t) => t.quadrant === 'Impact Only').length,
      financialOnly: topics.filter((t) => t.quadrant === 'Financial Only').length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ASSESSMENT TRAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create an auditable assessment trail entry for a single topic.
 * @param {string} topicId — e.g. 'E1'
 * @param {Object} scores — { impactMagnitude, impactScope, impactIrremediability, impactLikelihood, financialMagnitude, financialLikelihood }
 * @param {string} rationale — free-text justification
 * @param {string} assessor — name of person / team
 * @returns {Object} trail entry
 */
export function createAssessmentTrail(topicId, scores, rationale, assessor = 'System') {
  const {
    impactMagnitude = 1,
    impactScope = 1,
    impactIrremediability = 1,
    impactLikelihood = 1,
    financialMagnitude = 1,
    financialLikelihood = 1,
  } = scores;

  const severityAvg = (impactMagnitude + impactScope + impactIrremediability) / 3;
  const impactScore = severityAvg * impactLikelihood;
  const financialScore = financialMagnitude * financialLikelihood;

  const impactMaterial = impactScore >= SCORING_CRITERIA.impact.threshold;
  const financialMaterial = financialScore >= SCORING_CRITERIA.financial.threshold;

  return {
    topicId,
    timestamp: new Date().toISOString(),
    assessor,
    scores: {
      impact: {
        magnitude: impactMagnitude,
        scope: impactScope,
        irremediability: impactIrremediability,
        likelihood: impactLikelihood,
        severityAverage: Math.round(severityAvg * 100) / 100,
        compositeScore: Math.round(impactScore * 100) / 100,
        thresholdMet: impactMaterial,
      },
      financial: {
        magnitude: financialMagnitude,
        likelihood: financialLikelihood,
        compositeScore: Math.round(financialScore * 100) / 100,
        thresholdMet: financialMaterial,
      },
    },
    determination: {
      material: impactMaterial || financialMaterial,
      basis: impactMaterial && financialMaterial
        ? 'Double materiality'
        : impactMaterial ? 'Impact materiality only'
        : financialMaterial ? 'Financial materiality only'
        : 'Not material',
    },
    rationale,
    auditHash: generateAuditHash(topicId, scores, rationale),
  };
}

/**
 * Generate a deterministic hash for audit trail integrity.
 * Uses a simple djb2 hash — not cryptographic, but sufficient for change detection.
 */
function generateAuditHash(topicId, scores, rationale) {
  const input = JSON.stringify({ topicId, scores, rationale });
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return `dma-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. BATCH ASSESSMENT FOR A COMPANY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run DMA for all ESRS topics for a company, producing matrix + trail.
 * @param {string} companyName
 * @param {string} sector
 * @param {Object} topicScores — keyed by topic ID, each with detailed scores
 * @returns {Object} { matrix, trails }
 */
export function runFullDMA(companyName, sector, topicScores = {}) {
  const matrix = generateDMAMatrix(companyName, sector);
  const trails = matrix.topics.map((t) => {
    const scores = topicScores[t.id] || {
      impactMagnitude: Math.round(t.impactScore),
      impactScope: Math.round(t.impactScore),
      impactIrremediability: Math.round(t.impactScore * 0.8),
      impactLikelihood: Math.ceil(t.impactScore),
      financialMagnitude: Math.round(t.financialScore),
      financialLikelihood: Math.ceil(t.financialScore),
    };
    return createAssessmentTrail(t.id, scores, `Sector-adjusted baseline for ${sector}`, 'DMA Engine v1.0');
  });

  return { matrix, trails };
}
