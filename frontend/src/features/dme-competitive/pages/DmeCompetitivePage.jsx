import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';

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
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, sage: { bg: '#dcfce7', text: '#166534' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

/* ═══════════════════════════════════════════════════════════════════════════
   COMPETITIVE SCORE COMPUTATION (ported from dme-platform)
   ═══════════════════════════════════════════════════════════════════════════ */
function percentileRank(values, target) {
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter(v => v < target).length;
  const equal = sorted.filter(v => v === target).length;
  return sorted.length > 0 ? Math.round(((below + 0.5 * equal) / sorted.length) * 100) : 50;
}

function computeCompetitiveScore(company, sectorPeers) {
  const esgPercentile = percentileRank(sectorPeers.map(p => p.esg_score || 0), company.esg_score || 0);
  const carbonPercentile = percentileRank(sectorPeers.map(p => 1 / (p.ghg_intensity_tco2e_per_mn || 1)), 1 / (company.ghg_intensity_tco2e_per_mn || 1));
  const transitionPercentile = percentileRank(sectorPeers.map(p => 100 - (p.transition_risk_score || 0)), 100 - (company.transition_risk_score || 0));
  const govPercentile = (company.esg_score || 50) / 100 * 100;
  const dqPercentile = (company.data_quality_score || 50);
  return {
    composite: Math.round(esgPercentile * 0.30 + carbonPercentile * 0.25 + transitionPercentile * 0.20 + govPercentile * 0.15 + dqPercentile * 0.10),
    esg_rank: esgPercentile,
    carbon_rank: carbonPercentile,
    transition_rank: transitionPercentile,
    governance_rank: govPercentile,
    data_quality_rank: dqPercentile,
    sector: company.sector,
    peers_count: sectorPeers.length,
  };
}

/* ── Enrich company data ─────────────────────────────────────────────────── */
function enrichCompany(c, idx) {
  const s = seed(c.company_name || idx);
  return {
    ...c,
    esg_score: c.esg_score || Math.round(25 + sRand(s) * 65),
    ghg_intensity_tco2e_per_mn: c.ghg_intensity_tco2e_per_mn || Math.round(10 + sRand(s + 1) * 800),
    transition_risk_score: c.transition_risk_score || Math.round(10 + sRand(s + 2) * 70),
    data_quality_score: c.data_quality_score || Math.round(20 + sRand(s + 3) * 70),
    implied_temp_rise: c.implied_temp_rise || clamp(1.2 + sRand(s + 4) * 2.8, 1.2, 4.5),
    market_cap_usd_mn: c.market_cap_usd_mn || Math.round(100 + sRand(s + 5) * 50000),
  };
}

/* ── ESG rating estimator ────────────────────────────────────────────────── */
function estimateRatings(composite) {
  const msci = composite >= 80 ? 'AAA' : composite >= 65 ? 'AA' : composite >= 50 ? 'A' : composite >= 35 ? 'BBB' : composite >= 25 ? 'BB' : composite >= 15 ? 'B' : 'CCC';
  const sustainalytics = composite >= 80 ? 'Negligible' : composite >= 60 ? 'Low' : composite >= 40 ? 'Medium' : composite >= 20 ? 'High' : 'Severe';
  const spGlobal = composite >= 70 ? 'Strong' : composite >= 45 ? 'Average' : 'Laggard';
  return { msci, sustainalytics, spGlobal };
}

/* ── Get unique sectors ──────────────────────────────────────────────────── */
const ALL_SECTORS = [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector).filter(Boolean))].sort();
const ENRICHED_MASTER = GLOBAL_COMPANY_MASTER.map((c, i) => enrichCompany(c, i));

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DmeCompetitivePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [crossSector, setCrossSector] = useState('');
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    if (!search.trim()) return ENRICHED_MASTER.slice(0, 20);
    const q = search.toLowerCase();
    return ENRICHED_MASTER.filter(c => (c.company_name || '').toLowerCase().includes(q) || (c.ticker || '').toLowerCase().includes(q) || (c.sector || '').toLowerCase().includes(q)).slice(0, 50);
  }, [search]);

  const selected = useMemo(() => filtered[selectedIdx] || ENRICHED_MASTER[0], [filtered, selectedIdx]);

  /* ── Sector peers ──────────────────────────────────────────────────────── */
  const sectorPeers = useMemo(() => {
    return ENRICHED_MASTER.filter(c => c.sector === selected.sector);
  }, [selected]);

  /* ── Competitive score ─────────────────────────────────────────────────── */
  const compScore = useMemo(() => computeCompetitiveScore(selected, sectorPeers), [selected, sectorPeers]);

  /* ── All peer scores ───────────────────────────────────────────────────── */
  const allPeerScores = useMemo(() => {
    return sectorPeers.map(p => {
      const sc = computeCompetitiveScore(p, sectorPeers);
      return { ...p, ...sc };
    });
  }, [sectorPeers]);

  /* ── Sorted peers ──────────────────────────────────────────────────────── */
  const sortedPeers = useMemo(() => {
    const arr = [...allPeerScores];
    arr.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [allPeerScores, sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Best-in-class & laggards ──────────────────────────────────────────── */
  const bestInClass = useMemo(() => sortedPeers.slice(0, 5), [sortedPeers]);
  const laggards = useMemo(() => [...sortedPeers].reverse().slice(0, 5), [sortedPeers]);

  /* ── Sector leader ─────────────────────────────────────────────────────── */
  const sectorLeader = useMemo(() => sortedPeers[0] || selected, [sortedPeers, selected]);

  /* ── Radar data ────────────────────────────────────────────────────────── */
  const radarData = useMemo(() => {
    const median = {
      esg: Math.round(sectorPeers.reduce((s, p) => s + (p.esg_score || 0), 0) / sectorPeers.length),
      carbon: percentileRank(sectorPeers.map(p => 1 / (p.ghg_intensity_tco2e_per_mn || 1)), 1 / (sectorPeers.reduce((s, p) => s + (p.ghg_intensity_tco2e_per_mn || 1), 0) / sectorPeers.length)),
      transition: 50,
      governance: 50,
      dataQuality: 50,
    };
    return [
      { dimension: 'ESG', company: compScore.esg_rank, median: median.esg },
      { dimension: 'Carbon Efficiency', company: compScore.carbon_rank, median: median.carbon },
      { dimension: 'Transition Readiness', company: compScore.transition_rank, median: median.transition },
      { dimension: 'Governance', company: compScore.governance_rank, median: median.governance },
      { dimension: 'Data Quality', company: compScore.data_quality_rank, median: median.dataQuality },
    ];
  }, [compScore, sectorPeers]);

  /* ── Competitive gap ───────────────────────────────────────────────────── */
  const gapData = useMemo(() => {
    const leaderScore = computeCompetitiveScore(sectorLeader, sectorPeers);
    return [
      { dimension: 'ESG', company: compScore.esg_rank, leader: leaderScore.esg_rank, gap: leaderScore.esg_rank - compScore.esg_rank },
      { dimension: 'Carbon', company: compScore.carbon_rank, leader: leaderScore.carbon_rank, gap: leaderScore.carbon_rank - compScore.carbon_rank },
      { dimension: 'Transition', company: compScore.transition_rank, leader: leaderScore.transition_rank, gap: leaderScore.transition_rank - compScore.transition_rank },
      { dimension: 'Governance', company: compScore.governance_rank, leader: leaderScore.governance_rank, gap: leaderScore.governance_rank - compScore.governance_rank },
      { dimension: 'Data Quality', company: compScore.data_quality_rank, leader: leaderScore.data_quality_rank, gap: leaderScore.data_quality_rank - compScore.data_quality_rank },
    ];
  }, [compScore, sectorLeader, sectorPeers]);

  /* ── Cross-sector comparison ───────────────────────────────────────────── */
  const crossSectorScore = useMemo(() => {
    if (!crossSector) return null;
    const crossPeers = ENRICHED_MASTER.filter(c => c.sector === crossSector);
    if (crossPeers.length === 0) return null;
    return computeCompetitiveScore(selected, crossPeers);
  }, [selected, crossSector]);

  /* ── ESG rating estimates ──────────────────────────────────────────────── */
  const ratings = useMemo(() => estimateRatings(compScore.composite), [compScore]);

  /* ── Sector statistics ─────────────────────────────────────────────────── */
  const sectorStats = useMemo(() => {
    const scores = allPeerScores.map(p => p.composite);
    const esgScores = sectorPeers.map(p => p.esg_score || 0);
    const carbonScores = sectorPeers.map(p => p.ghg_intensity_tco2e_per_mn || 0);
    const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : 0;
    const median = (arr) => { const sorted = [...arr].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2 * 10) / 10; };
    const std = (arr) => { const m = avg(arr); return Math.round(Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length) * 10) / 10; };
    return {
      compositeAvg: avg(scores), compositeMedian: median(scores), compositeStd: std(scores),
      esgAvg: avg(esgScores), esgMedian: median(esgScores),
      carbonAvg: avg(carbonScores), carbonMedian: median(carbonScores),
      minComposite: Math.min(...scores), maxComposite: Math.max(...scores),
      peerCount: sectorPeers.length,
    };
  }, [allPeerScores, sectorPeers]);

  /* ── Dimension trend simulation ────────────────────────────────────────── */
  const dimensionTrend = useMemo(() => {
    const quarters = ['Q1 24','Q2 24','Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25'];
    return quarters.map((q, i) => {
      const s = seed(selected.company_name + q);
      return {
        quarter: q,
        esg: clamp(compScore.esg_rank + (sRand(s) - 0.5) * 15, 5, 95),
        carbon: clamp(compScore.carbon_rank + (sRand(s + 1) - 0.5) * 15, 5, 95),
        transition: clamp(compScore.transition_rank + (sRand(s + 2) - 0.5) * 15, 5, 95),
        governance: clamp(compScore.governance_rank + (sRand(s + 3) - 0.5) * 10, 5, 95),
        data_quality: clamp(compScore.data_quality_rank + (sRand(s + 4) - 0.5) * 10, 5, 95),
      };
    });
  }, [selected, compScore]);

  /* ── Peer distribution histogram ───────────────────────────────────────── */
  const peerDistribution = useMemo(() => {
    const buckets = [
      { label: '0-20', min: 0, max: 20, count: 0, isSelected: false },
      { label: '21-40', min: 21, max: 40, count: 0, isSelected: false },
      { label: '41-60', min: 41, max: 60, count: 0, isSelected: false },
      { label: '61-80', min: 61, max: 80, count: 0, isSelected: false },
      { label: '81-100', min: 81, max: 100, count: 0, isSelected: false },
    ];
    allPeerScores.forEach(p => {
      const b = buckets.find(b => p.composite >= b.min && p.composite <= b.max);
      if (b) {
        b.count += 1;
        if (p.company_name === selected.company_name) b.isSelected = true;
      }
    });
    return buckets;
  }, [allPeerScores, selected]);

  /* ── Improvement recommendations ───────────────────────────────────────── */
  const recommendations = useMemo(() => {
    const recs = [];
    if (compScore.esg_rank < 50) recs.push({ dim: 'ESG', score: compScore.esg_rank, priority: 'High', action: 'Improve overall ESG transparency and disclosure quality', impact: '+5-15 pts composite' });
    if (compScore.carbon_rank < 50) recs.push({ dim: 'Carbon Efficiency', score: compScore.carbon_rank, priority: compScore.carbon_rank < 25 ? 'Critical' : 'High', action: 'Reduce GHG intensity through operational efficiency and renewable energy', impact: '+8-20 pts composite' });
    if (compScore.transition_rank < 50) recs.push({ dim: 'Transition Readiness', score: compScore.transition_rank, priority: 'Medium', action: 'Develop a comprehensive climate transition plan aligned with TCFD/ISSB', impact: '+4-10 pts composite' });
    if (compScore.governance_rank < 60) recs.push({ dim: 'Governance', score: compScore.governance_rank, priority: 'Medium', action: 'Strengthen board ESG oversight and link executive pay to sustainability KPIs', impact: '+3-8 pts composite' });
    if (compScore.data_quality_rank < 40) recs.push({ dim: 'Data Quality', score: compScore.data_quality_rank, priority: 'High', action: 'Obtain third-party assurance for ESG data and improve scope 3 estimation', impact: '+2-6 pts composite' });
    if (recs.length === 0) recs.push({ dim: 'Overall', score: compScore.composite, priority: 'Low', action: 'Maintain current leadership position across all dimensions', impact: 'Sustain top-quartile' });
    return recs;
  }, [compScore]);

  /* ── Quartile analysis ──────────────────────────────────────────────────── */
  const quartileAnalysis = useMemo(() => {
    const sorted = [...allPeerScores].sort((a, b) => b.composite - a.composite);
    const q1 = Math.ceil(sorted.length * 0.25);
    const q2 = Math.ceil(sorted.length * 0.50);
    const q3 = Math.ceil(sorted.length * 0.75);
    const selectedRank = sorted.findIndex(p => p.company_name === selected.company_name) + 1;
    const quartile = selectedRank <= q1 ? 1 : selectedRank <= q2 ? 2 : selectedRank <= q3 ? 3 : 4;
    const avg = (arr, key) => arr.length > 0 ? Math.round(arr.reduce((s, p) => s + (p[key] || 0), 0) / arr.length) : 0;
    return {
      quartile,
      rank: selectedRank,
      total: sorted.length,
      q1_avg: avg(sorted.slice(0, q1), 'composite'),
      q2_avg: avg(sorted.slice(q1, q2), 'composite'),
      q3_avg: avg(sorted.slice(q2, q3), 'composite'),
      q4_avg: avg(sorted.slice(q3), 'composite'),
      q1_count: q1,
      q2_count: q2 - q1,
      q3_count: q3 - q2,
      q4_count: sorted.length - q3,
    };
  }, [allPeerScores, selected]);

  /* ── Carbon-ESG scatter data ───────────────────────────────────────────── */
  const carbonEsgScatter = useMemo(() => {
    return sectorPeers.slice(0, 40).map(p => ({
      name: p.company_name,
      esg: p.esg_score || 0,
      carbon: p.ghg_intensity_tco2e_per_mn || 0,
      isSelected: p.company_name === selected.company_name,
      composite: computeCompetitiveScore(p, sectorPeers).composite,
    }));
  }, [sectorPeers, selected]);

  /* ── Dimension correlation matrix (simplified) ─────────────────────────── */
  const dimensionCorrelation = useMemo(() => {
    const dims = ['esg_rank', 'carbon_rank', 'transition_rank', 'governance_rank', 'data_quality_rank'];
    const labels = ['ESG', 'Carbon', 'Transition', 'Governance', 'Data Quality'];
    const corr = (a, b) => {
      const n = allPeerScores.length;
      if (n < 3) return 0;
      const avgA = allPeerScores.reduce((s, p) => s + (p[a] || 0), 0) / n;
      const avgB = allPeerScores.reduce((s, p) => s + (p[b] || 0), 0) / n;
      const num = allPeerScores.reduce((s, p) => s + ((p[a] || 0) - avgA) * ((p[b] || 0) - avgB), 0);
      const denA = Math.sqrt(allPeerScores.reduce((s, p) => s + Math.pow((p[a] || 0) - avgA, 2), 0));
      const denB = Math.sqrt(allPeerScores.reduce((s, p) => s + Math.pow((p[b] || 0) - avgB, 2), 0));
      return denA > 0 && denB > 0 ? Math.round(num / (denA * denB) * 100) / 100 : 0;
    };
    return dims.map((d1, i) => ({
      dim: labels[i],
      ...Object.fromEntries(dims.map((d2, j) => [labels[j], i === j ? 1.00 : corr(d1, d2)])),
    }));
  }, [allPeerScores]);

  /* ── Exports ───────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const headers = ['Entity','Sector','Composite','ESG','Carbon','Transition','Governance','DataQuality','ESGScore','GHGIntensity','TransitionRisk'];
    const rows = sortedPeers.map(p => [p.company_name, p.sector, p.composite, p.esg_rank, p.carbon_rank, p.transition_rank, p.governance_rank, p.data_quality_rank, p.esg_score, p.ghg_intensity_tco2e_per_mn, p.transition_risk_score].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dme_competitive_${selected.sector}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [sortedPeers, selected]);

  const exportJSON = useCallback(() => {
    const payload = { entity: selected.company_name, sector: selected.sector, competitive_score: compScore, ratings, peer_count: sectorPeers.length, leader: sectorLeader.company_name, gap_analysis: gapData, generated: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dme_competitive_${selected.company_name}.json`; a.click(); URL.revokeObjectURL(url);
  }, [selected, compScore, ratings, sectorPeers, sectorLeader, gapData]);

  const exportPeerBench = useCallback(() => {
    const headers = ['Rank','Entity','Composite','ESG','Carbon','Transition','Governance','DataQuality'];
    const rows = sortedPeers.map((p, i) => [i + 1, p.company_name, p.composite, p.esg_rank, p.carbon_rank, p.transition_rank, p.governance_rank, p.data_quality_rank].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dme_peer_benchmark_${selected.sector}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [sortedPeers, selected]);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>DME Competitive Intelligence</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['Peer Benchmarking','5 Dimensions',`${GLOBAL_COMPANY_MASTER.length} Companies`].map(b => <Badge key={b} label={b} color="navy" />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={exportPeerBench}>Export Peer Bench</Btn>
        </div>
      </div>

      {/* ── COMPANY SELECTOR ─────────────────────────────────────────────────── */}
      <Section title="Company Selector" badge="Search from master">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, ticker, or sector..." style={{ width: '100%', padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font, background: T.surface, color: T.text, boxSizing: 'border-box' }} />
            <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 4, border: `1px solid ${T.border}`, borderRadius: 8, background: T.surface }}>
              {filtered.map((c, i) => (
                <div key={i} onClick={() => setSelectedIdx(i)} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 12, background: i === selectedIdx ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{c.company_name}</span>
                  <span style={{ color: T.textMut }}>{c.sector}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{selected.company_name}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{selected.sector} | {selected.exchange || 'Global'} | {selected.ticker || '---'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <div style={{ fontSize: 11, color: T.textMut }}>ESG Score: <strong style={{ color: T.navy }}>{selected.esg_score}</strong></div>
              <div style={{ fontSize: 11, color: T.textMut }}>GHG Intensity: <strong style={{ color: T.navy }}>{fmt(selected.ghg_intensity_tco2e_per_mn)}</strong></div>
              <div style={{ fontSize: 11, color: T.textMut }}>Transition Risk: <strong style={{ color: T.navy }}>{selected.transition_risk_score}</strong></div>
              <div style={{ fontSize: 11, color: T.textMut }}>Mkt Cap: <strong style={{ color: T.navy }}>${fmt(selected.market_cap_usd_mn)}M</strong></div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── COMPETITIVE SCORE CARD ───────────────────────────────────────────── */}
      <Section title="Competitive Score" badge={`${selected.sector} | ${compScore.peers_count} peers`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          <KpiCard label="Composite" value={compScore.composite} sub={`Top ${100 - compScore.composite}%`} accent={compScore.composite >= 70 ? T.sage : compScore.composite >= 40 ? T.gold : T.red} />
          <KpiCard label="ESG" value={compScore.esg_rank} sub="30% weight" />
          <KpiCard label="Carbon Efficiency" value={compScore.carbon_rank} sub="25% weight" />
          <KpiCard label="Transition Readiness" value={compScore.transition_rank} sub="20% weight" />
          <KpiCard label="Governance" value={compScore.governance_rank} sub="15% weight" />
          <KpiCard label="Data Quality" value={compScore.data_quality_rank} sub="10% weight" />
          <KpiCard label="Sector Rank" value={`#${sortedPeers.findIndex(p => p.company_name === selected.company_name) + 1}`} sub={`of ${compScore.peers_count}`} accent={T.navy} />
        </div>
      </Section>

      {/* ── 5-DIMENSION RADAR ────────────────────────────────────────────────── */}
      <Section title="5-Dimension Radar" badge="vs Sector Median">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: T.textSec }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
              <Radar name={selected.company_name} dataKey="company" stroke={T.navy} fill={T.navyL} fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Sector Median" dataKey="median" stroke={T.gold} fill={T.goldL} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── SECTOR PEER RANKING TABLE ────────────────────────────────────────── */}
      <Section title="Sector Peer Ranking" badge={`${sectorPeers.length} peers | sortable`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>#</th>
                {[{ key: 'company_name', label: 'Entity' }, { key: 'composite', label: 'Composite' }, { key: 'esg_rank', label: 'ESG' }, { key: 'carbon_rank', label: 'Carbon' }, { key: 'transition_rank', label: 'Transition' }, { key: 'governance_rank', label: 'Governance' }, { key: 'data_quality_rank', label: 'Data Quality' }].map(c => (
                  <th key={c.key} style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort(c.key)}>
                    {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPeers.slice(0, 30).map((p, i) => {
                const isSelected = p.company_name === selected.company_name;
                return (
                  <tr key={i} style={{ background: isSelected ? '#eef2ff' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...td, fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: isSelected ? 700 : 400 }}>{p.company_name} {isSelected && <Badge label="SELECTED" color="navy" />}</td>
                    <td style={{ ...td, fontWeight: 700, color: p.composite >= 70 ? T.green : p.composite >= 40 ? T.amber : T.red }}>{p.composite}</td>
                    <td style={td}>{p.esg_rank}</td>
                    <td style={td}>{p.carbon_rank}</td>
                    <td style={td}>{p.transition_rank}</td>
                    <td style={td}>{p.governance_rank}</td>
                    <td style={td}>{p.data_quality_rank}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── BEST-IN-CLASS vs LAGGARD ─────────────────────────────────────────── */}
      <Section title="Best-in-Class vs Laggard Analysis" badge="Top 5 & Bottom 5">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 10 }}>Best-in-Class (Top 5)</div>
            <table style={tbl}>
              <thead><tr><th style={th}>#</th><th style={th}>Entity</th><th style={th}>Composite</th><th style={th}>ESG</th></tr></thead>
              <tbody>
                {bestInClass.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...td, fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{p.company_name}</td>
                    <td style={{ ...td, color: T.green, fontWeight: 700 }}>{p.composite}</td>
                    <td style={td}>{p.esg_rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 10 }}>Laggards (Bottom 5)</div>
            <table style={tbl}>
              <thead><tr><th style={th}>#</th><th style={th}>Entity</th><th style={th}>Composite</th><th style={th}>ESG</th></tr></thead>
              <tbody>
                {laggards.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...td, fontWeight: 600 }}>{sectorPeers.length - i}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{p.company_name}</td>
                    <td style={{ ...td, color: T.red, fontWeight: 700 }}>{p.composite}</td>
                    <td style={td}>{p.esg_rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── COMPETITIVE GAP BAR ──────────────────────────────────────────────── */}
      <Section title="Competitive Gap Analysis" badge={`vs ${sectorLeader.company_name}`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gapData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" domain={[-50, 50]} tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis dataKey="dimension" type="category" width={120} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine x={0} stroke={T.navy} />
              <Bar dataKey="gap" name="Gap to Leader" radius={[0, 6, 6, 0]}>
                {gapData.map((d, i) => <Cell key={i} fill={d.gap > 10 ? T.red : d.gap > 0 ? T.amber : T.sage} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>
            Positive gap = leader is ahead. Negative = you lead on that dimension.
          </div>
        </div>
      </Section>

      {/* ── CARBON-ESG PERFORMANCE MAP ────────────────────────────────────── */}
      <Section title="Carbon-ESG Performance Map" badge={`${sectorPeers.length} peers`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Entity</th>
                    <th style={th}>ESG Score</th>
                    <th style={th}>Carbon Intensity</th>
                    <th style={th}>Composite</th>
                  </tr>
                </thead>
                <tbody>
                  {carbonEsgScatter.slice(0, 12).map((p, i) => (
                    <tr key={i} style={{ background: p.isSelected ? '#eef2ff' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...td, fontWeight: p.isSelected ? 700 : 400 }}>{p.name} {p.isSelected && <Badge label="YOU" color="navy" />}</td>
                      <td style={{ ...td, color: p.esg > 60 ? T.sage : p.esg > 40 ? T.amber : T.red }}>{p.esg}</td>
                      <td style={td}>{fmt(p.carbon)}</td>
                      <td style={{ ...td, fontWeight: 700, color: p.composite >= 60 ? T.sage : p.composite >= 40 ? T.amber : T.red }}>{p.composite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ padding: 10, fontSize: 12, color: T.textSec }}>
                <strong>Quadrant interpretation:</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10 }}>
                <div style={{ padding: 10, borderRadius: 8, background: '#dcfce7', fontSize: 11 }}>
                  <strong style={{ color: '#166534' }}>Leaders</strong><br />
                  High ESG + Low Carbon = Top performers driving value creation through sustainable operations
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#fef3c7', fontSize: 11 }}>
                  <strong style={{ color: '#92400e' }}>Transitioners</strong><br />
                  High ESG + High Carbon = Strong governance but operational improvements needed
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#dbeafe', fontSize: 11 }}>
                  <strong style={{ color: '#1e40af' }}>Efficient but Opaque</strong><br />
                  Low ESG + Low Carbon = Good operations but weak disclosure and governance
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#fee2e2', fontSize: 11 }}>
                  <strong style={{ color: '#991b1b' }}>Laggards</strong><br />
                  Low ESG + High Carbon = Significant improvement needed across all dimensions
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── CROSS-SECTOR COMPARISON ──────────────────────────────────────────── */}
      <Section title="Cross-Sector Comparison" badge="Compare to different sector">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4, textTransform: 'uppercase' }}>Benchmark Sector</div>
              <select value={crossSector} onChange={e => setCrossSector(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.surface, color: T.text, fontFamily: T.font }}>
                <option value="">-- Select sector --</option>
                {ALL_SECTORS.filter(s => s !== selected.sector).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {crossSectorScore ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                <KpiCard label="Composite" value={crossSectorScore.composite} sub={`vs ${crossSector}`} />
                <KpiCard label="ESG" value={crossSectorScore.esg_rank} />
                <KpiCard label="Carbon" value={crossSectorScore.carbon_rank} />
                <KpiCard label="Transition" value={crossSectorScore.transition_rank} />
                <KpiCard label="Governance" value={crossSectorScore.governance_rank} />
                <KpiCard label="Data Quality" value={crossSectorScore.data_quality_rank} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMut, fontSize: 12 }}>Select a sector to compare against</div>
            )}
          </div>
        </div>
      </Section>

      {/* ── SECTOR STATISTICS ────────────────────────────────────────────────── */}
      <Section title="Sector Statistics" badge={`${selected.sector} benchmark`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <KpiCard label="Composite Avg" value={sectorStats.compositeAvg} sub={`Median: ${sectorStats.compositeMedian}`} />
          <KpiCard label="Composite StdDev" value={sectorStats.compositeStd} sub={`Range: ${sectorStats.minComposite}-${sectorStats.maxComposite}`} />
          <KpiCard label="ESG Avg" value={sectorStats.esgAvg} sub={`Median: ${sectorStats.esgMedian}`} />
          <KpiCard label="Carbon Intensity Avg" value={fmt(sectorStats.carbonAvg)} sub={`Median: ${fmt(sectorStats.carbonMedian)}`} />
          <KpiCard label="Peer Count" value={sectorStats.peerCount} sub={`in ${selected.sector}`} accent={T.navy} />
        </div>
      </Section>

      {/* ── PEER COMPOSITE DISTRIBUTION ──────────────────────────────────────── */}
      <Section title="Peer Composite Distribution" badge="Where does the entity fall?">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={peerDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {peerDistribution.map((d, i) => <Cell key={i} fill={d.isSelected ? T.navy : T.borderL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontSize: 11, color: T.textMut, marginTop: 8 }}>
            Highlighted bar contains {selected.company_name} (composite: {compScore.composite})
          </div>
        </div>
      </Section>

      {/* ── DIMENSION TREND ──────────────────────────────────────────────────── */}
      <Section title="Competitive Score Trend" badge="8-quarter simulated">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dimensionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="esg" fill={T.navy} name="ESG" stackId="a" />
              <Bar dataKey="carbon" fill={T.sage} name="Carbon" stackId="b" />
              <Bar dataKey="transition" fill={T.gold} name="Transition" stackId="c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── IMPROVEMENT RECOMMENDATIONS ──────────────────────────────────────── */}
      <Section title="Improvement Recommendations" badge={`${recommendations.length} actions`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Dimension','Current Score','Priority','Recommended Action','Potential Impact'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{r.dim}</td>
                  <td style={{ ...td, fontWeight: 700, color: r.score < 30 ? T.red : r.score < 50 ? T.amber : T.sage }}>{r.score}</td>
                  <td style={td}><Badge label={r.priority} color={r.priority === 'Critical' ? 'red' : r.priority === 'High' ? 'amber' : 'blue'} /></td>
                  <td style={{ ...td, fontSize: 11 }}>{r.action}</td>
                  <td style={{ ...td, fontWeight: 600, color: T.sage }}>{r.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── ESG RATING CROSS-REFERENCE ───────────────────────────────────────── */}
      <Section title="ESG Rating Cross-Reference" badge="Estimated external ratings">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>MSCI ESG Rating</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: ratings.msci === 'AAA' || ratings.msci === 'AA' ? T.sage : ratings.msci === 'A' || ratings.msci === 'BBB' ? T.gold : T.red }}>{ratings.msci}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Based on composite percentile: {compScore.composite}</div>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Sustainalytics Risk</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: ratings.sustainalytics === 'Negligible' ? T.sage : ratings.sustainalytics === 'Low' ? T.green : ratings.sustainalytics === 'Medium' ? T.amber : T.red }}>{ratings.sustainalytics}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>ESG Risk Rating estimate</div>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>S&P Global CSA</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: ratings.spGlobal === 'Strong' ? T.sage : ratings.spGlobal === 'Average' ? T.gold : T.red }}>{ratings.spGlobal}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Corporate Sustainability Assessment</div>
          </div>
        </div>
      </Section>

      {/* ── QUARTILE ANALYSIS ────────────────────────────────────────────────── */}
      <Section title="Quartile Analysis" badge={`Q${quartileAnalysis.quartile} of 4`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          {[{ q: 'Q1 (Top)', avg: quartileAnalysis.q1_avg, count: quartileAnalysis.q1_count, active: quartileAnalysis.quartile === 1, color: T.sage },
            { q: 'Q2', avg: quartileAnalysis.q2_avg, count: quartileAnalysis.q2_count, active: quartileAnalysis.quartile === 2, color: T.green },
            { q: 'Q3', avg: quartileAnalysis.q3_avg, count: quartileAnalysis.q3_count, active: quartileAnalysis.quartile === 3, color: T.amber },
            { q: 'Q4 (Bottom)', avg: quartileAnalysis.q4_avg, count: quartileAnalysis.q4_count, active: quartileAnalysis.quartile === 4, color: T.red }].map(q => (
            <div key={q.q} style={{ background: q.active ? T.surfaceH : T.surface, border: `2px solid ${q.active ? T.navy : T.border}`, borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{q.q}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: q.color, marginTop: 4 }}>{q.avg}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{q.count} peers</div>
              {q.active && <Badge label="YOUR POSITION" color="navy" />}
            </div>
          ))}
        </div>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 12, fontSize: 12, color: T.textSec }}>
          <strong>{selected.company_name}</strong> ranks #{quartileAnalysis.rank} of {quartileAnalysis.total} in {selected.sector}.
          {quartileAnalysis.quartile === 1 ? ' Top-quartile performer.' : quartileAnalysis.quartile === 4 ? ' Bottom-quartile: significant improvement opportunity.' : ` Mid-range: ${quartileAnalysis.quartile === 2 ? 'above median' : 'below median'} performance.`}
        </div>
      </Section>

      {/* ── DIMENSION CORRELATION MATRIX ─────────────────────────────────────── */}
      <Section title="Dimension Correlation Matrix" badge="Cross-dimension relationships">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Dimension</th>
                {['ESG', 'Carbon', 'Transition', 'Governance', 'Data Quality'].map(h => <th key={h} style={{ ...th, textAlign: 'center' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {dimensionCorrelation.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{row.dim}</td>
                  {['ESG', 'Carbon', 'Transition', 'Governance', 'Data Quality'].map(col => {
                    const val = row[col];
                    const bg = val === 1 ? T.surfaceH : val > 0.5 ? '#dcfce7' : val > 0.2 ? '#fefce8' : val < -0.2 ? '#fee2e2' : T.surface;
                    return <td key={col} style={{ ...td, textAlign: 'center', background: bg, fontWeight: val === 1 ? 700 : 400 }}>{val.toFixed(2)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10, color: T.textMut, marginTop: 8 }}>
            Green = positive correlation | Red = negative | Higher absolute value = stronger relationship
          </div>
        </div>
      </Section>

      {/* ── YEAR-OVER-YEAR PROGRESS ──────────────────────────────────────────── */}
      <Section title="Year-over-Year Progress" badge="Composite score trajectory">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {(() => {
              const s = seed(selected.company_name + 'yoy');
              const prev = clamp(compScore.composite - 5 + Math.round(sRand(s) * 10), 5, 95);
              const prevPrev = clamp(prev - 3 + Math.round(sRand(s + 1) * 8), 5, 95);
              const change1 = compScore.composite - prev;
              const change2 = prev - prevPrev;
              return [
                { year: 'FY 2025', score: compScore.composite, change: change1 },
                { year: 'FY 2024', score: prev, change: change2 },
                { year: 'FY 2023', score: prevPrev, change: null },
              ].map(y => (
                <div key={y.year} style={{ padding: 12, borderRadius: 8, background: T.surfaceH, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>{y.year}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, marginTop: 4 }}>{y.score}</div>
                  {y.change !== null && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: y.change > 0 ? T.green : y.change < 0 ? T.red : T.textMut, marginTop: 2 }}>
                      {y.change > 0 ? '+' : ''}{y.change} pts
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      </Section>

      {/* ── METHODOLOGY ──────────────────────────────────────────────────────── */}
      <Section title="Methodology" badge="Scoring framework">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
            {[{ dim: 'ESG', weight: '30%', desc: 'ESG disclosure quality and performance rating', color: T.navy },
              { dim: 'Carbon Efficiency', weight: '25%', desc: 'Inverse GHG intensity (lower emissions = higher score)', color: T.sage },
              { dim: 'Transition Readiness', weight: '20%', desc: 'Preparedness for low-carbon transition', color: T.gold },
              { dim: 'Governance', weight: '15%', desc: 'Board oversight, ethics, and compliance quality', color: '#4f46e5' },
              { dim: 'Data Quality', weight: '10%', desc: 'Completeness, assurance, and timeliness of disclosures', color: '#0891b2' }].map(d => (
              <div key={d.dim} style={{ padding: 10, borderRadius: 8, borderTop: `3px solid ${d.color}`, background: T.surfaceH }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{d.dim}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: d.color, marginTop: 2 }}>{d.weight}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{d.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.textSec }}>
            Composite = (ESG percentile x 0.30) + (Carbon percentile x 0.25) + (Transition percentile x 0.20) + (Governance proxy x 0.15) + (Data quality x 0.10). All percentiles computed within sector peer group.
          </div>
        </div>
      </Section>

      {/* ── CROSS-NAV ────────────────────────────────────────────────────────── */}
      <Section title="Cross-Navigation" badge="DME Suite">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'DME Dashboard', path: '/dme-dashboard' },
            { label: 'DME Risk Engine', path: '/dme-risk' },
            { label: 'Entity Deep-Dive', path: '/dme-entity' },
            { label: 'Portfolio Analytics', path: '/dme-portfolio' },
            { label: 'Contagion Network', path: '/dme-contagion' },
            { label: 'Alert Center', path: '/dme-alerts' },
            { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
            { label: 'SFDR PAI', path: '/sfdr-pai' },
            { label: 'Regulatory Gap', path: '/regulatory-gap' },
          ].map(n => <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>)}
        </div>
      </Section>
    </div>
  );
}
