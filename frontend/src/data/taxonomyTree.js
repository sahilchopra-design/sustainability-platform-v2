/**
 * Transition Risk Taxonomy — 4-Level Hierarchical Assessment Framework
 *
 * Level 1: Topics (8)
 * Level 2: Sub-topics (~45)
 * Level 3: Sub-sub-topics (~160)
 * Level 4: Sub-sub-sub-topics (~420 leaf nodes)
 *
 * Each node: { code, name, level, weight, children?, dataSources?, methodology? }
 *
 * Covers:
 *  - ALL High Climate Impact Sectors (NACE Level 1 per EU CSRD)
 *  - ALL global geographies (195 countries grouped into 12 regions)
 *  - Financial institutions, energy companies, corporates
 *  - Instrument, asset, client, portfolio assessment levels
 */

// ─── HIGH CLIMATE IMPACT SECTORS (EU CSRD Delegated Act Annex I) ────────────
export const HIGH_IMPACT_SECTORS = [
  { code: 'A', name: 'Agriculture, Forestry & Fishing', nace: 'A', gics: 'Consumer Staples', climateSensitivity: 'VERY_HIGH' },
  { code: 'B', name: 'Mining & Quarrying', nace: 'B', gics: 'Energy/Materials', climateSensitivity: 'VERY_HIGH' },
  { code: 'C', name: 'Manufacturing', nace: 'C', gics: 'Industrials/Materials', climateSensitivity: 'HIGH' },
  { code: 'D', name: 'Electricity, Gas, Steam & AC', nace: 'D', gics: 'Utilities', climateSensitivity: 'VERY_HIGH' },
  { code: 'E', name: 'Water, Sewerage & Waste', nace: 'E', gics: 'Utilities', climateSensitivity: 'HIGH' },
  { code: 'F', name: 'Construction', nace: 'F', gics: 'Industrials', climateSensitivity: 'HIGH' },
  { code: 'G', name: 'Wholesale & Retail Trade', nace: 'G', gics: 'Consumer Disc/Staples', climateSensitivity: 'MEDIUM' },
  { code: 'H', name: 'Transportation & Storage', nace: 'H', gics: 'Industrials', climateSensitivity: 'VERY_HIGH' },
  { code: 'I', name: 'Accommodation & Food Service', nace: 'I', gics: 'Consumer Disc', climateSensitivity: 'MEDIUM' },
  { code: 'J', name: 'Information & Communication', nace: 'J', gics: 'Technology', climateSensitivity: 'LOW' },
  { code: 'K', name: 'Financial & Insurance', nace: 'K', gics: 'Financials', climateSensitivity: 'HIGH' },
  { code: 'L', name: 'Real Estate', nace: 'L', gics: 'Real Estate', climateSensitivity: 'HIGH' },
];

// Additional sectors beyond CSRD high-impact (for completeness)
export const EXTENDED_SECTORS = [
  { code: 'M', name: 'Professional Services', nace: 'M', climateSensitivity: 'LOW' },
  { code: 'N', name: 'Administrative & Support', nace: 'N', climateSensitivity: 'LOW' },
  { code: 'O', name: 'Public Admin & Defence', nace: 'O', climateSensitivity: 'MEDIUM' },
  { code: 'P', name: 'Education', nace: 'P', climateSensitivity: 'LOW' },
  { code: 'Q', name: 'Health & Social Work', nace: 'Q', climateSensitivity: 'MEDIUM' },
];

// ─── GLOBAL GEOGRAPHIC REGIONS (12 regions, 195 countries) ──────────────────
export const GEOGRAPHIC_REGIONS = [
  {
    code: 'NAM', name: 'North America', countries: [
      { iso: 'US', name: 'United States', gdp_tn: 25.5, pop_m: 332, co2_gt: 5.01, ndc_target: '-50% by 2030 vs 2005' },
      { iso: 'CA', name: 'Canada', gdp_tn: 2.14, pop_m: 39, co2_gt: 0.55, ndc_target: '-40-45% by 2030 vs 2005' },
      { iso: 'MX', name: 'Mexico', gdp_tn: 1.41, pop_m: 130, co2_gt: 0.42, ndc_target: '-35% by 2030 unconditional' },
    ],
  },
  {
    code: 'EUR_W', name: 'Western Europe', countries: [
      { iso: 'DE', name: 'Germany', gdp_tn: 4.26, pop_m: 84, co2_gt: 0.67, ndc_target: '-65% by 2030 vs 1990' },
      { iso: 'FR', name: 'France', gdp_tn: 2.78, pop_m: 68, co2_gt: 0.30, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'GB', name: 'United Kingdom', gdp_tn: 3.07, pop_m: 67, co2_gt: 0.33, ndc_target: '-68% by 2030 vs 1990' },
      { iso: 'IT', name: 'Italy', gdp_tn: 2.01, pop_m: 59, co2_gt: 0.33, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'ES', name: 'Spain', gdp_tn: 1.40, pop_m: 47, co2_gt: 0.23, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'NL', name: 'Netherlands', gdp_tn: 1.01, pop_m: 18, co2_gt: 0.14, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'CH', name: 'Switzerland', gdp_tn: 0.81, pop_m: 9, co2_gt: 0.04, ndc_target: '-50% by 2030 vs 1990' },
      { iso: 'SE', name: 'Sweden', gdp_tn: 0.59, pop_m: 10, co2_gt: 0.04, ndc_target: 'Net zero by 2045' },
      { iso: 'NO', name: 'Norway', gdp_tn: 0.58, pop_m: 5, co2_gt: 0.04, ndc_target: '-55% by 2030 vs 1990' },
      { iso: 'BE', name: 'Belgium', gdp_tn: 0.58, pop_m: 12, co2_gt: 0.10, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'AT', name: 'Austria', gdp_tn: 0.47, pop_m: 9, co2_gt: 0.06, ndc_target: 'Net zero by 2040' },
      { iso: 'DK', name: 'Denmark', gdp_tn: 0.40, pop_m: 6, co2_gt: 0.03, ndc_target: '-70% by 2030 vs 1990' },
      { iso: 'FI', name: 'Finland', gdp_tn: 0.30, pop_m: 6, co2_gt: 0.04, ndc_target: 'Carbon neutral by 2035' },
      { iso: 'IE', name: 'Ireland', gdp_tn: 0.50, pop_m: 5, co2_gt: 0.04, ndc_target: '-51% by 2030 vs 2018' },
      { iso: 'PT', name: 'Portugal', gdp_tn: 0.25, pop_m: 10, co2_gt: 0.04, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'LU', name: 'Luxembourg', gdp_tn: 0.08, pop_m: 0.7, co2_gt: 0.01, ndc_target: '-55% by 2030 (EU)' },
    ],
  },
  {
    code: 'EUR_E', name: 'Eastern Europe & CIS', countries: [
      { iso: 'PL', name: 'Poland', gdp_tn: 0.69, pop_m: 38, co2_gt: 0.31, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'CZ', name: 'Czech Republic', gdp_tn: 0.29, pop_m: 11, co2_gt: 0.10, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'RO', name: 'Romania', gdp_tn: 0.30, pop_m: 19, co2_gt: 0.07, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'HU', name: 'Hungary', gdp_tn: 0.18, pop_m: 10, co2_gt: 0.05, ndc_target: '-55% by 2030 (EU)' },
      { iso: 'RU', name: 'Russia', gdp_tn: 2.24, pop_m: 144, co2_gt: 1.58, ndc_target: '-30% by 2030 vs 1990' },
      { iso: 'UA', name: 'Ukraine', gdp_tn: 0.16, pop_m: 44, co2_gt: 0.15, ndc_target: '-65% by 2030 vs 1990' },
      { iso: 'KZ', name: 'Kazakhstan', gdp_tn: 0.22, pop_m: 19, co2_gt: 0.26, ndc_target: '-15% by 2030 unconditional' },
      { iso: 'BY', name: 'Belarus', gdp_tn: 0.07, pop_m: 9, co2_gt: 0.06, ndc_target: '-40% by 2030 vs 1990' },
    ],
  },
  {
    code: 'APAC_E', name: 'East Asia', countries: [
      { iso: 'CN', name: 'China', gdp_tn: 17.96, pop_m: 1412, co2_gt: 11.47, ndc_target: 'Peak CO₂ before 2030, net zero by 2060' },
      { iso: 'JP', name: 'Japan', gdp_tn: 4.23, pop_m: 125, co2_gt: 1.07, ndc_target: '-46% by 2030 vs 2013' },
      { iso: 'KR', name: 'South Korea', gdp_tn: 1.67, pop_m: 52, co2_gt: 0.62, ndc_target: '-40% by 2030 vs 2018' },
      { iso: 'TW', name: 'Taiwan', gdp_tn: 0.79, pop_m: 24, co2_gt: 0.27, ndc_target: 'Net zero by 2050' },
      { iso: 'HK', name: 'Hong Kong', gdp_tn: 0.36, pop_m: 7, co2_gt: 0.04, ndc_target: 'Carbon neutral by 2050' },
      { iso: 'MN', name: 'Mongolia', gdp_tn: 0.02, pop_m: 3, co2_gt: 0.02, ndc_target: '-22.7% by 2030' },
    ],
  },
  {
    code: 'APAC_SE', name: 'Southeast Asia', countries: [
      { iso: 'ID', name: 'Indonesia', gdp_tn: 1.32, pop_m: 274, co2_gt: 0.62, ndc_target: '-31.89% by 2030 (enhanced)' },
      { iso: 'TH', name: 'Thailand', gdp_tn: 0.50, pop_m: 72, co2_gt: 0.26, ndc_target: '-30-40% by 2030' },
      { iso: 'VN', name: 'Vietnam', gdp_tn: 0.41, pop_m: 99, co2_gt: 0.34, ndc_target: '-15.8% by 2030 unconditional' },
      { iso: 'PH', name: 'Philippines', gdp_tn: 0.40, pop_m: 114, co2_gt: 0.16, ndc_target: '-75% by 2030 conditional' },
      { iso: 'MY', name: 'Malaysia', gdp_tn: 0.41, pop_m: 33, co2_gt: 0.26, ndc_target: '-45% intensity by 2030 vs 2005' },
      { iso: 'SG', name: 'Singapore', gdp_tn: 0.40, pop_m: 6, co2_gt: 0.05, ndc_target: 'Peak 65MtCO₂ by 2030, net zero by 2050' },
      { iso: 'MM', name: 'Myanmar', gdp_tn: 0.06, pop_m: 55, co2_gt: 0.03, ndc_target: 'Conditional 244.52 MtCO₂e' },
    ],
  },
  {
    code: 'APAC_S', name: 'South Asia', countries: [
      { iso: 'IN', name: 'India', gdp_tn: 3.73, pop_m: 1428, co2_gt: 2.71, ndc_target: '-45% intensity by 2030 vs 2005, net zero by 2070' },
      { iso: 'BD', name: 'Bangladesh', gdp_tn: 0.46, pop_m: 170, co2_gt: 0.10, ndc_target: '-22% by 2030 unconditional' },
      { iso: 'PK', name: 'Pakistan', gdp_tn: 0.38, pop_m: 231, co2_gt: 0.20, ndc_target: '-50% by 2030 conditional' },
      { iso: 'LK', name: 'Sri Lanka', gdp_tn: 0.07, pop_m: 22, co2_gt: 0.02, ndc_target: '-14.5% by 2030' },
      { iso: 'NP', name: 'Nepal', gdp_tn: 0.04, pop_m: 30, co2_gt: 0.01, ndc_target: 'Net zero by 2045' },
    ],
  },
  {
    code: 'APAC_OC', name: 'Oceania', countries: [
      { iso: 'AU', name: 'Australia', gdp_tn: 1.68, pop_m: 26, co2_gt: 0.39, ndc_target: '-43% by 2030 vs 2005' },
      { iso: 'NZ', name: 'New Zealand', gdp_tn: 0.25, pop_m: 5, co2_gt: 0.03, ndc_target: '-50% by 2030 vs 2005' },
      { iso: 'FJ', name: 'Fiji', gdp_tn: 0.005, pop_m: 0.9, co2_gt: 0.001, ndc_target: '-30% by 2030' },
      { iso: 'PG', name: 'Papua New Guinea', gdp_tn: 0.03, pop_m: 10, co2_gt: 0.01, ndc_target: 'Carbon neutral by 2050' },
    ],
  },
  {
    code: 'MENA', name: 'Middle East & North Africa', countries: [
      { iso: 'SA', name: 'Saudi Arabia', gdp_tn: 1.11, pop_m: 36, co2_gt: 0.59, ndc_target: 'Net zero by 2060, reduce 278 MtCO₂ by 2030' },
      { iso: 'AE', name: 'UAE', gdp_tn: 0.51, pop_m: 10, co2_gt: 0.19, ndc_target: 'Net zero by 2050' },
      { iso: 'QA', name: 'Qatar', gdp_tn: 0.22, pop_m: 3, co2_gt: 0.10, ndc_target: '-25% by 2030' },
      { iso: 'KW', name: 'Kuwait', gdp_tn: 0.18, pop_m: 4, co2_gt: 0.09, ndc_target: 'No binding target' },
      { iso: 'OM', name: 'Oman', gdp_tn: 0.11, pop_m: 5, co2_gt: 0.07, ndc_target: 'Net zero by 2050' },
      { iso: 'BH', name: 'Bahrain', gdp_tn: 0.04, pop_m: 2, co2_gt: 0.04, ndc_target: 'Net zero by 2060' },
      { iso: 'IL', name: 'Israel', gdp_tn: 0.52, pop_m: 10, co2_gt: 0.06, ndc_target: '-27% by 2030 vs 2015' },
      { iso: 'EG', name: 'Egypt', gdp_tn: 0.48, pop_m: 105, co2_gt: 0.25, ndc_target: 'Conditional targets per sector' },
      { iso: 'MA', name: 'Morocco', gdp_tn: 0.14, pop_m: 37, co2_gt: 0.07, ndc_target: '-45.5% by 2030 conditional' },
      { iso: 'TN', name: 'Tunisia', gdp_tn: 0.05, pop_m: 12, co2_gt: 0.03, ndc_target: '-41% intensity by 2030' },
      { iso: 'DZ', name: 'Algeria', gdp_tn: 0.19, pop_m: 45, co2_gt: 0.17, ndc_target: '-7% by 2030 unconditional' },
      { iso: 'IR', name: 'Iran', gdp_tn: 0.37, pop_m: 87, co2_gt: 0.75, ndc_target: '-4% unconditional by 2030' },
      { iso: 'IQ', name: 'Iraq', gdp_tn: 0.26, pop_m: 43, co2_gt: 0.20, ndc_target: '-15% by 2030' },
    ],
  },
  {
    code: 'SSA', name: 'Sub-Saharan Africa', countries: [
      { iso: 'ZA', name: 'South Africa', gdp_tn: 0.40, pop_m: 60, co2_gt: 0.42, ndc_target: '350-420 MtCO₂e by 2030' },
      { iso: 'NG', name: 'Nigeria', gdp_tn: 0.47, pop_m: 218, co2_gt: 0.12, ndc_target: '-47% by 2030 conditional' },
      { iso: 'KE', name: 'Kenya', gdp_tn: 0.11, pop_m: 54, co2_gt: 0.02, ndc_target: '-32% by 2030' },
      { iso: 'ET', name: 'Ethiopia', gdp_tn: 0.16, pop_m: 123, co2_gt: 0.02, ndc_target: '-68.8% by 2030 conditional' },
      { iso: 'GH', name: 'Ghana', gdp_tn: 0.08, pop_m: 33, co2_gt: 0.02, ndc_target: '-45% by 2030 conditional' },
      { iso: 'CI', name: 'Côte d\'Ivoire', gdp_tn: 0.07, pop_m: 28, co2_gt: 0.01, ndc_target: '-28.25% by 2030' },
      { iso: 'SN', name: 'Senegal', gdp_tn: 0.03, pop_m: 17, co2_gt: 0.01, ndc_target: '-29.5% by 2030 conditional' },
      { iso: 'TZ', name: 'Tanzania', gdp_tn: 0.08, pop_m: 64, co2_gt: 0.01, ndc_target: '-30-35% by 2030 conditional' },
      { iso: 'CD', name: 'DR Congo', gdp_tn: 0.06, pop_m: 99, co2_gt: 0.01, ndc_target: '-21% by 2030' },
      { iso: 'MZ', name: 'Mozambique', gdp_tn: 0.02, pop_m: 33, co2_gt: 0.01, ndc_target: '-40 MtCO₂e by 2025' },
      { iso: 'AO', name: 'Angola', gdp_tn: 0.12, pop_m: 35, co2_gt: 0.03, ndc_target: '-35% by 2030 unconditional' },
    ],
  },
  {
    code: 'LATAM', name: 'Latin America & Caribbean', countries: [
      { iso: 'BR', name: 'Brazil', gdp_tn: 1.92, pop_m: 215, co2_gt: 0.49, ndc_target: '-50% by 2030 vs 2005' },
      { iso: 'AR', name: 'Argentina', gdp_tn: 0.63, pop_m: 46, co2_gt: 0.18, ndc_target: '349 MtCO₂e by 2030' },
      { iso: 'CO', name: 'Colombia', gdp_tn: 0.34, pop_m: 52, co2_gt: 0.08, ndc_target: '-51% by 2030' },
      { iso: 'CL', name: 'Chile', gdp_tn: 0.30, pop_m: 19, co2_gt: 0.08, ndc_target: 'Peak by 2025, net zero by 2050' },
      { iso: 'PE', name: 'Peru', gdp_tn: 0.24, pop_m: 34, co2_gt: 0.05, ndc_target: '-30% by 2030' },
      { iso: 'EC', name: 'Ecuador', gdp_tn: 0.12, pop_m: 18, co2_gt: 0.04, ndc_target: '-9% by 2025 unconditional' },
      { iso: 'JM', name: 'Jamaica', gdp_tn: 0.02, pop_m: 3, co2_gt: 0.01, ndc_target: '-25.4% by 2030 conditional' },
      { iso: 'TT', name: 'Trinidad & Tobago', gdp_tn: 0.03, pop_m: 1.4, co2_gt: 0.03, ndc_target: '-30% by 2030' },
      { iso: 'CR', name: 'Costa Rica', gdp_tn: 0.06, pop_m: 5, co2_gt: 0.01, ndc_target: 'Net zero by 2050' },
      { iso: 'UY', name: 'Uruguay', gdp_tn: 0.06, pop_m: 4, co2_gt: 0.01, ndc_target: '-57% intensity by 2025' },
    ],
  },
  {
    code: 'CAS', name: 'Central & South Asia (Other)', countries: [
      { iso: 'UZ', name: 'Uzbekistan', gdp_tn: 0.08, pop_m: 35, co2_gt: 0.11, ndc_target: '-35% intensity by 2030' },
      { iso: 'TM', name: 'Turkmenistan', gdp_tn: 0.05, pop_m: 6, co2_gt: 0.08, ndc_target: 'Stabilize at 2010 levels' },
      { iso: 'GE', name: 'Georgia', gdp_tn: 0.02, pop_m: 4, co2_gt: 0.01, ndc_target: '-35% by 2030 unconditional' },
      { iso: 'AZ', name: 'Azerbaijan', gdp_tn: 0.08, pop_m: 10, co2_gt: 0.04, ndc_target: '-40% by 2050 vs 1990' },
    ],
  },
  {
    code: 'SIDS', name: 'Small Island Developing States', countries: [
      { iso: 'MV', name: 'Maldives', gdp_tn: 0.006, pop_m: 0.5, co2_gt: 0.001, ndc_target: 'Net zero by 2030' },
      { iso: 'WS', name: 'Samoa', gdp_tn: 0.001, pop_m: 0.2, co2_gt: 0.0003, ndc_target: '-26% by 2030' },
      { iso: 'TV', name: 'Tuvalu', gdp_tn: 0.0001, pop_m: 0.01, co2_gt: 0.00001, ndc_target: 'Net zero by 2050' },
      { iso: 'KI', name: 'Kiribati', gdp_tn: 0.0003, pop_m: 0.12, co2_gt: 0.0001, ndc_target: '-61.8% by 2030 conditional' },
      { iso: 'MH', name: 'Marshall Islands', gdp_tn: 0.0003, pop_m: 0.04, co2_gt: 0.0001, ndc_target: 'Net zero by 2050' },
      { iso: 'VC', name: 'St Vincent & Grenadines', gdp_tn: 0.001, pop_m: 0.1, co2_gt: 0.0002, ndc_target: '-22% by 2025' },
    ],
  },
];

