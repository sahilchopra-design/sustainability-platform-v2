import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,ZAxis,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#dc2626';
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Screening','Country Risk','Enforcement Cases'];
const SECTORS=['All','Finance','Energy','Industrials','Technology','Mining','Aerospace','Commodities','Pharma','Telecom','Construction'];
const REGIONS=['All','Europe','North America','Asia Pacific','Middle East','Africa','Latin America'];
const RISK_LEVELS=['All','Critical','Very High','High','Elevated','Moderate','Low'];

const COMPANIES=(()=>{const names=['GlobalBank Holdings','PetroNex Energy','Siemens AG','Glencore plc','Ericsson AB','Credit Suisse','ABB Ltd','Vitol Group','Airbus SE','Goldman Sachs','HSBC Holdings','Standard Chartered','Petrobras SA','Odebrecht SA','Rolls-Royce plc','BAE Systems','Samsung C&T','Telia Company','Fresenius Medical','Teva Pharma','Novartis AG','Deutsche Bank','BNP Paribas','JPMorgan Chase','SNC-Lavalin','Technip FMC','Saipem SpA','Halliburton Co','KBR Inc','Alcoa Corp','Rio Tinto plc','BHP Group','Vale SA','Total Energies','Shell plc','BP plc','Chevron Corp','Barclays plc','UBS Group','Citigroup Inc','Wells Fargo','Morgan Stanley','Unilever plc','Nestle SA','Roche Holding','Bayer AG','BASF SE','Dow Inc','3M Company','Caterpillar Inc','Deere & Co','General Electric','Honeywell Intl','Lockheed Martin','Raytheon Tech','Northrop Grumman','Thales SA','Leonardo SpA','Safran SA','MTU Aero','Iberdrola SA','Enel SpA','Engie SA','EDF Group','Orsted A/S','Volkswagen AG','BMW AG','Daimler Truck','Stellantis NV','Volvo Group','Anglo American','Freeport McMoRan','Newmont Corp','Barrick Gold','Antofagasta plc','First Quantum','Ivanhoe Mines','Vedanta Ltd','Adani Group','Reliance Ind'];
const secs=['Finance','Energy','Industrials','Commodities','Technology','Finance','Industrials','Commodities','Aerospace','Finance','Finance','Finance','Energy','Construction','Aerospace','Aerospace','Construction','Telecom','Pharma','Pharma','Pharma','Finance','Finance','Finance','Construction','Energy','Energy','Energy','Construction','Mining','Mining','Mining','Mining','Energy','Energy','Energy','Energy','Finance','Finance','Finance','Finance','Finance','Pharma','Pharma','Pharma','Pharma','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Aerospace','Aerospace','Aerospace','Aerospace','Aerospace','Aerospace','Aerospace','Energy','Energy','Energy','Energy','Energy','Industrials','Industrials','Industrials','Industrials','Industrials','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Commodities','Energy'];
const regs=['Europe','North America','Europe','Europe','Europe','Europe','Europe','Europe','Europe','North America','Europe','Europe','Latin America','Latin America','Europe','Europe','Asia Pacific','Europe','Europe','North America','Europe','Europe','Europe','North America','North America','Europe','Europe','North America','North America','North America','Europe','Europe','Latin America','Europe','Europe','Europe','North America','Europe','Europe','North America','North America','North America','Europe','Europe','Europe','Europe','Europe','North America','North America','North America','North America','North America','North America','North America','North America','North America','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','North America','North America','North America','Europe','Latin America','Africa','Asia Pacific','Asia Pacific','Asia Pacific'];
return names.map((n,i)=>({id:i+1,name:n,sector:secs[i]||'Industrials',region:regs[i]||'Europe',corruptionRisk:Math.round(15+sr(i*7)*75),fcpaCompliance:Math.round(40+sr(i*11)*55),ukBriberyAct:Math.round(35+sr(i*13)*60),pepExposure:Math.round(sr(i*17)*40),countryRisk:Math.round(20+sr(i*19)*70),thirdPartyRisk:Math.round(15+sr(i*23)*75),giftEntertainment:Math.round(sr(i*29)*50),whistleblower:Math.round(sr(i*31)*30),trainingRate:Math.round(40+sr(i*37)*58),dueDialCoverage:Math.round(30+sr(i*41)*65),fineHistory:Math.round(sr(i*43)*2000),enforcementActions:Math.floor(sr(i*47)*8),riskRating:sr(i*7)<0.15?'Critical':sr(i*7)<0.35?'Very High':sr(i*7)<0.55?'High':sr(i*7)<0.75?'Elevated':sr(i*7)<0.9?'Moderate':'Low',lastAudit:`202${Math.floor(3+sr(i*53)*3)}-${String(Math.floor(1+sr(i*59)*12)).padStart(2,'0')}`,controlEffectiveness:Math.round(25+sr(i*61)*70)}));})();

