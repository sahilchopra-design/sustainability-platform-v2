import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend
} from 'recharts';

/* ── Theme ────────────────────────────────────────────────────────────────────── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"
};

/* ── Hazards ──────────────────────────────────────────────────────────────────── */
const HAZARDS = [
  { id:'flood', name:'River & Coastal Flooding', icon:'\u{1F30A}', type:'Acute', color:'#2563eb' },
  { id:'cyclone', name:'Tropical Cyclones', icon:'\u{1F300}', type:'Acute', color:'#7c3aed' },
  { id:'wildfire', name:'Wildfire', icon:'\u{1F525}', type:'Acute', color:'#ef4444' },
  { id:'heatwave', name:'Extreme Heat', icon:'\u{1F321}\uFE0F', type:'Chronic', color:'#f97316' },
  { id:'drought', name:'Water Stress & Drought', icon:'\u{1F4A7}', type:'Chronic', color:'#d97706' },
  { id:'sealevel', name:'Sea Level Rise', icon:'\u{1F3D6}\uFE0F', type:'Chronic', color:'#0891b2' },
];

/* ── SSP & Time Horizon Multipliers ───────────────────────────────────────────── */
const SSP_OPTIONS = [
  { id:'ssp126', label:'SSP1-2.6', multiplier:0.8, desc:'Sustainability' },
  { id:'ssp245', label:'SSP2-4.5', multiplier:1.0, desc:'Middle of the Road' },
  { id:'ssp585', label:'SSP5-8.5', multiplier:1.4, desc:'Fossil-Fuel Intensive' },
];
const HORIZON_OPTIONS = [
  { id:'2030', label:'2030', multiplier:1.0 },
  { id:'2050', label:'2050', multiplier:1.3 },
  { id:'2100', label:'2100', multiplier:1.8 },
];

/* ── Adaptation Measures ──────────────────────────────────────────────────────── */
const ADAPTATION_MEASURES = [
  { id:'flood_barrier', name:'Flood Barriers', cost_usd_mn:0.8, risk_reduction_pct:35, applicable:['flood','sealevel'] },
  { id:'cooling_system', name:'Enhanced Cooling', cost_usd_mn:1.2, risk_reduction_pct:25, applicable:['heatwave'] },
  { id:'fireproofing', name:'Fire Protection', cost_usd_mn:0.5, risk_reduction_pct:40, applicable:['wildfire'] },
  { id:'water_storage', name:'Water Storage & Recycling', cost_usd_mn:0.6, risk_reduction_pct:30, applicable:['drought'] },
  { id:'backup_power', name:'Backup Power Systems', cost_usd_mn:1.5, risk_reduction_pct:20, applicable:['cyclone','flood','heatwave'] },
  { id:'seawall', name:'Seawall / Coastal Defense', cost_usd_mn:2.5, risk_reduction_pct:45, applicable:['sealevel','flood'] },
  { id:'roof_reinforcement', name:'Roof Reinforcement', cost_usd_mn:0.4, risk_reduction_pct:30, applicable:['cyclone','wildfire'] },
  { id:'drainage', name:'Advanced Drainage', cost_usd_mn:0.7, risk_reduction_pct:35, applicable:['flood'] },
];

/* ── Resilience Grade ─────────────────────────────────────────────────────────── */
const getResilienceGrade = (score) => {
  if (score >= 85) return { grade:'A', label:'Excellent', color:T.green };
  if (score >= 70) return { grade:'B', label:'Good', color:'#22c55e' };
  if (score >= 55) return { grade:'C', label:'Moderate', color:T.amber };
  if (score >= 40) return { grade:'D', label:'Poor', color:'#f97316' };
  return { grade:'E', label:'Critical', color:T.red };
};

/* ── Risk Tier ────────────────────────────────────────────────────────────────── */
const getRiskTier = (composite) => {
  if (composite >= 70) return { label:'Critical', color:T.red, bg:'#fef2f2' };
  if (composite >= 50) return { label:'High', color:'#f97316', bg:'#fff7ed' };
  if (composite >= 30) return { label:'Medium', color:T.amber, bg:'#fffbeb' };
  return { label:'Low', color:T.green, bg:'#f0fdf4' };
};

/* ── Reusable UI Components ───────────────────────────────────────────────────── */
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
const Grid = ({ cols, children }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:12 }}>{children}</div>
);

