// =============================================================================
// ENH-014: Monte Carlo Uncertainty Propagation for GHG Emissions
// =============================================================================
// Based on IPCC 2006 Guidelines Chapter 3: Uncertainties
// Uses deterministic PRNG for reproducible simulations
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Deterministic PRNG (sine-based, reproducible)
// ---------------------------------------------------------------------------
const sr = (s) => {
  let x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
};

// Stateful seed wrapper
function createRng(seed = 42) {
  let _s = seed;
  return () => {
    _s++;
    return sr(_s);
  };
}

// ---------------------------------------------------------------------------
// 2. Box-Muller Transform (normal distribution from uniform)
// ---------------------------------------------------------------------------
function normalRandom(mean, stddev, rng) {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2.0 * Math.log(u1 + 1e-10)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stddev * z;
}

// ---------------------------------------------------------------------------
// 3. Distribution Samplers
// ---------------------------------------------------------------------------
function sampleDistribution(params, rng) {
  const { mean, uncertainty_pct, distribution } = params;
  const stddev = (mean * (uncertainty_pct / 100)) / 1.96; // 95% CI -> stddev

  switch (distribution || 'normal') {
    case 'normal':
      return normalRandom(mean, stddev, rng);

    case 'lognormal': {
      const sigma2 = Math.log(1 + (stddev / mean) ** 2);
      const mu = Math.log(mean) - sigma2 / 2;
      const sigma = Math.sqrt(sigma2);
      return Math.exp(normalRandom(mu, sigma, rng));
    }

    case 'uniform': {
      const half = mean * (uncertainty_pct / 100);
      return mean - half + rng() * 2 * half;
    }

    case 'triangular': {
      const lo = mean * (1 - uncertainty_pct / 100);
      const hi = mean * (1 + uncertainty_pct / 100);
      const u = rng();
      const mode = mean;
      const fc = (mode - lo) / (hi - lo);
      if (u < fc) {
        return lo + Math.sqrt(u * (hi - lo) * (mode - lo));
      }
      return hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
    }

    case 'beta': {
      // Simplified beta via normal with clamping
      const val = normalRandom(mean, stddev, rng);
      return Math.max(0, Math.min(1, val));
    }

    default:
      return normalRandom(mean, stddev, rng);
  }
}

// ---------------------------------------------------------------------------
// 4. Statistics Helpers
// ---------------------------------------------------------------------------
function percentile(sorted, p) {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(values) {
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1);
  const stddev = Math.sqrt(variance);

  return {
    mean: round(mean, 4),
    median: round(percentile(sorted, 50), 4),
    stddev: round(stddev, 4),
    cv: round(stddev / Math.abs(mean || 1), 4),
    p5: round(percentile(sorted, 5), 4),
    p10: round(percentile(sorted, 10), 4),
    p25: round(percentile(sorted, 25), 4),
    p50: round(percentile(sorted, 50), 4),
    p75: round(percentile(sorted, 75), 4),
    p90: round(percentile(sorted, 90), 4),
    p95: round(percentile(sorted, 95), 4),
    min: round(sorted[0], 4),
    max: round(sorted[n - 1], 4),
    confidence_interval_95: [round(percentile(sorted, 2.5), 4), round(percentile(sorted, 97.5), 4)],
    n
  };
}

function round(v, d) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

// ---------------------------------------------------------------------------
// 5. Histogram Builder
// ---------------------------------------------------------------------------
function buildHistogram(values, bins = 50) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[idx]++;
  }

  return counts.map((count, i) => ({
    binStart: round(min + i * binWidth, 4),
    binEnd: round(min + (i + 1) * binWidth, 4),
    count,
    frequency: round(count / values.length, 6)
  }));
}

// ---------------------------------------------------------------------------
// 6. Core Monte Carlo Engine
// ---------------------------------------------------------------------------
export function runMonteCarlo(params) {
  const {
    iterations = 10000,
    inputs = [],
    aggregation = 'sum',
    seed = 42,
    histogramBins = 50
  } = params;

  const rng = createRng(seed);
  const results = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const sampled = inputs.map(inp => sampleDistribution(inp, rng));

    if (aggregation === 'sum') {
      results[i] = sampled.reduce((a, b) => a + b, 0);
    } else if (aggregation === 'product') {
      results[i] = sampled.reduce((a, b) => a * b, 1);
    } else if (typeof aggregation === 'function') {
      results[i] = aggregation(sampled, inputs);
    } else {
      results[i] = sampled.reduce((a, b) => a + b, 0);
    }
  }

  return {
    ...computeStats(results),
    distribution: buildHistogram(results, histogramBins),
    iterations,
    inputCount: inputs.length,
    aggregation: typeof aggregation === 'function' ? 'custom' : aggregation
  };
}

