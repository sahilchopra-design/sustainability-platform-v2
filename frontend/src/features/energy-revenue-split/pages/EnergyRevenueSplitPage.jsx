import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const REVENUE_TREND = [
  { year: 2020, legacy: 78.2, renewable: 3.8, green_pct: 4.6 },
  { year: 2021, legacy: 92.5, renewable: 5.2, green_pct: 5.3 },
  { year: 2022, legacy: 128.4, renewable: 7.1, green_pct: 5.2 },
  { year: 2023, legacy: 112.8, renewable: 9.8, green_pct: 8.0 },
  { year: 2024, legacy: 105.2, renewable: 12.4, green_pct: 10.6 },
  { year: 2025, legacy: 102.1, renewable: 15.4, green_pct: 13.1 },
];

const CAPEX_TREND = [
  { year: 2020, legacy_capex: 18.5, green_capex: 2.1, green_pct: 10.2 },
  { year: 2021, legacy_capex: 20.2, green_capex: 3.4, green_pct: 14.4 },
  { year: 2022, legacy_capex: 22.8, green_capex: 5.2, green_pct: 18.6 },
  { year: 2023, legacy_capex: 21.5, green_capex: 7.8, green_pct: 26.6 },
  { year: 2024, legacy_capex: 19.8, green_capex: 10.2, green_pct: 34.0 },
  { year: 2025, legacy_capex: 18.1, green_capex: 12.9, green_pct: 41.6 },
];

const IEA_NZE_CAPEX_PCT = 50; // IEA NZE requires 50%+ green capex by 2030

const PEERS = [
  { name: 'Shell', green_rev_pct: 14.2, green_capex_pct: 38.5, ci_tco2_gwh: 290, itr: 2.1 },
  { name: 'BP', green_rev_pct: 11.8, green_capex_pct: 42.0, ci_tco2_gwh: 310, itr: 2.3 },
  { name: 'TotalEnergies', green_rev_pct: 16.5, green_capex_pct: 45.2, ci_tco2_gwh: 265, itr: 1.9 },
  { name: 'Equinor', green_rev_pct: 18.2, green_capex_pct: 50.8, ci_tco2_gwh: 240, itr: 1.8 },
  { name: 'Eni', green_rev_pct: 9.5, green_capex_pct: 32.1, ci_tco2_gwh: 340, itr: 2.5 },
  { name: 'Demo Co (Us)', green_rev_pct: 13.1, green_capex_pct: 41.6, ci_tco2_gwh: 305, itr: 2.2 },
];

const PROJECTION_2030 = [
  { year: 2025, legacy_rev: 102.1, renew_rev: 15.4, green_pct: 13.1 },
  { year: 2026, legacy_rev: 98.5, renew_rev: 19.2, green_pct: 16.3 },
  { year: 2027, legacy_rev: 94.2, renew_rev: 24.0, green_pct: 20.3 },
  { year: 2028, legacy_rev: 89.5, renew_rev: 30.0, green_pct: 25.1 },
  { year: 2029, legacy_rev: 84.2, renew_rev: 37.5, green_pct: 30.8 },
  { year: 2030, legacy_rev: 78.5, renew_rev: 46.9, green_pct: 37.4 },
];

const TABS = ['Revenue Trend','CapEx Allocation','Green Revenue Ratio','CapEx Alignment','Peer Comparison','2030 Projection'];

