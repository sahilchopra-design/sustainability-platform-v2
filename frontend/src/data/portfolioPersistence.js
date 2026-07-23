/**
 * portfolioPersistence.js — R3 gaps F-16/F-19: a persistence layer for
 * portfolio state so edits and added positions survive a page reload.
 *
 * Previously all writes (inline edits, add-position, remove) lived only in
 * React useState — a reload silently reverted to the 60-holding demo seed
 * with no indication anything had been lost (F-19: "additions are
 * session-only"). This is a thin localStorage-backed implementation behind
 * a small interface (load/save/clear) so a real backend store can replace
 * it later without touching call sites — swap the three functions below
 * for API calls and every caller keeps working unchanged.
 */

const NAMESPACE = 'pcaf-portfolio';

function storageKey(portfolioId) {
  return `${NAMESPACE}:${portfolioId}`;
}

/**
 * @param {string} portfolioId
 * @returns {any|null} the persisted positions array, or null if nothing
 *   saved yet / storage is unavailable / the saved data is corrupt.
 */
export function loadPortfolio(portfolioId) {
  try {
    const raw = window.localStorage.getItem(storageKey(portfolioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    // Corrupt data or storage unavailable (private browsing, quota) — fall
    // back to the caller's default rather than throwing.
    return null;
  }
}

/**
 * @param {string} portfolioId
 * @param {any[]} positions
 * @returns {boolean} whether the save succeeded
 */
export function savePortfolio(portfolioId, positions) {
  try {
    window.localStorage.setItem(storageKey(portfolioId), JSON.stringify(positions));
    return true;
  } catch {
    return false;
  }
}

export function clearPortfolio(portfolioId) {
  try {
    window.localStorage.removeItem(storageKey(portfolioId));
    return true;
  } catch {
    return false;
  }
}
