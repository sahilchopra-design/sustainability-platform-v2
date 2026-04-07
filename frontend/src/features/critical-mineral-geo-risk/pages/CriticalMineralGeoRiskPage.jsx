import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const MINERALS = [
  { name:'Lithium', mining_top:['Australia 47%','Chile 30%','China 15%'], processing_china:62, oecd_share:52, price_vol:38, ev_critical:true },
  { name:'Cobalt', mining_top:['DRC 73%','Indonesia 5%','Russia 4%'], processing_china:74, oecd_share:12, price_vol:42, ev_critical:true },
  { name:'Nickel', mining_top:['Indonesia 49%','Philippines 10%','Russia 7%'], processing_china:35, oecd_share:18, price_vol:35, ev_critical:true },
  { name:'Copper', mining_top:['Chile 24%','Peru 10%','DRC 10%'], processing_china:42, oecd_share:38, price_vol:22, ev_critical:true },
  { name:'Rare Earths', mining_top:['China 60%','Myanmar 12%','Australia 8%'], processing_china:90, oecd_share:14, price_vol:55, ev_critical:true },
  { name:'Graphite', mining_top:['China 65%','Mozambique 12%','Brazil 8%'], processing_china:93, oecd_share:8, price_vol:28, ev_critical:true },
  { name:'Manganese', mining_top:['South Africa 37%','Gabon 18%','Australia 15%'], processing_china:55, oecd_share:22, price_vol:30, ev_critical:false },
  { name:'PGMs', mining_top:['South Africa 72%','Russia 12%','Zimbabwe 8%'], processing_china:18, oecd_share:15, price_vol:32, ev_critical:false },
];

const PROCESSING_CONC = MINERALS.map(m => ({ mineral: m.name, china: m.processing_china, other: 100 - m.processing_china }));

const FRIENDSHORING = MINERALS.map(m => ({ mineral: m.name, oecd: m.oecd_share, nonOecd: 100 - m.oecd_share }));

const SCENARIOS = [
  { name:'China REE export ban', probability:'Medium (20-30%)', impact:'Severe', affected:['Rare Earths','Graphite','Manganese'], ev_delay:'12-18 months', price_spike:'200-400%' },
  { name:'DRC cobalt supply disruption', probability:'High (40-50%)', impact:'High', affected:['Cobalt'], ev_delay:'6-12 months', price_spike:'80-150%' },
  { name:'Indonesia nickel export tax', probability:'High (50-60%)', impact:'Moderate', affected:['Nickel'], ev_delay:'3-6 months', price_spike:'30-60%' },
  { name:'Chile lithium nationalization', probability:'Low (10-15%)', impact:'High', affected:['Lithium'], ev_delay:'6-12 months', price_spike:'50-100%' },
  { name:'Russia PGM sanctions escalation', probability:'Medium (25-35%)', impact:'Moderate', affected:['PGMs','Nickel'], ev_delay:'3-6 months', price_spike:'40-80%' },
];

const PRICE_TREND = [
  { year: 2020, lithium: 100, cobalt: 100, nickel: 100, copper: 100, ree: 100 },
  { year: 2021, lithium: 180, cobalt: 120, nickel: 115, copper: 130, ree: 145 },
  { year: 2022, lithium: 520, cobalt: 155, nickel: 145, copper: 115, ree: 280 },
  { year: 2023, lithium: 180, cobalt: 85, nickel: 95, copper: 110, ree: 160 },
  { year: 2024, lithium: 145, cobalt: 75, nickel: 88, copper: 125, ree: 140 },
  { year: 2025, lithium: 160, cobalt: 82, nickel: 95, copper: 135, ree: 155 },
];

const PORTFOLIO_IMPACT = [
  { company:'Tesla', exposure:'HIGH', minerals:['Lithium','Cobalt','Nickel','Graphite'], mitigation:'Vertical integration, LFP pivot' },
  { company:'BYD', exposure:'MEDIUM', minerals:['Lithium','Graphite'], mitigation:'Domestic Chinese supply chain' },
  { company:'CATL', exposure:'MEDIUM', minerals:['Lithium','Cobalt','Nickel','Graphite'], mitigation:'African mining JVs' },
  { company:'Albemarle', exposure:'HIGH', minerals:['Lithium'], mitigation:'Chilean/Australian diversification' },
  { company:'Glencore', exposure:'HIGH', minerals:['Cobalt','Copper','Nickel','PGMs'], mitigation:'DRC + Philippines ops' },
  { company:'Rio Tinto', exposure:'MEDIUM', minerals:['Lithium','Copper','Iron Ore'], mitigation:'Australian/Canadian focus' },
  { company:'Umicore', exposure:'HIGH', minerals:['Cobalt','PGMs','Rare Earths'], mitigation:'Recycling capacity expansion' },
  { company:'Siemens Gamesa', exposure:'MEDIUM', minerals:['Rare Earths','Copper'], mitigation:'REE-free motor R&D' },
];

const TABS = ['Supply Chain Map','Processing Concentration','Friendshoring Index','Export Control Scenarios','Price Volatility','Portfolio Impact'];

