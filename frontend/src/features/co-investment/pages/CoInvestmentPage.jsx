import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie,
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const LS_KEY = 'ra_coinvest_v1';

const SEED_DATA = [
  { id:'CI001', company:'NovaBio Sciences', sector:'Biotech', gpLead:'Sequoia Capital', dealSize_mn:200, coInvest_mn:25, coInvestPct:12.5, round:'Series C', preMoney_mn:800, geography:'US', esg_score:72, impactThesis:'Novel drug delivery reducing healthcare costs', sdgs:[3,9], stage:'Evaluation', dd_complete_pct:45, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:false, governance_score:68, envRisk:'Low', socialRisk:'Medium', keyRisk:'Clinical trial failure', mitigant:'Diversified pipeline' },
  { id:'CI002', company:'EcoCharge Networks', sector:'EV Infrastructure', gpLead:'Brookfield RE', dealSize_mn:500, coInvest_mn:75, coInvestPct:15, round:'Growth', preMoney_mn:2000, geography:'Europe', esg_score:85, impactThesis:'Accelerating EV adoption through charging infrastructure', sdgs:[7,11,13], stage:'IC Review', dd_complete_pct:80, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:true, governance_score:78, envRisk:'Low', socialRisk:'Low', keyRisk:'Regulatory change', mitigant:'Multi-jurisdiction' },
  { id:'CI003', company:'AgraSmart Tech', sector:'AgriTech', gpLead:'Temasek', dealSize_mn:150, coInvest_mn:20, coInvestPct:13.3, round:'Series B', preMoney_mn:450, geography:'Asia-Pacific', esg_score:78, impactThesis:'Precision agriculture reducing water and pesticide usage by 40%', sdgs:[2,6,15], stage:'Approved', dd_complete_pct:95, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:true, governance_score:74, envRisk:'Low', socialRisk:'Low', keyRisk:'Weather dependency', mitigant:'Indoor/hybrid systems' },
  { id:'CI004', company:'PayBridge Global', sector:'FinTech', gpLead:'Accel Partners', dealSize_mn:300, coInvest_mn:40, coInvestPct:13.3, round:'Series D', preMoney_mn:1200, geography:'US', esg_score:65, impactThesis:'Financial inclusion for unbanked populations in emerging markets', sdgs:[1,8,10], stage:'Evaluation', dd_complete_pct:35, exclusionScreenPass:true, controversyFlags:1, boardSeatOffered:false, governance_score:62, envRisk:'Low', socialRisk:'Medium', keyRisk:'Regulatory compliance across jurisdictions', mitigant:'Local licensing strategy' },
  { id:'CI005', company:'AquaPure Systems', sector:'Clean Water', gpLead:'KKR Impact', dealSize_mn:250, coInvest_mn:35, coInvestPct:14, round:'Growth', preMoney_mn:900, geography:'Africa/ME', esg_score:90, impactThesis:'Desalination and water purification for water-stressed regions', sdgs:[6,3,11], stage:'IC Review', dd_complete_pct:70, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:true, governance_score:82, envRisk:'Medium', socialRisk:'Low', keyRisk:'Energy cost volatility', mitigant:'Solar-powered units' },
  { id:'CI006', company:'MedLink AI', sector:'Digital Health', gpLead:'GV (Google Ventures)', dealSize_mn:180, coInvest_mn:22, coInvestPct:12.2, round:'Series C', preMoney_mn:700, geography:'US', esg_score:76, impactThesis:'AI diagnostics reducing misdiagnosis rates by 60%', sdgs:[3,9], stage:'Approved', dd_complete_pct:90, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:false, governance_score:71, envRisk:'Low', socialRisk:'Medium', keyRisk:'Data privacy regulation', mitigant:'HIPAA/GDPR compliant architecture' },
  { id:'CI007', company:'H2 Frontier', sector:'Green Hydrogen', gpLead:'Macquarie Green', dealSize_mn:600, coInvest_mn:90, coInvestPct:15, round:'Growth', preMoney_mn:2500, geography:'Europe', esg_score:88, impactThesis:'Green hydrogen production at scale for industrial decarbonization', sdgs:[7,9,13], stage:'Evaluation', dd_complete_pct:55, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:true, governance_score:80, envRisk:'Low', socialRisk:'Low', keyRisk:'Technology scale-up', mitigant:'Proven pilot at 50MW' },
  { id:'CI008', company:'VerdeThreads', sector:'Sustainable Fashion', gpLead:'Circularity Capital', dealSize_mn:80, coInvest_mn:10, coInvestPct:12.5, round:'Series B', preMoney_mn:250, geography:'Europe', esg_score:82, impactThesis:'Circular fashion platform reducing textile waste by 70%', sdgs:[12,13,8], stage:'Declined', dd_complete_pct:60, exclusionScreenPass:true, controversyFlags:2, boardSeatOffered:false, governance_score:58, envRisk:'Low', socialRisk:'Medium', keyRisk:'Consumer adoption speed', mitigant:'B2B model reduces risk' },
  { id:'CI009', company:'LearnSphere', sector:'EdTech', gpLead:'SoftBank Vision', dealSize_mn:220, coInvest_mn:30, coInvestPct:13.6, round:'Series C', preMoney_mn:850, geography:'Asia-Pacific', esg_score:74, impactThesis:'AI-personalized education reaching 50M underserved students', sdgs:[4,10], stage:'IC Review', dd_complete_pct:65, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:false, governance_score:66, envRisk:'Low', socialRisk:'Low', keyRisk:'Unit economics at scale', mitigant:'Freemium conversion at 8%' },
  { id:'CI010', company:'CarbonVault', sector:'Carbon Capture', gpLead:'Breakthrough Energy', dealSize_mn:400, coInvest_mn:60, coInvestPct:15, round:'Series B', preMoney_mn:1500, geography:'US', esg_score:92, impactThesis:'Direct air capture storing 100K tonnes CO2/year per facility', sdgs:[13,9,7], stage:'Approved', dd_complete_pct:85, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:true, governance_score:84, envRisk:'Low', socialRisk:'Low', keyRisk:'Cost per tonne viability', mitigant:'45Q tax credits secured' },
];

