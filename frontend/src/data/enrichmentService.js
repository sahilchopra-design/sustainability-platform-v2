/**
 * ENRICHMENT SERVICE v2.0
 * Full EODHD All-In-One integration across 14 exchanges
 * + Alpha Vantage fallback + BRSR integration
 *
 * Endpoints implemented:
 *  1. Fundamentals      — per company, 80+ fields across all sections
 *  2. Bulk Fundamentals — entire exchange in 1 API call
 *  3. EOD Prices        — historical OHLCV with adjusted close
 *  4. Bond Fundamentals — via ISIN lookup
 *  5. ESG Scores        — from fundamentals response (E/S/G sub-pillars)
 *  6. Macro/Economic    — GDP, inflation, unemployment per country
 *  7. Stock Screener    — 50+ filter combinations
 *  8. Calendar          — earnings, dividends, IPOs, splits
 *  9. Insider Txns      — from fundamentals (SEC Form 4 equivalent)
 * 10. Technical Ind.    — SMA, EMA, RSI, MACD, Bollinger, Stochastic
 *
 * Source priority: manual > brsr_p6 > eodhd_verified > alpha_vantage > proxy
 */

/* ═══════════════════════════════════════════════════════════════════════════
   EXCHANGE MAP — ticker suffix + bulk code for every supported exchange
   ═══════════════════════════════════════════════════════════════════════════ */
