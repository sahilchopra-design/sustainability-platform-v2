/**
 * uxEnhancements.js
 * ─────────────────────────────────────────────────────────────────────
 * ENH-019  Temperature Distribution Histogram
 * ENH-020  DQS Confidence Bands
 * ENH-021  WACI Label Formatter (display helper)
 * ENH-022  Coverage Completeness Indicator
 * ─────────────────────────────────────────────────────────────────────
 * Reusable chart-data generators that any module can import.
 * All functions return plain objects ready for Recharts / KPI cards.
 */

// ── Colour constants ────────────────────────────────────────────────
const GREEN   = '#16a34a';
const AMBER   = '#d97706';
const RED     = '#dc2626';
const ORANGE  = '#ea580c';
const YELLOW  = '#facc15';
const TEAL    = '#0d9488';

// ── Helpers ─────────────────────────────────────────────────────────

/** Sort numeric array ascending (non-mutating). */
function sortedAsc(arr) {
  return [...arr].sort((a, b) => a - b);
}

/** Simple percentile (nearest-rank). */
function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.max(0, Math.ceil(p / 100 * sorted.length) - 1);
  return sorted[idx];
}

/** Arithmetic mean. */
function mean(arr) {
  if (arr.length === 0) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Median (standard). */
function median(arr) {
  const s = sortedAsc(arr);
  if (s.length === 0) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/** Mode (most frequent bin label among raw values, rounded to 1 dp). */
function mode(arr) {
  if (arr.length === 0) return null;
  const freq = {};
  arr.forEach(v => {
    const key = v.toFixed(1);
    freq[key] = (freq[key] || 0) + 1;
  });
  let maxCount = 0;
  let modeVal = null;
  Object.entries(freq).forEach(([k, c]) => {
    if (c > maxCount) { maxCount = c; modeVal = parseFloat(k); }
  });
  return modeVal;
}

/**
 * Bimodality coefficient (Sarle's).
 * BC = (g1^2 + 1) / (g2 + 3 * ((n-1)^2) / ((n-2)*(n-3)))
 * BC > 0.555 suggests bimodality.
 */
function bimodalityCoefficient(arr) {
  const n = arr.length;
  if (n < 4) return null;
  const m = mean(arr);
  const diffs = arr.map(v => v - m);
  const m2 = diffs.reduce((s, d) => s + d * d, 0) / n;
  const m3 = diffs.reduce((s, d) => s + d * d * d, 0) / n;
  const m4 = diffs.reduce((s, d) => s + d * d * d * d, 0) / n;
  const sd = Math.sqrt(m2);
  if (sd === 0) return null;
  const skew = m3 / (sd * sd * sd);
  const kurt = m4 / (sd * sd * sd * sd) - 3;
  const bc = (skew * skew + 1) / (kurt + 3 * ((n - 1) * (n - 1)) / ((n - 2) * (n - 3)));
  return Math.min(bc, 1.0);
}


// ─────────────────────────────────────────────────────────────────────
// ENH-019 : Temperature Distribution Histogram
// ─────────────────────────────────────────────────────────────────────

const TEMP_BINS = [
  { label: '<1.5\u00B0C', lo: -Infinity, hi: 1.5,  color: GREEN  },
  { label: '1.5-2.0\u00B0C', lo: 1.5, hi: 2.0,     color: TEAL   },
  { label: '2.0-2.5\u00B0C', lo: 2.0, hi: 2.5,     color: YELLOW },
  { label: '2.5-3.0\u00B0C', lo: 2.5, hi: 3.0,     color: AMBER  },
  { label: '3.0-4.0\u00B0C', lo: 3.0, hi: 4.0,     color: ORANGE },
  { label: '>4.0\u00B0C',    lo: 4.0, hi: Infinity, color: RED    },
];

/**
 * Generate histogram data for portfolio temperature scores.
 *
 * @param {Array<{temp:number, weight?:number}>} holdings
 *   Each holding must have a `.temp` (implied temperature rise) field.
 * @returns {{ histogram, stats, lineage }}
 */
export function generateTemperatureHistogram(holdings) {
  if (!holdings || holdings.length === 0) {
    return {
      histogram: TEMP_BINS.map(b => ({ bin: b.label, count: 0, weightedPct: 0, color: b.color })),
      stats: { mean: null, median: null, mode: null, p10: null, p90: null, pctBelow2C: 0, pctAbove3C: 0, bimodality: null },
      lineage: { source: 'E-002', note: 'Distribution view per ENH-019 (no data)' },
    };
  }

  const temps = holdings.map(h => h.temp).filter(t => t != null && !isNaN(t));
  const sorted = sortedAsc(temps);
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 1 / holdings.length), 0);

  // Build histogram buckets
  const histogram = TEMP_BINS.map(bin => {
    const inBin = holdings.filter(h => h.temp != null && h.temp >= bin.lo && h.temp < bin.hi);
    const wt = inBin.reduce((s, h) => s + (h.weight || 1 / holdings.length), 0);
    return {
      bin: bin.label,
      count: inBin.length,
      weightedPct: totalWeight > 0 ? Math.round(wt / totalWeight * 1000) / 10 : 0,
      color: bin.color,
    };
  });

  // Compute stats
  const below2 = holdings.filter(h => h.temp != null && h.temp < 2.0);
  const above3 = holdings.filter(h => h.temp != null && h.temp >= 3.0);
  const pctBelow2C = Math.round(below2.length / Math.max(1, temps.length) * 100);
  const pctAbove3C = Math.round(above3.length / Math.max(1, temps.length) * 100);

  return {
    histogram,
    stats: {
      mean: mean(temps) != null ? Math.round(mean(temps) * 100) / 100 : null,
      median: median(temps) != null ? Math.round(median(temps) * 100) / 100 : null,
      mode: mode(temps),
      p10: percentile(sorted, 10),
      p90: percentile(sorted, 90),
      pctBelow2C,
      pctAbove3C,
      bimodality: bimodalityCoefficient(temps),
    },
    lineage: { source: 'E-002', note: 'Distribution view per ENH-019' },
  };
}


