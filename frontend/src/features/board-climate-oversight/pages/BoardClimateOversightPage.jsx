import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

/* ── PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ── */
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

/* ── Data ── */
const SECTORS = ['Energy','Finance','Technology','Industrials','Consumer','Healthcare','Materials','Utilities','Real Estate','Telecoms'];
const COUNTRIES = ['USA','UK','Germany','France','Japan','Canada','Australia','Netherlands','Sweden','Switzerland'];

const COMPANIES = Array.from({ length: 70 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];
  const boardSize = 8 + Math.floor(sr(i * 3) * 8);
  const climateExpertsOnBoard = Math.floor(sr(i * 11) * 4);
  const boardClimateCommittee = sr(i * 17) > 0.45;
  const ceoClimateKpi = sr(i * 19) > 0.4;
  const climateInExecutiveComp = sr(i * 23) > 0.35;
  const boardMeetingsOnClimate = 1 + Math.floor(sr(i * 29) * 6);
  const climateExpertisePct = parseFloat(((climateExpertsOnBoard / boardSize) * 100).toFixed(1));
  const governanceScore = Math.round(
    (boardClimateCommittee ? 20 : 0) +
    (ceoClimateKpi ? 15 : 0) +
    (climateInExecutiveComp ? 15 : 0) +
    climateExpertisePct * 0.4 +
    boardMeetingsOnClimate * 3 +
    sr(i * 37) * 15
  );
  const carbonNetworkScore = parseFloat((1 + sr(i * 41) * 9).toFixed(1));
  const thirdPartyAudit = sr(i * 43) > 0.5;
  const climateSkillsGap = parseFloat((10 - climateExpertisePct * 0.08 - sr(i * 47) * 3).toFixed(1));
  const govLevel = governanceScore >= 75 ? 'Leader' : governanceScore >= 55 ? 'Advanced' : governanceScore >= 35 ? 'Developing' : 'Laggard';
  return {
    id: i + 1,
    name: `Company ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
    sector, country, boardSize, climateExpertsOnBoard, boardClimateCommittee,
    ceoClimateKpi, climateInExecutiveComp, boardMeetingsOnClimate, climateExpertisePct,
    governanceScore: Math.min(100, governanceScore), carbonNetworkScore,
    thirdPartyAudit, climateSkillsGap: Math.max(0, Math.min(10, climateSkillsGap)), govLevel,
  };
});

const TABS = [
  'Board Overview','Climate Expertise','Committee Structure','Executive Compensation',
  'Meeting Cadence','Governance Scoring','Skills Gap Analysis','Best Practice Leaders',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function BoardClimateOversightPage() {
  const [tab, setTab] = useState(0);
  const [filterSector, setFilterSector] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [minGov, setMinGov] = useState(0);
  const [minExpertise, setMinExpertise] = useState(0);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (filterSector === 'All' || c.sector === filterSector) &&
    (filterCountry === 'All' || c.country === filterCountry) &&
    (filterLevel === 'All' || c.govLevel === filterLevel) &&
    c.governanceScore >= minGov &&
    c.climateExpertisePct >= minExpertise
  ), [filterSector, filterCountry, filterLevel, minGov, minExpertise]);

  const n = Math.max(1, filtered.length);
  const avgGov = (filtered.reduce((a, c) => a + c.governanceScore, 0) / n).toFixed(1);
  const pctCommittee = ((filtered.filter(c => c.boardClimateCommittee).length / n) * 100).toFixed(0);
  const avgExperts = (filtered.reduce((a, c) => a + c.climateExpertsOnBoard, 0) / n).toFixed(1);
  const pctCeoKpi = ((filtered.filter(c => c.ceoClimateKpi).length / n) * 100).toFixed(0);

  /* aggregations by sector */
  const bySector = SECTORS.map(s => {
    const sc = filtered.filter(c => c.sector === s);
    if (!sc.length) return null;
    return {
      sector: s,
      avgGov: parseFloat((sc.reduce((a, c) => a + c.governanceScore, 0) / sc.length).toFixed(1)),
      pctCommittee: parseFloat(((sc.filter(c => c.boardClimateCommittee).length / sc.length) * 100).toFixed(0)),
      pctExecComp: parseFloat(((sc.filter(c => c.climateInExecutiveComp).length / sc.length) * 100).toFixed(0)),
      avgExpertise: parseFloat((sc.reduce((a, c) => a + c.climateExpertisePct, 0) / sc.length).toFixed(1)),
      avgMeetings: parseFloat((sc.reduce((a, c) => a + c.boardMeetingsOnClimate, 0) / sc.length).toFixed(1)),
      avgGap: parseFloat((sc.reduce((a, c) => a + c.climateSkillsGap, 0) / sc.length).toFixed(1)),
    };
  }).filter(Boolean);

  const byCountry = COUNTRIES.map(cn => {
    const cc = filtered.filter(c => c.country === cn);
    if (!cc.length) return null;
    return {
      country: cn,
      pctExecComp: parseFloat(((cc.filter(c => c.climateInExecutiveComp).length / cc.length) * 100).toFixed(0)),
    };
  }).filter(Boolean);

  const scatterData = filtered.map(c => ({ x: c.climateExpertsOnBoard, y: c.governanceScore, name: c.name }));

  const leaders = [...filtered].sort((a, b) => b.governanceScore - a.governanceScore).slice(0, 10);

  const sel = { background: T.indigo, color: '#fff', border: `1px solid ${T.indigo}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>EP-DK1 · SPRINT DK</div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Board Climate Oversight</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>70 companies · Board composition · Climate governance scoring · Committee tracking</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', SECTORS, filterSector, setFilterSector], ['Country', COUNTRIES, filterCountry, setFilterCountry], ['Level', ['Laggard','Developing','Advanced','Leader'], filterLevel, setFilterLevel]].map(([label, opts, val, set]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}:</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min Gov Score: {minGov}</span>
          <input type="range" min={0} max={100} value={minGov} onChange={e => setMinGov(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min Expertise %: {minExpertise}</span>
          <input type="range" min={0} max={50} value={minExpertise} onChange={e => setMinExpertise(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} / {COMPANIES.length} companies</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Governance Score" value={avgGov} sub="out of 100" color={T.indigo} />
        <KpiCard label="% With Climate Committee" value={`${pctCommittee}%`} sub="of filtered companies" color={T.teal} />
        <KpiCard label="Avg Climate Experts" value={avgExperts} sub="per board" color={T.gold} />
        <KpiCard label="% CEO Climate KPI" value={`${pctCeoKpi}%`} sub="CEO compensation linked" color={T.green} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 40px' }}>

        {/* Tab 0: Board Overview */}
        {tab === 0 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Board Overview — {filtered.length} Companies</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Company','Sector','Country','Board Size','Climate Experts','Committee','CEO KPI','Exec Comp','Gov Score','Level'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 25).map((c, i) => (
                      <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '9px 12px' }}>{c.sector}</td>
                        <td style={{ padding: '9px 12px' }}>{c.country}</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.boardSize}</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.climateExpertsOnBoard}</td>
                        <td style={{ padding: '9px 12px' }}><span style={{ color: c.boardClimateCommittee ? T.green : T.red, fontWeight: 600 }}>{c.boardClimateCommittee ? 'Yes' : 'No'}</span></td>
                        <td style={{ padding: '9px 12px' }}><span style={{ color: c.ceoClimateKpi ? T.green : T.red, fontWeight: 600 }}>{c.ceoClimateKpi ? 'Yes' : 'No'}</span></td>
                        <td style={{ padding: '9px 12px' }}><span style={{ color: c.climateInExecutiveComp ? T.green : T.red, fontWeight: 600 }}>{c.climateInExecutiveComp ? 'Yes' : 'No'}</span></td>
                        <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.governanceScore >= 75 ? T.green : c.governanceScore >= 55 ? T.teal : c.governanceScore >= 35 ? T.amber : T.red }}>{c.governanceScore}</td>
                        <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.govLevel === 'Leader' ? '#dcfce7' : c.govLevel === 'Advanced' ? '#dbeafe' : c.govLevel === 'Developing' ? '#fef9c3' : '#fee2e2', color: c.govLevel === 'Leader' ? T.green : c.govLevel === 'Advanced' ? T.blue : c.govLevel === 'Developing' ? T.amber : T.red }}>{c.govLevel}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Climate Expertise */}
        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Climate Expertise % by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bySector} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Expertise']} />
                  <Bar dataKey="avgExpertise" fill={T.indigo} radius={[4,4,0,0]} name="Avg Expertise %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Climate Experts vs Governance Score</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Climate Experts" label={{ value: 'Experts on Board', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Gov Score" label={{ value: 'Gov Score', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div><div>Experts: {payload[0].payload.x}</div><div>Gov Score: {payload[0].payload.y}</div></div> : null} />
                  <Scatter data={scatterData} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Committee Structure */}
        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Climate Committee Prevalence by Sector (%)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bySector} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'With Committee']} />
                <Bar dataKey="pctCommittee" fill={T.teal} radius={[4,4,0,0]} name="% With Committee">
                  {bySector.map((entry, index) => <Cell key={index} fill={entry.pctCommittee >= 60 ? T.green : entry.pctCommittee >= 40 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 3: Executive Compensation */}
        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Climate in Executive Compensation by Country (%)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byCountry} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Climate in Exec Comp']} />
                <Bar dataKey="pctExecComp" fill={T.gold} radius={[4,4,0,0]} name="% With Exec Comp Link" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 4: Meeting Cadence */}
        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Board Climate Meetings per Year by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bySector} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}`, 'Avg Meetings/yr']} />
                <Bar dataKey="avgMeetings" fill={T.purple} radius={[4,4,0,0]} name="Avg Meetings/yr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 5: Governance Scoring */}
        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Average Governance Score by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...bySector].sort((a, b) => b.avgGov - a.avgGov)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={v => [`${v}`, 'Avg Gov Score']} />
                <Bar dataKey="avgGov" radius={[4,4,0,0]} name="Avg Gov Score">
                  {[...bySector].sort((a, b) => b.avgGov - a.avgGov).map((entry, index) => <Cell key={index} fill={entry.avgGov >= 70 ? T.green : entry.avgGov >= 50 ? T.teal : entry.avgGov >= 35 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 6: Skills Gap Analysis */}
        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Climate Skills Gap by Sector (0-10, lower is better)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...bySector].sort((a, b) => b.avgGap - a.avgGap)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip formatter={v => [`${v}`, 'Avg Skills Gap']} />
                <Bar dataKey="avgGap" radius={[4,4,0,0]} name="Avg Skills Gap">
                  {[...bySector].sort((a, b) => b.avgGap - a.avgGap).map((entry, index) => <Cell key={index} fill={entry.avgGap >= 7 ? T.red : entry.avgGap >= 5 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 7: Best Practice Leaders */}
        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Top 10 Governance Leaders</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rank','Company','Sector','Country','Gov Score','Expertise %','Committee','CEO KPI','Exec Comp','Audit'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaders.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '10px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>#{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px' }}>{c.sector}</td>
                    <td style={{ padding: '10px 12px' }}>{c.country}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.green }}>{c.governanceScore}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.fontMono }}>{c.climateExpertisePct}%</td>
                    <td style={{ padding: '10px 12px', color: c.boardClimateCommittee ? T.green : T.red }}>{c.boardClimateCommittee ? '✓' : '✗'}</td>
                    <td style={{ padding: '10px 12px', color: c.ceoClimateKpi ? T.green : T.red }}>{c.ceoClimateKpi ? '✓' : '✗'}</td>
                    <td style={{ padding: '10px 12px', color: c.climateInExecutiveComp ? T.green : T.red }}>{c.climateInExecutiveComp ? '✓' : '✗'}</td>
                    <td style={{ padding: '10px 12px', color: c.thirdPartyAudit ? T.green : T.red }}>{c.thirdPartyAudit ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
