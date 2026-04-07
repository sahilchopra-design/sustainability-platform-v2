import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['NETs Overview','DAC Cost Trajectory','BECCS Viability','Enhanced Weathering','Ocean-Based CDR','NET Portfolio Builder'];

const NETS = [
  { name:'Direct Air Capture (DAC)', cost2024:400, cost2030:200, cost2040:100, scalability:5.0, permanence:10000, trl:7, coBenefits:'Minimal land use', risks:'Energy intensive, high cost', color:T.blue },
  { name:'BECCS', cost2024:120, cost2030:90, cost2040:70, scalability:3.5, permanence:10000, trl:6, coBenefits:'Bioenergy co-production', risks:'Land competition, biomass sustainability', color:T.green },
  { name:'Enhanced Weathering', cost2024:80, cost2030:50, cost2040:30, scalability:4.0, permanence:100000, trl:4, coBenefits:'Soil improvement, ocean alkalinity', risks:'MRV challenges, slow kinetics', color:T.orange },
  { name:'Ocean Alkalinity Enhancement', cost2024:150, cost2030:80, cost2040:50, scalability:10.0, permanence:100000, trl:3, coBenefits:'Coral reef protection', risks:'Marine ecosystem impacts, MRV', color:T.teal },
  { name:'Biochar', cost2024:60, cost2030:45, cost2040:35, scalability:2.0, permanence:1000, trl:7, coBenefits:'Soil carbon, crop yields', risks:'Scalability limits, permanence variability', color:'#854d0e' },
  { name:'Soil Carbon Sequestration', cost2024:30, cost2030:25, cost2040:20, scalability:3.0, permanence:100, trl:8, coBenefits:'Agricultural productivity', risks:'Saturation, reversibility, MRV', color:T.sage },
];

const dacCostCurve = Array.from({length:27},(_, i)=>{
  const yr = 2024+i;
  return { year:yr, optimistic:Math.round(400*Math.exp(-0.06*(yr-2024))), base:Math.round(400*Math.exp(-0.045*(yr-2024))), conservative:Math.round(400*Math.exp(-0.03*(yr-2024))) };
});

const beccsData = [
  { feedstock:'Woody Biomass', cost:90, efficiency:35, captureRate:90, landUse:2.5, lcoe:85 },
  { feedstock:'Agricultural Residues', cost:75, efficiency:30, captureRate:85, landUse:0.5, lcoe:95 },
  { feedstock:'Municipal Waste', cost:110, efficiency:25, captureRate:80, landUse:0.1, lcoe:120 },
  { feedstock:'Energy Crops', cost:100, efficiency:32, captureRate:88, landUse:5.0, lcoe:90 },
  { feedstock:'Algae', cost:180, efficiency:20, captureRate:75, landUse:0.3, lcoe:200 },
];

const weatheringData = [
  { mineral:'Basalt', costPerTon:35, reactivity:'Medium', availability:'Very High', co2PerTon:0.3, region:'Global' },
  { mineral:'Olivine', costPerTon:55, reactivity:'High', availability:'Medium', co2PerTon:0.6, region:'Norway, SE Asia' },
  { mineral:'Wollastonite', costPerTon:80, reactivity:'Very High', availability:'Low', co2PerTon:0.45, region:'India, Finland' },
  { mineral:'Serpentine', costPerTon:40, reactivity:'Low', availability:'High', co2PerTon:0.25, region:'Global' },
];

