/**
 * EP-U4 — DME Alert Center & Risk Monitoring
 * Sprint U — DME Platform Port
 *
 * Dynamic alert generation from portfolio holdings based on threshold breaches.
 * 4 tiers (Watch/Elevated/Critical/Extreme), 5 pillars (E/S/G/P/X).
 * Reads: ra_portfolio_v1
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = seed => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, off = 0) => seededRandom(seed + off);
const readLS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const LS_PORTFOLIO = 'ra_portfolio_v1';

/* ── Alert Tiers & Pillars ─────────────────────────────────────────────────── */
const TIERS = {
  Watch:    { color:'#3b82f6', bg:'#3b82f618', label:'Watch',    severity:1 },
  Elevated: { color:T.amber,  bg:`${T.amber}18`, label:'Elevated', severity:2 },
  Critical: { color:'#ea580c', bg:'#ea580c18', label:'Critical', severity:3 },
  Extreme:  { color:T.red,    bg:`${T.red}18`,   label:'Extreme',  severity:4 },
};

const PILLARS = {
  E: { label:'Environmental', color:T.sage,  icon:'E' },
  S: { label:'Social',        color:'#6366f1', icon:'S' },
  G: { label:'Governance',    color:T.gold,  icon:'G' },
  P: { label:'Political',     color:'#a855f7', icon:'P' },
  X: { label:'Cross-cutting', color:T.navy,  icon:'X' },
};

