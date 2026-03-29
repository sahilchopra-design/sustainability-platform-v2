import React,{useState,useMemo,useCallback,useRef} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const MODULES=['Heat Mortality','Air Quality','Pandemic-Climate','Health Adaptation','Worker Heat Stress'];
const AUDIENCE_TYPES=['Board / ExCo','Investment Committee','Risk Committee','ESG Team','External Stakeholders'];

const COUNTRY_NAMES=['Bangladesh','India','Nigeria','Kenya','Ethiopia','Brazil','Indonesia','Pakistan','Philippines','Vietnam',
'Egypt','Mexico','DRC','Tanzania','Uganda','Myanmar','Cambodia','Nepal','Ghana','Colombia',
'Peru','Ecuador','Madagascar','Mozambique','Guatemala','Honduras','Bolivia','Laos','Mali','Niger',
'Thailand','Cameroon','Burkina Faso','Senegal','Sri Lanka','Malawi','Rwanda','Zambia','Haiti','Papua New Guinea'];

const ALERT_TYPES=['Heat Mortality Spike','PM2.5 Threshold Breach','Zoonotic Spillover Warning','Adaptation Funding Gap','Worker Heat Incident','Disease Range Expansion',
'UHI Intensity Alert','WBGT Exceedance','Healthcare System Strain','Early Warning Failure','Insurance Claims Surge','AMR Resistance Spike',
'Deforestation Acceleration','Green Bond Opportunity','Pandemic Bond Trigger','Regulatory Deadline','WHO Guideline Update','Shift Schedule Alert','Portfolio Exposure Flag','Engagement Deadline'];

const genKPIs=()=>[
  {id:'heatMortality',label:'Heat Mortality Index',value:Math.floor(sr(701)*100),unit:'/100',trend:+(sr(702)*10-3).toFixed(1),color:T.red,module:'Heat Mortality'},
  {id:'airQuality',label:'Avg PM2.5 (ug/m3)',value:Math.floor(30+sr(703)*80),unit:'ug/m3',trend:+(sr(704)*5-2).toFixed(1),color:T.amber,module:'Air Quality'},
  {id:'pandemicRisk',label:'Pandemic Risk Index',value:Math.floor(sr(705)*100),unit:'/100',trend:+(sr(706)*8-3).toFixed(1),color:T.gold,module:'Pandemic-Climate'},
  {id:'adaptSpend',label:'Adaptation Spend ($B)',value:+(sr(707)*50+5).toFixed(1),unit:'B',trend:+(sr(708)*10+1).toFixed(1),color:T.sage,module:'Health Adaptation'},
  {id:'workerExposure',label:'Workers Exposed (M)',value:+(sr(709)*20+2).toFixed(1),unit:'M',trend:+(sr(710)*5-1).toFixed(1),color:T.red,module:'Worker Heat Stress'},
  {id:'dalys',label:'Total DALYs (M)',value:+(sr(711)*50+10).toFixed(1),unit:'M',trend:+(sr(712)*8-2).toFixed(1),color:T.red,module:'Air Quality'},
  {id:'healthcareCost',label:'Healthcare Cost ($B)',value:+(sr(713)*100+20).toFixed(1),unit:'B',trend:+(sr(714)*12+2).toFixed(1),color:T.amber,module:'Heat Mortality'},
  {id:'uhiIntensity',label:'Avg UHI Intensity (C)',value:+(2+sr(715)*4).toFixed(1),unit:'C',trend:+(sr(716)*1-0.3).toFixed(1),color:T.amber,module:'Heat Mortality'},
  {id:'pm25Avg',label:'Global PM2.5 Avg',value:Math.floor(25+sr(717)*40),unit:'ug/m3',trend:+(sr(718)*4-2).toFixed(1),color:T.red,module:'Air Quality'},
  {id:'ewsCoverage',label:'EWS Coverage',value:Math.floor(30+sr(719)*50),unit:'%',trend:+(sr(720)*8+1).toFixed(1),color:T.gold,module:'Health Adaptation'},
  {id:'healthBonds',label:'Health Bond Issuance ($B)',value:+(sr(721)*30+2).toFixed(1),unit:'B',trend:+(sr(722)*15+3).toFixed(1),color:T.green,module:'Health Adaptation'},
  {id:'oneHealth',label:'One Health Investment ($B)',value:+(sr(723)*20+1).toFixed(1),unit:'B',trend:+(sr(724)*10+2).toFixed(1),color:T.sage,module:'Pandemic-Climate'},
];

