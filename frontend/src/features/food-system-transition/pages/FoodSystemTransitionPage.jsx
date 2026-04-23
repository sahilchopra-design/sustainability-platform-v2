import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;

const FOOD_CATEGORIES = [
  { id: 'beef', name: 'Beef & Lamb', ghg: 60.0, water: 15400, land: 164, scope3Pct: 88, protein: 26, price: 12.5 },
  { id: 'dairy', name: 'Dairy Products', ghg: 3.2, water: 1020, land: 9, scope3Pct: 76, protein: 8, price: 1.8 },
  { id: 'pork', name: 'Pork', ghg: 7.6, water: 5990, land: 11, scope3Pct: 82, protein: 25, price: 4.2 },
  { id: 'poultry', name: 'Poultry', ghg: 5.7, water: 4330, land: 7, scope3Pct: 79, protein: 27, price: 3.1 },
  { id: 'eggs', name: 'Eggs', ghg: 4.2, water: 3300, land: 6, scope3Pct: 71, protein: 13, price: 2.8 },
  { id: 'fish', name: 'Fish (farmed)', ghg: 13.6, water: 3700, land: 3, scope3Pct: 65, protein: 20, price: 6.4 },
  { id: 'rice', name: 'Rice', ghg: 4.0, water: 2497, land: 2.5, scope3Pct: 85, protein: 7, price: 0.9 },
  { id: 'wheat', name: 'Wheat', ghg: 1.4, water: 1827, land: 3.9, scope3Pct: 88, protein: 13, price: 0.5 },
  { id: 'maize', name: 'Maize', ghg: 1.7, water: 1222, land: 3.1, scope3Pct: 84, protein: 9, price: 0.4 },
  { id: 'soy', name: 'Soy', ghg: 2.0, water: 2145, land: 3.5, scope3Pct: 90, protein: 36, price: 0.7 },
  { id: 'nuts', name: 'Nuts', ghg: 2.5, water: 9063, land: 7.9, scope3Pct: 72, protein: 20, price: 8.1 },
  { id: 'fruit', name: 'Fruit & Veg', ghg: 0.7, water: 322, land: 0.8, scope3Pct: 58, protein: 1, price: 1.2 },
];

const SUPPLY_CHAIN_STAGES = [
  { stage: 'Farm Production', share: 0.61, reduction2030: 0.12, reduction2050: 0.35 },
  { stage: 'Processing', share: 0.09, reduction2030: 0.22, reduction2050: 0.55 },
  { stage: 'Packaging', share: 0.06, reduction2030: 0.28, reduction2050: 0.60 },
  { stage: 'Transport', share: 0.06, reduction2030: 0.30, reduction2050: 0.65 },
  { stage: 'Retail', share: 0.05, reduction2030: 0.35, reduction2050: 0.70 },
  { stage: 'Consumption', share: 0.08, reduction2030: 0.15, reduction2050: 0.40 },
  { stage: 'Food Waste', share: 0.05, reduction2030: 0.40, reduction2050: 0.80 },
];

const COMPANIES = Array.from({ length: 20 }, (_, i) => ({
  name: ['Nestlé','Unilever','AB InBev','Danone','Kraft Heinz','Mondelez','ADM','Bunge','Cargill','JBS',
    'Tyson Foods','Smithfield','Barry Callebaut','Fonterra','Lactalis','FrieslandCampina','WH Group','Saputo','Maple Leaf','Arla'][i],
  sector: ['Food Mfg','FMCG','Beverages','Dairy','Food Mfg','Confectionery','Agri-Trading','Agri-Trading','Agri-Trading','Meat',
    'Meat','Meat','Cocoa','Dairy','Dairy','Dairy','Meat','Dairy','Meat','Dairy'][i],
  scope3: +(sr(i * 7) * 80 + 20).toFixed(1),
  sbtiTarget: i % 3 !== 0,
  deforestationFree: i % 4 !== 0,
  regenAgPct: +(sr(i * 13) * 40).toFixed(1),
  exposureMn: +(sr(i * 19) * 400 + 50).toFixed(0),
  transitionScore: +(sr(i * 23) * 60 + 20).toFixed(1),
}));

