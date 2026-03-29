/**
 * securityUniverse.js — Canonical Security Universe Re-export
 *
 * Unified entry point that re-exports the full security universe from
 * masterUniverse + mockPortfolio under a consistent naming convention.
 * Modules should import from this file (or use PortfolioContext) rather
 * than reaching into masterUniverse / mockPortfolio directly.
 */

export {
  COMPANY_UNIVERSE as SECURITY_UNIVERSE,
  COMPANY_UNIVERSE,
  SECTORS,
  REGIONS,
  INDICES,
  UNIVERSE_STATS,

  // Lookup helpers
  getCompanyById,
  getCompanyByTicker,
  getCompaniesBySector,
  getCompaniesByCountry,
  getCompaniesByRegion,
  searchCompanies,

  // Analytic slices
  getTopEmitters,
  getTopESG,
  getHighTransitionRisk,
  getSBTiValidated,
  getNetZeroCommitted,
  getHighPhysicalRisk,
  getByMsciRating,
  getByTransitionPlan,
  getControversial,

  // Aggregates
  getSectorAggregates,
  getRegionAggregates,
  getMsciDistribution,
  getCdpDistribution,
  getTemperatureAlignmentBuckets,
  getEmissionsQuartiles,
  getQuarterlyTrend,
  getRatingDivergence,
  getFinancedEmissionsLeaderboard,
  getTaxonomyAlignmentSummary,
  getCarbonPriceExposure,
  getNetZeroReadiness,
  getBoardDiversityAnalysis,
  buildPortfolio,
} from './masterUniverse';

export {
  PORTFOLIO_META as MOCK_PORTFOLIO,
  PORTFOLIO_META,
  PORTFOLIO_HOLDINGS,
  EQUITY_HOLDINGS as EQUITIES,
  EQUITY_HOLDINGS,
  BOND_HOLDINGS as BONDS,
  BOND_HOLDINGS,
  SOVEREIGN_HOLDINGS,
  PROJECT_HOLDINGS,
  RE_HOLDINGS,
  GREEN_BOND_HOLDINGS,
  PORTFOLIO_HOLDINGS as ALTERNATIVES,

  // Portfolio analytics
  getPortfolioValue,
  getWeightedPCAF,
  getAssetClassBreakdown,
  getEngagementSummary,
  getPCAFBreakdown,
} from './mockPortfolio';
