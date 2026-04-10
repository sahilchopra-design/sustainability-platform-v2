import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const SECTORS=['Construction','Agriculture','Mining','Manufacturing','Military','Transport','Utilities','Forestry','Oil & Gas','Logistics'];
const REGULATIONS=['ILO Heat Stress','OSHA Proposed Rule','EU Heat Directive','ISO 7243 WBGT','ACGIH TLV','Qatar Workers Welfare','Singapore WSH','India Labour Code'];
const COMPANY_PREFIXES=['Global','Trans','Apex','Nova','Prime','Stellar','Vertex','Omni','Crest','Meridian','Pacific','Nordic','Alpine','Quantum','Nexus','Pinnacle','Summit','Horizon','Zenith','Atlas',
'Titan','Orion','Eagle','Phoenix','Falcon','Condor','Frontier','Pioneer','Vanguard','Liberty','Compass','Heritage','Ironside','Bedrock','Keystone','Granite','Forge','Crown','Delta','Sierra',
'Continental','Paramount','Landmark','Anchor','Bastion','Sentinel','Citadel','Arsenal','Fortress','Rampart'];
const COMPANY_SUFFIXES=['Construction','Agri Group','Mining Corp','Manufacturing','Defence','Transport','Utilities','Forestry','Petroleum','Logistics',
'Industries','Engineering','Infrastructure','Resources','Holdings','Materials','Builders','Contractors','Services','Operations',
'Solutions','Enterprises','Systems','Technologies','Works','Development','Projects','Capital','Global','International'];
const COUNTRIES=['US','IN','SA','AE','QA','AU','BR','MX','CN','PH','ID','TH','NG','EG','PK','BD','KW','OM','BH','ZA'];

const genCompanies=(count)=>{
  const companies=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+501);const s2=sr(i*13+503);const s3=sr(i*19+507);const s4=sr(i*23+509);const s5=sr(i*29+511);const s6=sr(i*31+513);
    const sector=SECTORS[Math.floor(s1*SECTORS.length)];
    const name=COMPANY_PREFIXES[i%COMPANY_PREFIXES.length]+' '+COMPANY_SUFFIXES[Math.floor(s2*COMPANY_SUFFIXES.length)];
    const totalWorkforce=Math.floor(s3*50000+500);
    const outdoorPct=Math.floor(s4*70+10);
    const outdoorWorkers=Math.floor(totalWorkforce*outdoorPct/100);
    const wbgtExposureHrs=Math.floor(s5*2000+100);
    const country=COUNTRIES[Math.floor(s6*COUNTRIES.length)];
    const prodLossPct=+(sr(i*37+515)*12+1).toFixed(1);
    const annualCostM=Math.floor(sr(i*41+517)*50+1);
    const litigationRisk=Math.floor(sr(i*43+519)*100);
    const iloComplianceScore=Math.floor(sr(i*47+521)*100);
    const oshaComplianceScore=Math.floor(sr(i*53+523)*100);
    const euComplianceScore=Math.floor(sr(i*59+525)*100);
    const overallCompScore=Math.floor((iloComplianceScore+oshaComplianceScore+euComplianceScore)/3);
    const qTrend=QUARTERS.map((_,qi)=>({q:QUARTERS[qi],wbgt:+(26+qi*0.3+sr(i*61+qi*11)*3).toFixed(1),incidents:Math.floor(sr(i*67+qi*13)*20+1),prodLoss:+(prodLossPct*(0.85+qi*0.02+sr(i*71+qi*7)*0.1)).toFixed(1)}));
    const regScores=REGULATIONS.map((_,ri)=>({reg:REGULATIONS[ri],score:Math.floor(sr(i*73+ri*11+527)*100)}));
    const shiftOpt={currentShift:'Standard 8hr',optimalShift:sr(i*79+529)>0.5?'Split Shift (5am-10am, 3pm-7pm)':'Early Start (5am-1pm)',potentialSaving:+(sr(i*83+531)*5+1).toFixed(1)};
    const esgIntegration=Math.floor(sr(i*89+533)*100);
    const engagementPriority=litigationRisk>70?'Critical':litigationRisk>40?'High':litigationRisk>20?'Medium':'Low';
    companies.push({id:i,name,sector,totalWorkforce,outdoorPct,outdoorWorkers,wbgtExposureHrs,country,prodLossPct,annualCostM,litigationRisk,
      iloComplianceScore,oshaComplianceScore,euComplianceScore,overallCompScore,qTrend,regScores,shiftOpt,esgIntegration,engagementPriority,
      revenue:`$${Math.floor(sr(i*97+535)*40+1)}B`,
      riskTier:litigationRisk>70?'Critical':litigationRisk>40?'High':litigationRisk>20?'Medium':'Low'});
  }
  return companies;
};

