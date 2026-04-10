/**
 * GLOBAL COMPANY MASTER — Multi-Exchange Aggregator
 * Sprint E — Global Market Intelligence
 *
 * Normalises all exchange-specific company records into a common USD-denominated
 * schema for cross-exchange analytics (PCAF, climate risk, sector benchmarking).
 *
 * FX rates used (approximate 31-Dec-2023):
 *   USD/INR  = 83.1   →  INR Cr × 0.1203 = USD Mn   (1 Cr = 10M INR; /83.1 = 120,337 USD = 0.1203 USD Mn)
 *   USD/GBP  = 0.787  →  GBP Mn × 1.270  = USD Mn
 *   USD/EUR  = 0.917  →  EUR Mn × 1.091  = USD Mn
 *   USD/JPY  = 141.4  →  JPY Bn × 7.073  = USD Mn
 *   USD/HKD  = 7.820  →  HKD Mn × 0.1279 = USD Mn
 *   USD/AUD  = 1.469  →  AUD Mn × 0.681  = USD Mn
 *   USD/SGD  = 1.325  →  SGD Mn × 0.755  = USD Mn
 *   USD/SAR  = 3.750  →  SAR Mn × 0.267  = USD Mn
 */

import { COMPANY_MASTER as INDIA_COMPANIES } from './companyMaster';

// ── Dynamic imports with graceful fallback — one file per exchange ─────────────
let USA_COMPANIES = [], UK_COMPANIES = [];
let GERMANY_COMPANIES = [], FRANCE_COMPANIES = [];
let JAPAN_COMPANIES = [], HONGKONG_COMPANIES = [];
let AUSTRALIA_COMPANIES = [], SINGAPORE_COMPANIES = [];
let SOUTHKOREA_COMPANIES = [], CHINA_COMPANIES = [];
let BRAZIL_COMPANIES = [], SOUTHAFRICA_COMPANIES = [], CANADA_COMPANIES = [];

try { const m = require('./exchanges/usa_nyse_nasdaq');    USA_COMPANIES         = m.USA_COMPANIES         || []; } catch (e) {}
try { const m = require('./exchanges/uk_lse');             UK_COMPANIES          = m.UK_COMPANIES          || []; } catch (e) {}
try { const m = require('./exchanges/germany_xetra');      GERMANY_COMPANIES     = m.GERMANY_COMPANIES     || []; } catch (e) {}
try { const m = require('./exchanges/france_euronext');    FRANCE_COMPANIES      = m.FRANCE_COMPANIES      || []; } catch (e) {}
try { const m = require('./exchanges/japan_tse');          JAPAN_COMPANIES       = m.JAPAN_COMPANIES       || []; } catch (e) {}
try { const m = require('./exchanges/japan_apac');         HONGKONG_COMPANIES    = m.HONGKONG_COMPANIES    || []; } catch (e) {}
try { const m = require('./exchanges/australia_asx');      AUSTRALIA_COMPANIES   = m.AUSTRALIA_COMPANIES   || []; } catch (e) {}
try { const m = require('./exchanges/singapore_sgx');      SINGAPORE_COMPANIES   = m.SINGAPORE_COMPANIES   || []; } catch (e) {}
try { const m = require('./exchanges/southkorea_krx');     SOUTHKOREA_COMPANIES  = m.SOUTHKOREA_COMPANIES  || []; } catch (e) {}
try { const m = require('./exchanges/china_sse_szse');     CHINA_COMPANIES       = m.CHINA_COMPANIES       || []; } catch (e) {}
try { const m = require('./exchanges/brazil_b3');          BRAZIL_COMPANIES      = m.BRAZIL_COMPANIES      || []; } catch (e) {}
try { const m = require('./exchanges/southafrica_jse');    SOUTHAFRICA_COMPANIES = m.SOUTHAFRICA_COMPANIES || []; } catch (e) {}
try { const m = require('./exchanges/canada_tsx');         CANADA_COMPANIES      = m.CANADA_COMPANIES      || []; } catch (e) {}

// ── FX conversion helpers ─────────────────────────────────────────────────────
const FX = {
  INR_CR_TO_USD_MN : 0.1203,   // 1 INR Cr = 10M INR; /83.1 ≈ 0.1203 USD Mn
  GBP_MN_TO_USD_MN : 1.270,
  EUR_MN_TO_USD_MN : 1.091,
  JPY_BN_TO_USD_MN : 7.073,
  HKD_MN_TO_USD_MN : 0.1279,
  AUD_MN_TO_USD_MN : 0.681,
  SGD_MN_TO_USD_MN : 0.755,
  SAR_MN_TO_USD_MN : 0.267,
  KRW_BN_TO_USD_MN : 0.766,    // 1 KRW Bn ≈ 0.766 USD Mn (USD/KRW 1305)
  CNY_BN_TO_USD_MN : 140.8,    // 1 CNY Bn ≈ 140.8 USD Mn (USD/CNY 7.10)
  BRL_BN_TO_USD_MN : 204.1,    // 1 BRL Bn ≈ 204.1 USD Mn (USD/BRL 4.90)
  ZAR_BN_TO_USD_MN : 54.4,     // 1 ZAR Bn ≈ 54.4 USD Mn (USD/ZAR 18.4)
  CAD_MN_TO_USD_MN : 0.744,    // USD/CAD 1.344
};

