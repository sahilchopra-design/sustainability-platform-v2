/**
 * numberFormat.js — R3 gap U-D: shared number/percent formatting primitives.
 *
 * Scope note: this codebase has ~165 feature modules that each define their
 * own local `fmt`/`fmtPct`/`fmtNum` helpers — migrating all of them to a
 * single shared system is a separate, much larger undertaking than this
 * pass. This module exists to give the two PCAF modules (the ones this R3
 * review actually covers) one canonical, tested implementation instead of
 * two independently-maintained copies that can silently drift apart (the
 * B-6 percent-precision fix already had to be applied in one file and not
 * the other once before). Other modules can adopt this over time; nothing
 * here assumes or requires that.
 */

const EM_DASH = '—';

/** Compact K/M/B suffix formatting for large tCO2e / $ figures. */
export function fmtCompact(n, dec = 0) {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(dec || 2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(dec || 2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(dec || 1) + 'K';
  return n.toFixed(dec);
}

/**
 * Percent formatting with adaptive precision (R3 gap B-6): a fixed 2
 * decimal places truncates any value below 0.005% to a bare "0.00%" —
 * indistinguishable from a genuine zero. Below that threshold, switch to 4
 * significant figures so a real non-zero value stays visible.
 */
export function fmtPercent(n) {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  const pct = n * 100;
  if (pct !== 0 && Math.abs(pct) < 0.005) return pct.toPrecision(4) + '%';
  return pct.toFixed(2) + '%';
}

/** Locale-aware grouped number formatting — pass the caller's real locale (en-US, en-IN, ...), never the ambient browser default. */
export function fmtLocaleNumber(n, locale, maximumFractionDigits = 2) {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  return n.toLocaleString(locale, { maximumFractionDigits });
}

/** Currency-prefixed grouped number, same locale-explicitness requirement as fmtLocaleNumber. */
export function fmtCurrency(n, symbol, locale, maximumFractionDigits = 2) {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  return symbol + fmtLocaleNumber(n, locale, maximumFractionDigits);
}
