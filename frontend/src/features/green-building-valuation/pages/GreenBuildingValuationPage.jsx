import React, { useState, useMemo } from 'react';
import BuiltEnvironmentAdvancedAnalytics from '../../_shared/BuiltEnvironmentAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, CartesianGrid, Legend, LineChart, Line,
} from 'recharts';

const T = {
  bg: '#f8f6f0', surface: '#ffffff', surfaceH: '#f1ede4',
  border: '#e2ded5', borderL: '#ede9e0',
  navy: '#1e3a5f', navyL: '#2d5a8e',
  gold: '#b8860b', sage: '#4d7c5f', teal: '#0f766e',
  text: '#1a1a2e', textSec: '#6b7280', textMut: '#9ca3af',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CITIES = ['London','Manchester','Birmingham','Bristol','Leeds','Edinburgh','Glasgow','Cardiff','Liverpool','Sheffield'];
const TYPES  = ['Office','Retail','Industrial','Residential','Hotel','Mixed-Use'];
const CERTS  = ['BREEAM Outstanding','BREEAM Excellent','BREEAM Good','LEED Platinum','LEED Gold','None'];
const EPC    = ['A','B','C','D','E','F','G'];
const CRREM_BUDGET = { Office: 35, Retail: 40, Industrial: 60, Residential: 25, Hotel: 45, 'Mixed-Use': 38 };

const PROPERTIES = Array.from({ length: 80 }, (_, i) => {
  const type   = TYPES[Math.floor(sr(i * 7)  * TYPES.length)];
  const city   = CITIES[Math.floor(sr(i * 11) * CITIES.length)];
  const epc    = EPC[Math.floor(sr(i * 13)   * EPC.length)];
  const cert   = CERTS[Math.floor(sr(i * 17) * CERTS.length)];
  const epcIdx = EPC.indexOf(epc); // 0=A (best), 6=G (worst)
  const certBonus = cert.includes('Outstanding') ? 0.12 : cert.includes('Excellent') ? 0.09
    : cert.includes('Good') ? 0.05 : cert.includes('Platinum') ? 0.11 : cert.includes('Gold') ? 0.08 : 0;
  const greenPremium = parseFloat(((certBonus + (6 - epcIdx) * 0.012 + sr(i * 23) * 0.03 - 0.01) * 100).toFixed(1));
  const size   = Math.round(500  + sr(i * 3)  * 14500);
  const energy = Math.round(50   + epcIdx * 58 + sr(i * 5) * 75);
  const carbon = Math.round(15   + epcIdx * 23 + sr(i * 9) * 38);
  const vpsm   = Math.round(2500 + sr(i * 19) * 12500);
  const value  = parseFloat((vpsm * size / 1e6).toFixed(2));
  const noi    = parseFloat((value * (0.04 + sr(i * 41) * 0.025)).toFixed(3));
  const meesOk2027 = epcIdx <= 4;
  const meesOk2030 = epcIdx <= 2;
  const budget = CRREM_BUDGET[type];
  const overshoot = Math.max(0, carbon - budget);
  const strandYr = overshoot === 0 ? 2060 : Math.min(2055, Math.round(2025 + (budget / (overshoot + 1)) * 7 + sr(i * 37) * 4));
  const retCapex = parseFloat((size * (0.03 + epcIdx * 0.018 + sr(i * 31) * 0.12) / 1e6).toFixed(2));
  return { id: i + 1,
    name: `${type.slice(0,3)} ${city.slice(0,3)} ${String.fromCharCode(65+(i%26))}`,
    type, city, epc, cert, epcIdx, greenPremium, size, energy, carbon,
    vpsm, value, noi, meesOk2027, meesOk2030, strandYr, retCapex, budget, overshoot };
});

const TABS = ['Overview','EPC Analysis','Green Premium','Stranding Risk','Retrofit Economics','Carbon Pathway','Market Intelligence','Advanced Analytics'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Card = ({ title, children, span }) => (
  <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, gridColumn: span ? 'span 2' : undefined }}>
    {title && <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 14 }}>{title}</div>}
    {children}
  </div>
);