const CO_INVEST_ESG_CRITERIA = {
  exclusionScreens: { weight:20, items:['Weapons','Tobacco','Thermal Coal','Gambling','Controversial Weapons'] },
  esgIntegration: { weight:30, items:['Environmental risk assessment','Social impact evaluation','Governance quality check','Controversy screening','SDG alignment'] },
  impactAlignment: { weight:25, items:['Clear impact thesis','Measurable impact KPIs','Additionality demonstrated','Impact reporting commitment'] },
  governanceRights: { weight:25, items:['Board representation','Information rights','ESG reporting covenants','Anti-dilution protection','Tag-along rights'] },
};

const GP_TRACK_RECORDS = {
  'Sequoia Capital': { fundsRaised:12, vintageRange:'2005-2023', avgIRR:28.5, avgTVPI:3.2, esgPolicy:'Integrated since 2018', priSignatory:true, esgFunds:4 },
  'Brookfield RE': { fundsRaised:8, vintageRange:'2010-2023', avgIRR:18.2, avgTVPI:2.1, esgPolicy:'Integrated since 2015', priSignatory:true, esgFunds:6 },
  'Temasek': { fundsRaised:15, vintageRange:'2000-2024', avgIRR:14.5, avgTVPI:1.9, esgPolicy:'Integrated since 2016', priSignatory:true, esgFunds:5 },
  'Accel Partners': { fundsRaised:10, vintageRange:'2008-2023', avgIRR:32.1, avgTVPI:3.8, esgPolicy:'Developing', priSignatory:false, esgFunds:2 },
  'KKR Impact': { fundsRaised:6, vintageRange:'2015-2024', avgIRR:16.8, avgTVPI:1.7, esgPolicy:'Impact-first since inception', priSignatory:true, esgFunds:6 },
  'GV (Google Ventures)': { fundsRaised:5, vintageRange:'2012-2023', avgIRR:25.4, avgTVPI:2.9, esgPolicy:'Integrated since 2020', priSignatory:true, esgFunds:3 },
  'Macquarie Green': { fundsRaised:7, vintageRange:'2014-2024', avgIRR:15.2, avgTVPI:1.8, esgPolicy:'Green-first mandate', priSignatory:true, esgFunds:7 },
  'Circularity Capital': { fundsRaised:3, vintageRange:'2018-2023', avgIRR:12.5, avgTVPI:1.4, esgPolicy:'Circular economy focus', priSignatory:true, esgFunds:3 },
  'SoftBank Vision': { fundsRaised:4, vintageRange:'2017-2024', avgIRR:8.2, avgTVPI:1.2, esgPolicy:'Developing', priSignatory:false, esgFunds:1 },
  'Breakthrough Energy': { fundsRaised:3, vintageRange:'2019-2024', avgIRR:11.8, avgTVPI:1.5, esgPolicy:'Climate-first mandate', priSignatory:true, esgFunds:3 },
};

const STAGES = ['Evaluation','IC Review','Approved','Declined'];
const SECTORS = ['Biotech','EV Infrastructure','AgriTech','FinTech','Clean Water','Digital Health','Green Hydrogen','Sustainable Fashion','EdTech','Carbon Capture'];
const GEOS = ['US','Europe','Asia-Pacific','Africa/ME','LatAm'];
const RISK_LEVELS = ['Low','Medium','High'];

