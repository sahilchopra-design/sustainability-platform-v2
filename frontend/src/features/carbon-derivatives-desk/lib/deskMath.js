// ─────────────────────────────────────────────────────────────────────────────
// Carbon Derivatives Desk — pure quant helpers (NO React, NO JSX).
// Deliberately written as CommonJS so the exact same functions are
//   (a) imported by CarbonDerivativesDeskPage.jsx via webpack, and
//   (b) require()-able directly by Node verification scripts — the numbers the
//       UI shows are the numbers the test asserts on, with zero re-implementation drift.
// Every formula is deterministic; there is no PRNG anywhere in this module.
// ─────────────────────────────────────────────────────────────────────────────

// Standard normal PDF.
const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

// Standard normal CDF via the Abramowitz & Stegun rational approximation
// (Handbook of Mathematical Functions, formula 26.2.17; |error| < 7.5e-8).
const normCdf = (x) => {
  if (x < 0) return 1 - normCdf(-x);
  const t = 1 / (1 + 0.2316419 * x);
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return 1 - normPdf(x) * poly;
};

// ── Black-76 (Black, F. 1976, "The pricing of commodity contracts") ──────────
// Options on futures/forwards:
//   d1 = [ln(F/K) + σ²τ/2] / (σ√τ),  d2 = d1 − σ√τ
//   Call = e^{−rτ}[F·N(d1) − K·N(d2)];  Put = e^{−rτ}[K·N(−d2) − F·N(−d1)]
const black76 = (F, K, sigma, tau, r) => {
  if (F <= 0 || K <= 0 || sigma <= 0 || tau <= 0) return null;
  const sqT = Math.sqrt(tau);
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * tau) / (sigma * sqT);
  const d2 = d1 - sigma * sqT;
  const disc = Math.exp(-r * tau);
  const call = disc * (F * normCdf(d1) - K * normCdf(d2));
  const put = disc * (K * normCdf(-d2) - F * normCdf(-d1));
  return {
    d1, d2, call, put,
    deltaCall: disc * normCdf(d1),
    deltaPut: -disc * normCdf(-d1),
    gamma: disc * normPdf(d1) / (F * sigma * sqT),            // ∂²V/∂F² (same for call/put)
    vega: F * disc * normPdf(d1) * sqT / 100,                 // per 1 vol-point (1%)
    thetaCall: (-(F * disc * normPdf(d1) * sigma) / (2 * sqT) + r * disc * (F * normCdf(d1) - K * normCdf(d2))) / 365,
    thetaPut: (-(F * disc * normPdf(d1) * sigma) / (2 * sqT) - r * disc * (K * normCdf(-d2) - F * normCdf(-d1))) / 365,
  };
};

// Cost-of-carry forward on an allowance: F = S·e^{(r+u)τ}
// (EUAs are electronic registry entries — storage ≈ 0; u = funding/holding spread).
const cocForward = (S, r, u, tau) => S * Math.exp((r + u) * tau);

// ── Implied-vol surface: bilinear interpolation ──────────────────────────────
// Grid axes: `moneys` = strike moneyness K/S ascending (e.g. [0.8 … 1.2]),
// `tenors` = expiries in years ascending; `grid[i][j]` = vol % at (moneys[i], tenors[j]).
// Query points are CLAMPED to the grid hull (flat extrapolation — documented
// convention; no extrapolated smile is invented beyond quoted nodes).
// At a node the weights collapse to {1,0}, so node values are reproduced EXACTLY.
const bilinearVol = (moneys, tenors, grid, m, tau) => {
  const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
  const mm = clamp(m, moneys[0], moneys[moneys.length - 1]);
  const tt = clamp(tau, tenors[0], tenors[tenors.length - 1]);
  let i = 0;
  while (i < moneys.length - 2 && moneys[i + 1] <= mm) i += 1;
  let j = 0;
  while (j < tenors.length - 2 && tenors[j + 1] <= tt) j += 1;
  const m0 = moneys[i]; const m1 = moneys[i + 1];
  const t0 = tenors[j]; const t1 = tenors[j + 1];
  const wm = m1 === m0 ? 0 : (mm - m0) / (m1 - m0);
  const wt = t1 === t0 ? 0 : (tt - t0) / (t1 - t0);
  const v00 = grid[i][j]; const v10 = grid[i + 1][j];
  const v01 = grid[i][j + 1]; const v11 = grid[i + 1][j + 1];
  return (1 - wm) * (1 - wt) * v00 + wm * (1 - wt) * v10 + (1 - wm) * wt * v01 + wm * wt * v11;
};

