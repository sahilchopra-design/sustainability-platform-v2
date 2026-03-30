// ═══════════════════════════════════════════════════════════════════════════════
// Regulatory Calculation Enhancements
// ENH-023  Base-year recalculation (GHG Protocol)
// ENH-024  Organisational boundary selector
// ENH-025  Biogenic CO2 separation
// ENH-028  Emission-factor hierarchy with Data Quality Score
// ═══════════════════════════════════════════════════════════════════════════════


// ─── ENH-023: Base-year recalculation ────────────────────────────────────────
// When M&A, divestiture, or methodology change occurs, the base-year inventory
// must be restated if the structural change exceeds the significance threshold
// (GHG Protocol Corporate Standard, Chapter 5).
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SIGNIFICANCE_THRESHOLD = 0.05; // 5 %

/**
 * Recalculate base-year emissions after structural changes.
 *
 * @param {Object} baseYear          - { year, scope1, scope2, scope3, total }
 * @param {Array}  structuralChanges - [{ type, year, emissionsImpact, description }]
 *   type: 'acquisition' | 'divestiture' | 'methodology_change' | 'outsourcing' | 'insourcing'
 *   emissionsImpact: absolute tCO2e added (+) or removed (–)
 * @param {Object} opts - { significanceThreshold }
 */
export function recalculateBaseYear(baseYear, structuralChanges, opts = {}) {
  const threshold = opts.significanceThreshold || DEFAULT_SIGNIFICANCE_THRESHOLD;
  const base = { ...baseYear };
  const adjustments = [];
  let cumulativeImpact = 0;

  for (const change of structuralChanges || []) {
    const impact = change.emissionsImpact || 0;
    cumulativeImpact += impact;

    adjustments.push({
      ...change,
      impact,
      pctOfBaseYear: base.total ? Math.abs(impact) / base.total : 0,
    });
  }

  const totalPctChange = base.total ? Math.abs(cumulativeImpact) / base.total : 0;
  const requiresRestatement = totalPctChange > threshold;

  // Restate if threshold exceeded
  let restatedTotal = base.total;
  let restatedScope1 = base.scope1 || 0;
  let restatedScope2 = base.scope2 || 0;
  let restatedScope3 = base.scope3 || 0;

  if (requiresRestatement) {
    // Distribute the cumulative impact proportionally across scopes
    const s1Pct = base.total ? (base.scope1 || 0) / base.total : 0.4;
    const s2Pct = base.total ? (base.scope2 || 0) / base.total : 0.2;
    const s3Pct = base.total ? (base.scope3 || 0) / base.total : 0.4;

    restatedScope1 = (base.scope1 || 0) + cumulativeImpact * s1Pct;
    restatedScope2 = (base.scope2 || 0) + cumulativeImpact * s2Pct;
    restatedScope3 = (base.scope3 || 0) + cumulativeImpact * s3Pct;
    restatedTotal  = restatedScope1 + restatedScope2 + restatedScope3;
  }

  return {
    originalBaseYear: base,
    restated: requiresRestatement,
    restatedBaseYear: {
      year: base.year,
      scope1: restatedScope1,
      scope2: restatedScope2,
      scope3: restatedScope3,
      total: restatedTotal,
    },
    adjustments,
    cumulativeImpact,
    pctChangeFromBase: totalPctChange,
    significanceThreshold: threshold,
    lineage: {
      standard: 'GHG Protocol Corporate Standard Chapter 5',
      note: requiresRestatement
        ? `Base year restated: cumulative change ${(totalPctChange * 100).toFixed(1)}% exceeds ${(threshold * 100).toFixed(0)}% threshold`
        : `No restatement required: cumulative change ${(totalPctChange * 100).toFixed(1)}% within ${(threshold * 100).toFixed(0)}% threshold`,
      computedAt: new Date().toISOString(),
    },
  };
}


// ─── ENH-024: Organisational boundary selector ───────────────────────────────
// Applies one of three consolidation approaches (GHG Protocol Chapter 3):
//   • Equity share
//   • Operational control
//   • Financial control
// The choice determines which subsidiaries / JVs contribute to Scope 1 & 2.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply boundary approach to a corporate structure.
 *
 * @param {Object} company - {
 *   name, totalScope1, totalScope2,
 *   subsidiaries: [{ name, ownershipPct, operationalControl, financialControl, scope1, scope2 }]
 * }
 * @param {string} approach - 'equity_share' | 'operational_control' | 'financial_control'
 */