const fmt = (n, d=1) => n == null ? '-' : Number(n).toFixed(d);
const fmtM = (n) => n == null ? '-' : `$${Number(n).toFixed(0)}M`;
const pct = (n) => n == null ? '-' : `${Number(n).toFixed(1)}%`;

/* ── Shared UI Components ───────────────────────────────────────── */
const Card = ({ children, style }) => (<div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, ...style }}>{children}</div>);
const Badge = ({ children, color }) => (<span style={{ display:'inline-block', padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:color+'18', color }}>{children}</span>);
const KPI = ({ label, value, sub, icon }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 18px' }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:6 }}>{icon} {label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, variant='primary', style={}, disabled=false }) => {
  const bg = variant==='primary' ? T.navy : variant==='gold' ? T.gold : variant==='danger' ? T.red : T.surfaceH;
  const fg = variant==='ghost' ? T.navy : '#fff';
  return <button onClick={onClick} disabled={disabled} style={{ padding:'7px 16px', borderRadius:6, border:'none', cursor:disabled?'not-allowed':'pointer', background:bg, color:fg, fontWeight:600, fontSize:13, fontFamily:T.font, opacity:disabled?0.5:1, ...style }}>{children}</button>;
};
const Inp = ({ label, value, onChange, type='text', placeholder='', style={} }) => (
  <div style={{ marginBottom:10, ...style }}>
    {label && <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>{label}</div>}
    <input type={type} value={value} onChange={e=>onChange(type==='number'?+e.target.value:e.target.value)} placeholder={placeholder}
      style={{ width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, boxSizing:'border-box', background:T.surface }} />
  </div>
);
const Sel = ({ label, value, onChange, options, style={} }) => (
  <div style={{ marginBottom:10, ...style }}>
    {label && <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>{label}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, background:T.surface }}>
      {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);
const SortHeader = ({ label, field, sortField, sortDir, onSort }) => (
  <th onClick={()=>onSort(field)} style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:0.5, cursor:'pointer', userSelect:'none', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap', textAlign:'left' }}>
    {label} {sortField===field ? (sortDir==='asc'?' ▲':' ▼') : ''}
  </th>
);
const TL = ({ level }) => {
  const c = level==='Low' ? T.green : level==='Medium' ? T.amber : T.red;
  return <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:c, marginRight:4 }} />;
};

const esgColor = (s) => s>=80 ? T.green : s>=60 ? T.amber : T.red;
const stageColor = (s) => s==='Approved' ? T.green : s==='IC Review' ? T.gold : s==='Evaluation' ? T.navyL : T.red;

