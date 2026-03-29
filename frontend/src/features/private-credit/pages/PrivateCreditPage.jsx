import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, ScatterChart, Scatter, ZAxis, AreaChart, Area, LineChart, Line
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#6b7280','#16a34a','#9333ea'];
const ESG_TIER_COLORS = { high:T.green, medium:T.gold, low:T.red };

const LS_KEY = 'ra_private_credit_v1';

/* ═══════════════════════════════════════════════════════════════
   CREDIT PORTFOLIO — 15 Facilities
   ═══════════════════════════════════════════════════════════════ */
const CREDIT_PORTFOLIO_INIT = [
  { id:'PC001', borrower:'Solaris Energy', sector:'Renewable Energy', facility_type:'Senior Secured', commitment_mn:50, drawn_mn:35, currency:'USD', tenor_yr:5, spread_bps:450, rating:'BB+', esg_score:75, pd_pct:2.5, lgd_pct:35, el_mn:0.44, covenant_type:'ESG-linked', esg_kpis:['GHG -30% by 2028','Renewable % > 80%'], margin_ratchet_bps:25, country:'US', employees:200, revenue_mn:42, lma_use_of_proceeds:true, lma_project_eval:true, lma_mgmt_proceeds:true, lma_reporting:true, pcaf_equity_mn:15, pcaf_debt_mn:35 },
  { id:'PC002', borrower:'MediServe Group', sector:'Healthcare', facility_type:'Unitranche', commitment_mn:80, drawn_mn:80, currency:'EUR', tenor_yr:6, spread_bps:550, rating:'BB', esg_score:62, pd_pct:4.0, lgd_pct:40, el_mn:1.28, covenant_type:'Standard', esg_kpis:[], margin_ratchet_bps:0, country:'DE', employees:850, revenue_mn:95, lma_use_of_proceeds:false, lma_project_eval:false, lma_mgmt_proceeds:false, lma_reporting:false, pcaf_equity_mn:30, pcaf_debt_mn:80 },
  { id:'PC003', borrower:'TransitCore Infra', sector:'Infrastructure', facility_type:'Senior Secured', commitment_mn:120, drawn_mn:100, currency:'USD', tenor_yr:7, spread_bps:400, rating:'BBB-', esg_score:71, pd_pct:1.8, lgd_pct:30, el_mn:0.54, covenant_type:'ESG-linked', esg_kpis:['EV fleet share > 50%','Safety incidents < 5/yr'], margin_ratchet_bps:20, country:'US', employees:1200, revenue_mn:180, lma_use_of_proceeds:true, lma_project_eval:true, lma_mgmt_proceeds:false, lma_reporting:true, pcaf_equity_mn:50, pcaf_debt_mn:100 },
  { id:'PC004', borrower:'GreenHaven REIT', sector:'Real Estate', facility_type:'Mezzanine', commitment_mn:65, drawn_mn:65, currency:'GBP', tenor_yr:5, spread_bps:700, rating:'B+', esg_score:68, pd_pct:5.5, lgd_pct:50, el_mn:1.79, covenant_type:'ESG-linked', esg_kpis:['BREEAM Excellent for new builds','Energy reduction -20% by 2027'], margin_ratchet_bps:15, country:'UK', employees:120, revenue_mn:38, lma_use_of_proceeds:true, lma_project_eval:false, lma_mgmt_proceeds:true, lma_reporting:true, pcaf_equity_mn:25, pcaf_debt_mn:65 },
  { id:'PC005', borrower:'CyberShield Tech', sector:'Technology', facility_type:'Unitranche', commitment_mn:90, drawn_mn:70, currency:'USD', tenor_yr:5, spread_bps:500, rating:'BB', esg_score:58, pd_pct:3.5, lgd_pct:38, el_mn:0.93, covenant_type:'Standard', esg_kpis:[], margin_ratchet_bps:0, country:'US', employees:380, revenue_mn:62, lma_use_of_proceeds:false, lma_project_eval:false, lma_mgmt_proceeds:false, lma_reporting:false, pcaf_equity_mn:28, pcaf_debt_mn:70 },
  { id:'PC006', borrower:'NutriChoice Foods', sector:'Consumer', facility_type:'Senior Secured', commitment_mn:45, drawn_mn:40, currency:'EUR', tenor_yr:4, spread_bps:425, rating:'BB+', esg_score:66, pd_pct:3.0, lgd_pct:35, el_mn:0.42, covenant_type:'ESG-linked', esg_kpis:['Sustainable sourcing > 75%','Food waste -40%'], margin_ratchet_bps:15, country:'FR', employees:650, revenue_mn:88, lma_use_of_proceeds:false, lma_project_eval:true, lma_mgmt_proceeds:false, lma_reporting:true, pcaf_equity_mn:20, pcaf_debt_mn:40 },
  { id:'PC007', borrower:'SteelForge Industries', sector:'Industrial', facility_type:'Second Lien', commitment_mn:70, drawn_mn:70, currency:'USD', tenor_yr:6, spread_bps:750, rating:'B', esg_score:45, pd_pct:8.0, lgd_pct:60, el_mn:3.36, covenant_type:'Standard', esg_kpis:[], margin_ratchet_bps:0, country:'US', employees:2200, revenue_mn:310, lma_use_of_proceeds:false, lma_project_eval:false, lma_mgmt_proceeds:false, lma_reporting:false, pcaf_equity_mn:40, pcaf_debt_mn:70 },
  { id:'PC008', borrower:'HarvestLink Agri', sector:'Agriculture', facility_type:'Senior Secured', commitment_mn:30, drawn_mn:25, currency:'USD', tenor_yr:4, spread_bps:475, rating:'BB', esg_score:73, pd_pct:3.2, lgd_pct:32, el_mn:0.26, covenant_type:'ESG-linked', esg_kpis:['Organic certification > 60%','Regenerative practices on 5000+ ha'], margin_ratchet_bps:20, country:'BR', employees:180, revenue_mn:22, lma_use_of_proceeds:true, lma_project_eval:true, lma_mgmt_proceeds:true, lma_reporting:true, pcaf_equity_mn:10, pcaf_debt_mn:25 },
  { id:'PC009', borrower:'SwiftChain Logistics', sector:'Logistics', facility_type:'Unitranche', commitment_mn:55, drawn_mn:50, currency:'EUR', tenor_yr:5, spread_bps:525, rating:'BB-', esg_score:60, pd_pct:4.5, lgd_pct:42, el_mn:0.95, covenant_type:'Standard', esg_kpis:[], margin_ratchet_bps:0, country:'DE', employees:420, revenue_mn:75, lma_use_of_proceeds:false, lma_project_eval:false, lma_mgmt_proceeds:false, lma_reporting:false, pcaf_equity_mn:18, pcaf_debt_mn:50 },
  { id:'PC010', borrower:'BrightMinds Academy', sector:'Education', facility_type:'Senior Secured', commitment_mn:25, drawn_mn:20, currency:'GBP', tenor_yr:5, spread_bps:500, rating:'BB+', esg_score:80, pd_pct:2.0, lgd_pct:28, el_mn:0.11, covenant_type:'ESG-linked', esg_kpis:['Student satisfaction > 85%','Gender parity in STEM'], margin_ratchet_bps:20, country:'UK', employees:300, revenue_mn:18, lma_use_of_proceeds:false, lma_project_eval:true, lma_mgmt_proceeds:false, lma_reporting:true, pcaf_equity_mn:8, pcaf_debt_mn:20 },
  { id:'PC011', borrower:'AquaNet Utilities', sector:'Water', facility_type:'Senior Secured', commitment_mn:85, drawn_mn:75, currency:'USD', tenor_yr:8, spread_bps:375, rating:'BBB', esg_score:82, pd_pct:1.5, lgd_pct:25, el_mn:0.28, covenant_type:'ESG-linked', esg_kpis:['NRW < 15%','100% wastewater treatment'], margin_ratchet_bps:30, country:'IN', employees:550, revenue_mn:52, lma_use_of_proceeds:true, lma_project_eval:true, lma_mgmt_proceeds:true, lma_reporting:true, pcaf_equity_mn:25, pcaf_debt_mn:75 },
  { id:'PC012', borrower:'ConnectWave Telecom', sector:'Telecom', facility_type:'Unitranche', commitment_mn:100, drawn_mn:85, currency:'USD', tenor_yr:6, spread_bps:475, rating:'BB', esg_score:56, pd_pct:3.8, lgd_pct:40, el_mn:1.29, covenant_type:'Standard', esg_kpis:[], margin_ratchet_bps:0, country:'SG', employees:700, revenue_mn:125, lma_use_of_proceeds:false, lma_project_eval:false, lma_mgmt_proceeds:false, lma_reporting:false, pcaf_equity_mn:35, pcaf_debt_mn:85 },
  { id:'PC013', borrower:'EcoTextile Corp', sector:'Consumer', facility_type:'Senior Secured', commitment_mn:35, drawn_mn:30, currency:'EUR', tenor_yr:4, spread_bps:450, rating:'BB+', esg_score:77, pd_pct:2.2, lgd_pct:30, el_mn:0.20, covenant_type:'ESG-linked', esg_kpis:['Recycled input > 50%','Water intensity -35%'], margin_ratchet_bps:20, country:'IT', employees:400, revenue_mn:45, lma_use_of_proceeds:true, lma_project_eval:true, lma_mgmt_proceeds:false, lma_reporting:true, pcaf_equity_mn:12, pcaf_debt_mn:30 },
  { id:'PC014', borrower:'DataVault Cloud', sector:'Technology', facility_type:'Mezzanine', commitment_mn:60, drawn_mn:55, currency:'USD', tenor_yr:5, spread_bps:650, rating:'B+', esg_score:52, pd_pct:6.0, lgd_pct:55, el_mn:1.82, covenant_type:'Standard', esg_kpis:[], margin_ratchet_bps:0, country:'US', employees:260, revenue_mn:48, lma_use_of_proceeds:false, lma_project_eval:false, lma_mgmt_proceeds:false, lma_reporting:false, pcaf_equity_mn:20, pcaf_debt_mn:55 },
  { id:'PC015', borrower:'CleanPort Shipping', sector:'Infrastructure', facility_type:'Senior Secured', commitment_mn:95, drawn_mn:80, currency:'USD', tenor_yr:7, spread_bps:425, rating:'BB+', esg_score:70, pd_pct:2.8, lgd_pct:33, el_mn:0.74, covenant_type:'ESG-linked', esg_kpis:['IMO 2030 compliance','Shore power at 3+ ports'], margin_ratchet_bps:25, country:'JP', employees:900, revenue_mn:145, lma_use_of_proceeds:true, lma_project_eval:true, lma_mgmt_proceeds:true, lma_reporting:true, pcaf_equity_mn:38, pcaf_debt_mn:80 },
];

