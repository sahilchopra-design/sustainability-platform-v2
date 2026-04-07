import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
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

const REG_NAMES = ['FCA', 'SEC', 'ASIC', 'BaFin'];

const PRIMARY_CLAIMS = [
  'Net-Zero by 2040', 'Carbon Neutral Products', '100% Renewable',
  'Science-Based Target', 'Nature Positive', 'Paris Aligned'
];

const AUDIT_RESULTS = ['Verified', 'Partial', 'Misleading', 'False'];

const COMPANY_NAMES_GW = [
  'BP', 'Shell', 'ExxonMobil', 'TotalEnergies', 'Volkswagen',
  'H&M', 'Ryanair', 'Delta Airlines', 'Nestle', 'Unilever',
  'HSBC', 'BlackRock', 'Deutsche Bank', 'BNP Paribas', 'Goldman Sachs',
  'Amazon', 'Apple', 'Google', 'Meta', 'Microsoft',
  'Barclays', 'Lloyds Banking', 'Allianz', 'AXA', 'Zurich Insurance',
  'ArcelorMittal', 'Rio Tinto', 'Glencore', 'Anglo American', 'BHP',
  'Procter & Gamble', 'Danone', 'AB InBev', 'Mars Inc', 'Kraft Heinz',
  'Maersk', 'FedEx', 'UPS', 'DHL', 'Cathay Pacific'
];

const TICKER_LIST = [
  'BP', 'SHEL', 'XOM', 'TTE', 'VOW3', 'HM', 'RYA', 'DAL', 'NESN', 'ULVR',
  'HSBA', 'BLK', 'DBK', 'BNP', 'GS', 'AMZN', 'AAPL', 'GOOGL', 'META', 'MSFT',
  'BARC', 'LLOY', 'ALV', 'CS', 'ZURN', 'MT', 'RIO', 'GLEN', 'AAL', 'BHP',
  'PG', 'BN', 'ABI', 'MARS', 'KHC', 'MAERSK', 'FDX', 'UPS', 'DHL', 'CX'
];

const COMPANIES_GW = Array.from({ length: 40 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 19 + 110) * SECTORS.length);
  const numFlags = Math.floor(sr(i * 19 + 105) * 4) + (sr(i * 19 + 106) > 0.3 ? 1 : 0);
  const flags = REG_NAMES.filter((_, ri) => sr(i * 19 + 107 + ri) > (1 - numFlags / 4));
  const flagsFinal = flags.length === 0 ? [] : flags;
  const claimIdx = Math.floor(sr(i * 19 + 104) * PRIMARY_CLAIMS.length);
  const auditIdx = Math.floor(sr(i * 19 + 3) * 4);
  const claimYear = 2022 + Math.floor(sr(i * 19 + 108) * 3);
  const claimMonth = (Math.floor(sr(i * 19 + 109) * 12) + 1).toString().padStart(2, '0');
  return {
    id: i + 1,
    name: COMPANY_NAMES_GW[i],
    ticker: TICKER_LIST[i],
    sector: SECTORS[sectorIdx],
    gapScore: Math.round(5 + sr(i * 19) * 90),
    enforcementProb: +(sr(i * 19 + 1) * 0.85).toFixed(2),
    fineExposure: Math.round(5 + sr(i * 19 + 2) * 295),
    flags: flagsFinal,
    primaryClaim: PRIMARY_CLAIMS[claimIdx],
    claimDate: `${claimYear}-${claimMonth}-01`,
    auditResult: AUDIT_RESULTS[auditIdx],
    sector: SECTORS[sectorIdx]
  };
});

const REGULATORS = [
  { name: 'FCA', region: 'UK', actions2024: 14, totalFines: 285, avgFine: 20, pending: 6, color: T.navy },
  { name: 'SEC', region: 'US', actions2024: 22, totalFines: 524, avgFine: 24, pending: 11, color: T.blue },
  { name: 'ASIC', region: 'Australia', actions2024: 9, totalFines: 143, avgFine: 16, pending: 4, color: T.teal },
  { name: 'BaFin', region: 'Germany', actions2024: 7, totalFines: 98, avgFine: 14, pending: 3, color: T.purple }
];

