import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,Cell,Legend,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────── */
const TABS=['Insurer Transition Scorecard','Fossil Fuel Underwriting','Green Insurance Products','Regulatory & Disclosure'];
const INSURER_TYPES=['Global Reinsurer','Primary Insurer','Specialty Insurer','Mutual','Lloyds Syndicate'];
const REGIONS=['Europe','North America','Asia Pacific','UK','Global'];
const MEMBERSHIPS=['NZIA','PSI','PCAF','TCFD','SBTi','Net-Zero AOA','ClimateWise'];
const PIE_COLORS=[T.navy,T.gold,T.sage,T.red,T.navyL,T.amber,'#6366f1','#0891b2'];
const FUEL_TYPES=['Thermal Coal','Oil Upstream','Gas Upstream','Oil Downstream','Gas Downstream','Coal Power','Gas Power'];
const GREEN_CATEGORIES=['Renewable Energy','EV Insurance','Green Building','Climate Adaptation','Sustainable Agriculture','Circular Economy','Carbon Capture','Nature-Based'];

/* ── Seeded Data: 50 Insurers ──────────────────────────── */
const INSURERS=Array.from({length:50},(_,i)=>{
  const s1=sr(i*19+1);const s2=sr(i*19+2);const s3=sr(i*19+3);const s4=sr(i*19+4);const s5=sr(i*19+5);const s6=sr(i*19+6);const s7=sr(i*19+7);const s8=sr(i*19+8);const s9=sr(i*19+9);const s10=sr(i*19+10);
  const names=['Allianz','AXA','Zurich','Aviva','Swiss Re','Munich Re','Generali','Legal & General','Prudential UK','Aegon','NN Group','Storebrand','KLP','Hannover Re','SCOR','QBE','Suncorp','IAG','Tokio Marine','MS&AD','Sompo','Samsung Life','Ping An','China Life','AIA','Great Eastern','FWD','Manulife','Sun Life','Intact','Fairfax','Mapfre','CaixaBank','Talanx','Vienna Ins','PZU','Sampo','Tryg','Gjensidige','Baloise','Helvetia','Mobiliar','La Banque Postale','MAIF','Covea','Groupama','CNP','MACIF','Matmut','Harmonie'][i];
  const type=INSURER_TYPES[Math.floor(s1*INSURER_TYPES.length)];
  const region=REGIONS[Math.floor(s2*REGIONS.length)];
  const gwp=Math.round(5+s3*95);
  const fossilExposure=+(1+s4*25).toFixed(1);
  const coalExposure=+(s5*fossilExposure*0.4).toFixed(1);
  const oilGasExposure=+(fossilExposure-coalExposure).toFixed(1);
  const nzTarget=s6>0.3?`Net-zero ${2040+Math.floor(s7*10)}`:'No target';
  const nziaM=s1>0.4;const psiM=s2>0.35;const sbtiM=s3>0.6;const tcfdM=s4>0.3;
  const transitionScore=Math.round(20+s5*75);
  const envScore=Math.round(15+s6*80);
  const disclosureScore=Math.round(25+s7*70);
  const targetScore=Math.round(10+s8*85);
  const engagementScore=Math.round(20+s9*75);
  const overallScore=Math.round((transitionScore+envScore+disclosureScore+targetScore+engagementScore)/5);
  const coalPhaseOut=s1>0.5?`${2025+Math.floor(s2*8)}`:'None';
  const oilPhaseOut=s3>0.6?`${2028+Math.floor(s4*12)}`:'None';
  const gasPhaseOut=s5>0.7?`${2030+Math.floor(s6*15)}`:'None';
  const greenPremium=+(gwp*0.02+s10*gwp*0.15).toFixed(1);
  const greenRatio=+(greenPremium/gwp*100).toFixed(1);
  return {id:i+1,name:names,type,region,gwp,fossilExposure,coalExposure,oilGasExposure,nzTarget,nzia:nziaM,psi:psiM,sbti:sbtiM,tcfd:tcfdM,transitionScore,envScore,disclosureScore,targetScore,engagementScore,overallScore,coalPhaseOut,oilPhaseOut,gasPhaseOut,greenPremium,greenRatio};
});