export const EODHD_EXCHANGE_MAP = {
  'NSE/BSE':     { suffix: 'NSE',   bulk_code: 'NSE',   name: 'National Stock Exchange India',  currency: 'INR', country: 'IN' },
  'NYSE/NASDAQ': { suffix: 'US',    bulk_code: 'US',    name: 'US Exchanges',                   currency: 'USD', country: 'US' },
  'LSE':         { suffix: 'LSE',   bulk_code: 'LSE',   name: 'London Stock Exchange',          currency: 'GBP', country: 'GB' },
  'XETRA':       { suffix: 'XETRA', bulk_code: 'XETRA', name: 'Frankfurt / Xetra',             currency: 'EUR', country: 'DE' },
  'EURONEXT':    { suffix: 'PA',    bulk_code: 'PA',    name: 'Euronext Paris',                 currency: 'EUR', country: 'FR' },
  'TSE':         { suffix: 'TSE',   bulk_code: 'TSE',   name: 'Tokyo Stock Exchange',           currency: 'JPY', country: 'JP' },
  'HKEX':        { suffix: 'HK',    bulk_code: 'HK',    name: 'Hong Kong Exchange',             currency: 'HKD', country: 'HK' },
  'ASX':         { suffix: 'AU',    bulk_code: 'AU',    name: 'Australian Securities Exchange', currency: 'AUD', country: 'AU' },
  'SGX':         { suffix: 'SG',    bulk_code: 'SG',    name: 'Singapore Exchange',             currency: 'SGD', country: 'SG' },
  'KRX':         { suffix: 'KO',    bulk_code: 'KO',    name: 'Korea Exchange',                 currency: 'KRW', country: 'KR' },
  'SSE/SZSE':    { suffix: 'SHG',   bulk_code: 'SHG',   name: 'Shanghai + Shenzhen',            currency: 'CNY', country: 'CN' },
  'B3':          { suffix: 'SA',    bulk_code: 'SA',    name: 'B3 Sao Paulo',                   currency: 'BRL', country: 'BR' },
  'JSE':         { suffix: 'JSE',   bulk_code: 'JSE',   name: 'Johannesburg SE',                currency: 'ZAR', country: 'ZA' },
  'TSX':         { suffix: 'TO',    bulk_code: 'TO',    name: 'Toronto SE',                     currency: 'CAD', country: 'CA' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   KEY FIELDS — expanded from 20 to 80+
   ═══════════════════════════════════════════════════════════════════════════ */
export const KEY_FIELDS = [
  // General
  'name', 'description', 'sector', 'industry', 'exchange', 'currency', 'country',
  'isin', 'cusip', 'address', 'phone', 'website', 'logo_url', 'employees',
  'fiscal_year_end', 'ipo_date',
  // Highlights
  'market_cap', 'ebitda', 'pe_ratio', 'peg_ratio', 'wall_street_target',
  'book_value', 'dividend_share', 'dividend_yield_pct', 'eps', 'eps_est_current_yr',
  'eps_est_next_yr', 'profit_margin', 'operating_margin', 'roa', 'roe',
  'revenue_ttm', 'revenue_per_share_ttm', 'quarterly_rev_growth_yoy',
  'gross_profit_ttm', 'diluted_eps_ttm',
  // Valuation
  'trailing_pe', 'forward_pe', 'price_sales_ttm', 'price_book_mrq',
  'enterprise_value', 'ev_revenue', 'ev_ebitda',
  // Technicals
  'beta', 'week52_high', 'week52_low', 'ma_50day', 'ma_200day',
  'short_ratio', 'short_pct_float',
  // SharesStats
  'shares_outstanding', 'shares_float', 'pct_insiders', 'pct_institutions',
  // ESG
  'esg_total', 'esg_env_score', 'esg_social_score', 'esg_gov_score',
  'esg_controversy', 'esg_rating_date',
  // Latest annual financials
  'revenue', 'cost_of_revenue', 'gross_profit', 'operating_income',
  'net_income', 'total_assets', 'total_debt', 'total_equity',
  'operating_cashflow', 'capex', 'free_cashflow',
  // Analysts
  'analyst_target', 'analyst_strong_buy', 'analyst_buy', 'analyst_hold',
  'analyst_sell', 'analyst_strong_sell',
  // Legacy compatibility (INR-specific — populated only for NSE/BSE)
  'market_cap_inr_cr', 'evic_inr_cr', 'revenue_inr_cr', 'total_debt_inr_cr',
  'ebitda_inr_cr', 'net_income_inr_cr', 'total_assets_inr_cr', 'total_equity_inr_cr',
  'eps_inr', 'week52_high_inr', 'week52_low_inr',
  // Climate / BRSR
  'scope1_co2e', 'scope2_co2e', 'ghg_intensity_tco2e_cr',
];

/* ═══════════════════════════════════════════════════════════════════════════
   SOURCE META — unchanged interface, used by UI components
   ═══════════════════════════════════════════════════════════════════════════ */
export const SOURCE_META = {
  manual:        { label: 'Manual Entry',    color: '#7c3aed', icon: '\u270F\uFE0F',  priority: 1 },
  brsr_p6:       { label: 'BRSR P6 2024',    color: '#16a34a', icon: '\uD83C\uDF3F',  priority: 2 },
  eodhd:         { label: 'EODHD API',       color: '#1b3a5c', icon: '\uD83D\uDCE1',  priority: 3 },
  alpha_vantage: { label: 'Alpha Vantage',   color: '#2563eb', icon: '\uD83D\uDCCA',  priority: 4 },
  master:        { label: 'Platform Master', color: '#6b7280', icon: '\uD83D\uDCCB',  priority: 5 },
  proxy:         { label: 'Sector Proxy',    color: '#9ca3af', icon: '\u3030\uFE0F',  priority: 6 },
};

/* ═══════════════════════════════════════════════════════════════════════════
   API KEY MANAGEMENT
   ═══════════════════════════════════════════════════════════════════════════ */
const EODHD_KEY_SLOT  = 'ra_eodhd_api_key';
const AV_KEY_SLOT     = 'ra_alpha_vantage_api_key';

export function getAPIKey()          { return localStorage.getItem(EODHD_KEY_SLOT) || ''; }
export function setAPIKey(key)       { localStorage.setItem(EODHD_KEY_SLOT, key); }
export function getAVKey()           { return localStorage.getItem(AV_KEY_SLOT) || ''; }
export function setAVKey(key)        { localStorage.setItem(AV_KEY_SLOT, key); }

/* ═══════════════════════════════════════════════════════════════════════════
   CACHE — localStorage with per-key TTL
   ═══════════════════════════════════════════════════════════════════════════ */
const CACHE_KEY = 'ra_eodhd_cache_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function _cacheRead(key) {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { delete store[key]; localStorage.setItem(CACHE_KEY, JSON.stringify(store)); return null; }
    return entry.data;
  } catch { return null; }
}

function _cacheWrite(key, data) {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    store[key] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch { /* quota exceeded — silently skip */ }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

/* ═══════════════════════════════════════════════════════════════════════════
   USAGE TRACKING
   ═══════════════════════════════════════════════════════════════════════════ */
const USAGE_KEY = 'ra_eodhd_usage_v1';

function _trackCall(endpoint) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const usage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    if (usage.date !== today) { usage.date = today; usage.calls = {}; usage.total = 0; }
    usage.calls[endpoint] = (usage.calls[endpoint] || 0) + 1;
    usage.total += 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch { /* ignore */ }
}

