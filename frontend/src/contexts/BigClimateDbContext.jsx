/**
 * BigClimateDbContext — CONCITO Big Climate Database v1.2 (2024)
 *
 * Provides 2,700 food-product lifecycle emission factors across 5 countries
 * (DK/GB/FR/ES/NL), 16 categories, and 540+ unique products.
 * Builds O(1) lookup maps in useMemo and exposes helpers for filtering,
 * searching, comparison, statistics, and breakdown extraction.
 *
 * Source: CONCITO / 2-0 LCA, CC-BY license.
 * Units: tCO2e per tonne of product.
 */
import React, { createContext, useContext, useMemo } from 'react';
import products from '../data/big-climate-db.json';

const BigClimateDbContext = createContext(null);

/* ------------------------------------------------------------------ */
/*  Country metadata                                                   */
/* ------------------------------------------------------------------ */
const COUNTRY_META = [
  { code: 'DK', label: 'Denmark' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'NL', label: 'Netherlands' },
];

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export function BigClimateDbProvider({ children }) {

  /* --- O(1) lookup maps -------------------------------------------- */
  const idMap = useMemo(() => {
    const m = new Map();
    products.forEach(p => m.set(p.id, p));
    return m;
  }, []);

  const byCountry = useMemo(() => {
    const m = new Map();
    products.forEach(p => {
      if (!m.has(p.country)) m.set(p.country, []);
      m.get(p.country).push(p);
    });
    return m;
  }, []);

  const byCategory = useMemo(() => {
    const m = new Map();
    products.forEach(p => {
      if (!m.has(p.category)) m.set(p.category, []);
      m.get(p.category).push(p);
    });
    return m;
  }, []);

  const byName = useMemo(() => {
    const m = new Map();
    products.forEach(p => {
      if (!m.has(p.name)) m.set(p.name, []);
      m.get(p.name).push(p);
    });
    return m;
  }, []);

  /* --- derived constants ------------------------------------------- */
  const categories = useMemo(() => [...byCategory.keys()].sort(), [byCategory]);

  /* --- helpers ------------------------------------------------------ */
  const getProduct = (id) => idMap.get(id) || null;

  const getProductsByCountry = (code) => byCountry.get(code) || [];

  const getProductsByCategory = (cat) => byCategory.get(cat) || [];

  const searchProducts = (query) => {
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  };

  const getProductComparison = (productName) => {
    return byName.get(productName) || [];
  };

  const getCategoryStats = (category, country) => {
    let subset = byCategory.get(category) || [];
    if (country) subset = subset.filter(p => p.country === country);
    const n = subset.length;
    if (n === 0) return { count: 0, avgTotal: 0, minTotal: 0, maxTotal: 0, avgAgriculture: 0, avgTransport: 0, avgPackaging: 0 };
    const sum = (arr, key) => arr.reduce((s, p) => s + (p[key] || 0), 0);
    return {
      count: n,
      avgTotal:       sum(subset, 'total') / n,
      minTotal:       Math.min(...subset.map(p => p.total)),
      maxTotal:       Math.max(...subset.map(p => p.total)),
      avgAgriculture: sum(subset, 'agriculture') / n,
      avgTransport:   sum(subset, 'transport') / n,
      avgPackaging:   sum(subset, 'packaging') / n,
    };
  };

  const getTopEmitters = (country, limit = 10) => {
    const subset = country ? (byCountry.get(country) || []) : products;
    return [...subset].sort((a, b) => b.total - a.total).slice(0, limit);
  };

  const getLowestEmitters = (country, limit = 10) => {
    const subset = country ? (byCountry.get(country) || []) : products;
    return [...subset].sort((a, b) => a.total - b.total).slice(0, limit);
  };

  const getBreakdown = (id) => {
    const p = idMap.get(id);
    if (!p) return [];
    return [
      { phase: 'Agriculture', value: p.agriculture },
      { phase: 'iLUC', value: p.iluc },
      { phase: 'Processing', value: p.processing },
      { phase: 'Packaging', value: p.packaging },
      { phase: 'Transport', value: p.transport },
      { phase: 'Retail', value: p.retail },
    ];
  };

  /* --- summary stats ------------------------------------------------ */
  const stats = useMemo(() => ({
    totalProducts:  products.length,
    uniqueProducts: byName.size,
    countries:      COUNTRY_META.length,
    categories:     categories.length,
  }), [byName, categories]);

  /* --- context value ------------------------------------------------ */
  const value = useMemo(() => ({
    products,
    countries: COUNTRY_META,
    categories,
    getProduct,
    getProductsByCountry,
    getProductsByCategory,
    searchProducts,
    getProductComparison,
    getCategoryStats,
    getTopEmitters,
    getLowestEmitters,
    getBreakdown,
    stats,
    version: 'v1.2 (2024)',
    attribution: 'CONCITO / 2-0 LCA, CC-BY',
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [categories, stats]);

  return (
    <BigClimateDbContext.Provider value={value}>
      {children}
    </BigClimateDbContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useBigClimateDb() {
  const ctx = useContext(BigClimateDbContext);
  if (!ctx) throw new Error('useBigClimateDb must be used within BigClimateDbProvider');
  return ctx;
}

export default BigClimateDbContext;
