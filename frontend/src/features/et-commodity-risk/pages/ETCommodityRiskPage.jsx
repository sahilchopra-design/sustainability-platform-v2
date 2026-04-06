import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Cell, Legend, ReferenceLine, PieChart, Pie
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669', amber: '#92400e' };
const pct = (n, d = 1) => isFinite(+n) ? `${parseFloat(n).toFixed(d)}%` : '—%';
const usd = (n, d = 1) => isFinite(+n) ? `$${parseFloat(n).toFixed(d)}B` : '$—B';

const MINERALS_LIST = ['Lithium', 'Cobalt', 'Nickel', 'Copper', 'Rare Earths', 'Graphite'];
const SCENARIOS = ['NZE 2050', 'Announced Pledges', 'Stated Policies', 'Current Policies'];
const SCENARIO_COLORS = { 'NZE 2050': T.emerald, 'Announced Pledges': T.teal, 'Stated Policies': '#b45309', 'Current Policies': T.gray };

// Hypothetical portfolio of energy transition companies
const PORTFOLIO = Array.from({ length: 20 }, (_, i) => {
  const sectors = ['EV OEMs', 'Battery Mfg', 'Renewables', 'Grid Infra', 'Mining', 'Chemical Processing', 'Utilities', 'Oil & Gas Transition'];
  const names = [
    'Tesla Inc.', 'BYD Co.', 'CATL', 'LG Energy', 'Albemarle', 'Glencore', 'Freeport-McMoRan', 'MP Materials',
    'Vestas Wind', 'Siemens Gamesa', 'First Solar', 'Enphase', 'Eaton Corp', 'Schneider Elec.', 'ABB Ltd',
    'NextEra Energy', 'Ørsted', 'RWE AG', 'BP Transition', 'Shell Renewables',
  ];
  const li_exp   = Math.round(sr(i * 5)  * 35);
  const co_exp   = Math.round(sr(i * 7)  * 20);
  const ni_exp   = Math.round(sr(i * 9)  * 25);
  const cu_exp   = Math.round(sr(i * 11) * 30);
  const ree_exp  = Math.round(sr(i * 13) * 15);
  const total_exp = Math.round((li_exp + co_exp + ni_exp + cu_exp + ree_exp) / 5);
  const scenario_risk = Math.round(20 + sr(i * 17) * 60);
  return {
    id: i, name: names[i],
    sector: sectors[i % sectors.length],
    weight: +(1.5 + sr(i * 3) * 8).toFixed(1),
    li_exposure: li_exp, co_exposure: co_exp, ni_exposure: ni_exp, cu_exposure: cu_exp, ree_exposure: ree_exp,
    total_mineral_exposure: total_exp,
    scenario_risk, transition_score: Math.round(40 + sr(i * 19) * 55),
    revenue_at_risk_pct: +(2 + sr(i * 23) * 18).toFixed(1),
  };
});

// Demand surge by scenario
const DEMAND_SURGE = MINERALS_LIST.map((m, mi) => {
  const obj = { mineral: m };
  SCENARIOS.forEach((s, si) => { obj[s] = Math.round(2 + (SCENARIOS.length - 1 - si) * 0.8 + sr(mi * 5 + si * 11) * 8); }); // NZE 2050 (si=0) gets highest base; Current Policies (si=3) gets lowest — correct NGFS direction
  return obj;
});

// Price scenario impact
const PRICE_SCENARIOS = MINERALS_LIST.map((m, mi) => ({
  mineral: m,
  'NZE 2050':           Math.round(80 + sr(mi * 5) * 80),
  'Announced Pledges':  Math.round(50 + sr(mi * 7) * 60),
  'Stated Policies':    Math.round(20 + sr(mi * 9) * 30),
  'Current Policies':   Math.round(5  + sr(mi * 11) * 15),
}));

