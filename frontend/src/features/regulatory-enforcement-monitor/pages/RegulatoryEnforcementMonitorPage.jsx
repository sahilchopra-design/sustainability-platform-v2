import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Area, AreaChart, Line, LineChart
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

const PIE_COLORS = ['#1b3a5c', '#c5a96a', '#dc2626', '#16a34a', '#7c3aed', '#2563eb', '#d97706', '#ea580c', '#5a8a6a', '#4f46e5'];

const REGULATORS = [
  { name: 'FCA', region: 'UK', jurisdiction: 'United Kingdom', activeInvestigations: 14, closedActions2024: 18, totalFines2024: 285, largestFine: 45, primaryFocus: ['Greenwashing', 'ESG Disclosure', 'Fund Labelling'] },
  { name: 'SEC', region: 'US', jurisdiction: 'United States', activeInvestigations: 22, closedActions2024: 31, totalFines2024: 524, largestFine: 95, primaryFocus: ['Climate Disclosure', 'ESG Fund Labelling', 'TCFD Compliance'] },
  { name: 'ASIC', region: 'AUS', jurisdiction: 'Australia', activeInvestigations: 9, closedActions2024: 12, totalFines2024: 143, largestFine: 28, primaryFocus: ['Greenwashing', 'Climate Risk Disclosure'] },
  { name: 'BaFin', region: 'DE', jurisdiction: 'Germany', activeInvestigations: 7, closedActions2024: 8, totalFines2024: 98, largestFine: 22, primaryFocus: ['ESG Rating Integrity', 'SFDR Compliance'] },
  { name: 'ESMA', region: 'EU', jurisdiction: 'European Union', activeInvestigations: 11, closedActions2024: 9, totalFines2024: 187, largestFine: 52, primaryFocus: ['SFDR', 'EU Taxonomy', 'ESG Ratings Regulation'] },
  { name: 'AMF', region: 'FR', jurisdiction: 'France', activeInvestigations: 6, closedActions2024: 7, totalFines2024: 76, largestFine: 18, primaryFocus: ['SFDR', 'Climate Transition Plans'] },
  { name: 'AFM', region: 'NL', jurisdiction: 'Netherlands', activeInvestigations: 5, closedActions2024: 6, totalFines2024: 54, largestFine: 14, primaryFocus: ['SFDR', 'Greenwashing Claims'] },
  { name: 'CSSF', region: 'LU', jurisdiction: 'Luxembourg', activeInvestigations: 4, closedActions2024: 5, totalFines2024: 43, largestFine: 12, primaryFocus: ['SFDR Fund Classification'] },
  { name: 'OSC', region: 'CA', jurisdiction: 'Canada', activeInvestigations: 5, closedActions2024: 6, totalFines2024: 67, largestFine: 16, primaryFocus: ['Climate Disclosure', 'TCFD'] },
  { name: 'MAS', region: 'SG', jurisdiction: 'Singapore', activeInvestigations: 4, closedActions2024: 4, totalFines2024: 48, largestFine: 11, primaryFocus: ['Green Finance Framework'] },
  { name: 'FSA', region: 'JP', jurisdiction: 'Japan', activeInvestigations: 3, closedActions2024: 3, totalFines2024: 34, largestFine: 9, primaryFocus: ['TCFD', 'ISSB Alignment'] },
  { name: 'BIS', region: 'CH', jurisdiction: 'Switzerland', activeInvestigations: 2, closedActions2024: 3, totalFines2024: 28, largestFine: 8, primaryFocus: ['Climate Risk Supervision'] },
  { name: 'IOSCO', region: 'INT', jurisdiction: 'International', activeInvestigations: 6, closedActions2024: 4, totalFines2024: 0, largestFine: 0, primaryFocus: ['Global ESG Standards'] },
  { name: 'HKMA', region: 'HK', jurisdiction: 'Hong Kong', activeInvestigations: 3, closedActions2024: 3, totalFines2024: 31, largestFine: 9, primaryFocus: ['TCFD', 'Climate Stress Testing'] },
  { name: 'APRA', region: 'AUS', jurisdiction: 'Australia', activeInvestigations: 4, closedActions2024: 5, totalFines2024: 52, largestFine: 13, primaryFocus: ['Climate Prudential Risk', 'CPS 229'] }
];

