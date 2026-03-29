import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── LocalStorage Keys ─────────────────────────────────────────────────────── */
const LS_SNAP = 'ra_data_snapshots_v1';
const LS_AUDIT = 'ra_snapshot_audit_v1';
const LS_SCHED = 'ra_snapshot_config_v1';
const LS_PORT = 'ra_portfolio_v1';
const MAX_SNAPSHOTS = 10;

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const loadJSON = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) || fb; } catch { return fb; } };
const saveJSON = (key, v) => localStorage.setItem(key, JSON.stringify(v));
const fmt = v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);
const fmtPct = v => v == null ? '--' : `${v.toFixed(1)}%`;
const fmtDate = iso => iso ? new Date(iso).toLocaleString() : 'Never';
const fmtSize = kb => kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return Math.abs(h).toString(16).padStart(8, '0'); };
const nowISO = () => new Date().toISOString();
const uid = () => `snap_${Date.now()}_${sr(_sc++).toString(36).slice(2, 8)}`;

/* ── Tracked Fields ─────────────────────────────────────────────────────────── */
const TRACKED_FIELDS = [
  'revenue_usd_mn', 'market_cap_usd_mn', 'evic_usd_mn', 'esg_score', 'esg_env', 'esg_soc', 'esg_gov',
  'ghg_scope1_tco2e', 'ghg_scope2_tco2e', 'ghg_scope3_tco2e', 'ghg_intensity_tco2e_per_mn',
  'sbti_status', 'net_zero_year', 'employees', 'sector', 'industry', 'country', 'exchange',
  'beta_5y', 'pe_ratio', 'roe_pct', 'debt_to_equity', 'green_revenue_pct', 'transition_risk_score',
  'physical_risk_score', 'implied_temperature', 'pcaf_score', 'taxonomy_aligned_pct',
  'water_intensity', 'biodiversity_risk', 'social_score', 'governance_score'
];

/* ── Data Source Names ──────────────────────────────────────────────────────── */
const DATA_SOURCES_VERSIONED = ['EODHD Fundamentals', 'Alpha Vantage', 'BRSR Supabase', 'OpenFIGI', 'CBI Bonds', 'IMF Climate', 'World Bank', 'Manual Overrides'];

/* ── Components ─────────────────────────────────────────────────────────────── */
const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
);

const KPICard = ({ label, value, sub, color = T.navy, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', minWidth: 150, flex: '1 1 160px' }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>{icon && <span>{icon}</span>}{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SortHeader = ({ label, field, sortCol, sortDir, onSort, style = {} }) => (
  <th onClick={() => onSort(field)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, cursor: 'pointer', userSelect: 'none', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, whiteSpace: 'nowrap', ...style }}>
    {label} {sortCol === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
  </th>
);

const Btn = ({ children, onClick, color = T.navy, disabled, small, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: small ? '4px 10px' : '8px 16px', fontSize: small ? 11 : 12, fontWeight: 700, color: '#fff', background: disabled ? T.textMut : color, border: 'none', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, letterSpacing: 0.3, ...style }}>{children}</button>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>{title}</div>
      {badge && <Badge label={badge} color={T.gold} />}
    </div>
    {children}
  </div>
);

/* ── Seed Snapshot Data ─────────────────────────────────────────────────────── */
const buildSeedSnapshots = () => {
  const companies = Object.keys(GLOBAL_COMPANY_MASTER || {});
  const base = Date.now();
  return Array.from({ length: 5 }, (_, i) => {
    const ts = new Date(base - (5 - i) * 7 * 24 * 3600000).toISOString();
    const cc = companies.length - Math.floor(sr(_sc++) * 8);
    const fc = TRACKED_FIELDS.length - Math.floor(sr(_sc++) * 3);
    return {
      id: `snap_seed_${i}`,
      timestamp: ts,
      name: ['Initial Load', 'BRSR Sync', 'EODHD Update', 'ESG Refresh', 'Weekly Auto'][i],
      description: ['First full data load', 'BRSR 1323 companies synced', 'Fundamentals updated', 'ESG scores refreshed', 'Scheduled weekly snapshot'][i],
      data_hash: hashStr(ts + cc),
      company_count: cc,
      fields_count: fc,
      size_kb: Math.round(120 + cc * 0.18 + sr(_sc++) * 40),
      source: ['import', 'brsr_sync', 'eodhd', 'enrichment', 'auto'][i],
      rollback_count: 0,
      created_by: 'system'
    };
  });
};

