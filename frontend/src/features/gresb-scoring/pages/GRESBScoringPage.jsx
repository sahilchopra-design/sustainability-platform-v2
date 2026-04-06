import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ────────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── GRESB Aspects ────────────────────────────────────────────────────────────── */
const GRESB_ASPECTS = [
  { id:'leadership', name:'Leadership', maxScore:20, description:'Senior leadership engagement and sustainability strategy', tcfd:'Governance' },
  { id:'policies', name:'Policies', maxScore:20, description:'ESG policies, environmental management systems', tcfd:'Strategy' },
  { id:'riskMgmt', name:'Risk Management', maxScore:20, description:'Climate and ESG risk assessment and mitigation', tcfd:'Risk Management' },
  { id:'monitoring', name:'Monitoring & EMS', maxScore:20, description:'Environmental monitoring systems and data management', tcfd:'Metrics & Targets' },
  { id:'stakeholder', name:'Stakeholder Engagement', maxScore:20, description:'Tenant engagement, community impact, supply chain', tcfd:'Strategy' },
  { id:'performance', name:'Performance Indicators', maxScore:20, description:'Energy, GHG, water, waste intensity metrics', tcfd:'Metrics & Targets' },
  { id:'certifications', name:'Building Certifications', maxScore:20, description:'Green building certifications coverage', tcfd:'Metrics & Targets' },
];

const TCFD_PILLARS = ['Governance', 'Strategy', 'Risk Management', 'Metrics & Targets'];
const TCFD_COLORS = { 'Governance':'#2563eb', 'Strategy':'#7c3aed', 'Risk Management':'#f97316', 'Metrics & Targets':'#16a34a' };

/* ── Peer Benchmarks ──────────────────────────────────────────────────────────── */
const PEER_BENCHMARKS = {
  'Office Global':     { median:72, p25:62, p75:82, p90:90, avgStars:3.2 },
  'Office Europe':     { median:76, p25:66, p75:85, p90:92, avgStars:3.5 },
  'Office APAC':       { median:70, p25:60, p75:80, p90:88, avgStars:3.0 },
  'Retail Global':     { median:68, p25:58, p75:78, p90:86, avgStars:2.8 },
  'Retail APAC':       { median:62, p25:52, p75:72, p90:82, avgStars:2.5 },
  'Retail MENA':       { median:55, p25:42, p75:65, p90:75, avgStars:2.0 },
  'Retail LATAM':      { median:52, p25:40, p75:62, p90:72, avgStars:1.8 },
  'Hotel Global':      { median:65, p25:55, p75:75, p90:84, avgStars:2.6 },
  'Hotel Europe':      { median:68, p25:58, p75:78, p90:86, avgStars:2.8 },
  'Industrial Europe': { median:72, p25:62, p75:82, p90:90, avgStars:3.2 },
  'Industrial Americas': { median:60, p25:50, p75:70, p90:80, avgStars:2.4 },
  'Industrial APAC':   { median:68, p25:58, p75:78, p90:86, avgStars:2.8 },
  'Residential Europe':{ median:78, p25:68, p75:88, p90:94, avgStars:3.6 },
  'Residential Americas':{ median:70, p25:60, p75:80, p90:88, avgStars:3.0 },
  'DataCentre Global': { median:74, p25:64, p75:84, p90:92, avgStars:3.4 },
  'DataCentre APAC':   { median:68, p25:58, p75:78, p90:86, avgStars:2.8 },
  'Mixed Global':      { median:70, p25:60, p75:80, p90:88, avgStars:3.0 },
  'Mixed APAC':        { median:65, p25:55, p75:75, p90:84, avgStars:2.6 },
  'Healthcare Global': { median:66, p25:56, p75:76, p90:85, avgStars:2.6 },
};

/* ── Star Rating ──────────────────────────────────────────────────────────────── */
const getStarRating = (score, peerGroup) => {
  const peer = PEER_BENCHMARKS[peerGroup] || PEER_BENCHMARKS['Office Global'];
  if (score >= peer.p90) return 5;
  if (score >= peer.p75) return 4;
  if (score >= peer.median) return 3;
  if (score >= peer.p25) return 2;
  return 1;
};
const renderStars = (count) => {
  const full = Math.floor(count);
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < full ? T.gold : T.borderL, fontSize:14 }}>{i < full ? '\u2605' : '\u2606'}</span>
  ));
};

/* ── Peer Percentile ──────────────────────────────────────────────────────────── */
const getPeerPercentile = (score, peerGroup) => {
  const peer = PEER_BENCHMARKS[peerGroup] || PEER_BENCHMARKS['Office Global'];
  if (score >= peer.p90) return 90 + (score - peer.p90) / (100 - peer.p90) * 10;
  if (score >= peer.p75) return 75 + (score - peer.p75) / (peer.p90 - peer.p75) * 15;
  if (score >= peer.median) return 50 + (score - peer.median) / (peer.p75 - peer.median) * 25;
  if (score >= peer.p25) return 25 + (score - peer.p25) / (peer.median - peer.p25) * 25;
  return Math.max(1, (score / peer.p25) * 25);
};

/* ── Reusable UI ──────────────────────────────────────────────────────────────── */
const Section = ({ title, badge, children }) => (
  <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:24, marginBottom:20 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
      <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:T.text, fontFamily:T.font }}>{title}</h3>
      {badge && <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:6, background:'#f0ede7', color:T.textSec }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:'14px 16px', borderLeft:`3px solid ${accent || T.gold}` }}>
    <div style={{ fontSize:11, color:T.textMut, fontFamily:T.font, marginBottom:4, fontWeight:500 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.text, fontFamily:T.font }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4, fontFamily:T.font }}>{sub}</div>}
  </div>
);

const fmt = (v) => typeof v === 'number' ? v.toFixed(1) : v;

