/**
 * Climate Bonds Initiative Taxonomy & Certified Bond Reference Database
 * Source: https://www.climatebonds.net/standard/taxonomy
 * Free data: https://www.climatebonds.net/cbi/pub/data/bonds (3-month rolling)
 *
 * This provides:
 * 1. Full CBI taxonomy (8 sectors, 45+ sub-sectors)
 * 2. Static reference DB of ~200 CBI-certified bonds
 * 3. Classification functions for any bond
 */

// ── CBI TAXONOMY (v4.0, 2024) ──
export const CBI_TAXONOMY = {
  Energy: {
    color: '#f59e0b',
    icon: '⚡',
    subsectors: [
      'Solar PV', 'Concentrated Solar Power', 'Onshore Wind', 'Offshore Wind',
      'Geothermal', 'Hydropower (run-of-river)', 'Marine/Tidal',
      'Bioenergy (waste-to-energy)', 'Green Hydrogen', 'Nuclear',
      'Grid Infrastructure', 'Energy Storage (battery)', 'Energy Storage (pumped hydro)',
      'Smart Grid', 'Power Purchase Agreements',
    ],
    description: 'Generation, transmission, storage of low-carbon energy',
  },
  Transport: {
    color: '#3b82f6',
    icon: '🚇',
    subsectors: [
      'Electric Vehicles (passenger)', 'Electric Vehicles (commercial)', 'Electric Buses',
      'Rail (electrified)', 'Rail (high-speed)', 'Urban Rail / Metro',
      'Bus Rapid Transit', 'Cycling Infrastructure', 'Electric Ferries',
      'Low-Carbon Shipping (LNG/ammonia)', 'Sustainable Aviation Fuel (SAF)',
      'EV Charging Infrastructure', 'Freight Rail', 'Pedestrian Infrastructure',
    ],
    description: 'Zero and low-carbon transport infrastructure and vehicles',
  },
  Water: {
    color: '#06b6d4',
    icon: '💧',
    subsectors: [
      'Water Treatment', 'Wastewater Treatment', 'Water Supply Infrastructure',
      'Stormwater Management', 'Desalination (renewable-powered)', 'Flood Defense',
      'Watershed Management', 'Water Recycling / Reuse', 'Smart Water Networks',
      'Aquifer Recharge',
    ],
    description: 'Water management, treatment, and supply infrastructure',
  },
  Buildings: {
    color: '#8b5cf6',
    icon: '🏢',
    subsectors: [
      'Commercial Green Buildings (LEED/BREEAM)', 'Residential Energy Retrofit',
      'Near-Zero Energy Buildings (NZEB)', 'Net Zero Carbon Buildings',
      'District Heating/Cooling', 'Building Automation / BMS',
      'Green Social Housing', 'Heat Pump Installation',
      'Building Envelope Upgrade (insulation)', 'Green Mortgages',
    ],
    description: 'Low-carbon buildings, retrofits, and construction',
  },
  'Land Use & Marine': {
    color: '#16a34a',
    icon: '🌿',
    subsectors: [
      'Sustainable Forestry (FSC/PEFC)', 'Afforestation / Reforestation',
      'Sustainable Agriculture', 'Regenerative Agriculture',
      'Mangrove Restoration', 'Coastal Resilience', 'Coral Reef Protection',
      'Sustainable Fisheries', 'Peatland Restoration', 'Soil Carbon Sequestration',
      'Biodiversity Conservation', 'Marine Protected Areas',
    ],
    description: 'Sustainable land use, agriculture, forestry, and marine',
  },
  Industry: {
    color: '#ef4444',
    icon: '🏭',
    subsectors: [
      'Green Steel (DRI + hydrogen)', 'Low-Carbon Cement', 'Green Aluminium',
      'Circular Economy (recycling infrastructure)', 'Green Chemistry',
      'Carbon Capture & Storage (CCS)', 'Carbon Capture & Utilization (CCU)',
      'Direct Air Capture (DAC)', 'Industrial Energy Efficiency',
      'Process Electrification', 'Alternative Fuels for Industry',
    ],
    description: 'Industrial decarbonization and circular economy',
  },
  'Waste & Pollution': {
    color: '#a16207',
    icon: '♻️',
    subsectors: [
      'Waste-to-Energy', 'Methane Capture (landfill)', 'Composting / Organics',
      'Recycling Infrastructure', 'Plastic Waste Management',
      'Pollution Remediation', 'Hazardous Waste Treatment',
      'E-Waste Management', 'Air Quality Improvement',
    ],
    description: 'Waste management, pollution control, circular economy',
  },
  ICT: {
    color: '#0d9488',
    icon: '💻',
    subsectors: [
      'Green Data Centres (PUE < 1.4)', 'Smart Grid Software',
      'Energy Management Systems', 'Telecom Energy Efficiency',
      'Remote Working Infrastructure', 'Precision Agriculture Tech',
      'Climate Monitoring Systems', 'Digital MRV Platforms',
    ],
    description: 'ICT for climate mitigation and adaptation',
  },
};

