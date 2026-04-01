import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell, Legend, ComposedChart, ReferenceLine,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#0e7490',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',emerald:'#059669',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── Statics ─────────────────────────────────────────────────────────────── */
const TABS=['NDC Overview','Emissions Trajectory','Sectoral Targets','Implementation Gap','Paris Alignment','G20 Focus','Country Drilldown'];
const PARIS_RATINGS=['1.5C','2C','NDC','Insufficient','Critically Insufficient'];
const SECTORS=['Energy','Transport','Buildings','Agriculture','Industry','Land Use'];
const IMPL_GRADES=['A','B','C','D','E','F'];
const YEARS_HIST=Array.from({length:14},(_,i)=>(2010+i).toString());
const G20=['United States','China','European Union','India','Japan','Germany','United Kingdom','France','Italy','Canada','South Korea','Australia','Brazil','Mexico','Indonesia','Saudi Arabia','Turkey','Argentina','South Africa','Russia'];

const COUNTRY_NAMES=[
  'Norway','Denmark','Sweden','Finland','New Zealand','United Kingdom','Germany','Switzerland','Netherlands','Austria',
  'France','Japan','South Korea','Canada','Australia','Ireland','Belgium','Spain','Portugal','Italy',
  'United States','Czech Republic','Poland','Hungary','Greece','Mexico','Brazil','Chile','Colombia','Argentina',
  'Peru','Costa Rica','Uruguay','China','India','Indonesia','Thailand','Malaysia','Philippines','Vietnam',
  'Bangladesh','Pakistan','Sri Lanka','Nepal','Cambodia','South Africa','Nigeria','Kenya','Ghana','Morocco',
  'Egypt','Saudi Arabia','UAE','Qatar','Kuwait','Turkey','Jordan','Oman','Bahrain','Tunisia',
  'Ethiopia','Tanzania','Rwanda','Senegal','Ivory Coast','Kazakhstan','Ukraine','Belarus','Iran','Iraq',
  'Libya','Algeria','Venezuela','Bolivia','Ecuador','Paraguay','Honduras','Guatemala','El Salvador','Panama',
];

const PARIS_BASE={
  'Norway':0,'Denmark':0,'Sweden':0,'Finland':0,'New Zealand':1,'United Kingdom':0,'Germany':0,'Switzerland':0,'Netherlands':0,'Austria':0,
  'France':0,'Japan':1,'South Korea':2,'Canada':1,'Australia':2,'Ireland':0,'Belgium':1,'Spain':1,'Portugal':0,'Italy':1,
  'United States':1,'Czech Republic':2,'Poland':2,'Hungary':2,'Greece':2,'Mexico':3,'Brazil':2,'Chile':1,'Colombia':2,'Argentina':3,
  'Peru':2,'Costa Rica':1,'Uruguay':1,'China':3,'India':3,'Indonesia':3,'Thailand':3,'Malaysia':3,'Philippines':2,'Vietnam':3,
  'Bangladesh':3,'Pakistan':4,'Sri Lanka':3,'Nepal':2,'Cambodia':3,'South Africa':3,'Nigeria':4,'Kenya':3,'Ghana':3,'Morocco':2,
  'Egypt':4,'Saudi Arabia':4,'UAE':3,'Qatar':4,'Kuwait':4,'Turkey':3,'Jordan':3,'Oman':4,'Bahrain':4,'Tunisia':3,
  'Ethiopia':3,'Tanzania':4,'Rwanda':3,'Senegal':4,'Ivory Coast':4,'Kazakhstan':4,'Ukraine':2,'Belarus':4,'Iran':4,'Iraq':4,
  'Libya':4,'Algeria':4,'Venezuela':4,'Bolivia':4,'Ecuador':3,'Paraguay':3,'Honduras':3,'Guatemala':3,'El Salvador':2,'Panama':2,
};

