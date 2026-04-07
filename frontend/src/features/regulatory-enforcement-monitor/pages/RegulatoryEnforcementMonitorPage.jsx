import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ComposedChart, Area,
  ResponsiveContainer, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ACTION_TYPES = ['Fine', 'Suspension', 'Cease-and-Desist', 'Consent Order', 'Criminal Referral', 'Mandatory Audit', 'Public Censure', 'License Revocation'];
const VIOLATION_CATEGORIES = ['Greenwashing', 'Failure-to-Disclose', 'Data Falsification', 'ESG Rating Manipulation', 'Climate Commitment Breach', 'Proxy Voting Failure', 'Product Mislabeling', 'Market Manipulation', 'Insider Trading on Climate', 'TCFD Non-Compliance'];
const SECTORS = ['Energy', 'Financials', 'Materials', 'Industrials', 'Consumer Staples', 'Utilities', 'Real Estate', 'Technology', 'Transport', 'Healthcare'];
const STATUSES = ['Resolved', 'Ongoing', 'Appealed', 'Dismissed', 'Under Review'];

const REGULATORS_25 = [
  { id: 'SEC', jurisdiction: 'USA', avgFineM: 120, region: 'Americas' },
  { id: 'FCA', jurisdiction: 'UK', avgFineM: 45, region: 'Europe' },
  { id: 'ESMA', jurisdiction: 'EU', avgFineM: 55, region: 'Europe' },
  { id: 'BaFin', jurisdiction: 'Germany', avgFineM: 35, region: 'Europe' },
  { id: 'AFM', jurisdiction: 'Netherlands', avgFineM: 22, region: 'Europe' },
  { id: 'AMF', jurisdiction: 'France', avgFineM: 28, region: 'Europe' },
  { id: 'FINMA', jurisdiction: 'Switzerland', avgFineM: 18, region: 'Europe' },
  { id: 'ASIC', jurisdiction: 'Australia', avgFineM: 30, region: 'Asia-Pac' },
  { id: 'MAS', jurisdiction: 'Singapore', avgFineM: 15, region: 'Asia-Pac' },
  { id: 'HKMA', jurisdiction: 'Hong Kong', avgFineM: 20, region: 'Asia-Pac' },
  { id: 'FSA', jurisdiction: 'Japan', avgFineM: 25, region: 'Asia-Pac' },
  { id: 'FSB', jurisdiction: 'Global', avgFineM: 10, region: 'Global' },
  { id: 'ECB', jurisdiction: 'EU', avgFineM: 60, region: 'Europe' },
  { id: 'PRA', jurisdiction: 'UK', avgFineM: 40, region: 'Europe' },
  { id: 'FRB', jurisdiction: 'USA', avgFineM: 80, region: 'Americas' },
  { id: 'OCC', jurisdiction: 'USA', avgFineM: 70, region: 'Americas' },
  { id: 'CFTC', jurisdiction: 'USA', avgFineM: 90, region: 'Americas' },
  { id: 'EPA', jurisdiction: 'USA', avgFineM: 50, region: 'Americas' },
  { id: 'EFRAG', jurisdiction: 'EU', avgFineM: 8, region: 'Europe' },
  { id: 'CSRD-TF', jurisdiction: 'EU', avgFineM: 12, region: 'Europe' },
  { id: 'ICO', jurisdiction: 'UK', avgFineM: 15, region: 'Europe' },
  { id: 'CMA', jurisdiction: 'UK', avgFineM: 20, region: 'Europe' },
  { id: 'ASA', jurisdiction: 'UK', avgFineM: 5, region: 'Europe' },
  { id: 'ACCC', jurisdiction: 'Australia', avgFineM: 25, region: 'Asia-Pac' },
  { id: 'SEBI', jurisdiction: 'India', avgFineM: 10, region: 'Asia-Pac' },
];

