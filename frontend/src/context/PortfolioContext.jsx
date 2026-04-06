/**
 * PortfolioContext.jsx — Universal Data Integration Layer
 *
 * Provides a single React Context wrapping the full security universe,
 * mock portfolio, reference data, and adapter functions so any module
 * can consume shared data without importing multiple files directly.
 *
 * Usage:
 *   import { usePortfolio } from '../context/PortfolioContext';
 *   const { securities, holdings, searchSecurities, portfolioMetrics } = usePortfolio();
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';

// ── Security Universe ──────────────────────────────────────────────────────
import {
  SECURITY_UNIVERSE,
  MOCK_PORTFOLIO,
  EQUITIES,
  BONDS,
  ALTERNATIVES,
  SECTORS,
  REGIONS,
  INDICES,
  UNIVERSE_STATS,
  PORTFOLIO_HOLDINGS,
  EQUITY_HOLDINGS,
  BOND_HOLDINGS,
  SOVEREIGN_HOLDINGS,
  PROJECT_HOLDINGS,
  RE_HOLDINGS,
  GREEN_BOND_HOLDINGS,
  getCompanyById,
  getCompanyByTicker,
  getCompaniesBySector,
  getCompaniesByCountry,
  getCompaniesByRegion,
  searchCompanies,
  getTopEmitters,
  getTopESG,
  getHighTransitionRisk,
  getSBTiValidated,
  getNetZeroCommitted,
  getHighPhysicalRisk,
  getByMsciRating,
  getByTransitionPlan,
  getControversial,
  getSectorAggregates,
  getRegionAggregates,
  getMsciDistribution,
  getCdpDistribution,
  getTemperatureAlignmentBuckets,
  getEmissionsQuartiles,
  getRatingDivergence,
  getFinancedEmissionsLeaderboard,
  getTaxonomyAlignmentSummary,
  getCarbonPriceExposure,
  getNetZeroReadiness,
  getBoardDiversityAnalysis,
  getPortfolioValue,
  getWeightedPCAF,
  getAssetClassBreakdown,
  getEngagementSummary,
  getPCAFBreakdown,
} from '../data/securityUniverse';

// ── Reference Data (all 30 datasets) ──────────────────────────────────────
import {
  EMISSION_FACTORS,
  CARBON_PRICES,
  GWP_VALUES,
  GRID_INTENSITY,
  REGULATORY_THRESHOLDS,
  PCAF_DATA_QUALITY,
  NGFS_SCENARIOS,
  SECTOR_BENCHMARKS,
  TEMPERATURE_PATHWAYS,
  TAXONOMY_THRESHOLDS,
  CONTROVERSY_SEVERITY,
  CII_THRESHOLDS,
  CORSIA_BASELINES,
  getGridIntensity,
  getSectorBenchmark,
  getNGFSScenario,
  getPCAFDefinition,
  getCIIRating,
  getRemainingBudget,
  getControversySeverity,
} from '../data/referenceData';

// ── Adapters ─────────────────────────────────────────────────────────────
import {
  adaptForPcaf,
  adaptForEsgRatings,
  adaptForTemperatureScore,
  adaptForStressTest,
  adaptForTable,
  adaptCompanyList,
} from '../data/adapters';


// ─── Helpers ────────────────────────────────────────────────────────────────

const num = (v, fb = 0) => (v != null && !isNaN(v) ? +v : fb);

/** Compute portfolio-level aggregate metrics from holdings + securities */
function computePortfolioMetrics(securities, holdings) {
  const totalAUM = holdings.reduce((s, h) => s + num(h.marketValue), 0);
  const holdingsCount = holdings.length;

  // Sector allocation
  const sectorMap = {};
  holdings.forEach(h => {
    const co = securities.find(c => c.id === h.companyId);
    const sector = co?.sector || 'Other';
    sectorMap[sector] = (sectorMap[sector] || 0) + num(h.marketValue);
  });
  const sectorAllocation = Object.entries(sectorMap)
    .map(([sector, value]) => ({ sector, value, pct: totalAUM ? value / totalAUM : 0 }))
    .sort((a, b) => b.value - a.value);

  // Country allocation
  const countryMap = {};
  holdings.forEach(h => {
    const co = securities.find(c => c.id === h.companyId);
    const country = co?.country || 'Unknown';
    countryMap[country] = (countryMap[country] || 0) + num(h.marketValue);
  });
  const countryAllocation = Object.entries(countryMap)
    .map(([country, value]) => ({ country, value, pct: totalAUM ? value / totalAUM : 0 }))
    .sort((a, b) => b.value - a.value);

  // Financed emissions (sum of attributed emissions across holdings)
  let totalFinancedEmissions = 0;
  holdings.forEach(h => {
    const co = securities.find(c => c.id === h.companyId);
    if (co?.totalEmissions && co?.marketCap) {
      const attributionFactor = num(h.marketValue) / (num(co.marketCap, 1) * 1e9);
      totalFinancedEmissions += num(co.totalEmissions) * attributionFactor;
    }
  });

  // Weighted-average temperature score
  let tempNumerator = 0, tempDenominator = 0;
  holdings.forEach(h => {
    const co = securities.find(c => c.id === h.companyId);
    if (co?.temperatureAlignment) {
      const w = num(h.marketValue);
      tempNumerator += num(co.temperatureAlignment) * w;
      tempDenominator += w;
    }
  });
  const portfolioTemperatureScore = tempDenominator ? +(tempNumerator / tempDenominator).toFixed(2) : 2.4;

  // Weighted-average ESG composite score (using S&P Global as proxy)
  let esgNumerator = 0, esgDenominator = 0;
  holdings.forEach(h => {
    const co = securities.find(c => c.id === h.companyId);
    if (co?.spGlobalScore) {
      const w = num(h.marketValue);
      esgNumerator += num(co.spGlobalScore) * w;
      esgDenominator += w;
    }
  });
  const esgCompositeScore = esgDenominator ? +(esgNumerator / esgDenominator).toFixed(1) : 52;

  // Coverage statistics
  const withEsg = holdings.filter(h => {
    const co = securities.find(c => c.id === h.companyId);
    return co?.spGlobalScore || co?.msciRating;
  }).length;
  const withEmissions = holdings.filter(h => {
    const co = securities.find(c => c.id === h.companyId);
    return co?.totalEmissions > 0;
  }).length;

  return {
    totalAUM,
    holdingsCount,
    sectorAllocation,
    countryAllocation,
    totalFinancedEmissions: +totalFinancedEmissions.toFixed(2),
    portfolioTemperatureScore,
    esgCompositeScore,
    coverage: {
      esgPct: holdingsCount ? +(withEsg / holdingsCount * 100).toFixed(1) : 0,
      emissionsPct: holdingsCount ? +(withEmissions / holdingsCount * 100).toFixed(1) : 0,
      esgCount: withEsg,
      emissionsCount: withEmissions,
    },
  };
}


