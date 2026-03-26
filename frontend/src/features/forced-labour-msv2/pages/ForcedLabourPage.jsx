import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const thStyle={border:'1px solid #e5e7eb',padding:'4px 12px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280'};
const tdStyle={border:'1px solid #e5e7eb',padding:'4px 12px',fontSize:12};
const errStyle={marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

const seed = 114;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const SECTORS = ['Technology','Apparel & Textiles','Agriculture & Food','Mining & Metals','Electronics','Construction','Healthcare','Retail','Automotive','Logistics'];
const SUPPLY_COUNTRIES = ['China','Vietnam','Bangladesh','India','Malaysia'];
const TABS = ['Risk Overview','ILO Indicators','Supply Chain Screen','MSA Statement Quality','UFLPA Exposure'];

function Tab1({entityName,sector,supplyCountries}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const dims=[
    {dim:'Geographic Risk',score:Math.round(35+rng(1)*60)},
    {dim:'Sector Risk',score:Math.round(30+rng(2)*65)},
    {dim:'Supplier Audit Coverage',score:Math.round(40+rng(3)*55)},
    {dim:'Policy & Governance',score:Math.round(45+rng(4)*50)},
    {dim:'Remediation Capability',score:Math.round(35+rng(5)*60)},
  ];
  const overall=Math.round(dims.reduce((s,d)=>s+d.score,0)/dims.length);
  const tier=overall>70?'Critical':overall>50?'Elevated':overall>30?'Moderate':'Low';
  const tierColor=t=>t==='Critical'?'red':t==='Elevated'?'yellow':t==='Moderate'?'blue':'green';
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/modern-slavery/assess',{entity_name:entityName,sector,primary_supply_countries:supplyCountries}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[entityName,sector,supplyCountries]);
  return (
    <div>
      <Section title="Modern Slavery Risk Assessment">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Assessing…':'Run MSA Risk Assessment'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Risk Score" value={`${overall}/100`} sub="5-dimension composite" />
        <KpiCard label="Risk Tier" value={tier} sub={`${sector} — ${supplyCountries.join(', ')}`} />
        <KpiCard label="Workers at Risk" value={`${Math.round(500+rng(6)*5000)}`} sub="Estimated in supply chain" />
        <KpiCard label="ILO Violations" value={`${Math.round(1+rng(7)*4)}`} sub="High-risk indicators detected" />
      </Row>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontSize:13,color:'#6b7280',fontWeight:500}}>Overall Risk Tier:</span>
        <Badge color={tierColor(tier)}>{tier} Risk</Badge>
      </div>
      <Section title="5-Dimension Risk Radar">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={dims}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="dim" tick={{fontSize:11}} />
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
            <Radar name="Risk Score" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2() {
  const indicators=[
    'Abuse of vulnerability','Deception','Restriction of movement','Isolation','Physical & sexual violence',
    'Intimidation & threats','Retention of ID documents','Withholding wages','Debt bondage',
    'Abusive working conditions','Excessive overtime',
  ];
  const barData=indicators.map((ind,i)=>({ind: ind.length>25?ind.substring(0,22)+'…':ind, full:ind, score:Math.round(10+rng(i+10)*90), highRisk:rng(i+11)<0.3}));
  return (
    <div>
      <Section title="ILO 11 Forced Labour Indicators (Score 0–100)">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} layout="vertical" margin={{left:180}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0,100]} />
            <YAxis type="category" dataKey="ind" tick={{fontSize:10}} />
            <Tooltip formatter={(v,n,p)=>[`Score: ${v}`,p.payload.full]} />
            <Bar dataKey="score" name="Risk Score">
              {barData.map((d,i)=><Cell key={i} fill={d.score>70?'#ef4444':d.score>40?'#f59e0b':'#059669'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
      <Section title="High-Risk Indicator Flags">
        <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb'}}>{['Indicator','Score','Flag'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{barData.filter(d=>d.highRisk).map((d,i)=>(<tr key={i} style={{background:'#fef2f2'}}><td style={{...tdStyle,fontWeight:500}}>{d.full}</td><td style={{...tdStyle,fontFamily:'monospace',fontWeight:700,color:'#b91c1c'}}>{d.score}</td><td style={tdStyle}><Badge color="red">High Risk</Badge></td></tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab3({supplyCountries}) {
  const suppliers=Array.from({length:8},(_,i)=>({
    name:`Supplier ${String.fromCharCode(65+i)}`,
    tier:i<3?'Tier 1':i<6?'Tier 2':'Tier 3',
    country:supplyCountries[i%supplyCountries.length]||SUPPLY_COUNTRIES[i%SUPPLY_COUNTRIES.length],
    ilo_score:Math.round(40+rng(i+20)*55),
    uflpa_flag:i===2||i===5,
    cahra_flag:i===5,
    audit_status:rng(i+21)>0.5?'Audited':'Pending',
  }));
  const iloColor=s=>s>=70?'green':s>=45?'yellow':'red';
  return (
    <div>
      <Row>
        <KpiCard label="Suppliers Screened" value={suppliers.length} sub="Against ILO / UFLPA criteria" />
        <KpiCard label="UFLPA Flags" value={suppliers.filter(s=>s.uflpa_flag).length} sub="Uyghur Forced Labor Prevention Act" />
        <KpiCard label="Audit Coverage" value={`${Math.round(suppliers.filter(s=>s.audit_status==='Audited').length/suppliers.length*100)}%`} sub="Tier 1+2 suppliers audited" />
        <KpiCard label="Critical Gaps" value={suppliers.filter(s=>s.ilo_score<45).length} sub="ILO score <45 — immediate review" />
      </Row>
      <Section title="Supply Chain Screen — 8 Suppliers">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#f9fafb'}}>{['Supplier','Tier','Country','ILO Score','UFLPA','CAHRA','Audit'].map(h=><th key={h} style={{...thStyle,padding:'4px 8px'}}>{h}</th>)}</tr></thead>
            <tbody>{suppliers.map((s,i)=>(<tr key={i} style={{background:s.uflpa_flag?'#fef2f2':'transparent'}}>
              <td style={{...tdStyle,padding:'4px 8px',fontWeight:500}}>{s.name}</td>
              <td style={{...tdStyle,padding:'4px 8px',color:'#6b7280'}}>{s.tier}</td>
              <td style={{...tdStyle,padding:'4px 8px'}}>{s.country}</td>
              <td style={{...tdStyle,padding:'4px 8px'}}><Badge color={iloColor(s.ilo_score)}>{s.ilo_score}</Badge></td>
              <td style={{...tdStyle,padding:'4px 8px'}}><Badge color={s.uflpa_flag?'red':'gray'}>{s.uflpa_flag?'FLAG':'—'}</Badge></td>
              <td style={{...tdStyle,padding:'4px 8px'}}><Badge color={s.cahra_flag?'red':'gray'}>{s.cahra_flag?'CAHRA':'—'}</Badge></td>
              <td style={{...tdStyle,padding:'4px 8px'}}><Badge color={s.audit_status==='Audited'?'green':'yellow'}>{s.audit_status}</Badge></td>
            </tr>))}</tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab4() {
  const criteria=[
    {criterion:'Structure & Governance',score:Math.round(40+rng(30)*55),ukTier:rng(31)>0.5?'Tier A':'Tier B'},
    {criterion:'Business & Supply Chain',score:Math.round(35+rng(32)*60)},
    {criterion:'Policies & Due Diligence',score:Math.round(30+rng(33)*65)},
    {criterion:'Risk Assessment Process',score:Math.round(40+rng(34)*55)},
    {criterion:'Key Performance Indicators',score:Math.round(25+rng(35)*70)},
    {criterion:'Training Provision',score:Math.round(35+rng(36)*60)},
  ];
  const overall=Math.round(criteria.reduce((s,c)=>s+c.score,0)/criteria.length);
  const hmTier=overall>=80?'Tier A':overall>=60?'Tier B':overall>=40?'Tier C':'Tier D';
  const hmColor=t=>t==='Tier A'?'green':t==='Tier B'?'blue':t==='Tier C'?'yellow':'red';
  return (
    <div>
      <Row>
        <KpiCard label="Statement Score" value={`${overall}/100`} sub="UK Home Office 6-criteria assessment" />
        <KpiCard label="Home Office Tier" value={hmTier} sub="Government MSA ranking" />
        <KpiCard label="MSA 2015 Compliance" value={overall>=50?'Compliant':'Non-Compliant'} sub="Modern Slavery Act 2015 (UK)" />
        <KpiCard label="CSDDD Readiness" value={`${Math.round(40+rng(38)*50)}%`} sub="EU Directive 2024/1760 alignment" />
      </Row>
      <Section title="6-Criteria MSA Statement Assessment">
        <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb'}}>{['Criterion','Score','Status'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{criteria.map((c,i)=>(<tr key={i}>
            <td style={{...tdStyle,fontWeight:500}}>{c.criterion}</td>
            <td style={{...tdStyle,fontFamily:'monospace',fontWeight:700}}>{c.score}/100</td>
            <td style={tdStyle}><Badge color={c.score>=70?'green':c.score>=45?'yellow':'red'}>{c.score>=70?'Strong':c.score>=45?'Developing':'Weak'}</Badge></td>
          </tr>))}</tbody>
        </table>
      </Section>
      <div style={{display:'flex',alignItems:'center',gap:12,marginTop:16}}>
        <span style={{fontSize:13,color:'#6b7280',fontWeight:500}}>UK Home Office Tier:</span>
        <Badge color={hmColor(hmTier)}>{hmTier}</Badge>
      </div>
    </div>
  );
}

function Tab5({supplyCountries}) {
  const xijiang = supplyCountries.includes('China');
  const exposurePct = xijiang?Math.round(15+rng(40)*40):Math.round(0+rng(41)*8);
  const gaugeData=[{name:'Xinjiang Exposure', value:exposurePct, fill:exposurePct>20?'#ef4444':exposurePct>10?'#f59e0b':'#059669'}];
  const enforcement=[
    {action:'CBP Withhold Release Order', risk: exposurePct>25?'High':exposurePct>10?'Medium':'Low'},
    {action:'UFLPA Entity List Hit', risk: rng(42)>0.7?'High':'Low'},
    {action:'US Customs Detention', risk: exposurePct>20?'High':'Low'},
    {action:'EU Import Restriction (Proposed)', risk: rng(43)>0.5?'Medium':'Low'},
  ];
  const docs=['Bill of Lading with Xinjiang origin declaration','Supplier attestation (non-forced labour)','Third-party audit report (6 months old)','UFLPA rebuttable evidence package','Supply chain mapping to raw material'];
  const riskColor=r=>r==='High'?'red':r==='Medium'?'yellow':'green';
  return (
    <div>
      <Row>
        <KpiCard label="Xinjiang Exposure" value={`${exposurePct}%`} sub="Supply chain sourcing from XUAR" />
        <KpiCard label="UFLPA Presumption" value={exposurePct>5?'Active':'Minimal'} sub="US import enforcement risk" />
        <KpiCard label="Rebuttable Evidence" value={`${Math.round(2+rng(44)*3)}/5`} sub="Documentation ready" />
        <KpiCard label="CBP Risk Level" value={exposurePct>20?'High':exposurePct>5?'Elevated':'Low'} sub="US Customs & Border Protection" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Xinjiang Supply Exposure Gauge (%)">
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={gaugeData} startAngle={180} endAngle={0}>
              <RadialBar background dataKey="value" label={{fill:'#111',fontSize:18,fontWeight:'bold'}} />
              <Tooltip formatter={v=>`${v}%`} />
            </RadialBarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Enforcement Risk Assessment">
          <table style={{width:'100%',fontSize:13,borderCollapse:'collapse',marginBottom:16}}>
            <thead><tr style={{background:'#f9fafb'}}>{['Enforcement Action','Risk Level'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{enforcement.map((e,i)=>(<tr key={i}><td style={{...tdStyle,fontWeight:500}}>{e.action}</td><td style={tdStyle}><Badge color={riskColor(e.risk)}>{e.risk}</Badge></td></tr>))}</tbody>
          </table>
          <div style={{fontSize:12,fontWeight:600,color:'#374151',marginBottom:8}}>Required Documentation</div>
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {docs.map((d,i)=>(<li key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,padding:'6px',borderRadius:4,color:rng(i+50)>0.5?'#047857':'#b45309'}}>
              <span>{rng(i+50)>0.5?'✓':'○'}</span>{d}
            </li>))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

export default function ForcedLabourPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [entityName,setEntityName]=useState('Global Supply Corp');
  const [sector,setSector]=useState('Apparel & Textiles');
  const [supplyCountries,setSupplyCountries]=useState(['China','Bangladesh']);
  const toggleCountry=c=>setSupplyCountries(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c]);
  const panels=[<Tab1 entityName={entityName} sector={sector} supplyCountries={supplyCountries}/>,<Tab2/>,<Tab3 supplyCountries={supplyCountries}/>,<Tab4/>,<Tab5 supplyCountries={supplyCountries}/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#000'}}>Forced Labour & Modern Slavery Engine</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>ILO 11 Indicators · UK MSA 2015 · UFLPA / CAHRA · CSDDD Art 6 · Supply Chain Screen · E114</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:8,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <Inp label="Entity Name" value={entityName} onChange={e=>setEntityName(e.target.value)} />
            <Sel label="Sector" value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(o=><option key={o}>{o}</option>)}</Sel>
            <div>
              <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Primary Supply Countries</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {SUPPLY_COUNTRIES.map(c=>(<label key={c} style={{display:'flex',alignItems:'center',gap:4,fontSize:13,cursor:'pointer'}}>
                  <input type="checkbox" checked={supplyCountries.includes(c)} onChange={()=>toggleCountry(c)} />{c}
                </label>))}
              </div>
            </div>
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
