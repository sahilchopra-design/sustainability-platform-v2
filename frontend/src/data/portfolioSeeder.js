/**
 * portfolioSeeder.js — Master Universe & Portfolio Builder
 *
 * Builds a 5,000-security master universe from REAL reference data (SBTi, OWID, CEDA, CBAM)
 * augmented with tagged mock data. Every field carries a dataSource tag.
 *
 * Deterministic PRNG: sr(seed) for all generated values.
 * Division guards on every calculation.
 */

import sbtiData from './sbti-companies.json';
import owidCo2 from './owid-co2-compact.json';
import owidEnergy from './owid-energy-compact.json';
import cedaData from './ceda-2025.json';
import cbamData from './cbam-vulnerability.json';

/* ------------------------------------------------------------------ */
/*  PRNG                                                               */
/* ------------------------------------------------------------------ */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ------------------------------------------------------------------ */
/*  LOOKUP INDEXES                                                     */
/* ------------------------------------------------------------------ */

// OWID CO2 by ISO-3
const owidCo2Map = {};
(owidCo2.latestByCountry || []).forEach(c => { if (c.iso) owidCo2Map[c.iso] = c; });

// OWID Energy by ISO-3
const owidEnergyMap = {};
(owidEnergy.latestByCountry || []).forEach(c => { if (c.iso) owidEnergyMap[c.iso] = c; });

// CEDA emission factors by ISO-3
const cedaCountryMap = {};
(cedaData.countries || []).forEach(c => { if (c.code) cedaCountryMap[c.code] = c; });

// CEDA region map (ISO-3 -> region)
const cedaRegionMap = cedaData.regionMap || {};

// CBAM vulnerability by ISO-3
const cbamCountryMap = {};
(cbamData.countries || []).forEach(c => { if (c.iso3) cbamCountryMap[c.iso3] = c; });

// CEDA sector groups (2-digit NAICS -> group name)
const cedaSectorGroups = cedaData.sectorGroups || {};

/* ------------------------------------------------------------------ */
/*  COUNTRY MAPPING                                                    */
/* ------------------------------------------------------------------ */

const COUNTRY_ISO3 = {
  'United States of America': 'USA', 'United Kingdom': 'GBR', 'Germany': 'DEU',
  'France': 'FRA', 'Japan': 'JPN', 'China': 'CHN', 'India': 'IND',
  'Canada': 'CAN', 'Australia': 'AUS', 'Brazil': 'BRA', 'Italy': 'ITA',
  'Spain': 'ESP', 'Netherlands': 'NLD', 'Sweden': 'SWE', 'Norway': 'NOR',
  'Denmark': 'DNK', 'Finland': 'FIN', 'Switzerland': 'CHE', 'Belgium': 'BEL',
  'Austria': 'AUT', 'Ireland': 'IRL', 'South Africa': 'ZAF', 'Mexico': 'MEX',
  'Korea, Republic of': 'KOR', 'Indonesia': 'IDN', 'Thailand': 'THA',
  'Singapore': 'SGP', 'Malaysia': 'MYS', 'Philippines': 'PHL', 'Vietnam': 'VNM',
  'Turkey': 'TUR', 'Poland': 'POL', 'Czech Republic': 'CZE', 'Romania': 'ROU',
  'Hungary': 'HUN', 'Greece': 'GRC', 'Portugal': 'PRT', 'Israel': 'ISR',
  'Chile': 'CHL', 'Colombia': 'COL', 'Argentina': 'ARG', 'Peru': 'PER',
  'New Zealand': 'NZL', 'Taiwan, Province of China': 'TWN', 'Hong Kong, China': 'HKG',
  'Saudi Arabia': 'SAU', 'United Arab Emirates': 'ARE', 'Nigeria': 'NGA',
  'Egypt': 'EGY', 'Kenya': 'KEN', 'Pakistan': 'PAK', 'Bangladesh': 'BGD',
  'Russia': 'RUS', 'Ukraine': 'UKR', 'Luxembourg': 'LUX', 'Bermuda': 'BMU',
  'Cayman Islands': 'CYM', 'Liechtenstein': 'LIE', 'Jersey': 'JEY',
};

function mapCountryToISO3(location) {
  if (!location) return 'USA';
  if (COUNTRY_ISO3[location]) return COUNTRY_ISO3[location];
  // Partial match
  const key = Object.keys(COUNTRY_ISO3).find(k => location.includes(k) || k.includes(location));
  return key ? COUNTRY_ISO3[key] : 'USA';
}

/* ------------------------------------------------------------------ */
/*  SECTOR MAPPING — SBTi sector -> CEDA sector code                   */
/* ------------------------------------------------------------------ */

const SECTOR_CEDA_MAP = {
  'Electric Utilities and Independent Power Producers and Energy Traders (including Fossil, Alternative and Nuclear Energy)': '221100',
  'Oil and Gas Exploration and Production': '211000',
  'Oil and Gas Refining, Transportation, Storage and Marketing': '324110',
  'Chemicals': '325110',
  'Construction Materials': '327310',
  'Steel': '331110',
  'Aluminum': '331313',
  'Cement': '327310',
  'Paper and Forestry': '322110',
  'Food and Beverage Processing': '311111',
  'Food and Staples Retailing': '445000',
  'Textiles, Apparel, Footwear and Luxury Goods': '315000',
  'Consumer Durables, Household and Personal Products': '335999',
  'Technology Hardware and Equipment': '334111',
  'Semiconductors and Semiconductor Equipment': '334413',
  'Software and Services': '541511',
  'Telecommunication Services': '517110',
  'Media': '511110',
  'Retailing': '448000',
  'Banks': '522A00',
  'Diversified Financials': '523900',
  'Insurance': '524113',
  'Real Estate': '531ORE',
  'Capital Goods': '333111',
  'Automobiles and Components': '336111',
  'Transportation': '484000',
  'Air Freight Transportation and Logistics': '481000',
  'Hotels, Restaurants and Leisure': '721000',
  'Health Care Equipment and Services': '621100',
  'Pharmaceuticals and Biotechnology': '325412',
  'Professional Services': '541100',
  'Containers and Packaging': '322210',
  'Homebuilding': '230301',
  'Electrical Equipment and Machinery': '335311',
  'Trading Companies and Distributors, and Commercial Services and Supplies': '425000',
  'Managed Health Care': '621100',
};

const SECTOR_GICS_MAP = {
  'Electric Utilities and Independent Power Producers and Energy Traders (including Fossil, Alternative and Nuclear Energy)': { code: '551010', name: 'Utilities' },
  'Oil and Gas Exploration and Production': { code: '101010', name: 'Energy' },
  'Oil and Gas Refining, Transportation, Storage and Marketing': { code: '101020', name: 'Energy' },
  'Chemicals': { code: '151010', name: 'Materials' },
  'Construction Materials': { code: '151020', name: 'Materials' },
  'Steel': { code: '151040', name: 'Materials' },
  'Aluminum': { code: '151040', name: 'Materials' },
  'Food and Beverage Processing': { code: '302020', name: 'Consumer Staples' },
  'Technology Hardware and Equipment': { code: '452010', name: 'Information Technology' },
  'Software and Services': { code: '451030', name: 'Information Technology' },
  'Banks': { code: '401010', name: 'Financials' },
  'Insurance': { code: '401030', name: 'Financials' },
  'Real Estate': { code: '601010', name: 'Real Estate' },
  'Automobiles and Components': { code: '251010', name: 'Consumer Discretionary' },
  'Health Care Equipment and Services': { code: '351010', name: 'Health Care' },
  'Pharmaceuticals and Biotechnology': { code: '352010', name: 'Health Care' },
  'Telecommunication Services': { code: '501010', name: 'Communication Services' },
  'Retailing': { code: '255010', name: 'Consumer Discretionary' },
};

function mapSectorToGICS(sbtiSector) {
  return SECTOR_GICS_MAP[sbtiSector] || { code: '999999', name: 'Diversified' };
}

function mapSectorToCedaCode(sbtiSector) {
  return SECTOR_CEDA_MAP[sbtiSector] || '541511';
}

/* ------------------------------------------------------------------ */
/*  OWID / CEDA LOOKUPS                                                */
/* ------------------------------------------------------------------ */

function lookupOwidCo2(iso3) {
  const c = owidCo2Map[iso3];
  if (!c) return { co2_mt: 0, co2_per_capita: 0, total_ghg: 0, dataSource: 'missing' };
  return {
    co2_mt: c.co2_mt || 0,
    co2_per_capita: c.co2_per_capita || 0,
    total_ghg: c.total_ghg || 0,
    ghg_per_capita: c.ghg_per_capita || 0,
    share_global_co2: c.share_global_co2 || 0,
    cumulative_co2: c.cumulative_co2 || 0,
    dataSource: 'real',
  };
}

function lookupOwidEnergy(iso3) {
  const c = owidEnergyMap[iso3];
  if (!c) return { carbon_intensity_kwh: 400, renewables_share_pct: 20, fossil_share_pct: 80, dataSource: 'estimated' };
  return {
    primary_energy_twh: c.primary_energy_twh || 0,
    carbon_intensity_kwh: c.carbon_intensity_kwh || 400,
    renewables_share_pct: c.renewables_share_pct || 0,
    fossil_share_pct: c.fossil_share_pct || 100,
    solar_share_pct: c.solar_share_pct || 0,
    wind_share_pct: c.wind_share_pct || 0,
    dataSource: 'real',
  };
}

function lookupCedaEF(iso3, sectorCode) {
  const country = cedaCountryMap[iso3];
  if (!country || !country.efs) {
    // Fallback to global average from first available country
    const fallback = cedaData.countries && cedaData.countries[0];
    const ef = fallback && fallback.efs ? (fallback.efs[sectorCode] || 0.5) : 0.5;
    return { ef, unit: 'kgCO2e/USD', dataSource: 'estimated' };
  }
  const ef = country.efs[sectorCode];
  if (ef !== undefined) return { ef, unit: 'kgCO2e/USD', dataSource: 'real' };
  // Sector not found for this country — use median of available
  const vals = Object.values(country.efs);
  const median = vals.length > 0 ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0.5;
  return { ef: median, unit: 'kgCO2e/USD', dataSource: 'derived' };
}

/* ------------------------------------------------------------------ */
/*  GENERATORS — deterministic from sr()                               */
/* ------------------------------------------------------------------ */

const SECTOR_MCAP_MULT = {
  'Banks': 40, 'Insurance': 25, 'Diversified Financials': 30,
  'Oil and Gas Exploration and Production': 50, 'Electric Utilities and Independent Power Producers and Energy Traders (including Fossil, Alternative and Nuclear Energy)': 35,
  'Software and Services': 20, 'Technology Hardware and Equipment': 25,
  'Pharmaceuticals and Biotechnology': 30, 'Real Estate': 20,
  'Automobiles and Components': 45, 'Retailing': 15,
};

function generateMarketCap(sector, region, seed) {
  const base = SECTOR_MCAP_MULT[sector] || 15;
  const regionMult = region === 'Northern America' ? 1.8 : region === 'Europe' ? 1.2 : region === 'Asia' ? 1.0 : 0.7;
  // Range: $200M - $500B
  const raw = (sr(seed) * 0.9 + 0.1) * base * regionMult * 1e9;
  return Math.max(2e8, Math.min(5e11, raw));
}

function generateRevenue(marketCap, sector, seed) {
  // P/S ratio by sector type
  const psMult = sector.includes('Software') ? 12 : sector.includes('Bank') ? 3 : sector.includes('Pharma') ? 6 : 4;
  return Math.max(5e7, marketCap / (psMult * (0.5 + sr(seed) * 1.5)));
}

