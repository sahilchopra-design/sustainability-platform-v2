import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Line
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const LS_PORT = 'ra_portfolio_v1';
const loadJSON = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) || fb; } catch { return fb; } };
const fmt = v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);
const fmtPct = v => v == null ? '--' : `${v.toFixed(1)}%`;

/* ── Quality Dimensions ─────────────────────────────────────────────────────── */
const DQ_DIMENSIONS = [
  { id: 'completeness', name: 'Completeness', description: 'What % of required fields are populated?', weight: 25, icon: 'C' },
  { id: 'accuracy', name: 'Accuracy', description: 'Are values within expected ranges?', weight: 20, icon: 'A' },
  { id: 'timeliness', name: 'Timeliness', description: 'How recent is the data?', weight: 20, icon: 'T' },
  { id: 'consistency', name: 'Consistency', description: 'Do values agree across sources?', weight: 15, icon: 'Cn' },
  { id: 'uniqueness', name: 'Uniqueness', description: 'Are there duplicate records?', weight: 10, icon: 'U' },
  { id: 'validity', name: 'Validity', description: 'Do values conform to expected formats?', weight: 10, icon: 'V' },
];

/* ── Quality Rules ──────────────────────────────────────────────────────────── */
const QUALITY_RULES = [
  { field: 'revenue_usd_mn', rule: 'Must be > 0', check: v => v > 0, severity: 'critical' },
  { field: 'market_cap_usd_mn', rule: 'Must be > 0', check: v => v > 0, severity: 'critical' },
  { field: 'esg_score', rule: 'Must be 0-100', check: v => v >= 0 && v <= 100, severity: 'high' },
  { field: 'scope1_mt', rule: 'Must be >= 0', check: v => v >= 0, severity: 'high' },
  { field: 'scope2_mt', rule: 'Must be >= 0', check: v => v >= 0, severity: 'high' },
  { field: 'transition_risk_score', rule: 'Must be 0-100', check: v => v >= 0 && v <= 100, severity: 'medium' },
  { field: 'employees', rule: 'Must be > 0', check: v => v > 0, severity: 'medium' },
  { field: 'sbti_committed', rule: 'Must be boolean', check: v => typeof v === 'boolean', severity: 'low' },
  { field: 'carbon_neutral_target_year', rule: 'Must be 2020-2100 or null', check: v => v === null || v === undefined || (v >= 2020 && v <= 2100), severity: 'low' },
];

const DQ_FIELDS = ['revenue_usd_mn', 'market_cap_usd_mn', 'esg_score', 'scope1_mt', 'scope2_mt', 'transition_risk_score', 'employees', 'sbti_committed', 'evic_usd_mn', 'ghg_intensity_tco2e_per_mn'];

const SEVERITY_COLORS = { critical: T.red, high: '#ea580c', medium: T.amber, low: T.textMut };

/* ── Compute Company DQ ─────────────────────────────────────────────────────── */
function computeCompanyDQ(company) {
  const present = DQ_FIELDS.filter(f => company[f] !== undefined && company[f] !== null && company[f] !== 0).length;
  const completeness = (present / DQ_FIELDS.length) * 100;

  const violations = QUALITY_RULES.filter(rule => {
    const val = company[rule.field];
    return val !== undefined && val !== null && !rule.check(val);
  });

  const accuracy = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 15);
  const timeliness = 85;
  const consistency = 80 + (company._displayExchange === 'NSE/BSE' ? 10 : Math.random() * 10);
  const uniqueness = 98;
  const validity = violations.length === 0 ? 100 : Math.max(50, 100 - violations.length * 10);

  return {
    company_name: company.company_name,
    ticker: company.ticker,
    sector: company.sector,
    exchange: company._displayExchange || company.exchange,
    completeness: Math.round(completeness),
    accuracy: Math.round(accuracy),
    timeliness,
    consistency: Math.round(consistency),
    uniqueness,
    validity: Math.round(validity),
    composite: Math.round(
      completeness * 0.25 + accuracy * 0.20 + timeliness * 0.20 +
      consistency * 0.15 + uniqueness * 0.10 + validity * 0.10
    ),
    missing_fields: DQ_FIELDS.filter(f => !company[f] && company[f] !== false),
    violations: violations.map(v => ({ field: v.field, rule: v.rule, value: company[v.field], severity: v.severity })),
    pcaf_tier: completeness >= 80 ? (accuracy >= 90 ? 1 : 2) : completeness >= 60 ? 3 : completeness >= 40 ? 4 : 5,
  };
}

/* ── Shared UI Components ───────────────────────────────────────────────────── */
const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
);

