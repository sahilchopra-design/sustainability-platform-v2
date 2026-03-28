import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['SLL/SLB Portfolio','KPI Performance Tracker','Pricing Impact','Regulatory & Structuring'];
const COLORS=[T.navy,T.sage,T.gold,T.red,T.green,T.amber,'#7c3aed','#0ea5e9'];
const SECTORS=['Energy','Utilities','Real Estate','Transport','Manufacturing','Agriculture','Technology','Healthcare','Mining','Chemicals'];
const TYPES=['SLL','SLB','SLL-RCF','SLB-Green','SLL-Term','SLB-Social'];
const KPIS=['GHG Scope 1+2 Reduction','Renewable Energy %','Water Intensity','Gender Diversity %','Lost Time Injury Rate','Recycling Rate','Energy Efficiency','Biodiversity Score','Community Investment','Supply Chain Audit %'];
const CURRENCIES=['USD','EUR','GBP','JPY','CHF','AUD'];
const ISSUERS=['Enel SpA','Orsted A/S','Iberdrola SA','NextEra Energy','Schneider Electric','Danone SA','Novartis AG','Holcim Ltd','Suzano SA','Tesco PLC','Engie SA','SSE PLC','AGL Energy','CLP Holdings','Woolworths Group','Natura & Co','UPM-Kymmene','Stora Enso','SCA AB','Vattenfall AB','E.ON SE','RWE AG','EDP Renovaveis','Acciona SA','Vestas Wind','Siemens Gamesa','BHP Group','Rio Tinto','Anglo American','Glencore PLC','BASF SE','Solvay SA','Linde PLC','Air Liquide','DSM NV','Symrise AG','Unilever PLC','Nestle SA','AB InBev','Heineken NV','Coca-Cola HBC','Diageo PLC','GSK PLC','AstraZeneca','Roche Holding','Novozymes','Chr Hansen','Kerry Group','Sappi Ltd','Mondi PLC','Smurfit Kappa','Ball Corp','Amcor PLC','Brambles Ltd','Cleanaway Waste','Veolia Env','Suez SA','Xylem Inc','Pentair PLC','Watts Water'];

const facilities=Array.from({length:60},(_,i)=>{ const s=sr(i*7); const s2=sr(i*13); const s3=sr(i*19);
  return {id:i+1,issuer:ISSUERS[i%ISSUERS.length],type:TYPES[Math.floor(s*TYPES.length)],sector:SECTORS[Math.floor(s2*SECTORS.length)],
    ccy:CURRENCIES[Math.floor(s3*CURRENCIES.length)],notional:Math.round(100+s*900),tenor:Math.round(3+s2*7),
    kpi:KPIS[Math.floor(sr(i*23)*KPIS.length)],kpiBaseline:Math.round(20+s*60),kpiTarget:Math.round(5+s2*30),kpiCurrent:Math.round(10+sr(i*31)*50),
    marginBps:Math.round(80+s*220),stepUpBps:Math.round(5+s2*20),stepDownBps:Math.round(2+s3*15),
    icmaAlign:Math.round(60+sr(i*37)*35),lmaAlign:Math.round(55+sr(i*41)*40),verifier:['ISS ESG','Sustainalytics','CICERO','DNV','Moody\'s ESG','S&P Global'][Math.floor(sr(i*43)*6)],
    rating:['A+','A','A-','B+','B','B-','C+'][Math.floor(sr(i*47)*7)],maturity:`20${26+Math.floor(s3*8)}`,
    coupon:+(1.5+s*4.5).toFixed(2),spread:Math.round(50+s2*200),country:['DE','FR','US','GB','AU','BR','SE','DK','ES','IT'][Math.floor(sr(i*53)*10)],
    breachRisk:sr(i*59)<0.2?'High':sr(i*59)<0.5?'Medium':'Low',lastReview:`2025-${String(1+Math.floor(sr(i*61)*12)).padStart(2,'0')}-15`,
    structureNotes:sr(i*67)<0.3?'Annual step-up':sr(i*67)<0.6?'Semi-annual ratchet':'Cumulative margin adjustment'};
});

