import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const INDUSTRIES=['Oil & Gas','Power Generation','Cement & Concrete','Steel & Metals','Chemicals',
  'Pharmaceuticals','Data Centers','Automotive','Food & Beverage','Pulp & Paper','Mining','Logistics'];
const COUNTRIES=['US','UK','DE','NL','JP','AU','CA','BR','IN','SG','FR','AE'];
const CITIES=['Houston','London','Frankfurt','Rotterdam','Tokyo','Sydney','Toronto',
  'Sao Paulo','Mumbai','Singapore','Paris','Dubai'];
const SENSOR_TYPES=['CEMS','Methane Detector','Particulate','Temperature',
  'Flow Meter','Gas Analyzer','Weather Station','Energy Meter'];
const SENSOR_UNITS=['ppm','ppm-m','mg/m3','\u00b0C','m3/h','vol%','km/h','kWh'];
const FAC_NAMES=['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa'];
const FAC_SUFFIX=['Plant','Hub','Works','Station','Complex','Facility'];

const facilities=Array.from({length:60},(_,i)=>{
  const ind=INDUSTRIES[Math.floor(sr(i*3)*12)];
  const ci=Math.floor(sr(i*11)*12);
  const sensorCt=Math.floor(sr(i*13)*6)+2;
  const emRate=Math.round((sr(i*17)*8+0.5)*100)/100;
  const statArr=['nominal','nominal','nominal','nominal','nominal','alert','offline',
    'nominal','nominal','nominal','alert','nominal'];
  return {
    id:i,
    name:`${FAC_NAMES[i%10]} ${ind.split(' ')[0]} ${FAC_SUFFIX[i%6]}${i>9?' '+String(Math.floor(i/10)+1):''}`,
    industry:ind,country:COUNTRIES[ci],city:CITIES[ci],
    sensorCount:sensorCt,emissionsRate:emRate,
    status:statArr[Math.floor(sr(i*23)*12)],
    lat:Math.round((sr(i*31)*140-70)*100)/100,
    lng:Math.round((sr(i*37)*340-170)*100)/100,
    scope1:Math.round(sr(i*41)*5000+500),
    scope2:Math.round(sr(i*43)*3000+300),
    scope3:Math.round(sr(i*47)*8000+1000),
    efficiency:Math.round((sr(i*53)*40+60)*10)/10,
    yearBuilt:2005+Math.floor(sr(i*59)*18),
    lastInspection:`2026-0${Math.floor(sr(i*61)*3)+1}-${String(Math.floor(sr(i*67)*27)+1).padStart(2,'0')}`,
    permitId:`PRM-${String(i*137+1000).slice(0,4)}-${COUNTRIES[ci]}`,
    contactName:`${['J.','M.','R.','A.','S.','L.','K.','P.'][i%8]} ${['Chen','Patel','Garcia','Smith','Kim','Mueller','Santos','Tanaka'][Math.floor(sr(i*71)*8)]}`,
  };
});

const sensors=Array.from({length:200},(_,i)=>{
  const fIdx=Math.floor(i*60/200);
  const typeIdx=Math.floor(sr(i*7)*8);
  const statArr=['online','online','online','online','online','online','offline',
    'calibrating','error','online','online','online'];
  return {
    id:`SNS-${String(i+1).padStart(4,'0')}`,
    facilityId:fIdx,
    facilityName:facilities[fIdx].name,
    type:SENSOR_TYPES[typeIdx],
    status:statArr[Math.floor(sr(i*11)*12)],
    dataQuality:Math.round((sr(i*13)*30+70)*10)/10,
    lastCalibration:Math.floor(sr(i*17)*90)+1,
    nextCalibration:Math.floor(sr(i*19)*30)+1,
    reading:Math.round(sr(i*23)*1000*100)/100,
    unit:SENSOR_UNITS[typeIdx],
    alertThreshold:Math.round(sr(i*29)*500+500),
    uptime:Math.round((sr(i*31)*10+90)*10)/10,
    firmware:`v${Math.floor(sr(i*37)*3)+2}.${Math.floor(sr(i*41)*9)}.${Math.floor(sr(i*43)*20)}`,
    installDate:`202${Math.floor(sr(i*47)*4)+2}-${String(Math.floor(sr(i*53)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(i*59)*28)+1).padStart(2,'0')}`,
    manufacturer:['Siemens','ABB','Honeywell','Emerson','Yokogawa','SICK AG','Teledyne','Endress+Hauser'][Math.floor(sr(i*61)*8)],
    model:['StackGuard Pro','EmitSense X1','ClearAir 500','ThermoTrack 3K','FlowMaster V2','GasEye Ultra','MeteoLink 7','PowerMeter EX'][typeIdx],
  };
});

const hourlyData=Array.from({length:24},(_,h)=>({
  hour:`${String(h).padStart(2,'0')}:00`,
  emissions:Math.round((sr(h*7)*3+2)*100)/100,
  temperature:Math.round((sr(h*11)*10+15)*10)/10,
  flow:Math.round(sr(h*13)*500+200),
  energy:Math.round(sr(h*17)*800+400),
  methane:Math.round(sr(h*19)*50+10),
  particulate:Math.round(sr(h*23)*30+5),
}));

const monthlyHistory=Array.from({length:12},(_,m)=>{
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return {
    month:mo[m],
    emissions:Math.round(sr(m*7)*2000+3000),
    forecast:Math.round(sr(m*11)*1800+3200),
    scope1:Math.round(sr(m*13)*800+400),
    scope2:Math.round(sr(m*17)*600+300),
    scope3:Math.round(sr(m*19)*1200+600),
    anomalyCount:Math.floor(sr(m*23)*5),
    avgQuality:Math.round((sr(m*29)*15+82)*10)/10,
  };
});

const anomalies=[
  {id:1,facility:'Alpha Oil Plant',timestamp:'2026-03-28 02:14',type:'Emissions Spike',severity:'critical',
   value:12.4,baseline:4.2,rootCause:'Process Upset',desc:'Flaring event during unplanned compressor shutdown',
   sensorId:'SNS-0001',duration:'47 min',estExcess:8.2,mitigationStatus:'Resolved'},
  {id:2,facility:'Beta Power Hub',timestamp:'2026-03-28 06:31',type:'Emissions Spike',severity:'warning',
   value:8.1,baseline:5.5,rootCause:'Demand Surge',desc:'Peak morning load exceeded capacity threshold',
   sensorId:'SNS-0012',duration:'2h 15min',estExcess:5.2,mitigationStatus:'Monitoring'},
  {id:3,facility:'Gamma Cement Works',timestamp:'2026-03-27 14:22',type:'Anomaly',severity:'warning',
   value:6.8,baseline:3.9,rootCause:'Equipment Failure',desc:'Kiln exhaust fan degraded efficiency by 22%',
   sensorId:'SNS-0025',duration:'4h 30min',estExcess:11.6,mitigationStatus:'Under repair'},
  {id:4,facility:'Delta Steel Station',timestamp:'2026-03-27 19:45',type:'Emissions Spike',severity:'critical',
   value:15.2,baseline:7.1,rootCause:'Process Upset',desc:'Blast furnace tap hole blockage released excess CO2',
   sensorId:'SNS-0038',duration:'1h 10min',estExcess:9.5,mitigationStatus:'Resolved'},
  {id:5,facility:'Epsilon Chemical Complex',timestamp:'2026-03-26 11:08',type:'Sensor Drift',severity:'info',
   value:3.2,baseline:3.0,rootCause:'Weather',desc:'High humidity caused CEMS sensor drift',
   sensorId:'SNS-0051',duration:'6h',estExcess:1.2,mitigationStatus:'Recalibrated'},
  {id:6,facility:'Zeta Data Center',timestamp:'2026-03-26 23:55',type:'Emissions Spike',severity:'warning',
   value:4.5,baseline:2.8,rootCause:'Demand Surge',desc:'Cooling demand spike during ambient temp increase',
   sensorId:'SNS-0064',duration:'3h 45min',estExcess:6.4,mitigationStatus:'Monitoring'},
  {id:7,facility:'Eta Automotive Works',timestamp:'2026-03-25 08:12',type:'Threshold Breach',severity:'critical',
   value:11.8,baseline:5.9,rootCause:'Equipment Failure',desc:'Paint booth VOC scrubber malfunction',
   sensorId:'SNS-0077',duration:'55 min',estExcess:5.4,mitigationStatus:'Resolved'},
  {id:8,facility:'Theta Mining Station',timestamp:'2026-03-25 16:40',type:'Methane Leak',severity:'critical',
   value:220,baseline:45,rootCause:'Equipment Failure',desc:'Ventilation shaft methane detector triggered alarm',
   sensorId:'SNS-0090',duration:'28 min',estExcess:4.1,mitigationStatus:'Sealed'},
];

