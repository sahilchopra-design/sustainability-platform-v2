import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine, ComposedChart
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const STATES = ['CA', 'FL', 'TX', 'NY', 'NJ', 'LA', 'NC', 'SC', 'GA', 'VA', 'MA', 'WA', 'OR', 'AZ', 'CO', 'IL', 'PA', 'OH', 'MI', 'MN'];
const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Deterministic PRNG — replaces non-deterministic random so loan pool is stable across renders
const _sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const COASTAL_STATES = new Set(['FL', 'NJ', 'NC', 'SC', 'LA', 'TX', 'NY', 'MA']);
const WILDFIRE_STATES = new Set(['CA', 'OR', 'WA', 'CO']);
const HEAT_STATES = new Set(['TX', 'AZ', 'FL', 'LA', 'GA']);

const LOANS = Array.from({ length: 500 }, (_, i) => {
  const state = STATES[i % 20];
  const floodZone    = _sr(i * 11) > 0.7;
  const wildfireZone = WILDFIRE_STATES.has(state) ? _sr(i * 13) > 0.5 : _sr(i * 13) > 0.85;
  const coastal      = COASTAL_STATES.has(state) ? _sr(i * 17) > 0.4 : _sr(i * 17) > 0.9;
  const epc          = EPC_RATINGS[Math.floor(_sr(i * 19) * 7)];
  const ltv          = 50 + Math.round(_sr(i * 23) * 45);
  const balance      = 80 + Math.round(_sr(i * 29) * 720);
  const rate         = 3.5 + +(_sr(i * 31) * 4).toFixed(2);
  const propValue    = Math.round(balance / (ltv / 100));
  const floodProb    = floodZone    ? 0.05 + _sr(i * 37) * 0.25 : _sr(i * 37) * 0.03;
  const fireProb     = wildfireZone ? 0.03 + _sr(i * 41) * 0.15 : _sr(i * 41) * 0.01;
  const heatProb     = HEAT_STATES.has(state) ? 0.3 + _sr(i * 43) * 0.4 : 0.05 + _sr(i * 43) * 0.2;
  return {
    id: `L${String(i + 1).padStart(4, '0')}`, state, floodZone, wildfireZone, coastal, epc, ltv, balance,
    rate, propValue, floodProb: +floodProb.toFixed(3), fireProb: +fireProb.toFixed(3), heatProb: +heatProb.toFixed(2),
  };
});

const TRANCHES = [
  { name: 'AAA Senior', pct: 70, spread: 45, color: T.green },
  { name: 'AA Mezzanine', pct: 15, spread: 120, color: T.blue },
  { name: 'BBB Junior', pct: 10, spread: 280, color: T.amber },
  { name: 'Equity', pct: 5, spread: 650, color: T.red },
];

function computeHaircut(loan, scenario) {
  const baseMult = scenario === 'SSP1-2.6' ? 0.6 : scenario === 'SSP2-4.5' ? 1.0 : 1.5;
  let haircut = 0;
  if (loan.coastal) haircut += (5 + loan.floodProb * 60) * baseMult;
  if (loan.wildfireZone) haircut += (8 + loan.fireProb * 90) * baseMult;
  if (loan.floodZone) haircut += (3 + loan.floodProb * 40) * baseMult;
  return Math.min(50, +haircut.toFixed(1));
}

