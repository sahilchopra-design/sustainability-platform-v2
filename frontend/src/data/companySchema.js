/**
 * COMPANY SCHEMA & NORMALISATION UTILITIES
 * ─────────────────────────────────────────
 * Canonical field names, FX rates, and normalisation functions for both
 * India (legacy _inr_cr fields) and international (local-currency _lc_m) records.
 *
 * All monetary "lc_m" fields are in millions of local currency.
 * All monetary "usd_m" fields are in millions of USD.
 * FX rates are mid-market reference rates as of FX_REFERENCE_DATE.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FX REFERENCE DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mid-market FX rates: units of local currency per 1 USD.
 * e.g. INR: 83.5 means 1 USD = ₹83.5
 */
export const REFERENCE_FX_TO_USD = {
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  JPY: 151.0,
  CNY: 7.1,
  AUD: 1.52,
  CAD: 1.35,
  SGD: 1.34,
  KRW: 1320,
  BRL: 4.95,
  ZAR: 18.6,
  USD: 1.0,
};

/** Reference date for all FX rates above */
export const FX_REFERENCE_DATE = '2024-03-31';

// ─────────────────────────────────────────────────────────────────────────────
// NORMALISATION — INDIA (legacy _inr_cr fields → canonical _lc_m fields)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * normalizeIndiaRecord(c)
 *
 * Maps a legacy Indian company record that stores financials in ₹ Crore
 * (suffix _inr_cr) to the canonical schema that uses local-currency millions
 * (suffix _lc_m).
 *
 * Conversion: 1 Crore = 10 Million  →  _inr_cr * 10 = _lc_m (INR millions)
 *
 * Also computes:
 *   evic_usd_m      — EVIC in USD millions (via REFERENCE_FX_TO_USD.INR = 83.5)
 *   ghg_intensity   — tCO2e per INR million revenue
 *                     = ghg_intensity_tco2e_cr / 10
 *                     (because _tco2e_cr is per crore; 1 crore = 10 million)
 *   ghg_intensity_usd_m — tCO2e per USD million (= ghg_intensity * 83.5)
 *
 * @param {Object} c  Raw India company record
 * @returns {Object}  Normalised canonical record
 */
export function normalizeIndiaRecord(c) {
  const evic_lc_m       = c.evic_inr_cr       != null ? c.evic_inr_cr       * 10 : null;
  const revenue_lc_m    = c.revenue_inr_cr     != null ? c.revenue_inr_cr    * 10 : null;
  const ebitda_lc_m     = c.ebitda_inr_cr      != null ? c.ebitda_inr_cr     * 10 : null;
  const net_profit_lc_m = c.net_profit_inr_cr  != null ? c.net_profit_inr_cr * 10 : null;
  const total_debt_lc_m = c.total_debt_inr_cr  != null ? c.total_debt_inr_cr * 10 : null;
  const market_cap_lc_m = c.market_cap_inr_cr  != null ? c.market_cap_inr_cr * 10 : null;

  const ghg_intensity       = c.ghg_intensity_tco2e_cr != null
    ? c.ghg_intensity_tco2e_cr / 10
    : null;                                         // tCO2e per INR million
  const ghg_intensity_usd_m = ghg_intensity != null
    ? ghg_intensity * REFERENCE_FX_TO_USD.INR
    : null;                                         // tCO2e per USD million

  return {
    // ── identity ──
    ...c,
    id:           c.cin,
    currency:     'INR',
    country_code: 'IN',
    index:        c.niftyIndex ?? [],

    // ── canonical financials (local-currency millions) ──
    evic_lc_m,
    revenue_lc_m,
    ebitda_lc_m,
    net_profit_lc_m,
    total_debt_lc_m,
    market_cap_lc_m,

    // ── canonical per-share / market data ──
    eps_lc:          c.eps_inr,
    week52_high_lc:  c.week52_high_inr,
    week52_low_lc:   c.week52_low_inr,
    stock_price_lc:  c.stock_price_inr,

    // ── ownership ──
    major_holder_pct: c.promoter_holding_pct,

    // ── USD cross-currency ──
    evic_usd_m: evic_lc_m != null ? Math.round(evic_lc_m / REFERENCE_FX_TO_USD.INR) : null,

    // ── GHG intensity ──
    ghg_intensity,          // tCO2e per INR million
    ghg_intensity_usd_m,    // tCO2e per USD million
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALISATION — INTERNATIONAL (canonical _lc_m fields)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * normalizeInternationalRecord(c)
 *
 * Adds computed cross-currency and compatibility fields to an international
 * company record that already stores financials in local-currency millions
 * (suffix _lc_m).
 *
 * @param {Object} c  Raw international company record
 * @returns {Object}  Normalised canonical record
 */
export function normalizeInternationalRecord(c) {
  const fxRate = REFERENCE_FX_TO_USD[c.currency] ?? 1;

  return {
    ...c,

    // ── identity ──
    id:         c.id ?? `${c.exchange}_${c.ticker}`,
    cin:        null,
    nifty50:    false,
    niftyIndex: null,

    // ── USD cross-currency ──
    evic_usd_m: c.evic_lc_m != null
      ? Math.round(c.evic_lc_m / fxRate)
      : null,

    // ── GHG intensity in USD terms ──
    ghg_intensity_usd_m: c.ghg_intensity != null
      ? c.ghg_intensity * fxRate          // tCO2e per USD million
      : null,

    // ── FX metadata ──
    fx_rate: fxRate,
    fx_date: FX_REFERENCE_DATE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GICS SECTORS
// ─────────────────────────────────────────────────────────────────────────────

/** All 11 GICS Level-1 sectors */
export const GICS_SECTORS = [
  'Energy',
  'Materials',
  'Industrials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Health Care',
  'Financials',
  'Information Technology',
  'Communication Services',
  'Utilities',
  'Real Estate',
];

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE DQS DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default BRSR/TCFD Data Quality Score (DQS) by listing exchange.
 * Scale: 1 (highest quality, third-party verified) → 5 (estimated/proxy data).
 * Values represent the floor DQS to assign when company-specific data
 * quality has not been assessed.
 *
 * Tier rationale:
 *   DQS 2 — NSE/BSE: SEBI mandates BRSR Core for top 1,000 listed companies
 *   DQS 3 — NYSE, NASDAQ, LSE, XETRA, Euronext, TSE, ASX, TSX, SGX, JSE:
 *            robust sustainability disclosure requirements (SEC, FCA, BaFin, AMF, etc.)
 *   DQS 4 — SSE, SZSE, KRX, B3: emerging mandatory frameworks, partial coverage
 */
export const EXCHANGE_DQS_DEFAULTS = {
  'NSE':             2,
  'BSE':             2,
  'NYSE':            3,
  'NASDAQ':          3,
  'LSE':             3,
  'XETRA':           3,
  'Euronext Paris':  3,
  'TSE':             3,
  'SSE':             4,
  'SZSE':            4,
  'ASX':             3,
  'TSX':             3,
  'SGX':             3,
  'KRX':             4,
  'B3':              4,
  'JSE':             3,
};