// Supply chain concentration risk
const SUPPLY_CHAIN_RISK = [
  { stage: 'Mining', hhi: 0.62, geo_risk: 78, key_risk: 'DRC Cobalt, China REE dominance' },
  { stage: 'Refining', hhi: 0.74, geo_risk: 85, key_risk: 'China processes 65%+ of battery materials' },
  { stage: 'Cell Manufacturing', hhi: 0.58, geo_risk: 72, key_risk: 'China, Korea, Japan dominate' },
  { stage: 'Pack Assembly', hhi: 0.42, geo_risk: 55, key_risk: 'More geographically distributed' },
  { stage: 'OEM', hhi: 0.28, geo_risk: 38, key_risk: 'Global but EU/US IRA reshoring' },
];

// Portfolio exposure by sector
const SECTOR_EXPOSURE = ['EV OEMs', 'Battery Mfg', 'Renewables', 'Grid Infra', 'Mining', 'Chemical Processing', 'Utilities', 'Oil & Gas Transition'].map((s, i) => ({
  sector: s,
  li: Math.round(5  + sr(i * 5) * 40),
  co: Math.round(3  + sr(i * 7) * 25),
  ni: Math.round(4  + sr(i * 9) * 30),
  cu: Math.round(10 + sr(i * 11) * 35),
  ree: Math.round(2 + sr(i * 13) * 18),
}));

// Revenue at risk under price shock
const REVENUE_AT_RISK = [
  { shock: '+20% minerals', at_risk: 2.8,  hedged: 1.1 },
  { shock: '+50% minerals', at_risk: 7.4,  hedged: 3.2 },
  { shock: '+100% minerals', at_risk: 15.2, hedged: 7.8 },
  { shock: 'Supply disruption (6M)', at_risk: 22.4, hedged: 10.2 },
  { shock: 'Geopolitical embargo', at_risk: 38.6, hedged: 18.4 },
];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

