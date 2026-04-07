import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Default Chain Visualizer','Sector Domino Map','Systemic Risk Contribution','Concentration Risk Limits','Loan Loss Cascade','Capital Impact'];

const ENTITIES = [
  { id:'E1', name:'CoalCo Holdings', sector:'Coal Mining', exposure:2400, pd:0.18, lgd:0.65, interconnections:['E2','E3','E5'], deltaCoVaR:0.042, capitalHit:156 },
  { id:'E2', name:'PetroGlobal Inc', sector:'Oil & Gas', exposure:5200, pd:0.12, lgd:0.55, interconnections:['E1','E4','E6'], deltaCoVaR:0.068, capitalHit:312 },
  { id:'E3', name:'HeavyCement Corp', sector:'Cement', exposure:1800, pd:0.09, lgd:0.45, interconnections:['E1','E5','E7'], deltaCoVaR:0.024, capitalHit:73 },
  { id:'E4', name:'SteelWorks Ltd', sector:'Steel', exposure:3100, pd:0.14, lgd:0.50, interconnections:['E2','E6','E8'], deltaCoVaR:0.051, capitalHit:217 },
  { id:'E5', name:'PowerGen Alpha', sector:'Power Generation', exposure:4500, pd:0.11, lgd:0.48, interconnections:['E1','E3','E7'], deltaCoVaR:0.058, capitalHit:238 },
  { id:'E6', name:'ChemProcess AG', sector:'Chemicals', exposure:2700, pd:0.08, lgd:0.40, interconnections:['E2','E4','E8'], deltaCoVaR:0.031, capitalHit:86 },
  { id:'E7', name:'TransportHeavy Co', sector:'Transport', exposure:1900, pd:0.07, lgd:0.42, interconnections:['E3','E5','E8'], deltaCoVaR:0.019, capitalHit:56 },
  { id:'E8', name:'MiningDeep Ltd', sector:'Mining', exposure:3600, pd:0.16, lgd:0.60, interconnections:['E4','E6','E7'], deltaCoVaR:0.055, capitalHit:346 },
];

const CHAIN_STEPS = [
  { step:1, event:'Stranded Asset Write-Down', trigger:'Carbon price >$120/tCO2', lossAccum:0 },
  { step:2, event:'Covenant Breach', trigger:'Leverage ratio exceeds 4.5x', lossAccum:420 },
  { step:3, event:'Loan Default', trigger:'Missed 2+ interest payments', lossAccum:1240 },
  { step:4, event:'Bank Capital Hit', trigger:'CET1 ratio falls below buffer', lossAccum:2100 },
  { step:5, event:'Credit Tightening', trigger:'Bank reduces lending 15-20%', lossAccum:3800 },
  { step:6, event:'Sector Contagion', trigger:'Counterparty defaults cascade', lossAccum:6200 },
];

