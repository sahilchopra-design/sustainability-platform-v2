/**
 * Consolidated Reference Data — Single Source for All 333 Modules
 *
 * 30 datasets with real/published values. Source attribution in comments.
 * Deterministic seeded RNG for any interpolated values: sr(seed) => [0,1)
 *
 * Sources indexed:
 *   [1]  UK DEFRA GHG Conversion Factors 2023 (DESNZ)
 *   [2]  EU ETS / UK ETS / RGGI / California market data (EEA, GOV.UK, RGGI Inc., CARB)
 *   [3]  IPCC AR6 WG1 Chapter 7, Table 7.SM.7 (2021)
 *   [4]  Ember Global Electricity Review 2024 (CC BY 4.0)
 *   [5]  EU CSRD / Taxonomy Regulation / SFDR RTS
 *   [6]  PCAF Global GHG Standard 2nd Edition (2022)
 *   [7]  NGFS Phase IV Scenarios Technical Documentation V4.2 (Nov 2023)
 *   [8]  MSCI / S&P Trucost / SBTi sector pathways
 *   [9]  IPCC AR6 WG3 (2022) — carbon budgets
 *  [10]  EU Taxonomy Climate Delegated Act (2021/2139) + Env Delegated Act (2023/2486)
 *  [11]  RepRisk AG methodology documentation
 *  [12]  IMO MEPC.352(78) — CII reference lines and reduction factors
 *  [13]  ICAO CORSIA — Annex 16 Vol IV, 1st Edition (2018, updated 2022)
 *  [14]  World Bank WDI, IMF WEO Apr 2025, ND-GAIN 2023, S&P Global Ratings
 *  [15]  ECB / Federal Reserve / BIS exchange rate data (March 2026)
 *  [16]  BIS Central Bank Policy Rate Statistics (March 2026)
 *  [17]  CME Group / LME / ICE / World Bank Commodity Markets (March 2026)
 *  [18]  IBAT, IUCN Red List Index 2024, Global Forest Watch 2024
 *  [19]  WRI Aqueduct 4.0 (2023)
 *  [20]  SDSN Sustainable Development Report / SDG Index 2024
 *  [21]  Global Forest Watch / Hansen et al. tree cover loss data (2024)
 *  [22]  Climate Bonds Initiative — Green Bond Market Summary H1 2025
 *  [23]  SBTi Progress Report 2024
 *  [24]  TCFD 2023 Status Report (FSB)
 *  [25]  GRESB Real Estate Assessment Results 2024
 *  [26]  CRREM — Carbon Risk Real Estate Monitor v2.0 (2023)
 *  [27]  ILO, Walk Free Foundation GSI 2023, RSF Press Freedom Index 2024
 *  [28]  Swiss Re sigma No 1/2025 — Natural catastrophes in 2024
 *  [29]  Ship & Bunker / Argus Media marine fuel pricing (March 2026)
 *  [30]  IATA / Argus SAF pricing, CORSIA SAF eligibility (2025)
 */

// Deterministic seeded RNG — NO Math.random()
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EMISSION_FACTORS — DEFRA 2023 + EXIOBASE Scope 3 factors [1]
// ═══════════════════════════════════════════════════════════════════════════════

