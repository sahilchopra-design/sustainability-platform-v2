import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const OFFSET_TYPES = [
  { type:'ARR Tropical', category:'Nature', reversalDecade:12, bufferPct:20, fireRisk:15, droughtRisk:8, permanenceYrs:35, insurable:true },
  { type:'ARR Temperate', category:'Nature', reversalDecade:8, bufferPct:18, fireRisk:10, droughtRisk:5, permanenceYrs:40, insurable:true },
  { type:'REDD+ Amazon', category:'Nature', reversalDecade:10, bufferPct:25, fireRisk:12, droughtRisk:10, permanenceYrs:30, insurable:true },
  { type:'REDD+ SE Asia', category:'Nature', reversalDecade:14, bufferPct:22, fireRisk:8, droughtRisk:6, permanenceYrs:28, insurable:true },
  { type:'IFM Boreal', category:'Nature', reversalDecade:6, bufferPct:15, fireRisk:8, droughtRisk:3, permanenceYrs:45, insurable:true },
  { type:'Peatland Restore', category:'Nature', reversalDecade:4, bufferPct:12, fireRisk:3, droughtRisk:5, permanenceYrs:50, insurable:false },
  { type:'Mangrove', category:'Blue Carbon', reversalDecade:5, bufferPct:15, fireRisk:1, droughtRisk:2, permanenceYrs:55, insurable:false },
  { type:'Soil Carbon', category:'Soil', reversalDecade:18, bufferPct:10, fireRisk:2, droughtRisk:12, permanenceYrs:15, insurable:false },
  { type:'Biochar', category:'Engineered', reversalDecade:0.5, bufferPct:5, fireRisk:0, droughtRisk:0, permanenceYrs:500, insurable:false },
  { type:'DAC Geological', category:'Engineered', reversalDecade:0.1, bufferPct:2, fireRisk:0, droughtRisk:0, permanenceYrs:10000, insurable:false },
  { type:'CCS Industrial', category:'Engineered', reversalDecade:0.2, bufferPct:3, fireRisk:0, droughtRisk:0, permanenceYrs:5000, insurable:false },
  { type:'Mineralization', category:'Engineered', reversalDecade:0.05, bufferPct:1, fireRisk:0, droughtRisk:0, permanenceYrs:100000, insurable:false },
];

