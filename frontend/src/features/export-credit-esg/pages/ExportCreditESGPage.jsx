import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Transaction Pipeline','Environmental Review','Country ESG Risk','Portfolio Analytics'];
const COLORS=[T.navy,T.sage,T.gold,T.red,T.green,T.amber,'#7c3aed','#0ea5e9'];
const SECTORS=['Renewable Energy','Infrastructure','Manufacturing','Oil & Gas','Mining','Agriculture','Defence','Shipping','Aviation','Chemicals','Telecom','Power Generation'];
const ECA_NAMES=['Euler Hermes (DE)','Bpifrance (FR)','US EXIM (US)','UKEF (GB)','NEXI (JP)','K-EXIM (KR)','SACE (IT)','CESCE (ES)','Atradius (NL)','EDC (CA)','Sinosure (CN)','EKN (SE)','SERV (CH)','OeKB (AT)','EKF (DK)'];
const ESG_CATS=['A','B','C'];
const IFC_PS=['PS1 Assessment','PS2 Labour','PS3 Pollution','PS4 Community','PS5 Land Resettlement','PS6 Biodiversity','PS7 Indigenous','PS8 Cultural Heritage'];
const EP_CATS=['Category A','Category B','Category C'];
const PROJ_NAMES=['Mekong Solar Farm','Trans-Saharan Pipeline','Baltic Wind Park','Andean Copper Mine','Jakarta Mass Transit','Lagos Port Expansion','Patagonia Wind Complex','Nile Irrigation System','Caspian Gas Platform','Borneo Palm Refinery','Rhine Bridge Upgrade','Mumbai Metro Line 4','Atacama Lithium Mine','Great Barrier Reef Desalin','Congo Hydro Dam','Arabian Solar Mega','Volga Nuclear Station','Amazon Agri-Hub','Nordic Data Centre','Cape Town Wind','Queensland LNG','Suez Canal Widening','Danube Flood Wall','Kenya Geothermal','Panama Canal Lock','Chile Green H2','Egypt Nuclear','Morocco Solar Noor','Turkmen Gas','Uzbek Solar','Thai Rail Link','Vietnam Wind','Indo Steel Mill','Peru Copper','Tanzania Gold','Ethiopia Dam','Uganda Oil Pipeline','Mozambique LNG','Nigeria Refinery','Angola Solar','Ghana Cocoa','Ivory Coast Port','Senegal Wind','Cameroon Hydro','DRC Cobalt','Zambia Solar','Zimbabwe Lithium','Mali Gold','Sierra Leone Iron','Madagascar Nickel'];

const transactions=Array.from({length:50},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);
  const sector=SECTORS[Math.floor(s*SECTORS.length)];const eca=ECA_NAMES[Math.floor(s2*ECA_NAMES.length)];
  const esgCat=ESG_CATS[Math.floor(s3*3)];const epCat=EP_CATS[Math.floor(s4*3)];
  const country=['Germany','France','USA','UK','Japan','South Korea','Italy','Spain','Netherlands','Canada','China','Sweden','Brazil','India','Australia','Mexico','Turkey','Saudi Arabia','UAE','South Africa','Nigeria','Kenya','Egypt','Morocco','Indonesia'][Math.floor(sr(i*29)*25)];
  const hostCountry=['Bangladesh','Indonesia','Ethiopia','Philippines','Mozambique','Peru','Pakistan','Cambodia','Vietnam','Thailand','India','Brazil','Mexico','Nigeria','Kenya','Egypt','Morocco','Colombia','Chile','Argentina','South Africa','Ghana','Tanzania','Uganda','Zambia','Turkey','Saudi Arabia','UAE','Iraq','Kazakhstan','Uzbekistan','Myanmar','Laos','Sri Lanka','Nepal','Mongolia','Papua New Guinea','Fiji','Samoa','Tonga'][Math.floor(sr(i*31)*40)];
  return {id:i+1,project:PROJ_NAMES[i%PROJ_NAMES.length],sector,eca,esgCat,epCat,exporterCountry:country,hostCountry,
    valueMn:Math.round(50+s*950),tenorYrs:Math.round(3+s2*12),
    ifcScreening:IFC_PS.map((ps,j)=>({standard:ps,status:sr(i*37+j)>0.3?'Compliant':sr(i*37+j)>0.15?'Partial':'Gap',score:Math.round(40+sr(i*41+j)*55)})),
    oecdScore:Math.round(50+s3*45),eScore:Math.round(40+sr(i*43)*55),sScore:Math.round(45+sr(i*47)*50),gScore:Math.round(50+sr(i*51)*45),
    carbonIntensity:Math.round(20+s*800),waterRisk:['Low','Medium','High','Very High'][Math.floor(sr(i*53)*4)],
    biodiversityRisk:sr(i*57)<0.3?'Critical':sr(i*57)<0.6?'High':'Moderate',
    status:['Pipeline','Under Review','Approved','Disbursing','Monitoring'][Math.floor(sr(i*59)*5)],
    lastAssessment:`2025-${String(1+Math.floor(sr(i*61)*12)).padStart(2,'0')}-${String(1+Math.floor(sr(i*63)*28)).padStart(2,'0')}`,
    covenants:Math.round(2+s4*6),mitigationMeasures:Math.round(1+s*8)};
});

