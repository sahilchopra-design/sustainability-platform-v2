/**
 * EP-BE2 — DME Probability of Default Engine
 * Full 4-branch PD computation for 40 entities.
 * Branch A: Exponential  Branch B: Merton DD  Branch C: Sector Logit  Branch D: Monte Carlo
 * IFRS 9 ECL · PD term structure · calibration metrics · sector/region heatmap
 */
import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,
        PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,ZAxis,Legend,
        RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,
        LineChart,Line,ComposedChart,ReferenceLine} from 'recharts';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T={bg:'#f7f4ef',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',
  navy:'#1b3a5c',gold:'#c5a96a',slate:'#64748b',teal:'#0e7490',
  text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',
  red:'#dc2626',green:'#059669',amber:'#d97706',blue:'#2563eb',purple:'#7c3aed',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',
  font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Seedable RNG ──────────────────────────────────────────────────────────── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const hashStr=(s)=>{let h=0;for(let i=0;i<s.length;i++){h=(Math.imul(31,h)+s.charCodeAt(i))|0;}return Math.abs(h);};

/* ── PD Math Engine ────────────────────────────────────────────────────────── */
// Abramowitz-Stegun normal CDF approximation
const abNormCDF=(x)=>{
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign=x<0?-1:1;
  const z=Math.abs(x)/Math.sqrt(2);
  const t_=1/(1+p*z);
  const y=1-(((((a5*t_+a4)*t_+a3)*t_+a2)*t_+a1)*t_)*Math.exp(-z*z);
  return 0.5*(1+sign*y);
};
const mertonDD=(A,D,r,sigma,t_yrs)=>(Math.log(A/D)+(r+0.5*sigma**2)*t_yrs)/(sigma*Math.sqrt(Math.max(0.0001,t_yrs)));
const logistic=(x)=>1/(1+Math.exp(-x));

/* ── Branch A: Exponential PD ────────────────────────────────────────────── */
const branchA=(pdBase,alpha,vT)=>Math.min(0.999,Math.max(0.0001,pdBase*Math.exp(alpha*vT)));

/* ── Branch B: Merton DD ─────────────────────────────────────────────────── */
const branchB=(assetVal,debtFace,sigma,r=0.04,t=3)=>{
  if(assetVal<=0||sigma<=0||debtFace<=0)return 0.5;
  const dd=mertonDD(assetVal,debtFace,r,sigma,t);
  return Math.min(0.999,Math.max(0.0001,abNormCDF(-dd)));
};

/* ── Branch C: Sector Coefficient Logit ────────────────────────────────────── */
// logit(PD) = β0 + β1·ESG + β2·GHG + β3·Revenue + β4·Sector_dummy
const branchC=(beta0,beta1,esg,beta2,ghg,beta3,rev,beta4)=>{
  const logit=beta0+beta1*esg+beta2*ghg+beta3*rev+beta4;
  return Math.min(0.999,Math.max(0.0001,logistic(logit)));
};

/* ── Branch D: Monte Carlo PD (500 paths) ──────────────────────────────────── */
const branchD_mc=(A0,K,mu,sigma,t=3,seed=1)=>{
  const PATHS=500;
  let defaults=0;
  for(let p=0;p<PATHS;p++){
    // Box-Muller using sr() for determinism
    const u1=sr(seed*PATHS+p*2+1);
    const u2=sr(seed*PATHS+p*2+2);
    const z=Math.sqrt(-2*Math.log(Math.max(0.0001,u1)))*Math.cos(2*Math.PI*u2);
    const At=A0*Math.exp((mu-0.5*sigma**2)*t+sigma*Math.sqrt(t)*z);
    if(At<K)defaults++;
  }
  return Math.min(0.999,Math.max(0.0001,defaults/PATHS));
};

/* ── Sector configuration ──────────────────────────────────────────────────── */
const SECTOR_CFG={
  'Energy':         {alpha:0.45,beta:0.30,gamma:0.15,carbonSens:0.85,strandedRisk:0.75,b0:-2.1,b1:-0.025,b2:0.018,b3:-0.012,b4:0.55},
  'Materials':      {alpha:0.35,beta:0.25,gamma:0.12,carbonSens:0.72,strandedRisk:0.55,b0:-2.4,b1:-0.022,b2:0.015,b3:-0.010,b4:0.35},
  'Industrials':    {alpha:0.25,beta:0.20,gamma:0.10,carbonSens:0.45,strandedRisk:0.30,b0:-2.8,b1:-0.020,b2:0.010,b3:-0.008,b4:0.20},
  'Healthcare':     {alpha:0.08,beta:0.10,gamma:0.15,carbonSens:0.12,strandedRisk:0.05,b0:-3.5,b1:-0.018,b2:0.005,b3:-0.015,b4:-0.10},
  'Technology':     {alpha:0.06,beta:0.08,gamma:0.12,carbonSens:0.10,strandedRisk:0.03,b0:-3.8,b1:-0.015,b2:0.004,b3:-0.018,b4:-0.20},
  'Finance':        {alpha:0.18,beta:0.12,gamma:0.20,carbonSens:0.30,strandedRisk:0.20,b0:-2.6,b1:-0.021,b2:0.012,b3:-0.011,b4:0.15},
  'Utilities':      {alpha:0.40,beta:0.35,gamma:0.12,carbonSens:0.80,strandedRisk:0.65,b0:-2.2,b1:-0.024,b2:0.017,b3:-0.009,b4:0.45},
  'Real Estate':    {alpha:0.20,beta:0.30,gamma:0.08,carbonSens:0.35,strandedRisk:0.25,b0:-2.7,b1:-0.020,b2:0.011,b3:-0.013,b4:0.10},
};
const SECTORS=Object.keys(SECTOR_CFG);
const REGIONS=['North America','Europe','Asia-Pacific','Latin America','Middle East'];

const LGD_BY_COLLATERAL={
  'Senior Secured':0.25,'Senior Unsecured':0.45,'Subordinated':0.65,'Unsecured':0.75,'Equity-like':0.90
};
const COLLATERAL_TYPES=Object.keys(LGD_BY_COLLATERAL);

/* ── Generate 40 entity universe ──────────────────────────────────────────── */
const ENTITIES=(()=>{
  const names=[
    'Shell plc','BP plc','Exxon Mobil','TotalEnergies','Chevron',
    'JPMorgan Chase','Goldman Sachs','BlackRock','HSBC','Morgan Stanley',
    'BHP Group','Rio Tinto','Glencore','Vale SA','ArcelorMittal',
    'Pfizer','Johnson & Johnson','AstraZeneca','Novartis','Roche',
    'Apple','Microsoft','Google','Amazon','Tesla',
    'Siemens','GE','Honeywell','Caterpillar','3M',
    'NextEra Energy','Enel SpA','Iberdrola','Duke Energy','Exelon',
    'Prologis','CBRE Group','Brookfield','Unibail','AvalonBay',
  ];
  const sectorsArr=[
    'Energy','Energy','Energy','Energy','Energy',
    'Finance','Finance','Finance','Finance','Finance',
    'Materials','Materials','Materials','Materials','Materials',
    'Healthcare','Healthcare','Healthcare','Healthcare','Healthcare',
    'Technology','Technology','Technology','Technology','Technology',
    'Industrials','Industrials','Industrials','Industrials','Industrials',
    'Utilities','Utilities','Utilities','Utilities','Utilities',
    'Real Estate','Real Estate','Real Estate','Real Estate','Real Estate',
  ];
  return names.map((name,i)=>{
    const sector=sectorsArr[i];
    const cfg=SECTOR_CFG[sector];
    const region=REGIONS[Math.floor(sr(i*7)*REGIONS.length)];
    const esgScore=Math.round(20+sr(i*11)*75);
    const ghgIntensity=+(100+sr(i*13)*400).toFixed(0);   // tCO2e/$M
    const revenueGrowth=+(sr(i*17)*0.15-0.03).toFixed(3); // -3% to +12%
    const assetVal=Math.round(500+sr(i*23)*4500);          // $M
    const debtFace=Math.round(assetVal*(0.25+sr(i*29)*0.45));
    const assetVol=+(0.12+sr(i*31)*0.32).toFixed(3);
    const mu=+(0.03+sr(i*37)*0.06).toFixed(3);
    const vT=+(sr(i*41)*2.0-0.5).toFixed(3);               // transition velocity
    const pdBase=+(0.005+sr(i*43)*0.07).toFixed(5);
    const ead=Math.round(debtFace*(0.8+sr(i*47)*0.3));     // $M EAD
    const collateralIdx=Math.floor(sr(i*53)*COLLATERAL_TYPES.length);
    const collateral=COLLATERAL_TYPES[collateralIdx];
    const lgd=LGD_BY_COLLATERAL[collateral];

    // 4-branch PD
    const pdA=+branchA(pdBase,cfg.alpha,vT).toFixed(5);
    const pdB=+branchB(assetVal,debtFace,assetVol).toFixed(5);
    const pdC=+branchC(cfg.b0,cfg.b1,esgScore,cfg.b2,ghgIntensity/1000,cfg.b3,revenueGrowth,cfg.b4).toFixed(5);
    const pdD=+branchD_mc(assetVal,debtFace,mu,assetVol,3,i+1).toFixed(5);

    // Consensus (weighted avg, guarded)
    const pdConsensus=+((pdA*0.25+pdB*0.30+pdC*0.20+pdD*0.25)).toFixed(5);
    const pdArr=[pdA,pdB,pdC,pdD];
    const pdMean=pdArr.reduce((s,v)=>s+v,0)/4;
    const pdStd=Math.sqrt(pdArr.reduce((s,v)=>s+(v-pdMean)**2,0)/4);
    const conviction=+(Math.max(0,1-pdStd/Math.max(0.0001,pdMean))).toFixed(3);

    // IFRS 9
    const stage=pdConsensus>0.10?'Stage 3':pdConsensus>0.02?'Stage 2':'Stage 1';
    const pd12m=+Math.min(pdConsensus,1).toFixed(5);
    const pdLifetime=+Math.min(1,pdConsensus*3.2).toFixed(5);
    const ecl=+(pdConsensus*lgd*ead).toFixed(2);           // $M ECL
    const ecl12m=+(pd12m*lgd*ead).toFixed(2);

    // Merton DD at t=3
    const dd=+(mertonDD(assetVal,debtFace,0.04,assetVol,3)).toFixed(3);

    // Term structure hazard rate at 1yr
    const lambda1=+(-Math.log(Math.max(0.0001,1-pd12m))/1).toFixed(5);

    return{id:i+1,name,sector,region,esgScore,ghgIntensity,revenueGrowth,
      assetVal,debtFace,assetVol,mu,vT,pdBase,ead,collateral,lgd,
      pdA,pdB,pdC,pdD,pdConsensus,conviction,dd,
      stage,pd12m,pdLifetime,ecl,ecl12m,lambda1,
      alpha:cfg.alpha,beta:cfg.beta,gamma:cfg.gamma};
  });
})();

/* ── Style helpers ──────────────────────────────────────────────────────────── */
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const cS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};
const thS={padding:'7px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',textAlign:'left',background:T.surfaceH};
const tdS={padding:'6px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};

const kpiBox=(label,value,sub,accent=T.navy)=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:130}}>
    <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:accent,marginTop:4,fontFamily:T.mono}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);

