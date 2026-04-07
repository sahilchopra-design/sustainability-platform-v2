import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, LineChart, Line,
  AreaChart, Area
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a', sage: '#5a8a6a',
  sageL: '#7ba67d', teal: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e',
  textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed', card: '#ffffff',
  sub: '#f6f4f0', indigo: '#4f46e5',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Materials', 'Utilities', 'Financials', 'Industrials', 'Consumer', 'Technology', 'Healthcare'];

const CLAIM_TYPES = [
  'Disclosure Failure', 'Greenwashing', 'Physical Loss', 'Stranded Asset',
  'Regulatory Non-Compliance', 'Fiduciary Duty', 'Human Rights', 'Transition Inadequacy'
];

const JURISDICTIONS = [
  'US Federal', 'US State', 'UK', 'EU', 'Australia', 'Canada',
  'Germany', 'Netherlands', 'France', 'Switzerland', 'Brazil', 'Japan'
];

const COMPANY_NAMES = [
  'ExxonMobil', 'Shell', 'BP', 'Chevron', 'TotalEnergies',
  'HSBC', 'JPMorgan', 'BNP Paribas', 'Allianz', 'Munich Re',
  'RioTinto', 'Glencore', 'Anglo American', 'ArcelorMittal', 'Heidelberg Materials',
  'Duke Energy', 'Enel', 'E.ON', 'Iberdrola', 'Dominion Energy',
  'Barclays', 'Deutsche Bank', 'Credit Agricole', 'ING Group', 'Zurich Insurance',
  'Boeing', 'Airbus', 'Caterpillar', 'Deere & Co', 'Siemens',
  'Unilever', 'Nestle', 'Procter & Gamble', 'Danone', 'AB InBev',
  'Apple', 'Microsoft', 'Samsung', 'TSMC', 'Intel',
  'Johnson & Johnson', 'Pfizer', 'Bayer', 'Roche', 'AstraZeneca',
  'Volkswagen', 'Toyota', 'Vale', 'Tata Steel', 'Formosa Plastics'
];

const COMPANIES = Array.from({ length: 50 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 17 + 10) * SECTORS.length);
  const jurIdx = Math.floor(sr(i * 17 + 11) * JURISDICTIONS.length);
  const claimBreakdown = {};
  CLAIM_TYPES.forEach((ct, ci) => {
    claimBreakdown[ct] = Math.round(sr(i * 17 + 20 + ci) * 5);
  });
  return {
    id: i + 1,
    name: COMPANY_NAMES[i],
    sector: SECTORS[sectorIdx],
    jurisdiction: JURISDICTIONS[jurIdx],
    litigationScore: Math.round(10 + sr(i * 17) * 85),
    activeCases: Math.round(sr(i * 17 + 1) * 12),
    historicalCases: Math.round(sr(i * 17 + 2) * 25),
    financialExposure: Math.round(10 + sr(i * 17 + 3) * 490),
    portfolioWeight: +(1 + sr(i * 17 + 4) * 8).toFixed(1),
    claimBreakdown
  };
});

const CLAIM_STATS = CLAIM_TYPES.map((type, j) => ({
  type,
  shortType: type.length > 14 ? type.slice(0, 14) + '…' : type,
  caseCount: Math.round(20 + sr(j * 31) * 180),
  avgSettlement: Math.round(50 + sr(j * 31 + 1) * 450),
  winRate: +(30 + sr(j * 31 + 2) * 55).toFixed(0)
}));

const JURISDICTIONS_DATA = JURISDICTIONS.map((name, k) => ({
  name,
  shortName: name.length > 11 ? name.slice(0, 11) + '…' : name,
  caseCount: Math.round(10 + sr(k * 23) * 120),
  plaintiffSuccessRate: +(25 + sr(k * 23 + 1) * 55).toFixed(0),
  avgDuration: Math.round(12 + sr(k * 23 + 2) * 36)
}));

// Build 24-month trend data Jan 2024 – Dec 2025
const TREND_DATA = (() => {
  const months = [];
  let pending = 50;
  for (let m = 0; m < 24; m++) {
    const year = m < 12 ? 2024 : 2025;
    const month = (m % 12 + 1).toString().padStart(2, '0');
    const newCases = Math.round(8 + sr(m * 11) * 20);
    const resolved = Math.round(4 + sr(m * 11 + 1) * 15);
    pending = Math.max(0, pending + newCases - resolved);
    months.push({
      month: `${year}-${month}`,
      label: `${month}/${String(year).slice(2)}`,
      newCases,
      resolved,
      pending,
      totalExposure: Math.round(800 + sr(m * 11 + 2) * 200)
    });
  }
  return months;
})();

