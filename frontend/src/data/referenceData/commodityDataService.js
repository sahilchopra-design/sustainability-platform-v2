/**
 * Commodity Data Service — Wires EODHD + Alpha Vantage commodity prices
 * into the platform's reference data infrastructure.
 *
 * Usage: import { CommodityData } from '../../../data/referenceData/commodityDataService';
 *
 * Endpoints:
 * - EODHD: https://eodhd.com/api/eod/{TICKER}.COMM?api_token={KEY}&fmt=json
 * - Alpha Vantage: https://www.alphavantage.co/query?function={COMMODITY}&apikey={KEY}
 * - World Bank: https://api.worldbank.org/v2/country/WLD/indicator/COMMODITY_PRICE?format=json
 *
 * Cache: 24hr localStorage with per-source TTL
 * Fallback: Static reference prices from COMMODITY_UNIVERSE when live fails
 */

// ── EODHD Commodity Ticker Map ──────────────────────────────────────
const EODHD_COMMODITY_TICKERS = {
  // Energy
  'WTI': 'CL.COMM', 'BRENT': 'BZ.COMM', 'NG': 'NG.COMM', 'COAL': 'QS.COMM',
  'URANIUM': 'UX.COMM', 'ETHANOL': 'EH.COMM',
  // Precious Metals
  'GOLD': 'GC.COMM', 'SILVER': 'SI.COMM', 'PLATINUM': 'PL.COMM', 'PALLADIUM': 'PA.COMM',
  // Base Metals
  'COPPER': 'HG.COMM', 'ALUMINUM': 'AL.COMM', 'NICKEL': 'NI.COMM', 'ZINC': 'ZN.COMM',
  'TIN': 'SN.COMM', 'LEAD': 'PB.COMM', 'IRON_ORE': 'TIO.COMM',
  // Critical Minerals
  'LITHIUM': 'LIT.COMM', 'COBALT': 'CO.COMM', 'RARE_EARTHS': 'REMX.COMM',
  // Agriculture
  'SOY': 'ZS.COMM', 'WHEAT': 'ZW.COMM', 'CORN': 'ZC.COMM', 'RICE': 'ZR.COMM',
  'COFFEE': 'KC.COMM', 'SUGAR': 'SB.COMM', 'COTTON': 'CT.COMM', 'COCOA': 'CC.COMM',
  'RUBBER': 'RB.COMM', 'PALM_OIL': 'KPO.COMM',
  // Livestock
  'CATTLE': 'LE.COMM', 'HOGS': 'HE.COMM',
  // Carbon
  'EUA': 'EUA.COMM', 'CCA': 'CCA.COMM', 'RGGI': 'RGGI.COMM',
  'UKA': 'UKA.COMM', 'NZU': 'NZU.COMM', 'KCCER': 'KCCER.COMM',
};

// ── Alpha Vantage Commodity Functions ───────────────────────────────
const AV_COMMODITY_FUNCTIONS = {
  'WTI': 'WTI', 'BRENT': 'BRENT', 'NG': 'NATURAL_GAS',
  'COPPER': 'COPPER', 'ALUMINUM': 'ALUMINUM',
  'WHEAT': 'WHEAT', 'CORN': 'CORN', 'SUGAR': 'SUGAR',
  'COFFEE': 'COFFEE', 'COTTON': 'COTTON',
  'GOLD': null, 'SILVER': null, 'PLATINUM': null, 'PALLADIUM': null,
  'SOY': null, 'COCOA': null, 'RICE': null,
};

// ── World Bank Commodity Indicators ─────────────────────────────────
const WB_COMMODITY_INDICATORS = {
  CRUDE_OIL: 'CRUDE_BRENT', NATURAL_GAS: 'NGAS_US', COAL: 'COAL_AUS',
  GOLD: 'GOLD', SILVER: 'SILVER', COPPER: 'COPPER', ALUMINUM: 'ALUMINUM',
  NICKEL: 'NICKEL', ZINC: 'ZINC', TIN: 'TIN', LEAD: 'LEAD', IRON_ORE: 'IRON_ORE',
  WHEAT: 'WHEAT_US_HRW', CORN: 'MAIZE', RICE: 'RICE_05', SOY: 'SOYBEAN',
  SUGAR: 'SUGAR_WLD', COFFEE_ARABICA: 'COFFEE_ARABIC', COFFEE_ROBUSTA: 'COFFEE_ROBUS',
  COCOA: 'COCOA', COTTON: 'COTTON_A_INDX', RUBBER: 'RUBBER1_MYSG',
  PALM_OIL: 'PALM_OIL', FERTILIZER_DAP: 'DAP', FERTILIZER_UREA: 'UREA_EE_BULK',
};

