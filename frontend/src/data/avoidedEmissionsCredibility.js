/**
 * ENH-031: Avoided Emissions Credibility Assessment
 *
 * Implements a structured credibility scoring framework for avoided-emissions
 * claims, based on:
 *   WRI / WBCSD GHG Protocol — Estimating & Reporting Avoided Emissions (2019)
 *   Project Frame — Comparative Emissions Framework (v1.0)
 *   Mission Innovation Net-Zero Compatible Innovations Framework (2023)
 *
 * Avoided emissions (Scope 4 / "handprint") are NOT Scope 1-3 reductions.
 * They represent the positive climate impact of a product/service compared
 * to a counterfactual baseline. Because they are self-reported and unregulated,
 * credibility assessment is critical.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CREDIBILITY CRITERIA (8 dimensions, 100 total weight)
// ═══════════════════════════════════════════════════════════════════════════════

export const CREDIBILITY_CRITERIA = [
  {
    id: 1,
    name: 'Baseline Transparency',
    weight: 15,
    description: 'Is the baseline scenario clearly defined, documented, and reasonable?',
    scoringGuide: {
      5: 'Baseline uses published industry data with sensitivity analysis',
      4: 'Baseline clearly documented with referenced data sources',
      3: 'Baseline described but data sources partially unclear',
      2: 'Baseline loosely defined, limited justification',
      1: 'No clear baseline definition',
    },
  },
  {
    id: 2,
    name: 'Additionality',
    weight: 20,
    description: 'Would the emissions reduction have happened without this product/service?',
    scoringGuide: {
      5: 'Clear demonstration that reduction would not occur without the intervention; market failure evidence',
      4: 'Strong case for additionality with supporting market data',
      3: 'Reasonable argument but some reduction would likely occur anyway',
      2: 'Weak additionality — similar alternatives widely available',
      1: 'No additionality demonstrated; reduction already occurring in baseline',
    },
  },
  {
    id: 3,
    name: 'Conservative Assumptions',
    weight: 15,
    description: 'Are emission factor and adoption rate assumptions conservative?',
    scoringGuide: {
      5: 'All assumptions use lower-bound estimates with documented uncertainty ranges',
      4: 'Most assumptions are conservative; uncertainty acknowledged',
      3: 'Mix of conservative and optimistic assumptions',
      2: 'Assumptions tend toward optimistic; limited uncertainty analysis',
      1: 'Unrealistic or unsupported assumptions; no uncertainty analysis',
    },
  },
  {
    id: 4,
    name: 'Third-Party Verification',
    weight: 15,
    description: 'Has an independent party verified the calculation methodology and data?',
    scoringGuide: {
      5: 'Full verification by accredited assurance provider (ISO 14064-3)',
      4: 'Limited assurance by recognised firm',
      3: 'Peer review by independent experts (not formal assurance)',
      2: 'Internal review only, methodology published',
      1: 'No independent review of any kind',
    },
  },
  {
    id: 5,
    name: 'No Double Counting',
    weight: 10,
    description: 'Is there a mechanism to prevent double counting with other entities in the value chain?',
    scoringGuide: {
      5: 'Formal allocation protocol; coordinates with upstream/downstream actors',
      4: 'Clear allocation rules documented; no evidence of overlap',
      3: 'Acknowledges risk; partial allocation protocol',
      2: 'No formal protocol; potential overlap identified',
      1: 'No consideration of double counting',
    },
  },
  {
    id: 6,
    name: 'Temporal Boundaries',
    weight: 5,
    description: 'Are timeframes for impact clearly bounded and appropriate?',
    scoringGuide: {
      5: 'Clear annual boundaries; product lifetime assumptions documented and reasonable',
      4: 'Timeframes specified with reasonable lifetime assumptions',
      3: 'General timeframes but some ambiguity on product lifetime',
      2: 'Vague timeframes; potentially overstating duration of impact',
      1: 'No temporal boundaries defined',
    },
  },
  {
    id: 7,
    name: 'Geographic Scope',
    weight: 5,
    description: 'Is the geographic applicability clearly defined with appropriate grid factors?',
    scoringGuide: {
      5: 'Country/region-specific emission factors used; geographic scope explicitly bounded',
      4: 'Regional factors applied; geographic scope documented',
      3: 'Mixed regional/global factors; scope partially defined',
      2: 'Global averages used where regional data would be more appropriate',
      1: 'No geographic scoping; global factors only',
    },
  },
  {
    id: 8,
    name: 'Rebound Effect',
    weight: 15,
    description: 'Is the rebound effect (increased usage due to efficiency gains) quantified and deducted?',
    scoringGuide: {
      5: 'Rebound effect quantified using empirical data and deducted from claimed avoidance',
      4: 'Rebound effect estimated using literature values and partially deducted',
      3: 'Rebound effect acknowledged qualitatively; rough estimate applied',
      2: 'Rebound effect mentioned but not quantified or deducted',
      1: 'No consideration of rebound effect',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CREDIBILITY SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Score a company's avoided emissions claim against all credibility criteria.
 *
 * @param {Object} claim — {
 *   companyName: string,
 *   claimedAvoidance: number (tCO2e),
 *   productDescription: string,
 *   scores: { 1: number(1-5), 2: number(1-5), ..., 8: number(1-5) },
 *   evidence: { 1: string, 2: string, ... } (optional per-criterion notes)
 * }
 * @returns {Object} credibility assessment
 */
