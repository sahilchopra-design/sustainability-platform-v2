import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// ── Constants ─────────────────────────────────────────────────────────────────
const PROVIDERS=['MSCI','S&P Global','Sustainalytics','ISS ESG','CDP','Refinitiv'];
const RATING_SCALE=['AAA','AA','A','BBB','BB','B','CCC'];
const SECTORS=['Technology','Financials','Healthcare','Energy','Industrials','Consumer Discretionary','Utilities','Materials','Real Estate','Communication Services','Consumer Staples','Transportation','Insurance','Mining','Chemicals'];
const QUARTERS=['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'];

const COMPANY_NAMES=[
  'Apple','Microsoft','JPMorgan','Unilever','Shell','Siemens','Novartis','Tesla','Samsung','HSBC',
  'Nestle','Toyota','Amazon','BHP Group','Rio Tinto','BASF','AstraZeneca','Goldman Sachs','TotalEnergies','Volkswagen',
  'Meta','Alphabet','Pfizer','ExxonMobil','Chevron','Intel','Cisco','Visa','Mastercard','Johnson & Johnson',
  'Procter & Gamble','Walt Disney','Netflix','Adobe','Salesforce','Nike','McDonalds','Coca-Cola','PepsiCo','Merck',
  'Roche','SAP','Allianz','Deutsche Bank','Barclays','Glencore','Anglo American','Engie','Iberdrola','Orsted',
  'LVMH','LOreal','ASML','Novo Nordisk','AbbVie','Thermo Fisher','Danaher','Linde','Honeywell','Caterpillar',
  'Deere & Co','3M','General Electric','Lockheed Martin','Raytheon','Boeing','Airbus','Rolls-Royce','BAE Systems','Northrop Grumman',
  'UnitedHealth','Anthem','Cigna','Humana','CVS Health','Walgreens','Cardinal Health','McKesson','AmerisourceBergen','Medtronic',
  'Abbott Labs','Stryker','Edwards Lifesciences','Intuitive Surgical','Illumina','Regeneron','Moderna','BioNTech','Gilead Sciences','Amgen',
  'Broadcom','Texas Instruments','Qualcomm','Applied Materials','Lam Research','KLA Corp','Synopsys','Cadence Design','Marvell Tech','ON Semiconductor',
  'Berkshire Hathaway','Morgan Stanley','Charles Schwab','BlackRock','State Street','T Rowe Price','Invesco','Franklin Templeton','Northern Trust','Bank of NY Mellon',
  'NextEra Energy','Duke Energy','Southern Company','Dominion Energy','Exelon','AES Corp','Enel','EDF','Vattenfall','SSE plc',
  'Newmont Mining','Freeport-McMoRan','Nucor','Cleveland-Cliffs','Alcoa','ArcelorMittal','Teck Resources','Vale','First Quantum','Fortescue Metals',
  'Prologis','American Tower','Crown Castle','Equinix','Digital Realty','Simon Property','Realty Income','AvalonBay','Essex Property','Welltower',
  'Comcast','Charter Comm','T-Mobile','Verizon','AT&T','Deutsche Telekom','Vodafone','Telefonica','Orange SA','Swisscom'
];
const TICKERS=[
  'AAPL','MSFT','JPM','ULVR','SHEL','SIE','NOVN','TSLA','005930','HSBA',
  'NESN','7203','AMZN','BHP','RIO','BAS','AZN','GS','TTE','VOW3',
  'META','GOOGL','PFE','XOM','CVX','INTC','CSCO','V','MA','JNJ',
  'PG','DIS','NFLX','ADBE','CRM','NKE','MCD','KO','PEP','MRK',
  'ROG','SAP','ALV','DBK','BARC','GLEN','AAL','ENGI','IBE','ORSTED',
  'MC','OR','ASML','NVO','ABBV','TMO','DHR','LIN','HON','CAT',
  'DE','MMM','GE','LMT','RTX','BA','AIR','RR','BA.L','NOC',
  'UNH','ANTM','CI','HUM','CVS','WBA','CAH','MCK','ABC','MDT',
  'ABT','SYK','EW','ISRG','ILMN','REGN','MRNA','BNTX','GILD','AMGN',
  'AVGO','TXN','QCOM','AMAT','LRCX','KLAC','SNPS','CDNS','MRVL','ON',
  'BRK.B','MS','SCHW','BLK','STT','TROW','IVZ','BEN','NTRS','BK',
  'NEE','DUK','SO','D','EXC','AES','ENEL','EDF','VATT','SSE',
  'NEM','FCX','NUE','CLF','AA','MT','TECK','VALE','FM','FMG',
  'PLD','AMT','CCI','EQIX','DLR','SPG','O','AVB','ESS','WELL',
  'CMCSA','CHTR','TMUS','VZ','T','DTE','VOD','TEF','ORA','SCMN'
];

// ── Generate 150 companies ────────────────────────────────────────────────────
const COMPANIES = Array.from({length:150},(_,i)=>{
  const sect=SECTORS[Math.floor(sr(i*7)*SECTORS.length)];
  const ratings={};
  let covCount=0;
  PROVIDERS.forEach((p,pi)=>{
    if(sr(i*100+pi*13)>0.15){
      ratings[p]=RATING_SCALE[Math.floor(sr(i*17+pi*31)*RATING_SCALE.length)];
      covCount++;
    }
  });
  const numScores=PROVIDERS.map((_,pi)=>ratings[PROVIDERS[pi]]?RATING_SCALE.indexOf(ratings[PROVIDERS[pi]]):null).filter(v=>v!==null);
  const avgNum=numScores.length?numScores.reduce((a,b)=>a+b,0)/numScores.length:3;
  const maxDiv=numScores.length>1?Math.max(...numScores)-Math.min(...numScores):0;
  // 12-quarter history
  const history=QUARTERS.map((q,qi)=>{
    const base=avgNum+sr(i*200+qi*11)*1.5-0.75;
    return{quarter:q,score:Math.max(0,Math.min(6,+(base).toFixed(2)))};
  });
  const lastQ=history.length>1?history[history.length-1].score-history[history.length-2].score:0;
  return{
    id:i,name:COMPANY_NAMES[i],ticker:TICKERS[i],sector:sect,
    ratings,coverage:covCount,totalProviders:PROVIDERS.length,
    avgScore:+avgNum.toFixed(2),avgRating:RATING_SCALE[Math.round(avgNum)]||'BBB',
    maxDivergence:maxDiv,history,momentum:lastQ>0.2?'Upgrade':lastQ<-0.2?'Downgrade':'Stable',
    controversies:Math.floor(sr(i*33)*4),greenwashRisk:sr(i*44)>0.8,
    included:true,
  };
});

// ── Controversies list ───────────────────────────────────────────────────────
const CONTROVERSIES=Array.from({length:90},(_,i)=>{
  const types=['Environmental Violation','Labor Dispute','Governance Failure','Supply Chain Issue','Data Privacy Breach','Greenwashing Allegation','Bribery & Corruption','Human Rights Concern','Product Safety','Tax Avoidance','Deforestation Link','Water Pollution','Carbon Misreporting','Diversity Shortfall','Executive Misconduct'];
  const sev=['Critical','High','Medium','Low'];
  const co=COMPANIES[Math.floor(sr(i*77)*COMPANIES.length)];
  return{id:i,company:co.name,ticker:co.ticker,type:types[Math.floor(sr(i*88)*types.length)],severity:sev[Math.floor(sr(i*99)*sev.length)],date:`2026-${String(Math.floor(sr(i*55)*3)+1).padStart(2,'0')}-${String(Math.floor(sr(i*66)*28)+1).padStart(2,'0')}`,resolved:sr(i*111)>0.6};
});

// ── 30 Alerts ────────────────────────────────────────────────────────────────
const SEVERITY_TIERS=['Critical','High','Medium','Low'];
const ALERT_TYPES=['Rating Downgrade','Divergence Spike','Coverage Drop','Greenwashing Flag','Controversy Detected','Provider Methodology Change','Threshold Breach','Momentum Shift','Peer Outlier','Regulatory Watch'];
const INIT_ALERTS=Array.from({length:30},(_,i)=>{
  const co=COMPANIES[Math.floor(sr(i*123)*COMPANIES.length)];
  const prov=PROVIDERS[Math.floor(sr(i*456)*PROVIDERS.length)];
  return{id:i,type:ALERT_TYPES[Math.floor(sr(i*789)*ALERT_TYPES.length)],severity:SEVERITY_TIERS[Math.floor(sr(i*321)*4)],company:co.name,provider:prov,description:`${ALERT_TYPES[Math.floor(sr(i*789)*ALERT_TYPES.length)]} detected for ${co.name} via ${prov}. Score delta: ${(sr(i*654)*3-1.5).toFixed(1)} notches.`,timestamp:`2026-03-${String(Math.floor(sr(i*987)*28)+1).padStart(2,'0')} ${String(Math.floor(sr(i*111)*12)+8).padStart(2,'0')}:${String(Math.floor(sr(i*222)*60)).padStart(2,'0')}`,status:'active',assignee:''};
});

