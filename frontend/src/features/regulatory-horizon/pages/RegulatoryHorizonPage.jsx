import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,PieChart,Pie,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Regulatory Timeline','Impact Assessment','Compliance Gap Analysis','Regulatory Intelligence'];
const JURISDICTIONS=['EU','UK','USA','Germany','France','Switzerland','Singapore','Australia','Japan','Canada','Netherlands','Sweden','Hong Kong','UAE','India'];
const STATUSES=['In Force','Finalised','Consultation','Proposed','Draft'];
const TOPICS=['Reporting','Disclosure','Climate','Taxonomy','Governance','Human Rights','Technology','Biodiversity','Due Diligence','Anti-Greenwashing'];
const STATUS_C={['In Force']:{bg:'#dcfce7',fg:T.green},Finalised:{bg:'#dbeafe',fg:'#2563eb'},Consultation:{bg:'#fef9c3',fg:T.amber},Proposed:{bg:'#fce7f3',fg:'#db2777'},Draft:{bg:'#f3f4f6',fg:T.textMut}};
const PIE_C=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0284c7','#db2777'];

const REGS=Array.from({length:60},(_,i)=>{
  const names=['CSRD Wave 3 SMEs','SFDR Level 3 RTS','EU AI Act FinSvcs','CSDDD Implementation','EU Taxonomy Delegated Act 3','UK SDR Anti-Greenwash','FCA Sustainability Labels','PRA Climate SS3/23','SEC Climate Rule Final','SEC ESG Fund Names','ISSB S1/S2 Adoption','TNFD Framework v2','Basel Green Risk Weights','ECB Climate Stress 2026','ESMA ESG Ratings Reg','MAS Green Taxonomy','HKMA Climate Risk','APRA CPG 229 Update','JFSA SSBJ Standards','Canada CSSB S1','Swiss TCFD Mandate Update','Singapore GFIT v3','Australia Climate Bill','India BRSR Core','UAE Green Finance Framework','Netherlands ESG Due Diligence','Sweden Sustainability Reporting','Germany LkSG Enforcement','France Vigilance Law Update','EU Deforestation Reg','EU Green Bond Standard','UK TPT Framework','US DOL ESG Rule Update','EU ETS Phase 5','Corporate Governance Code ESG','EFRAG Sector Standards Set 1','EFRAG Sector Standards Set 2','IOSCO ESG Data Providers','Global Baseline Sustainability','ISO 14097 Update','EU Soil Health Directive','Water Framework Directive Rev','EU Packaging Waste Reg','UK Energy Savings Opp Scheme','Japan Human Rights DD','Korea ESG Disclosure Mandate','Brazil Green Taxonomy','Mexico Climate Disclosure','South Africa Climate Bill','ASEAN Taxonomy v3','EU Nature Restoration','Digital Product Passport','EU Methane Regulation','UK Biodiversity Net Gain','Canada Modern Slavery Act','Australia Modern Slavery Update','India ESG Assurance Mandate','Hong Kong Climate ISSB','UAE ESG Governance Code','Singapore Transition Planning'];
  const jIdx=i%15;
  return{id:i+1,name:names[i]||`Regulation ${i+1}`,jurisdiction:JURISDICTIONS[jIdx],topic:TOPICS[Math.floor(sr(i*3)*10)],status:STATUSES[Math.floor(sr(i*7)*5)],startQ:`Q${1+Math.floor(sr(i*11)*4)} ${2025+Math.floor(sr(i*13)*3)}`,deadline:`Q${1+Math.floor(sr(i*17)*4)} ${2026+Math.floor(sr(i*19)*2)}`,impactScore:Math.round(30+sr(i*23)*70),complianceCost:Math.round(50+sr(i*29)*950),fte:Math.round(1+sr(i*31)*12),readiness:Math.round(10+sr(i*37)*80),gapCount:Math.round(sr(i*41)*15),priority:['Critical','High','Medium','Low'][Math.floor(sr(i*43)*4)]};
});

