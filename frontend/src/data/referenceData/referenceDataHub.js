/**
 * Reference Data Hub — Central orchestrator for all external data sources
 *
 * IMPORT THIS IN EVERY MODULE THAT NEEDS REFERENCE DATA:
 * import { ReferenceData } from '../../../data/referenceData/referenceDataHub';
 *
 * Sources:
 * 1. OpenFIGI — Free ISIN↔FIGI↔CUSIP mapping (api.openfigi.com)
 * 2. CBI Taxonomy — Certified bond classification + 50+ bond reference DB
 * 3. IMF Climate — Sovereign green bond volumes + ESG scores
 * 4. FINRA TRACE — US bond market aggregates (developer.finra.org)
 * 5. LGX DataHub — 23,000+ GSSS bond reference (luxse.com)
 * 6. KAPSARC — Green bond issuance by country (datasource.kapsarc.org)
 */

// ── Sub-module imports ──
import { resolveIdentifiers, lookupISIN, lookupCUSIP, enrichBondISINs, getCacheStats } from './openFigiService';
import { CBI_TAXONOMY, CBI_CERTIFIED_BONDS, classifyCBISector, getCBIStats, searchCBIBonds } from './cbiTaxonomy';
import { fetchGreenBondData, SOVEREIGN_ESG_DB, getSovereignESG, getAllSovereignESG, getGreenBondMarketSummary } from './imfClimateService';
import { CommodityData } from './commodityDataService';
import { ConsumerCarbonData } from './consumerCarbonService';

// ── External Data Sources (10 free APIs from 105-source registry) ──
import {
  fetchWorldBankIndicator, fetchWorldBankCountryProfile,
  fetchFREDSeries, fetchFREDSeriesInfo,
  fetchECBData, fetchECBExchangeRate,
  fetchLEI,
  fetchSECFilings, searchSECCompanies,
  fetchFinnhubNews, fetchFinnhubProfile,
  fetchOECDData,
  searchSanctions,
  fetchGDELTNews, fetchGDELTToneline,
  fetchSBTiTargets, searchSBTiTargets,
  EXTERNAL_DATA_REGISTRY,
  checkExternalDataHealth,
  getExternalAPIKey, setExternalAPIKey, getAPIKeyStatus,
  clearExternalCache, getExternalCacheStats,
} from './externalDataSources';

// ── FINRA TRACE API integration ──
const FINRA_BASE = 'https://api.finra.org/data/group/fixedIncomeMarket/name/treasuryWeeklyAggregates';
const FINRA_CACHE_KEY = 'ra_finra_trace_v1';

async function fetchFINRAData() {
  try {
    const cached = localStorage.getItem(FINRA_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed._ts < 24 * 60 * 60 * 1000) return parsed.data;
    }
    // FINRA requires CORS-friendly access — may fail in browser
    const response = await fetch(FINRA_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ limit: 50, dateRangeFilters: [{ fieldName: 'weekStartDate', startDate: '2024-01-01' }] }),
    });
    if (!response.ok) throw new Error(`FINRA: ${response.status}`);
    const data = await response.json();
    localStorage.setItem(FINRA_CACHE_KEY, JSON.stringify({ data, _ts: Date.now() }));
    return data;
  } catch (err) {
    console.warn('FINRA TRACE fetch failed (expected in browser due to CORS):', err.message);
    return getFINRAFallback();
  }
}

function getFINRAFallback() {
  // US Treasury aggregate data — weekly averages
  return [
    { week: '2024-W48', totalTrades: 142500, totalVolume_bn: 1825, avgYield10yr: 4.38, avgYield2yr: 4.72, avgYield30yr: 4.52 },
    { week: '2024-W49', totalTrades: 138200, totalVolume_bn: 1780, avgYield10yr: 4.35, avgYield2yr: 4.68, avgYield30yr: 4.48 },
    { week: '2024-W50', totalTrades: 145800, totalVolume_bn: 1892, avgYield10yr: 4.42, avgYield2yr: 4.75, avgYield30yr: 4.55 },
    { week: '2024-W51', totalTrades: 128400, totalVolume_bn: 1650, avgYield10yr: 4.40, avgYield2yr: 4.71, avgYield30yr: 4.51 },
    { week: '2024-W52', totalTrades: 98500, totalVolume_bn: 1280, avgYield10yr: 4.38, avgYield2yr: 4.69, avgYield30yr: 4.49 },
    { week: '2025-W01', totalTrades: 135200, totalVolume_bn: 1745, avgYield10yr: 4.41, avgYield2yr: 4.73, avgYield30yr: 4.53 },
  ];
}

