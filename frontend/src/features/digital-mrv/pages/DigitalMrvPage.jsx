import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COUNTRIES=['Brazil','Indonesia','India','Kenya','Nigeria','Colombia','Vietnam','Thailand','Mexico','Australia','Canada','Germany','UK','USA','Chile'];
const METHODS=['Satellite','IoT','AI','Hybrid','Satellite+IoT','AI+Satellite'];
const STATUSES=['Verified','Pending','Flagged'];
const SENSOR_TYPES=['CEM','Methane Detector','Water Quality','Air Quality'];
const PROJECT_NAMES=['Amazon Reforestation','Borneo Palm Oil','Gujarat Solar Farm','Nairobi Wind Park','Lagos Waste-to-Energy','Bogota Transit','Mekong Delta Mangrove','Bangkok Industrial','Mexico City Air','Queensland Mining','Alberta Oil Sands','Rhine Industrial','Thames Water','Texas Refinery','Chile Copper','Sumatra Peatland','Kerala Hydro','Mombasa Port','Abuja Steel','Cali Agriculture','Hanoi Cement','Chiang Mai Biomass','Cancun Tourism','Perth LNG','Toronto District','Hamburg Port','Bristol Solar','Houston Petrochem','Santiago Metro','Java Geothermal','Kalimantan Logging','Tamil Nadu Wind','Kisumu Fisheries','Ogun Manufacturing','Medellin Hydro','Da Nang Shipping','Phuket Resort','Monterrey Steel','Brisbane Coal','Vancouver Forest','Munich Auto','London Finance','Dallas Chemicals','Valparaiso Port','Bali Rice','Rajasthan Desert Solar','Nakuru Dairy','Kano Textiles','Cartagena Oil','Saigon Industrial','Ayutthaya Sugar','Guadalajara Electronics','Sydney Harbour','Calgary Pipeline','Frankfurt Airport','Manchester Textile','San Antonio Military','Atacama Lithium','Surabaya Shipping','Madhya Pradesh Agriculture','Eldoret Tea','Ibadan Cocoa','Pereira Coffee','Haiphong Steel','Nakhon Ratchasima Rubber','Puebla Automotive','Gold Coast Tourism','Edmonton Tar Sands','Stuttgart Engineering','Leeds Healthcare','Fort Worth Gas','Antofagasta Mining','Bandung Textile','Pune IT Campus','Naivasha Flowers','Abeokuta Quarry','Armenia Bamboo','Hue Heritage','Khon Kaen Rice','Queretaro Aerospace','Adelaide Wine'];

const genProjects=()=>Array.from({length:80},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);const s5=sr(i*31);return{id:i+1,name:PROJECT_NAMES[i]||`Project-${i+1}`,country:COUNTRIES[Math.floor(s*COUNTRIES.length)],method:METHODS[Math.floor(s2*METHODS.length)],verified:+(s3*5+0.1).toFixed(2),accuracy:+(85+s4*14).toFixed(1),status:STATUSES[s5<0.6?0:s5<0.85?1:2],startDate:`202${3+Math.floor(sr(i*37)*3)}-${String(Math.floor(sr(i*41)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(i*43)*28)+1).padStart(2,'0')}`,dataSources:Math.floor(sr(i*47)*5)+2,confidence:+(88+sr(i*53)*11).toFixed(1),cost:Math.floor(sr(i*59)*50000)+5000,timeline:Array.from({length:12},(__,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],value:+(sr(i*61+m*7)*3+0.5).toFixed(2)})),intervals:{lower:+(85+sr(i*67)*5).toFixed(1),upper:+(93+sr(i*71)*6).toFixed(1)}}});

const genSatSites=()=>Array.from({length:30},(_,i)=>{const s=sr(i*97);return{id:i+1,name:`SAT-${String(i+1).padStart(3,'0')} ${PROJECT_NAMES[i]||'Site'}`,country:COUNTRIES[Math.floor(sr(i*101)*COUNTRIES.length)],lastScan:`2026-03-${String(Math.floor(sr(i*103)*28)+1).padStart(2,'0')}`,anomalies:Math.floor(sr(i*107)*5),severity:s<0.3?'Low':s<0.7?'Medium':'High',methane:+(sr(i*109)*200).toFixed(1),deforestation:+(sr(i*113)*50).toFixed(1),flares:Math.floor(sr(i*117)*10),landUseChange:+(sr(i*119)*30).toFixed(1),status:sr(i*121)<0.7?'Clear':sr(i*121)<0.9?'Alert':'Critical',trend:Array.from({length:12},(__,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],methane:+(sr(i*123+m*11)*200).toFixed(1),deforestation:+(sr(i*127+m*13)*50).toFixed(1)}))}});

