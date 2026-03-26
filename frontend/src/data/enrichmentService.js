/**
 * ENRICHMENT SERVICE
 * Fetches company data from EODHD, Alpha Vantage, and Yahoo Finance fallback.
 * Returns normalized enrichment payload with per-field source attribution.
 *
 * Source priority: manual > brsr_p6 > eodhd_verified > alpha_vantage > proxy
 *
 * EODHD ticker format: {NSE_TICKER}.NSE  (e.g. RELIANCE.NSE)
 * Alpha Vantage format: {NSE_TICKER}.BSE (e.g. RELIANCE.BSE)
 * INR conversion: API returns absolute INR → divide by 1e7 to get ₹Cr
 */

export const KEY_FIELDS = [
  'market_cap_inr_cr','evic_inr_cr','revenue_inr_cr','total_debt_inr_cr',
  'ebitda_inr_cr','pe_ratio','eps_inr','beta','employees','description',
  'website','industry','esg_env_score','esg_social_score','esg_gov_score',
  'esg_total_score','week52_high_inr','week52_low_inr','scope1_co2e',
  'scope2_co2e','ghg_intensity_tco2e_cr',
];

export const SOURCE_META = {
  manual:        { label:'Manual Entry',     color:'#7c3aed', icon:'✏️',  priority:1 },
  brsr_p6:       { label:'BRSR P6 2024',     color:'#16a34a', icon:'🌿',  priority:2 },
  eodhd:         { label:'EODHD API',        color:'#1b3a5c', icon:'📡',  priority:3 },
  alpha_vantage: { label:'Alpha Vantage',    color:'#2563eb', icon:'📊',  priority:4 },
  master:        { label:'Platform Master',  color:'#6b7280', icon:'📋',  priority:5 },
  proxy:         { label:'Sector Proxy',     color:'#9ca3af', icon:'〰️',  priority:6 },
};

const safeNum = (v, divisor = 1) => {
  const n = parseFloat(v);
  if (isNaN(n) || v === null || v === undefined || v === 'None' || v === 'N/A') return null;
  const result = n / divisor;
  return Math.round(result * 100) / 100;
};

const safeStr = (v, maxLen = 300) => {
  if (!v || typeof v !== 'string' || v === 'None' || v === 'N/A') return null;
  return v.slice(0, maxLen);
};

const getLatestYearly = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  const keys = Object.keys(obj).sort().reverse();
  return keys.length > 0 ? obj[keys[0]] : null;
};

/**
 * Fetches company fundamentals from EODHD API.
 * @param {string} ticker - NSE ticker symbol (e.g. 'RELIANCE')
 * @param {string} apiKey - EODHD API key
 * @returns {Promise<{fields: Object, source: string, error?: string}>}
 */
export async function fetchEODHD(ticker, apiKey) {
  try {
    const url = `https://eodhd.com/api/fundamentals/${ticker}.NSE?api_token=${apiKey}&fmt=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`EODHD HTTP ${res.status}: ${res.statusText}`);
    const d = await res.json();
    if (d.error) throw new Error(`EODHD error: ${d.error}`);

    const h = d.Highlights || {};
    const v = d.Valuation || {};
    const t = d.Technicals || {};
    const g = d.General || {};
    const esg = d.ESGScores || {};
    const ss = d.SharesStats || {};
    const incomeYearly = d.Financials?.Income_Statement?.yearly || {};
    const balanceYearly = d.Financials?.Balance_Sheet?.yearly || {};

    const latestIncome = getLatestYearly(incomeYearly);
    const latestBalance = getLatestYearly(balanceYearly);

    const fields = {};

    const addField = (key, val) => {
      if (val !== null && val !== undefined) fields[key] = val;
    };

    addField('market_cap_inr_cr', safeNum(h.MarketCapitalization, 1e7));
    addField('evic_inr_cr', safeNum(v.EnterpriseValue, 1e7));
    addField('revenue_inr_cr', safeNum(latestIncome?.Revenue, 1e7));
    addField('total_debt_inr_cr', safeNum(latestBalance?.TotalDebt, 1e7));
    addField('ebitda_inr_cr', safeNum(latestIncome?.Ebitda, 1e7));
    addField('net_income_inr_cr', safeNum(latestIncome?.NetIncome, 1e7));
    addField('total_assets_inr_cr', safeNum(latestBalance?.TotalAssets, 1e7));
    addField('total_equity_inr_cr', safeNum(latestBalance?.TotalEquity, 1e7));
    addField('pe_ratio', safeNum(h.PERatio));
    addField('eps_inr', safeNum(h.EarningsShare));
    const divYield = safeNum(h.DividendYield);
    addField('dividend_yield_pct', divYield !== null ? Math.round(divYield * 100 * 100) / 100 : null);
    addField('beta', safeNum(t.Beta));
    addField('employees', g.Employees ? parseInt(g.Employees, 10) || null : null);
    addField('description', safeStr(g.Description, 300));
    addField('website', safeStr(g.WebURL));
    addField('industry', safeStr(g.Industry));
    addField('esg_env_score', safeNum(esg.EnvironmentScore));
    addField('esg_social_score', safeNum(esg.SocialScore));
    addField('esg_gov_score', safeNum(esg.GovernanceScore));
    addField('esg_total_score', safeNum(esg.TotalEsg));
    addField('week52_high_inr', safeNum(t['52WeekHigh']));
    addField('week52_low_inr', safeNum(t['52WeekLow']));
    addField('shares_outstanding', safeNum(ss.SharesOutstanding));

    // Remove null values
    Object.keys(fields).forEach(k => { if (fields[k] === null) delete fields[k]; });

    return { fields, source: 'eodhd' };
  } catch (e) {
    return { error: e.message, source: 'eodhd', fields: {} };
  }
}

/**
 * Fetches company overview from Alpha Vantage API.
 * @param {string} ticker - NSE ticker symbol (e.g. 'RELIANCE')
 * @param {string} apiKey - Alpha Vantage API key
 * @returns {Promise<{fields: Object, source: string, error?: string}>}
 */
export async function fetchAlphaVantage(ticker, apiKey) {
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}.BSE&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}: ${res.statusText}`);
    const d = await res.json();
    if (d['Error Message']) throw new Error(`Alpha Vantage: ${d['Error Message']}`);
    if (d['Note']) throw new Error(`Alpha Vantage rate limit: ${d['Note']}`);
    if (!d.Symbol) throw new Error('Alpha Vantage: no data returned (check ticker or rate limit)');

    const fields = {};
    const addField = (key, val) => {
      if (val !== null && val !== undefined) fields[key] = val;
    };

    addField('market_cap_inr_cr', safeNum(d.MarketCapitalization, 1e7));
    addField('pe_ratio', safeNum(d.PERatio));
    addField('peg_ratio', safeNum(d.PEGRatio));
    addField('book_value_inr', safeNum(d.BookValue));
    addField('eps_inr', safeNum(d.EPS));
    addField('beta', safeNum(d.Beta));
    addField('week52_high_inr', safeNum(d['52WeekHigh']));
    addField('week52_low_inr', safeNum(d['52WeekLow']));
    addField('analyst_target_inr', safeNum(d.AnalystTargetPrice));
    addField('50day_ma_inr', safeNum(d['50DayMovingAverage']));
    addField('200day_ma_inr', safeNum(d['200DayMovingAverage']));
    addField('revenue_per_share_inr', safeNum(d.RevenuePerShareTTM));
    addField('ebitda_inr_cr', safeNum(d.EBITDA, 1e7));
    addField('shares_outstanding', safeNum(d.SharesOutstanding));
    const divYield = safeNum(d.DividendYield);
    addField('dividend_yield_pct', divYield !== null ? Math.round(divYield * 100 * 100) / 100 : null);
    addField('description', safeStr(d.Description, 300));
    addField('industry', safeStr(d.Industry));

    // Remove null values
    Object.keys(fields).forEach(k => { if (fields[k] === null) delete fields[k]; });

    return { fields, source: 'alpha_vantage' };
  } catch (e) {
    return { error: e.message, source: 'alpha_vantage', fields: {} };
  }
}

