import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie, ScatterChart, Scatter, ZAxis,
} from 'recharts';

// ============================================================================
// Asset-Level Exposure Explorer
// Per-building physical climate exposure: real landmark building extract →
// floor-area replacement-value proxy → hazard pricing via the wired E104
// physical-risk-pricing engine (POST /api/v1/physical-risk-pricing/price).
//
// DATA HONESTY: the 26 buildings below are REAL, verifiable landmark
// commercial buildings. Coordinates and gross floor areas are approximate
// published figures (± tolerance) — an illustrative real-building sample.
// Production replaces this with Google / Microsoft / Overture open building
// footprints (ODbL / CC-BY) at full-city scale.
// ============================================================================

const API = 'http://localhost:8001';
const PRP_API = `${API}/api/v1/physical-risk-pricing`;
const OM_API = `${API}/api/v1/open-meteo`;
const GPR_API = `${API}/api/v1/global-physical-risk`;

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

// ---------------------------------------------------------------------------
// Replacement-value proxy: GFA (m²) × occupancy-class base rate × city factor.
// Base $/m² anchored to Turner & Townsend International Construction Market
// Survey 2024 typical hard-cost ranges (prime high-rise office / shopping
// centre) and T&T Data Centre Cost Index 2024 (shell + M&E fit-out).
// City factors: relative construction-cost indices (same survey family).
// This is a REPLACEMENT-COST proxy (rebuild), not market value.
// ---------------------------------------------------------------------------
const OCCUPANCY_CLASSES = {
  office: { label: 'Office (prime high-rise)', baseUsdM2: 3800, color: T.indigo },
  retail: { label: 'Retail / shopping centre', baseUsdM2: 2600, color: T.amber },
  mixed: { label: 'Mixed-use tower', baseUsdM2: 3400, color: T.teal },
  data_center: { label: 'Data centre (incl. M&E)', baseUsdM2: 9500, color: T.purple },
};

const CITY_COST_FACTOR = {
  Miami: 1.00, Houston: 0.92, 'New York': 1.35, 'Secaucus (NJ)': 1.20,
  London: 1.25, Rotterdam: 1.05, Mumbai: 0.45, Singapore: 1.05,
  Tokyo: 1.20, Sydney: 1.15, Toronto: 1.10, Frankfurt: 1.10, Paris: 1.15,
};

// Illustrative real-building sample — 26 real, verifiable landmark commercial
// buildings. GFA figures are approximate published values (rounded);
// coordinates approximate. Production = Google/Microsoft/Overture footprints (ODbL).
const BUILDINGS = [
  // — United States —
  { id: 1, name: 'Southeast Financial Center', city: 'Miami', countryIso: 'USA', countryName: 'United States', lat: 25.7742, lng: -80.1878, occupancy: 'office', gfaM2: 110000 },
  { id: 2, name: 'Miami Tower', city: 'Miami', countryIso: 'USA', countryName: 'United States', lat: 25.7738, lng: -80.1900, occupancy: 'office', gfaM2: 56000 },
  { id: 3, name: 'Brickell City Centre (retail podium)', city: 'Miami', countryIso: 'USA', countryName: 'United States', lat: 25.7616, lng: -80.1938, occupancy: 'retail', gfaM2: 46000 },
  { id: 4, name: 'JPMorgan Chase Tower', city: 'Houston', countryIso: 'USA', countryName: 'United States', lat: 29.7604, lng: -95.3632, occupancy: 'office', gfaM2: 186000 },
  { id: 5, name: 'Wells Fargo Plaza', city: 'Houston', countryIso: 'USA', countryName: 'United States', lat: 29.7580, lng: -95.3654, occupancy: 'office', gfaM2: 160000 },
  { id: 6, name: 'Williams Tower', city: 'Houston', countryIso: 'USA', countryName: 'United States', lat: 29.7369, lng: -95.4613, occupancy: 'office', gfaM2: 139000 },
  { id: 7, name: 'One World Trade Center', city: 'New York', countryIso: 'USA', countryName: 'United States', lat: 40.7127, lng: -74.0134, occupancy: 'office', gfaM2: 325000 },
  { id: 8, name: 'Empire State Building', city: 'New York', countryIso: 'USA', countryName: 'United States', lat: 40.7484, lng: -73.9857, occupancy: 'office', gfaM2: 257000 },
  { id: 9, name: 'Equinix NY4 (Secaucus)', city: 'Secaucus (NJ)', countryIso: 'USA', countryName: 'United States', lat: 40.7895, lng: -74.0703, occupancy: 'data_center', gfaM2: 31000 },
  // — United Kingdom —
  { id: 10, name: 'The Shard', city: 'London', countryIso: 'GBR', countryName: 'United Kingdom', lat: 51.5045, lng: -0.0865, occupancy: 'mixed', gfaM2: 110000 },
  { id: 11, name: '22 Bishopsgate', city: 'London', countryIso: 'GBR', countryName: 'United Kingdom', lat: 51.5142, lng: -0.0822, occupancy: 'office', gfaM2: 121000 },
  { id: 12, name: 'One Canada Square', city: 'London', countryIso: 'GBR', countryName: 'United Kingdom', lat: 51.5049, lng: -0.0195, occupancy: 'office', gfaM2: 111000 },
  { id: 13, name: 'Global Switch London East', city: 'London', countryIso: 'GBR', countryName: 'United Kingdom', lat: 51.5115, lng: -0.0021, occupancy: 'data_center', gfaM2: 38000 },
  // — Netherlands (Rotterdam) —
  { id: 14, name: 'De Rotterdam', city: 'Rotterdam', countryIso: 'NLD', countryName: 'Netherlands', lat: 51.9055, lng: 4.4884, occupancy: 'mixed', gfaM2: 162000 },
  { id: 15, name: 'Maastoren', city: 'Rotterdam', countryIso: 'NLD', countryName: 'Netherlands', lat: 51.9096, lng: 4.4936, occupancy: 'office', gfaM2: 65000 },
  // — India (Mumbai) —
  { id: 16, name: 'One BKC (Bandra Kurla Complex)', city: 'Mumbai', countryIso: 'IND', countryName: 'India', lat: 19.0653, lng: 72.8644, occupancy: 'office', gfaM2: 116000 },
  { id: 17, name: 'World Trade Centre Mumbai (Centre 1)', city: 'Mumbai', countryIso: 'IND', countryName: 'India', lat: 18.9067, lng: 72.8213, occupancy: 'office', gfaM2: 74000 },
  // — Singapore —
  { id: 18, name: 'Marina Bay Financial Centre Tower 3', city: 'Singapore', countryIso: 'SGP', countryName: 'Singapore', lat: 1.2790, lng: 103.8543, occupancy: 'office', gfaM2: 121000 },
  { id: 19, name: 'Ocean Financial Centre', city: 'Singapore', countryIso: 'SGP', countryName: 'Singapore', lat: 1.2836, lng: 103.8515, occupancy: 'office', gfaM2: 79000 },
  { id: 20, name: 'VivoCity', city: 'Singapore', countryIso: 'SGP', countryName: 'Singapore', lat: 1.2643, lng: 103.8222, occupancy: 'retail', gfaM2: 140000 },
  // — Japan (Tokyo) —
  { id: 21, name: 'Roppongi Hills Mori Tower', city: 'Tokyo', countryIso: 'JPN', countryName: 'Japan', lat: 35.6605, lng: 139.7292, occupancy: 'office', gfaM2: 380000 },
  { id: 22, name: 'Shibuya Scramble Square', city: 'Tokyo', countryIso: 'JPN', countryName: 'Japan', lat: 35.6585, lng: 139.7024, occupancy: 'mixed', gfaM2: 181000 },
  // — Australia / Canada / Germany / France —
  { id: 23, name: 'International Tower 1, Barangaroo', city: 'Sydney', countryIso: 'AUS', countryName: 'Australia', lat: -33.8636, lng: 151.2016, occupancy: 'office', gfaM2: 102000 },
  { id: 24, name: 'First Canadian Place', city: 'Toronto', countryIso: 'CAN', countryName: 'Canada', lat: 43.6489, lng: -79.3817, occupancy: 'office', gfaM2: 250000 },
  { id: 25, name: 'Commerzbank Tower', city: 'Frankfurt', countryIso: 'DEU', countryName: 'Germany', lat: 50.1106, lng: 8.6742, occupancy: 'office', gfaM2: 121000 },
  { id: 26, name: 'Tour First (La Défense)', city: 'Paris', countryIso: 'FRA', countryName: 'France', lat: 48.8909, lng: 2.2503, occupancy: 'office', gfaM2: 87000 },
];

