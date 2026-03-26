import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, AreaChart, Area,
  ComposedChart, Line
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const LS_KEY = 'ra_fof_portfolio_v1';

const DEFAULT_FUNDS = [
  { id:'F001', name:'Climate Transition Fund I', type:'PE', vintage:2022, aum_mn:850, currency:'USD', geography:'Global', strategy:'Growth Equity', commitment_mn:50, nav_mn:42, dpi:0.15, tvpi:1.18, irr:14.5, esg_score:74, carbon_intensity:45, sfdr_article:9, gresb_score:null, num_holdings:18, gp:'GreenCapital Partners', sector_focus:'Clean Energy + Circular Economy' },
  { id:'F002', name:'European Real Estate Fund III', type:'RE', vintage:2021, aum_mn:1200, currency:'EUR', geography:'Europe', strategy:'Value-Add', commitment_mn:75, nav_mn:68, dpi:0.32, tvpi:1.24, irr:11.2, esg_score:68, carbon_intensity:82, sfdr_article:8, gresb_score:78, num_holdings:24, gp:'Europa RE Advisors', sector_focus:'Office + Logistics' },
  { id:'F003', name:'Asia Infrastructure Fund II', type:'Infra', vintage:2023, aum_mn:2000, currency:'USD', geography:'Asia-Pacific', strategy:'Core+', commitment_mn:100, nav_mn:85, dpi:0.08, tvpi:1.08, irr:9.5, esg_score:61, carbon_intensity:120, sfdr_article:8, gresb_score:65, num_holdings:12, gp:'Pacific Infra Capital', sector_focus:'Renewables + Transport' },
  { id:'F004', name:'Global Credit Opportunities', type:'Credit', vintage:2022, aum_mn:600, currency:'USD', geography:'Global', strategy:'Direct Lending', commitment_mn:40, nav_mn:38, dpi:0.45, tvpi:1.12, irr:8.8, esg_score:58, carbon_intensity:95, sfdr_article:6, gresb_score:null, num_holdings:35, gp:'Meridian Credit', sector_focus:'Healthcare + Tech' },
  { id:'F005', name:'Impact Ventures Fund I', type:'VC', vintage:2023, aum_mn:200, currency:'USD', geography:'India + SEA', strategy:'Early Stage', commitment_mn:15, nav_mn:12, dpi:0.00, tvpi:1.05, irr:null, esg_score:82, carbon_intensity:18, sfdr_article:9, gresb_score:null, num_holdings:22, gp:'Catalyst Ventures', sector_focus:'FinTech + HealthTech + CleanTech' },
  { id:'F006', name:'North American Buyout Fund V', type:'PE', vintage:2021, aum_mn:3500, currency:'USD', geography:'North America', strategy:'Buyout', commitment_mn:150, nav_mn:145, dpi:0.28, tvpi:1.32, irr:18.5, esg_score:55, carbon_intensity:155, sfdr_article:6, gresb_score:null, num_holdings:15, gp:'Summit Capital', sector_focus:'Industrials + Consumer' },
  { id:'F007', name:'Sustainable Fixed Income Fund', type:'Listed FI', vintage:2020, aum_mn:500, currency:'EUR', geography:'Global', strategy:'Green Bonds', commitment_mn:50, nav_mn:48, dpi:1.15, tvpi:1.15, irr:4.2, esg_score:85, carbon_intensity:22, sfdr_article:9, gresb_score:null, num_holdings:80, gp:'Nordic Sustainable AM', sector_focus:'Green + Social Bonds' },
  { id:'F008', name:'Global Equity ESG Leaders', type:'Listed Equity', vintage:2019, aum_mn:2200, currency:'USD', geography:'Global', strategy:'Best-in-Class', commitment_mn:200, nav_mn:245, dpi:0.85, tvpi:1.85, irr:12.8, esg_score:76, carbon_intensity:68, sfdr_article:8, gresb_score:null, num_holdings:120, gp:'Vanguard ESG', sector_focus:'Multi-Sector ESG Leaders' },
  { id:'F009', name:'Africa Growth Fund I', type:'PE', vintage:2024, aum_mn:150, currency:'USD', geography:'Sub-Saharan Africa', strategy:'Growth', commitment_mn:10, nav_mn:8, dpi:0.00, tvpi:1.00, irr:null, esg_score:60, carbon_intensity:40, sfdr_article:9, gresb_score:null, num_holdings:8, gp:'Sahel Capital', sector_focus:'AgriTech + Off-Grid Solar' },
  { id:'F010', name:'Japan Transition Fund', type:'PE', vintage:2023, aum_mn:800, currency:'JPY', geography:'Japan', strategy:'Transition', commitment_mn:60, nav_mn:52, dpi:0.05, tvpi:1.05, irr:8.0, esg_score:70, carbon_intensity:180, sfdr_article:8, gresb_score:null, num_holdings:10, gp:'Nippon Transition Partners', sector_focus:'Heavy Industry Decarbonization' },
  { id:'F011', name:'Latin America Infra Fund I', type:'Infra', vintage:2022, aum_mn:500, currency:'USD', geography:'LATAM', strategy:'Greenfield', commitment_mn:30, nav_mn:25, dpi:0.10, tvpi:1.10, irr:10.5, esg_score:63, carbon_intensity:55, sfdr_article:8, gresb_score:58, num_holdings:8, gp:'Andes Capital', sector_focus:'Solar + Wind + Water' },
  { id:'F012', name:'UK Social Housing REIT', type:'RE', vintage:2020, aum_mn:350, currency:'GBP', geography:'UK', strategy:'Core', commitment_mn:25, nav_mn:27, dpi:0.55, tvpi:1.28, irr:7.5, esg_score:80, carbon_intensity:48, sfdr_article:9, gresb_score:82, num_holdings:42, gp:'Civic Housing Partners', sector_focus:'Affordable Housing + Social Infrastructure' },
];

