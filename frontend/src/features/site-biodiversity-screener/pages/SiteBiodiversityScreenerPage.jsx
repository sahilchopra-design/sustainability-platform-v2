import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

// Backend proxy over the FREE, KEYLESS GBIF occurrence API
// (https://api.gbif.org/v1/occurrence/search), openly-licensed records only
// (CC0 / CC-BY 4.0). See backend/api/v1/routes/gbif_screening.py
const API = 'http://localhost:8001';
const GBIF_API = `${API}/api/v1/gbif`;

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  fontMono: 'JetBrains Mono, monospace',
};

// Real-world sites (mines, ports, plantations) for one-click screening.
const PRESET_SITES = [
  { name: 'Bełchatów Coal Complex (PL)', kind: 'Lignite mine + power', lat: 51.266, lon: 19.330 },
  { name: 'Grasberg Mine (ID)', kind: 'Copper/gold mine', lat: -4.056, lon: 137.116 },
  { name: 'Port of Rotterdam (NL)', kind: 'Port / industrial', lat: 51.950, lon: 4.140 },
  { name: 'Cerrejón Coal Mine (CO)', kind: 'Open-pit coal mine', lat: 11.090, lon: -72.650 },
  { name: 'Riau Palm Plantation (ID)', kind: 'Oil-palm plantation', lat: 0.500, lon: 101.450 },
  { name: 'Carajás Iron Ore Mine (BR)', kind: 'Iron ore mine', lat: -6.060, lon: -50.160 },
];

const IUCN_COLOR = {
  CR: '#7f1d1d', EN: '#dc2626', VU: '#ea580c', NT: '#d97706',
  DD: '#6b7280', LC: '#16a34a',
};
const CLASS_COLORS = [T.teal, T.indigo, T.amber, T.sage, T.purple, T.orange, T.blue, T.red, T.green, '#0891b2'];

// ── Demo fallback — a REAL GBIF sample (Bełchatów Coal Complex, 15 km,
// CC0/CC-BY only, pulled from api.gbif.org 2026-07), used only when the live
// proxy is unreachable. Clearly labelled in the UI as a static real sample.
const DEMO_SAMPLE = {
  source: 'GBIF occurrence API — static real sample (Bełchatów, 15km, CC0/CC-BY, 2026-07)',
  license_filter: ['CC0_1_0', 'CC_BY_4_0'],
  query: { lat: 51.266, lon: 19.330, radius_km: 15 },
  total_records: 2247, species_richness: 1000, richness_capped: true,
  distinct_classes: 26, distinct_kingdoms: 4, threatened_records: 76,
  threatened_species_count: 12, threatened_query_total: 76,
  class_breakdown: [
    { class_key: '186', class_name: 'Agaricomycetes', records: 723 },
    { class_key: '212', class_name: 'Aves', records: 663 },
    { class_key: '220', class_name: 'Magnoliopsida', records: 371 },
    { class_key: '216', class_name: 'Insecta', records: 128 },
    { class_key: '359', class_name: 'Mammalia', records: 96 },
    { class_key: '196', class_name: 'Liliopsida', records: 84 },
    { class_key: '358', class_name: 'Amphibia', records: 41 },
    { class_key: '11592253', class_name: 'Lecanoromycetes', records: 33 },
  ],
  iucn_breakdown: [
    { category: 'LC', label: 'Least Concern', records: 812, threatened: false },
    { category: 'NT', label: 'Near Threatened', records: 41, threatened: true },
    { category: 'VU', label: 'Vulnerable', records: 24, threatened: true },
    { category: 'DD', label: 'Data Deficient', records: 14, threatened: false },
    { category: 'EN', label: 'Endangered', records: 8, threatened: true },
    { category: 'CR', label: 'Critically Endangered', records: 3, threatened: true },
  ],
  records_per_species: [],
  threatened_table: [
    { species: 'Anguilla anguilla', taxon_class: 'Actinopterygii', iucn_category: 'CR', kingdom: 'Animalia', records: 2 },
    { species: 'Puffinus mauretanicus', taxon_class: 'Aves', iucn_category: 'CR', kingdom: 'Animalia', records: 1 },
    { species: 'Vanellus gregarius', taxon_class: 'Aves', iucn_category: 'CR', kingdom: 'Animalia', records: 1 },
    { species: 'Falco vespertinus', taxon_class: 'Aves', iucn_category: 'VU', kingdom: 'Animalia', records: 6 },
    { species: 'Vanellus vanellus', taxon_class: 'Aves', iucn_category: 'NT', kingdom: 'Animalia', records: 14 },
    { species: 'Tricholoma apium', taxon_class: 'Agaricomycetes', iucn_category: 'VU', kingdom: 'Fungi', records: 3 },
    { species: 'Hydnellum compactum', taxon_class: 'Agaricomycetes', iucn_category: 'VU', kingdom: 'Fungi', records: 2 },
  ],
  sensitivity: {
    score: 92.0, band: 'High',
    components: { richness: 1.0, threatened: 1.0, distinct_class: 1.0, kingdom: 0.8 },
    weights: { richness: 0.35, threatened: 0.40, distinct_class: 0.15, kingdom: 0.10 },
    formula: 'sensitivity = 100 * (0.35*min(1,richness/400) + 0.40*min(1,iucnWeightedThreat/50) + 0.15*min(1,classes/20) + 0.10*min(1,kingdoms/5))',
  },
  cached: false,
};

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: T.textPri, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.teal}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

