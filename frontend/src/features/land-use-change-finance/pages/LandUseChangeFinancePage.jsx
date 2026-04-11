import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'East Asia', 'MENA', 'Europe'];
const REDD_STATUSES = ['Active', 'Developing', 'None'];

const COUNTRY_DATA = [
  'Brazil', 'Indonesia', 'Congo DRC', 'Peru', 'Colombia', 'Bolivia', 'Madagascar', 'Cameroon',
  'Papua New Guinea', 'Myanmar', 'Malaysia', 'Vietnam', 'Ecuador', 'Mexico', 'Tanzania',
  'Mozambique', 'Zambia', 'Zimbabwe', 'Ethiopia', 'Kenya', 'Uganda', 'Ghana', 'Ivory Coast',
  'Nigeria', 'Gabon', 'Guyana', 'Suriname', 'Paraguay', 'Venezuela', 'Nicaragua',
  'Honduras', 'Guatemala', 'Costa Rica', 'Panama', 'India', 'Laos', 'Cambodia', 'Thailand',
  'Philippines', 'Solomon Islands', 'Vanuatu', 'Fiji', 'Australia', 'Bangladesh', 'Nepal',
];

const LAND_COUNTRIES = Array.from({ length: 45 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const reddStatus = REDD_STATUSES[i % REDD_STATUSES.length];
  return {
    id: i,
    name: COUNTRY_DATA[i] || `Country ${i + 1}`,
    region,
    forestCover: +(15 + sr(i * 7) * 75).toFixed(1),
    annualDeforestationRate: +(0.1 + sr(i * 11) * 3.5).toFixed(2),
    reddCreditsIssued: +(sr(i * 13) * 50).toFixed(1),
    restorationTarget: +(sr(i * 17) * 15).toFixed(1),
    ndcLandUseCommitment: +(sr(i * 5) * 500).toFixed(0),
    carbonStockForest: +(sr(i * 19) * 80).toFixed(1),
    biodiversityHotspot: sr(i * 3) > 0.4,
    jurisdictionalReddStatus: reddStatus,
    landTenureSecurity: +(1 + sr(i * 23) * 9).toFixed(1),
    climateFinanceReceived: +(sr(i * 29) * 8).toFixed(2),
  };
});

const TABS = [
  'Country Overview', 'Deforestation Trends', 'REDD+ Credits', 'Restoration Pipeline',
  'NDC Land Commitments', 'Carbon Stock Analytics', 'Biodiversity Overlay', 'Climate Finance Flows',
];

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

