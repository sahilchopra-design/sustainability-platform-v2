import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;

const SECTORS = ['Technology','Financials','Healthcare','Energy','Industrials','Consumer','Materials','Utilities'];

const TOPICS = [
  { id: 'cc-mit', name: 'Climate Change Mitigation', pillar: 'E', esrs: 'E1', impact: 8.9, financial: 7.8 },
  { id: 'cc-adapt', name: 'Climate Change Adaptation', pillar: 'E', esrs: 'E1', impact: 7.2, financial: 6.4 },
  { id: 'water', name: 'Water & Marine Resources', pillar: 'E', esrs: 'E3', impact: 7.8, financial: 5.9 },
  { id: 'biodiv', name: 'Biodiversity & Ecosystems', pillar: 'E', esrs: 'E4', impact: 8.1, financial: 5.2 },
  { id: 'circ', name: 'Circular Economy', pillar: 'E', esrs: 'E5', impact: 6.4, financial: 5.7 },
  { id: 'own-work', name: 'Own Workforce', pillar: 'S', esrs: 'S1', impact: 7.5, financial: 6.8 },
  { id: 'workers', name: 'Workers in Value Chain', pillar: 'S', esrs: 'S2', impact: 7.1, financial: 5.5 },
  { id: 'communities', name: 'Affected Communities', pillar: 'S', esrs: 'S3', impact: 6.8, financial: 4.9 },
  { id: 'consumers', name: 'Consumers & End-users', pillar: 'S', esrs: 'S4', impact: 6.2, financial: 5.8 },
  { id: 'conduct', name: 'Business Conduct', pillar: 'G', esrs: 'G1', impact: 7.4, financial: 7.2 },
  { id: 'tax', name: 'Tax Transparency', pillar: 'G', esrs: 'G1', impact: 5.8, financial: 6.1 },
  { id: 'supply', name: 'Supply Chain Due Diligence', pillar: 'S', esrs: 'S2', impact: 7.3, financial: 6.3 },
];

const COMPANIES = Array.from({ length: 24 }, (_, i) => ({
  name: ['Microsoft','Apple','JPMorgan','Nestlé','Shell','Unilever','BASF','Enel',
    'Siemens','Danone','ArcelorMittal','BNP Paribas','Roche','BP','L\'Oréal','Volkswagen',
    'AXA','Rio Tinto','Schneider','Allianz','HSBC','Novartis','TotalEnergies','ABB'][i],
  sector: SECTORS[i % SECTORS.length],
  impactMaterialityScore: +(sr(i * 7) * 40 + 50).toFixed(1),
  financialMaterialityScore: +(sr(i * 11) * 40 + 45).toFixed(1),
  csrdScope: i % 4 !== 3,
  materialTopics: 4 + (i % 5),
  disclosureQuality: +(sr(i * 17) * 40 + 45).toFixed(1),
  stakeholderEngaged: i % 3 !== 0,
}));

const STAKEHOLDER_GROUPS = [
  { name: 'Institutional Investors', weight: 0.28, eRating: 8.4, sRating: 6.2, gRating: 7.8 },
  { name: 'Employees', weight: 0.18, eRating: 6.1, sRating: 9.2, gRating: 7.1 },
  { name: 'Customers', weight: 0.16, eRating: 7.2, sRating: 8.4, gRating: 6.5 },
  { name: 'Regulators', weight: 0.14, eRating: 9.1, sRating: 7.3, gRating: 9.4 },
  { name: 'NGOs / Civil Society', weight: 0.12, eRating: 9.4, sRating: 8.8, gRating: 7.5 },
  { name: 'Suppliers', weight: 0.07, eRating: 6.8, sRating: 7.1, gRating: 6.2 },
  { name: 'Local Communities', weight: 0.05, eRating: 7.8, sRating: 8.9, gRating: 5.8 },
];

const YEARS = [2021, 2022, 2023, 2024, 2025];
const maturityTrend = YEARS.map((yr, i) => ({
  year: yr,
  impact: +(45 + i * 7 + sr(i * 13) * 6).toFixed(1),
  financial: +(40 + i * 6 + sr(i * 17) * 5).toFixed(1),
  double: +(42 + i * 7.5 + sr(i * 23) * 6).toFixed(1),
}));

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

