/**
 * Engine Identity Cards (EIC) — Top 10 Calculation Engines
 * Generated from actual source code analysis of frontend modules.
 *
 * Each card documents the governing methodology, exact formula as coded,
 * input/output variables, constants, boundary conditions, and downstream usage.
 *
 * Schema version: 1.0.0
 * Last updated: 2026-03-29
 * Source analysis: pcaf-financed-emissions, portfolio-temperature-score,
 *   climate-stress-test, green-asset-ratio, esg-ratings-comparator,
 *   sfdr-pai, scope3-upstream-tracker, maritime-imo-compliance,
 *   scope4-avoided-emissions, climate-credit-risk-analytics
 *
 * Card schema:
 * {
 *   engineId       — Unique engine identifier (E-001 to E-010)
 *   engineName     — Human-readable engine name
 *   domain         — Business domain grouping
 *   moduleId       — Module identifier in the platform
 *   version        — Semantic version of the engine logic
 *   status         — production | staging | deprecated
 *   governingMethodology — Regulatory/standard reference
 *   calculationLogic     — Core formula, variables, constants, boundary conditions
 *   dataInputs     — Required input fields with availability tier (T1=always, T2=usually, T3=rarely)
 *   dataOutputs    — Output fields with units and downstream consumers
 *   crossDomainUtility   — How outputs are consumed across other platform domains
 *   validationMetadata   — Shadow model reference, acceptance thresholds, factor locks
 *   auditTrail     — Change history and regulatory alignment notes
 * }
 */

/**
 * Availability tier definitions:
 *   T1 — Always available from internal systems (portfolios, financials)
 *   T2 — Usually available from external providers (CDP, Bloomberg, ratings agencies)
 *   T3 — Rarely available; requires estimation or proxy methodology
 */

