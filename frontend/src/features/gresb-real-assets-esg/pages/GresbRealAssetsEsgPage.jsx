import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const T = {
  bg: '#F0F9FF', card: '#FFFFFF', border: '#BAE6FD', text: '#0C4A6E',
  sub: '#0369A1', accent: '#0284C7', light: '#E0F2FE',
  green: '#16A34A', amber: '#D97706', red: '#DC2626',
  purple: '#7C3AED', teal: '#0D9488',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const GRESB_COMPONENTS = [
  { component: 'Management', weight: 30, description: 'Leadership, policies, risk management, stakeholder engagement' },
  { component: 'Performance', weight: 70, description: 'Environmental data: energy, GHG, water, waste; certifications; asset ratings' },
];

const FUNDS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  fund: ['Brookfield RE Fund', 'Prologis ELOG', 'LaSalle Core Plus', 'CBRE Global RE', 'Hines GREF', 'Invesco RE', 'DWS RREEF', 'AEW Core', 'PGIM RE', 'Nuveen RE', 'Blackstone BREIT', 'KKR RE', 'Goldman RE', 'JPM RE', 'Ares RE', 'Greystar', 'M&G RE', 'Schroders RE', 'Aviva RE', 'LGIM RE'][i],
  strategy: ['Diversified', 'Logistics', 'Core Office', 'Global', 'Prime Office', 'Retail', 'Residential', 'Core+', 'Industrial', 'Diversified'][i % 10],
  gresbScore: Math.round(55 + sr(i * 13) * 45),
  management: Math.round(18 + sr(i * 17) * 12),
  performance: Math.round(37 + sr(i * 23) * 33),
  starRating: Math.min(5, Math.max(1, Math.round(1 + sr(i * 29) * 4))),
  benchmark: ['Top Quartile', 'Second Quartile', 'Third Quartile', 'Top Quartile'][i % 4],
  energyIntensity: Math.round(80 + sr(i * 37) * 220),
  ghgIntensity: Math.round(15 + sr(i * 41) * 85),
  certPct: Math.round(20 + sr(i * 47) * 75),
  waterIntensity: Math.round(200 + sr(i * 53) * 800),
  aum: Math.round(2 + sr(i * 59) * 28),
}));

const TREND_DATA = Array.from({ length: 8 }, (_, i) => ({
  year: 2017 + i,
  participants: Math.round(850 + i * 95),
  avgScore: Math.round(58 + i * 3.5),
  topQuartileThreshold: Math.round(75 + i * 2.5),
  assetsGAV: Math.round(3.2 + i * 0.65),
}));

const BEST_PRACTICE = [
  { practice: 'Net-Zero Target Set', adoption: 68, leader: 'Prologis: Science-Based Targets aligned' },
  { practice: 'Renewable Energy Procurement', adoption: 72, leader: 'Hines: 100% renewable in 15 markets' },
  { practice: 'Green Certification >50% Stock', adoption: 55, leader: 'CBRE IM: 82% LEED/BREEAM certified' },
  { practice: 'Tenant Engagement Programme', adoption: 61, leader: 'British Land: Green lease standard' },
  { practice: 'Physical Risk Assessment', adoption: 45, leader: 'Nuveen: CRREM + flood risk full stack' },
  { practice: 'Biodiversity Reporting', adoption: 28, leader: 'Schroders RE: TNFD pilot participant' },
];

const TABS = ['Fund Benchmark', 'Score Breakdown', 'Trend Analysis', 'ESG Indicators', 'Best Practice', 'Investor Requirements'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.accent }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