const TYPE_COLORS = { PE:'#1b3a5c', RE:'#c5a96a', Infra:'#5a8a6a', Credit:'#d97706', VC:'#7c3aed', 'Listed FI':'#2c5a8c', 'Listed Equity':'#16a34a' };
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#d97706','#7c3aed','#2c5a8c','#16a34a'];

const emptyFund = () => ({ id:'', name:'', type:'PE', vintage:2024, aum_mn:0, currency:'USD', geography:'', strategy:'', commitment_mn:0, nav_mn:0, dpi:0, tvpi:1.0, irr:null, esg_score:50, carbon_intensity:50, sfdr_article:8, gresb_score:null, num_holdings:0, gp:'', sector_focus:'' });

const esgColor = v => v >= 75 ? T.green : v >= 60 ? T.amber : T.red;
const sfdrBadge = a => a === 9 ? { bg:'#dcfce7', color:T.green, label:'Art 9' } : a === 8 ? { bg:'#fef3c7', color:T.amber, label:'Art 8' } : { bg:'#fee2e2', color:T.red, label:'Art 6' };

const wAvg = (funds, field, weight='commitment_mn') => {
  const totalW = funds.reduce((s,f) => s + (f[weight]||0), 0);
  if (!totalW) return 0;
  return funds.reduce((s,f) => s + (f[field]||0)*(f[weight]||0), 0) / totalW;
};

const Card = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 18px', minWidth:150, flex:'1 1 170px' }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

const SortIcon = ({ col, sortCol, sortDir }) => {
  if (col !== sortCol) return <span style={{ opacity:0.3, marginLeft:3 }}>&#8597;</span>;
  return <span style={{ marginLeft:3 }}>{sortDir === 'asc' ? '&#9650;' : '&#9660;'}</span>;
};

