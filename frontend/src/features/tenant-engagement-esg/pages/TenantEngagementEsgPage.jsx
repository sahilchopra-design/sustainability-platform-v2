import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Tenant ESG Profile','Green Lease Tracker','Tenant Engagement Pipeline','Scope 3 Downstream'];
const SECTORS=['Technology','Financial Services','Professional Services','Healthcare','Retail','Manufacturing','Media','Education','Government','Energy'];
const ENGAGEMENT_STAGES=['Awareness','Interest','Commitment','Implementation','Monitoring','Leadership'];
const STAGE_COLORS=['#9aa3ae','#d97706','#c5a96a','#2c5a8c','#5a8a6a','#16a34a'];
const CLAUSES=['Data Sharing','Fit-Out Standards','Waste Management','Renewable Energy','EV Charging','Indoor Air Quality','Water Conservation','Carbon Reporting','Green Procurement','Biodiversity'];
const BLDG_TYPES=['Office','Retail','Mixed-Use'];

const buildingNames=Array.from({length:50},(_,i)=>{
  const cities=['London','Manchester','Birmingham','Edinburgh','Bristol','Leeds','Glasgow','Amsterdam','Frankfurt','Dublin'];
  return `${cities[Math.floor(sr(i*13)*10)]} ${BLDG_TYPES[Math.floor(sr(i*17)*3)]} ${i+1}`;
});

const tenants=Array.from({length:80},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);const s5=sr(i*19+13);const s6=sr(i*23+17);
  const sector=SECTORS[Math.floor(s*SECTORS.length)];
  const buildingIdx=Math.floor(s2*50);
  const area=Math.floor(500+s3*9500);
  const employees=Math.floor(10+s4*490);
  const esgScore=Math.floor(20+s5*80);
  const greenLeaseActive=s6>0.35;
  const clauses=CLAUSES.map((c,j)=>({clause:c,adopted:greenLeaseActive&&sr(i*31+j*7)>0.4,compliance:greenLeaseActive?Math.floor(40+sr(i*37+j*11)*60):0}));
  const energyConsumption=Math.floor(area*150*(0.5+s*0.8));
  const stageIdx=Math.floor(s*6);
  const satisfaction=Math.floor(50+s2*50);
  const renewablePerc=Math.floor(s3*60);
  const wasteRecycling=Math.floor(20+s4*70);
  const waterEfficiency=Math.floor(30+s5*60);
  const scope3Contribution=Math.floor(energyConsumption*0.21/1000);
  const reductionTarget=Math.floor(10+s6*40);
  const dataQuality=s>0.5?'Actual':s>0.25?'Estimated':'No Data';
  const leaseExpiry=2025+Math.floor(s2*8);
  const companyNames=['TechCorp','FinanceHub','LegalFirst','MediGlobal','RetailPro','ManufactX','MediaWave','EduSmart','GovServ','EnergyPlus','DataFlow','CloudNine','GreenTech','SmartOffice','UrbanPlan','HealthNet','BioScience','CyberSafe','LogiTrans','AeroSpace'];
  return{id:i+1,name:companyNames[i%20]+` ${Math.floor(i/20)+1}`,sector,building:buildingNames[buildingIdx],buildingIdx,area,employees,esgScore,greenLeaseActive,clauses,energyConsumption,engagementStage:ENGAGEMENT_STAGES[stageIdx],stageIdx,satisfaction,renewablePerc,wasteRecycling,waterEfficiency,scope3Contribution,reductionTarget,dataQuality,leaseExpiry,lastContact:2024+Math.floor(s3*2),surveyCompleted:s4>0.5,fitOutStandard:greenLeaseActive&&s5>0.4?'Gold':greenLeaseActive&&s5>0.2?'Silver':'None'};
});

