/**
 * OpenFIGI Service — Free identifier resolution for bonds and equities
 * API Docs: https://www.openfigi.com/api
 * No API key needed (lower rate limit), with key = higher limits
 * Supports: ID_ISIN, ID_CUSIP_8_CHR, ID_SEDOL, ID_TRACE, TICKER
 */

const OPENFIGI_URL = 'https://api.openfigi.com/v3/mapping';
const CACHE_KEY = 'ra_openfigi_cache_v1';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory + localStorage cache
let memCache = {};
try {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Date.now() - (parsed._ts || 0) < CACHE_TTL) memCache = parsed;
  }
} catch {}

function saveCache() {
  try {
    memCache._ts = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(memCache));
  } catch {}
}

/**
 * Resolve a batch of identifiers to FIGI records
 * @param {Array<{idType: string, idValue: string}>} jobs - Max 100 per call
 * @returns {Promise<Array<{data: Array}>>}
 *
 * idType options: 'ID_ISIN', 'ID_CUSIP_8_CHR', 'ID_SEDOL', 'ID_TRACE', 'TICKER'
 *
 * Example: resolveIdentifiers([{ idType: 'ID_ISIN', idValue: 'US037833AK68' }])
 */
export async function resolveIdentifiers(jobs) {
  if (!jobs || !jobs.length) return [];

  // Check cache first
  const uncached = [];
  const results = jobs.map((job, i) => {
    const key = `${job.idType}:${job.idValue}`;
    if (memCache[key]) return { ...memCache[key], _cached: true };
    uncached.push({ ...job, _idx: i });
    return null;
  });

  if (uncached.length === 0) return results;

  // Batch API call (max 100 per request)
  try {
    const batches = [];
    for (let i = 0; i < uncached.length; i += 100) {
      batches.push(uncached.slice(i, i + 100));
    }

    for (const batch of batches) {
      const apiJobs = batch.map(j => ({ idType: j.idType, idValue: j.idValue }));
      const response = await fetch(OPENFIGI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiJobs),
      });

      if (!response.ok) {
        console.warn(`OpenFIGI API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      data.forEach((result, i) => {
        const job = batch[i];
        const key = `${job.idType}:${job.idValue}`;
        const record = result?.data?.[0] || null;
        if (record) {
          memCache[key] = {
            figi: record.figi,
            name: record.name,
            ticker: record.ticker,
            exchCode: record.exchCode,
            marketSector: record.marketSector,
            securityType: record.securityType,
            securityType2: record.securityType2,
            compositeFIGI: record.compositeFIGI,
            shareClassFIGI: record.shareClassFIGI,
          };
          results[job._idx] = memCache[key];
        }
      });
    }

    saveCache();
  } catch (err) {
    console.warn('OpenFIGI fetch failed (CORS or network):', err.message);
  }

  return results;
}

/**
 * Quick ISIN lookup
 */
export async function lookupISIN(isin) {
  const res = await resolveIdentifiers([{ idType: 'ID_ISIN', idValue: isin }]);
  return res[0] || null;
}

/**
 * Quick CUSIP lookup
 */
export async function lookupCUSIP(cusip) {
  const res = await resolveIdentifiers([{ idType: 'ID_CUSIP_8_CHR', idValue: cusip }]);
  return res[0] || null;
}

/**
 * Batch ISIN resolution for a bond universe
 */
export async function enrichBondISINs(bonds) {
  const jobs = bonds.filter(b => b.isin).map(b => ({ idType: 'ID_ISIN', idValue: b.isin }));
  const results = await resolveIdentifiers(jobs);
  let idx = 0;
  return bonds.map(b => {
    if (!b.isin) return b;
    const figi = results[idx++];
    return figi ? { ...b, figi: figi.figi, figi_name: figi.name, figi_ticker: figi.ticker, figi_secType: figi.securityType, figi_market: figi.marketSector } : b;
  });
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  const entries = Object.keys(memCache).filter(k => k !== '_ts').length;
  return { entries, lastUpdated: memCache._ts ? new Date(memCache._ts).toISOString() : null, ttlDays: 7 };
}

export default { resolveIdentifiers, lookupISIN, lookupCUSIP, enrichBondISINs, getCacheStats };
