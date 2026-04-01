/**
 * pullEsgData.js — ENH-029 data fetch script
 *
 * Fetches ESG scores from EODHD fundamentals API for all tickers in evicData.json.
 * Saves output to frontend/src/data/esgData.json
 *
 * Usage:
 *   node scripts/pullEsgData.js
 *
 * Requires:
 *   EODHD_API_KEY set in .env (same key used for EVIC pulls)
 *   evicData.json already populated (run pullEvicData.js first)
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const API_KEY = process.env.EODHD_API_KEY || process.env.REACT_APP_EODHD_KEY;
const EVIC_PATH = path.join(__dirname, '../frontend/src/data/evicData.json');
const OUT_PATH  = path.join(__dirname, '../frontend/src/data/esgData.json');
const BASE_URL  = 'https://eodhd.com/api/fundamentals';
const DELAY_MS  = 350; // ~2.8 req/s — stays within EODHD 1,000 req/day limit

if (!API_KEY) {
  console.error('❌ EODHD_API_KEY not set in .env');
  process.exit(1);
}

// Load tickers from evicData
let tickers = [];
try {
  const evic = JSON.parse(fs.readFileSync(EVIC_PATH, 'utf8'));
  tickers = evic.map(r => r.ticker).filter(Boolean);
  console.log(`📋 Loaded ${tickers.length} tickers from evicData.json`);
} catch (e) {
  console.error('❌ Could not read evicData.json:', e.message);
  process.exit(1);
}

// Load existing ESG cache (to avoid re-fetching)
let existing = {};
try {
  const cache = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  cache.forEach(r => { existing[r.ticker] = r; });
  console.log(`📦 ${Object.keys(existing).length} tickers already in esgData.json cache`);
} catch (_) { /* no cache yet */ }

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchEsg(ticker) {
  // EODHD tickers: some are already exchange-qualified (e.g. "AAPL.US"), others not
  const qualified = ticker.includes('.') ? ticker : `${ticker}.US`;
  const url = `${BASE_URL}/${qualified}?api_token=${API_KEY}&filter=General::ESGScores&fmt=json`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();

  if (!data || typeof data !== 'object') return null;

  return {
    ticker,
    totalEsg:         parseFloat(data.TotalESG)         || null,
    environmentScore: parseFloat(data.EnvironmentScore)  || null,
    socialScore:      parseFloat(data.SocialScore)       || null,
    governanceScore:  parseFloat(data.GovernanceScore)   || null,
    esgRating:        data.ESGRating                     || null,
    ratingDate:       data.RatingDate                    || null,
    source: 'EODHD',
    pulledAt: new Date().toISOString(),
  };
}

(async () => {
  const toFetch = tickers.filter(t => !existing[t]);
  console.log(`🔄 Fetching ESG data for ${toFetch.length} new tickers…`);

  let success = 0, failed = 0;
  const results = { ...existing };

  for (let i = 0; i < toFetch.length; i++) {
    const ticker = toFetch[i];
    try {
      const esg = await fetchEsg(ticker);
      if (esg && esg.totalEsg) {
        results[ticker] = esg;
        success++;
        if (success % 10 === 0) process.stdout.write(`  ✓ ${success}/${toFetch.length}\r`);
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      if (process.env.VERBOSE) console.warn(`  ⚠ ${ticker}: ${err.message}`);
    }
    if (i < toFetch.length - 1) await sleep(DELAY_MS);
  }

  const output = Object.values(results);
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\n✅ Done. ${success} fetched, ${failed} failed/no-ESG`);
  console.log(`📁 Saved ${output.length} records → ${OUT_PATH}`);
  console.log(`   Real coverage: ${output.filter(r => r.totalEsg).length} / ${tickers.length} tickers`);
})();
