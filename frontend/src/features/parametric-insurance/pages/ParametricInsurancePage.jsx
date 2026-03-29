import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────── */
const TABS=['Product Catalog','Trigger Calibration','Basis Risk Assessment','Climate Adaptation'];
const TRIGGER_TYPES=['Rainfall','Wind Speed','Temperature','Earthquake Magnitude','NDVI','River Level'];
const TRIGGER_UNITS=['mm','km/h','°C','Mw','Index','m'];
const TRIGGER_COLORS=[T.navy,T.red,T.amber,T.sage,T.gold,T.navyL];
const COUNTRIES=['United States','Mexico','Philippines','India','Bangladesh','Kenya','Ethiopia','Senegal','Jamaica','Haiti','Fiji','Vanuatu','Mozambique','Madagascar','Guatemala','Honduras','Nepal','Myanmar','Cambodia','Sri Lanka','Pacific Islands','Caribbean Pool','African Union','Colombia','Peru'];
const PRODUCT_STATUS=['Active','Pending','Expired','In Design'];
const PAYOUT_TYPES=['Binary','Linear','Stepped','Tiered','Hybrid'];
const COVERAGE_TYPES=['Crop Insurance','Disaster Relief','Sovereign Risk','Infrastructure','Livestock','Fisheries'];
const SCHEMES=['CCRIF SPC','ARC Ltd','PCRAFI','InsuResilience','R4 Rural Resilience','ACRE Africa','IBLI Kenya','CADENA Mexico','PMFBY India','Flood Re UK'];

/* ── Seeded Data: 60 Products ──────────────────────────── */
const PRODUCTS=Array.from({length:60},(_,i)=>{
  const s1=sr(i*13+1);const s2=sr(i*13+2);const s3=sr(i*13+3);const s4=sr(i*13+4);const s5=sr(i*13+5);const s6=sr(i*13+6);const s7=sr(i*13+7);const s8=sr(i*13+8);const s9=sr(i*13+9);
  const triggerIdx=Math.floor(s1*TRIGGER_TYPES.length);
  const triggerType=TRIGGER_TYPES[triggerIdx];
  const triggerUnit=TRIGGER_UNITS[triggerIdx];
  const country=COUNTRIES[Math.floor(s2*COUNTRIES.length)];
  const payoutType=PAYOUT_TYPES[Math.floor(s3*PAYOUT_TYPES.length)];
  const coverageType=COVERAGE_TYPES[Math.floor(s4*COVERAGE_TYPES.length)];
  const status=PRODUCT_STATUS[Math.floor(s5*3)];
  const scheme=SCHEMES[Math.floor(s6*SCHEMES.length)];
  const triggerThreshold=triggerType==='Rainfall'?Math.round(50+s7*300):triggerType==='Wind Speed'?Math.round(80+s7*180):triggerType==='Temperature'?+(30+s7*15).toFixed(1):triggerType==='Earthquake Magnitude'?+(5.0+s7*3.0).toFixed(1):triggerType==='NDVI'?+(0.1+s7*0.4).toFixed(2):+(3+s7*12).toFixed(1);
  const exitThreshold=triggerType==='Rainfall'?Math.round(triggerThreshold*1.8+50):triggerType==='Wind Speed'?Math.round(triggerThreshold*1.5):triggerType==='Temperature'?+(triggerThreshold+5).toFixed(1):triggerType==='Earthquake Magnitude'?+(triggerThreshold+1.5).toFixed(1):triggerType==='NDVI'?+(triggerThreshold-0.15).toFixed(2):+(triggerThreshold+5).toFixed(1);
  const maxPayout=Math.round(1+s8*49);
  const premium=+(maxPayout*0.03+s9*maxPayout*0.12).toFixed(2);
  const attachmentProb=+(5+s1*25).toFixed(1);
  const exhaustionProb=+(1+s2*8).toFixed(1);
  const expectedLoss=+(premium*0.5+s3*premium*0.4).toFixed(2);
  const basisRisk=+(5+s4*35).toFixed(1);
  const historicalTriggers=Math.round(1+s5*12);
  const avgPayoutTime=Math.round(3+s6*25);
  const beneficiaries=Math.round(500+s7*49500);
  return {id:i+1,name:`PAR-${String(i+1).padStart(3,'0')}`,triggerType,triggerUnit,country,payoutType,coverageType,status,scheme,triggerThreshold,exitThreshold,maxPayout,premium,attachmentProb,exhaustionProb,expectedLoss,basisRisk,historicalTriggers,avgPayoutTime,beneficiaries};
});