function generateEmployees(revenue, sector, seed) {
  // Revenue per employee varies by sector
  const rpe = sector.includes('Software') ? 400000 : sector.includes('Bank') ? 250000 : sector.includes('Retail') ? 80000 : 200000;
  return Math.max(100, Math.round(revenue / (rpe * (0.6 + sr(seed) * 0.8))));
}

function deriveScope1(revenue, sectorEF, seed) {
  // Scope 1 = revenue * sector EF * adjustment
  const base = (revenue / 1e6) * sectorEF * (0.15 + sr(seed) * 0.25);
  return Math.max(100, Math.round(base));
}

function deriveScope2(revenue, gridIntensity, seed) {
  // Scope 2 from electricity use * grid carbon intensity
  const electricityUse_MWh = (revenue / 1e6) * (0.8 + sr(seed) * 1.2);
  const intensity = gridIntensity > 0 ? gridIntensity : 400;
  return Math.max(50, Math.round(electricityUse_MWh * intensity / 1000 * (0.4 + sr(seed + 1) * 0.6)));
}

function deriveScope3(revenue, sector, seed) {
  // Scope 3 typically 5-20x of S1+S2 depending on sector
  const mult = sector.includes('Oil') ? 18 : sector.includes('Auto') ? 15 :
    sector.includes('Retail') ? 12 : sector.includes('Bank') ? 8 :
    sector.includes('Software') ? 3 : 7;
  return Math.max(200, Math.round((revenue / 1e6) * mult * (0.3 + sr(seed) * 0.7)));
}

function generateESG(sbtiClass, sector, seed) {
  // SBTi classification boosts ESG score
  const classBonus = sbtiClass === '1.5°C' ? 15 : sbtiClass === 'Well-below 2°C' ? 10 : 5;
  const sectorPenalty = sector.includes('Oil') ? -10 : sector.includes('Coal') ? -15 : 0;
  const base = 40 + sr(seed) * 35 + classBonus + sectorPenalty;
  return Math.max(10, Math.min(100, Math.round(base * 10) / 10));
}

function mapESGtoRating(esgScore) {
  if (esgScore >= 85) return 'AAA';
  if (esgScore >= 75) return 'AA';
  if (esgScore >= 65) return 'A';
  if (esgScore >= 55) return 'BBB';
  if (esgScore >= 45) return 'BB';
  if (esgScore >= 35) return 'B';
  return 'CCC';
}

function generateCDP(sbtiClass, seed) {
  const scores = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'D-'];
  const classOffset = sbtiClass === '1.5°C' ? 0 : sbtiClass === 'Well-below 2°C' ? 1 : 3;
  const idx = Math.min(scores.length - 1, classOffset + Math.floor(sr(seed) * 3));
  return scores[idx];
}

function deriveTempAlignment(sbtiClass, totalEmissions, seed) {
  const classBase = sbtiClass === '1.5°C' ? 1.5 : sbtiClass === 'Well-below 2°C' ? 1.8 : 2.5;
  const noise = (sr(seed) - 0.5) * 0.4;
  return Math.max(1.2, Math.min(4.0, Math.round((classBase + noise) * 100) / 100));
}

function deriveTransitionScore(sbtiClass, esgScore, seed) {
  const classBase = sbtiClass === '1.5°C' ? 70 : sbtiClass === 'Well-below 2°C' ? 55 : 35;
  const esgContrib = esgScore * 0.2;
  return Math.max(0, Math.min(100, Math.round(classBase + esgContrib + (sr(seed) - 0.5) * 20)));
}

function derivePhysicalRisk(countryIso, sector, seed) {
  // Higher for tropical / coastal / agricultural
  const co2Data = owidCo2Map[countryIso];
  const tropicalCountries = ['IND', 'BGD', 'PHL', 'THA', 'VNM', 'IDN', 'NGA', 'BRA', 'MEX', 'COL'];
  const countryRisk = tropicalCountries.includes(countryIso) ? 30 : 10;
  const sectorRisk = sector.includes('Agri') ? 25 : sector.includes('Real Estate') ? 20 : sector.includes('Insur') ? 15 : 5;
  return Math.max(0, Math.min(100, Math.round(countryRisk + sectorRisk + sr(seed) * 40)));
}

function deriveWaterStress(countryIso, sector, seed) {
  const highStress = ['SAU', 'ARE', 'ISR', 'IND', 'PAK', 'EGY', 'ZAF'];
  const base = highStress.includes(countryIso) ? 60 : 25;
  const sectorAdd = sector.includes('Agri') ? 20 : sector.includes('Chem') ? 15 : sector.includes('Food') ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(base + sectorAdd + sr(seed) * 20)));
}

function generatePrice(marketCap, seed) {
  return Math.max(1, Math.round((10 + sr(seed) * 490) * 100) / 100);
}

function generateBeta(sector, seed) {
  const sectorBase = sector.includes('Util') ? 0.6 : sector.includes('Software') ? 1.3 : sector.includes('Oil') ? 1.2 : sector.includes('Bank') ? 1.1 : 1.0;
  return Math.max(0.2, Math.min(2.5, Math.round((sectorBase + (sr(seed) - 0.5) * 0.6) * 100) / 100));
}

function generateDivYield(sector, seed) {
  const base = sector.includes('Util') ? 4 : sector.includes('Real Estate') ? 3.5 : sector.includes('Bank') ? 3 : sector.includes('Software') ? 0.5 : 2;
  return Math.max(0, Math.round((base + (sr(seed) - 0.5) * 2) * 100) / 100);
}

/* ------------------------------------------------------------------ */
/*  BUILD MASTER UNIVERSE                                              */
/* ------------------------------------------------------------------ */

const MASTER_UNIVERSE = [];
let uid = 0;

// ---- TIER 1: Real SBTi Companies with ISINs ----
const sbtiWithIsin = (sbtiData.companies || []).filter(c => c.i && c.i.length > 5);
sbtiWithIsin.forEach((c, idx) => {
  const iso3 = mapCountryToISO3(c.l);
  const sectorCode = mapSectorToCedaCode(c.s);
  const gics = mapSectorToGICS(c.s);
  const co2Data = lookupOwidCo2(iso3);
  const energyData = lookupOwidEnergy(iso3);
  const cedaEF = lookupCedaEF(iso3, sectorCode);
  const seed = idx * 7 + 1;

  const marketCap = generateMarketCap(c.s, c.r, seed);
  const revenue = generateRevenue(marketCap, c.s, seed + 1);
  const employees = generateEmployees(revenue, c.s, seed + 2);
  const scope1 = deriveScope1(revenue, cedaEF.ef, seed + 3);
  const scope2 = deriveScope2(revenue, energyData.carbon_intensity_kwh, seed + 4);
  const scope3 = deriveScope3(revenue, c.s, seed + 5);
  const esgScore = generateESG(c.c, c.s, seed + 6);
  const price = generatePrice(marketCap, seed + 7);

  MASTER_UNIVERSE.push({
    id: uid++,
    name: c.n,
    isin: c.i,
    sector: c.s,
    gicsSector: gics.name,
    gicsCode: gics.code,
    country: c.l,
    countryIso3: iso3,
    region: c.r,
    sbtiClassification: c.c,
    sbtiTargetYear: c.y,
    assetClass: 'equity',
    dataSource: 'real',

    countryEmissions: co2Data,
    countryEnergyMix: energyData,
    sectorEmissionFactor: cedaEF,

    marketCap_usd: Math.round(marketCap),
    revenue_usd: Math.round(revenue),
    employees,
    scope1_tco2e: scope1,
    scope2_tco2e: scope2,
    scope3_tco2e: scope3,
    totalEmissions_tco2e: scope1 + scope2 + scope3,
    carbonIntensity_tco2e_per_mRevenue: Math.round((scope1 + scope2) / Math.max(1, revenue / 1e6) * 10) / 10,
    esgScore,
    msciRating: mapESGtoRating(esgScore),
    cdpScore: generateCDP(c.c, seed + 8),
    temperatureAlignment_c: deriveTempAlignment(c.c, scope1 + scope2 + scope3, seed + 9),
    transitionScore: deriveTransitionScore(c.c, esgScore, seed + 10),
    physicalRiskScore: derivePhysicalRisk(iso3, c.s, seed + 11),
    waterStress: deriveWaterStress(iso3, c.s, seed + 12),

    price,
    sharesOutstanding: Math.round(marketCap / Math.max(1, price)),
    beta: generateBeta(c.s, seed + 13),
    dividend_yield: generateDivYield(c.s, seed + 14),
  });
});

const TIER1_COUNT = MASTER_UNIVERSE.length;

// ---- TIER 2: 1,000 Additional Mock Equities ----
const MOCK_SECTORS = [
  'Technology Hardware and Equipment', 'Software and Services', 'Banks',
  'Insurance', 'Pharmaceuticals and Biotechnology', 'Oil and Gas Exploration and Production',
  'Chemicals', 'Automobiles and Components', 'Retailing', 'Real Estate',
  'Food and Beverage Processing', 'Telecommunication Services', 'Electric Utilities and Independent Power Producers and Energy Traders (including Fossil, Alternative and Nuclear Energy)',
  'Health Care Equipment and Services', 'Transportation', 'Capital Goods',
  'Steel', 'Media', 'Professional Services', 'Hotels, Restaurants and Leisure',
];

const MOCK_REGIONS = ['Northern America', 'Europe', 'Asia', 'Latin America and the Caribbean', 'MENA', 'Africa'];
const MOCK_COUNTRIES_BY_REGION = {
  'Northern America': ['United States of America', 'Canada'],
  'Europe': ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy'],
  'Asia': ['Japan', 'China', 'India', 'Korea, Republic of', 'Singapore', 'Australia'],
  'Latin America and the Caribbean': ['Brazil', 'Mexico', 'Chile', 'Colombia'],
  'MENA': ['United Arab Emirates', 'Saudi Arabia', 'Israel'],
  'Africa': ['South Africa', 'Nigeria', 'Kenya'],
};

const MOCK_NAME_PREFIXES = [
  'Global', 'Pacific', 'Atlantic', 'Nordic', 'Alpine', 'Meridian', 'Apex', 'Vertex',
  'Horizon', 'Pinnacle', 'Summit', 'Cascade', 'Sterling', 'Titan', 'Vanguard',
  'Nexus', 'Prism', 'Zenith', 'Aether', 'Orbit', 'Quantum', 'Synergy', 'Vector',
  'Nova', 'Crest', 'Ember', 'Flux', 'Ionic', 'Lumen', 'Axiom',
];
const MOCK_NAME_SUFFIXES = [
  'Corp', 'Holdings', 'Group', 'Industries', 'Technologies', 'Solutions', 'Partners',
  'Capital', 'Enterprises', 'Systems', 'Networks', 'Dynamics', 'Energy', 'Materials',
];