// ── Sub-module links ─────────────────────────────────────────────────────────
const SUB_MODULES=[
  {key:'AK1',title:'Provider Divergence Analytics',path:'/esg-ratings/provider-divergence',desc:'Deep cross-provider rating comparison & methodology analysis',stat:'42 divergent pairs',color:T.navy},
  {key:'AK2',title:'Rating Migration Tracker',path:'/esg-ratings/migration-tracker',desc:'Track rating upgrades, downgrades, and watch-list movements',stat:'18 migrations QoQ',color:T.sage},
  {key:'AK3',title:'Controversy Overlay Engine',path:'/esg-ratings/controversy-overlay',desc:'Map 90 controversies to rating impact across providers',stat:'90 active controversies',color:T.red},
  {key:'AK4',title:'Greenwashing Detection',path:'/esg-ratings/greenwashing-detection',desc:'AI-powered greenwashing risk scoring vs provider ratings',stat:'12 high-risk flags',color:T.amber},
  {key:'AK5',title:'EU ESG Ratings Regulation Readiness',path:'/esg-ratings/eu-regulation',desc:'Compliance gap analysis for EU ESG Ratings Regulation 2024/3005',stat:'67% ready',color:T.gold},
];

// ── Provider agreement trend (12-quarter) ────────────────────────────────────
const AGREEMENT_TREND=QUARTERS.map((q,qi)=>{
  const base=62+sr(qi*17)*15;
  return{quarter:q,agreement:+base.toFixed(1),threshold:70};
});

