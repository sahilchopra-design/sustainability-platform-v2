import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, ComposedChart,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#16a34a','#9333ea','#64748b','#0891b2','#be185d'];

/* =================================================================
   MODULES
   ================================================================= */
const MODULES = [
  { id:'iwa', name:'IWA Classification', path:'/iwa-classification', icon:'[IWA]', color:'#0284c7', description:'Impact-Weighted Accounts: monetized E/S/G impacts' },
  { id:'iris', name:'IRIS+ Metrics', path:'/iris-metrics', icon:'[IRIS+]', color:'#7c3aed', description:'GIIN IRIS+ standardized impact metrics & SDG alignment' },
  { id:'sdgBond', name:'SDG Bond Impact', path:'/sdg-bond-impact', icon:'[SDG]', color:'#16a34a', description:'Green/Social/Sustainability bond impact reporting' },
  { id:'blended', name:'Blended Finance', path:'/blended-finance', icon:'[BF]', color:'#d97706', description:'Concessional capital structuring & leverage analysis' },
  { id:'verify', name:'Impact Verification', path:'/impact-verification', icon:'[IV]', color:'#dc2626', description:'IMP 5 Dimensions, evidence tiers, impact washing detection' },
];

const SDGS_17 = Array.from({length:17},(_,i)=>({ id:i+1, name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry & Innovation','Reduced Inequalities','Sustainable Cities','Responsible Consumption','Climate Action','Life Below Water','Life on Land','Peace & Justice','Partnerships'][i], color:['#E5243B','#DDA63A','#4C9F38','#C5192D','#FF3A21','#26BDE2','#FCC30B','#A21942','#FD6925','#DD1367','#FD9D24','#BF8B2E','#3F7E44','#0A97D9','#56C02B','#00689D','#19486A'][i] }));

const REGS = [
  { name:'SFDR', articles:['Art.8 PAI','Art.9 Impact'], coverage:'EU', status:'Active' },
  { name:'EU Taxonomy', articles:['6 Env. Objectives','DNSH'], coverage:'EU', status:'Active' },
  { name:'ISSB / IFRS S1-S2', articles:['Climate Disclosures','Sustainability-related'], coverage:'Global', status:'Effective 2025' },
  { name:'GRI Standards', articles:['GRI 1-3 Universal','Topic Standards'], coverage:'Global', status:'Active' },
  { name:'CSRD', articles:['ESRS E1-E5','ESRS S1-S4','ESRS G1'], coverage:'EU', status:'Phased 2024-2028' },
];

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const LS_FI   = 'ra_fi_portfolio_v1';
const LS_IWA  = 'ra_iwa_overrides_v1';
const LS_IRIS = 'ra_iris_data_v1';
const LS_BOND = 'ra_bond_impact_v1';
const LS_VERI = 'ra_impact_verification_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const pct = (n) => n == null ? '\u2014' : `${Math.round(n)}%`;
const fmtMn = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;

const enrichHub = (c, i) => {
  const s = i + 1;
  const iwaEnvMn = Math.round(seed(s * 11) * 40 - 8);
  const iwaEmplMn = Math.round(seed(s * 13) * 25 - 5);
  const iwaProdMn = Math.round(seed(s * 17) * 30 + 2);
  const iwaTotalMn = iwaEnvMn + iwaEmplMn + iwaProdMn;
  const irisMetrics = Math.ceil(seed(s * 19) * 12 + 3);
  const bondImpactMn = Math.round(seed(s * 23) * 50 + 5);
  const ghgAvoided = Math.round(seed(s * 29) * 15000 + 500);
  const beneficiaries = Math.round(seed(s * 31) * 50000 + 2000);
  const evidenceTier = Math.min(5, Math.max(1, Math.ceil(seed(s * 37) * 5)));
  const impWashFlags = Math.floor(seed(s * 41) * 4);
  const blendedMn = Math.round(seed(s * 43) * 30);
  const leverageRatio = Math.round((1 + seed(s * 47) * 4) * 10) / 10;
  const additionalityScore = Math.round(40 + seed(s * 53) * 55);
  const impactROI = Math.round(-10 + seed(s * 59) * 35);
  const sdgsContrib = Array.from({length:17},(_,j) => Math.round(seed(s * 61 + j) * 100 * (seed(s * 67 + j) > 0.5 ? 1 : 0)));
  const financialReturn = Math.round(-5 + seed(s * 71) * 25);
  const iwaScore = Math.round(30 + seed(s * 73) * 65);
  const irisScore = Math.round(25 + seed(s * 79) * 70);
  const verificationStatus = seed(s * 83) > 0.65 ? 'Verified' : seed(s * 87) > 0.35 ? 'Partial' : 'Unverified';
  const sdgAligned = Math.ceil(seed(s * 89) * 6);
  return {
    ...c,
    company_name: c.company_name || c.company || `Company ${i+1}`,
    sector: c.sector || 'Diversified',
    weight: c.weight || 1,
    iwaEnvMn, iwaEmplMn, iwaProdMn, iwaTotalMn, irisMetrics, bondImpactMn,
    ghgAvoided, beneficiaries, evidenceTier, impWashFlags, blendedMn,
    leverageRatio, additionalityScore, impactROI, sdgsContrib, financialReturn,
    iwaScore, irisScore, verificationStatus, sdgAligned,
  };
};

/* =================================================================
   UI COMPONENTS
   ================================================================= */
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${accent||T.border}`, borderRadius:10, padding:'14px 16px', borderTop:`3px solid ${accent||T.gold}` }}>
    <div style={{ fontSize:10, color:T.textMut, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:3, fontFamily:T.font }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:T.font }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style:sx }) => (
  <button onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:8, border:`1px solid ${active?T.navy:T.border}`, background:active?T.navy:T.surface, color:active?'#fff':T.text, fontWeight:600, fontSize:small?12:13, cursor:'pointer', fontFamily:T.font, transition:'all .15s', ...sx }}>{children}</button>
);

const Section = ({ title, children, badge }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${T.gold}` }}>
      <span style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</span>
      {badge && <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:T.gold+'22', color:T.gold, fontWeight:700, fontFamily:T.font }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const ModuleCard = ({ mod, stats, onClick }) => (
  <div onClick={onClick} style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16, cursor:'pointer', borderLeft:`4px solid ${mod.color}`, transition:'box-shadow .15s' }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <div style={{ fontWeight:700, fontSize:14, color:T.navy }}>{mod.name}</div>
        <div style={{ fontSize:11, color:T.textSec, marginTop:3 }}>{mod.description}</div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:mod.color, padding:'4px 10px', borderRadius:8, background:mod.color+'15' }}>{stats}</div>
    </div>
  </div>
);