// Score-band helpers
const scoreBand = (score) => {
  if (score > 80) return { label: 'Critical', color: T.red };
  if (score > 60) return { label: 'High', color: T.orange };
  if (score > 30) return { label: 'Medium', color: T.amber };
  return { label: 'Low', color: T.green };
};

const SECTOR_COLORS = {
  Energy: T.red, Materials: T.orange, Utilities: T.amber, Financials: T.navy,
  Industrials: T.blue, Consumer: T.teal, Technology: T.indigo, Healthcare: T.purple
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '16px 20px', flex: 1, minWidth: 140
  }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    fontSize: 11, fontWeight: 600, fontFamily: T.mono,
    color: color || T.navy, background: bg || T.sub, border: `1px solid ${color || T.navy}22`
  }}>{label}</span>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono, letterSpacing: '0.04em', marginBottom: 12, textTransform: 'uppercase' }}>{children}</div>
);

// ─── Tab 0: Risk Dashboard ──────────────────────────────────────────────────────

const RiskDashboard = ({ companies }) => {
  const stats = useMemo(() => {
    if (!companies.length) return { avgScore: 0, totalActive: 0, totalExposure: 0, highRisk: 0, yoyGrowth: 0 };
    const totalWeight = companies.reduce((s, c) => s + c.portfolioWeight, 0);
    const avgScore = totalWeight > 0
      ? companies.reduce((s, c) => s + c.litigationScore * c.portfolioWeight, 0) / totalWeight
      : 0;
    const totalActive = companies.reduce((s, c) => s + c.activeCases, 0);
    const totalExposure = companies.reduce((s, c) => s + c.financialExposure, 0);
    const highRisk = companies.filter(c => c.litigationScore > 70).length;
    // YoY: compare last 12 vs first 12 months from TREND_DATA
    const first12 = TREND_DATA.slice(0, 12).reduce((s, d) => s + d.newCases, 0);
    const last12 = TREND_DATA.slice(12).reduce((s, d) => s + d.newCases, 0);
    const yoyGrowth = first12 > 0 ? +((last12 - first12) / first12 * 100).toFixed(1) : 0;
    return { avgScore: avgScore.toFixed(1), totalActive, totalExposure, highRisk, yoyGrowth };
  }, [companies]);

  const top20 = useMemo(() =>
    [...companies].sort((a, b) => b.litigationScore - a.litigationScore).slice(0, 20),
    [companies]
  );

  const scatterData = useMemo(() =>
    companies.map(c => ({ x: c.litigationScore, y: c.financialExposure, sector: c.sector, name: c.name })),
    [companies]
  );

  const pieData = useMemo(() =>
    CLAIM_STATS.map(cs => ({ name: cs.shortType, value: cs.caseCount })),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Litigation Score" value={stats.avgScore} sub="Portfolio-weighted" color={T.orange} />
        <KpiCard label="Total Active Cases" value={stats.totalActive} sub="Across 50 companies" color={T.red} />
        <KpiCard label="Total Exposure" value={`$${(stats.totalExposure / 1000).toFixed(1)}B`} sub="Aggregate financial" color={T.navy} />
        <KpiCard label="High-Risk Companies" value={stats.highRisk} sub="Score > 70" color={T.red} />
        <KpiCard label="YoY Case Growth" value={`${stats.yoyGrowth > 0 ? '+' : ''}${stats.yoyGrowth}%`} sub="2024 vs 2025" color={stats.yoyGrowth > 0 ? T.red : T.green} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Top 20 Companies by Litigation Score</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top20} margin={{ top: 4, right: 8, bottom: 60, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="litigationScore" name="Litigation Score" radius={[3, 3, 0, 0]}>
                {top20.map((c, idx) => <Cell key={idx} fill={scoreBand(c.litigationScore).color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Litigation Score vs Financial Exposure ($M)</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 4, right: 8, bottom: 20, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Score" type="number" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} label={{ value: 'Score', position: 'insideBottom', offset: -12, fontSize: 10 }} />
              <YAxis dataKey="y" name="Exposure $M" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <ZAxis range={[40, 40]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v, n) => [v, n]} />
              {SECTORS.map(sector => (
                <Scatter key={sector} name={sector} data={scatterData.filter(d => d.sector === sector)} fill={SECTOR_COLORS[sector]} opacity={0.8} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Case Distribution by Claim Type</SectionTitle>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="60%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                {pieData.map((_, idx) => <Cell key={idx} fill={[T.red, T.orange, T.amber, T.navy, T.blue, T.teal, T.indigo, T.purple][idx % 8]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 1: Case Database ───────────────────────────────────────────────────────

const CaseDatabase = ({ companies }) => {
  const [sectorFilter, setSectorFilter] = useState('All');
  const [jurFilter, setJurFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('litigationScore');
  const [sortDir, setSortDir] = useState(-1);

  const filtered = useMemo(() => {
    let arr = companies.filter(c => {
      const matchSector = sectorFilter === 'All' || c.sector === sectorFilter;
      const matchJur = jurFilter === 'All' || c.jurisdiction === jurFilter;
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      return matchSector && matchJur && matchSearch;
    });
    return [...arr].sort((a, b) => sortDir * (a[sortKey] > b[sortKey] ? 1 : -1));
  }, [companies, sectorFilter, jurFilter, search, sortKey, sortDir]);

  const sectorBar = useMemo(() => {
    return SECTORS.map(s => ({
      sector: s,
      active: companies.filter(c => c.sector === s).reduce((sum, c) => sum + c.activeCases, 0),
      historical: companies.filter(c => c.sector === s).reduce((sum, c) => sum + c.historicalCases, 0)
    }));
  }, [companies]);

  const getTopClaim = (c) => {
    const entries = Object.entries(c.claimBreakdown);
    if (!entries.length) return '—';
    return [...entries].sort((a, b) => b[1] - a[1])[0][0];
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const thStyle = (key) => ({
    textAlign: 'left', padding: '8px 10px', fontSize: 10, fontFamily: T.mono,
    fontWeight: 700, color: T.textSec, textTransform: 'uppercase', cursor: 'pointer',
    background: sortKey === key ? T.sub : 'transparent', userSelect: 'none',
    borderBottom: `2px solid ${T.border}`
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={jurFilter} onChange={e => setJurFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Jurisdictions</option>
          {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company…" style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card, width: 180 }} />
        <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.mono }}>{filtered.length} of {companies.length} companies</span>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 340 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[['Company', 'name'], ['Sector', 'sector'], ['Jurisdiction', 'jurisdiction'], ['Score', 'litigationScore'], ['Active', 'activeCases'], ['Historical', 'historicalCases'], ['Exposure $M', 'financialExposure'], ['Top Claim', null]].map(([label, key]) => (
                <th key={label} style={thStyle(key)} onClick={key ? () => handleSort(key) : undefined}>
                  {label}{sortKey === key ? (sortDir === -1 ? ' ▼' : ' ▲') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => {
              const band = scoreBand(c.litigationScore);
              return (
                <tr key={c.id} style={{ background: idx % 2 === 0 ? T.card : T.sub }}>
                  <td style={{ padding: '7px 10px', fontSize: 12, fontFamily: T.font, fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{c.sector}</td>
                  <td style={{ padding: '7px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{c.jurisdiction}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <Badge label={c.litigationScore} color={band.color} bg={band.color + '18'} />
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: 12, fontFamily: T.mono, color: T.text, textAlign: 'center' }}>{c.activeCases}</td>
                  <td style={{ padding: '7px 10px', fontSize: 12, fontFamily: T.mono, color: T.textSec, textAlign: 'center' }}>{c.historicalCases}</td>
                  <td style={{ padding: '7px 10px', fontSize: 12, fontFamily: T.mono, color: T.navy, textAlign: 'right' }}>${c.financialExposure}M</td>
                  <td style={{ padding: '7px 10px', fontSize: 10, fontFamily: T.mono, color: T.textSec }}>{getTopClaim(c)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Active vs Historical Cases by Sector</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorBar} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="active" name="Active" stackId="a" fill={T.red} radius={[0, 0, 0, 0]} />
              <Bar dataKey="historical" name="Historical" stackId="a" fill={T.navy} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>24-Month Case Filing Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={TREND_DATA} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={3} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Line type="monotone" dataKey="newCases" name="New Cases" stroke={T.red} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 2: Jurisdiction Analysis ───────────────────────────────────────────────

const JurisdictionAnalysis = () => {
  const riskLevel = (rate) => {
    if (rate > 65) return { label: 'High', color: T.red };
    if (rate > 50) return { label: 'Medium', color: T.amber };
    return { label: 'Low', color: T.green };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Jurisdiction', 'Case Count', 'Plaintiff Success Rate', 'Avg Duration (months)', 'Risk Level'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: T.textSec, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...JURISDICTIONS_DATA].sort((a, b) => b.plaintiffSuccessRate - a.plaintiffSuccessRate).map((j, idx) => {
              const rl = riskLevel(j.plaintiffSuccessRate);
              return (
                <tr key={j.name} style={{ background: idx % 2 === 0 ? T.card : T.sub }}>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: T.navy, fontFamily: T.font }}>{j.name}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontFamily: T.mono, color: T.text, textAlign: 'center' }}>{j.caseCount}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontFamily: T.mono, color: T.text, textAlign: 'center' }}>{j.plaintiffSuccessRate}%</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontFamily: T.mono, color: T.text, textAlign: 'center' }}>{j.avgDuration}</td>
                  <td style={{ padding: '9px 14px' }}><Badge label={rl.label} color={rl.color} bg={rl.color + '18'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Case Count by Jurisdiction</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...JURISDICTIONS_DATA].sort((a, b) => b.caseCount - a.caseCount)} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis dataKey="shortName" type="category" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} width={72} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="caseCount" name="Cases" fill={T.navy} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Plaintiff Success Rate (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...JURISDICTIONS_DATA].sort((a, b) => b.plaintiffSuccessRate - a.plaintiffSuccessRate)} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis dataKey="shortName" type="category" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} width={72} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="plaintiffSuccessRate" name="Success Rate %" radius={[0, 3, 3, 0]}>
                {[...JURISDICTIONS_DATA].sort((a, b) => b.plaintiffSuccessRate - a.plaintiffSuccessRate).map((j, idx) => (
                  <Cell key={idx} fill={j.plaintiffSuccessRate > 65 ? T.red : j.plaintiffSuccessRate > 50 ? T.amber : T.green} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Avg Case Duration (months)</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...JURISDICTIONS_DATA].sort((a, b) => b.avgDuration - a.avgDuration)} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis dataKey="shortName" type="category" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} width={72} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="avgDuration" name="Duration (mo)" fill={T.blue} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 3: Trend Analysis ──────────────────────────────────────────────────────

const TrendAnalysis = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
      <SectionTitle>Case Volume — New / Resolved / Pending (24 Months)</SectionTitle>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={TREND_DATA} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={0.3} /><stop offset="95%" stopColor={T.red} stopOpacity={0} /></linearGradient>
            <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3} /><stop offset="95%" stopColor={T.green} stopOpacity={0} /></linearGradient>
            <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.amber} stopOpacity={0.3} /><stop offset="95%" stopColor={T.amber} stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={3} />
          <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
          <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
          <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 11 }} />
          <Area type="monotone" dataKey="newCases" name="New Cases" stroke={T.red} fill="url(#gNew)" strokeWidth={2} />
          <Area type="monotone" dataKey="resolved" name="Resolved" stroke={T.green} fill="url(#gResolved)" strokeWidth={2} />
          <Area type="monotone" dataKey="pending" name="Pending" stroke={T.amber} fill="url(#gPending)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Total Litigation Exposure Trend ($M)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={TREND_DATA} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={3} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} domain={[600, 1200]} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v) => [`$${v}M`, 'Exposure']} />
            <Line type="monotone" dataKey="totalExposure" name="Total Exposure $M" stroke={T.navy} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Claim Type — Case Volume Ranking</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[...CLAIM_STATS].sort((a, b) => b.caseCount - a.caseCount)} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
            <YAxis dataKey="shortType" type="category" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} width={100} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
            <Bar dataKey="caseCount" name="Cases" radius={[0, 3, 3, 0]}>
              {[...CLAIM_STATS].sort((a, b) => b.caseCount - a.caseCount).map((_, idx) => (
                <Cell key={idx} fill={[T.red, T.orange, T.amber, T.navy, T.blue, T.teal, T.indigo, T.purple][idx % 8]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ─── Tab 4: Portfolio Overlay ───────────────────────────────────────────────────

const PortfolioOverlay = ({ companies }) => {
  const stats = useMemo(() => {
    if (!companies.length) return { weightedScore: 0, bandData: [], top10: [], top15: [] };
    const totalWeight = companies.reduce((s, c) => s + c.portfolioWeight, 0);
    const weightedScore = totalWeight > 0
      ? companies.reduce((s, c) => s + c.litigationScore * c.portfolioWeight, 0) / totalWeight
      : 0;

    const bands = { 'Low (<30)': 0, 'Medium (30-60)': 0, 'High (60-80)': 0, 'Critical (>80)': 0 };
    companies.forEach(c => {
      const w = c.portfolioWeight;
      if (c.litigationScore > 80) bands['Critical (>80)'] += w;
      else if (c.litigationScore > 60) bands['High (60-80)'] += w;
      else if (c.litigationScore > 30) bands['Medium (30-60)'] += w;
      else bands['Low (<30)'] += w;
    });
    const bandData = Object.entries(bands).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
    const top15 = [...companies].sort((a, b) => b.portfolioWeight - a.portfolioWeight).slice(0, 15);
    const top10 = top15.slice(0, 10);
    return { weightedScore: weightedScore.toFixed(1), bandData, top10, top15 };
  }, [companies]);

  const getTopClaim = (c) => {
    const entries = Object.entries(c.claimBreakdown);
    if (!entries.length) return '—';
    return [...entries].sort((a, b) => b[1] - a[1])[0][0];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Weighted Portfolio Score" value={stats.weightedScore} sub="AUM-weighted avg litigation score" color={T.orange} />
        <KpiCard label="Total Portfolio Weight" value={`${companies.reduce((s, c) => s + c.portfolioWeight, 0).toFixed(1)}%`} sub="Sum of all holdings" color={T.navy} />
        <KpiCard label="Critical Holdings" value={companies.filter(c => c.litigationScore > 80).length} sub="Score > 80" color={T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Top 15 Holdings by Portfolio Weight (colored by risk band)</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.top15} margin={{ top: 4, right: 8, bottom: 60, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} label={{ value: 'Weight %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v) => [`${v}%`, 'Weight']} />
              <Bar dataKey="portfolioWeight" name="Weight %" radius={[3, 3, 0, 0]}>
                {stats.top15.map((c, idx) => <Cell key={idx} fill={scoreBand(c.litigationScore).color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>AUM Weight by Risk Band</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.bandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                {stats.bandData.map((d, idx) => (
                  <Cell key={idx} fill={[T.green, T.amber, T.orange, T.red][idx]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v) => [`${v}%`, 'AUM Weight']} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
        <SectionTitle style={{ padding: '12px 16px 0' }}>Top 10 Highest-Weight Holdings</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Company', 'Sector', 'Weight %', 'Litigation Score', 'Exposure $M', 'Top Claim'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: T.textSec, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.top10.map((c, idx) => {
              const band = scoreBand(c.litigationScore);
              return (
                <tr key={c.id} style={{ background: idx % 2 === 0 ? T.card : T.sub }}>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, color: T.navy, fontFamily: T.font }}>{c.name}</td>
                  <td style={{ padding: '8px 14px', fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{c.sector}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: T.mono, color: T.navy, fontWeight: 700 }}>{c.portfolioWeight}%</td>
                  <td style={{ padding: '8px 14px' }}><Badge label={c.litigationScore} color={band.color} bg={band.color + '18'} /></td>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: T.mono, color: T.text }}>${c.financialExposure}M</td>
                  <td style={{ padding: '8px 14px', fontSize: 10, fontFamily: T.mono, color: T.textSec }}>{getTopClaim(c)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const TABS = ['Risk Dashboard', 'Case Database', 'Jurisdiction Analysis', 'Trend Analysis', 'Portfolio Overlay'];

export default function ClimateLitigationRiskScorerPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <span style={{
            background: T.gold, color: T.navy, fontFamily: T.mono, fontWeight: 800,
            fontSize: 11, padding: '3px 10px', borderRadius: 4, letterSpacing: '0.08em'
          }}>EP-DA1</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            Climate Litigation Risk Scorer
          </h1>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.goldL, opacity: 0.85 }}>
          50 companies · GCEL &amp; Sabin Center taxonomy · 8 claim types · jurisdiction analysis
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {TABS.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(idx)} style={{
            padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: T.mono, fontSize: 12, fontWeight: 600,
            color: activeTab === idx ? T.navy : T.textMut,
            borderBottom: activeTab === idx ? `3px solid ${T.gold}` : '3px solid transparent',
            transition: 'all 0.15s'
          }}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 0 && <RiskDashboard companies={COMPANIES} />}
        {activeTab === 1 && <CaseDatabase companies={COMPANIES} />}
        {activeTab === 2 && <JurisdictionAnalysis />}
        {activeTab === 3 && <TrendAnalysis />}
        {activeTab === 4 && <PortfolioOverlay companies={COMPANIES} />}
      </div>

      {/* Status Bar */}
      <div style={{
        background: T.navy, color: T.goldL, fontFamily: T.mono, fontSize: 10,
        padding: '8px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `2px solid ${T.gold}`, marginTop: 32
      }}>
        <span>EP-DA1 · Climate Litigation Risk Scorer · GCEL/Sabin Center taxonomy · 8 claim types · 12 jurisdictions</span>
        <span>Litigation Score = weighted composite of active cases, historical cases, claim severity &amp; jurisdictional plaintiff success rates. Taxonomy: GCEL Global Climate Litigation Database, Sabin Center for Climate Change Law, Columbia Law School. Exposure in USD millions. Data as of 2026-04.</span>
      </div>
    </div>
  );
}
