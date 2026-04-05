import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Cost Estimator','Liability by Asset Type','Funding Gap Analysis','Bond Adequacy','Regulatory Requirements','Timeline Planning'];

const ASSET_TYPES = [
  { type:'Coal Plant', unit:'$/kW', low:50, mid:100, high:150, count:12, totalCapacity:8400, provision:420, jurisdiction:'Multi' },
  { type:'Nuclear Plant', unit:'$/kW', low:500, mid:750, high:1000, count:4, totalCapacity:4200, provision:2100, jurisdiction:'NRC/ONR' },
  { type:'Oil Platform', unit:'$M/unit', low:10, mid:30, high:50, count:18, totalCapacity:18, provision:280, jurisdiction:'BSEE/OPRED' },
  { type:'Gas Pipeline', unit:'$M/km', low:1, mid:3, high:5, count:6, totalCapacity:1200, provision:1800, jurisdiction:'PHMSA/HSE' },
  { type:'Oil Refinery', unit:'$M/unit', low:80, mid:200, high:400, count:5, totalCapacity:5, provision:520, jurisdiction:'EPA/EA' },
  { type:'LNG Terminal', unit:'$M/unit', low:50, mid:120, high:250, count:3, totalCapacity:3, provision:180, jurisdiction:'FERC' },
  { type:'Gas Power Plant', unit:'$/kW', low:20, mid:40, high:70, count:15, totalCapacity:12000, provision:240, jurisdiction:'Multi' },
  { type:'Cement Plant', unit:'$M/unit', low:15, mid:35, high:60, count:8, totalCapacity:8, provision:140, jurisdiction:'EPA/EA' },
];

const JURISDICTIONS = [
  { name:'United States', regulator:'EPA/NRC/BSEE', requirement:'Full site remediation + financial assurance bond', deadline:'Asset retirement obligation (ARO)', strictness:85 },
  { name:'European Union', regulator:'ETS Directive / IED', requirement:'Permit surrender + soil decontamination', deadline:'EU Taxonomy phase-out dates', strictness:92 },
  { name:'United Kingdom', regulator:'OPRED/ONR/EA', requirement:'Decommissioning security agreement', deadline:'OSPAR Convention obligations', strictness:88 },
  { name:'Australia', regulator:'NOPSEMA/EPA', requirement:'Title holder responsibility + rehab bond', deadline:'State-specific timelines', strictness:78 },
  { name:'Canada', regulator:'CER/CNSC', requirement:'Financial guarantee + well abandonment', deadline:'Provincial regulator orders', strictness:82 },
];