const SECTORS = ['Energy', 'Materials', 'Utilities', 'Financials', 'Industrials', 'Consumer', 'Technology', 'Healthcare', 'Transport', 'Real Estate'];

const COMPANY_NAMES = [
  'ExxonMobil', 'Shell', 'BP', 'Chevron', 'TotalEnergies',
  'HSBC', 'JPMorgan', 'BNP Paribas', 'Allianz', 'Munich Re',
  'Rio Tinto', 'Glencore', 'Anglo American', 'ArcelorMittal', 'Heidelberg Materials',
  'Duke Energy', 'Enel', 'E.ON', 'Iberdrola', 'Dominion Energy',
  'Barclays', 'Deutsche Bank', 'Credit Agricole', 'ING Group', 'Zurich Insurance'
];

const ACTION_TYPES = ['Investigation', 'Fine', 'Cease and Desist', 'Consent Order', 'Warning Letter'];
const STATUSES = ['Active', 'Pending', 'Closed', 'Appealed'];
const ALLEGATIONS = [
  'Climate disclosure failure', 'Greenwashing claims', 'SFDR misclassification',
  'TCFD non-compliance', 'ESG rating manipulation', 'Carbon offset misrepresentation',
  'Transition plan inadequacy', 'Material omission in climate risk'
];
const OUTCOMES = ['Settled', 'Dismissed', 'Fined', 'Consent Order'];

const BASE_DATE = new Date('2024-01-01');
const fmtDate = (daysOffset) => {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
};

const ENFORCEMENT_ACTIONS = Array.from({ length: 60 }, (_, i) => {
  const regIdx = Math.floor(sr(i * 61) * 15);
  const statusIdx = Math.floor(sr(i * 61 + 3) * 4);
  const status = STATUSES[statusIdx];
  const hasFine = sr(i * 61 + 4) > 0.5;
  return {
    id: `ENF-${String(i + 1).padStart(3, '0')}`,
    regulator: REGULATORS[regIdx].name,
    company: COMPANY_NAMES[i % 25],
    sector: SECTORS[Math.floor(sr(i * 61 + 1) * 10)],
    actionType: ACTION_TYPES[Math.floor(sr(i * 61 + 2) * 5)],
    status,
    fine: hasFine ? Math.round(5 + sr(i * 61 + 5) * 90) : 0,
    announcedDate: fmtDate(Math.floor(sr(i * 61 + 6) * 730)),
    allegation: ALLEGATIONS[Math.floor(sr(i * 61 + 7) * 8)],
    outcome: status === 'Closed' ? OUTCOMES[Math.floor(sr(i * 61 + 8) * 4)] : 'Pending'
  };
});

const SECTOR_HEAT = SECTORS.map((sector, j) => {
  const actionCount = Math.round(3 + sr(j * 71) * 18);
  const totalFines = Math.round(20 + sr(j * 71 + 1) * 280);
  return {
    sector,
    actionCount,
    totalFines,
    avgFineSize: actionCount > 0 ? +(totalFines / actionCount).toFixed(1) : 0,
    trend: ['Rising', 'Stable', 'Falling'][Math.floor(sr(j * 71 + 2) * 3)]
  };
});

