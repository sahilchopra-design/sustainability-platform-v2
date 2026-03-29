import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, Legend,
  LineChart, Line, ScatterChart, Scatter
} from 'recharts';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Deterministic seed ── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const lerp=(a,b,t)=>a+(b-a)*t;
const fmt=(v,d=1)=>typeof v==='number'?v.toFixed(d):v;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const pct=(v,t)=>t?((v/t)*100).toFixed(1)+'%':'—';

/* ── Constants ── */
const DIMS=['HDI','Gini Equality','Healthcare','Education','Labour Rights','Gender Equity','Press Freedom','Food Security'];
const DIM_KEYS=['hdi','gini_eq','healthcare','education','labour','gender','press','food'];
const DIM_DESC=['Human Development Index composite','Income equality (100 - Gini coefficient)','Universal healthcare access & quality','Education quality, literacy, enrollment','ILO core convention compliance','Gender parity in pay, parliament, education','Press freedom & media independence','Food security & nutrition adequacy'];
const REGIONS=['All','Europe','Americas','Asia-Pacific','Africa','MENA'];
const INCOME_GROUPS=['All','High','Upper-Mid','Lower-Mid','Low'];
const SCORE_TIERS=['All','Leader (80+)','Strong (60-79)','Moderate (40-59)','Weak (<40)'];
const REGION_COLORS={Europe:T.navy,Americas:T.sage,'Asia-Pacific':T.gold,Africa:'#7c3aed',MENA:'#0d9488'};
const DIM_COLORS=[T.navy,T.gold,T.sage,T.amber,'#7c3aed','#0d9488',T.red,T.navyL];
const SDGS=Array.from({length:17},(_,i)=>({id:i+1,name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry & Innovation','Reduced Inequalities','Sustainable Cities','Responsible Consumption','Climate Action','Life Below Water','Life on Land','Peace & Justice','Partnerships'][i],social:([1,2,3,4,5,8,10,16]).includes(i+1)}));
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];

/* ══════════════════════════════════════════════════════════════
   SOVEREIGN SOCIAL DATABASE — 80 countries
   ══════════════════════════════════════════════════════════════ */
const RAW_COUNTRIES=[
  // Europe (22)
  {iso:'DK',name:'Denmark',region:'Europe',income:'High',pop:5.9,gdp_bn:400,gdp_pc:67800},
  {iso:'SE',name:'Sweden',region:'Europe',income:'High',pop:10.5,gdp_bn:592,gdp_pc:56400},
  {iso:'NO',name:'Norway',region:'Europe',income:'High',pop:5.5,gdp_bn:485,gdp_pc:88200},
  {iso:'FI',name:'Finland',region:'Europe',income:'High',pop:5.5,gdp_bn:280,gdp_pc:50900},
  {iso:'DE',name:'Germany',region:'Europe',income:'High',pop:84.4,gdp_bn:4260,gdp_pc:50500},
  {iso:'NL',name:'Netherlands',region:'Europe',income:'High',pop:17.6,gdp_bn:1010,gdp_pc:57400},
  {iso:'CH',name:'Switzerland',region:'Europe',income:'High',pop:8.8,gdp_bn:808,gdp_pc:91800},
  {iso:'AT',name:'Austria',region:'Europe',income:'High',pop:9.1,gdp_bn:478,gdp_pc:52500},
  {iso:'FR',name:'France',region:'Europe',income:'High',pop:67.8,gdp_bn:2780,gdp_pc:41000},
  {iso:'GB',name:'United Kingdom',region:'Europe',income:'High',pop:67.3,gdp_bn:3070,gdp_pc:45600},
  {iso:'IE',name:'Ireland',region:'Europe',income:'High',pop:5.1,gdp_bn:530,gdp_pc:103900},
  {iso:'BE',name:'Belgium',region:'Europe',income:'High',pop:11.6,gdp_bn:582,gdp_pc:50200},
  {iso:'ES',name:'Spain',region:'Europe',income:'High',pop:47.4,gdp_bn:1400,gdp_pc:29500},
  {iso:'IT',name:'Italy',region:'Europe',income:'High',pop:59.0,gdp_bn:2010,gdp_pc:34100},
  {iso:'PT',name:'Portugal',region:'Europe',income:'High',pop:10.3,gdp_bn:267,gdp_pc:25900},
  {iso:'CZ',name:'Czechia',region:'Europe',income:'High',pop:10.8,gdp_bn:291,gdp_pc:26900},
  {iso:'PL',name:'Poland',region:'Europe',income:'High',pop:38.0,gdp_bn:688,gdp_pc:18100},
  {iso:'GR',name:'Greece',region:'Europe',income:'High',pop:10.4,gdp_bn:219,gdp_pc:21100},
  {iso:'RO',name:'Romania',region:'Europe',income:'Upper-Mid',pop:19.0,gdp_bn:301,gdp_pc:15800},
  {iso:'HU',name:'Hungary',region:'Europe',income:'High',pop:9.7,gdp_bn:188,gdp_pc:19400},
  {iso:'HR',name:'Croatia',region:'Europe',income:'High',pop:3.9,gdp_bn:68,gdp_pc:17400},
  {iso:'BG',name:'Bulgaria',region:'Europe',income:'Upper-Mid',pop:6.5,gdp_bn:90,gdp_pc:13800},
  // Americas (14)
  {iso:'US',name:'United States',region:'Americas',income:'High',pop:334,gdp_bn:25500,gdp_pc:76300},
  {iso:'CA',name:'Canada',region:'Americas',income:'High',pop:39,gdp_bn:2140,gdp_pc:54900},
  {iso:'BR',name:'Brazil',region:'Americas',income:'Upper-Mid',pop:215,gdp_bn:1920,gdp_pc:8930},
  {iso:'MX',name:'Mexico',region:'Americas',income:'Upper-Mid',pop:128,gdp_bn:1320,gdp_pc:10300},
  {iso:'CL',name:'Chile',region:'Americas',income:'High',pop:19.5,gdp_bn:335,gdp_pc:17200},
  {iso:'AR',name:'Argentina',region:'Americas',income:'Upper-Mid',pop:46,gdp_bn:632,gdp_pc:13740},
  {iso:'CO',name:'Colombia',region:'Americas',income:'Upper-Mid',pop:52,gdp_bn:344,gdp_pc:6620},
  {iso:'PE',name:'Peru',region:'Americas',income:'Upper-Mid',pop:34,gdp_bn:242,gdp_pc:7120},
  {iso:'UY',name:'Uruguay',region:'Americas',income:'High',pop:3.4,gdp_bn:72,gdp_pc:21200},
  {iso:'CR',name:'Costa Rica',region:'Americas',income:'Upper-Mid',pop:5.2,gdp_bn:68,gdp_pc:13100},
  {iso:'PA',name:'Panama',region:'Americas',income:'Upper-Mid',pop:4.4,gdp_bn:77,gdp_pc:17500},
  {iso:'EC',name:'Ecuador',region:'Americas',income:'Upper-Mid',pop:18,gdp_bn:115,gdp_pc:6400},
  {iso:'DO',name:'Dominican Rep.',region:'Americas',income:'Upper-Mid',pop:11,gdp_bn:113,gdp_pc:10300},
  {iso:'GT',name:'Guatemala',region:'Americas',income:'Upper-Mid',pop:18,gdp_bn:95,gdp_pc:5300},
  // Asia-Pacific (22)
  {iso:'JP',name:'Japan',region:'Asia-Pacific',income:'High',pop:125,gdp_bn:4230,gdp_pc:33800},
  {iso:'KR',name:'South Korea',region:'Asia-Pacific',income:'High',pop:51.7,gdp_bn:1665,gdp_pc:32200},
  {iso:'AU',name:'Australia',region:'Asia-Pacific',income:'High',pop:26,gdp_bn:1680,gdp_pc:64600},
  {iso:'NZ',name:'New Zealand',region:'Asia-Pacific',income:'High',pop:5.1,gdp_bn:245,gdp_pc:48000},
  {iso:'SG',name:'Singapore',region:'Asia-Pacific',income:'High',pop:5.9,gdp_bn:397,gdp_pc:67300},
  {iso:'CN',name:'China',region:'Asia-Pacific',income:'Upper-Mid',pop:1412,gdp_bn:17960,gdp_pc:12720},
  {iso:'IN',name:'India',region:'Asia-Pacific',income:'Lower-Mid',pop:1428,gdp_bn:3730,gdp_pc:2612},
  {iso:'ID',name:'Indonesia',region:'Asia-Pacific',income:'Lower-Mid',pop:277,gdp_bn:1320,gdp_pc:4760},
  {iso:'TH',name:'Thailand',region:'Asia-Pacific',income:'Upper-Mid',pop:72,gdp_bn:535,gdp_pc:7430},
  {iso:'MY',name:'Malaysia',region:'Asia-Pacific',income:'Upper-Mid',pop:33,gdp_bn:407,gdp_pc:12300},
  {iso:'PH',name:'Philippines',region:'Asia-Pacific',income:'Lower-Mid',pop:114,gdp_bn:404,gdp_pc:3550},
  {iso:'VN',name:'Vietnam',region:'Asia-Pacific',income:'Lower-Mid',pop:99,gdp_bn:409,gdp_pc:4130},
  {iso:'BD',name:'Bangladesh',region:'Asia-Pacific',income:'Lower-Mid',pop:170,gdp_bn:460,gdp_pc:2700},
  {iso:'PK',name:'Pakistan',region:'Asia-Pacific',income:'Lower-Mid',pop:230,gdp_bn:350,gdp_pc:1520},
  {iso:'LK',name:'Sri Lanka',region:'Asia-Pacific',income:'Lower-Mid',pop:22,gdp_bn:84,gdp_pc:3820},
  {iso:'MM',name:'Myanmar',region:'Asia-Pacific',income:'Lower-Mid',pop:55,gdp_bn:65,gdp_pc:1180},
  {iso:'KH',name:'Cambodia',region:'Asia-Pacific',income:'Lower-Mid',pop:17,gdp_bn:30,gdp_pc:1760},
  {iso:'NP',name:'Nepal',region:'Asia-Pacific',income:'Lower-Mid',pop:30,gdp_bn:40,gdp_pc:1330},
  {iso:'TW',name:'Taiwan',region:'Asia-Pacific',income:'High',pop:23.6,gdp_bn:790,gdp_pc:33500},
  {iso:'HK',name:'Hong Kong',region:'Asia-Pacific',income:'High',pop:7.3,gdp_bn:382,gdp_pc:52300},
  {iso:'MN',name:'Mongolia',region:'Asia-Pacific',income:'Lower-Mid',pop:3.4,gdp_bn:17,gdp_pc:5000},
  {iso:'FJ',name:'Fiji',region:'Asia-Pacific',income:'Upper-Mid',pop:0.9,gdp_bn:5,gdp_pc:5600},
  // Africa (12)
  {iso:'ZA',name:'South Africa',region:'Africa',income:'Upper-Mid',pop:60,gdp_bn:405,gdp_pc:6750},
  {iso:'NG',name:'Nigeria',region:'Africa',income:'Lower-Mid',pop:220,gdp_bn:477,gdp_pc:2170},
  {iso:'KE',name:'Kenya',region:'Africa',income:'Lower-Mid',pop:55,gdp_bn:113,gdp_pc:2050},
  {iso:'EG',name:'Egypt',region:'Africa',income:'Lower-Mid',pop:105,gdp_bn:476,gdp_pc:4530},
  {iso:'MA',name:'Morocco',region:'Africa',income:'Lower-Mid',pop:37,gdp_bn:134,gdp_pc:3620},
  {iso:'GH',name:'Ghana',region:'Africa',income:'Lower-Mid',pop:33,gdp_bn:73,gdp_pc:2210},
  {iso:'ET',name:'Ethiopia',region:'Africa',income:'Low',pop:120,gdp_bn:156,gdp_pc:1300},
  {iso:'TZ',name:'Tanzania',region:'Africa',income:'Low',pop:65,gdp_bn:75,gdp_pc:1150},
  {iso:'CI',name:'Ivory Coast',region:'Africa',income:'Lower-Mid',pop:28,gdp_bn:70,gdp_pc:2500},
  {iso:'SN',name:'Senegal',region:'Africa',income:'Lower-Mid',pop:17,gdp_bn:28,gdp_pc:1650},
  {iso:'RW',name:'Rwanda',region:'Africa',income:'Low',pop:14,gdp_bn:11,gdp_pc:790},
  {iso:'UG',name:'Uganda',region:'Africa',income:'Low',pop:47,gdp_bn:46,gdp_pc:980},
  // MENA (10)
  {iso:'AE',name:'UAE',region:'MENA',income:'High',pop:10,gdp_bn:507,gdp_pc:50700},
  {iso:'SA',name:'Saudi Arabia',region:'MENA',income:'High',pop:36,gdp_bn:1108,gdp_pc:30800},
  {iso:'QA',name:'Qatar',region:'MENA',income:'High',pop:2.7,gdp_bn:221,gdp_pc:81900},
  {iso:'KW',name:'Kuwait',region:'MENA',income:'High',pop:4.3,gdp_bn:185,gdp_pc:43000},
  {iso:'BH',name:'Bahrain',region:'MENA',income:'High',pop:1.5,gdp_bn:44,gdp_pc:29300},
  {iso:'OM',name:'Oman',region:'MENA',income:'High',pop:4.6,gdp_bn:104,gdp_pc:22600},
  {iso:'JO',name:'Jordan',region:'MENA',income:'Upper-Mid',pop:11,gdp_bn:47,gdp_pc:4270},
  {iso:'TN',name:'Tunisia',region:'MENA',income:'Lower-Mid',pop:12,gdp_bn:47,gdp_pc:3920},
  {iso:'LB',name:'Lebanon',region:'MENA',income:'Upper-Mid',pop:5.5,gdp_bn:22,gdp_pc:4000},
  {iso:'IL',name:'Israel',region:'MENA',income:'High',pop:9.8,gdp_bn:525,gdp_pc:53600}
];

/* ── Generate 8 social dimension scores per country ── */
const genDims=(iso,income,gdp_pc,idx)=>{
  const base=income==='High'?68:income==='Upper-Mid'?48:income==='Lower-Mid'?35:25;
  const gdpFactor=clamp(gdp_pc/1200,0,20);
  const s=i=>clamp(base+gdpFactor+sr(idx*100+i*17)*24-8,8,98);
  return {hdi:s(0),gini_eq:s(1),healthcare:s(2),education:s(3),labour:s(4),gender:s(5),press:s(6),food:s(7)};
};

const COUNTRIES=RAW_COUNTRIES.map((c,idx)=>{
  const dims=genDims(c.iso,c.income,c.gdp_pc,idx);
  const composite=DIM_KEYS.reduce((a,k)=>a+dims[k],0)/8;
  // 12Q trend per dimension
  const trends=DIM_KEYS.map((k,di)=>QUARTERS.map((q,qi)=>{
    const drift=(sr(idx*200+di*30+qi*7)-0.45)*2.5;
    return {quarter:q,value:clamp(dims[k]+drift*(qi-6),5,99)};
  }));
  // SDG scores
  const sdgs=SDGS.map((sdg,si)=>({
    id:sdg.id,name:sdg.name,social:sdg.social,
    score:clamp(composite*0.7+sr(idx*300+si*13)*35,5,98),
    target2030:clamp(70+sr(idx*400+si*19)*25,60,98),
    bondAlign:sr(idx*500+si*11)>0.5
  }));
  // Sovereign bond data
  const bondYield=clamp(1.2+(100-composite)*0.06+sr(idx*600)*1.5,0.3,14);
  const ratingIdx=clamp(Math.floor((100-composite)/7),0,14);
  const rating=['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B'][ratingIdx];
  const socialMomentum=+(sr(idx*700)*4-1.5).toFixed(2);
  const envScore=clamp(composite*0.8+sr(idx*800)*20,10,95);
  // Per-dimension quartile rank
  const peerGroup=composite>=80?'Leader':composite>=60?'Strong':composite>=40?'Moderate':'Weak';
  return {...c,...dims,composite,trends,sdgs,bondYield:+bondYield.toFixed(2),rating,socialMomentum,envScore,peerGroup,ratingIdx};
});

/* ── Shared UI primitives ── */
const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16};
const pill=(active)=>({padding:'6px 14px',borderRadius:4,fontSize:12,fontFamily:T.mono,fontWeight:active?600:400,
  background:active?T.navy:'transparent',color:active?'#fff':T.textSec,border:`1px solid ${active?T.navy:T.border}`,cursor:'pointer',transition:'all .15s'});
const hdr={fontFamily:T.mono,fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8};
const sel={padding:'5px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface};
const tierOf=s=>s>=80?'Leader':s>=60?'Strong':s>=40?'Moderate':'Weak';
const tierColor=s=>s>=80?T.green:s>=60?T.navyL:s>=40?T.amber:T.red;
const sparkBar=(val,max=100,color=T.navy)=>(<div style={{display:'inline-flex',alignItems:'center',gap:4}}>
  <div style={{width:48,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
    <div style={{width:`${(val/max)*100}%`,height:'100%',background:color,borderRadius:3}}/>
  </div>
  <span style={{fontFamily:T.mono,fontSize:10,color}}>{fmt(val)}</span>
</div>);

/* ══════════════════════════════════════════════════════════════
   TAB 1 — Social Performance Dashboard
   ══════════════════════════════════════════════════════════════ */
function DashboardTab(){
  const [region,setRegion]=useState('All');
  const [incomeG,setIncomeG]=useState('All');
  const [scoreTier,setScoreTier]=useState('All');
  const [selCountry,setSelCountry]=useState(null);
  const [sortKey,setSortKey]=useState('composite');
  const [detailDim,setDetailDim]=useState(0);

  const filtered=useMemo(()=>{
    let d=COUNTRIES;
    if(region!=='All') d=d.filter(c=>c.region===region);
    if(incomeG!=='All') d=d.filter(c=>c.income===incomeG);
    if(scoreTier!=='All'){
      if(scoreTier.includes('80')) d=d.filter(c=>c.composite>=80);
      else if(scoreTier.includes('60')) d=d.filter(c=>c.composite>=60&&c.composite<80);
      else if(scoreTier.includes('40')) d=d.filter(c=>c.composite>=40&&c.composite<60);
      else d=d.filter(c=>c.composite<40);
    }
    return [...d].sort((a,b)=>b[sortKey]-a[sortKey]);
  },[region,incomeG,scoreTier,sortKey]);

  const sc=selCountry?COUNTRIES.find(c=>c.iso===selCountry):null;
  const radarData=sc?DIM_KEYS.map((k,i)=>({dim:DIMS[i],value:sc[k],fullMark:100})):[];
  const scatterData=useMemo(()=>filtered.map(c=>({name:c.name,gdp:c.gdp_pc,hdi:c.hdi,region:c.region,composite:c.composite})),[filtered]);

  // KPIs
  const kpis=useMemo(()=>{
    const n=filtered.length;
    if(!n) return {avg:0,leaders:0,weak:0,topName:'—'};
    const avg=filtered.reduce((a,c)=>a+c.composite,0)/n;
    return {avg:+avg.toFixed(1),leaders:filtered.filter(c=>c.composite>=80).length,weak:filtered.filter(c=>c.composite<40).length,topName:filtered[0]?.name||'—'};
  },[filtered]);

  // Heatmap data
  const heatmapData=useMemo(()=>{
    const regs=REGIONS.filter(r=>r!=='All');
    return regs.map(r=>{
      const cs=COUNTRIES.filter(c=>c.region===r);
      if(!cs.length) return null;
      const avg=k=>+(cs.reduce((a,c)=>a+c[k],0)/cs.length).toFixed(1);
      return {region:r,...Object.fromEntries(DIM_KEYS.map((k,i)=>[DIMS[i],avg(k)]))};
    }).filter(Boolean);
  },[]);

  // Peer comparison for selected country
  const peers=useMemo(()=>{
    if(!sc) return [];
    return COUNTRIES.filter(c=>c.region===sc.region&&c.iso!==sc.iso).slice(0,5);
  },[sc]);

  return (<div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* KPI row */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
      {[
        {label:'Countries',val:filtered.length,color:T.navy},
        {label:'Avg Score',val:kpis.avg,color:tierColor(kpis.avg)},
        {label:'Leaders (80+)',val:kpis.leaders,color:T.green},
        {label:'Weak (<40)',val:kpis.weak,color:T.red},
        {label:'Top Ranked',val:kpis.topName,color:T.gold}
      ].map((k,i)=>(
        <div key={i} style={{...card,textAlign:'center',borderTop:`3px solid ${k.color}`}}>
          <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginBottom:2}}>{k.label}</div>
          <div style={{fontSize:typeof k.val==='number'?22:14,fontWeight:700,fontFamily:T.mono,color:k.color}}>{k.val}</div>
        </div>
      ))}
    </div>

    {/* Filters */}
    <div style={{...card,display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
      <span style={hdr}>FILTERS</span>
      <select style={sel} value={region} onChange={e=>setRegion(e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select>
      <select style={sel} value={incomeG} onChange={e=>setIncomeG(e.target.value)}>{INCOME_GROUPS.map(r=><option key={r}>{r}</option>)}</select>
      <select style={sel} value={scoreTier} onChange={e=>setScoreTier(e.target.value)}>{SCORE_TIERS.map(r=><option key={r}>{r}</option>)}</select>
      <select style={sel} value={sortKey} onChange={e=>setSortKey(e.target.value)}>
        <option value="composite">Sort: Composite</option>
        {DIM_KEYS.map((k,i)=><option key={k} value={k}>Sort: {DIMS[i]}</option>)}
      </select>
      <span style={{marginLeft:'auto',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{filtered.length} countries</span>
    </div>

    <div style={{display:'grid',gridTemplateColumns:sc?'1fr 1fr':'1fr',gap:16}}>
      {/* Ranking table */}
      <div style={{...card,maxHeight:560,overflowY:'auto'}}>
        <div style={hdr}>SOCIAL PERFORMANCE RANKING</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`,position:'sticky',top:0,background:T.surface}}>
            <th style={{textAlign:'left',padding:'6px 4px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>#</th>
            <th style={{textAlign:'left',padding:'6px 4px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>COUNTRY</th>
            <th style={{textAlign:'right',padding:'6px 4px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>COMPOSITE</th>
            {DIMS.slice(0,4).map(d=><th key={d} style={{textAlign:'right',padding:'6px 4px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{d.split(' ')[0].slice(0,6).toUpperCase()}</th>)}
            <th style={{textAlign:'center',padding:'6px 4px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>TIER</th>
            <th style={{textAlign:'right',padding:'6px 4px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>MOM</th>
          </tr></thead>
          <tbody>{filtered.map((c,i)=>(
            <tr key={c.iso} onClick={()=>setSelCountry(c.iso===selCountry?null:c.iso)}
              style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:c.iso===selCountry?T.surfaceH:'transparent',transition:'background .15s'}}>
              <td style={{padding:'5px 4px',fontFamily:T.mono,color:T.textMut,fontSize:10}}>{i+1}</td>
              <td style={{padding:'5px 4px',fontWeight:500,fontSize:12}}><span style={{fontFamily:T.mono,marginRight:4,color:T.textMut}}>{c.iso}</span>{c.name}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontWeight:600,color:tierColor(c.composite)}}>{fmt(c.composite)}</td>
              {DIM_KEYS.slice(0,4).map(k=><td key={k} style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:11,color:T.textSec}}>{fmt(c[k])}</td>)}
              <td style={{padding:'5px 4px',textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:3,fontSize:9,fontFamily:T.mono,background:tierColor(c.composite)+'18',color:tierColor(c.composite)}}>{tierOf(c.composite)}</span></td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:10,color:c.socialMomentum>=0?T.green:T.red}}>{c.socialMomentum>=0?'+':''}{c.socialMomentum}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Detail panel */}
      {sc&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <div><span style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.navy}}>{sc.iso}</span> <span style={{fontSize:16,fontWeight:600}}>{sc.name}</span></div>
            <span style={{fontFamily:T.mono,fontSize:13,color:tierColor(sc.composite),fontWeight:700}}>{fmt(sc.composite)} — {tierOf(sc.composite)}</span>
          </div>
          <div style={{display:'flex',gap:16,marginTop:6,fontSize:11,color:T.textSec,fontFamily:T.mono,flexWrap:'wrap'}}>
            <span>Region: {sc.region}</span><span>Income: {sc.income}</span><span>Pop: {sc.pop}M</span>
            <span>GDP/cap: ${sc.gdp_pc.toLocaleString()}</span><span>Rating: {sc.rating}</span><span>Yield: {sc.bondYield}%</span>
          </div>
        </div>

        {/* 8-dim radar */}
        <div style={card}>
          <div style={hdr}>8-DIMENSION SOCIAL RADAR</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}><PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fontFamily:T.mono,fill:T.textSec}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:8}} stroke={T.border}/>
              <Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.18} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension breakdown bars */}
        <div style={card}>
          <div style={hdr}>DIMENSION BREAKDOWN</div>
          {DIM_KEYS.map((k,i)=>(
            <div key={k} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,cursor:'pointer'}} onClick={()=>setDetailDim(i)}>
              <span style={{width:82,fontSize:10,fontFamily:T.mono,color:detailDim===i?DIM_COLORS[i]:T.textSec,fontWeight:detailDim===i?700:400}}>{DIMS[i]}</span>
              <div style={{flex:1,height:14,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${sc[k]}%`,height:'100%',background:DIM_COLORS[i],borderRadius:3,transition:'width .3s'}}/>
              </div>
              <span style={{width:36,textAlign:'right',fontSize:11,fontFamily:T.mono,fontWeight:600}}>{fmt(sc[k])}</span>
            </div>
          ))}
        </div>

        {/* 12Q composite trend */}
        <div style={card}>
          <div style={hdr}>12-QUARTER TREND — {DIMS[detailDim].toUpperCase()}</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={sc.trends[detailDim]}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="quarter" tick={{fontSize:8,fontFamily:T.mono}} stroke={T.border}/>
              <YAxis domain={[0,100]} tick={{fontSize:8,fontFamily:T.mono}} stroke={T.border}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
              <Line type="monotone" dataKey="value" stroke={DIM_COLORS[detailDim]} strokeWidth={2} dot={{r:2,fill:DIM_COLORS[detailDim]}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SDG mini-grid */}
        <div style={card}>
          <div style={hdr}>SDG PROGRESS (SOCIAL)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {sc.sdgs.filter(s=>s.social).map(s=>(
              <div key={s.id} style={{width:56,textAlign:'center',padding:4,borderRadius:4,background:s.score>=s.target2030?T.green+'12':T.amber+'12',border:`1px solid ${s.score>=s.target2030?T.green:T.amber}25`}}>
                <div style={{fontSize:9,fontWeight:700,fontFamily:T.mono,color:s.score>=s.target2030?T.green:T.amber}}>SDG {s.id}</div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:T.mono}}>{fmt(s.score,0)}</div>
                <div style={{fontSize:7,color:T.textMut}}>tgt {fmt(s.target2030,0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Peer comparison */}
        <div style={card}>
          <div style={hdr}>REGIONAL PEER COMPARISON</div>
          {peers.map(p=>(
            <div key={p.iso} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginRight:4}}>{p.iso}</span>
              <span style={{flex:1}}>{p.name}</span>
              <span style={{fontFamily:T.mono,fontWeight:600,color:tierColor(p.composite),marginLeft:8}}>{fmt(p.composite)}</span>
            </div>
          ))}
        </div>
      </div>}
    </div>

    {/* Tier distribution */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={card}>
        <div style={hdr}>SCORE DISTRIBUTION BY TIER</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[
            {tier:'Leader (80+)',count:filtered.filter(c=>c.composite>=80).length,fill:T.green},
            {tier:'Strong (60-79)',count:filtered.filter(c=>c.composite>=60&&c.composite<80).length,fill:T.navyL},
            {tier:'Moderate (40-59)',count:filtered.filter(c=>c.composite>=40&&c.composite<60).length,fill:T.amber},
            {tier:'Weak (<40)',count:filtered.filter(c=>c.composite<40).length,fill:T.red}
          ]}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
            <XAxis dataKey="tier" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
            <YAxis tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Bar dataKey="count" name="Countries" radius={[3,3,0,0]}>
              {[T.green,T.navyL,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={hdr}>REGION COMPOSITION</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={REGIONS.filter(r=>r!=='All').map(r=>({
            region:r,
            leader:COUNTRIES.filter(c=>c.region===r&&c.composite>=80).length,
            strong:COUNTRIES.filter(c=>c.region===r&&c.composite>=60&&c.composite<80).length,
            moderate:COUNTRIES.filter(c=>c.region===r&&c.composite>=40&&c.composite<60).length,
            weak:COUNTRIES.filter(c=>c.region===r&&c.composite<40).length
          }))}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
            <XAxis dataKey="region" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
            <YAxis tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
            <Tooltip contentStyle={{fontSize:11}}/>
            <Bar dataKey="leader" name="Leader" stackId="a" fill={T.green}/>
            <Bar dataKey="strong" name="Strong" stackId="a" fill={T.navyL}/>
            <Bar dataKey="moderate" name="Moderate" stackId="a" fill={T.amber}/>
            <Bar dataKey="weak" name="Weak" stackId="a" fill={T.red}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Composite bar chart — top 20 */}
    <div style={card}>
      <div style={hdr}>TOP 20 COUNTRIES — COMPOSITE SOCIAL SCORE</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={filtered.slice(0,20)} layout="vertical" margin={{left:90}}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border} width={85}/>
          <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}} formatter={(v)=>[fmt(v),'Score']}/>
          <Bar dataKey="composite" radius={[0,3,3,0]}>
            {filtered.slice(0,20).map((c,i)=><Cell key={i} fill={tierColor(c.composite)} opacity={1-i*0.025}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* HDI vs GDP scatter */}
    <div style={card}>
      <div style={hdr}>HDI SCORE vs GDP PER CAPITA — DEVELOPMENT SCATTER</div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{top:10,right:20,bottom:10,left:10}}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis dataKey="gdp" name="GDP/Cap" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border} type="number"/>
          <YAxis dataKey="hdi" name="HDI" domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <Tooltip cursor={{strokeDasharray:'3 3'}} content={({active,payload})=>{
            if(!active||!payload?.length) return null;
            const d=payload[0].payload;
            return <div style={{background:T.surface,border:`1px solid ${T.border}`,padding:8,borderRadius:4,fontSize:11,fontFamily:T.font}}>
              <div style={{fontWeight:600}}>{d.name}</div>
              <div style={{fontFamily:T.mono}}>GDP/cap: ${d.gdp.toLocaleString()}</div>
              <div style={{fontFamily:T.mono}}>HDI: {fmt(d.hdi)}</div>
              <div style={{fontFamily:T.mono}}>Composite: {fmt(d.composite)}</div>
            </div>;
          }}/>
          <Scatter data={scatterData}>{scatterData.map((d,i)=><Cell key={i} fill={REGION_COLORS[d.region]||T.navy} opacity={0.7}/>)}</Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:6}}>
        {Object.entries(REGION_COLORS).map(([r,c])=><span key={r} style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:c,marginRight:3,verticalAlign:'middle'}}/>{r}</span>)}
      </div>
    </div>

    {/* Regional inequality heatmap */}
    <div style={card}>
      <div style={hdr}>REGIONAL SOCIAL DIMENSION HEATMAP — AVERAGES</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.mono}}>
          <thead><tr>
            <th style={{padding:6,textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:10,color:T.textMut}}>REGION</th>
            {DIMS.map(d=><th key={d} style={{padding:6,textAlign:'center',borderBottom:`2px solid ${T.border}`,fontSize:8,color:T.textMut}}>{d.split(' ')[0]}</th>)}
          </tr></thead>
          <tbody>{heatmapData.map(r=>(
            <tr key={r.region} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:6,fontWeight:600,color:REGION_COLORS[r.region]}}>{r.region}</td>
              {DIMS.map(d=>{
                const v=r[d];const bg=v>=70?T.green+'20':v>=50?T.gold+'20':v>=35?T.amber+'20':T.red+'20';
                return <td key={d} style={{padding:6,textAlign:'center',background:bg,color:v>=70?T.green:v>=50?T.gold:v>=35?T.amber:T.red,fontWeight:600}}>{v}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   TAB 2 — Dimension Deep Dive
   ══════════════════════════════════════════════════════════════ */
function DimensionTab(){
  const [dimIdx,setDimIdx]=useState(0);
  const dimKey=DIM_KEYS[dimIdx];
  const dimName=DIMS[dimIdx];

  const ranked=useMemo(()=>[...COUNTRIES].sort((a,b)=>b[dimKey]-a[dimKey]),[dimKey]);
  const top10=ranked.slice(0,10);
  const bottom10=[...ranked].slice(-10).reverse();

  const movers=useMemo(()=>{
    return COUNTRIES.map(c=>{
      const t=c.trends[dimIdx];
      const delta=t[11].value-t[0].value;
      return {name:c.name,iso:c.iso,current:c[dimKey],delta:+delta.toFixed(2),region:c.region};
    }).sort((a,b)=>b.delta-a.delta);
  },[dimIdx,dimKey]);

  const regAvgs=useMemo(()=>{
    return REGIONS.filter(r=>r!=='All').map(r=>{
      const cs=COUNTRIES.filter(c=>c.region===r);
      return {region:r,avg:cs.length?+(cs.reduce((a,c)=>a+c[dimKey],0)/cs.length).toFixed(1):0};
    });
  },[dimKey]);

  const trendLines=useMemo(()=>{
    return QUARTERS.map((q,qi)=>{
      const obj={quarter:q};
      top10.slice(0,5).forEach(c=>{obj[c.iso]=c.trends[dimIdx][qi].value;});
      return obj;
    });
  },[top10,dimIdx]);

  // Correlation matrix
  const corrMatrix=useMemo(()=>{
    return DIM_KEYS.map((k1,i)=>({
      dim:DIMS[i],
      ...Object.fromEntries(DIM_KEYS.map((k2,j)=>{
        const xs=COUNTRIES.map(c=>c[k1]),ys=COUNTRIES.map(c=>c[k2]);
        const mx=xs.reduce((a,v)=>a+v,0)/xs.length,my=ys.reduce((a,v)=>a+v,0)/ys.length;
        const num=xs.reduce((a,v,ii)=>a+(v-mx)*(ys[ii]-my),0);
        const den=Math.sqrt(xs.reduce((a,v)=>a+(v-mx)**2,0)*ys.reduce((a,v)=>a+(v-my)**2,0));
        return [DIMS[j],den?+(num/den).toFixed(2):1];
      }))
    }));
  },[]);

  // Income group breakdown
  const incomeBreak=useMemo(()=>{
    return INCOME_GROUPS.filter(g=>g!=='All').map(g=>{
      const cs=COUNTRIES.filter(c=>c.income===g);
      return {income:g,avg:cs.length?+(cs.reduce((a,c)=>a+c[dimKey],0)/cs.length).toFixed(1):0,count:cs.length};
    });
  },[dimKey]);

  return (<div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Dimension selector */}
    <div style={{...card,display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
      <span style={hdr}>SELECT DIMENSION</span>
      {DIMS.map((d,i)=><button key={d} onClick={()=>setDimIdx(i)} style={{...pill(i===dimIdx),borderColor:i===dimIdx?DIM_COLORS[i]:T.border,background:i===dimIdx?DIM_COLORS[i]:'transparent'}}>{d}</button>)}
    </div>

    {/* Dimension description */}
    <div style={{...card,borderLeft:`3px solid ${DIM_COLORS[dimIdx]}`}}>
      <div style={{fontSize:14,fontWeight:600,color:T.navy}}>{dimName}</div>
      <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{DIM_DESC[dimIdx]}</div>
      <div style={{display:'flex',gap:20,marginTop:8,fontSize:11,fontFamily:T.mono,color:T.textMut}}>
        <span>Global avg: {fmt(COUNTRIES.reduce((a,c)=>a+c[dimKey],0)/COUNTRIES.length)}</span>
        <span>Median: {fmt(ranked[39][dimKey])}</span>
        <span>Std dev: {fmt(Math.sqrt(COUNTRIES.reduce((a,c)=>a+(c[dimKey]-COUNTRIES.reduce((s,cc)=>s+cc[dimKey],0)/80)**2,0)/80))}</span>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      {/* Top 10 */}
      <div style={card}>
        <div style={hdr}>TOP 10 — {dimName.toUpperCase()}</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={top10} layout="vertical" margin={{left:65}}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border} width={60}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Bar dataKey={dimKey} radius={[0,3,3,0]}>{top10.map((c,i)=><Cell key={i} fill={DIM_COLORS[dimIdx]} opacity={1-i*0.06}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Bottom 10 */}
      <div style={card}>
        <div style={hdr}>BOTTOM 10 — {dimName.toUpperCase()}</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bottom10} layout="vertical" margin={{left:65}}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border} width={60}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Bar dataKey={dimKey} radius={[0,3,3,0]}>{bottom10.map((c,i)=><Cell key={i} fill={T.red} opacity={0.5+i*0.05}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Regional averages + income group */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={card}>
        <div style={hdr}>REGIONAL AVERAGES</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={regAvgs}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="region" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border}/>
            <YAxis domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/><Tooltip contentStyle={{fontSize:11}}/>
            <Bar dataKey="avg" radius={[3,3,0,0]}>{regAvgs.map((r,i)=><Cell key={i} fill={REGION_COLORS[r.region]||T.navy}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={hdr}>INCOME GROUP BREAKDOWN</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={incomeBreak}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="income" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border}/>
            <YAxis domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/><Tooltip contentStyle={{fontSize:11}}/>
            <Bar dataKey="avg" radius={[3,3,0,0]}>{incomeBreak.map((r,i)=><Cell key={i} fill={[T.navy,T.gold,T.amber,T.red][i]}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* 12Q trend top 5 */}
    <div style={card}>
      <div style={hdr}>12-QUARTER TREND — TOP 5 COUNTRIES</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={trendLines}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="quarter" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <YAxis domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/><Tooltip contentStyle={{fontSize:11}}/>
          {top10.slice(0,5).map((c,i)=><Line key={c.iso} type="monotone" dataKey={c.iso} stroke={DIM_COLORS[i]} strokeWidth={2} dot={{r:2}}/>)}
          <Legend formatter={v=>{const f=top10.slice(0,5).find(c=>c.iso===v);return f?f.name:v;}} wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      {/* Best improvers */}
      <div style={card}>
        <div style={hdr}>BEST IMPROVERS (12Q DELTA)</div>
        {movers.slice(0,10).map((c,i)=>(
          <div key={c.iso} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
            <span><span style={{fontFamily:T.mono,marginRight:4,color:T.textMut,width:20,display:'inline-block'}}>{i+1}.</span>{c.name}</span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>({fmt(c.current)})</span>
              <span style={{fontFamily:T.mono,fontWeight:600,color:c.delta>=0?T.green:T.red}}>{c.delta>=0?'+':''}{fmt(c.delta)}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Worst decliners */}
      <div style={card}>
        <div style={hdr}>WORST DECLINERS (12Q DELTA)</div>
        {movers.slice(-10).reverse().map((c,i)=>(
          <div key={c.iso} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
            <span><span style={{fontFamily:T.mono,marginRight:4,color:T.textMut,width:20,display:'inline-block'}}>{i+1}.</span>{c.name}</span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>({fmt(c.current)})</span>
              <span style={{fontFamily:T.mono,fontWeight:600,color:T.red}}>{fmt(c.delta)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Correlation matrix */}
    <div style={card}>
      <div style={hdr}>DIMENSION CORRELATION MATRIX — WHICH DIMENSIONS MOVE TOGETHER</div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',fontSize:10,fontFamily:T.mono,width:'100%'}}>
          <thead><tr>
            <th style={{padding:5,textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}/>
            {DIMS.map(d=><th key={d} style={{padding:5,textAlign:'center',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:8,maxWidth:55}}>{d.split(' ')[0]}</th>)}
          </tr></thead>
          <tbody>{corrMatrix.map((row,ri)=>(
            <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:5,fontWeight:600,fontSize:9,color:DIM_COLORS[ri]}}>{DIMS[ri].split(' ')[0]}</td>
              {DIMS.map((d,ci)=>{
                const v=row[d];const abs=Math.abs(v);
                const bg=ri===ci?T.surfaceH:v>=0.7?T.green+'25':v>=0.4?T.gold+'15':v<=-0.3?T.red+'18':'transparent';
                return <td key={ci} style={{padding:5,textAlign:'center',background:bg,fontWeight:abs>=0.7?700:400,color:v>=0.7?T.green:v<=-0.3?T.red:T.text}}>{v.toFixed(2)}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    {/* Policy drivers */}
    <div style={card}>
      <div style={hdr}>POLICY DRIVER ANALYSIS — {dimName.toUpperCase()}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10}}>
        {[
          {label:'Universal Coverage',desc:'% population with access',val:clamp(55+dimIdx*4+sr(dimIdx*99)*15,40,92).toFixed(0)+'%',trend:sr(dimIdx*88)>0.5?'+2.1pp':'-0.8pp'},
          {label:'Public Spending/GDP',desc:'Government allocation',val:clamp(3+dimIdx*0.5+sr(dimIdx*77)*3,2,12).toFixed(1)+'%',trend:sr(dimIdx*66)>0.4?'+0.3pp':'-0.1pp'},
          {label:'Regulatory Quality',desc:'WGI institutional score',val:clamp(50+dimIdx*3+sr(dimIdx*55)*20,30,95).toFixed(0)+'/100',trend:sr(dimIdx*44)>0.5?'Improving':'Stable'},
          {label:'Institutional Strength',desc:'Rule of law composite',val:clamp(48+dimIdx*2+sr(dimIdx*33)*22,25,96).toFixed(0)+'/100',trend:'Stable'},
          {label:'Civil Society Index',desc:'Freedom House derived',val:clamp(40+dimIdx*3+sr(dimIdx*22)*25,20,90).toFixed(0)+'/100',trend:sr(dimIdx*11)>0.6?'Declining':'Improving'},
          {label:'International Commitments',desc:'Core treaties ratified',val:clamp(5+dimIdx+sr(dimIdx*9)*4,3,12).toFixed(0)+'/12',trend:'Stable'}
        ].map((p,i)=>(
          <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{p.label}</div>
            <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>{p.desc}</div>
            <div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:DIM_COLORS[dimIdx]}}>{p.val}</div>
            <div style={{fontSize:9,fontFamily:T.mono,color:p.trend.includes('+')?T.green:p.trend.includes('-')?T.red:T.textMut,marginTop:2}}>{p.trend}</div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   TAB 3 — SDG Alignment
   ══════════════════════════════════════════════════════════════ */
function SdgTab(){
  const [selSdg,setSelSdg]=useState(null);
  const [regFilter,setRegFilter]=useState('All');
  const [showMatrix,setShowMatrix]=useState(false);

  const filtered=useMemo(()=>{
    let d=COUNTRIES;
    if(regFilter!=='All') d=d.filter(c=>c.region===regFilter);
    return d;
  },[regFilter]);

  const sdgAvgs=useMemo(()=>{
    return SDGS.map(s=>{
      const avg=filtered.reduce((a,c)=>a+c.sdgs[s.id-1].score,0)/filtered.length;
      const tgt=filtered.reduce((a,c)=>a+c.sdgs[s.id-1].target2030,0)/filtered.length;
      return {...s,avg:+avg.toFixed(1),target:+tgt.toFixed(1),gap:+(tgt-avg).toFixed(1)};
    });
  },[filtered]);

  const socialSdgs=sdgAvgs.filter(s=>s.social);

  const regCoverage=useMemo(()=>{
    const regs=REGIONS.filter(r=>r!=='All');
    return regs.map(r=>{
      const cs=COUNTRIES.filter(c=>c.region===r);
      const obj={region:r};
      SDGS.filter(s=>s.social).forEach(s=>{
        obj[`SDG${s.id}`]=+(cs.reduce((a,c)=>a+c.sdgs[s.id-1].score,0)/cs.length).toFixed(1);
      });
      return obj;
    });
  },[]);

  const sdgCountryRanking=useMemo(()=>{
    if(!selSdg) return [];
    return [...filtered].sort((a,b)=>b.sdgs[selSdg-1].score-a.sdgs[selSdg-1].score);
  },[selSdg,filtered]);

  // Full 17x80 matrix (summarised by region for display)
  const fullMatrix=useMemo(()=>{
    if(!showMatrix) return [];
    return filtered.slice(0,30).map(c=>({
      name:c.name,iso:c.iso,region:c.region,
      ...Object.fromEntries(SDGS.map(s=>[`SDG${s.id}`,c.sdgs[s.id-1].score.toFixed(0)]))
    }));
  },[filtered,showMatrix]);

  // Bond alignment summary
  const bondAlignSummary=useMemo(()=>{
    return SDGS.filter(s=>s.social).map(s=>{
      const aligned=filtered.filter(c=>c.sdgs[s.id-1].bondAlign).length;
      return {id:s.id,name:s.name,aligned,total:filtered.length,pct:+(aligned/filtered.length*100).toFixed(0)};
    });
  },[filtered]);

  return (<div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{...card,display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
      <span style={hdr}>REGION</span>
      <select style={sel} value={regFilter} onChange={e=>setRegFilter(e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select>
      <button onClick={()=>setShowMatrix(!showMatrix)} style={pill(showMatrix)}>Full Matrix</button>
      <span style={{marginLeft:'auto',fontFamily:T.mono,fontSize:11,color:T.textMut}}>Click SDG for country rankings</span>
    </div>

    {/* 17 SDGs overview */}
    <div style={card}>
      <div style={hdr}>17 SDGs — AVERAGE PROGRESS vs 2030 TARGET</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sdgAvgs} margin={{bottom:20}}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis dataKey="id" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <YAxis domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/><Tooltip contentStyle={{fontSize:11}}/>
          <Bar dataKey="avg" name="Current" fill={T.navy} radius={[2,2,0,0]} onClick={(d)=>setSelSdg(d.id)}>
            {sdgAvgs.map((s,i)=><Cell key={i} fill={s.social?T.navy:T.textMut+'80'} cursor="pointer"/>)}
          </Bar>
          <Bar dataKey="target" name="2030 Target" fill={T.gold} radius={[2,2,0,0]} opacity={0.35}/>
          <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Social SDGs detailed cards */}
    <div style={card}>
      <div style={hdr}>SOCIAL SDGs (1,2,3,4,5,8,10,16) — DETAILED TRACKING</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10}}>
        {socialSdgs.map(s=>(
          <div key={s.id} onClick={()=>setSelSdg(s.id)} style={{padding:12,borderRadius:6,background:T.surfaceH,border:`1px solid ${selSdg===s.id?T.navy:T.border}`,cursor:'pointer',transition:'border .15s'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
              <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy}}>SDG {s.id}</span>
              <span style={{fontSize:10,color:s.gap>15?T.red:s.gap>5?T.amber:T.green,fontFamily:T.mono,fontWeight:600}}>Gap: {s.gap}</span>
            </div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>{s.name}</div>
            <div style={{height:8,background:T.border,borderRadius:4,overflow:'hidden',marginBottom:4}}>
              <div style={{width:`${s.avg}%`,height:'100%',background:s.avg>=s.target*0.85?T.green:s.avg>=s.target*0.6?T.amber:T.red,borderRadius:4,transition:'width .3s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:T.mono}}>
              <span style={{color:T.textMut}}>Current: {s.avg}</span>
              <span style={{color:T.textMut}}>Target: {s.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Gap analysis */}
    <div style={card}>
      <div style={hdr}>GAP ANALYSIS — DISTANCE TO 2030 TARGETS</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={socialSdgs} layout="vertical" margin={{left:110}}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis type="number" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border} width={105}/>
          <Tooltip contentStyle={{fontSize:11}}/>
          <Bar dataKey="gap" name="Gap to Target" radius={[0,3,3,0]}>{socialSdgs.map((s,i)=><Cell key={i} fill={s.gap>15?T.red:s.gap>5?T.amber:T.green}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* SDG bond alignment */}
    <div style={card}>
      <div style={hdr}>SDG BOND ALIGNMENT — SOCIAL SDGs</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
        {bondAlignSummary.map(b=>(
          <div key={b.id} style={{padding:10,borderRadius:6,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'center'}}>
            <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>SDG {b.id}</div>
            <div style={{fontSize:9,color:T.textSec,marginBottom:4}}>{b.name}</div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:b.pct>=60?T.green:b.pct>=40?T.amber:T.red}}>{b.pct}%</div>
            <div style={{fontSize:9,color:T.textMut}}>{b.aligned}/{b.total} aligned</div>
          </div>
        ))}
      </div>
    </div>

    {/* SDG by region heatmap */}
    <div style={card}>
      <div style={hdr}>SOCIAL SDG COVERAGE BY REGION</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr>
            <th style={{padding:5,textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textMut}}>REGION</th>
            {SDGS.filter(s=>s.social).map(s=><th key={s.id} style={{padding:5,textAlign:'center',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}>SDG{s.id}</th>)}
          </tr></thead>
          <tbody>{regCoverage.map(r=>(
            <tr key={r.region} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:5,fontWeight:600,color:REGION_COLORS[r.region]}}>{r.region}</td>
              {SDGS.filter(s=>s.social).map(s=>{
                const v=r[`SDG${s.id}`];
                return <td key={s.id} style={{padding:5,textAlign:'center',background:v>=65?T.green+'18':v>=45?T.gold+'18':T.red+'18',color:v>=65?T.green:v>=45?T.gold:T.red,fontWeight:600}}>{v}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    {/* Full 17xN matrix */}
    {showMatrix&&<div style={card}>
      <div style={hdr}>17 SDGs x TOP 30 COUNTRIES — FULL MATRIX</div>
      <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
        <table style={{borderCollapse:'collapse',fontSize:9,fontFamily:T.mono}}>
          <thead><tr style={{position:'sticky',top:0,background:T.surface}}>
            <th style={{padding:4,textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textMut,minWidth:90}}>COUNTRY</th>
            {SDGS.map(s=><th key={s.id} style={{padding:4,textAlign:'center',borderBottom:`2px solid ${T.border}`,color:s.social?T.navy:T.textMut,fontSize:8,minWidth:32}}>SDG{s.id}</th>)}
          </tr></thead>
          <tbody>{fullMatrix.map(c=>(
            <tr key={c.iso} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:3,fontWeight:500,fontSize:9}}>{c.iso} {c.name}</td>
              {SDGS.map(s=>{
                const v=+c[`SDG${s.id}`];
                return <td key={s.id} style={{padding:3,textAlign:'center',background:v>=70?T.green+'15':v>=45?T.gold+'10':T.red+'10',color:v>=70?T.green:v>=45?T.text:T.red}}>{v}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>}

    {/* Country ranking for selected SDG */}
    {selSdg&&<div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
        <div style={hdr}>SDG {selSdg} — {SDGS[selSdg-1].name.toUpperCase()} — COUNTRY RANKINGS</div>
        <button onClick={()=>setSelSdg(null)} style={{...pill(false),fontSize:10}}>Clear</button>
      </div>
      <div style={{maxHeight:380,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`,position:'sticky',top:0,background:T.surface}}>
            <th style={{padding:5,textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>#</th>
            <th style={{padding:5,textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>COUNTRY</th>
            <th style={{padding:5,textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>REGION</th>
            <th style={{padding:5,textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.textMut}}>SCORE</th>
            <th style={{padding:5,textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.textMut}}>TARGET</th>
            <th style={{padding:5,textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.textMut}}>GAP</th>
            <th style={{padding:5,textAlign:'center',fontFamily:T.mono,fontSize:9,color:T.textMut}}>BOND</th>
          </tr></thead>
          <tbody>{sdgCountryRanking.slice(0,40).map((c,i)=>{
            const s=c.sdgs[selSdg-1];const gap=s.target2030-s.score;
            return <tr key={c.iso} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:4,fontFamily:T.mono,color:T.textMut,fontSize:10}}>{i+1}</td>
              <td style={{padding:4,fontWeight:500}}>{c.iso} {c.name}</td>
              <td style={{padding:4,color:REGION_COLORS[c.region],fontSize:10}}>{c.region}</td>
              <td style={{padding:4,textAlign:'right',fontFamily:T.mono,fontWeight:600,color:tierColor(s.score)}}>{fmt(s.score)}</td>
              <td style={{padding:4,textAlign:'right',fontFamily:T.mono,color:T.textMut}}>{fmt(s.target2030)}</td>
              <td style={{padding:4,textAlign:'right',fontFamily:T.mono,color:gap>10?T.red:T.green}}>{fmt(gap)}</td>
              <td style={{padding:4,textAlign:'center',fontSize:10,fontFamily:T.mono}}>{s.bondAlign?<span style={{color:T.green}}>YES</span>:<span style={{color:T.textMut}}>NO</span>}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   TAB 4 — Portfolio Social Screen
   ══════════════════════════════════════════════════════════════ */
function PortfolioTab(){
  const [minThreshold,setMinThreshold]=useState(40);
  const [sortBy,setSortBy]=useState('composite');
  const [showCalc,setShowCalc]=useState(false);

  // Mock portfolio: 25 sovereign bonds
  const portfolio=useMemo(()=>{
    return COUNTRIES.slice(0,25).map((c,i)=>{
      const weight=clamp(3+sr(i*999)*10,1,14);
      const adjYield=c.bondYield*(1+((50-c.composite)/200));
      return {...c,weight:+weight.toFixed(1),adjYield:+adjYield.toFixed(2),
        socialPremium:+((adjYield-c.bondYield)*100).toFixed(0)};
    });
  },[]);

  const totalWeight=portfolio.reduce((a,p)=>a+p.weight,0);
  const normalised=portfolio.map(p=>({...p,normWeight:+(p.weight/totalWeight*100).toFixed(1)}));

  const screened=useMemo(()=>{
    let d=normalised.filter(c=>c.composite>=minThreshold);
    return [...d].sort((a,b)=>sortBy==='name'?a.name.localeCompare(b.name):(b[sortBy]||0)-(a[sortBy]||0));
  },[minThreshold,sortBy,normalised]);

  const excluded=normalised.filter(c=>c.composite<minThreshold);

  // Momentum
  const momentum=useMemo(()=>[...COUNTRIES].sort((a,b)=>b.socialMomentum-a.socialMomentum).slice(0,15),[]);

  // Social vs environmental trade-offs
  const tradeoffs=useMemo(()=>COUNTRIES.map(c=>({name:c.name,social:c.composite,env:c.envScore,region:c.region})),[]);

  const exportCsv=useCallback(()=>{
    const headers=['Country','ISO','Region','Income','Composite','HDI','Gini_Eq','Healthcare','Education','Labour','Gender','Press','Food','Bond_Yield','Adj_Yield','Rating','Momentum'];
    const rows=COUNTRIES.map(c=>[c.name,c.iso,c.region,c.income,fmt(c.composite),fmt(c.hdi),fmt(c.gini_eq),fmt(c.healthcare),fmt(c.education),fmt(c.labour),fmt(c.gender),fmt(c.press),fmt(c.food),c.bondYield,c.bondYield,c.rating,c.socialMomentum].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='sovereign_social_index_report.csv';a.click();URL.revokeObjectURL(url);
  },[]);

  return (<div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Controls */}
    <div style={{...card,display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
      <span style={hdr}>PORTFOLIO SOCIAL SCREEN</span>
      <label style={{fontSize:11,fontFamily:T.mono,color:T.textSec,display:'flex',alignItems:'center',gap:4}}>
        Min Score:
        <input type="range" min={10} max={80} value={minThreshold} onChange={e=>setMinThreshold(+e.target.value)} style={{verticalAlign:'middle',width:100}}/>
        <span style={{fontWeight:700,color:T.navy,minWidth:24}}>{minThreshold}</span>
      </label>
      <select style={sel} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
        <option value="composite">Sort: Composite</option>
        <option value="bondYield">Sort: Yield</option>
        <option value="adjYield">Sort: Adj. Yield</option>
        <option value="socialMomentum">Sort: Momentum</option>
        <option value="normWeight">Sort: Weight</option>
      </select>
      <button onClick={()=>setShowCalc(!showCalc)} style={pill(showCalc)}>Yield Calculator</button>
      <button onClick={exportCsv} style={{...pill(true),background:T.sage,borderColor:T.sage}}>Export CSV</button>
    </div>

    {/* KPIs */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
      {[
        {label:'Holdings',val:screened.length,unit:'sovereigns',color:T.navy},
        {label:'Avg Social',val:fmt(screened.reduce((a,c)=>a+c.composite,0)/(screened.length||1)),unit:'/100',color:tierColor(screened.reduce((a,c)=>a+c.composite,0)/(screened.length||1))},
        {label:'Avg Yield',val:fmt(screened.reduce((a,c)=>a+c.bondYield,0)/(screened.length||1)),unit:'%',color:T.gold},
        {label:'Adj Yield',val:fmt(screened.reduce((a,c)=>a+c.adjYield,0)/(screened.length||1)),unit:'%',color:T.navyL},
        {label:'Screened Out',val:excluded.length,unit:'below threshold',color:T.red},
        {label:'Avg Momentum',val:fmt(screened.reduce((a,c)=>a+c.socialMomentum,0)/(screened.length||1)),unit:'delta',color:T.sage}
      ].map((k,i)=>(
        <div key={i} style={{...card,textAlign:'center',borderTop:`3px solid ${k.color}`}}>
          <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,marginBottom:2}}>{k.label}</div>
          <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:k.color}}>{k.val}</div>
          <div style={{fontSize:8,color:T.textMut}}>{k.unit}</div>
        </div>
      ))}
    </div>

    {/* Holdings table */}
    <div style={card}>
      <div style={hdr}>SOVEREIGN BOND HOLDINGS — SOCIAL OVERLAY</div>
      <div style={{maxHeight:420,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`,position:'sticky',top:0,background:T.surface}}>
            {['Country','Region','Wt%','Social','Yield%','Adj%','Premium bp','Rating','Mom','Tier'].map(h=>(
              <th key={h} style={{padding:'6px 4px',textAlign:h==='Country'||h==='Region'?'left':'right',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{screened.map(c=>(
            <tr key={c.iso} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'5px 4px',fontWeight:500,fontSize:11}}><span style={{fontFamily:T.mono,color:T.textMut,marginRight:3}}>{c.iso}</span>{c.name}</td>
              <td style={{padding:'5px 4px',color:REGION_COLORS[c.region],fontSize:10}}>{c.region}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{c.normWeight}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontWeight:600,color:tierColor(c.composite)}}>{fmt(c.composite)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{c.bondYield}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,color:T.navyL,fontSize:10}}>{c.adjYield}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:10,color:c.socialPremium>0?T.red:T.green}}>{c.socialPremium>0?'+':''}{c.socialPremium}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{c.rating}</td>
              <td style={{padding:'5px 4px',textAlign:'right',fontFamily:T.mono,fontSize:10,color:c.socialMomentum>0?T.green:T.red}}>{c.socialMomentum>0?'+':''}{c.socialMomentum}</td>
              <td style={{padding:'5px 4px',textAlign:'center'}}><span style={{padding:'2px 6px',borderRadius:3,fontSize:8,fontFamily:T.mono,background:tierColor(c.composite)+'18',color:tierColor(c.composite)}}>{tierOf(c.composite)}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {excluded.length>0&&<div style={{marginTop:8,padding:8,background:T.red+'08',borderRadius:4,border:`1px solid ${T.red}20`}}>
        <div style={{fontSize:10,fontFamily:T.mono,color:T.red,fontWeight:600}}>SCREENED OUT ({excluded.length})</div>
        <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{excluded.map(c=>c.name).join(', ')}</div>
      </div>}
    </div>

    {/* Social improvement momentum */}
    <div style={card}>
      <div style={hdr}>SOCIAL IMPROVEMENT MOMENTUM — TOP 15 FASTEST IMPROVING</div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={momentum} layout="vertical" margin={{left:85}}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis type="number" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.border} width={80}/>
          <Tooltip contentStyle={{fontSize:11}} formatter={(v)=>[fmt(v,2),'Momentum']}/>
          <Bar dataKey="socialMomentum" name="Momentum" radius={[0,3,3,0]}>
            {momentum.map((c,i)=><Cell key={i} fill={c.socialMomentum>0?T.green:T.red}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Social vs Environmental trade-offs scatter */}
    <div style={card}>
      <div style={hdr}>SOCIAL vs ENVIRONMENTAL SCORE — TRADE-OFF ANALYSIS</div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis dataKey="social" name="Social" domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border} label={{value:'Social Score',position:'bottom',fontSize:10,fontFamily:T.mono}}/>
          <YAxis dataKey="env" name="Environmental" domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border} label={{value:'Env Score',angle:-90,position:'insideLeft',fontSize:10,fontFamily:T.mono}}/>
          <Tooltip cursor={{strokeDasharray:'3 3'}} content={({active,payload})=>{
            if(!active||!payload?.length) return null;
            const d=payload[0].payload;
            return <div style={{background:T.surface,border:`1px solid ${T.border}`,padding:8,borderRadius:4,fontSize:11,fontFamily:T.font}}>
              <div style={{fontWeight:600}}>{d.name}</div>
              <div style={{fontFamily:T.mono}}>Social: {fmt(d.social)}</div>
              <div style={{fontFamily:T.mono}}>Environmental: {fmt(d.env)}</div>
            </div>;
          }}/>
          <Scatter data={tradeoffs}>{tradeoffs.map((d,i)=><Cell key={i} fill={REGION_COLORS[d.region]||T.navy} opacity={0.65}/>)}</Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:6}}>
        {Object.entries(REGION_COLORS).map(([r,c])=><span key={r} style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:c,marginRight:3,verticalAlign:'middle'}}/>{r}</span>)}
      </div>
    </div>

    {/* Yield calculator detail */}
    {showCalc&&<div style={card}>
      <div style={hdr}>SOCIAL-ADJUSTED YIELD CALCULATOR</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Social premium/discount applied to base sovereign yield. Countries with composite social scores below 50 receive a positive risk premium; above 50 receive a discount reflecting lower social risk.</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {['Leader (80+)','Strong (60-79)','Moderate (40-59)','Weak (<40)'].map((tier,ti)=>{
          const cs=COUNTRIES.filter(c=>ti===0?c.composite>=80:ti===1?(c.composite>=60&&c.composite<80):ti===2?(c.composite>=40&&c.composite<60):c.composite<40);
          const avgYield=cs.length?cs.reduce((a,c)=>a+c.bondYield,0)/cs.length:0;
          const avgAdj=cs.length?cs.reduce((a,c)=>a+c.bondYield*(1+((50-c.composite)/200)),0)/cs.length:0;
          const colors=[T.green,T.navyL,T.amber,T.red];
          return <div key={tier} style={{padding:14,borderRadius:6,border:`1px solid ${colors[ti]}30`,background:colors[ti]+'06'}}>
            <div style={{fontSize:12,fontWeight:600,color:colors[ti]}}>{tier}</div>
            <div style={{fontSize:9,color:T.textMut,marginBottom:6}}>{cs.length} countries</div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <div>
                <div style={{fontSize:8,color:T.textMut,fontFamily:T.mono}}>BASE YIELD</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono,color:colors[ti]}}>{fmt(avgYield)}%</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:8,color:T.textMut,fontFamily:T.mono}}>ADJ YIELD</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono,color:T.text}}>{fmt(avgAdj)}%</div>
              </div>
            </div>
            <div style={{fontSize:9,fontFamily:T.mono,color:avgAdj>avgYield?T.red:T.green}}>
              Premium: {((avgAdj-avgYield)*100).toFixed(0)}bp
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* Region allocation breakdown */}
    <div style={card}>
      <div style={hdr}>PORTFOLIO REGION ALLOCATION — SOCIAL WEIGHTED</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
        {REGIONS.filter(r=>r!=='All').map(r=>{
          const cs=screened.filter(c=>c.region===r);
          const wt=cs.reduce((a,c)=>a+c.normWeight,0);
          const avgSoc=cs.length?cs.reduce((a,c)=>a+c.composite,0)/cs.length:0;
          return <div key={r} style={{padding:10,borderRadius:6,background:T.surfaceH,border:`1px solid ${T.border}`,borderLeft:`3px solid ${REGION_COLORS[r]}`}}>
            <div style={{fontSize:11,fontWeight:600,color:REGION_COLORS[r]}}>{r}</div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
              <div>
                <div style={{fontSize:8,color:T.textMut,fontFamily:T.mono}}>HOLDINGS</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{cs.length}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:8,color:T.textMut,fontFamily:T.mono}}>WEIGHT</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{fmt(wt)}%</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:8,color:T.textMut,fontFamily:T.mono}}>AVG SOC</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono,color:tierColor(avgSoc)}}>{fmt(avgSoc)}</div>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>

    {/* Portfolio composite trend over 12Q */}
    <div style={card}>
      <div style={hdr}>PORTFOLIO COMPOSITE SOCIAL TREND — 12 QUARTERS</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={QUARTERS.map((q,qi)=>{
          const avg=screened.reduce((a,c)=>{
            const dimAvg=DIM_KEYS.reduce((s,k,di)=>s+c.trends[di][qi].value,0)/8;
            return a+dimAvg*c.normWeight/100;
          },0);
          const best=screened.reduce((mx,c)=>{
            const v=DIM_KEYS.reduce((s,k,di)=>s+c.trends[di][qi].value,0)/8;
            return v>mx?v:mx;
          },0);
          const worst=screened.reduce((mn,c)=>{
            const v=DIM_KEYS.reduce((s,k,di)=>s+c.trends[di][qi].value,0)/8;
            return v<mn?v:mn;
          },100);
          return {quarter:q,weighted:+avg.toFixed(1),best:+best.toFixed(1),worst:+worst.toFixed(1)};
        })}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
          <XAxis dataKey="quarter" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <YAxis domain={[0,100]} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.border}/>
          <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
          <Line type="monotone" dataKey="weighted" name="Wtd Avg" stroke={T.navy} strokeWidth={2} dot={{r:3}}/>
          <Line type="monotone" dataKey="best" name="Best" stroke={T.green} strokeWidth={1} strokeDasharray="4 4" dot={false}/>
          <Line type="monotone" dataKey="worst" name="Worst" stroke={T.red} strokeWidth={1} strokeDasharray="4 4" dot={false}/>
          <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Income group analysis */}
    <div style={card}>
      <div style={hdr}>PORTFOLIO INCOME GROUP ANALYSIS</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {INCOME_GROUPS.filter(g=>g!=='All').map((g,gi)=>{
          const cs=screened.filter(c=>c.income===g);
          const avgSoc=cs.length?cs.reduce((a,c)=>a+c.composite,0)/cs.length:0;
          const avgYld=cs.length?cs.reduce((a,c)=>a+c.bondYield,0)/cs.length:0;
          const colors=[T.navy,T.gold,T.amber,T.red];
          return <div key={g} style={{padding:10,borderRadius:6,background:T.surfaceH,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,fontWeight:600,color:colors[gi]}}>{g} Income</div>
            <div style={{fontSize:9,color:T.textMut,marginBottom:6}}>{cs.length} holdings</div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:8,fontFamily:T.mono,color:T.textMut}}>AVG SOC</div>
                <div style={{fontSize:15,fontWeight:700,fontFamily:T.mono,color:tierColor(avgSoc)}}>{cs.length?fmt(avgSoc):'—'}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:8,fontFamily:T.mono,color:T.textMut}}>AVG YLD</div>
                <div style={{fontSize:15,fontWeight:700,fontFamily:T.mono}}>{cs.length?fmt(avgYld)+'%':'—'}</div></div>
            </div>
          </div>;
        })}
      </div>
    </div>

    {/* Social risk summary */}
    <div style={card}>
      <div style={hdr}>SOCIAL RISK SUMMARY — PORTFOLIO EXPOSURE</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
        {DIM_KEYS.map((k,i)=>{
          const wtdAvg=screened.reduce((a,c)=>a+c[k]*c.normWeight/100,0);
          const minVal=screened.reduce((m,c)=>c[k]<m?c[k]:m,100);
          const minC=screened.find(c=>c[k]===minVal);
          return <div key={k} style={{padding:10,borderRadius:6,border:`1px solid ${T.border}`,borderLeft:`3px solid ${DIM_COLORS[i]}`}}>
            <div style={{fontSize:10,fontWeight:600,color:DIM_COLORS[i],fontFamily:T.mono}}>{DIMS[i]}</div>
            <div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:tierColor(wtdAvg),marginTop:2}}>{fmt(wtdAvg)}</div>
            <div style={{fontSize:8,color:T.textMut,fontFamily:T.mono}}>weighted avg</div>
            <div style={{fontSize:9,color:T.red,fontFamily:T.mono,marginTop:4}}>Min: {fmt(minVal)} ({minC?.iso})</div>
          </div>;
        })}
      </div>
    </div>
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════ */
const TABS=['Social Performance Dashboard','Dimension Deep Dive','SDG Alignment','Portfolio Social Screen'];

export default function SovereignSocialIndexPage(){
  const [tab,setTab]=useState(0);

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'18px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.gold,letterSpacing:'0.12em',marginBottom:2}}>EP-AQ5</div>
            <h1 style={{fontSize:20,fontWeight:700,margin:0,color:T.navy}}>Sovereign Social Performance Index</h1>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>Country-level social metrics for sovereign bond investors: 80 countries, 8 dimensions, 12Q trends, SDG alignment</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Last updated: Q4 2025</div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{COUNTRIES.length} sovereigns | {DIMS.length} dimensions | {QUARTERS.length} quarters</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,padding:'0 24px',display:'flex',gap:2,overflowX:'auto'}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'10px 18px',fontSize:12,fontFamily:T.mono,fontWeight:tab===i?600:400,
            color:tab===i?T.navy:T.textMut,background:'transparent',border:'none',
            borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',
            cursor:'pointer',transition:'all .15s',whiteSpace:'nowrap'
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:24,maxWidth:1440,margin:'0 auto'}}>
        {tab===0&&<DashboardTab/>}
        {tab===1&&<DimensionTab/>}
        {tab===2&&<SdgTab/>}
        {tab===3&&<PortfolioTab/>}
      </div>

      {/* Footer */}
      <div style={{borderTop:`1px solid ${T.border}`,padding:'12px 24px',display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:T.mono,color:T.textMut}}>
        <span>Sovereign Social Index v2.0 | {COUNTRIES.length} countries | {DIMS.length} dimensions | {QUARTERS.length}Q history</span>
        <span>Data: UNDP HDI, World Bank WDI, ILO, WHO, UNESCO, Freedom House, FAO | Deterministic seed</span>
      </div>
    </div>
  );
}