const IMPL_BASE={
  'Norway':0,'Denmark':0,'Sweden':0,'Finland':0,'New Zealand':1,'United Kingdom':0,'Germany':0,'Switzerland':0,'Netherlands':0,'Austria':0,
  'France':1,'Japan':1,'South Korea':2,'Canada':1,'Australia':2,'Ireland':1,'Belgium':1,'Spain':1,'Portugal':1,'Italy':2,
  'United States':1,'Czech Republic':2,'Poland':2,'Hungary':2,'Greece':2,'Mexico':2,'Brazil':2,'Chile':1,'Colombia':2,'Argentina':3,
  'Peru':2,'Costa Rica':1,'Uruguay':1,'China':2,'India':2,'Indonesia':3,'Thailand':2,'Malaysia':2,'Philippines':2,'Vietnam':3,
  'Bangladesh':3,'Pakistan':4,'Sri Lanka':3,'Nepal':3,'Cambodia':3,'South Africa':3,'Nigeria':4,'Kenya':3,'Ghana':3,'Morocco':2,
  'Egypt':4,'Saudi Arabia':3,'UAE':2,'Qatar':3,'Kuwait':4,'Turkey':3,'Jordan':3,'Oman':3,'Bahrain':4,'Tunisia':3,
};

const COUNTRIES=COUNTRY_NAMES.map((name,i)=>{
  const s=i*11+3;
  const parisIdx=Math.min(PARIS_BASE[name]??Math.min(Math.floor(sr(s)*5),4),4);
  const implIdx=Math.min(IMPL_BASE[name]??Math.min(Math.floor(sr(s+7)*6),5),5);
  const ndcSubmitted=true;
  const ndcYear=sr(s+1)>0.5?2021:sr(s+1)>0.25?2022:sr(s+1)>0.1?2016:2015;
  const baselineYear=sr(s+2)>0.5?2010:sr(s+2)>0.2?2005:1990;
  const baselineEmissions=+(50+sr(s+3)*3000).toFixed(0);
  const currentEmissions=+(baselineEmissions*(0.7+sr(s+4)*0.5)).toFixed(0);
  const unconditionalTarget=-(10+parisIdx*5+sr(s+5)*30);
  const conditionalTarget=unconditionalTarget-(5+sr(s+6)*20);
  const projectedBAU2030=+(baselineEmissions*(1.0+sr(s+7)*0.4)).toFixed(0);
  const requiredForParis1p5=+(baselineEmissions*0.55).toFixed(0);
  const requiredForParis2p0=+(baselineEmissions*0.7).toFixed(0);
  const implementationScore=+(90-implIdx*14+sr(s+8)*10).toFixed(1);
  const implementationGrade=IMPL_GRADES[implIdx];
  const financingGap=+(10+sr(s+9)*500).toFixed(1);
  const carbonPricingInPlace=sr(s+10)>0.5+parisIdx*0.1;
  const netzeroTargetYear=parisIdx<=2?2050:parisIdx===3?null:null;
  const netzeroLaw=parisIdx<=1&&sr(s+11)>0.3;
  const parisAlignmentRating=PARIS_RATINGS[parisIdx];
  const sectoralTargets=SECTORS.reduce((a,sec,si)=>({...a,[sec.toLowerCase()]:+(5+Math.max(0,50-parisIdx*8)+sr(s+12+si)*25).toFixed(1)}),{});
  const histEmissions=YEARS_HIST.map((yr,yi)=>+(currentEmissions*(0.65+yi*0.03+sr(s+20+yi)*0.08)).toFixed(0));
  const projections2030=+(currentEmissions*(1.0-Math.abs(unconditionalTarget)/100)).toFixed(0);
  return {
    id:i,name,ndcSubmitted,ndcYear,conditionalTarget:+conditionalTarget.toFixed(1),unconditionalTarget:+unconditionalTarget.toFixed(1),
    baselineYear,baselineEmissionsMtCO2:+baselineEmissions,currentEmissionsMtCO2:+currentEmissions,
    projectedBAU2030,requiredForParis1p5,requiredForParis2p0,implementationScore,implementationGrade,
    financingGapBnUSD:+financingGap,carbonPricingInPlace,netzeroTargetYear,netzeroLaw,
    sectoralTargets,parisAlignmentRating,histEmissions,projections2030,
  };
});

/* ─── G20 Historical Emissions 2010-2023 ──────────────────────────────────── */
const G20_HIST=YEARS_HIST.map((yr,yi)=>{
  const row={year:yr};
  G20.slice(0,12).forEach((name,ci)=>{
    const c=COUNTRIES.find(x=>x.name===name)||COUNTRIES[ci];
    row[name.slice(0,6)]=c?c.histEmissions[yi]:0;
  });
  return row;
});