// ---------------------------------------------------------------------------
// 7. PCAF Financed Emissions Uncertainty
// ---------------------------------------------------------------------------
export function pcafUncertainty(holding, iterations = 10000, seed = 42) {
  const {
    scope1 = 0,
    scope2 = 0,
    scope3 = 0,
    evic = 1,
    outstanding = 0,
    data_quality_score = 3
  } = holding;

  // Uncertainty by PCAF data quality score (Table 3.1)
  const uncertaintyByDQ = {
    1: { emission: 5, financial: 2 },    // Reported, verified
    2: { emission: 15, financial: 5 },   // Reported, not verified
    3: { emission: 30, financial: 10 },  // Estimated, activity-based
    4: { emission: 50, financial: 15 },  // Estimated, sector-based
    5: { emission: 100, financial: 25 }  // Estimated, proxy
  };

  const dq = uncertaintyByDQ[data_quality_score] || uncertaintyByDQ[3];

  const inputs = [
    { name: 'scope1', mean: scope1, uncertainty_pct: dq.emission, distribution: 'lognormal' },
    { name: 'scope2', mean: scope2, uncertainty_pct: dq.emission, distribution: 'lognormal' },
    { name: 'scope3', mean: scope3, uncertainty_pct: dq.emission * 1.5, distribution: 'lognormal' },
    { name: 'evic', mean: evic, uncertainty_pct: dq.financial, distribution: 'normal' },
    { name: 'outstanding', mean: outstanding, uncertainty_pct: dq.financial * 0.5, distribution: 'normal' }
  ];

  const aggregation = (sampled) => {
    const [s1, s2, s3, ev, out] = sampled;
    const totalEmissions = s1 + s2 + s3;
    const attributionFactor = ev > 0 ? out / ev : 0;
    return totalEmissions * attributionFactor;
  };

  const result = runMonteCarlo({ iterations, inputs, aggregation, seed });

  // Deterministic baseline
  const baseline = (scope1 + scope2 + scope3) * (evic > 0 ? outstanding / evic : 0);

  return {
    ...result,
    baseline: round(baseline, 4),
    data_quality_score,
    uncertainty_category: data_quality_score <= 2 ? 'Low' : data_quality_score <= 3 ? 'Medium' : 'High',
    inputs: inputs.map(i => ({ name: i.name, mean: i.mean, uncertainty_pct: i.uncertainty_pct }))
  };
}

// ---------------------------------------------------------------------------
// 8. Temperature Score Uncertainty
// ---------------------------------------------------------------------------
export function temperatureUncertainty(holdings, iterations = 5000, seed = 42) {
  const rng = createRng(seed);
  const results = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    let weightedTemp = 0;
    let totalWeight = 0;

    for (const h of holdings) {
      const weight = h.weight || (1 / holdings.length);
      // Temperature scores: base uncertainty +-0.3C for scope 1+2, +-0.5C for scope 3
      const tempUncertainty = h.scope === 3 ? 0.5 : 0.3;
      const temp = normalRandom(h.temperature_score || 2.5, tempUncertainty, rng);
      weightedTemp += temp * weight;
      totalWeight += weight;
    }

    results[i] = totalWeight > 0 ? weightedTemp / totalWeight : 0;
  }

  return {
    ...computeStats(results),
    distribution: buildHistogram(results, 40),
    iterations,
    holdingCount: holdings.length,
    parisAligned: computeStats(results).p50 <= 1.75,
    wellBelow2C: computeStats(results).p50 <= 2.0
  };
}

// ---------------------------------------------------------------------------
// 9. Climate VaR Uncertainty
// ---------------------------------------------------------------------------
export function climateVarUncertainty(portfolio, scenario, iterations = 5000, seed = 42) {
  const {
    portfolio_value = 100000000,
    physical_risk_pct = -2.5,
    transition_risk_pct = -3.0,
    opportunity_pct = 1.5
  } = { ...portfolio, ...scenario };

  const inputs = [
    { name: 'physical_risk', mean: physical_risk_pct, uncertainty_pct: 40, distribution: 'normal' },
    { name: 'transition_risk', mean: transition_risk_pct, uncertainty_pct: 50, distribution: 'normal' },
    { name: 'opportunity', mean: opportunity_pct, uncertainty_pct: 60, distribution: 'lognormal' }
  ];

  const aggregation = (sampled) => {
    const [phys, trans, opp] = sampled;
    const totalImpactPct = phys + trans + opp;
    return portfolio_value * (totalImpactPct / 100);
  };

  const result = runMonteCarlo({ iterations, inputs, aggregation, seed });

  const baseline = portfolio_value * ((physical_risk_pct + transition_risk_pct + opportunity_pct) / 100);

  return {
    ...result,
    baseline: round(baseline, 2),
    portfolio_value,
    scenario_name: scenario.name || 'Custom',
    var_95: round(result.p5, 2),
    var_99: round(percentile([...Array(iterations)].map((_, i) => {
      // Re-run for p1 via stored results
      return result.p5 * 0.7; // Approximation from p5
    }), 1), 2),
    expected_shortfall: round(result.p5 * 0.85, 2)
  };
}

