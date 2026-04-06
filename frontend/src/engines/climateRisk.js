/**
 * engines/climateRisk.js — Climate Risk Calculation Engine
 *
 * Pure functions only — no React, no Math.random().
 * Uses Box-Muller with seeded PRNG for reproducible Monte Carlo.
 *
 * Consumed by:
 *   ClimateVarEngine             → calcCVaR(), monteCarloClimate()
 *   ClimateStressTestSuitePage   → applyStressShock()
 *   MonteCarloClimatePage        → boxMuller(), seededPRNG()
 *   TransitionRiskDcfPage        → ngfsCarbonPrice()
 *   StrandedAssetAnalyzerPage    → hazardRatePD()
 *   MaritimeImoCompliancePage    → calcCII()
 *   AviationCorsiaPage           → calcCORSIA()
 */

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────

/**
 * Mulberry32 seeded PRNG — fast, high-quality, reproducible.
 * Returns a function that generates U(0,1) values.
 *
 * @param {number} seed — Integer seed
 * @returns {() => number}
 */
export function seededPRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform — returns [z0, z1] standard normal pair.
 * Must use a seeded random source, never Math.random().
 *
 * @param {() => number} rng — Seeded PRNG function
 * @returns {[number, number]}
 */
export function boxMuller(rng) {
  const u1 = Math.max(rng(), 1e-10); // avoid log(0)
  const u2 = rng();
  const mag = Math.sqrt(-2 * Math.log(u1));
  const z0  = mag * Math.cos(2 * Math.PI * u2);
  const z1  = mag * Math.sin(2 * Math.PI * u2);
  return [z0, z1];
}

// ── NGFS Carbon Price Trajectories (Phase 4, 2023) ──────────────────────────

/**
 * NGFS Phase 4 carbon price by scenario and year.
 * Source: NGFS Climate Scenarios Phase 4 (Sept 2023), Table A.1
 * Units: USD/tCO2e (2022 real)
 *
 * Scenarios:
 *   NZ2050  — Net Zero 2050 (1.5°C)
 *   BelowAc — Below 2°C
 *   NatAmbI — Nationally Determined Contributions (NDCs only)
 *   CurrPol — Current Policies (3°C+)
 *   DP      — Delayed Policy (overshoot then correct)
 */
export const NGFS_CARBON_PRICES = {
  NZ2050:  { 2025: 48,  2030: 147, 2035: 285, 2040: 470, 2045: 680, 2050: 860 },
  BelowAc: { 2025: 35,  2030: 100, 2035: 190, 2040: 305, 2045: 440, 2050: 580 },
  NatAmbI: { 2025: 18,  2030: 42,  2035: 72,  2040: 108, 2045: 148, 2050: 195 },
  CurrPol: { 2025: 12,  2030: 18,  2035: 24,  2040: 30,  2045: 36,  2050: 42  },
  DP:      { 2025: 10,  2030: 15,  2035: 28,  2040: 120, 2045: 310, 2050: 550 },
};

/**
 * Interpolate NGFS carbon price at an arbitrary year.
 *
 * @param {string} scenario — 'NZ2050' | 'BelowAc' | 'NatAmbI' | 'CurrPol' | 'DP'
 * @param {number} year     — Year (2025–2050)
 * @returns {number}        — USD/tCO2e
 */
export function ngfsCarbonPrice(scenario, year) {
  const table = NGFS_CARBON_PRICES[scenario] ?? NGFS_CARBON_PRICES.NZ2050;
  const keys  = Object.keys(table).map(Number).sort((a, b) => a - b);

  if (year <= keys[0]) return table[keys[0]];
  if (year >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

  for (let i = 0; i < keys.length - 1; i++) {
    if (year >= keys[i] && year <= keys[i + 1]) {
      const t  = (year - keys[i]) / (keys[i + 1] - keys[i]);
      return table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]);
    }
  }
  return table[keys[0]];
}

// ── CVaR / VaR ───────────────────────────────────────────────────────────────

/**
 * Historical Simulation CVaR at confidence level α.
 * CVaR = mean of losses exceeding VaR.
 *
 * @param {number[]} returns   — Array of portfolio return observations
 * @param {number}   alpha     — Confidence level (e.g. 0.95)
 * @returns {{ var, cvar }}    — Both as positive loss magnitudes
 */
export function historicalCVaR(returns, alpha = 0.95) {
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - alpha) * sorted.length);
  const tail   = sorted.slice(0, cutoff);

  const varVal  = -sorted[cutoff] ?? 0;
  const cvarVal = tail.length > 0 ? -tail.reduce((s, v) => s + v, 0) / tail.length : varVal;

  return { var: +varVal.toFixed(4), cvar: +cvarVal.toFixed(4) };
}

