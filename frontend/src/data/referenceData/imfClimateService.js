/**
 * IMF Climate Data Service — Green Bond Market Aggregates
 * Source: https://climatedata.imf.org/
 * API: ArcGIS REST (free, no key needed)
 *
 * Provides: Country-level green bond issuance volumes, sovereign ESG indicators
 */

const IMF_BASE = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services';
const CACHE_KEY = 'ra_imf_climate_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let imfCache = {};
try {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Date.now() - (parsed._ts || 0) < CACHE_TTL) imfCache = parsed;
  }
} catch {}

/**
 * Fetch green bond issuance data from IMF
 * Returns country-level aggregates
 */
export async function fetchGreenBondData() {
  if (imfCache.greenBonds) return imfCache.greenBonds;

  try {
    const url = `${IMF_BASE}/green_bonds_2022/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=200&f=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`IMF API: ${response.status}`);
    const data = await response.json();

    const records = (data.features || []).map(f => ({
      country: f.attributes?.Country || f.attributes?.country_name,
      iso3: f.attributes?.ISO3 || f.attributes?.iso3,
      greenBondIssuance_bn: f.attributes?.Green_Bond_Issuance || f.attributes?.green_bond_issuance || 0,
      year: f.attributes?.Year || f.attributes?.year,
      cumulativeIssuance_bn: f.attributes?.Cumulative_Issuance || 0,
    }));

    imfCache.greenBonds = records;
    imfCache._ts = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(imfCache));
    return records;
  } catch (err) {
    console.warn('IMF Climate API fetch failed:', err.message);
    return getIMFFallback();
  }
}

/**
 * Fallback static data if API is unavailable
 */
function getIMFFallback() {
  return [
    { country: 'China', iso3: 'CHN', greenBondIssuance_bn: 85.4, year: 2023, cumulativeIssuance_bn: 312.5 },
    { country: 'United States', iso3: 'USA', greenBondIssuance_bn: 62.1, year: 2023, cumulativeIssuance_bn: 285.3 },
    { country: 'Germany', iso3: 'DEU', greenBondIssuance_bn: 58.3, year: 2023, cumulativeIssuance_bn: 198.7 },
    { country: 'France', iso3: 'FRA', greenBondIssuance_bn: 51.8, year: 2023, cumulativeIssuance_bn: 214.2 },
    { country: 'United Kingdom', iso3: 'GBR', greenBondIssuance_bn: 28.5, year: 2023, cumulativeIssuance_bn: 95.4 },
    { country: 'Netherlands', iso3: 'NLD', greenBondIssuance_bn: 22.1, year: 2023, cumulativeIssuance_bn: 78.9 },
    { country: 'Japan', iso3: 'JPN', greenBondIssuance_bn: 18.6, year: 2023, cumulativeIssuance_bn: 52.3 },
    { country: 'Italy', iso3: 'ITA', greenBondIssuance_bn: 16.2, year: 2023, cumulativeIssuance_bn: 48.1 },
    { country: 'Spain', iso3: 'ESP', greenBondIssuance_bn: 14.8, year: 2023, cumulativeIssuance_bn: 42.5 },
    { country: 'South Korea', iso3: 'KOR', greenBondIssuance_bn: 12.3, year: 2023, cumulativeIssuance_bn: 35.8 },
    { country: 'Canada', iso3: 'CAN', greenBondIssuance_bn: 11.5, year: 2023, cumulativeIssuance_bn: 38.2 },
    { country: 'India', iso3: 'IND', greenBondIssuance_bn: 8.2, year: 2023, cumulativeIssuance_bn: 22.4 },
    { country: 'Singapore', iso3: 'SGP', greenBondIssuance_bn: 7.5, year: 2023, cumulativeIssuance_bn: 18.9 },
    { country: 'Australia', iso3: 'AUS', greenBondIssuance_bn: 7.2, year: 2023, cumulativeIssuance_bn: 24.1 },
    { country: 'Brazil', iso3: 'BRA', greenBondIssuance_bn: 5.8, year: 2023, cumulativeIssuance_bn: 15.2 },
    { country: 'Chile', iso3: 'CHL', greenBondIssuance_bn: 4.5, year: 2023, cumulativeIssuance_bn: 12.8 },
    { country: 'Mexico', iso3: 'MEX', greenBondIssuance_bn: 3.2, year: 2023, cumulativeIssuance_bn: 8.5 },
    { country: 'South Africa', iso3: 'ZAF', greenBondIssuance_bn: 2.1, year: 2023, cumulativeIssuance_bn: 5.8 },
    { country: 'Indonesia', iso3: 'IDN', greenBondIssuance_bn: 3.8, year: 2023, cumulativeIssuance_bn: 9.2 },
    { country: 'Egypt', iso3: 'EGY', greenBondIssuance_bn: 0.75, year: 2023, cumulativeIssuance_bn: 1.5 },
  ];
}

/**
 * Extended Sovereign ESG Database (30 countries)
 * Combines ND-GAIN index, Climate Action Tracker, and governance indicators
 */
export const SOVEREIGN_ESG_DB = [
  { country: 'Germany', iso2: 'DE', iso3: 'DEU', score: 90, climate: 88, social: 92, governance: 91, ndgain: 72.0, rating: 'AAA', catRating: '1.5°C Compatible', greenBondVolume_bn: 198.7, region: 'Europe' },
  { country: 'France', iso2: 'FR', iso3: 'FRA', score: 82, climate: 80, social: 84, governance: 83, ndgain: 68.5, rating: 'AA', catRating: 'Almost Sufficient', greenBondVolume_bn: 214.2, region: 'Europe' },
  { country: 'Netherlands', iso2: 'NL', iso3: 'NLD', score: 88, climate: 86, social: 90, governance: 89, ndgain: 73.2, rating: 'AAA', catRating: 'Insufficient', greenBondVolume_bn: 78.9, region: 'Europe' },
  { country: 'United Kingdom', iso2: 'GB', iso3: 'GBR', score: 78, climate: 72, social: 82, governance: 80, ndgain: 71.4, rating: 'AA', catRating: 'Insufficient', greenBondVolume_bn: 95.4, region: 'Europe' },
  { country: 'Italy', iso2: 'IT', iso3: 'ITA', score: 68, climate: 62, social: 72, governance: 70, ndgain: 62.8, rating: 'BBB', catRating: 'Insufficient', greenBondVolume_bn: 48.1, region: 'Europe' },
  { country: 'Spain', iso2: 'ES', iso3: 'ESP', score: 72, climate: 68, social: 75, governance: 73, ndgain: 64.5, rating: 'A', catRating: 'Almost Sufficient', greenBondVolume_bn: 42.5, region: 'Europe' },
  { country: 'Norway', iso2: 'NO', iso3: 'NOR', score: 92, climate: 85, social: 95, governance: 96, ndgain: 76.1, rating: 'AAA', catRating: 'Insufficient', greenBondVolume_bn: 15.2, region: 'Europe' },
  { country: 'Sweden', iso2: 'SE', iso3: 'SWE', score: 91, climate: 90, social: 93, governance: 90, ndgain: 74.8, rating: 'AAA', catRating: '1.5°C Compatible', greenBondVolume_bn: 22.4, region: 'Europe' },
  { country: 'Japan', iso2: 'JP', iso3: 'JPN', score: 75, climate: 72, social: 78, governance: 76, ndgain: 67.8, rating: 'A+', catRating: 'Highly Insufficient', greenBondVolume_bn: 52.3, region: 'Asia-Pacific' },
  { country: 'USA', iso2: 'US', iso3: 'USA', score: 68, climate: 55, social: 72, governance: 78, ndgain: 69.5, rating: 'AA+', catRating: 'Insufficient', greenBondVolume_bn: 285.3, region: 'Americas' },
  { country: 'Canada', iso2: 'CA', iso3: 'CAN', score: 76, climate: 62, social: 84, governance: 82, ndgain: 72.5, rating: 'AAA', catRating: 'Highly Insufficient', greenBondVolume_bn: 38.2, region: 'Americas' },
  { country: 'Australia', iso2: 'AU', iso3: 'AUS', score: 72, climate: 58, social: 80, governance: 78, ndgain: 71.2, rating: 'AAA', catRating: 'Insufficient', greenBondVolume_bn: 24.1, region: 'Asia-Pacific' },
  { country: 'South Korea', iso2: 'KR', iso3: 'KOR', score: 74, climate: 68, social: 76, governance: 78, ndgain: 66.4, rating: 'AA', catRating: 'Highly Insufficient', greenBondVolume_bn: 35.8, region: 'Asia-Pacific' },
  { country: 'Singapore', iso2: 'SG', iso3: 'SGP', score: 80, climate: 72, social: 82, governance: 88, ndgain: 75.8, rating: 'AAA', catRating: 'Critically Insufficient', greenBondVolume_bn: 18.9, region: 'Asia-Pacific' },
  { country: 'China', iso2: 'CN', iso3: 'CHN', score: 48, climate: 42, social: 50, governance: 52, ndgain: 52.8, rating: 'A+', catRating: 'Highly Insufficient', greenBondVolume_bn: 312.5, region: 'Asia-Pacific' },
  { country: 'India', iso2: 'IN', iso3: 'IND', score: 45, climate: 38, social: 48, governance: 50, ndgain: 43.5, rating: 'BBB-', catRating: '2°C Compatible', greenBondVolume_bn: 22.4, region: 'Asia-Pacific' },
  { country: 'Indonesia', iso2: 'ID', iso3: 'IDN', score: 42, climate: 35, social: 45, governance: 46, ndgain: 41.2, rating: 'BBB', catRating: 'Highly Insufficient', greenBondVolume_bn: 9.2, region: 'Asia-Pacific' },
  { country: 'Chile', iso2: 'CL', iso3: 'CHL', score: 71, climate: 68, social: 70, governance: 75, ndgain: 58.2, rating: 'A', catRating: 'Almost Sufficient', greenBondVolume_bn: 12.8, region: 'Americas' },
  { country: 'Mexico', iso2: 'MX', iso3: 'MEX', score: 52, climate: 48, social: 52, governance: 56, ndgain: 49.5, rating: 'BBB', catRating: 'Insufficient', greenBondVolume_bn: 8.5, region: 'Americas' },
  { country: 'Brazil', iso2: 'BR', iso3: 'BRA', score: 52, climate: 55, social: 48, governance: 53, ndgain: 48.9, rating: 'BB-', catRating: 'Insufficient', greenBondVolume_bn: 15.2, region: 'Americas' },
  { country: 'Colombia', iso2: 'CO', iso3: 'COL', score: 55, climate: 52, social: 54, governance: 58, ndgain: 46.8, rating: 'BB+', catRating: 'Insufficient', greenBondVolume_bn: 3.2, region: 'Americas' },
  { country: 'South Africa', iso2: 'ZA', iso3: 'ZAF', score: 50, climate: 46, social: 52, governance: 53, ndgain: 44.2, rating: 'BB-', catRating: 'Highly Insufficient', greenBondVolume_bn: 5.8, region: 'Africa' },
  { country: 'Nigeria', iso2: 'NG', iso3: 'NGA', score: 32, climate: 28, social: 34, governance: 35, ndgain: 32.5, rating: 'B+', catRating: '2°C Compatible', greenBondVolume_bn: 0.3, region: 'Africa' },
  { country: 'Kenya', iso2: 'KE', iso3: 'KEN', score: 38, climate: 42, social: 35, governance: 38, ndgain: 36.8, rating: 'B', catRating: '1.5°C Compatible', greenBondVolume_bn: 0.5, region: 'Africa' },
  { country: 'Egypt', iso2: 'EG', iso3: 'EGY', score: 40, climate: 35, social: 42, governance: 43, ndgain: 38.5, rating: 'B+', catRating: '2°C Compatible', greenBondVolume_bn: 1.5, region: 'Africa/MENA' },
  { country: 'UAE', iso2: 'AE', iso3: 'ARE', score: 58, climate: 45, social: 62, governance: 68, ndgain: 52.1, rating: 'AA', catRating: 'Critically Insufficient', greenBondVolume_bn: 4.2, region: 'MENA' },
  { country: 'Saudi Arabia', iso2: 'SA', iso3: 'SAU', score: 42, climate: 30, social: 48, governance: 48, ndgain: 48.5, rating: 'A', catRating: 'Critically Insufficient', greenBondVolume_bn: 2.8, region: 'MENA' },
  { country: 'Switzerland', iso2: 'CH', iso3: 'CHE', score: 89, climate: 82, social: 94, governance: 92, ndgain: 75.2, rating: 'AAA', catRating: 'Insufficient', greenBondVolume_bn: 12.5, region: 'Europe' },
  { country: 'Denmark', iso2: 'DK', iso3: 'DNK', score: 93, climate: 92, social: 94, governance: 93, ndgain: 76.8, rating: 'AAA', catRating: '1.5°C Compatible', greenBondVolume_bn: 8.2, region: 'Europe' },
  { country: 'Finland', iso2: 'FI', iso3: 'FIN', score: 90, climate: 88, social: 92, governance: 91, ndgain: 74.5, rating: 'AA+', catRating: 'Almost Sufficient', greenBondVolume_bn: 6.5, region: 'Europe' },
];

/**
 * Get sovereign ESG data for a country (by ISO2 code)
 */
export function getSovereignESG(iso2) {
  return SOVEREIGN_ESG_DB.find(s => s.iso2 === iso2) || null;
}

/**
 * Get all sovereign ESG data
 */
export function getAllSovereignESG() {
  return [...SOVEREIGN_ESG_DB];
}

/**
 * Get green bond market summary
 */
export function getGreenBondMarketSummary() {
  const total = SOVEREIGN_ESG_DB.reduce((s, c) => s + (c.greenBondVolume_bn || 0), 0);
  const byRegion = {};
  SOVEREIGN_ESG_DB.forEach(c => {
    byRegion[c.region] = (byRegion[c.region] || 0) + (c.greenBondVolume_bn || 0);
  });
  return { totalVolume_bn: total, byRegion, countries: SOVEREIGN_ESG_DB.length };
}

export default { fetchGreenBondData, SOVEREIGN_ESG_DB, getSovereignESG, getAllSovereignESG, getGreenBondMarketSummary };
