import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CITIES = ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Edinburgh', 'Glasgow', 'Cardiff'];
const TYPES = ['Office', 'Retail', 'Industrial', 'Residential', 'Hotel', 'Mixed-Use'];
const CERTS = ['BREEAM', 'LEED', 'None'];
const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const PROPERTIES = Array.from({ length: 80 }, (_, i) => {
  const type = TYPES[Math.floor(sr(i * 7) * TYPES.length)];
  const city = CITIES[Math.floor(sr(i * 11) * CITIES.length)];
  const epcRating = EPC_RATINGS[Math.floor(sr(i * 13) * EPC_RATINGS.length)];
  const cert = CERTS[Math.floor(sr(i * 17) * CERTS.length)];
  const size = Math.round(500 + sr(i * 3) * 9500);
  const energyIntensity = Math.round(80 + sr(i * 5) * 320);
  const carbonIntensity = Math.round(20 + sr(i * 9) * 180);
  const valuePsm = Math.round(2000 + sr(i * 19) * 13000);
  const epcIndex = EPC_RATINGS.indexOf(epcRating);
  const certBonus = cert === 'BREEAM' ? 0.08 : cert === 'LEED' ? 0.07 : 0;
  const greenPremium = parseFloat(((certBonus + (6 - epcIndex) * 0.008 + sr(i * 23) * 0.04 - 0.02) * 100).toFixed(1));
  const stranded = epcIndex >= 4 && sr(i * 29) > 0.35;
  const capex = parseFloat((size * (0.05 + sr(i * 31) * 0.25) / 1000000).toFixed(2));
  return {
    id: i + 1,
    name: `${type} ${city} ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
    type, city, epcRating, greenCertification: cert,
    size, energyIntensity, carbonIntensity, valuePsm, greenPremium, stranded, capex,
  };
});

const TABS = [
  'Overview', 'EPC Analysis', 'Green Premium', 'Stranding Risk',
  'Energy Benchmarks', 'Retrofit Economics', 'Carbon Pathway', 'Market Intelligence',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function GreenBuildingValuationPage() {
  const [tab, setTab] = useState('Overview');
  const [filterType, setFilterType] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterEpc, setFilterEpc] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(75);
  const [energyPrice, setEnergyPrice] = useState(28);

  const filtered = useMemo(() => {
    return PROPERTIES.filter(p => {
      if (filterType !== 'All' && p.type !== filterType) return false;
      if (filterCity !== 'All' && p.city !== filterCity) return false;
      if (filterEpc === 'A-B' && !['A', 'B'].includes(p.epcRating)) return false;
      if (filterEpc === 'C-D' && !['C', 'D'].includes(p.epcRating)) return false;
      if (filterEpc === 'E-G' && !['E', 'F', 'G'].includes(p.epcRating)) return false;
      return true;
    });
  }, [filterType, filterCity, filterEpc]);

  const avgGreenPremium = filtered.length ? (filtered.reduce((s, p) => s + p.greenPremium, 0) / filtered.length).toFixed(1) : '0.0';
  const strandedPct = filtered.length ? ((filtered.filter(p => p.stranded).length / filtered.length) * 100).toFixed(1) : '0.0';
  const totalPortfolioValue = filtered.length ? (filtered.reduce((s, p) => s + p.valuePsm * p.size / 1e6, 0)).toFixed(0) : '0';
  const avgEnergy = filtered.length ? (filtered.reduce((s, p) => s + p.energyIntensity, 0) / filtered.length).toFixed(0) : '0';

  const certBarData = useMemo(() => CERTS.map(c => ({
    name: c,
    'Avg Premium (%)': parseFloat((PROPERTIES.filter(p => p.greenCertification === c).reduce((s, p) => s + p.greenPremium, 0) / Math.max(1, PROPERTIES.filter(p => p.greenCertification === c).length)).toFixed(2)),
  })), []);

  const scatterData = useMemo(() => filtered.map(p => ({
    x: p.energyIntensity, y: p.carbonIntensity, name: p.name,
  })), [filtered]);

  const carbonPathway = useMemo(() => {
    const years = [2025, 2028, 2031, 2034, 2037, 2040, 2043, 2046, 2049, 2052];
    const avgCarbon = filtered.length ? filtered.reduce((s, p) => s + p.carbonIntensity, 0) / filtered.length : 80;
    return years.map((yr, i) => ({
      year: yr,
      'Portfolio Intensity': parseFloat((avgCarbon * Math.pow(0.92, i)).toFixed(1)),
      'Net Zero Pathway': parseFloat((avgCarbon * Math.pow(0.85, i)).toFixed(1)),
    }));
  }, [filtered]);

  const retrofitByType = useMemo(() => TYPES.map(t => ({
    name: t,
    'Total Capex (£M)': parseFloat((PROPERTIES.filter(p => p.type === t).reduce((s, p) => s + p.capex, 0)).toFixed(1)),
  })), []);

  const epcDist = useMemo(() => EPC_RATINGS.map(r => ({
    name: r,
    Count: filtered.filter(p => p.epcRating === r).length,
  })), [filtered]);

  const premiumByEpc = useMemo(() => EPC_RATINGS.map(r => {
    const arr = filtered.filter(p => p.epcRating === r);
    return {
      name: r,
      'Avg Premium (%)': arr.length ? parseFloat((arr.reduce((s, p) => s + p.greenPremium, 0) / arr.length).toFixed(2)) : 0,
    };
  }), [filtered]);

  const strandedByType = useMemo(() => TYPES.map(t => {
    const arr = filtered.filter(p => p.type === t);
    return {
      name: t,
      'Stranded (%)': arr.length ? parseFloat(((arr.filter(p => p.stranded).length / arr.length) * 100).toFixed(1)) : 0,
    };
  }), [filtered]);

  const energyByType = useMemo(() => TYPES.map(t => {
    const arr = filtered.filter(p => p.type === t);
    return {
      name: t,
      'Avg kWh/sqm': arr.length ? parseFloat((arr.reduce((s, p) => s + p.energyIntensity, 0) / arr.length).toFixed(0)) : 0,
    };
  }), []);

  const retrofitROI = useMemo(() => {
    const top15 = [...filtered].sort((a, b) => b.capex - a.capex).slice(0, 15);
    return top15.map(p => {
      const annualSaving = p.size * p.carbonIntensity * carbonPrice / 1e6 + p.size * p.energyIntensity * energyPrice / 100 / 1e6;
      const payback = p.capex > 0 ? (p.capex / annualSaving).toFixed(1) : 'N/A';
      return { name: p.name.slice(0, 18), 'Capex (£M)': p.capex, 'Annual Saving (£M)': parseFloat(annualSaving.toFixed(3)), 'Payback (yrs)': parseFloat(payback) };
    });
  }, [filtered, carbonPrice, energyPrice]);

  const marketIntelData = useMemo(() => TYPES.map(t => {
    const arr = PROPERTIES.filter(p => p.type === t);
    return {
      name: t,
      'Avg Value £/sqm': arr.length ? parseFloat((arr.reduce((s, p) => s + p.valuePsm, 0) / arr.length).toFixed(0)) : 0,
      'Green Premium (%)': arr.length ? parseFloat((arr.filter(p => p.greenCertification !== 'None').reduce((s, p) => s + p.greenPremium, 0) / Math.max(1, arr.filter(p => p.greenCertification !== 'None').length)).toFixed(1)) : 0,
    };
  }), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DE1 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Green Building Valuation Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>80 properties · EPC/BREEAM/LEED · Green premium analysis · Stranding risk · Retrofit economics</div>
      </div>

      {/* Filters */}
      <div style={{ background: T.cream, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', filterType, setFilterType, ['All', ...TYPES]],
          ['City', filterCity, setFilterCity, ['All', ...CITIES]],
          ['EPC', filterEpc, setFilterEpc, ['All', 'A-B', 'C-D', 'E-G']]].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon Price £{carbonPrice}/tCO2:
          <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Energy {energyPrice}p/kWh:
          <input type="range" min={10} max={60} value={energyPrice} onChange={e => setEnergyPrice(+e.target.value)} style={{ width: 100 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {PROPERTIES.length} properties</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Avg Green Premium" value={`${avgGreenPremium}%`} sub="vs non-certified" color={T.green} />
        <KpiCard label="Stranding Risk" value={`${strandedPct}%`} sub="EPC E-G at risk" color={T.red} />
        <KpiCard label="Portfolio Value" value={`£${Number(totalPortfolioValue).toLocaleString()}M`} sub="filtered properties" color={T.navy} />
        <KpiCard label="Avg Energy Intensity" value={`${avgEnergy} kWh/sqm`} sub="portfolio average" color={T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 18px', fontSize: 13, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none',
              borderBottom: tab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              color: tab === t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 32px' }}>
        {tab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Green Premium by Certification</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={certBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Premium (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Energy vs Carbon Intensity (Scatter)</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Energy kWh/sqm" tick={{ fontSize: 11 }} label={{ value: 'kWh/sqm', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Carbon kgCO2/sqm" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>EPC Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={epcDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Count" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Market Value by Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={marketIntelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Avg Value £/sqm" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'EPC Analysis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>EPC Rating Distribution</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={epcDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Count" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Green Premium by EPC Rating</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={premiumByEpc}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Premium (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, gridColumn: 'span 2' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Properties — EPC Detail ({filtered.length})</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Name', 'Type', 'City', 'EPC', 'Cert', 'Size (sqm)', 'Energy (kWh/sqm)', 'Green Premium %'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 20).map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '7px 10px' }}>{p.name}</td>
                        <td style={{ padding: '7px 10px' }}>{p.type}</td>
                        <td style={{ padding: '7px 10px' }}>{p.city}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ background: ['A', 'B'].includes(p.epcRating) ? T.green : ['C', 'D'].includes(p.epcRating) ? T.amber : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{p.epcRating}</span>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{p.greenCertification}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.size.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.energyIntensity}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.greenPremium > 5 ? T.green : p.greenPremium > 0 ? T.amber : T.red }}>{p.greenPremium}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'Green Premium' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Premium by Certification</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={certBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Premium (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Market Value by Type</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketIntelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Avg Value £/sqm" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Green Premium (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Stranding Risk' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Stranding Risk by Property Type</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strandedByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Stranded (%)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Stranded Properties Summary</div>
              {filtered.filter(p => p.stranded).slice(0, 12).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span style={{ color: T.textPri }}>{p.name}</span>
                  <span style={{ color: T.red, fontFamily: T.fontMono, fontSize: 11 }}>EPC {p.epcRating} · £{p.capex}M capex</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Energy Benchmarks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Avg Energy Intensity by Type (kWh/sqm)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={energyByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg kWh/sqm" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Energy vs Carbon Scatter</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Energy kWh/sqm" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Carbon kgCO2/sqm" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Retrofit Economics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Retrofit Capex by Property Type (£M)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retrofitByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Total Capex (£M)" fill={T.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Retrofit ROI — Top Properties</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Property', 'Capex £M', 'Saving £M/yr', 'Payback yrs'].map(h => (
                        <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {retrofitROI.slice(0, 12).map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '6px 8px' }}>{r.name}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>{r['Capex (£M)']}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: T.green }}>{r['Annual Saving (£M)']}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: r['Payback (yrs)'] > 15 ? T.red : T.green }}>{r['Payback (yrs)']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'Carbon Pathway' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Carbon Intensity Pathway to Net Zero (kgCO2/sqm)</div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={carbonPathway}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Portfolio Intensity" stroke={T.amber} fill={T.amber} fillOpacity={0.3} strokeWidth={2} />
                  <Area type="monotone" dataKey="Net Zero Pathway" stroke={T.green} fill={T.green} fillOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Market Intelligence' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Market Value & Green Premium by Type</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketIntelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Avg Value £/sqm" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Green Premium (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Certification Impact on Value — Summary</div>
              {CERTS.map(c => {
                const arr = PROPERTIES.filter(p => p.greenCertification === c);
                const avgPrem = arr.length ? (arr.reduce((s, p) => s + p.greenPremium, 0) / arr.length).toFixed(1) : '0.0';
                const avgVal = arr.length ? (arr.reduce((s, p) => s + p.valuePsm, 0) / arr.length).toFixed(0) : '0';
                return (
                  <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.textPri }}>{c}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontFamily: T.fontMono, color: T.green }}>{avgPrem}% premium</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>£{Number(avgVal).toLocaleString()}/sqm avg</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
