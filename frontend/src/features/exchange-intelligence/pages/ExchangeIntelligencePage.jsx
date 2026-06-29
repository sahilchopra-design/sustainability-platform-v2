import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#334155', border: '#334155', borderL: '#475569',
  navy: '#3b82f6', navyL: '#93c5fd', gold: '#f59e0b', goldL: '#fcd34d',
  sage: '#10b981', sageL: '#6ee7b7', teal: '#14b8a6', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#ef4444', green: '#22c55e',
  amber: '#f59e0b', font: 'Inter,sans-serif', mono: 'JetBrains Mono,monospace'
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const EXCHANGES = [
  { id: 'nyse', name: 'NYSE', country: 'USA', region: 'Americas', marketCap: 26800, listed: 2330, esgRequired: true, stewardshipCode: true, disclosureRate: 94, esgScore: 88, climateScore: 91, socialScore: 82, govScore: 92, sustainabilityIndex: true, greenBonds: 1420, tcfdAdopters: 87 },
  { id: 'nasdaq', name: 'Nasdaq', country: 'USA', region: 'Americas', marketCap: 24100, listed: 3300, esgRequired: true, stewardshipCode: true, disclosureRate: 92, esgScore: 87, climateScore: 90, socialScore: 80, govScore: 91, sustainabilityIndex: true, greenBonds: 1180, tcfdAdopters: 84 },
  { id: 'lse', name: 'LSE', country: 'UK', region: 'Europe', marketCap: 3900, listed: 1100, esgRequired: true, stewardshipCode: true, disclosureRate: 96, esgScore: 91, climateScore: 94, socialScore: 86, govScore: 94, sustainabilityIndex: true, greenBonds: 690, tcfdAdopters: 92 },
  { id: 'euronext', name: 'Euronext', country: 'EU', region: 'Europe', marketCap: 6800, listed: 1800, esgRequired: true, stewardshipCode: true, disclosureRate: 95, esgScore: 90, climateScore: 93, socialScore: 88, govScore: 90, sustainabilityIndex: true, greenBonds: 820, tcfdAdopters: 89 },
  { id: 'deutsche', name: 'Deutsche Börse', country: 'Germany', region: 'Europe', marketCap: 2100, listed: 720, esgRequired: true, stewardshipCode: true, disclosureRate: 94, esgScore: 89, climateScore: 92, socialScore: 85, govScore: 91, sustainabilityIndex: true, greenBonds: 510, tcfdAdopters: 88 },
  { id: 'jpx', name: 'JPX / TSE', country: 'Japan', region: 'Asia-Pacific', marketCap: 6400, listed: 3800, esgRequired: true, stewardshipCode: true, disclosureRate: 89, esgScore: 85, climateScore: 88, socialScore: 80, govScore: 88, sustainabilityIndex: true, greenBonds: 440, tcfdAdopters: 91 },
  { id: 'hkex', name: 'HKEX', country: 'HK', region: 'Asia-Pacific', marketCap: 4200, listed: 2600, esgRequired: true, stewardshipCode: false, disclosureRate: 82, esgScore: 80, climateScore: 82, socialScore: 75, govScore: 84, sustainabilityIndex: false, greenBonds: 280, tcfdAdopters: 68 },
  { id: 'sse', name: 'Shanghai SE', country: 'China', region: 'Asia-Pacific', marketCap: 7200, listed: 2200, esgRequired: false, stewardshipCode: false, disclosureRate: 62, esgScore: 64, climateScore: 66, socialScore: 58, govScore: 68, sustainabilityIndex: false, greenBonds: 920, tcfdAdopters: 38 },
  { id: 'szse', name: 'Shenzhen SE', country: 'China', region: 'Asia-Pacific', marketCap: 4800, listed: 2800, esgRequired: false, stewardshipCode: false, disclosureRate: 58, esgScore: 62, climateScore: 64, socialScore: 56, govScore: 66, sustainabilityIndex: false, greenBonds: 680, tcfdAdopters: 32 },
  { id: 'bse', name: 'BSE India', country: 'India', region: 'Asia-Pacific', marketCap: 3800, listed: 5200, esgRequired: false, stewardshipCode: false, disclosureRate: 68, esgScore: 70, climateScore: 68, socialScore: 65, govScore: 78, sustainabilityIndex: true, greenBonds: 38, tcfdAdopters: 44 },
  { id: 'nse', name: 'NSE India', country: 'India', region: 'Asia-Pacific', marketCap: 3600, listed: 2100, esgRequired: false, stewardshipCode: false, disclosureRate: 70, esgScore: 72, climateScore: 70, socialScore: 68, govScore: 79, sustainabilityIndex: true, greenBonds: 42, tcfdAdopters: 46 },
  { id: 'tsx', name: 'TSX', country: 'Canada', region: 'Americas', marketCap: 3200, listed: 1500, esgRequired: false, stewardshipCode: true, disclosureRate: 88, esgScore: 84, climateScore: 86, socialScore: 79, govScore: 88, sustainabilityIndex: true, greenBonds: 310, tcfdAdopters: 78 },
  { id: 'asx', name: 'ASX', country: 'Australia', region: 'Asia-Pacific', marketCap: 1800, listed: 2200, esgRequired: false, stewardshipCode: true, disclosureRate: 85, esgScore: 82, climateScore: 84, socialScore: 77, govScore: 86, sustainabilityIndex: true, greenBonds: 190, tcfdAdopters: 72 },
  { id: 'sgx', name: 'SGX', country: 'Singapore', region: 'Asia-Pacific', marketCap: 720, listed: 650, esgRequired: true, stewardshipCode: true, disclosureRate: 91, esgScore: 88, climateScore: 90, socialScore: 84, govScore: 90, sustainabilityIndex: true, greenBonds: 98, tcfdAdopters: 85 },
  { id: 'b3', name: 'B3 Brazil', country: 'Brazil', region: 'Americas', marketCap: 1100, listed: 460, esgRequired: false, stewardshipCode: false, disclosureRate: 72, esgScore: 74, climateScore: 70, socialScore: 72, govScore: 80, sustainabilityIndex: true, greenBonds: 82, tcfdAdopters: 54 },
];

