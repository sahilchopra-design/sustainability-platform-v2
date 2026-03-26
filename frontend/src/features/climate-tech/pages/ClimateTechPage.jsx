import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const tblStyle={width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle={border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle={border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle={marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

const seed = 118;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS = ['#059669','#10b981','#34d399','#f59e0b','#0284c7','#7c3aed','#f97316','#ef4444'];

const TECHNOLOGIES = ['Utility-Scale Solar PV','Offshore Wind','Green Hydrogen (PEM)','Direct Air Capture','Battery Storage (Li-ion)','Geothermal Enhanced','Nuclear (SMR)','Carbon Capture (CCUS)','Long Duration Storage','Sustainable Aviation Fuel','Green Ammonia','Heat Pumps','EV Battery (Next Gen)','Solid State Batteries','Floating Offshore Wind','Wave & Tidal','Bioenergy + CCS (BECCS)','Fusion Power','Hydrogen Fuel Cells','Green Steel (DRI-H2)'];
const STAGES = ['seed','early','growth','late'];
const GEOGRAPHIES = ['Europe','North America','China','India','Asia Pacific','Latin America','Middle East','Africa','Global','Southeast Asia'];
const TABS = ['Technology Profile','Deployment Gap','Investment Landscape','Learning Curve','Portfolio Fit'];

function Tab1({technology,stage,geography}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const trl=Math.round(4+rng(1)*5);
  const mac=+(20+rng(2)*280).toFixed(0);
  const abatement=+(0.1+rng(3)*8.9).toFixed(1);
  const lr=+(8+rng(4)*22).toFixed(0);
  const years=[2024,2026,2028,2030,2032,2035,2040,2045,2050];
  const costData=years.map((y,i)=>({year:y, cost: Math.max(5, mac*(1-lr/100)**((y-2024)/2+i*0.1)) }));
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/climate-tech/assess-technology',{technology,stage,geography}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[technology,stage,geography]);
  return (
    <div>
      <Section title="Technology Assessment">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Assessing…':'Assess Technology'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Technology Readiness Level" value={`TRL ${trl}`} sub={`${trl>=7?'Commercial ready':trl>=4?'Development':'Early R&D'}`} />
        <KpiCard label="Marginal Abatement Cost" value={`$${mac}/tCO₂`} sub="Current cost of abatement" />
        <KpiCard label="Abatement Potential" value={`${abatement} GtCO₂/yr`} sub="Global maximum by 2050" />
        <KpiCard label="Learning Rate" value={`${lr}%`} sub="Cost reduction per doubling of capacity" />
      </Row>
      <Section title={`Cost Trajectory 2024–2050 — ${technology} ($/tCO₂ or $/unit)`}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis unit="$/t" tickFormatter={v=>v.toFixed(0)} />
            <Tooltip formatter={v=>`$${v.toFixed(0)}`} />
            <Bar dataKey="cost" name="Cost" fill="#059669">
              {costData.map((_,i)=><Cell key={i} fill={`hsl(${158+i*5},72%,${35+i*4}%)`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2({technology}) {
  const years=[2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];
  const baseCapacity=Math.round(20+rng(10)*80);
  const lineData=years.map((y,i)=>({
    year:y,
    actual: y<=2024?Math.round(baseCapacity*(1+i*0.18+rng(i+11)*0.1)):null,
    nze_target: Math.round(baseCapacity*(1+i*0.35)),
  }));
  const currentActual=lineData.find(d=>d.year===2024)?.actual||100;
  const nzeTarget2030=lineData.find(d=>d.year===2030)?.nze_target||400;
  const gap=((nzeTarget2030-currentActual)/nzeTarget2030*100).toFixed(0);
  return (
    <div>
      <Row>
        <KpiCard label="2024 Installed Capacity" value={`${currentActual} GW`} sub={`${technology}`} />
        <KpiCard label="IEA NZE Target 2030" value={`${nzeTarget2030} GW`} sub="Net Zero Emissions by 2050 scenario" />
        <KpiCard label="Deployment Gap" value={`${gap}%`} sub="Below NZE trajectory" />
        <KpiCard label="Required CAGR 2024–30" value={`${(Math.pow(nzeTarget2030/currentActual,1/6)-1)*100|0}%`} sub="To close NZE gap by 2030" />
      </Row>
      <Section title={`Actual vs IEA NZE Target Deployment 2020–2030 (GW) — ${technology}`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis unit=" GW" />
            <Tooltip formatter={v=>v?`${v} GW`:'—'} />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#059669" strokeWidth={2.5} name="Actual Deployment" connectNulls={false} dot={{r:4}} />
            <Line type="monotone" dataKey="nze_target" stroke="#ef4444" strokeDasharray="6 3" strokeWidth={2} name="IEA NZE Target" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab3({geography}) {
  const vcYears=['2020','2021','2022','2023','2024'].map((y,i)=>({
    year:y,
    deals: Math.round(80+i*60+rng(i+20)*100),
    value_bn: +(1+i*2.5+rng(i+21)*3).toFixed(1),
  }));
  const geoPie=['North America','Europe','Asia Pacific','China','Other'].map((g,i)=>({name:g, value:Math.round(15+rng(i+25)*35)}));
  const stageDist=['Seed','Series A','Series B','Series C','Late/PE'].map((s,i)=>({stage:s, count:Math.round(5+rng(i+30)*(30-i*4))}));
  return (
    <div>
      <Row>
        <KpiCard label="2024 VC Deals" value={vcYears[4].deals} sub="Climate tech deal count" />
        <KpiCard label="2024 Total Value" value={`$${vcYears[4].value_bn}bn`} sub="Climate tech investment" />
        <KpiCard label={`${geography} Share`} value={`${Math.round(10+rng(35)*35)}%`} sub="% of global climate tech VC" />
        <KpiCard label="Unicorns" value={Math.round(3+rng(36)*12)} sub="Climate tech $1bn+ companies" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))',gap:24}}>
        <Section title="VC Deal Volume 2020–2024">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vcYears}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" unit=" deals" />
              <YAxis yAxisId="right" orientation="right" unit="$bn" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="deals" fill="#059669" name="Deals" />
              <Line yAxisId="right" type="monotone" dataKey="value_bn" stroke="#0284c7" name="Value ($bn)" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Geography Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={geoPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
                {geoPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

function Tab4({technology}) {
  const [startCost]=useState(Math.round(100+rng(40)*900));
  const doublings=Array.from({length:10},(_,i)=>i+1);
  const lr=+(8+rng(41)*22).toFixed(0);
  const curveData=doublings.map((d,i)=>({
    doubling:`×${Math.pow(2,d)}`,
    cost: Math.round(startCost*Math.pow(1-lr/100,d)),
    milestone: [null,null,'Grid Parity',null,null,'Cost Competitive',null,null,'Mass Market',null][i],
  }));
  return (
    <div>
      <Row>
        <KpiCard label="Starting Cost" value={`$${startCost}`} sub="2024 baseline ($/unit or $/tCO₂)" />
        <KpiCard label="Learning Rate" value={`${lr}%`} sub="Cost reduction per capacity doubling" />
        <KpiCard label="2030 Cost Est." value={`$${Math.round(startCost*Math.pow(1-lr/100,3))}`} sub="At projected deployment pace" />
        <KpiCard label="Grid Parity" value={`~${2024+Math.round(3+rng(42)*8)}`} sub="Expected grid / market parity year" />
      </Row>
      <Section title={`Learning Curve — ${technology} Cost per Capacity Doubling`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={curveData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="doubling" tick={{fontSize:10}} />
            <YAxis scale="log" domain={['auto','auto']} tickFormatter={v=>Math.round(v)} />
            <Tooltip formatter={v=>`$${v}`} />
            <Legend />
            <Line type="monotone" dataKey="cost" stroke="#059669" strokeWidth={2.5} name="Technology Cost" dot={(props)=>{const {payload,cx,cy}=props; return payload.milestone?<circle cx={cx} cy={cy} r={6} fill="#ef4444" key={payload.doubling}/>:<circle cx={cx} cy={cy} r={3} fill="#059669" key={payload.doubling}/>; }} />
          </LineChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Key Doubling Milestones">
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {curveData.filter(d=>d.milestone).map((d,i)=>(<div key={i} style={{padding:'8px 12px',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:6,fontSize:13}}><span style={{fontWeight:600,color:'#065f46'}}>{d.milestone}</span><span style={{color:'#6b7280',marginLeft:8}}>at {d.doubling} capacity (${d.cost}/unit)</span></div>))}
        </div>
      </Section>
    </div>
  );
}

function Tab5({technology}) {
  const ctvcSectors=['Buildings','Transport','Energy','Industry','Agriculture','Land Use','Waste','Cross-cutting'].map((s,i)=>({sector:s, covered: rng(i+50)>0.35, score:Math.round(30+rng(i+51)*65)}));
  const taxData=['Climate Change Mitigation','Climate Change Adaptation','Water & Marine','Circular Economy','Pollution Prevention','Biodiversity'].map((o,i)=>({
    objective:o.split(' ')[0], alignment:Math.round(20+rng(i+56)*75), eligible:rng(i+57)>0.4,
  }));
  const totalAbatement=+(0.5+rng(60)*15).toFixed(1);
  return (
    <div>
      <Row>
        <KpiCard label="CTVC Sectors Covered" value={`${ctvcSectors.filter(s=>s.covered).length}/8`} sub="Clean Tech VC criteria" />
        <KpiCard label="EU Taxonomy Alignment" value={`${Math.round(taxData.reduce((s,t)=>s+t.alignment,0)/taxData.length)}%`} sub="Average across 6 objectives" />
        <KpiCard label="Abatement GtCO₂" value={`${totalAbatement} Gt`} sub="Combined annual potential by 2050" />
        <KpiCard label="Paris Compatible" value={rng(61)>0.4?'Yes':'Partial'} sub="1.5°C scenario alignment" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))',gap:24}}>
        <Section title="CTVC Sector Coverage Radar">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={ctvcSectors}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="sector" tick={{fontSize:10}} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
              <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="EU Taxonomy Alignment by Objective (%)">
          <table style={tblStyle}>
            <thead><tr>{['Objective','Alignment %','Eligible'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{taxData.map((t,i)=>(<tr key={i}>
              <td style={{...tdStyle,fontSize:12,fontWeight:500}}>{t.objective}</td>
              <td style={tdStyle}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:64,background:'#e5e7eb',borderRadius:9999,height:6}}><div style={{background:'#059669',height:6,borderRadius:9999,width:`${t.alignment}%`}} /></div>
                  <span style={{fontSize:12,fontFamily:'monospace'}}>{t.alignment}%</span>
                </div>
              </td>
              <td style={tdStyle}><Badge color={t.eligible?'green':'yellow'}>{t.eligible?'Yes':'Partial'}</Badge></td>
            </tr>))}</tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

export default function ClimateTechPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [technology,setTechnology]=useState('Utility-Scale Solar PV');
  const [stage,setStage]=useState('growth');
  const [geography,setGeography]=useState('Europe');
  const panels=[<Tab1 technology={technology} stage={stage} geography={geography}/>,<Tab2 technology={technology}/>,<Tab3 geography={geography}/>,<Tab4 technology={technology}/>,<Tab5 technology={technology}/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827'}}>Climate Technology Assessor</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>TRL · MAC · Learning Curves · IEA NZE Targets · VC Landscape · EU Taxonomy · CTVC · E118</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Sel label="Technology" value={technology} onChange={e=>setTechnology(e.target.value)}>{TECHNOLOGIES.map(o=><option key={o}>{o}</option>)}</Sel>
            <Sel label="Stage" value={stage} onChange={e=>setStage(e.target.value)}>{STAGES.map(o=><option key={o}>{o}</option>)}</Sel>
            <Sel label="Geography" value={geography} onChange={e=>setGeography(e.target.value)}>{GEOGRAPHIES.map(o=><option key={o}>{o}</option>)}</Sel>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setActiveTab(i)} style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',color:activeTab===i?'#059669':'#6b7280'}}>{t}</button>))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>{panels[activeTab]}</div>
      </div>
    </div>
  );
}