const COUNTRIES=(()=>{const names=['Venezuela','Yemen','Nigeria','Russia','Bangladesh','Mexico','Indonesia','India','Brazil','Turkey','Egypt','Kenya','Colombia','Philippines','Vietnam','Thailand','South Africa','Pakistan','Myanmar','Cambodia','Peru','Ghana','Tanzania','Uganda','Mozambique','Angola','DRC','Libya','Iraq','Afghanistan','Syria','Haiti','Honduras','Guatemala','Nicaragua','Ethiopia','Cameroon','Madagascar','Laos','Senegal','Côte d\'Ivoire','Mali','Niger','Chad','Burkina Faso','Guinea','Sierra Leone','Liberia','Mauritania','Zimbabwe'];
return names.map((n,i)=>({id:i+1,country:n,cpi:Math.round(10+sr(i*7)*55),briberyRisk:Math.round(30+sr(i*11)*65),procurementRisk:Math.round(35+sr(i*13)*60),judicialIndependence:Math.round(10+sr(i*17)*55),pressFreedom:Math.round(50+sr(i*19)*120),businessEnvironment:Math.round(20+sr(i*23)*65),ruleOfLaw:Math.round(10+sr(i*29)*60),regulatoryQuality:Math.round(15+sr(i*31)*55),politicalStability:Math.round(5+sr(i*37)*65),pepRisk:Math.round(30+sr(i*41)*65),moneyLaundering:Math.round(25+sr(i*43)*70),sanctionsRisk:sr(i*47)<0.2?'High':sr(i*47)<0.5?'Medium':'Low',rating:sr(i*7)<0.2?'Critical':sr(i*7)<0.4?'Very High':sr(i*7)<0.65?'High':sr(i*7)<0.85?'Elevated':'Moderate'}));})();

