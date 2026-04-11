import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Activity Timeline','Calculation Audit','Data Change Log','Compliance Reporting'];

const USER_NAMES=['Sarah Chen','James O\'Brien','Emily Nakamura','Michael Patel','Olivia Kowalski','William Williams','Ava Garcia','Benjamin Kim','Sophia Johansson','Ethan Al-Rashid','Isabella Thompson','Alexander Dubois','Mia Santos','Daniel Andersson','Charlotte Nguyen','System','API Bot','Scheduler','Import Service','Webhook Handler'];
const ACTION_TYPES=['view','edit','export','calculate','approve','delete','login','import','configure','comment'];
const ENTITY_TYPES=['company','portfolio','report','engine','user','team','module','dataset','calculation','disclosure'];
const SEVERITY_LEVELS=['info','info','info','info','warning','critical','info','info','warning','info'];
const ENGINES=['E1-EmissionsCalculator','E2-ScopeMapper','E3-CarbonFootprint','E4-WaterRisk','E5-BiodiversityImpact','E6-ClimatePolicyScorer','E7-ESGRatingEngine','E8-TransitionRisk','E9-PhysicalRisk','E10-SocialImpact','E11-GovernanceScorer','E12-PCafCalculator','E13-TemperatureAlign','E14-GreenAssetRatio','E15-SBTiValidator','E16-CsrdMapper','E17-SfdrCalculator','E18-TaxonomyAligner','E19-StressTest','E20-FactorAttribution','E21-ContagionModel','E22-ScenarioModeller','E23-AbatementCost','E24-DecarbRoadmap','E25-NetZeroTracker'];

const TABLES=['companies','portfolios','portfolio_holdings','esg_scores','emissions_data','water_metrics','biodiversity_records','governance_scores','social_metrics','disclosure_reports','calculation_results','audit_trail','risk_assessments','climate_scenarios','transition_plans','sbti_targets','csrd_reports','sfdr_indicators','taxonomy_alignments','carbon_credits'];
const COLUMNS_BY_TABLE={companies:['name','sector','country','esg_score','emissions_scope1','emissions_scope2','revenue','employees'],portfolios:['name','aum','benchmark','strategy','carbon_intensity'],esg_scores:['total_score','e_score','s_score','g_score','confidence','data_quality'],emissions_data:['scope1','scope2','scope3_upstream','scope3_downstream','intensity','methodology'],calculation_results:['result_value','confidence','data_quality_score','engine_version']};

const AUDIT_EVENTS=Array.from({length:500},(_,i)=>{
  const action=ACTION_TYPES[Math.floor(sr(i*3)*10)];
  const entityType=ENTITY_TYPES[Math.floor(sr(i*7)*10)];
  const severity=action==='delete'?'critical':action==='edit'?'warning':'info';
  const user=USER_NAMES[Math.floor(sr(i*11)*20)];
  const ts=new Date(2026,2,29-Math.floor(sr(i*13)*60),Math.floor(sr(i*17)*24),Math.floor(sr(i*19)*60),Math.floor(sr(i*23)*60));
  const entityId=`${entityType.toUpperCase().slice(0,3)}-${String(Math.floor(sr(i*29)*9000+1000)).padStart(5,'0')}`;
  const oldVal=action==='edit'?`${(sr(i*31)*100).toFixed(2)}`:null;
  const newVal=action==='edit'?`${(sr(i*37)*100).toFixed(2)}`:null;
  return{
    id:i+1,timestamp:ts.toISOString().replace('T',' ').slice(0,19),user,action,entityType,entityId,severity,
    ip:`${Math.floor(sr(i*41)*200+10)}.${Math.floor(sr(i*43)*255)}.${Math.floor(sr(i*47)*255)}.${Math.floor(sr(i*53)*255)}`,
    sessionId:`sess_${String(Math.floor(sr(i*59)*9000+1000)).padStart(6,'0')}`,
    oldValue:oldVal,newValue:newVal,
    module:['ESG Dashboard','Portfolio Manager','Risk Engine','Compliance Hub','Data Import','Admin Panel','Calculation Engine','Report Builder','Audit Viewer','API Gateway'][Math.floor(sr(i*61)*10)],
    duration:`${Math.floor(sr(i*67)*500+10)}ms`,
    dataQuality:+(sr(i*71)*30+70).toFixed(0),
  };
});