export function assessCredibility(claim) {
  const { companyName, claimedAvoidance, productDescription, scores = {}, evidence = {} } = claim;

  let totalWeightedScore = 0;
  let maxPossibleScore = 0;
  const criteriaResults = [];

  for (const criterion of CREDIBILITY_CRITERIA) {
    const rawScore = scores[criterion.id] || 1;
    const clampedScore = Math.max(1, Math.min(5, rawScore));
    const weightedScore = clampedScore * criterion.weight;
    const maxForCriterion = 5 * criterion.weight;

    totalWeightedScore += weightedScore;
    maxPossibleScore += maxForCriterion;

    criteriaResults.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      rawScore: clampedScore,
      weightedScore,
      maxWeightedScore: maxForCriterion,
      percentage: Math.round((clampedScore / 5) * 100),
      evidence: evidence[criterion.id] || null,
      guide: criterion.scoringGuide[clampedScore],
    });
  }

  const overallScore = maxPossibleScore > 0 ? (totalWeightedScore / maxPossibleScore) * 100 : 0;
  const rounded = Math.round(overallScore * 10) / 10;

  return {
    companyName,
    productDescription,
    claimedAvoidance,
    assessmentDate: new Date().toISOString().slice(0, 10),
    overallScore: rounded,
    rating: getCredibilityRating(rounded),
    criteria: criteriaResults,
    redFlags: detectRedFlags(claim),
    recommendations: recommendImprovements({ criteria: criteriaResults, overallScore: rounded }),
    adjustedAvoidance: calculateAdjustedAvoidance(claimedAvoidance, rounded),
  };
}

/**
 * Map overall score to a credibility rating tier.
 */
function getCredibilityRating(score) {
  if (score >= 85) return { tier: 'A', label: 'Highly Credible', color: '#059669' };
  if (score >= 70) return { tier: 'B', label: 'Credible', color: '#0d9488' };
  if (score >= 55) return { tier: 'C', label: 'Partially Credible', color: '#d97706' };
  if (score >= 40) return { tier: 'D', label: 'Weak Credibility', color: '#ea580c' };
  return { tier: 'E', label: 'Not Credible', color: '#dc2626' };
}

/**
 * Apply a credibility haircut to claimed avoided emissions.
 * Higher credibility → less haircut.
 */