// ── Styles ────────────────────────────────────────────────────────────────────
const s={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20},
  h1:{fontSize:26,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,marginTop:4},
  badge:{display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,marginLeft:8},
  tabs:{display:'flex',gap:2,marginBottom:20,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`},
  tab:(a)=>({padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:a?700:500,cursor:'pointer',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',transition:'all 0.2s'}),
  card:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16},
  cardH:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16,cursor:'pointer',transition:'box-shadow 0.2s'},
  kpi:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center',minWidth:140},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy},
  kpiLbl:{fontSize:11,color:T.textSec,marginTop:4,textTransform:'uppercase',letterSpacing:'0.5px'},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16},
  grid5:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12},
  tbl:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px',cursor:'pointer',userSelect:'none'},
  td:{padding:'8px 12px',borderBottom:`1px solid ${T.border}`,fontSize:12},
  btn:(bg=T.navy,c='#fff')=>({padding:'7px 16px',borderRadius:8,border:'none',background:bg,color:c,fontSize:12,fontWeight:600,cursor:'pointer'}),
  btnSm:(bg=T.navy,c='#fff')=>({padding:'4px 10px',borderRadius:6,border:'none',background:bg,color:c,fontSize:11,fontWeight:600,cursor:'pointer',marginRight:4}),
  input:{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,outline:'none',fontFamily:T.font,width:'100%'},
  select:{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,cursor:'pointer'},
  chip:(bg,c)=>({display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:bg,color:c}),
  toggle:(on)=>({width:36,height:20,borderRadius:10,background:on?T.sage:'#ccc',position:'relative',cursor:'pointer',border:'none',transition:'background 0.2s'}),
  toggleDot:(on)=>({width:16,height:16,borderRadius:8,background:'#fff',position:'absolute',top:2,left:on?18:2,transition:'left 0.2s'}),
  slider:{width:'100%',appearance:'none',height:6,borderRadius:3,background:T.border,outline:'none'},
  sevColor:(sev)=>sev==='Critical'?T.red:sev==='High'?T.amber:sev==='Medium'?T.gold:T.sage,
  pager:{display:'flex',gap:4,alignItems:'center',marginTop:12,justifyContent:'center'},
};

const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.amber,T.red];
const PROV_COLORS={MSCI:'#1b3a5c','S&P Global':'#c5a96a',Sustainalytics:'#5a8a6a','ISS ESG':'#2c5a8c',CDP:'#7ba67d',Refinitiv:'#d4be8a'};

// ── Helper components ─────────────────────────────────────────────────────────
const Pill=({text,bg,color})=><span style={s.chip(bg,color)}>{text}</span>;
const SevPill=({sev})=><Pill text={sev} bg={s.sevColor(sev)+'22'} color={s.sevColor(sev)}/>;
const Toggle=({on,onClick})=><button style={s.toggle(on)} onClick={onClick}><div style={s.toggleDot(on)}/></button>;

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function EsgRatingsHubPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Executive Dashboard','Portfolio Coverage','Consensus & Alerts','Board Report'];

  return(
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>ESG Ratings Intelligence Hub<span style={{...s.badge,background:T.navy+'15',color:T.navy}}>EP-AK6</span></h1>
          <div style={s.subtitle}>Unified command centre for multi-provider ESG ratings analytics across 150 companies, 6 providers, and 12 quarters</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:11,color:T.textMut}}>Last sync: 28 Mar 2026 09:15 UTC</span>
          <button style={s.btn(T.sage,'#fff')}>Refresh Data</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map((t,i)=><button key={i} style={s.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0&&<TabExecutive/>}
      {tab===1&&<TabCoverage/>}
      {tab===2&&<TabConsensus/>}
      {tab===3&&<TabBoardReport/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 1: EXECUTIVE DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function TabExecutive(){
  const [period,setPeriod]=useState('YTD');
  const [drillProvider,setDrillProvider]=useState(null);
  const periods=['Last Quarter','YTD','1Y','3Y'];

  const stats=useMemo(()=>{
    const active=COMPANIES.filter(c=>c.included);
    const avgR=active.reduce((a,c)=>a+c.avgScore,0)/active.length;
    const maxDiv=Math.max(...active.map(c=>c.maxDivergence));
    const cov=active.filter(c=>c.coverage>=3).length/active.length*100;
    const ups=active.filter(c=>c.momentum==='Upgrade').length;
    const downs=active.filter(c=>c.momentum==='Downgrade').length;
    const gw=active.filter(c=>c.greenwashRisk).length;
    const integrity=+(100-maxDiv*8-gw*2).toFixed(1);
    const contExp=active.reduce((a,c)=>a+c.controversies,0);
    // first mover: provider with most leading upgrades
    const provScores={};
    PROVIDERS.forEach(p=>{provScores[p]=0;active.forEach(c=>{if(c.ratings[p]){const idx=RATING_SCALE.indexOf(c.ratings[p]);if(idx<c.avgScore-0.5)provScores[p]++;}});});
    const firstMover=Object.entries(provScores).sort((a,b)=>b[1]-a[1])[0]?.[0]||'MSCI';
    return{avgR:RATING_SCALE[Math.round(avgR)]||'BBB',consensus:+(avgR).toFixed(2),maxDiv,cov:+cov.toFixed(1),ups,downs,gw,integrity:Math.max(0,integrity),firstMover,contExp};
  },[]);

  const kpis=[
    {label:'Avg Rating',value:stats.avgR,sub:`Score: ${stats.consensus}`,color:T.navy},
    {label:'Consensus Score',value:stats.consensus.toFixed(1),sub:'Lower = better',color:T.sage},
    {label:'Max Divergence',value:`${stats.maxDiv} notch${stats.maxDiv!==1?'es':''}`,sub:'Across providers',color:stats.maxDiv>=4?T.red:T.amber},
    {label:'Coverage',value:`${stats.cov}%`,sub:'3+ providers',color:T.sage},
    {label:'Upgrades QoQ',value:stats.ups,sub:'Positive momentum',color:T.green},
    {label:'Downgrades QoQ',value:stats.downs,sub:'Negative momentum',color:T.red},
    {label:'Greenwashing Alerts',value:stats.gw,sub:'High-risk flagged',color:stats.gw>10?T.red:T.amber},
    {label:'Integrity Score',value:`${stats.integrity}%`,sub:'Data quality index',color:stats.integrity>80?T.sage:T.amber},
    {label:'First Mover Provider',value:stats.firstMover,sub:'Most leading ratings',color:T.gold},
    {label:'Controversy Exposure',value:stats.contExp,sub:'Total incidents',color:stats.contExp>100?T.red:T.amber},
  ];

  // Top 10 divergent companies
  const [divSort,setDivSort]=useState('maxDivergence');
  const [divDir,setDivDir]=useState(true);
  const topDiv=useMemo(()=>[...COMPANIES].sort((a,b)=>divDir?b[divSort]-a[divSort]:a[divSort]-b[divSort]).slice(0,10),[divSort,divDir]);

  // Rating distribution
  const distData=useMemo(()=>{
    if(drillProvider){
      return RATING_SCALE.map(r=>({rating:r,count:COMPANIES.filter(c=>c.ratings[drillProvider]===r).length}));
    }
    return RATING_SCALE.map(r=>({rating:r,count:COMPANIES.filter(c=>c.avgRating===r).length}));
  },[drillProvider]);

  // Provider radar: average score per provider
  const providerRadar=useMemo(()=>PROVIDERS.map(p=>{
    const scores=COMPANIES.filter(c=>c.ratings[p]).map(c=>RATING_SCALE.indexOf(c.ratings[p]));
    const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:3;
    const cov=scores.length;
    return{provider:p,avgScore:+(7-avg).toFixed(2),coverage:cov,methodology:+(sr(PROVIDERS.indexOf(p)*77)*3+5).toFixed(1),timeliness:+(sr(PROVIDERS.indexOf(p)*99)*2+6).toFixed(1)};
  }),[]);

  // Sector performance radar
  const sectorPerf=useMemo(()=>SECTORS.slice(0,8).map(sec=>{
    const cos=COMPANIES.filter(c=>c.sector===sec&&c.included);
    const avg=cos.length?cos.reduce((a,c)=>a+c.avgScore,0)/cos.length:3;
    return{sector:sec,score:+(7-avg).toFixed(2),companies:cos.length};
  }),[]);

  // E/S/G pillar breakdown (simulated)
  const pillarData=useMemo(()=>PROVIDERS.map((p,pi)=>({
    provider:p,
    E:+(sr(pi*41)*2+4).toFixed(1),
    S:+(sr(pi*53)*2+3.5).toFixed(1),
    G:+(sr(pi*67)*2+4.5).toFixed(1),
  })),[]);

  // Hot spots
  const hotSpots=[
    {title:'Energy Sector Divergence Spike',desc:'Energy companies show 2.3x average divergence vs portfolio mean. MSCI and Sustainalytics disagree most on transition readiness scores.'},
    {title:'CDP Coverage Gap Widening',desc:'CDP coverage dropped 8% QoQ as 12 companies missed submission deadlines. Utilities and Materials sectors most affected.'},
    {title:'Greenwashing Cluster in Consumer Discretionary',desc:'5 consumer companies flagged for inconsistent emissions disclosures vs rated performance. ISS ESG leads detection.'},
    {title:'S&P Global Methodology Shift',desc:'S&P Global updated corporate governance weighting in Q1 2026, causing 14 Financials companies to shift by 1+ notch. Monitor for cascading re-ratings.'},
    {title:'Emerging Market Coverage Deficit',desc:'Companies with primary operations in EM regions have 40% lower provider coverage than developed market peers. 22 companies affected in portfolio.'},
  ];

  // Daily briefing
  const briefing=[
    'MSCI upgraded 3 Technology companies overnight citing improved data privacy governance scores.',
    'Sustainalytics downgraded Shell and TotalEnergies on updated scope 3 methodology; divergence with S&P widened to 4 notches.',
    'CDP released 2025 climate scores: 67% of portfolio achieved A or A- list, up from 61% last year.',
    'EU ESG Ratings Regulation consultation response deadline is 15 April 2026; 23 companies still lack readiness assessment.',
    'Portfolio integrity score improved 2.1% this quarter driven by better ISS ESG data completeness.',
  ];

  return(<>
    {/* Period selector */}
    <div style={{display:'flex',gap:8,marginBottom:16}}>
      {periods.map(p=><button key={p} style={s.btn(period===p?T.navy:T.surface,period===p?'#fff':T.textSec)} onClick={()=>setPeriod(p)}>{p}</button>)}
    </div>

    {/* 10 KPI cards */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
      {kpis.map((k,i)=>(
        <div key={i} style={s.kpi}>
          <div style={{...s.kpiVal,color:k.color}}>{k.value}</div>
          <div style={s.kpiLbl}>{k.label}</div>
          <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{k.sub}</div>
        </div>
      ))}
    </div>

    <div style={s.grid2}>
      {/* Provider agreement trend */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Provider Agreement Trend (12Q)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={AGREEMENT_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10}} interval={1}/>
            <YAxis domain={[50,85]} tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Area type="monotone" dataKey="agreement" stroke={T.navy} fill={T.navy+'30'} strokeWidth={2}/>
            <Area type="monotone" dataKey="threshold" stroke={T.red} fill="none" strokeWidth={1} strokeDasharray="5 5"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rating distribution donut */}
      <div style={s.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontWeight:700,color:T.navy}}>Rating Distribution {drillProvider?`(${drillProvider})`:''}</span>
          <select style={s.select} value={drillProvider||''} onChange={e=>setDrillProvider(e.target.value||null)}>
            <option value="">All Providers</option>
            {PROVIDERS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={distData} dataKey="count" nameKey="rating" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
              {distData.map((d,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Provider Radar + E/S/G Pillar */}
    <div style={s.grid2}>
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Provider Quality Radar</div>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={providerRadar}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="provider" tick={{fontSize:10}}/>
            <PolarRadiusAxis tick={{fontSize:9}} domain={[0,8]}/>
            <Radar name="Avg Score" dataKey="avgScore" stroke={T.navy} fill={T.navy+'30'} strokeWidth={2}/>
            <Radar name="Methodology" dataKey="methodology" stroke={T.gold} fill={T.gold+'20'} strokeWidth={2}/>
            <Radar name="Timeliness" dataKey="timeliness" stroke={T.sage} fill={T.sage+'20'} strokeWidth={2}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>E / S / G Pillar Scores by Provider</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={pillarData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="provider" tick={{fontSize:9}} interval={0}/>
            <YAxis domain={[0,8]} tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="E" fill={T.sage} name="Environmental" radius={[2,2,0,0]}/>
            <Bar dataKey="S" fill={T.gold} name="Social" radius={[2,2,0,0]}/>
            <Bar dataKey="G" fill={T.navy} name="Governance" radius={[2,2,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Sector performance */}
    <div style={s.card}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Sector ESG Performance Overview</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sectorPerf} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number" domain={[0,7]} tick={{fontSize:10}}/>
          <YAxis dataKey="sector" type="category" tick={{fontSize:10}} width={130}/>
          <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={(v,name)=>[`${v} / 7.0`,name]}/>
          <Bar dataKey="score" fill={T.navy} name="ESG Score" radius={[0,4,4,0]}>
            {sectorPerf.map((d,i)=><Cell key={i} fill={d.score>=5?T.sage:d.score>=3.5?T.gold:T.red}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Top 10 divergent companies */}
    <div style={s.card}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Top 10 Most Divergent Companies</div>
      <table style={s.tbl}>
        <thead><tr>
          {['Rank','Company','Ticker','Sector','Avg Rating','Max Divergence','Momentum'].map(h=>(
            <th key={h} style={s.th} onClick={()=>{if(h==='Max Divergence'){setDivDir(!divDir);setDivSort('maxDivergence');}if(h==='Avg Rating'){setDivDir(!divDir);setDivSort('avgScore');}}}>{h}{(h==='Max Divergence'&&divSort==='maxDivergence')?(divDir?' \u2193':' \u2191'):''}</th>
          ))}
        </tr></thead>
        <tbody>
          {topDiv.map((c,i)=>(
            <tr key={c.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
              <td style={s.td}>{i+1}</td>
              <td style={{...s.td,fontWeight:600}}>{c.name}</td>
              <td style={{...s.td,fontFamily:T.mono,fontSize:11}}>{c.ticker}</td>
              <td style={s.td}>{c.sector}</td>
              <td style={s.td}><Pill text={c.avgRating} bg={T.navy+'15'} color={T.navy}/></td>
              <td style={{...s.td,fontWeight:700,color:c.maxDivergence>=4?T.red:c.maxDivergence>=2?T.amber:T.sage}}>{c.maxDivergence} notch{c.maxDivergence!==1?'es':''}</td>
              <td style={s.td}><Pill text={c.momentum} bg={c.momentum==='Upgrade'?T.green+'20':c.momentum==='Downgrade'?T.red+'20':T.textMut+'20'} color={c.momentum==='Upgrade'?T.green:c.momentum==='Downgrade'?T.red:T.textMut}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Sub-module cards */}
    <div style={{fontWeight:700,color:T.navy,marginBottom:12,fontSize:15}}>Sprint AK Modules</div>
    <div style={s.grid5}>
      {SUB_MODULES.map(m=>(
        <div key={m.key} style={{...s.cardH,borderLeft:`4px solid ${m.color}`}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px #0001'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
          <div style={{fontSize:10,fontWeight:700,color:m.color,marginBottom:4}}>{m.key}</div>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6}}>{m.title}</div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:10,lineHeight:1.4}}>{m.desc}</div>
          <div style={{fontSize:12,fontWeight:700,color:m.color,marginBottom:8}}>{m.stat}</div>
          <button style={s.btn(m.color,'#fff')} onClick={()=>window.location.hash=m.path}>Open &rarr;</button>
        </div>
      ))}
    </div>

    {/* Provider methodology comparison */}
    <div style={{...s.card,marginTop:16}}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Provider Methodology Comparison</div>
      <table style={s.tbl}>
        <thead><tr>
          <th style={s.th}>Attribute</th>
          {PROVIDERS.map(p=><th key={p} style={{...s.th,fontSize:10,textAlign:'center'}}>{p}</th>)}
        </tr></thead>
        <tbody>
          {[
            {attr:'E Weight',vals:['35%','30%','40%','33%','50%','25%']},
            {attr:'S Weight',vals:['30%','35%','25%','33%','20%','35%']},
            {attr:'G Weight',vals:['35%','35%','35%','34%','30%','40%']},
            {attr:'Data Sources',vals:['Public + Survey','Public + AI','Public + Engage','Public','Self-report','Public + NLP']},
            {attr:'Update Frequency',vals:['Annual','Monthly','Semi-annual','Annual','Annual','Quarterly']},
            {attr:'Scale Type',vals:['AAA-CCC','1-100','0-100','A+-D-','A-D-','0-100']},
            {attr:'Controversy Adj.',vals:['Yes','Yes','Yes','No','N/A','Yes']},
            {attr:'Industry Adjusted',vals:['Yes','Yes','Yes','Yes','Partial','Yes']},
            {attr:'Transparency',vals:['Medium','High','Medium','Low','High','Medium']},
          ].map((row,i)=>(
            <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
              <td style={{...s.td,fontWeight:600}}>{row.attr}</td>
              {row.vals.map((v,j)=><td key={j} style={{...s.td,fontSize:11,textAlign:'center'}}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Momentum timeline */}
    <div style={{...s.card,marginTop:16}}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Rating Momentum Timeline (12Q)</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={QUARTERS.map((q,qi)=>({
          quarter:q,
          upgrades:Math.floor(sr(qi*41)*8+5),
          downgrades:Math.floor(sr(qi*53)*6+2),
          netMomentum:Math.floor(sr(qi*41)*8+5)-Math.floor(sr(qi*53)*6+2),
        }))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="quarter" tick={{fontSize:10}} interval={1}/>
          <YAxis tick={{fontSize:10}}/>
          <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
          <Line type="monotone" dataKey="upgrades" stroke={T.green} strokeWidth={2} name="Upgrades"/>
          <Line type="monotone" dataKey="downgrades" stroke={T.red} strokeWidth={2} name="Downgrades"/>
          <Line type="monotone" dataKey="netMomentum" stroke={T.navy} strokeWidth={2} strokeDasharray="5 5" name="Net"/>
          <Legend wrapperStyle={{fontSize:10}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div style={{...s.grid2,marginTop:16}}>
      {/* Hot spots */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Hot Spots &mdash; Auto-Detected Patterns</div>
        {hotSpots.map((h,i)=>(
          <div key={i} style={{padding:'10px 0',borderBottom:i<hotSpots.length-1?`1px solid ${T.border}`:'none'}}>
            <div style={{fontWeight:600,fontSize:13,color:T.amber,marginBottom:4}}>{h.title}</div>
            <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{h.desc}</div>
          </div>
        ))}
      </div>

      {/* Daily briefing */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Daily Briefing &mdash; 28 Mar 2026</div>
        {briefing.map((b,i)=>(
          <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:i<briefing.length-1?`1px solid ${T.border}`:'none'}}>
            <span style={{fontWeight:700,color:T.gold,fontSize:13,minWidth:20}}>{i+1}</span>
            <span style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  </>);
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 2: PORTFOLIO COVERAGE
// ══════════════════════════════════════════════════════════════════════════════
function TabCoverage(){
  const [search,setSearch]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [coverageMin,setCoverageMin]=useState(0);
  const [page,setPage]=useState(0);
  const [companies,setCompanies]=useState(()=>COMPANIES.map(c=>({...c})));
  const PER_PAGE=20;

  const filtered=useMemo(()=>{
    let f=companies.filter(c=>c.included);
    if(search)f=f.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.ticker.toLowerCase().includes(search.toLowerCase()));
    if(sectorFilter!=='All')f=f.filter(c=>c.sector===sectorFilter);
    if(coverageMin>0)f=f.filter(c=>c.coverage>=coverageMin);
    return f;
  },[search,sectorFilter,coverageMin,companies]);

  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const totalPages=Math.ceil(filtered.length/PER_PAGE);

  const toggleCompany=(id)=>{
    setCompanies(prev=>prev.map(c=>c.id===id?{...c,included:!c.included}:c));
  };

  // Coverage heatmap data
  const heatmapData=useMemo(()=>filtered.slice(0,30).map(c=>{
    const row={name:c.name};
    PROVIDERS.forEach(p=>{row[p]=c.ratings[p]?RATING_SCALE.indexOf(c.ratings[p]):null;});
    return row;
  }),[filtered]);

  // Gap analysis
  const gapData=useMemo(()=>PROVIDERS.map(p=>{
    const missing=COMPANIES.filter(c=>c.included&&!c.ratings[p]).length;
    const covered=COMPANIES.filter(c=>c.included&&c.ratings[p]).length;
    return{provider:p,covered,missing};
  }),[companies]);

  // Coverage trend (12Q)
  const coverageTrend=QUARTERS.map((q,qi)=>{
    const base=72+sr(qi*29)*12;
    return{quarter:q,coverage:+base.toFixed(1)};
  });

  const handleExportCSV=useCallback(()=>{
    const headers=['Company','Ticker','Sector',...PROVIDERS,'Coverage','Avg Rating'];
    const rows=filtered.map(c=>[c.name,c.ticker,c.sector,...PROVIDERS.map(p=>c.ratings[p]||''),c.coverage,c.avgRating]);
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='esg_coverage_report.csv';a.click();URL.revokeObjectURL(url);
  },[filtered]);

  // Recommend providers for under-covered
  const underCovered=useMemo(()=>filtered.filter(c=>c.coverage<=2).slice(0,10),[filtered]);

  return(<>
    {/* Filters */}
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
      <input style={{...s.input,width:240}} placeholder="Search company or ticker..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
      <select style={s.select} value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPage(0);}}>
        <option value="All">All Sectors</option>
        {SECTORS.map(sec=><option key={sec} value={sec}>{sec}</option>)}
      </select>
      <div style={{fontSize:12,color:T.textSec}}>Min coverage:</div>
      <select style={s.select} value={coverageMin} onChange={e=>{setCoverageMin(+e.target.value);setPage(0);}}>
        {[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}+ providers</option>)}
      </select>
      <button style={s.btn(T.gold,'#fff')} onClick={handleExportCSV}>Export CSV</button>
      <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} companies</span>
    </div>

    {/* Company table */}
    <div style={{...s.card,overflowX:'auto'}}>
      <table style={s.tbl}>
        <thead><tr>
          <th style={s.th}></th>
          <th style={s.th}>Company</th>
          <th style={s.th}>Ticker</th>
          <th style={s.th}>Sector</th>
          {PROVIDERS.map(p=><th key={p} style={{...s.th,fontSize:10,minWidth:65,textAlign:'center'}}>{p}</th>)}
          <th style={s.th}>Coverage</th>
          <th style={s.th}>Avg</th>
        </tr></thead>
        <tbody>
          {paged.map((c,i)=>(
            <tr key={c.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
              <td style={s.td}><button style={s.btnSm(T.red+'20',T.red)} onClick={()=>toggleCompany(c.id)} title="Remove">&times;</button></td>
              <td style={{...s.td,fontWeight:600,whiteSpace:'nowrap'}}>{c.name}</td>
              <td style={{...s.td,fontFamily:T.mono,fontSize:11}}>{c.ticker}</td>
              <td style={{...s.td,fontSize:11}}>{c.sector}</td>
              {PROVIDERS.map(p=>(
                <td key={p} style={{...s.td,textAlign:'center',fontSize:11}}>
                  {c.ratings[p]?<span style={{...s.chip(p==='MSCI'?T.navy+'15':p==='CDP'?T.sage+'15':T.gold+'15',T.navy),fontSize:10}}>{c.ratings[p]}</span>:<span style={{color:T.textMut}}>--</span>}
                </td>
              ))}
              <td style={{...s.td,fontWeight:600}}>{c.coverage}/{c.totalProviders}</td>
              <td style={s.td}><Pill text={c.avgRating} bg={T.navy+'15'} color={T.navy}/></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div style={s.pager}>
        <button style={s.btnSm(page>0?T.navy:T.border,page>0?'#fff':T.textMut)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>&laquo; Prev</button>
        <span style={{fontSize:11,color:T.textSec}}>Page {page+1} of {totalPages}</span>
        <button style={s.btnSm(page<totalPages-1?T.navy:T.border,page<totalPages-1?'#fff':T.textMut)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next &raquo;</button>
      </div>
    </div>

    <div style={s.grid2}>
      {/* Coverage heatmap */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Coverage Heatmap (Top 30)</div>
        <div style={{overflowX:'auto',maxHeight:380,overflowY:'auto'}}>
          <table style={{...s.tbl,fontSize:10}}>
            <thead><tr><th style={{...s.th,fontSize:9}}>Company</th>{PROVIDERS.map(p=><th key={p} style={{...s.th,fontSize:9,textAlign:'center',minWidth:55}}>{p.split(' ')[0]}</th>)}</tr></thead>
            <tbody>
              {heatmapData.map((r,i)=>(
                <tr key={i}>
                  <td style={{...s.td,fontSize:10,whiteSpace:'nowrap'}}>{r.name}</td>
                  {PROVIDERS.map(p=>{
                    const v=r[p];
                    const bg=v===null?T.textMut+'15':v<=1?T.green+'40':v<=3?T.gold+'40':T.red+'40';
                    return<td key={p} style={{...s.td,textAlign:'center',background:bg,fontSize:10}}>{v!==null?RATING_SCALE[v]:'-'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gap analysis */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Coverage Gap Analysis by Provider</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={gapData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10}}/>
            <YAxis dataKey="provider" type="category" tick={{fontSize:10}} width={90}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="covered" stackId="a" fill={T.sage} name="Covered"/>
            <Bar dataKey="missing" stackId="a" fill={T.red+'80'} name="Missing"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={s.grid2}>
      {/* Coverage trend */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Portfolio Coverage Trend (12Q)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={coverageTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10}} interval={1}/>
            <YAxis domain={[60,95]} tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Line type="monotone" dataKey="coverage" stroke={T.navy} strokeWidth={2} dot={{r:3}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Provider recommendations */}
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Recommended Providers for Under-Covered Companies</div>
        {underCovered.length===0?<div style={{fontSize:12,color:T.textMut}}>All companies have adequate coverage.</div>:
        <table style={s.tbl}>
          <thead><tr><th style={s.th}>Company</th><th style={s.th}>Current</th><th style={s.th}>Recommended</th></tr></thead>
          <tbody>
            {underCovered.map((c,i)=>{
              const missing=PROVIDERS.filter(p=>!c.ratings[p]);
              return(
                <tr key={c.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
                  <td style={{...s.td,fontWeight:600}}>{c.name}</td>
                  <td style={s.td}>{c.coverage}/{c.totalProviders}</td>
                  <td style={s.td}>{missing.slice(0,3).map(p=><span key={p} style={{...s.chip(T.sage+'20',T.sage),marginRight:4}}>{p}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>}
      </div>
    </div>

    {/* Coverage statistics summary */}
    <div style={s.card}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Coverage Statistics Summary</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
        {PROVIDERS.map(p=>{
          const cov=COMPANIES.filter(c=>c.included&&c.ratings[p]).length;
          const pct=+(cov/COMPANIES.filter(c=>c.included).length*100).toFixed(1);
          const avgIdx=COMPANIES.filter(c=>c.ratings[p]).map(c=>RATING_SCALE.indexOf(c.ratings[p]));
          const avg=avgIdx.length?+(avgIdx.reduce((a,b)=>a+b,0)/avgIdx.length).toFixed(2):0;
          return(
            <div key={p} style={{...s.kpi,borderLeft:`3px solid ${PROV_COLORS[p]||T.navy}`}}>
              <div style={{fontSize:11,fontWeight:700,color:PROV_COLORS[p]||T.navy,marginBottom:6}}>{p}</div>
              <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{cov}</div>
              <div style={{fontSize:10,color:T.textMut}}>{pct}% coverage</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>Avg: {RATING_SCALE[Math.round(avg)]||'N/A'}</div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Provider correlation matrix */}
    <div style={s.card}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Provider Rating Correlation Matrix</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Pairwise agreement rate (%) between providers on overlapping companies</div>
      <table style={{...s.tbl,fontSize:10}}>
        <thead><tr><th style={{...s.th,fontSize:9}}></th>{PROVIDERS.map(p=><th key={p} style={{...s.th,fontSize:9,textAlign:'center'}}>{p.split(' ')[0]}</th>)}</tr></thead>
        <tbody>
          {PROVIDERS.map((p1,i)=>(
            <tr key={p1}>
              <td style={{...s.td,fontWeight:600,fontSize:10}}>{p1}</td>
              {PROVIDERS.map((p2,j)=>{
                if(i===j)return<td key={p2} style={{...s.td,textAlign:'center',background:T.navy+'15',fontWeight:700}}>100</td>;
                const overlap=COMPANIES.filter(c=>c.ratings[p1]&&c.ratings[p2]);
                const agree=overlap.filter(c=>Math.abs(RATING_SCALE.indexOf(c.ratings[p1])-RATING_SCALE.indexOf(c.ratings[p2]))<=1).length;
                const pct=overlap.length?Math.round(agree/overlap.length*100):0;
                const bg=pct>=70?T.green+'20':pct>=50?T.gold+'20':T.red+'20';
                return<td key={p2} style={{...s.td,textAlign:'center',background:bg,fontWeight:600}}>{pct}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>);
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 3: CONSENSUS & ALERTS
// ══════════════════════════════════════════════════════════════════════════════
function TabConsensus(){
  const [weights,setWeights]=useState(()=>Object.fromEntries(PROVIDERS.map(p=>[p,Math.round(100/PROVIDERS.length)])));
  const [alertsState,setAlertsState]=useState(INIT_ALERTS);
  const [alertFilter,setAlertFilter]=useState('All');
  const [alertPage,setAlertPage]=useState(0);
  const [conPage,setConPage]=useState(0);
  const [showBuilder,setShowBuilder]=useState(false);
  const [showHistory,setShowHistory]=useState(false);
  const [showNotifPrefs,setShowNotifPrefs]=useState(false);
  const [newAlert,setNewAlert]=useState({type:ALERT_TYPES[0],threshold:2,sectors:[]});
  const [notifPrefs,setNotifPrefs]=useState({email:true,inApp:true,webhook:false});
  const CON_PER_PAGE=20;

  const presets={
    Equal:Object.fromEntries(PROVIDERS.map(p=>[p,Math.round(100/PROVIDERS.length)])),
    'Market-Cap Weighted':Object.fromEntries(PROVIDERS.map((p,i)=>[p,[30,25,18,12,8,7][i]])),
    'Quality-Adjusted':Object.fromEntries(PROVIDERS.map((p,i)=>[p,[28,22,20,15,10,5][i]])),
  };

  const consensus=useMemo(()=>{
    const totalW=Object.values(weights).reduce((a,b)=>a+b,0)||1;
    return COMPANIES.filter(c=>c.included).map(c=>{
      let wSum=0,wDiv=0;
      PROVIDERS.forEach(p=>{
        if(c.ratings[p]){
          const idx=RATING_SCALE.indexOf(c.ratings[p]);
          wSum+=idx*(weights[p]/totalW);
          wDiv+=weights[p]/totalW;
        }
      });
      const wAvg=wDiv>0?wSum/wDiv:3;
      return{...c,wConsensus:+wAvg.toFixed(2),wRating:RATING_SCALE[Math.round(wAvg)]||'BBB'};
    }).sort((a,b)=>a.wConsensus-b.wConsensus);
  },[weights]);

  const conPaged=consensus.slice(conPage*CON_PER_PAGE,(conPage+1)*CON_PER_PAGE);
  const conTotalPages=Math.ceil(consensus.length/CON_PER_PAGE);

  // Alert filtering
  const activeAlerts=alertsState.filter(a=>a.status==='active');
  const filteredAlerts=alertFilter==='All'?activeAlerts:activeAlerts.filter(a=>a.severity===alertFilter);
  const alertsPaged=filteredAlerts.slice(alertPage*10,(alertPage+1)*10);
  const alertTotalPages=Math.ceil(filteredAlerts.length/10);

  const resolvedAlerts=alertsState.filter(a=>a.status!=='active').slice(0,50);

  const handleAlertAction=(id,action)=>{
    setAlertsState(prev=>prev.map(a=>a.id===id?{...a,status:action==='Dismiss'?'dismissed':action==='Acknowledge'?'acknowledged':action==='Escalate'?'escalated':'assigned',assignee:action==='Assign'?'Risk Team':''}:a));
  };

  return(<>
    {/* Provider weight sliders */}
    <div style={s.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontWeight:700,color:T.navy}}>Provider Weights</span>
        <div style={{display:'flex',gap:6}}>
          {Object.keys(presets).map(p=><button key={p} style={s.btnSm(T.gold+'20',T.gold)} onClick={()=>setWeights(presets[p])}>{p}</button>)}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:16}}>
        {PROVIDERS.map(p=>(
          <div key={p} style={{textAlign:'center'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6}}>{p}</div>
            <input type="range" min={0} max={100} value={weights[p]} onChange={e=>setWeights(prev=>({...prev,[p]:+e.target.value}))} style={s.slider}/>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginTop:4}}>{weights[p]}%</div>
          </div>
        ))}
      </div>
    </div>

    {/* Consensus distribution chart */}
    <div style={s.grid2}>
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Weighted Consensus Distribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={RATING_SCALE.map(r=>({rating:r,count:consensus.filter(c=>c.wRating===r).length}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="rating" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="count" name="Companies" radius={[4,4,0,0]}>
              {RATING_SCALE.map((r,i)=><Cell key={i} fill={i<=1?T.sage:i<=3?T.gold:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Consensus vs Simple Average</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={RATING_SCALE.map(r=>({rating:r,weighted:consensus.filter(c=>c.wRating===r).length,simple:COMPANIES.filter(c=>c.avgRating===r&&c.included).length}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="rating" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="weighted" fill={T.navy} name="Weighted" radius={[4,4,0,0]}/>
            <Bar dataKey="simple" fill={T.gold+'99'} name="Simple Avg" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Consensus table */}
    <div style={s.card}>
      <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Weighted Consensus ({consensus.length} companies)</div>
      <div style={{overflowX:'auto'}}>
        <table style={s.tbl}>
          <thead><tr>
            <th style={s.th}>#</th><th style={s.th}>Company</th><th style={s.th}>Ticker</th><th style={s.th}>Sector</th>
            {PROVIDERS.map(p=><th key={p} style={{...s.th,fontSize:10,textAlign:'center'}}>{p.split(' ')[0]}</th>)}
            <th style={s.th}>W.Consensus</th><th style={s.th}>W.Rating</th>
          </tr></thead>
          <tbody>
            {conPaged.map((c,i)=>(
              <tr key={c.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={s.td}>{conPage*CON_PER_PAGE+i+1}</td>
                <td style={{...s.td,fontWeight:600,whiteSpace:'nowrap'}}>{c.name}</td>
                <td style={{...s.td,fontFamily:T.mono,fontSize:11}}>{c.ticker}</td>
                <td style={{...s.td,fontSize:11}}>{c.sector}</td>
                {PROVIDERS.map(p=><td key={p} style={{...s.td,textAlign:'center',fontSize:10}}>{c.ratings[p]||<span style={{color:T.textMut}}>--</span>}</td>)}
                <td style={{...s.td,fontWeight:700,fontFamily:T.mono}}>{c.wConsensus.toFixed(2)}</td>
                <td style={s.td}><Pill text={c.wRating} bg={T.navy+'15'} color={T.navy}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={s.pager}>
        <button style={s.btnSm(conPage>0?T.navy:T.border,conPage>0?'#fff':T.textMut)} disabled={conPage===0} onClick={()=>setConPage(p=>p-1)}>&laquo; Prev</button>
        <span style={{fontSize:11,color:T.textSec}}>Page {conPage+1} of {conTotalPages}</span>
        <button style={s.btnSm(conPage<conTotalPages-1?T.navy:T.border,conPage<conTotalPages-1?'#fff':T.textMut)} disabled={conPage>=conTotalPages-1} onClick={()=>setConPage(p=>p+1)}>Next &raquo;</button>
      </div>
    </div>

    {/* Alert severity distribution */}
    <div style={s.grid2}>
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Alert Severity Distribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={SEVERITY_TIERS.map(sev=>({name:sev,value:activeAlerts.filter(a=>a.severity===sev).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3}>
              {SEVERITY_TIERS.map((sev,i)=><Cell key={i} fill={[T.red,T.amber,T.gold,T.sage][i]}/>)}
            </Pie>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={s.card}>
        <div style={{fontWeight:700,marginBottom:12,color:T.navy}}>Alerts by Type</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ALERT_TYPES.map(t=>({type:t.length>15?t.slice(0,15)+'...':t,count:activeAlerts.filter(a=>a.type===t).length})).filter(d=>d.count>0)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10}}/>
            <YAxis dataKey="type" type="category" tick={{fontSize:9}} width={120}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="count" fill={T.navy} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Alert Engine */}
    <div style={s.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <span style={{fontWeight:700,color:T.navy}}>Alert Engine</span>
          <span style={{fontSize:11,color:T.textMut,marginLeft:8}}>{activeAlerts.length} active alerts</span>
        </div>
        <div style={{display:'flex',gap:6}}>
          {['All',...SEVERITY_TIERS].map(f=><button key={f} style={s.btnSm(alertFilter===f?T.navy:T.surface+' ',alertFilter===f?'#fff':T.textSec)} onClick={()=>{setAlertFilter(f);setAlertPage(0);}}>{f}{f!=='All'?` (${activeAlerts.filter(a=>a.severity===f).length})`:''}</button>)}
          <button style={s.btnSm(T.gold,'#fff')} onClick={()=>setShowBuilder(!showBuilder)}>+ Custom Alert</button>
          <button style={s.btnSm(T.navyL,'#fff')} onClick={()=>setShowHistory(!showHistory)}>History</button>
          <button style={s.btnSm(T.sage,'#fff')} onClick={()=>setShowNotifPrefs(!showNotifPrefs)}>Notifications</button>
        </div>
      </div>

      {/* Alert list */}
      <div style={{maxHeight:400,overflowY:'auto'}}>
        {alertsPaged.map(a=>(
          <div key={a.id} style={{padding:'12px 16px',marginBottom:8,borderRadius:10,border:`1px solid ${s.sevColor(a.severity)}30`,background:s.sevColor(a.severity)+'08',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <SevPill sev={a.severity}/>
                <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{a.type}</span>
                <span style={{fontSize:10,color:T.textMut}}>{a.timestamp}</span>
              </div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:4}}>{a.description}</div>
              <div style={{fontSize:11,color:T.textMut}}>Company: <b>{a.company}</b> &middot; Provider: {a.provider}</div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0,marginLeft:12}}>
              {['Dismiss','Acknowledge','Escalate','Assign'].map(act=>(
                <button key={act} style={s.btnSm(act==='Escalate'?T.red+'20':act==='Dismiss'?T.textMut+'20':act==='Assign'?T.sage+'20':T.gold+'20',act==='Escalate'?T.red:act==='Dismiss'?T.textMut:act==='Assign'?T.sage:T.gold)} onClick={()=>handleAlertAction(a.id,act)}>{act}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {filteredAlerts.length>10&&<div style={s.pager}>
        <button style={s.btnSm(alertPage>0?T.navy:T.border,alertPage>0?'#fff':T.textMut)} disabled={alertPage===0} onClick={()=>setAlertPage(p=>p-1)}>&laquo;</button>
        <span style={{fontSize:11,color:T.textSec}}>Page {alertPage+1} of {alertTotalPages}</span>
        <button style={s.btnSm(alertPage<alertTotalPages-1?T.navy:T.border,alertPage<alertTotalPages-1?'#fff':T.textMut)} disabled={alertPage>=alertTotalPages-1} onClick={()=>setAlertPage(p=>p+1)}>&raquo;</button>
      </div>}
    </div>

    {/* Custom alert builder */}
    {showBuilder&&<div style={s.card}>
      <div style={{fontWeight:700,color:T.navy,marginBottom:12}}>Custom Alert Builder</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Alert Type</div>
          <select style={{...s.select,width:'100%'}} value={newAlert.type} onChange={e=>setNewAlert(p=>({...p,type:e.target.value}))}>
            {ALERT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Threshold (notches)</div>
          <input type="number" min={1} max={6} value={newAlert.threshold} onChange={e=>setNewAlert(p=>({...p,threshold:+e.target.value}))} style={{...s.input,width:'100%'}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Watch Sectors</div>
          <select style={{...s.select,width:'100%'}} multiple size={3} onChange={e=>setNewAlert(p=>({...p,sectors:Array.from(e.target.selectedOptions,o=>o.value)}))}>
            {SECTORS.map(sec=><option key={sec} value={sec}>{sec}</option>)}
          </select>
        </div>
        <div style={{display:'flex',alignItems:'flex-end'}}>
          <button style={s.btn(T.sage,'#fff')} onClick={()=>{setShowBuilder(false);}}>Save Alert Rule</button>
        </div>
      </div>
    </div>}

    {/* Alert history */}
    {showHistory&&<div style={s.card}>
      <div style={{fontWeight:700,color:T.navy,marginBottom:12}}>Resolved Alerts (Last 50)</div>
      {resolvedAlerts.length===0?<div style={{fontSize:12,color:T.textMut}}>No resolved alerts yet.</div>:
      <div style={{maxHeight:300,overflowY:'auto'}}>
        {resolvedAlerts.map(a=>(
          <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
            <div><SevPill sev={a.severity}/> <span style={{fontWeight:600,marginLeft:6}}>{a.type}</span> &mdash; {a.company}</div>
            <div><Pill text={a.status} bg={T.sage+'20'} color={T.sage}/></div>
          </div>
        ))}
      </div>}
    </div>}

    {/* Notification preferences */}
    {showNotifPrefs&&<div style={s.card}>
      <div style={{fontWeight:700,color:T.navy,marginBottom:12}}>Notification Preferences</div>
      <div style={{display:'flex',gap:32}}>
        {[{key:'email',label:'Email'},{key:'inApp',label:'In-App'},{key:'webhook',label:'Webhook'}].map(n=>(
          <div key={n.key} style={{display:'flex',alignItems:'center',gap:8}}>
            <Toggle on={notifPrefs[n.key]} onClick={()=>setNotifPrefs(p=>({...p,[n.key]:!p[n.key]}))}/>
            <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>}
  </>);
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 4: BOARD REPORT
// ══════════════════════════════════════════════════════════════════════════════
function TabBoardReport(){
  const [dateFrom,setDateFrom]=useState('2026-01-01');
  const [dateTo,setDateTo]=useState('2026-03-28');
  const [detailLevel,setDetailLevel]=useState('Board Pack');
  const [audience,setAudience]=useState('Board');
  const [expanded,setExpanded]=useState({});
  const [sections,setSections]=useState(()=>({
    execSummary:true,portfolioOverview:true,divergence:true,migration:true,
    controversy:true,greenwash:true,regReady:true,recommendations:true,
  }));

  const toggleSection=(key)=>setSections(p=>({...p,[key]:!p[key]}));
  const toggleExpand=(key)=>setExpanded(p=>({...p,[key]:!p[key]}));

  const active=COMPANIES.filter(c=>c.included);
  const avgScore=active.reduce((a,c)=>a+c.avgScore,0)/active.length;
  const upgrades=active.filter(c=>c.momentum==='Upgrade').length;
  const downgrades=active.filter(c=>c.momentum==='Downgrade').length;
  const gwCount=active.filter(c=>c.greenwashRisk).length;
  const contTotal=active.reduce((a,c)=>a+c.controversies,0);
  const critCont=CONTROVERSIES.filter(c=>c.severity==='Critical').length;
  const lastQAvg=avgScore+0.15; // simulated delta

  // Sector breakdown for portfolio overview
  const sectorBreakdown=useMemo(()=>{
    const map={};
    active.forEach(c=>{if(!map[c.sector])map[c.sector]={sector:c.sector,count:0,avgScore:0};map[c.sector].count++;map[c.sector].avgScore+=c.avgScore;});
    return Object.values(map).map(s=>({...s,avgScore:+(s.avgScore/s.count).toFixed(2),avgRating:RATING_SCALE[Math.round(s.avgScore/s.count)]||'BBB'}));
  },[]);

  // Migration data
  const migrationData=RATING_SCALE.map(r=>{
    const from=active.filter(c=>c.avgRating===r&&c.momentum==='Downgrade').length;
    const to=active.filter(c=>c.avgRating===r&&c.momentum==='Upgrade').length;
    const stable=active.filter(c=>c.avgRating===r&&c.momentum==='Stable').length;
    return{rating:r,upgrades:to,downgrades:-from,stable};
  });

  // Top movers
  const topMovers=useMemo(()=>{
    const ups=active.filter(c=>c.momentum==='Upgrade').sort((a,b)=>a.avgScore-b.avgScore).slice(0,5);
    const dns=active.filter(c=>c.momentum==='Downgrade').sort((a,b)=>b.avgScore-a.avgScore).slice(0,5);
    return{ups,dns};
  },[]);

  // Greenwash risk by sector
  const gwBySector=useMemo(()=>{
    const map={};active.forEach(c=>{if(!map[c.sector])map[c.sector]={sector:c.sector,flagged:0,clean:0};if(c.greenwashRisk)map[c.sector].flagged++;else map[c.sector].clean++;});
    return Object.values(map);
  },[]);

  // Controversy by type
  const contByType=useMemo(()=>{
    const map={};CONTROVERSIES.forEach(c=>{if(!map[c.type])map[c.type]={type:c.type,count:0};map[c.type].count++;});
    return Object.values(map).sort((a,b)=>b.count-a.count).slice(0,10);
  },[]);

  const handleExportCSV=useCallback(()=>{
    const rows=[
      ['ESG Ratings Board Report'],
      [`Period: ${dateFrom} to ${dateTo}`],
      [`Audience: ${audience}`,`Detail: ${detailLevel}`],
      [''],
      ['Executive Summary'],
      [`Portfolio Avg Rating,${RATING_SCALE[Math.round(avgScore)]}`],
      [`Companies Covered,${active.length}`],
      [`Upgrades QoQ,${upgrades}`],
      [`Downgrades QoQ,${downgrades}`],
      [`Greenwashing Flags,${gwCount}`],
      [`Controversy Incidents,${contTotal}`],
      [''],
      ['Sector Breakdown'],
      ['Sector','Count','Avg Score','Avg Rating'],
      ...sectorBreakdown.map(s=>[s.sector,s.count,s.avgScore,s.avgRating]),
    ];
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='esg_board_report.csv';a.click();URL.revokeObjectURL(url);
  },[dateFrom,dateTo,audience,detailLevel,sectorBreakdown]);

  const REPORT_SECTIONS=[
    {key:'execSummary',title:'1. Executive Summary',content:()=>(
      <div>
        <p style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
          The portfolio ESG rating stands at <b>{RATING_SCALE[Math.round(avgScore)]}</b> (score: {avgScore.toFixed(2)}) as of {dateTo}.
          {upgrades} companies were upgraded and {downgrades} downgraded this quarter. Provider agreement is at {AGREEMENT_TREND[AGREEMENT_TREND.length-1].agreement}%,
          {AGREEMENT_TREND[AGREEMENT_TREND.length-1].agreement>=70?' exceeding':' below'} the 70% threshold. {gwCount} greenwashing alerts and {contTotal} controversy incidents require attention.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:12}}>
          {[{l:'Avg Rating',v:RATING_SCALE[Math.round(avgScore)]},{l:'Upgrades',v:upgrades,d:`+${upgrades}`},{l:'Downgrades',v:downgrades,d:`-${downgrades}`},{l:'Integrity',v:`${Math.max(0,+(100-8*3-gwCount*2)).toFixed(0)}%`}].map((k,i)=>(
            <div key={i} style={s.kpi}><div style={s.kpiVal}>{k.v}</div><div style={s.kpiLbl}>{k.l}</div></div>
          ))}
        </div>
      </div>
    )},
    {key:'portfolioOverview',title:'2. Portfolio Rating Overview',content:()=>(
      <div>
        <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>Sector-level breakdown of {active.length} companies across {sectorBreakdown.length} sectors. {detailLevel==='Detailed'?'Full company list available in appendix.':''}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:9}} interval={0} angle={-30} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="count" fill={T.navy} name="Companies" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        {detailLevel==='Detailed'&&<table style={{...s.tbl,marginTop:12}}>
          <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Companies</th><th style={s.th}>Avg Score</th><th style={s.th}>Avg Rating</th></tr></thead>
          <tbody>{sectorBreakdown.map((sec,i)=><tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}><td style={s.td}>{sec.sector}</td><td style={s.td}>{sec.count}</td><td style={{...s.td,fontFamily:T.mono}}>{sec.avgScore}</td><td style={s.td}><Pill text={sec.avgRating} bg={T.navy+'15'} color={T.navy}/></td></tr>)}</tbody>
        </table>}
      </div>
    )},
    {key:'divergence',title:'3. Divergence Analysis',content:()=>{
      const divCos=COMPANIES.filter(c=>c.included).sort((a,b)=>b.maxDivergence-a.maxDivergence).slice(0,detailLevel==='Detailed'?15:5);
      return(
        <div>
          <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>Provider divergence remains a key risk factor. {divCos.filter(c=>c.maxDivergence>=4).length} companies show extreme (&ge;4 notch) divergence.</p>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Company</th><th style={s.th}>Max Div.</th>{PROVIDERS.map(p=><th key={p} style={{...s.th,fontSize:9}}>{p.split(' ')[0]}</th>)}</tr></thead>
            <tbody>{divCos.map((c,i)=><tr key={c.id} style={{background:i%2?T.surfaceH:'transparent'}}>
              <td style={{...s.td,fontWeight:600}}>{c.name}</td>
              <td style={{...s.td,fontWeight:700,color:c.maxDivergence>=4?T.red:T.amber}}>{c.maxDivergence}</td>
              {PROVIDERS.map(p=><td key={p} style={{...s.td,fontSize:10,textAlign:'center'}}>{c.ratings[p]||'-'}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
      );
    }},
    {key:'migration',title:'4. Migration & Momentum',content:()=>(
      <div>
        <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>QoQ migration: {upgrades} upgrades, {downgrades} downgrades. Net movement: {upgrades-downgrades>0?'+':''}{upgrades-downgrades} notches.</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={migrationData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="rating" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="upgrades" fill={T.green} name="Upgrades"/>
            <Bar dataKey="downgrades" fill={T.red} name="Downgrades"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{marginTop:12,display:'flex',gap:16}}>
          <div style={s.kpi}><div style={{...s.kpiVal,color:T.green}}>+{upgrades}</div><div style={s.kpiLbl}>Upgrades</div></div>
          <div style={s.kpi}><div style={{...s.kpiVal,color:T.red}}>-{downgrades}</div><div style={s.kpiLbl}>Downgrades</div></div>
          <div style={s.kpi}><div style={s.kpiVal}>{active.filter(c=>c.momentum==='Stable').length}</div><div style={s.kpiLbl}>Stable</div></div>
        </div>
        {detailLevel==='Detailed'&&<div style={{marginTop:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:8}}>Top Upgrades</div>
              <table style={s.tbl}><thead><tr><th style={s.th}>Company</th><th style={s.th}>Rating</th><th style={s.th}>Sector</th></tr></thead>
              <tbody>{topMovers.ups.map((c,i)=><tr key={c.id} style={{background:i%2?T.surfaceH:'transparent'}}><td style={{...s.td,fontWeight:600}}>{c.name}</td><td style={s.td}><Pill text={c.avgRating} bg={T.green+'20'} color={T.green}/></td><td style={s.td}>{c.sector}</td></tr>)}</tbody></table>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8}}>Top Downgrades</div>
              <table style={s.tbl}><thead><tr><th style={s.th}>Company</th><th style={s.th}>Rating</th><th style={s.th}>Sector</th></tr></thead>
              <tbody>{topMovers.dns.map((c,i)=><tr key={c.id} style={{background:i%2?T.surfaceH:'transparent'}}><td style={{...s.td,fontWeight:600}}>{c.name}</td><td style={s.td}><Pill text={c.avgRating} bg={T.red+'20'} color={T.red}/></td><td style={s.td}>{c.sector}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>}
      </div>
    )},
    {key:'controversy',title:'5. Controversy Exposure',content:()=>{
      const topCont=CONTROVERSIES.filter(c=>c.severity==='Critical'||c.severity==='High').slice(0,detailLevel==='Detailed'?15:8);
      return(
        <div>
          <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>{contTotal} total controversy incidents across the portfolio. {critCont} are classified as Critical severity. {CONTROVERSIES.filter(c=>c.resolved).length} have been resolved.</p>
          <div style={{marginBottom:16}}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={contByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}}/>
                <YAxis dataKey="type" type="category" tick={{fontSize:9}} width={150}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                <Bar dataKey="count" fill={T.red+'88'} name="Incidents" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Company</th><th style={s.th}>Type</th><th style={s.th}>Severity</th><th style={s.th}>Date</th><th style={s.th}>Status</th></tr></thead>
            <tbody>{topCont.map((c,i)=><tr key={c.id} style={{background:i%2?T.surfaceH:'transparent'}}>
              <td style={{...s.td,fontWeight:600}}>{c.company}</td>
              <td style={s.td}>{c.type}</td>
              <td style={s.td}><SevPill sev={c.severity}/></td>
              <td style={{...s.td,fontFamily:T.mono,fontSize:11}}>{c.date}</td>
              <td style={s.td}><Pill text={c.resolved?'Resolved':'Open'} bg={c.resolved?T.green+'20':T.red+'20'} color={c.resolved?T.green:T.red}/></td>
            </tr>)}</tbody>
          </table>
        </div>
      );
    }},
    {key:'greenwash',title:'6. Greenwashing Risk',content:()=>(
      <div>
        <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>{gwCount} companies flagged for potential greenwashing. AI detection compares disclosed claims against actual ESG performance metrics and third-party data.</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={gwBySector}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:8}} interval={0} angle={-30} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="flagged" fill={T.red+'99'} name="Flagged" radius={[4,4,0,0]}/>
            <Bar dataKey="clean" fill={T.sage+'80'} name="Clean" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )},
    {key:'regReady',title:'7. Regulatory Readiness (EU ESG Ratings Reg)',content:()=>{
      const readyPct=67;
      const gaps=['Methodology transparency','Conflict of interest disclosures','Supervisory reporting','Data quality documentation','Complaints handling procedures'];
      return(
        <div>
          <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>EU ESG Ratings Regulation (2024/3005) readiness stands at <b>{readyPct}%</b>. Key compliance gaps remain in methodology transparency and conflict-of-interest reporting. Full compliance required by Q3 2026.</p>
          <div style={{display:'flex',gap:16,marginBottom:12}}>
            <div style={s.kpi}><div style={{...s.kpiVal,color:readyPct>=70?T.sage:T.amber}}>{readyPct}%</div><div style={s.kpiLbl}>Overall Ready</div></div>
            <div style={s.kpi}><div style={s.kpiVal}>{gaps.length}</div><div style={s.kpiLbl}>Open Gaps</div></div>
            <div style={s.kpi}><div style={s.kpiVal}>Q3 2026</div><div style={s.kpiLbl}>Deadline</div></div>
          </div>
          {detailLevel==='Detailed'&&<div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Outstanding Compliance Gaps</div>
            {gaps.map((g,i)=><div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.textSec,display:'flex',gap:8}}>
              <span style={{color:T.red,fontWeight:700}}>&#9679;</span>{g}
            </div>)}
          </div>}
        </div>
      );
    }},
    {key:'recommendations',title:'8. Recommendations',content:()=>(
      <div>
        <p style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>Based on the current quarter analysis, the following actions are recommended:</p>
        {[
          {pri:'P1',text:'Engage 5 Energy companies showing extreme provider divergence (>4 notches) for targeted ESG disclosure improvement.',color:T.red},
          {pri:'P1',text:'Escalate 3 Critical-severity controversies to the Risk Committee for immediate review.',color:T.red},
          {pri:'P2',text:`Address ${gwCount} greenwashing flags by requesting independent verification of sustainability claims.`,color:T.amber},
          {pri:'P2',text:'Close CDP coverage gaps: 12 companies missed submission deadlines. Engage IR teams before Q2 deadline.',color:T.amber},
          {pri:'P3',text:'Accelerate EU ESG Ratings Regulation compliance: target 85% readiness by end of Q2 2026.',color:T.gold},
          {pri:'P3',text:'Consider adding ISS ESG coverage for the 15 under-covered companies in Materials and Industrials sectors.',color:T.gold},
        ].map((r,i)=>(
          <div key={i} style={{padding:'10px 12px',marginBottom:8,borderRadius:8,border:`1px solid ${r.color}30`,background:r.color+'08',display:'flex',gap:10,alignItems:'flex-start'}}>
            <Pill text={r.pri} bg={r.color+'25'} color={r.color}/>
            <span style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{r.text}</span>
          </div>
        ))}
      </div>
    )},
  ];

  return(<>
    {/* Controls */}
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
      <div style={{fontSize:12,color:T.textSec}}>From:</div>
      <input type="date" style={s.input} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...s.input,width:150}}/>
      <div style={{fontSize:12,color:T.textSec}}>To:</div>
      <input type="date" style={s.input} value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...s.input,width:150}}/>
      <select style={s.select} value={detailLevel} onChange={e=>setDetailLevel(e.target.value)}>
        <option>Board Pack</option><option>Detailed</option>
      </select>
      <select style={s.select} value={audience} onChange={e=>setAudience(e.target.value)}>
        {['Board','IC','Risk Committee','Regulator'].map(a=><option key={a}>{a}</option>)}
      </select>
      <button style={s.btn(T.gold,'#fff')} onClick={handleExportCSV}>Export CSV</button>
      <button style={s.btn(T.navy,'#fff')} onClick={()=>window.print()}>Print Preview</button>
    </div>

    {/* Quarterly comparison banner */}
    <div style={{...s.card,display:'flex',gap:24,alignItems:'center',background:T.navy+'08'}}>
      <div style={{fontWeight:700,color:T.navy,fontSize:13}}>Quarterly Delta</div>
      {[
        {label:'Avg Score',current:avgScore.toFixed(2),delta:(avgScore-lastQAvg).toFixed(2)},
        {label:'Upgrades',current:upgrades,delta:'+3'},
        {label:'Downgrades',current:downgrades,delta:'-1'},
        {label:'GW Flags',current:gwCount,delta:'+2'},
        {label:'Controversies',current:contTotal,delta:'+5'},
      ].map((d,i)=>(
        <div key={i} style={{textAlign:'center'}}>
          <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{d.current}</div>
          <div style={{fontSize:10,color:String(d.delta).startsWith('-')?T.green:String(d.delta).startsWith('+')?T.red:T.textMut,fontWeight:600}}>{d.delta} vs LQ</div>
          <div style={{fontSize:10,color:T.textMut}}>{d.label}</div>
        </div>
      ))}
    </div>

    {/* Report sections */}
    {REPORT_SECTIONS.map(sec=>(
      <div key={sec.key} style={{...s.card,opacity:sections[sec.key]?1:0.5}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>toggleExpand(sec.key)}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Toggle on={sections[sec.key]} onClick={e=>{e.stopPropagation();toggleSection(sec.key);}}/>
            <span style={{fontWeight:700,color:T.navy,fontSize:14}}>{sec.title}</span>
          </div>
          <span style={{fontSize:18,color:T.textMut,transform:expanded[sec.key]?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s'}}>&#9660;</span>
        </div>
        {expanded[sec.key]&&sections[sec.key]&&<div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
          {sec.content()}
        </div>}
      </div>
    ))}
  </>);
}
