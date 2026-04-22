// =========================================================================
// Advisory Reference Data Library
// Curated sectoral benchmarks and lookup tables for EB advisory modules.
// Sources: CEA (Indian grid), IEA (global grid), BEE (CCTS), IPCC AR6,
// IEA PVPS Task 12 (LCA), ITRPV 2024, ICMA SLBP, SBTi SDA, CBI greenium,
// MSCI/Sustainalytics ratings, ENCORE/TNFD, WRI Aqueduct, IBAT/IUCN.
// Values are rounded and representative; replace with live feeds for production.
// =========================================================================

// -------------------------------------------------------------------------
// 1. GRID EMISSION FACTORS — kgCO₂/kWh
// -------------------------------------------------------------------------
export const CEA_GRID_EF = {
  // CEA CO2 Baseline Database v20.0 (FY2023-24), approximate state values
  national: 0.716,
  states: {
    'RJ': 0.78, 'GJ': 0.72, 'MH': 0.82, 'KA': 0.61, 'TN': 0.58, 'AP': 0.80,
    'TS': 0.85, 'MP': 0.92, 'UP': 0.94, 'OD': 0.96, 'WB': 0.91, 'CG': 0.98,
    'JH': 0.97, 'HR': 0.74, 'PB': 0.71, 'KL': 0.45, 'HP': 0.08, 'UK': 0.20,
    'DL': 0.63, 'BR': 0.92, 'AS': 0.55, 'JK': 0.15, 'GA': 0.80, 'OM': 0.51,
  },
};

export const IEA_GRID_EF = {
  'India': 0.716, 'China': 0.581, 'USA': 0.369, 'Germany': 0.385, 'UK': 0.207,
  'France': 0.052, 'Japan': 0.462, 'Australia': 0.531, 'Brazil': 0.112, 'Russia': 0.322,
  'Korea': 0.436, 'Canada': 0.128, 'Italy': 0.252, 'Spain': 0.174, 'Poland': 0.659,
  'Turkey': 0.428, 'Mexico': 0.423, 'S Africa': 0.872, 'Indonesia': 0.731, 'Vietnam': 0.432,
  'UAE': 0.386, 'Saudi': 0.542, 'Oman': 0.495, 'Egypt': 0.454, 'Norway': 0.028,
  'Sweden': 0.021, 'Netherlands': 0.284, 'EU27': 0.246, 'Global': 0.459,
};

export const gridEfFor = (country, state) => {
  if (country === 'India' && state && CEA_GRID_EF.states[state]) return CEA_GRID_EF.states[state];
  return IEA_GRID_EF[country] || IEA_GRID_EF.Global;
};

// -------------------------------------------------------------------------
// 2. CCTS / BEE METHODOLOGY CATALOG
// -------------------------------------------------------------------------
export const BEE_METHODS = {
  'Solar PV (utility)': {
    baselineRule: 'Combined-margin EF × gross generation',
    conservatism: 1.00, creditingYrs: 10, minMw: 5,
    mrv: 'Monthly meter data + TPV annually',
    penetrationThreshold: 30, notes: 'Use state CEA CM-EF; apply grid loss 0.95.'
  },
  'Solar rooftop': {
    baselineRule: 'Simple CM-EF × metered export',
    conservatism: 0.95, creditingYrs: 10, minMw: 0.1,
    mrv: 'Net-metering data',
    penetrationThreshold: 15, notes: 'Lower conservatism for small distributed systems.'
  },
  'Wind onshore': {
    baselineRule: 'Build-margin EF × net generation',
    conservatism: 0.98, creditingYrs: 10, minMw: 25,
    mrv: 'SCADA + monthly revenue meters',
    penetrationThreshold: 35, notes: 'Use BM-EF; apply curtailment factor 0.92.'
  },
  'Small hydro': {
    baselineRule: 'CM-EF × net generation − upstream CH4',
    conservatism: 0.95, creditingYrs: 10, minMw: 1,
    mrv: 'Turbine meter + reservoir area data',
    penetrationThreshold: 20, notes: 'Deduct reservoir methane per IPCC 2019 refinement.'
  },
  'Biomass': {
    baselineRule: 'CM-EF × gross − biomass N2O/CH4',
    conservatism: 0.90, creditingYrs: 7, minMw: 1,
    mrv: 'Fuel receipts + stack CEMS',
    penetrationThreshold: 10, notes: 'Only residue-based; plantation biomass excluded.'
  },
  'Waste heat recovery': {
    baselineRule: 'Displaced grid EF × recovered generation',
    conservatism: 0.97, creditingYrs: 7, minMw: 0.5,
    mrv: 'Metered steam/power + process baseline',
    penetrationThreshold: 8, notes: 'Strong additionality in cement/steel.'
  },
  'Energy efficiency': {
    baselineRule: 'Baseline − project consumption × EF',
    conservatism: 0.92, creditingYrs: 7, minMw: 0,
    mrv: 'IPMVP Option B/D + baseline adjustment',
    penetrationThreshold: 25, notes: 'Requires PAT-compliant baseline normalisation.'
  },
  'Fuel switching': {
    baselineRule: 'Baseline fuel EF − project fuel EF × energy',
    conservatism: 0.95, creditingYrs: 7, minMw: 0,
    mrv: 'Fuel receipts + energy audit',
    penetrationThreshold: 15, notes: 'Fossil-to-fossil switches capped; electrification preferred.'
  },
};

// Installed PV penetration % by state (approximate, MNRE Mar 2024)
export const STATE_PV_PENETRATION = {
  'RJ': 42, 'GJ': 35, 'KA': 28, 'TN': 25, 'AP': 22, 'MH': 20, 'MP': 18,
  'TS': 15, 'UP': 12, 'PB': 8, 'HR': 10, 'OD': 6, 'WB': 4, 'KL': 5, 'DL': 3,
};

// Historical CCC-proxy prices (REC REC-NSE, ₹/tCO₂e equivalent)
export const CCC_PRICE_HISTORY = [
  { year: 2020, low: 180, mid: 450, high: 900 },
  { year: 2021, low: 210, mid: 620, high: 1100 },
  { year: 2022, low: 280, mid: 750, high: 1350 },
  { year: 2023, low: 350, mid: 960, high: 1800 },
  { year: 2024, low: 450, mid: 1200, high: 2300 },
  { year: 2025, low: 500, mid: 1400, high: 2600 },
];