const COMPANIES=['TotalEnergies','Shell plc','BP plc','HSBC Holdings','Barclays','Deutsche Bank','BNP Paribas','Allianz SE','AXA Group','Unilever','Nestle','Siemens','SAP SE','Volkswagen','BMW Group','Rio Tinto','BHP Group','Glencore','ArcelorMittal','BASF SE','Novo Nordisk','Roche','Novartis','AstraZeneca','GSK plc','JPMorgan Chase','Goldman Sachs','BlackRock','Vanguard','State Street'];
const compGapMatrix=COMPANIES.map((c,ci)=>({company:c,gaps:REGS.slice(0,20).map((r,ri)=>({reg:r.name,status:['Compliant','Partial','Gap','N/A'][Math.floor(sr(ci*100+ri*7)*4)],score:Math.round(sr(ci*50+ri*13)*100)}))}));

const ALERTS=[
  {id:1,date:'2026-03-28',title:'CSRD Wave 3: Final delegated act published',severity:'High',jurisdiction:'EU'},
  {id:2,date:'2026-03-27',title:'FCA issues guidance on sustainability labels',severity:'Medium',jurisdiction:'UK'},
  {id:3,date:'2026-03-26',title:'SEC postpones climate rule enforcement',severity:'High',jurisdiction:'USA'},
  {id:4,date:'2026-03-25',title:'ESMA publishes ESG rating provider register',severity:'Medium',jurisdiction:'EU'},
  {id:5,date:'2026-03-24',title:'MAS finalises green taxonomy for Singapore',severity:'Low',jurisdiction:'Singapore'},
  {id:6,date:'2026-03-23',title:'JFSA adopts SSBJ standards effective 2027',severity:'High',jurisdiction:'Japan'},
  {id:7,date:'2026-03-22',title:'Australia passes Climate Related Disclosures Bill',severity:'High',jurisdiction:'Australia'},
  {id:8,date:'2026-03-21',title:'India SEBI mandates BRSR Core assurance',severity:'Medium',jurisdiction:'India'},
  {id:9,date:'2026-03-20',title:'ECB publishes climate stress test methodology update',severity:'High',jurisdiction:'EU'},
  {id:10,date:'2026-03-19',title:'Korea FSC sets ESG disclosure timeline',severity:'Medium',jurisdiction:'Hong Kong'},
  {id:11,date:'2026-03-18',title:'Canada CSSB S1 exposure draft comments close',severity:'Low',jurisdiction:'Canada'},
  {id:12,date:'2026-03-17',title:'EU Green Bond Standard enters into force',severity:'High',jurisdiction:'EU'},
];

const exportCSV=(rows,filename)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u);};

const Kpi=({label,value,sub,accent=T.navy})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',borderLeft:`3px solid ${accent}`}}><div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:accent,marginTop:3}}>{sub}</div>}</div>;
const Row=({children,cols})=><div style={{display:'grid',gridTemplateColumns:cols||'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>;
const Badge=({children,bg,fg})=><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:bg||T.surfaceH,color:fg||T.text}}>{children}</span>;