/* ── Historical Trigger Data ──────────────────────────── */
const YEARS=Array.from({length:20},(_,i)=>2005+i);
const HISTORICAL_TRIGGERS=TRIGGER_TYPES.map((tt,ti)=>{
  return YEARS.map((y,yi)=>{
    const val=tt==='Rainfall'?Math.round(200+sr(ti*101+yi*7)*400):tt==='Wind Speed'?Math.round(60+sr(ti*103+yi*7)*200):tt==='Temperature'?+(25+sr(ti*107+yi*7)*20).toFixed(1):tt==='Earthquake Magnitude'?+(4+sr(ti*109+yi*7)*4).toFixed(1):tt==='NDVI'?+(0.2+sr(ti*113+yi*7)*0.6).toFixed(2):+(2+sr(ti*117+yi*7)*15).toFixed(1);
    const threshold=PRODUCTS.filter(p=>p.triggerType===tt)[0]?.triggerThreshold||0;
    const triggered=Number(val)>=Number(threshold);
    return {year:y,value:Number(val),threshold:Number(threshold),triggered};
  });
});

/* ── Basis Risk Comparison Data ───────────────────────── */
const BASIS_RISK_COMPARISON=Array.from({length:30},(_,i)=>{
  const parametricLoss=Math.round(sr(i*131)*100);
  const actualLoss=Math.round(parametricLoss*(0.5+sr(i*137)*1.0));
  return {event:`Event-${i+1}`,parametric:parametricLoss,actual:actualLoss,gap:Math.abs(parametricLoss-actualLoss),correlation:+(0.4+sr(i*139)*0.55).toFixed(2)};
});

/* ── Sovereign Risk Transfer Data ─────────────────────── */
const SOVEREIGN_PROGRAMS=[
  {name:'CCRIF SPC',region:'Caribbean',members:23,coverage:'Hurricane, Earthquake, Excess Rainfall',totalCoverage:1200,payouts:260,avgPayout:14,speed:'14 days',premium:52,lossRatio:0.58,climateAdaptation:'High'},
  {name:'ARC Ltd',region:'Africa',members:35,coverage:'Drought, Flood, Tropical Cyclone, Outbreak',totalCoverage:800,payouts:180,avgPayout:12,speed:'21 days',premium:38,lossRatio:0.52,climateAdaptation:'High'},
  {name:'PCRAFI',region:'Pacific',members:15,coverage:'Cyclone, Earthquake, Tsunami',totalCoverage:450,payouts:85,avgPayout:8,speed:'10 days',premium:22,lossRatio:0.48,climateAdaptation:'Medium'},
  {name:'SEADRIF',region:'SE Asia',members:10,coverage:'Flood, Typhoon',totalCoverage:300,payouts:45,avgPayout:6,speed:'18 days',premium:15,lossRatio:0.42,climateAdaptation:'Medium'},
  {name:'InsuResilience',region:'Global',members:80,coverage:'Multi-peril climate',totalCoverage:5000,payouts:1200,avgPayout:20,speed:'30 days',premium:180,lossRatio:0.55,climateAdaptation:'Very High'},
  {name:'Flood Re',region:'UK',members:1,coverage:'Household flood',totalCoverage:2100,payouts:340,avgPayout:18,speed:'7 days',premium:85,lossRatio:0.62,climateAdaptation:'High'},
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
  slider:{width:'100%',accentColor:T.gold},
  chip:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:a?'none':`1px solid ${T.border}`,cursor:'pointer',marginRight:4}),
  dot:(c)=>({width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}),
};

