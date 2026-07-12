import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

// ============================================================================
// Global Physical Risk Atlas — "digital twin" module.
//
// Wires four new backend endpoints (built in parallel by a sibling agent —
// this file assumes their existence and degrades gracefully if they are not
// yet deployed or return an unexpected shape):
//   POST /api/v1/global-physical-risk/point-profile      {lat, lon, radius_km?}
//   POST /api/v1/global-physical-risk/portfolio-profile   {locations:[{id,lat,lon}]}
//   GET  /api/v1/global-physical-risk/region-summary      ?min_lon&min_lat&max_lon&max_lat
//   GET  /api/v1/global-physical-risk/coverage-stats
//
// MAP RENDERING — DATA HONESTY NOTE:
// This platform has no mapping library installed (no leaflet / mapbox / react-
// simple-maps / deck.gl / d3-geo in package.json), and per this session's
// discipline of not adding new dependencies for something a lean hand-rolled
// approach can cover, the world visualization below is pure SVG using a
// standard equirectangular projection (x = (lon+180)/360*W, y = (90-lat)/180*H).
// No real coastline path data is embedded — we do not have a verified,
// compact, public-domain simplified world-outline path on hand, and fabricating
// one would risk misleading geography. Instead the map renders a labeled
// lat/lon graticule (every 30°) plus rough continent-name text hints (NOT
// coastlines) so the projection and any real plotted points are still
// meaningful. Any hazard-grid markers plotted come only from real API
// responses — nothing here is randomly generated.
// ============================================================================

const API = 'http://localhost:8001';
const GPR_API = `${API}/api/v1/global-physical-risk`;

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

// ---------------------------------------------------------------------------
// Equirectangular projection — viewBox is 960 x 480 (2:1, standard for this
// projection). Hand-checked coordinate examples (see report):
//   lat=0,  lon=0    -> x=480, y=240 (dead centre of the 960x480 box)
//   lat=90, lon=0    -> x=480, y=0   (north pole, top edge)
//   lat=-90,lon=0    -> x=480, y=480 (south pole, bottom edge)
//   lon=-180         -> x=0  (left edge)   lon=180 -> x=960 (right edge)
// ---------------------------------------------------------------------------
const MAP_W = 960;
const MAP_H = 480;
const project = (lat, lon) => ({
  x: ((lon + 180) / 360) * MAP_W,
  y: ((90 - lat) / 180) * MAP_H,
});