export default function RegulatoryHorizonPage(){
  const [tab,setTab]=useState(0);
  const [jurFilter,setJurFilter]=useState('All');
  const [topicFilter,setTopicFilter]=useState('All');
  const [statusFilter,setStatusFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('impactScore');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedReg,setSelectedReg]=useState(null);
  const [impactWeights,setImpactWeights]=useState({cost:50,complexity:30,timeline:20});
  const [selectedCompany,setSelectedCompany]=useState(0);
  const [alertJur,setAlertJur]=useState('All');
  const [intSearch,setIntSearch]=useState('');

  const filtered=useMemo(()=>{
    let r=[...REGS];
    if(jurFilter!=='All')r=r.filter(x=>x.jurisdiction===jurFilter);
    if(topicFilter!=='All')r=r.filter(x=>x.topic===topicFilter);
    if(statusFilter!=='All')r=r.filter(x=>x.status===statusFilter);
    if(search)r=r.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
    r.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return r;
  },[jurFilter,topicFilter,statusFilter,search,sortCol,sortDir]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const kpis=useMemo(()=>({
    total:REGS.length,
    inForce:REGS.filter(r=>r.status==='In Force').length,
    avgReadiness:Math.round(REGS.reduce((a,r)=>a+r.readiness,0)/REGS.length),
    totalCost:Math.round(REGS.reduce((a,r)=>a+r.complianceCost,0)),
    critCount:REGS.filter(r=>r.priority==='Critical').length,
    avgGaps:Math.round(REGS.reduce((a,r)=>a+r.gapCount,0)/REGS.length*10)/10,
  }),[]);

  const byJurisdiction=useMemo(()=>JURISDICTIONS.map(j=>({name:j,count:REGS.filter(r=>r.jurisdiction===j).length,avgImpact:Math.round(REGS.filter(r=>r.jurisdiction===j).reduce((a,r)=>a+r.impactScore,0)/(REGS.filter(r=>r.jurisdiction===j).length||1))})),[]);
  const byTopic=useMemo(()=>TOPICS.map(t=>({name:t,value:REGS.filter(r=>r.topic===t).length})),[]);
  const byStatus=useMemo(()=>STATUSES.map(s=>({name:s,value:REGS.filter(r=>r.status===s).length})),[]);
  const timelineData=useMemo(()=>['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'].map((q,i)=>({quarter:q,starting:Math.round(3+sr(i*71)*8),deadline:Math.round(2+sr(i*73)*10),cumulative:Math.round((i+1)*7+sr(i*79)*5)})),[]);

  const th={padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'left',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',userSelect:'none'};
  const td={padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};

  const renderTimeline=()=>{
    const ganttRegs=filtered.slice(0,30);
    const quarters=['Q1 25','Q2 25','Q3 25','Q4 25','Q1 26','Q2 26','Q3 26','Q4 26'];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Regulations" value={kpis.total} sub={`${kpis.critCount} critical`} accent={T.red}/><Kpi label="In Force" value={kpis.inForce} sub={`${Math.round(kpis.inForce/kpis.total*100)}% of pipeline`} accent={T.green}/><Kpi label="Avg. Readiness" value={`${kpis.avgReadiness}%`} sub={kpis.avgReadiness<50?'Below target':'On track'} accent={kpis.avgReadiness<50?T.amber:T.sage}/><Kpi label="Total Compliance Cost" value={`$${(kpis.totalCost/1000).toFixed(1)}M`} sub={`${Math.round(kpis.totalCost/kpis.total)}K avg per reg`} accent={T.gold}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search regulations..." style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 12px',fontSize:13,fontFamily:T.font,width:220,outline:'none'}}/>
        <select value={jurFilter} onChange={e=>setJurFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Jurisdictions</option>{JURISDICTIONS.map(j=><option key={j}>{j}</option>)}</select>
        <select value={topicFilter} onChange={e=>setTopicFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Topics</option>{TOPICS.map(t=><option key={t}>{t}</option>)}</select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
        <button onClick={()=>exportCSV(filtered.map(r=>({Name:r.name,Jurisdiction:r.jurisdiction,Topic:r.topic,Status:r.status,Impact:r.impactScore,Cost:r.complianceCost,Readiness:r.readiness})),'regulatory_timeline.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,fontFamily:T.font,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8,fontFamily:T.font}}>Regulatory Timeline (Gantt View)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',fontSize:12,borderCollapse:'collapse',minWidth:900}}>
            <thead><tr><th style={{...th,minWidth:200}}>Regulation</th><th style={{...th,width:70}}>Status</th>{quarters.map(q=><th key={q} style={{...th,textAlign:'center',width:80}}>{q}</th>)}</tr></thead>
            <tbody>{ganttRegs.map((r,ri)=>{const startQ=Math.floor(sr(ri*51)*8);const dur=1+Math.floor(sr(ri*53)*3);const sc=STATUS_C[r.status]||STATUS_C.Draft;return(<tr key={r.id} style={{cursor:'pointer',background:selectedReg===r.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedReg(selectedReg===r.id?null:r.id)}>
              <td style={{...td,fontWeight:500}}>{r.name}</td>
              <td style={td}><Badge bg={sc.bg} fg={sc.fg}>{r.status}</Badge></td>
              {quarters.map((_,qi)=><td key={qi} style={{...td,padding:0}}>{qi>=startQ&&qi<startQ+dur?<div style={{height:18,background:sc.fg,borderRadius:3,margin:'3px 2px',opacity:0.7}}/>:null}</td>)}
            </tr>)})}</tbody>
          </table>
        </div>
      </div>
      {selectedReg&&(()=>{const r=REGS.find(x=>x.id===selectedReg);if(!r)return null;const sc=STATUS_C[r.status]||STATUS_C.Draft;return(<div style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:10,padding:18,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:T.font}}>{r.name}</div><button onClick={()=>setSelectedReg(null)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.textMut}}>x</button></div>
        <Row cols="1fr 1fr 1fr 1fr 1fr">
          <div><span style={{fontSize:11,color:T.textSec}}>Jurisdiction</span><div style={{fontWeight:600}}>{r.jurisdiction}</div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>Topic</span><div>{r.topic}</div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>Status</span><div><Badge bg={sc.bg} fg={sc.fg}>{r.status}</Badge></div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>Start</span><div>{r.startQ}</div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>Deadline</span><div style={{fontWeight:600,color:T.red}}>{r.deadline}</div></div>
        </Row>
        <Row cols="1fr 1fr 1fr 1fr">
          <div><span style={{fontSize:11,color:T.textSec}}>Impact Score</span><div style={{fontSize:20,fontWeight:700,color:r.impactScore>70?T.red:r.impactScore>40?T.amber:T.green}}>{r.impactScore}/100</div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>Compliance Cost</span><div style={{fontSize:16,fontWeight:600}}>${r.complianceCost}K</div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>FTE Required</span><div style={{fontSize:16,fontWeight:600}}>{r.fte}</div></div>
          <div><span style={{fontSize:11,color:T.textSec}}>Readiness</span><div style={{fontSize:16,fontWeight:600,color:r.readiness<40?T.red:r.readiness<70?T.amber:T.green}}>{r.readiness}%</div></div>
        </Row>
        <div style={{width:'100%',height:6,background:T.border,borderRadius:3,marginTop:4}}><div style={{width:`${r.readiness}%`,height:6,background:r.readiness<40?T.red:r.readiness<70?T.amber:T.green,borderRadius:3}}/></div>
      </div>);})()}
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8,fontFamily:T.font}}>Regulations by Jurisdiction</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={byJurisdiction}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-35} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12,fontFamily:T.font}}/><Bar dataKey="count" fill={T.navy} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8,fontFamily:T.font}}>Timeline Cumulative View</div>
          <ResponsiveContainer width="100%" height={260}><LineChart data={timelineData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12,fontFamily:T.font}}/><Legend/><Line type="monotone" dataKey="starting" stroke={T.sage} strokeWidth={2} name="Starting"/><Line type="monotone" dataKey="deadline" stroke={T.red} strokeWidth={2} name="Deadline"/><Line type="monotone" dataKey="cumulative" stroke={T.navy} strokeWidth={2} strokeDasharray="5 5" name="Cumulative"/></LineChart></ResponsiveContainer>
        </div>
      </Row>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8,fontFamily:T.font}}>By Topic</div>
          <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={byTopic} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{byTopic.map((_,i)=><Cell key={i} fill={PIE_C[i%PIE_C.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8,fontFamily:T.font}}>By Status</div>
          <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={byStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{byStatus.map((_,i)=><Cell key={i} fill={PIE_C[i%PIE_C.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
      </Row>
    </div>);
  };

  const renderImpact=()=>{
    const weighted=filtered.map(r=>({...r,weightedScore:Math.round((r.complianceCost/10*impactWeights.cost/100)+(r.impactScore*impactWeights.complexity/100)+(r.gapCount*5*impactWeights.timeline/100))})).sort((a,b)=>b.weightedScore-a.weightedScore);
    const topChart=weighted.slice(0,20).map(r=>({name:r.name.slice(0,25),score:r.weightedScore,impact:r.impactScore,cost:Math.round(r.complianceCost/10)}));
    const priorityDist=[{name:'Critical',value:REGS.filter(r=>r.priority==='Critical').length},{name:'High',value:REGS.filter(r=>r.priority==='High').length},{name:'Medium',value:REGS.filter(r=>r.priority==='Medium').length},{name:'Low',value:REGS.filter(r=>r.priority==='Low').length}];
    return(<div>
      <div style={{fontWeight:600,fontSize:14,color:T.text,marginBottom:12,fontFamily:T.font}}>Impact Scoring Weights</div>
      <Row cols="1fr 1fr 1fr">
        {[{k:'cost',label:'Cost Weight'},{k:'complexity',label:'Complexity Weight'},{k:'timeline',label:'Timeline Weight'}].map(w=>(
          <div key={w.k} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>{w.label}</span><span style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{impactWeights[w.k]}%</span></div>
            <input type="range" min={0} max={100} value={impactWeights[w.k]} onChange={e=>setImpactWeights(p=>({...p,[w.k]:+e.target.value}))} style={{width:'100%',accentColor:T.navy}}/>
          </div>
        ))}
      </Row>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Top 20 by Weighted Impact Score</div>
          <ResponsiveContainer width="100%" height={400}><BarChart data={topChart} layout="vertical" margin={{left:120}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={115}/><Tooltip contentStyle={{fontSize:12,fontFamily:T.font}}/><Legend/><Bar dataKey="score" fill={T.navy} name="Weighted Score" radius={[0,3,3,0]}/><Bar dataKey="impact" fill={T.gold} name="Raw Impact" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Priority Distribution</div>
          <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={priorityDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{priorityDist.map((_,i)=><Cell key={i} fill={[T.red,T.amber,T.gold,T.textMut][i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
          <div style={{marginTop:12}}>
            {priorityDist.map((p,i)=><div key={p.name} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:[T.red,T.amber,T.gold,T.textMut][i],fontWeight:600}}>{p.name}</span><span>{p.value} regulations</span></div>)}
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{fontWeight:600,fontSize:13,color:T.text}}>Full Impact Assessment Table</div><button onClick={()=>exportCSV(weighted.map(r=>({Name:r.name,Jurisdiction:r.jurisdiction,WeightedScore:r.weightedScore,ImpactScore:r.impactScore,Cost:r.complianceCost,FTE:r.fte,Priority:r.priority})),'impact_assessment.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'5px 12px',fontSize:11,cursor:'pointer',fontFamily:T.font}}>Export</button></div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,zIndex:1}}><tr>
              {[{k:'name',l:'Regulation'},{k:'jurisdiction',l:'Jurisdiction'},{k:'weightedScore',l:'Weighted Score'},{k:'impactScore',l:'Impact'},{k:'complianceCost',l:'Cost ($K)'},{k:'fte',l:'FTE'},{k:'readiness',l:'Readiness %'},{k:'priority',l:'Priority'}].map(c=><th key={c.k} style={th} onClick={()=>toggleSort(c.k)}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}
            </tr></thead>
            <tbody>{weighted.slice(0,40).map(r=>{const pc={Critical:T.red,High:T.amber,Medium:T.gold,Low:T.textMut}[r.priority];return(<tr key={r.id} style={{cursor:'pointer'}} onClick={()=>setSelectedReg(selectedReg===r.id?null:r.id)}>
              <td style={{...td,fontWeight:500}}>{r.name}</td><td style={td}>{r.jurisdiction}</td><td style={{...td,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{r.weightedScore}</td><td style={td}>{r.impactScore}</td><td style={td}>${r.complianceCost}K</td><td style={td}>{r.fte}</td>
              <td style={td}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:50,height:5,background:T.border,borderRadius:3}}><div style={{width:`${r.readiness}%`,height:5,background:r.readiness<40?T.red:r.readiness<70?T.amber:T.green,borderRadius:3}}/></div><span style={{fontSize:11,fontFamily:T.mono}}>{r.readiness}%</span></div></td>
              <td style={td}><Badge bg={pc+'20'} fg={pc}>{r.priority}</Badge></td>
            </tr>)})}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  const renderGapAnalysis=()=>{
    const co=compGapMatrix[selectedCompany];
    const gapCounts={Compliant:0,Partial:0,Gap:0,'N/A':0};co.gaps.forEach(g=>gapCounts[g.status]++);
    const gapPie=Object.entries(gapCounts).filter(([_,v])=>v>0).map(([k,v])=>({name:k,value:v}));
    const gapColors={Compliant:T.green,Partial:T.amber,Gap:T.red,'N/A':T.textMut};
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Companies Tracked" value={COMPANIES.length} accent={T.navy}/><Kpi label="Regulations Mapped" value={20} accent={T.gold}/><Kpi label="Total Gap Cells" value={COMPANIES.length*20} accent={T.sage}/><Kpi label="Critical Gaps" value={compGapMatrix.reduce((a,c)=>a+c.gaps.filter(g=>g.status==='Gap').length,0)} sub="Requiring remediation" accent={T.red}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <select value={selectedCompany} onChange={e=>setSelectedCompany(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:200}}>{COMPANIES.map((c,i)=><option key={c} value={i}>{c}</option>)}</select>
        <button onClick={()=>exportCSV(co.gaps.map(g=>({Company:co.company,Regulation:g.reg,Status:g.status,Score:g.score})),'gap_analysis.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export Gaps</button>
      </div>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.company} - Compliance Matrix</div>
          <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{position:'sticky',top:0}}><tr><th style={th}>Regulation</th><th style={th}>Status</th><th style={th}>Score</th></tr></thead>
              <tbody>{co.gaps.map((g,i)=><tr key={i}><td style={{...td,fontWeight:500,fontSize:11}}>{g.reg}</td><td style={td}><Badge bg={gapColors[g.status]+'20'} fg={gapColors[g.status]}>{g.status}</Badge></td><td style={td}><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:40,height:5,background:T.border,borderRadius:3}}><div style={{width:`${g.score}%`,height:5,background:g.score>70?T.green:g.score>40?T.amber:T.red,borderRadius:3}}/></div><span style={{fontSize:10,fontFamily:T.mono}}>{g.score}</span></div></td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Gap Distribution</div>
            <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={gapPie} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{gapPie.map((g,i)=><Cell key={i} fill={gapColors[g.name]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Summary</div>
            {Object.entries(gapCounts).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:gapColors[k],fontWeight:600}}>{k}</span><span style={{fontFamily:T.mono}}>{v} / {co.gaps.length}</span></div>)}
            <div style={{marginTop:10,fontSize:12,color:T.textSec}}>Overall Score: <span style={{fontWeight:700,color:T.navy,fontFamily:T.mono}}>{Math.round(co.gaps.reduce((a,g)=>a+g.score,0)/co.gaps.length)}/100</span></div>
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginTop:12}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Cross-Company Heatmap (Top 10 Companies x Top 10 Regulations)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',fontSize:10}}>
            <thead><tr><th style={{...th,fontSize:10}}></th>{REGS.slice(0,10).map(r=><th key={r.id} style={{...th,fontSize:9,writingMode:'vertical-lr',height:100,textAlign:'center',maxWidth:30}}>{r.name.slice(0,20)}</th>)}</tr></thead>
            <tbody>{compGapMatrix.slice(0,10).map((c,ci)=><tr key={ci}><td style={{...td,fontWeight:600,fontSize:10,whiteSpace:'nowrap'}}>{c.company}</td>{c.gaps.slice(0,10).map((g,gi)=>{const bg=gapColors[g.status]||T.textMut;return <td key={gi} style={{...td,background:bg+'30',textAlign:'center',fontSize:9,fontWeight:600,color:bg,width:30,height:28}}>{g.score}</td>;})}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  const renderIntelligence=()=>{
    const filteredAlerts=alertJur==='All'?ALERTS:ALERTS.filter(a=>a.jurisdiction===alertJur);
    const searchedAlerts=intSearch?filteredAlerts.filter(a=>a.title.toLowerCase().includes(intSearch.toLowerCase())):filteredAlerts;
    const sevColors={High:T.red,Medium:T.amber,Low:T.green};
    const jurAlertCount=JURISDICTIONS.slice(0,8).map(j=>({name:j,alerts:ALERTS.filter(a=>a.jurisdiction===j).length,high:ALERTS.filter(a=>a.jurisdiction===j&&a.severity==='High').length}));
    const monthlyTrend=[{m:'Oct',count:8},{m:'Nov',count:12},{m:'Dec',count:15},{m:'Jan',count:18},{m:'Feb',count:14},{m:'Mar',count:22}];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Active Alerts" value={ALERTS.length} accent={T.red}/><Kpi label="High Severity" value={ALERTS.filter(a=>a.severity==='High').length} accent={T.red}/><Kpi label="Jurisdictions Covered" value={[...new Set(ALERTS.map(a=>a.jurisdiction))].length} accent={T.navy}/><Kpi label="This Week" value={ALERTS.filter(a=>a.date>='2026-03-22').length} sub="New developments" accent={T.amber}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input value={intSearch} onChange={e=>setIntSearch(e.target.value)} placeholder="Search intelligence..." style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 12px',fontSize:13,fontFamily:T.font,width:260,outline:'none'}}/>
        <select value={alertJur} onChange={e=>setAlertJur(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Jurisdictions</option>{[...new Set(ALERTS.map(a=>a.jurisdiction))].map(j=><option key={j}>{j}</option>)}</select>
        <button onClick={()=>exportCSV(searchedAlerts.map(a=>({Date:a.date,Title:a.title,Severity:a.severity,Jurisdiction:a.jurisdiction})),'regulatory_intelligence.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export Alerts</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Alert Feed</div>
          <div style={{maxHeight:350,overflowY:'auto'}}>
            {searchedAlerts.map(a=><div key={a.id} style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{width:8,height:8,borderRadius:4,background:sevColors[a.severity],marginTop:5,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:2}}>{a.title}</div>
                <div style={{display:'flex',gap:8,fontSize:11,color:T.textSec}}><span>{a.date}</span><Badge bg={sevColors[a.severity]+'20'} fg={sevColors[a.severity]}>{a.severity}</Badge><span>{a.jurisdiction}</span></div>
              </div>
            </div>)}
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Alerts by Jurisdiction</div>
            <ResponsiveContainer width="100%" height={180}><BarChart data={jurAlertCount}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="alerts" fill={T.navy} name="Total" radius={[3,3,0,0]}/><Bar dataKey="high" fill={T.red} name="High" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Monthly Trend</div>
            <ResponsiveContainer width="100%" height={150}><LineChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="m" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Line type="monotone" dataKey="count" stroke={T.navy} strokeWidth={2}/></LineChart></ResponsiveContainer>
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginTop:12}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Upcoming Regulatory Deadlines (Next 12 Months)</div>
        <div style={{overflowX:'auto',maxHeight:300,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Regulation','Jurisdiction','Topic','Deadline','Priority','Readiness'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{REGS.filter(r=>r.deadline.includes('2026')||r.deadline.includes('2027')).slice(0,25).map(r=>{const pc={Critical:T.red,High:T.amber,Medium:T.gold,Low:T.textMut}[r.priority];return(<tr key={r.id}><td style={{...td,fontWeight:500}}>{r.name}</td><td style={td}>{r.jurisdiction}</td><td style={td}>{r.topic}</td><td style={{...td,fontWeight:600}}>{r.deadline}</td><td style={td}><Badge bg={pc+'20'} fg={pc}>{r.priority}</Badge></td><td style={td}><span style={{fontFamily:T.mono,color:r.readiness<40?T.red:T.green}}>{r.readiness}%</span></td></tr>)})}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 28px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0}}>Regulatory Horizon Scanner</h1><p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Track 60 regulations across 15 jurisdictions with impact scoring and compliance gap analysis</p></div>
    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:tab===i?T.surface:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderTimeline()}
    {tab===1&&renderImpact()}
    {tab===2&&renderGapAnalysis()}
    {tab===3&&renderIntelligence()}
  </div>);
}