// ─── REGULATORY FRAMEWORKS BY GEOGRAPHY ─────────────────────────────────────
export const REGULATORY_REQUIREMENTS = {
  'EU': { frameworks: ['CSRD/ESRS', 'EU Taxonomy', 'SFDR', 'EU ETS', 'CBAM', 'EU Green Claims'], mandatory: true, effective: '2024-01-01' },
  'GB': { frameworks: ['UK TPT', 'FCA SDR', 'UK ETS', 'TCFD Listing Rule', 'Green Finance Strategy'], mandatory: true, effective: '2023-04-01' },
  'US': { frameworks: ['SEC Climate Rule', 'California SB 253/261', 'NY DFS Climate Guidance'], mandatory: 'partial', effective: '2026-01-01' },
  'SG': { frameworks: ['MAS Environmental Risk', 'SGX Sustainability', 'Singapore Green Plan'], mandatory: true, effective: '2023-01-01' },
  'HK': { frameworks: ['HKEX ESG Guide', 'SFC Climate Risk', 'HKMA Green Classification'], mandatory: true, effective: '2025-01-01' },
  'AU': { frameworks: ['AASB S1/S2', 'ASFI Taxonomy', 'APRA CPG 229', 'Clean Energy Act'], mandatory: true, effective: '2025-01-01' },
  'JP': { frameworks: ['SSBJ Standards', 'JPX ESG Disclosure', 'GX League', 'Japan Taxonomy'], mandatory: true, effective: '2025-04-01' },
  'KR': { frameworks: ['K-ESG', 'K-Taxonomy', 'Korea ETS'], mandatory: true, effective: '2025-01-01' },
  'IN': { frameworks: ['SEBI BRSR', 'BRSR Core', 'RBI Climate Guidance', 'India Green Taxonomy'], mandatory: true, effective: '2023-04-01' },
  'BR': { frameworks: ['ISSB Brazil Adoption', 'BCB ESG Regulation', 'Sustainable Finance Taxonomy'], mandatory: true, effective: '2026-01-01' },
  'CA': { frameworks: ['CSA Climate Disclosure', 'OSFI B-15', 'Canadian Taxonomy'], mandatory: 'partial', effective: '2024-04-01' },
  'ZA': { frameworks: ['JSE Sustainability', 'SARB Climate Risk', 'SA Green Finance Taxonomy'], mandatory: true, effective: '2023-01-01' },
  'CN': { frameworks: ['China Green Bond Principles', 'National ETS', 'CBIRC ESG Guidance', 'Green Industry Catalogue'], mandatory: true, effective: '2021-07-01' },
};