export function getAPIUsageStats() {
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    const cacheStore = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return {
      date: usage.date || null,
      callsToday: usage.total || 0,
      byEndpoint: usage.calls || {},
      cacheEntries: Object.keys(cacheStore).length,
    };
  } catch { return { date: null, callsToday: 0, byEndpoint: {}, cacheEntries: 0 }; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const safeNum = (v, divisor = 1) => {
  const n = parseFloat(v);
  if (isNaN(n) || v === null || v === undefined || v === 'None' || v === 'N/A') return null;
  return Math.round((n / divisor) * 100) / 100;
};

const safeStr = (v, maxLen = 500) => {
  if (!v || typeof v !== 'string' || v === 'None' || v === 'N/A') return null;
  return v.slice(0, maxLen);
};

const safeInt = (v) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
};

const getLatestEntry = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const keys = Object.keys(obj).sort().reverse();
  return keys.length > 0 ? obj[keys[0]] : null;
};

function _resolveSuffix(exchange) {
  if (!exchange) return 'US';
  const entry = EODHD_EXCHANGE_MAP[exchange];
  if (entry) return entry.suffix;
  // If raw suffix passed directly (e.g. 'NSE', 'US'), accept it
  const allSuffixes = Object.values(EODHD_EXCHANGE_MAP).map(e => e.suffix);
  if (allSuffixes.includes(exchange)) return exchange;
  return 'US';
}

function _resolveBulkCode(exchange) {
  const entry = EODHD_EXCHANGE_MAP[exchange];
  return entry ? entry.bulk_code : exchange;
}

function _isINR(exchange) {
  const entry = EODHD_EXCHANGE_MAP[exchange];
  return entry ? entry.currency === 'INR' : false;
}