const countries=Array.from({length:40},(_,i)=>{const s=sr(i*11);const s2=sr(i*17);
  const name=['Bangladesh','Indonesia','Ethiopia','Philippines','Mozambique','Peru','Pakistan','Cambodia','Vietnam','Thailand','India','Brazil','Mexico','Nigeria','Kenya','Egypt','Morocco','Colombia','Chile','Argentina','South Africa','Ghana','Tanzania','Uganda','Zambia','Turkey','Saudi Arabia','UAE','Iraq','Kazakhstan','Uzbekistan','Myanmar','Laos','Sri Lanka','Nepal','Mongolia','Papua New Guinea','Fiji','Samoa','Tonga'][i];
  return {country:name,oecdRisk:Math.round(1+s*6),eScore:Math.round(30+s*60),sScore:Math.round(35+s2*55),gScore:Math.round(40+sr(i*23)*50),
    climatVuln:Math.round(20+s2*70),conflictRisk:['Low','Medium','High'][Math.floor(sr(i*29)*3)],
    humanRights:['Adequate','Concern','Serious'][Math.floor(sr(i*31)*3)],corruptionIdx:Math.round(20+sr(i*37)*60),
    region:['South Asia','SE Asia','East Africa','SE Asia','Southern Africa','South America','South Asia','SE Asia','SE Asia','SE Asia','South Asia','South America','Central America','West Africa','East Africa','North Africa','North Africa','South America','South America','South America','Southern Africa','West Africa','East Africa','East Africa','Southern Africa','West Asia','Middle East','Middle East','Middle East','Central Asia','Central Asia','SE Asia','SE Asia','South Asia','South Asia','East Asia','Oceania','Oceania','Oceania','Oceania'][i]};
});

const tipS={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font,color:T.text}};
const Stat=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${color||T.sage}`}}>
  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:6,fontFamily:T.font}}>{label}</div>
  <div style={{fontSize:26,fontWeight:800,color:T.navy,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3}}>{sub}</div>}</div>);
const Badge=({children,color})=>{const m={green:{bg:'#dcfce7',fg:T.green},red:{bg:'#fee2e2',fg:T.red},amber:{bg:'#fef3c7',fg:T.amber},navy:{bg:'#dbeafe',fg:T.navy},sage:{bg:'#d1fae5',fg:T.sage}};const c=m[color]||m.sage;return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.bg,color:c.fg}}>{children}</span>;};
const exportCSV=(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${name}.csv`;a.click();URL.revokeObjectURL(u);};

const thS={padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',fontFamily:T.font,background:T.surfaceH,position:'sticky',top:0};
const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};
const tdM={...tdS,fontFamily:T.mono,fontWeight:600};

