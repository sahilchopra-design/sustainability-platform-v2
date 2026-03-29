/**
 * EP-U3 — DME NGFS Scenario Engine
 * Sprint U — DME Platform Port
 *
 * 6 NGFS Phase IV scenarios with full PD/VaR/WACC/EL/Stranding computation,
 * sector transition pathways, timeline evolution, and stranded asset analysis.
 * Reads: ra_portfolio_v1
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = seed => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, off = 0) => seededRandom(seed + off);
const fmt = (v, d = 1) => v == null ? '—' : typeof v === 'number' ? (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(d)) : v;
const pct = (v, d = 1) => v == null ? '—' : `${v.toFixed(d)}%`;
const usd = v => v == null ? '—' : `$${fmt(v, 1)}m`;
const readLS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const LS_PORTFOLIO = 'ra_portfolio_v1';

/* ── NGFS Phase IV Scenarios ───────────────────────────────────────────────── */
const NGFS_SCENARIOS = [
  { id:'net_zero_2050', name:'Net Zero 2050', category:'Orderly', color:'#16a34a', temp:'1.5°C', physical_weight:0.2, transition_weight:0.8, carbon_price_2030:130, carbon_price_2050:250, emissions_2030:-45, emissions_2050:-100, renewable_2050:90, gdp_impact:-1.5, sea_level_2100:43 },
  { id:'below_2c', name:'Below 2°C', category:'Orderly', color:'#2563eb', temp:'1.7°C', physical_weight:0.35, transition_weight:0.65, carbon_price_2030:80, carbon_price_2050:200, emissions_2030:-25, emissions_2050:-85, renewable_2050:75, gdp_impact:-2.0, sea_level_2100:55 },
  { id:'ndcs', name:'NDCs (Current Pledges)', category:'Hot House', color:'#d97706', temp:'2.5°C', physical_weight:0.7, transition_weight:0.3, carbon_price_2030:30, carbon_price_2050:50, emissions_2030:-10, emissions_2050:-30, renewable_2050:45, gdp_impact:-4.5, sea_level_2100:82 },
  { id:'delayed_transition', name:'Delayed Transition', category:'Disorderly', color:'#dc2626', temp:'1.8°C', physical_weight:0.4, transition_weight:0.6, carbon_price_2030:20, carbon_price_2050:350, emissions_2030:0, emissions_2050:-90, renewable_2050:70, gdp_impact:-3.5, sea_level_2100:60 },
  { id:'divergent_net_zero', name:'Divergent Net Zero', category:'Disorderly', color:'#7c3aed', temp:'1.5°C', physical_weight:0.25, transition_weight:0.75, carbon_price_2030:150, carbon_price_2050:300, emissions_2030:-40, emissions_2050:-100, renewable_2050:85, gdp_impact:-2.5, sea_level_2100:45 },
  { id:'current_policies', name:'Current Policies', category:'Hot House', color:'#991b1b', temp:'3.0°C', physical_weight:0.85, transition_weight:0.15, carbon_price_2030:10, carbon_price_2050:15, emissions_2030:5, emissions_2050:10, renewable_2050:30, gdp_impact:-8.0, sea_level_2100:110 },
];