const cvt = (val, rate) => (val != null && rate != null ? Math.round(val * rate) : null);

/** Normalise a company record from any exchange into USD Mn equivalents */
function normalise(c, exchangeMeta) {
  const { region, displayExchange } = exchangeMeta;
  const base = {
    ...c,
    _region: region,
    _displayExchange: displayExchange,
    _normalised: true,
  };

  // Already USD
  if (c.currency === 'USD') {
    return { ...base, revenue_usd_mn: c.revenue_usd_mn, market_cap_usd_mn: c.market_cap_usd_mn,
      evic_usd_mn: c.evic_usd_mn, total_debt_usd_mn: c.total_debt_usd_mn };
  }

  // INR Cr → USD Mn
  if (c.currency === 'INR') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_inr_cr,    FX.INR_CR_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_inr_cr,     FX.INR_CR_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_inr_cr, FX.INR_CR_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_inr_cr, FX.INR_CR_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_inr_cr, FX.INR_CR_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_inr_cr,       FX.INR_CR_TO_USD_MN),
    };
  }

  // GBP Mn → USD Mn
  if (c.currency === 'GBP') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_gbp_mn,    FX.GBP_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_gbp_mn,     FX.GBP_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_gbp_mn, FX.GBP_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_gbp_mn, FX.GBP_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_gbp_mn, FX.GBP_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_gbp_mn,       FX.GBP_MN_TO_USD_MN),
    };
  }

  // EUR Mn → USD Mn
  if (c.currency === 'EUR') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_eur_mn,    FX.EUR_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_eur_mn,     FX.EUR_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_eur_mn, FX.EUR_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_eur_mn, FX.EUR_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_eur_mn, FX.EUR_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_eur_mn,       FX.EUR_MN_TO_USD_MN),
    };
  }

  // JPY Bn → USD Mn
  if (c.currency === 'JPY') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_jpy_bn,    FX.JPY_BN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_jpy_bn,     FX.JPY_BN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_jpy_bn, FX.JPY_BN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_jpy_bn, FX.JPY_BN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_jpy_bn, FX.JPY_BN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_jpy_bn,       FX.JPY_BN_TO_USD_MN),
    };
  }

  // HKD Mn → USD Mn
  if (c.currency === 'HKD') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_hkd_mn,    FX.HKD_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_hkd_mn,     FX.HKD_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_hkd_mn, FX.HKD_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_hkd_mn, FX.HKD_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_hkd_mn, FX.HKD_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_hkd_mn,       FX.HKD_MN_TO_USD_MN),
    };
  }

  // AUD Mn → USD Mn
  if (c.currency === 'AUD') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_aud_mn,    FX.AUD_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_aud_mn,     FX.AUD_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_aud_mn, FX.AUD_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_aud_mn, FX.AUD_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_aud_mn, FX.AUD_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_aud_mn,       FX.AUD_MN_TO_USD_MN),
    };
  }

  // SGD Mn → USD Mn
  if (c.currency === 'SGD') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_sgd_mn,    FX.SGD_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_sgd_mn,     FX.SGD_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_sgd_mn, FX.SGD_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_sgd_mn, FX.SGD_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_sgd_mn, FX.SGD_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_sgd_mn,       FX.SGD_MN_TO_USD_MN),
    };
  }

  // SAR Mn → USD Mn
  if (c.currency === 'SAR') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_sar_mn,    FX.SAR_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_sar_mn,     FX.SAR_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_sar_mn, FX.SAR_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_sar_mn, FX.SAR_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_sar_mn, FX.SAR_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_sar_mn,       FX.SAR_MN_TO_USD_MN),
    };
  }
  // KRW Bn → USD Mn
  if (c.currency === 'KRW') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_krw_bn,    FX.KRW_BN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_krw_bn,     FX.KRW_BN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_krw_bn, FX.KRW_BN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_krw_bn, FX.KRW_BN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_krw_bn, FX.KRW_BN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_krw_bn,       FX.KRW_BN_TO_USD_MN),
    };
  }
  // CNY Bn → USD Mn
  if (c.currency === 'CNY') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_cny_bn,    FX.CNY_BN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_cny_bn,     FX.CNY_BN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_cny_bn, FX.CNY_BN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_cny_bn, FX.CNY_BN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_cny_bn, FX.CNY_BN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_cny_bn,       FX.CNY_BN_TO_USD_MN),
    };
  }
  // BRL Bn → USD Mn
  if (c.currency === 'BRL') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_brl_bn,    FX.BRL_BN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_brl_bn,     FX.BRL_BN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_brl_bn, FX.BRL_BN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_brl_bn, FX.BRL_BN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_brl_bn, FX.BRL_BN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_brl_bn,       FX.BRL_BN_TO_USD_MN),
    };
  }
  // ZAR Bn → USD Mn
  if (c.currency === 'ZAR') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_zar_bn,    FX.ZAR_BN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_zar_bn,     FX.ZAR_BN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_zar_bn, FX.ZAR_BN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_zar_bn, FX.ZAR_BN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_zar_bn, FX.ZAR_BN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_zar_bn,       FX.ZAR_BN_TO_USD_MN),
    };
  }
  // CAD Mn → USD Mn
  if (c.currency === 'CAD') {
    return { ...base,
      revenue_usd_mn:    cvt(c.revenue_cad_mn,    FX.CAD_MN_TO_USD_MN),
      ebitda_usd_mn:     cvt(c.ebitda_cad_mn,     FX.CAD_MN_TO_USD_MN),
      net_profit_usd_mn: cvt(c.net_profit_cad_mn, FX.CAD_MN_TO_USD_MN),
      total_debt_usd_mn: cvt(c.total_debt_cad_mn, FX.CAD_MN_TO_USD_MN),
      market_cap_usd_mn: cvt(c.market_cap_cad_mn, FX.CAD_MN_TO_USD_MN),
      evic_usd_mn:       cvt(c.evic_cad_mn,       FX.CAD_MN_TO_USD_MN),
    };
  }
  // Fallback — already lc_m denominated (USD-equivalent fields)
  if (c.revenue_lc_m != null) {
    return { ...base,
      revenue_usd_mn: c.revenue_lc_m, ebitda_usd_mn: c.ebitda_lc_m,
      net_profit_usd_mn: c.net_profit_lc_m, total_debt_usd_mn: c.total_debt_lc_m,
      market_cap_usd_mn: c.market_cap_lc_m, evic_usd_mn: c.evic_lc_m,
    };
  }

  return base;
}

