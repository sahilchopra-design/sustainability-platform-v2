// ═══════════════════════════════════════════════════════════════════════════════
// Cross-Module Data Wiring
// ENH-004  PCAF → SFDR PAI auto-feed
// ENH-005  CBAM ↔ Scope 3 cross-link
// ENH-026  Temperature ↔ Credibility link
// ENH-027  Page / service parity verification
// ENH-034  Cross-module consistency validator
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ENH-004: PCAF → SFDR PAI auto-feed ──────────────────────────────────────
// Takes PCAF financed-emissions output and produces the 14 mandatory SFDR PAI
// indicators defined in SFDR RTS Annex I Table 1.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Array} financedEmissions - Array of { company, scope, financedEmissions, weight, sector, ... }
 * @param {number} portfolioAUM     - Total portfolio AUM in EUR
 * @param {Object} opts             - Optional overrides (fossilFuelSectors, highImpactSectors, etc.)
 */
export function pcafToSfdrPai(financedEmissions, portfolioAUM, opts = {}) {
  const fe = financedEmissions || [];
  const aumM = portfolioAUM / 1e6; // €M for carbon-footprint denominator

  // --- PAI 1: GHG emissions (Scope 1 / 2 / 3) ---
  const byScope = (s) => fe.filter(e => e.scope === s).reduce((sum, e) => sum + (e.financedEmissions || 0), 0);
  const scope1 = byScope(1);
  const scope2 = byScope(2);
  const scope3 = byScope(3);
  const totalFinanced = scope1 + scope2 + scope3;

  // --- PAI 2: Carbon footprint (tCO2e per €M invested) ---
  const carbonFootprint = aumM > 0 ? totalFinanced / aumM : 0;

  // --- PAI 3: Weighted average GHG intensity (tCO2e per €M revenue) ---
  const weightedIntensity = fe.reduce((sum, e) => sum + (e.ghgIntensity || 0) * (e.weight || 0), 0);

  // --- PAI 4: Exposure to fossil-fuel companies ---
  const fossilSectors = opts.fossilFuelSectors || [
    'Oil & Gas', 'Coal Mining', 'Fossil Fuel Distribution',
    'Thermal Coal Power', 'Oil & Gas Extraction',
  ];
  const fossilHoldings = fe.filter(e => fossilSectors.some(s =>
    (e.sector || '').toLowerCase().includes(s.toLowerCase()),
  ));
  const fossilExposure = fossilHoldings.reduce((s, e) => s + (e.weight || 0), 0);

  // --- PAI 5: Non-renewable energy share ---
  const nonRenewableShare = fe.reduce((s, e) => s + (e.nonRenewableEnergyPct || 0) * (e.weight || 0), 0);

  // --- PAI 6: Energy consumption intensity per high-impact sector ---
  const highImpactSectors = opts.highImpactSectors || [
    'Energy', 'Materials', 'Industrials', 'Utilities', 'Real Estate',
  ];
  const energyIntensityByNACE = {};
  for (const sec of highImpactSectors) {
    const items = fe.filter(e => (e.sector || '').toLowerCase().includes(sec.toLowerCase()));
    const totalWeight = items.reduce((s, e) => s + (e.weight || 0), 0);
    energyIntensityByNACE[sec] = totalWeight > 0
      ? items.reduce((s, e) => s + (e.energyIntensity || 0) * (e.weight || 0), 0) / totalWeight
      : 0;
  }

  // --- PAI 7: Activities negatively affecting biodiversity-sensitive areas ---
  const biodiversityExposure = fe
    .filter(e => e.biodiversityFlag)
    .reduce((s, e) => s + (e.weight || 0), 0);

  // --- PAI 8: Emissions to water ---
  const emissionsToWater = fe.reduce((s, e) => s + (e.waterEmissions || 0) * (e.weight || 0), 0);

  // --- PAI 9: Hazardous waste ratio ---
  const hazardousWasteRatio = fe.reduce((s, e) => s + (e.hazardousWasteRatio || 0) * (e.weight || 0), 0);

  // --- PAI 10: UNGC / OECD Guidelines violations ---
  const ungcViolations = fe.filter(e => e.ungcViolation).length;
  const ungcViolationExposure = fe
    .filter(e => e.ungcViolation)
    .reduce((s, e) => s + (e.weight || 0), 0);

  // --- PAI 11: Lack of UNGC/OECD compliance processes ---
  const noComplianceProcess = fe.filter(e => !e.hasComplianceProcess).length;

  // --- PAI 12: Unadjusted gender pay gap ---
  const avgGenderPayGap = fe.reduce((s, e) => s + (e.genderPayGap || 0) * (e.weight || 0), 0);

  // --- PAI 13: Board gender diversity ---
  const avgBoardGenderDiversity = fe.reduce(
    (s, e) => s + (e.boardFemalePct || 0) * (e.weight || 0), 0,
  );

  // --- PAI 14: Controversial weapons exposure ---
  const controversialWeaponsExposure = fe
    .filter(e => e.controversialWeapons)
    .reduce((s, e) => s + (e.weight || 0), 0);

  return {
    pai1_scope1: scope1,
    pai1_scope2: scope2,
    pai1_scope3: scope3,
    pai1_totalFinancedEmissions: totalFinanced,
    pai2_carbonFootprint: carbonFootprint,
    pai3_ghgIntensity: weightedIntensity,
    pai4_fossilFuelExposure: fossilExposure,
    pai5_nonRenewableEnergyShare: nonRenewableShare,
    pai6_energyIntensityByNACE: energyIntensityByNACE,
    pai7_biodiversityExposure: biodiversityExposure,
    pai8_emissionsToWater: emissionsToWater,
    pai9_hazardousWasteRatio: hazardousWasteRatio,
    pai10_ungcViolations: ungcViolations,
    pai10_ungcViolationExposure: ungcViolationExposure,
    pai11_noComplianceProcess: noComplianceProcess,
    pai12_genderPayGap: avgGenderPayGap,
    pai13_boardGenderDiversity: avgBoardGenderDiversity,
    pai14_controversialWeaponsExposure: controversialWeaponsExposure,
    portfolioAUM,
    investeeCount: fe.length,
    lineage: {
      source: 'PCAF E-001',
      transform: 'PCAF \u2192 SFDR PAI',
      standard: 'SFDR RTS Annex I Table 1',
      computedAt: new Date().toISOString(),
    },
  };
}