const complianceItems=[
  {reg:'EU ETS MRV',item:'Monitoring Plan Approved',status:'complete',due:'2026-01-15',owner:'Compliance Team'},
  {reg:'EU ETS MRV',item:'Annual Emissions Report',status:'in_progress',due:'2026-03-31',owner:'A. Chen'},
  {reg:'EU ETS MRV',item:'Verification Body Appointed',status:'complete',due:'2026-02-01',owner:'Legal'},
  {reg:'EU ETS MRV',item:'Improvement Report Submitted',status:'pending',due:'2026-06-30',owner:'Operations'},
  {reg:'EU ETS MRV',item:'Tonne-km Data Collected',status:'complete',due:'2026-03-01',owner:'Logistics'},
  {reg:'EU ETS MRV',item:'Uncertainty Assessment',status:'in_progress',due:'2026-04-15',owner:'QA Team'},
  {reg:'EPA GHGRP',item:'Subpart C Direct Emissions',status:'complete',due:'2026-03-31',owner:'Env. Team'},
  {reg:'EPA GHGRP',item:'Subpart D Electricity Emissions',status:'in_progress',due:'2026-03-31',owner:'Energy Mgr'},
  {reg:'EPA GHGRP',item:'GHG Permit Application',status:'complete',due:'2026-01-31',owner:'Legal'},
  {reg:'EPA GHGRP',item:'CEMS Quality Assurance',status:'in_progress',due:'2026-04-15',owner:'QA Team'},
  {reg:'EPA GHGRP',item:'Calibration Error Test',status:'pending',due:'2026-05-01',owner:'Maintenance'},
  {reg:'EPA GHGRP',item:'Missing Data Substitution',status:'complete',due:'2026-03-15',owner:'Data Team'},
  {reg:'ISO 14064',item:'GHG Inventory Boundary Set',status:'complete',due:'2026-02-15',owner:'Strategy'},
  {reg:'ISO 14064',item:'Quantification Methodology',status:'complete',due:'2026-02-28',owner:'Science Team'},
  {reg:'ISO 14064',item:'Third-Party Verification',status:'pending',due:'2026-07-15',owner:'External'},
  {reg:'ISO 14064',item:'Materiality Threshold Review',status:'in_progress',due:'2026-04-30',owner:'Risk Team'},
];

const deadlines=[
  {reg:'EU ETS',task:'Annual Emissions Report',due:'2026-03-31',daysLeft:3,priority:'critical'},
  {reg:'EPA GHGRP',task:'Subpart D Filing',due:'2026-03-31',daysLeft:3,priority:'critical'},
  {reg:'EPA GHGRP',task:'CEMS QA Report',due:'2026-04-15',daysLeft:18,priority:'high'},
  {reg:'EU ETS MRV',task:'Uncertainty Assessment',due:'2026-04-15',daysLeft:18,priority:'high'},
  {reg:'EPA GHGRP',task:'Calibration Error Test',due:'2026-05-01',daysLeft:34,priority:'medium'},
  {reg:'ISO 14064',task:'Materiality Review',due:'2026-04-30',daysLeft:33,priority:'medium'},
  {reg:'EU ETS',task:'Improvement Report',due:'2026-06-30',daysLeft:94,priority:'low'},
  {reg:'ISO 14064',task:'Verification Audit',due:'2026-07-15',daysLeft:109,priority:'low'},
];

const auditTrail=[
  {ts:'2026-03-28 14:22',action:'Data Submission',fac:'Alpha Oil Plant',sensor:'SNS-0001',user:'System (Auto)',status:'verified'},
  {ts:'2026-03-28 13:15',action:'Calibration Logged',fac:'Beta Power Hub',sensor:'SNS-0045',user:'J. Martinez',status:'complete'},
  {ts:'2026-03-28 12:01',action:'QA Check',fac:'Gamma Cement Works',sensor:'SNS-0089',user:'System (Auto)',status:'passed'},
  {ts:'2026-03-28 11:30',action:'Anomaly Flagged',fac:'Delta Steel Station',sensor:'SNS-0112',user:'System (Auto)',status:'under_review'},
  {ts:'2026-03-28 10:45',action:'Report Generated',fac:'All Facilities',sensor:'\u2014',user:'A. Chen',status:'exported'},
  {ts:'2026-03-28 09:00',action:'Data Submission',fac:'Epsilon Chemical Complex',sensor:'SNS-0156',user:'System (Auto)',status:'verified'},
  {ts:'2026-03-27 23:59',action:'Daily Rollup',fac:'All Facilities',sensor:'\u2014',user:'System (Cron)',status:'complete'},
  {ts:'2026-03-27 18:30',action:'Threshold Updated',fac:'Zeta Data Center',sensor:'SNS-0178',user:'R. Patel',status:'applied'},
  {ts:'2026-03-27 16:20',action:'Firmware Update',fac:'Eta Automotive Works',sensor:'SNS-0077',user:'K. Mueller',status:'complete'},
  {ts:'2026-03-27 14:10',action:'Sensor Replaced',fac:'Theta Mining Station',sensor:'SNS-0090',user:'S. Santos',status:'verified'},
  {ts:'2026-03-27 11:05',action:'Calibration Logged',fac:'Iota Food Facility',sensor:'SNS-0134',user:'L. Kim',status:'complete'},
  {ts:'2026-03-27 08:00',action:'Data Submission',fac:'Kappa Logistics Hub',sensor:'SNS-0199',user:'System (Auto)',status:'verified'},
];

/* ---- helper components ---- */
const pill=(color,bg,label)=>(
  <span style={{padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:bg,color,whiteSpace:'nowrap'}}>{label}</span>
);
const statBox=(label,val,sub,accent=T.navy)=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px',flex:1,minWidth:150}}>
    <div style={{fontSize:12,color:T.textMut,marginBottom:4,fontFamily:T.font}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:accent,fontFamily:T.mono}}>{val}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);
const sectionTitle=(text)=>(
  <h3 style={{fontSize:15,fontWeight:700,color:T.navy,margin:'20px 0 10px',fontFamily:T.font}}>{text}</h3>
);
const selectEl=(val,setVal,opts,w=140)=>(
  <select value={val} onChange={e=>setVal(e.target.value)}
    style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,
      fontFamily:T.font,color:T.text,background:T.surface,width:w,cursor:'pointer'}}>
    {opts.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);