// ─── 4-LEVEL TRANSITION RISK TAXONOMY ───────────────────────────────────────
export const TAXONOMY_TREE = [
  {
    code: 'CE', name: 'Carbon & Emissions', level: 1, weight: 0.15, icon: '🏭',
    description: 'Direct, indirect, and value chain greenhouse gas emissions exposure',
    children: [
      {
        code: 'CE.S1', name: 'Scope 1 — Direct Emissions', level: 2, weight: 0.30,
        dataSources: ['EPA GHGRP', 'EU ETS EUTL', 'CDP'],
        children: [
          { code: 'CE.S1.CO', name: 'Combustion Emissions', level: 3, weight: 0.40, children: [
            { code: 'CE.S1.CO.NG', name: 'Natural Gas Boilers', level: 4, weight: 0.25, dataSources: ['EPA GHGRP'], quality: 2 },
            { code: 'CE.S1.CO.CF', name: 'Coal-Fired Generation', level: 4, weight: 0.30, dataSources: ['WRI GPPD'], quality: 2 },
            { code: 'CE.S1.CO.DG', name: 'Diesel Generators', level: 4, weight: 0.20, dataSources: ['EPA GHGRP'], quality: 3 },
            { code: 'CE.S1.CO.BC', name: 'Biomass CHP', level: 4, weight: 0.25, dataSources: ['IRENA'], quality: 3 },
          ]},
          { code: 'CE.S1.PR', name: 'Process Emissions', level: 3, weight: 0.25, children: [
            { code: 'CE.S1.PR.CM', name: 'Cement Clinker', level: 4, weight: 0.30, dataSources: ['EU ETS EUTL'], quality: 2 },
            { code: 'CE.S1.PR.ST', name: 'Steel BF-BOF', level: 4, weight: 0.30, dataSources: ['EU ETS EUTL'], quality: 2 },
            { code: 'CE.S1.PR.CH', name: 'Chemical Processes', level: 4, weight: 0.20, dataSources: ['EPA GHGRP'], quality: 3 },
            { code: 'CE.S1.PR.RF', name: 'Refinery Operations', level: 4, weight: 0.20, dataSources: ['EPA GHGRP'], quality: 2 },
          ]},
          { code: 'CE.S1.FG', name: 'Fugitive Emissions', level: 3, weight: 0.20, children: [
            { code: 'CE.S1.FG.ML', name: 'Methane Leaks (O&G)', level: 4, weight: 0.40, dataSources: ['OGMP 2.0', 'Climate TRACE'], quality: 3 },
            { code: 'CE.S1.FG.VT', name: 'Venting Operations', level: 4, weight: 0.25, dataSources: ['EPA GHGRP'], quality: 3 },
            { code: 'CE.S1.FG.FL', name: 'Flaring', level: 4, weight: 0.20, dataSources: ['VIIRS/FIRMS'], quality: 2 },
            { code: 'CE.S1.FG.SF', name: 'SF₆ Switchgear', level: 4, weight: 0.15, dataSources: ['IEC reporting'], quality: 4 },
          ]},
          { code: 'CE.S1.FL', name: 'Fleet Emissions', level: 3, weight: 0.15, children: [
            { code: 'CE.S1.FL.HV', name: 'Heavy Vehicles', level: 4, weight: 0.30, dataSources: ['GLEC Framework'], quality: 3 },
            { code: 'CE.S1.FL.LV', name: 'Light Vehicles', level: 4, weight: 0.25, dataSources: ['National registries'], quality: 3 },
            { code: 'CE.S1.FL.MR', name: 'Marine Fleet', level: 4, weight: 0.25, dataSources: ['IMO DCS'], quality: 3 },
            { code: 'CE.S1.FL.AV', name: 'Aviation Fleet', level: 4, weight: 0.20, dataSources: ['ICAO CORSIA'], quality: 2 },
          ]},
        ],
      },
      {
        code: 'CE.S2', name: 'Scope 2 — Energy Indirect', level: 2, weight: 0.20,
        dataSources: ['CDP', 'IEA', 'Grid operators'],
        children: [
          { code: 'CE.S2.EL', name: 'Electricity Consumption', level: 3, weight: 0.50, children: [
            { code: 'CE.S2.EL.GM', name: 'Grid Mix Dependent', level: 4, weight: 0.30, dataSources: ['IEA', 'Ember'], quality: 2 },
            { code: 'CE.S2.EL.PP', name: 'PPA-Covered', level: 4, weight: 0.30, dataSources: ['RE100', 'Company disclosures'], quality: 2 },
            { code: 'CE.S2.EL.RE', name: 'REC/GO Backed', level: 4, weight: 0.20, dataSources: ['EAC registries'], quality: 3 },
            { code: 'CE.S2.EL.OS', name: 'On-site Generation', level: 4, weight: 0.20, dataSources: ['Company reports'], quality: 3 },
          ]},
          { code: 'CE.S2.HT', name: 'Heating & Cooling', level: 3, weight: 0.30, children: [
            { code: 'CE.S2.HT.DH', name: 'District Heating', level: 4, weight: 0.40, dataSources: ['Euroheat'], quality: 3 },
            { code: 'CE.S2.HT.ST', name: 'Steam Purchased', level: 4, weight: 0.35, dataSources: ['Company reports'], quality: 4 },
            { code: 'CE.S2.HT.CL', name: 'Cooling Systems', level: 4, weight: 0.25, dataSources: ['Company reports'], quality: 4 },
          ]},
          { code: 'CE.S2.SS', name: 'Supplier-Specific Factors', level: 3, weight: 0.20, children: [
            { code: 'CE.S2.SS.UT', name: 'Utility Provider Mix', level: 4, weight: 0.60, dataSources: ['Utility disclosures'], quality: 2 },
            { code: 'CE.S2.SS.CF', name: 'Custom Factor Availability', level: 4, weight: 0.40, dataSources: ['Company reports'], quality: 3 },
          ]},
        ],
      },
      {
        code: 'CE.S3', name: 'Scope 3 — Value Chain', level: 2, weight: 0.25,
        dataSources: ['CDP Supply Chain', 'PCAF', 'GHG Protocol'],
        children: [
          { code: 'CE.S3.US', name: 'Upstream (Cat 1-8)', level: 3, weight: 0.40, children: [
            { code: 'CE.S3.US.PG', name: 'Purchased Goods & Services (Cat 1)', level: 4, weight: 0.30, dataSources: ['CDP Supply Chain'], quality: 4 },
            { code: 'CE.S3.US.CG', name: 'Capital Goods (Cat 2)', level: 4, weight: 0.20, dataSources: ['Spend-based'], quality: 4 },
            { code: 'CE.S3.US.FE', name: 'Fuel & Energy Activities (Cat 3)', level: 4, weight: 0.25, dataSources: ['IEA WTW factors'], quality: 3 },
            { code: 'CE.S3.US.TR', name: 'Transport & Distribution (Cat 4)', level: 4, weight: 0.25, dataSources: ['GLEC Framework'], quality: 4 },
          ]},
          { code: 'CE.S3.DS', name: 'Downstream (Cat 9-15)', level: 3, weight: 0.30, children: [
            { code: 'CE.S3.DS.UP', name: 'Use of Sold Products (Cat 11)', level: 4, weight: 0.40, dataSources: ['Product lifecycle'], quality: 4 },
            { code: 'CE.S3.DS.EL', name: 'End-of-Life Treatment (Cat 12)', level: 4, weight: 0.20, dataSources: ['Waste sector data'], quality: 5 },
            { code: 'CE.S3.DS.IN', name: 'Investments (Cat 15)', level: 4, weight: 0.25, dataSources: ['PCAF Standard'], quality: 3 },
            { code: 'CE.S3.DS.FR', name: 'Franchises (Cat 14)', level: 4, weight: 0.15, dataSources: ['Company reports'], quality: 4 },
          ]},
          { code: 'CE.S3.FE', name: 'Financed Emissions', level: 3, weight: 0.30, children: [
            { code: 'CE.S3.FE.LN', name: 'Loans', level: 4, weight: 0.35, dataSources: ['PCAF Class 2'], quality: 3 },
            { code: 'CE.S3.FE.BD', name: 'Bonds', level: 4, weight: 0.25, dataSources: ['PCAF Class 1'], quality: 3 },
            { code: 'CE.S3.FE.EQ', name: 'Equity Holdings', level: 4, weight: 0.25, dataSources: ['PCAF Class 1'], quality: 2 },
            { code: 'CE.S3.FE.PF', name: 'Project Finance', level: 4, weight: 0.15, dataSources: ['PCAF Class 3'], quality: 3 },
          ]},
        ],
      },
      {
        code: 'CE.CP', name: 'Carbon Pricing Exposure', level: 2, weight: 0.15,
        dataSources: ['ICAP', 'World Bank Carbon Pricing Dashboard'],
        children: [
          { code: 'CE.CP.ET', name: 'ETS Exposure', level: 3, weight: 0.50, children: [
            { code: 'CE.CP.ET.EU', name: 'EU ETS', level: 4, weight: 0.35, dataSources: ['EUTL'], quality: 1 },
            { code: 'CE.CP.ET.UK', name: 'UK ETS', level: 4, weight: 0.20, dataSources: ['UK Registry'], quality: 1 },
            { code: 'CE.CP.ET.CN', name: 'China National ETS', level: 4, weight: 0.25, dataSources: ['MEE China'], quality: 3 },
            { code: 'CE.CP.ET.OT', name: 'Other ETS (CA/RGGI/KR)', level: 4, weight: 0.20, dataSources: ['ICAP'], quality: 2 },
          ]},
          { code: 'CE.CP.TX', name: 'Carbon Tax Exposure', level: 3, weight: 0.25, children: [
            { code: 'CE.CP.TX.DR', name: 'Direct Tax Burden', level: 4, weight: 0.60, dataSources: ['National tax authorities'], quality: 2 },
            { code: 'CE.CP.TX.PT', name: 'Pass-Through Cost', level: 4, weight: 0.40, dataSources: ['Sector studies'], quality: 4 },
          ]},
          { code: 'CE.CP.CB', name: 'CBAM Exposure', level: 3, weight: 0.25, children: [
            { code: 'CE.CP.CB.ST', name: 'Steel Imports', level: 4, weight: 0.30, dataSources: ['EU CBAM Registry'], quality: 2 },
            { code: 'CE.CP.CB.CM', name: 'Cement Imports', level: 4, weight: 0.25, dataSources: ['EU CBAM Registry'], quality: 2 },
            { code: 'CE.CP.CB.AL', name: 'Aluminium Imports', level: 4, weight: 0.20, dataSources: ['EU CBAM Registry'], quality: 2 },
            { code: 'CE.CP.CB.FZ', name: 'Fertilizers', level: 4, weight: 0.15, dataSources: ['EU CBAM Registry'], quality: 2 },
            { code: 'CE.CP.CB.HY', name: 'Hydrogen', level: 4, weight: 0.10, dataSources: ['EU CBAM Registry'], quality: 3 },
          ]},
        ],
      },
      {
        code: 'CE.OS', name: 'Offset & Removal Strategy', level: 2, weight: 0.10,
        dataSources: ['Verra', 'Gold Standard', 'ICVCM'],
        children: [
          { code: 'CE.OS.QU', name: 'Offset Quality', level: 3, weight: 0.60, children: [
            { code: 'CE.OS.QU.VC', name: 'Verra VCS Credits', level: 4, weight: 0.35, dataSources: ['Verra Registry'], quality: 2 },
            { code: 'CE.OS.QU.GS', name: 'Gold Standard Credits', level: 4, weight: 0.35, dataSources: ['GS Registry'], quality: 2 },
            { code: 'CE.OS.QU.AD', name: 'Additionality Rating', level: 4, weight: 0.30, dataSources: ['ICVCM CCP'], quality: 3 },
          ]},
          { code: 'CE.OS.PM', name: 'Permanence & Risk', level: 3, weight: 0.40, children: [
            { code: 'CE.OS.PM.NB', name: 'Nature-Based Permanence', level: 4, weight: 0.50, dataSources: ['Buffer pool analysis'], quality: 3 },
            { code: 'CE.OS.PM.TC', name: 'Engineered CDR Permanence', level: 4, weight: 0.50, dataSources: ['Puro, Isometric'], quality: 3 },
          ]},
        ],
      },
    ],
  },
  {
    code: 'ET', name: 'Energy Transition', level: 1, weight: 0.15, icon: '⚡',
    description: 'Readiness and progress in shifting from fossil to clean energy systems',
    children: [
      { code: 'ET.RE', name: 'Renewable Energy Deployment', level: 2, weight: 0.25, children: [
        { code: 'ET.RE.SL', name: 'Solar PV', level: 3, weight: 0.30, children: [
          { code: 'ET.RE.SL.UT', name: 'Utility-Scale Solar', level: 4, weight: 0.40, dataSources: ['IRENA', 'WRI GPPD'], quality: 2 },
          { code: 'ET.RE.SL.RT', name: 'Rooftop/Distributed', level: 4, weight: 0.35, dataSources: ['National registries'], quality: 3 },
          { code: 'ET.RE.SL.CS', name: 'Community Solar', level: 4, weight: 0.25, dataSources: ['NREL'], quality: 3 },
        ]},
        { code: 'ET.RE.WN', name: 'Wind Energy', level: 3, weight: 0.30, children: [
          { code: 'ET.RE.WN.ON', name: 'Onshore Wind', level: 4, weight: 0.50, dataSources: ['IRENA', 'WRI GPPD'], quality: 2 },
          { code: 'ET.RE.WN.OF', name: 'Offshore Wind', level: 4, weight: 0.50, dataSources: ['GWEC'], quality: 2 },
        ]},
        { code: 'ET.RE.ST', name: 'Energy Storage', level: 3, weight: 0.25, children: [
          { code: 'ET.RE.ST.LI', name: 'Lithium-Ion Battery', level: 4, weight: 0.50, dataSources: ['BNEF'], quality: 3 },
          { code: 'ET.RE.ST.PH', name: 'Pumped Hydro', level: 4, weight: 0.25, dataSources: ['IEA'], quality: 2 },
          { code: 'ET.RE.ST.OT', name: 'Other (Flow, CAES, H₂)', level: 4, weight: 0.25, dataSources: ['IEA'], quality: 4 },
        ]},
        { code: 'ET.RE.PP', name: 'PPA & Procurement', level: 3, weight: 0.15, children: [
          { code: 'ET.RE.PP.CP', name: 'Corporate PPAs', level: 4, weight: 0.50, dataSources: ['BNEF', 'RE100'], quality: 2 },
          { code: 'ET.RE.PP.UT', name: 'Utility Green Tariffs', level: 4, weight: 0.30, dataSources: ['Utility programs'], quality: 3 },
          { code: 'ET.RE.PP.RC', name: 'REC/GO Markets', level: 4, weight: 0.20, dataSources: ['APX, M-RETS'], quality: 3 },
        ]},
      ]},
      { code: 'ET.FP', name: 'Fossil Phase-Out', level: 2, weight: 0.25, children: [
        { code: 'ET.FP.CL', name: 'Coal Phase-Out', level: 3, weight: 0.40, children: [
          { code: 'ET.FP.CL.PP', name: 'Power Plant Retirement', level: 4, weight: 0.50, dataSources: ['Global Coal Tracker', 'WRI GPPD'], quality: 2 },
          { code: 'ET.FP.CL.MN', name: 'Mining Wind-Down', level: 4, weight: 0.50, dataSources: ['IEA Coal Report'], quality: 3 },
        ]},
        { code: 'ET.FP.OG', name: 'Oil & Gas Transition', level: 3, weight: 0.35, children: [
          { code: 'ET.FP.OG.EX', name: 'Exploration CapEx Freeze', level: 4, weight: 0.35, dataSources: ['Rystad Energy', 'Company filings'], quality: 2 },
          { code: 'ET.FP.OG.PR', name: 'Production Decline Curve', level: 4, weight: 0.35, dataSources: ['IEA Oil Market Report'], quality: 2 },
          { code: 'ET.FP.OG.RF', name: 'Refinery Conversion', level: 4, weight: 0.30, dataSources: ['Company announcements'], quality: 3 },
        ]},
        { code: 'ET.FP.GS', name: 'Gas Transition', level: 3, weight: 0.25, children: [
          { code: 'ET.FP.GS.LN', name: 'LNG Terminal Decisions', level: 4, weight: 0.50, dataSources: ['IGU World LNG Report'], quality: 2 },
          { code: 'ET.FP.GS.HP', name: 'H₂-Ready Infrastructure', level: 4, weight: 0.50, dataSources: ['Hydrogen Council'], quality: 4 },
        ]},
      ]},
      { code: 'ET.CT', name: 'Clean Transport', level: 2, weight: 0.20, children: [
        { code: 'ET.CT.EV', name: 'Electric Vehicles', level: 3, weight: 0.40, children: [
          { code: 'ET.CT.EV.PS', name: 'Passenger EVs', level: 4, weight: 0.40, dataSources: ['IEA GEVO', 'BNEF'], quality: 2 },
          { code: 'ET.CT.EV.CM', name: 'Commercial EVs', level: 4, weight: 0.30, dataSources: ['CALSTART'], quality: 3 },
          { code: 'ET.CT.EV.CH', name: 'Charging Infrastructure', level: 4, weight: 0.30, dataSources: ['IEA GEVO'], quality: 3 },
        ]},
        { code: 'ET.CT.AV', name: 'Aviation Decarbonisation', level: 3, weight: 0.30, children: [
          { code: 'ET.CT.AV.SA', name: 'Sustainable Aviation Fuel', level: 4, weight: 0.50, dataSources: ['ICAO', 'IATA'], quality: 3 },
          { code: 'ET.CT.AV.CO', name: 'CORSIA Compliance', level: 4, weight: 0.30, dataSources: ['ICAO CORSIA'], quality: 2 },
          { code: 'ET.CT.AV.EL', name: 'Electric/H₂ Aircraft', level: 4, weight: 0.20, dataSources: ['IATA Technology'], quality: 4 },
        ]},
        { code: 'ET.CT.MR', name: 'Maritime Decarbonisation', level: 3, weight: 0.30, children: [
          { code: 'ET.CT.MR.IM', name: 'IMO GHG Strategy', level: 4, weight: 0.40, dataSources: ['IMO MEPC'], quality: 2 },
          { code: 'ET.CT.MR.AF', name: 'Alternative Fuels (NH₃, MeOH)', level: 4, weight: 0.35, dataSources: ['DNV Maritime'], quality: 3 },
          { code: 'ET.CT.MR.EE', name: 'Energy Efficiency (EEDI/EEXI)', level: 4, weight: 0.25, dataSources: ['IMO DCS'], quality: 2 },
        ]},
      ]},
      { code: 'ET.GH', name: 'Green Hydrogen', level: 2, weight: 0.15, children: [
        { code: 'ET.GH.PR', name: 'Production', level: 3, weight: 0.40, children: [
          { code: 'ET.GH.PR.AE', name: 'Alkaline Electrolysis', level: 4, weight: 0.35, dataSources: ['IRENA Green H₂'], quality: 3 },
          { code: 'ET.GH.PR.PE', name: 'PEM Electrolysis', level: 4, weight: 0.35, dataSources: ['Hydrogen Council'], quality: 3 },
          { code: 'ET.GH.PR.SO', name: 'SOEC', level: 4, weight: 0.30, dataSources: ['DOE H2@Scale'], quality: 4 },
        ]},
        { code: 'ET.GH.IF', name: 'Infrastructure', level: 3, weight: 0.30, children: [
          { code: 'ET.GH.IF.PL', name: 'Pipeline Network', level: 4, weight: 0.40, dataSources: ['European Hydrogen Backbone'], quality: 4 },
          { code: 'ET.GH.IF.ST', name: 'Storage (Cavern, Tank)', level: 4, weight: 0.30, dataSources: ['IEA H₂ Report'], quality: 4 },
          { code: 'ET.GH.IF.TM', name: 'Export Terminals', level: 4, weight: 0.30, dataSources: ['IRENA'], quality: 4 },
        ]},
        { code: 'ET.GH.DM', name: 'Demand Sectors', level: 3, weight: 0.30, children: [
          { code: 'ET.GH.DM.ST', name: 'Green Steel (DRI-H₂)', level: 4, weight: 0.30, dataSources: ['Worldsteel'], quality: 3 },
          { code: 'ET.GH.DM.AM', name: 'Green Ammonia', level: 4, weight: 0.25, dataSources: ['IFA'], quality: 3 },
          { code: 'ET.GH.DM.TR', name: 'Transport (Trucks, Ships)', level: 4, weight: 0.25, dataSources: ['Hydrogen Council'], quality: 4 },
          { code: 'ET.GH.DM.PW', name: 'Power (Turbines, Fuel Cells)', level: 4, weight: 0.20, dataSources: ['IEA'], quality: 4 },
        ]},
      ]},
      { code: 'ET.EE', name: 'Energy Efficiency', level: 2, weight: 0.15, children: [
        { code: 'ET.EE.BD', name: 'Building Efficiency', level: 3, weight: 0.40, children: [
          { code: 'ET.EE.BD.RT', name: 'Retrofit Programmes', level: 4, weight: 0.40, dataSources: ['BPIE', 'IEA'], quality: 3 },
          { code: 'ET.EE.BD.NZ', name: 'Nearly-Zero Energy (NZEB)', level: 4, weight: 0.30, dataSources: ['EU EPBD'], quality: 3 },
          { code: 'ET.EE.BD.HP', name: 'Heat Pump Deployment', level: 4, weight: 0.30, dataSources: ['IEA Heat Pumps'], quality: 2 },
        ]},
        { code: 'ET.EE.IN', name: 'Industrial Efficiency', level: 3, weight: 0.35, children: [
          { code: 'ET.EE.IN.WH', name: 'Waste Heat Recovery', level: 4, weight: 0.35, dataSources: ['IEA Industry'], quality: 3 },
          { code: 'ET.EE.IN.CC', name: 'CCS/CCUS', level: 4, weight: 0.35, dataSources: ['Global CCS Institute'], quality: 3 },
          { code: 'ET.EE.IN.EP', name: 'Electrification of Processes', level: 4, weight: 0.30, dataSources: ['IEA'], quality: 4 },
        ]},
        { code: 'ET.EE.DG', name: 'Digitalisation & Smart Grid', level: 3, weight: 0.25, children: [
          { code: 'ET.EE.DG.SM', name: 'Smart Metering', level: 4, weight: 0.35, dataSources: ['Utility reports'], quality: 3 },
          { code: 'ET.EE.DG.DR', name: 'Demand Response', level: 4, weight: 0.35, dataSources: ['IEA Digitalisation'], quality: 3 },
          { code: 'ET.EE.DG.AI', name: 'AI Grid Management', level: 4, weight: 0.30, dataSources: ['Tech company reports'], quality: 4 },
        ]},
      ]},
    ],
  },
  {
    code: 'PR', name: 'Policy & Regulatory', level: 1, weight: 0.15, icon: '⚖️',
    description: 'Exposure to climate policy, regulation, carbon pricing, and disclosure mandates across jurisdictions',
    children: [
      { code: 'PR.CP', name: 'Carbon Pricing Mechanisms', level: 2, weight: 0.30, children: [
        { code: 'PR.CP.ET', name: 'Emissions Trading Systems', level: 3, weight: 0.50, children: [
          { code: 'PR.CP.ET.PH', name: 'EU ETS Phase IV', level: 4, weight: 0.30, dataSources: ['EC DG CLIMA'], quality: 1 },
          { code: 'PR.CP.ET.CN', name: 'China National ETS', level: 4, weight: 0.25, dataSources: ['MEE China'], quality: 3 },
          { code: 'PR.CP.ET.OT', name: 'Other ETS (UK, CA, KR, NZ, JP)', level: 4, weight: 0.25, dataSources: ['ICAP'], quality: 2 },
          { code: 'PR.CP.ET.EM', name: 'Emerging ETS (BR, ID, MX)', level: 4, weight: 0.20, dataSources: ['PMR/World Bank'], quality: 4 },
        ]},
        { code: 'PR.CP.TX', name: 'Carbon Taxes', level: 3, weight: 0.25, children: [
          { code: 'PR.CP.TX.HI', name: 'High-Rate Jurisdictions (SE, CH, NO)', level: 4, weight: 0.40, dataSources: ['OECD'], quality: 1 },
          { code: 'PR.CP.TX.MD', name: 'Medium-Rate (FR, UK)', level: 4, weight: 0.35, dataSources: ['OECD'], quality: 1 },
          { code: 'PR.CP.TX.EM', name: 'Emerging (ZA, CO, CL)', level: 4, weight: 0.25, dataSources: ['World Bank'], quality: 2 },
        ]},
        { code: 'PR.CP.BM', name: 'Border Carbon Adjustments', level: 3, weight: 0.25, children: [
          { code: 'PR.CP.BM.EU', name: 'EU CBAM', level: 4, weight: 0.50, dataSources: ['EU CBAM Registry'], quality: 1 },
          { code: 'PR.CP.BM.UK', name: 'UK CBAM (proposed)', level: 4, weight: 0.25, dataSources: ['UK HMRC'], quality: 4 },
          { code: 'PR.CP.BM.OT', name: 'Other (AU, CA potential)', level: 4, weight: 0.25, dataSources: ['Policy trackers'], quality: 5 },
        ]},
      ]},
      { code: 'PR.DC', name: 'Disclosure & Reporting Mandates', level: 2, weight: 0.30, children: [
        { code: 'PR.DC.EU', name: 'European Mandates', level: 3, weight: 0.30, children: [
          { code: 'PR.DC.EU.CS', name: 'CSRD/ESRS', level: 4, weight: 0.40, dataSources: ['EFRAG'], quality: 1 },
          { code: 'PR.DC.EU.SF', name: 'SFDR RTS', level: 4, weight: 0.30, dataSources: ['ESAs'], quality: 1 },
          { code: 'PR.DC.EU.TX', name: 'EU Taxonomy Reporting', level: 4, weight: 0.30, dataSources: ['Platform on SF'], quality: 1 },
        ]},
        { code: 'PR.DC.GL', name: 'Global Standards', level: 3, weight: 0.30, children: [
          { code: 'PR.DC.GL.IS', name: 'ISSB S1/S2', level: 4, weight: 0.50, dataSources: ['IFRS Foundation'], quality: 1 },
          { code: 'PR.DC.GL.TC', name: 'TCFD (legacy)', level: 4, weight: 0.25, dataSources: ['FSB TCFD'], quality: 1 },
          { code: 'PR.DC.GL.GR', name: 'GRI Standards', level: 4, weight: 0.25, dataSources: ['GRI'], quality: 1 },
        ]},
        { code: 'PR.DC.AP', name: 'Asia-Pacific Mandates', level: 3, weight: 0.20, children: [
          { code: 'PR.DC.AP.IN', name: 'India BRSR', level: 4, weight: 0.25, dataSources: ['SEBI'], quality: 2 },
          { code: 'PR.DC.AP.HK', name: 'HKEX ESG Guide', level: 4, weight: 0.25, dataSources: ['HKEX'], quality: 2 },
          { code: 'PR.DC.AP.JP', name: 'Japan SSBJ', level: 4, weight: 0.25, dataSources: ['SSBJ'], quality: 2 },
          { code: 'PR.DC.AP.SG', name: 'SGX Sustainability', level: 4, weight: 0.25, dataSources: ['SGX RegCo'], quality: 2 },
        ]},
        { code: 'PR.DC.NA', name: 'North America', level: 3, weight: 0.20, children: [
          { code: 'PR.DC.NA.SE', name: 'SEC Climate Rule', level: 4, weight: 0.40, dataSources: ['SEC'], quality: 2 },
          { code: 'PR.DC.NA.CA', name: 'California SB 253/261', level: 4, weight: 0.30, dataSources: ['CARB'], quality: 2 },
          { code: 'PR.DC.NA.CN', name: 'Canada CSA', level: 4, weight: 0.30, dataSources: ['CSA Group'], quality: 3 },
        ]},
      ]},
      { code: 'PR.TX', name: 'Taxonomy & Classification', level: 2, weight: 0.20, children: [
        { code: 'PR.TX.EU', name: 'EU Taxonomy', level: 3, weight: 0.35, children: [
          { code: 'PR.TX.EU.SC', name: 'Substantial Contribution', level: 4, weight: 0.40, dataSources: ['Platform on SF'], quality: 1 },
          { code: 'PR.TX.EU.DN', name: 'DNSH Assessment', level: 4, weight: 0.30, dataSources: ['EU TEG'], quality: 2 },
          { code: 'PR.TX.EU.MS', name: 'Minimum Safeguards', level: 4, weight: 0.30, dataSources: ['OECD Guidelines'], quality: 3 },
        ]},
        { code: 'PR.TX.AS', name: 'ASEAN Taxonomy', level: 3, weight: 0.20, children: [
          { code: 'PR.TX.AS.TL', name: 'Traffic Light Classification', level: 4, weight: 0.60, dataSources: ['ASEAN Taxonomy Board'], quality: 3 },
          { code: 'PR.TX.AS.TR', name: 'Transition Activities', level: 4, weight: 0.40, dataSources: ['ASEAN TB'], quality: 4 },
        ]},
        { code: 'PR.TX.OT', name: 'Other Taxonomies', level: 3, weight: 0.45, children: [
          { code: 'PR.TX.OT.CN', name: 'China Green Catalogue', level: 4, weight: 0.25, dataSources: ['PBoC'], quality: 3 },
          { code: 'PR.TX.OT.SA', name: 'South Africa Green Taxonomy', level: 4, weight: 0.20, dataSources: ['National Treasury SA'], quality: 3 },
          { code: 'PR.TX.OT.CO', name: 'Colombia Taxonomy', level: 4, weight: 0.15, dataSources: ['SFC Colombia'], quality: 4 },
          { code: 'PR.TX.OT.AU', name: 'Australia ASFI Taxonomy', level: 4, weight: 0.20, dataSources: ['ASFI'], quality: 3 },
          { code: 'PR.TX.OT.IN', name: 'India Green Taxonomy (proposed)', level: 4, weight: 0.20, dataSources: ['RBI'], quality: 5 },
        ]},
      ]},
      { code: 'PR.SP', name: 'Sector-Specific Regulation', level: 2, weight: 0.20, children: [
        { code: 'PR.SP.BK', name: 'Banking Regulation', level: 3, weight: 0.30, children: [
          { code: 'PR.SP.BK.EC', name: 'ECB Climate Risk Guide', level: 4, weight: 0.30, dataSources: ['ECB SSM'], quality: 1 },
          { code: 'PR.SP.BK.BO', name: 'BoE SS3/19', level: 4, weight: 0.25, dataSources: ['BoE PRA'], quality: 1 },
          { code: 'PR.SP.BK.AP', name: 'APRA CPG 229', level: 4, weight: 0.20, dataSources: ['APRA'], quality: 1 },
          { code: 'PR.SP.BK.MS', name: 'MAS Environmental Risk', level: 4, weight: 0.25, dataSources: ['MAS'], quality: 2 },
        ]},
        { code: 'PR.SP.IN', name: 'Insurance Regulation', level: 3, weight: 0.25, children: [
          { code: 'PR.SP.IN.EI', name: 'EIOPA Climate Guidance', level: 4, weight: 0.40, dataSources: ['EIOPA'], quality: 2 },
          { code: 'PR.SP.IN.NA', name: 'NAIC Climate Risk Disclosure', level: 4, weight: 0.30, dataSources: ['NAIC'], quality: 2 },
          { code: 'PR.SP.IN.SV', name: 'Solvency II Climate SCR', level: 4, weight: 0.30, dataSources: ['EIOPA'], quality: 2 },
        ]},
        { code: 'PR.SP.BL', name: 'Building & Real Estate', level: 3, weight: 0.25, children: [
          { code: 'PR.SP.BL.EP', name: 'EU EPBD Recast (MEPS)', level: 4, weight: 0.35, dataSources: ['EC DG Energy'], quality: 1 },
          { code: 'PR.SP.BL.UK', name: 'UK MEES', level: 4, weight: 0.30, dataSources: ['MHCLG'], quality: 1 },
          { code: 'PR.SP.BL.US', name: 'US Building Codes (ASHRAE/IECC)', level: 4, weight: 0.35, dataSources: ['DOE'], quality: 2 },
        ]},
        { code: 'PR.SP.TR', name: 'Transport Regulation', level: 3, weight: 0.20, children: [
          { code: 'PR.SP.TR.CO', name: 'ICAO CORSIA', level: 4, weight: 0.35, dataSources: ['ICAO'], quality: 1 },
          { code: 'PR.SP.TR.IM', name: 'IMO GHG Strategy', level: 4, weight: 0.35, dataSources: ['IMO MEPC'], quality: 1 },
          { code: 'PR.SP.TR.EU', name: 'EU CO₂ Fleet Standards', level: 4, weight: 0.30, dataSources: ['EC DG CLIMA'], quality: 1 },
        ]},
      ]},
    ],
  },
  {
    code: 'TD', name: 'Technology Disruption', level: 1, weight: 0.12, icon: '🔬',
    description: 'Exposure to and readiness for technology-driven transition disruption',
    children: [
      { code: 'TD.RE', name: 'Renewable Technology Cost', level: 2, weight: 0.30, children: [
        { code: 'TD.RE.LC', name: 'LCOE Trajectories', level: 3, weight: 0.60, children: [
          { code: 'TD.RE.LC.SP', name: 'Solar PV Learning Curve', level: 4, weight: 0.35, dataSources: ['IRENA', 'BNEF'], quality: 2 },
          { code: 'TD.RE.LC.WD', name: 'Wind Learning Curve', level: 4, weight: 0.35, dataSources: ['IRENA', 'BNEF'], quality: 2 },
          { code: 'TD.RE.LC.BT', name: 'Battery Cost Curve', level: 4, weight: 0.30, dataSources: ['BNEF LCOE Survey'], quality: 2 },
        ]},
        { code: 'TD.RE.CR', name: 'Crossover Points', level: 3, weight: 0.40, children: [
          { code: 'TD.RE.CR.EV', name: 'EV vs ICE Parity', level: 4, weight: 0.35, dataSources: ['BNEF EV Outlook'], quality: 3 },
          { code: 'TD.RE.CR.H2', name: 'Green vs Gray H₂ Parity', level: 4, weight: 0.35, dataSources: ['Hydrogen Council'], quality: 3 },
          { code: 'TD.RE.CR.HP', name: 'Heat Pump vs Gas Boiler', level: 4, weight: 0.30, dataSources: ['IEA'], quality: 3 },
        ]},
      ]},
      { code: 'TD.PT', name: 'Patent & Innovation', level: 2, weight: 0.20, children: [
        { code: 'TD.PT.CL', name: 'Clean Tech Patents', level: 3, weight: 0.50, children: [
          { code: 'TD.PT.CL.EN', name: 'Energy Patents', level: 4, weight: 0.40, dataSources: ['EPO/IEA PATSTAT'], quality: 2 },
          { code: 'TD.PT.CL.TR', name: 'Transport Patents', level: 4, weight: 0.30, dataSources: ['EPO/USPTO'], quality: 2 },
          { code: 'TD.PT.CL.IN', name: 'Industrial Process Patents', level: 4, weight: 0.30, dataSources: ['WIPO'], quality: 3 },
        ]},
        { code: 'TD.PT.VC', name: 'VC/PE Clean Tech Investment', level: 3, weight: 0.50, children: [
          { code: 'TD.PT.VC.EN', name: 'Energy Tech VC', level: 4, weight: 0.35, dataSources: ['PitchBook', 'Crunchbase'], quality: 3 },
          { code: 'TD.PT.VC.MO', name: 'Mobility Tech VC', level: 4, weight: 0.35, dataSources: ['PitchBook'], quality: 3 },
          { code: 'TD.PT.VC.AG', name: 'AgTech/FoodTech VC', level: 4, weight: 0.30, dataSources: ['AgFunder'], quality: 3 },
        ]},
      ]},
      { code: 'TD.NE', name: 'Negative Emissions Technology', level: 2, weight: 0.20, children: [
        { code: 'TD.NE.DA', name: 'Direct Air Capture', level: 3, weight: 0.40, children: [
          { code: 'TD.NE.DA.ST', name: 'Solid Sorbent DAC', level: 4, weight: 0.50, dataSources: ['IEA CCUS'], quality: 3 },
          { code: 'TD.NE.DA.LQ', name: 'Liquid Solvent DAC', level: 4, weight: 0.50, dataSources: ['IEA CCUS'], quality: 3 },
        ]},
        { code: 'TD.NE.BC', name: 'BiCRS & BECCS', level: 3, weight: 0.30, children: [
          { code: 'TD.NE.BC.BE', name: 'BECCS Projects', level: 4, weight: 0.50, dataSources: ['Global CCS Institute'], quality: 3 },
          { code: 'TD.NE.BC.BI', name: 'Biochar Sequestration', level: 4, weight: 0.50, dataSources: ['Puro.earth'], quality: 3 },
        ]},
        { code: 'TD.NE.EW', name: 'Enhanced Weathering', level: 3, weight: 0.30, children: [
          { code: 'TD.NE.EW.BS', name: 'Basalt Spreading', level: 4, weight: 0.50, dataSources: ['Academic research'], quality: 4 },
          { code: 'TD.NE.EW.OA', name: 'Ocean Alkalinity', level: 4, weight: 0.50, dataSources: ['Academic research'], quality: 5 },
        ]},
      ]},
      { code: 'TD.SM', name: 'Supply Chain & Materials', level: 2, weight: 0.15, children: [
        { code: 'TD.SM.CM', name: 'Critical Minerals', level: 3, weight: 0.50, children: [
          { code: 'TD.SM.CM.LI', name: 'Lithium Supply', level: 4, weight: 0.25, dataSources: ['USGS', 'S&P Global'], quality: 2 },
          { code: 'TD.SM.CM.CO', name: 'Cobalt Supply', level: 4, weight: 0.25, dataSources: ['USGS', 'CRU'], quality: 2 },
          { code: 'TD.SM.CM.RE', name: 'Rare Earth Elements', level: 4, weight: 0.25, dataSources: ['USGS', 'Adamas'], quality: 3 },
          { code: 'TD.SM.CM.CU', name: 'Copper Supply', level: 4, weight: 0.25, dataSources: ['ICSG'], quality: 2 },
        ]},
        { code: 'TD.SM.RC', name: 'Circular Economy & Recycling', level: 3, weight: 0.50, children: [
          { code: 'TD.SM.RC.BR', name: 'Battery Recycling', level: 4, weight: 0.40, dataSources: ['EU Battery Regulation'], quality: 3 },
          { code: 'TD.SM.RC.SM', name: 'Steel/Metal Recycling', level: 4, weight: 0.30, dataSources: ['BIR'], quality: 3 },
          { code: 'TD.SM.RC.PL', name: 'Plastic Recycling', level: 4, weight: 0.30, dataSources: ['PlasticsEurope'], quality: 3 },
        ]},
      ]},
      { code: 'TD.NR', name: 'Nuclear Renaissance', level: 2, weight: 0.15, children: [
        { code: 'TD.NR.SM', name: 'SMR Development', level: 3, weight: 0.50, children: [
          { code: 'TD.NR.SM.NS', name: 'NuScale VOYGR', level: 4, weight: 0.25, dataSources: ['NRC', 'WNA'], quality: 3 },
          { code: 'TD.NR.SM.GE', name: 'GE-Hitachi BWRX-300', level: 4, weight: 0.25, dataSources: ['CNSC'], quality: 3 },
          { code: 'TD.NR.SM.RR', name: 'Rolls-Royce SMR', level: 4, weight: 0.25, dataSources: ['ONR'], quality: 3 },
          { code: 'TD.NR.SM.OT', name: 'Other (Xe-100, Natrium)', level: 4, weight: 0.25, dataSources: ['NRC'], quality: 4 },
        ]},
        { code: 'TD.NR.LR', name: 'Large Reactor Life Extension', level: 3, weight: 0.30, children: [
          { code: 'TD.NR.LR.LE', name: 'License Extensions (60→80yr)', level: 4, weight: 0.50, dataSources: ['NRC, ASN'], quality: 2 },
          { code: 'TD.NR.LR.NB', name: 'New Build (AP1000, EPR)', level: 4, weight: 0.50, dataSources: ['WNA'], quality: 2 },
        ]},
        { code: 'TD.NR.FU', name: 'Fusion', level: 3, weight: 0.20, children: [
          { code: 'TD.NR.FU.IT', name: 'ITER Progress', level: 4, weight: 0.50, dataSources: ['ITER Organization'], quality: 3 },
          { code: 'TD.NR.FU.PV', name: 'Private Ventures (CFS, TAE)', level: 4, weight: 0.50, dataSources: ['FIA'], quality: 4 },
        ]},
      ]},
    ],
  },
  {
    code: 'PC', name: 'Physical Climate Risk', level: 1, weight: 0.13, icon: '🌊',
    description: 'Acute and chronic physical climate hazard exposure and adaptive capacity',
    children: [
      { code: 'PC.AC', name: 'Acute Physical Risk', level: 2, weight: 0.50, children: [
        { code: 'PC.AC.TC', name: 'Tropical Cyclone', level: 3, weight: 0.25, children: [
          { code: 'PC.AC.TC.WS', name: 'Wind Speed Intensity', level: 4, weight: 0.50, dataSources: ['IBTrACS', 'IPCC AR6'], quality: 2 },
          { code: 'PC.AC.TC.SS', name: 'Storm Surge Height', level: 4, weight: 0.50, dataSources: ['NOAA SLOSH'], quality: 2 },
        ]},
        { code: 'PC.AC.FL', name: 'Flood', level: 3, weight: 0.25, children: [
          { code: 'PC.AC.FL.RV', name: 'River Flood', level: 4, weight: 0.40, dataSources: ['JRC Global Flood'], quality: 2 },
          { code: 'PC.AC.FL.CS', name: 'Coastal Flood', level: 4, weight: 0.35, dataSources: ['JRC', 'Climate Central'], quality: 2 },
          { code: 'PC.AC.FL.PL', name: 'Pluvial/Flash Flood', level: 4, weight: 0.25, dataSources: ['ERA5 Reanalysis'], quality: 3 },
        ]},
        { code: 'PC.AC.WF', name: 'Wildfire', level: 3, weight: 0.20, children: [
          { code: 'PC.AC.WF.FW', name: 'Fire Weather Index', level: 4, weight: 0.50, dataSources: ['FIRMS/NASA', 'EFFIS'], quality: 2 },
          { code: 'PC.AC.WF.WU', name: 'WUI (Wildland-Urban Interface)', level: 4, weight: 0.50, dataSources: ['USFS', 'SILVIS Lab'], quality: 3 },
        ]},
        { code: 'PC.AC.SC', name: 'Severe Convective Storm', level: 3, weight: 0.15, children: [
          { code: 'PC.AC.SC.HL', name: 'Hailstorm', level: 4, weight: 0.50, dataSources: ['NOAA Storm Events'], quality: 3 },
          { code: 'PC.AC.SC.TN', name: 'Tornado', level: 4, weight: 0.50, dataSources: ['NOAA SPC'], quality: 2 },
        ]},
        { code: 'PC.AC.WS', name: 'Winter Storm', level: 3, weight: 0.15, children: [
          { code: 'PC.AC.WS.BZ', name: 'Blizzard/Ice Storm', level: 4, weight: 0.50, dataSources: ['ECMWF ERA5'], quality: 3 },
          { code: 'PC.AC.WS.FZ', name: 'Freeze Events', level: 4, weight: 0.50, dataSources: ['National Met Services'], quality: 3 },
        ]},
      ]},
      { code: 'PC.CH', name: 'Chronic Physical Risk', level: 2, weight: 0.30, children: [
        { code: 'PC.CH.SL', name: 'Sea Level Rise', level: 3, weight: 0.30, children: [
          { code: 'PC.CH.SL.GL', name: 'Global Mean SLR', level: 4, weight: 0.50, dataSources: ['IPCC AR6 WGI'], quality: 1 },
          { code: 'PC.CH.SL.LC', name: 'Local Relative SLR', level: 4, weight: 0.50, dataSources: ['NOAA Tides'], quality: 2 },
        ]},
        { code: 'PC.CH.HT', name: 'Extreme Heat', level: 3, weight: 0.30, children: [
          { code: 'PC.CH.HT.WB', name: 'WBGT Heat Stress', level: 4, weight: 0.50, dataSources: ['ERA5', 'ISO 7933'], quality: 2 },
          { code: 'PC.CH.HT.UH', name: 'Urban Heat Island', level: 4, weight: 0.50, dataSources: ['Satellite LST'], quality: 3 },
        ]},
        { code: 'PC.CH.DR', name: 'Drought', level: 3, weight: 0.25, children: [
          { code: 'PC.CH.DR.AG', name: 'Agricultural Drought', level: 4, weight: 0.40, dataSources: ['SPEI/PDSI'], quality: 2 },
          { code: 'PC.CH.DR.HY', name: 'Hydrological Drought', level: 4, weight: 0.35, dataSources: ['GRACE satellite'], quality: 2 },
          { code: 'PC.CH.DR.SC', name: 'Socioeconomic Water Scarcity', level: 4, weight: 0.25, dataSources: ['WRI Aqueduct'], quality: 2 },
        ]},
        { code: 'PC.CH.PP', name: 'Precipitation Change', level: 3, weight: 0.15, children: [
          { code: 'PC.CH.PP.IN', name: 'Increased Intensity', level: 4, weight: 0.50, dataSources: ['CMIP6 Projections'], quality: 3 },
          { code: 'PC.CH.PP.PT', name: 'Pattern Shifts', level: 4, weight: 0.50, dataSources: ['CMIP6'], quality: 3 },
        ]},
      ]},
      { code: 'PC.AD', name: 'Adaptive Capacity', level: 2, weight: 0.20, children: [
        { code: 'PC.AD.IF', name: 'Infrastructure Resilience', level: 3, weight: 0.40, children: [
          { code: 'PC.AD.IF.FD', name: 'Flood Defences', level: 4, weight: 0.35, dataSources: ['National flood agencies'], quality: 3 },
          { code: 'PC.AD.IF.GR', name: 'Grid Resilience', level: 4, weight: 0.35, dataSources: ['Utility reports'], quality: 3 },
          { code: 'PC.AD.IF.BD', name: 'Building Codes', level: 4, weight: 0.30, dataSources: ['ICC, Eurocode'], quality: 2 },
        ]},
        { code: 'PC.AD.IN', name: 'Insurance & Transfer', level: 3, weight: 0.35, children: [
          { code: 'PC.AD.IN.CV', name: 'Insurance Coverage Ratio', level: 4, weight: 0.50, dataSources: ['Swiss Re sigma'], quality: 2 },
          { code: 'PC.AD.IN.PR', name: 'Parametric Insurance', level: 4, weight: 0.50, dataSources: ['CCRIF, ARC, PCRIC'], quality: 3 },
        ]},
        { code: 'PC.AD.EW', name: 'Early Warning Systems', level: 3, weight: 0.25, children: [
          { code: 'PC.AD.EW.MT', name: 'Meteorological Warning', level: 4, weight: 0.50, dataSources: ['WMO'], quality: 2 },
          { code: 'PC.AD.EW.CM', name: 'Community Preparedness', level: 4, weight: 0.50, dataSources: ['UNDRR'], quality: 4 },
        ]},
      ]},
    ],
  },
  {
    code: 'NB', name: 'Nature & Biodiversity', level: 1, weight: 0.10, icon: '🌿',
    description: 'Dependencies and impacts on natural capital, ecosystems, and biodiversity',
    children: [
      { code: 'NB.TN', name: 'TNFD Alignment', level: 2, weight: 0.30, children: [
        { code: 'NB.TN.LE', name: 'LEAP Assessment', level: 3, weight: 0.50, children: [
          { code: 'NB.TN.LE.LC', name: 'Locate (Interface with Nature)', level: 4, weight: 0.25, dataSources: ['IBAT', 'ENCORE'], quality: 3 },
          { code: 'NB.TN.LE.EV', name: 'Evaluate (Dependencies & Impacts)', level: 4, weight: 0.25, dataSources: ['ENCORE'], quality: 3 },
          { code: 'NB.TN.LE.AS', name: 'Assess (Material Risks & Opps)', level: 4, weight: 0.25, dataSources: ['TNFD v1.0'], quality: 3 },
          { code: 'NB.TN.LE.PR', name: 'Prepare (Respond & Report)', level: 4, weight: 0.25, dataSources: ['TNFD v1.0'], quality: 3 },
        ]},
        { code: 'NB.TN.DC', name: 'TNFD Disclosures', level: 3, weight: 0.50, children: [
          { code: 'NB.TN.DC.GV', name: 'Governance', level: 4, weight: 0.25, dataSources: ['TNFD Recommended Disclosures'], quality: 3 },
          { code: 'NB.TN.DC.ST', name: 'Strategy', level: 4, weight: 0.25, dataSources: ['TNFD'], quality: 3 },
          { code: 'NB.TN.DC.RM', name: 'Risk Management', level: 4, weight: 0.25, dataSources: ['TNFD'], quality: 3 },
          { code: 'NB.TN.DC.MT', name: 'Metrics & Targets', level: 4, weight: 0.25, dataSources: ['TNFD'], quality: 3 },
        ]},
      ]},
      { code: 'NB.BD', name: 'Biodiversity Impact', level: 2, weight: 0.25, children: [
        { code: 'NB.BD.DF', name: 'Deforestation', level: 3, weight: 0.40, children: [
          { code: 'NB.BD.DF.TC', name: 'Tree Cover Loss', level: 4, weight: 0.50, dataSources: ['Hansen/GFW'], quality: 2 },
          { code: 'NB.BD.DF.EU', name: 'EUDR Compliance', level: 4, weight: 0.50, dataSources: ['EU EUDR Registry'], quality: 2 },
        ]},
        { code: 'NB.BD.SP', name: 'Species Impact', level: 3, weight: 0.30, children: [
          { code: 'NB.BD.SP.IU', name: 'IUCN Red List Proximity', level: 4, weight: 0.50, dataSources: ['IUCN Red List'], quality: 2 },
          { code: 'NB.BD.SP.KP', name: 'Key Biodiversity Areas', level: 4, weight: 0.50, dataSources: ['KBA Partnership'], quality: 2 },
        ]},
        { code: 'NB.BD.EC', name: 'Ecosystem Degradation', level: 3, weight: 0.30, children: [
          { code: 'NB.BD.EC.SL', name: 'Soil Degradation', level: 4, weight: 0.35, dataSources: ['FAO GLADA'], quality: 3 },
          { code: 'NB.BD.EC.WQ', name: 'Water Quality', level: 4, weight: 0.35, dataSources: ['UN Water'], quality: 3 },
          { code: 'NB.BD.EC.AQ', name: 'Air Quality', level: 4, weight: 0.30, dataSources: ['WHO'], quality: 2 },
        ]},
      ]},
      { code: 'NB.WR', name: 'Water Risk', level: 2, weight: 0.25, children: [
        { code: 'NB.WR.SC', name: 'Water Scarcity', level: 3, weight: 0.40, children: [
          { code: 'NB.WR.SC.BS', name: 'Baseline Water Stress', level: 4, weight: 0.50, dataSources: ['WRI Aqueduct'], quality: 2 },
          { code: 'NB.WR.SC.FU', name: 'Future Water Stress (2030/2040)', level: 4, weight: 0.50, dataSources: ['WRI Aqueduct Projections'], quality: 3 },
        ]},
        { code: 'NB.WR.FL', name: 'Water Pollution', level: 3, weight: 0.30, children: [
          { code: 'NB.WR.FL.EU', name: 'Eutrophication Risk', level: 4, weight: 0.50, dataSources: ['GEMStat'], quality: 3 },
          { code: 'NB.WR.FL.CT', name: 'Chemical Contamination', level: 4, weight: 0.50, dataSources: ['E-PRTR'], quality: 3 },
        ]},
        { code: 'NB.WR.RG', name: 'Water Regulation', level: 3, weight: 0.30, children: [
          { code: 'NB.WR.RG.WF', name: 'EU Water Framework Directive', level: 4, weight: 0.50, dataSources: ['EEA'], quality: 2 },
          { code: 'NB.WR.RG.CW', name: 'Clean Water Act (US)', level: 4, weight: 0.50, dataSources: ['EPA'], quality: 2 },
        ]},
      ]},
      { code: 'NB.NC', name: 'Natural Capital Accounting', level: 2, weight: 0.20, children: [
        { code: 'NB.NC.ES', name: 'Ecosystem Services Valuation', level: 3, weight: 0.50, children: [
          { code: 'NB.NC.ES.PV', name: 'Provisioning Services', level: 4, weight: 0.30, dataSources: ['Costanza et al.'], quality: 3 },
          { code: 'NB.NC.ES.RG', name: 'Regulating Services', level: 4, weight: 0.40, dataSources: ['TEEB'], quality: 3 },
          { code: 'NB.NC.ES.CL', name: 'Cultural Services', level: 4, weight: 0.30, dataSources: ['IPBES'], quality: 4 },
        ]},
        { code: 'NB.NC.SB', name: 'Science-Based Targets for Nature', level: 3, weight: 0.50, children: [
          { code: 'NB.NC.SB.SN', name: 'SBTN Framework', level: 4, weight: 0.50, dataSources: ['SBTN'], quality: 3 },
          { code: 'NB.NC.SB.30', name: 'CBD 30×30 Alignment', level: 4, weight: 0.50, dataSources: ['CBD Secretariat'], quality: 3 },
        ]},
      ]},
    ],
  },
  {
    code: 'SJ', name: 'Social & Just Transition', level: 1, weight: 0.10, icon: '🤝',
    description: 'Workforce transition, community impacts, human rights, and equitable access to clean economy benefits',
    children: [
      { code: 'SJ.WF', name: 'Workforce Transition', level: 2, weight: 0.30, children: [
        { code: 'SJ.WF.RS', name: 'Reskilling Programmes', level: 3, weight: 0.40, children: [
          { code: 'SJ.WF.RS.EN', name: 'Enrolled Workers', level: 4, weight: 0.30, dataSources: ['ILO', 'Company reports'], quality: 3 },
          { code: 'SJ.WF.RS.CP', name: 'Completion Rate', level: 4, weight: 0.30, dataSources: ['Programme data'], quality: 3 },
          { code: 'SJ.WF.RS.JP', name: 'Job Placement Rate', level: 4, weight: 0.40, dataSources: ['Programme data'], quality: 3 },
        ]},
        { code: 'SJ.WF.GJ', name: 'Green Jobs Creation', level: 3, weight: 0.35, children: [
          { code: 'SJ.WF.GJ.RE', name: 'Renewable Energy Jobs', level: 4, weight: 0.35, dataSources: ['IRENA Jobs Review'], quality: 2 },
          { code: 'SJ.WF.GJ.EE', name: 'Energy Efficiency Jobs', level: 4, weight: 0.25, dataSources: ['IEA'], quality: 3 },
          { code: 'SJ.WF.GJ.EV', name: 'EV Manufacturing Jobs', level: 4, weight: 0.25, dataSources: ['National statistics'], quality: 3 },
          { code: 'SJ.WF.GJ.NR', name: 'Nature Restoration Jobs', level: 4, weight: 0.15, dataSources: ['UNEP'], quality: 4 },
        ]},
        { code: 'SJ.WF.WG', name: 'Wage & Benefits', level: 3, weight: 0.25, children: [
          { code: 'SJ.WF.WG.GP', name: 'Green vs Fossil Wage Gap', level: 4, weight: 0.50, dataSources: ['BLS', 'Eurostat'], quality: 3 },
          { code: 'SJ.WF.WG.BN', name: 'Benefits & Pension Transfer', level: 4, weight: 0.50, dataSources: ['ILO'], quality: 4 },
        ]},
      ]},
      { code: 'SJ.CM', name: 'Community Impact', level: 2, weight: 0.25, children: [
        { code: 'SJ.CM.CB', name: 'Community Benefit Agreements', level: 3, weight: 0.40, children: [
          { code: 'SJ.CM.CB.PM', name: 'Promised Benefits', level: 4, weight: 0.50, dataSources: ['Company reports', 'EIA'], quality: 3 },
          { code: 'SJ.CM.CB.DL', name: 'Delivered Benefits', level: 4, weight: 0.50, dataSources: ['Monitoring reports'], quality: 4 },
        ]},
        { code: 'SJ.CM.FP', name: 'FPIC & Indigenous Rights', level: 3, weight: 0.35, children: [
          { code: 'SJ.CM.FP.ST', name: 'Consent Status', level: 4, weight: 0.40, dataSources: ['UNDRIP monitoring'], quality: 3 },
          { code: 'SJ.CM.FP.CH', name: 'Cultural Heritage Impact', level: 4, weight: 0.30, dataSources: ['UNESCO'], quality: 4 },
          { code: 'SJ.CM.FP.BS', name: 'Benefit Sharing Adequacy', level: 4, weight: 0.30, dataSources: ['IFC PS7'], quality: 4 },
        ]},
        { code: 'SJ.CM.SL', name: 'Social License to Operate', level: 3, weight: 0.25, children: [
          { code: 'SJ.CM.SL.PR', name: 'Protest/Opposition Risk', level: 4, weight: 0.50, dataSources: ['ACLED', 'media monitoring'], quality: 3 },
          { code: 'SJ.CM.SL.LT', name: 'Litigation Risk', level: 4, weight: 0.50, dataSources: ['Sabin Center Climate Litigation DB'], quality: 2 },
        ]},
      ]},
      { code: 'SJ.EQ', name: 'Equity & Access', level: 2, weight: 0.25, children: [
        { code: 'SJ.EQ.EP', name: 'Energy Poverty', level: 3, weight: 0.50, children: [
          { code: 'SJ.EQ.EP.AC', name: 'Electrification Access Rate', level: 4, weight: 0.50, dataSources: ['World Bank/IEA'], quality: 2 },
          { code: 'SJ.EQ.EP.AF', name: 'Energy Affordability', level: 4, weight: 0.50, dataSources: ['Eurostat', 'National stats'], quality: 3 },
        ]},
        { code: 'SJ.EQ.GN', name: 'Gender & Inclusion', level: 3, weight: 0.50, children: [
          { code: 'SJ.EQ.GN.WF', name: 'Women in Clean Energy', level: 4, weight: 0.50, dataSources: ['IRENA Gender'], quality: 3 },
          { code: 'SJ.EQ.GN.IN', name: 'Inclusive Finance Access', level: 4, weight: 0.50, dataSources: ['World Bank Findex'], quality: 3 },
        ]},
      ]},
      { code: 'SJ.FN', name: 'Just Transition Finance', level: 2, weight: 0.20, children: [
        { code: 'SJ.FN.PB', name: 'Public Finance', level: 3, weight: 0.50, children: [
          { code: 'SJ.FN.PB.JT', name: 'EU Just Transition Fund', level: 4, weight: 0.35, dataSources: ['EC Cohesion'], quality: 1 },
          { code: 'SJ.FN.PB.JP', name: 'JETP Commitments', level: 4, weight: 0.35, dataSources: ['JETP Secretariats'], quality: 2 },
          { code: 'SJ.FN.PB.NF', name: 'National JT Funds', level: 4, weight: 0.30, dataSources: ['National budgets'], quality: 3 },
        ]},
        { code: 'SJ.FN.PV', name: 'Private Finance', level: 3, weight: 0.50, children: [
          { code: 'SJ.FN.PV.JB', name: 'JT Sovereign Bonds', level: 4, weight: 0.40, dataSources: ['CBI'], quality: 3 },
          { code: 'SJ.FN.PV.IM', name: 'Impact Investment', level: 4, weight: 0.30, dataSources: ['GIIN'], quality: 3 },
          { code: 'SJ.FN.PV.BF', name: 'Blended Finance for JT', level: 4, weight: 0.30, dataSources: ['Convergence'], quality: 4 },
        ]},
      ]},
    ],
  },
  {
    code: 'GS', name: 'Governance & Strategy', level: 1, weight: 0.12, icon: '🏛️',
    description: 'Board oversight, strategic planning, target-setting, and stakeholder engagement for climate transition',
    children: [
      { code: 'GS.BD', name: 'Board & Executive Governance', level: 2, weight: 0.30, children: [
        { code: 'GS.BD.OV', name: 'Board Oversight', level: 3, weight: 0.40, children: [
          { code: 'GS.BD.OV.CC', name: 'Climate Committee Existence', level: 4, weight: 0.30, dataSources: ['Proxy statements'], quality: 2 },
          { code: 'GS.BD.OV.EX', name: 'Climate Expertise on Board', level: 4, weight: 0.35, dataSources: ['Director bios'], quality: 3 },
          { code: 'GS.BD.OV.FR', name: 'Meeting Frequency', level: 4, weight: 0.35, dataSources: ['Annual reports'], quality: 2 },
        ]},
        { code: 'GS.BD.CM', name: 'Executive Compensation', level: 3, weight: 0.35, children: [
          { code: 'GS.BD.CM.LK', name: 'Climate KPI Linkage', level: 4, weight: 0.50, dataSources: ['Proxy statements'], quality: 2 },
          { code: 'GS.BD.CM.WT', name: 'Climate Weighting in Comp', level: 4, weight: 0.50, dataSources: ['Proxy statements'], quality: 2 },
        ]},
        { code: 'GS.BD.RS', name: 'Risk Management Integration', level: 3, weight: 0.25, children: [
          { code: 'GS.BD.RS.ER', name: 'ERM Climate Integration', level: 4, weight: 0.50, dataSources: ['Annual reports'], quality: 3 },
          { code: 'GS.BD.RS.RA', name: 'Risk Appetite Statement', level: 4, weight: 0.50, dataSources: ['Pillar 3 disclosures'], quality: 3 },
        ]},
      ]},
      { code: 'GS.TP', name: 'Transition Planning', level: 2, weight: 0.30, children: [
        { code: 'GS.TP.SB', name: 'Science-Based Targets', level: 3, weight: 0.40, children: [
          { code: 'GS.TP.SB.VS', name: 'SBTi Validation Status', level: 4, weight: 0.30, dataSources: ['SBTi Database'], quality: 1 },
          { code: 'GS.TP.SB.AM', name: 'Target Ambition (1.5/WB2/2°C)', level: 4, weight: 0.35, dataSources: ['SBTi Database'], quality: 1 },
          { code: 'GS.TP.SB.S3', name: 'Scope 3 Coverage', level: 4, weight: 0.35, dataSources: ['SBTi, CDP'], quality: 2 },
        ]},
        { code: 'GS.TP.TP', name: 'TPT Framework', level: 3, weight: 0.30, children: [
          { code: 'GS.TP.TP.AM', name: 'Ambition Element', level: 4, weight: 0.25, dataSources: ['UK TPT'], quality: 3 },
          { code: 'GS.TP.TP.AC', name: 'Action Element', level: 4, weight: 0.25, dataSources: ['UK TPT'], quality: 3 },
          { code: 'GS.TP.TP.AY', name: 'Accountability Element', level: 4, weight: 0.25, dataSources: ['UK TPT'], quality: 3 },
          { code: 'GS.TP.TP.GV', name: 'Governance Element', level: 4, weight: 0.25, dataSources: ['UK TPT'], quality: 3 },
        ]},
        { code: 'GS.TP.CR', name: 'Credibility Assessment', level: 3, weight: 0.30, children: [
          { code: 'GS.TP.CR.CX', name: 'CapEx Alignment', level: 4, weight: 0.30, dataSources: ['Financial statements'], quality: 2 },
          { code: 'GS.TP.CR.LB', name: 'Lobbying Consistency', level: 4, weight: 0.25, dataSources: ['InfluenceMap'], quality: 2 },
          { code: 'GS.TP.CR.SD', name: 'Say-Do Gap', level: 4, weight: 0.25, dataSources: ['Proprietary analysis'], quality: 3 },
          { code: 'GS.TP.CR.OD', name: 'Offset Dependency', level: 4, weight: 0.20, dataSources: ['CDP, Company reports'], quality: 3 },
        ]},
      ]},
      { code: 'GS.EN', name: 'Stakeholder Engagement', level: 2, weight: 0.20, children: [
        { code: 'GS.EN.ST', name: 'Stewardship Activities', level: 3, weight: 0.50, children: [
          { code: 'GS.EN.ST.EG', name: 'Engagement Quality', level: 4, weight: 0.40, dataSources: ['Stewardship reports'], quality: 3 },
          { code: 'GS.EN.ST.VT', name: 'Climate Voting Record', level: 4, weight: 0.30, dataSources: ['Proxy voting records'], quality: 2 },
          { code: 'GS.EN.ST.CL', name: 'Collaborative Initiatives', level: 4, weight: 0.30, dataSources: ['CA100+, IIGCC, AIGCC'], quality: 2 },
        ]},
        { code: 'GS.EN.DS', name: 'Disclosure Quality', level: 3, weight: 0.50, children: [
          { code: 'GS.EN.DS.TC', name: 'TCFD Alignment', level: 4, weight: 0.30, dataSources: ['TCFD Status Report'], quality: 2 },
          { code: 'GS.EN.DS.CD', name: 'CDP Score', level: 4, weight: 0.30, dataSources: ['CDP'], quality: 1 },
          { code: 'GS.EN.DS.AS', name: 'Third-Party Assurance', level: 4, weight: 0.20, dataSources: ['Assurance reports'], quality: 2 },
          { code: 'GS.EN.DS.DQ', name: 'Data Quality & Completeness', level: 4, weight: 0.20, dataSources: ['Proprietary DQ score'], quality: 3 },
        ]},
      ]},
      { code: 'GS.GP', name: 'Geopolitical Overlay', level: 2, weight: 0.20, children: [
        { code: 'GS.GP.PS', name: 'Political Stability', level: 3, weight: 0.35, children: [
          { code: 'GS.GP.PS.WG', name: 'WGI Political Stability', level: 4, weight: 0.50, dataSources: ['World Bank WGI'], quality: 1 },
          { code: 'GS.GP.PS.RC', name: 'Regime Change Probability', level: 4, weight: 0.50, dataSources: ['EIU', 'V-Dem'], quality: 3 },
        ]},
        { code: 'GS.GP.SN', name: 'Sanctions & Trade', level: 3, weight: 0.35, children: [
          { code: 'GS.GP.SN.OF', name: 'OFAC SDN Exposure', level: 4, weight: 0.25, dataSources: ['US Treasury'], quality: 1 },
          { code: 'GS.GP.SN.EU', name: 'EU Sanctions Exposure', level: 4, weight: 0.25, dataSources: ['EC Sanctions Map'], quality: 1 },
          { code: 'GS.GP.SN.UK', name: 'UK OFSI Exposure', level: 4, weight: 0.25, dataSources: ['HM Treasury'], quality: 1 },
          { code: 'GS.GP.SN.TP', name: 'Trade Policy Risk (Tariffs)', level: 4, weight: 0.25, dataSources: ['WTO, USTR'], quality: 2 },
        ]},
        { code: 'GS.GP.CF', name: 'Conflict & Security', level: 3, weight: 0.30, children: [
          { code: 'GS.GP.CF.AC', name: 'ACLED Conflict Events', level: 4, weight: 0.50, dataSources: ['ACLED'], quality: 1 },
          { code: 'GS.GP.CF.FR', name: 'Friendshoring Readiness', level: 4, weight: 0.50, dataSources: ['OECD', 'IMF'], quality: 3 },
        ]},
      ]},
    ],
  },
  {
    code: 'GP', name: 'Geopolitical Risk', level: 1, weight: 0.13, icon: '🌐',
    description: 'Country-level political, regulatory, trade, and conflict risk overlay for transition assessment',
    children: [
      { code: 'GP.PL', name: 'Political & Institutional', level: 2, weight: 0.30, children: [
        { code: 'GP.PL.GV', name: 'Governance Quality', level: 3, weight: 0.50, children: [
          { code: 'GP.PL.GV.VA', name: 'Voice & Accountability', level: 4, weight: 0.20, dataSources: ['World Bank WGI'], quality: 1 },
          { code: 'GP.PL.GV.PS', name: 'Political Stability', level: 4, weight: 0.20, dataSources: ['World Bank WGI'], quality: 1 },
          { code: 'GP.PL.GV.GE', name: 'Government Effectiveness', level: 4, weight: 0.20, dataSources: ['World Bank WGI'], quality: 1 },
          { code: 'GP.PL.GV.RQ', name: 'Regulatory Quality', level: 4, weight: 0.20, dataSources: ['World Bank WGI'], quality: 1 },
          { code: 'GP.PL.GV.CC', name: 'Control of Corruption', level: 4, weight: 0.20, dataSources: ['World Bank WGI, TI CPI'], quality: 1 },
        ]},
        { code: 'GP.PL.DP', name: 'Democracy & Policy Continuity', level: 3, weight: 0.50, children: [
          { code: 'GP.PL.DP.DM', name: 'Democracy Index', level: 4, weight: 0.35, dataSources: ['EIU Democracy Index', 'V-Dem'], quality: 1 },
          { code: 'GP.PL.DP.PC', name: 'Policy Continuity Score', level: 4, weight: 0.35, dataSources: ['V-Dem', 'ICRG'], quality: 2 },
          { code: 'GP.PL.DP.JI', name: 'Judicial Independence', level: 4, weight: 0.30, dataSources: ['WEF GCI', 'WJP'], quality: 2 },
        ]},
      ]},
      { code: 'GP.TR', name: 'Trade & Sanctions', level: 2, weight: 0.30, children: [
        { code: 'GP.TR.SN', name: 'Sanctions Regimes', level: 3, weight: 0.50, children: [
          { code: 'GP.TR.SN.CM', name: 'Comprehensive Sanctions', level: 4, weight: 0.40, dataSources: ['OFAC, EU, UK OFSI, UN'], quality: 1 },
          { code: 'GP.TR.SN.SC', name: 'Sectoral Sanctions', level: 4, weight: 0.30, dataSources: ['OFAC SSI, EU sectoral'], quality: 1 },
          { code: 'GP.TR.SN.SY', name: 'Secondary Sanctions Risk', level: 4, weight: 0.30, dataSources: ['OFAC guidance'], quality: 2 },
        ]},
        { code: 'GP.TR.TP', name: 'Trade Policy', level: 3, weight: 0.50, children: [
          { code: 'GP.TR.TP.TF', name: 'Tariff Exposure', level: 4, weight: 0.30, dataSources: ['WTO, USTR, EC'], quality: 2 },
          { code: 'GP.TR.TP.EC', name: 'Export Controls (Technology)', level: 4, weight: 0.35, dataSources: ['BIS EAR, EU Dual-Use'], quality: 2 },
          { code: 'GP.TR.TP.FS', name: 'Friendshoring Score', level: 4, weight: 0.35, dataSources: ['OECD', 'Kearney GRDI'], quality: 3 },
        ]},
      ]},
      { code: 'GP.RE', name: 'Resource & Energy Security', level: 2, weight: 0.25, children: [
        { code: 'GP.RE.FE', name: 'Fossil Export Dependency', level: 3, weight: 0.40, children: [
          { code: 'GP.RE.FE.OL', name: 'Oil Export % GDP', level: 4, weight: 0.40, dataSources: ['World Bank, IMF'], quality: 1 },
          { code: 'GP.RE.FE.GS', name: 'Gas Export % GDP', level: 4, weight: 0.30, dataSources: ['IEA', 'BP Statistical Review'], quality: 1 },
          { code: 'GP.RE.FE.CL', name: 'Coal Export % GDP', level: 4, weight: 0.30, dataSources: ['IEA Coal Report'], quality: 2 },
        ]},
        { code: 'GP.RE.CM', name: 'Critical Mineral Control', level: 3, weight: 0.35, children: [
          { code: 'GP.RE.CM.MN', name: 'Mining Concentration', level: 4, weight: 0.50, dataSources: ['USGS', 'BGS'], quality: 2 },
          { code: 'GP.RE.CM.PR', name: 'Processing Concentration', level: 4, weight: 0.50, dataSources: ['USGS', 'S&P Global'], quality: 2 },
        ]},
        { code: 'GP.RE.IS', name: 'Energy Import Dependency', level: 3, weight: 0.25, children: [
          { code: 'GP.RE.IS.OL', name: 'Oil Import Dependency', level: 4, weight: 0.40, dataSources: ['IEA', 'EIA'], quality: 1 },
          { code: 'GP.RE.IS.GS', name: 'Gas Import Dependency', level: 4, weight: 0.30, dataSources: ['IEA'], quality: 1 },
          { code: 'GP.RE.IS.EL', name: 'Electricity Import Share', level: 4, weight: 0.30, dataSources: ['IEA', 'ENTSO-E'], quality: 2 },
        ]},
      ]},
      { code: 'GP.CF', name: 'Conflict & Stability', level: 2, weight: 0.15, children: [
        { code: 'GP.CF.AC', name: 'Active Conflict', level: 3, weight: 0.50, children: [
          { code: 'GP.CF.AC.AR', name: 'Armed Conflict Events', level: 4, weight: 0.50, dataSources: ['ACLED'], quality: 1 },
          { code: 'GP.CF.AC.FA', name: 'Fatalities Index', level: 4, weight: 0.50, dataSources: ['UCDP'], quality: 1 },
        ]},
        { code: 'GP.CF.FR', name: 'Fragility & Resilience', level: 3, weight: 0.50, children: [
          { code: 'GP.CF.FR.FS', name: 'Fragile States Index', level: 4, weight: 0.50, dataSources: ['Fund for Peace FSI'], quality: 1 },
          { code: 'GP.CF.FR.IN', name: 'INFORM Risk Index', level: 4, weight: 0.50, dataSources: ['JRC INFORM'], quality: 1 },
        ]},
      ]},
    ],
  },
];

