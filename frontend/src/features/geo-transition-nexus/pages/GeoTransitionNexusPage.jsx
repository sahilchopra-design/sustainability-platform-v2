import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const COUNTRIES = [
  { name:'USA', transition:62, geopolitical:72, fossil_rev_pct:8, portfolio_exp:22.5 },
  { name:'China', transition:45, geopolitical:34, fossil_rev_pct:15, portfolio_exp:18.2 },
  { name:'India', transition:38, geopolitical:44, fossil_rev_pct:12, portfolio_exp:5.1 },
  { name:'Russia', transition:18, geopolitical:12, fossil_rev_pct:48, portfolio_exp:0.15 },
  { name:'Saudi Arabia', transition:25, geopolitical:49, fossil_rev_pct:62, portfolio_exp:8.2 },
  { name:'UAE', transition:42, geopolitical:71, fossil_rev_pct:30, portfolio_exp:6.8 },
  { name:'Brazil', transition:55, geopolitical:42, fossil_rev_pct:10, portfolio_exp:3.8 },
  { name:'Germany', transition:78, geopolitical:86, fossil_rev_pct:2, portfolio_exp:4.5 },
  { name:'UK', transition:75, geopolitical:82, fossil_rev_pct:3, portfolio_exp:8.2 },
  { name:'Japan', transition:65, geopolitical:84, fossil_rev_pct:1, portfolio_exp:6.4 },
  { name:'Australia', transition:58, geopolitical:86, fossil_rev_pct:14, portfolio_exp:4.8 },
  { name:'Canada', transition:60, geopolitical:88, fossil_rev_pct:12, portfolio_exp:5.2 },
  { name:'South Africa', transition:32, geopolitical:42, fossil_rev_pct:18, portfolio_exp:2.2 },
  { name:'Nigeria', transition:15, geopolitical:15, fossil_rev_pct:85, portfolio_exp:0.8 },
  { name:'Indonesia', transition:35, geopolitical:45, fossil_rev_pct:22, portfolio_exp:2.1 },
  { name:'Mexico', transition:40, geopolitical:33, fossil_rev_pct:15, portfolio_exp:1.5 },
  { name:'Norway', transition:82, geopolitical:94, fossil_rev_pct:42, portfolio_exp:3.2 },
  { name:'Venezuela', transition:5, geopolitical:4, fossil_rev_pct:95, portfolio_exp:0 },
  { name:'Iran', transition:8, geopolitical:10, fossil_rev_pct:72, portfolio_exp:0 },
  { name:'Colombia', transition:42, geopolitical:37, fossil_rev_pct:20, portfolio_exp:0.5 },
  { name:'Chile', transition:65, geopolitical:74, fossil_rev_pct:1, portfolio_exp:1.2 },
  { name:'Poland', transition:45, geopolitical:63, fossil_rev_pct:5, portfolio_exp:0.8 },
  { name:'Turkey', transition:38, geopolitical:32, fossil_rev_pct:3, portfolio_exp:0.6 },
  { name:'Kazakhstan', transition:22, geopolitical:35, fossil_rev_pct:55, portfolio_exp:0.3 },
  { name:'Algeria', transition:12, geopolitical:22, fossil_rev_pct:60, portfolio_exp:0.1 },
];

const FOSSIL_STATES = COUNTRIES.filter(c => c.fossil_rev_pct > 30).sort((a, b) => b.fossil_rev_pct - a.fossil_rev_pct);

const POLICY_REVERSALS = [
  { country:'USA', scenario:'Admin change reverses IRA subsidies', probability:30, impact:'Global clean energy CapEx -15%', transition_delta:-8 },
  { country:'Australia', scenario:'New government weakens safeguard mechanism', probability:20, impact:'Mining sector emissions uncapped', transition_delta:-5 },
  { country:'Brazil', scenario:'Weakened Amazon deforestation enforcement', probability:25, impact:'REDD+ credit supply uncertainty', transition_delta:-4 },
  { country:'India', scenario:'Coal dependency extended beyond 2035', probability:40, impact:'Global emission pathway +0.2C', transition_delta:-6 },
  { country:'UK', scenario:'Net Zero 2050 target diluted', probability:15, impact:'Finance sector credibility hit', transition_delta:-3 },
  { country:'Germany', scenario:'Nuclear phase-out reversal (unlikely)', probability:5, impact:'Energy mix reshuffling', transition_delta:+2 },
];

