/**
 * ENH-030: SBTi-Derived Company Temperature Scores
 *
 * Maps SBTi target data to implied temperature ratings using the
 * SBTi Temperature Rating methodology v2.0 (2023).
 *
 * References:
 *   SBTi Temperature Rating Methodology v2.0 (2023)
 *   SBTi Corporate Net-Zero Standard v1.1 (Oct 2023)
 *   SBTi Criteria & Recommendations v5.1 (Oct 2023)
 *   IPCC AR6 WG3 — current-policies pathway estimate: 2.5–3.5°C
 *
 * Replaces pseudo-random temperature values with methodology-backed
 * derivations anchored to real SBTi status and sector pathways.
 */

import { SBTI_STATISTICS } from './referenceData';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TARGET-TYPE → IMPLIED TEMPERATURE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export const TARGET_TO_TEMP = {
  '1.5C_aligned': {
    temp: 1.5,
    range: [1.4, 1.6],
    methodology: 'SBTi Corporate Net-Zero Standard v1.1',
    confidence: 'high',
    description: 'Near-term + long-term targets validated as 1.5°C aligned',
  },
  'well_below_2C': {
    temp: 1.75,
    range: [1.6, 1.9],
    methodology: 'SBTi Criteria v5.1',
    confidence: 'high',
    description: 'Near-term targets validated as well-below 2°C',
  },
  '2C_aligned': {
    temp: 2.0,
    range: [1.9, 2.2],
    methodology: 'SBTi Criteria v5.1 (legacy)',
    confidence: 'medium',
    description: 'Near-term targets validated as 2°C aligned (no longer accepted for new submissions)',
  },
  'committed_no_target': {
    temp: 2.5,
    range: [2.2, 3.0],
    methodology: 'Estimated — committed but no validated target',
    confidence: 'low',
    description: 'Company committed to SBTi but target not yet validated; assumes partial decarbonisation intent',
  },
  'no_commitment': {
    temp: 3.2,
    range: [2.7, 3.8],
    methodology: 'Estimated — IPCC AR6 current-policies pathway midpoint',
    confidence: 'very_low',
    description: 'No SBTi commitment; defaults to current-policies warming estimate from IPCC AR6 WG3',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SECTOR PATHWAY TEMPERATURES (from IEA NZE & IPCC sectoral budgets)
// ═══════════════════════════════════════════════════════════════════════════════

const SECTOR_PATHWAYS = {
  Energy:                    { currentTemp: 3.5, nzeTemp: 1.5, decarbRate: 6.0,  isBenchmarked: true  },
  Utilities:                 { currentTemp: 3.4, nzeTemp: 1.5, decarbRate: 7.0,  isBenchmarked: true  },
  Materials:                 { currentTemp: 3.1, nzeTemp: 1.6, decarbRate: 4.5,  isBenchmarked: true  },
  Transportation:            { currentTemp: 3.3, nzeTemp: 1.7, decarbRate: 5.0,  isBenchmarked: true  },
  'Automobiles & Components':{ currentTemp: 2.9, nzeTemp: 1.5, decarbRate: 7.0,  isBenchmarked: true  },
  Industrials:               { currentTemp: 2.8, nzeTemp: 1.7, decarbRate: 4.2,  isBenchmarked: true  },
  'Consumer Staples':        { currentTemp: 2.6, nzeTemp: 1.8, decarbRate: 3.5,  isBenchmarked: false },
  'Consumer Disc.':          { currentTemp: 2.5, nzeTemp: 1.8, decarbRate: 3.5,  isBenchmarked: false },
  Healthcare:                { currentTemp: 2.4, nzeTemp: 1.8, decarbRate: 3.0,  isBenchmarked: false },
  Technology:                { currentTemp: 2.3, nzeTemp: 1.7, decarbRate: 3.5,  isBenchmarked: false },
  Financials:                { currentTemp: 2.5, nzeTemp: 1.8, decarbRate: 3.0,  isBenchmarked: false },
  'Real Estate':             { currentTemp: 2.8, nzeTemp: 1.6, decarbRate: 4.5,  isBenchmarked: true  },
  Telecoms:                  { currentTemp: 2.3, nzeTemp: 1.7, decarbRate: 3.5,  isBenchmarked: false },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CORE DERIVATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Derive a temperature score for a company based on its SBTi status.
 *
 * Priority order:
 *   1. Validated SBTi target → direct mapping
 *   2. SBTi committed → committed estimate
 *   3. No SBTi → sector pathway estimation using intensity ratio
 *
 * @param {Object} company — { sbtiStatus, sbtiTarget, sector, emissionsIntensity }
 *   sbtiStatus: 'validated' | 'committed' | 'none' | undefined
 *   sbtiTarget: '1.5C_aligned' | 'well_below_2C' | '2C_aligned' | undefined
 *   sector: GICS sector name
 *   emissionsIntensity: tCO2e per $M revenue (optional, used for non-SBTi)
 * @returns {Object} { temp, range, methodology, confidence, derivation }
 */
export function deriveTemperatureScore(company) {
  // 1. Validated SBTi target
  if (company.sbtiStatus === 'validated' && company.sbtiTarget) {
    const mapping = TARGET_TO_TEMP[company.sbtiTarget];
    if (mapping) {
      return {
        ...mapping,
        derivation: 'SBTi validated target — direct mapping',
        company: company.name || company.companyId,
      };
    }
    // Validated but unknown target type
    return {
      temp: 2.0,
      range: [1.5, 2.2],
      methodology: 'SBTi validated (target type not classified)',
      confidence: 'medium',
      derivation: 'SBTi validated — generic midpoint',
      company: company.name || company.companyId,
    };
  }

  // 2. SBTi committed (no validated target yet)
  if (company.sbtiStatus === 'committed') {
    const mapping = TARGET_TO_TEMP['committed_no_target'];
    return {
      ...mapping,
      derivation: 'SBTi committed — awaiting validation',
      company: company.name || company.companyId,
    };
  }

  // 3. No SBTi — sector estimation
  return estimateFromSector(company.sector, company.emissionsIntensity, company.name || company.companyId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SECTOR-BASED ESTIMATION FOR NON-SBTI COMPANIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estimate temperature score using sector pathway and company intensity.
 * Formula:
 *   ratio = companyIntensity / sectorMedianIntensity
 *   temp  = sectorCurrentTemp × min(ratio, 1.5)
 * If no intensity data, use sector current-policies temperature.
 */
function estimateFromSector(sector, intensity, companyRef) {
  const pathway = SECTOR_PATHWAYS[sector] || SECTOR_PATHWAYS.Industrials;
  const noSbtiBase = TARGET_TO_TEMP['no_commitment'];

  if (!intensity || intensity <= 0) {
    return {
      temp: pathway.currentTemp,
      range: [pathway.currentTemp - 0.3, pathway.currentTemp + 0.3],
      methodology: `Sector pathway estimate (${sector || 'default'}) — no intensity data`,
      confidence: 'very_low',
      derivation: 'No SBTi, no intensity data — sector default',
      company: companyRef,
    };
  }

  // Compare to sector median (approximate from SECTOR_PATHWAYS)
  // Lower intensity → lower temperature (closer to NZE)
  // Higher intensity → higher temperature (closer to current policies)
  const sectorMedian = (pathway.currentTemp + pathway.nzeTemp) / 2;
  const nzeIntensityEstimate = 50; // rough cross-sector NZE target (tCO2e/$M)
  const currentIntensityEstimate = 200; // rough current-policies sector average

  let ratio = 1.0;
  if (currentIntensityEstimate > nzeIntensityEstimate) {
    ratio = (intensity - nzeIntensityEstimate) / (currentIntensityEstimate - nzeIntensityEstimate);
  }
  ratio = Math.max(0, Math.min(1.5, ratio)); // clamp 0–1.5

  const temp = pathway.nzeTemp + ratio * (pathway.currentTemp - pathway.nzeTemp);
  const clampedTemp = Math.max(1.3, Math.min(4.0, temp));
  const rounded = Math.round(clampedTemp * 100) / 100;

  return {
    temp: rounded,
    range: [Math.max(1.3, rounded - 0.3), Math.min(4.0, rounded + 0.3)],
    methodology: `Sector pathway interpolation (${sector}) based on emissions intensity`,
    confidence: 'low',
    derivation: `No SBTi — intensity ratio ${ratio.toFixed(2)} × sector pathway`,
    company: companyRef,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PORTFOLIO-LEVEL TEMPERATURE AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute portfolio-level temperature using WATS (Weighted Average Temperature Score).
 * Weight = portfolio weight (market value based).
 *
 * @param {Array} holdings — [{ company: {...}, weight: 0.05 }]
 * @returns {Object} { portfolioTemp, contributions, sbtiCoverage, breakdown }
 */
export function derivePortfolioTemperature(holdings) {
  if (!holdings || holdings.length === 0) {
    return { portfolioTemp: null, contributions: [], sbtiCoverage: 0, breakdown: {} };
  }

  // Normalise weights
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0);

  const contributions = holdings.map((h) => {
    const score = deriveTemperatureScore(h.company || h);
    const normWeight = totalWeight > 0 ? (h.weight || 0) / totalWeight : 1 / holdings.length;
    return {
      company: h.company?.name || h.name || 'Unknown',
      weight: Math.round(normWeight * 10000) / 10000,
      temp: score.temp,
      contribution: Math.round(normWeight * score.temp * 1000) / 1000,
      confidence: score.confidence,
      derivation: score.derivation,
    };
  });

  const portfolioTemp = contributions.reduce((s, c) => s + c.contribution, 0);

  // SBTi coverage
  const sbtiCount = holdings.filter((h) => {
    const co = h.company || h;
    return co.sbtiStatus === 'validated' || co.sbtiStatus === 'committed';
  }).length;
  const sbtiCoverage = holdings.length > 0 ? sbtiCount / holdings.length : 0;

  // Temperature breakdown
  const breakdown = {
    below1_5: contributions.filter((c) => c.temp <= 1.5).length,
    between1_5_2: contributions.filter((c) => c.temp > 1.5 && c.temp <= 2.0).length,
    between2_2_5: contributions.filter((c) => c.temp > 2.0 && c.temp <= 2.5).length,
    between2_5_3: contributions.filter((c) => c.temp > 2.5 && c.temp <= 3.0).length,
    above3: contributions.filter((c) => c.temp > 3.0).length,
  };

  return {
    portfolioTemp: Math.round(portfolioTemp * 100) / 100,
    contributions,
    sbtiCoverage: Math.round(sbtiCoverage * 1000) / 1000,
    breakdown,
    methodology: 'WATS (Weighted Average Temperature Score) — SBTi v2.0',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SBTI PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Track SBTi progress for a company: how far along the target-setting journey.
 *
 * @param {Object} company — { sbtiStatus, sbtiTarget, sbtiCommitDate, sbtiValidationDate, currentEmissions, baseYearEmissions, baseYear, targetYear }
 * @returns {Object} progress report
 */
export function trackSBTiProgress(company) {
  const status = company.sbtiStatus || 'none';
  const now = new Date();
  const currentYear = now.getFullYear();

  // Journey stage
  let stage = 'Not engaged';
  let stageNumber = 0;
  if (status === 'validated') { stage = 'Validated'; stageNumber = 3; }
  else if (status === 'committed') { stage = 'Committed'; stageNumber = 2; }
  else if (company.sbtiCommitDate) { stage = 'In process'; stageNumber = 1; }

  // Emission reduction progress (if data available)
  let reductionProgress = null;
  if (company.baseYearEmissions && company.currentEmissions && company.baseYear && company.targetYear) {
    const totalReductionNeeded = company.baseYearEmissions - (company.baseYearEmissions * 0.5); // assume 50% reduction target
    const actualReduction = company.baseYearEmissions - company.currentEmissions;
    const yearsElapsed = currentYear - company.baseYear;
    const totalYears = company.targetYear - company.baseYear;
    const timeProgress = totalYears > 0 ? yearsElapsed / totalYears : 0;

    reductionProgress = {
      baseYear: company.baseYear,
      targetYear: company.targetYear,
      baseYearEmissions: company.baseYearEmissions,
      currentEmissions: company.currentEmissions,
      reductionAchieved: Math.round(actualReduction),
      reductionPercent: Math.round((actualReduction / company.baseYearEmissions) * 10000) / 100,
      timeElapsedPercent: Math.round(timeProgress * 10000) / 100,
      onTrack: (actualReduction / company.baseYearEmissions) >= timeProgress * 0.5,
    };
  }

  // Validation deadline check (SBTi requires validation within 24 months of commitment)
  let validationDeadline = null;
  if (status === 'committed' && company.sbtiCommitDate) {
    const commitDate = new Date(company.sbtiCommitDate);
    const deadline = new Date(commitDate);
    deadline.setMonth(deadline.getMonth() + 24);
    validationDeadline = {
      commitDate: company.sbtiCommitDate,
      deadline: deadline.toISOString().slice(0, 10),
      overdue: now > deadline,
      monthsRemaining: Math.max(0, Math.round((deadline - now) / (30.44 * 24 * 60 * 60 * 1000))),
    };
  }

  return {
    company: company.name || company.companyId,
    stage,
    stageNumber,
    targetType: company.sbtiTarget || null,
    impliedTemp: deriveTemperatureScore(company).temp,
    reductionProgress,
    validationDeadline,
    sbtiProgrammeContext: {
      totalCommitted: SBTI_STATISTICS.totalCommitted,
      totalValidated: SBTI_STATISTICS.totalValidated,
      pctValidated1_5C: SBTI_STATISTICS.byTargetType.nearTerm1_5C,
    },
  };
}
