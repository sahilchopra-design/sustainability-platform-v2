import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const LS_KEYS = {
  peVc: 'ra_pe_dd_v1',
  credit: 'ra_private_credit_v1',
  fof: 'ra_fof_portfolio_v1',
  coinvest: 'ra_coinvest_v1',
  equity: 'ra_portfolio_v1',
  fi: 'ra_fi_portfolio_v1',
  re: 'ra_re_portfolio_v1',
  infra: 'ra_infra_portfolio_v1',
};

const safeLoad = (key) => { try { const d = JSON.parse(localStorage.getItem(key)); return Array.isArray(d) ? d : []; } catch { return []; } };
const fmt = (n,d=1) => n==null?'-':Number(n).toFixed(d);
const fmtB = (n) => n==null?'-':n>=1000?`$${(n/1000).toFixed(1)}B`:`$${Number(n).toFixed(0)}M`;
const fmtM = (n) => n==null?'-':`$${Number(n).toFixed(0)}M`;
const pct = (n) => n==null?'-':`${Number(n).toFixed(1)}%`;

const PIE_COLORS = [T.navy, T.sage, T.gold, T.navyL, T.sageL, T.goldL, '#8b5cf6'];
const SFDR_COLORS = { 'Art 6': T.textMut, 'Art 8': T.gold, 'Art 9': T.sage };

/* ── Shared UI ─────────────────────────────────────────────────── */
const Card = ({ children, style }) => (<div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, ...style }}>{children}</div>);
const Badge = ({ children, color }) => (<span style={{ display:'inline-block', padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:color+'18', color }}>{children}</span>);
const KPI = ({ label, value, sub, icon }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px' }}>
    <div style={{ fontSize:10, color:T.textMut, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:5 }}>{icon} {label}</div>
    <div style={{ fontSize:20, fontWeight:700, color:T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:T.textSec, marginTop:3 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, variant='primary', style={} }) => {
  const bg = variant==='primary'?T.navy:variant==='gold'?T.gold:variant==='explore'?T.sage:T.surfaceH;
  const fg = variant==='ghost'?T.navy:'#fff';
  return <button onClick={onClick} style={{ padding:'7px 16px', borderRadius:6, border:'none', cursor:'pointer', background:bg, color:fg, fontWeight:600, fontSize:13, fontFamily:T.font, ...style }}>{children}</button>;
};
const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{title}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);
const EmptyState = ({ module }) => (
  <div style={{ padding:24, textAlign:'center', color:T.textMut, fontSize:13 }}>
    No data loaded for {module}. Navigate to the module to add data.
  </div>
);
const StatusDot = ({ ok }) => <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:ok?T.green:T.amber, marginRight:6 }} />;

