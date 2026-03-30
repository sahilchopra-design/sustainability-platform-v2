import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#dc2626';
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Screening','Country Risk','Enforcement Cases'];
const SECTORS=['All','Finance','Energy','Industrials','Technology','Mining','Aerospace','Commodities','Pharma','Telecom','Construction'];
const REGIONS=['All','Europe','North America','Asia Pacific','Middle East','Africa','Latin America'];
const RISK_LEVELS=['All','Critical','Very High','High','Elevated','Moderate','Low'];
const PAGE_SIZE=15;
const PIECLRS=[T.red,'#b91c1c',T.amber,T.gold,T.green,'#15803d',T.navy,T.navyL,T.sage,'#8b5cf6'];

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(220,38,38,0.12)':val>=mid?'rgba(217,119,6,0.12)':val>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const color=val>=hi?T.red:val>=mid?T.amber:val>=lo?T.gold:T.green;return{background:bg,color,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const riskBadge=(r)=>{const m={Critical:{bg:'rgba(220,38,38,0.12)',c:T.red},'Very High':{bg:'rgba(220,38,38,0.08)',c:'#b91c1c'},High:{bg:'rgba(217,119,6,0.12)',c:T.amber},Elevated:{bg:'rgba(197,169,106,0.15)',c:T.gold},Moderate:{bg:'rgba(22,163,74,0.12)',c:T.green},Low:{bg:'rgba(22,163,74,0.08)',c:'#15803d'}};const s=m[r]||m.Moderate;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

const COMPANIES=(()=>{const names=['GlobalBank Holdings','PetroNex Energy','Siemens AG','Glencore plc','Ericsson AB','Credit Suisse','ABB Ltd','Vitol Group','Airbus SE','Goldman Sachs','HSBC Holdings','Standard Chartered','Petrobras SA','Odebrecht SA','Rolls-Royce plc','BAE Systems','Samsung C&T','Telia Company','Fresenius Medical','Teva Pharma','Novartis AG','Deutsche Bank','BNP Paribas','JPMorgan Chase','SNC-Lavalin','Technip FMC','Saipem SpA','Halliburton Co','KBR Inc','Alcoa Corp','Rio Tinto plc','BHP Group','Vale SA','Total Energies','Shell plc','BP plc','Chevron Corp','Barclays plc','UBS Group','Citigroup Inc','Wells Fargo','Morgan Stanley','Unilever plc','Nestle SA','Roche Holding','Bayer AG','BASF SE','Dow Inc','3M Company','Caterpillar Inc','Deere & Co','General Electric','Honeywell Intl','Lockheed Martin','Raytheon Tech','Northrop Grumman','Thales SA','Leonardo SpA','Safran SA','MTU Aero','Iberdrola SA','Enel SpA','Engie SA','EDF Group','Orsted A/S','Volkswagen AG','BMW AG','Daimler Truck','Stellantis NV','Volvo Group','Anglo American','Freeport McMoRan','Newmont Corp','Barrick Gold','Antofagasta plc','First Quantum','Ivanhoe Mines','Vedanta Ltd','Adani Group','Reliance Ind'];
const secs=['Finance','Energy','Industrials','Commodities','Technology','Finance','Industrials','Commodities','Aerospace','Finance','Finance','Finance','Energy','Construction','Aerospace','Aerospace','Construction','Telecom','Pharma','Pharma','Pharma','Finance','Finance','Finance','Construction','Energy','Energy','Energy','Construction','Mining','Mining','Mining','Mining','Energy','Energy','Energy','Energy','Finance','Finance','Finance','Finance','Finance','Pharma','Pharma','Pharma','Pharma','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Aerospace','Aerospace','Aerospace','Aerospace','Aerospace','Aerospace','Aerospace','Energy','Energy','Energy','Energy','Energy','Industrials','Industrials','Industrials','Industrials','Industrials','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Commodities','Energy'];
const regs=['Europe','North America','Europe','Europe','Europe','Europe','Europe','Europe','Europe','North America','Europe','Europe','Latin America','Latin America','Europe','Europe','Asia Pacific','Europe','Europe','North America','Europe','Europe','Europe','North America','North America','Europe','Europe','North America','North America','North America','Europe','Europe','Latin America','Europe','Europe','Europe','North America','Europe','Europe','North America','North America','North America','Europe','Europe','Europe','Europe','Europe','North America','North America','North America','North America','North America','North America','North America','North America','North America','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','North America','North America','North America','Europe','Latin America','Africa','Asia Pacific','Asia Pacific','Asia Pacific'];
return names.map((n,i)=>({id:i+1,name:n,sector:secs[i]||'Industrials',region:regs[i]||'Europe',corruptionRisk:Math.round(15+sr(i*7)*75),fcpaCompliance:Math.round(40+sr(i*11)*55),ukBriberyAct:Math.round(35+sr(i*13)*60),pepExposure:Math.round(sr(i*17)*40),countryRisk:Math.round(20+sr(i*19)*70),thirdPartyRisk:Math.round(15+sr(i*23)*75),giftEntertainment:Math.round(sr(i*29)*50),whistleblower:Math.round(sr(i*31)*30),trainingRate:Math.round(40+sr(i*37)*58),dueDialCoverage:Math.round(30+sr(i*41)*65),fineHistory:Math.round(sr(i*43)*2000),enforcementActions:Math.floor(sr(i*47)*8),riskRating:sr(i*7)<0.15?'Critical':sr(i*7)<0.35?'Very High':sr(i*7)<0.55?'High':sr(i*7)<0.75?'Elevated':sr(i*7)<0.9?'Moderate':'Low',lastAudit:`202${Math.floor(3+sr(i*53)*3)}-${String(Math.floor(1+sr(i*59)*12)).padStart(2,'0')}`,controlEffectiveness:Math.round(25+sr(i*61)*70)}));})();