const SECTORS_AGG = ['Coal Mining','Oil & Gas','Cement','Steel','Power Generation','Chemicals','Transport','Mining'];
const CONC_LIMITS = SECTORS_AGG.map((s,i)=>({ sector:s, currentExposure:ENTITIES.filter(e=>e.sector===s).reduce((a,e)=>a+e.exposure,0), limit:5000+i*500, utilization:0 }));
CONC_LIMITS.forEach(c=>{ c.utilization=Math.round(100*c.currentExposure/(c.limit||1)); });

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function CascadingDefaultModelerPage(){
  const [tab,setTab]=useState(0);
  const [selectedEntity,setSelectedEntity]=useState('E1');
  const [carbonPrice,setCarbonPrice]=useState(120);
  const [severity,setSeverity]=useState(1.0);

  const totalExposure = ENTITIES.reduce((s,e)=>s+e.exposure,0);
  const totalCapHit = ENTITIES.reduce((s,e)=>s+e.capitalHit,0);
  const avgCoVaR = ENTITIES.reduce((s,e)=>s+e.deltaCoVaR,0)/Math.max(1,ENTITIES.length);

  const cascadeData = useMemo(()=>CHAIN_STEPS.map(s=>({...s,lossAccum:Math.round(s.lossAccum*severity*(carbonPrice/120))})),[severity,carbonPrice]);
  const loanLoss = useMemo(()=>ENTITIES.map(e=>({...e,el:Math.round(e.exposure*e.pd*e.lgd*severity),uel:Math.round(e.exposure*e.pd*e.lgd*severity*2.5)})),[severity]);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CK2" label="Cascading Default Chain Modelling" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Cascading Default Modeler</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>Chain: Stranded Asset &rarr; Covenant Breach &rarr; Loan Default &rarr; Bank Capital Hit &rarr; Credit Tightening &rarr; Sector Contagion</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:T.textSec}}>Carbon Price ($/tCO2): <input type="range" min={50} max={300} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{width:120}}/> <span style={{fontFamily:T.mono,fontSize:12}}>${carbonPrice}</span></label>
        <label style={{fontSize:12,color:T.textSec}}>Severity: <input type="range" min={0.5} max={2.0} step={0.1} value={severity} onChange={e=>setSeverity(+e.target.value)} style={{width:100}}/> <span style={{fontFamily:T.mono,fontSize:12}}>{severity.toFixed(1)}x</span></label>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Total Exposure" value={`$${(totalExposure/1000).toFixed(1)}B`} sub="8 entities"/></Card>
        <Card><KPI label="Capital Impact" value={`$${totalCapHit}M`} sub={`${severity.toFixed(1)}x severity`} color={T.red}/></Card>
        <Card><KPI label="Avg Delta CoVaR" value={`${(avgCoVaR*100).toFixed(1)}%`} sub="systemic contribution"/></Card>
        <Card><KPI label="Cascade Final Loss" value={`$${cascadeData[5]?.lossAccum||0}M`} sub="6-step chain" color={T.orange}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Default Chain Visualizer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cascadeData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="step" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip content={({active,payload})=>active&&payload?.[0]?<div style={{background:'#fff',border:`1px solid ${T.border}`,padding:8,borderRadius:6,fontSize:11,fontFamily:T.mono}}><div style={{fontWeight:700}}>{payload[0].payload.event}</div><div>Trigger: {payload[0].payload.trigger}</div><div>Cumulative Loss: ${payload[0].value}M</div></div>:null}/>
              <Area type="stepAfter" dataKey="lossAccum" fill={T.red+'33'} stroke={T.red} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
            {CHAIN_STEPS.map((s,i)=><div key={i} style={{padding:10,borderRadius:6,background:i<2?T.amber+'11':i<4?T.orange+'11':T.red+'11',border:`1px solid ${i<2?T.amber:i<4?T.orange:T.red}33`,fontSize:11}}>
              <div style={{fontWeight:700,color:T.navy}}>Step {s.step}: {s.event}</div>
              <div style={{color:T.textSec}}>{s.trigger}</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Sector Domino Map</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {ENTITIES.map(e=><div key={e.id} onClick={()=>setSelectedEntity(e.id)} style={{padding:14,borderRadius:8,border:`2px solid ${selectedEntity===e.id?T.navy:T.border}`,background:selectedEntity===e.id?T.navy+'08':T.surface,cursor:'pointer',transition:'all 0.2s'}}>
              <div style={{fontWeight:700,fontSize:13,color:T.navy}}>{e.name}</div>
              <div style={{fontSize:11,color:T.textSec}}>{e.sector}</div>
              <div style={{fontSize:20,fontFamily:T.mono,fontWeight:700,color:e.pd>0.15?T.red:e.pd>0.10?T.orange:T.green,margin:'4px 0'}}>{(e.pd*100).toFixed(0)}% PD</div>
              <div style={{fontSize:10,color:T.textMut}}>Connects: {e.interconnections.join(', ')}</div>
            </div>)}
          </div>
          {selectedEntity && (()=>{const e=ENTITIES.find(x=>x.id===selectedEntity); return e?<div style={{marginTop:12,padding:12,background:T.navy+'08',borderRadius:6,fontSize:12}}>
            <strong>{e.name}</strong> &mdash; Default cascades to: {e.interconnections.map(c=>ENTITIES.find(x=>x.id===c)?.name).join(' &rarr; ')}. Total downstream exposure: ${e.interconnections.reduce((s,c)=>s+(ENTITIES.find(x=>x.id===c)?.exposure||0),0)}M
          </div>:null})()}
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Systemic Risk Contribution (Delta CoVaR)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ENTITIES.sort((a,b)=>b.deltaCoVaR-a.deltaCoVaR)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`${(v*100).toFixed(1)}%`}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={140}/>
              <Tooltip formatter={v=>`${(v*100).toFixed(2)}%`} contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="deltaCoVaR" name="Delta CoVaR" fill={T.purple}>
                {ENTITIES.map((e,i)=><Cell key={i} fill={e.deltaCoVaR>0.05?T.red:e.deltaCoVaR>0.03?T.orange:T.blue}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:12,background:T.purple+'11',borderRadius:6,fontSize:12,color:T.textSec}}>
            <strong>Delta CoVaR</strong> measures systemic risk contribution: the change in Value-at-Risk of the financial system conditional on an entity being in distress. Higher values indicate greater contagion potential.
          </div>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Concentration Risk Limits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={CONC_LIMITS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:10}} angle={-20}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="currentExposure" name="Current ($M)" fill={T.navy}/><Bar dataKey="limit" name="Limit ($M)" fill={T.border}/>
              <Line type="monotone" dataKey="utilization" name="Utilization %" stroke={T.red} yAxisId={0} dot={{r:4}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Loan Loss Cascade</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={loanLoss}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-15}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="el" name="Expected Loss ($M)" fill={T.orange}/><Bar dataKey="uel" name="Unexpected Loss ($M)" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:12,color:T.textSec,marginTop:8}}>EL = Exposure x PD x LGD x Severity | UEL = EL x 2.5 (99.9th percentile multiplier)</div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Capital Impact Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ENTITIES.sort((a,b)=>b.capitalHit-a.capitalHit)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-15}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
              <Bar dataKey="capitalHit" name="Capital Hit ($M)">
                {ENTITIES.map((e,i)=><Cell key={i} fill={e.capitalHit>200?T.red:e.capitalHit>100?T.orange:T.amber}/>)}
              </Bar>
              <ReferenceLine y={200} stroke={T.red} strokeDasharray="5 5" label={{value:'CET1 Threshold',fill:T.red,fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Stress Results</button>
            <button style={{padding:'8px 16px',background:T.red+'11',color:T.red,border:`1px solid ${T.red}33`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Trigger Alert</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Cascading default model based on Eisenberg-Noe network clearing framework. Delta CoVaR per Adrian & Brunnermeier (2016). Severity multiplier scales all PDs and LGDs linearly. Carbon price transmission assumed via covenant stress on leverage and interest coverage ratios.
      </div>
    </div>
  );
}