// ── Deterministic PRNG (matches securityUniverse.js) ──────────────────────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, seed) => arr[Math.floor(sr(seed) * arr.length)];
const rng = (min, max, seed) => +(min + sr(seed) * (max - min)).toFixed(2);
const rngInt = (min, max, seed) => Math.floor(min + sr(seed) * (max - min + 1));

// ── Reference arrays for PRNG-generated ESG/climate fields ────────────────────
const MSCI_RATINGS_GCM  = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
const CDP_SCORES_GCM    = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'D-'];
const SBTI_STATUSES_GCM = ['Targets set', 'Committed', 'None'];
const SBTI_CLASS_GCM    = ['1.5\u00b0C', 'WB2\u00b0C', null];
const NZ_YEARS_GCM      = [2030, 2035, 2040, 2045, 2050, null];

// Sector-specific emission intensity multipliers (tCO2e/$M revenue)
const SECTOR_CARBON_INTENSITY = {
  'Energy': [200, 800], 'Materials': [150, 600], 'Industrials': [50, 250],
  'Consumer Discretionary': [20, 120], 'Consumer Staples': [30, 150],
  'Health Care': [8, 50], 'Financials': [3, 20], 'Information Technology': [5, 40],
  'Communication Services': [10, 60], 'Utilities': [300, 900], 'Real Estate': [20, 100],
};

/**
 * Post-normalise: add computed fields that downstream modules depend on.
 * scope1_mt / scope2_mt = megatonnes (scope1_co2e in tonnes / 1e6)
 * Also generates 15 ESG/climate fields deterministically from company index.
 */
