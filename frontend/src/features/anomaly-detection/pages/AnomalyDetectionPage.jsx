import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORT = 'ra_portfolio_v1';
const LS_ANOM = 'ra_anomaly_detection_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Primitives ───────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? T.gold : T.border}`, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${accent || T.gold}`, fontFamily: T.font }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 600, background: T.surfaceH, color: T.textSec, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small, color }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, cursor: 'pointer', background: active ? T.navy : color || T.surface, color: active ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: T.font, transition: 'all 0.15s' }}>{children}</button>
);
const Badge = ({ label, color }) => {
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const thS = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3, cursor: 'pointer', userSelect: 'none' };
const tdS = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };
const SortIcon = ({ col, sortCol, sortDir }) => col === sortCol ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

/* ═══════════════════════════════════════════════════════════════════════════
   ANOMALY DETECTION — Z-Score, IQR, Isolation Score
   ═══════════════════════════════════════════════════════════════════════════ */
const MONITOR_FIELDS = [
  { key: 'esg_score', label: 'ESG Score', unit: '' },
  { key: 'ghg_intensity_tco2e_per_mn', label: 'GHG Intensity', unit: 'tCO2e/Mn' },
  { key: 'transition_risk_score', label: 'Transition Risk', unit: '' },
  { key: 'scope1_mt', label: 'Scope 1', unit: 'MT' },
  { key: 'scope2_mt', label: 'Scope 2', unit: 'MT' },
  { key: 'revenue_usd_mn', label: 'Revenue', unit: 'USD Mn' },
  { key: 'market_cap_usd_mn', label: 'Market Cap', unit: 'USD Mn' },
  { key: 'employees', label: 'Employees', unit: '' },
  { key: 'evic_usd_mn', label: 'EVIC', unit: 'USD Mn' },
  { key: 'data_quality_score', label: 'Data Quality', unit: '' },
];

/* ── Z-Score Method ──────────────────────────────────────────────────────── */
function zScoreAnomalies(values, threshold = 3) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length < 3) return values.map((v, i) => ({ index: i, value: v, zScore: 0, isAnomaly: false }));
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
  const std = Math.sqrt(valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length);
  return values.map((v, i) => {
    if (v === null || v === undefined || isNaN(v)) return { index: i, value: v, zScore: 0, isAnomaly: false };
    const z = (v - mean) / (std || 1);
    return { index: i, value: v, zScore: z, isAnomaly: Math.abs(z) > threshold, mean, std };
  });
}

/* ── IQR Method ──────────────────────────────────────────────────────────── */
function iqrAnomalies(values, multiplier = 1.5) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length < 4) return values.map((v, i) => ({ index: i, value: v, isAnomaly: false, bound: 'normal' }));
  const sorted = [...valid].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;
  return values.map((v, i) => {
    if (v === null || v === undefined || isNaN(v)) return { index: i, value: v, isAnomaly: false, bound: 'normal' };
    return { index: i, value: v, isAnomaly: v < lower || v > upper, bound: v < lower ? 'below' : v > upper ? 'above' : 'normal', q1, q3, iqr, lower, upper };
  });
}

/* ── Isolation Score (simplified) ────────────────────────────────────────── */
function isolationScore(company, sectorPeers) {
  const fields = MONITOR_FIELDS.map(f => f.key);
  let totalDeviation = 0;
  let fieldsChecked = 0;
  const fieldDeviations = {};
  fields.forEach(f => {
    const val = company[f];
    if (val === undefined || val === null || isNaN(val)) return;
    const peerValues = sectorPeers.map(p => p[f]).filter(v => v !== undefined && v !== null && !isNaN(v));
    if (peerValues.length < 3) return;
    const mean = peerValues.reduce((s, v) => s + v, 0) / peerValues.length;
    const std = Math.sqrt(peerValues.reduce((s, v) => s + (v - mean) ** 2, 0) / peerValues.length) || 1;
    const dev = Math.abs((val - mean) / std);
    fieldDeviations[f] = dev;
    totalDeviation += dev;
    fieldsChecked++;
  });
  return { score: fieldsChecked > 0 ? totalDeviation / fieldsChecked : 0, fieldDeviations, fieldsChecked };
}