// ── KAPSARC Green Bond Data ──
const KAPSARC_CACHE_KEY = 'ra_kapsarc_v1';

async function fetchKAPSARCData() {
  try {
    const cached = localStorage.getItem(KAPSARC_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed._ts < 7 * 24 * 60 * 60 * 1000) return parsed.data;
    }
    const url = 'https://datasource.kapsarc.org/api/records/1.0/search/?dataset=green-bond-issuances&rows=100&sort=-year&facet=country&facet=year';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`KAPSARC: ${response.status}`);
    const data = await response.json();
    const records = (data.records || []).map(r => ({
      country: r.fields?.country,
      year: r.fields?.year,
      issuance_bn: r.fields?.green_bond_issuance_usd || r.fields?.amount || 0,
      issuerType: r.fields?.type_of_issuer || 'Unknown',
    }));
    localStorage.setItem(KAPSARC_CACHE_KEY, JSON.stringify({ data: records, _ts: Date.now() }));
    return records;
  } catch (err) {
    console.warn('KAPSARC fetch failed:', err.message);
    return []; // No fallback needed — IMF provides similar data
  }
}

// ── Data Source Metadata ──
export const DATA_SOURCES = [
  { id: 'openfigi', name: 'OpenFIGI', type: 'free', url: 'https://api.openfigi.com/v3/mapping', description: 'ISIN↔FIGI↔CUSIP identifier resolution', coverage: '300T+ instruments', refreshRate: '7-day cache', status: 'active' },
  { id: 'cbi', name: 'Climate Bonds Initiative', type: 'free', url: 'https://www.climatebonds.net/cbi/pub/data/bonds', description: 'CBI taxonomy + certified bond database', coverage: '50+ certified bonds (static)', refreshRate: 'Quarterly', status: 'active' },
  { id: 'imf', name: 'IMF Climate Data', type: 'free', url: 'https://climatedata.imf.org', description: 'Green bond market aggregates by country', coverage: '20+ countries', refreshRate: '24hr cache', status: 'active' },
  { id: 'finra', name: 'FINRA TRACE', type: 'free', url: 'https://developer.finra.org', description: 'US Treasury & corporate bond market aggregates', coverage: 'US market', refreshRate: '24hr cache', status: 'fallback' },
  { id: 'kapsarc', name: 'KAPSARC Data Portal', type: 'free', url: 'https://datasource.kapsarc.org', description: 'Green bond issuance by country & year', coverage: 'Global', refreshRate: '7-day cache', status: 'active' },
  { id: 'lgx', name: 'LGX DataHub', type: 'free', url: 'https://www.luxse.com/lgx-datahub', description: '23,000+ GSSS bond reference (dashboard)', coverage: '4,000+ issuers', refreshRate: 'Manual reference', status: 'reference' },
  { id: 'eodhd', name: 'EODHD Bond Fundamentals', type: 'paid', url: 'https://eodhd.com', description: 'Bond fundamentals via ISIN/CUSIP', coverage: 'Global', refreshRate: 'On-demand', status: 'planned', cost: '$80/mo' },
  { id: 'cbonds', name: 'Cbonds', type: 'paid', url: 'https://cbonds.com/api', description: '1M+ bonds, 100+ fields, 160 exchanges', coverage: 'Global', refreshRate: 'Real-time', status: 'planned', cost: '$350-1000/mo' },
  // ── 10 New External Data Sources (free APIs) ──
  { id: 'worldbank', name: 'World Bank Open Data', type: 'free', url: 'https://api.worldbank.org/v2', description: 'GDP, HDI, Gini, governance, CO₂ — 6 indicator families', coverage: 'Global (200+ countries)', refreshRate: '24hr cache', status: 'active' },
  { id: 'fred', name: 'Federal Reserve FRED', type: 'free', url: 'https://api.stlouisfed.org/fred', description: 'Interest rates, inflation, GDP, unemployment — 800K+ series', coverage: 'US', refreshRate: '24hr cache', status: 'active' },
  { id: 'ecb', name: 'ECB Statistical Data', type: 'free', url: 'https://data-api.ecb.europa.eu', description: 'Exchange rates, interest rates, monetary aggregates', coverage: 'Eurozone', refreshRate: '24hr cache', status: 'active' },
  { id: 'gleif', name: 'GLEIF LEI Registry', type: 'free', url: 'https://api.gleif.org/api/v1', description: 'Legal Entity Identifiers — 2.5M+ entities', coverage: 'Global', refreshRate: '7-day cache', status: 'active' },
  { id: 'sec_edgar', name: 'SEC EDGAR', type: 'free', url: 'https://data.sec.gov', description: 'Company filings, 10-K, 10-Q, 8-K — all public US issuers', coverage: 'US', refreshRate: '24hr cache', status: 'active' },
  { id: 'finnhub', name: 'Finnhub', type: 'free', url: 'https://finnhub.io/api/v1', description: 'Company news sentiment, profiles, market data', coverage: 'Global', refreshRate: '4hr cache', status: 'active' },
  { id: 'oecd', name: 'OECD Data', type: 'free', url: 'https://sdmx.oecd.org/public/rest', description: 'GDP, key economic indicators, employment, trade', coverage: 'OECD (38 countries)', refreshRate: '7-day cache', status: 'active' },
  { id: 'opensanctions', name: 'OpenSanctions', type: 'free', url: 'https://api.opensanctions.org', description: 'Sanctions, PEPs, debarment — compliance screening', coverage: 'Global', refreshRate: '24hr cache', status: 'active' },
  { id: 'gdelt', name: 'GDELT Project', type: 'free', url: 'https://api.gdeltproject.org', description: 'Real-time global news & event monitoring + tone analysis', coverage: 'Global', refreshRate: '4hr cache', status: 'active' },
  { id: 'sbti', name: 'SBTi Dashboard', type: 'free', url: 'https://sciencebasedtargets.org', description: 'Science Based Targets — corporate climate commitments', coverage: 'Global (4,000+ companies)', refreshRate: '7-day cache', status: 'active' },
  // ── Commodity Data Sources ──
  { id: 'commodity_eodhd', name: 'EODHD Commodities', type: 'paid', url: 'https://eodhd.com/api/eod', description: 'Real-time & historical commodity prices — 40+ futures contracts', coverage: 'Global (50 commodities)', refreshRate: '24hr cache', status: 'active', cost: '$80/mo' },
  { id: 'commodity_av', name: 'Alpha Vantage Commodities', type: 'free', url: 'https://www.alphavantage.co/query', description: 'Commodity prices — WTI, Brent, NG, metals, agriculture', coverage: 'Global (10 commodities)', refreshRate: '24hr cache', status: 'active' },
  { id: 'commodity_wb', name: 'World Bank Commodity Prices', type: 'free', url: 'https://api.worldbank.org/v2', description: 'Commodity price indices & historical data from World Bank Pink Sheet', coverage: 'Global (25+ indicators)', refreshRate: '24hr cache', status: 'active' },
];