export function applyBoundaryApproach(company, approach = 'operational_control') {
  const subs = company.subsidiaries || [];

  const consolidatedEntities = subs.map(sub => {
    let inclusionFactor;
    let included;

    switch (approach) {
      case 'equity_share':
        inclusionFactor = sub.ownershipPct || 0;  // 0–1 fraction
        included = inclusionFactor > 0;
        break;
      case 'financial_control':
        inclusionFactor = sub.financialControl ? 1 : 0;
        included = sub.financialControl === true;
        break;
      case 'operational_control':
      default:
        inclusionFactor = sub.operationalControl ? 1 : 0;
        included = sub.operationalControl === true;
        break;
    }

    return {
      name: sub.name,
      ownershipPct: sub.ownershipPct,
      operationalControl: sub.operationalControl,
      financialControl: sub.financialControl,
      included,
      inclusionFactor,
      contributedScope1: (sub.scope1 || 0) * inclusionFactor,
      contributedScope2: (sub.scope2 || 0) * inclusionFactor,
    };
  });

  const consolidatedScope1 = consolidatedEntities.reduce((s, e) => s + e.contributedScope1, 0);
  const consolidatedScope2 = consolidatedEntities.reduce((s, e) => s + e.contributedScope2, 0);

  return {
    company: company.name,
    approach,
    consolidatedScope1,
    consolidatedScope2,
    consolidatedTotal: consolidatedScope1 + consolidatedScope2,
    entities: consolidatedEntities,
    includedCount: consolidatedEntities.filter(e => e.included).length,
    excludedCount: consolidatedEntities.filter(e => !e.included).length,
    lineage: {
      standard: 'GHG Protocol Corporate Standard Chapter 3',
      approach,
      note: approach === 'equity_share'
        ? 'Emissions proportional to equity ownership percentage'
        : `Emissions 100% included where ${approach.replace('_', ' ')} exists`,
      computedAt: new Date().toISOString(),
    },
  };
}


// ─── ENH-025: Biogenic CO2 separation ────────────────────────────────────────
// GHG Protocol Chapter 9 requires biogenic CO2 to be reported separately from
// fossil-origin CO2 in the GHG inventory.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Separate biogenic from fossil CO2.
 *
 * @param {number} totalEmissions - Total CO2 emissions in tCO2e
 * @param {number} biogenicPct    - Fraction of total that is biogenic (0–1)
 * @param {Object} opts           - { landUseChange, biogenicRemoval }
 */
export function separateBiogenicCO2(totalEmissions, biogenicPct, opts = {}) {
  const bioPct   = Math.max(0, Math.min(1, biogenicPct || 0));
  const fossilCO2   = totalEmissions * (1 - bioPct);
  const biogenicCO2 = totalEmissions * bioPct;

  // Optional: land-use change emissions (reported in a separate category)
  const landUseChange   = opts.landUseChange   || 0;
  // Optional: biogenic removals (negative = removal from atmosphere)
  const biogenicRemoval = opts.biogenicRemoval || 0;

  return {
    fossilCO2,
    biogenicCO2,
    landUseChangeCO2: landUseChange,
    biogenicRemoval,
    reportedTotal: fossilCO2, // GHG Protocol: only fossil CO2 in the main inventory
    memo: {
      biogenicCO2,
      landUseChangeCO2: landUseChange,
      biogenicRemoval,
    },
    netBiogenic: biogenicCO2 + biogenicRemoval,
    lineage: {
      standard: 'GHG Protocol Corporate Standard Chapter 9',
      note: 'Biogenic CO2 reported separately per GHG Protocol; only fossil CO2 in main inventory total',
      biogenicPct: bioPct,
      computedAt: new Date().toISOString(),
    },
  };
}


