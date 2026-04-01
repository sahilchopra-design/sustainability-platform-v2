/**
 * pcafAuditTrail.js — ENH-017
 * Step-by-step PCAF calculation audit trail engine
 *
 * Reference:
 *   PCAF Global GHG Accounting & Reporting Standard v2 (3rd Edition, 2022)
 *   GHG Protocol Corporate Value Chain (Scope 3) Standard
 *   TCFD Guidance on Metrics, Targets and Transition Plans (2021)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. METHODOLOGY REFERENCES
// ═══════════════════════════════════════════════════════════════════════════════

export const PCAF_CITATIONS = {
  attribution: {
    ref: 'PCAF Standard Part A §4.3.1',
    formula: 'Attribution ratio = Outstanding amount ($M) / EVIC ($M)',
    notes: 'Outstanding = carrying value of loan/bond/equity at reporting date; EVIC = MarketCap + TotalDebt + Preferred + MinorityInterest',
    validRange: [0, 1],
  },
  financedEmissions: {
    ref: 'PCAF Standard Part A §4.3.2',
    formula: 'Financed Emissions (tCO2e) = Attribution ratio × Total GHG emissions',
    scopes: 'Scope 1 + Scope 2 mandatory; Scope 3 encouraged for energy, materials, agriculture sectors',
  },
  waci: {
    ref: 'TCFD Guidance §B.4 / PCAF Part A §4.4',
    formula: 'WACI = Σ(portfolio_weight × emissions / revenue) across all holdings',
    unit: 'tCO2e per $M revenue (revenue-denominated per TCFD 2021 standard)',
    note: 'Portfolio weight = outstanding_i / Σ outstanding',
  },
  evic: {
    ref: 'PCAF Standard Part A §4.2',
    formula: 'EVIC = Market Cap + Total Debt + Preferred Stock + Minority Interest',
    currency: 'USD millions at reporting year-end exchange rates (ECB reference)',
    sources: { 1: 'EODHD live data', 2: 'Bloomberg/Refinitiv', 3: 'Company filing', 4: 'Sector-median estimate' },
  },
  dqs: {
    ref: 'PCAF Standard — Data Quality Annex',
    levels: {
      1: 'Audited/verified reported data (highest quality)',
      2: 'Unverified company-disclosed data',
      3: 'Modelled with company-specific inputs',
      4: 'Sector or region average (proxy)',
      5: 'Estimated with significant uncertainty (lowest quality)',
    },
    target: 'Target portfolio average DQS ≤ 3 for PCAF disclosure',
  },
  partB: {
    ref: 'PCAF Standard Part B — Insurance-Associated Emissions §5',
    formula: 'Insured emissions = attribution_ratio × policyholder_GHG',
    note: 'Attribution for P&C: insured_value / asset_value; Life: exposure_value / EVIC',
  },
  partC: {
    ref: 'PCAF Standard Part C — Facilitated Emissions §6',
    formula: 'Facilitated emissions = underwriting_share × issuer_GHG',
    note: 'Capital markets (bonds, equity, M&A) — one-year recognition in year of transaction',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CALCULATION STEP DEFINITIONS (7 steps per Part A position)
// ═══════════════════════════════════════════════════════════════════════════════

export const STEP_DEFS = [
  {
    id: 'S1',
    label: 'Input Validation',
    desc: 'Validate all required position inputs against PCAF taxonomy and reporting requirements',
    citation: 'PCAF Standard §2.1 — Scope & Applicability',
    checks: [
      'outstanding_amount > 0',
      'asset_class ∈ PCAF taxonomy (12 classes)',
      'currency is ISO 4217',
      'sector classified (GICS / NACE)',
      'country/geography provided',
    ],
  },
  {
    id: 'S2',
    label: 'EVIC Determination',
    desc: 'Retrieve Enterprise Value Including Cash from live data or estimate via sector-median ratio',
    citation: 'PCAF Standard Part A §4.2',
    checks: [
      'Attempt EODHD live lookup (DQS=1)',
      'Fall back to sector-median ratio × market cap (DQS=4)',
      'Validate EVIC > 0',
      'Record data source and DQS for audit trail',
      'Convert to USD millions at reporting date FX rate',
    ],
  },
  {
    id: 'S3',
    label: 'Attribution Ratio',
    desc: 'Compute the proportion of investee enterprise value attributable to this investment',
    citation: 'PCAF Standard Part A §4.3.1',
    formula: 'ratio = outstanding_$M / EVIC_$M',
    checks: [
      'ratio ∈ (0, 1) — flag if outside range',
      'Flag concentrated exposure if ratio > 25%',
      'Flag data integrity error if EVIC < outstanding',
      'For bonds: outstanding = carrying value (not face/par)',
      'For equity: outstanding = fair value of holding',
    ],
  },
  {
    id: 'S4',
    label: 'Emissions Data Selection',
    desc: 'Select GHG inventory data; record scope coverage, emission factors, and DQS per scope',
    citation: 'PCAF Standard Part A §4.3.2 + GHG Protocol Corporate Standard',
    checks: [
      'Scope 1 + Scope 2 required (location-based or market-based)',
      'Scope 3 encouraged: mandatory for energy, materials, agriculture',
      'GWP values: AR5 100-year (default) or AR6 if specified',
      'Emission factor source: DEFRA, IPCC, ecoinvent, or company-specific',
      'Record DQS per scope (1=audited, 2=disclosed, 3=modelled, 4=sector, 5=proxy)',
    ],
  },
  {
    id: 'S5',
    label: 'Financed Emissions Calculation',
    desc: 'Apply attribution ratio to total portfolio emissions to derive financed emissions',
    citation: 'PCAF Standard Part A §4.3.2',
    formula: 'financed_tCO2e = attribution_ratio × (Scope1 + Scope2 + Scope3)',
    checks: [
      'Result in tCO2e',
      'Report Scope 1+2 and Scope 3 separately in PCAF disclosure',
      'Check for double-counting if same entity appears in multiple asset classes',
      'Sovereign debt: use production-based emissions of issuer country',
    ],
  },
  {
    id: 'S6',
    label: 'WACI Component',
    desc: 'Calculate this holding\'s contribution to portfolio Weighted Average Carbon Intensity',
    citation: 'TCFD Metrics §B.4 / PCAF §4.4',
    formula: 'waci_contribution = portfolio_weight × (total_emissions / revenue_$M)',
    checks: [
      'Revenue in $M (same currency as outstanding)',
      'Portfolio weight = outstanding_i / Σ all outstanding',
      'Intensity units: tCO2e per $M revenue',
      'Flag if revenue is estimated (revenue proxy = 15% × EVIC)',
      'WACI excludes sovereign debt (no revenue denominator)',
    ],
  },
  {
    id: 'S7',
    label: 'DQS Composite Score',
    desc: 'Derive final composite Data Quality Score from all input data sources',
    citation: 'PCAF Standard — Data Quality Annex §A.2',
    formula: 'composite_DQS = max(DQS_EVIC, DQS_scope1, DQS_scope2, DQS_scope3)',
    checks: [
      'EVIC DQS: 1 if EODHD live, 4 if sector estimate',
      'Emissions DQS: from user input or default=3',
      'Composite = highest (worst) DQS across all inputs',
      'Target: DQS ≤ 3 for all material positions',
      'Document improvement plan for DQS 4–5 positions',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PER-POSITION AUDIT TRAIL GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a full step-by-step calculation audit trail for a single PCAF position.
 *
 * @param {object} pos - PCAF position object
 * @param {number} totalOutstandingMn - Portfolio total outstanding $M (for WACI weight)
 * @param {number} posIdx - Position index (deterministic seeding)
 * @returns {object} Full audit trail with 7 steps, flags, and summary
 */
