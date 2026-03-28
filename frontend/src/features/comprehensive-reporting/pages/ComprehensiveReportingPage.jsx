import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const TABS=['Multi-Framework Dashboard','Datapoint Mapper','Report Builder','Submission Tracker'];
const PIE_C=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0284c7','#db2777'];

const FRAMEWORKS=[
  {id:'csrd',name:'CSRD/ESRS',fullName:'Corporate Sustainability Reporting Directive',jurisdiction:'EU',deadline:'Jan 2026',status:'Mandatory',totalDatapoints:1144,color:T.navy},
  {id:'sfdr',name:'SFDR',fullName:'Sustainable Finance Disclosure Regulation',jurisdiction:'EU',deadline:'Ongoing',status:'Mandatory',totalDatapoints:64,color:T.gold},
  {id:'issb',name:'ISSB S1/S2',fullName:'IFRS Sustainability Disclosure Standards',jurisdiction:'Global',deadline:'Jan 2025',status:'Adopted',totalDatapoints:218,color:T.sage},
  {id:'tcfd',name:'TCFD',fullName:'Task Force on Climate-related Financial Disclosures',jurisdiction:'Global',deadline:'Annual',status:'Superseded by ISSB',totalDatapoints:93,color:T.amber},
  {id:'gri',name:'GRI Standards',fullName:'Global Reporting Initiative',jurisdiction:'Global',deadline:'Annual',status:'Voluntary',totalDatapoints:387,color:'#7c3aed'},
  {id:'cdp',name:'CDP',fullName:'Carbon Disclosure Project',jurisdiction:'Global',deadline:'Jul 2026',status:'Voluntary',totalDatapoints:256,color:'#0284c7'},
  {id:'uksdr',name:'UK SDR',fullName:'UK Sustainability Disclosure Requirements',jurisdiction:'UK',deadline:'2026',status:'Phased',totalDatapoints:85,color:'#db2777'},
  {id:'sec',name:'SEC Climate',fullName:'SEC Climate-Related Disclosure Rule',jurisdiction:'USA',deadline:'2026',status:'Litigation',totalDatapoints:142,color:T.red},
];

const generateFrameworkData=()=>FRAMEWORKS.map((fw,fi)=>{
  const coverage=Math.round(30+sr(fi*7)*60);
  const gapCount=Math.round(fw.totalDatapoints*(100-coverage)/100);
  const sections=Array.from({length:5+Math.floor(sr(fi*11)*5)},(_,si)=>{
    const sectionNames={csrd:['E1 Climate','E2 Pollution','E3 Water','E4 Biodiversity','E5 Circular','S1 Own Workforce','S2 Value Chain Workers','S3 Communities','S4 Consumers','G1 Business Conduct'],sfdr:['Principal Adverse Impacts','Pre-contractual','Periodic','Website','Product-level'],issb:['Governance','Strategy','Risk Management','Metrics & Targets','Industry-Specific','Climate Resilience','Transition Plans'],tcfd:['Governance','Strategy','Risk Management','Metrics','Scenario Analysis'],gri:['GRI 2 General','GRI 3 Material Topics','GRI 200 Economic','GRI 300 Environmental','GRI 400 Social','Sector Standards'],cdp:['Governance','Risks & Opportunities','Business Strategy','Targets & Performance','Emissions','Energy','Value Chain','Verification'],uksdr:['Entity-level','Product-level','Labels','Anti-Greenwashing','Naming & Marketing'],sec:['Governance','Strategy','Risk Management','GHG Emissions','Financial Impacts','Scenario Analysis']};
    const names=sectionNames[fw.id]||[`Section ${si+1}`];
    const name=names[si%names.length];
    const dp=Math.round(fw.totalDatapoints*0.05+sr(fi*50+si*13)*fw.totalDatapoints*0.2);
    const filled=Math.round(dp*coverage/100+sr(fi*50+si*17)*dp*0.1);
    return{name,datapoints:dp,filled:Math.min(filled,dp),coverage:Math.min(100,Math.round(filled/dp*100)),status:filled/dp>0.8?'Complete':filled/dp>0.5?'In Progress':'Gap'};
  });
  return{...fw,coverage,gapCount,sections,qualityScore:Math.round(40+sr(fi*31)*50),automationPct:Math.round(20+sr(fi*37)*60)};
});

