/**
 * EP-U5 — DME Contagion & Network Risk
 * Sprint U — DME Platform Port
 *
 * Models how ESG risk propagates between connected entities via sector,
 * geography, supply chain, and financial linkage. Adjacency matrix,
 * contagion simulation, systemic risk scoring.
 * Reads: ra_portfolio_v1
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

/* ── Supply chain linkage map ──────────────────────────────────────────────── */
const SUPPLY_LINKS = {
  'Consumer Staples': ['Materials', 'Industrials'],
  'Consumer Discretionary': ['Materials', 'Industrials', 'Information Technology'],
  Energy: ['Utilities', 'Industrials', 'Materials'],
  Utilities: ['Energy', 'Industrials'],
  'Information Technology': ['Communication Services', 'Industrials'],
  'Communication Services': ['Information Technology'],
  Materials: ['Energy', 'Industrials', 'Consumer Staples'],
  Industrials: ['Energy', 'Materials', 'Consumer Discretionary'],
  'Health Care': ['Information Technology', 'Industrials'],
  Financials: ['Real Estate'],
  'Real Estate': ['Financials', 'Materials'],
};

/* ── Build holdings from GLOBAL_COMPANY_MASTER ─────────────────────────────── */
function buildHoldings(companies) {
  return companies.slice(0, 40).map((c, i) => {
    const h = hashStr(c.ticker || c.name || `co${i}`);
    return {
      idx: i,
      ticker: c.ticker || `CO${i}`,
      name: c.name || `Company ${i}`,
      sector: c.sector || 'Industrials',
      exchange: c._displayExchange || 'NSE/BSE',
      region: c._region || 'South Asia',
      esg_score: c.esg_score || 50,
      transition_risk_score: c.transition_risk_score || 50,
      exposure_usd_mn: Math.round((c.market_cap_usd_mn || 500) * (0.01 + sr(h, 1) * 0.04) * 10) / 10,
      basePD: 0.005 + sr(h, 2) * 0.04,
      regime: (c.transition_risk_score || 50) > 80 ? 'Critical' : (c.transition_risk_score || 50) > 60 ? 'Elevated' : (c.transition_risk_score || 50) > 40 ? 'Watch' : 'Normal',
    };
  });
}

/* ── Contagion Model ───────────────────────────────────────────────────────── */
function computeConnections(holdings) {
  const connections = [];
  holdings.forEach((a, i) => {
    holdings.forEach((b, j) => {
      if (i >= j) return;
      let strength = 0;
      let types = [];
      // Same sector
      if (a.sector === b.sector) { strength += 0.4; types.push('sector'); }
      // Same exchange / region
      if (a.exchange === b.exchange) { strength += 0.2; types.push('exchange'); }
      if (a.region === b.region && a.exchange !== b.exchange) { strength += 0.1; types.push('region'); }
      // Supply chain proxy
      if (SUPPLY_LINKS[a.sector]?.includes(b.sector) || SUPPLY_LINKS[b.sector]?.includes(a.sector)) {
        strength += 0.3; types.push('supply_chain');
      }
      // Financial linkage proxy (same region financials)
      if ((a.sector === 'Financials' || b.sector === 'Financials') && a.region === b.region) {
        strength += 0.15; types.push('financial');
      }
      if (strength > 0.2) {
        connections.push({
          source: a.ticker, target: b.ticker,
          sourceIdx: i, targetIdx: j,
          strength: Math.round(strength * 100) / 100,
          type: strength > 0.5 ? 'strong' : 'moderate',
          linkTypes: types,
        });
      }
    });
  });
  return connections;
}

