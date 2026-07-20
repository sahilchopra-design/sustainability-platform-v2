const API = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:8001';
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SOCIAL_OBJECTIVES = [
  { id: 'affordable-housing', name: 'Affordable Housing', sdg: 11, budget: 320, alignedPct: 38, eligiblePct: 62 },
  { id: 'healthcare', name: 'Access to Healthcare', sdg: 3, budget: 580, alignedPct: 45, eligiblePct: 71 },
  { id: 'education', name: 'Education & Training', sdg: 4, budget: 290, alignedPct: 41, eligiblePct: 65 },
  { id: 'employment', name: 'Employment & Decent Work', sdg: 8, budget: 440, alignedPct: 35, eligiblePct: 58 },
  { id: 'fin-inclusion', name: 'Financial Inclusion', sdg: 10, budget: 210, alignedPct: 52, eligiblePct: 78 },
  { id: 'digital', name: 'Digital Access', sdg: 9, budget: 180, alignedPct: 43, eligiblePct: 67 },
  { id: 'gender', name: 'Gender Equality', sdg: 5, budget: 160, alignedPct: 39, eligiblePct: 61 },
  { id: 'food-security', name: 'Food Security', sdg: 2, budget: 240, alignedPct: 33, eligiblePct: 55 },
];

const ACTIVITIES = Array.from({ length: 20 }, (_, i) => ({
  name: ['Social housing construction','Community health centres','Vocational training programs','Microfinance for SMEs',
    'Rural broadband rollout','Childcare facilities','Women-owned enterprise finance','Urban food banks',
    'Affordable care homes','ESG-linked social bonds','Community renewable energy','Digital skills upskilling',
    'Disability employment support','Refugee integration finance','Fair trade supply chains',
    'Universal basic income pilots','School infrastructure','Clean water access','Mental health services','Worker retraining'][i],
  objective: SOCIAL_OBJECTIVES[i % SOCIAL_OBJECTIVES.length].id,
  region: ['EU','UK','US','Asia-Pacific','Emerging Markets','Nordic','Switzerland'][i % 7],
  eligibility: ['Eligible','Eligible','Not Eligible','Review Required','Eligible','Not Eligible','Eligible','Review Required','Eligible','Eligible','Eligible','Eligible','Eligible','Review Required','Not Eligible','Review Required','Eligible','Eligible','Eligible','Not Eligible'][i],
  alignmentScore: +(sr(i * 7) * 40 + 45).toFixed(1),
  dnsScore: +(sr(i * 11) * 30 + 60).toFixed(1),
  msscScore: +(sr(i * 17) * 35 + 55).toFixed(1),
  capexMn: +(sr(i * 23) * 200 + 20).toFixed(0),
}));

const BONDS = Array.from({ length: 12 }, (_, i) => ({
  issuer: ['EIB','European Commission','AFD France','KfW Germany','BNG Bank','EBRD','IFC','NWB Bank','Kommunalbanken','CDC Habitat','SNCF','CDP Italy'][i],
  type: ['Social Bond','Sustainability Bond','Social Bond','Social Bond','Social Bond','Sustainability Bond','Social Bond','Social Bond','Social Bond','Social Bond','Social Bond','Social Bond'][i],
  volume: +(sr(i * 7) * 800 + 100).toFixed(0),
  use: SOCIAL_OBJECTIVES[i % SOCIAL_OBJECTIVES.length].name,
  year: 2019 + (i % 6),
  icma: true,
  taxonomyAligned: i % 3 !== 0,
  impactKpi: ['Jobs created','People housed','Patients served','Students trained','SMEs funded','Households connected','Women supported','Meals distributed','Care places','Bonds issued','kWh renewable','People upskilled'][i],
}));

const REGIONS = ['EU','UK','US','Asia-Pacific','Emerging Markets','Nordic','Switzerland'];

const PROGRESS = YEARS => YEARS.map((yr, i) => ({
  year: yr,
  eligible: +(30 + i * 8 + sr(i * 7) * 5).toFixed(1),
  aligned: +(18 + i * 6 + sr(i * 11) * 4).toFixed(1),
  bonds: +(12 + i * 5 + sr(i * 17) * 3).toFixed(1),
}));

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

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