/* ═══════════════════════════════════════════════════════════════
   LMA GREEN LOAN PRINCIPLES
   ═══════════════════════════════════════════════════════════════ */
const LMA_PRINCIPLES = [
  { key:'lma_use_of_proceeds', label:'Use of Proceeds', desc:'Proceeds applied to eligible green/social projects' },
  { key:'lma_project_eval', label:'Project Evaluation & Selection', desc:'Clear criteria for evaluating and selecting eligible projects' },
  { key:'lma_mgmt_proceeds', label:'Management of Proceeds', desc:'Tracked in sub-account or equivalent with formal internal process' },
  { key:'lma_reporting', label:'Reporting', desc:'Annual report on use of proceeds, expected impact, and qualitative performance' },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const fmt = (n, d=1) => n == null ? '-' : Number(n).toFixed(d);
const fmtI = n => n == null ? '-' : Math.round(n).toLocaleString();
const fmtM = n => n == null ? '-' : `$${Number(n).toFixed(1)}M`;
const pct = n => n == null ? '-' : `${Number(n).toFixed(1)}%`;

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

const esgTier = (score) => score >= 70 ? 'high' : score >= 55 ? 'medium' : 'low';
const esgTierLabel = (score) => score >= 70 ? 'Strong' : score >= 55 ? 'Moderate' : 'Weak';

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PrivateCreditPage() {
  const nav = useNavigate();

  /* — Portfolio state with localStorage — */
  const [facilities, setFacilities] = useState(() => {
    try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
    return CREDIT_PORTFOLIO_INIT;
  });
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(facilities)); } catch {} }, [facilities]);

  const [activeTab, setActiveTab] = useState('overview');
  const [sortCol, setSortCol] = useState('esg_score');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [ratchetSlider, setRatchetSlider] = useState(100); // pct of KPIs met

  /* — Add Form — */
  const emptyForm = { borrower:'', sector:'Renewable Energy', facility_type:'Senior Secured', commitment_mn:'', drawn_mn:'', currency:'USD', tenor_yr:'', spread_bps:'', rating:'BB', esg_score:'', pd_pct:'', lgd_pct:'', covenant_type:'Standard', esg_kpis_str:'', margin_ratchet_bps:'', country:'US', employees:'', revenue_mn:'' };
  const [formData, setFormData] = useState(emptyForm);
  const SECTORS = [...new Set(CREDIT_PORTFOLIO_INIT.map(f => f.sector))].sort();
  const FACILITY_TYPES = ['Senior Secured','Unitranche','Mezzanine','Second Lien'];
  const RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];
  const CURRENCIES = ['USD','EUR','GBP','SGD','JPY','INR','BRL','AUD'];
  const COUNTRIES = [...new Set(CREDIT_PORTFOLIO_INIT.map(f => f.country))].sort();

  /* — KPIs — */
  const kpis = useMemo(() => {
    const n = facilities.length;
    const totalCommit = facilities.reduce((s, f) => s + f.commitment_mn, 0);
    const totalDrawn = facilities.reduce((s, f) => s + f.drawn_mn, 0);
    const wtdSpread = totalDrawn > 0 ? facilities.reduce((s, f) => s + f.spread_bps * f.drawn_mn, 0) / totalDrawn : 0;
    const avgESG = n > 0 ? facilities.reduce((s, f) => s + f.esg_score, 0) / n : 0;
    const esgLinked = facilities.filter(f => f.covenant_type === 'ESG-linked').length;
    const esgLinkedPct = n > 0 ? (esgLinked / n * 100) : 0;
    const totalEL = facilities.reduce((s, f) => s + f.el_mn, 0);
    const avgPD = n > 0 ? facilities.reduce((s, f) => s + f.pd_pct, 0) / n : 0;
    const avgLGD = n > 0 ? facilities.reduce((s, f) => s + f.lgd_pct, 0) / n : 0;
    const ratchetSavings = facilities.filter(f => f.margin_ratchet_bps > 0).reduce((s, f) => s + (f.margin_ratchet_bps / 10000) * f.drawn_mn, 0);
    const wtdTenor = totalDrawn > 0 ? facilities.reduce((s, f) => s + f.tenor_yr * f.drawn_mn, 0) / totalDrawn : 0;
    return { n, totalCommit, totalDrawn, wtdSpread, avgESG, esgLinkedPct, totalEL, avgPD, avgLGD, ratchetSavings, wtdTenor };
  }, [facilities]);

  /* — Sorted facilities — */
  const sorted = useMemo(() => {
    return [...facilities].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? (va - vb) : (vb - va);
    });
  }, [facilities, sortCol, sortDir]);

  /* — Chart data — */
  const facilityTypeData = useMemo(() => {
    const m = {};
    facilities.forEach(f => { m[f.facility_type] = (m[f.facility_type] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [facilities]);

  const sectorExposure = useMemo(() => {
    const m = {};
    facilities.forEach(f => { m[f.sector] = (m[f.sector] || 0) + f.commitment_mn; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [facilities]);

  const scatterData = useMemo(() => facilities.map(f => ({
    name: f.borrower, esg: f.esg_score, pd: f.pd_pct, size: f.commitment_mn,
  })), [facilities]);

  const waterfallData = useMemo(() => {
    return facilities.map(f => ({
      name: f.borrower.split(' ')[0],
      el: f.el_mn,
      tier: esgTier(f.esg_score),
    })).sort((a, b) => b.el - a.el);
  }, [facilities]);

  /* — PCAF attribution — */
  const pcafData = useMemo(() => {
    return facilities.map(f => {
      const totalCapital = (f.pcaf_equity_mn || 0) + (f.pcaf_debt_mn || 0);
      const attribution = totalCapital > 0 ? f.drawn_mn / totalCapital : 0;
      return { borrower: f.borrower, drawn: f.drawn_mn, equity: f.pcaf_equity_mn || 0, debt: f.pcaf_debt_mn || 0, totalCapital, attribution: Math.min(attribution, 1), esg: f.esg_score };
    });
  }, [facilities]);

  /* — CRUD — */
  const addFacility = () => {
    const newF = {
      id: `PC${String(facilities.length + 1).padStart(3,'0')}`,
      borrower: formData.borrower,
      sector: formData.sector,
      facility_type: formData.facility_type,
      commitment_mn: Number(formData.commitment_mn) || 0,
      drawn_mn: Number(formData.drawn_mn) || 0,
      currency: formData.currency,
      tenor_yr: Number(formData.tenor_yr) || 5,
      spread_bps: Number(formData.spread_bps) || 0,
      rating: formData.rating,
      esg_score: Number(formData.esg_score) || 50,
      pd_pct: Number(formData.pd_pct) || 0,
      lgd_pct: Number(formData.lgd_pct) || 0,
      el_mn: (Number(formData.pd_pct) / 100) * (Number(formData.lgd_pct) / 100) * (Number(formData.drawn_mn) || 0),
      covenant_type: formData.covenant_type,
      esg_kpis: formData.esg_kpis_str ? formData.esg_kpis_str.split(';').map(s => s.trim()) : [],
      margin_ratchet_bps: Number(formData.margin_ratchet_bps) || 0,
      country: formData.country,
      employees: Number(formData.employees) || 0,
      revenue_mn: Number(formData.revenue_mn) || 0,
      lma_use_of_proceeds: false, lma_project_eval: false, lma_mgmt_proceeds: false, lma_reporting: false,
      pcaf_equity_mn: 0, pcaf_debt_mn: Number(formData.drawn_mn) || 0,
    };
    if (!newF.borrower) return;
    setFacilities(prev => [...prev, newF]);
    setFormData(emptyForm);
    setShowAddForm(false);
  };

  const deleteFacility = (id) => {
    if (!window.confirm(`Delete facility ${id}?`)) return;
    setFacilities(prev => prev.filter(f => f.id !== id));
    if (selectedFacility?.id === id) setSelectedFacility(null);
  };

  /* — Exports — */
  const exportPortfolio = () => {
    downloadCSV('private_credit_portfolio.csv', facilities.map(f => ({
      ID:f.id, Borrower:f.borrower, Sector:f.sector, Type:f.facility_type, 'Commitment ($M)':f.commitment_mn,
      'Drawn ($M)':f.drawn_mn, Currency:f.currency, Tenor:f.tenor_yr, 'Spread (bps)':f.spread_bps,
      Rating:f.rating, 'ESG Score':f.esg_score, 'PD %':f.pd_pct, 'LGD %':f.lgd_pct, 'EL ($M)':f.el_mn,
      Covenant:f.covenant_type, 'ESG KPIs':f.esg_kpis.join('; '), 'Ratchet (bps)':f.margin_ratchet_bps,
      Country:f.country, Employees:f.employees, 'Revenue ($M)':f.revenue_mn,
    })));
  };

  const exportLMA = () => {
    const rows = facilities.map(f => ({
      Borrower:f.borrower, 'Use of Proceeds':f.lma_use_of_proceeds?'Yes':'No',
      'Project Evaluation':f.lma_project_eval?'Yes':'No', 'Management of Proceeds':f.lma_mgmt_proceeds?'Yes':'No',
      Reporting:f.lma_reporting?'Yes':'No', Compliant: (f.lma_use_of_proceeds && f.lma_project_eval && f.lma_mgmt_proceeds && f.lma_reporting) ? 'Full' : 'Partial',
    }));
    downloadCSV('private_credit_lma.csv', rows);
  };

  const exportPCAF = () => {
    downloadCSV('private_credit_pcaf.csv', pcafData.map(p => ({
      Borrower:p.borrower, 'Drawn ($M)':p.drawn, 'Equity ($M)':p.equity, 'Debt ($M)':p.debt,
      'Total Capital ($M)':p.totalCapital, 'Attribution Factor':fmt(p.attribution, 4), 'ESG Score':p.esg,
    })));
  };

  /* ═══════════════ STYLES ═══════════════ */
  const s = {
    page: { fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.text },
    card: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 },
    kpi: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, textAlign:'center', flex:'1 1 130px', minWidth:130 },
    kpiVal: { fontSize:22, fontWeight:700, color:T.navy },
    kpiLbl: { fontSize:11, color:T.textMut, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 },
    btn: { padding:'7px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:T.navy, color:'#fff' },
    btnGold: { padding:'7px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:T.gold, color:'#fff' },
    btnOutline: { padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:600, background:'transparent', color:T.text },
    tab: (a) => ({ padding:'8px 18px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:a?T.navy:'transparent', color:a?'#fff':T.textSec, marginRight:4 }),
    th: { padding:'8px 10px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:T.textMut, borderBottom:`2px solid ${T.border}`, cursor:'pointer', userSelect:'none', textAlign:'left' },
    td: { padding:'8px 10px', fontSize:12, borderBottom:`1px solid ${T.border}`, verticalAlign:'top' },
    input: { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, width:'100%', boxSizing:'border-box' },
    select: { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, background:'#fff' },
    esgBadge: (score) => {
      const c = score >= 70 ? T.green : score >= 55 ? T.gold : T.red;
      return { display:'inline-block', padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:700, color:'#fff', background:c };
    },
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>Private Credit ESG Scoring</h1>
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {['15 Facilities','ESG-Linked','PCAF','LMA Green Loan'].map((b, i) => (
              <span key={i} style={{ display:'inline-block', padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:600, color:[T.navy,'#7c3aed',T.sage,T.gold][i], background:[T.surfaceH,'#f3f0ff','#f0fdf4','#fdf6e3'][i] }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button style={s.btn} onClick={exportPortfolio}>Export Portfolio CSV</button>
          <button style={s.btnGold} onClick={exportLMA}>Export LMA CSV</button>
          <button style={{...s.btn, background:T.sage}} onClick={exportPCAF}>Export PCAF CSV</button>
          <button style={s.btnOutline} onClick={() => nav('/fixed-income-esg')}>FI ESG</button>
          <button style={s.btnOutline} onClick={() => nav('/portfolio-suite')}>Portfolio Suite</button>
          <button style={s.btnOutline} onClick={() => nav('/risk-attribution')}>Risk Attribution</button>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        {[
          { label:'Total Commitment', val:fmtM(kpis.totalCommit) },
          { label:'Total Drawn', val:fmtM(kpis.totalDrawn) },
          { label:'Wtd Avg Spread', val:`${Math.round(kpis.wtdSpread)} bps` },
          { label:'Avg ESG Score', val:fmt(kpis.avgESG, 0) },
          { label:'ESG-Linked %', val:pct(kpis.esgLinkedPct) },
          { label:'Expected Loss', val:fmtM(kpis.totalEL) },
          { label:'Avg PD', val:pct(kpis.avgPD) },
          { label:'Avg LGD', val:pct(kpis.avgLGD) },
          { label:'Ratchet Savings/yr', val:fmtM(kpis.ratchetSavings) },
          { label:'Wtd Tenor (yrs)', val:fmt(kpis.wtdTenor, 1) },
        ].map((k, i) => (
          <div key={i} style={s.kpi}>
            <div style={s.kpiVal}>{k.val}</div>
            <div style={s.kpiLbl}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:2, marginBottom:20, flexWrap:'wrap' }}>
        {['overview','esgLinked','lma','pcaf','charts','ratchet','addFacility'].map(t => (
          <button key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
            {{ overview:'Portfolio Table', esgLinked:'ESG-Linked Details', lma:'LMA Compliance', pcaf:'PCAF Attribution', charts:'Analytics', ratchet:'Ratchet Calculator', addFacility:'+ Add Facility' }[t]}
          </button>
        ))}
      </div>

      {/* ═══════════════ PORTFOLIO TABLE ═══════════════ */}
      {activeTab === 'overview' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>Credit Portfolio - Sortable</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {[
                    { key:'id', label:'ID' }, { key:'borrower', label:'Borrower' }, { key:'sector', label:'Sector' },
                    { key:'facility_type', label:'Type' }, { key:'commitment_mn', label:'Commit ($M)' },
                    { key:'drawn_mn', label:'Drawn ($M)' }, { key:'currency', label:'Ccy' },
                    { key:'tenor_yr', label:'Tenor' }, { key:'spread_bps', label:'Spread' },
                    { key:'rating', label:'Rating' }, { key:'esg_score', label:'ESG' },
                    { key:'pd_pct', label:'PD %' }, { key:'lgd_pct', label:'LGD %' },
                    { key:'el_mn', label:'EL ($M)' }, { key:'covenant_type', label:'Covenant' },
                    { key:'country', label:'Country' },
                  ].map(c => (
                    <th key={c.key} style={s.th} onClick={() => { setSortCol(c.key); setSortDir(prev => sortCol === c.key ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'); }}>
                      {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                  ))}
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(f => (
                  <tr key={f.id} style={{ background: selectedFacility?.id === f.id ? T.surfaceH : 'transparent', cursor:'pointer' }}
                    onClick={() => setSelectedFacility(f)}>
                    <td style={s.td}>{f.id}</td>
                    <td style={{...s.td, fontWeight:600}}>{f.borrower}</td>
                    <td style={s.td}>{f.sector}</td>
                    <td style={s.td}>{f.facility_type}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(f.commitment_mn, 0)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(f.drawn_mn, 0)}</td>
                    <td style={s.td}>{f.currency}</td>
                    <td style={{...s.td, textAlign:'right'}}>{f.tenor_yr}yr</td>
                    <td style={{...s.td, textAlign:'right'}}>{f.spread_bps}</td>
                    <td style={{...s.td, fontWeight:600}}>{f.rating}</td>
                    <td style={s.td}><span style={s.esgBadge(f.esg_score)}>{f.esg_score}</span></td>
                    <td style={{...s.td, textAlign:'right'}}>{pct(f.pd_pct)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{pct(f.lgd_pct)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(f.el_mn)}</td>
                    <td style={s.td}><span style={{ color: f.covenant_type === 'ESG-linked' ? T.green : T.textMut, fontWeight:600 }}>{f.covenant_type}</span></td>
                    <td style={s.td}>{f.country}</td>
                    <td style={s.td}>
                      <button style={{ fontSize:10, padding:'2px 6px', borderRadius:4, border:`1px solid ${T.red}`, background:'transparent', color:T.red, cursor:'pointer' }}
                        onClick={(e) => { e.stopPropagation(); deleteFacility(f.id); }}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selectedFacility && (
            <div style={{ marginTop:20, padding:20, background:T.surfaceH, borderRadius:10, border:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h4 style={{ margin:0, fontSize:18, fontWeight:700, color:T.navy }}>{selectedFacility.borrower} ({selectedFacility.id})</h4>
                <button style={s.btnOutline} onClick={() => setSelectedFacility(null)}>Close</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
                {[
                  ['Sector', selectedFacility.sector], ['Type', selectedFacility.facility_type],
                  ['Commitment', fmtM(selectedFacility.commitment_mn)], ['Drawn', fmtM(selectedFacility.drawn_mn)],
                  ['Currency', selectedFacility.currency], ['Tenor', `${selectedFacility.tenor_yr}yr`],
                  ['Spread', `${selectedFacility.spread_bps} bps`], ['Rating', selectedFacility.rating],
                  ['ESG Score', selectedFacility.esg_score], ['PD', pct(selectedFacility.pd_pct)],
                  ['LGD', pct(selectedFacility.lgd_pct)], ['Expected Loss', fmtM(selectedFacility.el_mn)],
                  ['Country', selectedFacility.country], ['Employees', fmtI(selectedFacility.employees)],
                  ['Revenue', fmtM(selectedFacility.revenue_mn)], ['Covenant', selectedFacility.covenant_type],
                  ['Ratchet', `${selectedFacility.margin_ratchet_bps} bps`],
                ].map(([l, v], i) => (
                  <div key={i}>
                    <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
              {selectedFacility.esg_kpis.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.textSec }}>ESG KPIs:</div>
                  {selectedFacility.esg_kpis.map((kpi, i) => (
                    <span key={i} style={{ display:'inline-block', padding:'3px 10px', borderRadius:9999, fontSize:10, fontWeight:600, color:T.green, background:'#f0fdf4', margin:'2px 4px 2px 0' }}>{kpi}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ ESG-LINKED DETAILS ═══════════════ */}
      {activeTab === 'esgLinked' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>ESG-Linked Facility Details</h3>
          {facilities.filter(f => f.covenant_type === 'ESG-linked').length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:T.textMut }}>No ESG-linked facilities in portfolio</div>
          )}
          {facilities.filter(f => f.covenant_type === 'ESG-linked').map(f => (
            <div key={f.id} style={{ marginBottom:16, padding:16, background:T.surfaceH, borderRadius:8, border:`1px solid ${T.border}`, borderLeft:`4px solid ${T.green}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontSize:15, fontWeight:700, color:T.navy }}>{f.borrower}</span>
                  <span style={{ fontSize:11, color:T.textSec, marginLeft:8 }}>{f.sector} | {f.facility_type} | {fmtM(f.drawn_mn)} drawn</span>
                </div>
                <span style={s.esgBadge(f.esg_score)}>ESG {f.esg_score}</span>
              </div>
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4 }}>Sustainability Performance Targets (SPTs):</div>
                {f.esg_kpis.map((kpi, i) => {
                  const onTrack = sr(_sc++) > 0.3;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ width:16, height:16, borderRadius:'50%', background: onTrack ? T.green : T.red, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff' }}>
                        {onTrack ? '\u2713' : '\u2717'}
                      </span>
                      <span style={{ fontSize:12 }}>{kpi}</span>
                      <span style={{ fontSize:10, color: onTrack ? T.green : T.red, fontWeight:600 }}>{onTrack ? 'On Track' : 'Off Track'}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop:6, fontSize:11, color:T.textSec }}>
                  Margin ratchet: <strong style={{ color:T.green }}>{f.margin_ratchet_bps} bps</strong> reduction if all KPIs met
                  {' '}= <strong>${fmt((f.margin_ratchet_bps / 10000) * f.drawn_mn, 3)}M/yr</strong> savings
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ LMA COMPLIANCE ═══════════════ */}
      {activeTab === 'lma' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>LMA Green Loan Principles Compliance</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Borrower</th>
                  <th style={s.th}>Sector</th>
                  <th style={s.th}>ESG Score</th>
                  {LMA_PRINCIPLES.map(p => <th key={p.key} style={{...s.th, textAlign:'center'}}>{p.label}</th>)}
                  <th style={{...s.th, textAlign:'center'}}>Full Compliance</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map(f => {
                  const full = LMA_PRINCIPLES.every(p => f[p.key]);
                  const count = LMA_PRINCIPLES.filter(p => f[p.key]).length;
                  return (
                    <tr key={f.id}>
                      <td style={{...s.td, fontWeight:600}}>{f.borrower}</td>
                      <td style={s.td}>{f.sector}</td>
                      <td style={s.td}><span style={s.esgBadge(f.esg_score)}>{f.esg_score}</span></td>
                      {LMA_PRINCIPLES.map(p => (
                        <td key={p.key} style={{...s.td, textAlign:'center'}}>
                          <span style={{ fontSize:16, color: f[p.key] ? T.green : T.red }}>{f[p.key] ? '\u2713' : '\u2717'}</span>
                        </td>
                      ))}
                      <td style={{...s.td, textAlign:'center'}}>
                        <span style={{ padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:700, color:'#fff', background: full ? T.green : count >= 2 ? T.amber : T.red }}>
                          {full ? 'Full' : `${count}/4`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16, fontSize:12, color:T.textSec }}>
            <strong>LMA Green Loan Principles:</strong> (1) Use of Proceeds for eligible projects; (2) Project Evaluation and Selection with clear criteria; (3) Management of Proceeds via sub-accounts; (4) Annual Reporting on impact and allocation.
          </div>
        </div>
      )}

      {/* ═══════════════ PCAF ATTRIBUTION ═══════════════ */}
      {activeTab === 'pcaf' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>PCAF Attribution for Private Credit</h3>
          <p style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>
            Attribution Factor = Outstanding Amount / (Total Equity + Total Debt). For private credit, PCAF data quality score is typically 4-5 (estimated data).
          </p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Borrower</th>
                  <th style={{...s.th, textAlign:'right'}}>Drawn ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Equity ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Debt ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Total Capital ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Attribution Factor</th>
                  <th style={{...s.th, textAlign:'center'}}>ESG Score</th>
                  <th style={{...s.th, textAlign:'center'}}>Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {pcafData.map((p, i) => (
                  <tr key={i}>
                    <td style={{...s.td, fontWeight:600}}>{p.borrower}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(p.drawn)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(p.equity)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(p.debt)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(p.totalCapital)}</td>
                    <td style={{...s.td, textAlign:'right', fontWeight:700}}>{fmt(p.attribution, 3)}</td>
                    <td style={{...s.td, textAlign:'center'}}><span style={s.esgBadge(p.esg)}>{p.esg}</span></td>
                    <td style={{...s.td, textAlign:'center'}}>
                      <span style={{ padding:'2px 8px', borderRadius:9999, fontSize:10, fontWeight:700, color:T.amber, background:'#fef9c3' }}>Score 4</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ CHARTS ═══════════════ */}
      {activeTab === 'charts' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {/* ESG vs PD Scatter */}
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>ESG Score vs Credit Risk (PD)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="esg" name="ESG Score" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'ESG Score', position:'insideBottom', offset:-5, fontSize:11 }} />
                  <YAxis dataKey="pd" name="PD %" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'PD %', angle:-90, position:'insideLeft', fontSize:11 }} />
                  <ZAxis dataKey="size" range={[40, 400]} name="Commitment ($M)" />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v, name) => [name === 'Commitment ($M)' ? `$${v}M` : typeof v === 'number' ? v.toFixed(1) : v, name]} />
                  <Scatter data={scatterData} fill={T.navyL}>
                    {scatterData.map((d, i) => <Cell key={i} fill={d.esg >= 70 ? T.green : d.esg >= 55 ? T.gold : T.red} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Facility Type Distribution */}
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Facility Type Distribution</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={facilityTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {facilityTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {/* Sector Exposure */}
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Sector Exposure by Commitment ($M)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sectorExposure} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize:10, fill:T.textSec }} />
                  <Tooltip formatter={v => [`$${v}M`, 'Commitment']} />
                  <Bar dataKey="value" fill={T.navy} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* EL Waterfall */}
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Expected Loss by Facility (ESG color-coded)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} label={{ value:'EL ($M)', angle:-90, position:'insideLeft', fontSize:11 }} />
                  <Tooltip formatter={v => [`$${Number(v).toFixed(2)}M`, 'Expected Loss']} />
                  <Bar dataKey="el" radius={[4,4,0,0]}>
                    {waterfallData.map((d, i) => <Cell key={i} fill={ESG_TIER_COLORS[d.tier]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ MARGIN RATCHET CALCULATOR ═══════════════ */}
      {activeTab === 'ratchet' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>Margin Ratchet Calculator</h3>
          <p style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>
            Slide to simulate the percentage of ESG KPIs met across ESG-linked facilities. Savings = ratchet bps x drawn amount.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <label style={{ fontSize:13, fontWeight:600, color:T.navy, whiteSpace:'nowrap' }}>KPIs Met:</label>
            <input type="range" min={0} max={100} value={ratchetSlider} onChange={e => setRatchetSlider(Number(e.target.value))}
              style={{ flex:1, height:6, accentColor:T.sage }} />
            <span style={{ fontSize:18, fontWeight:700, color:T.sage, minWidth:50, textAlign:'right' }}>{ratchetSlider}%</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Borrower</th>
                  <th style={{...s.th, textAlign:'right'}}>Drawn ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Max Ratchet (bps)</th>
                  <th style={{...s.th, textAlign:'right'}}>Effective Ratchet (bps)</th>
                  <th style={{...s.th, textAlign:'right'}}>Annual Savings ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Effective Spread (bps)</th>
                </tr>
              </thead>
              <tbody>
                {facilities.filter(f => f.margin_ratchet_bps > 0).map(f => {
                  const effRatchet = Math.round(f.margin_ratchet_bps * ratchetSlider / 100);
                  const savings = (effRatchet / 10000) * f.drawn_mn;
                  const effSpread = f.spread_bps - effRatchet;
                  return (
                    <tr key={f.id}>
                      <td style={{...s.td, fontWeight:600}}>{f.borrower}</td>
                      <td style={{...s.td, textAlign:'right'}}>{fmtM(f.drawn_mn)}</td>
                      <td style={{...s.td, textAlign:'right'}}>{f.margin_ratchet_bps}</td>
                      <td style={{...s.td, textAlign:'right', fontWeight:700, color:T.green}}>{effRatchet}</td>
                      <td style={{...s.td, textAlign:'right', fontWeight:700, color:T.sage}}>${fmt(savings, 3)}M</td>
                      <td style={{...s.td, textAlign:'right'}}>{effSpread}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:T.surfaceH }}>
                  <td style={{...s.td, fontWeight:700}} colSpan={4}>Total Portfolio Savings</td>
                  <td style={{...s.td, textAlign:'right', fontWeight:800, color:T.sage, fontSize:14 }}>
                    ${fmt(facilities.filter(f => f.margin_ratchet_bps > 0).reduce((s, f) => s + (Math.round(f.margin_ratchet_bps * ratchetSlider / 100) / 10000) * f.drawn_mn, 0), 3)}M/yr
                  </td>
                  <td style={s.td} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ ADD FACILITY FORM ═══════════════ */}
      {activeTab === 'addFacility' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:T.navy }}>Add New Credit Facility</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Borrower *</label>
              <input style={s.input} value={formData.borrower} onChange={e => setFormData(p => ({...p, borrower:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Sector</label>
              <select style={{...s.select, width:'100%'}} value={formData.sector} onChange={e => setFormData(p => ({...p, sector:e.target.value}))}>
                {SECTORS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Facility Type</label>
              <select style={{...s.select, width:'100%'}} value={formData.facility_type} onChange={e => setFormData(p => ({...p, facility_type:e.target.value}))}>
                {FACILITY_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Commitment ($M)</label>
              <input style={s.input} type="number" value={formData.commitment_mn} onChange={e => setFormData(p => ({...p, commitment_mn:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Drawn ($M)</label>
              <input style={s.input} type="number" value={formData.drawn_mn} onChange={e => setFormData(p => ({...p, drawn_mn:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Currency</label>
              <select style={{...s.select, width:'100%'}} value={formData.currency} onChange={e => setFormData(p => ({...p, currency:e.target.value}))}>
                {CURRENCIES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Tenor (yrs)</label>
              <input style={s.input} type="number" value={formData.tenor_yr} onChange={e => setFormData(p => ({...p, tenor_yr:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Spread (bps)</label>
              <input style={s.input} type="number" value={formData.spread_bps} onChange={e => setFormData(p => ({...p, spread_bps:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Rating</label>
              <select style={{...s.select, width:'100%'}} value={formData.rating} onChange={e => setFormData(p => ({...p, rating:e.target.value}))}>
                {RATINGS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>ESG Score (0-100)</label>
              <input style={s.input} type="number" min="0" max="100" value={formData.esg_score} onChange={e => setFormData(p => ({...p, esg_score:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>PD %</label>
              <input style={s.input} type="number" step="0.1" value={formData.pd_pct} onChange={e => setFormData(p => ({...p, pd_pct:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>LGD %</label>
              <input style={s.input} type="number" step="1" value={formData.lgd_pct} onChange={e => setFormData(p => ({...p, lgd_pct:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Covenant Type</label>
              <select style={{...s.select, width:'100%'}} value={formData.covenant_type} onChange={e => setFormData(p => ({...p, covenant_type:e.target.value}))}>
                <option>Standard</option><option>ESG-linked</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Margin Ratchet (bps)</label>
              <input style={s.input} type="number" value={formData.margin_ratchet_bps} onChange={e => setFormData(p => ({...p, margin_ratchet_bps:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Country</label>
              <select style={{...s.select, width:'100%'}} value={formData.country} onChange={e => setFormData(p => ({...p, country:e.target.value}))}>
                {COUNTRIES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Employees</label>
              <input style={s.input} type="number" value={formData.employees} onChange={e => setFormData(p => ({...p, employees:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Revenue ($M)</label>
              <input style={s.input} type="number" step="0.1" value={formData.revenue_mn} onChange={e => setFormData(p => ({...p, revenue_mn:e.target.value}))} />
            </div>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>ESG KPIs (semicolon-separated)</label>
              <input style={s.input} value={formData.esg_kpis_str} onChange={e => setFormData(p => ({...p, esg_kpis_str:e.target.value}))} placeholder="e.g. GHG -30% by 2028; Renewable % > 80%" />
            </div>
          </div>
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <button style={s.btn} onClick={addFacility}>Add Facility</button>
            <button style={s.btnOutline} onClick={() => setFormData(emptyForm)}>Reset</button>
          </div>
        </div>
      )}

      {/* ═══════════════ RATING DISTRIBUTION ═══════════════ */}
      {activeTab === 'charts' && (() => {
        const ratingOrder = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];
        const ratingDist = ratingOrder.map(r => ({
          name: r,
          count: facilities.filter(f => f.rating === r).length,
          commitment: facilities.filter(f => f.rating === r).reduce((s, f) => s + f.commitment_mn, 0),
        })).filter(r => r.count > 0);
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Credit Rating Distribution</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ratingDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fill:T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Facility Count" fill={T.navy} radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="commitment" name="Commitment ($M)" fill={T.gold} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ═══════════════ COUNTRY EXPOSURE ═══════════════ */}
      {activeTab === 'charts' && (() => {
        const countryExposure = {};
        facilities.forEach(f => { countryExposure[f.country] = (countryExposure[f.country] || 0) + f.commitment_mn; });
        const countryData = Object.entries(countryExposure).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Country Exposure by Commitment</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
                <YAxis tick={{ fontSize:11, fill:T.textSec }} label={{ value:'$M', angle:-90, position:'insideLeft', fontSize:11 }} />
                <Tooltip formatter={v => [`$${v}M`, 'Commitment']} />
                <Bar dataKey="value" fill={T.sage} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ═══════════════ SPREAD VS ESG ANALYSIS ═══════════════ */}
      {activeTab === 'charts' && (() => {
        const spreadData = facilities.map(f => ({ name:f.borrower, spread:f.spread_bps, esg:f.esg_score, size:f.drawn_mn, esgLinked:f.covenant_type==='ESG-linked' }));
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Spread vs ESG Score (size = drawn amount)</h4>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="esg" name="ESG Score" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'ESG Score', position:'insideBottom', offset:-5, fontSize:11 }} />
                <YAxis dataKey="spread" name="Spread (bps)" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Spread bps', angle:-90, position:'insideLeft', fontSize:11 }} />
                <ZAxis dataKey="size" range={[40, 400]} name="Drawn ($M)" />
                <Tooltip cursor={{ strokeDasharray:'3 3' }} />
                <Scatter data={spreadData} fill={T.navyL}>
                  {spreadData.map((d, i) => <Cell key={i} fill={d.esgLinked ? T.green : T.navy} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:16, marginTop:8 }}>
              <span style={{ fontSize:11, color:T.green }}>{'\u25CF'} ESG-Linked</span>
              <span style={{ fontSize:11, color:T.navy }}>{'\u25CF'} Standard</span>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ PORTFOLIO RISK METRICS ═══════════════ */}
      {activeTab === 'overview' && (
        <div style={s.card}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Portfolio Risk Summary</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
            {/* Investment Grade vs Sub-IG */}
            {(() => {
              const ig = facilities.filter(f => ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'].includes(f.rating));
              const subIG = facilities.filter(f => !['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'].includes(f.rating));
              return (
                <>
                  <div style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
                    <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Investment Grade</div>
                    <div style={{ fontSize:22, fontWeight:700, color:T.green }}>{ig.length} facilities</div>
                    <div style={{ fontSize:11, color:T.textSec }}>{fmtM(ig.reduce((s, f) => s + f.commitment_mn, 0))} commitment</div>
                  </div>
                  <div style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
                    <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Sub-Investment Grade</div>
                    <div style={{ fontSize:22, fontWeight:700, color:T.amber }}>{subIG.length} facilities</div>
                    <div style={{ fontSize:11, color:T.textSec }}>{fmtM(subIG.reduce((s, f) => s + f.commitment_mn, 0))} commitment</div>
                  </div>
                </>
              );
            })()}
            {/* Undrawn capacity */}
            <div style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
              <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Undrawn Capacity</div>
              <div style={{ fontSize:22, fontWeight:700, color:T.navy }}>{fmtM(facilities.reduce((s, f) => s + (f.commitment_mn - f.drawn_mn), 0))}</div>
              <div style={{ fontSize:11, color:T.textSec }}>{pct(facilities.reduce((s, f) => s + (f.commitment_mn - f.drawn_mn), 0) / kpis.totalCommit * 100)} of total commitment</div>
            </div>
            {/* Largest single exposure */}
            <div style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
              <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Largest Exposure</div>
              {(() => {
                const largest = [...facilities].sort((a, b) => b.commitment_mn - a.commitment_mn)[0];
                return (
                  <>
                    <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{largest?.borrower}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>{fmtM(largest?.commitment_mn)} ({pct(largest?.commitment_mn / kpis.totalCommit * 100)} of portfolio)</div>
                  </>
                );
              })()}
            </div>
            {/* Weighted PD */}
            <div style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
              <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Exposure-Weighted PD</div>
              <div style={{ fontSize:22, fontWeight:700, color:T.amber }}>
                {pct(kpis.totalDrawn > 0 ? facilities.reduce((s, f) => s + f.pd_pct * f.drawn_mn, 0) / kpis.totalDrawn : 0)}
              </div>
              <div style={{ fontSize:11, color:T.textSec }}>Weighted by drawn amount</div>
            </div>
            {/* Weighted LGD */}
            <div style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
              <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Exposure-Weighted LGD</div>
              <div style={{ fontSize:22, fontWeight:700, color:T.amber }}>
                {pct(kpis.totalDrawn > 0 ? facilities.reduce((s, f) => s + f.lgd_pct * f.drawn_mn, 0) / kpis.totalDrawn : 0)}
              </div>
              <div style={{ fontSize:11, color:T.textSec }}>Weighted by drawn amount</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ESG COVENANT COMPLIANCE TRACKER ═══════════════ */}
      {activeTab === 'esgLinked' && (
        <div style={s.card}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>ESG Covenant Compliance Summary</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:16 }}>
            {(() => {
              const esgLinked = facilities.filter(f => f.covenant_type === 'ESG-linked');
              const totalKPIs = esgLinked.reduce((s, f) => s + f.esg_kpis.length, 0);
              const onTrack = Math.round(totalKPIs * 0.72);
              return (
                <>
                  <div style={{ background:'#f0fdf4', borderRadius:8, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:T.green }}>{esgLinked.length}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>ESG-Linked Facilities</div>
                  </div>
                  <div style={{ background:'#f0fdf4', borderRadius:8, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:T.sage }}>{totalKPIs}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>Total ESG KPIs</div>
                  </div>
                  <div style={{ background:'#f0fdf4', borderRadius:8, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:T.green }}>{pct(totalKPIs > 0 ? onTrack / totalKPIs * 100 : 0)}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>KPIs On Track</div>
                  </div>
                </>
              );
            })()}
          </div>
          <p style={{ fontSize:11, color:T.textSec }}>
            ESG-linked facilities include Sustainability Performance Targets (SPTs) with associated margin ratchets. Borrowers achieving SPTs benefit from reduced spreads, creating financial incentives for ESG improvement.
          </p>
        </div>
      )}

      {/* ═══════════════ CONCENTRATION BY FACILITY TYPE ═══════════════ */}
      {activeTab === 'overview' && (
        <div style={s.card}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Facility Type Breakdown</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {FACILITY_TYPES.map(type => {
              const typeFacilities = facilities.filter(f => f.facility_type === type);
              const totalCommit = typeFacilities.reduce((s, f) => s + f.commitment_mn, 0);
              const avgSpread = typeFacilities.length > 0 ? typeFacilities.reduce((s, f) => s + f.spread_bps, 0) / typeFacilities.length : 0;
              const avgESG = typeFacilities.length > 0 ? typeFacilities.reduce((s, f) => s + f.esg_score, 0) / typeFacilities.length : 0;
              return (
                <div key={type} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>{type}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                    <div><div style={{ fontSize:10, color:T.textMut }}>Count</div><div style={{ fontSize:14, fontWeight:700 }}>{typeFacilities.length}</div></div>
                    <div><div style={{ fontSize:10, color:T.textMut }}>Commitment</div><div style={{ fontSize:14, fontWeight:700 }}>{fmtM(totalCommit)}</div></div>
                    <div><div style={{ fontSize:10, color:T.textMut }}>Avg Spread</div><div style={{ fontSize:14, fontWeight:700 }}>{Math.round(avgSpread)} bps</div></div>
                    <div><div style={{ fontSize:10, color:T.textMut }}>Avg ESG</div><div style={{ fontSize:14, fontWeight:700 }}><span style={s.esgBadge(avgESG)}>{fmt(avgESG, 0)}</span></div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ EDIT FACILITY (INLINE) ═══════════════ */}
      {activeTab === 'overview' && selectedFacility && (
        <div style={{ ...s.card, borderLeft:`4px solid ${T.gold}` }}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Quick Edit — {selectedFacility.borrower}</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
            {[
              { key:'esg_score', label:'ESG Score', type:'number' },
              { key:'spread_bps', label:'Spread (bps)', type:'number' },
              { key:'commitment_mn', label:'Commitment ($M)', type:'number' },
              { key:'drawn_mn', label:'Drawn ($M)', type:'number' },
              { key:'pd_pct', label:'PD %', type:'number' },
              { key:'lgd_pct', label:'LGD %', type:'number' },
              { key:'margin_ratchet_bps', label:'Ratchet (bps)', type:'number' },
              { key:'employees', label:'Employees', type:'number' },
              { key:'revenue_mn', label:'Revenue ($M)', type:'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:10, color:T.textMut }}>{f.label}</label>
                <input style={s.input} type={f.type} step={f.key.includes('pct') ? '0.1' : '1'} value={selectedFacility[f.key]}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const updated = { ...selectedFacility, [f.key]: val };
                    if (f.key === 'pd_pct' || f.key === 'lgd_pct' || f.key === 'drawn_mn') {
                      updated.el_mn = (updated.pd_pct / 100) * (updated.lgd_pct / 100) * updated.drawn_mn;
                    }
                    setFacilities(prev => prev.map(x => x.id === selectedFacility.id ? updated : x));
                    setSelectedFacility(updated);
                  }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:10, color:T.textMut }}>Rating</label>
              <select style={{...s.select, width:'100%'}} value={selectedFacility.rating}
                onChange={e => {
                  const updated = { ...selectedFacility, rating: e.target.value };
                  setFacilities(prev => prev.map(x => x.id === selectedFacility.id ? updated : x));
                  setSelectedFacility(updated);
                }}>
                {RATINGS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, color:T.textMut }}>Covenant Type</label>
              <select style={{...s.select, width:'100%'}} value={selectedFacility.covenant_type}
                onChange={e => {
                  const updated = { ...selectedFacility, covenant_type: e.target.value };
                  setFacilities(prev => prev.map(x => x.id === selectedFacility.id ? updated : x));
                  setSelectedFacility(updated);
                }}>
                <option>Standard</option><option>ESG-linked</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:T.textMut }}>
            Changes are auto-saved. EL recalculates automatically when PD, LGD, or Drawn changes.
          </div>
        </div>
      )}

      {/* ═══════════════ CROSS-NAV FOOTER ═══════════════ */}
      <div style={{ ...s.card, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:24 }}>
        <span style={{ fontSize:12, fontWeight:600, color:T.textSec, marginRight:8, alignSelf:'center' }}>Navigate:</span>
        {[
          ['PE/VC ESG', '/pe-vc-esg'], ['Fixed Income ESG', '/fixed-income-esg'],
          ['Portfolio Suite', '/portfolio-suite'], ['Risk Attribution', '/risk-attribution'],
          ['Infra ESG DD', '/infra-esg-dd'], ['SFDR Art 9', '/sfdr-art9'],
          ['ESG Screener', '/esg-screener'], ['Climate VaR', '/portfolio-climate-var'],
          ['Sector Benchmarking', '/sector-benchmarking'], ['Supply Chain', '/supply-chain-map'],
        ].map(([label, path]) => (
          <button key={path} style={s.btnOutline} onClick={() => nav(path)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
