/**
 * ENH-011: Server-Side PCAF Engine Contract & Client Fallback
 *
 * Defines the API contract for a server-side PCAF (Partnership for Carbon
 * Accounting Financials) calculation engine, plus a chunked client-side
 * fallback for large portfolios (>1000 holdings) that avoids UI freeze.
 *
 * References:
 *   PCAF Global GHG Accounting & Reporting Standard Part A (2nd edition, 2022)
 *   https://carbonaccountingfinancials.com/standard
 *
 * Asset-class scoring follows PCAF Table 5-1 (data quality scores 1–5).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. API CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════

export const PCAF_API_CONTRACT = {
  endpoint: '/api/v1/pcaf/calculate',
  method: 'POST',
  version: '2.0',

  /** Request body schema */
  request: {
    portfolioId: 'uuid',
    period: 'YYYY-QN',
    holdings: [
      {
        companyId: 'uuid',
        outstandingAmount: 'number (USD)',
        assetClass: 'listed_equity | corporate_bonds | business_loans | project_finance | commercial_real_estate | mortgages | motor_vehicle',
        pcafDataQualityScore: '1-5',
        evic: 'number (optional — enterprise value including cash)',
        totalDebt: 'number (optional)',
        reportedEmissions: '{ scope1, scope2, scope3 } (optional)',
      },
    ],
    config: {
      methodology: 'pcaf_v2',
      includeScope3: true,
      dqsWeighting: true,
      attributionMethod: 'evic | balance_sheet | property_value',
      fallbackFactors: 'sector_average | statistical',
    },
  },

  /** Response schema */
  response: {
    financedEmissions: [
      {
        holdingId: 'uuid',
        scope1FE: 'number (tCO2e)',
        scope2FE: 'number (tCO2e)',
        scope3FE: 'number (tCO2e)',
        totalFE: 'number (tCO2e)',
        attributionFactor: 'number (0-1)',
        dataQualityScore: '1-5',
        lineage: '{ source, method, timestamp }',
      },
    ],
    portfolioTotals: {
      totalFinancedEmissions: 'number (tCO2e)',
      waci: 'number (tCO2e / $M invested)',
      coverage: 'number (0-1)',
      weightedDqs: 'number (1-5)',
      totalOutstanding: 'number (USD)',
    },
    metadata: {
      calculationTime: 'number (ms)',
      holdingsProcessed: 'number',
      holdingsSkipped: 'number',
      dataQualityBreakdown: '{ dqs1: count, dqs2: count, dqs3: count, dqs4: count, dqs5: count }',
      methodologyVersion: 'PCAF v2.0',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PCAF DATA QUALITY SCORE DEFINITIONS (Table 5-1)
// ═══════════════════════════════════════════════════════════════════════════════

export const DQS_DEFINITIONS = {
  1: {
    label: 'Audited',
    description: 'Reported emissions verified by qualified 3rd-party auditor',
    uncertainty: 0.05,
    method: 'Verified direct measurement',
  },
  2: {
    label: 'Reported',
    description: 'Reported emissions from company disclosures, not yet verified',
    uncertainty: 0.15,
    method: 'Unverified company report (CDP, annual report)',
  },
  3: {
    label: 'Physical Activity',
    description: 'Emissions estimated from physical activity data and emission factors',
    uncertainty: 0.30,
    method: 'Activity data × emission factors (DEFRA / EPA)',
  },
  4: {
    label: 'Economic Activity',
    description: 'Emissions estimated from economic activity (revenue, EEIO models)',
    uncertainty: 0.50,
    method: 'Revenue × sector EEIO factor (Exiobase / USEEIO)',
  },
  5: {
    label: 'Estimated',
    description: 'Sector-average emissions with no company-specific data',
    uncertainty: 0.70,
    method: 'Sector average intensity × financial exposure',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SECTOR EMISSION FACTORS (PCAF fallback — tCO2e per $M revenue)
// ═══════════════════════════════════════════════════════════════════════════════

const SECTOR_FACTORS = {
  Energy:            { scope12: 850,  scope3: 2400, dqs: 5 },
  Utilities:         { scope12: 1200, scope3: 350,  dqs: 5 },
  Materials:         { scope12: 620,  scope3: 480,  dqs: 5 },
  Industrials:       { scope12: 180,  scope3: 320,  dqs: 5 },
  'Consumer Disc.':  { scope12: 55,   scope3: 280,  dqs: 5 },
  'Consumer Staples':{ scope12: 65,   scope3: 310,  dqs: 5 },
  Healthcare:        { scope12: 30,   scope3: 120,  dqs: 5 },
  Financials:        { scope12: 8,    scope3: 15,   dqs: 5 },
  Technology:        { scope12: 18,   scope3: 95,   dqs: 5 },
  'Real Estate':     { scope12: 90,   scope3: 45,   dqs: 5 },
  Telecoms:          { scope12: 42,   scope3: 110,  dqs: 5 },
  Transportation:    { scope12: 380,  scope3: 150,  dqs: 5 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CHUNKED CLIENT-SIDE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process holdings in chunks to avoid UI freeze on large portfolios.
 * @param {Array}  holdings  — array of holding objects
 * @param {number} chunkSize — number of holdings per tick (default 100)
 * @param {Function} onProgress — optional callback(processed, total)
 * @returns {Promise<Object>} aggregated PCAF results
 */
export async function calculatePcafChunked(holdings, chunkSize = 100, onProgress) {
  const chunks = [];
  for (let i = 0; i < holdings.length; i += chunkSize) {
    chunks.push(holdings.slice(i, i + chunkSize));
  }

  const results = [];
  let processed = 0;

  for (const chunk of chunks) {
    // Yield to the UI thread between chunks
    await new Promise((r) => setTimeout(r, 0));
    const chunkResults = chunk.map((h) => calculateSingleHolding(h));
    results.push(...chunkResults);
    processed += chunk.length;
    if (onProgress) onProgress(processed, holdings.length);
  }

  return aggregateResults(results, holdings);
}

/**
 * Calculate financed emissions for a single holding.
 * Uses PCAF attribution: FE = (Outstanding / EVIC) × CompanyEmissions
 * Falls back to sector-average if no reported emissions.
 */
function calculateSingleHolding(holding) {
  const {
    companyId,
    outstandingAmount = 0,
    evic,
    totalDebt,
    reportedEmissions,
    sector = 'Financials',
    assetClass = 'listed_equity',
    pcafDataQualityScore,
    revenueUsd,
  } = holding;

  // 1. Determine attribution factor
  let attributionFactor = 0;
  if (assetClass === 'listed_equity' || assetClass === 'corporate_bonds') {
    // EVIC method
    attributionFactor = evic > 0 ? outstandingAmount / evic : 0;
  } else if (assetClass === 'business_loans' || assetClass === 'project_finance') {
    // Balance-sheet method
    const denominator = (totalDebt || 0) + (evic || 0);
    attributionFactor = denominator > 0 ? outstandingAmount / denominator : 0;
  } else {
    // Property / motor vehicle — outstanding / property value
    attributionFactor = evic > 0 ? outstandingAmount / evic : 0;
  }

  // Clamp 0–1
  attributionFactor = Math.max(0, Math.min(1, attributionFactor));

  // 2. Determine emissions (reported or sector fallback)
  let scope1 = 0, scope2 = 0, scope3 = 0, dqs = 5;

  if (reportedEmissions && (reportedEmissions.scope1 > 0 || reportedEmissions.scope2 > 0)) {
    scope1 = reportedEmissions.scope1 || 0;
    scope2 = reportedEmissions.scope2 || 0;
    scope3 = reportedEmissions.scope3 || 0;
    dqs = pcafDataQualityScore || 2; // reported but unverified
  } else {
    // Sector-average fallback (DQS 5)
    const factors = SECTOR_FACTORS[sector] || SECTOR_FACTORS.Financials;
    const revM = (revenueUsd || outstandingAmount) / 1_000_000;
    scope1 = factors.scope12 * 0.6 * revM; // approximate split
    scope2 = factors.scope12 * 0.4 * revM;
    scope3 = factors.scope3 * revM;
    dqs = 5;
  }

  // 3. Financed emissions = attribution × company emissions
  const scope1FE = attributionFactor * scope1;
  const scope2FE = attributionFactor * scope2;
  const scope3FE = attributionFactor * scope3;
  const totalFE = scope1FE + scope2FE + scope3FE;

  return {
    companyId,
    outstandingAmount,
    scope1FE: Math.round(scope1FE * 100) / 100,
    scope2FE: Math.round(scope2FE * 100) / 100,
    scope3FE: Math.round(scope3FE * 100) / 100,
    totalFE: Math.round(totalFE * 100) / 100,
    attributionFactor: Math.round(attributionFactor * 10000) / 10000,
    dataQualityScore: dqs,
    lineage: {
      source: dqs <= 2 ? 'Company disclosure' : 'Sector average fallback',
      method: DQS_DEFINITIONS[dqs]?.method || 'Unknown',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Aggregate individual holding results into portfolio-level totals.
 */
function aggregateResults(results, holdings) {
  const totalFE = results.reduce((s, r) => s + r.totalFE, 0);
  const totalOutstanding = results.reduce((s, r) => s + r.outstandingAmount, 0);

  // WACI = Σ (weight_i × intensity_i)
  let waci = 0;
  for (const r of results) {
    const weight = totalOutstanding > 0 ? r.outstandingAmount / totalOutstanding : 0;
    const intensity = r.outstandingAmount > 0 ? (r.totalFE / r.outstandingAmount) * 1_000_000 : 0;
    waci += weight * intensity;
  }

  // Weighted DQS
  let weightedDqs = 0;
  for (const r of results) {
    const weight = totalOutstanding > 0 ? r.outstandingAmount / totalOutstanding : 0;
    weightedDqs += weight * r.dataQualityScore;
  }

  // Coverage = holdings with DQS <= 3 / total
  const coveredCount = results.filter((r) => r.dataQualityScore <= 3).length;
  const coverage = results.length > 0 ? coveredCount / results.length : 0;

  // DQS breakdown
  const dqsBreakdown = { dqs1: 0, dqs2: 0, dqs3: 0, dqs4: 0, dqs5: 0 };
  for (const r of results) {
    const key = `dqs${r.dataQualityScore}`;
    if (dqsBreakdown[key] !== undefined) dqsBreakdown[key]++;
  }

  return {
    financedEmissions: results,
    portfolioTotals: {
      totalFinancedEmissions: Math.round(totalFE * 100) / 100,
      waci: Math.round(waci * 100) / 100,
      coverage: Math.round(coverage * 1000) / 1000,
      weightedDqs: Math.round(weightedDqs * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    },
    metadata: {
      calculationTime: null, // set by caller
      holdingsProcessed: results.length,
      holdingsSkipped: holdings.length - results.length,
      dataQualityBreakdown: dqsBreakdown,
      methodologyVersion: 'PCAF v2.0',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Validate a holding object before calculation */
export function validateHolding(holding) {
  const errors = [];
  if (!holding.companyId) errors.push('companyId is required');
  if (typeof holding.outstandingAmount !== 'number' || holding.outstandingAmount < 0) {
    errors.push('outstandingAmount must be a non-negative number');
  }
  const validClasses = [
    'listed_equity', 'corporate_bonds', 'business_loans',
    'project_finance', 'commercial_real_estate', 'mortgages', 'motor_vehicle',
  ];
  if (holding.assetClass && !validClasses.includes(holding.assetClass)) {
    errors.push(`assetClass must be one of: ${validClasses.join(', ')}`);
  }
  if (holding.pcafDataQualityScore && (holding.pcafDataQualityScore < 1 || holding.pcafDataQualityScore > 5)) {
    errors.push('pcafDataQualityScore must be 1–5');
  }
  return { valid: errors.length === 0, errors };
}

/** Format financed emissions for display */
export function formatFE(value, unit = 'tCO2e') {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${unit}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}
