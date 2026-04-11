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

const COMPANIES = Array.from({ length: 80 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const eScore = Math.round(20 + sr(i * 13) * 75);
  const sScore = Math.round(20 + sr(i * 17) * 75);
  const gScore = Math.round(20 + sr(i * 19) * 75);
  const esgTotal = Math.round((eScore * 0.33 + sScore * 0.33 + gScore * 0.34));
  const controversies = Math.floor(sr(i * 23) * 8);
  const antiCorruption = parseFloat((1 + sr(i * 29) * 9).toFixed(1));
  const taxTransparency = parseFloat((1 + sr(i * 31) * 9).toFixed(1));
  const executivePay = parseFloat((10 + sr(i * 37) * 390).toFixed(0));
  const whistleblowerPolicy = sr(i * 41) > 0.4;
  const boardDiversity = parseFloat((10 + sr(i * 43) * 55).toFixed(1));
  const shareholderRights = parseFloat((1 + sr(i * 47) * 9).toFixed(1));
  const auditQuality = parseFloat((1 + sr(i * 53) * 9).toFixed(1));
  const lobbyingDisclosure = sr(i * 59) > 0.45;
  const esgTier = esgTotal >= 65 ? 'Top' : esgTotal >= 40 ? 'Mid' : 'Bottom';
  return {
    id: i + 1,
    name: `Corp ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
    sector, country, eScore, sScore, gScore, esgTotal, controversies,
    antiCorruption, taxTransparency, executivePay: +executivePay,
    whistleblowerPolicy, boardDiversity, shareholderRights, auditQuality,
    lobbyingDisclosure, esgTier,
  };
});

const TABS = [
  'ESG Overview','Environmental Score','Social Score','Governance Score',
  'Controversies','Executive Pay','Board Diversity','Shareholder Rights',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function ESGGovernanceScorerPage() {
  const [tab, setTab] = useState(0);
  const [filterSector, setFilterSector] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [minEsg, setMinEsg] = useState(0);
  const [maxControversy, setMaxControversy] = useState(8);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (filterSector === 'All' || c.sector === filterSector) &&
    (filterCountry === 'All' || c.country === filterCountry) &&
    (filterTier === 'All' || c.esgTier === filterTier) &&
    c.esgTotal >= minEsg &&
    c.controversies <= maxControversy
  ), [filterSector, filterCountry, filterTier, minEsg, maxControversy]);

  const n = Math.max(1, filtered.length);
  const avgEsg = (filtered.reduce((a, c) => a + c.esgTotal, 0) / n).toFixed(1);
  const avgG = (filtered.reduce((a, c) => a + c.gScore, 0) / n).toFixed(1);
  const avgCont = (filtered.reduce((a, c) => a + c.controversies, 0) / n).toFixed(1);
  const avgDiv = (filtered.reduce((a, c) => a + c.boardDiversity, 0) / n).toFixed(1);

  const bySector = SECTORS.map(s => {
    const sc = filtered.filter(c => c.sector === s);
    if (!sc.length) return null;
    return {
      sector: s,
      avgE: parseFloat((sc.reduce((a, c) => a + c.eScore, 0) / sc.length).toFixed(1)),
      avgS: parseFloat((sc.reduce((a, c) => a + c.sScore, 0) / sc.length).toFixed(1)),
      avgG: parseFloat((sc.reduce((a, c) => a + c.gScore, 0) / sc.length).toFixed(1)),
      avgDiv: parseFloat((sc.reduce((a, c) => a + c.boardDiversity, 0) / sc.length).toFixed(1)),
      avgPay: parseFloat((sc.reduce((a, c) => a + c.executivePay, 0) / sc.length).toFixed(0)),
    };
  }).filter(Boolean);

  const byCountry = COUNTRIES.map(cn => {
    const cc = filtered.filter(c => c.country === cn);
    if (!cc.length) return null;
    return {
      country: cn,
      avgPay: parseFloat((cc.reduce((a, c) => a + c.executivePay, 0) / cc.length).toFixed(0)),
    };
  }).filter(Boolean);

  const scatterData = filtered.map(c => ({ x: c.gScore, y: c.controversies, name: c.name }));
  const divScatter = filtered.map(c => ({ x: c.boardDiversity, y: c.gScore, name: c.name }));

  const sel = { background: T.indigo, color: '#fff', border: `1px solid ${T.indigo}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px' }}>
        <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>EP-DK3 · SPRINT DK</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>ESG Governance Scorer</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>80 companies · E/S/G decomposition · Controversy tracking · Board diversity · Exec pay analysis</div>
      </div>

      {/* Filters */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', SECTORS, filterSector, setFilterSector], ['Country', COUNTRIES, filterCountry, setFilterCountry], ['Tier', ['Bottom','Mid','Top'], filterTier, setFilterTier]].map(([label, opts, val, set]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}:</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min ESG: {minEsg}</span>
          <input type="range" min={0} max={100} value={minEsg} onChange={e => setMinEsg(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Max Controversies: {maxControversy}</span>
          <input type="range" min={0} max={8} value={maxControversy} onChange={e => setMaxControversy(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} / {COMPANIES.length} companies</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Avg ESG Total" value={avgEsg} sub="E×33% + S×33% + G×34%" color={T.indigo} />
        <KpiCard label="Avg G Score" value={avgG} sub="governance pillar" color={T.navy} />
        <KpiCard label="Avg Controversies" value={avgCont} sub="per company" color={T.red} />
        <KpiCard label="Avg Board Diversity" value={`${avgDiv}%`} sub="gender & minority" color={T.teal} />
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
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>ESG Overview — {filtered.length} Companies</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Company','Sector','Country','E Score','S Score','G Score','ESG Total','Tier','Controversies','Board Div %'].map(h => (
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
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: T.green }}>{c.eScore}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: T.blue }}>{c.sScore}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: T.purple }}>{c.gScore}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.esgTotal >= 65 ? T.green : c.esgTotal >= 40 ? T.teal : T.red }}>{c.esgTotal}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.esgTier === 'Top' ? '#dcfce7' : c.esgTier === 'Mid' ? '#dbeafe' : '#fee2e2', color: c.esgTier === 'Top' ? T.green : c.esgTier === 'Mid' ? T.blue : T.red }}>{c.esgTier}</span></td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: c.controversies >= 5 ? T.red : c.controversies >= 3 ? T.amber : T.green }}>{c.controversies}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.boardDiversity.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>E/S/G Scores by Sector (Stacked)</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={bySector} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgE" name="E Score" fill={T.green} stackId="a" />
                <Bar dataKey="avgS" name="S Score" fill={T.blue} stackId="a" />
                <Bar dataKey="avgG" name="G Score" fill={T.purple} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Average Social Score by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...bySector].sort((a, b) => b.avgS - a.avgS)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={v => [`${v}`, 'Avg S Score']} />
                <Bar dataKey="avgS" fill={T.blue} radius={[4,4,0,0]} name="Avg S Score">
                  {[...bySector].sort((a, b) => b.avgS - a.avgS).map((e, idx) => <Cell key={idx} fill={e.avgS >= 65 ? T.green : e.avgS >= 45 ? T.blue : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg G Score by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...bySector].sort((a, b) => b.avgG - a.avgG)} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={v => [`${v}`, 'Avg G Score']} />
                  <Bar dataKey="avgG" fill={T.purple} radius={[4,4,0,0]} name="Avg G Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>G Score vs Controversies</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="G Score" label={{ value: 'G Score', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Controversies" label={{ value: 'Controversies', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div><div>G Score: {payload[0].payload.x}</div><div>Controversies: {payload[0].payload.y}</div></div> : null} />
                  <Scatter data={scatterData} fill={T.purple} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Controversy Leaders — Top 20 Highest</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company','Sector','Controversies','ESG Total','G Score','Anti-Corruption','Whistleblower','Lobbying Disc'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.controversies - a.controversies).slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '9px 12px' }}>{c.sector}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.controversies >= 5 ? T.red : c.controversies >= 3 ? T.amber : T.green }}>{c.controversies}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.esgTotal}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.gScore}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.antiCorruption.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', color: c.whistleblowerPolicy ? T.green : T.red }}>{c.whistleblowerPolicy ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', color: c.lobbyingDisclosure ? T.green : T.red }}>{c.lobbyingDisclosure ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Executive Pay Ratio by Country (× median worker)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...byCountry].sort((a, b) => b.avgPay - a.avgPay)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}×`, 'Avg Pay Ratio']} />
                <Bar dataKey="avgPay" fill={T.orange} radius={[4,4,0,0]} name="Avg Pay Ratio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Average Board Diversity % by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...bySector].sort((a, b) => b.avgDiv - a.avgDiv)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Avg Board Diversity']} />
                <Bar dataKey="avgDiv" fill={T.teal} radius={[4,4,0,0]} name="Avg Board Diversity %">
                  {[...bySector].sort((a, b) => b.avgDiv - a.avgDiv).map((e, idx) => <Cell key={idx} fill={e.avgDiv >= 40 ? T.green : e.avgDiv >= 25 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Shareholder Rights Score Distribution</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {filtered.slice(0, 24).map(c => (
                <div key={c.id} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{c.sector}</div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 18, fontFamily: T.fontMono, fontWeight: 700, color: c.shareholderRights >= 7 ? T.green : c.shareholderRights >= 5 ? T.teal : T.red }}>{c.shareholderRights.toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>shareholder rights</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontFamily: T.fontMono, fontWeight: 700, color: c.auditQuality >= 7 ? T.green : c.auditQuality >= 5 ? T.blue : T.amber }}>{c.auditQuality.toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>audit quality</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