/* ── Helper ───────────────────────────────────────────────────────────────────── */
const fmt = (v) => typeof v === 'number' ? v.toFixed(1) : v;
const fmtUsd = (v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`;
const pct = (v) => `${v.toFixed(1)}%`;

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  EP-I3 — Property Physical Risk Engine                                       */
/* ══════════════════════════════════════════════════════════════════════════════ */
export default function PropertyPhysicalRiskPage() {
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
  const [ssp, setSsp] = useState('ssp245');
  const [horizon, setHorizon] = useState('2050');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');

  /* ── NEW: Editable hazard overrides per property ─────────────────────────── */
  const [hazardOverrides, setHazardOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_re_hazard_overrides_v1') || '{}'); } catch { return {}; }
  });
  const updateHazardScore = (propId, hazardId, value) => {
    const clamped = Math.min(100, Math.max(0, Number(value) || 0));
    const updated = { ...hazardOverrides, [propId]: { ...(hazardOverrides[propId] || {}), [hazardId]: clamped } };
    setHazardOverrides(updated);
    localStorage.setItem('ra_re_hazard_overrides_v1', JSON.stringify(updated));
  };
  const resetHazardOverrides = (propId) => {
    const updated = { ...hazardOverrides };
    delete updated[propId];
    setHazardOverrides(updated);
    localStorage.setItem('ra_re_hazard_overrides_v1', JSON.stringify(updated));
  };

  /* ── NEW: Adaptation toggles per property ────────────────────────────────── */
  const [adaptations, setAdaptations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_re_adaptations_v1') || '{}'); } catch { return {}; }
  });
  const toggleAdaptation = (propId, measureId) => {
    const propAdapt = adaptations[propId] || [];
    const updated = propAdapt.includes(measureId) ? propAdapt.filter(m => m !== measureId) : [...propAdapt, measureId];
    const next = { ...adaptations, [propId]: updated };
    setAdaptations(next);
    localStorage.setItem('ra_re_adaptations_v1', JSON.stringify(next));
  };

  /* ── NEW: Insurance premium overrides ────────────────────────────────────── */
  const [insuranceOverrides, setInsuranceOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_re_insurance_overrides_v1') || '{}'); } catch { return {}; }
  });
  const updateInsurance = (propId, value) => {
    const v = Math.max(0, Number(value) || 0);
    const updated = { ...insuranceOverrides, [propId]: v };
    setInsuranceOverrides(updated);
    localStorage.setItem('ra_re_insurance_overrides_v1', JSON.stringify(updated));
  };

  /* ── NEW: Building metadata overrides ────────────────────────────────────── */
  const [metadataOverrides, setMetadataOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_re_metadata_overrides_v1') || '{}'); } catch { return {}; }
  });
  const updateMetadata = (propId, field, value) => {
    const updated = { ...metadataOverrides, [propId]: { ...(metadataOverrides[propId] || {}), [field]: value } };
    setMetadataOverrides(updated);
    localStorage.setItem('ra_re_metadata_overrides_v1', JSON.stringify(updated));
  };

  /* ── NEW: Risk Appetite thresholds ───────────────────────────────────────── */
  const [riskAppetite, setRiskAppetite] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_re_risk_appetite_v1') || 'null') || { maxCompositeRisk:70, maxAcuteExposure:60, maxInsuranceCost:5000000, minResilienceScore:50 }; } catch { return { maxCompositeRisk:70, maxAcuteExposure:60, maxInsuranceCost:5000000, minResilienceScore:50 }; }
  });
  const updateRiskAppetite = (field, value) => {
    const next = { ...riskAppetite, [field]: Number(value) };
    setRiskAppetite(next);
    localStorage.setItem('ra_re_risk_appetite_v1', JSON.stringify(next));
  };

  const sspMult = SSP_OPTIONS.find(s => s.id === ssp)?.multiplier || 1.0;
  const horizonMult = HORIZON_OPTIONS.find(h => h.id === horizon)?.multiplier || 1.0;

  /* ── Compute adjusted risk per property (uses overrides & adaptations) ──── */
  const enriched = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.map((p, idx) => {
      const propId = p.id || `prop_${idx}`;
      const pr = p.physicalRisk || {};
      const overrides = hazardOverrides[propId] || {};
      const propAdapt = adaptations[propId] || [];
      const meta = metadataOverrides[propId] || {};
      const adjusted = {};
      let acuteSum = 0, chronicSum = 0, acuteCount = 0, chronicCount = 0;
      HAZARDS.forEach(h => {
        const raw = overrides[h.id] !== undefined ? overrides[h.id] : (pr[h.id] || 0);
        let val = Math.min(100, raw * sspMult * horizonMult);
        propAdapt.forEach(mId => {
          const measure = ADAPTATION_MEASURES.find(m => m.id === mId);
          if (measure && measure.applicable.includes(h.id)) val = val * (1 - measure.risk_reduction_pct / 100);
        });
        val = Math.max(0, Math.min(100, val));
        adjusted[h.id] = val;
        if (h.type === 'Acute') { acuteSum += val; acuteCount++; }
        else { chronicSum += val; chronicCount++; }
      });
      const composite = HAZARDS.reduce((s, h) => s + (adjusted[h.id] || 0), 0) / HAZARDS.length;
      const acuteAvg = acuteCount > 0 ? acuteSum / acuteCount : 0;
      const chronicAvg = chronicCount > 0 ? chronicSum / chronicCount : 0;
      const compoundFloodSea = Math.min(100, (adjusted.flood || 0) * 0.4 + (adjusted.sealevel || 0) * 0.35 + (adjusted.cyclone || 0) * 0.25);
      const basePremium = insuranceOverrides[propId] !== undefined ? insuranceOverrides[propId] : (p.insurance_premium_usd || 50000);
      const insuranceMult = 1 + composite / 100;
      const climateAdjPremium = basePremium * insuranceMult;
      const resilience = p.building_resilience_score || (50 + Math.round(Math.sin(idx + 1) * 20));
      return {
        ...p,
        id: propId,
        idx,
        adjusted,
        composite,
        acuteAvg,
        chronicAvg,
        compoundFloodSea,
        insuranceMult,
        climateAdjPremium,
        insurance_premium_usd: basePremium,
        resilience,
        tier: getRiskTier(composite),
        resGrade: getResilienceGrade(resilience),
        elevation_m: meta.elevation_m !== undefined ? meta.elevation_m : p.elevation_m,
        coastal_distance_km: meta.coastal_distance_km !== undefined ? meta.coastal_distance_km : p.coastal_distance_km,
        year_built: meta.year_built || p.year_built,
        construction_type: meta.construction_type || p.construction_type,
        floodZone: meta.floodZone || p.floodZone,
        backup_power: meta.backup_power !== undefined ? meta.backup_power : p.backup_power,
        _hasAdaptations: propAdapt.length > 0,
        _adaptationCount: propAdapt.length,
      };
    });
  }, [portfolio, sspMult, horizonMult, hazardOverrides, adaptations, insuranceOverrides, metadataOverrides]);

  const selected = enriched[selectedIdx] || enriched[0];

  /* ── Portfolio Aggregates ────────────────────────────────────────────────────── */
  const agg = useMemo(() => {
    if (!enriched.length) return {};
    const composites = enriched.map(p => p.composite);
    const avgComposite = composites.reduce((a, b) => a + b, 0) / composites.length;
    const acuteExposed = enriched.filter(p => p.acuteAvg >= 50).length;
    const chronicExposed = enriched.filter(p => p.chronicAvg >= 50).length;
    const mostExposed = enriched.reduce((a, b) => a.composite > b.composite ? a : b);
    const leastExposed = enriched.reduce((a, b) => a.composite < b.composite ? a : b);
    const avgPremium = enriched.reduce((s, p) => s + (p.insurance_premium_usd || 50000), 0) / enriched.length;
    const totalVaR = enriched.reduce((s, p) => s + (p.composite / 100) * (p.gav_usd || p.value_usd || 50e6) * 0.15, 0);
    const floodZoneCounts = {};
    enriched.forEach(p => { const z = p.floodZone || 'X'; floodZoneCounts[z] = (floodZoneCounts[z] || 0) + 1; });
    const highFloodZones = (floodZoneCounts['A'] || 0) + (floodZoneCounts['AE'] || 0) + (floodZoneCounts['V'] || 0);
    const avgResilience = enriched.reduce((s, p) => s + p.resilience, 0) / enriched.length;
    const totalAdaptCost = enriched.reduce((s, p) => {
      const applicable = ADAPTATION_MEASURES.filter(m => m.applicable.some(h => (p.adjusted[h] || 0) > 40));
      return s + applicable.reduce((a, m) => a + m.cost_usd_mn, 0);
    }, 0);
    const criticalCount = enriched.filter(p => p.composite >= 70).length;
    const avgElevation = enriched.reduce((s, p) => s + (p.elevation_m || 25), 0) / enriched.length;
    return { avgComposite, acuteExposed, chronicExposed, mostExposed, leastExposed, avgPremium, totalVaR, floodZoneCounts, highFloodZones, avgResilience, totalAdaptCost, criticalCount, avgElevation };
  }, [enriched]);

  /* ── Sorted table data ──────────────────────────────────────────────────────── */
  const sorted = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let va, vb;
      if (sortCol === 'name') { va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'composite') { va = a.composite; vb = b.composite; }
      else if (sortCol === 'resilience') { va = a.resilience; vb = b.resilience; }
      else if (sortCol === 'insurance') { va = a.insurance_premium_usd || 0; vb = b.insurance_premium_usd || 0; }
      else { va = a.adjusted?.[sortCol] || 0; vb = b.adjusted?.[sortCol] || 0; }
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });
    return arr;
  }, [enriched, sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Radar data for selected property ───────────────────────────────────────── */
  const radarData = useMemo(() => {
    if (!selected) return [];
    const portfolioAvg = {};
    HAZARDS.forEach(h => { portfolioAvg[h.id] = enriched.reduce((s, p) => s + (p.adjusted[h.id] || 0), 0) / enriched.length; });
    return HAZARDS.map(h => ({
      hazard: h.name.split(' ')[0],
      property: selected.adjusted[h.id] || 0,
      portfolio: portfolioAvg[h.id] || 0,
      fullMark: 100,
    }));
  }, [selected, enriched]);

  /* ── Bar chart data (all properties, sorted by composite) ───────────────────── */
  const barData = useMemo(() => {
    return [...enriched].sort((a, b) => b.composite - a.composite).map(p => ({
      name: (p.name || `Property ${p.idx + 1}`).substring(0, 18),
      composite: Math.round(p.composite * 10) / 10,
      tier: p.tier,
    }));
  }, [enriched]);

  /* ── Flood zone pie data ────────────────────────────────────────────────────── */
  const floodPieData = useMemo(() => {
    if (!agg.floodZoneCounts) return [];
    const ZONE_COLORS = { A:'#dc2626', AE:'#ef4444', V:'#991b1b', VE:'#7f1d1d', X:'#16a34a', B:'#d97706', C:'#f59e0b', D:'#9aa3ae' };
    return Object.entries(agg.floodZoneCounts).map(([zone, count]) => ({
      name: `Zone ${zone}`, value: count, color: ZONE_COLORS[zone] || '#6b7280',
    }));
  }, [agg]);

  /* ── Climate-adjusted valuation trajectory ──────────────────────────────────── */
  const valuationData = useMemo(() => {
    if (!enriched.length) return [];
    const totalGAV = enriched.reduce((s, p) => s + (p.gav_usd || p.value_usd || 50e6), 0);
    const avgRisk245 = enriched.reduce((s, p) => s + p.composite, 0) / enriched.length / 100;
    const years = [];
    for (let y = 2026; y <= 2060; y++) {
      const t = (y - 2026) / 34;
      const discount245 = avgRisk245 * 0.15 * t * 1.0;
      const discount585 = avgRisk245 * 0.15 * t * 1.4;
      years.push({
        year: y,
        baseline: Math.round(totalGAV / 1e6),
        ssp245: Math.round((totalGAV * (1 - discount245)) / 1e6),
        ssp585: Math.round((totalGAV * (1 - discount585)) / 1e6),
      });
    }
    return years;
  }, [enriched]);

  /* ── Adaptation measures for selected property ──────────────────────────────── */
  const adaptationPlan = useMemo(() => {
    if (!selected) return [];
    return ADAPTATION_MEASURES.filter(m => m.applicable.some(h => (selected.adjusted[h] || 0) > 30)).map(m => {
      const topHazard = m.applicable.reduce((best, h) => (selected.adjusted[h] || 0) > (selected.adjusted[best] || 0) ? h : best, m.applicable[0]);
      const currentScore = selected.adjusted[topHazard] || 0;
      const reducedScore = currentScore * (1 - m.risk_reduction_pct / 100);
      const annualSaving = (currentScore - reducedScore) / 100 * (selected.gav_usd || selected.value_usd || 50e6) * 0.002;
      const payback = annualSaving > 0 ? (m.cost_usd_mn * 1e6) / annualSaving : 99;
      return { ...m, topHazard, currentScore, reducedScore, annualSaving, payback, roi: annualSaving > 0 ? ((annualSaving * 10 - m.cost_usd_mn * 1e6) / (m.cost_usd_mn * 1e6) * 100) : 0 };
    }).sort((a, b) => b.roi - a.roi);
  }, [selected]);

  /* ── Empty State ────────────────────────────────────────────────────────────── */
  if (!portfolio || !portfolio.length) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.font }}>
        <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, padding:48, maxWidth:520, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏗️</div>
          <h2 style={{ color:T.text, fontSize:22, fontWeight:700, marginBottom:8 }}>No RE Portfolio Loaded</h2>
          <p style={{ color:T.textSec, fontSize:14, lineHeight:1.6, marginBottom:24 }}>
            Property-level physical risk assessment requires a real estate portfolio. Please seed your portfolio via the CRREM module first.
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
    const hdr = ['Property','Type','Location','Composite',...HAZARDS.map(h=>h.name),'Resilience','Insurance Premium','Flood Zone'].join(',');
    const rows = enriched.map(p => [
      `"${p.name||''}"`, p.type||'', `"${p.location||p.city||''}"`, p.composite.toFixed(1),
      ...HAZARDS.map(h => (p.adjusted[h.id]||0).toFixed(1)),
      p.resilience, p.insurance_premium_usd||'', p.floodZone||'X'
    ].join(','));
    const blob = new Blob([hdr+'\n'+rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'property_physical_risk.csv'; a.click();
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(enriched.map(p => ({ name:p.name, composite:p.composite, adjusted:p.adjusted, resilience:p.resilience, tier:p.tier.label })), null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'property_physical_risk.json'; a.click();
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
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text }}>Property Physical Risk Engine</h1>
            <span style={{ fontSize:10, fontWeight:600, padding:'3px 10px', borderRadius:6, background:T.navy, color:'#fff' }}>EP-I3</span>
          </div>
          <p style={{ margin:'4px 0 0', fontSize:13, color:T.textSec }}>IPCC AR6 &middot; 6 Hazards &middot; SSP Scenarios &middot; Property-Level Assessment</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.text, fontFamily:T.font }}>Export CSV</button>
          <button onClick={exportJSON} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.text, fontFamily:T.font }}>Export JSON</button>
          <button onClick={exportPDF} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.text, fontFamily:T.font }}>Print / PDF</button>
        </div>
      </div>

      {/* ── 2. SSP & Horizon Selectors ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:24, marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>SSP Scenario</div>
          <div style={{ display:'flex', gap:6 }}>
            {SSP_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setSsp(s.id)} style={{
                padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font, border: ssp === s.id ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                background: ssp === s.id ? T.navy : T.surface, color: ssp === s.id ? '#fff' : T.text, transition:'all 0.15s'
              }}>{s.label} <span style={{ fontSize:10, opacity:0.7 }}>({s.multiplier}x)</span></button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Time Horizon</div>
          <div style={{ display:'flex', gap:6 }}>
            {HORIZON_OPTIONS.map(h => (
              <button key={h.id} onClick={() => setHorizon(h.id)} style={{
                padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font, border: horizon === h.id ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
                background: horizon === h.id ? T.gold : T.surface, color: horizon === h.id ? '#fff' : T.text, transition:'all 0.15s'
              }}>{h.label} <span style={{ fontSize:10, opacity:0.7 }}>({h.multiplier}x)</span></button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Property Selector ──────────────────────────────────────────────── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Select Property for Detail View</div>
        <select
          value={selectedIdx}
          onChange={e => setSelectedIdx(Number(e.target.value))}
          style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, background:T.surface, minWidth:360, cursor:'pointer' }}
        >
          {enriched.map((p, i) => (
            <option key={i} value={i}>{p.name || `Property ${i+1}`} &mdash; Composite: {p.composite.toFixed(1)} ({p.tier.label})</option>
          ))}
        </select>
      </div>

      {/* ── 4. KPI Cards (12) ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12, marginBottom:24 }}>
        <KpiCard label="Composite Portfolio Risk" value={fmt(agg.avgComposite)} sub={`${getRiskTier(agg.avgComposite).label} tier`} accent={getRiskTier(agg.avgComposite).color} />
        <KpiCard label="Acute Exposure %" value={pct(agg.acuteExposed / enriched.length * 100)} sub={`${agg.acuteExposed} of ${enriched.length} properties`} accent="#2563eb" />
        <KpiCard label="Chronic Exposure %" value={pct(agg.chronicExposed / enriched.length * 100)} sub={`${agg.chronicExposed} properties > 50`} accent="#0891b2" />
        <KpiCard label="Most Exposed" value={(agg.mostExposed?.name || 'N/A').substring(0, 16)} sub={`Score: ${agg.mostExposed?.composite?.toFixed(1) || 0}`} accent={T.red} />
        <KpiCard label="Least Exposed" value={(agg.leastExposed?.name || 'N/A').substring(0, 16)} sub={`Score: ${agg.leastExposed?.composite?.toFixed(1) || 0}`} accent={T.green} />
        <KpiCard label="Avg Insurance Premium" value={fmtUsd(agg.avgPremium || 0)} sub="Annual per property" accent={T.gold} />
        <KpiCard label="Total Portfolio VaR" value={fmtUsd(agg.totalVaR || 0)} sub="Climate-adj. at-risk value" accent={T.red} />
        <KpiCard label="High-Risk Flood Zones" value={agg.highFloodZones || 0} sub="A / AE / V zone properties" accent="#2563eb" />
        <KpiCard label="Avg Resilience Score" value={fmt(agg.avgResilience)} sub={getResilienceGrade(agg.avgResilience).label} accent={getResilienceGrade(agg.avgResilience).color} />
        <KpiCard label="Total Adaptation Cost" value={`$${(agg.totalAdaptCost || 0).toFixed(1)}M`} sub="All eligible measures" accent={T.sage} />
        <KpiCard label="Critical Risk Properties" value={agg.criticalCount || 0} sub="Composite > 70" accent={T.red} />
        <KpiCard label="Avg Elevation" value={`${(agg.avgElevation || 0).toFixed(0)}m`} sub="Above sea level" accent="#0891b2" />
      </div>

      {/* ── 5. Radar Chart — Selected Property vs Portfolio ────────────────────── */}
      <Section title={`Hazard Profile: ${selected?.name || 'Selected Property'}`} badge="Radar">
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:340 }}>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} outerRadius={120}>
                <PolarGrid stroke={T.borderL} />
                <PolarAngleAxis dataKey="hazard" tick={{ fontSize:11, fill:T.textSec }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Selected Property" dataKey="property" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Portfolio Avg" dataKey="portfolio" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Tooltip formatter={(v) => v.toFixed(1)} contentStyle={{ fontSize:12, fontFamily:T.font }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, minWidth:300 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Hazard Breakdown</div>
            {HAZARDS.map(h => {
              const val = selected?.adjusted?.[h.id] || 0;
              return (
                <div key={h.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:16, width:24 }}>{h.icon}</span>
                  <span style={{ fontSize:11, color:T.textSec, width:120 }}>{h.name}</span>
                  <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${val}%`, height:'100%', background:h.color, borderRadius:4, transition:'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:val >= 70 ? T.red : val >= 50 ? T.amber : T.text, width:36, textAlign:'right' }}>{val.toFixed(0)}</span>
                  <span style={{ fontSize:10, color:T.textMut, padding:'1px 6px', background:T.surfaceH, borderRadius:4 }}>{h.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 6. All Properties Risk Bar Chart ──────────────────────────────────── */}
      <Section title="Portfolio Risk Ranking" badge="All Properties">
        <ResponsiveContainer width="100%" height={Math.max(300, enriched.length * 28 + 40)}>
          <BarChart data={barData} layout="vertical" margin={{ left:100, right:30, top:10, bottom:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize:10 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:T.textSec }} width={95} />
            <Tooltip formatter={(v) => `${v.toFixed(1)}`} contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Bar dataKey="composite" radius={[0, 4, 4, 0]} barSize={14}>
              {barData.map((d, i) => <Cell key={i} fill={d.tier.color} />)}
            </Bar>
            <ReferenceLine x={70} stroke={T.red} strokeDasharray="4 4" label={{ value:'Critical', position:'top', fontSize:10, fill:T.red }} />
            <ReferenceLine x={50} stroke={T.amber} strokeDasharray="4 4" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, marginTop:8 }}>
          {[{ l:'Critical (>70)', c:T.red }, { l:'High (50-70)', c:'#f97316' }, { l:'Medium (30-50)', c:T.amber }, { l:'Low (<30)', c:T.green }].map(t => (
            <span key={t.l} style={{ fontSize:11, color:T.textSec, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:t.c, display:'inline-block' }} />{t.l}
            </span>
          ))}
        </div>
      </Section>

      {/* ── 7. Flood Zone Distribution Pie ────────────────────────────────────── */}
      <Section title="Flood Zone Distribution" badge="FEMA Zones">
        <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <ResponsiveContainer width="100%" height={280} style={{ maxWidth:360 }}>
            <PieChart>
              <Pie data={floodPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ strokeWidth:1 }} style={{ fontSize:11 }}>
                {floodPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:12, fontFamily:T.font }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:10 }}>Flood Zone Legend</div>
            {[{ z:'A / AE', d:'100-year floodplain - High risk', c:'#dc2626' },
              { z:'V / VE', d:'Coastal high hazard - Very high risk', c:'#991b1b' },
              { z:'B', d:'500-year floodplain - Moderate risk', c:'#d97706' },
              { z:'C', d:'Minimal flood risk - Low risk', c:'#f59e0b' },
              { z:'X', d:'Outside flood zones - Minimal risk', c:'#16a34a' },
            ].map(item => (
              <div key={item.z} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:item.c, flexShrink:0 }} />
                <span style={{ fontSize:12, fontWeight:600, color:T.text, width:40 }}>{item.z}</span>
                <span style={{ fontSize:11, color:T.textSec }}>{item.d}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 8. Compound Risk Panel ────────────────────────────────────────────── */}
      <Section title={`Compound Risk Analysis: ${selected?.name || ''}`} badge="Multi-Hazard">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:16 }}>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Flood + Sea Level</div>
            <div style={{ fontSize:28, fontWeight:700, color: (selected?.adjusted?.flood || 0) * 0.5 + (selected?.adjusted?.sealevel || 0) * 0.5 > 60 ? T.red : T.text }}>
              {(((selected?.adjusted?.flood || 0) * 0.5 + (selected?.adjusted?.sealevel || 0) * 0.5)).toFixed(1)}
            </div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Cyclone + Flood + Wind</div>
            <div style={{ fontSize:28, fontWeight:700, color: selected?.compoundFloodSea > 60 ? T.red : T.text }}>
              {(selected?.compoundFloodSea || 0).toFixed(1)}
            </div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Heat + Drought</div>
            <div style={{ fontSize:28, fontWeight:700, color: ((selected?.adjusted?.heatwave || 0) + (selected?.adjusted?.drought || 0)) / 2 > 60 ? T.red : T.text }}>
              {(((selected?.adjusted?.heatwave || 0) + (selected?.adjusted?.drought || 0)) / 2).toFixed(1)}
            </div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Coastal Composite</div>
            <div style={{ fontSize:28, fontWeight:700, color: selected?.composite > 60 ? T.red : T.text }}>
              {((selected?.adjusted?.flood || 0) * 0.3 + (selected?.adjusted?.sealevel || 0) * 0.3 + (selected?.adjusted?.cyclone || 0) * 0.2 + (selected?.adjusted?.heatwave || 0) * 0.2).toFixed(1)}
            </div>
          </div>
        </div>
        <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>
          Compound risk assesses multi-hazard interactions where simultaneous or sequential events amplify total losses beyond individual hazard impacts.
          Properties with compound scores above 60 require immediate attention to multi-hazard resilience planning.
          {selected?.floodZone && selected.floodZone !== 'X' && (
            <span style={{ display:'block', marginTop:4, color:T.red, fontWeight:600 }}>
              Warning: This property is in Flood Zone {selected.floodZone}, amplifying compound coastal risk.
            </span>
          )}
        </div>
      </Section>

      {/* ── 9. Insurance Impact Table ─────────────────────────────────────────── */}
      <Section title="Insurance Impact Analysis" badge="Climate-Adjusted Premiums">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Property','Current Premium','Risk Multiplier','Climate-Adj. Premium','Annual Increase','10yr Cost Impact','Flood Zone'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.slice(0, 15).map((p, i) => {
                const basePrem = p.insurance_premium_usd || 50000;
                const adjPrem = p.climateAdjPremium;
                const annualInc = adjPrem - basePrem;
                const tenYrCost = annualInc * 10;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight:600 }}>{(p.name || `Property ${i+1}`).substring(0, 22)}</td>
                    <td style={tdS}>{fmtUsd(basePrem)}</td>
                    <td style={tdS}><span style={{ fontWeight:600, color: p.insuranceMult > 1.5 ? T.red : p.insuranceMult > 1.3 ? T.amber : T.text }}>{p.insuranceMult.toFixed(2)}x</span></td>
                    <td style={tdS}>{fmtUsd(adjPrem)}</td>
                    <td style={{ ...tdS, color:T.red }}>+{fmtUsd(annualInc)}</td>
                    <td style={{ ...tdS, color:T.red, fontWeight:600 }}>+{fmtUsd(tenYrCost)}</td>
                    <td style={tdS}><span style={{ padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:600, background: p.floodZone === 'X' || !p.floodZone ? '#f0fdf4' : '#fef2f2', color: p.floodZone === 'X' || !p.floodZone ? T.green : T.red }}>{p.floodZone || 'X'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {enriched.length > 15 && <div style={{ fontSize:11, color:T.textMut, marginTop:8, textAlign:'right' }}>Showing top 15 of {enriched.length} properties. Export for full dataset.</div>}
      </Section>

      {/* ── 10. Adaptation Investment Planner ─────────────────────────────────── */}
      <Section title={`Adaptation Investment: ${selected?.name || ''}`} badge="Cost-Benefit">
        {adaptationPlan.length === 0 ? (
          <div style={{ padding:16, color:T.textSec, fontSize:13, textAlign:'center' }}>No significant hazard exposures requiring adaptation for this property.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Measure','Target Hazard','Cost ($M)','Risk Reduction','Current Score','Post-Adapt Score','Annual Saving','Payback (yrs)','10yr ROI'].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adaptationPlan.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight:600 }}>{m.name}</td>
                    <td style={tdS}><span style={{ textTransform:'capitalize' }}>{m.topHazard}</span></td>
                    <td style={tdS}>${m.cost_usd_mn.toFixed(1)}M</td>
                    <td style={tdS}><span style={{ color:T.green, fontWeight:600 }}>-{m.risk_reduction_pct}%</span></td>
                    <td style={tdS}><span style={{ color: m.currentScore >= 70 ? T.red : m.currentScore >= 50 ? T.amber : T.text }}>{m.currentScore.toFixed(0)}</span></td>
                    <td style={tdS}><span style={{ color:T.green }}>{m.reducedScore.toFixed(0)}</span></td>
                    <td style={tdS}>{fmtUsd(m.annualSaving)}</td>
                    <td style={tdS}><span style={{ fontWeight:600, color: m.payback <= 5 ? T.green : m.payback <= 10 ? T.amber : T.red }}>{m.payback.toFixed(1)}</span></td>
                    <td style={tdS}><span style={{ fontWeight:700, color: m.roi > 0 ? T.green : T.red }}>{m.roi.toFixed(0)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:12, fontSize:11, color:T.textSec }}>
              Total adaptation cost for {selected?.name || 'this property'}: <strong>${adaptationPlan.reduce((s, m) => s + m.cost_usd_mn, 0).toFixed(1)}M</strong>.
              Combined risk reduction: <strong>-{Math.min(100, adaptationPlan.reduce((s, m) => s + m.risk_reduction_pct, 0) * 0.6).toFixed(0)}%</strong> (with diminishing returns).
            </div>
          </div>
        )}
      </Section>

      {/* ── 11. Climate-Adjusted Valuation Trajectory ─────────────────────────── */}
      <Section title="Climate-Adjusted Portfolio Valuation" badge="GAV 2026-2060">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={valuationData} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize:10 }} />
            <YAxis tick={{ fontSize:10 }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={v => `$${v}M`} contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="baseline" stroke={T.textMut} fill={T.textMut} fillOpacity={0.05} strokeDasharray="4 4" name="Baseline (no climate)" />
            <Area type="monotone" dataKey="ssp245" stroke={T.amber} fill={T.amber} fillOpacity={0.15} strokeWidth={2} name="SSP2-4.5" />
            <Area type="monotone" dataKey="ssp585" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeWidth={2} name="SSP5-8.5" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ fontSize:11, color:T.textSec, marginTop:8 }}>
          Climate-adjusted valuation applies a physical risk discount of up to 15% of GAV based on composite risk scores and SSP scenario projections.
          Under SSP5-8.5, the portfolio could lose <strong>{valuationData.length > 0 ? `$${(valuationData[0]?.baseline - (valuationData[valuationData.length - 1]?.ssp585 || 0)).toFixed(0)}M` : 'N/A'}</strong> by 2060.
        </div>
      </Section>

      {/* ── 12. Resilience Rating Table ────────────────────────────────────────── */}
      <Section title="Building Resilience Ratings" badge="A-E Scale">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginBottom:16 }}>
          {['A','B','C','D','E'].map(grade => {
            const count = enriched.filter(p => p.resGrade.grade === grade).length;
            const g = getResilienceGrade(grade === 'A' ? 90 : grade === 'B' ? 75 : grade === 'C' ? 60 : grade === 'D' ? 45 : 30);
            return (
              <div key={grade} style={{ textAlign:'center', padding:12, background:T.surfaceH, borderRadius:8, border: count > 0 ? `2px solid ${g.color}` : `1px solid ${T.border}` }}>
                <div style={{ fontSize:24, fontWeight:800, color:g.color }}>{grade}</div>
                <div style={{ fontSize:11, color:T.textSec }}>{g.label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:T.text, marginTop:4 }}>{count}</div>
                <div style={{ fontSize:10, color:T.textMut }}>properties</div>
              </div>
            );
          })}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Property','Type','Resilience Score','Grade','Elevation (m)','Flood Zone','Coastal Dist. (km)','Insurance Risk'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.sort((a, b) => b.resilience - a.resilience).slice(0, 15).map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight:600 }}>{(p.name || `Property ${i+1}`).substring(0, 22)}</td>
                  <td style={tdS}>{p.type || 'Office'}</td>
                  <td style={tdS}><span style={{ fontWeight:700, color:p.resGrade.color }}>{p.resilience}</span></td>
                  <td style={tdS}><span style={{ padding:'2px 8px', borderRadius:4, fontWeight:700, fontSize:12, color:'#fff', background:p.resGrade.color }}>{p.resGrade.grade}</span></td>
                  <td style={tdS}>{p.elevation_m || Math.round(10 + Math.sin(i + 3) * 30 + 30)}m</td>
                  <td style={tdS}>{p.floodZone || 'X'}</td>
                  <td style={tdS}>{p.coastal_distance_km || (Math.round(Math.abs(Math.sin(i + 7) * 40) + 1))} km</td>
                  <td style={tdS}><span style={{ fontWeight:600, color: (p.insuranceRiskScore || p.composite) >= 70 ? T.red : (p.insuranceRiskScore || p.composite) >= 50 ? T.amber : T.green }}>{(p.insuranceRiskScore || Math.round(p.composite))}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 13. Sortable Full Property Table ──────────────────────────────────── */}
      <Section title="Complete Property Risk Register" badge={`${enriched.length} Properties`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1100 }}>
            <thead>
              <tr>
                {[
                  { col:'name', label:'Property' },
                  { col:'composite', label:'Composite' },
                  ...HAZARDS.map(h => ({ col:h.id, label:h.icon + ' ' + h.name.split(' ')[0] })),
                  { col:'resilience', label:'Resilience' },
                  { col:'insurance', label:'Premium ($)' },
                ].map(h => (
                  <th key={h.col} onClick={() => toggleSort(h.col)} style={{ ...thS, cursor:'pointer' }}>
                    {h.label} {sortCol === h.col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const tier = p.tier;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, cursor:'pointer' }} onClick={() => setSelectedIdx(p.idx)}>
                    <td style={{ ...tdS, fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name || `Property ${p.idx + 1}`}</td>
                    <td style={tdS}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:tier.color }} />
                        <span style={{ fontWeight:700, color:tier.color }}>{p.composite.toFixed(1)}</span>
                      </span>
                    </td>
                    {HAZARDS.map(h => {
                      const v = p.adjusted[h.id] || 0;
                      return (
                        <td key={h.id} style={tdS}>
                          <span style={{ color: v >= 70 ? T.red : v >= 50 ? T.amber : v >= 30 ? T.textSec : T.green, fontWeight: v >= 70 ? 700 : 400 }}>{v.toFixed(0)}</span>
                        </td>
                      );
                    })}
                    <td style={tdS}><span style={{ fontWeight:600, color:p.resGrade.color }}>{p.resilience} ({p.resGrade.grade})</span></td>
                    <td style={tdS}>{fmtUsd(p.insurance_premium_usd || 50000)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 14. Hazard Heatmap Summary ─────────────────────────────────────── */}
      <Section title="Hazard Heatmap Summary" badge="All Properties x All Hazards">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Cell values show scenario-adjusted hazard scores. Color intensity reflects severity. Click any row to select that property for detail view.
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
            <thead>
              <tr>
                <th style={thS}>Property</th>
                <th style={thS}>Type</th>
                {HAZARDS.map(h => <th key={h.id} style={{ ...thS, textAlign:'center' }}>{h.icon} {h.name.split(' ')[0]}</th>)}
                <th style={{ ...thS, textAlign:'center' }}>Composite</th>
                <th style={{ ...thS, textAlign:'center' }}>Tier</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((p, i) => {
                const heatColor = (v) => {
                  if (v >= 80) return { bg:'#fef2f2', color:'#991b1b', fontWeight:800 };
                  if (v >= 60) return { bg:'#fff7ed', color:'#9a3412', fontWeight:700 };
                  if (v >= 40) return { bg:'#fffbeb', color:'#92400e', fontWeight:600 };
                  if (v >= 20) return { bg:'#f0fdf4', color:'#166534', fontWeight:500 };
                  return { bg:T.surface, color:T.textMut, fontWeight:400 };
                };
                return (
                  <tr key={i} style={{ cursor:'pointer' }} onClick={() => setSelectedIdx(p.idx)}>
                    <td style={{ ...tdS, fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', background: selectedIdx === p.idx ? T.surfaceH : (i % 2 === 0 ? T.surface : T.surfaceH) }}>{p.name || `Property ${p.idx+1}`}</td>
                    <td style={{ ...tdS, fontSize:11, background: i % 2 === 0 ? T.surface : T.surfaceH }}>{p.type || 'Office'}</td>
                    {HAZARDS.map(h => {
                      const v = p.adjusted[h.id] || 0;
                      const hc = heatColor(v);
                      return (
                        <td key={h.id} style={{ ...tdS, textAlign:'center', background:hc.bg, color:hc.color, fontWeight:hc.fontWeight, fontSize:11 }}>{v.toFixed(0)}</td>
                      );
                    })}
                    <td style={{ ...tdS, textAlign:'center', fontWeight:700, color:p.tier.color, background:p.tier.bg }}>{p.composite.toFixed(1)}</td>
                    <td style={{ ...tdS, textAlign:'center' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:p.tier.bg, color:p.tier.color }}>{p.tier.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 15. Portfolio Risk Concentration ───────────────────────────────────── */}
      <Section title="Risk Concentration by Hazard Type" badge="Acute vs Chronic">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#2563eb', marginBottom:10 }}>Acute Hazards (Event-Driven)</div>
            {HAZARDS.filter(h => h.type === 'Acute').map(h => {
              const avgVal = enriched.reduce((s, p) => s + (p.adjusted[h.id] || 0), 0) / enriched.length;
              const maxProp = enriched.reduce((a, b) => (a.adjusted[h.id] || 0) > (b.adjusted[h.id] || 0) ? a : b);
              const critCount = enriched.filter(p => (p.adjusted[h.id] || 0) >= 70).length;
              return (
                <div key={h.id} style={{ background:T.surfaceH, borderRadius:8, padding:12, marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{h.icon} {h.name}</span>
                    <span style={{ fontSize:11, color:h.color, fontWeight:600 }}>Avg: {avgVal.toFixed(1)}</span>
                  </div>
                  <div style={{ height:6, background:T.border, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ width:`${avgVal}%`, height:'100%', background:h.color, borderRadius:3 }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut }}>
                    <span>Most exposed: {(maxProp.name || '').substring(0, 14)} ({(maxProp.adjusted[h.id] || 0).toFixed(0)})</span>
                    <span>{critCount} critical</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0891b2', marginBottom:10 }}>Chronic Hazards (Trend-Driven)</div>
            {HAZARDS.filter(h => h.type === 'Chronic').map(h => {
              const avgVal = enriched.reduce((s, p) => s + (p.adjusted[h.id] || 0), 0) / enriched.length;
              const maxProp = enriched.reduce((a, b) => (a.adjusted[h.id] || 0) > (b.adjusted[h.id] || 0) ? a : b);
              const critCount = enriched.filter(p => (p.adjusted[h.id] || 0) >= 70).length;
              return (
                <div key={h.id} style={{ background:T.surfaceH, borderRadius:8, padding:12, marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{h.icon} {h.name}</span>
                    <span style={{ fontSize:11, color:h.color, fontWeight:600 }}>Avg: {avgVal.toFixed(1)}</span>
                  </div>
                  <div style={{ height:6, background:T.border, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ width:`${avgVal}%`, height:'100%', background:h.color, borderRadius:3 }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut }}>
                    <span>Most exposed: {(maxProp.name || '').substring(0, 14)} ({(maxProp.adjusted[h.id] || 0).toFixed(0)})</span>
                    <span>{critCount} critical</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── 16. Scenario Comparison Panel ─────────────────────────────────────── */}
      <Section title="Scenario Comparison Matrix" badge="Selected Property across SSP x Horizon">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Composite risk scores for <strong>{selected?.name || 'selected property'}</strong> across all SSP scenario and time horizon combinations.
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', maxWidth:700 }}>
            <thead>
              <tr>
                <th style={thS}>Scenario / Horizon</th>
                {HORIZON_OPTIONS.map(h => <th key={h.id} style={{ ...thS, textAlign:'center' }}>{h.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SSP_OPTIONS.map((s, si) => {
                const pr = selected?.physicalRisk || {};
                return (
                  <tr key={s.id} style={{ background: si % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight:600 }}>{s.label} <span style={{ fontSize:10, color:T.textMut }}>({s.desc})</span></td>
                    {HORIZON_OPTIONS.map(h => {
                      const composite = HAZARDS.reduce((sum, hz) => sum + Math.min(100, (pr[hz.id] || 0) * s.multiplier * h.multiplier), 0) / HAZARDS.length;
                      const tier = getRiskTier(composite);
                      return (
                        <td key={h.id} style={{ ...tdS, textAlign:'center', background:tier.bg }}>
                          <div style={{ fontSize:16, fontWeight:700, color:tier.color }}>{composite.toFixed(1)}</div>
                          <div style={{ fontSize:9, color:tier.color }}>{tier.label}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 17. Portfolio Elevation & Coastal Profile ──────────────────────────── */}
      <Section title="Elevation & Coastal Proximity Profile" badge="Geographic Risk">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:12, marginBottom:16 }}>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Elevation Distribution</div>
            {[
              { range:'< 5m (Critical)', count: enriched.filter(p => (p.elevation_m || 25) < 5).length, color:T.red },
              { range:'5-15m (High Risk)', count: enriched.filter(p => { const e = p.elevation_m || 25; return e >= 5 && e < 15; }).length, color:'#f97316' },
              { range:'15-50m (Moderate)', count: enriched.filter(p => { const e = p.elevation_m || 25; return e >= 15 && e < 50; }).length, color:T.amber },
              { range:'50-100m (Low)', count: enriched.filter(p => { const e = p.elevation_m || 25; return e >= 50 && e < 100; }).length, color:T.green },
              { range:'> 100m (Minimal)', count: enriched.filter(p => (p.elevation_m || 25) >= 100).length, color:T.sage },
            ].map(b => (
              <div key={b.range} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:b.color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:T.textSec, flex:1 }}>{b.range}</span>
                <div style={{ width:80, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${enriched.length > 0 ? b.count / enriched.length * 100 : 0}%`, height:'100%', background:b.color, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:T.text, width:20, textAlign:'right' }}>{b.count}</span>
              </div>
            ))}
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Coastal Proximity</div>
            {[
              { range:'< 1km (Critical)', count: enriched.filter(p => (p.coastal_distance_km || 20) < 1).length, color:T.red },
              { range:'1-5km (High)', count: enriched.filter(p => { const d = p.coastal_distance_km || 20; return d >= 1 && d < 5; }).length, color:'#f97316' },
              { range:'5-20km (Moderate)', count: enriched.filter(p => { const d = p.coastal_distance_km || 20; return d >= 5 && d < 20; }).length, color:T.amber },
              { range:'20-50km (Low)', count: enriched.filter(p => { const d = p.coastal_distance_km || 20; return d >= 20 && d < 50; }).length, color:T.green },
              { range:'> 50km (Inland)', count: enriched.filter(p => (p.coastal_distance_km || 20) >= 50).length, color:T.sage },
            ].map(b => (
              <div key={b.range} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:b.color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:T.textSec, flex:1 }}>{b.range}</span>
                <div style={{ width:80, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${enriched.length > 0 ? b.count / enriched.length * 100 : 0}%`, height:'100%', background:b.color, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:T.text, width:20, textAlign:'right' }}>{b.count}</span>
              </div>
            ))}
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Key Statistics</div>
            {[
              { label:'Median Elevation', value:`${enriched.length > 0 ? [...enriched].sort((a, b) => (a.elevation_m || 25) - (b.elevation_m || 25))[Math.floor(enriched.length / 2)]?.elevation_m || 25 : 0}m` },
              { label:'Min Elevation', value:`${enriched.length > 0 ? Math.min(...enriched.map(p => p.elevation_m || 25)) : 0}m` },
              { label:'Max Elevation', value:`${enriched.length > 0 ? Math.max(...enriched.map(p => p.elevation_m || 25)) : 0}m` },
              { label:'Avg Coastal Dist.', value:`${enriched.length > 0 ? (enriched.reduce((s, p) => s + (p.coastal_distance_km || 20), 0) / enriched.length).toFixed(1) : 0} km` },
              { label:'Properties < 10m', value:`${enriched.filter(p => (p.elevation_m || 25) < 10).length} (${enriched.length > 0 ? (enriched.filter(p => (p.elevation_m || 25) < 10).length / enriched.length * 100).toFixed(0) : 0}%)` },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.textSec }}>{s.label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 18. Methodology & Assumptions ──────────────────────────────────────── */}
      <Section title="Methodology & Assumptions" badge="Technical Notes">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Data Sources</div>
            {[
              'IPCC AR6 Working Group II physical risk projections',
              'SSP scenario framework (Shared Socioeconomic Pathways)',
              'FEMA National Flood Hazard Layer (NFHL) for flood zoning',
              'Property-level geospatial coordinates and elevation data',
              'Historical insurance claims and actuarial loss models',
              'Building resilience assessments per ISO 22301',
            ].map((item, i) => (
              <div key={i} style={{ fontSize:11, color:T.textSec, marginBottom:4, paddingLeft:12, position:'relative' }}>
                <span style={{ position:'absolute', left:0 }}>&bull;</span>{item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Key Assumptions</div>
            {[
              'Composite risk = equal-weighted average of 6 hazard scores',
              'SSP multipliers: SSP1-2.6 (0.8x), SSP2-4.5 (1.0x), SSP5-8.5 (1.4x)',
              'Time horizon scaling: 2030 (1.0x), 2050 (1.3x), 2100 (1.8x)',
              'Climate VaR discount: composite/100 x 15% of GAV per property',
              'Insurance climate adjustment: premium x (1 + composite/100)',
              'Adaptation ROI calculated over 10-year investment horizon',
            ].map((item, i) => (
              <div key={i} style={{ fontSize:11, color:T.textSec, marginBottom:4, paddingLeft:12, position:'relative' }}>
                <span style={{ position:'absolute', left:0 }}>&bull;</span>{item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Limitations</div>
            {[
              'Hazard interactions (compound risk) use simplified linear models',
              'Insurance pricing does not reflect individual underwriter pricing',
              'Adaptation cost estimates are industry averages, not site-specific',
              'Sea level rise projections do not account for local land subsidence',
              'Building resilience scores may lack recent retrofit data',
              'Scenario projections carry inherent uncertainty ranges (not shown)',
            ].map((item, i) => (
              <div key={i} style={{ fontSize:11, color:T.textSec, marginBottom:4, paddingLeft:12, position:'relative' }}>
                <span style={{ position:'absolute', left:0 }}>&bull;</span>{item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 19. Top 5 Most Vulnerable Properties ─────────────────────────────── */}
      <Section title="Top 5 Most Vulnerable Properties" badge="Action Required">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          These properties face the highest climate-adjusted risk under current scenario ({SSP_OPTIONS.find(s => s.id === ssp)?.label}, {horizon}).
          Immediate adaptation planning is recommended.
        </div>
        {enriched.sort((a, b) => b.composite - a.composite).slice(0, 5).map((p, i) => (
          <div key={i} style={{ background: i === 0 ? '#fef2f2' : T.surfaceH, borderRadius:10, padding:16, marginBottom:10, border:`1px solid ${i === 0 ? T.red + '40' : T.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div>
                <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{i + 1}. {p.name || `Property ${p.idx + 1}`}</span>
                <span style={{ fontSize:11, color:T.textSec, marginLeft:8 }}>{p.type || 'Office'} &middot; {p.location || p.city || 'N/A'}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:p.tier.bg, color:p.tier.color }}>{p.tier.label} ({p.composite.toFixed(1)})</span>
                <span style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:p.resGrade.color + '20', color:p.resGrade.color }}>Resilience: {p.resGrade.grade}</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:6 }}>
              {HAZARDS.map(h => {
                const val = p.adjusted[h.id] || 0;
                return (
                  <div key={h.id} style={{ textAlign:'center', padding:'6px 4px', background:T.surface, borderRadius:6, border:`1px solid ${val >= 70 ? T.red + '40' : T.border}` }}>
                    <div style={{ fontSize:14 }}>{h.icon}</div>
                    <div style={{ fontSize:9, color:T.textMut, marginBottom:2 }}>{h.name.split(' ')[0]}</div>
                    <div style={{ fontSize:14, fontWeight:700, color: val >= 70 ? T.red : val >= 50 ? T.amber : val >= 30 ? T.textSec : T.green }}>{val.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:8, fontSize:11, color:T.textSec }}>
              <strong>Key Risks:</strong> {HAZARDS.filter(h => (p.adjusted[h.id] || 0) >= 60).map(h => h.name).join(', ') || 'No critical individual hazards'}
              {p.floodZone && p.floodZone !== 'X' && <span style={{ marginLeft:8, color:T.red }}>&bull; Flood Zone {p.floodZone}</span>}
              {(p.elevation_m || 25) < 10 && <span style={{ marginLeft:8, color:T.red }}>&bull; Low elevation ({p.elevation_m || 25}m)</span>}
              {(p.coastal_distance_km || 20) < 5 && <span style={{ marginLeft:8, color:T.amber }}>&bull; Near coast ({p.coastal_distance_km || 20}km)</span>}
            </div>
            <div style={{ marginTop:6, fontSize:11, color:T.sage }}>
              <strong>Recommended:</strong> {ADAPTATION_MEASURES.filter(m => m.applicable.some(h => (p.adjusted[h] || 0) > 50)).slice(0, 3).map(m => m.name).join(', ') || 'General resilience improvement'}
            </div>
          </div>
        ))}
      </Section>

      {/* ── 20. Insurance Cost Projection Chart ───────────────────────────────── */}
      <Section title="Portfolio Insurance Cost Projection" badge="2026-2040">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
          Projected annual insurance costs assuming climate-driven premium increases of 3-7% per annum depending on risk tier.
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={(() => {
            const totalBase = enriched.reduce((s, p) => s + (p.insurance_premium_usd || 50000), 0);
            const avgMult = enriched.reduce((s, p) => s + p.insuranceMult, 0) / enriched.length;
            const yrs = [];
            for (let y = 2026; y <= 2040; y++) {
              const t = y - 2026;
              yrs.push({
                year: y,
                baseline: Math.round(totalBase / 1e6 * 100) / 100,
                projected: Math.round(totalBase * Math.pow(1 + 0.03 * avgMult, t) / 1e6 * 100) / 100,
                highScenario: Math.round(totalBase * Math.pow(1 + 0.05 * avgMult, t) / 1e6 * 100) / 100,
              });
            }
            return yrs;
          })()} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize:10 }} />
            <YAxis tick={{ fontSize:10 }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={v => `$${v}M`} contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="baseline" stroke={T.textMut} fill="none" strokeDasharray="4 4" strokeWidth={1} name="Current Premium (flat)" />
            <Area type="monotone" dataKey="projected" stroke={T.amber} fill={T.amber} fillOpacity={0.12} strokeWidth={2} name="Climate-Adjusted (3-5% p.a.)" />
            <Area type="monotone" dataKey="highScenario" stroke={T.red} fill={T.red} fillOpacity={0.08} strokeWidth={2} name="High Scenario (5-7% p.a.)" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 21. Risk Trend Under Different Horizons ───────────────────────────── */}
      <Section title="Portfolio Risk Trajectory by Time Horizon" badge="Selected Property">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
          How the composite risk for <strong>{selected?.name || 'selected property'}</strong> evolves from 2030 to 2100 under each SSP pathway.
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={(() => {
            const pr = selected?.physicalRisk || {};
            return [2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100].map(y => {
              const tMult = 1 + (y - 2030) / 70 * 0.8;
              return {
                year: y,
                ssp126: Math.min(100, HAZARDS.reduce((s, h) => s + (pr[h.id] || 0) * 0.8 * tMult, 0) / HAZARDS.length),
                ssp245: Math.min(100, HAZARDS.reduce((s, h) => s + (pr[h.id] || 0) * 1.0 * tMult, 0) / HAZARDS.length),
                ssp585: Math.min(100, HAZARDS.reduce((s, h) => s + (pr[h.id] || 0) * 1.4 * tMult, 0) / HAZARDS.length),
              };
            });
          })()} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize:10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize:10 }} />
            <Tooltip formatter={v => v.toFixed(1)} contentStyle={{ fontSize:12, fontFamily:T.font }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="ssp126" stroke={T.green} fill={T.green} fillOpacity={0.1} strokeWidth={2} name="SSP1-2.6" />
            <Area type="monotone" dataKey="ssp245" stroke={T.amber} fill={T.amber} fillOpacity={0.1} strokeWidth={2} name="SSP2-4.5" />
            <Area type="monotone" dataKey="ssp585" stroke={T.red} fill={T.red} fillOpacity={0.1} strokeWidth={2} name="SSP5-8.5" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 22. Adaptation Portfolio Summary ───────────────────────────────────── */}
      <Section title="Portfolio-Wide Adaptation Summary" badge="Investment Overview">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:16 }}>
          {ADAPTATION_MEASURES.map(m => {
            const applicableProps = enriched.filter(p => m.applicable.some(h => (p.adjusted[h] || 0) > 40));
            const totalCost = applicableProps.length * m.cost_usd_mn;
            return (
              <div key={m.id} style={{ background:T.surfaceH, borderRadius:10, padding:14, borderLeft:`3px solid ${T.sage}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:4 }}>{m.name}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, marginBottom:4 }}>
                  <span>Eligible Properties</span>
                  <span style={{ fontWeight:600, color:T.text }}>{applicableProps.length}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, marginBottom:4 }}>
                  <span>Unit Cost</span>
                  <span style={{ fontWeight:600, color:T.text }}>${m.cost_usd_mn}M</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, marginBottom:4 }}>
                  <span>Total Portfolio Cost</span>
                  <span style={{ fontWeight:700, color:T.navy }}>${totalCost.toFixed(1)}M</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec }}>
                  <span>Risk Reduction</span>
                  <span style={{ fontWeight:600, color:T.green }}>-{m.risk_reduction_pct}%</span>
                </div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>Targets: {m.applicable.join(', ')}</div>
              </div>
            );
          })}
        </div>
        <div style={{ background:T.surfaceH, borderRadius:8, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:600, color:T.text }}>Total Portfolio Adaptation Budget Required</span>
          <span style={{ fontSize:20, fontWeight:800, color:T.navy }}>${(agg.totalAdaptCost || 0).toFixed(1)}M</span>
        </div>
      </Section>

      {/* ── 23. Property Type Risk Breakdown ─────────────────────────────────── */}
      <Section title="Risk by Property Type" badge="Segmentation">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Average composite risk and hazard exposure by property type within the portfolio.
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={thS}>Property Type</th>
                <th style={{ ...thS, textAlign:'center' }}># Properties</th>
                <th style={{ ...thS, textAlign:'center' }}>Avg Composite</th>
                {HAZARDS.map(h => <th key={h.id} style={{ ...thS, textAlign:'center' }}>{h.icon}</th>)}
                <th style={{ ...thS, textAlign:'center' }}>Avg Resilience</th>
                <th style={{ ...thS, textAlign:'center' }}>Avg Premium</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const types = {};
                enriched.forEach(p => {
                  const t = p.type || 'Office';
                  if (!types[t]) types[t] = [];
                  types[t].push(p);
                });
                return Object.entries(types).sort((a, b) => {
                  const avgA = a[1].reduce((s, p) => s + p.composite, 0) / a[1].length;
                  const avgB = b[1].reduce((s, p) => s + p.composite, 0) / b[1].length;
                  return avgB - avgA;
                }).map(([type, props], i) => {
                  const avgComp = props.reduce((s, p) => s + p.composite, 0) / props.length;
                  const tier = getRiskTier(avgComp);
                  return (
                    <tr key={type} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdS, fontWeight:600 }}>{type}</td>
                      <td style={{ ...tdS, textAlign:'center' }}>{props.length}</td>
                      <td style={{ ...tdS, textAlign:'center' }}>
                        <span style={{ fontWeight:700, color:tier.color }}>{avgComp.toFixed(1)}</span>
                      </td>
                      {HAZARDS.map(h => {
                        const avg = props.reduce((s, p) => s + (p.adjusted[h.id] || 0), 0) / props.length;
                        return (
                          <td key={h.id} style={{ ...tdS, textAlign:'center', color: avg >= 70 ? T.red : avg >= 50 ? T.amber : avg >= 30 ? T.textSec : T.green, fontSize:11 }}>
                            {avg.toFixed(0)}
                          </td>
                        );
                      })}
                      <td style={{ ...tdS, textAlign:'center' }}>
                        {(props.reduce((s, p) => s + p.resilience, 0) / props.length).toFixed(0)}
                      </td>
                      <td style={{ ...tdS, textAlign:'center' }}>
                        {fmtUsd(props.reduce((s, p) => s + (p.insurance_premium_usd || 50000), 0) / props.length)}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 24. Risk Appetite Framework ────────────────────────────────────────── */}
      <Section title="Risk Appetite & Tolerance Framework" badge="Governance">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Portfolio Risk Tolerances</div>
            {[
              { metric:'Max Composite Risk (any property)', threshold:'< 80', actual: enriched.length > 0 ? Math.max(...enriched.map(p => p.composite)).toFixed(1) : '0', breach: enriched.some(p => p.composite >= 80) },
              { metric:'Avg Portfolio Composite', threshold:'< 50', actual: (agg.avgComposite || 0).toFixed(1), breach: (agg.avgComposite || 0) >= 50 },
              { metric:'Critical Risk Properties', threshold:'< 10%', actual: `${enriched.length > 0 ? ((agg.criticalCount || 0) / enriched.length * 100).toFixed(0) : 0}%`, breach: enriched.length > 0 && (agg.criticalCount || 0) / enriched.length >= 0.1 },
              { metric:'Avg Resilience Score', threshold:'> 60', actual: (agg.avgResilience || 0).toFixed(0), breach: (agg.avgResilience || 0) < 60 },
              { metric:'Flood Zone A/AE/V Exposure', threshold:'< 15%', actual: `${enriched.length > 0 ? ((agg.highFloodZones || 0) / enriched.length * 100).toFixed(0) : 0}%`, breach: enriched.length > 0 && (agg.highFloodZones || 0) / enriched.length >= 0.15 },
              { metric:'Climate VaR (% of GAV)', threshold:'< 8%', actual: `${enriched.length > 0 ? ((agg.totalVaR || 0) / enriched.reduce((s, p) => s + (p.gav_usd || p.value_usd || 50e6), 0) * 100).toFixed(1) : 0}%`, breach: false },
            ].map((r, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.textSec, flex:1 }}>{r.metric}</span>
                <span style={{ fontSize:11, color:T.textMut, width:60, textAlign:'center' }}>{r.threshold}</span>
                <span style={{ fontSize:12, fontWeight:700, color: r.breach ? T.red : T.green, width:60, textAlign:'right' }}>{r.actual}</span>
                <span style={{ marginLeft:8, fontSize:14 }}>{r.breach ? '\u26A0\uFE0F' : '\u2705'}</span>
              </div>
            ))}
          </div>
          <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:10 }}>Risk Response Strategy</div>
            {[
              { action:'Accept', desc:'Low-risk properties (composite < 30) with adequate resilience and insurance coverage', color:T.green },
              { action:'Mitigate', desc:'Medium-risk properties (30-50) with cost-effective adaptation measures available', color:T.amber },
              { action:'Transfer', desc:'High-risk properties (50-70) where insurance or hedging instruments can offset losses', color:'#f97316' },
              { action:'Avoid', desc:'Critical-risk properties (> 70) where divestment or major retrofit is recommended', color:T.red },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom:10, padding:10, background:T.surface, borderRadius:6, borderLeft:`3px solid ${s.color}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:s.color, marginBottom:2 }}>{s.action}</div>
                <div style={{ fontSize:10, color:T.textSec, lineHeight:1.4 }}>{s.desc}</div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>
                  Properties: {enriched.filter(p => {
                    if (s.action === 'Accept') return p.composite < 30;
                    if (s.action === 'Mitigate') return p.composite >= 30 && p.composite < 50;
                    if (s.action === 'Transfer') return p.composite >= 50 && p.composite < 70;
                    return p.composite >= 70;
                  }).length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 25. Summary Statistics Panel ───────────────────────────────────────── */}
      <Section title="Executive Summary Statistics" badge="Portfolio Overview">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
          {[
            { cat:'Portfolio Composition', items:[
              { l:'Total Properties', v:enriched.length },
              { l:'Property Types', v:[...new Set(enriched.map(p => p.type || 'Office'))].length },
              { l:'Total GAV', v:fmtUsd(enriched.reduce((s, p) => s + (p.gav_usd || p.value_usd || 50e6), 0)) },
              { l:'Avg Property Value', v:fmtUsd(enriched.reduce((s, p) => s + (p.gav_usd || p.value_usd || 50e6), 0) / enriched.length) },
            ]},
            { cat:'Risk Profile', items:[
              { l:'Portfolio Avg Composite', v:fmt(agg.avgComposite) },
              { l:'Std Deviation', v:fmt(Math.sqrt(enriched.reduce((s, p) => s + Math.pow(p.composite - (agg.avgComposite || 0), 2), 0) / enriched.length)) },
              { l:'Max Risk Property', v:(agg.mostExposed?.name || '').substring(0, 16) },
              { l:'Concentration (top 5 risk)', v:`${enriched.length > 0 ? (enriched.sort((a, b) => b.composite - a.composite).slice(0, 5).reduce((s, p) => s + p.composite, 0) / enriched.reduce((s, p) => s + p.composite, 0) * 100).toFixed(0) : 0}%` },
            ]},
            { cat:'Financial Impact', items:[
              { l:'Total Climate VaR', v:fmtUsd(agg.totalVaR || 0) },
              { l:'Total Insurance Cost', v:fmtUsd(enriched.reduce((s, p) => s + (p.insurance_premium_usd || 50000), 0)) },
              { l:'Climate Premium Uplift', v:fmtUsd(enriched.reduce((s, p) => s + (p.climateAdjPremium - (p.insurance_premium_usd || 50000)), 0)) },
              { l:'Adaptation Budget', v:`$${(agg.totalAdaptCost || 0).toFixed(1)}M` },
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

      {/* ── 26. Per-Property Hazard Score Editor ─────────────────────────────── */}
      <Section title={`Hazard Score Editor: ${selected?.name || 'Selected Property'}`} badge="Manual Override">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Manually adjust individual hazard scores (0-100) for the selected property. Changes are saved to localStorage and recalculate all downstream metrics in real-time.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:12, marginBottom:12 }}>
          {HAZARDS.map(h => {
            const propId = selected?.id || `prop_${selectedIdx}`;
            const overrideVal = hazardOverrides[propId]?.[h.id];
            const baseVal = selected?.physicalRisk?.[h.id] || 0;
            const currentVal = overrideVal !== undefined ? overrideVal : baseVal;
            const displayVal = selected?.adjusted?.[h.id] || 0;
            const indicatorColor = currentVal < 30 ? T.green : currentVal < 60 ? T.amber : T.red;
            return (
              <div key={h.id} style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{h.icon} {h.name}</span>
                  <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:indicatorColor+'20', color:indicatorColor, fontWeight:600 }}>
                    {currentVal < 30 ? 'Low' : currentVal < 60 ? 'Medium' : 'High'} ({currentVal})
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="range" min={0} max={100} step={1} value={currentVal}
                    onChange={e => updateHazardScore(propId, h.id, e.target.value)}
                    style={{ flex:1, cursor:'pointer', accentColor:indicatorColor }} />
                  <input type="number" min={0} max={100} value={currentVal}
                    onChange={e => updateHazardScore(propId, h.id, e.target.value)}
                    style={{ width:52, padding:'4px 6px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, textAlign:'center', color:T.text }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut, marginTop:4 }}>
                  <span>Base: {baseVal} | Adjusted (SSP+Horizon): {displayVal.toFixed(0)}</span>
                  <span style={{ color:h.color }}>{h.type}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => resetHazardOverrides(selected?.id || `prop_${selectedIdx}`)}
          style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.red, fontFamily:T.font }}>
          Reset All Hazards to Default
        </button>
      </Section>

      {/* ── 27. Resilience Upgrade Planner ──────────────────────────────────────── */}
      <Section title={`Resilience Upgrade Planner: ${selected?.name || ''}`} badge="Toggle Adaptations">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Toggle adaptation measures ON/OFF to see real-time impact on hazard scores and composite risk.
          Active measures reduce hazard scores and update the radar chart instantly.
        </div>
        {(() => {
          const propId = selected?.id || `prop_${selectedIdx}`;
          const propAdapt = adaptations[propId] || [];
          const pr = selected?.physicalRisk || {};
          const totalCost = propAdapt.reduce((s, mId) => { const m = ADAPTATION_MEASURES.find(x => x.id === mId); return s + (m?.cost_usd_mn || 0); }, 0);
          return (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:10, marginBottom:16 }}>
                {ADAPTATION_MEASURES.map(m => {
                  const isActive = propAdapt.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => toggleAdaptation(propId, m.id)}
                      style={{ background: isActive ? T.sage+'15' : T.surface, borderRadius:10, padding:14, border:`2px solid ${isActive ? T.sage : T.border}`, cursor:'pointer', transition:'all 0.2s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color: isActive ? T.sage : T.text }}>{m.name}</span>
                        <span style={{ fontSize:18 }}>{isActive ? '\u2705' : '\u2B1C'}</span>
                      </div>
                      <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>
                        Cost: <strong>${m.cost_usd_mn}M</strong> | Reduction: <strong style={{ color:T.green }}>-{m.risk_reduction_pct}%</strong>
                      </div>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {m.applicable.map(hId => {
                          const hz = HAZARDS.find(h => h.id === hId);
                          return (
                            <span key={hId} style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:hz?.color+'18', color:hz?.color, fontWeight:600 }}>
                              {hz?.icon} {hz?.name.split(' ')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>Active Adaptations: {propAdapt.length} / {ADAPTATION_MEASURES.length}</span>
                  <span style={{ fontSize:11, color:T.textSec, marginLeft:12 }}>Total Cost: <strong style={{ color:T.navy }}>${totalCost.toFixed(1)}M</strong></span>
                </div>
                <div style={{ fontSize:12 }}>
                  <span style={{ color:T.textSec }}>Composite Risk: </span>
                  <span style={{ fontWeight:700, color:selected?.tier?.color || T.text }}>{selected?.composite?.toFixed(1) || 0}</span>
                  <span style={{ color:T.textSec }}> ({selected?.tier?.label || 'N/A'})</span>
                </div>
              </div>
            </>
          );
        })()}
      </Section>

      {/* ── 28. Insurance Premium Editor ────────────────────────────────────────── */}
      <Section title={`Insurance Premium Editor: ${selected?.name || ''}`} badge="Cost Modeling">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
          {(() => {
            const propId = selected?.id || `prop_${selectedIdx}`;
            const basePrem = selected?.insurance_premium_usd || 50000;
            const costPerSqm = basePrem / ((selected?.area_sqm || selected?.gfa_sqm || 5000));
            const totalPortfolioInsurance = enriched.reduce((s, p) => s + (p.insurance_premium_usd || 50000), 0);
            return (
              <>
                <div style={{ background:T.surfaceH, borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Annual Premium (USD)</div>
                  <input type="number" min={0} step={1000} value={basePrem}
                    onChange={e => updateInsurance(propId, e.target.value)}
                    style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:16, fontWeight:700, fontFamily:T.font, color:T.navy }} />
                  <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>Cost per m2: ${costPerSqm.toFixed(2)}/m2</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:10, padding:16, textAlign:'center' }}>
                  <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Climate-Adjusted Premium</div>
                  <div style={{ fontSize:24, fontWeight:800, color:T.amber }}>{fmtUsd(selected?.climateAdjPremium || 0)}</div>
                  <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>Multiplier: {(selected?.insuranceMult || 1).toFixed(2)}x</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:10, padding:16, textAlign:'center' }}>
                  <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Portfolio Total Insurance</div>
                  <div style={{ fontSize:24, fontWeight:800, color:T.navy }}>{fmtUsd(totalPortfolioInsurance)}</div>
                  <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>{enriched.length} properties</div>
                </div>
              </>
            );
          })()}
        </div>
      </Section>

      {/* ── 29. Building Metadata Editor ────────────────────────────────────────── */}
      <Section title={`Building Metadata: ${selected?.name || ''}`} badge="Property Details">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Edit building metadata for the selected property. Changes persist to localStorage and affect risk calculations.
        </div>
        {(() => {
          const propId = selected?.id || `prop_${selectedIdx}`;
          const meta = metadataOverrides[propId] || {};
          const inputS = { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.text, width:'100%' };
          return (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:4 }}>Elevation (m)</div>
                <input type="number" min={0} step={1} value={selected?.elevation_m || 25}
                  onChange={e => updateMetadata(propId, 'elevation_m', Number(e.target.value))}
                  style={inputS} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:4 }}>Coastal Distance (km)</div>
                <input type="number" min={0} step={0.5} value={selected?.coastal_distance_km || 20}
                  onChange={e => updateMetadata(propId, 'coastal_distance_km', Number(e.target.value))}
                  style={inputS} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:4 }}>Year Built</div>
                <input type="number" min={1800} max={2026} value={selected?.year_built || 2000}
                  onChange={e => updateMetadata(propId, 'year_built', Number(e.target.value))}
                  style={inputS} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:4 }}>Construction Type</div>
                <select value={selected?.construction_type || 'Concrete'}
                  onChange={e => updateMetadata(propId, 'construction_type', e.target.value)}
                  style={{ ...inputS, cursor:'pointer' }}>
                  {['Concrete','Steel Frame','Timber','Masonry','Mixed','Prefab','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:4 }}>FEMA Flood Zone</div>
                <select value={selected?.floodZone || 'X'}
                  onChange={e => updateMetadata(propId, 'floodZone', e.target.value)}
                  style={{ ...inputS, cursor:'pointer' }}>
                  {['A','AE','X','V','VE','B','C','D'].map(z => <option key={z} value={z}>Zone {z}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:4 }}>Backup Power</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
                  <button onClick={() => updateMetadata(propId, 'backup_power', !(selected?.backup_power))}
                    style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative',
                      background: selected?.backup_power ? T.green : T.borderL, transition:'background 0.2s' }}>
                    <span style={{ position:'absolute', top:2, left: selected?.backup_power ? 22 : 2, width:20, height:20, borderRadius:10, background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                  <span style={{ fontSize:12, fontWeight:600, color: selected?.backup_power ? T.green : T.textMut }}>{selected?.backup_power ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* ── 30. Risk Appetite Framework (Editable) ──────────────────────────────── */}
      <Section title="Risk Appetite Framework (Editable Thresholds)" badge="Governance">
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
          Set portfolio-level risk tolerance thresholds. Properties violating any threshold are flagged in the register below.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12, marginBottom:16 }}>
          {[
            { key:'maxCompositeRisk', label:'Max Composite Risk (any property)', min:30, max:100, step:5, unit:'' },
            { key:'maxAcuteExposure', label:'Max Acute Exposure (% of portfolio)', min:10, max:100, step:5, unit:'%' },
            { key:'maxInsuranceCost', label:'Max Total Annual Insurance ($)', min:500000, max:20000000, step:500000, unit:'$', fmt:fmtUsd },
            { key:'minResilienceScore', label:'Min Resilience Score (per property)', min:10, max:90, step:5, unit:'' },
          ].map(item => (
            <div key={item.key} style={{ background:T.surfaceH, borderRadius:10, padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, fontWeight:600, color:T.text }}>{item.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>
                  {item.fmt ? item.fmt(riskAppetite[item.key]) : `${riskAppetite[item.key]}${item.unit}`}
                </span>
              </div>
              <input type="range" min={item.min} max={item.max} step={item.step} value={riskAppetite[item.key]}
                onChange={e => updateRiskAppetite(item.key, e.target.value)}
                style={{ width:'100%', cursor:'pointer', accentColor:T.navy }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:T.textMut, marginTop:2 }}>
                <span>{item.fmt ? item.fmt(item.min) : `${item.min}${item.unit}`}</span>
                <span>{item.fmt ? item.fmt(item.max) : `${item.max}${item.unit}`}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Flagged Properties */}
        {(() => {
          const totalInsurance = enriched.reduce((s, p) => s + (p.insurance_premium_usd || 50000), 0);
          const acuteExposedPct = enriched.length > 0 ? enriched.filter(p => p.acuteAvg >= 50).length / enriched.length * 100 : 0;
          const flagged = enriched.filter(p =>
            p.composite >= riskAppetite.maxCompositeRisk ||
            p.resilience < riskAppetite.minResilienceScore
          );
          const portfolioBreaches = [];
          if (acuteExposedPct > riskAppetite.maxAcuteExposure) portfolioBreaches.push(`Acute exposure ${acuteExposedPct.toFixed(0)}% exceeds ${riskAppetite.maxAcuteExposure}% threshold`);
          if (totalInsurance > riskAppetite.maxInsuranceCost) portfolioBreaches.push(`Total insurance ${fmtUsd(totalInsurance)} exceeds ${fmtUsd(riskAppetite.maxInsuranceCost)} threshold`);
          return (
            <>
              {portfolioBreaches.length > 0 && (
                <div style={{ background:'#fef2f2', borderRadius:8, padding:12, marginBottom:12, border:`1px solid ${T.red}30` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.red, marginBottom:4 }}>Portfolio-Level Breaches</div>
                  {portfolioBreaches.map((b, i) => <div key={i} style={{ fontSize:11, color:T.red, marginBottom:2 }}>- {b}</div>)}
                </div>
              )}
              {flagged.length > 0 && (
                <div style={{ overflowX:'auto' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.red, marginBottom:8 }}>Flagged Properties ({flagged.length})</div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['Property','Composite','Resilience','Tier','Violations'].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {flagged.map((p, i) => {
                        const violations = [];
                        if (p.composite >= riskAppetite.maxCompositeRisk) violations.push(`Composite ${p.composite.toFixed(1)} >= ${riskAppetite.maxCompositeRisk}`);
                        if (p.resilience < riskAppetite.minResilienceScore) violations.push(`Resilience ${p.resilience} < ${riskAppetite.minResilienceScore}`);
                        return (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fef2f2' : '#fff5f5' }}>
                            <td style={{ ...tdS, fontWeight:600 }}>{(p.name || `Property ${p.idx+1}`).substring(0, 22)}</td>
                            <td style={tdS}><span style={{ fontWeight:700, color:p.tier.color }}>{p.composite.toFixed(1)}</span></td>
                            <td style={tdS}><span style={{ fontWeight:600, color:p.resGrade.color }}>{p.resilience}</span></td>
                            <td style={tdS}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:p.tier.bg, color:p.tier.color }}>{p.tier.label}</span></td>
                            <td style={{ ...tdS, fontSize:11, color:T.red }}>{violations.join(' | ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {flagged.length === 0 && portfolioBreaches.length === 0 && (
                <div style={{ textAlign:'center', padding:16, color:T.green, fontSize:13, fontWeight:600 }}>All properties and portfolio metrics within risk appetite thresholds.</div>
              )}
            </>
          );
        })()}
      </Section>

      {/* ── 31. Cross-Navigation ──────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:8 }}>
        {[
          { label:'CRREM Analysis', path:'/crrem' },
          { label:'Climate Transition Risk', path:'/climate-transition-risk' },
          { label:'RE Dashboard', path:'/re-dashboard' },
          { label:'GRESB Scoring', path:'/gresb-scoring' },
          { label:'Climate Insurance', path:'/climate-insurance' },
        ].map(nav => (
          <button key={nav.path} onClick={() => navigate(nav.path)} style={{
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 18px', fontSize:12, fontWeight:500, cursor:'pointer', color:T.navy, fontFamily:T.font,
          }}>{nav.label} &rarr;</button>
        ))}
      </div>
    </div>
  );
}