const TABS = ['Pool-Level Dashboard', 'Loan-Level Physical Risk', 'Collateral Haircut Modeler', 'Tranche Loss Attribution', 'PCAF Class 5/7/8', 'Stress Test Scenarios'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const kpi = (label, value, sub, color = T.navy) => (
  <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 140, flex: 1 }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function StructuredCreditClimatePage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('SSP2-4.5');
  const [stateFilter, setStateFilter] = useState('All');
  const [sortCol, setSortCol] = useState('haircut');
  const [selectedTranche, setSelectedTranche] = useState('All');

  const totalBalance = LOANS.reduce((s, l) => s + l.balance, 0);
  const avgLTV = Math.round(LOANS.reduce((s, l) => s + l.ltv, 0) / Math.max(1, LOANS.length));
  const floodCount = LOANS.filter(l => l.floodZone).length;
  const fireCount = LOANS.filter(l => l.wildfireZone).length;

  const filteredLoans = useMemo(() => {
    let list = stateFilter === 'All' ? LOANS : LOANS.filter(l => l.state === stateFilter);
    return list.map(l => ({ ...l, haircut: computeHaircut(l, scenario) }))
      .sort((a, b) => sortCol === 'haircut' ? b.haircut - a.haircut : sortCol === 'ltv' ? b.ltv - a.ltv : b.balance - a.balance);
  }, [stateFilter, scenario, sortCol]);

  const stateAgg = useMemo(() => {
    const map = {};
    LOANS.forEach(l => {
      if (!map[l.state]) map[l.state] = { state: l.state, count: 0, balance: 0, flood: 0, fire: 0, avgHaircut: 0 };
      map[l.state].count++;
      map[l.state].balance += l.balance;
      if (l.floodZone) map[l.state].flood++;
      if (l.wildfireZone) map[l.state].fire++;
      map[l.state].avgHaircut += computeHaircut(l, scenario);
    });
    return Object.values(map).map(s => ({ ...s, avgHaircut: +(s.avgHaircut / s.count).toFixed(1) })).sort((a, b) => b.balance - a.balance);
  }, [scenario]);

  const haircutDist = useMemo(() => {
    const bins = [{ range: '0-5%', count: 0 }, { range: '5-10%', count: 0 }, { range: '10-15%', count: 0 }, { range: '15-25%', count: 0 }, { range: '25-50%', count: 0 }];
    filteredLoans.forEach(l => {
      if (l.haircut <= 5) bins[0].count++;
      else if (l.haircut <= 10) bins[1].count++;
      else if (l.haircut <= 15) bins[2].count++;
      else if (l.haircut <= 25) bins[3].count++;
      else bins[4].count++;
    });
    return bins;
  }, [filteredLoans]);

  const trancheLoss = useMemo(() => {
    const poolLoss = filteredLoans.reduce((s, l) => s + l.balance * l.haircut / 100, 0);
    const poolLossPct = poolLoss / totalBalance * 100;
    let remainingLoss = poolLossPct;
    return TRANCHES.map(t => {
      const absorbed = Math.min(remainingLoss, t.pct);
      remainingLoss = Math.max(0, remainingLoss - t.pct);
      return { ...t, absorbed: +absorbed.toFixed(2), lossPct: t.pct > 0 ? +(absorbed / t.pct * 100).toFixed(1) : 0 };
    }).reverse();
  }, [filteredLoans]);

  const stressScenarios = ['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'].map(s => {
    const loans = LOANS.map(l => ({ ...l, haircut: computeHaircut(l, s) }));
    const poolLoss = loans.reduce((sum, l) => sum + l.balance * l.haircut / 100, 0);
    return { scenario: s, poolLoss: +(poolLoss / 1000).toFixed(1), lossPct: +(poolLoss / totalBalance * 100).toFixed(2) };
  });

  const pcafClasses = [
    { cls: 'Class 5', name: 'Motor Vehicle Loans', formula: 'Attr = (Outstanding/Value) x Emissions_vehicle', dq: 3, example: 'Auto ABS: avg 4.2 tCO2/yr per vehicle' },
    { cls: 'Class 7', name: 'Sovereign Debt', formula: 'Attr = (Outstanding/GDP) x Country_Emissions', dq: 2, example: 'Sovereign bond: US ~14.7 tCO2/capita' },
    { cls: 'Class 8', name: 'Other (Listed eq/bonds)', formula: 'Attr = (Outstanding/EVIC) x Company_Emissions', dq: 3, example: 'CLO: look-through to underlying credits' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CI3 . STRUCTURED CREDIT CLIMATE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>MBS / ABS / CLO Climate Overlay</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              500 Loans . Physical Risk Mapping . Collateral Haircuts . Tranche Loss Attribution . PCAF Class 5/7/8 . Stress Tests
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              <option value="All">All States</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 14px', fontSize: 11, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
              background: tab === i ? T.bg : 'transparent', color: tab === i ? T.navy : '#94a3b8',
              border: 'none', borderRadius: '8px 8px 0 0', fontFamily: T.font, borderBottom: tab === i ? `2px solid ${T.gold}` : 'none'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {kpi('Pool Balance', `$${(totalBalance / 1000).toFixed(0)}M`, '500 loans')}
          {kpi('Avg LTV', `${avgLTV}%`, 'loan-to-value')}
          {kpi('Flood Zone', `${floodCount}`, `${(floodCount / 500 * 100).toFixed(0)}% of pool`, T.blue)}
          {kpi('Wildfire Zone', `${fireCount}`, `${(fireCount / 500 * 100).toFixed(0)}% of pool`, T.orange)}
          {kpi('Pool Loss ('+scenario+')', `${stressScenarios.find(s => s.scenario === scenario)?.lossPct}%`, 'climate-adjusted', T.red)}
        </div>

        {/* Tab 0: Pool-Level Dashboard */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Balance by State</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={stateAgg.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="state" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => `$${v}K`} />
                    <Bar dataKey="balance" name="Balance ($K)" radius={[4, 4, 0, 0]}>
                      {stateAgg.slice(0, 15).map((s, i) => <Cell key={i} fill={s.avgHaircut > 10 ? T.red : s.avgHaircut > 5 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Collateral Haircut Distribution</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={haircutDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Loan Count" fill={T.navy} radius={[4, 4, 0, 0]}>
                      {haircutDist.map((_, i) => <Cell key={i} fill={[T.green, T.blue, T.amber, T.orange, T.red][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>State Aggregation</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['State', 'Loans', 'Balance ($K)', 'Flood Zone', 'Fire Zone', 'Avg Haircut'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {stateAgg.map(s => (
                    <tr key={s.state} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.state}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{s.count}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>${s.balance}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: s.flood > 10 ? T.red : T.textSec }}>{s.flood}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: s.fire > 5 ? T.orange : T.textSec }}>{s.fire}</td>
                      <td style={{ padding: '8px 6px' }}><span style={{ color: s.avgHaircut > 10 ? T.red : s.avgHaircut > 5 ? T.amber : T.green, fontWeight: 600, fontFamily: T.mono }}>{s.avgHaircut}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1: Loan-Level Physical Risk */}
        {tab === 1 && (
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Loan-Level Physical Risk Overlay</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['haircut', 'ltv', 'balance'].map(s => (
                <button key={s} onClick={() => setSortCol(s)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  background: sortCol === s ? T.navy : T.surface, color: sortCol === s ? '#fff' : T.navy,
                  border: `1px solid ${sortCol === s ? T.navy : T.border}`
                }}>Sort: {s}</button>
              ))}
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 600 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
                  {['ID', 'State', 'Balance', 'LTV', 'Rate', 'EPC', 'Flood', 'Fire', 'Coastal', 'Flood P', 'Fire P', 'Heat P', 'Haircut'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredLoans.slice(0, 60).map(l => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${T.border}`, background: l.haircut > 15 ? '#fef2f2' : 'transparent' }}>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono, fontSize: 10 }}>{l.id}</td>
                      <td style={{ padding: '6px 4px' }}>{l.state}</td>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono }}>${l.balance}K</td>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono }}>{l.ltv}%</td>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono }}>{l.rate}%</td>
                      <td style={{ padding: '6px 4px' }}><span style={{ padding: '1px 4px', borderRadius: 3, background: l.epc <= 'C' ? '#dcfce7' : l.epc <= 'E' ? '#fef9c3' : '#fecaca', fontSize: 10 }}>{l.epc}</span></td>
                      <td style={{ padding: '6px 4px', color: l.floodZone ? T.blue : T.textMut }}>{l.floodZone ? 'Y' : '-'}</td>
                      <td style={{ padding: '6px 4px', color: l.wildfireZone ? T.orange : T.textMut }}>{l.wildfireZone ? 'Y' : '-'}</td>
                      <td style={{ padding: '6px 4px', color: l.coastal ? T.teal : T.textMut }}>{l.coastal ? 'Y' : '-'}</td>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono }}>{(l.floodProb * 100).toFixed(1)}%</td>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono }}>{(l.fireProb * 100).toFixed(1)}%</td>
                      <td style={{ padding: '6px 4px', fontFamily: T.mono }}>{(l.heatProb * 100).toFixed(0)}%</td>
                      <td style={{ padding: '6px 4px', fontWeight: 700, color: l.haircut > 15 ? T.red : l.haircut > 8 ? T.orange : T.green, fontFamily: T.mono }}>{l.haircut}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Collateral Haircut Modeler */}
        {tab === 2 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Collateral Haircut by State under {scenario}</h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={stateAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="state" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'Avg Haircut %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <ReferenceLine y={10} stroke={T.red} strokeDasharray="3 3" />
                  <Bar dataKey="avgHaircut" name="Avg Haircut %" radius={[4, 4, 0, 0]}>
                    {stateAgg.map((s, i) => <Cell key={i} fill={s.avgHaircut > 10 ? T.red : s.avgHaircut > 5 ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Haircut Rules</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { hazard: 'Coastal/Flood', ssp1: '3-8%', ssp2: '5-25%', ssp5: '8-40%', color: T.blue },
                  { hazard: 'Wildfire', ssp1: '5-10%', ssp2: '8-35%', ssp5: '12-50%', color: T.orange },
                  { hazard: 'Combined', ssp1: '8-15%', ssp2: '13-45%', ssp5: '20-50%', color: T.red },
                ].map(r => (
                  <div key={r.hazard} style={{ ...card, padding: 14, borderLeft: `3px solid ${r.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: r.color }}>{r.hazard}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>SSP1-2.6: {r.ssp1}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>SSP2-4.5: {r.ssp2}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>SSP5-8.5: {r.ssp5}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tranche Loss Attribution */}
        {tab === 3 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Tranche Loss Waterfall - {scenario}</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={trancheLoss} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: '% of Tranche Lost', position: 'bottom', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="lossPct" name="% Tranche Impaired" radius={[0, 4, 4, 0]}>
                    {trancheLoss.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Tranche Detail</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Tranche', 'Size (%)', 'Spread (bps)', 'Loss Absorbed (%)', 'Tranche Impaired (%)'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {trancheLoss.map(t => (
                    <tr key={t.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600, color: t.color }}>{t.name}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{t.pct}%</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{t.spread}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{t.absorbed}%</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, fontWeight: 700, color: t.lossPct > 50 ? T.red : t.lossPct > 20 ? T.amber : T.green }}>{t.lossPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: PCAF Class 5/7/8 */}
        {tab === 4 && (
          <div>
            {pcafClasses.map(pc => (
              <div key={pc.cls} style={{ ...card, borderLeft: `3px solid ${T.navy}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: 0 }}>{pc.cls}: {pc.name}</h3>
                  <span style={{ fontFamily: T.mono, fontSize: 11, background: pc.dq <= 2 ? '#dcfce7' : '#fef9c3', padding: '2px 8px', borderRadius: 4 }}>DQ Score: {pc.dq}</span>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 8 }}>{pc.formula}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{pc.example}</div>
              </div>
            ))}
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>PCAF 8-Class Overview</h3>
              <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Complete coverage across all PCAF asset classes with structured credit emphasis on Classes 5, 7, and 8</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Class', 'Asset Type', 'Relevance to Structured Credit'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    ['1', 'Listed Equity & Bonds', 'CLO underlying credits'],
                    ['2', 'Business Loans & Unlisted Equity', 'Leveraged loan pools'],
                    ['3', 'Project Finance', 'Infrastructure ABS'],
                    ['4', 'Commercial Real Estate', 'CMBS collateral'],
                    ['5', 'Mortgages', 'RMBS primary asset class'],
                    ['6', 'Motor Vehicle Loans', 'Auto ABS primary'],
                    ['7', 'Sovereign Debt', 'Sovereign bond holdings'],
                    ['8', 'Other', 'Residual structured products'],
                  ].map(([c, name, rel]) => (
                    <tr key={c} style={{ borderBottom: `1px solid ${T.border}`, background: ['5', '7', '8'].includes(c) ? '#f0f9ff' : 'transparent' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 700, fontFamily: T.mono }}>Class {c}</td>
                      <td style={{ padding: '8px 6px' }}>{name}</td>
                      <td style={{ padding: '8px 6px', color: T.textSec }}>{rel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Stress Test Scenarios */}
        {tab === 5 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pool Loss Under Climate Scenarios</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stressScenarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'Pool Loss %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="lossPct" name="Pool Loss %" radius={[4, 4, 0, 0]}>
                    {stressScenarios.map((s, i) => <Cell key={i} fill={[T.green, T.amber, T.red][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {stressScenarios.map(s => (
                <div key={s.scenario} style={{ ...card, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{s.scenario}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: s.lossPct > 5 ? T.red : s.lossPct > 2 ? T.amber : T.green, marginTop: 8 }}>{s.lossPct}%</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Pool Loss: ${s.poolLoss}M</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Reference Data</h4>
            {['PCAF Global GHG Standard (8 classes)', 'FEMA National Flood Hazard Layer', 'CoreLogic Wildfire Risk Score', 'EPC Registers (EU/UK)', 'SSP Climate Scenarios (IPCC AR6)', 'CMHC / Fannie Mae Loan Data'].map(r => (
              <div key={r} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>{r}</div>
            ))}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Engagement Tools</h4>
            {['Pool filter & sort by any column', 'Loan-level drill-down with hazard map', 'Tranche impact calculator', 'Structured report export', 'Collateral haircut scenario modeler', 'PCAF DQ improvement tracker'].map(e => (
              <div key={e} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.gold, display: 'inline-block' }} />{e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