// ── Static Fallback Prices (USD) — used when live data unavailable ──
const STATIC_PRICES = {
  WTI: 78.5, BRENT: 82.3, NG: 2.85, COAL: 135, URANIUM: 92,
  GOLD: 2340, SILVER: 29.5, PLATINUM: 980, PALLADIUM: 1020,
  COPPER: 4.35, ALUMINUM: 2480, NICKEL: 17200, ZINC: 2680,
  TIN: 28500, LEAD: 2150, IRON_ORE: 118,
  LITHIUM: 14200, COBALT: 28500, RARE_EARTHS: 380,
  SOY: 11.8, WHEAT: 5.95, CORN: 4.55, RICE: 17.2,
  COFFEE: 2.15, SUGAR: 0.22, COTTON: 0.82, COCOA: 8200,
  RUBBER: 1.65, PALM_OIL: 890,
  CATTLE: 1.82, HOGS: 0.92,
  EUA: 68, CCA: 38, RGGI: 14, UKA: 42, NZU: 52, KCCER: 8,
};

// ── Commodity Universe (50 commodities) ─────────────────────────────
export const COMMODITY_UNIVERSE = [
  { id:'WTI', name:'WTI Crude Oil', category:'Energy', unit:'$/bbl', price:78.5, yoy:-4.2, volatility:28.5, esgRisk:'High', climateImpact:'Very High', supplyRisk:'Medium' },
  { id:'BRENT', name:'Brent Crude Oil', category:'Energy', unit:'$/bbl', price:82.3, yoy:-3.8, volatility:26.2, esgRisk:'High', climateImpact:'Very High', supplyRisk:'Medium' },
  { id:'NG', name:'Natural Gas (Henry Hub)', category:'Energy', unit:'$/MMBtu', price:2.85, yoy:-12.5, volatility:45.2, esgRisk:'Medium', climateImpact:'High', supplyRisk:'Low' },
  { id:'COAL', name:'Thermal Coal', category:'Energy', unit:'$/mt', price:135, yoy:-18.2, volatility:35.8, esgRisk:'Very High', climateImpact:'Very High', supplyRisk:'Low' },
  { id:'URANIUM', name:'Uranium (U3O8)', category:'Energy', unit:'$/lb', price:92, yoy:42.5, volatility:38.5, esgRisk:'Medium', climateImpact:'Low', supplyRisk:'High' },
  { id:'ETHANOL', name:'Ethanol', category:'Energy', unit:'$/gal', price:2.15, yoy:5.2, volatility:22.1, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'GOLD', name:'Gold', category:'Precious Metals', unit:'$/oz', price:2340, yoy:18.5, volatility:14.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'SILVER', name:'Silver', category:'Precious Metals', unit:'$/oz', price:29.5, yoy:22.1, volatility:24.5, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'PLATINUM', name:'Platinum', category:'Precious Metals', unit:'$/oz', price:980, yoy:-2.5, volatility:18.3, esgRisk:'High', climateImpact:'Medium', supplyRisk:'High' },
  { id:'PALLADIUM', name:'Palladium', category:'Precious Metals', unit:'$/oz', price:1020, yoy:-28.2, volatility:32.1, esgRisk:'High', climateImpact:'Medium', supplyRisk:'Very High' },
  { id:'COPPER', name:'Copper', category:'Base Metals', unit:'$/lb', price:4.35, yoy:12.8, volatility:22.5, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Medium' },
  { id:'ALUMINUM', name:'Aluminum', category:'Base Metals', unit:'$/mt', price:2480, yoy:8.2, volatility:19.8, esgRisk:'High', climateImpact:'High', supplyRisk:'Low' },
  { id:'NICKEL', name:'Nickel', category:'Base Metals', unit:'$/mt', price:17200, yoy:-22.5, volatility:38.2, esgRisk:'High', climateImpact:'High', supplyRisk:'High' },
  { id:'ZINC', name:'Zinc', category:'Base Metals', unit:'$/mt', price:2680, yoy:5.5, volatility:21.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'TIN', name:'Tin', category:'Base Metals', unit:'$/mt', price:28500, yoy:15.2, volatility:28.5, esgRisk:'High', climateImpact:'Medium', supplyRisk:'High' },
  { id:'LEAD', name:'Lead', category:'Base Metals', unit:'$/mt', price:2150, yoy:2.1, volatility:16.5, esgRisk:'High', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'IRON_ORE', name:'Iron Ore', category:'Base Metals', unit:'$/mt', price:118, yoy:-8.5, volatility:32.5, esgRisk:'High', climateImpact:'High', supplyRisk:'Medium' },
  { id:'LITHIUM', name:'Lithium Carbonate', category:'Critical Minerals', unit:'$/mt', price:14200, yoy:-68.5, volatility:65.2, esgRisk:'High', climateImpact:'Medium', supplyRisk:'Very High' },
  { id:'COBALT', name:'Cobalt', category:'Critical Minerals', unit:'$/mt', price:28500, yoy:-35.2, volatility:42.8, esgRisk:'Very High', climateImpact:'Medium', supplyRisk:'Very High' },
  { id:'RARE_EARTHS', name:'Rare Earths (Basket)', category:'Critical Minerals', unit:'$/kg', price:380, yoy:-12.5, volatility:35.2, esgRisk:'High', climateImpact:'High', supplyRisk:'Very High' },
  { id:'SOY', name:'Soybeans', category:'Agriculture', unit:'$/bu', price:11.8, yoy:-15.2, volatility:22.5, esgRisk:'High', climateImpact:'High', supplyRisk:'Low' },
  { id:'WHEAT', name:'Wheat (CBOT)', category:'Agriculture', unit:'$/bu', price:5.95, yoy:-18.5, volatility:28.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Medium' },
  { id:'CORN', name:'Corn (CBOT)', category:'Agriculture', unit:'$/bu', price:4.55, yoy:-22.1, volatility:24.8, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'RICE', name:'Rough Rice', category:'Agriculture', unit:'$/cwt', price:17.2, yoy:8.5, volatility:18.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Medium' },
  { id:'COFFEE', name:'Coffee (Arabica)', category:'Agriculture', unit:'$/lb', price:2.15, yoy:45.2, volatility:35.5, esgRisk:'High', climateImpact:'Medium', supplyRisk:'High' },
  { id:'SUGAR', name:'Sugar #11', category:'Agriculture', unit:'$/lb', price:0.22, yoy:12.5, volatility:28.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'COTTON', name:'Cotton #2', category:'Agriculture', unit:'$/lb', price:0.82, yoy:-5.2, volatility:22.5, esgRisk:'High', climateImpact:'Medium', supplyRisk:'Medium' },
  { id:'COCOA', name:'Cocoa', category:'Agriculture', unit:'$/mt', price:8200, yoy:142.5, volatility:55.2, esgRisk:'Very High', climateImpact:'High', supplyRisk:'Very High' },
  { id:'RUBBER', name:'Natural Rubber', category:'Agriculture', unit:'$/kg', price:1.65, yoy:18.2, volatility:25.5, esgRisk:'High', climateImpact:'High', supplyRisk:'Medium' },
  { id:'PALM_OIL', name:'Palm Oil', category:'Agriculture', unit:'$/mt', price:890, yoy:5.8, volatility:28.2, esgRisk:'Very High', climateImpact:'Very High', supplyRisk:'Medium' },
  { id:'CATTLE', name:'Live Cattle', category:'Livestock', unit:'$/lb', price:1.82, yoy:8.5, volatility:12.5, esgRisk:'High', climateImpact:'Very High', supplyRisk:'Low' },
  { id:'HOGS', name:'Lean Hogs', category:'Livestock', unit:'$/lb', price:0.92, yoy:15.2, volatility:18.5, esgRisk:'Medium', climateImpact:'High', supplyRisk:'Low' },
  { id:'EUA', name:'EU Emission Allowance', category:'Carbon', unit:'EUR/tCO2', price:68, yoy:-22.5, volatility:32.5, esgRisk:'Positive', climateImpact:'Positive', supplyRisk:'N/A' },
  { id:'CCA', name:'California Carbon Allowance', category:'Carbon', unit:'$/tCO2', price:38, yoy:8.2, volatility:15.2, esgRisk:'Positive', climateImpact:'Positive', supplyRisk:'N/A' },
  { id:'RGGI', name:'RGGI Allowance', category:'Carbon', unit:'$/tCO2', price:14, yoy:5.5, volatility:12.5, esgRisk:'Positive', climateImpact:'Positive', supplyRisk:'N/A' },
  { id:'UKA', name:'UK Emission Allowance', category:'Carbon', unit:'GBP/tCO2', price:42, yoy:-8.2, volatility:28.5, esgRisk:'Positive', climateImpact:'Positive', supplyRisk:'N/A' },
  { id:'NZU', name:'NZ Emission Unit', category:'Carbon', unit:'NZD/tCO2', price:52, yoy:-15.5, volatility:22.2, esgRisk:'Positive', climateImpact:'Positive', supplyRisk:'N/A' },
  { id:'KCCER', name:'Korean Offset Credit', category:'Carbon', unit:'KRW/tCO2', price:8, yoy:12.5, volatility:18.5, esgRisk:'Positive', climateImpact:'Positive', supplyRisk:'N/A' },
  { id:'WATER', name:'Water (NQH2O)', category:'Water & Env.', unit:'$/acre-ft', price:525, yoy:18.5, volatility:42.5, esgRisk:'High', climateImpact:'High', supplyRisk:'Very High' },
  { id:'TIMBER', name:'Lumber', category:'Forestry', unit:'$/mbf', price:520, yoy:-12.5, volatility:48.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'PHOSPHATE', name:'Phosphate Rock', category:'Fertilizers', unit:'$/mt', price:295, yoy:-8.5, volatility:22.5, esgRisk:'High', climateImpact:'Medium', supplyRisk:'High' },
  { id:'POTASH', name:'Potash (MOP)', category:'Fertilizers', unit:'$/mt', price:285, yoy:-35.2, volatility:32.5, esgRisk:'Medium', climateImpact:'Low', supplyRisk:'High' },
  { id:'UREA', name:'Urea', category:'Fertilizers', unit:'$/mt', price:310, yoy:-22.5, volatility:38.2, esgRisk:'High', climateImpact:'High', supplyRisk:'Medium' },
  { id:'MANGANESE', name:'Manganese', category:'Critical Minerals', unit:'$/mt', price:4.8, yoy:5.2, volatility:18.5, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'High' },
  { id:'GRAPHITE', name:'Graphite', category:'Critical Minerals', unit:'$/mt', price:680, yoy:-18.5, volatility:25.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Very High' },
  { id:'VANADIUM', name:'Vanadium', category:'Critical Minerals', unit:'$/kg', price:32, yoy:12.5, volatility:35.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'High' },
  { id:'SILICON', name:'Silicon Metal', category:'Critical Minerals', unit:'$/mt', price:2450, yoy:-8.2, volatility:22.5, esgRisk:'Medium', climateImpact:'High', supplyRisk:'High' },
  { id:'SAND', name:'Industrial Sand', category:'Construction', unit:'$/mt', price:48, yoy:5.5, volatility:8.2, esgRisk:'Medium', climateImpact:'Medium', supplyRisk:'Low' },
  { id:'CEMENT', name:'Cement (Portland)', category:'Construction', unit:'$/mt', price:125, yoy:8.2, volatility:12.5, esgRisk:'High', climateImpact:'Very High', supplyRisk:'Low' },
  { id:'STEEL', name:'Steel (HRC)', category:'Construction', unit:'$/mt', price:680, yoy:-15.2, volatility:32.5, esgRisk:'High', climateImpact:'Very High', supplyRisk:'Low' },
];

// ── Commodity Categories ────────────────────────────────────────────
export const COMMODITY_CATEGORIES = [
  { id:'Energy', color:'#dc2626', count:6, avgESG:72 },
  { id:'Precious Metals', color:'#c5a96a', count:4, avgESG:55 },
  { id:'Base Metals', color:'#2563eb', count:7, avgESG:62 },
  { id:'Critical Minerals', color:'#7c3aed', count:7, avgESG:68 },
  { id:'Agriculture', color:'#16a34a', count:10, avgESG:58 },
  { id:'Livestock', color:'#d97706', count:2, avgESG:75 },
  { id:'Carbon', color:'#0d9488', count:6, avgESG:15 },
  { id:'Other', color:'#64748b', count:8, avgESG:52 },
];

// ── Cache Infrastructure ────────────────────────────────────────────
const CACHE_KEY = 'ra_commodity_prices_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let priceCache = {};
try {
  const s = localStorage.getItem(CACHE_KEY);
  if (s) { const p = JSON.parse(s); if (Date.now() - (p._ts || 0) < CACHE_TTL) priceCache = p; }
} catch { /* ignore parse errors */ }

function persistCache() {
  try {
    priceCache._ts = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(priceCache));
  } catch { /* storage full — silently continue */ }
}

// ── EODHD API Integration ───────────────────────────────────────────

/**
 * Fetch commodity price history from EODHD
 * @param {string} commodityId — key from EODHD_COMMODITY_TICKERS
 * @param {number} days — history depth (default 30)
 * @returns {Array|null} [{date,open,high,low,close,volume}]
 */
export async function fetchEODHDCommodity(commodityId, days = 30) {
  const ticker = EODHD_COMMODITY_TICKERS[commodityId];
  if (!ticker) return null;
  const cacheKey = `eodhd_${commodityId}_${days}`;
  if (priceCache[cacheKey]) return priceCache[cacheKey];

  const apiKey = localStorage.getItem('ra_eodhd_api_key') || '';
  if (!apiKey) return null;

  try {
    const url = `https://eodhd.com/api/eod/${ticker}?api_token=${apiKey}&fmt=json&order=d&limit=${days}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`EODHD ${res.status}`);
    const data = await res.json();
    const prices = data.map(d => ({
      date: d.date, open: d.open, high: d.high,
      low: d.low, close: d.close, volume: d.volume,
    }));
    priceCache[cacheKey] = prices;
    persistCache();
    return prices;
  } catch (err) {
    console.warn(`EODHD commodity fetch failed for ${commodityId}:`, err.message);
    return null;
  }
}

/**
 * Fetch EODHD intraday prices (requires premium)
 */
export async function fetchEODHDIntraday(commodityId, interval = '1h') {
  const ticker = EODHD_COMMODITY_TICKERS[commodityId];
  if (!ticker) return null;
  const cacheKey = `eodhd_intra_${commodityId}_${interval}`;
  if (priceCache[cacheKey]) return priceCache[cacheKey];

  const apiKey = localStorage.getItem('ra_eodhd_api_key') || '';
  if (!apiKey) return null;

  try {
    const url = `https://eodhd.com/api/intraday/${ticker}?api_token=${apiKey}&fmt=json&interval=${interval}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`EODHD Intraday ${res.status}`);
    const data = await res.json();
    const prices = data.map(d => ({
      datetime: d.datetime, open: d.open, high: d.high,
      low: d.low, close: d.close, volume: d.volume,
    }));
    priceCache[cacheKey] = prices;
    persistCache();
    return prices;
  } catch (err) {
    console.warn(`EODHD intraday fetch failed for ${commodityId}:`, err.message);
    return null;
  }
}

// ── Alpha Vantage API Integration ───────────────────────────────────

/**
 * Fetch commodity price from Alpha Vantage
 * @param {string} commodityId — key from AV_COMMODITY_FUNCTIONS
 * @param {string} interval — 'daily'|'weekly'|'monthly'
 * @returns {Array|null} [{date, value}]
 */
export async function fetchAVCommodity(commodityId, interval = 'monthly') {
  const func = AV_COMMODITY_FUNCTIONS[commodityId];
  if (!func) return null;
  const cacheKey = `av_${commodityId}_${interval}`;
  if (priceCache[cacheKey]) return priceCache[cacheKey];

  const apiKey = localStorage.getItem('ra_av_api_key') || '';
  if (!apiKey) return null;

  try {
    const url = `https://www.alphavantage.co/query?function=${func}&interval=${interval}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AV ${res.status}`);
    const data = await res.json();
    if (data.Note || data['Error Message']) throw new Error(data.Note || data['Error Message']);
    const prices = (data.data || []).slice(0, 60).map(d => ({
      date: d.date, value: parseFloat(d.value),
    }));
    priceCache[cacheKey] = prices;
    persistCache();
    return prices;
  } catch (err) {
    console.warn(`AV commodity fetch failed for ${commodityId}:`, err.message);
    return null;
  }
}

// ── World Bank API Integration ──────────────────────────────────────

/**
 * Fetch World Bank commodity price index
 * @param {string} indicator — WB indicator code
 * @param {string} countryCode — default 'WLD'
 * @returns {Array|null} [{year, value}]
 */
export async function fetchWorldBankCommodity(indicator, countryCode = 'WLD') {
  const cacheKey = `wb_${indicator}_${countryCode}`;
  if (priceCache[cacheKey]) return priceCache[cacheKey];

  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=30&date=2018:2026`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WB ${res.status}`);
    const data = await res.json();
    const records = (data[1] || [])
      .filter(r => r.value !== null)
      .map(r => ({ year: r.date, value: r.value }))
      .sort((a, b) => a.year - b.year);
    priceCache[cacheKey] = records;
    persistCache();
    return records;
  } catch (err) {
    console.warn(`World Bank commodity fetch failed for ${indicator}:`, err.message);
    return null;
  }
}

