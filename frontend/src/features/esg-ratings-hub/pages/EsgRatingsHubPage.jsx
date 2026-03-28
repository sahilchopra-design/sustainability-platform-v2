import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// ── Providers & Companies ───────────────────────────────────────────────────
const PROVIDERS = ['MSCI','S&P Global','Sustainalytics','ISS ESG','CDP','Refinitiv'];
const RATING_SCALE = ['AAA','AA','A','BBB','BB','B','CCC'];
const SECTORS = ['Technology','Financials','Healthcare','Energy','Industrials','Consumer','Utilities','Materials'];

const COMPANIES = Array.from({length:50},(_,i)=>{
  const names=['Apple','Microsoft','JPMorgan','Unilever','Shell','Siemens','Novartis','Tesla','Samsung','HSBC',
    'Nestle','Toyota','Amazon','BHP Group','Rio Tinto','BASF','AstraZeneca','Goldman Sachs','TotalEnergies','Volkswagen',
    'Meta','Alphabet','Pfizer','ExxonMobil','Chevron','Intel','Cisco','Visa','Mastercard','Johnson & Johnson',
    'Procter & Gamble','Walt Disney','Netflix','Adobe','Salesforce','Nike','McDonalds','Coca-Cola','PepsiCo','Merck',
    'Roche','SAP','Allianz','Deutsche Bank','Barclays','Glencore','Anglo American','Engie','Iberdrola','Orsted'];
  const tickers=['AAPL','MSFT','JPM','ULVR','SHEL','SIE','NOVN','TSLA','005930','HSBA',
    'NESN','7203','AMZN','BHP','RIO','BAS','AZN','GS','TTE','VOW3',
    'META','GOOGL','PFE','XOM','CVX','INTC','CSCO','V','MA','JNJ',
    'PG','DIS','NFLX','ADBE','CRM','NKE','MCD','KO','PEP','MRK',
    'ROG','SAP','ALV','DBK','BARC','GLEN','AAL','ENGI','IBE','ORSTED'];
  const sect = SECTORS[Math.floor(sr(i*7)*SECTORS.length)];
  const ratings = {};
  let covCount = 0;
  PROVIDERS.forEach((p,pi)=>{
    const hasCov = sr(i*100+pi*13) > 0.15;
    if(hasCov){
      const ri = Math.floor(sr(i*31+pi*17)*RATING_SCALE.length);
      ratings[p] = RATING_SCALE[Math.min(ri, RATING_SCALE.length-1)];
      covCount++;
    } else { ratings[p] = null; }
  });
  const avail = Object.values(ratings).filter(Boolean);
  const avgIdx = avail.length ? avail.reduce((s,r)=>s+RATING_SCALE.indexOf(r),0)/avail.length : null;
  const maxIdx = avail.length ? Math.max(...avail.map(r=>RATING_SCALE.indexOf(r))) : 0;
  const minIdx = avail.length ? Math.min(...avail.map(r=>RATING_SCALE.indexOf(r))) : 0;
  return { id:i, name:names[i], ticker:tickers[i], sector:sect, ratings, coverage:covCount,
    consensus: avgIdx!==null ? RATING_SCALE[Math.round(avgIdx)] : 'N/A',
    divergence: maxIdx-minIdx, avgIdx };
});

const QUARTERS = ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'];

const AGREEMENT_DATA = QUARTERS.map((q,qi)=>({
  quarter:q,
  MSCI: 68+Math.round(sr(qi*11)*12),
  'S&P Global': 72+Math.round(sr(qi*13)*10),
  Sustainalytics: 60+Math.round(sr(qi*17)*15),
  'ISS ESG': 65+Math.round(sr(qi*19)*14),
  CDP: 58+Math.round(sr(qi*23)*18),
  Refinitiv: 70+Math.round(sr(qi*29)*11),
}));

const SUB_MODULES = [
  { key:'comparator', label:'ESG Ratings Comparator', desc:'Cross-provider side-by-side analysis', icon:'\u2194\uFE0F', color:T.navyL },
  { key:'decoder', label:'Methodology Decoder', desc:'Decode rating drivers & weightings', icon:'\uD83D\uDD0D', color:T.gold },
  { key:'migration', label:'Rating Migration Tracker', desc:'Track upgrades, downgrades & watchlists', icon:'\uD83D\uDCC8', color:T.sage },
  { key:'controversy', label:'Controversy Impact Scorer', desc:'Real-time controversy scoring', icon:'\u26A0\uFE0F', color:T.amber },
  { key:'greenwashing', label:'Greenwashing Detector', desc:'AI-powered greenwashing risk screening', icon:'\uD83D\uDEE1\uFE0F', color:T.red },
];