export default function ExportCreditESGPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('valueMn');
  const [sortDir,setSortDir]=useState('desc');
  const [filterSector,setFilterSector]=useState('All');
  const [filterCat,setFilterCat]=useState('All');
  const [expanded,setExpanded]=useState(null);
  const [selectedTx,setSelectedTx]=useState(null);
  const [showPanel,setShowPanel]=useState(false);
  const [countrySearch,setCountrySearch]=useState('');
  const [countrySortCol,setCountrySortCol]=useState('oecdRisk');
  const [countrySortDir,setCountrySortDir]=useState('desc');
  const [regionFilter,setRegionFilter]=useState('All');
  const [analyticsView,setAnalyticsView]=useState('sector');

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};
  const toggleCountrySort=(col)=>{if(countrySortCol===col)setCountrySortDir(d=>d==='asc'?'desc':'asc');else{setCountrySortCol(col);setCountrySortDir('desc');}};

  const filtered=useMemo(()=>{let d=[...transactions];if(search)d=d.filter(r=>r.project.toLowerCase().includes(search.toLowerCase())||r.eca.toLowerCase().includes(search.toLowerCase()));if(filterSector!=='All')d=d.filter(r=>r.sector===filterSector);if(filterCat!=='All')d=d.filter(r=>r.esgCat===filterCat);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,filterSector,filterCat,sortCol,sortDir]);

  const filteredCountries=useMemo(()=>{let d=[...countries];if(countrySearch)d=d.filter(r=>r.country.toLowerCase().includes(countrySearch.toLowerCase()));if(regionFilter!=='All')d=d.filter(r=>r.region===regionFilter);d.sort((a,b)=>countrySortDir==='asc'?(a[countrySortCol]>b[countrySortCol]?1:-1):(a[countrySortCol]<b[countrySortCol]?1:-1));return d;},[countrySearch,regionFilter,countrySortCol,countrySortDir]);

  const totalValue=transactions.reduce((s,t)=>s+t.valueMn,0);
  const catACnt=transactions.filter(t=>t.esgCat==='A').length;
  const avgOecd=Math.round(transactions.reduce((s,t)=>s+t.oecdScore,0)/50);

  const sectorAgg=useMemo(()=>SECTORS.map(s=>{const ts=transactions.filter(t=>t.sector===s);return {sector:s,count:ts.length,value:ts.reduce((a,t)=>a+t.valueMn,0)};}).filter(s=>s.count>0),[]);
  const geoAgg=useMemo(()=>{const m={};transactions.forEach(t=>{if(!m[t.hostCountry])m[t.hostCountry]={country:t.hostCountry,count:0,value:0};m[t.hostCountry].count++;m[t.hostCountry].value+=t.valueMn;});return Object.values(m).sort((a,b)=>b.value-a.value).slice(0,15);},[]);
  const riskDist=useMemo(()=>[{cat:'Category A',count:catACnt},{cat:'Category B',count:transactions.filter(t=>t.esgCat==='B').length},{cat:'Category C',count:transactions.filter(t=>t.esgCat==='C').length}],[]);
  const regions=[...new Set(countries.map(c=>c.region))].sort();

  return (<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0}}>Export Credit ESG Analytics</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>50 export credit transactions -- IFC Performance Standards, Equator Principles, OECD Common Approaches</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <Stat label="Transactions" value="50" sub="Active pipeline" color={T.navy}/>
        <Stat label="Total Value" value={`$${(totalValue/1000).toFixed(1)}B`} sub="All ECAs" color={T.sage}/>
        <Stat label="Cat A (High Risk)" value={catACnt} sub="Require full ESIA" color={T.red}/>
        <Stat label="Avg OECD Score" value={`${avgOecd}%`} sub="Common Approaches" color={T.gold}/>
        <Stat label="Countries" value="40" sub="Host country coverage" color={T.amber}/>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'12px 24px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>

      {tab===0&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search project or ECA..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:260,outline:'none',background:T.surface}}/>
          <select value={filterSector} onChange={e=>setFilterSector(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Categories</option>{ESG_CATS.map(c=><option key={c} value={c}>Category {c}</option>)}
          </select>
          <button onClick={()=>exportCSV(filtered,'export_credit_pipeline')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} of 50</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <div style={{maxHeight:480,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'id',l:'#'},{k:'project',l:'Project'},{k:'sector',l:'Sector'},{k:'eca',l:'ECA'},{k:'hostCountry',l:'Host Country'},{k:'valueMn',l:'Value ($M)'},{k:'esgCat',l:'ESG Cat'},{k:'epCat',l:'EP Cat'},{k:'oecdScore',l:'OECD %'},{k:'status',l:'Status'}].map(c=>
                <th key={c.k} onClick={()=>toggleSort(c.k)} style={{...thS,color:sortCol===c.k?T.navy:T.textSec}}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{filtered.map(t=><React.Fragment key={t.id}>
                <tr onClick={()=>setExpanded(expanded===t.id?null:t.id)} style={{cursor:'pointer',background:expanded===t.id?T.surfaceH:'transparent'}}>
                  <td style={tdM}>{t.id}</td><td style={tdS}>{t.project}</td><td style={tdS}>{t.sector}</td><td style={{...tdS,fontSize:11}}>{t.eca}</td>
                  <td style={tdS}>{t.hostCountry}</td><td style={tdM}>{t.valueMn}</td>
                  <td style={tdS}><Badge color={t.esgCat==='A'?'red':t.esgCat==='B'?'amber':'green'}>{t.esgCat}</Badge></td>
                  <td style={tdS}><Badge color={t.epCat==='Category A'?'red':t.epCat==='Category B'?'amber':'green'}>{t.epCat}</Badge></td>
                  <td style={tdM}>{t.oecdScore}</td><td style={tdS}><Badge color={t.status==='Disbursing'?'green':t.status==='Approved'?'sage':'navy'}>{t.status}</Badge></td>
                </tr>
                {expanded===t.id&&<tr><td colSpan={10} style={{padding:16,background:T.surfaceH}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
                    <div><span style={{fontSize:10,color:T.textMut}}>Exporter</span><div style={{fontWeight:700}}>{t.exporterCountry}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Tenor</span><div style={{fontWeight:700}}>{t.tenorYrs}Y</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Carbon Intensity</span><div style={{fontWeight:700}}>{t.carbonIntensity} tCO2e/$M</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Water Risk</span><div><Badge color={t.waterRisk==='Low'?'green':t.waterRisk==='Medium'?'amber':'red'}>{t.waterRisk}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Biodiversity</span><div><Badge color={t.biodiversityRisk==='Moderate'?'green':t.biodiversityRisk==='High'?'amber':'red'}>{t.biodiversityRisk}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>E Score</span><div style={{fontWeight:700}}>{t.eScore}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>S Score</span><div style={{fontWeight:700}}>{t.sScore}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>G Score</span><div style={{fontWeight:700}}>{t.gScore}%</div></div>
                  </div>
                  <button onClick={(e)=>{e.stopPropagation();setSelectedTx(t);setShowPanel(true);}} style={{padding:'6px 14px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>View Full Assessment</button>
                </td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
        </div>
      </div>)}

      {tab===1&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select onChange={e=>setSelectedTx(transactions.find(t=>t.id===+e.target.value)||null)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface,minWidth:300}}>
            <option value="">Select a transaction...</option>{transactions.map(t=><option key={t.id} value={t.id}>{t.project} ({t.sector})</option>)}
          </select>
        </div>
        {selectedTx&&(<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>IFC Performance Standards Screening</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Standard','Status','Score'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>{selectedTx.ifcScreening.map((s,i)=><tr key={i}>
                  <td style={tdS}>{s.standard}</td><td style={tdS}><Badge color={s.status==='Compliant'?'green':s.status==='Partial'?'amber':'red'}>{s.status}</Badge></td><td style={tdM}>{s.score}%</td>
                </tr>)}</tbody>
              </table>
            </div>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Radar Profile</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[{dim:'Environmental',v:selectedTx.eScore},{dim:'Social',v:selectedTx.sScore},{dim:'Governance',v:selectedTx.gScore},{dim:'OECD',v:selectedTx.oecdScore},{dim:'Biodiversity',v:selectedTx.biodiversityRisk==='Moderate'?80:selectedTx.biodiversityRisk==='High'?50:30}]}>
                  <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Equator Principles Assessment</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <div><span style={{fontSize:10,color:T.textMut}}>EP Category</span><div style={{fontWeight:700}}>{selectedTx.epCat}</div></div>
              <div><span style={{fontSize:10,color:T.textMut}}>ESIA Required</span><div style={{fontWeight:700}}>{selectedTx.epCat==='Category A'?'Full ESIA':selectedTx.epCat==='Category B'?'Limited ESIA':'Screening Only'}</div></div>
              <div><span style={{fontSize:10,color:T.textMut}}>Stakeholder Engagement</span><div style={{fontWeight:700}}>{selectedTx.epCat==='Category A'?'Mandatory':'Recommended'}</div></div>
              <div><span style={{fontSize:10,color:T.textMut}}>Covenants</span><div style={{fontWeight:700}}>{selectedTx.covenants} active</div></div>
            </div>
          </div>
        </div>)}
        {!selectedTx&&<div style={{padding:40,textAlign:'center',color:T.textMut,fontSize:13}}>Select a transaction above to view its environmental review</div>}
      </div>)}

      {tab===2&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={countrySearch} onChange={e=>setCountrySearch(e.target.value)} placeholder="Search country..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:220,outline:'none',background:T.surface}}/>
          <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Regions</option>{regions.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={()=>exportCSV(filteredCountries,'country_esg_risk')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filteredCountries.length} countries</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:460,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'country',l:'Country'},{k:'region',l:'Region'},{k:'oecdRisk',l:'OECD Risk'},{k:'eScore',l:'E Score'},{k:'sScore',l:'S Score'},{k:'gScore',l:'G Score'},{k:'climatVuln',l:'Climate Vuln'},{k:'conflictRisk',l:'Conflict'},{k:'humanRights',l:'HR Status'},{k:'corruptionIdx',l:'CPI'}].map(c=>
                <th key={c.k} onClick={()=>toggleCountrySort(c.k)} style={{...thS,color:countrySortCol===c.k?T.navy:T.textSec}}>{c.l}{countrySortCol===c.k?(countrySortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{filteredCountries.map(c=><tr key={c.country}>
                <td style={{...tdS,fontWeight:700}}>{c.country}</td><td style={tdS}>{c.region}</td>
                <td style={tdM}><Badge color={c.oecdRisk<=2?'green':c.oecdRisk<=4?'amber':'red'}>{c.oecdRisk}/7</Badge></td>
                <td style={tdM}>{c.eScore}%</td><td style={tdM}>{c.sScore}%</td><td style={tdM}>{c.gScore}%</td>
                <td style={tdM}><Badge color={c.climatVuln<40?'green':c.climatVuln<60?'amber':'red'}>{c.climatVuln}%</Badge></td>
                <td style={tdS}><Badge color={c.conflictRisk==='Low'?'green':c.conflictRisk==='Medium'?'amber':'red'}>{c.conflictRisk}</Badge></td>
                <td style={tdS}><Badge color={c.humanRights==='Adequate'?'green':c.humanRights==='Concern'?'amber':'red'}>{c.humanRights}</Badge></td>
                <td style={tdM}>{c.corruptionIdx}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Climate Vulnerability vs Governance Score</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filteredCountries.slice(0,20)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="country" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/><Tooltip {...tipS}/>
              <Bar dataKey="climatVuln" fill={T.red} name="Climate Vuln" opacity={0.7}/><Bar dataKey="gScore" fill={T.sage} name="G Score" opacity={0.7}/><Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {tab===3&&(<div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {['sector','geography','risk'].map(v=><button key={v} onClick={()=>setAnalyticsView(v)} style={{padding:'8px 16px',background:analyticsView===v?T.navy:T.surface,color:analyticsView===v?'#fff':T.text,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,textTransform:'capitalize'}}>{v}</button>)}
          <button onClick={()=>exportCSV(transactions.map(t=>({project:t.project,sector:t.sector,value:t.valueMn,esgCat:t.esgCat,hostCountry:t.hostCountry,status:t.status})),'portfolio_analytics')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,marginLeft:'auto'}}>Export All</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          {analyticsView==='sector'&&<>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Value by Sector ($M)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorAgg}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="value" fill={T.navy} radius={[4,4,0,0]}>{sectorAgg.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Transaction Count by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={sectorAgg} dataKey="count" nameKey="sector" cx="50%" cy="50%" outerRadius={110} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>{sectorAgg.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip {...tipS}/></PieChart>
              </ResponsiveContainer>
            </div>
          </>}
          {analyticsView==='geography'&&<>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Top 15 Host Countries by Value</div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={geoAgg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="country" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/><Tooltip {...tipS}/><Bar dataKey="value" fill={T.sage} radius={[0,4,4,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Regional Distribution</div>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart><Pie data={(() => {const m={};transactions.forEach(t=>{const r=countries.find(c=>c.country===t.hostCountry);const reg=r?r.region:'Other';if(!m[reg])m[reg]={region:reg,value:0};m[reg].value+=t.valueMn;});return Object.values(m).sort((a,b)=>b.value-a.value);})()}
                  dataKey="value" nameKey="region" cx="50%" cy="50%" outerRadius={120} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} style={{fontSize:9}}>
                  {Array.from({length:10},(_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip {...tipS}/></PieChart>
              </ResponsiveContainer>
            </div>
          </>}
          {analyticsView==='risk'&&<>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Category Distribution</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={riskDist} dataKey="count" nameKey="cat" cx="50%" cy="50%" outerRadius={110} label>{riskDist.map((e,i)=><Cell key={i} fill={[T.red,T.amber,T.green][i]}/>)}</Pie><Tooltip {...tipS}/><Legend/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Avg ESG Scores by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={SECTORS.slice(0,8).map((s,i)=>{const ts=transactions.filter(t=>t.sector===s);const avg=(k)=>ts.length?Math.round(ts.reduce((a,t)=>a+t[k],0)/ts.length):0;return {sector:s,E:avg('eScore'),S:avg('sScore'),G:avg('gScore')};})}>
                  <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar dataKey="E" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="E"/><Radar dataKey="S" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="S"/><Radar dataKey="G" stroke={T.navy} fill={T.navy} fillOpacity={0.2} name="G"/><Legend/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>}
        </div>
      </div>)}

      {showPanel&&selectedTx&&<div style={{position:'fixed',top:0,right:0,width:500,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.navy,margin:0}}>{selectedTx.project}</h2>
          <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {[{l:'Sector',v:selectedTx.sector},{l:'ECA',v:selectedTx.eca},{l:'Host Country',v:selectedTx.hostCountry},{l:'Value',v:`$${selectedTx.valueMn}M`},{l:'Tenor',v:`${selectedTx.tenorYrs}Y`},{l:'ESG Cat',v:selectedTx.esgCat},{l:'EP Cat',v:selectedTx.epCat},{l:'Status',v:selectedTx.status},{l:'Carbon',v:`${selectedTx.carbonIntensity} tCO2e/$M`},{l:'Water Risk',v:selectedTx.waterRisk},{l:'Biodiversity',v:selectedTx.biodiversityRisk},{l:'Last Assessment',v:selectedTx.lastAssessment}].map((d,i)=><div key={i}><div style={{fontSize:10,color:T.textMut}}>{d.l}</div><div style={{fontWeight:700,fontSize:13}}>{d.v}</div></div>)}
        </div>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>IFC PS Scores</div>
        {selectedTx.ifcScreening.map((s,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
          <span>{s.standard}</span><span><Badge color={s.status==='Compliant'?'green':s.status==='Partial'?'amber':'red'}>{s.score}%</Badge></span>
        </div>)}
      </div>}
    </div>
  </div>);
}