// ─── ENH-028: Emission factor hierarchy ──────────────────────────────────────
// When estimating emissions for an activity, pick the highest-quality available
// factor from a defined hierarchy:
//   1) Supplier-specific (DQS 1)
//   2) Process / technology-based (DQS 2)
//   3) Average / industry-based (DQS 3)
//   4) Spend-based (DQS 4)
//   5) Default / proxy (DQS 5)
// Returns the selected factor together with its Data Quality Score (DQS 1–5).
// ─────────────────────────────────────────────────────────────────────────────

const FACTOR_HIERARCHY = [
  { tier: 1, type: 'supplier_specific',  label: 'Supplier-specific',       dqs: 1 },
  { tier: 2, type: 'process_based',      label: 'Process / technology',    dqs: 2 },
  { tier: 3, type: 'industry_average',   label: 'Industry average',        dqs: 3 },
  { tier: 4, type: 'spend_based',        label: 'Spend-based',             dqs: 4 },
  { tier: 5, type: 'default_proxy',      label: 'Default / proxy',         dqs: 5 },
];

/**
 * Select the best emission factor for an activity from the available set.
 *
 * @param {Object} activity         - { name, sector, unit, spend, ... }
 * @param {Array}  availableFactors - [{ type, value, unit, source, year, ... }]
 *   type must be one of the FACTOR_HIERARCHY types
 */
export function selectEmissionFactor(activity, availableFactors) {
  const factors = availableFactors || [];

  // Sort available factors by hierarchy tier (best first)
  const ranked = FACTOR_HIERARCHY
    .map(h => {
      const match = factors.find(f => f.type === h.type);
      return match ? { ...match, tier: h.tier, label: h.label, dqs: h.dqs } : null;
    })
    .filter(Boolean);

  if (ranked.length === 0) {
    return {
      selected: null,
      dqs: 5,
      warning: 'No emission factor available; default proxy should be sourced manually',
      hierarchy: FACTOR_HIERARCHY,
      lineage: {
        standard: 'GHG Protocol Scope 3 Guidance Chapter 7',
        note: 'No factors available in hierarchy',
        computedAt: new Date().toISOString(),
      },
    };
  }

  const best = ranked[0];

  return {
    selected: {
      type: best.type,
      label: best.label,
      value: best.value,
      unit: best.unit || 'tCO2e per unit',
      source: best.source,
      year: best.year,
    },
    dqs: best.dqs,
    dqsLabel: best.label,
    alternativesAvailable: ranked.length - 1,
    alternatives: ranked.slice(1).map(f => ({
      type: f.type, label: f.label, dqs: f.dqs, value: f.value,
    })),
    hierarchy: FACTOR_HIERARCHY,
    lineage: {
      standard: 'GHG Protocol Scope 3 Guidance Chapter 7',
      note: `Selected tier ${best.tier} (${best.label}) — DQS ${best.dqs}`,
      activity: activity.name || activity.sector,
      computedAt: new Date().toISOString(),
    },
  };
}

/**
 * Calculate emissions using the best available factor for each activity.
 *
 * @param {Array} activities - [{ name, quantity, unit, availableFactors: [...] }]
 * @returns aggregate emissions + per-activity breakdown with DQS
 */
export function calculateWithBestFactors(activities) {
  const results = (activities || []).map(act => {
    const selection = selectEmissionFactor(act, act.availableFactors);
    const ef = selection.selected;
    const emissions = ef ? act.quantity * ef.value : 0;

    return {
      activity: act.name,
      quantity: act.quantity,
      unit: act.unit,
      emissionFactor: ef,
      dqs: selection.dqs,
      emissions,
    };
  });

  const totalEmissions = results.reduce((s, r) => s + r.emissions, 0);
  const avgDqs = results.length > 0
    ? results.reduce((s, r) => s + r.dqs, 0) / results.length
    : 5;

  return {
    activities: results,
    totalEmissions,
    averageDqs: Math.round(avgDqs * 10) / 10,
    dqsDistribution: {
      tier1: results.filter(r => r.dqs === 1).length,
      tier2: results.filter(r => r.dqs === 2).length,
      tier3: results.filter(r => r.dqs === 3).length,
      tier4: results.filter(r => r.dqs === 4).length,
      tier5: results.filter(r => r.dqs === 5).length,
    },
    lineage: {
      standard: 'GHG Protocol Scope 3 Guidance',
      activitiesProcessed: results.length,
      computedAt: new Date().toISOString(),
    },
  };
}