// -------------------------------------------------------------------------
// 3. LCA — MATERIAL EMISSION FACTORS (ecoinvent 3.10 equivalent)
// -------------------------------------------------------------------------
export const LCA_EF = {
  'Silicon (mono)': 25.5, 'Silicon (poly)': 21.2, 'Silicon (n-type TOPCon)': 27.8,
  'Glass (tempered)': 1.44, 'Glass (anti-reflective)': 1.72,
  'Aluminium frame': 8.24, 'Aluminium (recycled)': 2.31,
  'EVA backsheet': 3.10, 'POE encapsulant': 3.45, 'Backsheet (PVDF/PET)': 4.80,
  'Copper wiring': 4.60, 'Silver paste': 172.0, 'Steel mounting': 2.10,
  'Concrete ballast': 0.12, 'Junction box (plastic)': 5.20, 'Inverter (electronics)': 12.0,
  'Nacelle (wind)': 2.40, 'Blade (GFRP)': 3.90, 'Tower (steel)': 2.20,
  'Lithium (LCE)': 15.0, 'Graphite (anode)': 4.50, 'NMC cathode': 22.0,
};

// -------------------------------------------------------------------------
// 4. LCA — ITRPV 2024 MODULE ARCHETYPES (kg material per kW installed)
// -------------------------------------------------------------------------
export const PV_ARCHETYPES = {
  'Mono PERC (utility)': {
    tech: 'Mono PERC', yield: 1720, degPct: 0.55,
    bom: [
      { material: 'Silicon (mono)', kgPerKw: 3.6, note: 'Cell wafers' },
      { material: 'Glass (tempered)', kgPerKw: 46.0, note: 'Front cover' },
      { material: 'Aluminium frame', kgPerKw: 8.2, note: 'Frame' },
      { material: 'EVA backsheet', kgPerKw: 2.1, note: 'Encapsulant' },
      { material: 'Copper wiring', kgPerKw: 0.9, note: 'Ribbon + cabling' },
      { material: 'Silver paste', kgPerKw: 0.018, note: 'Front-side metallisation' },
      { material: 'Junction box (plastic)', kgPerKw: 0.6, note: 'J-box' },
    ],
    mfgElec: 580, refGco2PerKwh: 43,
  },
  'TOPCon (premium)': {
    tech: 'n-type TOPCon', yield: 1780, degPct: 0.40,
    bom: [
      { material: 'Silicon (n-type TOPCon)', kgPerKw: 3.2, note: 'n-type wafers, lower degradation' },
      { material: 'Glass (anti-reflective)', kgPerKw: 48.0, note: 'Dual-glass option' },
      { material: 'Aluminium frame', kgPerKw: 7.5, note: 'Lighter frame' },
      { material: 'POE encapsulant', kgPerKw: 2.4, note: 'POE for PID resistance' },
      { material: 'Copper wiring', kgPerKw: 0.95, note: 'Thinner ribbons' },
      { material: 'Silver paste', kgPerKw: 0.014, note: 'Reduced silver consumption' },
      { material: 'Junction box (plastic)', kgPerKw: 0.6, note: 'J-box' },
    ],
    mfgElec: 540, refGco2PerKwh: 37,
  },
  'HJT (premium)': {
    tech: 'Heterojunction', yield: 1830, degPct: 0.25,
    bom: [
      { material: 'Silicon (n-type TOPCon)', kgPerKw: 2.9, note: 'Thinner n-type wafers' },
      { material: 'Glass (anti-reflective)', kgPerKw: 49.0, note: 'Dual-glass' },
      { material: 'Aluminium frame', kgPerKw: 7.0, note: 'Lightweight frame' },
      { material: 'POE encapsulant', kgPerKw: 2.6, note: 'Required for HJT' },
      { material: 'Copper wiring', kgPerKw: 1.05, note: 'Smart wire / multi-busbar' },
      { material: 'Silver paste', kgPerKw: 0.022, note: 'Low-temp silver' },
      { material: 'Junction box (plastic)', kgPerKw: 0.6, note: 'J-box' },
    ],
    mfgElec: 510, refGco2PerKwh: 34,
  },
  'Rooftop distributed': {
    tech: 'Mono PERC rooftop', yield: 1480, degPct: 0.60,
    bom: [
      { material: 'Silicon (mono)', kgPerKw: 3.6, note: 'Cell wafers' },
      { material: 'Glass (tempered)', kgPerKw: 42.0, note: 'Front cover' },
      { material: 'Aluminium frame', kgPerKw: 7.8, note: 'Residential frame' },
      { material: 'EVA backsheet', kgPerKw: 2.0, note: 'Encapsulant' },
      { material: 'Copper wiring', kgPerKw: 0.8, note: 'Ribbon' },
      { material: 'Junction box (plastic)', kgPerKw: 0.6, note: 'J-box' },
    ],
    mfgElec: 600, refGco2PerKwh: 48,
  },
};

// IEA PVPS Task 12 benchmarks — g CO₂e/kWh
export const LCA_PEER_BENCHMARKS = [
  { name: 'IEA PVPS global avg (2024)', gco2PerKwh: 43 },
  { name: 'EU best-in-class (EPD registered)', gco2PerKwh: 28 },
  { name: 'China avg (coal-heavy grid)', gco2PerKwh: 58 },
  { name: 'India avg (FY2024)', gco2PerKwh: 52 },
  { name: 'US-made (IRA compliant)', gco2PerKwh: 35 },
];

