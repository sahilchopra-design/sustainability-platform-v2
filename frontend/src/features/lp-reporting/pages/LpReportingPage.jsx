import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const LS_TEMPLATES = 'ra_lp_templates_v1';
const LS_CONFIG = 'ra_lp_config_v1';

const FRAMEWORKS = ['EDCI','SFDR PAI','PRI','TCFD','SDG','Custom'];

const FUNDS = [
  { id:'F001', name:'Climate Transition Fund I', type:'PE', commitment_mn:50, nav_mn:42 },
  { id:'F002', name:'European Real Estate Fund III', type:'RE', commitment_mn:75, nav_mn:68 },
  { id:'F003', name:'Asia Infrastructure Fund II', type:'Infra', commitment_mn:100, nav_mn:85 },
  { id:'F004', name:'Global Credit Opportunities', type:'Credit', commitment_mn:40, nav_mn:38 },
  { id:'F005', name:'Impact Ventures Fund I', type:'VC', commitment_mn:15, nav_mn:12 },
  { id:'F006', name:'North American Buyout Fund V', type:'PE', commitment_mn:150, nav_mn:145 },
  { id:'F007', name:'Sustainable Fixed Income Fund', type:'Listed FI', commitment_mn:50, nav_mn:48 },
  { id:'F008', name:'Global Equity ESG Leaders', type:'Listed Equity', commitment_mn:200, nav_mn:245 },
  { id:'F009', name:'Africa Growth Fund I', type:'PE', commitment_mn:10, nav_mn:8 },
  { id:'F010', name:'Japan Transition Fund', type:'PE', commitment_mn:60, nav_mn:52 },
  { id:'F011', name:'Latin America Infra Fund I', type:'Infra', commitment_mn:30, nav_mn:25 },
  { id:'F012', name:'UK Social Housing REIT', type:'RE', commitment_mn:25, nav_mn:27 },
];

const EDCI_METRICS = [
  { id:'EDCI-1', category:'GHG', metric:'Total Scope 1+2 emissions', unit:'tCO2e', aggregation:'sum' },
  { id:'EDCI-2', category:'GHG', metric:'Scope 1+2 emissions per $M revenue', unit:'tCO2e/$M', aggregation:'weighted_avg' },
  { id:'EDCI-3', category:'GHG', metric:'Renewable energy as % of total', unit:'%', aggregation:'weighted_avg' },
  { id:'EDCI-4', category:'Diversity', metric:'Board gender diversity (%)', unit:'%', aggregation:'weighted_avg' },
  { id:'EDCI-5', category:'Diversity', metric:'C-Suite gender diversity (%)', unit:'%', aggregation:'weighted_avg' },
  { id:'EDCI-6', category:'Employees', metric:'Employee work-related injuries (rate)', unit:'per 200K hrs', aggregation:'weighted_avg' },
  { id:'EDCI-7', category:'Employees', metric:'Employee engagement score', unit:'score', aggregation:'weighted_avg' },
  { id:'EDCI-8', category:'Employees', metric:'Net new hires', unit:'count', aggregation:'sum' },
  { id:'EDCI-9', category:'Governance', metric:'ESG policy in place', unit:'Y/N', aggregation:'pct_yes' },
  { id:'EDCI-10', category:'Governance', metric:'ESG incidents reported', unit:'count', aggregation:'sum' },
];

const EDCI_VALUES = {
  'EDCI-1': { current:12400, prior:14200, benchmark:15800, quality:'High' },
  'EDCI-2': { current:68, prior:82, benchmark:95, quality:'High' },
  'EDCI-3': { current:42, prior:35, benchmark:28, quality:'Medium' },
  'EDCI-4': { current:34, prior:30, benchmark:28, quality:'High' },
  'EDCI-5': { current:22, prior:18, benchmark:20, quality:'Medium' },
  'EDCI-6': { current:1.8, prior:2.1, benchmark:2.5, quality:'Low' },
  'EDCI-7': { current:72, prior:68, benchmark:65, quality:'Medium' },
  'EDCI-8': { current:1850, prior:1200, benchmark:null, quality:'High' },
  'EDCI-9': { current:92, prior:85, benchmark:78, quality:'High' },
  'EDCI-10': { current:3, prior:5, benchmark:8, quality:'Medium' },
};