// ─── TAXONOMY UTILITY FUNCTIONS ─────────────────────────────────────────────

/** Flatten tree into array of all nodes with path */
export function flattenTaxonomy(tree = TAXONOMY_TREE, parentPath = '') {
  const result = [];
  for (const node of tree) {
    const path = parentPath ? `${parentPath}.${node.code}` : node.code;
    result.push({ ...node, path, childCount: (node.children || []).length });
    if (node.children) {
      result.push(...flattenTaxonomy(node.children, path));
    }
  }
  return result;
}

/** Get all leaf nodes (Level 4) */
export function getLeafNodes(tree = TAXONOMY_TREE) {
  return flattenTaxonomy(tree).filter(n => n.level === 4);
}

/** Count nodes by level */
export function countByLevel(tree = TAXONOMY_TREE) {
  const flat = flattenTaxonomy(tree);
  return {
    level1: flat.filter(n => n.level === 1).length,
    level2: flat.filter(n => n.level === 2).length,
    level3: flat.filter(n => n.level === 3).length,
    level4: flat.filter(n => n.level === 4).length,
    total: flat.length,
  };
}

/** Bottom-up weighted score aggregation */
export function aggregateScores(nodeScores, tree = TAXONOMY_TREE) {
  function computeNode(node) {
    if (!node.children || node.children.length === 0) {
      return nodeScores[node.code] || { score: 0, quality: 5 };
    }
    const childResults = node.children.map(c => ({
      ...computeNode(c),
      weight: c.weight,
    }));
    const totalWeight = childResults.reduce((s, c) => s + c.weight, 0);
    const score = childResults.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight;
    const quality = Math.max(...childResults.map(c => c.quality)); // worst quality propagates up
    return { score: Math.round(score * 10) / 10, quality };
  }
  return tree.map(t => ({ code: t.code, name: t.name, ...computeNode(t) }));
}

