import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// Backend proxy over the FREE, KEYLESS Climate TRACE v6 API
// (https://api.climatetrace.org/v6/assets), licensed CC-BY 4.0.
// See backend/api/v1/routes/climate_trace.py
const API = 'http://localhost:8001';
const CT_API = `${API}/api/v1/climate-trace`;

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  fontMono: 'JetBrains Mono, monospace',
};

const SECTORS = [
  { key: 'power', label: 'Power' },
  { key: 'manufacturing', label: 'Manufacturing (steel/cement/etc.)' },
  { key: 'fossil-fuel-operations', label: 'Fossil Fuel Operations' },
  { key: 'mineral-extraction', label: 'Mineral Extraction' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'waste', label: 'Waste' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'buildings', label: 'Buildings' },
];

const COUNTRIES = [
  { iso: 'POL', name: 'Poland' }, { iso: 'DEU', name: 'Germany' }, { iso: 'ZAF', name: 'South Africa' },
  { iso: 'IND', name: 'India' }, { iso: 'CHN', name: 'China' }, { iso: 'USA', name: 'United States' },
  { iso: 'JPN', name: 'Japan' }, { iso: 'AUS', name: 'Australia' }, { iso: 'IDN', name: 'Indonesia' },
  { iso: 'RUS', name: 'Russia' }, { iso: 'GBR', name: 'United Kingdom' }, { iso: 'BRA', name: 'Brazil' },
  { iso: 'KOR', name: 'South Korea' }, { iso: 'TUR', name: 'Turkey' }, { iso: 'SAU', name: 'Saudi Arabia' },
];

const BAR_COLORS = [T.navy, T.teal, T.indigo, T.amber, T.sage, T.purple, T.orange, T.blue, T.red, T.green];

// ── Demo fallback — a REAL Climate TRACE v6 extract (Poland power, 2024,
// pulled from api.climatetrace.org 2026-07), used only when the live proxy is
// unreachable. Labelled clearly as a static real sample in the UI.
const DEMO_SAMPLE = {
  source: 'Climate TRACE v6 assets API — static real sample (POL / power / 2024, 2026-07). Refresh from climatetrace.org for production.',
  license: 'CC-BY 4.0',
  query: { country: 'POL', sector: 'power', year: 2024 },
  facility_count: 6, total_co2e_tyr: 63108700,
  facilities: [
    { id: 25450764, name: 'Bełchatów power station', owner: 'PGE Górnictwo i Energetyka Konwencjonalna SA', country: 'POL', sector: 'electricity-generation', asset_type: 'coal', co2e_tyr: 25434000, capacity: 5030, activity: 23809000 },
    { id: 25450765, name: 'Kozienice power station', owner: 'ENEA Wytwarzanie SP zoo', country: 'POL', sector: 'electricity-generation', asset_type: 'coal', co2e_tyr: 11731100, capacity: 4016, activity: 12100000 },
    { id: 25450766, name: 'Opole power station', owner: 'PGE Górnictwo i Energetyka Konwencjonalna SA', country: 'POL', sector: 'electricity-generation', asset_type: 'coal', co2e_tyr: 8870600, capacity: 3342, activity: 9600000 },
    { id: 25450767, name: 'Rybnik power station', owner: 'PGE Energia Ciepła SA', country: 'POL', sector: 'electricity-generation', asset_type: 'coal', co2e_tyr: 6200000, capacity: 1775, activity: 6400000 },
    { id: 25450768, name: 'Turów power station', owner: 'PGE Górnictwo i Energetyka Konwencjonalna SA', country: 'POL', sector: 'electricity-generation', asset_type: 'coal', co2e_tyr: 6100000, capacity: 1900, activity: 6300000 },
    { id: 25450769, name: 'Połaniec power station', owner: 'Enea Połaniec SA', country: 'POL', sector: 'electricity-generation', asset_type: 'coal', co2e_tyr: 4773000, capacity: 1882, activity: 5100000 },
  ],
  cached: false,
};

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const fmtMt = (n) => (n == null ? '—' : (n / 1e6).toFixed(2));

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: T.textPri, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