const ENFORCEMENT=(()=>{const cases=[{company:'Airbus SE',law:'Sapin II / FCPA',jurisdiction:'France/US/UK',fine:4000,dpa:'DPA',year:2020,sector:'Aerospace'},{company:'Goldman Sachs',law:'FCPA / 1MDB',jurisdiction:'US/Malaysia',fine:2900,dpa:'DPA',year:2020,sector:'Finance'},{company:'Siemens AG',law:'FCPA / StGB',jurisdiction:'US/Germany',fine:1600,dpa:'DPA',year:2008,sector:'Industrials'},{company:'Glencore plc',law:'FCPA / UKBA',jurisdiction:'US/UK/Brazil',fine:1500,dpa:'Guilty Plea',year:2022,sector:'Commodities'},{company:'Ericsson AB',law:'FCPA',jurisdiction:'US',fine:1060,dpa:'Guilty',year:2022,sector:'Technology'},{company:'Credit Suisse',law:'FCPA',jurisdiction:'US',fine:475,dpa:'DPA',year:2021,sector:'Finance'},{company:'ABB Ltd',law:'FCPA',jurisdiction:'US',fine:315,dpa:'DPA',year:2022,sector:'Industrials'},{company:'Vitol Group',law:'FCPA',jurisdiction:'US/Brazil',fine:164,dpa:'DPA',year:2020,sector:'Commodities'},{company:'Petrobras SA',law:'Car Wash',jurisdiction:'Brazil/US',fine:1780,dpa:'Settlement',year:2018,sector:'Energy'},{company:'Odebrecht SA',law:'FCPA / Lava Jato',jurisdiction:'Brazil/US/Switzerland',fine:3500,dpa:'Guilty Plea',year:2016,sector:'Construction'},{company:'Rolls-Royce plc',law:'UKBA',jurisdiction:'UK/US/Brazil',fine:800,dpa:'DPA',year:2017,sector:'Aerospace'},{company:'BAE Systems',law:'FCPA',jurisdiction:'US/UK',fine:450,dpa:'Plea Agreement',year:2010,sector:'Aerospace'},{company:'Samsung C&T',law:'Korean Anti-Graft',jurisdiction:'South Korea',fine:210,dpa:'Conviction',year:2017,sector:'Construction'},{company:'Telia Company',law:'FCPA',jurisdiction:'US/Sweden/Netherlands',fine:965,dpa:'DPA',year:2017,sector:'Telecom'},{company:'Fresenius Medical',law:'FCPA',jurisdiction:'US',fine:231,dpa:'DPA',year:2019,sector:'Pharma'},{company:'SNC-Lavalin',law:'CFPOA',jurisdiction:'Canada',fine:280,dpa:'DPA',year:2019,sector:'Construction'},{company:'Teva Pharma',law:'FCPA',jurisdiction:'US',fine:520,dpa:'DPA',year:2016,sector:'Pharma'},{company:'Novartis AG',law:'FCPA',jurisdiction:'US',fine:347,dpa:'DPA',year:2020,sector:'Pharma'},{company:'HSBC Holdings',law:'AML/BSA',jurisdiction:'US',fine:1900,dpa:'DPA',year:2012,sector:'Finance'},{company:'Standard Chartered',law:'Sanctions/AML',jurisdiction:'US/UK',fine:1100,dpa:'DPA',year:2019,sector:'Finance'},{company:'BNP Paribas',law:'Sanctions',jurisdiction:'US',fine:8900,dpa:'Guilty Plea',year:2014,sector:'Finance'},{company:'Deutsche Bank',law:'FCPA/AML',jurisdiction:'US/UK',fine:630,dpa:'DPA',year:2021,sector:'Finance'},{company:'JPMorgan Chase',law:'FCPA (Sons & Daughters)',jurisdiction:'US',fine:264,dpa:'DPA',year:2016,sector:'Finance'},{company:'Barclays plc',law:'UKBA/Fraud',jurisdiction:'UK',fine:72,dpa:'Acquitted',year:2020,sector:'Finance'},{company:'Halliburton Co',law:'FCPA',jurisdiction:'US/Nigeria',fine:559,dpa:'Plea',year:2009,sector:'Energy'},{company:'KBR Inc',law:'FCPA',jurisdiction:'US',fine:402,dpa:'Guilty Plea',year:2009,sector:'Construction'},{company:'Technip FMC',law:'FCPA',jurisdiction:'US',fine:338,dpa:'DPA',year:2010,sector:'Energy'},{company:'Alcoa Corp',law:'FCPA',jurisdiction:'US',fine:223,dpa:'Guilty Plea',year:2014,sector:'Mining'},{company:'Rio Tinto plc',law:'UKBA/FCPA',jurisdiction:'UK/US',fine:180,dpa:'Settlement',year:2023,sector:'Mining'},{company:'Total Energies',law:'FCPA',jurisdiction:'US',fine:398,dpa:'DPA',year:2013,sector:'Energy'}];
return cases.map((c,i)=>({...c,id:i+1,monitorDuration:Math.floor(1+sr(i*7)*4)+' years',complianceReform:sr(i*11)>0.3?'Yes':'Partial',recidivism:sr(i*13)>0.8?'Yes':'No',investigation:Math.floor(1+sr(i*17)*6)+' years'}));})();

const TREND=Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,actions:Math.round(12+sr(i*7)*25),fines:Math.round(100+sr(i*13)*900),investigations:Math.round(8+sr(i*17)*18),convictions:Math.round(2+sr(i*19)*10)}));

const PAGE_SIZE=15;
const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(220,38,38,0.12)':val>=mid?'rgba(217,119,6,0.12)':val>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const color=val>=hi?T.red:val>=mid?T.amber:val>=lo?T.gold:T.green;return{background:bg,color,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const riskBadge=(r)=>{const m={Critical:{bg:'rgba(220,38,38,0.12)',c:T.red},'Very High':{bg:'rgba(220,38,38,0.08)',c:'#b91c1c'},High:{bg:'rgba(217,119,6,0.12)',c:T.amber},Elevated:{bg:'rgba(197,169,106,0.15)',c:T.gold},Moderate:{bg:'rgba(22,163,74,0.12)',c:T.green},Low:{bg:'rgba(22,163,74,0.08)',c:'#15803d'}};const s=m[r]||m.Moderate;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};
const PIECLRS=[T.red,'#b91c1c',T.amber,T.gold,T.green,'#15803d'];

