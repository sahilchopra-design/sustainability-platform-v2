import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const TABS=['Risk Heatmap','Supply Chain Screening','Due Diligence Tracker','Regulatory Compliance'];
const INDUSTRIES=['Apparel & Textiles','Electronics','Agriculture & Food','Mining & Metals','Construction','Healthcare Products','Automotive','Retail','Chemicals','Logistics'];
const SOURCE_COUNTRIES=['China','Vietnam','Bangladesh','India','Malaysia','Thailand','Indonesia','Myanmar','Philippines','Cambodia','Pakistan','Turkey','Mexico','Brazil','Ethiopia'];
const ILO_INDICATORS=['Abuse of vulnerability','Deception','Restriction of movement','Isolation','Physical violence','Intimidation & threats','Retention of documents','Withholding wages','Debt bondage','Abusive working conditions','Excessive overtime'];
const PIE_C=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0284c7','#db2777'];

const SUPPLY_CHAINS=Array.from({length:60},(_,i)=>{
  const companies=['Nike Inc','Adidas AG','H&M Group','Inditex (Zara)','Gap Inc','Apple Inc','Samsung Electronics','Foxconn','HP Inc','Dell Technologies','Nestle SA','Unilever','Mars Inc','Mondelez','Cargill','Rio Tinto','BHP Group','Glencore','ArcelorMittal','Freeport McMoRan','Skanska AB','Vinci SA','Bouygues','Holcim','CRH plc','Johnson & Johnson','Medtronic','Abbott Labs','Baxter Intl','Stryker','Toyota Motor','Volkswagen AG','BMW Group','Ford Motor','General Motors','Walmart','Amazon','Costco','Target Corp','Home Depot','BASF SE','Dow Chemical','DuPont','3M Company','Henkel AG','Maersk','DHL Group','FedEx','UPS','Kuehne Nagel','PVH Corp','Levi Strauss','Under Armour','Puma SE','LVMH','Hermes','Kering','Burberry','Primark','Fast Retailing'];
  const ind=INDUSTRIES[i%10];
  const country=SOURCE_COUNTRIES[i%15];
  const riskScore=Math.round(20+sr(i*7)*75);
  const uflpaCompliant=sr(i*11)>0.4;
  const ukMsaQuality=Math.round(20+sr(i*13)*70);
  const csdddReady=sr(i*17)>0.5;
  const supplierCount=Math.round(50+sr(i*19)*450);
  const highRiskSuppliers=Math.round(supplierCount*0.05+sr(i*23)*supplierCount*0.15);
  const auditsPassed=Math.round(supplierCount*0.5+sr(i*29)*supplierCount*0.4);
  const lastAudit=`2026-${String(1+Math.floor(sr(i*31)*3)).padStart(2,'0')}-${String(1+Math.floor(sr(i*37)*28)).padStart(2,'0')}`;
  return{id:i,company:companies[i],industry:ind,primarySource:country,riskScore,uflpaCompliant,ukMsaQuality,csdddReady,supplierCount,highRiskSuppliers,auditsPassed,lastAudit,
    iloScores:ILO_INDICATORS.map((ind,ii)=>({indicator:ind,score:Math.round(10+sr(i*50+ii*7)*80)})),
    secondarySources:SOURCE_COUNTRIES.slice(0,3+Math.floor(sr(i*41)*5)).filter(c=>c!==country),
    remediationActions:Math.round(sr(i*43)*8),
    grievances:Math.round(sr(i*47)*12),
    tier:riskScore>70?'Critical':riskScore>50?'High':riskScore>30?'Medium':'Low'
  };
});

const COUNTRY_RISK=SOURCE_COUNTRIES.map((c,i)=>({country:c,overallRisk:Math.round(30+sr(i*7)*65),freedomIndex:Math.round(10+sr(i*11)*60),laborLaws:Math.round(20+sr(i*13)*70),enforcement:Math.round(10+sr(i*17)*50),
  industries:INDUSTRIES.slice(0,5).map((ind,ii)=>({industry:ind,risk:Math.round(20+sr(i*50+ii*23)*75)}))}));

