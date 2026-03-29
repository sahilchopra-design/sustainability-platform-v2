#!/usr/bin/env node
/**
 * pullRealData.js — Pull real financial data from EODHD API
 *
 * Usage:  node scripts/pullRealData.js
 * Output: frontend/src/data/realMarketData.json
 *
 * Exchanges: US (S&P-like), LSE (FTSE 100), XETRA (DAX), TSE (Nikkei 225)
 * Indian stocks loaded from companyMaster.js (BRSR data, no API call needed)
 *
 * Rate limit: 100K/day — uses bulk endpoints, 200ms delays, local cache
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = '69bf68d49903f5.34977112';
const BASE = 'https://eodhd.com/api';
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache');
const OUTPUT = path.join(ROOT, 'frontend', 'src', 'data', 'realMarketData.json');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error: ${body.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function cachedFetch(cacheKey, url) {
  const file = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (fs.existsSync(file)) {
    const age = Date.now() - fs.statSync(file).mtimeMs;
    if (age < 24 * 60 * 60 * 1000) {
      console.log(`  [cache] ${cacheKey}`);
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  }
  const data = await fetchJSON(url);
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

function bn(val) {
  if (val == null || val === '' || val === 'N/A') return null;
  const n = Number(val);
  return isNaN(n) ? null : Math.round((n / 1e9) * 100) / 100;
}
function num(val) {
  if (val == null || val === '' || val === 'N/A') return null;
  const n = Number(val);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

// ── Exchange pull via bulk fundamentals ──────────────────────────────────────

async function pullExchange(exchange, label, maxStocks = 500) {
  console.log(`\n── ${label} (${exchange}) ──`);

  // 1. Get symbol list to filter Common Stock
  console.log(`  Fetching symbol list for ${exchange}...`);
  const symbols = await cachedFetch(
    `symbols_${exchange}`,
    `${BASE}/exchange-symbol-list/${exchange}?api_token=${API_KEY}&fmt=json`
  );
  if (!Array.isArray(symbols)) {
    console.log(`  ERROR: unexpected response for ${exchange}`, String(symbols).slice(0, 200));
    return [];
  }

  const common = symbols.filter((s) => s.Type === 'Common Stock');
  console.log(`  ${common.length} common stocks / ${symbols.length} total symbols`);

  // 2. Bulk fundamentals (up to 500 per call, very efficient)
  console.log(`  Fetching bulk fundamentals (limit ${maxStocks})...`);
  const bulk = await cachedFetch(
    `bulk_${exchange}_0`,
    `${BASE}/bulk-fundamentals/${exchange}?api_token=${API_KEY}&fmt=json&offset=0&limit=${maxStocks}`
  );
  if (!Array.isArray(bulk) && typeof bulk === 'object' && bulk.error) {
    console.log(`  Bulk API error: ${bulk.error}`);
    return [];
  }

  const bulkArr = Array.isArray(bulk) ? bulk : [];
  console.log(`  Got ${bulkArr.length} bulk records`);

  // Build a set of common-stock tickers for filtering
  const commonSet = new Set(common.map((s) => s.Code));

  const results = [];
  for (const item of bulkArr) {
    try {
      const gen = item.General || {};
      const hi = item.Highlights || {};
      const val = item.Valuation || {};
      const tech = item.Technicals || {};

      const code = gen.Code || item.Code;
      if (!code) continue;
      if (!commonSet.has(code)) continue; // skip non-common-stock

      results.push({
        ticker: code,
        name: (gen.Name || '').replace(/,?\s*(Inc\.?|Corp\.?|Ltd\.?|PLC|AG|SE|NV|SA)$/i, '').trim() || gen.Name,
        exchange: gen.Exchange || exchange,
        isin: gen.ISIN || null,
        sector: gen.Sector || null,
        industry: gen.Industry || null,
        country: gen.CountryISO || gen.Country || null,
        marketCapBn: bn(hi.MarketCapitalization),
        revenueBn: bn(hi.Revenue),
        ebitdaBn: bn(hi.EBITDA),
        employees: hi.FullTimeEmployees ? Number(hi.FullTimeEmployees) : null,
        dividendYield: num(hi.DividendYield),
        peRatio: num(hi.PERatio || val.PERatio),
        priceToBook: num(val.PriceBookMRQ),
        beta: num(tech.Beta),
        esgTotal: null,
        esgEnvironment: null,
        esgSocial: null,
        esgGovernance: null,
      });
    } catch (e) {
      // skip malformed entry
    }
  }

  // Sort by market cap descending, take the biggest
  results.sort((a, b) => (b.marketCapBn || 0) - (a.marketCapBn || 0));
  console.log(`  Parsed ${results.length} companies (sorted by market cap)`);
  return results;
}

// ── ESG scores (individual endpoint, use sparingly) ──────────────────────────

async function enrichESG(companies, exchange, batchSize = 50) {
  const top = companies.slice(0, batchSize);
  console.log(`  Enriching ESG for top ${top.length} stocks on ${exchange}...`);

  let fetched = 0;
  for (const co of top) {
    const suffix = exchange === 'LSE' ? '.LSE' : exchange === 'XETRA' ? '.XETRA' : exchange === 'TSE' ? '.TSE' : '.US';
    const key = `esg_${co.ticker}${suffix}`;
    try {
      const data = await cachedFetch(
        key,
        `${BASE}/fundamentals/${co.ticker}${suffix}?api_token=${API_KEY}&filter=ESGScores`
      );
      if (data && typeof data === 'object' && !data.error) {
        co.esgTotal = num(data.TotalEsg || data.totalEsg);
        co.esgEnvironment = num(data.EnvironmentScore || data.environmentScore);
        co.esgSocial = num(data.SocialScore || data.socialScore);
        co.esgGovernance = num(data.GovernanceScore || data.governanceScore);
      }
      fetched++;
      if (fetched % 10 === 0) process.stdout.write(`    ESG ${fetched}/${top.length}\r`);
      await sleep(200);
    } catch (e) {
      // skip — ESG not available for all tickers
    }
  }
  console.log(`    ESG done: ${fetched} attempted`);
}

// ── Indian stocks from companyMaster.js ──────────────────────────────────────

function loadIndianStocks() {
  console.log('\n── Indian Stocks (companyMaster.js) ──');
  const cmPath = path.join(ROOT, 'frontend', 'src', 'data', 'companyMaster.js');
  if (!fs.existsSync(cmPath)) {
    console.log('  companyMaster.js not found, skipping');
    return [];
  }

  const src = fs.readFileSync(cmPath, 'utf8');
  // Extract the array literal by matching object blocks
  const entries = [];
  const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
  const matches = src.match(objRegex) || [];

  for (const block of matches) {
    try {
      const get = (key) => {
        const m = block.match(new RegExp(`${key}\\s*:\\s*(?:'([^']*)'|"([^"]*)"|(\\d[\\d.]*))`, ''));
        return m ? (m[1] || m[2] || m[3] || null) : null;
      };
      const ticker = get('ticker');
      const name = get('name');
      if (!ticker || !name) continue;

      const mcap = get('market_cap_inr_cr');
      const rev = get('revenue_inr_cr');
      const ebitda = get('ebitda_inr_cr');

      // Convert INR Crore to USD Billion (1 Cr ~ 120K USD, so /83333 for Bn)
      const crToBn = (v) => {
        if (!v) return null;
        const n = Number(v);
        return isNaN(n) ? null : Math.round((n / 83333) * 100) / 100;
      };

      entries.push({
        ticker,
        name: name.replace(/\s+Ltd\.?$/i, '').trim(),
        exchange: 'NSE',
        isin: get('isin') || null,
        sector: get('sector') || null,
        industry: get('subsector') || get('industry') || null,
        country: 'IN',
        marketCapBn: crToBn(mcap),
        revenueBn: crToBn(rev),
        ebitdaBn: crToBn(ebitda),
        employees: get('employees') ? Number(get('employees')) : null,
        dividendYield: num(get('dividend_yield_pct')),
        peRatio: num(get('pe_ratio')),
        priceToBook: num(get('pb_ratio')),
        beta: num(get('beta')),
        esgTotal: num(get('esg_combined')),
        esgEnvironment: num(get('esg_environment')),
        esgSocial: num(get('esg_social')),
        esgGovernance: num(get('esg_governance')),
      });
    } catch (e) {
      // skip parse errors
    }
  }

  entries.sort((a, b) => (b.marketCapBn || 0) - (a.marketCapBn || 0));
  console.log(`  Loaded ${entries.length} Indian companies from BRSR data`);
  return entries;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  EODHD Real Market Data Pull                     ║');
  console.log('║  Exchanges: US · LSE · XETRA · TSE · NSE(local) ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  const all = [];

  // US — largest, get 500
  const us = await pullExchange('US', 'US Stocks (NYSE/NASDAQ)', 500);
  await enrichESG(us, 'US', 50);
  all.push(...us);
  await sleep(500);

  // UK — LSE
  const uk = await pullExchange('LSE', 'UK Stocks (London SE)', 300);
  await enrichESG(uk, 'LSE', 30);
  all.push(...uk);
  await sleep(500);

  // Germany — XETRA
  const de = await pullExchange('XETRA', 'German Stocks (XETRA/DAX)', 200);
  await enrichESG(de, 'XETRA', 20);
  all.push(...de);
  await sleep(500);

  // Japan — TSE
  const jp = await pullExchange('TSE', 'Japanese Stocks (TSE/Nikkei)', 200);
  await enrichESG(jp, 'TSE', 20);
  all.push(...jp);

  // India — local BRSR data
  const india = loadIndianStocks();
  all.push(...india);

  // Deduplicate by ticker+exchange
  const seen = new Set();
  const deduped = all.filter((c) => {
    const key = `${c.ticker}:${c.exchange}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort final by market cap
  deduped.sort((a, b) => (b.marketCapBn || 0) - (a.marketCapBn || 0));

  // Write output
  fs.writeFileSync(OUTPUT, JSON.stringify(deduped, null, 2));
  const sizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n════════════════════════════════════════════════════');
  console.log(`  Total companies: ${deduped.length}`);
  console.log(`  US: ${us.length} | UK: ${uk.length} | DE: ${de.length} | JP: ${jp.length} | IN: ${india.length}`);
  console.log(`  Output: ${OUTPUT}`);
  console.log(`  Size: ${sizeMB} MB | Time: ${elapsed}s`);
  console.log('════════════════════════════════════════════════════');
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
