import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899'];

/* ══════════════════════════════════════════════════════════════
   BLENDED FINANCE INSTRUMENTS
   ══════════════════════════════════════════════════════════════ */
const BF_INSTRUMENTS = [
  { id:'BF01', name:'Concessional Debt', description:'Below-market rate loans from DFIs', typical_rate:'2-4%', risk_absorption:'First loss', providers:['IFC','EBRD','ADB','AfDB','AIIB'], color:'#16a34a', avgRate:3, dealRange:'$10-500M' },
  { id:'BF02', name:'Guarantees', description:'Credit or political risk guarantees', typical_cost:'0.5-2% fee', risk_absorption:'Partial credit', providers:['MIGA','GuarantCo','USAID DCA','SwedFund'], color:'#2563eb', avgRate:1.25, dealRange:'$5-250M' },
  { id:'BF03', name:'First-Loss Equity', description:'Catalytic capital absorbing initial losses', typical_return:'0-5%', risk_absorption:'First loss tranche', providers:['Foundations','Impact investors','DFIs'], color:'#7c3aed', avgRate:2.5, dealRange:'$1-50M' },
  { id:'BF04', name:'Technical Assistance', description:'Grant funding for project preparation', typical_amount:'$0.5-5M', risk_absorption:'De-risking', providers:['GCF','GEF','CIF','Bilateral donors'], color:'#d97706', avgRate:0, dealRange:'$0.5-5M' },
  { id:'BF05', name:'Commercial Debt', description:'Market-rate senior debt', typical_rate:'6-10%', risk_absorption:'Senior tranche', providers:['Commercial banks','Bond investors','Institutional'], color:'#6b7280', avgRate:8, dealRange:'$50-2000M' },
  { id:'BF06', name:'Market-Rate Equity', description:'Commercial equity seeking market returns', typical_return:'12-20%', risk_absorption:'Last loss', providers:['PE funds','Institutional investors','DFIs'], color:'#dc2626', avgRate:16, dealRange:'$10-500M' },
];

/* ══════════════════════════════════════════════════════════════
   SEED / HELPERS
   ══════════════════════════════════════════════════════════════ */
const seed = (s) => { let x = Math.sin(s * 7.7 + 3.3) * 10000; return x - Math.floor(x); };
const fmt = (v) => typeof v === 'number' ? (v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toFixed(v < 10 ? 2 : 0)) : v;

/* ══════════════════════════════════════════════════════════════
   15 SAMPLE BLENDED FINANCE DEALS
   ══════════════════════════════════════════════════════════════ */
const SAMPLE_DEALS = [
  { id:'BFD01', project:'Lake Turkana Wind Power', sector:'Renewable Energy', geography:'Kenya', totalSize:310, concPct:25, commPct:55, grantPct:5, eqPct:15, sdgs:[7,13], status:'Operational', dfi:'IFC + AfDB', leverage:3.2, year:2022 },
  { id:'BFD02', project:'India Solar Park Rajasthan', sector:'Renewable Energy', geography:'India', totalSize:450, concPct:20, commPct:60, grantPct:3, eqPct:17, sdgs:[7,9,13], status:'Operational', dfi:'ADB + IFC', leverage:4.0, year:2023 },
  { id:'BFD03', project:'BOAD Education Fund W.Africa', sector:'Education', geography:'West Africa', totalSize:85, concPct:40, commPct:30, grantPct:15, eqPct:15, sdgs:[4,10], status:'Disbursing', dfi:'AfDB + GEF', leverage:1.5, year:2024 },
  { id:'BFD04', project:'Philippine Typhoon Resilience', sector:'Climate Adaptation', geography:'Philippines', totalSize:120, concPct:35, commPct:40, grantPct:10, eqPct:15, sdgs:[11,13], status:'Disbursing', dfi:'ADB + GCF', leverage:1.9, year:2023 },
  { id:'BFD05', project:'FINCA Microfinance Expansion', sector:'Financial Inclusion', geography:'LatAm + Africa', totalSize:65, concPct:30, commPct:45, grantPct:10, eqPct:15, sdgs:[1,8,10], status:'Operational', dfi:'IFC + EBRD', leverage:2.3, year:2022 },
  { id:'BFD06', project:'Nairobi Affordable Housing', sector:'Social Housing', geography:'Kenya', totalSize:95, concPct:35, commPct:35, grantPct:12, eqPct:18, sdgs:[1,11], status:'Construction', dfi:'AfDB + Shelter Afrique', leverage:1.6, year:2024 },
  { id:'BFD07', project:'Colombia Reforestation Fund', sector:'Nature-Based Solutions', geography:'Colombia', totalSize:55, concPct:45, commPct:25, grantPct:15, eqPct:15, sdgs:[13,15], status:'Disbursing', dfi:'IDB + GEF', leverage:1.2, year:2023 },
  { id:'BFD08', project:'Bangladesh Garment Safety', sector:'Supply Chain', geography:'Bangladesh', totalSize:140, concPct:20, commPct:60, grantPct:5, eqPct:15, sdgs:[8,9,12], status:'Operational', dfi:'IFC + AIIB', leverage:4.0, year:2022 },
  { id:'BFD09', project:'Vietnam Offshore Wind', sector:'Renewable Energy', geography:'Vietnam', totalSize:520, concPct:22, commPct:58, grantPct:5, eqPct:15, sdgs:[7,13,14], status:'Planning', dfi:'ADB + JICA', leverage:3.5, year:2025 },
  { id:'BFD10', project:'Ethiopia Healthcare PPP', sector:'Healthcare', geography:'Ethiopia', totalSize:75, concPct:40, commPct:30, grantPct:15, eqPct:15, sdgs:[3], status:'Construction', dfi:'AfDB + WHO', leverage:1.5, year:2024 },
  { id:'BFD11', project:'Morocco Noor Solar Complex', sector:'Renewable Energy', geography:'Morocco', totalSize:680, concPct:18, commPct:62, grantPct:5, eqPct:15, sdgs:[7,13], status:'Operational', dfi:'AfDB + CIF + EIB', leverage:4.6, year:2021 },
  { id:'BFD12', project:'Peru Water & Sanitation', sector:'Water Infrastructure', geography:'Peru', totalSize:110, concPct:30, commPct:45, grantPct:10, eqPct:15, sdgs:[6,11], status:'Disbursing', dfi:'IDB + GCF', leverage:2.3, year:2023 },
  { id:'BFD13', project:'Nigeria Agri-Tech SME Fund', sector:'Agriculture', geography:'Nigeria', totalSize:40, concPct:50, commPct:20, grantPct:15, eqPct:15, sdgs:[2,8], status:'Fundraising', dfi:'AfDB + USAID', leverage:1.0, year:2025 },
  { id:'BFD14', project:'Indonesia Geothermal', sector:'Renewable Energy', geography:'Indonesia', totalSize:350, concPct:25, commPct:55, grantPct:5, eqPct:15, sdgs:[7,13], status:'Construction', dfi:'ADB + JICA + CTF', leverage:3.0, year:2024 },
  { id:'BFD15', project:'Jordan Refugee Education', sector:'Education', geography:'Jordan', totalSize:30, concPct:55, commPct:15, grantPct:20, eqPct:10, sdgs:[4,10,16], status:'Operational', dfi:'EBRD + UNHCR', leverage:0.8, year:2023 },
];