const replacementValueUsd = (b) =>
  Math.round(b.gfaM2 * OCCUPANCY_CLASSES[b.occupancy].baseUsdM2 * (CITY_COST_FACTOR[b.city] || 1.0));

// Demo-only fallback (API offline): flat illustrative EAL rates in bps of
// replacement value per country, broadly ordered by NatCat exposure. These
// are ILLUSTRATIVE placeholders — clearly labeled — not engine output.
const DEMO_EAL_BPS = { USA: 18, GBR: 8, NLD: 9, IND: 25, SGP: 10, JPN: 22, AUS: 16, CAN: 10, DEU: 8, FRA: 9 };
const DEMO_PERIL_SHARE = { flood: 0.34, cyclone: 0.28, wildfire: 0.10, earthquake: 0.18, heatwave: 0.10 };

const PERILS = ['flood', 'cyclone', 'wildfire', 'earthquake', 'heatwave'];
const PERIL_COLORS = { flood: T.blue, cyclone: T.teal, wildfire: T.orange, earthquake: T.purple, heatwave: T.red };
const TIER_COLOR = { low: T.green, moderate: T.sage, elevated: T.amber, high: T.orange, very_high: T.red, extreme: '#7f1d1d' };

const SCENARIOS = [
  { key: 'orderly', label: 'Orderly (NZ2050)' },
  { key: 'disorderly', label: 'Disorderly (Delayed)' },
  { key: 'hot_house', label: 'Hot House World' },
];
const HORIZONS = ['2030', '2040', '2050'];