/* ── Contagion Simulation ──────────────────────────────────────────────────── */
function simulateContagion(holdings, connections, sourceIdx, propagationDecay = 0.6) {
  const impacts = holdings.map(() => 0);
  impacts[sourceIdx] = 1.0;
  const sourceH = holdings[sourceIdx];
  const sourceZBoost = sourceH.transition_risk_score > 70 ? 0.8 : 0.5;

  // First-order propagation
  connections.forEach(conn => {
    if (conn.sourceIdx === sourceIdx) {
      impacts[conn.targetIdx] = Math.max(impacts[conn.targetIdx], conn.strength * sourceZBoost);
    }
    if (conn.targetIdx === sourceIdx) {
      impacts[conn.sourceIdx] = Math.max(impacts[conn.sourceIdx], conn.strength * sourceZBoost);
    }
  });

  // Second-order propagation (attenuated)
  const firstOrder = [...impacts];
  connections.forEach(conn => {
    if (firstOrder[conn.sourceIdx] > 0 && conn.sourceIdx !== sourceIdx) {
      impacts[conn.targetIdx] = Math.max(impacts[conn.targetIdx], firstOrder[conn.sourceIdx] * conn.strength * propagationDecay);
    }
    if (firstOrder[conn.targetIdx] > 0 && conn.targetIdx !== sourceIdx) {
      impacts[conn.sourceIdx] = Math.max(impacts[conn.sourceIdx], firstOrder[conn.targetIdx] * conn.strength * propagationDecay);
    }
  });

  return holdings.map((h, i) => ({
    ...h,
    contagionImpact: Math.round(impacts[i] * 1000) / 1000,
    pdBoost: impacts[i] * 0.02,
    isSource: i === sourceIdx,
  })).filter(h => h.contagionImpact > 0.01).sort((a, b) => b.contagionImpact - a.contagionImpact);
}