const quarterlyEngagement=Array.from({length:8},(_,i)=>({quarter:`Q${(i%4)+1} ${2024+Math.floor(i/4)}`,surveys:Math.floor(30+sr(i*17)*40),responses:Math.floor(20+sr(i*19)*30),satisfaction:Math.floor(60+sr(i*23)*30),greenLeases:Math.floor(15+i*3),dataSharing:Math.floor(20+i*4)}));

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{marginBottom:20},title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,fontFamily:T.mono,marginTop:4},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`},
  tab:(a)=>({padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',background:a?T.surfaceH:'transparent',transition:'all 0.2s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  kpiRow:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16},
  kpi:{flex:'1 1 160px',background:T.surfaceH,border:`1px solid ${T.borderL}`,borderRadius:8,padding:16,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textMut,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`},
  badge:(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'22',color:c}),
  filterRow:{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'},
  select:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  scrollBox:{maxHeight:440,overflowY:'auto'},
  pill:(a)=>({padding:'4px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:a?700:500,background:a?T.navy:T.surfaceH,color:a?'#fff':T.text,border:`1px solid ${a?T.navy:T.border}`}),
  exportBtn:{padding:'8px 18px',borderRadius:6,background:T.navy,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600},
  stageBar:(idx)=>({display:'inline-flex',alignItems:'center',gap:4,padding:'3px 12px',borderRadius:12,fontSize:11,fontWeight:600,background:STAGE_COLORS[idx]+'22',color:STAGE_COLORS[idx]}),
};

export default function TenantEngagementEsgPage(){
  const[tab,setTab]=useState(0);
  const[sectorFilter,setSectorFilter]=useState('All');
  const[greenLeaseFilter,setGreenLeaseFilter]=useState('All');
  const[sortCol,setSortCol]=useState('esgScore');
  const[sortDir,setSortDir]=useState('desc');
  const[selectedTenant,setSelectedTenant]=useState(null);
  const[pipelineStage,setPipelineStage]=useState('All');
  const[searchTerm,setSearchTerm]=useState('');
  const[scope3View,setScope3View]=useState('overview');

  const filtered=useMemo(()=>{
    let d=[...tenants];
    if(sectorFilter!=='All')d=d.filter(t=>t.sector===sectorFilter);
    if(greenLeaseFilter==='Active')d=d.filter(t=>t.greenLeaseActive);
    if(greenLeaseFilter==='Inactive')d=d.filter(t=>!t.greenLeaseActive);
    if(pipelineStage!=='All'&&tab===2)d=d.filter(t=>t.engagementStage===pipelineStage);
    if(searchTerm)d=d.filter(t=>t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    d.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return d;
  },[sectorFilter,greenLeaseFilter,sortCol,sortDir,pipelineStage,tab,searchTerm]);

  const greenLeaseRate=useMemo(()=>Math.floor(tenants.filter(t=>t.greenLeaseActive).length/tenants.length*100),[]);
  const avgSatisfaction=useMemo(()=>Math.floor(filtered.reduce((s,t)=>s+t.satisfaction,0)/(filtered.length||1)),[filtered]);
  const totalScope3=useMemo(()=>filtered.reduce((s,t)=>s+t.scope3Contribution,0),[filtered]);
  const avgEsgScore=useMemo(()=>Math.floor(filtered.reduce((s,t)=>s+t.esgScore,0)/(filtered.length||1)),[filtered]);

  const clauseAdoption=useMemo(()=>CLAUSES.map(c=>({clause:c,adopted:filtered.filter(t=>t.clauses.find(cl=>cl.clause===c)?.adopted).length,total:filtered.length,rate:filtered.length?Math.floor(filtered.filter(t=>t.clauses.find(cl=>cl.clause===c)?.adopted).length/filtered.length*100):0})),[filtered]);

  const sectorDist=useMemo(()=>SECTORS.map(s=>({sector:s,count:filtered.filter(t=>t.sector===s).length,avgEsg:Math.floor(filtered.filter(t=>t.sector===s).reduce((sum,t)=>sum+t.esgScore,0)/(filtered.filter(t=>t.sector===s).length||1))})).filter(d=>d.count>0),[filtered]);

  const engagementFunnel=useMemo(()=>ENGAGEMENT_STAGES.map((stage,i)=>({stage,count:filtered.filter(t=>t.stageIdx>=i).length,current:filtered.filter(t=>t.stageIdx===i).length})),[filtered]);

  const selTenant=useMemo(()=>selectedTenant?tenants.find(t=>t.id===selectedTenant):null,[selectedTenant]);

  const scope3BySector=useMemo(()=>SECTORS.map(s=>{const ts=filtered.filter(t=>t.sector===s);return{sector:s,scope3:ts.reduce((sum,t)=>sum+t.scope3Contribution,0),count:ts.length,avgTarget:ts.length?Math.floor(ts.reduce((sum,t)=>sum+t.reductionTarget,0)/ts.length):0};}).filter(d=>d.count>0).sort((a,b)=>b.scope3-a.scope3),[filtered]);

  const scope3Trend=useMemo(()=>Array.from({length:8},(_,i)=>({year:2024+i,baseline:totalScope3,target:Math.floor(totalScope3*(1-0.05*i)),actual:i<3?Math.floor(totalScope3*(1-0.03*i)):null})),[totalScope3]);

  const dataQualityDist=useMemo(()=>[{quality:'Actual',count:filtered.filter(t=>t.dataQuality==='Actual').length},{quality:'Estimated',count:filtered.filter(t=>t.dataQuality==='Estimated').length},{quality:'No Data',count:filtered.filter(t=>t.dataQuality==='No Data').length}],[filtered]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  return(
    <div style={sty.page}>
      <div style={sty.header}>
        <h1 style={sty.title}>Tenant Engagement ESG</h1>
        <div style={sty.subtitle}>EP-AS5 / Green Leases / Tenant CRM / Scope 3 — {filtered.length} tenants · {buildingNames.length} buildings</div>
      </div>

      <div style={sty.tabs}>{TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}</div>

      {tab===0&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:filtered.length,l:'Tenants'},{v:`${avgEsgScore}/100`,l:'Avg ESG Score'},{v:`${greenLeaseRate}%`,l:'Green Lease Rate'},{v:`${avgSatisfaction}/100`,l:'Avg Satisfaction'},{v:`${totalScope3.toLocaleString()} tCO₂`,l:'Total Scope 3'},{v:`${filtered.filter(t=>t.dataQuality==='Actual').length}`,l:'Actual Data'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.filterRow}>
            <select style={sty.select} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
            <select style={sty.select} value={greenLeaseFilter} onChange={e=>setGreenLeaseFilter(e.target.value)}><option value="All">All Lease Types</option><option>Active</option><option>Inactive</option></select>
            <input style={{...sty.select,width:200}} placeholder="Search tenants..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>ESG Score by Sector</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sectorDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={80}/><YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="avgEsg" name="Avg ESG Score" radius={[4,4,0,0]}>{sectorDist.map((d,i)=><Cell key={i} fill={d.avgEsg>60?T.green:d.avgEsg>40?T.amber:T.red}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Green Lease Coverage</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie data={[{name:'Active Green Lease',value:filtered.filter(t=>t.greenLeaseActive).length},{name:'No Green Lease',value:filtered.filter(t=>!t.greenLeaseActive).length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: ${value}`}><Cell fill={T.green}/><Cell fill={T.textMut}/></Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Sector Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={sectorDist} dataKey="count" nameKey="sector" cx="50%" cy="50%" outerRadius={80} label={({sector,count})=>`${sector}: ${count}`}>
                  {sectorDist.map((_,i)=><Cell key={i} fill={[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.teal,'#7c3aed','#0891b2','#be185d'][i%10]}/>)}
                </Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Data Quality</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dataQualityDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="quality" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" radius={[4,4,0,0]}>{dataQualityDist.map((d,i)=><Cell key={i} fill={[T.green,T.amber,T.red][i]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Tenant ESG Profiles ({filtered.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr>{['Tenant','Sector','Building','Area (m²)','ESG Score','Green Lease','Satisfaction','Energy (MWh)','Scope 3 (t)','Data Quality'].map((h,i)=>{
                  const cols=['name','sector','building','area','esgScore','greenLeaseActive','satisfaction','energyConsumption','scope3Contribution','dataQuality'];
                  return <th key={i} style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort(cols[i])}>{h}</th>;
                })}</tr></thead>
                <tbody>{filtered.slice(0,50).map(t=>(
                  <tr key={t.id} style={{cursor:'pointer',background:selectedTenant===t.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedTenant(t.id)}>
                    <td style={sty.td}>{t.name}</td><td style={sty.td}>{t.sector}</td><td style={sty.td}>{t.building}</td>
                    <td style={sty.td}>{t.area.toLocaleString()}</td>
                    <td style={sty.td}><span style={sty.badge(t.esgScore>60?T.green:t.esgScore>40?T.amber:T.red)}>{t.esgScore}</span></td>
                    <td style={sty.td}><span style={sty.badge(t.greenLeaseActive?T.green:T.textMut)}>{t.greenLeaseActive?'Active':'None'}</span></td>
                    <td style={sty.td}>{t.satisfaction}/100</td><td style={sty.td}>{(t.energyConsumption/1000).toFixed(0)}</td>
                    <td style={sty.td}>{t.scope3Contribution}</td>
                    <td style={sty.td}><span style={sty.badge(t.dataQuality==='Actual'?T.green:t.dataQuality==='Estimated'?T.amber:T.red)}>{t.dataQuality}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===1&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:`${greenLeaseRate}%`,l:'Green Lease Rate'},{v:filtered.filter(t=>t.greenLeaseActive).length,l:'Active Green Leases'},{v:`${Math.floor(clauseAdoption.reduce((s,c)=>s+c.rate,0)/clauseAdoption.length)}%`,l:'Avg Clause Adoption'},{v:clauseAdoption.sort((a,b)=>b.rate-a.rate)[0]?.clause||'',l:'Most Adopted Clause'},{v:filtered.filter(t=>t.leaseExpiry<=2026).length,l:'Expiring by 2026'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={{...sty.kpiVal,fontSize:i===3?13:24}}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Green Lease Clause Adoption</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clauseAdoption.sort((a,b)=>b.rate-a.rate)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}} unit="%"/><YAxis type="category" dataKey="clause" width={140} tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="rate" name="Adoption Rate %" radius={[0,4,4,0]}>{clauseAdoption.map((c,i)=><Cell key={i} fill={c.rate>60?T.green:c.rate>30?T.amber:T.red}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Clause Compliance Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={clauseAdoption.map(c=>({clause:c.clause.split(' ').slice(0,2).join(' '),adoption:c.rate,compliance:Math.floor(c.rate*0.7+sr(CLAUSES.indexOf(c.clause))*30)}))}>
                  <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="clause" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar name="Adoption" dataKey="adoption" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2}/>
                  <Radar name="Compliance" dataKey="compliance" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2}/>
                  <Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Green Lease Trend</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quarterlyEngagement}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="greenLeases" name="Green Leases" stroke={T.green} strokeWidth={2}/><Line type="monotone" dataKey="dataSharing" name="Data Sharing" stroke={T.navy} strokeWidth={2}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Green Lease Details</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Tenant</th><th style={sty.th}>Status</th><th style={sty.th}>Clauses</th><th style={sty.th}>Fit-Out</th><th style={sty.th}>Lease Expiry</th><th style={sty.th}>Renewable %</th><th style={sty.th}>Waste Recycling</th></tr></thead>
                <tbody>{filtered.slice(0,50).map(t=>(
                  <tr key={t.id}><td style={sty.td}>{t.name}</td>
                    <td style={sty.td}><span style={sty.badge(t.greenLeaseActive?T.green:T.textMut)}>{t.greenLeaseActive?'Active':'None'}</span></td>
                    <td style={sty.td}>{t.clauses.filter(c=>c.adopted).length}/{CLAUSES.length}</td>
                    <td style={sty.td}><span style={sty.badge(t.fitOutStandard==='Gold'?T.gold:t.fitOutStandard==='Silver'?T.textSec:T.textMut)}>{t.fitOutStandard}</span></td>
                    <td style={sty.td}><span style={sty.badge(t.leaseExpiry<=2026?T.amber:T.green)}>{t.leaseExpiry}</span></td>
                    <td style={sty.td}>{t.renewablePerc}%</td><td style={sty.td}>{t.wasteRecycling}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Stage:</span>
            <span style={sty.pill(pipelineStage==='All')} onClick={()=>setPipelineStage('All')}>All</span>
            {ENGAGEMENT_STAGES.map((s,i)=><span key={s} style={{...sty.pill(pipelineStage===s),color:pipelineStage===s?'#fff':STAGE_COLORS[i],background:pipelineStage===s?STAGE_COLORS[i]:T.surfaceH,borderColor:STAGE_COLORS[i]}} onClick={()=>setPipelineStage(s)}>{s}</span>)}
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Engagement Funnel</div>
            <div style={{display:'flex',gap:0,marginBottom:16}}>
              {engagementFunnel.map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:'center',padding:'16px 8px',background:STAGE_COLORS[i]+'15',borderRight:i<5?`1px solid ${T.border}`:'none'}}>
                  <div style={{fontSize:22,fontWeight:700,color:STAGE_COLORS[i],fontFamily:T.mono}}>{s.current}</div>
                  <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{s.stage}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Cum: {s.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Engagement Effectiveness</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={quarterlyEngagement}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="surveys" name="Surveys Sent" stroke={T.navy} strokeWidth={2}/><Line type="monotone" dataKey="responses" name="Responses" stroke={T.green} strokeWidth={2}/><Line type="monotone" dataKey="satisfaction" name="Satisfaction" stroke={T.gold} strokeWidth={2}/></LineChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Stage Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ENGAGEMENT_STAGES.map((s,i)=>({stage:s,count:filtered.filter(t=>t.stageIdx===i).length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" name="Tenants" radius={[4,4,0,0]}>{ENGAGEMENT_STAGES.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Tenant Pipeline ({filtered.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Tenant</th><th style={sty.th}>Stage</th><th style={sty.th}>ESG Score</th><th style={sty.th}>Satisfaction</th><th style={sty.th}>Survey</th><th style={sty.th}>Last Contact</th><th style={sty.th}>Green Lease</th><th style={sty.th}>Next Action</th></tr></thead>
                <tbody>{filtered.slice(0,50).map(t=>(
                  <tr key={t.id}><td style={sty.td}>{t.name}</td>
                    <td style={sty.td}><span style={sty.stageBar(t.stageIdx)}>{t.engagementStage}</span></td>
                    <td style={sty.td}><span style={sty.badge(t.esgScore>60?T.green:t.esgScore>40?T.amber:T.red)}>{t.esgScore}</span></td>
                    <td style={sty.td}>{t.satisfaction}/100</td>
                    <td style={sty.td}><span style={sty.badge(t.surveyCompleted?T.green:T.amber)}>{t.surveyCompleted?'Done':'Pending'}</span></td>
                    <td style={sty.td}>{t.lastContact}</td>
                    <td style={sty.td}><span style={sty.badge(t.greenLeaseActive?T.green:T.textMut)}>{t.greenLeaseActive?'Yes':'No'}</span></td>
                    <td style={sty.td}>{t.stageIdx<2?'Send Survey':t.stageIdx<4?'Schedule Meeting':'Review Data'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===3&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>View:</span>
            {['overview','sectors','targets','collection'].map(v=><span key={v} style={sty.pill(scope3View===v)} onClick={()=>setScope3View(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</span>)}
          </div>

          <div style={sty.kpiRow}>
            {[{v:`${totalScope3.toLocaleString()} tCO₂`,l:'Total Scope 3 Downstream'},{v:`${Math.floor(totalScope3/filtered.length)} tCO₂`,l:'Per Tenant Avg'},{v:`${Math.floor(filtered.reduce((s,t)=>s+t.reductionTarget,0)/(filtered.length||1))}%`,l:'Avg Reduction Target'},{v:`${filtered.filter(t=>t.dataQuality==='Actual').length}/${filtered.length}`,l:'Actual Data Coverage'},{v:`${Math.floor(filtered.filter(t=>t.dataQuality==='Actual').reduce((s,t)=>s+t.scope3Contribution,0)/totalScope3*100)}%`,l:'Verified Emissions'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Scope 3 by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scope3BySector}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={80}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="scope3" name="tCO₂" radius={[4,4,0,0]}>{scope3BySector.map((_,i)=><Cell key={i} fill={[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.teal,'#7c3aed','#0891b2','#be185d'][i%10]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Reduction Trajectory</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={scope3Trend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="baseline" name="Baseline" stroke={T.textMut} strokeDasharray="5 5" strokeWidth={1}/><Line type="monotone" dataKey="target" name="Target" stroke={T.green} strokeWidth={2}/><Line type="monotone" dataKey="actual" name="Actual" stroke={T.navy} strokeWidth={2} connectNulls={false}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Scope 3 Downstream Detail</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Tenant</th><th style={sty.th}>Sector</th><th style={sty.th}>Energy (MWh)</th><th style={sty.th}>Scope 3 (tCO₂)</th><th style={sty.th}>Target (%)</th><th style={sty.th}>Data Quality</th><th style={sty.th}>Renewable %</th><th style={sty.th}>Progress</th></tr></thead>
                <tbody>{filtered.sort((a,b)=>b.scope3Contribution-a.scope3Contribution).slice(0,50).map(t=>(
                  <tr key={t.id}><td style={sty.td}>{t.name}</td><td style={sty.td}>{t.sector}</td>
                    <td style={sty.td}>{(t.energyConsumption/1000).toFixed(0)}</td>
                    <td style={sty.td}>{t.scope3Contribution}</td>
                    <td style={sty.td}>{t.reductionTarget}%</td>
                    <td style={sty.td}><span style={sty.badge(t.dataQuality==='Actual'?T.green:t.dataQuality==='Estimated'?T.amber:T.red)}>{t.dataQuality}</span></td>
                    <td style={sty.td}>{t.renewablePerc}%</td>
                    <td style={sty.td}>
                      <div style={{width:80,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.min(t.renewablePerc*1.5,100)}%`,background:T.green,borderRadius:3}}/>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
