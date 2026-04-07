import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const CREDITS = [
  { type:'REDD+ (Verra)', method:'REDD+', base:12, vintage:2024, verifier:'Verra', permanence:25, liquidity:0.85 },
  { type:'REDD+ (GS)', method:'REDD+', base:14, vintage:2023, verifier:'Gold Standard', permanence:25, liquidity:0.72 },
  { type:'ARR Tropical', method:'ARR', base:15, vintage:2024, verifier:'Verra', permanence:40, liquidity:0.65 },
  { type:'ARR Temperate', method:'ARR', base:12, vintage:2022, verifier:'Verra', permanence:35, liquidity:0.55 },
  { type:'IFM Boreal', method:'IFM', base:10, vintage:2023, verifier:'ACR', permanence:30, liquidity:0.50 },
  { type:'Cookstove Africa', method:'Cookstove', base:8, vintage:2024, verifier:'Gold Standard', permanence:100, liquidity:0.90 },
  { type:'Cookstove Asia', method:'Cookstove', base:6, vintage:2021, verifier:'Verra', permanence:100, liquidity:0.80 },
  { type:'Solar India', method:'Renewable', base:3, vintage:2022, verifier:'Verra', permanence:100, liquidity:0.95 },
  { type:'Wind China', method:'Renewable', base:2.5, vintage:2020, verifier:'CDM', permanence:100, liquidity:0.92 },
  { type:'Hydro Brazil', method:'Renewable', base:4, vintage:2023, verifier:'Verra', permanence:100, liquidity:0.88 },
  { type:'Biochar US', method:'Biochar', base:85, vintage:2024, verifier:'Puro.earth', permanence:95, liquidity:0.30 },
  { type:'DAC US', method:'DAC', base:450, vintage:2024, verifier:'Puro.earth', permanence:99, liquidity:0.15 },
  { type:'DAC Iceland', method:'DAC', base:600, vintage:2024, verifier:'Puro.earth', permanence:99, liquidity:0.12 },
  { type:'Soil Carbon US', method:'Soil', base:18, vintage:2023, verifier:'Verra', permanence:15, liquidity:0.40 },
  { type:'Soil Carbon EU', method:'Soil', base:22, vintage:2024, verifier:'Gold Standard', permanence:15, liquidity:0.35 },
  { type:'Mangrove Restore', method:'Blue Carbon', base:25, vintage:2024, verifier:'Verra', permanence:50, liquidity:0.28 },
  { type:'Seagrass', method:'Blue Carbon', base:30, vintage:2024, verifier:'Verra', permanence:45, liquidity:0.22 },
  { type:'Landfill Gas US', method:'Waste', base:5, vintage:2021, verifier:'ACR', permanence:100, liquidity:0.75 },
  { type:'CCS Norway', method:'CCS', base:120, vintage:2024, verifier:'Puro.earth', permanence:98, liquidity:0.18 },
  { type:'Mineralization', method:'Mineralization', base:95, vintage:2024, verifier:'Puro.earth', permanence:99, liquidity:0.10 },
];

function calcPrice(c) {
  const vintFactor = 1 + (c.vintage - 2020) * 0.05 - (2024 - c.vintage) * 0.08;
  const methFactor = { 'REDD+':1.0, ARR:1.2, IFM:0.9, Cookstove:0.85, Renewable:0.5, Biochar:1.3, DAC:1.0, Soil:1.1, 'Blue Carbon':1.4, Waste:0.6, CCS:1.0, Mineralization:1.1 }[c.method] || 1;
  const verFactor = { 'Verra':1.0, 'Gold Standard':1.15, 'Puro.earth':1.2, ACR:0.95, CDM:0.8 }[c.verifier] || 1;
  const permFactor = 0.8 + (c.permanence / 100) * 0.4;
  const liqFactor = 0.85 + c.liquidity * 0.3;
  return Math.round(c.base * vintFactor * methFactor * verFactor * permFactor * liqFactor * 100) / 100;
}

const PRICED = CREDITS.map(c => ({ ...c, price: calcPrice(c) }));

