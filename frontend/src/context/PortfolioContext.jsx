/**
 * PortfolioContext.jsx — Shared Data Integration Layer
 *
 * Provides a single React Context wrapping the masterUniverse, mockPortfolio,
 * and referenceData files so any module can consume shared data without
 * importing multiple files directly.
 *
 * Usage:
 *   import { usePortfolio } from '../context/PortfolioContext';
 *   const { companies, holdings, getCompanyById } = usePortfolio();
 */

import React, { createContext, useContext, useMemo } from 'react';

import {
  COMPANY_UNIVERSE,
  SECTORS,
  REGIONS,
  getCompanyById,
  getCompanyByTicker,
  getCompaniesBySector,
  getCompaniesByCountry,
  getCompaniesByRegion,
  getTopEmitters,
  getTopESG,
  getHighTransitionRisk,
  getSBTiValidated,
  getNetZeroCommitted,
  getHighPhysicalRisk,
  getByMsciRating,
  getByTransitionPlan,
  getControversial,
  searchCompanies,
  getSectorAggregates,
  getRegionAggregates,
  UNIVERSE_STATS,
} from '../data/masterUniverse';

import {
  PORTFOLIO_META,
  PORTFOLIO_HOLDINGS,
  EQUITY_HOLDINGS,
  BOND_HOLDINGS,
  SOVEREIGN_HOLDINGS,
  PROJECT_HOLDINGS,
  RE_HOLDINGS,
  GREEN_BOND_HOLDINGS,
  getPortfolioValue,
  getWeightedPCAF,
  getAssetClassBreakdown,
  getEngagementSummary,
  getPCAFBreakdown,
} from '../data/mockPortfolio';

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

// ─── Context ────────────────────────────────────────────────────────────────

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  // Memoise the value object so consumers don't re-render on every parent render
  const value = useMemo(() => ({
    // ── Company universe ──
    companies: COMPANY_UNIVERSE,
    sectors: SECTORS,
    regions: REGIONS,
    universeStats: UNIVERSE_STATS,
    getCompanyById,
    getCompanyByTicker,
    getCompaniesBySector,
    getCompaniesByCountry,
    getCompaniesByRegion,
    getTopEmitters,
    getTopESG,
    getHighTransitionRisk,
    getSBTiValidated,
    getNetZeroCommitted,
    getHighPhysicalRisk,
    getByMsciRating,
    getByTransitionPlan,
    getControversial,
    searchCompanies,
    getSectorAggregates,
    getRegionAggregates,

    // ── Portfolio ──
    portfolio: PORTFOLIO_META,
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

    // ── Reference data ──
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
    ciiThresholds: CII_THRESHOLDS,
    corsiaBaselines: CORSIA_BASELINES,

    // ── Reference helpers ──
    getGridIntensity,
    getSectorBenchmark,
    getNGFSScenario,
    getPCAFDefinition,
    getCIIRating,
    getRemainingBudget,
    getControversySeverity,
  }), []);

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