const ACTION_TYPES = ['Investigation Opened', 'Fine Issued', 'Warning Letter', 'Consent Order'];
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

// 20 alert feed items
const ALERT_FEED = Array.from({ length: 20 }, (_, i) => {
  const compIdx = Math.floor(sr(i * 37 + 200) * 40);
  const regIdx = Math.floor(sr(i * 37 + 201) * 4);
  const typeIdx = Math.floor(sr(i * 37 + 202) * 4);
  const sevIdx = Math.floor(sr(i * 37 + 203) * 4);
  const daysAgo = Math.round(sr(i * 37 + 204) * 180);
  const d = new Date('2026-04-07');
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toISOString().slice(0, 10);
  const summaries = [
    'Sustainability report claims diverge from verified emissions data by >40%',
    'Net-zero roadmap missing interim 2030 milestones — regulators request clarification',
    'Renewable energy certificates found to be double-counted across subsidiaries',
    'Carbon offset projects lack independent verification, scope disputed',
    'Green bond proceeds allocated to fossil fuel adjacent activities',
    'Product labelling "carbon neutral" lacks third-party audit support',
    'Nature positive claim contradicts biodiversity loss reported in own impact assessment',
    'Science-based target not registered with SBTi; internally labeled as SBT',
    'Paris aligned claim contradicts expansion of coal-related lending portfolio',
    'Transition plan timelines adjusted retroactively without disclosure',
  ];
  return {
    id: i + 1,
    date: dateStr,
    company: COMPANY_NAMES_GW[compIdx],
    regulator: REG_NAMES[regIdx],
    type: ACTION_TYPES[typeIdx],
    summary: summaries[i % summaries.length],
    severity: SEVERITY_LEVELS[sevIdx]
  };
});

// Sector peer data
const SECTOR_PEER = SECTORS.map((sector, si) => {
  const sectorCos = COMPANIES_GW.filter(c => c.sector === sector);
  const count = sectorCos.length;
  const avgGapScore = count > 0
    ? sectorCos.reduce((s, c) => s + c.gapScore, 0) / count
    : 0;
  const topExposure = count > 0
    ? Math.max(...sectorCos.map(c => c.fineExposure))
    : 0;
  return { sector, avgGapScore: +avgGapScore.toFixed(1), count, topExposure };
});

// 18-month fines data (Oct 2024 – Mar 2026)
const MONTHLY_FINES = Array.from({ length: 18 }, (_, m) => {
  const baseDate = new Date('2024-10-01');
  baseDate.setMonth(baseDate.getMonth() + m);
  const year = baseDate.getFullYear();
  const month = (baseDate.getMonth() + 1).toString().padStart(2, '0');
  return {
    month: `${year}-${month}`,
    label: `${month}/${String(year).slice(2)}`,
    FCA: Math.round(5 + sr(m * 41) * 30),
    SEC: Math.round(8 + sr(m * 41 + 1) * 50),
    ASIC: Math.round(3 + sr(m * 41 + 2) * 20),
    BaFin: Math.round(2 + sr(m * 41 + 3) * 15)
  };
});

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

const SectionTitle = ({ children, style: extraStyle }) => (
  <div style={{
    fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono,
    letterSpacing: '0.04em', marginBottom: 12, textTransform: 'uppercase', ...extraStyle
  }}>{children}</div>
);

const gapBand = (score) => {
  if (score > 70) return { label: 'Critical', color: T.red };
  if (score > 50) return { label: 'High', color: T.orange };
  if (score > 25) return { label: 'Medium', color: T.amber };
  return { label: 'Low', color: T.green };
};

const auditColor = (result) => {
  const map = { Verified: T.green, Partial: T.amber, Misleading: T.orange, False: T.red };
  return map[result] || T.navy;
};

const sevColor = (sev) => {
  const map = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green };
  return map[sev] || T.navy;
};