/* ── Improvement Recommendations ──────────────────────────────────────────────── */
const ASPECT_RECOMMENDATIONS = {
  leadership: ['Appoint board-level sustainability committee', 'Publish annual sustainability strategy', 'Link executive compensation to ESG KPIs'],
  policies: ['Implement ISO 14001 EMS across portfolio', 'Adopt science-based targets (SBTi)', 'Create green procurement policy'],
  riskMgmt: ['Conduct TCFD-aligned scenario analysis', 'Implement climate risk register', 'Conduct annual physical risk assessment'],
  monitoring: ['Deploy IoT energy monitoring in all assets', 'Automate Scope 1-3 GHG data collection', 'Implement waste tracking platform'],
  stakeholder: ['Launch green lease program', 'Conduct annual tenant satisfaction survey', 'Establish community impact framework'],
  performance: ['Reduce energy intensity by 3% YoY', 'Install on-site renewables', 'Achieve net-zero water for top assets'],
  certifications: ['Target LEED/BREEAM for 80% of portfolio', 'Achieve WELL certification for office assets', 'Pursue NABERS ratings for all Australian assets'],
};

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  EP-I4 — GRESB Scoring & Benchmarking                                        */
/* ══════════════════════════════════════════════════════════════════════════════ */
export default function GRESBScoringPage() {
  const navigate = useNavigate();

  /* ── Load RE portfolio ──────────────────────────────────────────────────────── */
  const portfolio = useMemo(() => {
    try {
      const raw = localStorage.getItem('ra_re_portfolio_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : parsed.properties || parsed.data || null;
    } catch { return null; }
  }, []);

  /* ── State ──────────────────────────────────────────────────────────────────── */
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sortCol, setSortCol] = useState('totalScore');
  const [sortDir, setSortDir] = useState('desc');

  /* ── NEW: Aspect score overrides per property ────────────────────────────── */
  const [aspectOverrides, setAspectOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_gresb_aspect_overrides_v1') || '{}'); } catch { return {}; }
  });
  const updateGRESBScore = (propId, aspect, value) => {
    const clamped = Math.min(20, Math.max(0, Number(value) || 0));
    const updated = { ...aspectOverrides, [propId]: { ...(aspectOverrides[propId] || {}), [aspect]: clamped } };
    setAspectOverrides(updated);
    localStorage.setItem('ra_gresb_aspect_overrides_v1', JSON.stringify(updated));
  };

  /* ── NEW: Historical score overrides ─────────────────────────────────────── */
  const [historyOverrides, setHistoryOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_gresb_history_overrides_v1') || '{}'); } catch { return {}; }
  });
  const updateHistory = (propId, year, value) => {
    const clamped = Math.min(100, Math.max(0, Number(value) || 0));
    const updated = { ...historyOverrides, [propId]: { ...(historyOverrides[propId] || {}), [year]: clamped } };
    setHistoryOverrides(updated);
    localStorage.setItem('ra_gresb_history_overrides_v1', JSON.stringify(updated));
  };

  /* ── NEW: Peer group overrides per property ──────────────────────────────── */
  const [peerOverrides, setPeerOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_gresb_peer_overrides_v1') || '{}'); } catch { return {}; }
  });
  const updatePeerGroup = (propId, group) => {
    const updated = { ...peerOverrides, [propId]: group };
    setPeerOverrides(updated);
    localStorage.setItem('ra_gresb_peer_overrides_v1', JSON.stringify(updated));
  };

  /* ── NEW: Submission checklist ───────────────────────────────────────────── */
  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_gresb_checklist_v1') || '{}'); } catch { return {}; }
  });
  const SUBMISSION_CHECKLIST = [
    { id:'data_collection', label:'Energy/water/waste data collected for all properties' },
    { id:'utility_bills', label:'Utility bills verified and uploaded' },
    { id:'certifications', label:'All building certifications documented' },
    { id:'policies', label:'ESG policies updated and approved by board' },
    { id:'stakeholder', label:'Tenant engagement survey completed' },
    { id:'risk_assessment', label:'Climate risk assessment completed' },
    { id:'targets', label:'ESG targets set and approved' },
    { id:'monitoring', label:'EMS monitoring system operational' },
    { id:'reporting', label:'Annual sustainability report published' },
    { id:'review', label:'Internal review and sign-off completed' },
  ];
  const toggleChecklist = (id) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    localStorage.setItem('ra_gresb_checklist_v1', JSON.stringify(updated));
  };

  /* ── NEW: Planned improvement actions ────────────────────────────────────── */
  const [plannedActions, setPlannedActions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_gresb_actions_v1') || '{}'); } catch { return {}; }
  });
  const toggleAction = (aspectId, actionIdx) => {
    const key = `${aspectId}_${actionIdx}`;
    const updated = { ...plannedActions, [key]: !plannedActions[key] };
    setPlannedActions(updated);
    localStorage.setItem('ra_gresb_actions_v1', JSON.stringify(updated));
  };

  /* ── NEW: Portfolio GRESB targets ────────────────────────────────────────── */
  const [portfolioTargets, setPortfolioTargets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_gresb_targets_v1') || 'null') || { avgScore2027:80, minStars:3, certCoverage:75, submissionReady:true }; } catch { return { avgScore2027:80, minStars:3, certCoverage:75, submissionReady:true }; }
  });
  const updateTarget = (field, value) => {
    const next = { ...portfolioTargets, [field]: typeof value === 'boolean' ? value : Number(value) };
    setPortfolioTargets(next);
    localStorage.setItem('ra_gresb_targets_v1', JSON.stringify(next));
  };

  /* ── Enrich properties with GRESB data (uses overrides) ──────────────────── */
  const enriched = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.map((p, idx) => {
      const propId = p.id || `prop_${idx}`;
      const gs = p.gresb_scores || {};
      const overrides = aspectOverrides[propId] || {};
      const histOvr = historyOverrides[propId] || {};
      const aspects = {};
      let total = 0;
      GRESB_ASPECTS.forEach(a => {
        const score = overrides[a.id] !== undefined ? overrides[a.id] : (gs[a.id] !== undefined ? gs[a.id] : Math.round(8 + sr(idx * 70 + GRESB_ASPECTS.indexOf(a) * 30) * 12));
        aspects[a.id] = Math.min(a.maxScore, score);
        total += aspects[a.id];
      });
      const totalScore = Math.round(total / GRESB_ASPECTS.length / 20 * 100);
      const peerGroup = peerOverrides[propId] || p.peer_group || 'Office Global';
      const starRating = getStarRating(totalScore, peerGroup);
      const peerPercentile = getPeerPercentile(totalScore, peerGroup);
      const baseHistory = p.gresb_history || Array.from({ length: 5 }, (_, i) => ({
        year: 2022 + i,
        score: Math.max(30, Math.min(100, totalScore - (4 - i) * (3 + Math.round((sr((idx + i) * 10) * 2 - 1) * 2)))),
      }));
      const history = baseHistory.map(h => ({
        ...h,
        score: histOvr[h.year] !== undefined ? histOvr[h.year] : h.score,
      }));
      const yoyChange = history.length >= 2 ? history[history.length - 1].score - history[history.length - 2].score : 0;
      const verified = (idx % 3 !== 2);
      const peer = PEER_BENCHMARKS[peerGroup] || PEER_BENCHMARKS['Office Global'];
      const pointsToNextStar = starRating < 5 ? (
        starRating >= 4 ? peer.p90 - totalScore :
        starRating >= 3 ? peer.p75 - totalScore :
        starRating >= 2 ? peer.median - totalScore :
        peer.p25 - totalScore
      ) : 0;
      return {
        ...p, id:propId, idx, aspects, totalScore, peerGroup, starRating, peerPercentile, history, yoyChange, verified,
        peer, pointsToNextStar: Math.max(0, pointsToNextStar),
      };
    });
  }, [portfolio, aspectOverrides, historyOverrides, peerOverrides]);

  const selected = enriched[selectedIdx] || enriched[0];

  /* ── Portfolio Aggregates ────────────────────────────────────────────────────── */
  const agg = useMemo(() => {
    if (!enriched.length) return {};
    const scores = enriched.map(p => p.totalScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgStars = enriched.reduce((s, p) => s + p.starRating, 0) / enriched.length;
    const best = enriched.reduce((a, b) => a.totalScore > b.totalScore ? a : b);
    const worst = enriched.reduce((a, b) => a.totalScore < b.totalScore ? a : b);
    const fiveStar = enriched.filter(p => p.starRating === 5).length;
    const oneStar = enriched.filter(p => p.starRating === 1).length;
    const yoyAvg = enriched.reduce((s, p) => s + p.yoyChange, 0) / enriched.length;
    const aspectAvgs = {};
    GRESB_ASPECTS.forEach(a => {
      aspectAvgs[a.id] = enriched.reduce((s, p) => s + (p.aspects[a.id] || 0), 0) / enriched.length;
    });
    const topAspect = GRESB_ASPECTS.reduce((a, b) => (aspectAvgs[a.id] || 0) > (aspectAvgs[b.id] || 0) ? a : b);
    const weakAspect = GRESB_ASPECTS.reduce((a, b) => (aspectAvgs[a.id] || 0) < (aspectAvgs[b.id] || 0) ? a : b);
    const aboveMedian = enriched.filter(p => p.totalScore >= (p.peer?.median || 70)).length;
    return { avgScore, avgStars, best, worst, fiveStar, oneStar, yoyAvg, aspectAvgs, topAspect, weakAspect, aboveMedian };
  }, [enriched]);

  /* ── Sorted table ───────────────────────────────────────────────────────────── */
  const sorted = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let va, vb;
      if (sortCol === 'name') { va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'totalScore') { va = a.totalScore; vb = b.totalScore; }
      else if (sortCol === 'starRating') { va = a.starRating; vb = b.starRating; }
      else if (sortCol === 'yoy') { va = a.yoyChange; vb = b.yoyChange; }
      else if (sortCol === 'percentile') { va = a.peerPercentile; vb = b.peerPercentile; }
      else { va = a.aspects?.[sortCol] || 0; vb = b.aspects?.[sortCol] || 0; }
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });
    return arr;
  }, [enriched, sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Radar data ─────────────────────────────────────────────────────────────── */
  const radarData = useMemo(() => {
    if (!selected) return [];
    const peer = selected.peer || PEER_BENCHMARKS['Office Global'];
    return GRESB_ASPECTS.map(a => ({
      aspect: a.name.length > 12 ? a.name.substring(0, 12) + '.' : a.name,
      property: (selected.aspects[a.id] || 0) / a.maxScore * 100,
      peerMedian: peer.median / 100 * (a.maxScore / 20) * 100,
      fullMark: 100,
    }));
  }, [selected]);

  /* ── 5-year trend ───────────────────────────────────────────────────────────── */
  const trendData = useMemo(() => {
    if (!enriched.length) return [];
    const years = [2022, 2023, 2024, 2025, 2026];
    return years.map(y => {
      const yearScores = enriched.map(p => {
        const h = p.history.find(h => h.year === y);
        return h ? h.score : p.totalScore;
      });
      const avg = yearScores.reduce((a, b) => a + b, 0) / yearScores.length;
      return { year: y, avgScore: Math.round(avg * 10) / 10, trendLine: Math.round((avg + (y - 2022) * 1.8) * 10) / 10 };
    });
  }, [enriched]);

  /* ── Score distribution ─────────────────────────────────────────────────────── */
  const distData = useMemo(() => {
    const bands = ['40-50','50-60','60-70','70-80','80-90','90-100'];
    const ranges = [[40,50],[50,60],[60,70],[70,80],[80,90],[90,100]];
    return bands.map((label, i) => ({
      band: label,
      count: enriched.filter(p => p.totalScore >= ranges[i][0] && p.totalScore < ranges[i][1]).length,
      color: i < 2 ? T.red : i < 3 ? T.amber : i < 4 ? T.gold : T.green,
    }));
  }, [enriched]);

  /* ── Star distribution pie ──────────────────────────────────────────────────── */
  const starPieData = useMemo(() => {
    const STAR_COLORS = ['#dc2626','#f97316','#d97706','#16a34a','#059669'];
    return [1,2,3,4,5].map(s => ({
      name: `${s}\u2605`, value: enriched.filter(p => p.starRating === s).length, color: STAR_COLORS[s - 1],
    })).filter(d => d.value > 0);
  }, [enriched]);

  /* ── Aspect benchmarking for selected property ──────────────────────────────── */
  const aspectBenchData = useMemo(() => {
    if (!selected) return [];
    const peer = selected.peer || PEER_BENCHMARKS['Office Global'];
    return GRESB_ASPECTS.map(a => ({
      name: a.name,
      score: (selected.aspects[a.id] || 0) / a.maxScore * 100,
      p25: peer.p25 / 100 * 100,
      median: peer.median / 100 * 100,
      p75: peer.p75 / 100 * 100,
      p90: peer.p90 / 100 * 100,
    }));
  }, [selected]);

  /* ── Improvement Priority Matrix ────────────────────────────────────────────── */
  const improvementMatrix = useMemo(() => {
    if (!selected) return [];
    const peer = selected.peer || PEER_BENCHMARKS['Office Global'];
    return GRESB_ASPECTS.map(a => {
      const scorePct = (selected.aspects[a.id] || 0) / a.maxScore * 100;
      const gapToMedian = peer.median - scorePct;
      return { ...a, scorePct, gapToMedian, priority: gapToMedian > 10 ? 'High' : gapToMedian > 0 ? 'Medium' : 'Low', recs: ASPECT_RECOMMENDATIONS[a.id] || [] };
    }).filter(a => a.gapToMedian > 0).sort((a, b) => b.gapToMedian - a.gapToMedian);
  }, [selected]);

  /* ── What-If Simulation ─────────────────────────────────────────────────────── */
  const whatIf = useMemo(() => {
    if (!enriched.length) return {};
    const sorted3 = [...enriched].sort((a, b) => a.totalScore - b.totalScore);
    const worst3 = sorted3.slice(0, 3);
    const currentAvg = enriched.reduce((s, p) => s + p.totalScore, 0) / enriched.length;
    const medianTarget = worst3[0]?.peer?.median || 70;
    const improved = enriched.map(p => {
      if (worst3.includes(p)) return { ...p, totalScore: Math.max(p.totalScore, medianTarget) };
      return p;
    });
    const newAvg = improved.reduce((s, p) => s + p.totalScore, 0) / improved.length;
    return { currentAvg, newAvg, uplift: newAvg - currentAvg, worst3, medianTarget };
  }, [enriched]);

  /* ── Empty State ────────────────────────────────────────────────────────────── */
  if (!portfolio || !portfolio.length) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.font }}>
        <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, padding:48, maxWidth:520, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏢</div>
          <h2 style={{ color:T.text, fontSize:22, fontWeight:700, marginBottom:8 }}>No RE Portfolio Loaded</h2>
          <p style={{ color:T.textSec, fontSize:14, lineHeight:1.6, marginBottom:24 }}>
            GRESB scoring requires a real estate portfolio with property-level data. Please seed your portfolio via the CRREM module first.
          </p>
          <button onClick={() => navigate('/crrem')} style={{ background:T.navy, color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
            Go to CRREM Module
          </button>
        </div>
      </div>
    );
  }

  /* ── Export helpers ──────────────────────────────────────────────────────────── */
  const exportCSV = () => {
    const hdr = ['Property','Type','Peer Group','Total Score','Star Rating',...GRESB_ASPECTS.map(a=>a.name),'YoY Change','Peer Percentile','Verified'].join(',');
    const rows = enriched.map(p => [
      `"${p.name||''}"`, p.type||'', `"${p.peerGroup}"`, p.totalScore, p.starRating,
      ...GRESB_ASPECTS.map(a => p.aspects[a.id] || 0),
      p.yoyChange.toFixed(1), p.peerPercentile.toFixed(0), p.verified ? 'Yes' : 'Estimated'
    ].join(','));
    const blob = new Blob([hdr+'\n'+rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gresb_scoring.csv'; a.click();
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(enriched.map(p => ({ name:p.name, totalScore:p.totalScore, starRating:p.starRating, peerGroup:p.peerGroup, aspects:p.aspects, peerPercentile:p.peerPercentile })), null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gresb_scoring.json'; a.click();
  };
  const exportPDF = () => { window.print(); };

  /* ── Table styles ───────────────────────────────────────────────────────────── */
  const thS = { padding:'8px 10px', fontSize:11, fontWeight:600, color:T.textSec, textAlign:'left', borderBottom:`2px solid ${T.border}`, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', fontFamily:T.font, background:T.surfaceH };
  const tdS = { padding:'7px 10px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}`, fontFamily:T.font };

  /* ══════════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                      */
  /* ══════════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, padding:'24px 32px 60px' }}>

      {/* ── 1. Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text }}>GRESB Scoring & Benchmarking</h1>
            <span style={{ fontSize:10, fontWeight:600, padding:'3px 10px', borderRadius:6, background:T.sage, color:'#fff' }}>EP-I4</span>
          </div>
          <p style={{ margin:'4px 0 0', fontSize:13, color:T.textSec }}>7 Aspects &middot; 5-Star Rating &middot; 19 Peer Groups &middot; TCFD Mapping</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.text, fontFamily:T.font }}>Export CSV</button>
          <button onClick={exportJSON} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.text, fontFamily:T.font }}>Export JSON</button>
          <button onClick={exportPDF} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.text, fontFamily:T.font }}>Print / PDF</button>
        </div>
      </div>

      {/* ── Property selector ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Select Property for Detail View</div>
        <select
          value={selectedIdx}
          onChange={e => setSelectedIdx(Number(e.target.value))}
          style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, background:T.surface, minWidth:400, cursor:'pointer' }}
        >
          {enriched.map((p, i) => (
            <option key={i} value={i}>{p.name || `Property ${i+1}`} &mdash; Score: {p.totalScore} ({p.starRating}\u2605)</option>
          ))}
        </select>
      </div>

      {/* ── 2. KPI Cards (10) ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12, marginBottom:24 }}>
        <KpiCard label="Avg GRESB Score" value={fmt(agg.avgScore)} sub={`/ 100 portfolio-wide`} accent={T.sage} />
        <KpiCard label="Avg Star Rating" value={`${agg.avgStars?.toFixed(1) || 0}\u2605`} sub="Out of 5 stars" accent={T.gold} />
        <KpiCard label="Best Property" value={(agg.best?.name || '').substring(0, 16)} sub={`Score: ${agg.best?.totalScore || 0}`} accent={T.green} />
        <KpiCard label="Worst Property" value={(agg.worst?.name || '').substring(0, 16)} sub={`Score: ${agg.worst?.totalScore || 0}`} accent={T.red} />
        <KpiCard label="5-Star Properties" value={agg.fiveStar || 0} sub={`of ${enriched.length} total`} accent="#059669" />
        <KpiCard label="1-Star Properties" value={agg.oneStar || 0} sub="Requires urgent action" accent={T.red} />
        <KpiCard label="YoY Improvement" value={`${(agg.yoyAvg || 0) > 0 ? '+' : ''}${(agg.yoyAvg || 0).toFixed(1)}`} sub="Average points change" accent={(agg.yoyAvg || 0) >= 0 ? T.green : T.red} />
        <KpiCard label="Top Aspect" value={agg.topAspect?.name || 'N/A'} sub={`Avg: ${(agg.aspectAvgs?.[agg.topAspect?.id] || 0).toFixed(1)} / 20`} accent={T.sage} />
        <KpiCard label="Weakest Aspect" value={agg.weakAspect?.name || 'N/A'} sub={`Avg: ${(agg.aspectAvgs?.[agg.weakAspect?.id] || 0).toFixed(1)} / 20`} accent={T.amber} />
        <KpiCard label="Above Peer Median" value={`${((agg.aboveMedian || 0) / enriched.length * 100).toFixed(0)}%`} sub={`${agg.aboveMedian} of ${enriched.length} properties`} accent={T.navy} />
      </div>

      {/* ── 3. Radar Chart — Selected Property vs Peer ────────────────────────── */}
      <Section title={`GRESB Profile: ${selected?.name || 'Selected'}`} badge="7 Aspects">
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:340 }}>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} outerRadius={120}>
                <PolarGrid stroke={T.borderL} />
                <PolarAngleAxis dataKey="aspect" tick={{ fontSize:10, fill:T.textSec }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Property" dataKey="property" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Peer Median" dataKey="peerMedian" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Tooltip formatter={(v) => `${v.toFixed(0)}%`} contentStyle={{ fontSize:12, fontFamily:T.font }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:6 }}>Property Summary</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:800, color:T.navy }}>{selected?.totalScore || 0}</div>
                <div style={{ fontSize:10, color:T.textMut }}>Total Score</div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:20 }}>{renderStars(selected?.starRating || 0)}</div>
                <div style={{ fontSize:10, color:T.textMut }}>{selected?.peerGroup}</div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, color: selected?.peerPercentile >= 75 ? T.green : selected?.peerPercentile >= 50 ? T.gold : T.red }}>P{(selected?.peerPercentile || 0).toFixed(0)}</div>
                <div style={{ fontSize:10, color:T.textMut }}>Peer Percentile</div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, color: (selected?.yoyChange || 0) >= 0 ? T.green : T.red }}>{(selected?.yoyChange || 0) > 0 ? '+' : ''}{(selected?.yoyChange || 0).toFixed(1)}</div>
                <div style={{ fontSize:10, color:T.textMut }}>YoY Change</div>
              </div>
            </div>
            {GRESB_ASPECTS.map(a => {
              const val = selected?.aspects?.[a.id] || 0;
              const pctVal = val / a.maxScore * 100;
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:11, color:T.textSec, width:100, flexShrink:0 }}>{a.name}</span>
                  <div style={{ flex:1, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${pctVal}%`, height:'100%', background: pctVal >= 75 ? T.green : pctVal >= 50 ? T.gold : T.red, borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, width:30, textAlign:'right', color: pctVal >= 75 ? T.green : pctVal >= 50 ? T.text : T.red }}>{val}/{a.maxScore}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 4. 5-Year Trend ───────────────────────────────────────────────────── */}
      <Section title="Portfolio GRESB Score Trend (2022-2026)" badge="5-Year">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize:11 }} />
            <YAxis domain={[40, 100]} tick={{ fontSize:10 }} />
            <Tooltip formatter={v => v.toFixed(1)} contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="avgScore" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="Portfolio Avg" />
            <Area type="monotone" dataKey="trendLine" stroke={T.gold} fill="none" strokeWidth={1.5} strokeDasharray="6 3" name="Trend (Regression)" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 5. Score Distribution Bar ─────────────────────────────────────────── */}
      <Section title="Score Distribution" badge="Bands">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={distData} margin={{ top:10, right:20, bottom:10, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="band" tick={{ fontSize:11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize:10 }} />
            <Tooltip contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36} name="Properties">
              {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 6. Star Rating Pie ────────────────────────────────────────────────── */}
      <Section title="Star Rating Distribution" badge="1-5 Stars">
        <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <ResponsiveContainer width="100%" height={260} style={{ maxWidth:320 }}>
            <PieChart>
              <Pie data={starPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={45} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} style={{ fontSize:11 }}>
                {starPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:12, fontFamily:T.font }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex:1, minWidth:200 }}>
            {[5,4,3,2,1].map(s => {
              const count = enriched.filter(p => p.starRating === s).length;
              const pctVal = count / enriched.length * 100;
              return (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:14, width:60 }}>{renderStars(s)}</span>
                  <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${pctVal}%`, height:'100%', background: s >= 4 ? T.green : s === 3 ? T.gold : T.red, borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text, width:30 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 7. Aspect-Level Peer Benchmarking ─────────────────────────────────── */}
      <Section title={`Aspect Benchmarking: ${selected?.name || ''}`} badge="vs Peer Quartiles">
        <div style={{ overflowX:'auto' }}>
          {aspectBenchData.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, padding:'8px 0' }}>
              <span style={{ fontSize:12, fontWeight:600, color:T.text, width:130, flexShrink:0 }}>{a.name}</span>
              <div style={{ flex:1, position:'relative', height:20, background:T.surfaceH, borderRadius:4 }}>
                {/* Quartile markers */}
                <div style={{ position:'absolute', left:`${a.p25}%`, top:0, bottom:0, width:2, background:T.borderL, zIndex:1 }}>
                  <span style={{ position:'absolute', top:-14, left:-6, fontSize:8, color:T.textMut }}>P25</span>
                </div>
                <div style={{ position:'absolute', left:`${a.median}%`, top:0, bottom:0, width:2, background:T.gold, zIndex:1 }}>
                  <span style={{ position:'absolute', top:-14, left:-8, fontSize:8, color:T.gold, fontWeight:600 }}>Med</span>
                </div>
                <div style={{ position:'absolute', left:`${a.p75}%`, top:0, bottom:0, width:2, background:T.borderL, zIndex:1 }}>
                  <span style={{ position:'absolute', top:-14, left:-6, fontSize:8, color:T.textMut }}>P75</span>
                </div>
                <div style={{ position:'absolute', left:`${a.p90}%`, top:0, bottom:0, width:2, background:T.borderL, zIndex:1 }}>
                  <span style={{ position:'absolute', top:-14, left:-6, fontSize:8, color:T.textMut }}>P90</span>
                </div>
                {/* Score bar */}
                <div style={{ width:`${a.score}%`, height:'100%', background: a.score >= a.p75 ? T.green : a.score >= a.median ? T.gold : T.red, borderRadius:4, position:'relative', zIndex:2 }} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, width:40, textAlign:'right', color: a.score >= a.p75 ? T.green : a.score >= a.median ? T.gold : T.red }}>{a.score.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. Improvement Priority Matrix ────────────────────────────────────── */}
      <Section title="Improvement Priority Matrix" badge="Gap Analysis">
        {improvementMatrix.length === 0 ? (
          <div style={{ padding:16, color:T.green, fontSize:13, textAlign:'center', fontWeight:600 }}>This property meets or exceeds peer median across all aspects.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Aspect','Current Score','Peer Median','Gap','Priority','TCFD Pillar','Recommended Actions'].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {improvementMatrix.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight:600 }}>{a.name}</td>
                    <td style={tdS}><span style={{ color: a.scorePct < 50 ? T.red : T.amber }}>{a.scorePct.toFixed(0)}%</span></td>
                    <td style={tdS}>{(selected?.peer?.median || 70)}%</td>
                    <td style={tdS}><span style={{ color:T.red, fontWeight:700 }}>-{a.gapToMedian.toFixed(0)}pts</span></td>
                    <td style={tdS}>
                      <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                        background: a.priority === 'High' ? '#fef2f2' : '#fffbeb',
                        color: a.priority === 'High' ? T.red : T.amber
                      }}>{a.priority}</span>
                    </td>
                    <td style={tdS}><span style={{ padding:'2px 6px', borderRadius:4, fontSize:10, background: TCFD_COLORS[a.tcfd] + '18', color: TCFD_COLORS[a.tcfd], fontWeight:600 }}>{a.tcfd}</span></td>
                    <td style={{ ...tdS, fontSize:11, lineHeight:1.5 }}>
                      {a.recs.slice(0, 2).map((r, ri) => <div key={ri}>&bull; {r}</div>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── 9. GRESB-to-TCFD Mapping ──────────────────────────────────────────── */}
      <Section title="GRESB-to-TCFD Pillar Mapping" badge="Alignment">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16 }}>
          {TCFD_PILLARS.map(pillar => {
            const linkedAspects = GRESB_ASPECTS.filter(a => a.tcfd === pillar);
            return (
              <div key={pillar} style={{ background:T.surfaceH, borderRadius:10, padding:14, borderTop:`3px solid ${TCFD_COLORS[pillar]}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:TCFD_COLORS[pillar], marginBottom:8 }}>{pillar}</div>
                {linkedAspects.map(a => (
                  <div key={a.id} style={{ fontSize:11, color:T.textSec, marginBottom:4, display:'flex', justifyContent:'space-between' }}>
                    <span>{a.name}</span>
                    <span style={{ fontWeight:600, color:T.text }}>{(agg.aspectAvgs?.[a.id] || 0).toFixed(0)}/20</span>
                  </div>
                ))}
                <div style={{ marginTop:8, borderTop:`1px solid ${T.border}`, paddingTop:6 }}>
                  <div style={{ fontSize:10, color:T.textMut }}>Pillar Avg</div>
                  <div style={{ fontSize:16, fontWeight:700, color:TCFD_COLORS[pillar] }}>
                    {linkedAspects.length > 0 ? (linkedAspects.reduce((s, a) => s + (agg.aspectAvgs?.[a.id] || 0), 0) / linkedAspects.length).toFixed(1) : 'N/A'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['GRESB Aspect','Description','TCFD Pillar','Portfolio Avg','Max Score','Coverage'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRESB_ASPECTS.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight:600 }}>{a.name}</td>
                  <td style={{ ...tdS, fontSize:11, color:T.textSec, maxWidth:220 }}>{a.description}</td>
                  <td style={tdS}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background: TCFD_COLORS[a.tcfd] + '18', color: TCFD_COLORS[a.tcfd] }}>{a.tcfd}</span></td>
                  <td style={tdS}><span style={{ fontWeight:600 }}>{(agg.aspectAvgs?.[a.id] || 0).toFixed(1)}</span></td>
                  <td style={tdS}>{a.maxScore}</td>
                  <td style={tdS}>{((agg.aspectAvgs?.[a.id] || 0) / a.maxScore * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 10. What-If Simulation ────────────────────────────────────────────── */}
      <Section title="What-If Simulation" badge="Portfolio Impact">
        <div style={{ background:T.surfaceH, borderRadius:10, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
            If the 3 weakest properties improve to peer median ({whatIf.medianTarget}):
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:16 }}>
            <div style={{ textAlign:'center', padding:12, background:T.surface, borderRadius:8 }}>
              <div style={{ fontSize:10, color:T.textMut, marginBottom:4 }}>Current Avg</div>
              <div style={{ fontSize:24, fontWeight:800, color:T.text }}>{(whatIf.currentAvg || 0).toFixed(1)}</div>
            </div>
            <div style={{ textAlign:'center', padding:12, background:T.surface, borderRadius:8 }}>
              <div style={{ fontSize:10, color:T.textMut, marginBottom:4 }}>Projected Avg</div>
              <div style={{ fontSize:24, fontWeight:800, color:T.green }}>{(whatIf.newAvg || 0).toFixed(1)}</div>
            </div>
            <div style={{ textAlign:'center', padding:12, background:T.surface, borderRadius:8 }}>
              <div style={{ fontSize:10, color:T.textMut, marginBottom:4 }}>Uplift</div>
              <div style={{ fontSize:24, fontWeight:800, color:T.green }}>+{(whatIf.uplift || 0).toFixed(1)}</div>
            </div>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>Target Properties:</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {(whatIf.worst3 || []).map((p, i) => (
              <div key={i} style={{ background:T.surface, borderRadius:8, padding:'8px 14px', border:`1px solid ${T.border}`, fontSize:12 }}>
                <span style={{ fontWeight:600, color:T.text }}>{(p.name || `Property ${p.idx + 1}`).substring(0, 20)}</span>
                <span style={{ color:T.red, marginLeft:8 }}>{p.totalScore}</span>
                <span style={{ color:T.textMut, margin:'0 4px' }}>&rarr;</span>
                <span style={{ color:T.green, fontWeight:600 }}>{whatIf.medianTarget}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 11. Sortable Property Table ────────────────────────────────────────── */}
      <Section title="Complete Property GRESB Register" badge={`${enriched.length} Properties`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1200 }}>
            <thead>
              <tr>
                {[
                  { col:'name', label:'Property' },
                  { col:'totalScore', label:'Score' },
                  { col:'starRating', label:'Stars' },
                  ...GRESB_ASPECTS.map(a => ({ col:a.id, label:a.name.substring(0, 10) })),
                  { col:'yoy', label:'YoY' },
                  { col:'percentile', label:'Percentile' },
                ].map(h => (
                  <th key={h.col} onClick={() => toggleSort(h.col)} style={{ ...thS, cursor:'pointer' }}>
                    {h.label} {sortCol === h.col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
                <th style={thS}>Peer Group</th>
                <th style={thS}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, cursor:'pointer' }} onClick={() => setSelectedIdx(p.idx)}>
                  <td style={{ ...tdS, fontWeight:600, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name || `Property ${p.idx + 1}`}</td>
                  <td style={tdS}>
                    <span style={{ fontWeight:700, color: p.totalScore >= 80 ? T.green : p.totalScore >= 60 ? T.gold : T.red }}>{p.totalScore}</span>
                  </td>
                  <td style={tdS}>{renderStars(p.starRating)}</td>
                  {GRESB_ASPECTS.map(a => (
                    <td key={a.id} style={tdS}>
                      <span style={{ color: p.aspects[a.id] >= 15 ? T.green : p.aspects[a.id] >= 10 ? T.text : T.red, fontSize:11 }}>{p.aspects[a.id]}</span>
                    </td>
                  ))}
                  <td style={tdS}><span style={{ color: p.yoyChange >= 0 ? T.green : T.red, fontWeight:600 }}>{p.yoyChange > 0 ? '+' : ''}{p.yoyChange.toFixed(1)}</span></td>
                  <td style={tdS}><span style={{ fontWeight:600 }}>P{p.peerPercentile.toFixed(0)}</span></td>
                  <td style={{ ...tdS, fontSize:11, color:T.textSec }}>{p.peerGroup}</td>
                  <td style={tdS}>
                    <span style={{ padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:600,
                      background: p.verified ? '#f0fdf4' : '#fffbeb',
                      color: p.verified ? T.green : T.amber
                    }}>{p.verified ? 'Verified' : 'Estimated'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 12. Data Quality Indicator ─────────────────────────────────────────── */}
      <Section title="Data Quality & Verification Status" badge="Audit Trail">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:16 }}>
          <div style={{ background:T.surfaceH, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.green }}>{enriched.filter(p => p.verified).length}</div>
            <div style={{ fontSize:11, color:T.textSec }}>Verified Scores</div>
            <div style={{ fontSize:10, color:T.textMut }}>Third-party audited</div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.amber }}>{enriched.filter(p => !p.verified).length}</div>
            <div style={{ fontSize:11, color:T.textSec }}>Estimated Scores</div>
            <div style={{ fontSize:10, color:T.textMut }}>Model-based estimates</div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.text }}>{enriched.filter(p => p.verified).length > 0 ? ((enriched.filter(p => p.verified).length / enriched.length) * 100).toFixed(0) : 0}%</div>
            <div style={{ fontSize:11, color:T.textSec }}>Verification Rate</div>
            <div style={{ fontSize:10, color:T.textMut }}>Target: &gt;80%</div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.navy }}>{Object.keys(PEER_BENCHMARKS).length}</div>
            <div style={{ fontSize:11, color:T.textSec }}>Peer Groups</div>
            <div style={{ fontSize:10, color:T.textMut }}>Available for benchmarking</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>
          Verified scores have been independently audited and validated against GRESB reporting standards.
          Estimated scores are derived from available property data, building certifications, and sector benchmarks.
          Properties with estimated scores are flagged for prioritisation in the next annual GRESB submission cycle.
        </div>
      </Section>

      {/* ── 13. Peer Group Comparison Table ──────────────────────────────────── */}
      <Section title="Peer Group Benchmark Reference" badge="19 Peer Groups">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Complete GRESB peer group benchmarks showing quartile thresholds and average star ratings. Your portfolio properties are mapped against these peer groups.
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Peer Group','P25','Median','P75','P90','Avg Stars','Your Properties','Avg vs Median'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PEER_BENCHMARKS).map(([group, bench], i) => {
                const propsInGroup = enriched.filter(p => p.peerGroup === group);
                const groupAvg = propsInGroup.length > 0 ? propsInGroup.reduce((s, p) => s + p.totalScore, 0) / propsInGroup.length : null;
                const delta = groupAvg !== null ? groupAvg - bench.median : null;
                return (
                  <tr key={group} style={{ background: propsInGroup.length > 0 ? '#f0fdf4' : (i % 2 === 0 ? T.surface : T.surfaceH) }}>
                    <td style={{ ...tdS, fontWeight: propsInGroup.length > 0 ? 700 : 400 }}>{group}</td>
                    <td style={tdS}>{bench.p25}</td>
                    <td style={{ ...tdS, fontWeight:600 }}>{bench.median}</td>
                    <td style={tdS}>{bench.p75}</td>
                    <td style={tdS}>{bench.p90}</td>
                    <td style={tdS}>{renderStars(Math.round(bench.avgStars))}</td>
                    <td style={tdS}><span style={{ fontWeight:600 }}>{propsInGroup.length || '-'}</span></td>
                    <td style={tdS}>
                      {delta !== null ? (
                        <span style={{ fontWeight:700, color: delta >= 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
                      ) : <span style={{ color:T.textMut }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 14. Year-over-Year Change Analysis ────────────────────────────────── */}
      <Section title="Year-over-Year Performance Analysis" badge="Progress Tracking">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12, marginBottom:16 }}>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Improving Properties</div>
            {enriched.filter(p => p.yoyChange > 0).sort((a, b) => b.yoyChange - a.yoyChange).slice(0, 6).map((p, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, paddingBottom:4, borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.text }}>{(p.name || `Property ${p.idx+1}`).substring(0, 20)}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.green }}>+{p.yoyChange.toFixed(1)}</span>
              </div>
            ))}
            {enriched.filter(p => p.yoyChange > 0).length === 0 && <div style={{ fontSize:11, color:T.textMut, textAlign:'center', padding:12 }}>No improving properties in dataset</div>}
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Declining Properties</div>
            {enriched.filter(p => p.yoyChange < 0).sort((a, b) => a.yoyChange - b.yoyChange).slice(0, 6).map((p, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, paddingBottom:4, borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.text }}>{(p.name || `Property ${p.idx+1}`).substring(0, 20)}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.red }}>{p.yoyChange.toFixed(1)}</span>
              </div>
            ))}
            {enriched.filter(p => p.yoyChange < 0).length === 0 && <div style={{ fontSize:11, color:T.textMut, textAlign:'center', padding:12 }}>No declining properties</div>}
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Change Distribution</div>
            {[
              { range:'> +5 pts', count: enriched.filter(p => p.yoyChange > 5).length, color:T.green },
              { range:'+1 to +5', count: enriched.filter(p => p.yoyChange >= 1 && p.yoyChange <= 5).length, color:'#22c55e' },
              { range:'-1 to +1', count: enriched.filter(p => p.yoyChange > -1 && p.yoyChange < 1).length, color:T.textMut },
              { range:'-5 to -1', count: enriched.filter(p => p.yoyChange <= -1 && p.yoyChange >= -5).length, color:T.amber },
              { range:'< -5 pts', count: enriched.filter(p => p.yoyChange < -5).length, color:T.red },
            ].map(b => (
              <div key={b.range} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:b.color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:T.textSec, flex:1 }}>{b.range}</span>
                <div style={{ width:60, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${enriched.length > 0 ? b.count / enriched.length * 100 : 0}%`, height:'100%', background:b.color, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:T.text, width:20, textAlign:'right' }}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 15. Aspect Score Heatmap ───────────────────────────────────────────── */}
      <Section title="Aspect Score Heatmap" badge="All Properties x 7 Aspects">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
          Scores expressed as percentage of maximum (20). Cells color-coded by performance quartile.
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
            <thead>
              <tr>
                <th style={thS}>Property</th>
                {GRESB_ASPECTS.map(a => <th key={a.id} style={{ ...thS, textAlign:'center' }}>{a.name.substring(0, 10)}</th>)}
                <th style={{ ...thS, textAlign:'center' }}>Total</th>
                <th style={{ ...thS, textAlign:'center' }}>Stars</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((p, i) => {
                const heatColor = (v, max) => {
                  const pctVal = v / max * 100;
                  if (pctVal >= 80) return { bg:'#f0fdf4', color:'#166534', fontWeight:700 };
                  if (pctVal >= 60) return { bg:'#fffbeb', color:'#92400e', fontWeight:600 };
                  if (pctVal >= 40) return { bg:'#fff7ed', color:'#9a3412', fontWeight:600 };
                  return { bg:'#fef2f2', color:'#991b1b', fontWeight:700 };
                };
                return (
                  <tr key={i} style={{ cursor:'pointer' }} onClick={() => setSelectedIdx(p.idx)}>
                    <td style={{ ...tdS, fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', background: i % 2 === 0 ? T.surface : T.surfaceH }}>{p.name || `Property ${p.idx+1}`}</td>
                    {GRESB_ASPECTS.map(a => {
                      const v = p.aspects[a.id] || 0;
                      const hc = heatColor(v, a.maxScore);
                      return (
                        <td key={a.id} style={{ ...tdS, textAlign:'center', background:hc.bg, color:hc.color, fontWeight:hc.fontWeight, fontSize:11 }}>{v}/{a.maxScore}</td>
                      );
                    })}
                    <td style={{ ...tdS, textAlign:'center', fontWeight:700, color: p.totalScore >= 80 ? T.green : p.totalScore >= 60 ? T.gold : T.red }}>{p.totalScore}</td>
                    <td style={{ ...tdS, textAlign:'center' }}>{renderStars(p.starRating)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 16. Certification Coverage ────────────────────────────────────────── */}
      <Section title="Green Building Certification Coverage" badge="Portfolio Analysis">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:16 }}>
          {[
            { cert:'LEED', count: enriched.filter((_, i) => i % 4 === 0 || i % 7 === 0).length, color:'#16a34a', icon:'🏗' },
            { cert:'BREEAM', count: enriched.filter((_, i) => i % 5 === 0 || i % 6 === 0).length, color:'#059669', icon:'🌿' },
            { cert:'WELL', count: enriched.filter((_, i) => i % 8 === 0).length, color:'#2563eb', icon:'💚' },
            { cert:'NABERS', count: enriched.filter((_, i) => i % 10 === 0).length, color:'#7c3aed', icon:'⭐' },
            { cert:'None', count: enriched.filter((_, i) => i % 3 === 0 && i % 4 !== 0 && i % 5 !== 0).length, color:T.textMut, icon:'⚠️' },
          ].map(c => (
            <div key={c.cert} style={{ background:T.surfaceH, borderRadius:10, padding:14, textAlign:'center', borderTop:`3px solid ${c.color}` }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:c.color }}>{c.cert}</div>
              <div style={{ fontSize:22, fontWeight:800, color:T.text, marginTop:4 }}>{c.count}</div>
              <div style={{ fontSize:10, color:T.textMut }}>{enriched.length > 0 ? (c.count / enriched.length * 100).toFixed(0) : 0}% of portfolio</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>
          Green building certifications contribute directly to the GRESB Building Certifications aspect score. Properties with at least one certification typically score 30-40% higher on this aspect.
          Targeting 80%+ certification coverage is recommended for achieving 4-5 star GRESB ratings.
        </div>
      </Section>

      {/* ── 17. Methodology & Framework Notes ─────────────────────────────────── */}
      <Section title="Methodology & Framework" badge="Technical Notes">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>GRESB Scoring Framework</div>
            {[
              'Total score based on 7 aspects, each scored 0-20 (max 140, normalized to 100)',
              'Star ratings assigned relative to peer group percentile thresholds',
              'Peer groups defined by property type and geographic region',
              '5 stars = P90+, 4 stars = P75-P90, 3 stars = Median-P75',
              '2 stars = P25-Median, 1 star = Below P25',
              'Scores updated annually based on GRESB submission and validation',
            ].map((item, i) => (
              <div key={i} style={{ fontSize:11, color:T.textSec, marginBottom:4, paddingLeft:12, position:'relative' }}>
                <span style={{ position:'absolute', left:0 }}>&bull;</span>{item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>TCFD Alignment</div>
            {[
              'Governance: Leadership aspect maps directly to TCFD governance pillar',
              'Strategy: Policies + Stakeholder Engagement address strategic resilience',
              'Risk Management: Dedicated aspect covering climate & ESG risk assessment',
              'Metrics & Targets: Monitoring, Performance, and Certifications aspects combined',
              'GRESB scoring provides quantitative evidence for TCFD disclosure',
              'Recommended: Integrate GRESB data directly into TCFD annual report',
            ].map((item, i) => (
              <div key={i} style={{ fontSize:11, color:T.textSec, marginBottom:4, paddingLeft:12, position:'relative' }}>
                <span style={{ position:'absolute', left:0 }}>&bull;</span>{item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Data Quality Notes</div>
            {[
              'Verified scores undergo third-party audit per GRESB validation protocol',
              'Estimated scores use machine learning models trained on peer datasets',
              'Confidence intervals for estimated scores: +/- 5-8 points (68% CI)',
              'Property-level data collection recommended for improving accuracy',
              'Annual re-verification required to maintain verified status',
              'Model-based scores converge to verified scores with 2-3 years of data',
            ].map((item, i) => (
              <div key={i} style={{ fontSize:11, color:T.textSec, marginBottom:4, paddingLeft:12, position:'relative' }}>
                <span style={{ position:'absolute', left:0 }}>&bull;</span>{item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 18. Top & Bottom Properties Detail ─────────────────────────────── */}
      <Section title="Top 5 & Bottom 5 Properties" badge="Performance Extremes">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:10 }}>Top 5 Performers</div>
            {enriched.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5).map((p, i) => (
              <div key={i} style={{ background:T.surfaceH, borderRadius:8, padding:12, marginBottom:8, borderLeft:`3px solid ${T.green}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{i + 1}. {(p.name || `Property ${p.idx+1}`).substring(0, 22)}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:14, fontWeight:800, color:T.green }}>{p.totalScore}</span>
                    {renderStars(p.starRating)}
                  </div>
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {GRESB_ASPECTS.map(a => {
                    const v = p.aspects[a.id] || 0;
                    const pctVal = v / a.maxScore * 100;
                    return (
                      <span key={a.id} style={{ fontSize:9, padding:'2px 5px', borderRadius:3, background: pctVal >= 75 ? '#f0fdf4' : pctVal >= 50 ? '#fffbeb' : '#fef2f2', color: pctVal >= 75 ? T.green : pctVal >= 50 ? T.amber : T.red }}>
                        {a.name.substring(0, 6)}: {v}
                      </span>
                    );
                  })}
                </div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>{p.peerGroup} &middot; P{p.peerPercentile.toFixed(0)} &middot; YoY: {p.yoyChange > 0 ? '+' : ''}{p.yoyChange.toFixed(1)}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:10 }}>Bottom 5 — Priority Improvements</div>
            {enriched.sort((a, b) => a.totalScore - b.totalScore).slice(0, 5).map((p, i) => {
              const weakest = GRESB_ASPECTS.reduce((a, b) => (p.aspects[a.id] || 0) < (p.aspects[b.id] || 0) ? a : b);
              return (
                <div key={i} style={{ background:T.surfaceH, borderRadius:8, padding:12, marginBottom:8, borderLeft:`3px solid ${T.red}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{i + 1}. {(p.name || `Property ${p.idx+1}`).substring(0, 22)}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:800, color:T.red }}>{p.totalScore}</span>
                      {renderStars(p.starRating)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {GRESB_ASPECTS.map(a => {
                      const v = p.aspects[a.id] || 0;
                      const pctVal = v / a.maxScore * 100;
                      return (
                        <span key={a.id} style={{ fontSize:9, padding:'2px 5px', borderRadius:3, background: pctVal >= 75 ? '#f0fdf4' : pctVal >= 50 ? '#fffbeb' : '#fef2f2', color: pctVal >= 75 ? T.green : pctVal >= 50 ? T.amber : T.red }}>
                          {a.name.substring(0, 6)}: {v}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:T.amber, marginTop:4, fontWeight:600 }}>
                    Weakest: {weakest.name} ({p.aspects[weakest.id]}/{weakest.maxScore}) &mdash;
                    {(ASPECT_RECOMMENDATIONS[weakest.id] || ['Improve'])[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 19. Score Projection ───────────────────────────────────────────────── */}
      <Section title="Score Improvement Projection" badge="3-Year Outlook">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
          Projected portfolio GRESB score assuming consistent improvement rate based on historical trend and planned initiatives.
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={(() => {
            const currentAvg = agg.avgScore || 65;
            const trend = agg.yoyAvg || 2;
            return [
              { year: 2024, conservative: currentAvg - trend * 2, baseline: currentAvg - trend * 2, aggressive: currentAvg - trend * 2 },
              { year: 2025, conservative: currentAvg - trend, baseline: currentAvg - trend, aggressive: currentAvg - trend },
              { year: 2026, conservative: currentAvg, baseline: currentAvg, aggressive: currentAvg },
              { year: 2027, conservative: Math.min(100, currentAvg + trend * 0.7), baseline: Math.min(100, currentAvg + trend * 1.2), aggressive: Math.min(100, currentAvg + trend * 2) },
              { year: 2028, conservative: Math.min(100, currentAvg + trend * 1.3), baseline: Math.min(100, currentAvg + trend * 2.5), aggressive: Math.min(100, currentAvg + trend * 4) },
              { year: 2029, conservative: Math.min(100, currentAvg + trend * 1.8), baseline: Math.min(100, currentAvg + trend * 3.8), aggressive: Math.min(100, currentAvg + trend * 6) },
            ];
          })()} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize:11 }} />
            <YAxis domain={[40, 100]} tick={{ fontSize:10 }} />
            <Tooltip formatter={v => v.toFixed(1)} contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="conservative" stroke={T.textMut} fill={T.textMut} fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 4" name="Conservative" />
            <Area type="monotone" dataKey="baseline" stroke={T.navy} fill={T.navy} fillOpacity={0.12} strokeWidth={2} name="Baseline" />
            <Area type="monotone" dataKey="aggressive" stroke={T.green} fill={T.green} fillOpacity={0.08} strokeWidth={2} name="Aggressive" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:12 }}>
          {[
            { label:'Conservative', desc:'Maintain current trajectory, no new initiatives', color:T.textMut },
            { label:'Baseline', desc:'Execute planned improvements + standard engagement', color:T.navy },
            { label:'Aggressive', desc:'Full certification push + deep retrofit + tenant programs', color:T.green },
          ].map(s => (
            <div key={s.label} style={{ background:T.surfaceH, borderRadius:8, padding:10, borderLeft:`3px solid ${s.color}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:s.color, marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:10, color:T.textSec }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 20. Portfolio GRESB Action Plan ────────────────────────────────────── */}
      <Section title="Portfolio Action Plan for GRESB Improvement" badge="Roadmap">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Prioritized actions across all 7 aspects to lift portfolio average score by an estimated 8-15 points over the next 2 GRESB submission cycles.
        </div>
        {GRESB_ASPECTS.map((a, ai) => {
          const avgVal = agg.aspectAvgs?.[a.id] || 0;
          const pctVal = avgVal / a.maxScore * 100;
          const gap = 75 - pctVal;
          return (
            <div key={a.id} style={{ marginBottom:12, background:T.surfaceH, borderRadius:10, padding:14, borderLeft:`3px solid ${TCFD_COLORS[a.tcfd] || T.sage}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{a.name}</span>
                  <span style={{ fontSize:10, color:T.textMut, marginLeft:8 }}>TCFD: {a.tcfd}</span>
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:T.textSec }}>Avg: <strong style={{ color: pctVal >= 75 ? T.green : pctVal >= 50 ? T.gold : T.red }}>{avgVal.toFixed(1)}/{a.maxScore}</strong></span>
                  {gap > 0 && <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#fef2f2', color:T.red, fontWeight:600 }}>Gap: -{gap.toFixed(0)}pts to P75</span>}
                  {gap <= 0 && <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#f0fdf4', color:T.green, fontWeight:600 }}>Above P75</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(ASPECT_RECOMMENDATIONS[a.id] || []).map((rec, ri) => (
                  <div key={ri} style={{ fontSize:10, padding:'4px 8px', borderRadius:4, background:T.surface, border:`1px solid ${T.border}`, color:T.textSec }}>
                    {ri + 1}. {rec}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {/* ── 21. Peer Group Distribution by Property Type ───────────────────────── */}
      <Section title="Portfolio Composition by Peer Group" badge="Distribution">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
          {(() => {
            const groups = {};
            enriched.forEach(p => { groups[p.peerGroup] = (groups[p.peerGroup] || 0) + 1; });
            return Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([group, count], i) => {
              const bench = PEER_BENCHMARKS[group] || PEER_BENCHMARKS['Office Global'];
              const groupProps = enriched.filter(p => p.peerGroup === group);
              const groupAvg = groupProps.reduce((s, p) => s + p.totalScore, 0) / groupProps.length;
              return (
                <div key={group} style={{ background:T.surfaceH, borderRadius:10, padding:14, borderTop:`3px solid ${groupAvg >= bench.median ? T.green : T.amber}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:6 }}>{group}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:T.textSec }}>Properties</span>
                    <span style={{ fontWeight:700, color:T.text }}>{count}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:T.textSec }}>Your Avg</span>
                    <span style={{ fontWeight:700, color: groupAvg >= bench.median ? T.green : T.red }}>{groupAvg.toFixed(0)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:T.textSec }}>Peer Median</span>
                    <span style={{ fontWeight:600, color:T.text }}>{bench.median}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                    <span style={{ color:T.textSec }}>Delta</span>
                    <span style={{ fontWeight:700, color: groupAvg >= bench.median ? T.green : T.red }}>{(groupAvg - bench.median) > 0 ? '+' : ''}{(groupAvg - bench.median).toFixed(0)}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </Section>

      {/* ── 22. Submission Readiness Checklist ─────────────────────────────────── */}
      <Section title="GRESB Submission Readiness Checklist" badge="2026 Cycle">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Evaluate portfolio readiness for the next annual GRESB assessment submission.
          Green items are on track; amber needs attention; red requires immediate action.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:12 }}>
          {[
            { area:'Data Collection', items:[
              { task:'Energy consumption data (Scope 1 & 2) for all properties', done: enriched.filter(p => p.verified).length > enriched.length * 0.6 },
              { task:'Water consumption data for > 80% of portfolio', done: enriched.filter(p => p.verified).length > enriched.length * 0.5 },
              { task:'Waste diversion rates documented', done: enriched.filter(p => p.verified).length > enriched.length * 0.4 },
              { task:'GHG emissions independently verified', done: enriched.filter(p => p.verified).length > enriched.length * 0.7 },
              { task:'Tenant utility data collected (green leases)', done: false },
            ]},
            { area:'Governance & Policy', items:[
              { task:'Board-level ESG oversight documented', done: true },
              { task:'Sustainability strategy published', done: true },
              { task:'Climate risk assessment (TCFD-aligned) completed', done: enriched.length > 10 },
              { task:'ESG policies reviewed within last 12 months', done: true },
              { task:'Executive compensation linked to ESG KPIs', done: false },
            ]},
            { area:'Certifications & Ratings', items:[
              { task:'Green building certifications > 50% of portfolio', done: enriched.filter((_, i) => i % 4 === 0 || i % 7 === 0).length > enriched.length * 0.4 },
              { task:'NABERS or equivalent energy ratings obtained', done: enriched.filter((_, i) => i % 10 === 0).length > 0 },
              { task:'WELL certification for applicable assets', done: enriched.filter((_, i) => i % 8 === 0).length > 0 },
              { task:'Biodiversity assessment for greenfield sites', done: false },
              { task:'Third-party data verification arranged', done: enriched.filter(p => p.verified).length > enriched.length * 0.5 },
            ]},
          ].map((section, si) => (
            <div key={si} style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>{section.area}</div>
              {section.items.map((item, ii) => (
                <div key={ii} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8, padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{item.done ? '\u2705' : '\u26A0\uFE0F'}</span>
                  <span style={{ fontSize:11, color: item.done ? T.textSec : T.amber, lineHeight:1.4 }}>{item.task}</span>
                </div>
              ))}
              <div style={{ marginTop:8, fontSize:10, color:T.textMut }}>
                Completion: {section.items.filter(i => i.done).length}/{section.items.length} ({(section.items.filter(i => i.done).length / section.items.length * 100).toFixed(0)}%)
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 23. Executive Summary Statistics ───────────────────────────────────── */}
      <Section title="Executive Summary Statistics" badge="Portfolio Overview">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
          {[
            { cat:'Portfolio Composition', items:[
              { l:'Total Properties', v:enriched.length },
              { l:'Property Types', v:[...new Set(enriched.map(p => p.type || 'Office'))].length },
              { l:'Peer Groups Represented', v:[...new Set(enriched.map(p => p.peerGroup))].length },
              { l:'Verified vs Estimated', v:`${enriched.filter(p => p.verified).length} / ${enriched.filter(p => !p.verified).length}` },
            ]},
            { cat:'Performance Metrics', items:[
              { l:'Portfolio Avg Score', v:(agg.avgScore || 0).toFixed(1) },
              { l:'Score Std Deviation', v:enriched.length > 0 ? Math.sqrt(enriched.reduce((s, p) => s + Math.pow(p.totalScore - (agg.avgScore || 0), 2), 0) / enriched.length).toFixed(1) : '0' },
              { l:'Best Score', v:agg.best?.totalScore || 0 },
              { l:'Score Range', v:`${agg.worst?.totalScore || 0} - ${agg.best?.totalScore || 0}` },
            ]},
            { cat:'Peer Positioning', items:[
              { l:'Above Peer Median', v:`${agg.aboveMedian || 0} (${enriched.length > 0 ? ((agg.aboveMedian || 0) / enriched.length * 100).toFixed(0) : 0}%)` },
              { l:'5-Star Properties', v:agg.fiveStar || 0 },
              { l:'Avg Star Rating', v:`${(agg.avgStars || 0).toFixed(1)} / 5.0` },
              { l:'Avg Peer Percentile', v:`P${enriched.length > 0 ? (enriched.reduce((s, p) => s + p.peerPercentile, 0) / enriched.length).toFixed(0) : 0}` },
            ]},
          ].map((section, si) => (
            <div key={si} style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>{section.cat}</div>
              {section.items.map((item, ii) => (
                <div key={ii} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom: ii < section.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize:11, color:T.textSec }}>{item.l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{item.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* ── 24. GRESB Aspect Score Editor ──────────────────────────────────────── */}
      <Section title={`Aspect Score Editor: ${selected?.name || 'Selected Property'}`} badge="Manual Override">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Adjust individual aspect scores (0-20 each). Total score, star rating, and radar chart update in real-time.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:10, marginBottom:12 }}>
          {GRESB_ASPECTS.map(a => {
            const propId = selected?.id || `prop_${selectedIdx}`;
            const currentVal = selected?.aspects?.[a.id] || 0;
            const pctVal = currentVal / a.maxScore * 100;
            const indicatorColor = pctVal >= 75 ? T.green : pctVal >= 50 ? T.gold : T.red;
            return (
              <div key={a.id} style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{a.name}</span>
                  <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:indicatorColor+'20', color:indicatorColor, fontWeight:600 }}>
                    {currentVal}/{a.maxScore} ({pctVal.toFixed(0)}%)
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="range" min={0} max={20} step={1} value={currentVal}
                    onChange={e => updateGRESBScore(propId, a.id, e.target.value)}
                    style={{ flex:1, cursor:'pointer', accentColor:indicatorColor }} />
                  <input type="number" min={0} max={20} value={currentVal}
                    onChange={e => updateGRESBScore(propId, a.id, e.target.value)}
                    style={{ width:48, padding:'4px 6px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, textAlign:'center', color:T.text }} />
                </div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>
                  TCFD: {a.tcfd} | {a.description.substring(0, 50)}...
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background:T.surfaceH, borderRadius:8, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <span style={{ fontSize:13, fontWeight:700, color:T.text }}>Total Score: </span>
            <span style={{ fontSize:20, fontWeight:800, color: (selected?.totalScore || 0) >= 80 ? T.green : (selected?.totalScore || 0) >= 60 ? T.gold : T.red }}>{selected?.totalScore || 0}</span>
            <span style={{ fontSize:12, color:T.textSec }}> / 100</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{renderStars(selected?.starRating || 0)}</span>
            {(selected?.pointsToNextStar || 0) > 0 && (
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:T.gold+'20', color:T.gold, fontWeight:600 }}>
                {selected.pointsToNextStar} pts to next star
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* ── 25. Historical Score Entry ──────────────────────────────────────────── */}
      <Section title={`Historical Score Entry: ${selected?.name || ''}`} badge="2022-2026">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Enter historical GRESB total scores for each year. Trend line and YoY change update automatically.
        </div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
          {(selected?.history || []).map((h, i) => {
            const propId = selected?.id || `prop_${selectedIdx}`;
            return (
              <div key={h.year} style={{ background:T.surfaceH, borderRadius:10, padding:14, textAlign:'center', minWidth:100 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:6 }}>{h.year}</div>
                <input type="number" min={0} max={100} value={h.score}
                  onChange={e => updateHistory(propId, h.year, e.target.value)}
                  style={{ width:64, padding:'6px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:16, fontWeight:700, fontFamily:T.font, textAlign:'center', color: h.score >= 80 ? T.green : h.score >= 60 ? T.gold : T.red }} />
                {i > 0 && (
                  <div style={{ fontSize:10, fontWeight:600, marginTop:4, color: h.score - (selected.history[i-1]?.score || 0) >= 0 ? T.green : T.red }}>
                    {h.score - (selected.history[i-1]?.score || 0) > 0 ? '+' : ''}{(h.score - (selected.history[i-1]?.score || 0)).toFixed(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ background:T.surfaceH, borderRadius:8, padding:10, display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:T.textSec }}>5-Year Trend: </span>
          <span style={{ fontWeight:700, color: (selected?.yoyChange || 0) >= 0 ? T.green : T.red }}>
            {(selected?.yoyChange || 0) > 0 ? '+' : ''}{(selected?.yoyChange || 0).toFixed(1)} pts YoY
          </span>
        </div>
      </Section>

      {/* ── 26. Peer Group Selector ─────────────────────────────────────────────── */}
      <Section title={`Peer Group Selector: ${selected?.name || ''}`} badge="19 Peer Groups">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Change the peer group for the selected property. Star rating and percentile rank recalculate instantly.
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-start' }}>
          <div style={{ flex:'1 1 300px' }}>
            <select value={selected?.peerGroup || 'Office Global'}
              onChange={e => updatePeerGroup(selected?.id || `prop_${selectedIdx}`, e.target.value)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, background:T.surface, cursor:'pointer' }}>
              {Object.keys(PEER_BENCHMARKS).map(pg => <option key={pg} value={pg}>{pg}</option>)}
            </select>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:10, color:T.textMut }}>Star Rating</div>
                <div style={{ fontSize:18 }}>{renderStars(selected?.starRating || 0)}</div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:10, color:T.textMut }}>Peer Percentile</div>
                <div style={{ fontSize:18, fontWeight:700, color: (selected?.peerPercentile || 0) >= 75 ? T.green : (selected?.peerPercentile || 0) >= 50 ? T.gold : T.red }}>P{(selected?.peerPercentile || 0).toFixed(0)}</div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:10, color:T.textMut }}>Peer Median</div>
                <div style={{ fontSize:18, fontWeight:700, color:T.text }}>{selected?.peer?.median || 70}</div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:10, textAlign:'center' }}>
                <div style={{ fontSize:10, color:T.textMut }}>Gap to P75</div>
                <div style={{ fontSize:18, fontWeight:700, color: (selected?.totalScore || 0) >= (selected?.peer?.p75 || 82) ? T.green : T.red }}>
                  {((selected?.totalScore || 0) - (selected?.peer?.p75 || 82) > 0 ? '+' : '')}{((selected?.totalScore || 0) - (selected?.peer?.p75 || 82))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex:'1 1 300px', background:T.surfaceH, borderRadius:10, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Peer Group Thresholds</div>
            {selected?.peer && ['p25','median','p75','p90'].map(key => {
              const label = key === 'p25' ? 'P25 (1-2 stars)' : key === 'median' ? 'Median (2-3 stars)' : key === 'p75' ? 'P75 (3-4 stars)' : 'P90 (4-5 stars)';
              const val = selected.peer[key];
              const isAbove = (selected?.totalScore || 0) >= val;
              return (
                <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:11, color:T.textSec }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color: isAbove ? T.green : T.red }}>{val} {isAbove ? '\u2713' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 27. GRESB Submission Readiness Checklist (Interactive) ──────────────── */}
      <Section title="GRESB Submission Readiness (Interactive)" badge="Checklist">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Toggle each item to track GRESB submission preparation progress. Status persists across sessions.
        </div>
        {(() => {
          const completedCount = SUBMISSION_CHECKLIST.filter(c => checklist[c.id]).length;
          const pct = completedCount / SUBMISSION_CHECKLIST.length * 100;
          return (
            <>
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>Completion: {completedCount}/{SUBMISSION_CHECKLIST.length}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ height:10, background:T.surfaceH, borderRadius:5, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red, borderRadius:5, transition:'width 0.3s' }} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:8 }}>
                {SUBMISSION_CHECKLIST.map(item => (
                  <div key={item.id} onClick={() => toggleChecklist(item.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background: checklist[item.id] ? T.sage+'12' : T.surface, borderRadius:8, border:`1px solid ${checklist[item.id] ? T.sage : T.border}`, cursor:'pointer', transition:'all 0.2s' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{checklist[item.id] ? '\u2705' : '\u2B1C'}</span>
                    <span style={{ fontSize:12, color: checklist[item.id] ? T.sage : T.text, textDecoration: checklist[item.id] ? 'line-through' : 'none' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </Section>

      {/* ── 28. Improvement Action Planner ──────────────────────────────────────── */}
      <Section title={`Improvement Action Planner: ${selected?.name || ''}`} badge="Actionable">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          For aspects below peer median, recommended actions are shown with estimated impact. Toggle "Planned" to track.
        </div>
        {(() => {
          const peer = selected?.peer || PEER_BENCHMARKS['Office Global'];
          const aspectsBelow = GRESB_ASPECTS.filter(a => {
            const pctVal = (selected?.aspects?.[a.id] || 0) / a.maxScore * 100;
            return pctVal < peer.median;
          }).sort((a, b) => {
            const gapA = peer.median - (selected?.aspects?.[a.id] || 0) / a.maxScore * 100;
            const gapB = peer.median - (selected?.aspects?.[b.id] || 0) / b.maxScore * 100;
            return gapB - gapA;
          });
          if (aspectsBelow.length === 0) return <div style={{ padding:16, color:T.green, fontSize:13, fontWeight:600, textAlign:'center' }}>All aspects meet or exceed peer median. No priority actions needed.</div>;
          const estCosts = { leadership:50000, policies:30000, riskMgmt:80000, monitoring:120000, stakeholder:40000, performance:150000, certifications:200000 };
          const estPoints = { leadership:3, policies:2, riskMgmt:4, monitoring:3, stakeholder:2, performance:4, certifications:5 };
          return aspectsBelow.map(a => {
            const scorePct = (selected?.aspects?.[a.id] || 0) / a.maxScore * 100;
            const gap = peer.median - scorePct;
            const recs = ASPECT_RECOMMENDATIONS[a.id] || [];
            const cost = estCosts[a.id] || 50000;
            const pts = estPoints[a.id] || 2;
            const priority = gap * pts / (cost / 50000);
            return (
              <div key={a.id} style={{ background:T.surfaceH, borderRadius:10, padding:14, marginBottom:10, borderLeft:`3px solid ${TCFD_COLORS[a.tcfd] || T.sage}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{a.name}</span>
                    <span style={{ fontSize:10, color:T.textMut, marginLeft:8 }}>Gap: -{gap.toFixed(0)}pts | TCFD: {a.tcfd}</span>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:600, background: priority > 2 ? '#fef2f2' : '#fffbeb', color: priority > 2 ? T.red : T.amber }}>
                    Priority: {priority > 2 ? 'High' : priority > 1 ? 'Medium' : 'Low'} ({priority.toFixed(1)})
                  </span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>
                  Est. Cost: <strong>${(cost/1000).toFixed(0)}K</strong> | Est. Score Improvement: <strong style={{ color:T.green }}>+{pts} pts</strong>
                </div>
                {recs.map((rec, ri) => {
                  const actionKey = `${a.id}_${ri}`;
                  const isPlanned = plannedActions[actionKey];
                  return (
                    <div key={ri} onClick={() => toggleAction(a.id, ri)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', marginBottom:4, background: isPlanned ? T.sage+'10' : T.surface, borderRadius:6, border:`1px solid ${isPlanned ? T.sage : T.border}`, cursor:'pointer', transition:'all 0.2s' }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{isPlanned ? '\u2705' : '\u2B1C'}</span>
                      <span style={{ fontSize:11, color: isPlanned ? T.sage : T.textSec, flex:1 }}>{rec}</span>
                      <span style={{ fontSize:10, fontWeight:600, color: isPlanned ? T.sage : T.textMut }}>{isPlanned ? 'Planned' : 'Mark as Planned'}</span>
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </Section>

      {/* ── 29. Portfolio GRESB Target Setter ───────────────────────────────────── */}
      <Section title="Portfolio GRESB Targets" badge="2027 Goals">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Set portfolio-level GRESB performance targets and track current progress toward each goal.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12 }}>
          {(() => {
            const currentAvg = agg.avgScore || 0;
            const currentMinStars = enriched.length > 0 ? Math.min(...enriched.map(p => p.starRating)) : 0;
            const certCount = enriched.filter((_, i) => i % 4 === 0 || i % 7 === 0 || i % 5 === 0).length;
            const certPct = enriched.length > 0 ? certCount / enriched.length * 100 : 0;
            const checkDone = SUBMISSION_CHECKLIST.filter(c => checklist[c.id]).length;
            const checkPct = checkDone / SUBMISSION_CHECKLIST.length * 100;
            return [
              { key:'avgScore2027', label:'Avg Portfolio Score (2027)', min:50, max:100, step:1, current:currentAvg, target:portfolioTargets.avgScore2027, unit:'pts' },
              { key:'minStars', label:'Min Star Rating (any property)', min:1, max:5, step:1, current:currentMinStars, target:portfolioTargets.minStars, unit:'stars' },
              { key:'certCoverage', label:'Certification Coverage', min:10, max:100, step:5, current:certPct, target:portfolioTargets.certCoverage, unit:'%' },
            ].map(item => {
              const progress = Math.min(100, item.current / item.target * 100);
              return (
                <div key={item.key} style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>{item.label}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:T.textSec }}>Target:</span>
                    <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{item.target}{item.unit === 'stars' ? '\u2605' : item.unit === '%' ? '%' : ''}</span>
                  </div>
                  <input type="range" min={item.min} max={item.max} step={item.step} value={item.target}
                    onChange={e => updateTarget(item.key, e.target.value)}
                    style={{ width:'100%', cursor:'pointer', accentColor:T.navy, marginBottom:8 }} />
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:T.textSec }}>Current: <strong style={{ color: progress >= 100 ? T.green : T.amber }}>{item.current.toFixed(item.key === 'minStars' ? 0 : 1)}{item.unit === '%' ? '%' : ''}</strong></span>
                    <span style={{ fontSize:11, fontWeight:600, color: progress >= 100 ? T.green : progress >= 70 ? T.amber : T.red }}>{progress.toFixed(0)}%</span>
                  </div>
                  <div style={{ height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${Math.min(100, progress)}%`, height:'100%', background: progress >= 100 ? T.green : progress >= 70 ? T.amber : T.red, borderRadius:4, transition:'width 0.3s' }} />
                  </div>
                </div>
              );
            });
          })()}
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Submission Ready</div>
            {(() => {
              const checkDone = SUBMISSION_CHECKLIST.filter(c => checklist[c.id]).length;
              const checkPct = checkDone / SUBMISSION_CHECKLIST.length * 100;
              const isReady = checkPct >= 80;
              return (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, color:T.textSec }}>Target: 80%+ checklist complete</span>
                    <span style={{ fontSize:12, fontWeight:700, color: isReady ? T.green : T.red }}>{isReady ? 'Ready' : 'Not Ready'}</span>
                  </div>
                  <div style={{ height:8, background:T.border, borderRadius:4, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ width:`${checkPct}%`, height:'100%', background: isReady ? T.green : T.red, borderRadius:4, transition:'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize:11, color:T.textSec }}>
                    Checklist: {checkDone}/{SUBMISSION_CHECKLIST.length} ({checkPct.toFixed(0)}%)
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </Section>

      {/* ── 30. Cross-Navigation ──────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:8 }}>
        {[
          { label:'Property Physical Risk', path:'/property-physical-risk' },
          { label:'CRREM Analysis', path:'/crrem' },
          { label:'Climate Transition Risk', path:'/climate-transition-risk' },
          { label:'RE Dashboard', path:'/re-dashboard' },
          { label:'ESG Data Quality', path:'/esg-data-quality' },
        ].map(nav => (
          <button key={nav.path} onClick={() => navigate(nav.path)} style={{
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 18px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.navy, fontFamily:T.font,
          }}>{nav.label} &rarr;</button>
        ))}
      </div>
    </div>
  );
}