/* ── Main Component ────────────────────────────────────────────── */
export default function PrivateMarketsHubPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Load all data sources ──────────────────────────────────── */
  const sources = useMemo(() => ({
    peVc: safeLoad(LS_KEYS.peVc),
    credit: safeLoad(LS_KEYS.credit),
    fof: safeLoad(LS_KEYS.fof),
    coinvest: safeLoad(LS_KEYS.coinvest),
    equity: safeLoad(LS_KEYS.equity),
    fi: safeLoad(LS_KEYS.fi),
    re: safeLoad(LS_KEYS.re),
    infra: safeLoad(LS_KEYS.infra),
  }), [refreshKey]); // eslint-disable-line

  const refresh = () => setRefreshKey(k=>k+1);

  /* ── Derived Metrics ────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const { peVc, credit, fof, coinvest, equity, fi, re, infra } = sources;
    const safe = (arr,f) => arr.length ? arr.reduce((s,x)=>s+(Number(x[f])||0),0) : 0;
    const safeAvg = (arr,f) => arr.length ? safe(arr,f)/arr.length : 0;

    // AUM from listed
    const equityAUM = safe(equity,'weight') > 0 ? safe(equity,'marketValue') || equity.length * 12 : equity.length * 12;
    const fiAUM = safe(fi,'marketValue') || fi.length * 8;
    const reAUM = safe(re,'aum_mn') || safe(re,'nav_mn') || re.length * 50;
    const infraAUM = safe(infra,'aum_mn') || safe(infra,'nav_mn') || infra.length * 40;

    // Private AUM
    const peAUM = safe(peVc,'fundSize_mn') || safe(peVc,'dealSize_mn') || peVc.length * 80;
    const creditAUM = safe(credit,'facilitySize_mn') || safe(credit,'commitment_mn') || credit.length * 60;
    const fofAUM = safe(fof,'totalNAV_mn') || safe(fof,'commitment_mn') || fof.length * 100;
    const coinvestAUM = safe(coinvest,'coInvest_mn') || coinvest.length * 30;

    const totalPrivateAUM = peAUM + creditAUM + fofAUM + coinvestAUM;
    const totalAUM = equityAUM + fiAUM + reAUM + infraAUM + totalPrivateAUM;

    // ESG scores
    const esgScores = [
      { class: 'Listed Equity', score: safeAvg(equity,'esgScore') || safeAvg(equity,'esg_score') || 68, n: equity.length },
      { class: 'Fixed Income', score: safeAvg(fi,'esgScore') || safeAvg(fi,'esg_score') || 65, n: fi.length },
      { class: 'Real Estate', score: safeAvg(re,'esgScore') || safeAvg(re,'esg_score') || 72, n: re.length },
      { class: 'Infrastructure', score: safeAvg(infra,'esgScore') || safeAvg(infra,'esg_score') || 74, n: infra.length },
      { class: 'PE/VC', score: safeAvg(peVc,'esgScore') || safeAvg(peVc,'esg_score') || 70, n: peVc.length },
      { class: 'Private Credit', score: safeAvg(credit,'esgScore') || safeAvg(credit,'esg_score') || 62, n: credit.length },
      { class: 'Co-Investment', score: safeAvg(coinvest,'esg_score') || 78, n: coinvest.length },
    ];
    const weightedEsg = esgScores.reduce((s,e)=>s+e.score*Math.max(e.n,1),0) / Math.max(esgScores.reduce((s,e)=>s+Math.max(e.n,1),0),1);

    // Carbon
    const carbonTotal = safe(equity,'carbonFootprint') + safe(fi,'carbonFootprint') + safe(re,'carbonFootprint') + safe(infra,'carbonFootprint') + safe(peVc,'carbonFootprint') + safe(credit,'carbonFootprint');
    const carbonByClass = [
      { class:'Listed Equity', intensity: safeAvg(equity,'carbonIntensity') || 145 },
      { class:'Fixed Income', intensity: safeAvg(fi,'carbonIntensity') || 120 },
      { class:'Real Estate', intensity: safeAvg(re,'carbonIntensity') || 85 },
      { class:'Infrastructure', intensity: safeAvg(infra,'carbonIntensity') || 95 },
      { class:'PE/VC', intensity: safeAvg(peVc,'carbonIntensity') || 110 },
      { class:'Private Credit', intensity: safeAvg(credit,'carbonIntensity') || 130 },
    ];

    // Co-invest specifics
    const avgDD = safeAvg(coinvest,'dd_complete_pct') || 0;
    const coinvestSDGs = new Set(coinvest.flatMap(d=>(d.sdgs||[])));

    // Performance
    const irrPE = safeAvg(peVc,'irr') || safeAvg(peVc,'netIRR') || 18.5;
    const irrCredit = safeAvg(credit,'irr') || safeAvg(credit,'yield_pct') || 9.2;
    const irrFoF = safeAvg(fof,'irr') || safeAvg(fof,'netIRR') || 14.8;
    const irrCoinvest = 22.1;
    const tvpiPE = safeAvg(peVc,'tvpi') || safeAvg(peVc,'multiple') || 1.8;
    const tvpiCredit = safeAvg(credit,'tvpi') || 1.2;
    const tvpiFoF = safeAvg(fof,'tvpi') || safeAvg(fof,'multiple') || 1.6;

    // SFDR
    const sfdrData = [
      { class:'Listed Equity', art6: Math.round(equity.length*0.3)||3, art8: Math.round(equity.length*0.5)||5, art9: Math.round(equity.length*0.2)||2 },
      { class:'PE/VC', art6: Math.round(peVc.length*0.2)||2, art8: Math.round(peVc.length*0.4)||3, art9: Math.round(peVc.length*0.4)||3 },
      { class:'Real Estate', art6: Math.round(re.length*0.1)||1, art8: Math.round(re.length*0.6)||4, art9: Math.round(re.length*0.3)||2 },
      { class:'Infrastructure', art6: Math.round(infra.length*0.1)||1, art8: Math.round(infra.length*0.3)||2, art9: Math.round(infra.length*0.6)||4 },
      { class:'Private Credit', art6: Math.round(credit.length*0.4)||3, art8: Math.round(credit.length*0.4)||3, art9: Math.round(credit.length*0.2)||1 },
    ];
    const totalHoldings = sfdrData.reduce((s,d)=>s+d.art6+d.art8+d.art9,0);
    const art89pct = sfdrData.reduce((s,d)=>s+d.art8+d.art9,0)/Math.max(totalHoldings,1)*100;

    // Allocation pie
    const allocation = [
      { name:'Listed Equity', value:equityAUM },
      { name:'Fixed Income', value:fiAUM },
      { name:'Real Estate', value:reAUM },
      { name:'Infrastructure', value:infraAUM },
      { name:'PE/VC', value:peAUM },
      { name:'Private Credit', value:creditAUM },
      { name:'Co-Investment', value:coinvestAUM },
    ].filter(d=>d.value>0);

    // J-curve
    const jCurve = [
      { year:'Y0', cashflow: -(totalPrivateAUM*0.3) },
      { year:'Y1', cashflow: -(totalPrivateAUM*0.25) },
      { year:'Y2', cashflow: -(totalPrivateAUM*0.15) },
      { year:'Y3', cashflow: totalPrivateAUM*0.05 },
      { year:'Y4', cashflow: totalPrivateAUM*0.15 },
      { year:'Y5', cashflow: totalPrivateAUM*0.25 },
      { year:'Y6', cashflow: totalPrivateAUM*0.35 },
      { year:'Y7', cashflow: totalPrivateAUM*0.40 },
      { year:'Y8', cashflow: totalPrivateAUM*0.30 },
      { year:'Y9', cashflow: totalPrivateAUM*0.20 },
      { year:'Y10', cashflow: totalPrivateAUM*0.10 },
    ].map(d=>({...d, cashflow: Math.round(d.cashflow) }));

    // Commitment / Drawn
    const totalCommitment = totalPrivateAUM * 1.4;
    const drawnPct = totalPrivateAUM / totalCommitment * 100;

    // Impact
    const jobsCreated = peVc.length * 450 + coinvest.length * 280 + fof.length * 120;
    const co2Avoided = (re.length + infra.length + coinvest.length) * 12500;

    // Performance attribution
    const perfAttribution = [
      { class:'PE/VC', irr: irrPE, tvpi: tvpiPE, weight: peAUM/Math.max(totalPrivateAUM,1)*100 },
      { class:'Private Credit', irr: irrCredit, tvpi: tvpiCredit, weight: creditAUM/Math.max(totalPrivateAUM,1)*100 },
      { class:'Fund-of-Funds', irr: irrFoF, tvpi: tvpiFoF, weight: fofAUM/Math.max(totalPrivateAUM,1)*100 },
      { class:'Co-Investment', irr: irrCoinvest, tvpi: 2.1, weight: coinvestAUM/Math.max(totalPrivateAUM,1)*100 },
    ];
    const weightedIRR = perfAttribution.reduce((s,p)=>s+p.irr*p.weight/100,0);
    const weightedTVPI = perfAttribution.reduce((s,p)=>s+p.tvpi*p.weight/100,0);

    return {
      totalAUM, totalPrivateAUM, equityAUM, fiAUM, reAUM, infraAUM, peAUM, creditAUM, fofAUM, coinvestAUM,
      peCount: peVc.length, creditCount: credit.length, fofCount: fof.length, coinvestCount: coinvest.length,
      weightedEsg, esgScores, carbonTotal, carbonByClass,
      avgDD, sdgCount: coinvestSDGs.size,
      sfdrData, art89pct,
      allocation, jCurve,
      totalCommitment, drawnPct,
      jobsCreated, co2Avoided,
      perfAttribution, weightedIRR, weightedTVPI,
      irrPE, irrCredit, irrFoF, irrCoinvest,
      tvpiPE, tvpiCredit, tvpiFoF,
    };
  }, [sources]);

  /* ── Module status cards data ────────────────────────────── */
  const modules = [
    { key:'peVc', title:'PE/VC Due Diligence', route:'/pe-vc-esg', count:sources.peVc.length, metric:`${sources.peVc.length} deals`, metricLabel:'Active Deals', color:T.navy },
    { key:'credit', title:'Private Credit', route:'/private-credit', count:sources.credit.length, metric:`${sources.credit.length} facilities`, metricLabel:'Credit Facilities', color:T.sage },
    { key:'fof', title:'Fund-of-Funds', route:'/fund-of-funds', count:sources.fof.length, metric:`${sources.fof.length} funds`, metricLabel:'Fund Holdings', color:T.gold },
    { key:'coinvest', title:'Co-Investment', route:'/co-investment', count:sources.coinvest.length, metric:`${sources.coinvest.length} opportunities`, metricLabel:'Pipeline', color:T.navyL },
    { key:'lp', title:'LP Reporting', route:'/lp-reporting', count:sources.peVc.length+sources.fof.length, metric:'Consolidated', metricLabel:'Reporting Status', color:T.sageL },
  ];

  /* ── LP Reporting status ────────────────────────────────── */
  const lpStatus = useMemo(() => {
    const items = [];
    sources.peVc.forEach((d,i)=> items.push({ name: d.company||d.fundName||`PE Deal ${i+1}`, type:'PE/VC', submitted: i%3!==2, dueDate:'2026-03-31' }));
    sources.fof.forEach((d,i)=> items.push({ name: d.fundName||d.name||`FoF Fund ${i+1}`, type:'FoF', submitted: i%4!==3, dueDate:'2026-03-31' }));
    sources.credit.forEach((d,i)=> items.push({ name: d.company||d.borrower||`Credit ${i+1}`, type:'Credit', submitted: i%2===0, dueDate:'2026-03-31' }));
    if (!items.length) {
      items.push({ name:'Sample PE Fund I', type:'PE/VC', submitted:true, dueDate:'2026-03-31' });
      items.push({ name:'Sample Credit Fund', type:'Credit', submitted:false, dueDate:'2026-03-31' });
      items.push({ name:'Sample FoF Vehicle', type:'FoF', submitted:true, dueDate:'2026-03-31' });
    }
    return items;
  }, [sources]);

  /* ── Regulatory compliance ──────────────────────────────── */
  const regulatory = [
    { framework:'SFDR', status:'Compliant', coverage:pct(metrics.art89pct), detail:'Art 8+9 classification across holdings' },
    { framework:'EDCI', status: sources.peVc.length>0?'In Progress':'Not Started', coverage:`${sources.peVc.length} funds`, detail:'ESG Data Convergence Initiative reporting' },
    { framework:'PRI', status:'Compliant', coverage:'Annual', detail:'Principles for Responsible Investment signatory reporting' },
    { framework:'TCFD', status:'Compliant', coverage:'All assets', detail:'Task Force on Climate-related Financial Disclosures' },
    { framework:'EU Taxonomy', status:'In Progress', coverage:'65%', detail:'Taxonomy alignment assessment ongoing' },
  ];

  /* ── Exports ────────────────────────────────────────────── */
  const exportCSV = () => {
    let csv = 'Asset Class,AUM ($M),ESG Score,Carbon Intensity,SFDR Art 8+9 %\n';
    metrics.esgScores.forEach(e => {
      const alloc = metrics.allocation.find(a=>a.name===e.class);
      csv += `${e.class},${alloc?alloc.value:0},${fmt(e.score,0)},${metrics.carbonByClass.find(c=>c.class===e.class)?.intensity||'-'},${pct(metrics.art89pct)}\n`;
    });
    const blob = new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='private_markets_hub.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = () => {
    const out = { summary: metrics, modules: Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,{count:v.length}])) };
    const blob = new Blob([JSON.stringify(out,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='private_markets_hub.json'; a.click(); URL.revokeObjectURL(url);
  };
  const exportMarkdown = () => {
    let md = '# Private Markets Intelligence Dashboard\n\n';
    md += `Total AUM: ${fmtB(metrics.totalAUM)} | Private: ${fmtB(metrics.totalPrivateAUM)} | Weighted ESG: ${fmt(metrics.weightedEsg,0)} | Art 8+9: ${pct(metrics.art89pct)}\n\n`;
    md += '## Asset Allocation\n| Class | AUM |\n|---|---|\n';
    metrics.allocation.forEach(a=> { md += `| ${a.name} | ${fmtB(a.value)} |\n`; });
    const blob = new Blob([md],{type:'text/markdown'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='private_markets_hub.md'; a.click(); URL.revokeObjectURL(url);
  };

  const TABS = ['overview','allocation','esg','carbon','jcurve','sfdr','lp','regulatory','performance'];
  const tabLabels = { overview:'Overview', allocation:'Allocation', esg:'ESG Comparison', carbon:'Carbon', jcurve:'J-Curve', sfdr:'SFDR', lp:'LP Reporting', regulatory:'Regulatory', performance:'Performance' };

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0, letterSpacing:-0.5 }}>Private Markets Intelligence Dashboard</h1>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Badge color={T.navy}>Hub</Badge>
            <Badge color={T.sage}>PE/VC</Badge>
            <Badge color={T.gold}>Credit</Badge>
            <Badge color={T.navyL}>FoF</Badge>
            <Badge color={T.sageL}>Co-Invest</Badge>
            <Badge color={T.textSec}>Multi-Asset</Badge>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant='ghost' onClick={refresh} style={{ fontSize:12 }}>Refresh Data</Btn>
          <Btn variant='ghost' onClick={exportCSV}>CSV</Btn>
          <Btn variant='ghost' onClick={exportJSON}>JSON</Btn>
          <Btn variant='ghost' onClick={exportMarkdown}>MD</Btn>
        </div>
      </div>

      {/* ── Module Status Cards ────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {modules.map(m => (
          <div key={m.key} onClick={()=>navigate(m.route)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, cursor:'pointer', borderTop:`3px solid ${m.color}`, transition:'box-shadow 0.15s', ':hover':{ boxShadow:'0 2px 8px rgba(0,0,0,0.08)' } }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{m.title}</div>
              <StatusDot ok={m.count>0} />
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:m.color }}>{m.metric}</div>
            <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{m.metricLabel}</div>
            <div style={{ fontSize:12, fontWeight:600, color:m.color, marginTop:8, cursor:'pointer' }}>Explore &rarr;</div>
          </div>
        ))}
      </div>

      {/* ── 16 KPI Cards (2 rows of 8) ─────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:10, marginBottom:12 }}>
        <KPI label='Total AUM' value={fmtB(metrics.totalAUM)} icon='💰' sub='All assets' />
        <KPI label='PE Deals' value={metrics.peCount} icon='🏢' sub='Active' />
        <KPI label='Credit Facilities' value={metrics.creditCount} icon='🏦' sub='Active' />
        <KPI label='FoF Funds' value={metrics.fofCount} icon='📊' sub='Holdings' />
        <KPI label='Co-Invest Pipeline' value={metrics.coinvestCount} icon='🤝' sub='Opportunities' />
        <KPI label='Weighted ESG' value={fmt(metrics.weightedEsg,0)} icon='🌱' sub='/100' />
        <KPI label='Carbon Footprint' value={metrics.carbonTotal>0?`${Math.round(metrics.carbonTotal)} tCO2e`:'N/A'} icon='🌍' sub='Total' />
        <KPI label='SFDR Art 8+9' value={pct(metrics.art89pct)} icon='📋' sub='Coverage' />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:10, marginBottom:24 }}>
        <KPI label='Weighted IRR' value={pct(metrics.weightedIRR)} icon='📈' sub='Private mkts' />
        <KPI label='Weighted TVPI' value={`${fmt(metrics.weightedTVPI,2)}x`} icon='🔄' sub='Private mkts' />
        <KPI label='Total Commitment' value={fmtB(metrics.totalCommitment)} icon='📝' sub='All private' />
        <KPI label='Drawn %' value={pct(metrics.drawnPct)} icon='💸' sub='Capital called' />
        <KPI label='Jobs Created' value={metrics.jobsCreated.toLocaleString()} icon='👥' sub='Impact' />
        <KPI label='CO2 Avoided' value={`${(metrics.co2Avoided/1000).toFixed(0)}K tCO2e`} icon='🌿' sub='Impact' />
        <KPI label='SDG Coverage' value={`${metrics.sdgCount}/17`} icon='🎯' sub='Co-invest' />
        <KPI label='DD Completion' value={pct(metrics.avgDD)} icon='✅' sub='Avg co-invest' />
      </div>

      {/* ── Tab Nav ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:`2px solid ${T.border}`, paddingBottom:0, flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 14px', background:tab===t?T.navy:'transparent', color:tab===t?'#fff':T.textSec, border:'none', borderRadius:'6px 6px 0 0', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:T.font }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* ── Overview: Quick Actions ─────────────────────────── */}
      {tab==='overview' && (
        <>
          <SectionTitle title='Quick Actions' sub='Navigate to sub-modules' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
            {[
              { label:'PE/VC Due Diligence', route:'/pe-vc-esg', desc:'ESG screening for PE/VC deals', icon:'🏢' },
              { label:'Private Credit', route:'/private-credit', desc:'Credit facility ESG monitoring', icon:'🏦' },
              { label:'Fund-of-Funds', route:'/fund-of-funds', desc:'FoF portfolio & GP assessment', icon:'📊' },
              { label:'Co-Investment', route:'/co-investment', desc:'Co-invest ESG assessment', icon:'🤝' },
              { label:'LP Reporting', route:'/lp-reporting', desc:'Consolidated LP reports', icon:'📋' },
            ].map(q=>(
              <Card key={q.label} style={{ cursor:'pointer', textAlign:'center', padding:20 }}>
                <div onClick={()=>navigate(q.route)}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{q.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>{q.label}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>{q.desc}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Combined Carbon Footprint Overview */}
          <SectionTitle title='Combined Portfolio Carbon Footprint' sub='Total carbon exposure across listed and private assets' />
          <Card style={{ marginBottom:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
              {[
                { label:'Listed Assets', value: `${Math.round((metrics.equityAUM+metrics.fiAUM)*0.015)} tCO2e`, sub:'Equity + FI' },
                { label:'Real Assets', value: `${Math.round((metrics.reAUM+metrics.infraAUM)*0.008)} tCO2e`, sub:'RE + Infra' },
                { label:'Private Markets', value: `${Math.round(metrics.totalPrivateAUM*0.012)} tCO2e`, sub:'PE + Credit + FoF + Co-Invest' },
                { label:'Total Portfolio', value: `${Math.round(metrics.totalAUM*0.012)} tCO2e`, sub:'All asset classes' },
              ].map((c,i)=>(
                <div key={i} style={{ background:T.surfaceH, borderRadius:8, padding:16, textAlign:'center' }}>
                  <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>{c.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:T.navy, margin:'8px 0' }}>{c.value}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── Multi-Asset Allocation PieChart ─────────────────── */}
      {tab==='allocation' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='Multi-Asset Class Allocation' sub='AUM distribution across all asset classes' />
          {metrics.allocation.length===0 ? <EmptyState module='any asset class' /> : (
            <ResponsiveContainer width='100%' height={400}>
              <PieChart>
                <Pie data={metrics.allocation} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={150} innerRadius={70} paddingAngle={2} label={({name,value})=>`${name}: ${fmtB(value)}`} labelLine={{ stroke:T.textMut }} >
                  {metrics.allocation.map((d,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v)=>fmtB(v)} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* ── Cross-Asset ESG Comparison ──────────────────────── */}
      {tab==='esg' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='Cross-Asset ESG Comparison' sub='Average ESG score by asset class' />
          <ResponsiveContainer width='100%' height={380}>
            <BarChart data={metrics.esgScores} margin={{ top:10, right:20, bottom:20, left:20 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
              <XAxis dataKey='class' tick={{ fontSize:11 }} />
              <YAxis domain={[0,100]} tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Bar dataKey='score' name='ESG Score' radius={[4,4,0,0]}>
                {metrics.esgScores.map((d,i)=><Cell key={i} fill={d.score>=75?T.green:d.score>=60?T.gold:T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── Cross-Asset Carbon Intensity ────────────────────── */}
      {tab==='carbon' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='Cross-Asset Carbon Intensity' sub='tCO2e per $M invested by asset class' />
          <ResponsiveContainer width='100%' height={380}>
            <BarChart data={metrics.carbonByClass} margin={{ top:10, right:20, bottom:20, left:20 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
              <XAxis dataKey='class' tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} formatter={(v)=>`${v} tCO2e/$M`} />
              <Bar dataKey='intensity' name='Carbon Intensity' fill={T.navy} radius={[4,4,0,0]}>
                {metrics.carbonByClass.map((d,i)=><Cell key={i} fill={d.intensity<=100?T.green:d.intensity<=130?T.gold:T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── J-Curve Summary ────────────────────────────────── */}
      {tab==='jcurve' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='Aggregate J-Curve' sub='Private market cash flow projection over fund life' />
          <ResponsiveContainer width='100%' height={380}>
            <AreaChart data={metrics.jCurve} margin={{ top:10, right:20, bottom:20, left:40 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
              <XAxis dataKey='year' tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} tickFormatter={v=>fmtM(v)} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} formatter={v=>fmtM(v)} />
              <defs>
                <linearGradient id='jGrad' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={T.sage} stopOpacity={0.3} />
                  <stop offset='95%' stopColor={T.sage} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area type='monotone' dataKey='cashflow' stroke={T.sage} fill='url(#jGrad)' strokeWidth={2} name='Net Cash Flow' />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── SFDR Classification ─────────────────────────────── */}
      {tab==='sfdr' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='SFDR Classification Across All Assets' sub='Article 6 / 8 / 9 distribution by asset class' />
          <ResponsiveContainer width='100%' height={380}>
            <BarChart data={metrics.sfdrData} margin={{ top:10, right:20, bottom:20, left:20 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
              <XAxis dataKey='class' tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Bar dataKey='art6' name='Art 6' stackId='a' fill={T.textMut} radius={[0,0,0,0]} />
              <Bar dataKey='art8' name='Art 8' stackId='a' fill={T.gold} />
              <Bar dataKey='art9' name='Art 9' stackId='a' fill={T.sage} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── LP Reporting Status ─────────────────────────────── */}
      {tab==='lp' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='LP Reporting Status' sub='Fund data submission tracking' />
          <div style={{ display:'flex', gap:16, marginBottom:16 }}>
            <div style={{ background:T.green+'15', borderRadius:8, padding:12, flex:1, textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:T.green }}>{lpStatus.filter(l=>l.submitted).length}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Submitted</div>
            </div>
            <div style={{ background:T.amber+'15', borderRadius:8, padding:12, flex:1, textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:T.amber }}>{lpStatus.filter(l=>!l.submitted).length}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Pending</div>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Fund / Entity</th>
                  <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Type</th>
                  <th style={{ padding:10, textAlign:'center', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Status</th>
                  <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {lpStatus.map((l,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surfaceH:'transparent' }}>
                    <td style={{ padding:10, fontWeight:600 }}>{l.name}</td>
                    <td style={{ padding:10 }}><Badge color={T.navyL}>{l.type}</Badge></td>
                    <td style={{ padding:10, textAlign:'center' }}>
                      <Badge color={l.submitted?T.green:T.amber}>{l.submitted?'Submitted':'Pending'}</Badge>
                    </td>
                    <td style={{ padding:10, fontSize:12, color:T.textSec }}>{l.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Regulatory Compliance ───────────────────────────── */}
      {tab==='regulatory' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='Regulatory Compliance Summary' sub='SFDR, EDCI, PRI reporting status across all private holdings' />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Framework</th>
                  <th style={{ padding:10, textAlign:'center', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Status</th>
                  <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Coverage</th>
                  <th style={{ padding:10, textAlign:'left', fontWeight:700, color:T.textSec, fontSize:11, textTransform:'uppercase' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {regulatory.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surfaceH:'transparent' }}>
                    <td style={{ padding:10, fontWeight:700 }}>{r.framework}</td>
                    <td style={{ padding:10, textAlign:'center' }}>
                      <Badge color={r.status==='Compliant'?T.green:r.status==='In Progress'?T.amber:T.red}>{r.status}</Badge>
                    </td>
                    <td style={{ padding:10 }}>{r.coverage}</td>
                    <td style={{ padding:10, fontSize:12, color:T.textSec }}>{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Performance Attribution ─────────────────────────── */}
      {tab==='performance' && (
        <Card style={{ marginBottom:24 }}>
          <SectionTitle title='Performance Attribution by Asset Class' sub='IRR and TVPI contribution from private market investments' />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>IRR by Asset Class</div>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={metrics.perfAttribution} margin={{ top:10, right:20, bottom:20, left:20 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
                  <XAxis dataKey='class' tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`${v}%`} />
                  <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} formatter={v=>`${fmt(v,1)}%`} />
                  <Bar dataKey='irr' name='Net IRR' fill={T.sage} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>TVPI by Asset Class</div>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={metrics.perfAttribution} margin={{ top:10, right:20, bottom:20, left:20 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke={T.border} />
                  <XAxis dataKey='class' tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`${v}x`} />
                  <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} formatter={v=>`${fmt(v,2)}x`} />
                  <Bar dataKey='tvpi' name='TVPI' fill={T.gold} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:20 }}>
            {metrics.perfAttribution.map(p=>(
              <div key={p.class} style={{ background:T.surfaceH, borderRadius:8, padding:14, textAlign:'center' }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{p.class}</div>
                <div style={{ fontSize:18, fontWeight:700, color:T.sage, marginTop:4 }}>{fmt(p.irr,1)}%</div>
                <div style={{ fontSize:12, color:T.textSec }}>TVPI: {fmt(p.tvpi,2)}x | Weight: {fmt(p.weight,0)}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Allocation Detail Table ──────────────────────── */}
      {tab==='allocation' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='Asset Class Breakdown' sub='Detailed allocation metrics per asset class' />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Asset Class','AUM ($M)','% of Total','Holdings','Avg ESG','Carbon Int.','Status'].map(h=>(
                    <th key={h} style={{ padding:'10px 8px', textAlign:'left', fontWeight:700, color:T.textSec, fontSize:10, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name:'Listed Equity', aum:metrics.equityAUM, count:sources.equity.length, esg:metrics.esgScores.find(e=>e.class==='Listed Equity')?.score||0, carbon:145 },
                  { name:'Fixed Income', aum:metrics.fiAUM, count:sources.fi.length, esg:metrics.esgScores.find(e=>e.class==='Fixed Income')?.score||0, carbon:120 },
                  { name:'Real Estate', aum:metrics.reAUM, count:sources.re.length, esg:metrics.esgScores.find(e=>e.class==='Real Estate')?.score||0, carbon:85 },
                  { name:'Infrastructure', aum:metrics.infraAUM, count:sources.infra.length, esg:metrics.esgScores.find(e=>e.class==='Infrastructure')?.score||0, carbon:95 },
                  { name:'PE/VC', aum:metrics.peAUM, count:sources.peVc.length, esg:metrics.esgScores.find(e=>e.class==='PE/VC')?.score||0, carbon:110 },
                  { name:'Private Credit', aum:metrics.creditAUM, count:sources.credit.length, esg:metrics.esgScores.find(e=>e.class==='Private Credit')?.score||0, carbon:130 },
                  { name:'Co-Investment', aum:metrics.coinvestAUM, count:sources.coinvest.length, esg:metrics.esgScores.find(e=>e.class==='Co-Investment')?.score||0, carbon:75 },
                ].map((row,i) => (
                  <tr key={row.name} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surfaceH:'transparent' }}>
                    <td style={{ padding:'10px 8px', fontWeight:600 }}>{row.name}</td>
                    <td style={{ padding:'10px 8px', fontWeight:600 }}>{fmtB(row.aum)}</td>
                    <td style={{ padding:'10px 8px' }}>{pct(metrics.totalAUM>0?row.aum/metrics.totalAUM*100:0)}</td>
                    <td style={{ padding:'10px 8px' }}>{row.count}</td>
                    <td style={{ padding:'10px 8px' }}><Badge color={row.esg>=75?T.green:row.esg>=60?T.gold:T.red}>{fmt(row.esg,0)}</Badge></td>
                    <td style={{ padding:'10px 8px', fontSize:11 }}>{row.carbon} tCO2e/$M</td>
                    <td style={{ padding:'10px 8px' }}><StatusDot ok={row.count>0} />{row.count>0?'Active':'No Data'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── ESG Score Distribution Detail ─────────────────── */}
      {tab==='esg' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='ESG Score Distribution by Category' sub='Environmental, Social, and Governance breakdown per asset class' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {metrics.esgScores.map(e => (
              <div key={e.class} style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{e.class}</div>
                  <Badge color={e.score>=75?T.green:e.score>=60?T.gold:T.red}>{fmt(e.score,0)}</Badge>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{e.n} holdings</div>
                {['Environmental','Social','Governance'].map((pillar,pi) => {
                  const pScore = Math.round(e.score + (pi-1)*5 + Math.sin(e.score*pi)*3);
                  const clampedScore = Math.min(100, Math.max(0, pScore));
                  return (
                    <div key={pillar} style={{ marginBottom:4 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                        <span style={{ color:T.textSec }}>{pillar}</span>
                        <span style={{ fontWeight:600 }}>{clampedScore}</span>
                      </div>
                      <div style={{ background:T.surface, borderRadius:3, height:6, marginTop:2 }}>
                        <div style={{ background:clampedScore>=75?T.green:clampedScore>=60?T.gold:T.red, height:6, borderRadius:3, width:`${clampedScore}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Carbon Footprint Breakdown ────────────────────── */}
      {tab==='carbon' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='Portfolio Carbon Attribution' sub='Contribution to total portfolio carbon by asset class' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { label:'Listed Portfolio', items:[{ name:'Equity', intensity:145, aum:metrics.equityAUM },{ name:'Fixed Income', intensity:120, aum:metrics.fiAUM }] },
              { label:'Real Assets', items:[{ name:'Real Estate', intensity:85, aum:metrics.reAUM },{ name:'Infrastructure', intensity:95, aum:metrics.infraAUM }] },
              { label:'Private Markets', items:[{ name:'PE/VC', intensity:110, aum:metrics.peAUM },{ name:'Credit', intensity:130, aum:metrics.creditAUM },{ name:'Co-Invest', intensity:75, aum:metrics.coinvestAUM }] },
            ].map(group => (
              <div key={group.label} style={{ background:T.surfaceH, borderRadius:8, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>{group.label}</div>
                {group.items.map(item => {
                  const footprint = Math.round(item.intensity * item.aum / 1000);
                  return (
                    <div key={item.name} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <span>{item.name}</span>
                        <span style={{ fontWeight:600 }}>{footprint > 0 ? `${footprint} tCO2e` : 'N/A'}</span>
                      </div>
                      <div style={{ fontSize:11, color:T.textSec }}>Intensity: {item.intensity} tCO2e/$M | AUM: {fmtB(item.aum)}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── J-Curve Cash Flow Detail Table ────────────────── */}
      {tab==='jcurve' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='Cash Flow Projection Detail' sub='Year-by-year private markets cash flows' />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Year','Net Cash Flow','Cumulative','Direction','% of Total'].map(h=>(
                    <th key={h} style={{ padding:'8px', textAlign:'left', fontWeight:700, color:T.textSec, fontSize:10, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.jCurve.reduce((acc, d, i) => {
                  const cum = (acc.length > 0 ? acc[acc.length-1].cum : 0) + d.cashflow;
                  acc.push({ ...d, cum, idx: i });
                  return acc;
                }, []).map((d, i) => (
                  <tr key={d.year} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surfaceH:'transparent' }}>
                    <td style={{ padding:'8px', fontWeight:600 }}>{d.year}</td>
                    <td style={{ padding:'8px', color:d.cashflow>=0?T.green:T.red, fontWeight:600 }}>{fmtM(d.cashflow)}</td>
                    <td style={{ padding:'8px', color:d.cum>=0?T.green:T.red }}>{fmtM(d.cum)}</td>
                    <td style={{ padding:'8px' }}><Badge color={d.cashflow>=0?T.green:T.red}>{d.cashflow>=0?'Distribution':'Capital Call'}</Badge></td>
                    <td style={{ padding:'8px', fontSize:11 }}>{metrics.totalPrivateAUM>0?pct(Math.abs(d.cashflow)/metrics.totalPrivateAUM*100):'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── SFDR Detail Metrics ───────────────────────────── */}
      {tab==='sfdr' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='SFDR Compliance Metrics' sub='Detailed Art 6/8/9 breakdown with PAI indicators' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:16 }}>
            <div style={{ background:T.textMut+'15', borderRadius:8, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Article 6</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.textMut }}>{metrics.sfdrData.reduce((s,d)=>s+d.art6,0)}</div>
              <div style={{ fontSize:11, color:T.textSec }}>No sustainability objective</div>
            </div>
            <div style={{ background:T.gold+'15', borderRadius:8, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.gold, textTransform:'uppercase', fontWeight:600 }}>Article 8</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.gold }}>{metrics.sfdrData.reduce((s,d)=>s+d.art8,0)}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Promotes E/S characteristics</div>
            </div>
            <div style={{ background:T.sage+'15', borderRadius:8, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.sage, textTransform:'uppercase', fontWeight:600 }}>Article 9</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.sage }}>{metrics.sfdrData.reduce((s,d)=>s+d.art9,0)}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Sustainable investment objective</div>
            </div>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Principal Adverse Impact (PAI) Indicators</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {[
              { indicator:'GHG Emissions (Scope 1+2)', value:'42,150 tCO2e', trend:'down' },
              { indicator:'Carbon Footprint', value:'128 tCO2e/$M', trend:'down' },
              { indicator:'GHG Intensity of Investees', value:'215 tCO2e/$M rev', trend:'stable' },
              { indicator:'Exposure to Fossil Fuels', value:'8.2%', trend:'down' },
              { indicator:'Non-renewable Energy Share', value:'34%', trend:'down' },
              { indicator:'Energy Intensity (GWh/$M)', value:'0.42', trend:'stable' },
              { indicator:'Biodiversity-sensitive Areas', value:'2 holdings', trend:'stable' },
              { indicator:'Water Emissions', value:'Low', trend:'stable' },
              { indicator:'Hazardous Waste Ratio', value:'0.8%', trend:'down' },
              { indicator:'UNGC/OECD Violations', value:'0', trend:'stable' },
              { indicator:'Gender Pay Gap', value:'12%', trend:'down' },
              { indicator:'Board Gender Diversity', value:'38%', trend:'up' },
            ].map((pai,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:i%2===0?T.surfaceH:'transparent', borderRadius:4, fontSize:12 }}>
                <span style={{ color:T.text }}>{pai.indicator}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:600, color:T.navy }}>{pai.value}</span>
                  <span style={{ fontSize:10, color:pai.trend==='down'?T.green:pai.trend==='up'?T.sage:T.textMut }}>
                    {pai.trend==='down'?'▼':pai.trend==='up'?'▲':'─'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Performance Waterfall Detail ──────────────────── */}
      {tab==='performance' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='Performance Contribution Waterfall' sub='How each private market segment contributes to total returns' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Return Attribution</div>
              {metrics.perfAttribution.map(p => (
                <div key={p.class} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ fontWeight:600 }}>{p.class}</span>
                    <span>{fmt(p.irr*p.weight/100,2)}% contribution</span>
                  </div>
                  <div style={{ background:T.surfaceH, borderRadius:4, height:10, overflow:'hidden' }}>
                    <div style={{ background:T.sage, height:'100%', borderRadius:4, width:`${p.weight}%`, transition:'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>Weight: {fmt(p.weight,0)}% | IRR: {fmt(p.irr,1)}% | TVPI: {fmt(p.tvpi,2)}x</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Capital Deployment Summary</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Total Commitment</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{fmtB(metrics.totalCommitment)}</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Capital Drawn</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.sage }}>{fmtB(metrics.totalPrivateAUM)}</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Unfunded</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.gold }}>{fmtB(metrics.totalCommitment - metrics.totalPrivateAUM)}</div>
                </div>
                <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase', fontWeight:600 }}>Draw Rate</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{pct(metrics.drawnPct)}</div>
                </div>
              </div>
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4 }}>Capital Deployment Progress</div>
                <div style={{ background:T.surfaceH, borderRadius:6, height:16, overflow:'hidden' }}>
                  <div style={{ background:T.sage, height:'100%', borderRadius:6, width:`${Math.min(100,metrics.drawnPct)}%` }} />
                </div>
                <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{pct(metrics.drawnPct)} of total commitment deployed</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Data Source Health Monitor ─────────────────────── */}
      {tab==='overview' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='Data Source Health Monitor' sub='Real-time status of all connected localStorage data sources' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {Object.entries(LS_KEYS).map(([key, lsKey]) => {
              const d = sources[key];
              const labels = { peVc:'PE/VC DD', credit:'Private Credit', fof:'Fund-of-Funds', coinvest:'Co-Investment', equity:'Listed Equity', fi:'Fixed Income', re:'Real Estate', infra:'Infrastructure' };
              return (
                <div key={key} style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{labels[key]||key}</div>
                    <StatusDot ok={d.length>0} />
                  </div>
                  <div style={{ fontSize:18, fontWeight:700, color:d.length>0?T.sage:T.textMut }}>{d.length}</div>
                  <div style={{ fontSize:10, color:T.textSec }}>Key: {lsKey}</div>
                  <div style={{ fontSize:10, color:d.length>0?T.green:T.amber, marginTop:2 }}>{d.length>0?'Connected':'No Data'}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Impact Summary Panel ──────────────────────────── */}
      {tab==='overview' && (
        <Card style={{ marginTop:20 }}>
          <SectionTitle title='Impact Summary' sub='Aggregate impact metrics across private market investments' />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            <div style={{ background:T.sage+'12', borderRadius:8, padding:16, textAlign:'center', borderLeft:`3px solid ${T.sage}` }}>
              <div style={{ fontSize:11, color:T.sage, textTransform:'uppercase', fontWeight:600 }}>Jobs Created</div>
              <div style={{ fontSize:24, fontWeight:700, color:T.navy, margin:'8px 0' }}>{metrics.jobsCreated.toLocaleString()}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Across PE, Co-Invest & FoF</div>
            </div>
            <div style={{ background:T.green+'12', borderRadius:8, padding:16, textAlign:'center', borderLeft:`3px solid ${T.green}` }}>
              <div style={{ fontSize:11, color:T.green, textTransform:'uppercase', fontWeight:600 }}>CO2 Avoided</div>
              <div style={{ fontSize:24, fontWeight:700, color:T.navy, margin:'8px 0' }}>{(metrics.co2Avoided/1000).toFixed(0)}K tCO2e</div>
              <div style={{ fontSize:11, color:T.textSec }}>RE + Infra + Co-Invest</div>
            </div>
            <div style={{ background:T.gold+'12', borderRadius:8, padding:16, textAlign:'center', borderLeft:`3px solid ${T.gold}` }}>
              <div style={{ fontSize:11, color:T.gold, textTransform:'uppercase', fontWeight:600 }}>SDGs Addressed</div>
              <div style={{ fontSize:24, fontWeight:700, color:T.navy, margin:'8px 0' }}>{metrics.sdgCount}/17</div>
              <div style={{ fontSize:11, color:T.textSec }}>From co-investment pipeline</div>
            </div>
            <div style={{ background:T.navyL+'12', borderRadius:8, padding:16, textAlign:'center', borderLeft:`3px solid ${T.navyL}` }}>
              <div style={{ fontSize:11, color:T.navyL, textTransform:'uppercase', fontWeight:600 }}>Renewable Energy</div>
              <div style={{ fontSize:24, fontWeight:700, color:T.navy, margin:'8px 0' }}>1.2 GW</div>
              <div style={{ fontSize:11, color:T.textSec }}>Clean capacity financed</div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Cross-Navigation ──────────────────────────────── */}
      <div style={{ marginTop:28, display:'flex', gap:10, flexWrap:'wrap' }}>
        <Btn variant='ghost' onClick={()=>navigate('/pe-vc-esg')} style={{ fontSize:12 }}>PE/VC DD</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/private-credit')} style={{ fontSize:12 }}>Private Credit</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/fund-of-funds')} style={{ fontSize:12 }}>Fund-of-Funds</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/co-investment')} style={{ fontSize:12 }}>Co-Investment</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/lp-reporting')} style={{ fontSize:12 }}>LP Reporting</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/portfolio')} style={{ fontSize:12 }}>Portfolio Suite</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/real-estate')} style={{ fontSize:12 }}>RE Dashboard</Btn>
        <Btn variant='ghost' onClick={()=>navigate('/infrastructure-dd')} style={{ fontSize:12 }}>Infra DD</Btn>
      </div>
    </div>
  );
}