const FW_DATA=generateFrameworkData();

const DATAPOINT_MAP=FRAMEWORKS.flatMap((fw,fi)=>Array.from({length:20},(_,di)=>{
  const topics=['GHG Emissions Scope 1','GHG Emissions Scope 2','GHG Emissions Scope 3','Energy Consumption','Water Withdrawal','Waste Generated','Biodiversity Impact','Employee Count','Gender Pay Gap','Board Diversity','CEO Pay Ratio','Human Rights Policy','Supply Chain Audit','Anti-Corruption Training','Carbon Targets','SBTi Alignment','TCFD Governance','Climate Risk Assessment','Transition Plan','Physical Risk Assessment'];
  const dp=topics[di];
  const alignedWith=FRAMEWORKS.filter((_,ofi)=>ofi!==fi&&sr(fi*100+di*50+ofi*7)>0.4).map(f=>f.id);
  return{id:`${fw.id}-${di}`,framework:fw.id,frameworkName:fw.name,datapoint:dp,category:['Environmental','Social','Governance'][Math.floor(sr(fi*200+di*13)*3)],required:sr(fi*200+di*17)>0.3,filled:sr(fi*200+di*23)>0.4,quality:Math.round(30+sr(fi*200+di*29)*65),alignedWith};
}));

const SUBMISSIONS=FRAMEWORKS.map((fw,fi)=>({
  framework:fw.name,jurisdiction:fw.jurisdiction,deadline:fw.deadline,status:['Submitted','In Review','Draft','Not Started','Overdue'][Math.floor(sr(fi*7)*5)],
  lastUpdated:`2026-03-${String(15+Math.floor(sr(fi*11)*13)).padStart(2,'0')}`,
  assignee:['Sarah Chen','James Wright','Maria Santos','Alex Kim','David Liu','Emma Brown','Tom Wilson','Lisa Zhang'][fi%8],
  completeness:Math.round(20+sr(fi*13)*75),
  auditTrail:Array.from({length:3+Math.floor(sr(fi*17)*4)},(_,ai)=>({
    date:`2026-${String(1+Math.floor(sr(fi*50+ai*7)*3)).padStart(2,'0')}-${String(1+Math.floor(sr(fi*50+ai*11)*28)).padStart(2,'0')}`,
    action:['Created draft','Updated metrics','Reviewed by compliance','Sent for approval','Submitted to regulator','Revision requested','Approved by board'][ai%7],
    user:['Sarah Chen','James Wright','Maria Santos','Alex Kim'][ai%4]
  }))
}));