// ─────────────────────────────────────────────────────────────────────
// ENH-020 : DQS Confidence Bands
// ─────────────────────────────────────────────────────────────────────

/**
 * DQS-to-uncertainty map (PCAF Data Quality Score 1-5).
 * DQS 1: audited data (tight), DQS 5: spend-based (wide).
 */
const DQS_UNCERTAINTY = { 1: 0.05, 2: 0.15, 3: 0.30, 4: 0.50, 5: 1.00 };

/**
 * Augment financed-emissions records with uncertainty bands.
 *
 * @param {Array<{value:number, dqs:number, ...rest}>} financedEmissions
 * @returns {Array<{...original, lowerBound, upperBound, confidence, bandColor, bandLabel}>}
 */
export function generateDQSConfidenceBands(financedEmissions) {
  if (!financedEmissions || financedEmissions.length === 0) return [];

  return financedEmissions.map(fe => {
    const dqs = Math.max(1, Math.min(5, Math.round(fe.dqs || 5)));
    const uncertainty = DQS_UNCERTAINTY[dqs];
    const lower = fe.value * (1 - uncertainty);
    const upper = fe.value * (1 + uncertainty);

    let bandColor = GREEN;
    let bandLabel = 'High confidence';
    if (dqs === 3) { bandColor = AMBER; bandLabel = 'Moderate confidence'; }
    if (dqs === 4) { bandColor = ORANGE; bandLabel = 'Low confidence'; }
    if (dqs === 5) { bandColor = RED; bandLabel = 'Very low confidence'; }

    return {
      ...fe,
      dqs,
      lowerBound: Math.round(lower * 100) / 100,
      upperBound: Math.round(upper * 100) / 100,
      confidence: uncertainty,
      confidencePct: Math.round(uncertainty * 100),
      bandColor,
      bandLabel,
    };
  });
}

/**
 * Compute portfolio-level weighted DQS and aggregate bands.
 *
 * @param {Array<{value:number, dqs:number, weight?:number}>} records
 * @returns {{ weightedDQS, portfolioLower, portfolioUpper, qualityGrade }}
 */
export function aggregateDQS(records) {
  if (!records || records.length === 0) {
    return { weightedDQS: null, portfolioLower: null, portfolioUpper: null, qualityGrade: 'N/A' };
  }
  const totalWeight = records.reduce((s, r) => s + (r.weight || 1), 0);
  const wDQS = records.reduce((s, r) => s + (r.dqs || 5) * (r.weight || 1), 0) / totalWeight;
  const totalValue = records.reduce((s, r) => s + (r.value || 0), 0);
  const avgUncertainty = DQS_UNCERTAINTY[Math.round(Math.min(5, Math.max(1, wDQS)))];

  let qualityGrade = 'Poor';
  if (wDQS <= 1.5) qualityGrade = 'Excellent';
  else if (wDQS <= 2.5) qualityGrade = 'Good';
  else if (wDQS <= 3.5) qualityGrade = 'Adequate';

  return {
    weightedDQS: Math.round(wDQS * 10) / 10,
    portfolioLower: Math.round(totalValue * (1 - avgUncertainty)),
    portfolioUpper: Math.round(totalValue * (1 + avgUncertainty)),
    qualityGrade,
  };
}


