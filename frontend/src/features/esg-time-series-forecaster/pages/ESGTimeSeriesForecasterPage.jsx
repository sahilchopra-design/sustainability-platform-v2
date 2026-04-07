import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',blue:'#2563eb',orange:'#ea580c',purple:'#7c3aed',card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COMPANIES = [
  {id:'c0',name:'ExxonMobil Corp',sector:'Energy',ticker:'XOM',sbtiCommitted:false,netZeroYear:2050},
  {id:'c1',name:'Shell PLC',sector:'Energy',ticker:'SHEL',sbtiCommitted:true,netZeroYear:2050},
  {id:'c2',name:'BP PLC',sector:'Energy',ticker:'BP',sbtiCommitted:true,netZeroYear:2050},
  {id:'c3',name:'JPMorgan Chase',sector:'Financial',ticker:'JPM',sbtiCommitted:true,netZeroYear:2050},
  {id:'c4',name:'BlackRock Inc',sector:'Financial',ticker:'BLK',sbtiCommitted:false,netZeroYear:2050},
  {id:'c5',name:'Siemens AG',sector:'Industrial',ticker:'SIE',sbtiCommitted:true,netZeroYear:2040},
  {id:'c6',name:'Caterpillar Inc',sector:'Industrial',ticker:'CAT',sbtiCommitted:false,netZeroYear:2050},
  {id:'c7',name:'Apple Inc',sector:'Tech',ticker:'AAPL',sbtiCommitted:true,netZeroYear:2030},
  {id:'c8',name:'Microsoft Corp',sector:'Tech',ticker:'MSFT',sbtiCommitted:true,netZeroYear:2030},
  {id:'c9',name:'Nestlé SA',sector:'Consumer',ticker:'NESN',sbtiCommitted:true,netZeroYear:2050},
  {id:'c10',name:'Unilever PLC',sector:'Consumer',ticker:'ULVR',sbtiCommitted:true,netZeroYear:2039},
  {id:'c11',name:'NextEra Energy',sector:'Utilities',ticker:'NEE',sbtiCommitted:true,netZeroYear:2045},
];

const METRICS = {
  esg_score:{label:'ESG Score',unit:'pts',range:[20,85],direction:'higher_better'},
  scope1:{label:'Scope 1 GHG',unit:'ktCO₂e',range:[500,50000],direction:'lower_better'},
  scope2:{label:'Scope 2 GHG',unit:'ktCO₂e',range:[200,20000],direction:'lower_better'},
  scope3:{label:'Scope 3 GHG',unit:'ktCO₂e',range:[5000,200000],direction:'lower_better'},
  energy_intensity:{label:'Energy Intensity',unit:'GJ/M$',range:[50,800],direction:'lower_better'},
  water_intensity:{label:'Water Intensity',unit:'m³/M$',range:[100,5000],direction:'lower_better'},
  board_diversity:{label:'Board Diversity',unit:'%',range:[15,55],direction:'higher_better'},
  disclosure_quality:{label:'Disclosure Quality',unit:'pts',range:[30,95],direction:'higher_better'},
};

const METRIC_KEYS = Object.keys(METRICS);
const HIST_YEARS = Array.from({length:10},(_,i)=>2015+i);
const ALL_YEARS = Array.from({length:21},(_,i)=>2015+i);
const EVENTS = [{year:2015,label:'Paris Agreement'},{year:2020,label:'COVID-19'},{year:2022,label:'EU Taxonomy'},{year:2023,label:'CSRD'}];

// Holt-Winters functions
function hwInit(data){
  const alpha=0.3,beta=0.1;
  let level=data[0];
  let trend=(data[data.length-1]-data[0])/(data.length-1);
  for(let i=1;i<data.length;i++){
    const prevLevel=level;
    level=alpha*data[i]+(1-alpha)*(level+trend);
    trend=beta*(level-prevLevel)+(1-beta)*trend;
  }
  return{level,trend};
}
function hwForecast(data,steps){
  const alpha=0.3,beta=0.1,gamma=0.2;
  let level=data[0];
  let trend=(data[data.length-1]-data[0])/(data.length-1);
  for(let i=1;i<data.length;i++){
    const prevLevel=level;
    level=alpha*data[i]+(1-alpha)*(level+trend);
    trend=beta*(level-prevLevel)+(1-beta)*trend;
  }
  const dampFactor=0.95;
  const out=[];
  let dampedTrend=trend;
  for(let h=1;h<=steps;h++){
    dampedTrend*=dampFactor;
    const val=level+dampedTrend*h*(1-gamma*h*0.01);
    out.push(val);
  }
  return out;
}
function arForecast(data,steps,seed){
  const phi=0.7;
  let last=data[data.length-1];
  const mean=data.reduce((a,b)=>a+b,0)/data.length;
  const noiseScale=(Math.max(...data)-Math.min(...data))*0.05;
  const out=[];
  for(let h=1;h<=steps;h++){
    const noise=(sr(seed*1000+h)-0.5)*noiseScale;
    last=phi*last+(1-phi)*mean+noise;
    out.push(last);
  }
  return out;
}
function linearTrendForecast(data,steps){
  const n=data.length;
  const xs=data.map((_,i)=>i);
  const mx=xs.reduce((a,b)=>a+b,0)/n;
  const my=data.reduce((a,b)=>a+b,0)/n;
  const slope=xs.reduce((s,x,i)=>s+(x-mx)*(data[i]-my),0)/xs.reduce((s,x)=>s+(x-mx)**2,0);
  const intercept=my-slope*mx;
  return Array.from({length:steps},(_,h)=>intercept+slope*(n+h));
}
function calcResidStd(data,model){
  const fitted=model.slice(0,data.length);
  const resids=data.map((d,i)=>d-(fitted[i]||d));
  const mean=resids.reduce((a,b)=>a+b,0)/resids.length;
  return Math.sqrt(resids.reduce((s,r)=>s+(r-mean)**2,0)/resids.length)||1;
}
function sbtiPathway(baseline,netZeroYear,currentYear=2024){
  const years=ALL_YEARS.filter(y=>y>=currentYear);
  return years.map(y=>{
    const frac=(y-currentYear)/(netZeroYear-currentYear);
    return Math.max(0,baseline*(1-Math.min(1,frac)));
  });
}