// ── Price Resolution ────────────────────────────────────────────────

/**
 * Get latest commodity price (cache > live > static fallback)
 * @param {string} commodityId
 * @returns {number|null}
 */
export function getLatestPrice(commodityId) {
  // Try EODHD cache first
  for (const k of Object.keys(priceCache)) {
    if (k.startsWith(`eodhd_${commodityId}_`) && Array.isArray(priceCache[k]) && priceCache[k].length > 0) {
      return priceCache[k][0].close;
    }
  }
  // Try AV cache
  for (const k of Object.keys(priceCache)) {
    if (k.startsWith(`av_${commodityId}_`) && Array.isArray(priceCache[k]) && priceCache[k].length > 0) {
      return priceCache[k][0].value;
    }
  }
  // Static fallback
  return STATIC_PRICES[commodityId] || null;
}

/**
 * Get price with metadata
 */
export function getPriceWithMeta(commodityId) {
  const univ = COMMODITY_UNIVERSE.find(c => c.id === commodityId);
  const livePrice = getLatestPrice(commodityId);
  return {
    id: commodityId,
    name: univ?.name || commodityId,
    price: livePrice || univ?.price || null,
    unit: univ?.unit || '$/unit',
    source: livePrice !== (univ?.price || null) ? 'live' : 'static',
    yoy: univ?.yoy || 0,
    category: univ?.category || 'Unknown',
  };
}