export default function GresbRealAssetsEsgPage() {
  const [tab, setTab] = useState(0);
  const [sort, setSort] = useState('gresbScore');

  const sorted = useMemo(() => [...FUNDS].sort((a, b) => b[sort] - a[sort]), [sort]);

  const kpis = useMemo(() => ({
    avgScore: Math.round(FUNDS.reduce((a, f) => a + f.gresbScore, 0) / FUNDS.length),
    topQuartile: FUNDS.filter(f => f.benchmark === 'Top Quartile').length,
    avgEnergy: Math.round(FUNDS.reduce((a, f) => a + f.energyIntensity, 0) / FUNDS.length),
    avgCertPct: Math.round(FUNDS.reduce((a, f) => a + f.certPct, 0) / FUNDS.length),
  }), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EI5</span>
            <span style={{ fontSize: 12, color: T.sub }}>GRESB & Real Assets ESG</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>GRESB & Real Assets ESG Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>GRESB benchmarking, fund score comparison, ESG indicator trends, and best practice intelligence for real estate and infrastructure portfolios</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg GRESB Score" value={kpis.avgScore} sub="portfolio benchmark" color={T.accent} />
          <KpiCard label="Top Quartile Funds" value={`${kpis.topQuartile}/${FUNDS.length}`} sub="in this benchmark" color={T.green} />
          <KpiCard label="Avg Energy Intensity" value={`${kpis.avgEnergy}`} sub="kWh/m²/yr" color={T.amber} />
          <KpiCard label="Avg Certified Stock" value={`${kpis.avgCertPct}%`} sub="LEED/BREEAM/other" color={T.teal} />
          <KpiCard label="GRESB Participants" value="2,000+" sub="funds globally (2023)" color={T.purple} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.accent : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.sub }}>Sort by:</span>
              {['gresbScore', 'management', 'performance', 'certPct', 'energyIntensity'].map(k => (
                <button key={k} onClick={() => setSort(k)} style={{ padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: sort === k ? T.accent : T.card, color: sort === k ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>{k}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['Rank', 'Fund', 'Strategy', 'GRESB Score', 'Mgmt', 'Perf', '★', 'Quartile', 'Energy', 'GHG', 'Cert %', 'AUM ($Bn)'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {sorted.map((f, i) => (
                    <tr key={f.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>#{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{f.fund}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{f.strategy}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: f.gresbScore >= 75 ? T.green : f.gresbScore >= 55 ? T.amber : T.red }}>{f.gresbScore}</td>
                      <td style={{ padding: '8px 12px' }}>{f.management}</td>
                      <td style={{ padding: '8px 12px' }}>{f.performance}</td>
                      <td style={{ padding: '8px 12px' }}>{'★'.repeat(f.starRating)}{'☆'.repeat(5 - f.starRating)}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={f.benchmark} color={f.benchmark === 'Top Quartile' ? T.green : f.benchmark === 'Second Quartile' ? T.teal : T.amber} /></td>
                      <td style={{ padding: '8px 12px' }}>{f.energyIntensity}</td>
                      <td style={{ padding: '8px 12px' }}>{f.ghgIntensity}</td>
                      <td style={{ padding: '8px 12px' }}>{f.certPct}%</td>
                      <td style={{ padding: '8px 12px' }}>${f.aum}Bn</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>GRESB Score Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { range: '<50', count: FUNDS.filter(f => f.gresbScore < 50).length },
                  { range: '50-60', count: FUNDS.filter(f => f.gresbScore >= 50 && f.gresbScore < 60).length },
                  { range: '60-70', count: FUNDS.filter(f => f.gresbScore >= 60 && f.gresbScore < 70).length },
                  { range: '70-80', count: FUNDS.filter(f => f.gresbScore >= 70 && f.gresbScore < 80).length },
                  { range: '>80', count: FUNDS.filter(f => f.gresbScore >= 80).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.accent} radius={[4, 4, 0, 0]} name="# Funds" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Management vs Performance Score</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="management" name="Mgmt Score" tick={{ fontSize: 11 }} label={{ value: 'Management', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="performance" name="Perf Score" tick={{ fontSize: 11 }} label={{ value: 'Performance', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={FUNDS} fill={T.accent} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>GRESB Average Score Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgScore" stroke={T.accent} strokeWidth={2.5} name="Avg Score" dot={false} />
                  <Line type="monotone" dataKey="topQuartileThreshold" stroke={T.green} strokeWidth={2} strokeDasharray="5 3" name="Top Quartile Threshold" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>GRESB Participant Growth</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="participants" stroke={T.teal} fill={T.teal + '33'} name="Participants" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Key ESG Indicators — Portfolio Distribution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  { label: 'Energy Intensity (kWh/m²)', data: FUNDS, key: 'energyIntensity', color: T.amber },
                  { label: 'GHG Intensity (kgCO₂/m²)', data: FUNDS, key: 'ghgIntensity', color: T.red },
                  { label: 'Certified Stock (%)', data: FUNDS, key: 'certPct', color: T.green },
                  { label: 'Water Intensity (L/m²)', data: FUNDS, key: 'waterIntensity', color: T.accent },
                ].map(col => {
                  const vals = [...col.data].map(f => f[col.key]);
                  const min = Math.min(...vals), max = Math.max(...vals), avg = Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);
                  return (
                    <div key={col.label} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{col.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: col.color }}>{avg}</div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Range: {min} – {max}</div>
                      <div style={{ background: T.light, borderRadius: 4, height: 6, marginTop: 8 }}>
                        <div style={{ background: col.color, borderRadius: 4, height: 6, width: `${((avg - min) / (max - min)) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Best Practice Adoption in GRESB Top Quartile</h3>
              {BEST_PRACTICE.map(bp => (
                <div key={bp.practice} style={{ padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{bp.practice}</span>
                    <span style={{ color: T.accent, fontWeight: 700 }}>{bp.adoption}%</span>
                  </div>
                  <div style={{ background: T.light, borderRadius: 4, height: 8, marginBottom: 6 }}>
                    <div style={{ background: T.accent, borderRadius: 4, height: 8, width: `${bp.adoption}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>Leader: {bp.leader}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { investor: 'APG (Netherlands)', aum: '€620Bn', gresbReq: 'Minimum 3 stars; top quartile preferred', policy: 'Net-zero by 2050 for RE portfolio; annual GRESB audit' },
              { investor: 'CPPIB (Canada)', aum: 'CAD $570Bn', gresbReq: 'GRESB 4-star minimum for core RE', policy: 'TCFD disclosure required from all GPs' },
              { investor: 'CalPERS (USA)', aum: '$480Bn', gresbReq: 'GRESB participation mandatory', policy: '2050 net zero; annual engagement on GRESB improvement' },
              { investor: 'PGGM (Netherlands)', aum: '€250Bn', gresbReq: '5-star or top quartile required', policy: 'Science-based targets + CRREM pathway alignment' },
              { investor: 'USS (UK)', aum: '£75Bn', gresbReq: 'Top 30% GRESB benchmark', policy: 'Climate action plan + annual GRESB improvement' },
              { investor: 'Aware Super (Australia)', aum: 'AUD $160Bn', gresbReq: '4-star minimum for core AU assets', policy: 'NABERS 5+ preferred; GRESB Infrastructure for infra' },
            ].map(inv => (
              <div key={inv.investor} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 4 }}>{inv.investor}</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>AUM: <strong style={{ color: T.accent }}>{inv.aum}</strong></div>
                <div style={{ fontSize: 12, color: T.green, marginBottom: 4 }}><strong>GRESB req:</strong> {inv.gresbReq}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{inv.policy}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
