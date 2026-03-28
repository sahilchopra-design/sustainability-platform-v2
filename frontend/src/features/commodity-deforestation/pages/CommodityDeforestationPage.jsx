import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,PieChart,Pie,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,s)=>arr[Math.floor(sr(s)*arr.length)];
const rng=(min,max,s)=>Math.floor(sr(s)*(max-min+1))+min;
const pct=(s)=>Math.round(sr(s)*100);
const fmt=n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toString();

const COMMODITIES=['Palm Oil','Soy','Beef','Cocoa','Coffee','Rubber','Wood'];
const COMM_COLORS=['#d97706','#84cc16','#dc2626','#92400e','#78350f','#4d7c0f','#166534'];
const STATUSES=['Compliant','Partial','Non-Compliant','Not Assessed'];
const STATUS_CLR={Compliant:T.green,Partial:T.amber,'Non-Compliant':T.red,'Not Assessed':T.textMut};

const COUNTRIES=['Brazil','Indonesia','Malaysia','Colombia','Ivory Coast','Ghana','Vietnam','India','Thailand','Papua New Guinea','Ecuador','Peru','Cameroon','DR Congo','Myanmar','Laos','Cambodia','Nigeria','Honduras','Guatemala','Paraguay','Argentina','Bolivia','Tanzania','Uganda','Sierra Leone','Liberia','Philippines','Madagascar','Ethiopia'];
const REGIONS={Brazil:'S. America',Indonesia:'SE Asia',Malaysia:'SE Asia',Colombia:'S. America','Ivory Coast':'W. Africa',Ghana:'W. Africa',Vietnam:'SE Asia',India:'S. Asia',Thailand:'SE Asia','Papua New Guinea':'Oceania',Ecuador:'S. America',Peru:'S. America',Cameroon:'C. Africa','DR Congo':'C. Africa',Myanmar:'SE Asia',Laos:'SE Asia',Cambodia:'SE Asia',Nigeria:'W. Africa',Honduras:'C. America',Guatemala:'C. America',Paraguay:'S. America',Argentina:'S. America',Bolivia:'S. America',Tanzania:'E. Africa',Uganda:'E. Africa','Sierra Leone':'W. Africa',Liberia:'W. Africa',Philippines:'SE Asia',Madagascar:'E. Africa',Ethiopia:'E. Africa'};

const CERT_SCHEMES=['RSPO','RTRS','Rainforest Alliance','FSC','UTZ','ProTerra','ISCC','RSB','Bonsucro','ASI','PEFC','SAN','Fairtrade','CmiA','GreenPalm'];
const CERT_TYPES={RSPO:'Palm Oil',RTRS:'Soy','Rainforest Alliance':'Multi',FSC:'Wood',UTZ:'Multi',ProTerra:'Soy',ISCC:'Multi',RSB:'Multi',Bonsucro:'Sugar/Ethanol',ASI:'Aluminium/Multi',PEFC:'Wood',SAN:'Multi',Fairtrade:'Multi',CmiA:'Cotton/Multi',GreenPalm:'Palm Oil'};

const COMPANY_NAMES=['Cargill','Wilmar International','Bunge','ADM','Louis Dreyfus','Olam','Barry Callebaut','Sime Darby','Golden Agri-Resources','Musim Mas','IOI Group','Astra Agro','JBS','Marfrig','Minerva Foods','BRF','Nestl\u00e9','Unilever','Mondelez','Mars','Ferrero','Hershey','Procter & Gamble','Colgate-Palmolive','Henkel','BASF','Bridgestone','Michelin','Goodyear','Continental','Suzano','Klabin','APP','APRIL','Korindo','Sampoerna Agro','Felda Global','Kuala Lumpur Kepong','Genting Plantations','TSH Resources','Sipef','Socfin','Bolloré','Siat','PZ Cussons','AAK','Fuji Oil','Meiji Holdings','Nisshin OilliO','Itochu','Mitsui','Sumitomo','Mitsubishi Corp','Toyota Tsusho','Marubeni','Tesco','Carrefour','Walmart','Costco','Kroger','Lidl','Aldi','Metro AG','Ahold Delhaize','Sainsburys','Morrison','Danone','General Mills','Kellogg','PepsiCo','Coca-Cola','Starbucks','McDonalds','Yum Brands','Restaurant Brands','Tyson Foods','Hormel','Smithfield','NH Foods','Charoen Pokphand','Dole Food','Del Monte','Chiquita','Syngenta','Bayer','FMC Corp','Corteva','UPL','COFCO','CEFC China','Indofood','Agropalma','Socfindo','Palmci','Sifca','Biosev','Raizen','Usina São Martinho','São Martinho Group','Açucar Guarani'];

const genCountryRisk=()=>COUNTRIES.map((c,i)=>({name:c,region:REGIONS[c],deforestRate:+(sr(i*31)*4.5+0.2).toFixed(2),forestCover:rng(15,85,i*17),riskScore:rng(20,98,i*23),eudrPriority:rng(20,98,i*23)>70?'High':rng(20,98,i*23)>40?'Medium':'Low',primaryCommodity:pick(COMMODITIES,i*7),annualLoss:rng(5000,250000,i*41),protectedArea:rng(5,45,i*53)}));
const COUNTRY_DATA=genCountryRisk();

