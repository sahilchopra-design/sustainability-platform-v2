/**
 * Consolidated Reference Data — Single Source for All Modules
 *
 * All values are real/published where possible. Source attribution in comments.
 * This file consolidates constants previously scattered across multiple files
 * and adds new reference datasets required by Sprint AH+ modules.
 *
 * Sources indexed:
 *   [1] UK DEFRA GHG Conversion Factors 2023 (DESNZ)
 *   [2] EU ETS / UK ETS / RGGI / California market data (EEA, GOV.UK, RGGI Inc., CARB)
 *   [3] IPCC AR6 WG1 Chapter 7, Table 7.SM.7 (2021)
 *   [4] Ember Global Electricity Review 2023 (CC BY 4.0)
 *   [5] EU CSRD / Taxonomy Regulation / SFDR RTS
 *   [6] PCAF Global GHG Standard 2nd Edition (2022)
 *   [7] NGFS Phase IV Scenarios Technical Documentation V4.2 (Nov 2023)
 *   [8] MSCI / S&P Trucost / SBTi sector pathways
 *   [9] IPCC AR6 WG3 (2022) — carbon budgets
 *  [10] EU Taxonomy Climate Delegated Act (2021/2139) + Env Delegated Act (2023/2486)
 *  [11] RepRisk AG methodology documentation
 *  [12] IMO MEPC.352(78) — CII reference lines and reduction factors
 *  [13] ICAO CORSIA — Annex 16 Vol IV, 1st Edition (2018, updated 2022)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EMISSION_FACTORS — DEFRA 2023 conversion factors [1]
// ═══════════════════════════════════════════════════════════════════════════════

export const EMISSION_FACTORS = {
  // ── Transport (gCO2e per passenger-km) ──
  transport: {
    petrolCar:        { factor: 170.5, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    dieselCar:        { factor: 158.2, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    hybridCar:        { factor: 119.8, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    electricCar:      { factor: 46.5,  unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'UK grid 2023' },
    motorbike:        { factor: 103.3, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    bus:              { factor: 82.0,  unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    taxi:             { factor: 149.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    trainNational:    { factor: 35.7,  unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    trainInternational:{ factor: 6.0,  unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'Eurostar' },
    metro:            { factor: 28.0,  unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    ferryFoot:        { factor: 187.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    ferryCar:         { factor: 129.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'per vehicle-km' },
    shortHaulEconomy: { factor: 255.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    longHaulEconomy:  { factor: 195.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    longHaulBusiness: { factor: 428.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    longHaulFirst:    { factor: 586.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
  },

  // ── Stationary energy (kgCO2e per kWh or per unit) ──
  energy: {
    naturalGas_kWh:   { factor: 0.18385, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    diesel_kWh:       { factor: 0.26731, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    coal_kWh:         { factor: 0.34109, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    lpg_kWh:          { factor: 0.21443, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    fuelOil_kWh:      { factor: 0.26786, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    biogas_kWh:       { factor: 0.00023, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    naturalGas_m3:    { factor: 2.04249, unit: 'kgCO2e/m3',  source: 'DEFRA 2023' },
    diesel_litre:     { factor: 2.70570, unit: 'kgCO2e/l',   source: 'DEFRA 2023' },
    petrol_litre:     { factor: 2.31480, unit: 'kgCO2e/l',   source: 'DEFRA 2023' },
  },

  // ── Materials / industrial (kgCO2e per kg or tonne) ──
  materials: {
    steel_primary:     { factor: 1850,  unit: 'kgCO2e/t', source: 'DEFRA 2023 / worldsteel' },
    steel_recycled:    { factor: 410,   unit: 'kgCO2e/t', source: 'DEFRA 2023 / worldsteel' },
    aluminium_primary: { factor: 8400,  unit: 'kgCO2e/t', source: 'DEFRA 2023 / IAI' },
    aluminium_recycled:{ factor: 520,   unit: 'kgCO2e/t', source: 'DEFRA 2023 / IAI' },
    cement_portland:   { factor: 830,   unit: 'kgCO2e/t', source: 'DEFRA 2023 / GCCA' },
    concrete_ready:    { factor: 132,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    glass_flat:        { factor: 910,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    paper_virgin:      { factor: 920,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    paper_recycled:    { factor: 610,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    plastics_average:  { factor: 3100,  unit: 'kgCO2e/t', source: 'DEFRA 2023' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CARBON_PRICES — Compliance & scenario carbon prices [2][7]
// ═══════════════════════════════════════════════════════════════════════════════

export const CARBON_PRICES = {
  // Compliance markets — latest annual averages (EUR or USD per tCO2e)
  compliance: {
    EU_ETS:     { price: 64.8, currency: 'EUR', year: 2024, source: 'EEA confirmed avg' },
    UK_ETS:     { price: 41.84, currency: 'GBP', year: 2025, source: 'GOV.UK civil penalty price' },
    RGGI:       { price: 14.88, currency: 'USD', year: 2024, source: 'RGGI Inc Q4 2024 auction' },
    California: { price: 37.02, currency: 'USD', year: 2024, source: 'CARB Q4 2024 auction settlement' },
    Korea_ETS:  { price: 8.50, currency: 'USD', year: 2024, source: 'KRX avg 2024' },
    China_ETS:  { price: 9.30, currency: 'USD', year: 2024, source: 'Shanghai Environment Exchange avg' },
    NZ_ETS:     { price: 47.0, currency: 'NZD', year: 2024, source: 'NZX Carbon quarterly avg' },
  },

  // NGFS scenario shadow carbon prices (USD/tCO2e) [7]
  ngfs_2030: {
    net_zero_2050:         200,  // NGFS Phase IV — orderly
    below_2c:              130,  // NGFS Phase IV — orderly
    divergent_net_zero:    250,  // NGFS Phase IV — disorderly
    delayed_transition:     35,  // NGFS Phase IV — disorderly (low until 2030)
    nationally_determined:  25,  // NGFS Phase IV — hot house
    current_policies:       15,  // NGFS Phase IV — hot house
  },
  ngfs_2050: {
    net_zero_2050:         725,
    below_2c:              475,
    divergent_net_zero:    800,
    delayed_transition:    600,
    nationally_determined:  50,
    current_policies:       25,
  },

  // Voluntary carbon market — average credit prices (USD/tCO2e)
  voluntary: {
    nature_based:  { price: 8.50,  year: 2024, source: 'Ecosystem Marketplace SoVCM 2024' },
    tech_removal:  { price: 125.0, year: 2024, source: 'CDR.fyi weighted avg' },
    renewable_energy: { price: 3.20, year: 2024, source: 'Ecosystem Marketplace' },
    cookstoves:    { price: 5.80,  year: 2024, source: 'BeZero Carbon' },
    redd_plus:     { price: 6.40,  year: 2024, source: 'Ecosystem Marketplace' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GWP_VALUES — IPCC AR6 GWP-100 [3]
// ═══════════════════════════════════════════════════════════════════════════════

export const GWP_VALUES = {
  CO2:          1,
  CH4_fossil:   29.8,   // AR6 (up from AR5 = 28)
  CH4_biogenic: 27.9,   // AR6
  N2O:          273,    // AR6 (up from AR5 = 265)
  SF6:          25200,  // AR6
  NF3:          17400,  // AR6
  // HFCs
  HFC_23:       14600,
  HFC_32:       771,
  HFC_125:      3740,
  HFC_134a:     1526,
  HFC_143a:     5810,
  HFC_152a:     164,
  HFC_227ea:    3600,
  HFC_236fa:    8690,
  HFC_245fa:    962,
  HFC_365mfc:   914,
  HFC_4310mee:  1650,
  // PFCs
  CF4:          7380,
  C2F6:         12400,
  C3F8:         9290,
  c_C4F8:       10200,
  // 20-year GWP for comparison (CH4 is much higher on short horizon)
  CH4_fossil_GWP20: 82.5,
  CH4_biogenic_GWP20: 80.8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. GRID_INTENSITY — 30 countries gCO2/kWh (Ember 2023) [4]
// ═══════════════════════════════════════════════════════════════════════════════

export const GRID_INTENSITY = [
  // Very Low Carbon (< 100)
  { country: 'Iceland',       iso2: 'IS', gCO2_kWh: 13,  primary: 'Geothermal + Hydro' },
  { country: 'Norway',        iso2: 'NO', gCO2_kWh: 26,  primary: 'Hydro' },
  { country: 'Sweden',        iso2: 'SE', gCO2_kWh: 41,  primary: 'Nuclear + Hydro' },
  { country: 'Switzerland',   iso2: 'CH', gCO2_kWh: 46,  primary: 'Hydro + Nuclear' },
  { country: 'France',        iso2: 'FR', gCO2_kWh: 56,  primary: 'Nuclear' },
  { country: 'Brazil',        iso2: 'BR', gCO2_kWh: 85,  primary: 'Hydro' },
  // Low Carbon (100-200)
  { country: 'New Zealand',   iso2: 'NZ', gCO2_kWh: 109, primary: 'Hydro + Geothermal' },
  { country: 'Canada',        iso2: 'CA', gCO2_kWh: 120, primary: 'Hydro + Nuclear' },
  { country: 'Denmark',       iso2: 'DK', gCO2_kWh: 145, primary: 'Wind' },
  { country: 'Finland',       iso2: 'FI', gCO2_kWh: 151, primary: 'Nuclear + Hydro + Wind' },
  { country: 'Spain',         iso2: 'ES', gCO2_kWh: 160, primary: 'Wind + Solar + Nuclear' },
  { country: 'Belgium',       iso2: 'BE', gCO2_kWh: 167, primary: 'Nuclear + Gas' },
  // Medium Carbon (200-400)
  { country: 'UK',            iso2: 'GB', gCO2_kWh: 238, primary: 'Gas + Wind + Nuclear' },
  { country: 'Italy',         iso2: 'IT', gCO2_kWh: 274, primary: 'Gas + Solar + Hydro' },
  { country: 'Ireland',       iso2: 'IE', gCO2_kWh: 262, primary: 'Gas + Wind' },
  { country: 'Netherlands',   iso2: 'NL', gCO2_kWh: 316, primary: 'Gas + Wind' },
  { country: 'Germany',       iso2: 'DE', gCO2_kWh: 380, primary: 'Wind + Coal + Gas' },
  { country: 'USA',           iso2: 'US', gCO2_kWh: 376, primary: 'Gas + Coal + Nuclear' },
  { country: 'Mexico',        iso2: 'MX', gCO2_kWh: 398, primary: 'Gas + Oil' },
  // Higher Carbon (400-550)
  { country: 'Singapore',     iso2: 'SG', gCO2_kWh: 418, primary: 'Natural Gas' },
  { country: 'South Korea',   iso2: 'KR', gCO2_kWh: 410, primary: 'Coal + Nuclear + Gas' },
  { country: 'Japan',         iso2: 'JP', gCO2_kWh: 453, primary: 'Gas + Coal' },
  { country: 'Australia',     iso2: 'AU', gCO2_kWh: 480, primary: 'Coal + Gas + Solar' },
  { country: 'Vietnam',       iso2: 'VN', gCO2_kWh: 485, primary: 'Coal + Hydro' },
  // High Carbon (> 550)
  { country: 'China',         iso2: 'CN', gCO2_kWh: 546, primary: 'Coal' },
  { country: 'India',         iso2: 'IN', gCO2_kWh: 623, primary: 'Coal' },
  { country: 'Indonesia',     iso2: 'ID', gCO2_kWh: 705, primary: 'Coal' },
  { country: 'Poland',        iso2: 'PL', gCO2_kWh: 680, primary: 'Coal' },
  { country: 'South Africa',  iso2: 'ZA', gCO2_kWh: 709, primary: 'Coal (Eskom)' },
  { country: 'Saudi Arabia',  iso2: 'SA', gCO2_kWh: 580, primary: 'Oil + Gas' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5. REGULATORY_THRESHOLDS — Key regulatory numbers [5]
// ═══════════════════════════════════════════════════════════════════════════════

export const REGULATORY_THRESHOLDS = {
  // EU CSRD
  csrd_large_employees: 500,           // Phase 1 (FY2024): >500 employees + listed/large PIE
  csrd_phase2_employees: 250,          // Phase 2 (FY2025): >250 employees
  csrd_phase2_revenue_eur: 50_000_000, // Phase 2: >EUR 50M revenue
  csrd_phase2_assets_eur: 25_000_000,  // Phase 2: >EUR 25M total assets
  csrd_sme_employees: 10,              // Phase 3 (FY2026): listed SMEs 10-250

  // EU Taxonomy — minimum safeguards
  taxonomy_dnsh_water_stress: 3.0,     // WRI Aqueduct baseline water stress threshold (high)
  taxonomy_pollution_bref: true,       // Must comply with BREF / IED best available techniques

  // SFDR PAI — Principal Adverse Impact thresholds (mandatory Table 1)
  sfdr_pai1_ghg_scope12: true,         // Mandatory: Scope 1+2 GHG emissions (tCO2e)
  sfdr_pai2_carbon_footprint: true,    // Mandatory: Carbon footprint (tCO2e/EUR M invested)
  sfdr_pai3_ghg_intensity: true,       // Mandatory: GHG intensity of investee companies
  sfdr_pai4_fossil_fuel_pct: true,     // Mandatory: Share of investee in fossil fuels
  sfdr_pai10_ungc_violations: true,    // Mandatory: UNGC / OECD violations
  sfdr_pai14_controversial_weapons: true, // Mandatory: Controversial weapons exposure

  // EU Taxonomy TSC — substantial contribution thresholds (Climate Delegated Act)
  taxonomy_power_generation_gCO2_kWh: 100,  // <100 gCO2/kWh for electricity generation
  taxonomy_vehicles_gCO2_km: 0,             // Zero direct (tailpipe) emissions for transport
  taxonomy_buildings_nzeb: true,             // Nearly-zero energy building standard
  taxonomy_cement_clinker_kgCO2_t: 722,     // <0.722 tCO2/t clinker for cement
  taxonomy_steel_eaf_tCO2_t: 0.283,         // <0.283 tCO2/t for EAF steel
  taxonomy_aluminium_tCO2_t: 1.514,         // <1.514 tCO2/t for primary aluminium
  taxonomy_hydrogen_kgCO2_kgH2: 3.0,        // <3.0 kgCO2e/kgH2 for low-carbon hydrogen

  // SEC Climate Rule (S7-10-22 / final rule March 2024)
  sec_large_accelerated_filer_assets: 700_000_000, // $700M public float
  sec_accelerated_filer_assets: 75_000_000,        // $75M public float
  sec_materiality_threshold_pct: 1,                // 1% of revenue/expense line item

  // UK SDR — anti-greenwashing
  uk_sdr_min_sustainable_pct: 70,   // Min 70% of assets in sustainable investments for labels
  uk_sdr_unexpected_threshold_pct: 30, // Investee qualitative threshold

  // BRSR Core (India SEBI)
  brsr_top_listed_count: 1000,       // Top 1000 by market cap must file BRSR
  brsr_assurance_top: 150,           // Top 150 need reasonable assurance from FY2024
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PCAF_DATA_QUALITY — DQS 1-5 definitions & scoring [6]
// ═══════════════════════════════════════════════════════════════════════════════

export const PCAF_DATA_QUALITY = [
  {
    score: 1,
    label: 'Audited GHG emissions',
    description: 'Verified reported emissions from the company (e.g., CDP verified, third-party assured)',
    method: 'Option 1 — Reported emissions',
    uncertainty: 'Low',
    weight: 1.0,
  },
  {
    score: 2,
    label: 'Unaudited GHG emissions',
    description: 'Reported but unverified emissions data directly from the company (e.g., BRSR, sustainability report)',
    method: 'Option 2 — Reported emissions (unverified)',
    uncertainty: 'Low-Medium',
    weight: 0.85,
  },
  {
    score: 3,
    label: 'Physical activity-based estimate',
    description: 'Emissions estimated from physical activity data (e.g., MWh consumed, fuel used) and emission factors',
    method: 'Option 3 — Physical activity data',
    uncertainty: 'Medium',
    weight: 0.65,
  },
  {
    score: 4,
    label: 'Economic activity-based estimate',
    description: 'Emissions estimated from economic data (e.g., revenue, assets) and sector-average emission factors',
    method: 'Option 4 — Economic activity data',
    uncertainty: 'Medium-High',
    weight: 0.45,
  },
  {
    score: 5,
    label: 'Sector average proxy',
    description: 'Emissions estimated using broad sector averages and asset values; no company-specific data',
    method: 'Option 5 — Estimated / proxy',
    uncertainty: 'High',
    weight: 0.25,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 7. NGFS_SCENARIOS — 6 Phase IV scenarios with key parameters [7]
// ═══════════════════════════════════════════════════════════════════════════════

export const NGFS_SCENARIOS = [
  {
    id: 'net_zero_2050',
    name: 'Net Zero 2050',
    category: 'Orderly',
    description: 'Immediate & smooth policy action to limit warming to 1.5C by 2100',
    carbonPrice2030_usd: 200,
    carbonPrice2050_usd: 725,
    peakWarming_c: 1.5,
    gdpImpact2050_pct: -2.5,    // % GDP loss relative to no-policy baseline
    renewableShare2050_pct: 75,
    fossilPhaseout: 'Coal by 2040, oil by 2050',
    stranded_assets_usd_tn: 12,
    color: '#16a34a',
  },
  {
    id: 'below_2c',
    name: 'Below 2\u00B0C',
    category: 'Orderly',
    description: 'Gradual policy tightening to limit warming to below 2C',
    carbonPrice2030_usd: 130,
    carbonPrice2050_usd: 475,
    peakWarming_c: 1.7,
    gdpImpact2050_pct: -1.8,
    renewableShare2050_pct: 65,
    fossilPhaseout: 'Coal by 2045',
    stranded_assets_usd_tn: 8,
    color: '#22c55e',
  },
  {
    id: 'divergent_net_zero',
    name: 'Divergent Net Zero',
    category: 'Disorderly',
    description: 'Aggressive but uncoordinated policies — higher short-term costs and disruption',
    carbonPrice2030_usd: 250,
    carbonPrice2050_usd: 800,
    peakWarming_c: 1.5,
    gdpImpact2050_pct: -4.0,
    renewableShare2050_pct: 70,
    fossilPhaseout: 'Uncoordinated — regional divergence',
    stranded_assets_usd_tn: 15,
    color: '#eab308',
  },
  {
    id: 'delayed_transition',
    name: 'Delayed Transition',
    category: 'Disorderly',
    description: 'Policies delayed until 2030, then aggressive ramp — high disruption',
    carbonPrice2030_usd: 35,
    carbonPrice2050_usd: 600,
    peakWarming_c: 1.8,
    gdpImpact2050_pct: -5.5,
    renewableShare2050_pct: 60,
    fossilPhaseout: 'Rapid post-2030 with economic shock',
    stranded_assets_usd_tn: 18,
    color: '#f97316',
  },
  {
    id: 'nationally_determined',
    name: 'Nationally Determined Contributions',
    category: 'Hot House',
    description: 'Only existing NDC pledges implemented — warming exceeds 2C',
    carbonPrice2030_usd: 25,
    carbonPrice2050_usd: 50,
    peakWarming_c: 2.5,
    gdpImpact2050_pct: -8.0,
    renewableShare2050_pct: 45,
    fossilPhaseout: 'Partial coal reduction only',
    stranded_assets_usd_tn: 4,
    color: '#ef4444',
  },
  {
    id: 'current_policies',
    name: 'Current Policies',
    category: 'Hot House',
    description: 'No new policies beyond those in force — highest physical risk',
    carbonPrice2030_usd: 15,
    carbonPrice2050_usd: 25,
    peakWarming_c: 3.0,
    gdpImpact2050_pct: -12.0,
    renewableShare2050_pct: 35,
    fossilPhaseout: 'None',
    stranded_assets_usd_tn: 2,
    color: '#dc2626',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 8. SECTOR_BENCHMARKS — 20 GICS sectors [8]
//    medianIntensity: tCO2e/$M revenue (Scope 1+2), Paris-aligned benchmark
// ═══════════════════════════════════════════════════════════════════════════════

export const SECTOR_BENCHMARKS = [
  { gics: '1010', sector: 'Energy',                    medianIntensity: 350, parisTarget2030: 195, sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '1510', sector: 'Materials',                 medianIntensity: 620, parisTarget2030: 340, sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '2010', sector: 'Capital Goods',             medianIntensity: 45,  parisTarget2030: 25,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '2020', sector: 'Commercial Services',       medianIntensity: 18,  parisTarget2030: 10,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '2030', sector: 'Transportation',            medianIntensity: 280, parisTarget2030: 155, sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '2510', sector: 'Automobiles & Components',  medianIntensity: 55,  parisTarget2030: 30,  sbtiMethod: 'SDA', decarbRate: 7.0 },
  { gics: '2520', sector: 'Consumer Durables',         medianIntensity: 35,  parisTarget2030: 19,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '2530', sector: 'Consumer Services',         medianIntensity: 28,  parisTarget2030: 15,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '2550', sector: 'Retailing',                 medianIntensity: 22,  parisTarget2030: 12,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '3010', sector: 'Food & Staples Retailing',  medianIntensity: 30,  parisTarget2030: 17,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '3020', sector: 'Food Beverage & Tobacco',   medianIntensity: 65,  parisTarget2030: 36,  sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '3030', sector: 'Household & Personal',      medianIntensity: 25,  parisTarget2030: 14,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '3510', sector: 'Health Care Equipment',     medianIntensity: 12,  parisTarget2030: 7,   sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '3520', sector: 'Pharmaceuticals & Biotech', medianIntensity: 15,  parisTarget2030: 8,   sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '4010', sector: 'Banks',                     medianIntensity: 4,   parisTarget2030: 2,   sbtiMethod: 'SDA', decarbRate: 4.2, note: 'Own operations only; excludes financed emissions' },
  { gics: '4020', sector: 'Financial Services',        medianIntensity: 5,   parisTarget2030: 3,   sbtiMethod: 'SDA', decarbRate: 4.2, note: 'Own operations only' },
  { gics: '4030', sector: 'Insurance',                 medianIntensity: 6,   parisTarget2030: 3,   sbtiMethod: 'SDA', decarbRate: 4.2, note: 'Own operations only' },
  { gics: '4510', sector: 'Software & Services',       medianIntensity: 8,   parisTarget2030: 4,   sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '5010', sector: 'Telecommunication Services',medianIntensity: 20,  parisTarget2030: 11,  sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '5510', sector: 'Utilities',                 medianIntensity: 980, parisTarget2030: 540, sbtiMethod: 'SDA', decarbRate: 7.0 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 9. TEMPERATURE_PATHWAYS — Carbon budgets from IPCC AR6 [9]
//    Remaining carbon budgets from 2020 (GtCO2) for different warming limits
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPERATURE_PATHWAYS = {
  // Source: IPCC AR6 WG3 Table SPM.2 (2022) — remaining from start of 2020
  budgets_GtCO2: {
    '1.5C_50pct':  500,   // 500 GtCO2 remaining for 50% chance of 1.5C
    '1.5C_67pct':  400,   // 400 GtCO2 for 67% chance
    '1.5C_83pct':  300,   // 300 GtCO2 for 83% chance
    '1.7C_50pct':  850,
    '1.7C_67pct':  700,
    '2.0C_50pct':  1350,
    '2.0C_67pct':  1150,
    '2.0C_83pct':  900,
  },
  // Current global annual emissions ~40 GtCO2 (2023)
  annual_global_emissions_2023_GtCO2: 40.9,
  // Years remaining at current rate
  years_remaining: {
    '1.5C_50pct': 12,   // ~500/40.9 = 12 years from 2020 => ~2032
    '1.5C_67pct': 10,
    '2.0C_50pct': 33,
    '2.0C_67pct': 28,
  },
  // Key milestones (IPCC AR6 SR1.5)
  milestones: {
    net_zero_co2_1_5c: 2050,   // Global net-zero CO2 by ~2050 for 1.5C
    net_zero_co2_2c: 2070,     // Global net-zero CO2 by ~2070 for 2C
    peak_emissions: 2025,       // Emissions must peak before 2025 for 1.5C
    halve_by_2030: true,        // -43% GHG by 2030 (vs 2019) for 1.5C
    methane_reduce_2030: 0.34,  // -34% CH4 by 2030 (vs 2020)
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. TAXONOMY_THRESHOLDS — EU Taxonomy substantial contribution [10]
//     Technical screening criteria for 6 environmental objectives
// ═══════════════════════════════════════════════════════════════════════════════

export const TAXONOMY_THRESHOLDS = {
  // Objective 1: Climate Change Mitigation (Delegated Act 2021/2139)
  climate_mitigation: {
    electricity_generation: { threshold: 100, unit: 'gCO2e/kWh', condition: 'lifecycle or <100g direct' },
    cogeneration:           { threshold: 270, unit: 'gCO2e/kWh', condition: 'high-efficiency CHP' },
    district_heating:       { threshold: 'System-specific', note: 'Must use >50% renewable/waste heat' },
    passenger_cars:         { threshold: 0, unit: 'gCO2/km', condition: 'Zero tailpipe emissions' },
    heavy_goods:            { threshold: 0, unit: 'gCO2/km', condition: 'Zero direct emissions' },
    inland_waterways:       { threshold: 0, unit: 'gCO2/km', condition: 'Zero direct or hybrid' },
    buildings_new:          { threshold: 'NZEB - 10%', note: 'Primary energy demand 10% below NZEB' },
    buildings_renovation:   { threshold: 30, unit: '% energy reduction', condition: 'Major renovation' },
    cement:                 { threshold: 0.722, unit: 'tCO2e/t clinker', condition: 'Grey clinker production' },
    steel_eaf:              { threshold: 0.283, unit: 'tCO2e/t steel', condition: 'Electric arc furnace route' },
    steel_bof:              { threshold: 1.331, unit: 'tCO2e/t steel', condition: 'Basic oxygen furnace route' },
    aluminium:              { threshold: 1.514, unit: 'tCO2e/t aluminium', condition: 'Primary smelting' },
    hydrogen:               { threshold: 3.0, unit: 'kgCO2e/kgH2', condition: 'Lifecycle emissions' },
    data_centres:           { threshold: 'IEC/ETSI PUE', note: 'Must implement EU Code of Conduct for Energy Efficiency' },
  },

  // Objective 2: Climate Change Adaptation
  climate_adaptation: {
    note: 'Activity must reduce material physical climate risks via adaptation plan',
    requires_climate_risk_assessment: true,
    time_horizons: [2030, 2050],
    scenarios_required: ['RCP4.5', 'RCP8.5'],
  },

  // Objective 3: Water & Marine Resources (Delegated Act 2023/2486)
  water: {
    water_supply_leakage:  { threshold: 36, unit: '%', condition: 'Infrastructure leakage index <1.5 or <36% NRW' },
    urban_wastewater:      { threshold: 'UWWTD', note: 'Must meet Urban Waste Water Treatment Directive standards' },
  },

  // Objective 4: Circular Economy (Delegated Act 2023/2486)
  circular_economy: {
    plastic_packaging_recycled: { threshold: 30, unit: '% recycled content by 2030' },
    construction_waste_reuse:   { threshold: 70, unit: '% by weight non-hazardous' },
  },

  // Objective 5: Pollution Prevention (Delegated Act 2023/2486)
  pollution: {
    requires_bref_compliance: true,
    note: 'Must comply with Best Available Techniques (BAT) conclusions',
  },

  // Objective 6: Biodiversity & Ecosystems (Delegated Act 2023/2486)
  biodiversity: {
    requires_eia: true,
    no_net_deforestation: true,
    note: 'Environmental impact assessment required; no conversion of high-biodiversity land',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 11. CONTROVERSY_SEVERITY — RepRisk-style severity scale [11]
// ═══════════════════════════════════════════════════════════════════════════════

export const CONTROVERSY_SEVERITY = [
  {
    level: 1,
    label: 'Low',
    description: 'Isolated incident with limited impact; single media mention; no regulatory response',
    riskScore: { min: 0, max: 25 },
    engagementRequired: false,
    color: '#22c55e',
  },
  {
    level: 2,
    label: 'Medium',
    description: 'Repeated incidents or broader stakeholder concern; multiple media reports; potential regulatory inquiry',
    riskScore: { min: 26, max: 50 },
    engagementRequired: true,
    color: '#eab308',
  },
  {
    level: 3,
    label: 'High',
    description: 'Systematic pattern or major single event; significant stakeholder/community harm; regulatory investigation',
    riskScore: { min: 51, max: 75 },
    engagementRequired: true,
    color: '#f97316',
  },
  {
    level: 4,
    label: 'Very High',
    description: 'Severe, ongoing violations; large-scale environmental damage or human rights abuse; litigation/fines',
    riskScore: { min: 76, max: 90 },
    engagementRequired: true,
    color: '#ef4444',
  },
  {
    level: 5,
    label: 'Critical',
    description: 'Catastrophic event (fatalities, ecological disaster); UNGC violation; potential exclusion trigger',
    riskScore: { min: 91, max: 100 },
    engagementRequired: true,
    color: '#dc2626',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 12. CII_THRESHOLDS — IMO Carbon Intensity Indicator [12]
//     MEPC.352(78) reference lines & rating boundaries
//     CII = Annual CO2 / (DWT * Distance) in gCO2/(DWT*nm)
// ═══════════════════════════════════════════════════════════════════════════════

export const CII_THRESHOLDS = {
  // Reference line parameters: CII_ref = a * DWT^(-c) in gCO2/(DWT*nm)
  // Source: IMO MEPC.352(78) Table 1
  referenceLines: {
    bulkCarrier:    { a: 4745,   c: 0.622 },
    tanker:         { a: 5247,   c: 0.610 },
    containerShip:  { a: 1984,   c: 0.489 },
    generalCargo:   { a: 31948,  c: 0.792 },
    gasCarrier:     { a: 14405,  c: 0.699 },
    lngCarrier:     { a: 9.827,  c: 0.000 }, // Flat reference
    roRoVehicle:    { a: 5739,   c: 0.631 },
    cruiseShip:     { a: 930,    c: 0.383 },
  },

  // Rating boundary vectors (dd1..dd4 expressed as % of reference)
  // A: < dd1, B: dd1-dd2, C: dd2-dd3, D: dd3-dd4, E: > dd4
  ratingBoundaries: {
    bulkCarrier:   { dd1: 0.86, dd2: 0.94, dd3: 1.06, dd4: 1.18 },
    tanker:        { dd1: 0.82, dd2: 0.93, dd3: 1.08, dd4: 1.28 },
    containerShip: { dd1: 0.83, dd2: 0.94, dd3: 1.07, dd4: 1.19 },
    generalCargo:  { dd1: 0.83, dd2: 0.94, dd3: 1.06, dd4: 1.19 },
    gasCarrier:    { dd1: 0.81, dd2: 0.91, dd3: 1.12, dd4: 1.44 },
    lngCarrier:    { dd1: 0.89, dd2: 0.98, dd3: 1.06, dd4: 1.13 },
    roRoVehicle:   { dd1: 0.86, dd2: 0.94, dd3: 1.06, dd4: 1.18 },
    cruiseShip:    { dd1: 0.87, dd2: 0.95, dd3: 1.06, dd4: 1.16 },
  },

  // Annual reduction factors (% from 2019 baseline) per MEPC.338(76)
  reductionFactors: {
    2023: 5.0,
    2024: 7.0,
    2025: 9.0,
    2026: 11.0,
    // Post-2026 TBD by IMO MEPC
  },

  ratings: ['A', 'B', 'C', 'D', 'E'],
  ratingColors: { A: '#16a34a', B: '#22c55e', C: '#eab308', D: '#f97316', E: '#ef4444' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 13. CORSIA_BASELINES — ICAO CORSIA baseline emissions [13]
//     Source: ICAO Annex 16 Vol IV; CORSIA Implementation Element docs
// ═══════════════════════════════════════════════════════════════════════════════

export const CORSIA_BASELINES = {
  // Baseline period: average of 2019 (COVID adjustment — originally 2019-2020)
  baseline_year: 2019,
  baseline_emissions_MtCO2: 589, // Total international aviation CO2 in 2019

  // Sectoral emissions for baseline calculation
  sectorEmissions: {
    2010: { MtCO2: 448, source: 'ICAO Environmental Report 2022' },
    2015: { MtCO2: 510, source: 'ICAO Environmental Report 2022' },
    2019: { MtCO2: 589, source: 'ICAO Environmental Report 2022' },
    2020: { MtCO2: 237, source: 'ICAO — COVID impact' },
    2021: { MtCO2: 287, source: 'ICAO — partial recovery' },
    2022: { MtCO2: 480, source: 'ICAO — recovery trajectory' },
    2023: { MtCO2: 550, source: 'ICAO estimate — near pre-COVID' },
  },

  // CORSIA phases
  phases: {
    pilot:   { start: 2024, end: 2026, participation: 'Voluntary', growthFactor: 0.85 },
    phase1:  { start: 2027, end: 2032, participation: 'Voluntary (most ICAO states)', growthFactor: 0.85 },
    phase2:  { start: 2033, end: 2035, participation: 'Mandatory (>0.5% intl RTK)', growthFactor: 1.00 },
  },

  // Eligible emissions units (EEUs) — approved offset programmes
  eligibleProgrammes: [
    'American Carbon Registry (ACR)',
    'Architecture for REDD+ Transactions (ART)',
    'Global Carbon Council (GCC)',
    'Gold Standard',
    'Verified Carbon Standard (Verra VCS)',
  ],

  // CORSIA Default Life Cycle Emissions (gCO2e/MJ)
  defaultLCA: {
    jet_fuel_conventional: 89.0,   // gCO2e/MJ — CORSIA default value
    saf_hefa:              30.4,   // Hydroprocessed esters & fatty acids
    saf_ft_msw:            7.7,    // Fischer-Tropsch from municipal solid waste
    saf_atj_sugarcane:     24.0,   // Alcohol-to-jet from sugarcane
    saf_power_to_liquid:   4.5,    // E-fuels (with renewable electricity)
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Convenience lookup helpers
// ═══════════════════════════════════════════════════════════════════════════════

/** Look up grid intensity by ISO2 country code */
export const getGridIntensity = (iso2) =>
  GRID_INTENSITY.find(g => g.iso2 === iso2)?.gCO2_kWh ?? null;

