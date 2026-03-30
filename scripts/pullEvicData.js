#!/usr/bin/env node
/**
 * pullEvicData.js — Pull EVIC data from EODHD for all securities in realMarketData.json
 *
 * EVIC = Market Cap + Total Debt + Preferred Stock + Minority Interest
 *
 * Usage: node scripts/pullEvicData.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Config ──────────────────────────────────────────────────────────────────
const API_KEY = '69bf68d49903f5.34977112';
const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DELAY_MS = 200;
const INPUT_PATH = path.join(__dirname, '..', 'frontend', 'src', 'data', 'realMarketData.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'frontend', 'src', 'data', 'evicData.json');

// EODHD exchange mapping — US exchanges all use "US"
const EXCHANGE_MAP = {
  NASDAQ: 'US',
  NYSE: 'US',
  PINK: 'US',
  OTCMKTS: 'US',
  // European / international exchanges map directly
  LSE: 'LSE',
  SW: 'SW',
  PA: 'PA',
  BR: 'BR',
  AS: 'AS',
  CO: 'CO',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        } else {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
        }
      });
    }).on('error', reject);
  });
}

function getCachePath(ticker) {
  return path.join(CACHE_DIR, `evic_${ticker.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
}

function readCache(ticker) {
  const fp = getCachePath(ticker);
  if (!fs.existsSync(fp)) return null;
  const stat = fs.statSync(fp);
  if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch { return null; }
}

function writeCache(ticker, data) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(getCachePath(ticker), JSON.stringify(data, null, 2));
}

function toBn(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n / 1e9;
}

function round(val, dp = 2) {
  return Math.round(val * Math.pow(10, dp)) / Math.pow(10, dp);
}

// ── Extract EVIC from fundamentals response ─────────────────────────────────

function extractEvic(ticker, fundamentals) {
  // Market cap from Highlights
  const mktCap = fundamentals?.Highlights?.MarketCapitalization || 0;
  const revenue = fundamentals?.Highlights?.RevenueTTM || 0;
  const name = fundamentals?.General?.Name || ticker;

  // Latest quarterly balance sheet
  const quarters = fundamentals?.Financials?.Balance_Sheet?.quarterly || {};
  const quarterKeys = Object.keys(quarters).sort().reverse();
  const latestQ = quarterKeys.length > 0 ? quarters[quarterKeys[0]] : {};
  const quarterDate = quarterKeys[0] || null;

  const totalDebt = parseFloat(latestQ.shortLongTermDebtTotal) || 0;
  const preferred = parseFloat(latestQ.preferredStockTotalEquity) || 0;
  const minority = parseFloat(latestQ.minorityInterest) || 0;

  const evic = mktCap + totalDebt + preferred + minority;

  return {
    ticker,
    name,
    marketCapBn: round(toBn(mktCap)),
    totalDebtBn: round(toBn(totalDebt)),
    preferredBn: round(toBn(preferred)),
    minorityInterestBn: round(toBn(minority)),
    evicBn: round(toBn(evic)),
    revenueBn: round(toBn(revenue)),
    quarterDate,
    source: 'EODHD',
    pulledAt: new Date().toISOString(),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading tickers from realMarketData.json...');
  const holdings = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  console.log(`Found ${holdings.length} securities.\n`);

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  const results = [];
  let cached = 0;
  let fetched = 0;
  let failed = 0;

  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    const ticker = h.ticker;
    const exchange = EXCHANGE_MAP[h.exchange] || h.exchange || 'US';
    const eodTicker = `${ticker}.${exchange}`;
    const tag = `[${i + 1}/${holdings.length}]`;

    // Check cache first
    const cacheData = readCache(ticker);
    if (cacheData) {
      results.push(cacheData);
      cached++;
      console.log(`${tag} ${ticker} — cached`);
      continue;
    }

    // Fetch from EODHD (full fundamentals, no filter)
    const url = `https://eodhd.com/api/fundamentals/${eodTicker}?api_token=${API_KEY}&fmt=json`;
    try {
      console.log(`${tag} ${ticker} — fetching ${eodTicker}...`);
      const data = await httpsGet(url);
      const row = extractEvic(ticker, data);
      results.push(row);
      writeCache(ticker, row);
      fetched++;
    } catch (err) {
      console.error(`${tag} ${ticker} — ERROR: ${err.message}`);
      failed++;
    }

    // Rate-limit delay
    if (i < holdings.length - 1) await sleep(DELAY_MS);
  }

  // Write output
  results.sort((a, b) => b.evicBn - a.evicBn);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

  console.log(`\nDone. ${fetched} fetched, ${cached} cached, ${failed} failed.`);
  console.log(`Output: ${OUTPUT_PATH} (${results.length} records)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