const genSensors=()=>Array.from({length:50},(_,i)=>{const s=sr(i*131);return{id:i+1,name:`IOT-${String(i+1).padStart(3,'0')}`,facility:PROJECT_NAMES[Math.floor(sr(i*133)*40)]||`Facility-${i}`,type:SENSOR_TYPES[Math.floor(sr(i*137)*SENSOR_TYPES.length)],status:s<0.7?'Online':s<0.85?'Offline':'Calibrating',dataQuality:+(70+sr(i*139)*29).toFixed(1),lastReading:`2026-03-${String(Math.floor(sr(i*141)*28)+1).padStart(2,'0')} ${String(Math.floor(sr(i*143)*24)).padStart(2,'0')}:${String(Math.floor(sr(i*147)*60)).padStart(2,'0')}`,country:COUNTRIES[Math.floor(sr(i*149)*COUNTRIES.length)],threshold:+(sr(i*151)*100+50).toFixed(0),currentVal:+(sr(i*153)*150).toFixed(1),alertEnabled:sr(i*157)>0.3,coverage:+(60+sr(i*159)*39).toFixed(1)}});

const genVerifiedCerts=()=>Array.from({length:20},(_,i)=>({id:i+1,project:PROJECT_NAMES[i],method:METHODS[Math.floor(sr(i*163)*METHODS.length)],verifiedMt:+(sr(i*167)*4+0.5).toFixed(2),date:`2026-0${Math.floor(sr(i*169)*3)+1}-${String(Math.floor(sr(i*171)*28)+1).padStart(2,'0')}`,hash:`0x${Array.from({length:16},(__,j)=>Math.floor(sr(i*173+j*3)*16).toString(16)).join('')}`,auditor:['Bureau Veritas','SGS','DNV','TUV SUD','ERM'][Math.floor(sr(i*179)*5)],tradCost:Math.floor(sr(i*181)*80000)+20000,digiCost:Math.floor(sr(i*183)*20000)+3000,tradDays:Math.floor(sr(i*187)*60)+30,digiDays:Math.floor(sr(i*191)*10)+2,tradAccuracy:+(75+sr(i*193)*15).toFixed(1),digiAccuracy:+(90+sr(i*197)*9).toFixed(1)}));

const badge=(text,color)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.font,background:color==='green'?'#dcfce7':color==='amber'?'#fef3c7':color==='red'?'#fee2e2':color==='blue'?'#dbeafe':'#f3f4f6',color:color==='green'?T.green:color==='amber'?T.amber:color==='red'?T.red:color==='blue'?T.navyL:T.textSec});