/** Score to rating band */
export function scoreToRating(score) {
  if (score >= 80) return { label: 'A', color: '#16a34a', band: 'Excellent' };
  if (score >= 60) return { label: 'B', color: '#0891b2', band: 'Good' };
  if (score >= 40) return { label: 'C', color: '#d97706', band: 'Moderate' };
  if (score >= 20) return { label: 'D', color: '#ea580c', band: 'Poor' };
  return { label: 'E', color: '#dc2626', band: 'Critical' };
}

/** Get all unique data sources across the taxonomy */
export function getAllDataSources(tree = TAXONOMY_TREE) {
  const sources = new Set();
  flattenTaxonomy(tree).forEach(n => {
    if (n.dataSources) n.dataSources.forEach(s => sources.add(s));
  });
  return [...sources].sort();
}

// ─── REFERENCE DATA SOURCE REGISTRY ─────────────────────────────────────────
export const REFERENCE_DATA_SOURCES = [
  { key: 'cdp', name: 'CDP (Carbon Disclosure Project)', type: 'ESG Disclosure', coverage: 'Global, 23,000+ companies', quality: 2, license: 'Subscription', refresh: 'Annual', url: 'https://www.cdp.net' },
  { key: 'sbti', name: 'SBTi Target Database', type: 'Target Validation', coverage: 'Global, 8,000+ companies', quality: 1, license: 'Free', refresh: 'Continuous', url: 'https://sciencebasedtargets.org' },
  { key: 'pcaf', name: 'PCAF Global GHG Standard', type: 'Methodology', coverage: 'Global, 8 asset classes', quality: 1, license: 'Free', refresh: 'Version updates', url: 'https://carbonaccountingfinancials.com' },
  { key: 'ngfs', name: 'NGFS Phase 5 Scenarios', type: 'Climate Scenarios', coverage: 'Global, 6 scenarios', quality: 1, license: 'Free', refresh: '18-24 months', url: 'https://www.ngfs.net' },
  { key: 'ipcc_ar6', name: 'IPCC AR6 Reports', type: 'Climate Science', coverage: 'Global', quality: 1, license: 'Free', refresh: '5-7 years', url: 'https://www.ipcc.ch' },
  { key: 'iea', name: 'IEA World Energy Outlook', type: 'Energy Data', coverage: 'Global, all fuels', quality: 1, license: 'Subscription', refresh: 'Annual', url: 'https://www.iea.org' },
  { key: 'wri_gppd', name: 'WRI Global Power Plant Database', type: 'Asset Registry', coverage: 'Global, 35,000+ plants', quality: 2, license: 'Free (CC BY 4.0)', refresh: 'Periodic', url: 'https://datasets.wri.org/dataset/globalpowerplantdatabase' },
  { key: 'epa_ghgrp', name: 'US EPA GHGRP', type: 'Facility Emissions', coverage: 'US, 8,000+ facilities', quality: 2, license: 'Free', refresh: 'Annual', url: 'https://www.epa.gov/ghgreporting' },
  { key: 'eutl', name: 'EU ETS EUTL', type: 'Compliance Emissions', coverage: 'EU/EEA, 11,000+ installations', quality: 1, license: 'Free', refresh: 'Annual', url: 'https://ec.europa.eu/clima/ets' },
  { key: 'gleif', name: 'GLEIF (Legal Entity Identifiers)', type: 'Entity Resolution', coverage: 'Global, 2.5M+ LEIs', quality: 1, license: 'Free', refresh: 'Continuous', url: 'https://www.gleif.org' },
  { key: 'wb_wgi', name: 'World Bank WGI', type: 'Governance Indicators', coverage: 'Global, 200+ countries', quality: 1, license: 'Free', refresh: 'Annual', url: 'https://info.worldbank.org/governance/wgi' },
  { key: 'acled', name: 'ACLED (Armed Conflict Data)', type: 'Conflict Events', coverage: 'Global, real-time', quality: 1, license: 'Free for research', refresh: 'Weekly', url: 'https://acleddata.com' },
  { key: 'firms', name: 'NASA FIRMS', type: 'Fire Detection', coverage: 'Global, satellite', quality: 2, license: 'Free', refresh: 'Near real-time', url: 'https://firms.modaps.eosdis.nasa.gov' },
  { key: 'wri_aqueduct', name: 'WRI Aqueduct', type: 'Water Risk', coverage: 'Global', quality: 2, license: 'Free', refresh: 'Periodic', url: 'https://www.wri.org/aqueduct' },
  { key: 'tnfd', name: 'TNFD Recommendations', type: 'Nature Risk', coverage: 'Global framework', quality: 1, license: 'Free', refresh: 'Version updates', url: 'https://tnfd.global' },
  { key: 'encore', name: 'ENCORE (Natural Capital)', type: 'Nature Dependencies', coverage: 'Global, 86 sectors', quality: 2, license: 'Free', refresh: 'Annual', url: 'https://encore.naturalcapital.finance' },
  { key: 'ibat', name: 'IBAT (Biodiversity)', type: 'Protected Areas', coverage: 'Global', quality: 2, license: 'Subscription', refresh: 'Monthly', url: 'https://www.ibat-alliance.org' },
  { key: 'influencemap', name: 'InfluenceMap', type: 'Lobbying Alignment', coverage: 'Global, 400+ companies', quality: 2, license: 'Subscription', refresh: 'Continuous', url: 'https://influencemap.org' },
  { key: 'climate_trace', name: 'Climate TRACE', type: 'Satellite Emissions', coverage: 'Global, 70,000+ facilities', quality: 2, license: 'Free', refresh: 'Annual', url: 'https://climatetrace.org' },
  { key: 'icap', name: 'ICAP ETS Map', type: 'Carbon Markets', coverage: 'Global, 30+ systems', quality: 1, license: 'Free', refresh: 'Continuous', url: 'https://icapcarbonaction.com' },
  { key: 'owid', name: 'Our World in Data', type: 'Development Data', coverage: 'Global, 207 countries', quality: 2, license: 'Free (CC BY)', refresh: 'Continuous', url: 'https://ourworldindata.org' },
  { key: 'eodhd', name: 'EODHD Financial Data', type: 'Market Data', coverage: 'Global, 150,000+ tickers', quality: 2, license: 'Subscription', refresh: 'Daily', url: 'https://eodhd.com' },
  { key: 'irena', name: 'IRENA Statistics', type: 'Renewable Energy', coverage: 'Global', quality: 1, license: 'Free', refresh: 'Annual', url: 'https://www.irena.org' },
  { key: 'bnef', name: 'BloombergNEF', type: 'Clean Energy Finance', coverage: 'Global', quality: 1, license: 'Subscription', refresh: 'Continuous', url: 'https://about.bnef.com' },
];

export default TAXONOMY_TREE;