// -------------------------------------------------------------------------
// 5. SLF — ICMA KPI REGISTRY + SBTi SDA PATHWAYS
// -------------------------------------------------------------------------
export const ICMA_KPI_LIBRARY = {
  'Utilities — Power': [
    { kpi: 'Scope 1+2 emissions intensity', unit: 'kgCO₂e/MWh', baseline: 620, spt2030: 310, material: true, uop: 'SBTi 1.5°C SDA power sector' },
    { kpi: 'Renewable electricity share', unit: '%', baseline: 12, spt2030: 65, material: true, uop: 'RE100 commitment' },
    { kpi: 'Water withdrawal reduction', unit: 'Index (100=base)', baseline: 100, spt2030: 70, material: false, uop: 'CEO Water Mandate' },
  ],
  'Cement': [
    { kpi: 'Clinker factor', unit: '%', baseline: 78, spt2030: 65, material: true, uop: 'GCCA 2050 Roadmap' },
    { kpi: 'CO₂/tonne cementitious', unit: 'kgCO₂/t', baseline: 610, spt2030: 475, material: true, uop: 'SBTi cement 1.5°C' },
    { kpi: 'Alternative fuels (TSR)', unit: '%', baseline: 8, spt2030: 40, material: true, uop: 'GCCA' },
  ],
  'Steel': [
    { kpi: 'Scope 1+2 per tonne crude steel', unit: 'tCO₂/tCS', baseline: 2.1, spt2030: 1.35, material: true, uop: 'SBTi steel 1.5°C' },
    { kpi: 'Scrap use ratio', unit: '%', baseline: 22, spt2030: 45, material: true, uop: 'ResponsibleSteel' },
  ],
  'Banks': [
    { kpi: 'Financed emissions intensity', unit: 'kgCO₂/$M', baseline: 420, spt2030: 210, material: true, uop: 'PCAF + SBTi FI' },
    { kpi: 'Green asset ratio', unit: '%', baseline: 8, spt2030: 35, material: true, uop: 'EU Taxonomy' },
  ],
  'Real Estate': [
    { kpi: 'Operational intensity', unit: 'kgCO₂/m²', baseline: 62, spt2030: 25, material: true, uop: 'CRREM 1.5°C' },
    { kpi: 'Green-certified share', unit: '%', baseline: 18, spt2030: 75, material: true, uop: 'LEED/BREEAM/IGBC' },
  ],
  'Oil & Gas': [
    { kpi: 'Scope 1+2 intensity', unit: 'kgCO₂/boe', baseline: 28, spt2030: 17, material: true, uop: 'OGCI Aiming for Zero' },
    { kpi: 'Methane intensity', unit: '%', baseline: 0.28, spt2030: 0.08, material: true, uop: 'OGMP 2.0 Gold' },
  ],
};

// Climate Bonds Initiative greenium (bps below comparable vanilla)
export const CBI_GREENIUM_BPS = {
  'Utilities — Power': { 'AAA': 8, 'AA': 7, 'A': 5, 'BBB': 4, 'BB': 3 },
  'Cement':            { 'AAA': 5, 'AA': 4, 'A': 3, 'BBB': 2, 'BB': 1 },
  'Steel':             { 'AAA': 6, 'AA': 5, 'A': 4, 'BBB': 3, 'BB': 2 },
  'Banks':             { 'AAA': 9, 'AA': 8, 'A': 6, 'BBB': 4, 'BB': 2 },
  'Real Estate':       { 'AAA': 7, 'AA': 6, 'A': 5, 'BBB': 3, 'BB': 2 },
  'Oil & Gas':         { 'AAA': 2, 'AA': 2, 'A': 1, 'BBB': 1, 'BB': 0 },
};

export const sbtiAmbitionCheck = (sector, baseline, spt, year) => {
  // Simplified SDA: power sector 1.5°C pathway requires ~4.2% linear annual reduction
  const reqRates = { 'Utilities — Power': 0.042, 'Cement': 0.025, 'Steel': 0.035, 'Banks': 0.042, 'Real Estate': 0.048, 'Oil & Gas': 0.029 };
  const yrsToSpt = Math.max(1, year - 2024);
  const requiredReduction = 1 - Math.pow(1 - (reqRates[sector] || 0.035), yrsToSpt);
  const actualReduction = (baseline - spt) / Math.max(1, baseline);
  return { required: requiredReduction, actual: actualReduction, aligned: actualReduction >= requiredReduction };
};

// -------------------------------------------------------------------------
// 6. ESG RATINGS — MSCI SECTOR ISSUE WEIGHTS + INDUSTRY MEDIANS
// -------------------------------------------------------------------------
export const MSCI_ISSUE_WEIGHTS = {
  // Weights are approximate MSCI ESG Ratings sector weights (sum to 100)
  'Utilities — Renewables': [
    { issue: 'Carbon Emissions', weight: 18 }, { issue: 'Climate Risk Exposure', weight: 14 },
    { issue: 'Renewable Energy', weight: 10 }, { issue: 'Water Stress', weight: 8 },
    { issue: 'Biodiversity & Land Use', weight: 6 }, { issue: 'Labour Management', weight: 8 },
    { issue: 'Health & Safety', weight: 7 }, { issue: 'Community Relations', weight: 6 },
    { issue: 'Supply Chain Labour', weight: 5 }, { issue: 'Corporate Governance', weight: 12 },
    { issue: 'Business Ethics', weight: 6 },
  ],
  'Banks': [
    { issue: 'Financing Environmental Impact', weight: 22 }, { issue: 'Climate Risk Exposure', weight: 15 },
    { issue: 'Consumer Financial Protection', weight: 12 }, { issue: 'Privacy & Data Security', weight: 10 },
    { issue: 'Human Capital Development', weight: 6 }, { issue: 'Corporate Governance', weight: 15 },
    { issue: 'Business Ethics', weight: 10 }, { issue: 'Access to Finance', weight: 5 },
    { issue: 'Labour Management', weight: 5 },
  ],
  'Oil & Gas': [
    { issue: 'Carbon Emissions', weight: 20 }, { issue: 'Biodiversity & Land Use', weight: 14 },
    { issue: 'Toxic Emissions & Waste', weight: 10 }, { issue: 'Community Relations', weight: 10 },
    { issue: 'Health & Safety', weight: 12 }, { issue: 'Labour Management', weight: 5 },
    { issue: 'Corporate Governance', weight: 15 }, { issue: 'Business Ethics', weight: 8 },
    { issue: 'Climate Risk Exposure', weight: 6 },
  ],
  'Cement & Materials': [
    { issue: 'Carbon Emissions', weight: 22 }, { issue: 'Toxic Emissions & Waste', weight: 12 },
    { issue: 'Biodiversity & Land Use', weight: 10 }, { issue: 'Water Stress', weight: 6 },
    { issue: 'Health & Safety', weight: 10 }, { issue: 'Community Relations', weight: 8 },
    { issue: 'Labour Management', weight: 7 }, { issue: 'Corporate Governance', weight: 15 },
    { issue: 'Business Ethics', weight: 10 },
  ],
  'Real Estate': [
    { issue: 'Green Building Opportunities', weight: 18 }, { issue: 'Climate Risk Exposure', weight: 14 },
    { issue: 'Carbon Emissions', weight: 10 }, { issue: 'Health & Safety', weight: 8 },
    { issue: 'Labour Management', weight: 8 }, { issue: 'Community Relations', weight: 8 },
    { issue: 'Corporate Governance', weight: 18 }, { issue: 'Business Ethics', weight: 10 },
    { issue: 'Biodiversity & Land Use', weight: 6 },
  ],
};

// Industry median MSCI ESG scores (0-100 equivalent, 2024 snapshot)
export const SECTOR_MEDIAN_SCORES = {
  'Utilities — Renewables': 62,
  'Banks': 58,
  'Oil & Gas': 38,
  'Cement & Materials': 45,
  'Real Estate': 60,
  'Utilities — Fossil': 32,
};