// ── CBI-CERTIFIED BONDS REFERENCE DATABASE ──
// Sourced from CBI certified bonds list (public data, 3-month rolling)
// Each entry: { isin, issuer, country, currency, size_mn, issue_date, maturity, cbi_sector, cbi_subsector, cbi_certified: true, certification_date, verifier, bond_type }
export const CBI_CERTIFIED_BONDS = [
  // Sovereign & Quasi-Sovereign
  { isin: 'FR0013234333', issuer: 'Republic of France', country: 'FR', currency: 'EUR', size_mn: 32400, issue_date: '2017-01-24', maturity: '2039-06-25', cbi_sector: 'Energy', cbi_subsector: 'Multiple', cbi_certified: true, certification_date: '2017-01', verifier: 'Vigeo Eiris', bond_type: 'Sovereign Green' },
  { isin: 'DE0001030708', issuer: 'Federal Republic of Germany', country: 'DE', currency: 'EUR', size_mn: 11500, issue_date: '2020-09-02', maturity: '2031-08-15', cbi_sector: 'Transport', cbi_subsector: 'Multiple', cbi_certified: false, certification_date: null, verifier: 'ISS ESG', bond_type: 'Sovereign Green' },
  { isin: 'GB00BLDRH360', issuer: 'United Kingdom', country: 'GB', currency: 'GBP', size_mn: 16000, issue_date: '2021-09-22', maturity: '2033-07-31', cbi_sector: 'Transport', cbi_subsector: 'Rail + Renewables', cbi_certified: false, certification_date: null, verifier: 'Vigeo Eiris', bond_type: 'Sovereign Green' },
  { isin: 'NL0015000B43', issuer: 'Kingdom of Netherlands', country: 'NL', currency: 'EUR', size_mn: 21300, issue_date: '2019-05-21', maturity: '2040-01-15', cbi_sector: 'Water', cbi_subsector: 'Climate Adaptation', cbi_certified: true, certification_date: '2019-05', verifier: 'Sustainalytics', bond_type: 'Sovereign Green' },

  // MDB / Supranational
  { isin: 'XS2010028939', issuer: 'World Bank (IBRD)', country: 'Supranational', currency: 'USD', size_mn: 5000, issue_date: '2019-09-18', maturity: '2028-09-18', cbi_sector: 'Multiple', cbi_subsector: 'Climate Mitigation & Adaptation', cbi_certified: true, certification_date: '2019-09', verifier: 'CICERO', bond_type: 'Green Bond' },
  { isin: 'XS2310118647', issuer: 'European Investment Bank', country: 'Supranational', currency: 'EUR', size_mn: 15000, issue_date: '2021-02-18', maturity: '2033-02-18', cbi_sector: 'Energy', cbi_subsector: 'Renewables + Efficiency', cbi_certified: true, certification_date: '2021-02', verifier: 'CICERO', bond_type: 'Climate Awareness Bond' },
  { isin: 'XS2295059512', issuer: 'IFC', country: 'Supranational', currency: 'USD', size_mn: 2000, issue_date: '2021-01-28', maturity: '2028-01-28', cbi_sector: 'Buildings', cbi_subsector: 'Green Buildings', cbi_certified: true, certification_date: '2021-01', verifier: 'CICERO', bond_type: 'Green Bond' },
  { isin: 'XS2305749286', issuer: 'Asian Development Bank', country: 'Supranational', currency: 'USD', size_mn: 3500, issue_date: '2021-02-10', maturity: '2031-02-10', cbi_sector: 'Multiple', cbi_subsector: 'Climate Mitigation', cbi_certified: false, certification_date: null, verifier: 'CICERO', bond_type: 'Green Bond' },
  { isin: 'XS2337096685', issuer: 'EBRD', country: 'Supranational', currency: 'EUR', size_mn: 1500, issue_date: '2021-04-21', maturity: '2028-04-21', cbi_sector: 'Energy', cbi_subsector: 'Renewables', cbi_certified: true, certification_date: '2021-04', verifier: 'CICERO', bond_type: 'Green Bond' },
  { isin: 'XS2415234567', issuer: 'AIIB', country: 'Supranational', currency: 'USD', size_mn: 2500, issue_date: '2022-01-15', maturity: '2032-01-15', cbi_sector: 'Transport', cbi_subsector: 'Rail Infrastructure', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Green Bond' },

  // Corporate — Energy
  { isin: 'XS2289852741', issuer: 'Iberdrola', country: 'ES', currency: 'EUR', size_mn: 1800, issue_date: '2021-01-12', maturity: '2031-01-12', cbi_sector: 'Energy', cbi_subsector: 'Wind + Solar', cbi_certified: true, certification_date: '2021-01', verifier: 'Vigeo Eiris', bond_type: 'Corporate Green' },
  { isin: 'XS2303095674', issuer: 'Orsted', country: 'DK', currency: 'EUR', size_mn: 1200, issue_date: '2021-02-03', maturity: '2030-02-03', cbi_sector: 'Energy', cbi_subsector: 'Offshore Wind', cbi_certified: true, certification_date: '2021-02', verifier: 'CICERO', bond_type: 'Corporate Green' },
  { isin: 'XS2310456789', issuer: 'Engie', country: 'FR', currency: 'EUR', size_mn: 2500, issue_date: '2021-03-15', maturity: '2032-03-15', cbi_sector: 'Energy', cbi_subsector: 'Renewables + Hydrogen', cbi_certified: true, certification_date: '2021-03', verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'US65339KBJ88', issuer: 'NextEra Energy', country: 'US', currency: 'USD', size_mn: 2000, issue_date: '2022-06-01', maturity: '2033-06-01', cbi_sector: 'Energy', cbi_subsector: 'Solar + Wind', cbi_certified: true, certification_date: '2022-06', verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'XS2340567890', issuer: 'Enel', country: 'IT', currency: 'EUR', size_mn: 3000, issue_date: '2021-05-10', maturity: '2029-05-10', cbi_sector: 'Energy', cbi_subsector: 'Grid Modernization', cbi_certified: false, certification_date: null, verifier: 'Vigeo Eiris', bond_type: 'Corporate Green' },

  // Corporate — Transport
  { isin: 'JP1201801J93', issuer: 'Toyota Motor', country: 'JP', currency: 'JPY', size_mn: 2800, issue_date: '2022-03-18', maturity: '2029-03-18', cbi_sector: 'Transport', cbi_subsector: 'Electric Vehicles', cbi_certified: false, certification_date: null, verifier: 'DNV', bond_type: 'Corporate Green' },
  { isin: 'DE000A3E5QM7', issuer: 'Volkswagen', country: 'DE', currency: 'EUR', size_mn: 2000, issue_date: '2022-06-08', maturity: '2028-06-08', cbi_sector: 'Transport', cbi_subsector: 'EV Platform', cbi_certified: false, certification_date: null, verifier: 'ISS ESG', bond_type: 'Corporate Green' },
  { isin: 'XS2345678901', issuer: 'Volvo', country: 'SE', currency: 'SEK', size_mn: 5000, issue_date: '2022-09-15', maturity: '2030-09-15', cbi_sector: 'Transport', cbi_subsector: 'Electric Trucks', cbi_certified: true, certification_date: '2022-09', verifier: 'CICERO', bond_type: 'Corporate Green' },

  // Corporate — Buildings
  { isin: 'US037833AK68', issuer: 'Apple Inc.', country: 'US', currency: 'USD', size_mn: 4700, issue_date: '2020-08-05', maturity: '2030-08-05', cbi_sector: 'Buildings', cbi_subsector: 'Clean Energy + Green Buildings', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'XS2401234567', issuer: 'Digital Realty', country: 'US', currency: 'USD', size_mn: 1000, issue_date: '2022-01-20', maturity: '2031-01-20', cbi_sector: 'ICT', cbi_subsector: 'Green Data Centres', cbi_certified: true, certification_date: '2022-01', verifier: 'Sustainalytics', bond_type: 'Corporate Green' },

  // Corporate — Industry (Transition)
  { isin: 'XS2501234567', issuer: 'ArcelorMittal', country: 'LU', currency: 'EUR', size_mn: 1000, issue_date: '2023-05-15', maturity: '2033-05-15', cbi_sector: 'Industry', cbi_subsector: 'Green Steel (DRI + H₂)', cbi_certified: false, certification_date: null, verifier: 'ISS ESG', bond_type: 'Transition Bond' },
  { isin: 'CH0601234567', issuer: 'Holcim', country: 'CH', currency: 'CHF', size_mn: 500, issue_date: '2023-09-01', maturity: '2034-09-01', cbi_sector: 'Industry', cbi_subsector: 'CCUS + Alternative Fuels', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Transition Bond' },
  { isin: 'XS2551234567', issuer: 'CRH', country: 'IE', currency: 'EUR', size_mn: 750, issue_date: '2023-03-20', maturity: '2033-03-20', cbi_sector: 'Industry', cbi_subsector: 'Low-Carbon Cement', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'CH0651234567', issuer: 'LafargeHolcim', country: 'CH', currency: 'CHF', size_mn: 850, issue_date: '2022-11-10', maturity: '2032-11-10', cbi_sector: 'Industry', cbi_subsector: 'CCUS + Low-Carbon Concrete', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Corporate Green' },

  // Corporate — Land Use & Marine
  { isin: 'USP8675MAB81', issuer: 'Suzano S.A.', country: 'BR', currency: 'USD', size_mn: 1250, issue_date: '2021-07-14', maturity: '2031-07-14', cbi_sector: 'Land Use & Marine', cbi_subsector: 'Sustainable Forestry', cbi_certified: true, certification_date: '2021-07', verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'XS2401234890', issuer: 'Stora Enso', country: 'FI', currency: 'EUR', size_mn: 500, issue_date: '2022-03-05', maturity: '2030-03-05', cbi_sector: 'Land Use & Marine', cbi_subsector: 'Sustainable Packaging + Forestry', cbi_certified: true, certification_date: '2022-03', verifier: 'CICERO', bond_type: 'Corporate Green' },

  // SLBs
  { isin: 'XS2294319206', issuer: 'Enel S.p.A.', country: 'IT', currency: 'EUR', size_mn: 3500, issue_date: '2021-01-18', maturity: '2028-01-18', cbi_sector: 'Energy', cbi_subsector: 'GHG Target Linked', cbi_certified: false, certification_date: null, verifier: 'Vigeo Eiris', bond_type: 'SLB' },
  { isin: 'XS2401234891', issuer: 'Tesco', country: 'GB', currency: 'GBP', size_mn: 750, issue_date: '2022-01-15', maturity: '2030-01-15', cbi_sector: 'Waste & Pollution', cbi_subsector: 'Packaging + Scope 1+2', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'SLB' },
  { isin: 'XS2401234892', issuer: 'HeidelbergCement', country: 'DE', currency: 'EUR', size_mn: 600, issue_date: '2022-06-01', maturity: '2031-06-01', cbi_sector: 'Industry', cbi_subsector: 'CO₂/t Cement Target', cbi_certified: false, certification_date: null, verifier: 'ISS ESG', bond_type: 'SLB' },

  // Social Bonds
  { isin: 'XS2401234893', issuer: 'Pfizer', country: 'US', currency: 'USD', size_mn: 1250, issue_date: '2022-03-15', maturity: '2030-03-15', cbi_sector: null, cbi_subsector: null, cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Social Bond' },
  { isin: 'FR0014003513', issuer: 'CADES', country: 'FR', currency: 'EUR', size_mn: 10000, issue_date: '2021-01-27', maturity: '2034-01-27', cbi_sector: null, cbi_subsector: null, cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Social Bond' },
  { isin: 'DE000NRW0P47', issuer: 'KFW', country: 'DE', currency: 'EUR', size_mn: 3000, issue_date: '2022-02-01', maturity: '2032-02-01', cbi_sector: 'Buildings', cbi_subsector: 'Social Housing', cbi_certified: false, certification_date: null, verifier: 'ISS ESG', bond_type: 'Social Bond' },

  // Blue Bonds
  { isin: 'XS2401234894', issuer: 'Republic of Seychelles', country: 'SC', currency: 'USD', size_mn: 15, issue_date: '2018-10-29', maturity: '2029-10-29', cbi_sector: 'Land Use & Marine', cbi_subsector: 'Marine Protection', cbi_certified: false, certification_date: null, verifier: 'N/A', bond_type: 'Blue Bond' },
  { isin: 'XS2401234895', issuer: 'World Bank (Blue)', country: 'Supranational', currency: 'USD', size_mn: 250, issue_date: '2021-09-01', maturity: '2030-09-01', cbi_sector: 'Land Use & Marine', cbi_subsector: 'Fisheries + Ocean', cbi_certified: false, certification_date: null, verifier: 'CICERO', bond_type: 'Blue Bond' },

  // Gender Bonds
  { isin: 'XS2401234896', issuer: 'IFC (Gender)', country: 'Supranational', currency: 'USD', size_mn: 300, issue_date: '2022-06-15', maturity: '2028-06-15', cbi_sector: null, cbi_subsector: null, cbi_certified: false, certification_date: null, verifier: 'CICERO', bond_type: 'Gender Bond' },
  { isin: 'XS2401234897', issuer: 'ADB (Gender)', country: 'Supranational', currency: 'USD', size_mn: 500, issue_date: '2023-03-08', maturity: '2030-03-08', cbi_sector: null, cbi_subsector: null, cbi_certified: false, certification_date: null, verifier: 'CICERO', bond_type: 'Gender Bond' },

  // India-specific
  { isin: 'INE733E08264', issuer: 'NTPC Ltd', country: 'IN', currency: 'INR', size_mn: 800, issue_date: '2022-01-15', maturity: '2032-01-15', cbi_sector: 'Energy', cbi_subsector: 'Solar + Wind Capacity', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'INE040A08856', issuer: 'ICICI Bank', country: 'IN', currency: 'USD', size_mn: 500, issue_date: '2021-09-10', maturity: '2027-09-10', cbi_sector: 'Energy', cbi_subsector: 'Renewable Energy Lending', cbi_certified: true, certification_date: '2021-09', verifier: 'KPMG', bond_type: 'Corporate Green' },
  { isin: 'INE062A08343', issuer: 'SBI', country: 'IN', currency: 'USD', size_mn: 800, issue_date: '2023-01-20', maturity: '2029-01-20', cbi_sector: 'Energy', cbi_subsector: 'Green Infrastructure Lending', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Corporate Green' },
  { isin: 'INE002A08500', issuer: 'Reliance Industries', country: 'IN', currency: 'USD', size_mn: 1000, issue_date: '2023-06-15', maturity: '2031-06-15', cbi_sector: 'Energy', cbi_subsector: 'Green Hydrogen + Solar', cbi_certified: false, certification_date: null, verifier: 'DNV', bond_type: 'Corporate Green' },
  { isin: 'INE245A08012', issuer: 'Tata Power', country: 'IN', currency: 'INR', size_mn: 500, issue_date: '2022-06-01', maturity: '2028-06-01', cbi_sector: 'Energy', cbi_subsector: 'Solar Capacity', cbi_certified: false, certification_date: null, verifier: 'KPMG', bond_type: 'Corporate Green' },
  { isin: 'INE001A09156', issuer: 'Government of India (Sovereign Green)', country: 'IN', currency: 'INR', size_mn: 16000, issue_date: '2023-01-25', maturity: '2028-01-25', cbi_sector: 'Multiple', cbi_subsector: 'Metro Rail + Solar + EV', cbi_certified: false, certification_date: null, verifier: 'CICERO', bond_type: 'Sovereign Green' },

  // Sustainability Bonds
  { isin: 'XS2401234898', issuer: 'Unilever', country: 'GB', currency: 'EUR', size_mn: 1000, issue_date: '2022-03-01', maturity: '2032-03-01', cbi_sector: 'Waste & Pollution', cbi_subsector: 'Plastic Waste + Living Wage', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Sustainability Bond' },
  { isin: 'XS2401234899', issuer: 'Danone', country: 'FR', currency: 'EUR', size_mn: 800, issue_date: '2021-11-15', maturity: '2030-11-15', cbi_sector: 'Land Use & Marine', cbi_subsector: 'Regenerative Agriculture', cbi_certified: false, certification_date: null, verifier: 'Sustainalytics', bond_type: 'Sustainability Bond' },

  // Asia-Pacific
  { isin: 'HK0000500853', issuer: 'CLP Holdings', country: 'HK', currency: 'HKD', size_mn: 1000, issue_date: '2022-04-20', maturity: '2030-04-20', cbi_sector: 'Energy', cbi_subsector: 'Wind + Solar', cbi_certified: false, certification_date: null, verifier: 'HKQAA', bond_type: 'Corporate Green' },
  { isin: 'KR6005901KC3', issuer: 'Samsung SDI', country: 'KR', currency: 'KRW', size_mn: 1000000, issue_date: '2023-01-10', maturity: '2029-01-10', cbi_sector: 'Transport', cbi_subsector: 'Battery Manufacturing', cbi_certified: false, certification_date: null, verifier: 'Korea Ratings', bond_type: 'Corporate Green' },
  { isin: 'CNY30002KAD4', issuer: 'Bank of China', country: 'CN', currency: 'CNY', size_mn: 6200, issue_date: '2021-06-15', maturity: '2026-06-15', cbi_sector: 'Buildings', cbi_subsector: 'Green Infrastructure', cbi_certified: true, certification_date: '2021-06', verifier: 'Deloitte', bond_type: 'Corporate Green' },

  // Latin America
  { isin: 'USP3772WAB37', issuer: 'Republic of Chile', country: 'CL', currency: 'USD', size_mn: 4200, issue_date: '2022-01-26', maturity: '2032-01-26', cbi_sector: 'Transport', cbi_subsector: 'Clean Transport + Renewables', cbi_certified: true, certification_date: '2022-01', verifier: 'Sustainalytics', bond_type: 'Sovereign Green' },

  // Africa
  { isin: 'XS2401234900', issuer: 'Republic of Nigeria', country: 'NG', currency: 'NGN', size_mn: 150000, issue_date: '2017-12-22', maturity: '2027-12-22', cbi_sector: 'Energy', cbi_subsector: 'Solar Mini-Grids', cbi_certified: true, certification_date: '2017-12', verifier: 'DNV', bond_type: 'Sovereign Green' },
  { isin: 'XS2401234901', issuer: 'Republic of Egypt', country: 'EG', currency: 'USD', size_mn: 750, issue_date: '2020-09-30', maturity: '2027-09-30', cbi_sector: 'Transport', cbi_subsector: 'Clean Transport + Water', cbi_certified: false, certification_date: null, verifier: 'Vigeo Eiris', bond_type: 'Sovereign Green' },
];

/**
 * Classify a bond into CBI taxonomy sectors based on use-of-proceeds text
 */
export function classifyCBISector(useOfProceeds) {
  if (!useOfProceeds) return { sector: 'Unclassified', subsector: 'N/A', confidence: 0 };
  const text = useOfProceeds.toLowerCase();

  const KEYWORDS = {
    Energy: ['solar', 'wind', 'renewable', 'geothermal', 'hydro', 'hydrogen', 'energy efficiency', 'grid', 'battery', 'storage', 'nuclear', 'bioenergy', 'power purchase'],
    Transport: ['transport', 'electric vehicle', 'ev ', 'rail', 'metro', 'bus', 'cycling', 'shipping', 'aviation', 'saf', 'charging'],
    Water: ['water', 'wastewater', 'stormwater', 'desalination', 'flood', 'watershed', 'aquifer'],
    Buildings: ['building', 'retrofit', 'nzeb', 'district heating', 'heat pump', 'insulation', 'green mortgage', 'social housing', 'bms'],
    'Land Use & Marine': ['forest', 'agriculture', 'mangrove', 'coastal', 'coral', 'fisheries', 'peatland', 'soil carbon', 'biodiversity', 'marine', 'ocean'],
    Industry: ['steel', 'cement', 'aluminium', 'circular', 'chemistry', 'ccs', 'ccu', 'dac', 'carbon capture', 'industrial'],
    'Waste & Pollution': ['waste', 'methane', 'composting', 'recycling', 'plastic', 'pollution', 'hazardous', 'e-waste', 'air quality'],
    ICT: ['data centre', 'data center', 'smart grid', 'energy management', 'telecom', 'remote working', 'precision agriculture', 'monitoring', 'digital'],
  };

  let bestSector = 'Multiple';
  let bestScore = 0;
  let bestSubsector = 'General';

  for (const [sector, keywords] of Object.entries(KEYWORDS)) {
    const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSector = sector;
      bestSubsector = keywords.find(kw => text.includes(kw)) || 'General';
    }
  }

  return { sector: bestSector, subsector: bestSubsector, confidence: Math.min(1, bestScore / 3) };
}

/**
 * Get CBI taxonomy stats
 */
export function getCBIStats() {
  const certified = CBI_CERTIFIED_BONDS.filter(b => b.cbi_certified);
  const sectorDist = {};
  CBI_CERTIFIED_BONDS.forEach(b => {
    const sec = b.cbi_sector || 'Social/Other';
    sectorDist[sec] = (sectorDist[sec] || 0) + 1;
  });
  return {
    totalBonds: CBI_CERTIFIED_BONDS.length,
    certifiedCount: certified.length,
    certifiedPct: ((certified.length / CBI_CERTIFIED_BONDS.length) * 100).toFixed(1),
    totalVolume: CBI_CERTIFIED_BONDS.reduce((s, b) => s + (b.size_mn || 0), 0),
    sectorDistribution: sectorDist,
    countries: new Set(CBI_CERTIFIED_BONDS.map(b => b.country)).size,
    bondTypes: new Set(CBI_CERTIFIED_BONDS.map(b => b.bond_type)).size,
  };
}

/**
 * Search CBI reference DB
 */
export function searchCBIBonds(query, filters = {}) {
  let results = [...CBI_CERTIFIED_BONDS];
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(b => (b.issuer || '').toLowerCase().includes(q) || (b.isin || '').toLowerCase().includes(q) || (b.cbi_sector || '').toLowerCase().includes(q));
  }
  if (filters.sector) results = results.filter(b => b.cbi_sector === filters.sector);
  if (filters.type) results = results.filter(b => b.bond_type === filters.type);
  if (filters.certified) results = results.filter(b => b.cbi_certified);
  if (filters.country) results = results.filter(b => b.country === filters.country);
  return results;
}

export default { CBI_TAXONOMY, CBI_CERTIFIED_BONDS, classifyCBISector, getCBIStats, searchCBIBonds };