// ─── ENH-005: CBAM ↔ Scope 3 cross-link ─────────────────────────────────────
// Identifies CBAM-liable imports within Scope 3 Category 1 (purchased goods).
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CBAM_PRODUCTS = [
  'cement', 'iron', 'steel', 'aluminium', 'fertiliser', 'fertilizer',
  'electricity', 'hydrogen',
];

const DEFAULT_CARBON_PRICE_EUR = 85; // EU ETS indicative price (€/tCO2e)

/**
 * @param {Array}  scope3Category1   - Scope 3 Cat 1 line items { product, supplier, emissions, spend, origin, ... }
 * @param {string} importerCountry   - ISO 2-letter code of importer jurisdiction (default 'EU')
 * @param {Object} opts              - { carbonPrice, cbamProducts }
 */
export function scope3ToCbam(scope3Category1, importerCountry = 'EU', opts = {}) {
  const cbamProducts = opts.cbamProducts || DEFAULT_CBAM_PRODUCTS;
  const carbonPrice  = opts.carbonPrice  || DEFAULT_CARBON_PRICE_EUR;

  const items = (scope3Category1 || []);

  const cbamLiable = items
    .filter(item => cbamProducts.some(p => (item.product || '').toLowerCase().includes(p)))
    .map(item => {
      const embeddedEmissions = item.emissions || 0;
      // Deduct any carbon price already paid in the origin country
      const originCarbonCost  = item.originCarbonPrice || 0;
      const netCbamLiability  = Math.max(0, (carbonPrice - originCarbonCost) * embeddedEmissions);
      return {
        ...item,
        cbamLiable: true,
        embeddedEmissions,
        cbamCertificateCost: netCbamLiability,
        cbamCertificatesRequired: Math.ceil(embeddedEmissions), // 1 cert = 1 tCO2e
        applicableCarrierPrice: carbonPrice,
        originCarbonCostDeducted: originCarbonCost * embeddedEmissions,
        importerJurisdiction: importerCountry,
        lineage: {
          source: 'Scope 3 Cat 1',
          transform: 'CBAM filter',
          standard: 'EU CBAM Regulation 2023/956',
          carbonPriceUsed: carbonPrice,
          computedAt: new Date().toISOString(),
        },
      };
    });

  const nonCbam = items
    .filter(item => !cbamProducts.some(p => (item.product || '').toLowerCase().includes(p)))
    .map(item => ({ ...item, cbamLiable: false }));

  return {
    cbamLiableItems: cbamLiable,
    nonCbamItems: nonCbam,
    totalCbamEmissions: cbamLiable.reduce((s, i) => s + i.embeddedEmissions, 0),
    totalCbamCost: cbamLiable.reduce((s, i) => s + i.cbamCertificateCost, 0),
    totalCertificatesRequired: cbamLiable.reduce((s, i) => s + i.cbamCertificatesRequired, 0),
    summary: {
      liableCount: cbamLiable.length,
      totalCount: items.length,
      pctLiable: items.length > 0 ? (cbamLiable.length / items.length) * 100 : 0,
    },
  };
}