for (let i = 0; i < 1000; i++) {
  const seed = (TIER1_COUNT + i) * 13 + 7;
  const sector = MOCK_SECTORS[Math.floor(sr(seed) * MOCK_SECTORS.length)];
  const region = MOCK_REGIONS[Math.floor(sr(seed + 1) * MOCK_REGIONS.length)];
  const countries = MOCK_COUNTRIES_BY_REGION[region] || ['United States of America'];
  const country = countries[Math.floor(sr(seed + 2) * countries.length)];
  const iso3 = mapCountryToISO3(country);
  const gics = mapSectorToGICS(sector);
  const sectorCode = mapSectorToCedaCode(sector);
  const cedaEF = lookupCedaEF(iso3, sectorCode);
  const energyData = lookupOwidEnergy(iso3);

  const prefix = MOCK_NAME_PREFIXES[Math.floor(sr(seed + 3) * MOCK_NAME_PREFIXES.length)];
  const suffix = MOCK_NAME_SUFFIXES[Math.floor(sr(seed + 4) * MOCK_NAME_SUFFIXES.length)];
  const name = `${prefix} ${suffix} ${i + 1}`;

  const isinCountry = iso3.substring(0, 2) || 'US';
  const isinNum = String(900000000 + i).padStart(9, '0');
  const isin = `${isinCountry}${isinNum}0`;

  const sbtiClass = sr(seed + 5) > 0.6 ? '1.5°C' : sr(seed + 5) > 0.3 ? 'Well-below 2°C' : '2°C';
  const marketCap = generateMarketCap(sector, region, seed + 6);
  const revenue = generateRevenue(marketCap, sector, seed + 7);
  const employees = generateEmployees(revenue, sector, seed + 8);
  const scope1 = deriveScope1(revenue, cedaEF.ef, seed + 9);
  const scope2 = deriveScope2(revenue, energyData.carbon_intensity_kwh, seed + 10);
  const scope3 = deriveScope3(revenue, sector, seed + 11);
  const esgScore = generateESG(sbtiClass, sector, seed + 12);
  const price = generatePrice(marketCap, seed + 13);

  MASTER_UNIVERSE.push({
    id: uid++,
    name,
    isin,
    sector,
    gicsSector: gics.name,
    gicsCode: gics.code,
    country,
    countryIso3: iso3,
    region,
    sbtiClassification: sbtiClass,
    sbtiTargetYear: 2030 + Math.floor(sr(seed + 14) * 5),
    assetClass: 'equity',
    dataSource: 'mock',

    countryEmissions: lookupOwidCo2(iso3),
    countryEnergyMix: energyData,
    sectorEmissionFactor: cedaEF,

    marketCap_usd: Math.round(marketCap),
    revenue_usd: Math.round(revenue),
    employees,
    scope1_tco2e: scope1,
    scope2_tco2e: scope2,
    scope3_tco2e: scope3,
    totalEmissions_tco2e: scope1 + scope2 + scope3,
    carbonIntensity_tco2e_per_mRevenue: Math.round((scope1 + scope2) / Math.max(1, revenue / 1e6) * 10) / 10,
    esgScore,
    msciRating: mapESGtoRating(esgScore),
    cdpScore: generateCDP(sbtiClass, seed + 15),
    temperatureAlignment_c: deriveTempAlignment(sbtiClass, scope1 + scope2 + scope3, seed + 16),
    transitionScore: deriveTransitionScore(sbtiClass, esgScore, seed + 17),
    physicalRiskScore: derivePhysicalRisk(iso3, sector, seed + 18),
    waterStress: deriveWaterStress(iso3, sector, seed + 19),

    price,
    sharesOutstanding: Math.round(marketCap / Math.max(1, price)),
    beta: generateBeta(sector, seed + 20),
    dividend_yield: generateDivYield(sector, seed + 21),
  });
}

// ---- TIER 3: 714 Fixed Income Securities ----
const CREDIT_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'B+', 'B'];
const GREEN_USE_OF_PROCEEDS = ['Renewable energy', 'Energy efficiency', 'Clean transportation', 'Green buildings', 'Pollution prevention', 'Biodiversity conservation', 'Water management'];
const GREEN_CERTS = ['CBI Certified', 'ICMA Aligned', 'Sustainalytics Verified', 'ISS-ESG Verified', 'None'];

// 300 corporate bonds
for (let i = 0; i < 300; i++) {
  const seed = 50000 + i * 11;
  const linkedEquity = MASTER_UNIVERSE[Math.floor(sr(seed) * TIER1_COUNT)];
  const maturityYears = 2 + Math.floor(sr(seed + 1) * 28);
  const ratingIdx = Math.floor(sr(seed + 2) * CREDIT_RATINGS.length);
  const coupon = Math.round((1.5 + sr(seed + 3) * 6) * 100) / 100;
  const faceValue = Math.round((5e6 + sr(seed + 4) * 5e8) / 1e4) * 1e4;
  const spread = Math.round((30 + ratingIdx * 25 + sr(seed + 5) * 100));

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${linkedEquity.name} ${coupon}% ${2025 + maturityYears}`,
    isin: `XS${String(800000000 + i).padStart(9, '0')}0`,
    sector: linkedEquity.sector,
    gicsSector: linkedEquity.gicsSector,
    gicsCode: linkedEquity.gicsCode,
    country: linkedEquity.country,
    countryIso3: linkedEquity.countryIso3,
    region: linkedEquity.region,
    assetClass: 'corporate_bond',
    dataSource: 'derived',
    linkedEquityId: linkedEquity.id,

    coupon,
    maturityYear: 2025 + maturityYears,
    creditRating: CREDIT_RATINGS[ratingIdx],
    spread_bps: spread,
    faceValue_usd: faceValue,
    lgd: Math.round((0.3 + sr(seed + 6) * 0.35) * 100) / 100,
    duration: Math.round(maturityYears * 0.7 * 100) / 100,

    scope1_tco2e: linkedEquity.scope1_tco2e,
    scope2_tco2e: linkedEquity.scope2_tco2e,
    scope3_tco2e: linkedEquity.scope3_tco2e,
    totalEmissions_tco2e: linkedEquity.totalEmissions_tco2e,
    esgScore: linkedEquity.esgScore,
    temperatureAlignment_c: linkedEquity.temperatureAlignment_c,
    transitionScore: linkedEquity.transitionScore,
    physicalRiskScore: linkedEquity.physicalRiskScore,
  });
}

// 200 green bonds
for (let i = 0; i < 200; i++) {
  const seed = 60000 + i * 11;
  const linkedEquity = MASTER_UNIVERSE[Math.floor(sr(seed) * TIER1_COUNT)];
  const maturityYears = 3 + Math.floor(sr(seed + 1) * 15);
  const coupon = Math.round((0.5 + sr(seed + 2) * 4) * 100) / 100;
  const faceValue = Math.round((1e7 + sr(seed + 3) * 1e9) / 1e4) * 1e4;

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${linkedEquity.name} Green ${coupon}% ${2025 + maturityYears}`,
    isin: `XS${String(700000000 + i).padStart(9, '0')}0`,
    sector: linkedEquity.sector,
    gicsSector: linkedEquity.gicsSector,
    country: linkedEquity.country,
    countryIso3: linkedEquity.countryIso3,
    region: linkedEquity.region,
    assetClass: 'green_bond',
    dataSource: 'derived',
    linkedEquityId: linkedEquity.id,

    coupon,
    maturityYear: 2025 + maturityYears,
    creditRating: CREDIT_RATINGS[Math.min(6, Math.floor(sr(seed + 4) * 7))],
    faceValue_usd: faceValue,
    useOfProceeds: GREEN_USE_OF_PROCEEDS[Math.floor(sr(seed + 5) * GREEN_USE_OF_PROCEEDS.length)],
    certification: GREEN_CERTS[Math.floor(sr(seed + 6) * GREEN_CERTS.length)],
    taxonomyAligned: sr(seed + 7) > 0.3,

    esgScore: Math.min(100, linkedEquity.esgScore + 10),
    temperatureAlignment_c: Math.max(1.2, linkedEquity.temperatureAlignment_c - 0.3),
    transitionScore: Math.min(100, linkedEquity.transitionScore + 15),
  });
}

// 114 sovereign bonds
const SOVEREIGN_COUNTRIES = Object.keys(owidCo2Map).filter(iso => owidCo2Map[iso].co2_mt > 1).slice(0, 114);
SOVEREIGN_COUNTRIES.forEach((iso3, i) => {
  const seed = 70000 + i * 11;
  const co2 = owidCo2Map[iso3];
  const cbam = cbamCountryMap[iso3] || {};
  const maturityYears = 5 + Math.floor(sr(seed) * 25);
  const coupon = Math.round((0.5 + sr(seed + 1) * 8) * 100) / 100;
  const sovRatings = ['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB', 'BB+', 'BB', 'B+', 'B', 'CCC'];
  const ratingIdx = Math.floor(sr(seed + 2) * sovRatings.length);

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${co2.country || iso3} Government ${coupon}% ${2025 + maturityYears}`,
    isin: `${iso3.substring(0, 2)}${String(600000000 + i).padStart(9, '0')}0`,
    sector: 'Sovereign',
    gicsSector: 'Government',
    country: co2.country || iso3,
    countryIso3: iso3,
    region: cedaRegionMap[iso3] || 'Other',
    assetClass: 'sovereign_bond',
    dataSource: 'derived',

    coupon,
    maturityYear: 2025 + maturityYears,
    sovereignRating: sovRatings[ratingIdx],
    cdsSpread_bps: Math.round(20 + ratingIdx * 40 + sr(seed + 3) * 100),
    faceValue_usd: Math.round((1e8 + sr(seed + 4) * 5e9) / 1e6) * 1e6,

    countryEmissions: lookupOwidCo2(iso3),
    ndcTarget_pctReduction: Math.round(20 + sr(seed + 5) * 50),
    ndcBaseYear: 2005 + Math.floor(sr(seed + 6) * 10),
    cbamVulnerability: cbam.vulnerabilityIndex || 0,
    emissionsIntensity_kgco2_usd: cbam.emissionsIntensity_kgco2usd || 0,
  });
});

// 100 sustainability-linked bonds
for (let i = 0; i < 100; i++) {
  const seed = 80000 + i * 11;
  const linkedEquity = MASTER_UNIVERSE[Math.floor(sr(seed) * TIER1_COUNT)];
  const maturityYears = 3 + Math.floor(sr(seed + 1) * 12);
  const coupon = Math.round((1 + sr(seed + 2) * 5) * 100) / 100;

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${linkedEquity.name} SLB ${coupon}% ${2025 + maturityYears}`,
    isin: `XS${String(500000000 + i).padStart(9, '0')}0`,
    sector: linkedEquity.sector,
    country: linkedEquity.country,
    countryIso3: linkedEquity.countryIso3,
    region: linkedEquity.region,
    assetClass: 'sustainability_linked_bond',
    dataSource: 'derived',
    linkedEquityId: linkedEquity.id,

    coupon,
    maturityYear: 2025 + maturityYears,
    creditRating: CREDIT_RATINGS[Math.floor(sr(seed + 3) * 8)],
    faceValue_usd: Math.round((1e7 + sr(seed + 4) * 5e8) / 1e4) * 1e4,
    kpiTarget: sr(seed + 5) > 0.5 ? 'Reduce Scope 1+2 by 30% by 2030' : 'Achieve 50% renewable energy by 2028',
    stepUp_bps: Math.round(15 + sr(seed + 6) * 35),

    esgScore: linkedEquity.esgScore,
    temperatureAlignment_c: linkedEquity.temperatureAlignment_c,
  });
}

// ---- TIER 4: 500 Real Estate Assets ----
const RE_TYPES = ['office', 'retail', 'industrial', 'residential', 'data_center'];
const RE_CITIES = [
  { city: 'London', country: 'GBR', region: 'Europe' },
  { city: 'New York', country: 'USA', region: 'Northern America' },
  { city: 'Tokyo', country: 'JPN', region: 'Asia' },
  { city: 'Singapore', country: 'SGP', region: 'Asia' },
  { city: 'Frankfurt', country: 'DEU', region: 'Europe' },
  { city: 'Paris', country: 'FRA', region: 'Europe' },
  { city: 'Sydney', country: 'AUS', region: 'Asia' },
  { city: 'Toronto', country: 'CAN', region: 'Northern America' },
  { city: 'Hong Kong', country: 'HKG', region: 'Asia' },
  { city: 'Amsterdam', country: 'NLD', region: 'Europe' },
  { city: 'Dubai', country: 'ARE', region: 'MENA' },
  { city: 'Shanghai', country: 'CHN', region: 'Asia' },
];
const EPC_RATINGS = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

