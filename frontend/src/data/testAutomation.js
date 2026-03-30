/**
 * testAutomation.js
 * ─────────────────────────────────────────────────────────────────────
 * ENH-032  Automated Regression Test Suite (EVR Shadow Validators)
 * ENH-033  MTM Traceability Execution & Verification
 * ─────────────────────────────────────────────────────────────────────
 * Runs the 20 shadow-model test cases extracted from
 * engineValidationRecords and verifies regulatory traceability.
 */

// ── Deterministic seeded random (for reproducible test data) ────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };


// =====================================================================
// Shadow Model Functions (extracted from EVR engine validators)
// =====================================================================

/**
 * PCAF Financed Emissions — attribution factor method.
 * E-001: FE = min(1, outstanding / EVIC) * (Scope1 + Scope2)
 */
function shadowPCAF(outstanding, evic, scope1, scope2) {
  if (evic == null || evic === 0) {
    return { fe: outstanding * (scope1 + scope2), warning: 'NULL_EVIC' };
  }
  const attr = Math.min(1.0, outstanding / evic);
  return { fe: attr * (scope1 + scope2), attr, warning: null };
}

/**
 * Multi-provider ESG consensus score — simple average of non-null.
 * E-003
 */
function shadowConsensus(scores) {
  const valid = scores.filter(s => s != null && !isNaN(s));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/**
 * WACI — Weighted Average Carbon Intensity.
 * E-002: sum( weight_i * emissions_i / revenue_i )
 */
function shadowWACI(holdings) {
  if (!holdings || holdings.length === 0) return 0;
  return holdings.reduce((s, h) => {
    if (!h.revenue || h.revenue === 0) return s;
    return s + h.weight * h.emissions / h.revenue;
  }, 0);
}

/**
 * Portfolio Temperature Score — weighted average.
 * E-002 temperature pathway.
 */
function shadowTemperature(holdings) {
  if (!holdings || holdings.length === 0) return 0;
  return holdings.reduce((s, h) => s + h.weight * h.temp, 0);
}

/**
 * Avoided Emissions calculation.
 * E-005: (baseline_EF - product_EF) * units * (attribution/100) * (1 - rebound/100)
 */
function shadowAvoided(units, baselineEF, productEF, attribution, rebound) {
  return (baselineEF - productEF) * units * (attribution / 100) * (1 - rebound / 100);
}

/**
 * Data Quality Score weighted average.
 * E-001 DQS path.
 */
function shadowWeightedDQS(records) {
  if (!records || records.length === 0) return null;
  const totalWt = records.reduce((s, r) => s + (r.weight || 1), 0);
  return records.reduce((s, r) => s + (r.dqs || 5) * (r.weight || 1), 0) / totalWt;
}

/**
 * Scope 3 upstream estimate — spend-based.
 * E-004
 */
function shadowScope3Spend(spend, emissionFactor) {
  return spend * emissionFactor;
}

/**
 * Green Asset Ratio — proportion of taxonomy-aligned assets.
 * E-010
 */
function shadowGreenAssetRatio(alignedAssets, totalAssets) {
  if (!totalAssets || totalAssets === 0) return 0;
  return alignedAssets / totalAssets;
}

/**
 * Carbon footprint — absolute financed emissions per $M invested.
 * E-001 variant.
 */
function shadowCarbonFootprint(totalFE, portfolioValue) {
  if (!portfolioValue || portfolioValue === 0) return 0;
  return totalFE / (portfolioValue / 1e6);
}

/**
 * SBTi target gap — difference between current trajectory and target.
 * E-007
 */
function shadowSBTiGap(currentIntensity, targetIntensity) {
  return currentIntensity - targetIntensity;
}


// =====================================================================
// ENH-032: Regression Test Cases (20 from EVR)
// =====================================================================

export const REGRESSION_TEST_CASES = [
  // ── E-001 PCAF Financed Emissions ──
  {
    id: 'TC-001', engine: 'E-001', name: 'PCAF normal attribution',
    fn: () => shadowPCAF(100000, 500000, 1200, 300),
    expected: 300, tolerance: 0.001,
  },
  {
    id: 'TC-002', engine: 'E-001', name: 'PCAF null EVIC fallback',
    fn: () => shadowPCAF(100000, null, 1200, 300),
    expected: null, checkWarning: 'NULL_EVIC',
  },
  {
    id: 'TC-003', engine: 'E-001', name: 'PCAF zero EVIC fallback',
    fn: () => shadowPCAF(50000, 0, 800, 200),
    expected: null, checkWarning: 'NULL_EVIC',
  },
  {
    id: 'TC-004', engine: 'E-001', name: 'PCAF capped attribution (outstanding > EVIC)',
    fn: () => shadowPCAF(600000, 500000, 1000, 0),
    expected: 1000, tolerance: 0.001,
  },

  // ── E-002 WACI ──
  {
    id: 'TC-005', engine: 'E-002', name: 'WACI two-holding portfolio',
    fn: () => shadowWACI([
      { weight: 0.6, emissions: 500, revenue: 100 },
      { weight: 0.4, emissions: 200, revenue: 50 },
    ]),
    expected: 4.6, tolerance: 0.001,
  },
  {
    id: 'TC-006', engine: 'E-002', name: 'WACI zero-revenue holding skipped',
    fn: () => shadowWACI([
      { weight: 0.5, emissions: 500, revenue: 100 },
      { weight: 0.5, emissions: 300, revenue: 0 },
    ]),
    expected: 2.5, tolerance: 0.001,
  },

  // ── E-002 Temperature ──
  {
    id: 'TC-007', engine: 'E-002', name: 'Temperature weighted average',
    fn: () => shadowTemperature([
      { weight: 0.5, temp: 1.8 },
      { weight: 0.3, temp: 2.5 },
      { weight: 0.2, temp: 3.2 },
    ]),
    expected: 2.29, tolerance: 0.01,
  },
  {
    id: 'TC-008', engine: 'E-002', name: 'Temperature single holding',
    fn: () => shadowTemperature([{ weight: 1.0, temp: 2.7 }]),
    expected: 2.7, tolerance: 0.001,
  },

  // ── E-003 ESG Consensus ──
  {
    id: 'TC-009', engine: 'E-003', name: 'Consensus 3 providers',
    fn: () => shadowConsensus([72, 68, 75]),
    expected: 71.6667, tolerance: 0.01,
  },
  {
    id: 'TC-010', engine: 'E-003', name: 'Consensus with nulls',
    fn: () => shadowConsensus([80, null, 60, null]),
    expected: 70, tolerance: 0.001,
  },
  {
    id: 'TC-011', engine: 'E-003', name: 'Consensus all null',
    fn: () => shadowConsensus([null, null, null]),
    expected: null, checkNull: true,
  },

  // ── E-004 Scope 3 ──
  {
    id: 'TC-012', engine: 'E-004', name: 'Scope 3 spend-based estimate',
    fn: () => shadowScope3Spend(5000000, 0.0004),
    expected: 2000, tolerance: 0.001,
  },

  // ── E-005 Avoided Emissions ──
  {
    id: 'TC-013', engine: 'E-005', name: 'Avoided emissions standard',
    fn: () => shadowAvoided(10000, 0.5, 0.1, 100, 10),
    expected: 3600, tolerance: 0.001,
  },
  {
    id: 'TC-014', engine: 'E-005', name: 'Avoided emissions partial attribution',
    fn: () => shadowAvoided(10000, 0.5, 0.1, 50, 0),
    expected: 2000, tolerance: 0.001,
  },

  // ── E-001 DQS ──
  {
    id: 'TC-015', engine: 'E-001', name: 'Weighted DQS calculation',
    fn: () => shadowWeightedDQS([
      { dqs: 1, weight: 0.5 },
      { dqs: 3, weight: 0.3 },
      { dqs: 5, weight: 0.2 },
    ]),
    expected: 2.4, tolerance: 0.001,
  },
  {
    id: 'TC-016', engine: 'E-001', name: 'DQS all high quality',
    fn: () => shadowWeightedDQS([
      { dqs: 1, weight: 0.6 },
      { dqs: 2, weight: 0.4 },
    ]),
    expected: 1.4, tolerance: 0.001,
  },

  // ── E-010 Green Asset Ratio ──
  {
    id: 'TC-017', engine: 'E-010', name: 'GAR standard',
    fn: () => shadowGreenAssetRatio(350000000, 1000000000),
    expected: 0.35, tolerance: 0.001,
  },
  {
    id: 'TC-018', engine: 'E-010', name: 'GAR zero total',
    fn: () => shadowGreenAssetRatio(100, 0),
    expected: 0, tolerance: 0.001,
  },

  // ── E-001 Carbon Footprint ──
  {
    id: 'TC-019', engine: 'E-001', name: 'Carbon footprint per $M',
    fn: () => shadowCarbonFootprint(50000, 200000000),
    expected: 250, tolerance: 0.01,
  },

  // ── E-007 SBTi Gap ──
  {
    id: 'TC-020', engine: 'E-007', name: 'SBTi target gap',
    fn: () => shadowSBTiGap(120, 85),
    expected: 35, tolerance: 0.001,
  },
];


// =====================================================================
// Test Runner
// =====================================================================

/**
 * Run all 20 regression test cases and return detailed results.
 * @returns {Array<{ id, engine, name, actual, expected, pass, delta, runAt }>}
 */
export function runRegressionSuite() {
  const runAt = new Date().toISOString();

  return REGRESSION_TEST_CASES.map(tc => {
    try {
      const result = tc.fn();

      // Null-expected tests (e.g. all-null consensus)
      if (tc.checkNull) {
        return {
          ...tc, fn: undefined, actual: result,
          pass: result === null,
          delta: null, runAt,
        };
      }

      // Warning-check tests (e.g. PCAF null EVIC)
      if (tc.checkWarning) {
        const hasWarning = result && result.warning === tc.checkWarning;
        return {
          ...tc, fn: undefined,
          actual: result ? result.warning : null,
          pass: hasWarning,
          delta: null, runAt,
        };
      }

      // Normal numeric comparison
      const actual = typeof result === 'object' ? result.fe : result;
      const delta = tc.expected != null ? Math.abs(actual - tc.expected) : null;
      const pass = delta != null
        ? delta <= tc.tolerance * Math.abs(tc.expected)
        : false;

      return {
        ...tc, fn: undefined, actual,
        pass, delta: delta != null ? Math.round(delta * 1e6) / 1e6 : null,
        runAt,
      };
    } catch (err) {
      return {
        ...tc, fn: undefined, actual: null,
        pass: false, delta: null, error: err.message,
        runAt,
      };
    }
  });
}


// =====================================================================
// ENH-033: MTM Traceability Automation
// =====================================================================

/**
 * Default regulatory traceability matrix.
 * Maps regulatory requirements to the test cases that verify them.
 */
export const DEFAULT_TRACEABILITY_MATRIX = [
  { reqId: 'PCAF-1', description: 'Financed emissions calculation per PCAF standard', linkedTestCases: ['TC-001', 'TC-002', 'TC-003', 'TC-004'], coverage: 'full' },
  { reqId: 'PCAF-2', description: 'Data quality score weighting per PCAF', linkedTestCases: ['TC-015', 'TC-016'], coverage: 'full' },
  { reqId: 'TCFD-1', description: 'WACI calculation with revenue denominator', linkedTestCases: ['TC-005', 'TC-006'], coverage: 'full' },
  { reqId: 'TCFD-2', description: 'Portfolio temperature alignment score', linkedTestCases: ['TC-007', 'TC-008'], coverage: 'full' },
  { reqId: 'TCFD-3', description: 'Carbon footprint per $M invested', linkedTestCases: ['TC-019'], coverage: 'full' },
  { reqId: 'GHG-1', description: 'Scope 3 upstream estimation (spend-based)', linkedTestCases: ['TC-012'], coverage: 'partial' },
  { reqId: 'SBTi-1', description: 'Science-based target gap analysis', linkedTestCases: ['TC-020'], coverage: 'full' },
  { reqId: 'EU-TAX-1', description: 'Green Asset Ratio per EU Taxonomy', linkedTestCases: ['TC-017', 'TC-018'], coverage: 'full' },
  { reqId: 'ESG-CON-1', description: 'Multi-provider ESG consensus scoring', linkedTestCases: ['TC-009', 'TC-010', 'TC-011'], coverage: 'full' },
  { reqId: 'AE-1', description: 'Avoided emissions with attribution & rebound', linkedTestCases: ['TC-013', 'TC-014'], coverage: 'full' },
];

/**
 * Verify that each regulatory requirement has all linked tests passing.
 *
 * @param {Array<{reqId, description, linkedTestCases, coverage}>} matrix
 * @param {Array<{id, pass}>} testResults – output from runRegressionSuite()
 * @returns {Array<{ reqId, description, linkedTests, testsRun, testsPassing, testsFailing, allPassing, coverage }>}
 */
export function runTraceabilityCheck(matrix, testResults) {
  if (!matrix || !testResults) return [];

  return matrix.map(req => {
    const linked = req.linkedTestCases || [];
    const matched = linked.map(tcId => {
      const result = testResults.find(r => r.id === tcId);
      return { tcId, found: !!result, pass: result ? result.pass : false };
    });

    const testsRun = matched.filter(m => m.found).length;
    const testsPassing = matched.filter(m => m.found && m.pass).length;
    const testsFailing = matched.filter(m => m.found && !m.pass).length;
    const testsMissing = matched.filter(m => !m.found).length;

    return {
      reqId: req.reqId,
      description: req.description,
      linkedTests: linked.length,
      testsRun,
      testsPassing,
      testsFailing,
      testsMissing,
      allPassing: testsRun === linked.length && testsFailing === 0 && testsMissing === 0,
      coverage: req.coverage,
      details: matched,
    };
  });
}


// =====================================================================
// Summary Report Generator
// =====================================================================

/**
 * Generate a combined test report from regression + traceability results.
 *
 * @param {Array} regressionResults – from runRegressionSuite()
 * @param {Array} traceabilityResults – from runTraceabilityCheck()
 * @returns {{ timestamp, regression, traceability, verdict }}
 */
export function generateTestReport(regressionResults, traceabilityResults) {
  const regTotal = regressionResults ? regressionResults.length : 0;
  const regPass = regressionResults ? regressionResults.filter(r => r.pass).length : 0;
  const regFail = regTotal - regPass;
  const regRate = regTotal > 0 ? Math.round(regPass / regTotal * 100) : 0;

  const traceTotal = traceabilityResults ? traceabilityResults.length : 0;
  const traceCovered = traceabilityResults ? traceabilityResults.filter(r => r.allPassing).length : 0;
  const traceGaps = traceTotal - traceCovered;
  const traceRate = traceTotal > 0 ? Math.round(traceCovered / traceTotal * 100) : 0;

  // Overall verdict
  let verdict = 'PASS';
  if (regFail > 0 || traceGaps > 0) verdict = 'FAIL';
  if (regRate >= 90 && traceRate >= 80 && verdict === 'FAIL') verdict = 'WARN';

  return {
    timestamp: new Date().toISOString(),
    regression: {
      total: regTotal,
      pass: regPass,
      fail: regFail,
      passRate: regRate,
      failedTests: regressionResults ? regressionResults.filter(r => !r.pass).map(r => r.id) : [],
    },
    traceability: {
      total: traceTotal,
      covered: traceCovered,
      gaps: traceGaps,
      coverageRate: traceRate,
      gappedReqs: traceabilityResults ? traceabilityResults.filter(r => !r.allPassing).map(r => r.reqId) : [],
    },
    verdict,
  };
}


// =====================================================================
// Convenience: Run everything in one call
// =====================================================================

/**
 * Execute the full test automation pipeline:
 *   1. Run 20 regression tests
 *   2. Run traceability check against default matrix
 *   3. Generate summary report
 *
 * @returns {{ regressionResults, traceabilityResults, report }}
 */
export function runFullTestSuite() {
  const regressionResults = runRegressionSuite();
  const traceabilityResults = runTraceabilityCheck(DEFAULT_TRACEABILITY_MATRIX, regressionResults);
  const report = generateTestReport(regressionResults, traceabilityResults);

  return { regressionResults, traceabilityResults, report };
}