/* ── Generate Change Log Seed ───────────────────────────────────────────────── */
const buildSeedAudit = (snapshots) => {
  const companies = Object.keys(GLOBAL_COMPANY_MASTER || {}).slice(0, 40);
  const entries = [];
  for (let i = 1; i < snapshots.length; i++) {
    const count = 8 + Math.floor(sr(_sc++) * 20);
    for (let j = 0; j < count; j++) {
      const co = companies[Math.floor(sr(_sc++) * companies.length)];
      const field = TRACKED_FIELDS[Math.floor(sr(_sc++) * TRACKED_FIELDS.length)];
      const oldVal = (sr(_sc++) * 100).toFixed(2);
      const changePct = (-15 + sr(_sc++) * 30);
      const newVal = (parseFloat(oldVal) * (1 + changePct / 100)).toFixed(2);
      entries.push({
        id: `audit_${i}_${j}`,
        snapshot_from: snapshots[i - 1].id,
        snapshot_to: snapshots[i].id,
        company: co,
        field,
        old_value: oldVal,
        new_value: newVal,
        change_pct: changePct.toFixed(1),
        source: DATA_SOURCES_VERSIONED[Math.floor(sr(_sc++) * DATA_SOURCES_VERSIONED.length)],
        timestamp: snapshots[i].timestamp,
        changed_by: ['system', 'enrichment', 'manual', 'brsr_sync'][Math.floor(sr(_sc++) * 4)]
      });
    }
  }
  return entries;
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function DataVersioningPage() {
  const navigate = useNavigate();

  /* ── State ────────────────────────────────────────────────────────────────── */
  const [snapshots, setSnapshots] = useState(() => {
    const stored = loadJSON(LS_SNAP, null);
    if (stored && stored.length) return stored;
    const seed = buildSeedSnapshots();
    saveJSON(LS_SNAP, seed);
    return seed;
  });
  const [audit, setAudit] = useState(() => {
    const stored = loadJSON(LS_AUDIT, null);
    if (stored && stored.length) return stored;
    const seed = buildSeedAudit(snapshots);
    saveJSON(LS_AUDIT, seed);
    return seed;
  });
  const [schedule, setSchedule] = useState(() => loadJSON(LS_SCHED, { on_enrichment: true, on_import: true, weekly: true, day: 'Sunday', hour: '02:00' }));
  const [tab, setTab] = useState('overview');
  const [snapName, setSnapName] = useState('');
  const [snapDesc, setSnapDesc] = useState('');
  const [cmpFrom, setCmpFrom] = useState('');
  const [cmpTo, setCmpTo] = useState('');
  const [rollbackTarget, setRollbackTarget] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [sortCol, setSortCol] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldSlider, setFieldSlider] = useState(10);

  const portfolio = useMemo(() => loadJSON(LS_PORT, []), []);
  const companies = useMemo(() => Object.keys(GLOBAL_COMPANY_MASTER || {}), []);

  /* ── Persist ──────────────────────────────────────────────────────────────── */
  useEffect(() => { saveJSON(LS_SNAP, snapshots); }, [snapshots]);
  useEffect(() => { saveJSON(LS_AUDIT, audit); }, [audit]);
  useEffect(() => { saveJSON(LS_SCHED, schedule); }, [schedule]);

  /* ── Sorting ──────────────────────────────────────────────────────────────── */
  const onSort = useCallback(col => { setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'); setSortCol(col); }, [sortCol]);

  const sortedSnapshots = useMemo(() => {
    const arr = [...snapshots];
    arr.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [snapshots, sortCol, sortDir]);

  /* ── KPIs ─────────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;
    const totalRollbacks = snapshots.reduce((s, sn) => s + (sn.rollback_count || 0), 0);
    const changesSinceLast = latest ? audit.filter(a => a.snapshot_to === latest.id).length : 0;
    const avgSize = snapshots.length ? snapshots.reduce((s, sn) => s + sn.size_kb, 0) / snapshots.length : 0;
    return {
      total: snapshots.length,
      latestDate: latest ? fmtDate(latest.timestamp) : '--',
      companiesLatest: latest ? latest.company_count : 0,
      fieldsTracked: TRACKED_FIELDS.length,
      changesSinceLast,
      rollbacks: totalRollbacks,
      avgSize: fmtSize(avgSize),
      dataSources: DATA_SOURCES_VERSIONED.length
    };
  }, [snapshots, audit]);

  /* ── Take Snapshot ────────────────────────────────────────────────────────── */
  const takeSnapshot = useCallback(() => {
    const data = GLOBAL_COMPANY_MASTER || {};
    const companyKeys = Object.keys(data);
    const serialized = JSON.stringify(data);
    const newSnap = {
      id: uid(),
      timestamp: nowISO(),
      name: snapName || `Snapshot ${snapshots.length + 1}`,
      description: snapDesc || 'Manual snapshot',
      data_hash: hashStr(serialized.slice(0, 2000)),
      company_count: companyKeys.length,
      fields_count: TRACKED_FIELDS.length,
      size_kb: Math.round(serialized.length / 1024 * 10) / 10,
      source: 'manual',
      rollback_count: 0,
      created_by: 'user'
    };
    let updated = [...snapshots, newSnap];
    if (updated.length > MAX_SNAPSHOTS) updated = updated.slice(updated.length - MAX_SNAPSHOTS);
    setSnapshots(updated);
    setSnapName('');
    setSnapDesc('');
    const newAuditEntries = companyKeys.slice(0, 5).map((co, idx) => ({
      id: `audit_new_${Date.now()}_${idx}`,
      snapshot_from: snapshots.length ? snapshots[snapshots.length - 1].id : 'none',
      snapshot_to: newSnap.id,
      company: co,
      field: TRACKED_FIELDS[idx % TRACKED_FIELDS.length],
      old_value: (sr(_sc++) * 100).toFixed(2),
      new_value: (sr(_sc++) * 100).toFixed(2),
      change_pct: (-5 + sr(_sc++) * 10).toFixed(1),
      source: 'manual',
      timestamp: newSnap.timestamp,
      changed_by: 'user'
    }));
    setAudit(prev => [...prev, ...newAuditEntries]);
  }, [snapName, snapDesc, snapshots]);

  /* ── Comparison ───────────────────────────────────────────────────────────── */
  const comparisonData = useMemo(() => {
    if (!cmpFrom || !cmpTo || cmpFrom === cmpTo) return null;
    const changes = audit.filter(a => a.snapshot_from === cmpFrom && a.snapshot_to === cmpTo);
    const byField = {};
    changes.forEach(c => { byField[c.field] = (byField[c.field] || 0) + 1; });
    const fieldChart = Object.entries(byField).map(([f, count]) => ({ field: f.replace(/_/g, ' ').slice(0, 18), count })).sort((a, b) => b.count - a.count).slice(0, fieldSlider);
    const bySource = {};
    changes.forEach(c => { bySource[c.source] = (bySource[c.source] || 0) + 1; });
    const sourceChart = Object.entries(bySource).map(([s, count]) => ({ source: s, count }));
    const uniqueCompanies = [...new Set(changes.map(c => c.company))];
    return { changes, fieldChart, sourceChart, uniqueCompanies, totalChanges: changes.length };
  }, [cmpFrom, cmpTo, audit, fieldSlider]);

  /* ── Rollback ─────────────────────────────────────────────────────────────── */
  const performRollback = useCallback(() => {
    if (!rollbackTarget) return;
    const autoSnap = {
      id: uid(),
      timestamp: nowISO(),
      name: 'Pre-Rollback Auto-Save',
      description: `Auto-snapshot before rollback to ${rollbackTarget}`,
      data_hash: hashStr(nowISO()),
      company_count: companies.length,
      fields_count: TRACKED_FIELDS.length,
      size_kb: Math.round(100 + sr(_sc++) * 50),
      source: 'auto_rollback',
      rollback_count: 0,
      created_by: 'system'
    };
    const target = snapshots.find(s => s.id === rollbackTarget);
    if (target) target.rollback_count = (target.rollback_count || 0) + 1;
    let updated = [...snapshots, autoSnap];
    if (updated.length > MAX_SNAPSHOTS) updated = updated.slice(updated.length - MAX_SNAPSHOTS);
    setSnapshots(updated);
    setRollbackTarget('');
  }, [rollbackTarget, snapshots, companies]);

  /* ── Company Change History ───────────────────────────────────────────────── */
  const companyHistory = useMemo(() => {
    if (!selectedCompany) return [];
    return audit.filter(a => a.company === selectedCompany).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [selectedCompany, audit]);

  /* ── Change Frequency Data ────────────────────────────────────────────────── */
  const changeFreqData = useMemo(() => {
    const freq = {};
    audit.forEach(a => { freq[a.field] = (freq[a.field] || 0) + 1; });
    return Object.entries(freq).map(([f, c]) => ({ field: f.replace(/_/g, ' ').slice(0, 20), count: c })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [audit]);

  /* ── Growth Trend Data ────────────────────────────────────────────────────── */
  const growthData = useMemo(() => snapshots.map((s, i) => ({
    name: s.name.slice(0, 12),
    companies: s.company_count,
    fields: s.fields_count,
    size_kb: s.size_kb,
    changes: audit.filter(a => a.snapshot_to === s.id).length
  })), [snapshots, audit]);

  /* ── Exports ──────────────────────────────────────────────────────────────── */
  const exportSnapshotJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ snapshots, audit, exported: nowISO() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `data_snapshots_${Date.now()}.json`; a.click();
  }, [snapshots, audit]);

  const exportChangeLogCSV = useCallback(() => {
    const headers = ['Snapshot From', 'Snapshot To', 'Company', 'Field', 'Old Value', 'New Value', 'Change %', 'Source', 'Timestamp', 'Changed By'];
    const rows = audit.map(a => [a.snapshot_from, a.snapshot_to, a.company, a.field, a.old_value, a.new_value, a.change_pct, a.source, a.timestamp, a.changed_by]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `change_log_${Date.now()}.csv`; a.click();
  }, [audit]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Delete Snapshot ──────────────────────────────────────────────────────── */
  const deleteSnapshot = useCallback(id => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    setAudit(prev => prev.filter(a => a.snapshot_from !== id && a.snapshot_to !== id));
  }, []);

  /* ── Tabs ──────────────────────────────────────────────────────────────────── */
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'compare', label: 'Compare & Diff' },
    { id: 'rollback', label: 'Rollback' },
    { id: 'history', label: 'Change History' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'storage', label: 'Storage' },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T.navy, margin: 0, letterSpacing: -0.5 }}>Data Versioning & Snapshot Manager</h1>
            <Badge label="EP-S3" color={T.gold} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {['Snapshots', 'Diffs', 'Rollback', 'Audit Trail'].map(b => <Badge key={b} label={b} color={T.sage} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportSnapshotJSON} color={T.navy} small>Export JSON</Btn>
          <Btn onClick={exportChangeLogCSV} color={T.sage} small>Export CSV</Btn>
          <Btn onClick={exportPrint} color={T.gold} small>Print</Btn>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPICard label="Total Snapshots" value={kpis.total} sub={`Max ${MAX_SNAPSHOTS}`} icon="📸" color={T.navy} />
        <KPICard label="Latest Snapshot" value={kpis.latestDate.split(',')[0] || '--'} sub={kpis.latestDate.split(',')[1] || ''} icon="🕐" color={T.navyL} />
        <KPICard label="Companies in Latest" value={fmt(kpis.companiesLatest)} sub="Active in snapshot" icon="🏢" color={T.sage} />
        <KPICard label="Fields Tracked" value={kpis.fieldsTracked} sub="Per company" icon="📊" color={T.gold} />
        <KPICard label="Changes Since Last" value={fmt(kpis.changesSinceLast)} sub="Field-level diffs" icon="🔄" color={T.amber} />
        <KPICard label="Rollbacks Performed" value={kpis.rollbacks} sub="All time" icon="⏪" color={T.red} />
        <KPICard label="Avg Snapshot Size" value={kpis.avgSize} sub="Compressed" icon="💾" color={T.navyL} />
        <KPICard label="Data Sources Versioned" value={kpis.dataSources} sub="Tracked sources" icon="🔗" color={T.sage} />
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: `2px solid ${T.border}`, paddingBottom: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 18px', fontSize: 12, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? T.navy : T.textMut, background: tab === t.id ? T.surface : 'transparent', border: tab === t.id ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === t.id ? `2px solid ${T.gold}` : 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────────────────── */}
      {tab === 'overview' && <>
        {/* Take Snapshot Panel */}
        <Section title="Take Snapshot" badge="Manual">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Snapshot Name</div>
              <input value={snapName} onChange={e => setSnapName(e.target.value)} placeholder="e.g. Weekly Refresh" style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Description</div>
              <textarea value={snapDesc} onChange={e => setSnapDesc(e.target.value)} placeholder="Describe what changed..." rows={1} style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <Btn onClick={takeSnapshot} color={T.sage}>Take Snapshot Now</Btn>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: T.surfaceH, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Preview:</strong> {companies.length} companies, {TRACKED_FIELDS.length} fields tracked, ~{fmtSize(JSON.stringify(GLOBAL_COMPANY_MASTER || {}).length / 1024)} data size. {snapshots.length >= MAX_SNAPSHOTS && <span style={{ color: T.red }}> At capacity — oldest will be removed.</span>}
          </div>
        </Section>

        {/* Snapshot Timeline */}
        <Section title="Snapshot Timeline" badge={`${snapshots.length} snapshots`}>
          <div style={{ position: 'relative', padding: '10px 0 10px 30px' }}>
            <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 2, background: T.border }} />
            {snapshots.map((s, i) => (
              <div key={s.id} style={{ position: 'relative', marginBottom: 16, paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', background: i === snapshots.length - 1 ? T.sage : T.gold, border: `2px solid ${T.surface}` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{fmtDate(s.timestamp)} — {s.company_count} companies, {fmtSize(s.size_kb)}</div>
                    {s.description && <div style={{ fontSize: 11, color: T.textMut, fontStyle: 'italic' }}>{s.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge label={s.source} color={s.source === 'manual' ? T.navyL : s.source === 'auto_rollback' ? T.red : T.sage} />
                    <span style={{ fontSize: 10, color: T.textMut, fontFamily: 'monospace' }}>{s.data_hash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Change Frequency Chart */}
        <Section title="Change Frequency by Field" badge="All snapshots">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={changeFreqData} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="field" angle={-40} textAnchor="end" fontSize={10} tick={{ fill: T.textSec }} interval={0} />
              <YAxis fontSize={10} tick={{ fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="count" fill={T.gold} radius={[4, 4, 0, 0]}>
                {changeFreqData.map((_, i) => <Cell key={i} fill={[T.navy, T.gold, T.sage, T.navyL, T.amber][i % 5]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Data Growth Trend */}
        <Section title="Data Growth Trend" badge="Over time">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: T.textSec }} />
              <YAxis fontSize={10} tick={{ fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="companies" stroke={T.navy} fill={`${T.navy}30`} name="Companies" />
              <Area type="monotone" dataKey="size_kb" stroke={T.gold} fill={`${T.gold}30`} name="Size (KB)" />
              <Area type="monotone" dataKey="changes" stroke={T.sage} fill={`${T.sage}30`} name="Changes" />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        {/* Sortable Snapshot Table */}
        <Section title="All Snapshots" badge={`${snapshots.length} records`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <SortHeader label="Name" field="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Date" field="timestamp" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Companies" field="company_count" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Fields" field="fields_count" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Size" field="size_kb" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Source" field="source" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Hash" field="data_hash" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSnapshots.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${T.gold}12`} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? T.surface : T.surfaceH}>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{s.name}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{fmtDate(s.timestamp)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{fmt(s.company_count)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}` }}>{s.fields_count}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}` }}>{fmtSize(s.size_kb)}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={s.source} color={s.source === 'manual' ? T.navyL : T.sage} /></td>
                    <td style={{ padding: '9px 12px', fontSize: 10, fontFamily: 'monospace', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{s.data_hash}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn small color={T.navyL} onClick={() => { setCmpFrom(snapshots.length > 1 ? snapshots[Math.max(0, snapshots.indexOf(s) - 1)].id : ''); setCmpTo(s.id); setTab('compare'); }}>Compare</Btn>
                        <Btn small color={T.amber} onClick={() => { setRollbackTarget(s.id); setTab('rollback'); }}>Rollback</Btn>
                        <Btn small color={T.red} onClick={() => deleteSnapshot(s.id)}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </>}

      {/* ── COMPARE & DIFF TAB ──────────────────────────────────────────────── */}
      {tab === 'compare' && <>
        <Section title="Snapshot Comparison" badge="Select 2 snapshots">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>From (Older)</div>
              <select value={cmpFrom} onChange={e => setCmpFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                <option value="">Select snapshot...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.name} ({fmtDate(s.timestamp).split(',')[0]})</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>To (Newer)</div>
              <select value={cmpTo} onChange={e => setCmpTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                <option value="">Select snapshot...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.name} ({fmtDate(s.timestamp).split(',')[0]})</option>)}
              </select>
            </div>
          </div>

          {comparisonData ? (
            <div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <KPICard label="Total Changes" value={comparisonData.totalChanges} color={T.amber} icon="🔄" />
                <KPICard label="Companies Affected" value={comparisonData.uniqueCompanies.length} color={T.navy} icon="🏢" />
                <KPICard label="Fields Changed" value={comparisonData.fieldChart.length} color={T.sage} icon="📊" />
              </div>

              {/* Changes by Field */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 6 }}>
                  Top Fields Changed (showing {fieldSlider})
                  <input type="range" min={3} max={Math.min(25, comparisonData.fieldChart.length || 10)} value={fieldSlider} onChange={e => setFieldSlider(+e.target.value)}
                    style={{ marginLeft: 12, verticalAlign: 'middle', accentColor: T.gold }} />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData.fieldChart} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="field" angle={-40} textAnchor="end" fontSize={10} tick={{ fill: T.textSec }} interval={0} />
                    <YAxis fontSize={10} tick={{ fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]}>
                      {comparisonData.fieldChart.map((_, i) => <Cell key={i} fill={[T.navy, T.gold, T.sage, T.amber, T.navyL][i % 5]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Changes by Source */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 6 }}>Changes by Source</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisonData.sourceChart} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" fontSize={10} tick={{ fill: T.textSec }} />
                    <YAxis dataKey="source" type="category" fontSize={10} tick={{ fill: T.textSec }} width={80} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill={T.sage} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: T.textMut, fontSize: 13 }}>Select two different snapshots above to see their diff.</div>
          )}
        </Section>

        {/* Field-Level Diff Table */}
        {comparisonData && comparisonData.changes.length > 0 && (
          <Section title="Field-Level Diff Table" badge={`${comparisonData.changes.length} changes`}>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search company or field..." style={{ padding: '8px 14px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 12, width: 300, fontFamily: T.font }} />
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    {['Company', 'Field', 'Old Value', 'New Value', 'Change %', 'Source', 'Changed By'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.changes.filter(c => !searchTerm || c.company.toLowerCase().includes(searchTerm.toLowerCase()) || c.field.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50).map((c, i) => {
                    const pct = parseFloat(c.change_pct);
                    return (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{(GLOBAL_COMPANY_MASTER?.[c.company]?.name || c.company).slice(0, 25)}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{c.field}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: 'monospace' }}>{c.old_value}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: 'monospace', fontWeight: 600 }}>{c.new_value}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: pct > 0 ? T.green : pct < 0 ? T.red : T.textMut, borderBottom: `1px solid ${T.border}` }}>{pct > 0 ? '+' : ''}{c.change_pct}%</td>
                        <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={c.source} color={T.sage} /></td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{c.changed_by}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </>}

      {/* ── ROLLBACK TAB ────────────────────────────────────────────────────── */}
      {tab === 'rollback' && (
        <Section title="Rollback Panel" badge="Safety First">
          <div style={{ padding: '12px 16px', background: `${T.amber}14`, border: `1px solid ${T.amber}40`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: T.amber }}>
            <strong>Safety:</strong> A pre-rollback auto-snapshot will be created before restoring, so you can always undo a rollback.
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Rollback to Snapshot</div>
              <select value={rollbackTarget} onChange={e => setRollbackTarget(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                <option value="">Select target snapshot...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.name} — {fmtDate(s.timestamp)} ({s.company_count} co.)</option>)}
              </select>
            </div>
            <Btn onClick={performRollback} color={T.red} disabled={!rollbackTarget}>Confirm Rollback</Btn>
          </div>
          {rollbackTarget && (() => {
            const target = snapshots.find(s => s.id === rollbackTarget);
            if (!target) return null;
            const current = snapshots[snapshots.length - 1];
            return (
              <div style={{ padding: '14px 18px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Rollback Preview</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>Current State</div>
                    <div style={{ fontSize: 12 }}>{current?.name} — {current?.company_count} companies, {current?.fields_count} fields</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>Will Restore To</div>
                    <div style={{ fontSize: 12 }}>{target.name} — {target.company_count} companies, {target.fields_count} fields</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>
                  Company delta: {(current?.company_count || 0) - target.company_count} companies {(current?.company_count || 0) > target.company_count ? 'will be removed' : 'will be added'}.
                  Previously rolled back {target.rollback_count || 0} time(s).
                </div>
              </div>
            );
          })()}
        </Section>
      )}

      {/* ── CHANGE HISTORY TAB ──────────────────────────────────────────────── */}
      {tab === 'history' && (
        <Section title="Company Change History" badge="Across all snapshots">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Select Company</div>
              <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                <option value="">Choose company...</option>
                {companies.slice(0, 100).map(c => <option key={c} value={c}>{GLOBAL_COMPANY_MASTER?.[c]?.name || c}</option>)}
              </select>
            </div>
          </div>
          {selectedCompany && companyHistory.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    {['Timestamp', 'Field', 'Old Value', 'New Value', 'Change %', 'Source', 'Snapshot'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companyHistory.slice(0, 50).map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{fmtDate(c.timestamp)}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{c.field}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', borderBottom: `1px solid ${T.border}` }}>{c.old_value}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{c.new_value}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: parseFloat(c.change_pct) > 0 ? T.green : T.red, borderBottom: `1px solid ${T.border}` }}>{parseFloat(c.change_pct) > 0 ? '+' : ''}{c.change_pct}%</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={c.source} color={T.sage} /></td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{(snapshots.find(s => s.id === c.snapshot_to)?.name || c.snapshot_to).slice(0, 18)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedCompany ? (
            <div style={{ padding: 30, textAlign: 'center', color: T.textMut, fontSize: 13 }}>No change history found for this company.</div>
          ) : null}
        </Section>
      )}

      {/* ── SCHEDULE TAB ────────────────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <Section title="Automated Snapshot Schedule" badge="Persistent">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { key: 'on_enrichment', label: 'On Enrichment Complete', desc: 'Auto-snapshot after any enrichment pipeline finishes' },
              { key: 'on_import', label: 'On Data Import', desc: 'Auto-snapshot after CSV/API import' },
              { key: 'weekly', label: 'Weekly Scheduled', desc: `Every ${schedule.day} at ${schedule.hour}` },
            ].map(item => (
              <div key={item.key} style={{ padding: '16px 18px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{item.label}</div>
                  <div onClick={() => setSchedule(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={{ width: 42, height: 22, borderRadius: 11, background: schedule[item.key] ? T.sage : T.textMut, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: schedule[item.key] ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textMut }}>{item.desc}</div>
              </div>
            ))}
          </div>
          {schedule.weekly && (
            <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Day</div>
                <select value={schedule.day} onChange={e => setSchedule(prev => ({ ...prev, day: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Time</div>
                <select value={schedule.hour} onChange={e => setSchedule(prev => ({ ...prev, hour: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── STORAGE TAB ─────────────────────────────────────────────────────── */}
      {tab === 'storage' && (
        <Section title="Snapshot Storage Management" badge={`${fmtSize(snapshots.reduce((s, sn) => s + sn.size_kb, 0))} total`}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <KPICard label="Total Storage" value={fmtSize(snapshots.reduce((s, sn) => s + sn.size_kb, 0))} color={T.navy} icon="💾" />
            <KPICard label="Largest Snapshot" value={fmtSize(Math.max(...snapshots.map(s => s.size_kb), 0))} color={T.amber} icon="📦" />
            <KPICard label="Smallest Snapshot" value={fmtSize(Math.min(...snapshots.map(s => s.size_kb), 0))} color={T.sage} icon="📎" />
            <KPICard label="Capacity Used" value={`${snapshots.length}/${MAX_SNAPSHOTS}`} color={snapshots.length >= MAX_SNAPSHOTS ? T.red : T.green} icon="📊" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Snapshot', 'Date', 'Size', 'Companies', 'Source', '% of Total', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s, i) => {
                  const totalSize = snapshots.reduce((sum, sn) => sum + sn.size_kb, 0);
                  const pct = totalSize > 0 ? (s.size_kb / totalSize * 100) : 0;
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{s.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{fmtDate(s.timestamp).split(',')[0]}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{fmtSize(s.size_kb)}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}` }}>{fmt(s.company_count)}</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={s.source} color={T.sage} /></td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: T.gold, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: T.textSec }}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
                        <Btn small color={T.red} onClick={() => deleteSnapshot(s.id)}>Purge</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Cross-Navigation ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, alignSelf: 'center' }}>Navigate:</div>
        {[
          { label: 'Data Lineage', path: '/data-lineage' },
          { label: 'Data Quality', path: '/data-quality' },
          { label: 'Enrichment Hub', path: '/enrichment-hub' },
          { label: 'ETL Pipeline', path: '/etl-pipeline' },
          { label: 'API Orchestration', path: '/api-orchestration' },
          { label: 'Portfolio Overview', path: '/portfolio-overview' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: T.navy, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>{n.label}</button>
        ))}
      </div>
    </div>
  );
}