/* ── Sector Transition Pathways (all 11 GICS sectors) ──────────────────────── */
const SECTOR_PATHWAYS = {
  Energy:                   { carbon_price_sensitivity:0.85, stranded_asset_risk:0.75, capex_requirement:15, workforce_transition:25, tech_readiness:0.6,  peak_risk_year:2030 },
  Materials:                { carbon_price_sensitivity:0.72, stranded_asset_risk:0.55, capex_requirement:12, workforce_transition:18, tech_readiness:0.45, peak_risk_year:2032 },
  Utilities:                { carbon_price_sensitivity:0.80, stranded_asset_risk:0.65, capex_requirement:20, workforce_transition:15, tech_readiness:0.7,  peak_risk_year:2028 },
  Financials:               { carbon_price_sensitivity:0.30, stranded_asset_risk:0.20, capex_requirement:3,  workforce_transition:5,  tech_readiness:0.8,  peak_risk_year:2035 },
  'Information Technology':  { carbon_price_sensitivity:0.15, stranded_asset_risk:0.05, capex_requirement:5,  workforce_transition:8,  tech_readiness:0.95, peak_risk_year:2040 },
  'Health Care':             { carbon_price_sensitivity:0.25, stranded_asset_risk:0.10, capex_requirement:4,  workforce_transition:6,  tech_readiness:0.85, peak_risk_year:2038 },
  'Consumer Discretionary':  { carbon_price_sensitivity:0.40, stranded_asset_risk:0.20, capex_requirement:8,  workforce_transition:12, tech_readiness:0.65, peak_risk_year:2033 },
  'Consumer Staples':        { carbon_price_sensitivity:0.35, stranded_asset_risk:0.15, capex_requirement:6,  workforce_transition:10, tech_readiness:0.70, peak_risk_year:2034 },
  Industrials:              { carbon_price_sensitivity:0.60, stranded_asset_risk:0.40, capex_requirement:14, workforce_transition:20, tech_readiness:0.55, peak_risk_year:2031 },
  'Communication Services':  { carbon_price_sensitivity:0.10, stranded_asset_risk:0.03, capex_requirement:3,  workforce_transition:4,  tech_readiness:0.92, peak_risk_year:2042 },
  'Real Estate':             { carbon_price_sensitivity:0.45, stranded_asset_risk:0.30, capex_requirement:10, workforce_transition:8,  tech_readiness:0.60, peak_risk_year:2032 },
};

const CATEGORY_COLORS = { Orderly: T.green, Disorderly: T.amber, 'Hot House': T.red };

/* ── Scenario PD / Stranding Calculations (from dme-platform) ──────────────── */
function scenarioAdjustedPD(basePD, sectorMult, physWeight, transWeight, physExposure, transExposure) {
  return basePD * sectorMult * (1 + physWeight * physExposure + transWeight * transExposure);
}
function strandedAssetProbability(fossilRevPct, carbonPrice, carbonIntensity, timeHorizon) {
  const exposureFactor = fossilRevPct * carbonIntensity * carbonPrice / 1e6;
  return Math.min(0.99, 1 - Math.exp(-exposureFactor * timeHorizon / 10));
}
function computeWACC(basePD, scenarioPD, baseWACC) {
  const pdDelta = scenarioPD - basePD;
  return baseWACC + pdDelta * 0.5;
}
function computeVaR(exposure, scenarioPD, confidence) {
  const lgd = 0.45;
  return exposure * scenarioPD * lgd * confidence;
}
function computeEL(exposure, scenarioPD) {
  return exposure * scenarioPD * 0.45;
}
function valuationImpact(exposure, scenarioPD, basePD) {
  return -exposure * (scenarioPD - basePD) * 2.5;
}

/* ── Build portfolio holdings ──────────────────────────────────────────────── */
function buildHoldings(companies) {
  return companies.slice(0, 60).map((c, i) => {
    const h = hashStr(c.ticker || c.name || `co${i}`);
    const exposure = (c.market_cap_usd_mn || 500) * (0.01 + sr(h, 1) * 0.04);
    const basePD = 0.005 + sr(h, 2) * 0.04;
    const baseWACC = 0.06 + sr(h, 3) * 0.06;
    const physExposure = 0.1 + sr(h, 4) * 0.6;
    const transExposure = 0.1 + sr(h, 5) * 0.7;
    const fossilRevPct = c.sector === 'Energy' ? 0.4 + sr(h, 6) * 0.5 : c.sector === 'Utilities' ? 0.2 + sr(h, 6) * 0.4 : sr(h, 6) * 0.15;
    const carbonIntensity = (c.ghg_intensity_tco2e_per_mn || 200 + sr(h, 7) * 800);
    return {
      ticker: c.ticker || `CO${i}`,
      name: c.name || `Company ${i}`,
      sector: c.sector || 'Industrials',
      exchange: c._displayExchange || 'NSE/BSE',
      exposure_usd_mn: Math.round(exposure * 10) / 10,
      basePD, baseWACC, physExposure, transExposure,
      fossilRevPct: Math.round(fossilRevPct * 100) / 100,
      carbonIntensity: Math.round(carbonIntensity),
      esg_score: c.esg_score || 50,
      transition_risk_score: c.transition_risk_score || 50,
    };
  });
}