export default function CriticalMineralGeoRiskPage() {
  const [tab, setTab] = useState(0);
  const [selectedMineral, setSelectedMineral] = useState('Lithium');
  const [scenarioIdx, setScenarioIdx] = useState(0);

  const sel = MINERALS.find(m => m.name === selectedMineral);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 155px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: '#7c2d12', color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CV3</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Critical Mineral Geopolitical Supply Risk</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        8 critical minerals: mining concentration, processing dominance, friendshoring metrics, and export control scenario analysis.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: IEA Critical Minerals 2025 | USGS | EU CRM Act</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Minerals Tracked', '8', '6 EV-critical')}
        {card('China Processing Avg', `${Math.round(MINERALS.reduce((s,m) => s + m.processing_china, 0) / MINERALS.length)}%`, 'Dominant processor', T.red)}
        {card('OECD Mining Avg', `${Math.round(MINERALS.reduce((s,m) => s + m.oecd_share, 0) / MINERALS.length)}%`, 'Friendshoring gap', T.amber)}
        {card('Export Control Scenarios', SCENARIOS.length, 'Active risk scenarios')}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={selectedMineral} onChange={e => setSelectedMineral(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          {MINERALS.map(m => <option key={m.name}>{m.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Mining Concentration: {sel.name}</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            {sel.mining_top.map((t, i) => (
              <div key={i} style={{ padding: '8px 16px', background: T.bg, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                <span style={{ fontFamily: T.mono, color: i === 0 ? T.red : T.textSec }}>{i + 1}.</span> {t}
              </div>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Mineral','Top Producer','China Processing %','OECD Mining %','Price Volatility','EV Critical'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {MINERALS.map(m => (
                <tr key={m.name} style={{ borderBottom: `1px solid ${T.border}`, background: m.name === selectedMineral ? '#fffff5' : 'transparent' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700 }}>{m.name}</td>
                  <td style={{ padding: '6px 10px' }}>{m.mining_top[0]}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, color: m.processing_china > 70 ? T.red : m.processing_china > 50 ? T.amber : T.green }}>{m.processing_china}%</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{m.oecd_share}%</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{m.price_vol}%</td>
                  <td style={{ padding: '6px 10px' }}>{m.ev_critical ? <span style={{ color: T.red }}>Yes</span> : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Processing Concentration (China vs Rest of World)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={PROCESSING_CONC}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="mineral" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <Legend />
              <Bar dataKey="china" stackId="a" fill={T.red} name="China %" />
              <Bar dataKey="other" stackId="a" fill={T.blue} name="Rest of World %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
            <strong>Concentration risk:</strong> China controls &gt;70% processing for Cobalt, Rare Earths, and Graphite. EU CRM Act targets 40% domestic processing by 2030.
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Friendshoring Index: OECD vs Non-OECD Mining Share</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={FRIENDSHORING} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="mineral" tick={{ fontSize: 11 }} width={95} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Legend />
              <Bar dataKey="oecd" stackId="a" fill={T.green} name="OECD %" />
              <Bar dataKey="nonOecd" stackId="a" fill={T.amber} name="Non-OECD %" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Friendshoring gap:</strong> Only Lithium has majority OECD mining supply (52%). All others are dominated by non-OECD producers. Cobalt (DRC 73%) and PGMs (South Africa 72%) are most concentrated.
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Export Control Scenarios</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {SCENARIOS.map((sc, i) => (
              <button key={i} onClick={() => setScenarioIdx(i)} style={{
                padding: '6px 14px', borderRadius: 6, border: `1px solid ${scenarioIdx === i ? T.navy : T.border}`,
                background: scenarioIdx === i ? T.navy : T.surface, color: scenarioIdx === i ? '#fff' : T.textSec,
                cursor: 'pointer', fontSize: 12
              }}>{sc.name}</button>
            ))}
          </div>
          <div style={{ padding: 16, border: `2px solid ${T.border}`, borderRadius: 10, background: T.bg }}>
            <h4 style={{ color: T.navy, margin: '0 0 10px' }}>{SCENARIOS[scenarioIdx].name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
              <div><span style={{ color: T.textMut }}>Probability:</span> <strong>{SCENARIOS[scenarioIdx].probability}</strong></div>
              <div><span style={{ color: T.textMut }}>Impact:</span> <strong style={{ color: SCENARIOS[scenarioIdx].impact === 'Severe' ? T.red : T.amber }}>{SCENARIOS[scenarioIdx].impact}</strong></div>
              <div><span style={{ color: T.textMut }}>Price Spike:</span> <strong style={{ color: T.red }}>{SCENARIOS[scenarioIdx].price_spike}</strong></div>
              <div><span style={{ color: T.textMut }}>EV Supply Delay:</span> <strong>{SCENARIOS[scenarioIdx].ev_delay}</strong></div>
              <div style={{ gridColumn: 'span 2' }}><span style={{ color: T.textMut }}>Affected Minerals:</span> <strong>{SCENARIOS[scenarioIdx].affected.join(', ')}</strong></div>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Price Volatility Index (2020 = 100)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={PRICE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 550]} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={100} stroke={T.textMut} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="lithium" stroke={T.blue} strokeWidth={2} name="Lithium" />
              <Line type="monotone" dataKey="cobalt" stroke={T.purple} strokeWidth={2} name="Cobalt" />
              <Line type="monotone" dataKey="nickel" stroke={T.green} strokeWidth={2} name="Nickel" />
              <Line type="monotone" dataKey="copper" stroke={T.orange} strokeWidth={2} name="Copper" />
              <Line type="monotone" dataKey="ree" stroke={T.red} strokeWidth={2} name="Rare Earths" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Key event:</strong> Lithium peaked at 520% of 2020 levels in 2022 due to EV demand surge, then corrected. Rare earths remain volatile due to China export control uncertainty.
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Portfolio Companies: Mineral Supply Risk Exposure</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Company','Exposure','Critical Minerals','Mitigation Strategy'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {PORTFOLIO_IMPACT.map(p => (
                <tr key={p.company} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.company}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: p.exposure === 'HIGH' ? T.red : T.amber, fontWeight: 700 }}>{p.exposure}</span></td>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.minerals.join(', ')}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> IEA Critical Minerals Report 2025 | USGS Mineral Commodity Summaries | EU Critical Raw Materials Act | S&P Global Market Intelligence.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CV3 v1.0 | Mineral Geo Risk</span>
      </div>
    </div>
  );
}
