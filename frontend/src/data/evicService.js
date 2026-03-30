/**
 * evicService.js — EVIC data provider with live-data-first, sector-estimate fallback
 *
 * EVIC = Enterprise Value Including Cash
 *      = Market Cap + Total Debt + Preferred Stock + Minority Interest
 *
 * Used by: PCAF financed-emissions, portfolio climate VaR, carbon attribution,
 *          Scope 3 value-chain calculations, CBAM compliance
 */

// ── Load real EVIC data (output of pullEvicData.js) ─────────────────────────
let REAL_EVIC = [];
try {
  REAL_EVIC = require('./evicData.json');
} catch (e) {
  /* No real data yet — all lookups will use sector estimates */
}

// Build lookup map for O(1) access
const EVIC_BY_TICKER = {};
REAL_EVIC.forEach(r => { EVIC_BY_TICKER[r.ticker] = r; });

// ── Sector-median EVIC/MarketCap ratios for estimation ──────────────────────
// Ratios derived from S&P 500 median debt-to-equity by sector (2024 data)
// EVIC ratio = 1 + (Total Debt + Preferred + Minority) / MarketCap
const SECTOR_EVIC_RATIO = {
  'Technology':             1.05,   // Low leverage, cash-rich
  'Healthcare':             1.15,   // Moderate debt from M&A
  'Financial Services':     1.80,   // High leverage by design
  'Energy':                 1.35,   // Moderate-to-high capex debt
  'Utilities':              1.60,   // High regulated leverage
  'Consumer Cyclical':      1.20,   // Moderate debt
  'Consumer Defensive':     1.18,   // Stable, moderate debt
  'Industrials':            1.25,   // Capex-driven leverage
  'Real Estate':            1.70,   // High mortgage/property debt
  'Communication Services': 1.22,   // Media & telecom leverage
  'Basic Materials':        1.28,   // Mining & chemicals leverage
};

const DEFAULT_RATIO = 1.20;

// ── Data Quality Score (DQS) aligned with PCAF framework ────────────────────
// 1 = reported/audited, 2 = company-disclosed, 3 = modelled, 4 = sector avg, 5 = proxy
const DQS = {
  LIVE: 1,
  ESTIMATED: 4,
};

// ── Core API ─────────────────────────────────────────────────────────────────

/**
 * Get EVIC for a single company.
 *
 * @param {string}  ticker      - Bloomberg/exchange ticker (e.g. "AAPL")
 * @param {number}  marketCapBn - Current market cap in $Bn (fallback input)
 * @param {string}  sector      - GICS sector name
 * @returns {{ evicBn: number, source: string, dqs: number, lineage: object }}
 */
export function getEVIC(ticker, marketCapBn, sector) {
  // 1. Check real EODHD data
  const real = EVIC_BY_TICKER[ticker];
  if (real && real.evicBn > 0) {
    return {
      evicBn: real.evicBn,
      source: 'EODHD_LIVE',
      dqs: DQS.LIVE,
      lineage: {
        marketCapBn: real.marketCapBn,
        totalDebtBn: real.totalDebtBn,
        preferredBn: real.preferredBn,
        minorityInterestBn: real.minorityInterestBn,
        quarterDate: real.quarterDate,
        pulledAt: real.pulledAt,
      },
    };
  }

  // 2. Sector-ratio estimate
  const ratio = SECTOR_EVIC_RATIO[sector] || DEFAULT_RATIO;
  const evicBn = round(marketCapBn * ratio, 2);

  return {
    evicBn,
    source: 'SECTOR_ESTIMATE',
    dqs: DQS.ESTIMATED,
    lineage: {
      marketCapBn,
      sectorRatio: ratio,
      sector: sector || 'Unknown',
      method: `EVIC = MarketCap * ${ratio} (sector median ratio)`,
    },
  };
}

/**
 * Batch-get EVIC for an array of portfolio holdings.
 *
 * @param {Array<{ticker: string, marketCapBn: number, sector: string}>} holdings
 * @returns {Array<{ticker: string, evicBn: number, source: string, dqs: number, lineage: object}>}
 */
export function getPortfolioEVIC(holdings) {
  return holdings.map(h => ({
    ticker: h.ticker,
    ...getEVIC(h.ticker, h.marketCapBn, h.sector),
  }));
}

/**
 * PCAF attribution factor: outstanding / EVIC
 * Used for financed emissions = sum(attribution_i * company_emissions_i)
 *
 * @param {number} outstandingMn - Outstanding exposure in $M
 * @param {string} ticker
 * @param {number} marketCapBn   - Market cap in $Bn (fallback)
 * @param {string} sector
 * @returns {{ attribution: number, evicBn: number, source: string, dqs: number }}
 */
export function calculateAttribution(outstandingMn, ticker, marketCapBn, sector) {
  const evicResult = getEVIC(ticker, marketCapBn, sector);
  const evicMn = evicResult.evicBn * 1000; // Convert $Bn to $M
  const attribution = evicMn > 0 ? Math.min(1.0, outstandingMn / evicMn) : 0;

  return {
    attribution: round(attribution, 6),
    evicBn: evicResult.evicBn,
    source: evicResult.source,
    dqs: evicResult.dqs,
  };
}

/**
 * Weighted-average DQS for the portfolio's EVIC data.
 * Weight by position size (market value).
 *
 * @param {Array<{ticker: string, marketCapBn: number, sector: string, weightPct: number}>} holdings
 * @returns {number} Weighted-average DQS (1-5 scale)
 */
export function portfolioDQS(holdings) {
  let totalWeight = 0;
  let weightedDqs = 0;
  holdings.forEach(h => {
    const { dqs } = getEVIC(h.ticker, h.marketCapBn, h.sector);
    const w = h.weightPct || 1;
    weightedDqs += dqs * w;
    totalWeight += w;
  });
  return totalWeight > 0 ? round(weightedDqs / totalWeight, 2) : 5;
}

/**
 * Coverage stats: how many holdings have live vs estimated EVIC.
 *
 * @param {Array<{ticker: string}>} holdings
 * @returns {{ total: number, live: number, estimated: number, coveragePct: number }}
 */
export function coverageStats(holdings) {
  let live = 0;
  holdings.forEach(h => {
    if (EVIC_BY_TICKER[h.ticker]?.evicBn > 0) live++;
  });
  const total = holdings.length;
  return {
    total,
    live,
    estimated: total - live,
    coveragePct: total > 0 ? round((live / total) * 100, 1) : 0,
  };
}

// ── Internal helper ──────────────────────────────────────────────────────────

function round(val, dp = 2) {
  return Math.round(val * Math.pow(10, dp)) / Math.pow(10, dp);
}

// ── Default export for convenience ───────────────────────────────────────────
export default {
  getEVIC,
  getPortfolioEVIC,
  calculateAttribution,
  portfolioDQS,
  coverageStats,
  SECTOR_EVIC_RATIO,
};