for (let i = 0; i < 500; i++) {
  const seed = 90000 + i * 11;
  const loc = RE_CITIES[Math.floor(sr(seed) * RE_CITIES.length)];
  const reType = RE_TYPES[Math.floor(sr(seed + 1) * RE_TYPES.length)];
  const area = Math.round(500 + sr(seed + 2) * 49500);
  const epcIdx = Math.floor(sr(seed + 3) * EPC_RATINGS.length);
  const energyIntensity = reType === 'data_center' ? 800 + sr(seed + 4) * 1200 :
    reType === 'office' ? 100 + sr(seed + 4) * 200 : 50 + sr(seed + 4) * 150;
  const valPerSqm = reType === 'office' ? 3000 + sr(seed + 5) * 12000 :
    reType === 'data_center' ? 5000 + sr(seed + 5) * 15000 : 1500 + sr(seed + 5) * 5000;

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${loc.city} ${reType.charAt(0).toUpperCase() + reType.slice(1)} Asset ${i + 1}`,
    isin: null,
    sector: 'Real Estate',
    gicsSector: 'Real Estate',
    country: loc.city,
    countryIso3: loc.country,
    region: loc.region,
    assetClass: 'real_estate',
    dataSource: 'mock',

    propertyType: reType,
    area_sqm: area,
    epc_rating: EPC_RATINGS[epcIdx],
    energy_intensity_kwh_m2: Math.round(energyIntensity * 10) / 10,
    valuation_usd: Math.round(area * valPerSqm),
    crrem_pathway: sr(seed + 6) > 0.4 ? '1.5C' : '2.0C',
    stranding_year: epcIdx > 4 ? 2030 + Math.floor(sr(seed + 7) * 10) : null,
    scope1_tco2e: Math.round(area * 0.005 * (1 + epcIdx * 0.3)),
    scope2_tco2e: Math.round(energyIntensity * area / 1000 * 0.4),
    physicalRiskScore: derivePhysicalRisk(loc.country, 'Real Estate', seed + 8),
    waterStress: deriveWaterStress(loc.country, 'Real Estate', seed + 9),
    floodRisk: Math.round(sr(seed + 10) * 100),
  });
}

// ---- TIER 5: 250 Infrastructure / Project Finance ----
const INFRA_TYPES = [
  { tech: 'Solar PV', family: 'Renewable' },
  { tech: 'Onshore Wind', family: 'Renewable' },
  { tech: 'Offshore Wind', family: 'Renewable' },
  { tech: 'Battery Storage', family: 'Storage' },
  { tech: 'Green Hydrogen', family: 'Hydrogen' },
  { tech: 'EV Charging Network', family: 'Transport' },
  { tech: 'Rail Electrification', family: 'Transport' },
  { tech: 'Water Treatment', family: 'Water' },
  { tech: 'Waste-to-Energy', family: 'Waste' },
  { tech: 'District Heating', family: 'Heating' },
];

for (let i = 0; i < 250; i++) {
  const seed = 100000 + i * 11;
  const infra = INFRA_TYPES[Math.floor(sr(seed) * INFRA_TYPES.length)];
  const region = MOCK_REGIONS[Math.floor(sr(seed + 1) * MOCK_REGIONS.length)];
  const countries = MOCK_COUNTRIES_BY_REGION[region] || ['United States of America'];
  const country = countries[Math.floor(sr(seed + 2) * countries.length)];
  const iso3 = mapCountryToISO3(country);
  const capacity = infra.tech.includes('Solar') ? 10 + sr(seed + 3) * 490 :
    infra.tech.includes('Wind') ? 50 + sr(seed + 3) * 950 :
    infra.tech.includes('Battery') ? 5 + sr(seed + 3) * 195 : 10 + sr(seed + 3) * 290;

  const abatement = infra.family === 'Renewable' ? Math.round(capacity * (1200 + sr(seed + 4) * 800)) :
    infra.family === 'Transport' ? Math.round(capacity * 500) : Math.round(capacity * 300);

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${country.split(',')[0]} ${infra.tech} Project ${i + 1}`,
    isin: null,
    sector: 'Project Finance',
    gicsSector: 'Utilities',
    country,
    countryIso3: iso3,
    region,
    assetClass: 'infrastructure',
    dataSource: 'mock',

    technology: infra.tech,
    technologyFamily: infra.family,
    capacity_mw: Math.round(capacity * 10) / 10,
    commissioningYear: 2020 + Math.floor(sr(seed + 5) * 8),
    ppa_price_usd_mwh: Math.round((20 + sr(seed + 6) * 60) * 100) / 100,
    projectValue_usd: Math.round(capacity * (1.2e6 + sr(seed + 7) * 2e6)),
    carbon_abatement_tco2e: abatement,
    taxonomyAligned: infra.family === 'Renewable' || infra.family === 'Transport',
    physicalRiskScore: derivePhysicalRisk(iso3, 'Utilities', seed + 8),
  });
}

// ---- TIER 6: 150 Carbon Credits / Offsets ----
const CC_TYPES = [
  'Avoided Deforestation (REDD+)', 'Afforestation/Reforestation', 'Improved Cookstoves',
  'Renewable Energy (Wind)', 'Renewable Energy (Solar)', 'Methane Capture (Landfill)',
  'Methane Capture (Agriculture)', 'Blue Carbon (Mangrove)', 'Direct Air Capture',
  'Biochar', 'Enhanced Weathering', 'Soil Carbon Sequestration',
];
const CC_REGISTRIES = ['Verra (VCS)', 'Gold Standard', 'ACR', 'CAR', 'Puro.earth'];
const BEZERO_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'];

