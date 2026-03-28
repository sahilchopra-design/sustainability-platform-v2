import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,LineChart,Line,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COUNTRIES=['United States','United Kingdom','Germany','France','Japan','China','India','Brazil','South Korea','Australia','Canada','Mexico','Netherlands','Sweden','Switzerland','Singapore','Taiwan','Vietnam','Thailand','South Africa'];
const INDUSTRIES=['Electronics','Automotive','Chemicals','Textiles','Mining','Agriculture','Pharmaceuticals','Logistics','Construction','Energy'];
const DIMS=['Environmental','Social','Governance','Climate','Human Rights','Transparency'];
const DIM_KEYS=['env','soc','gov','clm','hr','trn'];
const DIM_WEIGHTS=[0.20,0.15,0.15,0.20,0.15,0.15];
const TIERS=['Platinum','Gold','Silver','Bronze','Red'];
const TIER_COLORS={Platinum:'#6366f1',Gold:T.gold,Silver:'#94a3b8',Bronze:'#b45309',Red:T.red};
const TIER_THRESHOLDS={Platinum:85,Gold:70,Silver:55,Bronze:40,Red:0};
const STAGES=['Assessment','Questionnaire Sent','Response Received','Gap Analysis','Corrective Action','Verified'];
const STAGE_COLORS=['#6366f1','#3b82f6','#06b6d4','#f59e0b','#ef4444','#16a34a'];
const ACTION_TYPES=['Policy','Process','Facility','Reporting'];
const STATUSES=['Open','In Progress','Overdue','Closed'];
const STATUS_COLORS={Open:'#3b82f6','In Progress':T.amber,Overdue:T.red,Closed:T.green};
const OWNERS=['J. Chen','M. Kumar','S. Williams','A. Schmidt','K. Tanaka','L. Santos','R. Patel','N. Johansson'];
const QUARTERS=['Q1 2023','Q2 2023','Q3 2023','Q4 2023','Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025'];
const CERT_TYPES=['ISO 14001','ISO 45001','SA8000','FSC','GRI Verified','CDP A-List','B-Corp','Fair Trade'];
const RISK_CATEGORIES=['Supply Disruption','Regulatory Non-Compliance','Reputational','Environmental Incident','Labour Rights','Data Privacy'];

const suppliers=Array.from({length:150},(_,i)=>{const s=n=>sr(i*100+n);
  const scores=DIM_KEYS.map((_,d)=>Math.round(30+s(d*7+3)*65));
  const weighted=Math.round(scores.reduce((a,sc,idx)=>a+sc*DIM_WEIGHTS[idx],0));
  const composite=Math.round(scores.reduce((a,b)=>a+b,0)/6);
  const tier=composite>=85?'Platinum':composite>=70?'Gold':composite>=55?'Silver':composite>=40?'Bronze':'Red';
  const history=QUARTERS.map((_,q)=>Math.round(Math.max(15,Math.min(98,composite-10+s(q*13+50)*20))));
  const certs=CERT_TYPES.filter((_,ci)=>s(ci+90)>0.55);
  const risks=RISK_CATEGORIES.filter((_,ri)=>s(ri+120)>0.65);
  const contactName=['A. Martinez','B. Liu','C. Patel','D. Svensson','E. Nakamura','F. Weber','G. Kim','H. Santos','I. Smith','J. Dubois'][Math.floor(s(140)*10)];
  const contactRole=['VP Supply Chain','Sustainability Director','ESG Manager','Procurement Lead','Compliance Officer'][Math.floor(s(141)*5)];
  return{id:i+1,name:`Supplier-${String(i+1).padStart(3,'0')}`,
    country:COUNTRIES[Math.floor(s(1)*COUNTRIES.length)],
    industry:INDUSTRIES[Math.floor(s(2)*INDUSTRIES.length)],
    scores,composite,weighted,tier,history,
    spend:Math.round(500+s(80)*9500),
    riskScore:Math.round(10+s(81)*85),
    lastEngagement:`2025-${String(1+Math.floor(s(82)*12)).padStart(2,'0')}-${String(1+Math.floor(s(83)*28)).padStart(2,'0')}`,
    engagementCount:Math.floor(1+s(84)*8),
    employees:Math.round(50+s(85)*4950),
    founded:Math.round(1960+s(86)*60),
    certs,risks,contactName,contactRole,
    responseTime:Math.round(5+s(87)*55),
    improvementRate:Math.round(-5+s(88)*25),
    carbonIntensity:Math.round(20+s(89)*180),
    waterUsage:Math.round(100+s(91)*900),
    wasteRecycled:Math.round(10+s(92)*85),
    renewableEnergy:Math.round(5+s(93)*90),
    genderDiversity:Math.round(15+s(94)*50),
    safetyIncidents:Math.floor(s(95)*12),
    auditDate:`2025-${String(1+Math.floor(s(96)*12)).padStart(2,'0')}-${String(1+Math.floor(s(97)*28)).padStart(2,'0')}`,
    nextAudit:`2026-${String(1+Math.floor(s(98)*12)).padStart(2,'0')}-${String(1+Math.floor(s(99)*28)).padStart(2,'0')}`,
  };
});

const engagements=Array.from({length:40},(_,i)=>{const s=n=>sr(i*200+n+5000);
  const sup=suppliers[Math.floor(s(1)*150)];
  const stageIdx=Math.floor(s(2)*6);
  const activities=Array.from({length:Math.floor(2+s(30)*6)},(__,a)=>({
    date:`2025-${String(1+Math.floor(s(a*3+31)*12)).padStart(2,'0')}-${String(1+Math.floor(s(a*3+32)*28)).padStart(2,'0')}`,
    type:['Email','Call','Site Visit','Document Review','Meeting','Audit'][Math.floor(s(a*3+33)*6)],
    note:`Activity ${a+1} for ${sup.name}`
  }));
  return{id:i+1,supplierId:sup.id,supplierName:sup.name,industry:sup.industry,country:sup.country,
    stage:STAGES[stageIdx],stageIdx,priority:Math.round(20+s(3)*80),
    startDate:`2025-${String(1+Math.floor(s(4)*10)).padStart(2,'0')}-${String(1+Math.floor(s(5)*28)).padStart(2,'0')}`,
    daysInStage:Math.floor(3+s(6)*45),spend:sup.spend,riskScore:sup.riskScore,
    improvementPotential:Math.round(10+s(7)*60),
    notes:`Engagement for ${sup.name} — ${STAGES[stageIdx]} phase. Focus on ${DIMS[Math.floor(s(20)*6)]} improvement.`,
    assignee:OWNERS[Math.floor(s(8)*OWNERS.length)],
    questionnaireSections:Math.floor(4+s(9)*8),
    responseRate:Math.round(20+s(10)*80),
    gapCount:Math.floor(1+s(11)*12),
    activities,
    targetScore:Math.round(60+s(12)*35),
    currentDelta:Math.round(-20+s(13)*40),
  };
});

const actions=Array.from({length:40},(_,i)=>{const s=n=>sr(i*300+n+9000);
  const sup=suppliers[Math.floor(s(1)*150)];
  const statusIdx=Math.floor(s(2)*4);
  const severity=s(3)>0.7?'Critical':s(3)>0.4?'High':s(3)>0.15?'Medium':'Low';
  const daysTotal=Math.floor(30+s(10)*120);
  const daysElapsed=Math.floor(s(11)*daysTotal);
  const milestones=Array.from({length:Math.floor(2+s(12)*4)},(__,m)=>({
    name:['Risk Assessment','Policy Draft','Implementation','Staff Training','Verification Audit','Management Review','Documentation','Monitoring Setup'][m%8],
    done:s(m*5+20)>0.4,
    date:`2025-${String(1+Math.floor(s(m*5+21)*12)).padStart(2,'0')}-${String(1+Math.floor(s(m*5+22)*28)).padStart(2,'0')}`,
    owner:OWNERS[Math.floor(s(m*5+23)*OWNERS.length)]
  }));
  const updates=Array.from({length:Math.floor(1+s(40)*5)},(__,u)=>({
    date:`2025-${String(1+Math.floor(s(u*3+41)*12)).padStart(2,'0')}-${String(1+Math.floor(s(u*3+42)*28)).padStart(2,'0')}`,
    author:OWNERS[Math.floor(s(u*3+43)*OWNERS.length)],
    text:`Progress update ${u+1}: ${['Policy framework drafted','Facility inspection completed','Training programme initiated','Documentation submitted','Verification pending'][u%5]}`
  }));
  return{id:i+1,supplierId:sup.id,supplierName:sup.name,
    type:ACTION_TYPES[Math.floor(s(4)*4)],severity,
    deadline:`2025-${String(1+Math.floor(s(5)*12)).padStart(2,'0')}-${String(1+Math.floor(s(6)*28)).padStart(2,'0')}`,
    owner:OWNERS[Math.floor(s(7)*OWNERS.length)],
    status:STATUSES[statusIdx],
    description:`Corrective action for ${sup.name}: ${ACTION_TYPES[Math.floor(s(4)*4)]} improvement in ${DIMS[Math.floor(s(14)*6)]} dimension. Root cause: ${['Process gap','Policy absence','Facility deficiency','Reporting failure','Training gap'][Math.floor(s(15)*5)]}.`,
    effectiveness:Math.round(20+s(8)*75),
    verificationStatus:statusIdx===3?'Verified':statusIdx===2?'Pending Review':'Not Started',
    daysTotal,daysElapsed,milestones,updates,
    evidence:Math.floor(s(9)*5),
    dimension:DIMS[Math.floor(s(13)*6)],
    rootCause:['Process gap','Policy absence','Facility deficiency','Reporting failure','Training gap'][Math.floor(s(15)*5)],
    estimatedCost:Math.round(5+s(16)*95)+'k',
    actualCost:statusIdx>=3?Math.round(5+s(17)*95)+'k':'TBD',
    impactScore:Math.round(20+s(18)*75),
    linkedEngagement:engagements[Math.floor(s(19)*40)]?.id||1,
  };
});