const LISTING_STANDARDS = [
  { exchange: 'LSE', standard: 'UK Listing Rules', esgMandatory: true, climateRisk: true, tcfdMandatory: true, scope3: false, boardDiversity: true, remuneration: true, tier: 'Premium', year: 2021 },
  { exchange: 'NYSE/Nasdaq', standard: 'SEC Climate Rules', esgMandatory: true, climateRisk: true, tcfdMandatory: false, scope3: false, boardDiversity: true, remuneration: true, tier: 'Proposed', year: 2024 },
  { exchange: 'Euronext', standard: 'CSRD + ESRS', esgMandatory: true, climateRisk: true, tcfdMandatory: false, scope3: true, boardDiversity: true, remuneration: true, tier: 'Mandatory', year: 2024 },
  { exchange: 'JPX', standard: 'Prime Market ESG', esgMandatory: true, climateRisk: true, tcfdMandatory: true, scope3: false, boardDiversity: false, remuneration: true, tier: 'Prime Only', year: 2022 },
  { exchange: 'HKEX', standard: 'ESG Reporting Guide', esgMandatory: true, climateRisk: true, tcfdMandatory: false, scope3: false, boardDiversity: false, remuneration: false, tier: 'Comply-or-Explain', year: 2020 },
  { exchange: 'SGX', standard: 'SGX ESG Requirements', esgMandatory: true, climateRisk: true, tcfdMandatory: true, scope3: false, boardDiversity: true, remuneration: false, tier: 'Mandatory', year: 2022 },
  { exchange: 'ASX', standard: 'ASX Principles', esgMandatory: false, climateRisk: true, tcfdMandatory: false, scope3: false, boardDiversity: true, remuneration: true, tier: 'Recommend', year: 2023 },
  { exchange: 'BSE/NSE', standard: 'SEBI BRSR', esgMandatory: true, climateRisk: false, tcfdMandatory: false, scope3: false, boardDiversity: false, remuneration: false, tier: 'Top 1000', year: 2022 },
];

const ESG_TREND = ['2019','2020','2021','2022','2023','2024','2025'].map((yr, i) => ({
  year: yr,
  'NYSE': 68 + i * 4 + sr(i) * 3,
  'LSE': 74 + i * 3.5 + sr(i + 7) * 2,
  'JPX': 60 + i * 5 + sr(i + 14) * 3,
  'Euronext': 72 + i * 3.8 + sr(i + 21) * 2.5,
  'HKEX': 56 + i * 4.2 + sr(i + 28) * 3,
  'SSE': 42 + i * 3.5 + sr(i + 35) * 4,
}));

const STEWARDSHIP_DATA = EXCHANGES.map(e => ({
  name: e.name, esgScore: e.esgScore, disclosureRate: e.disclosureRate, tcfdAdopters: e.tcfdAdopters, greenBonds: e.greenBonds,
}));

const TABS = ['Overview', 'Exchange Profiles', 'Listing Standards', 'ESG Disclosure Rates', 'Stewardship', 'Green Finance', 'Comparatives'];