const genCompanies=()=>{const cos=[];for(let i=0;i<100;i++){const name=COMPANY_NAMES[i]||`Company_${i+1}`;const numComm=rng(1,4,i*19);const comms=[];const seed0=i*37;for(let j=0;j<numComm;j++){const c=COMMODITIES[(Math.floor(sr(seed0+j*11)*7))%7];if(!comms.includes(c))comms.push(c);}const commStatus={};comms.forEach((c,ci)=>{commStatus[c]=pick(STATUSES,i*13+ci*7);});const country=pick(COUNTRIES,i*29);cos.push({id:i,name,country,region:REGIONS[country],commodities:comms,commStatus,revenue:rng(500,80000,i*43)*1e6,employees:rng(500,120000,i*47),traceability:rng(10,98,i*53),geoDataPct:rng(5,95,i*59),overallStatus:comms.every(c=>commStatus[c]==='Compliant')?'Compliant':comms.some(c=>commStatus[c]==='Non-Compliant')?'Non-Compliant':comms.some(c=>commStatus[c]==='Partial')?'Partial':'Not Assessed',riskScore:rng(5,95,i*61),size:rng(500,120000,i*47)>50000?'Large Operator':'SME',dueDiligenceScore:rng(15,98,i*67),certifications:CERT_SCHEMES.filter((_,ci)=>sr(i*71+ci*13)>0.65)});}return cos;};
const COMPANIES=genCompanies();

const genSupplyPaths=()=>{const paths=[];for(let i=0;i<50;i++){const comm=pick(COMMODITIES,i*31);const origin=pick(COUNTRIES,i*37);const processors=['Refinery A','Mill B','Processing Plant C','Crushing Facility D','Roasting House E','Tannery F','Sawmill G'];const importers=['TradePort EU','CommodiTrade','EuroImport GmbH','Atlantic Commodities','Nordic Supply Co','MediterraneanLink','BalticBridge'];paths.push({id:i,commodity:comm,origin,processor:pick(processors,i*41),importer:pick(importers,i*43),endUser:pick(COMPANY_NAMES.slice(0,30),i*47),volume:rng(1000,50000,i*53),traceability:rng(10,98,i*59),riskLevel:rng(10,98,i*59)>70?'High':rng(10,98,i*59)>35?'Medium':'Low',geolocated:sr(i*61)>0.4,certScheme:sr(i*67)>0.5?pick(CERT_SCHEMES,i*71):'None'});}return paths;};
const SUPPLY_PATHS=genSupplyPaths();

const genCertData=()=>CERT_SCHEMES.map((s,i)=>({name:s,commodity:CERT_TYPES[s],coverage:rng(5,85,i*31),credibility:rng(40,98,i*37),cost:rng(2,25,i*41),deforestFree:rng(30,99,i*43),auditFreq:pick(['Annual','Biennial','Continuous','Triennial'],i*47),members:rng(50,5000,i*53),founded:rng(1993,2020,i*59),traceability:rng(20,95,i*61),blockchainReady:sr(i*67)>0.5,geoPct:rng(10,90,i*71)}));
const CERT_DATA=genCertData();

const genYearlyDeforest=comm=>{const base=rng(100,500,COMMODITIES.indexOf(comm)*31);return Array.from({length:8},(_,i)=>({year:2018+i,area:Math.max(20,base+rng(-80,80,comm.length*i*13)),alerts:rng(50,500,comm.length*i*17)}));};