const genCountryRisk=(count)=>{
  const countries=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+801);const s2=sr(i*13+803);const s3=sr(i*19+807);const s4=sr(i*23+809);const s5=sr(i*29+811);
    const heatRisk=Math.floor(s1*100);
    const aqRisk=Math.floor(s2*100);
    const pandemicRisk=Math.floor(s3*100);
    const adaptGap=Math.floor(s4*100);
    const workerRisk=Math.floor(s5*100);
    const composite=Math.floor((heatRisk+aqRisk+pandemicRisk+adaptGap+workerRisk)/5);
    const qTrend=QUARTERS.map((_,qi)=>({q:QUARTERS[qi],composite:Math.floor(composite*(0.9+qi*0.015+sr(i*31+qi*7)*0.05))}));
    countries.push({id:i,name:COUNTRY_NAMES[i]||`Country_${i}`,heatRisk,aqRisk,pandemicRisk,adaptGap,workerRisk,composite,qTrend,
      tier:composite>70?'Critical':composite>50?'High':composite>30?'Medium':'Low'});
  }
  return countries;
};

const genAlerts=(count)=>Array.from({length:count},(_,i)=>({
  id:i,type:ALERT_TYPES[i%ALERT_TYPES.length],severity:sr(i*7+901)>0.7?'Critical':sr(i*7+901)>0.4?'High':'Medium',
  module:MODULES[Math.floor(sr(i*13+903)*MODULES.length)],
  country:COUNTRY_NAMES[Math.floor(sr(i*19+905)*COUNTRY_NAMES.length)],
  date:`2025-${String(Math.floor(sr(i*23+907)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(i*29+909)*28)+1).padStart(2,'0')}`,
  detail:`Threshold breach detected: ${Math.floor(sr(i*31+911)*50+10)}% above baseline. Requires ${sr(i*37+913)>0.5?'immediate':'scheduled'} review.`,
  status:sr(i*41+915)>0.6?'Open':sr(i*41+915)>0.3?'In Progress':'Resolved'
}));

const genEngagements=(count)=>Array.from({length:count},(_,i)=>({
  id:i,company:`Company_${i+1}`,country:COUNTRY_NAMES[Math.floor(sr(i*7+951)*COUNTRY_NAMES.length)],
  module:MODULES[Math.floor(sr(i*13+953)*MODULES.length)],
  topic:['Heat worker policy','Air quality disclosure','Pandemic preparedness','Adaptation finance','WBGT compliance','Health impact assessment','Green bond issuance','EWS implementation','AMR strategy','Disease surveillance'][Math.floor(sr(i*19+955)*10)],
  status:['Initiated','In Progress','Escalated','Resolved','Pending Response'][Math.floor(sr(i*23+957)*5)],
  priority:sr(i*29+959)>0.7?'Critical':sr(i*29+959)>0.4?'High':sr(i*29+959)>0.15?'Medium':'Low',
  nextAction:`${['Follow-up call','Board presentation','Site visit','Data request','Letter sent'][Math.floor(sr(i*31+961)*5)]} by ${String(Math.floor(sr(i*37+963)*12)+1).padStart(2,'0')}/2025`,
  daysOpen:Math.floor(sr(i*41+965)*180+5),
  milestones:Math.floor(sr(i*43+967)*8+1)
}));

const KPI_DATA=genKPIs();
const COUNTRY_RISK=genCountryRisk(40);
const ALERTS=genAlerts(20);
const ENGAGEMENTS=genEngagements(40);

const BOARD_SECTIONS=['Executive Summary','Heat Mortality Risk Overview','Air Quality & Health Costs','Pandemic-Climate Nexus','Health Adaptation Finance','Worker Heat Stress Exposure','Engagement Progress','Recommendations & Next Steps'];