// PRI engagement case-study uplift per standard action (points on 0-100 scale)
export const PRI_UPLIFT_LIBRARY = [
  { action: 'SBTi 1.5°C validation', issue: 'Carbon Emissions', uplift: 18, costMn: 1.2, months: 9 },
  { action: 'TCFD-aligned climate report', issue: 'Climate Risk Exposure', uplift: 12, costMn: 0.8, months: 6 },
  { action: 'Water-positive pledge + disclosure', issue: 'Water Stress', uplift: 10, costMn: 0.4, months: 4 },
  { action: 'Supplier ESG audit programme', issue: 'Supply Chain Labour', uplift: 14, costMn: 1.5, months: 12 },
  { action: 'Board ESG committee formalisation', issue: 'Corporate Governance', uplift: 6, costMn: 0.2, months: 3 },
  { action: 'Scope 3 Cat 11 disclosure', issue: 'Carbon Emissions', uplift: 8, costMn: 0.6, months: 6 },
  { action: 'Human rights due-diligence policy', issue: 'Labour Management', uplift: 7, costMn: 0.3, months: 4 },
  { action: 'Biodiversity baseline (TNFD)', issue: 'Biodiversity & Land Use', uplift: 11, costMn: 0.9, months: 8 },
  { action: 'Whistleblower & anti-corruption uplift', issue: 'Business Ethics', uplift: 5, costMn: 0.2, months: 3 },
  { action: 'DE&I targets + disclosure', issue: 'Labour Management', uplift: 6, costMn: 0.3, months: 4 },
];

// Passive AUM unlock curves (approx. index-inclusion thresholds)
export const AUM_UNLOCK = {
  'MSCI ESG Leaders': { cutoffLetter: 'A', flowPctPerNotch: 2.2 },
  'MSCI SRI': { cutoffLetter: 'AA', flowPctPerNotch: 1.4 },
  'FTSE4Good': { cutoffLetter: 'BB', flowPctPerNotch: 1.1 },
  'S&P DJSI': { cutoffLetter: 'BBB', flowPctPerNotch: 1.8 },
};

// -------------------------------------------------------------------------
// 7. TCFD PHYSICAL — IPCC AR6 SSP MULTIPLIERS + REGIONAL HAZARD BASELINES
// -------------------------------------------------------------------------
export const SSP_MULT = {
  'SSP1-2.6': { 2030: 1.00, 2040: 1.10, 2050: 1.15, 2070: 1.20 },
  'SSP2-4.5': { 2030: 1.10, 2040: 1.30, 2050: 1.55, 2070: 1.90 },
  'SSP3-7.0': { 2030: 1.15, 2040: 1.45, 2050: 1.85, 2070: 2.45 },
  'SSP5-8.5': { 2030: 1.20, 2040: 1.60, 2050: 2.20, 2070: 3.10 },
};

// Indian state-level baseline hazard scores 0-10 (heat, water stress, cyclone, flood, dust)
// Derived from IMD, WRI Aqueduct, IPCC AR6 regional chapters
export const IN_HAZARD_BASELINE = {
  'RJ': { heat: 8, water: 9, cyclone: 1, flood: 2, dust: 8 },
  'GJ': { heat: 7, water: 6, cyclone: 5, flood: 3, dust: 6 },
  'MH': { heat: 6, water: 6, cyclone: 4, flood: 4, dust: 3 },
  'KA': { heat: 5, water: 5, cyclone: 2, flood: 4, dust: 3 },
  'TN': { heat: 6, water: 5, cyclone: 7, flood: 5, dust: 2 },
  'AP': { heat: 6, water: 4, cyclone: 6, flood: 5, dust: 3 },
  'TS': { heat: 7, water: 5, cyclone: 2, flood: 3, dust: 3 },
  'MP': { heat: 7, water: 6, cyclone: 1, flood: 3, dust: 5 },
  'UP': { heat: 7, water: 7, cyclone: 1, flood: 6, dust: 5 },
  'OD': { heat: 5, water: 3, cyclone: 8, flood: 7, dust: 2 },
  'WB': { heat: 5, water: 4, cyclone: 7, flood: 7, dust: 2 },
  'KL': { heat: 4, water: 4, cyclone: 5, flood: 6, dust: 1 },
  'DL': { heat: 8, water: 8, cyclone: 1, flood: 3, dust: 9 },
  'OM': { heat: 9, water: 10, cyclone: 4, flood: 1, dust: 9 },
};

// WRI Aqueduct baseline water stress (1-5) by region
export const AQUEDUCT_STRESS = {
  'RJ': 5, 'GJ': 4, 'MH': 3, 'KA': 3, 'TN': 4, 'AP': 3, 'TS': 3, 'MP': 3,
  'UP': 4, 'OD': 2, 'WB': 2, 'KL': 2, 'DL': 5, 'OM': 5, 'DE': 2, 'US': 2,
};

// NGFS damage function coefficients (GDP loss % per °C, global average)
export const NGFS_DAMAGE = {
  'Orderly (1.5°C)': { beta: 0.8, maxLoss: 4 },
  'Disorderly (late action)': { beta: 1.3, maxLoss: 9 },
  'Hot house (3°C+)': { beta: 2.1, maxLoss: 18 },
  'Current policies (2.8°C)': { beta: 1.8, maxLoss: 14 },
};

// -------------------------------------------------------------------------
// 8. TNFD — ENCORE DEPENDENCY×IMPACT MATRIX + IUCN/KBA DATA
// -------------------------------------------------------------------------
// ENCORE framework: sector × biome → dependency & impact scores (0-5)
export const ENCORE_MATRIX = {
  'Utilities — Renewables': {
    'Arid / Desert': { dep: 2, imp: 3 }, 'Semi-arid grassland': { dep: 2, imp: 4 },
    'Tropical forest': { dep: 3, imp: 4 }, 'Coastal / Mangrove': { dep: 4, imp: 5 },
    'Temperate forest': { dep: 3, imp: 3 }, 'Wetlands': { dep: 4, imp: 5 },
    'Agricultural mosaic': { dep: 1, imp: 1 }, 'Marine': { dep: 3, imp: 4 },
  },
  'Mining': {
    'Arid / Desert': { dep: 3, imp: 5 }, 'Semi-arid grassland': { dep: 3, imp: 5 },
    'Tropical forest': { dep: 3, imp: 5 }, 'Coastal / Mangrove': { dep: 4, imp: 5 },
    'Temperate forest': { dep: 3, imp: 5 }, 'Wetlands': { dep: 4, imp: 5 },
    'Agricultural mosaic': { dep: 2, imp: 4 }, 'Marine': { dep: 4, imp: 5 },
  },
  'Agriculture': {
    'Arid / Desert': { dep: 5, imp: 3 }, 'Semi-arid grassland': { dep: 5, imp: 4 },
    'Tropical forest': { dep: 5, imp: 5 }, 'Coastal / Mangrove': { dep: 4, imp: 4 },
    'Temperate forest': { dep: 4, imp: 3 }, 'Wetlands': { dep: 5, imp: 4 },
    'Agricultural mosaic': { dep: 5, imp: 2 }, 'Marine': { dep: 2, imp: 2 },
  },
  'Real Estate': {
    'Arid / Desert': { dep: 2, imp: 3 }, 'Semi-arid grassland': { dep: 2, imp: 3 },
    'Tropical forest': { dep: 3, imp: 5 }, 'Coastal / Mangrove': { dep: 4, imp: 5 },
    'Temperate forest': { dep: 3, imp: 4 }, 'Wetlands': { dep: 4, imp: 5 },
    'Agricultural mosaic': { dep: 2, imp: 2 }, 'Marine': { dep: 3, imp: 4 },
  },
};