// ── Batch Operations ────────────────────────────────────────────────

/**
 * Fetch all commodity prices in batch (EODHD primary, AV fallback)
 * @returns {Object} { commodityId: latestPrice }
 */
export async function fetchAllCommodityPrices() {
  const results = {};
  const eodhKey = localStorage.getItem('ra_eodhd_api_key');
  const avKey = localStorage.getItem('ra_av_api_key');

  for (const id of Object.keys(EODHD_COMMODITY_TICKERS)) {
    if (eodhKey) {
      const data = await fetchEODHDCommodity(id, 1);
      if (data && data.length > 0) { results[id] = data[0].close; continue; }
    }
    if (avKey && AV_COMMODITY_FUNCTIONS[id]) {
      const data = await fetchAVCommodity(id, 'daily');
      if (data && data.length > 0) { results[id] = data[0].value; continue; }
    }
    results[id] = STATIC_PRICES[id] || null;
  }
  return results;
}

/**
 * Fetch prices for a specific category
 */
export async function fetchCategoryPrices(category) {
  const commodities = COMMODITY_UNIVERSE.filter(c => c.category === category);
  const results = {};
  for (const c of commodities) {
    results[c.id] = getLatestPrice(c.id) || c.price;
  }
  return results;
}

// ── Supply Chain Reference Data ─────────────────────────────────────