/* ─── Sectoral Emission Sources 2010-2023 ─────────────────────────────────── */
const SECTOR_TREND=YEARS_HIST.map((yr,yi)=>({
  year:yr,
  Energy:+(18000+yi*200+sr(yi*13)*500).toFixed(0),
  Transport:+(8000+yi*100+sr(yi*17)*300).toFixed(0),
  Buildings:+(6000-yi*50+sr(yi*19)*200).toFixed(0),
  Agriculture:+(5500+yi*30+sr(yi*23)*150).toFixed(0),
  Industry:+(9000+yi*50+sr(yi*29)*400).toFixed(0),
  'Land Use':+(2500-yi*80+sr(yi*31)*200).toFixed(0),
}));

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{background:T.navy,borderRadius:8,padding:'18px 24px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'},
  title:{fontSize:22,fontWeight:700,color:'#fff',margin:0,letterSpacing:'-0.01em'},
  subtitle:{fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:4,fontFamily:T.mono},
  badge:{fontSize:11,fontFamily:T.mono,padding:'3px 10px',borderRadius:4,fontWeight:700,background:'#0e7490',color:'#fff'},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 18px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2,transition:'all 0.15s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12,display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${T.border}`,paddingBottom:8},
  grid:(cols)=>({display:'grid',gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:14}),
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textSec,marginTop:4},
  select:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'},
  btn:(a)=>({padding:'7px 14px',borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:11,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.04em',cursor:'pointer',userSelect:'none'},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.text},
  pill:(c)=>({display:'inline-block',fontSize:10,fontFamily:T.mono,padding:'2px 8px',borderRadius:10,fontWeight:700,color:'#fff',background:c}),
  input:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,width:'100%',boxSizing:'border-box'},
  row:{display:'flex',gap:14,marginBottom:14,alignItems:'stretch'},
  flex:{display:'flex',alignItems:'center',gap:8},
  mono:{fontFamily:T.mono,fontSize:12},
};

const parisColor=(r)=>r==='1.5C'?T.emerald:r==='2C'?T.teal:r==='NDC'?T.gold:r==='Insufficient'?T.amber:'#dc2626';
const gradeColor=(g)=>g==='A'?T.emerald:g==='B'?T.green:g==='C'?T.gold:g==='D'?T.amber:g==='E'?T.red:'#9f1239';
const CHART_COLORS=[T.navy,T.gold,T.emerald,T.amber,T.navyL,T.red,T.teal,T.sage,'#8b5cf6','#ec4899','#14b8a6','#f59e0b'];
const SECTOR_COLORS={Energy:'#dc2626',Transport:'#d97706',Buildings:'#2563eb',Agriculture:'#16a34a',Industry:'#7c3aed','Land Use':'#0e7490'};

