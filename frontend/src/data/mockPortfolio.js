/**
 * Mock Client Portfolio — 100 holdings from the GLOBAL_COMPANY_MASTER
 * Simulates a $10bn multi-asset institutional portfolio (Article 9 / Net Zero mandate)
 *
 * Asset class mix: 60 Listed Equity, 25 Corporate Bond, 5 Sovereign Bond,
 *                  5 Project Finance, 5 Commercial Real Estate
 *
 * Deterministic seed: NO Math.random(). All generated values use sr(seed).
 * companyId = "CO-XXXX" string matching masterUniverse.COMPANY_UNIVERSE[].id
 */

// Deterministic PRNG — sine-based, seeded
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Portfolio Metadata ──────────────────────────────────────────────────────

export const PORTFOLIO_META = {
  name: 'AA Impact Global Sustainable Fund',
  aum: 10_000_000_000, // $10bn
  currency: 'USD',
  benchmark: 'MSCI ACWI ESG Leaders',
  manager: 'AA Impact Inc.',
  inception: '2020-01-15',
  sfdrClassification: 'Article 9',
  mandate: 'Net Zero 2050 aligned',
  reportingDate: '2024-12-31',
  domicile: 'Luxembourg',
  custodian: 'BNY Mellon',
  auditor: 'PwC Luxembourg',
  navFrequency: 'Daily',
};

// ─── Deterministic helpers ───────────────────────────────────────────────────

const ASSET_CLASSES = [
  'Listed Equity', 'Listed Equity', 'Listed Equity', 'Listed Equity',
  'Listed Equity', 'Listed Equity', 'Listed Equity', 'Listed Equity',
  'Listed Equity', 'Listed Equity', 'Listed Equity', 'Listed Equity',
  'Corporate Bond', 'Corporate Bond', 'Corporate Bond', 'Corporate Bond',
  'Corporate Bond', 'Sovereign Bond', 'Project Finance', 'Commercial Real Estate',
];

const ENGAGEMENT_STATUSES = ['None', 'Identified', 'Engaged', 'Monitoring', 'Resolved'];
const VOTING_OPTIONS = ['For', 'Against', 'Abstain', 'WithMgmt'];
const PCAF_BY_ASSET = {
  'Listed Equity': 1,
  'Corporate Bond': 2,
  'Sovereign Bond': 3,
  'Project Finance': 4,
  'Commercial Real Estate': 5,
};

// 100 company indices — hand-curated to span sectors, geographies, risk profiles
// These reference GLOBAL_COMPANY_MASTER array positions
const COMPANY_IDS = [
  // ── Listed Equity (60) — diversified global equity book ──
  0,   1,   2,   3,   4,   5,   6,   7,   8,   9,   // India: Reliance, ONGC, TCS, Infosys, HDFC Bank, ICICI, L&T, Tata Steel, JSW, Adani Green
  10,  11,  12,  13,  14,  15,  16,  17,  18,  19,  // India cont: SBI, ITC, Bharti Airtel, HUL, Wipro, Coal India, NTPC, Power Grid, UPL, Hindalco
  20,  21,  22,  23,  24,  25,  26,  27,  28,  29,  // India cont: Adani Ports, Sun Pharma, Bajaj Finance, Asian Paints, Dr Reddy, Titan, Maruti, BPCL, IOC, Grasim
  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  // India/USA: Vedanta, Tata Motors, Hero Moto, Pidilite, DLF + USA: Apple, Microsoft, Amazon, Alphabet, JPMorgan
  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  // USA/UK: Exxon, Chevron, J&J, UnitedHealth, Tesla, Berkshire, P&G + UK: Shell, BP, HSBC
  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,  // UK/EU/Japan: AstraZeneca, Unilever, Rio Tinto, Glencore, BHP + Siemens, BASF, SAP, Toyota, Sony, Samsung

  // ── Corporate Bond (25) — investment-grade & crossover credit ──
  60,  61,  62,  63,  64,  65,  66,  67,  68,  69,  // Misc global: LVMH, TotalEnergies, Nestlé, Novartis, Roche, Sanofi, ArcelorMittal, Mitsubishi, Sumitomo, SoftBank
  70,  71,  72,  73,  74,  75,  76,  77,  78,  79,  // BNP, Société Générale, Deutsche Bank, Allianz, Munich Re, CBA, Woodside, Tencent, Alibaba, PetroChina
  80,  81,  82,  83,  84,                             // ICBC, China Construction, Vale, Petrobras, Itaú Unibanco

  // ── Sovereign Bond (5) — green & transition sovereign paper ──
  85,  86,  87,  88,  89,

  // ── Project Finance (5) — renewable energy & infra ──
  90,  91,  92,  93,  94,

  // ── Commercial Real Estate (5) — direct property / REITs ──
  95,  96,  97,  98,  99,
];