const TABS = ['Overview', 'Impact Materiality', 'Financial Materiality', 'CSRD Assessment', 'Stakeholders', 'Topic Matrix', 'Reporting'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };
const pillarColor = (p) => ({ E: T.green, S: T.teal, G: T.navy }[p] || T.textSec);

export default function MaterialityHubPage() {
  const [tab, setTab] = useState('Overview');
  const [sector, setSector] = useState('All');
  const [pillar, setPillar] = useState('All');

  const filteredTopics = useMemo(() => TOPICS.filter(t =>
    (pillar === 'All' || t.pillar === pillar)
  ), [pillar]);

  const filteredCompanies = useMemo(() => COMPANIES.filter(c =>
    sector === 'All' || c.sector === sector
  ), [sector]);

  const scatterData = useMemo(() => filteredTopics.map(t => ({
    impact: t.impact, financial: t.financial, name: t.name, pillar: t.pillar,
  })), [filteredTopics]);

  const topicBarData = useMemo(() => filteredTopics.map(t => ({
    name: t.esrs, impact: t.impact, financial: t.financial,
  })), [filteredTopics]);

  const stakeData = useMemo(() => STAKEHOLDER_GROUPS.map(s => ({
    name: s.name.split(' ')[0], E: s.eRating, S: s.sRating, G: s.gRating,
  })), []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Double Materiality Hub</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>CSRD/ESRS impact &amp; financial materiality assessment — topic prioritization, stakeholder weighting &amp; disclosure quality</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="ESRS Topics" value={TOPICS.length} sub="Covered across E, S & G pillars" color={T.navy} />
            <KpiCard label="Avg Impact Score" value={(TOPICS.reduce((a, t) => a + t.impact, 0) / TOPICS.length).toFixed(1)} sub="Out of 10 (impact materiality)" color={T.red} />
            <KpiCard label="Avg Financial Score" value={(TOPICS.reduce((a, t) => a + t.financial, 0) / TOPICS.length).toFixed(1)} sub="Out of 10 (financial materiality)" color={T.gold} />
            <KpiCard label="CSRD In-Scope" value={`${COMPANIES.filter(c => c.csrdScope).length}/${COMPANIES.length}`} sub="Companies meeting size threshold" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Double Materiality — Impact vs Financial Score by ESRS Topic</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topicBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="impact" name="Impact Materiality" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="financial" name="Financial Materiality" fill={T.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Materiality Maturity Trend (2021–2025)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={maturityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="impact" name="Impact %" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="financial" name="Financial %" stroke={T.gold} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="double" name="Double Mat. %" stroke={T.navy} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Impact Materiality' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Pillar:</label>
            <select style={select} value={pillar} onChange={e => setPillar(e.target.value)}>
              {['All', 'E', 'S', 'G'].map(p => <option key={p} value={p}>{p === 'All' ? 'All' : `${p} — ${p === 'E' ? 'Environmental' : p === 'S' ? 'Social' : 'Governance'}`}</option>)}
            </select>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Filtered Topics" value={filteredTopics.length} sub={`${pillar === 'All' ? 'All pillars' : pillar} topics`} color={T.navy} />
            <KpiCard label="Avg Impact Score" value={filteredTopics.length > 0 ? (filteredTopics.reduce((a, t) => a + t.impact, 0) / filteredTopics.length).toFixed(1) : '–'} sub="Impact materiality (0–10)" color={T.red} />
            <KpiCard label="High Impact (≥8)" value={filteredTopics.filter(t => t.impact >= 8).length} sub="Topics requiring mandatory disclosure" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Impact Materiality Score by Topic</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredTopics.map(t => ({ name: t.esrs, score: t.impact, pillar: t.pillar }))} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={40} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="score" name="Impact Score" fill={T.red} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Topic Detail — Impact Materiality</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Topic','Pillar','ESRS','Impact Score','Financial Score','Threshold','Disclosure Required'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{filteredTopics.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{t.name}</td>
                  <td style={{ padding: '5px 8px' }}><span style={{ color: pillarColor(t.pillar), fontWeight: 700 }}>{t.pillar}</span></td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navyL }}>{t.esrs}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: t.impact >= 8 ? T.red : T.amber }}>{t.impact}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.gold }}>{t.financial}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: t.impact >= 7 ? T.red : T.textSec }}>{t.impact >= 8 ? 'Material' : t.impact >= 6 ? 'Review' : 'Immaterial'}</td>
                  <td style={{ padding: '5px 8px', color: t.impact >= 7 ? T.green : T.textMut }}>{t.impact >= 7 ? '✓ Yes' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Financial Materiality' && (
        <>
          <div style={card}>
            <h2 style={h2}>Financial vs Impact Materiality — Double Materiality Matrix</h2>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="impact" name="Impact Score" domain={[4, 10]}
                  label={{ value: 'Impact Materiality (0–10)', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }}
                  tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="financial" name="Financial Score" domain={[4, 10]}
                  label={{ value: 'Financial Materiality (0–10)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }}
                  tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }}
                  formatter={(v, n) => [v.toFixed(1), n]} />
                <Scatter data={scatterData} fill={T.navyL} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Top-right quadrant (impact ≥7 &amp; financial ≥7) = mandatory CSRD disclosure. Top-left = material for impact only. Bottom-right = financial risk only.</div>
          </div>
          <div style={grid(3)}>
            {[{ label: 'Dual Material', filter: t => t.impact >= 7 && t.financial >= 7, color: T.red, desc: 'Impact ≥7 & Financial ≥7' },
              { label: 'Impact Only', filter: t => t.impact >= 7 && t.financial < 7, color: T.amber, desc: 'Impact ≥7, Financial <7' },
              { label: 'Financial Only', filter: t => t.impact < 7 && t.financial >= 7, color: T.gold, desc: 'Financial ≥7, Impact <7' }].map(q => (
              <div key={q.label} style={{ ...card, marginBottom: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: q.color, marginBottom: 8 }}>{q.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: T.mono, marginBottom: 4 }}>{TOPICS.filter(q.filter).length} topics</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{q.desc}</div>
                <div style={{ marginTop: 10 }}>
                  {TOPICS.filter(q.filter).map(t => (
                    <div key={t.id} style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>• {t.name} ({t.esrs})</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'CSRD Assessment' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Sector:</label>
            <select style={select} value={sector} onChange={e => setSector(e.target.value)}>
              {['All', ...SECTORS].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={grid(4)}>
            <KpiCard label="Companies Assessed" value={filteredCompanies.length} sub={sector} color={T.navy} />
            <KpiCard label="CSRD In-Scope" value={filteredCompanies.filter(c => c.csrdScope).length} sub="Meet size thresholds" color={T.green} />
            <KpiCard label="Avg Disclosure Quality" value={filteredCompanies.length > 0 ? (filteredCompanies.reduce((a, c) => a + c.disclosureQuality, 0) / filteredCompanies.length).toFixed(1) : '–'} sub="Out of 100" color={T.gold} />
            <KpiCard label="Stakeholder Engaged" value={filteredCompanies.filter(c => c.stakeholderEngaged).length} sub="Formal engagement programs" color={T.teal} />
          </div>
          <div style={card}>
            <h2 style={h2}>Company CSRD Readiness Assessment</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Company','Sector','Impact Score','Financial Score','CSRD Scope','Material Topics','Disclosure Quality','Stakeholder'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{filteredCompanies.map(c => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{c.sector}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.red }}>{c.impactMaterialityScore}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.gold }}>{c.financialMaterialityScore}</td>
                  <td style={{ padding: '5px 8px', color: c.csrdScope ? T.green : T.textMut }}>{c.csrdScope ? '✓ In-scope' : 'Out'}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navy }}>{c.materialTopics}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: c.disclosureQuality >= 70 ? T.green : T.amber }}>{c.disclosureQuality}</td>
                  <td style={{ padding: '5px 8px', color: c.stakeholderEngaged ? T.teal : T.textMut }}>{c.stakeholderEngaged ? '✓' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Stakeholders' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Stakeholder Groups" value={STAKEHOLDER_GROUPS.length} sub="Identified & weighted" color={T.navy} />
            <KpiCard label="Top Priority" value="Inst. Investors" sub="Weight: 28% — highest influence" color={T.gold} />
            <KpiCard label="Engagement Rate" value="72%" sub="Groups with active formal engagement" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Stakeholder ESG Materiality Priorities</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stakeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="E" name="Environmental Priority" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="S" name="Social Priority" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Bar dataKey="G" name="Governance Priority" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Stakeholder Group Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Stakeholder Group','Weight','E Priority','S Priority','G Priority','Engagement Method'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{STAKEHOLDER_GROUPS.map((s, i) => (
                <tr key={s.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: T.text, fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.amber }}>{(s.weight * 100).toFixed(0)}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.green }}>{s.eRating}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.teal }}>{s.sRating}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.navy }}>{s.gRating}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 10 }}>{['Quarterly survey','Annual survey + focus groups','Online survey','Regulatory consultation','Workshop + interviews','Supplier code review','Community consultation'][i]}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Topic Matrix' && (
        <>
          <div style={card}>
            <h2 style={h2}>ESRS Topic Materiality Matrix</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {['E', 'S', 'G'].map(pl => (
                <div key={pl} style={{ background: T.surfaceH, borderRadius: 8, padding: 14, border: `1px solid ${pillarColor(pl)}44` }}>
                  <div style={{ fontWeight: 700, color: pillarColor(pl), fontSize: 14, marginBottom: 10 }}>
                    {pl === 'E' ? '🌍 Environmental' : pl === 'S' ? '👥 Social' : '⚖️ Governance'}
                  </div>
                  {TOPICS.filter(t => t.pillar === pl).map(t => (
                    <div key={t.id} style={{ marginBottom: 10, background: T.surface, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{t.name}</span>
                        <span style={{ fontSize: 10, fontFamily: T.mono, color: T.navyL }}>{t.esrs}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[{ label: 'Impact', val: t.impact, color: T.red }, { label: 'Financial', val: t.financial, color: T.gold }].map(m => (
                          <div key={m.label} style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: T.textMut, marginBottom: 2 }}>{m.label}</div>
                            <div style={{ background: T.border, borderRadius: 2, height: 4 }}>
                              <div style={{ width: `${(m.val / 10) * 100}%`, background: m.color, borderRadius: 2, height: '100%' }} />
                            </div>
                            <div style={{ fontSize: 10, fontFamily: T.mono, color: m.color, marginTop: 2 }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Reporting' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="ESRS Sets" value="12" sub="ESRS 1/2 + E1–E5 + S1–S4 + G1" color={T.navy} />
            <KpiCard label="Mandatory DRs" value="82" sub="Disclosure Requirements (CSRD)" color={T.red} />
            <KpiCard label="Voluntary DRs" value="30+" sub="Voluntary additional disclosures" color={T.amber} />
            <KpiCard label="First Deadline" value="FY2024" sub="Large PIEs (>500 employees)" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>CSRD Phasing Timeline</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { wave: 'Wave 1', deadline: 'FY2024', report: '2025', criteria: '>500 employees (PIE)', companies: '~2,000 EU', color: T.red },
                { wave: 'Wave 2', deadline: 'FY2025', report: '2026', criteria: 'Large companies (non-PIE)', companies: '~40,000 EU', color: T.amber },
                { wave: 'Wave 3', deadline: 'FY2026', report: '2027', criteria: 'Listed SMEs (opt-out to 2028)', companies: '~18,000 EU', color: T.gold },
                { wave: 'Wave 4', deadline: 'FY2028', report: '2029', criteria: 'Non-EU listed in EU >€150M revenue', companies: '~10,000 global', color: T.navy },
              ].map(w => (
                <div key={w.wave} style={{ background: T.surfaceH, borderRadius: 8, padding: 14, border: `1px solid ${w.color}44` }}>
                  <div style={{ fontWeight: 700, color: w.color, fontSize: 13, marginBottom: 8 }}>{w.wave}</div>
                  {[{ label: 'Reporting FY', val: w.deadline }, { label: 'Report Due', val: w.report },
                    { label: 'Criteria', val: w.criteria }, { label: 'Companies', val: w.companies }].map(f => (
                    <div key={f.label} style={{ marginBottom: 5 }}>
                      <div style={{ fontSize: 9, color: T.textMut }}>{f.label}</div>
                      <div style={{ fontSize: 11, fontFamily: T.mono, color: T.text }}>{f.val}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <h2 style={h2}>ESRS Coverage by Topic Area</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={TOPICS.map(t => ({ name: t.esrs, impact: t.impact, financial: t.financial, total: +(t.impact + t.financial).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="total" name="Combined Materiality Score" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
