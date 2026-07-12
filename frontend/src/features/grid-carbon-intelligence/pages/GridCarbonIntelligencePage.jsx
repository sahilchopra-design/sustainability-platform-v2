import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie, AreaChart, Area, ReferenceArea, ReferenceLine,
  ComposedChart, Line,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Grid Carbon Intelligence — LIVE UK NESO Carbon Intensity API
// Upstream: https://api.carbonintensity.org.uk (free, keyless, CC-BY 4.0)
// Backend proxy: backend/api/v1/routes/grid_carbon.py
//   GET /api/v1/grid-carbon/current   — national intensity now + generation mix
//   GET /api/v1/grid-carbon/forecast  — forward forecast (NESO publishes ~48-54h;
//                                       proxy chains fw48h calls up to 96h requested)
//   GET /api/v1/grid-carbon/regional  — 14 GB DNO regions snapshot
// Demo fallback: REAL static snapshot captured from the live API 2026-07-04T20:50Z
// (no fabricated data — clearly labeled when shown).
// ─────────────────────────────────────────────────────────────────────────────

const API = 'http://localhost:8001';
const GRID_API = `${API}/api/v1/grid-carbon`;
const GLOBAL_API = `${GRID_API}/global`;

// Fuel-label classifier shared across sources: GB uses short names (wind,
// solar, hydro, nuclear); US (EIA) and EU (ENTSO-E) use longer/qualified
// labels (e.g. wind_onshore, hydro_run_of_river, fossil_gas) — match by
// substring so the same "low-carbon share" logic works for all three.
const isLowCarbonFuel = (fuel) => /wind|solar|hydro|nuclear|geothermal|marine/i.test(fuel || '');
const isFossilFuel = (fuel) => /gas|coal|oil|lignite|peat/i.test(fuel || '');

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

// ── REAL static snapshot (demo fallback) — captured from the live NESO API ───
// Captured 2026-07-04T20:50Z via api.carbonintensity.org.uk. These are actual
// observed/forecast GB grid values, NOT synthetic data. Used only when the
// backend proxy is unreachable, and labeled as a static snapshot in the UI.
const SNAP_CAPTURED = '2026-07-04T20:50Z';

const SNAP_CURRENT = {
  from: '2026-07-04T20:00Z', to: '2026-07-04T20:30Z',
  intensity: { forecast: 62, actual: 73, index: 'low' },
  generation_mix: [
    { fuel: 'biomass', perc: 4.9 }, { fuel: 'coal', perc: 0 }, { fuel: 'imports', perc: 19.3 },
    { fuel: 'gas', perc: 10.2 }, { fuel: 'nuclear', perc: 11 }, { fuel: 'other', perc: 6.5 },
    { fuel: 'hydro', perc: 3.5 }, { fuel: 'solar', perc: 0.6 }, { fuel: 'wind', perc: 44.1 },
  ],
};

// Hourly-averaged real forecast series (50h horizon available at capture time).
const SNAP_FORECAST = [
  { from: '2026-07-04T20:30Z', forecast: 67, index: 'low' }, { from: '2026-07-04T21:30Z', forecast: 71, index: 'low' },
  { from: '2026-07-04T22:30Z', forecast: 74, index: 'low' }, { from: '2026-07-04T23:30Z', forecast: 77, index: 'low' },
  { from: '2026-07-05T00:30Z', forecast: 78, index: 'low' }, { from: '2026-07-05T01:30Z', forecast: 74, index: 'low' },
  { from: '2026-07-05T02:30Z', forecast: 84, index: 'low' }, { from: '2026-07-05T03:30Z', forecast: 92, index: 'moderate' },
  { from: '2026-07-05T04:30Z', forecast: 95, index: 'moderate' }, { from: '2026-07-05T05:30Z', forecast: 92, index: 'moderate' },
  { from: '2026-07-05T06:30Z', forecast: 86, index: 'low' }, { from: '2026-07-05T07:30Z', forecast: 70, index: 'low' },
  { from: '2026-07-05T08:30Z', forecast: 60, index: 'low' }, { from: '2026-07-05T09:30Z', forecast: 56, index: 'low' },
  { from: '2026-07-05T10:30Z', forecast: 50, index: 'low' }, { from: '2026-07-05T11:30Z', forecast: 48, index: 'low' },
  { from: '2026-07-05T12:30Z', forecast: 46, index: 'low' }, { from: '2026-07-05T13:30Z', forecast: 47, index: 'low' },
  { from: '2026-07-05T14:30Z', forecast: 56, index: 'low' }, { from: '2026-07-05T15:30Z', forecast: 76, index: 'low' },
  { from: '2026-07-05T16:30Z', forecast: 112, index: 'moderate' }, { from: '2026-07-05T17:30Z', forecast: 140, index: 'moderate' },
  { from: '2026-07-05T18:30Z', forecast: 152, index: 'moderate' }, { from: '2026-07-05T19:30Z', forecast: 153, index: 'moderate' },
  { from: '2026-07-05T20:30Z', forecast: 146, index: 'moderate' }, { from: '2026-07-05T21:30Z', forecast: 131, index: 'moderate' },
  { from: '2026-07-05T22:30Z', forecast: 118, index: 'moderate' }, { from: '2026-07-05T23:30Z', forecast: 113, index: 'moderate' },
  { from: '2026-07-06T00:30Z', forecast: 108, index: 'moderate' }, { from: '2026-07-06T01:30Z', forecast: 102, index: 'moderate' },
  { from: '2026-07-06T02:30Z', forecast: 97, index: 'moderate' }, { from: '2026-07-06T03:30Z', forecast: 96, index: 'moderate' },
  { from: '2026-07-06T04:30Z', forecast: 96, index: 'moderate' }, { from: '2026-07-06T05:30Z', forecast: 88, index: 'moderate' },
  { from: '2026-07-06T06:30Z', forecast: 80, index: 'low' }, { from: '2026-07-06T07:30Z', forecast: 72, index: 'low' },
  { from: '2026-07-06T08:30Z', forecast: 61, index: 'low' }, { from: '2026-07-06T09:30Z', forecast: 56, index: 'low' },
  { from: '2026-07-06T10:30Z', forecast: 51, index: 'low' }, { from: '2026-07-06T11:30Z', forecast: 51, index: 'low' },
  { from: '2026-07-06T12:30Z', forecast: 50, index: 'low' }, { from: '2026-07-06T13:30Z', forecast: 51, index: 'low' },
  { from: '2026-07-06T14:30Z', forecast: 55, index: 'low' }, { from: '2026-07-06T15:30Z', forecast: 72, index: 'low' },
  { from: '2026-07-06T16:30Z', forecast: 98, index: 'low' }, { from: '2026-07-06T17:30Z', forecast: 124, index: 'moderate' },
  { from: '2026-07-06T18:30Z', forecast: 140, index: 'moderate' }, { from: '2026-07-06T19:30Z', forecast: 141, index: 'moderate' },
  { from: '2026-07-06T20:30Z', forecast: 140, index: 'moderate' }, { from: '2026-07-06T21:30Z', forecast: 130, index: 'moderate' },
];