/* ── Alert Generation Engine ───────────────────────────────────────────────── */
function generateAlerts(companies) {
  const alerts = [];
  const now = Date.now();
  companies.forEach((c, idx) => {
    const h = hashStr(c.ticker || c.name || `co${idx}`);
    const exposure = (c.market_cap_usd_mn || 500) * (0.01 + sr(h, 1) * 0.04);

    // Transition risk breach
    if ((c.transition_risk_score || 0) > 70) {
      alerts.push({
        id: `TR-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector || 'Industrials', exchange: c._displayExchange || 'NSE/BSE',
        tier: c.transition_risk_score > 85 ? 'Extreme' : c.transition_risk_score > 78 ? 'Critical' : 'Elevated',
        pillar: 'E',
        title: `High transition risk: ${c.transition_risk_score}`,
        description: `${c.name || c.ticker} transition risk score of ${c.transition_risk_score} exceeds the 70-point threshold. Sector: ${c.sector}. Potential stranded asset exposure.`,
        trigger_z_score: Math.round(((c.transition_risk_score - 50) / 15) * 100) / 100,
        estimated_pd_impact: Math.round(c.transition_risk_score * 0.5 * 100) / 100,
        estimated_var_impact: Math.round(exposure * 0.01 * c.transition_risk_score / 100 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 10) * 86400000 * 7),
        acknowledged: false, resolved: false,
      });
    }

    // ESG score breach (critically low)
    if ((c.esg_score || 50) < 30) {
      alerts.push({
        id: `ESG-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector || 'Industrials', exchange: c._displayExchange || 'NSE/BSE',
        tier: 'Critical', pillar: 'X',
        title: `ESG score critically low: ${c.esg_score}`,
        description: `${c.name || c.ticker} ESG combined score of ${c.esg_score} is below the 30-point critical threshold. Cross-cutting risk across all pillars.`,
        trigger_z_score: Math.round(((50 - (c.esg_score || 50)) / 10) * 100) / 100,
        estimated_pd_impact: Math.round((50 - (c.esg_score || 50)) * 0.3 * 100) / 100,
        estimated_var_impact: Math.round(exposure * 0.015 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 11) * 86400000 * 5),
        acknowledged: false, resolved: false,
      });
    }

    // GHG intensity spike
    const ghgInt = c.ghg_intensity_tco2e_per_mn || (c.scope1_mt ? c.scope1_mt * 1e6 / Math.max(c.revenue_usd_mn || 1, 1) : sr(h, 20) * 1200);
    if (ghgInt > 500) {
      alerts.push({
        id: `GHG-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector || 'Industrials', exchange: c._displayExchange || 'NSE/BSE',
        tier: ghgInt > 1000 ? 'Extreme' : 'Elevated', pillar: 'E',
        title: `High GHG intensity: ${Math.round(ghgInt)} tCO2e/mn`,
        description: `${c.name || c.ticker} GHG intensity of ${Math.round(ghgInt)} tCO2e per million revenue significantly exceeds sector median. Carbon pricing exposure is material.`,
        trigger_z_score: Math.round(((ghgInt - 300) / 200) * 100) / 100,
        estimated_pd_impact: Math.round(ghgInt * 0.002 * 100) / 100,
        estimated_var_impact: Math.round(exposure * ghgInt * 0.00001 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 12) * 86400000 * 10),
        acknowledged: false, resolved: false,
      });
    }

    // No SBTi + high emissions
    if (!c.sbti_committed && (c.scope1_mt || 0) > 5) {
      alerts.push({
        id: `SBTI-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector || 'Industrials', exchange: c._displayExchange || 'NSE/BSE',
        tier: 'Watch', pillar: 'E',
        title: `Major emitter without SBTi target`,
        description: `${c.name || c.ticker} has Scope 1 emissions of ${(c.scope1_mt || 0).toFixed(1)} Mt CO2e but no Science Based Targets commitment. Regulatory and investor risk.`,
        trigger_z_score: Math.round((c.scope1_mt || 5) * 0.15 * 100) / 100,
        estimated_pd_impact: 0.5,
        estimated_var_impact: Math.round(exposure * 0.005 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 13) * 86400000 * 14),
        acknowledged: false, resolved: false,
      });
    }

    // Governance: low data quality
    if ((c.data_quality_score || 50) < 25) {
      alerts.push({
        id: `DQ-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector || 'Industrials', exchange: c._displayExchange || 'NSE/BSE',
        tier: 'Elevated', pillar: 'G',
        title: `Poor data quality score: ${c.data_quality_score || 20}`,
        description: `${c.name || c.ticker} data quality score of ${c.data_quality_score || 20} indicates material data gaps. Governance risk for disclosure compliance.`,
        trigger_z_score: 1.8,
        estimated_pd_impact: 0.3,
        estimated_var_impact: Math.round(exposure * 0.003 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 14) * 86400000 * 3),
        acknowledged: false, resolved: false,
      });
    }

    // Social: workforce concerns for high-emission industrials
    if (c.sector === 'Industrials' && sr(h, 30) > 0.7) {
      alerts.push({
        id: `SOC-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector, exchange: c._displayExchange || 'NSE/BSE',
        tier: 'Watch', pillar: 'S',
        title: `Just transition workforce risk`,
        description: `${c.name || c.ticker} in Industrials sector faces workforce transition risk under decarbonization scenarios. ${Math.round(15 + sr(h, 31) * 20)}% workforce in carbon-intensive roles.`,
        trigger_z_score: 1.2,
        estimated_pd_impact: 0.2,
        estimated_var_impact: Math.round(exposure * 0.002 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 15) * 86400000 * 6),
        acknowledged: false, resolved: false,
      });
    }

    // Political risk proxy for certain geographies
    if (c.countryCode === 'CN' || c.countryCode === 'RU' || (c._region === 'South Asia' && sr(h, 40) > 0.85)) {
      alerts.push({
        id: `POL-${idx}`, entity: c.name || c.ticker, ticker: c.ticker,
        sector: c.sector || 'Industrials', exchange: c._displayExchange || 'NSE/BSE',
        tier: 'Watch', pillar: 'P',
        title: `Elevated geopolitical/regulatory risk`,
        description: `${c.name || c.ticker} operates in a jurisdiction with evolving climate regulatory landscape. Policy uncertainty may affect transition pathway and compliance costs.`,
        trigger_z_score: 1.0,
        estimated_pd_impact: 0.4,
        estimated_var_impact: Math.round(exposure * 0.004 * 100) / 100,
        timestamp: now - Math.floor(sr(h, 16) * 86400000 * 12),
        acknowledged: false, resolved: false,
      });
    }
  });

  return alerts.sort((a, b) => TIERS[b.tier].severity - TIERS[a.tier].severity || b.trigger_z_score - a.trigger_z_score);
}