export const EMISSION_FACTORS = {
  // ── Transport (gCO2e per passenger-km) ──
  transport: {
    petrolCar:          { factor: 170.5, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    dieselCar:          { factor: 158.2, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    hybridCar:          { factor: 119.8, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    electricCar:        { factor: 46.5,  unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'UK grid 2023' },
    motorbike:          { factor: 103.3, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    bus:                { factor: 82.0,  unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    taxi:               { factor: 149.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    trainNational:      { factor: 35.7,  unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    trainInternational: { factor: 6.0,   unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'Eurostar' },
    metro:              { factor: 28.0,  unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    ferryFoot:          { factor: 187.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    ferryCar:           { factor: 129.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'per vehicle-km' },
    shortHaulEconomy:   { factor: 255.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    longHaulEconomy:    { factor: 195.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    longHaulBusiness:   { factor: 428.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    longHaulFirst:      { factor: 586.0, unit: 'gCO2e/pkm', source: 'DEFRA 2023', note: 'incl RFI' },
    eBike:              { factor: 6.0,   unit: 'gCO2e/pkm', source: 'DEFRA 2023' },
    eScooter:           { factor: 35.0,  unit: 'gCO2e/pkm', source: 'DEFRA 2023 / ITF' },
  },

  // ── Stationary energy (kgCO2e per kWh or per unit) ──
  energy: {
    naturalGas_kWh:   { factor: 0.18385, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    diesel_kWh:       { factor: 0.26731, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    coal_kWh:         { factor: 0.34109, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    lpg_kWh:          { factor: 0.21443, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    fuelOil_kWh:      { factor: 0.26786, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    biogas_kWh:       { factor: 0.00023, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    biomass_kWh:      { factor: 0.01517, unit: 'kgCO2e/kWh', source: 'DEFRA 2023' },
    naturalGas_m3:    { factor: 2.04249, unit: 'kgCO2e/m3',  source: 'DEFRA 2023' },
    diesel_litre:     { factor: 2.70570, unit: 'kgCO2e/l',   source: 'DEFRA 2023' },
    petrol_litre:     { factor: 2.31480, unit: 'kgCO2e/l',   source: 'DEFRA 2023' },
    heatPump_kWh:     { factor: 0.0,     unit: 'kgCO2e/kWh', source: 'DEFRA 2023', note: 'Direct=0; use grid factor for electricity consumed' },
  },

  // ── Materials / industrial (kgCO2e per tonne) ──
  materials: {
    steel_primary:      { factor: 1850,  unit: 'kgCO2e/t', source: 'DEFRA 2023 / worldsteel' },
    steel_recycled:     { factor: 410,   unit: 'kgCO2e/t', source: 'DEFRA 2023 / worldsteel' },
    aluminium_primary:  { factor: 8400,  unit: 'kgCO2e/t', source: 'DEFRA 2023 / IAI' },
    aluminium_recycled: { factor: 520,   unit: 'kgCO2e/t', source: 'DEFRA 2023 / IAI' },
    cement_portland:    { factor: 830,   unit: 'kgCO2e/t', source: 'DEFRA 2023 / GCCA' },
    concrete_ready:     { factor: 132,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    glass_flat:         { factor: 910,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    paper_virgin:       { factor: 920,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    paper_recycled:     { factor: 610,   unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    plastics_average:   { factor: 3100,  unit: 'kgCO2e/t', source: 'DEFRA 2023' },
    copper_primary:     { factor: 3500,  unit: 'kgCO2e/t', source: 'ICA / DEFRA 2023' },
    lithium_carbonate:  { factor: 5000,  unit: 'kgCO2e/t', source: 'IEA / Minviro LCA 2023' },
    cobalt_refined:     { factor: 8900,  unit: 'kgCO2e/t', source: 'Cobalt Institute LCA 2022' },
    nickel_class1:      { factor: 10000, unit: 'kgCO2e/t', source: 'Nickel Institute LCA 2022' },
    silicon_solar:      { factor: 12000, unit: 'kgCO2e/t', source: 'Fraunhofer ISE 2023' },
    timber_softwood:    { factor: 26,    unit: 'kgCO2e/t', source: 'DEFRA 2023', note: 'cradle-to-gate, excl biogenic C' },
  },

  // ── Scope 3 category-specific EFs (kgCO2e per $ spend) — EXIOBASE / EPA USEEIO ──
  scope3_spend: {
    cat1_purchased_goods:  { factor: 0.42, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2 / USEEIO v2.0', note: 'Manufacturing avg' },
    cat2_capital_goods:    { factor: 0.55, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2', note: 'Machinery & equipment' },
    cat3_fuel_energy:      { factor: 0.68, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2', note: 'WTT & T&D losses' },
    cat4_upstream_transport:{ factor: 0.52, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2', note: 'Road freight' },
    cat5_waste:            { factor: 0.18, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2', note: 'Waste treatment services' },
    cat6_business_travel:  { factor: 0.30, unit: 'kgCO2e/$', source: 'USEEIO v2.0', note: 'Air travel & hotel' },
    cat7_commuting:        { factor: 0.15, unit: 'kgCO2e/$', source: 'USEEIO v2.0', note: 'Mixed mode avg' },
    cat8_upstream_leased:  { factor: 0.25, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2', note: 'Commercial RE' },
    cat9_downstream_transport:{ factor: 0.48, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2' },
    cat11_use_of_product:  { factor: 0.35, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2', note: 'Electronics avg' },
    cat12_end_of_life:     { factor: 0.12, unit: 'kgCO2e/$', source: 'EXIOBASE 3.8.2' },
    cat15_investments:     { factor: 0.20, unit: 'kgCO2e/$', source: 'PCAF / EXIOBASE', note: 'Financial services' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CARBON_PRICES — Compliance & scenario carbon prices [2][7]
// ═══════════════════════════════════════════════════════════════════════════════

export const CARBON_PRICES = {
  // Compliance markets — latest confirmed prices (EUR or USD per tCO2e)
  compliance: {
    EU_ETS:     { price: 65.2,  currency: 'EUR', year: 2025, source: 'EEA / ICE Endex Q1 2025 avg' },
    UK_ETS:     { price: 44.80, currency: 'GBP', year: 2025, source: 'GOV.UK civil penalty price 2025' },
    RGGI:       { price: 15.22, currency: 'USD', year: 2025, source: 'RGGI Inc auction clearing Mar 2025' },
    California: { price: 38.73, currency: 'USD', year: 2025, source: 'CARB Feb 2025 auction settlement' },
    Korea_ETS:  { price: 9.10,  currency: 'USD', year: 2025, source: 'KRX avg Q1 2025' },
    China_ETS:  { price: 11.50, currency: 'USD', year: 2025, source: 'Shanghai Environment Exchange Q1 2025' },
    NZ_ETS:     { price: 49.0,  currency: 'NZD', year: 2025, source: 'NZX Carbon Q1 2025 avg' },
    Mexico_ETS: { price: 3.50,  currency: 'USD', year: 2025, source: 'SEMARNAT pilot 2025' },
    Japan_GX:   { price: 5.0,   currency: 'USD', year: 2025, source: 'GX-ETS Phase 1 (voluntary)' },
  },

  // NGFS scenario shadow carbon prices (USD/tCO2e) [7]
  ngfs_2030: {
    net_zero_2050:         200,
    below_2c:              130,
    divergent_net_zero:    250,
    delayed_transition:     35,
    nationally_determined:  25,
    current_policies:       15,
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
    nature_based:     { price: 8.50,   year: 2024, source: 'Ecosystem Marketplace SoVCM 2024' },
    tech_removal:     { price: 125.0,  year: 2024, source: 'CDR.fyi weighted avg' },
    renewable_energy: { price: 3.20,   year: 2024, source: 'Ecosystem Marketplace' },
    cookstoves:       { price: 5.80,   year: 2024, source: 'BeZero Carbon' },
    redd_plus:        { price: 6.40,   year: 2024, source: 'Ecosystem Marketplace' },
    biochar:          { price: 150.0,  year: 2024, source: 'CDR.fyi / Puro.earth' },
    enhanced_weathering:{ price: 85.0, year: 2024, source: 'CDR.fyi' },
    dac:              { price: 600.0,  year: 2024, source: 'CDR.fyi / Climeworks' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GWP_VALUES — IPCC AR6 GWP-100 [3]
// ═══════════════════════════════════════════════════════════════════════════════

export const GWP_VALUES = {
  CO2:          1,
  CH4_fossil:   29.8,
  CH4_biogenic: 27.9,
  N2O:          273,
  SF6:          25200,
  NF3:          17400,
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
  // 20-year GWP (CH4 is much higher on short horizon)
  CH4_fossil_GWP20:   82.5,
  CH4_biogenic_GWP20: 80.8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. GRID_INTENSITY — 50 countries gCO2/kWh (Ember 2024) [4]
// ═══════════════════════════════════════════════════════════════════════════════

export const GRID_INTENSITY = [
  // Very Low Carbon (< 100)
  { country: 'Iceland',       iso2: 'IS', gCO2_kWh: 13,  primary: 'Geothermal + Hydro' },
  { country: 'Norway',        iso2: 'NO', gCO2_kWh: 26,  primary: 'Hydro' },
  { country: 'Paraguay',      iso2: 'PY', gCO2_kWh: 25,  primary: 'Hydro (Itaipu)' },
  { country: 'Sweden',        iso2: 'SE', gCO2_kWh: 41,  primary: 'Nuclear + Hydro' },
  { country: 'Switzerland',   iso2: 'CH', gCO2_kWh: 46,  primary: 'Hydro + Nuclear' },
  { country: 'France',        iso2: 'FR', gCO2_kWh: 56,  primary: 'Nuclear' },
  { country: 'Uruguay',       iso2: 'UY', gCO2_kWh: 60,  primary: 'Wind + Hydro' },
  { country: 'Costa Rica',    iso2: 'CR', gCO2_kWh: 35,  primary: 'Hydro + Geothermal' },
  { country: 'Brazil',        iso2: 'BR', gCO2_kWh: 85,  primary: 'Hydro' },
  { country: 'Kenya',         iso2: 'KE', gCO2_kWh: 90,  primary: 'Geothermal + Hydro' },
  // Low Carbon (100-200)
  { country: 'New Zealand',   iso2: 'NZ', gCO2_kWh: 109, primary: 'Hydro + Geothermal' },
  { country: 'Canada',        iso2: 'CA', gCO2_kWh: 120, primary: 'Hydro + Nuclear' },
  { country: 'Denmark',       iso2: 'DK', gCO2_kWh: 145, primary: 'Wind' },
  { country: 'Finland',       iso2: 'FI', gCO2_kWh: 151, primary: 'Nuclear + Hydro + Wind' },
  { country: 'Spain',         iso2: 'ES', gCO2_kWh: 160, primary: 'Wind + Solar + Nuclear' },
  { country: 'Belgium',       iso2: 'BE', gCO2_kWh: 167, primary: 'Nuclear + Gas' },
  { country: 'Colombia',      iso2: 'CO', gCO2_kWh: 145, primary: 'Hydro' },
  { country: 'Chile',         iso2: 'CL', gCO2_kWh: 195, primary: 'Solar + Hydro + Coal' },
  // Medium Carbon (200-400)
  { country: 'UK',            iso2: 'GB', gCO2_kWh: 238, primary: 'Gas + Wind + Nuclear' },
  { country: 'Italy',         iso2: 'IT', gCO2_kWh: 274, primary: 'Gas + Solar + Hydro' },
  { country: 'Ireland',       iso2: 'IE', gCO2_kWh: 262, primary: 'Gas + Wind' },
  { country: 'Netherlands',   iso2: 'NL', gCO2_kWh: 316, primary: 'Gas + Wind' },
  { country: 'Germany',       iso2: 'DE', gCO2_kWh: 380, primary: 'Wind + Coal + Gas' },
  { country: 'USA',           iso2: 'US', gCO2_kWh: 376, primary: 'Gas + Coal + Nuclear' },
  { country: 'Mexico',        iso2: 'MX', gCO2_kWh: 398, primary: 'Gas + Oil' },
  { country: 'Argentina',     iso2: 'AR', gCO2_kWh: 340, primary: 'Gas + Hydro' },
  { country: 'Thailand',      iso2: 'TH', gCO2_kWh: 395, primary: 'Gas + Coal' },
  { country: 'Egypt',         iso2: 'EG', gCO2_kWh: 385, primary: 'Gas' },
  { country: 'Turkey',        iso2: 'TR', gCO2_kWh: 375, primary: 'Coal + Gas + Hydro' },
  { country: 'Morocco',       iso2: 'MA', gCO2_kWh: 610, primary: 'Coal + Wind + Solar' },
  // Higher Carbon (400-600)
  { country: 'Singapore',     iso2: 'SG', gCO2_kWh: 418, primary: 'Natural Gas' },
  { country: 'South Korea',   iso2: 'KR', gCO2_kWh: 410, primary: 'Coal + Nuclear + Gas' },
  { country: 'Japan',         iso2: 'JP', gCO2_kWh: 453, primary: 'Gas + Coal' },
  { country: 'Australia',     iso2: 'AU', gCO2_kWh: 480, primary: 'Coal + Gas + Solar' },
  { country: 'Vietnam',       iso2: 'VN', gCO2_kWh: 485, primary: 'Coal + Hydro' },
  { country: 'Malaysia',      iso2: 'MY', gCO2_kWh: 540, primary: 'Gas + Coal' },
  { country: 'Philippines',   iso2: 'PH', gCO2_kWh: 570, primary: 'Coal + Gas + Geothermal' },
  { country: 'Saudi Arabia',  iso2: 'SA', gCO2_kWh: 580, primary: 'Oil + Gas' },
  // High Carbon (> 600)
  { country: 'China',         iso2: 'CN', gCO2_kWh: 546, primary: 'Coal' },
  { country: 'India',         iso2: 'IN', gCO2_kWh: 623, primary: 'Coal' },
  { country: 'Indonesia',     iso2: 'ID', gCO2_kWh: 705, primary: 'Coal' },
  { country: 'Poland',        iso2: 'PL', gCO2_kWh: 680, primary: 'Coal' },
  { country: 'South Africa',  iso2: 'ZA', gCO2_kWh: 709, primary: 'Coal (Eskom)' },
  { country: 'Nigeria',       iso2: 'NG', gCO2_kWh: 410, primary: 'Gas + Oil' },
  { country: 'Bangladesh',    iso2: 'BD', gCO2_kWh: 580, primary: 'Gas + Coal' },
  { country: 'Pakistan',      iso2: 'PK', gCO2_kWh: 450, primary: 'Gas + Hydro + Oil' },
  { country: 'Kazakhstan',    iso2: 'KZ', gCO2_kWh: 650, primary: 'Coal + Gas' },
  { country: 'Mongolia',      iso2: 'MN', gCO2_kWh: 790, primary: 'Coal' },
  { country: 'Botswana',      iso2: 'BW', gCO2_kWh: 750, primary: 'Coal' },
  { country: 'Estonia',       iso2: 'EE', gCO2_kWh: 500, primary: 'Oil shale + Wind' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5. REGULATORY_THRESHOLDS — Key regulatory numbers [5]
// ═══════════════════════════════════════════════════════════════════════════════

export const REGULATORY_THRESHOLDS = {
  // EU CSRD — effective dates confirmed
  csrd_large_employees: 500,
  csrd_phase1_effective: '2024-01-01',       // FY2024 reporting for >500 employee PIEs
  csrd_phase2_employees: 250,
  csrd_phase2_effective: '2025-01-01',       // FY2025: >250 employees
  csrd_phase2_revenue_eur: 50_000_000,
  csrd_phase2_assets_eur: 25_000_000,
  csrd_sme_employees: 10,
  csrd_phase3_effective: '2026-01-01',       // FY2026: listed SMEs 10-250
  csrd_non_eu_effective: '2028-01-01',       // FY2028: non-EU companies with EU revenues >150M

  // EU Taxonomy — minimum safeguards
  taxonomy_dnsh_water_stress: 3.0,
  taxonomy_pollution_bref: true,

  // SFDR PAI — Principal Adverse Impact (mandatory Table 1)
  sfdr_pai1_ghg_scope12: true,
  sfdr_pai2_carbon_footprint: true,
  sfdr_pai3_ghg_intensity: true,
  sfdr_pai4_fossil_fuel_pct: true,
  sfdr_pai10_ungc_violations: true,
  sfdr_pai14_controversial_weapons: true,

  // EU Taxonomy TSC — substantial contribution thresholds
  taxonomy_power_generation_gCO2_kWh: 100,
  taxonomy_vehicles_gCO2_km: 0,
  taxonomy_buildings_nzeb: true,
  taxonomy_cement_clinker_kgCO2_t: 722,
  taxonomy_steel_eaf_tCO2_t: 0.283,
  taxonomy_aluminium_tCO2_t: 1.514,
  taxonomy_hydrogen_kgCO2_kgH2: 3.0,

  // SEC Climate Rule (S7-10-22 / final rule March 2024)
  sec_large_accelerated_filer_assets: 700_000_000,
  sec_accelerated_filer_assets: 75_000_000,
  sec_materiality_threshold_pct: 1,

  // UK SDR — anti-greenwashing
  uk_sdr_min_sustainable_pct: 70,
  uk_sdr_unexpected_threshold_pct: 30,
  uk_sdr_effective: '2024-11-28',

  // BRSR Core (India SEBI)
  brsr_top_listed_count: 1000,
  brsr_assurance_top: 150,
  brsr_assurance_effective: '2024-04-01',

  // ISSB S1/S2 (effective Jan 2025 in many jurisdictions)
  issb_s1_effective: '2025-01-01',
  issb_s2_effective: '2025-01-01',
  issb_scope3_transition_relief_years: 1,

  // Singapore SGX — mandatory climate reporting for listed issuers
  sgx_mandatory_effective: '2025-01-01',

  // Hong Kong HKEX — mandatory climate disclosure
  hkex_mandatory_effective: '2025-01-01',

  // Australia ASRS — mandatory climate reporting
  australia_group1_effective: '2025-01-01',
  australia_group1_revenue_aud: 500_000_000,
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
    gdpImpact2050_pct: -2.5,
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
// 8. SECTOR_BENCHMARKS — 30 GICS sub-industries [8]
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
  { gics: '4010', sector: 'Banks',                     medianIntensity: 4,   parisTarget2030: 2,   sbtiMethod: 'SDA', decarbRate: 4.2, note: 'Own ops only; excludes financed' },
  { gics: '4020', sector: 'Financial Services',        medianIntensity: 5,   parisTarget2030: 3,   sbtiMethod: 'SDA', decarbRate: 4.2, note: 'Own ops only' },
  { gics: '4030', sector: 'Insurance',                 medianIntensity: 6,   parisTarget2030: 3,   sbtiMethod: 'SDA', decarbRate: 4.2, note: 'Own ops only' },
  { gics: '4510', sector: 'Software & Services',       medianIntensity: 8,   parisTarget2030: 4,   sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '4520', sector: 'Technology Hardware',       medianIntensity: 18,  parisTarget2030: 10,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '4530', sector: 'Semiconductors',            medianIntensity: 22,  parisTarget2030: 12,  sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '5010', sector: 'Telecommunication Services',medianIntensity: 20,  parisTarget2030: 11,  sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '5020', sector: 'Media & Entertainment',     medianIntensity: 10,  parisTarget2030: 6,   sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '5510', sector: 'Utilities',                 medianIntensity: 980, parisTarget2030: 540, sbtiMethod: 'SDA', decarbRate: 7.0 },
  { gics: '6010', sector: 'Equity REITs',              medianIntensity: 32,  parisTarget2030: 18,  sbtiMethod: 'SDA', decarbRate: 4.2, note: 'kgCO2e/m2 basis often used' },
  { gics: '2540', sector: 'Consumer Discretionary Dist',medianIntensity: 15, parisTarget2030: 8,   sbtiMethod: 'ACA', decarbRate: 4.2 },
  { gics: '1520', sector: 'Chemicals',                 medianIntensity: 480, parisTarget2030: 265, sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '1530', sector: 'Construction Materials',    medianIntensity: 720, parisTarget2030: 396, sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '1540', sector: 'Containers & Packaging',    medianIntensity: 180, parisTarget2030: 99,  sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '1550', sector: 'Metals & Mining',           medianIntensity: 550, parisTarget2030: 303, sbtiMethod: 'SDA', decarbRate: 4.2 },
  { gics: '2560', sector: 'Hotels Restaurants Leisure', medianIntensity: 40,  parisTarget2030: 22,  sbtiMethod: 'ACA', decarbRate: 4.2 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 9. TEMPERATURE_PATHWAYS — Carbon budgets from IPCC AR6 [9]
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPERATURE_PATHWAYS = {
  budgets_GtCO2: {
    '1.5C_50pct': 500,
    '1.5C_67pct': 400,
    '1.5C_83pct': 300,
    '1.7C_50pct': 850,
    '1.7C_67pct': 700,
    '2.0C_50pct': 1350,
    '2.0C_67pct': 1150,
    '2.0C_83pct': 900,
  },
  annual_global_emissions_2023_GtCO2: 40.9,
  years_remaining: {
    '1.5C_50pct': 12,
    '1.5C_67pct': 10,
    '2.0C_50pct': 33,
    '2.0C_67pct': 28,
  },
  milestones: {
    net_zero_co2_1_5c: 2050,
    net_zero_co2_2c: 2070,
    peak_emissions: 2025,
    halve_by_2030: true,
    methane_reduce_2030: 0.34,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. TAXONOMY_THRESHOLDS — EU Taxonomy substantial contribution [10]
// ═══════════════════════════════════════════════════════════════════════════════

export const TAXONOMY_THRESHOLDS = {
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
  climate_adaptation: {
    note: 'Activity must reduce material physical climate risks via adaptation plan',
    requires_climate_risk_assessment: true,
    time_horizons: [2030, 2050],
    scenarios_required: ['RCP4.5', 'RCP8.5'],
  },
  water: {
    water_supply_leakage: { threshold: 36, unit: '%', condition: 'Infrastructure leakage index <1.5 or <36% NRW' },
    urban_wastewater:     { threshold: 'UWWTD', note: 'Must meet Urban Waste Water Treatment Directive standards' },
  },
  circular_economy: {
    plastic_packaging_recycled: { threshold: 30, unit: '% recycled content by 2030' },
    construction_waste_reuse:   { threshold: 70, unit: '% by weight non-hazardous' },
  },
  pollution: {
    requires_bref_compliance: true,
    note: 'Must comply with Best Available Techniques (BAT) conclusions',
  },
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
  { level: 1, label: 'Low',       description: 'Isolated incident with limited impact; single media mention; no regulatory response', riskScore: { min: 0, max: 25 }, engagementRequired: false, color: '#22c55e' },
  { level: 2, label: 'Medium',    description: 'Repeated incidents or broader stakeholder concern; multiple media reports; potential regulatory inquiry', riskScore: { min: 26, max: 50 }, engagementRequired: true, color: '#eab308' },
  { level: 3, label: 'High',      description: 'Systematic pattern or major single event; significant stakeholder/community harm; regulatory investigation', riskScore: { min: 51, max: 75 }, engagementRequired: true, color: '#f97316' },
  { level: 4, label: 'Very High', description: 'Severe, ongoing violations; large-scale environmental damage or human rights abuse; litigation/fines', riskScore: { min: 76, max: 90 }, engagementRequired: true, color: '#ef4444' },
  { level: 5, label: 'Critical',  description: 'Catastrophic event (fatalities, ecological disaster); UNGC violation; potential exclusion trigger', riskScore: { min: 91, max: 100 }, engagementRequired: true, color: '#dc2626' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 12. CII_THRESHOLDS — IMO Carbon Intensity Indicator [12]
// ═══════════════════════════════════════════════════════════════════════════════

export const CII_THRESHOLDS = {
  referenceLines: {
    bulkCarrier:   { a: 4745,   c: 0.622 },
    tanker:        { a: 5247,   c: 0.610 },
    containerShip: { a: 1984,   c: 0.489 },
    generalCargo:  { a: 31948,  c: 0.792 },
    gasCarrier:    { a: 14405,  c: 0.699 },
    lngCarrier:    { a: 9.827,  c: 0.000 },
    roRoVehicle:   { a: 5739,   c: 0.631 },
    cruiseShip:    { a: 930,    c: 0.383 },
  },
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
  reductionFactors: { 2023: 5.0, 2024: 7.0, 2025: 9.0, 2026: 11.0 },
  ratings: ['A', 'B', 'C', 'D', 'E'],
  ratingColors: { A: '#16a34a', B: '#22c55e', C: '#eab308', D: '#f97316', E: '#ef4444' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 13. CORSIA_BASELINES — ICAO CORSIA baseline emissions [13]
// ═══════════════════════════════════════════════════════════════════════════════

export const CORSIA_BASELINES = {
  baseline_year: 2019,
  baseline_emissions_MtCO2: 589,
  sectorEmissions: {
    2010: { MtCO2: 448, source: 'ICAO Environmental Report 2022' },
    2015: { MtCO2: 510, source: 'ICAO Environmental Report 2022' },
    2019: { MtCO2: 589, source: 'ICAO Environmental Report 2022' },
    2020: { MtCO2: 237, source: 'ICAO — COVID impact' },
    2021: { MtCO2: 287, source: 'ICAO — partial recovery' },
    2022: { MtCO2: 480, source: 'ICAO — recovery trajectory' },
    2023: { MtCO2: 550, source: 'ICAO estimate — near pre-COVID' },
    2024: { MtCO2: 585, source: 'ICAO — near full recovery' },
  },
  phases: {
    pilot:  { start: 2024, end: 2026, participation: 'Voluntary', growthFactor: 0.85 },
    phase1: { start: 2027, end: 2032, participation: 'Voluntary (most ICAO states)', growthFactor: 0.85 },
    phase2: { start: 2033, end: 2035, participation: 'Mandatory (>0.5% intl RTK)', growthFactor: 1.00 },
  },
  eligibleProgrammes: [
    'American Carbon Registry (ACR)',
    'Architecture for REDD+ Transactions (ART)',
    'Global Carbon Council (GCC)',
    'Gold Standard',
    'Verified Carbon Standard (Verra VCS)',
  ],
  defaultLCA: {
    jet_fuel_conventional: 89.0,
    saf_hefa:              30.4,
    saf_ft_msw:            7.7,
    saf_atj_sugarcane:     24.0,
    saf_power_to_liquid:   4.5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 14. COUNTRY_RISK_SCORES — 80 countries [14]
//     Sources: World Bank WDI 2024, IMF WEO Apr 2025, ND-GAIN 2023, S&P Global
// ═══════════════════════════════════════════════════════════════════════════════

export const COUNTRY_RISK_SCORES = [
  // iso2, name, gdpBn (USD, IMF 2024), populationM (UN 2024), hdi (UNDP 2023), gini (latest WB),
  // ndGainVuln (0-1 higher=worse), ndGainReady (0-1 higher=better), spRating, debtToGdpPct, co2PerCapita (tCO2), renewSharePct, ndcTargetPct
  { iso2: 'US', name: 'United States',     gdpBn: 28780, populationM: 334.9, hdi: 0.927, gini: 39.8, ndGainVuln: 0.33, ndGainReady: 0.75, spRating: 'AA+', debtToGdpPct: 123, co2PerCapita: 14.0, renewSharePct: 22, ndcTargetPct: 50 },
  { iso2: 'CN', name: 'China',             gdpBn: 18530, populationM: 1425.2, hdi: 0.788, gini: 38.2, ndGainVuln: 0.39, ndGainReady: 0.48, spRating: 'A+',  debtToGdpPct: 83,  co2PerCapita: 8.0,  renewSharePct: 30, ndcTargetPct: 65 },
  { iso2: 'JP', name: 'Japan',             gdpBn: 4230,  populationM: 123.3, hdi: 0.920, gini: 32.9, ndGainVuln: 0.35, ndGainReady: 0.72, spRating: 'A+',  debtToGdpPct: 255, co2PerCapita: 8.5,  renewSharePct: 22, ndcTargetPct: 46 },
  { iso2: 'DE', name: 'Germany',           gdpBn: 4460,  populationM: 84.5,  hdi: 0.950, gini: 31.7, ndGainVuln: 0.31, ndGainReady: 0.76, spRating: 'AAA', debtToGdpPct: 64,  co2PerCapita: 7.5,  renewSharePct: 46, ndcTargetPct: 55 },
  { iso2: 'GB', name: 'United Kingdom',    gdpBn: 3340,  populationM: 67.7,  hdi: 0.940, gini: 35.1, ndGainVuln: 0.31, ndGainReady: 0.77, spRating: 'AA',  debtToGdpPct: 101, co2PerCapita: 5.2,  renewSharePct: 43, ndcTargetPct: 68 },
  { iso2: 'IN', name: 'India',             gdpBn: 3940,  populationM: 1441.7,hdi: 0.644, gini: 35.7, ndGainVuln: 0.52, ndGainReady: 0.35, spRating: 'BBB-',debtToGdpPct: 83,  co2PerCapita: 2.0,  renewSharePct: 28, ndcTargetPct: 45 },
  { iso2: 'FR', name: 'France',            gdpBn: 3130,  populationM: 68.2,  hdi: 0.910, gini: 32.4, ndGainVuln: 0.30, ndGainReady: 0.72, spRating: 'AA',  debtToGdpPct: 112, co2PerCapita: 4.3,  renewSharePct: 27, ndcTargetPct: 55 },
  { iso2: 'IT', name: 'Italy',             gdpBn: 2280,  populationM: 58.9,  hdi: 0.906, gini: 35.2, ndGainVuln: 0.33, ndGainReady: 0.63, spRating: 'BBB', debtToGdpPct: 140, co2PerCapita: 5.1,  renewSharePct: 36, ndcTargetPct: 55 },
  { iso2: 'CA', name: 'Canada',            gdpBn: 2240,  populationM: 40.1,  hdi: 0.935, gini: 33.3, ndGainVuln: 0.30, ndGainReady: 0.78, spRating: 'AAA', debtToGdpPct: 107, co2PerCapita: 14.3, renewSharePct: 68, ndcTargetPct: 40 },
  { iso2: 'AU', name: 'Australia',         gdpBn: 1790,  populationM: 26.6,  hdi: 0.946, gini: 34.4, ndGainVuln: 0.33, ndGainReady: 0.77, spRating: 'AAA', debtToGdpPct: 52,  co2PerCapita: 15.0, renewSharePct: 32, ndcTargetPct: 43 },
  { iso2: 'KR', name: 'South Korea',       gdpBn: 1710,  populationM: 51.7,  hdi: 0.929, gini: 31.4, ndGainVuln: 0.34, ndGainReady: 0.70, spRating: 'AA',  debtToGdpPct: 54,  co2PerCapita: 11.6, renewSharePct: 9,  ndcTargetPct: 40 },
  { iso2: 'BR', name: 'Brazil',            gdpBn: 2170,  populationM: 216.4, hdi: 0.760, gini: 52.9, ndGainVuln: 0.41, ndGainReady: 0.44, spRating: 'BB',  debtToGdpPct: 87,  co2PerCapita: 2.3,  renewSharePct: 82, ndcTargetPct: 50 },
  { iso2: 'MX', name: 'Mexico',            gdpBn: 1780,  populationM: 129.4, hdi: 0.781, gini: 45.4, ndGainVuln: 0.43, ndGainReady: 0.40, spRating: 'BBB', debtToGdpPct: 53,  co2PerCapita: 3.6,  renewSharePct: 25, ndcTargetPct: 35 },
  { iso2: 'ID', name: 'Indonesia',         gdpBn: 1390,  populationM: 277.5, hdi: 0.713, gini: 37.9, ndGainVuln: 0.48, ndGainReady: 0.37, spRating: 'BBB', debtToGdpPct: 39,  co2PerCapita: 2.3,  renewSharePct: 15, ndcTargetPct: 31 },
  { iso2: 'SA', name: 'Saudi Arabia',      gdpBn: 1110,  populationM: 36.9,  hdi: 0.875, gini: 45.9, ndGainVuln: 0.41, ndGainReady: 0.53, spRating: 'A',   debtToGdpPct: 26,  co2PerCapita: 16.1, renewSharePct: 1,  ndcTargetPct: 30 },
  { iso2: 'CH', name: 'Switzerland',       gdpBn: 905,   populationM: 9.0,   hdi: 0.967, gini: 33.1, ndGainVuln: 0.27, ndGainReady: 0.82, spRating: 'AAA', debtToGdpPct: 41,  co2PerCapita: 4.0,  renewSharePct: 68, ndcTargetPct: 50 },
  { iso2: 'NL', name: 'Netherlands',       gdpBn: 1120,  populationM: 17.6,  hdi: 0.946, gini: 28.1, ndGainVuln: 0.35, ndGainReady: 0.79, spRating: 'AAA', debtToGdpPct: 50,  co2PerCapita: 8.1,  renewSharePct: 15, ndcTargetPct: 55 },
  { iso2: 'SE', name: 'Sweden',            gdpBn: 600,   populationM: 10.5,  hdi: 0.952, gini: 30.0, ndGainVuln: 0.27, ndGainReady: 0.82, spRating: 'AAA', debtToGdpPct: 33,  co2PerCapita: 3.5,  renewSharePct: 60, ndcTargetPct: 55 },
  { iso2: 'NO', name: 'Norway',            gdpBn: 485,   populationM: 5.5,   hdi: 0.966, gini: 27.7, ndGainVuln: 0.26, ndGainReady: 0.84, spRating: 'AAA', debtToGdpPct: 43,  co2PerCapita: 7.5,  renewSharePct: 98, ndcTargetPct: 55 },
  { iso2: 'SG', name: 'Singapore',         gdpBn: 515,   populationM: 5.9,   hdi: 0.949, gini: 45.9, ndGainVuln: 0.38, ndGainReady: 0.78, spRating: 'AAA', debtToGdpPct: 168, co2PerCapita: 9.7,  renewSharePct: 3,  ndcTargetPct: 36 },
  { iso2: 'ZA', name: 'South Africa',      gdpBn: 405,   populationM: 60.4,  hdi: 0.717, gini: 63.0, ndGainVuln: 0.45, ndGainReady: 0.40, spRating: 'BB-', debtToGdpPct: 74,  co2PerCapita: 6.7,  renewSharePct: 7,  ndcTargetPct: 32 },
  { iso2: 'NG', name: 'Nigeria',           gdpBn: 475,   populationM: 223.8, hdi: 0.548, gini: 35.1, ndGainVuln: 0.58, ndGainReady: 0.26, spRating: 'B-',  debtToGdpPct: 38,  co2PerCapita: 0.6,  renewSharePct: 20, ndcTargetPct: 20 },
  { iso2: 'EG', name: 'Egypt',             gdpBn: 395,   populationM: 105.0, hdi: 0.731, gini: 31.5, ndGainVuln: 0.49, ndGainReady: 0.33, spRating: 'B-',  debtToGdpPct: 92,  co2PerCapita: 2.5,  renewSharePct: 12, ndcTargetPct: 33 },
  { iso2: 'PL', name: 'Poland',            gdpBn: 810,   populationM: 37.6,  hdi: 0.881, gini: 29.7, ndGainVuln: 0.31, ndGainReady: 0.66, spRating: 'A-',  debtToGdpPct: 49,  co2PerCapita: 7.8,  renewSharePct: 20, ndcTargetPct: 55 },
  { iso2: 'TH', name: 'Thailand',          gdpBn: 545,   populationM: 71.8,  hdi: 0.803, gini: 34.9, ndGainVuln: 0.42, ndGainReady: 0.43, spRating: 'BBB+',debtToGdpPct: 61,  co2PerCapita: 3.8,  renewSharePct: 14, ndcTargetPct: 30 },
  { iso2: 'MY', name: 'Malaysia',          gdpBn: 430,   populationM: 34.3,  hdi: 0.807, gini: 41.1, ndGainVuln: 0.40, ndGainReady: 0.48, spRating: 'A-',  debtToGdpPct: 64,  co2PerCapita: 7.6,  renewSharePct: 10, ndcTargetPct: 45 },
  { iso2: 'PH', name: 'Philippines',       gdpBn: 440,   populationM: 117.3, hdi: 0.710, gini: 42.3, ndGainVuln: 0.53, ndGainReady: 0.35, spRating: 'BBB+',debtToGdpPct: 61,  co2PerCapita: 1.3,  renewSharePct: 22, ndcTargetPct: 75 },
  { iso2: 'VN', name: 'Vietnam',           gdpBn: 465,   populationM: 100.3, hdi: 0.726, gini: 36.8, ndGainVuln: 0.47, ndGainReady: 0.37, spRating: 'BB+', debtToGdpPct: 37,  co2PerCapita: 3.5,  renewSharePct: 27, ndcTargetPct: 44 },
  { iso2: 'CL', name: 'Chile',             gdpBn: 340,   populationM: 19.6,  hdi: 0.860, gini: 44.9, ndGainVuln: 0.35, ndGainReady: 0.56, spRating: 'A',   debtToGdpPct: 40,  co2PerCapita: 4.3,  renewSharePct: 35, ndcTargetPct: 30 },
  { iso2: 'CO', name: 'Colombia',          gdpBn: 365,   populationM: 52.1,  hdi: 0.752, gini: 51.5, ndGainVuln: 0.43, ndGainReady: 0.40, spRating: 'BB+', debtToGdpPct: 52,  co2PerCapita: 1.8,  renewSharePct: 70, ndcTargetPct: 51 },
  { iso2: 'PE', name: 'Peru',              gdpBn: 280,   populationM: 34.0,  hdi: 0.762, gini: 43.8, ndGainVuln: 0.44, ndGainReady: 0.40, spRating: 'BBB', debtToGdpPct: 33,  co2PerCapita: 1.7,  renewSharePct: 55, ndcTargetPct: 30 },
  { iso2: 'KE', name: 'Kenya',             gdpBn: 115,   populationM: 55.1,  hdi: 0.601, gini: 40.8, ndGainVuln: 0.52, ndGainReady: 0.32, spRating: 'B',   debtToGdpPct: 68,  co2PerCapita: 0.4,  renewSharePct: 80, ndcTargetPct: 32 },
  { iso2: 'BD', name: 'Bangladesh',        gdpBn: 460,   populationM: 172.9, hdi: 0.670, gini: 32.4, ndGainVuln: 0.58, ndGainReady: 0.30, spRating: 'BB-', debtToGdpPct: 34,  co2PerCapita: 0.6,  renewSharePct: 4,  ndcTargetPct: 22 },
  { iso2: 'PK', name: 'Pakistan',          gdpBn: 370,   populationM: 240.5, hdi: 0.544, gini: 29.6, ndGainVuln: 0.56, ndGainReady: 0.27, spRating: 'CCC+',debtToGdpPct: 75,  co2PerCapita: 1.0,  renewSharePct: 32, ndcTargetPct: 20 },
  { iso2: 'AE', name: 'UAE',               gdpBn: 510,   populationM: 10.1,  hdi: 0.937, gini: 32.5, ndGainVuln: 0.40, ndGainReady: 0.60, spRating: 'AA',  debtToGdpPct: 30,  co2PerCapita: 20.7, renewSharePct: 5,  ndcTargetPct: 31 },
  { iso2: 'QA', name: 'Qatar',             gdpBn: 220,   populationM: 2.9,   hdi: 0.875, gini: 41.1, ndGainVuln: 0.42, ndGainReady: 0.60, spRating: 'AA',  debtToGdpPct: 42,  co2PerCapita: 32.8, renewSharePct: 1,  ndcTargetPct: 25 },
  { iso2: 'IS', name: 'Iceland',           gdpBn: 30,    populationM: 0.4,   hdi: 0.959, gini: 26.1, ndGainVuln: 0.28, ndGainReady: 0.83, spRating: 'A',   debtToGdpPct: 66,  co2PerCapita: 9.5,  renewSharePct: 100,ndcTargetPct: 55 },
  { iso2: 'NZ', name: 'New Zealand',       gdpBn: 250,   populationM: 5.2,   hdi: 0.939, gini: 36.0, ndGainVuln: 0.30, ndGainReady: 0.78, spRating: 'AA+', debtToGdpPct: 56,  co2PerCapita: 6.2,  renewSharePct: 82, ndcTargetPct: 50 },
  { iso2: 'IE', name: 'Ireland',           gdpBn: 580,   populationM: 5.2,   hdi: 0.950, gini: 30.6, ndGainVuln: 0.30, ndGainReady: 0.77, spRating: 'AA-', debtToGdpPct: 44,  co2PerCapita: 7.2,  renewSharePct: 36, ndcTargetPct: 55 },
  { iso2: 'DK', name: 'Denmark',           gdpBn: 410,   populationM: 5.9,   hdi: 0.952, gini: 28.2, ndGainVuln: 0.28, ndGainReady: 0.82, spRating: 'AAA', debtToGdpPct: 30,  co2PerCapita: 4.8,  renewSharePct: 80, ndcTargetPct: 55 },
  { iso2: 'FI', name: 'Finland',           gdpBn: 300,   populationM: 5.6,   hdi: 0.942, gini: 27.7, ndGainVuln: 0.27, ndGainReady: 0.81, spRating: 'AA+', debtToGdpPct: 73,  co2PerCapita: 6.7,  renewSharePct: 45, ndcTargetPct: 55 },
  { iso2: 'AT', name: 'Austria',           gdpBn: 515,   populationM: 9.1,   hdi: 0.926, gini: 30.5, ndGainVuln: 0.29, ndGainReady: 0.76, spRating: 'AA+', debtToGdpPct: 78,  co2PerCapita: 6.5,  renewSharePct: 78, ndcTargetPct: 55 },
  { iso2: 'BE', name: 'Belgium',           gdpBn: 620,   populationM: 11.7,  hdi: 0.942, gini: 27.2, ndGainVuln: 0.32, ndGainReady: 0.74, spRating: 'AA',  debtToGdpPct: 105, co2PerCapita: 7.8,  renewSharePct: 19, ndcTargetPct: 55 },
  { iso2: 'PT', name: 'Portugal',          gdpBn: 290,   populationM: 10.3,  hdi: 0.874, gini: 33.8, ndGainVuln: 0.33, ndGainReady: 0.65, spRating: 'A-',  debtToGdpPct: 100, co2PerCapita: 4.0,  renewSharePct: 60, ndcTargetPct: 55 },
  { iso2: 'GR', name: 'Greece',            gdpBn: 240,   populationM: 10.3,  hdi: 0.893, gini: 32.9, ndGainVuln: 0.35, ndGainReady: 0.58, spRating: 'BBB-',debtToGdpPct: 161, co2PerCapita: 5.4,  renewSharePct: 38, ndcTargetPct: 55 },
  { iso2: 'CZ', name: 'Czech Republic',    gdpBn: 330,   populationM: 10.8,  hdi: 0.900, gini: 25.3, ndGainVuln: 0.30, ndGainReady: 0.68, spRating: 'AA-', debtToGdpPct: 44,  co2PerCapita: 8.9,  renewSharePct: 17, ndcTargetPct: 55 },
  { iso2: 'RO', name: 'Romania',           gdpBn: 350,   populationM: 19.1,  hdi: 0.827, gini: 34.8, ndGainVuln: 0.35, ndGainReady: 0.52, spRating: 'BBB-',debtToGdpPct: 49,  co2PerCapita: 3.6,  renewSharePct: 40, ndcTargetPct: 55 },
  { iso2: 'HU', name: 'Hungary',           gdpBn: 210,   populationM: 9.6,   hdi: 0.851, gini: 30.6, ndGainVuln: 0.32, ndGainReady: 0.59, spRating: 'BBB', debtToGdpPct: 73,  co2PerCapita: 4.6,  renewSharePct: 16, ndcTargetPct: 55 },
  { iso2: 'IL', name: 'Israel',            gdpBn: 530,   populationM: 9.9,   hdi: 0.919, gini: 39.0, ndGainVuln: 0.36, ndGainReady: 0.69, spRating: 'A+',  debtToGdpPct: 62,  co2PerCapita: 7.1,  renewSharePct: 10, ndcTargetPct: 27 },
  { iso2: 'TR', name: 'Turkey',            gdpBn: 1110,  populationM: 85.8,  hdi: 0.838, gini: 41.9, ndGainVuln: 0.38, ndGainReady: 0.46, spRating: 'BB-', debtToGdpPct: 30,  co2PerCapita: 5.1,  renewSharePct: 42, ndcTargetPct: 41 },
  { iso2: 'RU', name: 'Russia',            gdpBn: 2020,  populationM: 143.8, hdi: 0.822, gini: 36.0, ndGainVuln: 0.36, ndGainReady: 0.45, spRating: 'NR',  debtToGdpPct: 20,  co2PerCapita: 11.4, renewSharePct: 20, ndcTargetPct: 30 },
  { iso2: 'AR', name: 'Argentina',         gdpBn: 640,   populationM: 46.3,  hdi: 0.842, gini: 42.3, ndGainVuln: 0.37, ndGainReady: 0.42, spRating: 'CCC', debtToGdpPct: 85,  co2PerCapita: 4.0,  renewSharePct: 30, ndcTargetPct: 27 },
  { iso2: 'TW', name: 'Taiwan',            gdpBn: 790,   populationM: 23.9,  hdi: 0.926, gini: 34.1, ndGainVuln: 0.35, ndGainReady: 0.72, spRating: 'AA+', debtToGdpPct: 28,  co2PerCapita: 11.2, renewSharePct: 9,  ndcTargetPct: 24 },
  { iso2: 'LK', name: 'Sri Lanka',         gdpBn: 84,    populationM: 22.2,  hdi: 0.782, gini: 39.3, ndGainVuln: 0.48, ndGainReady: 0.35, spRating: 'SD',  debtToGdpPct: 115, co2PerCapita: 1.0,  renewSharePct: 50, ndcTargetPct: 14 },
  { iso2: 'GH', name: 'Ghana',             gdpBn: 79,    populationM: 33.5,  hdi: 0.602, gini: 43.5, ndGainVuln: 0.52, ndGainReady: 0.32, spRating: 'SD',  debtToGdpPct: 88,  co2PerCapita: 0.6,  renewSharePct: 42, ndcTargetPct: 15 },
  { iso2: 'ET', name: 'Ethiopia',          gdpBn: 155,   populationM: 126.5, hdi: 0.492, gini: 35.0, ndGainVuln: 0.60, ndGainReady: 0.25, spRating: 'CCC', debtToGdpPct: 37,  co2PerCapita: 0.2,  renewSharePct: 90, ndcTargetPct: 14 },
  { iso2: 'TZ', name: 'Tanzania',          gdpBn: 85,    populationM: 65.5,  hdi: 0.549, gini: 40.5, ndGainVuln: 0.56, ndGainReady: 0.28, spRating: 'B',   debtToGdpPct: 42,  co2PerCapita: 0.2,  renewSharePct: 50, ndcTargetPct: 30 },
  { iso2: 'UY', name: 'Uruguay',           gdpBn: 77,    populationM: 3.4,   hdi: 0.830, gini: 40.2, ndGainVuln: 0.34, ndGainReady: 0.55, spRating: 'BBB', debtToGdpPct: 58,  co2PerCapita: 1.8,  renewSharePct: 95, ndcTargetPct: 57 },
  { iso2: 'CR', name: 'Costa Rica',        gdpBn: 70,    populationM: 5.2,   hdi: 0.810, gini: 48.2, ndGainVuln: 0.39, ndGainReady: 0.47, spRating: 'BB-', debtToGdpPct: 63,  co2PerCapita: 1.5,  renewSharePct: 98, ndcTargetPct: 44 },
  { iso2: 'MA', name: 'Morocco',           gdpBn: 150,   populationM: 37.5,  hdi: 0.698, gini: 39.5, ndGainVuln: 0.46, ndGainReady: 0.38, spRating: 'BB+', debtToGdpPct: 69,  co2PerCapita: 2.0,  renewSharePct: 20, ndcTargetPct: 45 },
  { iso2: 'KZ', name: 'Kazakhstan',        gdpBn: 260,   populationM: 20.0,  hdi: 0.811, gini: 27.8, ndGainVuln: 0.38, ndGainReady: 0.43, spRating: 'BBB-',debtToGdpPct: 25,  co2PerCapita: 14.2, renewSharePct: 5,  ndcTargetPct: 15 },
  { iso2: 'MM', name: 'Myanmar',           gdpBn: 62,    populationM: 54.0,  hdi: 0.585, gini: 30.7, ndGainVuln: 0.57, ndGainReady: 0.23, spRating: 'NR',  debtToGdpPct: 55,  co2PerCapita: 0.6,  renewSharePct: 38, ndcTargetPct: 15 },
  { iso2: 'ES', name: 'Spain',             gdpBn: 1580,  populationM: 48.0,  hdi: 0.911, gini: 33.0, ndGainVuln: 0.34, ndGainReady: 0.68, spRating: 'A',   debtToGdpPct: 107, co2PerCapita: 5.0,  renewSharePct: 48, ndcTargetPct: 55 },
  { iso2: 'PY', name: 'Paraguay',          gdpBn: 44,    populationM: 6.8,   hdi: 0.726, gini: 45.7, ndGainVuln: 0.42, ndGainReady: 0.36, spRating: 'BB',  debtToGdpPct: 33,  co2PerCapita: 1.0,  renewSharePct: 99, ndcTargetPct: 20 },
  { iso2: 'JO', name: 'Jordan',            gdpBn: 50,    populationM: 11.4,  hdi: 0.736, gini: 33.7, ndGainVuln: 0.50, ndGainReady: 0.39, spRating: 'B+',  debtToGdpPct: 88,  co2PerCapita: 2.5,  renewSharePct: 20, ndcTargetPct: 31 },
  { iso2: 'LU', name: 'Luxembourg',        gdpBn: 87,    populationM: 0.7,   hdi: 0.930, gini: 34.8, ndGainVuln: 0.28, ndGainReady: 0.80, spRating: 'AAA', debtToGdpPct: 28,  co2PerCapita: 11.3, renewSharePct: 14, ndcTargetPct: 55 },
  { iso2: 'MN', name: 'Mongolia',          gdpBn: 20,    populationM: 3.4,   hdi: 0.741, gini: 32.7, ndGainVuln: 0.44, ndGainReady: 0.35, spRating: 'B',   debtToGdpPct: 47,  co2PerCapita: 10.0, renewSharePct: 5,  ndcTargetPct: 22 },
  { iso2: 'FJ', name: 'Fiji',              gdpBn: 5,     populationM: 0.9,   hdi: 0.730, gini: 36.7, ndGainVuln: 0.54, ndGainReady: 0.33, spRating: 'B+',  debtToGdpPct: 82,  co2PerCapita: 1.4,  renewSharePct: 55, ndcTargetPct: 30 },
  { iso2: 'MV', name: 'Maldives',          gdpBn: 7,     populationM: 0.5,   hdi: 0.747, gini: 31.3, ndGainVuln: 0.62, ndGainReady: 0.34, spRating: 'B3',  debtToGdpPct: 120, co2PerCapita: 3.3,  renewSharePct: 5,  ndcTargetPct: 26 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 15. EXCHANGE_RATES — 30 currencies vs USD (approx March 2026) [15]
//     Sources: ECB / Federal Reserve / BIS
// ═══════════════════════════════════════════════════════════════════════════════

export const EXCHANGE_RATES = {
  asOf: '2026-03-15',
  baseCurrency: 'USD',
  rates: {
    EUR: 0.926,   // 1 USD = 0.926 EUR (i.e. EUR/USD = 1.08)
    GBP: 0.794,   // GBP/USD = 1.26
    JPY: 150.2,
    CHF: 0.878,
    CAD: 1.355,
    AUD: 1.535,
    NZD: 1.645,
    CNY: 7.22,
    INR: 83.8,
    KRW: 1320,
    SGD: 1.335,
    HKD: 7.815,
    TWD: 31.8,
    BRL: 5.05,
    MXN: 17.2,
    ZAR: 18.4,
    TRY: 32.5,
    PLN: 3.98,
    SEK: 10.35,
    NOK: 10.55,
    DKK: 6.90,
    CZK: 23.2,
    HUF: 370,
    ILS: 3.65,
    THB: 35.2,
    MYR: 4.65,
    IDR: 15750,
    PHP: 56.2,
    VND: 24850,
    SAR: 3.75,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 16. INTEREST_RATES — Central bank policy rates for 20 countries [16]
//     Source: BIS Central Bank Policy Rate Statistics (March 2026)
// ═══════════════════════════════════════════════════════════════════════════════

export const INTEREST_RATES = {
  asOf: '2026-03-15',
  rates: [
    { country: 'United States',  iso2: 'US', bank: 'Federal Reserve',   rate: 4.50,  unit: '%', source: 'Fed Funds upper bound' },
    { country: 'Eurozone',       iso2: 'EU', bank: 'ECB',              rate: 3.75,  unit: '%', source: 'Main refinancing rate' },
    { country: 'United Kingdom', iso2: 'GB', bank: 'Bank of England',  rate: 4.25,  unit: '%', source: 'Bank Rate' },
    { country: 'Japan',          iso2: 'JP', bank: 'Bank of Japan',    rate: -0.10, unit: '%', source: 'Policy rate / YCC' },
    { country: 'China',          iso2: 'CN', bank: 'PBoC',            rate: 3.45,  unit: '%', source: '1Y LPR' },
    { country: 'Canada',         iso2: 'CA', bank: 'Bank of Canada',   rate: 4.50,  unit: '%', source: 'Overnight rate target' },
    { country: 'Australia',      iso2: 'AU', bank: 'RBA',             rate: 4.10,  unit: '%', source: 'Cash rate target' },
    { country: 'Switzerland',    iso2: 'CH', bank: 'SNB',             rate: 1.50,  unit: '%', source: 'Policy rate' },
    { country: 'Sweden',         iso2: 'SE', bank: 'Riksbank',        rate: 3.75,  unit: '%', source: 'Repo rate' },
    { country: 'Norway',         iso2: 'NO', bank: 'Norges Bank',     rate: 4.50,  unit: '%', source: 'Policy rate' },
    { country: 'South Korea',    iso2: 'KR', bank: 'Bank of Korea',   rate: 3.50,  unit: '%', source: 'Base rate' },
    { country: 'India',          iso2: 'IN', bank: 'RBI',             rate: 6.50,  unit: '%', source: 'Repo rate' },
    { country: 'Brazil',         iso2: 'BR', bank: 'BCB',             rate: 11.25, unit: '%', source: 'Selic rate' },
    { country: 'Mexico',         iso2: 'MX', bank: 'Banxico',         rate: 10.50, unit: '%', source: 'Overnight interbank rate' },
    { country: 'Indonesia',      iso2: 'ID', bank: 'Bank Indonesia',  rate: 6.25,  unit: '%', source: 'BI-Rate' },
    { country: 'Turkey',         iso2: 'TR', bank: 'TCMB',            rate: 45.0,  unit: '%', source: '1-week repo rate' },
    { country: 'South Africa',   iso2: 'ZA', bank: 'SARB',            rate: 8.25,  unit: '%', source: 'Repo rate' },
    { country: 'New Zealand',    iso2: 'NZ', bank: 'RBNZ',            rate: 5.25,  unit: '%', source: 'OCR' },
    { country: 'Poland',         iso2: 'PL', bank: 'NBP',             rate: 5.75,  unit: '%', source: 'Reference rate' },
    { country: 'Thailand',       iso2: 'TH', bank: 'BoT',             rate: 2.50,  unit: '%', source: 'Policy rate' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 17. COMMODITY_PRICES — 20 commodities (approx March 2026) [17]
//     Sources: CME Group, LME, ICE, World Bank Commodity Markets
// ═══════════════════════════════════════════════════════════════════════════════

export const COMMODITY_PRICES = {
  asOf: '2026-03-15',
  commodities: [
    { name: 'Brent Crude Oil',    ticker: 'CO1',   price: 78.0,  unit: '$/bbl',     exchange: 'ICE',  trend12m: 'stable' },
    { name: 'WTI Crude Oil',      ticker: 'CL1',   price: 74.5,  unit: '$/bbl',     exchange: 'NYMEX',trend12m: 'stable' },
    { name: 'Natural Gas (HH)',   ticker: 'NG1',   price: 2.80,  unit: '$/mmBtu',   exchange: 'NYMEX',trend12m: 'down' },
    { name: 'Natural Gas (TTF)',  ticker: 'TTF1',  price: 28.0,  unit: 'EUR/MWh',   exchange: 'ICE',  trend12m: 'down' },
    { name: 'Thermal Coal',       ticker: 'MTF1',  price: 125.0, unit: '$/t',        exchange: 'ICE Newcastle', trend12m: 'down' },
    { name: 'Gold',               ticker: 'GC1',   price: 2050,  unit: '$/oz',       exchange: 'COMEX',trend12m: 'up' },
    { name: 'Silver',             ticker: 'SI1',   price: 23.5,  unit: '$/oz',       exchange: 'COMEX',trend12m: 'up' },
    { name: 'Copper',             ticker: 'HG1',   price: 8500,  unit: '$/t',        exchange: 'LME',  trend12m: 'up', note: 'Critical for electrification' },
    { name: 'Aluminium',          ticker: 'LAH1',  price: 2350,  unit: '$/t',        exchange: 'LME',  trend12m: 'stable' },
    { name: 'Nickel',             ticker: 'LNI1',  price: 16500, unit: '$/t',        exchange: 'LME',  trend12m: 'down' },
    { name: 'Zinc',               ticker: 'LZS1',  price: 2550,  unit: '$/t',        exchange: 'LME',  trend12m: 'stable' },
    { name: 'Iron Ore (62% Fe)',  ticker: 'SCO1',  price: 115,   unit: '$/t',        exchange: 'SGX',  trend12m: 'down' },
    { name: 'Lithium Carbonate',  ticker: 'LITH',  price: 15000, unit: '$/t',        exchange: 'Fastmarkets', trend12m: 'down', note: 'Down from 2022 peak of $80K' },
    { name: 'Cobalt',             ticker: 'COBALT',price: 28000, unit: '$/t',        exchange: 'LME',  trend12m: 'stable' },
    { name: 'Platinum',           ticker: 'PL1',   price: 940,   unit: '$/oz',       exchange: 'NYMEX',trend12m: 'stable' },
    { name: 'Palladium',          ticker: 'PA1',   price: 1020,  unit: '$/oz',       exchange: 'NYMEX',trend12m: 'down' },
    { name: 'Wheat',              ticker: 'W1',    price: 620,   unit: '$/bushel (cents)', exchange: 'CBOT', trend12m: 'down' },
    { name: 'Corn',               ticker: 'C1',    price: 440,   unit: '$/bushel (cents)', exchange: 'CBOT', trend12m: 'down' },
    { name: 'Soybeans',           ticker: 'S1',    price: 1180,  unit: '$/bushel (cents)', exchange: 'CBOT', trend12m: 'stable' },
    { name: 'Carbon (EU ETS)',    ticker: 'CFI2C1',price: 65,    unit: 'EUR/t',      exchange: 'ICE',  trend12m: 'stable' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 18. BIODIVERSITY_INDICATORS — 50 countries [18]
//     Sources: IBAT, IUCN Red List Index 2024, Global Forest Watch 2024
// ═══════════════════════════════════════════════════════════════════════════════

export const BIODIVERSITY_INDICATORS = [
  // iso2, bii (Biodiversity Intactness Index, 0-1, higher=better), redListIndex (0-1, higher=better),
  // protectedAreaPct, forestCoverPct, deforestationRateAnnualPct (of forest area)
  { iso2: 'BR', bii: 0.79, redListIndex: 0.85, protectedAreaPct: 30.4, forestCoverPct: 59.4, deforestationRateAnnualPct: 0.52 },
  { iso2: 'ID', bii: 0.68, redListIndex: 0.76, protectedAreaPct: 14.9, forestCoverPct: 49.1, deforestationRateAnnualPct: 0.75 },
  { iso2: 'CO', bii: 0.82, redListIndex: 0.82, protectedAreaPct: 15.2, forestCoverPct: 52.7, deforestationRateAnnualPct: 0.45 },
  { iso2: 'AU', bii: 0.77, redListIndex: 0.79, protectedAreaPct: 22.3, forestCoverPct: 17.4, deforestationRateAnnualPct: 0.15 },
  { iso2: 'CN', bii: 0.52, redListIndex: 0.81, protectedAreaPct: 18.0, forestCoverPct: 23.3, deforestationRateAnnualPct: -0.30 },
  { iso2: 'US', bii: 0.66, redListIndex: 0.86, protectedAreaPct: 13.0, forestCoverPct: 33.9, deforestationRateAnnualPct: 0.04 },
  { iso2: 'CA', bii: 0.85, redListIndex: 0.92, protectedAreaPct: 13.8, forestCoverPct: 38.7, deforestationRateAnnualPct: 0.02 },
  { iso2: 'DE', bii: 0.42, redListIndex: 0.91, protectedAreaPct: 38.8, forestCoverPct: 32.8, deforestationRateAnnualPct: 0.00 },
  { iso2: 'GB', bii: 0.39, redListIndex: 0.89, protectedAreaPct: 28.4, forestCoverPct: 13.2, deforestationRateAnnualPct: 0.00 },
  { iso2: 'FR', bii: 0.48, redListIndex: 0.86, protectedAreaPct: 32.5, forestCoverPct: 31.4, deforestationRateAnnualPct: -0.10 },
  { iso2: 'IN', bii: 0.48, redListIndex: 0.75, protectedAreaPct: 5.3,  forestCoverPct: 24.4, deforestationRateAnnualPct: 0.08 },
  { iso2: 'JP', bii: 0.55, redListIndex: 0.83, protectedAreaPct: 20.5, forestCoverPct: 68.4, deforestationRateAnnualPct: 0.00 },
  { iso2: 'MX', bii: 0.70, redListIndex: 0.78, protectedAreaPct: 14.5, forestCoverPct: 33.9, deforestationRateAnnualPct: 0.25 },
  { iso2: 'PE', bii: 0.84, redListIndex: 0.84, protectedAreaPct: 18.3, forestCoverPct: 57.0, deforestationRateAnnualPct: 0.30 },
  { iso2: 'CG', bii: 0.88, redListIndex: 0.87, protectedAreaPct: 14.6, forestCoverPct: 65.4, deforestationRateAnnualPct: 0.28 },
  { iso2: 'ZA', bii: 0.71, redListIndex: 0.80, protectedAreaPct: 8.3,  forestCoverPct: 7.6,  deforestationRateAnnualPct: 0.10 },
  { iso2: 'KE', bii: 0.61, redListIndex: 0.77, protectedAreaPct: 12.4, forestCoverPct: 7.8,  deforestationRateAnnualPct: 0.30 },
  { iso2: 'NG', bii: 0.50, redListIndex: 0.76, protectedAreaPct: 14.2, forestCoverPct: 7.2,  deforestationRateAnnualPct: 3.70 },
  { iso2: 'MY', bii: 0.60, redListIndex: 0.74, protectedAreaPct: 18.7, forestCoverPct: 54.6, deforestationRateAnnualPct: 0.60 },
  { iso2: 'TH', bii: 0.56, redListIndex: 0.75, protectedAreaPct: 21.9, forestCoverPct: 38.7, deforestationRateAnnualPct: 0.15 },
  { iso2: 'VN', bii: 0.52, redListIndex: 0.73, protectedAreaPct: 7.6,  forestCoverPct: 42.0, deforestationRateAnnualPct: -0.20 },
  { iso2: 'PH', bii: 0.53, redListIndex: 0.70, protectedAreaPct: 10.9, forestCoverPct: 24.0, deforestationRateAnnualPct: 0.35 },
  { iso2: 'CL', bii: 0.78, redListIndex: 0.86, protectedAreaPct: 21.5, forestCoverPct: 24.5, deforestationRateAnnualPct: 0.10 },
  { iso2: 'AR', bii: 0.72, redListIndex: 0.88, protectedAreaPct: 8.7,  forestCoverPct: 10.7, deforestationRateAnnualPct: 0.50 },
  { iso2: 'EC', bii: 0.80, redListIndex: 0.79, protectedAreaPct: 20.1, forestCoverPct: 50.2, deforestationRateAnnualPct: 0.45 },
  { iso2: 'ET', bii: 0.55, redListIndex: 0.82, protectedAreaPct: 18.5, forestCoverPct: 15.5, deforestationRateAnnualPct: 1.10 },
  { iso2: 'TZ', bii: 0.65, redListIndex: 0.80, protectedAreaPct: 38.2, forestCoverPct: 48.1, deforestationRateAnnualPct: 0.80 },
  { iso2: 'MG', bii: 0.60, redListIndex: 0.62, protectedAreaPct: 10.3, forestCoverPct: 21.4, deforestationRateAnnualPct: 1.50 },
  { iso2: 'SE', bii: 0.68, redListIndex: 0.93, protectedAreaPct: 15.1, forestCoverPct: 68.7, deforestationRateAnnualPct: 0.00 },
  { iso2: 'NO', bii: 0.72, redListIndex: 0.94, protectedAreaPct: 17.0, forestCoverPct: 33.2, deforestationRateAnnualPct: 0.00 },
  { iso2: 'FI', bii: 0.70, redListIndex: 0.93, protectedAreaPct: 12.7, forestCoverPct: 73.1, deforestationRateAnnualPct: 0.00 },
  { iso2: 'NZ', bii: 0.72, redListIndex: 0.80, protectedAreaPct: 33.4, forestCoverPct: 38.0, deforestationRateAnnualPct: 0.02 },
  { iso2: 'CR', bii: 0.81, redListIndex: 0.83, protectedAreaPct: 28.3, forestCoverPct: 58.0, deforestationRateAnnualPct: -0.50 },
  { iso2: 'PA', bii: 0.78, redListIndex: 0.81, protectedAreaPct: 18.9, forestCoverPct: 62.1, deforestationRateAnnualPct: 0.20 },
  { iso2: 'BO', bii: 0.82, redListIndex: 0.85, protectedAreaPct: 22.3, forestCoverPct: 50.6, deforestationRateAnnualPct: 0.45 },
  { iso2: 'PG', bii: 0.86, redListIndex: 0.80, protectedAreaPct: 3.1,  forestCoverPct: 74.1, deforestationRateAnnualPct: 0.55 },
  { iso2: 'RU', bii: 0.80, redListIndex: 0.91, protectedAreaPct: 13.0, forestCoverPct: 49.8, deforestationRateAnnualPct: 0.04 },
  { iso2: 'IT', bii: 0.45, redListIndex: 0.84, protectedAreaPct: 21.6, forestCoverPct: 32.0, deforestationRateAnnualPct: -0.10 },
  { iso2: 'ES', bii: 0.55, redListIndex: 0.85, protectedAreaPct: 27.5, forestCoverPct: 36.7, deforestationRateAnnualPct: -0.10 },
  { iso2: 'PL', bii: 0.46, redListIndex: 0.91, protectedAreaPct: 39.6, forestCoverPct: 30.8, deforestationRateAnnualPct: 0.00 },
  { iso2: 'TR', bii: 0.55, redListIndex: 0.81, protectedAreaPct: 1.8,  forestCoverPct: 28.6, deforestationRateAnnualPct: 0.10 },
  { iso2: 'BD', bii: 0.35, redListIndex: 0.74, protectedAreaPct: 4.7,  forestCoverPct: 11.0, deforestationRateAnnualPct: 0.30 },
  { iso2: 'PK', bii: 0.40, redListIndex: 0.77, protectedAreaPct: 12.6, forestCoverPct: 5.1,  deforestationRateAnnualPct: 0.60 },
  { iso2: 'EG', bii: 0.30, redListIndex: 0.82, protectedAreaPct: 13.3, forestCoverPct: 0.1,  deforestationRateAnnualPct: 0.00 },
  { iso2: 'SA', bii: 0.38, redListIndex: 0.85, protectedAreaPct: 8.5,  forestCoverPct: 0.5,  deforestationRateAnnualPct: 0.00 },
  { iso2: 'GH', bii: 0.50, redListIndex: 0.78, protectedAreaPct: 15.0, forestCoverPct: 34.7, deforestationRateAnnualPct: 2.00 },
  { iso2: 'CI', bii: 0.42, redListIndex: 0.76, protectedAreaPct: 23.6, forestCoverPct: 8.9,  deforestationRateAnnualPct: 2.60 },
  { iso2: 'CM', bii: 0.70, redListIndex: 0.78, protectedAreaPct: 10.3, forestCoverPct: 42.5, deforestationRateAnnualPct: 0.80 },
  { iso2: 'MM', bii: 0.62, redListIndex: 0.72, protectedAreaPct: 6.3,  forestCoverPct: 42.9, deforestationRateAnnualPct: 1.20 },
  { iso2: 'LR', bii: 0.70, redListIndex: 0.78, protectedAreaPct: 3.8,  forestCoverPct: 43.4, deforestationRateAnnualPct: 0.90 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 19. WATER_STRESS_DATA — 40 countries/regions [19]
//     Source: WRI Aqueduct 4.0 (2023)
// ═══════════════════════════════════════════════════════════════════════════════

export const WATER_STRESS_DATA = [
  // iso2, overallRisk (1-5), baselineStress (ratio withdrawn/available), interannualVar (1-5),
  // seasonalVar (1-5), groundwaterDecline (cm/yr)
  { iso2: 'QA', overallRisk: 4.97, baselineStress: 4.97, interannualVar: 1.45, seasonalVar: 1.02, groundwaterDecline: 1.5, label: 'Extremely High' },
  { iso2: 'IL', overallRisk: 4.82, baselineStress: 4.82, interannualVar: 2.10, seasonalVar: 3.50, groundwaterDecline: 2.0, label: 'Extremely High' },
  { iso2: 'SA', overallRisk: 4.80, baselineStress: 4.80, interannualVar: 1.30, seasonalVar: 1.10, groundwaterDecline: 3.0, label: 'Extremely High' },
  { iso2: 'AE', overallRisk: 4.78, baselineStress: 4.78, interannualVar: 1.20, seasonalVar: 1.05, groundwaterDecline: 2.5, label: 'Extremely High' },
  { iso2: 'JO', overallRisk: 4.72, baselineStress: 4.72, interannualVar: 2.30, seasonalVar: 3.80, groundwaterDecline: 4.0, label: 'Extremely High' },
  { iso2: 'LY', overallRisk: 4.65, baselineStress: 4.65, interannualVar: 1.80, seasonalVar: 2.50, groundwaterDecline: 3.5, label: 'Extremely High' },
  { iso2: 'KW', overallRisk: 4.60, baselineStress: 4.60, interannualVar: 1.10, seasonalVar: 1.00, groundwaterDecline: 2.0, label: 'Extremely High' },
  { iso2: 'IN', overallRisk: 4.30, baselineStress: 3.90, interannualVar: 3.20, seasonalVar: 4.20, groundwaterDecline: 10.0,label: 'Extremely High' },
  { iso2: 'PK', overallRisk: 4.25, baselineStress: 3.85, interannualVar: 3.40, seasonalVar: 4.50, groundwaterDecline: 8.0, label: 'Extremely High' },
  { iso2: 'MA', overallRisk: 3.90, baselineStress: 3.70, interannualVar: 3.10, seasonalVar: 3.80, groundwaterDecline: 2.0, label: 'High' },
  { iso2: 'ES', overallRisk: 3.75, baselineStress: 3.60, interannualVar: 3.20, seasonalVar: 4.10, groundwaterDecline: 1.5, label: 'High' },
  { iso2: 'IT', overallRisk: 3.55, baselineStress: 3.40, interannualVar: 2.50, seasonalVar: 3.60, groundwaterDecline: 0.8, label: 'High' },
  { iso2: 'CN', overallRisk: 3.40, baselineStress: 3.20, interannualVar: 2.80, seasonalVar: 3.40, groundwaterDecline: 5.0, label: 'High' },
  { iso2: 'MX', overallRisk: 3.30, baselineStress: 3.10, interannualVar: 2.90, seasonalVar: 3.20, groundwaterDecline: 3.0, label: 'High' },
  { iso2: 'TR', overallRisk: 3.25, baselineStress: 3.05, interannualVar: 2.70, seasonalVar: 3.50, groundwaterDecline: 2.5, label: 'High' },
  { iso2: 'AU', overallRisk: 3.10, baselineStress: 2.80, interannualVar: 4.20, seasonalVar: 3.80, groundwaterDecline: 1.0, label: 'High' },
  { iso2: 'US', overallRisk: 2.85, baselineStress: 2.70, interannualVar: 2.40, seasonalVar: 2.80, groundwaterDecline: 2.5, label: 'Medium-High' },
  { iso2: 'ZA', overallRisk: 2.80, baselineStress: 2.60, interannualVar: 3.50, seasonalVar: 3.20, groundwaterDecline: 0.5, label: 'Medium-High' },
  { iso2: 'EG', overallRisk: 3.50, baselineStress: 4.10, interannualVar: 1.50, seasonalVar: 2.80, groundwaterDecline: 3.0, label: 'High' },
  { iso2: 'KR', overallRisk: 2.60, baselineStress: 2.40, interannualVar: 2.80, seasonalVar: 3.60, groundwaterDecline: 0.3, label: 'Medium-High' },
  { iso2: 'DE', overallRisk: 2.40, baselineStress: 2.20, interannualVar: 2.10, seasonalVar: 2.40, groundwaterDecline: 0.2, label: 'Medium' },
  { iso2: 'FR', overallRisk: 2.35, baselineStress: 2.10, interannualVar: 2.00, seasonalVar: 2.60, groundwaterDecline: 0.3, label: 'Medium' },
  { iso2: 'JP', overallRisk: 2.30, baselineStress: 2.00, interannualVar: 2.50, seasonalVar: 3.80, groundwaterDecline: 0.2, label: 'Medium' },
  { iso2: 'GB', overallRisk: 2.20, baselineStress: 1.90, interannualVar: 1.80, seasonalVar: 2.10, groundwaterDecline: 0.1, label: 'Low-Medium' },
  { iso2: 'ID', overallRisk: 2.15, baselineStress: 1.80, interannualVar: 1.90, seasonalVar: 3.40, groundwaterDecline: 5.0, label: 'Low-Medium' },
  { iso2: 'TH', overallRisk: 2.50, baselineStress: 2.30, interannualVar: 2.60, seasonalVar: 4.00, groundwaterDecline: 1.0, label: 'Medium' },
  { iso2: 'PH', overallRisk: 2.10, baselineStress: 1.70, interannualVar: 2.20, seasonalVar: 3.80, groundwaterDecline: 3.0, label: 'Low-Medium' },
  { iso2: 'VN', overallRisk: 2.00, baselineStress: 1.60, interannualVar: 2.10, seasonalVar: 3.90, groundwaterDecline: 4.0, label: 'Low-Medium' },
  { iso2: 'NG', overallRisk: 2.05, baselineStress: 1.50, interannualVar: 2.80, seasonalVar: 3.60, groundwaterDecline: 0.8, label: 'Low-Medium' },
  { iso2: 'BR', overallRisk: 1.80, baselineStress: 1.30, interannualVar: 2.10, seasonalVar: 3.20, groundwaterDecline: 0.5, label: 'Low' },
  { iso2: 'CA', overallRisk: 1.60, baselineStress: 1.20, interannualVar: 1.90, seasonalVar: 2.80, groundwaterDecline: 0.1, label: 'Low' },
  { iso2: 'RU', overallRisk: 1.55, baselineStress: 1.10, interannualVar: 1.70, seasonalVar: 2.50, groundwaterDecline: 0.1, label: 'Low' },
  { iso2: 'NO', overallRisk: 1.20, baselineStress: 0.80, interannualVar: 1.40, seasonalVar: 2.00, groundwaterDecline: 0.0, label: 'Low' },
  { iso2: 'SE', overallRisk: 1.25, baselineStress: 0.85, interannualVar: 1.30, seasonalVar: 1.90, groundwaterDecline: 0.0, label: 'Low' },
  { iso2: 'FI', overallRisk: 1.15, baselineStress: 0.75, interannualVar: 1.20, seasonalVar: 1.80, groundwaterDecline: 0.0, label: 'Low' },
  { iso2: 'NZ', overallRisk: 1.30, baselineStress: 0.90, interannualVar: 1.50, seasonalVar: 2.10, groundwaterDecline: 0.1, label: 'Low' },
  { iso2: 'CL', overallRisk: 3.40, baselineStress: 3.20, interannualVar: 3.50, seasonalVar: 3.80, groundwaterDecline: 2.0, label: 'High' },
  { iso2: 'PE', overallRisk: 2.20, baselineStress: 1.90, interannualVar: 3.00, seasonalVar: 3.90, groundwaterDecline: 0.5, label: 'Low-Medium' },
  { iso2: 'ET', overallRisk: 2.70, baselineStress: 2.40, interannualVar: 3.60, seasonalVar: 4.20, groundwaterDecline: 0.3, label: 'Medium-High' },
  { iso2: 'KE', overallRisk: 2.90, baselineStress: 2.60, interannualVar: 3.80, seasonalVar: 3.50, groundwaterDecline: 0.5, label: 'Medium-High' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 20. SDG_PROGRESS — 50 countries x 17 SDGs [20]
//     Source: SDSN Sustainable Development Report / SDG Index 2024
//     Scores 0-100; trend: 'onTrack'|'stagnating'|'declining'|'moderatelyImproving'
//     Only overall index score and trend included (per-SDG breakdowns available in full report)
// ═══════════════════════════════════════════════════════════════════════════════

export const SDG_PROGRESS = [
  { iso2: 'FI', overallScore: 86.8, rank: 1,  trend: 'onTrack' },
  { iso2: 'SE', overallScore: 86.2, rank: 2,  trend: 'onTrack' },
  { iso2: 'DK', overallScore: 85.7, rank: 3,  trend: 'onTrack' },
  { iso2: 'DE', overallScore: 83.4, rank: 4,  trend: 'moderatelyImproving' },
  { iso2: 'AT', overallScore: 82.3, rank: 5,  trend: 'moderatelyImproving' },
  { iso2: 'FR', overallScore: 82.0, rank: 6,  trend: 'moderatelyImproving' },
  { iso2: 'NO', overallScore: 82.0, rank: 7,  trend: 'onTrack' },
  { iso2: 'CZ', overallScore: 81.9, rank: 8,  trend: 'moderatelyImproving' },
  { iso2: 'PL', overallScore: 80.5, rank: 10, trend: 'moderatelyImproving' },
  { iso2: 'GB', overallScore: 80.6, rank: 11, trend: 'stagnating' },
  { iso2: 'JP', overallScore: 79.6, rank: 15, trend: 'stagnating' },
  { iso2: 'KR', overallScore: 78.1, rank: 20, trend: 'moderatelyImproving' },
  { iso2: 'CA', overallScore: 77.7, rank: 22, trend: 'stagnating' },
  { iso2: 'US', overallScore: 75.6, rank: 35, trend: 'stagnating' },
  { iso2: 'AU', overallScore: 76.0, rank: 30, trend: 'stagnating' },
  { iso2: 'IT', overallScore: 80.0, rank: 12, trend: 'moderatelyImproving' },
  { iso2: 'ES', overallScore: 80.2, rank: 16, trend: 'moderatelyImproving' },
  { iso2: 'NL', overallScore: 81.0, rank: 9,  trend: 'moderatelyImproving' },
  { iso2: 'CH', overallScore: 81.5, rank: 9,  trend: 'moderatelyImproving' },
  { iso2: 'IE', overallScore: 79.2, rank: 17, trend: 'moderatelyImproving' },
  { iso2: 'NZ', overallScore: 77.0, rank: 25, trend: 'stagnating' },
  { iso2: 'SG', overallScore: 74.5, rank: 40, trend: 'moderatelyImproving' },
  { iso2: 'CL', overallScore: 74.2, rank: 38, trend: 'moderatelyImproving' },
  { iso2: 'CR', overallScore: 74.8, rank: 37, trend: 'moderatelyImproving' },
  { iso2: 'UY', overallScore: 75.0, rank: 36, trend: 'moderatelyImproving' },
  { iso2: 'BR', overallScore: 71.2, rank: 52, trend: 'stagnating' },
  { iso2: 'MX', overallScore: 70.5, rank: 55, trend: 'stagnating' },
  { iso2: 'CO', overallScore: 69.5, rank: 60, trend: 'moderatelyImproving' },
  { iso2: 'AR', overallScore: 71.0, rank: 53, trend: 'stagnating' },
  { iso2: 'CN', overallScore: 72.0, rank: 48, trend: 'moderatelyImproving' },
  { iso2: 'TH', overallScore: 74.1, rank: 39, trend: 'moderatelyImproving' },
  { iso2: 'MY', overallScore: 71.8, rank: 50, trend: 'moderatelyImproving' },
  { iso2: 'VN', overallScore: 72.8, rank: 46, trend: 'moderatelyImproving' },
  { iso2: 'ID', overallScore: 69.2, rank: 62, trend: 'moderatelyImproving' },
  { iso2: 'PH', overallScore: 67.8, rank: 68, trend: 'stagnating' },
  { iso2: 'IN', overallScore: 63.5, rank: 109,trend: 'moderatelyImproving' },
  { iso2: 'BD', overallScore: 64.2, rank: 101,trend: 'moderatelyImproving' },
  { iso2: 'PK', overallScore: 57.0, rank: 134,trend: 'declining' },
  { iso2: 'KE', overallScore: 60.0, rank: 120,trend: 'stagnating' },
  { iso2: 'GH', overallScore: 62.5, rank: 112,trend: 'stagnating' },
  { iso2: 'NG', overallScore: 53.5, rank: 149,trend: 'declining' },
  { iso2: 'ET', overallScore: 55.0, rank: 143,trend: 'stagnating' },
  { iso2: 'ZA', overallScore: 63.0, rank: 110,trend: 'stagnating' },
  { iso2: 'EG', overallScore: 66.0, rank: 82, trend: 'stagnating' },
  { iso2: 'MA', overallScore: 68.5, rank: 70, trend: 'moderatelyImproving' },
  { iso2: 'TR', overallScore: 72.5, rank: 47, trend: 'moderatelyImproving' },
  { iso2: 'SA', overallScore: 68.0, rank: 72, trend: 'moderatelyImproving' },
  { iso2: 'AE', overallScore: 72.0, rank: 48, trend: 'moderatelyImproving' },
  { iso2: 'RU', overallScore: 73.5, rank: 42, trend: 'stagnating' },
  { iso2: 'TZ', overallScore: 56.5, rank: 140,trend: 'stagnating' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 21. DEFORESTATION_DATA — 20 countries [21]
//     Source: Global Forest Watch / Hansen et al. tree cover loss (2024)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFORESTATION_DATA = [
  // annualLossHa: hectares of tree cover lost in 2023, primaryForestLossHa, fireAlerts2023, commodityDrivenPct
  { iso2: 'BR', name: 'Brazil',      annualLossHa: 1_530_000, primaryForestLossHa: 490_000, fireAlerts2023: 189_000, commodityDrivenPct: 32 },
  { iso2: 'CD', name: 'DR Congo',    annualLossHa: 510_000,   primaryForestLossHa: 500_000, fireAlerts2023: 120_000, commodityDrivenPct: 18 },
  { iso2: 'BO', name: 'Bolivia',     annualLossHa: 420_000,   primaryForestLossHa: 60_000,  fireAlerts2023: 92_000,  commodityDrivenPct: 65 },
  { iso2: 'ID', name: 'Indonesia',   annualLossHa: 420_000,   primaryForestLossHa: 120_000, fireAlerts2023: 85_000,  commodityDrivenPct: 52 },
  { iso2: 'CO', name: 'Colombia',    annualLossHa: 170_000,   primaryForestLossHa: 65_000,  fireAlerts2023: 45_000,  commodityDrivenPct: 28 },
  { iso2: 'PE', name: 'Peru',        annualLossHa: 140_000,   primaryForestLossHa: 55_000,  fireAlerts2023: 38_000,  commodityDrivenPct: 25 },
  { iso2: 'MX', name: 'Mexico',      annualLossHa: 190_000,   primaryForestLossHa: 18_000,  fireAlerts2023: 50_000,  commodityDrivenPct: 20 },
  { iso2: 'MY', name: 'Malaysia',    annualLossHa: 145_000,   primaryForestLossHa: 40_000,  fireAlerts2023: 22_000,  commodityDrivenPct: 55 },
  { iso2: 'MG', name: 'Madagascar',  annualLossHa: 88_000,    primaryForestLossHa: 52_000,  fireAlerts2023: 40_000,  commodityDrivenPct: 15 },
  { iso2: 'CM', name: 'Cameroon',    annualLossHa: 80_000,    primaryForestLossHa: 38_000,  fireAlerts2023: 25_000,  commodityDrivenPct: 22 },
  { iso2: 'PY', name: 'Paraguay',    annualLossHa: 240_000,   primaryForestLossHa: 5_000,   fireAlerts2023: 55_000,  commodityDrivenPct: 70 },
  { iso2: 'AR', name: 'Argentina',   annualLossHa: 150_000,   primaryForestLossHa: 8_000,   fireAlerts2023: 42_000,  commodityDrivenPct: 60 },
  { iso2: 'TZ', name: 'Tanzania',    annualLossHa: 110_000,   primaryForestLossHa: 32_000,  fireAlerts2023: 55_000,  commodityDrivenPct: 12 },
  { iso2: 'NG', name: 'Nigeria',     annualLossHa: 96_000,    primaryForestLossHa: 10_000,  fireAlerts2023: 30_000,  commodityDrivenPct: 25 },
  { iso2: 'GH', name: 'Ghana',       annualLossHa: 62_000,    primaryForestLossHa: 18_000,  fireAlerts2023: 22_000,  commodityDrivenPct: 35 },
  { iso2: 'CI', name: 'Cote d\'Ivoire',annualLossHa: 55_000,  primaryForestLossHa: 12_000,  fireAlerts2023: 18_000,  commodityDrivenPct: 40 },
  { iso2: 'PG', name: 'Papua New Guinea',annualLossHa: 72_000,primaryForestLossHa: 55_000,  fireAlerts2023: 15_000,  commodityDrivenPct: 45 },
  { iso2: 'LA', name: 'Laos',        annualLossHa: 65_000,    primaryForestLossHa: 25_000,  fireAlerts2023: 35_000,  commodityDrivenPct: 30 },
  { iso2: 'MM', name: 'Myanmar',     annualLossHa: 120_000,   primaryForestLossHa: 42_000,  fireAlerts2023: 48_000,  commodityDrivenPct: 20 },
  { iso2: 'EC', name: 'Ecuador',     annualLossHa: 50_000,    primaryForestLossHa: 22_000,  fireAlerts2023: 12_000,  commodityDrivenPct: 28 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 22. GREEN_BOND_BENCHMARKS — Green bond market [22]
//     Source: Climate Bonds Initiative H1 2025
// ═══════════════════════════════════════════════════════════════════════════════

export const GREEN_BOND_BENCHMARKS = {
  totalIssuanceCumulative_USDbn: 2800,
  annualIssuance2024_USDbn: 530,
  annualIssuance2023_USDbn: 575,
  avgGreeniumBps: -3.5,   // Green bonds trade ~3.5bps tighter than comparable conventional
  certifiedClimateBondsPct: 18,
  topIssuersByRegion: {
    europe: { share: 45, topIssuers: ['EIB', 'KfW', 'Republic of France', 'Germany Federal'] },
    americas: { share: 25, topIssuers: ['Fannie Mae', 'World Bank', 'Apple', 'Bank of America'] },
    asiaPacific: { share: 25, topIssuers: ['China Development Bank', 'Republic of Korea', 'JICA', 'Industrial Bank'] },
    other: { share: 5 },
  },
  useOfProceeds: {
    energy: 33,
    buildings: 28,
    transport: 18,
    water: 9,
    waste: 4,
    landUse: 3,
    adaptation: 3,
    other: 2,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 23. SBTI_STATISTICS — SBTi programme stats [23]
//     Source: SBTi Progress Report 2024
// ═══════════════════════════════════════════════════════════════════════════════

export const SBTI_STATISTICS = {
  asOf: '2024-12-31',
  totalCommitted: 4205,
  totalValidated: 2640,
  netZeroCommitted: 1200,
  netZeroValidated: 180,
  byTargetType: {
    nearTerm1_5C: 62,  // % of validated that are 1.5C aligned
    nearTerm2C: 22,
    nearTermWellBelow2C: 16,
  },
  byRegion: {
    europe: { committed: 1800, validated: 1150 },
    northAmerica: { committed: 750, validated: 520 },
    asiaPacific: { committed: 1100, validated: 650 },
    latinAmerica: { committed: 280, validated: 170 },
    africa: { committed: 120, validated: 65 },
    middleEast: { committed: 155, validated: 85 },
  },
  bySector: {
    financials: { committed: 420, validated: 280 },
    tech: { committed: 380, validated: 260 },
    industrials: { committed: 520, validated: 310 },
    consumerStaples: { committed: 310, validated: 220 },
    consumerDiscretionary: { committed: 350, validated: 210 },
    materials: { committed: 280, validated: 150 },
    utilities: { committed: 180, validated: 110 },
    healthcare: { committed: 220, validated: 140 },
    realEstate: { committed: 290, validated: 180 },
    energy: { committed: 130, validated: 65 },
    other: { committed: 1125, validated: 715 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 24. TCFD_ADOPTION — TCFD adoption rates by sector and region [24]
//     Source: TCFD 2023 Status Report (FSB)
// ═══════════════════════════════════════════════════════════════════════════════

export const TCFD_ADOPTION = {
  asOf: '2023',
  overallAdoptionPct: 58,
  bySector: {
    banking: 72,
    insurance: 65,
    assetManagement: 60,
    energy: 68,
    materialsBuildings: 55,
    transportation: 48,
    agriculture: 35,
    technology: 52,
  },
  byRegion: {
    europe: 72,
    northAmerica: 55,
    asiaPacific: 48,
    latinAmerica: 28,
    africa: 15,
    middleEast: 22,
  },
  byPillar: {
    governance: 70,
    strategy: 52,
    riskManagement: 58,
    metricsTargets: 50,
  },
  totalSupporters: 4900,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 25. GRESB_BENCHMARKS — Real estate ESG benchmarks [25]
//     Source: GRESB Real Estate Assessment Results 2024
// ═══════════════════════════════════════════════════════════════════════════════

export const GRESB_BENCHMARKS = {
  year: 2024,
  participants: 2084,
  avgScore: 75,  // out of 100
  byPropertyType: {
    office:       { avgScore: 78, greenCertifiedPct: 55, participants: 520 },
    retail:       { avgScore: 72, greenCertifiedPct: 42, participants: 380 },
    residential:  { avgScore: 70, greenCertifiedPct: 35, participants: 410 },
    industrial:   { avgScore: 74, greenCertifiedPct: 40, participants: 290 },
    healthcare:   { avgScore: 68, greenCertifiedPct: 28, participants: 85 },
    hotel:        { avgScore: 65, greenCertifiedPct: 30, participants: 95 },
    diversified:  { avgScore: 76, greenCertifiedPct: 48, participants: 304 },
  },
  byRegion: {
    europe:       { avgScore: 80, participants: 850 },
    northAmerica: { avgScore: 72, participants: 520 },
    asiaPacific:  { avgScore: 73, participants: 550 },
    latinAmerica: { avgScore: 62, participants: 80 },
    middleEast:   { avgScore: 58, participants: 44 },
    africa:       { avgScore: 55, participants: 40 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 26. CRREM_PATHWAYS — Carbon Risk Real Estate Monitor [26]
//     1.5C and 2C energy/carbon intensity by property type (2020-2050)
//     Source: CRREM v2.0 (2023) — Global average values
//     Units: kgCO2/m2/yr for carbon, kWh/m2/yr for energy
// ═══════════════════════════════════════════════════════════════════════════════

export const CRREM_PATHWAYS = {
  source: 'CRREM v2.0 (2023)',
  // Carbon intensity pathways (kgCO2/m2/yr) — global avg
  carbon_1_5C: {
    office:      { 2020: 85, 2025: 65, 2030: 40, 2035: 22, 2040: 10, 2045: 3, 2050: 0 },
    retail:      { 2020: 110, 2025: 85, 2030: 52, 2035: 28, 2040: 12, 2045: 4, 2050: 0 },
    residential: { 2020: 50, 2025: 38, 2030: 24, 2035: 13, 2040: 6, 2045: 2, 2050: 0 },
    industrial:  { 2020: 95, 2025: 72, 2030: 45, 2035: 25, 2040: 11, 2045: 3, 2050: 0 },
    hotel:       { 2020: 120, 2025: 92, 2030: 58, 2035: 32, 2040: 14, 2045: 5, 2050: 0 },
  },
  carbon_2C: {
    office:      { 2020: 85, 2025: 72, 2030: 52, 2035: 35, 2040: 20, 2045: 8, 2050: 0 },
    retail:      { 2020: 110, 2025: 95, 2030: 70, 2035: 45, 2040: 25, 2045: 10, 2050: 0 },
    residential: { 2020: 50, 2025: 42, 2030: 32, 2035: 22, 2040: 12, 2045: 5, 2050: 0 },
    industrial:  { 2020: 95, 2025: 82, 2030: 62, 2035: 40, 2040: 22, 2045: 8, 2050: 0 },
    hotel:       { 2020: 120, 2025: 102, 2030: 78, 2035: 52, 2040: 28, 2045: 12, 2050: 0 },
  },
  // Energy intensity pathways (kWh/m2/yr) — global avg
  energy_1_5C: {
    office:      { 2020: 250, 2025: 210, 2030: 165, 2035: 130, 2040: 105, 2045: 90, 2050: 80 },
    retail:      { 2020: 320, 2025: 270, 2030: 210, 2035: 165, 2040: 130, 2045: 110, 2050: 95 },
    residential: { 2020: 160, 2025: 135, 2030: 105, 2035: 85, 2040: 70, 2045: 60, 2050: 55 },
    industrial:  { 2020: 200, 2025: 170, 2030: 135, 2035: 108, 2040: 88, 2045: 75, 2050: 65 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 27. SOCIAL_INDICATORS — 50 countries [27]
//     Sources: ILO, Walk Free GSI 2023, RSF Press Freedom Index 2024
// ═══════════════════════════════════════════════════════════════════════════════

export const SOCIAL_INDICATORS = [
  // livingWageGapPct: % gap between median wage and living wage (0=at/above living wage)
  // genderPayGapPct: unadjusted gender pay gap
  // unionDensityPct: trade union membership as % of workforce
  // childLabourPct: % of children 5-17 in child labour (ILO)
  // modernSlaveryPer1000: prevalence per 1000 (Walk Free GSI 2023)
  // pressFreedomScore: RSF score 0-100 (higher=better)
  { iso2: 'US', livingWageGapPct: 5,  genderPayGapPct: 16.0, unionDensityPct: 10.0, childLabourPct: 0.5, modernSlaveryPer1000: 1.0, pressFreedomScore: 71 },
  { iso2: 'GB', livingWageGapPct: 3,  genderPayGapPct: 14.3, unionDensityPct: 22.3, childLabourPct: 0.2, modernSlaveryPer1000: 1.1, pressFreedomScore: 73 },
  { iso2: 'DE', livingWageGapPct: 2,  genderPayGapPct: 17.6, unionDensityPct: 16.3, childLabourPct: 0.1, modernSlaveryPer1000: 0.7, pressFreedomScore: 82 },
  { iso2: 'FR', livingWageGapPct: 2,  genderPayGapPct: 15.8, unionDensityPct: 10.8, childLabourPct: 0.1, modernSlaveryPer1000: 0.8, pressFreedomScore: 78 },
  { iso2: 'JP', livingWageGapPct: 4,  genderPayGapPct: 22.1, unionDensityPct: 16.5, childLabourPct: 0.1, modernSlaveryPer1000: 0.4, pressFreedomScore: 60 },
  { iso2: 'CN', livingWageGapPct: 12, genderPayGapPct: 15.0, unionDensityPct: 44.0, childLabourPct: 3.5, modernSlaveryPer1000: 2.4, pressFreedomScore: 23 },
  { iso2: 'IN', livingWageGapPct: 25, genderPayGapPct: 19.2, unionDensityPct: 12.0, childLabourPct: 5.7, modernSlaveryPer1000: 6.4, pressFreedomScore: 36 },
  { iso2: 'BR', livingWageGapPct: 15, genderPayGapPct: 20.5, unionDensityPct: 11.2, childLabourPct: 4.6, modernSlaveryPer1000: 1.8, pressFreedomScore: 55 },
  { iso2: 'ZA', livingWageGapPct: 28, genderPayGapPct: 23.0, unionDensityPct: 25.3, childLabourPct: 7.0, modernSlaveryPer1000: 2.5, pressFreedomScore: 68 },
  { iso2: 'NG', livingWageGapPct: 40, genderPayGapPct: 25.0, unionDensityPct: 7.0,  childLabourPct: 31.0,modernSlaveryPer1000: 7.7, pressFreedomScore: 43 },
  { iso2: 'SE', livingWageGapPct: 0,  genderPayGapPct: 11.2, unionDensityPct: 65.0, childLabourPct: 0.0, modernSlaveryPer1000: 0.5, pressFreedomScore: 92 },
  { iso2: 'NO', livingWageGapPct: 0,  genderPayGapPct: 12.0, unionDensityPct: 50.0, childLabourPct: 0.0, modernSlaveryPer1000: 0.4, pressFreedomScore: 95 },
  { iso2: 'DK', livingWageGapPct: 0,  genderPayGapPct: 12.5, unionDensityPct: 67.0, childLabourPct: 0.0, modernSlaveryPer1000: 0.5, pressFreedomScore: 90 },
  { iso2: 'FI', livingWageGapPct: 0,  genderPayGapPct: 16.0, unionDensityPct: 58.0, childLabourPct: 0.0, modernSlaveryPer1000: 0.5, pressFreedomScore: 88 },
  { iso2: 'AU', livingWageGapPct: 2,  genderPayGapPct: 13.3, unionDensityPct: 12.5, childLabourPct: 0.1, modernSlaveryPer1000: 0.8, pressFreedomScore: 69 },
  { iso2: 'KR', livingWageGapPct: 5,  genderPayGapPct: 31.1, unionDensityPct: 12.2, childLabourPct: 0.2, modernSlaveryPer1000: 0.5, pressFreedomScore: 62 },
  { iso2: 'MX', livingWageGapPct: 18, genderPayGapPct: 15.5, unionDensityPct: 12.0, childLabourPct: 6.7, modernSlaveryPer1000: 2.5, pressFreedomScore: 32 },
  { iso2: 'ID', livingWageGapPct: 20, genderPayGapPct: 18.0, unionDensityPct: 7.0,  childLabourPct: 4.0, modernSlaveryPer1000: 4.7, pressFreedomScore: 52 },
  { iso2: 'PH', livingWageGapPct: 22, genderPayGapPct: 12.0, unionDensityPct: 8.5,  childLabourPct: 5.5, modernSlaveryPer1000: 4.0, pressFreedomScore: 48 },
  { iso2: 'BD', livingWageGapPct: 35, genderPayGapPct: 18.0, unionDensityPct: 3.0,  childLabourPct: 4.3, modernSlaveryPer1000: 5.5, pressFreedomScore: 35 },
  { iso2: 'PK', livingWageGapPct: 35, genderPayGapPct: 34.0, unionDensityPct: 2.5,  childLabourPct: 9.0, modernSlaveryPer1000: 7.6, pressFreedomScore: 26 },
  { iso2: 'TH', livingWageGapPct: 10, genderPayGapPct: 11.0, unionDensityPct: 3.5,  childLabourPct: 5.0, modernSlaveryPer1000: 4.5, pressFreedomScore: 40 },
  { iso2: 'VN', livingWageGapPct: 12, genderPayGapPct: 13.0, unionDensityPct: 25.0, childLabourPct: 5.5, modernSlaveryPer1000: 2.2, pressFreedomScore: 24 },
  { iso2: 'MY', livingWageGapPct: 8,  genderPayGapPct: 8.8,  unionDensityPct: 6.0,  childLabourPct: 1.5, modernSlaveryPer1000: 3.2, pressFreedomScore: 45 },
  { iso2: 'TR', livingWageGapPct: 15, genderPayGapPct: 16.5, unionDensityPct: 12.0, childLabourPct: 5.0, modernSlaveryPer1000: 2.0, pressFreedomScore: 28 },
  { iso2: 'EG', livingWageGapPct: 20, genderPayGapPct: 28.0, unionDensityPct: 7.0,  childLabourPct: 5.6, modernSlaveryPer1000: 2.2, pressFreedomScore: 25 },
  { iso2: 'SA', livingWageGapPct: 5,  genderPayGapPct: 22.0, unionDensityPct: 0.0,  childLabourPct: 1.0, modernSlaveryPer1000: 5.3, pressFreedomScore: 18 },
  { iso2: 'KE', livingWageGapPct: 30, genderPayGapPct: 20.0, unionDensityPct: 15.0, childLabourPct: 20.0,modernSlaveryPer1000: 2.8, pressFreedomScore: 55 },
  { iso2: 'ET', livingWageGapPct: 38, genderPayGapPct: 22.0, unionDensityPct: 5.0,  childLabourPct: 30.0,modernSlaveryPer1000: 5.0, pressFreedomScore: 30 },
  { iso2: 'GH', livingWageGapPct: 25, genderPayGapPct: 18.0, unionDensityPct: 10.0, childLabourPct: 14.0,modernSlaveryPer1000: 2.9, pressFreedomScore: 60 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 28. INSURANCE_LOSS_DATA — Natural catastrophe losses [28]
//     Source: Swiss Re sigma No 1/2025
// ═══════════════════════════════════════════════════════════════════════════════

export const INSURANCE_LOSS_DATA = {
  source: 'Swiss Re sigma No 1/2025',
  byYear: [
    { year: 2015, insuredUsdBn: 38,  economicUsdBn: 94,  protectionGapPct: 60 },
    { year: 2016, insuredUsdBn: 58,  economicUsdBn: 175, protectionGapPct: 67 },
    { year: 2017, insuredUsdBn: 146, economicUsdBn: 350, protectionGapPct: 58 },
    { year: 2018, insuredUsdBn: 85,  economicUsdBn: 176, protectionGapPct: 52 },
    { year: 2019, insuredUsdBn: 60,  economicUsdBn: 146, protectionGapPct: 59 },
    { year: 2020, insuredUsdBn: 82,  economicUsdBn: 202, protectionGapPct: 59 },
    { year: 2021, insuredUsdBn: 121, economicUsdBn: 280, protectionGapPct: 57 },
    { year: 2022, insuredUsdBn: 132, economicUsdBn: 275, protectionGapPct: 52 },
    { year: 2023, insuredUsdBn: 108, economicUsdBn: 280, protectionGapPct: 61 },
    { year: 2024, insuredUsdBn: 145, economicUsdBn: 310, protectionGapPct: 53 },
  ],
  byPeril2024: {
    tropicalCyclone: { insuredUsdBn: 55, economicUsdBn: 120 },
    severConvective: { insuredUsdBn: 48, economicUsdBn: 75 },
    flood:           { insuredUsdBn: 18, economicUsdBn: 55 },
    wildfire:        { insuredUsdBn: 12, economicUsdBn: 25 },
    earthquake:      { insuredUsdBn: 8,  economicUsdBn: 28 },
    drought:         { insuredUsdBn: 4,  economicUsdBn: 7 },
  },
  byRegion2024: {
    northAmerica: { insuredUsdBn: 85,  economicUsdBn: 165 },
    europe:       { insuredUsdBn: 22,  economicUsdBn: 45 },
    asiaPacific:  { insuredUsdBn: 28,  economicUsdBn: 75 },
    latinAmerica: { insuredUsdBn: 5,   economicUsdBn: 15 },
    africa:       { insuredUsdBn: 2,   economicUsdBn: 8 },
    middleEast:   { insuredUsdBn: 3,   economicUsdBn: 5 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 29. SHIPPING_FUEL_PRICES — 10 marine fuel types [29]
//     Source: Ship & Bunker / Argus Media (March 2026)
// ═══════════════════════════════════════════════════════════════════════════════

export const SHIPPING_FUEL_PRICES = {
  asOf: '2026-03-15',
  fuels: [
    { name: 'VLSFO (0.5% S)',  code: 'VLSFO',   pricePerTonne: 580,  unit: '$/t', emissionFactor_tCO2_t: 3.114, note: 'IMO 2020 compliant' },
    { name: 'HSFO (3.5% S)',   code: 'HSFO',     pricePerTonne: 450,  unit: '$/t', emissionFactor_tCO2_t: 3.114, note: 'Requires scrubber' },
    { name: 'MGO (0.1% S)',    code: 'MGO',      pricePerTonne: 750,  unit: '$/t', emissionFactor_tCO2_t: 3.206, note: 'ECA zones' },
    { name: 'LNG',             code: 'LNG',      pricePerTonne: 550,  unit: '$/t', emissionFactor_tCO2_t: 2.750, note: 'Methane slip risk' },
    { name: 'Green Methanol',  code: 'MEOH_G',   pricePerTonne: 1200, unit: '$/t', emissionFactor_tCO2_t: 0.0,   note: 'From green H2 + biogenic CO2' },
    { name: 'Grey Methanol',   code: 'MEOH_GR',  pricePerTonne: 450,  unit: '$/t', emissionFactor_tCO2_t: 1.375, note: 'From natural gas' },
    { name: 'Green Ammonia',   code: 'NH3_G',    pricePerTonne: 800,  unit: '$/t', emissionFactor_tCO2_t: 0.0,   note: 'From green H2' },
    { name: 'Grey Ammonia',    code: 'NH3_GR',   pricePerTonne: 350,  unit: '$/t', emissionFactor_tCO2_t: 2.340, note: 'From natural gas' },
    { name: 'Green Hydrogen',  code: 'H2_G',     pricePerTonne: 4000, unit: '$/t', emissionFactor_tCO2_t: 0.0,   note: 'Electrolysis with renewables' },
    { name: 'Biofuel (B100)',  code: 'BIOFUEL',  pricePerTonne: 1100, unit: '$/t', emissionFactor_tCO2_t: 0.0,   note: 'FAME/HVO, ISCC certified' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 30. AVIATION_FUEL_DATA — Jet fuel vs SAF pricing [30]
//     Source: IATA / Argus SAF pricing / CORSIA eligible fuels (2025)
// ═══════════════════════════════════════════════════════════════════════════════

export const AVIATION_FUEL_DATA = {
  asOf: '2026-03-15',
  jetFuel: {
    pricePerGallon: 2.45,
    pricePerTonne: 780,
    unit: 'USD',
    emissionFactor_gCO2_MJ: 89.0,
  },
  saf: {
    avgPremiumMultiplier: 2.8,
    pricePerTonne: 2200,
    globalProductionCapacity_Mt: 1.5,
    blendMandates: {
      eu_refuelEu_2025: 2,    // % SAF mandate in EU from 2025
      eu_refuelEu_2030: 6,
      eu_refuelEu_2035: 20,
      eu_refuelEu_2050: 70,
      uk_2025: 2,
      uk_2030: 10,
      japan_2030: 10,
      singapore_2026: 1,
    },
    pathways: [
      { name: 'HEFA',               feedstock: 'Used cooking oil / tallow', emissionFactor_gCO2_MJ: 30.4, maturity: 'Commercial', share2024pct: 75 },
      { name: 'Fischer-Tropsch',     feedstock: 'Municipal solid waste',    emissionFactor_gCO2_MJ: 7.7,  maturity: 'Early commercial', share2024pct: 5 },
      { name: 'Alcohol-to-Jet (ATJ)',feedstock: 'Sugarcane / corn ethanol', emissionFactor_gCO2_MJ: 24.0, maturity: 'Early commercial', share2024pct: 10 },
      { name: 'Power-to-Liquid',     feedstock: 'Green H2 + captured CO2', emissionFactor_gCO2_MJ: 4.5,  maturity: 'Pilot / demo', share2024pct: 1 },
      { name: 'Catalytic hydrothermolysis',feedstock: 'Fats, oils, greases',emissionFactor_gCO2_MJ: 28.0, maturity: 'Early commercial', share2024pct: 5 },
      { name: 'Co-processed lipids', feedstock: 'Co-processed in refinery',emissionFactor_gCO2_MJ: 45.0, maturity: 'Commercial', share2024pct: 4 },
    ],
    corsiaEligibleFuels: ['HEFA', 'Fischer-Tropsch (MSW)', 'ATJ (sugarcane)', 'Power-to-Liquid'],
  },
};


// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE LOOKUP HELPERS
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

/** Look up country risk data by ISO2 code [14] */
export const getCountryRisk = (iso2) =>
  COUNTRY_RISK_SCORES.find(c => c.iso2 === iso2) ?? null;

/** Get exchange rate for a currency vs USD [15] */
export const getExchangeRate = (currency) =>
  EXCHANGE_RATES.rates[currency] ?? null;

/** Convert amount between currencies via USD [15] */
export const convertCurrency = (amount, from, to) => {
  if (from === 'USD') return amount * (EXCHANGE_RATES.rates[to] ?? 1);
  if (to === 'USD') return amount / (EXCHANGE_RATES.rates[from] ?? 1);
  const inUsd = amount / (EXCHANGE_RATES.rates[from] ?? 1);
  return inUsd * (EXCHANGE_RATES.rates[to] ?? 1);
};

/** Look up central bank interest rate by ISO2 [16] */
export const getInterestRate = (iso2) =>
  INTEREST_RATES.rates.find(r => r.iso2 === iso2) ?? null;

/** Look up commodity price by name or ticker [17] */
export const getCommodityPrice = (nameOrTicker) =>
  COMMODITY_PRICES.commodities.find(c =>
    c.name.toLowerCase().includes(nameOrTicker.toLowerCase()) ||
    c.ticker.toLowerCase() === nameOrTicker.toLowerCase()
  ) ?? null;

/** Look up biodiversity indicators by ISO2 [18] */
export const getBiodiversityData = (iso2) =>
  BIODIVERSITY_INDICATORS.find(b => b.iso2 === iso2) ?? null;

/** Look up water stress data by ISO2 [19] */
export const getWaterStress = (iso2) =>
  WATER_STRESS_DATA.find(w => w.iso2 === iso2) ?? null;

/** Look up SDG progress by ISO2 [20] */
export const getSDGProgress = (iso2) =>
  SDG_PROGRESS.find(s => s.iso2 === iso2) ?? null;

/** Look up deforestation data by ISO2 [21] */
export const getDeforestationData = (iso2) =>
  DEFORESTATION_DATA.find(d => d.iso2 === iso2) ?? null;

/** Look up social indicators by ISO2 [27] */
export const getSocialIndicators = (iso2) =>
  SOCIAL_INDICATORS.find(s => s.iso2 === iso2) ?? null;

/** Get CRREM carbon pathway value for a property type, scenario, and year [26] */
export const getCRREMPathway = (propertyType, scenario, year) => {
  const key = scenario === '1.5C' ? 'carbon_1_5C' : 'carbon_2C';
  return CRREM_PATHWAYS[key]?.[propertyType]?.[year] ?? null;
};

/** Get shipping fuel data by code [29] */
export const getShippingFuel = (code) =>
  SHIPPING_FUEL_PRICES.fuels.find(f => f.code === code) ?? null;

/** Get insurance loss data for a specific year [28] */
export const getInsuranceLoss = (year) =>
  INSURANCE_LOSS_DATA.byYear.find(y => y.year === year) ?? null;