/**
 * Merges enrichment data from multiple sources into a unified profile.
 * Priority: manualOverrides > eodhd > alpha_vantage
 *
 * @param {Object} masterRecord - base company record from COMPANY_MASTER
 * @param {Object} eodhd - result from fetchEODHD
 * @param {Object} alphaVantage - result from fetchAlphaVantage
 * @param {Object} manualOverrides - user-entered overrides keyed by field name
 * @returns {Object} merged profile with per-field { value, source, fetched_at, confidence }
 */
export function mergeEnrichment(masterRecord, eodhd, alphaVantage, manualOverrides = {}) {
  const now = new Date().toISOString();
  const merged = {};
  const sourcesUsed = new Set();

  const addEnrichedField = (key, value, source, confidence) => {
    if (value === null || value === undefined) return;
    merged[key] = { value, source, fetched_at: now, confidence };
    sourcesUsed.add(source);
  };

  // All fields that may come from various sources
  const allFieldKeys = new Set([
    ...Object.keys(eodhd?.fields || {}),
    ...Object.keys(alphaVantage?.fields || {}),
    ...Object.keys(manualOverrides || {}),
  ]);

  // Fields where EODHD takes priority over Alpha Vantage
  const eodhdPriorityFields = new Set([
    'market_cap_inr_cr','evic_inr_cr','revenue_inr_cr','total_debt_inr_cr',
    'ebitda_inr_cr','net_income_inr_cr','total_assets_inr_cr','total_equity_inr_cr',
    'pe_ratio','eps_inr','dividend_yield_pct','beta','employees','description',
    'website','industry','esg_env_score','esg_social_score','esg_gov_score',
    'esg_total_score','week52_high_inr','week52_low_inr','shares_outstanding',
  ]);

  for (const key of allFieldKeys) {
    // Priority 1: manual override
    if (manualOverrides && manualOverrides[key] !== undefined && manualOverrides[key] !== null && manualOverrides[key] !== '') {
      addEnrichedField(key, manualOverrides[key], 'manual', 'high');
      continue;
    }

    // Priority 2: EODHD (for most fields)
    if (eodhdPriorityFields.has(key) && eodhd?.fields?.[key] !== undefined) {
      addEnrichedField(key, eodhd.fields[key], 'eodhd', 'high');
      continue;
    }

    // Priority 3: Alpha Vantage
    if (alphaVantage?.fields?.[key] !== undefined) {
      addEnrichedField(key, alphaVantage.fields[key], 'alpha_vantage', 'medium');
      continue;
    }

    // Fallback: EODHD for non-priority fields
    if (eodhd?.fields?.[key] !== undefined) {
      addEnrichedField(key, eodhd.fields[key], 'eodhd', 'high');
    }
  }

  // Calculate enrichment score — % of KEY_FIELDS that have non-null values
  const filledKeyFields = KEY_FIELDS.filter(k => {
    if (merged[k]) return true;
    // Also check master record for base fields
    if (masterRecord && masterRecord[k] !== undefined && masterRecord[k] !== null) return true;
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
