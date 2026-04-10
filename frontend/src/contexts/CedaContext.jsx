/**
 * CedaContext — Comprehensive Environmental Data Archive (CEDA 2025)
 *
 * Provides emission factor data to any consuming module via React Context.
 * Loads the CEDA 2025 JSON once, builds O(1) lookup maps in useMemo,
 * and exposes helper functions for EF retrieval, currency conversion,
 * spend-based emissions calculation, search, and ranking.
 */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import cedaData from '../data/ceda-2025.json';

const CedaContext = createContext(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */
export function CedaProvider({ children }) {
  /* --- user preferences (mutable) --------------------------------- */
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2025);

  /* --- static arrays ---------------------------------------------- */
  const sectors = useMemo(() => cedaData.sectors.map(s => ({
    code: s.code, name: s.name, desc: s.desc,
  })), []);

  const countries = useMemo(() => cedaData.countries.map(c => ({
    code: c.code, name: c.name,
  })), []);

  const regions = useMemo(
    () => [...new Set(Object.values(cedaData.regionMap))].sort(),
    [],
  );

  const sectorGroups = useMemo(() => cedaData.sectorGroups, []);
  const industryGroups = useMemo(() => cedaData.industryGroups, []);

  /* --- O(1) lookup maps ------------------------------------------- */
  const countryEFMap = useMemo(() => {
    const m = {};
    cedaData.countries.forEach(c => { m[c.code] = c.efs; });
    return m;
  }, []);

  const regionalEFMap = useMemo(() => {
    const m = {};
    cedaData.regionalEFs.forEach(r => { m[r.region] = r.efs; });
    return m;
  }, []);

  const regionLookup = useMemo(() => cedaData.regionMap, []);

  const fxMap = useMemo(() => {
    const m = {};
    cedaData.exchangeRates.forEach(r => { m[r.code] = r; });
    return m;
  }, []);

  const sectorMap = useMemo(() => {
    const m = {};
    cedaData.sectors.forEach(s => { m[s.code] = s; });
    return m;
  }, []);

  const countryNameMap = useMemo(() => {
    const m = {};
    cedaData.countries.forEach(c => { m[c.code] = c.name; });
    return m;
  }, []);

  /* --- helper functions ------------------------------------------- */

  /** Return kgCO2e/USD for a specific country + sector, or null */
  const getEmissionFactor = useCallback((countryCode, sectorCode) => {
    const efs = countryEFMap[countryCode];
    if (!efs) return null;
    const v = efs[sectorCode];
    return v !== undefined ? v : null;
  }, [countryEFMap]);

  /** Return regional average EF for a region + sector, or null */
  const getRegionalEF = useCallback((region, sectorCode) => {
    const efs = regionalEFMap[region];
    if (!efs) return null;
    const v = efs[sectorCode];
    return v !== undefined ? v : null;
  }, [regionalEFMap]);

  /** Return UN subregion name for a country code */
  const getCountryRegion = useCallback(
    (countryCode) => regionLookup[countryCode] || null,
    [regionLookup],
  );

  /** Return sectors belonging to a NAICS 2-digit group */
  const getSectorsByGroup = useCallback((groupPrefix) => {
    const g = sectorGroups[groupPrefix];
    if (!g) return [];
    return g.sectors.map(code => sectorMap[code]).filter(Boolean);
  }, [sectorGroups, sectorMap]);

  /** Fuzzy search sectors by name (case-insensitive substring) */
  const searchSectors = useCallback((query) => {
    if (!query) return sectors;
    const q = query.toLowerCase();
    return sectors.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
    );
  }, [sectors]);

  /** Fuzzy search countries by name (case-insensitive substring) */
  const searchCountries = useCallback((query) => {
    if (!query) return countries;
    const q = query.toLowerCase();
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countries]);

  /** Calculate spend-based Scope 3 emissions */
  const calculateSpendEmissions = useCallback((countryCode, sectorCode, spendUSD) => {
    const ef = getEmissionFactor(countryCode, sectorCode);
    if (ef !== null) {
      const kgCO2e = ef * spendUSD;
      return { kgCO2e, tCO2e: kgCO2e / 1000, source: 'country' };
    }
    const region = getCountryRegion(countryCode);
    if (region) {
      const ref = getRegionalEF(region, sectorCode);
      if (ref !== null) {
        const kgCO2e = ref * spendUSD;
        return { kgCO2e, tCO2e: kgCO2e / 1000, source: 'regional' };
      }
    }
    return { kgCO2e: 0, tCO2e: 0, source: 'none' };
  }, [getEmissionFactor, getCountryRegion, getRegionalEF]);

  /** Return FX rate for a country + year */
  const getExchangeRate = useCallback((countryCode, year) => {
    const entry = fxMap[countryCode];
    if (!entry || !entry.rates) return null;
    return entry.rates[year] || null;
  }, [fxMap]);

  /** Convert USD to local currency */
  const convertCurrency = useCallback((amountUSD, countryCode, year) => {
    const rate = getExchangeRate(countryCode, year);
    return rate !== null ? amountUSD * rate : null;
  }, [getExchangeRate]);

  /** Top N countries by EF for a given sector */
  const getTopEmitters = useCallback((sectorCode, limit = 10) => {
    return cedaData.countries
      .filter(c => c.efs[sectorCode] !== undefined)
      .map(c => ({ code: c.code, name: c.name, ef: c.efs[sectorCode] }))
      .sort((a, b) => b.ef - a.ef)
      .slice(0, limit);
  }, []);

  /** Top N sectors by EF for a given country */
  const getTopSectors = useCallback((countryCode, limit = 10) => {
    const efs = countryEFMap[countryCode];
    if (!efs) return [];
    return Object.entries(efs)
      .map(([code, ef]) => ({ code, name: (sectorMap[code] || {}).name || code, ef }))
      .sort((a, b) => b.ef - a.ef)
      .slice(0, limit);
  }, [countryEFMap, sectorMap]);

  /* --- context value ---------------------------------------------- */
  const value = useMemo(() => ({
    // static data
    sectors, countries, regions, sectorGroups, industryGroups,
    version: cedaData.version,
    stats: {
      totalSectors: cedaData.totalSectors,
      totalCountries: cedaData.totalCountries,
      totalRegions: cedaData.totalRegions,
    },
    // raw maps (for advanced consumers)
    countryEFMap, regionalEFMap, regionLookup, fxMap, sectorMap, countryNameMap,
    // lookup functions
    getEmissionFactor, getRegionalEF, getCountryRegion, getSectorsByGroup,
    searchSectors, searchCountries,
    calculateSpendEmissions, getExchangeRate, convertCurrency,
    getTopEmitters, getTopSectors,
    // user preference state
    selectedCountry, setSelectedCountry,
    selectedSector, setSelectedSector,
    selectedYear, setSelectedYear,
  }), [
    sectors, countries, regions, sectorGroups, industryGroups,
    countryEFMap, regionalEFMap, regionLookup, fxMap, sectorMap, countryNameMap,
    getEmissionFactor, getRegionalEF, getCountryRegion, getSectorsByGroup,
    searchSectors, searchCountries, calculateSpendEmissions,
    getExchangeRate, convertCurrency, getTopEmitters, getTopSectors,
    selectedCountry, selectedSector, selectedYear,
  ]);

  return <CedaContext.Provider value={value}>{children}</CedaContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */
export function useCeda() {
  const ctx = useContext(CedaContext);
  if (!ctx) throw new Error('useCeda must be used within a CedaProvider');
  return ctx;
}

export default CedaContext;