// ─── ENH-026: Temperature ↔ Credibility link ────────────────────────────────
// Cross-references implied-temperature-rise (ITR) with a company's published
// transition plan to surface credibility gaps for engagement prioritisation.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number} temperatureScore  - Implied temperature rise in °C (e.g. 2.4)
 * @param {Object} transitionPlan    - { status, targets, capexAligned, verifiedBy, publishedDate, ... }
 * @param {Object} opts              - { parisTarget, criticalThreshold }
 */
export function temperatureToCredibility(temperatureScore, transitionPlan, opts = {}) {
  const parisTarget       = opts.parisTarget       || 1.5;
  const criticalThreshold = opts.criticalThreshold || 2.5;
  const plan = transitionPlan || {};

  const hasPublishedPlan = plan.status === 'published' || plan.status === 'verified';
  const tempAboveParis   = temperatureScore > parisTarget;
  const credibilityGap   = tempAboveParis && hasPublishedPlan;

  // Engagement priority: Critical → High → Medium → Monitor
  let engagementPriority;
  if (temperatureScore > criticalThreshold)      engagementPriority = 'Critical';
  else if (temperatureScore > 2.0)               engagementPriority = 'High';
  else if (temperatureScore > parisTarget)        engagementPriority = 'Medium';
  else                                           engagementPriority = 'Monitor';

  // Credibility assessment detail
  const assessmentNotes = [];
  if (credibilityGap) {
    assessmentNotes.push(`ITR ${temperatureScore.toFixed(1)}°C exceeds ${parisTarget}°C Paris target despite published transition plan`);
  }
  if (plan.targets && plan.targets.length === 0) {
    assessmentNotes.push('Transition plan lacks quantitative targets');
  }
  if (plan.capexAligned !== undefined && plan.capexAligned < 0.3) {
    assessmentNotes.push(`Only ${(plan.capexAligned * 100).toFixed(0)}% of capex is Paris-aligned`);
  }
  if (plan.verifiedBy) {
    assessmentNotes.push(`Plan verified by ${plan.verifiedBy}`);
  }

  return {
    temperatureScore,
    parisTarget,
    credibilityGap,
    engagementPriority,
    planStatus: plan.status || 'none',
    assessmentNotes,
    lineage: {
      source: 'E-002 (ITR) + TPT Framework',
      transform: 'Temperature-Credibility link',
      standard: 'IIGCC Net Zero Stewardship Toolkit',
      computedAt: new Date().toISOString(),
    },
  };
}


// ─── ENH-027: Page / service parity verification ─────────────────────────────
// Compares a value computed on the frontend page with the corresponding
// back-end service result to flag drift beyond a specified tolerance.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number} pageResult    - Value computed on the frontend
 * @param {number} serviceResult - Value returned by the backend API
 * @param {number} tolerance     - Relative tolerance (default 0.1 %)
 */
export function verifyParity(pageResult, serviceResult, tolerance = 0.001) {
  const delta    = Math.abs(pageResult - serviceResult);
  const denom    = Math.abs(serviceResult) || 1; // avoid div-by-zero
  const relDelta = delta / denom;
  const withinTolerance = relDelta <= tolerance;

  return {
    pageValue: pageResult,
    serviceValue: serviceResult,
    delta,
    relativeDelta: relDelta,
    withinTolerance,
    severity: withinTolerance ? 'OK' : relDelta > 0.05 ? 'CRITICAL' : 'WARNING',
    lineage: {
      transform: 'Parity check',
      tolerance,
      checkedAt: new Date().toISOString(),
    },
  };
}

/**
 * Batch parity check across multiple fields.
 * @param {Object} pageResults    - { fieldName: value }
 * @param {Object} serviceResults - { fieldName: value }
 * @param {number} tolerance
 */