export default function ExchangeIntelligencePage() {
  const [tab, setTab] = useState('Overview');
  const [regionFilter, setRegionFilter] = useState('All');
  const [selectedExchange, setSelectedExchange] = useState(null);

  const regions = ['All', 'Americas', 'Europe', 'Asia-Pacific'];

  const filtered = useMemo(() =>
    regionFilter === 'All' ? EXCHANGES : EXCHANGES.filter(e => e.region === regionFilter),
    [regionFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length > 0 ? filtered.length : 1;
    return {
      avgEsg: (filtered.reduce((s, e) => s + e.esgScore, 0) / n).toFixed(1),
      avgDisc: (filtered.reduce((s, e) => s + e.disclosureRate, 0) / n).toFixed(1),
      mandatory: filtered.filter(e => e.esgRequired).length,
      totalGreenBonds: filtered.reduce((s, e) => s + e.greenBonds, 0).toLocaleString(),
      avgTcfd: (filtered.reduce((s, e) => s + e.tcfdAdopters, 0) / n).toFixed(1),
    };
  }, [filtered]);

  const tabBar = { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 };
  const tabBtn = (t) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none',
    background: tab === t ? T.navy : T.surfaceH, color: tab === t ? '#fff' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });

  const scoreColor = (v) => v >= 85 ? T.green : v >= 70 ? T.amber : T.red;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Exchange ESG Intelligence</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Global stock exchange ESG disclosure, listing standards & stewardship quality — EP-DH4</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: T.textSec }}>Region:</span>
        {regions.map(r => (
          <button key={r} onClick={() => setRegionFilter(r)} style={{ ...tabBtn(r), background: regionFilter === r ? T.teal : T.surfaceH, color: regionFilter === r ? '#fff' : T.textSec }}>{r}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg ESG Score" value={kpis.avgEsg} sub="out of 100" color={T.green} />
        <KpiCard label="Avg Disclosure Rate" value={`${kpis.avgDisc}%`} sub="ESG reports filed" color={T.navy} />
        <KpiCard label="Mandatory ESG" value={kpis.mandatory} sub={`of ${filtered.length} exchanges`} color={T.teal} />
        <KpiCard label="Green Bonds Listed" value={kpis.totalGreenBonds} sub="total listings" color={T.gold} />
        <KpiCard label="Avg TCFD Adoption" value={`${kpis.avgTcfd}%`} sub="among listed cos" color={T.sage} />
      </div>

      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ESG Score by Exchange</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.esgScore - a.esgScore)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="esgScore" fill={T.navy} name="ESG Score" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Disclosure Rate vs TCFD Adoption</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="disclosureRate" name="Disclosure %" stroke={T.textSec} fontSize={11} label={{ value: 'Disclosure Rate %', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} />
                <YAxis dataKey="tcfdAdopters" name="TCFD %" stroke={T.textSec} fontSize={11} label={{ value: 'TCFD %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={STEWARDSHIP_DATA} fill={T.teal} name="Exchange" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ESG Disclosure Trend 2019–2025</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ESG_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis domain={[35, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 12 }} />
                {['NYSE', 'LSE', 'JPX', 'Euronext', 'HKEX', 'SSE'].map((ex, i) => (
                  <Line key={ex} type="monotone" dataKey={ex} stroke={[T.navy, T.sage, T.gold, T.teal, T.amber, T.red][i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Exchange Profiles' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Exchange', 'Country', 'Region', 'Market Cap ($B)', 'Listed', 'ESG Score', 'Disclosure %', 'ESG Required', 'Stewardship', 'Green Bonds'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedExchange(e.id === selectedExchange ? null : e.id)}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{e.name}</td>
                  <td style={{ padding: '10px 12px', color: T.textSec }}>{e.country}</td>
                  <td style={{ padding: '10px 12px', color: T.textSec }}>{e.region}</td>
                  <td style={{ padding: '10px 12px', color: T.text }}>${e.marketCap.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: T.text }}>{e.listed.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ color: scoreColor(e.esgScore), fontWeight: 600 }}>{e.esgScore}</span></td>
                  <td style={{ padding: '10px 12px' }}><span style={{ color: scoreColor(e.disclosureRate) }}>{e.disclosureRate}%</span></td>
                  <td style={{ padding: '10px 12px' }}><span style={{ color: e.esgRequired ? T.green : T.amber, fontSize: 11, fontWeight: 600 }}>{e.esgRequired ? 'Mandatory' : 'Voluntary'}</span></td>
                  <td style={{ padding: '10px 12px' }}><span style={{ color: e.stewardshipCode ? T.green : T.red, fontSize: 11 }}>{e.stewardshipCode ? '✓' : '✗'}</span></td>
                  <td style={{ padding: '10px 12px', color: T.gold }}>{e.greenBonds.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Listing Standards' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'TCFD Mandatory', count: LISTING_STANDARDS.filter(s => s.tcfdMandatory).length, color: T.navy },
              { label: 'ESG Mandatory', count: LISTING_STANDARDS.filter(s => s.esgMandatory).length, color: T.green },
              { label: 'Climate Risk Required', count: LISTING_STANDARDS.filter(s => s.climateRisk).length, color: T.teal },
              { label: 'Scope 3 Required', count: LISTING_STANDARDS.filter(s => s.scope3).length, color: T.amber },
            ].map(k => (
              <KpiCard key={k.label} label={k.label} value={`${k.count}/${LISTING_STANDARDS.length}`} sub="exchanges" color={k.color} />
            ))}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Exchange', 'Standard', 'Tier', 'Year', 'ESG Mandatory', 'Climate Risk', 'TCFD', 'Scope 3', 'Board Diversity'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LISTING_STANDARDS.map((s, i) => (
                  <tr key={s.exchange} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{s.exchange}</td>
                    <td style={{ padding: '10px 12px', color: T.text }}>{s.standard}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ background: T.surfaceH, padding: '2px 8px', borderRadius: 4, fontSize: 11, color: T.gold }}>{s.tier}</span></td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{s.year}</td>
                    {[s.esgMandatory, s.climateRisk, s.tcfdMandatory, s.scope3, s.boardDiversity].map((v, vi) => (
                      <td key={vi} style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ color: v ? T.green : T.red }}>{v ? '✓' : '✗'}</span></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ESG Disclosure Rates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Disclosure Rate by Exchange</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...filtered].sort((a, b) => b.disclosureRate - a.disclosureRate)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={10} angle={-30} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="disclosureRate" fill={T.teal} name="Disclosure %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ESG Score Components</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filtered.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={10} angle={-30} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Bar dataKey="climateScore" fill={T.navy} name="Climate" />
                <Bar dataKey="socialScore" fill={T.teal} name="Social" />
                <Bar dataKey="govScore" fill={T.gold} name="Governance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Stewardship' && (
        <div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Stewardship Code Adoption</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {filtered.map(e => (
                <div key={e.id} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 16px', minWidth: 140, border: `1px solid ${e.stewardshipCode ? T.green : T.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{e.country}</div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>Stewardship Code</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: e.stewardshipCode ? T.green : T.amber }}>{e.stewardshipCode ? '✓ Active' : '✗ None'}</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>TCFD Adopters</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{e.tcfdAdopters}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>TCFD Adoption Rate Comparison</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...filtered].sort((a, b) => b.tcfdAdopters - a.tcfdAdopters)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={11} />
                <YAxis domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="tcfdAdopters" fill={T.gold} name="TCFD Adoption %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Green Finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Green Bonds Listed by Exchange</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.greenBonds - a.greenBonds)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="greenBonds" fill={T.sage} name="Green Bonds" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sustainability Indices Active</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.filter(e => e.sustainabilityIndex).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.surfaceH, borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>Sustainability Index Active</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>{e.greenBonds}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>green bonds</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Comparatives' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Europe Avg ESG', value: (EXCHANGES.filter(e => e.region === 'Europe').reduce((s, e) => s + e.esgScore, 0) / Math.max(1, EXCHANGES.filter(e => e.region === 'Europe').length)).toFixed(1), color: T.sage },
              { label: 'Americas Avg ESG', value: (EXCHANGES.filter(e => e.region === 'Americas').reduce((s, e) => s + e.esgScore, 0) / Math.max(1, EXCHANGES.filter(e => e.region === 'Americas').length)).toFixed(1), color: T.navy },
              { label: 'Asia-Pacific Avg ESG', value: (EXCHANGES.filter(e => e.region === 'Asia-Pacific').reduce((s, e) => s + e.esgScore, 0) / Math.max(1, EXCHANGES.filter(e => e.region === 'Asia-Pacific').length)).toFixed(1), color: T.teal },
            ].map(k => <KpiCard key={k.label} label={k.label} value={k.value} color={k.color} />)}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Regional Disclosure Rate Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { region: 'Europe', avgDisc: (EXCHANGES.filter(e => e.region === 'Europe').reduce((s, e) => s + e.disclosureRate, 0) / Math.max(1, EXCHANGES.filter(e => e.region === 'Europe').length)).toFixed(1) },
                { region: 'Americas', avgDisc: (EXCHANGES.filter(e => e.region === 'Americas').reduce((s, e) => s + e.disclosureRate, 0) / Math.max(1, EXCHANGES.filter(e => e.region === 'Americas').length)).toFixed(1) },
                { region: 'Asia-Pacific', avgDisc: (EXCHANGES.filter(e => e.region === 'Asia-Pacific').reduce((s, e) => s + e.disclosureRate, 0) / Math.max(1, EXCHANGES.filter(e => e.region === 'Asia-Pacific').length)).toFixed(1) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" stroke={T.textSec} fontSize={12} />
                <YAxis domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="avgDisc" fill={T.navy} name="Avg Disclosure %" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