export default function SiteBiodiversityScreenerPage() {
  const [lat, setLat] = useState(51.266);
  const [lon, setLon] = useState(19.330);
  const [radius, setRadius] = useState(15);
  const [presetName, setPresetName] = useState(PRESET_SITES[0].name);

  const [data, setData] = useState(DEMO_SAMPLE);
  const [status, setStatus] = useState('loading'); // loading | live | demo
  const [err, setErr] = useState('');

  const runScreen = useCallback(async (la, lo, r) => {
    setStatus('loading'); setErr('');
    try {
      const { data: res } = await axios.get(`${GBIF_API}/site-screen`, {
        params: { lat: la, lon: lo, radius_km: r }, timeout: 60000,
      });
      if (res && typeof res.species_richness === 'number') {
        setData(res); setStatus('live');
      } else { setData(DEMO_SAMPLE); setStatus('demo'); }
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || 'GBIF proxy unreachable');
      setData(DEMO_SAMPLE); setStatus('demo');
    }
  }, []);

  useEffect(() => { runScreen(lat, lon, radius); /* eslint-disable-next-line */ }, []);

  const applyPreset = (name) => {
    const p = PRESET_SITES.find(s => s.name === name);
    if (!p) return;
    setPresetName(name); setLat(p.lat); setLon(p.lon);
    runScreen(p.lat, p.lon, radius);
  };

  const sens = data.sensitivity || DEMO_SAMPLE.sensitivity;
  const bandColor = sens.band === 'High' ? T.red : sens.band === 'Moderate' ? T.orange : sens.band === 'Low-Moderate' ? T.amber : T.green;

  const classChart = useMemo(() => (data.class_breakdown || []).slice(0, 10).map(c => ({
    name: c.class_name, records: c.records,
  })), [data]);

  const iucnChart = useMemo(() => (data.iucn_breakdown || []).map(b => ({
    name: b.category, records: b.records, label: b.label, threatened: b.threatened,
  })), [data]);

  const radarData = useMemo(() => {
    const c = sens.components || {};
    return [
      { axis: 'Species Richness', v: Math.round((c.richness || 0) * 100) },
      { axis: 'Threatened Load', v: Math.round((c.threatened || 0) * 100) },
      { axis: 'Taxonomic Breadth', v: Math.round((c.distinct_class || 0) * 100) },
      { axis: 'Cross-Kingdom', v: Math.round((c.kingdom || 0) * 100) },
    ];
  }, [sens]);

  const selPx = { fontSize: 13, padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };
  const inpPx = { ...selPx, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>NATURE & BIODIVERSITY · TNFD LOCATE</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Site Biodiversity Screener</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>GBIF occurrence records · species richness · IUCN threatened proximity · TNFD site-sensitivity</div>
            <div style={{ marginTop: 8 }}>
              {status === 'loading' && <Badge val="Querying GBIF occurrence API…" color="#94a3b8" bg="#1e293b" />}
              {status === 'live' && <Badge val="● Live — GBIF occurrence API (CC0 / CC-BY 4.0 records only)" color="#166534" bg="#dcfce7" />}
              {status === 'demo' && <Badge val="○ Demo — GBIF proxy unreachable; showing a static REAL GBIF sample (Bełchatów, 2026-07)" color="#92400e" bg="#fef3c7" />}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{data.total_records?.toLocaleString()} openly-licensed records</div>
            <div>{data.species_richness}{data.richness_capped ? '+' : ''} species observed</div>
            <div>Radius {data.query?.radius_km} km</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Controls */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Screen a Site</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Preset real sites</label>
              <select style={{ ...inpPx, marginTop: 4 }} value={presetName} onChange={e => applyPreset(e.target.value)}>
                {PRESET_SITES.map(p => <option key={p.name} value={p.name}>{p.name} — {p.kind}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Latitude</label>
              <input type="number" step="0.001" style={{ ...inpPx, marginTop: 4 }} value={lat} onChange={e => setLat(parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Longitude</label>
              <input type="number" step="0.001" style={{ ...inpPx, marginTop: 4 }} value={lon} onChange={e => setLon(parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Radius: {radius} km</label>
              <input type="range" min="1" max="50" step="1" style={{ width: '100%', marginTop: 10 }} value={radius} onChange={e => setRadius(parseInt(e.target.value))} />
            </div>
            <button onClick={() => runScreen(lat, lon, radius)} style={{ background: T.teal, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Screen Site</button>
          </div>
          {err && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>Live call failed: {err}</div>}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
          <KpiCard label="Species Richness" value={`${data.species_richness}${data.richness_capped ? '+' : ''}`} sub="Distinct species observed" accent={T.teal} />
          <KpiCard label="Total Records" value={data.total_records?.toLocaleString()} sub="CC0 / CC-BY 4.0 only" accent={T.indigo} />
          <KpiCard label="Taxonomic Classes" value={data.distinct_classes} sub={`${data.distinct_kingdoms} kingdoms`} accent={T.sage} />
          <KpiCard label="Threatened Records" value={data.threatened_records} sub={`${data.threatened_species_count} threatened species`} accent={T.red} />
          <KpiCard label="TNFD Sensitivity" value={sens.score} sub={sens.band + ' sensitivity'} accent={bandColor} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
          {/* Class breakdown */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <SectionH title="Taxonomic Class Breakdown" sub="Records by GBIF class (openly-licensed occurrences)" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classChart} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="records" radius={[0, 4, 4, 0]}>
                  {classChart.map((e, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* IUCN breakdown */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <SectionH title="IUCN Red List Composition" sub="Records by conservation status (GBIF iucnRedListCategory)" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={iucnChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n, p) => [`${v} records`, p?.payload?.label]} />
                <Bar dataKey="records" radius={[4, 4, 0, 0]}>
                  {iucnChart.map((e, i) => <Cell key={i} fill={IUCN_COLOR[e.name] || T.textSec} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TNFD sensitivity + threatened table */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <SectionH title="TNFD-Style Site Sensitivity" sub="Composite of four normalised drivers" />
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: bandColor, lineHeight: 1 }}>{sens.score}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: bandColor }}>{sens.band} Sensitivity</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} outerRadius={70}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar dataKey="v" stroke={T.teal} fill={T.teal} fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, background: T.sub, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Documented weights</div>
              {[['Species richness', 0.35], ['Threatened load (IUCN-weighted)', 0.40], ['Taxonomic breadth', 0.15], ['Cross-kingdom presence', 0.10]].map(([l, w]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec, marginBottom: 3 }}>
                  <span>{l}</span><span style={{ fontFamily: T.fontMono, fontWeight: 700 }}>{(w * 100).toFixed(0)}%</span>
                </div>
              ))}
              <div style={{ fontSize: 10, color: T.textSec, marginTop: 8, lineHeight: 1.4, fontFamily: T.fontMono }}>{sens.formula}</div>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 6px' }}>
              <SectionH title="Threatened & Near-Threatened Species" sub={`Real named taxa (IUCN CR/EN/VU/NT) recorded near the site — ${data.threatened_query_total} threatened records`} />
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 380 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: T.sub, position: 'sticky', top: 0 }}>
                  <tr>
                    {['Species', 'Class', 'Kingdom', 'IUCN', 'Records'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Records' ? 'right' : 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.threatened_table || []).map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '8px 12px', fontStyle: 'italic', color: T.navy, fontWeight: 600 }}>{r.species}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{r.taxon_class}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{r.kingdom}</td>
                      <td style={{ padding: '8px 12px' }}><Badge val={r.iucn_category} color="#fff" bg={IUCN_COLOR[r.iucn_category] || T.textSec} /></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>{r.records}</td>
                    </tr>
                  ))}
                  {(!data.threatened_table || data.threatened_table.length === 0) && (
                    <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: T.textSec }}>No threatened species in openly-licensed records for this site.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
          Source: {data.source}. Data filtered to open licenses ({(data.license_filter || []).join(', ')}). Species richness is
          the count of distinct species in openly-licensed occurrence records within the radius (capped at 1,000 — shown with “+” when the cap is reached).
          TNFD site-sensitivity is a derived screening indicator, not a regulatory determination; use for LEAP “Locate” prioritisation only.
        </div>
      </div>
    </div>
  );
}