/* ── Systemic Risk Score ───────────────────────────────────────────────────── */
function computeSystemicRisk(holdings, connections) {
  const n = holdings.length;
  if (n === 0) return { score: 0, density: 0, avgStrength: 0, maxDegree: 0, concentration: 0 };
  const maxConnections = n * (n - 1) / 2;
  const density = maxConnections > 0 ? connections.length / maxConnections : 0;
  const avgStrength = connections.length > 0 ? connections.reduce((s, c) => s + c.strength, 0) / connections.length : 0;
  const degrees = {};
  connections.forEach(c => {
    degrees[c.source] = (degrees[c.source] || 0) + 1;
    degrees[c.target] = (degrees[c.target] || 0) + 1;
  });
  const degreeValues = Object.values(degrees);
  const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
  const avgDegree = degreeValues.length > 0 ? degreeValues.reduce((s, d) => s + d, 0) / degreeValues.length : 0;
  // Herfindahl concentration on exposures
  const totalExp = holdings.reduce((s, h) => s + h.exposure_usd_mn, 0);
  const concentration = totalExp > 0 ? holdings.reduce((s, h) => s + Math.pow(h.exposure_usd_mn / totalExp, 2), 0) : 0;

  const score = Math.min(100, Math.round((density * 30 + avgStrength * 25 + (maxDegree / Math.max(n, 1)) * 25 + concentration * 20) * 100));
  return { score, density: Math.round(density * 1000) / 10, avgStrength: Math.round(avgStrength * 100) / 100, maxDegree, avgDegree: Math.round(avgDegree * 10) / 10, concentration: Math.round(concentration * 1000) / 10 };
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

const strengthColor = s => s > 0.6 ? T.red : s > 0.4 ? T.amber : s > 0.2 ? T.gold : '#e8e4de';

/* ════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ════════════════════════════════════════════════════════════════════════════ */
export default function DmeContagionPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const portfolioData = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  }, []);
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 120), []);

  const [simSource, setSimSource] = useState(null);
  const [matrixPage, setMatrixPage] = useState(0);
  const MATRIX_SIZE = 15;

  /* Build holdings and connections */
  const holdings = useMemo(() => buildHoldings(companies), [companies]);
  const connections = useMemo(() => computeConnections(holdings), [holdings]);
  const systemic = useMemo(() => computeSystemicRisk(holdings, connections), [holdings, connections]);

  /* Connection degree per holding */
  const holdingDegrees = useMemo(() => {
    const degrees = {};
    connections.forEach(c => {
      degrees[c.source] = (degrees[c.source] || 0) + 1;
      degrees[c.target] = (degrees[c.target] || 0) + 1;
    });
    return holdings.map(h => ({ ...h, degree: degrees[h.ticker] || 0 })).sort((a, b) => b.degree - a.degree);
  }, [holdings, connections]);

  /* Sector interconnection */
  const sectorInterconnection = useMemo(() => {
    const sectorConns = {};
    connections.forEach(c => {
      const sA = holdings.find(h => h.ticker === c.source)?.sector;
      const sB = holdings.find(h => h.ticker === c.target)?.sector;
      if (sA) sectorConns[sA] = (sectorConns[sA] || 0) + 1;
      if (sB) sectorConns[sB] = (sectorConns[sB] || 0) + 1;
    });
    return Object.entries(sectorConns).map(([sector, count]) => ({
      sector: sector.length > 14 ? sector.slice(0, 12) + '..' : sector,
      fullSector: sector,
      connections: count,
      holdingCount: holdings.filter(h => h.sector === sector).length,
      avgStrength: Math.round(connections.filter(c => {
        const sA = holdings.find(h => h.ticker === c.source)?.sector;
        const sB = holdings.find(h => h.ticker === c.target)?.sector;
        return sA === sector || sB === sector;
      }).reduce((s, c) => s + c.strength, 0) / Math.max(count, 1) * 100) / 100,
    })).sort((a, b) => b.connections - a.connections);
  }, [holdings, connections]);

  /* Contagion simulation results */
  const simResults = useMemo(() => {
    if (simSource == null) return null;
    return simulateContagion(holdings, connections, simSource);
  }, [simSource, holdings, connections]);

  /* Adjacency matrix slice */
  const matrixHoldings = useMemo(() => {
    const start = matrixPage * MATRIX_SIZE;
    return holdings.slice(start, start + MATRIX_SIZE);
  }, [holdings, matrixPage]);

  /* Radar data for sector interconnection */
  const radarData = useMemo(() => {
    return sectorInterconnection.slice(0, 8).map(s => ({
      sector: s.sector, connections: s.connections, avgStrength: Math.round(s.avgStrength * 100),
    }));
  }, [sectorInterconnection]);

  /* Export helpers */
  const exportCSV = useCallback((data, filename) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportConnectionsCSV = useCallback(() => {
    exportCSV(connections.map(c => ({
      source: c.source, target: c.target, strength: c.strength, type: c.type, linkTypes: c.linkTypes.join(';'),
    })), 'dme_connections.csv');
  }, [connections, exportCSV]);

  const exportSimCSV = useCallback(() => {
    if (!simResults) return;
    exportCSV(simResults.map(r => ({
      ticker: r.ticker, name: r.name, sector: r.sector, contagionImpact: r.contagionImpact,
      pdBoost: r.pdBoost.toFixed(4), isSource: r.isSource, regime: r.regime,
    })), 'dme_contagion_simulation.csv');
  }, [simResults, exportCSV]);

  const exportSectorCSV = useCallback(() => {
    exportCSV(sectorInterconnection, 'dme_sector_interconnection.csv');
  }, [sectorInterconnection, exportCSV]);

  const totalPages = Math.ceil(holdings.length / MATRIX_SIZE);

  /* ── Empty portfolio guard ─────────────────────────────────────────────── */
  if (portfolio.length === 0) {
    return (
      <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:T.mutedFg || '#94a3b8', maxWidth:420 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>&#128279;</div>
          <h2 style={{ color:T.fg || '#e2e8f0', marginBottom:8 }}>No Portfolio Found</h2>
          <p style={{ marginBottom:20, lineHeight:1.6 }}>
            DME Contagion Analysis requires an active portfolio with holdings.
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
            <h1 style={{ fontSize:22, fontWeight:800, color:T.navy, margin:0 }}>DME Contagion & Network Risk</h1>
            <Badge label="Interconnection · Propagation · Systemic" color={T.navy} />
          </div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>ESG risk propagation modeling across sector, geography, supply chain & financial linkages</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/dme-scenarios')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Scenarios</button>
          <button onClick={() => navigate('/dme-alerts')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Alerts</button>
        </div>
      </div>

      {/* ── 4. Systemic Risk Score ─────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10, marginBottom:16 }}>
        <KpiCard label="Systemic Score" value={systemic.score} sub={systemic.score > 50 ? 'High interconnection' : 'Moderate'} accent={systemic.score > 50 ? T.red : T.amber} />
        <KpiCard label="Holdings" value={holdings.length} sub="In network" accent={T.navy} />
        <KpiCard label="Connections" value={connections.length} sub={`${connections.filter(c => c.type === 'strong').length} strong`} accent={T.gold} />
        <KpiCard label="Density" value={`${systemic.density}%`} sub="Network density" accent={T.sage} />
        <KpiCard label="Avg Strength" value={systemic.avgStrength} sub="Connection weight" accent={T.amber} />
        <KpiCard label="Max Degree" value={systemic.maxDegree} sub="Most connected node" accent={T.red} />
        <KpiCard label="Concentration" value={`${systemic.concentration}%`} sub="HHI exposure" accent={T.navyL} />
      </div>

      {/* ── 2. Network Visualization / Adjacency Matrix ────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20, overflowX:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionHeader title="Connection Strength Heatmap" sub={`${matrixHoldings.length} holdings shown (page ${matrixPage + 1}/${totalPages}) · Color = connection strength`} />
          <div style={{ display:'flex', gap:6 }}>
            <button disabled={matrixPage === 0} onClick={() => setMatrixPage(p => p - 1)} style={{ padding:'4px 10px', fontSize:11, border:`1px solid ${T.border}`, borderRadius:4, background:T.surface, cursor: matrixPage === 0 ? 'default' : 'pointer', opacity: matrixPage === 0 ? 0.4 : 1, color:T.text }}>Prev</button>
            <button disabled={matrixPage >= totalPages - 1} onClick={() => setMatrixPage(p => p + 1)} style={{ padding:'4px 10px', fontSize:11, border:`1px solid ${T.border}`, borderRadius:4, background:T.surface, cursor: matrixPage >= totalPages - 1 ? 'default' : 'pointer', opacity: matrixPage >= totalPages - 1 ? 0.4 : 1, color:T.text }}>Next</button>
            <button onClick={exportConnectionsCSV} style={{ padding:'4px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, color:T.navy, cursor:'pointer' }}>Export CSV</button>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:10 }}>
            <thead>
              <tr>
                <th style={{ padding:4, width:70, textAlign:'left', fontWeight:700, color:T.text, fontSize:9 }}></th>
                {matrixHoldings.map(h => (
                  <th key={h.ticker} style={{ padding:4, width:40, textAlign:'center', fontWeight:600, color:T.textSec, fontSize:9, transform:'rotate(-45deg)', transformOrigin:'center', height:50 }}>{h.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixHoldings.map((row, ri) => (
                <tr key={row.ticker}>
                  <td style={{ padding:'4px 6px', fontWeight:600, color:T.text, fontSize:9, whiteSpace:'nowrap' }}>
                    {row.ticker}
                    <span style={{ fontSize:8, color:T.textMut, marginLeft:4 }}>{row.sector?.slice(0, 6)}</span>
                  </td>
                  {matrixHoldings.map((col, ci) => {
                    if (ri === ci) return <td key={col.ticker} style={{ padding:2, textAlign:'center' }}><div style={{ width:28, height:28, borderRadius:3, background:T.navy, margin:'auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:700 }}>Self</div></td>;
                    const conn = connections.find(c =>
                      (c.source === row.ticker && c.target === col.ticker) ||
                      (c.source === col.ticker && c.target === row.ticker)
                    );
                    const s = conn ? conn.strength : 0;
                    return (
                      <td key={col.ticker} style={{ padding:2, textAlign:'center' }}>
                        <div style={{ width:28, height:28, borderRadius:3, background: s > 0 ? strengthColor(s) : '#f9f8f6', margin:'auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:600, color: s > 0.4 ? '#fff' : T.textMut, border:`1px solid ${s > 0 ? strengthColor(s) : T.border}40` }} title={conn ? `${conn.strength} (${conn.linkTypes.join(', ')})` : 'No connection'}>
                          {s > 0 ? s.toFixed(1) : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:12, marginTop:10, alignItems:'center', fontSize:10, color:T.textSec }}>
          <span>Strength:</span>
          {[{ label:'None', color:'#f9f8f6' }, { label:'Weak (0.2-0.4)', color:T.gold }, { label:'Moderate (0.4-0.6)', color:T.amber }, { label:'Strong (>0.6)', color:T.red }].map(l => (
            <span key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:12, height:12, borderRadius:2, background:l.color, border:`1px solid ${l.color}80` }} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. Contagion Simulation ────────────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <SectionHeader title="Contagion Simulation" sub="If an entity goes Critical, which holdings are affected? Select source entity below." />
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, flexWrap:'wrap' }}>
          <select value={simSource ?? ''} onChange={e => setSimSource(e.target.value === '' ? null : Number(e.target.value))} style={{ padding:'6px 12px', fontSize:12, border:`1px solid ${T.border}`, borderRadius:6, fontFamily:T.font, color:T.text, minWidth:240 }}>
            <option value="">-- Select source entity --</option>
            {holdings.map((h, i) => (
              <option key={h.ticker} value={i}>{h.ticker} — {h.name} ({h.sector})</option>
            ))}
          </select>
          {simSource != null && (
            <div style={{ fontSize:12, color:T.textSec }}>
              Simulating propagation from <strong style={{ color:T.red }}>{holdings[simSource]?.ticker}</strong> (Regime: {holdings[simSource]?.regime})
            </div>
          )}
        </div>

        {simResults && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:8 }}>
              <button onClick={exportSimCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export CSV</button>
            </div>
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${T.border}`, position:'sticky', top:0, background:T.surface }}>
                    {['Entity','Sector','Regime','Contagion Impact','PD Boost (bps)','Exposure ($m)','Role'].map(h => (
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:700, color:T.text, fontSize:10, textTransform:'uppercase', letterSpacing:0.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {simResults.map((r, i) => (
                    <tr key={r.ticker} style={{ borderBottom:`1px solid ${T.border}`, background: r.isSource ? `${T.red}0c` : i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding:'7px 10px', fontWeight:600, color:T.text }}>{r.ticker} <span style={{ fontSize:10, color:T.textMut, fontWeight:400 }}>{r.name}</span></td>
                      <td style={{ padding:'7px 10px', color:T.textSec }}>{r.sector}</td>
                      <td style={{ padding:'7px 10px' }}><Badge label={r.regime} color={r.regime === 'Critical' ? T.red : r.regime === 'Elevated' ? T.amber : r.regime === 'Watch' ? '#3b82f6' : T.sage} /></td>
                      <td style={{ padding:'7px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:60, height:6, background:T.border, borderRadius:3 }}>
                            <div style={{ width:`${Math.min(r.contagionImpact * 100, 100)}%`, height:'100%', background: r.contagionImpact > 0.6 ? T.red : r.contagionImpact > 0.3 ? T.amber : T.gold, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:10, fontWeight:600, color: r.contagionImpact > 0.5 ? T.red : T.text }}>{(r.contagionImpact * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'7px 10px', fontWeight:600, color: r.pdBoost > 0.01 ? T.red : T.text }}>{(r.pdBoost * 10000).toFixed(1)}</td>
                      <td style={{ padding:'7px 10px' }}>${r.exposure_usd_mn}</td>
                      <td style={{ padding:'7px 10px' }}>{r.isSource ? <Badge label="SOURCE" color={T.red} /> : <span style={{ color:T.textMut, fontSize:10 }}>Affected</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {simSource == null && (
          <div style={{ textAlign:'center', padding:30, color:T.textMut, fontSize:13 }}>Select an entity above to run contagion simulation</div>
        )}
      </div>

      {/* ── 6. Most Connected Holdings BarChart ─────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
          <SectionHeader title="Most Connected Holdings" sub="Ranked by connection count (degree)" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={holdingDegrees.slice(0, 12)} layout="vertical" margin={{ top:5, right:20, left:50, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis type="category" dataKey="ticker" tick={{ fontSize:10, fill:T.textSec }} width={45} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
              <Bar dataKey="degree" name="Connections" fill={T.navy} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 7. Sector Interconnection ─────────────────────────────────────── */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <SectionHeader title="Sector Interconnection" sub="Which sectors are most linked in the network?" />
            <button onClick={exportSectorCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorInterconnection.slice(0, 10)} margin={{ top:10, right:20, left:10, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" angle={-25} textAnchor="end" tick={{ fontSize:9, fill:T.textSec }} height={55} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize:10 }} />
              <Bar dataKey="connections" name="Total Connections" fill={T.gold} radius={[3,3,0,0]} />
              <Bar dataKey="holdingCount" name="Holdings in Sector" fill={T.sage} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Sector Radar ───────────────────────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <SectionHeader title="Sector Network Profile" sub="Radar view of connections and average connection strength by sector" />
        <div style={{ display:'flex', justifyContent:'center' }}>
          <ResponsiveContainer width="60%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="sector" tick={{ fontSize:9, fill:T.textSec }} />
              <PolarRadiusAxis tick={{ fontSize:9, fill:T.textMut }} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
              <Radar name="Connections" dataKey="connections" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
              <Radar name="Avg Strength %" dataKey="avgStrength" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize:10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Connection Type Breakdown Table ─────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <SectionHeader title="Connection Type Breakdown" sub="Distribution of linkage types across all portfolio connections" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
          {['sector', 'exchange', 'supply_chain', 'financial', 'region'].map(type => {
            const count = connections.filter(c => c.linkTypes.includes(type)).length;
            const pct = connections.length > 0 ? (count / connections.length * 100).toFixed(1) : 0;
            const labels = { sector:'Same Sector', exchange:'Same Exchange', supply_chain:'Supply Chain', financial:'Financial', region:'Same Region' };
            const colors = { sector:T.navy, exchange:T.sage, supply_chain:T.amber, financial:T.red, region:T.gold };
            return (
              <div key={type} style={{ background:`${colors[type]}08`, border:`1px solid ${colors[type]}30`, borderRadius:8, padding:12, textAlign:'center' }}>
                <div style={{ fontSize:10, fontWeight:600, color:T.textSec, textTransform:'uppercase', letterSpacing:0.3, marginBottom:4 }}>{labels[type]}</div>
                <div style={{ fontSize:22, fontWeight:700, color:colors[type] }}>{count}</div>
                <div style={{ fontSize:10, color:T.textMut }}>{pct}% of all</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cross-nav footer ───────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16, flexWrap:'wrap' }}>
        {[
          { label:'Scenario Engine', path:'/dme-scenarios' },
          { label:'Alert Center', path:'/dme-alerts' },
          { label:'Climate VaR', path:'/portfolio-climate-var' },
          { label:'Stress Testing', path:'/scenario-stress-test' },
          { label:'Risk Attribution', path:'/risk-attribution' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>{n.label}</button>
        ))}
      </div>
    </div>
  );
}