const INITIAL_ALERTS = [
  { id:1, type:'divergence', severity:'high', company:'Shell', msg:'Rating divergence of 4 notches between MSCI (AA) and Sustainalytics (B)', status:'active' },
  { id:2, type:'downgrade', severity:'high', company:'ExxonMobil', msg:'S&P Global downgraded from BBB to BB — fossil fuel exposure concerns', status:'active' },
  { id:3, type:'coverage', severity:'medium', company:'Orsted', msg:'CDP coverage lost — no renewal of CDP submission in 2025', status:'active' },
  { id:4, type:'divergence', severity:'medium', company:'Tesla', msg:'3-notch divergence: MSCI AAA vs ISS ESG A', status:'active' },
  { id:5, type:'greenwashing', severity:'high', company:'TotalEnergies', msg:'Greenwashing risk flagged: net-zero claim inconsistent with capex allocation', status:'active' },
  { id:6, type:'downgrade', severity:'low', company:'Deutsche Bank', msg:'Refinitiv downgraded from A to BBB — governance concern', status:'active' },
  { id:7, type:'divergence', severity:'medium', company:'Amazon', msg:'2-notch spread widening across 4 providers', status:'active' },
  { id:8, type:'coverage', severity:'low', company:'Samsung', msg:'ISS ESG coverage pending — data submission delayed', status:'active' },
  { id:9, type:'greenwashing', severity:'medium', company:'Chevron', msg:'Climate transition plan flagged for insufficient interim targets', status:'active' },
  { id:10, type:'downgrade', severity:'high', company:'Glencore', msg:'MSCI downgraded from BBB to B — mining controversy impact', status:'active' },
];

const BOARD_INSIGHTS = [
  'Portfolio consensus ESG rating improved from BBB to A over the past 4 quarters, driven by upgrades in Technology and Healthcare sectors.',
  'Rating divergence remains elevated for 8 holdings (16% of portfolio), with Energy sector companies showing the widest provider disagreement.',
  'Greenwashing risk screening identified 3 companies with material inconsistencies between stated commitments and capital allocation.',
  'EU ESG Ratings Regulation readiness stands at 72% — 14 companies still lack sufficient provider methodology transparency documentation.',
  'Provider coverage gaps persist: 6 companies have fewer than 3 provider ratings, limiting consensus reliability for those holdings.',
];

const REPORT_SECTIONS = [
  { id:'overview', label:'Executive Overview', enabled:true },
  { id:'divergence', label:'Divergence Analysis', enabled:true },
  { id:'migrations', label:'Rating Migrations', enabled:true },
  { id:'controversy', label:'Controversy Impact', enabled:true },
  { id:'regulatory', label:'Regulatory Readiness', enabled:true },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page:{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text },
  header:{ marginBottom:24 },
  title:{ fontSize:26, fontWeight:700, color:T.navy, margin:0 },
  subtitle:{ fontSize:14, color:T.textSec, marginTop:4 },
  tabs:{ display:'flex', gap:4, background:T.surface, borderRadius:10, padding:4, border:`1px solid ${T.border}`, marginBottom:24 },
  tab:(a)=>({ padding:'10px 20px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:a?600:500,
    fontFamily:T.font, background:a?T.navy:'transparent', color:a?'#fff':T.textSec, transition:'all 0.2s' }),
  card:{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:20, marginBottom:16 },
  cardH:{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:20, marginBottom:16,
    cursor:'pointer', transition:'all 0.15s' },
  kpiGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  kpi:{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:'16px 18px', textAlign:'center' },
  kpiVal:{ fontSize:22, fontWeight:700, fontFamily:T.mono },
  kpiLabel:{ fontSize:11, color:T.textSec, marginTop:4, textTransform:'uppercase', letterSpacing:'0.5px' },
  grid2:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  grid3:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 },
  sectionTitle:{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:12 },
  table:{ width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:{ textAlign:'left', padding:'10px 12px', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:600,
    color:T.textSec, textTransform:'uppercase', letterSpacing:'0.5px' },
  td:{ padding:'8px 12px', borderBottom:`1px solid ${T.border}` },
  badge:(c)=>({ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600,
    background:c===T.red?'#fef2f2':c===T.amber?'#fffbeb':c===T.green?'#f0fdf4':'#f0f4ff',
    color:c }),
  btn:(bg,fg)=>({ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
    fontFamily:T.font, background:bg, color:fg||'#fff', transition:'all 0.15s' }),
  btnSm:(bg,fg)=>({ padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
    fontFamily:T.font, background:bg, color:fg||'#fff' }),
  slider:{ width:'100%', accentColor:T.navy },
  input:{ padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, width:'100%', boxSizing:'border-box' },
  check:{ width:16, height:16, accentColor:T.sage },
  moduleCard:(c)=>({ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, borderLeft:`4px solid ${c}`,
    padding:'16px 20px', cursor:'pointer', transition:'all 0.15s' }),
};

const PCOLORS = [T.navy, T.gold, T.sage, T.navyL, T.amber, '#8b5cf6'];
const SEV_COLOR = { high:T.red, medium:T.amber, low:T.green };