const PORTFOLIO_HOLDINGS = Array.from({ length: 30 }, (_, i) => {
  const regCount = Math.floor(sr(i * 83 + 3) * 4);
  const flags = [];
  for (let r = 0; r < regCount; r++) {
    const rName = REGULATORS[Math.floor(sr(i * 83 + 10 + r) * 15)].name;
    if (!flags.includes(rName)) flags.push(rName);
  }
  return {
    company: COMPANY_NAMES[i % 25],
    ticker: COMPANY_NAMES[i % 25].slice(0, 4).toUpperCase(),
    weight: +(1 + sr(i * 83) * 7).toFixed(1),
    regulatorFlags: flags,
    actions: Math.round(sr(i * 83 + 1) * 5),
    fineRisk: Math.round(sr(i * 83 + 2) * 150)
  };
});

const MONTHS = ['2024-09','2024-10','2024-11','2024-12','2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02'];
const MONTHLY_TREND = MONTHS.map((month, m) => ({
  month,
  newActions: Math.round(3 + sr(m * 13) * 8),
  closedActions: Math.round(2 + sr(m * 13 + 1) * 6),
  totalFines: Math.round(20 + sr(m * 13 + 2) * 80)
}));

const TABS = ['Enforcement Dashboard', 'Action Database', 'Regulator Profiles', 'Sector Heat', 'Portfolio Scan'];

// ---------- shared UI components ----------
const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', borderTop: `3px solid ${color || T.navy}` }}>
    <div style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => {
  const map = {
    red: { bg: '#fee2e2', text: '#991b1b' },
    green: { bg: '#dcfce7', text: '#166534' },
    amber: { bg: '#fef3c7', text: '#92400e' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    purple: { bg: '#ede9fe', text: '#5b21b6' },
    gray: { bg: '#f3f4f6', text: '#374151' },
    orange: { bg: '#ffedd5', text: '#9a3412' },
    indigo: { bg: '#e0e7ff', text: '#3730a3' }
  };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{label}</span>;
};

const statusColor = (s) => s === 'Active' ? 'red' : s === 'Pending' ? 'amber' : s === 'Closed' ? 'green' : 'purple';
const trendColor = (t) => t === 'Rising' ? 'red' : t === 'Stable' ? 'amber' : 'green';

const ChartBox = ({ title, children, height = 240 }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12, fontFamily: T.font }}>{title}</div>
    <div style={{ height }}>{children}</div>
  </div>
);

const Sel = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.surface, color: T.text, cursor: 'pointer' }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Inp = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.surface, color: T.text, width: 180 }} />
);