const COMPANIES=genCompanies(100);

const pill=(color,text)=>(<span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>);
const tierColor=(t)=>t==='Critical'?T.red:t==='High'?T.amber:t==='Medium'?T.gold:T.green;
const fmt=(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const card=(s)=>({background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,...s});
const kpiBox=(label,value,sub,color)=>(<div style={card({flex:'1',minWidth:180,textAlign:'center'})}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||T.navy,margin:'4px 0'}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec}}>{sub}</div>}</div>);

export default function WorkerHeatStressPage(){
  const [tab,setTab]=useState(0);
  const [searchTerm,setSearchTerm]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [sortKey,setSortKey]=useState('litigationRisk');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCompany,setSelectedCompany]=useState(null);

  const TABS=['Worker Exposure Dashboard','Productivity & Cost Impact','Occupational Health Standards','Portfolio Worker Heat Risk'];

  const filtered=useMemo(()=>{
    let c=[...COMPANIES];
    if(searchTerm) c=c.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(sectorFilter!=='All') c=c.filter(x=>x.sector===sectorFilter);
    if(countryFilter!=='All') c=c.filter(x=>x.country===countryFilter);
    c.sort((a,b)=>sortDir==='desc'?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]);
    return c;
  },[searchTerm,sectorFilter,countryFilter,sortKey,sortDir]);

  const topKPIs=useMemo(()=>({
    totalOutdoor:COMPANIES.reduce((s,c)=>s+c.outdoorWorkers,0),
    criticalCount:COMPANIES.filter(c=>c.riskTier==='Critical').length,
    avgWBGT:+(COMPANIES.reduce((s,c)=>s+c.wbgtExposureHrs,0)/ Math.max(1, COMPANIES.length)).toFixed(0),
    avgProdLoss:+(COMPANIES.reduce((s,c)=>s+c.prodLossPct,0)/ Math.max(1, COMPANIES.length)).toFixed(1)
  }),[]);

  const sectorBenchmarks=useMemo(()=>SECTORS.map(sec=>{
    const sc=COMPANIES.filter(c=>c.sector===sec);
    if(!sc.length) return null;
    return{sector:sec,count:sc.length,avgOutdoorPct:Math.floor(sc.reduce((s,c)=>s+c.outdoorPct,0)/ Math.max(1, sc.length)),
      avgWBGT:Math.floor(sc.reduce((s,c)=>s+c.wbgtExposureHrs,0)/ Math.max(1, sc.length)),
      avgLitRisk:Math.floor(sc.reduce((s,c)=>s+c.litigationRisk,0)/ Math.max(1, sc.length)),
      totalCostM:sc.reduce((s,c)=>s+c.annualCostM,0),
      avgCompScore:Math.floor(sc.reduce((s,c)=>s+c.overallCompScore,0)/ Math.max(1, sc.length))};
  }).filter(Boolean),[]);

  const gdpLossBySector=useMemo(()=>sectorBenchmarks.map(sb=>({sector:sb.sector,totalCostM:sb.totalCostM,avgLoss:+(COMPANIES.filter(c=>c.sector===sb.sector).reduce((s,c)=>s+c.prodLossPct,0)/sb.count).toFixed(1)})),[sectorBenchmarks]);

  const tempProdCurve=useMemo(()=>{
    const pts=[];for(let t=20;t<=48;t+=2){const prod=t<=26?100:t<=30?100-(t-26)*3:t<=36?88-(t-30)*6:t<=42?52-(t-36)*7:Math.max(3,52-(t-36)*7);pts.push({temp:t,productivity:Math.max(0,Math.floor(prod))});}return pts;
  },[]);

  const regAgg=useMemo(()=>REGULATIONS.map(reg=>{
    const scores=COMPANIES.map(c=>c.regScores.find(r=>r.reg===reg)?.score||0);
    const avg=Math.floor(scores.reduce((s,v)=>s+v,0)/ Math.max(1, scores.length));
    const compliant=scores.filter(s=>s>=70).length;
    return{reg,avgScore:avg,compliantPct:Math.floor(compliant/ Math.max(1, scores.length)*100),nonCompliant:scores.filter(s=>s<40).length};
  }),[]);

  const portfolioData=useMemo(()=>[...COMPANIES].sort((a,b)=>b.litigationRisk-a.litigationRisk).slice(0,30).map(c=>({
    name:c.name,sector:c.sector,litRisk:c.litigationRisk,esg:c.esgIntegration,outdoorPct:c.outdoorPct,priority:c.engagementPriority
  })),[]);

  const sortToggle=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};
  const thStyle={padding:'8px 10px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
  const tdStyle={padding:'8px 10px',fontSize:13,borderBottom:`1px solid ${T.border}`};
  const detail=selectedCompany!==null?COMPANIES.find(c=>c.id===selectedCompany):null;

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Outdoor Workers',fmt(topKPIs.totalOutdoor),'Total exposed',T.red)}
        {kpiBox('Critical Companies',topKPIs.criticalCount,`of ${COMPANIES.length}`,T.red)}
        {kpiBox('Avg WBGT Exposure',topKPIs.avgWBGT+' hrs/yr','Mean exposure hours',T.amber)}
        {kpiBox('Avg Prod Loss',topKPIs.avgProdLoss+'%','Heat-related',T.gold)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input placeholder="Search company..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:160}}/>
        <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Sectors</option>{SECTORS.map(s=>(<option key={s} value={s}>{s}</option>))}
        </select>
        <select value={countryFilter} onChange={e=>setCountryFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Countries</option>{COUNTRIES.map(c=>(<option key={c} value={c}>{c}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>WBGT Exposure Hours by Company (top 25)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filtered.slice(0,25).map(c=>({name:c.name.split(' ').slice(0,2).join(' '),wbgt:c.wbgtExposureHrs,outdoor:c.outdoorPct}))} layout="vertical" margin={{left:100,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={95}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="wbgt" radius={[0,4,4,0]} name="WBGT Hrs/yr">
                {filtered.slice(0,25).map((c,i)=>(<Cell key={i} fill={c.wbgtExposureHrs>1500?T.red:c.wbgtExposureHrs>800?T.amber:T.gold}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Benchmarks</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sectorBenchmarks} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}} height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="avgOutdoorPct" fill={T.amber} radius={[4,4,0,0]} name="Avg Outdoor %"/>
              <Bar dataKey="avgLitRisk" fill={T.red} radius={[4,4,0,0]} name="Avg Litigation Risk"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Company Worker Exposure Table ({filtered.length} companies)</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Country</th>
              <th style={thStyle} onClick={()=>sortToggle('outdoorPct')}>Outdoor %</th>
              <th style={thStyle} onClick={()=>sortToggle('wbgtExposureHrs')}>WBGT Hrs</th>
              <th style={thStyle} onClick={()=>sortToggle('litigationRisk')}>Litigation Risk</th>
              <th style={thStyle} onClick={()=>sortToggle('prodLossPct')}>Prod Loss %</th>
              <th style={thStyle}>Risk Tier</th>
            </tr></thead>
            <tbody>{filtered.slice(0,50).map((c,i)=>(<tr key={c.id} onClick={()=>setSelectedCompany(c.id)} style={{cursor:'pointer',background:selectedCompany===c.id?T.surfaceH:'transparent'}}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600,fontSize:12}}>{c.name}</td>
              <td style={tdStyle}>{c.sector}</td><td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{c.country}</td>
              <td style={tdStyle}>{c.outdoorPct}%</td><td style={tdStyle}>{c.wbgtExposureHrs}</td>
              <td style={{...tdStyle,color:c.litigationRisk>70?T.red:c.litigationRisk>40?T.amber:T.text}}>{c.litigationRisk}/100</td>
              <td style={tdStyle}>{c.prodLossPct}%</td>
              <td style={tdStyle}>{pill(tierColor(c.riskTier),c.riskTier)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
      {detail&&(<div style={card({marginTop:16})}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:16,fontWeight:700,color:T.navy}}>{detail.name}</span> <span style={{fontSize:12,color:T.textMut,fontFamily:T.mono}}>{detail.sector} | {detail.country} | {fmt(detail.totalWorkforce)} workers</span></div>
          <button onClick={()=>setSelectedCompany(null)} style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${T.border}`,background:'transparent',cursor:'pointer',fontSize:12}}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={detail.qTrend} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Legend wrapperStyle={{fontSize:10}}/>
              <Line type="monotone" dataKey="wbgt" stroke={T.red} name="WBGT (C)" strokeWidth={2}/>
              <Line type="monotone" dataKey="incidents" stroke={T.amber} name="Incidents" strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Shift Optimization</div>
            <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
              <div>Current: <span style={{fontFamily:T.mono}}>{detail.shiftOpt.currentShift}</span></div>
              <div>Optimal: <span style={{fontFamily:T.mono,color:T.green}}>{detail.shiftOpt.optimalShift}</span></div>
              <div>Potential Saving: <span style={{fontWeight:700,color:T.green}}>{detail.shiftOpt.potentialSaving}% productivity gain</span></div>
            </div>
          </div>
        </div>
      </div>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Total Annual Cost',`$${fmt(COMPANIES.reduce((s,c)=>s+c.annualCostM,0)*1e6)}`,'Heat stress economic impact',T.red)}
        {kpiBox('Avg Prod Loss',topKPIs.avgProdLoss+'%','Across all companies',T.amber)}
        {kpiBox('Highest Loss Sector',[...gdpLossBySector].sort((a,b)=>b.avgLoss-a.avgLoss)[0]?.sector||'-',`${[...gdpLossBySector].sort((a,b)=>b.avgLoss-a.avgLoss)[0]?.avgLoss}% avg`,T.red)}
        {kpiBox('Shift Opt. Potential',`${(COMPANIES.reduce((s,c)=>s+c.shiftOpt.potentialSaving,0)/ Math.max(1, COMPANIES.length)).toFixed(1)}%`,'Avg productivity gain',T.green)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>GDP Loss by Sector ($M)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={[...gdpLossBySector].sort((a,b)=>b.totalCostM-a.totalCostM)} layout="vertical" margin={{left:100,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:10,fill:T.textSec}} width={95}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="totalCostM" fill={T.red} radius={[0,4,4,0]} name="Total Cost ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Temperature vs Productivity Curve</div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={tempProdCurve} margin={{top:5,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="temp" tick={{fontSize:10,fill:T.textSec}} label={{value:'WBGT Temperature (C)',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Productivity %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Area type="monotone" dataKey="productivity" stroke={T.red} fill={T.red+'20'} strokeWidth={2} name="Productivity %"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Quarterly Productivity Trend (Top 10 Companies by Loss)</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={QUARTERS.map((q,qi)=>({q,...Object.fromEntries([...COMPANIES].sort((a,b)=>b.prodLossPct-a.prodLossPct).slice(0,10).map(c=>[c.name.split(' ')[0],c.qTrend[qi].prodLoss]))}))} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Legend wrapperStyle={{fontSize:10}}/>
            {[...COMPANIES].sort((a,b)=>b.prodLossPct-a.prodLossPct).slice(0,10).map((c,i)=><Line key={i} type="monotone" dataKey={c.name.split(' ')[0]} stroke={[T.red,T.amber,T.gold,T.sage,T.navy,T.navyL,T.teal,'#9333ea','#0891b2','#be185d'][i]} strokeWidth={1.5} dot={false}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Shift Scheduling Optimization Opportunities</div>
        <div style={{overflowX:'auto',maxHeight:300,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Current Shift</th><th style={thStyle}>Optimal Shift</th><th style={thStyle}>Saving %</th><th style={thStyle}>Annual Cost ($M)</th>
            </tr></thead>
            <tbody>{[...COMPANIES].sort((a,b)=>b.shiftOpt.potentialSaving-a.shiftOpt.potentialSaving).slice(0,20).map(c=>(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600,fontSize:12}}>{c.name}</td><td style={tdStyle}>{c.sector}</td>
              <td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{c.shiftOpt.currentShift}</td>
              <td style={{...tdStyle,fontFamily:T.mono,fontSize:11,color:T.green}}>{c.shiftOpt.optimalShift}</td>
              <td style={{...tdStyle,color:T.green,fontWeight:600}}>+{c.shiftOpt.potentialSaving}%</td>
              <td style={tdStyle}>${c.annualCostM}M</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Standards Tracked',REGULATIONS.length,'Regulatory frameworks',T.navy)}
        {kpiBox('Avg Compliance',Math.floor(regAgg.reduce((s,r)=>s+r.avgScore,0)/ Math.max(1, regAgg.length))+'/100','Across all standards',T.gold)}
        {kpiBox('Non-Compliant Cos',COMPANIES.filter(c=>c.overallCompScore<40).length,'Score <40',T.red)}
        {kpiBox('Best Standard','ISO 7243',`${regAgg.find(r=>r.reg.includes('ISO'))?.compliantPct||0}% compliant`,T.green)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Compliance Rate by Standard</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={regAgg} layout="vertical" margin={{left:140,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <YAxis dataKey="reg" type="category" tick={{fontSize:10,fill:T.textSec}} width={135}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="avgScore" fill={T.sage} radius={[0,4,4,0]} name="Avg Score"/>
              <Bar dataKey="compliantPct" fill={T.gold} radius={[0,4,4,0]} name="Compliant %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Average Compliance Radar</div>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={sectorBenchmarks.slice(0,8).map(sb=>({sector:sb.sector,compliance:sb.avgCompScore,litRisk:sb.avgLitRisk,outdoor:sb.avgOutdoorPct}))}>
              <PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
              <Radar name="Compliance" dataKey="compliance" stroke={T.green} fill={T.green+'20'} strokeWidth={2}/>
              <Radar name="Litigation Risk" dataKey="litRisk" stroke={T.red} fill={T.red+'15'} strokeWidth={1.5} strokeDasharray="4 4"/>
              <Legend wrapperStyle={{fontSize:10}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Company Compliance Scoring (Lowest First)</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>ILO</th><th style={thStyle}>OSHA</th><th style={thStyle}>EU Dir.</th><th style={thStyle}>Overall</th><th style={thStyle}>Lit Risk</th><th style={thStyle}>Status</th>
            </tr></thead>
            <tbody>{[...COMPANIES].sort((a,b)=>a.overallCompScore-b.overallCompScore).slice(0,40).map(c=>(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600,fontSize:12}}>{c.name}</td><td style={tdStyle}>{c.sector}</td>
              <td style={{...tdStyle,color:c.iloComplianceScore<40?T.red:T.text}}>{c.iloComplianceScore}</td>
              <td style={{...tdStyle,color:c.oshaComplianceScore<40?T.red:T.text}}>{c.oshaComplianceScore}</td>
              <td style={{...tdStyle,color:c.euComplianceScore<40?T.red:T.text}}>{c.euComplianceScore}</td>
              <td style={{...tdStyle,fontWeight:700,color:c.overallCompScore<40?T.red:c.overallCompScore<60?T.amber:T.green}}>{c.overallCompScore}</td>
              <td style={tdStyle}>{c.litigationRisk}/100</td>
              <td style={tdStyle}>{pill(c.overallCompScore>=70?T.green:c.overallCompScore>=40?T.amber:T.red,c.overallCompScore>=70?'Compliant':c.overallCompScore>=40?'Partial':'Non-Compliant')}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Portfolio Companies',COMPANIES.length,'Worker heat exposure tracked',T.navy)}
        {kpiBox('Critical Exposure',COMPANIES.filter(c=>c.engagementPriority==='Critical').length,'Engagement needed',T.red)}
        {kpiBox('Avg ESG Integration',Math.floor(COMPANIES.reduce((s,c)=>s+c.esgIntegration,0)/ Math.max(1, COMPANIES.length))+'/100','Heat stress in ESG',T.gold)}
        {kpiBox('Total At-Risk Workers',fmt(COMPANIES.reduce((s,c)=>s+c.outdoorWorkers,0)),'Outdoor/industrial',T.amber)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Litigation Risk vs ESG Integration (top 30)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={portfolioData} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:7,fill:T.textSec,angle:-40,textAnchor:'end'}} height={70}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="litRisk" fill={T.red} radius={[4,4,0,0]} name="Litigation Risk"/>
              <Bar dataKey="esg" fill={T.sage} radius={[4,4,0,0]} name="ESG Integration"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Engagement Priority Distribution</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={['Critical','High','Medium','Low'].map(p=>({priority:p,count:COMPANIES.filter(c=>c.engagementPriority===p).length}))} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="priority" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="count" radius={[4,4,0,0]} name="Companies">
                {['Critical','High','Medium','Low'].map((p,i)=>(<Cell key={i} fill={tierColor(p)}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Portfolio Worker Heat Risk & Engagement Priorities</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Country</th>
              <th style={thStyle}>Outdoor %</th><th style={thStyle}>Lit Risk</th><th style={thStyle}>ESG Score</th><th style={thStyle}>Compliance</th><th style={thStyle}>Priority</th>
            </tr></thead>
            <tbody>{[...COMPANIES].sort((a,b)=>b.litigationRisk-a.litigationRisk).slice(0,50).map((c,i)=>(<tr key={c.id}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600,fontSize:12}}>{c.name}</td>
              <td style={tdStyle}>{c.sector}</td><td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{c.country}</td>
              <td style={tdStyle}>{c.outdoorPct}%</td>
              <td style={{...tdStyle,color:c.litigationRisk>70?T.red:T.text}}>{c.litigationRisk}</td>
              <td style={tdStyle}>{c.esgIntegration}</td>
              <td style={tdStyle}>{c.overallCompScore}/100</td>
              <td style={tdStyle}>{pill(tierColor(c.engagementPriority),c.engagementPriority)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Worker Heat Stress</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>100 companies - outdoor worker WBGT exposure, ILO/OSHA compliance, productivity loss, litigation risk & portfolio engagement</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>))}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        <div style={{marginTop:32,padding:'12px 16px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          EP-AU5 Worker Heat Stress | Sprint AU: Climate & Health Nexus Finance | {COMPANIES.length} companies, {SECTORS.length} sectors, {REGULATIONS.length} standards, {QUARTERS.length}Q trend
        </div>
      </div>
    </div>
  );
}