const TABS = ['Overview', 'Activity Screener', 'SDG Alignment', 'Eligibility', 'Social Bonds', 'Alignment Scoring', 'Reporting'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };
const eligColor = (e) => ({ Eligible: T.green, 'Not Eligible': T.red, 'Review Required': T.amber }[e] || T.textSec);

export default function SocialTaxonomyPage() {
  const [tab, setTab] = useState('Overview');
  const [objective, setObjective] = useState('All');
  const [region, setRegion] = useState('All');

  const filteredActivities = useMemo(() => ACTIVITIES.filter(a =>
    (objective === 'All' || a.objective === objective) &&
    (region === 'All' || a.region === region)
  ), [objective, region]);

  const progressData = useMemo(() => PROGRESS(YEARS), []);

  const objBarData = useMemo(() => SOCIAL_OBJECTIVES.map(o => ({
    name: o.name.split(' ').slice(0, 2).join(' '), aligned: o.alignedPct, eligible: o.eligiblePct,
  })), []);

  const bondData = useMemo(() => BONDS.slice(0, 10).map(b => ({
    name: b.issuer.split(' ')[0], volume: b.volume, aligned: b.taxonomyAligned ? 100 : 0,
  })), []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>EU Social Taxonomy</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>Social activity eligibility, SDG alignment, Do No Significant Harm screening &amp; social bond analytics under the EU Social Taxonomy framework</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Social Objectives" value={SOCIAL_OBJECTIVES.length} sub="EU Social Taxonomy categories" color={T.navy} />
            <KpiCard label="Avg Eligible %" value={`${(SOCIAL_OBJECTIVES.reduce((a, o) => a + o.eligiblePct, 0) / SOCIAL_OBJECTIVES.length).toFixed(0)}%`} sub="Activities meeting eligibility" color={T.green} />
            <KpiCard label="Avg Aligned %" value={`${(SOCIAL_OBJECTIVES.reduce((a, o) => a + o.alignedPct, 0) / SOCIAL_OBJECTIVES.length).toFixed(0)}%`} sub="Activities fully aligned" color={T.teal} />
            <KpiCard label="Social Bond Volume" value={`$${BONDS.reduce((a, b) => a + +b.volume, 0).toLocaleString()}M`} sub="Tracked issuance portfolio" color={T.gold} />
          </div>
          <div style={card}>
            <h2 style={h2}>Eligible vs Aligned by Social Objective</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={objBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="eligible" name="Eligible %" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="aligned" name="Aligned %" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Social Taxonomy Alignment Progress 2020–2025</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="eligible" name="Eligible %" stroke={T.green} fill={`${T.green}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="aligned" name="Aligned %" stroke={T.teal} fill={`${T.teal}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="bonds" name="Bond Coverage %" stroke={T.navy} fill={`${T.navy}22`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Activity Screener' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Objective:</label>
              <select style={select} value={objective} onChange={e => setObjective(e.target.value)}>
                <option value="All">All</option>
                {SOCIAL_OBJECTIVES.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Region:</label>
              <select style={select} value={region} onChange={e => setRegion(e.target.value)}>
                {['All', ...REGIONS].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Activities Shown" value={filteredActivities.length} sub="After filters" color={T.navy} />
            <KpiCard label="Eligible" value={filteredActivities.filter(a => a.eligibility === 'Eligible').length} sub="Pass eligibility criteria" color={T.green} />
            <KpiCard label="Review Required" value={filteredActivities.filter(a => a.eligibility === 'Review Required').length} sub="Need additional assessment" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Activity Eligibility Screener</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Activity','Objective','Region','Eligibility','Alignment','DNSH','MSSC','CapEx ($M)'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{filteredActivities.map(a => (
                <tr key={a.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{a.name}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{SOCIAL_OBJECTIVES.find(o => o.id === a.objective)?.name.split(' ').slice(0, 2).join(' ')}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec }}>{a.region}</td>
                  <td style={{ padding: '5px 8px' }}><span style={{ color: eligColor(a.eligibility), fontWeight: 600, fontSize: 10 }}>{a.eligibility}</span></td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.teal }}>{a.alignmentScore}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.green }}>{a.dnsScore}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navy }}>{a.msscScore}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.amber }}>{a.capexMn}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'SDG Alignment' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="SDGs Covered" value={new Set(SOCIAL_OBJECTIVES.map(o => o.sdg)).size} sub="Unique SDGs with activities" color={T.navy} />
            <KpiCard label="Primary SDG" value="SDG 3" sub="Healthcare — highest budget $580M" color={T.teal} />
            <KpiCard label="Total Budget" value={`$${SOCIAL_OBJECTIVES.reduce((a, o) => a + o.budget, 0).toLocaleString()}M`} sub="Across all social objectives" color={T.gold} />
            <KpiCard label="SDG 10 Alignment" value={`${SOCIAL_OBJECTIVES.find(o => o.sdg === 10)?.alignedPct}%`} sub="Reduced Inequalities — key target" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Budget &amp; Alignment by SDG Target</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SOCIAL_OBJECTIVES.map(o => ({ sdg: `SDG ${o.sdg}`, budget: o.budget, aligned: o.alignedPct }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sdg" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="budget" name="Budget ($M)" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="aligned" name="Aligned %" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Social Objective SDG Mapping</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {SOCIAL_OBJECTIVES.map(o => (
                <div key={o.id} style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, color: T.teal, fontSize: 18, fontFamily: T.mono, marginBottom: 4 }}>SDG {o.sdg}</div>
                  <div style={{ fontSize: 11, color: T.text, fontWeight: 600, marginBottom: 8 }}>{o.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[{ label: 'Budget', val: `$${o.budget}M`, color: T.gold },
                      { label: 'Eligible', val: `${o.eligiblePct}%`, color: T.green },
                      { label: 'Aligned', val: `${o.alignedPct}%`, color: T.teal }].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 9, color: T.textMut }}>{m.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 12, color: m.color, fontWeight: 700 }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Eligibility' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Total Activities" value={ACTIVITIES.length} sub="In taxonomy scope" color={T.navy} />
            <KpiCard label="Eligible" value={ACTIVITIES.filter(a => a.eligibility === 'Eligible').length} sub={`${((ACTIVITIES.filter(a => a.eligibility === 'Eligible').length / ACTIVITIES.length) * 100).toFixed(0)}% pass rate`} color={T.green} />
            <KpiCard label="Not Eligible" value={ACTIVITIES.filter(a => a.eligibility === 'Not Eligible').length} sub="Fail screening criteria" color={T.red} />
          </div>
          <div style={card}>
            <h2 style={h2}>DNSH &amp; MSSC Scoring — Alignment Quality</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="dnsScore" name="DNSH Score" label={{ value: 'Do No Significant Harm Score', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="msscScore" name="MSSC Score" label={{ value: 'Minimum Social Safeguards', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Scatter data={ACTIVITIES} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Social Bonds' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Bonds Tracked" value={BONDS.length} sub="Social & sustainability bond portfolio" color={T.navy} />
            <KpiCard label="Total Volume" value={`$${BONDS.reduce((a, b) => a + +b.volume, 0).toLocaleString()}M`} sub="Tracked issuances" color={T.green} />
            <KpiCard label="Taxonomy Aligned" value={BONDS.filter(b => b.taxonomyAligned).length} sub={`of ${BONDS.length} social bonds`} color={T.teal} />
            <KpiCard label="ICMA SBP" value={BONDS.filter(b => b.icma).length} sub="Adherent to Social Bond Principles" color={T.gold} />
          </div>
          <div style={card}>
            <h2 style={h2}>Social Bond Issuance by Issuer</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bondData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="volume" name="Volume ($M)" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Social Bond Portfolio Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Issuer','Type','Volume ($M)','Use of Proceeds','Year','ICMA SBP','Taxonomy Aligned','Impact KPI'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{BONDS.map(b => (
                <tr key={b.issuer} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{b.issuer}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{b.type}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.teal }}>{b.volume}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{b.use.split(' ').slice(0, 3).join(' ')}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.textSec }}>{b.year}</td>
                  <td style={{ padding: '5px 8px', color: b.icma ? T.green : T.textMut }}>{b.icma ? '✓' : '–'}</td>
                  <td style={{ padding: '5px 8px', color: b.taxonomyAligned ? T.green : T.red }}>{b.taxonomyAligned ? '✓ Aligned' : '✗ Not'}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{b.impactKpi}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Alignment Scoring' && (
        <>
          <div style={card}>
            <h2 style={h2}>Three-Test Alignment Framework</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { test: 'Substantial Contribution', abbr: 'SC', desc: 'Activity makes a measurable positive contribution to at least one social objective', criteria: ['Affordable housing units built','Healthcare access improvements','Jobs created in underserved regions','Financial services for unbanked'], color: T.teal },
                { test: 'Do No Significant Harm', abbr: 'DNSH', desc: 'Activity does not significantly harm any other social or environmental objective', criteria: ['No environmental degradation','No supply chain exploitation','No adverse community impact','Minimum wage compliance'], color: T.amber },
                { test: 'Minimum Social Safeguards', abbr: 'MSSC', desc: 'Minimum baseline protections aligned with UN Guiding Principles on Business and Human Rights', criteria: ['UNGP compliance','ILO core conventions','Anti-corruption measures','Tax transparency'], color: T.navy },
              ].map(t => (
                <div key={t.abbr} style={{ background: T.surfaceH, borderRadius: 8, padding: 16, border: `1px solid ${t.color}44` }}>
                  <div style={{ fontWeight: 700, color: t.color, fontSize: 13, marginBottom: 4 }}>{t.test}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, marginBottom: 8 }}>[{t.abbr}]</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{t.desc}</div>
                  {t.criteria.map(c => <div key={c} style={{ fontSize: 10, color: T.textSec, marginBottom: 3 }}>• {c}</div>)}
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <h2 style={h2}>Activity Alignment Score Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ACTIVITIES.map(a => ({ name: a.name.split(' ').slice(0, 2).join(' '), alignment: a.alignmentScore, dnsh: a.dnsScore }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="alignment" name="Alignment Score" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Bar dataKey="dnsh" name="DNSH Score" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Reporting' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="EU Green Bond Std." value="2024" sub="Social activities in scope via EUGBS" color={T.navy} />
            <KpiCard label="SFDR Art. 9 Link" value="Active" sub="Social objective funds — PAI disclosure" color={T.green} />
            <KpiCard label="CSRD Social" value="ESRS S1–S4" sub="4 social ESRS standards in scope" color={T.teal} />
            <KpiCard label="UN SDG Mapping" value="8 SDGs" sub="Covered by Social Taxonomy objectives" color={T.gold} />
          </div>
          <div style={card}>
            <h2 style={h2}>Social Taxonomy Regulatory Landscape</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { reg: 'EU Taxonomy Regulation', status: 'Social criteria under development', stage: 'Draft', impact: 'High', color: T.navy },
                { reg: 'CSRD / ESRS S1–S4', status: 'Mandatory for CSRD in-scope companies from FY2024', stage: 'In Force', impact: 'Critical', color: T.red },
                { reg: 'SFDR PAI Indicators', status: 'Social PAIs mandatory in periodic reporting', stage: 'In Force', impact: 'High', color: T.amber },
                { reg: 'EU Green Bond Standard', status: 'Social use-of-proceeds criteria to be added', stage: 'Pending', impact: 'Medium', color: T.gold },
                { reg: 'UK SDR', status: 'Social sustainability label criteria defined', stage: 'In Force', impact: 'High', color: T.teal },
                { reg: 'UN SDG Alignment', status: 'Voluntary mapping to 17 SDGs encouraged', stage: 'Voluntary', impact: 'Medium', color: T.sage },
              ].map(r => (
                <div key={r.reg} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, border: `1px solid ${r.color}33` }}>
                  <div style={{ fontWeight: 600, color: r.color, fontSize: 12, marginBottom: 6 }}>{r.reg}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{r.status}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Stage: <span style={{ color: r.stage === 'In Force' ? T.green : r.stage === 'Draft' ? T.amber : T.textSec }}>{r.stage}</span></span>
                    <span style={{ fontSize: 10, color: T.textMut }}>Impact: <span style={{ color: r.impact === 'Critical' ? T.red : r.impact === 'High' ? T.amber : T.gold }}>{r.impact}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
