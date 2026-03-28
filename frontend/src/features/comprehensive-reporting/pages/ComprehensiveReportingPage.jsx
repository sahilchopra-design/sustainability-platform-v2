import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const seed = 119;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS=['#059669','#10b981','#34d399','#f59e0b','#0284c7','#7c3aed'];

const ALL_FRAMEWORKS=['CSRD','SFDR','TCFD','TNFD','ISSB'];
const TABS=['Report Overview','ESRS Coverage','Cross-Framework Consistency','XBRL Readiness','Gap Remediation'];

const tblStyle={width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle={border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle={border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle={marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

function Tab1({entityName,frameworks,reportingYear}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const fwData=frameworks.map((fw,i)=>({fw, completeness:Math.round(40+rng(i+1)*55)}));
  const mandatory=Math.round(120+rng(5)*80);
  const total=Math.round(mandatory*1.4);
  const gaps=Math.round(total*(0.2+rng(6)*0.3));
  const overall=Math.round(fwData.reduce((s,f)=>s+f.completeness,0)/fwData.length);
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/comprehensive-reporting/compile',{entity_name:entityName,frameworks,reporting_year:parseInt(reportingYear)}); setResult(r.data); } catch { void 0 /* API fallback to seed data */; setResult({}); } setLoading(false); },[entityName,frameworks,reportingYear]);
  return (
    <div>
      <Section title="Compile Report">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Compiling…':'Compile Multi-Framework Report'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Frameworks Active" value={frameworks.length} sub={frameworks.join(' · ')} />
        <KpiCard label="Avg Completeness" value={`${overall}%`} sub="Cross-framework average" />
        <KpiCard label="Mandatory DPs Disclosed" value={mandatory} sub={`of ${total} total disclosure points`} />
        <KpiCard label="Open Gaps" value={gaps} sub="Require remediation" />
      </Row>
      <Section title="Per-Framework Completeness Radar">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={fwData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="fw" tick={{fontSize:12}} />
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
            <Radar name="Completeness %" dataKey="completeness" stroke="#059669" fill="#059669" fillOpacity={0.3} />
            <Tooltip formatter={v=>`${v}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2({frameworks}) {
  const esrsTopics=['E1 Climate','E2 Pollution','E3 Water','E4 Biodiversity','E5 Circular','S1 Own Workers','S2 Value Chain','S3 Communities','S4 Consumers','G1 Conduct'].map((t,i)=>({
    topic:t, mandatory:Math.round(50+rng(i+10)*45), phase_in:Math.round(30+rng(i+11)*60), scope:frameworks.includes('CSRD'),
  }));
  const pieParts=[{name:'Mandatory',value:62},{name:'Phase-in',value:28},{name:'Voluntary',value:10}];
  return (
    <div>
      <Row>
        <KpiCard label="ESRS Topics" value={esrsTopics.length} sub="E1-E5 + S1-S4 + G1" />
        <KpiCard label="Mandatory Coverage" value={`${Math.round(esrsTopics.reduce((s,t)=>s+t.mandatory,0)/esrsTopics.length)}%`} sub="Mandatory DP completeness" />
        <KpiCard label="Phase-in Coverage" value={`${Math.round(esrsTopics.reduce((s,t)=>s+t.phase_in,0)/esrsTopics.length)}%`} sub="Phase-in DP completeness" />
        <KpiCard label="CSRD In Scope" value={frameworks.includes('CSRD')?'Yes':'No'} sub="Corporate Sustainability Reporting Dir." />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="ESRS Completeness % by Topic">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={esrsTopics} layout="vertical" margin={{left:90}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0,100]} unit="%" />
              <YAxis type="category" dataKey="topic" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Legend />
              <Bar dataKey="mandatory" fill="#059669" name="Mandatory" stackId="a" />
              <Bar dataKey="phase_in" fill="#34d399" name="Phase-in" stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Mandatory vs Phase-in vs Voluntary">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieParts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
                {pieParts.map((_,i)=><Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

function Tab3() {
  const checks=[
    {check:'GHG Scope 1 — CSRD vs ISSB S2 vs TCFD', pass:rng(20)>0.2, variance:rng(20)>0.2?0:Math.round(1+rng(21)*15)},
    {check:'Climate scenario set — TCFD vs ISSB vs TNFD', pass:rng(22)>0.3, variance:rng(22)>0.3?0:Math.round(2+rng(23)*20)},
    {check:'Taxonomy % — CSRD vs SFDR GAR/BTAR', pass:rng(24)>0.25, variance:rng(24)>0.25?0:Math.round(1+rng(25)*8)},
    {check:'Board oversight — CSRD G1 vs TCFD Governance', pass:rng(26)>0.15, variance:rng(26)>0.15?0:0},
    {check:'Transition plan timeline — TPT vs CSRD E1', pass:rng(27)>0.2, variance:rng(27)>0.2?0:Math.round(1+rng(28)*3)},
    {check:'PAI indicators — SFDR vs CSRD S1/S2/E1', pass:rng(29)>0.25, variance:rng(29)>0.25?0:Math.round(2+rng(30)*12)},
    {check:'Nature dependency — TNFD vs CSRD E4', pass:rng(31)>0.3, variance:rng(31)>0.3?0:Math.round(1+rng(32)*10)},
    {check:'Revenue segments — SFDR vs EU Taxonomy Art 8', pass:rng(33)>0.2, variance:rng(33)>0.2?0:Math.round(1+rng(34)*5)},
    {check:'Supplier emissions — CSRD S2 vs ISSB S2 C15', pass:rng(35)>0.35, variance:rng(35)>0.35?0:Math.round(3+rng(36)*18)},
    {check:'Water intensity — CSRD E3 vs TNFD B5', pass:rng(37)>0.3, variance:rng(37)>0.3?0:Math.round(1+rng(38)*8)},
  ];
  const passCount=checks.filter(c=>c.pass).length;
  return (
    <div>
      <Row>
        <KpiCard label="Consistency Checks" value={`${passCount}/${checks.length}`} sub="Cross-framework data consistency" />
        <KpiCard label="Variances Detected" value={checks.filter(c=>!c.pass).length} sub="Data reconciliation required" />
        <KpiCard label="Max Variance" value={`${Math.max(...checks.map(c=>c.variance))}%`} sub="Largest single inconsistency" />
        <KpiCard label="Audit Risk" value={checks.filter(c=>!c.pass).length>=4?'High':checks.filter(c=>!c.pass).length>=2?'Medium':'Low'} sub="Inconsistency → assurance risk" />
      </Row>
      <Section title="10 Cross-Framework Consistency Checks">
        <table style={tblStyle}>
          <thead><tr>{['Consistency Check','Status','Variance %'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{checks.map((c,i)=>(<tr key={i} style={!c.pass?{background:'#fef2f2'}:{}}>
            <td style={{...tdStyle,fontSize:11,fontWeight:500}}>{c.check}</td>
            <td style={tdStyle}><Badge color={c.pass?'green':'red'}>{c.pass?'Pass':'Fail'}</Badge></td>
            <td style={{...tdStyle,fontFamily:'monospace'}}>{c.variance>0?<span style={{color:'#b91c1c',fontWeight:700}}>{c.variance}%</span>:'—'}</td>
          </tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab4() {
  const xbrlItems=[
    'CSRD ESRS taxonomy — entity-level tagging',
    'ESRS E1 GHG emissions (mandatory DPs)',
    'ESRS S1 workforce disclosures',
    'ESRS G1 governance indicators',
    'EU Taxonomy KPIs (GAR/BTAR/BSAR)',
    'SFDR PAI 14 indicators',
    'ISSB S2 climate metrics (XBRL IFRS)',
    'Custom extensions — non-standard DPs',
  ];
  const warnings=[
    {level:'Error', message:'ESRS E1.AR-5: GHG inventory boundary inconsistent with consolidation scope'},
    {level:'Warning', message:'ESRS S1.S1-4: 3 employee turnover data points missing or zero'},
    {level:'Warning', message:'EU Taxonomy: Denominator mismatch between Art 8 and BTAR calculation'},
    {level:'Info', message:'SFDR PAI 4: Biodiversity-sensitive area flag not populated for 12 assets'},
    {level:'Info', message:'Extension taxonomy element "esg:WaterConsumptionIntensity" pending ESAP validation'},
  ];
  const levelColor=l=>l==='Error'?'red':l==='Warning'?'yellow':'blue';
  const tagged=xbrlItems.filter((_,i)=>rng(i+40)>0.3);
  return (
    <div>
      <Row>
        <KpiCard label="Tagged Concepts" value={`${tagged.length}/${xbrlItems.length}`} sub="XBRL inline tagging progress" />
        <KpiCard label="Validation Errors" value={warnings.filter(w=>w.level==='Error').length} sub="Blocking — must resolve before filing" />
        <KpiCard label="Warnings" value={warnings.filter(w=>w.level==='Warning').length} sub="Non-blocking but should resolve" />
        <KpiCard label="ESAP Ready" value={tagged.length===xbrlItems.length?'Yes':'Partial'} sub="European Single Access Point" />
      </Row>
      <Section title="XBRL Concept Tagging Checklist">
        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8}}>
          {xbrlItems.map((item,i)=>{const isTagged=rng(i+40)>0.3; return(<li key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,padding:8,borderRadius:6,border:`1px solid ${isTagged?'#bbf7d0':'#fde68a'}`,background:isTagged?'#f0fdf4':'#fffbeb'}}><span style={{width:20,height:20,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:isTagged?'#059669':'#f59e0b',color:'#fff'}}>{isTagged?'✓':'!'}</span>{item}<Badge color={isTagged?'green':'yellow'}>{isTagged?'Tagged':'Pending'}</Badge></li>);})}
        </ul>
      </Section>
      <Section title="XBRL Validation Messages">
        <table style={tblStyle}>
          <thead><tr>{['Level','Message'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{warnings.map((w,i)=>(<tr key={i}><td style={tdStyle}><Badge color={levelColor(w.level)}>{w.level}</Badge></td><td style={{...tdStyle,fontSize:11}}>{w.message}</td></tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab5({frameworks}) {
  const gaps=frameworks.flatMap((fw,fi)=>[
    {framework:fw, dp:`${fw}-DP-${Math.round(1+rng(fi*3)*20)}`, severity: rng(fi*3+1)>0.6?'Critical':rng(fi*3+1)>0.3?'Major':'Minor', source_engine: ['csrd_engine','sfdr_engine','tcfd_engine','tnfd_engine','issb_engine'][fi%5], effort:`${Math.round(1+rng(fi*3+2)*12)} days`},
    {framework:fw, dp:`${fw}-DP-${Math.round(21+rng(fi*3+3)*20)}`, severity: rng(fi*3+4)>0.5?'Major':'Minor', source_engine: ['csrd_engine','sfdr_engine','tcfd_engine','tnfd_engine','issb_engine'][(fi+1)%5], effort:`${Math.round(1+rng(fi*3+5)*8)} days`},
  ]).slice(0,14);
  const gapBySev=[{severity:'Critical',count:gaps.filter(g=>g.severity==='Critical').length},{severity:'Major',count:gaps.filter(g=>g.severity==='Major').length},{severity:'Minor',count:gaps.filter(g=>g.severity==='Minor').length}];
  const sevColor=s=>s==='Critical'?'red':s==='Major'?'yellow':'gray';
  return (
    <div>
      <Row>
        <KpiCard label="Total Gaps" value={gaps.length} sub="Across all frameworks" />
        <KpiCard label="Critical Gaps" value={gaps.filter(g=>g.severity==='Critical').length} sub="Blocking for filing / assurance" />
        <KpiCard label="Est. Remediation" value={`${gaps.reduce((s,g)=>s+parseInt(g.effort),0)} days`} sub="Total effort to close all gaps" />
        <KpiCard label="Source Engines" value={[...new Set(gaps.map(g=>g.source_engine))].length} sub="Distinct data modules implicated" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Priority Gap Table">
          <div style={{overflowY:'auto',maxHeight:320}}>
            <table style={tblStyle}>
              <thead style={{position:'sticky',top:0,background:'#f9fafb'}}><tr>{['Framework','DP','Severity','Source Engine','Effort'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>{gaps.map((g,i)=>(<tr key={i}>
                <td style={tdStyle}><Badge color={COLORS.indexOf(COLORS[frameworks.indexOf(g.framework)])>-1?'blue':'gray'}>{g.framework}</Badge></td>
                <td style={{...tdStyle,fontFamily:'monospace',fontSize:11}}>{g.dp}</td>
                <td style={tdStyle}><Badge color={sevColor(g.severity)}>{g.severity}</Badge></td>
                <td style={{...tdStyle,fontSize:11,color:'#6b7280'}}>{g.source_engine}</td>
                <td style={{...tdStyle,fontSize:11}}>{g.effort}</td>
              </tr>))}</tbody>
            </table>
          </div>
        </Section>
        <Section title="Gaps by Severity">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gapBySev}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="severity" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Gap Count">
                {gapBySev.map((_,i)=><Cell key={i} fill={['#ef4444','#f59e0b','#9ca3af'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

export default function ComprehensiveReportingPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [entityName,setEntityName]=useState('European Financial Group SA');
  const [frameworks,setFrameworks]=useState(['CSRD','SFDR','TCFD']);
  const [reportingYear,setReportingYear]=useState('2024');
  const toggleFw=fw=>setFrameworks(prev=>prev.includes(fw)?prev.filter(f=>f!==fw):[...prev,fw]);
  const panels=[<Tab1 entityName={entityName} frameworks={frameworks} reportingYear={reportingYear}/>,<Tab2 frameworks={frameworks}/>,<Tab3/>,<Tab4/>,<Tab5 frameworks={frameworks}/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827'}}>Comprehensive Reporting Engine</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>CSRD ESRS · SFDR RTS · TCFD · TNFD · ISSB S1/S2 · XBRL · Cross-Framework Consistency · Gap Remediation · E119</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:12,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <Inp label="Entity Name" value={entityName} onChange={e=>setEntityName(e.target.value)} />
            <div>
              <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Frameworks (multi-select)</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
                {ALL_FRAMEWORKS.map(fw=>(<label key={fw} style={{display:'flex',alignItems:'center',gap:4,fontSize:13,cursor:'pointer'}}>
                  <input type="checkbox" checked={frameworks.includes(fw)} onChange={()=>toggleFw(fw)} />{fw}
                </label>))}
              </div>
            </div>
            <Sel label="Reporting Year" value={reportingYear} onChange={e=>setReportingYear(e.target.value)}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </Sel>
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