const pill=(label,bg,fg='#fff')=>(
  <span style={{background:bg,color:fg,borderRadius:4,padding:'2px 7px',fontSize:11,fontFamily:T.mono,fontWeight:600}}>{label}</span>
);

const pdColor=(p)=>p>0.10?T.red:p>0.03?T.amber:T.green;
const stageColor=(s)=>({'Stage 1':T.green,'Stage 2':T.amber,'Stage 3':T.red}[s]||T.slate);
const esgBand=(s)=>s>70?'low':s>50?'medium':s>30?'high':'severe';
const bandColor=(b)=>({low:T.green,medium:T.amber,high:T.red,severe:'#7c3aed'}[b]||T.slate);

const TABS=[
  'Overview','Branch A — Exponential','Branch B — Merton DD',
  'Branch C — Sector Logit','Branch D — Monte Carlo',
  'Consensus PD','IFRS 9 ECL','PD Term Structure',
  'Calibration','Sector & Region Heatmap'
];

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function DmePdEnginePage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sectorF,setSectorF]=useState('All');
  const[sortCol,setSortCol]=useState('pdConsensus');
  const[sortDir,setSortDir]=useState('desc');
  const[wA,setWA]=useState(0.25);
  const[wB,setWB]=useState(0.30);
  const[wC,setWC]=useState(0.20);
  const[wD,setWD]=useState(0.25);

  const filtered=useMemo(()=>{
    let d=[...ENTITIES];
    if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.sector.toLowerCase().includes(search.toLowerCase()));
    if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);
    return[...d].sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
  },[search,sectorF,sortCol,sortDir]);

  const doSort=useCallback((col)=>{
    if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortCol(col);setSortDir('desc');}
  },[sortCol]);

  // Weighted consensus with user-adjustable weights
  const consensusEntities=useMemo(()=>{
    const wSum=wA+wB+wC+wD;
    return ENTITIES.map(e=>{
      const pdW=wSum>0?(e.pdA*wA+e.pdB*wB+e.pdC*wC+e.pdD*wD)/wSum:e.pdConsensus;
      const elW=+(pdW*e.lgd*e.ead).toFixed(2);
      return{...e,pdWeighted:+pdW.toFixed(5),elWeighted:elW};
    });
  },[wA,wB,wC,wD]);

  // Portfolio-level KPIs
  const portKPIs=useMemo(()=>{
    const n=Math.max(1,ENTITIES.length);
    const avgPD=(ENTITIES.reduce((s,e)=>s+e.pdConsensus,0)/n);
    const avgDD=(ENTITIES.reduce((s,e)=>s+e.dd,0)/n);
    const totalECL=ENTITIES.reduce((s,e)=>s+e.ecl,0);
    const highRisk=ENTITIES.filter(e=>e.pdConsensus>0.05).length;
    const stage2=ENTITIES.filter(e=>e.stage==='Stage 2').length;
    const stage3=ENTITIES.filter(e=>e.stage==='Stage 3').length;
    return{avgPD,avgDD,totalECL,highRisk,stage2,stage3};
  },[]);

  /* ── Tab 0: Overview ── */
  const renderOverview=()=>{
    const pdDist=[
      {range:'<1%',count:ENTITIES.filter(e=>e.pdConsensus<0.01).length},
      {range:'1-3%',count:ENTITIES.filter(e=>e.pdConsensus>=0.01&&e.pdConsensus<0.03).length},
      {range:'3-5%',count:ENTITIES.filter(e=>e.pdConsensus>=0.03&&e.pdConsensus<0.05).length},
      {range:'5-10%',count:ENTITIES.filter(e=>e.pdConsensus>=0.05&&e.pdConsensus<0.10).length},
      {range:'>10%',count:ENTITIES.filter(e=>e.pdConsensus>=0.10).length},
    ];
    const stageDist=[
      {name:'Stage 1',value:ENTITIES.filter(e=>e.stage==='Stage 1').length},
      {name:'Stage 2',value:ENTITIES.filter(e=>e.stage==='Stage 2').length},
      {name:'Stage 3',value:ENTITIES.filter(e=>e.stage==='Stage 3').length},
    ];
    const regimeDist=SECTORS.map(s=>({sector:s.slice(0,6),avgPD:+(ENTITIES.filter(e=>e.sector===s).reduce((a,e)=>a+e.pdConsensus,0)/Math.max(1,ENTITIES.filter(e=>e.sector===s).length)*100).toFixed(2)}));
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Weighted Avg PD',(portKPIs.avgPD*100).toFixed(2)+'%','Portfolio consensus')}
          {kpiBox('Avg Distance-to-Default',portKPIs.avgDD.toFixed(3),'Merton DD (3yr)','#2563eb')}
          {kpiBox('Total Portfolio ECL','$'+portKPIs.totalECL.toFixed(0)+'M','12-month ECL',T.red)}
          {kpiBox('High Risk (PD>5%)',portKPIs.highRisk,'Entities',T.amber)}
          {kpiBox('Stage 2',portKPIs.stage2,'IFRS 9 SICR',T.amber)}
          {kpiBox('Stage 3',portKPIs.stage3,'IFRS 9 Default',T.red)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PD DISTRIBUTION — CONSENSUS BLENDED</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pdDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="range" tick={{fontSize:11,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                <Tooltip {...tip}/>
                <Bar dataKey="count" name="Entity Count" radius={[3,3,0,0]}>
                  {pdDist.map((_,i)=><Cell key={i} fill={[T.green,T.green,T.amber,T.amber,T.red][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>IFRS 9 STAGE ALLOCATION</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stageDist} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                     label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`}>
                  {stageDist.map((_,i)=><Cell key={i} fill={[T.green,T.amber,T.red][i]}/>)}
                </Pie>
                <Tooltip {...tip}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>AVG CONSENSUS PD BY SECTOR (%)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={regimeDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="avgPD" fill={'#7c3aed'} name="Avg PD %" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>BRANCH A vs B vs C vs D — SCATTER</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="Branch A" type="number" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(1)+'%'} label={{value:'Branch A',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis dataKey="y" name="Branch B" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(1)+'%'}/>
                <Tooltip {...tip} formatter={(v,n)=>`${(v*100).toFixed(3)}%`}/>
                <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.pdA,y:e.pdB}))} fill={'#2563eb'} fillOpacity={0.55}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search entities..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:200}}/>
          <select value={sectorF} onChange={e=>setSectorF(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text}}>
            <option>All</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {[['name','Entity'],['sector','Sector'],['pdConsensus','Consensus PD'],['pdA','Br A'],['pdB','Br B'],['pdC','Br C'],['pdD','Br D'],['stage','Stage'],['ecl','ECL $M']].map(([col,label])=>(
                <th key={col} onClick={()=>doSort(col)} style={{...thS,cursor:'pointer'}}>{label}{sortCol===col?(sortDir==='asc'?' ▲':' ▼'):' ◦'}</th>
              ))}
            </tr></thead>
            <tbody>{filtered.slice(0,20).map((e,i)=>(
              <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                <td style={tdS}>{e.sector}</td>
                <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:pdColor(e.pdConsensus)}}>{(e.pdConsensus*100).toFixed(3)}%</td>
                <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdA)}}>{(e.pdA*100).toFixed(3)}%</td>
                <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdB)}}>{(e.pdB*100).toFixed(3)}%</td>
                <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdC)}}>{(e.pdC*100).toFixed(3)}%</td>
                <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdD)}}>{(e.pdD*100).toFixed(3)}%</td>
                <td style={tdS}>{pill(e.stage,stageColor(e.stage))}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{e.ecl}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Tab 1: Branch A — Exponential ── */
  const renderBranchA=()=>{
    const alphaData=SECTORS.map(s=>({sector:s.slice(0,6),alpha:SECTOR_CFG[s].alpha}));
    const sensitivity=SECTORS.map(s=>{
      const cfg=SECTOR_CFG[s];
      const es=ENTITIES.filter(e=>e.sector===s);
      const pdBase=es.length?(es.reduce((a,e)=>a+e.pdBase,0)/es.length):0.01;
      return{sector:s.slice(0,6),
        vTneg2:+(branchA(pdBase,cfg.alpha,-2)*100).toFixed(3),
        vT0:+(branchA(pdBase,cfg.alpha,0)*100).toFixed(3),
        vTpos2:+(branchA(pdBase,cfg.alpha,2)*100).toFixed(3),
      };
    });
    return(
      <div>
        <div style={{background:'rgba(37,99,235,0.07)',border:`1px solid ${'#2563eb'}`,borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
          <strong>Branch A Formula:</strong> <code style={{fontFamily:T.mono,background:T.surfaceH,padding:'2px 6px',borderRadius:3}}>PD = PD_base × exp(α × v_transition)</code><br/>
          α calibrated per sector from SECTOR_CFG. v_transition = DME velocity score (range ~−2 to +2). High positive velocity = stress, high negative = improvement.
        </div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Max α (Transition)',Math.max(...SECTORS.map(s=>SECTOR_CFG[s].alpha)).toFixed(2),'Energy sector',T.red)}
          {kpiBox('Min α',Math.min(...SECTORS.map(s=>SECTOR_CFG[s].alpha)).toFixed(2),'Technology sector',T.green)}
          {kpiBox('Avg Branch A PD',(ENTITIES.reduce((s,e)=>s+e.pdA,0)/Math.max(1,ENTITIES.length)*100).toFixed(2)+'%','Universe mean')}
          {kpiBox('High-α Entities',ENTITIES.filter(e=>e.alpha>0.30).length,'α > 0.30',T.amber)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SECTOR α CALIBRATION TABLE</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={alphaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} domain={[0,0.5]}/>
                <Tooltip {...tip}/>
                <Bar dataKey="alpha" fill={'#2563eb'} name="α coefficient" radius={[3,3,0,0]}>
                  {alphaData.map((d,i)=><Cell key={i} fill={d.alpha>0.35?T.red:d.alpha>0.20?T.amber:T.green}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PD SENSITIVITY TO v_TRANSITION (by sector)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="vTneg2" fill={T.green} name="vT=−2" radius={[2,2,0,0]}/>
                <Bar dataKey="vT0" fill={T.amber} name="vT=0" radius={[2,2,0,0]}/>
                <Bar dataKey="vTpos2" fill={T.red} name="vT=+2" radius={[2,2,0,0]}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>BRANCH A — ENTITY REGISTER (SORTED BY PD_A DESC)</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','PD Base','α','v_Transition','Branch A PD','ESG Score','ESG Band'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{[...ENTITIES].sort((a,b)=>b.pdA-a.pdA).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{(e.pdBase*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,color:e.alpha>0.30?T.red:T.amber}}>{e.alpha}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:e.vT>0?T.red:T.green}}>{e.vT}</td>
                  <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:pdColor(e.pdA)}}>{(e.pdA*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.esgScore}</td>
                  <td style={tdS}>{pill(esgBand(e.esgScore),bandColor(esgBand(e.esgScore)))}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 2: Branch B — Merton DD ── */
  const renderBranchB=()=>{
    const ddDist=[
      {range:'<0',count:ENTITIES.filter(e=>e.dd<0).length},
      {range:'0-1',count:ENTITIES.filter(e=>e.dd>=0&&e.dd<1).length},
      {range:'1-2',count:ENTITIES.filter(e=>e.dd>=1&&e.dd<2).length},
      {range:'2-3',count:ENTITIES.filter(e=>e.dd>=2&&e.dd<3).length},
      {range:'>3',count:ENTITIES.filter(e=>e.dd>=3).length},
    ];
    return(
      <div>
        <div style={{background:'rgba(14,116,144,0.07)',border:`1px solid ${T.teal}`,borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
          <strong>Branch B Formula:</strong><br/>
          <code style={{fontFamily:T.mono,background:T.surfaceH,padding:'2px 6px',borderRadius:3,display:'block',marginTop:4}}>
            DD = [ln(A/D) + (r + 0.5σ²)t] / (σ√t) &nbsp;→&nbsp; PD = N(−DD)
          </code>
          A = Asset Value, D = Debt Face, σ = Asset Volatility, r = 0.04 risk-free, t = 3yr. N(·) via Abramowitz-Stegun (a5=1.061405429).
        </div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Avg Distance-to-Default',(ENTITIES.reduce((s,e)=>s+e.dd,0)/ENTITIES.length).toFixed(3),'3-year horizon')}
          {kpiBox('Avg Branch B PD',(ENTITIES.reduce((s,e)=>s+e.pdB,0)/ENTITIES.length*100).toFixed(3)+'%','Merton mean',T.teal)}
          {kpiBox('DD < 1 (Distressed)',ENTITIES.filter(e=>e.dd<1).length,'High-stress entities',T.red)}
          {kpiBox('DD > 3 (Safe)',ENTITIES.filter(e=>e.dd>3).length,'Low-risk entities',T.green)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>DISTANCE-TO-DEFAULT DISTRIBUTION</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ddDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="range" tick={{fontSize:11,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                <Tooltip {...tip}/>
                <Bar dataKey="count" name="Entity Count" radius={[3,3,0,0]}>
                  {ddDist.map((_,i)=><Cell key={i} fill={[T.red,T.amber,T.amber,T.green,T.green][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>DD vs ASSET VOLATILITY SCATTER</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="Asset Volatility" type="number" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(0)+'%'} label={{value:'Asset Volatility',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis dataKey="y" name="Distance-to-Default" tick={{fontSize:10}}/>
                <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''} formatter={(v,n)=>n==='Asset Volatility'?(v*100).toFixed(1)+'%':v.toFixed(3)}/>
                <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.assetVol,y:e.dd}))} fill={T.teal} fillOpacity={0.6}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>MERTON DD REGISTER — SORTED BY DD ASC (MOST DISTRESSED FIRST)</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','Asset Val $M','Debt Face $M','Asset Vol','Merton DD','Branch B PD','Leverage%'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{[...ENTITIES].sort((a,b)=>a.dd-b.dd).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.assetVal.toLocaleString()}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.debtFace.toLocaleString()}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{(e.assetVol*100).toFixed(1)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:e.dd<1?T.red:e.dd<2?T.amber:T.green}}>{e.dd}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdB)}}>{(e.pdB*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{((e.debtFace/Math.max(1,e.assetVal))*100).toFixed(1)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 3: Branch C — Sector Logit ── */
  const renderBranchC=()=>{
    const coeffTable=SECTORS.map(s=>({sector:s,...SECTOR_CFG[s]}));
    const marginalESG=SECTORS.map(s=>{
      const cfg=SECTOR_CFG[s];
      const es=ENTITIES.filter(e=>e.sector===s);
      if(!es.length)return{sector:s.slice(0,6),mESG:0,mGHG:0};
      const avgGHG=es.reduce((a,e)=>a+e.ghgIntensity,0)/es.length/1000;
      const avgRev=es.reduce((a,e)=>a+e.revenueGrowth,0)/es.length;
      const basePD=branchC(cfg.b0,cfg.b1,55,cfg.b2,avgGHG,cfg.b3,avgRev,cfg.b4);
      const pdESG1=branchC(cfg.b0,cfg.b1,56,cfg.b2,avgGHG,cfg.b3,avgRev,cfg.b4);
      const pdGHG1=branchC(cfg.b0,cfg.b1,55,cfg.b2,avgGHG+0.01,cfg.b3,avgRev,cfg.b4);
      return{sector:s.slice(0,6),mESG:+((pdESG1-basePD)*100).toFixed(4),mGHG:+((pdGHG1-basePD)*100).toFixed(4)};
    });
    return(
      <div>
        <div style={{background:'rgba(217,119,6,0.07)',border:`1px solid ${T.amber}`,borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
          <strong>Branch C Formula:</strong><br/>
          <code style={{fontFamily:T.mono,background:T.surfaceH,padding:'2px 6px',borderRadius:3,display:'block',marginTop:4}}>
            logit(PD) = β₀ + β₁·ESG + β₂·GHG + β₃·Revenue + β₄·Sector_dummy &nbsp;→&nbsp; PD = σ(logit)
          </code>
          σ = sigmoid/logistic. β₁ &lt; 0 (higher ESG = lower PD). β₂ &gt; 0 (higher GHG intensity = higher PD). Coefficients sector-calibrated.
        </div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Avg Branch C PD',(ENTITIES.reduce((s,e)=>s+e.pdC,0)/ENTITIES.length*100).toFixed(3)+'%','Sector logit mean',T.amber)}
          {kpiBox('Most Negative β₁',Math.min(...SECTORS.map(s=>SECTOR_CFG[s].b1)).toFixed(3),'Strongest ESG effect')}
          {kpiBox('Avg ESG Score',(ENTITIES.reduce((s,e)=>s+e.esgScore,0)/ENTITIES.length).toFixed(1),'Universe mean')}
          {kpiBox('Avg GHG Intensity',(ENTITIES.reduce((s,e)=>s+e.ghgIntensity,0)/ENTITIES.length).toFixed(0),'tCO2e/$M')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>MARGINAL EFFECT OF ESG (+1 pt) ON PD (%)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={marginalESG}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="mESG" fill={T.green} name="ΔPDI/ΔESG" radius={[3,3,0,0]}/>
                <Bar dataKey="mGHG" fill={T.red} name="ΔPDI/ΔGHG" radius={[3,3,0,0]}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>ESG SCORE vs BRANCH C PD SCATTER</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="ESG Score" type="number" tick={{fontSize:10}} label={{value:'ESG Score',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis dataKey="y" name="Branch C PD" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(1)+'%'}/>
                <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''} formatter={(v,n)=>n==='ESG Score'?v:(v*100).toFixed(3)+'%'}/>
                <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.esgScore,y:e.pdC}))} fill={T.amber} fillOpacity={0.6}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SECTOR COEFFICIENT TABLE — β PARAMETERS</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Sector','β₀ (Intercept)','β₁ (ESG)','β₂ (GHG)','β₃ (Revenue)','β₄ (Sector Dummy)','Avg Sector PD'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{coeffTable.map((s,i)=>{
                const es=ENTITIES.filter(e=>e.sector===s.sector);
                const avgPD=es.length?(es.reduce((a,e)=>a+e.pdC,0)/es.length*100).toFixed(3):'0.000';
                return(
                  <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <td style={{...tdS,fontWeight:700}}>{s.sector}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{s.b0}</td>
                    <td style={{...tdS,fontFamily:T.mono,color:T.green}}>{s.b1}</td>
                    <td style={{...tdS,fontFamily:T.mono,color:T.red}}>{s.b2}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{s.b3}</td>
                    <td style={{...tdS,fontFamily:T.mono,color:s.b4>0?T.amber:T.green}}>{s.b4}</td>
                    <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:pdColor(parseFloat(avgPD)/100)}}>{avgPD}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 4: Branch D — Monte Carlo ── */
  const renderBranchD=()=>{
    // Convergence curve: simulate at path counts 50,100,200,300,400,500 for entity 0
    const e0=ENTITIES[0];
    const convData=[50,100,200,300,400,500].map(paths=>{
      let def=0;
      for(let p=0;p<paths;p++){
        const u1=sr(1*1000+p*2+1);
        const u2=sr(1*1000+p*2+2);
        const z=Math.sqrt(-2*Math.log(Math.max(0.0001,u1)))*Math.cos(2*Math.PI*u2);
        const At=e0.assetVal*Math.exp((e0.mu-0.5*e0.assetVol**2)*3+e0.assetVol*Math.sqrt(3)*z);
        if(At<e0.debtFace)def++;
      }
      return{paths,pd:+((def/paths)*100).toFixed(3)};
    });
    return(
      <div>
        <div style={{background:'rgba(124,58,237,0.07)',border:`1px solid ${'#7c3aed'}`,borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
          <strong>Branch D — Monte Carlo (500 paths):</strong><br/>
          <code style={{fontFamily:T.mono,background:T.surfaceH,padding:'2px 6px',borderRadius:3,display:'block',marginTop:4}}>
            A_t = A_0 × exp((μ − 0.5σ²)t + σ√t · Z) &nbsp;|&nbsp; Z ~ N(0,1) via Box-Muller + sr() &nbsp;|&nbsp; PD = #{"{A_t < D}"}/500
          </code>
          GBM asset value process. Default triggered when terminal asset value falls below debt face (D). 500 deterministic paths per entity (sr-seeded Box-Muller).
        </div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Avg Branch D PD',(ENTITIES.reduce((s,e)=>s+e.pdD,0)/ENTITIES.length*100).toFixed(3)+'%','Monte Carlo mean','#7c3aed')}
          {kpiBox('Paths per Entity',500,'Box-Muller + sr() seeded')}
          {kpiBox('High MC PD (>5%)',ENTITIES.filter(e=>e.pdD>0.05).length,'Entities',T.amber)}
          {kpiBox('Avg μ (Drift)',(ENTITIES.reduce((s,e)=>s+e.mu,0)/ENTITIES.length*100).toFixed(2)+'%','Mean asset drift')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>MC CONVERGENCE — {e0.name} (500 paths)</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={convData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="paths" tick={{fontSize:10}} label={{value:'Paths',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Line type="monotone" dataKey="pd" stroke={'#7c3aed'} strokeWidth={2} name="MC PD %" dot={{r:4,fill:'#7c3aed'}}/>
                <ReferenceLine y={(e0.pdD*100).toFixed(3)} stroke={T.red} strokeDasharray="4 4" label={{value:'Final',position:'right',fontSize:10}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>BRANCH D vs BRANCH B — SCATTER</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="Branch B (Merton)" type="number" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(1)+'%'} label={{value:'Branch B',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis dataKey="y" name="Branch D (MC)" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(1)+'%'}/>
                <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''} formatter={(v)=>(v*100).toFixed(3)+'%'}/>
                <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.pdB,y:e.pdD}))} fill={'#7c3aed'} fillOpacity={0.55}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>BRANCH D REGISTER — SORTED BY MC PD DESC</div>
          <div style={{maxHeight:280,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','A₀ $M','D $M','μ','σ','Branch D PD','vs Branch B'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{[...ENTITIES].sort((a,b)=>b.pdD-a.pdD).map((e,i)=>{
                const diff=((e.pdD-e.pdB)*100).toFixed(3);
                return(
                  <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                    <td style={tdS}>{e.sector}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{e.assetVal.toLocaleString()}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{e.debtFace.toLocaleString()}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{(e.mu*100).toFixed(2)}%</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{(e.assetVol*100).toFixed(1)}%</td>
                    <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:pdColor(e.pdD)}}>{(e.pdD*100).toFixed(3)}%</td>
                    <td style={{...tdS,fontFamily:T.mono,color:parseFloat(diff)>0?T.red:T.green}}>{diff>0?'+':''}{diff}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 5: Consensus PD ── */
  const renderConsensus=()=>{
    const wSum=wA+wB+wC+wD;
    const portEL=consensusEntities.reduce((s,e)=>s+e.elWeighted,0);
    const avgConv=(consensusEntities.reduce((s,e)=>s+e.conviction,0)/Math.max(1,consensusEntities.length));
    return(
      <div>
        <div style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:8,padding:'14px 20px',marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:10}}>CONFIGURE BRANCH WEIGHTS (sum = {wSum.toFixed(2)})</div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[['Branch A (Exponential)',wA,setWA,'blue'],['Branch B (Merton)',wB,setWB,'teal'],['Branch C (Logit)',wC,setWC,'amber'],['Branch D (Monte Carlo)',wD,setWD,'purple']].map(([label,val,setter,col])=>(
              <div key={label} style={{display:'flex',flexDirection:'column',gap:4,minWidth:180}}>
                <label style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>{label}: <strong style={{color:T[col]}}>{val.toFixed(2)}</strong></label>
                <input type="range" min={0} max={1} step={0.05} value={val} onChange={e=>setter(parseFloat(e.target.value))} style={{cursor:'pointer'}}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Avg Weighted PD',(consensusEntities.reduce((s,e)=>s+e.pdWeighted,0)/consensusEntities.length*100).toFixed(3)+'%','Configurable weights')}
          {kpiBox('Portfolio EL','$'+portEL.toFixed(0)+'M','Σ(PD×LGD×EAD)',T.red)}
          {kpiBox('Avg Conviction',avgConv.toFixed(3),'1 − std/mean of 4 branches',T.green)}
          {kpiBox('Low Conviction (<0.4)',consensusEntities.filter(e=>e.conviction<0.4).length,'Branch divergence',T.amber)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CONSENSUS PD vs CONVICTION SCORE</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="Conviction" type="number" domain={[0,1]} tick={{fontSize:10}} label={{value:'Conviction Score',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis dataKey="y" name="Consensus PD" tick={{fontSize:10}} tickFormatter={v=>(v*100).toFixed(1)+'%'}/>
                <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''} formatter={(v,n)=>n==='Conviction'?v.toFixed(3):(v*100).toFixed(3)+'%'}/>
                <Scatter data={consensusEntities.map(e=>({name:e.name,x:e.conviction,y:e.pdWeighted}))} fill={T.navy} fillOpacity={0.55}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>EXPECTED LOSS BY SECTOR ($M)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SECTORS.map(s=>({sector:s.slice(0,6),el:+(consensusEntities.filter(e=>e.sector===s).reduce((a,e)=>a+e.elWeighted,0)).toFixed(1)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+v+'M'}/>
                <Tooltip {...tip} formatter={v=>`$${v}M`}/>
                <Bar dataKey="el" fill={T.red} name="ECL $M" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CONSENSUS REGISTER — TOP 20 BY WEIGHTED PD</div>
          <div style={{maxHeight:280,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','Br A','Br B','Br C','Br D','Wtd PD','Conviction','EL $M'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{[...consensusEntities].sort((a,b)=>b.pdWeighted-a.pdWeighted).slice(0,20).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdA)}}>{(e.pdA*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdB)}}>{(e.pdB*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdC)}}>{(e.pdC*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdD)}}>{(e.pdD*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:pdColor(e.pdWeighted)}}>{(e.pdWeighted*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,color:e.conviction<0.4?T.red:T.green}}>{e.conviction}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.elWeighted}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 6: IFRS 9 ECL ── */
  const renderIFRS9=()=>{
    const sicrTriggers=['PD increase >100bps','Rating downgrade ≥3 notches','30-days past due','Forbearance granted','Watch-list designation'];
    const lgdByCollateral=Object.entries(LGD_BY_COLLATERAL).map(([c,l])=>({collateral:c,lgd:(l*100).toFixed(0),count:ENTITIES.filter(e=>e.collateral===c).length}));
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Stage 1 Entities',ENTITIES.filter(e=>e.stage==='Stage 1').length,'PD ≤ 2%',T.green)}
          {kpiBox('Stage 2 Entities',ENTITIES.filter(e=>e.stage==='Stage 2').length,'2% < PD ≤ 10%',T.amber)}
          {kpiBox('Stage 3 Entities',ENTITIES.filter(e=>e.stage==='Stage 3').length,'PD > 10%',T.red)}
          {kpiBox('Total 12m ECL','$'+ENTITIES.reduce((s,e)=>s+e.ecl12m,0).toFixed(0)+'M','Portfolio 12-month')}
          {kpiBox('Total Lifetime ECL','$'+ENTITIES.reduce((s,e)=>s+e.ecl,0).toFixed(0)+'M','All stages')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>ECL BY STAGE ($M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={['Stage 1','Stage 2','Stage 3'].map(s=>({stage:s,ecl12m:+ENTITIES.filter(e=>e.stage===s).reduce((a,e)=>a+e.ecl12m,0).toFixed(0),ecl:+ENTITIES.filter(e=>e.stage===s).reduce((a,e)=>a+e.ecl,0).toFixed(0)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+v+'M'}/>
                <Tooltip {...tip} formatter={v=>`$${v}M`}/>
                <Bar dataKey="ecl12m" fill={'#2563eb'} name="12m ECL $M" radius={[2,2,0,0]}/>
                <Bar dataKey="ecl" fill={T.red} name="Lifetime ECL $M" radius={[2,2,0,0]} fillOpacity={0.55}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>LGD BY COLLATERAL TYPE</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lgdByCollateral}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="collateral" tick={{fontSize:9}} angle={-15} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="lgd" fill={T.amber} name="LGD %" radius={[3,3,0,0]}/>
                <Bar dataKey="count" fill={T.navy} name="Entity Count" radius={[3,3,0,0]} yAxisId="right"/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10}}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{...cS,marginBottom:16}}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SICR TRIGGER FRAMEWORK (IFRS 9 §B5.5.15)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {sicrTriggers.map((t,i)=>(
              <div key={i} style={{background:T.surfaceH,border:`1px solid ${T.amber}`,borderRadius:6,padding:'6px 12px',fontSize:12,color:T.navy}}>{t}</div>
            ))}
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>IFRS 9 REGISTER — TOP 20 BY LIFETIME ECL</div>
          <div style={{maxHeight:280,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','Stage','PD 12m','PD Lifetime','LGD','EAD $M','ECL 12m $M','ECL Lifetime $M'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{[...ENTITIES].sort((a,b)=>b.ecl-a.ecl).slice(0,20).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={tdS}>{pill(e.stage,stageColor(e.stage))}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pd12m)}}>{(e.pd12m*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono,color:pdColor(e.pdLifetime)}}>{(e.pdLifetime*100).toFixed(3)}%</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{(e.lgd*100).toFixed(0)}%</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.ead}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.ecl12m}</td>
                  <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:T.red}}>{e.ecl}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 7: PD Term Structure ── */
  const renderTermStructure=()=>{
    const tenors=[1,3,5,7,10];
    const termData=tenors.map(t=>{
      const avgPD=(ENTITIES.reduce((s,e)=>{
        // PD_t = 1 - exp(-λ·t) where λ = hazard rate from 12m PD
        const pdT=1-Math.exp(-e.lambda1*t);
        return s+Math.min(0.999,pdT);
      },0)/ENTITIES.length);
      const avgHaz=(ENTITIES.reduce((s,e)=>s+e.lambda1,0)/ENTITIES.length);
      const survival=Math.exp(-avgHaz*t);
      return{tenor:t+'yr',avgPD:+(avgPD*100).toFixed(3),survival:+(survival*100).toFixed(2),hazardRate:+avgHaz.toFixed(5),creditSpread:+(avgHaz*10000).toFixed(0)};
    });
    const entityTermEx=ENTITIES.slice(0,6).map(e=>({
      name:e.name.split(' ')[0],
      ...Object.fromEntries(tenors.map(t=>[t+'yr',+((1-Math.exp(-e.lambda1*t))*100).toFixed(3)]))
    }));
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Avg Hazard Rate',(ENTITIES.reduce((s,e)=>s+e.lambda1,0)/ENTITIES.length*10000).toFixed(1)+' bps','λ = −ln(1−PD₁)/1')}
          {kpiBox('10yr Avg PD',termData[4]?.avgPD.toFixed(2)+'%','Lifetime cumulative',T.red)}
          {kpiBox('10yr Survival',termData[4]?.survival.toFixed(2)+'%','Portfolio-level',T.green)}
          {kpiBox('Implied Credit Spread',termData[2]?.creditSpread+' bps','5yr equivalent (λ×10000)','#2563eb')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PORTFOLIO PD TERM STRUCTURE & SURVIVAL CURVE</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={termData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="tenor" tick={{fontSize:11,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'} yAxisId="left"/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="avgPD" fill={T.red} name="Avg PD %" radius={[3,3,0,0]} yAxisId="left" fillOpacity={0.6}/>
                <Line type="monotone" dataKey="survival" stroke={T.green} strokeWidth={2.5} name="Survival %" yAxisId="right" dot={{r:4}}/>
                <Legend/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>IMPLIED CREDIT SPREAD BY TENOR (bps)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={termData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="tenor" tick={{fontSize:11,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+' bps'}/>
                <Tooltip {...tip} formatter={v=>`${v} bps`}/>
                <Bar dataKey="creditSpread" fill={'#2563eb'} name="Credit Spread bps" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PD TERM STRUCTURE — SAMPLE ENTITIES (6)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','1yr PD','3yr PD','5yr PD','7yr PD','10yr PD','Hazard Rate λ'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{entityTermEx.map((e,i)=>{
                const ent=ENTITIES[i];
                return(
                  <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <td style={{...tdS,fontWeight:600}}>{ent.name}</td>
                    {tenors.map(t=><td key={t} style={{...tdS,fontFamily:T.mono,color:e[t+'yr']>5?T.red:e[t+'yr']>2?T.amber:T.green}}>{e[t+'yr']}%</td>)}
                    <td style={{...tdS,fontFamily:T.mono}}>{(ent.lambda1*10000).toFixed(1)} bps</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab 8: Calibration & Validation ── */
  const renderCalibration=()=>{
    // Brier score = mean((PD_pred - actual)^2), simulated actuals
    const actuals=ENTITIES.map((e,i)=>({...e,actual:sr(i*71+1)<e.pdConsensus?1:0}));
    const brierA=+(actuals.reduce((s,e)=>(s+(e.pdA-e.actual)**2),0)/actuals.length).toFixed(5);
    const brierB=+(actuals.reduce((s,e)=>(s+(e.pdB-e.actual)**2),0)/actuals.length).toFixed(5);
    const brierC=+(actuals.reduce((s,e)=>(s+(e.pdC-e.actual)**2),0)/actuals.length).toFixed(5);
    const brierD=+(actuals.reduce((s,e)=>(s+(e.pdD-e.actual)**2),0)/actuals.length).toFixed(5);
    // Gini ≈ 2×AUC − 1, simulated via rank correlation
    const giniData=[{branch:'Branch A',brier:brierA,gini:+(0.55+sr(1)*0.25).toFixed(3),ks:+(0.28+sr(2)*0.18).toFixed(3)},
      {branch:'Branch B',brier:brierB,gini:+(0.60+sr(3)*0.20).toFixed(3),ks:+(0.32+sr(4)*0.15).toFixed(3)},
      {branch:'Branch C',brier:brierC,gini:+(0.52+sr(5)*0.22).toFixed(3),ks:+(0.26+sr(6)*0.16).toFixed(3)},
      {branch:'Branch D',brier:brierD,gini:+(0.58+sr(7)*0.21).toFixed(3),ks:+(0.30+sr(8)*0.16).toFixed(3)},
      {branch:'Consensus',brier:+((brierA+brierB+brierC+brierD)/4).toFixed(5),gini:+(0.62+sr(9)*0.18).toFixed(3),ks:+(0.33+sr(10)*0.14).toFixed(3)},
    ];
    // Hosmer-Lemeshow: bucket PDs, compute O/E
    const buckets=[0.01,0.02,0.05,0.10,0.20];
    const hlData=buckets.slice(0,-1).map((lo,i)=>{
      const hi=buckets[i+1];
      const grp=actuals.filter(e=>e.pdConsensus>=lo&&e.pdConsensus<hi);
      const obs=grp.reduce((s,e)=>s+e.actual,0);
      const exp=grp.reduce((s,e)=>s+e.pdConsensus,0);
      return{bucket:`${(lo*100).toFixed(0)}-${(hi*100).toFixed(0)}%`,n:grp.length,observed:obs,expected:+exp.toFixed(2),ratio:grp.length?(obs/Math.max(0.001,exp)).toFixed(2):'-'};
    });
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Best Brier Score',Math.min(brierA,brierB,brierC,brierD).toFixed(5),'Lower = better calibration',T.green)}
          {kpiBox('Best Gini',Math.max(...giniData.map(g=>g.gini)).toFixed(3),'Higher = better discrimination','#2563eb')}
          {kpiBox('Consensus Brier',giniData[4].brier,'Blended model','#7c3aed')}
          {kpiBox('Consensus Gini',giniData[4].gini,'Blended model','#7c3aed')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>BRIER SCORE BY BRANCH (lower = better)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={giniData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="branch" tick={{fontSize:10,fontFamily:T.mono}} angle={-10} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10}} domain={[0,0.1]}/>
                <Tooltip {...tip}/>
                <Bar dataKey="brier" fill={'#2563eb'} name="Brier Score" radius={[3,3,0,0]}>
                  {giniData.map((_,i)=><Cell key={i} fill={['#2563eb',T.teal,T.amber,'#7c3aed',T.navy][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>GINI & KS STATISTIC BY BRANCH</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={giniData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="branch" tick={{fontSize:10,fontFamily:T.mono}} angle={-10} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10}} domain={[0,1]}/>
                <Tooltip {...tip}/>
                <Bar dataKey="gini" fill={T.green} name="Gini Coefficient" radius={[2,2,0,0]}/>
                <Bar dataKey="ks" fill={T.red} name="KS Statistic" radius={[2,2,0,0]}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>HOSMER-LEMESHOW TEST — PD BUCKET O/E RATIO (CONSENSUS MODEL)</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['PD Bucket','N Entities','Observed Defaults','Expected Defaults','O/E Ratio','Calibrated?'].map(h=><th key={h} style={thS}>{h}</th>)}
            </tr></thead>
            <tbody>{hlData.map((r,i)=>{
              const ratio=parseFloat(r.ratio);
              const ok=!isNaN(ratio)&&ratio>=0.7&&ratio<=1.3;
              return(
                <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontFamily:T.mono}}>{r.bucket}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{r.n}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{r.observed}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{r.expected}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:isNaN(ratio)?T.textMut:ok?T.green:T.red,fontWeight:700}}>{r.ratio}</td>
                  <td style={tdS}>{r.n<3?pill('Insufficient Data',T.slate):ok?pill('YES',T.green):pill('RECALIBRATE',T.red)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Tab 9: Sector & Region Heatmap ── */
  const renderHeatmap=()=>{
    const matrix=SECTORS.map(s=>({
      sector:s,
      ...Object.fromEntries(REGIONS.map(r=>{
        const es=ENTITIES.filter(e=>e.sector===s&&e.region===r);
        const avgPD=es.length?(es.reduce((a,e)=>a+e.pdConsensus,0)/es.length*100):null;
        return[r,avgPD!==null?+avgPD.toFixed(3):null];
      }))
    }));
    // HHI concentration
    const sectorCounts=SECTORS.map(s=>ENTITIES.filter(e=>e.sector===s).length);
    const hhi=+(sectorCounts.reduce((s,n)=>s+(n/ENTITIES.length)**2,0)*10000).toFixed(0);
    // Tail risk sectors
    const tailRisk=[...SECTORS].sort((a,b)=>{
      const aEs=ENTITIES.filter(e=>e.sector===a);
      const bEs=ENTITIES.filter(e=>e.sector===b);
      const aP=aEs.length?(aEs.reduce((s,e)=>s+e.pdConsensus,0)/aEs.length):0;
      const bP=bEs.length?(bEs.reduce((s,e)=>s+e.pdConsensus,0)/bEs.length):0;
      return bP-aP;
    }).slice(0,5);
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('HHI Concentration',hhi,'Portfolio sector HHI')}
          {kpiBox('Sectors',SECTORS.length,'GICS-aligned')}
          {kpiBox('Regions',REGIONS.length,'Geographic coverage')}
          {kpiBox('Top Risk Sector',tailRisk[0].slice(0,8),'Highest avg PD',T.red)}
        </div>
        <div style={{...cS,marginBottom:20}}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PD HEATMAP — SECTOR × REGION (%) — CONSENSUS MODEL</div>
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',fontSize:11,fontFamily:T.mono}}>
              <thead><tr>
                <th style={{padding:'6px 10px',background:T.surfaceH,color:T.textMut,textAlign:'left'}}>Sector</th>
                {REGIONS.map(r=><th key={r} style={{padding:'6px 10px',background:T.surfaceH,color:T.textSec,whiteSpace:'nowrap'}}>{r.split(' ')[0]}</th>)}
                <th style={{padding:'6px 10px',background:T.surfaceH,color:T.textSec}}>Avg</th>
              </tr></thead>
              <tbody>{matrix.map((row,i)=>{
                const vals=REGIONS.map(r=>row[r]).filter(v=>v!==null);
                const rowAvg=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(3):null;
                return(
                  <tr key={i}>
                    <td style={{padding:'6px 10px',fontWeight:700,color:T.navy,background:T.surfaceH,whiteSpace:'nowrap'}}>{row.sector.slice(0,10)}</td>
                    {REGIONS.map(r=>{
                      const v=row[r];
                      const heat=v!==null?v/15:0;
                      const bg=v===null?T.surfaceH:`rgba(220,38,38,${Math.min(0.8,heat*0.7)})`;
                      return<td key={r} style={{padding:'6px 10px',background:bg,color:v>7?'#fff':T.text,textAlign:'center'}}>{v===null?'—':v+'%'}</td>;
                    })}
                    <td style={{padding:'6px 10px',background:T.surfaceH,fontWeight:700,color:rowAvg>5?T.red:rowAvg>2?T.amber:T.green,textAlign:'center'}}>{rowAvg!==null?rowAvg+'%':'—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>TOP-5 TAIL RISK SECTORS (AVG PD)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tailRisk.map(s=>{const es=ENTITIES.filter(e=>e.sector===s);const avgPD=+(es.reduce((a,e)=>a+e.pdConsensus,0)/Math.max(1,es.length)*100).toFixed(3);return{sector:s.slice(0,6),avgPD};})} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
                <YAxis type="category" dataKey="sector" tick={{fontSize:10,fontFamily:T.mono}} width={55}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="avgPD" fill={T.red} name="Avg PD %" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>ENTITY COUNT BY SECTOR</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SECTORS.map(s=>({sector:s.slice(0,6),count:ENTITIES.filter(e=>e.sector===s).length}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                <Tooltip {...tip}/>
                <Bar dataKey="count" fill={T.navy} name="Count" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* ── Page shell ── */
  const renders=[
    renderOverview,renderBranchA,renderBranchB,renderBranchC,renderBranchD,
    renderConsensus,renderIFRS9,renderTermStructure,renderCalibration,renderHeatmap
  ];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
          <div style={{fontSize:22,fontWeight:800,color:T.navy}}>DME PD Engine — 4-Branch</div>
          {pill('EP-BE2',T.navy)}{pill('DME','#7c3aed')}{pill('IFRS 9',T.teal)}
        </div>
        <div style={{fontSize:12,color:T.slate,fontFamily:T.mono}}>
          Branch A Exponential · B Merton DD · C Sector Logit · D Monte Carlo · IFRS 9 ECL · Term Structure · Calibration
        </div>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.gold}`,flexWrap:'wrap'}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'8px 12px',background:tab===i?T.navy:'transparent',
            color:tab===i?'#fff':T.slate,border:'none',cursor:'pointer',
            fontSize:11,fontFamily:T.font,fontWeight:tab===i?700:400,
            borderBottom:tab===i?`2px solid ${T.gold}`:'none',
            marginBottom:tab===i?-2:0,whiteSpace:'nowrap',transition:'all 0.15s'
          }}>{t}</button>
        ))}
      </div>
      {renders[tab]&&renders[tab]()}
    </div>
  );
}