/* ── Component ─────────────────────────────────────────── */
export default function ParametricInsurancePage(){
  const [tab,setTab]=useState(0);
  const [triggerFilter,setTriggerFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [coverageFilter,setCoverageFilter]=useState('All');
  const [sortCol,setSortCol]=useState('maxPayout');
  const [sortDir,setSortDir]=useState('desc');
  const [prodPage,setProdPage]=useState(0);
  const [selectedProduct,setSelectedProduct]=useState(null);
  const [calibTrigger,setCalibTrigger]=useState(0);
  const [thresholdAdj,setThresholdAdj]=useState(0);
  const [basisView,setBasisView]=useState('scatter');
  const [adaptationRegion,setAdaptationRegion]=useState('All');

  const filteredProducts=useMemo(()=>{
    let f=[...PRODUCTS];
    if(triggerFilter!=='All')f=f.filter(p=>p.triggerType===triggerFilter);
    if(countryFilter!=='All')f=f.filter(p=>p.country===countryFilter);
    if(coverageFilter!=='All')f=f.filter(p=>p.coverageType===coverageFilter);
    f.sort((a,b)=>sortDir==='asc'?(typeof a[sortCol]==='string'?a[sortCol].localeCompare(b[sortCol]):a[sortCol]-b[sortCol]):(typeof b[sortCol]==='string'?b[sortCol].localeCompare(a[sortCol]):b[sortCol]-a[sortCol]));
    return f;
  },[triggerFilter,countryFilter,coverageFilter,sortCol,sortDir]);

  const portfolioStats=useMemo(()=>{
    const active=PRODUCTS.filter(p=>p.status==='Active');
    const totalCoverage=active.reduce((a,b)=>a+b.maxPayout,0);
    const totalPremium=active.reduce((a,b)=>a+b.premium,0);
    const avgBasisRisk=+(active.reduce((a,b)=>a+b.basisRisk,0)/active.length).toFixed(1);
    const totalBeneficiaries=active.reduce((a,b)=>a+b.beneficiaries,0);
    const avgPayoutTime=Math.round(active.reduce((a,b)=>a+b.avgPayoutTime,0)/active.length);
    return {active:active.length,totalCoverage,totalPremium:+totalPremium.toFixed(1),avgBasisRisk,totalBeneficiaries,avgPayoutTime,countries:new Set(PRODUCTS.map(p=>p.country)).size,triggerTypes:TRIGGER_TYPES.length};
  },[]);

  const triggerStats=useMemo(()=>{
    return TRIGGER_TYPES.map((tt,i)=>{
      const prods=PRODUCTS.filter(p=>p.triggerType===tt);
      return {type:tt,count:prods.length,coverage:prods.reduce((a,b)=>a+b.maxPayout,0),avgBasisRisk:prods.length?+(prods.reduce((a,b)=>a+b.basisRisk,0)/prods.length).toFixed(1):0,color:TRIGGER_COLORS[i]};
    });
  },[]);

  const calibrationData=useMemo(()=>{
    const hist=HISTORICAL_TRIGGERS[calibTrigger];
    const adj=thresholdAdj;
    return hist.map(h=>({...h,adjustedThreshold:h.threshold*(1+adj/100),wouldTrigger:h.value>=(h.threshold*(1+adj/100))}));
  },[calibTrigger,thresholdAdj]);

  const simulatedPayouts=useMemo(()=>{
    const triggered=calibrationData.filter(d=>d.wouldTrigger);
    const products=PRODUCTS.filter(p=>p.triggerType===TRIGGER_TYPES[calibTrigger]);
    const avgPayout=products.length?products.reduce((a,b)=>a+b.maxPayout,0)/products.length:10;
    return {triggerCount:triggered.length,frequency:+((triggered.length/calibrationData.length)*100).toFixed(1),avgPayout:+avgPayout.toFixed(1),totalPayout:Math.round(triggered.length*avgPayout),maxGap:Math.max(...calibrationData.filter(d=>!d.wouldTrigger).map(d=>Math.abs(d.value-d.adjustedThreshold)),0)};
  },[calibrationData,calibTrigger]);

  const PAGE_SIZE=12;
  const prodPages=Math.ceil(filteredProducts.length/PAGE_SIZE);
  const pagedProducts=filteredProducts.slice(prodPage*PAGE_SIZE,(prodPage+1)*PAGE_SIZE);
  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setProdPage(0);};

  /* ── Tab 1: Product Catalog ──────────────────────── */
  const renderCatalog=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Active Products',v:portfolioStats.active},{l:'Total Coverage',v:`$${portfolioStats.totalCoverage}M`},{l:'Total Premium',v:`$${portfolioStats.totalPremium}M`},{l:'Avg Basis Risk',v:`${portfolioStats.avgBasisRisk}%`,c:portfolioStats.avgBasisRisk>25?T.amber:T.green},{l:'Beneficiaries',v:`${(portfolioStats.totalBeneficiaries/1000).toFixed(0)}K`},{l:'Avg Payout Speed',v:`${portfolioStats.avgPayoutTime} days`},{l:'Countries',v:portfolioStats.countries},{l:'Trigger Types',v:portfolioStats.triggerTypes}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={{...S.kpiVal,color:k.c||T.navy}}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{...S.grid2,marginTop:16}}>
        <div style={S.card}>
          <div style={S.cardTitle}>Coverage by Trigger Type</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={triggerStats}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="coverage" name="Coverage ($M)">{triggerStats.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Basis Risk by Trigger Type</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={triggerStats}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} domain={[0,40]}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="avgBasisRisk" name="Avg Basis Risk %">{triggerStats.map((e,i)=><Cell key={i} fill={e.avgBasisRisk>25?T.red:e.avgBasisRisk>15?T.amber:T.green}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={triggerFilter} onChange={e=>{setTriggerFilter(e.target.value);setProdPage(0);}}>
          <option value="All">All Triggers</option>{TRIGGER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select style={S.select} value={coverageFilter} onChange={e=>{setCoverageFilter(e.target.value);setProdPage(0);}}>
          <option value="All">All Coverage</option>{COVERAGE_TYPES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{fontSize:12,color:T.textSec}}>{filteredProducts.length} products</span>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Parametric Product Portfolio</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{[['name','Product'],['triggerType','Trigger'],['country','Country'],['coverageType','Coverage'],['payoutType','Payout'],['triggerThreshold','Trigger Lvl'],['maxPayout','Max Payout ($M)'],['premium','Premium ($M)'],['basisRisk','Basis Risk %'],['status','Status']].map(([k,h])=>(
              <th key={k} style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort(k)}>{h}{sortCol===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
            ))}</tr></thead>
            <tbody>{pagedProducts.map((p,i)=>(
              <tr key={p.id} style={{background:i%2?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelectedProduct(selectedProduct===p.id?null:p.id)}>
                <td style={S.td}>{p.name}</td>
                <td style={S.td}><span style={{...S.dot(TRIGGER_COLORS[TRIGGER_TYPES.indexOf(p.triggerType)]),marginRight:4}}/>{p.triggerType}</td>
                <td style={S.td}>{p.country}</td><td style={S.td}>{p.coverageType}</td><td style={S.td}>{p.payoutType}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{p.triggerThreshold} {p.triggerUnit}</td>
                <td style={{...S.td,fontWeight:600}}>{p.maxPayout}</td><td style={S.td}>{p.premium}</td>
                <td style={S.td}><span style={S.badge(p.basisRisk>25?T.red:p.basisRisk>15?T.amber:T.green)}>{p.basisRisk}%</span></td>
                <td style={S.td}><span style={S.badge(p.status==='Active'?T.green:p.status==='Pending'?T.amber:T.textMut)}>{p.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {selectedProduct&&(()=>{const p=PRODUCTS.find(x=>x.id===selectedProduct);if(!p)return null;return(
          <div style={{marginTop:12,padding:14,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{p.name} — {p.scheme}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,fontSize:11}}>
              <div><span style={{color:T.textSec}}>Trigger:</span> <strong>{p.triggerThreshold} {p.triggerUnit}</strong></div>
              <div><span style={{color:T.textSec}}>Exit:</span> <strong>{p.exitThreshold} {p.triggerUnit}</strong></div>
              <div><span style={{color:T.textSec}}>Attach Prob:</span> <strong>{p.attachmentProb}%</strong></div>
              <div><span style={{color:T.textSec}}>Exhaust Prob:</span> <strong>{p.exhaustionProb}%</strong></div>
              <div><span style={{color:T.textSec}}>Hist. Triggers:</span> <strong>{p.historicalTriggers}</strong></div>
              <div><span style={{color:T.textSec}}>Exp. Loss:</span> <strong>${p.expectedLoss}M</strong></div>
              <div><span style={{color:T.textSec}}>Beneficiaries:</span> <strong>{p.beneficiaries.toLocaleString()}</strong></div>
              <div><span style={{color:T.textSec}}>Avg Payout Time:</span> <strong>{p.avgPayoutTime} days</strong></div>
              <div><span style={{color:T.textSec}}>Payout Type:</span> <strong>{p.payoutType}</strong></div>
              <div><span style={{color:T.textSec}}>Scheme:</span> <strong>{p.scheme}</strong></div>
            </div>
          </div>
        );})()}
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {prodPage+1} of {prodPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={prodPage===0} onClick={()=>setProdPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={prodPage>=prodPages-1} onClick={()=>setProdPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Tab 2: Trigger Calibration ──────────────────── */
  const renderCalibration=()=>(
    <div>
      <div style={S.grid3}>
        <div style={S.card}>
          <div style={S.cardTitle}>Calibration Controls</div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Trigger Type</label>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {TRIGGER_TYPES.map((tt,i)=><button key={tt} style={S.chip(calibTrigger===i)} onClick={()=>setCalibTrigger(i)}>{tt}</button>)}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Threshold Adjustment: {thresholdAdj>0?'+':''}{thresholdAdj}%</label>
            <input type="range" min={-50} max={50} value={thresholdAdj} onChange={e=>setThresholdAdj(+e.target.value)} style={S.slider}/>
          </div>
          <div style={{padding:10,background:T.surfaceH,borderRadius:6,fontSize:11}}>
            <div>Base threshold: <strong>{PRODUCTS.filter(p=>p.triggerType===TRIGGER_TYPES[calibTrigger])[0]?.triggerThreshold||0} {TRIGGER_UNITS[calibTrigger]}</strong></div>
            <div>Adjusted: <strong>{((PRODUCTS.filter(p=>p.triggerType===TRIGGER_TYPES[calibTrigger])[0]?.triggerThreshold||0)*(1+thresholdAdj/100)).toFixed(1)} {TRIGGER_UNITS[calibTrigger]}</strong></div>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Simulation Results</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'Trigger Events',v:simulatedPayouts.triggerCount,c:T.navy},{l:'Trigger Frequency',v:`${simulatedPayouts.frequency}%`,c:simulatedPayouts.frequency>30?T.red:T.amber},{l:'Avg Payout',v:`$${simulatedPayouts.avgPayout}M`,c:T.gold},{l:'Total Payouts',v:`$${simulatedPayouts.totalPayout}M`,c:T.sage}].map((m,i)=>(
              <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,borderLeft:`3px solid ${m.c}`}}>
                <div style={{fontSize:10,color:T.textSec}}>{m.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Payout Frequency by Year</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calibrationData.map(d=>({year:d.year,payout:d.wouldTrigger?simulatedPayouts.avgPayout:0}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="payout" name="Payout ($M)">{calibrationData.map((d,i)=><Cell key={i} fill={d.wouldTrigger?T.gold:T.border}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Historical {TRIGGER_TYPES[calibTrigger]} Values vs Threshold (2005-2024)</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={calibrationData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="value" name={`${TRIGGER_TYPES[calibTrigger]} (${TRIGGER_UNITS[calibTrigger]})`} stroke={TRIGGER_COLORS[calibTrigger]} fill={TRIGGER_COLORS[calibTrigger]} fillOpacity={0.2}/><Line type="monotone" dataKey="adjustedThreshold" name="Trigger Threshold" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={false}/></AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Payout Structure Simulation</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={Array.from({length:20},(_,i)=>{
            const ratio=i/19;
            const trigger=calibrationData[0]?.adjustedThreshold||100;
            const exit=(PRODUCTS.filter(p=>p.triggerType===TRIGGER_TYPES[calibTrigger])[0]?.exitThreshold||200);
            const val=trigger+ratio*(exit-trigger);
            const binary=val>=trigger?100:0;
            const linear=Math.min(100,Math.max(0,((val-trigger)/(exit-trigger))*100));
            const stepped=val>=exit?100:val>=trigger+(exit-trigger)*0.5?50:val>=trigger?25:0;
            return {value:+val.toFixed(1),binary,linear,stepped};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="value" tick={{fontSize:10}} label={{value:TRIGGER_UNITS[calibTrigger],position:'insideBottom',offset:-5,fontSize:10}}/><YAxis tick={{fontSize:10}} label={{value:'Payout %',angle:-90,position:'insideLeft',fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="stepAfter" dataKey="binary" name="Binary" stroke={T.red} strokeWidth={2}/><Line type="monotone" dataKey="linear" name="Linear" stroke={T.navy} strokeWidth={2}/><Line type="stepAfter" dataKey="stepped" name="Stepped" stroke={T.gold} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ── Tab 3: Basis Risk Assessment ────────────────── */
  const renderBasisRisk=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Avg Basis Risk',v:`${portfolioStats.avgBasisRisk}%`},{l:'Correlation',v:`${(BASIS_RISK_COMPARISON.reduce((a,b)=>a+b.correlation,0)/BASIS_RISK_COMPARISON.length).toFixed(2)}`},{l:'Max Gap',v:`$${Math.max(...BASIS_RISK_COMPARISON.map(b=>b.gap))}M`},{l:'Underpayment Events',v:BASIS_RISK_COMPARISON.filter(b=>b.parametric<b.actual).length}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={S.kpiVal}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {['scatter','bar','table'].map(v=><button key={v} style={S.btn(basisView===v)} onClick={()=>setBasisView(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>)}
      </div>
      {basisView==='scatter'&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Parametric Payout vs Actual Loss (30 Events)</div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="actual" name="Actual Loss ($M)" tick={{fontSize:10}}/><YAxis dataKey="parametric" name="Parametric Payout ($M)" tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Scatter data={BASIS_RISK_COMPARISON} fill={T.navy} fillOpacity={0.6}/><Line type="monotone" data={[{actual:0,parametric:0},{actual:100,parametric:100}]} dataKey="parametric" stroke={T.red} strokeDasharray="5 5" dot={false}/></ScatterChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:T.textSec,textAlign:'center',marginTop:4}}>Red dashed = perfect correlation line. Points above = overpayment. Points below = underpayment (basis risk).</div>
        </div>
      )}
      {basisView==='bar'&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Payout Gap Analysis (Parametric - Actual)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={BASIS_RISK_COMPARISON}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="event" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="parametric" name="Parametric ($M)" fill={T.navy}/><Bar dataKey="actual" name="Actual ($M)" fill={T.gold}/></BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {basisView==='table'&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Event-Level Basis Risk Detail</div>
          <div style={S.scroll}>
            <table style={S.table}>
              <thead><tr>{['Event','Parametric ($M)','Actual ($M)','Gap ($M)','Correlation','Outcome'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{BASIS_RISK_COMPARISON.map((b,i)=>(
                <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{b.event}</td><td style={S.td}>{b.parametric}</td><td style={S.td}>{b.actual}</td>
                  <td style={S.td}><span style={S.badge(b.gap>30?T.red:b.gap>15?T.amber:T.green)}>{b.gap}</span></td>
                  <td style={S.td}>{b.correlation}</td>
                  <td style={S.td}><span style={S.badge(b.parametric>=b.actual?T.green:T.red)}>{b.parametric>=b.actual?'Adequate':'Underpaid'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Basis Risk by Trigger Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={triggerStats}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="avgBasisRisk" name="Basis Risk %">{triggerStats.map((e,i)=><Cell key={i} fill={e.avgBasisRisk>25?T.red:e.avgBasisRisk>15?T.amber:T.green}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Mitigation Strategies</div>
          <div style={{display:'grid',gap:8}}>
            {[{s:'Multi-index triggers',d:'Combine 2+ indices to reduce spatial basis risk',eff:'High'},{s:'Local calibration',d:'Station-level data vs gridded for better accuracy',eff:'High'},{s:'Hybrid products',d:'Parametric attachment + indemnity top-up',eff:'Medium'},{s:'Index enhancement',d:'Satellite + IoT ground-truth validation',eff:'Medium'},{s:'Temporal smoothing',d:'Rolling averages reduce noise-driven payouts',eff:'Low'}].map((m,i)=>(
              <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:6,display:'flex',gap:10,alignItems:'flex-start'}}>
                <span style={S.badge(m.eff==='High'?T.green:m.eff==='Medium'?T.amber:T.textSec)}>{m.eff}</span>
                <div><div style={{fontSize:12,fontWeight:600}}>{m.s}</div><div style={{fontSize:10,color:T.textSec}}>{m.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Climate Adaptation ───────────────────── */
  const renderAdaptation=()=>(
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Sovereign Risk Transfer Schemes</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Scheme','Region','Members','Coverage','Total ($M)','Payouts ($M)','Avg Speed','Premium ($M)','Loss Ratio','Climate Adapt.'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{SOVEREIGN_PROGRAMS.map((sp,i)=>(
              <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{sp.name}</td><td style={S.td}>{sp.region}</td><td style={S.td}>{sp.members}</td>
                <td style={{...S.td,fontSize:10}}>{sp.coverage}</td><td style={S.td}>{sp.totalCoverage}</td><td style={S.td}>{sp.payouts}</td>
                <td style={S.td}>{sp.speed}</td><td style={S.td}>{sp.premium}</td>
                <td style={S.td}><span style={S.badge(sp.lossRatio>0.55?T.amber:T.green)}>{(sp.lossRatio*100).toFixed(0)}%</span></td>
                <td style={S.td}><span style={S.badge(sp.climateAdaptation==='Very High'?T.green:sp.climateAdaptation==='High'?T.sage:T.amber)}>{sp.climateAdaptation}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Coverage by Sovereign Scheme ($M)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={SOVEREIGN_PROGRAMS} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={100}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="totalCoverage" name="Coverage ($M)" fill={T.navy}/><Bar dataKey="payouts" name="Payouts ($M)" fill={T.gold}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Parametric as Climate Adaptation Tool</div>
          <div style={{display:'grid',gap:8}}>
            {[{tool:'Crop Insurance',desc:'Smallholder farmers in drought-prone regions, NDVI/rainfall triggers',products:PRODUCTS.filter(p=>p.coverageType==='Crop Insurance').length},{tool:'Disaster Relief',desc:'Rapid post-disaster payouts bypassing slow aid pipelines',products:PRODUCTS.filter(p=>p.coverageType==='Disaster Relief').length},{tool:'Sovereign Risk',desc:'National budget protection for SIDS and LDCs',products:PRODUCTS.filter(p=>p.coverageType==='Sovereign Risk').length},{tool:'Infrastructure',desc:'Climate-proofing critical infrastructure investments',products:PRODUCTS.filter(p=>p.coverageType==='Infrastructure').length},{tool:'Livestock',desc:'Pastoralist livelihood protection via NDVI-based triggers',products:PRODUCTS.filter(p=>p.coverageType==='Livestock').length}].map((t,i)=>(
              <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,borderLeft:`3px solid ${TRIGGER_COLORS[i%TRIGGER_COLORS.length]}`}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div style={{fontSize:12,fontWeight:600}}>{t.tool}</div>
                  <span style={S.badge(T.navy)}>{t.products} products</span>
                </div>
                <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Adaptation Finance Gap</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={[{year:2020,current:12,needed:50,gap:38},{year:2022,current:18,needed:65,gap:47},{year:2024,current:28,needed:85,gap:57},{year:2026,current:42,needed:110,gap:68},{year:2028,current:60,needed:140,gap:80},{year:2030,current:85,needed:180,gap:95}]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="needed" name="Adaptation Need ($B)" stroke={T.red} fill={T.red} fillOpacity={0.15}/><Area type="monotone" dataKey="current" name="Current Coverage ($B)" stroke={T.sage} fill={T.sage} fillOpacity={0.3}/><Line type="monotone" dataKey="gap" name="Protection Gap ($B)" stroke={T.amber} strokeWidth={2} strokeDasharray="5 5"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>Parametric Insurance & Climate Triggers</h1>
        <div style={S.sub}>EP-AR3 · {PRODUCTS.length} products · {TRIGGER_TYPES.length} trigger types · {portfolioStats.countries} countries · Basis risk & adaptation</div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      {tab===0&&renderCatalog()}
      {tab===1&&renderCalibration()}
      {tab===2&&renderBasisRisk()}
      {tab===3&&renderAdaptation()}
    </div>
  );
}