const RADAR_DIMS=['Deforestation Risk','Price Volatility','Substitutability','Certification Avail.','Traceability Maturity','Regulatory Scrutiny'];
const genCommodityRadar=()=>COMMODITIES.map((c,i)=>{const obj={commodity:c};RADAR_DIMS.forEach((d,di)=>{obj[d]=rng(15,95,i*31+di*13);});obj.color=COMM_COLORS[i];return obj;});
const COMMODITY_RADAR=genCommodityRadar();

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:16,...style}}>{children}</div>;
const KPI=({label,value,sub,color})=><div style={{textAlign:'center',padding:'12px 16px'}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>;
const Badge=({text,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontFamily:T.mono,fontWeight:600,background:color+'18',color,border:`1px solid ${color}40`}}>{text}</span>;
const Tabs=({tabs,active,onChange})=><div style={{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:16}}>{tabs.map((t,i)=><button key={i} onClick={()=>onChange(i)} style={{padding:'10px 20px',background:active===i?T.surface:'transparent',color:active===i?T.navy:T.textSec,fontFamily:T.mono,fontSize:12,fontWeight:active===i?700:500,border:'none',borderBottom:active===i?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',letterSpacing:0.5,textTransform:'uppercase',marginBottom:-2}}>{t}</button>)}</div>;

const CustomTooltip=({active,payload,label})=>{if(!active||!payload?.length)return null;return<div style={{background:T.navy,color:'#fff',padding:'8px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono}}><div style={{marginBottom:4,fontWeight:700}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.goldL}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}</div>)}</div>;};

/* ─── TAB 1: EUDR COMPLIANCE DASHBOARD ─── */
const EudrDashboard=()=>{
  const [commFilter,setCommFilter]=useState('All');
  const [statusFilter,setStatusFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [selected,setSelected]=useState(null);
  const [sortCol,setSortCol]=useState('name');
  const [sortDir,setSortDir]=useState(1);

  const filtered=useMemo(()=>{
    let f=COMPANIES;
    if(commFilter!=='All')f=f.filter(c=>c.commodities.includes(commFilter));
    if(statusFilter!=='All')f=f.filter(c=>c.overallStatus===statusFilter);
    if(countryFilter!=='All')f=f.filter(c=>c.country===countryFilter);
    f=[...f].sort((a,b)=>{
      if(sortCol==='name')return a.name.localeCompare(b.name)*sortDir;
      if(sortCol==='risk')return(a.riskScore-b.riskScore)*sortDir;
      if(sortCol==='trace')return(a.traceability-b.traceability)*sortDir;
      if(sortCol==='status')return a.overallStatus.localeCompare(b.overallStatus)*sortDir;
      return 0;
    });
    return f;
  },[commFilter,statusFilter,countryFilter,sortCol,sortDir]);

  const kpis=useMemo(()=>{
    const exposed=COMPANIES.filter(c=>c.commodities.length>0).length;
    const compliant=COMPANIES.filter(c=>c.overallStatus==='Compliant').length;
    const highRisk=COMPANIES.filter(c=>c.riskScore>70).length;
    return{exposed,compliant,highRisk,pctExposed:Math.round(exposed/COMPANIES.length*100),pctCompliant:Math.round(compliant/COMPANIES.length*100)};
  },[]);

  const commDonut=useMemo(()=>COMMODITIES.map((c,i)=>({name:c,value:COMPANIES.filter(co=>co.commodities.includes(c)).length,color:COMM_COLORS[i]})),[]);

  const countryRiskTop=useMemo(()=>[...COUNTRY_DATA].sort((a,b)=>b.riskScore-a.riskScore).slice(0,15),[]);

  const toggleSort=col=>{if(sortCol===col)setSortDir(-sortDir);else{setSortCol(col);setSortDir(1);}};

  const now=new Date();
  const lgDeadline=new Date('2025-12-30');
  const smeDeadline=new Date('2026-06-30');
  const daysToLg=Math.max(0,Math.ceil((lgDeadline-now)/(1000*60*60*24)));
  const daysToSme=Math.max(0,Math.ceil((smeDeadline-now)/(1000*60*60*24)));

  if(selected!==null){
    const co=COMPANIES.find(c=>c.id===selected);
    return(<div>
      <button onClick={()=>setSelected(null)} style={{background:'none',border:`1px solid ${T.border}`,borderRadius:4,padding:'6px 14px',fontFamily:T.mono,fontSize:12,color:T.navy,cursor:'pointer',marginBottom:12}}>Back to Dashboard</button>
      <Card style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:18,fontWeight:700,color:T.navy}}>{co.name}</span><span style={{marginLeft:12,fontSize:12,color:T.textSec}}>{co.country} | {co.region}</span></div>
          <Badge text={co.overallStatus} color={STATUS_CLR[co.overallStatus]}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
          <KPI label="Revenue" value={fmt(co.revenue)}/>
          <KPI label="Employees" value={fmt(co.employees)}/>
          <KPI label="Traceability" value={co.traceability+'%'} color={co.traceability>70?T.green:co.traceability>40?T.amber:T.red}/>
          <KPI label="Geo-Data" value={co.geoDataPct+'%'} color={co.geoDataPct>60?T.green:T.amber}/>
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <Card>
          <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:12,textTransform:'uppercase'}}>Per-Commodity Compliance Checklist</div>
          <table style={{width:'100%',fontSize:12,fontFamily:T.font,borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{['Commodity','Status','Due Diligence','Traceability','Geolocation'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{co.commodities.map((cm,ci)=><tr key={ci} style={{borderBottom:`1px solid ${T.border}22`}}>
              <td style={{padding:'6px 8px',fontWeight:600}}>{cm}</td>
              <td style={{padding:'6px 8px'}}><Badge text={co.commStatus[cm]} color={STATUS_CLR[co.commStatus[cm]]}/></td>
              <td style={{padding:'6px 8px'}}>{co.commStatus[cm]==='Compliant'?'Complete':co.commStatus[cm]==='Partial'?'In Progress':'Pending'}</td>
              <td style={{padding:'6px 8px'}}>{rng(10,98,co.id*13+ci*7)}%</td>
              <td style={{padding:'6px 8px'}}>{sr(co.id*17+ci*11)>0.5?'Available':'Gaps Identified'}</td>
            </tr>)}</tbody>
          </table>
        </Card>
        <Card>
          <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:12,textTransform:'uppercase'}}>Certifications Held</div>
          {co.certifications.length===0?<div style={{color:T.textMut,fontSize:12}}>No certifications on record</div>:
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{co.certifications.map((c,i)=><Badge key={i} text={c} color={T.sage}/>)}</div>}
          <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,margin:'16px 0 8px',textTransform:'uppercase'}}>Classification</div>
          <div style={{fontSize:13,color:T.textSec}}><strong>Operator Size:</strong> {co.size}</div>
          <div style={{fontSize:13,color:T.textSec,marginTop:4}}><strong>EUDR Deadline:</strong> {co.size==='Large Operator'?'30 Dec 2025':'30 Jun 2026'}</div>
          <div style={{fontSize:13,color:T.textSec,marginTop:4}}><strong>Due Diligence Score:</strong> {co.dueDiligenceScore}/100</div>
        </Card>
      </div>
    </div>);
  }

  return(<div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
      <Card><KPI label="EUDR-Exposed" value={kpis.pctExposed+'%'} sub={`${kpis.exposed} companies`}/></Card>
      <Card><KPI label="Compliant" value={kpis.pctCompliant+'%'} sub={`${kpis.compliant} companies`} color={T.green}/></Card>
      <Card><KPI label="High-Risk Chains" value={kpis.highRisk} color={T.red}/></Card>
      <Card><KPI label="Large Op. Deadline" value={daysToLg>0?`${daysToLg}d`:'PASSED'} sub="30 Dec 2025" color={daysToLg>90?T.green:daysToLg>0?T.amber:T.red}/></Card>
      <Card><KPI label="SME Deadline" value={daysToSme>0?`${daysToSme}d`:'PASSED'} sub="30 Jun 2026" color={daysToSme>180?T.green:daysToSme>0?T.amber:T.red}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Commodity Exposure Distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart><Pie data={commDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>{commDonut.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11,fontFamily:T.mono}}/></PieChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Country Risk Heatmap (Top 15)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={countryRiskTop} layout="vertical" margin={{left:80,right:16,top:4,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} width={75}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="riskScore" name="Risk Score">{countryRiskTop.map((e,i)=><Cell key={i} fill={e.riskScore>70?T.red:e.riskScore>40?T.amber:T.green}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <Card>
      <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,textTransform:'uppercase'}}>Companies ({filtered.length})</span>
        <select value={commFilter} onChange={e=>setCommFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11,color:T.navy}}>
          <option value="All">All Commodities</option>{COMMODITIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11,color:T.navy}}>
          <option value="All">All Statuses</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={countryFilter} onChange={e=>setCountryFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11,color:T.navy}}>
          <option value="All">All Countries</option>{[...new Set(COMPANIES.map(c=>c.country))].sort().map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{maxHeight:420,overflowY:'auto'}}>
        <table style={{width:'100%',fontSize:12,fontFamily:T.font,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`,position:'sticky',top:0,background:T.surface}}>
            {[{k:'name',l:'Company'},{k:'status',l:'Status'},{k:'commodities',l:'Commodities'},{k:'country',l:'Country'},{k:'trace',l:'Trace %'},{k:'risk',l:'Risk'}].map(h=>
              <th key={h.k} onClick={()=>h.k!=='commodities'&&toggleSort(h.k)} style={{padding:'8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:11,cursor:'pointer',userSelect:'none'}}>{h.l}{sortCol===h.k?(sortDir===1?' \u25B2':' \u25BC'):''}</th>)}
          </tr></thead>
          <tbody>{filtered.slice(0,50).map(co=><tr key={co.id} onClick={()=>setSelected(co.id)} style={{borderBottom:`1px solid ${T.border}22`,cursor:'pointer',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <td style={{padding:'8px',fontWeight:600,color:T.navy}}>{co.name}</td>
            <td style={{padding:'8px'}}><Badge text={co.overallStatus} color={STATUS_CLR[co.overallStatus]}/></td>
            <td style={{padding:'8px'}}><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{co.commodities.map((c,i)=><span key={i} style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:COMM_COLORS[COMMODITIES.indexOf(c)]+'20',color:COMM_COLORS[COMMODITIES.indexOf(c)],fontFamily:T.mono}}>{c}</span>)}</div></td>
            <td style={{padding:'8px',color:T.textSec}}>{co.country}</td>
            <td style={{padding:'8px',fontFamily:T.mono,color:co.traceability>70?T.green:co.traceability>40?T.amber:T.red}}>{co.traceability}%</td>
            <td style={{padding:'8px',fontFamily:T.mono,color:co.riskScore>70?T.red:co.riskScore>40?T.amber:T.green}}>{co.riskScore}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>);
};

/* ─── TAB 2: COMMODITY RISK ANALYSIS ─── */
const CommodityRisk=()=>{
  const [selComm,setSelComm]=useState('Palm Oil');
  const [selPath,setSelPath]=useState(null);
  const commIdx=COMMODITIES.indexOf(selComm);
  const radar=COMMODITY_RADAR[commIdx];
  const yearData=useMemo(()=>genYearlyDeforest(selComm),[selComm]);
  const countryBreak=useMemo(()=>{
    const relevant=COUNTRY_DATA.filter((_,i)=>pick(COMMODITIES,i*7)===selComm||sr(i*31+commIdx*7)>0.6).slice(0,10);
    return relevant.map(c=>({name:c.name,volume:rng(5000,100000,c.name.length*commIdx*13),riskScore:c.riskScore}));
  },[selComm,commIdx]);
  const paths=useMemo(()=>SUPPLY_PATHS.filter(p=>p.commodity===selComm),[selComm]);
  const priceData=useMemo(()=>Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,price:rng(200,1200,commIdx*100+i*17)+sr(commIdx*i*31)*100})),[commIdx]);

  const radarBars=RADAR_DIMS.map((d,i)=>({dim:d,value:radar[d],fill:radar[d]>70?T.red:radar[d]>40?T.amber:T.green}));

  const alertData=useMemo(()=>Array.from({length:12},(_,i)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],alerts:rng(20,300,commIdx*31+i*13),area:rng(100,5000,commIdx*37+i*17)})),[commIdx]);

  return(<div>
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      {COMMODITIES.map((c,i)=><button key={c} onClick={()=>{setSelComm(c);setSelPath(null);}} style={{padding:'6px 14px',borderRadius:4,border:`1px solid ${selComm===c?COMM_COLORS[i]:T.border}`,background:selComm===c?COMM_COLORS[i]+'15':'transparent',color:selComm===c?COMM_COLORS[i]:T.textSec,fontFamily:T.mono,fontSize:11,fontWeight:selComm===c?700:500,cursor:'pointer'}}>{c}</button>)}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>{selComm} Risk Profile</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={radarBars} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="dim" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.textMut} interval={0} angle={-20} textAnchor="end" height={50}/>
            <YAxis domain={[0,100]} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="value" name="Score">{radarBars.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Source Country Breakdown</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={countryBreak} layout="vertical" margin={{left:70,right:16,top:4,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} width={65}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="volume" name="Volume (t)" fill={COMM_COLORS[commIdx]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Annual Deforestation Area (ha)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={yearData} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="area" name="Hectares" stroke={T.red} fill={T.red+'30'} strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Price Trend ($/t)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceData} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="month" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.textMut} interval={3}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="price" name="Price" stroke={COMM_COLORS[commIdx]} fill={COMM_COLORS[commIdx]+'25'} strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <Card style={{marginBottom:16}}>
      <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Satellite Deforestation Alerts (Simulated) - Monthly</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={alertData} margin={{left:4,right:16,top:8,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="month" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
          <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="alerts" name="Alerts" fill={T.red+'90'}/>
          <Bar dataKey="area" name="Area (ha)" fill={T.amber+'70'}/>
          <Legend wrapperStyle={{fontSize:11,fontFamily:T.mono}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    <Card>
      <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Supply Chain Path Tracer ({paths.length} paths)</div>
      <div style={{maxHeight:300,overflowY:'auto'}}>
        <table style={{width:'100%',fontSize:12,fontFamily:T.font,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`,background:T.surface,position:'sticky',top:0}}>
            {['Origin','Processor','Importer','End User','Volume','Risk','Traced','Cert'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{paths.map(p=><tr key={p.id} onClick={()=>setSelPath(selPath===p.id?null:p.id)} style={{borderBottom:`1px solid ${T.border}22`,cursor:'pointer',background:selPath===p.id?T.surfaceH:'transparent'}}>
            <td style={{padding:'6px 8px',fontWeight:600}}>{p.origin}</td>
            <td style={{padding:'6px 8px'}}>{p.processor}</td>
            <td style={{padding:'6px 8px'}}>{p.importer}</td>
            <td style={{padding:'6px 8px'}}>{p.endUser}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmt(p.volume)}t</td>
            <td style={{padding:'6px 8px'}}><Badge text={p.riskLevel} color={p.riskLevel==='High'?T.red:p.riskLevel==='Medium'?T.amber:T.green}/></td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:p.traceability>60?T.green:T.amber}}>{p.traceability}%</td>
            <td style={{padding:'6px 8px',fontSize:10}}>{p.certScheme}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {selPath!==null&&(()=>{const p=SUPPLY_PATHS.find(x=>x.id===selPath);if(!p)return null;return<div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:6,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        {[{l:'Origin',v:p.origin},{l:'Processor',v:p.processor},{l:'Importer',v:p.importer},{l:'End User',v:p.endUser}].map((s,i)=><React.Fragment key={i}><div style={{textAlign:'center'}}><div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{s.l}</div><div style={{fontSize:13,fontWeight:600,color:T.navy}}>{s.v}</div></div>{i<3&&<span style={{fontSize:18,color:T.gold}}>\u2192</span>}</React.Fragment>)}
        <div style={{marginLeft:'auto',fontSize:11,color:T.textSec}}>Geolocated: {p.geolocated?<Badge text="YES" color={T.green}/>:<Badge text="NO" color={T.red}/>}</div>
      </div>;})()}
    </Card>
  </div>);
};

/* ─── TAB 3: CERTIFICATION & TRACEABILITY ─── */
const CertTraceability=()=>{
  const [selScheme,setSelScheme]=useState(null);

  const coverageData=useMemo(()=>CERT_DATA.map(c=>({name:c.name,coverage:c.coverage,credibility:c.credibility})),[]);

  const portfolioCert=useMemo(()=>{
    const map={};CERT_SCHEMES.forEach(s=>{map[s]=COMPANIES.filter(c=>c.certifications.includes(s)).length;});
    return Object.entries(map).map(([k,v])=>({name:k,companies:v})).sort((a,b)=>b.companies-a.companies);
  },[]);

  const traceGaps=useMemo(()=>{
    const buckets=[{label:'0-25%',min:0,max:25},{label:'26-50%',min:26,max:50},{label:'51-75%',min:51,max:75},{label:'76-100%',min:76,max:100}];
    return buckets.map(b=>({range:b.label,count:COMPANIES.filter(c=>c.geoDataPct>=b.min&&c.geoDataPct<=b.max).length}));
  },[]);

  const blockchainPilots=useMemo(()=>[
    {name:'PalmTrace',commodity:'Palm Oil',status:'Active',participants:45,coverage:12},
    {name:'SoyLedger',commodity:'Soy',status:'Pilot',participants:18,coverage:5},
    {name:'CocoaChain',commodity:'Cocoa',status:'Active',participants:32,coverage:8},
    {name:'TimberTrust',commodity:'Wood',status:'Planning',participants:7,coverage:1},
    {name:'CoffeeOrigin',commodity:'Coffee',status:'Active',participants:56,coverage:15},
    {name:'BeefTrack',commodity:'Beef',status:'Pilot',participants:12,coverage:3},
    {name:'RubberID',commodity:'Rubber',status:'Planning',participants:5,coverage:0.5},
  ],[]);

  const scheme=selScheme!==null?CERT_DATA[selScheme]:null;

  return(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Certification Schemes: Coverage vs Credibility</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" dataKey="coverage" name="Coverage %" domain={[0,100]} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} label={{value:'Coverage %',position:'bottom',fontSize:10,fontFamily:T.mono}}/>
            <YAxis type="number" dataKey="credibility" name="Credibility" domain={[0,100]} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} label={{value:'Credibility',angle:-90,position:'left',fontSize:10,fontFamily:T.mono}}/>
            <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return<div style={{background:T.navy,color:'#fff',padding:'8px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono}}><div style={{fontWeight:700}}>{d.name}</div><div>Coverage: {d.coverage}%</div><div>Credibility: {d.credibility}</div></div>;}}/>
            <Scatter data={coverageData} fill={T.gold} onClick={(_,i)=>setSelScheme(i)}>{coverageData.map((_,i)=><Cell key={i} fill={selScheme===i?T.navy:T.gold} r={selScheme===i?8:5} cursor="pointer"/>)}</Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Portfolio Certification Coverage</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={portfolioCert} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.textMut} interval={0} angle={-30} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="companies" name="Companies" fill={T.sage}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {scheme&&<Card style={{marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div><span style={{fontSize:16,fontWeight:700,color:T.navy}}>{scheme.name}</span><span style={{marginLeft:12,fontSize:12,color:T.textSec}}>Commodity: {scheme.commodity} | Founded: {scheme.founded}</span></div>
        <button onClick={()=>setSelScheme(null)} style={{background:'none',border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 10px',fontFamily:T.mono,fontSize:11,cursor:'pointer',color:T.textSec}}>Close</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
        <KPI label="Coverage" value={scheme.coverage+'%'}/>
        <KPI label="Credibility" value={scheme.credibility+'/100'}/>
        <KPI label="Cost" value={'$'+scheme.cost+'K'} sub="per audit"/>
        <KPI label="Deforest-Free" value={scheme.deforestFree+'%'}/>
        <KPI label="Members" value={fmt(scheme.members)}/>
        <KPI label="Audit Freq." value={scheme.auditFreq}/>
      </div>
      <div style={{marginTop:12,display:'flex',gap:12}}>
        <Badge text={`Traceability: ${scheme.traceability}%`} color={scheme.traceability>60?T.green:T.amber}/>
        <Badge text={`Geo Coverage: ${scheme.geoPct}%`} color={scheme.geoPct>50?T.green:T.amber}/>
        <Badge text={scheme.blockchainReady?'Blockchain Ready':'No Blockchain'} color={scheme.blockchainReady?T.green:T.textMut}/>
      </div>
    </Card>}

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Traceability Gap Analysis</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>% of supply chain with geolocation data</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={traceGaps} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="range" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="count" name="Companies">{traceGaps.map((e,i)=><Cell key={i} fill={i===0?T.red:i===1?T.amber:i===2?T.gold:T.green}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Blockchain Traceability Pilots</div>
        <table style={{width:'100%',fontSize:12,fontFamily:T.font,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Project','Commodity','Status','Participants','Coverage %'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{blockchainPilots.map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}22`}}>
            <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{p.name}</td>
            <td style={{padding:'6px 8px'}}>{p.commodity}</td>
            <td style={{padding:'6px 8px'}}><Badge text={p.status} color={p.status==='Active'?T.green:p.status==='Pilot'?T.amber:T.textMut}/></td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.participants}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.coverage}%</td>
          </tr>)}</tbody>
        </table>
      </Card>
    </div>

    <Card>
      <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>All Certification Schemes Comparison</div>
      <div style={{maxHeight:320,overflowY:'auto'}}>
        <table style={{width:'100%',fontSize:12,fontFamily:T.font,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`,position:'sticky',top:0,background:T.surface}}>
            {['Scheme','Commodity','Coverage','Credibility','Cost','Deforest-Free','Audit','Blockchain'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{CERT_DATA.map((c,i)=><tr key={i} onClick={()=>setSelScheme(i)} style={{borderBottom:`1px solid ${T.border}22`,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{c.name}</td>
            <td style={{padding:'6px 8px'}}>{c.commodity}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.coverage}%</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.credibility}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>${c.cost}K</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.deforestFree}%</td>
            <td style={{padding:'6px 8px',fontSize:10}}>{c.auditFreq}</td>
            <td style={{padding:'6px 8px'}}>{c.blockchainReady?<Badge text="Yes" color={T.green}/>:<Badge text="No" color={T.textMut}/>}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>);
};

/* ─── TAB 4: FINANCIAL IMPACT & ENGAGEMENT ─── */
const FinancialImpact=()=>{
  const [remCostMult,setRemCostMult]=useState(1);
  const [timeHorizon,setTimeHorizon]=useState(3);
  const [complianceTarget,setComplianceTarget]=useState(80);

  const creditRisk=useMemo(()=>COMPANIES.slice(0,30).map((c,i)=>({name:c.name.length>18?c.name.slice(0,18)+'..':c.name,baseRisk:rng(5,40,i*31),deforestAdj:rng(2,25,i*37),total:rng(5,40,i*31)+rng(2,25,i*37)})).sort((a,b)=>b.total-a.total).slice(0,15),[]);

  const revenueAtRisk=useMemo(()=>COMMODITIES.map((c,i)=>({commodity:c,revenue:rng(50,800,i*31)*1e6,atRisk:rng(5,35,i*37),exposure:rng(10,60,i*41)})),[]);

  const engagementMatrix=useMemo(()=>COMPANIES.slice(0,40).map((c,i)=>({name:c.name,exposure:rng(10,95,i*31),risk:c.riskScore,readiness:rng(10,90,i*43),priority:0})).map(c=>{c.priority=Math.round((c.exposure*0.4+c.risk*0.35+(100-c.readiness)*0.25));return c;}).sort((a,b)=>b.priority-a.priority),[]);

  const greenPremium=useMemo(()=>COMMODITIES.map((c,i)=>({commodity:c,standard:rng(200,900,i*31),certified:rng(220,1050,i*37),premium:rng(3,22,i*41)})),[]);

  const remediationCost=useMemo(()=>{
    const baseCosts=[{item:'Supply Chain Mapping',cost:2.5},{item:'Geolocation Systems',cost:4.2},{item:'Due Diligence Platform',cost:1.8},{item:'Certification Audits',cost:3.1},{item:'Supplier Training',cost:1.5},{item:'Monitoring Tech',cost:5.0},{item:'Legal & Compliance',cost:2.0},{item:'Blockchain Integration',cost:3.5}];
    return baseCosts.map(b=>({...b,adjusted:+(b.cost*remCostMult*timeHorizon/3).toFixed(1),perYear:+(b.cost*remCostMult/3).toFixed(2)}));
  },[remCostMult,timeHorizon]);

  const totalRemCost=remediationCost.reduce((s,r)=>s+r.adjusted,0);

  const exportCSV=useCallback(()=>{
    const headers=['Company','Country','Overall Status','Commodities','Traceability %','Risk Score','Geo Data %','Due Diligence Score','Size','Certifications'];
    const rows=COMPANIES.map(c=>[c.name,c.country,c.overallStatus,c.commodities.join(';'),c.traceability,c.riskScore,c.geoDataPct,c.dueDiligenceScore,c.size,c.certifications.join(';')]);
    const csv=[headers.join(','),...rows.map(r=>r.join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='eudr_compliance_report.csv';a.click();
    URL.revokeObjectURL(url);
  },[]);

  return(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Deforestation-Adjusted Credit Risk (Top 15)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={creditRisk} layout="vertical" margin={{left:90,right:16,top:4,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} width={85}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:T.mono}}/>
            <Bar dataKey="baseRisk" name="Base Risk" stackId="a" fill={T.amber}/>
            <Bar dataKey="deforestAdj" name="Deforest Adj." stackId="a" fill={T.red}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Revenue at Risk from EUDR Non-Compliance</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueAtRisk} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="commodity" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} tickFormatter={v=>fmt(v)}/>
            <Tooltip content={({active,payload,label})=>{if(!active||!payload?.length)return null;return<div style={{background:T.navy,color:'#fff',padding:'8px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono}}><div style={{fontWeight:700}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.goldL}}>{p.name}: {typeof p.value==='number'&&p.value>1e5?fmt(p.value):p.value}{p.name==='At Risk %'?'%':''}</div>)}</div>;}}/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:T.mono}}/>
            <Bar dataKey="revenue" name="Revenue" fill={T.sage}/>
            <Bar dataKey="atRisk" name="At Risk %" fill={T.red}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <Card style={{marginBottom:16}}>
      <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Engagement Priority Matrix (Exposure x Risk x Readiness)</div>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{left:4,right:16,top:8,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number" dataKey="exposure" name="Exposure" domain={[0,100]} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} label={{value:'Exposure %',position:'bottom',fontSize:10,fontFamily:T.mono}}/>
          <YAxis type="number" dataKey="risk" name="Risk" domain={[0,100]} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} label={{value:'Risk Score',angle:-90,position:'left',fontSize:10,fontFamily:T.mono}}/>
          <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return<div style={{background:T.navy,color:'#fff',padding:'8px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono}}><div style={{fontWeight:700}}>{d.name}</div><div>Exposure: {d.exposure}%</div><div>Risk: {d.risk}</div><div>Readiness: {d.readiness}%</div><div>Priority: {d.priority}</div></div>;}}/>
          <Scatter data={engagementMatrix} fill={T.gold}>{engagementMatrix.map((e,i)=><Cell key={i} fill={e.priority>65?T.red:e.priority>40?T.amber:T.green} r={Math.max(4,e.priority/12)}/>)}</Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{marginTop:8}}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textSec,marginBottom:6}}>Top 5 Engagement Priorities:</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{engagementMatrix.slice(0,5).map((e,i)=><div key={i} style={{padding:'4px 10px',borderRadius:4,background:T.red+'12',border:`1px solid ${T.red}30`,fontSize:11,fontFamily:T.mono}}><span style={{fontWeight:700,color:T.red}}>{i+1}.</span> {e.name} <span style={{color:T.textMut}}>({e.priority})</span></div>)}</div>
      </div>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:12,textTransform:'uppercase'}}>Remediation Cost Estimator</div>
        <div style={{display:'flex',gap:16,marginBottom:12,flexWrap:'wrap'}}>
          <label style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Scale Multiplier: <strong style={{color:T.navy}}>{remCostMult.toFixed(1)}x</strong>
            <br/><input type="range" min="0.5" max="3" step="0.1" value={remCostMult} onChange={e=>setRemCostMult(+e.target.value)} style={{width:140,marginTop:4}}/>
          </label>
          <label style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Time Horizon: <strong style={{color:T.navy}}>{timeHorizon}yr</strong>
            <br/><input type="range" min="1" max="5" step="1" value={timeHorizon} onChange={e=>setTimeHorizon(+e.target.value)} style={{width:140,marginTop:4}}/>
          </label>
          <label style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Compliance Target: <strong style={{color:T.navy}}>{complianceTarget}%</strong>
            <br/><input type="range" min="50" max="100" step="5" value={complianceTarget} onChange={e=>setComplianceTarget(+e.target.value)} style={{width:140,marginTop:4}}/>
          </label>
        </div>
        <table style={{width:'100%',fontSize:12,fontFamily:T.font,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Cost Item','Base ($M)','Adjusted ($M)','Per Year'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{remediationCost.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}22`}}>
            <td style={{padding:'6px 8px'}}>{r.item}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>${r.cost}M</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600}}>${r.adjusted}M</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>${r.perYear}M</td>
          </tr>)}</tbody>
          <tfoot><tr style={{borderTop:`2px solid ${T.navy}`}}>
            <td style={{padding:'6px 8px',fontWeight:700}}>TOTAL</td><td></td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:700,color:T.navy}}>${totalRemCost.toFixed(1)}M</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600}}>${(totalRemCost/timeHorizon).toFixed(1)}M</td>
          </tr></tfoot>
        </table>
      </Card>
      <Card>
        <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8,textTransform:'uppercase'}}>Green Commodity Premium Analysis</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={greenPremium} margin={{left:4,right:16,top:8,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="commodity" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:T.mono}}/>
            <Bar dataKey="standard" name="Standard ($/t)" fill={T.textMut}/>
            <Bar dataKey="certified" name="Certified ($/t)" fill={T.sage}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{marginTop:8}}>
          <table style={{width:'100%',fontSize:11,fontFamily:T.font,borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              {['Commodity','Premium'].map(h=><th key={h} style={{padding:'4px 8px',textAlign:'left',color:T.textSec,fontFamily:T.mono,fontSize:10}}>{h}</th>)}
            </tr></thead>
            <tbody>{greenPremium.map((g,i)=><tr key={i}><td style={{padding:'4px 8px'}}>{g.commodity}</td><td style={{padding:'4px 8px',fontFamily:T.mono,fontWeight:600,color:T.sage}}>+{g.premium}%</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>

    <div style={{display:'flex',justifyContent:'flex-end'}}>
      <button onClick={exportCSV} style={{padding:'10px 24px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontFamily:T.mono,fontSize:12,fontWeight:600,cursor:'pointer',letterSpacing:0.5}}>EXPORT EUDR COMPLIANCE REPORT (CSV)</button>
    </div>
  </div>);
};

/* ─── MAIN PAGE ─── */
export default function CommodityDeforestationPage(){
  const [tab,setTab]=useState(0);
  const TABS=['EUDR Compliance Dashboard','Commodity Risk Analysis','Certification & Traceability','Financial Impact & Engagement'];
  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,letterSpacing:1}}>EP-AP3</span>
          <span style={{width:1,height:14,background:T.border,display:'inline-block'}}/>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:0.5}}>COMMODITY DEFORESTATION & EUDR</span>
        </div>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0,letterSpacing:-0.3}}>Commodity-Driven Deforestation & EUDR Compliance</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0',maxWidth:700}}>EU Deforestation Regulation compliance, supply chain traceability, commodity risk assessment across 7 EUDR commodities, 100 companies, 30 source countries.</p>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab}/>
      {tab===0&&<EudrDashboard/>}
      {tab===1&&<CommodityRisk/>}
      {tab===2&&<CertTraceability/>}
      {tab===3&&<FinancialImpact/>}
      <div style={{marginTop:24,paddingTop:12,borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>COMMODITY DEFORESTATION & EUDR COMPLIANCE v1.0 | 100 companies | 30 countries | 7 commodities | 15 cert schemes</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>Last updated: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}
