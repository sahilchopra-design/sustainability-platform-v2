import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, ScatterChart, Scatter, Cell, PieChart, Pie
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669' };
const usd = (n, d = 2) => `€${parseFloat(n).toFixed(d)}`;
const fmt = (n) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${n}`;

const ETS_MARKETS = [
  { name: 'EU ETS',       region: 'Europe',        price: 62.4,  ytd: +18.2, cap: 1360, mechanism: 'Cap-and-Trade', currency: '€', color: '#1d4ed8' },
  { name: 'UK ETS',       region: 'UK',            price: 44.8,  ytd: -8.4,  cap: 145,  mechanism: 'Cap-and-Trade', currency: '£', color: '#7c3aed' },
  { name: 'California',   region: 'USA/Canada',    price: 38.2,  ytd: +6.1,  cap: 310,  mechanism: 'Cap-and-Trade', currency: '$', color: '#0f766e' },
  { name: 'RGGI',         region: 'NE USA',        price: 14.6,  ytd: +2.3,  cap: 110,  mechanism: 'Cap-and-Trade', currency: '$', color: '#059669' },
  { name: 'China ETS',    region: 'China',         price: 9.8,   ytd: +3.5,  cap: 5100, mechanism: 'Rate-Based',    currency: 'CNY',color: '#c2410c' },
  { name: 'Korea ETS',    region: 'South Korea',   price: 8.2,   ytd: -1.8,  cap: 560,  mechanism: 'Cap-and-Trade', currency: 'KRW',color: '#b45309' },
  { name: 'NZ ETS',       region: 'New Zealand',   price: 52.6,  ytd: +12.0, cap: 55,   mechanism: 'Cap-and-Trade', currency: 'NZD',color: '#0369a1' },
  { name: 'Canada OBPS',  region: 'Canada',        price: 65.0,  ytd: +15.0, cap: 180,  mechanism: 'Output-Based',  currency: 'C$', color: '#374151' },
];

// EU ETS historical + forward
const EU_PRICE_HISTORY = [
  { period: '2020Q1', spot: 24.2 }, { period: '2020Q2', spot: 18.6 }, { period: '2020Q3', spot: 27.8 },
  { period: '2020Q4', spot: 30.4 }, { period: '2021Q1', spot: 38.2 }, { period: '2021Q2', spot: 52.1 },
  { period: '2021Q3', spot: 58.4 }, { period: '2021Q4', spot: 71.2 }, { period: '2022Q1', spot: 82.4 },
  { period: '2022Q2', spot: 68.4 }, { period: '2022Q3', spot: 70.1 }, { period: '2022Q4', spot: 88.2 },
  { period: '2023Q1', spot: 92.4 }, { period: '2023Q2', spot: 84.2 }, { period: '2023Q3', spot: 78.6 },
  { period: '2023Q4', spot: 61.4 }, { period: '2024Q1', spot: 58.2 }, { period: '2024Q2', spot: 63.8 },
  { period: '2024Q3', spot: 60.4 }, { period: '2024Q4', spot: 62.4 },
];

// Forward curve scenarios
const FORWARD_SCENARIOS = ['2025', '2026', '2027', '2028', '2029', '2030', '2035', '2040', '2050'].map((yr, i) => ({
  year: yr,
  baseline:     Math.round(62.4 + i * 8.2 + sr(i * 5) * 4),
  accelerated:  Math.round(62.4 + i * 14.8 + sr(i * 7) * 5),
  delayed:      Math.round(62.4 + i * 3.8 + sr(i * 11) * 3),
  ncb_forecast: Math.round(62.4 + i * 9.4 + sr(i * 13) * 6),
}));

// Scenario price paths
const SCENARIOS_VCM = [
  { name: 'NGFS NZE 2050',       color: '#059669', prices: [8, 12, 18, 28, 42, 60, 95, 130, 200] },
  { name: 'NGFS Below 2°C',      color: '#0f766e', prices: [8, 11, 15, 22, 32, 46, 72, 98, 140] },
  { name: 'IEA SDS',             color: '#b45309', prices: [8, 10, 14, 20, 28, 40, 64, 88, 120] },
  { name: 'Current Policies',    color: T.gray,    prices: [8, 9,  10, 11, 12, 13, 16, 18,  22] },
];
const YEARS_VCM = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2035, 2040];
const VCM_PRICE_DATA = YEARS_VCM.map((yr, i) => {
  const obj = { year: yr };
  SCENARIOS_VCM.forEach(s => { obj[s.name] = s.prices[i]; });
  return obj;
});

// ETS cap reduction schedule
const CAP_SCHEDULE = [2020, 2022, 2024, 2026, 2028, 2030, 2035, 2040].map((yr, i) => ({
  year: yr,
  euets: Math.round((1520 - i * 60) * 1e6),
  ca:    Math.round((380  - i * 14) * 1e6),
  rggi:  Math.round((130  - i * 8)  * 1e6),
}));

// Volume & OI
const TRADING_DATA = ETS_MARKETS.slice(0, 5).map((m, i) => ({
  market: m.name,
  daily_vol: Math.round(8 + sr(i * 7) * 42),
  open_int:  Math.round(120 + sr(i * 11) * 480),
  futures:   Math.round(60 + sr(i * 13) * 240),
}));

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

const DeltaBadge = ({ v }) => (
  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: v >= 0 ? T.emerald : T.red, fontWeight: 700 }}>
    {v >= 0 ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
  </span>
);

export default function CarbonForwardCurvePage() {
  const [tab, setTab] = useState('ETS Market Overview');
  const [market, setMarket] = useState('EU ETS');
  const [scenario, setScenario] = useState('baseline');

  const selectedMarket = ETS_MARKETS.find(m => m.name === market) || ETS_MARKETS[0];

  const TABS = ['ETS Market Overview', 'EU ETS Deep-Dive', 'Forward Curve', 'VCM Scenario Paths', 'Cap Reduction Schedule'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BN2</span>
          <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>CARBON · ETS · FORWARD</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Carbon Forward Curve & ETS Analytics</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>EU ETS · UK ETS · California WCI · RGGI · China ETS · Carbon futures · Scenario price paths · Cap reduction</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'ETS Market Overview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="EU ETS Price" value="€62.4/t" sub="▲ +18.2% YTD" color="#1d4ed8" />
            <Kpi label="California Price" value="$38.2/t" sub="▲ +6.1% YTD" color={T.teal} />
            <Kpi label="China ETS Price" value="¥71/t" sub="≈ $9.8/t · +3.5% YTD" color={T.orange} />
            <Kpi label="Global ETS Coverage" value="~17%" sub="of global GHG emissions" color={T.purple} />
          </div>

          <Section title="Compliance Carbon Markets — Current Prices & Key Metrics">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Market', 'Region', 'Current Price', 'YTD %', 'Cap (MtCO₂e)', 'Mechanism', 'Currency'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ETS_MARKETS.map((m, i) => (
                  <tr key={m.name} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: m.color }}>{m.name}</td>
                    <td style={{ padding: '8px 14px', color: T.gray, fontSize: 12 }}>{m.region}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{m.currency}{m.price}/t</td>
                    <td style={{ padding: '8px 14px' }}><DeltaBadge v={m.ytd} /></td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(m.cap * 1e6)}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12 }}>{m.mechanism}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{m.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="ETS Price Comparison (Local Currency/t)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ETS_MARKETS} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="name" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} />
                  <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={(v, _, p) => [`${p.payload.currency}${v}/t`, 'Price']} />
                  <Bar dataKey="price" name="Price" radius={[3, 3, 0, 0]}>
                    {ETS_MARKETS.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Cap Size by Market (MtCO₂e)">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={ETS_MARKETS} dataKey="cap" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''}>
                    {ETS_MARKETS.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${fmt(v * 1e6)} tCO₂e`} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}

      {tab === 'EU ETS Deep-Dive' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Spot Price" value="€62.4/t" sub="Dec 2024 settlement" color="#1d4ed8" />
            <Kpi label="52-Week High" value="€92.4/t" sub="Q1 2023 peak" color={T.orange} />
            <Kpi label="52-Week Low" value="€56.8/t" sub="Oct 2024 trough" color={T.teal} />
            <Kpi label="Annual Cap Reduction" value="-4.4%/yr" sub="Linear Reduction Factor" color={T.navy} />
          </div>

          <Section title="EU ETS Spot Price History (2020Q1–2024Q4)" badge="€/tCO₂e">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={EU_PRICE_HISTORY} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="period" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} interval={3} />
                <YAxis tickFormatter={v => `€${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `€${v}/t`} />
                <ReferenceLine y={50} stroke={T.gray} strokeDasharray="4 4" label={{ value: '€50 support', fill: T.gray, fontSize: 10 }} />
                <Area type="monotone" dataKey="spot" name="EU ETS Spot" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.15} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Key ETS Policy Milestones">
              {[
                { year: '2021', event: 'EU ETS Phase 4 begins — LRF raised to 2.2%', impact: 'Bullish' },
                { year: '2022', event: 'REPowerEU — accelerated cap tightening', impact: 'Bullish' },
                { year: '2023', event: 'CBAM regulation enacted', impact: 'Bullish' },
                { year: '2024', event: 'MSR review — absorption rate changes', impact: 'Neutral' },
                { year: '2026', event: 'ETS2 (buildings, road) launches', impact: 'Structural' },
                { year: '2027', event: 'Aviation fully included', impact: 'Bullish' },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 5 ? '1px solid #f0ece4' : 'none' }}>
                  <div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.gold, fontWeight: 700, marginRight: 8 }}>{e.year}</span>
                    <span style={{ fontSize: 13, color: T.navy }}>{e.event}</span>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: e.impact === 'Bullish' ? '#d1fae5' : e.impact === 'Neutral' ? '#f3f4f6' : '#dbeafe',
                    color: e.impact === 'Bullish' ? T.emerald : e.impact === 'Neutral' ? T.gray : '#1d4ed8' }}>
                    {e.impact}
                  </span>
                </div>
              ))}
            </Section>
            <Section title="Market Stability Reserve (MSR) Trigger Analysis">
              {[
                { metric: 'Total Supply TNAC', value: '2.1B allowances', status: 'Above Upper Threshold', bull: false },
                { metric: 'MSR Intake Rate', value: '24% of TNAC/yr', status: 'Active withdrawal', bull: true },
                { metric: 'Backloaded Allowances', value: '400M cancelled', status: 'Permanent cancellation', bull: true },
                { metric: 'REPowerEU Frontloading', value: '250M extra to market', status: 'Neutral to bearish', bull: false },
                { metric: 'Innovation Fund supply', value: '530M over 2020–30', status: 'Ongoing', bull: false },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f0ece4' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{m.metric}</div>
                    <div style={{ fontSize: 11, color: T.gray }}>{m.value}</div>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: m.bull ? '#d1fae5' : '#fef2f2', color: m.bull ? T.emerald : T.red }}>
                    {m.status}
                  </span>
                </div>
              ))}
            </Section>
          </div>
        </>
      )}

      {tab === 'Forward Curve' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Market</div>
              <select value={market} onChange={e => setMarket(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                {ETS_MARKETS.slice(0, 4).map(m => <option key={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Spot (2024)" value={`${selectedMarket.currency}${selectedMarket.price}/t`} sub="Current settlement" color={selectedMarket.color} />
            <Kpi label="2030 Baseline Fwd" value={`€${FORWARD_SCENARIOS.find(d => d.year === '2030')?.baseline}/t`} sub="Base scenario" color={T.teal} />
            <Kpi label="2030 Accelerated" value={`€${FORWARD_SCENARIOS.find(d => d.year === '2030')?.accelerated}/t`} sub="Policy acceleration" color={T.emerald} />
            <Kpi label="2050 Baseline" value={`€${FORWARD_SCENARIOS.find(d => d.year === '2050')?.baseline}/t`} sub="Long-run equilibrium" color={T.orange} />
          </div>

          <Section title="EU ETS Forward Curve — Scenario Paths (2024–2050)" badge="€/tCO₂e">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={FORWARD_SCENARIOS} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
                <YAxis tickFormatter={v => `€${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `€${v}/t`} />
                <ReferenceLine x="2030" stroke={T.gold} strokeDasharray="4 4" label={{ value: '2030', fill: T.gold, fontSize: 11 }} />
                <Line dataKey="baseline"     name="Baseline"          stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line dataKey="accelerated"  name="Policy Accelerated" stroke={T.emerald} strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="6 3" />
                <Line dataKey="delayed"      name="Policy Delayed"     stroke={T.orange}  strokeWidth={2}   dot={{ r: 4 }} strokeDasharray="4 2" />
                <Line dataKey="ncb_forecast" name="NCB Consensus"      stroke={T.purple}  strokeWidth={2}   dot={{ r: 4 }} strokeDasharray="3 1" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Forward Prices by Scenario (€/tCO₂e)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Year', 'Baseline', 'Policy Accelerated', 'Policy Delayed', 'NCB Consensus', 'Range Width'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORWARD_SCENARIOS.map((d, i) => (
                  <tr key={d.year} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.gold }}>{d.year}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#1d4ed8' }}>€{d.baseline}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.emerald }}>€{d.accelerated}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>€{d.delayed}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.purple }}>€{d.ncb_forecast}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.gray }}>€{d.accelerated - d.delayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'VCM Scenario Paths' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="VCM Spot (Avg)" value="~$5–8/t" sub="Nature-based credits, 2024" color={T.emerald} />
            <Kpi label="NGFS NZE 2030" value="$60/t" sub="Net zero pathway" color={T.teal} />
            <Kpi label="NGFS NZE 2050" value="$200/t" sub="Long-run equilibrium" color={T.orange} />
            <Kpi label="Current Policy 2050" value="$22/t" sub="Delayed action path" color={T.gray} />
          </div>

          <Section title="VCM Carbon Price Scenarios (NGFS × IEA, 2024–2040)" badge="$/tCO₂e">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={VCM_PRICE_DATA} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `$${v}/t`} />
                <ReferenceLine x={2030} stroke={T.gold} strokeDasharray="4 4" label={{ value: '2030 NDC deadline', fill: T.gold, fontSize: 10 }} />
                {SCENARIOS_VCM.map(s => (
                  <Line key={s.name} dataKey={s.name} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r: 4, fill: s.color }} />
                ))}
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Price Scenario Comparison Table ($/tCO₂e)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>Year</th>
                  {SCENARIOS_VCM.map(s => (
                    <th key={s.name} style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: s.color }}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VCM_PRICE_DATA.map((d, i) => (
                  <tr key={d.year} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.gold }}>{d.year}</td>
                    {SCENARIOS_VCM.map(s => (
                      <td key={s.name} style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: s.color }}>${d[s.name]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Cap Reduction Schedule' && (
        <>
          <Section title="Annual Cap Reduction Schedule — EU ETS, California, RGGI (MtCO₂e)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={CAP_SCHEDULE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                <Line dataKey="euets" name="EU ETS" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 5 }} />
                <Line dataKey="ca"    name="California" stroke={T.teal} strokeWidth={2.5} dot={{ r: 5 }} strokeDasharray="6 3" />
                <Line dataKey="rggi"  name="RGGI"       stroke={T.emerald} strokeWidth={2} dot={{ r: 5 }} strokeDasharray="4 2" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Trading Volume & Open Interest by Market">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Market', 'Daily Volume (MtCO₂e)', 'Open Interest (MtCO₂e)', 'Futures OI (MtCO₂e)'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRADING_DATA.map((d, i) => (
                  <tr key={d.market} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: ETS_MARKETS[i].color }}>{d.market}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{d.daily_vol}M</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.teal }}>{d.open_int}M</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.gold }}>{d.futures}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}
    </div>
  );
}
