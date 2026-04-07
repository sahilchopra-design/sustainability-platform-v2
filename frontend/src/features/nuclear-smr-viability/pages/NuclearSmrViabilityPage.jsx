import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Technology Comparison','Cost Learning Curves','Deployment Pipeline','Regulatory Approval Tracker','Grid Services Value','Investment Thesis'];

const DESIGNS = [
  { name:'NuScale VOYGR', vendor:'NuScale Power', type:'iPWR', capacityMW:77, modulesPerPlant:6, totalMW:462, lcoe2024:89, lcoe2030:65, lcoe2040:48, constructionMo:36, trl:8, regStatus:'NRC Design Certified', country:'USA', capexPerKW:6500, h2Capable:false, loadFollow:true, color:T.blue },
  { name:'BWRX-300', vendor:'GE-Hitachi', type:'BWR', capacityMW:300, modulesPerPlant:1, totalMW:300, lcoe2024:75, lcoe2030:58, lcoe2040:42, constructionMo:24, trl:7, regStatus:'NRC Review', country:'USA/Canada', capexPerKW:5200, h2Capable:true, loadFollow:true, color:T.green },
  { name:'Rolls-Royce SMR', vendor:'Rolls-Royce', type:'PWR', capacityMW:470, modulesPerPlant:1, totalMW:470, lcoe2024:82, lcoe2030:60, lcoe2040:45, constructionMo:48, trl:6, regStatus:'ONR GDA Step 3', country:'UK', capexPerKW:5800, h2Capable:true, loadFollow:true, color:T.purple },
  { name:'Xe-100', vendor:'X-energy', type:'HTGR', capacityMW:80, modulesPerPlant:4, totalMW:320, lcoe2024:95, lcoe2030:68, lcoe2040:50, constructionMo:30, trl:6, regStatus:'NRC Pre-Application', country:'USA', capexPerKW:7200, h2Capable:true, loadFollow:false, color:T.orange },
  { name:'Natrium', vendor:'TerraPower', type:'SFR+Storage', capacityMW:345, modulesPerPlant:1, totalMW:345, lcoe2024:85, lcoe2030:62, lcoe2040:46, constructionMo:42, trl:5, regStatus:'NRC Pre-Application', country:'USA', capexPerKW:6800, h2Capable:true, loadFollow:true, color:T.red },
];

const REG_TRACKER = [
  { regulator:'NRC (USA)', designs:['NuScale VOYGR','BWRX-300','Xe-100','Natrium'], status:['Certified','Under Review','Pre-Application','Pre-Application'], timeline:['Completed','2026','2028','2028'] },
  { regulator:'ONR (UK)', designs:['Rolls-Royce SMR','BWRX-300'], status:['GDA Step 3','Expression of Interest'], timeline:['2027','2029'] },
  { regulator:'CNSC (Canada)', designs:['BWRX-300','Xe-100'], status:['Vendor Design Review','Pre-Licensing'], timeline:['2025','2027'] },
  { regulator:'ASN (France)', designs:['Nuward SMR'], status:['Basic Design Review'], timeline:['2030'] },
];

const PIPELINE = [
  { project:'Carbon Free Power Project', location:'Idaho, USA', design:'NuScale VOYGR', capacity:'462 MW', fid:2024, cod:2030, status:'Under Development' },
  { project:'Darlington New Nuclear', location:'Ontario, Canada', design:'BWRX-300', capacity:'300 MW', fid:2025, cod:2029, status:'Site Preparation' },
  { project:'Wylfa SMR', location:'Wales, UK', design:'Rolls-Royce SMR', capacity:'470 MW', fid:2026, cod:2032, status:'Planning' },
  { project:'Kemmerer Plant', location:'Wyoming, USA', design:'Natrium', capacity:'345 MW', fid:2024, cod:2030, status:'Construction' },
  { project:'DOW Chemical', location:'Texas, USA', design:'Xe-100', capacity:'320 MW', fid:2026, cod:2031, status:'Feasibility' },
  { project:'Kozloduy SMR', location:'Bulgaria', design:'NuScale VOYGR', capacity:'462 MW', fid:2027, cod:2033, status:'MOU Signed' },
];

