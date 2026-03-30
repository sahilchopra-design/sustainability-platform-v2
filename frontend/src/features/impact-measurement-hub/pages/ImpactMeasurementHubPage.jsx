import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Technology','Healthcare','Financial Services','Energy','Consumer Goods','Industrials','Materials','Utilities','Real Estate','Telecom','Agriculture','Transportation'];
const COMPANY_PREFIXES=['Apex','Nova','Global','Prime','Stellar','Vertex','Zenith','Cascade','Meridian','Horizon','Summit','Pacific','Atlas','Quantum','Vanguard','Pinnacle','Nexus','Frontier','Crest','Forge'];
const COMPANY_SUFFIXES=['Corp','Industries','Holdings','Group','Partners','Capital','Solutions','Technologies','Systems','Dynamics'];
const SDG_NAMES=['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry Innovation','Reduced Inequalities','Sustainable Cities','Responsible Consumption','Climate Action','Life Below Water','Life on Land','Peace Justice','Partnerships'];
const SDG_COLORS=['#E5243B','#DDA63A','#4C9F38','#C5192D','#FF3A21','#26BDE2','#FCC30B','#A21942','#FD6925','#DD1367','#FD9D24','#BF8B2E','#3F7E44','#0A97D9','#56C02B','#00689D','#19486A'];
const QUARTERS=['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const ENGAGEMENT_TYPES=['SDG Alignment Review','Impact Measurement Setup','Theory of Change Workshop','Additionality Assessment','IWA Integration','Board Presentation','Data Quality Audit','Verification Support','Report Generation','Stakeholder Engagement'];
const ENGAGEMENT_STATUSES=['Active','Scheduled','Completed','On Hold'];
const REPORT_SECTIONS=['Executive Summary','Impact KPI Dashboard','SDG Portfolio Coverage','Impact Attribution Analysis','Theory of Change Progress','Impact-Weighted Accounts','Additionality Assessment','Board Recommendations'];

const genHoldings=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*73+1000),s2=sr(i*41+1010),s3=sr(i*59+1020);
    const pIdx=Math.floor(s1*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(s2*COMPANY_SUFFIXES.length);
    const secIdx=Math.floor(s3*SECTORS.length);
    const sdgCoverage=Math.floor(sr(i*31+1030)*8+4);
    const primarySDGs=[];for(let j=0;j<Math.min(sdgCoverage,5);j++){primarySDGs.push(Math.floor(sr(i*17+j*31+1040)*17)+1);}
    const impactScore=Math.round(sr(i*43+1050)*50+35);
    const additionalityScore=Math.round(sr(i*53+1060)*50+30);
    const iwaProfitAdj=Math.round((sr(i*67+1070)*200-80)*10)/10;
    const invested=Math.round((sr(i*71+1080)*50+5)*10)/10;
    const impactPerM=Math.round(sr(i*29+1090)*60+10);
    const co2Avoided=Math.round(sr(i*37+1100)*10000+500);
    const jobsCreated=Math.round(sr(i*41+1110)*500+20);
    const livesImproved=Math.round(sr(i*47+1120)*2000+100);
    out.push({id:i+1,name:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,sector:SECTORS[secIdx],country:['US','GB','DE','JP','FR','CH','AU','CA','SG','NL','KE','IN'][Math.floor(sr(i*19+1130)*12)],invested,sdgCoverage,primarySDGs:[...new Set(primarySDGs)],impactScore,additionalityScore,iwaProfitAdj,impactPerM,co2Avoided,jobsCreated,livesImproved,overallRating:impactScore>=70?'A':impactScore>=55?'B':impactScore>=40?'C':'D',verificationStatus:['Verified','Pending','In Progress','Not Started'][Math.floor(sr(i*61+1140)*4)],tocProgress:Math.round(sr(i*83+1150)*50+40),engagement:sr(i*91+1160)>0.5?'Active':'Inactive'});
  }
  return out;
};