const fmtUsd = (v) => {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(v / 1e3).toFixed(0)}k`;
  return `$${Math.round(v)}`;
};

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.textPri, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

const TABS = ['Portfolio Overview', 'Building Table', 'Building Detail', 'Live Footprint Query (Overture)', 'Methodology & Data'];

const OVERTURE_API = `${API}/api/v1/overture-buildings`;

// Bounding box from a center point + radius (km) — simple equirectangular
// approximation, adequate for the small (<~50km) query radii this panel
// supports.
const bboxFromRadius = (lat, lon, radiusKm) => {
  const dLat = radiusKm / 111.32;
  const dLon = radiusKm / (111.32 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
  return { min_lon: lon - dLon, max_lon: lon + dLon, min_lat: lat - dLat, max_lat: lat + dLat };
};

export default function AssetExposureExplorerPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('hot_house');
  const [horizon, setHorizon] = useState('2050');
  const [filterCity, setFilterCity] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [selectedId, setSelectedId] = useState(BUILDINGS[0].id);

  // --- Live wiring: price every building through the E104 engine -----------
  const [priced, setPriced] = useState(null); // Map id -> engine response
  const [status, setStatus] = useState('loading'); // 'loading' | 'live' | 'demo'

  // --- Real building-footprint query (Overture Maps, additive) --------------
  // Queries real Overture footprints near a location and feeds them through
  // the SAME replacement-value -> physical-risk-pricing pipeline as the
  // hand-authored BUILDINGS sample above. Does not touch/replace BUILDINGS.
  const [queryLat, setQueryLat] = useState(String(BUILDINGS[0].lat));
  const [queryLng, setQueryLng] = useState(String(BUILDINGS[0].lng));
  const [queryRadiusKm, setQueryRadiusKm] = useState('1.5');
  const [queryCountryIso, setQueryCountryIso] = useState(BUILDINGS[0].countryIso);
  const [queryOccupancy, setQueryOccupancy] = useState('office');
  const [queryLimit, setQueryLimit] = useState('25');
  const [overtureState, setOvertureState] = useState({ status: 'idle', data: null, error: null });
  const [overturePriced, setOverturePriced] = useState(null); // Map overture id -> priced row

  const runOvertureQuery = async () => {
    setOvertureState({ status: 'loading', data: null, error: null });
    setOverturePriced(null);
    try {
      const lat = parseFloat(queryLat), lng = parseFloat(queryLng), radius = parseFloat(queryRadiusKm);
      const { min_lon, max_lon, min_lat, max_lat } = bboxFromRadius(lat, lng, Math.max(0.1, radius || 1));
      const { data } = await axios.get(`${OVERTURE_API}/footprints`, {
        params: { min_lon, min_lat, max_lon, max_lat, limit: Math.max(1, parseInt(queryLimit, 10) || 25), timeout_seconds: 60 },
        timeout: 75000,
      });
      setOvertureState({ status: 'live', data, error: null });

      // Feed the found footprints through the same replacement-value proxy +
      // physical-risk-pricing engine the hand-authored sample uses.
      const withValue = (data.buildings || []).map((b) => {
        const gfaM2 = b.area_m2 || 0;
        const value = Math.round(gfaM2 * OCCUPANCY_CLASSES[queryOccupancy].baseUsdM2 * (CITY_COST_FACTOR[b.city] || 1.0));
        return { ...b, gfaM2, value };
      });
      if (withValue.length > 0) {
        const priceResults = await Promise.allSettled(withValue.map((b) =>
          axios.post(`${PRP_API}/price`, {
            entity_id: `OVT-${b.id}`,
            asset_class: 'property',
            country_iso: queryCountryIso,
            asset_value_usd: b.value,
            ngfs_scenario: scenario,
            time_horizon: horizon,
            lat: b.lat,
            lng: b.lon,
          }, { timeout: 20000 }).then((r) => [b.id, r.data])
        ));
        const map = new Map(
          priceResults
            .filter((r) => r.status === 'fulfilled' && r.value[1] && !r.value[1].error && r.value[1].expected_annual_loss_usd != null)
            .map((r) => r.value)
        );
        setOverturePriced(map);
      }
    } catch (e) {
      setOvertureState({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  };

  const overtureRows = useMemo(() => {
    if (!overtureState.data) return [];
    return (overtureState.data.buildings || []).map((b) => {
      const gfaM2 = b.area_m2 || 0;
      const value = Math.round(gfaM2 * OCCUPANCY_CLASSES[queryOccupancy].baseUsdM2 * (CITY_COST_FACTOR[b.city] || 1.0));
      const live = overturePriced?.get(b.id);
      if (live) {
        return { ...b, gfaM2, value, eal: live.expected_annual_loss_usd, tier: live.risk_tier, priced: true };
      }
      const eal = value * (DEMO_EAL_BPS[queryCountryIso] || 12) / 10000;
      return { ...b, gfaM2, value, eal, tier: 'n/a', priced: false };
    });
  }, [overtureState.data, overturePriced, queryOccupancy, queryCountryIso]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const results = await Promise.all(BUILDINGS.map(b =>
          axios.post(`${PRP_API}/price`, {
            entity_id: `BLDG-${b.id}`,
            asset_class: 'property',
            country_iso: b.countryIso,
            asset_value_usd: replacementValueUsd(b),
            ngfs_scenario: scenario,
            time_horizon: horizon,
            lat: b.lat,
            lng: b.lng,
          }, { timeout: 20000 }).then(r => [b.id, r.data])
        ));
        if (cancelled) return;
        const map = new Map(results.filter(([, d]) => d && !d.error && d.expected_annual_loss_usd != null));
        if (map.size > 0) { setPriced(map); setStatus('live'); }
        else setStatus('demo');
      } catch (e) {
        if (!cancelled) { setPriced(null); setStatus('demo'); }
      }
    })();
    return () => { cancelled = true; };
  }, [scenario, horizon]);

  // --- Real current + historical weather context check (Open-Meteo) --------
  // Additive, independent panel: fetches the selected building's real current
  // conditions and real historical extremes as a real-world sanity check
  // alongside the modeled EAL from the physical-risk-pricing engine above.
  const [weather, setWeather] = useState({ status: 'idle', current: null, historical: null, error: null, buildingId: null });

  // --- Global Physical Risk Engine composite-score cross-check (additive) --
  // NEW section (does not touch the Overture or Open-Meteo panels above/below).
  // Calls the new digital-twin point-profile endpoint for the selected
  // building's lat/lng and surfaces its composite score next to the existing
  // EAL/PML figures as an independent cross-check. Degrades gracefully — the
  // endpoint may not exist yet depending on ingestion/build progress.
  const [gprCheck, setGprCheck] = useState({ status: 'idle', data: null, error: null, buildingId: null });

  useEffect(() => {
    if (tab !== 2) return; // only fetch when the Building Detail tab is visible
    const b = BUILDINGS.find(x => x.id === selectedId) || BUILDINGS[0];
    let cancelled = false;
    setGprCheck(g => ({ ...g, status: 'loading' }));
    (async () => {
      try {
        const { data } = await axios.post(`${GPR_API}/point-profile`, { lat: b.lat, lon: b.lng, radius_km: 25 }, { timeout: 20000 });
        if (!cancelled) setGprCheck({ status: 'live', data, error: null, buildingId: b.id });
      } catch (e) {
        if (!cancelled) setGprCheck({ status: 'unavailable', data: null, error: e?.response?.data?.detail || e.message, buildingId: b.id });
      }
    })();
    return () => { cancelled = true; };
  }, [tab, selectedId]);

  useEffect(() => {
    if (tab !== 2) return; // only fetch when the Building Detail tab is visible
    const b = BUILDINGS.find(x => x.id === selectedId) || BUILDINGS[0];
    let cancelled = false;
    setWeather(w => ({ ...w, status: 'loading' }));
    (async () => {
      try {
        const [cur, hist] = await Promise.all([
          axios.get(`${OM_API}/current-weather`, { params: { lat: b.lat, lon: b.lng }, timeout: 15000 }),
          axios.get(`${OM_API}/historical-extremes`, { params: { lat: b.lat, lon: b.lng, start_year: 2010, end_year: 2024 }, timeout: 20000 }),
        ]);
        if (cancelled) return;
        setWeather({ status: 'live', current: cur.data, historical: hist.data, error: null, buildingId: b.id });
      } catch (e) {
        if (!cancelled) setWeather({ status: 'demo', current: null, historical: null, error: e?.response?.data?.error?.message || e.message, buildingId: b.id });
      }
    })();
    return () => { cancelled = true; };
  }, [tab, selectedId]);

  // Merge engine output (live) or the labeled illustrative fallback (demo)
  const rows = useMemo(() => BUILDINGS.map(b => {
    const value = replacementValueUsd(b);
    const live = priced?.get(b.id);
    if (live) {
      return {
        ...b, value,
        eal: live.expected_annual_loss_usd,
        pml100: live.pml_100yr_usd,
        var95: live.climate_var_95pct_usd,
        insGap: live.insurance_gap_usd,
        premiumBps: live.risk_premium_bps,
        tier: live.risk_tier,
        composite: live.composite_physical_risk_score,
        perilPml: Object.fromEntries(PERILS.map(p => [p, live.acute_peril_breakdown?.[p]?.pml_100yr_usd || 0])),
        chronic: live.chronic_stressor_breakdown,
        live: true,
      };
    }
    const eal = value * (DEMO_EAL_BPS[b.countryIso] || 12) / 10000;
    return {
      ...b, value, eal,
      pml100: eal * 18, var95: eal * 6, insGap: eal * 0.5,
      premiumBps: null, tier: 'n/a', composite: null,
      perilPml: Object.fromEntries(PERILS.map(p => [p, eal * 18 * DEMO_PERIL_SHARE[p]])),
      chronic: null,
      live: false,
    };
  }), [priced]);

  const cities = useMemo(() => ['All', ...Array.from(new Set(BUILDINGS.map(b => b.city)))], []);
  const filteredRows = useMemo(() => rows.filter(r =>
    (filterCity === 'All' || r.city === filterCity) &&
    (filterClass === 'All' || r.occupancy === filterClass)
  ), [rows, filterCity, filterClass]);

  // --- Aggregations ---------------------------------------------------------
  const agg = useMemo(() => {
    const n = filteredRows.length;
    const totalValue = filteredRows.reduce((a, r) => a + r.value, 0);
    const totalEal = filteredRows.reduce((a, r) => a + r.eal, 0);
    const totalVar = filteredRows.reduce((a, r) => a + r.var95, 0);
    const totalGap = filteredRows.reduce((a, r) => a + r.insGap, 0);
    return {
      n, totalValue, totalEal, totalVar, totalGap,
      ealBps: totalValue > 0 ? (totalEal / totalValue) * 10000 : 0,
    };
  }, [filteredRows]);

  const topExposures = useMemo(() =>
    [...filteredRows].sort((a, b) => b.eal - a.eal).slice(0, 10)
      .map(r => ({ name: r.name.length > 22 ? `${r.name.slice(0, 21)}…` : r.name, eal: Math.round(r.eal), city: r.city })),
  [filteredRows]);

  const perilBreakdown = useMemo(() => PERILS.map(p => ({
    peril: p.charAt(0).toUpperCase() + p.slice(1),
    pml: Math.round(filteredRows.reduce((a, r) => a + (r.perilPml[p] || 0), 0)),
    key: p,
  })), [filteredRows]);

  const byCity = useMemo(() => {
    const m = new Map();
    filteredRows.forEach(r => {
      const cur = m.get(r.city) || { city: r.city, eal: 0, value: 0 };
      cur.eal += r.eal; cur.value += r.value;
      m.set(r.city, cur);
    });
    return [...m.values()].map(c => ({ ...c, eal: Math.round(c.eal), ealBps: c.value > 0 ? +((c.eal / c.value) * 10000).toFixed(1) : 0 }));
  }, [filteredRows]);

  const scatterData = useMemo(() => filteredRows.map(r => ({
    x: +(r.value / 1e6).toFixed(1),
    y: r.value > 0 ? +((r.eal / r.value) * 10000).toFixed(1) : 0,
    z: Math.round(r.eal),
    name: r.name,
  })), [filteredRows]);

  const selected = rows.find(r => r.id === selectedId) || rows[0];
  const selPerilData = useMemo(() => PERILS.map(p => ({
    peril: p.charAt(0).toUpperCase() + p.slice(1),
    pml100: Math.round(selected?.perilPml?.[p] || 0),
    key: p,
  })), [selected]);

  const selPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };
  const th = { padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
  const td = { padding: '7px 10px', borderBottom: `1px solid ${T.borderL}`, whiteSpace: 'nowrap' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>ASSET-LEVEL EXPOSURE EXPLORER · E104 PHYSICAL RISK PRICING</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Asset-Level Exposure Explorer</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              26 real landmark buildings · footprint → replacement-value proxy → per-asset hazard pricing (EAL / PML₁₀₀ / Climate VaR)
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {status === 'loading' && <Badge val="Connecting to Physical Risk Pricing Engine…" color="#94a3b8" bg="#1e293b" />}
              {status === 'live' && <Badge val="● Live — priced per-asset by /api/v1/physical-risk-pricing (NGFS amplifiers · Swiss Re protection gaps)" color="#166534" bg="#dcfce7" />}
              {status === 'demo' && <Badge val="○ Demo — pricing engine unreachable; showing labeled illustrative EAL rates (not engine output)" color="#92400e" bg="#fef3c7" />}
              <Badge val="Buildings: illustrative real-building sample — production = Google/Microsoft/Overture footprints (ODbL)" color="#3730a3" bg="#e0e7ff" />
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{BUILDINGS.length} real buildings · {cities.length - 1} cities</div>
            <div>Replacement value: {fmtUsd(rows.reduce((a, r) => a + r.value, 0))}</div>
            <div>Scenario: {scenario} · {horizon}</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', overflowX: 'auto', padding: '0 24px' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '13px 18px', border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600, color: tab === i ? T.indigo : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Scenario / filter bar (all tabs) */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>NGFS scenario</span>
          <select style={selPx} value={scenario} onChange={e => setScenario(e.target.value)}>
            {SCENARIOS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>Horizon</span>
          <select style={selPx} value={horizon} onChange={e => setHorizon(e.target.value)}>
            {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginLeft: 12 }}>City</span>
          <select style={selPx} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>Occupancy</span>
          <select style={selPx} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="All">All</option>
            {Object.entries(OCCUPANCY_CLASSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: T.textSec }}>{filteredRows.length} of {BUILDINGS.length} buildings</span>
        </div>

        {/* TAB 0 — Portfolio Overview */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Portfolio Replacement Value" value={fmtUsd(agg.totalValue)} sub={`${agg.n} buildings — GFA × class rate × city factor`} accent={T.indigo} />
              <KpiCard label="Portfolio EAL" value={fmtUsd(agg.totalEal)} sub={`${agg.ealBps.toFixed(1)} bps of replacement value / yr`} accent={T.red} />
              <KpiCard label="Climate VaR (95%)" value={fmtUsd(agg.totalVar)} sub={`${scenario} · ${horizon} (engine tail metric)`} accent={T.orange} />
              <KpiCard label="Insurance Protection Gap" value={fmtUsd(agg.totalGap)} sub="Uninsured share of EAL (Swiss Re sigma ratios)" accent={T.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Top 10 Exposures by EAL" sub={status === 'live' ? 'Engine expected annual loss per building' : 'Illustrative demo rates — engine offline'} />
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topExposures} layout="vertical" margin={{ left: 130 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tickFormatter={fmtUsd} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                    <Tooltip formatter={(v) => fmtUsd(v)} />
                    <Bar dataKey="eal" name="EAL (USD/yr)" fill={T.red} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Peril Contribution — PML₁₀₀ by Acute Peril" sub="Sum of per-building 100yr probable maximum loss by peril" />
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={perilBreakdown} dataKey="pml" nameKey="peril" cx="50%" cy="50%" outerRadius={105} label={(e) => `${e.peril}: ${fmtUsd(e.pml)}`}>
                      {perilBreakdown.map((p) => <Cell key={p.key} fill={PERIL_COLORS[p.key]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtUsd(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="EAL Intensity by City" sub="EAL as bps of replacement value — geography drives the hazard score" />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byCity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'EAL bps', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="ealBps" name="EAL (bps of value)" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Value vs Risk Intensity" sub="Bubble size = EAL. Large + high-bps assets dominate portfolio loss." />
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" dataKey="x" name="Value ($M)" tick={{ fontSize: 11 }} label={{ value: 'Replacement value ($M)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" name="EAL bps" tick={{ fontSize: 11 }} label={{ value: 'EAL bps', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <ZAxis type="number" dataKey="z" range={[40, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => n === 'EAL bps' ? v : v} labelFormatter={() => ''} content={({ payload }) => payload?.length ? (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 12 }}>
                        <b>{payload[0].payload.name}</b><br />Value: ${payload[0].payload.x}M · EAL: {fmtUsd(payload[0].payload.z)} ({payload[0].payload.y} bps)
                      </div>
                    ) : null} />
                    <Scatter data={scatterData} fill={T.teal} fillOpacity={0.75} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1 — Building Table */}
        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textSec }}>
              GFA figures are approximate published values (illustrative real-building sample). Click a row for detail.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead style={{ background: T.sub }}>
                  <tr>
                    {['Building', 'City', 'Country', 'Occupancy', 'GFA (m²)', 'Repl. Value', 'Risk Tier', 'EAL', 'EAL bps', 'PML₁₀₀', 'VaR 95%', 'Ins. Gap', 'Premium (bps)'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredRows].sort((a, b) => b.eal - a.eal).map(r => (
                    <tr key={r.id} onClick={() => { setSelectedId(r.id); setTab(2); }} style={{ cursor: 'pointer', background: r.id === selectedId ? '#eef2ff' : 'white' }}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.name}</td>
                      <td style={td}>{r.city}</td>
                      <td style={td}>{r.countryIso}</td>
                      <td style={td}>{OCCUPANCY_CLASSES[r.occupancy].label.split(' (')[0]}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{r.gfaM2.toLocaleString()}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{fmtUsd(r.value)}</td>
                      <td style={td}>{r.tier === 'n/a' ? <Badge val="demo" color="#92400e" bg="#fef3c7" /> : <Badge val={r.tier} color="#fff" bg={TIER_COLOR[r.tier] || T.textSec} />}</td>
                      <td style={{ ...td, fontFamily: T.fontMono, color: T.red, fontWeight: 600 }}>{fmtUsd(r.eal)}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{r.value > 0 ? ((r.eal / r.value) * 10000).toFixed(1) : '—'}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{fmtUsd(r.pml100)}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{fmtUsd(r.var95)}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{fmtUsd(r.insGap)}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{r.premiumBps != null ? r.premiumBps : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2 — Building Detail */}
        {tab === 2 && selected && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>Building</span>
              <select style={{ ...selPx, minWidth: 320 }} value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}>
                {rows.map(r => <option key={r.id} value={r.id}>{r.name} — {r.city}</option>)}
              </select>
              <span style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>
                {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)} · {selected.countryName} · {OCCUPANCY_CLASSES[selected.occupancy].label}
              </span>
              {selected.live
                ? <Badge val="● Live engine pricing" color="#166534" bg="#dcfce7" />
                : <Badge val="○ Demo illustrative figures" color="#92400e" bg="#fef3c7" />}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Replacement Value" value={fmtUsd(selected.value)} sub={`${selected.gfaM2.toLocaleString()} m² × $${OCCUPANCY_CLASSES[selected.occupancy].baseUsdM2}/m² × ${(CITY_COST_FACTOR[selected.city] || 1).toFixed(2)}`} accent={T.indigo} />
              <KpiCard label="Expected Annual Loss" value={fmtUsd(selected.eal)} sub={selected.value > 0 ? `${((selected.eal / selected.value) * 10000).toFixed(1)} bps of value` : ''} accent={T.red} />
              <KpiCard label="PML 100yr / VaR 95%" value={`${fmtUsd(selected.pml100)} / ${fmtUsd(selected.var95)}`} sub={`Scenario ${scenario} · ${horizon}`} accent={T.orange} />
              <KpiCard label="Risk Tier / Premium" value={selected.tier === 'n/a' ? '—' : selected.tier} sub={selected.premiumBps != null ? `+${selected.premiumBps} bps physical-risk spread` : 'engine offline'} accent={TIER_COLOR[selected.tier] || T.textSec} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Acute Peril PML₁₀₀ Breakdown" sub="100yr loss per peril: baseline × NGFS amplifier × vulnerability × value" />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selPerilData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="peril" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={fmtUsd} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => fmtUsd(v)} />
                    <Bar dataKey="pml100" name="PML 100yr" radius={[4, 4, 0, 0]}>
                      {selPerilData.map(p => <Cell key={p.key} fill={PERIL_COLORS[p.key]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Chronic Stressors" sub="Baseline vs scenario-amplified chronic scores (0–1)" />
                {selected.chronic ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: T.sub }}>
                      <tr>{['Stressor', 'Baseline', 'Amplified', 'Δ'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {Object.entries(selected.chronic).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ ...td, fontWeight: 600 }}>{k.replace(/_/g, ' ')}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{Number(v.baseline_score).toFixed(3)}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{Number(v.amplified_score).toFixed(3)}</td>
                          <td style={{ ...td, fontFamily: T.fontMono, color: v.amplified_score > v.baseline_score ? T.red : T.green }}>
                            {(v.amplified_score - v.baseline_score >= 0 ? '+' : '') + (v.amplified_score - v.baseline_score).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: 13, color: T.textSec, padding: 16 }}>
                    Chronic stressor detail requires the live engine (demo mode active).
                  </div>
                )}
                <div style={{ marginTop: 14, fontSize: 12, color: T.textSec, background: T.sub, borderRadius: 8, padding: 12 }}>
                  Insurance protection gap for this asset: <b style={{ color: T.textPri }}>{fmtUsd(selected.insGap)}</b> of EAL uninsured
                  (country-peril insured ratios from Swiss Re sigma 1/2024 via the engine reference tables).
                </div>
              </div>
            </div>

            {/* Real current + historical weather — a real-world context check alongside the modeled EAL above.
                Independent of the E104 pricing engine; sourced live from Open-Meteo per building lat/lng. */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <SectionH title="Real Current + Historical Weather — Context Check" sub="Open-Meteo live conditions & 2010–2024 empirical extremes at this building's lat/lng (independent of the modeled EAL)" />
                <div style={{ marginLeft: 'auto' }}>
                  {weather.status === 'loading' && <Badge val="Connecting to Open-Meteo…" color="#94a3b8" bg="#1e293b" />}
                  {weather.status === 'live' && <Badge val="● Live — Open-Meteo free/keyless tier (non-commercial; set OPEN_METEO_API_KEY for licensed commercial use)" color="#166534" bg="#dcfce7" />}
                  {weather.status === 'demo' && <Badge val={`○ Open-Meteo unreachable — ${weather.error || 'no data shown'}`} color="#92400e" bg="#fef3c7" />}
                </div>
              </div>
              {weather.status === 'live' && weather.buildingId === selected.id ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <KpiCard label="Current Temperature" value={weather.current.temperature_c != null ? `${weather.current.temperature_c.toFixed(1)}°C` : '—'}
                    sub={`Obs. ${weather.current.observation_time || '—'} UTC`} accent={T.blue} />
                  <KpiCard label="Current Wind / Precip" value={`${weather.current.wind_speed_kmh?.toFixed(0) ?? '—'} km/h`}
                    sub={`Precip now ${weather.current.precipitation_mm ?? '—'} mm · gusts ${weather.current.wind_gusts_kmh?.toFixed(0) ?? '—'} km/h`} accent={T.teal} />
                  <KpiCard label="Historical Max Temp (2010–24)" value={weather.historical.extremes?.max_temperature_c != null ? `${weather.historical.extremes.max_temperature_c.toFixed(1)}°C` : '—'}
                    sub={weather.historical.extremes?.max_temperature_date || '—'} accent={T.red} />
                  <KpiCard label="Historical Max Wind / Rain" value={`${weather.historical.extremes?.max_daily_wind_speed_kmh?.toFixed(0) ?? '—'} km/h`}
                    sub={`Max daily precip ${weather.historical.extremes?.max_daily_precipitation_mm ?? '—'} mm (${weather.historical.extremes?.max_daily_precipitation_date || '—'})`} accent={T.orange} />
                </div>
              ) : (
                <div style={{ fontSize: 13, color: T.textSec, padding: 8 }}>
                  {weather.status === 'demo'
                    ? 'Real weather context unavailable right now — the modeled EAL above is unaffected (it comes from the separate physical-risk-pricing engine).'
                    : 'Loading real current conditions and 2010–2024 historical extremes for this building’s coordinates…'}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 11.5, color: T.textSec, fontFamily: T.fontMono }}>
                GET /api/v1/open-meteo/current-weather · /historical-extremes — real Open-Meteo data, not a modeled output.
                This panel is a real-world sanity check next to the engine's modeled EAL/PML above; it does not feed back into the pricing calculation.
              </div>
            </div>

            {/* Global Physical Risk Engine composite-score cross-check — NEW, additive.
                Independent of the E104 pricing engine and the Open-Meteo panel above;
                does not feed back into the EAL/PML figures, purely a second-opinion check. */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <SectionH title="Global Physical Risk Engine — Composite Score Cross-Check" sub="Independent digital-twin multi-hazard composite score for this building's coordinates (does not feed the EAL/PML above)" />
                <div style={{ marginLeft: 'auto' }}>
                  {gprCheck.status === 'loading' && <Badge val="Connecting to Global Physical Risk Engine…" color="#94a3b8" bg="#1e293b" />}
                  {gprCheck.status === 'live' && <Badge val="● Live — /api/v1/global-physical-risk/point-profile" color="#166534" bg="#dcfce7" />}
                  {gprCheck.status === 'unavailable' && <Badge val="○ Engine not yet available" color="#92400e" bg="#fef3c7" />}
                </div>
              </div>
              {gprCheck.status === 'live' && gprCheck.buildingId === selected.id && gprCheck.data ? (
                (() => {
                  const d = gprCheck.data;
                  const composite = d.composite_score ?? d.compositeScore ?? null;
                  const availability = d.data_availability || d.dataAvailability || null;
                  const availCount = availability && typeof availability === 'object' ? Object.values(availability).filter(v => v === true || v === 'real' || v === 'available').length : null;
                  const availTotal = availability && typeof availability === 'object' ? Object.keys(availability).length : null;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                      <KpiCard label="Composite Physical Risk Score" value={composite != null ? Number(composite).toFixed(1) : '—'} sub="0-100, independent digital-twin engine" accent={T.purple} />
                      <KpiCard label="vs Modeled Risk Tier (E104)" value={selected.tier === 'n/a' ? '—' : selected.tier} sub="Cross-reference only — different engines, not reconciled" accent={TIER_COLOR[selected.tier] || T.textSec} />
                      <KpiCard label="Hazard Layers with Real Data" value={availTotal != null ? `${availCount} / ${availTotal}` : '—'} sub="data_availability reported by the engine" accent={T.teal} />
                    </div>
                  );
                })()
              ) : (
                <div style={{ fontSize: 13, color: T.textSec, padding: 8 }}>
                  {gprCheck.status === 'unavailable'
                    ? `Global Physical Risk Engine not yet available${gprCheck.error ? ` (${gprCheck.error})` : ''} — the E104 EAL/PML figures above are unaffected; nothing fabricated in its place.`
                    : 'Loading independent composite risk score for this building’s coordinates…'}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 11.5, color: T.textSec, fontFamily: T.fontMono }}>
                POST /api/v1/global-physical-risk/point-profile — a separate digital-twin engine queried purely as a
                cross-check alongside the E104 physical-risk-pricing EAL/PML/tier above; the two are not reconciled or averaged.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Live Footprint Query (Overture) */}
        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionH title="Query Real Building Footprints Near a Location" sub="Overture Maps buildings theme — public, keyless S3 Parquet (no hosted query API exists); real height/floor/footprint-area data, not fabricated" />
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 10 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Pick a sample building's coordinates
                  <select style={selPx} onChange={(e) => {
                    const b = BUILDINGS.find(x => x.id === Number(e.target.value));
                    if (b) { setQueryLat(String(b.lat)); setQueryLng(String(b.lng)); setQueryCountryIso(b.countryIso); }
                  }} defaultValue="">
                    <option value="" disabled>— choose —</option>
                    {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Latitude
                  <input style={{ ...selPx, width: 110 }} type="number" step="0.0001" value={queryLat} onChange={e => setQueryLat(e.target.value)} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Longitude
                  <input style={{ ...selPx, width: 110 }} type="number" step="0.0001" value={queryLng} onChange={e => setQueryLng(e.target.value)} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Radius (km)
                  <input style={{ ...selPx, width: 90 }} type="number" step="0.1" min="0.1" max="50" value={queryRadiusKm} onChange={e => setQueryRadiusKm(e.target.value)} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Country ISO-3 (for pricing)
                  <input style={{ ...selPx, width: 90 }} value={queryCountryIso} onChange={e => setQueryCountryIso(e.target.value.toUpperCase())} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Occupancy class (applied to results)
                  <select style={selPx} value={queryOccupancy} onChange={e => setQueryOccupancy(e.target.value)}>
                    {Object.entries(OCCUPANCY_CLASSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Max buildings
                  <input style={{ ...selPx, width: 80 }} type="number" min="1" max="200" value={queryLimit} onChange={e => setQueryLimit(e.target.value)} />
                </label>
                <button onClick={runOvertureQuery} disabled={overtureState.status === 'loading'} style={{
                  background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
                  fontSize: 13, fontWeight: 700, cursor: overtureState.status === 'loading' ? 'wait' : 'pointer',
                }}>
                  {overtureState.status === 'loading' ? 'Querying Overture (may take up to a minute)…' : 'Query real footprints →'}
                </button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {overtureState.status === 'idle' && <Badge val="Idle — enter a location and query" color={T.textSec} bg={T.sub} />}
                {overtureState.status === 'loading' && <Badge val="● Querying GET /api/v1/overture-buildings/footprints — Overture has no spatial index in S3, so a cold query can take up to a minute" color="#94a3b8" bg="#1e293b" />}
                {overtureState.status === 'demo' && <Badge val={`○ Overture query failed/unreachable — ${overtureState.error || 'no data'}`} color="#92400e" bg="#fef3c7" />}
                {overtureState.status === 'live' && overtureState.data && (
                  <>
                    <Badge
                      val={overtureState.data.count > 0 ? `● Live — ${overtureState.data.count} real footprint(s) found` : '● Live query completed — 0 footprints in range'}
                      color="#166534" bg="#dcfce7"
                    />
                    <Badge
                      val={overtureState.data.scan_complete
                        ? `Full bucket scanned (${overtureState.data.files_scanned}/${overtureState.data.files_total} files, release ${overtureState.data.release})`
                        : `Partial scan: ${overtureState.data.files_scanned}/${overtureState.data.files_total} of 512 part-files checked before the time budget — retry to continue from cache, or widen the radius`}
                      color="#3730a3" bg="#e0e7ff"
                    />
                  </>
                )}
              </div>
            </div>

            {overtureRows.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textSec }}>
                  Real Overture building footprints, fed through the same GFA × occupancy-rate replacement-value proxy and
                  <code style={{ fontFamily: T.fontMono, margin: '0 4px' }}>POST /api/v1/physical-risk-pricing/price</code> pipeline as the hand-authored sample.
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead style={{ background: T.sub }}>
                      <tr>
                        {['Overture ID', 'Lat', 'Lon', 'Class', 'Height (m)', 'Floors', 'Footprint area (m²)', 'Area basis', 'Repl. Value', 'Risk Tier', 'EAL'].map(h => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {overtureRows.map((r) => (
                        <tr key={r.id}>
                          <td style={{ ...td, fontFamily: T.fontMono, fontSize: 11 }}>{r.id}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.lat}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.lon}</td>
                          <td style={td}>{r.class || '—'}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.height != null ? r.height.toFixed(1) : '—'}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.num_floors ?? '—'}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.gfaM2 ? Math.round(r.gfaM2).toLocaleString() : '—'}</td>
                          <td style={{ ...td, fontSize: 11 }}>{r.area_basis === 'footprint_polygon' ? 'polygon (exact)' : 'bbox (upper bound)'}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{fmtUsd(r.value)}</td>
                          <td style={td}>{r.tier === 'n/a' ? <Badge val="demo" color="#92400e" bg="#fef3c7" /> : <Badge val={r.tier} color="#fff" bg={TIER_COLOR[r.tier] || T.textSec} />}</td>
                          <td style={{ ...td, fontFamily: T.fontMono, color: T.red, fontWeight: 600 }}>{fmtUsd(r.eal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
              <SectionH title="How This Panel Works" />
              <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.7 }}>
                <p style={{ marginTop: 0 }}>
                  This panel queries <b>real Overture Maps building footprints</b> (height, floor count, class, footprint
                  area) for a bounding box around your chosen point, via <code style={{ fontFamily: T.fontMono }}>GET /api/v1/overture-buildings/footprints</code>.
                  Overture has no hosted query API — the backend reads the public, keyless S3 Parquet buckets directly
                  (<code style={{ fontFamily: T.fontMono }}>pyarrow</code>, anonymous access). The buildings theme has no
                  spatial partitioning in the S3 key structure (512 flat part-files per release), so a cold query can take
                  up to a minute; results are cached so repeat queries for the same area are fast.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Found footprints feed the <b>same</b> replacement-value proxy (footprint area × occupancy base rate) and
                  physical-risk-pricing engine as the 26-building hand-authored sample elsewhere on this page — this is an
                  additive, Live/Demo-badged alternative data source, not a replacement for that sample.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — Methodology & Data */}
        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
              <SectionH title="Building Sample — Data Honesty" />
              <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.7 }}>
                <p style={{ marginTop: 0 }}>
                  The 26 buildings are <b>real, verifiable landmark commercial buildings</b> (office towers, malls,
                  data centres) in Miami, Houston, New York, London, Rotterdam, Mumbai, Singapore, Tokyo, Sydney,
                  Toronto, Frankfurt and Paris. Coordinates and gross floor areas are <b>approximate published
                  figures</b>, hand-authored for this module — an <b>illustrative real-building sample</b>.
                </p>
                <p>
                  Production replaces this seed with open building-footprint data at full-city scale:
                  <b> Google Open Buildings / Microsoft Building Footprints / Overture Maps</b> (ODbL / CC-BY),
                  which provide polygon footprints from which floor area is derived (footprint × estimated storeys).
                </p>
                <p style={{ marginBottom: 0 }}>
                  No figures on this page are randomly generated. In Demo mode (engine offline) the EAL columns
                  switch to flat, clearly-labeled illustrative country rates and are <b>not</b> engine output.
                </p>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22 }}>
              <SectionH title="Replacement-Value Proxy" sub="value = GFA (m²) × occupancy base rate × city cost factor" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
                <thead style={{ background: T.sub }}>
                  <tr>{['Occupancy class', 'Base rate ($/m²)', 'Basis'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {Object.entries(OCCUPANCY_CLASSES).map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ ...td, fontWeight: 600 }}>{v.label}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>${v.baseUsdM2.toLocaleString()}</td>
                      <td style={{ ...td, whiteSpace: 'normal', fontSize: 12, color: T.textSec }}>
                        {k === 'data_center'
                          ? 'Turner & Townsend Data Centre Cost Index 2024 (shell + M&E fit-out)'
                          : 'Turner & Townsend International Construction Market Survey 2024 (typical hard-cost range midpoint)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                City factors (0.45 Mumbai → 1.35 New York) are relative construction-cost indices from the same
                survey family. This proxies <b>rebuild cost</b>, the correct exposure basis for physical-damage
                modelling — not market/transaction value.
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22, gridColumn: '1 / span 2' }}>
              <SectionH title="Hazard Engine Wiring (Live mode)" />
              <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.7 }}>
                Each building is priced individually via <code style={{ fontFamily: T.fontMono, background: T.sub, padding: '1px 6px', borderRadius: 4 }}>POST /api/v1/physical-risk-pricing/price</code> with
                its country ISO-3, <code style={{ fontFamily: T.fontMono }}>asset_class: 'property'</code>, replacement value, lat/lng, and the selected NGFS scenario × horizon.
                The E104 engine returns composite risk score, EAL (trapezoidal EP-curve integration, 10–500yr),
                PML₁₀₀, Climate VaR 95%, insurance protection gap and risk-premium spread. Country baselines:
                INFORM Risk Index 2023 · ND-GAIN 2023 · Swiss Re CatNet · IPCC AR6; scenario amplifiers: NGFS CGFI Phase IV.
                Limitation: hazard scoring is <b>country-level</b> in this engine version — two Miami towers and a
                Houston tower differ by value and class, not micro-location; asset-level hazard layers (FEMA NFHL,
                JRC flood maps) are the production upgrade path alongside real footprints.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
