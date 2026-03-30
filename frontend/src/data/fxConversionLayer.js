// ═══════════════════════════════════════════════════════════════════════════════
// ENH-002: FX Conversion Layer
// Provides currency conversion utilities for cross-module portfolio analytics.
// All rates sourced from referenceData.js EXCHANGE_RATES (ECB / Fed / BIS).
// ═══════════════════════════════════════════════════════════════════════════════

import { EXCHANGE_RATES } from './referenceData';

const _rates = EXCHANGE_RATES.rates;
const _asOf  = EXCHANGE_RATES.asOf;

// ─── Core conversion ─────────────────────────────────────────────────────────

/**
 * Convert an amount between any two supported currencies via USD cross-rate.
 * Returns the original amount unchanged when either currency is unrecognised.
 */
export function convertFX(amount, fromCurrency, toCurrency, rates = _rates) {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = fromCurrency === 'USD' ? 1 : rates[fromCurrency];
  const toRate   = toCurrency   === 'USD' ? 1 : rates[toCurrency];
  if (!fromRate || !toRate) return amount; // fallback: no conversion
  // fromRate = units-of-fromCurrency per 1 USD
  // toRate   = units-of-toCurrency   per 1 USD
  // amount-in-USD = amount / fromRate  →  target = USD * toRate
  return (amount / fromRate) * toRate;
}

// ─── Portfolio helpers ───────────────────────────────────────────────────────

/**
 * Convert every holding's `marketValue` (+ optional `currency` field) to USD.
 * Holdings without a `currency` field are assumed to already be in USD.
 */
export function convertPortfolioToUSD(holdings) {
  return holdings.map(h => {
    const cur = h.currency || 'USD';
    return {
      ...h,
      marketValueUSD: convertFX(h.marketValue, cur, 'USD'),
      originalCurrency: cur,
      fxRate: cur === 'USD' ? 1 : 1 / (_rates[cur] ?? 1),
      fxAsOf: _asOf,
    };
  });
}

/**
 * Convert every holding's `marketValue` to an arbitrary target currency.
 */
export function convertPortfolioToCurrency(holdings, targetCurrency) {
  return holdings.map(h => {
    const cur = h.currency || 'USD';
    const converted = convertFX(h.marketValue, cur, targetCurrency);
    return {
      ...h,
      [`marketValue_${targetCurrency}`]: converted,
      originalCurrency: cur,
      targetCurrency,
      fxRate: converted / (h.marketValue || 1),
      fxAsOf: _asOf,
    };
  });
}

// ─── Rate look-ups ───────────────────────────────────────────────────────────

/**
 * Return the FX rate (units per 1 USD) for a given currency.
 * The optional `date` parameter is accepted for API symmetry but only the
 * static snapshot date is available in the frontend reference data.
 */
export function getFXRate(currency, date = null) {
  if (currency === 'USD') return { rate: 1, asOf: _asOf, isLive: false };
  const rate = _rates[currency];
  if (!rate) return null;
  return {
    rate,
    asOf: _asOf,
    requestedDate: date,
    isLive: false, // static snapshot — real-time feed not connected
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5', CHF: 'CHF ',
  CAD: 'C$', AUD: 'A$', NZD: 'NZ$', CNY: '\u00A5', INR: '\u20B9',
  KRW: '\u20A9', SGD: 'S$', HKD: 'HK$', TWD: 'NT$', BRL: 'R$',
  MXN: 'MX$', ZAR: 'R', TRY: '\u20BA', PLN: 'z\u0142', SEK: 'kr',
  NOK: 'kr', DKK: 'kr', CZK: 'K\u010D', HUF: 'Ft', ILS: '\u20AA',
  THB: '\u0E3F', MYR: 'RM', IDR: 'Rp', PHP: '\u20B1', VND: '\u20AB',
  SAR: 'SAR ',
};

/**
 * Format a numeric amount with the appropriate currency symbol.
 * Large values are abbreviated (K / M / B / T).
 */
export function formatCurrency(amount, currency = 'USD', decimals = 1) {
  const sym = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const abs = Math.abs(amount);
  let display;
  if (abs >= 1e12)      display = `${(amount / 1e12).toFixed(decimals)}T`;
  else if (abs >= 1e9)  display = `${(amount / 1e9).toFixed(decimals)}B`;
  else if (abs >= 1e6)  display = `${(amount / 1e6).toFixed(decimals)}M`;
  else if (abs >= 1e3)  display = `${(amount / 1e3).toFixed(decimals)}K`;
  else                  display = amount.toFixed(decimals);
  return `${sym}${display}`;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

/** All currency codes supported by the static rate table. */
export const SUPPORTED_CURRENCIES = ['USD', ...Object.keys(_rates)];

/** Snapshot date of the rate table. */
export const RATES_AS_OF = _asOf;