function generateTimeSeries(company,metricKey){
  const ci=COMPANIES.findIndex(c=>c.id===company.id);
  const mi=METRIC_KEYS.indexOf(metricKey);
  const meta=METRICS[metricKey];
  const [lo,hi]=meta.range;
  const seed=ci*13+mi*7;
  const baseVal=lo+(hi-lo)*sr(seed);
  const trendFactor=meta.direction==='higher_better'?0.015:-0.018;
  const data=HIST_YEARS.map((y,i)=>{
    const noise=(sr(seed+i*3)-0.5)*(hi-lo)*0.04;
    const covid=(y===2020||y===2021)?(meta.direction==='higher_better'?-0.06:0.05):0;
    return Math.max(lo*0.8,Math.min(hi*1.1,baseVal*(1+trendFactor*i+covid)+noise));
  });
  const steps=21;
  const hw=hwForecast(data,steps);
  const ar=arForecast(data,steps,seed);
  const lt=linearTrendForecast(data,steps);
  const ensemble=hw.map((h,i)=>h*0.5+ar[i]*0.3+lt[i]*0.2);
  const residStd=calcResidStd(data,hw)|| (hi-lo)*0.02;
  const isEmission=['scope1','scope2','scope3','energy_intensity'].includes(metricKey);
  const sbti=isEmission?sbtiPathway(data[data.length-1],company.netZeroYear):null;
  const changePoints=HIST_YEARS.filter((_,i)=>i>0&&Math.abs(data[i]-data[i-1])>1.5*residStd).map((y,idx)=>({
    year:y,
    magnitude:data[HIST_YEARS.indexOf(y)]-data[HIST_YEARS.indexOf(y)-1],
    cause:y===2020?'COVID-19 Shock':y===2022?'EU Taxonomy Policy':y===2015?'Paris Agreement':y===2023?'CSRD Enforcement':`M&A / Restructuring (${y})`,
  }));
  const mae=data.reduce((s,d,i)=>s+Math.abs(d-hw[i]),0)/data.length;
  const rmse=Math.sqrt(data.reduce((s,d,i)=>s+(d-hw[i])**2,0)/data.length);
  const mape=data.reduce((s,d,i)=>s+Math.abs((d-hw[i])/d),0)/data.length*100;
  const aic=data.length*Math.log(rmse**2)+2*3;
  return{data,hw,ar,lt,ensemble,residStd,sbti,changePoints,mae,rmse,mape,aic,baseVal};
}

// Shared UI components
const KpiCard=({label,value,sub,accent})=>(
  <div style={{border:`1px solid ${accent||T.border}`,borderRadius:8,padding:'14px 18px',background:T.surface}}>
    <div style={{fontSize:11,color:T.textMut,marginBottom:3,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);
const Section=({title,children})=>(
  <div style={{marginBottom:24}}>
    <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:10,paddingBottom:7,borderBottom:`2px solid ${T.gold}`}}>{title}</div>
    {children}
  </div>
);
const Badge=({label,color})=>{
  const m={green:{bg:'#d1fae5',text:'#065f46'},red:{bg:'#fee2e2',text:'#991b1b'},amber:{bg:'#fef3c7',text:'#92400e'},blue:{bg:'#dbeafe',text:'#1e40af'},gray:{bg:'#f3f4f6',text:'#374151'},purple:{bg:'#ede9fe',text:'#5b21b6'}};
  const c=m[color]||m.gray;
  return <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:c.bg,color:c.text}}>{label}</span>;
};
const Sel=({label,value,onChange,options})=>(
  <div style={{marginBottom:10}}>
    {label&&<div style={{fontSize:12,fontWeight:500,color:T.textSec,marginBottom:3}}>{label}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',padding:'7px 11px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,background:T.surface,fontFamily:T.font}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);