const exportCSV=(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const Kpi=({label,value,sub,accent=T.navy})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',borderLeft:`3px solid ${accent}`}}><div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:accent,marginTop:3}}>{sub}</div>}</div>;
const Row=({children,cols})=><div style={{display:'grid',gridTemplateColumns:cols||'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>;
const Badge=({children,bg,fg})=><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:bg||T.surfaceH,color:fg||T.text}}>{children}</span>;

export default function ForcedLabourPage(){
  const [tab,setTab]=useState(0);
  const [indFilter,setIndFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('riskScore');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedChain,setSelectedChain]=useState(0);
  const [riskThreshold,setRiskThreshold]=useState(50);
  const [regFramework,setRegFramework]=useState('All');
  const [selectedCountryIdx,setSelectedCountryIdx]=useState(0);

  const th={padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'left',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',userSelect:'none'};
  const td={padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};

  const filtered=useMemo(()=>{
    let c=[...SUPPLY_CHAINS];
    if(indFilter!=='All')c=c.filter(x=>x.industry===indFilter);
    if(countryFilter!=='All')c=c.filter(x=>x.primarySource===countryFilter);
    if(search)c=c.filter(x=>x.company.toLowerCase().includes(search.toLowerCase()));
    c.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return c;
  },[indFilter,countryFilter,search,sortCol,sortDir]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const criticalCount=SUPPLY_CHAINS.filter(s=>s.riskScore>70).length;
  const avgRisk=Math.round(SUPPLY_CHAINS.reduce((a,s)=>a+s.riskScore,0)/SUPPLY_CHAINS.length);

  const renderHeatmap=()=>{
    const cr=COUNTRY_RISK[selectedCountryIdx];
    const heatData=SOURCE_COUNTRIES.map((c,ci)=>({country:c,...Object.fromEntries(INDUSTRIES.slice(0,6).map((ind,ii)=>([ind,Math.round(20+sr(ci*50+ii*23)*75)])))}));
    const tierColors={Critical:T.red,High:T.amber,Medium:T.gold,Low:T.green};
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Supply Chains Screened" value={60} accent={T.navy}/><Kpi label="Critical Risk" value={criticalCount} sub={`${Math.round(criticalCount/60*100)}% of total`} accent={T.red}/><Kpi label="Avg Risk Score" value={avgRisk} sub={avgRisk>50?'Above threshold':'Below threshold'} accent={avgRisk>50?T.red:T.green}/><Kpi label="Countries Monitored" value={SOURCE_COUNTRIES.length} accent={T.gold}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <select value={selectedCountryIdx} onChange={e=>setSelectedCountryIdx(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:160}}>{SOURCE_COUNTRIES.map((c,i)=><option key={i} value={i}>{c}</option>)}</select>
        <button onClick={()=>exportCSV(COUNTRY_RISK.map(c=>({Country:c.country,OverallRisk:c.overallRisk,FreedomIndex:c.freedomIndex,LaborLaws:c.laborLaws,Enforcement:c.enforcement})),'country_risk.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Country x Industry Risk Heatmap</div>
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',fontSize:10}}>
              <thead><tr><th style={{...th,fontSize:10}}>Country</th>{INDUSTRIES.slice(0,6).map(ind=><th key={ind} style={{...th,fontSize:9,writingMode:'vertical-lr',height:90,textAlign:'center',maxWidth:30}}>{ind}</th>)}</tr></thead>
              <tbody>{heatData.map((row,ri)=><tr key={ri}><td style={{...td,fontWeight:600,fontSize:10,whiteSpace:'nowrap'}}>{row.country}</td>
                {INDUSTRIES.slice(0,6).map(ind=>{const v=row[ind];const bg=v>70?T.red:v>50?T.amber:v>30?T.gold:T.green;return<td key={ind} style={{...td,background:bg+'30',textAlign:'center',fontSize:9,fontWeight:600,color:bg,width:35,height:28}}>{v}</td>;})}
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{cr.country} Risk Profile</div>
            <ResponsiveContainer width="100%" height={200}><RadarChart outerRadius={70} data={[{dim:'Overall',v:cr.overallRisk},{dim:'Freedom',v:cr.freedomIndex},{dim:'Labor Laws',v:cr.laborLaws},{dim:'Enforcement',v:cr.enforcement}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="v" stroke={T.red} fill={T.red+'30'} fillOpacity={0.5}/></RadarChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Risk Tier Distribution</div>
            {Object.entries(tierColors).map(([tier,color])=>{const count=SUPPLY_CHAINS.filter(s=>s.tier===tier).length;return<div key={tier} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color,fontWeight:600}}>{tier}</span><span style={{fontFamily:T.mono}}>{count} supply chains</span></div>;})}
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Country Risk Scores</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={COUNTRY_RISK.sort((a,b)=>b.overallRisk-a.overallRisk)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={55}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="overallRisk" name="Overall Risk" radius={[3,3,0,0]}>{COUNTRY_RISK.map((c,i)=><Cell key={i} fill={c.overallRisk>70?T.red:c.overallRisk>50?T.amber:T.green}/>)}</Bar></BarChart></ResponsiveContainer>
      </div>
    </div>);
  };

  const renderScreening=()=>{
    const sc=SUPPLY_CHAINS[selectedChain];
    const tierColors={Critical:T.red,High:T.amber,Medium:T.gold,Low:T.green};
    return(<div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies..." style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 12px',fontSize:13,fontFamily:T.font,width:220,outline:'none'}}/>
        <select value={indFilter} onChange={e=>setIndFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Industries</option>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select>
        <select value={countryFilter} onChange={e=>setCountryFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Countries</option>{SOURCE_COUNTRIES.map(c=><option key={c}>{c}</option>)}</select>
        <button onClick={()=>exportCSV(filtered.map(s=>({Company:s.company,Industry:s.industry,Source:s.primarySource,Risk:s.riskScore,UFLPA:s.uflpaCompliant?'Yes':'No',UKMSA:s.ukMsaQuality,Suppliers:s.supplierCount,HighRisk:s.highRiskSuppliers})),'supply_chain_screen.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Supply Chain Screening Table</div>
          <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{position:'sticky',top:0,zIndex:1}}><tr>{[{k:'company',l:'Company'},{k:'industry',l:'Industry'},{k:'primarySource',l:'Source'},{k:'riskScore',l:'Risk'},{k:'tier',l:'Tier'},{k:'uflpaCompliant',l:'UFLPA'},{k:'ukMsaQuality',l:'UK MSA'},{k:'supplierCount',l:'Suppliers'},{k:'highRiskSuppliers',l:'High Risk'}].map(c=><th key={c.k} style={th} onClick={()=>toggleSort(c.k)}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}</tr></thead>
              <tbody>{filtered.slice(0,35).map(s=>{const tc=tierColors[s.tier];return<tr key={s.id} style={{cursor:'pointer',background:selectedChain===s.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedChain(s.id)}>
                <td style={{...td,fontWeight:500}}>{s.company}</td><td style={{...td,fontSize:11}}>{s.industry}</td><td style={td}>{s.primarySource}</td>
                <td style={{...td,fontWeight:700,color:s.riskScore>70?T.red:s.riskScore>50?T.amber:T.green,fontFamily:T.mono}}>{s.riskScore}</td>
                <td style={td}><Badge bg={tc+'20'} fg={tc}>{s.tier}</Badge></td>
                <td style={td}><Badge bg={s.uflpaCompliant?T.green+'20':T.red+'20'} fg={s.uflpaCompliant?T.green:T.red}>{s.uflpaCompliant?'Pass':'Fail'}</Badge></td>
                <td style={td}><span style={{fontFamily:T.mono,color:s.ukMsaQuality>50?T.green:T.red}}>{s.ukMsaQuality}%</span></td>
                <td style={{...td,fontFamily:T.mono}}>{s.supplierCount}</td><td style={{...td,fontFamily:T.mono,color:T.red}}>{s.highRiskSuppliers}</td>
              </tr>;})}</tbody>
            </table>
          </div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{sc.company} Details</div>
          {[{l:'Industry',v:sc.industry},{l:'Primary Source',v:sc.primarySource},{l:'Risk Score',v:sc.riskScore,c:sc.riskScore>70?T.red:T.green},{l:'Tier',v:sc.tier},{l:'UFLPA',v:sc.uflpaCompliant?'Compliant':'Non-compliant',c:sc.uflpaCompliant?T.green:T.red},{l:'UK MSA Quality',v:`${sc.ukMsaQuality}%`},{l:'CSDDD Ready',v:sc.csdddReady?'Yes':'No',c:sc.csdddReady?T.green:T.red},{l:'Total Suppliers',v:sc.supplierCount},{l:'High Risk',v:sc.highRiskSuppliers,c:T.red},{l:'Audits Passed',v:`${sc.auditsPassed}/${sc.supplierCount}`},{l:'Remediation Actions',v:sc.remediationActions},{l:'Grievances',v:sc.grievances},{l:'Last Audit',v:sc.lastAudit}].map((m,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:T.textSec}}>{m.l}</span><span style={{fontWeight:600,color:m.c||T.text,fontFamily:T.mono}}>{m.v}</span></div>)}
          <div style={{marginTop:10,fontSize:11,color:T.textSec}}>Secondary Sources: {sc.secondarySources.join(', ')}</div>
        </div>
      </Row>
    </div>);
  };

  const renderDueDiligence=()=>{
    const sc=SUPPLY_CHAINS[selectedChain];
    const radarData=sc.iloScores.map(s=>({indicator:s.indicator.split(' ').slice(0,2).join(' '),score:s.score,fullName:s.indicator}));
    const avgIlo=Math.round(sc.iloScores.reduce((a,s)=>a+s.score,0)/sc.iloScores.length);
    const highRiskIndicators=sc.iloScores.filter(s=>s.score>60).length;
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="ILO Indicators" value={11} sub="Being monitored" accent={T.navy}/><Kpi label={`${sc.company} Avg`} value={avgIlo} sub={avgIlo>50?'Above threshold':'Below threshold'} accent={avgIlo>50?T.red:T.green}/><Kpi label="High Risk Indicators" value={highRiskIndicators} sub={`of 11 total`} accent={T.red}/><Kpi label="Grievances Filed" value={sc.grievances} accent={T.amber}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={selectedChain} onChange={e=>setSelectedChain(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:200}}>{SUPPLY_CHAINS.map((s,i)=><option key={i} value={i}>{s.company}</option>)}</select>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,color:T.textSec}}>Risk Threshold:</span><input type="range" min={20} max={80} value={riskThreshold} onChange={e=>setRiskThreshold(+e.target.value)} style={{width:120,accentColor:T.red}}/><span style={{fontSize:12,fontWeight:700,fontFamily:T.mono,color:T.red}}>{riskThreshold}</span></div>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>ILO 11 Indicators - Radar</div>
          <ResponsiveContainer width="100%" height={320}><RadarChart outerRadius={100} data={radarData}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="indicator" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="score" stroke={T.red} fill={T.red+'30'} fillOpacity={0.5} name="Risk Score"/></RadarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Indicator Detail Scores</div>
          <div style={{maxHeight:330,overflowY:'auto'}}>
            {sc.iloScores.sort((a,b)=>b.score-a.score).map((s,i)=>{const isHigh=s.score>riskThreshold;return<div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:11,fontWeight:isHigh?600:400,color:isHigh?T.red:T.text}}>{s.indicator}</span><span style={{fontSize:11,fontFamily:T.mono,fontWeight:700,color:isHigh?T.red:T.green}}>{s.score}/100</span></div>
              <div style={{width:'100%',height:5,background:T.border,borderRadius:3}}><div style={{width:`${s.score}%`,height:5,background:isHigh?T.red:T.green,borderRadius:3}}/></div>
            </div>;})}
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Cross-Company ILO Comparison (Top 15)</div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={SUPPLY_CHAINS.slice(0,15).map(s=>({name:s.company.slice(0,15),avg:Math.round(s.iloScores.reduce((a,x)=>a+x.score,0)/11),highRisk:s.iloScores.filter(x=>x.score>riskThreshold).length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="avg" fill={T.red} name="Avg ILO Risk" radius={[3,3,0,0]}/><Bar dataKey="highRisk" fill={T.amber} name="# High Risk" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </div>);
  };

  const renderCompliance=()=>{
    const frameworks=[
      {name:'CSDDD (EU)',field:'csdddReady',description:'EU Corporate Sustainability Due Diligence Directive',deadline:'2026',compliant:SUPPLY_CHAINS.filter(s=>s.csdddReady).length},
      {name:'UFLPA (USA)',field:'uflpaCompliant',description:'Uyghur Forced Labor Prevention Act',deadline:'In Force',compliant:SUPPLY_CHAINS.filter(s=>s.uflpaCompliant).length},
      {name:'UK MSA',field:'ukMsaQuality',description:'UK Modern Slavery Act - Statement Quality',deadline:'Annual',compliant:SUPPLY_CHAINS.filter(s=>s.ukMsaQuality>60).length},
      {name:'German LkSG',field:'',description:'German Supply Chain Due Diligence Act',deadline:'In Force',compliant:Math.round(SUPPLY_CHAINS.length*0.45)},
      {name:'French Vigilance',field:'',description:'French Duty of Vigilance Law',deadline:'In Force',compliant:Math.round(SUPPLY_CHAINS.length*0.38)},
      {name:'Norway Transparency',field:'',description:'Norwegian Transparency Act',deadline:'In Force',compliant:Math.round(SUPPLY_CHAINS.length*0.42)},
    ];
    const filteredFw=regFramework==='All'?frameworks:frameworks.filter(f=>f.name.includes(regFramework));
    return(<div>
      <Row cols="1fr 1fr 1fr"><Kpi label="Frameworks Tracked" value={6} accent={T.navy}/><Kpi label="Avg Compliance Rate" value={`${Math.round(frameworks.reduce((a,f)=>a+f.compliant,0)/(frameworks.length*60)*100)}%`} accent={T.amber}/><Kpi label="Non-Compliant Chains" value={SUPPLY_CHAINS.filter(s=>!s.uflpaCompliant&&!s.csdddReady).length} accent={T.red}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={regFramework} onChange={e=>setRegFramework(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Frameworks</option><option>CSDDD</option><option>UFLPA</option><option>UK MSA</option><option>LkSG</option></select>
        <button onClick={()=>exportCSV(SUPPLY_CHAINS.map(s=>({Company:s.company,Industry:s.industry,UFLPA:s.uflpaCompliant?'Yes':'No',CSDDD:s.csdddReady?'Yes':'No',UKMSAQuality:s.ukMsaQuality,RiskScore:s.riskScore})),'regulatory_compliance.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Framework Compliance Rates</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={filteredFw.map(f=>({name:f.name,compliant:Math.round(f.compliant/60*100),nonCompliant:100-Math.round(f.compliant/60*100)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="compliant" fill={T.green} name="Compliant %" stackId="a" radius={[3,3,0,0]}/><Bar dataKey="nonCompliant" fill={T.red} name="Non-Compliant %" stackId="a"/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Framework Details</div>
          {frameworks.map((f,i)=>{const pct=Math.round(f.compliant/60*100);return<div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,fontWeight:600}}>{f.name}</span><span style={{fontSize:11,fontFamily:T.mono,color:pct>50?T.green:T.red}}>{pct}%</span></div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{f.description}</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textSec}}><span>Deadline: {f.deadline}</span><span>{f.compliant}/60 compliant</span></div>
            <div style={{width:'100%',height:5,background:T.border,borderRadius:3,marginTop:4}}><div style={{width:`${pct}%`,height:5,background:pct>50?T.green:T.red,borderRadius:3}}/></div>
          </div>;})}
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Multi-Framework Compliance Matrix</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0}}><tr>{['Company','Industry','UFLPA','CSDDD','UK MSA','Overall Risk','Tier'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{SUPPLY_CHAINS.slice(0,30).map(s=>{const tc={Critical:T.red,High:T.amber,Medium:T.gold,Low:T.green}[s.tier];return<tr key={s.id}>
              <td style={{...td,fontWeight:500}}>{s.company}</td><td style={{...td,fontSize:11}}>{s.industry}</td>
              <td style={td}><Badge bg={s.uflpaCompliant?T.green+'20':T.red+'20'} fg={s.uflpaCompliant?T.green:T.red}>{s.uflpaCompliant?'Pass':'Fail'}</Badge></td>
              <td style={td}><Badge bg={s.csdddReady?T.green+'20':T.red+'20'} fg={s.csdddReady?T.green:T.red}>{s.csdddReady?'Ready':'Not Ready'}</Badge></td>
              <td style={td}><span style={{fontFamily:T.mono,color:s.ukMsaQuality>60?T.green:T.red}}>{s.ukMsaQuality}%</span></td>
              <td style={{...td,fontFamily:T.mono,fontWeight:700,color:s.riskScore>70?T.red:T.green}}>{s.riskScore}</td>
              <td style={td}><Badge bg={tc+'20'} fg={tc}>{s.tier}</Badge></td>
            </tr>;})}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 28px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0}}>Forced Labour & Modern Slavery</h1><p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Screen 60 supply chains across 15 source countries with ILO indicator scoring and multi-framework compliance</p></div>
    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:tab===i?T.surface:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderHeatmap()}
    {tab===1&&renderScreening()}
    {tab===2&&renderDueDiligence()}
    {tab===3&&renderCompliance()}
  </div>);
}