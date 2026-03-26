import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_CONFIG = 'ra_reconciliation_config_v1';
const LS_RESOLUTIONS = 'ra_reconciliation_resolutions_v1';
const LS_OVERRIDES = 'ra_reconciliation_overrides_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };

/* ═══════════════════════════════════════════════════════════════════════════
   DATA SOURCES
   ═══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_SOURCES = [
  { id: 'manual', name: 'Manual Overrides', priority: 0, coverage: 'Ad-hoc', fields: ['any'], reliability: 100, freshness: 'User-set', color: '#7c3aed', icon: 'USR' },
  { id: 'brsr', name: 'BRSR Supabase (Live)', priority: 1, coverage: 'India (1,323)', fields: ['scope1_mt','scope2_mt','water_withdrawal_kl','waste_generated_mt','safety_incidents','female_pct'], reliability: 98, freshness: 'FY2024', color: '#f97316', icon: 'DB' },
  { id: 'eodhd', name: 'EODHD API (Live)', priority: 1, coverage: 'Global (100K+)', fields: ['revenue_usd_mn','market_cap_usd_mn','employees','esg_score','sector'], reliability: 90, freshness: 'Live', color: '#0891b2', icon: 'API' },
  { id: 'exchanges', name: 'Exchange Files (Static)', priority: 2, coverage: 'Global (656)', fields: ['revenue_usd_mn','market_cap_usd_mn','evic_usd_mn','esg_score','scope1_mt','scope2_mt','employees'], reliability: 85, freshness: 'FY2023', color: '#3b82f6', icon: 'FILE' },
  { id: 'enriched', name: 'Enrichment Service', priority: 2, coverage: 'Enriched subset', fields: ['esg_score','employees','sector','transition_risk_score'], reliability: 80, freshness: 'Cached', color: '#a855f7', icon: 'AI' },
  { id: 'master', name: 'Company Master (Static)', priority: 3, coverage: 'India (30)', fields: ['revenue_usd_mn','market_cap_usd_mn','evic_usd_mn','esg_score','scope1_mt','scope2_mt','employees'], reliability: 95, freshness: 'FY2024', color: T.navy, icon: 'CORE' },
];

const RECONCILE_FIELDS = [
  { key: 'revenue_usd_mn', label: 'Revenue (USD Mn)', type: 'number' },
  { key: 'market_cap_usd_mn', label: 'Market Cap (USD Mn)', type: 'number' },
  { key: 'evic_usd_mn', label: 'EVIC (USD Mn)', type: 'number' },
  { key: 'esg_score', label: 'ESG Score', type: 'number' },
  { key: 'scope1_mt', label: 'Scope 1 (Mt CO2e)', type: 'number' },
  { key: 'scope2_mt', label: 'Scope 2 (Mt CO2e)', type: 'number' },
  { key: 'employees', label: 'Employees', type: 'number' },
  { key: 'transition_risk_score', label: 'Transition Risk', type: 'number' },
  { key: 'sector', label: 'Sector', type: 'string' },
];

/* ── Simulated multi-source values ───────────────────────────────── */
function simulateSourceValue(company, field, sourceId, baseVal) {
  if (baseVal === null || baseVal === undefined) return null;
  const h = seed(`${company.ticker}-${field}-${sourceId}`);
  const r = sRand(h);
  if (sourceId === 'manual') return null;
  if (sourceId === 'brsr') {
    if (!['scope1_mt','scope2_mt','employees','esg_score'].includes(field)) return null;
    if (company._region !== 'South Asia' && r > 0.15) return null;
    if (typeof baseVal === 'number') return Math.round(baseVal * (0.92 + r * 0.16) * 100) / 100;
    return baseVal;
  }
  if (sourceId === 'eodhd') {
    if (!['revenue_usd_mn','market_cap_usd_mn','employees','esg_score','sector'].includes(field)) return null;
    if (typeof baseVal === 'number') return Math.round(baseVal * (0.88 + r * 0.24) * 100) / 100;
    return baseVal;
  }
  if (sourceId === 'exchanges') {
    if (typeof baseVal === 'number') return Math.round(baseVal * (0.95 + r * 0.1) * 100) / 100;
    return baseVal;
  }
  if (sourceId === 'enriched') {
    if (!['esg_score','employees','sector','transition_risk_score'].includes(field)) return null;
    if (typeof baseVal === 'number') return Math.round(baseVal * (0.85 + r * 0.3) * 100) / 100;
    return baseVal;
  }
  if (sourceId === 'master') {
    if (company._region !== 'South Asia') return null;
    if (typeof baseVal === 'number') return Math.round(baseVal * (0.97 + r * 0.06) * 100) / 100;
    return baseVal;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DataReconciliationPage() {
  const nav = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || [], []);
  const companies = useMemo(() => {
    if (portfolio.length) return GLOBAL_COMPANY_MASTER.filter(c => portfolio.some(p => p.ticker === c.ticker || p.id === c.id));
    return GLOBAL_COMPANY_MASTER;
  }, [portfolio]);

  const [sourceConfig, setSourceConfig] = useState(() => {
    const saved = loadLS(LS_CONFIG);
    if (saved) return DEFAULT_SOURCES.map(s => ({ ...s, priority: saved[s.id]?.priority ?? s.priority }));
    return DEFAULT_SOURCES;
  });
  const [overrides, setOverrides] = useState(() => loadLS(LS_OVERRIDES) || {});
  const [resolutionLog, setResolutionLog] = useState(() => loadLS(LS_RESOLUTIONS) || []);
  const [tab, setTab] = useState('dashboard');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [conflictOnly, setConflictOnly] = useState(false);
  const [sortCol, setSortCol] = useState('company');
  const [sortDir, setSortDir] = useState('asc');

  /* ── Reconciliation engine ─────────────────────────────────────── */
  const reconciled = useMemo(() => {
    const results = [];
    const sortedSources = [...sourceConfig].sort((a, b) => a.priority - b.priority);

    companies.forEach(company => {
      const companyResult = { company: company.name, ticker: company.ticker, exchange: company._displayExchange || 'N/A', sector: company.sector, fields: {} };

      RECONCILE_FIELDS.forEach(fDef => {
        const baseVal = company[fDef.key];
        const values = sortedSources.map(src => {
          const overrideKey = `${company.ticker}:${fDef.key}`;
          if (src.id === 'manual' && overrides[overrideKey] !== undefined) return { source: src, value: overrides[overrideKey] };
          const val = simulateSourceValue(company, fDef.key, src.id, baseVal);
          return val !== null && val !== undefined ? { source: src, value: val } : null;
        }).filter(Boolean);

        if (values.length === 0) {
          companyResult.fields[fDef.key] = { value: baseVal, source: 'Base Data', confidence: 50, conflict: false, alternatives: [], sourceCount: 0, allValues: [] };
          return;
        }

        const numericValues = values.filter(v => typeof v.value === 'number');
        let hasConflict = false;
        if (numericValues.length > 1) {
          const maxV = Math.max(...numericValues.map(v => v.value));
          const minV = Math.min(...numericValues.map(v => v.value));
          hasConflict = minV > 0 && (maxV / minV) > 1.1;
        }

        const winner = values[0];
        companyResult.fields[fDef.key] = {
          value: winner.value,
          source: winner.source.name,
          sourceId: winner.source.id,
          confidence: winner.source.reliability,
          conflict: hasConflict,
          alternatives: values.slice(1).map(v => ({ value: v.value, source: v.source.name, sourceId: v.source.id, reliability: v.source.reliability })),
          sourceCount: values.length,
          allValues: values.map(v => ({ value: v.value, source: v.source.name, sourceId: v.source.id, reliability: v.source.reliability, priority: v.source.priority })),
        };
      });

      results.push(companyResult);
    });
    return results;
  }, [companies, sourceConfig, overrides]);

  /* ── Derived stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    let totalFields = 0, conflicts = 0, autoResolved = 0, manualNeeded = 0, totalConfidence = 0, confCount = 0;
    const sourceCoverage = {};
    const fieldConflicts = {};

    reconciled.forEach(r => {
      RECONCILE_FIELDS.forEach(fDef => {
        const f = r.fields[fDef.key];
        if (!f) return;
        totalFields++;
        if (f.conflict) {
          conflicts++;
          fieldConflicts[fDef.key] = (fieldConflicts[fDef.key] || 0) + 1;
          if (f.sourceCount > 1) autoResolved++;
          else manualNeeded++;
        }
        if (f.confidence) { totalConfidence += f.confidence; confCount++; }
        f.allValues?.forEach(v => { sourceCoverage[v.source] = (sourceCoverage[v.source] || 0) + 1; });
      });
    });

    const coverageOverlap = {};
    reconciled.forEach(r => {
      const cnt = RECONCILE_FIELDS.reduce((acc, fDef) => acc + (r.fields[fDef.key]?.sourceCount || 0 > 1 ? 1 : 0), 0);
      const bucket = cnt >= 4 ? '4+' : String(cnt);
      coverageOverlap[bucket] = (coverageOverlap[bucket] || 0) + 1;
    });

    return { totalFields, conflicts, autoResolved, manualNeeded, avgConfidence: confCount > 0 ? totalConfidence / confCount : 0, sourceCoverage, fieldConflicts, coverageOverlap, agreementRate: totalFields > 0 ? ((totalFields - conflicts) / totalFields) * 100 : 100 };
  }, [reconciled]);

  /* ── Source agreement heatmap data ────────────────────────────── */
  const agreementMatrix = useMemo(() => {
    const srcIds = sourceConfig.map(s => s.id);
    const matrix = [];
    for (let i = 0; i < srcIds.length; i++) {
      for (let j = i + 1; j < srcIds.length; j++) {
        let agree = 0, total = 0;
        reconciled.forEach(r => {
          RECONCILE_FIELDS.forEach(fDef => {
            const f = r.fields[fDef.key];
            if (!f || !f.allValues) return;
            const v1 = f.allValues.find(v => v.sourceId === srcIds[i]);
            const v2 = f.allValues.find(v => v.sourceId === srcIds[j]);
            if (v1 && v2) {
              total++;
              if (typeof v1.value === 'number' && typeof v2.value === 'number') {
                if (Math.abs(v1.value - v2.value) / (Math.max(Math.abs(v1.value), 1)) < 0.1) agree++;
              } else if (v1.value === v2.value) agree++;
            }
          });
        });
        matrix.push({ src1: sourceConfig[i].name.split(' ')[0], src2: sourceConfig[j].name.split(' ')[0], agreement: total > 0 ? Math.round(agree / total * 100) : 0, total });
      }
    }
    return matrix;
  }, [reconciled, sourceConfig]);

  /* ── Conflicts list ────────────────────────────────────────────── */
  const conflictsList = useMemo(() => {
    const list = [];
    reconciled.forEach(r => {
      RECONCILE_FIELDS.forEach(fDef => {
        const f = r.fields[fDef.key];
        if (!f || !f.conflict) return;
        list.push({ company: r.company, ticker: r.ticker, exchange: r.exchange, field: fDef.key, fieldLabel: fDef.label, winner: f.value, winnerSource: f.source, confidence: f.confidence, alternatives: f.alternatives, allValues: f.allValues });
      });
    });
    return list;
  }, [reconciled]);

  /* ── Filtered conflicts/reconciled ─────────────────────────────── */
  const filteredConflicts = useMemo(() => {
    let list = conflictsList;
    if (searchTerm) { const s = searchTerm.toLowerCase(); list = list.filter(c => c.company.toLowerCase().includes(s) || c.ticker.toLowerCase().includes(s)); }
    if (fieldFilter !== 'all') list = list.filter(c => c.field === fieldFilter);
    list.sort((a, b) => {
      if (sortCol === 'company') return sortDir === 'asc' ? a.company.localeCompare(b.company) : b.company.localeCompare(a.company);
      if (sortCol === 'field') return sortDir === 'asc' ? a.field.localeCompare(b.field) : b.field.localeCompare(a.field);
      if (sortCol === 'confidence') return sortDir === 'asc' ? a.confidence - b.confidence : b.confidence - a.confidence;
      return 0;
    });
    return list;
  }, [conflictsList, searchTerm, fieldFilter, sortCol, sortDir]);

  /* ── Chart data ────────────────────────────────────────────────── */
  const coveragePieData = useMemo(() => {
    const counts = { '0': 0, '1': 0, '2': 0, '3': 0, '4+': 0 };
    reconciled.forEach(r => {
      const maxSrc = Math.max(...RECONCILE_FIELDS.map(fDef => r.fields[fDef.key]?.sourceCount || 0));
      const bucket = maxSrc >= 4 ? '4+' : String(maxSrc);
      counts[bucket]++;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: `${k} sources`, value: v }));
  }, [reconciled]);

  const sourceReliabilityData = useMemo(() => sourceConfig.map(s => ({ name: s.name.split(' ')[0], reliability: s.reliability, coverage: parseInt(s.coverage.match(/\d+/) || [0]) || 0, priority: s.priority })), [sourceConfig]);
  const fieldConflictData = useMemo(() => Object.entries(stats.fieldConflicts).map(([k, v]) => ({ name: RECONCILE_FIELDS.find(f => f.key === k)?.label || k, conflicts: v })).sort((a, b) => b.conflicts - a.conflicts), [stats]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const toggleSort = useCallback(col => { setSortCol(col); setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }, [sortCol]);

  const changePriority = useCallback((sourceId, delta) => {
    setSourceConfig(prev => {
      const next = prev.map(s => s.id === sourceId ? { ...s, priority: Math.max(0, Math.min(5, s.priority + delta)) } : s);
      const config = {};
      next.forEach(s => { config[s.id] = { priority: s.priority }; });
      saveLS(LS_CONFIG, config);
      return next;
    });
  }, []);

  const applyOverride = useCallback((ticker, field, value) => {
    const key = `${ticker}:${field}`;
    setOverrides(prev => { const next = { ...prev, [key]: value }; saveLS(LS_OVERRIDES, next); return next; });
    setResolutionLog(prev => {
      const entry = { ts: new Date().toISOString(), ticker, field, value, type: 'manual' };
      const next = [entry, ...prev].slice(0, 200);
      saveLS(LS_RESOLUTIONS, next);
      return next;
    });
  }, []);

  const bulkReconcile = useCallback(() => {
    let count = 0;
    conflictsList.forEach(c => {
      if (c.allValues.length > 1 && !overrides[`${c.ticker}:${c.field}`]) {
        const best = c.allValues.sort((a, b) => a.priority - b.priority)[0];
        const key = `${c.ticker}:${c.field}`;
        overrides[key] = best.value;
        count++;
      }
    });
    setOverrides({ ...overrides });
    saveLS(LS_OVERRIDES, overrides);
    setResolutionLog(prev => {
      const entry = { ts: new Date().toISOString(), ticker: 'BULK', field: 'all', value: `${count} fields reconciled`, type: 'bulk' };
      const next = [entry, ...prev].slice(0, 200);
      saveLS(LS_RESOLUTIONS, next);
      return next;
    });
  }, [conflictsList, overrides]);

  /* ── Exports ───────────────────────────────────────────────────── */
  const exportReconciliationCSV = useCallback(() => {
    const hdr = 'Company,Ticker,Exchange,Field,Reconciled Value,Source,Confidence,Conflict,Alternatives\n';
    const rows = [];
    reconciled.forEach(r => {
      RECONCILE_FIELDS.forEach(fDef => {
        const f = r.fields[fDef.key];
        if (!f) return;
        rows.push(`"${r.company}","${r.ticker}","${r.exchange}","${fDef.label}","${f.value ?? ''}","${f.source}","${f.confidence}","${f.conflict}","${(f.alternatives || []).map(a => `${a.source}:${a.value}`).join('; ')}"`);
      });
    });
    const blob = new Blob([hdr + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reconciliation_report.csv'; a.click();
  }, [reconciled]);

  const exportConflictCSV = useCallback(() => {
    const hdr = 'Company,Ticker,Field,Winner Value,Winner Source,Confidence,All Values\n';
    const rows = filteredConflicts.map(c => `"${c.company}","${c.ticker}","${c.fieldLabel}","${c.winner}","${c.winnerSource}","${c.confidence}","${c.allValues.map(v => `${v.source}:${v.value}`).join('; ')}"`);
    const blob = new Blob([hdr + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'conflict_log.csv'; a.click();
  }, [filteredConflicts]);

  const printReport = useCallback(() => window.print(), []);

  /* ── Source deep dive ──────────────────────────────────────────── */
  const sourceDeepDive = useMemo(() => {
    if (!selectedSource) return null;
    const src = sourceConfig.find(s => s.id === selectedSource);
    if (!src) return null;
    let provided = 0, companiesCovered = new Set(), disagreements = 0;
    reconciled.forEach(r => {
      RECONCILE_FIELDS.forEach(fDef => {
        const f = r.fields[fDef.key];
        if (!f || !f.allValues) return;
        const sv = f.allValues.find(v => v.sourceId === selectedSource);
        if (sv) {
          provided++;
          companiesCovered.add(r.ticker);
          if (f.conflict && f.sourceId !== selectedSource) disagreements++;
        }
      });
    });
    return { ...src, provided, companiesCovered: companiesCovered.size, disagreements };
  }, [selectedSource, sourceConfig, reconciled]);

  /* ── Styles ────────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 };
  const kpiCard = { ...card, textAlign: 'center', minWidth: 120 };
  const badge = (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + '18', color, marginLeft: 6 });
  const btn = (bg = T.navy) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: T.font });
  const tabBtn = (active) => ({ padding: '8px 20px', borderRadius: '8px 8px 0 0', border: `1px solid ${active ? T.navy : T.border}`, borderBottom: active ? `2px solid ${T.navy}` : 'none', background: active ? T.surface : T.surfaceH, color: active ? T.navy : T.textSec, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: T.font });
  const inp = { padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 };
  const sel = { ...inp, background: T.surface };
  const thStyle = { padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.navy, fontWeight: 700, fontSize: 12, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 13, color: T.text };

  const TABS = ['dashboard', 'sources', 'conflicts', 'field-view', 'agreement', 'history', 'deep-dive'];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 32 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: T.navy }}>Multi-Source Data Reconciliation Engine</h1>
          <p style={{ margin: '4px 0 0', color: T.textSec, fontSize: 14 }}>
            Resolve conflicts across {sourceConfig.length} data sources with configurable priority rules
            <span style={badge(T.sage)}>{companies.length} Companies</span>
            <span style={badge(stats.conflicts > 0 ? T.amber : T.green)}>{stats.conflicts} Conflicts</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn(T.sage)} onClick={bulkReconcile}>Reconcile All</button>
          <button style={btn(T.gold)} onClick={exportReconciliationCSV}>Report CSV</button>
          <button style={btn(T.navyL)} onClick={exportConflictCSV}>Conflicts CSV</button>
          <button style={btn('#6b7280')} onClick={printReport}>Print</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Data Sources', value: sourceConfig.length, color: T.navy },
          { label: 'Fields Reconciled', value: fmt(stats.totalFields), color: T.sage },
          { label: 'Conflicts Detected', value: fmt(stats.conflicts), color: stats.conflicts > 50 ? T.red : T.amber },
          { label: 'Auto-Resolved', value: fmt(stats.autoResolved), color: T.green },
          { label: 'Manual Needed', value: fmt(stats.manualNeeded), color: T.red },
          { label: 'Avg Confidence', value: pct(stats.avgConfidence), color: stats.avgConfidence > 85 ? T.green : T.amber },
          { label: 'Overrides Applied', value: Object.keys(overrides).length, color: '#7c3aed' },
          { label: 'Agreement Rate', value: pct(stats.agreementRate), color: stats.agreementRate > 90 ? T.green : T.amber },
        ].map((k, i) => (
          <div key={i} style={kpiCard}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</button>)}
      </div>

      {/* ── DASHBOARD TAB ─────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Coverage pie */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Coverage Overlap (Companies by Source Count)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart><Pie data={coveragePieData} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {coveragePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            {/* Field conflicts bar */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Conflicts by Field</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fieldConflictData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="conflicts" fill={T.red} radius={[0, 4, 4, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Source reliability */}
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Source Reliability Comparison</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sourceReliabilityData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Bar dataKey="reliability" fill={T.sage} name="Reliability %" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          {/* Data freshness */}
          <div style={{ ...card, marginTop: 20 }}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Data Freshness Comparison</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {sourceConfig.map((src, i) => (
                <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, borderLeft: `4px solid ${src.color}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{src.name.split('(')[0].trim()}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: src.color, margin: '6px 0' }}>{src.freshness}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>Coverage: {src.coverage}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SOURCES TAB ───────────────────────────────────────── */}
      {tab === 'sources' && (
        <div style={{ paddingTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Source Priority Configuration <span style={{ fontSize: 12, color: T.textMut, fontWeight: 400 }}>(Lower priority number = higher precedence)</span></h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thStyle}>Source</th><th style={thStyle}>Priority</th><th style={thStyle}>Coverage</th><th style={thStyle}>Reliability</th><th style={thStyle}>Freshness</th><th style={thStyle}>Fields</th><th style={thStyle}>Actions</th>
              </tr></thead>
              <tbody>
                {[...sourceConfig].sort((a, b) => a.priority - b.priority).map((src, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: src.color + '20', color: src.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{src.icon}</span>
                        <div><div style={{ fontWeight: 600 }}>{src.name}</div></div>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: 20, fontWeight: 700, color: src.priority === 0 ? T.green : src.priority <= 1 ? T.sage : T.amber }}>{src.priority}</span></td>
                    <td style={tdStyle}>{src.coverage}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}><div style={{ width: `${src.reliability}%`, height: '100%', background: src.reliability > 90 ? T.green : T.amber, borderRadius: 3 }} /></div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{src.reliability}%</span>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={badge(src.freshness === 'Live' ? T.green : T.amber)}>{src.freshness}</span></td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{src.fields.join(', ').slice(0, 50)}{src.fields.join(', ').length > 50 ? '...' : ''}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ ...btn(T.navyL), padding: '3px 8px', fontSize: 11 }} onClick={() => changePriority(src.id, -1)} disabled={src.priority <= 0}>Up</button>
                        <button style={{ ...btn('#6b7280'), padding: '3px 8px', fontSize: 11 }} onClick={() => changePriority(src.id, 1)} disabled={src.priority >= 5}>Down</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONFLICTS TAB ─────────────────────────────────────── */}
      {tab === 'conflicts' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input style={{ ...inp, width: 220 }} placeholder="Search company, ticker..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select style={sel} value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}>
              <option value="all">All Fields</option>
              {RECONCILE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <span style={{ color: T.textMut, fontSize: 13 }}>{filteredConflicts.length} conflicts</span>
          </div>
          <div style={{ ...card, padding: 0, overflow: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                <tr>
                  {[{ col: 'company', label: 'Company' }, { col: 'field', label: 'Field' }, { col: 'confidence', label: 'Confidence' }].map(h => (
                    <th key={h.col} style={thStyle} onClick={() => toggleSort(h.col)}>{h.label} {sortCol === h.col ? (sortDir === 'asc' ? ' ^' : ' v') : ''}</th>
                  ))}
                  <th style={thStyle}>Winner</th>
                  <th style={thStyle}>Alternatives</th>
                  <th style={thStyle}>Override</th>
                </tr>
              </thead>
              <tbody>
                {filteredConflicts.slice(0, 150).map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{c.company}</span><br /><span style={{ fontSize: 11, color: T.textMut }}>{c.ticker} | {c.exchange}</span></td>
                    <td style={tdStyle}><code style={{ background: T.surfaceH, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>{c.fieldLabel}</code></td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: c.confidence > 90 ? T.green : T.amber }}>{c.confidence}%</span></td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: T.navy }}>{typeof c.winner === 'number' ? fmt(c.winner) : c.winner}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>{c.winnerSource}</div>
                    </td>
                    <td style={tdStyle}>
                      {(c.alternatives || []).slice(0, 3).map((a, j) => (
                        <div key={j} style={{ fontSize: 11, color: T.textSec }}>
                          {a.source}: <span style={{ fontWeight: 600 }}>{typeof a.value === 'number' ? fmt(a.value) : a.value}</span>
                          <button style={{ marginLeft: 6, padding: '1px 6px', fontSize: 10, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surfaceH, cursor: 'pointer', fontFamily: T.font }} onClick={() => applyOverride(c.ticker, c.field, a.value)}>Use</button>
                        </div>
                      ))}
                    </td>
                    <td style={tdStyle}>
                      {overrides[`${c.ticker}:${c.field}`] !== undefined
                        ? <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>Set: {fmt(overrides[`${c.ticker}:${c.field}`])}</span>
                        : <span style={{ fontSize: 11, color: T.textMut }}>---</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredConflicts.length > 150 && <div style={{ padding: 12, textAlign: 'center', color: T.textMut, fontSize: 13 }}>Showing 150 of {filteredConflicts.length}. Export for full list.</div>}
          </div>
        </div>
      )}

      {/* ── FIELD VIEW TAB ────────────────────────────────────── */}
      {tab === 'field-view' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <select style={sel} value={selectedCompany || ''} onChange={e => setSelectedCompany(e.target.value || null)}>
              <option value="">Select a company...</option>
              {companies.slice(0, 200).map(c => <option key={c.ticker} value={c.ticker}>{c.name} ({c.ticker})</option>)}
            </select>
            {selectedCompany && <span style={{ color: T.textMut, fontSize: 13 }}>Showing all fields for {selectedCompany}</span>}
          </div>
          {selectedCompany && (() => {
            const r = reconciled.find(r => r.ticker === selectedCompany);
            if (!r) return <div style={{ color: T.textMut }}>Company not found.</div>;
            return (
              <div style={{ ...card, padding: 0, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={thStyle}>Field</th>
                    {sourceConfig.map(s => <th key={s.id} style={{ ...thStyle, fontSize: 11 }}>{s.name.split(' ')[0]}</th>)}
                    <th style={{ ...thStyle, background: T.navy + '10' }}>Reconciled</th>
                    <th style={thStyle}>Source</th>
                    <th style={thStyle}>Conflict</th>
                  </tr></thead>
                  <tbody>
                    {RECONCILE_FIELDS.map((fDef, i) => {
                      const f = r.fields[fDef.key];
                      return (
                        <tr key={i} style={{ background: f?.conflict ? T.red + '08' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{fDef.label}</td>
                          {sourceConfig.map(s => {
                            const sv = f?.allValues?.find(v => v.sourceId === s.id);
                            return <td key={s.id} style={{ ...tdStyle, fontSize: 12, color: sv ? T.text : T.textMut }}>{sv ? (typeof sv.value === 'number' ? fmt(sv.value) : sv.value) : '---'}</td>;
                          })}
                          <td style={{ ...tdStyle, fontWeight: 700, background: T.navy + '08', color: T.navy }}>{f ? (typeof f.value === 'number' ? fmt(f.value) : f.value) : '---'}</td>
                          <td style={{ ...tdStyle, fontSize: 11 }}>{f?.source || '---'}</td>
                          <td style={tdStyle}>{f?.conflict ? <span style={{ color: T.red, fontWeight: 700, fontSize: 12 }}>CONFLICT</span> : <span style={{ color: T.green, fontSize: 12 }}>OK</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
          {!selectedCompany && <div style={{ ...card, color: T.textMut, textAlign: 'center', padding: 40 }}>Select a company above to view field-level reconciliation details.</div>}
        </div>
      )}

      {/* ── AGREEMENT TAB ─────────────────────────────────────── */}
      {tab === 'agreement' && (
        <div style={{ paddingTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Source Agreement Heatmap (% of shared fields within 10% tolerance)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {agreementMatrix.map((cell, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: cell.agreement > 85 ? T.green + '15' : cell.agreement > 70 ? T.amber + '15' : T.red + '15', border: `1px solid ${cell.agreement > 85 ? T.green + '40' : cell.agreement > 70 ? T.amber + '40' : T.red + '40'}` }}>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{cell.src1} vs {cell.src2}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: cell.agreement > 85 ? T.green : cell.agreement > 70 ? T.amber : T.red }}>{cell.agreement}%</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{cell.total} shared fields</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ───────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <button style={btn('#6b7280')} onClick={() => { setResolutionLog([]); saveLS(LS_RESOLUTIONS, []); }}>Clear History</button>
            <button style={btn('#6b7280')} onClick={() => { setOverrides({}); saveLS(LS_OVERRIDES, {}); }}>Reset Overrides</button>
            <span style={{ color: T.textMut, fontSize: 13 }}>{resolutionLog.length} entries</span>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Reconciliation History</h3>
            {resolutionLog.length === 0 && <div style={{ color: T.textMut, fontSize: 13 }}>No reconciliation actions recorded yet.</div>}
            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={thStyle}>Timestamp</th><th style={thStyle}>Ticker</th><th style={thStyle}>Field</th><th style={thStyle}>Value</th><th style={thStyle}>Type</th>
                </tr></thead>
                <tbody>
                  {resolutionLog.map((e, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={tdStyle}>{new Date(e.ts).toLocaleString()}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{e.ticker}</td>
                      <td style={tdStyle}><code style={{ fontSize: 11 }}>{e.field}</code></td>
                      <td style={tdStyle}>{typeof e.value === 'number' ? fmt(e.value) : String(e.value).slice(0, 40)}</td>
                      <td style={tdStyle}><span style={badge(e.type === 'manual' ? '#7c3aed' : T.sage)}>{e.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DEEP DIVE TAB ─────────────────────────────────────── */}
      {tab === 'deep-dive' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <select style={sel} value={selectedSource || ''} onChange={e => setSelectedSource(e.target.value || null)}>
              <option value="">Select a data source...</option>
              {sourceConfig.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {sourceDeepDive && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: sourceDeepDive.color + '20', color: sourceDeepDive.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: 8 }}>{sourceDeepDive.icon}</span>
                  {sourceDeepDive.name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Priority', value: sourceDeepDive.priority },
                    { label: 'Reliability', value: `${sourceDeepDive.reliability}%` },
                    { label: 'Coverage', value: sourceDeepDive.coverage },
                    { label: 'Freshness', value: sourceDeepDive.freshness },
                    { label: 'Fields Provided', value: fmt(sourceDeepDive.provided) },
                    { label: 'Companies Covered', value: sourceDeepDive.companiesCovered },
                    { label: 'Disagreements', value: sourceDeepDive.disagreements },
                  ].map((d, i) => (
                    <div key={i} style={{ padding: 10, background: T.surfaceH, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{d.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Fields Provided</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {sourceDeepDive.fields.map((f, i) => (
                    <span key={i} style={{ padding: '6px 12px', borderRadius: 8, background: sourceDeepDive.color + '15', color: sourceDeepDive.color, fontSize: 12, fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Agreement with Other Sources</h4>
                  {agreementMatrix.filter(m => m.src1 === sourceDeepDive.name.split(' ')[0] || m.src2 === sourceDeepDive.name.split(' ')[0]).map((m, i) => {
                    const other = m.src1 === sourceDeepDive.name.split(' ')[0] ? m.src2 : m.src1;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 13 }}>{other}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 6, background: T.border, borderRadius: 3 }}><div style={{ width: `${m.agreement}%`, height: '100%', background: m.agreement > 85 ? T.green : T.amber, borderRadius: 3 }} /></div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: m.agreement > 85 ? T.green : T.amber }}>{m.agreement}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {!selectedSource && <div style={{ ...card, color: T.textMut, textAlign: 'center', padding: 40 }}>Select a data source above to view detailed analysis.</div>}
        </div>
      )}

      {/* ── DASHBOARD EXTRA: Source-Conflict Distribution ────── */}
      {tab === 'dashboard' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Conflict Distribution by Source Winner</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {sourceConfig.map((src, i) => {
                const winsConflict = conflictsList.filter(c => c.winnerSource === src.name).length;
                const totalWins = reconciled.reduce((acc, r) => acc + RECONCILE_FIELDS.filter(fDef => r.fields[fDef.key]?.source === src.name).length, 0);
                return (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, textAlign: 'center', borderTop: `3px solid ${src.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: src.color }}>{src.name.split('(')[0].trim()}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMut }}>Total Wins</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{totalWins}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMut }}>Conflict Wins</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{winsConflict}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>Priority: {src.priority} | Reliability: {src.reliability}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DASHBOARD EXTRA: Reconciliation Quality Score ──── */}
      {tab === 'dashboard' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div style={{ ...card, textAlign: 'center', borderTop: `3px solid ${T.green}` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Fully Agreed Fields</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.green, margin: '8px 0' }}>
                {stats.totalFields - stats.conflicts}
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>All sources agree within 10%</div>
            </div>
            <div style={{ ...card, textAlign: 'center', borderTop: `3px solid ${T.amber}` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Conflicting Fields</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.amber, margin: '8px 0' }}>
                {stats.conflicts}
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>Sources disagree by &gt;10%</div>
            </div>
            <div style={{ ...card, textAlign: 'center', borderTop: `3px solid ${T.navy}` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Reconciliation Confidence</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.navy, margin: '8px 0' }}>
                {stats.avgConfidence.toFixed(0)}%
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>Weighted by source reliability</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SOURCES TAB EXTRA: Field Coverage Matrix ──────────── */}
      {tab === 'sources' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Source-Field Coverage Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Source</th>
                    {RECONCILE_FIELDS.map(f => <th key={f.key} style={{ ...thStyle, fontSize: 10, writingMode: 'vertical-lr', height: 80 }}>{f.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sourceConfig.map((src, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: src.color, marginRight: 6 }} />
                        {src.name.split('(')[0].trim()}
                      </td>
                      {RECONCILE_FIELDS.map(f => {
                        const hasField = src.fields.includes(f.key) || src.fields.includes('any');
                        return (
                          <td key={f.key} style={{ ...tdStyle, textAlign: 'center' }}>
                            {hasField
                              ? <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: T.green + '30', color: T.green, fontSize: 11, fontWeight: 700, lineHeight: '16px' }}>Y</span>
                              : <span style={{ color: T.textMut, fontSize: 11 }}>-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFLICTS TAB EXTRA: Conflict Summary by Field ────── */}
      {tab === 'conflicts' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {RECONCILE_FIELDS.map((fDef, i) => {
              const fieldConflicts = conflictsList.filter(c => c.field === fDef.key);
              const resolved = fieldConflicts.filter(c => overrides[`${c.ticker}:${c.field}`] !== undefined);
              return (
                <div key={i} style={{ ...card, padding: 14, borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{fDef.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMut }}>Conflicts</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: fieldConflicts.length > 0 ? T.red : T.green }}>{fieldConflicts.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMut }}>Resolved</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{resolved.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMut }}>Pending</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{fieldConflicts.length - resolved.length}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AGREEMENT TAB EXTRA: Pair-wise details ────────────── */}
      {tab === 'agreement' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Agreement Summary Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ padding: 14, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Highest Agreement</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green, margin: '6px 0' }}>
                  {agreementMatrix.length > 0 ? Math.max(...agreementMatrix.map(m => m.agreement)) : 0}%
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  {agreementMatrix.length > 0 ? (() => { const best = agreementMatrix.reduce((a, b) => a.agreement > b.agreement ? a : b); return `${best.src1} vs ${best.src2}`; })() : '---'}
                </div>
              </div>
              <div style={{ padding: 14, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Lowest Agreement</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.red, margin: '6px 0' }}>
                  {agreementMatrix.length > 0 ? Math.min(...agreementMatrix.filter(m => m.total > 0).map(m => m.agreement)) : 0}%
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  {agreementMatrix.length > 0 ? (() => { const filtered = agreementMatrix.filter(m => m.total > 0); const worst = filtered.reduce((a, b) => a.agreement < b.agreement ? a : b, filtered[0]); return worst ? `${worst.src1} vs ${worst.src2}` : '---'; })() : '---'}
                </div>
              </div>
              <div style={{ padding: 14, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Average Agreement</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: '6px 0' }}>
                  {agreementMatrix.length > 0 ? (agreementMatrix.reduce((a, m) => a + m.agreement, 0) / agreementMatrix.length).toFixed(0) : 0}%
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>Across {agreementMatrix.length} source pairs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB EXTRA: Override summary ───────────────── */}
      {tab === 'history' && Object.keys(overrides).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Active Manual Overrides ({Object.keys(overrides).length})</h3>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={thStyle}>Ticker</th><th style={thStyle}>Field</th><th style={thStyle}>Override Value</th>
                </tr></thead>
                <tbody>
                  {Object.entries(overrides).map(([key, value], i) => {
                    const [ticker, field] = key.split(':');
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{ticker}</td>
                        <td style={tdStyle}><code style={{ fontSize: 11 }}>{field}</code></td>
                        <td style={{ ...tdStyle, color: '#7c3aed', fontWeight: 600 }}>{typeof value === 'number' ? fmt(value) : String(value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DEEP DIVE EXTRA: Companies served by source ──────── */}
      {tab === 'deep-dive' && sourceDeepDive && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Top Companies from {sourceDeepDive.name.split('(')[0].trim()}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {reconciled.filter(r => RECONCILE_FIELDS.some(fDef => r.fields[fDef.key]?.allValues?.some(v => v.sourceId === selectedSource))).slice(0, 12).map((r, i) => {
                const fieldsFromSource = RECONCILE_FIELDS.filter(fDef => r.fields[fDef.key]?.allValues?.some(v => v.sourceId === selectedSource)).length;
                const conflictsFromSource = RECONCILE_FIELDS.filter(fDef => { const f = r.fields[fDef.key]; return f?.conflict && f?.allValues?.some(v => v.sourceId === selectedSource); }).length;
                return (
                  <div key={i} style={{ padding: 10, background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{r.company}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{r.ticker} | {r.exchange}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: T.sage }}>{fieldsFromSource} fields</span>
                      {conflictsFromSource > 0 && <span style={{ fontSize: 11, color: T.red }}>{conflictsFromSource} conflicts</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CROSS-NAV ─────────────────────────────────────────── */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Data Validation', path: '/data-validation' },
          { label: 'Data Quality Dashboard', path: '/data-quality' },
          { label: 'Data Lineage', path: '/data-lineage' },
          { label: 'Data Enrichment', path: '/enrichment' },
        ].map(l => (
          <button key={l.path} style={{ ...btn(T.navyL), padding: '10px 22px' }} onClick={() => nav(l.path)}>{l.label} &rarr;</button>
        ))}
      </div>
    </div>
  );
}