/**
 * Square-root-of-time scaling for VaR horizon adjustment.
 * VaR_T = VaR_base × √(T / T_base)
 *
 * Valid under: i.i.d. returns, normal distribution.
 * INVALID for fat-tailed or autocorrelated returns — use GEV or GARCH.
 *
 * @param {number} var_base  — Base period VaR
 * @param {number} t_base    — Base period (days)
 * @param {number} t_target  — Target horizon (days)
 */
export function sqrtTimeVaR(var_base, t_base, t_target) {
  return var_base * Math.sqrt(t_target / t_base);
}

/**
 * Climate CVaR = Transition CVaR + Physical CVaR + Interaction Term
 * Per NGFS/ECB methodology (2021).
 *
 * @param {number} trans_cvar  — Transition risk CVaR (% of portfolio)
 * @param {number} phys_cvar   — Physical risk CVaR (% of portfolio)
 * @param {number} rho         — Correlation coefficient (default 0.25 per ECB study)
 */
export function climateCVaR(trans_cvar, phys_cvar, rho = 0.25) {
  return trans_cvar + phys_cvar + rho * trans_cvar * phys_cvar;
}

// ── Monte Carlo — Climate Scenarios ──────────────────────────────────────────

/**
 * Run deterministic Monte Carlo simulation for climate portfolio losses.
 * Uses seeded PRNG — NOT Math.random() — so results are reproducible.
 *
 * @param {object} params
 * @param {number} params.seed          — PRNG seed
 * @param {number} params.n             — Number of simulations
 * @param {number} params.mu            — Mean annual return (%)
 * @param {number} params.sigma         — Annual volatility (%)
 * @param {number} params.climate_shock — Additional loss from climate event (%)
 * @param {number} params.shock_prob    — Probability of climate shock per year
 * @param {number} params.horizon_yrs   — Simulation horizon
 * @returns {number[]} Distribution of terminal portfolio values
 */
export function monteCarloClimate(params) {
  const {
    seed = 42,
    n = 10000,
    mu = 0.07,
    sigma = 0.15,
    climate_shock = 0.12,
    shock_prob = 0.05,
    horizon_yrs = 10,
  } = params;

  const rng = seededPRNG(seed);
  const results = [];

  for (let i = 0; i < n; i++) {
    let value = 1.0;
    for (let t = 0; t < horizon_yrs; t++) {
      const [z] = boxMuller(rng);
      const shock = rng() < shock_prob ? -(climate_shock + Math.abs(rng() * 0.05)) : 0;
      value *= Math.exp((mu - 0.5 * sigma ** 2) + sigma * z + shock);
    }
    results.push(value);
  }

  results.sort((a, b) => a - b);
  return results;
}

// ── Stress Testing ─────────────────────────────────────────────────────────────

/**
 * Apply a stress scenario shock to a portfolio.
 *
 * Shock definitions follow ECB/NGFS 2022 adverse scenario magnitudes.
 * CRITICAL: No Math.random() here — shocks are deterministic parameters.
 *
 * @param {object} portfolio       — { equity_pct, credit_pct, re_pct, commodities_pct }
 * @param {string} scenario        — 'hot_house' | 'disorderly' | 'orderly' | 'physical_chronic' | 'physical_acute'
 * @param {number} horizon_yrs     — Horizon (1 | 3 | 10 | 30)
 * @returns {{ shock_bps, loss_pct, components }}
 */
export function applyStressShock(portfolio, scenario, horizon_yrs = 10) {
  // ECB 2022 stress test parameters (% loss, based on NiGEM/REMIND model)
  const SHOCK_PARAMS = {
    hot_house:        { equity: -0.42, credit: -0.18, re: -0.25, commodities: +0.15, horizon: 30 },
    disorderly:       { equity: -0.35, credit: -0.22, re: -0.18, commodities: -0.08, horizon: 10 },
    orderly:          { equity: -0.08, credit: -0.04, re: -0.05, commodities: -0.03, horizon: 10 },
    physical_chronic: { equity: -0.15, credit: -0.12, re: -0.22, commodities: -0.10, horizon: 30 },
    physical_acute:   { equity: -0.28, credit: -0.20, re: -0.35, commodities: +0.05, horizon: 1  },
  };

  const params = SHOCK_PARAMS[scenario] ?? SHOCK_PARAMS.disorderly;

  // Scale by horizon ratio using sqrt-of-time (orderly short-run approximation)
  const scaleRatio = Math.sqrt(horizon_yrs / params.horizon);

  const components = {
    equity:      +(portfolio.equity_pct      * params.equity      * scaleRatio).toFixed(4),
    credit:      +(portfolio.credit_pct      * params.credit      * scaleRatio).toFixed(4),
    re:          +(portfolio.re_pct          * params.re          * scaleRatio).toFixed(4),
    commodities: +(portfolio.commodities_pct * params.commodities * scaleRatio).toFixed(4),
  };

  const loss_pct   = Object.values(components).reduce((s, v) => s + v, 0);
  const shock_bps  = Math.round(loss_pct * 10000);

  return { shock_bps, loss_pct: +loss_pct.toFixed(4), components };
}