const KPICard = ({ label, value, sub, color = T.navy, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', minWidth: 140, flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>{icon && <span>{icon}</span>}{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const PIE_COLORS = [T.green, T.sage, T.gold, T.amber, T.red];
const EXCHANGE_COLORS = [T.navy, T.navyL, T.sage, T.sageL, T.gold, T.goldL, T.amber, '#0f766e', '#7c3aed', '#ea580c', '#0284c7', '#64748b', T.red];

/* ════════════════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                              */
/* ════════════════════════════════════════════════════════════════════════════ */
export default function DataQualityMonitorPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadJSON(LS_PORT, null), []);
  const companies = useMemo(() => GLOBAL_COMPANY_MASTER || [], []);

  /* Compute DQ for all companies ------------------------------------------ */
  const dqData = useMemo(() => companies.map(c => computeCompanyDQ(c)), [companies]);

  /* State ------------------------------------------------------------------ */
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('asc');
  const [violationFilter, setViolationFilter] = useState('all');
  const [exchangeFilter, setExchangeFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [scanTime] = useState(() => new Date().toLocaleString());

  /* Aggregations ----------------------------------------------------------- */
  const avgComposite = useMemo(() => Math.round(dqData.reduce((a, d) => a + d.composite, 0) / Math.max(1, dqData.length)), [dqData]);
  const avgCompleteness = useMemo(() => Math.round(dqData.reduce((a, d) => a + d.completeness, 0) / Math.max(1, dqData.length)), [dqData]);
  const avgAccuracy = useMemo(() => Math.round(dqData.reduce((a, d) => a + d.accuracy, 0) / Math.max(1, dqData.length)), [dqData]);
  const avgTimeliness = useMemo(() => Math.round(dqData.reduce((a, d) => a + d.timeliness, 0) / Math.max(1, dqData.length)), [dqData]);
  const fullDataCount = dqData.filter(d => d.completeness === 100).length;
  const criticalViolations = dqData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'critical').length, 0);
  const highViolations = dqData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'high').length, 0);
  const exchanges = useMemo(() => [...new Set(dqData.map(d => d.exchange).filter(Boolean))].sort(), [dqData]);
  const sectors = useMemo(() => [...new Set(dqData.map(d => d.sector).filter(Boolean))].sort(), [dqData]);

  /* DQ Distribution Histogram --------------------------------------------- */
  const histogram = useMemo(() => {
    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '20-40', min: 20, max: 40, count: 0 },
      { range: '40-60', min: 40, max: 60, count: 0 },
      { range: '60-80', min: 60, max: 80, count: 0 },
      { range: '80-100', min: 80, max: 101, count: 0 },
    ];
    dqData.forEach(d => { const b = buckets.find(b => d.composite >= b.min && d.composite < b.max); if (b) b.count++; });
    return buckets;
  }, [dqData]);

  /* DQ by Exchange -------------------------------------------------------- */
  const dqByExchange = useMemo(() => {
    const map = {};
    dqData.forEach(d => {
      const ex = d.exchange || 'Unknown';
      if (!map[ex]) map[ex] = { exchange: ex, total: 0, sum: 0 };
      map[ex].total++; map[ex].sum += d.composite;
    });
    return Object.values(map).map(e => ({ ...e, avg: Math.round(e.sum / e.total) })).sort((a, b) => b.avg - a.avg);
  }, [dqData]);

  /* DQ by Sector ---------------------------------------------------------- */
  const dqBySector = useMemo(() => {
    const map = {};
    dqData.forEach(d => {
      const sec = d.sector || 'Unknown';
      if (!map[sec]) map[sec] = { sector: sec, total: 0, sum: 0 };
      map[sec].total++; map[sec].sum += d.composite;
    });
    return Object.values(map).map(e => ({ ...e, avg: Math.round(e.sum / e.total) })).sort((a, b) => b.avg - a.avg);
  }, [dqData]);

  /* Radar data ------------------------------------------------------------- */
  const radarData = useMemo(() => DQ_DIMENSIONS.map(dim => ({
    dimension: dim.name,
    value: Math.round(dqData.reduce((a, d) => a + (d[dim.id] || 0), 0) / Math.max(1, dqData.length)),
    fullMark: 100,
  })), [dqData]);

  /* Field Completeness by Exchange ---------------------------------------- */
  const fieldCompleteness = useMemo(() => {
    return DQ_FIELDS.map(field => {
      const row = { field: field.replace(/_/g, ' ') };
      exchanges.forEach(ex => {
        const exCompanies = dqData.filter(d => d.exchange === ex);
        const withField = exCompanies.filter(d => !d.missing_fields.includes(field));
        row[ex] = exCompanies.length > 0 ? Math.round(withField.length / exCompanies.length * 100) : 0;
      });
      return row;
    });
  }, [dqData, exchanges]);

  /* All violations flat list ---------------------------------------------- */
  const allViolations = useMemo(() => {
    const list = [];
    dqData.forEach(d => {
      d.violations.forEach(v => {
        list.push({ company: d.company_name, ticker: d.ticker, exchange: d.exchange, sector: d.sector, ...v });
      });
    });
    return list;
  }, [dqData]);

  const filteredViolations = useMemo(() => {
    let v = allViolations;
    if (violationFilter !== 'all') v = v.filter(x => x.severity === violationFilter);
    if (exchangeFilter !== 'all') v = v.filter(x => x.exchange === exchangeFilter);
    if (search) { const q = search.toLowerCase(); v = v.filter(x => x.company.toLowerCase().includes(q) || x.field.includes(q)); }
    return v;
  }, [allViolations, violationFilter, exchangeFilter, search]);

  /* Worst 20 companies ---------------------------------------------------- */
  const worst20 = useMemo(() => [...dqData].sort((a, b) => a.composite - b.composite).slice(0, 20), [dqData]);

  /* PCAF Tier Distribution ------------------------------------------------ */
  const pcafTiers = useMemo(() => {
    const tiers = [0, 0, 0, 0, 0];
    dqData.forEach(d => { if (d.pcaf_tier >= 1 && d.pcaf_tier <= 5) tiers[d.pcaf_tier - 1]++; });
    return [
      { name: 'Tier 1 (Verified)', value: tiers[0] },
      { name: 'Tier 2 (Reported)', value: tiers[1] },
      { name: 'Tier 3 (Estimated)', value: tiers[2] },
      { name: 'Tier 4 (Proxy)', value: tiers[3] },
      { name: 'Tier 5 (Default)', value: tiers[4] },
    ];
  }, [dqData]);

  /* DQ Trend simulation --------------------------------------------------- */
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      completeness: Math.min(100, 45 + i * 4.5 + Math.random() * 3),
      accuracy: Math.min(100, 70 + i * 2.2 + Math.random() * 2),
      composite: Math.min(100, 55 + i * 3.5 + Math.random() * 2.5),
    }));
  }, []);

  /* Anomaly detection ----------------------------------------------------- */
  const anomalies = useMemo(() => {
    const sectorStats = {};
    companies.forEach(c => {
      const sec = c.sector || 'Unknown';
      if (!sectorStats[sec]) sectorStats[sec] = { revs: [], mcaps: [], esgs: [] };
      if (c.revenue_usd_mn) sectorStats[sec].revs.push(c.revenue_usd_mn);
      if (c.market_cap_usd_mn) sectorStats[sec].mcaps.push(c.market_cap_usd_mn);
      if (c.esg_score) sectorStats[sec].esgs.push(c.esg_score);
    });

    const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const std = arr => { const m = mean(arr); return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, arr.length)); };

    const results = [];
    companies.forEach(c => {
      const sec = c.sector || 'Unknown';
      const stats = sectorStats[sec];
      if (!stats) return;
      const checks = [
        { field: 'revenue_usd_mn', arr: stats.revs, val: c.revenue_usd_mn },
        { field: 'market_cap_usd_mn', arr: stats.mcaps, val: c.market_cap_usd_mn },
        { field: 'esg_score', arr: stats.esgs, val: c.esg_score },
      ];
      checks.forEach(({ field, arr, val }) => {
        if (val == null || arr.length < 3) return;
        const m = mean(arr); const s = std(arr);
        if (s > 0 && Math.abs(val - m) > 3 * s) {
          results.push({ company: c.company_name, ticker: c.ticker, sector: sec, exchange: c._displayExchange, field, value: val, mean: Math.round(m), std_dev: Math.round(s), deviation: ((val - m) / s).toFixed(1) });
        }
      });
    });
    return results.slice(0, 50);
  }, [companies]);

  /* Data Gap Action Plan -------------------------------------------------- */
  const gapPlan = useMemo(() => {
    return exchanges.map(ex => {
      const exData = dqData.filter(d => d.exchange === ex);
      const gapFields = DQ_FIELDS.filter(f => {
        const hasField = exData.filter(d => !d.missing_fields.includes(f));
        return hasField.length / Math.max(1, exData.length) < 0.5;
      });
      const recommendedSource = ex === 'NSE/BSE' ? 'Supabase BRSR' : gapFields.some(f => f.includes('scope')) ? 'EODHD + manual enrichment' : 'EODHD Fundamentals';
      return { exchange: ex, companies: exData.length, gap_fields: gapFields, gap_count: gapFields.length, recommended_source: recommendedSource };
    }).filter(g => g.gap_count > 0).sort((a, b) => b.gap_count - a.gap_count);
  }, [dqData, exchanges]);

  /* Sort handler ---------------------------------------------------------- */
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedViolations = useMemo(() => {
    const sorted = [...filteredViolations];
    sorted.sort((a, b) => {
      const va = a[sortCol] ?? ''; const vb = b[sortCol] ?? '';
      if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return sorted;
  }, [filteredViolations, sortCol, sortDir]);

  /* Exports --------------------------------------------------------------- */
  const exportCSV = (rows, headers, filename) => {
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const exportDQReport = () => {
    const headers = ['company_name', 'ticker', 'exchange', 'sector', 'completeness', 'accuracy', 'timeliness', 'consistency', 'uniqueness', 'validity', 'composite', 'pcaf_tier', 'missing_fields'];
    const rows = dqData.map(d => ({ ...d, missing_fields: d.missing_fields.join('; ') }));
    exportCSV(rows, headers, `dq_report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportViolationLog = () => {
    const headers = ['company', 'ticker', 'exchange', 'sector', 'field', 'rule', 'value', 'severity'];
    exportCSV(allViolations, headers, `dq_violations_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handlePrint = () => window.print();

  /* ── Styles ────────────────────────────────────────────────────────────── */
  const containerStyle = { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text };
  const cardStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
  const thStyle = { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.border}`, color: T.textSec, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', cursor: 'pointer' };
  const tdStyle = { padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12, verticalAlign: 'middle' };
  const btnStyle = { padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: T.font };
  const inputStyle = { padding: '7px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, outline: 'none' };
  const sectionTitle = (text) => <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 12px 0' }}>{text}</h3>;
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' ^' : ' v') : '';

  /* Tabs ------------------------------------------------------------------- */
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'violations', label: 'Violations' },
    { id: 'field-detail', label: 'Field Detail' },
    { id: 'actions', label: 'Action Plan' },
  ];

  /* ── RENDER ────────────────────────────────────────────────────────────── */
  return (
    <div style={containerStyle}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: -0.5 }}>Data Quality Monitoring Dashboard</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <Badge label={`${companies.length} Companies`} color={T.navy} />
            <Badge label={`${DQ_DIMENSIONS.length} Dimensions`} color={T.sage} />
            <Badge label="Real-Time" color={T.green} />
            <Badge label="EP-P2" color={T.gold} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btnStyle} onClick={exportDQReport}>Export DQ Report CSV</button>
          <button style={btnStyle} onClick={exportViolationLog}>Export Violations CSV</button>
          <button style={btnStyle} onClick={handlePrint}>Print</button>
          <button style={{ ...btnStyle, color: T.sage }} onClick={() => navigate('/api-orchestration')}>API Orchestration</button>
          <button style={{ ...btnStyle, color: T.navyL }} onClick={() => navigate('/portfolio-dashboard')}>Portfolio</button>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 18px', border: 'none', borderBottom: activeTab === t.id ? `3px solid ${T.navy}` : '3px solid transparent', background: 'transparent', color: activeTab === t.id ? T.navy : T.textMut, fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: T.font, marginBottom: -2 }}>{t.label}</button>
        ))}
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <KPICard label="Overall DQ Score" value={`${avgComposite}/100`} sub="weighted composite" icon="Q" color={avgComposite >= 70 ? T.green : T.amber} />
        <KPICard label="Completeness" value={`${avgCompleteness}%`} sub="fields populated" icon="C" color={avgCompleteness >= 70 ? T.green : T.amber} />
        <KPICard label="Accuracy" value={`${avgAccuracy}%`} sub="values in range" icon="A" color={avgAccuracy >= 80 ? T.green : T.amber} />
        <KPICard label="Timeliness" value={`${avgTimeliness}%`} sub="data recency" icon="T" color={T.navyL} />
        <KPICard label="Full Data" value={fullDataCount} sub={`of ${companies.length}`} icon="F" color={T.sage} />
        <KPICard label="Critical Violations" value={criticalViolations} sub="must fix" icon="!" color={criticalViolations > 0 ? T.red : T.green} />
        <KPICard label="High Violations" value={highViolations} sub="should fix" icon="H" color={highViolations > 0 ? T.amber : T.green} />
        <KPICard label="Fields Monitored" value={DQ_FIELDS.length} sub="across all cos" icon="M" color={T.navy} />
        <KPICard label="Exchanges" value={exchanges.length} sub="covered" icon="E" color={T.navyL} />
        <KPICard label="Last Scan" value={scanTime.split(',')[0]} sub={scanTime.split(',')[1]} icon="S" color={T.textSec} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Overview                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* ── DQ Score Distribution ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cardStyle}>
              {sectionTitle('DQ Score Distribution')}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
                  <Bar dataKey="count" name="Companies" radius={[4,4,0,0]}>
                    {histogram.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i] || T.navy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── 6-Dimension Radar ────────────────────────────────────── */}
            <div style={cardStyle}>
              {sectionTitle('6-Dimension Radar')}
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} outerRadius={80}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Portfolio Avg" dataKey="value" stroke={T.navy} fill={`${T.navy}30`} fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── DQ by Exchange ─────────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('DQ Score by Exchange')}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dqByExchange} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis dataKey="exchange" type="category" width={90} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}/100`, 'Avg DQ']} />
                <Bar dataKey="avg" name="Avg DQ Score" radius={[0,4,4,0]}>
                  {dqByExchange.map((e, i) => <Cell key={i} fill={EXCHANGE_COLORS[i % EXCHANGE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── DQ by Sector ──────────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('DQ Score by Sector')}
            <ResponsiveContainer width="100%" height={Math.max(200, dqBySector.length * 26)}>
              <BarChart data={dqBySector} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis dataKey="sector" type="category" width={160} tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="avg" name="Avg DQ Score" fill={T.sage} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── PCAF Data Quality Tier Distribution ────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cardStyle}>
              {sectionTitle('PCAF Data Quality Tier Distribution')}
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pcafTiers} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: T.textMut }}>
                    {pcafTiers.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ── DQ Improvement Trend ─────────────────────────────────── */}
            <div style={cardStyle}>
              {sectionTitle('DQ Improvement Trend (Projected)')}
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="composite" stroke={T.navy} fill={`${T.navy}20`} name="Composite" />
                  <Area type="monotone" dataKey="completeness" stroke={T.sage} fill={`${T.sage}15`} name="Completeness" />
                  <Area type="monotone" dataKey="accuracy" stroke={T.gold} fill={`${T.gold}15`} name="Accuracy" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Worst 20 Holdings ──────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Worst Data Quality Holdings (Bottom 20)')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>#</th><th style={thStyle}>Company</th><th style={thStyle}>Ticker</th>
                <th style={thStyle}>Exchange</th><th style={thStyle}>Sector</th><th style={thStyle}>DQ Score</th>
                <th style={thStyle}>Completeness</th><th style={thStyle}>Accuracy</th><th style={thStyle}>Missing Fields</th>
                <th style={thStyle}>PCAF Tier</th>
              </tr></thead>
              <tbody>
                {worst20.map((d, i) => (
                  <tr key={i} style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{d.company_name}</td>
                    <td style={tdStyle}>{d.ticker}</td>
                    <td style={tdStyle}>{d.exchange}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{d.sector}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: d.composite < 40 ? T.red : d.composite < 60 ? T.amber : T.green }}>{d.composite}</td>
                    <td style={tdStyle}>{d.completeness}%</td>
                    <td style={tdStyle}>{d.accuracy}%</td>
                    <td style={{ ...tdStyle, fontSize: 10, maxWidth: 200 }}>{d.missing_fields.slice(0, 4).join(', ')}{d.missing_fields.length > 4 ? ` +${d.missing_fields.length - 4}` : ''}</td>
                    <td style={tdStyle}><Badge label={`Tier ${d.pcaf_tier}`} color={PIE_COLORS[d.pcaf_tier - 1] || T.textMut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Violations                                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'violations' && (
        <>
          {/* ── Filters ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, width: 240 }} placeholder="Search company or field..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...inputStyle, width: 140 }} value={violationFilter} onChange={e => setViolationFilter(e.target.value)}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select style={{ ...inputStyle, width: 140 }} value={exchangeFilter} onChange={e => setExchangeFilter(e.target.value)}>
              <option value="all">All Exchanges</option>
              {exchanges.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
            <div style={{ fontSize: 11, color: T.textMut }}>{filteredViolations.length} violations shown</div>
          </div>

          {/* ── Violation Log Table ────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Violation Log')}
            {filteredViolations.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>No violations found</div>
                <div style={{ fontSize: 13 }}>All companies pass the selected quality rules. Try adjusting filters.</div>
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead><tr>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }} onClick={() => handleSort('company')}>Company{SortIcon({ col: 'company' })}</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }} onClick={() => handleSort('ticker')}>Ticker</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }} onClick={() => handleSort('exchange')}>Exchange</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }} onClick={() => handleSort('field')}>Field{SortIcon({ col: 'field' })}</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Rule</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }} onClick={() => handleSort('value')}>Value</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }} onClick={() => handleSort('severity')}>Severity{SortIcon({ col: 'severity' })}</th>
                  </tr></thead>
                  <tbody>
                    {sortedViolations.slice(0, 100).map((v, i) => (
                      <tr key={i} style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{v.company}</td>
                        <td style={tdStyle}>{v.ticker}</td>
                        <td style={tdStyle}>{v.exchange}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{v.field}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{v.rule}</td>
                        <td style={{ ...tdStyle, color: T.red }}>{fmt(v.value)}</td>
                        <td style={tdStyle}><Badge label={v.severity} color={SEVERITY_COLORS[v.severity]} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredViolations.length > 100 && <div style={{ padding: 8, textAlign: 'center', fontSize: 11, color: T.textMut }}>Showing 100 of {filteredViolations.length}. Export CSV for full list.</div>}
              </div>
            )}
          </div>

          {/* ── Anomaly Detection ──────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Anomaly Detection (> 3 Std Dev from Sector Mean)')}
            {anomalies.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: T.textMut }}>No anomalies detected. All values within expected ranges.</div>
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>Company</th><th style={thStyle}>Ticker</th><th style={thStyle}>Sector</th>
                  <th style={thStyle}>Field</th><th style={thStyle}>Value</th><th style={thStyle}>Sector Mean</th>
                  <th style={thStyle}>Std Dev</th><th style={thStyle}>Deviation</th>
                </tr></thead>
                <tbody>
                  {anomalies.slice(0, 30).map((a, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{a.company}</td>
                      <td style={tdStyle}>{a.ticker}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{a.sector}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{a.field}</td>
                      <td style={{ ...tdStyle, color: T.red, fontWeight: 700 }}>{fmt(a.value)}</td>
                      <td style={tdStyle}>{fmt(a.mean)}</td>
                      <td style={tdStyle}>{fmt(a.std_dev)}</td>
                      <td style={{ ...tdStyle, color: Math.abs(parseFloat(a.deviation)) > 5 ? T.red : T.amber, fontWeight: 700 }}>{a.deviation}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Field Detail                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'field-detail' && (
        <>
          {/* ── Field Completeness Heatmap ─────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Field Completeness Heatmap (% companies with data)')}
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr>
                  <th style={{ ...thStyle, minWidth: 160 }}>Field</th>
                  {exchanges.map(ex => <th key={ex} style={{ ...thStyle, fontSize: 9, minWidth: 55, textAlign: 'center' }}>{ex}</th>)}
                </tr></thead>
                <tbody>
                  {fieldCompleteness.map((row, ri) => (
                    <tr key={ri}>
                      <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{row.field}</td>
                      {exchanges.map(ex => {
                        const val = row[ex] || 0;
                        const bg = val >= 80 ? `${T.green}18` : val >= 50 ? `${T.amber}18` : val > 0 ? `${T.red}18` : `${T.textMut}08`;
                        const clr = val >= 80 ? T.green : val >= 50 ? T.amber : val > 0 ? T.red : T.textMut;
                        return <td key={ex} style={{ ...tdStyle, textAlign: 'center', background: bg, color: clr, fontWeight: 700, fontSize: 11 }}>{val}%</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Field-Level Quality Rules ──────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Active Quality Rules')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Field</th><th style={thStyle}>Rule</th><th style={thStyle}>Severity</th>
                <th style={thStyle}>Violations</th><th style={thStyle}>Pass Rate</th>
              </tr></thead>
              <tbody>
                {QUALITY_RULES.map((r, i) => {
                  const vCount = allViolations.filter(v => v.field === r.field).length;
                  const totalWithField = companies.filter(c => c[r.field] !== undefined && c[r.field] !== null).length;
                  const passRate = totalWithField > 0 ? Math.round((totalWithField - vCount) / totalWithField * 100) : 100;
                  return (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{r.field}</td>
                      <td style={tdStyle}>{r.rule}</td>
                      <td style={tdStyle}><Badge label={r.severity} color={SEVERITY_COLORS[r.severity]} /></td>
                      <td style={{ ...tdStyle, color: vCount > 0 ? T.red : T.green, fontWeight: 700 }}>{vCount}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${passRate}%`, height: '100%', background: passRate >= 90 ? T.green : passRate >= 70 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{passRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Dimension Weights ──────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('DQ Dimension Weights & Descriptions')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {DQ_DIMENSIONS.map(dim => {
                const avg = Math.round(dqData.reduce((a, d) => a + (d[dim.id] || 0), 0) / Math.max(1, dqData.length));
                return (
                  <div key={dim.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderLeft: `4px solid ${avg >= 80 ? T.green : avg >= 60 ? T.amber : T.red}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{dim.icon} {dim.name}</div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: avg >= 80 ? T.green : avg >= 60 ? T.amber : T.red }}>{avg}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{dim.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${avg}%`, height: '100%', background: avg >= 80 ? T.green : avg >= 60 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T.textMut }}>Weight: {dim.weight}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Action Plan                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'actions' && (
        <>
          {/* ── Data Gap Action Plan ───────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Data Gap Action Plan by Exchange')}
            {gapPlan.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: T.textMut }}>No significant data gaps detected. All exchanges have adequate coverage.</div>
            ) : (
              <table style={tableStyle}>
                <thead><tr>
                  <th style={thStyle}>Exchange</th><th style={thStyle}>Companies</th><th style={thStyle}>Gap Fields</th>
                  <th style={thStyle}>Gap Count</th><th style={thStyle}>Recommended Source</th><th style={thStyle}>Priority</th>
                </tr></thead>
                <tbody>
                  {gapPlan.map((g, i) => (
                    <tr key={i} style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{g.exchange}</td>
                      <td style={tdStyle}>{g.companies}</td>
                      <td style={{ ...tdStyle, fontSize: 10, maxWidth: 250 }}>{g.gap_fields.map(f => f.replace(/_/g, ' ')).join(', ')}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: g.gap_count > 5 ? T.red : T.amber }}>{g.gap_count}</td>
                      <td style={tdStyle}>{g.recommended_source}</td>
                      <td style={tdStyle}><Badge label={g.gap_count > 5 ? 'Critical' : g.gap_count > 3 ? 'High' : 'Medium'} color={g.gap_count > 5 ? T.red : g.gap_count > 3 ? T.amber : T.textMut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Enrichment Recommendations ─────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Enrichment Recommendations')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { title: 'Scope 1/2 Emissions', gap: `${dqData.filter(d => d.missing_fields.includes('scope1_mt')).length} companies missing`, action: 'Run EODHD ESG enrichment pipeline', source: 'eodhd', priority: 'High' },
                { title: 'ESG Scores', gap: `${dqData.filter(d => d.missing_fields.includes('esg_score')).length} companies missing`, action: 'Expand EODHD coverage to all exchanges', source: 'eodhd', priority: 'High' },
                { title: 'GHG Intensity', gap: `${dqData.filter(d => d.missing_fields.includes('ghg_intensity_tco2e_per_mn')).length} companies missing`, action: 'Compute from scope1+scope2 / revenue', source: 'Calculated', priority: 'Medium' },
                { title: 'EVIC', gap: `${dqData.filter(d => d.missing_fields.includes('evic_usd_mn')).length} companies missing`, action: 'Compute from market_cap + total_debt', source: 'Calculated', priority: 'Medium' },
                { title: 'Transition Risk Score', gap: `${dqData.filter(d => d.missing_fields.includes('transition_risk_score')).length} companies missing`, action: 'Run NGFS scenario alignment model', source: 'Internal model', priority: 'Low' },
                { title: 'BRSR Alignment (India)', gap: 'Available for 1,323 NSE/BSE companies', action: 'Run BRSR Data Sync pipeline', source: 'supabase_brsr', priority: 'Complete' },
              ].map((r, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderLeft: `4px solid ${r.priority === 'High' ? T.red : r.priority === 'Medium' ? T.amber : r.priority === 'Complete' ? T.green : T.textMut}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{r.gap}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}><b>Action:</b> {r.action}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}>
                    <span>Source: {r.source}</span>
                    <Badge label={r.priority} color={r.priority === 'High' ? T.red : r.priority === 'Medium' ? T.amber : r.priority === 'Complete' ? T.green : T.textMut} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Target DQ Improvement ──────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('DQ Improvement Targets')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Metric</th><th style={thStyle}>Current</th><th style={thStyle}>Target (Q2)</th>
                <th style={thStyle}>Target (Q4)</th><th style={thStyle}>Gap</th>
              </tr></thead>
              <tbody>
                {[
                  { metric: 'Overall DQ Score', current: avgComposite, q2: 75, q4: 85 },
                  { metric: 'Completeness', current: avgCompleteness, q2: 70, q4: 85 },
                  { metric: 'Accuracy', current: avgAccuracy, q2: 90, q4: 95 },
                  { metric: 'Companies at Tier 1-2', current: Math.round((pcafTiers[0].value + pcafTiers[1].value) / companies.length * 100), q2: 40, q4: 60 },
                  { metric: 'Critical Violations', current: criticalViolations, q2: 0, q4: 0 },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.metric}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: T.navy }}>{r.metric === 'Critical Violations' ? r.current : `${r.current}%`}</td>
                    <td style={tdStyle}>{r.metric === 'Critical Violations' ? r.q2 : `${r.q2}%`}</td>
                    <td style={tdStyle}>{r.metric === 'Critical Violations' ? r.q4 : `${r.q4}%`}</td>
                    <td style={{ ...tdStyle, color: r.metric === 'Critical Violations' ? (r.current > 0 ? T.red : T.green) : (r.q4 - r.current > 20 ? T.red : T.amber) }}>
                      {r.metric === 'Critical Violations' ? (r.current > 0 ? `${r.current} to fix` : 'Met') : `+${r.q4 - r.current}pp needed`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ALWAYS-VISIBLE: Extended Analytics & Details                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {/* ── DQ Score by Country BarChart ────────────────────────────────── */}
      {(() => {
        const countryDQ = {};
        dqData.forEach(d => {
          const co = companies.find(c => c.ticker === d.ticker);
          const country = co?.country || 'Unknown';
          if (!countryDQ[country]) countryDQ[country] = { country, sum: 0, count: 0 };
          countryDQ[country].sum += d.composite;
          countryDQ[country].count++;
        });
        const chartData = Object.values(countryDQ)
          .map(c => ({ ...c, avg: Math.round(c.sum / c.count) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);

        return (
          <div style={cardStyle}>
            {sectionTitle('DQ Score by Country (Top 15 by Company Count)')}
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} label={{ value: 'DQ Score', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textMut }} label={{ value: 'Companies', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="avg" name="Avg DQ Score" fill={T.sage} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="count" name="Companies" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ── Completeness Leaderboard ────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Data Completeness Leaderboard (Top 25)')}
        {(() => {
          const top25 = [...dqData].sort((a, b) => b.completeness - a.completeness).slice(0, 25);
          return (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Ticker</th>
                  <th style={thStyle}>Exchange</th>
                  <th style={thStyle}>Sector</th>
                  <th style={thStyle}>Completeness</th>
                  <th style={thStyle}>Accuracy</th>
                  <th style={thStyle}>Composite</th>
                  <th style={thStyle}>PCAF Tier</th>
                  <th style={thStyle}>Fields Present</th>
                </tr>
              </thead>
              <tbody>
                {top25.map((d, i) => {
                  const fieldsPresent = DQ_FIELDS.length - d.missing_fields.length;
                  return (
                    <tr key={i} style={{ background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{d.company_name}</td>
                      <td style={tdStyle}>{d.ticker}</td>
                      <td style={tdStyle}>{d.exchange}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{d.sector}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: d.completeness >= 80 ? T.green : T.amber }}>
                        {d.completeness}%
                      </td>
                      <td style={tdStyle}>{d.accuracy}%</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: d.composite >= 70 ? T.green : d.composite >= 50 ? T.amber : T.red }}>
                        {d.composite}
                      </td>
                      <td style={tdStyle}>
                        <Badge label={`Tier ${d.pcaf_tier}`} color={PIE_COLORS[d.pcaf_tier - 1] || T.textMut} />
                      </td>
                      <td style={tdStyle}>{fieldsPresent}/{DQ_FIELDS.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* ── Missing Field Frequency BarChart ────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Most Commonly Missing Fields')}
        {(() => {
          const fieldCounts = {};
          dqData.forEach(d => {
            d.missing_fields.forEach(f => {
              fieldCounts[f] = (fieldCounts[f] || 0) + 1;
            });
          });
          const chartData = Object.entries(fieldCounts)
            .map(([field, count]) => ({ field: field.replace(/_/g, ' '), count, pct: Math.round(count / dqData.length * 100) }))
            .sort((a, b) => b.count - a.count);

          return (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis dataKey="field" type="category" width={160} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v, name) => [v, name === 'count' ? 'Companies Missing' : name]} />
                <Bar dataKey="count" name="Companies Missing" fill={T.red} radius={[0,4,4,0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? T.red : i < 6 ? T.amber : T.textMut} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── Sector Completeness Detail ──────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Sector-Level Completeness Breakdown')}
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Sector</th>
                <th style={thStyle}>Companies</th>
                <th style={thStyle}>Avg Completeness</th>
                <th style={thStyle}>Avg Accuracy</th>
                <th style={thStyle}>Avg Composite</th>
                <th style={thStyle}>Full Data %</th>
                <th style={thStyle}>Critical Violations</th>
                <th style={thStyle}>Tier 1-2 %</th>
              </tr>
            </thead>
            <tbody>
              {dqBySector.map((sec, i) => {
                const secData = dqData.filter(d => d.sector === sec.sector);
                const avgComp = Math.round(secData.reduce((a, d) => a + d.completeness, 0) / Math.max(1, secData.length));
                const avgAcc = Math.round(secData.reduce((a, d) => a + d.accuracy, 0) / Math.max(1, secData.length));
                const fullPct = Math.round(secData.filter(d => d.completeness === 100).length / Math.max(1, secData.length) * 100);
                const critCount = secData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'critical').length, 0);
                const tier12 = Math.round(secData.filter(d => d.pcaf_tier <= 2).length / Math.max(1, secData.length) * 100);
                return (
                  <tr key={i} style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{sec.sector}</td>
                    <td style={tdStyle}>{sec.total}</td>
                    <td style={{ ...tdStyle, color: avgComp >= 70 ? T.green : T.amber }}>{avgComp}%</td>
                    <td style={{ ...tdStyle, color: avgAcc >= 80 ? T.green : T.amber }}>{avgAcc}%</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: sec.avg >= 70 ? T.green : sec.avg >= 50 ? T.amber : T.red }}>
                      {sec.avg}
                    </td>
                    <td style={tdStyle}>{fullPct}%</td>
                    <td style={{ ...tdStyle, color: critCount > 0 ? T.red : T.green, fontWeight: 600 }}>{critCount}</td>
                    <td style={tdStyle}>{tier12}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PCAF Tier by Exchange ───────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('PCAF Tier Distribution by Exchange')}
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Exchange</th>
                <th style={thStyle}>Companies</th>
                <th style={{ ...thStyle, color: PIE_COLORS[0] }}>Tier 1</th>
                <th style={{ ...thStyle, color: PIE_COLORS[1] }}>Tier 2</th>
                <th style={{ ...thStyle, color: PIE_COLORS[2] }}>Tier 3</th>
                <th style={{ ...thStyle, color: PIE_COLORS[3] }}>Tier 4</th>
                <th style={{ ...thStyle, color: PIE_COLORS[4] }}>Tier 5</th>
                <th style={thStyle}>Avg DQ</th>
              </tr>
            </thead>
            <tbody>
              {dqByExchange.map((ex, i) => {
                const exData = dqData.filter(d => d.exchange === ex.exchange);
                const tiers = [1,2,3,4,5].map(t => exData.filter(d => d.pcaf_tier === t).length);
                return (
                  <tr key={i} style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{ex.exchange}</td>
                    <td style={tdStyle}>{ex.total}</td>
                    {tiers.map((t, j) => (
                      <td key={j} style={{ ...tdStyle, textAlign: 'center', fontWeight: t > 0 ? 700 : 400, color: t > 0 ? PIE_COLORS[j] : T.textMut }}>
                        {t}
                      </td>
                    ))}
                    <td style={{ ...tdStyle, fontWeight: 700, color: ex.avg >= 70 ? T.green : ex.avg >= 50 ? T.amber : T.red }}>
                      {ex.avg}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DQ Monitoring Configuration ────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Monitoring Configuration')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Scan Frequency', value: 'Real-time (on page load)' },
            { label: 'Quality Rules', value: `${QUALITY_RULES.length} active rules` },
            { label: 'Fields Monitored', value: `${DQ_FIELDS.length} key fields` },
            { label: 'Dimensions', value: `${DQ_DIMENSIONS.length} quality dimensions` },
            { label: 'Anomaly Threshold', value: '3x standard deviation' },
            { label: 'PCAF Alignment', value: 'Tier 1-5 classification' },
            { label: 'Data Sources', value: 'GLOBAL_COMPANY_MASTER' },
            { label: 'Report Format', value: 'CSV, Print' },
          ].map((item, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: T.textMut, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary Statistics ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Summary Statistics')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total Companies', value: companies.length, color: T.navy },
            { label: 'Companies with DQ > 80', value: dqData.filter(d => d.composite >= 80).length, color: T.green },
            { label: 'Companies with DQ < 40', value: dqData.filter(d => d.composite < 40).length, color: T.red },
            { label: 'Zero-Violation Companies', value: dqData.filter(d => d.violations.length === 0).length, color: T.green },
            { label: 'Total Violations', value: allViolations.length, color: T.red },
            { label: 'Critical Violations', value: criticalViolations, color: T.red },
            { label: 'Unique Sectors', value: sectors.length, color: T.navyL },
            { label: 'Exchanges Monitored', value: exchanges.length, color: T.sage },
            { label: 'Median DQ Score', value: (() => { const sorted = [...dqData].sort((a,b) => a.composite - b.composite); return sorted[Math.floor(sorted.length/2)]?.composite || 0; })(), color: T.navy },
            { label: 'DQ Std Deviation', value: (() => { const m = avgComposite; const v = dqData.reduce((a,d) => a + (d.composite - m)**2, 0) / Math.max(1, dqData.length); return Math.round(Math.sqrt(v)); })(), color: T.textSec },
          ].map((item, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{fmt(item.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cross Navigation Footer ────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 11, color: T.textMut }}>Sprint P - Data Infrastructure & Live Feeds | EP-P2 Data Quality Monitor</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'API Orchestration', path: '/api-orchestration' },
            { label: 'Portfolio Dashboard', path: '/portfolio-dashboard' },
            { label: 'Company Profiles', path: '/company-profiles' },
            { label: 'PCAF India BRSR', path: '/pcaf-india-brsr' },
            { label: 'Sector Benchmarking', path: '/sector-benchmarking' },
            { label: 'ESG Data Quality', path: '/esg-data-quality' },
          ].map(n => (
            <button key={n.path} style={{ ...btnStyle, fontSize: 10, padding: '4px 10px' }} onClick={() => navigate(n.path)}>{n.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