// ─────────────────────────────────────────────────────────────────────
// ENH-022 : Coverage Completeness Indicator
// ─────────────────────────────────────────────────────────────────────

/**
 * Compute data-coverage metrics for a single field across holdings.
 *
 * @param {Array<Object>} holdings – portfolio holdings
 * @param {string} dataField – field name to check (e.g. 'temp', 'emissions', 'esgScore')
 * @returns {{ field, coverage, coveragePct, withData, missing, missingWeight, status, color }}
 */
export function generateCoverageIndicator(holdings, dataField) {
  if (!holdings || holdings.length === 0) {
    return { field: dataField, coverage: 0, coveragePct: 0, withData: 0, missing: 0, missingWeight: 0, status: 'No Data', color: RED };
  }

  const total = holdings.length;
  const withData = holdings.filter(h => h[dataField] != null && h[dataField] !== '' && h[dataField] !== 0).length;
  const missingHoldings = holdings.filter(h => h[dataField] == null || h[dataField] === '' || h[dataField] === 0);
  const missingWeight = missingHoldings.reduce((s, h) => s + (h.weight || 0), 0);
  const ratio = withData / total;

  let status = 'Poor';
  let color = RED;
  if (ratio > 0.9) { status = 'Good'; color = GREEN; }
  else if (ratio > 0.7) { status = 'Adequate'; color = AMBER; }

  return {
    field: dataField,
    coverage: Math.round(ratio * 1000) / 1000,
    coveragePct: Math.round(ratio * 100),
    withData,
    missing: total - withData,
    missingWeight: Math.round(missingWeight * 10000) / 10000,
    status,
    color,
  };
}

/**
 * Generate coverage indicators for multiple fields at once.
 *
 * @param {Array<Object>} holdings
 * @param {string[]} fields – e.g. ['temp', 'emissions', 'esgScore', 'scope1', 'scope2']
 * @returns {Array} array of coverage indicator objects
 */
export function generateMultiFieldCoverage(holdings, fields) {
  return fields.map(f => generateCoverageIndicator(holdings, f));
}

/**
 * Compute an overall portfolio data-quality summary from multi-field coverage.
 *
 * @param {Array} coverageResults – output of generateMultiFieldCoverage
 * @returns {{ overallPct, overallStatus, overallColor, fieldBreakdown }}
 */
export function summariseCoverage(coverageResults) {
  if (!coverageResults || coverageResults.length === 0) {
    return { overallPct: 0, overallStatus: 'No Data', overallColor: RED, fieldBreakdown: [] };
  }
  const avg = coverageResults.reduce((s, c) => s + c.coveragePct, 0) / coverageResults.length;
  let overallStatus = 'Poor';
  let overallColor = RED;
  if (avg > 90) { overallStatus = 'Good'; overallColor = GREEN; }
  else if (avg > 70) { overallStatus = 'Adequate'; overallColor = AMBER; }

  return {
    overallPct: Math.round(avg),
    overallStatus,
    overallColor,
    fieldBreakdown: coverageResults,
  };
}


// ─────────────────────────────────────────────────────────────────────
// ENH-021 : WACI Label Formatter (display helper)
// ─────────────────────────────────────────────────────────────────────

/**
 * Format a WACI value with its correct TCFD-aligned unit label.
 * TCFD specifies revenue denominator, not EVIC.
 *
 * @param {number} waci – weighted average carbon intensity
 * @param {string} [methodology='TCFD'] – labelling context
 * @returns {{ value, unit, methodology, note }}
 */
export function formatWACILabel(waci, methodology = 'TCFD') {
  if (waci == null || isNaN(waci)) {
    return { value: 'N/A', unit: 'tCO2e / $M Revenue', methodology, note: 'No data available' };
  }
  return {
    value: waci.toFixed(1),
    unit: 'tCO2e / $M Revenue',
    methodology,
    note: 'TCFD-aligned (revenue denominator)',
  };
}

/**
 * Format a financed-emissions intensity value with EVIC denominator.
 * Some frameworks use EVIC (enterprise value including cash) instead of revenue.
 *
 * @param {number} intensity
 * @returns {{ value, unit, note }}
 */
export function formatEVICIntensityLabel(intensity) {
  if (intensity == null || isNaN(intensity)) {
    return { value: 'N/A', unit: 'tCO2e / $M EVIC', note: 'No data available' };
  }
  return {
    value: intensity.toFixed(1),
    unit: 'tCO2e / $M EVIC',
    note: 'PCAF-aligned (EVIC denominator)',
  };
}