/* ── Main Component ─────────────────────────────────────────────── */
export default function CoInvestmentPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [sortField, setSortField] = useState('esg_score');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedId, setSelectedId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [stageFilter, setStageFilter] = useState('All');
  const [minEsg, setMinEsg] = useState(0);
  const [tab, setTab] = useState('pipeline');

  const blankForm = { company:'', sector:SECTORS[0], gpLead:'', dealSize_mn:0, coInvest_mn:0, coInvestPct:0, round:'', preMoney_mn:0, geography:GEOS[0], esg_score:50, impactThesis:'', sdgs:[], stage:STAGES[0], dd_complete_pct:0, exclusionScreenPass:true, controversyFlags:0, boardSeatOffered:false, governance_score:50, envRisk:'Low', socialRisk:'Low', keyRisk:'', mitigant:'' };
  const [form, setForm] = useState({...blankForm});

  /* ── Persistence ────────────────────────────────────────────── */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY));
      if (saved && saved.length) setData(saved);
      else { setData(SEED_DATA); localStorage.setItem(LS_KEY, JSON.stringify(SEED_DATA)); }
    } catch { setData(SEED_DATA); localStorage.setItem(LS_KEY, JSON.stringify(SEED_DATA)); }
  }, []);

  const persist = useCallback((d) => { setData(d); localStorage.setItem(LS_KEY, JSON.stringify(d)); }, []);

  /* ── Sort & Filter ─────────────────────────────────────────── */
  const onSort = (f) => { if (sortField===f) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortField(f); setSortDir('desc'); } };
  const filtered = useMemo(() => {
    let r = [...data];
    if (stageFilter!=='All') r = r.filter(d=>d.stage===stageFilter);
    r = r.filter(d=>d.esg_score>=minEsg);
    r.sort((a,b)=> { const av=a[sortField], bv=b[sortField]; if (av==null) return 1; if (bv==null) return -1; return sortDir==='asc' ? (av>bv?1:-1) : (av<bv?1:-1); });
    return r;
  }, [data, stageFilter, minEsg, sortField, sortDir]);

  const selected = data.find(d=>d.id===selectedId) || data[0];
  const compareItems = data.filter(d=>compareIds.includes(d.id));

  /* ── CRUD ────────────────────────────────────────────────── */
  const handleSave = () => {
    const id = editId || ('CI' + String(Date.now()).slice(-6));
    const entry = { ...form, id };
    let next;
    if (editId) next = data.map(d=>d.id===editId ? entry : d);
    else next = [...data, entry];
    persist(next);
    setForm({...blankForm}); setEditId(null); setShowForm(false);
  };
  const handleEdit = (item) => { setForm({...item}); setEditId(item.id); setShowForm(true); };
  const handleDelete = (id) => persist(data.filter(d=>d.id!==id));
  const toggleCompare = (id) => setCompareIds(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : prev.length<3 ? [...prev,id] : prev);

  /* ── KPIs ─────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (!data.length) return {};
    const avg = (arr,f)=> arr.reduce((s,x)=>s+x[f],0)/arr.length;
    const allSdgs = new Set(data.flatMap(d=>d.sdgs));
    return {
      activeCount: data.filter(d=>d.stage!=='Declined').length,
      totalCoInvest: data.reduce((s,d)=>s+d.coInvest_mn,0),
      avgEsg: avg(data,'esg_score'),
      avgDD: avg(data,'dd_complete_pct'),
      exclusionRate: (data.filter(d=>d.exclusionScreenPass).length/data.length*100),
      avgGov: avg(data,'governance_score'),
      sdgCount: allSdgs.size,
      boardSeats: data.filter(d=>d.boardSeatOffered).length,
    };
  }, [data]);

  /* ── Radar data for selected ──────────────────────────────── */
  const radarData = useMemo(() => {
    if (!selected) return [];
    const s = selected;
    return [
      { axis:'Exclusion (20%)', value: s.exclusionScreenPass ? 95 : 20, fullMark:100 },
      { axis:'ESG Integration (30%)', value: s.esg_score, fullMark:100 },
      { axis:'Impact Alignment (25%)', value: Math.min(100, s.esg_score + (s.sdgs.length*5)), fullMark:100 },
      { axis:'Governance (25%)', value: s.governance_score, fullMark:100 },
    ];
  }, [selected]);

  /* ── SDG BarChart ─────────────────────────────────────────── */
  const sdgBar = useMemo(() => {
    const counts = {};
    data.forEach(d=> d.sdgs.forEach(s=> { counts[s]=(counts[s]||0)+1; }));
    return Object.entries(counts).map(([k,v])=>({ sdg:`SDG ${k}`, count:v })).sort((a,b)=>b.count-a.count);
  }, [data]);

  /* ── Risk Matrix ──────────────────────────────────────────── */
  const riskMatrix = useMemo(() => {
    const rMap = { Low:1, Medium:2, High:3 };
    return data.map(d=>({ name:d.company, x:rMap[d.envRisk]||1, y:rMap[d.socialRisk]||1, z:d.coInvest_mn, esg:d.esg_score }));
  }, [data]);

  /* ── Decision Framework ───────────────────────────────────── */
  const decisionFor = (item) => {
    const checks = [
      { criterion:'Exclusion Screen', pass: item.exclusionScreenPass, weight:20 },
      { criterion:'ESG Score >= 70', pass: item.esg_score>=70, weight:15 },
      { criterion:'Governance Score >= 65', pass: item.governance_score>=65, weight:15 },
      { criterion:'DD Completion >= 50%', pass: item.dd_complete_pct>=50, weight:15 },
      { criterion:'No Controversy Flags', pass: item.controversyFlags===0, weight:15 },
      { criterion:'SDG Alignment', pass: item.sdgs.length>=2, weight:10 },
      { criterion:'Board Seat Offered', pass: item.boardSeatOffered, weight:10 },
    ];
    const score = checks.reduce((s,c)=> s+(c.pass?c.weight:0), 0);
    const signal = score>=80 ? 'Green' : score>=50 ? 'Amber' : 'Red';
    return { checks, score, signal };
  };

  /* ── Exports ──────────────────────────────────────────────── */
  const exportCSV = () => {
    if (!data.length) return;
    const hdr = Object.keys(data[0]);
    const rows = data.map(d=> hdr.map(h=> Array.isArray(d[h]) ? d[h].join(';') : d[h]));
    const csv = [hdr.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='co_investment_esg.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='co_investment_esg.json'; a.click(); URL.revokeObjectURL(url);
  };
  const exportMarkdown = () => {
    let md = '# Co-Investment ESG Assessment\n\n';
    md += `| Company | Sector | GP | Co-Invest ($M) | ESG | Stage | DD% |\n|---|---|---|---|---|---|---|\n`;
    data.forEach(d=> { md += `| ${d.company} | ${d.sector} | ${d.gpLead} | ${d.coInvest_mn} | ${d.esg_score} | ${d.stage} | ${d.dd_complete_pct}% |\n`; });
    const blob = new Blob([md],{type:'text/markdown'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='co_investment_esg.md'; a.click(); URL.revokeObjectURL(url);
  };

  /* ── Empty State ──────────────────────────────────────────── */
  if (!data.length) return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:40 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
      <div style={{ fontSize:20, fontWeight:700, color:T.navy, marginBottom:8 }}>No Co-Investment Opportunities</div>
      <div style={{ fontSize:14, color:T.textSec, marginBottom:20 }}>Add your first co-investment opportunity to begin ESG assessment.</div>
      <Btn onClick={()=>setShowForm(true)}>+ Add Opportunity</Btn>
    </div>
  );

  const TABS = ['pipeline','radar','compare','risk','sdg','gp','decision'];
  const tabLabels = { pipeline:'Pipeline', radar:'ESG Radar', compare:'Compare', risk:'Risk Matrix', sdg:'SDG Alignment', gp:'GP Track Record', decision:'Decision Framework' };

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0, letterSpacing:-0.5 }}>Co-Investment ESG Assessment</h1>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Badge color={T.navy}>{data.length} Opportunities</Badge>
            <Badge color={T.sage}>ESG Scoring</Badge>
            <Badge color={T.gold}>Impact</Badge>
            <Badge color={T.navyL}>Governance</Badge>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn onClick={()=>setShowForm(true)}>+ Add Opportunity</Btn>
          <Btn variant='ghost' onClick={exportCSV}>CSV</Btn>
          <Btn variant='ghost' onClick={exportJSON}>JSON</Btn>
          <Btn variant='ghost' onClick={exportMarkdown}>MD</Btn>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:12, marginBottom:24 }}>
        <KPI label='Active Opps' value={kpis.activeCount} icon='🎯' sub='Non-declined' />
        <KPI label='Total Co-Invest' value={fmtM(kpis.totalCoInvest)} icon='💰' sub='Pipeline size' />
        <KPI label='Avg ESG Score' value={fmt(kpis.avgEsg,0)} icon='🌱' sub='/100' />
        <KPI label='Avg DD Complete' value={pct(kpis.avgDD)} icon='📋' sub='Due diligence' />
        <KPI label='Exclusion Pass' value={pct(kpis.exclusionRate)} icon='✅' sub='Screen rate' />
        <KPI label='Avg Governance' value={fmt(kpis.avgGov,0)} icon='🏛️' sub='/100' />
        <KPI label='SDG Coverage' value={`${kpis.sdgCount}/17`} icon='🎯' sub='Unique SDGs' />
        <KPI label='Board Seats' value={kpis.boardSeats} icon='💼' sub='Offered' />
      </div>

      {/* ── Tab Nav ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:`2px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', background:tab===t?T.navy:'transparent', color:tab===t?'#fff':T.textSec, border:'none', borderRadius:'6px 6px 0 0', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* ── Pipeline Table ─────────────────────────────────── */}
      {tab==='pipeline' && (
        <Card>
          <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
            <Sel label='Stage' value={stageFilter} onChange={setStageFilter} options={['All',...STAGES]} style={{ marginBottom:0, minWidth:140 }} />
            <div style={{ marginBottom:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Min ESG: {minEsg}</div>
              <input type='range' min={0} max={100} value={minEsg} onChange={e=>setMinEsg(+e.target.value)} style={{ width:160 }} />
            </div>
            <div style={{ fontSize:12, color:T.textMut, marginLeft:'auto' }}>{filtered.length} of {data.length} shown</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  <th style={{ padding:'10px 8px', width:30 }}></th>
                  <SortHeader label='Company' field='company' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='Sector' field='sector' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='GP Lead' field='gpLead' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='Co-Invest' field='coInvest_mn' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='ESG' field='esg_score' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='Governance' field='governance_score' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='DD %' field='dd_complete_pct' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label='Stage' field='stage' sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', borderBottom:`2px solid ${T.border}` }}>Risk</th>
                  <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', borderBottom:`2px solid ${T.border}` }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const dec = decisionFor(d);
                  return (
                    <tr key={d.id} onClick={()=>setSelectedId(d.id)} style={{ cursor:'pointer', background:selectedId===d.id?T.surfaceH:'transparent', borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'8px' }}>
                        <input type='checkbox' checked={compareIds.includes(d.id)} onChange={()=>toggleCompare(d.id)} onClick={e=>e.stopPropagation()} />
                      </td>
                      <td style={{ padding:'8px', fontWeight:600 }}>{d.company}</td>
                      <td style={{ padding:'8px' }}>{d.sector}</td>
                      <td style={{ padding:'8px', fontSize:12 }}>{d.gpLead}</td>
                      <td style={{ padding:'8px', fontWeight:600 }}>{fmtM(d.coInvest_mn)}</td>
                      <td style={{ padding:'8px' }}><Badge color={esgColor(d.esg_score)}>{d.esg_score}</Badge></td>
                      <td style={{ padding:'8px' }}><Badge color={esgColor(d.governance_score)}>{d.governance_score}</Badge></td>
                      <td style={{ padding:'8px' }}>
                        <div style={{ background:T.surfaceH, borderRadius:4, height:8, width:80 }}>
                          <div style={{ background:d.dd_complete_pct>=80?T.green:d.dd_complete_pct>=50?T.gold:T.amber, height:8, borderRadius:4, width:`${d.dd_complete_pct}%` }} />
                        </div>
                        <span style={{ fontSize:11, color:T.textMut }}>{d.dd_complete_pct}%</span>
                      </td>
                      <td style={{ padding:'8px' }}><Badge color={stageColor(d.stage)}>{d.stage}</Badge></td>
                      <td style={{ padding:'8px' }}><TL level={d.envRisk} /><TL level={d.socialRisk} /></td>
                      <td style={{ padding:'8px' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <Btn variant='ghost' onClick={(e)=>{e.stopPropagation(); handleEdit(d);}} style={{ padding:'4px 8px', fontSize:11 }}>Edit</Btn>
                          <Btn variant='danger' onClick={(e)=>{e.stopPropagation(); handleDelete(d.id);}} style={{ padding:'4px 8px', fontSize:11 }}>Del</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── ESG Scoring Radar ─────────────────────────────── */}
      {tab==='radar' && selected && (
        <Card>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>ESG Scoring Radar: {selected.company}</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>4-axis assessment weighted per CO_INVEST_ESG_CRITERIA</div>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {data.map(d=>(
              <button key={d.id} onClick={()=>setSelectedId(d.id)} style={{ padding:'4px 12px', borderRadius:16, border:`1px solid ${selectedId===d.id?T.navy:T.border}`, background:selectedId===d.id?T.navy:'transparent', color:selectedId===d.id?'#fff':T.text, fontSize:12, cursor:'pointer', fontFamily:T.font }}>{d.company}</button>
            ))}
          </div>
          <ResponsiveContainer width='100%' height={380}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey='axis' tick={{ fontSize:11, fill:T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:10 }} />
              <Radar name={selected.company} dataKey='value' stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:16 }}>
            {Object.entries(CO_INVEST_ESG_CRITERIA).map(([k,v])=>(
              <div key={k} style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>{k.replace(/([A-Z])/g,' $1').trim()} ({v.weight}%)</div>
                {v.items.map((item,i)=>(
                  <div key={i} style={{ fontSize:11, color:T.textSec, padding:'2px 0' }}>• {item}</div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Deal Comparison Mode ─────────────────────────── */}
      {tab==='compare' && (
        <Card>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>Deal Comparison Mode</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Select 2-3 opportunities using checkboxes in Pipeline tab. {compareItems.length} selected.</div>
          {compareItems.length<2 ? (
            <div style={{ padding:40, textAlign:'center', color:T.textMut }}>Select at least 2 opportunities from the Pipeline tab to compare.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                    <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Metric</th>
                    {compareItems.map(d=><th key={d.id} style={{ padding:10, textAlign:'center', fontWeight:700, color:T.navy }}>{d.company}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Sector','sector'], ['GP Lead','gpLead'], ['Deal Size',d=>fmtM(d.dealSize_mn)], ['Co-Invest',d=>fmtM(d.coInvest_mn)],
                    ['ESG Score','esg_score'], ['Governance','governance_score'], ['DD Complete',d=>pct(d.dd_complete_pct)],
                    ['Stage','stage'], ['Env Risk','envRisk'], ['Social Risk','socialRisk'], ['SDGs',d=>d.sdgs.map(s=>`SDG ${s}`).join(', ')],
                    ['Board Seat',d=>d.boardSeatOffered?'Yes':'No'], ['Key Risk','keyRisk'], ['Mitigant','mitigant'],
                  ].map(([label, accessor], i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surfaceH:'transparent' }}>
                      <td style={{ padding:10, fontWeight:600, fontSize:12 }}>{label}</td>
                      {compareItems.map(d=>(
                        <td key={d.id} style={{ padding:10, textAlign:'center' }}>
                          {typeof accessor==='function' ? accessor(d) : d[accessor]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Risk Matrix ───────────────────────────────────── */}
      {tab==='risk' && (
        <Card>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>Environmental vs Social Risk Matrix</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Bubble size = co-invest amount. X = Env Risk, Y = Social Risk (1=Low, 2=Medium, 3=High)</div>
          <ResponsiveContainer width='100%' height={400}>
            <ScatterChart margin={{ top:20, right:30, bottom:20, left:20 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
              <XAxis type='number' dataKey='x' domain={[0.5,3.5]} name='Env Risk' tick={{ fontSize:11 }} label={{ value:'Environmental Risk', position:'bottom', fontSize:12, fill:T.textSec }} ticks={[1,2,3]} />
              <YAxis type='number' dataKey='y' domain={[0.5,3.5]} name='Social Risk' tick={{ fontSize:11 }} label={{ value:'Social Risk', angle:-90, position:'insideLeft', fontSize:12, fill:T.textSec }} ticks={[1,2,3]} />
              <ZAxis type='number' dataKey='z' range={[100,800]} name='Co-Invest ($M)' />
              <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({payload})=>{
                if (!payload || !payload.length) return null;
                const d = payload[0].payload;
                return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:10, fontSize:12 }}>
                  <div style={{ fontWeight:700 }}>{d.name}</div>
                  <div>Env: {['','Low','Medium','High'][d.x]} | Social: {['','Low','Medium','High'][d.y]}</div>
                  <div>Co-Invest: ${d.z}M | ESG: {d.esg}</div>
                </div>;
              }} />
              <Scatter data={riskMatrix}>
                {riskMatrix.map((d,i)=><Cell key={i} fill={d.esg>=80?T.green:d.esg>=60?T.gold:T.red} fillOpacity={0.7} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── SDG Alignment ─────────────────────────────────── */}
      {tab==='sdg' && (
        <Card>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>SDG Alignment Across Pipeline</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Count of opportunities aligned per SDG</div>
          <ResponsiveContainer width='100%' height={350}>
            <BarChart data={sdgBar} margin={{ top:10, right:20, bottom:20, left:20 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
              <XAxis dataKey='sdg' tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Bar dataKey='count' fill={T.sage} radius={[4,4,0,0]} name='Opportunities' />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── GP Track Record ───────────────────────────────── */}
      {tab==='gp' && selected && (
        <Card>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>GP Track Record: {selected.gpLead}</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Historical performance and ESG integration for selected deal's GP</div>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {data.map(d=>(
              <button key={d.id} onClick={()=>setSelectedId(d.id)} style={{ padding:'4px 12px', borderRadius:16, border:`1px solid ${selectedId===d.id?T.navy:T.border}`, background:selectedId===d.id?T.navy:'transparent', color:selectedId===d.id?'#fff':T.text, fontSize:12, cursor:'pointer', fontFamily:T.font }}>{d.company} ({d.gpLead})</button>
            ))}
          </div>
          {GP_TRACK_RECORDS[selected.gpLead] ? (() => {
            const gp = GP_TRACK_RECORDS[selected.gpLead];
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Funds Raised</div>
                  <div style={{ fontSize:24, fontWeight:700, color:T.navy }}>{gp.fundsRaised}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>Vintage: {gp.vintageRange}</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Avg IRR</div>
                  <div style={{ fontSize:24, fontWeight:700, color:T.green }}>{gp.avgIRR}%</div>
                  <div style={{ fontSize:11, color:T.textSec }}>Avg TVPI: {gp.avgTVPI}x</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>ESG Policy</div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.navy, marginTop:6 }}>{gp.esgPolicy}</div>
                  <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>PRI Signatory: {gp.priSignatory ? 'Yes' : 'No'}</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>ESG-Focused Funds</div>
                  <div style={{ fontSize:24, fontWeight:700, color:T.sage }}>{gp.esgFunds}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>of {gp.fundsRaised} total</div>
                </div>
              </div>
            );
          })() : <div style={{ padding:20, color:T.textMut, textAlign:'center' }}>No GP track record data available for {selected.gpLead}.</div>}
        </Card>
      )}

      {/* ── Decision Framework ────────────────────────────── */}
      {tab==='decision' && (
        <Card>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>Co-Investment Decision Framework</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Traffic light scoring per opportunity</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {data.filter(d=>d.stage!=='Declined').map(d => {
              const dec = decisionFor(d);
              const sigColor = dec.signal==='Green'?T.green:dec.signal==='Amber'?T.amber:T.red;
              return (
                <div key={d.id} style={{ background:T.surfaceH, borderRadius:10, padding:16, borderLeft:`4px solid ${sigColor}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{d.company}</div>
                    <Badge color={sigColor}>{dec.signal} ({dec.score}%)</Badge>
                  </div>
                  {dec.checks.map((c,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, padding:'3px 0', color:c.pass?T.green:T.red }}>
                      <span>{c.pass ? '✓' : '✗'}</span>
                      <span style={{ color:T.text }}>{c.criterion} ({c.weight}%)</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Add / Edit Form Modal ─────────────────────────── */}
      {showForm && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:T.surface, borderRadius:12, padding:28, width:680, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, color:T.navy }}>{editId ? 'Edit' : 'Add'} Co-Investment Opportunity</h3>
              <button onClick={()=>{setShowForm(false);setEditId(null);setForm({...blankForm});}} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:T.textMut }}>x</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Inp label='Company Name' value={form.company} onChange={v=>setForm(f=>({...f,company:v}))} />
              <Sel label='Sector' value={form.sector} onChange={v=>setForm(f=>({...f,sector:v}))} options={SECTORS} />
              <Inp label='GP Lead' value={form.gpLead} onChange={v=>setForm(f=>({...f,gpLead:v}))} />
              <Sel label='Geography' value={form.geography} onChange={v=>setForm(f=>({...f,geography:v}))} options={GEOS} />
              <Inp label='Deal Size ($M)' value={form.dealSize_mn} onChange={v=>setForm(f=>({...f,dealSize_mn:v}))} type='number' />
              <Inp label='Co-Invest ($M)' value={form.coInvest_mn} onChange={v=>setForm(f=>({...f,coInvest_mn:v}))} type='number' />
              <Inp label='Co-Invest %' value={form.coInvestPct} onChange={v=>setForm(f=>({...f,coInvestPct:v}))} type='number' />
              <Inp label='Round' value={form.round} onChange={v=>setForm(f=>({...f,round:v}))} placeholder='e.g. Series B' />
              <Inp label='Pre-Money ($M)' value={form.preMoney_mn} onChange={v=>setForm(f=>({...f,preMoney_mn:v}))} type='number' />
              <Inp label='ESG Score (0-100)' value={form.esg_score} onChange={v=>setForm(f=>({...f,esg_score:Math.min(100,Math.max(0,v))}))} type='number' />
              <Inp label='Governance Score (0-100)' value={form.governance_score} onChange={v=>setForm(f=>({...f,governance_score:Math.min(100,Math.max(0,v))}))} type='number' />
              <Inp label='DD Completion %' value={form.dd_complete_pct} onChange={v=>setForm(f=>({...f,dd_complete_pct:Math.min(100,Math.max(0,v))}))} type='number' />
              <Sel label='Stage' value={form.stage} onChange={v=>setForm(f=>({...f,stage:v}))} options={STAGES} />
              <Sel label='Env Risk' value={form.envRisk} onChange={v=>setForm(f=>({...f,envRisk:v}))} options={RISK_LEVELS} />
              <Sel label='Social Risk' value={form.socialRisk} onChange={v=>setForm(f=>({...f,socialRisk:v}))} options={RISK_LEVELS} />
              <Inp label='SDGs (comma-separated)' value={(form.sdgs||[]).join(',')} onChange={v=>setForm(f=>({...f,sdgs:v.split(',').map(Number).filter(Boolean)}))} placeholder='e.g. 3,9,13' />
            </div>
            <Inp label='Impact Thesis' value={form.impactThesis} onChange={v=>setForm(f=>({...f,impactThesis:v}))} placeholder='Describe the impact thesis...' />
            <Inp label='Key Risk' value={form.keyRisk} onChange={v=>setForm(f=>({...f,keyRisk:v}))} />
            <Inp label='Mitigant' value={form.mitigant} onChange={v=>setForm(f=>({...f,mitigant:v}))} />
            <div style={{ display:'flex', gap:12, marginTop:4 }}>
              <label style={{ fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                <input type='checkbox' checked={form.exclusionScreenPass} onChange={e=>setForm(f=>({...f,exclusionScreenPass:e.target.checked}))} /> Exclusion Screen Pass
              </label>
              <label style={{ fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                <input type='checkbox' checked={form.boardSeatOffered} onChange={e=>setForm(f=>({...f,boardSeatOffered:e.target.checked}))} /> Board Seat Offered
              </label>
              <Inp label='Controversy Flags' value={form.controversyFlags} onChange={v=>setForm(f=>({...f,controversyFlags:v}))} type='number' style={{ marginBottom:0, width:100 }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <Btn variant='ghost' onClick={()=>{setShowForm(false);setEditId(null);setForm({...blankForm});}}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={!form.company}>{editId?'Update':'Add'} Opportunity</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Cross-Navigation ──────────────────────────────── */}
      <div style={{ marginTop:28, display:'flex', gap:10, flexWrap:'wrap' }}>
        <Btn variant='ghost' onClick={()=>navigate('/pe-vc-esg')} style={{ fontSize:12 }}>PE/VC DD</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/fund-of-funds')} style={{ fontSize:12 }}>Fund-of-Funds</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/private-credit')} style={{ fontSize:12 }}>Private Credit</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/private-markets-hub')} style={{ fontSize:12 }}>Private Markets Hub</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/portfolio')} style={{ fontSize:12 }}>Portfolio Suite</Btn>
      </div>
    </div>
  );
}