// IUCN red-list species density by biome (approximate threatened species count per 1000 km²)
export const IUCN_DENSITY = {
  'Arid / Desert': 2, 'Semi-arid grassland': 3, 'Tropical forest': 12,
  'Coastal / Mangrove': 9, 'Temperate forest': 5, 'Wetlands': 8,
  'Agricultural mosaic': 1, 'Marine': 7,
};

// SBTN thresholds (priority flag criteria)
export const SBTN_FLAGS = {
  kbaDistanceKm: 10,      // assets within 10km of Key Biodiversity Area
  iucnSpeciesCount: 3,    // ≥3 IUCN listed species triggers priority
  priorityScoreCut: 3.5,
};

// ESRS E4 / GRI 304 crosswalk for deliverable
export const DISCLOSURE_CROSSWALK = {
  'Asset location': ['ESRS E4-1', 'GRI 304-1'],
  'Impact / dependency': ['ESRS E4-2 AR 14', 'GRI 304-2'],
  'Transition plan': ['ESRS E4-1 §20', 'GRI 304-3'],
  'Targets': ['ESRS E4-4', 'GRI 304-4'],
  'Metrics': ['ESRS E4-5', 'GRI 304-3 b.'],
};

// -------------------------------------------------------------------------
// 9. HELPER FUNCTIONS
// -------------------------------------------------------------------------
export const percentile = (v, series) => {
  const sorted = [...series].sort((a, b) => a - b);
  const below = sorted.filter(x => x < v).length;
  return Math.round((below / Math.max(1, sorted.length)) * 100);
};

export const rank = (v, peers) => {
  const sorted = [...peers].sort((a, b) => b - a);
  return sorted.indexOf(v) + 1;
};

// Tornado sensitivity: pct variation of each driver's effect on output
export const tornado = (inputs, outputFn, pct = 0.20) => {
  const base = outputFn(inputs);
  return Object.keys(inputs).map(k => {
    const up = outputFn({ ...inputs, [k]: inputs[k] * (1 + pct) });
    const dn = outputFn({ ...inputs, [k]: inputs[k] * (1 - pct) });
    return { driver: k, low: dn - base, high: up - base, range: Math.abs(up - dn) };
  }).sort((a, b) => b.range - a.range);
};

// -------------------------------------------------------------------------
// 10. ADVANCED LCA — IMPACT CATEGORIES (EN 15804+A2), CIRCULARITY, TRANSPORT
// -------------------------------------------------------------------------
// Multi-impact per kWh generated (PV utility, ITRPV 2024 ref)
export const LCA_IMPACT_CATEGORIES = {
  GWP:  { label: 'Global Warming',     unit: 'g CO₂e/kWh',      refPV: 43,   refWind: 12,  refBattery: 88 },
  AP:   { label: 'Acidification',      unit: 'mg SO₂e/kWh',     refPV: 210,  refWind: 75,  refBattery: 420 },
  EP:   { label: 'Eutrophication',     unit: 'mg PO₄e/kWh',     refPV: 28,   refWind: 12,  refBattery: 62 },
  ODP:  { label: 'Ozone Depletion',    unit: 'µg CFC11e/kWh',   refPV: 2.8,  refWind: 0.9, refBattery: 6.4 },
  POCP: { label: 'Photochem. Oxid.',   unit: 'mg NMVOCe/kWh',   refPV: 110,  refWind: 45,  refBattery: 240 },
  ADP:  { label: 'Abiotic Depletion',  unit: 'mg Sbe/kWh',      refPV: 0.45, refWind: 0.18,refBattery: 1.10 },
  WD:   { label: 'Water Depletion',    unit: 'L/kWh',           refPV: 0.85, refWind: 0.02,refBattery: 2.10 },
};

// Circularity factors per material (recycled content %, end-of-life recovery %)
export const CIRCULARITY = {
  'Silicon (mono)':          { recContent: 5,  eolRec: 65, eolUseful: 55 },
  'Silicon (poly)':          { recContent: 5,  eolRec: 60, eolUseful: 50 },
  'Silicon (n-type TOPCon)': { recContent: 3,  eolRec: 70, eolUseful: 60 },
  'Glass (tempered)':        { recContent: 35, eolRec: 85, eolUseful: 78 },
  'Glass (anti-reflective)': { recContent: 25, eolRec: 82, eolUseful: 75 },
  'Aluminium frame':         { recContent: 60, eolRec: 95, eolUseful: 92 },
  'Aluminium (recycled)':    { recContent: 95, eolRec: 95, eolUseful: 92 },
  'EVA backsheet':           { recContent: 0,  eolRec: 20, eolUseful: 10 },
  'POE encapsulant':         { recContent: 0,  eolRec: 25, eolUseful: 15 },
  'Backsheet (PVDF/PET)':    { recContent: 5,  eolRec: 30, eolUseful: 20 },
  'Copper wiring':           { recContent: 40, eolRec: 90, eolUseful: 85 },
  'Silver paste':            { recContent: 15, eolRec: 95, eolUseful: 88 },
  'Steel mounting':          { recContent: 50, eolRec: 92, eolUseful: 88 },
  'Concrete ballast':        { recContent: 10, eolRec: 40, eolUseful: 25 },
  'Junction box (plastic)':  { recContent: 5,  eolRec: 30, eolUseful: 15 },
  'Inverter (electronics)':  { recContent: 10, eolRec: 60, eolUseful: 45 },
  'Lithium (LCE)':           { recContent: 5,  eolRec: 55, eolUseful: 45 },
  'Graphite (anode)':        { recContent: 0,  eolRec: 35, eolUseful: 20 },
  'NMC cathode':             { recContent: 8,  eolRec: 75, eolUseful: 65 },
};