/* ── Green Products Data ───────────────────────────────── */
const GREEN_PRODUCTS=Array.from({length:40},(_,i)=>{
  const s1=sr(i*29+1);const s2=sr(i*29+2);const s3=sr(i*29+3);const s4=sr(i*29+4);const s5=sr(i*29+5);
  const category=GREEN_CATEGORIES[Math.floor(s1*GREEN_CATEGORIES.length)];
  const insurer=INSURERS[Math.floor(s2*INSURERS.length)].name;
  const premium=+(0.5+s3*20).toFixed(1);
  const growth=+(5+s4*45).toFixed(1);
  const lossRatio=+(0.25+s5*0.45).toFixed(2);
  const products=['Solar Farm All-Risk','Wind Farm Package','EV Fleet Insurance','Green Building Warranty','Climate Resilience Bond','Mangrove Protection','Reef Restoration','Carbon Credit Insurance','Battery Storage Cover','Heat Pump Guarantee','Parametric Crop','Sustainable Forestry','Green Hydrogen','Tidal Energy','Geothermal Cover','Green Retrofit','Circular Economy BI','Biodiversity Credit','Ocean Energy','Agrivoltaics'][Math.floor(s1*20)];
  return {id:i+1,product:products,category,insurer,premium,growth,lossRatio,launched:`${2020+Math.floor(s2*5)}`};
});

/* ── Regulatory Framework ──────────────────────────────── */
const REGULATORY_FRAMEWORKS=[
  {reg:'TCFD for Insurers',jurisdiction:'Global',status:'Widely Adopted',compliance:82,requirements:['Governance: Board oversight of climate','Strategy: Scenario analysis (2°C, 4°C)','Risk Mgmt: Climate in ORSA','Metrics: Underwriting emissions'],keyGap:'Scope 3 underwriting emissions'},
  {reg:'EIOPA Solvency II Climate',jurisdiction:'EU',status:'Mandatory',compliance:75,requirements:['Prudent person + sustainability','Climate risk in ORSA','Double materiality','Stewardship policy'],keyGap:'ORSA climate integration'},
  {reg:'PRA SS3/19',jurisdiction:'UK',status:'Mandatory',compliance:80,requirements:['Board-level climate governance','Scenario analysis','Risk appetite framework','Senior Manager accountability'],keyGap:'Long-horizon projection'},
  {reg:'NAIC Climate Risk',jurisdiction:'US',status:'Mixed',compliance:58,requirements:['Climate risk disclosure survey','Financial impact assessment','Insurer Climate Risk Score','State-level requirements'],keyGap:'Multi-state alignment'},
  {reg:'ISSB S2 (Insurance)',jurisdiction:'Global',status:'Effective 2025',compliance:62,requirements:['Industry-specific metrics','Physical risk exposure','Transition risk quantification','Climate resilience'],keyGap:'Industry metrics calibration'},
  {reg:'EU SFDR (Insurance)',jurisdiction:'EU',status:'Mandatory',compliance:78,requirements:['PAI for underwriting','Product classification','Pre-contractual ESG disclosure','Periodic reporting'],keyGap:'PAI data for underwriting'},
  {reg:'UN PSI',jurisdiction:'Global',status:'Voluntary',compliance:70,requirements:['ESG in underwriting decisions','Client & partner engagement','Public disclosure of progress','Collaborative initiatives'],keyGap:'Client engagement metrics'},
  {reg:'NZIA Reporting',jurisdiction:'Global',status:'Voluntary',compliance:55,requirements:['Insured emissions target','Fossil fuel restrictions','Green ratio reporting','Transition plan publication'],keyGap:'Insured emissions methodology'},
];