// ─── Context ────────────────────────────────────────────────────────────────

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  // Pre-compute metrics; deps listed so React can re-run if data sources ever become dynamic
  const portfolioMetrics = useMemo(
    () => computePortfolioMetrics(SECURITY_UNIVERSE, PORTFOLIO_HOLDINGS),
    [SECURITY_UNIVERSE, PORTFOLIO_HOLDINGS] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Search / filter utilities (stable refs via useCallback) ──

  const searchSecurities = useCallback((query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return SECURITY_UNIVERSE.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.ticker?.toLowerCase().includes(q) ||
      c.isin?.toLowerCase().includes(q)
    );
  }, []);

  const filterByRegion = useCallback((region) => {
    return SECURITY_UNIVERSE.filter(c => c.region === region);
  }, []);

  const filterBySector = useCallback((sector) => {
    return SECURITY_UNIVERSE.filter(c => c.sector === sector);
  }, []);

  const filterByAssetType = useCallback((type) => {
    if (type === 'equity') return EQUITY_HOLDINGS;
    if (type === 'bond') return BOND_HOLDINGS;
    if (type === 'sovereign') return SOVEREIGN_HOLDINGS;
    if (type === 'project') return PROJECT_HOLDINGS;
    if (type === 'realEstate') return RE_HOLDINGS;
    if (type === 'greenBond') return GREEN_BOND_HOLDINGS;
    return PORTFOLIO_HOLDINGS;
  }, []);

  const getTopHoldings = useCallback((n = 10) => {
    return [...PORTFOLIO_HOLDINGS]
      .sort((a, b) => num(b.marketValue) - num(a.marketValue))
      .slice(0, n);
  }, []);

  const getPortfolioByPCAFClass = useCallback(() => {
    const classes = {};
    PORTFOLIO_HOLDINGS.forEach(h => {
      const cls = h.assetClass || 'Other';
      if (!classes[cls]) classes[cls] = { assetClass: cls, holdings: [], totalValue: 0 };
      classes[cls].holdings.push(h);
      classes[cls].totalValue += num(h.marketValue);
    });
    return Object.values(classes).sort((a, b) => b.totalValue - a.totalValue);
  }, []);

  // Memoise the full value object
  const value = useMemo(() => ({
    // ── Security Universe ──
    securities: SECURITY_UNIVERSE,
    companies: SECURITY_UNIVERSE,         // backward-compatible alias
    equities: EQUITIES,
    bonds: BONDS,
    alternatives: ALTERNATIVES,
    sectors: SECTORS,
    regions: REGIONS,
    indices: INDICES,
    universeStats: UNIVERSE_STATS,

    // Universe lookup helpers
    getCompanyById,
    getCompanyByTicker,
    getCompaniesBySector,
    getCompaniesByCountry,
    getCompaniesByRegion,
    searchCompanies,
    getTopEmitters,
    getTopESG,
    getHighTransitionRisk,
    getSBTiValidated,
    getNetZeroCommitted,
    getHighPhysicalRisk,
    getByMsciRating,
    getByTransitionPlan,
    getControversial,
    getSectorAggregates,
    getRegionAggregates,
    getMsciDistribution,
    getCdpDistribution,
    getTemperatureAlignmentBuckets,
    getEmissionsQuartiles,
    getRatingDivergence,
    getFinancedEmissionsLeaderboard,
    getTaxonomyAlignmentSummary,
    getCarbonPriceExposure,
    getNetZeroReadiness,
    getBoardDiversityAnalysis,

    // ── Portfolio ──
    portfolio: MOCK_PORTFOLIO,
    holdings: PORTFOLIO_HOLDINGS,
    equityHoldings: EQUITY_HOLDINGS,
    bondHoldings: BOND_HOLDINGS,
    sovereignHoldings: SOVEREIGN_HOLDINGS,
    projectHoldings: PROJECT_HOLDINGS,
    reHoldings: RE_HOLDINGS,
    greenBondHoldings: GREEN_BOND_HOLDINGS,
    getPortfolioValue,
    getWeightedPCAF,
    getAssetClassBreakdown,
    getEngagementSummary,
    getPCAFBreakdown,

    // ── Computed Portfolio Metrics ──
    portfolioMetrics,

    // ── Search / Filter Utilities ──
    searchSecurities,
    filterByRegion,
    filterBySector,
    filterByAssetType,
    getTopHoldings,
    getPortfolioByPCAFClass,

    // ── Reference Data ──
    emissionFactors: EMISSION_FACTORS,
    carbonPrices: CARBON_PRICES,
    gwpValues: GWP_VALUES,
    gridIntensity: GRID_INTENSITY,
    regulatoryThresholds: REGULATORY_THRESHOLDS,
    pcafDataQuality: PCAF_DATA_QUALITY,
    ngfsScenarios: NGFS_SCENARIOS,
    sectorBenchmarks: SECTOR_BENCHMARKS,
    temperaturePathways: TEMPERATURE_PATHWAYS,
    taxonomyThresholds: TAXONOMY_THRESHOLDS,
    controversySeverity: CONTROVERSY_SEVERITY,
    ciiThresholds: CII_THRESHOLDS,
    corsiaBaselines: CORSIA_BASELINES,

    // Reference helpers
    getGridIntensity,
    getSectorBenchmark,
    getNGFSScenario,
    getPCAFDefinition,
    getCIIRating,
    getRemainingBudget,
    getControversySeverity,

    // ── Adapters (for module-specific transforms) ──
    adaptForPcaf,
    adaptForEsgRatings,
    adaptForTemperatureScore,
    adaptForStressTest,
    adaptForTable,
    adaptCompanyList,
  }), [portfolioMetrics, searchSecurities, filterByRegion, filterBySector,
       filterByAssetType, getTopHoldings, getPortfolioByPCAFClass]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a <PortfolioProvider>');
  }
  return ctx;
}

export default PortfolioContext;