const PAI_INDICATORS = [
  { id:'PAI-1', indicator:'GHG emissions (Scope 1,2,3)', category:'Climate', value:'18,200 tCO2e', coverage:'85%' },
  { id:'PAI-2', indicator:'Carbon footprint', category:'Climate', value:'42 tCO2e/$M', coverage:'85%' },
  { id:'PAI-3', indicator:'GHG intensity of investee companies', category:'Climate', value:'68 tCO2e/$M rev', coverage:'80%' },
  { id:'PAI-4', indicator:'Exposure to fossil fuel companies', category:'Climate', value:'8.2%', coverage:'100%' },
  { id:'PAI-5', indicator:'Non-renewable energy share', category:'Climate', value:'58%', coverage:'72%' },
  { id:'PAI-6', indicator:'Energy consumption intensity', category:'Climate', value:'245 MWh/$M', coverage:'68%' },
  { id:'PAI-7', indicator:'Activities negatively affecting biodiversity', category:'Biodiversity', value:'2 companies', coverage:'90%' },
  { id:'PAI-8', indicator:'Emissions to water', category:'Water', value:'12 tonnes', coverage:'55%' },
  { id:'PAI-9', indicator:'Hazardous waste ratio', category:'Waste', value:'3.2%', coverage:'60%' },
  { id:'PAI-10', indicator:'UN Global Compact / OECD violations', category:'Social', value:'0 companies', coverage:'100%' },
  { id:'PAI-11', indicator:'Lack of compliance monitoring processes', category:'Social', value:'1 company', coverage:'95%' },
  { id:'PAI-12', indicator:'Unadjusted gender pay gap', category:'Social', value:'14.5%', coverage:'65%' },
  { id:'PAI-13', indicator:'Board gender diversity', category:'Governance', value:'34%', coverage:'88%' },
  { id:'PAI-14', indicator:'Exposure to controversial weapons', category:'Governance', value:'0%', coverage:'100%' },
];

const SDG_MAP = {
  F001:[1,7,9,13], F002:[7,11,13], F003:[7,9,13], F004:[3,8,9],
  F005:[1,3,7,8,9,10], F006:[8,9,12], F007:[6,7,11,13,14,15],
  F008:[7,8,9,12,13], F009:[1,2,7,8], F010:[9,12,13], F011:[7,9,13], F012:[1,3,10,11]
};

const COLLECTION_STATUS = {
  F001:{ collected:8, total:10, contact:'Jane Smith (GP Relations)' },
  F002:{ collected:9, total:10, contact:'Marco Rossi (IR)' },
  F003:{ collected:6, total:10, contact:'Wei Chen (ESG Lead)' },
  F004:{ collected:7, total:10, contact:'Sarah Johnson (Ops)' },
  F005:{ collected:10, total:10, contact:'Priya Nair (Impact)' },
  F006:{ collected:5, total:10, contact:'Tom Baker (IR)' },
  F007:{ collected:9, total:10, contact:'Lars Eriksson (PM)' },
  F008:{ collected:10, total:10, contact:'David Lee (ESG)' },
  F009:{ collected:4, total:10, contact:'Amara Diallo (Ops)' },
  F010:{ collected:7, total:10, contact:'Yuki Tanaka (IR)' },
  F011:{ collected:6, total:10, contact:'Carlos Mendez (ESG)' },
  F012:{ collected:9, total:10, contact:'Emily Brown (PM)' },
};

const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#d97706','#2c5a8c','#7c3aed'];
const qualityColor = q => q === 'High' ? T.green : q === 'Medium' ? T.amber : T.red;

const Card = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 18px', minWidth:145, flex:'1 1 160px' }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