let _enrichIdx = 0;
function enrich(c) {
  const idx = _enrichIdx++;
  const seed = idx * 17 + 7777;

  // Sector-aware emission generation
  const ciRange = SECTOR_CARBON_INTENSITY[c.sector] || [20, 200];
  const revUsd = c.revenue_usd_mn || c.revenue_inr_cr || c.revenue_gbp_mn || 1000;

  // Only generate scope3_mt / carbon_intensity if not already present
  const s1 = c.scope1_mt != null ? c.scope1_mt : (c.scope1_co2e != null ? c.scope1_co2e / 1e6 : +rng(0.001, revUsd * 0.0004, seed).toFixed(4));
  const s2 = c.scope2_mt != null ? c.scope2_mt : (c.scope2_co2e != null ? c.scope2_co2e / 1e6 : +rng(0.0005, revUsd * 0.0002, seed + 1).toFixed(4));
  const s3 = c.scope3_mt != null ? c.scope3_mt : +rng(s1 * 1.5, s1 * 8, seed + 2).toFixed(4);
  const carbonIntensity = c.carbon_intensity != null ? c.carbon_intensity : rng(ciRange[0], ciRange[1], seed + 3);

  // SBTi
  const sbtiStatusRaw = c.sbti_status || pick(SBTI_STATUSES_GCM, seed + 4);
  const sbtiClass = c.sbti_classification || (sbtiStatusRaw !== 'None' ? pick(SBTI_CLASS_GCM.filter(Boolean), seed + 5) : null);

  // Temperature alignment: SBTi-aligned companies skew lower
  const tempBase = sbtiStatusRaw === 'Targets set' ? rng(1.3, 2.2, seed + 6)
    : sbtiStatusRaw === 'Committed' ? rng(1.5, 2.5, seed + 6)
    : rng(2.0, 3.8, seed + 6);

  // ESG/MSCI/CDP
  const esgScore = c.esg_score ?? c.esg_combined_score ?? rngInt(25, 95, seed + 7);
  const msciRating = c.msci_rating || pick(MSCI_RATINGS_GCM, seed + 8);
  const cdpScore = c.cdp_score || pick(CDP_SCORES_GCM, seed + 9);

  // EU Taxonomy alignment (tech/renewables/healthcare higher)
  const taxBase = { 'Information Technology': [15, 65], 'Utilities': [20, 80], 'Health Care': [10, 50],
    'Financials': [5, 35], 'Energy': [2, 25] };
  const taxRange = taxBase[c.sector] || [3, 40];
  const taxonomyPct = c.taxonomy_alignment_pct != null ? c.taxonomy_alignment_pct : rng(taxRange[0], taxRange[1], seed + 10);

  // Physical & transition risk (sector-aware)
  const physBase = { 'Energy': [40, 90], 'Utilities': [35, 85], 'Materials': [30, 75], 'Real Estate': [25, 80] };
  const transBase = { 'Energy': [50, 95], 'Materials': [40, 80], 'Utilities': [45, 85], 'Industrials': [30, 70] };
  const physRange = physBase[c.sector] || [10, 60];
  const transRange = transBase[c.sector] || [10, 55];

  const physicalRisk = c.physical_risk_score != null ? c.physical_risk_score : rngInt(physRange[0], physRange[1], seed + 11);
  const transitionRisk = c.transition_risk_score ?? c.risk_score ?? rngInt(transRange[0], transRange[1], seed + 12);

  // Water stress (sector-aware)
  const waterBase = { 'Materials': [30, 90], 'Utilities': [25, 85], 'Energy': [20, 75], 'Consumer Staples': [20, 70] };
  const waterRange = waterBase[c.sector] || [5, 50];
  const waterStress = c.water_stress != null ? c.water_stress : rngInt(waterRange[0], waterRange[1], seed + 13);

  // CBAM exposure (energy, materials, industrials more exposed)
  const cbamSectors = ['Energy', 'Materials', 'Industrials', 'Utilities'];
  const cbamExposed = c.cbam_exposed != null ? c.cbam_exposed : (cbamSectors.includes(c.sector) && sr(seed + 14) > 0.35);

  // Net zero year
  const nzYear = c.net_zero_year ?? c.carbon_neutral_target_year ?? pick(NZ_YEARS_GCM, seed + 15);

  return {
    ...c,
    // Original fields (preserved)
    scope1_mt: s1,
    scope2_mt: s2,
    scope3_mt: s3,
    carbon_intensity: carbonIntensity,
    sbti_status: sbtiStatusRaw,
    sbti_classification: sbtiClass,
    sbti_committed: c.sbti_committed ?? (sbtiStatusRaw !== 'None'),
    temperature_alignment_c: c.temperature_alignment_c ?? tempBase,
    esg_score: esgScore,
    msci_rating: msciRating,
    cdp_score: cdpScore,
    taxonomy_alignment_pct: taxonomyPct,
    physical_risk_score: physicalRisk,
    transition_risk_score: transitionRisk,
    water_stress: waterStress,
    cbam_exposed: cbamExposed,
    net_zero_year: nzYear,
    carbon_neutral_target_year: nzYear,
    data_quality_score: c.data_quality_score ?? c.dqs ?? rngInt(30, 90, seed + 16),
  };
}

// Normalise India companies (they use INR Cr, no currency field — add it)
const normalisedIndia = INDIA_COMPANIES.map(c =>
  normalise({ ...c, currency: 'INR', id: c.id || `${c.ticker}-IN`, countryCode: 'IN', region: 'South Asia' },
    { region: 'South Asia', displayExchange: 'NSE/BSE' })
);