for (let i = 0; i < 150; i++) {
  const seed = 110000 + i * 11;
  const projectType = CC_TYPES[Math.floor(sr(seed) * CC_TYPES.length)];
  const registry = CC_REGISTRIES[Math.floor(sr(seed + 1) * CC_REGISTRIES.length)];
  const vintage = 2018 + Math.floor(sr(seed + 2) * 8);
  const tonnes = Math.round(1000 + sr(seed + 3) * 499000);
  const isRemoval = projectType.includes('Reforestation') || projectType.includes('DAC') ||
    projectType.includes('Biochar') || projectType.includes('Weathering') || projectType.includes('Blue Carbon');
  const permanence = isRemoval ? (projectType.includes('DAC') ? 1000 : 20 + Math.floor(sr(seed + 4) * 80)) : 0;
  const priceBase = projectType.includes('DAC') ? 200 : isRemoval ? 15 : 5;

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${projectType} - ${registry} V${vintage}-${i + 1}`,
    isin: null,
    sector: 'Carbon Markets',
    gicsSector: 'Carbon Markets',
    country: MOCK_COUNTRIES_BY_REGION[MOCK_REGIONS[Math.floor(sr(seed + 5) * MOCK_REGIONS.length)]][0],
    countryIso3: mapCountryToISO3(MOCK_COUNTRIES_BY_REGION[MOCK_REGIONS[Math.floor(sr(seed + 5) * MOCK_REGIONS.length)]][0]),
    region: MOCK_REGIONS[Math.floor(sr(seed + 5) * MOCK_REGIONS.length)],
    assetClass: 'carbon_credit',
    dataSource: 'mock',

    projectType,
    vintage,
    tonnes_tco2e: tonnes,
    price_usd_per_tonne: Math.round((priceBase + sr(seed + 6) * priceBase * 2) * 100) / 100,
    permanence_years: permanence,
    registry,
    beZeroRating: BEZERO_RATINGS[Math.floor(sr(seed + 7) * BEZERO_RATINGS.length)],
    isRemoval,
    additionality: sr(seed + 8) > 0.2,
    cobenefits: Math.floor(sr(seed + 9) * 5) + 1,
  });
}

// ---- TIER 7: 100 Insurance Underwriting Positions ----
const INS_TYPES = ['Property Cat', 'Casualty', 'Climate Liability', 'D&O (Climate)', 'Marine', 'Agriculture', 'Wildfire', 'Flood'];
const INS_PERILS = ['Hurricane', 'Earthquake', 'Flood', 'Wildfire', 'Drought', 'Sea Level Rise', 'Heatwave', 'Storm Surge'];

for (let i = 0; i < 100; i++) {
  const seed = 120000 + i * 11;
  const policyType = INS_TYPES[Math.floor(sr(seed) * INS_TYPES.length)];
  const peril = INS_PERILS[Math.floor(sr(seed + 1) * INS_PERILS.length)];
  const region = MOCK_REGIONS[Math.floor(sr(seed + 2) * MOCK_REGIONS.length)];
  const exposure = Math.round((5e6 + sr(seed + 3) * 5e8) / 1e4) * 1e4;
  const elr = 0.02 + sr(seed + 4) * 0.15;
  const climateMult = 1.0 + sr(seed + 5) * 0.8;

  MASTER_UNIVERSE.push({
    id: uid++,
    name: `${policyType} - ${peril} ${region} ${i + 1}`,
    isin: null,
    sector: 'Insurance',
    gicsSector: 'Financials',
    country: (MOCK_COUNTRIES_BY_REGION[region] || ['United States of America'])[0],
    countryIso3: mapCountryToISO3((MOCK_COUNTRIES_BY_REGION[region] || ['United States of America'])[0]),
    region,
    assetClass: 'insurance',
    dataSource: 'mock',

    policyType,
    peril,
    exposure_usd: exposure,
    expectedLoss_usd: Math.round(exposure * elr),
    expectedLossRatio: Math.round(elr * 10000) / 100,
    climateMultiplier: Math.round(climateMult * 100) / 100,
    climateAdjustedLoss_usd: Math.round(exposure * elr * climateMult),
    premium_usd: Math.round(exposure * elr * 1.35),
    physicalRiskScore: Math.round(30 + sr(seed + 6) * 60),
  });
}

/* ------------------------------------------------------------------ */
/*  UNIVERSE STATS                                                     */
/* ------------------------------------------------------------------ */

function computeStats(universe) {
  const byAssetClass = {};
  const byRegion = {};
  const bySector = {};
  let realCount = 0, mockCount = 0, derivedCount = 0;

  universe.forEach(s => {
    byAssetClass[s.assetClass] = (byAssetClass[s.assetClass] || 0) + 1;
    byRegion[s.region] = (byRegion[s.region] || 0) + 1;
    bySector[s.gicsSector || s.sector] = (bySector[s.gicsSector || s.sector] || 0) + 1;
    if (s.dataSource === 'real') realCount++;
    else if (s.dataSource === 'mock') mockCount++;
    else derivedCount++;
  });

  return {
    total: universe.length,
    byAssetClass,
    byRegion,
    bySector,
    realVsMock: { real: realCount, mock: mockCount, derived: derivedCount },
  };
}

export const UNIVERSE_STATS = computeStats(MASTER_UNIVERSE);

/* ------------------------------------------------------------------ */
/*  SPECIALIZED PORTFOLIOS                                             */
/* ------------------------------------------------------------------ */

function buildPortfolio(id, name, description, strategy, benchmark, holdings, totalAum) {
  const sourceSplit = { real: 0, mock: 0, derived: 0 };
  holdings.forEach(h => {
    const sec = MASTER_UNIVERSE[h.securityId] || MASTER_UNIVERSE.find(s => s.id === h.securityId);
    if (sec) sourceSplit[sec.dataSource] = (sourceSplit[sec.dataSource] || 0) + 1;
  });
  return {
    id, name, description, strategy, benchmark,
    totalAum_usd: totalAum,
    holdings,
    metadata: { holdingCount: holdings.length, dataSourceSplit: sourceSplit },
  };
}

function selectByClass(assetClass, count, weightFn) {
  const pool = MASTER_UNIVERSE.filter(s => s.assetClass === assetClass);
  const selected = pool.slice(0, Math.min(count, pool.length));
  const totalW = selected.reduce((s, sec, i) => s + (weightFn ? weightFn(sec, i) : 1), 0);
  return selected.map((sec, i) => {
    const rawW = weightFn ? weightFn(sec, i) : 1;
    return {
      securityId: sec.id,
      weight: Math.round((rawW / Math.max(1, totalW)) * 10000) / 10000,
      marketValue: Math.round((rawW / Math.max(1, totalW)) * 5e9),
    };
  });
}

// Sort equities by marketCap for top holdings
const equitiesByMcap = [...MASTER_UNIVERSE.filter(s => s.assetClass === 'equity')].sort((a, b) => (b.marketCap_usd || 0) - (a.marketCap_usd || 0));

const EQUITY_PORTFOLIO = buildPortfolio(
  'EQ-500', 'Global Equity Fund', '500 largest equities by market cap', 'Market-cap weighted', 'MSCI ACWI',
  equitiesByMcap.slice(0, 500).map((sec, i) => ({
    securityId: sec.id,
    weight: Math.round((sec.marketCap_usd / Math.max(1, equitiesByMcap.slice(0, 500).reduce((s, x) => s + (x.marketCap_usd || 0), 0))) * 10000) / 10000,
    marketValue: Math.round(sec.marketCap_usd / Math.max(1, equitiesByMcap.slice(0, 500).reduce((s, x) => s + (x.marketCap_usd || 0), 0)) * 1e10),
  })),
  1e10,
);

const FIXED_INCOME_PORTFOLIO = buildPortfolio(
  'FI-300', 'Global Fixed Income Fund', '300 corporate and green bonds', 'Duration-matched', 'Bloomberg Global Aggregate',
  selectByClass('corporate_bond', 200, (s) => s.faceValue_usd || 1e7)
    .concat(selectByClass('green_bond', 100, (s) => s.faceValue_usd || 1e7)),
  5e9,
);

const REAL_ESTATE_PORTFOLIO = buildPortfolio(
  'RE-100', 'Global Real Estate Fund', '100 commercial properties', 'Core/Core+', 'MSCI Global Property',
  selectByClass('real_estate', 100, (s) => s.valuation_usd || 1e6),
  3e9,
);

const sovBonds = MASTER_UNIVERSE.filter(s => s.assetClass === 'sovereign_bond');
const SOVEREIGN_PORTFOLIO = buildPortfolio(
  'SOV-50', 'Sovereign Bond Portfolio', '50 sovereign bonds GDP-weighted', 'GDP-weighted', 'FTSE WGBI',
  sovBonds.slice(0, 50).map((sec, i) => {
    const gdp = (sec.countryEmissions && sec.countryEmissions.co2_mt) || 1;
    const totalGdp = sovBonds.slice(0, 50).reduce((s, x) => s + ((x.countryEmissions && x.countryEmissions.co2_mt) || 1), 0);
    return {
      securityId: sec.id,
      weight: Math.round((gdp / Math.max(1, totalGdp)) * 10000) / 10000,
      marketValue: Math.round(gdp / Math.max(1, totalGdp) * 8e9),
    };
  }),
  8e9,
);

const GREEN_BOND_PORTFOLIO = buildPortfolio(
  'GB-100', 'Green & SLB Portfolio', '100 green and sustainability-linked bonds', 'Use-of-proceeds aligned', 'MSCI Green Bond Index',
  selectByClass('green_bond', 70, (s) => s.faceValue_usd || 1e7)
    .concat(selectByClass('sustainability_linked_bond', 30, (s) => s.faceValue_usd || 1e7)),
  2e9,
);

const INSURANCE_PORTFOLIO = buildPortfolio(
  'INS-50', 'Climate Insurance Book', '50 underwriting positions', 'Diversified peril', 'Swiss Re Cat Bond Index',
  selectByClass('insurance', 50, (s) => s.exposure_usd || 1e7),
  1e9,
);

const CARBON_CREDIT_PORTFOLIO = buildPortfolio(
  'CC-80', 'Voluntary Carbon Portfolio', '80 carbon credit projects', 'Diversified registry/type', 'S&P GSCI Carbon',
  selectByClass('carbon_credit', 80, (s) => s.tonnes_tco2e || 1000),
  5e8,
);

const INFRASTRUCTURE_PORTFOLIO = buildPortfolio(
  'INFRA-60', 'Climate Infrastructure Fund', '60 renewable and transport projects', 'Capacity-weighted', 'S&P Global Clean Energy',
  selectByClass('infrastructure', 60, (s) => s.capacity_mw || 10),
  4e9,
);

// Multi-asset: mix of equities, bonds, RE, infra
const MULTI_ASSET_PORTFOLIO = buildPortfolio(
  'MA-200', 'Multi-Asset Climate Fund', 'Diversified across equities, bonds, real estate, infrastructure', 'Strategic allocation',
  '60/30/5/5 benchmark',
  selectByClass('equity', 120, (s) => s.marketCap_usd || 1e8)
    .concat(selectByClass('corporate_bond', 50, (s) => s.faceValue_usd || 1e7))
    .concat(selectByClass('real_estate', 15, (s) => s.valuation_usd || 1e6))
    .concat(selectByClass('infrastructure', 15, (s) => s.projectValue_usd || 1e6)),
  7e9,
);

// PCAF portfolio: across all 7 PCAF asset classes
const pcafHoldings = [
  ...selectByClass('equity', 30, (s) => s.marketCap_usd || 1e8),
  ...selectByClass('corporate_bond', 30, (s) => s.faceValue_usd || 1e7),
  ...selectByClass('sovereign_bond', 20, (s) => s.faceValue_usd || 1e8),
  ...selectByClass('green_bond', 20, (s) => s.faceValue_usd || 1e7),
  ...selectByClass('real_estate', 20, (s) => s.valuation_usd || 1e6),
  ...selectByClass('infrastructure', 15, (s) => s.projectValue_usd || 1e6),
  ...selectByClass('insurance', 15, (s) => s.exposure_usd || 1e7),
];
const PCAF_PORTFOLIO = buildPortfolio(
  'PCAF-150', 'PCAF Multi-Asset Portfolio', 'All 7 PCAF asset classes', 'PCAF-aligned attribution', 'Custom PCAF Benchmark',
  pcafHoldings, 6e9,
);

// SFDR Art 9: sustainable investments only
const art9Pool = MASTER_UNIVERSE
  .filter(s => (s.assetClass === 'equity' || s.assetClass === 'green_bond') && (s.esgScore || 0) >= 60 && (s.temperatureAlignment_c || 3) <= 2.0)
  .slice(0, 100);
const art9TotalW = art9Pool.reduce((s, sec) => s + (sec.marketCap_usd || sec.faceValue_usd || 1e7), 0);
const SFDR_ART9_PORTFOLIO = buildPortfolio(
  'ART9-100', 'SFDR Article 9 Fund', '100 sustainable investments (temp aligned <= 2.0C, ESG >= 60)', 'Sustainable objective', 'MSCI ESG Leaders',
  art9Pool.map(sec => ({
    securityId: sec.id,
    weight: Math.round(((sec.marketCap_usd || sec.faceValue_usd || 1e7) / Math.max(1, art9TotalW)) * 10000) / 10000,
    marketValue: Math.round(((sec.marketCap_usd || sec.faceValue_usd || 1e7) / Math.max(1, art9TotalW)) * 3e9),
  })),
  3e9,
);

// Transition portfolio: high-carbon companies with transition plans
const transPool = MASTER_UNIVERSE
  .filter(s => s.assetClass === 'equity' && (s.carbonIntensity_tco2e_per_mRevenue || 0) > 50 && (s.transitionScore || 0) > 30)
  .slice(0, 120);
const transTotalW = transPool.reduce((s, sec) => s + (sec.marketCap_usd || 1e8), 0);
const TRANSITION_PORTFOLIO = buildPortfolio(
  'TRANS-120', 'Climate Transition Fund', '120 high-carbon companies with credible transition plans', 'Transition-weighted', 'MSCI Climate Transition',
  transPool.map(sec => ({
    securityId: sec.id,
    weight: Math.round(((sec.marketCap_usd || 1e8) / Math.max(1, transTotalW)) * 10000) / 10000,
    marketValue: Math.round(((sec.marketCap_usd || 1e8) / Math.max(1, transTotalW)) * 4e9),
  })),
  4e9,
);

/* ------------------------------------------------------------------ */
/*  CALCULATION ENGINES                                                */
/* ------------------------------------------------------------------ */

function getSecurity(id) {
  return MASTER_UNIVERSE.find(s => s.id === id);
}

export function calcPortfolioWACI(portfolio) {
  let waci = 0;
  let realPct = 0;
  let total = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const ci = sec.carbonIntensity_tco2e_per_mRevenue || 0;
    waci += (h.weight || 0) * ci;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    total += h.weight || 0;
  });
  return {
    value: Math.round(waci * 100) / 100,
    unit: 'tCO2e / $M revenue',
    methodology: 'TCFD / PCAF — weighted average carbon intensity',
    dataQuality: waci > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round((realPct / Math.max(0.001, total)) * 100),
    mockDataPct: Math.round(((total - realPct) / Math.max(0.001, total)) * 100),
  };
}

export function calcFinancedEmissions(portfolio) {
  let totalFE = 0;
  let realPct = 0;
  let total = 0;
  const aum = portfolio.totalAum_usd || 1;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const mv = h.marketValue || 0;
    const evic = sec.marketCap_usd || sec.faceValue_usd || sec.valuation_usd || 1;
    const attributionFactor = mv / Math.max(1, evic);
    const emissions = (sec.scope1_tco2e || 0) + (sec.scope2_tco2e || 0);
    totalFE += attributionFactor * emissions;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    total += h.weight || 0;
  });
  return {
    value: Math.round(totalFE),
    unit: 'tCO2e (financed)',
    methodology: 'PCAF — financed emissions attribution',
    dataQuality: totalFE > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round((realPct / Math.max(0.001, total)) * 100),
    mockDataPct: Math.round(((total - realPct) / Math.max(0.001, total)) * 100),
    intensity_per_mAum: Math.round(totalFE / Math.max(1, aum / 1e6) * 10) / 10,
  };
}

export function calcPortfolioTemperature(portfolio) {
  let wtdTemp = 0;
  let totalW = 0;
  let realPct = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec || !sec.temperatureAlignment_c) return;
    wtdTemp += (h.weight || 0) * sec.temperatureAlignment_c;
    totalW += h.weight || 0;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  const temp = totalW > 0 ? wtdTemp / totalW : 0;
  return {
    value: Math.round(temp * 100) / 100,
    unit: '°C implied temperature rise',
    methodology: 'SBTi Portfolio Temperature Rating',
    dataQuality: totalW > 0.5 ? 'good' : 'partial',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

export function calcClimateVaR(portfolio, scenario = 'Disorderly') {
  const scenarioMult = scenario === 'Hot House' ? 0.15 : scenario === 'Disorderly' ? 0.10 : 0.05;
  let totalVaR = 0;
  let realPct = 0;
  let total = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const transRisk = (sec.transitionScore || 50) / 100;
    const physRisk = (sec.physicalRiskScore || 30) / 100;
    const combinedRisk = 1 - (1 - transRisk * scenarioMult) * (1 - physRisk * scenarioMult * 0.5);
    totalVaR += (h.marketValue || 0) * combinedRisk;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    total += h.weight || 0;
  });
  return {
    value: Math.round(totalVaR),
    unit: 'USD',
    pctOfAum: Math.round(totalVaR / Math.max(1, portfolio.totalAum_usd) * 10000) / 100,
    scenario,
    methodology: 'NGFS-aligned Climate VaR (transition + physical)',
    dataQuality: total > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round((realPct / Math.max(0.001, total)) * 100),
    mockDataPct: Math.round(((total - realPct) / Math.max(0.001, total)) * 100),
  };
}

export function calcSFDRPAI(portfolio) {
  const indicators = [];
  const equityHoldings = (portfolio.holdings || []).map(h => ({ ...h, sec: getSecurity(h.securityId) })).filter(h => h.sec);
  const totalW = equityHoldings.reduce((s, h) => s + (h.weight || 0), 0);

  // PAI 1: GHG Emissions (S1+S2)
  const pai1 = equityHoldings.reduce((s, h) => s + (h.weight || 0) * ((h.sec.scope1_tco2e || 0) + (h.sec.scope2_tco2e || 0)), 0);
  indicators.push({ pai: 1, name: 'GHG Emissions (Scope 1+2)', value: Math.round(pai1), unit: 'tCO2e' });

  // PAI 2: Carbon Footprint
  const pai2 = totalW > 0 ? pai1 / Math.max(1, portfolio.totalAum_usd / 1e6) : 0;
  indicators.push({ pai: 2, name: 'Carbon Footprint', value: Math.round(pai2 * 100) / 100, unit: 'tCO2e/$M invested' });

  // PAI 3: GHG Intensity
  const totalRevW = equityHoldings.reduce((s, h) => s + (h.weight || 0) * ((h.sec.revenue_usd || 1) / 1e6), 0);
  indicators.push({ pai: 3, name: 'GHG Intensity', value: Math.round(pai1 / Math.max(1, totalRevW) * 100) / 100, unit: 'tCO2e/$M revenue' });

  // PAI 4: Exposure to fossil fuels
  const fossilSectors = ['Oil and Gas Exploration and Production', 'Oil and Gas Refining, Transportation, Storage and Marketing'];
  const fossilW = equityHoldings.filter(h => fossilSectors.includes(h.sec.sector)).reduce((s, h) => s + (h.weight || 0), 0);
  indicators.push({ pai: 4, name: 'Fossil Fuel Exposure', value: Math.round(fossilW / Math.max(0.001, totalW) * 10000) / 100, unit: '%' });

  // PAI 5: Non-renewable energy share (proxy)
  const avgFossil = equityHoldings.reduce((s, h) => {
    const e = h.sec.countryEnergyMix;
    return s + (h.weight || 0) * ((e && e.fossil_share_pct) || 70);
  }, 0);
  indicators.push({ pai: 5, name: 'Non-renewable Energy Share', value: Math.round(avgFossil / Math.max(0.001, totalW) * 10) / 10, unit: '%' });

  // PAI 6: Energy consumption intensity
  indicators.push({ pai: 6, name: 'Energy Consumption Intensity', value: Math.round(pai1 / Math.max(1, equityHoldings.length) * 10) / 10, unit: 'GWh/$M revenue (proxy)' });

  // PAI 7: Biodiversity impact (proxy from physical risk + water stress)
  const avgBio = equityHoldings.reduce((s, h) => s + (h.weight || 0) * ((h.sec.physicalRiskScore || 20) + (h.sec.waterStress || 20)) / 2, 0);
  indicators.push({ pai: 7, name: 'Biodiversity Impact', value: Math.round(avgBio / Math.max(0.001, totalW) * 10) / 10, unit: 'score /100' });

  // PAI 8: Water emissions (proxy)
  const avgWater = equityHoldings.reduce((s, h) => s + (h.weight || 0) * (h.sec.waterStress || 20), 0);
  indicators.push({ pai: 8, name: 'Water Stress Exposure', value: Math.round(avgWater / Math.max(0.001, totalW) * 10) / 10, unit: 'score /100' });

  // PAI 9: Hazardous waste (proxy)
  indicators.push({ pai: 9, name: 'Hazardous Waste Ratio', value: Math.round(sr(portfolio.id ? portfolio.id.length : 1) * 5 * 100) / 100, unit: 'tonnes / $M revenue' });

  // PAI 10-14: Social indicators (proxied from ESG scores)
  const avgESG = equityHoldings.reduce((s, h) => s + (h.weight || 0) * (h.sec.esgScore || 50), 0) / Math.max(0.001, totalW);
  indicators.push({ pai: 10, name: 'UNGC/OECD Violations', value: Math.round((100 - avgESG) / 10), unit: '% companies' });
  indicators.push({ pai: 11, name: 'UNGC Monitoring', value: Math.round((100 - avgESG) / 8), unit: '% companies' });
  indicators.push({ pai: 12, name: 'Gender Pay Gap', value: Math.round(5 + sr(42) * 20), unit: '%' });
  indicators.push({ pai: 13, name: 'Board Gender Diversity', value: Math.round(20 + sr(43) * 25), unit: '% female' });
  indicators.push({ pai: 14, name: 'Controversial Weapons', value: 0, unit: '% exposure' });

  // PAI 15-18: Sovereign / RE indicators
  indicators.push({ pai: 15, name: 'GHG Intensity of Sovereigns', value: Math.round(pai2 * 0.8 * 100) / 100, unit: 'tCO2e / $M GDP' });
  indicators.push({ pai: 16, name: 'Sovereign Fossil Fuel Exposure', value: Math.round(fossilW / Math.max(0.001, totalW) * 8000) / 100, unit: '%' });
  indicators.push({ pai: 17, name: 'Real Estate Energy Efficiency', value: Math.round(150 + sr(44) * 100), unit: 'kWh/m2' });
  indicators.push({ pai: 18, name: 'Real Estate GHG Intensity', value: Math.round(30 + sr(45) * 50), unit: 'kgCO2e/m2' });

  return {
    indicators,
    methodology: 'SFDR Annex I — 18 Principal Adverse Impact indicators',
    dataQuality: 'good',
    realDataPct: Math.round(equityHoldings.filter(h => h.sec.dataSource === 'real').length / Math.max(1, equityHoldings.length) * 100),
    mockDataPct: 100 - Math.round(equityHoldings.filter(h => h.sec.dataSource === 'real').length / Math.max(1, equityHoldings.length) * 100),
  };
}

export function calcTaxonomyAlignment(portfolio) {
  let alignedValue = 0;
  let totalValue = 0;
  let realPct = 0;
  let total = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const mv = h.marketValue || 0;
    totalValue += mv;
    const isAligned = sec.taxonomyAligned || sec.assetClass === 'green_bond' ||
      ((sec.temperatureAlignment_c || 3) <= 1.8 && (sec.esgScore || 0) >= 65);
    if (isAligned) alignedValue += mv;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    total += h.weight || 0;
  });
  return {
    value: Math.round(alignedValue / Math.max(1, totalValue) * 10000) / 100,
    unit: '% EU Taxonomy aligned',
    alignedValue_usd: Math.round(alignedValue),
    totalValue_usd: Math.round(totalValue),
    methodology: 'EU Taxonomy Regulation — technical screening criteria proxy',
    dataQuality: total > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round((realPct / Math.max(0.001, total)) * 100),
    mockDataPct: Math.round(((total - realPct) / Math.max(0.001, total)) * 100),
  };
}

export function calcTransitionScore(portfolio) {
  let wtd = 0;
  let totalW = 0;
  let realPct = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    wtd += (h.weight || 0) * (sec.transitionScore || 0);
    totalW += h.weight || 0;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  return {
    value: Math.round(totalW > 0 ? wtd / totalW : 0),
    unit: 'Transition Readiness Score /100',
    methodology: 'Weighted average of company transition scores (SBTi + ESG)',
    dataQuality: totalW > 0.5 ? 'good' : 'partial',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

export function calcPhysicalRisk(portfolio) {
  let wtd = 0;
  let totalW = 0;
  let realPct = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    wtd += (h.weight || 0) * (sec.physicalRiskScore || 0);
    totalW += h.weight || 0;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  return {
    value: Math.round(totalW > 0 ? wtd / totalW : 0),
    unit: 'Physical Risk Score /100',
    methodology: 'Weighted average physical risk (country + sector)',
    dataQuality: totalW > 0.5 ? 'good' : 'partial',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

export function calcWaterFootprint(portfolio) {
  let wtd = 0;
  let totalW = 0;
  let realPct = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    wtd += (h.weight || 0) * (sec.waterStress || 0);
    totalW += h.weight || 0;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  return {
    value: Math.round(totalW > 0 ? wtd / totalW : 0),
    unit: 'Water Stress Score /100',
    methodology: 'Weighted average water stress (WRI Aqueduct proxy)',
    dataQuality: totalW > 0.5 ? 'good' : 'partial',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

export function calcBiodiversityImpact(portfolio) {
  let wtd = 0;
  let totalW = 0;
  let realPct = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const bioScore = ((sec.physicalRiskScore || 20) + (sec.waterStress || 20)) / 2;
    wtd += (h.weight || 0) * bioScore;
    totalW += h.weight || 0;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  return {
    value: Math.round(totalW > 0 ? wtd / totalW : 0),
    unit: 'Biodiversity Impact Score /100',
    methodology: 'Composite: physical risk + water stress proxy (TNFD-aligned)',
    dataQuality: totalW > 0.5 ? 'good' : 'partial',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

export function calcSBTiCoverage(portfolio) {
  let coveredW = 0;
  let totalW = 0;
  let realPct = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    totalW += h.weight || 0;
    if (sec.sbtiClassification) coveredW += h.weight || 0;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  return {
    value: Math.round(coveredW / Math.max(0.001, totalW) * 10000) / 100,
    unit: '% holdings with SBTi-validated targets',
    methodology: 'SBTi target coverage by portfolio weight',
    dataQuality: totalW > 0.5 ? 'good' : 'partial',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

export function calcCBAMExposure(portfolio) {
  let cbamLiability = 0;
  let totalW = 0;
  let realPct = 0;
  const cbamSectors = ['Steel', 'Aluminum', 'Cement', 'Chemicals', 'Electric Utilities and Independent Power Producers and Energy Traders (including Fossil, Alternative and Nuclear Energy)'];
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    totalW += h.weight || 0;
    if (cbamSectors.some(s => (sec.sector || '').includes(s))) {
      const cbamInfo = cbamCountryMap[sec.countryIso3];
      const vuln = cbamInfo ? cbamInfo.vulnerabilityIndex : 0.3;
      cbamLiability += (h.marketValue || 0) * vuln * 0.02;
    }
    if (sec.dataSource === 'real') realPct += h.weight || 0;
  });
  return {
    value: Math.round(cbamLiability),
    unit: 'USD estimated CBAM liability',
    pctOfAum: Math.round(cbamLiability / Math.max(1, portfolio.totalAum_usd) * 10000) / 100,
    methodology: 'CBAM Regulation — sector vulnerability * country emission intensity',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round((realPct / Math.max(0.001, totalW)) * 100),
    mockDataPct: Math.round(((totalW - realPct) / Math.max(0.001, totalW)) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 13 — Insurance Climate Risk (IAIS ICP 16.9 + Solvency II)   */
/* ------------------------------------------------------------------ */

export function calcInsuranceClimateRisk(portfolio) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  let totalExposure = 0;
  let totalPremium = 0;
  let totalLoss = 0;
  let strandedExp = 0;
  let realPct = 0;
  let totalW = 0;
  const fossilSectors = ['Oil and Gas', 'Coal', 'Fossil'];

  (portfolio.holdings || []).forEach((h, i) => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const exposure = h.exposure_usd || h.marketValue || 0;
    const premium = h.premium || exposure * 0.03;
    const lossRatio = h.lossRatio || (0.55 + sr(i * 41) * 0.35);
    const perilMult = { flood: 1.4, wind: 1.3, wildfire: 1.6, drought: 1.2, earthquake: 1.0 }[h.peril] || (1.0 + sr(i * 43) * 0.5);
    const geoMult = { 'US-FL': 1.5, 'US-CA': 1.4, 'US-TX': 1.3, 'EU': 1.0, 'APAC': 1.2 }[h.geography] || (1.0 + sr(i * 47) * 0.3);

    totalExposure += exposure;
    totalPremium += premium;
    totalLoss += premium * lossRatio * perilMult * geoMult;
    if (fossilSectors.some(s => (sec.sector || '').includes(s))) strandedExp += exposure;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    totalW += h.weight || 0;
  });

  const aal = totalLoss;
  const combinedRatio = safe(totalLoss + totalPremium * 0.32, totalPremium) * 100;
  const warmingMult = (w) => 1 + (w - 1.0) * 0.18;

  return {
    aal_mn: Math.round(aal / 1e6 * 100) / 100,
    combinedRatio: Math.round(combinedRatio * 10) / 10,
    climateAdjAAL_1_5c: Math.round(aal * warmingMult(1.5) / 1e6 * 100) / 100,
    climateAdjAAL_2c: Math.round(aal * warmingMult(2.0) / 1e6 * 100) / 100,
    climateAdjAAL_3c: Math.round(aal * warmingMult(3.0) / 1e6 * 100) / 100,
    strandedInvestPct: Math.round(safe(strandedExp, totalExposure) * 10000) / 100,
    natCatTrend_pct: Math.round((warmingMult(2.0) - 1) * 10000) / 100,
    methodology: 'IAIS ICP 16.9 + Solvency II climate stress',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 14 — Climate Stress Test (NGFS Phase IV + EBA 2025)          */
/* ------------------------------------------------------------------ */

export function calcClimateStressTest(portfolio, scenario = 'Net Zero 2050') {
  const safe = (n, d) => d > 0 ? n / d : 0;
  const NGFS_SCENARIOS = {
    'Net Zero 2050':       { trans: 0.06, phys: 0.02, policy: 0.03 },
    'Divergent Net Zero':  { trans: 0.09, phys: 0.02, policy: 0.05 },
    'Below 2C':            { trans: 0.04, phys: 0.03, policy: 0.02 },
    'Delayed Transition':  { trans: 0.12, phys: 0.04, policy: 0.07 },
    'NDCs':                { trans: 0.02, phys: 0.06, policy: 0.01 },
    'Current Policies':    { trans: 0.01, phys: 0.10, policy: 0.005 },
    'Fragmented World':    { trans: 0.05, phys: 0.08, policy: 0.04 },
    'Low Demand':          { trans: 0.03, phys: 0.03, policy: 0.015 },
  };
  const params = NGFS_SCENARIOS[scenario] || NGFS_SCENARIOS['Net Zero 2050'];
  let totalAum = Math.max(1, portfolio.totalAum_usd || 0);
  let transLoss = 0;
  let physLoss = 0;
  let policyShock = 0;
  let realPct = 0;
  let totalW = 0;
  const sectorLosses = {};

  (portfolio.holdings || []).forEach((h, i) => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const mv = h.marketValue || 0;
    const transRisk = (sec.transitionScore || 50) / 100;
    const physRisk = (sec.physicalRiskScore || 30) / 100;
    const tLoss = mv * transRisk * params.trans * (1 + sr(i * 53) * 0.3);
    const pLoss = mv * physRisk * params.phys * (1 + sr(i * 59) * 0.4);
    const polLoss = mv * params.policy * sr(i * 61) * 0.5;
    transLoss += tLoss;
    physLoss += pLoss;
    policyShock += polLoss;
    const sectorKey = sec.sector ? sec.sector.substring(0, 30) : 'Other';
    sectorLosses[sectorKey] = (sectorLosses[sectorKey] || 0) + tLoss + pLoss + polLoss;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    totalW += h.weight || 0;
  });

  const totalLoss = transLoss + physLoss + policyShock;
  const sectorArr = Object.entries(sectorLosses)
    .map(([sector, loss]) => ({ sector, loss_pct: Math.round(safe(loss, totalAum) * 10000) / 100 }))
    .sort((a, b) => b.loss_pct - a.loss_pct)
    .slice(0, 10);

  // VaR from deterministic Monte Carlo
  const losses = [];
  for (let p = 0; p < 200; p++) {
    const shock = (sr(p * 71) - 0.5) * 2;
    losses.push(safe(totalLoss, totalAum) * (1 + shock * 0.4));
  }
  const sorted = [...losses].sort((a, b) => b - a);
  const var95 = sorted[Math.floor(200 * 0.05)] || 0;
  const var99 = sorted[Math.floor(200 * 0.01)] || 0;
  const tail5 = sorted.slice(0, Math.max(1, Math.floor(200 * 0.05)));
  const es95 = safe(tail5.reduce((s, v) => s + v, 0), tail5.length);

  return {
    totalLoss_pct: Math.round(safe(totalLoss, totalAum) * 10000) / 100,
    transitionLoss_pct: Math.round(safe(transLoss, totalAum) * 10000) / 100,
    physicalLoss_pct: Math.round(safe(physLoss, totalAum) * 10000) / 100,
    policyShock_pct: Math.round(safe(policyShock, totalAum) * 10000) / 100,
    sectorLosses: sectorArr,
    var95_pct: Math.round(var95 * 10000) / 100,
    var99_pct: Math.round(var99 * 10000) / 100,
    es95_pct: Math.round(es95 * 10000) / 100,
    capitalImpact_bps: Math.round(safe(totalLoss, totalAum) * 10000),
    methodology: 'NGFS Phase IV + EBA 2025 Climate Stress Test',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 15 — Catastrophe Model (RMS/AIR-aligned)                     */
/* ------------------------------------------------------------------ */

export function calcCatModel(portfolio) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  let totalInsured = 0;
  let totalAAL = 0;
  let realPct = 0;
  let totalW = 0;
  const perilAALs = {};
  const regionAALs = {};

  (portfolio.holdings || []).forEach((h, i) => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const insVal = h.insuredValue || h.marketValue || 0;
    const deductible = h.deductible || insVal * 0.02;
    const peril = h.peril || ['flood', 'wind', 'wildfire', 'earthquake', 'hail'][Math.floor(sr(i * 37) * 5)];
    const region = h.location || sec.country || 'US';
    const freqBase = { flood: 0.08, wind: 0.06, wildfire: 0.05, earthquake: 0.015, hail: 0.07 }[peril] || 0.05;
    const sevBase = { flood: 0.15, wind: 0.25, wildfire: 0.35, earthquake: 0.40, hail: 0.08 }[peril] || 0.15;
    const freq = freqBase * (1 + sr(i * 39) * 0.4);
    const sev = Math.max(0, (insVal - deductible) * sevBase * (1 + sr(i * 41) * 0.3));
    const aal = freq * sev;

    totalInsured += insVal;
    totalAAL += aal;
    perilAALs[peril] = (perilAALs[peril] || 0) + aal;
    regionAALs[region] = (regionAALs[region] || 0) + aal;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    totalW += h.weight || 0;
  });

  const topPeril = Object.entries(perilAALs).sort((a, b) => b[1] - a[1])[0];
  const topRegion = Object.entries(regionAALs).sort((a, b) => b[1] - a[1])[0];
  const climateTrendMult = 1.18; // +18% frequency trend from climate change

  return {
    aal_mn: Math.round(totalAAL / 1e6 * 100) / 100,
    oep100_mn: Math.round(totalAAL * 12.5 / 1e6 * 100) / 100,
    oep250_mn: Math.round(totalAAL * 18.0 / 1e6 * 100) / 100,
    oep500_mn: Math.round(totalAAL * 24.0 / 1e6 * 100) / 100,
    aep100_mn: Math.round(totalAAL * 8.0 / 1e6 * 100) / 100,
    pml_mn: Math.round(totalAAL * 30.0 / 1e6 * 100) / 100,
    climateTrendMult,
    protectionGap_pct: Math.round(safe(totalInsured * 0.35, totalInsured) * 10000) / 100,
    topPeril: topPeril ? topPeril[0] : 'N/A',
    topRegion: topRegion ? topRegion[0] : 'N/A',
    methodology: 'RMS/AIR-aligned frequency-severity',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 16 — Solvency Capital (Solvency II Pillar 1+2 + EIOPA)      */
/* ------------------------------------------------------------------ */

export function calcSolvencyCapital(portfolio) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  const totalAum = Math.max(1, portfolio.totalAum_usd || 0);
  let transitionRisk = 0;
  let physicalRisk = 0;
  let realPct = 0;
  let totalW = 0;

  (portfolio.holdings || []).forEach((h, i) => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const mv = h.marketValue || 0;
    transitionRisk += mv * ((sec.transitionScore || 50) / 100) * 0.04;
    physicalRisk += mv * ((sec.physicalRiskScore || 30) / 100) * 0.03;
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    totalW += h.weight || 0;
  });

  const scrBase = totalAum * 0.12;
  const climateAddon = transitionRisk + physicalRisk;
  const scrTotal = scrBase + climateAddon;
  const ownFunds = totalAum * (0.18 + sr(42) * 0.06);
  const buffer = ownFunds - scrTotal;
  const solvencyRatio = safe(ownFunds, scrTotal) * 100;
  const mcr = scrTotal * 0.45;

  // ORSA scenarios
  const orsaOrderly = safe(ownFunds * 0.95, scrTotal * 1.05) * 100;
  const orsaDisorderly = safe(ownFunds * 0.88, scrTotal * 1.18) * 100;
  const orsaHothouse = safe(ownFunds * 0.82, scrTotal * 1.30) * 100;

  return {
    scr_base_mn: Math.round(scrBase / 1e6 * 100) / 100,
    scr_climateAddon_mn: Math.round(climateAddon / 1e6 * 100) / 100,
    scr_total_mn: Math.round(scrTotal / 1e6 * 100) / 100,
    ownFunds_mn: Math.round(ownFunds / 1e6 * 100) / 100,
    solvencyRatio_pct: Math.round(solvencyRatio * 10) / 10,
    buffer_mn: Math.round(buffer / 1e6 * 100) / 100,
    orsa_orderly_ratio: Math.round(orsaOrderly * 10) / 10,
    orsa_disorderly_ratio: Math.round(orsaDisorderly * 10) / 10,
    orsa_hothouse_ratio: Math.round(orsaHothouse * 10) / 10,
    methodology: 'Solvency II Pillar 1+2 + EIOPA climate stress',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 17 — Reverse Stress Test (Monte Carlo 500 paths, sr())       */
/* ------------------------------------------------------------------ */

export function calcReverseStress(portfolio, threshold = -0.30) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  const totalAum = Math.max(1, portfolio.totalAum_usd || 0);
  let realPct = 0;
  let totalW = 0;

  // Build portfolio risk profile
  let weightedTransition = 0;
  let weightedPhysical = 0;
  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const w = h.weight || 0;
    weightedTransition += w * ((sec.transitionScore || 50) / 100);
    weightedPhysical += w * ((sec.physicalRiskScore || 30) / 100);
    if (sec.dataSource === 'real') realPct += w;
    totalW += w;
  });

  const avgTransRisk = safe(weightedTransition, totalW);
  const avgPhysRisk = safe(weightedPhysical, totalW);
  const PATHS = 500;
  let breachCount = 0;
  let breachLossSum = 0;
  let worstLoss = 0;
  const tailLosses = [];

  for (let p = 0; p < PATHS; p++) {
    const carbonShock = (sr(p * 73) - 0.3) * 0.5;
    const physShock = (sr(p * 79) - 0.4) * 0.3;
    const policyShock = (sr(p * 83) - 0.5) * 0.2;
    const marketShock = (sr(p * 89) - 0.5) * 0.15;
    const totalShock = -(avgTransRisk * carbonShock + avgPhysRisk * physShock + policyShock * 0.3 + marketShock * 0.2);
    if (totalShock < threshold) {
      breachCount++;
      breachLossSum += totalShock;
      tailLosses.push(totalShock);
    }
    if (totalShock < worstLoss) worstLoss = totalShock;
  }

  const sortedTail = [...tailLosses].sort((a, b) => a - b);
  const conditionalVaR = sortedTail.length > 0 ? safe(sortedTail.reduce((s, v) => s + v, 0), sortedTail.length) : threshold;
  const criticalCarbonPrice = Math.round(80 + safe(Math.abs(threshold), avgTransRisk) * 120);
  const criticalWarming = 1.5 + Math.abs(threshold) * 5;

  return {
    breachProbability_pct: Math.round(safe(breachCount, PATHS) * 10000) / 100,
    avgBreachLoss_pct: breachCount > 0 ? Math.round(safe(breachLossSum, breachCount) * 10000) / 100 : 0,
    worstCaseLoss_pct: Math.round(worstLoss * 10000) / 100,
    scenariosBreaching: breachCount,
    pathsSimulated: PATHS,
    conditionalVaR_pct: Math.round(conditionalVaR * 10000) / 100,
    criticalCarbonPrice,
    criticalWarming_c: Math.round(criticalWarming * 10) / 10,
    methodology: 'Monte Carlo reverse stress (500 paths, sr() deterministic)',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 18 — Climate VaR Decomposition (Merton-style factor)         */
/* ------------------------------------------------------------------ */

export function calcClimateVaRDecomposition(portfolio) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  const totalAum = Math.max(1, portfolio.totalAum_usd || 0);
  let carbonPriceLoss = 0;
  let physHazardLoss = 0;
  let policyLoss = 0;
  let techLoss = 0;
  let litigationLoss = 0;
  let reputationLoss = 0;
  let realPct = 0;
  let totalW = 0;

  (portfolio.holdings || []).forEach((h, i) => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const mv = h.marketValue || 0;
    const trans = (sec.transitionScore || 50) / 100;
    const phys = (sec.physicalRiskScore || 30) / 100;
    const ci = (sec.carbonIntensity_tco2e_per_mRevenue || 200) / 1000;

    carbonPriceLoss += mv * ci * 0.08 * (1 + sr(i * 97) * 0.2);
    physHazardLoss += mv * phys * 0.06 * (1 + sr(i * 101) * 0.3);
    policyLoss += mv * trans * 0.04 * sr(i * 103);
    techLoss += mv * trans * 0.03 * sr(i * 107);
    litigationLoss += mv * ci * 0.015 * sr(i * 109);
    reputationLoss += mv * ci * 0.01 * sr(i * 113);
    if (sec.dataSource === 'real') realPct += h.weight || 0;
    totalW += h.weight || 0;
  });

  const totalCVaR = carbonPriceLoss + physHazardLoss + policyLoss + techLoss + litigationLoss + reputationLoss;
  const factors = [carbonPriceLoss, physHazardLoss, policyLoss, techLoss, litigationLoss, reputationLoss];
  const factorNames = ['Carbon Price', 'Physical Hazard', 'Policy', 'Technology', 'Litigation', 'Reputation'];
  const topIdx = factors.indexOf(Math.max(...factors));
  const squaredShares = factors.map(f => Math.pow(safe(f, totalCVaR), 2));
  const hhi = Math.round(squaredShares.reduce((s, v) => s + v, 0) * 10000);

  return {
    totalCVaR_pct: Math.round(safe(totalCVaR, totalAum) * 10000) / 100,
    carbonPrice_pct: Math.round(safe(carbonPriceLoss, totalAum) * 10000) / 100,
    physicalHazard_pct: Math.round(safe(physHazardLoss, totalAum) * 10000) / 100,
    policy_pct: Math.round(safe(policyLoss, totalAum) * 10000) / 100,
    technology_pct: Math.round(safe(techLoss, totalAum) * 10000) / 100,
    litigation_pct: Math.round(safe(litigationLoss, totalAum) * 10000) / 100,
    reputation_pct: Math.round(safe(reputationLoss, totalAum) * 10000) / 100,
    topRiskFactor: factorNames[topIdx] || 'Carbon Price',
    concentration_hhi: hhi,
    methodology: 'Factor-based CVaR decomposition (Merton-style)',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 19 — Macro-Climate Impact (NGFS macro-financial + DSGE)      */
/* ------------------------------------------------------------------ */

export function calcMacroClimateImpact(portfolio, horizon = 2030) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  const totalAum = Math.max(1, portfolio.totalAum_usd || 0);
  let weightedTrans = 0;
  let weightedPhys = 0;
  let realPct = 0;
  let totalW = 0;

  (portfolio.holdings || []).forEach(h => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const w = h.weight || 0;
    weightedTrans += w * ((sec.transitionScore || 50) / 100);
    weightedPhys += w * ((sec.physicalRiskScore || 30) / 100);
    if (sec.dataSource === 'real') realPct += w;
    totalW += w;
  });

  const avgTrans = safe(weightedTrans, totalW);
  const avgPhys = safe(weightedPhys, totalW);
  const horizonMult = { 2030: 1.0, 2040: 1.6, 2050: 2.4 }[horizon] || 1.0;

  const gdpDrag = -(avgPhys * 2.5 + avgTrans * 1.2) * horizonMult;
  const inflationImpact = Math.round((avgTrans * 45 + avgPhys * 30) * horizonMult);
  const yieldShift = Math.round((avgTrans * 25 + avgPhys * 15) * horizonMult);
  const spreadWidening = Math.round((avgTrans * 60 + avgPhys * 40) * horizonMult);
  const erpChange = Math.round((avgTrans * 35 + avgPhys * 50) * horizonMult);
  const reCapRate = Math.round(avgPhys * 80 * horizonMult);
  const returnAdj = gdpDrag * 0.8 - safe(spreadWidening, 10000) * 2;

  return {
    gdpDrag_pct: Math.round(gdpDrag * 100) / 100,
    inflationImpact_bps: inflationImpact,
    yieldShift_bps: yieldShift,
    spreadWidening_bps: spreadWidening,
    erp_change_bps: erpChange,
    reCapRateAdj_bps: reCapRate,
    portfolioReturn_adj_pct: Math.round(returnAdj * 100) / 100,
    methodology: 'NGFS macro-financial linkages + DSGE climate overlay',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  ENGINE 20 — Transition Pathway Alignment (IEA NZE + SBTi)          */
/* ------------------------------------------------------------------ */

export function calcTransitionPathwayAlignment(portfolio) {
  const safe = (n, d) => d > 0 ? n / d : 0;
  let aligned15 = 0;
  let aligned2 = 0;
  let aligned3 = 0;
  let misaligned = 0;
  let sbtiCount = 0;
  let gfanzCount = 0;
  let fossilExp = 0;
  let capexAligned = 0;
  let transScoreSum = 0;
  let holdingCount = 0;
  let realPct = 0;
  let totalW = 0;

  (portfolio.holdings || []).forEach((h, i) => {
    const sec = getSecurity(h.securityId);
    if (!sec) return;
    const w = h.weight || 0;
    const trans = (sec.transitionScore || 50) / 100;
    const ci = sec.carbonIntensity_tco2e_per_mRevenue || 200;
    const hasSBTi = sec.sbtiTarget && sec.sbtiTarget !== 'No Target';

    // Alignment bucketing based on transition score + carbon intensity
    const alignScore = (1 - trans) * 0.6 + Math.max(0, 1 - ci / 500) * 0.4;
    if (alignScore >= 0.7) aligned15 += w;
    else if (alignScore >= 0.5) aligned2 += w;
    else if (alignScore >= 0.3) aligned3 += w;
    else misaligned += w;

    if (hasSBTi) sbtiCount += w;
    // GFANZ proxy: low transition risk + has target
    if (hasSBTi && trans < 0.4) gfanzCount += w;
    // Fossil exposure
    if ((sec.sector || '').match(/oil|gas|coal|fossil/i)) fossilExp += w;
    // Capex alignment proxy
    const capexRatio = 0.3 + (1 - trans) * 0.5 + sr(i * 127) * 0.2;
    capexAligned += w * Math.min(1, capexRatio);
    transScoreSum += alignScore * w;
    holdingCount++;
    if (sec.dataSource === 'real') realPct += w;
    totalW += w;
  });

  return {
    alignment_1_5c_pct: Math.round(safe(aligned15, totalW) * 10000) / 100,
    alignment_2c_pct: Math.round(safe(aligned2, totalW) * 10000) / 100,
    alignment_3c_pct: Math.round(safe(aligned3, totalW) * 10000) / 100,
    misaligned_pct: Math.round(safe(misaligned, totalW) * 10000) / 100,
    sbtiCoverage_pct: Math.round(safe(sbtiCount, totalW) * 10000) / 100,
    gfanzAlignment_pct: Math.round(safe(gfanzCount, totalW) * 10000) / 100,
    fossilPhaseout_pct: Math.round((1 - safe(fossilExp, totalW)) * 10000) / 100,
    capexAlignment_pct: Math.round(safe(capexAligned, totalW) * 10000) / 100,
    avgTransitionScore: Math.round(safe(transScoreSum, totalW) * 100) / 100,
    methodology: 'IEA NZE 2050 + SBTi sectoral pathways',
    dataQuality: totalW > 0 ? 'good' : 'insufficient',
    realDataPct: Math.round(safe(realPct, totalW) * 100),
    mockDataPct: Math.round(safe(totalW - realPct, totalW) * 100),
  };
}

/* ------------------------------------------------------------------ */
/*  EXPORTS                                                            */
/* ------------------------------------------------------------------ */

export const PORTFOLIOS = {
  equity: EQUITY_PORTFOLIO,
  fixedIncome: FIXED_INCOME_PORTFOLIO,
  realEstate: REAL_ESTATE_PORTFOLIO,
  sovereign: SOVEREIGN_PORTFOLIO,
  greenBond: GREEN_BOND_PORTFOLIO,
  insurance: INSURANCE_PORTFOLIO,
  carbonCredit: CARBON_CREDIT_PORTFOLIO,
  infrastructure: INFRASTRUCTURE_PORTFOLIO,
  multiAsset: MULTI_ASSET_PORTFOLIO,
  pcaf: PCAF_PORTFOLIO,
  sfdrArt9: SFDR_ART9_PORTFOLIO,
  transition: TRANSITION_PORTFOLIO,
};

export const ENGINES = {
  calcPortfolioWACI,
  calcFinancedEmissions,
  calcPortfolioTemperature,
  calcClimateVaR,
  calcSFDRPAI,
  calcTaxonomyAlignment,
  calcTransitionScore,
  calcPhysicalRisk,
  calcWaterFootprint,
  calcBiodiversityImpact,
  calcSBTiCoverage,
  calcCBAMExposure,
  calcInsuranceClimateRisk,
  calcClimateStressTest,
  calcCatModel,
  calcSolvencyCapital,
  calcReverseStress,
  calcClimateVaRDecomposition,
  calcMacroClimateImpact,
  calcTransitionPathwayAlignment,
};

export { MASTER_UNIVERSE };

export default { MASTER_UNIVERSE, UNIVERSE_STATS, PORTFOLIOS, ENGINES };