const genAlerts=(count)=>{
  const alertTypes=['SDG gap detected','Impact score decline','Verification expiring','ToC milestone missed','IWA negative externality','Additionality reassessment needed','Data quality issue','Engagement overdue','Report deadline approaching','New SDG opportunity'];
  const severities=['High','Medium','Low'];
  const out=[];
  for(let i=0;i<count;i++){
    const typeIdx=Math.floor(sr(i*73+1200)*alertTypes.length);
    const sevIdx=Math.floor(sr(i*41+1210)*3);
    const pIdx=Math.floor(sr(i*53+1220)*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(sr(i*61+1230)*COMPANY_SUFFIXES.length);
    out.push({id:i+1,type:alertTypes[typeIdx],severity:severities[sevIdx],entity:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,date:`2025-${String(Math.floor(sr(i*37+1240)*3+1)).padStart(2,'0')}-${String(Math.floor(sr(i*29+1250)*28+1)).padStart(2,'0')}`,status:sr(i*43+1260)>0.6?'Open':'Acknowledged',action:['Review required','Schedule meeting','Update data','Submit report','Reassess scoring'][Math.floor(sr(i*67+1270)*5)]});
  }
  return out;
};

const genEngagements=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const typeIdx=Math.floor(sr(i*73+1300)*ENGAGEMENT_TYPES.length);
    const statusIdx=Math.floor(sr(i*41+1310)*ENGAGEMENT_STATUSES.length);
    const pIdx=Math.floor(sr(i*53+1320)*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(sr(i*61+1330)*COMPANY_SUFFIXES.length);
    out.push({id:i+1,type:ENGAGEMENT_TYPES[typeIdx],entity:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,status:ENGAGEMENT_STATUSES[statusIdx],owner:['Sarah Chen','James Wilson','Maria Garcia','David Kim','Anna Petrov'][Math.floor(sr(i*37+1340)*5)],startDate:`2025-${String(Math.floor(sr(i*29+1350)*3+1)).padStart(2,'0')}-${String(Math.floor(sr(i*23+1360)*28+1)).padStart(2,'0')}`,dueDate:`2025-${String(Math.floor(sr(i*19+1370)*6+4)).padStart(2,'0')}-${String(Math.floor(sr(i*17+1380)*28+1)).padStart(2,'0')}`,progress:Math.round(sr(i*67+1390)*80+10),priority:['High','Medium','Low'][Math.floor(sr(i*71+1400)*3)],notes:`${ENGAGEMENT_TYPES[typeIdx]} for ${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`});
  }
  return out;
};

