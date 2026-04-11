import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
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
const SECTORS = ['Energy','Finance','Technology','Industrials','Consumer','Healthcare','Materials','Utilities'];
const COUNTRIES = ['USA','UK','Germany','France','Japan','Canada','Australia','Netherlands'];
const RES_TYPES = ['Say on Climate','Net Zero','Disclosure','Board','Exec Pay'];
const OUTCOMES = ['Passed','Failed','Withdrawn','Management Opposed'];
const FILERS = ['CalPERS','NBIM','APG','CDPQ','LGIM','BNP Paribas AM','Amundi','USS'];
const MGMT_RECS = ['For','Against','Abstain'];

const CAMPAIGNS = Array.from({ length: 60 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const resolutionType = RES_TYPES[Math.floor(sr(i * 13) * RES_TYPES.length)];
  const year = 2020 + Math.floor(sr(i * 17) * 5);
  const managementRecommendation = MGMT_RECS[Math.floor(sr(i * 19) * MGMT_RECS.length)];
  const baseSupport = managementRecommendation === 'For' ? 55 : managementRecommendation === 'Abstain' ? 40 : 25;
  const supportPct = parseFloat(Math.min(99, Math.max(5, baseSupport + sr(i * 23) * 35)).toFixed(1));
  const outcome = supportPct >= 50 ? 'Passed' : sr(i * 29) > 0.6 ? 'Withdrawn' : sr(i * 29) > 0.3 ? 'Management Opposed' : 'Failed';
  const filingInvestor = FILERS[Math.floor(sr(i * 31) * FILERS.length)];
  const coFilers = Math.floor(sr(i * 37) * 12);
  const postEngagementCommitment = outcome === 'Passed' ? sr(i * 41) > 0.3 : sr(i * 41) > 0.7;
  const engagementDuration = 2 + Math.floor(sr(i * 43) * 22);
  const issScore = Math.round(30 + sr(i * 47) * 65);
  return {
    id: i + 1,
    companyName: `Co. ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
    sector, country, resolutionType, year, supportPct, outcome, filingInvestor, coFilers,
    managementRecommendation, postEngagementCommitment, engagementDuration, issScore,
  };
});

const TABS = [
  'Campaign Overview','Resolution Types','Vote Outcomes','Support Trends',
  'Investor Coalitions','Management Response','Post-Engagement','ISS Scoring',
];

const YEARS = [2020, 2021, 2022, 2023, 2024];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function ShareholderEngagementPage() {
  const [tab, setTab] = useState(0);
  const [filterSector, setFilterSector] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [minSupport, setMinSupport] = useState(0);
  const [minDuration, setMinDuration] = useState(0);

  const filtered = useMemo(() => CAMPAIGNS.filter(c =>
    (filterSector === 'All' || c.sector === filterSector) &&
    (filterType === 'All' || c.resolutionType === filterType) &&
    (filterOutcome === 'All' || c.outcome === filterOutcome) &&
    (filterYear === 'All' || c.year === +filterYear) &&
    c.supportPct >= minSupport &&
    c.engagementDuration >= minDuration
  ), [filterSector, filterType, filterOutcome, filterYear, minSupport, minDuration]);

  const n = Math.max(1, filtered.length);
  const avgSupport = (filtered.reduce((a, c) => a + c.supportPct, 0) / n).toFixed(1);
  const pctPassed = ((filtered.filter(c => c.outcome === 'Passed').length / n) * 100).toFixed(0);
  const pctCommit = ((filtered.filter(c => c.postEngagementCommitment).length / n) * 100).toFixed(0);

  /* by resolution type */
  const byType = RES_TYPES.map(t => {
    const sc = filtered.filter(c => c.resolutionType === t);
    if (!sc.length) return null;
    return {
      type: t,
      avgSupport: parseFloat((sc.reduce((a, c) => a + c.supportPct, 0) / sc.length).toFixed(1)),
      count: sc.length,
      pctPassed: parseFloat(((sc.filter(c => c.outcome === 'Passed').length / sc.length) * 100).toFixed(0)),
    };
  }).filter(Boolean);

  /* outcomes summary */
  const outcomeData = OUTCOMES.map(o => ({
    outcome: o,
    count: filtered.filter(c => c.outcome === o).length,
  })).filter(d => d.count > 0);

  /* trend by year */
  const trendData = YEARS.map(yr => {
    const sc = CAMPAIGNS.filter(c => c.year === yr);
    return {
      year: yr.toString(),
      avgSupport: sc.length ? parseFloat((sc.reduce((a, c) => a + c.supportPct, 0) / sc.length).toFixed(1)) : 0,
      pctPassed: sc.length ? parseFloat(((sc.filter(c => c.outcome === 'Passed').length / sc.length) * 100).toFixed(0)) : 0,
      count: sc.length,
    };
  });

  /* management rec impact */
  const mgmtData = MGMT_RECS.map(rec => {
    const sc = filtered.filter(c => c.managementRecommendation === rec);
    return {
      rec,
      avgSupport: sc.length ? parseFloat((sc.reduce((a, c) => a + c.supportPct, 0) / sc.length).toFixed(1)) : 0,
      count: sc.length,
    };
  });

  const sel = { background: T.indigo, color: '#fff', border: `1px solid ${T.indigo}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px' }}>
        <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>EP-DK5 · SPRINT DK</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Shareholder Climate Engagement</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>60 campaigns · Say on Climate · Net Zero · Disclosure · Vote outcomes · ISS scoring</div>
      </div>

      {/* Filters */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', SECTORS, filterSector, setFilterSector], ['Type', RES_TYPES, filterType, setFilterType], ['Outcome', OUTCOMES, filterOutcome, setFilterOutcome]].map(([label, opts, val, set]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}:</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Year:</span>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
            <option value="All">All</option>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min Support %: {minSupport}</span>
          <input type="range" min={0} max={80} value={minSupport} onChange={e => setMinSupport(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} / {CAMPAIGNS.length} campaigns</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Campaigns" value={filtered.length} sub="engagement resolutions" color={T.navy} />
        <KpiCard label="Avg Support %" value={`${avgSupport}%`} sub="shareholder votes" color={T.indigo} />
        <KpiCard label="% Passed" value={`${pctPassed}%`} sub="resolutions adopted" color={T.green} />
        <KpiCard label="% Post-Engagement Commit" value={`${pctCommit}%`} sub="with company commitments" color={T.teal} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 32px 40px' }}>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Campaign Overview — {filtered.length} Resolutions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Company','Sector','Type','Year','Support %','Outcome','Filer','Co-Filers','Mgmt Rec','Post-Commit','ISS Score'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.companyName}</td>
                      <td style={{ padding: '9px 12px' }}>{c.sector}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 8, background: '#ede9fe', color: T.indigo }}>{c.resolutionType}</span></td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.year}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.supportPct >= 50 ? T.green : c.supportPct >= 30 ? T.amber : T.red }}>{c.supportPct.toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.outcome === 'Passed' ? '#dcfce7' : c.outcome === 'Withdrawn' ? '#fef9c3' : '#fee2e2', color: c.outcome === 'Passed' ? T.green : c.outcome === 'Withdrawn' ? T.amber : T.red }}>{c.outcome}</span></td>
                      <td style={{ padding: '9px 12px' }}>{c.filingInvestor}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.coFilers}</td>
                      <td style={{ padding: '9px 12px', color: c.managementRecommendation === 'For' ? T.green : c.managementRecommendation === 'Against' ? T.red : T.amber }}>{c.managementRecommendation}</td>
                      <td style={{ padding: '9px 12px', color: c.postEngagementCommitment ? T.green : T.red }}>{c.postEngagementCommitment ? '✓' : '✗'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: c.issScore >= 70 ? T.green : c.issScore >= 50 ? T.teal : T.amber }}>{c.issScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Support % by Resolution Type</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...byType].sort((a, b) => b.avgSupport - a.avgSupport)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={v => [`${v}%`, 'Avg Support']} />
                <Bar dataKey="avgSupport" radius={[4,4,0,0]} name="Avg Support %">
                  {[...byType].sort((a, b) => b.avgSupport - a.avgSupport).map((e, idx) => <Cell key={idx} fill={e.avgSupport >= 50 ? T.green : e.avgSupport >= 35 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Vote Outcomes Breakdown</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={outcomeData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="outcome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}`, 'Campaigns']} />
                <Bar dataKey="count" radius={[4,4,0,0]} name="Campaigns">
                  {outcomeData.map((e, idx) => <Cell key={idx} fill={e.outcome === 'Passed' ? T.green : e.outcome === 'Withdrawn' ? T.amber : e.outcome === 'Management Opposed' ? T.orange : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Support Trends 2020–2024</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgSupport" stroke={T.indigo} strokeWidth={2} name="Avg Support %" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pctPassed" stroke={T.green} strokeWidth={2} name="% Passed" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="count" stroke={T.amber} strokeWidth={2} name="Campaign Count" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Investor Coalition Activity by Filer</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Filing Investor','Campaigns Filed','Avg Support %','% Passed','Avg Co-Filers','Avg ISS Score'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FILERS.map((f, i) => {
                  const fc = filtered.filter(c => c.filingInvestor === f);
                  if (!fc.length) return null;
                  const fn = fc.length;
                  return (
                    <tr key={f} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{f}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{fn}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.teal }}>{(fc.reduce((a, c) => a + c.supportPct, 0) / fn).toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{((fc.filter(c => c.outcome === 'Passed').length / fn) * 100).toFixed(0)}%</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{(fc.reduce((a, c) => a + c.coFilers, 0) / fn).toFixed(1)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{(fc.reduce((a, c) => a + c.issScore, 0) / fn).toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Management Recommendation Impact on Support %</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mgmtData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="rec" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={v => [`${v}%`, 'Avg Support']} />
                <Bar dataKey="avgSupport" radius={[4,4,0,0]} name="Avg Support %">
                  {mgmtData.map((e, idx) => <Cell key={idx} fill={e.rec === 'For' ? T.green : e.rec === 'Abstain' ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Post-Engagement Commitments — {filtered.filter(c => c.postEngagementCommitment).length} of {filtered.length}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company','Sector','Type','Outcome','Support %','Post-Commit','Duration (mo)','ISS Score'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.filter(c => c.postEngagementCommitment).slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.companyName}</td>
                    <td style={{ padding: '9px 12px' }}>{c.sector}</td>
                    <td style={{ padding: '9px 12px' }}>{c.resolutionType}</td>
                    <td style={{ padding: '9px 12px', color: c.outcome === 'Passed' ? T.green : T.red }}>{c.outcome}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.supportPct.toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px', color: T.green, fontWeight: 700 }}>✓ Committed</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.engagementDuration}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.issScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>ISS Scoring — Top Campaigns by ISS Score</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rank','Company','Type','Year','ISS Score','Support %','Outcome','Mgmt Rec','Post-Commit'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.issScore - a.issScore).slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>#{i + 1}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.companyName}</td>
                    <td style={{ padding: '9px 12px' }}>{c.resolutionType}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.year}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.issScore >= 80 ? T.green : c.issScore >= 60 ? T.teal : T.amber }}>{c.issScore}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.supportPct.toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px', color: c.outcome === 'Passed' ? T.green : T.red }}>{c.outcome}</td>
                    <td style={{ padding: '9px 12px', color: c.managementRecommendation === 'For' ? T.green : c.managementRecommendation === 'Against' ? T.red : T.amber }}>{c.managementRecommendation}</td>
                    <td style={{ padding: '9px 12px', color: c.postEngagementCommitment ? T.green : T.textSec }}>{c.postEngagementCommitment ? '✓' : '—'}</td>
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