// ─── Generate 100 holdings deterministically ─────────────────────────────────

function generateHolding(idx, companyId) {
  const seed = idx * 7 + 42; // deterministic offset
  const r = (offset) => sr(seed + offset);

  // Determine asset class from pre-defined distribution
  let assetClass;
  if (idx < 60) assetClass = 'Listed Equity';
  else if (idx < 85) assetClass = 'Corporate Bond';
  else if (idx < 90) assetClass = 'Sovereign Bond';
  else if (idx < 95) assetClass = 'Project Finance';
  else assetClass = 'Commercial Real Estate';

  const pcaf = PCAF_BY_ASSET[assetClass];

  // Weight: equity gets 0.5-3.5%, bonds 0.3-2.0%, others 0.2-1.5%
  let weight;
  if (assetClass === 'Listed Equity') {
    weight = +(0.5 + r(1) * 3.0).toFixed(2);
  } else if (assetClass === 'Corporate Bond') {
    weight = +(0.3 + r(1) * 1.7).toFixed(2);
  } else {
    weight = +(0.2 + r(1) * 1.3).toFixed(2);
  }

  // Shares (equity) or face value references
  const shares = assetClass === 'Listed Equity'
    ? Math.round(50000 + r(2) * 450000)
    : 0;

  // Cost basis and current price (for equity/bonds)
  const costBasis = +(20 + r(3) * 280).toFixed(2);
  const priceMove = 0.7 + r(4) * 0.8; // 0.7x to 1.5x gain/loss
  const currentPrice = +(costBasis * priceMove).toFixed(2);

  // Outstanding amount for PCAF attribution ($M)
  const outstandingAmount = Math.round(50_000_000 + r(5) * 950_000_000);

  // Acquisition date: spread across 2019-2024
  const yearOffset = Math.floor(r(6) * 6); // 0-5
  const monthOffset = Math.floor(r(7) * 12) + 1;
  const dayOffset = Math.floor(r(8) * 28) + 1;
  const acqYear = 2019 + yearOffset;
  const acqMonth = String(monthOffset).padStart(2, '0');
  const acqDay = String(dayOffset).padStart(2, '0');
  const acquisitionDate = `${acqYear}-${acqMonth}-${acqDay}`;

  // Engagement status — weighted toward 'Monitoring' and 'None'
  const engIdx = Math.floor(r(9) * 10);
  const engagementStatus = engIdx < 3 ? 'None'
    : engIdx < 5 ? 'Identified'
    : engIdx < 7 ? 'Engaged'
    : engIdx < 9 ? 'Monitoring'
    : 'Resolved';

  // Voting proxy — equity only
  const voteIdx = Math.floor(r(10) * 10);
  const votingProxy = assetClass === 'Listed Equity'
    ? (voteIdx < 5 ? 'For' : voteIdx < 7 ? 'WithMgmt' : voteIdx < 9 ? 'Against' : 'Abstain')
    : null;

  // Bond-specific fields
  const coupon = (assetClass === 'Corporate Bond' || assetClass === 'Sovereign Bond')
    ? +(1.5 + r(11) * 5.5).toFixed(3)
    : null;
  const maturityYears = (assetClass === 'Corporate Bond' || assetClass === 'Sovereign Bond')
    ? Math.round(2 + r(12) * 18)
    : null;
  const maturityDate = maturityYears
    ? `${2024 + maturityYears}-${acqMonth}-15`
    : null;
  const creditRating = (assetClass === 'Corporate Bond')
    ? ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'][Math.floor(r(13) * 10)]
    : (assetClass === 'Sovereign Bond')
      ? ['AAA','AA+','AA','AA-','A+'][Math.floor(r(13) * 5)]
      : null;

  // Green bond / sustainability-linked flag
  const isGreenBond = (assetClass === 'Corporate Bond' || assetClass === 'Sovereign Bond')
    ? r(14) > 0.65
    : false;

  // CRE-specific fields
  const propertyType = assetClass === 'Commercial Real Estate'
    ? ['Office','Retail','Industrial','Logistics','Mixed-Use'][Math.floor(r(15) * 5)]
    : null;
  const buildingArea_sqm = assetClass === 'Commercial Real Estate'
    ? Math.round(5000 + r(16) * 95000)
    : null;
  const epcRating = assetClass === 'Commercial Real Estate'
    ? ['A','B','C','D','E'][Math.floor(r(17) * 5)]
    : null;

  // Project Finance specifics
  const projectType = assetClass === 'Project Finance'
    ? ['Solar Farm','Onshore Wind','Offshore Wind','Battery Storage','Green Hydrogen'][Math.floor(r(18) * 5)]
    : null;
  const capacityMW = assetClass === 'Project Finance'
    ? Math.round(50 + r(19) * 950)
    : null;

  // Convert numeric index to masterUniverse "CO-XXXX" string format
  const universeId = typeof companyId === 'number' ? `CO-${String(companyId + 1).padStart(4, '0')}` : companyId;

  return {
    companyId: universeId,
    weight,
    shares,
    costBasis,
    currentPrice,
    assetClass,
    pcafAssetClass: pcaf,
    outstandingAmount,
    acquisitionDate,
    engagementStatus,
    votingProxy,
    // Bond fields
    coupon,
    maturityDate,
    creditRating,
    isGreenBond,
    // CRE fields
    propertyType,
    buildingArea_sqm,
    epcRating,
    // Project Finance fields
    projectType,
    capacityMW,
  };
}