// ── Master Reference Data Object ──
export const ReferenceData = {
  // OpenFIGI
  resolveIdentifiers,
  lookupISIN,
  lookupCUSIP,
  enrichBondISINs,
  getFIGICacheStats: getCacheStats,

  // CBI
  CBI_TAXONOMY,
  CBI_CERTIFIED_BONDS,
  classifyCBISector,
  getCBIStats,
  searchCBIBonds,

  // IMF / Sovereign
  fetchGreenBondData,
  SOVEREIGN_ESG_DB,
  getSovereignESG,
  getAllSovereignESG,
  getGreenBondMarketSummary,

  // FINRA
  fetchFINRAData,

  // KAPSARC
  fetchKAPSARCData,

  // ── External Data Sources (10 free APIs) ──
  // World Bank
  fetchWorldBankIndicator,
  fetchWorldBankCountryProfile,
  // FRED
  fetchFREDSeries,
  fetchFREDSeriesInfo,
  // ECB
  fetchECBData,
  fetchECBExchangeRate,
  // GLEIF LEI
  fetchLEI,
  // SEC EDGAR
  fetchSECFilings,
  searchSECCompanies,
  // Finnhub
  fetchFinnhubNews,
  fetchFinnhubProfile,
  // OECD
  fetchOECDData,
  // OpenSanctions
  searchSanctions,
  // GDELT
  fetchGDELTNews,
  fetchGDELTToneline,
  // SBTi
  fetchSBTiTargets,
  searchSBTiTargets,
  // ── Commodity Data ──
  CommodityData,

  // ── Consumer Carbon Intelligence (Sprint Z) ──
  ConsumerCarbonData,

  // Registry & utilities
  EXTERNAL_DATA_REGISTRY,
  checkExternalDataHealth,
  getExternalAPIKey,
  setExternalAPIKey,
  getAPIKeyStatus,
  clearExternalCache,
  getExternalCacheStats,

  // Metadata
  DATA_SOURCES,

  // ── Unified Bond Enrichment ──
  // Takes any bond array and enriches with CBI classification + FIGI + sovereign ESG
  async enrichBonds(bonds) {
    const enriched = bonds.map(b => {
      // CBI classification from use-of-proceeds
      const cbiClass = b.cbi_sector ? { sector: b.cbi_sector, subsector: b.cbi_subsector || 'General', confidence: 1 } : classifyCBISector(b.useOfProceeds || '');

      // CBI certification check
      const cbiMatch = CBI_CERTIFIED_BONDS.find(cb => cb.isin === b.isin || cb.issuer === b.issuer);

      // Sovereign ESG for the issuer country
      const countryESG = b.country ? getSovereignESG(b.country) : null;

      return {
        ...b,
        cbi_sector: cbiClass.sector,
        cbi_subsector: cbiClass.subsector,
        cbi_confidence: cbiClass.confidence,
        cbi_certified: cbiMatch?.cbi_certified || b.cbi_certified || false,
        cbi_certification_date: cbiMatch?.certification_date || null,
        cbi_verifier: cbiMatch?.verifier || b.spo || null,
        country_esg_score: countryESG?.score || null,
        country_ndgain: countryESG?.ndgain || null,
        country_cat_rating: countryESG?.catRating || null,
      };
    });

    // Batch FIGI resolution for bonds with ISINs
    try {
      return await enrichBondISINs(enriched);
    } catch {
      return enriched; // Return without FIGI if API fails
    }
  },

  // ── Data Health Check ──
  async checkDataHealth() {
    const results = {};

    // Check OpenFIGI
    try {
      const test = await lookupISIN('US037833AK68'); // Apple bond
      results.openfigi = { status: test ? 'healthy' : 'degraded', lastCheck: new Date().toISOString() };
    } catch { results.openfigi = { status: 'offline', lastCheck: new Date().toISOString() }; }

    // CBI is static
    results.cbi = { status: 'healthy', bonds: CBI_CERTIFIED_BONDS.length, lastCheck: new Date().toISOString() };

    // IMF
    try {
      const imfData = await fetchGreenBondData();
      results.imf = { status: imfData.length > 0 ? 'healthy' : 'degraded', records: imfData.length, lastCheck: new Date().toISOString() };
    } catch { results.imf = { status: 'offline', lastCheck: new Date().toISOString() }; }

    // Sovereign
    results.sovereign = { status: 'healthy', countries: SOVEREIGN_ESG_DB.length, lastCheck: new Date().toISOString() };

    // External data sources (10 new APIs)
    try {
      const extHealth = await checkExternalDataHealth();
      results.external = extHealth;
    } catch {
      results.external = { status: 'check_failed', lastCheck: new Date().toISOString() };
    }

    return results;
  },
};

export default ReferenceData;