// ── Component ───────────────────────────────────────────────────────────────
export default function EsgRatingsHubPage() {
  const [tab, setTab] = useState(0);
  const TABS = ['Executive Dashboard','Portfolio Coverage','Consensus & Alerts','Board Report'];

  // ── Executive Dashboard state
  const [selectedModule, setSelectedModule] = useState(null);
  const [kpiPeriod, setKpiPeriod] = useState('current');

  // ── Portfolio Coverage state
  const [portfolio, setPortfolio] = useState(()=>COMPANIES.map(c=>({...c, included:true})));
  const [covSearch, setCovSearch] = useState('');
  const [covSort, setCovSort] = useState('name');
  const [covSortDir, setCovSortDir] = useState('asc');
  const [showGapsOnly, setShowGapsOnly] = useState(false);

  // ── Consensus & Alerts state
  const [weights, setWeights] = useState(()=>Object.fromEntries(PROVIDERS.map(p=>[p,100])));
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [divThreshold, setDivThreshold] = useState(3);
  const [customAlertType, setCustomAlertType] = useState('divergence');
  const [customAlertThreshold, setCustomAlertThreshold] = useState('');
  const [customAlertCompany, setCustomAlertCompany] = useState('');

  // ── Board Report state
  const [reportRange, setReportRange] = useState('Q1 2026');
  const [reportSections, setReportSections] = useState(REPORT_SECTIONS);
  const [previewMode, setPreviewMode] = useState(false);

  // ── Computed KPIs
  const kpis = useMemo(()=>{
    const incl = portfolio.filter(c=>c.included);
    const rated = incl.filter(c=>c.consensus!=='N/A');
    const avgIdx = rated.length ? rated.reduce((s,c)=>s+c.avgIdx,0)/rated.length : 0;
    const consensus = RATING_SCALE[Math.round(avgIdx)];
    const maxDiv = Math.max(...incl.map(c=>c.divergence));
    const coverage = incl.length ? Math.round(incl.filter(c=>c.coverage>=3).length/incl.length*100) : 0;
    const upgrades = Math.round(sr(42)*8)+5;
    const downgrades = Math.round(sr(77)*6)+3;
    const gwAlerts = alerts.filter(a=>a.type==='greenwashing'&&a.status==='active').length;
    const integrity = 68+Math.round(sr(99)*20);
    return [
      { label:'Avg Portfolio Rating', value:consensus, color:T.navy },
      { label:'Consensus Score', value:(7-avgIdx).toFixed(1)+'/7', color:T.sage },
      { label:'Max Divergence', value:maxDiv+' notches', color:maxDiv>=3?T.red:T.amber },
      { label:'Coverage %', value:coverage+'%', color:coverage>=80?T.green:T.amber },
      { label:'Upgrade Count', value:upgrades, color:T.green },
      { label:'Downgrade Count', value:downgrades, color:T.red },
      { label:'Greenwashing Alerts', value:gwAlerts, color:gwAlerts>0?T.red:T.green },
      { label:'Integrity Score', value:integrity+'/100', color:integrity>=75?T.green:T.amber },
    ];
  },[portfolio, alerts]);

  // ── Top divergent companies
  const topDivergent = useMemo(()=>{
    return [...portfolio].filter(c=>c.included).sort((a,b)=>b.divergence-a.divergence).slice(0,5);
  },[portfolio]);

  // ── Rating distribution for donut
  const ratingDist = useMemo(()=>{
    const counts = {};
    RATING_SCALE.forEach(r=>{ counts[r]=0; });
    portfolio.filter(c=>c.included&&c.consensus!=='N/A').forEach(c=>{ counts[c.consensus]++; });
    return RATING_SCALE.map(r=>({ name:r, value:counts[r] }));
  },[portfolio]);

  // ── Coverage per provider
  const providerCoverage = useMemo(()=>{
    const incl = portfolio.filter(c=>c.included);
    return PROVIDERS.map(p=>({
      name:p, value: incl.filter(c=>c.ratings[p]!==null).length,
      pct: incl.length?Math.round(incl.filter(c=>c.ratings[p]!==null).length/incl.length*100):0,
    }));
  },[portfolio]);

  // ── Filtered portfolio for coverage tab
  const filteredPortfolio = useMemo(()=>{
    let list = [...portfolio];
    if(covSearch) list = list.filter(c=>c.name.toLowerCase().includes(covSearch.toLowerCase())||c.ticker.toLowerCase().includes(covSearch.toLowerCase()));
    if(showGapsOnly) list = list.filter(c=>c.coverage<3);
    list.sort((a,b)=>{
      let va,vb;
      if(covSort==='name'){va=a.name;vb=b.name;}
      else if(covSort==='coverage'){va=a.coverage;vb=b.coverage;}
      else if(covSort==='divergence'){va=a.divergence;vb=b.divergence;}
      else if(covSort==='sector'){va=a.sector;vb=b.sector;}
      else {va=a.name;vb=b.name;}
      if(typeof va==='string') return covSortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va);
      return covSortDir==='asc'?va-vb:vb-va;
    });
    return list;
  },[portfolio, covSearch, covSort, covSortDir, showGapsOnly]);

  // ── Consensus with weights
  const weightedConsensus = useMemo(()=>{
    const incl = portfolio.filter(c=>c.included);
    return incl.map(c=>{
      let totalW = 0, wSum = 0;
      PROVIDERS.forEach(p=>{
        if(c.ratings[p]){
          const w = weights[p]/100;
          wSum += RATING_SCALE.indexOf(c.ratings[p]) * w;
          totalW += w;
        }
      });
      const wAvg = totalW>0 ? wSum/totalW : null;
      return { ...c, weightedRating: wAvg!==null ? RATING_SCALE[Math.round(wAvg)] : 'N/A', weightedIdx:wAvg };
    });
  },[portfolio, weights]);

  // ── Provider trend data for radar
  const providerRadar = useMemo(()=>{
    return ['Coverage','Timeliness','Transparency','Methodology','Correlation'].map((dim,di)=>({
      dimension:dim,
      ...Object.fromEntries(PROVIDERS.map((p,pi)=>[p, 50+Math.round(sr(di*100+pi*37)*45)])),
    }));
  },[]);

  const toggleCompany = (id)=>{
    setPortfolio(prev=>prev.map(c=>c.id===id?{...c,included:!c.included}:c));
  };

  const dismissAlert = (id)=>setAlerts(prev=>prev.map(a=>a.id===id?{...a,status:'dismissed'}:a));
  const escalateAlert = (id)=>setAlerts(prev=>prev.map(a=>a.id===id?{...a,status:'escalated'}:a));
  const acknowledgeAlert = (id)=>setAlerts(prev=>prev.map(a=>a.id===id?{...a,status:'acknowledged'}:a));

  const addCustomAlert = ()=>{
    if(!customAlertThreshold&&!customAlertCompany) return;
    const newA = { id:Date.now(), type:customAlertType, severity:'medium',
      company:customAlertCompany||'Portfolio-wide',
      msg:`Custom rule: ${customAlertType} threshold ${customAlertThreshold} for ${customAlertCompany||'all companies'}`,
      status:'active' };
    setAlerts(prev=>[newA,...prev]);
    setCustomAlertThreshold(''); setCustomAlertCompany('');
  };

  const toggleReportSection = (id)=>{
    setReportSections(prev=>prev.map(s=>s.id===id?{...s,enabled:!s.enabled}:s));
  };

  const exportCSV = ()=>{
    const incl = portfolio.filter(c=>c.included);
    const header = ['Company','Ticker','Sector','Coverage','Consensus','Divergence',...PROVIDERS].join(',');
    const rows = incl.map(c=>[c.name,c.ticker,c.sector,c.coverage,c.consensus,c.divergence,...PROVIDERS.map(p=>c.ratings[p]||'N/A')].join(','));
    const csv = [header,...rows].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`esg-ratings-hub-${reportRange}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (col)=>{
    if(covSort===col) setCovSortDir(d=>d==='asc'?'desc':'asc');
    else { setCovSort(col); setCovSortDir('asc'); }
  };

  const DONUT_COLORS = [T.navy,'#2563eb',T.navyL,T.gold,T.amber,'#ea580c',T.red];

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>ESG Ratings Intelligence Hub</h1>
        <p style={S.subtitle}>EP-AK6 -- Unified dashboard aggregating cross-provider ESG ratings intelligence for {portfolio.filter(c=>c.included).length} portfolio companies</p>
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {/* ═══ TAB 1: EXECUTIVE DASHBOARD ═══════════════════════════════════════ */}
      {tab===0 && (
        <div>
          {/* KPI Cards */}
          <div style={S.kpiGrid}>
            {kpis.map((k,i)=>(
              <div key={i} style={{...S.kpi, borderTop:`3px solid ${k.color}`}}>
                <div style={{...S.kpiVal, color:k.color}}>{k.value}</div>
                <div style={S.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={S.grid2}>
            {/* Top Divergent Companies */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Top 5 Divergent Companies</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Company</th>
                    <th style={S.th}>Sector</th>
                    <th style={S.th}>Divergence</th>
                    <th style={S.th}>Highest</th>
                    <th style={S.th}>Lowest</th>
                  </tr>
                </thead>
                <tbody>
                  {topDivergent.map(c=>{
                    const avail = PROVIDERS.filter(p=>c.ratings[p]);
                    const highest = avail.length ? avail.reduce((best,p)=>RATING_SCALE.indexOf(c.ratings[p])<RATING_SCALE.indexOf(c.ratings[best])?p:best,avail[0]) : null;
                    const lowest = avail.length ? avail.reduce((worst,p)=>RATING_SCALE.indexOf(c.ratings[p])>RATING_SCALE.indexOf(c.ratings[worst])?p:worst,avail[0]) : null;
                    return (
                      <tr key={c.id} style={{cursor:'pointer'}} onMouseOver={e=>e.currentTarget.style.background=T.surfaceH} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                        <td style={S.td}><strong>{c.name}</strong> <span style={{color:T.textMut,fontSize:11}}>{c.ticker}</span></td>
                        <td style={S.td}>{c.sector}</td>
                        <td style={S.td}><span style={S.badge(c.divergence>=3?T.red:T.amber)}>{c.divergence} notches</span></td>
                        <td style={S.td}>{highest?`${c.ratings[highest]} (${highest})`:'-'}</td>
                        <td style={S.td}>{lowest?`${c.ratings[lowest]} (${lowest})`:'-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rating Distribution Donut */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Rating Distribution</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={ratingDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" label={({name,value})=>value>0?`${name}: ${value}`:''}>
                    {ratingDist.map((_,i)=><Cell key={i} fill={DONUT_COLORS[i%DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider Agreement Index */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Provider Agreement Index (% pairwise correlation over 8 quarters)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={AGREEMENT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{fontSize:11}} stroke={T.textMut} />
                <YAxis domain={[50,100]} tick={{fontSize:11}} stroke={T.textMut} />
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
                <Legend wrapperStyle={{fontSize:11}} />
                {PROVIDERS.map((p,i)=>(
                  <Area key={p} type="monotone" dataKey={p} stroke={PCOLORS[i]} fill={PCOLORS[i]} fillOpacity={0.08} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sub-Module Quick Actions */}
          <div style={S.sectionTitle}>Sprint AK Modules</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:16}}>
            {SUB_MODULES.map(m=>(
              <div key={m.key} style={{...S.moduleCard(m.color), background:selectedModule===m.key?T.surfaceH:T.surface}}
                onClick={()=>setSelectedModule(selectedModule===m.key?null:m.key)}
                onMouseOver={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.boxShadow=`0 4px 12px rgba(27,58,92,0.1)`;}}
                onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow='none';}}>
                <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>{m.label}</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.4}}>{m.desc}</div>
                {selectedModule===m.key && (
                  <div style={{marginTop:10,padding:'8px 12px',background:T.bg,borderRadius:8,fontSize:11,color:T.textSec}}>
                    Module active -- data feeds into this hub dashboard in real time. Click to navigate.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Provider Radar */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Provider Quality Radar</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={providerRadar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dimension" tick={{fontSize:11,fill:T.textSec}} />
                <PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}} />
                {PROVIDERS.map((p,i)=>(
                  <Radar key={p} name={p} dataKey={p} stroke={PCOLORS[i]} fill={PCOLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{fontSize:11}} />
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: PORTFOLIO COVERAGE ════════════════════════════════════════ */}
      {tab===1 && (
        <div>
          {/* Controls */}
          <div style={{...S.card, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <input style={{...S.input, maxWidth:260}} placeholder="Search company or ticker..." value={covSearch} onChange={e=>setCovSearch(e.target.value)} />
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.textSec,cursor:'pointer'}}>
              <input type="checkbox" checked={showGapsOnly} onChange={()=>setShowGapsOnly(!showGapsOnly)} style={S.check} />
              Show coverage gaps only (&lt;3 providers)
            </label>
            <div style={{marginLeft:'auto',fontSize:12,color:T.textSec}}>
              {filteredPortfolio.length} companies | {filteredPortfolio.filter(c=>c.included).length} in portfolio
            </div>
          </div>

          <div style={S.grid2}>
            {/* Companies Table */}
            <div style={{...S.card, overflowX:'auto', gridColumn:'1/3'}}>
              <div style={S.sectionTitle}>Company Coverage Matrix</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{...S.th,width:30}}></th>
                    <th style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort('name')}>Company {covSort==='name'?(covSortDir==='asc'?'\u25B2':'\u25BC'):''}</th>
                    <th style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort('sector')}>Sector {covSort==='sector'?(covSortDir==='asc'?'\u25B2':'\u25BC'):''}</th>
                    {PROVIDERS.map(p=><th key={p} style={{...S.th,textAlign:'center',fontSize:10}}>{p}</th>)}
                    <th style={{...S.th,cursor:'pointer',textAlign:'center'}} onClick={()=>handleSort('coverage')}>Cov {covSort==='coverage'?(covSortDir==='asc'?'\u25B2':'\u25BC'):''}</th>
                    <th style={{...S.th,cursor:'pointer',textAlign:'center'}} onClick={()=>handleSort('divergence')}>Div {covSort==='divergence'?(covSortDir==='asc'?'\u25B2':'\u25BC'):''}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPortfolio.slice(0,30).map(c=>(
                    <tr key={c.id} style={{background:c.coverage<3?'#fef2f2':'transparent',opacity:c.included?1:0.5}}
                      onMouseOver={e=>e.currentTarget.style.background=T.surfaceH} onMouseOut={e=>e.currentTarget.style.background=c.coverage<3?'#fef2f2':'transparent'}>
                      <td style={S.td}><input type="checkbox" checked={c.included} onChange={()=>toggleCompany(c.id)} style={S.check} /></td>
                      <td style={S.td}><strong>{c.name}</strong> <span style={{color:T.textMut,fontSize:10}}>{c.ticker}</span></td>
                      <td style={{...S.td,fontSize:11,color:T.textSec}}>{c.sector}</td>
                      {PROVIDERS.map(p=>(
                        <td key={p} style={{...S.td,textAlign:'center'}}>
                          {c.ratings[p] ? <span style={{color:T.green,fontWeight:700,fontSize:11}}>{c.ratings[p]}</span>
                            : <span style={{color:T.textMut}}>--</span>}
                        </td>
                      ))}
                      <td style={{...S.td,textAlign:'center',fontWeight:600,fontFamily:T.mono,fontSize:12}}>{c.coverage}/6</td>
                      <td style={{...S.td,textAlign:'center'}}>
                        <span style={S.badge(c.divergence>=3?T.red:c.divergence>=2?T.amber:T.green)}>{c.divergence}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPortfolio.length>30 && <div style={{padding:12,textAlign:'center',fontSize:12,color:T.textMut}}>Showing 30 of {filteredPortfolio.length} companies</div>}
            </div>
          </div>

          <div style={S.grid2}>
            {/* Coverage % by Provider Pie */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Coverage by Provider</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={providerCoverage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0,100]} tick={{fontSize:11}} stroke={T.textMut} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{fontSize:11}} stroke={T.textMut} width={100} />
                  <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} formatter={v=>`${v}%`} />
                  <Bar dataKey="pct" radius={[0,6,6,0]}>
                    {providerCoverage.map((_,i)=><Cell key={i} fill={PCOLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Coverage Gap Analysis */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Coverage Gap Analysis</div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Companies with fewer than 3 provider ratings:</div>
              {portfolio.filter(c=>c.included&&c.coverage<3).length===0 ? (
                <div style={{padding:20,textAlign:'center',color:T.green,fontWeight:600}}>All portfolio companies have 3+ provider coverage</div>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Company</th>
                      <th style={S.th}>Coverage</th>
                      <th style={S.th}>Missing Providers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.filter(c=>c.included&&c.coverage<3).map(c=>{
                      const missing = PROVIDERS.filter(p=>!c.ratings[p]);
                      return (
                        <tr key={c.id}>
                          <td style={S.td}><strong>{c.name}</strong></td>
                          <td style={S.td}><span style={S.badge(T.red)}>{c.coverage}/6</span></td>
                          <td style={{...S.td,fontSize:11,color:T.textMut}}>{missing.join(', ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: CONSENSUS & ALERTS ════════════════════════════════════════ */}
      {tab===2 && (
        <div>
          <div style={S.grid2}>
            {/* Weighted Consensus Calculator */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Provider Weight Configuration</div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:14}}>Adjust weights to calculate custom consensus ratings</div>
              {PROVIDERS.map((p,i)=>(
                <div key={p} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                  <div style={{width:110,fontSize:12,fontWeight:600,color:PCOLORS[i]}}>{p}</div>
                  <input type="range" min={0} max={100} value={weights[p]} onChange={e=>setWeights({...weights,[p]:+e.target.value})} style={S.slider} />
                  <div style={{width:40,fontFamily:T.mono,fontSize:12,textAlign:'right'}}>{weights[p]}%</div>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button style={S.btn(T.navy)} onClick={()=>setWeights(Object.fromEntries(PROVIDERS.map(p=>[p,100])))}>Reset All</button>
                <button style={S.btn(T.gold)} onClick={()=>setWeights(Object.fromEntries(PROVIDERS.map(p=>[p,p==='MSCI'||p==='S&P Global'?100:50])))}>Weight Leaders</button>
              </div>
            </div>

            {/* Alert Configuration */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Alert Engine Configuration</div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:6}}>Divergence Alert Threshold (notches)</label>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <input type="range" min={1} max={6} value={divThreshold} onChange={e=>setDivThreshold(+e.target.value)} style={{...S.slider,flex:1}} />
                  <span style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.navy}}>{divThreshold}</span>
                </div>
                <div style={{fontSize:11,color:T.textMut,marginTop:4}}>
                  {portfolio.filter(c=>c.included&&c.divergence>=divThreshold).length} companies currently exceed this threshold
                </div>
              </div>
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,marginTop:8}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Add Custom Alert Rule</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <select value={customAlertType} onChange={e=>setCustomAlertType(e.target.value)}
                    style={{...S.input,cursor:'pointer'}}>
                    <option value="divergence">Divergence</option>
                    <option value="downgrade">Downgrade</option>
                    <option value="coverage">Coverage Loss</option>
                    <option value="greenwashing">Greenwashing</option>
                  </select>
                  <input style={S.input} placeholder="Threshold value..." value={customAlertThreshold} onChange={e=>setCustomAlertThreshold(e.target.value)} />
                </div>
                <input style={{...S.input,marginBottom:8}} placeholder="Company (leave blank for portfolio-wide)..." value={customAlertCompany} onChange={e=>setCustomAlertCompany(e.target.value)} />
                <button style={S.btn(T.sage)} onClick={addCustomAlert}>Add Alert Rule</button>
              </div>
            </div>
          </div>

          {/* Weighted Consensus Table */}
          <div style={{...S.card, overflowX:'auto'}}>
            <div style={S.sectionTitle}>Weighted Consensus Ratings (Top 20)</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Company</th>
                  <th style={S.th}>Sector</th>
                  {PROVIDERS.map(p=><th key={p} style={{...S.th,textAlign:'center',fontSize:10}}>{p}</th>)}
                  <th style={{...S.th,textAlign:'center',background:'#f0f4ff'}}>Weighted</th>
                  <th style={{...S.th,textAlign:'center'}}>Original</th>
                </tr>
              </thead>
              <tbody>
                {weightedConsensus.sort((a,b)=>(a.weightedIdx||99)-(b.weightedIdx||99)).slice(0,20).map(c=>(
                  <tr key={c.id} onMouseOver={e=>e.currentTarget.style.background=T.surfaceH} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <td style={S.td}><strong>{c.name}</strong></td>
                    <td style={{...S.td,fontSize:11,color:T.textSec}}>{c.sector}</td>
                    {PROVIDERS.map(p=>(
                      <td key={p} style={{...S.td,textAlign:'center',fontSize:11,opacity:weights[p]<50?0.4:1}}>
                        {c.ratings[p]||'--'}
                      </td>
                    ))}
                    <td style={{...S.td,textAlign:'center',fontWeight:700,color:T.navy,background:'#f0f4ff'}}>{c.weightedRating}</td>
                    <td style={{...S.td,textAlign:'center',color:T.textSec}}>{c.consensus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active Alerts */}
          <div style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={S.sectionTitle}>Active Alerts ({alerts.filter(a=>a.status==='active').length})</div>
              <div style={{display:'flex',gap:6}}>
                {['all','active','acknowledged','escalated','dismissed'].map(f=>(
                  <button key={f} style={S.btnSm(f==='all'?T.navy:T.bg,f==='all'?'#fff':T.textSec)}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {alerts.map(a=>(
                <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,
                  background:a.status==='dismissed'?T.bg:T.surface,border:`1px solid ${a.status==='escalated'?T.red:T.border}`,
                  opacity:a.status==='dismissed'?0.5:1}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:SEV_COLOR[a.severity],flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{a.company} <span style={{color:T.textMut,fontWeight:400}}>-- {a.type}</span></div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{a.msg}</div>
                  </div>
                  <span style={{...S.badge(SEV_COLOR[a.severity]),fontSize:10}}>{a.severity}</span>
                  <span style={{fontSize:10,color:T.textMut,minWidth:72}}>{a.status}</span>
                  {a.status==='active' && (
                    <div style={{display:'flex',gap:4}}>
                      <button style={S.btnSm(T.gold)} onClick={()=>acknowledgeAlert(a.id)} title="Acknowledge">Ack</button>
                      <button style={S.btnSm(T.red)} onClick={()=>escalateAlert(a.id)} title="Escalate">Esc</button>
                      <button style={S.btnSm(T.bg,T.textSec)} onClick={()=>dismissAlert(a.id)} title="Dismiss">Dis</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: BOARD REPORT ══════════════════════════════════════════════ */}
      {tab===3 && (
        <div>
          {/* Controls Row */}
          <div style={{...S.card, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap'}}>
            <div>
              <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Report Period</label>
              <select value={reportRange} onChange={e=>setReportRange(e.target.value)} style={{...S.input,width:160,cursor:'pointer'}}>
                {QUARTERS.map(q=><option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {reportSections.map(s=>(
                <label key={s.id} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:s.enabled?T.navy:T.textMut,cursor:'pointer'}}>
                  <input type="checkbox" checked={s.enabled} onChange={()=>toggleReportSection(s.id)} style={S.check} />
                  {s.label}
                </label>
              ))}
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <button style={S.btn(previewMode?T.navyL:T.bg,previewMode?'#fff':T.textSec)} onClick={()=>setPreviewMode(!previewMode)}>
                {previewMode?'Exit Preview':'Print Preview'}
              </button>
              <button style={S.btn(T.sage)} onClick={exportCSV}>Export CSV</button>
              <button style={S.btn(T.navy)} onClick={()=>window.print()}>Export PDF</button>
            </div>
          </div>

          {/* Board Report Content */}
          <div style={{...S.card, ...(previewMode?{background:'#fff',boxShadow:'0 4px 24px rgba(0,0,0,0.12)',maxWidth:900,margin:'0 auto 16px',padding:32}:{})}}>
            {reportSections.find(s=>s.id==='overview')?.enabled && (
              <div style={{marginBottom:28}}>
                <div style={{fontSize:20,fontWeight:700,color:T.navy,marginBottom:4}}>ESG Ratings Intelligence -- Board Summary</div>
                <div style={{fontSize:12,color:T.textMut,marginBottom:16}}>Period: {reportRange} | Generated: {new Date().toLocaleDateString()}</div>

                <div style={S.sectionTitle}>Key Insights</div>
                {BOARD_INSIGHTS.map((ins,i)=>(
                  <div key={i} style={{display:'flex',gap:10,marginBottom:10,padding:'10px 14px',background:T.bg,borderRadius:8,borderLeft:`3px solid ${PCOLORS[i%PCOLORS.length]}`}}>
                    <span style={{fontWeight:700,color:PCOLORS[i%PCOLORS.length],fontSize:14,minWidth:20}}>{i+1}</span>
                    <span style={{fontSize:12,color:T.text,lineHeight:1.5}}>{ins}</span>
                  </div>
                ))}
              </div>
            )}

            {reportSections.find(s=>s.id==='divergence')?.enabled && (
              <div style={{marginBottom:28}}>
                <div style={S.sectionTitle}>Divergence Analysis</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div>
                    <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Divergence Distribution</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[0,1,2,3,4,5].map(d=>({notches:d+' notches',count:portfolio.filter(c=>c.included&&c.divergence===d).length}))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="notches" tick={{fontSize:10}} stroke={T.textMut} />
                        <YAxis tick={{fontSize:10}} stroke={T.textMut} />
                        <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
                        <Bar dataKey="count" radius={[6,6,0,0]}>
                          {[0,1,2,3,4,5].map((_,i)=><Cell key={i} fill={i<2?T.green:i<4?T.amber:T.red} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Sector Divergence Heatmap</div>
                    {SECTORS.map(sect=>{
                      const sectorCos = portfolio.filter(c=>c.included&&c.sector===sect);
                      const avgDiv = sectorCos.length ? sectorCos.reduce((s,c)=>s+c.divergence,0)/sectorCos.length : 0;
                      return (
                        <div key={sect} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                          <div style={{width:90,fontSize:11,color:T.textSec}}>{sect}</div>
                          <div style={{flex:1,height:16,background:T.bg,borderRadius:8,overflow:'hidden'}}>
                            <div style={{width:`${avgDiv/5*100}%`,height:'100%',borderRadius:8,
                              background:avgDiv<1.5?T.green:avgDiv<3?T.amber:T.red,transition:'width 0.3s'}} />
                          </div>
                          <div style={{width:28,fontFamily:T.mono,fontSize:11,textAlign:'right'}}>{avgDiv.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {reportSections.find(s=>s.id==='migrations')?.enabled && (
              <div style={{marginBottom:28}}>
                <div style={S.sectionTitle}>Rating Migrations -- Quarterly Trend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={QUARTERS.map((q,qi)=>({
                    quarter:q,
                    upgrades:3+Math.round(sr(qi*41)*6),
                    downgrades:-(2+Math.round(sr(qi*53)*5)),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="quarter" tick={{fontSize:10}} stroke={T.textMut} />
                    <YAxis tick={{fontSize:10}} stroke={T.textMut} />
                    <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
                    <Bar dataKey="upgrades" fill={T.green} radius={[6,6,0,0]} name="Upgrades" />
                    <Bar dataKey="downgrades" fill={T.red} radius={[0,0,6,6]} name="Downgrades" />
                    <Legend wrapperStyle={{fontSize:11}} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                  {['MSCI tightening E pillar methodology','S&P Global added biodiversity sub-score','Sustainalytics revised controversy deduction curve'].map((trend,i)=>(
                    <div key={i} style={{padding:'10px 14px',background:T.bg,borderRadius:8,fontSize:11,color:T.textSec,borderLeft:`3px solid ${PCOLORS[i]}`}}>
                      <strong style={{color:T.navy}}>Trend {i+1}:</strong> {trend}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportSections.find(s=>s.id==='controversy')?.enabled && (
              <div style={{marginBottom:28}}>
                <div style={S.sectionTitle}>Controversy Impact Summary</div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Company</th>
                      <th style={S.th}>Controversy Type</th>
                      <th style={S.th}>Severity</th>
                      <th style={S.th}>Impact on Rating</th>
                      <th style={S.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {co:'Shell',type:'Environmental',sev:'High',impact:'-2 notches (MSCI)',st:'Under review'},
                      {co:'Glencore',type:'Governance',sev:'Critical',impact:'-3 notches (S&P)',st:'Active'},
                      {co:'Amazon',type:'Social',sev:'Medium',impact:'-1 notch (ISS ESG)',st:'Monitoring'},
                      {co:'TotalEnergies',type:'Environmental',sev:'High',impact:'-2 notches (CDP)',st:'Active'},
                      {co:'Deutsche Bank',type:'Governance',sev:'Medium',impact:'-1 notch (Refinitiv)',st:'Resolved'},
                    ].map((r,i)=>(
                      <tr key={i} onMouseOver={e=>e.currentTarget.style.background=T.surfaceH} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                        <td style={S.td}><strong>{r.co}</strong></td>
                        <td style={S.td}>{r.type}</td>
                        <td style={S.td}><span style={S.badge(r.sev==='Critical'?T.red:r.sev==='High'?T.amber:T.gold)}>{r.sev}</span></td>
                        <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{r.impact}</td>
                        <td style={S.td}><span style={S.badge(r.st==='Active'?T.red:r.st==='Resolved'?T.green:T.amber)}>{r.st}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportSections.find(s=>s.id==='regulatory')?.enabled && (
              <div style={{marginBottom:16}}>
                <div style={S.sectionTitle}>EU ESG Ratings Regulation Readiness</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20}}>
                  <div style={{textAlign:'center',padding:20}}>
                    <div style={{fontSize:52,fontWeight:700,color:T.navy,fontFamily:T.mono}}>72%</div>
                    <div style={{fontSize:13,color:T.textSec,marginTop:4}}>Overall Readiness Score</div>
                    <div style={{width:'100%',height:10,background:T.bg,borderRadius:8,marginTop:12,overflow:'hidden'}}>
                      <div style={{width:'72%',height:'100%',borderRadius:8,background:`linear-gradient(90deg,${T.amber},${T.green})`}} />
                    </div>
                  </div>
                  <div>
                    {[
                      {area:'Provider Methodology Transparency',score:85,target:100},
                      {area:'Conflict of Interest Disclosures',score:60,target:100},
                      {area:'Data Source Documentation',score:78,target:100},
                      {area:'Rating Update Frequency',score:70,target:90},
                      {area:'Complaint Handling Procedures',score:55,target:100},
                      {area:'Supervisory Reporting Readiness',score:68,target:100},
                    ].map((item,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                        <div style={{width:220,fontSize:11,color:T.textSec}}>{item.area}</div>
                        <div style={{flex:1,height:12,background:T.bg,borderRadius:8,overflow:'hidden',position:'relative'}}>
                          <div style={{width:`${item.score}%`,height:'100%',borderRadius:8,
                            background:item.score>=80?T.green:item.score>=60?T.amber:T.red}} />
                          <div style={{position:'absolute',right:`${100-item.target}%`,top:0,bottom:0,width:2,background:T.navy,opacity:0.4}} />
                        </div>
                        <div style={{width:36,fontFamily:T.mono,fontSize:11,textAlign:'right',color:item.score>=80?T.green:item.score>=60?T.amber:T.red}}>{item.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Summary */}
          <div style={{...S.card, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Report Configuration</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:2}}>
                {reportSections.filter(s=>s.enabled).length} of {reportSections.length} sections enabled | Period: {reportRange} | {portfolio.filter(c=>c.included).length} companies
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={S.btn(T.sage)} onClick={exportCSV}>Download CSV</button>
              <button style={S.btn(T.navy)} onClick={()=>window.print()}>Generate PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{textAlign:'center',padding:'24px 0 8px',fontSize:11,color:T.textMut}}>
        EP-AK6 ESG Ratings Intelligence Hub | {PROVIDERS.length} providers | {portfolio.filter(c=>c.included).length} portfolio companies | Sprint AK
      </div>
    </div>
  );
}