export function verifyParityBatch(pageResults, serviceResults, tolerance = 0.001) {
  const fields = Object.keys(pageResults);
  const results = {};
  const failures = [];

  for (const key of fields) {
    if (serviceResults[key] === undefined) continue;
    const check = verifyParity(pageResults[key], serviceResults[key], tolerance);
    results[key] = check;
    if (!check.withinTolerance) failures.push({ field: key, ...check });
  }

  return {
    results,
    totalChecked: Object.keys(results).length,
    totalPassed: Object.keys(results).length - failures.length,
    totalFailed: failures.length,
    failures,
    allPassed: failures.length === 0,
  };
}


// ─── ENH-034: Cross-module consistency validator ─────────────────────────────
// Checks that the same entity's data is consistent across multiple modules
// (e.g. a company's Scope 1 in PCAF vs Carbon Calculator vs ESG Ratings).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} modules - Keyed by module name, each value is an array of
 *   entities: [{ companyId, scope1, scope2, esgScore, temperatureScore, ... }]
 * @param {Object} opts - { emissionsTolerance, scoreTolerance }
 */
export function validateConsistency(modules, opts = {}) {
  const emissionsTol = opts.emissionsTolerance || 0.05; // 5 %
  const scoreTol     = opts.scoreTolerance     || 0.10; // 10 %
  const issues = [];

  // Build a map: companyId → { moduleName: data }
  const entityMap = {};
  for (const [moduleName, entities] of Object.entries(modules)) {
    for (const entity of entities || []) {
      const id = entity.companyId || entity.issuerId || entity.isin;
      if (!id) continue;
      if (!entityMap[id]) entityMap[id] = {};
      entityMap[id][moduleName] = entity;
    }
  }

  // Compare overlapping entities across modules
  for (const [id, modData] of Object.entries(entityMap)) {
    const moduleNames = Object.keys(modData);
    if (moduleNames.length < 2) continue; // only in one module → skip

    for (let i = 0; i < moduleNames.length; i++) {
      for (let j = i + 1; j < moduleNames.length; j++) {
        const a = modData[moduleNames[i]];
        const b = modData[moduleNames[j]];

        // Check Scope 1 consistency
        if (a.scope1 != null && b.scope1 != null) {
          const delta = Math.abs(a.scope1 - b.scope1) / (Math.abs(a.scope1) || 1);
          if (delta > emissionsTol) {
            issues.push({
              entityId: id,
              field: 'scope1',
              moduleA: moduleNames[i], valueA: a.scope1,
              moduleB: moduleNames[j], valueB: b.scope1,
              relativeDelta: delta,
              severity: delta > 0.20 ? 'CRITICAL' : 'WARNING',
            });
          }
        }

        // Check Scope 2 consistency
        if (a.scope2 != null && b.scope2 != null) {
          const delta = Math.abs(a.scope2 - b.scope2) / (Math.abs(a.scope2) || 1);
          if (delta > emissionsTol) {
            issues.push({
              entityId: id, field: 'scope2',
              moduleA: moduleNames[i], valueA: a.scope2,
              moduleB: moduleNames[j], valueB: b.scope2,
              relativeDelta: delta,
              severity: delta > 0.20 ? 'CRITICAL' : 'WARNING',
            });
          }
        }

        // Check ESG score consistency
        if (a.esgScore != null && b.esgScore != null) {
          const delta = Math.abs(a.esgScore - b.esgScore) / (Math.abs(a.esgScore) || 1);
          if (delta > scoreTol) {
            issues.push({
              entityId: id, field: 'esgScore',
              moduleA: moduleNames[i], valueA: a.esgScore,
              moduleB: moduleNames[j], valueB: b.esgScore,
              relativeDelta: delta,
              severity: delta > 0.25 ? 'CRITICAL' : 'WARNING',
            });
          }
        }

        // Check temperature score consistency
        if (a.temperatureScore != null && b.temperatureScore != null) {
          const delta = Math.abs(a.temperatureScore - b.temperatureScore);
          if (delta > 0.3) { // > 0.3 °C discrepancy
            issues.push({
              entityId: id, field: 'temperatureScore',
              moduleA: moduleNames[i], valueA: a.temperatureScore,
              moduleB: moduleNames[j], valueB: b.temperatureScore,
              absoluteDelta: delta,
              severity: delta > 0.5 ? 'CRITICAL' : 'WARNING',
            });
          }
        }
      }
    }
  }

  return {
    consistent: issues.length === 0,
    issueCount: issues.length,
    criticalCount: issues.filter(i => i.severity === 'CRITICAL').length,
    warningCount: issues.filter(i => i.severity === 'WARNING').length,
    issues,
    entitiesChecked: Object.keys(entityMap).length,
    modulesChecked: Object.keys(modules).length,
    checkedAt: new Date().toISOString(),
  };
}