const exportCSV=(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const Kpi=({label,value,sub,accent=T.navy})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',borderLeft:`3px solid ${accent}`}}><div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:accent,marginTop:3}}>{sub}</div>}</div>;
const Row=({children,cols})=><div style={{display:'grid',gridTemplateColumns:cols||'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>;
const Badge=({children,bg,fg})=><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:bg||T.surfaceH,color:fg||T.text}}>{children}</span>;

export default function ComprehensiveReportingPage(){
  const [tab,setTab]=useState(0);
  const [selectedFw,setSelectedFw]=useState(0);
  const [search,setSearch]=useState('');
  const [categoryFilter,setCategoryFilter]=useState('All');
  const [mapFramework1,setMapFramework1]=useState('csrd');
  const [mapFramework2,setMapFramework2]=useState('issb');
  const [builderFramework,setBuilderFramework]=useState('csrd');
  const [builderSections,setBuilderSections]=useState([]);
  const [sortCol,setSortCol]=useState('completeness');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedSubmission,setSelectedSubmission]=useState(null);
  const [showOverlap,setShowOverlap]=useState(true);

  const th={padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'left',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',userSelect:'none'};
  const td={padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const avgCoverage=Math.round(FW_DATA.reduce((a,f)=>a+f.coverage,0)/FW_DATA.length);
  const totalDatapoints=FRAMEWORKS.reduce((a,f)=>a+f.totalDatapoints,0);
  const totalGaps=FW_DATA.reduce((a,f)=>a+f.gapCount,0);

  const renderDashboard=()=>{
    const fw=FW_DATA[selectedFw];
    const coverageData=FW_DATA.map(f=>({name:f.name,coverage:f.coverage,gaps:100-f.coverage}));
    const radarData=FW_DATA.map(f=>({framework:f.name,coverage:f.coverage,quality:f.qualityScore,automation:f.automationPct}));
    const statusColors={Submitted:T.green,'In Review':T.amber,Draft:T.navy,'Not Started':T.textMut,Overdue:T.red};
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Frameworks Tracked" value={8} accent={T.navy}/><Kpi label="Avg Coverage" value={`${avgCoverage}%`} sub={avgCoverage>60?'On track':'Below target'} accent={avgCoverage>60?T.green:T.red}/><Kpi label="Total Datapoints" value={totalDatapoints.toLocaleString()} accent={T.gold}/><Kpi label="Open Gaps" value={totalGaps} sub="Across all frameworks" accent={T.red}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={selectedFw} onChange={e=>setSelectedFw(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:200}}>{FW_DATA.map((f,i)=><option key={i} value={i}>{f.name} - {f.fullName}</option>)}</select>
        <button onClick={()=>exportCSV(FW_DATA.map(f=>({Framework:f.name,Jurisdiction:f.jurisdiction,Datapoints:f.totalDatapoints,Coverage:f.coverage,Gaps:f.gapCount,Quality:f.qualityScore,Automation:f.automationPct})),'framework_dashboard.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Framework Coverage Comparison</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={coverageData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="coverage" fill={T.green} name="Coverage %" stackId="a" radius={[3,3,0,0]}/><Bar dataKey="gaps" fill={T.red+'40'} name="Gap %" stackId="a"/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Quality & Automation Radar</div>
          <ResponsiveContainer width="100%" height={280}><RadarChart outerRadius={90} data={radarData}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="framework" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="coverage" stroke={T.green} fill={T.green+'30'} name="Coverage"/><Radar dataKey="quality" stroke={T.navy} fill={T.navy+'30'} name="Quality"/><Radar dataKey="automation" stroke={T.gold} fill={T.gold+'30'} name="Automation"/><Legend/></RadarChart></ResponsiveContainer>
        </div>
      </Row>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{fw.name} - Section Breakdown</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {fw.sections.map((s,i)=>{const sc={Complete:T.green,'In Progress':T.amber,Gap:T.red}[s.status];return<div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,fontWeight:500}}>{s.name}</span><Badge bg={sc+'20'} fg={sc}>{s.status}</Badge></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,height:6,background:T.border,borderRadius:3}}><div style={{width:`${s.coverage}%`,height:6,background:sc,borderRadius:3}}/></div>
                <span style={{fontSize:10,fontFamily:T.mono,color:sc,minWidth:40,textAlign:'right'}}>{s.coverage}%</span>
                <span style={{fontSize:10,color:T.textSec}}>{s.filled}/{s.datapoints}</span>
              </div>
            </div>;})}
          </div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{fw.name} Summary</div>
          {[{l:'Full Name',v:fw.fullName},{l:'Jurisdiction',v:fw.jurisdiction},{l:'Deadline',v:fw.deadline},{l:'Status',v:fw.status},{l:'Total Datapoints',v:fw.totalDatapoints.toLocaleString()},{l:'Coverage',v:`${fw.coverage}%`,c:fw.coverage>60?T.green:T.red},{l:'Open Gaps',v:fw.gapCount,c:T.red},{l:'Quality Score',v:`${fw.qualityScore}/100`,c:fw.qualityScore>60?T.green:T.amber},{l:'Automation',v:`${fw.automationPct}%`,c:fw.automationPct>40?T.green:T.amber}].map((m,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:T.textSec}}>{m.l}</span><span style={{fontWeight:600,color:m.c||T.text,fontFamily:typeof m.v==='number'?T.mono:T.font}}>{m.v}</span></div>)}
          <div style={{marginTop:12}}>
            <div style={{fontWeight:600,fontSize:12,marginBottom:6}}>Submission Status</div>
            {SUBMISSIONS.slice(0,4).map((s,i)=>{const sc=statusColors[s.status];return<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:11}}><span>{s.framework}</span><Badge bg={sc+'20'} fg={sc}>{s.status}</Badge></div>;})}
          </div>
        </div>
      </Row>
    </div>);
  };

  const renderMapper=()=>{
    const fw1Points=DATAPOINT_MAP.filter(d=>d.framework===mapFramework1);
    const fw2Points=DATAPOINT_MAP.filter(d=>d.framework===mapFramework2);
    const filteredPoints=categoryFilter==='All'?fw1Points:fw1Points.filter(d=>d.category===categoryFilter);
    const searchedPoints=search?filteredPoints.filter(d=>d.datapoint.toLowerCase().includes(search.toLowerCase())):filteredPoints;
    const overlapCount=fw1Points.filter(d=>d.alignedWith.includes(mapFramework2)).length;
    const overlapPct=Math.round(overlapCount/fw1Points.length*100);
    const categoryDist=[{name:'Environmental',value:fw1Points.filter(d=>d.category==='Environmental').length},{name:'Social',value:fw1Points.filter(d=>d.category==='Social').length},{name:'Governance',value:fw1Points.filter(d=>d.category==='Governance').length}];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Datapoints Mapped" value={DATAPOINT_MAP.length} accent={T.navy}/><Kpi label={`${FRAMEWORKS.find(f=>f.id===mapFramework1)?.name} → ${FRAMEWORKS.find(f=>f.id===mapFramework2)?.name}`} value={`${overlapPct}% overlap`} accent={T.gold}/><Kpi label="Aligned Datapoints" value={overlapCount} accent={T.sage}/><Kpi label="Unique to Source" value={fw1Points.length-overlapCount} accent={T.amber}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <select value={mapFramework1} onChange={e=>setMapFramework1(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}>{FRAMEWORKS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <span style={{fontSize:13,color:T.textSec,alignSelf:'center'}}>mapped to</span>
        <select value={mapFramework2} onChange={e=>setMapFramework2(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}>{FRAMEWORKS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Categories</option><option>Environmental</option><option>Social</option><option>Governance</option></select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search datapoints..." style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 12px',fontSize:13,fontFamily:T.font,width:200,outline:'none'}}/>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.textSec,cursor:'pointer'}}><input type="checkbox" checked={showOverlap} onChange={e=>setShowOverlap(e.target.checked)}/> Show only overlapping</label>
      </div>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Cross-Framework Alignment Matrix</div>
          <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{position:'sticky',top:0,zIndex:1}}><tr>{['Datapoint','Category','Required','Filled','Quality','Aligned With'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{(showOverlap?searchedPoints.filter(d=>d.alignedWith.includes(mapFramework2)):searchedPoints).slice(0,30).map(d=><tr key={d.id}>
                <td style={{...td,fontWeight:500}}>{d.datapoint}</td>
                <td style={td}><Badge bg={d.category==='Environmental'?T.sage+'20':d.category==='Social'?T.gold+'20':T.navy+'20'} fg={d.category==='Environmental'?T.sage:d.category==='Social'?T.gold:T.navy}>{d.category}</Badge></td>
                <td style={td}>{d.required?<span style={{color:T.red}}>Required</span>:<span style={{color:T.textMut}}>Optional</span>}</td>
                <td style={td}><Badge bg={d.filled?T.green+'20':T.red+'20'} fg={d.filled?T.green:T.red}>{d.filled?'Yes':'No'}</Badge></td>
                <td style={td}><span style={{fontFamily:T.mono,color:d.quality>60?T.green:T.red}}>{d.quality}%</span></td>
                <td style={{...td,fontSize:10}}>{d.alignedWith.map(a=>FRAMEWORKS.find(f=>f.id===a)?.name).filter(Boolean).join(', ')||'Unique'}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Category Distribution</div>
            <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={categoryDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{categoryDist.map((_,i)=><Cell key={i} fill={[T.sage,T.gold,T.navy][i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Overlap Matrix</div>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',fontSize:9}}>
                <thead><tr><th style={{...th,fontSize:9}}></th>{FRAMEWORKS.slice(0,6).map(f=><th key={f.id} style={{...th,fontSize:8,writingMode:'vertical-lr',height:70}}>{f.name}</th>)}</tr></thead>
                <tbody>{FRAMEWORKS.slice(0,6).map((f1,i1)=><tr key={f1.id}><td style={{...td,fontWeight:600,fontSize:9}}>{f1.name}</td>
                  {FRAMEWORKS.slice(0,6).map((f2,i2)=>{const v=i1===i2?100:Math.round(20+sr(i1*50+i2*13)*60);return<td key={f2.id} style={{...td,background:v>60?T.green+'30':v>40?T.amber+'30':T.red+'20',textAlign:'center',fontWeight:600,color:v>60?T.green:v>40?T.amber:T.red}}>{v}%</td>;})}
                </tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </Row>
    </div>);
  };

  const renderBuilder=()=>{
    const bfw=FW_DATA.find(f=>f.id===builderFramework);
    const toggleSection=(name)=>{setBuilderSections(p=>p.includes(name)?p.filter(s=>s!==name):[...p,name]);};
    const selectedSections=bfw?bfw.sections.filter(s=>builderSections.includes(s.name)):[];
    const totalDp=selectedSections.reduce((a,s)=>a+s.datapoints,0);
    const filledDp=selectedSections.reduce((a,s)=>a+s.filled,0);
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Selected Framework" value={bfw?.name||'-'} accent={T.navy}/><Kpi label="Sections Selected" value={builderSections.length} sub={`of ${bfw?.sections.length||0} available`} accent={T.gold}/><Kpi label="Datapoints" value={totalDp} accent={T.sage}/><Kpi label="Completion" value={totalDp>0?`${Math.round(filledDp/totalDp*100)}%`:'-'} accent={totalDp>0&&filledDp/totalDp>0.6?T.green:T.red}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={builderFramework} onChange={e=>{setBuilderFramework(e.target.value);setBuilderSections([]);}} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:200}}>{FRAMEWORKS.map(f=><option key={f.id} value={f.id}>{f.name} - {f.fullName}</option>)}</select>
        <button onClick={()=>setBuilderSections(bfw?bfw.sections.map(s=>s.name):[])} style={{background:T.sage,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Select All</button>
        <button onClick={()=>setBuilderSections([])} style={{background:T.textMut,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Clear</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Configure Report Sections</div>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            {bfw?.sections.map((s,i)=>{const selected=builderSections.includes(s.name);const sc={Complete:T.green,'In Progress':T.amber,Gap:T.red}[s.status];return<div key={i} style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,background:selected?T.surfaceH:'transparent',cursor:'pointer',borderRadius:4,marginBottom:2}} onClick={()=>toggleSection(s.name)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selected?T.navy:T.border}`,background:selected?T.navy:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>{selected&&<span style={{color:'#fff',fontSize:11}}>&#10003;</span>}</div>
                  <span style={{fontSize:12,fontWeight:selected?600:400}}>{s.name}</span>
                </div>
                <Badge bg={sc+'20'} fg={sc}>{s.status}</Badge>
              </div>
              <div style={{marginLeft:26,marginTop:4,display:'flex',gap:12,fontSize:10,color:T.textSec}}>
                <span>{s.datapoints} datapoints</span><span>{s.filled} filled</span><span style={{color:sc}}>{s.coverage}% coverage</span>
              </div>
            </div>;})}
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Report Preview</div>
            {selectedSections.length===0?<div style={{padding:20,textAlign:'center',color:T.textMut,fontSize:13}}>Select sections to preview report structure</div>:
            <div style={{maxHeight:250,overflowY:'auto'}}>
              {selectedSections.map((s,i)=><div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12,fontWeight:600}}>{i+1}. {s.name}</span><span style={{fontSize:10,fontFamily:T.mono}}>{s.datapoints} dp</span></div>
                <div style={{width:'100%',height:4,background:T.border,borderRadius:2,marginTop:4}}><div style={{width:`${s.coverage}%`,height:4,background:s.coverage>80?T.green:T.amber,borderRadius:2}}/></div>
              </div>)}
            </div>}
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Generate Report</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Framework: {bfw?.name}<br/>Sections: {builderSections.length}<br/>Total Datapoints: {totalDp}<br/>Est. Completion: {totalDp>0?`${Math.round(filledDp/totalDp*100)}%`:'N/A'}</div>
            <button onClick={()=>exportCSV(selectedSections.map(s=>({Section:s.name,Datapoints:s.datapoints,Filled:s.filled,Coverage:s.coverage,Status:s.status})),`${builderFramework}_report.csv`)} style={{width:'100%',background:builderSections.length>0?T.navy:T.textMut,color:'#fff',border:'none',borderRadius:8,padding:'12px 20px',fontSize:13,fontWeight:600,cursor:builderSections.length>0?'pointer':'not-allowed',fontFamily:T.font}} disabled={builderSections.length===0}>Generate {bfw?.name} Report</button>
            <button onClick={()=>exportCSV(selectedSections.map(s=>({Section:s.name,GapDatapoints:s.datapoints-s.filled,TotalDatapoints:s.datapoints,CoverageGap:100-s.coverage})),`${builderFramework}_gaps.csv`)} style={{width:'100%',marginTop:8,background:'transparent',color:T.navy,border:`1px solid ${T.navy}`,borderRadius:8,padding:'10px 20px',fontSize:12,cursor:'pointer',fontFamily:T.font}} disabled={builderSections.length===0}>Export Gap Analysis</button>
          </div>
        </div>
      </Row>
    </div>);
  };

  const renderTracker=()=>{
    const sorted=[...SUBMISSIONS].sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    const statusColors={Submitted:T.green,'In Review':T.amber,Draft:T.navy,'Not Started':T.textMut,Overdue:T.red};
    const statusDist=[{name:'Submitted',value:SUBMISSIONS.filter(s=>s.status==='Submitted').length},{name:'In Review',value:SUBMISSIONS.filter(s=>s.status==='In Review').length},{name:'Draft',value:SUBMISSIONS.filter(s=>s.status==='Draft').length},{name:'Not Started',value:SUBMISSIONS.filter(s=>s.status==='Not Started').length},{name:'Overdue',value:SUBMISSIONS.filter(s=>s.status==='Overdue').length}].filter(s=>s.value>0);
    const sel=selectedSubmission!==null?SUBMISSIONS[selectedSubmission]:null;
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Submissions" value={SUBMISSIONS.length} accent={T.navy}/><Kpi label="Submitted" value={SUBMISSIONS.filter(s=>s.status==='Submitted').length} accent={T.green}/><Kpi label="In Progress" value={SUBMISSIONS.filter(s=>s.status==='Draft'||s.status==='In Review').length} accent={T.amber}/><Kpi label="Overdue" value={SUBMISSIONS.filter(s=>s.status==='Overdue').length} accent={T.red}/></Row>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{fontWeight:600,fontSize:13,color:T.text}}>Submission Status</div><button onClick={()=>exportCSV(SUBMISSIONS.map(s=>({Framework:s.framework,Jurisdiction:s.jurisdiction,Deadline:s.deadline,Status:s.status,Assignee:s.assignee,Completeness:s.completeness,LastUpdated:s.lastUpdated})),'submissions.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'5px 12px',fontSize:11,cursor:'pointer',fontFamily:T.font}}>Export</button></div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{[{k:'framework',l:'Framework'},{k:'jurisdiction',l:'Jurisdiction'},{k:'deadline',l:'Deadline'},{k:'status',l:'Status'},{k:'assignee',l:'Assignee'},{k:'completeness',l:'Completeness'},{k:'lastUpdated',l:'Updated'}].map(c=><th key={c.k} style={th} onClick={()=>toggleSort(c.k)}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}</tr></thead>
            <tbody>{sorted.map((s,i)=>{const sc=statusColors[s.status];return<tr key={i} style={{cursor:'pointer',background:selectedSubmission===i?T.surfaceH:'transparent'}} onClick={()=>setSelectedSubmission(selectedSubmission===i?null:i)}>
              <td style={{...td,fontWeight:500}}>{s.framework}</td><td style={td}>{s.jurisdiction}</td><td style={{...td,fontWeight:600}}>{s.deadline}</td>
              <td style={td}><Badge bg={sc+'20'} fg={sc}>{s.status}</Badge></td><td style={td}>{s.assignee}</td>
              <td style={td}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:50,height:5,background:T.border,borderRadius:3}}><div style={{width:`${s.completeness}%`,height:5,background:s.completeness>70?T.green:s.completeness>40?T.amber:T.red,borderRadius:3}}/></div><span style={{fontSize:10,fontFamily:T.mono}}>{s.completeness}%</span></div></td>
              <td style={{...td,fontSize:11}}>{s.lastUpdated}</td>
            </tr>;})}</tbody>
          </table>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Status Distribution</div>
            <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={statusDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{statusDist.map((s,i)=><Cell key={i} fill={statusColors[s.name]||T.textMut}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
          </div>
          {sel&&<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{fontWeight:600,fontSize:13,color:T.text}}>Audit Trail - {sel.framework}</div><button onClick={()=>setSelectedSubmission(null)} style={{background:'none',border:'none',fontSize:16,cursor:'pointer',color:T.textMut}}>x</button></div>
            <div style={{maxHeight:200,overflowY:'auto'}}>
              {sel.auditTrail.map((a,i)=><div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`,display:'flex',gap:8}}>
                <div style={{width:8,height:8,borderRadius:4,background:T.navy,marginTop:4,flexShrink:0}}/>
                <div><div style={{fontSize:12,fontWeight:500}}>{a.action}</div><div style={{fontSize:10,color:T.textSec}}>{a.date} by {a.user}</div></div>
              </div>)}
            </div>
          </div>}
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Upcoming Deadlines</div>
        <ResponsiveContainer width="100%" height={220}><BarChart data={SUBMISSIONS.map(s=>({name:s.framework,completeness:s.completeness,gap:100-s.completeness}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip/><Legend/><Bar dataKey="completeness" fill={T.green} name="Complete %" stackId="a" radius={[3,3,0,0]}/><Bar dataKey="gap" fill={T.red+'40'} name="Remaining %" stackId="a"/></BarChart></ResponsiveContainer>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 28px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0}}>Comprehensive ESG Reporting</h1><p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Manage 8 reporting frameworks with cross-framework mapping, report builder, and submission tracking</p></div>
    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:tab===i?T.surface:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderDashboard()}
    {tab===1&&renderMapper()}
    {tab===2&&renderBuilder()}
    {tab===3&&renderTracker()}
  </div>);
}