const COUNTRIES=(()=>{const names=['Venezuela','Yemen','Nigeria','Russia','Bangladesh','Mexico','Indonesia','India','Brazil','Turkey','Egypt','Kenya','Colombia','Philippines','Vietnam','Thailand','South Africa','Pakistan','Myanmar','Cambodia','Peru','Ghana','Tanzania','Uganda','Mozambique','Angola','DRC','Libya','Iraq','Afghanistan','Syria','Haiti','Honduras','Guatemala','Nicaragua','Ethiopia','Cameroon','Madagascar','Laos','Senegal','Ivory Coast','Mali','Niger','Chad','Burkina Faso','Guinea','Sierra Leone','Liberia','Mauritania','Zimbabwe'];
return names.map((n,i)=>({id:i+1,country:n,cpi:Math.round(10+sr(i*7)*55),briberyRisk:Math.round(30+sr(i*11)*65),procurementRisk:Math.round(35+sr(i*13)*60),judicialIndependence:Math.round(10+sr(i*17)*55),pressFreedom:Math.round(50+sr(i*19)*120),businessEnvironment:Math.round(20+sr(i*23)*65),ruleOfLaw:Math.round(10+sr(i*29)*60),regulatoryQuality:Math.round(15+sr(i*31)*55),politicalStability:Math.round(5+sr(i*37)*65),pepRisk:Math.round(30+sr(i*41)*65),moneyLaundering:Math.round(25+sr(i*43)*70),sanctionsRisk:sr(i*47)<0.2?'High':sr(i*47)<0.5?'Medium':'Low',rating:sr(i*7)<0.2?'Critical':sr(i*7)<0.4?'Very High':sr(i*7)<0.65?'High':sr(i*7)<0.85?'Elevated':'Moderate'}));})();

