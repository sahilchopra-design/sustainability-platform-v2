import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const seed = 109;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;

const TABS = ['NDC Ambition','Carbon Price Gap','Fit for 55 / IRA','Policy Pipeline','Portfolio Impact'];

const JURISDICTIONS = ['EU','Germany','France','UK','USA','China','India','Brazil','Japan','Canada','Australia','South Korea','Mexico','South Africa','Indonesia','Turkey','Saudi Arabia','UAE','Argentina','Nigeria','Colombia','Vietnam','Poland','Netherlands','Sweden','Norway','Switzerland','Singapore','New Zealand','Chile'];
const SECTORS = ['Energy','Transport','Buildings','Industry','Agriculture','Waste','Finance','Technology'];

const tblStyle = {width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle = {border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle = {border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle = {marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

function Tab1({jurisdiction,sector}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const radarData = [
    {dim:'Ambition',    score: Math.round(40+rng(1)*55)},
    {dim:'Credibility', score: Math.round(35+rng(2)*60)},
    {dim:'Implementation', score: Math.round(30+rng(3)*65)},
    {dim:'Climate Finance', score: Math.round(25+rng(4)*70)},
    {dim:'Technology', score: Math.round(35+rng(5)*60)},
  ];
  const overall = Math.round(radarData.reduce((s,d)=>s+d.score,0)/radarData.length);
  const ndcYear = 2025+Math.round(rng(6)*5);
  const run = useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/climate-policy/assess-jurisdiction',{jurisdiction,sector}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[jurisdiction,sector]);
  return (
    <div>
      <Section title="NDC Assessment">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Assessing…':'Assess NDC Ambition'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Overall NDC Score" value={`${overall}/100`} sub={`${jurisdiction} composite`} />
        <KpiCard label="NDC Revision Due" value={ndcYear} sub="Next nationally determined contribution" />
        <KpiCard label="2030 Target" value={`-${Math.round(40+rng(7)*35)}%`} sub="vs 2005 baseline emissions" />
        <KpiCard label="Net Zero Year" value={`${2045+Math.round(rng(8)*15)}`} sub="Long-term strategy commitment" />
      </Row>
      <Section title="NDC 5-Dimension Radar">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="dim" tick={{fontSize:11}} />
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
            <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2({jurisdiction}) {
  const years = [2024,2026,2028,2030,2032,2035,2040,2045,2050];
  const lineData = years.map((y,i)=>({
    year: y,
    current: Math.round(30+i*8+rng(i+10)*15),
    nze_corridor_low: Math.round(80+i*20),
    nze_corridor_high: Math.round(100+i*25),
  }));
  const gapBps = [
    {year:2025, gap_bps: Math.round(50+rng(20)*100)},
    {year:2030, gap_bps: Math.round(100+rng(21)*150)},
    {year:2035, gap_bps: Math.round(180+rng(22)*200)},
    {year:2040, gap_bps: Math.round(250+rng(23)*250)},
    {year:2050, gap_bps: 0},
  ];
  return (
    <div>
      <Row>
        <KpiCard label="Current Carbon Price" value={`€${Math.round(30+rng(30)*70)}/t`} sub={`${jurisdiction} ETS/tax`} />
        <KpiCard label="NZE Price 2030" value={`€${Math.round(100+rng(31)*80)}/t`} sub="IEA NZE Scenario target" />
        <KpiCard label="Price Gap 2030" value={`€${Math.round(60+rng(32)*80)}/t`} sub="Current vs NZE corridor" />
        <KpiCard label="Policy Credibility" value={`${Math.round(50+rng(33)*40)}%`} sub="Implementation confidence score" />
      </Row>
      <Section title="Carbon Price — Current vs NZE Corridor 2024–2050 (€/t)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis unit="€/t" />
            <Tooltip formatter={v=>`€${v}/t`} />
            <Legend />
            <Line type="monotone" dataKey="current" stroke="#059669" strokeWidth={2} name={`${jurisdiction} Current`} />
            <Line type="monotone" dataKey="nze_corridor_low" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5} name="NZE Low" />
            <Line type="monotone" dataKey="nze_corridor_high" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} name="NZE High" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Carbon Price Gap to NZE Corridor (bps spread impact)">
        <table style={tblStyle}>
          <thead><tr>{['Year','Gap (€/t)','Transition Risk bps'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{gapBps.map((r,i)=>(<tr key={i}><td style={{...tdStyle,fontWeight:500}}>{r.year}</td><td style={{...tdStyle,fontFamily:'monospace',color:'#dc2626'}}>-€{Math.round(r.gap_bps*0.6)}/t</td><td style={{...tdStyle,fontFamily:'monospace',color:'#92400e'}}>+{r.gap_bps}bps</td></tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab3() {
  const fit55 = ['EU ETS Reform (MSR)','Carbon Border Adj. Mechanism','Renewable Energy Dir. III','Energy Efficiency Dir.','Fuel Quality (FuelEU Maritime)','Alternative Fuels Infra.','CO2 Cars/Vans','Land Use (LULUCF)','Effort Sharing Reg.','Social Climate Fund','Energy Tax Directive','ReFuelEU Aviation','CBAM (Phase-in 2026)'].map((r,i)=>({
    reg: r, impact: Math.round(50+rng(i+40)*300),
  }));
  const iraData = ['Clean Energy ITC','EV Tax Credits','H2 Production Credit','Carbon Capture (45Q)','Clean Manufacturing'].map((c,i)=>({
    credit: c, value: Math.round(10+rng(i+50)*80),
  }));
  return (
    <div>
      <Section title="Fit for 55 — 13 Regulations (Mt CO₂ Reduction by 2030)">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={fit55} layout="vertical" margin={{left:200}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" unit="Mt" />
            <YAxis type="category" dataKey="reg" tick={{fontSize:10}} />
            <Tooltip formatter={v=>`${v} Mt CO₂`} />
            <Bar dataKey="impact" fill="#059669" name="Emission Reduction (Mt)" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
      <Section title="US IRA — Clean Energy Tax Credits ($bn)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={iraData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="credit" tick={{fontSize:11}} />
            <YAxis unit="$bn" />
            <Tooltip formatter={v=>`$${v}bn`} />
            <Bar dataKey="value" fill="#0284c7" name="Credit Value ($bn)">
              {iraData.map((_,i)=><Cell key={i} fill={['#0284c7','#0ea5e9','#38bdf8','#7dd3fc','#bae6fd'][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab4({jurisdiction}) {
  const pipeline = [
    { name:'EU CBAM Full Phase-in', status:'Enacted', deadline:'Jan 2026', impact:'High', readiness:'Partial' },
    { name:'CSRD ESRS Wave 3', status:'Finalised', deadline:'Jan 2026', impact:'High', readiness:'Low' },
    { name:'EU Nature Restoration Law', status:'Enacted', deadline:'Aug 2024', impact:'Medium', readiness:'High' },
    { name:'EU Deforestation Reg. (EUDR)', status:'Enacted', deadline:'Dec 2025', impact:'High', readiness:'Partial' },
    { name:'UK ISSB Adoption (SUSR)', status:'Consultation', deadline:'2025', impact:'High', readiness:'Low' },
    { name:'SEC Climate Disclosure Rule', status:'Litigation Hold', deadline:'TBD', impact:'High', readiness:'Low' },
    { name:'IOSCO Sustainability Disclosure', status:'Finalised', deadline:'2025', impact:'Medium', readiness:'Partial' },
    { name:`${jurisdiction} Carbon Tax Escalation`, status:'In Force', deadline:'Annual', impact:'Medium', readiness:'High' },
    { name:'Basel III Endgame (US)', status:'Reproposed', deadline:'2025', impact:'High', readiness:'Partial' },
    { name:'EIOPA IORP Climate Stress', status:'Guidelines', deadline:'2025', impact:'Medium', readiness:'Partial' },
    { name:'IMO GHG Strategy 2023', status:'Adopted', deadline:'2030', impact:'Medium', readiness:'Low' },
    { name:'EU Taxonomy Vol. Act (ISSB)', status:'Proposed', deadline:'2026', impact:'Low', readiness:'High' },
  ];
  const impactColor = i=>i==='High'?'red':i==='Medium'?'yellow':'green';
  const statusColor = s=>s==='Enacted'||s==='In Force'||s==='Adopted'?'green':s==='Finalised'?'blue':'yellow';
  const readColor = r=>r==='High'?'green':r==='Partial'?'yellow':'red';
  return (
    <div>
      <Section title={`Policy Pipeline — ${jurisdiction} + Global Regulations`}>
        <div style={{overflowX:'auto'}}>
          <table style={tblStyle}>
            <thead><tr>{['Regulation','Status','Deadline','Impact','Readiness'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{pipeline.map((r,i)=>(
              <tr key={i}>
                <td style={{...tdStyle,fontWeight:500,fontSize:12}}>{r.name}</td>
                <td style={tdStyle}><Badge color={statusColor(r.status)}>{r.status}</Badge></td>
                <td style={{...tdStyle,color:'#6b7280',fontSize:12}}>{r.deadline}</td>
                <td style={tdStyle}><Badge color={impactColor(r.impact)}>{r.impact}</Badge></td>
                <td style={tdStyle}><Badge color={readColor(r.readiness)}>{r.readiness}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab5({sector,jurisdiction}) {
  const sectorData = SECTORS.map((s,i)=>({
    sector: s,
    transition_risk: Math.round(20+rng(i+60)*75),
    physical_risk: Math.round(15+rng(i+61)*65),
  }));
  const heatmapJurisdictions = ['EU','USA','China','UK','India'].map((j,ji)=>({
    jurisdiction: j,
    risk: Math.round(30+rng(ji+70)*60),
  }));
  return (
    <div>
      <Row>
        <KpiCard label="Portfolio Transition Risk" value={`${Math.round(35+rng(80)*40)}%`} sub="Revenue at risk from policy" />
        <KpiCard label="Stranded Asset Risk" value={`€${Math.round(200+rng(81)*800)}M`} sub="Policy-accelerated write-down" />
        <KpiCard label="Carbon Cost (2030)" value={`€${Math.round(50+rng(82)*150)}M/yr`} sub="At NZE carbon price trajectory" />
        <KpiCard label="Policy Opportunity" value={`€${Math.round(100+rng(83)*400)}M`} sub="Green subsidy / ITC upside" />
      </Row>
      <Section title="Sector Transition vs Physical Risk (%)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sector" tick={{fontSize:11}} />
            <YAxis unit="%" />
            <Tooltip formatter={v=>`${v}%`} />
            <Legend />
            <Bar dataKey="transition_risk" fill="#f59e0b" name="Transition Risk %" />
            <Bar dataKey="physical_risk" fill="#ef4444" name="Physical Risk %" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Jurisdiction Risk Heatmap">
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {heatmapJurisdictions.map((j,i)=>{
            const color = j.risk>65?'#fee2e2':j.risk>40?'#fef3c7':'#d1fae5';
            return (<div key={i} style={{background:color,borderRadius:8,padding:12,textAlign:'center',border:'1px solid #e5e7eb'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#111827'}}>{j.jurisdiction}</div>
              <div style={{fontSize:18,fontWeight:700,color:'#374151'}}>{j.risk}</div>
              <div style={{fontSize:11,color:'#6b7280'}}>risk score</div>
            </div>);
          })}
        </div>
      </Section>
    </div>
  );
}

export default function ClimatePolicyPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [jurisdiction,setJurisdiction]=useState('EU');
  const [sector,setSector]=useState('Energy');
  const panels=[<Tab1 jurisdiction={jurisdiction} sector={sector}/>,<Tab2 jurisdiction={jurisdiction}/>,<Tab3/>,<Tab4 jurisdiction={jurisdiction}/>,<Tab5 sector={sector} jurisdiction={jurisdiction}/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827',margin:0}}>Climate Policy Tracker</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>NDC Ambition · Carbon Price Gap · Fit for 55 · US IRA · Policy Pipeline · Portfolio Impact · E109</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Sel label="Jurisdiction" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)}>
              {JURISDICTIONS.map(o=><option key={o}>{o}</option>)}
            </Sel>
            <Sel label="Sector" value={sector} onChange={e=>setSector(e.target.value)}>
              {SECTORS.map(o=><option key={o}>{o}</option>)}
            </Sel>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setActiveTab(i)}
              style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',
                borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',
                color:activeTab===i?'#059669':'#6b7280',transition:'color 0.15s'}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>{panels[activeTab]}</div>
      </div>
    </div>
  );
}