const ENTITY_NAMES_200 = Array.from({ length: 200 }, (_, i) => {
  const n = ['Apex', 'Global', 'Terra', 'Capital', 'Asset', 'Trust', 'Power', 'Energy', 'Fuel', 'Green', 'Eco', 'Carbon', 'Climate', 'Prime', 'First', 'Next', 'Core', 'Peak', 'Clear', 'Net'];
  const s = ['Corp', 'Ltd', 'AG', 'SE', 'PLC', 'Inc', 'GmbH', 'Holdings', 'Group', 'Partners'];
  return `${n[i % n.length]} ${s[i % s.length]} ${Math.floor(i / n.length) > 0 ? Math.floor(i / n.length) + 1 : ''}`.trim();
});

const ENFORCEMENT_ACTIONS = Array.from({ length: 200 }, (_, i) => {
  const regIdx = Math.floor(sr(i * 7 + 4000) * 25);
  const sectorIdx = Math.floor(sr(i * 11 + 4000) * 10);
  const actionTypeIdx = Math.floor(sr(i * 13 + 4000) * 8);
  const violationIdx = Math.floor(sr(i * 17 + 4000) * 10);
  const fineUSD = Math.round((sr(i * 19 + 4000) * 150 + 0.5) * 1e6 * (REGULATORS_25[regIdx].avgFineM / 50));
  const year = 2018 + Math.floor(sr(i * 23 + 4000) * 6);
  const quarter = 1 + Math.floor(sr(i * 29 + 4000) * 4);
  const statusIdx = Math.floor(sr(i * 31 + 4000) * 5);
  const deterrenceScore = Math.round(sr(i * 37 + 4000) * 80 + 10);
  const precLevels = ['High', 'Medium', 'Low'];
  return {
    id: i + 1,
    regulator: REGULATORS_25[regIdx].id,
    jurisdiction: REGULATORS_25[regIdx].jurisdiction,
    entityName: ENTITY_NAMES_200[i],
    entitySector: SECTORS[sectorIdx],
    actionType: ACTION_TYPES[actionTypeIdx],
    violationCategory: VIOLATION_CATEGORIES[violationIdx],
    fineUSD,
    actionDate: `${year}-Q${quarter}`,
    resolutionDate: `${year + 1}-Q${1 + Math.floor(sr(i * 41 + 4000) * 4)}`,
    status: STATUSES[statusIdx],
    deterrenceScore,
    precedentLevel: precLevels[Math.floor(sr(i * 43 + 4000) * 3)],
    repeatOffender: sr(i * 47 + 4000) > 0.75,
    portfolioHolding: sr(i * 53 + 4000) > 0.6,
    year,
  };
});

const PORTFOLIO_HOLDINGS = Array.from({ length: 40 }, (_, p) => {
  const sectorIdx = Math.floor(sr(p * 59 + 5000) * 10);
  const complianceScore = Math.round(sr(p * 61 + 5000) * 70 + 20);
  const actions = ENFORCEMENT_ACTIONS.filter(a => a.portfolioHolding && Math.floor(sr(p * 67 + 5000) * 200) === a.id % 200).length;
  const weight = +(sr(p * 71 + 5000) * 0.05 + 0.005).toFixed(4);
  return {
    id: p + 1,
    name: ENTITY_NAMES_200[p],
    sector: SECTORS[sectorIdx],
    complianceScore,
    enforcementActions: actions,
    weight,
    regulatoryGap: Math.round((100 - complianceScore) * 0.6),
  };
});

const fmtUSD = v => {
  if (!isFinite(v) || isNaN(v)) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};

const riskColor = s => s >= 70 ? T.red : s >= 40 ? T.amber : T.green;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const TABS = ['Enforcement Dashboard', 'Action Database', 'Regulator Intelligence', 'Sector Heat Map', 'Portfolio Compliance', 'Trend Analytics', 'Summary & Export'];

export default function RegulatoryEnforcementMonitorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [regFilter, setRegFilter] = useState([]);
  const [jurFilter, setJurFilter] = useState('All');
  const [violationFilter, setViolationFilter] = useState('All');
  const [actionTypeFilter, setActionTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [repeatOffenderFilter, setRepeatOffenderFilter] = useState(false);
  const [portfolioHoldingFilter, setPortfolioHoldingFilter] = useState(false);
  const [fineMin, setFineMin] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('fineUSD');
  const [sortDir, setSortDir] = useState('desc');
  const [showRegSelect, setShowRegSelect] = useState(false);

  const filtered = useMemo(() => {
    if (!ENFORCEMENT_ACTIONS.length) return [];
    let arr = [...ENFORCEMENT_ACTIONS];
    if (regFilter.length > 0) arr = arr.filter(a => regFilter.includes(a.regulator));
    if (jurFilter !== 'All') arr = arr.filter(a => a.jurisdiction === jurFilter);
    if (violationFilter !== 'All') arr = arr.filter(a => a.violationCategory === violationFilter);
    if (actionTypeFilter !== 'All') arr = arr.filter(a => a.actionType === actionTypeFilter);
    if (statusFilter !== 'All') arr = arr.filter(a => a.status === statusFilter);
    if (repeatOffenderFilter) arr = arr.filter(a => a.repeatOffender);
    if (portfolioHoldingFilter) arr = arr.filter(a => a.portfolioHolding);
    if (search) arr = arr.filter(a => a.entityName.toLowerCase().includes(search.toLowerCase()) || a.regulator.toLowerCase().includes(search.toLowerCase()));
    arr = arr.filter(a => a.fineUSD >= fineMin * 1e6);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [regFilter, jurFilter, violationFilter, actionTypeFilter, statusFilter, repeatOffenderFilter, portfolioHoldingFilter, fineMin, search, sortCol, sortDir]);

  const quarterlyTrend = useMemo(() => {
    const quarters = [];
    for (let yr = 2018; yr <= 2023; yr++) {
      for (let q = 1; q <= 4; q++) {
        const label = `${yr}-Q${q}`;
        const acts = ENFORCEMENT_ACTIONS.filter(a => a.actionDate === label);
        quarters.push({
          period: label,
          count: acts.length,
          totalFineM: Math.round(acts.reduce((s, a) => s + a.fineUSD, 0) / 1e6),
        });
      }
    }
    return quarters;
  }, []);

  const violationDist = useMemo(() => VIOLATION_CATEGORIES.map(vc => ({
    violation: vc.replace('Failure-to-Disclose', 'Fail-to-Disclose').replace('Climate Commitment Breach', 'Climate Breach').replace('Insider Trading on Climate', 'Insider Trading'),
    count: filtered.filter(a => a.violationCategory === vc).length,
    totalFineM: Math.round(filtered.filter(a => a.violationCategory === vc).reduce((s, a) => s + a.fineUSD, 0) / 1e6),
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count), [filtered]);

  const regulatorStats = useMemo(() => REGULATORS_25.map(r => {
    const acts = ENFORCEMENT_ACTIONS.filter(a => a.regulator === r.id);
    const filteredActs = filtered.filter(a => a.regulator === r.id);
    const totalFineM = Math.round(acts.reduce((s, a) => s + a.fineUSD, 0) / 1e6);
    const avgFineM = acts.length ? Math.round(totalFineM / acts.length) : 0;
    return { ...r, actionCount: acts.length, filteredCount: filteredActs.length, totalFineM, avgFineM };
  }).sort((a, b) => b.actionCount - a.actionCount), [filtered]);

  const sectorHeat = useMemo(() => SECTORS.map(s => {
    const acts = filtered.filter(a => a.entitySector === s);
    const fineM = Math.round(acts.reduce((a, x) => a + x.fineUSD, 0) / 1e6);
    const entityCount = 200 / 10;
    const heatScore = entityCount > 0 ? +(acts.length / entityCount).toFixed(2) : 0;
    return { sector: s, count: acts.length, fineM, heatScore };
  }).sort((a, b) => b.heatScore - a.heatScore), [filtered]);

  const portfolioRisk = useMemo(() => {
    const totalWeight = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.weight, 0);
    const portfolioScore = totalWeight > 0 ? PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.weight * h.complianceScore, 0) / totalWeight : 0;
    const riskDist = [
      { range: '0-40', count: PORTFOLIO_HOLDINGS.filter(h => h.complianceScore < 40).length },
      { range: '40-60', count: PORTFOLIO_HOLDINGS.filter(h => h.complianceScore >= 40 && h.complianceScore < 60).length },
      { range: '60-80', count: PORTFOLIO_HOLDINGS.filter(h => h.complianceScore >= 60 && h.complianceScore < 80).length },
      { range: '80-100', count: PORTFOLIO_HOLDINGS.filter(h => h.complianceScore >= 80).length },
    ];
    return { portfolioScore: portfolioScore.toFixed(1), riskDist };
  }, []);

  const yoyFineGrowth = useMemo(() => {
    const yearData = Array.from({ length: 6 }, (_, y) => {
      const yr = 2018 + y;
      const acts = ENFORCEMENT_ACTIONS.filter(a => a.year === yr);
      return { year: yr, totalFineB: +(acts.reduce((s, a) => s + a.fineUSD, 0) / 1e9).toFixed(2), count: acts.length };
    });
    return yearData;
  }, []);

  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const toggleReg = useCallback(r => {
    setRegFilter(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }, []);

  const avgFine = filtered.length ? Math.round(filtered.reduce((s, a) => s + a.fineUSD, 0) / filtered.length) : 0;
  const repeatOffenders = filtered.filter(a => a.repeatOffender).length;
  const deterrenceEff = ENFORCEMENT_ACTIONS.length > 0 ? (1 - repeatOffenders / ENFORCEMENT_ACTIONS.length) * 100 : 0;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: T.navy, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>EP</div>
            <div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>EP-DA5 · Disclosure & Stranded Asset Analytics</div>
              <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>Regulatory Enforcement Monitor</h1>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>200 enforcement actions · 25 regulators · 40 portfolio holdings · enforcement trend analytics · deterrence effectiveness</div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${T.border}`, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '8px 14px', border: 'none', background: activeTab === i ? T.navy : 'transparent', color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, fontSize: 12, whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Entity or regulator..." style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 160 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Violation Category</div>
            <select value={violationFilter} onChange={e => setViolationFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {VIOLATION_CATEGORIES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Action Type</div>
            <select value={actionTypeFilter} onChange={e => setActionTypeFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Status</div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Min Fine ($M): {fineMin}</div>
            <input type="range" min={0} max={100} value={fineMin} onChange={e => setFineMin(+e.target.value)} style={{ width: 90 }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={repeatOffenderFilter} onChange={e => setRepeatOffenderFilter(e.target.checked)} />Repeat Offenders
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={portfolioHoldingFilter} onChange={e => setPortfolioHoldingFilter(e.target.checked)} />Portfolio Holdings
          </label>
          <div style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{filtered.length}/200 actions</div>
        </div>

        {/* Regulator filter chips */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: T.muted }}>REGULATOR FILTER ({REGULATORS_25.length} regulators)</span>
            <button onClick={() => setShowRegSelect(p => !p)} style={{ fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px', background: T.sub, cursor: 'pointer' }}>{showRegSelect ? 'Hide' : 'Show'}</button>
          </div>
          {showRegSelect && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {REGULATORS_25.map(r => (
                <button key={r.id} onClick={() => toggleReg(r.id)} style={{ padding: '2px 9px', fontSize: 10, border: `1px solid ${regFilter.includes(r.id) ? T.navy : T.border}`, borderRadius: 10, background: regFilter.includes(r.id) ? T.navy + '18' : 'transparent', color: regFilter.includes(r.id) ? T.navy : T.muted, cursor: 'pointer', fontWeight: regFilter.includes(r.id) ? 600 : 400 }}>
                  {r.id} ({r.jurisdiction})
                </button>
              ))}
              {regFilter.length > 0 && <button onClick={() => setRegFilter([])} style={{ padding: '2px 8px', fontSize: 10, border: `1px solid ${T.red}`, borderRadius: 10, background: T.red + '15', color: T.red, cursor: 'pointer' }}>Clear All</button>}
            </div>
          )}
        </div>

        {/* ── TAB 0: Enforcement Dashboard ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Actions (Filtered)" value={filtered.length} />
              <KpiCard label="Total Fines" value={fmtUSD(filtered.reduce((s, a) => s + a.fineUSD, 0))} color={T.red} />
              <KpiCard label="Avg Fine" value={fmtUSD(avgFine)} />
              <KpiCard label="Repeat Offenders" value={repeatOffenders} color={T.orange} />
              <KpiCard label="Deterrence Eff." value={`${deterrenceEff.toFixed(1)}%`} color={T.green} />
              <KpiCard label="Portfolio Holdings" value={filtered.filter(a => a.portfolioHolding).length} color={T.amber} />
              <KpiCard label="Regulators Active" value={new Set(filtered.map(a => a.regulator)).size} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Quarterly Enforcement Trend (All Actions)</div>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={quarterlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="period" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Actions" fill={T.navy} radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="totalFineM" name="Fines ($M)" stroke={T.red} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Violation Category Distribution</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={violationDist.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="violation" tick={{ fontSize: 8 }} width={105} />
                    <Tooltip />
                    <Bar dataKey="count" name="Actions" fill={T.indigo} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Action Database ── */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Enforcement Action Database — {filtered.length} records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {[['regulator', 'Regulator'], ['jurisdiction', 'Jur.'], ['entityName', 'Entity'], ['entitySector', 'Sector'], ['actionType', 'Action'], ['violationCategory', 'Violation'], ['fineUSD', 'Fine'], ['actionDate', 'Date'], ['status', 'Status'], ['repeatOffender', 'Repeat'], ['precedentLevel', 'Precedent']].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 7px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.navy : T.text, userSelect: 'none', whiteSpace: 'nowrap', fontSize: 10 }}>
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 7px', fontWeight: 600, color: T.navy }}>{a.regulator}</td>
                      <td style={{ padding: '5px 7px', fontSize: 10 }}>{a.jurisdiction}</td>
                      <td style={{ padding: '5px 7px', fontSize: 10 }}>{a.entityName}</td>
                      <td style={{ padding: '5px 7px', fontSize: 10 }}>{a.entitySector}</td>
                      <td style={{ padding: '5px 7px', fontSize: 9 }}>{a.actionType}</td>
                      <td style={{ padding: '5px 7px', fontSize: 9 }}>{a.violationCategory}</td>
                      <td style={{ padding: '5px 7px', fontWeight: 600, color: T.red }}>{fmtUSD(a.fineUSD)}</td>
                      <td style={{ padding: '5px 7px' }}>{a.actionDate}</td>
                      <td style={{ padding: '5px 7px', fontSize: 10, color: a.status === 'Ongoing' ? T.amber : T.muted }}>{a.status}</td>
                      <td style={{ padding: '5px 7px', textAlign: 'center' }}>{a.repeatOffender ? <span style={{ color: T.red }}>✓</span> : <span style={{ color: T.muted }}>—</span>}</td>
                      <td style={{ padding: '5px 7px', fontWeight: 600, color: a.precedentLevel === 'High' ? T.red : a.precedentLevel === 'Medium' ? T.amber : T.muted, fontSize: 10 }}>{a.precedentLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div style={{ textAlign: 'center', padding: 10, color: T.muted, fontSize: 11 }}>Showing 100 of {filtered.length}</div>}
            </div>
          </div>
        )}

        {/* ── TAB 2: Regulator Intelligence ── */}
        {activeTab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Enforcement Count by Regulator</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={regulatorStats.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="actionCount" name="Total Actions" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="filteredCount" name="Filtered Actions" fill={T.amber} radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Total Fines by Regulator ($M)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={regulatorStats.filter(r => r.totalFineM > 0).slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}M`, 'Total Fines']} />
                  <Bar dataKey="totalFineM" name="Total Fines ($M)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Regulator Intelligence Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Regulator', 'Jurisdiction', 'Region', 'Total Actions', 'Avg Fine', 'Total Fines', 'Filtered Actions'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {regulatorStats.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: T.navy }}>{r.id}</td>
                        <td style={{ padding: '6px 8px' }}>{r.jurisdiction}</td>
                        <td style={{ padding: '6px 8px', color: T.muted }}>{r.region}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.actionCount}</td>
                        <td style={{ padding: '6px 8px' }}>${r.avgFineM}M</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.red }}>${r.totalFineM}M</td>
                        <td style={{ padding: '6px 8px', color: r.filteredCount > 0 ? T.amber : T.muted }}>{r.filteredCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Sector Heat Map ── */}
        {activeTab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Enforcement Heat Score by Sector</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
                {sectorHeat.map(s => (
                  <div key={s.sector} style={{ background: riskColor(s.heatScore * 30) + '15', border: `1px solid ${riskColor(s.heatScore * 30)}40`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4 }}>{s.sector}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: riskColor(s.heatScore * 30) }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>actions</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.red, marginTop: 3 }}>${s.fineM}M</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Actions by Sector</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectorHeat}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Actions" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Fine Volume by Sector ($M)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectorHeat}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Fines']} />
                    <Bar dataKey="fineM" name="Fine Volume ($M)" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Portfolio Compliance ── */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Portfolio Score" value={`${portfolioRisk.portfolioScore}/100`} color={riskColor(100 - +portfolioRisk.portfolioScore)} />
              <KpiCard label="Holdings" value={PORTFOLIO_HOLDINGS.length} />
              <KpiCard label="High Risk (<40)" value={portfolioRisk.riskDist[0]?.count || 0} color={T.red} />
              <KpiCard label="Low Risk (>80)" value={portfolioRisk.riskDist[3]?.count || 0} color={T.green} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Portfolio Holdings Compliance Table</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: T.sub }}>
                        {['#', 'Holding', 'Sector', 'Compliance Score', 'Reg. Gap', 'Weight%', 'Enforcement Actions'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[...PORTFOLIO_HOLDINGS].sort((a, b) => a.complianceScore - b.complianceScore).map((h, i) => (
                        <tr key={h.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '5px 8px' }}>{i + 1}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{h.name}</td>
                          <td style={{ padding: '5px 8px' }}>{h.sector}</td>
                          <td style={{ padding: '5px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 50, height: 5, background: T.border, borderRadius: 3 }}>
                                <div style={{ height: 5, width: `${h.complianceScore}%`, background: riskColor(h.complianceScore), borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 600, color: riskColor(h.complianceScore) }}>{h.complianceScore}</span>
                            </div>
                          </td>
                          <td style={{ padding: '5px 8px', color: h.regulatoryGap > 30 ? T.red : T.amber }}>{h.regulatoryGap}</td>
                          <td style={{ padding: '5px 8px' }}>{(h.weight * 100).toFixed(2)}%</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', color: h.enforcementActions > 0 ? T.red : T.muted }}>{h.enforcementActions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Compliance Score Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={portfolioRisk.riskDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Holdings" radius={[4, 4, 0, 0]}>
                      {portfolioRisk.riskDist.map((d, i) => <Cell key={i} fill={i === 0 ? T.red : i === 1 ? T.amber : i === 2 ? T.teal : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Regulatory Gap by Sector</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={SECTORS.map(s => {
                      const hs = PORTFOLIO_HOLDINGS.filter(h => h.sector === s);
                      return { sector: s, gap: hs.length ? Math.round(hs.reduce((a, h) => a + h.regulatoryGap, 0) / hs.length) : 0 };
                    }).filter(d => d.gap > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={40} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="gap" name="Avg Gap" fill={T.orange} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Trend Analytics ── */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {yoyFineGrowth.length >= 2 && (() => {
                const growth = yoyFineGrowth[yoyFineGrowth.length - 1].totalFineB - yoyFineGrowth[0].totalFineB;
                const cagr = yoyFineGrowth[0].totalFineB > 0 ? (Math.pow(yoyFineGrowth[yoyFineGrowth.length - 1].totalFineB / yoyFineGrowth[0].totalFineB, 1 / 5) - 1) * 100 : 0;
                return (<>
                  <KpiCard label="2023 Total Fines" value={`$${yoyFineGrowth[5]?.totalFineB || 0}B`} color={T.red} />
                  <KpiCard label="Fine CAGR (2018-23)" value={`${cagr.toFixed(1)}%`} color={T.orange} />
                  <KpiCard label="2023 Action Count" value={yoyFineGrowth[5]?.count || 0} />
                </>);
              })()}
              <KpiCard label="High Precedent" value={ENFORCEMENT_ACTIONS.filter(a => a.precedentLevel === 'High').length} color={T.red} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>YoY Fine Growth ($B)</div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={yoyFineGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalFineB" name="Total Fines ($B)" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="count" name="Action Count" stroke={T.navy} strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Action Type Evolution (by Year)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={yoyFineGrowth.map(d => {
                    const yearActs = ENFORCEMENT_ACTIONS.filter(a => a.year === d.year);
                    const obj = { year: d.year };
                    ACTION_TYPES.forEach(at => { obj[at] = yearActs.filter(a => a.actionType === at).length; });
                    return obj;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Fine" stackId="a" fill={T.red} />
                    <Bar dataKey="Suspension" stackId="a" fill={T.orange} />
                    <Bar dataKey="Cease-and-Desist" stackId="a" fill={T.amber} />
                    <Bar dataKey="Consent Order" stackId="a" fill={T.indigo} />
                    <Bar dataKey="Mandatory Audit" stackId="a" fill={T.teal} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Violation Category by Year</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={yoyFineGrowth.map(d => {
                    const yearActs = ENFORCEMENT_ACTIONS.filter(a => a.year === d.year);
                    return { year: d.year, greenwashing: yearActs.filter(a => a.violationCategory === 'Greenwashing').length, disclosure: yearActs.filter(a => a.violationCategory === 'Failure-to-Disclose').length, climate: yearActs.filter(a => a.violationCategory === 'Climate Commitment Breach').length, other: yearActs.filter(a => !['Greenwashing', 'Failure-to-Disclose', 'Climate Commitment Breach'].includes(a.violationCategory)).length };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="greenwashing" stackId="b" name="Greenwashing" fill={T.green} />
                    <Bar dataKey="disclosure" stackId="b" name="Disclosure" fill={T.blue} />
                    <Bar dataKey="climate" stackId="b" name="Climate Breach" fill={T.red} />
                    <Bar dataKey="other" stackId="b" name="Other" fill={T.muted} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Summary & Export ── */}
        {activeTab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              <KpiCard label="Total Actions" value={ENFORCEMENT_ACTIONS.length} />
              <KpiCard label="Total Regulators" value={REGULATORS_25.length} />
              <KpiCard label="Portfolio Holdings" value={PORTFOLIO_HOLDINGS.length} />
              <KpiCard label="Filtered Actions" value={filtered.length} />
              <KpiCard label="Total Fines (All)" value={fmtUSD(ENFORCEMENT_ACTIONS.reduce((s, a) => s + a.fineUSD, 0))} color={T.red} />
              <KpiCard label="Avg Fine (All)" value={fmtUSD(ENFORCEMENT_ACTIONS.length ? ENFORCEMENT_ACTIONS.reduce((s, a) => s + a.fineUSD, 0) / ENFORCEMENT_ACTIONS.length : 0)} />
              <KpiCard label="Repeat Offenders" value={ENFORCEMENT_ACTIONS.filter(a => a.repeatOffender).length} color={T.orange} />
              <KpiCard label="High Precedent" value={ENFORCEMENT_ACTIONS.filter(a => a.precedentLevel === 'High').length} color={T.red} />
              <KpiCard label="Portfolio Compliance" value={`${portfolioRisk.portfolioScore}/100`} color={T.amber} />
              <KpiCard label="Deterrence Eff." value={`${deterrenceEff.toFixed(1)}%`} color={T.green} />
              <KpiCard label="Portfolio Fines" value={fmtUSD(ENFORCEMENT_ACTIONS.filter(a => a.portfolioHolding).reduce((s, a) => s + a.fineUSD, 0))} color={T.amber} />
              <KpiCard label="Most Fined Regulator" value={regulatorStats[0]?.id || '-'} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Top 50 Enforcement Actions by Fine</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Regulator', 'Jur.', 'Entity', 'Sector', 'Action', 'Violation', 'Fine', 'Date', 'Status', 'Repeat', 'Precedent'].map(h => <th key={h} style={{ padding: '5px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ENFORCEMENT_ACTIONS].sort((a, b) => b.fineUSD - a.fineUSD).slice(0, 50).map((a, i) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 7px' }}>{i + 1}</td>
                        <td style={{ padding: '4px 7px', fontWeight: 700, color: T.navy }}>{a.regulator}</td>
                        <td style={{ padding: '4px 7px' }}>{a.jurisdiction}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.entityName}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.entitySector}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.actionType}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.violationCategory}</td>
                        <td style={{ padding: '4px 7px', fontWeight: 600, color: T.red }}>{fmtUSD(a.fineUSD)}</td>
                        <td style={{ padding: '4px 7px' }}>{a.actionDate}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.status}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{a.repeatOffender ? '✓' : '—'}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9, color: a.precedentLevel === 'High' ? T.red : T.muted }}>{a.precedentLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Violation Category Fines ($M)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={violationDist.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="violation" tick={{ fontSize: 8 }} width={105} />
                    <Tooltip formatter={v => [`$${v}M`, 'Fines']} />
                    <Bar dataKey="totalFineM" name="Fines ($M)" fill={T.red} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Action Type Fine Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ACTION_TYPES.map(at => {
                    const acts = ENFORCEMENT_ACTIONS.filter(a => a.actionType === at);
                    return { type: at.split('-')[0], fineM: Math.round(acts.reduce((s, a) => s + a.fineUSD, 0) / 1e6), count: acts.length };
                  }).filter(d => d.count > 0).sort((a, b) => b.fineM - a.fineM)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Fines']} />
                    <Bar dataKey="fineM" name="Fines ($M)" fill={T.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Status Breakdown</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={STATUSES.map(s => ({ status: s, count: ENFORCEMENT_ACTIONS.filter(a => a.status === s).length, fineM: Math.round(ENFORCEMENT_ACTIONS.filter(a => a.status === s).reduce((sum, a) => sum + a.fineUSD, 0) / 1e6) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="status" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Count" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Regulator Region Performance Summary</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Region', 'Regulators', 'Total Actions', 'Total Fines ($M)', 'Avg Fine ($M)', 'Repeat Offenders'].map(h => <th key={h} style={{ padding: '6px 9px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {['Americas', 'Europe', 'Asia-Pac', 'Global'].map((region, i) => {
                    const regIds = REGULATORS_25.filter(r => r.region === region).map(r => r.id);
                    const acts = ENFORCEMENT_ACTIONS.filter(a => regIds.includes(a.regulator));
                    const totalFineM = Math.round(acts.reduce((s, a) => s + a.fineUSD, 0) / 1e6);
                    const avgFineM = acts.length ? Math.round(totalFineM / acts.length) : 0;
                    const repeats = acts.filter(a => a.repeatOffender).length;
                    return (
                      <tr key={region} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 9px', fontWeight: 700 }}>{region}</td>
                        <td style={{ padding: '5px 9px' }}>{regIds.length}</td>
                        <td style={{ padding: '5px 9px', fontWeight: 600 }}>{acts.length}</td>
                        <td style={{ padding: '5px 9px', color: T.red, fontWeight: 600 }}>${totalFineM}M</td>
                        <td style={{ padding: '5px 9px' }}>${avgFineM}M</td>
                        <td style={{ padding: '5px 9px', color: repeats > 10 ? T.red : T.amber }}>{repeats}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Deterrence Effectiveness Analysis</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {SECTORS.slice(0, 8).map(s => {
                  const acts = ENFORCEMENT_ACTIONS.filter(a => a.entitySector === s);
                  const repeats = acts.filter(a => a.repeatOffender).length;
                  const deff = acts.length > 0 ? ((1 - repeats / acts.length) * 100).toFixed(0) : '100';
                  return (
                    <div key={s} style={{ background: T.sub, borderRadius: 6, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4 }}>{s}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: +deff > 80 ? T.green : +deff > 60 ? T.amber : T.red }}>{deff}%</div>
                      <div style={{ fontSize: 10, color: T.muted }}>Deterrence</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{repeats} repeats / {acts.length} actions</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