// Transport emission factors (kg CO2e per t·km)
export const TRANSPORT_EF = {
  'Ocean container (global)': 0.012,
  'Ocean bulk':               0.008,
  'Road truck (40t)':         0.065,
  'Road truck (7.5t)':        0.18,
  'Rail (diesel)':            0.028,
  'Rail (electric)':          0.015,
  'Air freight (intl)':       1.10,
};

// Approximate distance (km) between common mfg origins and deployment
export const TRANSPORT_DIST = {
  'China':  { 'India': 4500, 'USA': 11000, 'Germany': 8000, 'Global': 9000 },
  'India':  { 'India': 500,  'USA': 13500, 'Germany': 6800, 'Global': 7000 },
  'USA':    { 'India': 13500,'USA': 1500,  'Germany': 7000, 'Global': 8500 },
  'Germany':{ 'India': 6800, 'USA': 7000,  'Germany': 500,  'Global': 6500 },
};

// Grid decarbonization trajectory (IEA NZE 2050 — % of 2024 baseline)
export const GRID_DECARB = {
  'India':   { 2024: 1.00, 2030: 0.72, 2040: 0.42, 2050: 0.18 },
  'China':   { 2024: 1.00, 2030: 0.68, 2040: 0.38, 2050: 0.12 },
  'USA':     { 2024: 1.00, 2030: 0.55, 2040: 0.25, 2050: 0.05 },
  'Germany': { 2024: 1.00, 2030: 0.48, 2040: 0.20, 2050: 0.03 },
  'EU27':    { 2024: 1.00, 2030: 0.52, 2040: 0.22, 2050: 0.04 },
  'Global':  { 2024: 1.00, 2030: 0.65, 2040: 0.35, 2050: 0.12 },
};

// -------------------------------------------------------------------------
// 11. SLF — PEER DEAL COMPS + SLBP 5-COMPONENT CHECKLIST
// -------------------------------------------------------------------------
export const SLBP_COMPONENTS = [
  { id: 'KPI',  label: 'Selection of KPIs',          desc: 'Core, relevant, externally verifiable', weight: 20 },
  { id: 'SPT',  label: 'Calibration of SPTs',         desc: 'Ambitious (beyond BAU), benchmarked, timebound', weight: 20 },
  { id: 'CF',   label: 'Bond characteristics',        desc: 'Financial/structural change on trigger',  weight: 20 },
  { id: 'RPT',  label: 'Reporting',                   desc: 'Annual KPI + verification report',        weight: 20 },
  { id: 'VER',  label: 'Verification',                desc: 'Independent limited-assurance, post-issue', weight: 20 },
];

export const SLF_PEER_DEALS = [
  { issuer: 'ENEL SpA',         sector: 'Utilities — Power', notionalMn: 1500, tenor: 10, couponPct: 1.125, greeniumBps: 7, stepUp: 25, yr: 2023 },
  { issuer: 'Tesco',            sector: 'Consumer',          notionalMn: 750,  tenor: 8,  couponPct: 2.50,  greeniumBps: 4, stepUp: 25, yr: 2023 },
  { issuer: 'H&M',              sector: 'Consumer',          notionalMn: 500,  tenor: 9,  couponPct: 3.125, greeniumBps: 5, stepUp: 75, yr: 2024 },
  { issuer: 'JBS',              sector: 'Food & Ag',         notionalMn: 3200, tenor: 10, couponPct: 6.25,  greeniumBps: 0, stepUp: 25, yr: 2022 },
  { issuer: 'UltraTech Cement', sector: 'Cement',            notionalMn: 400,  tenor: 7,  couponPct: 5.85,  greeniumBps: 3, stepUp: 50, yr: 2024 },
  { issuer: 'Vedanta',          sector: 'Mining',            notionalMn: 1000, tenor: 6,  couponPct: 9.25,  greeniumBps: 0, stepUp: 25, yr: 2024 },
  { issuer: 'JSW Steel',        sector: 'Steel',             notionalMn: 500,  tenor: 7,  couponPct: 5.95,  greeniumBps: 5, stepUp: 50, yr: 2024 },
  { issuer: 'HDFC Bank',        sector: 'Banks',             notionalMn: 500,  tenor: 5,  couponPct: 4.25,  greeniumBps: 8, stepUp: 25, yr: 2024 },
];

// -------------------------------------------------------------------------
// 12. RATINGS — MULTI-AGENCY CROSSWALK + CONTROVERSY IMPACT + INDEX MATRIX
// -------------------------------------------------------------------------
// Same 0-100 equivalent score mapped across agencies
export const AGENCY_CROSSWALK = {
  // [min, max, letter]
  MSCI:          [[0,14.3,'CCC'],[14.3,28.6,'B'],[28.6,42.9,'BB'],[42.9,57.1,'BBB'],[57.1,71.4,'A'],[71.4,85.7,'AA'],[85.7,100,'AAA']],
  Sustainalytics:[[0,20,'Severe'],[20,30,'High'],[30,40,'Medium'],[40,55,'Low'],[55,70,'Negligible'],[70,100,'Industry leader']],
  ISS:           [[0,20,'D-'],[20,35,'D'],[35,50,'C'],[50,65,'B-'],[65,75,'B'],[75,85,'B+'],[85,95,'A'],[95,100,'A+']],
  CDP:           [[0,20,'F'],[20,35,'D-'],[35,50,'D'],[50,60,'C-'],[60,70,'C'],[70,80,'B-'],[80,90,'B'],[90,96,'A-'],[96,100,'A']],
};

export const controversyImpact = (level) => ({ None: 0, Low: -2, Medium: -6, High: -12, Severe: -25 }[level] || 0);

export const CONTROVERSY_CATEGORIES = [
  'Environmental - biodiversity', 'Environmental - pollution', 'Environmental - climate',
  'Social - human rights',        'Social - labour',           'Social - community',
  'Governance - business ethics', 'Governance - accounting',   'Governance - tax',
];