export function generatePositionTrail(pos, totalOutstandingMn, posIdx = 0) {
  const evicMn = (parseFloat(pos.evicBn) || 0) * 1000;
  const outstandingMn = parseFloat(pos.outstanding) || 0;
  const scope1 = parseFloat(pos.scope1) || 0;
  const scope2 = parseFloat(pos.scope2) || 0;
  const scope3 = parseFloat(pos.scope3) || 0;
  const totalEmissions = scope1 + scope2 + scope3;
  const attributionRatio = evicMn > 0 ? Math.min(outstandingMn / evicMn, 1) : 0;
  const financedEmissions = attributionRatio * totalEmissions;
  const revenueMn = (parseFloat(pos.revenueBn) || 0) * 1000 || evicMn * 0.15;
  const portfolioWeight = totalOutstandingMn > 0 ? outstandingMn / totalOutstandingMn : 0;
  const waciComponent = revenueMn > 0 ? portfolioWeight * (totalEmissions / revenueMn) : 0;
  const evicDqs = (pos.source === 'EODHD' || pos.source === 'EODHD live') ? 1 : 4;
  const emissionsDqs = parseInt(pos.dqs) || 3;
  const compositeDqs = Math.max(evicDqs, emissionsDqs);

  // Build flags
  const flags = [];
  if (!pos.ticker || pos.ticker === '—') flags.push({ severity: 'warn', code: 'F01', msg: 'No ticker provided — EVIC estimated from sector median only' });
  if (evicMn < outstandingMn && evicMn > 0) flags.push({ severity: 'error', code: 'F02', msg: `EVIC ($${evicMn.toFixed(0)}M) < outstanding ($${outstandingMn.toFixed(0)}M) — data integrity issue` });
  if (attributionRatio > 0.25) flags.push({ severity: 'warn', code: 'F03', msg: `High attribution ratio ${(attributionRatio * 100).toFixed(1)}% — concentrated exposure; verify position size` });
  if (scope3 === 0 && ['Energy', 'Materials', 'Utilities', 'Consumer Staples'].some(s => (pos.sector || '').includes(s))) flags.push({ severity: 'warn', code: 'F04', msg: 'Scope 3 missing for material sector — PCAF recommends inclusion for energy/materials' });
  if (compositeDqs >= 4) flags.push({ severity: 'warn', code: 'F05', msg: `DQS=${compositeDqs} (low confidence) — obtain audited EVIC and company-disclosed emissions` });
  if (totalEmissions === 0) flags.push({ severity: 'warn', code: 'F06', msg: 'Zero total emissions — verify data entry or apply sector-average estimate' });

  const steps = [
    {
      ...STEP_DEFS[0],
      inputs: {
        name: pos.name || '—',
        ticker: pos.ticker || '—',
        assetClass: pos.assetClass || '—',
        outstanding_USD_M: `$${outstandingMn.toFixed(2)}M`,
        currency: pos.currency || 'USD',
        sector: pos.sector || '—',
        country: pos.country || pos.geo || '—',
      },
      outputs: {
        valid: !flags.some(f => f.severity === 'error'),
        requiredFieldsPresent: !!(pos.name && pos.assetClass && outstandingMn > 0),
        pcafAssetClass: pos.assetClass || 'Unknown',
      },
      status: flags.some(f => f.severity === 'error') ? 'FAIL' : 'PASS',
    },
    {
      ...STEP_DEFS[1],
      inputs: {
        ticker: pos.ticker || '—',
        sector: pos.sector || '—',
        dataSource: pos.source || 'Not specified',
        fallbackUsed: evicDqs === 4,
      },
      outputs: {
        evic_USD_Bn: `$${(evicMn / 1000).toFixed(3)}Bn`,
        evic_USD_M: `$${evicMn.toFixed(2)}M`,
        evicDqs,
        sourceType: evicDqs === 1
          ? 'EODHD live data — DQS=1 (highest quality)'
          : 'Sector-median estimate — DQS=4 (proxy)',
        note: evicDqs === 4 ? 'To improve: obtain Bloomberg EVIC or company annual report' : 'Live market data; verify against latest company filing',
      },
      status: evicMn > 0 ? 'PASS' : 'WARN',
    },
    {
      ...STEP_DEFS[2],
      inputs: {
        outstanding_M: `$${outstandingMn.toFixed(2)}M`,
        evic_M: `$${evicMn.toFixed(2)}M`,
        calculation: `$${outstandingMn.toFixed(2)}M ÷ $${evicMn.toFixed(2)}M`,
      },
      outputs: {
        attributionRatio: attributionRatio.toFixed(6),
        attributionPct: `${(attributionRatio * 100).toFixed(4)}%`,
        interpretation: `Investor owns ${(attributionRatio * 100).toFixed(3)}% of ${pos.name || 'company'}'s enterprise value`,
        concentrationFlag: attributionRatio > 0.25 ? '⚠ Concentrated (>25%)' : '✓ Within normal range',
      },
      status: evicMn >= outstandingMn ? 'PASS' : 'WARN',
    },
    {
      ...STEP_DEFS[3],
      inputs: {
        scope1_tCO2e: `${scope1.toLocaleString()} tCO2e`,
        scope2_tCO2e: `${scope2.toLocaleString()} tCO2e`,
        scope3_tCO2e: scope3 > 0 ? `${scope3.toLocaleString()} tCO2e` : 'Not provided',
        emissionsDqs,
        dataSource: pos.source || 'Manual entry',
        gwpVersion: 'AR5 100-year (IPCC Fifth Assessment Report)',
      },
      outputs: {
        totalEmissions_tCO2e: `${totalEmissions.toLocaleString()} tCO2e`,
        scope1_share: totalEmissions > 0 ? `${(scope1 / totalEmissions * 100).toFixed(1)}%` : '—',
        scope2_share: totalEmissions > 0 ? `${(scope2 / totalEmissions * 100).toFixed(1)}%` : '—',
        scope3_share: totalEmissions > 0 && scope3 > 0 ? `${(scope3 / totalEmissions * 100).toFixed(1)}%` : 'Not included',
        scope3Required: ['Energy', 'Materials', 'Utilities'].some(s => (pos.sector || '').includes(s)),
      },
      status: totalEmissions > 0 ? 'PASS' : 'WARN',
    },
    {
      ...STEP_DEFS[4],
      inputs: {
        attributionRatio: attributionRatio.toFixed(6),
        totalEmissions_tCO2e: `${totalEmissions.toLocaleString()} tCO2e`,
      },
      outputs: {
        financedEmissions_tCO2e: `${financedEmissions.toFixed(2)} tCO2e`,
        scope1Financed: `${(attributionRatio * scope1).toFixed(2)} tCO2e`,
        scope2Financed: `${(attributionRatio * scope2).toFixed(2)} tCO2e`,
        scope3Financed: scope3 > 0 ? `${(attributionRatio * scope3).toFixed(2)} tCO2e` : 'N/A',
        calculation: `${attributionRatio.toFixed(6)} × ${totalEmissions.toLocaleString()} = ${financedEmissions.toFixed(2)} tCO2e`,
        partAorB: pos.assetClass?.toLowerCase().includes('mortgage') || pos.assetClass?.toLowerCase().includes('insurance') ? 'Part B' : 'Part A',
      },
      status: 'PASS',
    },
    {
      ...STEP_DEFS[5],
      inputs: {
        portfolioWeight_pct: `${(portfolioWeight * 100).toFixed(4)}%`,
        totalEmissions_tCO2e: `${totalEmissions.toLocaleString()} tCO2e`,
        revenue_USD_M: `$${revenueMn.toFixed(2)}M`,
        revenueSource: (parseFloat(pos.revenueBn) || 0) > 0 ? 'Financial data' : 'Revenue proxy: 15% × EVIC',
        carbonIntensity: revenueMn > 0 ? `${(totalEmissions / revenueMn).toFixed(4)} tCO2e/$M rev` : '—',
      },
      outputs: {
        waciComponent: `${waciComponent.toFixed(6)} tCO2e/$M (portfolio-weighted)`,
        calculation: `${(portfolioWeight * 100).toFixed(4)}% × ${revenueMn > 0 ? (totalEmissions / revenueMn).toFixed(4) : 0} = ${waciComponent.toFixed(6)}`,
        note: (parseFloat(pos.revenueBn) || 0) === 0 ? '⚠ Revenue estimated — improve: obtain company revenue from annual report' : '✓ Revenue from financial data',
      },
      status: 'PASS',
    },
    {
      ...STEP_DEFS[6],
      inputs: {
        evicDqs: `DQS-${evicDqs} — ${PCAF_CITATIONS.dqs.levels[evicDqs]}`,
        emissionsDqs: `DQS-${emissionsDqs} — ${PCAF_CITATIONS.dqs.levels[emissionsDqs]}`,
        scope3Dqs: scope3 > 0 ? `DQS-${emissionsDqs} (same as Scope 1/2 input)` : 'N/A',
      },
      outputs: {
        compositeDqs,
        dqsLabel: PCAF_CITATIONS.dqs.levels[compositeDqs],
        confidenceLevel: compositeDqs <= 2 ? 'High' : compositeDqs <= 3 ? 'Medium' : 'Low',
        improvementPath: evicDqs === 4
          ? 'Priority: obtain Bloomberg/Refinitiv audited EVIC → DQS 4→2'
          : emissionsDqs >= 3
          ? 'Priority: request audited/disclosed emissions data from company → DQS 3→1/2'
          : 'Data quality is good — maintain verification cadence',
        meetsPcafTarget: compositeDqs <= 3,
      },
      status: compositeDqs <= 3 ? 'PASS' : 'WARN',
    },
  ];

  return {
    positionId: pos.id || `POS-${String(posIdx + 1).padStart(3, '0')}`,
    positionName: pos.name || `Position ${posIdx + 1}`,
    ticker: pos.ticker || '—',
    assetClass: pos.assetClass || '—',
    sector: pos.sector || '—',
    trailDate: new Date().toISOString().slice(0, 10),
    standard: 'PCAF Global GHG Accounting & Reporting Standard v2 (3rd Edition, 2022)',
    steps,
    summary: {
      outstandingMn,
      evicMn,
      attributionRatio,
      financedEmissions,
      totalEmissions,
      waciComponent,
      portfolioWeight,
      compositeDqs,
      passCount: steps.filter(s => s.status === 'PASS').length,
      warnCount: steps.filter(s => s.status === 'WARN').length,
      failCount: steps.filter(s => s.status === 'FAIL').length,
    },
    flags,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PORTFOLIO-LEVEL AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate audit trails for all positions plus portfolio-level aggregation.
 * @param {Array} positions - Array of PCAF position objects
 * @returns {object} { trailId, positions (trails), portfolio, methodologyNotes }
 */
export function generatePortfolioAuditTrail(positions) {
  const totalOutstandingMn = positions.reduce((s, p) => s + (parseFloat(p.outstanding) || 0), 0);
  const trails = positions.map((p, i) => generatePositionTrail(p, totalOutstandingMn, i));

  const totalFinancedEmissions = trails.reduce((s, t) => s + t.summary.financedEmissions, 0);
  const portfolioWaci = trails.reduce((s, t) => s + t.summary.waciComponent, 0);
  const avgDqs = trails.length > 0
    ? trails.reduce((s, t) => s + t.summary.compositeDqs, 0) / trails.length
    : 0;
  const allFlags = trails.flatMap(t => t.flags.map(f => ({ ...f, position: t.positionName, ticker: t.ticker })));
  const assetClasses = [...new Set(positions.map(p => p.assetClass).filter(Boolean))];

  const dqsDistribution = [1, 2, 3, 4, 5].map(d => ({
    dqs: d,
    label: `DQS-${d}`,
    description: PCAF_CITATIONS.dqs.levels[d],
    count: trails.filter(t => t.summary.compositeDqs === d).length,
    pct: trails.length > 0
      ? ((trails.filter(t => t.summary.compositeDqs === d).length / trails.length) * 100).toFixed(1)
      : '0',
    financedEmissions: trails
      .filter(t => t.summary.compositeDqs === d)
      .reduce((s, t) => s + t.summary.financedEmissions, 0),
  }));

  const coverageByAssetClass = assetClasses.map(ac => {
    const acTrails = trails.filter(t => t.assetClass === ac);
    return {
      assetClass: ac,
      count: acTrails.length,
      outstandingMn: acTrails.reduce((s, t) => s + t.summary.outstandingMn, 0),
      financedEmissions: acTrails.reduce((s, t) => s + t.summary.financedEmissions, 0),
      avgDqs: acTrails.length > 0
        ? (acTrails.reduce((s, t) => s + t.summary.compositeDqs, 0) / acTrails.length).toFixed(1)
        : 0,
    };
  });

  return {
    trailId: `PCAF-AT-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`,
    generatedAt: new Date().toISOString(),
    standard: 'PCAF Standard v2 (3rd Edition, 2022) + TCFD Guidance on Metrics (2021)',
    reportingYear: new Date().getFullYear() - 1,
    positions: trails,
    portfolio: {
      totalPositions: positions.length,
      totalOutstandingMn,
      totalFinancedEmissions,
      portfolioWaci,
      avgDqs: parseFloat(avgDqs.toFixed(2)),
      dqsMeetsTarget: avgDqs <= 3,
      dqsDistribution,
      coverageByAssetClass,
      flags: allFlags,
      flagSummary: {
        errors: allFlags.filter(f => f.severity === 'error').length,
        warnings: allFlags.filter(f => f.severity === 'warn').length,
        info: allFlags.filter(f => f.severity === 'info').length,
        total: allFlags.length,
      },
      qualityAssessment: avgDqs <= 2
        ? 'Excellent — audited/verified data across portfolio'
        : avgDqs <= 3
        ? 'Good — meets PCAF DQS target of ≤3'
        : avgDqs <= 4
        ? 'Fair — significant positions using sector estimates; improve EVIC sourcing'
        : 'Poor — majority of positions using proxies; data improvement plan required',
    },
    methodologyNotes: [
      'Attribution ratio: outstanding ($M) / EVIC ($M) per PCAF Standard Part A §4.3.1',
      'EVIC: EODHD live data where available (DQS=1); sector-median ratio × market cap otherwise (DQS=4)',
      'WACI denominator: revenue (not EVIC) per TCFD 2021 standard; revenue estimated at 15% × EVIC when not available',
      'Scope 3 Category 15 (investments) excluded at portfolio level to prevent double-counting',
      'GHG values in tCO2e using IPCC AR5 100-year GWP values (CO2=1, CH4=28, N2O=265)',
      'All monetary values in USD millions at reporting year-end FX rates (ECB reference)',
      'Composite DQS = max of all input DQS scores per position (conservative approach)',
      `Audit trail generated: ${new Date().toISOString()}`,
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Export audit trail as formatted JSON string */
export function exportTrailJSON(trail) {
  return JSON.stringify(trail, null, 2);
}

/** Download audit trail as JSON file */
export function downloadTrail(trail) {
  const json = exportTrailJSON(trail);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trail.trailId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Step status colour helper */
export function stepStatusColor(status) {
  return { PASS: '#16a34a', WARN: '#d97706', FAIL: '#dc2626' }[status] || '#9aa3ae';
}

/** Flag severity colour helper */
export function flagSeverityColor(severity) {
  return { error: '#dc2626', warn: '#d97706', info: '#0891b2' }[severity] || '#9aa3ae';
}

/** DQS badge colour */
export function dqsColor(dqs) {
  return { 1: '#16a34a', 2: '#38bdf8', 3: '#d97706', 4: '#f97316', 5: '#dc2626' }[dqs] || '#9aa3ae';
}