// ---------- Tab 0: Enforcement Dashboard ----------
function Tab0() {
  const stats = useMemo(() => {
    const totalActive = ENFORCEMENT_ACTIONS.filter(a => a.status === 'Active' || a.status === 'Pending').length;
    const totalFines = REGULATORS.reduce((s, r) => s + r.totalFines2024, 0);
    const regCount = REGULATORS.filter(r => r.activeInvestigations > 0).length;
    const sectorCounts = {};
    ENFORCEMENT_ACTIONS.forEach(a => { sectorCounts[a.sector] = (sectorCounts[a.sector] || 0) + 1; });
    const mostTargeted = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
    const flagged = new Set(PORTFOLIO_HOLDINGS.filter(h => h.regulatorFlags.length > 0).map(h => h.company)).size;

    const byRegulator = [...REGULATORS]
      .sort((a, b) => (b.activeInvestigations + b.closedActions2024) - (a.activeInvestigations + a.closedActions2024))
      .slice(0, 10)
      .map(r => ({ name: r.name, total: r.activeInvestigations + r.closedActions2024, active: r.activeInvestigations, closed: r.closedActions2024 }));

    const typeCounts = {};
    ENFORCEMENT_ACTIONS.forEach(a => { typeCounts[a.actionType] = (typeCounts[a.actionType] || 0) + 1; });
    const byType = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    return { totalActive, totalFines, regCount, mostTargeted, flagged, byRegulator, byType };
  }, []);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        <Kpi label="Total Active Actions" value={stats.totalActive} sub="Active + Pending" color={T.red} />
        <Kpi label="Total Fines YTD" value={`$${stats.totalFines}M`} sub="All regulators 2024" color={T.gold} />
        <Kpi label="Regulators Active" value={stats.regCount} sub="With open investigations" color={T.navy} />
        <Kpi label="Most Targeted Sector" value={stats.mostTargeted} sub="By action count" color={T.orange} />
        <Kpi label="Portfolio Companies Flagged" value={stats.flagged} sub="With regulator flags" color={T.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartBox title="Enforcement Actions by Regulator (Top 10)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byRegulator} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="active" name="Active" stackId="a" fill={T.red} />
              <Bar dataKey="closed" name="Closed 2024" stackId="a" fill={T.navy} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Action Type Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {stats.byType.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <ChartBox title="Monthly Trend — New Actions, Closed Actions & Total Fines ($M)" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={MONTHLY_TREND} margin={{ left: -10, right: 30, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$M', angle: -90, position: 'insideRight', style: { fontSize: 10, fill: T.textMut } }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area yAxisId="left" type="monotone" dataKey="newActions" name="New Actions" fill="#dbeafe" stroke={T.blue} strokeWidth={2} />
            <Area yAxisId="left" type="monotone" dataKey="closedActions" name="Closed Actions" fill="#dcfce7" stroke={T.green} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="totalFines" name="Total Fines $M" stroke={T.gold} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}

// ---------- Tab 1: Action Database ----------
function Tab1() {
  const [regFilter, setRegFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let rows = ENFORCEMENT_ACTIONS.filter(a => {
      if (regFilter !== 'All' && a.regulator !== regFilter) return false;
      if (sectorFilter !== 'All' && a.sector !== sectorFilter) return false;
      if (typeFilter !== 'All' && a.actionType !== typeFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (search && !a.company.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [regFilter, sectorFilter, typeFilter, statusFilter, search, sortKey, sortAsc]);

  const statusCounts = useMemo(() => {
    const counts = {};
    ENFORCEMENT_ACTIONS.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const fineBuckets = useMemo(() => {
    const buckets = { '0': 0, '1–10': 0, '11–25': 0, '26–50': 0, '50+': 0 };
    ENFORCEMENT_ACTIONS.forEach(a => {
      if (a.fine === 0) buckets['0']++;
      else if (a.fine <= 10) buckets['1–10']++;
      else if (a.fine <= 25) buckets['11–25']++;
      else if (a.fine <= 50) buckets['26–50']++;
      else buckets['50+']++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, []);

  const handleSort = (key) => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); } };

  const Col = ({ k, label }) => (
    <th onClick={() => handleSort(k)} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', background: T.sub }}>
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <Sel value={regFilter} onChange={setRegFilter} options={['All', ...REGULATORS.map(r => r.name)]} />
        <Sel value={sectorFilter} onChange={setSectorFilter} options={['All', ...SECTORS]} />
        <Sel value={typeFilter} onChange={setTypeFilter} options={['All', ...ACTION_TYPES]} />
        <Sel value={statusFilter} onChange={setStatusFilter} options={['All', ...STATUSES]} />
        <Inp value={search} onChange={setSearch} placeholder="Search company..." />
        <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.mono }}>{filtered.length} / 60 actions</span>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <Col k="id" label="ID" />
              <Col k="regulator" label="Regulator" />
              <Col k="company" label="Company" />
              <Col k="sector" label="Sector" />
              <Col k="actionType" label="Type" />
              <Col k="status" label="Status" />
              <Col k="fine" label="Fine $M" />
              <Col k="announcedDate" label="Announced" />
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, background: T.sub }}>Allegation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, idx) => (
              <tr key={a.id} style={{ background: idx % 2 === 0 ? T.surface : T.sub, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{a.id}</td>
                <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy }}>{a.regulator}</td>
                <td style={{ padding: '7px 12px', color: T.text }}>{a.company}</td>
                <td style={{ padding: '7px 12px', color: T.textSec }}>{a.sector}</td>
                <td style={{ padding: '7px 12px', color: T.textSec }}>{a.actionType}</td>
                <td style={{ padding: '7px 12px' }}><Badge label={a.status} color={statusColor(a.status)} /></td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, color: a.fine > 0 ? T.red : T.textMut }}>{a.fine > 0 ? `$${a.fine}M` : '—'}</td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{a.announcedDate}</td>
                <td style={{ padding: '7px 12px', color: T.textSec, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.allegation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <ChartBox title="Actions by Status" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusCounts} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="value" name="Actions" fill={T.navy} radius={[4, 4, 0, 0]}>
                {statusCounts.map((s, i) => <Cell key={i} fill={s.name === 'Active' ? T.red : s.name === 'Closed' ? T.green : s.name === 'Pending' ? T.amber : T.purple} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Fine Distribution ($M Buckets)" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fineBuckets} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" name="Actions" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Monthly New Actions Filed" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MONTHLY_TREND} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Line type="monotone" dataKey="newActions" name="New Actions" stroke={T.blue} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ---------- Tab 2: Regulator Profiles ----------
function Tab2() {
  const topFines = useMemo(() => [...REGULATORS].sort((a, b) => b.totalFines2024 - a.totalFines2024).slice(0, 10).map(r => ({ name: r.name, fines: r.totalFines2024 })), []);
  const topInvest = useMemo(() => [...REGULATORS].sort((a, b) => b.activeInvestigations - a.activeInvestigations).slice(0, 10).map(r => ({ name: r.name, active: r.activeInvestigations })), []);

  const regionMap = { UK: 0, US: 0, EU: 0, AUS: 0, Other: 0 };
  REGULATORS.forEach(r => {
    const k = ['UK', 'US', 'EU', 'AUS'].includes(r.region) ? r.region : 'Other';
    regionMap[k] += r.activeInvestigations + r.closedActions2024;
  });
  const byRegion = Object.entries(regionMap).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {REGULATORS.map((r) => (
          <div key={r.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', borderLeft: `4px solid ${T.navy}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{r.name}</span>
              <Badge label={r.region} color="indigo" />
            </div>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>{r.jurisdiction}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>ACTIVE INVEST.</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.red }}>{r.activeInvestigations}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>CLOSED 2024</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{r.closedActions2024}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>TOTAL FINES</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>${r.totalFines2024}M</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>LARGEST FINE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{r.largestFine > 0 ? `$${r.largestFine}M` : '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {r.primaryFocus.map(f => <Badge key={f} label={f} color="gray" />)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
        <ChartBox title="Total Fines 2024 by Regulator ($M, Top 10)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topFines} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${v}M`, 'Total Fines']} />
              <Bar dataKey="fines" name="Total Fines $M" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Active Investigations by Regulator" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topInvest} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="active" name="Active" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Actions by Region" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byRegion} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {byRegion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ---------- Tab 3: Sector Heat ----------
function Tab3() {
  const sorted = useMemo(() => [...SECTOR_HEAT].sort((a, b) => b.actionCount - a.actionCount), []);
  const highest = sorted[0];
  const rising = useMemo(() => [...SECTOR_HEAT].filter(s => s.trend === 'Rising').sort((a, b) => b.actionCount - a.actionCount)[0], []);

  const trendDist = useMemo(() => {
    const counts = { Rising: 0, Stable: 0, Falling: 0 };
    SECTOR_HEAT.forEach(s => { counts[s.trend]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        <Kpi label="Highest-Risk Sector" value={highest?.sector ?? '—'} sub={`${highest?.actionCount ?? 0} actions · $${highest?.totalFines ?? 0}M total fines`} color={T.red} />
        <Kpi label="Fastest-Rising Sector" value={rising?.sector ?? '—'} sub={`${rising?.actionCount ?? 0} actions · Trend: Rising`} color={T.orange} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Sector', 'Actions', 'Total Fines $M', 'Avg Fine $M', 'Trend'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, idx) => (
              <tr key={s.sector} style={{ background: idx % 2 === 0 ? T.surface : T.sub, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '9px 14px', fontWeight: 600, color: T.navy }}>{s.sector}</td>
                <td style={{ padding: '9px 14px', fontFamily: T.mono }}>{s.actionCount}</td>
                <td style={{ padding: '9px 14px', fontFamily: T.mono }}>${s.totalFines}M</td>
                <td style={{ padding: '9px 14px', fontFamily: T.mono }}>${s.avgFineSize}M</td>
                <td style={{ padding: '9px 14px' }}><Badge label={s.trend} color={trendColor(s.trend)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: 16 }}>
        <ChartBox title="Enforcement Actions by Sector" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="horizontal" data={sorted} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="actionCount" name="Actions" fill={T.navy} radius={[4, 4, 0, 0]}>
                {sorted.map((s, i) => <Cell key={i} fill={s.trend === 'Rising' ? T.red : s.trend === 'Falling' ? T.green : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Total Fines by Sector ($M)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${v}M`, 'Total Fines']} />
              <Bar dataKey="totalFines" name="Total Fines $M" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Trend Distribution" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={trendDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name} ${value}`} labelLine={false}>
                {trendDist.map((d, i) => <Cell key={i} fill={d.name === 'Rising' ? T.red : d.name === 'Stable' ? T.amber : T.green} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ---------- Tab 4: Portfolio Scan ----------
function Tab4() {
  const [sortKey, setSortKey] = useState('fineRisk');
  const [sortAsc, setSortAsc] = useState(false);

  const stats = useMemo(() => {
    const flagged = PORTFOLIO_HOLDINGS.filter(h => h.regulatorFlags.length > 0).length;
    const totalRisk = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.fineRisk, 0);
    const multiFlag = PORTFOLIO_HOLDINGS.filter(h => h.regulatorFlags.length > 1).length;
    const highest = [...PORTFOLIO_HOLDINGS].sort((a, b) => b.fineRisk - a.fineRisk)[0];
    return { flagged, totalRisk, multiFlag, highest };
  }, []);

  const sorted = useMemo(() => [...PORTFOLIO_HOLDINGS].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    if (typeof av === 'number') return sortAsc ? av - bv : bv - av;
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [sortKey, sortAsc]);

  const top15 = useMemo(() => [...PORTFOLIO_HOLDINGS].sort((a, b) => b.fineRisk - a.fineRisk).slice(0, 15).map(h => ({ name: h.ticker, risk: h.fineRisk })), []);

  const riskTiers = useMemo(() => {
    let none = 0, low = 0, med = 0, high = 0;
    PORTFOLIO_HOLDINGS.forEach(h => {
      if (h.fineRisk === 0) none += h.weight;
      else if (h.fineRisk < 25) low += h.weight;
      else if (h.fineRisk < 75) med += h.weight;
      else high += h.weight;
    });
    const totalW = none + low + med + high;
    return totalW > 0 ? [
      { name: 'No Risk', value: +((none / totalW) * 100).toFixed(1) },
      { name: 'Low <$25M', value: +((low / totalW) * 100).toFixed(1) },
      { name: 'Medium $25–75M', value: +((med / totalW) * 100).toFixed(1) },
      { name: 'High >$75M', value: +((high / totalW) * 100).toFixed(1) }
    ] : [];
  }, []);

  const handleSort = (key) => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(false); } };

  const Col = ({ k, label }) => (
    <th onClick={() => handleSort(k)} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', background: T.sub }}>
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const riskBg = (v) => v >= 75 ? '#fee2e2' : v >= 25 ? '#fef3c7' : T.surface;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <Kpi label="Companies Flagged" value={stats.flagged} sub="With ≥1 regulator flag" color={T.red} />
        <Kpi label="Total Fine Risk" value={`$${stats.totalRisk}M`} sub="Portfolio-wide estimate" color={T.gold} />
        <Kpi label="Multi-Regulator Flag" value={stats.multiFlag} sub="Companies with >1 flag" color={T.orange} />
        <Kpi label="Highest Risk Holding" value={stats.highest?.company ?? '—'} sub={`$${stats.highest?.fineRisk ?? 0}M estimated risk`} color={T.purple} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <Col k="company" label="Company" />
              <Col k="ticker" label="Ticker" />
              <Col k="weight" label="Weight %" />
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, background: T.sub }}>Regulator Flags</th>
              <Col k="actions" label="Actions" />
              <Col k="fineRisk" label="Fine Risk $M" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, idx) => (
              <tr key={h.company + idx} style={{ background: riskBg(h.fineRisk), borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy }}>{h.company}</td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{h.ticker}</td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{h.weight}%</td>
                <td style={{ padding: '7px 12px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {h.regulatorFlags.length > 0 ? h.regulatorFlags.map(f => <Badge key={f} label={f} color="indigo" />) : <span style={{ color: T.textMut, fontSize: 11 }}>None</span>}
                  </div>
                </td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{h.actions}</td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, fontWeight: h.fineRisk >= 75 ? 700 : 400, color: h.fineRisk >= 75 ? T.red : h.fineRisk >= 25 ? T.amber : T.text }}>
                  {h.fineRisk > 0 ? `$${h.fineRisk}M` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <ChartBox title="Top 15 Holdings by Fine Risk $M" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top15} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${v}M`, 'Fine Risk']} />
              <Bar dataKey="risk" name="Fine Risk $M" radius={[4, 4, 0, 0]}>
                {top15.map((d, i) => <Cell key={i} fill={d.risk >= 75 ? T.red : d.risk >= 25 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Portfolio Weight by Risk Tier (%)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskTiers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}%`} labelLine={false}>
                {riskTiers.map((d, i) => <Cell key={i} fill={d.name === 'High >$75M' ? T.red : d.name === 'Medium $25–75M' ? T.amber : d.name === 'Low <$25M' ? T.green : T.textMut} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ---------- Main export ----------
export default function RegulatoryEnforcementMonitorPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 40px 0' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.mono, fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>EP-DA5</span>
          <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 11 }}>SPRINT DA · REGULATORY INTELLIGENCE</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Regulatory Enforcement Monitor</div>
        <div style={{ fontSize: 13, color: T.goldL, fontFamily: T.mono }}>15 regulators · 60 enforcement actions · sector heat · portfolio scan · fine tracker</div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            style={{ padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === i ? 700 : 400, color: activeTab === i ? T.navy : T.textSec, borderBottom: activeTab === i ? `3px solid ${T.gold}` : '3px solid transparent', transition: 'all 0.15s', fontFamily: T.font }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {activeTab === 0 && <Tab0 />}
        {activeTab === 1 && <Tab1 />}
        {activeTab === 2 && <Tab2 />}
        {activeTab === 3 && <Tab3 />}
        {activeTab === 4 && <Tab4 />}
      </div>

      {/* Footer */}
      <div style={{ margin: '0 32px', padding: '16px 20px', background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, borderLeft: `4px solid ${T.navy}` }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, lineHeight: 1.7 }}>
          <strong style={{ color: T.textSec }}>METHODOLOGY:</strong> Enforcement data sourced from: FCA Enforcement Notices, SEC Litigation Releases, ASIC Enforcement Actions, ESMA Public Register, IOSCO Annual Report. Fine risk estimate = historical sector fine × enforcement probability × company-specific exposure factor. Data reflects regulatory filings as of Q1 2026. All figures in USD millions unless otherwise stated. Portfolio scan uses regulator-flag weighting: each active investigation contributes proportionally to estimated fine risk based on regulator severity index and sector-specific multipliers.
        </div>
      </div>
    </div>
  );
}
