import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend} from 'recharts';
import { TAXONOMY_THRESHOLDS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Taxonomy Comparison','Activity Classifier','Interoperability Map','Portfolio Taxonomy Screening'];
const COLORS=[T.navy,T.sage,T.gold,'#7c3aed',T.red,T.green,T.amber,'#0ea5e9'];

const TAXONOMIES=[
  {id:'eu',name:'EU Taxonomy',region:'Europe',status:'In Force',year:2020,envObj:6,activities:1018,screening:'Mandatory',transitional:true,dnsh:true,socialMin:true,interop:85,color:'#1e40af'},
  {id:'cn',name:'China Green Bond Catalogue',region:'Asia',status:'In Force',year:2021,envObj:3,activities:211,screening:'Mandatory',transitional:false,dnsh:false,socialMin:false,interop:60,color:'#dc2626'},
  {id:'asean',name:'ASEAN Taxonomy',region:'ASEAN',status:'In Force',year:2023,envObj:4,activities:270,screening:'Voluntary',transitional:true,dnsh:false,socialMin:false,interop:68,color:'#0891b2'},
  {id:'za',name:'South Africa Green Finance',region:'Africa',status:'Developing',year:2024,envObj:3,activities:65,screening:'Proposed',transitional:true,dnsh:false,socialMin:false,interop:48,color:'#78350f'},
  {id:'co',name:'Colombia Green Taxonomy',region:'LatAm',status:'In Force',year:2022,envObj:5,activities:132,screening:'Voluntary',transitional:true,dnsh:true,socialMin:false,interop:55,color:'#f59e0b'},
  {id:'uk',name:'UK Green Taxonomy',region:'UK',status:'In Force',year:2023,envObj:4,activities:196,screening:'Voluntary',transitional:true,dnsh:true,socialMin:false,interop:80,color:'#be185d'},
  {id:'ca',name:'Canada SFAF',region:'Americas',status:'In Force',year:2024,envObj:4,activities:82,screening:'Voluntary',transitional:true,dnsh:false,socialMin:false,interop:72,color:'#7c3aed'},
  {id:'in',name:'India Green Taxonomy',region:'Asia',status:'Developing',year:2024,envObj:3,activities:150,screening:'Proposed',transitional:true,dnsh:false,socialMin:false,interop:55,color:'#f97316'},
];

const ACTIVITIES=[
  {name:'Solar PV',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Wind Power (Onshore)',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Wind Power (Offshore)',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'N/A',co:'N/A',uk:'Eligible',ca:'Eligible',in:'N/A'},
  {name:'Nuclear Power',sector:'Energy',eu:'Transition',cn:'N/A',asean:'N/A',za:'N/A',co:'N/A',uk:'Eligible',ca:'Eligible',in:'Eligible'},
  {name:'Natural Gas CCGT',sector:'Energy',eu:'Transition',cn:'Eligible',asean:'Amber',za:'Amber',co:'Amber',uk:'Review',ca:'Transition',in:'Eligible'},
  {name:'Green Hydrogen',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Blue Hydrogen',sector:'Energy',eu:'Transition',cn:'Eligible',asean:'Amber',za:'N/A',co:'Amber',uk:'Transition',ca:'Transition',in:'Eligible'},
  {name:'Hydropower',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Eligible',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Eligible'},
  {name:'Geothermal',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Biomass Power',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Amber',za:'N/A',co:'Eligible',uk:'Review',ca:'Transition',in:'N/A'},
  {name:'Coal Power',sector:'Energy',eu:'Not Eligible',cn:'Excluded',asean:'Not Eligible',za:'Not Eligible',co:'Not Eligible',uk:'Not Eligible',ca:'Not Eligible',in:'Amber'},
  {name:'EV Manufacturing',sector:'Transport',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'N/A',co:'N/A',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Rail Infrastructure',sector:'Transport',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Eligible'},
  {name:'Green Buildings',sector:'Buildings',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Building Renovation',sector:'Buildings',eu:'Eligible',cn:'Eligible',asean:'Amber',za:'N/A',co:'Eligible',uk:'Eligible',ca:'Transition',in:'N/A'},
  {name:'Sustainable Agriculture',sector:'Agriculture',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Eligible',co:'Eligible',uk:'Review',ca:'Transition',in:'Eligible'},
  {name:'Sustainable Forestry',sector:'Agriculture',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Eligible',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Waste Management',sector:'Industry',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Water Treatment',sector:'Industry',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'Proposed',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Carbon Capture (CCS)',sector:'Industry',eu:'Eligible',cn:'N/A',asean:'N/A',za:'N/A',co:'N/A',uk:'Eligible',ca:'Eligible',in:'N/A'},
  {name:'Cement (low-carbon)',sector:'Industry',eu:'Transition',cn:'Eligible',asean:'Amber',za:'N/A',co:'Amber',uk:'Review',ca:'Transition',in:'Amber'},
  {name:'Steel (DRI/EAF)',sector:'Industry',eu:'Transition',cn:'Eligible',asean:'Amber',za:'N/A',co:'N/A',uk:'Review',ca:'Transition',in:'Amber'},
  {name:'Battery Storage',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'N/A',co:'Eligible',uk:'Eligible',ca:'Eligible',in:'Proposed'},
  {name:'Smart Grid Tech',sector:'Energy',eu:'Eligible',cn:'Eligible',asean:'Eligible',za:'N/A',co:'N/A',uk:'Eligible',ca:'Eligible',in:'N/A'},
  {name:'Marine Energy',sector:'Energy',eu:'Eligible',cn:'N/A',asean:'Eligible',za:'N/A',co:'N/A',uk:'Eligible',ca:'Eligible',in:'N/A'},
];

const PORTFOLIO=[
  {company:'Enel SpA',sector:'Energy',value:850,activities:['Solar PV','Wind Power (Onshore)','Green Buildings']},
  {company:'Orsted A/S',sector:'Energy',value:620,activities:['Wind Power (Offshore)','Green Hydrogen','Battery Storage']},
  {company:'Schneider Electric',sector:'Industry',value:480,activities:['Smart Grid Tech','Building Renovation','EV Manufacturing']},
  {company:'Iberdrola SA',sector:'Energy',value:720,activities:['Wind Power (Onshore)','Hydropower','Green Hydrogen']},
  {company:'Vestas Wind',sector:'Industry',value:340,activities:['Wind Power (Onshore)','Wind Power (Offshore)']},
  {company:'BASF SE',sector:'Chemicals',value:560,activities:['Carbon Capture (CCS)','Battery Storage','Green Hydrogen']},
  {company:'Holcim Ltd',sector:'Materials',value:420,activities:['Cement (low-carbon)','Building Renovation','Waste Management']},
  {company:'Suzano SA',sector:'Forestry',value:280,activities:['Sustainable Forestry','Biomass Power']},
  {company:'Siemens Gamesa',sector:'Energy',value:390,activities:['Wind Power (Onshore)','Wind Power (Offshore)','Marine Energy']},
  {company:'NextEra Energy',sector:'Energy',value:910,activities:['Solar PV','Wind Power (Onshore)','Battery Storage']},
  {company:'Air Liquide',sector:'Industry',value:450,activities:['Green Hydrogen','Blue Hydrogen','Carbon Capture (CCS)']},
  {company:'Linde PLC',sector:'Industry',value:520,activities:['Green Hydrogen','Carbon Capture (CCS)']},
  {company:'Xylem Inc',sector:'Utilities',value:210,activities:['Water Treatment','Smart Grid Tech']},
  {company:'Veolia Env',sector:'Utilities',value:380,activities:['Water Treatment','Waste Management']},
  {company:'Danone SA',sector:'Food',value:310,activities:['Sustainable Agriculture','Green Buildings']},
];

const taxKeys=TAXONOMIES.map(t=>t.id);
const statusColor=s=>s==='Eligible'?'green':s==='Transition'||s==='Amber'?'amber':s==='Not Eligible'||s==='Excluded'?'red':s==='Review'?'navy':'sage';

const tipS={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font,color:T.text}};
const Stat=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${color||T.sage}`}}>
  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:6,fontFamily:T.font}}>{label}</div>
  <div style={{fontSize:26,fontWeight:800,color:T.navy,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3}}>{sub}</div>}</div>);
const Badge=({children,color})=>{const m={green:{bg:'#dcfce7',fg:T.green},red:{bg:'#fee2e2',fg:T.red},amber:{bg:'#fef3c7',fg:T.amber},navy:{bg:'#dbeafe',fg:T.navy},sage:{bg:'#d1fae5',fg:T.sage}};const c=m[color]||m.sage;return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.bg,color:c.fg}}>{children}</span>;};
const exportCSV=(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${Array.isArray(r[k])?r[k].join(';'):r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${name}.csv`;a.click();URL.revokeObjectURL(u);};
const thS={padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',fontFamily:T.font,background:T.surfaceH,position:'sticky',top:0};
const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};
const tdM={...tdS,fontFamily:T.mono,fontWeight:600};

export default function GreenTaxonomyNavigatorPage(){
  const [tab,setTab]=useState(0);
  const [selectedTaxonomies,setSelectedTaxonomies]=useState(['eu','uk','cn']);
  const [activitySearch,setActivitySearch]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [selectedActivity,setSelectedActivity]=useState(null);
  const [interopPair,setInteropPair]=useState(['eu','uk']);
  const [showPanel,setShowPanel]=useState(false);
  const [panelTax,setPanelTax]=useState(null);
  const [portfolioSearch,setPortfolioSearch]=useState('');
  const [screenTaxonomies,setScreenTaxonomies]=useState(['eu','uk','cn','asean']);
  const [expanded,setExpanded]=useState(null);

  const sectors=[...new Set(ACTIVITIES.map(a=>a.sector))];

  const filteredActivities=useMemo(()=>{let d=[...ACTIVITIES];if(activitySearch)d=d.filter(a=>a.name.toLowerCase().includes(activitySearch.toLowerCase()));if(sectorFilter!=='All')d=d.filter(a=>a.sector===sectorFilter);return d;},[activitySearch,sectorFilter]);

  const toggleTax=(id)=>{setSelectedTaxonomies(prev=>prev.includes(id)?prev.filter(t=>t!==id):[...prev,id]);};
  const toggleScreenTax=(id)=>{setScreenTaxonomies(prev=>prev.includes(id)?prev.filter(t=>t!==id):[...prev,id]);};

  const comparisonData=useMemo(()=>TAXONOMIES.filter(t=>selectedTaxonomies.includes(t.id)),[selectedTaxonomies]);

  const interopMatrix=useMemo(()=>{const result=[];TAXONOMIES.forEach(t1=>{TAXONOMIES.forEach(t2=>{if(t1.id!==t2.id){const overlap=ACTIVITIES.filter(a=>a[t1.id]==='Eligible'&&a[t2.id]==='Eligible').length;result.push({from:t1.name,to:t2.name,fromId:t1.id,toId:t2.id,overlap,pct:Math.round(overlap/ACTIVITIES.length*100)});}});});return result;},[]);

  const pairOverlap=useMemo(()=>{const [a,b]=interopPair;return ACTIVITIES.map(act=>({activity:act.name,taxA:act[a]||'N/A',taxB:act[b]||'N/A',aligned:act[a]===act[b]&&act[a]==='Eligible'}));},[interopPair]);

  const portfolioScreened=useMemo(()=>{return PORTFOLIO.filter(p=>!portfolioSearch||p.company.toLowerCase().includes(portfolioSearch.toLowerCase())).map(p=>{const results={};screenTaxonomies.forEach(tid=>{let eligible=0;let total=p.activities.length;p.activities.forEach(act=>{const a=ACTIVITIES.find(x=>x.name===act);if(a&&(a[tid]==='Eligible'||a[tid]==='Transition'))eligible++;});results[tid]=Math.round(eligible/total*100);});return {...p,...results};});},[portfolioSearch,screenTaxonomies]);

  const radarData=useMemo(()=>{const dims=['Activities','Env Objectives','DNSH','Social Min','Interop','Maturity'];return dims.map(d=>{const obj={dim:d};comparisonData.forEach(t=>{obj[t.id]=d==='Activities'?Math.round(t.activities/1018*100):d==='Env Objectives'?Math.round(t.envObj/6*100):d==='DNSH'?t.dnsh?90:30:d==='Social Min'?t.socialMin?90:30:d==='Interop'?t.interop:d==='Maturity'?(2026-t.year)*15:50;});return obj;});},[comparisonData]);

  return (<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0}}>Green Taxonomy Navigator</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>8 global taxonomies -- EU, China, ASEAN, South Africa, Colombia, UK, Canada, India</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        <Stat label="Taxonomies" value="8" sub="Global coverage" color={T.navy}/>
        <Stat label="Activities Mapped" value="25" sub="Cross-taxonomy" color={T.sage}/>
        <Stat label="Portfolio Companies" value="15" sub="Screened" color={T.gold}/>
        <Stat label="Avg Interoperability" value={`${Math.round(TAXONOMIES.reduce((s,t)=>s+t.interop,0)/8)}%`} sub="Cross-recognition" color={T.amber}/>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'12px 24px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>

      {tab===0&&(<div>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {TAXONOMIES.map(t=><button key={t.id} onClick={()=>toggleTax(t.id)} style={{padding:'6px 14px',background:selectedTaxonomies.includes(t.id)?t.color:'transparent',color:selectedTaxonomies.includes(t.id)?'#fff':T.text,border:`1px solid ${selectedTaxonomies.includes(t.id)?t.color:T.border}`,borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>{t.name}</button>)}
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Taxonomy','Region','Status','Year','Env Objectives','Activities','Screening','Transitional','DNSH','Social Min','Interop Score'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>{comparisonData.map(t=><tr key={t.id} onClick={()=>{setPanelTax(t);setShowPanel(true);}} style={{cursor:'pointer'}}>
              <td style={{...tdS,fontWeight:700}}><span style={{display:'inline-block',width:8,height:8,borderRadius:4,background:t.color,marginRight:8}}/>{t.name}</td>
              <td style={tdS}>{t.region}</td><td style={tdS}><Badge color={t.status==='In Force'?'green':'amber'}>{t.status}</Badge></td>
              <td style={tdM}>{t.year}</td><td style={tdM}>{t.envObj}</td><td style={tdM}>{t.activities}</td>
              <td style={tdS}><Badge color={t.screening==='Mandatory'?'red':t.screening==='Voluntary'?'green':'amber'}>{t.screening}</Badge></td>
              <td style={tdS}><Badge color={t.transitional?'green':'red'}>{t.transitional?'Yes':'No'}</Badge></td>
              <td style={tdS}><Badge color={t.dnsh?'green':'red'}>{t.dnsh?'Yes':'No'}</Badge></td>
              <td style={tdS}><Badge color={t.socialMin?'green':'red'}>{t.socialMin?'Yes':'No'}</Badge></td>
              <td style={tdM}>{t.interop}%</td>
            </tr>)}</tbody>
          </table>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Taxonomy Comparison Radar</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
                {comparisonData.map(t=><Radar key={t.id} dataKey={t.id} stroke={t.color} fill={t.color} fillOpacity={0.1} name={t.name}/>)}<Legend/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Activity Coverage</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData.map(t=>({name:t.name.length>15?t.name.slice(0,14)+'..':t.name,activities:t.activities,color:t.color}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Bar dataKey="activities" radius={[4,4,0,0]}>{comparisonData.map((t,i)=><Cell key={i} fill={t.color}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===1&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={activitySearch} onChange={e=>setActivitySearch(e.target.value)} placeholder="Search activity..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:260,outline:'none',background:T.surface}}/>
          <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Sectors</option>{sectors.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={()=>exportCSV(filteredActivities,'activity_classification')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filteredActivities.length} activities</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <div style={{maxHeight:500,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th style={thS}>Activity</th><th style={thS}>Sector</th>{TAXONOMIES.map(t=><th key={t.id} style={{...thS,textAlign:'center'}}><span style={{display:'inline-block',width:6,height:6,borderRadius:3,background:t.color,marginRight:4}}/>{t.name.split(' ')[0]}</th>)}</tr></thead>
              <tbody>{filteredActivities.map((a,i)=><React.Fragment key={i}>
                <tr onClick={()=>setSelectedActivity(selectedActivity===i?null:i)} style={{cursor:'pointer',background:selectedActivity===i?T.surfaceH:'transparent'}}>
                  <td style={{...tdS,fontWeight:600}}>{a.name}</td><td style={tdS}>{a.sector}</td>
                  {TAXONOMIES.map(t=><td key={t.id} style={{...tdS,textAlign:'center'}}><Badge color={statusColor(a[t.id])}>{a[t.id]}</Badge></td>)}
                </tr>
                {selectedActivity===i&&<tr><td colSpan={TAXONOMIES.length+2} style={{padding:16,background:T.surfaceH}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>{a.name} -- Detailed Classification</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                    {TAXONOMIES.map(t=><div key={t.id} style={{padding:10,background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,color:T.textMut,fontWeight:600}}>{t.name}</div>
                      <div style={{fontSize:14,fontWeight:700,marginTop:4}}><Badge color={statusColor(a[t.id])}>{a[t.id]}</Badge></div>
                      <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{a[t.id]==='Eligible'?'Meets all TSC criteria':a[t.id]==='Transition'?'Time-limited transitional':a[t.id]==='Amber'?'Under review / conditional':a[t.id]==='Not Eligible'||a[t.id]==='Excluded'?'Does not meet criteria':a[t.id]==='Review'?'Pending assessment':'Not yet covered'}</div>
                    </div>)}
                  </div>
                </td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
        </div>
      </div>)}

      {tab===2&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <span style={{fontSize:12,color:T.textSec}}>Compare:</span>
          <select value={interopPair[0]} onChange={e=>setInteropPair([e.target.value,interopPair[1]])} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            {TAXONOMIES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <span style={{fontSize:12,color:T.textMut}}>vs</span>
          <select value={interopPair[1]} onChange={e=>setInteropPair([interopPair[0],e.target.value])} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            {TAXONOMIES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Interoperability Scores</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={TAXONOMIES.map(t=>({name:t.name.split(' ')[0],interop:t.interop,color:t.color}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Bar dataKey="interop" radius={[4,4,0,0]}>{TAXONOMIES.map((t,i)=><Cell key={i} fill={t.color}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Pairwise Activity Overlap</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>
              {TAXONOMIES.find(t=>t.id===interopPair[0])?.name} vs {TAXONOMIES.find(t=>t.id===interopPair[1])?.name}: {pairOverlap.filter(p=>p.aligned).length} of {ACTIVITIES.length} activities aligned
            </div>
            <div style={{maxHeight:240,overflowY:'auto'}}>
              {pairOverlap.map((p,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 8px',borderBottom:`1px solid ${T.border}`,fontSize:11,background:p.aligned?'#dcfce7':'transparent'}}>
                <span>{p.activity}</span>
                <span><Badge color={statusColor(p.taxA)}>{p.taxA}</Badge> / <Badge color={statusColor(p.taxB)}>{p.taxB}</Badge></span>
              </div>)}
            </div>
          </div>
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Cross-Taxonomy Overlap Matrix (Eligible Activities)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse'}}>
              <thead><tr><th style={thS}></th>{TAXONOMIES.map(t=><th key={t.id} style={{...thS,textAlign:'center',fontSize:9}}>{t.name.split(' ')[0]}</th>)}</tr></thead>
              <tbody>{TAXONOMIES.map(t1=><tr key={t1.id}>
                <td style={{...tdS,fontWeight:700,fontSize:10}}>{t1.name.split(' ')[0]}</td>
                {TAXONOMIES.map(t2=>{const r=interopMatrix.find(m=>m.fromId===t1.id&&m.toId===t2.id);return <td key={t2.id} style={{...tdM,textAlign:'center',background:t1.id===t2.id?T.surfaceH:r&&r.pct>40?'#dcfce7':r&&r.pct>20?'#fef3c7':'#fee2e2'}}>{t1.id===t2.id?'-':r?`${r.pct}%`:'-'}</td>;})}
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>)}

      {tab===3&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
          <input value={portfolioSearch} onChange={e=>setPortfolioSearch(e.target.value)} placeholder="Search company..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:220,outline:'none',background:T.surface}}/>
          <span style={{fontSize:11,color:T.textSec}}>Screen against:</span>
          {TAXONOMIES.map(t=><label key={t.id} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,cursor:'pointer'}}>
            <input type="checkbox" checked={screenTaxonomies.includes(t.id)} onChange={()=>toggleScreenTax(t.id)}/><span style={{color:t.color,fontWeight:600}}>{t.name.split(' ')[0]}</span>
          </label>)}
          <button onClick={()=>exportCSV(portfolioScreened,'portfolio_screening')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',marginLeft:'auto'}}>Export CSV</button>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:440,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th style={thS}>Company</th><th style={thS}>Sector</th><th style={thS}>Value ($M)</th><th style={thS}>Activities</th>
                {screenTaxonomies.map(tid=>{const t=TAXONOMIES.find(x=>x.id===tid);return <th key={tid} style={{...thS,textAlign:'center'}}><span style={{color:t?.color}}>{t?.name.split(' ')[0]} %</span></th>;})}
              </tr></thead>
              <tbody>{portfolioScreened.map((p,i)=><React.Fragment key={i}>
                <tr onClick={()=>setExpanded(expanded===i?null:i)} style={{cursor:'pointer',background:expanded===i?T.surfaceH:'transparent'}}>
                  <td style={{...tdS,fontWeight:700}}>{p.company}</td><td style={tdS}>{p.sector}</td><td style={tdM}>{p.value}</td>
                  <td style={{...tdS,fontSize:11}}>{p.activities.length}</td>
                  {screenTaxonomies.map(tid=><td key={tid} style={{...tdM,textAlign:'center'}}><Badge color={p[tid]>=80?'green':p[tid]>=50?'amber':'red'}>{p[tid]}%</Badge></td>)}
                </tr>
                {expanded===i&&<tr><td colSpan={4+screenTaxonomies.length} style={{padding:16,background:T.surfaceH}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Activities Detail</div>
                  {p.activities.map((act,j)=>{const a=ACTIVITIES.find(x=>x.name===act);return <div key={j} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:11,alignItems:'center'}}>
                    <span style={{width:160,fontWeight:600}}>{act}</span>
                    {screenTaxonomies.map(tid=><span key={tid}><Badge color={statusColor(a?.[tid]||'N/A')}>{a?.[tid]||'N/A'}</Badge></span>)}
                  </div>;})}
                </td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Portfolio Alignment by Taxonomy</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portfolioScreened}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="company" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
              {screenTaxonomies.map((tid,i)=>{const t=TAXONOMIES.find(x=>x.id===tid);return <Bar key={tid} dataKey={tid} fill={t?.color} name={t?.name.split(' ')[0]} opacity={0.8}/>;})}
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {showPanel&&panelTax&&<div style={{position:'fixed',top:0,right:0,width:480,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.navy,margin:0}}>{panelTax.name}</h2>
          <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {[{l:'Region',v:panelTax.region},{l:'Status',v:panelTax.status},{l:'Year',v:panelTax.year},{l:'Env Objectives',v:panelTax.envObj},{l:'Activities',v:panelTax.activities},{l:'Screening',v:panelTax.screening},{l:'Transitional',v:panelTax.transitional?'Yes':'No'},{l:'DNSH',v:panelTax.dnsh?'Yes':'No'},{l:'Social Min Safeguards',v:panelTax.socialMin?'Yes':'No'},{l:'Interop Score',v:`${panelTax.interop}%`}].map((d,i)=><div key={i}><div style={{fontSize:10,color:T.textMut}}>{d.l}</div><div style={{fontWeight:700}}>{d.v}</div></div>)}
        </div>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Eligible Activities in This Taxonomy</div>
        {ACTIVITIES.filter(a=>a[panelTax.id]==='Eligible').map((a,i)=><div key={i} style={{padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>{a.name} <Badge color="green">Eligible</Badge></div>)}
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginTop:16,marginBottom:8}}>Transitional Activities</div>
        {ACTIVITIES.filter(a=>a[panelTax.id]==='Transition'||a[panelTax.id]==='Amber').map((a,i)=><div key={i} style={{padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>{a.name} <Badge color="amber">{a[panelTax.id]}</Badge></div>)}
      </div>}
    </div>
  </div>);
}