// Index eligibility thresholds (score on same 0-100 scale)
export const INDEX_ELIGIBILITY = {
  'MSCI World ESG Leaders':   { minScore: 57, excludeControv: 'High',   flowPctPerNotch: 2.2 },
  'MSCI World SRI':           { minScore: 71, excludeControv: 'Medium', flowPctPerNotch: 1.4 },
  'FTSE4Good':                { minScore: 42, excludeControv: 'Severe', flowPctPerNotch: 1.1 },
  'S&P DJSI World':           { minScore: 65, excludeControv: 'High',   flowPctPerNotch: 1.8 },
  'Euronext Vigeo':           { minScore: 60, excludeControv: 'High',   flowPctPerNotch: 1.0 },
  'STOXX Global ESG Leaders': { minScore: 55, excludeControv: 'High',   flowPctPerNotch: 1.3 },
};

// Inter-action dependencies: action → prerequisite-action
export const ACTION_DEPS = {
  'SBTi 1.5°C validation':         ['Scope 3 Cat 11 disclosure'],
  'TCFD-aligned climate report':   [],
  'Water-positive pledge + disclosure': [],
  'Supplier ESG audit programme':  [],
  'Board ESG committee formalisation': [],
  'Scope 3 Cat 11 disclosure':     [],
  'Human rights due-diligence policy': ['Board ESG committee formalisation'],
  'Biodiversity baseline (TNFD)':  [],
  'Whistleblower & anti-corruption uplift': [],
  'DE&I targets + disclosure':     [],
};

// -------------------------------------------------------------------------
// 13. TCFD — TRANSITION RISK + CARBON PRICE PATHS + IFRS S2 CHECKLIST
// -------------------------------------------------------------------------
export const CARBON_PRICE_PATHS = {
  'NGFS Orderly (1.5°C)':      { 2025: 80,  2030: 160, 2040: 280, 2050: 400 },
  'NGFS Divergent (1.5°C)':    { 2025: 35,  2030: 200, 2040: 420, 2050: 620 },
  'NGFS Delayed (1.8°C)':      { 2025: 15,  2030: 90,  2040: 320, 2050: 580 },
  'NGFS Current Policies':     { 2025: 10,  2030: 35,  2040: 80,  2050: 140 },
  'IEA NZE 2050':              { 2025: 90,  2030: 140, 2040: 205, 2050: 250 },
  'India CCTS (domestic)':     { 2025: 15,  2030: 40,  2040: 80,  2050: 120 },
};

// Transition risk categories with sector sensitivity (elasticity of EBITDA per $100/t carbon price)
export const TRANSITION_ELASTICITY = {
  'Utilities — Power (fossil-heavy)': -0.18,
  'Utilities — Power (renewables)':   +0.04,
  'Cement':                           -0.22,
  'Steel':                            -0.28,
  'Oil & Gas (upstream)':             -0.35,
  'Oil & Gas (downstream)':           -0.15,
  'Aviation':                         -0.20,
  'Shipping':                         -0.15,
  'Chemicals':                        -0.12,
  'Banks (loan book)':                -0.06,
  'Real Estate':                      -0.04,
  'Agriculture':                      -0.10,
};

export const IFRS_S2_CHECKLIST = [
  { id: '6a',  area: 'Governance',       item: 'Oversight body & processes for climate risks/opportunities' },
  { id: '6b',  area: 'Governance',       item: 'Management role in assessing/managing climate' },
  { id: '10',  area: 'Strategy',         item: 'Climate risks/opportunities identified' },
  { id: '13',  area: 'Strategy',         item: 'Current financial effects disclosed' },
  { id: '14',  area: 'Strategy',         item: 'Anticipated financial effects over short/medium/long term' },
  { id: '22',  area: 'Strategy',         item: 'Climate resilience — scenario analysis (incl 2°C-lower)' },
  { id: '25',  area: 'Risk Management',  item: 'Risk assessment process, integration with ERM' },
  { id: '29a', area: 'Metrics & Targets',item: 'Scope 1/2/3 GHG emissions (GHG Protocol)' },
  { id: '29b', area: 'Metrics & Targets',item: 'Cross-industry: capex/opex on climate, internal carbon price' },
  { id: '29d', area: 'Metrics & Targets',item: 'Industry-specific metrics (SASB-based)' },
  { id: '33',  area: 'Metrics & Targets',item: 'Targets: absolute/intensity, base year, pathway, validation' },
];

// Opportunity categories with typical NPV uplift % of EBITDA
export const CLIMATE_OPPORTUNITIES = [
  { name: 'Energy efficiency retrofits',      cat: 'Resource efficiency', npvPctEbitda: 3.5,  horizonY: 4 },
  { name: 'Solar self-consumption',           cat: 'Energy source',       npvPctEbitda: 2.2,  horizonY: 6 },
  { name: 'Product line — climate solutions', cat: 'Products & services', npvPctEbitda: 8.5,  horizonY: 8 },
  { name: 'New geographic markets (emerging)',cat: 'Markets',             npvPctEbitda: 5.0,  horizonY: 10 },
  { name: 'Climate-resilient supply chain',   cat: 'Resilience',          npvPctEbitda: 1.8,  horizonY: 5 },
  { name: 'Carbon-negative product premium',  cat: 'Products & services', npvPctEbitda: 2.9,  horizonY: 7 },
];

// -------------------------------------------------------------------------
// 14. TNFD — MSA, WATER FOOTPRINT, MITIGATION HIERARCHY, GBF TARGETS
// -------------------------------------------------------------------------
// Mean Species Abundance (MSA) loss factor per sector × biome (0-1, 1 = total loss)
export const MSA_LOSS = {
  'Utilities — Renewables': {
    'Arid / Desert': 0.05, 'Semi-arid grassland': 0.12, 'Tropical forest': 0.55,
    'Coastal / Mangrove': 0.70, 'Temperate forest': 0.35, 'Wetlands': 0.60,
    'Agricultural mosaic': 0.02, 'Marine': 0.18,
  },
  'Mining': {
    'Arid / Desert': 0.75, 'Semi-arid grassland': 0.82, 'Tropical forest': 0.95,
    'Coastal / Mangrove': 0.92, 'Temperate forest': 0.88, 'Wetlands': 0.90,
    'Agricultural mosaic': 0.70, 'Marine': 0.85,
  },
  'Agriculture': {
    'Arid / Desert': 0.35, 'Semi-arid grassland': 0.55, 'Tropical forest': 0.80,
    'Coastal / Mangrove': 0.75, 'Temperate forest': 0.65, 'Wetlands': 0.70,
    'Agricultural mosaic': 0.10, 'Marine': 0.05,
  },
  'Real Estate': {
    'Arid / Desert': 0.30, 'Semi-arid grassland': 0.45, 'Tropical forest': 0.85,
    'Coastal / Mangrove': 0.88, 'Temperate forest': 0.68, 'Wetlands': 0.82,
    'Agricultural mosaic': 0.25, 'Marine': 0.50,
  },
};

