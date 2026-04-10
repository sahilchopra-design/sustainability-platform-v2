import React, { createContext, useContext, useMemo } from 'react';
import cedaRaw from '../data/ceda-2025.json';
import bigClimateDb from '../data/big-climate-db.json';
import cbamRaw from '../data/cbam-vulnerability.json';
import owidCo2Raw from '../data/owid-co2-compact.json';
import owidEnergyRaw from '../data/owid-energy-compact.json';
import sbtiRaw from '../data/sbti-companies.json';

const ReferenceDataContext = createContext(null);

/* ── helpers ────────────────────────────────────────────────────── */
const lower = s => (s || '').toLowerCase();
const uniq = arr => [...new Set(arr)];

/* ── build O(1) maps once ───────────────────────────────────────── */
function buildCedaMaps(raw) {
  const countryMap = {};
  (raw.countries || []).forEach(c => { countryMap[c.code] = c; });
  const sectorMap = {};
  (raw.sectors || []).forEach(s => { sectorMap[s.code] = s; });
  return { countryMap, sectorMap };
}

function buildOwidCo2Maps(raw) {
  const byIso = {};
  (raw.latestByCountry || []).forEach(c => { byIso[c.iso] = c; });
  return byIso;
}

function buildOwidEnergyMaps(raw) {
  const byIso = {};
  (raw.latestByCountry || []).forEach(c => { byIso[c.iso] = c; });
  return byIso;
}

function buildCbamMaps(raw) {
  const byIso3 = {};
  (raw.countries || []).forEach(c => { byIso3[c.iso3] = c; });
  return byIso3;
}

function buildSbtiMaps(raw) {
  const byRegion = {}; const bySector = {}; const byClass = {};
  (raw.companies || []).forEach(c => {
    (byRegion[c.r] = byRegion[c.r] || []).push(c);
    (bySector[c.s] = bySector[c.s] || []).push(c);
    (byClass[c.c] = byClass[c.c] || []).push(c);
  });
  return { byRegion, bySector, byClass };
}

function buildBigClimateMaps(data) {
  const byCat = {}; const byCountry = {};
  data.forEach(p => {
    (byCat[p.category] = byCat[p.category] || []).push(p);
    (byCountry[p.country] = byCountry[p.country] || []).push(p);
  });
  return { byCat, byCountry };
}