const ENFORCEMENT=(()=>{const cases=[{company:'Airbus SE',law:'Sapin II / FCPA',jurisdiction:'France/US/UK',fine:4000,dpa:'DPA',year:2020,sector:'Aerospace'},{company:'Goldman Sachs',law:'FCPA / 1MDB',jurisdiction:'US/Malaysia',fine:2900,dpa:'DPA',year:2020,sector:'Finance'},{company:'Siemens AG',law:'FCPA / StGB',jurisdiction:'US/Germany',fine:1600,dpa:'DPA',year:2008,sector:'Industrials'},{company:'Glencore plc',law:'FCPA / UKBA',jurisdiction:'US/UK/Brazil',fine:1500,dpa:'Guilty Plea',year:2022,sector:'Commodities'},{company:'Ericsson AB',law:'FCPA',jurisdiction:'US',fine:1060,dpa:'Guilty',year:2022,sector:'Technology'},{company:'Credit Suisse',law:'FCPA',jurisdiction:'US',fine:475,dpa:'DPA',year:2021,sector:'Finance'},{company:'ABB Ltd',law:'FCPA',jurisdiction:'US',fine:315,dpa:'DPA',year:2022,sector:'Industrials'},{company:'Vitol Group',law:'FCPA',jurisdiction:'US/Brazil',fine:164,dpa:'DPA',year:2020,sector:'Commodities'},{company:'Petrobras SA',law:'Car Wash',jurisdiction:'Brazil/US',fine:1780,dpa:'Settlement',year:2018,sector:'Energy'},{company:'Odebrecht SA',law:'FCPA / Lava Jato',jurisdiction:'Brazil/US/Switzerland',fine:3500,dpa:'Guilty Plea',year:2016,sector:'Construction'},{company:'Rolls-Royce plc',law:'UKBA',jurisdiction:'UK/US/Brazil',fine:800,dpa:'DPA',year:2017,sector:'Aerospace'},{company:'BAE Systems',law:'FCPA',jurisdiction:'US/UK',fine:450,dpa:'Plea Agreement',year:2010,sector:'Aerospace'},{company:'Samsung C&T',law:'Korean Anti-Graft',jurisdiction:'South Korea',fine:210,dpa:'Conviction',year:2017,sector:'Construction'},{company:'Telia Company',law:'FCPA',jurisdiction:'US/Sweden/Netherlands',fine:965,dpa:'DPA',year:2017,sector:'Telecom'},{company:'Fresenius Medical',law:'FCPA',jurisdiction:'US',fine:231,dpa:'DPA',year:2019,sector:'Pharma'},{company:'SNC-Lavalin',law:'CFPOA',jurisdiction:'Canada',fine:280,dpa:'DPA',year:2019,sector:'Construction'},{company:'Teva Pharma',law:'FCPA',jurisdiction:'US',fine:520,dpa:'DPA',year:2016,sector:'Pharma'},{company:'Novartis AG',law:'FCPA',jurisdiction:'US',fine:347,dpa:'DPA',year:2020,sector:'Pharma'},{company:'HSBC Holdings',law:'AML/BSA',jurisdiction:'US',fine:1900,dpa:'DPA',year:2012,sector:'Finance'},{company:'Standard Chartered',law:'Sanctions/AML',jurisdiction:'US/UK',fine:1100,dpa:'DPA',year:2019,sector:'Finance'},{company:'BNP Paribas',law:'Sanctions',jurisdiction:'US',fine:8900,dpa:'Guilty Plea',year:2014,sector:'Finance'},{company:'Deutsche Bank',law:'FCPA/AML',jurisdiction:'US/UK',fine:630,dpa:'DPA',year:2021,sector:'Finance'},{company:'JPMorgan Chase',law:'FCPA (Sons & Daughters)',jurisdiction:'US',fine:264,dpa:'DPA',year:2016,sector:'Finance'},{company:'Barclays plc',law:'UKBA/Fraud',jurisdiction:'UK',fine:72,dpa:'Acquitted',year:2020,sector:'Finance'},{company:'Halliburton Co',law:'FCPA',jurisdiction:'US/Nigeria',fine:559,dpa:'Plea',year:2009,sector:'Energy'},{company:'KBR Inc',law:'FCPA',jurisdiction:'US',fine:402,dpa:'Guilty Plea',year:2009,sector:'Construction'},{company:'Technip FMC',law:'FCPA',jurisdiction:'US',fine:338,dpa:'DPA',year:2010,sector:'Energy'},{company:'Alcoa Corp',law:'FCPA',jurisdiction:'US',fine:223,dpa:'Guilty Plea',year:2014,sector:'Mining'},{company:'Rio Tinto plc',law:'UKBA/FCPA',jurisdiction:'UK/US',fine:180,dpa:'Settlement',year:2023,sector:'Mining'},{company:'Total Energies',law:'FCPA',jurisdiction:'US',fine:398,dpa:'DPA',year:2013,sector:'Energy'}];
return cases.map((c,i)=>({...c,id:i+1,monitorDuration:Math.floor(1+sr(i*7)*4)+' years',complianceReform:sr(i*11)>0.3?'Yes':'Partial',recidivism:sr(i*13)>0.8?'Yes':'No',investigation:Math.floor(1+sr(i*17)*6)+' years'}));})();