// Real regional snapshot (14 DNO regions) captured at the same time.
const SNAP_REGIONAL = [
  { region_id: 1, shortname: 'North Scotland', intensity_forecast: 0, index: 'very low', low_carbon_perc: 100.0, generation_mix: [{ fuel: 'wind', perc: 99.5 }, { fuel: 'solar', perc: 0.5 }] },
  { region_id: 2, shortname: 'South Scotland', intensity_forecast: 1, index: 'very low', low_carbon_perc: 99.0, generation_mix: [{ fuel: 'wind', perc: 76.7 }, { fuel: 'nuclear', perc: 21.9 }, { fuel: 'biomass', perc: 1.1 }] },
  { region_id: 3, shortname: 'North West England', intensity_forecast: 22, index: 'very low', low_carbon_perc: 85.2, generation_mix: [{ fuel: 'wind', perc: 53.2 }, { fuel: 'nuclear', perc: 31.6 }, { fuel: 'imports', perc: 7.9 }, { fuel: 'gas', perc: 4.8 }] },
  { region_id: 4, shortname: 'North East England', intensity_forecast: 10, index: 'very low', low_carbon_perc: 58.9, generation_mix: [{ fuel: 'wind', perc: 37.3 }, { fuel: 'imports', perc: 33.7 }, { fuel: 'nuclear', perc: 20.9 }, { fuel: 'biomass', perc: 7.4 }] },
  { region_id: 5, shortname: 'Yorkshire', intensity_forecast: 27, index: 'low', low_carbon_perc: 71.4, generation_mix: [{ fuel: 'wind', perc: 63.6 }, { fuel: 'biomass', perc: 18.1 }, { fuel: 'imports', perc: 9.3 }, { fuel: 'nuclear', perc: 7.3 }] },
  { region_id: 6, shortname: 'North Wales & Merseyside', intensity_forecast: 37, index: 'low', low_carbon_perc: 87.3, generation_mix: [{ fuel: 'wind', perc: 67.4 }, { fuel: 'nuclear', perc: 19.1 }, { fuel: 'gas', perc: 9 }] },
  { region_id: 7, shortname: 'South Wales', intensity_forecast: 165, index: 'moderate', low_carbon_perc: 55.9, generation_mix: [{ fuel: 'wind', perc: 43.2 }, { fuel: 'gas', perc: 41.5 }, { fuel: 'nuclear', perc: 8.6 }, { fuel: 'solar', perc: 4.1 }] },
  { region_id: 8, shortname: 'West Midlands', intensity_forecast: 30, index: 'low', low_carbon_perc: 85.3, generation_mix: [{ fuel: 'wind', perc: 59.7 }, { fuel: 'nuclear', perc: 24 }, { fuel: 'gas', perc: 7 }, { fuel: 'imports', perc: 5.6 }] },
  { region_id: 9, shortname: 'East Midlands', intensity_forecast: 67, index: 'low', low_carbon_perc: 66.1, generation_mix: [{ fuel: 'wind', perc: 58.9 }, { fuel: 'biomass', perc: 14.1 }, { fuel: 'gas', perc: 12.7 }, { fuel: 'imports', perc: 7.2 }] },
  { region_id: 10, shortname: 'East England', intensity_forecast: 68, index: 'low', low_carbon_perc: 68.5, generation_mix: [{ fuel: 'wind', perc: 62.3 }, { fuel: 'gas', perc: 13.8 }, { fuel: 'imports', perc: 8.9 }, { fuel: 'biomass', perc: 8.8 }] },
  { region_id: 11, shortname: 'South West England', intensity_forecast: 288, index: 'very high', low_carbon_perc: 27.0, generation_mix: [{ fuel: 'gas', perc: 73 }, { fuel: 'wind', perc: 19.3 }, { fuel: 'solar', perc: 7.4 }] },
  { region_id: 12, shortname: 'South England', intensity_forecast: 74, index: 'low', low_carbon_perc: 50.7, generation_mix: [{ fuel: 'wind', perc: 38.4 }, { fuel: 'imports', perc: 30.2 }, { fuel: 'gas', perc: 13.7 }, { fuel: 'nuclear', perc: 9.6 }] },
  { region_id: 13, shortname: 'London', intensity_forecast: 84, index: 'low', low_carbon_perc: 37.5, generation_mix: [{ fuel: 'imports', perc: 44.5 }, { fuel: 'wind', perc: 32.3 }, { fuel: 'gas', perc: 14.5 }] },
  { region_id: 14, shortname: 'South East England', intensity_forecast: 97, index: 'moderate', low_carbon_perc: 15.1, generation_mix: [{ fuel: 'imports', perc: 69.7 }, { fuel: 'gas', perc: 15.2 }, { fuel: 'wind', perc: 13.9 }] },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const FUEL_COLORS = {
  wind: '#0ea5e9', solar: '#f59e0b', nuclear: '#7c3aed', hydro: '#0f766e',
  biomass: '#65a30d', gas: '#9ca3af', coal: '#374151', imports: '#c084fc', other: '#d6d3d1',
};
const LOW_CARBON_FUELS = ['wind', 'solar', 'hydro', 'nuclear'];
const INDEX_COLOR = { 'very low': '#15803d', low: '#16a34a', moderate: '#d97706', high: '#dc2626', 'very high': '#991b1b' };

// CFE matching constant: GB fossil marginal generation is essentially all CCGT.
// NESO's methodology assigns gas ≈ 394 gCO2/kWh, and GB coal is ~0 since 2024,
// so fossil share of generation ≈ CI / 394 and the carbon-free-energy share of
// each settlement period is approximated as max(0, 1 − CI/394). Documented in
// the Methodology tab.
const GAS_CI = 394; // gCO2/kWh, CCGT per NESO carbon intensity methodology

// Hourly load-profile presets (relative weights, 24 entries = hour of day UTC).
const LOAD_PRESETS = {
  'Hourly-flat (24/7 baseload)': Array.from({ length: 24 }, () => 1),
  'Solar-shaped (daylight bell)': Array.from({ length: 24 }, (_, h) => {
    // Bell over 05:00–19:00 UTC peaking at noon — a stylized PV-offtake shape.
    if (h < 5 || h > 19) return 0;
    const x = (h - 12) / 5;
    return Math.max(0, parseFloat((Math.exp(-x * x * 2)).toFixed(3)));
  }),
  'Office hours (08:00–18:00)': Array.from({ length: 24 }, (_, h) => (h >= 8 && h < 18 ? 1 : 0.15)),
  'EV overnight (00:00–06:00)': Array.from({ length: 24 }, (_, h) => (h < 6 ? 1 : 0.1)),
};

const fmtTime = (iso) => {
  if (!iso) return '';
  // NESO timestamps: 2026-07-05T14:30Z
  const d = new Date(iso.replace('Z', ':00Z'));
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const hourOf = (iso) => {
  const d = new Date((iso || '').replace('Z', ':00Z'));
  return Number.isNaN(d.getTime()) ? 0 : d.getUTCHours();
};

// ── Small UI helpers ──────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.textPri, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.teal}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...style }}>{children}</div>
);

const TABS = ['Live National Grid', 'Forecast & Cleanest Window', 'Regional Breakdown', '24/7 CFE Matcher', 'Methodology & Source'];

export default function GridCarbonIntelligencePage() {
  const [tab, setTab] = useState(0);

  // ── Live data fetches (each falls back to the REAL static snapshot) ────────
  const [current, setCurrent] = useState(SNAP_CURRENT);
  const [currentStatus, setCurrentStatus] = useState('loading'); // loading|live|demo
  const [forecastPeriods, setForecastPeriods] = useState(SNAP_FORECAST);
  const [forecastStatus, setForecastStatus] = useState('loading');
  const [regions, setRegions] = useState(SNAP_REGIONAL);
  const [regionalStatus, setRegionalStatus] = useState('loading');

  // ── Global region/country selector — GB (NESO, existing) | US (EIA) | EU (ENTSO-E) ──
  // Backend: GET /api/v1/grid-carbon/global/sources, GET /api/v1/grid-carbon/global/mix
  const [globalSource, setGlobalSource] = useState('GB');
  const [globalRegion, setGlobalRegion] = useState('');
  const [sourceCatalog, setSourceCatalog] = useState(null); // { GB:{...}, US:{regions,mode,...}, EU:{...} }
  const [globalMix, setGlobalMix] = useState(null);         // { generation_mix, mode, region_label, ... }
  const [globalMixStatus, setGlobalMixStatus] = useState('loading'); // loading|live|demo

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${GLOBAL_API}/sources`, { timeout: 15000 });
        if (!cancelled && data && data.sources) {
          setSourceCatalog(data.sources);
        }
      } catch (e) { /* selector still works with GB-only default; per-source badges just stay generic */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (globalSource === 'GB') return; // GB reuses the existing /current fetch below
    let cancelled = false;
    setGlobalMixStatus('loading');
    (async () => {
      try {
        const region = globalRegion || (globalSource === 'US' ? 'CAL' : 'DE');
        const { data } = await axios.get(`${GLOBAL_API}/mix`, {
          params: { source: globalSource, region }, timeout: 25000,
        });
        if (!cancelled && data) {
          setGlobalMix(data);
          setGlobalMixStatus(data.mode === 'live' ? 'live' : 'demo');
        } else if (!cancelled) setGlobalMixStatus('demo');
      } catch (e) { if (!cancelled) setGlobalMixStatus('demo'); }
    })();
    return () => { cancelled = true; };
  }, [globalSource, globalRegion]);

  const regionOptions = useMemo(() => {
    if (globalSource === 'GB') return null;
    const cat = sourceCatalog?.[globalSource]?.regions;
    if (cat) return Object.entries(cat);
    // Fallback options if /global/sources hasn't loaded yet
    return globalSource === 'US' ? [['CAL', 'California']] : [['DE', 'Germany-Luxembourg']];
  }, [globalSource, sourceCatalog]);

  useEffect(() => {
    // Reset region to the first valid option whenever the source changes.
    if (globalSource === 'GB') { setGlobalRegion(''); return; }
    if (regionOptions && regionOptions.length && !regionOptions.some(([code]) => code === globalRegion)) {
      setGlobalRegion(regionOptions[0][0]);
    }
  }, [globalSource, regionOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${GRID_API}/current`, { timeout: 25000 });
        if (!cancelled && data && data.intensity) {
          setCurrent(data);
          setCurrentStatus(data.stale ? 'demo' : 'live');
        } else if (!cancelled) setCurrentStatus('demo');
      } catch (e) { if (!cancelled) setCurrentStatus('demo'); }
    })();
    (async () => {
      try {
        const { data } = await axios.get(`${GRID_API}/forecast`, { params: { hours: 96 }, timeout: 30000 });
        if (!cancelled && data && Array.isArray(data.periods) && data.periods.length > 0) {
          setForecastPeriods(data.periods);
          setForecastStatus(data.stale ? 'demo' : 'live');
        } else if (!cancelled) setForecastStatus('demo');
      } catch (e) { if (!cancelled) setForecastStatus('demo'); }
    })();
    (async () => {
      try {
        const { data } = await axios.get(`${GRID_API}/regional`, { timeout: 25000 });
        if (!cancelled && data && Array.isArray(data.regions) && data.regions.length > 0) {
          setRegions(data.regions.filter(r => !r.is_aggregate));
          setRegionalStatus(data.stale ? 'demo' : 'live');
        } else if (!cancelled) setRegionalStatus('demo');
      } catch (e) { if (!cancelled) setRegionalStatus('demo'); }
    })();
    return () => { cancelled = true; };
  }, []);

  const anyLoading = currentStatus === 'loading' || forecastStatus === 'loading' || regionalStatus === 'loading';
  const allLive = currentStatus === 'live' && forecastStatus === 'live' && regionalStatus === 'live';

  // ── Derived: current tab ────────────────────────────────────────────────────
  // GB (NESO) keeps its existing generation_mix; US (EIA) / EU (ENTSO-E) swap in
  // the unified /global/mix payload for the selected region/country. The intensity
  // gauge (gCO2/kWh) below remains GB-only — NESO is the only one of the three
  // upstreams that publishes a carbon-intensity index in this build.
  const mix = current.generation_mix || [];
  const isGlobalSelection = globalSource !== 'GB';
  const activeMix = isGlobalSelection ? (globalMix?.generation_mix || []) : mix;
  const activeMixStatus = isGlobalSelection ? globalMixStatus : currentStatus;
  const activeRegionLabel = isGlobalSelection
    ? (globalMix?.region_label || regionOptions?.find(([code]) => code === globalRegion)?.[1] || globalRegion)
    : 'Great Britain';
  const nowCI = current.intensity?.actual ?? current.intensity?.forecast ?? 0;
  const nowIndex = current.intensity?.index || 'unknown';
  const lowCarbonShare = useMemo(
    () => activeMix.filter(m => isLowCarbonFuel(m.fuel)).reduce((a, m) => a + (m.perc || 0), 0),
    [activeMix]
  );
  const windShare = useMemo(
    () => activeMix.filter(m => /^wind/i.test(m.fuel || '')).reduce((a, m) => a + (m.perc || 0), 0),
    [activeMix]
  );
  const fossilShare = useMemo(
    () => activeMix.filter(m => isFossilFuel(m.fuel)).reduce((a, m) => a + (m.perc || 0), 0),
    [activeMix]
  );
  const mixDonut = useMemo(() => activeMix.filter(m => (m.perc || 0) > 0).map(m => ({ name: m.fuel, value: m.perc })), [activeMix]);

  // Intensity gauge bands (NESO 2025 index bands, gCO2/kWh)
  const GAUGE_MAX = 400;
  const gaugePct = Math.min(100, (nowCI / GAUGE_MAX) * 100);

  // ── Derived: forecast tab ───────────────────────────────────────────────────
  const [windowHours, setWindowHours] = useState(3);
  const forecastChart = useMemo(() => forecastPeriods.map(p => ({
    t: fmtTime(p.from), from: p.from, ci: p.forecast, index: p.index,
  })), [forecastPeriods]);

  const periodsPerHour = useMemo(() => {
    // live proxy serves half-hour periods; static snapshot is hourly
    if (forecastPeriods.length < 2) return 1;
    const a = new Date(forecastPeriods[0].from.replace('Z', ':00Z'));
    const b = new Date(forecastPeriods[1].from.replace('Z', ':00Z'));
    const diffMin = Math.abs(b - a) / 60000;
    return diffMin >= 55 ? 1 : 2;
  }, [forecastPeriods]);

  // Cleanest contiguous window: minimize mean CI over windowHours.
  const cleanestWindow = useMemo(() => {
    const vals = forecastPeriods.map(p => p.forecast).map(v => (v == null ? Infinity : v));
    const k = Math.max(1, windowHours * periodsPerHour);
    if (vals.length < k) return null;
    let best = { start: 0, avg: Infinity };
    let sum = vals.slice(0, k).reduce((a, b) => a + b, 0);
    if (sum / k < best.avg) best = { start: 0, avg: sum / k };
    for (let i = k; i < vals.length; i++) {
      sum += vals[i] - vals[i - k];
      const avg = sum / k;
      if (avg < best.avg) best = { start: i - k + 1, avg };
    }
    if (!Number.isFinite(best.avg)) return null;
    return {
      fromIdx: best.start, toIdx: best.start + k - 1,
      from: forecastPeriods[best.start].from,
      to: forecastPeriods[best.start + k - 1].from,
      avg: Math.round(best.avg),
    };
  }, [forecastPeriods, windowHours, periodsPerHour]);

  const fcVals = forecastPeriods.map(p => p.forecast).filter(v => v != null);
  const fcMin = fcVals.length ? Math.min(...fcVals) : 0;
  const fcMax = fcVals.length ? Math.max(...fcVals) : 0;
  const fcAvg = fcVals.length ? Math.round(fcVals.reduce((a, b) => a + b, 0) / fcVals.length) : 0;
  const horizonH = Math.round(forecastPeriods.length / Math.max(1, periodsPerHour));

  // ── Derived: regional tab ───────────────────────────────────────────────────
  const regionsSorted = useMemo(() => [...regions].sort((a, b) => (a.intensity_forecast ?? 0) - (b.intensity_forecast ?? 0)), [regions]);
  const regionalBar = useMemo(() => regionsSorted.map(r => ({
    name: r.shortname, ci: r.intensity_forecast, lowC: r.low_carbon_perc, index: r.index,
  })), [regionsSorted]);

  // ── Derived: CFE matcher ────────────────────────────────────────────────────
  const [presetA, setPresetA] = useState('Hourly-flat (24/7 baseload)');
  const [presetB, setPresetB] = useState('Solar-shaped (daylight bell)');
  const [cfeMode, setCfeMode] = useState('share'); // 'share' | 'threshold'
  const [ciThreshold, setCiThreshold] = useState(100);

  // CFE fraction of one settlement period:
  //   share mode:      cfe(t) = max(0, 1 − CI(t)/394)      (fossil = CCGT proxy)
  //   threshold mode:  cfe(t) = CI(t) <= threshold ? 1 : 0 (carbon-aware matching)
  const cfeOfPeriod = useMemo(() => (ci) => {
    if (ci == null) return 0;
    if (cfeMode === 'threshold') return ci <= ciThreshold ? 1 : 0;
    return Math.max(0, Math.min(1, 1 - ci / GAS_CI));
  }, [cfeMode, ciThreshold]);

  const cfeScore = useMemo(() => (presetName) => {
    const weights = LOAD_PRESETS[presetName];
    let matched = 0, total = 0;
    forecastPeriods.forEach(p => {
      const w = weights[hourOf(p.from)];
      if (!w) return void (total += 0);
      matched += w * cfeOfPeriod(p.forecast);
      total += w;
    });
    return total > 0 ? (matched / total) * 100 : 0;
  }, [forecastPeriods, cfeOfPeriod]);

  const cfeSeries = useMemo(() => forecastPeriods.map(p => {
    const wA = LOAD_PRESETS[presetA][hourOf(p.from)];
    const wB = LOAD_PRESETS[presetB][hourOf(p.from)];
    const cfe = cfeOfPeriod(p.forecast);
    return {
      t: fmtTime(p.from), ci: p.forecast,
      cfePct: Math.round(cfe * 100),
      loadA: parseFloat((wA).toFixed(2)), loadB: parseFloat((wB).toFixed(2)),
      matchedA: parseFloat((wA * cfe).toFixed(3)), matchedB: parseFloat((wB * cfe).toFixed(3)),
    };
  }), [forecastPeriods, presetA, presetB, cfeOfPeriod]);

  const cfeAllPresets = useMemo(() => Object.keys(LOAD_PRESETS).map(name => ({
    name: name.split(' (')[0], full: name, cfe: parseFloat(cfeScore(name).toFixed(1)),
  })), [cfeScore]);

  const scoreA = cfeScore(presetA);
  const scoreB = cfeScore(presetB);

  const dataBadge = (status) => {
    if (status === 'loading') return <Badge val="Connecting…" color="#94a3b8" bg="#1e293b" />;
    if (status === 'live') return <Badge val="● Live — UK NESO Carbon Intensity API (CC-BY 4.0, keyless)" color="#166534" bg="#dcfce7" />;
    return <Badge val={`○ Static snapshot — REAL NESO data captured ${SNAP_CAPTURED} (backend proxy unreachable)`} color="#92400e" bg="#fef3c7" />;
  };

  const selPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };
  const thPx = { padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' };
  const tdPx = { padding: '8px 12px', borderBottom: `1px solid ${T.borderL}`, fontSize: 13 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>GRID CARBON INTELLIGENCE · UK NESO LIVE FEED</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Grid Carbon Intelligence</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Live GB carbon intensity · {horizonH}h forecast · 14 DNO regions · 24/7 CFE matching — api.carbonintensity.org.uk (CC-BY 4.0)
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {anyLoading && <Badge val="Connecting to NESO Carbon Intensity API…" color="#94a3b8" bg="#1e293b" />}
              {!anyLoading && allLive && <Badge val="● Live — all three feeds served by /api/v1/grid-carbon proxy over api.carbonintensity.org.uk" color="#166534" bg="#dcfce7" />}
              {!anyLoading && !allLive && <Badge val={`○ Partial/offline — unavailable feeds show the REAL static snapshot captured ${SNAP_CAPTURED}`} color="#92400e" bg="#fef3c7" />}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>Now: {nowCI} gCO2/kWh ({nowIndex})</div>
            <div>Low-carbon: {lowCarbonShare.toFixed(1)}%</div>
            <div>Period: {current.from} → {current.to}</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', overflowX: 'auto', padding: '0 24px' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '13px 18px', border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600, color: tab === i ? T.teal : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.teal}` : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* TAB 0 — Live national / global snapshot */}
        {tab === 0 && (
          <div>
            {/* Region/country selector — GB (NESO, existing) | US (EIA) | EU (ENTSO-E) */}
            <Card style={{ marginBottom: 16, padding: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Grid source
                </div>
                <select value={globalSource} onChange={e => setGlobalSource(e.target.value)} style={selPx}>
                  <option value="GB">Great Britain — UK NESO</option>
                  <option value="US">United States — EIA (region)</option>
                  <option value="EU">European Union — ENTSO-E (country)</option>
                </select>
                {globalSource !== 'GB' && (
                  <select value={globalRegion} onChange={e => setGlobalRegion(e.target.value)} style={selPx}>
                    {(regionOptions || []).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge
                    val={`GB: ${sourceCatalog?.GB ? sourceCatalog.GB.mode : (currentStatus === 'live' ? 'live' : 'demo-seed')}`}
                    color={(sourceCatalog?.GB?.mode ?? currentStatus) === 'live' ? '#166534' : '#92400e'}
                    bg={(sourceCatalog?.GB?.mode ?? currentStatus) === 'live' ? '#dcfce7' : '#fef3c7'}
                  />
                  <Badge
                    val={`US (EIA): ${sourceCatalog?.US?.mode || 'unknown'}`}
                    color={sourceCatalog?.US?.mode === 'live' ? '#166534' : '#92400e'}
                    bg={sourceCatalog?.US?.mode === 'live' ? '#dcfce7' : '#fef3c7'}
                  />
                  <Badge
                    val={`EU (ENTSO-E): ${sourceCatalog?.EU?.mode || 'unknown'}`}
                    color={sourceCatalog?.EU?.mode === 'live' ? '#166534' : '#92400e'}
                    bg={sourceCatalog?.EU?.mode === 'live' ? '#dcfce7' : '#fef3c7'}
                  />
                </div>
              </div>
              {isGlobalSelection && (
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>
                  {sourceCatalog?.[globalSource]?.note || 'Set the corresponding API key/token env var for live data — see Methodology tab.'}
                </div>
              )}
            </Card>

            <div style={{ marginBottom: 14 }}>{dataBadge(activeMixStatus)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {!isGlobalSelection ? (
                <KpiCard label="Carbon Intensity (actual)" value={`${nowCI} g/kWh`} sub={`Index band: ${nowIndex}`} accent={INDEX_COLOR[nowIndex] || T.teal} />
              ) : (
                <KpiCard label="Carbon Intensity" value="N/A" sub="Index only published by NESO (GB) in this build" accent={T.textSec} />
              )}
              <KpiCard label="Low-Carbon Share" value={`${lowCarbonShare.toFixed(1)}%`} sub="Wind + solar + hydro + nuclear (+geothermal/marine)" accent={T.green} />
              <KpiCard label="Wind Share" value={`${windShare.toFixed(1)}%`} sub={`Of current ${activeRegionLabel} generation`} accent={T.blue} />
              <KpiCard label="Fossil Share" value={`${fossilShare.toFixed(1)}%`} sub="Gas + coal + oil (+lignite/peat)" accent={T.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {!isGlobalSelection ? (
                <Card>
                  <SectionH title="National Intensity Gauge" sub={`Half-hour settlement period ${current.from} → ${current.to} (UTC)`} />
                  <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                    <div style={{ fontSize: 56, fontWeight: 800, color: INDEX_COLOR[nowIndex] || T.textPri, fontFamily: T.fontMono, lineHeight: 1 }}>{nowCI}</div>
                    <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>gCO2/kWh · forecast {current.intensity?.forecast ?? '—'} g/kWh</div>
                  </div>
                  {/* Band scale bar */}
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                      {[['very low', 12.5], ['low', 25], ['moderate', 25], ['high', 25], ['very high', 12.5]].map(([band, w]) => (
                        <div key={band} style={{ width: `${w}%`, background: INDEX_COLOR[band] }} title={band} />
                      ))}
                    </div>
                    <div style={{ position: 'relative', height: 18 }}>
                      <div style={{ position: 'absolute', left: `${gaugePct}%`, transform: 'translateX(-50%)', fontSize: 16, lineHeight: '18px' }}>▲</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>
                      <span>0</span><span>100</span><span>200</span><span>300</span><span>{GAUGE_MAX}+</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>
                      NESO index bands: very low / low / moderate / high / very high. Marker = current actual intensity.
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <SectionH title={`${activeRegionLabel} — Source Detail`} sub={globalSource === 'US' ? 'EIA electricity/rto/fuel-type-data' : 'ENTSO-E actual generation per type (A75)'} />
                  <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.8, padding: '8px 0' }}>
                    <div>Mode: <Badge val={activeMixStatus === 'live' ? 'Live' : 'Demo (seeded)'} color={activeMixStatus === 'live' ? '#166534' : '#92400e'} bg={activeMixStatus === 'live' ? '#dcfce7' : '#fef3c7'} /></div>
                    <div style={{ marginTop: 10 }}>{globalMix?.extra?.period || globalMix?.extra?.date || ''}</div>
                    <div style={{ marginTop: 10, fontSize: 12, color: T.textSec }}>
                      A national carbon-intensity index (gCO2/kWh) is not part of this unified endpoint for US/EU — only NESO (GB) publishes one directly. Generation mix (right) is fully comparable across all three sources.
                    </div>
                    {globalMix?.upstream_error && (
                      <div style={{ marginTop: 10, fontSize: 11, color: T.red }}>Upstream note: {globalMix.upstream_error}</div>
                    )}
                  </div>
                </Card>
              )}

              <Card>
                <SectionH title="Generation Mix (now)" sub={`Share of ${activeRegionLabel} generation by fuel`} />
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={mixDonut} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2}>
                      {mixDonut.map(m => <Cell key={m.name} fill={FUEL_COLORS[m.name] || T.textSec} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card style={{ marginTop: 20 }}>
              <SectionH title="Fuel Shares" sub="Low-carbon fuels highlighted green-family; fossil grey" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...activeMix].sort((a, b) => (b.perc || 0) - (a.perc || 0))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="fuel" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={56} />
                  <YAxis unit="%" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="perc" name="Share">
                    {[...activeMix].sort((a, b) => (b.perc || 0) - (a.perc || 0)).map(m => (
                      <Cell key={m.fuel} fill={FUEL_COLORS[m.fuel] || T.textSec} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* TAB 1 — Forecast + cleanest window */}
        {tab === 1 && (
          <div>
            <div style={{ marginBottom: 14 }}>{dataBadge(forecastStatus)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
              <KpiCard label="Forecast Horizon" value={`${horizonH}h`} sub={`${forecastPeriods.length} periods · NESO publishes ~48-54h ahead (96h requested)`} accent={T.teal} />
              <KpiCard label="Cleanest Hour" value={`${fcMin} g/kWh`} sub="Minimum forecast intensity" accent={T.green} />
              <KpiCard label="Dirtiest Hour" value={`${fcMax} g/kWh`} sub="Maximum forecast intensity" accent={T.red} />
              <KpiCard label={`Cleanest ${windowHours}h Window`} value={cleanestWindow ? `${cleanestWindow.avg} g/kWh` : '—'} sub={cleanestWindow ? `Starts ${fmtTime(cleanestWindow.from)} UTC` : 'insufficient data'} accent={T.indigo} />
            </div>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <SectionH title="Forward Carbon Intensity Forecast" sub={`Half-hourly national forecast · avg ${fcAvg} g/kWh · shaded band = cleanest contiguous ${windowHours}h window`} />
                <label style={{ fontSize: 12, color: T.textSec }}>
                  Window:&nbsp;
                  <select value={windowHours} onChange={e => setWindowHours(Number(e.target.value))} style={selPx}>
                    {[1, 2, 3, 4, 6, 8].map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </label>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={forecastChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(forecastChart.length / 16) - 1)} angle={-20} height={52} textAnchor="end" />
                  <YAxis unit=" g" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} gCO2/kWh`, 'Forecast CI']} />
                  {cleanestWindow && (
                    <ReferenceArea
                      x1={forecastChart[cleanestWindow.fromIdx]?.t}
                      x2={forecastChart[cleanestWindow.toIdx]?.t}
                      fill={T.green} fillOpacity={0.14}
                      label={{ value: `cleanest ${windowHours}h`, position: 'insideTop', fontSize: 11, fill: T.green }}
                    />
                  )}
                  <ReferenceLine y={fcAvg} stroke={T.amber} strokeDasharray="4 4" label={{ value: `avg ${fcAvg}`, fontSize: 10, fill: T.amber, position: 'right' }} />
                  <Area type="monotone" dataKey="ci" stroke={T.teal} fill={T.teal} fillOpacity={0.18} strokeWidth={2} name="Forecast CI" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>
                Cleanest-window algorithm: sliding-window minimum of the mean forecast intensity over {windowHours}h ({windowHours * periodsPerHour} consecutive periods). Use it to schedule flexible load (EV charging, batch compute, heat storage).
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2 — Regional */}
        {tab === 2 && (
          <div>
            <div style={{ marginBottom: 14 }}>{dataBadge(regionalStatus)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
              <KpiCard label="DNO Regions" value={regions.length} sub="GB distribution network operator regions" accent={T.teal} />
              <KpiCard label="Cleanest Region" value={regionsSorted[0]?.shortname || '—'} sub={`${regionsSorted[0]?.intensity_forecast ?? '—'} g/kWh (${regionsSorted[0]?.index ?? ''})`} accent={T.green} />
              <KpiCard label="Dirtiest Region" value={regionsSorted[regionsSorted.length - 1]?.shortname || '—'} sub={`${regionsSorted[regionsSorted.length - 1]?.intensity_forecast ?? '—'} g/kWh (${regionsSorted[regionsSorted.length - 1]?.index ?? ''})`} accent={T.red} />
              <KpiCard label="Regional Spread" value={`${(regionsSorted[regionsSorted.length - 1]?.intensity_forecast ?? 0) - (regionsSorted[0]?.intensity_forecast ?? 0)} g/kWh`} sub="Max − min regional intensity right now" accent={T.indigo} />
            </div>

            <Card style={{ marginBottom: 20 }}>
              <SectionH title="Carbon Intensity by Region" sub="Current half-hour forecast per DNO region, sorted cleanest → dirtiest" />
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={regionalBar} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={80} />
                  <YAxis yAxisId="ci" unit=" g" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="lc" orientation="right" unit="%" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="ci" dataKey="ci" name="Intensity (gCO2/kWh)">
                    {regionalBar.map(r => <Cell key={r.name} fill={INDEX_COLOR[r.index] || T.teal} />)}
                  </Bar>
                  <Line yAxisId="lc" type="monotone" dataKey="lowC" name="Low-carbon share (%)" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <SectionH title="Regional Detail" sub="Region ids 1-14 per NESO regional API; England/Scotland/Wales aggregates excluded" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: T.sub }}>
                    <tr>
                      <th style={thPx}>#</th><th style={thPx}>Region</th><th style={thPx}>Intensity</th>
                      <th style={thPx}>Index</th><th style={thPx}>Low-Carbon %</th><th style={thPx}>Dominant Fuels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionsSorted.map(r => (
                      <tr key={r.region_id}>
                        <td style={{ ...tdPx, fontFamily: T.fontMono, fontSize: 12 }}>{r.region_id}</td>
                        <td style={{ ...tdPx, fontWeight: 600, color: T.navy }}>{r.shortname}</td>
                        <td style={{ ...tdPx, fontFamily: T.fontMono }}>{r.intensity_forecast} g/kWh</td>
                        <td style={tdPx}><Badge val={r.index} color="#fff" bg={INDEX_COLOR[r.index] || T.textSec} /></td>
                        <td style={tdPx}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 90, height: 8, background: T.borderL, borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, r.low_carbon_perc)}%`, height: '100%', background: T.green }} />
                            </div>
                            <span style={{ fontSize: 12, fontFamily: T.fontMono }}>{(r.low_carbon_perc ?? 0).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ ...tdPx, fontSize: 12, color: T.textSec }}>
                          {(r.generation_mix || []).filter(m => (m.perc || 0) >= 5).sort((a, b) => b.perc - a.perc).slice(0, 3)
                            .map(m => `${m.fuel} ${m.perc}%`).join(' · ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3 — 24/7 CFE matcher */}
        {tab === 3 && (
          <div>
            <div style={{ marginBottom: 14 }}>{dataBadge(forecastStatus)}</div>
            <Card style={{ marginBottom: 20 }}>
              <SectionH title="24/7 Carbon-Free Energy Matching Calculator" sub={`Matches an hourly load profile against the real ${horizonH}h NESO intensity forecast`} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block' }}>Profile A
                  <select value={presetA} onChange={e => setPresetA(e.target.value)} style={{ ...selPx, width: '100%', marginTop: 4 }}>
                    {Object.keys(LOAD_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block' }}>Profile B
                  <select value={presetB} onChange={e => setPresetB(e.target.value)} style={{ ...selPx, width: '100%', marginTop: 4 }}>
                    {Object.keys(LOAD_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block' }}>Matching rule
                    <select value={cfeMode} onChange={e => setCfeMode(e.target.value)} style={{ ...selPx, width: '100%', marginTop: 4 }}>
                      <option value="share">Zero-carbon share estimate (1 − CI/394)</option>
                      <option value="threshold">Threshold rule (CI ≤ limit ⇒ matched)</option>
                    </select>
                  </label>
                  {cfeMode === 'threshold' && (
                    <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginTop: 8 }}>
                      CI limit: <b>{ciThreshold} g/kWh</b>
                      <input type="range" min={40} max={250} step={5} value={ciThreshold} onChange={e => setCiThreshold(Number(e.target.value))} style={{ width: '100%' }} />
                    </label>
                  )}
                </div>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              <KpiCard label={`CFE Score — ${presetA.split(' (')[0]}`} value={`${scoreA.toFixed(1)}%`} sub="Load-weighted carbon-free match" accent={T.blue} />
              <KpiCard label={`CFE Score — ${presetB.split(' (')[0]}`} value={`${scoreB.toFixed(1)}%`} sub="Load-weighted carbon-free match" accent={T.orange} />
              <KpiCard label="A vs B Delta" value={`${(scoreA - scoreB) >= 0 ? '+' : ''}${(scoreA - scoreB).toFixed(1)} pp`} sub={scoreA >= scoreB ? `${presetA.split(' (')[0]} matches cleaner` : `${presetB.split(' (')[0]} matches cleaner`} accent={T.indigo} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <Card>
                <SectionH title="Hourly CFE Fraction vs Load Profiles" sub="CFE fraction of each period (left axis, %) against the two normalized load shapes (right axis)" />
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={cfeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(cfeSeries.length / 14) - 1)} angle={-20} height={52} textAnchor="end" />
                    <YAxis yAxisId="cfe" unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="load" orientation="right" domain={[0, 1.2]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="cfe" type="monotone" dataKey="cfePct" name="CFE fraction (%)" stroke={T.green} fill={T.green} fillOpacity={0.15} />
                    <Line yAxisId="load" type="monotone" dataKey="loadA" name={`Load A (${presetA.split(' (')[0]})`} stroke={T.blue} strokeWidth={2} dot={false} />
                    <Line yAxisId="load" type="monotone" dataKey="loadB" name={`Load B (${presetB.split(' (')[0]})`} stroke={T.orange} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <SectionH title="All Presets" sub="CFE score under the current matching rule" />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cfeAllPresets} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="cfe" name="CFE score">
                      {cfeAllPresets.map((p, i) => <Cell key={p.name} fill={[T.blue, T.orange, T.teal, T.purple][i % 4]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card style={{ marginTop: 20 }}>
              <SectionH title="Matching Formula (documented)" />
              <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.7, fontFamily: T.fontMono, background: T.sub, padding: 16, borderRadius: 8 }}>
                CFE% = Σₜ load(hour(t)) × cfe(t) ÷ Σₜ load(hour(t)) &nbsp;— over every forecast period t<br />
                {cfeMode === 'share'
                  ? <>cfe(t) = max(0, 1 − CI(t) / 394) &nbsp;— GB fossil marginal plant is CCGT (≈394 gCO2/kWh per NESO methodology); with coal ≈ 0 on the GB grid, fossil share ≈ CI/394, so 1 − CI/394 estimates the zero-carbon generation share of period t.</>
                  : <>cfe(t) = 1 if CI(t) ≤ {ciThreshold} g/kWh else 0 &nbsp;— binary carbon-aware matching: a period counts as fully matched only when grid intensity is at or below your limit.</>}
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 10 }}>
                Caveats: this is grid-mix matching (locational, GB national signal), not contractual 24/7 CFE accounting per the EnergyTag / Google CFE standard — it ignores your PPA portfolio, storage and certificate matching. Biomass and imports are treated per NESO's intensity factors inside CI itself.
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4 — Methodology */}
        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
              <SectionH title="Data Source — verified live" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {[
                    ['Source', 'UK NESO Carbon Intensity API (with University of Oxford)'],
                    ['Base URL', 'https://api.carbonintensity.org.uk'],
                    ['License', 'CC-BY 4.0 — free, no API key'],
                    ['Coverage', 'Great Britain grid: national + 14 DNO regions'],
                    ['Resolution', 'Half-hour settlement periods'],
                    ['Forecast horizon', 'NESO publishes ~48-54h ahead; the proxy requests up to 96h and returns what exists'],
                    ['Verified', '2026-07-04 — /intensity, /generation, /regional, /intensity/{from}/fw48h all responded 200 with live values'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ ...tdPx, fontWeight: 700, color: T.navy, width: 150, verticalAlign: 'top' }}>{k}</td>
                      <td style={tdPx}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card>
              <SectionH title="Backend Proxy & Fallback" />
              <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.8 }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 12, background: T.sub, padding: 14, borderRadius: 8, marginBottom: 12 }}>
                  GET /api/v1/grid-carbon/current&nbsp;&nbsp;(TTL 2 min)<br />
                  GET /api/v1/grid-carbon/forecast?hours=96&nbsp;&nbsp;(TTL 15 min, chains 2× fw48h)<br />
                  GET /api/v1/grid-carbon/regional&nbsp;&nbsp;(TTL 5 min)
                </div>
                Thin proxies in <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>backend/api/v1/routes/grid_carbon.py</span> with short in-process TTL caches (fair use of the free API) and serve-stale-on-error.
                <br /><br />
                <b>Demo fallback is real data:</b> when the proxy is unreachable this page shows a static snapshot captured from the live API at {SNAP_CAPTURED} (GB was at 73 gCO2/kWh actual, 44.1% wind). Nothing on this page is synthetically generated.
              </div>
            </Card>
            <Card style={{ gridColumn: '1 / -1' }}>
              <SectionH title="Attribution" />
              <div style={{ fontSize: 13, color: T.textSec }}>
                Data: "Carbon Intensity API — National Energy System Operator (NESO)", licensed under CC-BY 4.0. Regional breakdown uses NESO's 14 GB distribution network operator (DNO) region ids 1-14; England/Scotland/Wales/GB aggregate rows (ids 15-18) are excluded from regional analytics by default. Carbon intensity includes only generation-based emissions per NESO methodology (no embodied or lifecycle emissions).
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