const TabBtn=({active,label,onClick,icon})=>(
  <button onClick={onClick} style={{padding:'8px 18px',borderRadius:8,
    border:active?`2px solid ${T.navy}`:`1px solid ${T.border}`,
    background:active?T.navy:T.surface,color:active?'#fff':T.text,
    fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:T.font,
    display:'flex',alignItems:'center',gap:6,transition:'all 0.15s'}}>
    {icon}{label}
  </button>
);
const tblHeader=(cols)=>(
  <thead><tr style={{background:T.surfaceH}}>
    {cols.map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:600,
      color:T.navy,fontSize:11,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
  </tr></thead>
);
const progressBar=(pct,color=T.sage,w=60)=>(
  <div style={{display:'flex',alignItems:'center',gap:6}}>
    <div style={{width:w,height:5,borderRadius:3,background:T.border}}>
      <div style={{height:'100%',borderRadius:3,background:color,width:`${pct}%`}}/>
    </div>
    <span style={{fontFamily:T.mono,fontSize:10}}>{pct}%</span>
  </div>
);

/* ==================== MAIN COMPONENT ==================== */
export default function IotEmissionsTrackerPage(){
  const [tab,setTab]=useState(0);
  const [indFilter,setIndFilter]=useState('All');
  const [statusFilter,setStatusFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [selectedFacility,setSelectedFacility]=useState(null);
  const [compareFacilities,setCompareFacilities]=useState([]);
  const [compareMode,setCompareMode]=useState(false);
  const [sensorTypeFilter,setSensorTypeFilter]=useState('All');
  const [sensorStatusFilter,setSensorStatusFilter]=useState('All');
  const [diagRunning,setDiagRunning]=useState(false);
  const [diagProgress,setDiagProgress]=useState(0);
  const [aggMode,setAggMode]=useState('daily');
  const [selectedAnomaly,setSelectedAnomaly]=useState(null);
  const [carbonPrice,setCarbonPrice]=useState(85);
  const [regFilter,setRegFilter]=useState('All');
  const [reportGen,setReportGen]=useState(false);
  const [sensorSearch,setSensorSearch]=useState('');
  const [selectedSensor,setSelectedSensor]=useState(null);
  const [showForecast,setShowForecast]=useState(true);

  const filteredFacilities=useMemo(()=>facilities.filter(f=>{
    if(indFilter!=='All'&&f.industry!==indFilter)return false;
    if(statusFilter!=='All'&&f.status!==statusFilter)return false;
    if(countryFilter!=='All'&&f.country!==countryFilter)return false;
    return true;
  }),[indFilter,statusFilter,countryFilter]);

  const filteredSensors=useMemo(()=>sensors.filter(s=>{
    if(sensorTypeFilter!=='All'&&s.type!==sensorTypeFilter)return false;
    if(sensorStatusFilter!=='All'&&s.status!==sensorStatusFilter)return false;
    if(sensorSearch&&!s.id.toLowerCase().includes(sensorSearch.toLowerCase())
      &&!s.facilityName.toLowerCase().includes(sensorSearch.toLowerCase()))return false;
    return true;
  }),[sensorTypeFilter,sensorStatusFilter,sensorSearch]);

  const totalEmissions=useMemo(()=>facilities.reduce((a,f)=>a+f.scope1+f.scope2+f.scope3,0),[]);
  const onlineSensors=sensors.filter(s=>s.status==='online').length;
  const alertFacilities=facilities.filter(f=>f.status==='alert').length;
  const avgQuality=Math.round(sensors.reduce((a,s)=>a+s.dataQuality,0)/sensors.length*10)/10;

  const handleDiag=useCallback(()=>{
    setDiagRunning(true);setDiagProgress(0);
    let p=0;const iv=setInterval(()=>{
      p+=Math.floor(sr(p*3)*15)+5;
      if(p>=100){p=100;clearInterval(iv);setTimeout(()=>{setDiagRunning(false);setDiagProgress(0);},800);}
      setDiagProgress(p);
    },200);
  },[]);

  const toggleCompare=(fac)=>{
    setCompareFacilities(prev=>{
      if(prev.find(f=>f.id===fac.id))return prev.filter(f=>f.id!==fac.id);
      if(prev.length>=3)return prev;
      return[...prev,fac];
    });
  };

  const handleExport=useCallback(()=>{
    setReportGen(true);
    setTimeout(()=>{
      const hdr=['Facility','Industry','Country','City','Scope1','Scope2','Scope3','Total','EmissionsRate','Status','Efficiency','SensorCount','Permit'];
      const rows=facilities.map(f=>[f.name,f.industry,f.country,f.city,f.scope1,f.scope2,f.scope3,
        f.scope1+f.scope2+f.scope3,f.emissionsRate,f.status,f.efficiency,f.sensorCount,f.permitId].join(','));
      const csv=[hdr.join(','),...rows].join('\n');
      const blob=new Blob([csv],{type:'text/csv'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='iot_emissions_compliance_report.csv';a.click();
      URL.revokeObjectURL(url);setReportGen(false);
    },1500);
  },[]);

  const verificationScore=useMemo(()=>{
    const done=complianceItems.filter(c=>c.status==='complete').length;
    return Math.round(done/complianceItems.length*100);
  },[]);

  /* ======================== TAB 1: FACILITY NETWORK ======================== */
  const renderFacilityNetwork=()=>{
    /* --- compare view --- */
    if(compareMode&&compareFacilities.length>=2){
      const compData=compareFacilities.map(f=>({
        name:f.name.split(' ').slice(0,2).join(' '),
        Scope1:f.scope1,Scope2:f.scope2,Scope3:f.scope3
      }));
      const compHourly=Array.from({length:24},(_,h)=>{
        const obj={hour:`${String(h).padStart(2,'0')}:00`};
        compareFacilities.forEach((f,fi)=>{
          obj[f.name.split(' ')[0]]=Math.round((sr(f.id*100+h*7)*3+1.5)*100)/100;
        });
        return obj;
      });
      const compColors=[T.navy,T.gold,T.sage];
      return(<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,color:T.navy,margin:0}}>
            Facility Comparison ({compareFacilities.length} selected)
          </h3>
          <button onClick={()=>{setCompareMode(false);setCompareFacilities([]);}}
            style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${T.border}`,
              background:T.surface,color:T.text,fontSize:12,cursor:'pointer',fontFamily:T.font}}>
            Exit Compare
          </button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${compareFacilities.length},1fr)`,gap:14,marginBottom:18}}>
          {compareFacilities.map((f,fi)=>(
            <div key={f.id} style={{background:T.surface,border:`2px solid ${compColors[fi]}`,borderRadius:10,padding:16}}>
              <div style={{fontWeight:700,color:T.navy,fontSize:14,marginBottom:4}}>{f.name}</div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>{f.industry} | {f.city}, {f.country}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div><span style={{fontSize:10,color:T.textMut}}>Scope 1</span>
                  <div style={{fontWeight:700,color:T.navy,fontFamily:T.mono}}>{f.scope1.toLocaleString()}</div></div>
                <div><span style={{fontSize:10,color:T.textMut}}>Scope 2</span>
                  <div style={{fontWeight:700,color:T.navyL,fontFamily:T.mono}}>{f.scope2.toLocaleString()}</div></div>
                <div><span style={{fontSize:10,color:T.textMut}}>Scope 3</span>
                  <div style={{fontWeight:700,color:T.gold,fontFamily:T.mono}}>{f.scope3.toLocaleString()}</div></div>
                <div><span style={{fontSize:10,color:T.textMut}}>Rate</span>
                  <div style={{fontWeight:700,color:T.sage,fontFamily:T.mono}}>{f.emissionsRate} t/hr</div></div>
                <div><span style={{fontSize:10,color:T.textMut}}>Efficiency</span>
                  <div style={{fontWeight:700,color:T.teal,fontFamily:T.mono}}>{f.efficiency}%</div></div>
                <div><span style={{fontSize:10,color:T.textMut}}>Sensors</span>
                  <div style={{fontWeight:700,color:T.navyL,fontFamily:T.mono}}>{f.sensorCount}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Total Emissions Comparison (tCO2e)</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={compData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Scope1" fill={T.navy} radius={[4,4,0,0]}/>
                <Bar dataKey="Scope2" fill={T.navyL} radius={[4,4,0,0]}/>
                <Bar dataKey="Scope3" fill={T.gold} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>24-Hour Emissions Overlay</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={compHourly}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="hour" tick={{fontSize:10,fill:T.textSec}} interval={3}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                {compareFacilities.map((f,fi)=>(
                  <Line key={f.id} type="monotone" dataKey={f.name.split(' ')[0]}
                    stroke={compColors[fi]} strokeWidth={2} dot={{r:2}}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>);
    }

    /* --- facility deep-dive --- */
    if(selectedFacility!==null){
      const f=facilities[selectedFacility];
      const fSensors=sensors.filter(s=>s.facilityId===selectedFacility);
      const fHourly=hourlyData.map((h,i)=>({
        ...h,
        emissions:Math.round((sr(selectedFacility*100+i*7)*3+1.5)*100)/100,
        methane:Math.round(sr(selectedFacility*100+i*19)*50+10),
      }));
      const fAlerts=anomalies.filter(a=>a.facility.includes(f.name.split(' ')[0]));
      return(<div>
        <button onClick={()=>setSelectedFacility(null)}
          style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${T.border}`,
            background:T.surface,color:T.text,fontSize:12,cursor:'pointer',fontFamily:T.font,marginBottom:12}}>
          &larr; Back to Network
        </button>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <h3 style={{margin:0,color:T.navy,fontSize:17}}>{f.name}</h3>
              <div style={{fontSize:13,color:T.textSec,marginTop:4}}>
                {f.industry} | {f.city}, {f.country} | Built {f.yearBuilt} | {f.sensorCount} sensors
              </div>
              <div style={{fontSize:11,color:T.textMut,marginTop:2}}>
                Permit: {f.permitId} | Contact: {f.contactName} | Last Inspection: {f.lastInspection}
              </div>
            </div>
            {pill(f.status==='nominal'?T.green:f.status==='alert'?T.amber:T.red,
              f.status==='nominal'?'#dcfce7':f.status==='alert'?'#fef3c7':'#fef2f2',
              f.status.toUpperCase())}
          </div>
          <div style={{display:'flex',gap:12,marginTop:16,flexWrap:'wrap'}}>
            {statBox('Rate',`${f.emissionsRate} t/hr`,'Emissions rate',T.navy)}
            {statBox('Scope 1',f.scope1.toLocaleString(),'tCO2e/yr',T.navy)}
            {statBox('Scope 2',f.scope2.toLocaleString(),'tCO2e/yr',T.navyL)}
            {statBox('Scope 3',f.scope3.toLocaleString(),'tCO2e/yr',T.gold)}
            {statBox('Efficiency',`${f.efficiency}%`,'Operational',T.sage)}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>24-Hour Emissions Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={fHourly}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="hour" tick={{fontSize:10,fill:T.textSec}} interval={3}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
                <Area type="monotone" dataKey="emissions" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="CO2 (t/hr)"/>
                <Area type="monotone" dataKey="methane" stroke={T.amber} fill={T.amber} fillOpacity={0.1} strokeWidth={1.5} name="CH4 (ppm)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Scope Breakdown</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{name:'Scope 1',value:f.scope1},{name:'Scope 2',value:f.scope2},{name:'Scope 3',value:f.scope3}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  <Cell fill={T.navy}/><Cell fill={T.navyL}/><Cell fill={T.gold}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:14}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Sensor Map ({fSensors.length} sensors)</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
            {fSensors.map(s=>(
              <div key={s.id} style={{padding:'10px 12px',borderRadius:8,border:`1px solid ${T.border}`,
                background:s.status==='online'?'#f0fdf4':s.status==='error'?'#fef2f2':
                s.status==='calibrating'?'#fffbeb':T.surfaceH}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:600,fontSize:11,color:T.navy,fontFamily:T.mono}}>{s.id}</span>
                  <span style={{width:8,height:8,borderRadius:'50%',
                    background:s.status==='online'?T.green:s.status==='error'?T.red:
                    s.status==='calibrating'?T.amber:T.textMut}}/>
                </div>
                <div style={{fontSize:11,color:T.textSec,marginTop:3}}>{s.type}</div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:T.mono,marginTop:2}}>
                  {s.reading} {s.unit}
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>
                  Quality: {s.dataQuality}% | {s.manufacturer}
                </div>
                <div style={{fontSize:10,color:T.textMut}}>
                  Threshold: {s.alertThreshold} {s.unit} | FW {s.firmware}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Alert History</div>
          {fAlerts.length>0?fAlerts.map(a=>(
            <div key={a.id} style={{padding:10,borderRadius:6,marginBottom:6,
              border:`1px solid ${a.severity==='critical'?'#fecaca':a.severity==='warning'?'#fde68a':'#e0e7ff'}`,
              background:a.severity==='critical'?'#fef2f2':a.severity==='warning'?'#fffbeb':'#f0f4ff'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:600,fontSize:12,color:T.navy}}>{a.type} - {a.sensorId}</span>
                <span style={{fontSize:11,color:T.textMut}}>{a.timestamp}</span>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginTop:3}}>{a.desc}</div>
              <div style={{fontSize:10,color:T.textMut,marginTop:2}}>
                Duration: {a.duration} | Excess: {a.estExcess} tCO2e | {a.mitigationStatus}
              </div>
            </div>
          )):<div style={{fontSize:12,color:T.textMut,padding:10}}>No recent alerts for this facility</div>}
        </div>
      </div>);
    }

    /* --- facility grid --- */
    return(<div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {selectEl(indFilter,setIndFilter,['All',...INDUSTRIES],150)}
        {selectEl(statusFilter,setStatusFilter,['All','nominal','alert','offline'],120)}
        {selectEl(countryFilter,setCountryFilter,['All',...COUNTRIES],100)}
        <div style={{fontSize:12,color:T.textMut,marginLeft:4}}>
          Showing {filteredFacilities.length} of {facilities.length}
        </div>
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>setCompareMode(!compareMode)}
            style={{padding:'6px 14px',borderRadius:6,
              border:`1px solid ${compareMode?T.navy:T.border}`,
              background:compareMode?T.navy:T.surface,color:compareMode?'#fff':T.text,
              fontSize:12,cursor:'pointer',fontFamily:T.font,fontWeight:600}}>
            {compareMode?`Compare (${compareFacilities.length}/3)`:'Compare Mode'}
          </button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
        {filteredFacilities.map(f=>(
          <div key={f.id}
            onClick={()=>{if(compareMode)toggleCompare(f);else setSelectedFacility(f.id);}}
            style={{background:T.surface,
              border:`1px solid ${compareFacilities.find(c=>c.id===f.id)?T.navy:T.border}`,
              borderRadius:10,padding:14,cursor:'pointer',transition:'all 0.15s',
              boxShadow:compareFacilities.find(c=>c.id===f.id)?`0 0 0 2px ${T.navyL}33`:'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div style={{fontWeight:600,fontSize:13,color:T.navy,lineHeight:'1.3',maxWidth:200}}>{f.name}</div>
              {pill(f.status==='nominal'?T.green:f.status==='alert'?T.amber:T.red,
                f.status==='nominal'?'#dcfce7':f.status==='alert'?'#fef3c7':'#fef2f2',f.status)}
            </div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>{f.industry} | {f.city}, {f.country}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
              <div><div style={{fontSize:10,color:T.textMut}}>Sensors</div>
                <div style={{fontWeight:700,fontSize:13,color:T.navy,fontFamily:T.mono}}>{f.sensorCount}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Rate (t/hr)</div>
                <div style={{fontWeight:700,fontSize:13,color:T.sage,fontFamily:T.mono}}>{f.emissionsRate}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Total (k)</div>
                <div style={{fontWeight:700,fontSize:13,color:T.gold,fontFamily:T.mono}}>
                  {((f.scope1+f.scope2+f.scope3)/1000).toFixed(1)}</div></div>
            </div>
            <div style={{fontSize:10,color:T.textMut,marginTop:6}}>
              Permit: {f.permitId} | Eff: {f.efficiency}%
            </div>
            {compareMode&&<div style={{marginTop:6,textAlign:'center',fontSize:11,fontWeight:600,
              color:compareFacilities.find(c=>c.id===f.id)?T.navy:T.textMut}}>
              {compareFacilities.find(c=>c.id===f.id)?'Selected':'Click to select'}
            </div>}
          </div>
        ))}
      </div>
    </div>);
  };

  /* ======================== TAB 2: SENSOR DASHBOARD ======================== */
  const renderSensorDashboard=()=>{
    const statusCounts={online:0,offline:0,calibrating:0,error:0};
    sensors.forEach(s=>{statusCounts[s.status]=(statusCounts[s.status]||0)+1;});
    const typeCounts={};SENSOR_TYPES.forEach(t=>{typeCounts[t]=sensors.filter(s=>s.type===t).length;});
    const mfrCounts={};sensors.forEach(s=>{mfrCounts[s.manufacturer]=(mfrCounts[s.manufacturer]||0)+1;});
    const mfrData=Object.entries(mfrCounts).map(([m,c])=>({name:m,count:c})).sort((a,b)=>b.count-a.count);

    return(<div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        {statBox('Online',statusCounts.online,`of ${sensors.length} sensors`,T.green)}
        {statBox('Offline',statusCounts.offline,'Requires attention',T.red)}
        {statBox('Calibrating',statusCounts.calibrating,'In progress',T.amber)}
        {statBox('Error',statusCounts.error,'Needs diagnostics',T.red)}
        {statBox('Avg Quality',`${avgQuality}%`,'Data quality score',T.sage)}
      </div>

      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {selectEl(sensorTypeFilter,setSensorTypeFilter,['All',...SENSOR_TYPES],160)}
        {selectEl(sensorStatusFilter,setSensorStatusFilter,['All','online','offline','calibrating','error'],130)}
        <input value={sensorSearch} onChange={e=>setSensorSearch(e.target.value)}
          placeholder="Search sensor ID or facility..."
          style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,
            fontFamily:T.font,color:T.text,background:T.surface,width:200}}/>
        <div style={{fontSize:12,color:T.textMut}}>Showing {filteredSensors.length} sensors</div>
        <button onClick={handleDiag} disabled={diagRunning}
          style={{padding:'6px 16px',borderRadius:6,border:'none',marginLeft:'auto',
            background:diagRunning?T.textMut:T.navy,color:'#fff',fontSize:12,
            cursor:diagRunning?'not-allowed':'pointer',fontFamily:T.font,fontWeight:600,
            position:'relative',overflow:'hidden',minWidth:150}}>
          {diagRunning?<>
            <span style={{position:'absolute',left:0,top:0,height:'100%',width:`${diagProgress}%`,
              background:T.sage,transition:'width 0.2s',borderRadius:6,opacity:0.5}}/>
            <span style={{position:'relative'}}>Diagnosing {diagProgress}%</span>
          </>:'Run Diagnostics'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Sensors by Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SENSOR_TYPES.map(t=>({type:t.length>12?t.slice(0,12)+'..':t,count:typeCounts[t]}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="type" tick={{fontSize:9,fill:T.textSec}} angle={-20} textAnchor="end" height={50}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
              <Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]}>
                {SENSOR_TYPES.map((_,i)=><Cell key={i} fill={[T.navy,T.navyL,T.gold,T.sage,T.teal,T.goldL,T.sageL,'#8b6db5'][i]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Data Quality Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              {range:'70-75%',count:sensors.filter(s=>s.dataQuality<75).length},
              {range:'75-80%',count:sensors.filter(s=>s.dataQuality>=75&&s.dataQuality<80).length},
              {range:'80-85%',count:sensors.filter(s=>s.dataQuality>=80&&s.dataQuality<85).length},
              {range:'85-90%',count:sensors.filter(s=>s.dataQuality>=85&&s.dataQuality<90).length},
              {range:'90-95%',count:sensors.filter(s=>s.dataQuality>=90&&s.dataQuality<95).length},
              {range:'95-100%',count:sensors.filter(s=>s.dataQuality>=95).length},
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="range" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
              <Area type="monotone" dataKey="count" stroke={T.sage} fill={T.sage} fillOpacity={0.2} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Manufacturer Distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={mfrData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={100}/>
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
            <Bar dataKey="count" fill={T.navyL} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {sectionTitle('Calibration Schedule (Due within 14 days)')}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          {tblHeader(['Sensor ID','Type','Facility','Manufacturer','Last Cal','Next Cal','Quality','Status'])}
          <tbody>{filteredSensors.filter(s=>s.nextCalibration<=14).slice(0,15).map(s=>(
            <tr key={s.id} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',
              background:selectedSensor===s.id?T.surfaceH:'transparent'}}
              onClick={()=>setSelectedSensor(selectedSensor===s.id?null:s.id)}>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:600,color:T.navy}}>{s.id}</td>
              <td style={{padding:'8px 12px',color:T.textSec}}>{s.type}</td>
              <td style={{padding:'8px 12px',color:T.textSec,maxWidth:140,overflow:'hidden',
                textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.facilityName}</td>
              <td style={{padding:'8px 12px',color:T.textSec,fontSize:11}}>{s.manufacturer}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{s.lastCalibration}d ago</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:600,
                color:s.nextCalibration<=7?T.red:T.amber}}>{s.nextCalibration}d</td>
              <td style={{padding:'8px 12px'}}>{progressBar(s.dataQuality,
                s.dataQuality>90?T.green:s.dataQuality>80?T.sage:T.amber)}</td>
              <td style={{padding:'8px 12px'}}>{pill(
                s.status==='online'?T.green:s.status==='error'?T.red:T.amber,
                s.status==='online'?'#dcfce7':s.status==='error'?'#fef2f2':'#fffbeb',s.status)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {selectedSensor&&(()=>{
        const s=sensors.find(x=>x.id===selectedSensor);if(!s)return null;
        return(
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontWeight:700,color:T.navy,fontSize:14}}>{s.id} - {s.type} Detail</div>
              <button onClick={()=>setSelectedSensor(null)} style={{padding:'4px 10px',borderRadius:4,
                border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontSize:11}}>Close</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              <div style={{padding:10,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Current Reading</div>
                <div style={{fontWeight:700,color:T.navy,fontFamily:T.mono,fontSize:18}}>{s.reading} {s.unit}</div>
              </div>
              <div style={{padding:10,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Alert Threshold</div>
                <div style={{fontWeight:700,color:s.reading>s.alertThreshold?T.red:T.sage,fontFamily:T.mono,fontSize:18}}>
                  {s.alertThreshold} {s.unit}</div>
              </div>
              <div style={{padding:10,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Uptime</div>
                <div style={{fontWeight:700,color:T.sage,fontFamily:T.mono,fontSize:18}}>{s.uptime}%</div>
              </div>
              <div style={{padding:10,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Firmware</div>
                <div style={{fontWeight:700,color:T.navyL,fontFamily:T.mono,fontSize:18}}>{s.firmware}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:10}}>
              <div style={{fontSize:12,color:T.textSec}}>Manufacturer: <strong style={{color:T.navy}}>{s.manufacturer}</strong></div>
              <div style={{fontSize:12,color:T.textSec}}>Model: <strong style={{color:T.navy}}>{s.model}</strong></div>
              <div style={{fontSize:12,color:T.textSec}}>Installed: <strong style={{color:T.navy}}>{s.installDate}</strong></div>
            </div>
          </div>
        );
      })()}

      {sectionTitle('Real-Time Status Grid')}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(105px,1fr))',gap:5}}>
        {filteredSensors.slice(0,100).map(s=>(
          <div key={s.id} onClick={()=>setSelectedSensor(selectedSensor===s.id?null:s.id)}
            style={{padding:'7px 5px',borderRadius:6,border:`1px solid ${selectedSensor===s.id?T.navy:T.border}`,
              background:s.status==='online'?'#f0fdf4':s.status==='error'?'#fef2f2':
              s.status==='calibrating'?'#fffbeb':T.surfaceH,textAlign:'center',cursor:'pointer'}}>
            <div style={{fontFamily:T.mono,fontWeight:600,color:T.navy,fontSize:9}}>{s.id}</div>
            <div style={{width:6,height:6,borderRadius:'50%',margin:'2px auto',
              background:s.status==='online'?T.green:s.status==='error'?T.red:
              s.status==='calibrating'?T.amber:T.textMut}}/>
            <div style={{color:T.textSec,fontSize:8}}>{s.type.split(' ')[0]}</div>
            <div style={{fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:11}}>{s.reading}</div>
          </div>
        ))}
      </div>
    </div>);
  };

  /* ======================== TAB 3: EMISSIONS ANALYTICS ======================== */
  const renderEmissionsAnalytics=()=>{
    const industryBenchmarks=INDUSTRIES.map((ind,i)=>({
      industry:ind.split(' ')[0],
      avgIntensity:Math.round((sr(i*31)*200+50)*10)/10,
      facilities:facilities.filter(f=>f.industry===ind).length,
      avgEmissions:Math.round(facilities.filter(f=>f.industry===ind)
        .reduce((a,f)=>a+(f.scope1+f.scope2+f.scope3),0)/(facilities.filter(f=>f.industry===ind).length||1)),
    }));
    const forecastData=monthlyHistory.map((m,i)=>({
      ...m,
      forecastLine:i>=9?Math.round(m.emissions*(1+sr(i*41)*0.1-0.05)):null,
      lowerBound:i>=9?Math.round(m.emissions*(0.88+sr(i*43)*0.04)):null,
      upperBound:i>=9?Math.round(m.emissions*(1.08+sr(i*47)*0.06)):null,
    }));
    const rootCauseSummary={};
    anomalies.forEach(a=>{rootCauseSummary[a.rootCause]=(rootCauseSummary[a.rootCause]||0)+1;});
    const rcData=Object.entries(rootCauseSummary).map(([k,v])=>({cause:k,count:v}));

    return(<div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        {statBox('Total Emissions',`${(totalEmissions/1000).toFixed(0)}k`,'tCO2e annual',T.navy)}
        {statBox('Scope 1',`${(facilities.reduce((a,f)=>a+f.scope1,0)/1000).toFixed(0)}k`,'Direct',T.navy)}
        {statBox('Scope 2',`${(facilities.reduce((a,f)=>a+f.scope2,0)/1000).toFixed(0)}k`,'Energy',T.navyL)}
        {statBox('Scope 3',`${(facilities.reduce((a,f)=>a+f.scope3,0)/1000).toFixed(0)}k`,'Value chain',T.gold)}
        {statBox('Anomalies',anomalies.length,`${anomalies.filter(a=>a.severity==='critical').length} critical`,T.red)}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
        {['hourly','daily','monthly'].map(m=>(
          <button key={m} onClick={()=>setAggMode(m)}
            style={{padding:'6px 14px',borderRadius:6,
              border:aggMode===m?`2px solid ${T.navy}`:`1px solid ${T.border}`,
              background:aggMode===m?T.navy:T.surface,color:aggMode===m?'#fff':T.text,
              fontSize:12,cursor:'pointer',fontFamily:T.font,fontWeight:600,textTransform:'capitalize'}}>{m}</button>
        ))}
        <label style={{marginLeft:'auto',fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
          <input type="checkbox" checked={showForecast} onChange={()=>setShowForecast(!showForecast)}/>
          Show Forecast
        </label>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>
            Emissions by Scope ({aggMode})
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="scope1" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Scope 1"/>
              <Area type="monotone" dataKey="scope2" stackId="1" stroke={T.navyL} fill={T.navyL} fillOpacity={0.3} name="Scope 2"/>
              <Area type="monotone" dataKey="scope3" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="Scope 3"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Forecast vs Actual (12-Month)</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="emissions" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Actual"/>
              {showForecast&&<>
                <Line type="monotone" dataKey="forecastLine" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" dot={{r:3}} name="Forecast"/>
                <Line type="monotone" dataKey="upperBound" stroke={T.amber} strokeWidth={1} strokeDasharray="3 3" dot={false} name="Upper Bound"/>
                <Line type="monotone" dataKey="lowerBound" stroke={T.sage} strokeWidth={1} strokeDasharray="3 3" dot={false} name="Lower Bound"/>
              </>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {sectionTitle('Anomaly Detection (>2 Std Dev)')}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          {tblHeader(['Facility','Timestamp','Type','Severity','Value','Baseline','Excess','Duration','Root Cause','Status'])}
          <tbody>{anomalies.map(a=>(
            <tr key={a.id} onClick={()=>setSelectedAnomaly(selectedAnomaly===a.id?null:a.id)}
              style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',
                background:selectedAnomaly===a.id?T.surfaceH:'transparent'}}>
              <td style={{padding:'8px 10px',fontWeight:600,color:T.navy,fontSize:11}}>{a.facility}</td>
              <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.textSec}}>{a.timestamp}</td>
              <td style={{padding:'8px 10px',fontSize:11}}>{a.type}</td>
              <td style={{padding:'8px 10px'}}>{pill(
                a.severity==='critical'?T.red:a.severity==='warning'?T.amber:T.navyL,
                a.severity==='critical'?'#fef2f2':a.severity==='warning'?'#fffbeb':'#f0f4ff',
                a.severity)}</td>
              <td style={{padding:'8px 10px',fontFamily:T.mono,fontWeight:700,color:T.red}}>{a.value}</td>
              <td style={{padding:'8px 10px',fontFamily:T.mono,color:T.textSec}}>{a.baseline}</td>
              <td style={{padding:'8px 10px',fontFamily:T.mono,color:T.amber}}>{a.estExcess}</td>
              <td style={{padding:'8px 10px',fontSize:11,color:T.textSec}}>{a.duration}</td>
              <td style={{padding:'8px 10px'}}>{pill(T.navy,T.surfaceH,a.rootCause)}</td>
              <td style={{padding:'8px 10px'}}>{pill(
                a.mitigationStatus==='Resolved'||a.mitigationStatus==='Sealed'||a.mitigationStatus==='Recalibrated'?T.green:T.amber,
                a.mitigationStatus==='Resolved'||a.mitigationStatus==='Sealed'||a.mitigationStatus==='Recalibrated'?'#dcfce7':'#fffbeb',
                a.mitigationStatus)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {selectedAnomaly!==null&&(()=>{
        const a=anomalies.find(x=>x.id===selectedAnomaly);if(!a)return null;
        return(
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:14,marginBottom:10}}>
              Root Cause Analysis: {a.facility}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:12}}>
              <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Deviation</div>
                <div style={{fontWeight:700,color:T.red,fontFamily:T.mono,fontSize:16}}>
                  +{((a.value/a.baseline-1)*100).toFixed(0)}%
                </div>
                <div style={{fontSize:10,color:T.textSec}}>above 2-sigma</div>
              </div>
              <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Root Cause</div>
                <div style={{fontWeight:700,color:T.navy,fontSize:13}}>{a.rootCause}</div>
                <div style={{fontSize:10,color:T.textSec}}>{a.desc}</div>
              </div>
              <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Excess Emissions</div>
                <div style={{fontWeight:700,color:T.amber,fontFamily:T.mono,fontSize:16}}>{a.estExcess} tCO2e</div>
                <div style={{fontSize:10,color:T.textSec}}>over {a.duration}</div>
              </div>
              <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
                <div style={{fontSize:10,color:T.textMut}}>Carbon Cost</div>
                <div style={{fontWeight:700,color:T.gold,fontFamily:T.mono,fontSize:16}}>
                  ${Math.round(a.estExcess*carbonPrice).toLocaleString()}
                </div>
                <div style={{fontSize:10,color:T.textSec}}>at ${carbonPrice}/tCO2e</div>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:14}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Root Cause Summary</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rcData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="cause" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}} allowDecimals={false}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
                <Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]}>
                  {rcData.map((_,i)=><Cell key={i} fill={[T.red,T.amber,T.navyL,T.sage][i%4]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Industry Intensity Benchmarks</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={industryBenchmarks.filter(b=>b.facilities>0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis dataKey="industry" type="category" tick={{fontSize:10,fill:T.textSec}} width={70}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11}}/>
                <Bar dataKey="avgIntensity" fill={T.navy} radius={[0,4,4,0]} name="tCO2e/GWh"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,color:T.navy,fontSize:13,marginBottom:10}}>Carbon Cost Calculator</div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>
              Carbon Price ($/tCO2e)
            </label>
            <input type="range" min={20} max={200} value={carbonPrice}
              onChange={e=>setCarbonPrice(Number(e.target.value))} style={{width:'100%'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec}}>
              <span>$20</span>
              <span style={{fontWeight:700,color:T.navy,fontSize:14}}>${carbonPrice}</span>
              <span>$200</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>Annual Carbon Cost</div>
              <div style={{fontWeight:700,color:T.navy,fontFamily:T.mono,fontSize:18}}>
                ${(totalEmissions*carbonPrice/1000000).toFixed(1)}M
              </div>
            </div>
            <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>Cost per Facility</div>
              <div style={{fontWeight:700,color:T.gold,fontFamily:T.mono,fontSize:18}}>
                ${Math.round(totalEmissions*carbonPrice/60/1000)}k
              </div>
            </div>
            <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>Monthly Liability</div>
              <div style={{fontWeight:700,color:T.navyL,fontFamily:T.mono,fontSize:18}}>
                ${(totalEmissions*carbonPrice/12/1000000).toFixed(2)}M
              </div>
            </div>
            <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>Projected 2027 (+15%)</div>
              <div style={{fontWeight:700,color:T.red,fontFamily:T.mono,fontSize:18}}>
                ${(totalEmissions*(carbonPrice*1.15)/1000000).toFixed(1)}M
              </div>
            </div>
            <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>Anomaly Excess Cost</div>
              <div style={{fontWeight:700,color:T.amber,fontFamily:T.mono,fontSize:18}}>
                ${Math.round(anomalies.reduce((a,x)=>a+x.estExcess,0)*carbonPrice).toLocaleString()}
              </div>
            </div>
            <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>Avg Intensity</div>
              <div style={{fontWeight:700,color:T.sage,fontFamily:T.mono,fontSize:18}}>
                {Math.round(totalEmissions/60)} t/fac
              </div>
            </div>
          </div>
          <div style={{marginTop:14,padding:12,borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceH}}>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Price Scenario Analysis</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[{label:'Conservative',mult:0.85,color:T.sage},{label:'Base Case',mult:1.0,color:T.navy},{label:'High Carbon',mult:1.35,color:T.red}].map(sc=>(
                <div key={sc.label} style={{textAlign:'center',padding:8,borderRadius:6,background:T.surface}}>
                  <div style={{fontSize:10,color:T.textMut}}>{sc.label}</div>
                  <div style={{fontWeight:700,color:sc.color,fontFamily:T.mono,fontSize:14}}>
                    ${(totalEmissions*carbonPrice*sc.mult/1000000).toFixed(1)}M
                  </div>
                  <div style={{fontSize:9,color:T.textMut}}>${Math.round(carbonPrice*sc.mult)}/t</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>);
  };

  /* ======================== TAB 4: COMPLIANCE & REPORTING ======================== */
  const renderCompliance=()=>{
    const filteredCompliance=complianceItems.filter(c=>regFilter==='All'||c.reg===regFilter);
    const completePct=Math.round(filteredCompliance.filter(c=>c.status==='complete').length/filteredCompliance.length*100);
    return(<div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        {statBox('Verification',`${verificationScore}%`,verificationScore>=80?'Audit ready':'Needs attention',
          verificationScore>=80?T.green:T.amber)}
        {statBox('Complete',complianceItems.filter(c=>c.status==='complete').length,
          `of ${complianceItems.length} items`,T.green)}
        {statBox('In Progress',complianceItems.filter(c=>c.status==='in_progress').length,'Active',T.amber)}
        {statBox('Pending',complianceItems.filter(c=>c.status==='pending').length,'Not started',T.textMut)}
        {statBox('Urgent',deadlines.filter(d=>d.daysLeft<=7).length,'Within 7 days',T.red)}
      </div>

      {sectionTitle('Regulatory Deadline Tracker')}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10,marginBottom:18}}>
        {deadlines.map((d,i)=>(
          <div key={i} style={{background:T.surface,
            border:`1px solid ${d.priority==='critical'?'#fecaca':d.priority==='high'?'#fde68a':T.border}`,
            borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontWeight:600,fontSize:12,color:T.navy}}>{d.reg}</span>
              {pill(d.priority==='critical'?T.red:d.priority==='high'?T.amber:
                d.priority==='medium'?T.navyL:T.textMut,
                d.priority==='critical'?'#fef2f2':d.priority==='high'?'#fffbeb':
                d.priority==='medium'?'#f0f4ff':T.surfaceH,d.priority.toUpperCase())}
            </div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:4}}>{d.task}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:11,color:T.textSec}}>Due: {d.due}</span>
              <span style={{fontFamily:T.mono,fontWeight:700,fontSize:13,
                color:d.daysLeft<=7?T.red:d.daysLeft<=30?T.amber:T.sage}}>{d.daysLeft}d</span>
            </div>
            <div style={{marginTop:8,height:4,borderRadius:2,background:T.border}}>
              <div style={{height:'100%',borderRadius:2,transition:'width 0.3s',
                background:d.daysLeft<=7?T.red:d.daysLeft<=30?T.amber:T.sage,
                width:`${Math.max(5,100-d.daysLeft)}%`}}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
        <div>
          {sectionTitle('Compliance Checklist')}
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            {selectEl(regFilter,setRegFilter,['All','EU ETS MRV','EPA GHGRP','ISO 14064'],150)}
            <div style={{fontSize:12,color:T.textMut,display:'flex',alignItems:'center'}}>
              {filteredCompliance.length} items
            </div>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'10px 16px',background:T.surfaceH,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:600,color:T.navy}}>Progress: {completePct}%</span>
              {progressBar(completePct,completePct>=80?T.green:completePct>=50?T.amber:T.red,120)}
            </div>
            {filteredCompliance.map((c,i)=>(
              <div key={i} style={{padding:'10px 16px',borderBottom:`1px solid ${T.border}`,
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:18,height:18,borderRadius:4,
                    border:`2px solid ${c.status==='complete'?T.green:c.status==='in_progress'?T.amber:T.border}`,
                    background:c.status==='complete'?T.green:'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {c.status==='complete'&&<span style={{color:'#fff',fontSize:11,fontWeight:700}}>&#10003;</span>}
                    {c.status==='in_progress'&&<span style={{color:T.amber,fontSize:9}}>&#9679;</span>}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{c.item}</div>
                    <div style={{fontSize:10,color:T.textMut}}>{c.reg} | Due: {c.due} | {c.owner}</div>
                  </div>
                </div>
                {pill(c.status==='complete'?T.green:c.status==='in_progress'?T.amber:T.textMut,
                  c.status==='complete'?'#dcfce7':c.status==='in_progress'?'#fffbeb':T.surfaceH,
                  c.status==='complete'?'Done':c.status==='in_progress'?'Active':'Pending')}
              </div>
            ))}
          </div>
        </div>

        <div>
          {sectionTitle('Continuous vs Periodic Monitoring')}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'8px 10px',textAlign:'left',fontWeight:600,color:T.navy,fontSize:11}}>Attribute</th>
                <th style={{padding:'8px 10px',textAlign:'center',fontWeight:600,color:T.green,fontSize:11}}>Continuous (CEMS)</th>
                <th style={{padding:'8px 10px',textAlign:'center',fontWeight:600,color:T.amber,fontSize:11}}>Periodic</th>
              </tr></thead>
              <tbody>
                {[
                  ['Accuracy','95-99%','80-90%'],
                  ['Frequency','Real-time','Quarterly'],
                  ['Anomaly Detection','Immediate','Delayed'],
                  ['Regulatory Pref.','Required (EU ETS)','Acceptable (some)'],
                  ['Cost','Higher upfront','Lower initial'],
                  ['Data Granularity','Hourly','Aggregate'],
                  ['Audit Readiness','High','Moderate'],
                  ['Missing Data','<1%','5-15%'],
                ].map(([attr,cont,per],i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'7px 10px',fontWeight:600,color:T.navy,fontSize:11}}>{attr}</td>
                    <td style={{padding:'7px 10px',textAlign:'center',color:T.textSec,fontSize:11}}>{cont}</td>
                    <td style={{padding:'7px 10px',textAlign:'center',color:T.textSec,fontSize:11}}>{per}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sectionTitle('Report Generator')}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>
              Generate compliance reports covering facility emissions data, sensor readings, and regulatory status.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {[
                {label:'EU ETS MRV Report',scope:'42 facilities in EU'},
                {label:'EPA GHGRP Report',scope:'18 facilities in US'},
                {label:'ISO 14064 Inventory',scope:'All 60 facilities global'},
                {label:'Full Compliance Bundle',scope:'All regulations combined'},
              ].map((r,i)=>(
                <div key={i} style={{padding:10,borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceH}}>
                  <div style={{fontWeight:600,fontSize:12,color:T.navy}}>{r.label}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{r.scope}</div>
                </div>
              ))}
            </div>
            <button onClick={handleExport} disabled={reportGen}
              style={{padding:'8px 20px',borderRadius:8,border:'none',
                background:reportGen?T.textMut:T.navy,color:'#fff',fontSize:13,
                cursor:reportGen?'not-allowed':'pointer',fontFamily:T.font,fontWeight:600,width:'100%'}}>
              {reportGen?'Generating Report...':'Generate Compliance Report (CSV)'}
            </button>
          </div>
        </div>
      </div>

      {sectionTitle('Audit Trail')}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          {tblHeader(['Timestamp','Action','Facility','Sensor','User','Status'])}
          <tbody>{auditTrail.map((row,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontSize:11,color:T.textSec}}>{row.ts}</td>
              <td style={{padding:'8px 12px',fontWeight:600,color:T.navy}}>{row.action}</td>
              <td style={{padding:'8px 12px',color:T.textSec}}>{row.fac}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.textSec}}>{row.sensor}</td>
              <td style={{padding:'8px 12px',color:T.textSec}}>{row.user}</td>
              <td style={{padding:'8px 12px'}}>{pill(
                row.status==='verified'||row.status==='complete'||row.status==='passed'?T.green:
                row.status==='exported'||row.status==='applied'?T.navyL:T.amber,
                row.status==='verified'||row.status==='complete'||row.status==='passed'?'#dcfce7':
                row.status==='exported'||row.status==='applied'?'#f0f4ff':'#fffbeb',
                row.status)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {sectionTitle('Verification Readiness Assessment')}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
          {[
            {area:'Monitoring Plan',score:95,status:'Ready'},
            {area:'Data Completeness',score:avgQuality,status:avgQuality>90?'Ready':'Review'},
            {area:'Sensor Calibration',score:82,status:'Review'},
            {area:'QA/QC Procedures',score:91,status:'Ready'},
            {area:'Missing Data Sub.',score:88,status:'Ready'},
            {area:'Uncertainty Analysis',score:76,status:'Attention'},
            {area:'Documentation',score:93,status:'Ready'},
            {area:'Audit Trail',score:97,status:'Ready'},
          ].map((v,i)=>(
            <div key={i} style={{padding:12,borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceH}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{v.area}</span>
                {pill(v.status==='Ready'?T.green:v.status==='Review'?T.amber:T.red,
                  v.status==='Ready'?'#dcfce7':v.status==='Review'?'#fffbeb':'#fef2f2',v.status)}
              </div>
              {progressBar(Math.round(v.score),v.score>=90?T.green:v.score>=80?T.amber:T.red,100)}
            </div>
          ))}
        </div>
      </div>
    </div>);
  };

  /* ======================== TABS + LAYOUT ======================== */
  const tabs=[
    {label:'Facility Network',icon:<span style={{fontSize:14}}>&#9881;</span>},
    {label:'Sensor Dashboard',icon:<span style={{fontSize:14}}>&#9670;</span>},
    {label:'Emissions Analytics',icon:<span style={{fontSize:14}}>&#9651;</span>},
    {label:'Compliance & Reporting',icon:<span style={{fontSize:14}}>&#9744;</span>},
  ];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <span style={{fontSize:11,fontWeight:600,color:T.gold,background:`${T.gold}18`,
            padding:'2px 10px',borderRadius:10}}>EP-AM5</span>
          <span style={{fontSize:11,color:T.textMut}}>IoT & Smart Facility</span>
        </div>
        <h1 style={{margin:0,fontSize:24,fontWeight:800,color:T.navy}}>
          IoT Emissions Tracker & Smart Facility Monitor
        </h1>
        <p style={{margin:'6px 0 0',fontSize:13,color:T.textSec,maxWidth:720}}>
          Real-time IoT sensor data for continuous emissions monitoring and facility-level carbon accounting
          across {facilities.length} facilities and {sensors.length} sensors spanning {INDUSTRIES.length} industries.
        </p>
      </div>

      {/* Global Stats Banner */}
      <div style={{display:'flex',gap:12,marginBottom:18,flexWrap:'wrap'}}>
        {statBox('Facilities',facilities.length,`${alertFacilities} alerts, ${facilities.filter(f=>f.status==='offline').length} offline`,T.navy)}
        {statBox('Sensors Online',`${onlineSensors}/${sensors.length}`,
          `${Math.round(onlineSensors/sensors.length*100)}% uptime`,T.green)}
        {statBox('Sensor Types',SENSOR_TYPES.length,'Monitoring categories',T.sage)}
        {statBox('Total Emissions',`${(totalEmissions/1000).toFixed(0)}k tCO2e`,'Annual aggregate',T.gold)}
        {statBox('Data Quality',`${avgQuality}%`,'Avg across all sensors',T.navyL)}
      </div>

      {/* Tab Bar */}
      <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
        {tabs.map((t,i)=>(
          <TabBtn key={i} active={tab===i} label={t.label} icon={t.icon}
            onClick={()=>{setTab(i);setSelectedFacility(null);setSelectedAnomaly(null);setSelectedSensor(null);}}/>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{minHeight:400}}>
        {tab===0&&renderFacilityNetwork()}
        {tab===1&&renderSensorDashboard()}
        {tab===2&&renderEmissionsAnalytics()}
        {tab===3&&renderCompliance()}
      </div>

      {/* Footer */}
      <div style={{marginTop:28,paddingTop:14,borderTop:`1px solid ${T.border}`,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:11,color:T.textMut}}>
          EP-AM5 IoT Emissions Tracker | {facilities.length} facilities | {sensors.length} sensors | {SENSOR_TYPES.length} types | {INDUSTRIES.length} industries
        </div>
        <div style={{fontSize:11,color:T.textMut}}>
          Last sync: {new Date().toISOString().slice(0,16).replace('T',' ')} UTC
        </div>
      </div>
    </div>
  );
}