const TRANSITION_SCENARIOS = [
  { name: 'BAU', color: '#dc2626', diet2030: -5, diet2050: -8, tech2030: -8, tech2050: -18, waste2030: -5, waste2050: -12 },
  { name: 'Policy Push', color: '#f59e0b', diet2030: -15, diet2050: -28, tech2030: -18, tech2050: -42, waste2030: -15, waste2050: -38 },
  { name: 'Diet Shift', color: '#10b981', diet2030: -32, diet2050: -58, tech2030: -12, tech2050: -30, waste2030: -20, waste2050: -45 },
  { name: 'Net Zero Food', color: '#3b82f6', diet2030: -38, diet2050: -72, tech2030: -28, tech2050: -60, waste2030: -30, waste2050: -58 },
];

const FINANCE_INSTRUMENTS = [
  { name: 'Sustainability-Linked Loans', aum: 87, growth: 34, dealsYTD: 42, avgTenor: 5 },
  { name: 'Agri Green Bonds', aum: 24, growth: 48, dealsYTD: 18, avgTenor: 8 },
  { name: 'Nature-Based Solutions', aum: 18, growth: 62, dealsYTD: 11, avgTenor: 12 },
  { name: 'Supply Chain Finance', aum: 156, growth: 21, dealsYTD: 89, avgTenor: 3 },
  { name: 'Blended Finance Vehicles', aum: 12, growth: 55, dealsYTD: 8, avgTenor: 15 },
  { name: 'Carbon Credit-Linked', aum: 9, growth: 78, dealsYTD: 6, avgTenor: 7 },
];

const T = { bg: '#0f1117', surface: '#1a1d2e', surfaceH: '#252840', border: '#2e3148',
  navy: '#3b4fd8', navyL: '#5a6de8', gold: '#d4a017', goldL: '#e8b830', sage: '#2d7a4f',
  sageL: '#3a9962', teal: '#0d9488', text: '#e8eaf0', textSec: '#9ca3af', textMut: '#6b7280',
  red: '#ef4444', green: '#22c55e', amber: '#f59e0b', font: "'Inter','sans-serif'", mono: "'JetBrains Mono','monospace'" };

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Overview', 'GHG Intensity', 'Value Chain', 'Scope 3', 'Finance', 'Scenarios', 'Opportunities'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };
const badge = (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
  background: ok ? `${T.green}22` : `${T.red}22`, color: ok ? T.green : T.red });