const oceanCDR = [
  { method:'Ocean Alkalinity Enhancement', mechanism:'Add alkaline minerals to seawater', potential:2.0, cost:80, readiness:'Early Pilot', risk:'Medium' },
  { method:'Electrochemical Ocean CDR', mechanism:'Remove CO2 via electrochemistry', potential:1.5, cost:150, readiness:'Lab Scale', risk:'High' },
  { method:'Seaweed Sinking', mechanism:'Grow and sink macroalgae', potential:0.5, cost:100, readiness:'Pilot', risk:'Medium' },
  { method:'Artificial Upwelling', mechanism:'Bring nutrient-rich water to surface', potential:0.3, cost:200, readiness:'Concept', risk:'Very High' },
];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function NegativeEmissionsTechPage(){
  const [tab,setTab]=useState(0);
  const [portfolioBudget,setPortfolioBudget]=useState(500);
  const [portfolioAlloc,setPortfolioAlloc]=useState([25,20,20,15,10,10]);

  const totalScalability = NETS.reduce((s,n)=>s+n.scalability,0);
  const avgCost2030 = Math.round(NETS.reduce((s,n)=>s+n.cost2030,0)/NETS.length);

  const portfolioResult = useMemo(()=>{
    const totalPct = portfolioAlloc.reduce((s,a)=>s+a,0);
    return NETS.map((n,i)=>({ ...n, alloc:portfolioAlloc[i], spend:Math.round(portfolioBudget*portfolioAlloc[i]/totalPct), removal:+((portfolioBudget*portfolioAlloc[i]/totalPct)/n.cost2030*1000).toFixed(1) }));
  },[portfolioBudget,portfolioAlloc]);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CL5" label="Negative Emissions Technology Landscape" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Negative Emissions Technology Assessment</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>6 NETs: cost trajectories, scalability potential, permanence, and portfolio optimization</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Technologies Assessed" value={NETS.length} sub="negative emissions"/></Card>
        <Card><KPI label="Total Scalability" value={`${totalScalability} GtCO\u2082/yr`} sub="theoretical max"/></Card>
        <Card><KPI label="Avg Cost 2030" value={`$${avgCost2030}/tCO\u2082`} sub="across all NETs"/></Card>
        <Card><KPI label="DAC Target" value="$100/t" sub="by 2040" color={T.blue}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>NETs Overview</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={NETS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9}} angle={-10}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar yAxisId="left" dataKey="cost2030" name="Cost 2030 ($/tCO\u2082)">{NETS.map((n,i)=><Cell key={i} fill={n.color}/>)}</Bar>
              <Line yAxisId="right" type="monotone" dataKey="scalability" name="Scalability (GtCO\u2082/yr)" stroke={T.navy} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{overflowX:'auto',marginTop:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Technology','Cost Now','Cost 2030','Cost 2040','Scale (Gt/yr)','Permanence','TRL'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec}}>{h}</th>)}</tr></thead>
              <tbody>{NETS.map((n,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px',fontWeight:600,color:n.color}}>{n.name}</td>
                <td>${n.cost2024}</td><td>${n.cost2030}</td><td>${n.cost2040}</td>
                <td>{n.scalability}</td><td>{n.permanence>=10000?'10,000+':n.permanence}y</td><td>{n.trl}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>DAC Cost Trajectory ($/tCO&#8322;)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dacCostCurve}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis domain={[0,450]} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Area type="monotone" dataKey="conservative" name="Conservative" fill={T.red+'22'} stroke={T.red}/>
              <Area type="monotone" dataKey="base" name="Base Case" fill={T.amber+'22'} stroke={T.amber}/>
              <Area type="monotone" dataKey="optimistic" name="Optimistic" fill={T.green+'22'} stroke={T.green}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.blue+'08',borderRadius:6,fontSize:12,color:T.textSec}}>
            DAC follows a Wright's Law learning curve: cost = C&#8320; x N^(-b) where b = 0.15 (optimistic) to 0.08 (conservative). At 15% learning rate, costs reach $100/tCO&#8322; after ~50 Mt cumulative deployment.
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>BECCS Viability by Feedstock</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={beccsData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="feedstock" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="cost" name="Cost ($/tCO\u2082)" fill={T.orange}/><Bar dataKey="captureRate" name="Capture Rate %" fill={T.green}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{overflowX:'auto',marginTop:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Feedstock','Cost ($/t)','Efficiency','Capture %','Land Use (ha/kt)','LCOE ($/MWh)'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{beccsData.map((b,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px',fontWeight:600}}>{b.feedstock}</td><td>${b.cost}</td><td>{b.efficiency}%</td>
                <td>{b.captureRate}%</td><td>{b.landUse}</td><td>${b.lcoe}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Enhanced Weathering Minerals</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weatheringData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="mineral" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="costPerTon" name="Cost ($/t mineral)" fill={T.orange}/><Bar dataKey="co2PerTon" name="CO\u2082 per ton mineral" fill={T.green}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:12}}>
            {weatheringData.map((w,i)=><div key={i} style={{padding:10,borderRadius:6,border:`1px solid ${T.border}`,textAlign:'center'}}>
              <div style={{fontWeight:700,fontSize:13,color:T.navy}}>{w.mineral}</div>
              <div style={{fontSize:11,color:T.textSec}}>Reactivity: {w.reactivity}</div>
              <div style={{fontSize:11,color:T.textMut}}>Avail: {w.availability} | Region: {w.region}</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Ocean-Based CDR Methods</h3>
          <div style={{display:'grid',gap:12}}>
            {oceanCDR.map((o,i)=><div key={i} style={{display:'flex',gap:16,padding:14,borderRadius:8,border:`1px solid ${T.border}`,alignItems:'center'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:T.navy}}>{o.method}</div>
                <div style={{fontSize:12,color:T.textSec}}>{o.mechanism}</div>
                <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Readiness: {o.readiness} | Risk: {o.risk}</div>
              </div>
              <div style={{textAlign:'center',minWidth:80}}>
                <div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:T.teal}}>{o.potential} Gt/yr</div>
                <div style={{fontSize:10,color:T.textMut}}>${o.cost}/tCO&#8322;</div>
              </div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>NET Portfolio Builder</h3>
          <label style={{fontSize:12,color:T.textSec}}>Annual Budget ($M): <input type="range" min={100} max={2000} step={50} value={portfolioBudget} onChange={e=>setPortfolioBudget(+e.target.value)} style={{width:200}}/> <span style={{fontFamily:T.mono}}>${portfolioBudget}M</span></label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
            {NETS.map((n,i)=><div key={i} style={{padding:10,borderRadius:6,border:`1px solid ${n.color}33`,background:n.color+'06'}}>
              <div style={{fontWeight:600,fontSize:12,color:n.color}}>{n.name}</div>
              <label style={{fontSize:11,color:T.textSec}}>Alloc %: <input type="range" min={0} max={50} value={portfolioAlloc[i]} onChange={e=>{const na=[...portfolioAlloc];na[i]=+e.target.value;setPortfolioAlloc(na);}} style={{width:80}}/> {portfolioAlloc[i]}%</label>
              <div style={{fontFamily:T.mono,fontSize:12,marginTop:4}}>Spend: ${portfolioResult[i]?.spend||0}M | Removal: {portfolioResult[i]?.removal||0} ktCO&#8322;</div>
            </div>)}
          </div>
          <div style={{marginTop:12,padding:12,background:T.navy+'08',borderRadius:6}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>Portfolio Summary</div>
            <div style={{fontSize:12,color:T.textSec}}>Total Removal: {Math.round(portfolioResult.reduce((s,p)=>s+p.removal,0))} ktCO&#8322;/yr | Weighted Avg Cost: ${Math.round(portfolioBudget*1000/Math.max(1,portfolioResult.reduce((s,p)=>s+p.removal,0)))}/tCO&#8322;</div>
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Portfolio</button>
            <button style={{padding:'8px 16px',background:T.green+'22',color:T.green,border:`1px solid ${T.green}33`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Optimize Allocation</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> NET cost curves from IPCC AR6 WGIII Ch. 12 and National Academies Negative Emissions Technologies report. DAC learning rates from Climeworks/Carbon Engineering published data. BECCS viability from IIASA/FAOSTAT land-use models. Enhanced weathering from Project Vesta and Leverhulme Centre research. Ocean CDR from NASEM Ocean-Based CDR report 2024.
      </div>
    </div>
  );
}