/* ── Build alert trend data ────────────────────────────────────────────────── */
function buildTrendData(alerts) {
  const weeks = 12;
  const data = [];
  for (let w = weeks; w >= 0; w--) {
    const weekStart = Date.now() - w * 7 * 86400000;
    const weekEnd = weekStart + 7 * 86400000;
    const weekAlerts = alerts.filter(a => a.timestamp >= weekStart && a.timestamp < weekEnd);
    data.push({
      week: `W-${w}`,
      Extreme: weekAlerts.filter(a => a.tier === 'Extreme').length,
      Critical: weekAlerts.filter(a => a.tier === 'Critical').length,
      Elevated: weekAlerts.filter(a => a.tier === 'Elevated').length,
      Watch: weekAlerts.filter(a => a.tier === 'Watch').length,
      total: weekAlerts.length,
    });
  }
  return data;
}

/* ── Shared UI ─────────────────────────────────────────────────────────────── */
const Badge = ({ label, color }) => (
  <span style={{ fontSize:10, fontWeight:700, color, background:`${color}18`, border:`1px solid ${color}44`, borderRadius:4, padding:'2px 8px', letterSpacing:0.3 }}>{label}</span>
);
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${accent || T.border}`, borderRadius:10, padding:'14px 16px', borderTop: accent ? `3px solid ${accent}` : undefined, minWidth:130 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.text }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);
const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom:12 }}>
    <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>{title}</h3>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ════════════════════════════════════════════════════════════════════════════ */
export default function DmeAlertsPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const portfolioData = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  }, []);
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 120), []);

  const [tierFilter, setTierFilter] = useState('All');
  const [pillarFilter, setPillarFilter] = useState('All');
  const [acknowledgedMap, setAcknowledgedMap] = useState({});
  const [resolvedMap, setResolvedMap] = useState({});
  const [sortCol, setSortCol] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');

  /* Generate alerts from GLOBAL_COMPANY_MASTER */
  const allAlerts = useMemo(() => generateAlerts(companies), [companies]);

  /* Apply filters */
  const filteredAlerts = useMemo(() => {
    let filtered = allAlerts;
    if (tierFilter !== 'All') filtered = filtered.filter(a => a.tier === tierFilter);
    if (pillarFilter !== 'All') filtered = filtered.filter(a => a.pillar === pillarFilter);
    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortCol === 'severity') {
        const diff = TIERS[b.tier].severity - TIERS[a.tier].severity;
        return sortDir === 'desc' ? diff : -diff;
      }
      if (sortCol === 'z_score') return sortDir === 'desc' ? b.trigger_z_score - a.trigger_z_score : a.trigger_z_score - b.trigger_z_score;
      if (sortCol === 'pd_impact') return sortDir === 'desc' ? b.estimated_pd_impact - a.estimated_pd_impact : a.estimated_pd_impact - b.estimated_pd_impact;
      if (sortCol === 'var_impact') return sortDir === 'desc' ? b.estimated_var_impact - a.estimated_var_impact : a.estimated_var_impact - b.estimated_var_impact;
      return 0;
    });
    return filtered;
  }, [allAlerts, tierFilter, pillarFilter, sortCol, sortDir]);

  /* Tier counts */
  const tierCounts = useMemo(() => {
    const counts = { All: allAlerts.length, Watch: 0, Elevated: 0, Critical: 0, Extreme: 0 };
    allAlerts.forEach(a => counts[a.tier]++);
    return counts;
  }, [allAlerts]);

  /* Pillar counts */
  const pillarCounts = useMemo(() => {
    const counts = { All: allAlerts.length };
    Object.keys(PILLARS).forEach(p => counts[p] = 0);
    allAlerts.forEach(a => counts[a.pillar]++);
    return counts;
  }, [allAlerts]);

  /* KPIs */
  const kpis = useMemo(() => {
    const totalPD = allAlerts.reduce((s, a) => s + (a.estimated_pd_impact || 0), 0);
    const totalVaR = allAlerts.reduce((s, a) => s + (a.estimated_var_impact || 0), 0);
    return {
      total: allAlerts.length,
      extreme: tierCounts.Extreme,
      critical: tierCounts.Critical,
      elevated: tierCounts.Elevated,
      totalPD: Math.round(totalPD * 10) / 10,
      totalVaR: Math.round(totalVaR * 10) / 10,
    };
  }, [allAlerts, tierCounts]);

  /* Trend data */
  const trendData = useMemo(() => buildTrendData(allAlerts), [allAlerts]);

  /* Pillar pie data */
  const pillarPieData = useMemo(() => {
    return Object.entries(PILLARS).map(([key, p]) => ({
      name: p.label, value: pillarCounts[key] || 0, color: p.color,
    })).filter(d => d.value > 0);
  }, [pillarCounts]);

  /* Export */
  const exportCSV = useCallback(() => {
    const rows = filteredAlerts.map(a => ({
      id: a.id, entity: a.entity, ticker: a.ticker, sector: a.sector, tier: a.tier, pillar: a.pillar,
      title: a.title, z_score: a.trigger_z_score, pd_impact: a.estimated_pd_impact, var_impact: a.estimated_var_impact,
      acknowledged: acknowledgedMap[a.id] || false, resolved: resolvedMap[a.id] || false,
    }));
    const keys = Object.keys(rows[0] || {});
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dme_alerts.csv'; a.click(); URL.revokeObjectURL(url);
  }, [filteredAlerts, acknowledgedMap, resolvedMap]);

  const exportTrendCSV = useCallback(() => {
    const keys = Object.keys(trendData[0] || {});
    const csv = [keys.join(','), ...trendData.map(r => keys.map(k => r[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dme_alert_trend.csv'; a.click(); URL.revokeObjectURL(url);
  }, [trendData]);

  const exportPillarCSV = useCallback(() => {
    const csv = ['pillar,count', ...pillarPieData.map(d => `${d.name},${d.value}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dme_pillar_distribution.csv'; a.click(); URL.revokeObjectURL(url);
  }, [pillarPieData]);

  /* ── Empty portfolio guard ─────────────────────────────────────────────── */
  if (portfolio.length === 0) {
    return (
      <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:T.mutedFg || '#94a3b8', maxWidth:420 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>&#9888;</div>
          <h2 style={{ color:T.fg || '#e2e8f0', marginBottom:8 }}>No Portfolio Found</h2>
          <p style={{ marginBottom:20, lineHeight:1.6 }}>
            DME Alerts require an active portfolio with holdings.
            Add companies in the Portfolio Manager to get started.
          </p>
          <button onClick={() => navigate('/portfolio')}
            style={{ background:T.accent || '#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>
            Open Portfolio Manager
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:T.navy, margin:0 }}>DME Alert Center</h1>
            <Badge label="Real-Time · 4 Tiers · 5 Pillars" color={T.red} />
          </div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Dynamic risk monitoring with threshold-based alert generation across E/S/G/P/X pillars</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/dme-scenarios')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Scenarios</button>
          <button onClick={() => navigate('/dme-contagion')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Contagion</button>
        </div>
      </div>

      {/* ── 2. Summary KPIs ────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10, marginBottom:16 }}>
        <KpiCard label="Total Alerts" value={kpis.total} sub="Active alerts" accent={T.navy} />
        <KpiCard label="Extreme" value={kpis.extreme} sub="Immediate action" accent={T.red} />
        <KpiCard label="Critical" value={kpis.critical} sub="High priority" accent="#ea580c" />
        <KpiCard label="Elevated" value={kpis.elevated} sub="Monitor closely" accent={T.amber} />
        <KpiCard label="PD Impact" value={`${kpis.totalPD} bps`} sub="Cumulative" accent={T.gold} />
        <KpiCard label="VaR Impact" value={`$${kpis.totalVaR}m`} sub="Portfolio VaR delta" accent={T.red} />
      </div>

      {/* ── 3. Tier Filter Buttons ─────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.text, padding:'6px 0' }}>Tier:</div>
        {['All', 'Extreme', 'Critical', 'Elevated', 'Watch'].map(tier => {
          const tColor = tier === 'All' ? T.navy : TIERS[tier]?.color || T.navy;
          const active = tierFilter === tier;
          return (
            <button key={tier} onClick={() => setTierFilter(tier)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, borderRadius:6, border:`1px solid ${active ? tColor : T.border}`, background: active ? `${tColor}18` : T.surface, color: active ? tColor : T.text, cursor:'pointer' }}>
              {tier} ({tierCounts[tier] || 0})
            </button>
          );
        })}
      </div>

      {/* ── 4. Pillar Filter Buttons ───────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.text, padding:'6px 0' }}>Pillar:</div>
        {['All', ...Object.keys(PILLARS)].map(p => {
          const pInfo = p === 'All' ? { color: T.navy, label: 'All' } : PILLARS[p];
          const active = pillarFilter === p;
          return (
            <button key={p} onClick={() => setPillarFilter(p)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, borderRadius:6, border:`1px solid ${active ? pInfo.color : T.border}`, background: active ? `${pInfo.color}18` : T.surface, color: active ? pInfo.color : T.text, cursor:'pointer' }}>
              {p === 'All' ? 'All' : `${p} — ${pInfo.label}`} ({pillarCounts[p] || 0})
            </button>
          );
        })}
      </div>

      {/* ── 5. Alert Feed ──────────────────────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionHeader title="Alert Feed" sub={`${filteredAlerts.length} alerts · sorted by ${sortCol}`} />
          <div style={{ display:'flex', gap:8 }}>
            <select value={sortCol} onChange={e => setSortCol(e.target.value)} style={{ padding:'4px 8px', fontSize:11, border:`1px solid ${T.border}`, borderRadius:4, fontFamily:T.font, color:T.text }}>
              <option value="severity">Severity</option>
              <option value="z_score">Z-Score</option>
              <option value="pd_impact">PD Impact</option>
              <option value="var_impact">VaR Impact</option>
            </select>
            <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{ padding:'4px 10px', fontSize:11, border:`1px solid ${T.border}`, borderRadius:4, background:T.surface, cursor:'pointer', color:T.text }}>{sortDir === 'desc' ? 'Desc' : 'Asc'}</button>
            <button onClick={exportCSV} style={{ padding:'4px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, color:T.navy, cursor:'pointer' }}>Export CSV</button>
          </div>
        </div>

        <div style={{ maxHeight:500, overflowY:'auto' }}>
          {filteredAlerts.slice(0, 50).map(alert => {
            const tierInfo = TIERS[alert.tier];
            const pillarInfo = PILLARS[alert.pillar] || PILLARS.X;
            const isAcked = acknowledgedMap[alert.id];
            const isResolved = resolvedMap[alert.id];
            return (
              <div key={alert.id} style={{ border:`1px solid ${isResolved ? T.border : tierInfo.color}44`, borderLeft:`4px solid ${tierInfo.color}`, borderRadius:8, padding:14, marginBottom:8, background: isResolved ? T.surfaceH : T.surface, opacity: isResolved ? 0.6 : 1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Badge label={alert.tier} color={tierInfo.color} />
                    <span style={{ fontSize:10, fontWeight:700, color:pillarInfo.color, background:`${pillarInfo.color}18`, border:`1px solid ${pillarInfo.color}44`, borderRadius:4, padding:'2px 6px' }}>{alert.pillar}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{alert.entity}</span>
                    <span style={{ fontSize:10, color:T.textMut }}>{alert.ticker} · {alert.sector}</span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {!isAcked && !isResolved && (
                      <button onClick={() => setAcknowledgedMap(m => ({ ...m, [alert.id]: true }))} style={{ padding:'3px 10px', fontSize:10, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, color:T.navy, cursor:'pointer' }}>Acknowledge</button>
                    )}
                    {isAcked && !isResolved && (
                      <button onClick={() => setResolvedMap(m => ({ ...m, [alert.id]: true }))} style={{ padding:'3px 10px', fontSize:10, fontWeight:600, background:T.green, border:'none', borderRadius:4, color:'#fff', cursor:'pointer' }}>Resolve</button>
                    )}
                    {isResolved && <span style={{ fontSize:10, color:T.green, fontWeight:600 }}>Resolved</span>}
                  </div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4 }}>{alert.title}</div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:8, lineHeight:1.4 }}>{alert.description}</div>
                <div style={{ display:'flex', gap:16, fontSize:10, color:T.textMut }}>
                  <span>Z-Score: <strong style={{ color: alert.trigger_z_score > 2 ? T.red : T.text }}>{alert.trigger_z_score.toFixed(2)}</strong></span>
                  <span>PD Impact: <strong style={{ color:T.amber }}>{alert.estimated_pd_impact} bps</strong></span>
                  <span>VaR Impact: <strong style={{ color:T.red }}>${alert.estimated_var_impact}m</strong></span>
                  <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
          {filteredAlerts.length > 50 && (
            <div style={{ textAlign:'center', padding:12, fontSize:11, color:T.textMut }}>Showing 50 of {filteredAlerts.length} alerts</div>
          )}
        </div>
      </div>

      {/* ── 6. Alert Trend AreaChart ────────────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionHeader title="Alert Trend (12 Weeks)" sub="Alert count by tier over time" />
          <button onClick={exportTrendCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export CSV</button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top:10, right:20, left:10, bottom:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="week" tick={{ fontSize:10, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="Extreme" stackId="1" fill={T.red} stroke={T.red} fillOpacity={0.6} />
            <Area type="monotone" dataKey="Critical" stackId="1" fill="#ea580c" stroke="#ea580c" fillOpacity={0.5} />
            <Area type="monotone" dataKey="Elevated" stackId="1" fill={T.amber} stroke={T.amber} fillOpacity={0.4} />
            <Area type="monotone" dataKey="Watch" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 7. Pillar Distribution PieChart ────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionHeader title="Alert Distribution by Pillar" sub="E/S/G/P/X breakdown" />
          <button onClick={exportPillarCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export CSV</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <ResponsiveContainer width="50%" height={260}>
            <PieChart>
              <Pie data={pillarPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize:10 }}>
                {pillarPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex:1 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  <th style={{ padding:'6px 8px', textAlign:'left', fontWeight:700, color:T.text }}>Pillar</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:T.text }}>Count</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:T.text }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PILLARS).map(([key, p]) => (
                  <tr key={key} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'6px 8px' }}>
                      <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:p.color, marginRight:6 }} />
                      {key} — {p.label}
                    </td>
                    <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:600 }}>{pillarCounts[key] || 0}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', color:T.textSec }}>{allAlerts.length > 0 ? ((pillarCounts[key] || 0) / allAlerts.length * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Cross-nav footer ───────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16, flexWrap:'wrap' }}>
        {[
          { label:'Scenario Engine', path:'/dme-scenarios' },
          { label:'Contagion Network', path:'/dme-contagion' },
          { label:'Climate VaR', path:'/portfolio-climate-var' },
          { label:'ESG Screener', path:'/esg-screener' },
          { label:'Controversy Monitor', path:'/controversy-monitor' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>{n.label}</button>
        ))}
      </div>
    </div>
  );
}