export default function FoodSystemTransitionPage() {
  const [tab, setTab] = useState('Overview');
  const [selectedCategory, setSelectedCategory] = useState('beef');
  const [scenario, setScenario] = useState('Net Zero Food');

  const cat = FOOD_CATEGORIES.find(c => c.id === selectedCategory);

  const ghgData = useMemo(() => FOOD_CATEGORIES.map(c => ({ name: c.name.split(' ')[0], ghg: c.ghg })), []);
  const stageData = useMemo(() => SUPPLY_CHAIN_STAGES.map(s => ({
    stage: s.stage, emissions: +(s.share * 100).toFixed(1),
    'Red 2030': +(s.reduction2030 * 100).toFixed(0), 'Red 2050': +(s.reduction2050 * 100).toFixed(0),
  })), []);
  const scope3Data = useMemo(() => COMPANIES.slice(0, 12).map(c => ({ name: c.name.slice(0, 8), scope3: c.scope3, regenAg: c.regenAgPct })), []);
  const pathwayData = useMemo(() => {
    const sc = TRANSITION_SCENARIOS.find(s => s.name === scenario) || TRANSITION_SCENARIOS[3];
    return [2024, 2026, 2028, 2030, 2035, 2040, 2045, 2050].map((yr) => {
      const frac = (yr - 2024) / 26;
      const t30 = 6 / 26;
      const interp = (v30, v50) => frac <= t30 ? v30 * frac / t30 : v30 + (v50 - v30) * (frac - t30) / (1 - t30);
      const diet = interp(sc.diet2030, sc.diet2050);
      const tech = interp(sc.tech2030, sc.tech2050);
      const waste = interp(sc.waste2030, sc.waste2050);
      return { year: yr, Diet: +diet.toFixed(1), Technology: +tech.toFixed(1), 'Waste Red.': +waste.toFixed(1), Total: +(diet + tech + waste).toFixed(1) };
    });
  }, [scenario]);
  const financeData = useMemo(() => FINANCE_INSTRUMENTS.map(f => ({ name: f.name.split(' ').slice(0, 2).join(' '), aum: f.aum, growth: f.growth })), []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: T.text }}>Food System Transition</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>GHG intensity, supply chain decarbonization &amp; transition finance across global food value chains</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Global Food GHG" value="26%" sub="Share of total GHG emissions" color={T.amber} />
            <KpiCard label="Scope 3 Ag Share" value="82%" sub="Avg upstream agriculture share" color={T.red} />
            <KpiCard label="SBTi Companies" value={COMPANIES.filter(c => c.sbtiTarget).length} sub={`of ${COMPANIES.length} tracked`} color={T.green} />
            <KpiCard label="Deforestation-Free" value={COMPANIES.filter(c => c.deforestationFree).length} sub="Companies with DF commitments" color={T.teal} />
          </div>
          <div style={card}>
            <h2 style={h2}>GHG Intensity by Food Category (kgCO₂e / kg product)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ghgData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="ghg" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <h2 style={h2}>Supply Chain GHG Share by Stage</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageData} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={95} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="emissions" fill={T.gold} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h2 style={h2}>Company Transition Readiness</h2>
              <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Company','Scope 3 %','SBTi','DF','Score'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                    ))}</tr></thead>
                  <tbody>{COMPANIES.slice(0, 8).map(c => (
                    <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                      <td style={{ padding: '4px 8px', color: T.text }}>{c.name}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{c.scope3}%</td>
                      <td style={{ padding: '4px 8px' }}><span style={badge(c.sbtiTarget)}>{c.sbtiTarget ? 'Yes' : 'No'}</span></td>
                      <td style={{ padding: '4px 8px' }}><span style={badge(c.deforestationFree)}>{c.deforestationFree ? 'Yes' : 'No'}</span></td>
                      <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.navyL }}>{c.transitionScore}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'GHG Intensity' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Category:</label>
            <select style={select} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              {FOOD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {cat && <div style={grid(4)}>
            <KpiCard label="GHG Intensity" value={`${cat.ghg} kgCO₂e`} sub="per kg product" color={T.red} />
            <KpiCard label="Water Footprint" value={`${cat.water.toLocaleString()} L`} sub="per kg product" color={T.teal} />
            <KpiCard label="Land Use" value={`${cat.land} m²`} sub="per 100g protein" color={T.amber} />
            <KpiCard label="Scope 3 Share" value={`${cat.scope3Pct}%`} sub="upstream agriculture" color={T.navy} />
          </div>}
          <div style={card}>
            <h2 style={h2}>Comparative GHG Intensity vs Protein — All Categories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={FOOD_CATEGORIES.map(c => ({ name: c.name.split(' ')[0], ghg: c.ghg, scope3: c.scope3Pct }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="ghg" name="GHG (kgCO₂e/kg)" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="scope3" name="Scope 3 %" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>GHG vs Protein — Substitution Scatter</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="protein" name="Protein g/100g" label={{ value: 'Protein g/100g', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="ghg" name="GHG kgCO₂e/kg" label={{ value: 'GHG kgCO₂e/kg', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Scatter data={FOOD_CATEGORIES} fill={T.navyL} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Value Chain' && (
        <>
          <div style={card}>
            <h2 style={h2}>Emissions by Supply Chain Stage — Share &amp; Abatement Potential</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="emissions" name="Current Share %" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Red 2030" name="2030 Abatement %" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Red 2050" name="2050 Abatement %" fill={T.sage} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={grid(2)}>
            {SUPPLY_CHAIN_STAGES.map(s => (
              <div key={s.stage} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{s.stage}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.amber, fontFamily: T.mono }}>{(s.share * 100).toFixed(0)}%</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ label: '2030 Cut', val: `−${(s.reduction2030 * 100).toFixed(0)}%`, color: T.teal },
                    { label: '2050 Cut', val: `−${(s.reduction2050 * 100).toFixed(0)}%`, color: T.green }].map(m => (
                    <div key={m.label} style={{ background: T.surfaceH, borderRadius: 6, padding: '6px 10px' }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>{m.label}</div>
                      <div style={{ fontFamily: T.mono, fontWeight: 700, color: m.color, fontSize: 14 }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'Scope 3' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Avg Scope 3 Share" value={`${(COMPANIES.reduce((a, c) => a + c.scope3, 0) / COMPANIES.length).toFixed(1)}%`} sub="Agriculture as % of total Scope 3" color={T.red} />
            <KpiCard label="Portfolio Exposure" value={`$${COMPANIES.reduce((a, c) => a + +c.exposureMn, 0).toLocaleString()}M`} sub="Total tracked exposure" color={T.navy} />
            <KpiCard label="Avg Regen Ag" value={`${(COMPANIES.reduce((a, c) => a + c.regenAgPct, 0) / COMPANIES.length).toFixed(1)}%`} sub="Supply sourced regeneratively" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Scope 3 Agriculture Share by Company</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scope3Data}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="scope3" name="Scope 3 Ag %" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="regenAg" name="Regen Ag %" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Company Scope 3 Detail</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Company','Sector','Scope 3 %','SBTi','Deforest.-Free','Regen Ag %','Exposure ($M)','Score'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                  ))}</tr></thead>
                <tbody>{COMPANIES.map(c => (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{c.sector}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.red }}>{c.scope3}%</td>
                    <td style={{ padding: '5px 8px' }}><span style={badge(c.sbtiTarget)}>{c.sbtiTarget ? 'Yes' : 'No'}</span></td>
                    <td style={{ padding: '5px 8px' }}><span style={badge(c.deforestationFree)}>{c.deforestationFree ? 'Yes' : 'No'}</span></td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.green }}>{c.regenAgPct}%</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.amber }}>{c.exposureMn}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navyL }}>{c.transitionScore}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'Finance' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Total AUM" value={`$${FINANCE_INSTRUMENTS.reduce((a, f) => a + f.aum, 0)}Bn`} sub="Food transition finance instruments" color={T.navy} />
            <KpiCard label="Avg YoY Growth" value={`${(FINANCE_INSTRUMENTS.reduce((a, f) => a + f.growth, 0) / FINANCE_INSTRUMENTS.length).toFixed(0)}%`} sub="Across all instrument types" color={T.green} />
            <KpiCard label="Deals YTD" value={FINANCE_INSTRUMENTS.reduce((a, f) => a + f.dealsYTD, 0)} sub="Across all instrument categories" color={T.gold} />
          </div>
          <div style={card}>
            <h2 style={h2}>Food System Finance — AUM &amp; Growth by Instrument</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="aum" name="AUM ($Bn)" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="growth" name="Growth YoY %" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={grid(2)}>
            {FINANCE_INSTRUMENTS.map(f => (
              <div key={f.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 12 }}>{f.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[{ label: 'AUM', val: `$${f.aum}Bn`, color: T.navy },
                    { label: 'Growth', val: `+${f.growth}%`, color: T.green },
                    { label: 'Deals YTD', val: f.dealsYTD, color: T.amber }].map(m => (
                    <div key={m.label} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>{m.label}</div>
                      <div style={{ fontFamily: T.mono, fontWeight: 700, color: m.color, fontSize: 15 }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'Scenarios' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Scenario:</label>
            <select style={select} value={scenario} onChange={e => setScenario(e.target.value)}>
              {TRANSITION_SCENARIOS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={card}>
            <h2 style={h2}>Food System GHG Reduction Pathway (% vs 2024 baseline)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pathwayData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="Diet" stroke={T.green} fill={`${T.green}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="Technology" stroke={T.navy} fill={`${T.navy}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="Waste Red." stroke={T.amber} fill={`${T.amber}33`} strokeWidth={2} />
                <Line type="monotone" dataKey="Total" stroke={T.red} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Scenario Comparison — 2030 &amp; 2050 Reduction Targets</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Scenario','Diet 2030','Diet 2050','Tech 2030','Tech 2050','Waste 2030','Waste 2050','Total 2050'].map(h => (
                  <th key={h} style={{ padding: '8px', textAlign: 'left', color: T.textMut, fontWeight: 500, fontSize: 11 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{TRANSITION_SCENARIOS.map(sc => (
                <tr key={sc.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: sc.color, fontWeight: 600 }}>{sc.name}</td>
                  {[sc.diet2030, sc.diet2050, sc.tech2030, sc.tech2050, sc.waste2030, sc.waste2050].map((v, vi) => (
                    <td key={vi} style={{ padding: '7px 8px', fontFamily: T.mono, color: T.text }}>{v}%</td>
                  ))}
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, fontWeight: 700, color: T.green }}>{sc.diet2050 + sc.tech2050 + sc.waste2050}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Opportunities' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Alt Protein TAM" value="$290Bn" sub="Projected 2030 global market" color={T.green} />
            <KpiCard label="Precision Ag" value="$12.9Bn" sub="2025 market; CAGR 13.1%" color={T.navy} />
            <KpiCard label="Soil Carbon Credits" value="$6.4Bn" sub="Potential annual market 2030" color={T.sage} />
            <KpiCard label="Food Waste Finance" value="$750Bn" sub="Annual economic loss addressable" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Investment Opportunity Matrix — Food Transition Themes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { theme: 'Alternative Proteins', stage: 'Growth', ret: '18–28%', risk: 'Medium', horizon: '5–8 yr', color: T.green },
                { theme: 'Precision Agriculture', stage: 'Mature', ret: '12–18%', risk: 'Low', horizon: '3–6 yr', color: T.navy },
                { theme: 'Regenerative Ag', stage: 'Early', ret: '15–25%', risk: 'Medium', horizon: '7–12 yr', color: T.sage },
                { theme: 'Food Waste Tech', stage: 'Growth', ret: '14–22%', risk: 'Medium', horizon: '4–7 yr', color: T.teal },
                { theme: 'Sustainable Packaging', stage: 'Mature', ret: '10–15%', risk: 'Low', horizon: '3–5 yr', color: T.amber },
                { theme: 'Soil Carbon Markets', stage: 'Emerging', ret: '20–35%', risk: 'High', horizon: '8–15 yr', color: T.gold },
              ].map(o => (
                <div key={o.theme} style={{ background: T.surfaceH, borderRadius: 8, padding: 14, border: `1px solid ${o.color}44` }}>
                  <div style={{ fontWeight: 600, color: o.color, marginBottom: 8, fontSize: 13 }}>{o.theme}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[{ label: 'Stage', val: o.stage }, { label: 'Target Return', val: o.ret },
                      { label: 'Risk', val: o.risk }, { label: 'Horizon', val: o.horizon }].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 9, color: T.textMut }}>{m.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.text }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