const pill=(color,text)=>(<span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>);
const tierColor=(t)=>t==='Critical'?T.red:t==='High'?T.amber:t==='Medium'?T.gold:t==='Low'?T.green:t==='Open'?T.red:t==='In Progress'?T.amber:T.green;
const fmt=(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const card=(s)=>({background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,...s});
const kpiBox=(label,value,sub,color)=>(<div style={card({flex:'1',minWidth:170,textAlign:'center'})}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,margin:'4px 0'}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec}}>{sub}</div>}</div>);
const COLORS=[T.red,T.amber,T.gold,T.sage,T.navy,T.navyL,T.teal,'#9333ea'];

export default function ClimateHealthHubPage(){
  const [tab,setTab]=useState(0);
  const [searchTerm,setSearchTerm]=useState('');
  const [moduleFilter,setModuleFilter]=useState('All');
  const [audienceType,setAudienceType]=useState(0);
  const [selectedCountry,setSelectedCountry]=useState(null);
  const [alertFilter,setAlertFilter]=useState('All');
  const [engStatusFilter,setEngStatusFilter]=useState('All');
  const printRef=useRef(null);

  const TABS=['Executive Dashboard','Country Health-Climate View','Engagement Pipeline','Board Report'];

  const filteredCountries=useMemo(()=>{
    let c=[...COUNTRY_RISK];
    if(searchTerm) c=c.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase()));
    c.sort((a,b)=>b.composite-a.composite);
    return c;
  },[searchTerm]);

  const filteredAlerts=useMemo(()=>{
    let a=[...ALERTS];
    if(alertFilter!=='All') a=a.filter(x=>x.severity===alertFilter);
    if(moduleFilter!=='All') a=a.filter(x=>x.module===moduleFilter);
    return a;
  },[alertFilter,moduleFilter]);

  const filteredEngagements=useMemo(()=>{
    let e=[...ENGAGEMENTS];
    if(engStatusFilter!=='All') e=e.filter(x=>x.status===engStatusFilter);
    if(moduleFilter!=='All') e=e.filter(x=>x.module===moduleFilter);
    return e;
  },[engStatusFilter,moduleFilter]);

  const moduleDistribution=useMemo(()=>MODULES.map(m=>({name:m,alerts:ALERTS.filter(a=>a.module===m).length,engagements:ENGAGEMENTS.filter(e=>e.module===m).length})),[]);

  const handleExportCSV=useCallback((data,filename)=>{
    const headers=Object.keys(data[0]);
    const csv=[headers.join(','),...data.map(row=>headers.map(h=>JSON.stringify(row[h]||'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  },[]);

  const handlePrint=useCallback(()=>{window.print();},[]);

  const thStyle={padding:'8px 10px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'};
  const tdStyle={padding:'8px 10px',fontSize:13,borderBottom:`1px solid ${T.border}`};
  const detail=selectedCountry!==null?COUNTRY_RISK.find(c=>c.id===selectedCountry):null;

  const renderTab0=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {KPI_DATA.slice(0,4).map(k=>(<div key={k.id} style={card({textAlign:'center'})}>
          <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{k.label}</div>
          <div style={{fontSize:26,fontWeight:700,color:k.color,margin:'4px 0'}}>{k.value}{k.unit!=='B'&&k.unit!=='M'?'':''}</div>
          <div style={{fontSize:11,color:k.trend>0?T.red:T.green}}>{k.trend>0?'+':''}{k.trend}% QoQ</div>
        </div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {KPI_DATA.slice(4,8).map(k=>(<div key={k.id} style={card({textAlign:'center'})}>
          <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{k.label}</div>
          <div style={{fontSize:26,fontWeight:700,color:k.color,margin:'4px 0'}}>{k.value}</div>
          <div style={{fontSize:11,color:k.trend>0?T.red:T.green}}>{k.trend>0?'+':''}{k.trend}% QoQ</div>
        </div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {KPI_DATA.slice(8,12).map(k=>(<div key={k.id} style={card({textAlign:'center'})}>
          <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{k.label}</div>
          <div style={{fontSize:26,fontWeight:700,color:k.color,margin:'4px 0'}}>{k.value}</div>
          <div style={{fontSize:11,color:k.trend>0?(k.id.includes('Bond')||k.id.includes('oneHealth')?T.green:T.red):(k.id.includes('Bond')?T.red:T.green)}}>{k.trend>0?'+':''}{k.trend}% QoQ</div>
        </div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sub-Module Activity</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={moduleDistribution} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="alerts" fill={T.red} radius={[4,4,0,0]} name="Alerts"/>
              <Bar dataKey="engagements" fill={T.sage} radius={[4,4,0,0]} name="Engagements"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Alert Severity Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={['Critical','High','Medium'].map(s=>({name:s,value:ALERTS.filter(a=>a.severity===s).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} fontSize={11}>
                <Cell fill={T.red}/><Cell fill={T.amber}/><Cell fill={T.gold}/>
              </Pie>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Active Alerts ({ALERTS.filter(a=>a.status!=='Resolved').length})</div>
          <div style={{display:'flex',gap:4}}>
            {['All','Critical','High','Medium'].map(s=>(<button key={s} onClick={()=>setAlertFilter(s)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${alertFilter===s?T.navy:T.border}`,background:alertFilter===s?T.navy:'transparent',color:alertFilter===s?'#fff':T.text,fontSize:11,cursor:'pointer'}}>{s}</button>))}
          </div>
        </div>
        <div style={{overflowX:'auto',maxHeight:300,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Type</th><th style={thStyle}>Severity</th><th style={thStyle}>Module</th><th style={thStyle}>Country</th><th style={thStyle}>Date</th><th style={thStyle}>Status</th>
            </tr></thead>
            <tbody>{filteredAlerts.map(a=>(<tr key={a.id}>
              <td style={{...tdStyle,fontWeight:600,fontSize:12}}>{a.type}</td>
              <td style={tdStyle}>{pill(tierColor(a.severity),a.severity)}</td>
              <td style={tdStyle}>{a.module}</td><td style={tdStyle}>{a.country}</td>
              <td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{a.date}</td>
              <td style={tdStyle}>{pill(tierColor(a.status),a.status)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Sub-Module Cards</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {MODULES.map((m,mi)=>{const alerts=ALERTS.filter(a=>a.module===m);const eng=ENGAGEMENTS.filter(e=>e.module===m);return(
            <div key={mi} style={{padding:14,borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceH}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>{m}</div>
              <div style={{fontSize:11,color:T.textSec}}>Alerts: <span style={{color:T.red,fontWeight:600}}>{alerts.filter(a=>a.status!=='Resolved').length}</span> open</div>
              <div style={{fontSize:11,color:T.textSec}}>Engagements: <span style={{color:T.sage,fontWeight:600}}>{eng.length}</span></div>
              <div style={{fontSize:11,color:T.textSec}}>Critical: <span style={{color:T.red,fontWeight:600}}>{alerts.filter(a=>a.severity==='Critical').length}</span></div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Countries Tracked',COUNTRY_RISK.length,'Cross-module overlay',T.navy)}
        {kpiBox('Critical Countries',COUNTRY_RISK.filter(c=>c.tier==='Critical').length,'Composite >70',T.red)}
        {kpiBox('Avg Composite Risk',Math.floor(COUNTRY_RISK.reduce((s,c)=>s+c.composite,0)/COUNTRY_RISK.length)+'/100','Mean across modules',T.amber)}
        {kpiBox('High Heat Risk',COUNTRY_RISK.filter(c=>c.heatRisk>70).length,'Heat mortality >70',T.red)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        <input placeholder="Search country..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:160}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Composite Health-Climate Risk by Country</div>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={filteredCountries.slice(0,25).map(c=>({name:c.name,composite:c.composite}))} layout="vertical" margin={{left:90,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={85}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="composite" radius={[0,4,4,0]} name="Composite Risk">
                {filteredCountries.slice(0,25).map((c,i)=>(<Cell key={i} fill={tierColor(c.tier)}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Risk Dimension Radar (Top 8 Countries)</div>
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart data={['Heat','Air Quality','Pandemic','Adapt Gap','Worker'].map((d,di)=>({dim:d,...Object.fromEntries(filteredCountries.slice(0,8).map(c=>[c.name,[c.heatRisk,c.aqRisk,c.pandemicRisk,c.adaptGap,c.workerRisk][di]]))}))}>
              <PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
              {filteredCountries.slice(0,8).map((c,i)=><Radar key={i} name={c.name} dataKey={c.name} stroke={COLORS[i%COLORS.length]} fill={COLORS[i%COLORS.length]+'15'} strokeWidth={1.5}/>)}
              <Legend wrapperStyle={{fontSize:9}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Composite Risk Trend (Global Average, 12Q)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={QUARTERS.map((q,qi)=>({q,avg:Math.floor(COUNTRY_RISK.reduce((s,c)=>s+c.qTrend[qi].composite,0)/COUNTRY_RISK.length)}))} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Area type="monotone" dataKey="avg" stroke={T.red} fill={T.red+'20'} strokeWidth={2} name="Avg Composite Risk"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country Health-Climate Risk Table</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle}>Country</th><th style={thStyle}>Heat</th><th style={thStyle}>Air Q</th><th style={thStyle}>Pandemic</th><th style={thStyle}>Adapt Gap</th><th style={thStyle}>Worker</th><th style={thStyle}>Composite</th><th style={thStyle}>Tier</th>
            </tr></thead>
            <tbody>{filteredCountries.map((c,i)=>(<tr key={c.id} onClick={()=>setSelectedCountry(c.id)} style={{cursor:'pointer',background:selectedCountry===c.id?T.surfaceH:'transparent'}}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              <td style={{...tdStyle,color:c.heatRisk>70?T.red:T.text}}>{c.heatRisk}</td>
              <td style={{...tdStyle,color:c.aqRisk>70?T.red:T.text}}>{c.aqRisk}</td>
              <td style={{...tdStyle,color:c.pandemicRisk>70?T.red:T.text}}>{c.pandemicRisk}</td>
              <td style={{...tdStyle,color:c.adaptGap>70?T.red:T.text}}>{c.adaptGap}</td>
              <td style={{...tdStyle,color:c.workerRisk>70?T.red:T.text}}>{c.workerRisk}</td>
              <td style={{...tdStyle,fontWeight:700,color:c.composite>70?T.red:c.composite>50?T.amber:T.text}}>{c.composite}</td>
              <td style={tdStyle}>{pill(tierColor(c.tier),c.tier)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
      {detail&&(<div style={card({marginTop:16})}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:16,fontWeight:700,color:T.navy}}>{detail.name}</span>
          <button onClick={()=>setSelectedCountry(null)} style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${T.border}`,background:'transparent',cursor:'pointer',fontSize:12}}>Close</button>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={detail.qTrend} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Line type="monotone" dataKey="composite" stroke={T.red} strokeWidth={2} name="Composite Risk"/>
          </LineChart>
        </ResponsiveContainer>
      </div>)}
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Active Engagements',ENGAGEMENTS.filter(e=>e.status!=='Resolved').length,'In pipeline',T.navy)}
        {kpiBox('Critical Priority',ENGAGEMENTS.filter(e=>e.priority==='Critical').length,'Immediate action',T.red)}
        {kpiBox('Avg Days Open',Math.floor(ENGAGEMENTS.reduce((s,e)=>s+e.daysOpen,0)/ENGAGEMENTS.length),'Mean engagement age',T.amber)}
        {kpiBox('Resolved',ENGAGEMENTS.filter(e=>e.status==='Resolved').length,'Completed engagements',T.green)}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <select value={engStatusFilter} onChange={e=>setEngStatusFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Statuses</option>
          {['Initiated','In Progress','Escalated','Resolved','Pending Response'].map(s=>(<option key={s} value={s}>{s}</option>))}
        </select>
        <select value={moduleFilter} onChange={e=>setModuleFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Modules</option>
          {MODULES.map(m=>(<option key={m} value={m}>{m}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Engagement by Module & Priority</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MODULES.map(m=>({module:m,critical:ENGAGEMENTS.filter(e=>e.module===m&&e.priority==='Critical').length,high:ENGAGEMENTS.filter(e=>e.module===m&&e.priority==='High').length,medium:ENGAGEMENTS.filter(e=>e.module===m&&e.priority==='Medium').length}))} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="module" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="critical" fill={T.red} radius={[4,4,0,0]} name="Critical" stackId="a"/>
              <Bar dataKey="high" fill={T.amber} radius={[4,4,0,0]} name="High" stackId="a"/>
              <Bar dataKey="medium" fill={T.gold} radius={[4,4,0,0]} name="Medium" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Status Pipeline</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={['Initiated','In Progress','Escalated','Resolved','Pending Response'].map(s=>({name:s,value:ENGAGEMENTS.filter(e=>e.status===s).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} fontSize={10}>
                {['Initiated','In Progress','Escalated','Resolved','Pending Response'].map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}
              </Pie>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Engagement CRM ({filteredEngagements.length})</div>
          <button onClick={()=>handleExportCSV(filteredEngagements,'engagements.csv')} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surfaceH,cursor:'pointer',fontSize:12,fontFamily:T.mono}}>Export CSV</button>
        </div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle}>Company</th><th style={thStyle}>Module</th><th style={thStyle}>Topic</th><th style={thStyle}>Status</th><th style={thStyle}>Priority</th><th style={thStyle}>Days Open</th><th style={thStyle}>Next Action</th>
            </tr></thead>
            <tbody>{filteredEngagements.map((e,i)=>(<tr key={e.id}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600}}>{e.company}</td>
              <td style={tdStyle}>{e.module}</td><td style={{...tdStyle,fontSize:12}}>{e.topic}</td>
              <td style={tdStyle}>{pill(tierColor(e.status==='Resolved'?'Low':e.status==='Escalated'?'Critical':'Medium'),e.status)}</td>
              <td style={tdStyle}>{pill(tierColor(e.priority),e.priority)}</td>
              <td style={tdStyle}>{e.daysOpen}</td>
              <td style={{...tdStyle,fontSize:11}}>{e.nextAction}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div ref={printRef}>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Audience:</div>
        {AUDIENCE_TYPES.map((a,i)=>(<button key={i} onClick={()=>setAudienceType(i)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${audienceType===i?T.navy:T.border}`,background:audienceType===i?T.navy:'transparent',color:audienceType===i?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>{a}</button>))}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button onClick={()=>handleExportCSV(COUNTRY_RISK.map(c=>({country:c.name,heatRisk:c.heatRisk,aqRisk:c.aqRisk,pandemicRisk:c.pandemicRisk,adaptGap:c.adaptGap,workerRisk:c.workerRisk,composite:c.composite})),'board_report_data.csv')} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surfaceH,cursor:'pointer',fontSize:12,fontFamily:T.mono}}>Export CSV</button>
          <button onClick={handlePrint} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${T.navy}`,background:T.navy,color:'#fff',cursor:'pointer',fontSize:12,fontFamily:T.mono}}>Print Report</button>
        </div>
      </div>
      <div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:24,marginBottom:20}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Climate & Health Nexus Board Report</h2>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0'}}>Prepared for: {AUDIENCE_TYPES[audienceType]} | Date: {new Date().toISOString().split('T')[0]}</p>
          <div style={{width:60,height:3,background:T.gold,margin:'12px auto'}}/>
        </div>
        {BOARD_SECTIONS.map((section,si)=>(<div key={si} style={{marginBottom:20,paddingBottom:16,borderBottom:si<BOARD_SECTIONS.length-1?`1px solid ${T.border}`:'none'}}>
          <h3 style={{fontSize:15,fontWeight:700,color:T.navy,margin:'0 0 8px',fontFamily:T.mono}}>{si+1}. {section}</h3>
          {si===0&&(<div>
            <p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>This report synthesizes climate-health risk intelligence across {COUNTRY_RISK.length} countries, covering heat mortality, air quality, pandemic preparedness, health adaptation finance, and worker heat stress. {COUNTRY_RISK.filter(c=>c.tier==='Critical').length} countries are in critical risk tier. Total healthcare cost exposure is estimated at ${KPI_DATA.find(k=>k.id==='healthcareCost')?.value}B with {ALERTS.filter(a=>a.status==='Open').length} open alerts requiring attention.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:12}}>
              {KPI_DATA.slice(0,4).map(k=>(<div key={k.id} style={{padding:8,borderRadius:6,background:T.surfaceH,textAlign:'center'}}>
                <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.label}</div>
                <div style={{fontSize:18,fontWeight:700,color:k.color}}>{k.value}</div>
              </div>))}
            </div>
          </div>)}
          {si===1&&(<div>
            <p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>{COUNTRY_RISK.filter(c=>c.heatRisk>70).length} countries show critical heat mortality risk. Wet-bulb temperature thresholds are being regularly breached in South Asia and Middle East regions.</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COUNTRY_RISK.sort((a,b)=>b.heatRisk-a.heatRisk).slice(0,10).map(c=>({name:c.name,risk:c.heatRisk}))} margin={{top:5,right:20,bottom:5,left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Bar dataKey="risk" fill={T.red} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>)}
          {si===2&&(<p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>Global average PM2.5 stands at {KPI_DATA.find(k=>k.id==='pm25Avg')?.value} ug/m3, well above WHO guideline of 15 ug/m3. Total health externalities from air pollution estimated at ${KPI_DATA.find(k=>k.id==='dalys')?.value}M DALYs annually. {COUNTRY_RISK.filter(c=>c.aqRisk>70).length} countries in severe air quality category.</p>)}
          {si===3&&(<p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>Pandemic-climate nexus risk elevated with {COUNTRY_RISK.filter(c=>c.pandemicRisk>70).length} countries showing critical zoonotic spillover risk. One Health investment at ${KPI_DATA.find(k=>k.id==='oneHealth')?.value}B remains below the estimated $25B annual need.</p>)}
          {si===4&&(<p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>Adaptation spending at ${KPI_DATA.find(k=>k.id==='adaptSpend')?.value}B, representing approximately 30% of climate finance. Health bond issuance reached ${KPI_DATA.find(k=>k.id==='healthBonds')?.value}B. Early warning system coverage at {KPI_DATA.find(k=>k.id==='ewsCoverage')?.value}% globally.</p>)}
          {si===5&&(<p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>{KPI_DATA.find(k=>k.id==='workerExposure')?.value}M workers exposed to dangerous heat levels. {COUNTRY_RISK.filter(c=>c.workerRisk>70).length} countries have critical worker heat stress. WBGT exceedance incidents increasing at {Math.abs(KPI_DATA.find(k=>k.id==='workerExposure')?.trend||0)}% QoQ.</p>)}
          {si===6&&(<div>
            <p style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>{ENGAGEMENTS.filter(e=>e.status!=='Resolved').length} active engagements across {MODULES.length} modules. {ENGAGEMENTS.filter(e=>e.priority==='Critical').length} critical priority engagements requiring board attention.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginTop:8}}>
              {['Initiated','In Progress','Escalated','Resolved','Pending Response'].map(s=>(<div key={s} style={{padding:6,borderRadius:6,background:T.surfaceH,textAlign:'center'}}>
                <div style={{fontSize:10,color:T.textMut}}>{s}</div>
                <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{ENGAGEMENTS.filter(e=>e.status===s).length}</div>
              </div>))}
            </div>
          </div>)}
          {si===7&&(<div>
            <ol style={{fontSize:13,color:T.textSec,lineHeight:1.8,paddingLeft:20}}>
              <li>Escalate {ALERTS.filter(a=>a.severity==='Critical'&&a.status==='Open').length} critical open alerts to risk committee</li>
              <li>Increase health adaptation allocation to 40% of climate finance</li>
              <li>Mandate WBGT monitoring for all portfolio companies with outdoor workers</li>
              <li>Engage top {Math.min(10,ENGAGEMENTS.filter(e=>e.priority==='Critical').length)} critical-priority companies on heat stress policies</li>
              <li>Review pandemic bond triggers and One Health investment pipeline</li>
              <li>Set PM2.5 reduction targets aligned with WHO 2030 guideline</li>
              <li>Expand early warning system coverage target to 80% by 2027</li>
              <li>Commission independent health-climate risk assessment for next board cycle</li>
            </ol>
          </div>)}
        </div>))}
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Climate & Health Hub</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Unified climate-health intelligence: 12 KPIs, 20 alerts, 40 country risk overlay, engagement CRM & board report</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>))}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        <div style={{marginTop:32,padding:'12px 16px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          EP-AU6 Climate & Health Hub | Sprint AU: Climate & Health Nexus Finance | 12 KPIs, {ALERTS.length} alerts, {COUNTRY_RISK.length} countries, {ENGAGEMENTS.length} engagements, {BOARD_SECTIONS.length} board sections
        </div>
      </div>
    </div>
  );
}