export default function NdcAlignmentTrackerPage(){
  const [tab,setTab]=useState(0);
  const [searchQ,setSearchQ]=useState('');
  const [sortCol,setSortCol]=useState('implementationScore');
  const [sortAsc,setSortAsc]=useState(false);
  const [parisFilter,setParisFilter]=useState('All');
  const [selCountry,setSelCountry]=useState(COUNTRIES.find(c=>c.name==='Germany')||COUNTRIES[0]);
  const [selG20,setSelG20]=useState('China');
  const [selSector,setSelSector]=useState('Energy');
  const [showConditional,setShowConditional]=useState(true);

  const filtered=useMemo(()=>{
    let d=[...COUNTRIES];
    if(parisFilter!=='All') d=d.filter(c=>c.parisAlignmentRating===parisFilter);
    if(searchQ) d=d.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase()));
    d.sort((a,b)=>sortAsc?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]>b[sortCol]?-1:1));
    return d;
  },[parisFilter,searchQ,sortCol,sortAsc]);

  const handleSort=useCallback((col)=>{
    if(sortCol===col) setSortAsc(s=>!s);
    else { setSortCol(col); setSortAsc(false); }
  },[sortCol]);

  /* ── Tab 0: NDC Overview ─────────────────────────────────────────────────── */
  const renderOverview=()=>{
    const ratingDist=PARIS_RATINGS.map(r=>({name:r,count:COUNTRIES.filter(c=>c.parisAlignmentRating===r).length,color:parisColor(r)}));
    const ndcYearDist=[{year:'2015',count:COUNTRIES.filter(c=>c.ndcYear===2015).length},{year:'2016',count:COUNTRIES.filter(c=>c.ndcYear===2016).length},{year:'2021',count:COUNTRIES.filter(c=>c.ndcYear===2021).length},{year:'2022',count:COUNTRIES.filter(c=>c.ndcYear===2022).length}];
    const kpis=[
      {label:'Universe',val:'80 countries'},{label:'NDC Submitted',val:'80 / 80'},{label:'Net Zero Target',val:COUNTRIES.filter(c=>c.netzeroTargetYear).length},
      {label:'Net Zero Law',val:COUNTRIES.filter(c=>c.netzeroLaw).length},{label:'Carbon Pricing',val:COUNTRIES.filter(c=>c.carbonPricingInPlace).length},
      {label:'1.5C Aligned',val:COUNTRIES.filter(c=>c.parisAlignmentRating==='1.5C').length},{label:'Avg Impl Score',val:(COUNTRIES.reduce((s,c)=>s+c.implementationScore,0)/80).toFixed(1)},
      {label:'Total Fin. Gap',val:`$${(COUNTRIES.reduce((s,c)=>s+c.financingGapBnUSD,0)/1000).toFixed(1)}T`},
    ];
    return (<>
      <div style={S.grid(4)}>
        {kpis.map((k,i)=>(<div key={i} style={S.kpi}>
          <div style={S.kpiLabel}>{k.label}</div>
          <div style={S.kpiVal}>{k.val}</div>
        </div>))}
      </div>
      <div style={{...S.row,marginTop:14}}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Paris Alignment Distribution</div>
          {ratingDist.map(r=>(<div key={r.name} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{...S.pill(r.color),fontSize:11}}>{r.name}</span>
              <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{r.count} countries ({(r.count/80*100).toFixed(0)}%)</span>
            </div>
            <div style={{height:8,borderRadius:4,background:T.border,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${r.count/80*100}%`,background:r.color,borderRadius:4}}/>
            </div>
          </div>))}
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>NDC Submission Year</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ndcYearDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="count" name="Countries" fill={T.teal} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Country NDC Ranking</span>
          <div style={S.flex}>
            <input style={{...S.input,width:180}} placeholder="Search country..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            <select style={S.select} value={parisFilter} onChange={e=>setParisFilter(e.target.value)}>
              <option value="All">All Ratings</option>
              {PARIS_RATINGS.map(r=>(<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              {[['name','Country'],['parisAlignmentRating','Paris Rating'],['implementationGrade','Impl Grade'],['implementationScore','Impl Score'],['unconditionalTarget','Uncond Target'],['conditionalTarget','Cond Target'],['financingGapBnUSD','Fin Gap $B'],['netzeroTargetYear','Net Zero Yr'],['carbonPricingInPlace','Carbon Price']].map(([c,l])=>(<th key={c} style={S.th} onClick={()=>handleSort(c)}>{l}{sortCol===c?(sortAsc?' ▲':' ▼'):''}</th>))}
            </tr></thead>
            <tbody>
              {filtered.slice(0,25).map(c=>(<tr key={c.id} style={{background:selCountry?.id===c.id?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelCountry(c)}>
                <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                <td style={S.td}><span style={S.pill(parisColor(c.parisAlignmentRating))}>{c.parisAlignmentRating}</span></td>
                <td style={S.td}><span style={{...S.pill(gradeColor(c.implementationGrade))}}>{c.implementationGrade}</span></td>
                <td style={{...S.td,fontFamily:T.mono,color:c.implementationScore>70?T.green:c.implementationScore>50?T.amber:T.red,fontWeight:700}}>{c.implementationScore}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.green}}>{c.unconditionalTarget}%</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.emerald}}>{c.conditionalTarget}%</td>
                <td style={{...S.td,fontFamily:T.mono,color:c.financingGapBnUSD>200?T.red:T.amber}}>${c.financingGapBnUSD}B</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.netzeroTargetYear||'—'}</td>
                <td style={S.td}><span style={{color:c.carbonPricingInPlace?T.green:T.red,fontWeight:700}}>{c.carbonPricingInPlace?'✓':'✗'}</span></td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Showing {Math.min(filtered.length,25)} of {filtered.length} countries</div>
      </div>
    </>);
  };

  /* ── Tab 1: Emissions Trajectory ────────────────────────────────────────── */
  const renderTrajectory=()=>{
    const reqVsProj=COUNTRIES.slice(0,20).map(c=>({
      name:c.name.length>10?c.name.slice(0,10)+'..':c.name,
      current:c.currentEmissionsMtCO2,
      proj2030:c.projectedBAU2030,
      req1p5:c.requiredForParis1p5,
      req2p0:c.requiredForParis2p0,
    }));
    return (<>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Required vs Projected Reductions 2030</span>
          <div style={S.flex}>
            <button style={S.btn(showConditional)} onClick={()=>setShowConditional(true)}>Conditional</button>
            <button style={S.btn(!showConditional)} onClick={()=>setShowConditional(false)}>Unconditional</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={reqVsProj} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'MtCO₂e',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="current" name="Current (2023)" fill={T.navyL} radius={[3,3,0,0]}/>
            <Bar dataKey="proj2030" name="Projected BAU 2030" fill={T.amber} radius={[3,3,0,0]}/>
            <Bar dataKey="req1p5" name="Required 1.5C" fill={T.emerald} radius={[3,3,0,0]}/>
            <Bar dataKey="req2p0" name="Required 2C" fill={T.teal} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>G20 Historical Emissions 2010-2023 (MtCO₂e)</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={G20_HIST}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:9,fill:T.textSec}}/>
            <YAxis tick={{fontSize:9,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            {G20.slice(0,6).map((name,i)=>(<Line key={name} type="monotone" dataKey={name.slice(0,6)} stroke={CHART_COLORS[i]} dot={false} strokeWidth={2}/>))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ── Tab 2: Sectoral Targets ─────────────────────────────────────────────── */
  const renderSectoral=()=>{
    const sectorBar=SECTORS.map(sec=>({
      name:sec,
      global:+(COUNTRIES.reduce((s,c)=>s+(c.sectoralTargets[sec.toLowerCase()]||0),0)/80).toFixed(1),
      aligned:+(COUNTRIES.filter(c=>c.parisAlignmentRating==='1.5C'||c.parisAlignmentRating==='2C').reduce((s,c)=>s+(c.sectoralTargets[sec.toLowerCase()]||0),0)/Math.max(1,COUNTRIES.filter(c=>c.parisAlignmentRating==='1.5C'||c.parisAlignmentRating==='2C').length)).toFixed(1),
      insufficient:+(COUNTRIES.filter(c=>c.parisAlignmentRating==='Insufficient'||c.parisAlignmentRating==='Critically Insufficient').reduce((s,c)=>s+(c.sectoralTargets[sec.toLowerCase()]||0),0)/Math.max(1,COUNTRIES.filter(c=>c.parisAlignmentRating==='Insufficient'||c.parisAlignmentRating==='Critically Insufficient').length)).toFixed(1),
    }));
    return (<>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Global Sectoral Emission Trends (GtCO₂e)</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={SECTOR_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:9,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              {SECTORS.map(sec=>(<Area key={sec} type="monotone" dataKey={sec} stackId="1" stroke={SECTOR_COLORS[sec]} fill={SECTOR_COLORS[sec]} fillOpacity={0.6}/>))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Avg Sectoral Reduction Targets by Alignment Tier (%)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorBar}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="global" name="Global Avg" fill={T.navyL} radius={[3,3,0,0]}/>
              <Bar dataKey="aligned" name="Paris Aligned" fill={T.emerald} radius={[3,3,0,0]}/>
              <Bar dataKey="insufficient" name="Insufficient" fill={T.red} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Country Sectoral Targets Detail</span>
          <select style={S.select} value={selSector} onChange={e=>setSelSector(e.target.value)}>
            {SECTORS.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Country</th>
            <th style={S.th}>Paris Rating</th>
            {SECTORS.map(s=>(<th key={s} style={{...S.th,color:s===selSector?T.gold:T.navy}}>{s}</th>))}
          </tr></thead>
          <tbody>
            {COUNTRIES.slice(0,20).map(c=>(<tr key={c.id}>
              <td style={{...S.td,fontWeight:600}}>{c.name}</td>
              <td style={S.td}><span style={S.pill(parisColor(c.parisAlignmentRating))}>{c.parisAlignmentRating}</span></td>
              {SECTORS.map(s=>(<td key={s} style={{...S.td,fontFamily:T.mono,fontWeight:s===selSector?700:400,background:s===selSector?`rgba(197,169,106,0.08)`:'transparent',color:c.sectoralTargets[s.toLowerCase()]>30?T.green:c.sectoralTargets[s.toLowerCase()]>15?T.amber:T.red}}>{c.sectoralTargets[s.toLowerCase()]}%</td>))}
            </tr>))}
          </tbody>
        </table>
      </div>
    </>);
  };

  /* ── Tab 3: Implementation Gap ───────────────────────────────────────────── */
  const renderImplGap=()=>{
    const gradeData=IMPL_GRADES.map(g=>({grade:g,count:COUNTRIES.filter(c=>c.implementationGrade===g).length,color:gradeColor(g)}));
    const gapData=[...COUNTRIES].sort((a,b)=>b.financingGapBnUSD-a.financingGapBnUSD).slice(0,12).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,gap:c.financingGapBnUSD,impl:c.implementationScore}));
    return (<>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Implementation Grade Distribution</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {gradeData.map(g=>(<div key={g.grade}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontWeight:700,color:gradeColor(g.grade),fontFamily:T.mono,fontSize:14}}>Grade {g.grade}</span>
                <span style={{fontFamily:T.mono,fontSize:12,color:T.navy,fontWeight:700}}>{g.count} countries</span>
              </div>
              <div style={{height:10,borderRadius:5,background:T.border,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${g.count/80*100}%`,background:gradeColor(g.grade),borderRadius:5}}/>
              </div>
            </div>))}
          </div>
        </div>
        <div style={{...S.card,flex:2}}>
          <div style={S.cardTitle}>Largest Financing Gaps ($B)</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={gapData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis yAxisId="left" tick={{fontSize:9,fill:T.textSec}} label={{value:'Gap $B',angle:-90,position:'insideLeft',fontSize:9}}/>
              <YAxis yAxisId="right" orientation="right" domain={[0,100]} tick={{fontSize:9,fill:T.textSec}} label={{value:'Impl Score',angle:90,position:'insideRight',fontSize:9}}/>
              <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar yAxisId="left" dataKey="gap" name="Financing Gap $B" fill={T.red} opacity={0.75} radius={[3,3,0,0]}/>
              <Line yAxisId="right" type="monotone" dataKey="impl" name="Impl Score" stroke={T.emerald} strokeWidth={2} dot={{r:4}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Traffic-Light Implementation Scorecard</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {COUNTRIES.slice(0,25).map(c=>(<div key={c.id} style={{background:c.implementationScore>75?'rgba(5,150,105,0.1)':c.implementationScore>55?'rgba(217,119,6,0.1)':'rgba(220,38,38,0.1)',borderRadius:6,padding:'8px 10px',borderLeft:`3px solid ${gradeColor(c.implementationGrade)}`,cursor:'pointer'}} onClick={()=>setSelCountry(c)}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy}}>{c.name.length>10?c.name.slice(0,10)+'..':c.name}</div>
            <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:gradeColor(c.implementationGrade),marginTop:2}}>Grade {c.implementationGrade}</div>
            <div style={{fontSize:10,color:T.textSec,marginTop:1}}>{c.implementationScore}/100</div>
          </div>))}
        </div>
      </div>
    </>);
  };

  /* ── Tab 4: Paris Alignment ──────────────────────────────────────────────── */
  const renderParisAlignment=()=>{
    const alignData=[...COUNTRIES].sort((a,b)=>b.implementationScore-a.implementationScore).slice(0,20).map(c=>({
      name:c.name.length>10?c.name.slice(0,10)+'..':c.name,
      uncond:Math.abs(c.unconditionalTarget),
      cond:Math.abs(c.conditionalTarget)-Math.abs(c.unconditionalTarget),
      req1p5:Math.abs(c.unconditionalTarget)<45?45-Math.abs(c.unconditionalTarget):0,
    }));
    const netZeroCount=COUNTRIES.filter(c=>c.netzeroTargetYear).length;
    const carbonPriceCount=COUNTRIES.filter(c=>c.carbonPricingInPlace).length;
    return (<>
      <div style={S.grid(4)}>
        {[{l:'1.5C Aligned',v:COUNTRIES.filter(c=>c.parisAlignmentRating==='1.5C').length,c:T.emerald},{l:'2C Compatible',v:COUNTRIES.filter(c=>c.parisAlignmentRating==='2C').length,c:T.teal},{l:'Net Zero Committed',v:netZeroCount,c:T.navyL},{l:'Carbon Pricing',v:carbonPriceCount,c:T.gold}].map((k,i)=>(<div key={i} style={{...S.kpi,borderLeft:`4px solid ${k.c}`}}>
          <div style={S.kpiLabel}>{k.l}</div>
          <div style={{...S.kpiVal,color:k.c}}>{k.v}</div>
          <div style={{fontSize:11,color:T.textMut}}>{(k.v/80*100).toFixed(0)}% of universe</div>
        </div>))}
      </div>
      <div style={{...S.card,marginTop:14}}>
        <div style={S.cardTitle}>NDC Target Ambition — Required vs Committed</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={alignData} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Reduction %',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="uncond" name="Unconditional Target %" stackId="a" fill={T.teal} radius={[0,0,0,0]}/>
            <Bar dataKey="cond" name="Conditional Uplift %" stackId="a" fill={T.emerald} radius={[3,3,0,0]}/>
            <ReferenceLine y={45} stroke={T.red} strokeDasharray="6 3" label={{value:'1.5C Requires 45%',position:'insideTopRight',fontSize:10,fill:T.red}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ── Tab 5: G20 Focus ────────────────────────────────────────────────────── */
  const renderG20=()=>{
    const g20countries=G20.map(name=>COUNTRIES.find(c=>c.name===name)||COUNTRIES[G20.indexOf(name)%COUNTRIES.length]);
    const selG20c=g20countries.find(c=>c&&c.name===selG20)||g20countries[0];
    const compData=g20countries.filter(Boolean).map(c=>({
      name:c.name.length>8?c.name.slice(0,8)+'..':c.name,
      uncond:Math.abs(c.unconditionalTarget),
      cond:Math.abs(c.conditionalTarget),
      impl:c.implementationScore,
      gap:Math.min(c.financingGapBnUSD,300),
    }));
    return (<>
      <div style={{...S.flex,marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Select G20:</span>
        <select style={S.select} value={selG20} onChange={e=>setSelG20(e.target.value)}>
          {G20.map(n=>(<option key={n} value={n}>{n}</option>))}
        </select>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>G20 NDC Ambition — Unconditional vs Conditional Targets</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={compData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="uncond" name="Unconditional %" fill={T.navyL} radius={[3,3,0,0]}/>
            <Bar dataKey="cond" name="Conditional %" fill={T.emerald} radius={[3,3,0,0]}/>
            <ReferenceLine y={45} stroke={T.red} strokeDasharray="5 3" label={{value:'1.5C Min',fontSize:9,fill:T.red}}/>
            <ReferenceLine y={25} stroke={T.amber} strokeDasharray="5 3" label={{value:'2C Min',fontSize:9,fill:T.amber}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>G20 Implementation Scores</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={compData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textSec}} width={65}/>
              <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="impl" name="Impl Score">
                {compData.map((d,i)=>(<Cell key={i} fill={d.impl>70?T.emerald:d.impl>50?T.gold:T.red}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {selG20c&&(<div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>{selG20c.name} — NDC Detail</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['Paris Rating',<span style={S.pill(parisColor(selG20c.parisAlignmentRating))}>{selG20c.parisAlignmentRating}</span>],['Impl Grade',<span style={{...S.pill(gradeColor(selG20c.implementationGrade))}}>{selG20c.implementationGrade}</span>],['Uncond Target',`${selG20c.unconditionalTarget}%`],['Cond Target',`${selG20c.conditionalTarget}%`],['Net Zero Yr',selG20c.netzeroTargetYear||'None'],['Carbon Price',selG20c.carbonPricingInPlace?'Yes':'No'],['Financing Gap',`$${selG20c.financingGapBnUSD}B`],['NDC Year',selG20c.ndcYear]].map(([l,v])=>(<div key={l} style={{background:T.surfaceH,borderRadius:6,padding:'8px 10px'}}>
              <div style={{fontSize:10,color:T.textSec}}>{l}</div>
              <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div>
            </div>))}
          </div>
          <div style={{marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:6}}>Sectoral Targets (%)</div>
            {SECTORS.map(sec=>(<div key={sec} style={{marginBottom:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                <span style={{color:T.textSec}}>{sec}</span>
                <span style={{fontFamily:T.mono,fontWeight:700}}>{selG20c.sectoralTargets[sec.toLowerCase()]}%</span>
              </div>
              <div style={{height:5,borderRadius:2,background:T.border,overflow:'hidden'}}><div style={{height:'100%',width:`${selG20c.sectoralTargets[sec.toLowerCase()]}%`,background:SECTOR_COLORS[sec],borderRadius:2}}/></div>
            </div>))}
          </div>
        </div>)}
      </div>
    </>);
  };

  /* ── Tab 6: Country Drilldown ────────────────────────────────────────────── */
  const renderDrilldown=()=>{
    const trendData=YEARS_HIST.map((yr,yi)=>({year:yr,emissions:selCountry.histEmissions[yi],proj:yi>=10?+(selCountry.currentEmissionsMtCO2*(1-(Math.abs(selCountry.unconditionalTarget)/100)*(yi-9)/4)).toFixed(0):null,bau:yi>=10?+(selCountry.currentEmissionsMtCO2*(1+(sr(yi*37)*0.05))).toFixed(0):null}));
    return (<>
      <div style={{...S.flex,marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Select Country:</span>
        <select style={S.select} value={selCountry.name} onChange={e=>setSelCountry(COUNTRIES.find(c=>c.name===e.target.value)||COUNTRIES[0])}>
          {COUNTRIES.map(c=>(<option key={c.id} value={c.name}>{c.name}</option>))}
        </select>
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1,borderLeft:`4px solid ${parisColor(selCountry.parisAlignmentRating)}`}}>
          <div style={S.cardTitle}>{selCountry.name} — NDC Summary</div>
          <div style={S.grid(3)}>
            {[['Paris Rating',<span style={S.pill(parisColor(selCountry.parisAlignmentRating))}>{selCountry.parisAlignmentRating}</span>],['Impl Grade',<span style={S.pill(gradeColor(selCountry.implementationGrade))}>{selCountry.implementationGrade}</span>],['Impl Score',selCountry.implementationScore],['Uncond Target',`${selCountry.unconditionalTarget}%`],['Cond Target',`${selCountry.conditionalTarget}%`],['Net Zero Yr',selCountry.netzeroTargetYear||'—'],['Net Zero Law',selCountry.netzeroLaw?'Yes':'No'],['Carbon Price',selCountry.carbonPricingInPlace?'Yes':'No'],['Fin Gap',`$${selCountry.financingGapBnUSD}B`]].map(([l,v])=>(<div key={l} style={{background:T.surfaceH,borderRadius:6,padding:'8px 10px',textAlign:'center'}}>
              <div style={{fontSize:10,color:T.textSec}}>{l}</div>
              <div style={{fontFamily:T.mono,fontWeight:700,fontSize:14,marginTop:2}}>{v}</div>
            </div>))}
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Emissions Trajectory 2010-2030 (MtCO₂e)</div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:9,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="emissions" name="Historical" stroke={T.navyL} fill={T.navyL} fillOpacity={0.15}/>
            <Line type="monotone" dataKey="proj" name="NDC Trajectory" stroke={T.emerald} strokeWidth={2} strokeDasharray="6 3" dot={false}/>
            <Line type="monotone" dataKey="bau" name="BAU Scenario" stroke={T.red} strokeWidth={2} strokeDasharray="4 4" dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Sectoral Reduction Targets</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
          {SECTORS.map(sec=>(<div key={sec} style={{background:`${SECTOR_COLORS[sec]}15`,borderRadius:8,padding:'12px 8px',textAlign:'center',borderTop:`3px solid ${SECTOR_COLORS[sec]}`}}>
            <div style={{fontSize:11,color:T.textSec,fontWeight:600}}>{sec}</div>
            <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:SECTOR_COLORS[sec],marginTop:4}}>{selCountry.sectoralTargets[sec.toLowerCase()]}%</div>
            <div style={{fontSize:10,color:T.textMut,marginTop:2}}>reduction target</div>
          </div>))}
        </div>
      </div>
    </>);
  };

  const tabContent=[renderOverview,renderTrajectory,renderSectoral,renderImplGap,renderParisAlignment,renderG20,renderDrilldown];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={{...S.flex,gap:12}}>
            <span style={S.badge}>EP-AX2</span>
            <h1 style={S.title}>NDC Alignment Tracker</h1>
          </div>
          <div style={S.subtitle}>80-country NDC database · Paris alignment · Sectoral targets · Financing gaps · G20 spotlight</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:T.mono,fontSize:11,color:'rgba(255,255,255,0.5)'}}>Last updated: 2026-04-01 09:00 UTC</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>SPRINT AX · CLIMATE ALIGNMENT INTELLIGENCE</div>
        </div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=>(<button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}
      </div>
      {tabContent[tab]()}
    </div>
  );
}