// ── EXCHANGE REGISTRY ─────────────────────────────────────────────────────────
export const EXCHANGES = [
  {
    id: 'NSE_BSE', label: 'India — NSE/BSE', flag: '🇮🇳', currency: 'INR',
    region: 'South Asia', index: 'NIFTY 50',
    gdp_usd_bn: 3733, gdp_rank: 5,
    description: 'National Stock Exchange & Bombay Stock Exchange — SEBI regulated; BRSR Core mandatory for top 1,000 listed companies',
    companies: normalisedIndia,
    sector_gdp_pct: { 'Financials': 20, 'Information Technology': 15, 'Energy': 12, 'Consumer Discretionary': 10, 'Materials': 10, 'Industrials': 8, 'Consumer Staples': 8, 'Health Care': 6, 'Utilities': 5, 'Real Estate': 4 },
    color: '#f97316',
  },
  {
    id: 'NYSE_NASDAQ', label: 'USA — NYSE/NASDAQ', flag: '🇺🇸', currency: 'USD',
    region: 'North America', index: 'S&P 500',
    gdp_usd_bn: 27360, gdp_rank: 1,
    description: 'New York Stock Exchange & NASDAQ — SEC regulated; mandatory TCFD/climate risk disclosure from FY2024',
    companies: USA_COMPANIES.map(c => normalise(c, { region: 'North America', displayExchange: 'NYSE/NASDAQ' })),
    sector_gdp_pct: { 'Information Technology': 27, 'Health Care': 13, 'Financials': 13, 'Consumer Discretionary': 11, 'Industrials': 9, 'Energy': 8, 'Consumer Staples': 6, 'Materials': 3, 'Utilities': 3, 'Real Estate': 3 },
    color: '#3b82f6',
  },
  {
    id: 'LSE', label: 'UK — LSE', flag: '🇬🇧', currency: 'GBP',
    region: 'Europe', index: 'FTSE 100',
    gdp_usd_bn: 3079, gdp_rank: 6,
    description: 'London Stock Exchange — FCA regulated; mandatory TCFD reporting since Apr 2022 for premium listed companies',
    companies: UK_COMPANIES.map(c => normalise(c, { region: 'Europe', displayExchange: 'LSE' })),
    sector_gdp_pct: { 'Financials': 24, 'Energy': 14, 'Health Care': 12, 'Materials': 8, 'Consumer Staples': 8, 'Industrials': 6, 'Consumer Discretionary': 6, 'Communication Services': 5, 'Utilities': 4 },
    color: '#1d4ed8',
  },
  {
    id: 'XETRA', label: 'Germany — XETRA', flag: '🇩🇪', currency: 'EUR',
    region: 'Europe', index: 'DAX 40',
    gdp_usd_bn: 4456, gdp_rank: 3,
    description: 'Deutsche Börse XETRA — BaFin regulated; EU CSRD mandatory FY2024; Germany largest industrial economy in EU',
    companies: GERMANY_COMPANIES.map(c => normalise(c, { region: 'Europe', displayExchange: 'XETRA' })),
    sector_gdp_pct: { 'Industrials': 28, 'Consumer Discretionary': 20, 'Financials': 14, 'Health Care': 11, 'Materials': 9, 'Information Technology': 7, 'Energy': 5, 'Consumer Staples': 4 },
    color: '#7c3aed',
  },
  {
    id: 'EURONEXT', label: 'France — Euronext', flag: '🇫🇷', currency: 'EUR',
    region: 'Europe', index: 'CAC 40',
    gdp_usd_bn: 3031, gdp_rank: 7,
    description: 'Euronext Paris — AMF regulated; EU CSRD mandatory FY2024; CAC 40 among most ESG-progressive blue-chip indices',
    companies: FRANCE_COMPANIES.map(c => normalise(c, { region: 'Europe', displayExchange: 'Euronext' })),
    sector_gdp_pct: { 'Consumer Discretionary': 20, 'Financials': 18, 'Industrials': 16, 'Health Care': 12, 'Energy': 8, 'Materials': 7, 'Consumer Staples': 6, 'Utilities': 5 },
    color: '#a855f7',
  },
  {
    id: 'TSE', label: 'Japan — TSE', flag: '🇯🇵', currency: 'JPY',
    region: 'Asia-Pacific', index: 'Nikkei 225 / TOPIX',
    gdp_usd_bn: 4213, gdp_rank: 4,
    description: 'Tokyo Stock Exchange — FSA regulated; mandatory TCFD/sustainability disclosure for Prime Market companies since Apr 2023',
    companies: JAPAN_COMPANIES.map(c => normalise(c, { region: 'Asia-Pacific', displayExchange: 'TSE' })),
    sector_gdp_pct: { 'Industrials': 21, 'Consumer Discretionary': 18, 'Information Technology': 15, 'Financials': 14, 'Consumer Staples': 8, 'Health Care': 7, 'Materials': 5, 'Energy': 4 },
    color: '#dc2626',
  },
  {
    id: 'HKEX', label: 'Hong Kong — HKEX', flag: '🇭🇰', currency: 'HKD',
    region: 'Asia-Pacific', index: 'Hang Seng Index',
    gdp_usd_bn: 382, gdp_rank: null,
    description: 'Hong Kong Exchanges — SFC regulated; mandatory ESG reporting since 2020; ISSB S1/S2 adoption pathway announced',
    companies: HONGKONG_COMPANIES.map(c => normalise(c, { region: 'Asia-Pacific', displayExchange: 'HKEX' })),
    sector_gdp_pct: { 'Financials': 35, 'Real Estate': 20, 'Consumer Discretionary': 15, 'Information Technology': 10, 'Energy': 8, 'Industrials': 6 },
    color: '#0891b2',
  },
  {
    id: 'ASX', label: 'Australia — ASX', flag: '🇦🇺', currency: 'AUD',
    region: 'Asia-Pacific', index: 'ASX 200',
    gdp_usd_bn: 1707, gdp_rank: 13,
    description: 'Australian Securities Exchange — ASIC regulated; mandatory climate risk disclosure from Jul 2025 under new AASB standards',
    companies: AUSTRALIA_COMPANIES.map(c => normalise(c, { region: 'Asia-Pacific', displayExchange: 'ASX' })),
    sector_gdp_pct: { 'Financials': 30, 'Materials': 22, 'Energy': 10, 'Health Care': 8, 'Real Estate': 7, 'Consumer Staples': 6, 'Industrials': 6 },
    color: '#16a34a',
  },
  {
    id: 'SGX', label: 'Singapore — SGX', flag: '🇸🇬', currency: 'SGD',
    region: 'Asia-Pacific', index: 'STI',
    gdp_usd_bn: 497, gdp_rank: null,
    description: "Singapore Exchange — MAS regulated; mandatory climate reporting for listed issuers from FY2022; ISSB S2 roadmap announced",
    companies: SINGAPORE_COMPANIES.map(c => normalise(c, { region: 'Asia-Pacific', displayExchange: 'SGX' })),
    sector_gdp_pct: { 'Financials': 40, 'Real Estate': 25, 'Industrials': 15, 'Communication Services': 8, 'Consumer Discretionary': 6 },
    color: '#d97706',
  },
  {
    id: 'KRX', label: 'South Korea — KRX', flag: '🇰🇷', currency: 'KRW',
    region: 'Asia-Pacific', index: 'KOSPI',
    gdp_usd_bn: 1709, gdp_rank: 12,
    description: 'Korea Exchange — FSC/FSS regulated; mandatory ESG disclosure for KOSPI 200 companies from 2026; Samsung/Hyundai anchor economy',
    companies: SOUTHKOREA_COMPANIES.map(c => normalise(c, { region: 'Asia-Pacific', displayExchange: 'KRX' })),
    sector_gdp_pct: { 'Information Technology': 25, 'Consumer Discretionary': 20, 'Industrials': 18, 'Financials': 14, 'Materials': 8, 'Health Care': 6, 'Energy': 5 },
    color: '#0f766e',
  },
  {
    id: 'SSE_SZSE', label: 'China — SSE/SZSE', flag: '🇨🇳', currency: 'CNY',
    region: 'Asia-Pacific', index: 'CSI 300',
    gdp_usd_bn: 17795, gdp_rank: 2,
    description: 'Shanghai & Shenzhen Stock Exchanges — CSRC regulated; mandatory ESG/carbon disclosure expanding; world\'s 2nd largest economy',
    companies: CHINA_COMPANIES.map(c => normalise(c, { region: 'Asia-Pacific', displayExchange: 'SSE/SZSE' })),
    sector_gdp_pct: { 'Industrials': 28, 'Financials': 20, 'Consumer Discretionary': 14, 'Information Technology': 12, 'Materials': 10, 'Energy': 8, 'Consumer Staples': 5 },
    color: '#ef4444',
  },
  {
    id: 'B3', label: 'Brazil — B3', flag: '🇧🇷', currency: 'BRL',
    region: 'Latin America', index: 'IBOVESPA',
    gdp_usd_bn: 2174, gdp_rank: 8,
    description: 'B3 Brasil Bolsa Balcão — CVM regulated; Novo Mercado governance standard; Amazon deforestation risk key ESG theme',
    companies: BRAZIL_COMPANIES.map(c => normalise(c, { region: 'Latin America', displayExchange: 'B3' })),
    sector_gdp_pct: { 'Financials': 30, 'Materials': 22, 'Energy': 15, 'Consumer Staples': 12, 'Industrials': 8, 'Consumer Discretionary': 6, 'Utilities': 5 },
    color: '#22c55e',
  },
  {
    id: 'JSE', label: 'South Africa — JSE', flag: '🇿🇦', currency: 'ZAR',
    region: 'Africa', index: 'JSE Top 40',
    gdp_usd_bn: 378, gdp_rank: 32,
    description: 'Johannesburg Stock Exchange — FSCA regulated; King IV governance; mandatory TCFD for large issuers; gateway to Sub-Saharan Africa',
    companies: SOUTHAFRICA_COMPANIES.map(c => normalise(c, { region: 'Africa', displayExchange: 'JSE' })),
    sector_gdp_pct: { 'Financials': 28, 'Materials': 25, 'Consumer Staples': 15, 'Consumer Discretionary': 12, 'Industrials': 8, 'Real Estate': 6, 'Utilities': 4 },
    color: '#f59e0b',
  },
  {
    id: 'TSX', label: 'Canada — TSX', flag: '🇨🇦', currency: 'CAD',
    region: 'North America', index: 'S&P/TSX Composite',
    gdp_usd_bn: 2140, gdp_rank: 9,
    description: 'Toronto Stock Exchange — OSC/CSA regulated; mandatory TCFD for public companies from 2024; resource-heavy economy',
    companies: CANADA_COMPANIES.map(c => normalise(c, { region: 'North America', displayExchange: 'TSX' })),
    sector_gdp_pct: { 'Financials': 34, 'Energy': 18, 'Materials': 14, 'Industrials': 10, 'Consumer Discretionary': 8, 'Consumer Staples': 5, 'Utilities': 4 },
    color: '#ef4444',
  },
];

