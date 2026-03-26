import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
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

const seed = 117;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const ENTITY_TYPES = ['bank','insurer','asset_manager','corporate','pension'];
const JURISDICTIONS = ['EU','UK','USA','Germany','France','Switzerland','Singapore','Australia','Japan','Canada','Netherlands','Sweden','Hong Kong','UAE','India','Brazil','South Korea','Norway','Denmark','Austria'];
const HORIZON_OPTS = ['1','3','5','10'];
const TABS = ['Horizon Overview','Regulation Pipeline','Implementation Readiness','Compliance Burden','Synergies'];

const REGULATIONS_12 = [
  {name:'CSRD Wave 3 (SMEs)',    topic:'Reporting',    status:'Finalised',  deadline:'Jan 2026', impact:'High', cost:Math.round(200+rng(0)*600), fte:Math.round(2+rng(1)*8), readiness: Math.round(20+rng(2)*50)},
  {name:'SFDR Level 3 RTS',      topic:'Disclosure',   status:'Consultation',deadline:'2026',    impact:'High', cost:Math.round(150+rng(3)*400), fte:Math.round(1+rng(4)*5), readiness: Math.round(30+rng(5)*55)},
  {name:'EU AI Act (Fin Svcs)',   topic:'Technology',   status:'In Force',   deadline:'Aug 2026', impact:'High', cost:Math.round(300+rng(6)*800), fte:Math.round(3+rng(7)*10), readiness: Math.round(15+rng(8)*40)},
  {name:'Basel IV / CRR3',        topic:'Capital',      status:'Enacted',    deadline:'Jan 2025', impact:'High', cost:Math.round(400+rng(9)*1200),fte:Math.round(4+rng(10)*12),readiness: Math.round(40+rng(11)*50)},
  {name:'DORA (Digital Ops Res)', topic:'Technology',   status:'In Force',   deadline:'Jan 2025', impact:'High', cost:Math.round(250+rng(12)*700),fte:Math.round(3+rng(13)*8), readiness: Math.round(35+rng(14)*50)},
  {name:'CBAM Full Phase-in',     topic:'Climate',      status:'Enacted',    deadline:'Jan 2026', impact:'Medium',cost:Math.round(100+rng(15)*300),fte:Math.round(1+rng(16)*4), readiness: Math.round(40+rng(17)*45)},
  {name:'MiCA (Crypto Assets)',   topic:'Digital Assets',status:'In Force',  deadline:'Dec 2024', impact:'Medium',cost:Math.round(80+rng(18)*250), fte:Math.round(1+rng(19)*3), readiness: Math.round(50+rng(20)*40)},
  {name:'T+1 Settlement (EU)',    topic:'Market Infra', status:'Proposed',   deadline:'2027',     impact:'Medium',cost:Math.round(200+rng(21)*500),fte:Math.round(2+rng(22)*6), readiness: Math.round(20+rng(23)*40)},
  {name:'EUDR (Full)',            topic:'Supply Chain', status:'Enacted',    deadline:'Dec 2025', impact:'High', cost:Math.round(150+rng(24)*400),fte:Math.round(2+rng(25)*5), readiness: Math.round(25+rng(26)*45)},
  {name:'FRTB SA/IMA (EU)',       topic:'Capital',      status:'Finalised',  deadline:'Jan 2025', impact:'High', cost:Math.round(350+rng(27)*900),fte:Math.round(3+rng(28)*9), readiness: Math.round(45+rng(29)*45)},
  {name:'UK SDR (All Labels)',    topic:'Disclosure',   status:'Enacted',    deadline:'Dec 2024', impact:'Medium',cost:Math.round(80+rng(30)*200), fte:Math.round(1+rng(31)*3), readiness: Math.round(55+rng(32)*40)},
  {name:'ISSB S1/S2 (Global)',    topic:'Reporting',    status:'Enacted',    deadline:'Jan 2024', impact:'High', cost:Math.round(200+rng(33)*600),fte:Math.round(2+rng(34)*7), readiness: Math.round(35+rng(35)*50)},
];