function calculateAdjustedAvoidance(claimedAvoidance, credibilityScore) {
  // Credibility factor: 85+ → 95%, 70 → 75%, 55 → 50%, 40 → 25%, <40 → 10%
  let factor;
  if (credibilityScore >= 85) factor = 0.95;
  else if (credibilityScore >= 70) factor = 0.60 + (credibilityScore - 70) * 0.0233;
  else if (credibilityScore >= 55) factor = 0.40 + (credibilityScore - 55) * 0.0133;
  else if (credibilityScore >= 40) factor = 0.20 + (credibilityScore - 40) * 0.0133;
  else factor = 0.10;

  return {
    claimed: claimedAvoidance,
    adjusted: Math.round(claimedAvoidance * factor),
    haircutPercent: Math.round((1 - factor) * 100),
    factor: Math.round(factor * 1000) / 1000,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RED FLAG DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect potential red flags in an avoided emissions claim.
 *
 * @param {Object} claim — same shape as assessCredibility input
 * @returns {Array} list of { flag, severity, description }
 */
export function detectRedFlags(claim) {
  const flags = [];
  const scores = claim.scores || {};

  // No third-party verification
  if ((scores[4] || 1) <= 2) {
    flags.push({
      flag: 'NO_VERIFICATION',
      severity: 'high',
      description: 'Avoided emissions claim lacks independent third-party verification',
    });
  }

  // Weak additionality
  if ((scores[2] || 1) <= 2) {
    flags.push({
      flag: 'WEAK_ADDITIONALITY',
      severity: 'high',
      description: 'Additionality not demonstrated — reduction may occur regardless of product/service',
    });
  }

  // No rebound consideration
  if ((scores[8] || 1) <= 1) {
    flags.push({
      flag: 'REBOUND_IGNORED',
      severity: 'medium',
      description: 'Rebound effect not considered — actual avoidance may be substantially lower',
    });
  }

  // Double counting risk
  if ((scores[5] || 1) <= 2) {
    flags.push({
      flag: 'DOUBLE_COUNT_RISK',
      severity: 'medium',
      description: 'No mechanism to prevent double counting with value chain partners',
    });
  }

  // Opaque baseline
  if ((scores[1] || 1) <= 2) {
    flags.push({
      flag: 'OPAQUE_BASELINE',
      severity: 'medium',
      description: 'Baseline scenario not transparent — cannot assess reasonableness of claim',
    });
  }

  // Disproportionate claim (avoidance > 10× own Scope 1+2 is unusual)
  if (claim.ownScope12 && claim.claimedAvoidance > claim.ownScope12 * 10) {
    flags.push({
      flag: 'DISPROPORTIONATE_CLAIM',
      severity: 'high',
      description: `Claimed avoidance (${claim.claimedAvoidance.toLocaleString()} tCO2e) is >10× own Scope 1+2 emissions — unusually high ratio requires scrutiny`,
    });
  }

  // Overly optimistic assumptions
  if ((scores[3] || 1) <= 2) {
    flags.push({
      flag: 'OPTIMISTIC_ASSUMPTIONS',
      severity: 'medium',
      description: 'Emission factor or adoption rate assumptions appear optimistic rather than conservative',
    });
  }

  return flags;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. IMPROVEMENT RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate actionable recommendations to improve claim credibility.
 *
 * @param {Object} assessment — { criteria: [...], overallScore }
 * @returns {Array} prioritised recommendations
 */
export function recommendImprovements(assessment) {
  const recommendations = [];
  const weakCriteria = (assessment.criteria || [])
    .filter((c) => c.rawScore <= 3)
    .sort((a, b) => b.weight - a.weight); // prioritise by weight

  const improvementMap = {
    'Baseline Transparency': 'Publish baseline methodology and data sources; include sensitivity analysis showing impact of alternative baselines',
    'Additionality': 'Commission a market study demonstrating that the product/service displaces a higher-emitting alternative that would otherwise persist',
    'Conservative Assumptions': 'Use lower-bound emission factors; add Monte Carlo uncertainty analysis; disclose assumption ranges',
    'Third-Party Verification': 'Engage an ISO 14064-3 accredited verifier; at minimum obtain limited assurance from a recognised firm',
    'No Double Counting': 'Develop an allocation protocol that coordinates with supply chain partners; reference GHG Protocol value chain guidance',
    'Temporal Boundaries': 'Define annual reporting boundaries; document product lifetime assumptions with supporting data',
    'Geographic Scope': 'Use country-specific grid emission factors (IEA or national inventories) instead of global averages',
    'Rebound Effect': 'Quantify rebound effect using sector-specific elasticity data; deduct estimated rebound from gross avoidance figure',
  };

  for (const c of weakCriteria) {
    const recommendation = improvementMap[c.criterionName];
    if (recommendation) {
      recommendations.push({
        criterion: c.criterionName,
        currentScore: c.rawScore,
        targetScore: Math.min(5, c.rawScore + 2),
        priority: c.weight >= 15 ? 'high' : c.weight >= 10 ? 'medium' : 'low',
        recommendation,
        estimatedScoreImpact: Math.round(((2 * c.weight) / 500) * 100 * 10) / 10,
      });
    }
  }

  return recommendations;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. FULL CREDIBILITY REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a complete credibility report for a company with multiple claims.
 *
 * @param {string} companyName
 * @param {Array} claims — array of claim objects
 * @returns {Object} full report with per-claim and aggregate assessment
 */
export function generateCredibilityReport(companyName, claims) {
  const assessments = claims.map((claim) => assessCredibility({ ...claim, companyName }));

  const avgScore = assessments.length > 0
    ? assessments.reduce((s, a) => s + a.overallScore, 0) / assessments.length
    : 0;

  const totalClaimed = assessments.reduce((s, a) => s + (a.claimedAvoidance || 0), 0);
  const totalAdjusted = assessments.reduce((s, a) => s + (a.adjustedAvoidance?.adjusted || 0), 0);

  const allRedFlags = assessments.flatMap((a) => a.redFlags || []);
  const uniqueFlags = [...new Map(allRedFlags.map((f) => [f.flag, f])).values()];

  return {
    companyName,
    reportDate: new Date().toISOString().slice(0, 10),
    claimCount: claims.length,
    aggregateScore: Math.round(avgScore * 10) / 10,
    aggregateRating: getCredibilityRating(avgScore),
    totalClaimedAvoidance: totalClaimed,
    totalAdjustedAvoidance: totalAdjusted,
    aggregateHaircut: totalClaimed > 0 ? Math.round((1 - totalAdjusted / totalClaimed) * 100) : 0,
    assessments,
    consolidatedRedFlags: uniqueFlags,
    topRecommendations: assessments
      .flatMap((a) => a.recommendations || [])
      .sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 };
        return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
      })
      .slice(0, 5),
    methodology: {
      framework: 'WRI / Project Frame / Mission Innovation',
      criteriaCount: CREDIBILITY_CRITERIA.length,
      maxScore: 100,
      ratingScale: ['A: Highly Credible (85+)', 'B: Credible (70-84)', 'C: Partially Credible (55-69)', 'D: Weak (40-54)', 'E: Not Credible (<40)'],
    },
  };
}