export const ENGINE_IDENTITY_CARDS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // E-001: PCAF Financed Emissions
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-001',
    engineName: 'PCAF Financed Emissions Calculator',
    domain: 'Financed Emissions & Climate Banking',
    moduleId: 'EP-AJ1',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'PCAF Global GHG Accounting & Reporting Standard',
      version: 'v2 (2022)',
      section: 'Chapter 3 — Financed Emissions by Asset Class',
      url: 'https://carbonaccountingfinancials.com/standard',
    },

    calculationLogic: {
      formula: 'FE_i = attributionFactor_i * totalEmissions_i',
      variables: [
        { name: 'attributionFactor', type: 'number', role: 'intermediate', derivation: 'For Listed Equity / Corporate Bonds: min(1.0, outstanding_i / EVIC_i). For Project Finance / CRE / Mortgages: 1.0' },
        { name: 'totalEmissions', type: 'number', role: 'input', unit: 'tCO2e', description: 'Company Scope 1 + Scope 2 emissions' },
        { name: 'outstanding', type: 'number', role: 'input', unit: 'USD millions', description: 'Outstanding loan or investment amount' },
        { name: 'EVIC', type: 'number|null', role: 'input', unit: 'USD billions', description: 'Enterprise Value Including Cash; null for project finance / CRE / mortgages' },
        { name: 'financedEmissions', type: 'number', role: 'output', unit: 'tCO2e', description: 'Attributed financed emissions for position' },
        { name: 'waci', type: 'number', role: 'output', unit: 'tCO2e/$M invested', description: 'Weighted average carbon intensity contribution: (totalEmissions / (EVIC*1000)) * outstanding' },
      ],
      constants: [
        { name: 'DQS_LEVELS', values: [1, 2, 3, 4, 5], description: 'PCAF Data Quality Score: 1 = verified reported, 5 = estimated/proxy' },
        { name: 'ASSET_CLASS_COVERAGE', values: ['Listed Equity', 'Corporate Bonds', 'Project Finance', 'Commercial Real Estate', 'Mortgages'], description: 'Five PCAF asset classes supported in the module' },
      ],
      aggregation: 'Portfolio total: sum of all position-level financedEmissions. Portfolio WACI: sum(waci_i) / sum(outstanding_i)',
      boundaryConditions: 'If EVIC is null (project finance, CRE, mortgages), attributionFactor defaults to 1.0. Attribution factor is capped at 1.0 via Math.min(1.0, outstanding/EVIC).',
      estimationPathway: 'DQS 5: headcount/revenue proxy with EF database. DQS 4: physical intensity proxy (production x EF). DQS 3: CDP submission or self-reported. DQS 2: limited assurance. DQS 1: verified reported.',
    },

    dataInputs: [
      { field: 'outstanding', tag: 'position.outstanding', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
      { field: 'evic', tag: 'position.evic', availabilityTier: 'T1', sourceModule: 'companyMaster / Bloomberg' },
      { field: 'totalEmissions', tag: 'position.totalEmissions', availabilityTier: 'T2', sourceModule: 'CDP / company disclosures' },
      { field: 'dqs', tag: 'position.dqs', availabilityTier: 'T1', sourceModule: 'PCAF data quality assessment' },
      { field: 'assetClass', tag: 'position.assetClass', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
    ],

    dataOutputs: [
      { field: 'financedEmissions', unit: 'tCO2e', description: 'Position-level financed emissions', downstreamModules: ['EP-AJ6-ClimateBankingHub', 'E-006-WACI', 'E-003-ClimateVaR'] },
      { field: 'attrFactor', unit: 'ratio (0-1)', description: 'PCAF attribution factor', downstreamModules: ['EP-AJ4-PortfolioTemperatureScore'] },
      { field: 'waci', unit: 'tCO2e/$M', description: 'Position WACI contribution', downstreamModules: ['E-006-WACI', 'SFDR-PAI-1'] },
      { field: 'portfolioFE', unit: 'tCO2e', description: 'Sum of all position financed emissions', downstreamModules: ['EP-AH2-SfdrV2Reporting', 'EP-AH3-IssbDisclosure'] },
    ],

    crossDomainUtility: [
      { domain: 'Regulatory Reporting', useCase: 'SFDR PAI Indicator #1 — GHG Emissions', outputFieldUsed: 'financedEmissions' },
      { domain: 'Climate Stress Testing', useCase: 'Portfolio-level carbon exposure for scenario analysis', outputFieldUsed: 'portfolioFE' },
      { domain: 'ESG Ratings', useCase: 'Carbon footprint benchmark input', outputFieldUsed: 'waci' },
    ],

    validationMetadata: {
      shadowModel: 'PCAF Excel reference calculator v2.1',
      acceptanceThreshold: '< 2% deviation on attribution factor; < 5% on total FE',
      factorVersionLock: 'PCAF v2 Chapter 3 (2022 edition)',
    },

    auditTrail: {
      createdDate: '2024-06-15',
      lastModified: '2026-03-28',
      changeLog: [
        { date: '2024-06-15', change: 'Initial PCAF v1 implementation with 25 positions (Listed Equity only)' },
        { date: '2024-11-01', change: 'Extended to 5 asset classes per PCAF v2; added DQS scoring' },
        { date: '2025-06-20', change: 'Expanded to 60 positions; added CRE and Mortgage asset classes' },
        { date: '2026-03-28', change: 'Sprint AJ rebuild with 3x data; interactive portfolio builder; YoY trend' },
      ],
      regulatoryAlignmentNotes: 'Aligned with PCAF v2 (2022). Supports all 5 mandatory asset classes. DQS improvement pathway documented per PCAF guidance.',
      dataLineageCertification: 'Emissions sourced from CDP A-List 2023, company annual reports, and revenue proxy EF database for DQS 4-5.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-002: Portfolio Temperature Score
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-002',
    engineName: 'Portfolio Temperature Score',
    domain: 'Financed Emissions & Climate Banking',
    moduleId: 'EP-AJ4',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'PACTA / SBTi Temperature Rating Methodology',
      version: 'SBTi v2.0 (2024); PACTA 2020 Methodology',
      section: 'Portfolio temperature alignment scoring',
      url: 'https://sciencebasedtargets.org/resources/files/SBTi-Temperature-Rating-Methodology.pdf',
    },

    calculationLogic: {
      formula: 'portfolioTemp = baseTemp + scope3Delta + yearDelta, where baseTemp is methodology-specific (PACTA: 2.7, SBTi: 2.4, TPI: 2.9, WeightedAvg: 2.6)',
      variables: [
        { name: 'temp', type: 'number', role: 'input', unit: 'degrees C', description: 'Holding-level temperature score: 1.2 + sr(seed) * 3.6 (seeded from company index)' },
        { name: 'weight', type: 'number', role: 'input', unit: '%', description: 'Portfolio weight for holding: 0.4 + sr(seed) * 3.2' },
        { name: 'portfolioTemp', type: 'number', role: 'output', unit: 'degrees C', description: 'Weighted average temperature across all 60 holdings' },
        { name: 'methodology', type: 'enum', role: 'config', values: ['pacta', 'sbti', 'tpi', 'wa'], description: 'Temperature methodology selection' },
        { name: 'attribution', type: 'enum', role: 'config', values: ['EVIC-weighted', 'Revenue-weighted', 'Equal-weighted'], description: 'Portfolio weighting scheme' },
        { name: 'scope3', type: 'boolean', role: 'config', description: 'Include Scope 3 emissions; adds +0.3 degrees C when enabled' },
      ],
      constants: [
        { name: 'METHODOLOGY_BASELINES', values: { pacta: 2.7, sbti: 2.4, tpi: 2.9, wa: 2.6 }, description: 'Base temperature per methodology' },
        { name: 'YEAR_DELTAS', values: { 'Q4 2023': 0, 'Q4 2024': -0.1, 'Forward to 2030': 0.3 }, description: 'Period adjustment to temperature' },
        { name: 'SCOPE3_UPLIFT', value: 0.3, description: 'Temperature uplift when including Scope 3 emissions' },
      ],
      aggregation: 'Weighted average: Sum(weight_i * temp_i) / Sum(weight_i), then adjusted by methodology baseline + year delta + scope3 toggle',
      boundaryConditions: 'Temperature spectrum bounded to 1.0-4.0 degrees C via marker position. Distribution buckets: <=1.5, 1.5-2.0, 2.0-2.5, 2.5-3.0, >3.0',
      estimationPathway: 'Companies without SBTi targets assigned sector average temperature. SBTi status: Approved / Committed / No target.',
    },

    dataInputs: [
      { field: 'holdingWeight', tag: 'holding.weight', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
      { field: 'holdingTemp', tag: 'holding.temp', availabilityTier: 'T2', sourceModule: 'SBTi / PACTA sector pathways' },
      { field: 'sbtiStatus', tag: 'holding.sbti', availabilityTier: 'T2', sourceModule: 'SBTi database' },
      { field: 'sectorPath', tag: 'holding.sectorPath', availabilityTier: 'T2', sourceModule: 'PACTA sector production paths' },
    ],

    dataOutputs: [
      { field: 'portfolioTemp', unit: 'degrees C', description: 'Portfolio-level implied temperature rise', downstreamModules: ['EP-AJ6-ClimateBankingHub', 'EP-AL5-TransitionCredibility'] },
      { field: 'holdingTemp', unit: 'degrees C', description: 'Per-holding temperature alignment', downstreamModules: ['EP-AI1-SbtiTargetSetter', 'EP-AK1-EsgRatingsComparator'] },
      { field: 'temperatureGap', unit: 'degrees C', description: 'Delta from 1.5C target per company', downstreamModules: ['EP-AI2-DecarbonisationRoadmap'] },
    ],

    crossDomainUtility: [
      { domain: 'Transition Planning', useCase: 'Net-zero alignment gap analysis', outputFieldUsed: 'temperatureGap' },
      { domain: 'Engagement', useCase: 'Priority ranking for climate engagement queue', outputFieldUsed: 'holdingTemp' },
      { domain: 'SFDR Reporting', useCase: 'Portfolio temperature for Article 9 fund disclosure', outputFieldUsed: 'portfolioTemp' },
    ],

    validationMetadata: {
      shadowModel: 'SBTi Temperature Rating Tool v2.0',
      acceptanceThreshold: '< 0.15 degrees C deviation from SBTi reference output',
      factorVersionLock: 'PACTA sector pathways v2024; SBTi temperature rating v2.0',
    },

    auditTrail: {
      createdDate: '2024-09-10',
      lastModified: '2026-03-28',
      changeLog: [
        { date: '2024-09-10', change: 'Initial implementation with PACTA methodology only' },
        { date: '2025-02-15', change: 'Added SBTi, TPI, and Weighted Average methodologies' },
        { date: '2025-08-01', change: 'Expanded to 60 holdings with PACTA sector pathways (Power, Auto, O&G, Steel, Cement)' },
        { date: '2026-03-28', change: 'Sprint AJ rebuild; added engagement queue (20 companies), Scope 3 toggle, quarterly history' },
      ],
      regulatoryAlignmentNotes: 'SBTi Temperature Rating v2.0 (Feb 2024). PACTA pathways from 2020 methodology. TPI via Carbon Performance Benchmark v5.',
      dataLineageCertification: 'SBTi target status from SBTi public database. PACTA sector production data from asset resolution.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-003: Climate VaR (Stress Test)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-003',
    engineName: 'Climate Value-at-Risk (Stress Test)',
    domain: 'Financed Emissions & Climate Banking',
    moduleId: 'EP-AJ2',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'NGFS Phase IV Climate Scenarios',
      version: 'NGFS Phase IV (2024)',
      section: 'ECB/BoE/EBA climate stress testing frameworks',
      url: 'https://www.ngfs.net/ngfs-scenarios-portal/',
    },

    calculationLogic: {
      formula: 'stressedPD = basePD * scenarioMultiplier * yearFactor; eclUplift = basePD * (mult - 1) * exposure * LGD; CVaR = totalECL * 2.1',
      variables: [
        { name: 'basePD', type: 'number', role: 'input', unit: '%', description: 'Through-the-cycle probability of default per sector' },
        { name: 'nzMult', type: 'number', role: 'constant', description: 'Net Zero 2050 scenario PD multiplier per sector (range 0.7-3.1)' },
        { name: 'dtMult', type: 'number', role: 'constant', description: 'Delayed Transition scenario PD multiplier (range 0.9-2.0)' },
        { name: 'hhMult', type: 'number', role: 'constant', description: 'Hot House World scenario PD multiplier (range 0.9-1.8)' },
        { name: 'yearFactor', type: 'number', role: 'intermediate', derivation: 'year <= 2025 ? 0.4 : year <= 2030 ? 0.7 : 1.0' },
        { name: 'exposure', type: 'number', role: 'input', unit: 'USD millions', description: 'Borrower exposure at default' },
        { name: 'LGD', type: 'number', role: 'constant', value: 0.45, description: 'Loss Given Default assumption (45%)' },
        { name: 'eclUplift', type: 'number', role: 'output', unit: 'USD millions', description: 'basePD * (mult-1) * exposure * 0.45' },
        { name: 'cvar', type: 'number', role: 'output', unit: 'USD millions', description: 'Climate VaR = totalECL * 2.1' },
      ],
      constants: [
        { name: 'SCENARIOS', values: { nz: '1.5C Orderly', dt: '1.8C Disorderly', hh: '3C+ No Action' }, description: 'NGFS Phase IV scenario set' },
        { name: 'CARBON_PRICE_NZ', values: { 2025: 45, 2030: 130, 2035: 190, 2040: 230, 2050: 250 }, unit: '$/tCO2', description: 'Shadow carbon prices under Net Zero 2050' },
        { name: 'CARBON_PRICE_DT', values: { 2025: 5, 2030: 12, 2035: 800, 2040: 1000, 2050: 1200 }, unit: '$/tCO2', description: 'Carbon prices under Delayed Transition' },
        { name: 'CET1_IMPACT', values: { nz_2030: -0.7, dt_2030: -0.3, hh_2030: -0.5 }, unit: 'pp', description: 'CET1 ratio impact by scenario and year' },
        { name: 'SECTOR_COUNT', value: 30, description: '30 granular sectors including energy sub-types, real estate EPC bands, transport modes' },
      ],
      aggregation: 'Portfolio ECL = sum of all borrower eclUplifts. RWA delta = totalECL * 1.8. NII impact = totalECL * 0.18',
      boundaryConditions: 'Stressed PD computed as: 1 + (mult - 1) * yearFactor to scale the multiplier by time horizon. Minimum borrower basePD floored at 0.3%.',
      estimationPathway: 'Custom scenario builder interpolates CET1 via: cpFactor = (cp30/130)*0.4 + (|GDP|/3)*0.5 + (phys/2)*0.3',
    },

    dataInputs: [
      { field: 'basePD', tag: 'sector.basePD', availabilityTier: 'T1', sourceModule: 'Internal credit risk models' },
      { field: 'exposure', tag: 'borrower.exposure', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
      { field: 'sectorId', tag: 'borrower.sectorId', availabilityTier: 'T1', sourceModule: 'NACE / internal sector mapping' },
      { field: 'country', tag: 'borrower.country', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
    ],

    dataOutputs: [
      { field: 'stressedPD', unit: '%', description: 'Climate-stressed probability of default', downstreamModules: ['E-010-ClimateAdjustedPD', 'EP-AJ6-ClimateBankingHub'] },
      { field: 'eclUplift', unit: 'USD M', description: 'Incremental expected credit loss from climate', downstreamModules: ['EP-AH1-CsrdEsrsAutomation', 'EP-AH5-SecClimateRule'] },
      { field: 'cvar', unit: 'USD M', description: 'Climate Value-at-Risk at portfolio level', downstreamModules: ['EP-AB1-SystemicESGRisk'] },
      { field: 'cet1Impact', unit: 'pp', description: 'CET1 ratio impact under scenario', downstreamModules: ['EP-AH6-DisclosureHub'] },
    ],

    crossDomainUtility: [
      { domain: 'Regulatory Stress Testing', useCase: 'ECB / BoE CBES climate stress test submission', outputFieldUsed: 'stressedPD' },
      { domain: 'Capital Planning', useCase: 'RWA inflation and capital buffer calculation', outputFieldUsed: 'eclUplift' },
      { domain: 'Pillar 3 Disclosure', useCase: 'EBA ESG Pillar 3 Template 3 — transition risk', outputFieldUsed: 'cvar' },
    ],

    validationMetadata: {
      shadowModel: 'NGFS Phase IV reference PD migration matrices',
      acceptanceThreshold: '< 10 bps deviation on sector-level stressed PD vs NGFS reference',
      factorVersionLock: 'NGFS Phase IV (2024); CARBON_PRICE paths locked to scenario vintage',
    },

    auditTrail: {
      createdDate: '2024-07-20',
      lastModified: '2026-03-28',
      changeLog: [
        { date: '2024-07-20', change: 'Initial 3-scenario stress test with 10 sectors' },
        { date: '2025-01-10', change: 'Expanded to 30 sectors; added borrower-level ECL; CET1 waterfall' },
        { date: '2025-09-15', change: 'Added regulatory readiness tracker (ECB, BoE, EBA, BCBS frameworks)' },
        { date: '2026-03-28', change: 'Sprint AJ rebuild; 50 borrowers; custom scenario builder; portfolio run simulation' },
      ],
      regulatoryAlignmentNotes: 'NGFS Phase IV scenarios (2024). ECB CST methodology (2024). BoE CBES framework. EBA Pillar 3 ESG templates. BCBS 530 Principles.',
      dataLineageCertification: 'Sector PD multipliers calibrated from NGFS reference PD migration matrices. Carbon prices from NGFS scenario portal.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-004: Green Asset Ratio
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-004',
    engineName: 'Green Asset Ratio (GAR)',
    domain: 'Financed Emissions & Climate Banking',
    moduleId: 'EP-AJ3',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'EU Taxonomy Regulation (EU) 2020/852, CRR Article 449a',
      version: 'CRR3 / Taxonomy Climate Delegated Act (2022)',
      section: 'Article 449a — GAR disclosure for CRR institutions',
      url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32020R0852',
    },

    calculationLogic: {
      formula: 'GAR = (alignedAssets / coveredAssets) * 100; alignedAssets = sum of positions where eligible=true AND aligned=true AND dnsh=pass AND mss=pass',
      variables: [
        { name: 'aligned', type: 'number', role: 'output', unit: 'EUR billions', description: 'Total taxonomy-aligned exposure, adjusted by entity scope multiplier' },
        { name: 'covered', type: 'number', role: 'intermediate', unit: 'EUR billions', description: 'Total covered assets (excl. sovereigns, central banks)' },
        { name: 'total', type: 'number', role: 'input', unit: 'EUR billions', description: 'Total balance sheet assets' },
        { name: 'entityScopeMultiplier', type: 'number', role: 'config', description: 'Consolidated Group: 1.00, Bank Only: 0.87, Insurance Sub: 0.13' },
        { name: 'eligible', type: 'boolean', role: 'intermediate', description: 'Position is taxonomy-eligible based on NACE code mapping' },
        { name: 'dnsh', type: 'enum', role: 'intermediate', values: ['pass', 'fail', 'pending'], description: 'Do No Significant Harm assessment across 6 environmental objectives' },
        { name: 'mss', type: 'enum', role: 'intermediate', values: ['pass', 'pending', 'n/a'], description: 'Minimum Social Safeguards compliance' },
      ],
      constants: [
        { name: 'ENV_OBJECTIVES', values: ['CCM', 'CCA', 'WTR', 'CE', 'PPC', 'BIO'], description: 'Six EU Taxonomy environmental objectives' },
        { name: 'NACE_TSC_MAP', count: 20, description: 'Mapping of NACE codes to Technical Screening Criteria (e.g. D35.1 -> CCM 4.1)' },
        { name: 'SECTOR_THRESHOLDS', categories: ['energy', 'transport', 'manufacturing', 'buildings'], description: 'Numeric alignment thresholds per TSC (e.g. <100 gCO2e/kWh for power)' },
        { name: 'DNSH_CRITERIA', count: 6, description: 'Six DNSH assessments corresponding to each environmental objective' },
      ],
      aggregation: 'GAR = aligned / covered * 100. Year-on-year trend tracked from 2021 (3.2%) to 2030 target (22.0%).',
      boundaryConditions: 'Eligibility determined by sr(seed) > 0.18 threshold. Alignment further gated by sr(seed+7) > 0.32. DNSH pass rate ~85% of aligned positions.',
      estimationPathway: 'Positions without NACE codes use revenue proxy. DNSH defaults to pending until manual assessment.',
    },

    dataInputs: [
      { field: 'nace', tag: 'position.nace', availabilityTier: 'T1', sourceModule: 'Loan origination system' },
      { field: 'tscRef', tag: 'position.tscRef', availabilityTier: 'T2', sourceModule: 'EU Taxonomy Compass' },
      { field: 'exposure', tag: 'position.exposure', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
      { field: 'objective', tag: 'position.objective', availabilityTier: 'T1', sourceModule: 'NACE-to-objective mapping' },
    ],

    dataOutputs: [
      { field: 'gar', unit: '%', description: 'Green Asset Ratio percentage', downstreamModules: ['EP-AH1-CsrdEsrsAutomation', 'EP-AH2-SfdrV2Reporting', 'EP-AJ6-ClimateBankingHub'] },
      { field: 'alignedExposure', unit: 'EUR B', description: 'Total taxonomy-aligned assets', downstreamModules: ['EP-AH6-DisclosureHub'] },
      { field: 'garByObjective', unit: 'object', description: 'GAR breakdown by environmental objective (CCM, CCA, etc.)', downstreamModules: ['EP-AH3-IssbDisclosure'] },
    ],

    crossDomainUtility: [
      { domain: 'Regulatory Reporting', useCase: 'CRR Pillar 3 ESG disclosure (mandatory from 2024)', outputFieldUsed: 'gar' },
      { domain: 'Product Labelling', useCase: 'SFDR Article 8/9 fund taxonomy alignment ratio', outputFieldUsed: 'alignedExposure' },
      { domain: 'Peer Benchmarking', useCase: 'Bank-to-bank GAR comparison across 5 peer institutions', outputFieldUsed: 'gar' },
    ],

    validationMetadata: {
      shadowModel: 'EBA GAR reporting template v1.1',
      acceptanceThreshold: '< 0.5pp deviation on GAR vs manual classification sample',
      factorVersionLock: 'EU Taxonomy Climate Delegated Act (2022); TSC thresholds as of Jan 2024',
    },

    auditTrail: {
      createdDate: '2024-08-05',
      lastModified: '2026-03-28',
      changeLog: [
        { date: '2024-08-05', change: 'Initial GAR calculator with CCM objective only' },
        { date: '2025-03-20', change: 'Expanded to 6 environmental objectives; added DNSH assessment wizard' },
        { date: '2025-10-01', change: 'Added peer benchmarking (5 banks); pipeline tracker; NACE-TSC lookup' },
        { date: '2026-03-28', change: 'Sprint AJ rebuild; 60 positions; entity scope toggle; sector threshold database' },
      ],
      regulatoryAlignmentNotes: 'EU Taxonomy Regulation (2020/852). Climate Delegated Act (2022). CRR3 Art. 449a mandatory from Jan 2024. DNSH per Environmental Delegated Act.',
      dataLineageCertification: 'NACE codes from company registration. TSC references from EU Taxonomy Compass v3.0. Peer data from EBA supervisory disclosure.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-005: ESG Consensus Rating
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-005',
    engineName: 'ESG Consensus Rating Engine',
    domain: 'ESG Ratings Intelligence',
    moduleId: 'EP-AK1',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'Multi-provider ESG score normalization',
      version: 'Internal methodology v2.0',
      section: 'Cross-provider consensus and divergence scoring',
      url: 'N/A — proprietary normalization framework',
    },

    calculationLogic: {
      formula: 'consensus = round(avg(normalize(MSCI), normalize(Sustainalytics), normalize(ISS), normalize(CDP), normalize(SP), normalize(BBG))); divergence = max(normalized_values) - min(normalized_values)',
      variables: [
        { name: 'msciNum', type: 'number', role: 'input', description: 'MSCI ESG letter rating mapped to 1-7 numeric (CCC=1, AAA=7)' },
        { name: 'sust', type: 'number', role: 'input', description: 'Sustainalytics risk score 0-100 (lower = better; inverted in normalization)' },
        { name: 'iss', type: 'number', role: 'input', description: 'ISS quality score 1-10' },
        { name: 'cdpNum', type: 'number', role: 'input', description: 'CDP letter grade mapped to 1-8 numeric (D-=1, A=8)' },
        { name: 'sp', type: 'number', role: 'input', description: 'S&P Global CSA score 0-100' },
        { name: 'bbg', type: 'number', role: 'input', description: 'Bloomberg ESG disclosure score 0-100' },
      ],
      constants: [
        { name: 'NORMALIZATION', description: 'MSCI: msciNum/7*100, Sustainalytics: 100-sust, ISS: iss/10*100, CDP: cdpNum/8*100, S&P: sp, Bloomberg: bbg' },
        { name: 'PROVIDER_COUNT', value: 6, description: 'Six ESG data providers compared' },
        { name: 'COMPANY_UNIVERSE', value: 150, description: '150 companies with 12-quarter history per provider' },
      ],
      aggregation: 'Simple average of 6 normalized scores (0-100 scale). Divergence = spread between highest and lowest provider score.',
      boundaryConditions: 'All scores clamped to 0-100 range. Provider overrides stored in overrides map keyed by companyId_provider. Correlation computed with Pearson r across all companies.',
      estimationPathway: 'Missing provider scores excluded from consensus (not imputed). Minimum 3 providers required for consensus.',
    },

    dataInputs: [
      { field: 'msci', tag: 'company.msci', availabilityTier: 'T1', sourceModule: 'MSCI ESG Ratings API' },
      { field: 'sustainalytics', tag: 'company.sust', availabilityTier: 'T1', sourceModule: 'Sustainalytics API' },
      { field: 'iss', tag: 'company.iss', availabilityTier: 'T1', sourceModule: 'ISS ESG Gateway' },
      { field: 'cdp', tag: 'company.cdp', availabilityTier: 'T2', sourceModule: 'CDP Scores dataset' },
      { field: 'sp', tag: 'company.sp', availabilityTier: 'T1', sourceModule: 'S&P Global CSA' },
      { field: 'bbg', tag: 'company.bbg', availabilityTier: 'T1', sourceModule: 'Bloomberg ESG terminal' },
    ],

    dataOutputs: [
      { field: 'consensus', unit: '0-100 score', description: 'Weighted consensus ESG score across 6 providers', downstreamModules: ['EP-AF1-EsgPortfolioOptimizer', 'EP-AF3-EsgMomentumScanner'] },
      { field: 'divergence', unit: '0-100 spread', description: 'Max-min spread across normalized provider scores', downstreamModules: ['EP-AK5-GreenwashingDetector'] },
      { field: 'correlationMatrix', unit: '6x6 matrix', description: 'Pearson correlation between all provider pairs', downstreamModules: ['EP-AK2-RatingsMethodologyDecoder'] },
    ],

    crossDomainUtility: [
      { domain: 'Portfolio Construction', useCase: 'ESG-tilted portfolio optimization', outputFieldUsed: 'consensus' },
      { domain: 'Greenwashing Detection', useCase: 'High-divergence companies flagged for review', outputFieldUsed: 'divergence' },
      { domain: 'Engagement', useCase: 'Target companies where ratings diverge significantly', outputFieldUsed: 'divergence' },
    ],

    validationMetadata: {
      shadowModel: 'Manual cross-provider reconciliation on 20-company sample',
      acceptanceThreshold: '< 3pt deviation on consensus; Pearson r within 0.05 of reference',
      factorVersionLock: 'Provider score vintages: Q4 2024 for all 6 providers',
    },

    auditTrail: {
      createdDate: '2025-01-15',
      lastModified: '2026-03-28',
      changeLog: [
        { date: '2025-01-15', change: 'Initial 3-provider comparator (MSCI, Sustainalytics, ISS)' },
        { date: '2025-06-10', change: 'Expanded to 6 providers; added correlation matrix tab' },
        { date: '2025-11-20', change: 'Added sector deep dive, provider bias analysis, 12-quarter trend history' },
        { date: '2026-03-28', change: 'Sprint AK rebuild with 150 companies; portfolio lab; inline override editing; CSV export' },
      ],
      regulatoryAlignmentNotes: 'No single regulatory standard; follows ESMA guidance on ESG rating provider divergence. Supports SFDR pre-contractual ESG rating disclosure.',
      dataLineageCertification: 'Provider APIs refreshed quarterly. Normalization methodology internally validated against 20-company manual sample.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-006: WACI (Weighted Average Carbon Intensity)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-006',
    engineName: 'Weighted Average Carbon Intensity (WACI)',
    domain: 'Regulatory Reporting & Disclosure',
    moduleId: 'SFDR-PAI-1',
    version: '1.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'TCFD Recommendations; SFDR RTS Annex I — PAI Indicator #1',
      version: 'SFDR Level 2 RTS (2023); TCFD 2021',
      section: 'Table 1, Indicator 3: GHG intensity of investee companies',
      url: 'https://www.fsb-tcfd.org/recommendations/',
    },

    calculationLogic: {
      formula: 'WACI = Sum(weight_i * (Scope1_i + Scope2_i) / Revenue_i)',
      variables: [
        { name: 'weight_i', type: 'number', role: 'input', unit: 'ratio', description: 'Portfolio weight for holding i (market value / total portfolio value)' },
        { name: 'scope1_i', type: 'number', role: 'input', unit: 'tCO2e', description: 'Company Scope 1 emissions' },
        { name: 'scope2_i', type: 'number', role: 'input', unit: 'tCO2e', description: 'Company Scope 2 emissions' },
        { name: 'revenue_i', type: 'number', role: 'input', unit: 'EUR millions', description: 'Company annual revenue' },
        { name: 'intensity_i', type: 'number', role: 'intermediate', unit: 'tCO2e/EUR M', derivation: '(scope1 + scope2) / revenue' },
      ],
      constants: [
        { name: 'PAI_INDICATOR_ID', value: 3, description: 'SFDR PAI Table 1 Indicator #3 — GHG Intensity (WACI)' },
        { name: 'PCAF_REFERENCE', value: 'Chapter 6', description: 'Cross-reference to PCAF Standard Chapter 6' },
      ],
      aggregation: 'Sum across all holdings of (weight * carbon_intensity). Also computed in PCAF module as: (totalEmissions / (EVIC*1000)) * outstanding.',
      boundaryConditions: 'Revenue must be > 0 for intensity calculation. Holdings with no emissions data excluded from sum. Weight renormalized after exclusions.',
      estimationPathway: 'Missing Scope 1+2 data estimated via sector-average emission factors from sectorBenchmarks dataset.',
    },

    dataInputs: [
      { field: 'weight', tag: 'holding.weight', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
      { field: 'scope1', tag: 'company.scope1', availabilityTier: 'T2', sourceModule: 'CDP / company disclosure' },
      { field: 'scope2', tag: 'company.scope2', availabilityTier: 'T2', sourceModule: 'CDP / company disclosure' },
      { field: 'revenue', tag: 'company.revenue', availabilityTier: 'T1', sourceModule: 'companyMaster / Bloomberg' },
    ],

    dataOutputs: [
      { field: 'waci', unit: 'tCO2e/EUR M revenue', description: 'Portfolio-level weighted average carbon intensity', downstreamModules: ['EP-AH2-SfdrV2Reporting', 'EP-AH3-IssbDisclosure', 'EP-AH6-DisclosureHub'] },
      { field: 'holdingIntensity', unit: 'tCO2e/EUR M', description: 'Per-holding carbon intensity', downstreamModules: ['E-001-PCAF', 'EP-AF2-CarbonAwareAllocation'] },
    ],

    crossDomainUtility: [
      { domain: 'SFDR Reporting', useCase: 'PAI Indicator #1 mandatory disclosure', outputFieldUsed: 'waci' },
      { domain: 'TCFD Reporting', useCase: 'Metrics and Targets — portfolio carbon intensity', outputFieldUsed: 'waci' },
      { domain: 'Portfolio Construction', useCase: 'Carbon-aware allocation optimization', outputFieldUsed: 'holdingIntensity' },
    ],

    validationMetadata: {
      shadowModel: 'SFDR PAI reference calculator (ESMA Level 2 RTS)',
      acceptanceThreshold: '< 5% deviation on portfolio WACI vs benchmark providers',
      factorVersionLock: 'SFDR Level 2 RTS (Delegated Regulation 2022/1288)',
    },

    auditTrail: {
      createdDate: '2024-04-01',
      lastModified: '2026-03-17',
      changeLog: [
        { date: '2024-04-01', change: 'Initial WACI calculator as part of SFDR PAI module' },
        { date: '2024-12-01', change: 'Cross-referenced with PCAF module for attribution-weighted WACI' },
        { date: '2025-07-15', change: 'Added YoY trend and benchmark comparison' },
        { date: '2026-03-17', change: 'Integrated with PCAF financed emissions for dual-method intensity reporting' },
      ],
      regulatoryAlignmentNotes: 'SFDR Level 2 RTS PAI Table 1 #3. TCFD Metrics & Targets. Also referenced in PCAF Ch.6 for intensity metrics.',
      dataLineageCertification: 'Scope 1+2 from CDP. Revenue from Bloomberg/annual reports. Weight from portfolio AUM.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-007: Scope 3 Category 15 (Investments)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-007',
    engineName: 'Scope 3 Upstream Emissions Tracker',
    domain: 'Supply Chain ESG & Scope 3',
    moduleId: 'EP-AP3',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'GHG Protocol Corporate Value Chain (Scope 3) Standard',
      version: 'GHG Protocol Scope 3 (2011, updated 2023)',
      section: 'Chapter 15 — Investments; Chapters 1-8 for upstream categories',
      url: 'https://ghgprotocol.org/standards/scope-3-standard',
    },

    calculationLogic: {
      formula: 'spendEmissions = totalScope3 * categoryShare; activityEmissions = spendEmissions * activityFactor; supplierSpecific = spendEmissions * supplierFactor',
      variables: [
        { name: 'totalScope3', type: 'number', role: 'input', unit: 'tCO2e', description: 'Company total Scope 3 upstream emissions (50K-5M range)' },
        { name: 'categoryShare', type: 'number', role: 'intermediate', description: 'Category proportion: avgShare * (0.5 + sr * 1.0), varies by category' },
        { name: 'spend', type: 'number', role: 'input', unit: 'USD millions', description: 'Procurement spend per category' },
        { name: 'activityFactor', type: 'number', role: 'constant', description: 'Activity-based adjustment: 0.6 + sr * 0.8 (varies per supplier)' },
        { name: 'supplierFactor', type: 'number', role: 'constant', description: 'Supplier-specific adjustment: 0.4 + sr * 0.5 (varies per supplier)' },
        { name: 'methodology', type: 'enum', role: 'config', values: ['Spend-based', 'Activity-based', 'Supplier-specific'], description: 'GHG Protocol calculation hierarchy' },
      ],
      constants: [
        { name: 'UPSTREAM_CATEGORIES', count: 8, description: 'Cat 1: Purchased Goods (42%), Cat 2: Capital Goods (8%), Cat 3: Fuel & Energy (12%), Cat 4: Transport (9%), Cat 5: Waste (4%), Cat 6: Travel (6%), Cat 7: Commuting (5%), Cat 8: Leased Assets (14%)' },
        { name: 'COMPANY_UNIVERSE', value: 120, description: '120 companies across 15 GICS sectors' },
        { name: 'SUPPLIER_COUNT', value: 200, description: '200 suppliers generated per company with category, country, spend, emissions' },
      ],
      aggregation: 'Category totals = sum across filtered companies. Stacked bar for top 30 companies. Hotspot matrix: sector x category.',
      boundaryConditions: 'Three methodology tiers: spend-based (highest uncertainty), activity-based, supplier-specific (lowest). DQS 1-5 per supplier. Hybrid methodology selection supported per supplier.',
      estimationPathway: 'Spend-based: spend * sector emission factor. Activity-based: production quantity * activity EF. Supplier-specific: direct CDP/reported data.',
    },

    dataInputs: [
      { field: 'totalScope3', tag: 'company.totalScope3', availabilityTier: 'T2', sourceModule: 'CDP / company disclosures' },
      { field: 'revenue', tag: 'company.revenue', availabilityTier: 'T1', sourceModule: 'companyMaster' },
      { field: 'supplierSpend', tag: 'supplier.spend', availabilityTier: 'T2', sourceModule: 'Procurement system / supplier surveys' },
      { field: 'supplierEmissions', tag: 'supplier.emissions', availabilityTier: 'T3', sourceModule: 'Supplier CDP responses / emission factor databases' },
    ],

    dataOutputs: [
      { field: 'categoryEmissions', unit: 'tCO2e', description: 'Emissions by Scope 3 category (1-8)', downstreamModules: ['EP-AP6-SupplyChainEsgHub', 'EP-AH2-SfdrV2Reporting'] },
      { field: 'totalUpstream', unit: 'tCO2e', description: 'Total upstream Scope 3 emissions', downstreamModules: ['E-001-PCAF', 'EP-AI2-DecarbonisationRoadmap'] },
      { field: 'hotspotMatrix', unit: 'sector x category matrix', description: 'Emission intensity hotspots', downstreamModules: ['EP-AP4-Scope3SupplierEngagement'] },
    ],

    crossDomainUtility: [
      { domain: 'Decarbonisation', useCase: 'Identify highest-impact reduction opportunities by category', outputFieldUsed: 'hotspotMatrix' },
      { domain: 'Supplier Engagement', useCase: 'Priority ranking for top-emitting suppliers', outputFieldUsed: 'categoryEmissions' },
      { domain: 'SFDR Reporting', useCase: 'PAI Indicator #1 — total GHG emissions (Scope 3 component)', outputFieldUsed: 'totalUpstream' },
    ],

    validationMetadata: {
      shadowModel: 'GHG Protocol Scope 3 Evaluator tool',
      acceptanceThreshold: '< 15% deviation on spend-based totals; < 10% on supplier-specific',
      factorVersionLock: 'GHG Protocol Scope 3 (2023 update); Defra / EPA emission factor databases',
    },

    auditTrail: {
      createdDate: '2025-03-15',
      lastModified: '2026-03-17',
      changeLog: [
        { date: '2025-03-15', change: 'Initial Scope 3 tracker with spend-based methodology for 8 upstream categories' },
        { date: '2025-09-01', change: 'Added activity-based and supplier-specific methodologies; hybrid toggle per supplier' },
        { date: '2026-01-10', change: 'Expanded to 120 companies; 200 suppliers per company; engagement pipeline' },
        { date: '2026-03-17', change: 'Sprint AP; added hotspot matrix, methodology comparison, reduction scenario builder' },
      ],
      regulatoryAlignmentNotes: 'GHG Protocol Corporate Value Chain (Scope 3) Standard. PCAF Scope 3 guidance for financial institutions (Category 15). CSRD ESRS E1 requires Scope 3 disclosure.',
      dataLineageCertification: 'Supplier emissions from CDP supply chain programme. Spend data from procurement systems. Emission factors from Defra 2024 / EPA GHG Hub.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-008: CII Rating Calculator (Maritime)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-008',
    engineName: 'CII Rating Calculator (Maritime IMO)',
    domain: 'Maritime & Shipping Compliance',
    moduleId: 'EP-S3',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'IMO MEPC.353(78) — Carbon Intensity Indicator',
      version: 'MEPC.353(78) (2022), MEPC.364(79) correction factors',
      section: 'EEXI reference line and CII grade boundaries',
      url: 'https://www.imo.org/en/OurWork/Environment/Pages/CII.aspx',
    },

    calculationLogic: {
      formula: 'AER = CO2_annual / (DWT * Distance); CII_grade = gradeFromAER(AER, vesselType, DWT, year)',
      variables: [
        { name: 'annualEmissions', type: 'number', role: 'input', unit: 'tCO2', description: 'Total annual CO2 emissions for vessel' },
        { name: 'dwt', type: 'number', role: 'input', unit: 'tonnes', description: 'Deadweight tonnage (20K-200K range)' },
        { name: 'aer', type: 'number', role: 'output', unit: 'gCO2/(dwt*nm)', description: 'Annual Efficiency Ratio: seeded as 3 + gradeIdx*2 + random variance' },
        { name: 'ciiGrade', type: 'enum', role: 'output', values: ['A', 'B', 'C', 'D', 'E'], description: 'CII rating grade from A (best) to E (worst)' },
        { name: 'eexiCompliant', type: 'boolean', role: 'output', description: 'Energy Efficiency Existing Ship Index compliance status' },
        { name: 'fuelType', type: 'enum', role: 'input', values: ['HFO', 'VLSFO', 'MGO', 'LNG', 'Methanol'], description: 'Primary fuel type' },
      ],
      constants: [
        { name: 'CII_GRADES', values: ['A', 'B', 'C', 'D', 'E'], description: 'Five-grade scale; A-C compliant, D-E require corrective action' },
        { name: 'SHIP_TYPES', values: ['Bulk Carrier', 'Container', 'Tanker', 'LNG Carrier', 'Car Carrier', 'Cruise', 'RoRo', 'Offshore'], description: '8 vessel types with type-specific grade boundaries' },
        { name: 'IMO_PATHWAY', description: '2020-2050 trajectory: ambition path (100->0), well-below-2C path, BAU path' },
        { name: 'FLEET_SIZE', value: 150, description: '150 vessels across 20 shipping companies' },
        { name: 'ALTERNATIVE_FUELS', count: 10, description: 'LNG, Methanol, Ammonia, Green H2, Biofuel, Wind Assist, Nuclear, Battery, E-Methanol, Synthetic Diesel' },
      ],
      aggregation: 'Fleet average CII = mean of vessel grades (A=5, B=4, C=3, D=2, E=1). Compliance rate = % vessels graded A-C.',
      boundaryConditions: 'CII history tracked quarterly across 12 quarters (Q1-23 to Q4-25). Grade drift modeled via: base + sr*1.5 - 0.5. EEXI compliance independent of CII.',
      estimationPathway: 'Vessels without AMS data use fuel consumption records + emission factors (3.114 tCO2/t HFO, 3.206 tCO2/t VLSFO, 2.750 tCO2/t LNG).',
    },

    dataInputs: [
      { field: 'annualEmissions', tag: 'vessel.annualEmissions', availabilityTier: 'T1', sourceModule: 'IMO DCS / MRV reports' },
      { field: 'dwt', tag: 'vessel.dwt', availabilityTier: 'T1', sourceModule: 'Class society records' },
      { field: 'fuelType', tag: 'vessel.fuelType', availabilityTier: 'T1', sourceModule: 'Bunker delivery notes' },
      { field: 'voyages', tag: 'vessel.voyages', availabilityTier: 'T1', sourceModule: 'AIS tracking / voyage logs' },
    ],

    dataOutputs: [
      { field: 'ciiGrade', unit: 'A-E', description: 'Annual CII rating per vessel', downstreamModules: ['Poseidon Principles finance tab', 'EP-S3-MaritimeHub'] },
      { field: 'aer', unit: 'gCO2/(dwt*nm)', description: 'Annual Efficiency Ratio', downstreamModules: ['IMO DCS reporting'] },
      { field: 'fleetComplianceRate', unit: '%', description: 'Percentage of fleet rated A-C', downstreamModules: ['Poseidon Principles loan covenants'] },
      { field: 'retrofitROI', unit: 'USD / % CO2 reduction', description: 'Cost-effectiveness of retrofits', downstreamModules: ['Alternative fuel explorer'] },
    ],

    crossDomainUtility: [
      { domain: 'Ship Finance', useCase: 'Poseidon Principles loan covenant monitoring (CII grade thresholds)', outputFieldUsed: 'ciiGrade' },
      { domain: 'Regulatory Compliance', useCase: 'IMO 2023 CII annual reporting obligation', outputFieldUsed: 'aer' },
      { domain: 'Fleet Transition Planning', useCase: 'Retrofit vs newbuild investment analysis', outputFieldUsed: 'retrofitROI' },
    ],

    validationMetadata: {
      shadowModel: 'IMO MEPC CII reference calculator',
      acceptanceThreshold: '< 1 grade deviation on 95% of vessels; exact match on AER to 2 decimal places',
      factorVersionLock: 'MEPC.353(78) grade boundaries; MEPC.364(79) correction factors (2024 vintage)',
    },

    auditTrail: {
      createdDate: '2025-02-20',
      lastModified: '2026-03-17',
      changeLog: [
        { date: '2025-02-20', change: 'Initial CII calculator with 50 vessels, 3 ship types' },
        { date: '2025-07-01', change: 'Expanded to 150 vessels, 8 ship types, 20 companies; added CII quarterly history' },
        { date: '2025-12-15', change: 'Added IMO pathway tracker, alternative fuel explorer (10 fuels), port readiness' },
        { date: '2026-03-17', change: 'Added Poseidon Principles tab; 20 shipping loans with covenant monitoring and trajectory' },
      ],
      regulatoryAlignmentNotes: 'IMO MEPC.353(78) CII framework (2022). MEPC.364(79) correction factors. EU FuelEU Maritime (2025). Poseidon Principles v4 (2024).',
      dataLineageCertification: 'Vessel AER from IMO DCS reports. Fleet data from class societies (DNV, Lloyds, BV, ClassNK, ABS). Fuel prices from Platts bunker indices.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-009: Avoided Emissions (Scope 4)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-009',
    engineName: 'Avoided Emissions Calculator (Scope 4)',
    domain: 'Impact Measurement',
    moduleId: 'EP-V4',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'WRI/WBCSD Avoided Emissions Guidance; Project Frame Protocol',
      version: 'WRI (2019); ICF Comparative Assessment; Project Frame v1.0 (2023)',
      section: 'Comparative / baseline methodology for product-level avoided emissions',
      url: 'https://www.wri.org/research/estimating-and-reporting-avoided-emissions',
    },

    calculationLogic: {
      formula: 'grossAvoided = unitsSold * (baselineEF - productEF) / 1e6; netAvoided = grossAvoided * (attribution/100) * (1 - rebound/100); ratio = netAvoided / companyEmitted',
      variables: [
        { name: 'unitsSold', type: 'number', role: 'input', description: 'Number of product units sold in reporting period (range: 1K-500K)' },
        { name: 'baselineEF', type: 'number', role: 'input', unit: 'tCO2e/unit', description: 'Baseline emission factor for conventional alternative (0.4-1.2)' },
        { name: 'productEF', type: 'number', role: 'input', unit: 'tCO2e/unit', description: 'Product emission factor for the company product (0.05-0.35)' },
        { name: 'attribution', type: 'number', role: 'config', unit: '%', description: 'Attribution factor: what share of avoidance is attributable (slider 0-100%, default 80%)' },
        { name: 'rebound', type: 'number', role: 'config', unit: '%', description: 'Rebound effect adjustment: increased consumption offsetting savings (slider 0-30%, default 10%)' },
        { name: 'grossAvoided', type: 'number', role: 'intermediate', unit: 'MtCO2e', description: 'Gross avoided before attribution and rebound' },
        { name: 'netAvoided', type: 'number', role: 'output', unit: 'MtCO2e', description: 'Net avoided emissions after adjustments' },
        { name: 'ratio', type: 'number', role: 'output', unit: 'ratio', description: 'Avoided-to-emitted ratio: netAvoided / company own emissions' },
      ],
      constants: [
        { name: 'CATEGORIES', count: 10, description: 'Renewable Energy, EVs, Plant-Based Food, Insulation, LED Lighting, Teleconferencing, Recycling Tech, Water Purification, Precision Agriculture, Carbon Capture' },
        { name: 'METHODOLOGIES', count: 8, description: 'WRI/WBCSD, ICF, Project Frame, GHG Protocol Scope 4, ISO 14064-2, Gold Standard, SBTi Beyond Value Chain, Custom Internal' },
        { name: 'CREDIBILITY_TIERS', values: ['High', 'Medium', 'Low', 'Unverified'], description: 'Four-tier credibility classification' },
        { name: 'CREDIBILITY_CRITERIA', count: 8, description: 'Baseline Transparency, Additionality, Conservative Assumptions, Third-Party Verification, No Double-Counting, Temporal Boundaries, Geographic Scope, Rebound Adjustment (each scored 0-3)' },
        { name: 'COMPANY_UNIVERSE', value: 120, description: '120 companies across 15 sectors with product-level data' },
      ],
      aggregation: 'Portfolio total: sum of netAvoided across all companies. Sector donut: avoided emissions grouped by sector. Tier distribution: count by credibility tier.',
      boundaryConditions: 'Ratio can exceed 1.0 (net-positive company). Gross avoided can be negative if productEF > baselineEF (flagged as red). Attribution and rebound sliders allow sensitivity analysis.',
      estimationPathway: 'Companies scored on 8 criteria (0=Missing, 1=Weak, 2=Adequate, 3=Strong). Red flags: any criterion scoring 0 or tier=Unverified.',
    },

    dataInputs: [
      { field: 'unitsSold', tag: 'company.unitsSold', availabilityTier: 'T2', sourceModule: 'Company annual reports' },
      { field: 'baselineEF', tag: 'product.baselineEF', availabilityTier: 'T2', sourceModule: 'LCA databases / IEA / IPCC' },
      { field: 'productEF', tag: 'product.productEF', availabilityTier: 'T2', sourceModule: 'Product LCA / company disclosure' },
      { field: 'emitted', tag: 'company.emitted', availabilityTier: 'T2', sourceModule: 'CDP / company Scope 1+2 disclosure' },
    ],

    dataOutputs: [
      { field: 'netAvoided', unit: 'MtCO2e', description: 'Net avoided emissions after attribution and rebound', downstreamModules: ['EP-AH3-IssbDisclosure', 'ImpactReporting'] },
      { field: 'avoidedToEmittedRatio', unit: 'ratio', description: 'Net-positive indicator: avoided / own emissions', downstreamModules: ['EP-AF5-EsgFactorAlpha'] },
      { field: 'credibilityScore', unit: '0-24 total', description: 'Sum of 8 criteria scores (each 0-3)', downstreamModules: ['EP-AK5-GreenwashingDetector'] },
    ],

    crossDomainUtility: [
      { domain: 'Impact Investing', useCase: 'Net-positive company identification for impact funds', outputFieldUsed: 'avoidedToEmittedRatio' },
      { domain: 'Greenwashing Detection', useCase: 'Credibility audit of avoided emissions claims', outputFieldUsed: 'credibilityScore' },
      { domain: 'ISSB Disclosure', useCase: 'Climate-related opportunities — avoided emissions metric', outputFieldUsed: 'netAvoided' },
    ],

    validationMetadata: {
      shadowModel: 'Project Frame Protocol reference methodology',
      acceptanceThreshold: '< 10% deviation on gross avoided; credibility tier matches manual assessment in 90% of cases',
      factorVersionLock: 'WRI Avoided Emissions guidance (2019); Project Frame v1.0 (2023); baseline EFs from IEA WEO 2024',
    },

    auditTrail: {
      createdDate: '2025-04-10',
      lastModified: '2026-03-17',
      changeLog: [
        { date: '2025-04-10', change: 'Initial avoided emissions calculator with 30 companies, single methodology' },
        { date: '2025-09-20', change: 'Expanded to 120 companies; added 8 methodologies; credibility framework' },
        { date: '2025-12-01', change: 'Added portfolio view, sector donut, 12-quarter trend per company' },
        { date: '2026-03-17', change: 'Added credibility scan, 8-criteria scoring, red flag detection, CSV export for verification audit' },
      ],
      regulatoryAlignmentNotes: 'WRI/WBCSD Avoided Emissions guidance (2019). Project Frame Protocol v1.0 (2023). SBTi Beyond Value Chain Mitigation. Not yet covered by mandatory disclosure frameworks.',
      dataLineageCertification: 'Baseline EFs from IEA WEO 2024 and IPCC AR6. Product EFs from company LCA reports. Verification status from DNV, BV, SGS, TUV certificates.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-010: Climate-Adjusted PD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    engineId: 'E-010',
    engineName: 'Climate-Adjusted Probability of Default',
    domain: 'Climate Credit Risk',
    moduleId: 'EP-CR1',
    version: '2.0.0',
    status: 'production',

    governingMethodology: {
      standard: 'IFRS 9 Financial Instruments — Climate Overlay; ECB Guide on Climate-Related and Environmental Risks',
      version: 'IFRS 9 (2018) with climate overlay per ECB/EBA guidance (2024)',
      section: 'Forward-looking ECL: climate-adjusted PD and staging',
      url: 'https://www.ecb.europa.eu/pub/pdf/other/ecb.guide_climate-related_and_environmental_risks.en.pdf',
    },

    calculationLogic: {
      formula: 'Transition: pdUplift_bps = carbonIntensity * carbonPrice * 0.018; Physical: eclOverlay = sum(weightedRiskScore / 5 * exposure * 0.004); Climate_PD = basePD + transitionUplift + physicalUplift',
      variables: [
        { name: 'carbonIntensity', type: 'number', role: 'input', unit: 'tCO2e/EUR M revenue', description: 'Borrower carbon intensity (ci field: 0.21-1.76 range)' },
        { name: 'carbonPrice', type: 'number', role: 'config', unit: 'GBP/tCO2', description: 'Shadow carbon price: presets at 41, 130, 250, 800; or custom slider' },
        { name: 'pdUplift', type: 'number', role: 'output', unit: 'bps', description: 'Transition risk PD uplift: ci * carbonPrice * 0.018' },
        { name: 'ebitdaImpact', type: 'number', role: 'intermediate', unit: '%', description: 'Carbon cost as % of EBITDA: (emissions * carbonPrice / 1000) / ebitda * 100' },
        { name: 'physicalRiskScores', type: 'array[8]', role: 'input', unit: '1-5 score', description: 'Scores for Flood, Wildfire, Cyclone, Hail, Heat Stress, Sea Level Rise, Drought, Permafrost' },
        { name: 'phyWeights', type: 'object', role: 'config', description: 'Risk-type weights: Flood 0.18, Wildfire 0.12, Cyclone 0.14, Hail 0.08, Heat Stress 0.15, Sea Level Rise 0.16, Drought 0.12, Permafrost 0.05' },
        { name: 'eclOverlay', type: 'number', role: 'output', unit: 'GBP millions', description: 'Physical risk ECL overlay: sum(weighted_score/5 * exposure * 0.004)' },
        { name: 'exposure', type: 'number', role: 'input', unit: 'GBP millions', description: 'Borrower exposure at default' },
        { name: 'flag', type: 'enum', role: 'output', values: ['Red', 'Amber', 'Green'], description: 'RAG flag: Red if EBITDA impact > 40%, Amber > 20%, else Green' },
      ],
      constants: [
        { name: 'CARBON_PRESETS', values: [{ label: 'Current UK ETS', price: 41 }, { label: 'Central 2030', price: 130 }, { label: 'High 2030', price: 250 }, { label: 'Delayed Spike 2035', price: 800 }], description: 'Carbon price scenario presets' },
        { name: 'SENSITIVITY_FACTOR', value: 0.018, description: 'PD sensitivity to carbon intensity * price: converts tCO2/EUR M * price to bps' },
        { name: 'PHYSICAL_RISK_TYPES', count: 8, description: 'Flood, Wildfire, Cyclone, Hail, Heat Stress, Sea Level Rise, Drought, Permafrost' },
        { name: 'BASE_ECL', values: { s1: 0.18, s2: 1.42, s3: 8.65 }, unit: 'GBP M', description: 'Baseline ECL by IFRS 9 stage' },
        { name: 'TRANSITION_BORROWERS', value: 30, description: '30 borrowers across Power, Cement, Steel, Aviation, Oil&Gas, Chemicals, Auto, Utilities, etc.' },
        { name: 'PHYSICAL_BORROWERS', value: 54, description: '54 physical risk borrowers across global geographies' },
        { name: 'EPC_BANDS', values: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], description: 'Energy Performance Certificate bands for stranded asset analysis' },
        { name: 'DEFAULT_HAIRCUTS', values: { A: 0, B: 0, C: 2, D: 6, E: 14, F: 22, G: 30 }, unit: '%', description: 'Collateral value haircut by EPC band under MEES tightening' },
      ],
      aggregation: 'Portfolio total transition cost = sum(emissions_i * carbonPrice / 1000). Portfolio ECL overlay = sum of borrower-level physical ECL overlays. Stranded asset timeline: cumulative value at risk 2024-2050.',
      boundaryConditions: 'Transition uplift flagged at > 300 bps (visual red highlight). EBITDA impact > 40% triggers Red flag. Sector rollup aggregates by sector. MEES scenarios: Current Law, Proposed 2028 EPC C, Conservative EPC B by 2030.',
      estimationPathway: 'Borrowers without emissions data: sector-average carbon intensity applied. Missing EPC ratings: EPC D assumed as conservative default.',
    },

    dataInputs: [
      { field: 'carbonIntensity', tag: 'borrower.ci', availabilityTier: 'T2', sourceModule: 'CDP / company disclosure / sectorBenchmarks' },
      { field: 'emissions', tag: 'borrower.emissions', availabilityTier: 'T2', sourceModule: 'CDP / annual reports' },
      { field: 'ebitda', tag: 'borrower.ebitda', availabilityTier: 'T1', sourceModule: 'Financial statements' },
      { field: 'physicalRiskScores', tag: 'borrower.scores', availabilityTier: 'T2', sourceModule: 'Physical risk model / XDI / Jupiter' },
      { field: 'epcBand', tag: 'property.epc', availabilityTier: 'T2', sourceModule: 'EPC register / CRREM' },
      { field: 'exposure', tag: 'borrower.exposure', availabilityTier: 'T1', sourceModule: 'portfolios_pg' },
    ],

    dataOutputs: [
      { field: 'pdUplift', unit: 'bps', description: 'Transition risk PD uplift per borrower', downstreamModules: ['E-003-ClimateVaR', 'EP-AJ6-ClimateBankingHub'] },
      { field: 'eclOverlay', unit: 'GBP M', description: 'Physical risk ECL overlay for IFRS 9 staging', downstreamModules: ['EP-AH1-CsrdEsrsAutomation', 'EP-AH5-SecClimateRule'] },
      { field: 'strandedAssetExposure', unit: 'GBP M', description: 'Collateral value at risk from MEES / EPC tightening', downstreamModules: ['EP-AH6-DisclosureHub'] },
      { field: 'ragFlag', unit: 'Red/Amber/Green', description: 'Borrower-level climate credit risk RAG status', downstreamModules: ['EP-AJ2-ClimateStressTest'] },
    ],

    crossDomainUtility: [
      { domain: 'IFRS 9 Provisioning', useCase: 'Climate overlay on ECL for management adjustment', outputFieldUsed: 'eclOverlay' },
      { domain: 'Regulatory Stress Testing', useCase: 'ECB/BoE climate stress test PD migration input', outputFieldUsed: 'pdUplift' },
      { domain: 'Real Estate Lending', useCase: 'MEES stranded asset risk in mortgage/CRE portfolios', outputFieldUsed: 'strandedAssetExposure' },
      { domain: 'Credit Approval', useCase: 'RAG flag integration into credit decisioning workflow', outputFieldUsed: 'ragFlag' },
    ],

    validationMetadata: {
      shadowModel: 'ECB bottom-up climate stress test reference PD migration (2024)',
      acceptanceThreshold: '< 20 bps deviation on transition PD uplift; < 5% on physical ECL overlay',
      factorVersionLock: 'IFRS 9 (2018); ECB climate risk guide (2024); EPC haircuts per MEES 2028 proposals',
    },

    auditTrail: {
      createdDate: '2025-05-01',
      lastModified: '2026-03-17',
      changeLog: [
        { date: '2025-05-01', change: 'Initial transition risk PD uplift model with 10 sectors, 4 carbon price presets' },
        { date: '2025-08-15', change: 'Added physical risk module with 8 peril types and 54 borrowers; weighted scoring' },
        { date: '2025-11-01', change: 'Added IFRS 9 staging overlay (Stage 1/2/3 ECL); MEES stranded asset module; EPC haircuts' },
        { date: '2026-03-17', change: 'Expanded to 30 transition borrowers; 20 CRE properties; disclosure checklist (15 items); sector rollup view' },
      ],
      regulatoryAlignmentNotes: 'IFRS 9 climate overlay per ECB expectations (2024). EBA Pillar 3 ESG Templates 1-4. BCBS 530 climate risk principles. UK MEES 2028 proposals for EPC minimum C.',
      dataLineageCertification: 'Carbon intensity from CDP/annual reports. Physical risk scores from peril models (XDI, Jupiter, internal). EPC data from national registers (UK EPC, FR DPE, NL RVO).',
    },
  },
];

/**
 * Engine cross-reference index — maps engine outputs to downstream consumers
 * for rapid dependency tracing during model governance reviews.
 */
export const ENGINE_DEPENDENCY_GRAPH = {
  'E-001': { produces: ['financedEmissions', 'attrFactor', 'waci', 'portfolioFE'], consumedBy: ['E-002', 'E-003', 'E-006', 'E-007'] },
  'E-002': { produces: ['portfolioTemp', 'holdingTemp', 'temperatureGap'], consumedBy: ['E-003'] },
  'E-003': { produces: ['stressedPD', 'eclUplift', 'cvar', 'cet1Impact'], consumedBy: ['E-010'] },
  'E-004': { produces: ['gar', 'alignedExposure', 'garByObjective'], consumedBy: [] },
  'E-005': { produces: ['consensus', 'divergence', 'correlationMatrix'], consumedBy: [] },
  'E-006': { produces: ['waci', 'holdingIntensity'], consumedBy: ['E-001'] },
  'E-007': { produces: ['categoryEmissions', 'totalUpstream', 'hotspotMatrix'], consumedBy: ['E-001'] },
  'E-008': { produces: ['ciiGrade', 'aer', 'fleetComplianceRate', 'retrofitROI'], consumedBy: [] },
  'E-009': { produces: ['netAvoided', 'avoidedToEmittedRatio', 'credibilityScore'], consumedBy: [] },
  'E-010': { produces: ['pdUplift', 'eclOverlay', 'strandedAssetExposure', 'ragFlag'], consumedBy: ['E-003'] },
};

/**
 * Regulatory coverage matrix — which regulations each engine supports.
 */
export const REGULATORY_COVERAGE = [
  { regulation: 'SFDR PAI (Table 1)',        engines: ['E-001', 'E-006', 'E-007'] },
  { regulation: 'EU Taxonomy (Art. 449a)',    engines: ['E-004'] },
  { regulation: 'CSRD ESRS E1',              engines: ['E-001', 'E-006', 'E-007', 'E-009'] },
  { regulation: 'ECB Climate Stress Test',    engines: ['E-003', 'E-010'] },
  { regulation: 'BoE CBES',                  engines: ['E-003', 'E-010'] },
  { regulation: 'EBA Pillar 3 ESG',          engines: ['E-003', 'E-004', 'E-010'] },
  { regulation: 'TCFD Recommendations',       engines: ['E-001', 'E-002', 'E-006'] },
  { regulation: 'ISSB IFRS S2',              engines: ['E-001', 'E-002', 'E-003', 'E-009'] },
  { regulation: 'IFRS 9 Climate Overlay',     engines: ['E-010'] },
  { regulation: 'IMO MEPC CII',              engines: ['E-008'] },
  { regulation: 'PCAF Standard v2',           engines: ['E-001', 'E-006'] },
  { regulation: 'SBTi Framework',             engines: ['E-002'] },
  { regulation: 'GHG Protocol Scope 3',       engines: ['E-007'] },
  { regulation: 'Poseidon Principles',        engines: ['E-008'] },
  { regulation: 'WRI Avoided Emissions',      engines: ['E-009'] },
  { regulation: 'UK MEES',                    engines: ['E-010'] },
  { regulation: 'BCBS 530',                   engines: ['E-003', 'E-010'] },
  { regulation: 'SEC Climate Rule',           engines: ['E-001', 'E-003'] },
];

export default ENGINE_IDENTITY_CARDS;