const TABS = ['Combined Score Matrix','Correlation Analysis','Scenario What-If','Portfolio Overlay','Fossil State Risk','Climate Policy Reversal'];

export default function GeoTransitionNexusPage() {
  const [tab, setTab] = useState(0);
  const [geoWeight, setGeoWeight] = useState(15);
  const [selectedScenario, setSelectedScenario] = useState(0);

  const combined = useMemo(() =>
    COUNTRIES.map(c => {
      const w = geoWeight / 100;
      const score = Math.round((1 - w) * c.transition + w * (100 - c.geopolitical));
      return { ...c, combined: Math.max(0, Math.min(100, score)) };
    }).sort((a, b) => b.combined - a.combined),
    [geoWeight]
  );

  const highBothRisk = combined.filter(c => c.transition < 40 && c.geopolitical < 40);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 155px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const riskColor = s => s >= 60 ? T.green : s >= 40 ? T.amber : T.red;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: '#7c2d12', color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CV5</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Geopolitical-Transition Risk Nexus</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Combined transition + geopolitical risk scoring with fossil state analysis and climate policy reversal scenarios.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: IEA | World Bank WGI | TPI | NGFS</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Countries', combined.length, '25 with combined scoring')}
        {card('Dual High-Risk', highBothRisk.length, 'Low transition + low geopolitical', T.red)}
        {card('Fossil States', FOSSIL_STATES.length, 'Fossil revenue > 30%', T.orange)}
        {card('Geo Weight', `${geoWeight}%`, `Transition: ${100 - geoWeight}%`)}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: T.textSec }}>Geopolitical weight (w):</label>
        <input type="range" min={5} max={50} value={geoWeight} onChange={e => setGeoWeight(+e.target.value)} style={{ width: 200 }} />
        <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{geoWeight}%</span>
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
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Combined Score Rankings (Higher = Better)</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
            Combined = (1 - w) x Transition + w x (100 - GeoRisk). w = {geoWeight}%.
          </p>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={combined} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={95} />
              <Tooltip formatter={v => [`${v}/100`]} />
              <ReferenceLine x={50} stroke={T.amber} strokeDasharray="5 5" />
              <Bar dataKey="combined" radius={[0,4,4,0]}>
                {combined.map(c => <Cell key={c.name} fill={riskColor(c.combined)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Transition Score vs Geopolitical Score</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="transition" name="Transition Score" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Transition Score', position: 'bottom', fontSize: 11 }} />
              <YAxis dataKey="geopolitical" name="Geopolitical Score" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Geopolitical Score', angle: -90, position: 'left', fontSize: 11 }} />
              <ZAxis dataKey="portfolio_exp" range={[30, 200]} name="Portfolio %" />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: 10, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div>Transition: {d.transition} | Geopolitical: {d.geopolitical}</div>
                  <div>Fossil Rev: {d.fossil_rev_pct}% | Portfolio: {d.portfolio_exp}%</div>
                </div>);
              }} />
              <ReferenceLine x={40} stroke={T.red} strokeDasharray="5 5" />
              <ReferenceLine y={40} stroke={T.red} strokeDasharray="5 5" />
              <Scatter data={COUNTRIES}>
                {COUNTRIES.map(c => <Cell key={c.name} fill={c.transition < 40 && c.geopolitical < 40 ? T.red : c.transition < 40 || c.geopolitical < 40 ? T.amber : T.green} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
            <strong>Dual high-risk (bottom-left quadrant):</strong> {highBothRisk.map(c => c.name).join(', ')}. These countries have both low transition readiness and high geopolitical risk.
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Scenario What-If: Adjust Geopolitical Weight</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>See how changing the geopolitical weight (w) reshuffles country rankings. Current w = {geoWeight}%.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[5, 15, 25, 35, 50].map(w => (
              <button key={w} onClick={() => setGeoWeight(w)} style={{
                padding: '5px 14px', borderRadius: 6, border: `1px solid ${geoWeight === w ? T.navy : T.border}`,
                background: geoWeight === w ? T.navy : T.surface, color: geoWeight === w ? '#fff' : T.textSec, cursor: 'pointer', fontSize: 12
              }}>w={w}%</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h4 style={{ color: T.green, fontSize: 12, marginBottom: 6 }}>TOP 10 (Best Combined)</h4>
              {combined.slice(0, 10).map((c, i) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span>{i + 1}. {c.name}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: riskColor(c.combined) }}>{c.combined}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: T.red, fontSize: 12, marginBottom: 6 }}>BOTTOM 10 (Worst Combined)</h4>
              {combined.slice(-10).reverse().map((c, i) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span>{combined.length - i}. {c.name}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: riskColor(c.combined) }}>{c.combined}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Portfolio Overlay: Combined Score x Portfolio Exposure</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Country','Combined Score','Portfolio %','Weighted Risk','Assessment'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Country' ? 'left' : 'right', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {combined.filter(c => c.portfolio_exp > 0).sort((a,b) => (b.portfolio_exp * (100 - b.combined)) - (a.portfolio_exp * (100 - a.combined))).map(c => {
                const wRisk = +(c.portfolio_exp * (100 - c.combined) / 100).toFixed(2);
                return (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono, color: riskColor(c.combined) }}>{c.combined}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{c.portfolio_exp}%</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: wRisk > 5 ? T.red : wRisk > 2 ? T.amber : T.green }}>{wRisk}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: wRisk > 5 ? T.red : wRisk > 2 ? T.amber : T.green }}>{wRisk > 5 ? 'REDUCE' : wRisk > 2 ? 'MONITOR' : 'MAINTAIN'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Fossil State Risk: Revenue Dependency + Instability = Stranded State Risk</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={FOSSIL_STATES}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="fossil_rev_pct" fill={T.red} name="Fossil Revenue %" radius={[4,4,0,0]} />
              <Bar dataKey="geopolitical" fill={T.blue} name="Geopolitical Score" radius={[4,4,0,0]} />
              <Bar dataKey="transition" fill={T.green} name="Transition Score" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
            <strong>Stranded state risk:</strong> Countries with fossil revenue &gt;50% AND geopolitical score &lt;50 face existential fiscal risk under transition scenarios. {FOSSIL_STATES.filter(c => c.fossil_rev_pct > 50 && c.geopolitical < 50).map(c => c.name).join(', ')} are most vulnerable.
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Climate Policy Reversal Scenarios</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {POLICY_REVERSALS.map((pr, i) => (
              <button key={i} onClick={() => setSelectedScenario(i)} style={{
                padding: '6px 14px', borderRadius: 6, border: `1px solid ${selectedScenario === i ? T.navy : T.border}`,
                background: selectedScenario === i ? T.navy : T.surface, color: selectedScenario === i ? '#fff' : T.textSec, cursor: 'pointer', fontSize: 12
              }}>{pr.country}</button>
            ))}
          </div>
          <div style={{ padding: 16, border: `2px solid ${T.border}`, borderRadius: 10, background: T.bg }}>
            <h4 style={{ color: T.navy, margin: '0 0 12px' }}>{POLICY_REVERSALS[selectedScenario].country}: {POLICY_REVERSALS[selectedScenario].scenario}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 12 }}>
              <div><span style={{ color: T.textMut }}>Probability:</span> <strong>{POLICY_REVERSALS[selectedScenario].probability}%</strong></div>
              <div><span style={{ color: T.textMut }}>Transition Score Delta:</span> <strong style={{ color: POLICY_REVERSALS[selectedScenario].transition_delta < 0 ? T.red : T.green }}>{POLICY_REVERSALS[selectedScenario].transition_delta > 0 ? '+' : ''}{POLICY_REVERSALS[selectedScenario].transition_delta}</strong></div>
              <div style={{ gridColumn: 'span 2' }}><span style={{ color: T.textMut }}>Impact:</span> <strong>{POLICY_REVERSALS[selectedScenario].impact}</strong></div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={POLICY_REVERSALS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="probability" fill={T.amber} name="Probability %" radius={[4,4,0,0]} />
                <Bar dataKey={d => Math.abs(d.transition_delta)} fill={T.red} name="Score Impact (abs)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> IEA WEO 2025 | World Bank WGI | TPI State of Transition | NGFS Scenarios v4 | Country fiscal data.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CV5 v1.0 | Geo-Transition Nexus</span>
      </div>
    </div>
  );
}
