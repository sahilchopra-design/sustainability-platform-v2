/**
 * India Locale — Currency, Number Formatting, Fiscal Year
 * Imported by any module that needs INR/crore display.
 */

// FX Rate (configurable, stored in localStorage)
const DEFAULT_FX = 83.5; // INR per USD as of April 2026
export const getFxRate = () => {
  try { return parseFloat(localStorage.getItem('a2_inr_fx_rate')) || DEFAULT_FX; } catch { return DEFAULT_FX; }
};

// Currency conversion
export const usdToInr = (usd) => usd * getFxRate();
export const inrToUsd = (inr) => inr / getFxRate();
export const usdToInrCr = (usd) => usd / 1e7 * getFxRate(); // USD to INR Crore
export const inrCrToUsd = (inrCr) => inrCr * 1e7 / getFxRate(); // INR Crore to USD

// Indian number formatting (lakh/crore system)
export function fmtInr(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e7) return sign + '₹' + (abs / 1e7).toFixed(decimals) + ' Cr';
  if (abs >= 1e5) return sign + '₹' + (abs / 1e5).toFixed(decimals) + ' L';
  if (abs >= 1e3) return sign + '₹' + (abs / 1e3).toFixed(decimals) + 'K';
  return sign + '₹' + abs.toFixed(decimals);
}

// Format USD with Indian context
export function fmtUsd(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(decimals) + 'B';
  if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(decimals) + 'M';
  if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(decimals) + 'K';
  return sign + '$' + abs.toFixed(decimals);
}

// Dual currency display: "$1.2B (₹10,020 Cr)"
export function fmtDual(usdValue, decimals = 1) {
  return fmtUsd(usdValue, decimals) + ' (' + fmtInr(usdToInr(usdValue), decimals) + ')';
}

// Indian fiscal year (April-March)
export function getFiscalYear(date) {
  const d = date || new Date();
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();
  return month >= 3 ? `FY ${year}-${(year + 1) % 100}` : `FY ${year - 1}-${year % 100}`;
}

// Current fiscal year
export const CURRENT_FY = getFiscalYear();

// India-specific constants
export const INDIA_CONSTANTS = {
  fxRate: DEFAULT_FX,
  cet1Minimum: 0.09, // RBI CRAR 9% vs Basel 8%
  dSibBuffer: 0.006, // 0.6% for D-SIBs (SBI, HDFC, ICICI)
  pslTarget: 0.40, // 40% Priority Sector Lending
  rpoTarget2030: 0.43, // 43% Renewable Purchase Obligation
  reTarget2030_gw: 500,
  netZeroYear: 2070,
  ndcIntensityCut: 0.45, // 45% intensity reduction vs 2005
  cctsEntities: 740,
  cctsSectors: 9,
  brsrTop500FY: 'FY 2025-26',
  brsrTop1000FY: 'FY 2026-27',
};

// Check if India mode is active
export function isIndiaMode() {
  try { return localStorage.getItem('a2_country_dataset') === 'IN'; } catch { return false; }
}

export default { getFxRate, usdToInr, inrToUsd, usdToInrCr, inrCrToUsd, fmtInr, fmtUsd, fmtDual, getFiscalYear, CURRENT_FY, INDIA_CONSTANTS, isIndiaMode };