export default function EnergyRevenueSplitPage() {
  const [tab, setTab] = useState(0);
  const [showTarget, setShowTarget] = useState(true);
  const [projScenario, setProjScenario] = useState('base');

  const projData = useMemo(() => {
    if (projScenario === 'base') return PROJECTION_2030;
    const mult = projScenario === 'accelerated' ? 1.3 : 0.7;
    return PROJECTION_2030.map(d => ({
      ...d,
      renew_rev: +(d.renew_rev * mult).toFixed(1),
      green_pct: +((d.renew_rev * mult) / (d.legacy_rev + d.renew_rev * mult) * 100).toFixed(1),
    }));
  }, [projScenario]);

  const latestGreenRev = REVENUE_TREND[REVENUE_TREND.length - 1].green_pct;
  const latestGreenCapex = CAPEX_TREND[CAPEX_TREND.length - 1].green_pct;

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
        <span style={{ background: T.navy, color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CU4</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Revenue & CapEx Decomposition</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Legacy vs renewable revenue/CapEx split with IEA NZE alignment tracking and peer comparison.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: IEA NZE 2023 | Company filings</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Green Revenue Ratio', `${latestGreenRev}%`, '+8.5pp since 2020', latestGreenRev > 15 ? T.green : T.amber)}
        {card('Green CapEx %', `${latestGreenCapex}%`, `IEA NZE 2030: ${IEA_NZE_CAPEX_PCT}%`, latestGreenCapex > 40 ? T.green : T.amber)}
        {card('Total Revenue', `$${(REVENUE_TREND[5].legacy + REVENUE_TREND[5].renewable).toFixed(1)}B`, '2025 estimate')}
        {card('Total CapEx', `$${(CAPEX_TREND[5].legacy_capex + CAPEX_TREND[5].green_capex).toFixed(1)}B`, '2025 estimate')}
        {card('2030 Green Rev (proj)', `${projData[projData.length - 1].green_pct}%`, 'Current trajectory', T.sage)}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Revenue Split: Legacy vs Renewable ($B)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={REVENUE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}B`]} />
              <Legend />
              <Bar dataKey="legacy" stackId="a" fill={T.textSec} name="Legacy Revenue" />
              <Bar dataKey="renewable" stackId="a" fill={T.green} name="Renewable Revenue" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>CapEx Allocation: Legacy vs Green ($B)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={CAPEX_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}B`]} />
              <Legend />
              <Bar dataKey="legacy_capex" stackId="a" fill={T.textMut} name="Legacy CapEx" />
              <Bar dataKey="green_capex" stackId="a" fill={T.green} name="Green CapEx" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>IEA NZE alignment:</strong> Green CapEx is {latestGreenCapex}% of total vs {IEA_NZE_CAPEX_PCT}% target by 2030. Gap: {(IEA_NZE_CAPEX_PCT - latestGreenCapex).toFixed(1)}pp.
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Green Revenue Ratio Trajectory</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={REVENUE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 20]} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <Line type="monotone" dataKey="green_pct" stroke={T.green} strokeWidth={3} dot={{ r: 5 }} name="Green Revenue %" />
              {showTarget && <ReferenceLine y={15} stroke={T.gold} strokeDasharray="5 5" label={{ value: 'Target 15%', fontSize: 11, fill: T.gold }} />}
            </LineChart>
          </ResponsiveContainer>
          <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <input type="checkbox" checked={showTarget} onChange={e => setShowTarget(e.target.checked)} />
            Show 2025 target line (15%)
          </label>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>CapEx Alignment vs IEA NZE</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={CAPEX_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 60]} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <Area type="monotone" dataKey="green_pct" fill={T.green} stroke={T.green} fillOpacity={0.3} name="Green CapEx %" strokeWidth={2} />
              <ReferenceLine y={IEA_NZE_CAPEX_PCT} stroke={T.red} strokeDasharray="5 5" label={{ value: `IEA NZE ${IEA_NZE_CAPEX_PCT}%`, fontSize: 11, fill: T.red }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: latestGreenCapex >= IEA_NZE_CAPEX_PCT ? '#f0fdf4' : '#fef2f2', borderRadius: 8, fontSize: 12, color: latestGreenCapex >= IEA_NZE_CAPEX_PCT ? T.green : T.red }}>
            {latestGreenCapex >= IEA_NZE_CAPEX_PCT
              ? 'On track: Green CapEx exceeds IEA NZE 2030 requirement.'
              : `Gap: ${(IEA_NZE_CAPEX_PCT - latestGreenCapex).toFixed(1)}pp below IEA NZE 2030 requirement. Need ~${((IEA_NZE_CAPEX_PCT - latestGreenCapex) / 5).toFixed(1)}pp/year acceleration.`}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Peer Comparison: Energy Majors</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Company','Green Rev %','Green CapEx %','CI tCO2/GWh','ITR (C)','Rating'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Company' ? 'left' : 'right', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {PEERS.sort((a,b) => b.green_capex_pct - a.green_capex_pct).map(p => (
                <tr key={p.name} style={{ borderBottom: `1px solid ${T.border}`, background: p.name.includes('Demo') ? '#fffff5' : 'transparent' }}>
                  <td style={{ padding: '6px 10px', fontWeight: p.name.includes('Demo') ? 800 : 500 }}>{p.name}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{p.green_rev_pct}%</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{p.green_capex_pct}%</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{p.ci_tco2_gwh}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{p.itr}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: p.itr <= 2.0 ? '#f0fdf4' : p.itr <= 2.3 ? '#fffbeb' : '#fef2f2', color: p.itr <= 2.0 ? T.green : p.itr <= 2.3 ? T.amber : T.red }}>
                      {p.itr <= 2.0 ? 'LEADER' : p.itr <= 2.3 ? 'MODERATE' : 'LAGGARD'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PEERS} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 55]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={95} />
              <Tooltip />
              <Legend />
              <Bar dataKey="green_rev_pct" fill={T.green} name="Green Rev %" />
              <Bar dataKey="green_capex_pct" fill={T.blue} name="Green CapEx %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>2030 Revenue Mix Projection</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Scenario:</label>
            {['slow','base','accelerated'].map(s => (
              <button key={s} onClick={() => setProjScenario(s)} style={{
                padding: '5px 14px', borderRadius: 6, border: `1px solid ${projScenario === s ? T.navy : T.border}`,
                background: projScenario === s ? T.navy : T.surface, color: projScenario === s ? '#fff' : T.textSec,
                cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize'
              }}>{s}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={projData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}B`]} />
              <Legend />
              <Area type="monotone" dataKey="legacy_rev" stackId="1" fill={T.textMut} stroke={T.textSec} name="Legacy Revenue ($B)" fillOpacity={0.5} />
              <Area type="monotone" dataKey="renew_rev" stackId="1" fill={T.green} stroke={T.green} name="Renewable Revenue ($B)" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Projection ({projScenario}):</strong> By 2030, green revenue reaches {projData[projData.length - 1].green_pct}% of total ($
            {projData[projData.length - 1].renew_rev}B). {projScenario === 'accelerated' ? 'Accelerated investment doubles clean energy capacity.' : projScenario === 'slow' ? 'Slow transition risks stranded assets and regulatory penalty.' : 'Base case assumes current CapEx trajectory continues.'}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> IEA NZE 2023 | Company annual reports | Bloomberg NEF | TPI benchmarks.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CU4 v1.0 | Revenue Split</span>
      </div>
    </div>
  );
}