// Real, verifiable named locations — quick-pick set spans high-hazard
// coastal/seismic/wildfire geographies plus one deliberate low-risk control.
const QUICK_PICKS = [
  { key: 'tokyo', name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { key: 'miami', name: 'Miami, USA', lat: 25.7617, lon: -80.1918 },
  { key: 'rotterdam', name: 'Rotterdam, Netherlands', lat: 51.9244, lon: 4.4777 },
  { key: 'la', name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
  { key: 'regina', name: 'Regina, Canada (low-risk control)', lat: 50.4452, lon: -104.6189 },
];

// Rough continent-label hints for orientation only — NOT coastline data.
const CONTINENT_HINTS = [
  { label: 'N. AMERICA', lat: 45, lon: -100 },
  { label: 'S. AMERICA', lat: -15, lon: -60 },
  { label: 'EUROPE', lat: 50, lon: 15 },
  { label: 'AFRICA', lat: 2, lon: 20 },
  { label: 'ASIA', lat: 45, lon: 90 },
  { label: 'AUSTRALIA', lat: -25, lon: 135 },
  { label: 'ANTARCTICA', lat: -80, lon: 0 },
];

const HAZARD_LAYERS = [
  { key: 'earthquake', label: 'Earthquake', aliases: ['earthquake', 'seismic'] },
  { key: 'cyclone', label: 'Cyclone', aliases: ['cyclone', 'tropical_cyclone', 'hurricane'] },
  { key: 'wildfire', label: 'Wildfire', aliases: ['wildfire', 'fire'] },
  { key: 'flood', label: 'Flood', aliases: ['flood', 'fluvial_flood', 'pluvial_flood'] },
  { key: 'sea_level', label: 'Sea-Level Rise', aliases: ['sea_level', 'sea_level_rise', 'sealevel', 'slr'] },
];

// ---------------------------------------------------------------------------
// Generic, schema-tolerant helpers — the sibling agent's exact response
// field names weren't available while building this page, so every reader
// below tries several plausible key spellings and otherwise degrades to
// "no data" rather than guessing/fabricating a number.
// ---------------------------------------------------------------------------
const firstDefined = (...vals) => vals.find(v => v !== undefined && v !== null);

const prettify = (k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const getLayerContainer = (raw) => raw?.layers || raw?.hazard_layers || raw?.coverage || raw || {};

const getLayerObj = (raw, aliases) => {
  const container = getLayerContainer(raw);
  for (const a of aliases) {
    if (container && container[a] != null) return container[a];
  }
  return null;
};

const extractRowCount = (layerObj) => {
  if (layerObj == null) return null;
  if (typeof layerObj === 'number') return layerObj;
  return firstDefined(layerObj.row_count, layerObj.rows, layerObj.count, layerObj.n_rows, layerObj.total_rows, layerObj.records);
};

const extractCoveragePct = (layerObj) => {
  if (!isPlainObject(layerObj)) return null;
  return firstDefined(layerObj.coverage_pct, layerObj.coveragePct, layerObj.pct_covered, layerObj.completeness_pct);
};

const extractExtent = (layerObj) => {
  if (!isPlainObject(layerObj)) return null;
  const e = layerObj.extent || layerObj.spatial_extent || layerObj.bbox || layerObj;
  const minLon = firstDefined(e.min_lon, e.minLon, e.min_longitude);
  const maxLon = firstDefined(e.max_lon, e.maxLon, e.max_longitude);
  const minLat = firstDefined(e.min_lat, e.minLat, e.min_latitude);
  const maxLat = firstDefined(e.max_lat, e.maxLat, e.max_latitude);
  if (minLon == null && maxLon == null && minLat == null && maxLat == null) return null;
  return { minLon, maxLon, minLat, maxLat };
};

// Extract an array of {lat, lon, ...} grid cells from a region-summary /
// coverage response, trying several plausible container/field names.
const extractCells = (raw) => {
  if (!raw) return [];
  const arr = firstDefined(raw.cells, raw.grid_cells, raw.grid, raw.points, Array.isArray(raw) ? raw : undefined) || [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map(c => {
      const lat = firstDefined(c.lat, c.latitude, c.y);
      const lon = firstDefined(c.lon, c.lng, c.longitude, c.x);
      if (lat == null || lon == null) return null;
      const score = firstDefined(c.composite_score, c.score, c.hazard_score, c.value);
      return { lat: Number(lat), lon: Number(lon), score: score != null ? Number(score) : null };
    })
    .filter(Boolean);
};

const scoreColor = (score) => {
  if (score == null || Number.isNaN(score)) return T.indigo;
  const s = Math.max(0, Math.min(100, score));
  if (s < 25) return T.green;
  if (s < 50) return T.amber;
  if (s < 75) return T.orange;
  return T.red;
};

// ---------------------------------------------------------------------------
// Small shared components (page-local convention, matches other module pages)
// ---------------------------------------------------------------------------
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

// Live / Unavailable status badge — this module never fabricates a "demo"
// fallback dataset; if the engine can't be reached we say so plainly.
const StatusBadge = ({ status, liveLabel, loadingLabel }) => {
  if (status === 'idle') return <Badge val="Not run yet" color={T.textSec} bg={T.sub} />;
  if (status === 'loading') return <Badge val={loadingLabel || 'Connecting…'} color="#94a3b8" bg="#1e293b" />;
  if (status === 'live') return <Badge val={liveLabel || '● Live'} color="#166534" bg="#dcfce7" />;
  return <Badge val="○ Engine not yet available" color="#92400e" bg="#fef3c7" />;
};

// Generic schema-tolerant key/value table — used for hazard breakdowns and
// data_availability blocks whose exact field names weren't known in advance.
const FieldsTable = ({ obj }) => {
  if (obj == null) return <div style={{ fontSize: 12, color: T.textSec }}>No data returned</div>;
  if (!isPlainObject(obj)) return <div style={{ fontSize: 13, fontFamily: T.fontMono, color: T.textPri }}>{String(obj)}</div>;
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return <div style={{ fontSize: 12, color: T.textSec }}>No fields returned</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '4px 8px', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{prettify(k)}</td>
            <td style={{ padding: '4px 8px', fontFamily: T.fontMono, color: T.textPri, wordBreak: 'break-word' }}>
              {isPlainObject(v) || Array.isArray(v) ? JSON.stringify(v) : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Data-availability badges — booleans/strings render as pill badges (green
// when truthy / 'real' / 'available', amber otherwise); anything else falls
// back to the generic FieldsTable.
const DataAvailabilityBlock = ({ obj }) => {
  if (!isPlainObject(obj) || Object.keys(obj).length === 0) {
    return <div style={{ fontSize: 12, color: T.textSec }}>No data_availability block returned by the engine.</div>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {Object.entries(obj).map(([k, v]) => {
        const truthy = v === true || v === 'real' || v === 'available' || v === 'yes' || (typeof v === 'number' && v > 0);
        const label = typeof v === 'boolean' ? (v ? 'available' : 'missing') : String(v);
        return <Badge key={k} val={`${prettify(k)}: ${label}`} color={truthy ? '#166534' : '#92400e'} bg={truthy ? '#dcfce7' : '#fef3c7'} />;
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// World map — graticule (30°) + continent-name hints + real hazard-grid
// cells (if the engine returns any) + quick-pick / portfolio markers.
// ---------------------------------------------------------------------------
const WorldMap = ({ cells, quickPicks, highlighted, onPickClick, portfolioPoints }) => {
  const parallels = [-90, -60, -30, 0, 30, 60, 90];
  const meridians = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];

  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width="100%" style={{ display: 'block', background: '#0e1f33', borderRadius: 8 }}>
      {/* Ocean/base fill */}
      <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#0e1f33" />

      {/* Graticule */}
      {meridians.map(lon => {
        const { x } = project(0, lon);
        return (
          <line key={`m${lon}`} x1={x} y1={0} x2={x} y2={MAP_H}
            stroke={lon === 0 ? '#3b82f6' : '#1e3a5f'} strokeWidth={lon === 0 ? 1.1 : 0.6} opacity={lon === 0 ? 0.7 : 0.45} />
        );
      })}
      {parallels.map(lat => {
        const { y } = project(lat, 0);
        return (
          <line key={`p${lat}`} x1={0} y1={y} x2={MAP_W} y2={y}
            stroke={lat === 0 ? '#3b82f6' : '#1e3a5f'} strokeWidth={lat === 0 ? 1.1 : 0.6} opacity={lat === 0 ? 0.7 : 0.45} />
        );
      })}
      {parallels.map(lat => {
        const { y } = project(lat, -180);
        return <text key={`pl${lat}`} x={4} y={y - 3} fontSize={8} fill="#7ca3c9" fontFamily={T.fontMono}>{lat}°</text>;
      })}
      {meridians.filter(l => l !== -180).map(lon => {
        const { x } = project(-90, lon);
        return <text key={`ml${lon}`} x={x + 2} y={MAP_H - 4} fontSize={8} fill="#7ca3c9" fontFamily={T.fontMono}>{lon}°</text>;
      })}

      {/* Continent-name hints (orientation only — not coastline data) */}
      {CONTINENT_HINTS.map(c => {
        const { x, y } = project(c.lat, c.lon);
        return (
          <text key={c.label} x={x} y={y} fontSize={11} fill="#4d6b8a" fontWeight={700}
            textAnchor="middle" letterSpacing="1.5" style={{ pointerEvents: 'none' }}>{c.label}</text>
        );
      })}

      {/* Real hazard-grid cells returned by the coverage/region-summary API */}
      {cells.map((c, i) => {
        const { x, y } = project(c.lat, c.lon);
        return <circle key={i} cx={x} cy={y} r={2.2} fill={scoreColor(c.score)} opacity={0.85} />;
      })}

      {/* Portfolio locations (small teal squares) */}
      {portfolioPoints.map(p => {
        const { x, y } = project(p.lat, p.lon);
        return <rect key={p.id} x={x - 3} y={y - 3} width={6} height={6} fill={T.teal} stroke="#fff" strokeWidth={0.7} />;
      })}

      {/* Quick-pick markers */}
      {quickPicks.map(p => {
        const { x, y } = project(p.lat, p.lon);
        const isHi = highlighted?.key === p.key;
        return (
          <g key={p.key} onClick={() => onPickClick(p)} style={{ cursor: 'pointer' }}>
            {isHi && <circle cx={x} cy={y} r={9} fill="none" stroke={T.gold} strokeWidth={2} opacity={0.9} />}
            <circle cx={x} cy={y} r={4.5} fill={isHi ? T.gold : '#e2e8f0'} stroke="#0e1f33" strokeWidth={1} />
            <title>{p.name}</title>
          </g>
        );
      })}
    </svg>
  );
};

const TABS = ['Digital Twin Coverage', 'World Map', 'Point Query', 'Portfolio Comparison'];

export default function GlobalPhysicalRiskAtlasPage() {
  const [tab, setTab] = useState(0);

  // --- Coverage stats (header + tab 0) --------------------------------------
  const [coverage, setCoverage] = useState({ status: 'loading', data: null });
  useEffect(() => {
    let cancelled = false;
    axios.get(`${GPR_API}/coverage-stats`, { timeout: 15000 })
      .then(({ data }) => { if (!cancelled) setCoverage({ status: 'live', data }); })
      .catch(() => { if (!cancelled) setCoverage({ status: 'unavailable', data: null }); });
    return () => { cancelled = true; };
  }, []);

  const coverageLayers = useMemo(() => HAZARD_LAYERS.map(h => {
    const obj = getLayerObj(coverage.data, h.aliases);
    return {
      ...h,
      rowCount: extractRowCount(obj),
      coveragePct: extractCoveragePct(obj),
      extent: extractExtent(obj),
    };
  }), [coverage.data]);

  const totalRows = useMemo(() => {
    const explicit = firstDefined(coverage.data?.total_rows, coverage.data?.total_row_count);
    if (explicit != null) return explicit;
    const sum = coverageLayers.reduce((a, l) => a + (typeof l.rowCount === 'number' ? l.rowCount : 0), 0);
    return sum > 0 ? sum : null;
  }, [coverage.data, coverageLayers]);

  // --- Real hazard-grid cells for the world map (region-summary, global bbox)
  const [worldCells, setWorldCells] = useState({ status: 'loading', cells: [] });
  useEffect(() => {
    let cancelled = false;
    axios.get(`${GPR_API}/region-summary`, {
      params: { min_lon: -180, min_lat: -90, max_lon: 180, max_lat: 90 },
      timeout: 20000,
    })
      .then(({ data }) => { if (!cancelled) setWorldCells({ status: 'live', cells: extractCells(data) }); })
      .catch(() => { if (!cancelled) setWorldCells({ status: 'unavailable', cells: [] }); });
    return () => { cancelled = true; };
  }, []);

  // --- Point-query tool -------------------------------------------------------
  const [ptLat, setPtLat] = useState(String(QUICK_PICKS[0].lat));
  const [ptLon, setPtLon] = useState(String(QUICK_PICKS[0].lon));
  const [ptRadius, setPtRadius] = useState('50');
  const [ptLabel, setPtLabel] = useState(QUICK_PICKS[0].name);
  const [highlighted, setHighlighted] = useState(QUICK_PICKS[0]);
  const [pointResult, setPointResult] = useState({ status: 'idle', data: null, error: null });

  const runPointQuery = useCallback(async (latOverride, lonOverride) => {
    const lat = parseFloat(latOverride != null ? latOverride : ptLat);
    const lon = parseFloat(lonOverride != null ? lonOverride : ptLon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    setPointResult({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post(`${GPR_API}/point-profile`, {
        lat, lon, radius_km: Math.max(1, parseFloat(ptRadius) || 50),
      }, { timeout: 20000 });
      setPointResult({ status: 'live', data, error: null });
    } catch (e) {
      setPointResult({ status: 'unavailable', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [ptLat, ptLon, ptRadius]);

  const onQuickPick = (p) => {
    setHighlighted(p);
    setPtLat(String(p.lat));
    setPtLon(String(p.lon));
    setPtLabel(p.name);
    setTab(2);
    runPointQuery(p.lat, p.lon);
  };

  const composite = firstDefined(pointResult.data?.composite_score, pointResult.data?.compositeScore);
  const hazardsObj = pointResult.data?.hazards || pointResult.data?.hazard_scores || pointResult.data?.per_hazard || pointResult.data?.hazard_profile || null;
  const dataAvailability = pointResult.data?.data_availability || pointResult.data?.dataAvailability || null;
  const narrative = firstDefined(pointResult.data?.narrative, pointResult.data?.risk_narrative, pointResult.data?.summary, pointResult.data?.description);

  // --- Portfolio panel ---------------------------------------------------------
  const [portfolioRows, setPortfolioRows] = useState([
    { id: 'p1', name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
    { id: 'p2', name: 'Miami, USA', lat: 25.7617, lon: -80.1918 },
    { id: 'p3', name: 'Regina, Canada (control)', lat: 50.4452, lon: -104.6189 },
  ]);
  const [newLoc, setNewLoc] = useState({ name: '', lat: '', lon: '' });
  const [portfolioResult, setPortfolioResult] = useState({ status: 'idle', profiles: [] });

  const addLocation = () => {
    const lat = parseFloat(newLoc.lat), lon = parseFloat(newLoc.lon);
    if (!newLoc.name.trim() || Number.isNaN(lat) || Number.isNaN(lon)) return;
    setPortfolioRows(rows => [...rows, { id: `p${Date.now()}`, name: newLoc.name.trim(), lat, lon }]);
    setNewLoc({ name: '', lat: '', lon: '' });
  };

  const removeLocation = (id) => setPortfolioRows(rows => rows.filter(r => r.id !== id));

  const runPortfolioQuery = async () => {
    if (portfolioRows.length === 0) return;
    setPortfolioResult({ status: 'loading', profiles: [] });
    try {
      const { data } = await axios.post(`${GPR_API}/portfolio-profile`, {
        locations: portfolioRows.map(r => ({ id: r.id, lat: r.lat, lon: r.lon })),
      }, { timeout: 30000 });
      const profiles = firstDefined(data?.profiles, data?.results, data?.batch_profiles, Array.isArray(data) ? data : undefined) || [];
      setPortfolioResult({ status: 'live', profiles });
    } catch (e) {
      setPortfolioResult({ status: 'unavailable', profiles: [], error: e?.response?.data?.detail || e.message });
    }
  };

  const portfolioById = useMemo(() => {
    const m = new Map();
    portfolioResult.profiles.forEach(p => {
      const id = firstDefined(p.id, p.location_id, p.entity_id);
      if (id != null) m.set(String(id), p);
    });
    return m;
  }, [portfolioResult.profiles]);

  const selPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };
  const inpPx = { ...selPx, width: '100%', boxSizing: 'border-box' };
  const th = { padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
  const td = { padding: '7px 10px', borderBottom: `1px solid ${T.borderL}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>GLOBAL PHYSICAL RISK ATLAS · DIGITAL TWIN</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Global Physical Risk Atlas</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Multi-hazard point/portfolio profiles · earthquake · cyclone · wildfire · flood · sea-level rise
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={coverage.status} liveLabel="● Live — coverage from /api/v1/global-physical-risk/coverage-stats" loadingLabel="Connecting to coverage engine…" />
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{totalRows != null ? `${Number(totalRows).toLocaleString()} hazard-grid rows ingested` : 'Row counts pending'}</div>
            <div>{worldCells.cells.length} real hazard-grid cells shown on map</div>
            <div>5 quick-pick reference locations</div>
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

        {/* TAB 0 — Coverage / digital-twin build progress */}
        {tab === 0 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.6 }}>
                <b>Coverage so far</b> — this shows how much real hazard-grid data has been ingested into the digital
                twin per layer, not a claim of complete global coverage. Some layers may still be sparse depending on
                ingestion progress. <StatusBadge status={coverage.status} loadingLabel="Loading…" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
              {coverageLayers.map(l => (
                <KpiCard
                  key={l.key}
                  label={l.label}
                  value={l.rowCount != null ? Number(l.rowCount).toLocaleString() : '—'}
                  sub={l.rowCount != null ? 'rows ingested' : (coverage.status === 'unavailable' ? 'engine not yet available' : 'awaiting data')}
                  accent={l.rowCount ? T.teal : T.textSec}
                />
              ))}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textSec }}>
                Per-layer spatial extent (min/max lon-lat of ingested rows) and coverage %, where the engine reports them.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: T.sub }}>
                  <tr>{['Hazard Layer', 'Row Count', 'Coverage %', 'Lon Extent', 'Lat Extent'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {coverageLayers.map(l => (
                    <tr key={l.key}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{l.label}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{l.rowCount != null ? Number(l.rowCount).toLocaleString() : '—'}</td>
                      <td style={{ ...td, fontFamily: T.fontMono }}>{l.coveragePct != null ? `${l.coveragePct}%` : '—'}</td>
                      <td style={{ ...td, fontFamily: T.fontMono, fontSize: 12 }}>{l.extent ? `${l.extent.minLon?.toFixed?.(1)} to ${l.extent.maxLon?.toFixed?.(1)}` : '—'}</td>
                      <td style={{ ...td, fontFamily: T.fontMono, fontSize: 12 }}>{l.extent ? `${l.extent.minLat?.toFixed?.(1)} to ${l.extent.maxLat?.toFixed?.(1)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 1 — World map */}
        {tab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <SectionH title="World Hazard-Grid Map" sub="Pure SVG equirectangular projection — graticule (30°) + continent-name hints, NOT real coastline outlines (see Methodology note below)" />
              <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatusBadge status={worldCells.status} liveLabel={`● Live — ${worldCells.cells.length} real hazard-grid cell(s) shown`} loadingLabel="Querying region-summary for global extent…" />
                <Badge val="Gold ring = selected quick-pick location · Teal square = portfolio location" color={T.navy} bg={T.sub} />
              </div>
              <WorldMap
                cells={worldCells.cells}
                quickPicks={QUICK_PICKS}
                highlighted={highlighted}
                onPickClick={onQuickPick}
                portfolioPoints={portfolioRows}
              />
              <div style={{ marginTop: 10, fontSize: 11.5, color: T.textSec }}>
                {worldCells.cells.length > 0
                  ? `${worldCells.cells.length} real hazard-grid cells shown — this is exactly what the region-summary engine returned for the whole-globe bounding box, not a fabricated heatmap.`
                  : 'No real hazard-grid cells returned yet (engine offline or the digital twin has no rows ingested for this extent) — nothing is fabricated here.'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 — Point query */}
        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionH title="Point Risk Profile" sub="POST /api/v1/global-physical-risk/point-profile" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {QUICK_PICKS.map(p => (
                  <button key={p.key} onClick={() => onQuickPick(p)} style={{
                    padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    border: highlighted?.key === p.key ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
                    background: highlighted?.key === p.key ? '#fff8e6' : T.card, color: T.navy,
                  }}>{p.name}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Latitude
                  <input style={{ ...selPx, width: 120 }} type="number" step="0.0001" value={ptLat} onChange={e => setPtLat(e.target.value)} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Longitude
                  <input style={{ ...selPx, width: 120 }} type="number" step="0.0001" value={ptLon} onChange={e => setPtLon(e.target.value)} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Radius (km)
                  <input style={{ ...selPx, width: 100 }} type="number" min="1" max="500" value={ptRadius} onChange={e => setPtRadius(e.target.value)} />
                </label>
                <button onClick={() => runPointQuery()} disabled={pointResult.status === 'loading'} style={{
                  background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
                  fontSize: 13, fontWeight: 700, cursor: pointResult.status === 'loading' ? 'wait' : 'pointer',
                }}>
                  {pointResult.status === 'loading' ? 'Querying…' : 'Run Point Query →'}
                </button>
                <StatusBadge status={pointResult.status} liveLabel="● Live — engine response" loadingLabel="Querying engine…" />
              </div>
              {ptLabel && <div style={{ marginTop: 8, fontSize: 12, color: T.textSec }}>Selected: <b>{ptLabel}</b></div>}
            </div>

            {pointResult.status === 'live' && pointResult.data && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                  <KpiCard label="Composite Physical Risk Score" value={composite != null ? Number(composite).toFixed(1) : '—'} sub="0-100 composite across all hazards" accent={scoreColor(composite)} />
                  <KpiCard label="Latitude / Longitude" value={`${ptLat}, ${ptLon}`} sub={`Radius ${ptRadius} km`} accent={T.indigo} />
                  <KpiCard label="Hazard Layers Returned" value={hazardsObj ? Object.keys(hazardsObj).length : 0} sub="per-hazard breakdown below" accent={T.teal} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                    <SectionH title="Per-Hazard Breakdown" sub="Score + raw values, exactly as returned by the engine" />
                    {hazardsObj && isPlainObject(hazardsObj) && Object.keys(hazardsObj).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {Object.entries(hazardsObj).map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{prettify(k)}</div>
                            <FieldsTable obj={v} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: T.textSec }}>No per-hazard breakdown returned by the engine for this point.</div>
                    )}
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                    <SectionH title="Data Availability" sub="Which layers had real data at this point" />
                    <DataAvailabilityBlock obj={dataAvailability} />
                    <div style={{ marginTop: 18 }}>
                      <SectionH title="Risk Narrative" sub="Plain-language summary from the engine" />
                      <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.6, background: T.sub, borderRadius: 8, padding: 12 }}>
                        {narrative || 'No narrative text returned by the engine for this point.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pointResult.status === 'unavailable' && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, fontSize: 13, color: T.textSec }}>
                Global Physical Risk Engine point-profile endpoint is not yet available{pointResult.error ? ` (${pointResult.error})` : ''}. Nothing is shown in place of real data.
              </div>
            )}
          </div>
        )}

        {/* TAB 3 — Portfolio comparison */}
        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionH title="Portfolio Locations" sub="POST /api/v1/global-physical-risk/portfolio-profile — batch composite scores across a small asset list" />
              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: T.sub }}>
                    <tr>{['Name', 'Lat', 'Lon', 'Composite Score', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {portfolioRows.map(r => {
                      const live = portfolioById.get(String(r.id));
                      const score = live ? firstDefined(live.composite_score, live.compositeScore) : null;
                      return (
                        <tr key={r.id}>
                          <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.name}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.lat}</td>
                          <td style={{ ...td, fontFamily: T.fontMono }}>{r.lon}</td>
                          <td style={{ ...td, fontFamily: T.fontMono, fontWeight: 700, color: score != null ? scoreColor(score) : T.textSec }}>
                            {score != null ? Number(score).toFixed(1) : (portfolioResult.status === 'live' ? 'n/a' : '—')}
                          </td>
                          <td style={td}><button onClick={() => removeLocation(r.id)} style={{ border: 'none', background: 'none', color: T.red, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Remove</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Name
                  <input style={{ ...selPx, width: 220 }} value={newLoc.name} onChange={e => setNewLoc(n => ({ ...n, name: e.target.value }))} placeholder="e.g. Jakarta Distribution Hub" />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Latitude
                  <input style={{ ...selPx, width: 110 }} type="number" step="0.0001" value={newLoc.lat} onChange={e => setNewLoc(n => ({ ...n, lat: e.target.value }))} />
                </label>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Longitude
                  <input style={{ ...selPx, width: 110 }} type="number" step="0.0001" value={newLoc.lon} onChange={e => setNewLoc(n => ({ ...n, lon: e.target.value }))} />
                </label>
                <button onClick={addLocation} style={{ background: T.sage, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Location</button>
                <button onClick={runPortfolioQuery} disabled={portfolioResult.status === 'loading' || portfolioRows.length === 0} style={{
                  background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
                  fontSize: 13, fontWeight: 700, cursor: portfolioResult.status === 'loading' ? 'wait' : 'pointer',
                }}>
                  {portfolioResult.status === 'loading' ? 'Running…' : 'Run Portfolio Profile →'}
                </button>
                <StatusBadge status={portfolioResult.status} liveLabel="● Live — batch results" loadingLabel="Querying engine…" />
              </div>
              {portfolioResult.status === 'unavailable' && portfolioResult.error && (
                <div style={{ fontSize: 12, color: T.textSec }}>Portfolio-profile endpoint not yet available ({portfolioResult.error}). Nothing fabricated in its place.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
