import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie,
  ScatterChart, Scatter
} from 'recharts';
import { CORSIA_BASELINES } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── STATIC DATA ──────────────────────────────────────────── */
const REGIONS=['Europe','N.America','Asia-Pacific','Middle East','LATAM','Africa'];
const REGION_COLORS={'Europe':T.navy,'N.America':T.navyL,'Asia-Pacific':T.sage,'Middle East':T.gold,'LATAM':'#8b5cf6','Africa':'#e17055'};
const AIRCRAFT_TYPES=['Narrow-body','Wide-body','Regional Jet','Turboprop','Freighter','Bizjet','Next-gen','Electric'];
const CORSIA_PHASES=['Pilot (2024-26)','Phase 1 (2027-35)','Mandatory'];
const COMPLIANCE_STATUSES=['Compliant','Partial','Non-compliant','Exempt'];
const IATA_CODES=['LH','BA','AF','KL','AZ','SK','IB','TP','OS','LX','SN','EI','DL','AA','UA','WN','B6','AS','NK','F9','AC','WS','AM','4O','JL','NH','SQ','CX','QF','MH','TG','GA','CI','BR','VN','KE','OZ','EK','QR','EY','SV','WY','RJ','GF','LA','AV','CM','G3','AR','JJ','ET','KQ','SA','RW','MS','AT','W3','TK','LO','OK','BT','RO','BU','JU','WZ','OU','U2','FR','W6','VY','PC','QS','DY','HV','BE','ZB','SW','HU','CZ','MU','CA','FM','ZH','3U','SC','GS','KA','UO','9C','AK','QZ','TR','VJ','DD','SL','FD','BI','PW','KC','HY','FZ','XY','IG','5J','PR','PK','UL','AI','UK','6E','SG','H9','NZ','VA','FJ','PX','ZL','BX','TW','7C','LJ','RS','8M'];
const AIRLINE_NAMES=['Lufthansa','British Airways','Air France','KLM','Alitalia','SAS','Iberia','TAP','Austrian','Swiss','Brussels Airlines','Aer Lingus','Delta','American Airlines','United Airlines','Southwest','JetBlue','Alaska Air','Spirit','Frontier','Air Canada','WestJet','Aeromexico','Interjet','JAL','ANA','Singapore Airlines','Cathay Pacific','Qantas','Malaysia Airlines','Thai Airways','Garuda','China Airlines','EVA Air','Vietnam Airlines','Korean Air','Asiana','Emirates','Qatar Airways','Etihad','Saudia','Oman Air','Royal Jordanian','Gulf Air','LATAM','Avianca','Copa Airlines','Gol','Aerolineas Arg','Azul','Ethiopian Airlines','Kenya Airways','South African','RwandAir','EgyptAir','Royal Air Maroc','Asky Airlines','Turkish Airlines','LOT Polish','Czech Airlines','airBaltic','TAROM','Bulgaria Air','Air Serbia','Wizz Air','Croatia Airlines','easyJet','Ryanair','Wizz Air HU','Vueling','Pegasus','SmartWings','Norwegian','Transavia','Flybe','Nordwind','Suparna','Spring Airlines','Hainan Airlines','China Southern','China Eastern','Air China','Shanghai Airlines','Shenzhen Airlines','Sichuan Airlines','Shandong Airlines','GX Airlines','HK Express','Hong Kong Airlines','9 Air','AirAsia','AirAsia X','Scoot','VietJet','Nok Air','Srilankan','Thai Lion Air','Royal Brunei','Palau Pacific','Air Astana','Uzbekistan','FlyDubai','Flynas','Indigo Partners','Cebu Pacific','Philippine Air','PIA','SriLankan','Air India','Vistara','IndiGo','SpiceJet','Himalaya','Air NZ','Virgin Australia','Fiji Airways','Air Niugini','Air Nelson','Air Busan','T\'way Air','Jeju Air','Air Seoul','Air RS','Myanmar Air'];

// ── CORSIA baseline — ICAO Doc 9501 Vol.IV ────────────────────────────────────
// Baseline = average(2019 emissions, 2020 emissions) per CORSIA 2024 update
// Offsetting = max(0, sector_CO2_year - baseline) × offset_ratio
// offset_ratio = 1.0 (Pilot phase), scaling in Phase 1/2
const calcCORSIA_offset = (annualCO2, baseline2019_factor, baseline2020_factor, offset_ratio=1.0) => {
  const b2019 = annualCO2 * baseline2019_factor;
  const b2020 = annualCO2 * baseline2020_factor; // 2020 was ~60% of 2019 due to COVID
  const baseline = (b2019 + b2020) / 2;
  return { baseline: +baseline.toFixed(3), offsetting: +Math.max(0, (annualCO2 - baseline) * offset_ratio).toFixed(3) };
};

const genAirlines=()=>{
  const out=[];
  for(let i=0;i<120;i++){
    const s=sr(i*7+3);
    const regionIdx=Math.floor(sr(i*13+1)*6);
    const region=REGIONS[regionIdx];
    const fleetSize=Math.floor(40+sr(i*11+2)*460);
    const annualCO2=parseFloat((fleetSize*0.018+sr(i*19+5)*8).toFixed(2));
    const phaseIdx=s<0.3?0:s<0.75?1:2;
    const compIdx=sr(i*23+7)<0.55?0:sr(i*23+7)<0.8?1:sr(i*23+7)<0.95?2:3;
    // CORSIA offset: computed from 2019/2020 baseline (COVID depression factor 0.4-0.65 for 2020)
    const b2020_factor = 0.4 + sr(i*89+4)*0.25;
    const { baseline: corsiaBaseline, offsetting: corsiaOffset } =
      calcCORSIA_offset(annualCO2, 1.0, b2020_factor, phaseIdx===0?1.0:0.85);
    const offsetReq = corsiaOffset; // replaces random offsetReq
    const safPct=parseFloat((sr(i*37+9)*12).toFixed(1));
    const fleetAge=parseFloat((5+sr(i*41+6)*20).toFixed(1));
    const emissionsIntensity=parseFloat((55+sr(i*43+8)*65).toFixed(1));
    const quarters=[];
    for(let q=0;q<12;q++){
      quarters.push({q:`Q${(q%4)+1} ${2022+Math.floor(q/4)}`,co2:parseFloat((annualCO2/4*(0.85+sr(i*53+q*7)*0.3)).toFixed(3))});
    }
    const fleet={};
    let remaining=fleetSize;
    AIRCRAFT_TYPES.forEach((t,ti)=>{
      if(ti===AIRCRAFT_TYPES.length-1){fleet[t]=remaining;}
      else{const c=Math.floor(remaining*sr(i*59+ti*11)*0.45);fleet[t]=c;remaining-=c;}
    });
    const riskScore=parseFloat((20+sr(i*67+3)*75).toFixed(0));
    const offsets=[];
    for(let q=0;q<12;q++){offsets.push({q:quarters[q].q,purchased:parseFloat((offsetReq/12*(0.6+sr(i*71+q*3)*0.8)).toFixed(3))});}
    out.push({id:i+1,name:AIRLINE_NAMES[i]||`Airline ${i+1}`,iata:IATA_CODES[i]||`X${i}`,region,fleetSize,annualCO2,corsiaBaseline,phase:CORSIA_PHASES[phaseIdx],offsetReq,compliance:COMPLIANCE_STATUSES[compIdx],safPct,fleetAge,emissionsIntensity,quarters,fleet,riskScore,offsets});
  }
  return out;
};

const SAF_MANDATE_TRAJECTORY=[
  {year:2025,mandate:2,actual:1.2},{year:2028,mandate:6,actual:null},{year:2030,mandate:6,actual:null},
  {year:2032,mandate:10,actual:null},{year:2035,mandate:20,actual:null},{year:2040,mandate:34,actual:null},
  {year:2045,mandate:42,actual:null},{year:2050,mandate:70,actual:null}
];

const genSafSuppliers=()=>{
  const techs=['HEFA','Fischer-Tropsch','Alcohol-to-Jet','e-Kerosene','Power-to-Liquid'];
  const names=['Neste','World Energy','SkyNRG','Gevo','LanzaJet','TotalEnergies','bp SAF','Shell SAF','Velocys','Fulcrum','RedRock Bio','SunFire','Norsk e-Fuel','Infinium','HIF Global'];
  return names.map((n,i)=>({
    id:i+1,name:n,tech:techs[Math.floor(sr(i*13+1)*5)],
    capacity:parseFloat((50+sr(i*17+3)*950).toFixed(0)),
    price:parseFloat((1800+sr(i*19+7)*3200).toFixed(0)),
    lcReduction:parseFloat((50+sr(i*23+2)*45).toFixed(0)),
    reliability:parseFloat((60+sr(i*29+5)*38).toFixed(0)),
    region:REGIONS[Math.floor(sr(i*31+9)*6)]
  }));
};