export default function FundOfFundsPage() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState(() => {
    try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : DEFAULT_FUNDS; } catch { return DEFAULT_FUNDS; }
  });
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterType, setFilterType] = useState('All');
  const [filterSfdr, setFilterSfdr] = useState('All');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newFund, setNewFund] = useState(emptyFund());
  const [esgFloor, setEsgFloor] = useState(0);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(funds)); }, [funds]);

  const handleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };

  const types = useMemo(() => ['All', ...new Set(funds.map(f => f.type))], [funds]);
  const filtered = useMemo(() => {
    let r = [...funds];
    if (filterType !== 'All') r = r.filter(f => f.type === filterType);
    if (filterSfdr !== 'All') r = r.filter(f => String(f.sfdr_article) === filterSfdr);
    if (esgFloor > 0) r = r.filter(f => f.esg_score >= esgFloor);
    r.sort((a, b) => { let va = a[sortCol], vb = b[sortCol]; if (va == null) return 1; if (vb == null) return -1; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0); });
    return r;
  }, [funds, filterType, filterSfdr, esgFloor, sortCol, sortDir]);

  /* KPIs */
  const kpis = useMemo(() => {
    const f = funds;
    const totalCommit = f.reduce((s,x) => s+x.commitment_mn,0);
    const totalNav = f.reduce((s,x) => s+x.nav_mn,0);
    const totalAUM = f.reduce((s,x) => s+x.aum_mn,0);
    const wTVPI = wAvg(f,'tvpi');
    const irrFunds = f.filter(x => x.irr != null);
    const wIRR = irrFunds.length ? wAvg(irrFunds,'irr') : null;
    const wESG = wAvg(f,'esg_score');
    const wCarbon = wAvg(f,'carbon_intensity');
    const art89 = f.filter(x => x.sfdr_article >= 8).length;
    const gresbFunds = f.filter(x => x.gresb_score != null);
    const totalHoldings = f.reduce((s,x) => s+x.num_holdings,0);
    const geos = new Set(f.map(x => x.geography)).size;
    const fundTypes = new Set(f.map(x => x.type)).size;
    return { totalCommit, totalNav, totalAUM, wTVPI, wIRR, wESG, wCarbon, art89, art89pct: f.length ? (art89/f.length*100) : 0, gresbPct: f.length ? (gresbFunds.length/f.length*100) : 0, totalHoldings, geos, fundTypes, count: f.length };
  }, [funds]);

  /* Chart data */
  const assetAlloc = useMemo(() => {
    const map = {};
    funds.forEach(f => { map[f.type] = (map[f.type]||0) + f.commitment_mn; });
    return Object.entries(map).map(([name,value]) => ({ name, value }));
  }, [funds]);

  const scatterData = useMemo(() => funds.filter(f => f.irr != null).map(f => ({ name:f.name, x:f.esg_score, y:f.irr, z:f.commitment_mn, type:f.type })), [funds]);

  const sfdrData = useMemo(() => {
    const buckets = { 6:{count:0,aum:0}, 8:{count:0,aum:0}, 9:{count:0,aum:0} };
    funds.forEach(f => { const b = buckets[f.sfdr_article]; if(b){ b.count++; b.aum+=f.commitment_mn; }});
    return [6,8,9].map(a => ({ name:`Article ${a}`, count:buckets[a].count, aum:buckets[a].aum }));
  }, [funds]);

  const geoData = useMemo(() => {
    const map = {};
    funds.forEach(f => { map[f.geography] = (map[f.geography]||0) + f.commitment_mn; });
    return Object.entries(map).map(([name,value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [funds]);

  const vintageData = useMemo(() => {
    const map = {};
    funds.forEach(f => { map[f.vintage] = (map[f.vintage]||0) + 1; });
    return Object.keys(map).sort().map(y => ({ year:String(y), count:map[y] }));
  }, [funds]);

  const jCurveData = useMemo(() => {
    const years = [];
    for (let y = 0; y <= 10; y++) {
      const callPct = y <= 4 ? 0.25 * Math.min(y/4, 1) * (4-y)/4 + 0.05 : 0;
      const distPct = y >= 3 ? Math.min((y-3)/7, 1) * 0.35 : 0;
      const calls = -kpis.totalCommit * (y <= 4 ? (0.3 - 0.06*y) : 0);
      const dists = kpis.totalCommit * (y >= 3 ? Math.min((y-3)/5, 1) * 0.25 : 0);
      const net = calls + dists;
      years.push({ year:`Y${y}`, calls: Math.round(calls*10)/10, distributions: Math.round(dists*10)/10, net: Math.round(net*10)/10 });
    }
    return years;
  }, [kpis.totalCommit]);

  const carbonByType = useMemo(() => {
    const map = {};
    funds.forEach(f => {
      if (!map[f.type]) map[f.type] = { type:f.type, total:0, weight:0 };
      map[f.type].total += f.carbon_intensity * f.commitment_mn;
      map[f.type].weight += f.commitment_mn;
    });
    return Object.values(map).map(m => ({ type:m.type, intensity: Math.round(m.total/m.weight) }));
  }, [funds]);

  /* CRUD */
  const addFund = () => {
    if (!newFund.name.trim()) return;
    const id = 'F' + String(funds.length + 1).padStart(3, '0') + '_' + Date.now();
    setFunds(p => [...p, { ...newFund, id }]);
    setNewFund(emptyFund());
    setShowAdd(false);
  };
  const startEdit = f => { setEditId(f.id); setEditData({ ...f }); };
  const saveEdit = () => { setFunds(p => p.map(f => f.id === editId ? { ...editData } : f)); setEditId(null); setEditData(null); };
  const deleteFund = id => { if (window.confirm('Remove this fund?')) setFunds(p => p.filter(f => f.id !== id)); };

  /* Exports */
  const exportCSV = () => {
    const hdr = Object.keys(funds[0]||{}).join(',');
    const rows = filtered.map(f => Object.values(f).map(v => v == null ? '' : `"${v}"`).join(',')).join('\n');
    const blob = new Blob([hdr + '\n' + rows], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fof_portfolio.csv'; a.click();
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fof_portfolio.json'; a.click();
  };
  const exportHTML = () => {
    const html = `<html><head><title>FoF ESG Report</title><style>body{font-family:Inter,sans-serif;padding:40px;color:#1b3a5c}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e0d8;padding:8px;text-align:left;font-size:12px}th{background:#f0ede7}</style></head><body><h1>Fund-of-Funds ESG Portfolio Report</h1><p>Generated: ${new Date().toISOString().slice(0,10)}</p><p>Total Funds: ${funds.length} | Total Commitment: $${kpis.totalCommit}M | Weighted ESG: ${kpis.wESG.toFixed(1)}</p><table><tr>${Object.keys(funds[0]||{}).map(k=>`<th>${k}</th>`).join('')}</tr>${filtered.map(f=>`<tr>${Object.values(f).map(v=>`<td>${v??'-'}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
    const blob = new Blob([html], { type:'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fof_report.html'; a.click();
  };

  /* Cross-asset ESG comparison */
  const crossAssetESG = useMemo(() => {
    const map = {};
    funds.forEach(f => {
      if (!map[f.type]) map[f.type] = { type:f.type, funds:0, avgESG:0, avgCarbon:0, totalCommit:0, art9:0, gresbCover:0, totalESG:0, totalCarbon:0, gresbCount:0 };
      const m = map[f.type];
      m.funds++; m.totalCommit += f.commitment_mn; m.totalESG += f.esg_score; m.totalCarbon += f.carbon_intensity;
      if (f.sfdr_article === 9) m.art9++;
      if (f.gresb_score != null) m.gresbCount++;
    });
    return Object.values(map).map(m => ({ ...m, avgESG:(m.totalESG/m.funds).toFixed(1), avgCarbon:(m.totalCarbon/m.funds).toFixed(0), art9Pct:((m.art9/m.funds)*100).toFixed(0), gresbPct:((m.gresbCount/m.funds)*100).toFixed(0) }));
  }, [funds]);

  const thStyle = { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:0.5, borderBottom:`2px solid ${T.border}`, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', background:T.surfaceH };
  const tdStyle = { padding:'9px 12px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };
  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setActiveTab(key)} style={{ padding:'8px 18px', fontSize:13, fontWeight:activeTab===key?700:500, color:activeTab===key?T.navy:T.textSec, background:activeTab===key?T.surface:'transparent', border:activeTab===key?`1px solid ${T.border}`:'1px solid transparent', borderRadius:8, cursor:'pointer', borderBottom:activeTab===key?'none':undefined }}>
      {label}
    </button>
  );

  const renderField = (label, field, type='text') => (
    <div style={{ flex:'1 1 200px' }}>
      <label style={{ fontSize:11, color:T.textSec, fontWeight:600, display:'block', marginBottom:3 }}>{label}</label>
      <input type={type} value={showAdd ? (newFund[field]??'') : (editData?.[field]??'')} onChange={e => { const v = type==='number' ? (e.target.value===''?null:Number(e.target.value)) : e.target.value; showAdd ? setNewFund(p=>({...p,[field]:v})) : setEditData(p=>({...p,[field]:v})); }} style={{ width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, color:T.text, boxSizing:'border-box' }} />
    </div>
  );

  const renderSelect = (label, field, options) => (
    <div style={{ flex:'1 1 160px' }}>
      <label style={{ fontSize:11, color:T.textSec, fontWeight:600, display:'block', marginBottom:3 }}>{label}</label>
      <select value={showAdd ? newFund[field] : (editData?.[field]??'')} onChange={e => { const v = e.target.value; showAdd ? setNewFund(p=>({...p,[field]:v})) : setEditData(p=>({...p,[field]:v})); }} style={{ width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:700, color:T.navy }}>Fund-of-Funds ESG Aggregation</h1>
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {['12 Funds','5 Asset Classes','Multi-Currency'].map(b => (
              <span key={b} style={{ background:`${T.navy}10`, color:T.navy, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCSV} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.navy, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Export CSV</button>
          <button onClick={exportJSON} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.sage, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Export JSON</button>
          <button onClick={exportHTML} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.gold, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Export HTML</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <Card label="Total Commitment" value={`$${kpis.totalCommit}M`} sub={`${kpis.count} funds`} />
        <Card label="Total NAV" value={`$${kpis.totalNav}M`} />
        <Card label="Wtd. TVPI" value={kpis.wTVPI.toFixed(2)+'x'} color={kpis.wTVPI >= 1.1 ? T.green : T.amber} />
        <Card label="Wtd. IRR" value={kpis.wIRR != null ? kpis.wIRR.toFixed(1)+'%' : 'N/A'} color={T.sage} />
        <Card label="Wtd. ESG Score" value={kpis.wESG.toFixed(1)} color={esgColor(kpis.wESG)} />
        <Card label="Wtd. Carbon Int." value={kpis.wCarbon.toFixed(0)} sub="tCO2e/$M" color={kpis.wCarbon < 80 ? T.green : T.red} />
        <Card label="Art 8+9 %" value={kpis.art89pct.toFixed(0)+'%'} sub={`${kpis.art89} funds`} color={T.sage} />
        <Card label="GRESB Coverage" value={kpis.gresbPct.toFixed(0)+'%'} />
        <Card label="Total Holdings" value={kpis.totalHoldings.toLocaleString()} />
        <Card label="Geographies" value={kpis.geos} />
        <Card label="Fund Types" value={kpis.fundTypes} />
        <Card label="Total AUM" value={`$${(kpis.totalAUM/1000).toFixed(1)}B`} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:`1px solid ${T.border}`, paddingBottom:0, flexWrap:'wrap' }}>
        {tabBtn('portfolio','Portfolio Table')}
        {tabBtn('charts','Analytics')}
        {tabBtn('jcurve','J-Curve')}
        {tabBtn('comparison','Cross-Asset ESG')}
        {tabBtn('manage','Manage Funds')}
      </div>

      {/* Portfolio Table Tab */}
      {activeTab === 'portfolio' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 18px', display:'flex', gap:12, alignItems:'center', borderBottom:`1px solid ${T.border}`, flexWrap:'wrap' }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontFamily:T.font }}>
              {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
            <select value={filterSfdr} onChange={e => setFilterSfdr(e.target.value)} style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontFamily:T.font }}>
              <option value="All">All SFDR</option><option value="6">Art 6</option><option value="8">Art 8</option><option value="9">Art 9</option>
            </select>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:11, color:T.textSec }}>Min ESG: {esgFloor}</span>
              <input type="range" min={0} max={100} value={esgFloor} onChange={e => setEsgFloor(Number(e.target.value))} style={{ width:100 }} />
            </div>
            <span style={{ fontSize:12, color:T.textMut, marginLeft:'auto' }}>{filtered.length} funds shown</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:T.textMut }}>
              <div style={{ fontSize:36, marginBottom:8 }}>No funds match filters</div>
              <div style={{ fontSize:13 }}>Adjust filters or add funds to see data</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1400 }}>
                <thead>
                  <tr>
                    {[['name','Fund Name'],['type','Type'],['vintage','Vintage'],['gp','GP'],['geography','Geo'],['commitment_mn','Commit $M'],['nav_mn','NAV $M'],['tvpi','TVPI'],['irr','IRR %'],['esg_score','ESG'],['carbon_intensity','Carbon'],['sfdr_article','SFDR'],['gresb_score','GRESB'],['num_holdings','Holdings']].map(([col,label]) => (
                      <th key={col} style={thStyle} onClick={() => handleSort(col)}>
                        {label}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                      </th>
                    ))}
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => {
                    const sB = sfdrBadge(f.sfdr_article);
                    if (editId === f.id && editData) return (
                      <tr key={f.id} style={{ background:'#fffde7' }}>
                        <td style={tdStyle}><input value={editData.name} onChange={e => setEditData(p=>({...p,name:e.target.value}))} style={{ width:'100%', padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><select value={editData.type} onChange={e => setEditData(p=>({...p,type:e.target.value}))} style={{ padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }}>{['PE','RE','Infra','Credit','VC','Listed FI','Listed Equity'].map(o=><option key={o}>{o}</option>)}</select></td>
                        <td style={tdStyle}><input type="number" value={editData.vintage} onChange={e => setEditData(p=>({...p,vintage:Number(e.target.value)}))} style={{ width:60, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input value={editData.gp} onChange={e => setEditData(p=>({...p,gp:e.target.value}))} style={{ width:'100%', padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input value={editData.geography} onChange={e => setEditData(p=>({...p,geography:e.target.value}))} style={{ width:80, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" value={editData.commitment_mn} onChange={e => setEditData(p=>({...p,commitment_mn:Number(e.target.value)}))} style={{ width:60, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" value={editData.nav_mn} onChange={e => setEditData(p=>({...p,nav_mn:Number(e.target.value)}))} style={{ width:60, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" step="0.01" value={editData.tvpi} onChange={e => setEditData(p=>({...p,tvpi:Number(e.target.value)}))} style={{ width:60, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" step="0.1" value={editData.irr??''} onChange={e => setEditData(p=>({...p,irr:e.target.value===''?null:Number(e.target.value)}))} style={{ width:60, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" value={editData.esg_score} onChange={e => setEditData(p=>({...p,esg_score:Number(e.target.value)}))} style={{ width:50, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" value={editData.carbon_intensity} onChange={e => setEditData(p=>({...p,carbon_intensity:Number(e.target.value)}))} style={{ width:50, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><select value={editData.sfdr_article} onChange={e => setEditData(p=>({...p,sfdr_article:Number(e.target.value)}))} style={{ padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }}><option value={6}>6</option><option value={8}>8</option><option value={9}>9</option></select></td>
                        <td style={tdStyle}><input type="number" value={editData.gresb_score??''} onChange={e => setEditData(p=>({...p,gresb_score:e.target.value===''?null:Number(e.target.value)}))} style={{ width:50, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}><input type="number" value={editData.num_holdings} onChange={e => setEditData(p=>({...p,num_holdings:Number(e.target.value)}))} style={{ width:50, padding:4, border:`1px solid ${T.border}`, borderRadius:4, fontSize:12 }} /></td>
                        <td style={tdStyle}>
                          <button onClick={saveEdit} style={{ padding:'4px 8px', fontSize:11, background:T.green, color:'#fff', border:'none', borderRadius:4, cursor:'pointer', marginRight:4 }}>Save</button>
                          <button onClick={() => { setEditId(null); setEditData(null); }} style={{ padding:'4px 8px', fontSize:11, background:T.textMut, color:'#fff', border:'none', borderRadius:4, cursor:'pointer' }}>Cancel</button>
                        </td>
                      </tr>
                    );
                    return (
                      <tr key={f.id} style={{ transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background=T.surfaceH} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ ...tdStyle, fontWeight:600, maxWidth:200 }}>{f.name}</td>
                        <td style={tdStyle}><span style={{ background:TYPE_COLORS[f.type]+'18', color:TYPE_COLORS[f.type], padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600 }}>{f.type}</span></td>
                        <td style={tdStyle}>{f.vintage}</td>
                        <td style={{ ...tdStyle, fontSize:11, color:T.textSec }}>{f.gp}</td>
                        <td style={{ ...tdStyle, fontSize:11 }}>{f.geography}</td>
                        <td style={{ ...tdStyle, fontWeight:600 }}>{f.commitment_mn}</td>
                        <td style={tdStyle}>{f.nav_mn}</td>
                        <td style={{ ...tdStyle, fontWeight:600, color:f.tvpi>=1.2?T.green:f.tvpi>=1?T.amber:T.red }}>{f.tvpi.toFixed(2)}x</td>
                        <td style={{ ...tdStyle, color:f.irr!=null?(f.irr>=12?T.green:f.irr>=8?T.amber:T.red):T.textMut }}>{f.irr!=null?f.irr.toFixed(1)+'%':'N/A'}</td>
                        <td style={tdStyle}><span style={{ background:esgColor(f.esg_score)+'18', color:esgColor(f.esg_score), padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>{f.esg_score}</span></td>
                        <td style={tdStyle}>{f.carbon_intensity}</td>
                        <td style={tdStyle}><span style={{ background:sB.bg, color:sB.color, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{sB.label}</span></td>
                        <td style={tdStyle}>{f.gresb_score ?? '-'}</td>
                        <td style={tdStyle}>{f.num_holdings}</td>
                        <td style={tdStyle}>
                          <button onClick={() => startEdit(f)} style={{ padding:'3px 8px', fontSize:11, background:T.navyL, color:'#fff', border:'none', borderRadius:4, cursor:'pointer', marginRight:4 }}>Edit</button>
                          <button onClick={() => deleteFund(f.id)} style={{ padding:'3px 8px', fontSize:11, background:T.red, color:'#fff', border:'none', borderRadius:4, cursor:'pointer' }}>Del</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {/* Asset Class Allocation + ESG vs IRR */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>Asset Class Allocation by Commitment</h3>
              {assetAlloc.length === 0 ? <div style={{ textAlign:'center', color:T.textMut, padding:40 }}>No data</div> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={assetAlloc} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={true} stroke={T.surface} strokeWidth={2}>
                      {assetAlloc.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `$${v}M`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>ESG Score vs IRR (bubble = commitment)</h3>
              {scatterData.length === 0 ? <div style={{ textAlign:'center', color:T.textMut, padding:40 }}>No IRR data available</div> : (
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top:10, right:20, bottom:10, left:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="x" name="ESG Score" type="number" domain={[40,100]} tick={{ fontSize:11 }} label={{ value:'ESG Score', position:'bottom', fontSize:11 }} />
                    <YAxis dataKey="y" name="IRR" type="number" tick={{ fontSize:11 }} label={{ value:'IRR %', angle:-90, position:'insideLeft', fontSize:11 }} />
                    <ZAxis dataKey="z" range={[60, 400]} name="Commitment" />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:10, fontSize:12 }}><div style={{ fontWeight:700 }}>{d.name}</div><div>ESG: {d.x} | IRR: {d.y}% | Commit: ${d.z}M</div></div>;
                    }} />
                    <Scatter data={scatterData} fill={T.navy}>
                      {scatterData.map((d, i) => <Cell key={i} fill={TYPE_COLORS[d.type] || T.navy} fillOpacity={0.7} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* SFDR + Geography */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>SFDR Classification</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sfdrData} margin={{ top:10, right:20, bottom:10, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize:11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar yAxisId="left" dataKey="count" name="# Funds" fill={T.navy} radius={[4,4,0,0]} />
                  <Bar yAxisId="right" dataKey="aum" name="Commitment $M" fill={T.gold} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>Geography Distribution (Commitment $M)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={geoData} layout="vertical" margin={{ top:10, right:20, bottom:10, left:80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10 }} width={75} />
                  <Tooltip formatter={v => `$${v}M`} />
                  <Bar dataKey="value" fill={T.sage} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vintage + Carbon by Type */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>Vintage Year Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={vintageData} margin={{ top:10, right:20, bottom:10, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="# Funds" fill={T.navyL} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>Carbon Intensity by Asset Class</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={carbonByType} margin={{ top:10, right:20, bottom:10, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip formatter={v => `${v} tCO2e/$M`} />
                  <Bar dataKey="intensity" name="Wtd Carbon Int." fill={T.red} radius={[4,4,0,0]}>
                    {carbonByType.map((d, i) => <Cell key={i} fill={TYPE_COLORS[d.type] || T.navy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* J-Curve Tab */}
      {activeTab === 'jcurve' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginBottom:28 }}>
          <h3 style={{ margin:'0 0 6px', fontSize:17, color:T.navy }}>FoF J-Curve Projection</h3>
          <p style={{ margin:'0 0 18px', fontSize:12, color:T.textSec }}>Simulated aggregate cash flow profile based on portfolio commitment of ${kpis.totalCommit}M across all fund types.</p>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={jCurveData} margin={{ top:10, right:20, bottom:10, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip formatter={v => `$${v}M`} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="calls" name="Capital Calls" fill={T.red} opacity={0.6} radius={[4,4,0,0]} />
              <Bar dataKey="distributions" name="Distributions" fill={T.green} opacity={0.6} radius={[4,4,0,0]} />
              <Line dataKey="net" name="Net Cash Flow" type="monotone" stroke={T.navy} strokeWidth={2} dot={{ r:4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cross-Asset ESG Tab */}
      {activeTab === 'comparison' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.border}` }}>
            <h3 style={{ margin:0, fontSize:15, color:T.navy }}>Cross-Asset Class ESG Comparison</h3>
          </div>
          {crossAssetESG.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:T.textMut }}>No data available</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Asset Class','# Funds','Total Commit $M','Avg ESG Score','Avg Carbon Int.','Art 9 %','GRESB Coverage %'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crossAssetESG.map(r => (
                    <tr key={r.type} onMouseEnter={e => e.currentTarget.style.background=T.surfaceH} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ ...tdStyle, fontWeight:600 }}><span style={{ background:TYPE_COLORS[r.type]+'18', color:TYPE_COLORS[r.type], padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>{r.type}</span></td>
                      <td style={tdStyle}>{r.funds}</td>
                      <td style={{ ...tdStyle, fontWeight:600 }}>${r.totalCommit}M</td>
                      <td style={tdStyle}><span style={{ color:esgColor(Number(r.avgESG)), fontWeight:700 }}>{r.avgESG}</span></td>
                      <td style={tdStyle}>{r.avgCarbon} tCO2e/$M</td>
                      <td style={tdStyle}>{r.art9Pct}%</td>
                      <td style={tdStyle}>{r.gresbPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manage Funds Tab */}
      {activeTab === 'manage' && (
        <div>
          {/* Add Fund Form */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:showAdd?16:0 }}>
              <h3 style={{ margin:0, fontSize:15, color:T.navy }}>Add New Fund</h3>
              <button onClick={() => setShowAdd(p => !p)} style={{ padding:'6px 14px', fontSize:12, fontWeight:600, background:showAdd?T.textMut:T.navy, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>
                {showAdd ? 'Cancel' : '+ Add Fund'}
              </button>
            </div>
            {showAdd && (
              <div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                  {renderField('Fund Name','name')}
                  {renderSelect('Type','type',['PE','RE','Infra','Credit','VC','Listed FI','Listed Equity'])}
                  {renderField('Vintage','vintage','number')}
                  {renderField('GP','gp')}
                  {renderField('Geography','geography')}
                  {renderField('Strategy','strategy')}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                  {renderField('AUM ($M)','aum_mn','number')}
                  {renderSelect('Currency','currency',['USD','EUR','GBP','JPY'])}
                  {renderField('Commitment ($M)','commitment_mn','number')}
                  {renderField('NAV ($M)','nav_mn','number')}
                  {renderField('DPI','dpi','number')}
                  {renderField('TVPI','tvpi','number')}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                  {renderField('IRR %','irr','number')}
                  {renderField('ESG Score','esg_score','number')}
                  {renderField('Carbon Intensity','carbon_intensity','number')}
                  {renderSelect('SFDR Article','sfdr_article',[6,8,9])}
                  {renderField('GRESB Score','gresb_score','number')}
                  {renderField('# Holdings','num_holdings','number')}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:16 }}>
                  {renderField('Sector Focus','sector_focus')}
                </div>
                <button onClick={addFund} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, background:T.navy, color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>Add Fund to Portfolio</button>
              </div>
            )}
          </div>

          {/* Fund Cards for quick management */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
            {funds.map(f => {
              const sB = sfdrBadge(f.sfdr_article);
              return (
                <div key={f.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>{f.name}</div>
                      <div style={{ fontSize:11, color:T.textSec }}>{f.gp} | {f.vintage}</div>
                    </div>
                    <span style={{ background:sB.bg, color:sB.color, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{sB.label}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
                    <div><div style={{ fontSize:10, color:T.textMut }}>Commit</div><div style={{ fontSize:13, fontWeight:600 }}>${f.commitment_mn}M</div></div>
                    <div><div style={{ fontSize:10, color:T.textMut }}>ESG</div><div style={{ fontSize:13, fontWeight:600, color:esgColor(f.esg_score) }}>{f.esg_score}</div></div>
                    <div><div style={{ fontSize:10, color:T.textMut }}>TVPI</div><div style={{ fontSize:13, fontWeight:600 }}>{f.tvpi.toFixed(2)}x</div></div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setActiveTab('portfolio'); startEdit(f); }} style={{ flex:1, padding:'6px', fontSize:11, fontWeight:600, background:T.navyL, color:'#fff', border:'none', borderRadius:5, cursor:'pointer' }}>Edit</button>
                    <button onClick={() => deleteFund(f.id)} style={{ flex:1, padding:'6px', fontSize:11, fontWeight:600, background:T.red+'20', color:T.red, border:`1px solid ${T.red}40`, borderRadius:5, cursor:'pointer' }}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross Navigation */}
      <div style={{ marginTop:32, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
        <div style={{ fontSize:12, color:T.textMut, fontWeight:600, marginBottom:10 }}>NAVIGATE TO</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['LP Reporting Engine','/lp-reporting'],
            ['Private Credit ESG','/private-credit'],
            ['Real Estate Dashboard','/real-estate-climate'],
            ['PE/VC Due Diligence','/pe-vc-due-diligence'],
            ['Portfolio Climate VaR','/portfolio-climate-var'],
            ['SFDR PAI Dashboard','/sfdr-pai'],
          ].map(([label,path]) => (
            <button key={path} onClick={() => navigate(path)} style={{ padding:'7px 14px', fontSize:12, fontWeight:500, color:T.navy, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, cursor:'pointer' }}>
              {label} &rarr;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