function Tab1({entityType,jurisdiction}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const highImpact=REGULATIONS_12.filter(r=>r.impact==='High').length;
  const totalCost=Math.round(REGULATIONS_12.reduce((s,r)=>s+r.cost,0)/1000);
  const velocity=Math.round(3+rng(40)*8);
  const topicData=['Capital','Reporting','Disclosure','Technology','Climate','Supply Chain','Market Infra','Digital Assets'].map(t=>({
    topic:t, count:REGULATIONS_12.filter(r=>r.topic===t).length||Math.round(rng(REGULATIONS_12.indexOf(REGULATIONS_12.find(r=>r.topic===t)||REGULATIONS_12[0])+41)*3),
  })).filter(t=>t.count>0);
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/regulatory-horizon/scan',{entity_type:entityType,jurisdiction,horizon_years:5}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[entityType,jurisdiction]);
  return (
    <div>
      <Section title="Scan Regulatory Horizon">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Scanning…':'Scan Regulatory Horizon'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Total Regulations" value={REGULATIONS_12.length} sub={`${entityType} — ${jurisdiction}`} />
        <KpiCard label="High Impact" value={highImpact} sub="Material compliance required" />
        <KpiCard label="Total Compliance Cost" value={`€${totalCost}M`} sub="5-year cumulative estimate" />
        <KpiCard label="Change Velocity" value={`${velocity}/10`} sub="Regulatory change intensity score" />
      </Row>
      <Section title="Regulations by Topic Area">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topicData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" tick={{fontSize:11}} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#059669" name="Regulations">
              {topicData.map((_,i)=><Cell key={i} fill={['#059669','#10b981','#34d399','#f59e0b','#0284c7','#7c3aed','#ef4444','#f97316'][i%8]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2() {
  const impactColor=i=>i==='High'?'red':'yellow';
  const statusColor=s=>s==='In Force'||s==='Enacted'?'green':s==='Finalised'?'blue':'yellow';
  return (
    <div>
      <Section title="12 Upcoming Regulations Pipeline">
        <div style={{overflowX:'auto'}}>
          <table style={tblStyle}>
            <thead><tr>{['Regulation','Topic','Status','Deadline','Impact','Readiness'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{REGULATIONS_12.map((r,i)=>(<tr key={i}>
              <td style={{...tdStyle,fontWeight:500,fontSize:12}}>{r.name}</td>
              <td style={{...tdStyle,fontSize:12,color:'#6b7280'}}>{r.topic}</td>
              <td style={tdStyle}><Badge color={statusColor(r.status)}>{r.status}</Badge></td>
              <td style={{...tdStyle,fontSize:12,color:'#6b7280'}}>{r.deadline}</td>
              <td style={tdStyle}><Badge color={impactColor(r.impact)}>{r.impact}</Badge></td>
              <td style={tdStyle}>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:64,background:'#e5e7eb',borderRadius:9999,height:6}}><div style={{background:'#10b981',height:6,borderRadius:9999,width:`${r.readiness}%`}} /></div>
                  <span style={{fontSize:12,fontFamily:'monospace'}}>{r.readiness}%</span>
                </div>
              </td>
            </tr>))}</tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab3() {
  const readinessData=REGULATIONS_12.map(r=>({name:r.name.length>20?r.name.substring(0,18)+'…':r.name, readiness:r.readiness}));
  return (
    <div>
      <Row>
        <KpiCard label="Avg Readiness" value={`${Math.round(REGULATIONS_12.reduce((s,r)=>s+r.readiness,0)/REGULATIONS_12.length)}%`} sub="Cross-regulation average" />
        <KpiCard label="Ready (>70%)" value={REGULATIONS_12.filter(r=>r.readiness>70).length} sub="Regulations on track" />
        <KpiCard label="At Risk (<40%)" value={REGULATIONS_12.filter(r=>r.readiness<40).length} sub="Require urgent action" />
        <KpiCard label="Critical Gap Regs" value={REGULATIONS_12.filter(r=>r.readiness<40&&r.impact==='High').length} sub="High impact + low readiness" />
      </Row>
      <Section title="Implementation Readiness % by Regulation">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={readinessData} layout="vertical" margin={{left:160}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0,100]} unit="%" />
            <YAxis type="category" dataKey="name" tick={{fontSize:10}} />
            <Tooltip formatter={v=>`${v}%`} />
            <Bar dataKey="readiness" name="Readiness %">
              {readinessData.map((d,i)=><Cell key={i} fill={d.readiness>=70?'#059669':d.readiness>=40?'#f59e0b':'#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab4() {
  const costData=REGULATIONS_12.map(r=>({name:r.name.length>18?r.name.substring(0,16)+'…':r.name, cost:r.cost, fte:r.fte}));
  const totalFTE=REGULATIONS_12.reduce((s,r)=>s+r.fte,0);
  return (
    <div>
      <Row>
        <KpiCard label="Total Compliance Cost" value={`€${Math.round(REGULATIONS_12.reduce((s,r)=>s+r.cost,0)/1000)}M`} sub="5-year estimate (all regs)" />
        <KpiCard label="Total FTE Required" value={`${totalFTE} FTE`} sub="Additional headcount needed" />
        <KpiCard label="Highest Single Cost" value={`€${Math.max(...REGULATIONS_12.map(r=>r.cost))/1000}M`} sub={REGULATIONS_12.sort((a,b)=>b.cost-a.cost)[0].name} />
        <KpiCard label="Cost per FTE" value={`€${Math.round(REGULATIONS_12.reduce((s,r)=>s+r.cost,0)/totalFTE/1000)}k`} sub="Average across all regulations" />
      </Row>
      <Section title="Compliance Cost by Regulation (€k)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costData} layout="vertical" margin={{left:160}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" unit="k" />
            <YAxis type="category" dataKey="name" tick={{fontSize:10}} />
            <Tooltip formatter={v=>`€${v}k`} />
            <Bar dataKey="cost" fill="#059669" name="Cost (€k)" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab5() {
  const synergies=[
    {pair:'CSRD + ISSB S1/S2', shared:'GHG data, materiality assessment, governance disclosures', saving:`€${Math.round(100+rng(50)*300)}k`},
    {pair:'SFDR + UK SDR', shared:'Sustainability classification, PAI indicators, product-level ESG', saving:`€${Math.round(80+rng(51)*200)}k`},
    {pair:'Basel IV + FRTB', shared:'RWA calculation engine, market risk models, capital reporting', saving:`€${Math.round(200+rng(52)*500)}k`},
    {pair:'CSRD + EU Taxonomy', shared:'Taxonomy eligibility, DNSH screening, reporting templates', saving:`€${Math.round(150+rng(53)*350)}k`},
    {pair:'DORA + AI Act', shared:'IT resilience testing, model risk governance, third-party oversight', saving:`€${Math.round(100+rng(54)*300)}k`},
    {pair:'EUDR + CSDDD', shared:'Supply chain mapping, due diligence procedures, geo-location data', saving:`€${Math.round(80+rng(55)*200)}k`},
  ];
  const sharedData=['Entity Master Data','GHG Emissions','Taxonomy Mapping','Risk Assessments','Disclosures/Reports','Model Governance'].map((d,i)=>({
    data:d, regs: Math.round(2+rng(i+60)*5),
  }));
  return (
    <div>
      <Row>
        <KpiCard label="Synergy Pairs Identified" value={synergies.length} sub="Cross-regulation efficiencies" />
        <KpiCard label="Total Savings Est." value={`€${Math.round(synergies.reduce((s,sy)=>s+parseInt(sy.saving.replace(/[€kM]/g,'')),0)*100/1000)}k`} sub="Annual cost avoidance" />
        <KpiCard label="Shared Data Sources" value="6" sub="Common data requirements" />
        <KpiCard label="Reuse Factor" value={`${Math.round(25+rng(65)*35)}%`} sub="Data reuse across frameworks" />
      </Row>
      <Section title="Cross-Regulation Synergy Map">
        <table style={tblStyle}>
          <thead><tr>{['Regulation Pair','Shared Requirements','Estimated Saving'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{synergies.map((s,i)=>(<tr key={i}>
            <td style={{...tdStyle,fontWeight:500,fontSize:12}}>{s.pair}</td>
            <td style={{...tdStyle,fontSize:12,color:'#4b5563'}}>{s.shared}</td>
            <td style={{...tdStyle,fontFamily:'monospace',fontWeight:700,color:'#047857'}}>{s.saving}</td>
          </tr>))}</tbody>
        </table>
      </Section>
      <Section title="Shared Data Requirements — Regulation Count">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sharedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" tick={{fontSize:11}} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="regs" fill="#059669" name="No. of Regulations" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

export default function RegulatoryHorizonPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [entityType,setEntityType]=useState('bank');
  const [jurisdiction,setJurisdiction]=useState('EU');
  const [horizon,setHorizon]=useState('5');
  const panels=[<Tab1 entityType={entityType} jurisdiction={jurisdiction}/>,<Tab2/>,<Tab3/>,<Tab4/>,<Tab5/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827'}}>Regulatory Horizon Scanner</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>CSRD · Basel IV · DORA · AI Act · SFDR · FRTB · Compliance Cost · Implementation Readiness · E117</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:12,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Sel label="Entity Type" value={entityType} onChange={e=>setEntityType(e.target.value)}>{ENTITY_TYPES.map(o=><option key={o}>{o}</option>)}</Sel>
            <Sel label="Jurisdiction" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)}>{JURISDICTIONS.map(o=><option key={o}>{o}</option>)}</Sel>
            <Sel label="Horizon (years)" value={horizon} onChange={e=>setHorizon(e.target.value)}>{HORIZON_OPTS.map(o=><option key={o}>{o}</option>)}</Sel>
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