// ── GLOBAL COMPANY MASTER ─────────────────────────────────────────────────────
export const GLOBAL_COMPANY_MASTER = EXCHANGES.flatMap(ex => ex.companies).map(enrich);

// ── LOOKUP FUNCTIONS ──────────────────────────────────────────────────────────

/** Find companies by exchange ID */
export const getExchange = (id) => EXCHANGES.find(e => e.id === id) || null;

/** All companies for a given exchange ID */
export const getCompaniesByExchange = (exchangeId) => {
  const ex = getExchange(exchangeId);
  return ex ? ex.companies : [];
};

/** All companies for a given GICS sector, across all exchanges */
export const getGlobalCompaniesBySector = (sector) =>
  GLOBAL_COMPANY_MASTER.filter(c => c.sector === sector);

/** Cross-exchange sector comparison: returns companies from multiple exchanges in same sector */
export const crossExchangeSectorComp = (sector, exchangeIds = null) => {
  const pool = exchangeIds
    ? GLOBAL_COMPANY_MASTER.filter(c => exchangeIds.includes(c._displayExchange) || exchangeIds.includes(c.exchange))
    : GLOBAL_COMPANY_MASTER;
  return pool.filter(c => c.sector === sector).sort((a, b) => (b.market_cap_usd_mn || 0) - (a.market_cap_usd_mn || 0));
};