/* ── Enrichment ──────────────────────────────────────────────────────────── */
function enrichAnomaly(c, idx) {
  const s = seed(c.company_name || idx);
  return {
    ...c,
    esg_score: c.esg_score || Math.round(20 + sRand(s + 1) * 70),
    ghg_intensity_tco2e_per_mn: c.ghg_intensity_tco2e_per_mn || Math.round(5 + sRand(s + 2) * 800),
    transition_risk_score: c.transition_risk_score || Math.round(10 + sRand(s + 3) * 85),
    scope1_mt: c.scope1_mt || Math.round(100 + sRand(s + 4) * 90000),
    scope2_mt: c.scope2_mt || Math.round(50 + sRand(s + 5) * 30000),
    revenue_usd_mn: c.revenue_usd_mn || c.revenue_usd_mn || Math.round(100 + sRand(s + 6) * 50000),
    market_cap_usd_mn: c.market_cap_usd_mn || Math.round(200 + sRand(s + 7) * 80000),
    employees: c.employees || Math.round(100 + sRand(s + 8) * 100000),
    evic_usd_mn: c.evic_usd_mn || Math.round(300 + sRand(s + 9) * 90000),
    data_quality_score: c.data_quality_score || Math.round(15 + sRand(s + 10) * 80),
    sector: c.sector || 'Industrials',
    company_name: c.company_name || `Company_${idx}`,
    countryCode: c.countryCode || 'IN',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AnomalyDetectionPage() {
  const navigate = useNavigate();
  const portfolioRaw = useMemo(() => {
    const saved = localStorage.getItem(LS_PORT);
    const data = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  const [method, setMethod] = useState('all');
  const [zThreshold, setZThreshold] = useState(3);
  const [iqrMult, setIqrMult] = useState(1.5);
  const [sortCol, setSortCol] = useState('zScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [anomSettings, setAnomSettings] = useState(() => loadLS(LS_ANOM) || {});
  const [heatmapPage, setHeatmapPage] = useState(0);
  const HEATMAP_PAGE_SIZE = 25;

  useEffect(() => { saveLS(LS_ANOM, anomSettings); }, [anomSettings]);

  /* ── Build holdings ──────────────────────────────────────────────────────── */
  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 656).map((c, i) => enrichAnomaly(c, i));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return enrichAnomaly({ ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, countryCode: h.countryCode || master.countryCode || 'IN' }, i);
    });
  }, [portfolioRaw]);

  /* ── Run all anomaly detection ───────────────────────────────────────────── */
  const anomalyResults = useMemo(() => {
    const results = [];
    const sectorGroups = {};
    holdings.forEach(h => { if (!sectorGroups[h.sector]) sectorGroups[h.sector] = []; sectorGroups[h.sector].push(h); });

    MONITOR_FIELDS.forEach(field => {
      const values = holdings.map(h => h[field.key]);

      // Z-Score
      if (method === 'all' || method === 'zscore') {
        const zResults = zScoreAnomalies(values, zThreshold);
        zResults.forEach((r, i) => {
          if (r.isAnomaly) {
            results.push({ company: holdings[i].company_name, sector: holdings[i].sector, field: field.label, fieldKey: field.key, value: r.value, zScore: Math.abs(r.zScore), sectorMean: r.mean, std: r.std, method: 'Z-Score', severity: Math.abs(r.zScore) > 4 ? 'Critical' : Math.abs(r.zScore) > 3 ? 'High' : 'Medium', companyIdx: i, unit: field.unit });
          }
        });
      }

      // IQR
      if (method === 'all' || method === 'iqr') {
        const iqrResults = iqrAnomalies(values, iqrMult);
        iqrResults.forEach((r, i) => {
          if (r.isAnomaly) {
            const existing = results.find(e => e.companyIdx === i && e.fieldKey === field.key);
            if (!existing) {
              results.push({ company: holdings[i].company_name, sector: holdings[i].sector, field: field.label, fieldKey: field.key, value: r.value, zScore: 0, bound: r.bound, method: 'IQR', severity: 'Medium', companyIdx: i, unit: field.unit, q1: r.q1, q3: r.q3, lower: r.lower, upper: r.upper });
            }
          }
        });
      }
    });

    // Isolation Scores
    const isoScores = holdings.map((h, i) => {
      const peers = (sectorGroups[h.sector] || []).filter(p => p.company_name !== h.company_name);
      const iso = isolationScore(h, peers);
      return { ...iso, companyIdx: i, company: h.company_name, sector: h.sector };
    });

    if (method === 'all' || method === 'isolation') {
      isoScores.filter(iso => iso.score > 2).forEach(iso => {
        const existing = results.find(e => e.companyIdx === iso.companyIdx && e.method === 'Isolation');
        if (!existing) {
          results.push({ company: iso.company, sector: iso.sector, field: 'Multi-Field', fieldKey: 'isolation', value: iso.score, zScore: iso.score, method: 'Isolation', severity: iso.score > 3.5 ? 'Critical' : iso.score > 2.5 ? 'High' : 'Medium', companyIdx: iso.companyIdx, unit: 'score' });
        }
      });
    }

    return { anomalies: results, isoScores };
  }, [holdings, method, zThreshold, iqrMult]);

  const { anomalies, isoScores } = anomalyResults;

  /* ── Heatmap data ────────────────────────────────────────────────────────── */
  const heatmapData = useMemo(() => {
    return holdings.map((h, i) => {
      const row = { company: h.company_name, sector: h.sector, idx: i };
      MONITOR_FIELDS.forEach(f => {
        const values = holdings.map(c => c[f.key]).filter(v => v !== null && v !== undefined && !isNaN(v));
        if (values.length < 3) { row[f.key + '_z'] = 0; return; }
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || 1;
        row[f.key + '_z'] = h[f.key] !== null && h[f.key] !== undefined ? Math.abs((h[f.key] - mean) / std) : 0;
        row[f.key + '_val'] = h[f.key];
      });
      return row;
    });
  }, [holdings]);

  /* ── KPIs ────────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const critical = anomalies.filter(a => a.severity === 'Critical').length;
    const fieldCounts = {};
    anomalies.forEach(a => { fieldCounts[a.field] = (fieldCounts[a.field] || 0) + 1; });
    const mostAnomalousField = Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
    const compCounts = {};
    anomalies.forEach(a => { compCounts[a.company] = (compCounts[a.company] || 0) + 1; });
    const mostAnomalousCompany = Object.entries(compCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
    const avgIso = isoScores.length ? (isoScores.reduce((s, i) => s + i.score, 0) / isoScores.length).toFixed(2) : '0';
    const sectorCounts = {};
    anomalies.forEach(a => { sectorCounts[a.sector] = (sectorCounts[a.sector] || 0) + 1; });
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
    return { total: anomalies.length, critical, mostAnomalousField, mostAnomalousCompany, avgIso, topSector };
  }, [anomalies, isoScores]);

  /* ── Distribution data ───────────────────────────────────────────────────── */
  const distData = useMemo(() => {
    const counts = {};
    MONITOR_FIELDS.forEach(f => { counts[f.label] = 0; });
    anomalies.forEach(a => { if (counts[a.field] !== undefined) counts[a.field]++; });
    return Object.entries(counts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count);
  }, [anomalies]);

  /* ── Sector anomaly data ─────────────────────────────────────────────────── */
  const sectorAnomalyData = useMemo(() => {
    const counts = {};
    anomalies.forEach(a => { counts[a.sector] = (counts[a.sector] || 0) + 1; });
    return Object.entries(counts).map(([sector, count]) => ({ sector: sector.length > 18 ? sector.slice(0, 16) + '..' : sector, count })).sort((a, b) => b.count - a.count);
  }, [anomalies]);

  /* ── Isolation ranking ───────────────────────────────────────────────────── */
  const isoRanking = useMemo(() => [...isoScores].sort((a, b) => b.score - a.score).slice(0, 20), [isoScores]);

  /* ── Trend data (simulated) ──────────────────────────────────────────────── */
  const trendData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, i) => ({
      month: m,
      anomalies: Math.round(anomalies.length * (0.6 + sRand(i * 31 + 7) * 0.8)),
      critical: Math.round(kpis.critical * (0.4 + sRand(i * 47 + 3) * 1.2)),
    }));
  }, [anomalies.length, kpis.critical]);

  /* ── Sort ─────────────────────────────────────────────────────────────────── */
  const doSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const sortedAnomalies = useMemo(() => {
    return [...anomalies].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''));
    });
  }, [anomalies, sortCol, sortDir]);

  /* ── Export ───────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const header = 'Company,Sector,Field,Value,Sector Mean,Z-Score,Method,Severity\n';
    const rows = anomalies.map(a => `"${a.company}","${a.sector}","${a.field}",${fmt(a.value)},${fmt(a.sectorMean)},${a.zScore?.toFixed(2) || ''},${a.method},${a.severity}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'anomaly_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [anomalies]);

  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), method, zThreshold, iqrMult, totalAnomalies: anomalies.length, heatmap: heatmapData.slice(0, 50), anomalies: anomalies.slice(0, 200) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'anomaly_heatmap.json'; a.click(); URL.revokeObjectURL(url);
  }, [anomalies, heatmapData, method, zThreshold, iqrMult]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Heatmap color ───────────────────────────────────────────────────────── */
  const heatColor = (z) => {
    if (z > 3) return '#dc2626';
    if (z > 2) return '#d97706';
    if (z > 1.5) return '#fbbf24';
    if (z > 1) return '#a3e635';
    return '#16a34a';
  };

  /* ── Auto-fix suggestion ─────────────────────────────────────────────────── */
  const autoFix = useCallback((anom) => {
    if (!anom) return null;
    const peers = holdings.filter(h => h.sector === anom.sector);
    const vals = peers.map(h => h[anom.fieldKey]).filter(v => v !== null && v !== undefined && !isNaN(v)).sort((a, b) => a - b);
    if (vals.length < 3) return null;
    const median = vals[Math.floor(vals.length / 2)];
    const q1 = vals[Math.floor(vals.length * 0.25)];
    const q3 = vals[Math.floor(vals.length * 0.75)];
    const isDataError = Math.abs(anom.zScore || 0) > 5;
    return { median, q1, q3, suggestion: isDataError ? `Likely data error. Sector median: ${fmt(median)}. Consider replacing with median.` : `Real outlier vs sector. Median: ${fmt(median)}, IQR: [${fmt(q1)}, ${fmt(q3)}]. Investigate root cause.`, isDataError };
  }, [holdings]);

  /* ── Detail panel data ───────────────────────────────────────────────────── */
  const detailData = useMemo(() => {
    if (!selectedAnomaly) return null;
    const a = selectedAnomaly;
    const company = holdings[a.companyIdx];
    const peers = holdings.filter(h => h.sector === a.sector && h.company_name !== a.company);
    const peerVals = peers.map(h => h[a.fieldKey]).filter(v => v !== null && v !== undefined && !isNaN(v));
    const peerMean = peerVals.length ? peerVals.reduce((s, v) => s + v, 0) / peerVals.length : 0;
    const peerMin = peerVals.length ? Math.min(...peerVals) : 0;
    const peerMax = peerVals.length ? Math.max(...peerVals) : 0;
    const fix = autoFix(a);
    return { company, peers: peers.length, peerMean, peerMin, peerMax, fix };
  }, [selectedAnomaly, holdings, autoFix]);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' }}>

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>ESG Anomaly Detection Engine</h1>
          <Badge label="Z-Score" color="navy" />
          <Badge label="IQR" color="gold" />
          <Badge label="Isolation" color="purple" />
          <Badge label={`${MONITOR_FIELDS.length} Fields`} color="teal" />
          <Badge label={`${holdings.length} Companies`} color="blue" />
        </div>
        <p style={{ fontSize: 13, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>
          Statistical anomaly detection across ESG data universe. Three complementary methods identify data errors, outliers, and unusual patterns for investigation.
        </p>
      </div>

      {/* ── 2. DETECTION METHOD TOGGLE ─────────────────────────────────────── */}
      <Section title="Detection Method" badge="Select Algorithm">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ k: 'all', l: 'All Methods' }, { k: 'zscore', l: 'Z-Score (Parametric)' }, { k: 'iqr', l: 'IQR (Non-Parametric)' }, { k: 'isolation', l: 'Isolation Score' }].map(m => (
            <Btn key={m.k} active={method === m.k} onClick={() => setMethod(m.k)}>{m.l}</Btn>
          ))}
        </div>
      </Section>

      {/* ── 3. SENSITIVITY SLIDER ──────────────────────────────────────────── */}
      <Section title="Sensitivity Controls" badge="Adjust Thresholds">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>Z-Score Threshold: <strong style={{ color: T.navy }}>{zThreshold.toFixed(1)}\u03C3</strong></div>
            <input type="range" min={200} max={400} value={zThreshold * 100} onChange={e => setZThreshold(Number(e.target.value) / 100)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}><span>2\u03C3 (Loose)</span><span>4\u03C3 (Strict)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>IQR Multiplier: <strong style={{ color: T.navy }}>{iqrMult.toFixed(1)}x</strong></div>
            <input type="range" min={100} max={300} value={iqrMult * 100} onChange={e => setIqrMult(Number(e.target.value) / 100)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}><span>1.0x (Loose)</span><span>3.0x (Strict)</span></div>
          </div>
        </div>
      </Section>

      {/* ── 4. KPI CARDS ───────────────────────────────────────────────────── */}
      <Section title="Detection Summary" badge="8 KPIs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
          <KpiCard label="Companies Scanned" value={holdings.length} sub="Full universe" accent={T.navy} />
          <KpiCard label="Anomalies Detected" value={kpis.total} sub={`${(kpis.total / holdings.length * 100).toFixed(1)}% hit rate`} accent={T.red} />
          <KpiCard label="Critical (>4\u03C3)" value={kpis.critical} sub="Immediate review" accent="#dc2626" />
          <KpiCard label="Fields Monitored" value={MONITOR_FIELDS.length} sub="ESG + Financial" accent={T.sage} />
          <KpiCard label="Most Anomalous Co." value={kpis.mostAnomalousCompany.length > 16 ? kpis.mostAnomalousCompany.slice(0, 14) + '..' : kpis.mostAnomalousCompany} sub="Highest flag count" />
          <KpiCard label="Most Anomalous Field" value={kpis.mostAnomalousField} sub="Across all methods" accent={T.amber} />
          <KpiCard label="Avg Isolation Score" value={kpis.avgIso} sub="Cross-field deviation" accent="#7c3aed" />
          <KpiCard label="Top Sector" value={kpis.topSector.length > 15 ? kpis.topSector.slice(0, 13) + '..' : kpis.topSector} sub="Most anomalies" accent={T.gold} />
        </div>
      </Section>

      {/* ── 5. ANOMALY HEATMAP ─────────────────────────────────────────────── */}
      <Section title="Anomaly Heatmap" badge={`Companies x ${MONITOR_FIELDS.length} Fields`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.textMut }}>Page {heatmapPage + 1}/{Math.ceil(heatmapData.length / HEATMAP_PAGE_SIZE)}</span>
            <Btn small onClick={() => setHeatmapPage(p => Math.max(0, p - 1))}>Prev</Btn>
            <Btn small onClick={() => setHeatmapPage(p => Math.min(Math.ceil(heatmapData.length / HEATMAP_PAGE_SIZE) - 1, p + 1))}>Next</Btn>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, fontSize: 10 }}>
              <span style={{ background: '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>Normal</span>
              <span style={{ background: '#d97706', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>2-3\u03C3</span>
              <span style={{ background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>&gt;3\u03C3</span>
            </div>
          </div>
          <table style={{ ...tbl, fontSize: 10 }}>
            <thead>
              <tr>
                <th style={{ ...thS, fontSize: 10, minWidth: 120 }}>Company</th>
                {MONITOR_FIELDS.map(f => <th key={f.key} style={{ ...thS, fontSize: 9, textAlign: 'center', minWidth: 65 }}>{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {heatmapData.slice(heatmapPage * HEATMAP_PAGE_SIZE, (heatmapPage + 1) * HEATMAP_PAGE_SIZE).map((row, ri) => (
                <tr key={ri} style={{ cursor: 'pointer' }} onClick={() => setSelectedCompany(holdings[row.idx])}>
                  <td style={{ ...tdS, fontSize: 10, fontWeight: 600 }}>{(row.company || '').slice(0, 22)}</td>
                  {MONITOR_FIELDS.map(f => {
                    const z = row[f.key + '_z'] || 0;
                    return (
                      <td key={f.key} style={{ ...tdS, textAlign: 'center', background: heatColor(z), color: z > 2 ? '#fff' : T.text, fontSize: 9, fontWeight: z > 2 ? 700 : 400 }}>
                        {z.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 6. ANOMALY DISTRIBUTION BAR CHART ──────────────────────────────── */}
      <Section title="Anomaly Distribution by Field" badge="BarChart">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distData} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="field" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="count" name="Anomalies" radius={[4, 4, 0, 0]}>
                {distData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 7. ANOMALY LOG TABLE ───────────────────────────────────────────── */}
      <Section title="Anomaly Log" badge={`${anomalies.length} records`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{ k: 'company', l: 'Company' }, { k: 'field', l: 'Field' }, { k: 'value', l: 'Value' }, { k: 'sectorMean', l: 'Sector Mean' }, { k: 'zScore', l: 'Z-Score' }, { k: 'method', l: 'Method' }, { k: 'severity', l: 'Severity' }].map(c => (
                  <th key={c.k} style={thS} onClick={() => doSort(c.k)}>{c.l}<SortIcon col={c.k} sortCol={sortCol} sortDir={sortDir} /></th>
                ))}
                <th style={thS}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnomalies.slice(0, 50).map((a, i) => (
                <tr key={i} style={{ cursor: 'pointer', background: selectedAnomaly === a ? T.surfaceH : 'transparent' }} onClick={() => setSelectedAnomaly(a)}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(a.company || '').slice(0, 22)}</td>
                  <td style={tdS}>{a.field}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{fmt(a.value)}</td>
                  <td style={tdS}>{fmt(a.sectorMean)}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: (a.zScore || 0) > 4 ? T.red : (a.zScore || 0) > 3 ? T.amber : T.text }}>{a.zScore ? a.zScore.toFixed(2) : '---'}</td>
                  <td style={tdS}><Badge label={a.method} color={a.method === 'Z-Score' ? 'navy' : a.method === 'IQR' ? 'gold' : 'purple'} /></td>
                  <td style={tdS}><Badge label={a.severity} color={a.severity === 'Critical' ? 'red' : a.severity === 'High' ? 'amber' : 'blue'} /></td>
                  <td style={tdS}><Btn small onClick={(e) => { e.stopPropagation(); setSelectedAnomaly(a); }}>Inspect</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
          {anomalies.length > 50 && <div style={{ fontSize: 11, color: T.textMut, marginTop: 8, textAlign: 'center' }}>Showing 50 of {anomalies.length} anomalies. Export for full list.</div>}
        </div>
      </Section>

      {/* ── 8. ISOLATION SCORE RANKING ──────────────────────────────────────── */}
      <Section title="Company Isolation Score Ranking" badge="Top 20 Most Anomalous">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={Math.max(300, isoRanking.length * 26)}>
            <BarChart data={isoRanking} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis dataKey="company" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={115} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} formatter={v => v.toFixed(2)} />
              <Bar dataKey="score" name="Isolation Score" radius={[0, 4, 4, 0]}>
                {isoRanking.map((d, i) => <Cell key={i} fill={d.score > 3.5 ? T.red : d.score > 2.5 ? T.amber : T.sage} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 9. SECTOR ANOMALY PROFILE ──────────────────────────────────────── */}
      <Section title="Sector Anomaly Profile" badge="Which sectors have most anomalies?">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorAnomalyData} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="count" name="Anomalies" radius={[4, 4, 0, 0]}>
                {sectorAnomalyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 10. ANOMALY DETAIL PANEL ───────────────────────────────────────── */}
      {selectedAnomaly && detailData && (
        <Section title="Anomaly Detail" badge={selectedAnomaly.company}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{selectedAnomaly.company}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{selectedAnomaly.sector} | Field: {selectedAnomaly.field} | Method: {selectedAnomaly.method}</div>
              </div>
              <Btn small onClick={() => setSelectedAnomaly(null)}>Close</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 14 }}>
              <KpiCard label="Value" value={fmt(selectedAnomaly.value)} accent={T.red} />
              <KpiCard label="Peer Mean" value={fmt(detailData.peerMean)} accent={T.sage} />
              <KpiCard label="Peer Min" value={fmt(detailData.peerMin)} accent={T.navy} />
              <KpiCard label="Peer Max" value={fmt(detailData.peerMax)} accent={T.navy} />
              <KpiCard label="Z-Score" value={selectedAnomaly.zScore?.toFixed(2) || '---'} accent={T.amber} />
              <KpiCard label="Sector Peers" value={detailData.peers} accent={T.gold} />
            </div>
            {detailData.fix && (
              <div style={{ background: detailData.fix.isDataError ? '#fee2e2' : '#fef3c7', borderRadius: 8, padding: 12, fontSize: 12, color: detailData.fix.isDataError ? '#991b1b' : '#92400e', border: `1px solid ${detailData.fix.isDataError ? '#fca5a5' : '#fcd34d'}` }}>
                <strong>{detailData.fix.isDataError ? 'Likely Data Error' : 'Real Outlier'}:</strong> {detailData.fix.suggestion}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── 11. TIME-SERIES ANOMALY (simulated) ────────────────────────────── */}
      <Section title="Temporal Anomaly Detection" badge="Value Change Flags">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14 }}>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Companies with significant period-over-period changes in key metrics (simulated)</div>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={thS}>Company</th>
                <th style={thS}>Field</th>
                <th style={thS}>Previous</th>
                <th style={thS}>Current</th>
                <th style={thS}>Change %</th>
                <th style={thS}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {holdings.slice(0, 15).map((h, i) => {
                const s = seed(h.company_name + 'temp');
                const fieldIdx = Math.floor(sRand(s) * MONITOR_FIELDS.length);
                const f = MONITOR_FIELDS[fieldIdx];
                const curr = h[f.key] || 0;
                const prev = curr * (0.5 + sRand(s + 1) * 1.0);
                const changePct = prev ? ((curr - prev) / prev * 100) : 0;
                const isTemporal = Math.abs(changePct) > 50;
                return (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(h.company_name || '').slice(0, 22)}</td>
                    <td style={tdS}>{f.label}</td>
                    <td style={tdS}>{fmt(prev)}</td>
                    <td style={tdS}>{fmt(curr)}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: Math.abs(changePct) > 80 ? T.red : Math.abs(changePct) > 50 ? T.amber : T.green }}>{changePct > 0 ? '+' : ''}{changePct.toFixed(1)}%</td>
                    <td style={tdS}><Badge label={isTemporal ? 'FLAGGED' : 'Normal'} color={isTemporal ? 'red' : 'green'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 12. AUTO-FIX SUGGESTIONS ───────────────────────────────────────── */}
      <Section title="Auto-Fix Suggestions" badge="Data Error Corrections">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14 }}>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>For likely data errors (&gt;5\u03C3), sector median is suggested as replacement value.</div>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={thS}>Company</th>
                <th style={thS}>Field</th>
                <th style={thS}>Current Value</th>
                <th style={thS}>Sector Median</th>
                <th style={thS}>Deviation</th>
                <th style={thS}>Diagnosis</th>
                <th style={thS}>Suggested Fix</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.filter(a => (a.zScore || 0) > 4).slice(0, 15).map((a, i) => {
                const fix = autoFix(a);
                return (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(a.company || '').slice(0, 20)}</td>
                    <td style={tdS}>{a.field}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: T.red }}>{fmt(a.value)}</td>
                    <td style={{ ...tdS, color: T.sage, fontWeight: 600 }}>{fix ? fmt(fix.median) : '---'}</td>
                    <td style={{ ...tdS, fontWeight: 700 }}>{a.zScore?.toFixed(1) || '---'}\u03C3</td>
                    <td style={tdS}><Badge label={fix?.isDataError ? 'Data Error' : 'Outlier'} color={fix?.isDataError ? 'red' : 'amber'} /></td>
                    <td style={{ ...tdS, fontSize: 11 }}>{fix?.isDataError ? `Replace with ${fmt(fix.median)}` : 'Investigate'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 13. ANOMALY TREND AREA CHART ───────────────────────────────────── */}
      <Section title="Anomaly Trend (12-Month)" badge="AreaChart">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="anomalies" name="Total Anomalies" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="critical" name="Critical" stroke={T.red} fill={T.red} fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 14. EXPORTS + CROSS-NAV ────────────────────────────────────────── */}
      <Section title="Export & Actions" badge="3 Formats">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV}>Export Anomaly Report CSV</Btn>
          <Btn onClick={exportJSON}>Export Heatmap JSON</Btn>
          <Btn onClick={exportPrint}>Print Report</Btn>
        </div>
      </Section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, paddingTop: 16, borderTop: `2px solid ${T.border}` }}>
        {[
          { label: 'Data Quality', path: '/data-quality' },
          { label: 'Data Validation', path: '/data-validation' },
          { label: 'Enrichment Hub', path: '/enrichment-hub' },
          { label: 'ESG Dashboard', path: '/dme-dashboard' },
          { label: 'AI Engagement', path: '/ai-engagement' },
          { label: 'Controversy Monitor', path: '/controversy-monitor' },
        ].map(nav => (
          <Btn key={nav.path} small onClick={() => navigate(nav.path)}>{nav.label}</Btn>
        ))}
      </div>
    </div>
  );
}