const tipS={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font,color:T.text}};

const Stat=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${color||T.sage}`}}>
  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:6,fontFamily:T.font}}>{label}</div>
  <div style={{fontSize:26,fontWeight:800,color:T.navy,fontFamily:T.font}}>{value}</div>
  {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3}}>{sub}</div>}</div>);

const Badge=({children,color})=>{const m={green:{bg:'#dcfce7',fg:T.green},red:{bg:'#fee2e2',fg:T.red},amber:{bg:'#fef3c7',fg:T.amber},navy:{bg:'#dbeafe',fg:T.navy},sage:{bg:'#d1fae5',fg:T.sage}};const c=m[color]||m.sage;return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.bg,color:c.fg}}>{children}</span>;};

const exportCSV=(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${name}.csv`;a.click();URL.revokeObjectURL(u);};

export default function SLLSLBv2Page(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('notional');
  const [sortDir,setSortDir]=useState('desc');
  const [filterSector,setFilterSector]=useState('All');
  const [filterType,setFilterType]=useState('All');
  const [expanded,setExpanded]=useState(null);
  const [selectedFacility,setSelectedFacility]=useState(null);
  const [kpiFilter,setKpiFilter]=useState('All');
  const [breachOnly,setBreachOnly]=useState(false);
  const [marginSlider,setMarginSlider]=useState(150);
  const [stepUpSlider,setStepUpSlider]=useState(12);
  const [stepDownSlider,setStepDownSlider]=useState(8);
  const [scenarioYears,setScenarioYears]=useState(5);
  const [showPanel,setShowPanel]=useState(false);
  const [panelData,setPanelData]=useState(null);
  const [complianceFilter,setComplianceFilter]=useState('All');
  const [wizardStep,setWizardStep]=useState(0);

  const filtered=useMemo(()=>{let d=[...facilities];if(search)d=d.filter(r=>r.issuer.toLowerCase().includes(search.toLowerCase())||r.kpi.toLowerCase().includes(search.toLowerCase()));if(filterSector!=='All')d=d.filter(r=>r.sector===filterSector);if(filterType!=='All')d=d.filter(r=>r.type===filterType);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,filterSector,filterType,sortCol,sortDir]);

  const kpiFiltered=useMemo(()=>{let d=[...facilities];if(kpiFilter!=='All')d=d.filter(r=>r.kpi===kpiFilter);if(breachOnly)d=d.filter(r=>r.breachRisk==='High');return d;},[kpiFilter,breachOnly]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const openPanel=(f)=>{setPanelData(f);setShowPanel(true);};

  const totalNotional=facilities.reduce((s,f)=>s+f.notional,0);
  const avgIcma=Math.round(facilities.reduce((s,f)=>s+f.icmaAlign,0)/facilities.length);
  const highBreachCount=facilities.filter(f=>f.breachRisk==='High').length;

  const sectorAgg=useMemo(()=>SECTORS.map(s=>{const fs=facilities.filter(f=>f.sector===s);return {sector:s,count:fs.length,total:fs.reduce((a,f)=>a+f.notional,0)};}).filter(s=>s.count>0),[]);
  const typeAgg=useMemo(()=>TYPES.map(t=>{const fs=facilities.filter(f=>f.type===t);return {type:t,count:fs.length,total:fs.reduce((a,f)=>a+f.notional,0)};}).filter(t=>t.count>0),[]);

  const marginScenario=useMemo(()=>Array.from({length:scenarioYears},(_,i)=>{
    const yr=2026+i;const base=marginSlider;const up=base+stepUpSlider*(i+1);const down=Math.max(base-stepDownSlider*(i+1),0);
    return {year:yr,base,stepUp:up,stepDown:down};}),[marginSlider,stepUpSlider,stepDownSlider,scenarioYears]);

  const costImpact=useMemo(()=>{const notional=500;return marginScenario.map(m=>({year:m.year,baseCost:+(notional*m.base/10000).toFixed(2),stepUpCost:+(notional*m.stepUp/10000).toFixed(2),stepDownCost:+(notional*m.stepDown/10000).toFixed(2)}));},[marginScenario]);

  const complianceData=useMemo(()=>facilities.map(f=>{const icma=f.icmaAlign>=80;const lma=f.lmaAlign>=75;const verified=f.verifier!=='';const overall=icma&&lma&&verified?'Compliant':icma||lma?'Partial':'Non-Compliant';return {...f,icmaPass:icma,lmaPass:lma,verified,overall};}).filter(f=>complianceFilter==='All'||f.overall===complianceFilter),[complianceFilter]);

  const wizardSteps=['Select Instrument Type','Define KPI & SPTs','Set Margin Ratchet','Verification & Reporting','Review & Submit'];

  const thS={padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',fontFamily:T.font,background:T.surfaceH,position:'sticky',top:0,userSelect:'none'};
  const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};
  const tdM={...tdS,fontFamily:T.mono,fontWeight:600};

  return (<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0}}>SLL / SLB Analytics</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Sustainability-Linked Loans & Bonds -- 60 facilities across {SECTORS.length} sectors</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <Stat label="Total Facilities" value="60" sub="SLLs & SLBs" color={T.navy}/>
        <Stat label="Total Notional" value={`$${(totalNotional/1000).toFixed(1)}B`} sub="Across all currencies" color={T.sage}/>
        <Stat label="Avg ICMA Score" value={`${avgIcma}%`} sub="Alignment assessment" color={T.gold}/>
        <Stat label="Breach Alerts" value={highBreachCount} sub="High risk facilities" color={T.red}/>
        <Stat label="Avg Margin" value={`${Math.round(facilities.reduce((s,f)=>s+f.marginBps,0)/60)} bps`} sub="Weighted average" color={T.amber}/>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'12px 24px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>)}
      </div>

      {tab===0&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search issuer or KPI..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:260,outline:'none',background:T.surface}}/>
          <select value={filterSector} onChange={e=>setFilterSector(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Types</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={()=>exportCSV(filtered,'sll_slb_portfolio')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} of 60 facilities</span>
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <div style={{maxHeight:520,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {[{k:'id',l:'#'},{k:'issuer',l:'Issuer'},{k:'type',l:'Type'},{k:'sector',l:'Sector'},{k:'notional',l:'Notional ($M)'},{k:'kpi',l:'KPI'},{k:'kpiCurrent',l:'Current'},{k:'kpiTarget',l:'Target'},{k:'marginBps',l:'Margin (bps)'},{k:'rating',l:'Rating'},{k:'breachRisk',l:'Risk'}].map(c=>
                  <th key={c.k} onClick={()=>toggleSort(c.k)} style={{...thS,color:sortCol===c.k?T.navy:T.textSec}}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ^':' v'):''}</th>
                )}
              </tr></thead>
              <tbody>{filtered.map(f=><React.Fragment key={f.id}>
                <tr onClick={()=>setExpanded(expanded===f.id?null:f.id)} style={{cursor:'pointer',background:expanded===f.id?T.surfaceH:'transparent',transition:'background 0.15s'}}>
                  <td style={tdM}>{f.id}</td><td style={tdS}>{f.issuer}</td><td style={tdS}><Badge color="navy">{f.type}</Badge></td><td style={tdS}>{f.sector}</td>
                  <td style={tdM}>{f.notional}</td><td style={{...tdS,fontSize:11}}>{f.kpi}</td><td style={tdM}>{f.kpiCurrent}%</td><td style={tdM}>{f.kpiTarget}%</td>
                  <td style={tdM}>{f.marginBps}</td><td style={tdS}><Badge color={f.rating.startsWith('A')?'green':f.rating.startsWith('B')?'amber':'red'}>{f.rating}</Badge></td>
                  <td style={tdS}><Badge color={f.breachRisk==='High'?'red':f.breachRisk==='Medium'?'amber':'green'}>{f.breachRisk}</Badge></td>
                </tr>
                {expanded===f.id&&<tr><td colSpan={11} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                    <div><span style={{fontSize:10,color:T.textMut}}>Currency</span><div style={{fontWeight:700}}>{f.ccy}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Tenor</span><div style={{fontWeight:700}}>{f.tenor}Y</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Maturity</span><div style={{fontWeight:700}}>{f.maturity}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Coupon</span><div style={{fontWeight:700}}>{f.coupon}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Spread</span><div style={{fontWeight:700}}>{f.spread} bps</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Step-Up</span><div style={{fontWeight:700}}>{f.stepUpBps} bps</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Step-Down</span><div style={{fontWeight:700}}>{f.stepDownBps} bps</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Verifier</span><div style={{fontWeight:700}}>{f.verifier}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>ICMA Score</span><div style={{fontWeight:700}}>{f.icmaAlign}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>LMA Score</span><div style={{fontWeight:700}}>{f.lmaAlign}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Country</span><div style={{fontWeight:700}}>{f.country}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Last Review</span><div style={{fontWeight:700}}>{f.lastReview}</div></div>
                  </div>
                  <div style={{marginTop:12,fontSize:11,color:T.textSec}}>Structure: {f.structureNotes}</div>
                  <button onClick={(e)=>{e.stopPropagation();openPanel(f);}} style={{marginTop:8,padding:'6px 14px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:T.font}}>Open Detail Panel</button>
                </td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:24}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Notional by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorAgg}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="total" fill={T.navy} radius={[4,4,0,0]}>{sectorAgg.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Count by Instrument Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeAgg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="type" type="category" tick={{fontSize:10,fill:T.textSec}} width={80}/><Tooltip {...tipS}/><Bar dataKey="count" fill={T.sage} radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===1&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={kpiFilter} onChange={e=>setKpiFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All KPIs</option>{KPIS.map(k=><option key={k} value={k}>{k}</option>)}
          </select>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.textSec,cursor:'pointer'}}>
            <input type="checkbox" checked={breachOnly} onChange={e=>setBreachOnly(e.target.checked)}/> Breach alerts only
          </label>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{kpiFiltered.length} facilities</span>
        </div>

        <div style={{display:'grid',gap:12}}>
          {kpiFiltered.slice(0,20).map(f=>{
            const pct=f.kpiBaseline>0?Math.round(((f.kpiBaseline-f.kpiCurrent)/(f.kpiBaseline-f.kpiTarget))*100):50;
            const clampPct=Math.max(0,Math.min(100,pct));
            const onTrack=pct>=60;
            return <div key={f.id} style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,display:'grid',gridTemplateColumns:'200px 120px 1fr 100px 80px',gap:12,alignItems:'center'}}>
              <div><div style={{fontWeight:700,fontSize:13}}>{f.issuer}</div><div style={{fontSize:10,color:T.textMut}}>{f.type} | {f.sector}</div></div>
              <div style={{fontSize:11,color:T.textSec}}>{f.kpi}</div>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut,marginBottom:4}}>
                  <span>Baseline: {f.kpiBaseline}%</span><span>Target: {f.kpiTarget}%</span>
                </div>
                <div style={{background:T.surfaceH,borderRadius:6,height:14,overflow:'hidden',position:'relative'}}>
                  <div style={{width:`${clampPct}%`,height:'100%',background:onTrack?T.green:T.amber,borderRadius:6,transition:'width 0.3s'}}/>
                  <div style={{position:'absolute',top:0,left:`${clampPct}%`,width:2,height:'100%',background:T.navy}}/>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Current: {f.kpiCurrent}% ({clampPct}% to target)</div>
              </div>
              <div style={{textAlign:'center'}}><Badge color={onTrack?'green':'amber'}>{onTrack?'On Track':'At Risk'}</Badge></div>
              <div style={{textAlign:'center'}}><Badge color={f.breachRisk==='High'?'red':f.breachRisk==='Medium'?'amber':'green'}>{f.breachRisk}</Badge></div>
            </div>;
          })}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:24}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>KPI Achievement Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={KPIS.map((k,i)=>({kpi:k.length>20?k.slice(0,18)+'..':k,avgProgress:Math.round(30+sr(i*17)*60)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="kpi" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip {...tipS}/><Bar dataKey="avgProgress" fill={T.sage} radius={[4,4,0,0]}>{KPIS.map((k,i)=><Cell key={i} fill={sr(i*17)*100>50?T.green:T.amber}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Breach Risk Trend (12M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={Array.from({length:12},(_,i)=>({month:`M${i+1}`,high:Math.round(2+sr(i*3)*5),medium:Math.round(5+sr(i*7)*8),low:Math.round(20+sr(i*11)*15)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Line type="monotone" dataKey="high" stroke={T.red} strokeWidth={2} dot={false}/><Line type="monotone" dataKey="medium" stroke={T.amber} strokeWidth={2} dot={false}/><Line type="monotone" dataKey="low" stroke={T.green} strokeWidth={2} dot={false}/>
                <Legend/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===2&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:24}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Base Margin (bps)</div>
            <input type="range" min={50} max={400} value={marginSlider} onChange={e=>setMarginSlider(+e.target.value)} style={{width:'100%'}}/>
            <div style={{fontSize:24,fontWeight:800,color:T.navy,fontFamily:T.mono,textAlign:'center',marginTop:8}}>{marginSlider} bps</div>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Step-Up per Year (bps)</div>
            <input type="range" min={0} max={50} value={stepUpSlider} onChange={e=>setStepUpSlider(+e.target.value)} style={{width:'100%'}}/>
            <div style={{fontSize:24,fontWeight:800,color:T.red,fontFamily:T.mono,textAlign:'center',marginTop:8}}>+{stepUpSlider} bps/yr</div>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Step-Down per Year (bps)</div>
            <input type="range" min={0} max={30} value={stepDownSlider} onChange={e=>setStepDownSlider(+e.target.value)} style={{width:'100%'}}/>
            <div style={{fontSize:24,fontWeight:800,color:T.green,fontFamily:T.mono,textAlign:'center',marginTop:8}}>-{stepDownSlider} bps/yr</div>
          </div>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <span style={{fontSize:12,color:T.textSec}}>Scenario Horizon:</span>
          {[3,5,7,10].map(y=><button key={y} onClick={()=>setScenarioYears(y)} style={{padding:'6px 14px',background:scenarioYears===y?T.navy:T.surface,color:scenarioYears===y?'#fff':T.text,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:T.font}}>{y}Y</button>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Margin Ratchet Scenarios</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marginScenario}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'bps',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/><Tooltip {...tipS}/>
                <Line type="monotone" dataKey="base" stroke={T.navy} strokeWidth={2} name="Base"/><Line type="monotone" dataKey="stepUp" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" name="Step-Up"/>
                <Line type="monotone" dataKey="stepDown" stroke={T.green} strokeWidth={2} strokeDasharray="5 5" name="Step-Down"/><Legend/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Annual Cost Impact ($M on $500M notional)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costImpact}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Bar dataKey="baseCost" fill={T.navy} name="Base Cost" radius={[2,2,0,0]}/><Bar dataKey="stepUpCost" fill={T.red} name="Step-Up Cost" radius={[2,2,0,0]}/><Bar dataKey="stepDownCost" fill={T.green} name="Step-Down Saving" radius={[2,2,0,0]}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginTop:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Scenario Summary Table</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Year','Base (bps)','Step-Up (bps)','Step-Down (bps)','Base Cost ($M)','Max Cost ($M)','Min Cost ($M)','Net Savings ($M)'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>{costImpact.map((r,i)=><tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
              <td style={tdM}>{r.year}</td><td style={tdM}>{marginScenario[i].base}</td><td style={{...tdM,color:T.red}}>{marginScenario[i].stepUp}</td><td style={{...tdM,color:T.green}}>{marginScenario[i].stepDown}</td>
              <td style={tdM}>{r.baseCost}</td><td style={{...tdM,color:T.red}}>{r.stepUpCost}</td><td style={{...tdM,color:T.green}}>{r.stepDownCost}</td><td style={{...tdM,color:T.green}}>{(r.baseCost-r.stepDownCost).toFixed(2)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>)}

      {tab===3&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={complianceFilter} onChange={e=>setComplianceFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Compliance</option><option value="Compliant">Compliant</option><option value="Partial">Partial</option><option value="Non-Compliant">Non-Compliant</option>
          </select>
          <button onClick={()=>exportCSV(complianceData,'compliance_report')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Export Compliance Report</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{complianceData.length} facilities</span>
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:24}}>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Issuer','Type','ICMA','LMA','Verifier','Verified','Overall'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{complianceData.slice(0,30).map(f=><tr key={f.id} style={{cursor:'pointer'}} onClick={()=>openPanel(f)}>
                <td style={tdS}>{f.issuer}</td><td style={tdS}><Badge color="navy">{f.type}</Badge></td>
                <td style={tdS}><Badge color={f.icmaPass?'green':'red'}>{f.icmaAlign}%</Badge></td>
                <td style={tdS}><Badge color={f.lmaPass?'green':'red'}>{f.lmaAlign}%</Badge></td>
                <td style={tdS}>{f.verifier}</td><td style={tdS}><Badge color={f.verified?'green':'red'}>{f.verified?'Yes':'No'}</Badge></td>
                <td style={tdS}><Badge color={f.overall==='Compliant'?'green':f.overall==='Partial'?'amber':'red'}>{f.overall}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Structuring Wizard</div>
          <div style={{display:'flex',gap:0,marginBottom:20}}>
            {wizardSteps.map((s,i)=><div key={i} style={{flex:1,textAlign:'center',padding:'10px 8px',background:wizardStep===i?T.navy:wizardStep>i?T.sage:T.surfaceH,color:wizardStep===i?'#fff':wizardStep>i?'#fff':T.textMut,fontSize:11,fontWeight:600,cursor:'pointer',borderRadius:i===0?'8px 0 0 8px':i===wizardSteps.length-1?'0 8px 8px 0':'0'}} onClick={()=>setWizardStep(i)}>{i+1}. {s}</div>)}
          </div>
          <div style={{padding:20,background:T.surfaceH,borderRadius:8,minHeight:120}}>
            {wizardStep===0&&<div><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Select Instrument Type</div>
              <div style={{display:'flex',gap:8}}>{TYPES.map(t=><button key={t} style={{padding:'10px 16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}</div></div>}
            {wizardStep===1&&<div><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Define KPI & Sustainability Performance Targets</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={{fontSize:11,color:T.textMut}}>Primary KPI</label><select style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}>{KPIS.map(k=><option key={k}>{k}</option>)}</select></div>
                <div><label style={{fontSize:11,color:T.textMut}}>Baseline Year</label><input type="number" defaultValue={2024} style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}/></div>
                <div><label style={{fontSize:11,color:T.textMut}}>Target Value</label><input type="number" defaultValue={25} style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}/></div>
                <div><label style={{fontSize:11,color:T.textMut}}>Target Year</label><input type="number" defaultValue={2030} style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}/></div>
              </div></div>}
            {wizardStep===2&&<div><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Set Margin Ratchet Mechanism</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div><label style={{fontSize:11,color:T.textMut}}>Step-Up (bps)</label><input type="range" min={0} max={50} defaultValue={15} style={{width:'100%'}}/></div>
                <div><label style={{fontSize:11,color:T.textMut}}>Step-Down (bps)</label><input type="range" min={0} max={30} defaultValue={10} style={{width:'100%'}}/></div>
                <div><label style={{fontSize:11,color:T.textMut}}>Review Frequency</label><select style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}><option>Annual</option><option>Semi-Annual</option><option>Quarterly</option></select></div>
              </div></div>}
            {wizardStep===3&&<div><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Verification & Reporting Requirements</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={{fontSize:11,color:T.textMut}}>External Verifier</label><select style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}>
                  {['ISS ESG','Sustainalytics','CICERO','DNV','Moody\'s ESG','S&P Global'].map(v=><option key={v}>{v}</option>)}</select></div>
                <div><label style={{fontSize:11,color:T.textMut}}>Reporting Standard</label><select style={{width:'100%',padding:8,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,marginTop:4}}><option>GRI</option><option>SASB</option><option>TCFD</option><option>ISSB S1/S2</option></select></div>
              </div></div>}
            {wizardStep===4&&<div><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Review & Submit</div>
              <p style={{fontSize:12,color:T.textSec}}>Review all parameters above. The structuring summary will be generated with ICMA/LMA compliance checks, margin ratchet schedule, and KPI monitoring framework.</p>
              <button style={{padding:'10px 24px',background:T.sage,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.font,marginTop:12}}>Generate Structuring Report</button></div>}
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button disabled={wizardStep===0} onClick={()=>setWizardStep(s=>s-1)} style={{padding:'8px 16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:T.font}}>Back</button>
            <button disabled={wizardStep===wizardSteps.length-1} onClick={()=>setWizardStep(s=>s+1)} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:T.font}}>Next</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ICMA Alignment Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[{range:'<60%',count:facilities.filter(f=>f.icmaAlign<60).length},{range:'60-70%',count:facilities.filter(f=>f.icmaAlign>=60&&f.icmaAlign<70).length},{range:'70-80%',count:facilities.filter(f=>f.icmaAlign>=70&&f.icmaAlign<80).length},{range:'80-90%',count:facilities.filter(f=>f.icmaAlign>=80&&f.icmaAlign<90).length},{range:'90%+',count:facilities.filter(f=>f.icmaAlign>=90).length}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="range" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="count" fill={T.gold} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Compliance Status Overview</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[{status:'Compliant',count:complianceData.filter(f=>f.overall==='Compliant').length},{status:'Partial',count:complianceData.filter(f=>f.overall==='Partial').length},{status:'Non-Compliant',count:complianceData.filter(f=>f.overall==='Non-Compliant').length}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="status" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Bar dataKey="count" radius={[4,4,0,0]}>{[T.green,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {showPanel&&panelData&&<div style={{position:'fixed',top:0,right:0,width:480,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.navy,margin:0}}>{panelData.issuer}</h2>
          <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {[{l:'Type',v:panelData.type},{l:'Sector',v:panelData.sector},{l:'Notional',v:`$${panelData.notional}M`},{l:'Currency',v:panelData.ccy},{l:'Tenor',v:`${panelData.tenor}Y`},{l:'Maturity',v:panelData.maturity},{l:'Coupon',v:`${panelData.coupon}%`},{l:'Spread',v:`${panelData.spread} bps`},{l:'Margin',v:`${panelData.marginBps} bps`},{l:'Step-Up',v:`${panelData.stepUpBps} bps`},{l:'Step-Down',v:`${panelData.stepDownBps} bps`},{l:'Rating',v:panelData.rating},{l:'Verifier',v:panelData.verifier},{l:'ICMA Score',v:`${panelData.icmaAlign}%`},{l:'LMA Score',v:`${panelData.lmaAlign}%`},{l:'Country',v:panelData.country}].map((d,i)=><div key={i}><div style={{fontSize:10,color:T.textMut}}>{d.l}</div><div style={{fontWeight:700,fontSize:13}}>{d.v}</div></div>)}
        </div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>KPI Details</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:4}}>KPI: {panelData.kpi}</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:4}}>Baseline: {panelData.kpiBaseline}% | Target: {panelData.kpiTarget}% | Current: {panelData.kpiCurrent}%</div>
          <div style={{fontSize:12}}>Breach Risk: <Badge color={panelData.breachRisk==='High'?'red':panelData.breachRisk==='Medium'?'amber':'green'}>{panelData.breachRisk}</Badge></div>
        </div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Structure Notes</div>
          <p style={{fontSize:12,color:T.textSec}}>{panelData.structureNotes}</p></div>
        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Projected Margin (5Y)</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={Array.from({length:5},(_,i)=>({yr:2026+i,margin:panelData.marginBps+(panelData.breachRisk==='High'?panelData.stepUpBps*(i+1):-panelData.stepDownBps*(i+1))}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="yr" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip {...tipS}/>
            <Line type="monotone" dataKey="margin" stroke={panelData.breachRisk==='High'?T.red:T.green} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>}
    </div>
  </div>);
}