export default function LpReportingPage() {
  const navigate = useNavigate();
  const [activeFrameworks, setActiveFrameworks] = useState(['EDCI']);
  const [selectedFunds, setSelectedFunds] = useState(FUNDS.map(f => f.id));
  const [reportPeriod, setReportPeriod] = useState('Q4 2025');
  const [clientName, setClientName] = useState('Sovereign Wealth Fund Alpha');
  const [clientContact, setClientContact] = useState('investment.team@swfa.gov');
  const [activeTab, setActiveTab] = useState('config');
  const [detailFund, setDetailFund] = useState(null);
  const [templates, setTemplates] = useState(() => {
    try { const s = localStorage.getItem(LS_TEMPLATES); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [templateName, setTemplateName] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => { localStorage.setItem(LS_TEMPLATES, JSON.stringify(templates)); }, [templates]);
  useEffect(() => {
    const cfg = { activeFrameworks, selectedFunds, reportPeriod, clientName, clientContact };
    localStorage.setItem(LS_CONFIG, JSON.stringify(cfg));
  }, [activeFrameworks, selectedFunds, reportPeriod, clientName, clientContact]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_CONFIG);
      if (s) {
        const c = JSON.parse(s);
        if (c.activeFrameworks) setActiveFrameworks(c.activeFrameworks);
        if (c.selectedFunds) setSelectedFunds(c.selectedFunds);
        if (c.reportPeriod) setReportPeriod(c.reportPeriod);
        if (c.clientName) setClientName(c.clientName);
        if (c.clientContact) setClientContact(c.clientContact);
      }
    } catch {}
  }, []);

  const handleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };

  const toggleFramework = fw => setActiveFrameworks(p => p.includes(fw) ? p.filter(x => x !== fw) : [...p, fw]);
  const toggleFund = id => setSelectedFunds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAllFunds = () => setSelectedFunds(FUNDS.map(f => f.id));
  const clearFunds = () => setSelectedFunds([]);

  const selFunds = useMemo(() => FUNDS.filter(f => selectedFunds.includes(f.id)), [selectedFunds]);
  const totalCommit = useMemo(() => selFunds.reduce((s,f) => s + f.commitment_mn, 0), [selFunds]);
  const metricsCollected = useMemo(() => {
    let total = 0;
    selFunds.forEach(f => { const st = COLLECTION_STATUS[f.id]; if (st) total += st.collected; });
    return total;
  }, [selFunds]);
  const totalPossible = selFunds.length * 10;
  const completeness = totalPossible > 0 ? (metricsCollected / totalPossible * 100) : 0;
  const edciCompliance = completeness > 0 ? Math.min(completeness + 5, 100) : 0;
  const sdgCoverage = useMemo(() => {
    const sdgs = new Set();
    selFunds.forEach(f => { (SDG_MAP[f.id]||[]).forEach(s => sdgs.add(s)); });
    return sdgs.size;
  }, [selFunds]);

  /* YoY comparison */
  const yoyData = useMemo(() => EDCI_METRICS.map(m => {
    const v = EDCI_VALUES[m.id];
    const change = v.prior ? ((v.current - v.prior) / Math.abs(v.prior) * 100) : null;
    const better = m.id === 'EDCI-6' || m.id === 'EDCI-10' ? change < 0 : change > 0;
    return { ...m, ...v, change, better };
  }), []);

  const sortedEdci = useMemo(() => {
    const arr = [...yoyData];
    arr.sort((a,b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (va == null) return 1; if (vb == null) return -1;
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return arr;
  }, [yoyData, sortCol, sortDir]);

  /* Benchmark radar data */
  const radarData = useMemo(() => {
    return ['GHG Intensity','Renewables %','Board Diversity','Engagement','Injury Rate'].map((label, i) => {
      const keys = ['EDCI-2','EDCI-3','EDCI-4','EDCI-7','EDCI-6'];
      const v = EDCI_VALUES[keys[i]];
      const normCurrent = i === 4 ? Math.max(0, 100 - v.current * 20) : Math.min(100, v.current * (i === 0 ? 1 : 1));
      const normBench = i === 4 ? Math.max(0, 100 - (v.benchmark||0) * 20) : Math.min(100, (v.benchmark||0) * (i === 0 ? 1 : 1));
      return { metric:label, portfolio:normCurrent, benchmark:normBench };
    });
  }, []);

  /* SDG matrix */
  const sdgMatrix = useMemo(() => {
    const sdgs = Array.from({ length:17 }, (_, i) => i + 1);
    return sdgs.map(s => {
      const row = { sdg:`SDG ${s}` };
      selFunds.forEach(f => { row[f.id] = (SDG_MAP[f.id]||[]).includes(s) ? 'Direct' : 'None'; });
      return row;
    });
  }, [selFunds]);

  /* Category breakdown for chart */
  const categoryData = useMemo(() => {
    const cats = {};
    yoyData.forEach(d => { if (!cats[d.category]) cats[d.category] = { category:d.category, current:0, prior:0, count:0 }; cats[d.category].count++; });
    return Object.values(cats);
  }, [yoyData]);

  /* Exports */
  const exportCSV = () => {
    const header = 'Metric ID,Category,Metric,Current,Prior,Benchmark,YoY %,Quality\n';
    const rows = yoyData.map(d => `${d.id},${d.category},"${d.metric}",${d.current},${d.prior},${d.benchmark??''},${d.change?.toFixed(1)??''},${d.quality}`).join('\n');
    const blob = new Blob([header + rows], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lp_report_${reportPeriod.replace(/\s/g,'_')}.csv`; a.click();
  };

  const exportJSON = () => {
    const report = { client:clientName, period:reportPeriod, frameworks:activeFrameworks, funds:selFunds, edci:yoyData, pai:PAI_INDICATORS, sdg:sdgMatrix, generated:new Date().toISOString() };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lp_report_${reportPeriod.replace(/\s/g,'_')}.json`; a.click();
  };

  const exportHTML = () => {
    const edciRows = yoyData.map(d => `<tr><td>${d.id}</td><td>${d.category}</td><td>${d.metric}</td><td>${d.current}</td><td>${d.prior}</td><td>${d.benchmark??'-'}</td><td style="color:${d.better?'#16a34a':'#dc2626'}">${d.change!=null?(d.change>0?'+':'')+d.change.toFixed(1)+'%':'N/A'}</td><td>${d.quality}</td></tr>`).join('');
    const paiRows = PAI_INDICATORS.map(p => `<tr><td>${p.id}</td><td>${p.indicator}</td><td>${p.category}</td><td>${p.value}</td><td>${p.coverage}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>LP ESG Report - ${clientName}</title><style>body{font-family:Inter,sans-serif;padding:40px;color:#1b3a5c;max-width:1000px;margin:auto}h1{color:#1b3a5c}h2{color:#2c5a8c;border-bottom:2px solid #e5e0d8;padding-bottom:8px}table{border-collapse:collapse;width:100%;margin-bottom:24px}th,td{border:1px solid #e5e0d8;padding:8px;text-align:left;font-size:12px}th{background:#f0ede7;font-weight:700}.badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;margin-right:6px}</style></head><body>
    <h1>LP ESG Report</h1><p><strong>Client:</strong> ${clientName} | <strong>Period:</strong> ${reportPeriod} | <strong>Generated:</strong> ${new Date().toISOString().slice(0,10)}</p><p><strong>Frameworks:</strong> ${activeFrameworks.join(', ')} | <strong>Funds:</strong> ${selFunds.length} | <strong>Total Commitment:</strong> $${totalCommit}M</p>
    <h2>EDCI Metrics</h2><table><tr><th>ID</th><th>Category</th><th>Metric</th><th>Current</th><th>Prior</th><th>Benchmark</th><th>YoY</th><th>Quality</th></tr>${edciRows}</table>
    <h2>SFDR PAI Indicators</h2><table><tr><th>ID</th><th>Indicator</th><th>Category</th><th>Value</th><th>Coverage</th></tr>${paiRows}</table>
    <p style="color:#9aa3ae;font-size:11px;margin-top:40px">Report generated by Risk Analytics LP Reporting Engine. Data as of ${reportPeriod}.</p></body></html>`;
    const blob = new Blob([html], { type:'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lp_report_${reportPeriod.replace(/\s/g,'_')}.html`; a.click();
  };

  const exportPDF = () => { exportHTML(); /* Triggers print-friendly HTML; user can print to PDF */ };

  /* Template management */
  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const tpl = { id:Date.now(), name:templateName, frameworks:activeFrameworks, funds:selectedFunds, period:reportPeriod, clientName, clientContact, created:new Date().toISOString().slice(0,10) };
    setTemplates(p => [...p, tpl]);
    setTemplateName('');
  };
  const loadTemplate = tpl => {
    setActiveFrameworks(tpl.frameworks||['EDCI']);
    setSelectedFunds(tpl.funds||[]);
    setReportPeriod(tpl.period||'Q4 2025');
    setClientName(tpl.clientName||'');
    setClientContact(tpl.clientContact||'');
  };
  const deleteTemplate = id => setTemplates(p => p.filter(t => t.id !== id));

  const thStyle = { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:0.5, borderBottom:`2px solid ${T.border}`, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', background:T.surfaceH };
  const tdStyle = { padding:'9px 12px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };

  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setActiveTab(key)} style={{ padding:'8px 18px', fontSize:13, fontWeight:activeTab===key?700:500, color:activeTab===key?T.navy:T.textSec, background:activeTab===key?T.surface:'transparent', border:activeTab===key?`1px solid ${T.border}`:'1px solid transparent', borderRadius:8, cursor:'pointer', borderBottom:activeTab===key?'none':undefined }}>
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:700, color:T.navy }}>LP Reporting Engine</h1>
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {['EDCI','SFDR PAI','PRI','TCFD','SDG'].map(b => (
              <span key={b} style={{ background:activeFrameworks.includes(b)?`${T.sage}18`:`${T.navy}08`, color:activeFrameworks.includes(b)?T.sage:T.textMut, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCSV} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.navy, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Export CSV</button>
          <button onClick={exportJSON} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.sage, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Export JSON</button>
          <button onClick={exportHTML} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.gold, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Export HTML</button>
          <button onClick={exportPDF} style={{ padding:'8px 14px', fontSize:12, fontWeight:600, background:T.amber, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>Print Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <Card label="Funds Covered" value={selFunds.length} sub={`of ${FUNDS.length} total`} />
        <Card label="Total Commitment" value={`$${totalCommit}M`} />
        <Card label="Metrics Collected" value={metricsCollected} sub={`of ${totalPossible}`} />
        <Card label="Data Completeness" value={completeness.toFixed(0)+'%'} color={completeness >= 80 ? T.green : completeness >= 60 ? T.amber : T.red} />
        <Card label="EDCI Compliance" value={edciCompliance.toFixed(0)+'%'} color={T.sage} />
        <Card label="SDG Coverage" value={`${sdgCoverage}/17`} />
        <Card label="Report Templates" value={templates.length} />
        <Card label="Last Generated" value={new Date().toISOString().slice(0,10)} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:`1px solid ${T.border}`, flexWrap:'wrap' }}>
        {tabBtn('config','Configuration')}
        {tabBtn('edci','EDCI Metrics')}
        {tabBtn('pai','SFDR PAI')}
        {tabBtn('sdg','SDG Matrix')}
        {tabBtn('tracker','Data Tracker')}
        {tabBtn('benchmark','Benchmarking')}
        {tabBtn('preview','Report Preview')}
        {tabBtn('templates','Templates')}
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>Report Framework</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {FRAMEWORKS.map(fw => (
                <button key={fw} onClick={() => toggleFramework(fw)} style={{ padding:'8px 16px', fontSize:12, fontWeight:activeFrameworks.includes(fw)?700:500, color:activeFrameworks.includes(fw)?'#fff':T.navy, background:activeFrameworks.includes(fw)?T.navy:T.surfaceH, border:`1px solid ${activeFrameworks.includes(fw)?T.navy:T.border}`, borderRadius:8, cursor:'pointer' }}>
                  {fw}
                </button>
              ))}
            </div>
            <div style={{ marginTop:18 }}>
              <label style={{ fontSize:11, color:T.textSec, fontWeight:600, display:'block', marginBottom:4 }}>Reporting Period</label>
              <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font }}>
                {['Q1 2025','Q2 2025','Q3 2025','Q4 2025','FY 2025','H1 2025','H2 2025'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginTop:12 }}>
              <label style={{ fontSize:11, color:T.textSec, fontWeight:600, display:'block', marginBottom:4 }}>Client / LP Name</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, boxSizing:'border-box' }} />
            </div>
            <div style={{ marginTop:12 }}>
              <label style={{ fontSize:11, color:T.textSec, fontWeight:600, display:'block', marginBottom:4 }}>Contact Email</label>
              <input value={clientContact} onChange={e => setClientContact(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, boxSizing:'border-box' }} />
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:'0 0 10px', fontSize:15, color:T.navy }}>Fund Selection</h3>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <button onClick={selectAllFunds} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, color:T.navy, background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:5, cursor:'pointer' }}>Select All</button>
              <button onClick={clearFunds} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, color:T.red, background:'#fee2e2', border:`1px solid ${T.red}30`, borderRadius:5, cursor:'pointer' }}>Clear</button>
              <span style={{ fontSize:11, color:T.textMut, alignSelf:'center' }}>{selectedFunds.length} selected</span>
            </div>
            <div style={{ maxHeight:280, overflowY:'auto' }}>
              {FUNDS.map(f => (
                <label key={f.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, cursor:'pointer', background:selectedFunds.includes(f.id)?`${T.sage}08`:'transparent' }}>
                  <input type="checkbox" checked={selectedFunds.includes(f.id)} onChange={() => toggleFund(f.id)} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.navy }}>{f.name}</div>
                    <div style={{ fontSize:10, color:T.textMut }}>{f.type} | ${f.commitment_mn}M</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDCI Metrics Tab */}
      {activeTab === 'edci' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ margin:0, fontSize:15, color:T.navy }}>EDCI Metrics — {reportPeriod}</h3>
            <span style={{ fontSize:11, color:T.textMut }}>{selFunds.length} funds in scope</span>
          </div>
          {selFunds.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:T.textMut }}>
              <div style={{ fontSize:36, marginBottom:8 }}>No funds selected</div>
              <div style={{ fontSize:13 }}>Select funds in the Configuration tab</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {[['id','ID'],['category','Category'],['metric','Metric'],['current','Current'],['prior','Prior Year'],['benchmark','Peer Benchmark'],['change','YoY %'],['quality','Data Quality']].map(([col,label]) => (
                      <th key={col} style={thStyle} onClick={() => handleSort(col)}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEdci.map(d => (
                    <tr key={d.id} onMouseEnter={e => e.currentTarget.style.background=T.surfaceH} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ ...tdStyle, fontWeight:600 }}>{d.id}</td>
                      <td style={tdStyle}><span style={{ background:`${T.navy}10`, color:T.navy, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600 }}>{d.category}</span></td>
                      <td style={{ ...tdStyle, maxWidth:250 }}>{d.metric}</td>
                      <td style={{ ...tdStyle, fontWeight:700 }}>{typeof d.current === 'number' ? d.current.toLocaleString() : d.current} {d.unit !== 'Y/N' && d.unit !== 'count' && d.unit !== 'score' ? d.unit : ''}</td>
                      <td style={tdStyle}>{typeof d.prior === 'number' ? d.prior.toLocaleString() : d.prior}</td>
                      <td style={tdStyle}>{d.benchmark != null ? d.benchmark.toLocaleString() : '-'}</td>
                      <td style={{ ...tdStyle, fontWeight:600, color:d.better?T.green:T.red }}>
                        {d.change != null ? (d.change > 0 ? '+' : '') + d.change.toFixed(1) + '%' : 'N/A'}
                        {d.change != null && <span style={{ marginLeft:4 }}>{d.better ? '\u2191' : '\u2193'}</span>}
                      </td>
                      <td style={tdStyle}><span style={{ background:qualityColor(d.quality)+'18', color:qualityColor(d.quality), padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{d.quality}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SFDR PAI Tab */}
      {activeTab === 'pai' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}` }}>
            <h3 style={{ margin:0, fontSize:15, color:T.navy }}>SFDR Principal Adverse Impact — Private Markets</h3>
            <p style={{ margin:'4px 0 0', fontSize:12, color:T.textSec }}>14 mandatory PAI indicators adapted for private asset classes. Coverage reflects data availability across selected funds.</p>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['ID','Indicator','Category','Portfolio Value','Coverage'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {PAI_INDICATORS.map(p => {
                  const covNum = parseFloat(p.coverage);
                  return (
                    <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background=T.surfaceH} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ ...tdStyle, fontWeight:600 }}>{p.id}</td>
                      <td style={{ ...tdStyle, maxWidth:300 }}>{p.indicator}</td>
                      <td style={tdStyle}><span style={{ background:`${T.gold}18`, color:T.gold, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600 }}>{p.category}</span></td>
                      <td style={{ ...tdStyle, fontWeight:700 }}>{p.value}</td>
                      <td style={tdStyle}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:60, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${covNum}%`, height:'100%', background:covNum >= 80 ? T.green : covNum >= 60 ? T.amber : T.red, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, color:covNum >= 80 ? T.green : covNum >= 60 ? T.amber : T.red }}>{p.coverage}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SDG Matrix Tab */}
      {activeTab === 'sdg' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}` }}>
            <h3 style={{ margin:0, fontSize:15, color:T.navy }}>SDG Contribution Matrix</h3>
            <p style={{ margin:'4px 0 0', fontSize:12, color:T.textSec }}>Mapping fund contributions to UN Sustainable Development Goals (1-17)</p>
          </div>
          {selFunds.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:T.textMut }}>Select funds to view SDG mapping</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, position:'sticky', left:0, background:T.surfaceH, zIndex:2 }}>SDG</th>
                    {selFunds.map(f => <th key={f.id} style={{ ...thStyle, fontSize:10, minWidth:80 }} title={f.name}>{f.name.slice(0,15)}...</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sdgMatrix.map(row => (
                    <tr key={row.sdg}>
                      <td style={{ ...tdStyle, fontWeight:700, position:'sticky', left:0, background:T.surface, zIndex:1, whiteSpace:'nowrap' }}>{row.sdg}</td>
                      {selFunds.map(f => (
                        <td key={f.id} style={{ ...tdStyle, textAlign:'center' }}>
                          {row[f.id] === 'Direct' ? (
                            <span style={{ background:`${T.green}18`, color:T.green, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>Direct</span>
                          ) : (
                            <span style={{ color:T.textMut, fontSize:10 }}>-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Data Tracker Tab */}
      {activeTab === 'tracker' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', marginBottom:28 }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}` }}>
            <h3 style={{ margin:0, fontSize:15, color:T.navy }}>Data Collection Tracker</h3>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Fund','Type','Collected','Missing','Completeness','GP Contact','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {FUNDS.map(f => {
                  const st = COLLECTION_STATUS[f.id] || { collected:0, total:10, contact:'N/A' };
                  const pct = (st.collected / st.total * 100);
                  const missing = st.total - st.collected;
                  return (
                    <tr key={f.id} onMouseEnter={e => e.currentTarget.style.background=T.surfaceH} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ ...tdStyle, fontWeight:600 }}>
                        <span style={{ cursor:'pointer', textDecoration:'underline', color:T.navyL }} onClick={() => setDetailFund(detailFund === f.id ? null : f.id)}>{f.name}</span>
                      </td>
                      <td style={tdStyle}>{f.type}</td>
                      <td style={{ ...tdStyle, fontWeight:600 }}>{st.collected}/10</td>
                      <td style={{ ...tdStyle, color:missing > 0 ? T.red : T.green }}>{missing}</td>
                      <td style={tdStyle}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:80, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background:pct >= 80 ? T.green : pct >= 60 ? T.amber : T.red, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:600 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontSize:11 }}>{st.contact}</td>
                      <td style={tdStyle}>
                        <span style={{ background:pct === 100 ? `${T.green}18` : pct >= 70 ? `${T.amber}18` : `${T.red}18`, color:pct === 100 ? T.green : pct >= 70 ? T.amber : T.red, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>
                          {pct === 100 ? 'Complete' : pct >= 70 ? 'In Progress' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Fund Detail Panel */}
          {detailFund && (
            <div style={{ padding:20, borderTop:`1px solid ${T.border}`, background:T.surfaceH }}>
              <h4 style={{ margin:'0 0 12px', color:T.navy }}>{FUNDS.find(f=>f.id===detailFund)?.name} — EDCI Detail</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
                {EDCI_METRICS.map((m, i) => {
                  const st = COLLECTION_STATUS[detailFund];
                  const hasData = st && i < st.collected;
                  return (
                    <div key={m.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:10 }}>
                      <div style={{ fontSize:10, color:T.textMut, fontWeight:600 }}>{m.id}</div>
                      <div style={{ fontSize:12, color:T.text, fontWeight:600, marginTop:2 }}>{m.metric}</div>
                      <div style={{ fontSize:11, marginTop:4, color:hasData?T.green:T.red, fontWeight:600 }}>
                        {hasData ? 'Collected' : 'Missing'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Benchmarking Tab */}
      {activeTab === 'benchmark' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>Portfolio vs Peer Benchmark (Radar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} margin={{ top:20, right:30, bottom:20, left:30 }}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize:10 }} />
                <PolarRadiusAxis tick={{ fontSize:10 }} />
                <Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, color:T.navy }}>YoY Performance by EDCI Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yoyData} margin={{ top:10, right:20, bottom:10, left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="id" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:10, fontSize:12 }}><div style={{ fontWeight:700 }}>{d.metric}</div><div>Current: {d.current} | Prior: {d.prior}</div><div>Change: {d.change?.toFixed(1)}%</div></div>;
                }} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="current" name="Current" fill={T.navy} radius={[4,4,0,0]} />
                <Bar dataKey="prior" name="Prior Year" fill={T.gold} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Report Preview Tab */}
      {activeTab === 'preview' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:28, marginBottom:28 }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:28, paddingBottom:20, borderBottom:`2px solid ${T.navy}` }}>
              <h2 style={{ margin:0, fontSize:22, color:T.navy }}>LP ESG Report</h2>
              <p style={{ margin:'8px 0 0', fontSize:13, color:T.textSec }}>Prepared for: <strong>{clientName || 'Not specified'}</strong></p>
              <p style={{ margin:'4px 0 0', fontSize:12, color:T.textMut }}>Reporting Period: {reportPeriod} | Generated: {new Date().toISOString().slice(0,10)}</p>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:10 }}>
                {activeFrameworks.map(fw => (
                  <span key={fw} style={{ background:`${T.navy}10`, color:T.navy, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{fw}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <h3 style={{ fontSize:16, color:T.navy, borderBottom:`1px solid ${T.border}`, paddingBottom:6 }}>Executive Summary</h3>
              <p style={{ fontSize:13, color:T.textSec, lineHeight:1.6 }}>
                This report covers {selFunds.length} funds with a total commitment of ${totalCommit}M.
                Data completeness stands at {completeness.toFixed(0)}% across {EDCI_METRICS.length} EDCI metrics.
                The portfolio maps to {sdgCoverage} of 17 UN SDGs. Key improvements year-over-year include
                reductions in carbon intensity and improvements in board gender diversity.
              </p>
            </div>

            {activeFrameworks.includes('EDCI') && (
              <div style={{ marginBottom:24 }}>
                <h3 style={{ fontSize:16, color:T.navy, borderBottom:`1px solid ${T.border}`, paddingBottom:6 }}>EDCI Data Convergence</h3>
                {yoyData.slice(0,5).map(d => (
                  <div key={d.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600 }}>{d.metric}</div>
                      <div style={{ fontSize:11, color:T.textMut }}>{d.category}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{d.current.toLocaleString()} {d.unit !== 'Y/N' ? d.unit : ''}</div>
                      <div style={{ fontSize:11, color:d.better?T.green:T.red }}>{d.change != null ? (d.change > 0?'+':'')+d.change.toFixed(1)+'% YoY' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeFrameworks.includes('SFDR PAI') && (
              <div style={{ marginBottom:24 }}>
                <h3 style={{ fontSize:16, color:T.navy, borderBottom:`1px solid ${T.border}`, paddingBottom:6 }}>SFDR PAI Summary</h3>
                <p style={{ fontSize:12, color:T.textSec }}>14 mandatory Principal Adverse Impact indicators reported. Average data coverage: {(PAI_INDICATORS.reduce((s,p) => s+parseFloat(p.coverage),0)/PAI_INDICATORS.length).toFixed(0)}%.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
                  {PAI_INDICATORS.slice(0,6).map(p => (
                    <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:T.surfaceH, borderRadius:6, fontSize:12 }}>
                      <span style={{ color:T.textSec }}>{p.indicator.slice(0,35)}...</span>
                      <span style={{ fontWeight:700 }}>{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeFrameworks.includes('SDG') && (
              <div style={{ marginBottom:24 }}>
                <h3 style={{ fontSize:16, color:T.navy, borderBottom:`1px solid ${T.border}`, paddingBottom:6 }}>SDG Alignment</h3>
                <p style={{ fontSize:12, color:T.textSec }}>Portfolio contributes to {sdgCoverage} of 17 SDGs through direct investment activities.</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                  {Array.from({ length:17 }, (_, i) => i+1).map(s => {
                    const active = selFunds.some(f => (SDG_MAP[f.id]||[]).includes(s));
                    return <span key={s} style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, fontSize:12, fontWeight:700, background:active?`${T.sage}18`:T.surfaceH, color:active?T.sage:T.textMut, border:`1px solid ${active?T.sage+'40':T.border}` }}>{s}</span>;
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop:28, paddingTop:16, borderTop:`2px solid ${T.border}`, fontSize:11, color:T.textMut, textAlign:'center' }}>
              Report generated by Risk Analytics LP Reporting Engine. Data as of {reportPeriod}. For questions contact: {clientContact || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, marginBottom:28 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:15, color:T.navy }}>Report Templates</h3>
          <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:11, color:T.textSec, fontWeight:600, display:'block', marginBottom:3 }}>Template Name</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g., Quarterly EDCI Report" style={{ width:'100%', padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, boxSizing:'border-box' }} />
            </div>
            <button onClick={saveTemplate} style={{ padding:'9px 20px', fontSize:12, fontWeight:700, background:T.navy, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', whiteSpace:'nowrap' }}>Save Current Config</button>
          </div>
          {templates.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:T.textMut }}>
              <div style={{ fontSize:28, marginBottom:6 }}>No templates saved</div>
              <div style={{ fontSize:12 }}>Configure your report settings and save as a template for recurring use</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ border:`1px solid ${T.border}`, borderRadius:10, padding:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>{tpl.name}</div>
                      <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>Created: {tpl.created}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:T.textSec, marginTop:8 }}>
                    Frameworks: {tpl.frameworks.join(', ')} | Funds: {tpl.funds.length} | Period: {tpl.period}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:10 }}>
                    <button onClick={() => loadTemplate(tpl)} style={{ flex:1, padding:'6px', fontSize:11, fontWeight:600, background:T.navyL, color:'#fff', border:'none', borderRadius:5, cursor:'pointer' }}>Load</button>
                    <button onClick={() => deleteTemplate(tpl.id)} style={{ flex:1, padding:'6px', fontSize:11, fontWeight:600, background:T.red+'20', color:T.red, border:`1px solid ${T.red}40`, borderRadius:5, cursor:'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cross Navigation */}
      <div style={{ marginTop:32, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
        <div style={{ fontSize:12, color:T.textMut, fontWeight:600, marginBottom:10 }}>NAVIGATE TO</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['Fund-of-Funds ESG','/fund-of-funds'],
            ['PE/VC Due Diligence','/pe-vc-due-diligence'],
            ['Private Credit ESG','/private-credit'],
            ['SFDR PAI Dashboard','/sfdr-pai'],
            ['TCFD Report','/tcfd-report'],
            ['Portfolio Suite','/portfolio-climate-var'],
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