const calcCost = (asset, scenario) => {
  const unitCost = scenario==='low'?asset.low:scenario==='mid'?asset.mid:asset.high;
  if(asset.unit==='$/kW') return Math.round(unitCost*asset.totalCapacity/1000);
  if(asset.unit==='$M/km') return Math.round(unitCost*asset.totalCapacity);
  return Math.round(unitCost*asset.totalCapacity);
};

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function DecommissioningCostEnginePage(){
  const [tab,setTab]=useState(0);
  const [costScenario,setCostScenario]=useState('mid');
  const [inflationRate,setInflationRate]=useState(3);
  const [planYear,setPlanYear]=useState(2030);

  const costs = useMemo(()=>ASSET_TYPES.map(a=>({...a,estimated:calcCost(a,costScenario),inflated:Math.round(calcCost(a,costScenario)*Math.pow(1+inflationRate/100,planYear-2026)),gap:Math.max(0,calcCost(a,costScenario)-a.provision)})),[costScenario,inflationRate,planYear]);
  const totalEstimated = costs.reduce((s,c)=>s+c.estimated,0);
  const totalProvision = costs.reduce((s,c)=>s+c.provision,0);
  const totalGap = Math.max(0,totalEstimated-totalProvision);
  const totalInflated = costs.reduce((s,c)=>s+c.inflated,0);

  const timelineData = useMemo(()=>Array.from({length:20},(_, i)=>{ const yr=2026+i; return { year:yr, cumCost:Math.round(totalEstimated*(1-Math.exp(-0.15*(i+1)))*Math.pow(1+inflationRate/100,i)), provision:Math.round(totalProvision*(1+0.05*i)) }; }),[totalEstimated,totalProvision,inflationRate]);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CK4" label="Decommissioning Cost Engine" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Decommissioning Liability Engine</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>Asset retirement obligation estimator with funding gap analysis and regulatory compliance tracking</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:T.textSec}}>Cost Scenario:</label>
        <select value={costScenario} onChange={e=>setCostScenario(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}><option value="low">Low</option><option value="mid">Mid</option><option value="high">High</option></select>
        <label style={{fontSize:12,color:T.textSec}}>Inflation: <input type="range" min={0} max={8} step={0.5} value={inflationRate} onChange={e=>setInflationRate(+e.target.value)} style={{width:100}}/> {inflationRate}%</label>
        <label style={{fontSize:12,color:T.textSec}}>Plan Year: <input type="range" min={2026} max={2050} value={planYear} onChange={e=>setPlanYear(+e.target.value)} style={{width:100}}/> {planYear}</label>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Total Estimated Cost" value={`$${(totalEstimated/1000).toFixed(1)}B`} sub={`${costScenario} scenario`}/></Card>
        <Card><KPI label="Current Provisions" value={`$${(totalProvision/1000).toFixed(1)}B`} sub="booked AROs"/></Card>
        <Card><KPI label="Funding Gap" value={`$${(totalGap/1000).toFixed(1)}B`} sub={`${Math.round(100*totalGap/totalEstimated)}% unfunded`} color={T.red}/></Card>
        <Card><KPI label="Inflated Cost ({planYear})" value={`$${(totalInflated/1000).toFixed(1)}B`} sub={`at ${inflationRate}% inflation`} color={T.orange}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Cost Estimator</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Asset Type','Unit Cost','Count','Capacity','Estimated ($M)','Inflated ($M)','Provision','Gap','Jurisdiction'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{costs.map((c,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{c.type}</td>
                <td>{c.unit}: {c[costScenario]}</td><td>{c.count}</td><td>{c.totalCapacity.toLocaleString()}</td>
                <td>${c.estimated}M</td><td>${c.inflated}M</td><td>${c.provision}M</td>
                <td style={{color:c.gap>0?T.red:T.green,fontWeight:700}}>{c.gap>0?`-$${c.gap}M`:'Funded'}</td>
                <td style={{fontSize:10}}>{c.jurisdiction}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Liability by Asset Type</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={costs.sort((a,b)=>b.estimated-a.estimated)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="type" tick={{fontSize:10}} angle={-15}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}M`}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="estimated" name="Estimated Cost" fill={T.orange}/><Bar dataKey="provision" name="Current Provision" fill={T.green}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Funding Gap Analysis</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={costs}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="type" tick={{fontSize:10}} angle={-15}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="gap" name="Funding Gap ($M)">
                {costs.map((c,i)=><Cell key={i} fill={c.gap>500?T.red:c.gap>100?T.orange:c.gap>0?T.amber:T.green}/>)}
              </Bar>
              <Line type="monotone" dataKey="estimated" name="Total Estimated" stroke={T.navy} strokeDasharray="5 5"/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.red+'08',borderRadius:6,fontSize:12,color:T.textSec}}>
            {costs.filter(c=>c.gap>0).length} of {costs.length} asset types have unfunded decommissioning liabilities totalling ${(totalGap/1000).toFixed(1)}B.
          </div>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Bond Adequacy Assessment</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={[{name:'Funded',value:totalProvision},{name:'Gap',value:totalGap}]} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`}>
                <Cell fill={T.green}/><Cell fill={T.red}/>
              </Pie><Tooltip/><Legend/></PieChart>
            </ResponsiveContainer>
            <div>
              <h4 style={{color:T.navy,fontSize:13,margin:'0 0 12px'}}>Bond Requirements</h4>
              {costs.slice(0,5).map((c,i)=><div key={i} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span>{c.type}</span><span style={{fontFamily:T.mono,color:c.gap>0?T.red:T.green}}>{c.gap>0?`Gap: $${c.gap}M`:'Adequate'}</span></div>
                <div style={{height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:c.provision>=c.estimated?T.green:T.orange,width:`${Math.min(100,100*c.provision/c.estimated)}%`}}/></div>
              </div>)}
            </div>
          </div>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Regulatory Requirements by Jurisdiction</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Jurisdiction','Regulator','Requirement','Deadline','Strictness'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{JURISDICTIONS.map((j,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{j.name}</td><td style={{fontFamily:T.mono,fontSize:11}}>{j.regulator}</td><td>{j.requirement}</td><td>{j.deadline}</td>
                <td><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:50,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:j.strictness>85?T.red:j.strictness>75?T.orange:T.amber,width:`${j.strictness}%`}}/></div><span style={{fontSize:10,fontFamily:T.mono}}>{j.strictness}/100</span></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Timeline Planning</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}M`}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Area type="monotone" dataKey="cumCost" name="Cumulative Cost ($M)" fill={T.red+'33'} stroke={T.red}/>
              <Area type="monotone" dataKey="provision" name="Provision Growth ($M)" fill={T.green+'33'} stroke={T.green}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Timeline</button>
            <button style={{padding:'8px 16px',background:T.orange+'22',color:T.orange,border:`1px solid ${T.orange}33`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Set Alert Thresholds</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Unit costs based on IEA decommissioning estimates (2024) and OECD Nuclear Energy Agency benchmarks. Inflation adjustment uses compound growth. Bond adequacy assessed against IFRS IAS 37 provision requirements and US GAAP ASC 410 Asset Retirement Obligations.
      </div>
    </div>
  );
}
