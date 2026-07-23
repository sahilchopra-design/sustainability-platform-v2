/**
 * evicReference.js — curated EVIC + revenue reference table lookup (R3 gap A-4)
 *
 * Second tier in the EVIC resolution order used by PcafFinancedEmissionsPage.jsx
 * and pcafAuditTrail.js:
 *   1. Live feed        — evicService.js / data/evicData.json (currently empty)
 *   2. Reference table   — this module, backed by data/evic_reference.json
 *   3. Sector-median proxy — only within a plausibility ceiling; otherwise a
 *      blocking data-gap flag instead of a silently-computed number.
 *
 * Every non-null entry in evic_reference.json is still marked "not
 * independently analyst-verified" — see that file's _meta.warning. This
 * module does not fabricate or upgrade that provenance; it just resolves it.
 */
import evicReferenceData from './evic_reference.json';

const ENTRIES_BY_TICKER = Object.fromEntries(
  (evicReferenceData.entries || []).map(e => [e.ticker, e])
);

/** Full reference entry for a ticker, or null if not in the table. */
export function getReferenceEntry(ticker) {
  return ENTRIES_BY_TICKER[ticker] || null;
}

/** EVIC in $Bn from the reference table, or null if absent/unset. */
export function getReferenceEvicBn(ticker) {
  const e = ENTRIES_BY_TICKER[ticker];
  return e && typeof e.evic_usd_bn === 'number' ? e.evic_usd_bn : null;
}

/** Revenue in $M from the reference table, or null if absent/unset. */
export function getReferenceRevenueM(ticker) {
  const e = ENTRIES_BY_TICKER[ticker];
  return e && typeof e.revenue_usd_m === 'number' ? e.revenue_usd_m : null;
}

export default { getReferenceEntry, getReferenceEvicBn, getReferenceRevenueM };