export default function DigitalMrvPage(){
  const [tab,setTab]=useState(0);
  const [filterMethod,setFilterMethod]=useState('All');
  const [filterCountry,setFilterCountry]=useState('All');
  const [filterStatus,setFilterStatus]=useState('All');
  const [selectedProject,setSelectedProject]=useState(null);
  const [selectedSite,setSelectedSite]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [scanComplete,setScanComplete]=useState(false);
  const [sensorSearch,setSensorSearch]=useState('');
  const [alertConfig,setAlertConfig]=useState({sensorId:null,threshold:''});
  const [wfStep,setWfStep]=useState(0);
  const [wfSources,setWfSources]=useState([]);
  const [wfRules,setWfRules]=useState([]);
  const [wfRunning,setWfRunning]=useState(false);
  const [wfDone,setWfDone]=useState(false);
  const [certView,setCertView]=useState(null);
  const [sortCol,setSortCol]=useState('id');
  const [sortDir,setSortDir]=useState('asc');
  const [satSort,setSatSort]=useState('id');
  const [sensorSort,setSensorSort]=useState('id');

  const projects=useMemo(()=>genProjects(),[]);
  const satSites=useMemo(()=>genSatSites(),[]);
  const sensors=useMemo(()=>genSensors(),[]);
  const certs=useMemo(()=>genVerifiedCerts(),[]);

  const filtered=useMemo(()=>{
    let r=projects;
    if(filterMethod!=='All')r=r.filter(p=>p.method===filterMethod);
    if(filterCountry!=='All')r=r.filter(p=>p.country===filterCountry);
    if(filterStatus!=='All')r=r.filter(p=>p.status===filterStatus);
    return [...r].sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(typeof av==='number')return sortDir==='asc'?av-bv:bv-av;return sortDir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));});
  },[projects,filterMethod,filterCountry,filterStatus,sortCol,sortDir]);

  const filteredSensors=useMemo(()=>{
    let r=sensors;
    if(sensorSearch)r=r.filter(s=>s.name.toLowerCase().includes(sensorSearch.toLowerCase())||s.facility.toLowerCase().includes(sensorSearch.toLowerCase())||s.type.toLowerCase().includes(sensorSearch.toLowerCase()));
    return [...r].sort((a,b)=>{const av=a[sensorSort],bv=b[sensorSort];if(typeof av==='number')return av-bv;return String(av).localeCompare(String(bv));});
  },[sensors,sensorSearch,sensorSort]);

  const kpis=useMemo(()=>{
    const tot=projects.reduce((a,p)=>a+p.verified,0);
    const avgAcc=projects.length?projects.reduce((a,p)=>a+parseFloat(p.accuracy),0)/projects.length:0;
    const avgConf=projects.length?projects.reduce((a,p)=>a+parseFloat(p.confidence),0)/projects.length:0;
    const satCov=satSites.length?satSites.filter(s=>s.status!=='Critical').length/satSites.length*100:0;
    const iotCount=sensors.filter(s=>s.status==='Online').length;
    const costSav=certs.reduce((a,c)=>a+(c.tradCost-c.digiCost),0);
    const avgTurn=certs.length?certs.reduce((a,c)=>a+c.digiDays,0)/certs.length:0;
    return[{label:'Total Verified Emissions',value:`${tot.toFixed(1)} MtCO2e`,icon:'🛰️'},{label:'Active Projects',value:projects.length,icon:'📊'},{label:'Avg Verification Accuracy',value:`${avgAcc.toFixed(1)}%`,icon:'✓'},{label:'Satellite Coverage',value:`${satCov.toFixed(0)}%`,icon:'🌍'},{label:'IoT Sensors Online',value:iotCount,icon:'📡'},{label:'AI Confidence Score',value:`${avgConf.toFixed(1)}%`,icon:'🤖'},{label:'Cost Savings vs Manual',value:`$${(costSav/1000).toFixed(0)}K`,icon:'💰'},{label:'Avg Turnaround',value:`${avgTurn.toFixed(1)} days`,icon:'⏱️'}];
  },[projects,satSites,sensors,certs]);

  const handleSort=useCallback((col)=>{setSortCol(prev=>prev===col?(setSortDir(d=>d==='asc'?'desc':'asc'),col):(setSortDir('asc'),col));},[]);
  const handleSatSort=useCallback((col)=>{setSatSort(col);},[]);
  const handleSensorSort=useCallback((col)=>{setSensorSort(col);},[]);

  const runScan=useCallback(()=>{setScanning(true);setScanComplete(false);setTimeout(()=>{setScanning(false);setScanComplete(true);},3000);},[]);

  const runVerification=useCallback(()=>{if(wfSources.length===0)return;setWfRunning(true);setWfDone(false);setTimeout(()=>{setWfRunning(false);setWfDone(true);},2500);},[wfSources]);

  const tabs=['MRV Dashboard','Satellite Verification','IoT & Sensor Network','Verification Engine'];
  const cs={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},card:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16},h1:{fontSize:22,fontWeight:700,color:T.navy,margin:0},h2:{fontSize:16,fontWeight:700,color:T.navy,margin:'0 0 12px'},h3:{fontSize:14,fontWeight:600,color:T.navy,margin:'0 0 8px'},sub:{fontSize:12,color:T.textSec,margin:'2px 0 0'},tabBar:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tabBtn:(a)=>({padding:'10px 20px',border:'none',borderBottom:a?`3px solid ${T.navy}`:'3px solid transparent',background:a?T.surface:'transparent',color:a?T.navy:T.textSec,fontWeight:a?700:500,fontSize:13,fontFamily:T.font,cursor:'pointer',borderRadius:'8px 8px 0 0',transition:'all 0.2s'}),kpiGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:20},kpi:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,textAlign:'center'},select:{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,cursor:'pointer'},btn:(primary)=>({padding:'8px 18px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.2s'}),table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font},th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,cursor:'pointer',userSelect:'none'},td:{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,color:T.text},input:{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:200},side:{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:24,overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.08)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999}};

  const statusColor=(s)=>s==='Verified'||s==='Online'||s==='Clear'?'green':s==='Pending'||s==='Calibrating'||s==='Alert'?'amber':'red';
  const sevColor=(s)=>s==='Low'?T.green:s==='Medium'?T.amber:T.red;

  const renderDashboard=()=>(
    <>
      <div style={cs.kpiGrid}>{kpis.map((k,i)=><div key={i} style={cs.kpi}><div style={{fontSize:24}}>{k.icon}</div><div style={{fontSize:20,fontWeight:700,color:T.navy,margin:'4px 0'}}>{k.value}</div><div style={{fontSize:11,color:T.textSec}}>{k.label}</div></div>)}</div>
      <div style={{...cs.card}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
          <h2 style={cs.h2}>Verification Projects ({filtered.length})</h2>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <select style={cs.select} value={filterMethod} onChange={e=>setFilterMethod(e.target.value)}><option value="All">All Methods</option>{METHODS.map(m=><option key={m}>{m}</option>)}</select>
            <select style={cs.select} value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}><option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select>
            <select style={cs.select} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="All">All Statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>{[['id','#'],['name','Project'],['country','Country'],['method','Method'],['verified','MtCO2e'],['accuracy','Accuracy'],['status','Status']].map(([k,l])=><th key={k} style={cs.th} onClick={()=>handleSort(k)}>{l}{sortCol===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}</tr></thead>
            <tbody>{filtered.slice(0,40).map(p=><tr key={p.id} style={{cursor:'pointer',background:selectedProject?.id===p.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedProject(p)} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background=selectedProject?.id===p.id?T.surfaceH:'transparent'}>
              <td style={cs.td}>{p.id}</td><td style={{...cs.td,fontWeight:600}}>{p.name}</td><td style={cs.td}>{p.country}</td><td style={cs.td}><span style={badge(p.method,'blue')}>{p.method}</span></td><td style={{...cs.td,fontFamily:T.mono}}>{p.verified}</td><td style={{...cs.td,fontFamily:T.mono}}>{p.accuracy}%</td><td style={cs.td}><span style={badge(p.status,statusColor(p.status))}>{p.status}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
        {filtered.length>40&&<div style={{textAlign:'center',padding:8,fontSize:11,color:T.textMut}}>Showing 40 of {filtered.length} projects</div>}
      </div>
      {selectedProject&&<><div style={cs.overlay} onClick={()=>setSelectedProject(null)}/><div style={cs.side}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={cs.h2}>{selectedProject.name}</h2>
          <button style={cs.btn(false)} onClick={()=>setSelectedProject(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          {[['Country',selectedProject.country],['Method',selectedProject.method],['Status',selectedProject.status],['Verified',`${selectedProject.verified} MtCO2e`],['Accuracy',`${selectedProject.accuracy}%`],['Confidence',`${selectedProject.confidence}%`],['Data Sources',selectedProject.dataSources],['Cost',`$${selectedProject.cost.toLocaleString()}`]].map(([l,v],i)=><div key={i} style={{padding:8,background:T.surfaceH,borderRadius:8}}><div style={{fontSize:10,color:T.textMut}}>{l}</div><div style={{fontSize:13,fontWeight:600}}>{v}</div></div>)}
        </div>
        <h3 style={cs.h3}>Confidence Interval</h3>
        <div style={{padding:10,background:T.surfaceH,borderRadius:8,marginBottom:16,fontSize:12}}>
          <div>Lower: <strong>{selectedProject.intervals.lower}%</strong></div>
          <div>Upper: <strong>{selectedProject.intervals.upper}%</strong></div>
          <div style={{height:8,background:T.border,borderRadius:4,marginTop:8,position:'relative'}}>
            <div style={{position:'absolute',left:`${selectedProject.intervals.lower-80}%`,right:`${100-(selectedProject.intervals.upper-80)}%`,height:'100%',background:T.sage,borderRadius:4}}/>
          </div>
        </div>
        <h3 style={cs.h3}>Verification Timeline (12 months)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={selectedProject.timeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Area type="monotone" dataKey="value" stroke={T.sage} fill={T.sageL} fillOpacity={0.3} name="MtCO2e"/></AreaChart>
        </ResponsiveContainer>
        <h3 style={{...cs.h3,marginTop:16}}>Verification Events</h3>
        <div style={{borderLeft:`2px solid ${T.border}`,paddingLeft:16}}>
          {['Data Collection Started','Satellite Scan Complete','IoT Data Integrated','AI Analysis Run','Peer Review','Verification Issued'].map((ev,i)=><div key={i} style={{marginBottom:12,position:'relative'}}>
            <div style={{position:'absolute',left:-22,top:2,width:12,height:12,borderRadius:'50%',background:i<4?T.sage:T.border}}/>
            <div style={{fontSize:12,fontWeight:600}}>{ev}</div>
            <div style={{fontSize:10,color:T.textMut}}>{selectedProject.startDate}</div>
          </div>)}
        </div>
      </div></>}
    </>
  );

  const renderSatellite=()=>(
    <>
      <div style={{...cs.card}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><h2 style={cs.h2}>Satellite Monitoring Sites (30)</h2><p style={cs.sub}>Real-time satellite-based emissions monitoring and anomaly detection</p></div>
          <button style={{...cs.btn(true),minWidth:160,position:'relative'}} onClick={runScan} disabled={scanning}>
            {scanning?<span style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>Scanning...</span>:scanComplete?'Scan Complete ✓':'Run Satellite Scan'}
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <h3 style={cs.h3}>Anomaly Severity Heatmap</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3,marginBottom:20}}>
          {satSites.map((s,i)=><div key={i} title={`${s.name}: ${s.severity}`} style={{height:32,borderRadius:4,background:s.severity==='Low'?'#dcfce7':s.severity==='Medium'?'#fef3c7':'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600,color:sevColor(s.severity),cursor:'pointer',border:selectedSite?.id===s.id?`2px solid ${T.navy}`:'2px solid transparent'}} onClick={()=>setSelectedSite(s)}>{i+1}</div>)}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cs.card}>
          <h3 style={cs.h3}>Sites Overview</h3>
          <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
            <table style={cs.table}>
              <thead><tr>{[['id','#'],['name','Site'],['lastScan','Last Scan'],['anomalies','Anomalies'],['severity','Severity'],['status','Status']].map(([k,l])=><th key={k} style={{...cs.th,position:'sticky',top:0,background:T.surface}} onClick={()=>handleSatSort(k)}>{l}</th>)}</tr></thead>
              <tbody>{satSites.map(s=><tr key={s.id} style={{cursor:'pointer',background:selectedSite?.id===s.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedSite(s)}>
                <td style={cs.td}>{s.id}</td><td style={{...cs.td,fontWeight:500,fontSize:11}}>{s.name}</td><td style={{...cs.td,fontFamily:T.mono,fontSize:11}}>{s.lastScan}</td><td style={{...cs.td,fontFamily:T.mono}}>{s.anomalies}</td><td style={cs.td}><span style={{color:sevColor(s.severity),fontWeight:600,fontSize:11}}>{s.severity}</span></td><td style={cs.td}><span style={badge(s.status,statusColor(s.status))}>{s.status}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={cs.card}>
          {selectedSite?<>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={cs.h3}>{selectedSite.name}</h3><button style={cs.btn(false)} onClick={()=>setSelectedSite(null)}>×</button></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
              {[['Country',selectedSite.country],['Methane',`${selectedSite.methane} ppm`],['Deforestation',`${selectedSite.deforestation} ha`],['Flares',selectedSite.flares],['Land Use Δ',`${selectedSite.landUseChange} ha`],['Status',selectedSite.status]].map(([l,v],i)=><div key={i} style={{padding:6,background:T.surfaceH,borderRadius:6}}><div style={{fontSize:9,color:T.textMut}}>{l}</div><div style={{fontSize:12,fontWeight:600}}>{v}</div></div>)}
            </div>
            <h3 style={cs.h3}>12-Month Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={selectedSite.trend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9}} stroke={T.textMut}/><YAxis tick={{fontSize:9}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:8}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="methane" stroke={T.red} strokeWidth={2} dot={false} name="Methane (ppm)"/><Line type="monotone" dataKey="deforestation" stroke={T.sage} strokeWidth={2} dot={false} name="Deforestation (ha)"/></LineChart>
            </ResponsiveContainer>
          </>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:T.textMut,fontSize:13}}>Select a site to view details</div>}
        </div>
      </div>
    </>
  );

  const renderIoT=()=>{
    const statusCounts={Online:sensors.filter(s=>s.status==='Online').length,Offline:sensors.filter(s=>s.status==='Offline').length,Calibrating:sensors.filter(s=>s.status==='Calibrating').length};
    const typeCounts=SENSOR_TYPES.map(t=>({name:t,count:sensors.filter(s=>s.type===t).length}));
    const avgQuality=(sensors.reduce((a,s)=>a+parseFloat(s.dataQuality),0)/sensors.length).toFixed(1);
    const avgCoverage=(sensors.reduce((a,s)=>a+parseFloat(s.coverage),0)/sensors.length).toFixed(1);
    const gapSensors=sensors.filter(s=>parseFloat(s.coverage)<75);
    return(
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Total Sensors',v:sensors.length,c:T.navy},{l:'Online',v:statusCounts.Online,c:T.green},{l:'Avg Data Quality',v:`${avgQuality}%`,c:T.sage},{l:'Avg Coverage',v:`${avgCoverage}%`,c:T.gold}].map((k,i)=><div key={i} style={{...cs.card,textAlign:'center',padding:14}}><div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div><div style={{fontSize:11,color:T.textSec}}>{k.l}</div></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cs.card}>
          <h3 style={cs.h3}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={[{name:'Online',value:statusCounts.Online},{name:'Offline',value:statusCounts.Offline},{name:'Calibrating',value:statusCounts.Calibrating}]} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false} style={{fontSize:10}}>
              <Cell fill={T.green}/><Cell fill={T.red}/><Cell fill={T.amber}/>
            </Pie><Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={cs.card}>
          <h3 style={cs.h3}>Sensors by Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeCounts}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/><Bar dataKey="count" fill={T.navyL} radius={[4,4,0,0]}>{typeCounts.map((_,i)=><Cell key={i} fill={[T.navy,T.sage,T.gold,T.navyL][i]}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cs.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <h3 style={cs.h3}>Sensor Deployments ({filteredSensors.length})</h3>
          <input style={cs.input} placeholder="Search sensors, facilities, types..." value={sensorSearch} onChange={e=>setSensorSearch(e.target.value)}/>
        </div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={cs.table}>
            <thead><tr>{[['id','#'],['name','Sensor'],['facility','Facility'],['type','Type'],['status','Status'],['dataQuality','Quality'],['currentVal','Current'],['threshold','Threshold'],['coverage','Coverage']].map(([k,l])=><th key={k} style={{...cs.th,position:'sticky',top:0,background:T.surface}} onClick={()=>handleSensorSort(k)}>{l}</th>)}</tr></thead>
            <tbody>{filteredSensors.map(s=>{
              const overThreshold=parseFloat(s.currentVal)>parseFloat(s.threshold);
              return <tr key={s.id} style={{background:overThreshold?'#fef2f2':'transparent'}}>
                <td style={cs.td}>{s.id}</td><td style={{...cs.td,fontWeight:600,fontFamily:T.mono}}>{s.name}</td><td style={{...cs.td,fontSize:11}}>{s.facility}</td><td style={cs.td}><span style={badge(s.type,'blue')}>{s.type}</span></td><td style={cs.td}><span style={badge(s.status,statusColor(s.status))}>{s.status}</span></td><td style={{...cs.td,fontFamily:T.mono}}>{s.dataQuality}%</td><td style={{...cs.td,fontFamily:T.mono,color:overThreshold?T.red:T.text,fontWeight:overThreshold?700:400}}>{s.currentVal}</td><td style={{...cs.td,fontFamily:T.mono}}>{s.threshold}</td><td style={cs.td}><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{flex:1,height:6,background:T.border,borderRadius:3}}><div style={{width:`${s.coverage}%`,height:'100%',background:parseFloat(s.coverage)<75?T.amber:T.sage,borderRadius:3}}/></div><span style={{fontSize:10,fontFamily:T.mono}}>{s.coverage}%</span></div></td>
              </tr>})}</tbody>
          </table>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cs.card}>
          <h3 style={cs.h3}>Alert Configurator</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <select style={cs.select} value={alertConfig.sensorId||''} onChange={e=>setAlertConfig(p=>({...p,sensorId:e.target.value}))}>
              <option value="">Select sensor...</option>{sensors.map(s=><option key={s.id} value={s.id}>{s.name} — {s.facility}</option>)}
            </select>
            <input style={cs.input} placeholder="Threshold value..." type="number" value={alertConfig.threshold} onChange={e=>setAlertConfig(p=>({...p,threshold:e.target.value}))}/>
            <button style={cs.btn(true)} onClick={()=>{if(alertConfig.sensorId&&alertConfig.threshold)setAlertConfig({sensorId:null,threshold:''});}}>Set Alert</button>
          </div>
        </div>
        <div style={cs.card}>
          <h3 style={cs.h3}>Coverage Gap Analysis</h3>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>{gapSensors.length} sensors below 75% coverage threshold</div>
          <div style={{maxHeight:180,overflowY:'auto'}}>
            {gapSensors.map(s=><div key={s.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
              <span style={{fontWeight:600}}>{s.name}</span><span style={{fontFamily:T.mono,color:T.amber}}>{s.coverage}%</span>
            </div>)}
            {gapSensors.length===0&&<div style={{padding:16,textAlign:'center',color:T.textMut,fontSize:12}}>All sensors above threshold</div>}
          </div>
        </div>
      </div>
    </>
    );
  };

  const renderEngine=()=>{
    const costData=certs.slice(0,10).map(c=>({name:c.project.split(' ')[0],traditional:c.tradCost,digital:c.digiCost}));
    const timeData=certs.slice(0,10).map(c=>({name:c.project.split(' ')[0],traditional:c.tradDays,digital:c.digiDays}));
    const accData=certs.map(c=>({traditional:parseFloat(c.tradAccuracy),digital:parseFloat(c.digiAccuracy),name:c.project.split(' ')[0]}));
    const dataSrcOptions=['Satellite Imagery','IoT Sensor Data','AI Model Output','Manual Audit Data','Supply Chain Records','Government Registry'];
    const ruleOptions=['Cross-reference satellite + IoT','AI anomaly detection','Historical baseline comparison','Peer verification','Statistical threshold check','Blockchain immutability'];
    return(
    <>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cs.card}>
          <h3 style={cs.h3}>Cost Comparison ($)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8}} stroke={T.textMut} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:9}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:8}} formatter={v=>`$${v.toLocaleString()}`}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="traditional" fill={T.textMut} name="Traditional" radius={[3,3,0,0]}/><Bar dataKey="digital" fill={T.sage} name="Digital MRV" radius={[3,3,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cs.card}>
          <h3 style={cs.h3}>Time Comparison (Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8}} stroke={T.textMut} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:9}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:8}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="traditional" fill={T.amber} name="Traditional" radius={[3,3,0,0]}/><Bar dataKey="digital" fill={T.navy} name="Digital MRV" radius={[3,3,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cs.card}>
          <h3 style={cs.h3}>Accuracy Scatter (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="traditional" name="Traditional" tick={{fontSize:9}} stroke={T.textMut} label={{value:'Traditional %',position:'bottom',fontSize:9}}/><YAxis dataKey="digital" name="Digital" tick={{fontSize:9}} stroke={T.textMut} label={{value:'Digital %',angle:-90,position:'insideLeft',fontSize:9}}/><Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:8}} cursor={{strokeDasharray:'3 3'}}/><Scatter data={accData} fill={T.navyL}>{accData.map((_,i)=><Cell key={i} fill={i%2===0?T.sage:T.navyL}/>)}</Scatter></ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cs.card}>
        <h3 style={cs.h3}>Verification Workflow Builder</h3>
        <div style={{display:'flex',gap:16,marginBottom:16}}>
          {['Select Data Sources','Configure Rules','Run Verification','Generate Certificate'].map((step,i)=><div key={i} style={{flex:1,textAlign:'center',padding:12,borderRadius:8,background:wfStep===i?T.navy:i<wfStep?T.sage:T.surfaceH,color:wfStep===i||i<wfStep?'#fff':T.textSec,fontWeight:600,fontSize:11,cursor:'pointer',transition:'all 0.3s'}} onClick={()=>{if(i<=wfStep)setWfStep(i);}}>{i+1}. {step}</div>)}
        </div>
        {wfStep===0&&<div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Select data sources for verification</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {dataSrcOptions.map(ds=><div key={ds} style={{padding:10,borderRadius:8,border:`2px solid ${wfSources.includes(ds)?T.sage:T.border}`,background:wfSources.includes(ds)?'#dcfce7':T.surface,cursor:'pointer',fontSize:12,fontWeight:wfSources.includes(ds)?600:400,transition:'all 0.2s'}} onClick={()=>setWfSources(p=>p.includes(ds)?p.filter(x=>x!==ds):[...p,ds])}>{wfSources.includes(ds)?'✓ ':''}{ds}</div>)}
          </div>
          <button style={{...cs.btn(true),marginTop:12}} onClick={()=>{if(wfSources.length>0)setWfStep(1);}}>Next →</button>
        </div>}
        {wfStep===1&&<div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Configure verification rules</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {ruleOptions.map(r=><div key={r} style={{padding:10,borderRadius:8,border:`2px solid ${wfRules.includes(r)?T.sage:T.border}`,background:wfRules.includes(r)?'#dcfce7':T.surface,cursor:'pointer',fontSize:12,fontWeight:wfRules.includes(r)?600:400,transition:'all 0.2s'}} onClick={()=>setWfRules(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r])}>{wfRules.includes(r)?'✓ ':''}{r}</div>)}
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button style={cs.btn(false)} onClick={()=>setWfStep(0)}>← Back</button>
            <button style={cs.btn(true)} onClick={()=>setWfStep(2)}>Next →</button>
          </div>
        </div>}
        {wfStep===2&&<div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Ready to run verification with {wfSources.length} sources and {wfRules.length} rules</div>
          <div style={{padding:16,background:T.surfaceH,borderRadius:8,marginBottom:12}}>
            <div style={{fontSize:11,marginBottom:4}}><strong>Sources:</strong> {wfSources.join(', ')}</div>
            <div style={{fontSize:11}}><strong>Rules:</strong> {wfRules.join(', ')||'Default rules'}</div>
          </div>
          {wfRunning&&<div style={{textAlign:'center',padding:20}}>
            <div style={{width:40,height:40,border:`3px solid ${T.border}`,borderTopColor:T.navy,borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px'}}/>
            <div style={{fontSize:12,color:T.textSec}}>Running verification engine...</div>
          </div>}
          {wfDone&&<div style={{padding:12,background:'#dcfce7',borderRadius:8,marginBottom:12,fontSize:12,color:T.green,fontWeight:600}}>Verification complete — certificate generated</div>}
          <div style={{display:'flex',gap:8}}>
            <button style={cs.btn(false)} onClick={()=>setWfStep(1)}>← Back</button>
            <button style={cs.btn(true)} onClick={()=>{runVerification();}} disabled={wfRunning}>{wfRunning?'Processing...':'Run Verification'}</button>
            {wfDone&&<button style={cs.btn(true)} onClick={()=>setWfStep(3)}>View Certificate →</button>}
          </div>
        </div>}
        {wfStep===3&&<div>
          <div style={{padding:20,border:`2px solid ${T.sage}`,borderRadius:12,background:'linear-gradient(135deg,#f0fdf4,#ffffff)',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:T.navy,marginBottom:4}}>Digital MRV Verification Certificate</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:16}}>Issued {new Date().toISOString().slice(0,10)}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,textAlign:'left',marginBottom:12}}>
              <div style={{fontSize:11}}><strong>Sources:</strong> {wfSources.join(', ')}</div>
              <div style={{fontSize:11}}><strong>Rules:</strong> {wfRules.length} applied</div>
              <div style={{fontSize:11}}><strong>Confidence:</strong> 96.2%</div>
              <div style={{fontSize:11}}><strong>Status:</strong> <span style={{color:T.green,fontWeight:600}}>Verified</span></div>
            </div>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,wordBreak:'break-all',background:T.surfaceH,padding:8,borderRadius:6}}>Hash: 0x{Array.from({length:32},(_,i)=>Math.floor(sr(i*251)*16).toString(16)).join('')}</div>
          </div>
          <button style={{...cs.btn(false),marginTop:12}} onClick={()=>{setWfStep(0);setWfDone(false);setWfSources([]);setWfRules([]);}}>Start New Verification</button>
        </div>}
      </div>
      <div style={cs.card}>
        <h3 style={cs.h3}>Pre-Verified Certificates (20)</h3>
        <div style={{overflowX:'auto'}}>
          <table style={cs.table}>
            <thead><tr>{['#','Project','Method','MtCO2e','Date','Auditor','Blockchain Hash',''].map((h,i)=><th key={i} style={cs.th}>{h}</th>)}</tr></thead>
            <tbody>{certs.map(c=><tr key={c.id}>
              <td style={cs.td}>{c.id}</td><td style={{...cs.td,fontWeight:600}}>{c.project}</td><td style={cs.td}><span style={badge(c.method,'blue')}>{c.method}</span></td><td style={{...cs.td,fontFamily:T.mono}}>{c.verifiedMt}</td><td style={{...cs.td,fontFamily:T.mono,fontSize:11}}>{c.date}</td><td style={{...cs.td,fontSize:11}}>{c.auditor}</td><td style={{...cs.td,fontFamily:T.mono,fontSize:9,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.hash}</td>
              <td style={cs.td}><button style={{...cs.btn(false),fontSize:10,padding:'4px 10px'}} onClick={()=>setCertView(c)}>View</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      {certView&&<><div style={cs.overlay} onClick={()=>setCertView(null)}/><div style={cs.side}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={cs.h2}>Certificate #{certView.id}</h2>
          <button style={cs.btn(false)} onClick={()=>setCertView(null)}>Close</button>
        </div>
        <div style={{padding:20,border:`2px solid ${T.sage}`,borderRadius:12,background:'linear-gradient(135deg,#f0fdf4,#ffffff)',marginBottom:16}}>
          <div style={{textAlign:'center',marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:700,color:T.navy}}>Verification Certificate</div>
            <div style={{fontSize:11,color:T.textSec}}>{certView.project}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['Method',certView.method],['Verified',`${certView.verifiedMt} MtCO2e`],['Date',certView.date],['Auditor',certView.auditor],['Trad. Cost',`$${certView.tradCost.toLocaleString()}`],['Digital Cost',`$${certView.digiCost.toLocaleString()}`],['Trad. Days',certView.tradDays],['Digital Days',certView.digiDays],['Trad. Accuracy',`${certView.tradAccuracy}%`],['Digi. Accuracy',`${certView.digiAccuracy}%`]].map(([l,v],i)=><div key={i} style={{padding:6,background:T.surfaceH,borderRadius:6}}><div style={{fontSize:9,color:T.textMut}}>{l}</div><div style={{fontSize:12,fontWeight:600}}>{v}</div></div>)}
          </div>
          <div style={{marginTop:12,padding:8,background:T.surfaceH,borderRadius:6}}>
            <div style={{fontSize:9,color:T.textMut}}>Blockchain Hash</div>
            <div style={{fontSize:10,fontFamily:T.mono,wordBreak:'break-all'}}>{certView.hash}</div>
          </div>
        </div>
        <h3 style={cs.h3}>Savings Analysis</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{padding:12,background:'#dcfce7',borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:T.green}}>${(certView.tradCost-certView.digiCost).toLocaleString()}</div>
            <div style={{fontSize:10,color:T.textSec}}>Cost Saved</div>
          </div>
          <div style={{padding:12,background:'#dbeafe',borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:T.navyL}}>{certView.tradDays-certView.digiDays} days</div>
            <div style={{fontSize:10,color:T.textSec}}>Time Saved</div>
          </div>
        </div>
      </div></>}
    </>
    );
  };

  return(
    <div style={cs.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div><h1 style={cs.h1}>Digital MRV Platform</h1><p style={cs.sub}>Satellite + IoT + AI-powered emissions measurement, reporting and verification</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={badge('EP-AM1','blue')}>EP-AM1</span>
          <span style={badge(`${projects.length} Projects`,'green')}>{projects.length} Projects</span>
          <span style={badge(`${COUNTRIES.length} Countries`,'amber')}>{COUNTRIES.length} Countries</span>
        </div>
      </div>
      <div style={cs.tabBar}>{tabs.map((t,i)=><button key={i} style={cs.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderSatellite()}
      {tab===2&&renderIoT()}
      {tab===3&&renderEngine()}
    </div>
  );
}