// ─── Build the 100 holdings ──────────────────────────────────────────────────

export const PORTFOLIO_HOLDINGS = COMPANY_IDS.map((cid, idx) => generateHolding(idx, cid));

// Normalise weights so they sum to exactly 100%
const rawSum = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.weight, 0);
PORTFOLIO_HOLDINGS.forEach(h => {
  h.weight = +((h.weight / rawSum) * 100).toFixed(3);
});

// ─── Pre-built portfolio slices ──────────────────────────────────────────────

export const EQUITY_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Listed Equity');
export const BOND_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Corporate Bond');
export const SOVEREIGN_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Sovereign Bond');
export const PROJECT_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Project Finance');
export const RE_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Commercial Real Estate');
export const GREEN_BOND_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.isGreenBond);

// ─── Portfolio-level analytics helpers ───────────────────────────────────────

/** Total portfolio value at current prices */
export const getPortfolioValue = () =>
  PORTFOLIO_HOLDINGS.reduce((sum, h) => sum + (h.weight / 100) * PORTFOLIO_META.aum, 0);

/** Weighted average data quality score (PCAF) */
export const getWeightedPCAF = () => {
  const total = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.weight * h.pcafAssetClass, 0);
  return +(total / 100).toFixed(2);
};

/** Asset class breakdown (weight %) */
export const getAssetClassBreakdown = () => {
  const breakdown = {};
  PORTFOLIO_HOLDINGS.forEach(h => {
    breakdown[h.assetClass] = (breakdown[h.assetClass] || 0) + h.weight;
  });
  return Object.entries(breakdown)
    .map(([cls, wt]) => ({ assetClass: cls, weight: +wt.toFixed(2) }))
    .sort((a, b) => b.weight - a.weight);
};

/** Engagement funnel summary */
export const getEngagementSummary = () => {
  const counts = { None: 0, Identified: 0, Engaged: 0, Monitoring: 0, Resolved: 0 };
  PORTFOLIO_HOLDINGS.forEach(h => { counts[h.engagementStatus]++; });
  return counts;
};

/** Holdings by PCAF asset class with count and weight */
export const getPCAFBreakdown = () => {
  const groups = {};
  PORTFOLIO_HOLDINGS.forEach(h => {
    if (!groups[h.pcafAssetClass]) groups[h.pcafAssetClass] = { count: 0, weight: 0 };
    groups[h.pcafAssetClass].count++;
    groups[h.pcafAssetClass].weight += h.weight;
  });
  return Object.entries(groups).map(([pcaf, data]) => ({
    pcafClass: +pcaf,
    count: data.count,
    weight: +data.weight.toFixed(2),
  }));
};
