/**
 * pcafAuditTrail.js — ENH-017
 * Step-by-step PCAF calculation audit trail engine
 *
 * Reference (see data/pcafStandards.js — single source of truth, R3 gap B-1):
 *   PCAF Financed Emissions, 3rd Edition (Dec 2025), Part A
 *   PCAF Insurance-Associated Emissions (Nov 2022, updated Dec 2025), Part C
 *   PCAF Facilitated Emissions (Dec 2023), Part B
 *   GHG Protocol Corporate Value Chain (Scope 3) Standard
 *   TCFD Guidance on Metrics, Targets and Transition Plans (2021)
 */
import { getReferenceEntry, getReferenceRevenueM } from './evicReference';
import { PCAF_PART_A, PCAF_PART_B, PCAF_PART_C, isScope3Required, SCOPE3_ALL_SECTOR_YEAR, sectorRevenueProxyM } from './pcafStandards';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. METHODOLOGY REFERENCES
// ═══════════════════════════════════════════════════════════════════════════════

export const PCAF_CITATIONS = {
  attribution: {
    ref: PCAF_PART_A,
    formula: 'Attribution ratio = Outstanding amount ($M) / EVIC ($M)',
    notes: 'Outstanding = carrying value of loan/bond/equity at reporting date; EVIC = MarketCap + TotalDebt + Preferred + MinorityInterest',
    validRange: [0, 1],
  },
  financedEmissions: {
    ref: PCAF_PART_A,
    formula: 'Financed Emissions (tCO2e) = Attribution ratio × Scope 1+2 emissions (reported separately from Scope 3, never blended)',
    scopes: `Scope 1 + Scope 2 mandatory; Scope 3 phase-in complete for all sectors from reporting year ${SCOPE3_ALL_SECTOR_YEAR} onward (historical tiers: energy/mining 2021+, transport/construction/buildings/materials/industrial 2024+)`,
  },
  waci: {
    ref: `TCFD Guidance on Metrics, Targets & Transition Plans (2021) / ${PCAF_PART_A}`,
    formula: 'WACI = Σ(portfolio_weight × emissions / revenue) across all holdings',
    unit: 'tCO2e per $M revenue (revenue-denominated per TCFD 2021 standard)',
    note: 'Portfolio weight = outstanding_i / Σ outstanding',
  },
  evic: {
    ref: PCAF_PART_A,
    formula: 'EVIC = Market Cap + Total Debt + Preferred Stock + Minority Interest',
    currency: 'USD millions at reporting year-end exchange rates (ECB reference)',
    sources: { 1: 'Analyst-verified reference table / live feed', 2: 'Bloomberg/Refinitiv', 3: 'Company filing', 4: 'Sector-median proxy (plausibility-banded)' },
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
  // Key names (partB/partC) are historical/internal and don't correspond 1:1
  // to the PCAF Part lettering — insurance is genuinely PCAF Part C, and
  // facilitated is genuinely PCAF Part B (see pcafStandards.js, R3 gap B-1).
  partB: {
    ref: PCAF_PART_C,
    formula: 'Insured emissions = attribution_ratio × policyholder_GHG',
    note: 'Attribution for P&C: insured_value / asset_value; Life & Health remain out of scope. Dec 2025 update adds treaty reinsurance and project insurance methodologies.',
  },
  partC: {
    ref: PCAF_PART_B,
    formula: 'Facilitated emissions = underwriting_share × issuer_GHG × 33% weighting factor',
    note: 'Capital markets (bonds, equity) — one-year recognition in year of transaction; M&A/advisory mandates are out of scope. An additional 100%-unweighted disclosure is permitted if reported separately with rationale.',
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
    citation: 'PCAF Standard, Chapter 2 — Scope & Applicability',
    checks: [
      'outstanding_amount > 0',
      `asset_class ∈ PCAF Part A taxonomy (${PCAF_PART_A} — 10 asset classes)`,
      'currency is ISO 4217',
      'sector classified (GICS / NACE)',
      'country/geography provided',
    ],
  },
  {
    id: 'S2',
    label: 'EVIC Determination',
    desc: 'Retrieve Enterprise Value Including Cash from live data or estimate via sector-median ratio',
    citation: 'PCAF Standard, Chapter 5',
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
    citation: 'PCAF Standard, Chapter 5',
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
    citation: 'PCAF Standard, Chapter 5 + GHG Protocol Corporate Standard',
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
    citation: 'PCAF Standard, Chapter 5',
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
    citation: `TCFD Guidance on Metrics, Targets & Transition Plans (2021) / ${PCAF_PART_A}`,
    formula: 'waci_contribution = portfolio_weight × (total_emissions / revenue_$M)',
    checks: [
      'Revenue in $M (same currency as outstanding)',
      'Portfolio weight = outstanding_i / Σ all outstanding',
      'Intensity units: tCO2e per $M revenue',
      'Flag if revenue is estimated (sector revenue-intensity proxy, not 15% of EVIC)',
      'WACI excludes sovereign debt (no revenue denominator)',
    ],
  },
  {
    id: 'S7',
    label: 'DQS Composite Score',
    desc: 'Derive final composite Data Quality Score from all input data sources',
    citation: 'PCAF Standard, Chapter 3 (Data Quality)',
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
export function generatePositionTrail(pos, totalOutstandingMn, posIdx = 0, reportingYear = SCOPE3_ALL_SECTOR_YEAR) {
  // Position objects (see BASE_POSITIONS in PcafFinancedEmissionsPage.jsx)
  // carry EVIC as `evic` in $Bn — there is no `evicBn` field. Reading the
  // wrong key silently produced NaN -> 0 for every position, zeroing every
  // audit-trail attribution ratio and financed-emissions figure regardless
  // of whether real EVIC data existed (GAP-002).
  //
  // R3 gap A-4: prefer a genuinely analyst-verified entry in
  // evic_reference.json (source no longer says TODO/"existing platform
  // estimate") over the position's own hardcoded (unverified) EVIC — this is
  // the same resolution order used by computeAttrFactor in
  // PcafFinancedEmissionsPage.jsx, so the audit trail and the main
  // calculation no longer disagree on which EVIC value is authoritative.
  const _evicRef = getReferenceEntry(pos.ticker);
  const _evicRefVerified = !!(_evicRef && typeof _evicRef.evic_usd_bn === 'number' && !/^(TODO|Existing platform estimate)/i.test(_evicRef.source || ''));
  const resolvedEvicBn = _evicRefVerified ? _evicRef.evic_usd_bn : (parseFloat(pos.evic) || (_evicRef && typeof _evicRef.evic_usd_bn === 'number' ? _evicRef.evic_usd_bn : 0));
  const evicMn = resolvedEvicBn * 1000;
  const outstandingMn = parseFloat(pos.outstanding) || 0;
  const scope1 = parseFloat(pos.scope1) || 0;
  const scope2 = parseFloat(pos.scope2) || 0;
  const scope3 = parseFloat(pos.scope3) || 0;
  // R3 gap B-2: PCAF requires scope 1+2 and scope 3 to be reported
  // separately, never blended into a single headline metric — this is what
  // previously made the audit-trail's per-position and portfolio headline
  // (all-scope) disagree with the Part A tab's headline (scope 1+2 only) by
  // orders of magnitude for scope-3-heavy sectors (oil majors, mining) even
  // though both were internally correct on their own terms (ex A-3/B-2
  // finding: "audit engine 1.45M" vs UI "3.79M" for the same portfolio).
  const totalEmissionsS12 = scope1 + scope2;
  const totalEmissions = totalEmissionsS12 + scope3;
  const scope3Required = isScope3Required(pos.sector, reportingYear);
  const attributionRatio = evicMn > 0 ? Math.min(outstandingMn / evicMn, 1) : 0;
  const financedEmissions = attributionRatio * totalEmissionsS12;
  const financedEmissionsS3 = attributionRatio * scope3;
  // R3 gap B-4: this fallback previously used a flat 15%-of-EVIC assumption
  // even after the Part A engine (PcafFinancedEmissionsPage.jsx) had already
  // moved to a sector revenue-intensity proxy for the same GAP-020 WACI
  // inflation bug — the two engines' revenue-proxy logic had silently
  // drifted apart. Both now call the same shared helper (pcafStandards.js).
  const referenceRevenueMn = getReferenceRevenueM(pos.ticker);
  const revenueProxy = referenceRevenueMn == null;
  const revenueMn = referenceRevenueMn != null ? referenceRevenueMn
    : (parseFloat(pos.revenueBn) || 0) * 1000 || sectorRevenueProxyM(pos.sector, resolvedEvicBn);
  const portfolioWeight = totalOutstandingMn > 0 ? outstandingMn / totalOutstandingMn : 0;
  // WACI is reported on Scope 1+2 (waciComponent, unchanged field name);
  // waciComponentS123 is the explicit, separately-labeled all-scope variant
  // — same separate-scope-reporting principle as financedEmissions /
  // financedEmissionsS3 above (R3 gap B-2).
  const waciComponent = revenueMn > 0 ? portfolioWeight * (totalEmissionsS12 / revenueMn) : 0;
  const waciComponentS123 = revenueMn > 0 ? portfolioWeight * (totalEmissions / revenueMn) : 0;
  const evicDqs = _evicRefVerified ? 1 : (pos.source === 'EODHD' || pos.source === 'EODHD live') ? 1 : 4;
  const emissionsDqs = parseInt(pos.dqs) || 3;
  // R3 gap B-4: a revenue proxy caps DQS at 4, same treatment as an EVIC
  // proxy — never claim DQS 1-3 confidence off an estimated denominator.
  const compositeDqs = revenueProxy ? Math.max(evicDqs, emissionsDqs, 4) : Math.max(evicDqs, emissionsDqs);

  // Build flags
  const flags = [];
  if (!pos.ticker || pos.ticker === '—') flags.push({ severity: 'warn', code: 'F01', msg: 'No ticker provided — EVIC estimated from sector median only' });
  if (evicMn <= 0 && outstandingMn > 0) flags.push({ severity: 'error', code: 'F00', msg: 'EVIC = $0 — attribution ratio and financed emissions cannot be computed; this is a blocking data error, not a proxy estimate' });
  if (evicMn < outstandingMn && evicMn > 0) flags.push({ severity: 'error', code: 'F02', msg: `EVIC ($${evicMn.toFixed(0)}M) < outstanding ($${outstandingMn.toFixed(0)}M) — data integrity issue` });
  if (attributionRatio > 0.25) flags.push({ severity: 'warn', code: 'F03', msg: `High attribution ratio ${(attributionRatio * 100).toFixed(1)}% — concentrated exposure; verify position size` });
  // R3 gap B-2: scope-3 phase-in is complete for reports from 2025 onward
  // (all sectors) — this is no longer a soft "recommended for a few sectors"
  // note but a standard requirement once the reporting year crosses that
  // threshold. Escalated to 'error' (not 'warn') once required and missing.
  if (scope3 === 0 && scope3Required) flags.push({ severity: 'error', code: 'F04', msg: `Scope 3 missing — required for reporting year ${reportingYear} (PCAF scope-3 phase-in; all-sector requirement from ${SCOPE3_ALL_SECTOR_YEAR})` });
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
      // EVIC = 0 zeroes out every downstream figure (attribution ratio,
      // financed emissions, WACI) for this position — a blocking failure,
      // not a mere data-quality warning (GAP-002/GAP-003: this previously
      // showed WARN, alongside a hardcoded checkmark that always rendered
      // "✓ Validate EVIC > 0" even when EVIC was 0).
      status: evicMn > 0 ? 'PASS' : 'FAIL',
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
        scope1_tCO2e: `${scope1.toLocaleString('en-US')} tCO2e`,
        scope2_tCO2e: `${scope2.toLocaleString('en-US')} tCO2e`,
        scope3_tCO2e: scope3 > 0 ? `${scope3.toLocaleString('en-US')} tCO2e` : 'Not provided',
        emissionsDqs,
        dataSource: pos.source || 'Manual entry',
        gwpVersion: 'AR5 100-year (IPCC Fifth Assessment Report)',
      },
      outputs: {
        totalEmissions_tCO2e: `${totalEmissions.toLocaleString('en-US')} tCO2e`,
        scope1_share: totalEmissions > 0 ? `${(scope1 / totalEmissions * 100).toFixed(1)}%` : '—',
        scope2_share: totalEmissions > 0 ? `${(scope2 / totalEmissions * 100).toFixed(1)}%` : '—',
        scope3_share: totalEmissions > 0 && scope3 > 0 ? `${(scope3 / totalEmissions * 100).toFixed(1)}%` : 'Not included',
        scope3Required,
        scope3ComplianceNote: scope3Required && scope3 === 0
          ? `⚠ Scope 3 required for reporting year ${reportingYear} but not provided`
          : scope3Required ? '✓ Scope 3 provided as required' : `Not yet required for reporting year ${reportingYear} for this sector`,
      },
      status: totalEmissions > 0 ? 'PASS' : 'WARN',
    },
    {
      ...STEP_DEFS[4],
      inputs: {
        attributionRatio: attributionRatio.toFixed(6),
        totalEmissions_tCO2e: `${totalEmissions.toLocaleString('en-US')} tCO2e`,
      },
      outputs: {
        // R3 gap B-2: the headline figure is Scope 1+2 only — Scope 3 is
        // always reported as a separate line (financedEmissionsS3 below),
        // never blended in, per PCAF's separate-reporting requirement.
        financedEmissions_tCO2e_S12: `${financedEmissions.toFixed(2)} tCO2e`,
        financedEmissions_tCO2e_S3: scope3 > 0 ? `${financedEmissionsS3.toFixed(2)} tCO2e` : 'N/A',
        scope1Financed: `${(attributionRatio * scope1).toFixed(2)} tCO2e`,
        scope2Financed: `${(attributionRatio * scope2).toFixed(2)} tCO2e`,
        scope3Financed: scope3 > 0 ? `${financedEmissionsS3.toFixed(2)} tCO2e` : 'N/A',
        calculation: `${attributionRatio.toFixed(6)} × ${totalEmissionsS12.toLocaleString('en-US')} (S1+2) = ${financedEmissions.toFixed(2)} tCO2e; S3 reported separately`,
        // Every position in this dataset is a Part A (Financed Emissions)
        // holding; PCAF Part B is deal-based (facilitated emissions, see the
        // Facilitated tab) and does not apply per-position here. A prior
        // version of this field mislabeled mortgages as "Part B", which is
        // simply wrong — mortgages are a Part A asset class.
        pcafPart: pos.assetClass?.toLowerCase().includes('insurance') ? PCAF_PART_C : PCAF_PART_A,
      },
      status: 'PASS',
    },
    {
      ...STEP_DEFS[5],
      inputs: {
        portfolioWeight_pct: `${(portfolioWeight * 100).toFixed(4)}%`,
        totalEmissions_S12_tCO2e: `${totalEmissionsS12.toLocaleString('en-US')} tCO2e`,
        totalEmissions_S123_tCO2e: `${totalEmissions.toLocaleString('en-US')} tCO2e`,
        revenue_USD_M: `$${revenueMn.toFixed(2)}M`,
        revenueSource: referenceRevenueMn != null ? 'Analyst-verified reference table'
          : (parseFloat(pos.revenueBn) || 0) > 0 ? 'Financial data'
          : 'Sector revenue-intensity proxy (not 15% of EVIC)',
      },
      outputs: {
        // WACI is reported on Scope 1+2 (waciComponent); the all-scope
        // variant is a separate, explicitly labeled figure — never blended
        // (R3 gap B-4, same separate-reporting principle as B-2).
        waciComponent_S12: `${waciComponent.toFixed(6)} tCO2e/$M (portfolio-weighted)`,
        waciComponent_S123: `${waciComponentS123.toFixed(6)} tCO2e/$M (portfolio-weighted)`,
        calculation: `${(portfolioWeight * 100).toFixed(4)}% × ${revenueMn > 0 ? (totalEmissionsS12 / revenueMn).toFixed(4) : 0} = ${waciComponent.toFixed(6)}`,
        note: revenueProxy ? '⚠ Revenue estimated via sector proxy — improve: obtain company revenue from annual report' : '✓ Revenue from financial data',
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
    standard: PCAF_PART_A,
    reportingYear,
    steps,
    summary: {
      outstandingMn,
      evicMn,
      attributionRatio,
      // financedEmissions is the Scope 1+2 headline (never blended with
      // Scope 3 — R3 gap B-2); financedEmissionsS3 is the always-separate
      // Scope 3 line; financedEmissionsAllScopes exists only as an explicit,
      // clearly-labeled secondary figure for callers that need an all-scope
      // total (e.g. an "including Scope 3" KPI card) — never render it under
      // a plain "Financed Emissions" label.
      financedEmissions,
      financedEmissionsS3,
      financedEmissionsAllScopes: financedEmissions + financedEmissionsS3,
      totalEmissionsS12,
      totalEmissions,
      scope3Required,
      // waciComponent is Scope 1+2 (headline); waciComponentS123 is the
      // separately-labeled all-scope variant (R3 gap B-4) — same
      // never-blend principle as the financedEmissions fields above.
      waciComponent,
      waciComponentS123,
      revenueProxy,
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
 * @param {number} [reportingYear] - defaults to the most recently completed
 *   calendar year, which is >= the 2025 all-sector scope-3 threshold today
 * @returns {object} { trailId, positions (trails), portfolio, methodologyNotes }
 */
export function generatePortfolioAuditTrail(positions, reportingYear = new Date().getFullYear() - 1) {
  const totalOutstandingMn = positions.reduce((s, p) => s + (parseFloat(p.outstanding) || 0), 0);
  const trails = positions.map((p, i) => generatePositionTrail(p, totalOutstandingMn, i, reportingYear));

  // Scope 1+2 headline; Scope 3 always summed and surfaced separately (R3 gap
  // B-2) — never folded into one blended "total financed emissions" figure.
  const totalFinancedEmissions = trails.reduce((s, t) => s + t.summary.financedEmissions, 0);
  const totalFinancedEmissionsS3 = trails.reduce((s, t) => s + t.summary.financedEmissionsS3, 0);
  const scope3RequiredCount = trails.filter(t => t.summary.scope3Required).length;
  const scope3MissingCount = trails.filter(t => t.flags.some(f => f.code === 'F04')).length;
  // R3 gap B-4: portfolioWaci is Scope 1+2; portfolioWaciS123 is the
  // separately-labeled all-scope variant. revenueProxyCount surfaces how
  // much of the book's WACI denominator is a sector proxy rather than
  // reported revenue.
  const portfolioWaci = trails.reduce((s, t) => s + t.summary.waciComponent, 0);
  const portfolioWaciS123 = trails.reduce((s, t) => s + t.summary.waciComponentS123, 0);
  const revenueProxyCount = trails.filter(t => t.summary.revenueProxy).length;
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
    standard: `${PCAF_PART_A} + TCFD Guidance on Metrics (2021)`,
    reportingYear,
    positions: trails,
    portfolio: {
      totalPositions: positions.length,
      totalOutstandingMn,
      // Scope 1+2 headline (never blended with Scope 3 — R3 gap B-2).
      totalFinancedEmissions,
      totalFinancedEmissionsS3,
      totalFinancedEmissionsAllScopes: totalFinancedEmissions + totalFinancedEmissionsS3,
      scope3RequiredCount,
      scope3MissingCount,
      portfolioWaci,
      portfolioWaciS123,
      revenueProxyCount,
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
      `Attribution ratio: outstanding ($M) / EVIC ($M) per ${PCAF_PART_A}`,
      'EVIC: analyst-verified reference table where available (DQS=1); sector-median proxy within a plausibility band otherwise (DQS=4); unresolvable positions are reported as a data gap, not a zero',
      `Scope 1+2 and Scope 3 are reported separately, never blended (PCAF requirement); scope 3 required for all sectors from reporting year ${SCOPE3_ALL_SECTOR_YEAR} onward`,
      'WACI denominator: reported revenue where available per TCFD 2021 standard; sector revenue-intensity proxy otherwise (flagged, DQS capped)',
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