export default function ETCommodityRiskPage() {
  const [tab, setTab] = useState('Portfolio Exposure');
  const [scenario, setScenario] = useState('NZE 2050');

  const totalWeight = PORTFOLIO.reduce((a, p) => a + p.weight, 0);
  const avgMineralExp = totalWeight > 0 ? (PORTFOLIO.reduce((a, p) => a + p.total_mineral_exposure * p.weight, 0) / totalWeight).toFixed(1) : '0.0';
  const avgRevRisk = totalWeight > 0 ? (PORTFOLIO.reduce((a, p) => a + p.revenue_at_risk_pct * p.weight, 0) / totalWeight).toFixed(1) : '0.0';
  const highRisk = PORTFOLIO.filter(p => p.total_mineral_exposure > 25).length;

  const TABS = ['Portfolio Exposure', 'Scenario Impact', 'Supply Chain Risk', 'Revenue at Risk', 'Sector Analysis'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BO3</span>
          <span style={{ fontSize: 11, color: T.amber, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>ET · COMMODITY · RISK</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Energy Transition Commodity Risk Engine</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Portfolio mineral exposure · NGFS scenario price impact · Supply chain concentration · Revenue at risk · Sector analysis</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Portfolio Exposure' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Avg Mineral Exposure" value={`${avgMineralExp}/100`} sub="Weighted portfolio score" color={+avgMineralExp > 20 ? T.orange : T.teal} />
            <Kpi label="High-Exposure Holdings" value={`${highRisk} / ${PORTFOLIO.length}`} sub="Mineral exposure > 25" color={T.red} />
            <Kpi label="Avg Revenue at Risk" value={`${avgRevRisk}%`} sub="+50% mineral price shock" color={T.orange} />
            <Kpi label="Scenario" value={scenario.split(' ')[0]} sub="Active NGFS pathway" color={SCENARIO_COLORS[scenario]} />
          </div>

          <Section title="Portfolio Mineral Exposure Heatmap — Top 20 Holdings">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Company', 'Sector', 'Weight', 'Li Exp.', 'Co Exp.', 'Ni Exp.', 'Cu Exp.', 'REE Exp.', 'Total', 'Rev @ Risk', 'Trans. Score'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO.sort((a, b) => b.total_mineral_exposure - a.total_mineral_exposure).map((p, i) => (
                    <tr key={p.name} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy, whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: T.purple }}>{p.sector}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{p.weight}%</td>
                      {[p.li_exposure, p.co_exposure, p.ni_exposure, p.cu_exposure, p.ree_exposure].map((v, vi) => (
                        <td key={vi} style={{ padding: '7px 10px' }}>
                          <div style={{ width: 32, height: 6, background: '#e5e0d8', borderRadius: 3 }}>
                            <div style={{ width: `${v}%`, height: 6, background: v > 25 ? T.red : v > 15 ? T.orange : T.teal, borderRadius: 3 }} />
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: p.total_mineral_exposure > 20 ? T.red : T.teal }}>{p.total_mineral_exposure}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: +p.revenue_at_risk_pct > 10 ? T.red : T.orange }}>{p.revenue_at_risk_pct}%</td>
                      <td style={{ padding: '7px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 36, height: 5, background: '#e5e0d8', borderRadius: 3 }}>
                            <div style={{ width: `${p.transition_score}%`, height: 5, background: p.transition_score > 70 ? T.emerald : p.transition_score > 50 ? T.teal : T.orange, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.transition_score}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {tab === 'Scenario Impact' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>NGFS Scenario</div>
              <select value={scenario} onChange={e => setScenario(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                {SCENARIOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Li Demand Surge" value={`+${DEMAND_SURGE[0][scenario]}×`} sub={`vs 2024 under ${scenario}`} color={SCENARIO_COLORS[scenario]} />
            <Kpi label="Co Demand Surge" value={`+${DEMAND_SURGE[1][scenario]}×`} sub={`vs 2024 under ${scenario}`} color={SCENARIO_COLORS[scenario]} />
            <Kpi label="Cu Demand Surge" value={`+${DEMAND_SURGE[3][scenario]}×`} sub={`vs 2024 under ${scenario}`} color={SCENARIO_COLORS[scenario]} />
            <Kpi label="REE Demand Surge" value={`+${DEMAND_SURGE[4][scenario]}×`} sub={`vs 2024 under ${scenario}`} color={SCENARIO_COLORS[scenario]} />
          </div>

          <Section title="Demand Multiplier by Mineral — NGFS Scenarios (2030 vs 2024)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DEMAND_SURGE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="mineral" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}×`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}× current demand`} />
                {SCENARIOS.map(s => (
                  <Bar key={s} dataKey={s} name={s} fill={SCENARIO_COLORS[s]} radius={[2, 2, 0, 0]} />
                ))}
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Price Impact by Scenario (% increase vs today)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PRICE_SCENARIOS} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="mineral" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis tickFormatter={v => `+${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `+${v}% price increase`} />
                {SCENARIOS.map(s => (
                  <Bar key={s} dataKey={s} name={s} fill={SCENARIO_COLORS[s]} radius={[2, 2, 0, 0]} />
                ))}
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Supply Chain Risk' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Refining Stage HHI" value="0.74" sub="Highest concentration risk" color={T.red} />
            <Kpi label="China Processing Share" value="65–80%" sub="Of battery-grade materials" color={T.red} />
            <Kpi label="IRA Reshoring Progress" value="~18%" sub="US/EU vs China capacity 2024" color={T.orange} />
            <Kpi label="Circular Economy Offset" value="~8%" sub="Recycled content, rising to 25%+ by 2030" color={T.emerald} />
          </div>

          <Section title="Supply Chain Concentration by Stage (HHI & Geo Risk)" badge="HHI: 0=competitive, 1=monopoly">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SUPPLY_CHAIN_RISK} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="stage" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis yAxisId="left"  domain={[0, 1]}   tickFormatter={v => v.toFixed(2)}       style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={v => `${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip />
                <Bar yAxisId="left"  dataKey="hhi"      name="HHI Concentration" fill={T.red}  radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="geo_risk" name="Geo Risk Score"    fill={T.orange} radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Supply Chain Stage Risk Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Stage', 'HHI', 'Geo Risk Score', 'Key Risk', 'Criticality'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUPPLY_CHAIN_RISK.map((s, i) => (
                  <tr key={s.stage} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: T.navy }}>{s.stage}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: s.hhi > 0.6 ? T.red : s.hhi > 0.4 ? T.orange : T.teal }}>{s.hhi.toFixed(2)}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', color: s.geo_risk > 70 ? T.red : s.geo_risk > 50 ? T.orange : T.teal }}>{s.geo_risk}/100</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: T.gray }}>{s.key_risk}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ background: s.hhi > 0.6 ? T.red : s.hhi > 0.4 ? T.orange : T.teal, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.hhi > 0.6 ? 'CRITICAL' : s.hhi > 0.4 ? 'HIGH' : 'MODERATE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Revenue at Risk' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="+50% Shock Revenue @ Risk" value={usd(REVENUE_AT_RISK[1].at_risk)} sub="Unhedged portfolio exposure" color={T.red} />
            <Kpi label="After Hedge" value={usd(REVENUE_AT_RISK[1].hedged)} sub="+50% shock, hedged" color={T.teal} />
            <Kpi label="Hedge Effectiveness" value={`${((1 - REVENUE_AT_RISK[1].hedged / REVENUE_AT_RISK[1].at_risk) * 100).toFixed(0)}%`} sub="Risk reduction from hedges" color={T.emerald} />
            <Kpi label="Geopolitical Embargo Risk" value={usd(REVENUE_AT_RISK[4].at_risk)} sub="Worst case tail risk" color={T.purple} />
          </div>

          <Section title="Revenue at Risk — Mineral Price Shock Scenarios" badge="USD Billions">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={REVENUE_AT_RISK} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="shock" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tickFormatter={v => `$${v}B`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `$${v}B`} />
                <Bar dataKey="at_risk" name="Gross Revenue @ Risk" fill={T.red}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="hedged"  name="Net of Hedges"        fill={T.teal}  radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Hedge Analytics — Recommended Positions">
            {[
              { mineral: 'Lithium', strategy: 'OTC Swap — 12M rolling hedge', coverage: '35%', cost: '0.8% of exposure/yr', rating: 'Recommended' },
              { mineral: 'Cobalt',  strategy: 'LME Futures + Physical Buffer', coverage: '45%', cost: '1.2% of exposure/yr', rating: 'Recommended' },
              { mineral: 'Nickel',  strategy: 'LME Nickel Futures',            coverage: '60%', cost: '0.6% of exposure/yr', rating: 'Standard' },
              { mineral: 'Copper',  strategy: 'COMEX Copper Futures',          coverage: '70%', cost: '0.4% of exposure/yr', rating: 'Standard' },
              { mineral: 'REE',     strategy: 'Physical Stockpile + JV Supply', coverage: '20%', cost: '2.8% of exposure/yr', rating: 'Limited' },
            ].map((h, i) => (
              <div key={h.mineral} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #f0ece4' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{h.mineral}</div>
                  <div style={{ fontSize: 12, color: T.gray }}>{h.strategy}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.teal }}>{h.coverage} covered</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gray }}>{h.cost}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4,
                    background: h.rating === 'Recommended' ? '#d1fae5' : h.rating === 'Standard' ? '#dbeafe' : '#fef3c7',
                    color: h.rating === 'Recommended' ? T.emerald : h.rating === 'Standard' ? '#1d4ed8' : '#92400e' }}>
                    {h.rating}
                  </span>
                </div>
              </div>
            ))}
          </Section>
        </>
      )}

      {tab === 'Sector Analysis' && (
        <>
          <Section title="Mineral Exposure by Sector" badge="Exposure Score 0–100">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SECTOR_EXPOSURE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="sector" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="li"  name="Lithium"    fill="#0f766e" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="co"  name="Cobalt"     fill="#c2410c" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="ni"  name="Nickel"     fill="#1d4ed8" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="cu"  name="Copper"     fill="#b45309" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="ree" name="Rare Earths" fill="#059669" radius={[2, 2, 0, 0]} stackId="a" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Transition Score vs Mineral Exposure (Portfolio Companies)">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="total_mineral_exposure" name="Mineral Exposure"
                  label={{ value: 'Mineral Exposure Score', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis dataKey="transition_score" name="Transition Score" tickFormatter={v => `${v}`}
                  label={{ value: 'Transition Score', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <ReferenceLine x={20} stroke={T.gold} strokeDasharray="4 4" />
                <Scatter data={PORTFOLIO} name="Holdings" fill={T.teal} opacity={0.7} r={6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}
    </div>
  );
}