export default function LandUseChangeFinancePage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [reddFilter, setReddFilter] = useState('All');
  const [bioHotspot, setBioHotspot] = useState(false);
  const [carbonPrice, setCarbonPrice] = useState(25);
  const [finMobilisation, setFinMobilisation] = useState(10);

  const filtered = useMemo(() => {
    return LAND_COUNTRIES.filter(c => {
      if (regionFilter !== 'All' && c.region !== regionFilter) return false;
      if (reddFilter !== 'All' && c.jurisdictionalReddStatus !== reddFilter) return false;
      if (bioHotspot && !c.biodiversityHotspot) return false;
      return true;
    });
  }, [regionFilter, reddFilter, bioHotspot]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const totalForest = filtered.reduce((a, c) => a + c.forestCover, 0);
    const avgDefo = filtered.reduce((a, c) => a + c.annualDeforestationRate, 0) / n;
    const totalRedd = filtered.reduce((a, c) => a + c.reddCreditsIssued, 0);
    const totalRestoration = filtered.reduce((a, c) => a + c.restorationTarget, 0);
    return { totalForest: totalForest.toFixed(0), avgDefo: avgDefo.toFixed(2), totalRedd: totalRedd.toFixed(0), totalRestoration: totalRestoration.toFixed(0) };
  }, [filtered]);

  const defoTop15 = useMemo(() =>
    [...filtered].sort((a, b) => b.annualDeforestationRate - a.annualDeforestationRate).slice(0, 15)
      .map(c => ({ name: c.name, rate: c.annualDeforestationRate })), [filtered]);

  const reddScatter = useMemo(() =>
    filtered.map(c => ({ x: c.forestCover, y: c.reddCreditsIssued, name: c.name })), [filtered]);

  const restorationPipeline = useMemo(() =>
    YEARS.map((yr, i) => ({
      year: yr,
      target: +(filtered.reduce((a, c) => a + c.restorationTarget * (0.6 + i * 0.08 + finMobilisation / 500), 0)).toFixed(0),
      funded: +(filtered.reduce((a, c) => a + c.restorationTarget * (0.3 + i * 0.05 + finMobilisation / 1000), 0)).toFixed(0),
    })), [filtered, finMobilisation]);

  const finByRegion = useMemo(() =>
    REGIONS.map(reg => {
      const items = filtered.filter(c => c.region === reg);
      return { region: reg.split(' ').slice(-1)[0], finance: +(items.reduce((a, c) => a + c.climateFinanceReceived, 0)).toFixed(1) };
    }), [filtered]);

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: T.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DG3 · Food, Agriculture & Land Use</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Land Use Change Finance</h1>
        <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>Deforestation, REDD+ credits, restoration pipelines and climate finance across 45 jurisdictions</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Forest Cover (Mha)', value: `${kpis.totalForest}`, color: T.sage },
          { label: 'Avg Deforestation Rate (%pa)', value: `${kpis.avgDefo}%`, color: T.red },
          { label: 'Total REDD+ Credits (MtCO2)', value: `${kpis.totalRedd}`, color: T.green },
          { label: 'Total Restoration Target (Mha)', value: `${kpis.totalRestoration}`, color: T.teal },
        ].map(k => (
          <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Region', value: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
          { label: 'REDD+ Status', value: reddFilter, set: setReddFilter, opts: ['All', ...REDD_STATUSES] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.label}</div>
            <select value={f.value} onChange={e => f.set(e.target.value)} style={{ fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="bio" checked={bioHotspot} onChange={e => setBioHotspot(e.target.checked)} />
          <label htmlFor="bio" style={{ fontSize: 12, color: T.textSec }}>Biodiversity Hotspots Only</label>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Carbon Price: ${carbonPrice}/tCO2</div>
          <input type="range" min={5} max={150} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Finance Mobilisation: ${finMobilisation}Bn</div>
          <input type="range" min={0} max={100} step={5} value={finMobilisation} onChange={e => setFinMobilisation(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} jurisdictions</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: tab === i ? T.navy : T.sub, color: tab === i ? '#fff' : T.textSec, fontWeight: tab === i ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Jurisdictional Overview</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Country', 'Region', 'Forest Cover %', 'Defo Rate %pa', 'REDD+ (Mt)', 'Carbon Stock (Gt)', 'REDD Status', 'Bio Hotspot'].map(h => (
                    <th key={h} style={{ padding: '7px 9px', textAlign: 'left', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 25).map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '5px 9px', color: T.textPri, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '5px 9px', color: T.textSec }}>{c.region}</td>
                    <td style={{ padding: '5px 9px', fontFamily: T.fontMono }}>{c.forestCover}%</td>
                    <td style={{ padding: '5px 9px', color: c.annualDeforestationRate > 2 ? T.red : T.amber, fontFamily: T.fontMono }}>{c.annualDeforestationRate}%</td>
                    <td style={{ padding: '5px 9px', fontFamily: T.fontMono }}>{c.reddCreditsIssued}</td>
                    <td style={{ padding: '5px 9px', fontFamily: T.fontMono }}>{c.carbonStockForest}</td>
                    <td style={{ padding: '5px 9px' }}>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: c.jurisdictionalReddStatus === 'Active' ? T.green + '22' : c.jurisdictionalReddStatus === 'Developing' ? T.amber + '22' : T.red + '22', color: c.jurisdictionalReddStatus === 'Active' ? T.green : c.jurisdictionalReddStatus === 'Developing' ? T.amber : T.red }}>
                        {c.jurisdictionalReddStatus}
                      </span>
                    </td>
                    <td style={{ padding: '5px 9px', color: c.biodiversityHotspot ? T.green : T.textSec }}>{c.biodiversityHotspot ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Annual Deforestation Rate — Top 15 Countries (%pa)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={defoTop15} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={v => [`${v}%`, 'Deforestation Rate']} />
              <Bar dataKey="rate" fill={T.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Forest Cover vs REDD+ Credits Issued</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Carbon price assumption: ${carbonPrice}/tCO2</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="Forest Cover %" tick={{ fontSize: 11 }} label={{ value: 'Forest Cover %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="REDD+ Credits (MtCO2)" tick={{ fontSize: 11 }} label={{ value: 'REDD+ Credits (MtCO2)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={reddScatter} fill={T.green} fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Restoration Pipeline (Mha) 2025–2030</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Finance mobilisation: ${finMobilisation}Bn applied to funded trajectory</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={restorationPipeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="target" name="Restoration Target" stroke={T.teal} fill={T.teal + '33'} strokeWidth={2} />
              <Area type="monotone" dataKey="funded" name="Funded Pipeline" stroke={T.green} fill={T.green + '33'} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>NDC Land Use Commitments (MtCO2 reduction)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...filtered].sort((a, b) => b.ndcLandUseCommitment - a.ndcLandUseCommitment).slice(0, 20).map(c => ({ name: c.name, commitment: +c.ndcLandUseCommitment }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v} MtCO2`, 'NDC Commitment']} />
              <Bar dataKey="commitment" fill={T.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Forest Carbon Stock (GtCO2)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...filtered].sort((a, b) => b.carbonStockForest - a.carbonStockForest).slice(0, 20).map(c => ({ name: c.name, stock: c.carbonStockForest, value: +(c.carbonStockForest * 1000 * carbonPrice / 1000).toFixed(0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" name="Carbon Stock (GtCO2)" fill={T.sage} radius={[4, 4, 0, 0]} />
              <Bar dataKey="value" name={`Est. Value ($Bn at $${carbonPrice}/t)`} fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Biodiversity Hotspot Countries</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {filtered.filter(c => c.biodiversityHotspot).map(c => (
              <div key={c.id} style={{ background: T.sub, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.borderL}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{c.region}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Forest Cover</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono }}>{c.forestCover}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Defo Rate</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.red }}>{c.annualDeforestationRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Tenure Security</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono }}>{c.landTenureSecurity}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Climate Finance Received by Region ($Bn)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={finByRegion}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}Bn`, 'Finance Received']} />
              <Bar dataKey="finance" fill={T.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