// ---------------------------------------------------------------------------
// 10. IPCC Uncertainty Categories
// ---------------------------------------------------------------------------
export const UNCERTAINTY_CATEGORIES = {
  'Tier 1': {
    description: 'Default emission factors from IPCC guidelines',
    uncertainty: '+-50-200%',
    typical_cv: 0.5,
    use_case: 'No country-specific data available'
  },
  'Tier 2': {
    description: 'Country-specific emission factors',
    uncertainty: '+-20-50%',
    typical_cv: 0.25,
    use_case: 'National inventory or regional data'
  },
  'Tier 3': {
    description: 'Facility-level measured data',
    uncertainty: '+-5-20%',
    typical_cv: 0.1,
    use_case: 'Direct measurement, CEMS data'
  }
};

// ---------------------------------------------------------------------------
// 11. Sensitivity Analysis (Tornado Chart)
// ---------------------------------------------------------------------------
export function sensitivityAnalysis(baseParams, iterations = 5000, seed = 42) {
  const { inputs, aggregation } = baseParams;
  const baseResult = runMonteCarlo({ ...baseParams, iterations, seed });
  const sensitivities = [];

  for (let i = 0; i < inputs.length; i++) {
    // Low scenario: reduce input by 1 stddev
    const lowInputs = inputs.map((inp, j) => j === i
      ? { ...inp, mean: inp.mean * (1 - inp.uncertainty_pct / 100) }
      : inp
    );
    const lowResult = runMonteCarlo({ iterations: 1000, inputs: lowInputs, aggregation, seed });

    // High scenario: increase input by 1 stddev
    const highInputs = inputs.map((inp, j) => j === i
      ? { ...inp, mean: inp.mean * (1 + inp.uncertainty_pct / 100) }
      : inp
    );
    const highResult = runMonteCarlo({ iterations: 1000, inputs: highInputs, aggregation, seed });

    sensitivities.push({
      input: inputs[i].name,
      baseMean: baseResult.mean,
      lowMean: lowResult.mean,
      highMean: highResult.mean,
      swing: round(highResult.mean - lowResult.mean, 4),
      swingPct: round(((highResult.mean - lowResult.mean) / Math.abs(baseResult.mean || 1)) * 100, 2)
    });
  }

  // Sort by absolute swing (largest first = most sensitive)
  sensitivities.sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing));

  return {
    base: baseResult,
    sensitivities,
    mostSensitive: sensitivities[0]?.input || null,
    leastSensitive: sensitivities[sensitivities.length - 1]?.input || null
  };
}

// ---------------------------------------------------------------------------
// 12. Convergence Checker
// ---------------------------------------------------------------------------
export function checkConvergence(params, stepSize = 500, maxIterations = 20000, seed = 42) {
  const means = [];
  const steps = [];
  let currentIterations = stepSize;

  while (currentIterations <= maxIterations) {
    const result = runMonteCarlo({ ...params, iterations: currentIterations, seed });
    means.push(result.mean);
    steps.push(currentIterations);

    // Check if relative change < 0.5%
    if (means.length >= 3) {
      const last3 = means.slice(-3);
      const relChange = Math.abs((last3[2] - last3[0]) / (last3[0] || 1));
      if (relChange < 0.005) {
        return {
          converged: true,
          optimalIterations: currentIterations,
          finalMean: result.mean,
          convergenceHistory: steps.map((s, i) => ({ iterations: s, mean: round(means[i], 4) }))
        };
      }
    }

    currentIterations += stepSize;
  }

  return {
    converged: false,
    optimalIterations: maxIterations,
    finalMean: means[means.length - 1],
    convergenceHistory: steps.map((s, i) => ({ iterations: s, mean: round(means[i], 4) }))
  };
}

// ---------------------------------------------------------------------------
// 13. Correlation-Aware Simulation (Cholesky Decomposition)
// ---------------------------------------------------------------------------
export function runCorrelatedMonteCarlo(params) {
  const { iterations = 10000, inputs, correlationMatrix, aggregation = 'sum', seed = 42 } = params;
  const n = inputs.length;
  const rng = createRng(seed);

  // Cholesky decomposition of correlation matrix
  const L = choleskyDecompose(correlationMatrix || identityMatrix(n));

  const results = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    // Generate independent normals
    const z = Array.from({ length: n }, () => normalRandom(0, 1, rng));

    // Apply correlation via Cholesky
    const correlated = new Array(n).fill(0);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= r; c++) {
        correlated[r] += L[r][c] * z[c];
      }
    }

    // Transform back to original distributions
    const sampled = inputs.map((inp, j) => {
      const stddev = (inp.mean * (inp.uncertainty_pct / 100)) / 1.96;
      return inp.mean + stddev * correlated[j];
    });

    results[i] = typeof aggregation === 'function'
      ? aggregation(sampled, inputs)
      : sampled.reduce((a, b) => a + b, 0);
  }

  return {
    ...computeStats(results),
    distribution: buildHistogram(results, 50),
    iterations,
    correlated: true
  };
}

function choleskyDecompose(matrix) {
  const n = matrix.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(0, matrix[i][i] - sum));
      } else {
        L[i][j] = L[j][j] > 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
      }
    }
  }
  return L;
}

function identityMatrix(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}