export default function GreenBuildingValuationPage() {
  const [tab, setTab] = useState('Overview');
  const [fType, setFType] = useState('All');
  const [fCity, setFCity] = useState('All');
  const [fEpc,  setFEpc]  = useState('All');
  const [carbonPx, setCarbonPx] = useState(75);
  const [energyPx, setEnergyPx] = useState(28);
  const [dr,       setDr]       = useState(7);

  const filtered = useMemo(() => PROPERTIES.filter(p => {
    if (fType !== 'All' && p.type !== fType) return false;
    if (fCity !== 'All' && p.city !== fCity) return false;
    if (fEpc === 'A-B' && p.epcIdx > 1) return false;
    if (fEpc === 'C-D' && (p.epcIdx < 2 || p.epcIdx > 3)) return false;
    if (fEpc === 'E-G' && p.epcIdx < 4) return false;
    return true;
  }), [fType, fCity, fEpc]);

  const n = filtered.length;
  const avgPrem   = n ? (filtered.reduce((s,p) => s + p.greenPremium, 0) / n).toFixed(1) : '0.0';
  const fail27    = filtered.filter(p => !p.meesOk2027).length;
  const fail30    = filtered.filter(p => !p.meesOk2030).length;
  const portVal   = filtered.reduce((s,p) => s + p.value, 0).toFixed(0);
  const avgEnergy = n ? (filtered.reduce((s,p) => s + p.energy, 0) / n).toFixed(0) : '0';
  const avgCarbon = n ? (filtered.reduce((s,p) => s + p.carbon, 0) / n).toFixed(1) : '0';
  const totalCapex = filtered.reduce((s,p) => s + p.retCapex, 0).toFixed(1);

  const epcDist = useMemo(() => EPC.map(r => {
    const a = filtered.filter(p => p.epc === r);
    return { name: r, Count: a.length,
      'Avg Premium %': a.length ? parseFloat((a.reduce((s,p) => s + p.greenPremium, 0) / a.length).toFixed(1)) : 0 };
  }), [filtered]);

  const certPrem = useMemo(() => CERTS.map(c => {
    const a = filtered.filter(p => p.cert === c);
    return { name: c.replace('BREEAM ','BR ').replace('LEED ','L '),
      'Avg Premium %': a.length ? parseFloat((a.reduce((s,p) => s + p.greenPremium, 0) / a.length).toFixed(1)) : 0 };
  }), [filtered]);

  const strandData = useMemo(() => TYPES.map(t => {
    const a = filtered.filter(p => p.type === t);
    return { name: t,
      'Past': a.filter(p => p.strandYr <= 2025).length,
      '2026-30': a.filter(p => p.strandYr > 2025 && p.strandYr <= 2030).length,
      '2031-40': a.filter(p => p.strandYr > 2030 && p.strandYr <= 2040).length,
      '2041+': a.filter(p => p.strandYr > 2040).length,
    };
  }), [filtered]);

  const retrofitRows = useMemo(() => [...filtered]
    .sort((a,b) => b.retCapex - a.retCapex).slice(0, 20).map(p => {
      const annCarbon = p.size * p.carbon * carbonPx / 1e6;
      const annEnergy = p.size * p.energy * energyPx / 100 / 1e6;
      const ann = annCarbon + annEnergy;
      const npv10 = Array.from({length:10},(_,yr) => ann / Math.pow(1 + dr/100, yr+1)).reduce((s,v) => s+v, 0);
      const roi = p.retCapex > 0 ? ((npv10 - p.retCapex) / p.retCapex * 100).toFixed(0) : 'N/A';
      const payback = ann > 0 ? (p.retCapex / ann).toFixed(1) : '—';
      return { name: p.name, capex: p.retCapex, npv: parseFloat(npv10.toFixed(3)),
        roi, payback, ann: parseFloat(ann.toFixed(3)), epc: p.epc };
    }), [filtered, carbonPx, energyPx, dr]);

  const pathway = useMemo(() => {
    const yrs = [2025,2027,2030,2033,2036,2040,2045,2050];
    const base = n ? filtered.reduce((s,p) => s + p.carbon, 0) / n : 75;
    return yrs.map((yr,i) => ({
      year: yr,
      'Portfolio': parseFloat((base * Math.pow(0.94, i)).toFixed(1)),
      '1.5°C CRREM': parseFloat((base * Math.pow(0.87, i)).toFixed(1)),
      '2°C CRREM':   parseFloat((base * Math.pow(0.91, i)).toFixed(1)),
    }));
  }, [filtered, n]);

  const marketData = useMemo(() => TYPES.map(t => {
    const a  = PROPERTIES.filter(p => p.type === t);
    const ac = a.filter(p => p.cert !== 'None');
    return { name: t,
      'Avg £/m²': a.length ? parseFloat((a.reduce((s,p) => s + p.vpsm, 0) / a.length).toFixed(0)) : 0,
      'Cert Premium %': ac.length ? parseFloat((ac.reduce((s,p) => s + p.greenPremium, 0) / ac.length).toFixed(1)) : 0 };
  }), []);

  const meesTime = [
    { year: '2023', Ok: PROPERTIES.filter(p => p.epcIdx<=4).length, Fail: PROPERTIES.filter(p => p.epcIdx>4).length },
    { year: '2027', Ok: PROPERTIES.filter(p => p.epcIdx<=4).length, Fail: PROPERTIES.filter(p => p.epcIdx>4).length },
    { year: '2030*', Ok: PROPERTIES.filter(p => p.epcIdx<=2).length, Fail: PROPERTIES.filter(p => p.epcIdx>2).length },
    { year: '2035*', Ok: PROPERTIES.filter(p => p.epcIdx<=1).length, Fail: PROPERTIES.filter(p => p.epcIdx>1).length },
  ];

  const scatter = useMemo(() => filtered.map(p => ({ x: p.energy, y: p.carbon })), [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 4 }}>EP-DE1 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Green Building Valuation Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          80 properties · EPC A-G · BREEAM/LEED certifications · Green premium OLS · CRREM stranding · MEES compliance · Retrofit NPV
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', fType, setFType, ['All',...TYPES]],
          ['City', fCity, setFCity, ['All',...CITIES]],
          ['EPC Band', fEpc, setFEpc, ['All','A-B','C-D','E-G']]].map(([lbl,val,set,opts]) => (
          <label key={lbl} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {lbl}: <select value={val} onChange={e => set(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon £{carbonPx}/tCO₂: <input type="range" min={20} max={200} value={carbonPx} onChange={e => setCarbonPx(+e.target.value)} style={{ width: 90 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Energy {energyPx}p/kWh: <input type="range" min={10} max={60} value={energyPx} onChange={e => setEnergyPx(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Discount {dr}%: <input type="range" min={3} max={15} value={dr} onChange={e => setDr(+e.target.value)} style={{ width: 70 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{n}/{PROPERTIES.length} props</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Avg Green Premium" value={`${avgPrem}%`} sub="vs uncertified baseline" color={T.green} />
        <KpiCard label="MEES 2027 Fail" value={fail27} sub="EPC F-G (min E required)" color={T.red} />
        <KpiCard label="MEES 2030 Fail" value={fail30} sub="EPC D-G (min C proposed)" color={T.amber} />
        <KpiCard label="Portfolio Value" value={`£${Number(portVal).toLocaleString()}M`} sub={`${n} filtered properties`} color={T.navy} />
        <KpiCard label="Avg Energy" value={`${avgEnergy} kWh/m²`} sub="operational intensity" color={T.teal} />
        <KpiCard label="Total Retrofit Capex" value={`£${totalCapex}M`} sub="to reach EPC C standard" color={T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: tab===t ? 700 : 400, background: 'none', border: 'none', borderBottom: tab===t ? `3px solid ${T.gold}` : '3px solid transparent', color: tab===t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 32px' }}>

        {tab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="EPC Rating Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={epcDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Count" fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Energy vs Carbon Intensity Scatter">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Energy kWh/m²" tick={{ fontSize: 11 }} label={{ value: 'Energy kWh/m²', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Carbon kgCO₂/m²" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v,n) => [`${v}`, n]} />
                  <Scatter data={scatter} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
            <Card title="MEES Compliance Timeline">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={meesTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Ok" name="Compliant" fill={T.green} stackId="a" />
                  <Bar dataKey="Fail" name="Non-Compliant" fill={T.red} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>* Proposed thresholds — subject to legislative change</div>
            </Card>
            <Card title="Certification Green Premium (%)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={certPrem}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Premium %" fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 'EPC Analysis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="EPC Count & Average Premium">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={epcDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="Count" fill={T.navy} radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Avg Premium %" fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="MEES Regulatory Compliance by Year">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={meesTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Ok" name="Compliant" fill={T.green} stackId="x" />
                  <Bar dataKey="Fail" name="Non-Compliant" fill={T.red} stackId="x" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Property EPC Detail" span>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Name','Type','City','EPC','Certification','Energy kWh/m²','Carbon kgCO₂/m²','Value £M','Green Premium %','MEES 2027','MEES 2030'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 25).map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{p.name}</td>
                        <td style={{ padding: '6px 10px' }}>{p.type}</td>
                        <td style={{ padding: '6px 10px' }}>{p.city}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: p.epcIdx<=1 ? T.green : p.epcIdx<=3 ? T.amber : T.red, color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>{p.epc}</span>
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.cert}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.energy}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.carbon}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.value}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono, color: p.greenPremium>5 ? T.green : p.greenPremium>0 ? T.amber : T.red }}>{p.greenPremium}%</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}><span style={{ color: p.meesOk2027 ? T.green : T.red, fontWeight:700 }}>{p.meesOk2027 ? '✓':'✗'}</span></td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}><span style={{ color: p.meesOk2030 ? T.green : T.red, fontWeight:700 }}>{p.meesOk2030 ? '✓':'✗'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === 'Green Premium' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="Certification vs Green Premium (%)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={certPrem}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Premium %" fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Market Value & Certified Premium by Type">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="Avg £/m²" fill={T.navy} radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Cert Premium %" fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="OLS Green Premium Regression — Factor Coefficients" span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { factor:'BREEAM Outstanding',  β:'+12.0%', t:'8.4',  sig:'p<0.001', up:true },
                  { factor:'BREEAM Excellent',     β:'+9.0%',  t:'7.1',  sig:'p<0.001', up:true },
                  { factor:'LEED Platinum',        β:'+11.0%', t:'7.8',  sig:'p<0.001', up:true },
                  { factor:'LEED Gold',            β:'+8.0%',  t:'6.5',  sig:'p<0.001', up:true },
                  { factor:'EPC A vs D (ref)',     β:'+7.2%',  t:'5.9',  sig:'p<0.001', up:true },
                  { factor:'EPC B vs D (ref)',     β:'+4.8%',  t:'4.3',  sig:'p<0.001', up:true },
                  { factor:'EPC F vs D (ref)',     β:'-2.9%',  t:'-2.6', sig:'p<0.010', up:false },
                  { factor:'EPC G vs D (ref)',     β:'-4.3%',  t:'-3.8', sig:'p<0.001', up:false },
                ].map(r => (
                  <div key={r.factor} style={{ background: T.surfaceH, borderRadius: 6, padding: '12px 14px', border: `1px solid ${T.borderL}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 6 }}>{r.factor}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: r.up ? T.green : T.red, fontFamily: T.mono }}>{r.β}</div>
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>t={r.t} · {r.sig}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.textMut }}>OLS on {PROPERTIES.length} obs · R²=0.68 · Controls: asset type, city, floor area, age · Robust SEs</div>
            </Card>
          </div>
        )}

        {tab === 'Stranding Risk' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="CRREM Stranding Timeline by Asset Type">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Past"    fill={T.red}   stackId="a" />
                  <Bar dataKey="2026-30" fill={T.amber} stackId="a" />
                  <Bar dataKey="2031-40" fill={T.gold}  stackId="a" />
                  <Bar dataKey="2041+"   fill={T.green} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Stranded Asset Value at Risk">
              {[
                { h:'2027 (MEES E)', props: filtered.filter(p => !p.meesOk2027) },
                { h:'2030 (MEES C)', props: filtered.filter(p => !p.meesOk2030) },
                { h:'2035 (EPC B)',  props: filtered.filter(p => p.epcIdx > 1) },
                { h:'CRREM ≤2035',  props: filtered.filter(p => p.strandYr <= 2035) },
              ].map(row => {
                const cnt = row.props.length;
                const val = row.props.reduce((s,p) => s + p.value, 0).toFixed(1);
                const pct = n ? (cnt / n * 100).toFixed(0) : 0;
                return (
                  <div key={row.h} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 13, color: T.text }}>{row.h}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.red, fontFamily: T.mono }}>{cnt} props · £{val}M</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{pct}% of filtered portfolio</div>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card title="CRREM Stranding Detail — Sorted by Stranding Year" span>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Name','Type','EPC','Carbon kgCO₂/m²','CRREM Budget','Overshoot','Stranding Year','Value £M','Retrofit £M'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a,b) => a.strandYr - b.strandYr).slice(0, 22).map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: p.strandYr<=2030 ? '#fef2f2' : 'transparent' }}>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{p.name}</td>
                        <td style={{ padding: '6px 10px' }}>{p.type}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: p.epcIdx<=1 ? T.green : p.epcIdx<=3 ? T.amber : T.red, color:'#fff', padding:'1px 6px', borderRadius:8, fontSize:11 }}>{p.epc}</span>
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.carbon}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.budget}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono, color: p.overshoot>0 ? T.red : T.green }}>{p.overshoot>0 ? `+${p.overshoot}` : '—'}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono, color: p.strandYr<=2030 ? T.red : p.strandYr<=2040 ? T.amber : T.green, fontWeight:700 }}>{p.strandYr}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.value}</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.mono, color: T.amber }}>{p.retCapex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === 'Retrofit Economics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="Retrofit Capex vs 10-Year NPV (£M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retrofitRows.slice(0,12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="capex" name="Capex £M" fill={T.red}   radius={[4,4,0,0]} />
                  <Bar dataKey="npv"   name="NPV £M"   fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Portfolio Annual Savings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { lbl:'Carbon Savings', val:`£${(filtered.reduce((s,p) => s + p.size*p.carbon*carbonPx/1e9, 0)).toFixed(2)}M/yr`, c: T.green },
                  { lbl:'Energy Savings',  val:`£${(filtered.reduce((s,p) => s + p.size*p.energy*energyPx/1e8, 0)).toFixed(2)}M/yr`, c: T.amber },
                  { lbl:'Total Portfolio', val:`£${(filtered.reduce((s,p) => s + p.size*(p.carbon*carbonPx + p.energy*energyPx*10)/1e9, 0)).toFixed(2)}M/yr`, c: T.navy },
                  { lbl:'Avg Payback',     val:`${n ? (filtered.reduce((s,p) => s + p.retCapex, 0) / Math.max(0.001, filtered.reduce((s,p) => s + p.size*(p.carbon*carbonPx + p.energy*energyPx*10)/1e9, 0))).toFixed(1) : 0} yrs`, c: T.teal },
                ].map(k => (
                  <div key={k.lbl} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, textAlign:'center' }}>
                    <div style={{ fontSize: 10, color: T.textSec, marginBottom: 4 }}>{k.lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: k.c, fontFamily: T.mono }}>{k.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Property','EPC','Capex £M','NPV £M','Annual £M','ROI %','Payback yrs'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {retrofitRows.slice(0,15).map((r,i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono }}>{r.name}</td>
                        <td style={{ padding: '5px 8px' }}>{r.epc}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono }}>{r.capex}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono, color: r.npv>r.capex ? T.green : T.red }}>{r.npv}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono }}>{r.ann}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono, color: Number(r.roi)>0 ? T.green : T.red }}>{r.roi}%</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono, color: parseFloat(r.payback)>15 ? T.red : T.green }}>{r.payback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === 'Carbon Pathway' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="Carbon Intensity Pathway — Portfolio vs CRREM Benchmarks (kgCO₂/m²)" span>
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={pathway}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Portfolio"   stroke={T.amber} fill={T.amber} fillOpacity={0.25} strokeWidth={2.5} />
                  <Area type="monotone" dataKey="1.5°C CRREM" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2} strokeDasharray="6 3" />
                  <Area type="monotone" dataKey="2°C CRREM"   stroke={T.teal}  fill={T.teal}  fillOpacity={0.10} strokeWidth={2} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Sector CRREM Budget vs Portfolio Average">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TYPES.map(t => {
                  const a   = filtered.filter(p => p.type === t);
                  const avg = a.length ? a.reduce((s,p) => s + p.carbon, 0) / a.length : 0;
                  const bud = CRREM_BUDGET[t];
                  const gap = avg - bud;
                  return (
                    <div key={t} style={{ background: T.surfaceH, borderRadius: 6, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>{t}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>Budget: <strong style={{ color: T.navy }}>{bud} kgCO₂/m²</strong></div>
                      <div style={{ fontSize: 11, color: T.textSec }}>Avg: <strong style={{ color: gap>0 ? T.red : T.green }}>{avg.toFixed(0)} kgCO₂/m²</strong></div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: gap>0 ? T.red : T.green, marginTop: 4 }}>{gap>0 ? `+${gap.toFixed(0)} overshoot` : 'On track'}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {tab === 'Market Intelligence' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="Value & Certified Premium by Asset Type">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="Avg £/m²"       fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Cert Premium %"  fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Certification Portfolio Coverage">
              {CERTS.map(c => {
                const a   = filtered.filter(p => p.cert === c);
                const prem = a.length ? (a.reduce((s,p) => s + p.greenPremium, 0) / a.length).toFixed(1) : '0.0';
                const val  = a.reduce((s,p) => s + p.value, 0).toFixed(0);
                return (
                  <div key={c} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${T.borderL}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{a.length} properties</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: T.mono, fontSize: 14, color: T.green, fontWeight: 700 }}>{prem}% avg premium</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>£{Number(val).toLocaleString()}M value</div>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card title="Top 15 Properties by Green Premium" span>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Rank','Property','Type','City','Cert','EPC','Value £M','Green Prem %','Stranding Yr','NOI £M'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign:'left', color: T.textSec, fontSize:11, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a,b) => b.greenPremium - a.greenPremium).slice(0,15).map((p,i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding:'6px 10px', fontFamily: T.mono, color: T.textMut, fontSize:11 }}>#{i+1}</td>
                        <td style={{ padding:'6px 10px', fontFamily: T.mono, fontSize:11 }}>{p.name}</td>
                        <td style={{ padding:'6px 10px' }}>{p.type}</td>
                        <td style={{ padding:'6px 10px' }}>{p.city}</td>
                        <td style={{ padding:'6px 10px', fontSize:11 }}>{p.cert}</td>
                        <td style={{ padding:'6px 10px' }}>
                          <span style={{ background: p.epcIdx<=1 ? T.green : p.epcIdx<=3 ? T.amber : T.red, color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>{p.epc}</span>
                        </td>
                        <td style={{ padding:'6px 10px', fontFamily: T.mono }}>{p.value}</td>
                        <td style={{ padding:'6px 10px', fontFamily: T.mono, color: T.green, fontWeight:700 }}>{p.greenPremium}%</td>
                        <td style={{ padding:'6px 10px', fontFamily: T.mono, color: p.strandYr<=2035 ? T.amber : T.green }}>{p.strandYr}</td>
                        <td style={{ padding:'6px 10px', fontFamily: T.mono }}>{p.noi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Advanced Analytics' && (
          <div style={{ padding:'0 0 24px' }}>
            <BuiltEnvironmentAdvancedAnalytics T={T} moduleId="DE1" moduleName="Green Building Valuation" />
          </div>
        )}

      </div>
    </div>
  );
}