async function _apiFetch(url, cacheKey, endpoint) {
  if (cacheKey) {
    const cached = _cacheRead(cacheKey);
    if (cached) return cached;
  }
  _trackCall(endpoint || 'unknown');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (data && data.error) throw new Error(`API error: ${data.error}`);
  if (cacheKey) _cacheWrite(cacheKey, data);
  return data;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. COMPANY FUNDAMENTALS — any exchange, 80+ fields
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchFundamentals(ticker, exchange = 'NYSE/NASDAQ') {
  const suffix = _resolveSuffix(exchange);
  const apiKey = getAPIKey();
  if (!apiKey) return { fields: {}, source: 'eodhd', error: 'No EODHD API key configured' };

  const ck = `fund_${ticker}_${suffix}`;
  try {
    const url = `https://eodhd.com/api/fundamentals/${ticker}.${suffix}?api_token=${apiKey}&fmt=json`;
    const d = await _apiFetch(url, ck, 'fundamentals');

    const g   = d.General || {};
    const h   = d.Highlights || {};
    const val = d.Valuation || {};
    const t   = d.Technicals || {};
    const ss  = d.SharesStats || {};
    const esg = d.ESGScores || {};
    const an  = d.Analysts || {};
    const ins = d.InsiderTransactions || {};
    const latestIncome  = getLatestEntry(d.Financials?.Income_Statement?.yearly);
    const latestBalance = getLatestEntry(d.Financials?.Balance_Sheet?.yearly);
    const latestCash    = getLatestEntry(d.Financials?.Cash_Flow?.yearly);

    const f = {};
    const add = (k, v) => { if (v !== null && v !== undefined) f[k] = v; };

    // General
    add('name',            safeStr(g.Name));
    add('description',     safeStr(g.Description, 500));
    add('sector',          safeStr(g.Sector));
    add('industry',        safeStr(g.Industry));
    add('exchange',        safeStr(g.Exchange));
    add('currency',        safeStr(g.CurrencyCode));
    add('country',         safeStr(g.CountryISO));
    add('isin',            safeStr(g.ISIN));
    add('cusip',           safeStr(g.CUSIP));
    add('address',         safeStr(g.Address));
    add('phone',           safeStr(g.Phone));
    add('website',         safeStr(g.WebURL));
    add('logo_url',        safeStr(g.LogoURL));
    add('employees',       safeInt(g.FullTimeEmployees || g.Employees));
    add('fiscal_year_end', safeStr(g.FiscalYearEnd));
    add('ipo_date',        safeStr(g.IPODate));

    // Highlights
    add('market_cap',                safeNum(h.MarketCapitalization));
    add('ebitda',                    safeNum(h.EBITDA));
    add('pe_ratio',                  safeNum(h.PERatio));
    add('peg_ratio',                 safeNum(h.PEGRatio));
    add('wall_street_target',        safeNum(h.WallStreetTargetPrice));
    add('book_value',                safeNum(h.BookValue));
    add('dividend_share',            safeNum(h.DividendShare));
    add('dividend_yield_pct',        safeNum(h.DividendYield) !== null ? Math.round(safeNum(h.DividendYield) * 100 * 100) / 100 : null);
    add('eps',                       safeNum(h.EarningsShare));
    add('eps_est_current_yr',        safeNum(h.EPSEstimateCurrentYear));
    add('eps_est_next_yr',           safeNum(h.EPSEstimateNextYear));
    add('profit_margin',             safeNum(h.ProfitMargin));
    add('operating_margin',          safeNum(h.OperatingMarginTTM));
    add('roa',                       safeNum(h.ReturnOnAssetsTTM));
    add('roe',                       safeNum(h.ReturnOnEquityTTM));
    add('revenue_ttm',               safeNum(h.RevenueTTM));
    add('revenue_per_share_ttm',     safeNum(h.RevenuePerShareTTM));
    add('quarterly_rev_growth_yoy',  safeNum(h.QuarterlyRevenueGrowthYOY));
    add('gross_profit_ttm',          safeNum(h.GrossProfitTTM));
    add('diluted_eps_ttm',           safeNum(h.DilutedEpsTTM));

    // Valuation
    add('trailing_pe',      safeNum(val.TrailingPE));
    add('forward_pe',       safeNum(val.ForwardPE));
    add('price_sales_ttm',  safeNum(val.PriceSalesTTM));
    add('price_book_mrq',   safeNum(val.PriceBookMRQ));
    add('enterprise_value', safeNum(val.EnterpriseValue));
    add('ev_revenue',       safeNum(val.EnterpriseValueRevenue));
    add('ev_ebitda',        safeNum(val.EnterpriseValueEbitda));

    // Technicals
    add('beta',            safeNum(t.Beta));
    add('week52_high',     safeNum(t['52WeekHigh']));
    add('week52_low',      safeNum(t['52WeekLow']));
    add('ma_50day',        safeNum(t['50DayMA']));
    add('ma_200day',       safeNum(t['200DayMA']));
    add('short_ratio',     safeNum(t.ShortRatio));
    add('short_pct_float', safeNum(t.ShortPercent));

    // Shares stats
    add('shares_outstanding', safeNum(ss.SharesOutstanding));
    add('shares_float',       safeNum(ss.SharesFloat));
    add('pct_insiders',       safeNum(ss.PercentInsiders));
    add('pct_institutions',   safeNum(ss.PercentInstitutions));

    // ESG
    add('esg_total',        safeNum(esg.TotalEsg));
    add('esg_env_score',    safeNum(esg.EnvironmentScore));
    add('esg_social_score', safeNum(esg.SocialScore));
    add('esg_gov_score',    safeNum(esg.GovernanceScore));
    add('esg_controversy',  safeNum(esg.ControversyLevel));
    add('esg_rating_date',  safeStr(esg.RatingDate || esg.ESGRatingDate));

    // Latest annual financials
    add('revenue',          safeNum(latestIncome?.totalRevenue || latestIncome?.Revenue));
    add('cost_of_revenue',  safeNum(latestIncome?.costOfRevenue || latestIncome?.CostOfRevenue));
    add('gross_profit',     safeNum(latestIncome?.grossProfit || latestIncome?.GrossProfit));
    add('operating_income', safeNum(latestIncome?.operatingIncome || latestIncome?.OperatingIncome));
    add('net_income',       safeNum(latestIncome?.netIncome || latestIncome?.NetIncome));
    add('total_assets',     safeNum(latestBalance?.totalAssets || latestBalance?.TotalAssets));
    add('total_debt',       safeNum(latestBalance?.shortLongTermDebtTotal || latestBalance?.TotalDebt));
    add('total_equity',     safeNum(latestBalance?.totalStockholderEquity || latestBalance?.TotalEquity));
    add('operating_cashflow', safeNum(latestCash?.totalCashFromOperatingActivities || latestCash?.OperatingCashFlow));
    add('capex',              safeNum(latestCash?.capitalExpenditures || latestCash?.CapitalExpenditures));
    if (f.operating_cashflow != null && f.capex != null) {
      add('free_cashflow', Math.round((f.operating_cashflow - Math.abs(f.capex)) * 100) / 100);
    }

    // Analysts
    add('analyst_target',      safeNum(an.TargetPrice));
    add('analyst_strong_buy',  safeInt(an.StrongBuy));
    add('analyst_buy',         safeInt(an.Buy));
    add('analyst_hold',        safeInt(an.Hold));
    add('analyst_sell',        safeInt(an.Sell));
    add('analyst_strong_sell', safeInt(an.StrongSell));

    // Insider transactions — last 10
    if (typeof ins === 'object') {
      const txnArr = Array.isArray(ins) ? ins : Object.values(ins);
      f.insider_transactions = txnArr.slice(0, 10).map(tx => ({
        date: tx.date || tx.Date || null,
        owner: tx.ownerName || tx.OwnerName || null,
        type: tx.transactionType || tx.TransactionType || null,
        shares: safeNum(tx.shares || tx.Shares),
        value: safeNum(tx.value || tx.Value),
      }));
    }

    // INR legacy fields (only for Indian exchanges — divide by 1e7 for Crores)
    if (_isINR(exchange)) {
      add('market_cap_inr_cr',   safeNum(h.MarketCapitalization, 1e7));
      add('evic_inr_cr',         safeNum(val.EnterpriseValue, 1e7));
      add('revenue_inr_cr',      safeNum(latestIncome?.totalRevenue || latestIncome?.Revenue, 1e7));
      add('total_debt_inr_cr',   safeNum(latestBalance?.shortLongTermDebtTotal || latestBalance?.TotalDebt, 1e7));
      add('ebitda_inr_cr',       safeNum(latestIncome?.Ebitda || h.EBITDA, 1e7));
      add('net_income_inr_cr',   safeNum(latestIncome?.netIncome || latestIncome?.NetIncome, 1e7));
      add('total_assets_inr_cr', safeNum(latestBalance?.totalAssets || latestBalance?.TotalAssets, 1e7));
      add('total_equity_inr_cr', safeNum(latestBalance?.totalStockholderEquity || latestBalance?.TotalEquity, 1e7));
      add('eps_inr',             safeNum(h.EarningsShare));
      add('week52_high_inr',     safeNum(t['52WeekHigh']));
      add('week52_low_inr',      safeNum(t['52WeekLow']));
    }

    // Strip nulls
    Object.keys(f).forEach(k => { if (f[k] === null || f[k] === undefined) delete f[k]; });

    return { fields: f, source: 'eodhd', raw: d };
  } catch (e) {
    return { fields: {}, source: 'eodhd', error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. BULK FUNDAMENTALS — entire exchange in 1 call
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchBulkFundamentals(exchange = 'NYSE/NASDAQ') {
  const code = _resolveBulkCode(exchange);
  const apiKey = getAPIKey();
  if (!apiKey) return { data: [], error: 'No EODHD API key configured' };

  const ck = `bulk_${code}`;
  try {
    const url = `https://eodhd.com/api/bulk-fundamentals/${code}?api_token=${apiKey}&fmt=json`;
    const raw = await _apiFetch(url, ck, 'bulk-fundamentals');
    const arr = Array.isArray(raw) ? raw : Object.values(raw);
    return { data: arr, exchange, count: arr.length };
  } catch (e) {
    return { data: [], exchange, error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. EOD HISTORICAL PRICES
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchEODPrices(ticker, exchange = 'NYSE/NASDAQ', from = null, to = null) {
  const suffix = _resolveSuffix(exchange);
  const apiKey = getAPIKey();
  if (!apiKey) return { prices: [], error: 'No EODHD API key configured' };

  let url = `https://eodhd.com/api/eod/${ticker}.${suffix}?api_token=${apiKey}&fmt=json`;
  if (from) url += `&from=${from}`;
  if (to)   url += `&to=${to}`;

  const ck = `eod_${ticker}_${suffix}_${from || 'all'}_${to || 'now'}`;
  try {
    const data = await _apiFetch(url, ck, 'eod-prices');
    return { prices: Array.isArray(data) ? data : [], ticker, exchange };
  } catch (e) {
    return { prices: [], error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. BOND FUNDAMENTALS — via ISIN
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchBondFundamentals(isin) {
  const apiKey = getAPIKey();
  if (!apiKey) return { fields: {}, error: 'No EODHD API key configured' };
  if (!isin) return { fields: {}, error: 'ISIN is required' };

  const ck = `bond_${isin}`;
  try {
    const url = `https://eodhd.com/api/bond-fundamentals?isin=${isin}&api_token=${apiKey}&fmt=json`;
    const d = await _apiFetch(url, ck, 'bond-fundamentals');
    const f = {};
    const add = (k, v) => { if (v !== null && v !== undefined) f[k] = v; };
    add('bond_name',      safeStr(d.Name));
    add('coupon_rate',    safeNum(d.CouponRate));
    add('maturity_date',  safeStr(d.MaturityDate));
    add('face_value',     safeNum(d.FaceValue));
    add('issue_date',     safeStr(d.IssueDate));
    add('rating',         safeStr(d.Rating));
    add('bond_currency',  safeStr(d.Currency));
    add('bond_sector',    safeStr(d.Sector));
    add('bond_type',      safeStr(d.BondType));
    add('yield_to_maturity', safeNum(d.YieldToMaturity));
    add('issuer',         safeStr(d.Issuer));
    return { fields: f, source: 'eodhd', raw: d };
  } catch (e) {
    return { fields: {}, error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. ESG SCORES (convenience wrapper — data comes from fundamentals)
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchESGScores(ticker, exchange = 'NYSE/NASDAQ') {
  const result = await fetchFundamentals(ticker, exchange);
  if (result.error) return { fields: {}, error: result.error };
  const f = result.fields;
  return {
    fields: {
      esg_total:        f.esg_total        ?? null,
      esg_env_score:    f.esg_env_score    ?? null,
      esg_social_score: f.esg_social_score ?? null,
      esg_gov_score:    f.esg_gov_score    ?? null,
      esg_controversy:  f.esg_controversy  ?? null,
      esg_rating_date:  f.esg_rating_date  ?? null,
    },
    source: 'eodhd',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. MACRO ECONOMIC DATA
   ═══════════════════════════════════════════════════════════════════════════ */
const MACRO_INDICATORS = [
  'gdp_current_usd', 'inflation_consumer_prices_annual', 'unemployment_total',
  'population_total', 'co2_emissions_kt', 'renewable_energy_consumption',
  'forest_area_pct', 'gdp_per_capita_usd', 'gni_per_capita_usd',
  'real_interest_rate', 'current_account_balance',
];

export { MACRO_INDICATORS };

export async function fetchMacroData(countryCode, indicator = 'gdp_current_usd') {
  const apiKey = getAPIKey();
  if (!apiKey) return { data: [], error: 'No EODHD API key configured' };

  const ck = `macro_${countryCode}_${indicator}`;
  try {
    const url = `https://eodhd.com/api/macro-indicator/${countryCode}?api_token=${apiKey}&fmt=json&indicator=${indicator}`;
    const data = await _apiFetch(url, ck, 'macro-indicator');
    return { data: Array.isArray(data) ? data : [], country: countryCode, indicator };
  } catch (e) {
    return { data: [], error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. STOCK SCREENER
   ═══════════════════════════════════════════════════════════════════════════ */
export async function screenStocks(filters = [], sort = null, limit = 100, offset = 0) {
  const apiKey = getAPIKey();
  if (!apiKey) return { data: [], error: 'No EODHD API key configured' };

  let url = `https://eodhd.com/api/screener?api_token=${apiKey}&limit=${limit}&offset=${offset}`;
  if (filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  if (sort) url += `&sort=${encodeURIComponent(sort)}`;

  try {
    const data = await _apiFetch(url, null, 'screener');
    return { data: data?.data || data || [], total: data?.count || 0 };
  } catch (e) {
    return { data: [], error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. CALENDAR EVENTS — earnings, dividends, IPOs, splits
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchCalendar(type = 'earnings', from = null, to = null) {
  const apiKey = getAPIKey();
  if (!apiKey) return { events: [], error: 'No EODHD API key configured' };
  const validTypes = ['earnings', 'dividends', 'ipos', 'splits'];
  if (!validTypes.includes(type)) return { events: [], error: `Invalid calendar type. Use: ${validTypes.join(', ')}` };

  let url = `https://eodhd.com/api/calendar/${type}?api_token=${apiKey}&fmt=json`;
  if (from) url += `&from=${from}`;
  if (to)   url += `&to=${to}`;

  const ck = `cal_${type}_${from || 'all'}_${to || 'now'}`;
  try {
    const data = await _apiFetch(url, ck, `calendar-${type}`);
    const events = data?.earnings || data?.dividends || data?.ipos || data?.splits || (Array.isArray(data) ? data : []);
    return { events, type };
  } catch (e) {
    return { events: [], error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. INSIDER TRANSACTIONS (convenience — from fundamentals)
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchInsiderTransactions(ticker, exchange = 'NYSE/NASDAQ') {
  const result = await fetchFundamentals(ticker, exchange);
  if (result.error) return { transactions: [], error: result.error };
  return { transactions: result.fields.insider_transactions || [], source: 'eodhd' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. TECHNICAL INDICATORS
   ═══════════════════════════════════════════════════════════════════════════ */
const VALID_TECHNICALS = ['sma', 'ema', 'rsi', 'macd', 'bbands', 'stoch', 'adx', 'cci', 'atr', 'wma'];

export async function fetchTechnicals(ticker, exchange = 'NYSE/NASDAQ', indicator = 'sma', period = 50) {
  const suffix = _resolveSuffix(exchange);
  const apiKey = getAPIKey();
  if (!apiKey) return { data: [], error: 'No EODHD API key configured' };
  if (!VALID_TECHNICALS.includes(indicator)) return { data: [], error: `Invalid indicator. Use: ${VALID_TECHNICALS.join(', ')}` };

  const ck = `tech_${ticker}_${suffix}_${indicator}_${period}`;
  try {
    const url = `https://eodhd.com/api/technical/${ticker}.${suffix}?api_token=${apiKey}&function=${indicator}&period=${period}&fmt=json`;
    const data = await _apiFetch(url, ck, 'technical');
    return { data: Array.isArray(data) ? data : [], indicator, period, ticker, exchange };
  } catch (e) {
    return { data: [], error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALPHA VANTAGE FALLBACK — backward compatible
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchAlphaVantage(ticker, apiKey = null, exchange = 'NSE/BSE') {
  const key = apiKey || getAVKey();
  if (!key) return { fields: {}, source: 'alpha_vantage', error: 'No Alpha Vantage API key' };

  // AV uses .BSE for India, bare ticker for US
  let avTicker = ticker;
  if (exchange === 'NSE/BSE') avTicker = `${ticker}.BSE`;
  else if (exchange === 'LSE') avTicker = `${ticker}.LON`;
  else if (exchange === 'TSX') avTicker = `${ticker}.TRT`;

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${avTicker}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}: ${res.statusText}`);
    const d = await res.json();
    if (d['Error Message']) throw new Error(`Alpha Vantage: ${d['Error Message']}`);
    if (d['Note']) throw new Error(`Alpha Vantage rate limit: ${d['Note']}`);
    if (!d.Symbol) throw new Error('Alpha Vantage: no data returned');

    const f = {};
    const add = (k, v) => { if (v !== null && v !== undefined) f[k] = v; };

    add('market_cap',       safeNum(d.MarketCapitalization));
    add('pe_ratio',         safeNum(d.PERatio));
    add('peg_ratio',        safeNum(d.PEGRatio));
    add('book_value',       safeNum(d.BookValue));
    add('eps',              safeNum(d.EPS));
    add('beta',             safeNum(d.Beta));
    add('week52_high',      safeNum(d['52WeekHigh']));
    add('week52_low',       safeNum(d['52WeekLow']));
    add('analyst_target',   safeNum(d.AnalystTargetPrice));
    add('ma_50day',         safeNum(d['50DayMovingAverage']));
    add('ma_200day',        safeNum(d['200DayMovingAverage']));
    add('revenue_per_share_ttm', safeNum(d.RevenuePerShareTTM));
    add('ebitda',           safeNum(d.EBITDA));
    add('shares_outstanding', safeNum(d.SharesOutstanding));
    const divYield = safeNum(d.DividendYield);
    add('dividend_yield_pct', divYield !== null ? Math.round(divYield * 100 * 100) / 100 : null);
    add('description',      safeStr(d.Description, 500));
    add('industry',         safeStr(d.Industry));
    add('sector',           safeStr(d.Sector));

    // Legacy INR fields for Indian exchange
    if (_isINR(exchange)) {
      add('market_cap_inr_cr', safeNum(d.MarketCapitalization, 1e7));
      add('ebitda_inr_cr',     safeNum(d.EBITDA, 1e7));
      add('eps_inr',           safeNum(d.EPS));
      add('week52_high_inr',   safeNum(d['52WeekHigh']));
      add('week52_low_inr',    safeNum(d['52WeekLow']));
    }

    Object.keys(f).forEach(k => { if (f[k] === null) delete f[k]; });
    return { fields: f, source: 'alpha_vantage' };
  } catch (e) {
    return { error: e.message, source: 'alpha_vantage', fields: {} };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   BACKWARD COMPAT — fetchEODHD(ticker, apiKey) still works
   Calls fetchFundamentals for NSE/BSE with the provided key
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchEODHD(ticker, apiKey) {
  // Temporarily set the key if passed explicitly
  const prevKey = getAPIKey();
  if (apiKey) setAPIKey(apiKey);
  const result = await fetchFundamentals(ticker, 'NSE/BSE');
  if (apiKey && prevKey !== apiKey) setAPIKey(prevKey);
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNIFIED ENRICHMENT — replaces per-exchange logic
   ═══════════════════════════════════════════════════════════════════════════ */
export async function enrichCompany(ticker, exchange = 'NYSE/NASDAQ') {
  const eodhd = await fetchFundamentals(ticker, exchange);
  return {
    ticker,
    exchange,
    fields: eodhd.fields,
    source: eodhd.source,
    error: eodhd.error || null,
    fetched_at: new Date().toISOString(),
    field_count: Object.keys(eodhd.fields).length,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   BULK ENRICHMENT — entire exchange
   ═══════════════════════════════════════════════════════════════════════════ */
export async function enrichExchange(exchange = 'NYSE/NASDAQ') {
  const result = await fetchBulkFundamentals(exchange);
  return {
    exchange,
    companies: result.data,
    count: result.count || result.data.length,
    error: result.error || null,
    fetched_at: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MERGE ENRICHMENT — multi-source merge with per-field attribution
   ═══════════════════════════════════════════════════════════════════════════ */
export function mergeEnrichment(masterRecord, eodhd, alphaVantage, manualOverrides = {}) {
  const now = new Date().toISOString();
  const merged = {};
  const sourcesUsed = new Set();

  const addEnrichedField = (key, value, source, confidence) => {
    if (value === null || value === undefined) return;
    merged[key] = { value, source, fetched_at: now, confidence };
    sourcesUsed.add(source);
  };

  const allFieldKeys = new Set([
    ...Object.keys(eodhd?.fields || {}),
    ...Object.keys(alphaVantage?.fields || {}),
    ...Object.keys(manualOverrides || {}),
  ]);

  for (const key of allFieldKeys) {
    // Priority 1: manual override
    if (manualOverrides?.[key] !== undefined && manualOverrides[key] !== null && manualOverrides[key] !== '') {
      addEnrichedField(key, manualOverrides[key], 'manual', 'high');
      continue;
    }
    // Priority 2: EODHD
    if (eodhd?.fields?.[key] !== undefined) {
      addEnrichedField(key, eodhd.fields[key], 'eodhd', 'high');
      continue;
    }
    // Priority 3: Alpha Vantage
    if (alphaVantage?.fields?.[key] !== undefined) {
      addEnrichedField(key, alphaVantage.fields[key], 'alpha_vantage', 'medium');
    }
  }

  const filledKeyFields = KEY_FIELDS.filter(k => {
    if (merged[k]) return true;
    if (masterRecord?.[k] !== undefined && masterRecord[k] !== null) return true;
    return false;
  });
  const enrichment_score = Math.round((filledKeyFields.length / KEY_FIELDS.length) * 100);

  return {
    ...merged,
    enrichment_score,
    data_sources_used: Array.from(sourcesUsed),
    merged_at: now,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   API HEALTH CHECK
   ═══════════════════════════════════════════════════════════════════════════ */
export async function checkAPIHealth() {
  const apiKey = getAPIKey();
  if (!apiKey) return { ok: false, error: 'No API key configured' };

  try {
    const url = `https://eodhd.com/api/user/?api_token=${apiKey}&fmt=json`;
    _trackCall('health-check');
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return {
      ok: true,
      plan: data.subscriptionType || data.apiRequests || 'unknown',
      dailyLimit: data.dailyRateLimit || null,
      callsUsed: data.apiRequests || null,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