const TREND=Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,actions:Math.round(12+sr(i*7)*25),fines:Math.round(100+sr(i*13)*900),investigations:Math.round(8+sr(i*17)*18),convictions:Math.round(2+sr(i*19)*10)}));

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};

const KPI=({label,value,sub,color})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}>
    <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);

export default function AntiCorruptionPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sector,setSector]=useState('All');
  const[region,setRegion]=useState('All');
  const[riskLvl,setRiskLvl]=useState('All');
  const[sortCol,setSortCol]=useState('corruptionRisk');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(1);
  const[expanded,setExpanded]=useState(null);
  const[cSearch,setCSearch]=useState('');
  const[cSort,setCSort]=useState('cpi');
  const[cDir,setCDir]=useState('asc');
  const[cPage,setCPage]=useState(1);
  const[eSearch,setESearch]=useState('');
  const[eSort,setESort]=useState('fine');
  const[eDir,setEDir]=useState('desc');
  const[ePage,setEPage]=useState(1);
  const[expandedC,setExpandedC]=useState(null);
  const[expandedE,setExpandedE]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sector!=='All')d=d.filter(r=>r.sector===sector);if(region!=='All')d=d.filter(r=>r.region===region);if(riskLvl!=='All')d=d.filter(r=>r.riskRating===riskLvl);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sector,region,riskLvl,sortCol,sortDir]);

  const cFiltered=useMemo(()=>{let d=[...COUNTRIES];if(cSearch)d=d.filter(r=>r.country.toLowerCase().includes(cSearch.toLowerCase()));d.sort((a,b)=>cDir==='asc'?(a[cSort]>b[cSort]?1:-1):(a[cSort]<b[cSort]?1:-1));return d;},[cSearch,cSort,cDir]);

  const eFiltered=useMemo(()=>{let d=[...ENFORCEMENT];if(eSearch)d=d.filter(r=>r.company.toLowerCase().includes(eSearch.toLowerCase())||r.law.toLowerCase().includes(eSearch.toLowerCase()));d.sort((a,b)=>eDir==='asc'?(a[eSort]>b[eSort]?1:-1):(a[eSort]<b[eSort]?1:-1));return d;},[eSearch,eSort,eDir]);

  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const cPaged=cFiltered.slice((cPage-1)*PAGE_SIZE,cPage*PAGE_SIZE);
  const ePaged=eFiltered.slice((ePage-1)*PAGE_SIZE,ePage*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const cTotalPages=Math.ceil(cFiltered.length/PAGE_SIZE);
  const eTotalPages=Math.ceil(eFiltered.length/PAGE_SIZE);

  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);
  const doCSort=useCallback((col)=>{setCSort(col);setCDir(d=>cSort===col?(d==='asc'?'desc':'asc'):'asc');setCPage(1);},[cSort]);
  const doESort=useCallback((col)=>{setESort(col);setEDir(d=>eSort===col?(d==='asc'?'desc':'asc'):'desc');setEPage(1);},[eSort]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);const critical=COMPANIES.filter(c=>c.riskRating==='Critical'||c.riskRating==='Very High').length;const totalFines=ENFORCEMENT.reduce((s,c)=>s+c.fine,0);return{avgRisk:avg('corruptionRisk'),avgFcpa:avg('fcpaCompliance'),critical,totalFines,avgTraining:avg('trainingRate'),cases:ENFORCEMENT.length};},[]);

  const sectorChart=useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,count:0,avgRisk:0};m[c.sector].count++;m[c.sector].avgRisk+=c.corruptionRisk;});return Object.values(m).map(s=>({...s,avgRisk:Math.round(s.avgRisk/s.count)}));},[]);

  const riskDist=useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.riskRating]=(m[c.riskRating]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);

  const regionChart=useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,count:0,avgRisk:0,avgFcpa:0};m[c.region].count++;m[c.region].avgRisk+=c.corruptionRisk;m[c.region].avgFcpa+=c.fcpaCompliance;});return Object.values(m).map(r=>({...r,avgRisk:Math.round(r.avgRisk/r.count),avgFcpa:Math.round(r.avgFcpa/r.count)}));},[]);

  const radarData=useMemo(()=>{const dims=['fcpaCompliance','ukBriberyAct','trainingRate','dueDialCoverage','controlEffectiveness','thirdPartyRisk'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const fineByYear=useMemo(()=>{const m={};ENFORCEMENT.forEach(c=>{const y=c.year;if(!m[y])m[y]={year:y,total:0,count:0};m[y].total+=c.fine;m[y].count++;});return Object.values(m).sort((a,b)=>a.year-b.year);},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(220,38,38,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},page:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};

  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDashboard=()=>(
    <>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
        <KPI label="Avg Corruption Risk" value={kpis.avgRisk+'/100'} sub="across 80 companies" color={T.red}/>
        <KPI label="FCPA Compliance" value={kpis.avgFcpa+'%'} sub="average score" color={T.navy}/>
        <KPI label="High/Critical Risk" value={kpis.critical} sub="companies flagged" color={T.amber}/>
        <KPI label="Total Fines" value={'$'+fmt(kpis.totalFines*1e6)} sub={kpis.cases+' enforcement cases'} color={ACCENT}/>
        <KPI label="Training Rate" value={kpis.avgTraining+'%'} sub="anti-bribery training" color={T.sage}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Corruption Risk by Sector</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:10,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avgRisk" fill={ACCENT} radius={[4,4,0,0]} name="Avg Risk"/><Bar dataKey="count" fill={T.gold} radius={[4,4,0,0]} name="Companies"/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Rating Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{riskDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Enforcement Trend (Monthly)</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="actions" stroke={ACCENT} fill="rgba(220,38,38,0.1)" name="Actions"/><Area type="monotone" dataKey="investigations" stroke={T.navy} fill="rgba(27,58,92,0.08)" name="Investigations"/><Area type="monotone" dataKey="convictions" stroke={T.amber} fill="rgba(217,119,6,0.08)" name="Convictions"/></AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Compliance Radar (Portfolio Avg)</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Score" dataKey="value" stroke={ACCENT} fill="rgba(220,38,38,0.15)" strokeWidth={2}/></RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Region Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionChart} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="region" type="category" tick={{fontSize:10,fill:T.textSec}} width={100}/><Tooltip {...tip}/><Bar dataKey="avgRisk" fill={ACCENT} radius={[0,4,4,0]} name="Avg Risk"/><Bar dataKey="avgFcpa" fill={T.navy} radius={[0,4,4,0]} name="Avg FCPA"/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Fines by Year ($M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fineByYear}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="total" stroke={ACCENT} strokeWidth={2} dot={{fill:ACCENT,r:4}} name="Total Fines $M"/><Line type="monotone" dataKey="count" stroke={T.navy} strokeWidth={2} dot={{fill:T.navy,r:3}} name="# Cases"/></LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderCompanyScreening=()=>(
    <div style={ss.card}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        <select style={ss.select} value={sector} onChange={e=>{setSector(e.target.value);setPage(1);}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
        <select style={ss.select} value={region} onChange={e=>{setRegion(e.target.value);setPage(1);}}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select>
        <select style={ss.select} value={riskLvl} onChange={e=>{setRiskLvl(e.target.value);setPage(1);}}>{RISK_LEVELS.map(r=><option key={r}>{r}</option>)}</select>
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
        <button style={ss.btn} onClick={()=>csvExport(filtered,'anti_corruption_screening')}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <TH col="name" label="Company" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="sector" label="Sector" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="region" label="Region" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="corruptionRisk" label="Risk Score" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="fcpaCompliance" label="FCPA %" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="ukBriberyAct" label="UKBA %" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="pepExposure" label="PEP Exp" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="thirdPartyRisk" label="3rd Party" sc={sortCol} sd={sortDir} fn={doSort}/>
            <TH col="riskRating" label="Rating" sc={sortCol} sd={sortDir} fn={doSort}/>
          </tr></thead>
          <tbody>
            {paged.map(r=>(
              <React.Fragment key={r.id}>
                <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                  <td style={{...ss.td,fontWeight:600}}>{r.name}</td>
                  <td style={ss.td}>{r.sector}</td>
                  <td style={ss.td}>{r.region}</td>
                  <td style={ss.td}><span style={badge(r.corruptionRisk,[30,50,70])}>{r.corruptionRisk}</span></td>
                  <td style={ss.td}><span style={badge(100-r.fcpaCompliance,[20,40,60])}>{r.fcpaCompliance}%</span></td>
                  <td style={ss.td}><span style={badge(100-r.ukBriberyAct,[20,40,60])}>{r.ukBriberyAct}%</span></td>
                  <td style={ss.td}>{r.pepExposure}</td>
                  <td style={ss.td}><span style={badge(r.thirdPartyRisk,[30,50,70])}>{r.thirdPartyRisk}</span></td>
                  <td style={ss.td}><span style={riskBadge(r.riskRating)}>{r.riskRating}</span></td>
                </tr>
                {expanded===r.id&&(
                  <tr><td colSpan={9} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Compliance Details</div>
                        {[['Country Risk',r.countryRisk],['Gift & Entertainment',r.giftEntertainment],['Whistleblower Cases',r.whistleblower],['Training Rate',r.trainingRate+'%'],['Due Diligence Coverage',r.dueDialCoverage+'%'],['Control Effectiveness',r.controlEffectiveness+'%'],['Last Audit',r.lastAudit],['Fine History','$'+fmt(r.fineHistory*1e3)],['Enforcement Actions',r.enforcementActions]].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Profile</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <RadarChart data={[{dim:'FCPA',v:r.fcpaCompliance},{dim:'UKBA',v:r.ukBriberyAct},{dim:'Training',v:r.trainingRate},{dim:'Due Dil.',v:r.dueDialCoverage},{dim:'Controls',v:r.controlEffectiveness},{dim:'3rd Party',v:100-r.thirdPartyRisk}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(220,38,38,0.15)" strokeWidth={2}/></RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Breakdown</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={[{name:'Corruption',v:r.corruptionRisk},{name:'Country',v:r.countryRisk},{name:'3rd Party',v:r.thirdPartyRisk},{name:'PEP',v:r.pepExposure},{name:'Gift/Ent',v:r.giftEntertainment}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={ss.page}>
        <button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page} / {totalPages}</span>
        <button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );

  const renderCountryRisk=()=>(
    <div style={ss.card}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <input style={ss.input} placeholder="Search countries..." value={cSearch} onChange={e=>{setCSearch(e.target.value);setCPage(1);}}/>
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{cFiltered.length} countries</span>
        <button style={ss.btn} onClick={()=>csvExport(cFiltered,'country_corruption_risk')}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <TH col="country" label="Country" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="cpi" label="CPI Score" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="briberyRisk" label="Bribery Risk" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="ruleOfLaw" label="Rule of Law" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="pepRisk" label="PEP Risk" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="moneyLaundering" label="AML Risk" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="sanctionsRisk" label="Sanctions" sc={cSort} sd={cDir} fn={doCSort}/>
            <TH col="rating" label="Rating" sc={cSort} sd={cDir} fn={doCSort}/>
          </tr></thead>
          <tbody>
            {cPaged.map(r=>(
              <React.Fragment key={r.id}>
                <tr style={{cursor:'pointer',background:expandedC===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpandedC(expandedC===r.id?null:r.id)}>
                  <td style={{...ss.td,fontWeight:600}}>{r.country}</td>
                  <td style={ss.td}><span style={badge(100-r.cpi,[30,50,70])}>{r.cpi}</span></td>
                  <td style={ss.td}><span style={badge(r.briberyRisk,[40,60,80])}>{r.briberyRisk}</span></td>
                  <td style={ss.td}>{r.ruleOfLaw}</td>
                  <td style={ss.td}><span style={badge(r.pepRisk,[40,60,80])}>{r.pepRisk}</span></td>
                  <td style={ss.td}><span style={badge(r.moneyLaundering,[40,60,80])}>{r.moneyLaundering}</span></td>
                  <td style={ss.td}><span style={riskBadge(r.sanctionsRisk==='High'?'High':r.sanctionsRisk==='Medium'?'Elevated':'Moderate')}>{r.sanctionsRisk}</span></td>
                  <td style={ss.td}><span style={riskBadge(r.rating)}>{r.rating}</span></td>
                </tr>
                {expandedC===r.id&&(
                  <tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                      <div>
                        {[['Procurement Risk',r.procurementRisk],['Judicial Independence',r.judicialIndependence],['Press Freedom Index',r.pressFreedom],['Business Environment',r.businessEnvironment],['Regulatory Quality',r.regulatoryQuality],['Political Stability',r.politicalStability]].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <RadarChart data={[{dim:'CPI',v:r.cpi},{dim:'Bribery',v:100-r.briberyRisk},{dim:'Rule of Law',v:r.ruleOfLaw},{dim:'Judicial',v:r.judicialIndependence},{dim:'Reg Quality',v:r.regulatoryQuality},{dim:'Stability',v:r.politicalStability}]} cx="50%" cy="50%" outerRadius={55}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(220,38,38,0.15)" strokeWidth={2}/></RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={ss.page}>
        <button style={ss.btnSec} disabled={cPage<=1} onClick={()=>setCPage(p=>p-1)}>Prev</button>
        <span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{cPage} / {cTotalPages}</span>
        <button style={ss.btnSec} disabled={cPage>=cTotalPages} onClick={()=>setCPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );

  const renderEnforcement=()=>(
    <div style={ss.card}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <input style={ss.input} placeholder="Search cases..." value={eSearch} onChange={e=>{setESearch(e.target.value);setEPage(1);}}/>
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{eFiltered.length} cases</span>
        <button style={ss.btn} onClick={()=>csvExport(eFiltered,'enforcement_cases')}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <TH col="company" label="Company" sc={eSort} sd={eDir} fn={doESort}/>
            <TH col="law" label="Law" sc={eSort} sd={eDir} fn={doESort}/>
            <TH col="jurisdiction" label="Jurisdiction" sc={eSort} sd={eDir} fn={doESort}/>
            <TH col="fine" label="Fine ($M)" sc={eSort} sd={eDir} fn={doESort}/>
            <TH col="dpa" label="Resolution" sc={eSort} sd={eDir} fn={doESort}/>
            <TH col="year" label="Year" sc={eSort} sd={eDir} fn={doESort}/>
            <TH col="sector" label="Sector" sc={eSort} sd={eDir} fn={doESort}/>
          </tr></thead>
          <tbody>
            {ePaged.map(r=>(
              <React.Fragment key={r.id}>
                <tr style={{cursor:'pointer',background:expandedE===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpandedE(expandedE===r.id?null:r.id)}>
                  <td style={{...ss.td,fontWeight:600}}>{r.company}</td>
                  <td style={ss.td}>{r.law}</td>
                  <td style={ss.td}>{r.jurisdiction}</td>
                  <td style={{...ss.td,fontFamily:T.mono,fontWeight:600,color:ACCENT}}>${fmt(r.fine*1e6)}</td>
                  <td style={ss.td}>{r.dpa}</td>
                  <td style={{...ss.td,fontFamily:T.mono}}>{r.year}</td>
                  <td style={ss.td}>{r.sector}</td>
                </tr>
                {expandedE===r.id&&(
                  <tr><td colSpan={7} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      {[['Monitor Duration',r.monitorDuration],['Compliance Reform',r.complianceReform],['Recidivism',r.recidivism],['Investigation Length',r.investigation]].map(([l,v])=>(
                        <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>
                      ))}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={ss.page}>
        <button style={ss.btnSec} disabled={ePage<=1} onClick={()=>setEPage(p=>p-1)}>Prev</button>
        <span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{ePage} / {eTotalPages}</span>
        <button style={ss.btnSec} disabled={ePage>=eTotalPages} onClick={()=>setEPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );

  return(
    <div style={ss.wrap}>
      <div style={ss.header}>Anti-Corruption & Bribery Intelligence</div>
      <div style={ss.sub}>FCPA, UK Bribery Act compliance -- PEP screening, country risk, enforcement tracking</div>
      <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderCompanyScreening()}
      {tab===2&&renderCountryRisk()}
      {tab===3&&renderEnforcement()}
    </div>
  );
}