const genBonds=()=>{
  const types=['Green Bond','SLL','Conv. Bond','Term Loan','Revolver','Sukuk'];
  return Array.from({length:30},(_, i)=>{
    const airline=AIRLINE_NAMES[Math.floor(sr(i*41+1)*60)];
    const spread=parseFloat((80+sr(i*43+3)*420).toFixed(0));
    const climAdj=parseFloat((spread*(1+sr(i*47+5)*0.35)).toFixed(0));
    return {
      id:i+1,airline,type:types[Math.floor(sr(i*51+7)*6)],
      amount:parseFloat((100+sr(i*53+2)*900).toFixed(0)),
      maturity:`${2026+Math.floor(sr(i*57+4)*8)}`,coupon:parseFloat((2.5+sr(i*59+6)*5.5).toFixed(2)),
      spread,climateSpread:climAdj,rating:['AAA','AA','A','BBB','BB','B'][Math.floor(sr(i*61+8)*6)],
      strandedRisk:sr(i*63+1)<0.3?'High':sr(i*63+1)<0.65?'Medium':'Low',
      tcfdScore:parseFloat((40+sr(i*67+3)*55).toFixed(0)),
      carbonPassThrough:parseFloat((15+sr(i*69+5)*60).toFixed(0))
    };
  });
};

const TOP_AIRPORTS=Array.from({length:30},(_,i)=>{
  const cities=['Amsterdam','London','Paris','Frankfurt','Singapore','Los Angeles','San Francisco','Houston','Dubai','Doha','Tokyo','Seoul','Hong Kong','Sydney','Stockholm','Helsinki','Oslo','Zurich','Barcelona','Madrid','New York','Chicago','Dallas','Denver','Seattle','Toronto','Sao Paulo','Mexico City','Johannesburg','Cairo'];
  return {city:cities[i],capacity:parseFloat((500+sr(i*71+1)*4500).toFixed(0)),demand:parseFloat((800+sr(i*73+3)*5200).toFixed(0)),gap:null};
}).map(a=>({...a,gap:parseFloat((a.demand-a.capacity).toFixed(0))}));

/* ─── STYLE HELPERS ────────────────────────────────────────── */
const card={background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
const kpiBox={background:T.surface,borderRadius:8,border:`1px solid ${T.border}`,padding:'14px 18px',textAlign:'center',minWidth:150,flex:1};
const btn=(active)=>({padding:'7px 16px',borderRadius:6,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.text,cursor:'pointer',fontSize:13,fontFamily:T.font,fontWeight:active?600:400,transition:'all .15s'});
const select={padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'};
const thStyle={padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:600,color:T.textSec,borderBottom:`2px solid ${T.border}`,position:'sticky',top:0,background:T.surface,fontFamily:T.font};
const tdStyle={padding:'9px 12px',fontSize:13,borderBottom:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};
const badge=(color)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font});

const compColor=(c)=>c==='Compliant'?T.green:c==='Partial'?T.amber:c==='Non-compliant'?T.red:T.textMut;
const riskColor=(r)=>r==='Low'?T.green:r==='Medium'?T.amber:T.red;

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'8px 12px',fontSize:12,fontFamily:T.font}}>
    <div style={{fontWeight:600,marginBottom:4,color:T.navy}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}</div>)}
  </div>);
};

/* ─── TABS ─────────────────────────────────────────────────── */
const TABS=['CORSIA Compliance','Fleet Emissions Analyzer','SAF & Alternative Fuels','Investment & Credit Risk'];