/* ── Interpolate scenario values for timeline ──────────────────────────────── */
function interpolateHorizon(sc, horizon) {
  if (horizon === 2030) return { carbonPrice: sc.carbon_price_2030, emissions: sc.emissions_2030 };
  if (horizon === 2050) return { carbonPrice: sc.carbon_price_2050, emissions: sc.emissions_2050 };
  const t = (horizon - 2030) / 20;
  return {
    carbonPrice: sc.carbon_price_2030 + t * (sc.carbon_price_2050 - sc.carbon_price_2030),
    emissions: sc.emissions_2030 + t * (sc.emissions_2050 - sc.emissions_2030),
  };
}

/* ── Shared UI ─────────────────────────────────────────────────────────────── */
const Badge = ({ label, color }) => (
  <span style={{ fontSize:10, fontWeight:700, color, background:`${color}18`, border:`1px solid ${color}44`, borderRadius:4, padding:'2px 8px', letterSpacing:0.3 }}>{label}</span>
);
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${accent || T.border}`, borderRadius:10, padding:'14px 16px', borderTop: accent ? `3px solid ${accent}` : undefined, minWidth:140 }}>
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
export default function DmeScenariosPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const portfolioData = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  }, []);
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 120), []);

  const [horizon, setHorizon] = useState(2030);
  const [selectedScenario, setSelectedScenario] = useState('net_zero_2050');
  const [mode, setMode] = useState('portfolio'); // 'portfolio' | 'entity'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /* Build holdings from GLOBAL_COMPANY_MASTER */
  const holdings = useMemo(() => buildHoldings(companies), [companies]);
  const filteredHoldings = useMemo(() => {
    if (!searchTerm) return holdings;
    const q = searchTerm.toLowerCase();
    return holdings.filter(h => h.name.toLowerCase().includes(q) || h.ticker.toLowerCase().includes(q));
  }, [holdings, searchTerm]);

  /* Compute scenario results for all 6 scenarios × all holdings */
  const scenarioResults = useMemo(() => {
    if (!hasRun) return null;
    const targetHoldings = mode === 'entity' && selectedEntity
      ? holdings.filter(h => h.ticker === selectedEntity)
      : holdings;

    return NGFS_SCENARIOS.map(sc => {
      const { carbonPrice } = interpolateHorizon(sc, horizon);
      const timeH = (horizon - 2025) / 5;
      let totalExposure = 0, totalEL = 0, totalVaR = 0, weightedPD = 0, weightedWACC = 0, totalValImpact = 0;
      const entityResults = targetHoldings.map(h => {
        const sp = SECTOR_PATHWAYS[h.sector] || SECTOR_PATHWAYS['Industrials'];
        const sectorMult = 1 + sp.carbon_price_sensitivity * (carbonPrice / 100);
        const scenPD = scenarioAdjustedPD(h.basePD, sectorMult, sc.physical_weight, sc.transition_weight, h.physExposure, h.transExposure);
        const var95 = computeVaR(h.exposure_usd_mn, scenPD, 1.65);
        const el = computeEL(h.exposure_usd_mn, scenPD);
        const wacc = computeWACC(h.basePD, scenPD, h.baseWACC);
        const strandProb = strandedAssetProbability(h.fossilRevPct, carbonPrice, h.carbonIntensity / 1000, timeH);
        const valImp = valuationImpact(h.exposure_usd_mn, scenPD, h.basePD);
        totalExposure += h.exposure_usd_mn;
        totalEL += el;
        totalVaR += var95;
        weightedPD += scenPD * h.exposure_usd_mn;
        weightedWACC += wacc * h.exposure_usd_mn;
        totalValImpact += valImp;
        return { ...h, scenPD, var95, el, wacc, strandProb, valImp };
      });
      return {
        scenario: sc,
        avgPD: totalExposure > 0 ? weightedPD / totalExposure : 0,
        avgWACC: totalExposure > 0 ? weightedWACC / totalExposure : 0,
        totalVaR, totalEL, totalValImpact, totalExposure,
        entityResults,
      };
    });
  }, [hasRun, holdings, horizon, mode, selectedEntity]);

  /* Timeline data for selected scenario */
  const timelineData = useMemo(() => {
    if (!hasRun) return [];
    const sc = NGFS_SCENARIOS.find(s => s.id === selectedScenario) || NGFS_SCENARIOS[0];
    return [2025, 2030, 2035, 2040, 2045, 2050].map(yr => {
      const { carbonPrice, emissions } = yr <= 2030
        ? { carbonPrice: sc.carbon_price_2030 * ((yr - 2025) / 5), emissions: sc.emissions_2030 * ((yr - 2025) / 5) }
        : interpolateHorizon(sc, yr);
      const timeH = (yr - 2025) / 5;
      let totalPD = 0, totalExp = 0, totalVaR = 0;
      holdings.slice(0, 20).forEach(h => {
        const sp = SECTOR_PATHWAYS[h.sector] || SECTOR_PATHWAYS['Industrials'];
        const sectorMult = 1 + sp.carbon_price_sensitivity * (carbonPrice / 100);
        const scenPD = scenarioAdjustedPD(h.basePD, sectorMult, sc.physical_weight, sc.transition_weight, h.physExposure * (timeH / 5), h.transExposure * (timeH / 5));
        totalPD += scenPD * h.exposure_usd_mn;
        totalExp += h.exposure_usd_mn;
        totalVaR += computeVaR(h.exposure_usd_mn, scenPD, 1.65);
      });
      return { year: yr, avgPD: totalExp > 0 ? (totalPD / totalExp) * 100 : 0, totalVaR: Math.round(totalVaR * 10) / 10, carbonPrice: Math.round(carbonPrice), emissions: Math.round(emissions) };
    });
  }, [hasRun, selectedScenario, holdings]);

  /* Sector comparison data */
  const sectorComparison = useMemo(() => {
    return Object.entries(SECTOR_PATHWAYS).map(([sector, sp]) => ({
      sector: sector.length > 16 ? sector.slice(0, 14) + '..' : sector,
      fullSector: sector,
      carbonSensitivity: Math.round(sp.carbon_price_sensitivity * 100),
      strandedRisk: Math.round(sp.stranded_asset_risk * 100),
      techReadiness: Math.round(sp.tech_readiness * 100),
      capex: sp.capex_requirement,
    }));
  }, []);

  /* Physical vs Transition decomposition */
  const physTransData = useMemo(() => {
    if (!scenarioResults) return [];
    return scenarioResults.map(r => ({
      name: r.scenario.name.length > 14 ? r.scenario.name.slice(0, 12) + '..' : r.scenario.name,
      physical: Math.round(r.avgPD * r.scenario.physical_weight * 10000) / 100,
      transition: Math.round(r.avgPD * r.scenario.transition_weight * 10000) / 100,
      color: r.scenario.color,
    }));
  }, [scenarioResults]);

  /* Stranded asset analysis per holding */
  const strandedData = useMemo(() => {
    if (!scenarioResults) return [];
    const sc = scenarioResults.find(r => r.scenario.id === selectedScenario);
    if (!sc) return [];
    return sc.entityResults
      .filter(e => e.strandProb > 0.05)
      .sort((a, b) => b.strandProb - a.strandProb)
      .slice(0, 15)
      .map(e => ({ name: e.ticker, prob: Math.round(e.strandProb * 1000) / 10, exposure: e.exposure_usd_mn, fossilPct: Math.round(e.fossilRevPct * 100) }));
  }, [scenarioResults, selectedScenario]);

  /* Export helpers */
  const exportCSV = useCallback((data, filename) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportResultsCSV = useCallback(() => {
    if (!scenarioResults) return;
    const rows = scenarioResults.map(r => ({
      scenario: r.scenario.name, category: r.scenario.category, temp: r.scenario.temp,
      horizon, avgPD: (r.avgPD * 100).toFixed(3), avgWACC: (r.avgWACC * 100).toFixed(2),
      totalVaR: r.totalVaR.toFixed(2), totalEL: r.totalEL.toFixed(2),
      valuationImpact: r.totalValImpact.toFixed(2), totalExposure: r.totalExposure.toFixed(1),
    }));
    exportCSV(rows, `dme_scenario_results_${horizon}.csv`);
  }, [scenarioResults, horizon, exportCSV]);

  const exportEntityCSV = useCallback(() => {
    if (!scenarioResults) return;
    const sc = scenarioResults.find(r => r.scenario.id === selectedScenario);
    if (!sc) return;
    exportCSV(sc.entityResults.map(e => ({
      ticker: e.ticker, name: e.name, sector: e.sector, exposure: e.exposure_usd_mn,
      scenarioPD: (e.scenPD * 100).toFixed(3), var95: e.var95.toFixed(2), el: e.el.toFixed(2),
      wacc: (e.wacc * 100).toFixed(2), strandingProb: (e.strandProb * 100).toFixed(1),
      valuationImpact: e.valImp.toFixed(2),
    })), `dme_entity_${selectedScenario}_${horizon}.csv`);
  }, [scenarioResults, selectedScenario, horizon, exportCSV]);

  const exportSectorCSV = useCallback(() => {
    exportCSV(Object.entries(SECTOR_PATHWAYS).map(([s, p]) => ({ sector: s, ...p })), 'dme_sector_pathways.csv');
  }, [exportCSV]);

  const activeSc = NGFS_SCENARIOS.find(s => s.id === selectedScenario) || NGFS_SCENARIOS[0];

  /* ── Empty portfolio guard ─────────────────────────────────────────────── */
  if (portfolio.length === 0) {
    return (
      <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:T.mutedFg || '#94a3b8', maxWidth:420 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>&#128202;</div>
          <h2 style={{ color:T.fg || '#e2e8f0', marginBottom:8 }}>No Portfolio Found</h2>
          <p style={{ marginBottom:20, lineHeight:1.6 }}>
            DME Scenario Analysis requires an active portfolio with holdings.
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
            <h1 style={{ fontSize:22, fontWeight:800, color:T.navy, margin:0 }}>DME NGFS Scenario Engine</h1>
            <Badge label="6 Scenarios · 3 Horizons · Phase IV" color={T.sage} />
          </div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>NGFS Phase IV climate scenario analysis with PD, VaR, WACC, Expected Loss & stranded asset quantification</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/ngfs-scenarios')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>NGFS Base</button>
          <button onClick={() => navigate('/stranded-assets')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Stranded Assets</button>
          <button onClick={() => navigate('/portfolio-climate-var')} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Climate VaR</button>
        </div>
      </div>

      {/* ── 2. Entity / Portfolio Selector ─────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.text }}>Run Mode:</div>
          {['portfolio', 'entity'].map(m => (
            <button key={m} onClick={() => { setMode(m); setHasRun(false); }} style={{ padding:'6px 16px', fontSize:12, fontWeight:600, borderRadius:6, border:`1px solid ${mode === m ? T.navy : T.border}`, background: mode === m ? T.navy : T.surface, color: mode === m ? '#fff' : T.text, cursor:'pointer', textTransform:'capitalize' }}>{m === 'portfolio' ? 'Entire Portfolio' : 'Single Entity'}</button>
          ))}
          {mode === 'entity' && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search ticker or name..." style={{ padding:'6px 12px', fontSize:12, border:`1px solid ${T.border}`, borderRadius:6, width:200, outline:'none', fontFamily:T.font }} />
              {searchTerm && (
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:0, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, maxHeight:200, overflowY:'auto', zIndex:10, width:260, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
                    {filteredHoldings.slice(0, 10).map(h => (
                      <div key={h.ticker} onClick={() => { setSelectedEntity(h.ticker); setSearchTerm(h.name); }} style={{ padding:'6px 12px', fontSize:12, cursor:'pointer', borderBottom:`1px solid ${T.border}`, color:T.text }} onMouseEnter={e => e.target.style.background = T.surfaceH} onMouseLeave={e => e.target.style.background = 'transparent'}>
                        <strong>{h.ticker}</strong> — {h.name} <span style={{ color:T.textMut }}>({h.sector})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize:11, color:T.textMut }}>
            {mode === 'portfolio' ? `${holdings.length} holdings · $${Math.round(holdings.reduce((s, h) => s + h.exposure_usd_mn, 0))}m total` : selectedEntity ? `Selected: ${selectedEntity}` : 'Select an entity'}
          </div>
        </div>
      </div>

      {/* ── 3. Time Horizon Toggle ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.text }}>Time Horizon:</div>
        {[2030, 2040, 2050].map(yr => (
          <button key={yr} onClick={() => { setHorizon(yr); if (hasRun) setHasRun(false); }} style={{ padding:'8px 20px', fontSize:13, fontWeight:700, borderRadius:8, border:`2px solid ${horizon === yr ? T.gold : T.border}`, background: horizon === yr ? `${T.gold}18` : T.surface, color: horizon === yr ? T.gold : T.text, cursor:'pointer' }}>{yr}</button>
        ))}
      </div>

      {/* ── 4. Scenario Cards ──────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12, marginBottom:16 }}>
        {NGFS_SCENARIOS.map(sc => {
          const isActive = selectedScenario === sc.id;
          const catColor = CATEGORY_COLORS[sc.category] || T.textMut;
          const h = interpolateHorizon(sc, horizon);
          return (
            <div key={sc.id} onClick={() => setSelectedScenario(sc.id)} style={{ background: isActive ? `${sc.color}0c` : T.surface, border:`2px solid ${isActive ? sc.color : T.border}`, borderRadius:10, padding:14, cursor:'pointer', transition:'all 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:sc.color }}>{sc.name}</div>
                <Badge label={sc.category} color={catColor} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:11, color:T.textSec }}>
                <div>Temp: <strong style={{ color:T.text }}>{sc.temp}</strong></div>
                <div>C-Price: <strong style={{ color:T.text }}>${Math.round(h.carbonPrice)}</strong></div>
                <div>Physical: <strong style={{ color:T.text }}>{Math.round(sc.physical_weight * 100)}%</strong></div>
                <div>Transition: <strong style={{ color:T.text }}>{Math.round(sc.transition_weight * 100)}%</strong></div>
                <div>GDP: <strong style={{ color: sc.gdp_impact < -3 ? T.red : T.text }}>{sc.gdp_impact}%</strong></div>
                <div>Sea Level: <strong style={{ color:T.text }}>{sc.sea_level_2100}cm</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 5. Run All Scenarios ────────────────────────────────────────────── */}
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <button onClick={() => setHasRun(true)} style={{ padding:'12px 40px', fontSize:14, fontWeight:700, background:T.navy, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', boxShadow:'0 2px 8px rgba(27,58,92,0.3)', letterSpacing:0.3 }}>
          Run All 6 Scenarios ({horizon})
        </button>
        {mode === 'entity' && !selectedEntity && <div style={{ fontSize:11, color:T.red, marginTop:6 }}>Please select an entity first</div>}
      </div>

      {/* ── 6. Results Table ────────────────────────────────────────────────── */}
      {scenarioResults && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20, overflowX:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <SectionHeader title="Scenario Results Comparison" sub={`${horizon} horizon · ${mode === 'portfolio' ? 'Full portfolio' : selectedEntity}`} />
            <button onClick={exportResultsCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export CSV</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Scenario','Category','Temp','Avg PD','VaR (95%)','WACC','Expected Loss','Stranding','Val. Impact'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:T.text, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarioResults.map((r, i) => {
                const avgStrand = r.entityResults.length > 0 ? r.entityResults.reduce((s, e) => s + e.strandProb, 0) / r.entityResults.length : 0;
                return (
                  <tr key={r.scenario.id} style={{ borderBottom:`1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:r.scenario.color }}>{r.scenario.name}</td>
                    <td style={{ padding:'8px 10px' }}><Badge label={r.scenario.category} color={CATEGORY_COLORS[r.scenario.category] || T.textMut} /></td>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.scenario.temp}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600, color: r.avgPD > 0.05 ? T.red : r.avgPD > 0.02 ? T.amber : T.green }}>{pct(r.avgPD * 100, 2)}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:T.red }}>{usd(r.totalVaR)}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{pct(r.avgWACC * 100, 2)}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:T.amber }}>{usd(r.totalEL)}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600, color: avgStrand > 0.3 ? T.red : T.textSec }}>{pct(avgStrand * 100, 1)}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600, color: r.totalValImpact < 0 ? T.red : T.green }}>{usd(r.totalValImpact)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 7. Sector Comparison BarChart ───────────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <SectionHeader title="Sector Scenario Sensitivity" sub="Carbon price sensitivity, stranded asset risk & technology readiness by sector" />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sectorComparison} margin={{ top:10, right:20, left:10, bottom:40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" angle={-30} textAnchor="end" tick={{ fontSize:10, fill:T.textSec }} height={60} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Bar dataKey="carbonSensitivity" name="Carbon Sensitivity %" fill={T.red} radius={[3,3,0,0]} />
            <Bar dataKey="strandedRisk" name="Stranded Risk %" fill={T.amber} radius={[3,3,0,0]} />
            <Bar dataKey="techReadiness" name="Tech Readiness %" fill={T.sage} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 8. Timeline Evolution AreaChart ─────────────────────────────────── */}
      {hasRun && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
          <SectionHeader title={`Timeline Evolution — ${activeSc.name}`} sub="PD, VaR and carbon price trajectory 2025→2050" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timelineData} margin={{ top:10, right:20, left:10, bottom:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textSec }} />
                <YAxis tick={{ fontSize:10, fill:T.textSec }} label={{ value:'Avg PD (%)', angle:-90, position:'insideLeft', style:{ fontSize:10, fill:T.textSec } }} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Area type="monotone" dataKey="avgPD" name="Avg PD %" fill={`${activeSc.color}30`} stroke={activeSc.color} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timelineData} margin={{ top:10, right:20, left:10, bottom:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textSec }} />
                <YAxis tick={{ fontSize:10, fill:T.textSec }} label={{ value:'Carbon Price ($)', angle:-90, position:'insideLeft', style:{ fontSize:10, fill:T.textSec } }} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Area type="monotone" dataKey="carbonPrice" name="Carbon Price $" fill={`${T.gold}30`} stroke={T.gold} strokeWidth={2} />
                <Area type="monotone" dataKey="totalVaR" name="Total VaR $m" fill={`${T.red}20`} stroke={T.red} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 9. Stranded Asset Analysis ─────────────────────────────────────── */}
      {hasRun && strandedData.length > 0 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <SectionHeader title={`Stranded Asset Probability — ${activeSc.name}`} sub="Holdings with >5% stranding probability under selected scenario" />
            <button onClick={exportEntityCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export Entity CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={strandedData} layout="vertical" margin={{ top:5, right:20, left:60, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:T.textSec }} width={55} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} formatter={(v, name) => name === 'prob' ? `${v}%` : `$${v}m`} />
              <Bar dataKey="prob" name="Stranding %" fill={T.red} radius={[0,4,4,0]}>
                {strandedData.map((d, i) => (
                  <Cell key={i} fill={d.prob > 50 ? T.red : d.prob > 20 ? T.amber : T.gold} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 10. Physical vs Transition Decomposition ───────────────────────── */}
      {scenarioResults && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
          <SectionHeader title="Physical vs Transition Risk Decomposition" sub="Weighted PD contribution from physical and transition risk channels" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={physTransData} margin={{ top:10, right:20, left:10, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize:10, fill:T.textSec }} height={50} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} label={{ value:'PD Contribution (bps)', angle:-90, position:'insideLeft', style:{ fontSize:10, fill:T.textSec } }} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="physical" name="Physical Risk" stackId="a" fill={T.navyL} radius={[0,0,0,0]} />
              <Bar dataKey="transition" name="Transition Risk" stackId="a" fill={T.gold} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 11. Sector Pathway Reference Table ─────────────────────────────── */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20, overflowX:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionHeader title="Sector Transition Pathway Coefficients" sub="All 11 GICS sectors — sensitivity, risk, capex and readiness parameters" />
          <button onClick={exportSectorCSV} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>Export CSV</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ borderBottom:`2px solid ${T.border}` }}>
              {['Sector','Carbon Sensitivity','Stranded Risk','CapEx Req ($tn)','Workforce Trans. (%)','Tech Readiness','Peak Risk Year'].map(h => (
                <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:700, color:T.text, fontSize:10, textTransform:'uppercase', letterSpacing:0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(SECTOR_PATHWAYS).map(([sector, sp], i) => (
              <tr key={sector} style={{ borderBottom:`1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.text }}>{sector}</td>
                <td style={{ padding:'7px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:60, height:6, background:T.border, borderRadius:3 }}>
                      <div style={{ width:`${sp.carbon_price_sensitivity * 100}%`, height:'100%', background: sp.carbon_price_sensitivity > 0.6 ? T.red : sp.carbon_price_sensitivity > 0.3 ? T.amber : T.sage, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:10, color:T.textSec }}>{(sp.carbon_price_sensitivity * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding:'7px 10px', color: sp.stranded_asset_risk > 0.5 ? T.red : sp.stranded_asset_risk > 0.2 ? T.amber : T.sage, fontWeight:600 }}>{(sp.stranded_asset_risk * 100).toFixed(0)}%</td>
                <td style={{ padding:'7px 10px' }}>${sp.capex_requirement}tn</td>
                <td style={{ padding:'7px 10px' }}>{sp.workforce_transition}%</td>
                <td style={{ padding:'7px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:60, height:6, background:T.border, borderRadius:3 }}>
                      <div style={{ width:`${sp.tech_readiness * 100}%`, height:'100%', background: sp.tech_readiness > 0.7 ? T.green : sp.tech_readiness > 0.4 ? T.amber : T.red, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:10, color:T.textSec }}>{(sp.tech_readiness * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding:'7px 10px', fontWeight:600 }}>{sp.peak_risk_year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 12. Summary KPIs ───────────────────────────────────────────────── */}
      {scenarioResults && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10, marginBottom:20 }}>
          <KpiCard label="Scenarios" value="6" sub="NGFS Phase IV" accent={T.sage} />
          <KpiCard label="Horizon" value={horizon} sub={`${horizon - 2025}yr forward`} accent={T.gold} />
          <KpiCard label="Max PD" value={pct(Math.max(...scenarioResults.map(r => r.avgPD)) * 100, 2)} sub="Worst-case avg PD" accent={T.red} />
          <KpiCard label="Max VaR" value={usd(Math.max(...scenarioResults.map(r => r.totalVaR)))} sub="Worst-case VaR 95%" accent={T.red} />
          <KpiCard label="Holdings" value={holdings.length} sub={mode === 'entity' ? `Focused: ${selectedEntity}` : 'Full portfolio'} accent={T.navy} />
          <KpiCard label="Worst Scenario" value={scenarioResults.sort((a, b) => b.totalVaR - a.totalVaR)[0]?.scenario.name.split(' ')[0]} sub="By total VaR" accent={T.amber} />
        </div>
      )}

      {/* ── Cross-nav footer ───────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16, flexWrap:'wrap' }}>
        {[
          { label:'Alert Center', path:'/dme-alerts' },
          { label:'Contagion Network', path:'/dme-contagion' },
          { label:'NGFS Base', path:'/ngfs-scenarios' },
          { label:'Stranded Assets', path:'/stranded-assets' },
          { label:'Climate VaR', path:'/portfolio-climate-var' },
          { label:'Stress Testing', path:'/scenario-stress-test' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, color:T.navy, cursor:'pointer' }}>{n.label}</button>
        ))}
      </div>
    </div>
  );
}