const TABS=['Supplier Scorecard','Engagement Pipeline','Corrective Action Tracker','Benchmarking & Reporting'];

const pill=(label,color,textColor)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.mono,background:color+'22',color:textColor||color,border:`1px solid ${color}44`});
const btn=(primary)=>({padding:'6px 16px',borderRadius:6,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s'});
const card={background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16};
const inp={padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none'};
const kpiBox=(v,label,color)=>(<div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color}}>{v}</div><div style={{fontSize:10,color:T.textMut}}>{label}</div></div>);

/* ── Tab 1: Supplier Scorecard ── */
function ScorecardTab(){
  const[sortKey,setSortKey]=useState('composite');
  const[sortDir,setSortDir]=useState('desc');
  const[filterIndustry,setFilterIndustry]=useState('All');
  const[filterCountry,setFilterCountry]=useState('All');
  const[filterTier,setFilterTier]=useState('All');
  const[minScore,setMinScore]=useState(0);
  const[searchTerm,setSearchTerm]=useState('');
  const[selected,setSelected]=useState(null);
  const[compareIds,setCompareIds]=useState([]);
  const[compareMode,setCompareMode]=useState(false);
  const[page,setPage]=useState(0);
  const[detailTab,setDetailTab]=useState('overview');
  const perPage=20;

  const filtered=useMemo(()=>{
    let d=[...suppliers];
    if(filterIndustry!=='All')d=d.filter(s=>s.industry===filterIndustry);
    if(filterCountry!=='All')d=d.filter(s=>s.country===filterCountry);
    if(filterTier!=='All')d=d.filter(s=>s.tier===filterTier);
    if(searchTerm)d=d.filter(s=>s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    d=d.filter(s=>s.composite>=minScore);
    d.sort((a,b)=>{
      const ak=sortKey==='name'?a.name:a[sortKey]||0;
      const bk=sortKey==='name'?b.name:b[sortKey]||0;
      if(typeof ak==='string')return sortDir==='asc'?ak.localeCompare(bk):bk.localeCompare(ak);
      return sortDir==='asc'?ak-bk:bk-ak;
    });
    return d;
  },[sortKey,sortDir,filterIndustry,filterCountry,filterTier,minScore,searchTerm]);

  const paged=filtered.slice(page*perPage,(page+1)*perPage);
  const totalPages=Math.ceil(filtered.length/perPage);
  const toggleSort=k=>{if(sortKey===k)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(k);setSortDir('desc');}};
  const toggleCompare=id=>{setCompareIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length<3?[...prev,id]:prev);};
  const comparedSuppliers=suppliers.filter(s=>compareIds.includes(s.id));
  const sortArrow=k=>sortKey===k?(sortDir==='asc'?' \u25B2':' \u25BC'):'';

  const radarData=useCallback((sup)=>DIMS.map((d,idx)=>({dim:d,score:sup.scores[idx]})),[]);
  const trendData=useCallback((sup)=>QUARTERS.map((q,idx)=>({q,score:sup.history[idx]})),[]);

  /* Summary KPIs for filtered set */
  const filteredAvg=filtered.length?Math.round(filtered.reduce((a,s)=>a+s.composite,0)/filtered.length):0;
  const filteredPlatinum=filtered.filter(s=>s.tier==='Platinum').length;
  const filteredRed=filtered.filter(s=>s.tier==='Red').length;
  const filteredTotalSpend=filtered.reduce((a,s)=>a+s.spend,0);

  const procurementWeight=(s)=>{
    const w=s.composite*0.4+(100-s.riskScore)*0.3+(Math.min(s.spend/100,30))*1.0;
    return Math.round(w*10)/10;
  };

  return(<div>
    {/* Summary KPIs */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
      {[['Filtered Suppliers',filtered.length,T.navy],['Avg Composite',filteredAvg,T.gold],['Platinum Tier',filteredPlatinum,'#6366f1'],['Red / At-Risk',filteredRed,T.red],['Total Spend',`$${Math.round(filteredTotalSpend/1000)}M`,T.sage]].map(([l,v,c])=>(
        <div key={l} style={{...card,textAlign:'center',padding:12}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:c}}>{v}</div>
          <div style={{fontSize:10,color:T.textMut}}>{l}</div>
        </div>
      ))}
    </div>

    {/* Filters */}
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={{...inp,width:160}} placeholder="Search supplier..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}}/>
      <select style={inp} value={filterIndustry} onChange={e=>{setFilterIndustry(e.target.value);setPage(0);}}>
        <option value="All">All Industries</option>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}
      </select>
      <select style={inp} value={filterCountry} onChange={e=>{setFilterCountry(e.target.value);setPage(0);}}>
        <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
      </select>
      <select style={inp} value={filterTier} onChange={e=>{setFilterTier(e.target.value);setPage(0);}}>
        <option value="All">All Tiers</option>{TIERS.map(t=><option key={t}>{t}</option>)}
      </select>
      <label style={{fontSize:12,fontFamily:T.font,color:T.textSec}}>Min Score:
        <input type="range" min={0} max={100} value={minScore} onChange={e=>{setMinScore(+e.target.value);setPage(0);}} style={{marginLeft:6,verticalAlign:'middle',width:80}}/>
        <span style={{fontFamily:T.mono,marginLeft:4}}>{minScore}</span>
      </label>
      <div style={{marginLeft:'auto',display:'flex',gap:8}}>
        <button style={btn(compareMode)} onClick={()=>{setCompareMode(!compareMode);if(compareMode)setCompareIds([]);}}>
          {compareMode?`Compare (${compareIds.length}/3)`:'Compare Mode'}
        </button>
      </div>
    </div>

    <div style={{display:'flex',gap:16}}>
      {/* Table */}
      <div style={{flex:selected||comparedSuppliers.length>1?'0 0 54%':'1',overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.border}`}}>
            {compareMode&&<th style={{padding:'8px 4px',textAlign:'center',width:28}}>Sel</th>}
            <th style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',minWidth:100}} onClick={()=>toggleSort('name')}>Supplier{sortArrow('name')}</th>
            <th style={{padding:'8px 6px',cursor:'pointer'}} onClick={()=>toggleSort('industry')}>Industry{sortArrow('industry')}</th>
            <th style={{padding:'8px 6px',cursor:'pointer',fontSize:10}} onClick={()=>toggleSort('country')}>Country</th>
            {DIM_KEYS.map((k,idx)=><th key={k} style={{padding:'8px 3px',cursor:'pointer',fontSize:10,textAlign:'center'}} onClick={()=>toggleSort(k)}>{DIMS[idx].slice(0,4)}</th>)}
            <th style={{padding:'8px 6px',cursor:'pointer',textAlign:'center'}} onClick={()=>toggleSort('composite')}>Score{sortArrow('composite')}</th>
            <th style={{padding:'8px 6px',textAlign:'center'}}>Tier</th>
            <th style={{padding:'8px 6px',textAlign:'center',cursor:'pointer'}} onClick={()=>toggleSort('spend')}>Spend{sortArrow('spend')}</th>
          </tr></thead>
          <tbody>{paged.map(s=>{
            const isSelected=selected?.id===s.id;
            return(<tr key={s.id} onClick={()=>!compareMode&&setSelected(isSelected?null:s)}
              style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:isSelected?T.gold+'12':'transparent',transition:'background 0.15s'}}>
              {compareMode&&<td style={{textAlign:'center',padding:4}}><input type="checkbox" checked={compareIds.includes(s.id)} onChange={()=>toggleCompare(s.id)}/></td>}
              <td style={{padding:'7px 6px',fontWeight:600,color:T.navy,whiteSpace:'nowrap'}}>{s.name}</td>
              <td style={{padding:'7px 6px',color:T.textSec,fontSize:11}}>{s.industry}</td>
              <td style={{padding:'7px 6px',color:T.textSec,fontSize:10}}>{s.country}</td>
              {s.scores.map((sc,idx)=><td key={idx} style={{textAlign:'center',padding:'7px 2px',fontFamily:T.mono,fontSize:11,color:sc>=70?T.green:sc>=50?T.amber:T.red}}>{sc}</td>)}
              <td style={{textAlign:'center',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{s.composite}</td>
              <td style={{textAlign:'center'}}><span style={pill(s.tier,TIER_COLORS[s.tier])}>{s.tier}</span></td>
              <td style={{textAlign:'center',fontFamily:T.mono,fontSize:11}}>${s.spend}k</td>
            </tr>);
          })}</tbody>
        </table>
        {totalPages>1&&<div style={{display:'flex',justifyContent:'center',gap:8,padding:12}}>
          <button style={btn(false)} onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0}>Prev</button>
          <span style={{fontSize:12,fontFamily:T.mono,lineHeight:'32px'}}>{page+1} / {totalPages}</span>
          <button style={btn(false)} onClick={()=>setPage(Math.min(totalPages-1,page+1))} disabled={page>=totalPages-1}>Next</button>
        </div>}
      </div>

      {/* Side panel — single supplier detail */}
      {selected&&!compareMode&&<div style={{flex:'0 0 44%',...card,maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div>
            <h4 style={{margin:0,color:T.navy,fontFamily:T.font}}>{selected.name}</h4>
            <div style={{fontSize:11,color:T.textSec}}>{selected.industry} &middot; {selected.country} &middot; Est. {selected.founded}</div>
          </div>
          <span style={pill(selected.tier,TIER_COLORS[selected.tier])}>{selected.tier}</span>
        </div>

        {/* Detail sub-tabs */}
        <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:12}}>
          {['overview','metrics','risk','history'].map(dt=>(
            <button key={dt} onClick={()=>setDetailTab(dt)} style={{
              padding:'6px 14px',fontSize:11,fontWeight:detailTab===dt?700:500,fontFamily:T.font,
              color:detailTab===dt?T.navy:T.textMut,background:'transparent',border:'none',cursor:'pointer',
              borderBottom:detailTab===dt?`2px solid ${T.gold}`:'2px solid transparent',marginBottom:-1,textTransform:'capitalize'
            }}>{dt}</button>
          ))}
        </div>

        {detailTab==='overview'&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
            <div><span style={{fontSize:10,color:T.textMut}}>Spend</span><div style={{fontFamily:T.mono,fontSize:13,fontWeight:700}}>${selected.spend}k</div></div>
            <div><span style={{fontSize:10,color:T.textMut}}>Employees</span><div style={{fontFamily:T.mono,fontSize:13}}>{selected.employees.toLocaleString()}</div></div>
            <div><span style={{fontSize:10,color:T.textMut}}>Engagements</span><div style={{fontFamily:T.mono,fontSize:13}}>{selected.engagementCount}</div></div>
            <div><span style={{fontSize:10,color:T.textMut}}>Contact</span><div style={{fontSize:11}}>{selected.contactName}</div></div>
            <div><span style={{fontSize:10,color:T.textMut}}>Role</span><div style={{fontSize:11}}>{selected.contactRole}</div></div>
            <div><span style={{fontSize:10,color:T.textMut}}>Response Time</span><div style={{fontFamily:T.mono,fontSize:13}}>{selected.responseTime}d</div></div>
          </div>

          <h5 style={{margin:'8px 0 4px',fontSize:12,color:T.textSec}}>6-Dimension Radar</h5>
          <div style={{height:210}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData(selected)}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
                <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/>
                <Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
            {selected.certs.map(c=><span key={c} style={{...pill(c,T.sage),fontSize:9,padding:'1px 6px'}}>{c}</span>)}
            {selected.certs.length===0&&<span style={{fontSize:11,color:T.textMut}}>No certifications on file</span>}
          </div>

          {/* Procurement weight */}
          <div style={{background:T.surfaceH,borderRadius:8,padding:10,marginTop:8}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:4}}>Risk-Adjusted Procurement Weight</div>
            <div style={{display:'flex',gap:16,alignItems:'center'}}>
              <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:T.gold}}>{procurementWeight(selected)}</div>
              <div style={{fontSize:10,color:T.textMut}}>
                ESG({selected.composite})&times;0.4 + Safety({100-selected.riskScore})&times;0.3 + Spend&times;0.3
              </div>
            </div>
          </div>
        </>}

        {detailTab==='metrics'&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['Carbon Intensity',`${selected.carbonIntensity} tCO2e/M$`,selected.carbonIntensity<80?T.green:selected.carbonIntensity<130?T.amber:T.red],
              ['Water Usage',`${selected.waterUsage} m\u00B3/yr`,selected.waterUsage<400?T.green:T.amber],
              ['Waste Recycled',`${selected.wasteRecycled}%`,selected.wasteRecycled>60?T.green:T.amber],
              ['Renewable Energy',`${selected.renewableEnergy}%`,selected.renewableEnergy>50?T.green:T.amber],
              ['Gender Diversity',`${selected.genderDiversity}%`,selected.genderDiversity>35?T.green:T.amber],
              ['Safety Incidents',selected.safetyIncidents,selected.safetyIncidents<3?T.green:selected.safetyIncidents<6?T.amber:T.red],
              ['Improvement Rate',`${selected.improvementRate>0?'+':''}${selected.improvementRate}%/yr`,selected.improvementRate>5?T.green:T.amber],
              ['Next Audit',selected.nextAudit,T.navy]
            ].map(([l,v,c])=>(
              <div key={l} style={{padding:8,background:T.surfaceH,borderRadius:6}}>
                <div style={{fontSize:10,color:T.textMut}}>{l}</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </>}

        {detailTab==='risk'&&<>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Risk Score: <span style={{fontWeight:700,color:selected.riskScore>60?T.red:selected.riskScore>35?T.amber:T.green}}>{selected.riskScore}/100</span></div>
          <h5 style={{margin:'8px 0 4px',fontSize:12,color:T.textSec}}>Identified Risk Categories</h5>
          {selected.risks.map(r=>(
            <div key={r} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.border}20`}}>
              <span style={{width:8,height:8,borderRadius:4,background:T.red,flexShrink:0}}/>
              <span style={{fontSize:12}}>{r}</span>
            </div>
          ))}
          {selected.risks.length===0&&<div style={{fontSize:11,color:T.textMut,padding:8}}>No active risk flags</div>}
          <div style={{marginTop:12}}>
            <h5 style={{margin:'0 0 4px',fontSize:12,color:T.textSec}}>Dimension Scores vs Tier Thresholds</h5>
            {DIMS.map((d,idx)=>(
              <div key={d} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:10,width:80,color:T.textSec}}>{d}</span>
                <div style={{flex:1,background:T.surfaceH,borderRadius:4,height:14,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${selected.scores[idx]}%`,borderRadius:4,
                    background:selected.scores[idx]>=70?T.green+'88':selected.scores[idx]>=50?T.amber+'88':T.red+'88'}}/>
                </div>
                <span style={{fontSize:10,fontFamily:T.mono,width:28,textAlign:'right'}}>{selected.scores[idx]}</span>
              </div>
            ))}
          </div>
        </>}

        {detailTab==='history'&&<>
          <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>12-Quarter Score Trend</h5>
          <div style={{height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData(selected)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="q" tick={{fontSize:8}} interval={2}/>
                <YAxis domain={[20,100]} tick={{fontSize:9}}/>
                <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
                <Line type="monotone" dataKey="score" stroke={T.gold} strokeWidth={2} dot={{r:2,fill:T.gold}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <h5 style={{margin:'12px 0 4px',fontSize:12,color:T.textSec}}>Peer Comparison ({selected.industry})</h5>
          {(()=>{
            const peers=suppliers.filter(s=>s.industry===selected.industry).sort((a,b)=>b.composite-a.composite).slice(0,10);
            return <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{peers.map(p=>(
              <div key={p.id} style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontFamily:T.mono,
                background:p.id===selected.id?T.navy+'20':T.surfaceH,border:`1px solid ${p.id===selected.id?T.navy:T.border}`,
                color:p.id===selected.id?T.navy:T.textSec}}>
                {p.name.split('-')[1]}: {p.composite}
              </div>
            ))}</div>;
          })()}
          <div style={{fontSize:11,color:T.textSec,marginTop:12}}>
            Last engagement: {selected.lastEngagement} &middot; Total: {selected.engagementCount} &middot; Last audit: {selected.auditDate}
          </div>
        </>}
      </div>}

      {/* Compare mode panel */}
      {compareMode&&comparedSuppliers.length>1&&<div style={{flex:'0 0 44%',...card,maxHeight:'80vh',overflowY:'auto'}}>
        <h4 style={{margin:'0 0 12px',color:T.navy}}>Comparison ({comparedSuppliers.length} suppliers)</h4>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={DIMS.map((d,idx)=>{
              const o={dim:d};comparedSuppliers.forEach(s=>{o[s.name]=s.scores[idx];});return o;
            })}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/>
              {comparedSuppliers.map((s,i)=><Radar key={s.id} dataKey={s.name} stroke={[T.navy,T.gold,T.sage][i]} fill={[T.navy,T.gold,T.sage][i]} fillOpacity={0.12}/>)}
              <Legend wrapperStyle={{fontSize:10}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginTop:8}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            <th style={{textAlign:'left',padding:4,fontSize:10}}>Metric</th>
            {comparedSuppliers.map(s=><th key={s.id} style={{textAlign:'center',padding:4,fontSize:10,color:T.navy}}>{s.name}</th>)}
          </tr></thead>
          <tbody>
            {[...DIMS,'Composite','Weighted','Tier','Spend ($k)','Risk','Employees','Carbon Int.','Renewable %'].map((m,idx)=>(
              <tr key={m} style={{borderBottom:`1px solid ${T.border}20`}}>
                <td style={{padding:4,fontWeight:600,color:T.textSec,fontSize:10}}>{m}</td>
                {comparedSuppliers.map(s=><td key={s.id} style={{textAlign:'center',padding:4,fontFamily:T.mono,fontSize:11}}>
                  {idx<6?s.scores[idx]:idx===6?s.composite:idx===7?s.weighted:idx===8?s.tier:idx===9?s.spend:idx===10?s.riskScore:idx===11?s.employees:idx===12?s.carbonIntensity:s.renewableEnergy+'%'}
                </td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  </div>);
}

/* ── Tab 2: Engagement Pipeline ── */
function PipelineTab(){
  const[data,setData]=useState(engagements);
  const[showForm,setShowForm]=useState(false);
  const[formSupplier,setFormSupplier]=useState('');
  const[formStage,setFormStage]=useState(STAGES[0]);
  const[formAssignee,setFormAssignee]=useState(OWNERS[0]);
  const[selectedEng,setSelectedEng]=useState(null);
  const[viewMode,setViewMode]=useState('board');
  const[filterStage,setFilterStage]=useState('All');
  const[filterAssignee,setFilterAssignee]=useState('All');

  const filteredData=useMemo(()=>{
    let d=[...data];
    if(filterStage!=='All')d=d.filter(e=>e.stage===filterStage);
    if(filterAssignee!=='All')d=d.filter(e=>e.assignee===filterAssignee);
    return d;
  },[data,filterStage,filterAssignee]);

  const advance=(id)=>{setData(prev=>prev.map(e=>e.id===id&&e.stageIdx<5?{...e,stageIdx:e.stageIdx+1,stage:STAGES[e.stageIdx+1],daysInStage:0}:e));};
  const regress=(id)=>{setData(prev=>prev.map(e=>e.id===id&&e.stageIdx>0?{...e,stageIdx:e.stageIdx-1,stage:STAGES[e.stageIdx-1]}:e));};

  const addEngagement=()=>{
    if(!formSupplier)return;
    const sup=suppliers.find(s=>s.name===formSupplier)||suppliers[0];
    const newE={id:data.length+1,supplierId:sup.id,supplierName:sup.name,industry:sup.industry,country:sup.country,
      stage:formStage,stageIdx:STAGES.indexOf(formStage),priority:50,startDate:'2025-12-01',daysInStage:0,
      spend:sup.spend,riskScore:sup.riskScore,improvementPotential:40,notes:'New engagement created',assignee:formAssignee,
      questionnaireSections:6,responseRate:0,gapCount:0,activities:[],targetScore:70,currentDelta:0};
    setData([...data,newE]);setShowForm(false);setFormSupplier('');
  };

  const stageCounts=STAGES.map(st=>data.filter(e=>e.stage===st).length);
  const funnelMax=Math.max(...stageCounts,1);
  const avgTimeByStage=STAGES.map(st=>{const items=data.filter(e=>e.stage===st);return items.length?Math.round(items.reduce((a,e)=>a+e.daysInStage,0)/items.length):0;});
  const totalPriority=data.reduce((a,e)=>a+e.priority,0);
  const avgPriority=data.length?Math.round(totalPriority/data.length):0;
  const completionRate=Math.round(data.filter(e=>e.stageIdx>=5).length/data.length*100);

  return(<div>
    {/* KPIs */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
      {[['Active Engagements',data.length,T.navy],['Avg Priority',avgPriority,T.gold],['Completion Rate',completionRate+'%',T.green],['Avg Days in Stage',Math.round(data.reduce((a,e)=>a+e.daysInStage,0)/data.length),T.amber],['Pipeline Value','$'+Math.round(data.reduce((a,e)=>a+e.spend,0)/1000)+'M',T.sage]].map(([l,v,c])=>(
        <div key={l} style={{...card,textAlign:'center',padding:12}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:c}}>{v}</div>
          <div style={{fontSize:10,color:T.textMut}}>{l}</div>
        </div>
      ))}
    </div>

    <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
      <button style={btn(viewMode==='board')} onClick={()=>setViewMode('board')}>Board</button>
      <button style={btn(viewMode==='table')} onClick={()=>setViewMode('table')}>Table</button>
      <select style={inp} value={filterStage} onChange={e=>setFilterStage(e.target.value)}>
        <option value="All">All Stages</option>{STAGES.map(s=><option key={s}>{s}</option>)}
      </select>
      <select style={inp} value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}>
        <option value="All">All Assignees</option>{OWNERS.map(o=><option key={o}>{o}</option>)}
      </select>
      <button style={{...btn(true),marginLeft:'auto'}} onClick={()=>setShowForm(!showForm)}>+ New Engagement</button>
    </div>

    {/* New Engagement Form */}
    {showForm&&<div style={{...card,marginBottom:16,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
      <div><label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Supplier</label>
        <select style={inp} value={formSupplier} onChange={e=>setFormSupplier(e.target.value)}>
          <option value="">Select...</option>{suppliers.slice(0,60).map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
        </select></div>
      <div><label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Stage</label>
        <select style={inp} value={formStage} onChange={e=>setFormStage(e.target.value)}>
          {STAGES.map(s=><option key={s}>{s}</option>)}
        </select></div>
      <div><label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Assignee</label>
        <select style={inp} value={formAssignee} onChange={e=>setFormAssignee(e.target.value)}>
          {OWNERS.map(o=><option key={o}>{o}</option>)}
        </select></div>
      <button style={btn(true)} onClick={addEngagement}>Add</button>
      <button style={btn(false)} onClick={()=>setShowForm(false)}>Cancel</button>
    </div>}

    {/* Pipeline Funnel Visualization */}
    <div style={{...card,marginBottom:16}}>
      <h5 style={{margin:'0 0 10px',fontSize:12,color:T.textSec}}>Pipeline Funnel &amp; Time-in-Stage</h5>
      <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>
        {STAGES.map((st,idx)=>{
          const pct=stageCounts[idx]/funnelMax;
          return(<div key={st} style={{flex:1,textAlign:'center'}}>
            <div style={{background:STAGE_COLORS[idx]+'cc',borderRadius:4,height:Math.max(8,pct*60),marginBottom:4,transition:'height 0.3s',marginLeft:`${(1-pct)*20}%`,marginRight:`${(1-pct)*20}%`}}/>
            <div style={{fontSize:11,fontFamily:T.mono,fontWeight:700,color:STAGE_COLORS[idx]}}>{stageCounts[idx]}</div>
            <div style={{fontSize:9,color:T.textSec,fontWeight:600}}>{st}</div>
            <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{avgTimeByStage[idx]}d avg</div>
          </div>);
        })}
      </div>
    </div>

    {/* Board View */}
    {viewMode==='board'&&<div style={{display:'grid',gridTemplateColumns:`repeat(${STAGES.length},1fr)`,gap:8,overflowX:'auto'}}>
      {STAGES.map((st,stIdx)=>(
        <div key={st} style={{background:T.surfaceH,borderRadius:8,padding:8,minHeight:200}}>
          <div style={{fontSize:11,fontWeight:700,color:STAGE_COLORS[stIdx],marginBottom:8,fontFamily:T.mono,display:'flex',justifyContent:'space-between'}}>
            <span>{st.length>12?st.split(' ')[0]:st}</span>
            <span style={{fontWeight:400,color:T.textMut,background:STAGE_COLORS[stIdx]+'22',borderRadius:10,padding:'0 6px'}}>{filteredData.filter(e=>e.stage===st).length}</span>
          </div>
          {filteredData.filter(e=>e.stage===st).sort((a,b)=>b.priority-a.priority).map(e=>(
            <div key={e.id} style={{...card,marginBottom:6,padding:8,cursor:'pointer',borderLeft:`3px solid ${STAGE_COLORS[stIdx]}`,transition:'box-shadow 0.15s'}}
              onClick={()=>setSelectedEng(selectedEng?.id===e.id?null:e)}>
              <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{e.supplierName}</div>
              <div style={{fontSize:9,color:T.textMut}}>{e.industry} &middot; {e.assignee}</div>
              <div style={{fontSize:10,fontFamily:T.mono,color:T.textSec,marginTop:3}}>
                P:{e.priority} &middot; {e.daysInStage}d &middot; ${e.spend}k
              </div>
              <div style={{display:'flex',gap:4,marginTop:5}}>
                {e.stageIdx>0&&<button style={{...btn(false),padding:'1px 6px',fontSize:9}} onClick={ev=>{ev.stopPropagation();regress(e.id);}}>&#9664;</button>}
                {e.stageIdx<5&&<button style={{...btn(true),padding:'1px 6px',fontSize:9}} onClick={ev=>{ev.stopPropagation();advance(e.id);}}>&#9654; Next</button>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>}

    {/* Table View */}
    {viewMode==='table'&&<table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
      <thead><tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.border}`}}>
        {['ID','Supplier','Industry','Stage','Priority','Days','Assignee','Spend','Risk','Gaps','Actions'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',fontSize:11}}>{h}</th>)}
      </tr></thead>
      <tbody>{filteredData.sort((a,b)=>b.priority-a.priority).map(e=>(
        <tr key={e.id} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:selectedEng?.id===e.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedEng(selectedEng?.id===e.id?null:e)}>
          <td style={{padding:'6px',fontFamily:T.mono,fontSize:11}}>{e.id}</td>
          <td style={{padding:'6px',fontWeight:600,color:T.navy}}>{e.supplierName}</td>
          <td style={{padding:'6px',color:T.textSec,fontSize:11}}>{e.industry}</td>
          <td><span style={pill(e.stage,STAGE_COLORS[e.stageIdx])}>{e.stage}</span></td>
          <td style={{fontFamily:T.mono,textAlign:'center',fontWeight:700}}>{e.priority}</td>
          <td style={{fontFamily:T.mono,textAlign:'center',color:e.daysInStage>30?T.red:T.textSec}}>{e.daysInStage}</td>
          <td style={{color:T.textSec,fontSize:11}}>{e.assignee}</td>
          <td style={{fontFamily:T.mono}}>${e.spend}k</td>
          <td style={{fontFamily:T.mono,color:e.riskScore>60?T.red:e.riskScore>35?T.amber:T.green}}>{e.riskScore}</td>
          <td style={{fontFamily:T.mono,textAlign:'center'}}>{e.gapCount}</td>
          <td style={{display:'flex',gap:4,padding:6}}>
            {e.stageIdx>0&&<button style={{...btn(false),padding:'2px 6px',fontSize:10}} onClick={ev=>{ev.stopPropagation();regress(e.id);}}>&#9664;</button>}
            {e.stageIdx<5&&<button style={{...btn(true),padding:'2px 6px',fontSize:10}} onClick={ev=>{ev.stopPropagation();advance(e.id);}}>&#9654;</button>}
          </td>
        </tr>
      ))}</tbody>
    </table>}

    {/* Engagement Detail */}
    {selectedEng&&<div style={{...card,marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h4 style={{margin:0,color:T.navy}}>{selectedEng.supplierName} &mdash; Engagement #{selectedEng.id}</h4>
        <div style={{display:'flex',gap:8}}>
          <span style={pill(selectedEng.stage,STAGE_COLORS[selectedEng.stageIdx])}>{selectedEng.stage}</span>
          <button style={btn(false)} onClick={()=>setSelectedEng(null)}>Close</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginTop:12}}>
        {[['Priority',selectedEng.priority,T.navy],['Days in Stage',selectedEng.daysInStage,selectedEng.daysInStage>30?T.red:T.amber],['Spend ($k)',selectedEng.spend,T.gold],['Improvement',selectedEng.improvementPotential+'%',T.sage],['Response Rate',selectedEng.responseRate+'%',T.navyL]].map(([l,v,c])=>(
          <div key={l} style={{textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:c}}>{v}</div>
            <div style={{fontSize:10,color:T.textMut}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:12}}>
        <div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>
            <strong>Assignee:</strong> {selectedEng.assignee} &middot;
            <strong> Start:</strong> {selectedEng.startDate} &middot;
            <strong> Gaps:</strong> {selectedEng.gapCount}
          </div>
          <div style={{fontSize:12,color:T.textSec}}>
            <strong>Priority Score:</strong> <span style={{fontFamily:T.mono,fontWeight:700}}>{Math.round(selectedEng.spend*0.04+selectedEng.riskScore*0.4+selectedEng.improvementPotential*0.3)}</span>
            <span style={{color:T.textMut}}> (spend&times;risk&times;improvement)</span>
          </div>
          <div style={{fontSize:11,color:T.textMut,marginTop:4}}>{selectedEng.notes}</div>
          <div style={{fontSize:12,color:T.textSec,marginTop:8}}>
            <strong>Target Score:</strong> {selectedEng.targetScore} &middot;
            <strong> Current Delta:</strong> <span style={{color:selectedEng.currentDelta>=0?T.green:T.red}}>{selectedEng.currentDelta>0?'+':''}{selectedEng.currentDelta}</span>
          </div>
        </div>
        <div>
          <h5 style={{margin:'0 0 6px',fontSize:12,color:T.textSec}}>Activity Log</h5>
          {selectedEng.activities.slice(0,5).map((a,i)=>(
            <div key={i} style={{display:'flex',gap:8,padding:'3px 0',borderBottom:`1px solid ${T.border}15`}}>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,width:70,flexShrink:0}}>{a.date}</span>
              <span style={{fontSize:10,fontWeight:600,color:T.navyL,width:60,flexShrink:0}}>{a.type}</span>
              <span style={{fontSize:10,color:T.textSec}}>{a.note}</span>
            </div>
          ))}
          {selectedEng.activities.length===0&&<div style={{fontSize:11,color:T.textMut}}>No activities recorded</div>}
        </div>
      </div>
    </div>}
  </div>);
}

/* ── Tab 3: Corrective Action Tracker ── */
function ActionTrackerTab(){
  const[filterStatus,setFilterStatus]=useState('All');
  const[filterType,setFilterType]=useState('All');
  const[filterSeverity,setFilterSeverity]=useState('All');
  const[selectedAction,setSelectedAction]=useState(null);
  const[sortKey,setSortKey]=useState('id');
  const[sortDir,setSortDir]=useState('asc');
  const[detailView,setDetailView]=useState('overview');

  const filtered=useMemo(()=>{
    let d=[...actions];
    if(filterStatus!=='All')d=d.filter(a=>a.status===filterStatus);
    if(filterType!=='All')d=d.filter(a=>a.type===filterType);
    if(filterSeverity!=='All')d=d.filter(a=>a.severity===filterSeverity);
    d.sort((a,b)=>{
      const ak=typeof a[sortKey]==='number'?a[sortKey]:String(a[sortKey]||'');
      const bk=typeof b[sortKey]==='number'?b[sortKey]:String(b[sortKey]||'');
      if(typeof ak==='number')return sortDir==='asc'?ak-bk:bk-ak;
      return sortDir==='asc'?ak.localeCompare(bk):bk.localeCompare(ak);
    });
    return d;
  },[filterStatus,filterType,filterSeverity,sortKey,sortDir]);

  const overdue=actions.filter(a=>a.status==='Overdue').length;
  const closed=actions.filter(a=>a.status==='Closed').length;
  const avgEffectiveness=Math.round(actions.reduce((a,c)=>a+c.effectiveness,0)/actions.length);
  const criticalCount=actions.filter(a=>a.severity==='Critical').length;
  const severityColors={Critical:T.red,High:T.amber,Medium:'#3b82f6',Low:T.green};

  const effectivenessByType=ACTION_TYPES.map(t=>{
    const items=actions.filter(a=>a.type===t);
    return{type:t,avg:items.length?Math.round(items.reduce((a,c)=>a+c.effectiveness,0)/items.length):0,count:items.length};
  });

  return(<div>
    {/* KPI Strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:16}}>
      {[['Total',actions.length,T.navy],['Open',actions.filter(a=>a.status==='Open').length,'#3b82f6'],['In Progress',actions.filter(a=>a.status==='In Progress').length,T.amber],['Overdue',overdue,T.red],['Closed',closed,T.green],['Critical',criticalCount,T.red]].map(([l,v,c])=>(
        <div key={l} style={{...card,textAlign:'center',padding:10}}>
          <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color:c}}>{v}</div>
          <div style={{fontSize:10,color:T.textMut}}>{l}</div>
        </div>
      ))}
    </div>

    {/* Overdue Alerts */}
    {overdue>0&&<div style={{background:T.red+'10',border:`1px solid ${T.red}33`,borderRadius:8,padding:12,marginBottom:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      <span style={{fontSize:16}}>&#9888;</span>
      <span style={{fontSize:12,color:T.red,fontWeight:600}}>{overdue} overdue corrective actions requiring escalation</span>
      <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>Avg effectiveness: {avgEffectiveness}% | Avg cost: ${Math.round(actions.reduce((a,c)=>a+parseInt(c.estimatedCost),0)/actions.length)}k</span>
    </div>}

    {/* Effectiveness by Action Type */}
    <div style={{...card,marginBottom:16}}>
      <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Action Effectiveness by Type</h5>
      <div style={{height:120}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={effectivenessByType}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="type" tick={{fontSize:10}}/>
            <YAxis domain={[0,100]} tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Bar dataKey="avg" radius={[4,4,0,0]}>
              {effectivenessByType.map((e,i)=><Cell key={i} fill={e.avg>=60?T.sage:e.avg>=40?T.gold:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Filters */}
    <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
      <select style={inp} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
        <option value="All">All Statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}
      </select>
      <select style={inp} value={filterType} onChange={e=>setFilterType(e.target.value)}>
        <option value="All">All Types</option>{ACTION_TYPES.map(t=><option key={t}>{t}</option>)}
      </select>
      <select style={inp} value={filterSeverity} onChange={e=>setFilterSeverity(e.target.value)}>
        <option value="All">All Severities</option>{['Critical','High','Medium','Low'].map(s=><option key={s}>{s}</option>)}
      </select>
      <span style={{fontSize:12,fontFamily:T.mono,color:T.textMut,lineHeight:'32px',marginLeft:'auto'}}>{filtered.length} actions</span>
    </div>

    <div style={{display:'flex',gap:16}}>
      {/* Actions table */}
      <div style={{flex:selectedAction?'0 0 54%':'1',overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.border}`}}>
            {[['id','ID'],['supplierName','Supplier'],['type','Type'],['severity','Sev.'],['deadline','Deadline'],['owner','Owner'],['status','Status'],['effectiveness','Eff.'],['impactScore','Impact']].map(([k,h])=>(
              <th key={k} style={{padding:'8px 5px',textAlign:'left',cursor:'pointer',fontSize:11}} onClick={()=>{
                if(sortKey===k)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(k);setSortDir('asc');}
              }}>{h}{sortKey===k?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.map(a=>(
            <tr key={a.id} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:selectedAction?.id===a.id?T.surfaceH:'transparent'}}
              onClick={()=>{setSelectedAction(selectedAction?.id===a.id?null:a);setDetailView('overview');}}>
              <td style={{padding:'6px 5px',fontFamily:T.mono,fontSize:11}}>CA-{String(a.id).padStart(3,'0')}</td>
              <td style={{padding:'6px 5px',fontWeight:600,color:T.navy,fontSize:11}}>{a.supplierName}</td>
              <td style={{padding:'6px 5px',color:T.textSec,fontSize:11}}>{a.type}</td>
              <td><span style={pill(a.severity,severityColors[a.severity])}>{a.severity}</span></td>
              <td style={{fontFamily:T.mono,fontSize:10}}>{a.deadline}</td>
              <td style={{color:T.textSec,fontSize:11}}>{a.owner}</td>
              <td><span style={pill(a.status,STATUS_COLORS[a.status])}>{a.status}</span></td>
              <td style={{fontFamily:T.mono,textAlign:'center',color:a.effectiveness>=60?T.green:a.effectiveness>=40?T.amber:T.red}}>{a.effectiveness}%</td>
              <td style={{fontFamily:T.mono,textAlign:'center',fontSize:11}}>{a.impactScore}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Action detail panel */}
      {selectedAction&&<div style={{flex:'0 0 44%',...card,maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <h4 style={{margin:0,color:T.navy}}>CA-{String(selectedAction.id).padStart(3,'0')}</h4>
          <div style={{display:'flex',gap:6}}>
            <span style={pill(selectedAction.severity,severityColors[selectedAction.severity])}>{selectedAction.severity}</span>
            <span style={pill(selectedAction.status,STATUS_COLORS[selectedAction.status])}>{selectedAction.status}</span>
          </div>
        </div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>{selectedAction.supplierName} &middot; {selectedAction.type} &middot; {selectedAction.dimension}</div>

        {/* Detail sub-tabs */}
        <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:12}}>
          {['overview','milestones','updates','evidence'].map(dt=>(
            <button key={dt} onClick={()=>setDetailView(dt)} style={{
              padding:'5px 12px',fontSize:10,fontWeight:detailView===dt?700:500,fontFamily:T.font,
              color:detailView===dt?T.navy:T.textMut,background:'transparent',border:'none',cursor:'pointer',
              borderBottom:detailView===dt?`2px solid ${T.gold}`:'2px solid transparent',marginBottom:-1,textTransform:'capitalize'
            }}>{dt}</button>
          ))}
        </div>

        {detailView==='overview'&&<>
          <div style={{fontSize:11,color:T.textMut,marginBottom:10}}>{selectedAction.description}</div>

          {/* Timeline bar */}
          <h5 style={{margin:'0 0 6px',fontSize:11,color:T.textSec}}>Timeline Progress</h5>
          <div style={{background:T.surfaceH,borderRadius:6,height:24,position:'relative',marginBottom:12,overflow:'hidden'}}>
            <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${Math.min(100,selectedAction.daysElapsed/selectedAction.daysTotal*100)}%`,
              background:selectedAction.status==='Overdue'?T.red+'88':selectedAction.status==='Closed'?T.green+'88':T.gold+'88',borderRadius:6,transition:'width 0.3s'}}/>
            <div style={{position:'absolute',left:'50%',top:3,transform:'translateX(-50%)',fontSize:10,fontFamily:T.mono,color:T.navy}}>
              {selectedAction.daysElapsed} / {selectedAction.daysTotal} days ({Math.round(selectedAction.daysElapsed/selectedAction.daysTotal*100)}%)
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {[['Deadline',selectedAction.deadline],['Owner',selectedAction.owner],['Root Cause',selectedAction.rootCause],
              ['Est. Cost',selectedAction.estimatedCost],['Actual Cost',selectedAction.actualCost],['Impact Score',selectedAction.impactScore],
              ['Effectiveness',selectedAction.effectiveness+'%'],['Verification',selectedAction.verificationStatus],['Linked Eng.',`#${selectedAction.linkedEngagement}`]
            ].map(([l,v])=>(
              <div key={l} style={{padding:6,background:T.surfaceH,borderRadius:6}}>
                <div style={{fontSize:9,color:T.textMut}}>{l}</div>
                <div style={{fontSize:12,fontFamily:T.mono,fontWeight:600}}>{v}</div>
              </div>
            ))}
          </div>
        </>}

        {detailView==='milestones'&&<>
          {selectedAction.milestones.map((m,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}20`}}>
              <span style={{fontSize:16,color:m.done?T.green:T.textMut,flexShrink:0}}>{m.done?'\u2713':'\u25CB'}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:m.done?T.text:T.textMut,fontWeight:m.done?400:500}}>{m.name}</div>
                <div style={{fontSize:10,color:T.textMut}}>{m.owner} &middot; {m.date}</div>
              </div>
            </div>
          ))}
          <div style={{marginTop:8,fontSize:11,color:T.textMut}}>
            {selectedAction.milestones.filter(m=>m.done).length}/{selectedAction.milestones.length} milestones completed
          </div>
        </>}

        {detailView==='updates'&&<>
          {selectedAction.updates.map((u,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}20`}}>
              <div style={{display:'flex',gap:8,marginBottom:2}}>
                <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{u.date}</span>
                <span style={{fontSize:10,fontWeight:600,color:T.navyL}}>{u.author}</span>
              </div>
              <div style={{fontSize:11,color:T.textSec}}>{u.text}</div>
            </div>
          ))}
          {selectedAction.updates.length===0&&<div style={{fontSize:11,color:T.textMut}}>No updates recorded</div>}
        </>}

        {detailView==='evidence'&&<>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>{selectedAction.evidence} file(s) attached</div>
            {Array.from({length:selectedAction.evidence},(_,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'6px 8px',background:T.surfaceH,borderRadius:6,marginBottom:4}}>
                <span style={{fontSize:12}}>&#128196;</span>
                <span style={{fontSize:11,flex:1}}>evidence_doc_{selectedAction.id}_{i+1}.pdf</span>
                <span style={{fontSize:10,color:T.textMut}}>2.{i+1} MB</span>
              </div>
            ))}
          </div>
          <div style={{padding:16,background:T.surfaceH,borderRadius:8,border:`2px dashed ${T.border}`,textAlign:'center'}}>
            <div style={{fontSize:12,color:T.textMut}}>Drop evidence files here (simulated)</div>
            <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Accepted: PDF, DOCX, XLSX, JPG, PNG</div>
          </div>
        </>}
      </div>}
    </div>

    {/* Gantt Overview */}
    <div style={{...card,marginTop:16}}>
      <h5 style={{margin:'0 0 10px',fontSize:12,color:T.textSec}}>Corrective Actions Timeline Overview (Top 20)</h5>
      <div style={{overflowX:'auto'}}>
        {actions.slice(0,20).map(a=>(
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
            <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec,width:60,flexShrink:0}}>CA-{String(a.id).padStart(3,'0')}</span>
            <span style={{fontSize:9,color:T.textSec,width:80,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.supplierName}</span>
            <span style={{...pill(a.severity,severityColors[a.severity]),fontSize:8,padding:'0px 5px',flexShrink:0}}>{a.severity.charAt(0)}</span>
            <div style={{flex:1,background:T.surfaceH,borderRadius:3,height:12,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:0,top:0,height:'100%',borderRadius:3,
                width:`${Math.min(100,a.daysElapsed/a.daysTotal*100)}%`,
                background:STATUS_COLORS[a.status]+'88'}}/>
            </div>
            <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut,width:55,textAlign:'right'}}>{a.daysElapsed}d/{a.daysTotal}d</span>
            <span style={{...pill(a.status,STATUS_COLORS[a.status]),fontSize:8,padding:'0px 5px'}}>{a.status.charAt(0)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

/* ── Tab 4: Benchmarking & Reporting ── */
function BenchmarkingTab(){
  const[reportType,setReportType]=useState(null);
  const[benchView,setBenchView]=useState('industry');

  const industryBenchmarks=INDUSTRIES.map(ind=>{
    const sups=suppliers.filter(s=>s.industry===ind);
    const avg=sups.length?Math.round(sups.reduce((a,s)=>a+s.composite,0)/sups.length):0;
    const dimAvgs=DIMS.map((_,di)=>sups.length?Math.round(sups.reduce((a,s)=>a+s.scores[di],0)/sups.length):0);
    return{industry:ind,avgScore:avg,count:sups.length,dimAvgs,bestScore:sups.length?Math.max(...sups.map(s=>s.composite)):0,worstScore:sups.length?Math.min(...sups.map(s=>s.composite)):0};
  }).sort((a,b)=>b.avgScore-a.avgScore);

  const countryBenchmarks=COUNTRIES.map(c=>{
    const sups=suppliers.filter(s=>s.country===c);
    return{country:c,avgScore:sups.length?Math.round(sups.reduce((a,s)=>a+s.composite,0)/sups.length):0,count:sups.length,
      avgCarbon:sups.length?Math.round(sups.reduce((a,s)=>a+s.carbonIntensity,0)/sups.length):0};
  }).filter(c=>c.count>0).sort((a,b)=>b.avgScore-a.avgScore);

  const yoyTrend=QUARTERS.map((q,qi)=>{
    const avg=Math.round(suppliers.reduce((a,s)=>a+s.history[qi],0)/suppliers.length);
    const envAvg=Math.round(suppliers.reduce((a,s)=>a+Math.round(s.scores[0]-5+sr(qi*17+s.id)*10),0)/suppliers.length);
    return{quarter:q,avgScore:avg,envScore:envAvg};
  });

  const cdpMetrics=[
    {metric:'Suppliers Engaged',value:suppliers.length,target:200,unit:''},
    {metric:'Response Rate',value:Math.round(engagements.filter(e=>e.stageIdx>=2).length/engagements.length*100),target:80,unit:'%'},
    {metric:'Avg ESG Score',value:Math.round(suppliers.reduce((a,s)=>a+s.composite,0)/suppliers.length),target:70,unit:''},
    {metric:'Actions Closed',value:actions.filter(a=>a.status==='Closed').length,target:30,unit:''},
    {metric:'Verified',value:engagements.filter(e=>e.stageIdx===5).length,target:25,unit:''},
    {metric:'Platinum Tier',value:suppliers.filter(s=>s.tier==='Platinum').length,target:20,unit:''},
  ];

  const tierDist=TIERS.map(t=>({tier:t,count:suppliers.filter(s=>s.tier===t).length}));
  const TIER_PIE_COLORS=[TIER_COLORS.Platinum,TIER_COLORS.Gold,TIER_COLORS.Silver,TIER_COLORS.Bronze,TIER_COLORS.Red];

  const dimBenchmarks=DIMS.map((d,di)=>({
    dim:d,avg:Math.round(suppliers.reduce((a,s)=>a+s.scores[di],0)/suppliers.length),
    best:Math.max(...suppliers.map(s=>s.scores[di])),
    worst:Math.min(...suppliers.map(s=>s.scores[di]))
  }));

  const exportCSV=()=>{
    const header='ID,Name,Country,Industry,'+DIMS.join(',')+',Composite,Weighted,Tier,Spend,Risk,Carbon,Renewable%\n';
    const rows=suppliers.map(s=>`${s.id},${s.name},${s.country},${s.industry},${s.scores.join(',')},${s.composite},${s.weighted},${s.tier},${s.spend},${s.riskScore},${s.carbonIntensity},${s.renewableEnergy}`).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='supplier_esg_report.csv';a.click();URL.revokeObjectURL(url);
  };

  const REPORTS=[
    {id:'annual',name:'Annual Supplier ESG Report',desc:'Full-year ESG performance across all supplier tiers with trend analysis and improvement trajectories'},
    {id:'board',name:'Board Summary',desc:'Executive summary of supplier ESG programme KPIs, risk exposure, and strategic recommendations'},
    {id:'csddd',name:'CSDDD Compliance Report',desc:'EU Corporate Sustainability Due Diligence Directive reporting with value chain mapping'},
    {id:'ukmsa',name:'UK Modern Slavery Act Report',desc:'Annual statement on supply chain human rights due diligence and corrective measures'},
  ];

  const overallAvg=Math.round(suppliers.reduce((a,s)=>a+s.composite,0)/suppliers.length);

  return(<div>
    {/* View toggles */}
    <div style={{display:'flex',gap:8,marginBottom:16}}>
      {['industry','geography','dimensions','trend'].map(v=>(
        <button key={v} style={btn(benchView===v)} onClick={()=>setBenchView(v)}>
          {v.charAt(0).toUpperCase()+v.slice(1)}
        </button>
      ))}
    </div>

    {benchView==='industry'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Average ESG Score by Industry</h5>
        <div style={{height:320}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={industryBenchmarks} layout="vertical" margin={{left:90}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="industry" tick={{fontSize:10}} width={90}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}} formatter={(v,n)=>[v,n==='avgScore'?'Avg Score':'Best']}/>
              <Bar dataKey="avgScore" radius={[0,4,4,0]}>
                {industryBenchmarks.map((e,i)=><Cell key={i} fill={e.avgScore>=65?T.sage:e.avgScore>=50?T.gold:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card}>
        <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Industry Detail</h5>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            <th style={{textAlign:'left',padding:4}}>Industry</th>
            <th style={{textAlign:'center',padding:4}}>Count</th>
            <th style={{textAlign:'center',padding:4}}>Avg</th>
            <th style={{textAlign:'center',padding:4}}>Best</th>
            <th style={{textAlign:'center',padding:4}}>Worst</th>
          </tr></thead>
          <tbody>{industryBenchmarks.map(ib=>(
            <tr key={ib.industry} style={{borderBottom:`1px solid ${T.border}20`}}>
              <td style={{padding:4,fontWeight:600,color:T.navy}}>{ib.industry}</td>
              <td style={{textAlign:'center',fontFamily:T.mono}}>{ib.count}</td>
              <td style={{textAlign:'center',fontFamily:T.mono,fontWeight:700,color:ib.avgScore>=65?T.green:T.amber}}>{ib.avgScore}</td>
              <td style={{textAlign:'center',fontFamily:T.mono,color:T.green}}>{ib.bestScore}</td>
              <td style={{textAlign:'center',fontFamily:T.mono,color:T.red}}>{ib.worstScore}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>}

    {benchView==='geography'&&<div style={{...card,marginBottom:16}}>
      <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Average ESG Score by Country</h5>
      <div style={{height:400}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countryBenchmarks} layout="vertical" margin={{left:100}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/>
            <YAxis type="category" dataKey="country" tick={{fontSize:10}} width={100}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Bar dataKey="avgScore" name="ESG Score" radius={[0,4,4,0]}>
              {countryBenchmarks.map((e,i)=><Cell key={i} fill={e.avgScore>=65?T.navyL:e.avgScore>=50?T.gold:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>}

    {benchView==='dimensions'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Dimension Benchmarks (All Suppliers)</h5>
        <div style={{height:250}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={dimBenchmarks.map(d=>({dim:d.dim,avg:d.avg,best:d.best}))}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/>
              <Radar dataKey="avg" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Average"/>
              <Radar dataKey="best" stroke={T.gold} fill={T.gold} fillOpacity={0.1} name="Best"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card}>
        <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Dimension Score Distribution</h5>
        {dimBenchmarks.map(d=>(
          <div key={d.dim} style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
              <span style={{color:T.textSec,fontWeight:600}}>{d.dim}</span>
              <span style={{fontFamily:T.mono,color:T.navy}}>{d.avg} avg</span>
            </div>
            <div style={{background:T.surfaceH,borderRadius:4,height:16,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:`${d.worst}%`,right:`${100-d.best}%`,top:2,height:12,background:T.gold+'44',borderRadius:3}}/>
              <div style={{position:'absolute',left:`${d.avg-0.5}%`,top:0,width:3,height:'100%',background:T.navy,borderRadius:2}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.textMut}}>
              <span>Worst: {d.worst}</span><span>Best: {d.best}</span>
            </div>
          </div>
        ))}
      </div>
    </div>}

    {benchView==='trend'&&<div style={{...card,marginBottom:16}}>
      <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Year-over-Year Supplier ESG Improvement Trend</h5>
      <div style={{height:280}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={yoyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:9}} interval={1}/>
            <YAxis domain={[30,80]} tick={{fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="avgScore" stroke={T.navy} strokeWidth={2} dot={{fill:T.gold,r:3}} name="Composite Avg"/>
            <Line type="monotone" dataKey="envScore" stroke={T.sage} strokeWidth={1.5} strokeDasharray="4 4" dot={{r:2}} name="Environmental Avg"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>}

    {/* Tier Distribution + CDP */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>Tier Distribution</h5>
        <div style={{height:200}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tierDist} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={75} label={({tier,count})=>`${tier}: ${count}`} labelLine={false}>
                {tierDist.map((e,i)=><Cell key={i} fill={TIER_PIE_COLORS[i]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card}>
        <h5 style={{margin:'0 0 8px',fontSize:12,color:T.textSec}}>CDP Supply Chain Programme Metrics</h5>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {cdpMetrics.map(m=>{
            const val=typeof m.value==='number'?m.value:parseInt(m.value);
            const pct=Math.min(100,val/m.target*100);
            return(<div key={m.metric} style={{textAlign:'center',padding:8,background:T.surfaceH,borderRadius:8}}>
              <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:val>=m.target?T.green:T.amber}}>{m.value}{m.unit}</div>
              <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>{m.metric}</div>
              <div style={{background:T.border,borderRadius:4,height:6,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:4,width:`${pct}%`,background:val>=m.target?T.green:T.amber,transition:'width 0.3s'}}/>
              </div>
              <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,marginTop:2}}>Target: {m.target}</div>
            </div>);
          })}
        </div>
      </div>
    </div>

    {/* Reporting Templates */}
    <div style={{...card,marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h5 style={{margin:0,fontSize:12,color:T.textSec}}>Reporting Templates</h5>
        <div style={{display:'flex',gap:8}}>
          <button style={btn(true)} onClick={exportCSV}>Export CSV</button>
          <button style={btn(false)} onClick={()=>window.print()}>Print Preview</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
        {REPORTS.map(r=>(
          <div key={r.id} style={{padding:14,borderRadius:8,cursor:'pointer',border:`1px solid ${reportType===r.id?T.navy:T.border}`,background:reportType===r.id?T.navy+'08':T.surface,transition:'all 0.15s'}}
            onClick={()=>setReportType(reportType===r.id?null:r.id)}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{r.name}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:4}}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Report Preview */}
    {reportType&&<div style={{...card}}>
      <h5 style={{margin:'0 0 12px',fontSize:13,color:T.navy}}>
        {REPORTS.find(r=>r.id===reportType)?.name} &mdash; Preview
      </h5>
      <div style={{padding:16,background:T.surfaceH,borderRadius:8,fontFamily:T.mono,fontSize:11,color:T.textSec,lineHeight:1.9}}>
        <div style={{fontWeight:700,marginBottom:6,color:T.navy,fontSize:12}}>SUPPLIER ESG ENGAGEMENT REPORT</div>
        <div>Report Date: {new Date().toISOString().split('T')[0]}</div>
        <div>Reporting Period: Q1 2023 &ndash; Q4 2025</div>
        <div>Total Suppliers Assessed: {suppliers.length} across {COUNTRIES.length} countries</div>
        <div>Average Composite ESG Score: {overallAvg}/100</div>
        <div>Weighted Score (DIM-adjusted): {Math.round(suppliers.reduce((a,s)=>a+s.weighted,0)/suppliers.length)}/100</div>
        <div>Tier Breakdown: {TIERS.map(t=>`${t}: ${suppliers.filter(s=>s.tier===t).length}`).join(' | ')}</div>
        <div>Active Engagements: {engagements.length} | Pipeline Completion: {Math.round(engagements.filter(e=>e.stageIdx>=5).length/engagements.length*100)}%</div>
        <div>Corrective Actions: {actions.length} (Closed: {actions.filter(a=>a.status==='Closed').length}, Overdue: {actions.filter(a=>a.status==='Overdue').length})</div>
        <div>Industries: {INDUSTRIES.length} | Avg Carbon Intensity: {Math.round(suppliers.reduce((a,s)=>a+s.carbonIntensity,0)/suppliers.length)} tCO2e/M$</div>
        {reportType==='csddd'&&<>
          <div style={{marginTop:8,fontWeight:700,color:T.navy}}>CSDDD COMPLIANCE STATUS</div>
          <div>Due Diligence Coverage: {Math.round(suppliers.filter(s=>s.composite>=50).length/suppliers.length*100)}% of supply chain</div>
          <div>Human Rights Dimension Avg: {Math.round(suppliers.reduce((a,s)=>a+s.scores[4],0)/suppliers.length)}/100</div>
          <div>Environmental Dimension Avg: {Math.round(suppliers.reduce((a,s)=>a+s.scores[0],0)/suppliers.length)}/100</div>
          <div>Corrective Action Compliance: {Math.round(actions.filter(a=>a.status==='Closed').length/actions.length*100)}%</div>
          <div>Value Chain Risk Mapping: {suppliers.filter(s=>s.risks.length>0).length} suppliers with identified risks</div>
        </>}
        {reportType==='ukmsa'&&<>
          <div style={{marginTop:8,fontWeight:700,color:T.navy}}>UK MODERN SLAVERY ACT STATEMENT</div>
          <div>Suppliers Assessed for Modern Slavery Risk: {suppliers.length}</div>
          <div>Human Rights Score (avg): {Math.round(suppliers.reduce((a,s)=>a+s.scores[4],0)/suppliers.length)}/100</div>
          <div>High-Risk Suppliers Identified: {suppliers.filter(s=>s.scores[4]<40).length}</div>
          <div>Corrective Actions on Human Rights: {actions.filter(a=>a.dimension==='Human Rights').length}</div>
          <div>Labour Rights Risk Suppliers: {suppliers.filter(s=>s.risks.includes('Labour Rights')).length}</div>
        </>}
        {reportType==='board'&&<>
          <div style={{marginTop:8,fontWeight:700,color:T.navy}}>EXECUTIVE SUMMARY</div>
          <div>Programme Health: {overallAvg>=65?'Strong':overallAvg>=50?'Moderate':'At Risk'}</div>
          <div>Risk Exposure: {suppliers.filter(s=>s.tier==='Red').length} red-tier suppliers ({Math.round(suppliers.filter(s=>s.tier==='Red').length/suppliers.length*100)}%)</div>
          <div>YoY Improvement: {yoyTrend.length>=2?`${yoyTrend[yoyTrend.length-1].avgScore>yoyTrend[0].avgScore?'+':''}${yoyTrend[yoyTrend.length-1].avgScore-yoyTrend[0].avgScore}`:0} points</div>
          <div>Engagement Completion: {Math.round(engagements.filter(e=>e.stageIdx>=5).length/engagements.length*100)}%</div>
          <div>Total Spend Under Assessment: ${Math.round(suppliers.reduce((a,s)=>a+s.spend,0)/1000)}M</div>
        </>}
        {reportType==='annual'&&<>
          <div style={{marginTop:8,fontWeight:700,color:T.navy}}>ANNUAL PROGRAMME SUMMARY</div>
          <div>Suppliers by Tier: Platinum({suppliers.filter(s=>s.tier==='Platinum').length}) Gold({suppliers.filter(s=>s.tier==='Gold').length}) Silver({suppliers.filter(s=>s.tier==='Silver').length}) Bronze({suppliers.filter(s=>s.tier==='Bronze').length}) Red({suppliers.filter(s=>s.tier==='Red').length})</div>
          <div>Dimension Averages: {DIMS.map((d,i)=>`${d}: ${Math.round(suppliers.reduce((a,s)=>a+s.scores[i],0)/suppliers.length)}`).join(' | ')}</div>
          <div>Top Performing Industry: {industryBenchmarks[0]?.industry} ({industryBenchmarks[0]?.avgScore})</div>
          <div>Lowest Performing Industry: {industryBenchmarks[industryBenchmarks.length-1]?.industry} ({industryBenchmarks[industryBenchmarks.length-1]?.avgScore})</div>
          <div>Certification Coverage: {Math.round(suppliers.filter(s=>s.certs.length>0).length/suppliers.length*100)}% of suppliers hold at least one certification</div>
          <div>Renewable Energy Avg: {Math.round(suppliers.reduce((a,s)=>a+s.renewableEnergy,0)/suppliers.length)}%</div>
          <div>Safety Incidents Total: {suppliers.reduce((a,s)=>a+s.safetyIncidents,0)} across all suppliers</div>
        </>}
      </div>
    </div>}
  </div>);
}

/* ── Main Page Component ── */
export default function SupplierEngagementPage(){
  const[tab,setTab]=useState(0);

  const totalSuppliers=suppliers.length;
  const avgScore=Math.round(suppliers.reduce((a,s)=>a+s.composite,0)/suppliers.length);
  const activeEngagements=engagements.length;
  const overdueActions=actions.filter(a=>a.status==='Overdue').length;

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text}}>
      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'16px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.gold,letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>EP-AP2 &middot; Supplier Engagement</div>
            <h2 style={{margin:'2px 0 0',fontSize:20,fontWeight:700,color:T.navy}}>Supplier ESG Engagement &amp; Performance</h2>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>CRM-style supplier ESG engagement platform with scoring, benchmarking, and corrective action tracking</div>
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            {[[totalSuppliers,'Suppliers',T.navy],[avgScore,'Avg ESG',T.gold],[activeEngagements,'Engagements',T.sage],[overdueActions,'Overdue',T.red]].map(([v,l,c])=>(
              <div key={l} style={{textAlign:'right'}}>
                <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:c}}>{v}</div>
                <div style={{fontSize:10,color:T.textMut}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{height:2,background:`linear-gradient(90deg,${T.gold},${T.goldL},${T.gold})`}}/>

      {/* Tab Bar */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'0 24px',display:'flex',gap:0}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'12px 20px',fontSize:13,fontWeight:tab===i?700:500,fontFamily:T.font,
            color:tab===i?T.navy:T.textSec,background:'transparent',border:'none',cursor:'pointer',
            borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',marginBottom:-1,transition:'all 0.2s'
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{padding:24,maxWidth:1600,margin:'0 auto'}}>
        {tab===0&&<ScorecardTab/>}
        {tab===1&&<PipelineTab/>}
        {tab===2&&<ActionTrackerTab/>}
        {tab===3&&<BenchmarkingTab/>}
      </div>

      {/* Footer status bar */}
      <div style={{background:T.navy,padding:'8px 24px',display:'flex',gap:16,alignItems:'center',position:'sticky',bottom:0}}>
        <span style={{fontSize:10,fontFamily:T.mono,color:T.gold,letterSpacing:1}}>SUPPLIER-ENGAGEMENT</span>
        <span style={{fontSize:10,fontFamily:T.mono,color:'#ffffff77'}}>
          {totalSuppliers} suppliers &middot; {COUNTRIES.length} countries &middot; {INDUSTRIES.length} industries &middot;
          {activeEngagements} engagements &middot; {actions.length} corrective actions &middot;
          {QUARTERS.length} quarters tracked
        </span>
        <span style={{fontSize:10,fontFamily:T.mono,color:'#ffffff44',marginLeft:'auto'}}>v2.0.0 &middot; EP-AP2</span>
      </div>
    </div>
  );
}