export const SUPPLY_CHAIN_NODES = {
  COBALT: ['DRC Mining','Refining (China)','Battery Cathode','EV Assembly','End Consumer'],
  LITHIUM: ['Brine Extraction (Chile)','Spodumene Mining (Australia)','Lithium Hydroxide Refining','Battery Cell','EV/Storage'],
  PALM_OIL: ['Plantation (Indonesia/Malaysia)','Mill Processing','Refinery','FMCG Manufacturer','Retail'],
  COCOA: ['Smallholder Farm (Ghana/Ivory Coast)','Local Trader','Processing (Netherlands)','Chocolate Mfg','Retail'],
  COFFEE: ['Smallholder Farm','Cherry Processing','Export Trading','Roasting','Retail/Cafe'],
  COPPER: ['Open Pit Mining (Chile/Peru)','Smelting','Refining','Wire/Pipe Mfg','Construction/Electronics'],
  IRON_ORE: ['Mining (Australia/Brazil)','Shipping','Steel Mill','Manufacturing','Infrastructure'],
};

// ── Carbon Market Integration ───────────────────────────────────────

export const CARBON_MARKETS = [
  { id:'EUA', name:'EU ETS', region:'EU', coverage:'40% EU emissions', price:68, trend:-22.5 },
  { id:'CCA', name:'California Cap-and-Trade', region:'US-CA', coverage:'85% CA emissions', price:38, trend:8.2 },
  { id:'RGGI', name:'RGGI (US Northeast)', region:'US-NE', coverage:'Power sector', price:14, trend:5.5 },
  { id:'UKA', name:'UK ETS', region:'UK', coverage:'~25% UK emissions', price:42, trend:-8.2 },
  { id:'NZU', name:'NZ ETS', region:'NZ', coverage:'~50% NZ emissions', price:52, trend:-15.5 },
  { id:'KCCER', name:'Korean ETS', region:'KR', coverage:'~70% KR emissions', price:8, trend:12.5 },
];