// Default smile builder — LABELED market-typical shape, not observed quotes:
// carbon options skew rich for OTM puts (downside policy/compliance-demand risk)
// with a mild call wing; the smile flattens with tenor. All 20 nodes editable in-UI.
const defaultSurface = (basePct, moneys, tenors) => {
  const smile = { '0.8': 6, '0.9': 3, '1': 0, '1.1': 1.5, '1.2': 3 };
  return moneys.map((m) => tenors.map((tau) => {
    const flatten = 1 / (1 + 0.4 * (tau - tenors[0]));       // smile decays with tenor
    const s = smile[String(m)] != null ? smile[String(m)] : 0;
    return Math.round((basePct + s * flatten) * 10) / 10;
  }));
};

// ── Multi-leg strategy payoff (at expiry, per leg) ───────────────────────────
// leg = { type: 'call'|'put', side: +1 (long) | −1 (short), strike, qty (tonnes) }
// Intrinsic payoff of one leg at terminal price ST (premium NOT included here).
const legPayoff = (leg, ST) => {
  const intrinsic = leg.type === 'call' ? Math.max(ST - leg.strike, 0) : Math.max(leg.strike - ST, 0);
  return leg.side * leg.qty * intrinsic;
};

// Aggregate strategy payoff at ST = Σ legPayoff — by construction the collar
// (long put + short call) aggregate is the pointwise sum of its legs.
const strategyPayoff = (legs, ST) => legs.reduce((s, l) => s + legPayoff(l, ST), 0);

// ── EU Market Stability Reserve — Decision (EU) 2015/1814, as amended by ─────
// Decision (EU) 2018/410 and Decision (EU) 2023/959 ("Fit for 55"):
//   · TNAC > 1,096 Mt                → intake = 24% of TNAC (2019–2030; 12% thereafter)
//   · 833 Mt < TNAC ≤ 1,096 Mt       → intake = TNAC − 833 Mt (buffer band, 2023/959,
//                                       removes the threshold cliff at 833)
//   · TNAC < 400 Mt                  → 100 Mt released from the reserve to auctions
//   · 400–833 Mt                     → no action
// From 2023, reserve holdings above the previous year's auction volume are
// invalidated (Art 1(5a)). Rates/thresholds below are the published legal values.
const MSR_PARAMS = {
  upperThresholdMt: 833,
  bufferTopMt: 1096,
  lowerThresholdMt: 400,
  intakeRateTo2030: 0.24,   // 2019–2030 (2018/410 doubled 12%→24%; 2023/959 extended to 2030)
  intakeRateAfter2030: 0.12,
  releaseMt: 100,
  legalBasis: 'Decision (EU) 2015/1814, as amended by Decision (EU) 2018/410 and Decision (EU) 2023/959',
};

// Apply the published MSR rules to one year's user-supplied TNAC (Mt).
const msrAction = (tnacMt, year) => {
  const P = MSR_PARAMS;
  const rate = year <= 2030 ? P.intakeRateTo2030 : P.intakeRateAfter2030;
  if (tnacMt > P.bufferTopMt) {
    return { band: `TNAC > ${P.bufferTopMt} Mt`, action: 'intake', intakeMt: rate * tnacMt, releaseMt: 0, ratePct: rate * 100 };
  }
  if (tnacMt > P.upperThresholdMt) {
    return { band: `${P.upperThresholdMt}–${P.bufferTopMt} Mt buffer`, action: 'intake', intakeMt: tnacMt - P.upperThresholdMt, releaseMt: 0, ratePct: null };
  }
  if (tnacMt < P.lowerThresholdMt) {
    return { band: `TNAC < ${P.lowerThresholdMt} Mt`, action: 'release', intakeMt: 0, releaseMt: P.releaseMt, ratePct: null };
  }
  return { band: `${P.lowerThresholdMt}–${P.upperThresholdMt} Mt`, action: 'none', intakeMt: 0, releaseMt: 0, ratePct: null };
};

module.exports = {
  normPdf, normCdf, black76, cocForward,
  bilinearVol, defaultSurface,
  legPayoff, strategyPayoff,
  MSR_PARAMS, msrAction,
};