/** Full-text search across ALL exchanges */
export const globalSearch = (query, limit = 20) => {
  if (!query || query.length < 1) return GLOBAL_COMPANY_MASTER.slice(0, limit);
  const q = query.toLowerCase();
  return GLOBAL_COMPANY_MASTER
    .map(c => {
      let score = 0;
      if (c.name?.toLowerCase().startsWith(q)) score += 10;
      else if (c.name?.toLowerCase().includes(q)) score += 6;
      if (c.shortName?.toLowerCase().startsWith(q)) score += 8;
      else if (c.shortName?.toLowerCase().includes(q)) score += 5;
      if (c.ticker?.toLowerCase().startsWith(q)) score += 9;
      if (c.sector?.toLowerCase().includes(q)) score += 3;
      if (c.country?.toLowerCase().includes(q)) score += 2;
      return { ...c, _score: score };
    })
    .filter(c => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...c }) => c);
};

/** All unique GICS sectors across all exchanges */
export const GLOBAL_SECTORS = [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector))].sort();

/** All unique countries */
export const GLOBAL_COUNTRIES = [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.country).filter(Boolean))].sort();

/** All unique regions */
export const GLOBAL_REGIONS = [...new Set(EXCHANGES.map(e => e.region))];

/** Summary stats for the global registry */
export const getGlobalStats = () => {
  const all = GLOBAL_COMPANY_MASTER;
  const withScope1 = all.filter(c => c.scope1_mt > 0);
  const sbtiCount  = all.filter(c => c.sbti_committed).length;
  const totalMarketCap = all.reduce((s, c) => s + (c.market_cap_usd_mn || 0), 0);
  const totalScope1    = all.reduce((s, c) => s + (c.scope1_co2e || c.scope1_mt * 1e6 || 0), 0);
  const avgEsg = all.length > 0 ? +(all.reduce((s, c) => s + (c.esg_score || 0), 0) / all.length).toFixed(1) : 0;
  const avgTemp = all.length > 0 ? +(all.reduce((s, c) => s + (c.temperature_alignment_c || 2.5), 0) / all.length).toFixed(2) : 0;
  const cbamCount = all.filter(c => c.cbam_exposed).length;
  const nzCount = all.filter(c => c.net_zero_year != null).length;
  return {
    total_companies: all.length,
    exchanges: EXCHANGES.length,
    countries: GLOBAL_COUNTRIES.length,
    sectors: GLOBAL_SECTORS.length,
    sbti_committed: sbtiCount,
    with_ghg_data: withScope1.length,
    total_market_cap_usd_bn: Math.round(totalMarketCap / 1000),
    total_scope1_mt_co2e: Math.round(totalScope1 / 1e6),
    avg_esg_score: avgEsg,
    avg_temperature_c: avgTemp,
    cbam_exposed_count: cbamCount,
    net_zero_committed: nzCount,
  };
};