export default function ImpactMeasurementHubPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortKey,setSortKey]=useState('impactScore');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedHolding,setSelectedHolding]=useState(null);
  const [alertFilter,setAlertFilter]=useState('All');
  const [engagementFilter,setEngagementFilter]=useState('All');
  const [reportAudience,setReportAudience]=useState('board');
  const [reportSections,setReportSections]=useState(REPORT_SECTIONS.map(s=>({name:s,enabled:true})));

  const holdings=useMemo(()=>genHoldings(120),[]);
  const alerts=useMemo(()=>genAlerts(20),[]);
  const engagements=useMemo(()=>genEngagements(40),[]);

  const filtered=useMemo(()=>{
    let f=holdings.filter(h=>h.name.toLowerCase().includes(search.toLowerCase())||h.sector.toLowerCase().includes(search.toLowerCase()));
    f.sort((a,b)=>sortDir==='desc'?(b[sortKey]||0)-(a[sortKey]||0):(a[sortKey]||0)-(b[sortKey]||0));
    return f;
  },[holdings,search,sortKey,sortDir]);

  const filteredAlerts=useMemo(()=>{
    if(alertFilter==='All')return alerts;
    return alerts.filter(a=>a.severity===alertFilter);
  },[alerts,alertFilter]);

  const filteredEngagements=useMemo(()=>{
    if(engagementFilter==='All')return engagements;
    return engagements.filter(e=>e.status===engagementFilter);
  },[engagements,engagementFilter]);

  const toggleSort=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const exportCSV=(data,filename)=>{
    if(!data||!data.length)return;
    const keys=Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const tabs=['Executive Dashboard','Portfolio Impact View','Engagement Pipeline','Board Report'];
  const st={page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},header:{marginBottom:'24px'},title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0},subtitle:{fontSize:'14px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},tabBar:{display:'flex',gap:'4px',marginBottom:'20px',borderBottom:`2px solid ${T.border}`},tabBtn:(a)=>({padding:'10px 20px',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,fontSize:'13px',fontWeight:a?600:400}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'20px',marginBottom:'16px'},searchBar:{padding:'10px 16px',border:`1px solid ${T.border}`,borderRadius:'6px',width:'280px',fontFamily:T.font,fontSize:'13px',background:T.surface,outline:'none'},table:{width:'100%',borderCollapse:'collapse',fontSize:'12px',fontFamily:T.mono},th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,cursor:'pointer',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'},td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`},badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:c+'20',color:c}),panel:{position:'fixed',top:0,right:0,width:'560px',height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:'24px',overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},btn:(v)=>({padding:'8px 16px',borderRadius:'6px',border:v==='outline'?`1px solid ${T.border}`:'none',background:v==='primary'?T.navy:v==='outline'?'transparent':T.surfaceH,color:v==='primary'?'#fff':T.text,cursor:'pointer',fontFamily:T.font,fontSize:'12px',fontWeight:500}),sdgDot:(c)=>({display:'inline-block',width:'20px',height:'20px',borderRadius:'4px',background:c,color:'#fff',fontSize:'9px',fontWeight:700,textAlign:'center',lineHeight:'20px',marginRight:'2px'})};

  const kpis=useMemo(()=>{
    const totInvested=Math.round(holdings.reduce((a,h)=>a+h.invested,0));
    const avgImpact=Math.round(holdings.reduce((a,h)=>a+h.impactScore,0)/holdings.length);
    const sdgsCovered=[...new Set(holdings.flatMap(h=>h.primarySDGs))].length;
    const avgAdditionality=Math.round(holdings.reduce((a,h)=>a+h.additionalityScore,0)/holdings.length);
    const totIWAdj=Math.round(holdings.reduce((a,h)=>a+h.iwaProfitAdj,0));
    const verified=holdings.filter(h=>h.verificationStatus==='Verified').length;
    const totCO2=holdings.reduce((a,h)=>a+h.co2Avoided,0);
    const totJobs=holdings.reduce((a,h)=>a+h.jobsCreated,0);
    const totLives=holdings.reduce((a,h)=>a+h.livesImproved,0);
    const avgToC=Math.round(holdings.reduce((a,h)=>a+h.tocProgress,0)/holdings.length);
    const activeEng=engagements.filter(e=>e.status==='Active').length;
    const openAlerts=alerts.filter(a=>a.status==='Open').length;
    return[
      {label:'Total Invested',value:`$${totInvested}M`,color:T.navy},
      {label:'Avg Impact Score',value:`${avgImpact}/100`,color:T.sage},
      {label:'SDGs Covered',value:`${sdgsCovered}/17`,color:T.gold},
      {label:'Avg Additionality',value:`${avgAdditionality}/100`,color:T.navyL},
      {label:'IWA Profit Adj',value:`$${totIWAdj}M`,color:totIWAdj>=0?T.green:T.red},
      {label:'Verified Holdings',value:`${verified}/${holdings.length}`,color:T.green},
      {label:'CO2 Avoided',value:`${(totCO2/1000).toFixed(0)}k tCO2e`,color:T.sage},
      {label:'Jobs Created',value:totJobs.toLocaleString(),color:T.navy},
      {label:'Lives Improved',value:totLives.toLocaleString(),color:T.green},
      {label:'Avg ToC Progress',value:`${avgToC}%`,color:T.gold},
      {label:'Active Engagements',value:activeEng,color:T.navyL},
      {label:'Open Alerts',value:openAlerts,color:openAlerts>5?T.red:T.amber}
    ];
  },[holdings,engagements,alerts]);

  const renderTab0=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'}}>
        {kpis.slice(0,6).map((k,i)=>(
          <div key={i} style={{...st.card,textAlign:'center',borderTop:`3px solid ${k.color}`}}>
            <div style={{fontSize:'24px',fontWeight:700,color:T.navy}}>{k.value}</div>
            <div style={{fontSize:'10px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'}}>
        {kpis.slice(6).map((k,i)=>(
          <div key={i} style={{...st.card,textAlign:'center',borderTop:`3px solid ${k.color}`}}>
            <div style={{fontSize:'24px',fontWeight:700,color:T.navy}}>{k.value}</div>
            <div style={{fontSize:'10px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
        <div style={st.card}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Impact Score by Sector</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={SECTORS.map(s=>{const sc=holdings.filter(h=>h.sector===s);return{sector:s,avg:sc.length?Math.round(sc.reduce((a,h)=>a+h.impactScore,0)/sc.length):0};})} margin={{top:10,right:10,left:10,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}}/>
              <YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
              <Bar dataKey="avg" name="Avg Impact Score" fill={T.sage} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={st.card}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>SDG Coverage Distribution</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={SDG_NAMES.map((n,gi)=>({name:`SDG ${gi+1}`,value:holdings.filter(h=>h.primarySDGs.includes(gi+1)).length})).filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>percent>0.05?`${name.split(' ').pop()} ${(percent*100).toFixed(0)}%`:''}>
                {SDG_NAMES.map((n,i)=>(<Cell key={i} fill={SDG_COLORS[i]}/>))}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={st.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <h4 style={{margin:0,fontSize:'14px',color:T.navy}}>Recent Alerts ({filteredAlerts.length})</h4>
          <select style={{...st.searchBar,width:'140px'}} value={alertFilter} onChange={e=>setAlertFilter(e.target.value)}>
            <option value="All">All Severity</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </div>
        <table style={st.table}>
          <thead><tr><th style={st.th}>Alert</th><th style={st.th}>Entity</th><th style={st.th}>Severity</th><th style={st.th}>Date</th><th style={st.th}>Status</th><th style={st.th}>Action</th></tr></thead>
          <tbody>{filteredAlerts.slice(0,10).map(a=>(
            <tr key={a.id}><td style={{...st.td,fontWeight:500}}>{a.type}</td><td style={st.td}>{a.entity}</td>
            <td style={st.td}><span style={st.badge(a.severity==='High'?T.red:a.severity==='Medium'?T.amber:T.green)}>{a.severity}</span></td>
            <td style={st.td}>{a.date}</td>
            <td style={st.td}><span style={st.badge(a.status==='Open'?T.red:T.green)}>{a.status}</span></td>
            <td style={st.td}>{a.action}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search holdings..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'160px'}} value={sortKey} onChange={e=>setSortKey(e.target.value)}>
            <option value="impactScore">Impact Score</option><option value="additionalityScore">Additionality</option><option value="sdgCoverage">SDG Coverage</option><option value="iwaProfitAdj">IWA Adj</option><option value="impactPerM">Impact/M</option><option value="invested">Invested</option>
          </select>
          <button style={st.btn('outline')} onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}>{sortDir==='desc'?'Desc':'Asc'}</button>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(h=>({Name:h.name,Sector:h.sector,Country:h.country,Invested:h.invested,ImpactScore:h.impactScore,Additionality:h.additionalityScore,SDGs:h.sdgCoverage,IWAAdj:h.iwaProfitAdj,CO2:h.co2Avoided,Jobs:h.jobsCreated,Rating:h.overallRating,Verification:h.verificationStatus})),'portfolio_impact.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{fontSize:'12px',color:T.textMut,marginBottom:'8px',fontFamily:T.mono}}>{filtered.length} holdings</div>
      <div style={{overflowX:'auto'}}>
        <table style={st.table}>
          <thead><tr>
            <th style={st.th} onClick={()=>toggleSort('name')}>Holding</th>
            <th style={st.th}>Sector</th>
            <th style={st.th} onClick={()=>toggleSort('impactScore')}>Impact</th>
            <th style={st.th} onClick={()=>toggleSort('additionalityScore')}>Additionality</th>
            <th style={st.th} onClick={()=>toggleSort('sdgCoverage')}>SDGs</th>
            <th style={st.th} onClick={()=>toggleSort('iwaProfitAdj')}>IWA Adj $M</th>
            <th style={st.th} onClick={()=>toggleSort('co2Avoided')}>CO2 Avoided</th>
            <th style={st.th} onClick={()=>toggleSort('tocProgress')}>ToC %</th>
            <th style={st.th}>Rating</th>
            <th style={st.th}>Verified</th>
          </tr></thead>
          <tbody>{filtered.slice(0,60).map(h=>(
            <tr key={h.id} style={{cursor:'pointer',background:selectedHolding?.id===h.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedHolding(h)}>
              <td style={{...st.td,fontWeight:600,color:T.navy}}>{h.name}</td>
              <td style={st.td}>{h.sector}</td>
              <td style={st.td}><span style={st.badge(h.impactScore>=70?T.green:h.impactScore>=50?T.amber:T.red)}>{h.impactScore}</span></td>
              <td style={st.td}><span style={st.badge(h.additionalityScore>=60?T.green:h.additionalityScore>=40?T.amber:T.red)}>{h.additionalityScore}</span></td>
              <td style={st.td}>{h.primarySDGs.slice(0,3).map(g=>(<span key={g} style={st.sdgDot(SDG_COLORS[g-1])}>{g}</span>))}</td>
              <td style={st.td}><span style={{color:h.iwaProfitAdj>=0?T.green:T.red}}>{h.iwaProfitAdj}</span></td>
              <td style={st.td}>{h.co2Avoided.toLocaleString()}</td>
              <td style={st.td}>{h.tocProgress}%</td>
              <td style={st.td}><span style={st.badge(h.overallRating==='A'?T.green:h.overallRating==='B'?T.gold:T.red)}>{h.overallRating}</span></td>
              <td style={st.td}><span style={st.badge(h.verificationStatus==='Verified'?T.green:h.verificationStatus==='In Progress'?T.amber:T.red)}>{h.verificationStatus.charAt(0)}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {selectedHolding&&(<><div style={st.overlay} onClick={()=>setSelectedHolding(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <div><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedHolding.name}</h3><div style={{fontSize:'12px',color:T.textSec,marginTop:'4px'}}>{selectedHolding.sector} | {selectedHolding.country} | ${selectedHolding.invested}M</div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedHolding(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[{l:'Impact Score',v:selectedHolding.impactScore},{l:'Additionality',v:selectedHolding.additionalityScore},{l:'ToC Progress',v:`${selectedHolding.tocProgress}%`},{l:'IWA Adj',v:`$${selectedHolding.iwaProfitAdj}M`},{l:'CO2 Avoided',v:selectedHolding.co2Avoided.toLocaleString()},{l:'Jobs Created',v:selectedHolding.jobsCreated.toLocaleString()}].map((k,i)=>(
            <div key={i} style={{...st.card,textAlign:'center',padding:'12px'}}><div style={{fontSize:'20px',fontWeight:700,color:T.navy}}>{k.v}</div><div style={{fontSize:'10px',color:T.textMut}}>{k.l}</div></div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>Impact Profile</h4>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={[{dim:'Impact',score:selectedHolding.impactScore},{dim:'Additionality',score:selectedHolding.additionalityScore},{dim:'SDG Coverage',score:selectedHolding.sdgCoverage*6},{dim:'ToC Progress',score:selectedHolding.tocProgress},{dim:'Verification',score:selectedHolding.verificationStatus==='Verified'?90:selectedHolding.verificationStatus==='In Progress'?50:20}]}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/>
            <Radar name="Profile" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
          </RadarChart>
        </ResponsiveContainer>
        <h4 style={{fontSize:'14px',color:T.navy,margin:'12px 0 8px'}}>SDGs</h4>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>{selectedHolding.primarySDGs.map(g=>(<div key={g} style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 10px',background:SDG_COLORS[g-1]+'20',borderRadius:'6px'}}><span style={st.sdgDot(SDG_COLORS[g-1])}>{g}</span><span style={{fontSize:'11px'}}>{SDG_NAMES[g-1]}</span></div>))}</div>
      </div></>)}
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>Impact Engagement Pipeline</h3>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'160px'}} value={engagementFilter} onChange={e=>setEngagementFilter(e.target.value)}>
            <option value="All">All Statuses</option>{ENGAGEMENT_STATUSES.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filteredEngagements.map(e=>({Type:e.type,Entity:e.entity,Status:e.status,Owner:e.owner,Start:e.startDate,Due:e.dueDate,Progress:e.progress,Priority:e.priority})),'engagements.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
        {ENGAGEMENT_STATUSES.map(s=>{const count=engagements.filter(e=>e.status===s).length;return(
          <div key={s} style={{...st.card,textAlign:'center',cursor:'pointer',background:engagementFilter===s?T.surfaceH:T.surface}} onClick={()=>setEngagementFilter(s===engagementFilter?'All':s)}>
            <div style={{fontSize:'28px',fontWeight:700,color:T.navy}}>{count}</div>
            <div style={{fontSize:'12px',color:T.textMut}}>{s}</div>
          </div>
        );})}
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Engagement by Type</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ENGAGEMENT_TYPES.map(t=>({type:t.split(' ').slice(0,2).join(' '),count:engagements.filter(e=>e.type===t).length}))} layout="vertical" margin={{left:120,right:30}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis dataKey="type" type="category" tick={{fontSize:10,fill:T.textSec}} width={110}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Bar dataKey="count" name="Count" fill={T.navy} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table style={st.table}>
        <thead><tr><th style={st.th}>Type</th><th style={st.th}>Entity</th><th style={st.th}>Owner</th><th style={st.th}>Status</th><th style={st.th}>Priority</th><th style={st.th}>Start</th><th style={st.th}>Due</th><th style={st.th}>Progress</th></tr></thead>
        <tbody>{filteredEngagements.map(e=>(
          <tr key={e.id}><td style={{...st.td,fontWeight:500}}>{e.type}</td><td style={st.td}>{e.entity}</td><td style={st.td}>{e.owner}</td>
          <td style={st.td}><span style={st.badge(e.status==='Active'?T.green:e.status==='Completed'?T.navy:e.status==='Scheduled'?T.gold:T.red)}>{e.status}</span></td>
          <td style={st.td}><span style={st.badge(e.priority==='High'?T.red:e.priority==='Medium'?T.amber:T.green)}>{e.priority}</span></td>
          <td style={st.td}>{e.startDate}</td><td style={st.td}>{e.dueDate}</td>
          <td style={st.td}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'60px',height:'6px',background:T.border,borderRadius:'3px',overflow:'hidden'}}><div style={{width:`${e.progress}%`,height:'100%',background:e.progress>=70?T.green:T.amber,borderRadius:'3px'}}/></div><span style={{fontSize:'10px'}}>{e.progress}%</span></div></td></tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'20px'}}>
        <div>
          <div style={st.card}>
            <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Report Configuration</h4>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginBottom:'6px'}}>TARGET AUDIENCE</div>
              {['board','investors','regulators','management'].map(a=>(
                <label key={a} style={{display:'block',padding:'6px 0',fontSize:'13px',cursor:'pointer'}}>
                  <input type="radio" name="audience" checked={reportAudience===a} onChange={()=>setReportAudience(a)} style={{marginRight:'8px'}}/>{a.charAt(0).toUpperCase()+a.slice(1)}
                </label>
              ))}
            </div>
            <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginBottom:'6px'}}>SECTIONS</div>
            {reportSections.map((s,i)=>(
              <label key={i} style={{display:'flex',alignItems:'center',padding:'5px 0',fontSize:'12px',cursor:'pointer',gap:'8px'}}>
                <input type="checkbox" checked={s.enabled} onChange={()=>{const n=[...reportSections];n[i]={...n[i],enabled:!n[i].enabled};setReportSections(n);}}/>
                {s.name}
              </label>
            ))}
            <div style={{marginTop:'16px'}}>
              <button style={st.btn('primary')} onClick={()=>exportCSV(holdings.map(h=>({Name:h.name,Sector:h.sector,Invested:h.invested,ImpactScore:h.impactScore,Additionality:h.additionalityScore,SDGs:h.sdgCoverage,IWAAdj:h.iwaProfitAdj,CO2:h.co2Avoided,Jobs:h.jobsCreated,Lives:h.livesImproved,Rating:h.overallRating,ToC:h.tocProgress,Verification:h.verificationStatus})),'board_report_data.csv')}>Generate Report</button>
            </div>
          </div>
          <div style={{...st.card,background:T.surfaceH}}>
            <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginBottom:'8px'}}>FRAMEWORK ALIGNMENT</div>
            {['GIIN IRIS+','IMP Five Dimensions','OPIM Convergence','Harvard IWAI','SDG Impact Standards','ISAE 3000'].map((f,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'12px',borderBottom:i<5?`1px solid ${T.border}`:'none'}}>
                <span>{f}</span><span style={st.badge(T.green)}>Aligned</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={st.card}>
            <h4 style={{margin:'0 0 16px',fontSize:'16px',color:T.navy}}>Board Report Preview  — {reportAudience.charAt(0).toUpperCase()+reportAudience.slice(1)}</h4>
            {reportSections.filter(s=>s.enabled).map((s,i)=>(
              <div key={i} style={{marginBottom:'16px',padding:'16px',background:T.surfaceH,borderRadius:'8px',borderLeft:`3px solid ${T.navy}`}}>
                <h5 style={{margin:'0 0 8px',fontSize:'14px',color:T.navy}}>{i+1}. {s.name}</h5>
                <div style={{fontSize:'12px',color:T.textSec,lineHeight:'1.6'}}>
                  {s.name==='Executive Summary'&&`Portfolio of ${holdings.length} holdings across ${SECTORS.length} sectors. Total invested: ${kpis[0].value}. Average impact score: ${kpis[1].value}. ${kpis[2].value} SDGs covered. ${alerts.filter(a=>a.status==='Open').length} open alerts requiring attention.`}
                  {s.name==='Impact KPI Dashboard'&&`12 KPIs tracked: ${kpis.map(k=>`${k.label}: ${k.value}`).join(', ')}.`}
                  {s.name==='SDG Portfolio Coverage'&&`Coverage across ${kpis[2].value} SDGs. Strongest alignment: SDG 7, SDG 8, SDG 13. Gap areas identified in SDG 14, SDG 15.`}
                  {s.name.includes('Attribution')&&`PCAF-adapted methodology. Total CO2 avoided: ${kpis[6].value}. Jobs created: ${kpis[7].value}. Lives improved: ${kpis[8].value}.`}
                  {s.name.includes('Theory')&&`Average ToC progress: ${kpis[9].value}. ${holdings.filter(h=>h.tocProgress>=70).length} holdings above 70% milestone completion.`}
                  {s.name.includes('Weighted')&&`Impact-weighted profit adjustment: ${kpis[4].value}. Environmental externalities monetized across carbon, water, waste, and biodiversity dimensions.`}
                  {s.name.includes('Additionality')&&`Average additionality: ${kpis[3].value}. ${holdings.filter(h=>h.additionalityScore>=60).length} holdings demonstrate strong additionality across financial, strategic, policy, and capacity dimensions.`}
                  {s.name.includes('Recommendations')&&`${alerts.filter(a=>a.severity==='High'&&a.status==='Open').length} high-priority items. ${engagements.filter(e=>e.status==='Active').length} active engagements in progress. Focus areas: SDG gap closure, verification completion, ToC milestone achievement.`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={st.page}>
      <div style={st.header}><h1 style={st.title}>Impact Measurement Hub</h1><div style={st.subtitle}>EP-AW6 | Unified hub | 120 holdings | 12 KPIs | 20 alerts | Board report</div></div>
      <div style={st.tabBar}>{tabs.map((t,i)=>(<button key={i} style={st.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