const TABS = ['Permanence Dashboard','Reversal Probability by Type','Buffer Pool Stress Test','Climate-Driven Reversal','Insurance Against Reversal','Expected Permanence Horizon'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function OffsetPermanenceRiskPage() {
  const [tab, setTab] = useState(0);
  const [bufferPct, setBufferPct] = useState(20);
  const [reversalRate, setReversalRate] = useState(15);
  const [warmingScenario, setWarmingScenario] = useState(2.0);
  const [watchlist, setWatchlist] = useState([]);

  const sorted = [...OFFSET_TYPES].sort((a, b) => a.reversalDecade - b.reversalDecade);
  const catDist = ['Nature','Blue Carbon','Soil','Engineered'].map(c => ({ cat: c, count: OFFSET_TYPES.filter(o => o.category === c).length, avgRev: (OFFSET_TYPES.filter(o => o.category === c).reduce((a, o) => a + o.reversalDecade, 0) / Math.max(1, OFFSET_TYPES.filter(o => o.category === c).length)).toFixed(1) }));

  const stressResults = useMemo(() => {
    const scenarios = [5, 10, 15, 20, 25, 30, 35, 40];
    return scenarios.map(rev => ({
      reversalPct: rev, buffer: bufferPct, surplus: bufferPct - rev,
      adequate: bufferPct >= rev ? 'Yes' : 'No'
    }));
  }, [bufferPct]);

  const climateDriven = useMemo(() => {
    return OFFSET_TYPES.filter(o => o.category === 'Nature').map(o => {
      const base = o.fireRisk;
      const adj = base * (1 + (warmingScenario - 1.5) * 0.6);
      return { type: o.type, baseRisk: base, adjRisk: Math.round(adj * 10) / 10, increase: Math.round((adj - base) * 10) / 10 };
    });
  }, [warmingScenario]);

  const permHorizon = OFFSET_TYPES.map(o => ({
    type: o.type, horizon: Math.min(o.permanenceYrs, 1000),
    display: o.permanenceYrs >= 1000 ? '1000+' : o.permanenceYrs.toString()
  })).sort((a, b) => b.horizon - a.horizon);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN2 · OFFSET PERMANENCE RISK</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Offset Permanence Risk Modelling</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>12 Offset Types · Reversal Probabilities · Buffer Stress Test · Climate-Driven Risk · Insurance</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Highest Risk', val: sorted[sorted.length - 1]?.type.split(' ')[0], col: T.red },
              { label: 'Lowest Risk', val: sorted[0]?.type.split(' ')[0], col: T.green },
              { label: 'Types', val: OFFSET_TYPES.length, col: T.gold },
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
          <button onClick={() => alert('Subscribe')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.teal}`, background: 'transparent', color: T.teal, cursor: 'pointer', fontSize: 11 }}>Subscribe Alerts</button>
        </div>

        {tab === 0 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Reversal Probability by Offset Type (%/decade)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={OFFSET_TYPES.sort((a, b) => b.reversalDecade - a.reversalDecade)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="type" width={110} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={v => `${v}%/decade`} /><Bar dataKey="reversalDecade" name="Reversal %/decade" radius={[0, 4, 4, 0]}>
                    {OFFSET_TYPES.map((d, i) => <Cell key={i} fill={d.reversalDecade > 10 ? T.red : d.reversalDecade > 5 ? T.amber : d.reversalDecade > 1 ? T.teal : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Category Distribution</div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={catDist} dataKey="count" nameKey="cat" cx="50%" cy="50%" outerRadius={100} label={({ cat, count }) => `${cat}: ${count}`}>
                    {catDist.map((_, i) => <Cell key={i} fill={[T.green, T.teal, T.amber, T.purple][i]} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>Reversal Risk Components — Fire vs Drought vs Total</div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={OFFSET_TYPES.filter(o => o.category === 'Nature' || o.category === 'Blue Carbon' || o.category === 'Soil')}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="fireRisk" name="Fire Risk %" fill={T.red} stackId="a" />
                <Bar dataKey="droughtRisk" name="Drought Risk %" fill={T.amber} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Buffer Pool Stress Test — Is {bufferPct}% buffer adequate?</div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: T.textSec, marginRight: 8 }}>Buffer Pool %:</span>
              <input type="range" min={5} max={50} value={bufferPct} onChange={e => setBufferPct(Number(e.target.value))} style={{ width: 200 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 8 }}>{bufferPct}%</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stressResults}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="reversalPct" tick={{ fontSize: 10 }} label={{ value: 'Reversal Scenario (%)', position: 'bottom', fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="surplus" name="Surplus/Deficit" radius={[4, 4, 0, 0]}>
                  {stressResults.map((d, i) => <Cell key={i} fill={d.surplus >= 0 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Climate-Driven Reversal Risk — Warming Scenario Adjustment</div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: T.textSec, marginRight: 8 }}>Warming Scenario:</span>
              {[1.5, 2.0, 2.5, 3.0, 4.0].map(w => (
                <button key={w} onClick={() => setWarmingScenario(w)} style={{
                  padding: '4px 12px', borderRadius: 20, marginRight: 6,
                  border: `2px solid ${warmingScenario === w ? T.gold : 'transparent'}`,
                  background: warmingScenario === w ? T.gold + '22' : T.bg, cursor: 'pointer', fontSize: 11
                }}>{w}C</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={climateDriven}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="baseRisk" name="Base Fire Risk %" fill={T.amber} />
                <Bar dataKey="adjRisk" name={`Adj @ ${warmingScenario}C`} fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Circular Risk Warning</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Higher warming increases wildfire frequency, which destroys forest-based offsets, which reduces emission reductions, which contributes to further warming. This circular feedback loop means nature-based offsets become less reliable precisely when they are most needed.</div>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Insurance Availability by Offset Type</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Offset Type','Category','Reversal %/dec','Buffer %','Insurable','Est. Premium'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{OFFSET_TYPES.map(o => (
                <tr key={o.type} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{o.type}</td>
                  <td style={{ padding: 6 }}>{o.category}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: o.reversalDecade > 10 ? T.red : T.green }}>{o.reversalDecade}%</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{o.bufferPct}%</td>
                  <td style={{ padding: 6 }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: o.insurable ? T.green + '22' : T.textMut + '22', color: o.insurable ? T.green : T.textMut }}>{o.insurable ? 'Yes' : 'No'}</span></td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{o.insurable ? `${(o.reversalDecade * 0.3).toFixed(1)}%/yr` : 'N/A'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Insurance Premium vs Reversal Risk</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={OFFSET_TYPES.filter(o => o.insurable)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey={o => o.reversalDecade * 0.3} name="Premium %/yr" fill={T.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Expected Permanence Horizon (Years — capped at 1000 for display)</div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={permHorizon} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 1000]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="type" width={110} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `${v >= 1000 ? '1000+' : v} years`} />
                <Bar dataKey="horizon" name="Permanence (yrs)" radius={[0, 4, 4, 0]}>
                  {permHorizon.map((d, i) => <Cell key={i} fill={d.horizon >= 1000 ? T.green : d.horizon >= 100 ? T.teal : d.horizon >= 30 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}
      </div>
    </div>
  );
}
