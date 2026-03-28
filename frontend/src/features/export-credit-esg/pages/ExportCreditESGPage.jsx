import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
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

const seed = 110;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS = ['#059669','#10b981','#34d399','#6ee7b7','#f59e0b','#0284c7'];

const EXPORTER_COUNTRIES = ['Germany','France','USA','UK','Japan','South Korea','Italy','Spain','Netherlands','Canada','China','Sweden','Switzerland','Austria','Denmark','Finland','Norway','Belgium','Australia','Singapore'];
const SECTORS = ['Renewable Energy','Infrastructure','Manufacturing','Oil & Gas','Mining','Agriculture','Defence','Shipping','Aviation','Chemicals','Telecom','Power Generation'];
const ECA_NAMES = ['Euler Hermes (DE)','Bpifrance (FR)','US EXIM (US)','UK Export Finance','NEXI (JP)','K-EXIM (KR)','SACE (IT)','CESCE (ES)','Atradius (NL)','EDC (CA)','Sinosure (CN)','EKN (SE)','SERV (CH)','OeKB (AT)','EKF (DK)'];
const TABS = ['ECA ESG Profile','OECD Common Approaches','Fossil Fuel Classification','Equator Principles','Green Classification'];

const tblStyle = {width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle = {border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle = {border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle = {marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

function Tab1({exporterCountry,sector,ecaName}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const dims = ['E&S Policy','Due Diligence','Monitoring','Reporting','Stakeholder'];
  const radarData = dims.map((d,i)=>({dim:d, score: Math.round(40+rng(i+1)*55)}));
  const complianceRows = [
    {req:'OECD Common Approaches (2012)',    status: rng(10)>0.2?'Compliant':'Partial'},
    {req:'Paris Alignment Commitment (2021)',status: rng(11)>0.3?'Compliant':'Non-Compliant'},
    {req:'IPFD Climate Commitments',         status: rng(12)>0.25?'Compliant':'Partial'},
    {req:'Equator Principles (as EPFI)',      status: rng(13)>0.4?'Compliant':'Partial'},
    {req:'OECD Coal Exclusion (2022)',        status: rng(14)>0.2?'Compliant':'Non-Compliant'},
    {req:'UN SDG Alignment Reporting',       status: rng(15)>0.35?'Compliant':'Partial'},
  ];
  const statusColor = s => s==='Compliant'?'green':s==='Partial'?'yellow':'red';
  const run = useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/export-credit-esg/assess',{exporter_country:exporterCountry,sector,eca_name:ecaName}); setResult(r.data); } catch { void 0 /* API fallback to seed data */; setResult({}); } setLoading(false); },[exporterCountry,sector,ecaName]);
  return (
    <div>
      <Section title="ECA ESG Assessment">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Assessing…':'Assess ECA ESG Profile'}</Btn>
      </Section>
      <Row>
        <KpiCard label="ESG Score" value={`${Math.round(radarData.reduce((s,d)=>s+d.score,0)/radarData.length)}/100`} sub={`${ecaName} composite`} />
        <KpiCard label="OECD Tier" value={rng(20)>0.5?'Full Adherence':'Partial Adherence'} sub="Common Approaches compliance" />
        <KpiCard label="Paris Aligned" value={rng(21)>0.4?'Yes':'Partial'} sub="Fossil fuel exclusion progress" />
        <KpiCard label="TPF Exclusions" value={`${Math.round(2+rng(22)*8)} sectors`} sub="Third-party facilitated restrictions" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="5-Dimension ECA ESG Radar">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dim" tick={{fontSize:11}} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
              <Radar name="ESG Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="ECA Compliance Status Table">
          <table style={tblStyle}>
            <thead><tr>{['Requirement','Status'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{complianceRows.map((r,i)=>(<tr key={i}><td style={{...tdStyle,fontSize:12}}>{r.req}</td><td style={tdStyle}><Badge color={statusColor(r.status)}>{r.status}</Badge></td></tr>))}</tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

function Tab2({sector,transactionValue}) {
  const tv = parseFloat(transactionValue)||50;
  const category = tv>=100&&sector==='Oil & Gas'?'A': tv>=10?'B':'C';
  const ifcPS = [
    {ps:'PS 1: Assessment & Management of E&S Risks', required: category!=='C', status: rng(30)>0.3},
    {ps:'PS 2: Labour & Working Conditions',          required: true,           status: rng(31)>0.25},
    {ps:'PS 3: Resource Efficiency & Pollution',      required: category!=='C', status: rng(32)>0.35},
    {ps:'PS 4: Community Health & Safety',            required: category==='A', status: rng(33)>0.4},
    {ps:'PS 5: Land Acquisition',                     required: category==='A', status: rng(34)>0.45},
    {ps:'PS 6: Biodiversity Conservation',            required: category!=='C', status: rng(35)>0.3},
    {ps:'PS 7: Indigenous Peoples',                   required: category==='A', status: rng(36)>0.5},
    {ps:'PS 8: Cultural Heritage',                    required: category==='A', status: rng(37)>0.55},
  ];
  const catColor = c=>c==='A'?'red':c==='B'?'yellow':'green';
  return (
    <div>
      <Row>
        <KpiCard label="OECD Category" value={`Category ${category}`} sub="Common Approaches 2012" />
        <KpiCard label="ESIA Required" value={category!=='C'?'Yes':'No'} sub="Environmental & Social Impact Assessment" />
        <KpiCard label="IFC PS Applicable" value={`${ifcPS.filter(p=>p.required).length}/8`} sub="Performance Standards required" />
        <KpiCard label="Monitoring Period" value={category==='A'?'Annual':'Bi-annual'} sub="E&S monitoring requirement" />
      </Row>
      <div style={{marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:13,color:'#6b7280'}}>Determination:</span>
        <Badge color={catColor(category)}>Category {category} — {category==='A'?'High Risk':category==='B'?'Limited Risk':'Low Risk'}</Badge>
      </div>
      <Section title="IFC Performance Standards Checklist">
        <table style={tblStyle}>
          <thead><tr>{['Performance Standard','Required','Compliant'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{ifcPS.map((p,i)=>(<tr key={i} style={{opacity:p.required?1:0.5}}>
            <td style={{...tdStyle,fontSize:12}}>{p.ps}</td>
            <td style={tdStyle}><Badge color={p.required?'blue':'gray'}>{p.required?'Required':'N/A'}</Badge></td>
            <td style={tdStyle}><Badge color={p.status?'green':p.required?'red':'gray'}>{p.status?'Yes':p.required?'Gap':'—'}</Badge></td>
          </tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab3() {
  const ecas = ['Euler Hermes','Bpifrance','US EXIM','UKEF','NEXI'].slice(0,5);
  const subsectors = ['Thermal Coal','Coal Power','Natural Gas E&P','LNG','Oil Sands','Conventional Oil','Gas-to-Power','Offshore Wind'];
  const getStatus = (eca,sub,i,j) => {
    const v = rng(i*8+j+40);
    if(sub.includes('Coal')) return 'Excluded';
    if(v>0.7) return 'Eligible';
    if(v>0.4) return 'Conditional';
    return 'Under Review';
  };
  const statusColor = s=>s==='Excluded'?'red':s==='Eligible'?'green':s==='Conditional'?'yellow':'blue';
  return (
    <div>
      <Section title="Fossil Fuel Classification Matrix — ECA x Subsector">
        <div style={{overflowX:'auto'}}>
          <table style={tblStyle}>
            <thead><tr>
              <th style={thStyle}>Subsector</th>
              {ecas.map(e=><th key={e} style={{...thStyle,textAlign:'center'}}>{e}</th>)}
            </tr></thead>
            <tbody>{subsectors.map((sub,i)=>(<tr key={i}>
              <td style={{...tdStyle,fontWeight:500,fontSize:12}}>{sub}</td>
              {ecas.map((eca,j)=>{const s=getStatus(eca,sub,i,j); return(<td key={j} style={{...tdStyle,textAlign:'center'}}><Badge color={statusColor(s)}>{s}</Badge></td>);})}
            </tr>))}</tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab4() {
  const principles = [
    'EP1: Review and Categorisation','EP2: Environmental & Social Assessment','EP3: Applicable Environmental & Social Standards',
    'EP4: Environmental & Social Management System','EP5: Stakeholder Engagement','EP6: Grievance Mechanism',
    'EP7: Independent Review','EP8: Covenants','EP9: Independent Monitoring & Reporting','EP10: Reporting & Transparency',
  ];
  const results = principles.map((p,i)=>({ principle: p, pass: rng(i+60)>0.25, doc: rng(i+61)>0.3?'Provided':'Pending' }));
  const docs = ['ESIA Report','Environmental Management Plan','Stakeholder Engagement Plan','Grievance Mechanism Procedures','Monitoring Reports','Financial Covenant (EP clause)','Third Party Audit Report','Annual E&S Reporting Template'];
  return (
    <div>
      <Row>
        <KpiCard label="EP Principles Met" value={`${results.filter(r=>r.pass).length}/10`} sub="Equator Principles v4 (2020)" />
        <KpiCard label="EP Category" value={`Cat ${rng(70)>0.5?'A':'B'}`} sub="Project risk classification" />
        <KpiCard label="Doc Package" value={`${results.filter(r=>r.doc==='Provided').length}/10`} sub="Documentation provided" />
        <KpiCard label="EPFI Signatory" value="Yes" sub="130+ banks globally" />
      </Row>
      <Section title="10 Equator Principles — Pass/Fail + Documentation">
        <table style={tblStyle}>
          <thead><tr>{['Principle','Status','Documentation'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{results.map((r,i)=>(<tr key={i}>
            <td style={{...tdStyle,fontSize:12}}>{r.principle}</td>
            <td style={tdStyle}><Badge color={r.pass?'green':'red'}>{r.pass?'Pass':'Fail'}</Badge></td>
            <td style={tdStyle}><Badge color={r.doc==='Provided'?'blue':'yellow'}>{r.doc}</Badge></td>
          </tr>))}</tbody>
        </table>
      </Section>
      <Section title="Required Documentation">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {docs.map((d,i)=>{
            const ok = rng(i+80)>0.4;
            return (<div key={i} style={{padding:'8px',borderRadius:6,border:`1px solid ${ok?'#a7f3d0':'#fde68a'}`,background:ok?'#ecfdf5':'#fffbeb',fontSize:12,fontWeight:500,color:ok?'#065f46':'#92400e'}}>{d}</div>);
          })}
        </div>
      </Section>
    </div>
  );
}

function Tab5({sector}) {
  const proceeds = [
    {name:'Renewable Energy', value:Math.round(20+rng(90)*40)},
    {name:'Green Buildings', value:Math.round(10+rng(91)*25)},
    {name:'Clean Transport', value:Math.round(8+rng(92)*20)},
    {name:'Water & Waste', value:Math.round(5+rng(93)*15)},
    {name:'Biodiversity', value:Math.round(3+rng(94)*12)},
    {name:'Other Green', value:Math.round(2+rng(95)*10)},
  ];
  const totalProceeds = proceeds.reduce((s,p)=>s+p.value,0);
  const greenEligible = rng(96)>0.25;
  const icmaCat = rng(97)>0.5?'Use of Proceeds Bond':'Sustainability-Linked Bond';
  return (
    <div>
      <Row>
        <KpiCard label="Green Eligible" value={greenEligible?'Yes':'Partial'} sub="ICMA Green Bond Principles 2021" />
        <KpiCard label="Instrument Type" value={icmaCat} sub="Classification" />
        <KpiCard label="Taxonomy Aligned" value={`${Math.round(40+rng(98)*50)}%`} sub="EU Taxonomy Art. 6 / DNSH" />
        <KpiCard label="SPO Required" value="Yes" sub="Second Party Opinion needed" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Use of Proceeds by Category (%)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={proceeds} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
                {proceeds.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v=>`${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Green Eligibility Assessment">
          <table style={tblStyle}>
            <thead><tr>{['Category','Allocation %','EU Taxonomy','ICMA GBP'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{proceeds.map((p,i)=>(<tr key={i}>
              <td style={{...tdStyle,fontWeight:500,fontSize:12}}>{p.name}</td>
              <td style={{...tdStyle,fontFamily:'monospace'}}>{((p.value/totalProceeds)*100).toFixed(0)}%</td>
              <td style={tdStyle}><Badge color={rng(i+100)>0.3?'green':'yellow'}>{rng(i+100)>0.3?'Aligned':'Partial'}</Badge></td>
              <td style={tdStyle}><Badge color={rng(i+101)>0.2?'green':'yellow'}>{rng(i+101)>0.2?'Eligible':'Review'}</Badge></td>
            </tr>))}</tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

export default function ExportCreditESGPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [exporterCountry,setExporterCountry]=useState('Germany');
  const [sector,setSector]=useState('Renewable Energy');
  const [transactionValue,setTransactionValue]=useState('75');
  const [ecaName,setEcaName]=useState('Euler Hermes (DE)');
  const panels=[
    <Tab1 exporterCountry={exporterCountry} sector={sector} ecaName={ecaName}/>,
    <Tab2 sector={sector} transactionValue={transactionValue}/>,
    <Tab3/>,<Tab4/>,
    <Tab5 sector={sector}/>,
  ];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827',margin:0}}>Export Credit ESG Engine</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>OECD Common Approaches · IFC Performance Standards · Equator Principles v4 · ECA Fossil Fuel Classification · ICMA GBP · E110</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Sel label="Exporter Country" value={exporterCountry} onChange={e=>setExporterCountry(e.target.value)}>
              {EXPORTER_COUNTRIES.map(o=><option key={o}>{o}</option>)}
            </Sel>
            <Sel label="Sector" value={sector} onChange={e=>setSector(e.target.value)}>
              {SECTORS.map(o=><option key={o}>{o}</option>)}
            </Sel>
            <Inp label="Transaction Value (USD M)" type="number" value={transactionValue} onChange={e=>setTransactionValue(e.target.value)} />
            <Sel label="ECA Name" value={ecaName} onChange={e=>setEcaName(e.target.value)}>
              {ECA_NAMES.map(o=><option key={o}>{o}</option>)}
            </Sel>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setActiveTab(i)} style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',color:activeTab===i?'#059669':'#6b7280',transition:'color 0.15s'}}>{t}</button>))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>{panels[activeTab]}</div>
      </div>
    </div>
  );
}