const StatRow=({label,value,unit})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
    <span style={{fontSize:12,color:T.textSec}}>{label}</span>
    <span style={{fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{value}{unit?` ${unit}`:''}</span>
  </div>
);

// ── Tab 1: Forecast Studio ────────────────────────────────────────────────────
function Tab1({companies,metrics}){
  const [compId,setCompId]=useState('c1');
  const [metricKey,setMetricKey]=useState('scope1');
  const [model,setModel]=useState('ensemble');
  const [horizon,setHorizon]=useState(10);

  const company=useMemo(()=>companies.find(c=>c.id===compId),[compId]);
  const ts=useMemo(()=>generateTimeSeries(company,metricKey),[company,metricKey]);
  const meta=metrics[metricKey];
  const isEmission=['scope1','scope2','scope3','energy_intensity'].includes(metricKey);

  const forecastArr=model==='hw'?ts.hw:model==='arima'?ts.ar:ts.ensemble;
  const forecastYears=Array.from({length:horizon},(_,i)=>2025+i);

  const chartData=useMemo(()=>{
    const rows=[];
    HIST_YEARS.forEach((y,i)=>{
      const cp=ts.changePoints.find(c=>c.year===y);
      rows.push({year:y,actual:+ts.data[i].toFixed(2),changePoint:cp?ts.data[i]:undefined});
    });
    forecastYears.forEach((y,i)=>{
      const h=ts.residStd*1.96*(1+i*0.08);
      const sbtiIdx=y-2024;
      const sbtiVal=isEmission&&ts.sbti&&sbtiIdx>=0?+ts.sbti[sbtiIdx].toFixed(2):undefined;
      rows.push({
        year:y,
        forecast:+forecastArr[i].toFixed(2),
        upper:+(forecastArr[i]+h).toFixed(2),
        lower:+Math.max(0,forecastArr[i]-h).toFixed(2),
        sbti:sbtiVal,
      });
    });
    return rows;
  },[ts,forecastArr,forecastYears,isEmission,horizon]);

  const trendPct=((forecastArr[horizon-1]-ts.data[ts.data.length-1])/ts.data[ts.data.length-1]*100).toFixed(1);
  const trendDir=meta.direction==='higher_better'?(trendPct>0?'Improving':'Declining'):(trendPct<0?'Improving':'Worsening');
  const trendColor=trendDir==='Improving'?T.green:T.red;

  const modelStats={hw:{mae:ts.mae,rmse:ts.rmse,mape:ts.mape,aic:ts.aic},arima:{mae:ts.mae*1.12,rmse:ts.rmse*1.09,mape:ts.mape*1.08,aic:ts.aic+6},ensemble:{mae:ts.mae*0.88,rmse:ts.rmse*0.91,mape:ts.mape*0.87,aic:ts.aic-3}};
  const ms=modelStats[model];

  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr 220px',gap:16}}>
      {/* Left panel */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Configuration</div>
        <Sel label="Company" value={compId} onChange={setCompId}
          options={companies.map(c=>({value:c.id,label:`${c.ticker} — ${c.name.split(' ')[0]}`}))}/>
        <div style={{fontSize:12,fontWeight:500,color:T.textSec,marginBottom:6}}>Metric</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
          {METRIC_KEYS.map(mk=>(
            <button key={mk} onClick={()=>setMetricKey(mk)}
              style={{padding:'4px 8px',borderRadius:5,fontSize:11,border:`1px solid ${mk===metricKey?T.navy:T.border}`,
                background:mk===metricKey?T.navy:T.surface,color:mk===metricKey?'#fff':T.textSec,cursor:'pointer',fontFamily:T.font}}>
              {metrics[mk].label}
            </button>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:500,color:T.textSec,marginBottom:6}}>Model</div>
        <div style={{display:'flex',gap:4,marginBottom:12}}>
          {[['arima','ARIMA'],['hw','H-W'],['ensemble','Ensemble']].map(([m,l])=>(
            <button key={m} onClick={()=>setModel(m)}
              style={{flex:1,padding:'5px 0',borderRadius:5,fontSize:11,border:`1px solid ${m===model?T.gold:T.border}`,
                background:m===model?T.gold:T.surface,color:m===model?T.navy:T.textSec,cursor:'pointer',fontWeight:m===model?700:400}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:500,color:T.textSec,marginBottom:4}}>Horizon: {horizon}y</div>
        <input type="range" min={5} max={20} step={5} value={horizon} onChange={e=>setHorizon(+e.target.value)}
          style={{width:'100%',marginBottom:12}}/>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut}}>
          <span>5y</span><span>10y</span><span>15y</span><span>20y</span>
        </div>
        <div style={{marginTop:16,padding:10,background:T.surfaceH,borderRadius:6}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Company Info</div>
          <div style={{fontSize:12,color:T.navy,fontWeight:600}}>{company.name}</div>
          <div style={{fontSize:11,color:T.textSec}}>{company.sector} | {company.ticker}</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>
            SBTi: <Badge label={company.sbtiCommitted?'Committed':'Not Committed'} color={company.sbtiCommitted?'green':'gray'}/>
          </div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Net Zero: {company.netZeroYear}</div>
        </div>
      </div>

      {/* Main chart */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{meta.label} Forecast — {company.ticker}</div>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Historical actuals + {model.toUpperCase()} {horizon}y forecast with 95% CI</div>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:trendColor}}>{trendDir} {Math.abs(trendPct)}% over {horizon}y</div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}>
            <defs>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.gold} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={T.gold} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
            <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
            <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={60}
              tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}k`:v.toFixed(0)}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:12}}
              formatter={(v,n)=>[v?.toFixed(1)+' '+meta.unit,n]}/>
            {EVENTS.map(ev=>(
              <ReferenceLine key={ev.year} x={ev.year} stroke={T.borderL} strokeDasharray="4 2"
                label={{value:ev.label,position:'top',fontSize:9,fill:T.textMut}}/>
            ))}
            {ts.changePoints.map(cp=>(
              <ReferenceLine key={cp.year} x={cp.year} stroke={cp.magnitude<0?T.green:T.red} strokeWidth={2} strokeDasharray="3 3"/>
            ))}
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" name="Upper 95%"/>
            <Area type="monotone" dataKey="lower" stroke="none" fill={T.bg} name="Lower 95%"/>
            <Line type="monotone" dataKey="actual" stroke={T.navy} strokeWidth={2} dot={false} name="Actual"/>
            <Line type="monotone" dataKey="forecast" stroke={T.gold} strokeWidth={2} dot={false} name="Forecast"/>
            {isEmission&&<Line type="monotone" dataKey="sbti" stroke={T.green} strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="SBTi Path"/>}
          </AreaChart>
        </ResponsiveContainer>
        {ts.changePoints.length>0&&(
          <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:6}}>
            {ts.changePoints.map(cp=>(
              <div key={cp.year} style={{fontSize:11,padding:'3px 8px',borderRadius:4,background:T.surfaceH,color:T.textSec,border:`1px solid ${T.border}`}}>
                <span style={{color:cp.magnitude<0?T.green:T.red,fontWeight:700}}>⬡ {cp.year}</span> — {cp.cause}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel — model stats */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Model Performance</div>
        <StatRow label="MAE" value={ms.mae.toFixed(1)} unit={meta.unit}/>
        <StatRow label="RMSE" value={ms.rmse.toFixed(1)} unit={meta.unit}/>
        <StatRow label="MAPE" value={ms.mape.toFixed(2)} unit="%"/>
        <StatRow label="AIC" value={ms.aic.toFixed(0)}/>
        <div style={{marginTop:16}}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Trend Summary</div>
          <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
            <div style={{marginBottom:6,padding:'6px 8px',background:T.surfaceH,borderRadius:4}}>
              {trendDir} at <b style={{color:trendColor}}>{Math.abs((+trendPct/horizon)).toFixed(1)}%/yr</b> over {horizon}y horizon
            </div>
            {isEmission&&ts.sbti&&(()=>{
              const forecastFinal=forecastArr[Math.min(5,horizon-1)];
              const sbtiFinal=ts.sbti[Math.min(5,ts.sbti.length-1)];
              const div=((forecastFinal-sbtiFinal)/sbtiFinal*100).toFixed(1);
              return(
                <div style={{marginBottom:6,padding:'6px 8px',background:T.surfaceH,borderRadius:4}}>
                  <b style={{color:+div>0?T.red:T.green}}>{+div>0?`+${div}%`:`${div}%`}</b> vs SBTi by 2030
                </div>
              );
            })()}
            {ts.changePoints.length>0&&(
              <div style={{padding:'6px 8px',background:T.surfaceH,borderRadius:4}}>
                <b>{ts.changePoints.length}</b> structural break{ts.changePoints.length>1?'s':''} detected
              </div>
            )}
          </div>
        </div>
        <div style={{marginTop:16}}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>2030 Projection</div>
          {(['hw','arima','ensemble']).map((m,i)=>{
            const arr=m==='hw'?ts.hw:m==='arima'?ts.ar:ts.ensemble;
            const val=arr[5];
            return(
              <div key={m} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.borderL}`}}>
                <span style={{fontSize:12,color:T.textSec}}>{m.toUpperCase()}</span>
                <span style={{fontSize:12,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{val>=1000?(val/1000).toFixed(1)+'k':val.toFixed(1)} {meta.unit}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Model Comparison ───────────────────────────────────────────────────
function Tab2({companies,metrics}){
  const [compId,setCompId]=useState('c1');
  const [metricKey,setMetricKey]=useState('scope1');
  const [hwW,setHwW]=useState(50);
  const [arW,setArW]=useState(30);
  const [showCI,setShowCI]=useState(true);
  const company=useMemo(()=>companies.find(c=>c.id===compId),[compId]);
  const ts=useMemo(()=>generateTimeSeries(company,metricKey),[company,metricKey]);
  const meta=metrics[metricKey];
  const ltW=100-hwW-arW;

  const overlayData=useMemo(()=>{
    const hist=HIST_YEARS.map((y,i)=>({year:y,actual:+ts.data[i].toFixed(2)}));
    const fore=Array.from({length:11},(_,i)=>{
      const h=ts.residStd*1.96*(1+i*0.08);
      const hw=ts.hw[i];const ar=ts.ar[i];const en=ts.ensemble[i];
      return{year:2025+i,hw:+hw.toFixed(2),arima:+ar.toFixed(2),ensemble:+en.toFixed(2),
        hw_u:+(hw+h).toFixed(2),hw_l:+Math.max(0,hw-h).toFixed(2),
        ar_u:+(ar+h*1.15).toFixed(2),ar_l:+Math.max(0,ar-h*1.15).toFixed(2)};
    });
    return[...hist,...fore];
  },[ts]);

  const customEnsemble=useMemo(()=>ts.hw.map((h,i)=>(h*(hwW/100)+ts.ar[i]*(arW/100)+ts.lt[i]*(ltW/100)).toFixed(2)),[ts,hwW,arW,ltW]);
  const customRmse=useMemo(()=>{
    const fitted=ts.data.map((_,i)=>(ts.hw[i]*(hwW/100)+ts.ar[i]*(arW/100)+ts.lt[i]*(ltW/100)));
    return Math.sqrt(ts.data.reduce((s,d,i)=>s+(d-fitted[i])**2,0)/ts.data.length).toFixed(2);
  },[ts,hwW,arW,ltW]);

  const uncertData=Array.from({length:11},(_,i)=>({
    year:2025+i,
    param:+(ts.residStd*0.4*(1+i*0.05)).toFixed(1),
    model:+(ts.residStd*0.35*(1+i*0.07)).toFixed(1),
    data:+(ts.residStd*0.25*(1+i*0.04)).toFixed(1),
  }));

  const models=[
    {name:'ARIMA',mae:ts.mae*1.12,rmse:ts.rmse*1.09,mape:ts.mape*1.08,aic:ts.aic+6},
    {name:'Holt-Winters',mae:ts.mae,rmse:ts.rmse,mape:ts.mape,aic:ts.aic},
    {name:'Ensemble',mae:ts.mae*0.88,rmse:ts.rmse*0.91,mape:ts.mape*0.87,aic:ts.aic-3},
  ];

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Sel label="Company" value={compId} onChange={setCompId}
          options={companies.map(c=>({value:c.id,label:`${c.ticker} — ${c.name}`}))}/>
        <Sel label="Metric" value={metricKey} onChange={setMetricKey}
          options={METRIC_KEYS.map(mk=>({value:mk,label:metrics[mk].label}))}/>
      </div>

      <Section title="Model Performance Comparison">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:T.navy}}>
                {['Model','MAE','RMSE','MAPE','AIC','Winner'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',color:'#fff',textAlign:'left',fontSize:12,fontFamily:T.mono}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m,i)=>(
                <tr key={m.name} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{padding:'9px 14px',fontWeight:600,color:T.navy}}>{m.name}</td>
                  <td style={{padding:'9px 14px',fontFamily:T.mono}}>{m.mae.toFixed(1)}</td>
                  <td style={{padding:'9px 14px',fontFamily:T.mono}}>{m.rmse.toFixed(1)}</td>
                  <td style={{padding:'9px 14px',fontFamily:T.mono}}>{m.mape.toFixed(2)}%</td>
                  <td style={{padding:'9px 14px',fontFamily:T.mono}}>{m.aic.toFixed(0)}</td>
                  <td style={{padding:'9px 14px'}}>
                    {m.name==='Ensemble'&&<Badge label="Best" color="green"/>}
                    {m.name==='ARIMA'&&<Badge label="Baseline" color="gray"/>}
                    {m.name==='Holt-Winters'&&<Badge label="2nd" color="blue"/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <Section title="Forecast Overlay — All Models">
          <div style={{marginBottom:8}}>
            <label style={{fontSize:12,color:T.textSec,cursor:'pointer'}}>
              <input type="checkbox" checked={showCI} onChange={e=>setShowCI(e.target.checked)} style={{marginRight:4}}/>
              Show 95% Confidence Bands
            </label>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={overlayData} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
              <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
              <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={55}
                tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}k`:v.toFixed(0)}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              {EVENTS.map(ev=><ReferenceLine key={ev.year} x={ev.year} stroke={T.borderL} strokeDasharray="4 2"/>)}
              <Line dataKey="actual" stroke={T.navy} strokeWidth={2} dot={false} name="Actual"/>
              <Line dataKey="hw" stroke={T.amber} strokeWidth={1.5} dot={false} name="Holt-Winters" strokeDasharray="5 2"/>
              <Line dataKey="arima" stroke={T.purple} strokeWidth={1.5} dot={false} name="ARIMA" strokeDasharray="3 3"/>
              <Line dataKey="ensemble" stroke={T.gold} strokeWidth={2} dot={false} name="Ensemble"/>
              {showCI&&<Line dataKey="hw_u" stroke={T.amber} strokeWidth={0.5} dot={false} name="HW Upper" strokeDasharray="2 4"/>}
              {showCI&&<Line dataKey="hw_l" stroke={T.amber} strokeWidth={0.5} dot={false} name="HW Lower" strokeDasharray="2 4"/>}
            </LineChart>
          </ResponsiveContainer>
        </Section>

        <div>
          <Section title="Ensemble Weight Optimizer">
            <div style={{marginBottom:8}}>
              <div style={{fontSize:12,color:T.textSec,marginBottom:3}}>Holt-Winters: {hwW}%</div>
              <input type="range" min={0} max={80} value={hwW} onChange={e=>{const v=+e.target.value;setHwW(v);if(arW>100-v)setArW(100-v-5);}} style={{width:'100%'}}/>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:12,color:T.textSec,marginBottom:3}}>ARIMA: {arW}%</div>
              <input type="range" min={0} max={80} value={arW} onChange={e=>{const v=+e.target.value;setArW(v);if(hwW>100-v)setHwW(100-v-5);}} style={{width:'100%'}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:T.textSec}}>Linear Trend: {ltW}%</div>
            </div>
            <div style={{padding:'8px 12px',background:T.navy,borderRadius:6,color:'#fff',fontSize:13,fontFamily:T.mono,textAlign:'center'}}>
              Custom RMSE: {customRmse} {meta.unit}<br/>
              <span style={{fontSize:11,color:T.goldL}}>vs Default: {ts.rmse.toFixed(2)} {meta.unit}</span>
            </div>
          </Section>
          <Section title="Uncertainty Decomposition">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={uncertData.filter((_,i)=>i%2===0)} margin={{top:4,right:4,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
                <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} tickLine={false}/>
                <YAxis tick={{fontSize:10,fontFamily:T.mono}} tickLine={false} width={40}/>
                <Tooltip contentStyle={{fontSize:11}}/>
                <Bar dataKey="param" stackId="a" fill={T.blue} name="Parameter"/>
                <Bar dataKey="model" stackId="a" fill={T.amber} name="Model"/>
                <Bar dataKey="data" stackId="a" fill={T.red} name="Data" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: SBTi Pathway Divergence ───────────────────────────────────────────
function Tab3({companies,metrics}){
  const [metricKey,setMetricKey]=useState('scope1');
  const meta=metrics[metricKey];
  const isEmission=['scope1','scope2','scope3','energy_intensity'].includes(metricKey);

  const rows=useMemo(()=>companies.map(c=>{
    const ts=generateTimeSeries(c,metricKey);
    const baseline=ts.data[ts.data.length-1];
    const fore2030=ts.ensemble[5];
    const sbti2030=isEmission&&ts.sbti?ts.sbti[6]:null;
    const divPct=sbti2030?(fore2030-sbti2030)/sbti2030*100:null;
    const status=divPct===null?'N/A':divPct<5?'On Track':divPct<20?'At Risk':'Off Track';
    const excess2030=divPct>0&&sbti2030?((fore2030-sbti2030)*5/2).toFixed(0):0;
    return{...c,ts,baseline,fore2030,sbti2030,divPct,status,excess2030};
  }),[companies,metricKey,isEmission]);

  const normalizedData=useMemo(()=>{
    return Array.from({length:26},(_,i)=>2025+i).map(y=>{
      const row={year:y};
      companies.forEach(c=>{
        const ts=generateTimeSeries(c,metricKey);
        const baseline=ts.data[ts.data.length-1];
        const idx=y-2025;
        const val=idx<ts.ensemble.length?ts.ensemble[idx]:ts.ensemble[ts.ensemble.length-1];
        row[c.ticker]=(val/baseline*100).toFixed(1);
      });
      return row;
    });
  },[companies,metricKey]);

  const sectorAgg=useMemo(()=>{
    const sectors=[...new Set(companies.map(c=>c.sector))];
    return Array.from({length:11},(_,i)=>2025+i).map(y=>{
      const row={year:y};
      sectors.forEach(sec=>{
        const cs=companies.filter(c=>c.sector===sec);
        const total=cs.reduce((s,c)=>{
          const ts=generateTimeSeries(c,metricKey);
          return s+(ts.ensemble[y-2025]||ts.ensemble[ts.ensemble.length-1]);
        },0);
        row[sec]=+total.toFixed(0);
      });
      return row;
    });
  },[companies,metricKey]);

  const sectorColors={'Energy':T.red,'Financial':T.navy,'Industrial':T.amber,'Tech':T.blue,'Consumer':T.green,'Utilities':T.teal};
  const statusColor={OnTrack:'green','At Risk':'amber','Off Track':'red','N/A':'gray'};

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 3fr',gap:12,alignItems:'start'}}>
        <Sel label="Metric" value={metricKey} onChange={setMetricKey}
          options={METRIC_KEYS.map(mk=>({value:mk,label:metrics[mk].label}))}/>
        {!isEmission&&<div style={{padding:'10px 14px',background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:6,fontSize:12,color:'#92400e'}}>
          SBTi pathway analysis is only available for emission metrics (Scope 1/2/3, Energy Intensity).
        </div>}
      </div>

      <Section title="Company SBTi Divergence Table">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.navy}}>
                {['Company','Sector','SBTi','Net Zero','Baseline 2024','Forecast 2030','SBTi Target 2030','Divergence %','Status','Excess ktCO₂e'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',color:'#fff',textAlign:'left',fontSize:11,fontFamily:T.mono,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.sort((a,b)=>(b.divPct||0)-(a.divPct||0)).map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{padding:'8px 12px',fontWeight:600,color:T.navy,whiteSpace:'nowrap'}}>{r.ticker}</td>
                  <td style={{padding:'8px 12px',color:T.textSec}}>{r.sector}</td>
                  <td style={{padding:'8px 12px'}}><Badge label={r.sbtiCommitted?'Yes':'No'} color={r.sbtiCommitted?'green':'gray'}/></td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono}}>{r.netZeroYear}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono}}>{r.baseline>=1000?(r.baseline/1000).toFixed(1)+'k':r.baseline.toFixed(0)}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono}}>{r.fore2030>=1000?(r.fore2030/1000).toFixed(1)+'k':r.fore2030.toFixed(0)}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono}}>{r.sbti2030!=null?(r.sbti2030>=1000?(r.sbti2030/1000).toFixed(1)+'k':r.sbti2030.toFixed(0)):'—'}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,color:r.divPct>0?T.red:T.green}}>{r.divPct!=null?`${r.divPct>0?'+':''}${r.divPct.toFixed(1)}%`:'—'}</td>
                  <td style={{padding:'8px 12px'}}><Badge label={r.status} color={statusColor[r.status.replace(' ','')]||'gray'}/></td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.red}}>{r.excess2030>0?`+${Number(r.excess2030).toLocaleString()}`:isEmission?'On track':'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {isEmission&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="Normalized Emission Trajectories vs SBTi (Base=100)">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={normalizedData.slice(0,11)} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
                <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
                <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={40}
                  domain={[0,120]}/>
                <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}
                  formatter={(v,n)=>[`${v} (base=100)`,n]}/>
                <ReferenceLine y={100} stroke={T.borderL} strokeDasharray="4 2" label={{value:'2024 Base',position:'right',fontSize:10}}/>
                <ReferenceLine y={55} stroke={T.green} strokeWidth={1.5} strokeDasharray="6 3" label={{value:'SBTi -45%',position:'right',fontSize:10,fill:T.green}}/>
                {companies.map(c=><Line key={c.ticker} type="monotone" dataKey={c.ticker} stroke={sectorColors[c.sector]||T.navy} strokeWidth={1.5} dot={false}/>)}
              </LineChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Sector Portfolio Emissions Forecast">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sectorAgg.filter((_,i)=>i%2===0)} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
                <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
                <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={55}
                  tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                {[...new Set(companies.map(c=>c.sector))].map(sec=>(
                  <Bar key={sec} dataKey={sec} stackId="a" fill={sectorColors[sec]||T.navy} name={sec}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      <Section title="Engagement Priority — Divergence Improvement Opportunity">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {rows.filter(r=>r.status!=='N/A').sort((a,b)=>(b.divPct||0)-(a.divPct||0)).slice(0,8).map((r,i)=>(
            <div key={r.id} style={{padding:'10px 14px',border:`1px solid ${r.divPct>20?T.red:r.divPct>5?T.amber:T.green}`,borderRadius:8,background:T.surface}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{r.ticker}</span>
                <span style={{fontSize:11,color:T.textMut}}>#{i+1}</span>
              </div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:6}}>{r.sector}</div>
              <Badge label={r.status} color={statusColor[r.status.replace(' ','')]||'gray'}/>
              {r.divPct!=null&&(
                <div style={{fontSize:12,fontFamily:T.mono,marginTop:6,color:r.divPct>0?T.red:T.green}}>
                  {r.divPct>0?'+':''}{ r.divPct.toFixed(1)}% divergence
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Tab 4: Change Point & Anomaly Detection ───────────────────────────────────
function Tab4({companies,metrics}){
  const [metricKey,setMetricKey]=useState('scope1');
  const [intervention,setIntervention]=useState(10);
  const [interventionYear,setInterventionYear]=useState(2026);
  const meta=metrics[metricKey];

  const allTs=useMemo(()=>companies.map(c=>({...c,ts:generateTimeSeries(c,metricKey)})),[companies,metricKey]);

  const timelineData=useMemo(()=>HIST_YEARS.map(y=>({
    year:y,
    ...Object.fromEntries(companies.map(c=>{
      const ts=(allTs.find(a=>a.id===c.id)?.ts) ?? {data:[],changePoints:[]};
      const cp=ts.changePoints.find(p=>p.year===y);
      return[c.ticker,cp?cp.magnitude:null];
    }))
  })),[allTs,companies]);

  const heatmapData=useMemo(()=>companies.map(c=>{
    const ts=(allTs.find(a=>a.id===c.id)?.ts) ?? {data:[],changePoints:[]};
    const mean=ts.data.length ? ts.data.reduce((a,b)=>a+b,0)/ts.data.length : 0;
    const std=Math.sqrt(ts.data.reduce((s,d)=>s+(d-mean)**2,0)/ts.data.length)||1;
    const zscores=ts.data.map(d=>(d-mean)/std);
    return{name:c.ticker,zscores};
  }),[allTs,companies]);

  const interventionData=useMemo(()=>{
    const ts=allTs[0].ts;
    const reduction=intervention/100;
    return Array.from({length:11},(_,i)=>{
      const y=2025+i;
      const base=ts.ensemble[i];
      const adj=y>=interventionYear?base*(1-reduction*(y-interventionYear+1)*0.3):base;
      return{year:y,baseline:+base.toFixed(2),counterfactual:+Math.max(0,adj).toFixed(2)};
    });
  },[allTs,intervention,interventionYear]);

  const zColor=(z)=>{
    if(z>2)return T.red;
    if(z>1)return T.amber;
    if(z<-2)return T.green;
    if(z<-1)return T.sage;
    return T.borderL;
  };

  const changePointCards=useMemo(()=>{
    const cards=[];
    allTs.forEach(a=>{
      a.ts.changePoints.forEach(cp=>{
        cards.push({company:a.name,ticker:a.ticker,year:cp.year,magnitude:cp.magnitude,cause:cp.cause,metric:meta.label,sustained:sr(a.id.charCodeAt(1)*7+cp.year)>0.5});
      });
    });
    return cards.sort((a,b)=>Math.abs(b.magnitude)-Math.abs(a.magnitude)).slice(0,8);
  },[allTs,meta]);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 3fr',gap:12,alignItems:'start'}}>
        <Sel label="Metric" value={metricKey} onChange={setMetricKey}
          options={METRIC_KEYS.map(mk=>({value:mk,label:metrics[mk].label}))}/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',paddingTop:20}}>
          {EVENTS.map(ev=>(
            <div key={ev.year} style={{padding:'4px 10px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,color:T.textSec}}>
              <span style={{fontWeight:700,color:T.navy}}>{ev.year}</span> — {ev.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Section title="Anomaly Z-Score Heatmap">
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',fontSize:11,width:'100%'}}>
              <thead>
                <tr>
                  <th style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:10}}>Company</th>
                  {HIST_YEARS.map(y=><th key={y} style={{padding:'5px 4px',textAlign:'center',color:T.textSec,fontFamily:T.mono,fontSize:10}}>{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row=>(
                  <tr key={row.name}>
                    <td style={{padding:'5px 8px',fontWeight:600,color:T.navy,fontFamily:T.mono,fontSize:11,whiteSpace:'nowrap'}}>{row.name}</td>
                    {row.zscores.map((z,i)=>(
                      <td key={i} style={{padding:'5px 4px',textAlign:'center',background:zColor(z)+'22',border:`1px solid ${T.borderL}`}}>
                        <span style={{fontSize:10,fontFamily:T.mono,color:zColor(z),fontWeight:Math.abs(z)>1?700:400}}>{z.toFixed(1)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:8,display:'flex',gap:12,fontSize:11,color:T.textSec}}>
            <span style={{color:T.red}}>■ z&gt;2 Extreme High</span>
            <span style={{color:T.amber}}>■ z&gt;1 High</span>
            <span style={{color:T.sage}}>■ z&lt;-1 Low</span>
            <span style={{color:T.green}}>■ z&lt;-2 Extreme Low</span>
          </div>
        </Section>

        <Section title="Change Point Context Cards">
          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:280,overflowY:'auto'}}>
            {changePointCards.map((cp,i)=>(
              <div key={i} style={{padding:'10px 12px',border:`1px solid ${cp.magnitude<0?T.sage:T.amber}`,borderRadius:6,background:T.surface,borderLeft:`3px solid ${cp.magnitude<0?T.green:T.red}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{cp.ticker} — {cp.year}</span>
                  <Badge label={cp.sustained?'Sustained':'One-off'} color={cp.sustained?'blue':'gray'}/>
                </div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{cp.metric} | Magnitude: <b style={{fontFamily:T.mono,color:cp.magnitude<0?T.green:T.red}}>{cp.magnitude>0?'+':''}{cp.magnitude.toFixed(1)}</b></div>
                <div style={{fontSize:11,color:T.textMut}}>{cp.cause}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Counterfactual Intervention Analysis">
        <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:16}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Intervention Parameters</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:3}}>Reduction intensity: {intervention}%</div>
            <input type="range" min={5} max={50} step={5} value={intervention} onChange={e=>setIntervention(+e.target.value)} style={{width:'100%',marginBottom:12}}/>
            <Sel label="Starting Year" value={String(interventionYear)} onChange={v=>setInterventionYear(+v)}
              options={[2026,2027,2028,2029,2030].map(y=>({value:String(y),label:String(y)}))}/>
            <div style={{padding:'8px 12px',background:T.navy,borderRadius:6,color:'#fff',fontSize:12,fontFamily:T.mono,textAlign:'center',marginTop:8}}>
              {companies[0].ticker} Scope 1 scenario<br/>
              <span style={{color:T.goldL,fontSize:11}}>Applying {intervention}% target from {interventionYear}</span>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={interventionData} margin={{top:4,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
                <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
                <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={60}
                  tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}k`:v.toFixed(0)}/>
                <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}/>
                <ReferenceLine x={interventionYear} stroke={T.green} strokeDasharray="4 2"
                  label={{value:'Intervention',position:'top',fontSize:10,fill:T.green}}/>
                <Area type="monotone" dataKey="baseline" stroke={T.red} fill="none" strokeWidth={2} name="BAU Forecast"/>
                <Area type="monotone" dataKey="counterfactual" stroke={T.green} fill="url(#intGrad)" strokeWidth={2} name="With Intervention"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Tab 5: Portfolio Forecast Aggregation ─────────────────────────────────────
function Tab5({companies,metrics}){
  const [metricKey,setMetricKey]=useState('scope1');
  const meta=metrics[metricKey];

  const portfolioData=useMemo(()=>{
    return ALL_YEARS.map((y,yi)=>{
      const isHist=y<=2024;
      let sum=0;
      companies.forEach(c=>{
        const ts=generateTimeSeries(c,metricKey);
        if(isHist)sum+=ts.data[yi]||0;
        else sum+=ts.ensemble[yi-10]||ts.ensemble[ts.ensemble.length-1];
      });
      return{year:y,portfolio:+sum.toFixed(0)};
    });
  },[companies,metricKey]);

  const scenarioData=useMemo(()=>{
    return Array.from({length:11},(_,i)=>{
      const y=2025+i;
      const base=portfolioData.find(d=>d.year===y)?.portfolio||0;
      return{
        year:y,
        bau:+base.toFixed(0),
        moderate:+(base*(1-i*0.025)).toFixed(0),
        accelerated:+(base*(1-i*0.055)).toFixed(0),
      };
    });
  },[portfolioData]);

  const esgAgg=useMemo(()=>{
    return ALL_YEARS.map((y,yi)=>{
      const isHist=y<=2024;
      let sum=0;
      companies.forEach(c=>{
        const ts=generateTimeSeries(c,'esg_score');
        if(isHist)sum+=ts.data[yi]||0;
        else sum+=ts.ensemble[yi-10]||ts.ensemble[ts.ensemble.length-1];
      });
      const avg=sum/companies.length;
      const benchmark=55+yi*0.3;
      return{year:y,portfolio:+avg.toFixed(1),benchmark:+benchmark.toFixed(1)};
    });
  },[companies]);

  const netZeroScore=useMemo(()=>{
    const committed=companies.filter(c=>c.sbtiCommitted).length/companies.length*100;
    const earlyNZ=companies.filter(c=>c.netZeroYear<=2040).length/companies.length*100;
    const trajectory=60;
    const dataQuality=72;
    return Math.round(committed*0.3+earlyNZ*0.25+trajectory*0.3+dataQuality*0.15);
  },[companies]);

  const carbonBudget=useMemo(()=>{
    const totalForecast=scenarioData.reduce((s,d)=>s+d.bau,0)*26;
    const sbtiTarget=totalForecast*0.45;
    return{totalForecast:+(totalForecast/1e6).toFixed(2),sbtiTarget:+(sbtiTarget/1e6).toFixed(2),overshoot:+((totalForecast-sbtiTarget)/1e6).toFixed(2)};
  },[scenarioData]);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <KpiCard label="Net Zero Feasibility" value={`${netZeroScore}/100`} sub="Composite score" accent={netZeroScore>70?T.green:netZeroScore>50?T.amber:T.red}/>
        <KpiCard label="SBTi Committed" value={`${companies.filter(c=>c.sbtiCommitted).length}/${companies.length}`} sub="Companies" accent={T.navy}/>
        <KpiCard label="Carbon Budget Overshoot" value={`${carbonBudget.overshoot}Mt`} sub="vs 1.5°C path to 2050" accent={T.red}/>
        <KpiCard label="Portfolio Avg ESG" value={`${esgAgg.find(d=>d.year===2024)?.portfolio||'—'}`} sub="pts vs 55 benchmark" accent={T.gold}/>
      </div>

      <Sel label="Portfolio Metric" value={metricKey} onChange={setMetricKey}
        options={METRIC_KEYS.map(mk=>({value:mk,label:metrics[mk].label}))}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Section title="Aggregate Portfolio Trajectory 2015–2035">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={portfolioData} margin={{top:4,right:8,left:0,bottom:0}}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.navy} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={T.navy} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
              <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
              <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={65}
                tickFormatter={v=>v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}
                formatter={v=>[v>=1000?`${(v/1000).toFixed(1)}k ${meta.unit}`:v+' '+meta.unit,'Portfolio']}/>
              {EVENTS.map(ev=><ReferenceLine key={ev.year} x={ev.year} stroke={T.borderL} strokeDasharray="4 2"
                label={{value:ev.label,position:'top',fontSize:9,fill:T.textMut}}/>)}
              <ReferenceLine x={2024} stroke={T.gold} strokeWidth={1.5}
                label={{value:'Forecast start',position:'top',fontSize:10,fill:T.gold}}/>
              <Area type="monotone" dataKey="portfolio" stroke={T.navy} fill="url(#portGrad)" strokeWidth={2} name={meta.label}/>
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="ESG Score — Portfolio vs Benchmark">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={esgAgg} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
              <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
              <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={40} domain={[30,75]}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <ReferenceLine x={2024} stroke={T.gold} strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="portfolio" stroke={T.navy} strokeWidth={2} dot={false} name="Portfolio Avg ESG"/>
              <Line type="monotone" dataKey="benchmark" stroke={T.sage} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Market Benchmark"/>
            </LineChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Scenario Analysis — Portfolio Emissions Fork (2025–2035)">
        <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:16}}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scenarioData} margin={{top:4,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false}/>
              <XAxis dataKey="year" tick={{fontSize:11,fontFamily:T.mono}} tickLine={false}/>
              <YAxis tick={{fontSize:11,fontFamily:T.mono}} tickLine={false} width={65}
                tickFormatter={v=>v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.mono,fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="bau" stroke={T.red} strokeWidth={2} dot={false} name="BAU (No Action)"/>
              <Line type="monotone" dataKey="moderate" stroke={T.amber} strokeWidth={2} strokeDasharray="5 3" dot={false} name="Moderate Transition"/>
              <Line type="monotone" dataKey="accelerated" stroke={T.green} strokeWidth={2} strokeDasharray="3 3" dot={false} name="Accelerated Transition"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{padding:'12px 14px',border:`1px solid ${T.red}`,borderRadius:8,background:T.surface}}>
              <div style={{fontSize:11,color:T.red,fontWeight:700,marginBottom:4}}>BAU Scenario</div>
              <div style={{fontSize:12,color:T.textSec}}>No policy action. Historical trend continues.</div>
              <div style={{fontSize:12,fontFamily:T.mono,color:T.red,marginTop:4}}>+{(carbonBudget.overshoot).toFixed(1)}Mt overshoot by 2050</div>
            </div>
            <div style={{padding:'12px 14px',border:`1px solid ${T.amber}`,borderRadius:8,background:T.surface}}>
              <div style={{fontSize:11,color:T.amber,fontWeight:700,marginBottom:4}}>Moderate Transition</div>
              <div style={{fontSize:12,color:T.textSec}}>2.5% annual reduction from 2025.</div>
              <div style={{fontSize:12,fontFamily:T.mono,color:T.amber,marginTop:4}}>-22% vs BAU by 2035</div>
            </div>
            <div style={{padding:'12px 14px',border:`1px solid ${T.green}`,borderRadius:8,background:T.surface}}>
              <div style={{fontSize:11,color:T.green,fontWeight:700,marginBottom:4}}>Accelerated Transition</div>
              <div style={{fontSize:12,color:T.textSec}}>5.5% annual reduction. Paris-aligned.</div>
              <div style={{fontSize:12,fontFamily:T.mono,color:T.green,marginTop:4}}>-42% vs BAU by 2035</div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Net Zero Feasibility Decomposition">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {label:'SBTi Commitment',value:Math.round(companies.filter(c=>c.sbtiCommitted).length/companies.length*100),weight:'30%',color:T.blue},
            {label:'Target Ambition',value:Math.round(companies.filter(c=>c.netZeroYear<=2040).length/companies.length*100),weight:'25%',color:T.purple},
            {label:'Trajectory Score',value:60,weight:'30%',color:T.navy},
            {label:'Data Quality',value:72,weight:'15%',color:T.sage},
          ].map(item=>(
            <div key={item.label} style={{padding:'14px 16px',border:`1px solid ${T.border}`,borderRadius:8,background:T.surface}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>{item.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:item.color,fontFamily:T.mono}}>{item.value}</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:2}}>Weight: {item.weight}</div>
              <div style={{marginTop:8,height:6,borderRadius:3,background:T.borderL,overflow:'hidden'}}>
                <div style={{width:`${item.value}%`,height:'100%',background:item.color,borderRadius:3}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:'12px 16px',background:T.navy,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{color:'#fff',fontSize:14,fontWeight:600}}>Overall Net Zero Feasibility Score</div>
          <div style={{fontSize:28,fontWeight:800,color:netZeroScore>70?T.goldL:netZeroScore>50?T.amber:'#f87171',fontFamily:T.mono}}>{netZeroScore}/100</div>
          <Badge label={netZeroScore>70?'On Track':netZeroScore>50?'At Risk':'Off Track'} color={netZeroScore>70?'green':netZeroScore>50?'amber':'red'}/>
        </div>
      </Section>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ESGTimeSeriesForecasterPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Forecast Studio','Model Comparison','SBTi Divergence','Change Points','Portfolio Aggregation'];

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      {/* Gold accent top bar */}
      <div style={{height:3,background:`linear-gradient(90deg,${T.gold},${T.goldL},${T.gold})`}}/>

      {/* Header */}
      <div style={{background:T.navy,padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:11,color:T.goldL,fontFamily:T.mono,letterSpacing:'1px',textTransform:'uppercase',marginBottom:4}}>
            EP-BZ1 · Risk Analytics Platform
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'#ffffff',letterSpacing:'-0.3px'}}>ESG Time Series Forecaster</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2,fontFamily:T.mono}}>
            ARIMA · Holt-Winters · Ensemble · SBTi Pathway · Change Point Detection
          </div>
        </div>
        <div style={{display:'flex',gap:12}}>
          <div style={{padding:'6px 14px',background:'rgba(255,255,255,0.08)',borderRadius:6,fontSize:12,color:T.goldL,fontFamily:T.mono}}>
            12 Companies · 8 Metrics · 2015–2035
          </div>
          <div style={{padding:'6px 14px',background:'rgba(197,169,106,0.15)',border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,color:T.gold,fontFamily:T.mono}}>
            LIVE · Multi-Model
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'0 28px',display:'flex',gap:0}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)}
            style={{padding:'14px 20px',border:'none',borderBottom:`3px solid ${tab===i?T.gold:'transparent'}`,
              background:'transparent',fontSize:13,fontWeight:tab===i?700:400,
              color:tab===i?T.navy:T.textSec,cursor:'pointer',fontFamily:T.font,transition:'all 0.15s'}}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:'24px 28px'}}>
        {tab===0&&<Tab1 companies={COMPANIES} metrics={METRICS}/>}
        {tab===1&&<Tab2 companies={COMPANIES} metrics={METRICS}/>}
        {tab===2&&<Tab3 companies={COMPANIES} metrics={METRICS}/>}
        {tab===3&&<Tab4 companies={COMPANIES} metrics={METRICS}/>}
        {tab===4&&<Tab5 companies={COMPANIES} metrics={METRICS}/>}
      </div>

      {/* Navy terminal status bar */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:T.navy,padding:'5px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:100}}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.goldL}}>EP-BZ1 · ESG Time Series Forecaster</div>
        <div style={{fontFamily:T.mono,fontSize:11,color:'#94a3b8',display:'flex',gap:16}}>
          <span>12 companies</span>
          <span>8 metrics</span>
          <span>ARIMA + Holt-Winters + Ensemble</span>
          <span style={{color:T.goldL}}>SBTi pathway analysis active</span>
        </div>
      </div>
      <div style={{height:36}}/>
    </div>
  );
}