const GRID_SERVICES = [
  { service:'Baseload Power', value:45, desc:'24/7 firm generation', smrAdvantage:'High' },
  { service:'Load Following', value:35, desc:'Ramp 5%/min capability', smrAdvantage:'Medium' },
  { service:'H\u2082 Co-production', value:25, desc:'Process heat for electrolysis', smrAdvantage:'High' },
  { service:'District Heating', value:15, desc:'CHP applications', smrAdvantage:'Medium' },
  { service:'Desalination', value:20, desc:'Multi-effect distillation', smrAdvantage:'High' },
  { service:'Grid Inertia', value:30, desc:'Synchronous generation', smrAdvantage:'High' },
];

const radarData = DESIGNS.map(d=>({ name:d.name, Cost:Math.round(100-d.lcoe2030), Capacity:Math.round(d.totalMW/5), Timeline:Math.round(100-d.constructionMo*2), TRL:d.trl*10, Versatility:(d.h2Capable?20:0)+(d.loadFollow?20:0)+40 }));

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function NuclearSmrViabilityPage(){
  const [tab,setTab]=useState(0);
  const [selectedDesign,setSelectedDesign]=useState(0);

  const design = DESIGNS[selectedDesign];
  const totalPipeline = PIPELINE.reduce((s,p)=>s+parseInt(p.capacity),0);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CL4" label="Nuclear SMR Breakthrough Scenarios" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Nuclear SMR Viability Assessment</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>5 leading SMR designs: cost learning curves, regulatory status, deployment pipeline, and investment analysis</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {DESIGNS.map((d,i)=><button key={i} onClick={()=>setSelectedDesign(i)} style={{padding:'6px 12px',borderRadius:6,border:`2px solid ${selectedDesign===i?d.color:T.border}`,background:selectedDesign===i?d.color+'11':'#fff',color:d.color,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>{d.name}</button>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Designs Tracked" value={DESIGNS.length} sub="global SMR programs"/></Card>
        <Card><KPI label="Pipeline Capacity" value={`${(totalPipeline/1000).toFixed(1)} GW`} sub={`${PIPELINE.length} projects`}/></Card>
        <Card><KPI label={`${design.name} LCOE 2030`} value={`$${design.lcoe2030}/MWh`} sub={`from $${design.lcoe2024} today`} color={T.green}/></Card>
        <Card><KPI label="First SMR Online" value="2029" sub="BWRX-300 Darlington"/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Technology Comparison</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}><PolarGrid/><PolarAngleAxis dataKey="name" tick={{fontSize:9}}/><PolarRadiusAxis tick={{fontSize:9}}/>
                {DESIGNS.map((d,i)=><Radar key={d.name} name={d.name} dataKey={Object.keys(radarData[0]).filter(k=>k!=='name')[i%5]} stroke={d.color} fill={d.color} fillOpacity={0.15}/>)}
                <Legend/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.mono}}>
                <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Design','Type','MW','LCOE 2030','Build','TRL','H\u2082'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec}}>{h}</th>)}</tr></thead>
                <tbody>{DESIGNS.map((d,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:selectedDesign===i?d.color+'08':undefined}}>
                  <td style={{padding:'4px 6px',fontWeight:600,color:d.color}}>{d.name}</td><td>{d.type}</td><td>{d.totalMW}</td>
                  <td>${d.lcoe2030}</td><td>{d.constructionMo}mo</td><td>{d.trl}</td><td>{d.h2Capable?'Yes':'No'}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Cost Learning Curves (LCOE $/MWh)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={[2024,2026,2028,2030,2035,2040].map(yr=>({year:yr,...Object.fromEntries(DESIGNS.map(d=>{const t=(yr-2024)/16; return [d.name,Math.round(d.lcoe2024+(d.lcoe2040-d.lcoe2024)*t)];}))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11}}/><YAxis domain={[30,100]} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              {DESIGNS.map(d=><Line key={d.name} type="monotone" dataKey={d.name} stroke={d.color} strokeWidth={2} dot={{r:3}}/>)}
            </LineChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.green+'08',borderRadius:6,fontSize:12,color:T.textSec}}>
            LCOE reduction driven by factory modular construction, nth-of-a-kind learning (15-20% per doubling), and regulatory streamlining. Target: competitive with combined cycle gas ($45-55/MWh) by 2035.
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Deployment Pipeline</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Project','Location','Design','Capacity','FID','COD','Status'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{PIPELINE.map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{p.project}</td><td>{p.location}</td><td>{p.design}</td><td style={{fontFamily:T.mono}}>{p.capacity}</td>
                <td>{p.fid}</td><td>{p.cod}</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:p.status==='Construction'?T.green+'22':p.status==='Site Preparation'?T.blue+'22':T.amber+'22',color:p.status==='Construction'?T.green:p.status==='Site Preparation'?T.blue:T.amber}}>{p.status}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Regulatory Approval Tracker</h3>
          {REG_TRACKER.map((r,i)=><div key={i} style={{marginBottom:16}}>
            <h4 style={{color:T.navy,fontSize:13,margin:'0 0 8px',borderBottom:`1px solid ${T.border}`,paddingBottom:4}}>{r.regulator}</h4>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${r.designs.length},1fr)`,gap:8}}>
              {r.designs.map((d,j)=><div key={j} style={{padding:10,borderRadius:6,border:`1px solid ${T.border}`,textAlign:'center'}}>
                <div style={{fontWeight:600,fontSize:12,color:T.navy}}>{d}</div>
                <div style={{marginTop:4}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:r.status[j]==='Certified'?T.green+'22':r.status[j].includes('Review')?T.blue+'22':T.amber+'22',color:r.status[j]==='Certified'?T.green:r.status[j].includes('Review')?T.blue:T.amber}}>{r.status[j]}</span></div>
                <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Target: {r.timeline[j]}</div>
              </div>)}
            </div>
          </div>)}
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Grid Services Value Stack</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={GRID_SERVICES} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`$${v}/MWh`}/><YAxis dataKey="service" type="category" tick={{fontSize:10}} width={130}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
              <Bar dataKey="value" name="Value ($/MWh)">{GRID_SERVICES.map((g,i)=><Cell key={i} fill={g.smrAdvantage==='High'?T.green:T.amber}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:12,color:T.textSec,marginTop:8}}>Total value stack: ${GRID_SERVICES.reduce((s,g)=>s+g.value,0)}/MWh when all services are monetized. SMRs uniquely positioned for multi-product revenue streams.</div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Investment Thesis</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{padding:16,borderRadius:8,background:T.green+'08',border:`1px solid ${T.green}33`}}>
              <h4 style={{color:T.green,margin:'0 0 8px'}}>Bull Case</h4>
              <ul style={{fontSize:12,color:T.textSec,paddingLeft:16,margin:0,lineHeight:1.8}}>
                <li>LCOE reaches gas parity by 2033</li><li>Factory construction cuts build time 50%</li>
                <li>H&#8322; co-production adds $15-25/MWh revenue</li><li>Regulatory harmonization across OECD</li>
                <li>AI/data center demand drives baseload premium</li>
              </ul>
            </div>
            <div style={{padding:16,borderRadius:8,background:T.red+'08',border:`1px solid ${T.red}33`}}>
              <h4 style={{color:T.red,margin:'0 0 8px'}}>Bear Case</h4>
              <ul style={{fontSize:12,color:T.textSec,paddingLeft:16,margin:0,lineHeight:1.8}}>
                <li>First-of-a-kind cost overruns persist</li><li>Public opposition delays siting</li>
                <li>Solar+storage undercuts SMR economics</li><li>Regulatory timelines extend 3-5 years</li>
                <li>Supply chain for HALEU fuel uncertain</li>
              </ul>
            </div>
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Analysis</button>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Add to Watchlist</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> SMR cost and LCOE projections from NEA/IEA Projected Costs of Generating Electricity 2024. Regulatory status from NRC, ONR, CNSC public records. Learning rates based on MIT Future of Nuclear Energy study. Grid services valuation from Lazard LCOE+ analysis.
      </div>
    </div>
  );
}