// ── Cache Management ────────────────────────────────────────────────

/**
 * Get commodity price cache statistics
 */
export function getCommodityCacheStats() {
  const entries = Object.keys(priceCache).filter(k => k !== '_ts').length;
  const sources = { eodhd: 0, av: 0, wb: 0 };
  for (const k of Object.keys(priceCache)) {
    if (k.startsWith('eodhd_')) sources.eodhd++;
    else if (k.startsWith('av_')) sources.av++;
    else if (k.startsWith('wb_')) sources.wb++;
  }
  return {
    entries,
    sources,
    lastUpdated: priceCache._ts ? new Date(priceCache._ts).toISOString() : null,
    ttlHours: 24,
    sizeKB: Math.round(JSON.stringify(priceCache).length / 1024),
  };
}

/**
 * Clear commodity price cache
 */
export function clearCommodityCache() {
  priceCache = {};
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Check data source health
 */
export async function checkCommodityDataHealth() {
  const results = { eodhd: 'unknown', av: 'unknown', wb: 'unknown' };
  try {
    const wbTest = await fetchWorldBankCommodity('CRUDE_BRENT');
    results.wb = wbTest && wbTest.length > 0 ? 'healthy' : 'degraded';
  } catch { results.wb = 'offline'; }
  results.eodhd = localStorage.getItem('ra_eodhd_api_key') ? 'configured' : 'no_key';
  results.av = localStorage.getItem('ra_av_api_key') ? 'configured' : 'no_key';
  return results;
}

// ── Master Export ───────────────────────────────────────────────────

export const CommodityData = {
  // Live fetch
  fetchEODHDCommodity,
  fetchEODHDIntraday,
  fetchAVCommodity,
  fetchWorldBankCommodity,
  // Price resolution
  getLatestPrice,
  getPriceWithMeta,
  // Batch
  fetchAllCommodityPrices,
  fetchCategoryPrices,
  // Reference data
  COMMODITY_UNIVERSE,
  COMMODITY_CATEGORIES,
  SUPPLY_CHAIN_NODES,
  CARBON_MARKETS,
  STATIC_PRICES,
  // Ticker maps
  EODHD_COMMODITY_TICKERS,
  AV_COMMODITY_FUNCTIONS,
  WB_COMMODITY_INDICATORS,
  // Cache
  getCommodityCacheStats,
  clearCommodityCache,
  checkCommodityDataHealth,
};

export default CommodityData;