/** GDP sector coverage check: which >5% GDP sectors are covered by at least 1 company */
export const getGDPCoverage = (exchangeId) => {
  const ex = getExchange(exchangeId);
  if (!ex) return {};
  const covered = {};
  for (const [sec, pct] of Object.entries(ex.sector_gdp_pct)) {
    if (pct >= 5) {
      const count = ex.companies.filter(c => c.sector === sec).length;
      covered[sec] = { gdp_pct: pct, companies: count, covered: count > 0 };
    }
  }
  return covered;
};

/** FX rates reference table */
export const FX_RATES = FX;

/** Exchange colour map for charts */
export const EXCHANGE_COLORS = Object.fromEntries(EXCHANGES.map(e => [e.id, e.color]));

// ── NEW HELPER EXPORTS — ESG/Climate query functions ─────────────────────────

/** Companies with SBTi targets set or committed (excludes 'None') */
export const getGlobalSBTiCompanies = () =>
  GLOBAL_COMPANY_MASTER.filter(c => c.sbti_status && c.sbti_status !== 'None');

/** Companies sorted by carbon intensity (highest first) */
export const getGlobalByCarbonIntensity = (limit = 50) =>
  [...GLOBAL_COMPANY_MASTER]
    .filter(c => c.carbon_intensity > 0)
    .sort((a, b) => (b.carbon_intensity || 0) - (a.carbon_intensity || 0))
    .slice(0, limit);

/** Companies grouped by MSCI ESG rating */
export const getGlobalByMSCIRating = (rating = null) => {
  if (rating) return GLOBAL_COMPANY_MASTER.filter(c => c.msci_rating === rating);
  const map = {};
  GLOBAL_COMPANY_MASTER.forEach(c => {
    const r = c.msci_rating || 'NR';
    if (!map[r]) map[r] = [];
    map[r].push(c);
  });
  return map;
};

/** Companies with net-zero targets by year bucket */
export const getGlobalNetZeroCommitments = () => {
  const buckets = { '2030': 0, '2035': 0, '2040': 0, '2045': 0, '2050': 0, 'No Target': 0 };
  GLOBAL_COMPANY_MASTER.forEach(c => {
    const y = c.net_zero_year;
    if (!y) buckets['No Target']++;
    else if (y <= 2030) buckets['2030']++;
    else if (y <= 2035) buckets['2035']++;
    else if (y <= 2040) buckets['2040']++;
    else if (y <= 2045) buckets['2045']++;
    else buckets['2050']++;
  });
  return buckets;
};

/** Companies with high CBAM exposure */
export const getGlobalCBAMExposed = () =>
  GLOBAL_COMPANY_MASTER.filter(c => c.cbam_exposed === true);

/** Temperature alignment distribution across all exchanges */
export const getGlobalTemperatureDistribution = () => {
  const b = { 'Below 1.5\u00b0C': 0, '1.5-2\u00b0C': 0, '2-3\u00b0C': 0, 'Above 3\u00b0C': 0 };
  GLOBAL_COMPANY_MASTER.forEach(c => {
    const t = c.temperature_alignment_c || 2.5;
    if (t < 1.5) b['Below 1.5\u00b0C']++;
    else if (t < 2) b['1.5-2\u00b0C']++;
    else if (t < 3) b['2-3\u00b0C']++;
    else b['Above 3\u00b0C']++;
  });
  return b;
};

/** Physical risk breakdown: low/medium/high/very-high */
export const getGlobalPhysicalRiskBreakdown = () => {
  const b = { low: 0, medium: 0, high: 0, veryHigh: 0 };
  GLOBAL_COMPANY_MASTER.forEach(c => {
    const s = c.physical_risk_score || 0;
    if (s < 25) b.low++;
    else if (s < 50) b.medium++;
    else if (s < 75) b.high++;
    else b.veryHigh++;
  });
  return b;
};

/** EU Taxonomy alignment summary across all exchanges */
export const getGlobalTaxonomyAlignment = () => {
  const all = GLOBAL_COMPANY_MASTER.filter(c => c.taxonomy_alignment_pct != null);
  if (!all.length) return { avg: 0, median: 0, count: 0 };
  const sorted = [...all].sort((a, b) => a.taxonomy_alignment_pct - b.taxonomy_alignment_pct);
  return {
    avg: +(all.reduce((s, c) => s + c.taxonomy_alignment_pct, 0) / all.length).toFixed(1),
    median: sorted[Math.floor(sorted.length / 2)].taxonomy_alignment_pct,
    count: all.length,
  };
};

/** Water stress breakdown by severity */
export const getGlobalWaterStressBreakdown = () => {
  const b = { low: 0, medium: 0, high: 0, extremelyHigh: 0 };
  GLOBAL_COMPANY_MASTER.forEach(c => {
    const s = c.water_stress || 0;
    if (s < 25) b.low++;
    else if (s < 50) b.medium++;
    else if (s < 75) b.high++;
    else b.extremelyHigh++;
  });
  return b;
};