const TABS = ['Pricing Dashboard','Vintage Premium/Discount','Methodology Price Curves','Verification Premium','Permanence Pricing','Market Liquidity'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function CarbonCreditPricingPage() {
  const [tab, setTab] = useState(0);
  const [methodFilter, setMethodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('price');
  const [customBase, setCustomBase] = useState(15);
  const [customVintage, setCustomVintage] = useState(2024);
  const [customPerm, setCustomPerm] = useState(50);
  const [watchlist, setWatchlist] = useState([]);

  const methods = ['All', ...new Set(CREDITS.map(c => c.method))];
  const filtered = useMemo(() => {
    let d = methodFilter === 'All' ? [...PRICED] : PRICED.filter(c => c.method === methodFilter);
    d.sort((a, b) => sortBy === 'price' ? b.price - a.price : a.type.localeCompare(b.type));
    return d;
  }, [methodFilter, sortBy]);

  const methodAvgs = [...new Set(CREDITS.map(c => c.method))].map(m => {
    const mc = PRICED.filter(c => c.method === m);
    return { method: m, avg: Math.round(mc.reduce((a, c) => a + c.price, 0) / mc.length), count: mc.length, min: Math.round(Math.min(...mc.map(c => c.price))), max: Math.round(Math.max(...mc.map(c => c.price))) };
  }).sort((a, b) => b.avg - a.avg);

  const vintageData = [2018, 2019, 2020, 2021, 2022, 2023, 2024].map(v => {
    const factor = 1 + (v - 2020) * 0.05 - (2024 - v) * 0.08;
    return { vintage: v, factor: Math.round(factor * 100), label: factor >= 1 ? 'Premium' : 'Discount' };
  });

  const calcCustom = useMemo(() => {
    const vf = 1 + (customVintage - 2020) * 0.05 - (2024 - customVintage) * 0.08;
    const pf = 0.8 + (customPerm / 100) * 0.4;
    return (customBase * vf * pf).toFixed(2);
  }, [customBase, customVintage, customPerm]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN1 · CARBON CREDIT PRICING</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Carbon Credit Pricing Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>20 Credit Types · Multi-Factor Pricing · Vintage/Methodology/Verification/Permanence/Liquidity</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Avg Price', val: `$${Math.round(PRICED.reduce((a, c) => a + c.price, 0) / PRICED.length)}`, col: T.gold },
              { label: 'Max', val: `$${Math.round(Math.max(...PRICED.map(c => c.price)))}`, col: T.red },
              { label: 'Credits', val: PRICED.length, col: T.teal },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            {methods.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="price">Sort by Price</option><option value="name">Sort by Name</option>
          </select>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>All Credits — Calculated Price ($/tCO2)</div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filtered} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `$${Number(v).toFixed(2)}/tCO2`} />
                <Bar dataKey="price" name="Price" radius={[0, 4, 4, 0]}>
                  {filtered.map((d, i) => <Cell key={i} fill={d.price > 100 ? T.purple : d.price > 20 ? T.blue : d.price > 10 ? T.teal : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Interactive Pricing Calculator</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>Base Price ($)</div>
                <input type="range" min={1} max={600} value={customBase} onChange={e => setCustomBase(Number(e.target.value))} style={{ width: 150 }} /><span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 8 }}>${customBase}</span></div>
              <div><div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>Vintage</div>
                <input type="range" min={2018} max={2024} value={customVintage} onChange={e => setCustomVintage(Number(e.target.value))} style={{ width: 150 }} /><span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 8 }}>{customVintage}</span></div>
              <div><div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>Permanence (%)</div>
                <input type="range" min={5} max={100} value={customPerm} onChange={e => setCustomPerm(Number(e.target.value))} style={{ width: 150 }} /><span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 8 }}>{customPerm}%</span></div>
              <div style={{ padding: '12px 20px', background: T.navy + '08', borderRadius: 8, border: `1px solid ${T.gold}33` }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Calculated Price</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: T.mono, color: T.navy }}>${calcCustom}</div>
              </div>
            </div>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>Vintage Factor — Premium/Discount Curve</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vintageData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="vintage" tick={{ fontSize: 10 }} /><YAxis domain={[50, 120]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="factor" name="Factor (%)" radius={[4, 4, 0, 0]}>
                  {vintageData.map((d, i) => <Cell key={i} fill={d.factor >= 100 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Credit Prices by Vintage Year</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Vintage" tick={{ fontSize: 10 }} /><YAxis dataKey="y" name="Price" tick={{ fontSize: 10 }} /><Tooltip />
                <Scatter data={PRICED.map(c => ({ x: c.vintage, y: c.price, name: c.type }))} fill={T.navy} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Average Price by Methodology ($/tCO2)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={methodAvgs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="method" width={100} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="avg" name="Avg Price" fill={T.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Price Range by Methodology</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Methodology','Min','Avg','Max','Count'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{methodAvgs.map(m => (
                <tr key={m.method} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{m.method}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${m.min}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700 }}>${m.avg}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${m.max}</td>
                  <td style={{ padding: 6 }}>{m.count}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Verification Premium — Price by Verifier</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={['Gold Standard','Puro.earth','Verra','ACR','CDM'].map(v => ({
                verifier: v, avg: Math.round(PRICED.filter(c => c.verifier === v).reduce((a, c) => a + c.price, 0) / Math.max(1, PRICED.filter(c => c.verifier === v).length)),
                factor: { 'Verra':100, 'Gold Standard':115, 'Puro.earth':120, ACR:95, CDM:80 }[v]
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="verifier" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="avg" name="Avg Price" fill={T.blue} /><Bar dataKey="factor" name="Factor %" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Permanence vs Price — Credits Scatter</div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Permanence (yrs)" tick={{ fontSize: 10 }} label={{ value: 'Permanence Horizon', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="y" name="Price" tick={{ fontSize: 10 }} /><ZAxis dataKey="z" range={[40, 200]} /><Tooltip />
                <Scatter data={PRICED.map(c => ({ x: c.permanence, y: c.price, z: c.liquidity * 100, name: c.type }))} fill={T.purple} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Market Liquidity vs Price</div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Liquidity" tick={{ fontSize: 10 }} label={{ value: 'Liquidity (0-1)', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="y" name="Price" tick={{ fontSize: 10 }} /><Tooltip />
                <Scatter data={PRICED.map(c => ({ x: c.liquidity, y: c.price, name: c.type }))} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Pricing Model Reference</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Price = Base x VintageFactor x MethodologyFactor x VerificationFactor x PermanenceFactor x LiquidityFactor. Vintage: +5% per year above 2020, -8% per year of age. Methodology multipliers: REDD+ 1.0x, ARR 1.2x, DAC 1.0x, Blue Carbon 1.4x. Permanence: 0.8 + 0.4 x (permanence/100).</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