export default function AntiCorruptionPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sectorF,setSectorF]=useState('All');
  const[regionF,setRegionF]=useState('All');
  const[riskF,setRiskF]=useState('All');
  const[sortCol,setSortCol]=useState('corruptionRisk');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(1);
  const[selected,setSelected]=useState(null);
  const[cSearch,setCSearch]=useState('');
  const[cSort,setCSort]=useState('cpi');
  const[cDir,setCDir]=useState('asc');
  const[cPage,setCPage]=useState(1);
  const[cSelected,setCSelected]=useState(null);
  const[eSearch,setESearch]=useState('');
  const[eSort,setESort]=useState('fine');
  const[eDir,setEDir]=useState('desc');
  const[ePage,setEPage]=useState(1);
  const[eSelected,setESelected]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);if(regionF!=='All')d=d.filter(r=>r.region===regionF);if(riskF!=='All')d=d.filter(r=>r.riskRating===riskF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,regionF,riskF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  const cFiltered=useMemo(()=>{let d=[...COUNTRIES];if(cSearch)d=d.filter(r=>r.country.toLowerCase().includes(cSearch.toLowerCase()));d.sort((a,b)=>cDir==='asc'?(a[cSort]>b[cSort]?1:-1):(a[cSort]<b[cSort]?1:-1));return d;},[cSearch,cSort,cDir]);
  const cPaged=useMemo(()=>cFiltered.slice((cPage-1)*PAGE_SIZE,cPage*PAGE_SIZE),[cFiltered,cPage]);
  const cTotalPages=Math.ceil(cFiltered.length/PAGE_SIZE);

  const eFiltered=useMemo(()=>{let d=[...ENFORCEMENT];if(eSearch)d=d.filter(r=>r.company.toLowerCase().includes(eSearch.toLowerCase())||r.law.toLowerCase().includes(eSearch.toLowerCase()));d.sort((a,b)=>eDir==='asc'?(a[eSort]>b[eSort]?1:-1):(a[eSort]<b[eSort]?1:-1));return d;},[eSearch,eSort,eDir]);
  const ePaged=useMemo(()=>eFiltered.slice((ePage-1)*PAGE_SIZE,ePage*PAGE_SIZE),[eFiltered,ePage]);
  const eTotalPages=Math.ceil(eFiltered.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doCSort=(col)=>{if(cSort===col)setCDir(d=>d==='asc'?'desc':'asc');else{setCSort(col);setCDir('desc');}setCPage(1);};
  const doESort=(col)=>{if(eSort===col)setEDir(d=>d==='asc'?'desc':'asc');else{setESort(col);setEDir('desc');}setEPage(1);};

  const stats=useMemo(()=>{const d=filtered;return{total:d.length,critical:d.filter(r=>r.riskRating==='Critical'||r.riskRating==='Very High').length,avgRisk:(d.reduce((s,r)=>s+r.corruptionRisk,0)/d.length||0).toFixed(1),avgCompliance:(d.reduce((s,r)=>s+r.fcpaCompliance,0)/d.length||0).toFixed(1),totalFines:d.reduce((s,r)=>s+r.fineHistory,0),avgTraining:(d.reduce((s,r)=>s+r.trainingRate,0)/d.length||0).toFixed(1)};},[filtered]);

  const sectorDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]||0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);},[filtered]);
  const riskDist=useMemo(()=>{const order=['Critical','Very High','High','Elevated','Moderate','Low'];const m={};filtered.forEach(r=>{m[r.riskRating]=(m[r.riskRating]||0)+1;});return order.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);
  const scatterData=useMemo(()=>filtered.map(r=>({name:r.name,x:r.corruptionRisk,y:r.fcpaCompliance,z:r.fineHistory||50,sector:r.sector})),[filtered]);

  const exportCSV=useCallback((data,filename)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);},[]);

  const sortIcon=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const thStyle={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const tdStyle={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inputStyle={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const selectStyle={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnStyle=(active)=>({padding:'6px 16px',border:`1px solid ${active?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:active?ACCENT:T.surface,color:active?'#fff':T.text,cursor:'pointer',fontWeight:active?600:400});
  const pagBtn={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const cardStyle={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const SidePanel=({item,onClose,type})=>{if(!item)return null;
    return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',padding:0,boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
      <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.font}}>{type==='company'?item.name:type==='country'?item.country:item.company}</div>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
      </div>
      <div style={{padding:'16px 24px'}}>
        {type==='company'&&(<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            {[['Corruption Risk',item.corruptionRisk],['FCPA Compliance',item.fcpaCompliance+'%'],['UK Bribery Act',item.ukBriberyAct+'%'],['PEP Exposure',item.pepExposure+'%'],['Country Risk',item.countryRisk],['3rd Party Risk',item.thirdPartyRisk],['Gift & Entertain.',item.giftEntertainment+'%'],['Whistleblower Cases',item.whistleblower],['Training Rate',item.trainingRate+'%'],['Due Diligence',item.dueDialCoverage+'%'],['Fine History','$'+fmt(item.fineHistory*1e6)],['Enforcement Actions',item.enforcementActions]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:15,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
          </div>
          <div style={{marginBottom:16}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:4}}>RISK RATING</div><span style={riskBadge(item.riskRating)}>{item.riskRating}</span></div>
          <div style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Sector: {item.sector} | Region: {item.region} | Last Audit: {item.lastAudit} | Control Effectiveness: {item.controlEffectiveness}%</div>
          <div style={{marginTop:16,height:180}}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:6}}>RISK PROFILE RADAR</div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[{dim:'Corruption',v:item.corruptionRisk},{dim:'Country',v:item.countryRisk},{dim:'3rd Party',v:item.thirdPartyRisk},{dim:'PEP',v:item.pepExposure},{dim:'Gift/Ent.',v:item.giftEntertainment},{dim:'WB Cases',v:item.whistleblower*3}]}>
                <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>)}
        {type==='country'&&(<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            {[['CPI Score',item.cpi],['Bribery Risk',item.briberyRisk],['Procurement Risk',item.procurementRisk],['Judicial Indep.',item.judicialIndependence],['Press Freedom',item.pressFreedom],['Business Env.',item.businessEnvironment],['Rule of Law',item.ruleOfLaw],['Regulatory Quality',item.regulatoryQuality],['Political Stability',item.politicalStability],['PEP Risk',item.pepRisk],['Money Laundering',item.moneyLaundering],['Sanctions',item.sanctionsRisk]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:15,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
          </div>
          <div style={{marginBottom:12}}><span style={riskBadge(item.rating)}>{item.rating}</span></div>
        </>)}
        {type==='enforcement'&&(<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            {[['Fine','$'+item.fine+'M'],['Law',item.law],['Jurisdiction',item.jurisdiction],['Year',item.year],['Resolution',item.dpa],['Sector',item.sector],['Monitor Duration',item.monitorDuration],['Compliance Reform',item.complianceReform],['Recidivism',item.recidivism],['Investigation Period',item.investigation]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:600,color:T.navy,marginTop:2}}>{v}</div></div>))}
          </div>
        </>)}
      </div>
    </div>);
  };

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}>
      <div style={{fontSize:20,fontWeight:700,color:T.navy}}>Anti-Corruption & Bribery Intelligence</div>
      <div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>FCPA / UK Bribery Act / Sapin II Compliance &middot; {COMPANIES.length} Companies &middot; {COUNTRIES.length} Countries &middot; {ENFORCEMENT.length} Enforcement Cases</div>
    </div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>
      {TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);setCSelected(null);setESelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,fontFamily:T.font,cursor:'pointer'}}>{t}</button>))}
    </div>

    <div style={{padding:'20px 28px'}}>
    {/* DASHBOARD */}
    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Companies Screened',stats.total,T.navy],['High/Critical Risk',stats.critical,T.red],['Avg Risk Score',stats.avgRisk,T.amber],['Avg FCPA Compliance',stats.avgCompliance+'%',T.green],['Total Fine History','$'+fmt(stats.totalFines*1e6),T.red],['Avg Training Rate',stats.avgTraining+'%',T.sage]].map(([l,v,c],i)=>(<div key={i} style={cardStyle}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cardStyle}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Enforcement Trend (36M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="fines" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Fines ($M)"/><Area type="monotone" dataKey="actions" stroke={T.amber} fill={T.amber} fillOpacity={0.1} name="Actions"/></AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Risk Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} labelLine={false} style={{fontSize:9}}>
              {riskDist.map((e,i)=>(<Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>))}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectorDist.slice(0,8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textMut}} width={70}/><Tooltip {...tip}/><Bar dataKey="value" fill={ACCENT} radius={[0,4,4,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{...cardStyle,marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Risk vs Compliance Scatter</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Corruption Risk" tick={{fontSize:9,fill:T.textMut}} label={{value:'Corruption Risk',position:'bottom',fontSize:10}}/><YAxis dataKey="y" name="FCPA Compliance" tick={{fontSize:9,fill:T.textMut}} label={{value:'FCPA Compliance %',angle:-90,position:'left',fontSize:10}}/><ZAxis dataKey="z" range={[30,200]}/><Tooltip {...tip} formatter={(v,n)=>[v,n]}/><Scatter data={scatterData} fill={ACCENT} fillOpacity={0.6}/></ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>)}

    {/* COMPANY SCREENING */}
    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search companies..." style={inputStyle}/>
        <select value={sectorF} onChange={e=>{setSectorF(e.target.value);setPage(1);}} style={selectStyle}>{SECTORS.map(s=>(<option key={s}>{s}</option>))}</select>
        <select value={regionF} onChange={e=>{setRegionF(e.target.value);setPage(1);}} style={selectStyle}>{REGIONS.map(r=>(<option key={r}>{r}</option>))}</select>
        <select value={riskF} onChange={e=>{setRiskF(e.target.value);setPage(1);}} style={selectStyle}>{RISK_LEVELS.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'anti_corruption_companies.csv')} style={btnStyle(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length} results</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['name','Company'],['sector','Sector'],['region','Region'],['corruptionRisk','Risk Score'],['fcpaCompliance','FCPA %'],['ukBriberyAct','UKBA %'],['pepExposure','PEP %'],['countryRisk','Country Risk'],['thirdPartyRisk','3rd Party'],['riskRating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={thStyle}>{l}{sortIcon(k,sortCol,sortDir)}</th>))}
          </tr></thead>
          <tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
            <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.name}</td>
            <td style={tdStyle}>{r.sector}</td>
            <td style={tdStyle}>{r.region}</td>
            <td style={tdStyle}><span style={badge(r.corruptionRisk,[30,50,70])}>{r.corruptionRisk}</span></td>
            <td style={tdStyle}>{r.fcpaCompliance}%</td>
            <td style={tdStyle}>{r.ukBriberyAct}%</td>
            <td style={tdStyle}>{r.pepExposure}%</td>
            <td style={tdStyle}><span style={badge(r.countryRisk,[30,50,70])}>{r.countryRisk}</span></td>
            <td style={tdStyle}>{r.thirdPartyRisk}</td>
            <td style={tdStyle}><span style={riskBadge(r.riskRating)}>{r.riskRating}</span></td>
          </tr>))}</tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pagBtn}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page} of {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={pagBtn}>Next</button>
      </div>
      <SidePanel item={selected} onClose={()=>setSelected(null)} type="company"/>
    </div>)}

    {/* COUNTRY RISK */}
    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <input value={cSearch} onChange={e=>{setCSearch(e.target.value);setCPage(1);}} placeholder="Search countries..." style={inputStyle}/>
        <button onClick={()=>exportCSV(cFiltered,'country_corruption_risk.csv')} style={btnStyle(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{cFiltered.length} countries</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['country','Country'],['cpi','CPI'],['briberyRisk','Bribery'],['procurementRisk','Procurement'],['judicialIndependence','Judicial'],['pressFreedom','Press'],['businessEnvironment','Business'],['ruleOfLaw','Rule of Law'],['politicalStability','Stability'],['pepRisk','PEP'],['rating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doCSort(k)} style={thStyle}>{l}{sortIcon(k,cSort,cDir)}</th>))}
          </tr></thead>
          <tbody>{cPaged.map(r=>(<tr key={r.id} onClick={()=>setCSelected(r)} style={{cursor:'pointer',background:cSelected?.id===r.id?T.surfaceH:'transparent'}}>
            <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.country}</td>
            <td style={tdStyle}><span style={badge(100-r.cpi,[30,55,75])}>{r.cpi}</span></td>
            <td style={tdStyle}><span style={badge(r.briberyRisk,[30,50,70])}>{r.briberyRisk}</span></td>
            <td style={tdStyle}>{r.procurementRisk}</td>
            <td style={tdStyle}>{r.judicialIndependence}</td>
            <td style={tdStyle}>{r.pressFreedom}</td>
            <td style={tdStyle}>{r.businessEnvironment}</td>
            <td style={tdStyle}>{r.ruleOfLaw}</td>
            <td style={tdStyle}>{r.politicalStability}</td>
            <td style={tdStyle}>{r.pepRisk}</td>
            <td style={tdStyle}><span style={riskBadge(r.rating)}>{r.rating}</span></td>
          </tr>))}</tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={cPage<=1} onClick={()=>setCPage(p=>p-1)} style={pagBtn}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {cPage} of {cTotalPages}</span>
        <button disabled={cPage>=cTotalPages} onClick={()=>setCPage(p=>p+1)} style={pagBtn}>Next</button>
      </div>
      <div style={{...cardStyle,marginTop:16}}>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>CPI vs Bribery Risk Scatter</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="cpi" name="CPI" tick={{fontSize:9}}/><YAxis dataKey="briberyRisk" name="Bribery Risk" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={cFiltered} fill={ACCENT} fillOpacity={0.6}/></ScatterChart>
        </ResponsiveContainer>
      </div>
      <SidePanel item={cSelected} onClose={()=>setCSelected(null)} type="country"/>
    </div>)}

    {/* ENFORCEMENT CASES */}
    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <input value={eSearch} onChange={e=>{setESearch(e.target.value);setEPage(1);}} placeholder="Search enforcement cases..." style={inputStyle}/>
        <button onClick={()=>exportCSV(eFiltered,'enforcement_cases.csv')} style={btnStyle(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{eFiltered.length} cases</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['company','Company'],['law','Law/Statute'],['jurisdiction','Jurisdiction'],['fine','Fine ($M)'],['dpa','Resolution'],['year','Year'],['sector','Sector'],['monitorDuration','Monitor'],['recidivism','Recidivism']].map(([k,l])=>(<th key={k} onClick={()=>doESort(k)} style={thStyle}>{l}{sortIcon(k,eSort,eDir)}</th>))}
          </tr></thead>
          <tbody>{ePaged.map(r=>(<tr key={r.id} onClick={()=>setESelected(r)} style={{cursor:'pointer',background:eSelected?.id===r.id?T.surfaceH:'transparent'}}>
            <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.company}</td>
            <td style={{...tdStyle,fontSize:11}}>{r.law}</td>
            <td style={tdStyle}>{r.jurisdiction}</td>
            <td style={tdStyle}><span style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>${r.fine}M</span></td>
            <td style={tdStyle}>{r.dpa}</td>
            <td style={tdStyle}>{r.year}</td>
            <td style={tdStyle}>{r.sector}</td>
            <td style={tdStyle}>{r.monitorDuration}</td>
            <td style={tdStyle}><span style={{color:r.recidivism==='Yes'?T.red:T.green,fontWeight:600}}>{r.recidivism}</span></td>
          </tr>))}</tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={ePage<=1} onClick={()=>setEPage(p=>p-1)} style={pagBtn}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {ePage} of {eTotalPages}</span>
        <button disabled={ePage>=eTotalPages} onClick={()=>setEPage(p=>p+1)} style={pagBtn}>Next</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:16}}>
        <div style={cardStyle}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Top 10 Fines by Company</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...ENFORCEMENT].sort((a,b)=>b.fine-a.fine).slice(0,10)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textMut}} label={{value:'Fine ($M)',position:'bottom',fontSize:10}}/><YAxis dataKey="company" type="category" tick={{fontSize:9,fill:T.textMut}} width={110}/><Tooltip {...tip}/><Bar dataKey="fine" fill={ACCENT} radius={[0,4,4,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Resolution Types</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={(()=>{const m={};ENFORCEMENT.forEach(r=>{m[r.dpa]=(m[r.dpa]||0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));})().sort((a,b)=>b.value-a.value)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={35} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>
              {Array.from({length:8},(_,i)=>(<Cell key={i} fill={[ACCENT,T.amber,T.gold,T.navy,T.sage,T.navyL,'#7c3aed','#0ea5e9'][i%8]}/>))}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <SidePanel item={eSelected} onClose={()=>setESelected(null)} type="enforcement"/>
    </div>)}
    </div>
  </div>);
}