const ThCell = ({ label, col, sortCol, sortDir, onSort }) => (
  <th onClick={()=>onSort(col)} style={{ padding:'10px 8px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, cursor:'pointer', borderBottom:`2px solid ${T.border}`, userSelect:'none', whiteSpace:'nowrap', fontFamily:T.font }}>
    {label} {sortCol===col ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}
  </th>
);

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function ImpactHubPage() {
  const navigate = useNavigate();

  /* ── portfolio ────────────────────────────────────────────────── */
  const portfolioRaw = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const data = saved || { portfolios:{}, activePortfolio:null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  const [sortCol, setSortCol] = useState('iwaTotalMn');
  const [sortDir, setSortDir] = useState('desc');
  const [activeModule, setActiveModule] = useState(null);
  const [impactTypeFilter, setImpactTypeFilter] = useState('all');
  const [trendHorizon, setTrendHorizon] = useState('2030');

  /* ── read sub-module stores ─────────────────────────────────── */
  const iwaOverrides = useMemo(() => loadLS(LS_IWA) || {}, []);
  const irisData = useMemo(() => loadLS(LS_IRIS) || {}, []);
  const bondData = useMemo(() => loadLS(LS_BOND) || {}, []);
  const verifyData = useMemo(() => loadLS(LS_VERI) || {}, []);

  /* ── build holdings ──────────────────────────────────────────── */
  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 40).map((c, i) => enrichHub(c, i));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return enrichHub({ ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, weight: h.weight }, i);
    });
  }, [portfolioRaw]);

  /* ── Aggregates ──────────────────────────────────────────────── */
  const agg = useMemo(() => {
    const tw = holdings.reduce((s, h) => s + (h.weight || 1), 0) || 1;
    const wAvg = fn => holdings.reduce((s, h) => s + fn(h) * (h.weight || 1), 0) / tw;
    const totalImpactMn = holdings.reduce((s, h) => s + h.iwaTotalMn, 0);
    const envImpactMn = holdings.reduce((s, h) => s + h.iwaEnvMn, 0);
    const emplImpactMn = holdings.reduce((s, h) => s + h.iwaEmplMn, 0);
    const prodImpactMn = holdings.reduce((s, h) => s + h.iwaProdMn, 0);
    const irisTracked = holdings.reduce((s, h) => s + h.irisMetrics, 0);
    const bondImpactTotal = holdings.reduce((s, h) => s + h.bondImpactMn, 0);
    const ghgTotal = holdings.reduce((s, h) => s + h.ghgAvoided, 0);
    const benefTotal = holdings.reduce((s, h) => s + h.beneficiaries, 0);
    const avgEvidence = wAvg(h => h.evidenceTier);
    const totalFlags = holdings.reduce((s, h) => s + h.impWashFlags, 0);
    const blendedTotal = holdings.reduce((s, h) => s + h.blendedMn, 0);
    const avgLeverage = wAvg(h => h.leverageRatio);
    const avgAdditionality = wAvg(h => h.additionalityScore);
    const avgROI = wAvg(h => h.impactROI);
    /* SDG aggregation */
    const sdgAgg = SDGS_17.map(sdg => {
      const contrib = holdings.reduce((s, h) => s + h.sdgsContrib[sdg.id - 1], 0);
      return { ...sdg, contribution: contrib };
    });
    /* module statuses */
    const iwaComplete = Math.round(holdings.filter(h => Math.abs(h.iwaTotalMn) > 0).length / holdings.length * 100);
    const irisComplete = Math.round(holdings.filter(h => h.irisMetrics > 5).length / holdings.length * 100);
    const bondComplete = Math.round(holdings.filter(h => h.bondImpactMn > 10).length / holdings.length * 100);
    const blendedComplete = Math.round(holdings.filter(h => h.blendedMn > 5).length / holdings.length * 100);
    const verifyComplete = Math.round(holdings.filter(h => h.evidenceTier <= 3).length / holdings.length * 100);
    return { totalImpactMn, envImpactMn, emplImpactMn, prodImpactMn, irisTracked, bondImpactTotal, ghgTotal, benefTotal, avgEvidence, totalFlags, blendedTotal, avgLeverage, avgAdditionality, avgROI, sdgAgg, iwaComplete, irisComplete, bondComplete, blendedComplete, verifyComplete };
  }, [holdings]);

  /* ── sorted/filtered ────────────────────────────────────────── */
  const displayed = useMemo(() => {
    let h = [...holdings];
    if (impactTypeFilter === 'positive') h = h.filter(x => x.iwaTotalMn > 0);
    else if (impactTypeFilter === 'negative') h = h.filter(x => x.iwaTotalMn <= 0);
    h.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'company': va = a.company_name; vb = b.company_name; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'iwaTotalMn': va = a.iwaTotalMn; vb = b.iwaTotalMn; break;
        case 'iwaScore': va = a.iwaScore; vb = b.iwaScore; break;
        case 'irisScore': va = a.irisScore; vb = b.irisScore; break;
        case 'evidenceTier': va = a.evidenceTier; vb = b.evidenceTier; break;
        case 'sdgAligned': va = a.sdgAligned; vb = b.sdgAligned; break;
        case 'impactROI': va = a.impactROI; vb = b.impactROI; break;
        default: va = a.iwaTotalMn; vb = b.iwaTotalMn;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return h;
  }, [holdings, sortCol, sortDir, impactTypeFilter]);

  const onSort = col => { setSortCol(col); setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'); };

  /* ── Waterfall data ─────────────────────────────────────────── */
  const waterfallData = useMemo(() => {
    const revenueMn = holdings.reduce((s, h) => s + (h.revenue_usd_mn || Math.round(seed((h.weight||1)*97)*800+100)), 0);
    const posMn = holdings.reduce((s, h) => s + Math.max(0, h.iwaTotalMn), 0);
    const negMn = Math.abs(holdings.reduce((s, h) => s + Math.min(0, h.iwaTotalMn), 0));
    return [
      { name:'Revenue', value:revenueMn, fill:T.navy },
      { name:'+ Positive Impact', value:posMn, fill:T.green },
      { name:'- Negative Impact', value:negMn, fill:T.red },
      { name:'Net Impact', value:revenueMn + posMn - negMn, fill:T.gold },
    ];
  }, [holdings]);

  /* ── Trend data ─────────────────────────────────────────────── */
  const trendData = useMemo(() => {
    const endYear = Number(trendHorizon);
    return Array.from({length:endYear-2024},(_,i) => {
      const yr = 2025 + i;
      const growth = 1 + i * 0.12;
      return {
        year:`${yr}`,
        environmental:Math.round(agg.envImpactMn * growth),
        social:Math.round(agg.emplImpactMn * growth * 1.1),
        product:Math.round(agg.prodImpactMn * growth * 0.95),
        total:Math.round(agg.totalImpactMn * growth),
      };
    });
  }, [agg, trendHorizon]);

  /* ── Cross-module consistency ────────────────────────────────── */
  const consistency = useMemo(() => {
    return holdings.slice(0, 15).map(h => ({
      company: (h.company_name || '').slice(0, 14),
      iwa: h.iwaScore,
      iris: h.irisScore,
      verification: h.evidenceTier <= 2 ? 90 : h.evidenceTier <= 3 ? 65 : h.evidenceTier <= 4 ? 40 : 20,
      sdgScore: Math.round(h.sdgAligned / 6 * 100),
      deviation: Math.round(Math.abs(h.iwaScore - h.irisScore) + Math.abs(h.iwaScore - (h.evidenceTier <= 3 ? 70 : 40))),
    }));
  }, [holdings]);

  /* ── Financial vs Impact scatter ────────────────────────────── */
  const finVsImpact = useMemo(() => {
    return holdings.map(h => ({
      name: (h.company_name || '').slice(0, 12),
      financialReturn: h.financialReturn,
      impactScore: h.iwaScore,
      size: (h.weight || 1) * 50,
    }));
  }, [holdings]);

  /* ── Action prioritization ──────────────────────────────────── */
  const actions = useMemo(() => {
    const list = [];
    if (agg.avgEvidence > 3) list.push({ priority:'High', action:'Upgrade evidence quality across portfolio', metric:`Avg tier: ${fmt(agg.avgEvidence)}`, target:'Reach Tier 2.5 avg', module:'Verification' });
    if (agg.totalFlags > 5) list.push({ priority:'High', action:'Address impact washing flags', metric:`${agg.totalFlags} flags active`, target:'Reduce to <5', module:'Verification' });
    if (agg.iwaComplete < 80) list.push({ priority:'Medium', action:'Expand IWA coverage', metric:`${agg.iwaComplete}% assessed`, target:'95% coverage', module:'IWA' });
    if (agg.irisComplete < 70) list.push({ priority:'Medium', action:'Standardize IRIS+ metrics', metric:`${agg.irisComplete}% tracked`, target:'85% tracked', module:'IRIS+' });
    if (agg.avgAdditionality < 65) list.push({ priority:'High', action:'Strengthen additionality evidence', metric:`Score: ${fmt(agg.avgAdditionality,0)}`, target:'Score > 70', module:'Verification' });
    list.push({ priority:'Low', action:'Increase blended finance leverage', metric:`Avg: ${fmt(agg.avgLeverage)}x`, target:'> 3.5x', module:'Blended Finance' });
    list.push({ priority:'Medium', action:'Align SDG claims with verified evidence', metric:`${holdings.filter(h=>h.sdgAligned > 3).length} aligned`, target:'All holdings', module:'SDG Bond' });
    return list;
  }, [agg, holdings]);

  /* ── Exports ────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['Company','Sector','IWA Total ($Mn)','IWA Env','IWA Empl','IWA Prod','IRIS+ Metrics','Bond Impact ($Mn)','GHG Avoided (t)','Beneficiaries','Evidence Tier','Flags','Blended ($Mn)','Leverage','Additionality','Impact ROI','SDGs Aligned','Verification'].join(',')];
    holdings.forEach(h => rows.push([`"${h.company_name}"`,`"${h.sector}"`,h.iwaTotalMn,h.iwaEnvMn,h.iwaEmplMn,h.iwaProdMn,h.irisMetrics,h.bondImpactMn,h.ghgAvoided,h.beneficiaries,h.evidenceTier,h.impWashFlags,h.blendedMn,h.leverageRatio,h.additionalityScore,h.impactROI,h.sdgAligned,h.verificationStatus].join(',')));
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'impact_hub_report.csv'; a.click();
  }, [holdings]);

  const exportJSON = useCallback(() => {
    const data = { modules:MODULES.map(m => m.name), holdings:holdings.map(h => ({ company:h.company_name, iwa:{ env:h.iwaEnvMn, empl:h.iwaEmplMn, prod:h.iwaProdMn, total:h.iwaTotalMn }, iris:h.irisMetrics, bond:h.bondImpactMn, blended:h.blendedMn, verification:{ tier:h.evidenceTier, status:h.verificationStatus, flags:h.impWashFlags }, sdgsAligned:h.sdgAligned })), aggregates:agg, generatedAt:new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'impact_hub_full.json'; a.click();
  }, [holdings, agg]);

  const exportPrint = useCallback(() => window.print(), []);

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>

      {/* S1 — Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>Impact Measurement Intelligence</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            {['Hub','IWA','IRIS+','SDG Bonds','Blended Finance','Verification'].map(b => (
              <span key={b} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:T.gold+'22', color:T.gold, fontWeight:700 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={exportCSV}>Export CSV</Btn>
          <Btn onClick={exportJSON}>Export JSON</Btn>
          <Btn onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* S2 — 5 Module Status Cards */}
      <Section title="Sprint X Modules" badge="5 active">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {MODULES.map((m, i) => {
            const stats = [agg.iwaComplete, agg.irisComplete, agg.bondComplete, agg.blendedComplete, agg.verifyComplete][i];
            return <ModuleCard key={m.id} mod={m} stats={`${stats}%`} onClick={() => navigate(m.path)} />;
          })}
        </div>
      </Section>

      {/* S3 — 14 KPI Cards (2 rows) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10, marginBottom:12 }}>
        <KPI label="Total Impact" value={fmtMn(agg.totalImpactMn)} sub="IWA monetized" accent={T.navy} />
        <KPI label="Env Impact" value={fmtMn(agg.envImpactMn)} sub="Carbon, water, waste" accent={T.sage} />
        <KPI label="Empl Impact" value={fmtMn(agg.emplImpactMn)} sub="Wages, safety, D&I" accent={T.navyL} />
        <KPI label="Product Impact" value={fmtMn(agg.prodImpactMn)} sub="Access, quality" accent={T.gold} />
        <KPI label="IRIS+ Tracked" value={agg.irisTracked} sub="Standardized metrics" accent={PIE_COLORS[4]} />
        <KPI label="SDG Bond Impact" value={fmtMn(agg.bondImpactTotal)} sub="Green/Social bonds" accent={T.green} />
        <KPI label="GHG Avoided" value={`${(agg.ghgTotal/1000).toFixed(0)}K t`} sub="CO2e avoided" accent={T.sage} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10, marginBottom:24 }}>
        <KPI label="Beneficiaries" value={`${(agg.benefTotal/1000).toFixed(0)}K`} sub="People served" accent={T.navyL} />
        <KPI label="Evidence Avg" value={`Tier ${fmt(agg.avgEvidence)}`} sub={agg.avgEvidence <= 2.5 ? 'Strong' : 'Moderate'} accent={agg.avgEvidence <= 2.5 ? T.green : T.amber} />
        <KPI label="Washing Flags" value={agg.totalFlags} sub="Active flags" accent={agg.totalFlags > 10 ? T.red : T.amber} />
        <KPI label="Blended Finance" value={fmtMn(agg.blendedTotal)} sub="Concessional capital" accent={T.amber} />
        <KPI label="Leverage Ratio" value={`${fmt(agg.avgLeverage)}x`} sub="Private mobilized" accent={T.gold} />
        <KPI label="Additionality" value={fmt(agg.avgAdditionality, 0)} sub="Weighted avg" accent={agg.avgAdditionality > 60 ? T.green : T.amber} />
        <KPI label="Impact ROI" value={`${fmt(agg.avgROI, 0)}%`} sub="Impact return" accent={agg.avgROI > 5 ? T.green : T.amber} />
      </div>

      {/* S4 — Impact Waterfall */}
      <Section title="Impact Summary Waterfall" badge="IWA">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:12, fill:T.textSec, fontWeight:600 }} />
              <YAxis tick={{ fontSize:10 }} label={{ value:'$Mn', angle:-90, position:'insideLeft', fontSize:11 }} />
              <Tooltip formatter={v => `$${v}Mn`} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {waterfallData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* S5 — SDG Contribution Dashboard */}
      <Section title="SDG Contribution Dashboard" badge="17 Goals">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(17,1fr)', gap:4, marginBottom:12 }}>
            {agg.sdgAgg.map(sdg => {
              const maxC = Math.max(...agg.sdgAgg.map(s => s.contribution), 1);
              const heightPct = Math.max(8, (sdg.contribution / maxC) * 100);
              return (
                <div key={sdg.id} style={{ textAlign:'center' }}>
                  <div style={{ height:80, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                    <div style={{ width:'100%', height:`${heightPct}%`, background:sdg.color, borderRadius:'4px 4px 0 0', minHeight:6, transition:'height .3s' }} />
                  </div>
                  <div style={{ fontSize:9, fontWeight:700, color:T.navy, marginTop:2 }}>{sdg.id}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {agg.sdgAgg.filter(s => s.contribution > 0).sort((a, b) => b.contribution - a.contribution).slice(0, 8).map(s => (
              <span key={s.id} style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:s.color+'22', color:s.color, fontWeight:700 }}>SDG {s.id}: {s.name} ({s.contribution})</span>
            ))}
          </div>
        </div>
      </Section>

      {/* S6 — Quick Actions */}
      <Section title="Quick Actions" badge="Navigate">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => navigate(m.path)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, cursor:'pointer', textAlign:'center', borderTop:`3px solid ${m.color}`, transition:'transform .1s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ fontSize:20, marginBottom:6 }}>{m.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, color:T.navy }}>{m.name}</div>
              <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>Open module {'\u2192'}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* S7 — Impact vs Financial Performance */}
      <Section title="Impact vs Financial Performance" badge="Scatter">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={finVsImpact.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="financialReturn" name="Financial Return %" tick={{ fontSize:10 }} label={{ value:'Financial Return %', position:'insideBottom', offset:-5, fontSize:11 }} />
              <YAxis dataKey="impactScore" name="Impact Score" tick={{ fontSize:10 }} label={{ value:'Impact Score', angle:-90, position:'insideLeft', fontSize:11 }} />
              <Tooltip formatter={(v, n) => n === 'impactScore' ? v : `${v}%`} />
              <Bar dataKey="impactScore" fill={T.navy+'44'} />
              <Line dataKey="impactScore" stroke={T.gold} strokeWidth={2} dot={{ fill:T.gold, r:4 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ fontSize:12, color:T.textSec, marginTop:6 }}>Companies in the top-right quadrant deliver both financial returns and positive impact.</div>
        </div>
      </Section>

      {/* S8 — Evidence Quality Summary */}
      <Section title="Evidence Quality Summary" badge="Cross-Module">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            {[
              { label:'Tier 1 (RCT)', count:holdings.filter(h=>h.evidenceTier===1).length, color:'#16a34a' },
              { label:'Tier 2 (Quasi)', count:holdings.filter(h=>h.evidenceTier===2).length, color:'#2563eb' },
              { label:'Tier 3 (ToC+Data)', count:holdings.filter(h=>h.evidenceTier===3).length, color:'#d97706' },
              { label:'Tier 4 (Self)', count:holdings.filter(h=>h.evidenceTier===4).length, color:'#f97316' },
              { label:'Tier 5 (Anecdotal)', count:holdings.filter(h=>h.evidenceTier===5).length, color:'#dc2626' },
            ].map(t => (
              <div key={t.label} style={{ padding:12, borderRadius:8, border:`1px solid ${t.color}33`, background:t.color+'11', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, color:t.color }}>{t.count}</div>
                <div style={{ fontSize:11, color:T.textSec, fontWeight:600 }}>{t.label}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                { name:'Tier 1-2 (Strong)', value:holdings.filter(h=>h.evidenceTier<=2).length, fill:T.green },
                { name:'Tier 3 (Moderate)', value:holdings.filter(h=>h.evidenceTier===3).length, fill:T.amber },
                { name:'Tier 4-5 (Weak)', value:holdings.filter(h=>h.evidenceTier>=4).length, fill:T.red },
              ]} dataKey="value" cx="50%" cy="50%" outerRadius={75} label={({name,value})=>`${name}: ${value}`} labelLine>
                {[T.green, T.amber, T.red].map((c,i)=><Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* S9 — Cross-Module Consistency */}
      <Section title="Cross-Module Consistency" badge="IWA vs IRIS+ vs Verification">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={consistency}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="company" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:10 }} domain={[0,100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="iwa" name="IWA Score" fill={T.navy} />
              <Bar dataKey="iris" name="IRIS+ Score" fill='#7c3aed' />
              <Bar dataKey="verification" name="Verification" fill={T.green} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:6 }}>Highest Deviation (Inconsistent Assessment)</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {consistency.sort((a, b) => b.deviation - a.deviation).slice(0, 5).map(c => (
                <span key={c.company} style={{ fontSize:11, padding:'3px 10px', borderRadius:8, background:c.deviation > 40 ? '#fee2e2' : '#fef3c7', color:c.deviation > 40 ? '#991b1b' : '#92400e', fontWeight:600 }}>{c.company}: {c.deviation}pt gap</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* S10 — Action Prioritization */}
      <Section title="Action Prioritization" badge="Recommendations">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Priority','Action','Current','Target','Module'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((a, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:700, background:a.priority==='High'?'#fee2e2':a.priority==='Medium'?'#fef3c7':'#d1fae5', color:a.priority==='High'?'#991b1b':a.priority==='Medium'?'#92400e':'#065f46' }}>{a.priority}</span>
                  </td>
                  <td style={{ padding:'10px 12px', fontWeight:600, color:T.navy }}>{a.action}</td>
                  <td style={{ padding:'10px 12px', color:T.textSec }}>{a.metric}</td>
                  <td style={{ padding:'10px 12px', fontWeight:600, color:T.green }}>{a.target}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{a.module}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* S11 — Impact Trend AreaChart */}
      <Section title="Projected Impact Growth" badge="2025\u20132030">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>Horizon:</span>
            {['2028','2030','2035'].map(y => (
              <Btn key={y} small active={trendHorizon===y} onClick={() => setTrendHorizon(y)}>{y}</Btn>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:10 }} label={{ value:'$Mn', angle:-90, position:'insideLeft', fontSize:11 }} />
              <Tooltip formatter={v => `$${v}Mn`} />
              <Legend />
              <Area type="monotone" dataKey="environmental" name="Environmental" stackId="1" stroke={T.sage} fill={T.sage+'55'} />
              <Area type="monotone" dataKey="social" name="Social" stackId="1" stroke={T.navyL} fill={T.navyL+'55'} />
              <Area type="monotone" dataKey="product" name="Product" stackId="1" stroke={T.gold} fill={T.gold+'55'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* S12 — Regulatory Alignment */}
      <Section title="Regulatory Alignment" badge="SFDR / EU Tax / ISSB / GRI">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Regulation','Articles / Standards','Coverage','Status','Impact Data Feeds'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGS.map((r, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'10px 12px', fontWeight:700, color:T.navy }}>{r.name}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {r.articles.map(a => <span key={a} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:T.navy+'12', color:T.navy, fontWeight:500 }}>{a}</span>)}
                    </div>
                  </td>
                  <td style={{ padding:'10px 12px' }}>{r.coverage}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:r.status==='Active'?'#d1fae5':'#fef3c7', color:r.status==='Active'?'#065f46':'#92400e' }}>{r.status}</span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:11, color:T.textSec }}>IWA, IRIS+, SDG Bond, Verification</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* S13 — Sortable Holdings Table */}
      <Section title="Combined Impact Holdings" badge={`${displayed.length} holdings`}>
        <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center' }}>
          <select value={impactTypeFilter} onChange={e => setImpactTypeFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            <option value="all">All Impact</option>
            <option value="positive">Net Positive Only</option>
            <option value="negative">Net Negative Only</option>
          </select>
        </div>
        <div style={{ overflowX:'auto', background:T.surface, borderRadius:12, border:`1px solid ${T.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                <ThCell label="Company" col="company" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="IWA Total ($Mn)" col="iwaTotalMn" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="IWA Score" col="iwaScore" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="IRIS+ Score" col="irisScore" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="Evidence Tier" col="evidenceTier" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="SDGs" col="sdgAligned" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="Impact ROI" col="impactROI" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Verification</th>
                <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {displayed.slice(0, 30).map((h, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'10px 8px', fontWeight:600, color:T.navy, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.company_name}</td>
                  <td style={{ padding:'10px 8px', fontWeight:700, color:h.iwaTotalMn >= 0 ? T.green : T.red }}>{h.iwaTotalMn >= 0 ? '+' : ''}{h.iwaTotalMn}</td>
                  <td style={{ padding:'10px 8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div style={{ width:40, height:5, borderRadius:3, background:T.border }}>
                        <div style={{ width:`${h.iwaScore}%`, height:'100%', borderRadius:3, background:h.iwaScore>65?T.green:h.iwaScore>40?T.amber:T.red }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600 }}>{h.iwaScore}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div style={{ width:40, height:5, borderRadius:3, background:T.border }}>
                        <div style={{ width:`${h.irisScore}%`, height:'100%', borderRadius:3, background:h.irisScore>65?'#7c3aed':h.irisScore>40?T.amber:T.red }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600 }}>{h.irisScore}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 8px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:700, background:(h.evidenceTier<=2?T.green:h.evidenceTier<=3?T.amber:T.red)+'22', color:h.evidenceTier<=2?T.green:h.evidenceTier<=3?T.amber:T.red }}>T{h.evidenceTier}</span>
                  </td>
                  <td style={{ padding:'10px 8px', fontWeight:600 }}>{h.sdgAligned}/17</td>
                  <td style={{ padding:'10px 8px', fontWeight:700, color:h.impactROI >= 0 ? T.green : T.red }}>{h.impactROI >= 0 ? '+' : ''}{h.impactROI}%</td>
                  <td style={{ padding:'10px 8px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:700, background:h.verificationStatus==='Verified'?'#d1fae5':h.verificationStatus==='Partial'?'#fef3c7':'#fee2e2', color:h.verificationStatus==='Verified'?'#065f46':h.verificationStatus==='Partial'?'#92400e':'#991b1b' }}>{h.verificationStatus}</span>
                  </td>
                  <td style={{ padding:'10px 8px', color:h.impWashFlags ? T.red : T.green, fontWeight:600 }}>{h.impWashFlags || '\u2713'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* S14 — Impact by Sector Breakdown */}
      <Section title="Impact by Sector" badge="Breakdown">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          {(() => {
            const sectors = [...new Set(holdings.map(h => h.sector))].slice(0, 10);
            const sectorData = sectors.map(sec => {
              const sh = holdings.filter(h => h.sector === sec);
              return {
                sector: sec.length > 16 ? sec.slice(0, 14) + '..' : sec,
                envImpact: sh.reduce((s, h) => s + h.iwaEnvMn, 0),
                socialImpact: sh.reduce((s, h) => s + h.iwaEmplMn, 0),
                productImpact: sh.reduce((s, h) => s + h.iwaProdMn, 0),
                holdings: sh.length,
              };
            }).sort((a, b) => (b.envImpact + b.socialImpact + b.productImpact) - (a.envImpact + a.socialImpact + a.productImpact));
            return (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize:10 }} label={{ value:'$Mn', position:'insideBottom', offset:-5, fontSize:11 }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize:10, fill:T.textSec }} width={110} />
                  <Tooltip formatter={v => `$${v}Mn`} />
                  <Legend />
                  <Bar dataKey="envImpact" name="Environmental" stackId="a" fill={T.sage} />
                  <Bar dataKey="socialImpact" name="Social" stackId="a" fill={T.navyL} />
                  <Bar dataKey="productImpact" name="Product" stackId="a" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </Section>

      {/* S15 — Portfolio Impact Composition Pie */}
      <Section title="Portfolio Impact Composition" badge="IWA Split">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Impact Type Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[
                  { name:'Environmental', value:Math.abs(agg.envImpactMn), fill:T.sage },
                  { name:'Employment', value:Math.abs(agg.emplImpactMn), fill:T.navyL },
                  { name:'Product', value:Math.abs(agg.prodImpactMn), fill:T.gold },
                ]} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({name,value})=>`${name}: $${value}Mn`} labelLine>
                  {[T.sage, T.navyL, T.gold].map((c,i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip formatter={v => `$${v}Mn`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Positive vs Negative Impact</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[
                  { name:'Net Positive', value:holdings.filter(h=>h.iwaTotalMn>0).length, fill:T.green },
                  { name:'Net Negative', value:holdings.filter(h=>h.iwaTotalMn<=0).length, fill:T.red },
                ]} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({name,value})=>`${name}: ${value}`} labelLine>
                  {[T.green, T.red].map((c,i)=><Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:8 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:T.green }}>{holdings.filter(h=>h.iwaTotalMn>0).length}</div>
                <div style={{ fontSize:11, color:T.textSec }}>Net Positive</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:T.red }}>{holdings.filter(h=>h.iwaTotalMn<=0).length}</div>
                <div style={{ fontSize:11, color:T.textSec }}>Net Negative</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* S16 — Module Coverage Radar */}
      <Section title="Module Coverage Radar" badge="Completeness">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[
                  { module:'IWA', coverage:agg.iwaComplete, fullMark:100 },
                  { module:'IRIS+', coverage:agg.irisComplete, fullMark:100 },
                  { module:'SDG Bond', coverage:agg.bondComplete, fullMark:100 },
                  { module:'Blended', coverage:agg.blendedComplete, fullMark:100 },
                  { module:'Verification', coverage:agg.verifyComplete, fullMark:100 },
                ]} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="module" tick={{ fontSize:12, fill:T.navy, fontWeight:600 }} />
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:10 }} />
                  <Radar name="Coverage %" dataKey="coverage" stroke={T.gold} fill={T.gold} fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Module Maturity Assessment</div>
              {MODULES.map((m, i) => {
                const coverage = [agg.iwaComplete, agg.irisComplete, agg.bondComplete, agg.blendedComplete, agg.verifyComplete][i];
                const maturity = coverage >= 80 ? 'Mature' : coverage >= 60 ? 'Developing' : coverage >= 40 ? 'Emerging' : 'Nascent';
                const matColor = coverage >= 80 ? T.green : coverage >= 60 ? T.sage : coverage >= 40 ? T.amber : T.red;
                return (
                  <div key={m.id} style={{ padding:10, marginBottom:6, borderRadius:8, border:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <span style={{ fontWeight:600, fontSize:12, color:T.navy }}>{m.name}</span>
                      <div style={{ width:120, height:5, borderRadius:3, background:T.border, marginTop:4 }}>
                        <div style={{ width:`${coverage}%`, height:'100%', borderRadius:3, background:m.color, transition:'width .3s' }} />
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, fontSize:14, color:m.color }}>{coverage}%</div>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background:matColor+'22', color:matColor, fontWeight:600 }}>{maturity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* S17 — Data Quality Dashboard */}
      <Section title="Impact Data Quality" badge="Audit">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              { label:'Data Completeness', value:Math.round(holdings.filter(h=>h.iwaScore > 30 && h.irisScore > 30).length / holdings.length * 100), color:T.sage },
              { label:'Cross-Validation', value:Math.round(holdings.filter(h=>Math.abs(h.iwaScore - h.irisScore) < 20).length / holdings.length * 100), color:T.navyL },
              { label:'Timeliness', value:Math.round(78 + seed(999) * 15), color:T.gold },
              { label:'Auditability', value:Math.round(holdings.filter(h=>h.evidenceTier <= 3).length / holdings.length * 100), color:T.green },
            ].map(d => (
              <div key={d.label} style={{ padding:12, borderRadius:8, background:T.surfaceH, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:d.color }}>{d.value}%</div>
                <div style={{ fontSize:11, color:T.textSec, fontWeight:600, marginTop:2 }}>{d.label}</div>
                <div style={{ width:'100%', height:5, borderRadius:3, background:T.border, marginTop:6 }}>
                  <div style={{ width:`${d.value}%`, height:'100%', borderRadius:3, background:d.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:T.textSec }}>
            <strong>Data sources:</strong> IWA monetized accounts, IRIS+ catalog metrics, SDG bond impact reports, blended finance structuring data, and verification/assurance records.
            Data freshness: updated quarterly. Next scheduled update: Q2 2026.
          </div>
        </div>
      </Section>

      {/* S18 — Geographic Impact Distribution */}
      <Section title="Geographic Impact Distribution" badge="Regional">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          {(() => {
            const regions = {};
            holdings.forEach(h => {
              const r = h.countryCode === 'IN' ? 'India' : h.countryCode === 'US' ? 'North America' : h.countryCode === 'GB' || h.countryCode === 'DE' || h.countryCode === 'FR' ? 'Europe' : h.countryCode === 'JP' || h.countryCode === 'SG' || h.countryCode === 'HK' ? 'Asia-Pacific' : h.countryCode === 'BR' ? 'Latin America' : h.countryCode === 'AU' ? 'Oceania' : h.countryCode === 'ZA' ? 'Africa' : 'Other';
              if (!regions[r]) regions[r] = { impact:0, holdings:0, beneficiaries:0 };
              regions[r].impact += h.iwaTotalMn;
              regions[r].holdings += 1;
              regions[r].beneficiaries += h.beneficiaries;
            });
            const regionData = Object.entries(regions).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.impact - a.impact);
            return (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:10 }} label={{ value:'$Mn Impact', angle:-90, position:'insideLeft', fontSize:10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="impact" name="Net Impact ($Mn)" fill={T.navy} />
                  <Bar dataKey="holdings" name="# Holdings" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </Section>

      {/* S19 — Cross-navigation */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:20, paddingTop:16, borderTop:`2px solid ${T.border}` }}>
        {[
          ...MODULES.map(m => ({ label:m.name, path:m.path })),
          { label:'Social Impact', path:'/social-impact' },
          { label:'SDG Tracker', path:'/sdg-tracker' },
          { label:'PE/VC ESG', path:'/pe-vc-esg' },
          { label:'Greenwashing', path:'/greenwashing-detection' },
          { label:'Portfolio Dashboard', path:'/portfolio-dashboard' },
        ].map(n => (
          <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background:T.surfaceH }}>{n.label} {'\u2192'}</Btn>
        ))}
      </div>
    </div>
  );
}