const CALC_AUDITS=Array.from({length:80},(_,i)=>{
  const engine=ENGINES[Math.floor(sr(i*100)*25)];
  const ts=new Date(2026,2,29-Math.floor(sr(i*103)*30),Math.floor(sr(i*107)*24),Math.floor(sr(i*109)*60));
  return{
    id:i+1,engine,engineVersion:`v${Math.floor(sr(i*111)*3+1)}.${Math.floor(sr(i*113)*9)}.${Math.floor(sr(i*117)*20)}`,
    timestamp:ts.toISOString().replace('T',' ').slice(0,16),
    user:USER_NAMES[Math.floor(sr(i*119)*15)],
    inputParams:{companies:Math.floor(sr(i*121)*50+5),dateRange:`2025-Q${Math.floor(sr(i*123)*4+1)}`,methodology:['GHG Protocol','PCAF','TCFD','TNFD','GRI','SASB'][Math.floor(sr(i*127)*6)],scope:['Scope 1','Scope 1+2','Full Value Chain','Portfolio Level'][Math.floor(sr(i*129)*4)]},
    outputValue:+(sr(i*131)*1000).toFixed(2),
    outputUnit:['tCO2e','MWh','m3','%','score','EUR'][Math.floor(sr(i*133)*6)],
    executionTime:`${Math.floor(sr(i*137)*5000+200)}ms`,
    dataQualityScore:+(sr(i*139)*25+75).toFixed(0),
    refDataVersion:`RD-2026.${Math.floor(sr(i*141)*3+1)}.${Math.floor(sr(i*143)*15+1)}`,
    status:sr(i*147)>0.05?'Success':'Error',
    confidenceInterval:`${(sr(i*149)*5+2).toFixed(1)}%`,
    steps:Math.floor(sr(i*151)*12+3),
    dataPointsUsed:Math.floor(sr(i*153)*500+50),
  };
});

const DATA_CHANGES=Array.from({length:200},(_,i)=>{
  const table=TABLES[Math.floor(sr(i*200)*20)];
  const cols=COLUMNS_BY_TABLE[table]||['value','status','score','date'];
  const col=cols[Math.floor(sr(i*203)*cols.length)];
  const changeType=['manual','import','calculation','system','api'][Math.floor(sr(i*207)*5)];
  const ts=new Date(2026,2,29-Math.floor(sr(i*209)*60),Math.floor(sr(i*211)*24),Math.floor(sr(i*213)*60));
  const isNumeric=sr(i*217)>0.3;
  return{
    id:i+1,table,column:col,changeType,
    timestamp:ts.toISOString().replace('T',' ').slice(0,19),
    changedBy:changeType==='system'?'System':changeType==='calculation'?'Engine':changeType==='import'?'Import Service':USER_NAMES[Math.floor(sr(i*219)*15)],
    oldValue:isNumeric?(sr(i*221)*100).toFixed(2):['Active','Pending','Draft','Approved','Low'][Math.floor(sr(i*223)*5)],
    newValue:isNumeric?(sr(i*227)*100).toFixed(2):['Active','Approved','Final','High','Medium'][Math.floor(sr(i*229)*5)],
    rowId:`${table.toUpperCase().slice(0,4)}-${String(Math.floor(sr(i*231)*9000+1000)).padStart(5,'0')}`,
    verified:sr(i*233)>0.2,
  };
});

const CHANGE_HEATMAP=TABLES.map((table,ti)=>{
  const cols=COLUMNS_BY_TABLE[table]||['value','status','score','date'];
  return cols.map((col,ci)=>({table,column:col,changes:Math.floor(sr(ti*300+ci*7)*200+5),lastChange:new Date(2026,2,29-Math.floor(sr(ti*300+ci*11)*30)).toISOString().split('T')[0]}));
}).flat();

const COMPLIANCE_MODULES=Array.from({length:43},(_,i)=>({
  domain:['ESG Strategy','Climate Risk','Regulatory Reporting','Portfolio Analytics','Supply Chain','Nature & Biodiversity','Governance','Social','Decarbonisation','Private Markets','Quant ESG','Financed Emissions','ESG Ratings','Transition Planning','Climate Finance','Physical Risk','Macro Risk','Water Risk','Circular Economy','Air Quality','Land Use','Human Rights','Executive Pay','Board Comp','Shareholder Activism','Anti-Corruption','Proxy Voting','DEI','Living Wage','Modern Slavery','Community Impact','Workplace Health','CSRD','SFDR','ISSB','UK SDR','SEC Climate','CBAM','Green Taxonomy','Climate Bonds','Carbon Markets','Scenario Modelling','Contagion'][i],
  auditEvents:Math.floor(sr(i*400)*500+50),
  completenessScore:Math.floor(sr(i*403)*20+80),
  lastAudit:new Date(2026,2,29-Math.floor(sr(i*407)*30)).toISOString().split('T')[0],
  gaps:Math.floor(sr(i*409)*5),
  attestationStatus:sr(i*411)>0.3?'Signed Off':sr(i*411)>0.1?'Pending':'Not Started',
}));