const SECTOR_COLORS = {
  Energy: T.red, Materials: T.orange, Utilities: T.amber, Financials: T.navy,
  Industrials: T.blue, Consumer: T.teal, Technology: T.indigo, Healthcare: T.purple
};

// ─── Tab 0: Exposure Dashboard ─────────────────────────────────────────────────

const ExposureDashboard = ({ companies }) => {
  const stats = useMemo(() => {
    if (!companies.length) return { avgGap: 0, totalFine: 0, activeEnforcement: 0, flagged: 0, highRisk: 0 };
    const avgGap = companies.reduce((s, c) => s + c.gapScore, 0) / companies.length;
    const totalFine = companies.reduce((s, c) => s + c.fineExposure, 0);
    const activeEnforcement = REGULATORS.reduce((s, r) => s + r.pending, 0);
    const flagged = companies.filter(c => c.flags.length > 0).length;
    const highRisk = companies.filter(c => c.gapScore > 70).length;
    return { avgGap: avgGap.toFixed(1), totalFine, activeEnforcement, flagged, highRisk };
  }, [companies]);

  const top20 = useMemo(() =>
    [...companies].sort((a, b) => b.gapScore - a.gapScore).slice(0, 20),
    [companies]
  );

  const bandPie = useMemo(() => {
    const bands = { 'Low (≤25)': 0, 'Medium (26-50)': 0, 'High (51-70)': 0, 'Critical (>70)': 0 };
    companies.forEach(c => {
      if (c.gapScore > 70) bands['Critical (>70)']++;
      else if (c.gapScore > 50) bands['High (51-70)']++;
      else if (c.gapScore > 25) bands['Medium (26-50)']++;
      else bands['Low (≤25)']++;
    });
    return Object.entries(bands).map(([name, value]) => ({ name, value }));
  }, [companies]);

  const sectorExposure = useMemo(() =>
    SECTORS.map(s => ({
      sector: s,
      exposure: companies.filter(c => c.sector === s).reduce((sum, c) => sum + c.fineExposure, 0)
    })).sort((a, b) => b.exposure - a.exposure),
    [companies]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Claim-Reality Gap" value={stats.avgGap} sub="Score 0-100" color={T.orange} />
        <KpiCard label="Total Fine Exposure" value={`$${(stats.totalFine / 1000).toFixed(1)}B`} sub="Aggregate potential fines" color={T.red} />
        <KpiCard label="Active Enforcement" value={stats.activeEnforcement} sub="Pending actions" color={T.amber} />
        <KpiCard label="Companies Flagged" value={stats.flagged} sub="≥1 regulator flag" color={T.navy} />
        <KpiCard label="High-Risk Companies" value={stats.highRisk} sub="Gap Score > 70" color={T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Top 20 Companies by Gap Score</SectionTitle>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={top20} margin={{ top: 4, right: 8, bottom: 60, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="gapScore" name="Gap Score" radius={[3, 3, 0, 0]}>
                {top20.map((c, idx) => <Cell key={idx} fill={gapBand(c.gapScore).color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Gap Score Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={bandPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                {bandPie.map((d, idx) => <Cell key={idx} fill={[T.green, T.amber, T.orange, T.red][idx]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Fine Exposure by Sector ($M)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorExposure} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v) => [`$${v}M`, 'Exposure']} />
            <Bar dataKey="exposure" name="Exposure $M" radius={[3, 3, 0, 0]}>
              {sectorExposure.map((d, idx) => <Cell key={idx} fill={SECTOR_COLORS[d.sector] || T.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Tab 1: Claims Audit ───────────────────────────────────────────────────────

const ClaimsAudit = ({ companies }) => {
  const [regFilter, setRegFilter] = useState('All');
  const [auditFilter, setAuditFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const matchReg = regFilter === 'All' || c.flags.includes(regFilter);
      const matchAudit = auditFilter === 'All' || c.auditResult === auditFilter;
      const matchSector = sectorFilter === 'All' || c.sector === sectorFilter;
      return matchReg && matchAudit && matchSector;
    });
  }, [companies, regFilter, auditFilter, sectorFilter]);

  const auditBar = useMemo(() => {
    if (!companies.length) return AUDIT_RESULTS.map(r => ({ result: r, count: 0 }));
    return AUDIT_RESULTS.map(r => ({
      result: r,
      count: companies.filter(c => c.auditResult === r).length
    }));
  }, [companies]);

  const claimAvgGap = useMemo(() => {
    return PRIMARY_CLAIMS.map(cl => {
      const group = companies.filter(c => c.primaryClaim === cl);
      const avg = group.length > 0
        ? group.reduce((s, c) => s + c.gapScore, 0) / group.length
        : 0;
      return { claim: cl.length > 18 ? cl.slice(0, 18) + '…' : cl, avgGap: +avg.toFixed(1) };
    });
  }, [companies]);

  // Simulated monthly audit counts across 18 months
  const monthlyAudits = useMemo(() =>
    MONTHLY_FINES.map((mf, mi) => ({
      label: mf.label,
      audits: Math.round(3 + sr(mi * 53 + 300) * 6)
    })),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={regFilter} onChange={e => setRegFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Regulators</option>
          {REG_NAMES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Audit Results</option>
          {AUDIT_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMut }}>{filtered.length} of {companies.length}</span>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 320 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Company', 'Primary Claim', 'Audit Result', 'Gap Score', 'Regulator Flags', 'Claim Date'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: T.textSec, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filtered].sort((a, b) => b.gapScore - a.gapScore).map((c, idx) => {
              const band = gapBand(c.gapScore);
              const ac = auditColor(c.auditResult);
              return (
                <tr key={c.id} style={{ background: idx % 2 === 0 ? T.card : T.sub }}>
                  <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.navy, fontFamily: T.font }}>{c.name}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{c.primaryClaim}</td>
                  <td style={{ padding: '8px 12px' }}><Badge label={c.auditResult} color={ac} bg={ac + '18'} /></td>
                  <td style={{ padding: '8px 12px' }}><Badge label={c.gapScore} color={band.color} bg={band.color + '18'} /></td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.flags.length > 0 ? c.flags.map(f => <Badge key={f} label={f} color={T.navy} bg={T.sub} />) : <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>{c.claimDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Audit Outcome Counts</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={auditBar} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="result" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="count" name="Count" radius={[3, 3, 0, 0]}>
                {auditBar.map((d, idx) => <Cell key={idx} fill={auditColor(d.result)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Avg Gap Score by Claim Type</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={[...claimAvgGap].sort((a, b) => b.avgGap - a.avgGap)} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis dataKey="claim" type="category" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} width={110} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="avgGap" name="Avg Gap" fill={T.orange} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Audits Completed (18 Months)</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyAudits} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={3} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Line type="monotone" dataKey="audits" name="Audits" stroke={T.indigo} strokeWidth={2} dot={{ r: 3, fill: T.indigo }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 2: Regulatory Actions ─────────────────────────────────────────────────

const RegulatoryActions = () => {
  const actionTypePie = useMemo(() => {
    const counts = { 'Investigation Opened': 0, 'Fine Issued': 0, 'Warning Letter': 0, 'Consent Order': 0 };
    ALERT_FEED.forEach(a => { if (counts[a.type] !== undefined) counts[a.type]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 Regulator Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {REGULATORS.map(reg => (
          <div key={reg.name} style={{
            background: T.card, border: `2px solid ${reg.color}`, borderRadius: 10,
            padding: '16px 18px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: reg.color, fontFamily: T.mono, marginBottom: 4 }}>{reg.name}</div>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 12 }}>{reg.region}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Actions 2024', reg.actions2024],
                ['Total Fines', `$${reg.totalFines}M`],
                ['Avg Fine', `$${reg.avgFine}M`],
                ['Pending', reg.pending]
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: reg.color, fontFamily: T.mono }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Total Fines by Regulator ($M)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGULATORS} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v) => [`$${v}M`, 'Total Fines']} />
              <Bar dataKey="totalFines" name="Total Fines $M" radius={[3, 3, 0, 0]}>
                {REGULATORS.map((r, idx) => <Cell key={idx} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Actions Count by Regulator (2024)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGULATORS} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="actions2024" name="Actions 2024" radius={[3, 3, 0, 0]}>
                {REGULATORS.map((r, idx) => <Cell key={idx} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Monthly Fines by Regulator — 18 Months ($M)</SectionTitle>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={MONTHLY_FINES} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <defs>
                {REGULATORS.map(r => (
                  <linearGradient key={r.name} id={`g${r.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={r.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={r.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={3} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              {REGULATORS.map(r => (
                <Area key={r.name} type="monotone" dataKey={r.name} stroke={r.color} fill={`url(#g${r.name})`} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Action Type Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={actionTypePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {actionTypePie.map((d, idx) => <Cell key={idx} fill={[T.red, T.orange, T.amber, T.navy][idx % 4]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 3: Peer Comparison ────────────────────────────────────────────────────

const PeerComparison = ({ companies }) => {
  const radarData = useMemo(() =>
    SECTOR_PEER.map(sp => ({ sector: sp.sector.slice(0, 8), avgGapScore: sp.avgGapScore })),
    []
  );

  const groupedBar = useMemo(() =>
    SECTOR_PEER.map(sp => {
      const group = companies.filter(c => c.sector === sp.sector);
      const low = group.filter(c => c.gapScore <= 25).length;
      const med = group.filter(c => c.gapScore > 25 && c.gapScore <= 50).length;
      const high = group.filter(c => c.gapScore > 50 && c.gapScore <= 70).length;
      const crit = group.filter(c => c.gapScore > 70).length;
      return { sector: sp.sector, Low: low, Medium: med, High: high, Critical: crit };
    }),
    [companies]
  );

  const scatterData = useMemo(() =>
    companies.map(c => ({
      x: c.gapScore,
      y: c.enforcementProb,
      sector: c.sector,
      name: c.name
    })),
    [companies]
  );

  const sectorRanking = useMemo(() =>
    [...SECTOR_PEER].sort((a, b) => b.avgGapScore - a.avgGapScore),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Sector Avg Gap Score — Radar</SectionTitle>
          <ResponsiveContainer width="100%" height={290}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={110}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textMut }} />
              <Radar name="Avg Gap Score" dataKey="avgGapScore" stroke={T.orange} fill={T.orange} fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Gap Score Distribution by Sector</SectionTitle>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={groupedBar} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="Low" stackId="a" fill={T.green} />
              <Bar dataKey="Medium" stackId="a" fill={T.amber} />
              <Bar dataKey="High" stackId="a" fill={T.orange} />
              <Bar dataKey="Critical" stackId="a" fill={T.red} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Gap Score vs Enforcement Probability</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 4, right: 8, bottom: 20, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Gap Score" type="number" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} label={{ value: 'Gap Score', position: 'insideBottom', offset: -12, fontSize: 10 }} />
              <YAxis dataKey="y" name="Enforcement Prob" type="number" domain={[0, 1]} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} label={{ value: 'Prob', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <ZAxis range={[40, 40]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} formatter={(v, n) => [typeof v === 'number' ? v.toFixed(2) : v, n]} />
              {SECTORS.map(sector => (
                <Scatter key={sector} name={sector} data={scatterData.filter(d => d.sector === sector)} fill={SECTOR_COLORS[sector]} opacity={0.8} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Sector Ranking — Avg Gap Score</SectionTitle>
          <div style={{ overflow: 'auto', maxHeight: 260 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'Sector', 'Avg Gap', 'Count'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: T.textSec, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorRanking.map((sp, idx) => {
                  const band = gapBand(sp.avgGapScore);
                  return (
                    <tr key={sp.sector} style={{ background: idx % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{idx + 1}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.navy }}>{sp.sector}</td>
                      <td style={{ padding: '7px 10px' }}><Badge label={sp.avgGapScore} color={band.color} bg={band.color + '18'} /></td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{sp.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 4: Alert Feed ─────────────────────────────────────────────────────────

const AlertFeed = () => {
  const [sevFilter, setSevFilter] = useState('All');
  const [regFilter, setRegFilter] = useState('All');

  const filtered = useMemo(() =>
    ALERT_FEED.filter(a => {
      const matchSev = sevFilter === 'All' || a.severity === sevFilter;
      const matchReg = regFilter === 'All' || a.regulator === regFilter;
      return matchSev && matchReg;
    }).sort((a, b) => b.date.localeCompare(a.date)),
    [sevFilter, regFilter]
  );

  const sevBar = useMemo(() => {
    return SEVERITY_LEVELS.map(s => ({
      severity: s,
      count: ALERT_FEED.filter(a => a.severity === s).length
    }));
  }, []);

  const typePie = useMemo(() => {
    const counts = {};
    ALERT_FEED.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Severities</option>
          {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={regFilter} onChange={e => setRegFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.card }}>
          <option value="All">All Regulators</option>
          {REG_NAMES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMut }}>{filtered.length} alerts</span>
      </div>

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
        {filtered.map(alert => {
          const sc = sevColor(alert.severity);
          const regColor = REGULATORS.find(r => r.name === alert.regulator)?.color || T.navy;
          return (
            <div key={alert.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderLeft: `4px solid ${sc}`, borderRadius: 8, padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Badge label={alert.severity} color={sc} bg={sc + '18'} />
                <Badge label={alert.regulator} color={regColor} bg={regColor + '15'} />
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{alert.type}</span>
                <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{alert.date}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{alert.company}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{alert.summary}</div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: T.textMut, fontFamily: T.mono, fontSize: 13 }}>No alerts match current filters.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Alerts by Severity</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevBar} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="severity" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Bar dataKey="count" name="Count" radius={[3, 3, 0, 0]}>
                {sevBar.map((d, idx) => <Cell key={idx} fill={sevColor(d.severity)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Alert Type Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                {typePie.map((d, idx) => <Cell key={idx} fill={[T.red, T.orange, T.amber, T.navy][idx % 4]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, background: T.card, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const TABS = ['Exposure Dashboard', 'Claims Audit', 'Regulatory Actions', 'Peer Comparison', 'Alert Feed'];

export default function GreenwashingExposureMonitorPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <span style={{
            background: T.gold, color: T.navy, fontFamily: T.mono, fontWeight: 800,
            fontSize: 11, padding: '3px 10px', borderRadius: 4, letterSpacing: '0.08em'
          }}>EP-DA2</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            Greenwashing Exposure Monitor
          </h1>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.goldL, opacity: 0.85 }}>
          40 companies · FCA · SEC · ASIC · BaFin · claim-reality gap analysis · enforcement tracker
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
        {activeTab === 0 && <ExposureDashboard companies={COMPANIES_GW} />}
        {activeTab === 1 && <ClaimsAudit companies={COMPANIES_GW} />}
        {activeTab === 2 && <RegulatoryActions />}
        {activeTab === 3 && <PeerComparison companies={COMPANIES_GW} />}
        {activeTab === 4 && <AlertFeed />}
      </div>

      {/* Status Bar / Methodology Footer */}
      <div style={{
        background: T.navy, color: T.goldL, fontFamily: T.mono, fontSize: 10,
        padding: '8px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `2px solid ${T.gold}`, marginTop: 32
      }}>
        <span>EP-DA2 · Greenwashing Exposure Monitor · FCA · SEC · ASIC · BaFin · 4 regulators · 6 claim types</span>
        <span style={{ maxWidth: '70%', textAlign: 'right', lineHeight: 1.5 }}>
          Gap Score = |claimed_reduction − actual_reduction| / actual_reduction × 100. Enforcement probability from Bayesian model: prior (sector base rate) × likelihood (gap score band) × recency factor. Sources: FCA ESG Sourcebook, SEC ESG Risk Alert 2022, ASIC INFO 271, BaFin Sustainable Finance Strategy 2024.
        </span>
      </div>
    </div>
  );
}
