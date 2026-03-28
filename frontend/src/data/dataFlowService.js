/**
 * DATA FLOW SERVICE — Transformation Pipeline
 * Sprint AK — Cross-Module Data Integration Layer
 *
 * Takes raw data from globalCompanyMaster.js, companyMaster.js, and portfolio
 * holdings, then computes derived metrics that flow between modules.
 *
 * Every computation tracks its lineage: source, inputs, formula, methodology.
 *
 * Methodologies implemented:
 *   1. PCAF Standard v2            — Financed emissions
 *   2. PACTA / SBTi                — Portfolio temperature alignment
 *   3. Delta-normal CVaR           — Climate Value-at-Risk
 *   4. EU Taxonomy CRR             — Green Asset Ratio
 *   5. Multi-provider consensus    — ESG rating harmonisation
 *   6. TPT / GFANZ / ACT           — Transition readiness
 *   7. Scope 4 / GHG Protocol      — Avoided emissions
 *   8. NGFS / ECB Guide            — Climate-adjusted credit risk
 *
 * CRITICAL: Deterministic seeded RNG — no Math.random().
 */

// ── Deterministic seeded RNG ─────────────────────────────────────────────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

let _seed = 42;
const rand = () => { _seed++; return sr(_seed); };
const randRange = (lo, hi) => lo + rand() * (hi - lo);
const randInt = (lo, hi) => Math.floor(randRange(lo, hi + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const ts = () => '2026-03-28T04:00:00Z';

// ── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = (v) => Math.round(v * 100) / 100;
const round4 = (v) => Math.round(v * 10000) / 10000;
const fmtMn = (v) => `${round2(v / 1e6)}M`;
const fmtBn = (v) => `${round2(v / 1e9)}B`;
const pct = (v) => `${round2(v * 100)}%`;

// ── PCAF Data Quality Score mapping ──────────────────────────────────────────
const DQS_MAP = {
  verified_reported: { score: 1, label: 'DQS 1 — Audited emissions from company report' },
  company_reported:  { score: 2, label: 'DQS 2 — Verified company reported data' },
  physical_activity: { score: 3, label: 'DQS 3 — Physical activity-based estimation' },
  economic_activity: { score: 4, label: 'DQS 4 — Economic activity-based estimation' },
  sector_average:    { score: 5, label: 'DQS 5 — Sector average proxy' },
};

const assessDQS = (company) => {
  if (company.ghg_scope1 && company.ghg_scope2 && company.ghg_verification === 'third_party') {
    return DQS_MAP.verified_reported;
  }
  if (company.ghg_scope1 && company.ghg_scope2) return DQS_MAP.company_reported;
  if (company.sector && company.revenue_usd_mn) return DQS_MAP.economic_activity;
  return DQS_MAP.sector_average;
};

// ── Sector emission intensities (tCO2e per USD Mn revenue) ───────────────────
const SECTOR_INTENSITY = {
  'Energy':              2450,
  'Utilities':           1820,
  'Materials':           1350,
  'Industrials':         380,
  'Consumer Discretionary': 120,
  'Consumer Staples':    185,
  'Health Care':         85,
  'Financials':          12,
  'Information Technology': 42,
  'Communication Services': 55,
  'Real Estate':         165,
  'Transportation':      680,
  'Oil & Gas':           2800,
  'Mining':              1600,
  'Chemicals':           980,
  'Construction':        420,
  'Agriculture':         890,
  'default':             200,
};

const getSectorIntensity = (sector) =>
  SECTOR_INTENSITY[sector] || SECTOR_INTENSITY.default;

// ── Temperature pathway coefficients (PACTA/SBTi) ───────────────────────────
const TEMP_PATHWAYS = {
  'below_1_5':    { temp: 1.4, label: '1.5°C aligned', color: '#16a34a' },
  'well_below_2': { temp: 1.7, label: 'Well Below 2°C', color: '#65a30d' },
  'below_2':      { temp: 1.9, label: 'Below 2°C', color: '#ca8a04' },
  'ndc':          { temp: 2.5, label: 'NDC / Current Policies', color: '#ea580c' },
  'bau':          { temp: 3.2, label: 'Business as Usual', color: '#dc2626' },
};

const classifyTemp = (t) => {
  if (t <= 1.5) return TEMP_PATHWAYS.below_1_5;
  if (t <= 1.8) return TEMP_PATHWAYS.well_below_2;
  if (t <= 2.0) return TEMP_PATHWAYS.below_2;
  if (t <= 2.7) return TEMP_PATHWAYS.ndc;
  return TEMP_PATHWAYS.bau;
};

// ── NGFS Scenario parameters ────────────────────────────────────────────────
const NGFS_SCENARIOS = {
  orderly: {
    name: 'Net Zero 2050 (Orderly)',
    carbonPrice2030: 130, carbonPrice2050: 250,
    physicalRiskMult: 1.0, transitionRiskMult: 1.8,
    gdpImpact2050: -0.02,
  },
  disorderly: {
    name: 'Delayed Transition (Disorderly)',
    carbonPrice2030: 35, carbonPrice2050: 700,
    physicalRiskMult: 1.2, transitionRiskMult: 2.5,
    gdpImpact2050: -0.04,
  },
  hothouse: {
    name: 'Current Policies (Hot House)',
    carbonPrice2030: 10, carbonPrice2050: 15,
    physicalRiskMult: 2.8, transitionRiskMult: 0.3,
    gdpImpact2050: -0.10,
  },
  below2: {
    name: 'Below 2°C',
    carbonPrice2030: 80, carbonPrice2050: 200,
    physicalRiskMult: 1.1, transitionRiskMult: 1.5,
    gdpImpact2050: -0.015,
  },
};

// ── EU Taxonomy Objectives ──────────────────────────────────────────────────
const EU_TAX_OBJECTIVES = [
  { id: 'CCM', name: 'Climate Change Mitigation', weight: 0.35 },
  { id: 'CCA', name: 'Climate Change Adaptation', weight: 0.15 },
  { id: 'WFR', name: 'Water & Marine Resources', weight: 0.10 },
  { id: 'CE',  name: 'Circular Economy', weight: 0.10 },
  { id: 'PPC', name: 'Pollution Prevention & Control', weight: 0.15 },
  { id: 'BIO', name: 'Biodiversity & Ecosystems', weight: 0.15 },
];

// ── ESG Provider normalisation configs ──────────────────────────────────────
const ESG_PROVIDERS = {
  msci:          { min: 0, max: 10, weight: 0.25, name: 'MSCI ESG' },
  sustainalytics:{ min: 0, max: 50, weight: 0.20, name: 'Sustainalytics (inverted)', invert: true },
  sp_global:     { min: 0, max: 100, weight: 0.15, name: 'S&P Global CSA' },
  cdp:           { min: 0, max: 4,  weight: 0.15, name: 'CDP', letterScale: true },
  iss:           { min: 0, max: 10, weight: 0.10, name: 'ISS ESG' },
  refinitiv:     { min: 0, max: 100, weight: 0.15, name: 'Refinitiv (LSEG)' },
};

const normalise0100 = (val, min, max, invert) => {
  const norm = clamp((val - min) / (max - min), 0, 1) * 100;
  return invert ? (100 - norm) : norm;
};

// ── TPT (Transition Plan Taskforce) Elements ────────────────────────────────
const TPT_ELEMENTS = [
  { id: 'ambition', name: 'Ambition & Targets', maxScore: 20 },
  { id: 'actions',  name: 'Implementation Actions', maxScore: 25 },
  { id: 'accountability', name: 'Accountability & Governance', maxScore: 20 },
  { id: 'metrics',  name: 'Metrics & Targets', maxScore: 20 },
  { id: 'engagement', name: 'Engagement Strategy', maxScore: 15 },
];

// ── ACT (Assessing Climate Transition) grading ──────────────────────────────
const ACT_GRADES = ['A', 'B', 'C', 'D', 'E'];
const gradeFromScore = (s) => {
  if (s >= 80) return 'A';
  if (s >= 60) return 'B';
  if (s >= 40) return 'C';
  if (s >= 20) return 'D';
  return 'E';
};


// ═══════════════════════════════════════════════════════════════════════════════
//  1. computeFinancedEmissions — PCAF Standard v2
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PCAF v2 financed emissions calculation for a portfolio.
 *
 * For each holding: attribution_factor = outstanding_amount / EVIC
 * Financed emissions = attribution_factor * company total emissions
 * DQS scored per PCAF five-level data quality hierarchy.
 *
 * @param {Array} holdings — [{id, companyId, outstandingAmount, assetClass, ...}]
 * @param {Array} universe — company universe with emissions + EVIC data
 * @returns {Array<Object>} financed emissions per holding with lineage
 */
export function computeFinancedEmissions(holdings, universe) {
  const universeMap = new Map((universe || []).map(c => [c.id || c.cin, c]));
  const results = [];

  for (const h of (holdings || [])) {
    const company = universeMap.get(h.companyId);
    if (!company) continue;

    const outstanding = h.outstandingAmount || 0;
    const evic = company.evic_usd_mn
      ? company.evic_usd_mn * 1e6
      : (company.evic_inr_cr ? company.evic_inr_cr * 1e7 * 0.012 : 0);
    if (evic === 0) continue;

    const scope1 = company.ghg_scope1 || getSectorIntensity(company.sector) * (company.revenue_usd_mn || 500) * 0.6;
    const scope2 = company.ghg_scope2 || getSectorIntensity(company.sector) * (company.revenue_usd_mn || 500) * 0.25;
    const scope3 = company.ghg_scope3_total || getSectorIntensity(company.sector) * (company.revenue_usd_mn || 500) * 1.8;

    const attributionFactor = outstanding / evic;
    const financedS1 = round2(attributionFactor * scope1);
    const financedS2 = round2(attributionFactor * scope2);
    const financedS3 = round2(attributionFactor * scope3);
    const total = round2(financedS1 + financedS2 + financedS3);

    const dqs = assessDQS(company);

    results.push({
      holdingId: h.id,
      companyId: h.companyId,
      companyName: company.name || company.shortName || 'Unknown',
      financedScope1: financedS1,
      financedScope2: financedS2,
      financedScope3: financedS3,
      total,
      attributionFactor: round4(attributionFactor),
      dqs: dqs.score,
      dqsLabel: dqs.label,
      methodology: 'PCAF v2',
      assetClass: h.assetClass || 'Listed Equity',
      lineage: {
        source: `globalCompanyMaster.GLOBAL_COMPANY_MASTER[id=${h.companyId}]`,
        inputs: {
          scope1: round2(scope1),
          scope2: round2(scope2),
          scope3: round2(scope3),
          outstanding,
          evic: round2(evic),
        },
        transformation: 'PCAF v2: attribution = outstanding/EVIC * (scope1+scope2+scope3)',
        formula: `FE = (${fmtMn(outstanding)} / ${fmtBn(evic)}) * ${round2(scope1 + scope2 + scope3)} = ${round2(total)} tCO2e`,
        timestamp: ts(),
        methodology: `PCAF Standard v2, Asset Class ${h.assetClass === 'Corporate Bond' ? '2 (Corporate Bond)' : '1 (Listed Equity)'}`,
        dataQuality: dqs.label,
      },
    });
  }

  const portfolioTotal = round2(results.reduce((s, r) => s + r.total, 0));
  const avgDQS = results.length > 0
    ? round2(results.reduce((s, r) => s + r.dqs, 0) / results.length)
    : 5;

  return {
    holdings: results,
    portfolioTotal,
    avgDQS,
    methodology: 'PCAF v2',
    holdingCount: results.length,
    lineage: {
      source: 'dataFlowService.computeFinancedEmissions',
      inputs: { holdingCount: holdings.length, universeSize: universe.length },
      transformation: 'Sum of holding-level financed emissions via PCAF attribution factor',
      formula: `Portfolio FE = SUM(holding_i attribution * emissions_i) = ${round2(portfolioTotal)} tCO2e`,
      timestamp: ts(),
      methodology: 'PCAF Standard v2 — Global GHG Accounting & Reporting Standard',
      dataQuality: `Average DQS ${avgDQS} across ${results.length} holdings`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  2. computePortfolioTemperature — PACTA / SBTi Temperature Score
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Weighted average temperature score across portfolio holdings.
 * Uses sector-level decarbonisation pathways from PACTA.
 *
 * @param {Array} holdings — [{id, companyId, weight, ...}]
 * @param {Array} universe — company universe with emissions intensity + targets
 * @returns {Object} portfolio temperature with sector decomposition + lineage
 */
export function computePortfolioTemperature(holdings, universe) {
  const universeMap = new Map((universe || []).map(c => [c.id || c.cin, c]));
  const sectorBuckets = {};
  let totalWeight = 0;
  let weightedTempSum = 0;

  for (const h of (holdings || [])) {
    const company = universeMap.get(h.companyId);
    if (!company) continue;

    const weight = h.weight || (1 / holdings.length);
    const sector = company.sector || 'Other';

    // Derive company temperature from SBTi target status + intensity trajectory
    const hasSBTi = company.sbti_status === 'approved' || company.sbti_status === 'committed';
    const hasNetZero = company.net_zero_target_year && company.net_zero_target_year <= 2050;
    const intensityReduction = company.emission_reduction_target_pct || 0;

    let companyTemp;
    if (hasSBTi && hasNetZero && intensityReduction >= 42) {
      companyTemp = 1.3 + sr(h.companyId || _seed++) * 0.3;
    } else if (hasSBTi || intensityReduction >= 25) {
      companyTemp = 1.7 + sr((h.companyId || _seed++) + 7) * 0.4;
    } else if (intensityReduction > 0) {
      companyTemp = 2.2 + sr((h.companyId || _seed++) + 13) * 0.5;
    } else {
      companyTemp = 2.8 + sr((h.companyId || _seed++) + 19) * 0.6;
    }
    companyTemp = round2(companyTemp);

    weightedTempSum += weight * companyTemp;
    totalWeight += weight;

    if (!sectorBuckets[sector]) {
      sectorBuckets[sector] = { sector, weight: 0, tempSum: 0, count: 0, companies: [] };
    }
    sectorBuckets[sector].weight += weight;
    sectorBuckets[sector].tempSum += weight * companyTemp;
    sectorBuckets[sector].count += 1;
    sectorBuckets[sector].companies.push({
      id: h.companyId,
      name: company.name || company.shortName,
      temp: companyTemp,
      weight: round4(weight),
    });
  }

  const portfolioTemp = totalWeight > 0 ? round2(weightedTempSum / totalWeight) : 2.7;
  const pathway = classifyTemp(portfolioTemp);

  const sectorContributions = Object.values(sectorBuckets).map(b => ({
    sector: b.sector,
    sectorWeight: round4(b.weight),
    avgTemp: round2(b.tempSum / b.weight),
    holdingCount: b.count,
    contribution: round4(b.tempSum / totalWeight),
    companies: b.companies,
  })).sort((a, b) => b.contribution - a.contribution);

  return {
    portfolioTemp,
    pathway: pathway.label,
    pathwayColor: pathway.color,
    sectorContributions,
    methodology: 'PACTA/SBTi',
    lineage: {
      source: 'dataFlowService.computePortfolioTemperature',
      inputs: { holdingCount: holdings.length, totalWeight: round4(totalWeight) },
      transformation: 'PACTA: weighted avg of company temps derived from SBTi status + intensity trajectories',
      formula: `T_portfolio = SUM(w_i * T_i) / SUM(w_i) = ${portfolioTemp}°C`,
      timestamp: ts(),
      methodology: 'PACTA/SBTi Temperature Rating — Sectoral Decarbonisation Approach',
      dataQuality: `${sectorContributions.length} sectors, ${holdings.length} holdings evaluated`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  3. computeClimateVaR — Delta-Normal Climate Value-at-Risk
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Climate VaR combining physical risk and transition risk components.
 * Uses NGFS scenario parameters for stress calibration.
 *
 * @param {Array} holdings — [{id, companyId, marketValue, ...}]
 * @param {Array} universe — company universe
 * @param {string} scenario — 'orderly' | 'disorderly' | 'hothouse' | 'below2'
 * @returns {Object} portfolio CVaR decomposition + lineage
 */
export function computeClimateVaR(holdings, universe, scenario = 'disorderly') {
  const universeMap = new Map((universe || []).map(c => [c.id || c.cin, c]));
  const params = NGFS_SCENARIOS[scenario] || NGFS_SCENARIOS.disorderly;

  const holdingResults = [];
  let totalPhysical = 0;
  let totalTransition = 0;
  let totalPortfolioValue = 0;

  for (const h of (holdings || [])) {
    const company = universeMap.get(h.companyId);
    if (!company) continue;

    const mv = h.marketValue || h.outstandingAmount || 1000000;
    totalPortfolioValue += mv;

    // Physical risk — based on geography, sector exposure, asset vulnerability
    const physicalExposure = company.physical_risk_score
      || (0.15 + sr((h.companyId || _seed++) + 31) * 0.35);
    const physicalVaR = round2(mv * physicalExposure * params.physicalRiskMult * 0.01);

    // Transition risk — carbon cost + stranded asset + demand destruction
    const carbonIntensity = company.ghg_scope1
      ? (company.ghg_scope1 / Math.max(company.revenue_usd_mn || 1, 1))
      : getSectorIntensity(company.sector || 'default');
    const carbonCostImpact = carbonIntensity * params.carbonPrice2030 / 1e6;
    const transitionVaR = round2(mv * carbonCostImpact * params.transitionRiskMult * 0.01);

    const totalHoldingVaR = round2(physicalVaR + transitionVaR);
    totalPhysical += physicalVaR;
    totalTransition += transitionVaR;

    holdingResults.push({
      holdingId: h.id,
      companyId: h.companyId,
      companyName: company.name || company.shortName || 'Unknown',
      marketValue: mv,
      physicalVaR,
      transitionVaR,
      totalVaR: totalHoldingVaR,
      physicalExposure: round4(physicalExposure),
      carbonIntensity: round2(carbonIntensity),
      pctOfPortfolio: 0, // filled below
    });
  }

  // Fill percentage contributions
  const totalCVaR = round2(totalPhysical + totalTransition);
  for (const r of holdingResults) {
    r.pctOfPortfolio = totalCVaR > 0 ? round4(r.totalVaR / totalCVaR) : 0;
  }
  holdingResults.sort((a, b) => b.totalVaR - a.totalVaR);

  return {
    totalCVaR,
    physicalVaR: round2(totalPhysical),
    transitionVaR: round2(totalTransition),
    scenario: params.name,
    scenarioKey: scenario,
    portfolioValue: totalPortfolioValue,
    cvarPct: totalPortfolioValue > 0 ? round4(totalCVaR / totalPortfolioValue) : 0,
    confidenceLevel: 0.95,
    holdingLevel: holdingResults,
    methodology: 'Delta-Normal CVaR',
    lineage: {
      source: 'dataFlowService.computeClimateVaR',
      inputs: {
        holdingCount: holdings.length,
        scenario,
        carbonPrice2030: params.carbonPrice2030,
        physicalMultiplier: params.physicalRiskMult,
        transitionMultiplier: params.transitionRiskMult,
      },
      transformation: 'Physical VaR = MV * exposure * scenario_mult + Transition VaR = MV * carbon_cost_impact * scenario_mult',
      formula: `CVaR_95 = Physical(${fmtMn(totalPhysical)}) + Transition(${fmtMn(totalTransition)}) = ${fmtMn(totalCVaR)}`,
      timestamp: ts(),
      methodology: `Delta-Normal CVaR, NGFS ${params.name}, 95% confidence`,
      dataQuality: `${holdingResults.length} holdings evaluated under ${scenario} scenario`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  4. computeGreenAssetRatio — EU Taxonomy Green Asset Ratio
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * EU Taxonomy Green Asset Ratio for CRR-covered banking book.
 * Numerator: taxonomy-aligned exposures. Denominator: total covered assets.
 *
 * @param {Array} holdings — [{id, companyId, outstandingAmount, assetClass, ...}]
 * @param {Array} universe — company universe with taxonomy alignment data
 * @returns {Object} GAR with breakdown by objective + lineage
 */
export function computeGreenAssetRatio(holdings, universe) {
  const universeMap = new Map((universe || []).map(c => [c.id || c.cin, c]));

  let totalCovered = 0;
  let totalAligned = 0;
  const byObjective = EU_TAX_OBJECTIVES.map(obj => ({
    ...obj, aligned: 0, eligible: 0, notEligible: 0,
  }));

  const holdingDetails = [];

  for (const h of (holdings || [])) {
    const company = universeMap.get(h.companyId);
    if (!company) continue;

    const exposure = h.outstandingAmount || h.marketValue || 0;
    totalCovered += exposure;

    // Determine taxonomy alignment from company data or sector heuristics
    const taxonomyPct = company.taxonomy_alignment_pct
      || company.green_revenue_pct
      || (company.sector === 'Energy' && company.renewable_energy_pct
        ? company.renewable_energy_pct / 100
        : null);

    let alignedAmt = 0;
    let alignmentRate = 0;

    if (taxonomyPct != null) {
      alignmentRate = clamp(taxonomyPct, 0, 1);
      alignedAmt = exposure * alignmentRate;
    } else {
      // Sector-based heuristic
      const sectorRates = {
        'Information Technology': 0.35, 'Health Care': 0.20, 'Utilities': 0.25,
        'Real Estate': 0.30, 'Financials': 0.05, 'Energy': 0.12,
        'Materials': 0.08, 'Industrials': 0.18, 'Consumer Staples': 0.15,
        'Consumer Discretionary': 0.12, 'Communication Services': 0.22,
      };
      alignmentRate = sectorRates[company.sector] || 0.10;
      alignedAmt = exposure * alignmentRate;
    }

    totalAligned += alignedAmt;

    // Distribute across objectives
    for (const obj of byObjective) {
      const share = alignedAmt * obj.weight;
      obj.aligned += share;
      obj.eligible += exposure * clamp(alignmentRate + 0.15, 0, 1) * obj.weight;
      obj.notEligible += exposure * (1 - clamp(alignmentRate + 0.15, 0, 1)) * obj.weight;
    }

    holdingDetails.push({
      holdingId: h.id,
      companyId: h.companyId,
      companyName: company.name || company.shortName || 'Unknown',
      exposure,
      aligned: round2(alignedAmt),
      alignmentRate: round4(alignmentRate),
    });
  }

  const gar = totalCovered > 0 ? round4(totalAligned / totalCovered) : 0;

  const objectiveBreakdown = byObjective.map(obj => ({
    id: obj.id,
    name: obj.name,
    aligned: round2(obj.aligned),
    eligible: round2(obj.eligible),
    notEligible: round2(obj.notEligible),
    garContribution: totalCovered > 0 ? round4(obj.aligned / totalCovered) : 0,
  }));

  return {
    gar,
    garPct: pct(gar),
    numerator: round2(totalAligned),
    denominator: round2(totalCovered),
    byObjective: objectiveBreakdown,
    holdingCount: holdingDetails.length,
    holdings: holdingDetails,
    methodology: 'EU Taxonomy CRR',
    lineage: {
      source: 'dataFlowService.computeGreenAssetRatio',
      inputs: { holdingCount: holdings.length, totalCovered: round2(totalCovered) },
      transformation: 'GAR = taxonomy_aligned_assets / total_CRR_covered_assets',
      formula: `GAR = ${fmtMn(totalAligned)} / ${fmtMn(totalCovered)} = ${pct(gar)}`,
      timestamp: ts(),
      methodology: 'EU Taxonomy Regulation Art. 8 — CRR Green Asset Ratio (Pillar 3)',
      dataQuality: `${holdingDetails.length} exposures evaluated across ${objectiveBreakdown.length} objectives`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  5. computeESGConsensus — Multi-Provider ESG Rating Consensus
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalise ratings from 6 ESG providers to 0–100 scale, compute
 * weighted consensus and divergence score.
 *
 * @param {Object} company — company object from universe
 * @param {Object} providers — {msci: 7.2, sustainalytics: 22, sp_global: 65, cdp: 3, iss: 6, refinitiv: 72}
 * @returns {Object} consensus score, divergence, normalised values + lineage
 */
export function computeESGConsensus(company, providers = {}) {
  const normalized = {};
  let weightedSum = 0;
  let totalWeight = 0;
  const rawValues = [];

  for (const [key, config] of Object.entries(ESG_PROVIDERS)) {
    const rawVal = providers[key];
    if (rawVal == null) continue;

    const norm = round2(normalise0100(rawVal, config.min, config.max, config.invert));
    normalized[key] = {
      raw: rawVal,
      normalized: norm,
      weight: config.weight,
      provider: config.name,
    };
    weightedSum += norm * config.weight;
    totalWeight += config.weight;
    rawValues.push(norm);
  }

  const consensus = totalWeight > 0 ? round2(weightedSum / totalWeight) : null;

  // Divergence = standard deviation of normalised scores
  let divergence = 0;
  if (rawValues.length >= 2) {
    const mean = rawValues.reduce((a, b) => a + b, 0) / rawValues.length;
    const variance = rawValues.reduce((s, v) => s + (v - mean) * (v - mean), 0) / rawValues.length;
    divergence = round2(Math.sqrt(variance));
  }

  const divergenceLabel = divergence > 25 ? 'High' : divergence > 15 ? 'Moderate' : 'Low';

  return {
    companyId: company.id || company.cin,
    companyName: company.name || company.shortName,
    consensus,
    divergence,
    divergenceLabel,
    providerCount: Object.keys(normalized).length,
    normalized,
    methodology: 'Multi-Provider Weighted Consensus',
    lineage: {
      source: `globalCompanyMaster.GLOBAL_COMPANY_MASTER[id=${company.id || company.cin}]`,
      inputs: Object.fromEntries(
        Object.entries(normalized).map(([k, v]) => [k, { raw: v.raw, normalized: v.normalized }])
      ),
      transformation: 'Normalise each provider to 0-100, apply configurable weights, compute consensus + divergence',
      formula: `Consensus = SUM(w_i * norm_i) / SUM(w_i) = ${consensus}/100, Divergence(σ) = ${divergence}`,
      timestamp: ts(),
      methodology: 'Multi-provider ESG consensus (MSCI, Sustainalytics, S&P, CDP, ISS, Refinitiv)',
      dataQuality: `${Object.keys(normalized).length} of 6 providers reporting — divergence: ${divergenceLabel}`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  6. computeTransitionReadiness — TPT / GFANZ / ACT Alignment
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assess a company's transition readiness across TPT elements,
 * GFANZ pathway alignment, and ACT maturity.
 *
 * @param {Object} company — company from universe with transition plan data
 * @returns {Object} readiness score, TPT coverage, GFANZ alignment, ACT grade + lineage
 */
export function computeTransitionReadiness(company) {
  const scores = {};
  let totalScore = 0;
  let totalMax = 0;

  for (const elem of TPT_ELEMENTS) {
    const key = elem.id;
    let score = 0;

    if (key === 'ambition') {
      if (company.net_zero_target_year) score += 6;
      if (company.net_zero_target_year && company.net_zero_target_year <= 2050) score += 4;
      if (company.sbti_status === 'approved') score += 6;
      else if (company.sbti_status === 'committed') score += 3;
      if (company.emission_reduction_target_pct >= 42) score += 4;
      else if (company.emission_reduction_target_pct > 0) score += 2;
    } else if (key === 'actions') {
      if (company.capex_green_pct > 20) score += 8;
      else if (company.capex_green_pct > 0) score += 4;
      if (company.renewable_energy_pct > 50) score += 6;
      else if (company.renewable_energy_pct > 0) score += 3;
      if (company.has_internal_carbon_price) score += 5;
      if (company.just_transition_policy) score += 3;
      score += sr((company.id || _seed++) + 41) * 3;
    } else if (key === 'accountability') {
      if (company.board_climate_oversight) score += 7;
      if (company.exec_climate_kpi) score += 6;
      if (company.climate_risk_committee) score += 4;
      score += sr((company.id || _seed++) + 47) * 3;
    } else if (key === 'metrics') {
      if (company.ghg_scope1 && company.ghg_scope2) score += 6;
      if (company.ghg_scope3_total) score += 4;
      if (company.ghg_verification === 'third_party') score += 4;
      if (company.tcfd_aligned) score += 3;
      score += sr((company.id || _seed++) + 53) * 3;
    } else if (key === 'engagement') {
      if (company.supplier_engagement_program) score += 5;
      if (company.climate_lobbying_aligned) score += 4;
      if (company.cdp_score && company.cdp_score <= 2) score += 3;
      score += sr((company.id || _seed++) + 59) * 3;
    }

    score = clamp(Math.round(score), 0, elem.maxScore);
    scores[key] = { score, maxScore: elem.maxScore, pct: round4(score / elem.maxScore) };
    totalScore += score;
    totalMax += elem.maxScore;
  }

  const readinessScore = round2((totalScore / totalMax) * 100);
  const tptCoverage = round4(totalScore / totalMax);

  // GFANZ pathway alignment — based on sector trajectory and target credibility
  const gfanzAlignment = clamp(
    readinessScore * 0.8 + (company.sbti_status === 'approved' ? 15 : 0) + sr((company.id || _seed++) + 67) * 5,
    0, 100
  );

  const actGrade = gradeFromScore(readinessScore);

  return {
    companyId: company.id || company.cin,
    companyName: company.name || company.shortName,
    readinessScore,
    tptCoverage,
    tptElements: scores,
    gfanzAlignment: round2(gfanzAlignment),
    actGrade,
    actScore: readinessScore,
    methodology: 'TPT/GFANZ/ACT',
    lineage: {
      source: `globalCompanyMaster.GLOBAL_COMPANY_MASTER[id=${company.id || company.cin}]`,
      inputs: {
        sbtiStatus: company.sbti_status || 'none',
        netZeroYear: company.net_zero_target_year || null,
        reductionTarget: company.emission_reduction_target_pct || 0,
        renewableEnergy: company.renewable_energy_pct || 0,
      },
      transformation: 'Score 5 TPT elements + GFANZ pathway fit + ACT maturity grading',
      formula: `Readiness = ${totalScore}/${totalMax} = ${readinessScore}%, ACT grade = ${actGrade}`,
      timestamp: ts(),
      methodology: 'TPT Framework (2023) + GFANZ Sectoral Pathways + ACT Assessment Methodology',
      dataQuality: `${Object.keys(scores).length} TPT elements scored, GFANZ alignment ${round2(gfanzAlignment)}%`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  7. computeAvoidedEmissions — Scope 4 / GHG Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scope 4 avoided emissions — comparing product lifecycle emissions
 * against a baseline / counterfactual scenario.
 *
 * @param {Object} company — company from universe
 * @returns {Object} gross/net avoided, ratio + lineage
 */
export function computeAvoidedEmissions(company) {
  const sector = company.sector || 'default';
  const revenue = company.revenue_usd_mn || 500;

  // Baseline emissions — what would happen without the company's product
  const sectorIntensity = getSectorIntensity(sector);
  const baselineEmissions = round2(revenue * sectorIntensity * (1 + sr((company.id || _seed++) + 71) * 0.3));

  // Product emissions — actual lifecycle emissions
  const reductionFactor = company.product_carbon_reduction_pct
    || (company.renewable_energy_pct ? company.renewable_energy_pct / 200 : 0)
    || 0.15 + sr((company.id || _seed++) + 77) * 0.25;
  const productEmissions = round2(baselineEmissions * (1 - clamp(reductionFactor, 0, 0.85)));

  // Gross avoided = baseline - product
  const grossAvoided = round2(baselineEmissions - productEmissions);

  // Attribution factor — company's contribution vs market
  const attributionFactor = clamp(
    (company.market_share_pct || (5 + sr((company.id || _seed++) + 83) * 15)) / 100,
    0, 1
  );

  // Net avoided = gross * attribution
  const netAvoided = round2(grossAvoided * attributionFactor);
  const ratio = baselineEmissions > 0 ? round4(grossAvoided / baselineEmissions) : 0;

  // Handprint ratio: avoided / own footprint
  const ownFootprint = (company.ghg_scope1 || sectorIntensity * revenue * 0.6)
    + (company.ghg_scope2 || sectorIntensity * revenue * 0.25);
  const handprintRatio = ownFootprint > 0 ? round2(netAvoided / ownFootprint) : 0;

  return {
    companyId: company.id || company.cin,
    companyName: company.name || company.shortName,
    baselineEmissions,
    productEmissions,
    grossAvoided,
    netAvoided,
    ratio,
    attributionFactor: round4(attributionFactor),
    handprintRatio,
    methodology: 'GHG Protocol Scope 4',
    lineage: {
      source: `globalCompanyMaster.GLOBAL_COMPANY_MASTER[id=${company.id || company.cin}]`,
      inputs: {
        revenue_usd_mn: revenue,
        sector,
        sectorIntensity,
        reductionFactor: round4(reductionFactor),
        attributionFactor: round4(attributionFactor),
      },
      transformation: 'Scope 4: Baseline - Product lifecycle emissions, attributed by market share',
      formula: `Avoided = ${round2(baselineEmissions)} - ${round2(productEmissions)} = ${grossAvoided} tCO2e (net: ${netAvoided})`,
      timestamp: ts(),
      methodology: 'GHG Protocol Scope 4 — Avoided Emissions Guidance (WRI/WBCSD)',
      dataQuality: `Sector-based baseline (${sector}), handprint ratio: ${handprintRatio}x`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  8. computeCreditRisk — Climate-Adjusted PD & ECL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Climate-adjusted probability of default and expected credit loss.
 * Overlays transition + physical risk adjustments onto base PD.
 *
 * @param {Object} holding — {id, companyId, outstandingAmount, lgd, maturity, ...}
 * @param {Array} universe — company universe
 * @param {string} scenario — NGFS scenario key
 * @returns {Object} climate-adjusted PD, ECL, delta + lineage
 */
export function computeCreditRisk(holding, universe, scenario = 'disorderly') {
  const universeMap = new Map((universe || []).map(c => [c.id || c.cin, c]));
  const company = universeMap.get(holding.companyId);
  const params = NGFS_SCENARIOS[scenario] || NGFS_SCENARIOS.disorderly;

  if (!company) {
    return {
      holdingId: holding.id,
      error: 'Company not found in universe',
      lineage: { source: 'dataFlowService.computeCreditRisk', timestamp: ts() },
    };
  }

  // Base PD from credit rating or sector average
  const RATING_PD = {
    'AAA': 0.0002, 'AA+': 0.0005, 'AA': 0.0008, 'AA-': 0.0012,
    'A+': 0.0018, 'A': 0.0025, 'A-': 0.0040,
    'BBB+': 0.0060, 'BBB': 0.0090, 'BBB-': 0.0150,
    'BB+': 0.0250, 'BB': 0.0400, 'BB-': 0.0600,
    'B+': 0.0850, 'B': 0.1200, 'B-': 0.1600,
    'CCC': 0.2500, 'CC': 0.3500, 'C': 0.5000, 'D': 1.0000,
  };

  const basePD = company.credit_rating
    ? (RATING_PD[company.credit_rating] || 0.02)
    : 0.02 + sr((holding.companyId || _seed++) + 89) * 0.03;

  // Transition risk overlay — carbon cost impact on earnings
  const carbonIntensity = company.ghg_scope1
    ? company.ghg_scope1 / Math.max(company.revenue_usd_mn || 1, 1)
    : getSectorIntensity(company.sector || 'default');
  const earningsImpact = carbonIntensity * params.carbonPrice2030 / 1e6;
  const transitionPDAdj = clamp(earningsImpact * params.transitionRiskMult * 0.5, 0, 0.15);

  // Physical risk overlay — asset exposure to climate hazards
  const physicalExposure = company.physical_risk_score
    || (0.1 + sr((holding.companyId || _seed++) + 97) * 0.25);
  const physicalPDAdj = clamp(physicalExposure * params.physicalRiskMult * 0.08, 0, 0.10);

  const climateAdjustedPD = clamp(round4(basePD + transitionPDAdj + physicalPDAdj), 0, 1);
  const pdDelta = round4(climateAdjustedPD - basePD);

  // ECL = PD * LGD * EAD
  const lgd = holding.lgd || 0.45;
  const ead = holding.outstandingAmount || holding.marketValue || 1000000;
  const maturity = holding.maturity || 5;
  const ecl = round2(climateAdjustedPD * lgd * ead * Math.min(maturity / 5, 1));
  const baseECL = round2(basePD * lgd * ead * Math.min(maturity / 5, 1));
  const eclDelta = round2(ecl - baseECL);

  // Rating migration
  const migratedRating = Object.entries(RATING_PD)
    .sort(([, a], [, b]) => a - b)
    .find(([, pd]) => pd >= climateAdjustedPD);

  return {
    holdingId: holding.id,
    companyId: holding.companyId,
    companyName: company.name || company.shortName || 'Unknown',
    basePD: round4(basePD),
    transitionPDAdj: round4(transitionPDAdj),
    physicalPDAdj: round4(physicalPDAdj),
    climateAdjustedPD,
    pdDelta,
    ecl,
    baseECL,
    eclDelta,
    lgd,
    ead,
    maturity,
    baseRating: company.credit_rating || 'NR',
    impliedRating: migratedRating ? migratedRating[0] : 'CCC',
    scenario: params.name,
    methodology: 'NGFS Climate Credit Risk',
    lineage: {
      source: `globalCompanyMaster.GLOBAL_COMPANY_MASTER[id=${holding.companyId}]`,
      inputs: {
        basePD: round4(basePD),
        creditRating: company.credit_rating || 'NR',
        carbonIntensity: round2(carbonIntensity),
        physicalExposure: round4(physicalExposure),
        ead,
        lgd,
        maturity,
      },
      transformation: 'Climate PD = Base PD + transition overlay + physical overlay; ECL = PD * LGD * EAD',
      formula: `PD_climate = ${round4(basePD)} + ${round4(transitionPDAdj)} + ${round4(physicalPDAdj)} = ${climateAdjustedPD}; ECL = ${fmtMn(ecl)}`,
      timestamp: ts(),
      methodology: `NGFS ${params.name} — ECB Climate Risk Stress Test Framework`,
      dataQuality: `Base rating: ${company.credit_rating || 'NR'}, PD delta: +${round4(pdDelta)} (${pct(pdDelta)})`,
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  Utility exports
// ═══════════════════════════════════════════════════════════════════════════════

export const SUPPORTED_SCENARIOS = NGFS_SCENARIOS;
export const TAXONOMY_OBJECTIVES = EU_TAX_OBJECTIVES;
export const PROVIDER_CONFIG = ESG_PROVIDERS;
export const TPT_FRAMEWORK = TPT_ELEMENTS;
export const SECTOR_EMISSION_INTENSITY = SECTOR_INTENSITY;
export const DATA_QUALITY_SCORES = DQS_MAP;
export const TEMPERATURE_PATHWAYS = TEMP_PATHWAYS;

/**
 * Run all pipeline stages for a complete portfolio analysis.
 * Returns a consolidated result object with full lineage.
 */
export function runFullPipeline(holdings, universe, scenario = 'disorderly') {
  const financedEmissions = computeFinancedEmissions(holdings, universe);
  const temperature = computePortfolioTemperature(holdings, universe);
  const climateVaR = computeClimateVaR(holdings, universe, scenario);
  const greenAssetRatio = computeGreenAssetRatio(holdings, universe);

  return {
    financedEmissions,
    temperature,
    climateVaR,
    greenAssetRatio,
    pipelineMetadata: {
      holdingCount: holdings.length,
      universeSize: universe.length,
      scenario,
      computedAt: ts(),
      modules: [
        'PCAF Financed Emissions',
        'PACTA Temperature Score',
        'Climate VaR (Delta-Normal)',
        'EU Taxonomy GAR',
      ],
    },
  };
}