/** Look up sector benchmark by GICS code */
export const getSectorBenchmark = (gics) =>
  SECTOR_BENCHMARKS.find(s => s.gics === gics) ?? null;

/** Look up NGFS scenario by id */
export const getNGFSScenario = (id) =>
  NGFS_SCENARIOS.find(s => s.id === id) ?? null;

/** Get PCAF data quality definition by score (1-5) */
export const getPCAFDefinition = (score) =>
  PCAF_DATA_QUALITY.find(p => p.score === score) ?? null;

/** Get CII rating for a ship type given its attained CII vs reference */
export const getCIIRating = (shipType, attainedRatio) => {
  const bounds = CII_THRESHOLDS.ratingBoundaries[shipType];
  if (!bounds) return null;
  if (attainedRatio < bounds.dd1) return 'A';
  if (attainedRatio < bounds.dd2) return 'B';
  if (attainedRatio < bounds.dd3) return 'C';
  if (attainedRatio < bounds.dd4) return 'D';
  return 'E';
};

/** Get remaining carbon budget in GtCO2 for a given pathway */
export const getRemainingBudget = (pathway) =>
  TEMPERATURE_PATHWAYS.budgets_GtCO2[pathway] ?? null;

/** Get controversy severity by level (1-5) */
export const getControversySeverity = (level) =>
  CONTROVERSY_SEVERITY.find(c => c.level === level) ?? null;