const SDG_NAMES = {
  1:'No Poverty',2:'Zero Hunger',3:'Good Health',4:'Quality Education',5:'Gender Equality',
  6:'Clean Water',7:'Affordable Energy',8:'Decent Work',9:'Industry & Innovation',10:'Reduced Inequalities',
  11:'Sustainable Cities',12:'Responsible Consumption',13:'Climate Action',14:'Life Below Water',
  15:'Life on Land',16:'Peace & Justice',17:'Partnerships',
};
const SDG_COLORS = {
  1:'#e5243b',2:'#dda63a',3:'#4c9f38',4:'#c5192d',5:'#ff3a21',6:'#26bde2',7:'#fcc30b',
  8:'#a21942',9:'#fd6925',10:'#dd1367',11:'#fd9d24',12:'#bf8b2e',13:'#3f7e44',14:'#0a97d9',
  15:'#56c02b',16:'#00689d',17:'#19486a',
};

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.font, marginTop: 2 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Badge = ({ label, color }) => {
  const map = { green:{bg:'#dcfce7',text:'#166534'}, red:{bg:'#fee2e2',text:'#991b1b'}, amber:{bg:'#fef3c7',text:'#92400e'}, blue:{bg:'#dbeafe',text:'#1e40af'}, purple:{bg:'#ede9fe',text:'#5b21b6'}, gold:{bg:'#fef9c3',text:'#854d0e'}, gray:{bg:'#f3f4f6',text:'#374151'}, teal:{bg:'#ccfbf1',text:'#115e59'} };
  const c = map[color] || map.gray;
  return <span style={{ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700, background:c.bg, color:c.text }}>{label}</span>;
};
const SortHeader = ({ label, col, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(col)} style={{ padding:'8px 10px', cursor:'pointer', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, textAlign:'left', whiteSpace:'nowrap', userSelect:'none', ...style }}>
    {label} {sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const Btn = ({ children, onClick, primary, small, style }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize: small ? 12 : 13, fontFamily:T.font, background: primary ? T.navy : T.surfaceH, color: primary ? '#fff' : T.text, transition:'all 0.15s', ...style }}>{children}</button>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</div>
      {badge && <Badge label={badge} color="gold" />}
    </div>
    {children}
  </div>
);
const Slider = ({ label, value, onChange, min, max, step, unit, color }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
      <span style={{ fontWeight:600, color:T.text }}>{label}</span>
      <span style={{ fontWeight:700, color: color || T.navy }}>{value}{unit || '%'}</span>
    </div>
    <input type="range" min={min||0} max={max||100} step={step||1} value={value} onChange={e => onChange(+e.target.value)}
      style={{ width:'100%', accentColor: color || T.navy, height:6, cursor:'pointer' }} />
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
function BlendedFinancePage() {
  const navigate = useNavigate();

  /* ── Portfolio (WRAPPED) ── */
  const [portfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });

  /* ── Custom deal builder state (persisted) ── */
  const [customDeals, setCustomDeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_blended_deals_v1') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('ra_blended_deals_v1', JSON.stringify(customDeals)); }, [customDeals]);

  /* ── Sort state ── */
  const [sortCol, setSortCol] = useState('totalSize');
  const [sortDir, setSortDir] = useState('desc');
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Capital stack slider state ── */
  const [sliders, setSliders] = useState({ concessional: 25, guarantees: 10, firstLoss: 10, ta: 5, commercial: 35, equity: 15 });
  const sliderTotal = Object.values(sliders).reduce((s, v) => s + v, 0);
  const updateSlider = useCallback((key, val) => {
    setSliders(prev => {
      const updated = { ...prev, [key]: val };
      return updated;
    });
  }, []);

  /* ── Deal builder form state ── */
  const [builderOpen, setBuilderOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ project:'', sector:'Renewable Energy', geography:'', totalSize:100, concPct:25, commPct:50, grantPct:5, eqPct:20 });

  /* ── Sector filter ── */
  const [sectorFilter, setSectorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');

  /* ── All deals (sample + custom) ── */
  const allDeals = useMemo(() => [...SAMPLE_DEALS, ...customDeals], [customDeals]);
  const sectors = useMemo(() => ['All', ...new Set(allDeals.map(d => d.sector))], [allDeals]);
  const statuses = useMemo(() => ['All', ...new Set(allDeals.map(d => d.status))], [allDeals]);

  /* ── Filtered & sorted deals ── */
  const filteredDeals = useMemo(() => {
    let arr = [...allDeals];
    if (sectorFilter !== 'All') arr = arr.filter(d => d.sector === sectorFilter);
    if (statusFilter !== 'All') arr = arr.filter(d => d.status === statusFilter);
    arr.sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; if (va < vb) return sortDir === 'asc' ? -1 : 1; if (va > vb) return sortDir === 'asc' ? 1 : -1; return 0; });
    return arr;
  }, [allDeals, sectorFilter, statusFilter, sortCol, sortDir]);

  /* ── Computed KPIs ── */
  const totalDealValue = useMemo(() => allDeals.reduce((s, d) => s + d.totalSize, 0), [allDeals]);
  const totalConcessional = useMemo(() => allDeals.reduce((s, d) => s + d.totalSize * d.concPct / 100, 0), [allDeals]);
  const totalCommercial = useMemo(() => allDeals.reduce((s, d) => s + d.totalSize * d.commPct / 100, 0), [allDeals]);
  const avgLeverage = useMemo(() => allDeals.length ? (allDeals.reduce((s, d) => s + d.leverage, 0) / allDeals.length) : 0, [allDeals]);
  const allSdgs = useMemo(() => { const s = new Set(); allDeals.forEach(d => d.sdgs.forEach(x => s.add(x))); return s; }, [allDeals]);
  const allGeos = useMemo(() => new Set(allDeals.map(d => d.geography)), [allDeals]);
  const avgBlendedCost = useMemo(() => {
    const w = sliders;
    return ((w.concessional * 3 + w.guarantees * 1.25 + w.firstLoss * 2.5 + w.ta * 0 + w.commercial * 8 + w.equity * 16) / Math.max(sliderTotal, 1)).toFixed(2);
  }, [sliders, sliderTotal]);
  const mobilizationMultiple = useMemo(() => {
    const conc = sliders.concessional + sliders.guarantees + sliders.firstLoss + sliders.ta;
    const comm = sliders.commercial + sliders.equity;
    return conc > 0 ? (comm / conc).toFixed(1) : 'N/A';
  }, [sliders]);

  /* ── Capital stack chart data ── */
  const stackData = useMemo(() => [
    { name:'Blended', Concessional:sliders.concessional, Guarantees:sliders.guarantees, FirstLoss:sliders.firstLoss, TA:sliders.ta, Commercial:sliders.commercial, Equity:sliders.equity },
  ], [sliders]);

  /* ── Cost of capital comparison ── */
  const costCompare = useMemo(() => [
    { name:'Blended', cost: +avgBlendedCost },
    { name:'Pure Commercial', cost: 8.0 },
    { name:'Pure Concessional', cost: 3.0 },
    { name:'Current Sliders', cost: +avgBlendedCost },
  ], [avgBlendedCost]);

  /* ── Geographic PieChart data ── */
  const geoPie = useMemo(() => {
    const m = {};
    allDeals.forEach(d => { m[d.geography] = (m[d.geography] || 0) + d.totalSize; });
    return Object.entries(m).sort((a,b) => b[1] - a[1]).map(([k,v]) => ({ name: k, value: v }));
  }, [allDeals]);

  /* ── SDG impact per dollar ── */
  const sdgPerDollar = useMemo(() => {
    const m = {};
    allDeals.forEach(d => { d.sdgs.forEach(s => { if (!m[s]) m[s] = { total:0, deals:0 }; m[s].total += d.totalSize; m[s].deals += 1; }); });
    return Object.entries(m).sort((a,b) => +a[0] - +b[0]).map(([k,v]) => ({ sdg: +k, name: SDG_NAMES[+k] || `SDG ${k}`, investment: v.total, deals: v.deals, perDeal: Math.round(v.total / v.deals) }));
  }, [allDeals]);

  /* ── DFI mobilization data ── */
  const dfiData = useMemo(() => {
    const m = {};
    allDeals.forEach(d => {
      const dfis = d.dfi.split(/\s*\+\s*/);
      dfis.forEach(name => {
        if (!m[name]) m[name] = { concessional: 0, mobilized: 0, deals: 0 };
        m[name].concessional += (d.totalSize * d.concPct / 100) / dfis.length;
        m[name].mobilized += (d.totalSize * d.commPct / 100) / dfis.length;
        m[name].deals += 1;
      });
    });
    return Object.entries(m).sort((a,b) => b[1].mobilized - a[1].mobilized).map(([k,v]) => ({ name:k, concessional:Math.round(v.concessional), mobilized:Math.round(v.mobilized), deals:v.deals, ratio: v.concessional > 0 ? (v.mobilized / v.concessional).toFixed(1) : 'N/A' }));
  }, [allDeals]);

  /* ── Risk waterfall data ── */
  const riskWaterfall = useMemo(() => [
    { layer:'Technical Assistance', pct: sliders.ta, risk:'De-risking / Grant', cumulative: sliders.ta, color:'#d97706' },
    { layer:'First-Loss Equity', pct: sliders.firstLoss, risk:'Absorbs first losses', cumulative: sliders.ta + sliders.firstLoss, color:'#7c3aed' },
    { layer:'Concessional Debt', pct: sliders.concessional, risk:'Below-market rate', cumulative: sliders.ta + sliders.firstLoss + sliders.concessional, color:'#16a34a' },
    { layer:'Guarantees', pct: sliders.guarantees, risk:'Credit enhancement', cumulative: sliders.ta + sliders.firstLoss + sliders.concessional + sliders.guarantees, color:'#2563eb' },
    { layer:'Commercial Debt', pct: sliders.commercial, risk:'Senior tranche', cumulative: sliders.ta + sliders.firstLoss + sliders.concessional + sliders.guarantees + sliders.commercial, color:'#6b7280' },
    { layer:'Market-Rate Equity', pct: sliders.equity, risk:'Last loss / highest return', cumulative: 100, color:'#dc2626' },
  ], [sliders]);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const header = 'ID,Project,Sector,Geography,TotalSize_Mn,Concessional%,Commercial%,Grant%,Equity%,Leverage,SDGs,Status,DFI,Year';
    const rows = allDeals.map(d => `${d.id},${d.project},${d.sector},${d.geography},${d.totalSize},${d.concPct},${d.commPct},${d.grantPct},${d.eqPct},${d.leverage},${d.sdgs.join(';')},${d.status},${d.dfi},${d.year}`);
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'blended_finance_deals.csv'; a.click();
  }, [allDeals]);

  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), capitalStack: sliders, blendedCost: avgBlendedCost, mobilizationMultiple, deals: allDeals, dfiMobilization: dfiData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'capital_stack_analysis.json'; a.click();
  }, [sliders, avgBlendedCost, mobilizationMultiple, allDeals, dfiData]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Add custom deal ── */
  const addDeal = useCallback(() => {
    if (!newDeal.project || !newDeal.geography) return;
    const deal = {
      ...newDeal,
      id: `CUS${String(customDeals.length + 1).padStart(3, '0')}`,
      sdgs: [7, 13],
      status: 'Planning',
      dfi: 'Custom',
      leverage: newDeal.commPct > 0 && newDeal.concPct > 0 ? +(newDeal.commPct / newDeal.concPct).toFixed(1) : 0,
      year: 2025,
    };
    setCustomDeals(prev => [...prev, deal]);
    setNewDeal({ project:'', sector:'Renewable Energy', geography:'', totalSize:100, concPct:25, commPct:50, grantPct:5, eqPct:20 });
    setBuilderOpen(false);
  }, [newDeal, customDeals]);

  const TABS = ['overview', 'deals', 'instruments', 'structuring', 'dfi'];

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      {/* ── 1. HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, color:T.navy }}>Blended Finance Structuring Tool</div>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            <Badge label="6 Instruments" color="gold" />
            <Badge label="Capital Stack" color="blue" />
            <Badge label="Mobilization" color="green" />
            <Badge label="SDG" color="purple" />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn onClick={exportCSV} small>CSV</Btn>
          <Btn onClick={exportJSON} small>JSON</Btn>
          <Btn onClick={exportPrint} small>Print</Btn>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${activeTab === t ? T.navy : T.border}`, background: activeTab === t ? T.navy : T.surface, color: activeTab === t ? '#fff' : T.text, fontWeight:600, fontSize:12, cursor:'pointer', textTransform:'capitalize', fontFamily:T.font }}>{t}</button>
        ))}
      </div>

      {/* ── 2. KPI CARDS (10) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:24 }}>
        <KPI label="Total Deal Value" value={`$${totalDealValue}M`} sub="Pipeline aggregate" color={T.sage} />
        <KPI label="Concessional Capital" value={`$${Math.round(totalConcessional)}M`} sub="DFI / catalytic" color={T.green} />
        <KPI label="Commercial Capital" value={`$${Math.round(totalCommercial)}M`} sub="Market-rate" color={T.navy} />
        <KPI label="Leverage Ratio" value={`${avgLeverage.toFixed(1)}x`} sub="Avg commercial/concessional" color={T.gold} />
        <KPI label="SDGs Targeted" value={`${allSdgs.size}`} sub="of 17 goals" color="#7c3aed" />
        <KPI label="Geographies" value={allGeos.size} sub="Countries/regions" />
        <KPI label="Blended Cost" value={`${avgBlendedCost}%`} sub="Weighted avg" color={T.amber} />
        <KPI label="Mobilization" value={`${mobilizationMultiple}x`} sub="Commercial per concessional $" color={T.sage} />
        <KPI label="Instruments" value={6} sub="Blended finance tools" />
        <KPI label="Pipeline Deals" value={allDeals.length} sub={`${allDeals.filter(d => d.status === 'Planning' || d.status === 'Fundraising').length} in pipeline`} />
      </div>

      {/* ── 3. CAPITAL STACK VISUALIZER ── */}
      {(activeTab === 'overview' || activeTab === 'structuring') && (
        <Section title="Capital Stack Visualizer" badge="Interactive Sliders">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div>
                <Slider label="Concessional Debt" value={sliders.concessional} onChange={v => updateSlider('concessional', v)} color="#16a34a" />
                <Slider label="Guarantees" value={sliders.guarantees} onChange={v => updateSlider('guarantees', v)} color="#2563eb" />
                <Slider label="First-Loss Equity" value={sliders.firstLoss} onChange={v => updateSlider('firstLoss', v)} color="#7c3aed" />
                <Slider label="Technical Assistance" value={sliders.ta} onChange={v => updateSlider('ta', v)} max={20} color="#d97706" />
                <Slider label="Commercial Debt" value={sliders.commercial} onChange={v => updateSlider('commercial', v)} color="#6b7280" />
                <Slider label="Market-Rate Equity" value={sliders.equity} onChange={v => updateSlider('equity', v)} color="#dc2626" />
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:`1px solid ${T.border}`, marginTop:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color: sliderTotal === 100 ? T.green : T.red }}>Total: {sliderTotal}%</span>
                  <span style={{ fontSize:12, color:T.textSec }}>Blended Cost: {avgBlendedCost}% | Mobilization: {mobilizationMultiple}x</span>
                </div>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stackData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="TA" stackId="a" fill="#d97706" name="Technical Assistance" />
                    <Bar dataKey="FirstLoss" stackId="a" fill="#7c3aed" name="First-Loss Equity" />
                    <Bar dataKey="Concessional" stackId="a" fill="#16a34a" name="Concessional Debt" />
                    <Bar dataKey="Guarantees" stackId="a" fill="#2563eb" name="Guarantees" />
                    <Bar dataKey="Commercial" stackId="a" fill="#6b7280" name="Commercial Debt" />
                    <Bar dataKey="Equity" stackId="a" fill="#dc2626" name="Market-Rate Equity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* ── 4. DEAL PIPELINE TABLE (sortable) ── */}
      {(activeTab === 'overview' || activeTab === 'deals') && (
        <Section title="Deal Pipeline" badge={`${filteredDeals.length} Deals`}>
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn small primary onClick={() => setBuilderOpen(!builderOpen)}>{builderOpen ? 'Cancel' : '+ New Deal'}</Btn>
          </div>
          <Card style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  <SortHeader label="Project" col="project" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Sector" col="sector" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Geography" col="geography" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Size ($M)" col="totalSize" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <SortHeader label="Conc %" col="concPct" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <SortHeader label="Comm %" col="commPct" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <SortHeader label="Leverage" col="leverage" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <th style={{ padding:'8px 10px', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>SDGs</th>
                  <th style={{ padding:'8px 10px', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy, maxWidth:200 }}>{d.project}</td>
                    <td style={{ padding:'8px 10px', color:T.text }}>{d.sector}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{d.geography}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600 }}>${d.totalSize}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', color:T.green }}>{d.concPct}%</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{d.commPct}%</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color: d.leverage >= 3 ? T.green : d.leverage >= 2 ? T.amber : T.red }}>{d.leverage}x</td>
                    <td style={{ padding:'8px 10px' }}>{d.sdgs.map(s => <span key={s} style={{ display:'inline-block', width:20, height:20, borderRadius:'50%', background:SDG_COLORS[s], color:'#fff', fontSize:8, fontWeight:700, textAlign:'center', lineHeight:'20px', marginRight:2 }}>{s}</span>)}</td>
                    <td style={{ padding:'8px 10px' }}><Badge label={d.status} color={d.status === 'Operational' ? 'green' : d.status === 'Construction' ? 'blue' : d.status === 'Disbursing' ? 'teal' : 'amber'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── 5. DEAL STRUCTURE BUILDER ── */}
      {builderOpen && (
        <Section title="Deal Structure Builder" badge="Custom Deal">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Project Name</label>
                <input value={newDeal.project} onChange={e => setNewDeal(p => ({...p, project:e.target.value}))} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, marginTop:4 }} placeholder="Project name" />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Sector</label>
                <select value={newDeal.sector} onChange={e => setNewDeal(p => ({...p, sector:e.target.value}))} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, marginTop:4 }}>
                  {['Renewable Energy','Clean Transport','Healthcare','Education','Water Infrastructure','Social Housing','Agriculture','Nature-Based Solutions','Financial Inclusion','Climate Adaptation','Supply Chain'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Geography</label>
                <input value={newDeal.geography} onChange={e => setNewDeal(p => ({...p, geography:e.target.value}))} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, marginTop:4 }} placeholder="Country/Region" />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Total Size ($M)</label>
                <input type="number" value={newDeal.totalSize} onChange={e => setNewDeal(p => ({...p, totalSize:+e.target.value}))} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, marginTop:4 }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginTop:14 }}>
              <Slider label="Concessional %" value={newDeal.concPct} onChange={v => setNewDeal(p => ({...p, concPct:v}))} color="#16a34a" />
              <Slider label="Commercial %" value={newDeal.commPct} onChange={v => setNewDeal(p => ({...p, commPct:v}))} color="#6b7280" />
              <Slider label="Grant %" value={newDeal.grantPct} onChange={v => setNewDeal(p => ({...p, grantPct:v}))} max={30} color="#d97706" />
              <Slider label="Equity %" value={newDeal.eqPct} onChange={v => setNewDeal(p => ({...p, eqPct:v}))} color="#dc2626" />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <Btn primary onClick={addDeal}>Add Deal</Btn>
              <Btn onClick={() => setBuilderOpen(false)}>Cancel</Btn>
              <span style={{ fontSize:12, color: (newDeal.concPct + newDeal.commPct + newDeal.grantPct + newDeal.eqPct) === 100 ? T.green : T.red, alignSelf:'center', fontWeight:600 }}>
                Total: {newDeal.concPct + newDeal.commPct + newDeal.grantPct + newDeal.eqPct}%
              </span>
            </div>
          </Card>
        </Section>
      )}

      {/* ── 6. LEVERAGE RATIO CALCULATOR ── */}
      {(activeTab === 'overview' || activeTab === 'structuring') && (
        <Section title="Leverage Ratio Calculator" badge="Mobilization Analysis">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
              <div style={{ padding:16, borderRadius:10, background:'#dcfce7', textAlign:'center' }}>
                <div style={{ fontSize:11, color:T.textSec }}>Concessional (catalytic)</div>
                <div style={{ fontSize:28, fontWeight:800, color:T.green }}>${Math.round(totalConcessional)}M</div>
              </div>
              <div style={{ padding:16, borderRadius:10, background:'#dbeafe', textAlign:'center' }}>
                <div style={{ fontSize:11, color:T.textSec }}>Commercial (mobilized)</div>
                <div style={{ fontSize:28, fontWeight:800, color:'#2563eb' }}>${Math.round(totalCommercial)}M</div>
              </div>
              <div style={{ padding:16, borderRadius:10, background:'#fef3c7', textAlign:'center' }}>
                <div style={{ fontSize:11, color:T.textSec }}>Leverage Ratio</div>
                <div style={{ fontSize:28, fontWeight:800, color:T.amber }}>{totalConcessional > 0 ? (totalCommercial / totalConcessional).toFixed(1) : 0}x</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={allDeals.map(d => ({ name: d.project.length > 20 ? d.project.slice(0,18)+'...' : d.project, leverage: d.leverage }))} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, angle: -30 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Leverage (x)', angle: -90, position:'insideLeft', fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="leverage" name="Leverage Ratio">
                  {allDeals.map((d, i) => <Cell key={i} fill={d.leverage >= 3 ? T.green : d.leverage >= 2 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {/* ── 7. COST OF CAPITAL ANALYSIS ── */}
      {(activeTab === 'overview' || activeTab === 'structuring') && (
        <Section title="Cost of Capital Analysis" badge="Weighted Average">
          <Card>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costCompare} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="cost" name="Cost of Capital (%)">
                  {costCompare.map((d, i) => <Cell key={i} fill={i === 0 ? T.sage : i === 1 ? T.red : i === 2 ? T.green : T.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign:'center', fontSize:11, color:T.textMut, marginTop:6 }}>Blending reduces cost from ~8% (pure commercial) to {avgBlendedCost}% through concessional capital.</div>
          </Card>
        </Section>
      )}

      {/* ── 8. SDG IMPACT PER DOLLAR ── */}
      {(activeTab === 'overview' || activeTab === 'deals') && (
        <Section title="SDG Impact per Dollar of Blended Finance" badge="SDG Allocation">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sdgPerDollar} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, angle: -20 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v, n) => n === 'investment' ? `$${v}M` : v} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="investment" name="Total Investment ($M)">
                  {sdgPerDollar.map((d, i) => <Cell key={i} fill={SDG_COLORS[d.sdg] || PIE_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {/* ── 9. GEOGRAPHIC DISTRIBUTION ── */}
      {(activeTab === 'overview' || activeTab === 'deals') && (
        <Section title="Geographic Distribution" badge="PieChart">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={geoPie} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name" label={({name, percent}) => `${name.length > 12 ? name.slice(0,10)+'...' : name} ${(percent*100).toFixed(0)}%`}>
                    {geoPie.map((d, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${v}M`} />
                </PieChart>
              </ResponsiveContainer>
              <div>
                {geoPie.map((g, i) => (
                  <div key={g.name} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:10, height:10, borderRadius:'50%', background:PIE_COLORS[i % PIE_COLORS.length], display:'inline-block' }} />
                      {g.name}
                    </span>
                    <span style={{ fontWeight:600 }}>${g.value}M</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* ── 10. INSTRUMENT COMPARISON TABLE ── */}
      {(activeTab === 'overview' || activeTab === 'instruments') && (
        <Section title="Instrument Comparison" badge="6 Instruments">
          <Card style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Instrument</th>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Description</th>
                  <th style={{ padding:'8px 10px', textAlign:'center', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Rate/Cost</th>
                  <th style={{ padding:'8px 10px', textAlign:'center', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Risk Absorption</th>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Typical Providers</th>
                  <th style={{ padding:'8px 10px', textAlign:'center', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Deal Range</th>
                </tr>
              </thead>
              <tbody>
                {BF_INSTRUMENTS.map((inst, i) => (
                  <tr key={inst.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding:'8px 10px' }}><span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:10, height:10, borderRadius:'50%', background:inst.color }} /><span style={{ fontWeight:700, color:T.navy }}>{inst.name}</span></span></td>
                    <td style={{ padding:'8px 10px', color:T.textSec, maxWidth:200 }}>{inst.description}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:600 }}>{inst.typical_rate || inst.typical_cost || inst.typical_return || inst.typical_amount}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center' }}><Badge label={inst.risk_absorption} color={inst.risk_absorption === 'First loss' || inst.risk_absorption === 'First loss tranche' ? 'purple' : inst.risk_absorption === 'Senior tranche' ? 'blue' : 'amber'} /></td>
                    <td style={{ padding:'8px 10px', fontSize:11, color:T.textSec }}>{inst.providers.join(', ')}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:600, color:T.navy }}>{inst.dealRange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── 11. DFI MOBILIZATION TRACKER ── */}
      {(activeTab === 'overview' || activeTab === 'dfi') && (
        <Section title="DFI Mobilization Tracker" badge="Development Finance">
          <Card style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>DFI / Provider</th>
                  <th style={{ padding:'8px 10px', textAlign:'right', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Concessional ($M)</th>
                  <th style={{ padding:'8px 10px', textAlign:'right', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Mobilized ($M)</th>
                  <th style={{ padding:'8px 10px', textAlign:'right', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Ratio</th>
                  <th style={{ padding:'8px 10px', textAlign:'right', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Deals</th>
                </tr>
              </thead>
              <tbody>
                {dfiData.map((d, i) => (
                  <tr key={d.name} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding:'8px 10px', fontWeight:700, color:T.navy }}>{d.name}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', color:T.green }}>${d.concessional}M</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600 }}>${d.mobilized}M</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}><span style={{ fontWeight:700, color: +d.ratio >= 3 ? T.green : +d.ratio >= 2 ? T.amber : T.red }}>{d.ratio}x</span></td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{d.deals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── 12. ADDITIONALITY FRAMEWORK ── */}
      {(activeTab === 'overview' || activeTab === 'deals') && (
        <Section title="Additionality Framework" badge="Financial + Development">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:16 }}>
              <div style={{ padding:16, borderRadius:10, border:`2px solid ${T.green}`, background:'#dcfce720' }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.green, marginBottom:8 }}>Financial Additionality</div>
                <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>Would this investment have occurred at these terms without concessional capital? Measures the catalytic effect of below-market financing.</div>
                <div style={{ marginTop:10, fontSize:12 }}>
                  {allDeals.filter(d => d.concPct >= 30).length} deals with high additionality ({'\u2265'}30% concessional)
                </div>
              </div>
              <div style={{ padding:16, borderRadius:10, border:`2px solid #7c3aed`, background:'#ede9fe20' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#7c3aed', marginBottom:8 }}>Development Additionality</div>
                <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>Does this deal achieve SDG outcomes that would not occur through purely commercial financing? Measures development impact beyond financial returns.</div>
                <div style={{ marginTop:10, fontSize:12 }}>
                  {allDeals.filter(d => d.sdgs.length >= 2).length} deals with multi-SDG impact
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:10 }}>
              {allDeals.slice(0, 6).map(d => (
                <div key={d.id} style={{ padding:12, borderRadius:8, border:`1px solid ${T.border}`, background:T.surface }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{d.project}</div>
                  <div style={{ display:'flex', gap:8, fontSize:11 }}>
                    <Badge label={`Fin: ${d.concPct >= 30 ? 'High' : d.concPct >= 20 ? 'Med' : 'Low'}`} color={d.concPct >= 30 ? 'green' : d.concPct >= 20 ? 'amber' : 'red'} />
                    <Badge label={`Dev: ${d.sdgs.length >= 3 ? 'High' : d.sdgs.length >= 2 ? 'Med' : 'Low'}`} color={d.sdgs.length >= 3 ? 'green' : d.sdgs.length >= 2 ? 'amber' : 'red'} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* ── 13. RISK WATERFALL ── */}
      {(activeTab === 'overview' || activeTab === 'structuring') && (
        <Section title="Risk Waterfall" badge="Capital Stack Risk Cascade">
          <Card>
            <div style={{ display:'flex', gap:0, alignItems:'flex-end', height:300, padding:'20px 0' }}>
              {riskWaterfall.map((layer, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                  <div style={{ fontSize:10, color:T.textMut, fontWeight:600, marginBottom:4, textAlign:'center' }}>{layer.pct}%</div>
                  <div style={{ width:'80%', height:`${Math.max(layer.pct * 2.5, 20)}px`, background:layer.color, borderRadius:'6px 6px 0 0', display:'flex', alignItems:'center', justifyContent:'center', transition:'height 0.3s' }}>
                    <span style={{ color:'#fff', fontSize:9, fontWeight:700, writingMode: layer.pct > 10 ? 'horizontal-tb' : 'vertical-rl', textAlign:'center' }}>{layer.pct > 5 ? layer.layer.split(' ')[0] : ''}</span>
                  </div>
                  <div style={{ fontSize:9, color:T.textSec, textAlign:'center', marginTop:6, maxWidth:80 }}>{layer.layer}</div>
                  <div style={{ fontSize:8, color:T.textMut, textAlign:'center', marginTop:2, maxWidth:80 }}>{layer.risk}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:layer.color, marginTop:4 }}>{i === 0 ? '\u2191 First Loss' : i === riskWaterfall.length - 1 ? '\u2193 Last Loss' : ''}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:T.textMut, marginTop:10, borderTop:`1px solid ${T.border}`, paddingTop:10 }}>
              Risk flows from left (first loss - absorbed by grants and catalytic capital) to right (last loss - borne by equity investors seeking highest returns).
            </div>
          </Card>
        </Section>
      )}

      {/* ── SECTOR BREAKDOWN BARCHART ── */}
      {(activeTab === 'deals') && (
        <Section title="Sector Investment Breakdown" badge="BarChart">
          <Card>
            {(() => {
              const sectorData = {};
              allDeals.forEach(d => { sectorData[d.sector] = (sectorData[d.sector] || 0) + d.totalSize; });
              const chartData = Object.entries(sectorData).sort((a,b) => b[1] - a[1]).map(([k,v]) => ({ name:k, value:v }));
              return (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, angle: -25 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                    <Tooltip formatter={v => `$${v}M`} />
                    <Bar dataKey="value" name="Total Investment ($M)">
                      {chartData.map((d, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </Card>
        </Section>
      )}

      {/* ── DEAL STATUS SUMMARY ── */}
      {(activeTab === 'deals') && (
        <Section title="Deal Status Summary" badge="Pipeline Progress">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
              {['Operational','Disbursing','Construction','Planning','Fundraising'].map(status => {
                const deals = allDeals.filter(d => d.status === status);
                const totalVal = deals.reduce((s,d) => s + d.totalSize, 0);
                const pctVal = allDeals.length ? (deals.length / allDeals.length * 100) : 0;
                const statusColor = status === 'Operational' ? T.green : status === 'Disbursing' ? '#0d9488' : status === 'Construction' ? '#2563eb' : status === 'Planning' ? T.amber : T.red;
                return (
                  <div key={status} style={{ padding:14, borderRadius:10, textAlign:'center', border:`2px solid ${statusColor}`, background:`${statusColor}10` }}>
                    <div style={{ fontSize:24, fontWeight:800, color:statusColor }}>{deals.length}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:T.text }}>{status}</div>
                    <div style={{ fontSize:10, color:T.textSec }}>${totalVal}M ({pctVal.toFixed(0)}%)</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      {/* ── INSTRUMENT ALLOCATION PER DEAL ── */}
      {(activeTab === 'instruments') && (
        <Section title="Instrument Allocation per Deal" badge="Detailed Breakdown">
          <Card style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:'6px 8px', textAlign:'left', fontSize:10, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Deal</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:600, color:'#16a34a', borderBottom:`2px solid ${T.border}` }}>Concessional ($M)</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:600, color:'#d97706', borderBottom:`2px solid ${T.border}` }}>Grant ($M)</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:600, color:'#6b7280', borderBottom:`2px solid ${T.border}` }}>Commercial ($M)</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:600, color:'#dc2626', borderBottom:`2px solid ${T.border}` }}>Equity ($M)</th>
                  <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:600, color:T.navy, borderBottom:`2px solid ${T.border}` }}>Total ($M)</th>
                  <th style={{ padding:'6px 8px', textAlign:'center', fontSize:10, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Blended Cost Est.</th>
                </tr>
              </thead>
              <tbody>
                {allDeals.map((d, i) => {
                  const conc = Math.round(d.totalSize * d.concPct / 100);
                  const grant = Math.round(d.totalSize * d.grantPct / 100);
                  const comm = Math.round(d.totalSize * d.commPct / 100);
                  const eq = Math.round(d.totalSize * d.eqPct / 100);
                  const cost = ((d.concPct * 3 + d.grantPct * 0 + d.commPct * 8 + d.eqPct * 16) / 100).toFixed(1);
                  return (
                    <tr key={d.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ padding:'6px 8px', fontWeight:600, color:T.navy, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.project}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:'#16a34a', fontWeight:600 }}>${conc}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:'#d97706' }}>${grant}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:'#6b7280', fontWeight:600 }}>${comm}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:'#dc2626' }}>${eq}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:T.navy }}>${d.totalSize}</td>
                      <td style={{ padding:'6px 8px', textAlign:'center' }}><Badge label={`${cost}%`} color={+cost <= 5 ? 'green' : +cost <= 7 ? 'amber' : 'red'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── DFI MOBILIZATION BARCHART ── */}
      {(activeTab === 'dfi') && (
        <Section title="DFI Mobilization Comparison" badge="BarChart">
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dfiData.slice(0, 10)} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, angle: -20 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="concessional" name="Concessional ($M)" fill="#16a34a" />
                <Bar dataKey="mobilized" name="Mobilized ($M)" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {/* ── BLENDED FINANCE GLOSSARY ── */}
      {(activeTab === 'instruments') && (
        <Section title="Blended Finance Glossary" badge="Key Terms">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {[
                { term:'Leverage Ratio', def:'Commercial capital mobilized per dollar of concessional capital. Higher is better for development efficiency.' },
                { term:'Mobilization', def:'The process of using public/philanthropic capital to attract private investment that would not otherwise participate.' },
                { term:'First-Loss', def:'Capital layer that absorbs initial losses, protecting senior investors and reducing risk for commercial participants.' },
                { term:'Concessionality', def:'The degree to which financing terms are below market rates, measured as the grant-equivalent subsidy.' },
                { term:'Additionality', def:'Evidence that the development outcome would not have occurred without the blended finance intervention.' },
                { term:'Capital Stack', def:'The layered structure of financing instruments ordered by risk/return, from first-loss (highest risk) to senior debt (lowest risk).' },
                { term:'DFI', def:'Development Finance Institution - public entities that provide finance to private sector projects in developing countries.' },
                { term:'Catalytic Capital', def:'Investment that accepts disproportionate risk/return to enable third-party investment that would not otherwise occur.' },
              ].map((g, i) => (
                <div key={i} style={{ padding:12, borderRadius:8, border:`1px solid ${T.border}`, background:T.surfaceH }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{g.term}</div>
                  <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>{g.def}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* ── DEAL YEAR TIMELINE ── */}
      {(activeTab === 'overview') && (
        <Section title="Deal Year Timeline" badge="Pipeline by Year">
          <Card>
            {(() => {
              const yearData = {};
              allDeals.forEach(d => { yearData[d.year] = (yearData[d.year] || { year:d.year, value:0, deals:0 }); yearData[d.year].value += d.totalSize; yearData[d.year].deals += 1; });
              const chartData = Object.values(yearData).sort((a,b) => a.year - b.year);
              return (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData} margin={{ top:10, right:30, left:10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize:12 }} />
                    <YAxis tick={{ fontSize:11 }} tickFormatter={v => `$${v}M`} />
                    <Tooltip formatter={(v,n) => n === 'value' ? `$${v}M` : v} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Area type="monotone" dataKey="value" name="Total Investment ($M)" stroke={T.navy} fill={T.navy} fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </Card>
        </Section>
      )}

      {/* ── CONCESSIONAL CAPITAL IMPACT SCORECARD ── */}
      {(activeTab === 'dfi') && (
        <Section title="Concessional Capital Impact Scorecard" badge="Effectiveness">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
              {[
                { metric:'Average Leverage Achieved', value:`${avgLeverage.toFixed(1)}x`, target:'3.0x', met: avgLeverage >= 3, desc:'Target: $3 mobilized per $1 concessional' },
                { metric:'Deals at Scale (>$100M)', value: allDeals.filter(d => d.totalSize >= 100).length, target:'10+', met: allDeals.filter(d => d.totalSize >= 100).length >= 10, desc:'Large deals demonstrate scalability' },
                { metric:'Multi-SDG Deals', value: `${allDeals.filter(d => d.sdgs.length >= 2).length}/${allDeals.length}`, target:'80%+', met: allDeals.filter(d => d.sdgs.length >= 2).length / allDeals.length >= 0.8, desc:'Deals targeting 2+ SDGs' },
                { metric:'Geographic Diversity', value:`${allGeos.size} regions`, target:'8+', met: allGeos.size >= 8, desc:'Spread across emerging markets' },
                { metric:'Operational Rate', value:`${((allDeals.filter(d => d.status === 'Operational').length / allDeals.length) * 100).toFixed(0)}%`, target:'40%+', met: allDeals.filter(d => d.status === 'Operational').length / allDeals.length >= 0.4, desc:'Percentage of deals fully operational' },
                { metric:'Avg Concessional Share', value:`${Math.round(allDeals.reduce((s,d) => s + d.concPct, 0) / allDeals.length)}%`, target:'<35%', met: allDeals.reduce((s,d) => s + d.concPct, 0) / allDeals.length < 35, desc:'Lower = more efficient use of concessional' },
              ].map((m, i) => (
                <div key={i} style={{ padding:14, borderRadius:10, border:`2px solid ${m.met ? T.green : T.amber}`, background: m.met ? '#dcfce710' : '#fef3c710' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:T.textSec }}>{m.metric}</span>
                    <span style={{ width:20, height:20, borderRadius:'50%', background: m.met ? T.green : T.amber, color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{m.met ? '\u2713' : '!'}</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color: m.met ? T.green : T.amber }}>{m.value}</div>
                  <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>Target: {m.target} | {m.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* ── STRUCTURING BEST PRACTICES ── */}
      {(activeTab === 'structuring') && (
        <Section title="Blended Finance Structuring Best Practices" badge="Guidelines">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
              {[
                { principle:'Minimum Concessionality', desc:'Use the minimum concession needed to mobilize commercial capital. Over-subsidization crowds out private investment and wastes public resources.', icon:'\u21A7' },
                { principle:'Crowding-In, Not Crowding-Out', desc:'Blended finance should attract new private capital, not substitute for investment that would happen anyway at commercial terms.', icon:'\u21D2' },
                { principle:'High Development Impact', desc:'Prioritize deals with clear, measurable SDG outcomes. Impact should be proportional to the level of concessionality provided.', icon:'\u2605' },
                { principle:'Commercial Sustainability', desc:'Structure deals so the underlying project can eventually sustain itself without ongoing subsidies. Build toward market-rate viability.', icon:'\u221E' },
                { principle:'Effective Partnering', desc:'Align incentives between DFIs, commercial investors, and grant providers. Clear roles, governance, and reporting reduce transaction costs.', icon:'\u2694' },
                { principle:'Transparency & Accountability', desc:'Publish deal terms, impact metrics, and leverage ratios. Standardized reporting enables benchmarking across the blended finance market.', icon:'\u2316' },
              ].map((p, i) => (
                <div key={i} style={{ padding:16, borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceH }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{p.principle}</span>
                  </div>
                  <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* ── 14. CROSS-NAV FOOTER ── */}
      <div style={{ marginTop:32, paddingTop:16, borderTop:`2px solid ${T.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Related Modules</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { label:'IWA Impact Weights', path:'/iwa-impact' },
            { label:'Infra ESG DD', path:'/infra-esg-dd' },
            { label:'FI ESG Scoring', path:'/fixed-income-esg' },
            { label:'PE/VC ESG', path:'/pe-vc-esg' },
            { label:'SDG Bond Impact', path:'/sdg-bond-impact' },
            { label:'Adaptation Finance', path:'/adaptation-finance' },
          ].map(n => (
            <button key={n.path} onClick={() => navigate(n.path)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:T.font }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlendedFinancePage;