export default function AuditTrailViewerPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[filterAction,setFilterAction]=useState('All');
  const[filterEntity,setFilterEntity]=useState('All');
  const[filterSeverity,setFilterSeverity]=useState('All');
  const[filterUser,setFilterUser]=useState('All');
  const[selectedEvent,setSelectedEvent]=useState(null);
  const[visibleCount,setVisibleCount]=useState(30);
  const[calcSearch,setCalcSearch]=useState('');
  const[calcEngine,setCalcEngine]=useState('All');
  const[selectedCalc,setSelectedCalc]=useState(null);
  const[changeTable,setChangeTable]=useState('All');
  const[changeType,setChangeType]=useState('All');
  const[changeSearch,setChangeSearch]=useState('');
  const[heatmapView,setHeatmapView]=useState(false);
  const[auditPeriod,setAuditPeriod]=useState('Q1 2026');
  const[exportFormat,setExportFormat]=useState('JSON');
  const[compSearch,setCompSearch]=useState('');
  const[sortCol,setSortCol]=useState('timestamp');
  const[sortDir,setSortDir]=useState(-1);
  const[changeSort,setChangeSort]=useState('timestamp');
  const[changeSortDir,setChangeSortDir]=useState(-1);

  const filteredEvents=useMemo(()=>{
    let e=[...AUDIT_EVENTS];
    if(search)e=e.filter(x=>x.user.toLowerCase().includes(search.toLowerCase())||x.entityId.toLowerCase().includes(search.toLowerCase())||x.module.toLowerCase().includes(search.toLowerCase()));
    if(filterAction!=='All')e=e.filter(x=>x.action===filterAction);
    if(filterEntity!=='All')e=e.filter(x=>x.entityType===filterEntity);
    if(filterSeverity!=='All')e=e.filter(x=>x.severity===filterSeverity);
    if(filterUser!=='All')e=e.filter(x=>x.user===filterUser);
    e.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];return(av<bv?-1:av>bv?1:0)*sortDir;});
    return e;
  },[search,filterAction,filterEntity,filterSeverity,filterUser,sortCol,sortDir]);

  const filteredCalcs=useMemo(()=>{
    let c=[...CALC_AUDITS];
    if(calcSearch)c=c.filter(x=>x.engine.toLowerCase().includes(calcSearch.toLowerCase())||x.user.toLowerCase().includes(calcSearch.toLowerCase()));
    if(calcEngine!=='All')c=c.filter(x=>x.engine===calcEngine);
    return c;
  },[calcSearch,calcEngine]);

  const filteredChanges=useMemo(()=>{
    let c=[...DATA_CHANGES];
    if(changeSearch)c=c.filter(x=>x.table.includes(changeSearch.toLowerCase())||x.column.includes(changeSearch.toLowerCase())||x.changedBy.toLowerCase().includes(changeSearch.toLowerCase()));
    if(changeTable!=='All')c=c.filter(x=>x.table===changeTable);
    if(changeType!=='All')c=c.filter(x=>x.changeType===changeType);
    c.sort((a,b)=>{const av=a[changeSort],bv=b[changeSort];return(av<bv?-1:av>bv?1:0)*changeSortDir;});
    return c;
  },[changeSearch,changeTable,changeType,changeSort,changeSortDir]);

  const eventsByAction=useMemo(()=>ACTION_TYPES.map(a=>({name:a,count:AUDIT_EVENTS.filter(e=>e.action===a).length})),[]);
  const eventsByEntity=useMemo(()=>ENTITY_TYPES.map(t=>({name:t,count:AUDIT_EVENTS.filter(e=>e.entityType===t).length})),[]);
  const eventTimeline=useMemo(()=>Array.from({length:24},(_,i)=>({hour:`${String(i).padStart(2,'0')}:00`,events:AUDIT_EVENTS.filter(e=>+e.timestamp.slice(11,13)===i).length})),[]);
  const severityDist=useMemo(()=>['info','warning','critical'].map(s=>({name:s,count:AUDIT_EVENTS.filter(e=>e.severity===s).length})),[]);

  const calcSuccessRate=useMemo(()=>Math.round(CALC_AUDITS.filter(c=>c.status==='Success').length/ Math.max(1, CALC_AUDITS.length)*100),[]);
  const avgExecTime=useMemo(()=>Math.round(CALC_AUDITS.reduce((a,c)=>a+parseInt(c.executionTime),0)/ Math.max(1, CALC_AUDITS.length)),[]);
  const avgDataQuality=useMemo(()=>Math.round(CALC_AUDITS.reduce((a,c)=>a+c.dataQualityScore,0)/ Math.max(1, CALC_AUDITS.length)),[]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>-d);else{setSortCol(col);setSortDir(-1);}};
  const handleChangeSort=(col)=>{if(changeSort===col)setChangeSortDir(d=>-d);else{setChangeSort(col);setChangeSortDir(-1);}};

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text,padding:24},
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16},
    tabBar:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:24},
    tabBtn:(a)=>({padding:'12px 24px',cursor:'pointer',border:'none',background:a?T.surface:'transparent',color:a?T.gold:T.textSec,fontWeight:a?700:500,fontSize:14,fontFamily:T.font,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',transition:'all 0.2s'}),
    input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface,outline:'none',minWidth:200},
    select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface},
    btn:(c=T.navy)=>({padding:'8px 18px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600}),
    btnOutline:{padding:'8px 18px',background:'transparent',color:T.navy,border:`1px solid ${T.navy}`,borderRadius:8,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600},
    badge:(c)=>({display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:c==='info'?'#dbeafe':c==='warning'?'#fef3c7':c==='critical'?'#fee2e2':c==='Success'?'#dcfce7':c==='Signed Off'?'#dcfce7':c==='Pending'?'#fef3c7':'#fee2e2',color:c==='info'?T.navyL:c==='warning'?T.amber:c==='critical'?T.red:c==='Success'?T.green:c==='Signed Off'?T.green:c==='Pending'?T.amber:T.red}),
    th:{padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:700,color:T.textSec,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px'},
    td:{padding:'10px 12px',fontSize:13,borderBottom:`1px solid ${T.borderL}`,verticalAlign:'middle'},
    metric:{textAlign:'center',padding:16},
    metricVal:{fontSize:28,fontWeight:800,fontFamily:T.mono,color:T.navy},
    metricLbl:{fontSize:11,color:T.textSec,marginTop:4,fontWeight:600,textTransform:'uppercase'},
    grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16},
    mono:{fontFamily:T.mono,fontSize:12},
    panel:{position:'fixed',top:0,right:0,width:520,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.gold}`,zIndex:1000,overflowY:'auto',padding:24,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},
    overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:999},
  };

  const renderTimeline=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input style={ss.input} placeholder="Search events..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={ss.select} value={filterAction} onChange={e=>setFilterAction(e.target.value)}>
          <option value="All">All Actions</option>{ACTION_TYPES.map(a=><option key={a}>{a}</option>)}
        </select>
        <select style={ss.select} value={filterEntity} onChange={e=>setFilterEntity(e.target.value)}>
          <option value="All">All Entities</option>{ENTITY_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select style={ss.select} value={filterSeverity} onChange={e=>setFilterSeverity(e.target.value)}>
          <option value="All">All Severity</option><option>info</option><option>warning</option><option>critical</option>
        </select>
        <select style={ss.select} value={filterUser} onChange={e=>setFilterUser(e.target.value)}>
          <option value="All">All Users</option>{[...new Set(AUDIT_EVENTS.map(e=>e.user))].slice(0,15).map(u=><option key={u}>{u}</option>)}
        </select>
        <span style={{...ss.mono,color:T.textMut}}>{filteredEvents.length} events</span>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'Total Events',value:AUDIT_EVENTS.length,color:T.navy},{label:'Critical',value:AUDIT_EVENTS.filter(e=>e.severity==='critical').length,color:T.red},{label:'Unique Users',value:new Set(AUDIT_EVENTS.map(e=>e.user)).size,color:T.gold},{label:'Avg Data Quality',value:`${Math.round(AUDIT_EVENTS.reduce((a,e)=>a+e.dataQuality,0)/ Math.max(1, AUDIT_EVENTS.length))}%`,color:T.sage}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Events by Action Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={eventsByAction} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={70}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} radius={[0,4,4,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Hourly Activity Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={eventTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="hour" tick={{fontSize:9,fill:T.textSec}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="events" fill={T.gold} fillOpacity={0.2} stroke={T.gold} strokeWidth={2}/></AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Severity Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={severityDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({name,count})=>`${name} (${count})`}>
              {severityDist.map((_,i)=><Cell key={i} fill={[T.navyL,T.amber,T.red][i]}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Events by Entity Type</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={eventsByEntity}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.sage} radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Activity Feed</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {[['timestamp','Timestamp'],['user','User'],['action','Action'],['entityType','Entity'],['entityId','Entity ID'],['severity','Severity'],['module','Module'],['ip','IP'],['duration','Duration']].map(([k,l])=>(
                <th key={k} style={ss.th} onClick={()=>handleSort(k)}>{l}{sortCol===k?(sortDir===1?' ASC':' DESC'):''}</th>
              ))}
            </tr></thead>
            <tbody>{filteredEvents.slice(0,visibleCount).map(e=>(
              <tr key={e.id} style={{cursor:'pointer',background:e.severity==='critical'?'#fef2f2':'transparent'}} onClick={()=>setSelectedEvent(e)}>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.timestamp}</td>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{e.user}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:e.action==='delete'?'#fee2e2':e.action==='edit'?'#fef3c7':e.action==='export'?'#dbeafe':'#dcfce7',color:e.action==='delete'?T.red:e.action==='edit'?T.amber:e.action==='export'?T.navyL:T.green}}>{e.action}</span></td>
                <td style={ss.td}>{e.entityType}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.entityId}</td>
                <td style={ss.td}><span style={ss.badge(e.severity)}>{e.severity}</span></td>
                <td style={{...ss.td,fontSize:11}}>{e.module}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.ip}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.duration}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {visibleCount<filteredEvents.length&&<div style={{textAlign:'center',marginTop:16}}>
          <button style={ss.btn(T.gold)} onClick={()=>setVisibleCount(v=>v+30)}>Load More ({filteredEvents.length-visibleCount} remaining)</button>
        </div>}
      </div>

      {selectedEvent&&<><div style={ss.overlay} onClick={()=>setSelectedEvent(null)}/><div style={ss.panel}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{margin:0}}>Event Detail #{selectedEvent.id}</h3>
          <button onClick={()=>setSelectedEvent(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {[['Timestamp',selectedEvent.timestamp],['User',selectedEvent.user],['Action',selectedEvent.action],['Entity Type',selectedEvent.entityType],['Entity ID',selectedEvent.entityId],['Severity',selectedEvent.severity],['Module',selectedEvent.module],['Session ID',selectedEvent.sessionId],['IP Address',selectedEvent.ip],['Duration',selectedEvent.duration],['Data Quality',`${selectedEvent.dataQuality}%`]].map(([k,v],i)=>(
            <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:8}}>
              <div style={{fontSize:10,color:T.textMut,fontWeight:600,textTransform:'uppercase'}}>{k}</div>
              <div style={{fontSize:13,fontWeight:600,marginTop:2,...ss.mono}}>{v}</div>
            </div>
          ))}
        </div>
        {selectedEvent.oldValue&&<div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Change Diff</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{padding:12,background:'#fee2e2',borderRadius:8,border:'1px solid #fca5a5'}}>
              <div style={{fontSize:10,color:T.red,fontWeight:700}}>BEFORE</div>
              <div style={{...ss.mono,fontSize:14,marginTop:4}}>{selectedEvent.oldValue}</div>
            </div>
            <div style={{padding:12,background:'#dcfce7',borderRadius:8,border:'1px solid #86efac'}}>
              <div style={{fontSize:10,color:T.green,fontWeight:700}}>AFTER</div>
              <div style={{...ss.mono,fontSize:14,marginTop:4}}>{selectedEvent.newValue}</div>
            </div>
          </div>
        </div>}
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Related Events (Same Session)</div>
        <div style={{maxHeight:200,overflowY:'auto'}}>
          {AUDIT_EVENTS.filter(e=>e.sessionId===selectedEvent.sessionId&&e.id!==selectedEvent.id).slice(0,10).map(e=>(
            <div key={e.id} style={{padding:'6px 0',borderBottom:`1px solid ${T.borderL}`,display:'flex',justifyContent:'space-between',fontSize:11}}>
              <span>{e.action} {e.entityType} {e.entityId}</span>
              <span style={{...ss.mono,color:T.textMut}}>{e.timestamp.slice(11)}</span>
            </div>
          ))}
        </div>
      </div></>}
    </div>
  );

  const renderCalcAudit=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <input style={ss.input} placeholder="Search engines..." value={calcSearch} onChange={e=>setCalcSearch(e.target.value)}/>
        <select style={ss.select} value={calcEngine} onChange={e=>setCalcEngine(e.target.value)}>
          <option value="All">All Engines ({ENGINES.length})</option>{ENGINES.map(e=><option key={e}>{e}</option>)}
        </select>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(5,1fr)',marginBottom:24}}>
        {[{label:'Calculations',value:CALC_AUDITS.length,color:T.navy},{label:'Success Rate',value:`${calcSuccessRate}%`,color:T.green},{label:'Avg Exec Time',value:`${avgExecTime}ms`,color:T.gold},{label:'Avg Data Quality',value:`${avgDataQuality}%`,color:T.sage},{label:'Unique Engines',value:new Set(CALC_AUDITS.map(c=>c.engine)).size,color:T.navyL}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color,fontSize:22}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Execution Time by Engine (ms)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ENGINES.slice(0,12).map((e,i)=>({name:e.split('-')[1]||e,time:Math.floor(sr(i*500)*3000+500),quality:Math.floor(sr(i*503)*20+80)}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={120}/><Tooltip {...tip}/><Bar dataKey="time" fill={T.navy} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Data Quality Score Trend</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={Array.from({length:30},(_,i)=>({day:i+1,quality:Math.floor(sr(i*510)*15+80),confidence:Math.floor(sr(i*513)*10+85)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="day" tick={{fontSize:10,fill:T.textSec}}/><YAxis domain={[60,100]} tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Legend/>
              <Line type="monotone" dataKey="quality" stroke={T.sage} strokeWidth={2} dot={false} name="Quality"/>
              <Line type="monotone" dataKey="confidence" stroke={T.gold} strokeWidth={2} dot={false} name="Confidence"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Calculation Execution Log</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Engine','Version','Time','User','Methodology','Output','Exec Time','Quality','Ref Data','Status','Steps'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{filteredCalcs.slice(0,25).map(c=>(
              <tr key={c.id} style={{cursor:'pointer',background:c.status==='Error'?'#fef2f2':'transparent'}} onClick={()=>setSelectedCalc(selectedCalc===c.id?null:c.id)}>
                <td style={{...ss.td,fontWeight:600,fontSize:11}}>{c.engine}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.engineVersion}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.timestamp}</td>
                <td style={{...ss.td,fontSize:12}}>{c.user}</td>
                <td style={ss.td}><span style={{fontSize:10,padding:'2px 6px',background:T.surfaceH,borderRadius:4}}>{c.inputParams.methodology}</span></td>
                <td style={{...ss.td,...ss.mono,fontWeight:600}}>{c.outputValue} {c.outputUnit}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.executionTime}</td>
                <td style={{...ss.td,...ss.mono,color:c.dataQualityScore>=80?T.green:T.amber,fontWeight:700}}>{c.dataQualityScore}%</td>
                <td style={{...ss.td,...ss.mono,fontSize:9}}>{c.refDataVersion}</td>
                <td style={ss.td}><span style={ss.badge(c.status)}>{c.status}</span></td>
                <td style={{...ss.td,...ss.mono}}>{c.steps}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {selectedCalc&&(()=>{
        const c=CALC_AUDITS.find(x=>x.id===selectedCalc);
        if(!c)return null;
        return<div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Reconstruct Calculation: {c.engine}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            {[['Input Companies',c.inputParams.companies],['Date Range',c.inputParams.dateRange],['Methodology',c.inputParams.methodology],['Scope',c.inputParams.scope],['Data Points Used',c.dataPointsUsed],['Confidence Interval',c.confidenceInterval]].map(([k,v],i)=>(
              <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut,fontWeight:600}}>{k}</div>
                <div style={{fontSize:13,fontWeight:600,...ss.mono}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Step-by-Step Derivation</div>
          <div style={{background:T.surfaceH,borderRadius:8,padding:16}}>
            {Array.from({length:c.steps},(_,i)=>(
              <div key={i} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:i<c.steps-1?`1px solid ${T.borderL}`:'none'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:T.navy,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:600}}>{['Load reference data','Validate input parameters','Fetch company emissions data','Apply methodology factors','Calculate scope-level totals','Normalize by revenue','Apply quality adjustments','Cross-validate with benchmarks','Compute confidence intervals','Aggregate portfolio results','Apply scenario overlays','Generate final output'][i%12]}</div>
                  <div style={{...ss.mono,fontSize:10,color:T.textMut,marginTop:2}}>Duration: {Math.floor(sr(selectedCalc*1000+i)*500+10)}ms | Data points: {Math.floor(sr(selectedCalc*1000+i+1)*100+5)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,padding:12,background:'#dbeafe',borderRadius:8,fontSize:12}}>
            <strong>ISAE 3000 Note:</strong> This calculation trace provides limited assurance evidence. Engine version {c.engineVersion}, reference data {c.refDataVersion}. All intermediate values preserved for external auditor review.
          </div>
        </div>;
      })()}
    </div>
  );

  const renderChangeLog=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <input style={ss.input} placeholder="Search changes..." value={changeSearch} onChange={e=>setChangeSearch(e.target.value)}/>
        <select style={ss.select} value={changeTable} onChange={e=>setChangeTable(e.target.value)}>
          <option value="All">All Tables ({TABLES.length})</option>{TABLES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select style={ss.select} value={changeType} onChange={e=>setChangeType(e.target.value)}>
          <option value="All">All Change Types</option><option>manual</option><option>import</option><option>calculation</option><option>system</option><option>api</option>
        </select>
        <button style={ss.btn(heatmapView?T.gold:T.navy)} onClick={()=>setHeatmapView(!heatmapView)}>{heatmapView?'Table View':'Heatmap View'}</button>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'Total Changes',value:DATA_CHANGES.length,color:T.navy},{label:'Manual Changes',value:DATA_CHANGES.filter(c=>c.changeType==='manual').length,color:T.amber},{label:'System Changes',value:DATA_CHANGES.filter(c=>c.changeType==='system'||c.changeType==='calculation').length,color:T.sage},{label:'Tables Modified',value:new Set(DATA_CHANGES.map(c=>c.table)).size,color:T.gold}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      {!heatmapView?<>
        <div style={ss.card}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Changes by Type</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={['manual','import','calculation','system','api'].map(t=>({name:t,count:DATA_CHANGES.filter(c=>c.changeType===t).length}))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {[0,1,2,3,4].map(i=><Cell key={i} fill={COLORS[i]}/>)}
                </Pie><Tooltip {...tip}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Changes by Table (Top 10)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TABLES.slice(0,10).map(t=>({name:t.replace('_',' '),count:DATA_CHANGES.filter(c=>c.table===t).length}))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.gold} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Data Change Log</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {[['timestamp','Timestamp'],['table','Table'],['column','Column'],['oldValue','Old Value'],['newValue','New Value'],['changedBy','Changed By'],['changeType','Type'],['rowId','Row ID'],['verified','Verified']].map(([k,l])=>(
                  <th key={k} style={ss.th} onClick={()=>handleChangeSort(k)}>{l}{changeSort===k?(changeSortDir===1?' ASC':' DESC'):''}</th>
                ))}
              </tr></thead>
              <tbody>{filteredChanges.slice(0,30).map(c=>(
                <tr key={c.id}>
                  <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.timestamp}</td>
                  <td style={{...ss.td,fontWeight:600,fontSize:11}}>{c.table}</td>
                  <td style={{...ss.td,...ss.mono,fontSize:11}}>{c.column}</td>
                  <td style={{...ss.td,...ss.mono,fontSize:11,color:T.red,background:'#fef2f2'}}>{c.oldValue}</td>
                  <td style={{...ss.td,...ss.mono,fontSize:11,color:T.green,background:'#f0fdf4'}}>{c.newValue}</td>
                  <td style={{...ss.td,fontSize:12}}>{c.changedBy}</td>
                  <td style={ss.td}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:c.changeType==='manual'?'#fef3c7':c.changeType==='import'?'#dbeafe':c.changeType==='calculation'?'#dcfce7':'#f3e8ff'}}>{c.changeType}</span></td>
                  <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.rowId}</td>
                  <td style={ss.td}><span style={{color:c.verified?T.green:T.red,fontWeight:700}}>{c.verified?'YES':'NO'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Data Integrity Check</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[['Last Snapshot','2026-03-28 23:00',T.navy],['Records Checked','142,847',T.gold],['Discrepancies','3',T.red],['Integrity Score','99.998%',T.green]].map(([l,v,c],i)=>(
              <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
                <div style={{...ss.mono,fontWeight:700,color:c,fontSize:18}}>{v}</div>
                <div style={{fontSize:10,color:T.textMut,marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,fontSize:12,color:T.textSec}}>Rollback available for manual and import changes within 30-day retention window.</div>
          <button style={{...ss.btnOutline,marginTop:8}}>Run Integrity Check Now</button>
        </div>
      </>:
      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Change Frequency Heatmap (Table x Column)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Table','Column','Changes','Last Change'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{[...CHANGE_HEATMAP].sort((a,b)=>b.changes-a.changes).slice(0,40).map((h,i)=>{
              const intensity=h.changes/200;
              return<tr key={i}>
                <td style={{...ss.td,fontWeight:600,fontSize:11}}>{h.table}</td>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{h.column}</td>
                <td style={{...ss.td,background:`rgba(220,38,38,${Math.min(intensity,0.3)})`,fontWeight:700,...ss.mono}}>{h.changes}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{h.lastChange}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>}
    </div>
  );

  const renderComplianceReporting=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <select style={ss.select} value={auditPeriod} onChange={e=>setAuditPeriod(e.target.value)}>
          <option>Q1 2026</option><option>Q4 2025</option><option>Q3 2025</option><option>Q2 2025</option><option>FY 2025</option>
        </select>
        <select style={ss.select} value={exportFormat} onChange={e=>setExportFormat(e.target.value)}>
          <option>JSON</option><option>CSV</option><option>PDF</option>
        </select>
        <button style={ss.btn(T.gold)}>Export Audit Trail ({exportFormat})</button>
        <button style={ss.btnOutline}>ISAE 3000 Package</button>
        <button style={ss.btnOutline}>SOC 2 Evidence</button>
        <button style={ss.btnOutline}>GDPR Art. 30</button>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'Audit Period',value:auditPeriod,color:T.navy},{label:'Total Events',value:'12,847',color:T.gold},{label:'Completeness',value:'97.2%',color:T.green},{label:'Open Gaps',value:COMPLIANCE_MODULES.reduce((a,m)=>a+m.gaps,0),color:T.red}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Attestation Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={['Signed Off','Pending','Not Started'].map(s=>({name:s,count:COMPLIANCE_MODULES.filter(m=>m.attestationStatus===s).length}))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({name,count})=>`${name} (${count})`}>
              <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Completeness Score by Domain</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COMPLIANCE_MODULES.slice(0,12).map(m=>({name:m.domain.slice(0,12),score:m.completenessScore}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/><YAxis domain={[60,100]} tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/>
              <Bar dataKey="score" radius={[4,4,0,0]}>{COMPLIANCE_MODULES.slice(0,12).map((m,i)=><Cell key={i} fill={m.completenessScore>=90?T.green:m.completenessScore>=80?T.amber:T.red}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700}}>Module Audit Completeness</div>
          <input style={ss.input} placeholder="Search modules..." value={compSearch} onChange={e=>setCompSearch(e.target.value)}/>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Domain','Events','Completeness','Last Audit','Gaps','Attestation'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{COMPLIANCE_MODULES.filter(m=>!compSearch||m.domain.toLowerCase().includes(compSearch.toLowerCase())).map((m,i)=>(
              <tr key={i} style={{background:m.gaps>3?'#fef2f2':m.completenessScore<85?'#fef3c7':'transparent'}}>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{m.domain}</td>
                <td style={{...ss.td,...ss.mono}}>{m.auditEvents}</td>
                <td style={ss.td}><div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,height:6,background:T.borderL,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${m.completenessScore}%`,background:m.completenessScore>=90?T.green:m.completenessScore>=80?T.amber:T.red,borderRadius:3}}/></div>
                  <span style={{...ss.mono,fontWeight:700,fontSize:11}}>{m.completenessScore}%</span>
                </div></td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{m.lastAudit}</td>
                <td style={{...ss.td,...ss.mono,color:m.gaps>0?T.red:T.green,fontWeight:700}}>{m.gaps}</td>
                <td style={ss.td}><span style={ss.badge(m.attestationStatus)}>{m.attestationStatus}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Attestation Sign-Off Workflow</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
          {['Data Collection','Validation','Internal Review','External Audit','Sign-Off'].map((step,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:i<3?T.green:i===3?T.amber:T.borderL,color:i<4?'#fff':T.textMut,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',fontWeight:700}}>{i+1}</div>
              <div style={{fontSize:11,fontWeight:600}}>{step}</div>
              <div style={{fontSize:10,color:i<3?T.green:i===3?T.amber:T.textMut,marginTop:2}}>{i<3?'Complete':i===3?'In Progress':'Pending'}</div>
            </div>
          ))}
        </div>
        <div style={{height:4,background:T.borderL,borderRadius:2,marginBottom:16}}>
          <div style={{height:'100%',width:'65%',background:`linear-gradient(90deg, ${T.green} 0%, ${T.amber} 100%)`,borderRadius:2}}/>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Missing Audit Trail Gap Detector</div>
          {[{module:'Carbon Markets',gap:'No audit trail for offset retirement workflow',severity:'High'},{module:'Private Markets ESG',gap:'PE due diligence calculations untraced',severity:'Medium'},{module:'Supply Chain',gap:'Tier 3 supplier data import unlogged',severity:'High'},{module:'Water Risk',gap:'Baseline calculation missing version lock',severity:'Low'},{module:'CSRD Reporting',gap:'Double materiality assessment partially traced',severity:'Medium'}].map((g,i)=>(
            <div key={i} style={{padding:10,border:`1px solid ${g.severity==='High'?'#fca5a5':g.severity==='Medium'?'#fcd34d':'#86efac'}`,borderRadius:8,marginBottom:8,background:g.severity==='High'?'#fef2f2':g.severity==='Medium'?'#fffbeb':'#f0fdf4'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:600,fontSize:12}}>{g.module}</span>
                <span style={{fontSize:10,fontWeight:700,color:g.severity==='High'?T.red:g.severity==='Medium'?T.amber:T.green}}>{g.severity}</span>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{g.gap}</div>
            </div>
          ))}
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>GDPR Article 30 — Processing Records</div>
          {[{purpose:'ESG Score Calculation',basis:'Legitimate Interest',categories:'Company Data, Emissions',recipients:'Internal Analytics',retention:'7 years'},{purpose:'Portfolio Reporting',basis:'Contract Performance',categories:'Holdings, NAV, Returns',recipients:'Client, Auditor',retention:'10 years'},{purpose:'Regulatory Disclosure',basis:'Legal Obligation',categories:'CSRD, SFDR, Taxonomy',recipients:'Regulator',retention:'10 years'},{purpose:'User Analytics',basis:'Consent',categories:'Usage Data, Sessions',recipients:'Internal',retention:'2 years'},{purpose:'Vendor Risk Assessment',basis:'Legitimate Interest',categories:'Vendor Data',recipients:'Risk Team',retention:'5 years'}].map((r,i)=>(
            <div key={i} style={{padding:8,borderBottom:`1px solid ${T.borderL}`,fontSize:11}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                <span style={{fontWeight:600}}>{r.purpose}</span>
                <span style={{color:'#7c3aed',fontSize:10,padding:'1px 6px',background:'#ede9fe',borderRadius:4}}>{r.basis}</span>
              </div>
              <div style={{color:T.textSec}}>Data: {r.categories} | To: {r.recipients} | Retain: {r.retention}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return(
    <div style={ss.wrap}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PLATFORM ADMINISTRATION / AUDIT TRAIL VIEWER</div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Audit Trail Viewer</h1>
        <p style={{margin:'4px 0 0',fontSize:13,color:T.textSec}}>Comprehensive audit trail for ISAE 3000 limited assurance and SOC 2 Type II compliance -- {AUDIT_EVENTS.length} events tracked</p>
      </div>
      <div style={ss.tabBar}>{TABS.map((t,i)=><button key={i} style={ss.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
      {tab===0&&renderTimeline()}
      {tab===1&&renderCalcAudit()}
      {tab===2&&renderChangeLog()}
      {tab===3&&renderComplianceReporting()}
    </div>
  );
}