/* ════════════════════════════════════════════════════════════ */
export default function AviationCorsiaPage(){
  const [tab,setTab]=useState(0);
  const airlines=useMemo(genAirlines,[]);
  const safSuppliers=useMemo(genSafSuppliers,[]);
  const bonds=useMemo(genBonds,[]);

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'20px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <span style={{fontSize:22}}>✈</span>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.navy}}>Aviation CORSIA & Airline Decarbonisation</h1>
          <span style={{...badge(T.navyL),marginLeft:8}}>EP-AN2</span>
        </div>
        <p style={{margin:'4px 0 0 34px',fontSize:13,color:T.textSec}}>ICAO CORSIA compliance, airline fleet emissions, SAF mandates, EU ETS aviation</p>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:4,padding:'12px 32px 0',background:T.surface,borderBottom:`1px solid ${T.border}`,overflowX:'auto'}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:`3px solid ${tab===i?T.navy:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textSec,fontWeight:tab===i?600:400,fontSize:13,cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',transition:'all .15s'}}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:'20px 32px 40px'}}>
        {tab===0&&<CorsiaComplianceTab airlines={airlines}/>}
        {tab===1&&<FleetEmissionsTab airlines={airlines}/>}
        {tab===2&&<SafFuelsTab suppliers={safSuppliers} airlines={airlines}/>}
        {tab===3&&<InvestmentRiskTab bonds={bonds} airlines={airlines}/>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 1: CORSIA COMPLIANCE
   ════════════════════════════════════════════════════════════ */
function CorsiaComplianceTab({airlines}){
  const [regionF,setRegionF]=useState('All');
  const [phaseF,setPhaseF]=useState('All');
  const [statusF,setStatusF]=useState('All');
  const [fleetF,setFleetF]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('annualCO2');
  const [sortDir,setSortDir]=useState('desc');
  const [selected,setSelected]=useState(null);
  const [page,setPage]=useState(0);
  const PER=20;

  const filtered=useMemo(()=>{
    let d=[...airlines];
    if(regionF!=='All')d=d.filter(a=>a.region===regionF);
    if(phaseF!=='All')d=d.filter(a=>a.phase===phaseF);
    if(statusF!=='All')d=d.filter(a=>a.compliance===statusF);
    if(fleetF==='Small (<100)')d=d.filter(a=>a.fleetSize<100);
    else if(fleetF==='Medium (100-250)')d=d.filter(a=>a.fleetSize>=100&&a.fleetSize<=250);
    else if(fleetF==='Large (>250)')d=d.filter(a=>a.fleetSize>250);
    if(search)d=d.filter(a=>a.name.toLowerCase().includes(search.toLowerCase())||a.iata.toLowerCase().includes(search.toLowerCase()));
    d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return d;
  },[airlines,regionF,phaseF,statusF,fleetF,search,sortCol,sortDir]);

  const paged=filtered.slice(page*PER,(page+1)*PER);
  const totalPages=Math.ceil(filtered.length/PER);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  // KPIs
  const totalCO2=airlines.reduce((s,a)=>s+a.annualCO2,0);
  const corsiaCount=airlines.filter(a=>a.compliance==='Compliant'||a.compliance==='Partial').length;
  const totalOffset=airlines.reduce((s,a)=>s+a.offsetReq,0);
  const avgSaf=(airlines.reduce((s,a)=>s+a.safPct,0)/airlines.length);

  // Phase distribution
  const phaseDist=CORSIA_PHASES.map(p=>({name:p,value:airlines.filter(a=>a.phase===p).length}));
  const PHASE_COLORS=[T.gold,T.navyL,T.sage];

  return(<>
    {/* KPI strip */}
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
      {[
        {label:'Total Aviation CO2',value:`${totalCO2.toFixed(1)} MtCO2`,sub:'120 airlines monitored'},
        {label:'CORSIA Coverage',value:`${((corsiaCount/120)*100).toFixed(0)}%`,sub:`${corsiaCount} airlines in scope`},
        {label:'Offset Demand',value:`${totalOffset.toFixed(1)} MtCO2`,sub:'Annual requirement'},
        {label:'SAF Penetration',value:`${avgSaf.toFixed(1)}%`,sub:'Average blend rate'}
      ].map((k,i)=>(
        <div key={i} style={kpiBox}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:500,marginBottom:4}}>{k.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:T.navy}}>{k.value}</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{k.sub}</div>
        </div>
      ))}
    </div>

    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      {/* Phase pie */}
      <div style={{...card,flex:'0 0 260px'}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Phase Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={phaseDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} fontSize={11}>
            {phaseDist.map((_,i)=><Cell key={i} fill={PHASE_COLORS[i]}/>)}
          </Pie><Tooltip content={<CustomTooltip/>}/></PieChart>
        </ResponsiveContainer>
      </div>

      {/* Region breakdown bar */}
      <div style={{...card,flex:1,minWidth:300}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Emissions by Region (MtCO2)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={REGIONS.map(r=>({region:r,co2:parseFloat(airlines.filter(a=>a.region===r).reduce((s,a)=>s+a.annualCO2,0).toFixed(1))}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="region" tick={{fontSize:11,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="co2" name="CO2" radius={[4,4,0,0]}>
              {REGIONS.map((r,i)=><Cell key={i} fill={REGION_COLORS[r]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Filters */}
    <div style={{...card,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',padding:14}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search airline or IATA..." style={{...select,minWidth:180}}/>
      <select value={regionF} onChange={e=>{setRegionF(e.target.value);setPage(0);}} style={select}>
        <option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
      </select>
      <select value={phaseF} onChange={e=>{setPhaseF(e.target.value);setPage(0);}} style={select}>
        <option value="All">All Phases</option>{CORSIA_PHASES.map(p=><option key={p} value={p}>{p}</option>)}
      </select>
      <select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(0);}} style={select}>
        <option value="All">All Status</option>{COMPLIANCE_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select value={fleetF} onChange={e=>{setFleetF(e.target.value);setPage(0);}} style={select}>
        <option value="All">All Fleet Sizes</option><option value="Small (<100)">Small (&lt;100)</option><option value="Medium (100-250)">Medium (100-250)</option><option value="Large (>250)">Large (&gt;250)</option>
      </select>
      <span style={{fontSize:12,color:T.textMut,marginLeft:'auto'}}>{filtered.length} airlines</span>
    </div>

    {/* Table */}
    <div style={{...card,padding:0,overflow:'hidden'}}>
      <div style={{overflowX:'auto',maxHeight:520}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
          <thead>
            <tr>
              {[['name','Airline'],['iata','IATA'],['region','Region'],['fleetSize','Fleet'],['annualCO2','CO2 (Mt)'],['phase','Phase'],['offsetReq','Offset Req'],['compliance','Status'],['safPct','SAF %'],['riskScore','Risk']].map(([k,l])=>(
                <th key={k} style={{...thStyle,cursor:'pointer'}} onClick={()=>toggleSort(k)}>{l}{sortCol===k?(sortDir==='asc'?' ▲':' ▼'):''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(a=>(
              <tr key={a.id} onClick={()=>setSelected(a)} style={{cursor:'pointer',background:selected?.id===a.id?T.surfaceH:'transparent',transition:'background .1s'}}>
                <td style={{...tdStyle,fontWeight:600}}>{a.name}</td>
                <td style={{...tdStyle,fontFamily:T.mono,fontSize:12}}>{a.iata}</td>
                <td style={tdStyle}><span style={badge(REGION_COLORS[a.region]||T.navy)}>{a.region}</span></td>
                <td style={{...tdStyle,textAlign:'right'}}>{a.fleetSize}</td>
                <td style={{...tdStyle,textAlign:'right',fontWeight:600}}>{a.annualCO2}</td>
                <td style={tdStyle}><span style={{fontSize:12,color:T.textSec}}>{a.phase}</span></td>
                <td style={{...tdStyle,textAlign:'right'}}>{a.offsetReq}</td>
                <td style={tdStyle}><span style={badge(compColor(a.compliance))}>{a.compliance}</span></td>
                <td style={{...tdStyle,textAlign:'right'}}>{a.safPct}%</td>
                <td style={tdStyle}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:40,height:6,borderRadius:3,background:T.border}}>
                      <div style={{width:`${a.riskScore}%`,height:'100%',borderRadius:3,background:a.riskScore>65?T.red:a.riskScore>35?T.amber:T.green}}/>
                    </div>
                    <span style={{fontSize:11,color:T.textMut}}>{a.riskScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderTop:`1px solid ${T.border}`}}>
        <span style={{fontSize:12,color:T.textMut}}>Page {page+1} of {totalPages}</span>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...btn(false),opacity:page===0?0.4:1}}>Prev</button>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{...btn(false),opacity:page>=totalPages-1?0.4:1}}>Next</button>
        </div>
      </div>
    </div>

    {/* Compliance trend over quarters */}
    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      <div style={{...card,flex:1,minWidth:400}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Compliance Status Trend (Quarterly)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={Array.from({length:8},(_,i)=>{
            const q=`Q${(i%4)+1} ${2023+Math.floor(i/4)}`;
            const base=airlines.length;
            return{q,compliant:Math.floor(base*(0.35+i*0.04+sr(i*201)*0.03)),partial:Math.floor(base*(0.25+sr(i*203)*0.04)),nonCompliant:Math.floor(base*(0.2-i*0.02+sr(i*207)*0.02)),exempt:Math.floor(base*(0.08+sr(i*209)*0.02))};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="compliant" stroke={T.green} fill={T.green+'25'} name="Compliant" stackId="1"/>
            <Area type="monotone" dataKey="partial" stroke={T.amber} fill={T.amber+'25'} name="Partial" stackId="1"/>
            <Area type="monotone" dataKey="nonCompliant" stroke={T.red} fill={T.red+'25'} name="Non-compliant" stackId="1"/>
            <Area type="monotone" dataKey="exempt" stroke={T.textMut} fill={T.textMut+'15'} name="Exempt" stackId="1"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{...card,flex:1,minWidth:300}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Offset Demand vs Supply (MtCO2)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={Array.from({length:6},(_,i)=>{
            const year=2024+i;
            return{year,demand:parseFloat((totalOffset*(1+i*0.08)+sr(i*211)*5).toFixed(1)),supply:parseFloat((totalOffset*(0.6+i*0.12)+sr(i*213)*4).toFixed(1))};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="demand" name="Demand" fill={T.red+'80'} radius={[4,4,0,0]}/>
            <Bar dataKey="supply" name="Supply" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Regional compliance heatmap */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Regional Compliance Heatmap</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
        {REGIONS.map((r,ri)=>{
          const rAirlines=filtered.filter(a=>a.region===r);
          const comp=rAirlines.filter(a=>a.compliance==='Compliant').length;
          const partial=rAirlines.filter(a=>a.compliance==='Partial').length;
          const total=rAirlines.length||1;
          const score=((comp+partial*0.5)/total*100);
          return(
            <div key={r} style={{background:score>70?T.green+'12':score>40?T.amber+'12':T.red+'12',borderRadius:8,padding:'14px 16px',border:`1px solid ${score>70?T.green+'30':score>40?T.amber+'30':T.red+'30'}`}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:6}}>{r}</div>
              <div style={{fontSize:24,fontWeight:700,color:score>70?T.green:score>40?T.amber:T.red}}>{score.toFixed(0)}%</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{rAirlines.length} airlines</div>
              <div style={{display:'flex',gap:4,marginTop:8}}>
                <div style={{flex:comp,height:4,borderRadius:2,background:T.green}}/>
                <div style={{flex:partial,height:4,borderRadius:2,background:T.amber}}/>
                <div style={{flex:total-comp-partial,height:4,borderRadius:2,background:T.red}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.textMut,marginTop:3}}>
                <span>{comp} comp</span><span>{partial} partial</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Top emitters quick-view */}
    <div style={card}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Top 10 Emitters — Quick View</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={[...airlines].sort((a,b)=>b.annualCO2-a.annualCO2).slice(0,10).map(a=>({name:`${a.name} (${a.iata})`,co2:a.annualCO2,offset:a.offsetReq}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-20} textAnchor="end" height={60}/>
          <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'MtCO2',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          <Bar dataKey="co2" name="Annual CO2" fill={T.navy} radius={[4,4,0,0]}/>
          <Bar dataKey="offset" name="Offset Req" fill={T.gold} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Side Drawer */}
    {selected&&<AirlineDrawer airline={selected} onClose={()=>setSelected(null)}/>}
  </>);
}

/* ── AIRLINE DRAWER ────────────────────────────────────────── */
function AirlineDrawer({airline,onClose}){
  const a=airline;
  const fleetEntries=Object.entries(a.fleet).filter(([,v])=>v>0);
  const FLEET_COLORS=[T.navy,T.navyL,T.sage,T.gold,T.sageL,'#8b5cf6','#e17055',T.textMut];

  return(
    <div style={{position:'fixed',top:0,right:0,width:520,height:'100vh',background:T.surface,borderLeft:`1px solid ${T.border}`,boxShadow:'-8px 0 32px rgba(0,0,0,0.08)',zIndex:999,overflowY:'auto',padding:'24px 28px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.navy}}>{a.name}</h2>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <span style={badge(REGION_COLORS[a.region])}>{a.region}</span>
            <span style={badge(compColor(a.compliance))}>{a.compliance}</span>
            <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>{a.iata}</span>
          </div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut,padding:4}}>✕</button>
      </div>

      {/* Mini KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
        {[{l:'Fleet Size',v:a.fleetSize},{l:'Annual CO2',v:`${a.annualCO2} Mt`},{l:'SAF Usage',v:`${a.safPct}%`},{l:'Risk Score',v:a.riskScore},{l:'Offset Req',v:`${a.offsetReq} Mt`},{l:'Fleet Age',v:`${a.fleetAge} yrs`}].map((k,i)=>(
          <div key={i} style={{background:T.bg,borderRadius:6,padding:'8px 12px'}}>
            <div style={{fontSize:10,color:T.textMut,fontWeight:500}}>{k.l}</div>
            <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* 12Q Emissions Trend */}
      <div style={{marginBottom:20}}>
        <h4 style={{fontSize:13,fontWeight:600,margin:'0 0 8px'}}>12-Quarter Emissions Trend</h4>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={a.quarters}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}} interval={2}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="co2" stroke={T.navy} fill={T.navy+'30'} name="CO2 (Mt)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Offset Purchase History */}
      <div style={{marginBottom:20}}>
        <h4 style={{fontSize:13,fontWeight:600,margin:'0 0 8px'}}>Offset Purchase History</h4>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={a.offsets}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}} interval={2}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="purchased" name="Offsets (Mt)" fill={T.sage} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fleet Composition Donut */}
      <div style={{marginBottom:20}}>
        <h4 style={{fontSize:13,fontWeight:600,margin:'0 0 8px'}}>Fleet Composition</h4>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={fleetEntries.map(([k,v])=>({name:k,value:v}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({name,percent})=>percent>0.05?`${name} ${(percent*100).toFixed(0)}%`:''} fontSize={10}>
              {fleetEntries.map((_,i)=><Cell key={i} fill={FLEET_COLORS[i%FLEET_COLORS.length]}/>)}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Compliance Risk Score Bar */}
      <div style={{marginBottom:20}}>
        <h4 style={{fontSize:13,fontWeight:600,margin:'0 0 8px'}}>Compliance Risk Score</h4>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1,height:12,borderRadius:6,background:T.border}}>
            <div style={{width:`${a.riskScore}%`,height:'100%',borderRadius:6,background:a.riskScore>65?T.red:a.riskScore>35?T.amber:T.green,transition:'width .3s'}}/>
          </div>
          <span style={{fontWeight:700,fontSize:18,color:a.riskScore>65?T.red:a.riskScore>35?T.amber:T.green}}>{a.riskScore}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut,marginTop:4}}>
          <span>Low Risk</span><span>High Risk</span>
        </div>
      </div>

      <button style={{width:'100%',padding:'12px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Engage Airline</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 2: FLEET EMISSIONS ANALYZER
   ════════════════════════════════════════════════════════════ */
function FleetEmissionsTab({airlines}){
  const [selAirline,setSelAirline]=useState(null);
  const [simAirline,setSimAirline]=useState(airlines[0].name);
  const [replacePct,setReplacePct]=useState(30);
  const [replaceType,setReplaceType]=useState('Next-gen');

  // Benchmark by aircraft type
  const benchData=AIRCRAFT_TYPES.map((t,i)=>{
    const base=t==='Electric'?8:t==='Next-gen'?42:t==='Turboprop'?65:t==='Narrow-body'?72:t==='Regional Jet'?85:t==='Wide-body'?90:t==='Freighter'?120:95;
    return {type:t,intensity:parseFloat((base+(sr(i*31)*15)).toFixed(1)),count:airlines.reduce((s,a)=>s+(a.fleet[t]||0),0)};
  });

  // Scatter: fleet age vs intensity
  const scatterData=airlines.map(a=>({name:a.name,iata:a.iata,x:a.fleetAge,y:a.emissionsIntensity,co2:a.annualCO2,region:a.region}));

  // Next-gen adoption curve
  const adoptionData=Array.from({length:11},(_,i)=>{
    const year=2020+i;
    return{year,share:parseFloat((2+sr(i*17+3)*3+i*i*0.8).toFixed(1)),delivered:Math.floor(50+sr(i*19+7)*30+i*i*12)};
  });

  // Fuel efficiency by generation
  const genData=[
    {gen:'1960s',rpk:180},{gen:'1970s',rpk:145},{gen:'1980s',rpk:115},{gen:'1990s',rpk:92},
    {gen:'2000s',rpk:78},{gen:'2010s',rpk:68},{gen:'Current',rpk:58},{gen:'Next-gen',rpk:42},{gen:'2035 Target',rpk:30}
  ];

  // Simulator
  const simTarget=airlines.find(a=>a.name===simAirline)||airlines[0];
  const simResults=useMemo(()=>{
    const base=simTarget.annualCO2;
    return Array.from({length:6},(_,i)=>{
      const year=2025+i*5;
      const replaced=Math.min(100,(replacePct/100)*((i+1)/6)*100);
      const reduction=replaced*0.01*(replaceType==='Next-gen'?0.35:replaceType==='Electric'?0.85:0.15);
      return{year,baseline:parseFloat(base.toFixed(2)),projected:parseFloat((base*(1-reduction)).toFixed(2)),reduction:parseFloat((reduction*100).toFixed(1))};
    });
  },[simTarget,replacePct,replaceType]);

  // Fleet deep dive for clicked airline on scatter
  const deepAirline=selAirline?airlines.find(a=>a.name===selAirline):null;

  return(<>
    {/* Benchmark by aircraft type */}
    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      <div style={{...card,flex:1,minWidth:400}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Emissions Intensity by Aircraft Type (gCO2/RPK)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={benchData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis type="category" dataKey="type" tick={{fontSize:11,fill:T.textSec}} width={90}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="intensity" name="gCO2/RPK" radius={[0,4,4,0]}>
              {benchData.map((b,i)=><Cell key={i} fill={b.intensity<50?T.green:b.intensity<80?T.sage:b.intensity<100?T.gold:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{...card,flex:1,minWidth:300}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Fuel Efficiency by Generation (gCO2/RPK)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={genData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="gen" tick={{fontSize:10,fill:T.textSec}} interval={0} angle={-25} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Line type="monotone" dataKey="rpk" stroke={T.navy} strokeWidth={2} dot={{r:4,fill:T.navy}} name="gCO2/RPK"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Fleet Age vs Emissions Intensity Scatter */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 4px',fontSize:14,fontWeight:600}}>Fleet Age vs Emissions Intensity (120 Airlines)</h3>
      <p style={{fontSize:12,color:T.textSec,margin:'0 0 12px'}}>Click an airline to see fleet deep-dive</p>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="x" name="Fleet Age (yrs)" tick={{fontSize:11,fill:T.textSec}} label={{value:'Fleet Age (years)',position:'insideBottom',offset:-5,fontSize:11,fill:T.textSec}}/>
          <YAxis dataKey="y" name="gCO2/RPK" tick={{fontSize:11,fill:T.textSec}} label={{value:'gCO2/RPK',angle:-90,position:'insideLeft',fontSize:11,fill:T.textSec}}/>
          <Tooltip cursor={{strokeDasharray:'3 3'}} content={({active,payload})=>{
            if(!active||!payload?.length)return null;
            const d=payload[0].payload;
            return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'8px 12px',fontSize:12,fontFamily:T.font}}>
              <div style={{fontWeight:600,color:T.navy}}>{d.name} ({d.iata})</div>
              <div>Fleet Age: {d.x} yrs</div>
              <div>Intensity: {d.y} gCO2/RPK</div>
              <div>Annual CO2: {d.co2} Mt</div>
            </div>);
          }}/>
          <Scatter data={scatterData} onClick={(d)=>setSelAirline(d.name)}>
            {scatterData.map((d,i)=><Cell key={i} fill={REGION_COLORS[d.region]||T.navy} fillOpacity={0.7} r={Math.max(4,d.co2*0.8)}/>)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginTop:8}}>
        {REGIONS.map(r=><div key={r} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.textSec}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:REGION_COLORS[r]}}/>
          {r}
        </div>)}
      </div>
    </div>

    {/* Fleet deep dive for clicked airline */}
    {deepAirline&&(
      <div style={{...card,marginBottom:20,border:`2px solid ${T.navyL}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0,fontSize:14,fontWeight:600}}>Fleet Deep-Dive: {deepAirline.name} ({deepAirline.iata})</h3>
          <button onClick={()=>setSelAirline(null)} style={{...btn(false),fontSize:12}}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <h4 style={{fontSize:12,fontWeight:600,margin:'0 0 6px'}}>Fleet Composition</h4>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Type','Count','Share'].map(h=><th key={h} style={{...thStyle,fontSize:11,padding:'6px 8px'}}>{h}</th>)}</tr></thead>
              <tbody>{Object.entries(deepAirline.fleet).filter(([,v])=>v>0).map(([t,v])=>(
                <tr key={t}><td style={{...tdStyle,fontSize:12,padding:'5px 8px'}}>{t}</td><td style={{...tdStyle,fontSize:12,padding:'5px 8px',textAlign:'right'}}>{v}</td><td style={{...tdStyle,fontSize:12,padding:'5px 8px',textAlign:'right'}}>{((v/deepAirline.fleetSize)*100).toFixed(1)}%</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div>
            <h4 style={{fontSize:12,fontWeight:600,margin:'0 0 6px'}}>Quarterly Emissions</h4>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={deepAirline.quarters}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}} interval={3}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="co2" stroke={T.navyL} fill={T.navyL+'25'} name="CO2 (Mt)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )}

    {/* Next-gen adoption curve */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Next-Gen Aircraft Adoption Curve</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={adoptionData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
          <YAxis yAxisId="l" tick={{fontSize:11,fill:T.textSec}} label={{value:'Fleet Share %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
          <YAxis yAxisId="r" orientation="right" tick={{fontSize:11,fill:T.textSec}} label={{value:'Deliveries',angle:90,position:'insideRight',fontSize:10,fill:T.textSec}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          <Area yAxisId="l" type="monotone" dataKey="share" stroke={T.sage} fill={T.sage+'30'} name="Fleet Share %" strokeWidth={2}/>
          <Line yAxisId="r" type="monotone" dataKey="delivered" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Deliveries"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {/* Fleet Renewal Simulator */}
    <div style={card}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Fleet Renewal Simulator</h3>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Airline</label>
          <select value={simAirline} onChange={e=>setSimAirline(e.target.value)} style={{...select,minWidth:180}}>
            {airlines.map(a=><option key={a.id} value={a.name}>{a.name} ({a.iata})</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Replacement %: {replacePct}%</label>
          <input type="range" min={10} max={100} step={5} value={replacePct} onChange={e=>setReplacePct(+e.target.value)} style={{width:160}}/>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Replace With</label>
          <select value={replaceType} onChange={e=>setReplaceType(e.target.value)} style={select}>
            <option value="Next-gen">Next-gen</option><option value="Electric">Electric/Hybrid</option><option value="Standard">Standard New</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={simResults}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
          <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'MtCO2',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          <Line type="monotone" dataKey="baseline" stroke={T.textMut} strokeDasharray="5 5" strokeWidth={2} name="Baseline" dot={false}/>
          <Line type="monotone" dataKey="projected" stroke={T.green} strokeWidth={2.5} name="Projected" dot={{r:4,fill:T.green}}/>
        </LineChart>
      </ResponsiveContainer>
      <div style={{display:'flex',gap:16,marginTop:10}}>
        {simResults.filter((_,i)=>i>0).map(r=>(
          <div key={r.year} style={{background:T.bg,borderRadius:6,padding:'6px 12px',fontSize:11}}>
            <span style={{color:T.textMut}}>{r.year}:</span> <span style={{fontWeight:600,color:T.green}}>-{r.reduction}%</span>
          </div>
        ))}
      </div>
    </div>

    {/* Emissions intensity distribution */}
    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Fleet Emissions Intensity Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[
            {range:'<50',count:airlines.filter(a=>a.emissionsIntensity<50).length},
            {range:'50-65',count:airlines.filter(a=>a.emissionsIntensity>=50&&a.emissionsIntensity<65).length},
            {range:'65-80',count:airlines.filter(a=>a.emissionsIntensity>=65&&a.emissionsIntensity<80).length},
            {range:'80-95',count:airlines.filter(a=>a.emissionsIntensity>=80&&a.emissionsIntensity<95).length},
            {range:'95-110',count:airlines.filter(a=>a.emissionsIntensity>=95&&a.emissionsIntensity<110).length},
            {range:'>110',count:airlines.filter(a=>a.emissionsIntensity>=110).length}
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="range" tick={{fontSize:11,fill:T.textSec}} label={{value:'gCO2/RPK',position:'insideBottom',offset:-5,fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Airlines',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="count" name="Airlines" radius={[4,4,0,0]}>
              {['<50','50-65','65-80','80-95','95-110','>110'].map((_,i)=><Cell key={i} fill={i<2?T.green:i<4?T.amber:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Regional Fleet Age Comparison</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={REGIONS.map(r=>{
            const ra=airlines.filter(a=>a.region===r);
            const avg=ra.reduce((s,a)=>s+a.fleetAge,0)/(ra.length||1);
            const newest=Math.min(...ra.map(a=>a.fleetAge));
            const oldest=Math.max(...ra.map(a=>a.fleetAge));
            return{region:r,avgAge:parseFloat(avg.toFixed(1)),youngest:parseFloat(newest.toFixed(1)),oldest:parseFloat(oldest.toFixed(1))};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="region" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Years',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="avgAge" name="Avg Age" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar dataKey="youngest" name="Youngest" fill={T.green} radius={[4,4,0,0]}/>
            <Bar dataKey="oldest" name="Oldest" fill={T.red} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Fleet type breakdown across regions */}
    <div style={card}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Aircraft Type Distribution by Region</h3>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead><tr>
            <th style={thStyle}>Region</th>
            {AIRCRAFT_TYPES.map(t=><th key={t} style={{...thStyle,fontSize:10,textAlign:'center'}}>{t}</th>)}
            <th style={{...thStyle,textAlign:'right'}}>Total</th>
          </tr></thead>
          <tbody>{REGIONS.map(r=>{
            const ra=airlines.filter(a=>a.region===r);
            const totals=AIRCRAFT_TYPES.map(t=>ra.reduce((s,a)=>s+(a.fleet[t]||0),0));
            const grand=totals.reduce((s,v)=>s+v,0);
            return(
              <tr key={r}>
                <td style={{...tdStyle,fontWeight:600,fontSize:12}}>{r}</td>
                {totals.map((v,i)=>(
                  <td key={i} style={{...tdStyle,textAlign:'center',fontSize:11,fontFamily:T.mono}}>{v>0?v:'-'}</td>
                ))}
                <td style={{...tdStyle,textAlign:'right',fontWeight:600,fontSize:12,fontFamily:T.mono}}>{grand.toLocaleString()}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  </>);
}

/* ════════════════════════════════════════════════════════════
   TAB 3: SAF & ALTERNATIVE FUELS
   ════════════════════════════════════════════════════════════ */
function SafFuelsTab({suppliers,airlines}){
  const [calcAirline,setCalcAirline]=useState(airlines[0].name);
  const [blendRate,setBlendRate]=useState(6);
  const [scenario,setScenario]=useState('Base');
  const [sortCol,setSortCol]=useState('capacity');
  const [sortDir,setSortDir]=useState('desc');

  const calcTarget=airlines.find(a=>a.name===calcAirline)||airlines[0];
  const baseFuelCost=800; // $/tonne kerosene
  const safPremiumAvg=suppliers.reduce((s,sp)=>s+sp.price,0)/suppliers.length;

  const calcResults=useMemo(()=>{
    const fuelVol=calcTarget.annualCO2*0.32*1000000; // approximate tonnes
    return [2,6,10,20,34,70].map(blend=>{
      const safVol=fuelVol*(blend/100);
      const addCost=safVol*(safPremiumAvg-baseFuelCost)/1000000;
      return{blend:`${blend}%`,safVolume:parseFloat((safVol/1000).toFixed(0)),addCostM:parseFloat(addCost.toFixed(1)),perPax:parseFloat((addCost*1000000/(calcTarget.fleetSize*150*365*0.8)).toFixed(2))};
    });
  },[calcTarget,safPremiumAvg]);

  // Production capacity vs demand gap
  const capDemand=Array.from({length:7},(_,i)=>{
    const year=2025+i*4;
    const cap=parseFloat((5+i*i*3.5+sr(i*41)*8).toFixed(1));
    const dem=parseFloat((8+i*i*5.2+sr(i*43)*6).toFixed(1));
    return{year,capacity:cap,demand:dem};
  });

  // Price projection scenarios
  const priceScenarios=Array.from({length:7},(_,i)=>{
    const year=2025+i*4;
    return{year,
      base:parseFloat((2400-i*i*18+sr(i*51)*50).toFixed(0)),
      optimistic:parseFloat((2400-i*i*28+sr(i*53)*40).toFixed(0)),
      conservative:parseFloat((2400-i*i*8+sr(i*57)*60).toFixed(0))
    };
  });

  const sortedSuppliers=useMemo(()=>{
    const d=[...suppliers];
    d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return d;
  },[suppliers,sortCol,sortDir]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const TECH_COLORS={'HEFA':T.navy,'Fischer-Tropsch':T.sage,'Alcohol-to-Jet':T.gold,'e-Kerosene':'#8b5cf6','Power-to-Liquid':'#e17055'};

  return(<>
    {/* ReFuelEU Mandate Trajectory */}
    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      <div style={{...card,flex:1,minWidth:400}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>ReFuelEU SAF Mandate Trajectory (2025-2050)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={SAF_MANDATE_TRAJECTORY}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'SAF Blend %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="stepAfter" dataKey="mandate" stroke={T.navy} fill={T.navy+'20'} name="Mandate %" strokeWidth={2}/>
            <Line type="monotone" dataKey="actual" stroke={T.green} strokeWidth={2} dot={{r:4,fill:T.green}} name="Actual %" connectNulls={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{...card,flex:1,minWidth:300}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>SAF Capacity vs Demand Gap (Mt)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={capDemand}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="demand" stroke={T.red} fill={T.red+'15'} name="Demand" strokeWidth={2}/>
            <Area type="monotone" dataKey="capacity" stroke={T.green} fill={T.green+'15'} name="Capacity" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* SAF Suppliers Table */}
    <div style={{...card,padding:0,overflow:'hidden',marginBottom:20}}>
      <div style={{padding:'14px 16px',borderBottom:`1px solid ${T.border}`}}>
        <h3 style={{margin:0,fontSize:14,fontWeight:600}}>SAF Suppliers (15)</h3>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
          <thead><tr>
            {[['name','Supplier'],['tech','Technology'],['capacity','Capacity (kt/yr)'],['price','Price ($/t)'],['lcReduction','LC Reduction %'],['reliability','Reliability'],['region','Region']].map(([k,l])=>(
              <th key={k} style={{...thStyle,cursor:'pointer'}} onClick={()=>toggleSort(k)}>{l}{sortCol===k?(sortDir==='asc'?' ▲':' ▼'):''}</th>
            ))}
          </tr></thead>
          <tbody>{sortedSuppliers.map(s=>(
            <tr key={s.id} style={{transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{...tdStyle,fontWeight:600}}>{s.name}</td>
              <td style={tdStyle}><span style={badge(TECH_COLORS[s.tech]||T.navy)}>{s.tech}</span></td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>{s.capacity.toLocaleString()}</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>${s.price.toLocaleString()}</td>
              <td style={tdStyle}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:60,height:6,borderRadius:3,background:T.border}}>
                    <div style={{width:`${s.lcReduction}%`,height:'100%',borderRadius:3,background:s.lcReduction>80?T.green:s.lcReduction>60?T.sage:T.gold}}/>
                  </div>
                  <span style={{fontSize:11}}>{s.lcReduction}%</span>
                </div>
              </td>
              <td style={{...tdStyle,textAlign:'right'}}>{s.reliability}%</td>
              <td style={tdStyle}><span style={{fontSize:12,color:T.textSec}}>{s.region}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    {/* SAF Cost Calculator */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>SAF Cost Calculator</h3>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Airline</label>
          <select value={calcAirline} onChange={e=>setCalcAirline(e.target.value)} style={{...select,minWidth:180}}>
            {airlines.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
        <div style={{background:T.bg,borderRadius:6,padding:'8px 14px'}}>
          <span style={{fontSize:11,color:T.textMut}}>Annual CO2:</span> <span style={{fontWeight:700,color:T.navy}}>{calcTarget.annualCO2} Mt</span>
        </div>
        <div style={{background:T.bg,borderRadius:6,padding:'8px 14px'}}>
          <span style={{fontSize:11,color:T.textMut}}>Fleet:</span> <span style={{fontWeight:700,color:T.navy}}>{calcTarget.fleetSize} aircraft</span>
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['Blend Rate','SAF Volume (kt)','Add. Cost ($M)','Cost/Pax ($)'].map(h=><th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>{calcResults.map(r=>(
            <tr key={r.blend}>
              <td style={{...tdStyle,fontWeight:600}}>{r.blend}</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>{r.safVolume.toLocaleString()}</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12,color:r.addCostM>500?T.red:r.addCostM>200?T.amber:T.green}}>${r.addCostM.toLocaleString()}M</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>${r.perPax}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      {/* SAF by Airport */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>SAF Availability by Airport (Top 30)</h3>
        <div style={{overflowY:'auto',maxHeight:360}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Airport','Capacity (kt)','Demand (kt)','Gap'].map(h=><th key={h} style={{...thStyle,fontSize:11,padding:'6px 10px'}}>{h}</th>)}</tr></thead>
            <tbody>{TOP_AIRPORTS.map((a,i)=>(
              <tr key={i}><td style={{...tdStyle,fontSize:12,padding:'5px 10px'}}>{a.city}</td><td style={{...tdStyle,fontSize:12,padding:'5px 10px',textAlign:'right'}}>{a.capacity.toLocaleString()}</td><td style={{...tdStyle,fontSize:12,padding:'5px 10px',textAlign:'right'}}>{a.demand.toLocaleString()}</td><td style={{...tdStyle,fontSize:12,padding:'5px 10px',textAlign:'right',color:a.gap>0?T.red:T.green,fontWeight:600}}>{a.gap>0?'+':''}{a.gap.toLocaleString()}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* SAF Technology Comparison */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>SAF Technology Comparison</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={['HEFA','Fischer-Tropsch','Alcohol-to-Jet','e-Kerosene','Power-to-Liquid'].map((t,i)=>({
            tech:t,
            cost:parseFloat((1200+i*450+sr(i*121)*200).toFixed(0)),
            lcReduction:parseFloat((85-i*8+sr(i*123)*5).toFixed(0)),
            maturity:[9,6,5,4,3][i]
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="tech" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-15} textAnchor="end" height={50}/>
            <YAxis yAxisId="l" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis yAxisId="r" orientation="right" tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar yAxisId="l" dataKey="cost" name="Cost ($/t)" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar yAxisId="r" dataKey="lcReduction" name="LC Reduction %" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      {/* Price Projection Scenarios */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 8px',fontSize:14,fontWeight:600}}>SAF Price Projection ($/tonne)</h3>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {['Base','Optimistic','Conservative'].map(s=>(
            <button key={s} onClick={()=>setScenario(s)} style={btn(scenario===s)}>{s}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={priceScenarios}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} domain={['auto','auto']}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {(scenario==='Base'||scenario==='All')&&<Line type="monotone" dataKey="base" stroke={T.navy} strokeWidth={2} name="Base" dot={{r:3}}/>}
            {(scenario==='Optimistic'||scenario==='All')&&<Line type="monotone" dataKey="optimistic" stroke={T.green} strokeWidth={2} name="Optimistic" dot={{r:3}}/>}
            {(scenario==='Conservative'||scenario==='All')&&<Line type="monotone" dataKey="conservative" stroke={T.red} strokeWidth={2} name="Conservative" dot={{r:3}}/>}
            {scenario!=='All'&&scenario==='Base'&&<Line type="monotone" dataKey="optimistic" stroke={T.green} strokeWidth={1} strokeDasharray="4 4" name="Optimistic" dot={false}/>}
            {scenario!=='All'&&scenario==='Base'&&<Line type="monotone" dataKey="conservative" stroke={T.red} strokeWidth={1} strokeDasharray="4 4" name="Conservative" dot={false}/>}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </>);
}

/* ════════════════════════════════════════════════════════════
   TAB 4: INVESTMENT & CREDIT RISK
   ════════════════════════════════════════════════════════════ */
function InvestmentRiskTab({bonds,airlines}){
  const [carbonCost,setCarbonCost]=useState(80);
  const [selBond,setSelBond]=useState(null);
  const [sortCol,setSortCol]=useState('climateSpread');
  const [sortDir,setSortDir]=useState('desc');
  const [riskFilter,setRiskFilter]=useState('All');
  const [typeFilter,setTypeFilter]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...bonds];
    if(riskFilter!=='All')d=d.filter(b=>b.strandedRisk===riskFilter);
    if(typeFilter!=='All')d=d.filter(b=>b.type===typeFilter);
    d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return d;
  },[bonds,riskFilter,typeFilter,sortCol,sortDir]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  // Carbon cost pass-through analysis
  const passThrough=useMemo(()=>{
    return Array.from({length:5},(_,i)=>{
      const cc=40+i*40;
      const fuelSurcharge=parseFloat((cc*0.012).toFixed(2));
      const margin=parseFloat((cc*0.008*(1-sr(i*71)*0.3)).toFixed(2));
      return{carbonCost:cc,fuelSurcharge,marginImpact:margin,netPassThrough:parseFloat(((fuelSurcharge/(fuelSurcharge+margin))*100).toFixed(1))};
    });
  },[]);

  // Stranded asset risk
  const strandedData=useMemo(()=>{
    return ['Europe','N.America','Asia-Pacific','Middle East','LATAM','Africa'].map(r=>{
      const rAirlines=airlines.filter(a=>a.region===r);
      const avgAge=rAirlines.reduce((s,a)=>s+a.fleetAge,0)/(rAirlines.length||1);
      const writeDown=parseFloat((avgAge*0.04*carbonCost/80).toFixed(1));
      return{region:r,avgFleetAge:parseFloat(avgAge.toFixed(1)),writeDownPct:writeDown,airlines:rAirlines.length};
    });
  },[airlines,carbonCost]);

  // Green bond / SLL tracker
  const greenBonds=bonds.filter(b=>b.type==='Green Bond'||b.type==='SLL');

  // TCFD disclosure quality
  const tcfdData=bonds.map(b=>({airline:b.airline,score:b.tcfdScore,rating:b.rating})).sort((a,b)=>b.score-a.score).slice(0,20);

  // Export CSV
  const exportCSV=useCallback(()=>{
    const headers=['Airline','Type','Amount ($M)','Maturity','Coupon %','Spread (bps)','Climate Spread (bps)','Rating','Stranded Risk','TCFD Score','Carbon Pass-Through %'];
    const rows=filtered.map(b=>[b.airline,b.type,b.amount,b.maturity,b.coupon,b.spread,b.climateSpread,b.rating,b.strandedRisk,b.tcfdScore,b.carbonPassThrough]);
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='aviation_climate_risk_report.csv';a.click();URL.revokeObjectURL(url);
  },[filtered]);

  return(<>
    {/* KPI strip */}
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
      {[
        {label:'Portfolio Value',value:`$${(bonds.reduce((s,b)=>s+b.amount,0)/1000).toFixed(1)}B`,sub:'30 instruments'},
        {label:'Avg Climate Spread',value:`${Math.floor(bonds.reduce((s,b)=>s+b.climateSpread,0)/bonds.length)} bps`,sub:'Climate-adjusted'},
        {label:'Green/SLL Share',value:`${((greenBonds.length/bonds.length)*100).toFixed(0)}%`,sub:`${greenBonds.length} instruments`},
        {label:'High Stranded Risk',value:bonds.filter(b=>b.strandedRisk==='High').length,sub:'Airlines at risk'}
      ].map((k,i)=>(
        <div key={i} style={kpiBox}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:500,marginBottom:4}}>{k.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:T.navy}}>{k.value}</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{k.sub}</div>
        </div>
      ))}
    </div>

    {/* Portfolio Table */}
    <div style={{...card,padding:0,overflow:'hidden',marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:`1px solid ${T.border}`,flexWrap:'wrap',gap:8}}>
        <h3 style={{margin:0,fontSize:14,fontWeight:600}}>Aviation Bond/Loan Portfolio</h3>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)} style={select}>
            <option value="All">All Risk</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={select}>
            <option value="All">All Types</option>{['Green Bond','SLL','Conv. Bond','Term Loan','Revolver','Sukuk'].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={exportCSV} style={btn(true)}>Export CSV</button>
        </div>
      </div>
      <div style={{overflowX:'auto',maxHeight:420}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1000}}>
          <thead><tr>
            {[['airline','Airline'],['type','Type'],['amount','$M'],['maturity','Mat.'],['coupon','Cpn%'],['spread','Sprd'],['climateSpread','Clim Sprd'],['rating','Rating'],['strandedRisk','Strand. Risk'],['tcfdScore','TCFD'],['carbonPassThrough','CO2 Pass%']].map(([k,l])=>(
              <th key={k} style={{...thStyle,cursor:'pointer'}} onClick={()=>toggleSort(k)}>{l}{sortCol===k?(sortDir==='asc'?' ▲':' ▼'):''}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.map(b=>(
            <tr key={b.id} onClick={()=>setSelBond(selBond?.id===b.id?null:b)} style={{cursor:'pointer',background:selBond?.id===b.id?T.surfaceH:'transparent',transition:'background .1s'}}>
              <td style={{...tdStyle,fontWeight:600}}>{b.airline}</td>
              <td style={tdStyle}><span style={badge(b.type==='Green Bond'?T.green:b.type==='SLL'?T.sage:T.textMut)}>{b.type}</span></td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>${b.amount}</td>
              <td style={{...tdStyle,textAlign:'center',fontSize:12}}>{b.maturity}</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>{b.coupon}%</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>{b.spread}</td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12,fontWeight:600,color:b.climateSpread>400?T.red:b.climateSpread>250?T.amber:T.text}}>{b.climateSpread}</td>
              <td style={{...tdStyle,textAlign:'center'}}><span style={badge(b.rating.startsWith('A')?T.navy:b.rating.startsWith('B')?T.gold:T.red)}>{b.rating}</span></td>
              <td style={tdStyle}><span style={badge(riskColor(b.strandedRisk))}>{b.strandedRisk}</span></td>
              <td style={tdStyle}>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:40,height:5,borderRadius:3,background:T.border}}>
                    <div style={{width:`${b.tcfdScore}%`,height:'100%',borderRadius:3,background:b.tcfdScore>70?T.green:b.tcfdScore>45?T.amber:T.red}}/>
                  </div>
                  <span style={{fontSize:10,color:T.textMut}}>{b.tcfdScore}</span>
                </div>
              </td>
              <td style={{...tdStyle,textAlign:'right',fontFamily:T.mono,fontSize:12}}>{b.carbonPassThrough}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      {/* Carbon Cost Pass-Through */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 8px',fontSize:14,fontWeight:600}}>Carbon Cost Pass-Through Analysis</h3>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
          <label style={{fontSize:12,color:T.textSec}}>Carbon Cost: ${carbonCost}/tCO2</label>
          <input type="range" min={20} max={200} step={10} value={carbonCost} onChange={e=>setCarbonCost(+e.target.value)} style={{flex:1,maxWidth:200}}/>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={passThrough}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="carbonCost" tick={{fontSize:11,fill:T.textSec}} label={{value:'Carbon Cost ($/tCO2)',position:'insideBottom',offset:-5,fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="fuelSurcharge" name="Fuel Surcharge ($)" fill={T.sage} radius={[4,4,0,0]} stackId="a"/>
            <Bar dataKey="marginImpact" name="Margin Impact ($)" fill={T.red+'80'} radius={[4,4,0,0]} stackId="a"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stranded Asset Risk */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Stranded Asset Risk by Region</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={strandedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="region" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
            <YAxis yAxisId="l" tick={{fontSize:11,fill:T.textSec}} label={{value:'Avg Fleet Age',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
            <YAxis yAxisId="r" orientation="right" tick={{fontSize:11,fill:T.textSec}} label={{value:'Write-Down %',angle:90,position:'insideRight',fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar yAxisId="l" dataKey="avgFleetAge" name="Avg Fleet Age" fill={T.navyL} radius={[4,4,0,0]}/>
            <Line yAxisId="r" type="monotone" dataKey="writeDownPct" stroke={T.red} strokeWidth={2} name="Write-Down %" dot={{r:4,fill:T.red}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      {/* Green Bond / SLL Tracker */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Green Bond & Sustainability-Linked Loan Tracker</h3>
        <div style={{overflowY:'auto',maxHeight:280}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Airline','Instrument','Amount','Coupon','Rating'].map(h=><th key={h} style={{...thStyle,fontSize:11,padding:'6px 10px'}}>{h}</th>)}</tr></thead>
            <tbody>{greenBonds.map(b=>(
              <tr key={b.id}>
                <td style={{...tdStyle,fontWeight:600,fontSize:12,padding:'5px 10px'}}>{b.airline}</td>
                <td style={{...tdStyle,fontSize:12,padding:'5px 10px'}}><span style={badge(b.type==='Green Bond'?T.green:T.sage)}>{b.type}</span></td>
                <td style={{...tdStyle,fontSize:12,padding:'5px 10px',textAlign:'right',fontFamily:T.mono}}>${b.amount}M</td>
                <td style={{...tdStyle,fontSize:12,padding:'5px 10px',textAlign:'right',fontFamily:T.mono}}>{b.coupon}%</td>
                <td style={{...tdStyle,fontSize:12,padding:'5px 10px',textAlign:'center'}}><span style={badge(T.navy)}>{b.rating}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* TCFD Disclosure Quality */}
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>TCFD Aviation Sector Disclosure Quality</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={tcfdData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/>
            <YAxis type="category" dataKey="airline" tick={{fontSize:10,fill:T.textSec}} width={100}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="score" name="TCFD Score" radius={[0,4,4,0]}>
              {tcfdData.map((d,i)=><Cell key={i} fill={d.score>70?T.green:d.score>45?T.amber:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* EU ETS Aviation Compliance */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>EU ETS Aviation — Free Allowance Phase-Out</h3>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:350}}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              {year:2024,free:100,auctioned:0},{year:2025,free:75,auctioned:25},{year:2026,free:50,auctioned:50},
              {year:2027,free:25,auctioned:75},{year:2028,free:0,auctioned:100},{year:2030,free:0,auctioned:100}
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'% Allocation',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="free" stroke={T.sage} fill={T.sage+'30'} name="Free Allowances %" stackId="1"/>
              <Area type="monotone" dataKey="auctioned" stroke={T.red} fill={T.red+'20'} name="Auctioned %" stackId="1"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:300}}>
          <h4 style={{fontSize:12,fontWeight:600,margin:'0 0 10px'}}>ETS Cost Impact by Region (EUR/pax)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGIONS.map((r,i)=>({region:r,costPerPax:parseFloat((2.5+sr(i*83+1)*12).toFixed(2)),coverage:parseFloat((r==='Europe'?100:r==='Middle East'?15:40+sr(i*87+3)*30).toFixed(0))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="region" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="costPerPax" name="EUR/pax" fill={T.gold} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Compliance trend over time */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Credit Spread Sensitivity to Carbon Price</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={Array.from({length:10},(_,i)=>{
          const cp=20+i*20;
          return{
            carbonPrice:`$${cp}`,
            aaSpread:parseFloat((80+cp*0.8+sr(i*91)*10).toFixed(0)),
            bbbSpread:parseFloat((180+cp*1.6+sr(i*93)*15).toFixed(0)),
            bbSpread:parseFloat((320+cp*2.8+sr(i*97)*20).toFixed(0))
          };
        })}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="carbonPrice" tick={{fontSize:11,fill:T.textSec}} label={{value:'Carbon Price ($/tCO2)',position:'insideBottom',offset:-5,fontSize:10,fill:T.textSec}}/>
          <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Credit Spread (bps)',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          <Line type="monotone" dataKey="aaSpread" stroke={T.green} strokeWidth={2} name="AA-rated" dot={{r:3}}/>
          <Line type="monotone" dataKey="bbbSpread" stroke={T.amber} strokeWidth={2} name="BBB-rated" dot={{r:3}}/>
          <Line type="monotone" dataKey="bbSpread" stroke={T.red} strokeWidth={2} name="BB-rated" dot={{r:3}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Net-zero pathway alignment */}
    <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
      <div style={{...card,flex:1,minWidth:350}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Aviation Net-Zero Pathway (MtCO2)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={Array.from({length:7},(_,i)=>{
            const year=2020+i*5;
            const bau=parseFloat((920+i*45+sr(i*101)*30).toFixed(0));
            const nz=parseFloat((920-i*i*18+sr(i*103)*20).toFixed(0));
            return{year,bau,netZero:Math.max(nz,50),saf:parseFloat((i*i*12+sr(i*107)*10).toFixed(0)),offsets:parseFloat((i*i*8+sr(i*109)*5).toFixed(0))};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Line type="monotone" dataKey="bau" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" name="BAU"/>
            <Area type="monotone" dataKey="netZero" stroke={T.navy} fill={T.navy+'15'} name="Net-Zero Path" strokeWidth={2}/>
            <Area type="monotone" dataKey="saf" stroke={T.sage} fill={T.sage+'20'} name="SAF Contribution"/>
            <Area type="monotone" dataKey="offsets" stroke={T.gold} fill={T.gold+'20'} name="Offset Contribution"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio risk summary */}
      <div style={{...card,flex:1,minWidth:300}}>
        <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Portfolio Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={[
              {name:'Low Risk',value:bonds.filter(b=>b.strandedRisk==='Low').length},
              {name:'Medium Risk',value:bonds.filter(b=>b.strandedRisk==='Medium').length},
              {name:'High Risk',value:bonds.filter(b=>b.strandedRisk==='High').length}
            ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} fontSize={11}>
              <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:8}}>
          {[{l:'Low',c:T.green},{l:'Medium',c:T.amber},{l:'High',c:T.red}].map(r=>(
            <div key={r.l} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.textSec}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:r.c}}/>{r.l}: ${bonds.filter(b=>b.strandedRisk===r.l).reduce((s,b)=>s+b.amount,0)}M
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Rating migration matrix */}
    <div style={{...card,marginBottom:20}}>
      <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Climate-Adjusted Rating Migration Risk</h3>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',maxWidth:700}}>
          <thead><tr>
            <th style={{...thStyle,fontSize:11}}>Current / Target</th>
            {['AAA','AA','A','BBB','BB','B','Default'].map(r=><th key={r} style={{...thStyle,fontSize:11,textAlign:'center'}}>{r}</th>)}
          </tr></thead>
          <tbody>{['AAA','AA','A','BBB','BB','B'].map((from,ri)=>(
            <tr key={from}>
              <td style={{...tdStyle,fontWeight:600,fontSize:12}}>{from}</td>
              {['AAA','AA','A','BBB','BB','B','Default'].map((to,ci)=>{
                const val=ri===ci?parseFloat((85-ri*8+sr(ri*111+ci*7)*5).toFixed(1)):
                  Math.abs(ri-ci)===1?parseFloat((8+sr(ri*113+ci*11)*4).toFixed(1)):
                  Math.abs(ri-ci)===2?parseFloat((2+sr(ri*117+ci*13)*2).toFixed(1)):
                  parseFloat((sr(ri*119+ci*17)*1.5).toFixed(1));
                const bg=ri===ci?T.green+'20':val>5?T.amber+'20':val>2?T.gold+'10':'transparent';
                return <td key={to} style={{...tdStyle,textAlign:'center',fontSize:11,fontFamily:T.mono,background:bg}}>{val}%</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p style={{fontSize:11,color:T.textMut,marginTop:8}}>Transition probabilities under NGFS Disorderly scenario (1.5C), 5-year horizon. Climate-adjusted for aviation sector carbon exposure.</p>
    </div>

    {/* Selected bond detail */}
    {selBond&&(
      <div style={{...card,border:`2px solid ${T.navyL}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0,fontSize:14,fontWeight:600}}>{selBond.airline} - {selBond.type} Detail</h3>
          <button onClick={()=>setSelBond(null)} style={{...btn(false),fontSize:12}}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
          {[
            {l:'Amount',v:`$${selBond.amount}M`},{l:'Maturity',v:selBond.maturity},{l:'Coupon',v:`${selBond.coupon}%`},
            {l:'Spread',v:`${selBond.spread} bps`},{l:'Climate Spread',v:`${selBond.climateSpread} bps`},{l:'Rating',v:selBond.rating},
            {l:'Stranded Risk',v:selBond.strandedRisk},{l:'TCFD Score',v:`${selBond.tcfdScore}/100`},{l:'CO2 Pass-Through',v:`${selBond.carbonPassThrough}%`}
          ].map((k,i)=>(
            <div key={i} style={{background:T.bg,borderRadius:6,padding:'8px 12px'}}>
              <div style={{fontSize:10,color:T.textMut,fontWeight:500}}>{k.l}</div>
              <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,padding:'10px 14px',background:T.bg,borderRadius:6,fontSize:12,color:T.textSec}}>
          <strong>Climate Risk Assessment:</strong> {selBond.strandedRisk==='High'?'This airline faces significant fleet write-down risk under net-zero scenarios. Climate-adjusted credit spread reflects elevated transition risk.':selBond.strandedRisk==='Medium'?'Moderate transition risk exposure. Fleet renewal plans partially mitigate stranded asset concerns.':'Low transition risk. Airline demonstrates proactive fleet modernization and SAF adoption strategy.'}
        </div>
      </div>
    )}
  </>);
}