/* ── Provider ───────────────────────────────────────────────────── */
export function ReferenceDataProvider({ children }) {
  const value = useMemo(() => {
    /* — maps — */
    const cedaMaps = buildCedaMaps(cedaRaw);
    const co2Map = buildOwidCo2Maps(owidCo2Raw);
    const energyMap = buildOwidEnergyMaps(owidEnergyRaw);
    const cbamMap = buildCbamMaps(cbamRaw);
    const sbtiMaps = buildSbtiMaps(sbtiRaw);
    const bcMaps = buildBigClimateMaps(bigClimateDb);

    /* — source metadata — */
    const sources = [
      { id: 'ceda', name: 'CEDA Emission Factors', provider: 'CEDA (Comprehensive Environmental Data Archive)', license: 'Commercial', version: cedaRaw.version || '2025', description: 'Spend-based emission factors by sector and country', recordCount: (cedaRaw.sectors || []).length * (cedaRaw.countries || []).length, fieldCount: 5, domains: ['emissions', 'industry'] },
      { id: 'bigClimate', name: 'Big Climate Database', provider: 'CONCITO', license: 'CC-BY 4.0', version: 'v1.2', description: 'Life-cycle carbon footprints for food products', recordCount: bigClimateDb.length, fieldCount: Object.keys(bigClimateDb[0] || {}).length, domains: ['food', 'emissions', 'lifecycle'] },
      { id: 'cbam', name: 'CBAM Vulnerability Matrix', provider: 'A\u00b2 Intelligence / EU CBAM', license: 'Open', version: cbamRaw.version || '2025', description: 'EU Carbon Border Adjustment Mechanism vulnerability by country', recordCount: (cbamRaw.countries || []).length, fieldCount: 21, domains: ['trade', 'vulnerability', 'emissions'] },
      { id: 'owidCo2', name: 'OWID CO2 & GHG Emissions', provider: 'Our World in Data / Global Carbon Project', license: owidCo2Raw.license || 'CC BY 4.0', version: owidCo2Raw.version || '2025', description: 'CO2, methane, N2O emissions by country with per-capita and cumulative', recordCount: (owidCo2Raw.latestByCountry || []).length, fieldCount: 21, domains: ['emissions', 'energy'] },
      { id: 'owidEnergy', name: 'OWID Energy Mix', provider: 'Our World in Data / Energy', license: owidEnergyRaw.license || 'CC BY 4.0', version: owidEnergyRaw.version || '2025', description: 'Energy generation, capacity, and renewables share by country', recordCount: (owidEnergyRaw.latestByCountry || []).length, fieldCount: 23, domains: ['energy', 'renewables'] },
      { id: 'sbti', name: 'SBTi Companies', provider: 'Science Based Targets initiative', license: 'Open', version: '2025-Q1', description: 'Companies with validated science-based targets', recordCount: (sbtiRaw.companies || []).length, fieldCount: 7, domains: ['targets', 'decarbonisation'] },
      // ── Existing Supabase DB sources ──
      { id: 'dh_reference_data', name: 'Data Hub Reference Data', provider: 'Internal Platform', license: 'Proprietary', version: '2026', description: 'Consolidated reference data from EPA, WRI, IPCC', recordCount: 1120, fieldCount: 12, domains: ['emissions', 'reference'], dbTable: 'dh_reference_data' },
      { id: 'dh_sbti_companies', name: 'SBTi Full DB (Supabase)', provider: 'SBTi', license: 'Free Public', version: '2025', description: 'Full 14K SBTi company database with ISIN, LEI, targets', recordCount: 14034, fieldCount: 14, domains: ['targets', 'sbti'], dbTable: 'dh_sbti_companies' },
      { id: 'dh_country_risk', name: 'Country Risk Indices', provider: 'WB/IMF/ND-GAIN', license: 'Open Data', version: '2024', description: 'Country climate risk indices (ND-GAIN, vulnerability, readiness)', recordCount: 3090, fieldCount: 8, domains: ['risk', 'country'], dbTable: 'dh_country_risk_indices' },
      { id: 'dh_grid_ef', name: 'Grid Emission Factors', provider: 'IEA/EPA/National', license: 'Mixed', version: '2024', description: 'Electricity grid emission factors by country (kgCO2/kWh)', recordCount: 120, fieldCount: 6, domains: ['emissions', 'grid'], dbTable: 'dh_grid_emission_factors' },
      { id: 'dh_irena_lcoe', name: 'IRENA LCOE', provider: 'IRENA', license: 'Open', version: '2024', description: 'Levelized cost of electricity by technology', recordCount: 72, fieldCount: 8, domains: ['energy', 'cost'], dbTable: 'dh_irena_lcoe' },
      { id: 'dh_crrem', name: 'CRREM Pathways', provider: 'CRREM Initiative', license: 'Open', version: '2024', description: 'Real estate decarbonisation pathways for 30 countries', recordCount: 3906, fieldCount: 10, domains: ['real_estate', 'pathways'], dbTable: 'dh_crrem_pathways' },
      { id: 'dh_ca100', name: 'Climate Action 100+', provider: 'CA100+', license: 'Public', version: '2024', description: 'CA100+ company benchmark assessments (169 focus list)', recordCount: 169, fieldCount: 12, domains: ['engagement', 'benchmarks'], dbTable: 'dh_ca100_assessments' },
      { id: 'ngfs_scenarios', name: 'NGFS Scenarios', provider: 'NGFS/IIASA', license: 'Free', version: 'Phase IV', description: 'Central bank climate scenarios with 7,328 time series points', recordCount: 7328, fieldCount: 8, domains: ['scenarios', 'stress_test'], dbTable: 'ngfs_scenario_timeseries' },
      { id: 'carbon_pricing', name: 'Carbon Pricing Reference', provider: 'World Bank/ICAP', license: 'Open', version: '2024', description: 'Global carbon pricing instruments (ETS + tax)', recordCount: 8, fieldCount: 6, domains: ['carbon_pricing'], dbTable: 'carbon_pricing_reference' },
      { id: 'csrd_esrs', name: 'CSRD ESRS Catalog', provider: 'EFRAG/EU', license: 'Public', version: '2024', description: 'Complete ESRS disclosure requirements (E1-E5, S1-S4, G1-G2)', recordCount: 1184, fieldCount: 10, domains: ['csrd', 'regulatory'], dbTable: 'csrd_esrs_catalog' },
      { id: 'gri_standards', name: 'GRI Standards', provider: 'GRI', license: 'Public', version: '2024', description: 'GRI Universal, Topic, and Sector Standards', recordCount: 2230, fieldCount: 8, domains: ['gri', 'reporting'], dbTable: 'gri_standards' },
      { id: 'sovereign_climate', name: 'Sovereign Climate Assessments', provider: 'Multi-source', license: 'Proprietary', version: '2024', description: 'Sovereign climate risk assessments for 48 countries', recordCount: 48, fieldCount: 15, domains: ['sovereign', 'risk'], dbTable: 'sovereign_climate_assessments' },
      { id: 'brsr_india', name: 'India BRSR Companies', provider: 'NSE/BSE/SEBI', license: 'Public', version: '2024', description: '1,323 Indian listed companies with BRSR metrics', recordCount: 1323, fieldCount: 20, domains: ['brsr', 'india'], dbTable: 'dme_brsr_companies' },
      { id: 'company_profiles', name: 'Company Profiles', provider: 'Internal', license: 'Proprietary', version: '2024', description: 'Core company master data with financials and ESG scores', recordCount: 97, fieldCount: 18, domains: ['companies', 'esg'], dbTable: 'company_profiles' },
      { id: 'emission_factor_lib', name: 'Emission Factor Library', provider: 'DEFRA/EPA/IPCC', license: 'Open', version: '2024', description: 'Extended emission factor library with source attribution', recordCount: 30, fieldCount: 8, domains: ['emissions', 'factors'], dbTable: 'emission_factor_library' },
      { id: 'dh_violation_tracker', name: 'Violation Tracker', provider: 'Good Jobs First', license: 'Open', version: '2024', description: 'Corporate environmental and regulatory violations', recordCount: 18, fieldCount: 10, domains: ['violations', 'controversy'], dbTable: 'dh_violation_tracker' },
    ];

    /* — CEDA accessors — */
    const ceda = {
      sectors: cedaRaw.sectors || [],
      countries: cedaRaw.countries || [],
      industryGroups: cedaRaw.industryGroups || {},
      getEmissionFactor: (countryCode, sectorCode) => {
        const c = cedaMaps.countryMap[countryCode];
        return c && c.efs ? (c.efs[sectorCode] ?? null) : null;
      },
      searchSectors: q => {
        const lq = lower(q);
        return (cedaRaw.sectors || []).filter(s => lower(s.name).includes(lq) || lower(s.code).includes(lq));
      },
      stats: { totalSectors: (cedaRaw.sectors || []).length, totalCountries: (cedaRaw.countries || []).length },
    };

    /* — Big Climate DB accessors — */
    const bigClimate = {
      products: bigClimateDb,
      countries: uniq(bigClimateDb.map(p => p.country)),
      categories: uniq(bigClimateDb.map(p => p.category)),
      searchProducts: q => { const lq = lower(q); return bigClimateDb.filter(p => lower(p.name).includes(lq)); },
      getByCategory: cat => bcMaps.byCat[cat] || [],
      getByCountry: c => bcMaps.byCountry[c] || [],
      stats: { totalProducts: bigClimateDb.length, totalCategories: uniq(bigClimateDb.map(p => p.category)).length, totalCountries: uniq(bigClimateDb.map(p => p.country)).length },
    };

    /* — CBAM accessors — */
    const cbam = {
      countries: cbamRaw.countries || [],
      commodities: Object.keys(cbamRaw.commodityPrices || {}),
      tradeFlows: cbamRaw.tradeFlows || [],
      defaultValues: cbamRaw.defaultValues || [],
      phaseIn: cbamRaw.phaseIn || [],
      ranges: cbamRaw.ranges || {},
      getCountryVulnerability: iso3 => cbamMap[iso3] || null,
      stats: { totalCountries: (cbamRaw.countries || []).length, totalTradeFlows: (cbamRaw.tradeFlows || []).length, totalCommodities: Object.keys(cbamRaw.commodityPrices || {}).length },
    };

    /* — OWID CO2 accessors — */
    const owidCo2 = {
      latestByCountry: owidCo2Raw.latestByCountry || [],
      top20TimeSeries: owidCo2Raw.top20TimeSeries || {},
      getCountryEmissions: iso => co2Map[iso] || null,
      getTopEmitters: (n = 20) => [...(owidCo2Raw.latestByCountry || [])].sort((a, b) => (b.co2_mt || 0) - (a.co2_mt || 0)).slice(0, n),
      stats: { totalCountries: (owidCo2Raw.latestByCountry || []).length },
    };

    /* — OWID Energy accessors — */
    const owidEnergy = {
      latestByCountry: owidEnergyRaw.latestByCountry || [],
      getCountryEnergy: iso => energyMap[iso] || null,
      getRenewableShare: iso => { const c = energyMap[iso]; return c ? c.renewables_share_pct : null; },
      stats: { totalCountries: (owidEnergyRaw.latestByCountry || []).length },
    };

    /* — SBTi accessors — */
    const sbti = {
      companies: sbtiRaw.companies || [],
      stats: sbtiRaw.stats || {},
      searchCompany: q => { const lq = lower(q); return (sbtiRaw.companies || []).filter(c => lower(c.n).includes(lq)); },
      getBySector: s => sbtiMaps.bySector[s] || [],
      getByRegion: r => sbtiMaps.byRegion[r] || [],
      getByClassification: c => sbtiMaps.byClass[c] || [],
    };

    /* — Cross-source country profile — */
    const getCountryProfile = (iso) => {
      const iso3 = iso && iso.length === 3 ? iso : null;
      const iso2 = iso && iso.length === 2 ? iso : null;
      const co2 = co2Map[iso3] || co2Map[iso2] || null;
      const energy = energyMap[iso3] || energyMap[iso2] || null;
      const cbamEntry = iso3 ? cbamMap[iso3] : null;
      const cedaCountry = cedaMaps.countryMap[iso3] || cedaMaps.countryMap[iso2] || null;
      const sbtiCount = (sbtiRaw.companies || []).filter(c => {
        const loc = lower(c.l);
        return loc.includes(lower(iso)) || (co2 && lower(co2.country) && loc.includes(lower(co2.country)));
      }).length;
      return { iso, co2, energy, cbam: cbamEntry, ceda: cedaCountry, sbtiCompanyCount: sbtiCount };
    };

    /* — Cross-database search — */
    const searchAll = (query) => {
      const lq = lower(query);
      const results = [];
      ceda.searchSectors(query).slice(0, 10).forEach(s => results.push({ source: 'ceda', type: 'sector', name: s.name, code: s.code }));
      bigClimate.searchProducts(query).slice(0, 10).forEach(p => results.push({ source: 'bigClimate', type: 'product', name: p.name, country: p.country, total: p.total }));
      sbti.searchCompany(query).slice(0, 10).forEach(c => results.push({ source: 'sbti', type: 'company', name: c.n, sector: c.s, classification: c.c }));
      (owidCo2Raw.latestByCountry || []).filter(c => lower(c.country).includes(lq)).slice(0, 10).forEach(c => results.push({ source: 'owidCo2', type: 'country', name: c.country, iso: c.iso, co2_mt: c.co2_mt }));
      (cbamRaw.countries || []).filter(c => lower(c.name).includes(lq)).slice(0, 5).forEach(c => results.push({ source: 'cbam', type: 'country', name: c.name, iso3: c.iso3, vulnerability: c.vulnerabilityIndex }));
      return results;
    };

    /* — Global stats — */
    const allCountryCodes = uniq([
      ...(owidCo2Raw.latestByCountry || []).map(c => c.iso),
      ...(owidEnergyRaw.latestByCountry || []).map(c => c.iso),
      ...(cbamRaw.countries || []).map(c => c.iso3),
      ...(cedaRaw.countries || []).map(c => c.code),
    ].filter(Boolean));
    const totalFields = sources.reduce((s, src) => s + src.fieldCount, 0);
    const totalRecords = sources.reduce((s, src) => s + src.recordCount, 0);
    const globalStats = { totalRecords, totalSources: sources.length, totalCountries: allCountryCodes.length, totalFields };

    return { sources, ceda, bigClimate, cbam, owidCo2, owidEnergy, sbti, getCountryProfile, searchAll, globalStats };
  }, []);

  return (
    <ReferenceDataContext.Provider value={value}>
      {children}
    </ReferenceDataContext.Provider>
  );
}

export function useReferenceData() {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx) throw new Error('useReferenceData must be used within ReferenceDataProvider');
  return ctx;
}

export default ReferenceDataContext;