/* ── Styles ─────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,color:T.text,minHeight:'100vh',padding:'24px'},
  header:{marginBottom:20},
  h1:{fontSize:22,fontWeight:700,margin:0,color:T.navy},
  sub:{fontSize:13,color:T.textSec,marginTop:4,fontFamily:T.mono},
  tabs:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:20},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLbl:{fontSize:11,color:T.textSec,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:c===T.red?'#fef2f2':c===T.amber?'#fffbeb':c===T.green?'#f0fdf4':'#eff6ff',color:c}),
  btn:(a)=>({padding:'6px 14px',fontSize:12,fontWeight:600,borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontFamily:T.font}),
  select:{padding:'6px 10px',fontSize:12,borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font},
  scroll:{maxHeight:420,overflowY:'auto'},
  chip:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:a?'none':`1px solid ${T.border}`,cursor:'pointer',marginRight:4}),
  heatCell:(v)=>({padding:'4px 8px',textAlign:'center',fontSize:11,fontWeight:600,fontFamily:T.mono,background:v>=70?'#dcfce7':v>=50?'#fef3c7':v>=30?'#fed7aa':'#fecaca',color:v>=70?T.green:v>=50?T.amber:v>=30?'#c2410c':T.red,borderRadius:4}),
};

/* ── Component ─────────────────────────────────────────── */
export default function InsuranceTransitionPage(){
  const [tab,setTab]=useState(0);
  const [regionFilter,setRegionFilter]=useState('All');
  const [typeFilter,setTypeFilter]=useState('All');
  const [sortCol,setSortCol]=useState('overallScore');
  const [sortDir,setSortDir]=useState('desc');
  const [insurerPage,setInsurerPage]=useState(0);
  const [selectedInsurer,setSelectedInsurer]=useState(null);
  const [fuelView,setFuelView]=useState('chart');
  const [greenCategory,setGreenCategory]=useState('All');
  const [regView,setRegView]=useState('table');

  const filteredInsurers=useMemo(()=>{
    let f=[...INSURERS];
    if(regionFilter!=='All')f=f.filter(i=>i.region===regionFilter);
    if(typeFilter!=='All')f=f.filter(i=>i.type===typeFilter);
    f.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return f;
  },[regionFilter,typeFilter,sortCol,sortDir]);

  const stats=useMemo(()=>{
    const avgScore=Math.round(INSURERS.reduce((a,b)=>a+b.overallScore,0)/INSURERS.length);
    const nziaCount=INSURERS.filter(i=>i.nzia).length;
    const psiCount=INSURERS.filter(i=>i.psi).length;
    const sbtiCount=INSURERS.filter(i=>i.sbti).length;
    const avgFossil=+(INSURERS.reduce((a,b)=>a+b.fossilExposure,0)/INSURERS.length).toFixed(1);
    const avgGreenRatio=+(INSURERS.reduce((a,b)=>a+b.greenRatio,0)/INSURERS.length).toFixed(1);
    const withTarget=INSURERS.filter(i=>i.nzTarget!=='No target').length;
    const coalPhaseOut=INSURERS.filter(i=>i.coalPhaseOut!=='None').length;
    return {avgScore,nziaCount,psiCount,sbtiCount,avgFossil,avgGreenRatio,withTarget,coalPhaseOut};
  },[]);

  const filteredGreenProducts=useMemo(()=>{
    if(greenCategory==='All')return GREEN_PRODUCTS;
    return GREEN_PRODUCTS.filter(p=>p.category===greenCategory);
  },[greenCategory]);

  const radarData=useMemo(()=>{
    if(!selectedInsurer)return [];
    const ins=INSURERS.find(i=>i.id===selectedInsurer);
    if(!ins)return [];
    return [{metric:'Transition',value:ins.transitionScore,avg:stats.avgScore},{metric:'Environment',value:ins.envScore,avg:stats.avgScore},{metric:'Disclosure',value:ins.disclosureScore,avg:stats.avgScore},{metric:'Targets',value:ins.targetScore,avg:stats.avgScore},{metric:'Engagement',value:ins.engagementScore,avg:stats.avgScore}];
  },[selectedInsurer,stats.avgScore]);

  const PAGE_SIZE=12;
  const insurerPages=Math.ceil(filteredInsurers.length/PAGE_SIZE);
  const pagedInsurers=filteredInsurers.slice(insurerPage*PAGE_SIZE,(insurerPage+1)*PAGE_SIZE);
  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setInsurerPage(0);};

  /* ── Tab 1: Transition Scorecard ─────────────────── */
  const renderScorecard=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Avg Transition Score',v:`${stats.avgScore}/100`},{l:'NZIA Members',v:stats.nziaCount},{l:'PSI Signatories',v:stats.psiCount},{l:'SBTi Committed',v:stats.sbtiCount},{l:'Avg Fossil Exposure',v:`${stats.avgFossil}%`,c:stats.avgFossil>15?T.red:T.amber},{l:'Avg Green Ratio',v:`${stats.avgGreenRatio}%`},{l:'With NZ Target',v:`${((stats.withTarget/INSURERS.length)*100).toFixed(0)}%`},{l:'Coal Phase-Out Set',v:stats.coalPhaseOut}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={{...S.kpiVal,color:k.c||T.navy}}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:12,marginTop:16,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={regionFilter} onChange={e=>{setRegionFilter(e.target.value);setInsurerPage(0);}}>
          <option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select style={S.select} value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setInsurerPage(0);}}>
          <option value="All">All Types</option>{INSURER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.textSec}}>{filteredInsurers.length} insurers</span>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Insurer Transition Scorecard</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{[['name','Insurer'],['type','Type'],['region','Region'],['gwp','GWP ($B)'],['overallScore','Overall'],['transitionScore','Trans.'],['envScore','Env'],['targetScore','Target'],['fossilExposure','Fossil %'],['greenRatio','Green %'],['nzTarget','NZ Target']].map(([k,h])=>(
              <th key={k} style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort(k)}>{h}{sortCol===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
            ))}</tr></thead>
            <tbody>{pagedInsurers.map((ins,i)=>(
              <tr key={ins.id} style={{background:i%2?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelectedInsurer(selectedInsurer===ins.id?null:ins.id)}>
                <td style={{...S.td,fontWeight:600}}>{ins.name}</td><td style={S.td}>{ins.type}</td><td style={S.td}>{ins.region}</td>
                <td style={S.td}>{ins.gwp}</td>
                <td style={S.td}><span style={S.heatCell(ins.overallScore)}>{ins.overallScore}</span></td>
                <td style={S.td}><span style={S.heatCell(ins.transitionScore)}>{ins.transitionScore}</span></td>
                <td style={S.td}><span style={S.heatCell(ins.envScore)}>{ins.envScore}</span></td>
                <td style={S.td}><span style={S.heatCell(ins.targetScore)}>{ins.targetScore}</span></td>
                <td style={S.td}><span style={S.badge(ins.fossilExposure>15?T.red:ins.fossilExposure>8?T.amber:T.green)}>{ins.fossilExposure}%</span></td>
                <td style={S.td}><span style={S.badge(ins.greenRatio>10?T.green:ins.greenRatio>5?T.amber:T.textMut)}>{ins.greenRatio}%</span></td>
                <td style={{...S.td,fontSize:10}}>{ins.nzTarget}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {insurerPage+1} of {insurerPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={insurerPage===0} onClick={()=>setInsurerPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={insurerPage>=insurerPages-1} onClick={()=>setInsurerPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      {selectedInsurer&&radarData.length>0&&(
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>{INSURERS.find(i=>i.id===selectedInsurer)?.name} — Radar</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="metric" tick={{fontSize:10}}/><PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/><Radar name="Score" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.3}/><Radar name="Peer Avg" dataKey="avg" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/><Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11}}/></RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Memberships & Commitments</div>
            {(()=>{const ins=INSURERS.find(i=>i.id===selectedInsurer);if(!ins)return null;return(
              <div style={{display:'grid',gap:8}}>
                {[{m:'NZIA',v:ins.nzia},{m:'PSI',v:ins.psi},{m:'SBTi',v:ins.sbti},{m:'TCFD',v:ins.tcfd}].map((x,xi)=>(
                  <div key={xi} style={{display:'flex',alignItems:'center',gap:10,padding:8,background:T.surfaceH,borderRadius:6}}>
                    <span style={{...S.badge(x.v?T.green:T.textMut),minWidth:50,textAlign:'center'}}>{x.v?'Yes':'No'}</span>
                    <span style={{fontSize:12}}>{x.m}</span>
                  </div>
                ))}
                <div style={{marginTop:8,fontSize:12}}>
                  <div><strong>Net-Zero Target:</strong> {ins.nzTarget}</div>
                  <div><strong>Coal Phase-Out:</strong> {ins.coalPhaseOut}</div>
                  <div><strong>Oil Phase-Out:</strong> {ins.oilPhaseOut}</div>
                  <div><strong>Gas Phase-Out:</strong> {ins.gasPhaseOut}</div>
                </div>
              </div>
            );})()}
          </div>
        </div>
      )}
    </div>
  );

  /* ── Tab 2: Fossil Fuel Underwriting ─────────────── */
  const renderFossilFuel=()=>(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {['chart','table'].map(v=><button key={v} style={S.btn(fuelView===v)} onClick={()=>setFuelView(v)}>{v==='chart'?'Chart View':'Table View'}</button>)}
      </div>
      {fuelView==='chart'?(
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>Fossil Fuel Exposure by Region</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={REGIONS.map(r=>{const ins=INSURERS.filter(i=>i.region===r);return {region:r,coal:+(ins.reduce((a,b)=>a+b.coalExposure,0)/ins.length).toFixed(1),oilGas:+(ins.reduce((a,b)=>a+b.oilGasExposure,0)/ins.length).toFixed(1)};})}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="region" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="coal" name="Coal Exposure %" stackId="a" fill={T.red}/><Bar dataKey="oilGas" name="Oil & Gas %" stackId="a" fill={T.amber}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Phase-Out Timeline (Coal)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={['2025','2026','2027','2028','2029','2030','2031','2032','None'].map(y=>({year:y,count:INSURERS.filter(i=>i.coalPhaseOut===y).length}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="count" name="Insurers">{['2025','2026','2027','2028','2029','2030','2031','2032','None'].map((y,i)=><Cell key={i} fill={y==='None'?T.red:Number(y)<=2027?T.green:T.amber}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ):(
        <div style={S.card}>
          <div style={S.cardTitle}>Fossil Fuel Underwriting Detail</div>
          <div style={S.scroll}>
            <table style={S.table}>
              <thead><tr>{['Insurer','Region','Fossil %','Coal %','Oil/Gas %','Coal Phase-Out','Oil Phase-Out','Gas Phase-Out','NZ Target'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{INSURERS.sort((a,b)=>b.fossilExposure-a.fossilExposure).slice(0,25).map((ins,i)=>(
                <tr key={ins.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{ins.name}</td><td style={S.td}>{ins.region}</td>
                  <td style={S.td}><span style={S.badge(ins.fossilExposure>15?T.red:ins.fossilExposure>8?T.amber:T.green)}>{ins.fossilExposure}%</span></td>
                  <td style={S.td}>{ins.coalExposure}%</td><td style={S.td}>{ins.oilGasExposure}%</td>
                  <td style={S.td}><span style={S.badge(ins.coalPhaseOut==='None'?T.red:T.green)}>{ins.coalPhaseOut}</span></td>
                  <td style={S.td}><span style={S.badge(ins.oilPhaseOut==='None'?T.red:T.green)}>{ins.oilPhaseOut}</span></td>
                  <td style={S.td}><span style={S.badge(ins.gasPhaseOut==='None'?T.red:T.amber)}>{ins.gasPhaseOut}</span></td>
                  <td style={{...S.td,fontSize:10}}>{ins.nzTarget}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>Peer Comparison: Top 15 by Transition Score</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[...INSURERS].sort((a,b)=>b.overallScore-a.overallScore).slice(0,15).map(i=>({name:i.name.length>12?i.name.substring(0,12):i.name,score:i.overallScore,fossil:i.fossilExposure,green:i.greenRatio}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="score" name="Transition Score" fill={T.navy}/><Bar dataKey="green" name="Green Ratio %" fill={T.sage}/><Bar dataKey="fossil" name="Fossil %" fill={T.red}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ── Tab 3: Green Insurance Products ─────────────── */
  const renderGreenProducts=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Green Products',v:GREEN_PRODUCTS.length},{l:'Total Green Premium',v:`$${GREEN_PRODUCTS.reduce((a,b)=>a+b.premium,0).toFixed(0)}M`},{l:'Avg Growth Rate',v:`${(GREEN_PRODUCTS.reduce((a,b)=>a+b.growth,0)/GREEN_PRODUCTS.length).toFixed(0)}%`},{l:'Categories',v:GREEN_CATEGORIES.length}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={S.kpiVal}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:4,marginTop:12,marginBottom:12,flexWrap:'wrap'}}>
        <button style={S.chip(greenCategory==='All')} onClick={()=>setGreenCategory('All')}>All</button>
        {GREEN_CATEGORIES.map(c=><button key={c} style={S.chip(greenCategory===c)} onClick={()=>setGreenCategory(c)}>{c}</button>)}
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Premium by Category</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={GREEN_CATEGORIES.map(c=>{const ps=GREEN_PRODUCTS.filter(p=>p.category===c);return {name:c,value:+ps.reduce((a,b)=>a+b.premium,0).toFixed(1)};}).filter(x=>x.value>0)} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>{GREEN_CATEGORIES.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Growth Rate by Category</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={GREEN_CATEGORIES.map(c=>{const ps=GREEN_PRODUCTS.filter(p=>p.category===c);return {category:c.length>14?c.substring(0,14)+'..':c,growth:ps.length?+(ps.reduce((a,b)=>a+b.growth,0)/ps.length).toFixed(1):0,count:ps.length};}).sort((a,b)=>b.growth-a.growth)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="category" type="category" tick={{fontSize:9}} width={110}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="growth" name="Growth %">{GREEN_CATEGORIES.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Green Product Catalog ({filteredGreenProducts.length} products)</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Product','Category','Insurer','Premium ($M)','Growth %','Loss Ratio','Launched'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{filteredGreenProducts.map((p,i)=>(
              <tr key={p.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{p.product}</td><td style={S.td}>{p.category}</td><td style={S.td}>{p.insurer}</td>
                <td style={S.td}>{p.premium}</td>
                <td style={S.td}><span style={S.badge(p.growth>30?T.green:p.growth>15?T.amber:T.textSec)}>{p.growth}%</span></td>
                <td style={S.td}><span style={S.badge(p.lossRatio>0.5?T.red:p.lossRatio>0.35?T.amber:T.green)}>{(p.lossRatio*100).toFixed(0)}%</span></td>
                <td style={S.td}>{p.launched}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Regulatory & Disclosure ──────────────── */
  const renderRegulatory=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Avg Compliance',v:`${Math.round(REGULATORY_FRAMEWORKS.reduce((a,b)=>a+b.compliance,0)/REGULATORY_FRAMEWORKS.length)}%`},{l:'Mandatory Regs',v:REGULATORY_FRAMEWORKS.filter(r=>r.status.includes('Mandatory')).length},{l:'Critical Gaps',v:REGULATORY_FRAMEWORKS.filter(r=>r.compliance<65).length,c:T.red},{l:'Frameworks',v:REGULATORY_FRAMEWORKS.length}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={{...S.kpiVal,color:k.c||T.navy}}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {['table','cards'].map(v=><button key={v} style={S.btn(regView===v)} onClick={()=>setRegView(v)}>{v==='table'?'Table':'Cards'}</button>)}
      </div>
      {regView==='table'?(
        <div style={S.card}>
          <div style={S.cardTitle}>Regulatory Compliance Status</div>
          <div style={S.scroll}>
            <table style={S.table}>
              <thead><tr>{['Regulation','Jurisdiction','Status','Compliance','Key Gap'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{REGULATORY_FRAMEWORKS.map((r,i)=>(
                <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{r.reg}</td><td style={S.td}>{r.jurisdiction}</td>
                  <td style={S.td}><span style={S.badge(r.status.includes('Mandatory')?T.navy:T.textSec)}>{r.status}</span></td>
                  <td style={S.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:6,borderRadius:3,background:T.border}}>
                        <div style={{height:6,borderRadius:3,background:r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red,width:`${r.compliance}%`}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:T.mono}}>{r.compliance}%</span>
                    </div>
                  </td>
                  <td style={{...S.td,fontSize:11,color:T.red}}>{r.keyGap}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {REGULATORY_FRAMEWORKS.map((r,i)=>(
            <div key={i} style={{...S.card,borderLeft:`3px solid ${r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red}`}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div><div style={{fontSize:14,fontWeight:700}}>{r.reg}</div><div style={{fontSize:11,color:T.textSec}}>{r.jurisdiction} · {r.status}</div></div>
                <div style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red}}>{r.compliance}%</div>
              </div>
              <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>{r.requirements.map((req,ri)=><span key={ri} style={{padding:'2px 6px',background:T.surfaceH,borderRadius:4,fontSize:10}}>{req}</span>)}</div>
              <div style={{marginTop:6,padding:6,background:'#fef2f2',borderRadius:4,fontSize:10,color:T.red}}>Gap: {r.keyGap}</div>
            </div>
          ))}
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>Insurer TCFD Disclosure Quality</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={INSURERS.sort((a,b)=>b.disclosureScore-a.disclosureScore).slice(0,15).map(i=>({name:i.name.length>10?i.name.substring(0,10):i.name,disclosure:i.disclosureScore}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="disclosure" name="Disclosure Score">{INSURERS.sort((a,b)=>b.disclosureScore-a.disclosureScore).slice(0,15).map((ins,i)=><Cell key={i} fill={ins.disclosureScore>=70?T.green:ins.disclosureScore>=50?T.amber:T.red}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>Insurance Transition & Net-Zero Intelligence</h1>
        <div style={S.sub}>EP-AR5 · {INSURERS.length} insurers · Fossil fuel exposure · NZIA/PSI/SBTi tracking · Green product analytics</div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      {tab===0&&renderScorecard()}
      {tab===1&&renderFossilFuel()}
      {tab===2&&renderGreenProducts()}
      {tab===3&&renderRegulatory()}
    </div>
  );
}