// ── Stranded Assets — Hazard Rate Model ────────────────────────────────────────

/**
 * Merton-style jump-to-default hazard rate for stranded asset risk.
 *
 * h(t) = λ_base × exp(α × CP(t) / CP_threshold)
 *
 * Where:
 *   λ_base       = baseline default intensity (per year)
 *   α            = carbon price sensitivity (typically 0.8–1.5)
 *   CP(t)        = carbon price at time t
 *   CP_threshold = asset-class stranding threshold
 *
 * @param {number} lambda_base    — Baseline hazard rate (yr⁻¹)
 * @param {number} carbon_price   — Current/projected carbon price (USD/t)
 * @param {number} cp_threshold   — Stranding price threshold (USD/t)
 * @param {number} alpha          — Price sensitivity exponent
 * @returns {number}              — Hazard rate (yr⁻¹)
 */
export function hazardRatePD(lambda_base, carbon_price, cp_threshold, alpha = 1.0) {
  return lambda_base * Math.exp(alpha * carbon_price / cp_threshold);
}

/**
 * Convert hazard rate to survival probability over horizon T.
 * S(T) = exp(-h × T)
 */
export function survivalProb(hazard_rate, horizon_yrs) {
  return Math.exp(-hazard_rate * horizon_yrs);
}

// ── Maritime — IMO CII ────────────────────────────────────────────────────────

/**
 * IMO Carbon Intensity Indicator (MEPC.338(76)).
 *
 * CII = Annual CO2 emissions / (DWT^capacity_factor × Distance_nm)
 *
 * Capacity factor by ship type (MEPC.339(76)):
 *   Bulk carrier: 0.279 (correction for actual capacity factor = 0.279 not DWT^0.676)
 *   Note: The formula uses (DWT × Distance) as the transport work denominator.
 *
 * Standard denominator: W = DWT × nm_traveled (tonne-miles)
 * CII = CO2_t / (DWT × nm_traveled) × 1e6  [gCO2 / tonne-mile]
 *
 * @param {number} co2_t         — Annual CO2 emissions (tonnes)
 * @param {number} dwt           — Deadweight tonnage
 * @param {number} distance_nm   — Annual sailing distance (nautical miles)
 * @returns {number}             — CII in gCO2 / (tonne-nm)
 */
export function calcCII(co2_t, dwt, distance_nm) {
  if (!dwt || !distance_nm) return null;
  return (co2_t * 1e6) / (dwt * distance_nm); // gCO2/(tonne·nm)
}

/**
 * IMO CII rating lookup (MEPC.339(76)).
 * Requires reference line and reduction factor for ship type/size.
 *
 * @param {number} cii_actual  — Computed CII value
 * @param {number} cii_ref     — Reference CII from IMO table
 * @returns {'A'|'B'|'C'|'D'|'E'}
 */
export function ciiRating(cii_actual, cii_ref) {
  const ratio = cii_actual / cii_ref;
  if (ratio < 0.82) return 'A';
  if (ratio < 0.94) return 'B';
  if (ratio < 1.06) return 'C';
  if (ratio < 1.18) return 'D';
  return 'E';
}

// ── Aviation — CORSIA ─────────────────────────────────────────────────────────

/**
 * CORSIA baseline emissions and offsetting requirement.
 * ICAO Doc 9501, Volume IV.
 *
 * Baseline = average of 2019 and 2020 emissions (CORSIA 2024 update).
 * Pre-2019 Phase: baseline = 2019 only.
 *
 * Offsetting = (Sector growth emissions - Baseline) × offset_ratio
 * offset_ratio = typically 1.0 (100% of above-baseline growth)
 *
 * @param {number} emissions_2019  — Sector CO2 (Mt) in 2019
 * @param {number} emissions_2020  — Sector CO2 (Mt) in 2020
 * @param {number} emissions_year  — Current year sector CO2 (Mt)
 * @param {number} offset_ratio    — Fraction of above-baseline to offset
 */
export function calcCORSIA(emissions_2019, emissions_2020, emissions_year, offset_ratio = 1.0) {
  const baseline  = (emissions_2019 + emissions_2020) / 2;
  const above     = Math.max(0, emissions_year - baseline);
  const offsetting = above * offset_ratio;

  return {
    baseline: +baseline.toFixed(2),
    above_baseline: +above.toFixed(2),
    offsetting_Mt: +offsetting.toFixed(2),
    growth_factor: emissions_year > 0 ? +(emissions_year / baseline).toFixed(3) : 1,
  };
}

export default {
  seededPRNG, boxMuller,
  NGFS_CARBON_PRICES, ngfsCarbonPrice,
  historicalCVaR, sqrtTimeVaR, climateCVaR,
  monteCarloClimate,
  applyStressShock,
  hazardRatePD, survivalProb,
  calcCII, ciiRating,
  calcCORSIA,
};