// Water footprint (m³/ha/yr) blue + green water demand per biome/use
export const WATER_FP = {
  'Arid / Desert':        { blue: 8500, green: 100,  grey: 300 },
  'Semi-arid grassland':  { blue: 3200, green: 2500, grey: 250 },
  'Tropical forest':      { blue: 1200, green: 9500, grey: 180 },
  'Coastal / Mangrove':   { blue: 800,  green: 5800, grey: 400 },
  'Temperate forest':     { blue: 600,  green: 6200, grey: 120 },
  'Wetlands':             { blue: 4200, green: 4800, grey: 220 },
  'Agricultural mosaic':  { blue: 5500, green: 3800, grey: 680 },
  'Marine':               { blue: 0,    green: 0,    grey: 80 },
};

// Mitigation hierarchy with typical cost per unit MSA recovered
export const MITIGATION_HIERARCHY = [
  { step: 'Avoid',     desc: 'Redesign to prevent impact entirely',    costPerMsaHa: 0,    credibility: 100 },
  { step: 'Minimise',  desc: 'Reduce intensity/duration of impact',    costPerMsaHa: 1200, credibility: 85 },
  { step: 'Restore',   desc: 'Repair affected ecosystem in-situ',      costPerMsaHa: 4500, credibility: 70 },
  { step: 'Offset',    desc: 'Compensate via like-for-like elsewhere', costPerMsaHa: 9500, credibility: 40 },
];

// GBF (Kunming-Montreal Global Biodiversity Framework) target alignment
export const GBF_TARGETS = [
  { id: 'T1',  name: 'Spatial planning',             relevanceFor: ['utilities','re','mining'] },
  { id: 'T2',  name: 'Restore 30% degraded',         relevanceFor: ['utilities','re','mining','ag'] },
  { id: 'T3',  name: '30×30 (conserve 30%)',         relevanceFor: ['utilities','re','mining','ag'] },
  { id: 'T7',  name: 'Reduce pollution',             relevanceFor: ['utilities','mining','ag'] },
  { id: 'T10', name: 'Sustainable agri/fish/forest', relevanceFor: ['ag'] },
  { id: 'T14', name: 'Biodiv in decisions/DFS',      relevanceFor: ['utilities','re','mining','ag'] },
  { id: 'T15', name: 'Business assess/disclose',     relevanceFor: ['utilities','re','mining','ag','banks'] },
  { id: 'T18', name: 'Eliminate harmful subsidies',  relevanceFor: ['banks','ag'] },
  { id: 'T19', name: 'Mobilise $200B/yr finance',    relevanceFor: ['banks','utilities'] },
  { id: 'T22', name: 'IPLCs, women, youth',          relevanceFor: ['utilities','re','mining','ag'] },
];

// Ecosystem service Rev-at-Risk multipliers per sector
export const ES_SECTOR_MULT = {
  'Utilities — Renewables': { prov: 0.8, reg: 1.2, cult: 0.3, sup: 1.0 },
  'Mining':                 { prov: 0.4, reg: 0.9, cult: 0.1, sup: 0.6 },
  'Agriculture':            { prov: 1.8, reg: 2.2, cult: 0.8, sup: 2.4 },
  'Real Estate':            { prov: 0.6, reg: 1.5, cult: 1.2, sup: 0.8 },
};

// -------------------------------------------------------------------------
// 15. CCTS — STACKING REVENUES + BUFFER POOL + VINTAGE CURVE
// -------------------------------------------------------------------------
// Parallel instruments stackable with CCTS (₹/tCO₂e or ₹/MWh convertible)
export const STACKING = {
  'PAT ESCerts':       { unit: '₹/tCO₂e',  low: 200,  mid: 450,  high: 850,  convertFactor: 1.0 },
  'I-REC':             { unit: '₹/MWh',    low: 110,  mid: 180,  high: 280,  convertFactor: 1.4 }, // tCO2e per MWh implied
  'Voluntary VCS':     { unit: '₹/tCO₂e',  low: 280,  mid: 620,  high: 1400, convertFactor: 1.0 },
  'Gold Standard':     { unit: '₹/tCO₂e',  low: 420,  mid: 780,  high: 1800, convertFactor: 1.0 },
  'Article 6.2 ITMO':  { unit: '₹/tCO₂e',  low: 800,  mid: 1500, high: 3200, convertFactor: 1.0 },
};

// Buffer pool reserve % by methodology risk (non-permanence / reversal)
export const BUFFER_POOL = {
  'Solar PV (utility)':    0.02, 'Solar rooftop': 0.02, 'Wind onshore': 0.03,
  'Small hydro':           0.05, 'Biomass': 0.08,       'Waste heat recovery': 0.04,
  'Energy efficiency':     0.06, 'Fuel switching': 0.07,
};

// Vintage discount curve — older credits trade at discount to current-vintage prices
export const VINTAGE_CURVE = {
  currentYearPremium: 1.00, oneYearOld: 0.92, twoYearOld: 0.82,
  threeYearOld: 0.70, fiveYearPlus: 0.50,
};

// Registry cycle phase durations (months)
export const REGISTRY_CYCLE = [
  { phase: 'PDD preparation',    months: 2 },
  { phase: 'Validation (DoE)',   months: 3 },
  { phase: 'CCTS registration',  months: 1 },
  { phase: 'Monitoring period',  months: 12 },
  { phase: 'Verification (DoE)', months: 2 },
  { phase: 'CCC issuance',       months: 1 },
];

// Methodology compliance scorecard weights
export const METHOD_COMPLIANCE_WEIGHTS = {
  baselineRule: 15, conservatism: 10, mrvQuality: 20,
  additionality: 20, permanence: 15, leakage: 10, stakeholder: 10,
};

// -------------------------------------------------------------------------
// 16. HELPER FUNCTIONS (cont.)
// -------------------------------------------------------------------------
// Monte Carlo (triangular distribution)
export const monteCarlo = (fn, vars, n = 1000) => {
  const results = [];
  for (let i = 0; i < n; i++) {
    const sample = {};
    for (const k in vars) {
      const { min, mode, max } = vars[k];
      const u = Math.random();
      const F = (mode - min) / (max - min);
      sample[k] = u < F
        ? min + Math.sqrt(u * (max - min) * (mode - min))
        : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
    results.push(fn(sample));
  }
  results.sort((a, b) => a - b);
  return {
    p05: results[Math.floor(n * 0.05)],
    p50: results[Math.floor(n * 0.50)],
    p95: results[Math.floor(n * 0.95)],
    mean: results.reduce((x, y) => x + y, 0) / n,
    samples: results,
  };
};