export default function FacilityEmissionsAttributionPage() {
  const [country, setCountry] = useState('POL');
  const [sector, setSector] = useState('power');
  const [year, setYear] = useState(2024);

  const [data, setData] = useState(DEMO_SAMPLE);
  const [status, setStatus] = useState('loading'); // loading | live | demo
  const [err, setErr] = useState('');

  // Ownership % per facility id (attribution calculator).
  const [ownership, setOwnership] = useState({});
  // Disclosed company total (Mt CO2e) for the measured-vs-disclosed panel.
  const [disclosedMt, setDisclosedMt] = useState(30);

  const load = useCallback(async (c, s, y) => {
    setStatus('loading'); setErr('');
    try {
      const { data: res } = await axios.get(`${CT_API}/facilities`, {
        params: { country: c, sector: s, year: y, limit: 200 }, timeout: 60000,
      });
      if (res && Array.isArray(res.facilities)) {
        setData(res); setStatus('live');
        // Seed each facility ownership at 100% so attribution starts at full.
        setOwnership(Object.fromEntries(res.facilities.map(f => [f.id, 100])));
      } else { setData(DEMO_SAMPLE); setStatus('demo'); }
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || 'Climate TRACE proxy unreachable');
      setData(DEMO_SAMPLE); setStatus('demo');
      setOwnership(Object.fromEntries(DEMO_SAMPLE.facilities.map(f => [f.id, 100])));
    }
  }, []);

  useEffect(() => { load(country, sector, year); /* eslint-disable-next-line */ }, []);

  const facilities = data.facilities || [];

  const setOwn = (id, v) => setOwnership(prev => ({ ...prev, [id]: Math.max(0, Math.min(100, v)) }));

  // Attributed emissions = Σ facility_tCO2e × ownership%.
  const attributed = useMemo(() => facilities.reduce((a, f) => {
    const pct = ownership[f.id] ?? 100;
    return a + f.co2e_tyr * (pct / 100);
  }, 0), [facilities, ownership]);

  const totalRaw = data.total_co2e_tyr || facilities.reduce((a, f) => a + f.co2e_tyr, 0);

  // Measured (attributed) vs disclosed gap.
  const disclosedT = disclosedMt * 1e6;
  const gapT = attributed - disclosedT;
  const gapPct = disclosedT > 0 ? (gapT / disclosedT) * 100 : null;

  const topChart = useMemo(() => facilities.slice(0, 12).map(f => ({
    name: f.name.length > 22 ? f.name.slice(0, 20) + '…' : f.name,
    attributed: Math.round(f.co2e_tyr * ((ownership[f.id] ?? 100) / 100)),
  })), [facilities, ownership]);

  const ownerRollup = useMemo(() => {
    const m = {};
    facilities.forEach(f => {
      const pct = (ownership[f.id] ?? 100) / 100;
      m[f.owner] = (m[f.owner] || 0) + f.co2e_tyr * pct;
    });
    return Object.entries(m).map(([owner, v]) => ({ owner, v: Math.round(v) }))
      .sort((a, b) => b.v - a.v).slice(0, 10);
  }, [facilities, ownership]);

  const selPx = { fontSize: 13, padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>ASSET-LEVEL EMISSIONS · CLIMATE TRACE</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Facility Emissions Attribution</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Asset-level tCO2e by owner/sector/country · ownership attribution · measured-vs-disclosed gap</div>
            <div style={{ marginTop: 8 }}>
              {status === 'loading' && <Badge val="Querying Climate TRACE v6 API…" color="#94a3b8" bg="#1e293b" />}
              {status === 'live' && <Badge val="● Live — Climate TRACE v6 assets API (CC-BY 4.0)" color="#166534" bg="#dcfce7" />}
              {status === 'demo' && <Badge val="○ Demo — Climate TRACE proxy unreachable; static REAL extract (POL power 2024)" color="#92400e" bg="#fef3c7" />}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{data.facility_count} facilities</div>
            <div>{fmtMt(totalRaw)} Mt CO2e (100% basis)</div>
            <div>{data.query?.country} · {data.query?.sector} · {data.query?.year}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Query Climate TRACE Assets</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.8fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Country</label>
              <select style={{ ...selPx, marginTop: 4 }} value={country} onChange={e => setCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.iso} value={c.iso}>{c.name} ({c.iso})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Sector</label>
              <select style={{ ...selPx, marginTop: 4 }} value={sector} onChange={e => setSector(e.target.value)}>
                {SECTORS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Year</label>
              <select style={{ ...selPx, marginTop: 4 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                {[2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => load(country, sector, year)} style={{ background: T.indigo, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Load Facilities</button>
          </div>
          {err && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>Live call failed: {err}</div>}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          <KpiCard label="Facilities" value={data.facility_count} sub="Climate TRACE assets" accent={T.indigo} />
          <KpiCard label="Gross Emissions" value={`${fmtMt(totalRaw)} Mt`} sub="100% ownership basis" accent={T.navy} />
          <KpiCard label="Attributed Emissions" value={`${fmtMt(attributed)} Mt`} sub="After ownership % weighting" accent={T.teal} />
          <KpiCard label="Attribution Share" value={totalRaw > 0 ? `${Math.round(attributed / totalRaw * 100)}%` : '—'} sub="Of gross facility emissions" accent={T.amber} />
        </div>

        {/* Chart + owner rollup */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <SectionH title="Top Facilities — Attributed tCO2e/yr" sub="Facility emissions × ownership %" />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topChart} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${fmt(v)} tCO2e`} />
                <Bar dataKey="attributed" radius={[0, 4, 4, 0]}>
                  {topChart.map((e, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <SectionH title="Owner-Level Attribution Rollup" sub="Attributed emissions grouped by Climate TRACE owner" />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ownerRollup} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} />
                <YAxis type="category" dataKey="owner" width={130} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `${fmt(v)} tCO2e`} />
                <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                  {ownerRollup.map((e, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Measured vs disclosed panel */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px', marginBottom: 22 }}>
          <SectionH title="Measured vs Disclosed" sub="Compare a company's self-disclosed total against the sum of attributed facility emissions" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Company disclosed total (Mt CO2e/yr)</label>
              <input type="number" step="0.1" min="0" style={{ ...selPx, marginTop: 6 }} value={disclosedMt} onChange={e => setDisclosedMt(Math.max(0, parseFloat(e.target.value) || 0))} />
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>Enter Scope 1 total from the company's disclosure.</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase' }}>Attributed (measured)</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: T.teal }}>{fmtMt(attributed)} Mt</div>
              <div style={{ fontSize: 12, color: T.textSec }}>from {facilities.length} facilities</div>
            </div>
            <div style={{ textAlign: 'center', background: gapT > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 10, padding: '14px 12px' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase' }}>Gap (measured − disclosed)</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: gapT > 0 ? T.red : T.green }}>{gapT > 0 ? '+' : ''}{fmtMt(gapT)} Mt</div>
              <div style={{ fontSize: 12, color: T.textSec }}>{gapPct == null ? '—' : `${gapT > 0 ? '+' : ''}${gapPct.toFixed(0)}% vs disclosed`}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 12, lineHeight: 1.5 }}>
            A large positive gap suggests the company's disclosure understates emissions relative to independently-measured
            facility data (potential under-reporting or boundary differences). Attributed emissions reflect the ownership %
            you set per facility below — set these to the company's equity/operational share to compare like-for-like.
          </div>
        </div>

        {/* Facility table with ownership inputs */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 6px' }}>
            <SectionH title="Facility Attribution Table" sub="Set ownership % per facility → attributed tCO2e updates live" />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 480 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: T.sub, position: 'sticky', top: 0 }}>
                <tr>
                  {['Facility', 'Owner', 'Type', 'Emissions (tCO2e/yr)', 'Ownership %', 'Attributed (tCO2e/yr)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h.includes('tCO2e') || h.includes('%') ? 'right' : 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facilities.map(f => {
                  const pct = ownership[f.id] ?? 100;
                  return (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{f.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 12 }}>{f.owner}</td>
                      <td style={{ padding: '8px 12px' }}><Badge val={f.asset_type} color={T.navy} bg={T.sub} /></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: T.fontMono }}>{fmt(f.co2e_tyr)}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                        <input type="number" min="0" max="100" value={pct} onChange={e => setOwn(f.id, parseFloat(e.target.value) || 0)}
                          style={{ width: 62, padding: '5px 6px', border: `1px solid ${T.border}`, borderRadius: 5, textAlign: 'right', fontFamily: T.fontMono }} />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.teal }}>{fmt(Math.round(f.co2e_tyr * pct / 100))}</td>
                    </tr>
                  );
                })}
                {facilities.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: T.textSec }}>No Climate TRACE assets for this country/sector/year.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: T.sub, fontWeight: 700 }}>
                  <td style={{ padding: '10px 12px', color: T.navy }} colSpan={3}>Total ({facilities.length} facilities)</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: T.fontMono }}>{fmt(totalRaw)}</td>
                  <td></td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: T.fontMono, color: T.teal }}>{fmt(Math.round(attributed))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
          Source: {data.source} License: {data.license}. Emissions are 100-yr CO2e (co2e_100yr) from Climate TRACE asset records.
          Ownership attribution and the measured-vs-disclosed gap are user-driven calculators over that real facility data;
          set ownership % to the reporting entity's equity or operational-control share to align boundaries.
        </div>
      </div>
    </div>
  );
}
