import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ═══════════════════════════════════════════
   SECTOR DEFINITIONS & CONSTANTS
   ═══════════════════════════════════════════ */
const SECTORS=['Power','Steel','Cement','O&G','Aviation','Shipping','Auto','Buildings'];
const SECTOR_UNITS={Power:'gCO2/kWh',Steel:'tCO2/t steel',Cement:'kgCO2/t cement','O&G':'kgCO2e/boe',Aviation:'gCO2/RPK',Shipping:'gCO2/t-nm',Auto:'gCO2/km',Buildings:'kgCO2/m\u00B2'};
const SECTOR_2020={Power:450,Steel:1.85,Cement:620,'O&G':55,Aviation:95,Shipping:12.5,Auto:180,Buildings:38};
const SECTOR_2050_15={Power:0,Steel:0.08,Cement:120,'O&G':8,Aviation:20,Shipping:1.8,Auto:0,Buildings:3};
const SECTOR_2050_2C={Power:50,Steel:0.35,Cement:200,'O&G':18,Aviation:40,Shipping:3.5,Auto:20,Buildings:8};
const SECTOR_2050_NDC={Power:180,Steel:0.9,Cement:380,'O&G':32,Aviation:60,Shipping:6.5,Auto:65,Buildings:18};
const SECTOR_COLORS_MAP={Power:T.navy,Steel:'#6b7280',Cement:'#92400e','O&G':'#1e3a5f',Aviation:'#7c3aed',Shipping:T.teal,Auto:'#0891b2',Buildings:T.gold};
const SECTOR_DESC={
  Power:'Electricity generation decarbonisation through renewables, storage and grid modernisation',
  Steel:'Deep decarbonisation via hydrogen DRI, electric arc furnaces and CCS',
  Cement:'Clinker substitution, alternative fuels and carbon capture for process emissions',
  'O&G':'Upstream methane abatement, flaring elimination and managed decline',
  Aviation:'Sustainable aviation fuels, efficiency gains and demand management',
  Shipping:'Zero-emission fuels (ammonia, methanol, hydrogen) and vessel efficiency',
  Auto:'ICE phase-out, full electrification and charging infrastructure',
  Buildings:'Deep retrofits, heat pumps and net-zero building codes',
};

/* ═══════════════════════════════════════════
   MILESTONE DATA — 26 milestones across 8 sectors
   ═══════════════════════════════════════════ */
const MILESTONES_DATA=[
  {id:1,sector:'Power',name:'No new unabated coal plants',year:2024,status:'achieved'},
  {id:2,sector:'Power',name:'Coal phase-out advanced economies',year:2030,status:'on-track'},
  {id:3,sector:'Power',name:'Global coal phase-out',year:2040,status:'at-risk'},
  {id:4,sector:'Power',name:'Net-zero power generation',year:2050,status:'on-track'},
  {id:5,sector:'Steel',name:'Near-zero steel at commercial scale',year:2030,status:'at-risk'},
  {id:6,sector:'Steel',name:'50% green steel production',year:2040,status:'at-risk'},
  {id:7,sector:'Steel',name:'Net-zero steel sector',year:2050,status:'on-track'},
  {id:8,sector:'Cement',name:'CCS deployed on 10% of capacity',year:2030,status:'at-risk'},
  {id:9,sector:'Cement',name:'Alternative binders at scale',year:2035,status:'at-risk'},
  {id:10,sector:'Cement',name:'Net-zero cement sector',year:2050,status:'on-track'},
  {id:11,sector:'O&G',name:'Zero routine flaring achieved',year:2025,status:'at-risk'},
  {id:12,sector:'O&G',name:'50% methane reduction',year:2030,status:'on-track'},
  {id:13,sector:'O&G',name:'No new O&G field approvals',year:2025,status:'missed'},
  {id:14,sector:'O&G',name:'Net-zero upstream operations',year:2050,status:'on-track'},
  {id:15,sector:'Aviation',name:'10% SAF blending mandate',year:2030,status:'at-risk'},
  {id:16,sector:'Aviation',name:'Carbon-neutral growth (CORSIA)',year:2035,status:'on-track'},
  {id:17,sector:'Aviation',name:'65% SAF blending achieved',year:2050,status:'on-track'},
  {id:18,sector:'Shipping',name:'5% zero-emission fuels uptake',year:2030,status:'at-risk'},
  {id:19,sector:'Shipping',name:'IMO 40% GHG reduction target',year:2030,status:'at-risk'},
  {id:20,sector:'Shipping',name:'Net-zero international shipping',year:2050,status:'on-track'},
  {id:21,sector:'Auto',name:'No new ICE sales (advanced econ.)',year:2035,status:'on-track'},
  {id:22,sector:'Auto',name:'Global ICE phase-out complete',year:2040,status:'at-risk'},
  {id:23,sector:'Auto',name:'100% zero-emission fleet',year:2050,status:'on-track'},
  {id:24,sector:'Buildings',name:'All new buildings zero-carbon ready',year:2030,status:'at-risk'},
  {id:25,sector:'Buildings',name:'50% existing stock retrofitted',year:2040,status:'at-risk'},
  {id:26,sector:'Buildings',name:'Net-zero building stock globally',year:2050,status:'on-track'},
  {id:27,sector:'Power',name:'80% renewable generation share',year:2035,status:'on-track'},
  {id:28,sector:'Steel',name:'Green hydrogen DRI at 10% share',year:2032,status:'at-risk'},
  {id:29,sector:'Cement',name:'40% clinker ratio reduction',year:2035,status:'at-risk'},
  {id:30,sector:'O&G',name:'Carbon intensity -30% from 2020',year:2030,status:'on-track'},
  {id:31,sector:'Aviation',name:'Fleet efficiency +2% per annum',year:2028,status:'achieved'},
  {id:32,sector:'Shipping',name:'Energy Efficiency Design Index Phase 3',year:2025,status:'on-track'},
  {id:33,sector:'Auto',name:'50% EV share of new sales',year:2030,status:'on-track'},
  {id:34,sector:'Buildings',name:'Mandatory energy labels (all)',year:2028,status:'at-risk'},
  {id:35,sector:'Power',name:'Battery storage at 1500 GW',year:2035,status:'at-risk'},
  {id:36,sector:'Steel',name:'Electric arc furnace 40% share',year:2035,status:'on-track'},
];

/* ═══════════════════════════════════════════
   KEY TECHNOLOGIES PER SECTOR
   ═══════════════════════════════════════════ */
const SECTOR_TECHS={
  Power:['Solar PV','Onshore Wind','Offshore Wind','Battery Storage','Nuclear SMR','Grid Modernisation','Green Hydrogen Electrolysis'],
  Steel:['Hydrogen DRI','Electric Arc Furnace','CCS Blast Furnace','Scrap Recycling','Biomass Reduction','Molten Oxide Electrolysis'],
  Cement:['Carbon Capture (post-combustion)','Clinker Substitution','Alternative Fuels (RDF)','Calcined Clay','Oxyfuel Combustion','Electrification of Kilns'],
  'O&G':['Methane Leak Detection (LDAR)','Flare Gas Recovery','Electrification of Upstream','CCUS Enhanced Oil Recovery','Green Hydrogen Integration','Digital Twin Optimisation'],
  Aviation:['Sustainable Aviation Fuel (HEFA)','Power-to-Liquid (e-SAF)','Open Rotor Engines','Electric Regional Aircraft','Hydrogen Propulsion','Contrail Avoidance'],
  Shipping:['Green Ammonia Propulsion','Green Methanol Dual-Fuel','Wind-Assisted Propulsion','Battery-Hybrid Short Sea','Hydrogen Fuel Cells','Slow Steaming Optimisation'],
  Auto:['Battery Electric Vehicle','Solid-State Batteries','Fuel Cell Electric Vehicle','Lightweight Materials','V2G Integration','Autonomous Efficiency'],
  Buildings:['Air-Source Heat Pumps','Deep Envelope Retrofit','Building-Integrated PV','Smart HVAC Controls','District Heating Networks','Phase-Change Materials'],
};

/* ═══════════════════════════════════════════
   COMPANY NAMES — 15 per sector = 120 total
   ═══════════════════════════════════════════ */
const CO_NAMES={
  Power:['Enel','Iberdrola','NextEra Energy','Duke Energy','Engie','EDF','AES Corp','RWE','Orsted','E.ON','Fortum','SSE plc','Dominion Energy','Exelon','Entergy'],
  Steel:['ArcelorMittal','Nippon Steel','POSCO','Baowu Steel','Thyssenkrupp','Nucor','JFE Steel','Tata Steel','SSAB','Gerdau','JSW Steel','Voestalpine','Tenaris','Cleveland-Cliffs','BlueScope Steel'],
  Cement:['Holcim','Heidelberg Materials','CEMEX','CRH plc','Buzzi Unicem','Vicat','Dangote Cement','UltraTech Cement','ACC Limited','Dalmia Bharat','Taiheiyo Cement','Martin Marietta','Anhui Conch','Shree Cement','Summit Materials'],
  'O&G':['Shell','BP','TotalEnergies','Equinor','Eni','Repsol','Chevron','ExxonMobil','ConocoPhillips','Occidental Petroleum','Woodside Energy','Santos','Galp Energia','OMV','Petronas'],
  Aviation:['Lufthansa Group','Delta Air Lines','United Airlines','IAG','Air France-KLM','Singapore Airlines','Qantas Airways','ANA Holdings','Cathay Pacific','SAS Group','JetBlue Airways','Southwest Airlines','Alaska Air Group','easyJet','Ryanair'],
  Shipping:['Maersk','CMA CGM','MSC','Hapag-Lloyd','COSCO Shipping','Evergreen Marine','Ocean Network Express','Yang Ming Marine','HMM Co','ZIM Integrated','Wan Hai Lines','Pacific Intl Lines','Matson Inc','Star Bulk Carriers','Diana Shipping'],
  Auto:['Tesla','Toyota Motor','Volkswagen Group','Stellantis','General Motors','Ford Motor','Hyundai Motor','BMW Group','Mercedes-Benz','BYD Company','Renault Group','Rivian','Volvo Cars','Nissan Motor','Honda Motor'],
  Buildings:['Brookfield Asset Mgmt','Prologis','CBRE Group','JLL','Vonovia','Gecina','GPT Group','British Land','Derwent London','Landsec','AvalonBay Communities','Equity Residential','Mitsui Fudosan','Swire Properties','Sun Hung Kai Prop.'],
};

/* ═══════════════════════════════════════════
   GENERATE 120 COMPANIES (deterministic)
   ═══════════════════════════════════════════ */
function buildCompanies(){
  const arr=[];let id=0;
  SECTORS.forEach((sec,si)=>{
    const base2020=SECTOR_2020[sec];const tgt2050=SECTOR_2050_15[sec];
    const names=CO_NAMES[sec];
    names.forEach((name,ci)=>{
      const seed=si*100+ci;
      const progress=sr(seed)*0.6+0.2;
      const current=base2020-(base2020-tgt2050)*progress;
      const targetNow=base2020-(base2020-tgt2050)*((2026-2020)/(2050-2020));
      const gap=((current-targetNow)/targetNow*100);
      const alignment=Math.max(0,Math.min(100,100-gap*1.5+sr(seed+50)*20-10));
      const capexAlign=sr(seed+99)*60+20;
      const milestonesAchieved=Math.floor(sr(seed+77)*4);
      const tier=alignment>=75?'Aligned':alignment>=50?'Aligning':alignment>=25?'Partial':'Misaligned';
      const scope1=+(sr(seed+111)*base2020*0.4).toFixed(1);
      const scope2=+(sr(seed+222)*base2020*0.15).toFixed(1);
      const scope3=+(current-scope1-scope2).toFixed(1);
      const region=['Europe','North America','Asia Pacific','Latin America','Middle East'][Math.floor(sr(seed+333)*5)];
      const sbtiStatus=['Committed','Targets Set','SBTi Validated','Not Committed'][Math.floor(sr(seed+444)*4)];
      const transitionPlanPublished=sr(seed+555)>0.4;
      arr.push({id:++id,name,sector:sec,currentIntensity:+current.toFixed(2),pathwayTarget:+targetNow.toFixed(2),gap:+gap.toFixed(1),alignment:+alignment.toFixed(1),tier,capexAlign:+capexAlign.toFixed(0),milestonesAchieved,unit:SECTOR_UNITS[sec],scope1,scope2,scope3,region,sbtiStatus,transitionPlanPublished});
    });
  });
  return arr;
}
const COMPANIES=buildCompanies();

/* ═══════════════════════════════════════════
   PATHWAY CURVE GENERATOR
   ═══════════════════════════════════════════ */
function genPathway(sec,scenario){
  const base=SECTOR_2020[sec];
  const tgt=scenario==='1.5'?SECTOR_2050_15[sec]:scenario==='2'?SECTOR_2050_2C[sec]:SECTOR_2050_NDC[sec];
  const pts=[];
  for(let y=2020;y<=2050;y++){
    const t=(y-2020)/30;
    const curve=t<0.3?t*1.8:t<0.7?0.54+(t-0.3)*1.15:0.54+0.46*(1-Math.exp(-(t-0.7)*4));
    const val=base-(base-tgt)*Math.min(1,curve);
    pts.push({year:y,pathway:+Math.max(tgt,val).toFixed(2)});
  }
  return pts;
}

/* ═══════════════════════════════════════════
   SHARED STYLES & UI COMPONENTS
   ═══════════════════════════════════════════ */
const sCard={background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
const sBtn=(active)=>({padding:'7px 16px',borderRadius:8,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.text,cursor:'pointer',fontSize:13,fontWeight:active?600:500,fontFamily:T.font,transition:'all 0.15s'});
const sBadge=(color)=>({display:'inline-block',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font});
const sInput={padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,outline:'none',background:T.surface};
const sTh={padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:600,color:T.textSec,borderBottom:`2px solid ${T.border}`,fontFamily:T.font,whiteSpace:'nowrap'};
const sTd={padding:'9px 12px',fontSize:13,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};

const Pill=({children,active,onClick})=><button onClick={onClick} style={sBtn(active)}>{children}</button>;

const Badge=({status})=>{
  const c=status==='achieved'?T.green:status==='on-track'?T.sage:status==='at-risk'?T.amber:T.red;
  return <span style={sBadge(c)}>{status.replace(/-/g,' ')}</span>;
};

const TierBadge=({tier})=>{
  const c=tier==='Aligned'?T.green:tier==='Aligning'?T.sage:tier==='Partial'?T.amber:T.red;
  return <span style={sBadge(c)}>{tier}</span>;
};

const KPI=({label,value,sub})=>(
  <div style={{textAlign:'center',minWidth:110}}>
    <div style={{fontSize:26,fontWeight:700,color:T.navy,fontFamily:T.font}}>{value}</div>
    <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{label}</div>
    {sub&&<div style={{fontSize:11,color:T.textMut,marginTop:1}}>{sub}</div>}
  </div>
);

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 12px',fontSize:12,fontFamily:T.font,boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
      <div style={{fontWeight:600,marginBottom:4,color:T.navy}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color||T.text,marginBottom:1}}>{p.name}: {typeof p.value==='number'?p.value.toFixed(2):p.value}</div>)}
    </div>
  );
};

const MiniBar=({value,max,color})=>(
  <div style={{width:80,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}>
    <div style={{width:`${Math.min(100,(value/max)*100)}%`,height:'100%',borderRadius:3,background:color||T.sage}}/>
  </div>
);

/* ══════════════════════════════════════════════════
   TAB 1: SECTOR PATHWAYS
   ══════════════════════════════════════════════════ */
function SectorPathwaysTab(){
  const [activeSector,setActiveSector]=useState('Power');
  const [scenario,setScenario]=useState('1.5');

  const pathData=useMemo(()=>genPathway(activeSector,scenario),[activeSector,scenario]);
  const sectorCos=useMemo(()=>COMPANIES.filter(c=>c.sector===activeSector),[activeSector]);
  const onTrack=sectorCos.filter(c=>c.alignment>=50).length;
  const offTrack=sectorCos.length-onTrack;
  const sectorMilestones=MILESTONES_DATA.filter(m=>m.sector===activeSector);
  const avgAlign=+(sectorCos.reduce((a,c)=>a+c.alignment,0)/sectorCos.length).toFixed(1);

  /* build chart data combining pathway + company scatter overlay */
  const chartData=useMemo(()=>{
    const map={};
    pathData.forEach(p=>{map[p.year]={year:p.year,pathway:p.pathway};});
    /* add a second scenario line for comparison */
    const altScen=scenario==='1.5'?'2':'1.5';
    const altPath=genPathway(activeSector,altScen);
    altPath.forEach(p=>{if(map[p.year])map[p.year].altPathway=p.pathway;});
    return Object.values(map).sort((a,b)=>a.year-b.year);
  },[pathData,activeSector,scenario]);

  /* company position dots list */
  const companyDots=useMemo(()=>sectorCos.map(c=>({
    name:c.name,value:c.currentIntensity,alignment:c.alignment,tier:c.tier,
    sbti:c.sbtiStatus,region:c.region,
  })),[sectorCos]);

  const tierDist=useMemo(()=>[
    {name:'Aligned',count:sectorCos.filter(c=>c.tier==='Aligned').length},
    {name:'Aligning',count:sectorCos.filter(c=>c.tier==='Aligning').length},
    {name:'Partial',count:sectorCos.filter(c=>c.tier==='Partial').length},
    {name:'Misaligned',count:sectorCos.filter(c=>c.tier==='Misaligned').length},
  ],[sectorCos]);

  const target2050=scenario==='1.5'?SECTOR_2050_15[activeSector]:scenario==='2'?SECTOR_2050_2C[activeSector]:SECTOR_2050_NDC[activeSector];

  return <div>
    {/* sector selector */}
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
      {SECTORS.map(s=><Pill key={s} active={s===activeSector} onClick={()=>setActiveSector(s)}>{s}</Pill>)}
    </div>

    {/* scenario toggle */}
    <div style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
      <span style={{fontSize:12,color:T.textSec,marginRight:8}}>Scenario:</span>
      {['1.5','2','NDC'].map(sc=><Pill key={sc} active={sc===scenario} onClick={()=>setScenario(sc)}>{sc==='1.5'?'1.5\u00B0C':sc==='2'?'2\u00B0C':'NDC'}</Pill>)}
    </div>
    <div style={{fontSize:12,color:T.textMut,marginBottom:20,fontStyle:'italic'}}>{SECTOR_DESC[activeSector]}</div>

    {/* KPI row */}
    <div style={{...sCard,display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:16}}>
      <KPI label="Companies Tracked" value={sectorCos.length}/>
      <KPI label="On Track" value={onTrack} sub={`${(onTrack/sectorCos.length*100).toFixed(0)}% of sector`}/>
      <KPI label="Off Track" value={offTrack} sub={`${(offTrack/sectorCos.length*100).toFixed(0)}% of sector`}/>
      <KPI label="Avg Alignment" value={`${avgAlign}%`}/>
      <KPI label="2050 Target" value={target2050} sub={SECTOR_UNITS[activeSector]}/>
    </div>

    {/* main pathway chart */}
    <div style={sCard}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
        <div style={{fontSize:15,fontWeight:700,color:T.navy,fontFamily:T.font}}>
          IEA NZE Pathway \u2014 {activeSector} ({scenario==='1.5'?'1.5\u00B0C':scenario==='2'?'2\u00B0C':'NDC'})
        </div>
        <span style={{fontSize:11,color:T.textMut}}>Dashed line = {scenario==='1.5'?'2\u00B0C':'1.5\u00B0C'} comparison</span>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData} margin={{top:10,right:30,left:10,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}} stroke={T.border}/>
          <YAxis tick={{fontSize:11,fill:T.textSec}} stroke={T.border}
            label={{value:SECTOR_UNITS[activeSector],angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textMut}}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Area type="monotone" dataKey="pathway" stroke={SECTOR_COLORS_MAP[activeSector]||T.navy}
            fill={`${SECTOR_COLORS_MAP[activeSector]||T.navy}15`} strokeWidth={2.5}
            name={`${scenario==='1.5'?'1.5\u00B0C':scenario==='2'?'2\u00B0C':'NDC'} Pathway`}/>
          <Line type="monotone" dataKey="altPathway" stroke={T.textMut} strokeWidth={1.5}
            strokeDasharray="6 3" dot={false} name={`${scenario==='1.5'?'2\u00B0C':'1.5\u00B0C'} Pathway`}/>
          <Legend wrapperStyle={{fontSize:11}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {/* company position scatter-style list */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>
        Company Positions \u2014 Current Intensity ({SECTOR_UNITS[activeSector]})
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8}}>
        {companyDots.map((c,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:8,background:T.surfaceH}}>
            <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,
              background:c.alignment>=75?T.green:c.alignment>=50?T.sage:c.alignment>=25?T.amber:T.red}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
              <div style={{fontSize:10,color:T.textMut}}>{c.sbti} \u00B7 {c.region}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{c.value.toFixed(1)}</div>
              <div style={{fontSize:9,color:T.textMut}}>{c.alignment.toFixed(0)}% aligned</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* milestones checklist */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Key Milestones \u2014 {activeSector}</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {sectorMilestones.map(m=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 14px',borderRadius:8,background:T.surfaceH}}>
            <div style={{width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,
              background:m.status==='achieved'?T.green+'22':m.status==='on-track'?T.sage+'22':m.status==='at-risk'?T.amber+'22':T.red+'22',
              color:m.status==='achieved'?T.green:m.status==='on-track'?T.sage:m.status==='at-risk'?T.amber:T.red}}>
              {m.status==='achieved'?'\u2713':m.status==='missed'?'\u2717':'\u25CB'}
            </div>
            <div style={{flex:1}}>
              <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>{m.name}</span>
            </div>
            <span style={{fontSize:12,fontWeight:600,color:T.textMut,fontFamily:T.mono,marginRight:8}}>{m.year}</span>
            <Badge status={m.status}/>
          </div>
        ))}
      </div>
    </div>

    {/* tier distribution chart */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Alignment Distribution</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={tierDist}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
          <YAxis tick={{fontSize:11,fill:T.textSec}} allowDecimals={false}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="count" radius={[6,6,0,0]} name="Companies">
            {[T.green,T.sage,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* key technologies for this sector */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Key Decarbonisation Technologies \u2014 {activeSector}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
        {(SECTOR_TECHS[activeSector]||[]).map((tech,i)=>{
          const maturity=Math.floor(sr(SECTORS.indexOf(activeSector)*50+i)*4);
          const labels=['Emerging','Pilot','Commercial','Mature'];
          const colors=[T.amber,T.gold,T.sage,T.green];
          return <div key={i} style={{padding:'10px 14px',borderRadius:8,background:T.surfaceH,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>{tech}</div>
              <div style={{fontSize:10,color:T.textMut,marginTop:2}}>TRL {5+maturity} \u2013 {labels[maturity]}</div>
            </div>
            <div style={{width:8,height:8,borderRadius:'50%',background:colors[maturity],flexShrink:0}}/>
          </div>;
        })}
      </div>
    </div>

    {/* cross-sector intensity comparison */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Cross-Sector Normalised Progress (%)</div>
      <div style={{fontSize:11,color:T.textMut,marginBottom:10}}>Shows percentage of pathway covered from 2020 baseline to 2050 target (1.5\u00B0C scenario)</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={SECTORS.map(sec=>{
          const cos=COMPANIES.filter(c=>c.sector===sec);
          const avgIntensity=cos.reduce((a,c)=>a+c.currentIntensity,0)/cos.length;
          const base=SECTOR_2020[sec];const tgt=SECTOR_2050_15[sec];
          const pct=base!==tgt?((base-avgIntensity)/(base-tgt))*100:100;
          return {sector:sec,progress:+Math.max(0,Math.min(100,pct)).toFixed(1)};
        })} layout="vertical" margin={{top:5,right:20,left:80,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis type="category" dataKey="sector" tick={{fontSize:11,fill:T.textSec}} width={75}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="progress" name="Progress to 2050 Target %" radius={[0,6,6,0]}>
            {SECTORS.map((s,i)=><Cell key={i} fill={SECTOR_COLORS_MAP[s]||T.navy}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* sector summary cards */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:16}}>
      {SECTORS.map(sec=>{
        const cos=COMPANIES.filter(c=>c.sector===sec);
        const avg=+(cos.reduce((a,c)=>a+c.alignment,0)/cos.length).toFixed(0);
        const isActive=sec===activeSector;
        return <div key={sec} onClick={()=>setActiveSector(sec)} style={{
          ...sCard,marginBottom:0,cursor:'pointer',borderColor:isActive?T.navy:T.border,
          background:isActive?T.navy+'08':T.surface,transition:'all 0.15s',
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{sec}</span>
            <div style={{width:10,height:10,borderRadius:'50%',background:avg>=60?T.green:avg>=40?T.amber:T.red}}/>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{avg}%</div>
          <div style={{fontSize:10,color:T.textMut}}>Avg alignment \u00B7 {cos.length} companies</div>
          <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Target: {SECTOR_2050_15[sec]} {SECTOR_UNITS[sec]} by 2050</div>
        </div>;
      })}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 2: COMPANY ALIGNMENT
   ══════════════════════════════════════════════════ */
function CompanyAlignmentTab(){
  const [sort,setSort]=useState({key:'alignment',dir:'desc'});
  const [filterSector,setFilterSector]=useState('All');
  const [filterTier,setFilterTier]=useState('All');
  const [filterGap,setFilterGap]=useState('All');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);

  const filtered=useMemo(()=>{
    let arr=[...COMPANIES];
    if(filterSector!=='All')arr=arr.filter(c=>c.sector===filterSector);
    if(filterTier!=='All')arr=arr.filter(c=>c.tier===filterTier);
    if(filterGap==='<10%')arr=arr.filter(c=>Math.abs(c.gap)<10);
    else if(filterGap==='10-30%')arr=arr.filter(c=>Math.abs(c.gap)>=10&&Math.abs(c.gap)<30);
    else if(filterGap==='>30%')arr=arr.filter(c=>Math.abs(c.gap)>=30);
    if(search)arr=arr.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
    const k=sort.key;
    arr.sort((a,b)=>{
      const av=typeof a[k]==='string'?a[k]:+a[k];
      const bv=typeof b[k]==='string'?b[k]:+b[k];
      if(typeof av==='string')return sort.dir==='asc'?av.localeCompare(bv):bv.localeCompare(av);
      return sort.dir==='asc'?av-bv:bv-av;
    });
    return arr;
  },[filterSector,filterTier,filterGap,search,sort]);

  const toggleSort=(key)=>setSort(prev=>({key,dir:prev.key===key&&prev.dir==='desc'?'asc':'desc'}));

  /* trajectory for selected company vs pathway */
  const companyTrajectory=useMemo(()=>{
    if(!selected)return [];
    const base=SECTOR_2020[selected.sector];
    const tgt=SECTOR_2050_15[selected.sector];
    const pts=[];
    for(let y=2020;y<=2050;y+=2){
      const t=(y-2020)/30;
      const pathVal=base-(base-tgt)*t;
      const seed=selected.id*100+y;
      const compVal=y<=2026
        ?base-(base-selected.currentIntensity)*((y-2020)/6)
        :selected.currentIntensity-(selected.currentIntensity-tgt*1.2)*((y-2026)/24)+sr(seed)*base*0.02;
      pts.push({year:y,pathway:+pathVal.toFixed(2),company:+Math.max(0,compVal).toFixed(2)});
    }
    return pts;
  },[selected]);

  /* recommended actions */
  const recommendedActions=useMemo(()=>{
    if(!selected)return [];
    const all=[
      {action:'Increase renewable energy procurement to 80%+',impact:'High',timeline:'1\u20132 years'},
      {action:'Set SBTi-validated near-term targets',impact:'High',timeline:'6\u201312 months'},
      {action:'Align CapEx with transition pathway (>60%)',impact:'High',timeline:'1\u20133 years'},
      {action:'Engage top-20 suppliers on Scope 3 reduction',impact:'Medium',timeline:'2\u20134 years'},
      {action:'Publish TCFD-aligned transition plan',impact:'Medium',timeline:'6\u201312 months'},
      {action:'Implement internal carbon price ($80+/tCO2)',impact:'Medium',timeline:'1 year'},
    ];
    return all.slice(0,3+Math.floor(sr(selected.id+200)*3));
  },[selected]);

  const headers=[
    {k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'currentIntensity',l:'Intensity'},
    {k:'pathwayTarget',l:'Target'},{k:'gap',l:'Gap %'},{k:'alignment',l:'Alignment'},
  ];

  return <div style={{display:'flex',gap:16}}>
    {/* main table area */}
    <div style={{flex:1,minWidth:0}}>
      {/* filters */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <input style={{...sInput,width:200}} placeholder="Search company\u2026" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={sInput} value={filterSector} onChange={e=>setFilterSector(e.target.value)}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select style={sInput} value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
          <option value="All">All Tiers</option>
          {['Aligned','Aligning','Partial','Misaligned'].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select style={sInput} value={filterGap} onChange={e=>setFilterGap(e.target.value)}>
          <option value="All">All Gap Sizes</option>
          <option value="<10%">{'< 10%'}</option>
          <option value="10-30%">10 \u2013 30%</option>
          <option value=">30%">{'> 30%'}</option>
        </select>
        <span style={{fontSize:12,color:T.textMut,marginLeft:8}}>{filtered.length} companies</span>
      </div>

      {/* sortable table */}
      <div style={{...sCard,padding:0,overflow:'auto',maxHeight:620}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead style={{position:'sticky',top:0,background:T.surface,zIndex:2}}>
            <tr>
              {headers.map(h=><th key={h.k} style={{...sTh,cursor:'pointer',userSelect:'none'}} onClick={()=>toggleSort(h.k)}>
                {h.l}{sort.key===h.k?(sort.dir==='asc'?' \u2191':' \u2193'):''}
              </th>)}
              <th style={sTh}>Tier</th>
              <th style={sTh}>SBTi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id} onClick={()=>setSelected(c)} style={{cursor:'pointer',background:selected?.id===c.id?T.surfaceH:'transparent',transition:'background 0.15s'}}>
                <td style={{...sTd,fontWeight:600,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</td>
                <td style={sTd}><span style={{...sBadge(SECTOR_COLORS_MAP[c.sector]||T.navy),fontSize:10}}>{c.sector}</span></td>
                <td style={{...sTd,fontFamily:T.mono,fontSize:12}}>{c.currentIntensity}</td>
                <td style={{...sTd,fontFamily:T.mono,fontSize:12}}>{c.pathwayTarget}</td>
                <td style={{...sTd,fontFamily:T.mono,fontSize:12,color:c.gap>0?T.red:T.green}}>{c.gap>0?'+':''}{c.gap}%</td>
                <td style={{...sTd,fontSize:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <MiniBar value={c.alignment} max={100} color={c.alignment>=75?T.green:c.alignment>=50?T.sage:c.alignment>=25?T.amber:T.red}/>
                    <span style={{fontFamily:T.mono,fontSize:11}}>{c.alignment}</span>
                  </div>
                </td>
                <td style={sTd}><TierBadge tier={c.tier}/></td>
                <td style={{...sTd,fontSize:11,color:c.sbtiStatus==='SBTi Validated'?T.green:c.sbtiStatus==='Not Committed'?T.red:T.textSec}}>{c.sbtiStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* side panel */}
    {selected && <div style={{width:380,flexShrink:0}}>
      <div style={sCard}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.font}}>{selected.name}</div>
          <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:T.textMut}}>{'\u2715'}</button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          <span style={sBadge(SECTOR_COLORS_MAP[selected.sector]||T.navy)}>{selected.sector}</span>
          <TierBadge tier={selected.tier}/>
          <span style={sBadge(selected.sbtiStatus==='SBTi Validated'?T.green:T.textMut)}>{selected.sbtiStatus}</span>
        </div>

        {/* trajectory chart */}
        <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:8,fontFamily:T.font}}>Trajectory vs Sector Pathway</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={companyTrajectory} margin={{top:5,right:10,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Line type="monotone" dataKey="pathway" stroke={T.navy} strokeWidth={2} strokeDasharray="5 3" dot={false} name="IEA 1.5\u00B0C Pathway"/>
            <Line type="monotone" dataKey="company" stroke={T.gold} strokeWidth={2} dot={{r:3,fill:T.gold}} name={selected.name}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>

        {/* detail stats grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
          {[
            {label:'CapEx Alignment',val:`${selected.capexAlign}%`,color:selected.capexAlign>=50?T.green:T.amber},
            {label:'Milestones Hit',val:`${selected.milestonesAchieved}/4`,color:T.navy},
            {label:'Gap to Target',val:`${selected.gap>0?'+':''}${selected.gap}%`,color:selected.gap>0?T.red:T.green},
            {label:`Intensity (${selected.unit})`,val:selected.currentIntensity,color:T.navy},
            {label:'Scope 1',val:selected.scope1,color:T.navy},
            {label:'Scope 2',val:selected.scope2,color:T.navyL},
            {label:'Scope 3 (est.)',val:Math.max(0,selected.scope3).toFixed(1),color:T.textSec},
            {label:'Region',val:selected.region,color:T.navy},
          ].map((s,i)=>(
            <div key={i} style={{padding:10,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,color:T.textMut}}>{s.label}</div>
              <div style={{fontSize:17,fontWeight:700,color:s.color,fontFamily:typeof s.val==='number'?T.mono:T.font}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* transition plan */}
        <div style={{marginTop:12,padding:10,borderRadius:8,background:selected.transitionPlanPublished?T.green+'10':T.amber+'10',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>{selected.transitionPlanPublished?'\u2713':'\u26A0'}</span>
          <span style={{fontSize:12,color:selected.transitionPlanPublished?T.green:T.amber,fontWeight:600}}>
            Transition Plan {selected.transitionPlanPublished?'Published':'Not Published'}
          </span>
        </div>

        {/* recommended actions */}
        <div style={{fontSize:13,fontWeight:600,color:T.text,marginTop:16,marginBottom:8,fontFamily:T.font}}>Recommended Actions</div>
        {recommendedActions.map((a,i)=>(
          <div key={i} style={{padding:'8px 10px',borderRadius:8,background:T.bg,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>{a.action}</div>
              <div style={{fontSize:10,color:T.textMut}}>{a.timeline}</div>
            </div>
            <span style={{...sBadge(a.impact==='High'?T.green:T.amber),flexShrink:0,marginLeft:8}}>{a.impact}</span>
          </div>
        ))}
      </div>
    </div>}
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 3: MILESTONE MONITOR
   ══════════════════════════════════════════════════ */
function MilestoneMonitorTab(){
  const [filterSector,setFilterSector]=useState('All');
  const [filterStatus,setFilterStatus]=useState('All');
  const [customMilestones,setCustomMilestones]=useState([]);
  const [showAdd,setShowAdd]=useState(false);
  const [newMs,setNewMs]=useState({sector:'Power',name:'',year:2030,status:'on-track'});
  const [expandedMs,setExpandedMs]=useState(null);

  const allMs=useMemo(()=>[...MILESTONES_DATA,...customMilestones],[customMilestones]);

  const filteredMs=useMemo(()=>{
    let arr=[...allMs];
    if(filterSector!=='All')arr=arr.filter(m=>m.sector===filterSector);
    if(filterStatus!=='All')arr=arr.filter(m=>m.status===filterStatus);
    arr.sort((a,b)=>a.year-b.year);
    return arr;
  },[allMs,filterSector,filterStatus]);

  const addMilestone=()=>{
    if(!newMs.name.trim())return;
    setCustomMilestones(prev=>[...prev,{...newMs,id:2000+prev.length,custom:true}]);
    setNewMs({sector:'Power',name:'',year:2030,status:'on-track'});
    setShowAdd(false);
  };

  const affectedCompanies=(ms)=>COMPANIES.filter(c=>c.sector===ms.sector);
  const minYear=2024;const maxYear=2052;const yearSpan=maxYear-minYear;

  const statusCounts=useMemo(()=>{
    const c={achieved:0,'on-track':0,'at-risk':0,missed:0};
    allMs.forEach(m=>{c[m.status]=(c[m.status]||0)+1;});
    return c;
  },[allMs]);

  /* timeline bar chart for milestone density by year */
  const yearDist=useMemo(()=>{
    const map={};
    allMs.forEach(m=>{map[m.year]=(map[m.year]||0)+1;});
    return Object.entries(map).map(([y,c])=>({year:+y,count:c})).sort((a,b)=>a.year-b.year);
  },[allMs]);

  return <div>
    {/* KPI row */}
    <div style={{...sCard,display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:12}}>
      <KPI label="Total Milestones" value={allMs.length}/>
      <KPI label="Achieved" value={statusCounts.achieved}/>
      <KPI label="On Track" value={statusCounts['on-track']}/>
      <KPI label="At Risk" value={statusCounts['at-risk']}/>
      <KPI label="Missed" value={statusCounts.missed}/>
    </div>

    {/* filters + add button */}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <select style={sInput} value={filterSector} onChange={e=>setFilterSector(e.target.value)}>
        <option value="All">All Sectors</option>
        {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select style={sInput} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
        <option value="All">All Statuses</option>
        {['achieved','on-track','at-risk','missed'].map(s=><option key={s} value={s}>{s.replace(/-/g,' ')}</option>)}
      </select>
      <div style={{flex:1}}/>
      <button onClick={()=>setShowAdd(!showAdd)} style={sBtn(showAdd)}>{showAdd?'Cancel':'+ Add Custom Milestone'}</button>
    </div>

    {/* add custom milestone form */}
    {showAdd && <div style={{...sCard,display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
      <div>
        <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:2}}>Sector</label>
        <select style={sInput} value={newMs.sector} onChange={e=>setNewMs(p=>({...p,sector:e.target.value}))}>
          {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:2}}>Milestone Name</label>
        <input style={{...sInput,width:260}} value={newMs.name} onChange={e=>setNewMs(p=>({...p,name:e.target.value}))} placeholder="e.g. Zero-emission fuel mandate\u2026"/>
      </div>
      <div>
        <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:2}}>Target Year</label>
        <input type="number" min={2024} max={2060} style={{...sInput,width:80}} value={newMs.year} onChange={e=>setNewMs(p=>({...p,year:+e.target.value}))}/>
      </div>
      <div>
        <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:2}}>Status</label>
        <select style={sInput} value={newMs.status} onChange={e=>setNewMs(p=>({...p,status:e.target.value}))}>
          {['achieved','on-track','at-risk','missed'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button onClick={addMilestone} style={sBtn(true)}>Add Milestone</button>
    </div>}

    {/* milestone density chart */}
    <div style={sCard}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,fontFamily:T.font}}>Milestone Density by Year</div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={yearDist}>
          <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis tick={{fontSize:10,fill:T.textSec}} allowDecimals={false}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="count" fill={T.navyL} radius={[4,4,0,0]} name="Milestones"/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Gantt-style timeline */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:16,fontFamily:T.font}}>Milestone Timeline (Gantt View)</div>
      {/* year axis header */}
      <div style={{display:'flex',marginBottom:8}}>
        <div style={{width:240,flexShrink:0}}/>
        <div style={{flex:1,display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut,fontFamily:T.mono,paddingRight:50}}>
          {[2024,2026,2028,2030,2032,2035,2038,2040,2045,2050].map(y=><span key={y}>{y}</span>)}
        </div>
      </div>

      {/* milestone rows */}
      {filteredMs.map(m=>{
        const leftPct=Math.max(0,Math.min(97,((m.year-minYear)/yearSpan)*100));
        const barColor=m.status==='achieved'?T.green:m.status==='on-track'?T.sage:m.status==='at-risk'?T.amber:T.red;
        const isExpanded=expandedMs===m.id;

        return <div key={`${m.id}-${m.name}`}>
          <div onClick={()=>setExpandedMs(isExpanded?null:m.id)}
            style={{display:'flex',alignItems:'center',marginBottom:3,cursor:'pointer',padding:'5px 0',borderRadius:6,
              background:isExpanded?T.surfaceH:'transparent',transition:'background 0.15s'}}>
            <div style={{width:240,flexShrink:0,display:'flex',alignItems:'center',gap:6,paddingLeft:4}}>
              <span style={{...sBadge(SECTOR_COLORS_MAP[m.sector]||T.navy),fontSize:9,padding:'1px 6px'}}>{m.sector}</span>
              <span style={{fontSize:11,color:T.text,fontWeight:500,fontFamily:T.font,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:155}}>{m.name}</span>
              {m.custom&&<span style={{fontSize:9,color:T.gold,fontWeight:600}}>CUSTOM</span>}
            </div>
            <div style={{flex:1,position:'relative',height:22}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:22,background:T.bg,borderRadius:4}}/>
              {/* connector line from left to dot */}
              <div style={{position:'absolute',top:10,left:0,width:`${leftPct}%`,height:2,background:`${barColor}40`,borderRadius:1}}/>
              {/* milestone dot */}
              <div style={{position:'absolute',left:`${leftPct}%`,top:3,width:16,height:16,borderRadius:'50%',
                background:barColor,border:`2px solid ${T.surface}`,boxShadow:`0 0 0 1px ${barColor}40`,transform:'translateX(-8px)'}}/>
            </div>
            <div style={{width:60,flexShrink:0,textAlign:'right'}}><Badge status={m.status}/></div>
            <div style={{width:40,flexShrink:0,textAlign:'center',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{m.year}</div>
          </div>

          {/* expanded: affected companies */}
          {isExpanded && <div style={{marginLeft:240,marginBottom:12,padding:'10px 14px',background:T.bg,borderRadius:8,borderLeft:`3px solid ${barColor}`}}>
            <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:8,fontFamily:T.font}}>
              Affected Companies ({affectedCompanies(m).length})
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {affectedCompanies(m).map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:6,background:T.surface,fontSize:11,fontFamily:T.font,border:`1px solid ${T.border}`}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:c.alignment>=50?T.green:c.alignment>=25?T.amber:T.red}}/>
                  {c.name}
                  <span style={{color:T.textMut,fontFamily:T.mono,fontSize:10}}>{c.alignment.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>}
        </div>;
      })}

      {filteredMs.length===0 && <div style={{textAlign:'center',padding:40,color:T.textMut,fontSize:13}}>No milestones match the current filters.</div>}
    </div>

    {/* sector milestone coverage summary */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Sector Milestone Status Summary</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
        {SECTORS.map(sec=>{
          const secMs=allMs.filter(m=>m.sector===sec);
          const achieved=secMs.filter(m=>m.status==='achieved').length;
          const onTrack=secMs.filter(m=>m.status==='on-track').length;
          const atRisk=secMs.filter(m=>m.status==='at-risk').length;
          const missed=secMs.filter(m=>m.status==='missed').length;
          const total=secMs.length;
          const pctGreen=total?((achieved+onTrack)/total*100).toFixed(0):0;
          return <div key={sec} style={{padding:14,borderRadius:10,background:T.surfaceH,border:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{sec}</span>
              <span style={{fontSize:11,fontFamily:T.mono,color:+pctGreen>=60?T.green:T.amber}}>{pctGreen}%</span>
            </div>
            {/* stacked mini bar */}
            <div style={{display:'flex',height:6,borderRadius:3,overflow:'hidden',marginBottom:6}}>
              {achieved>0&&<div style={{flex:achieved,background:T.green}}/>}
              {onTrack>0&&<div style={{flex:onTrack,background:T.sage}}/>}
              {atRisk>0&&<div style={{flex:atRisk,background:T.amber}}/>}
              {missed>0&&<div style={{flex:missed,background:T.red}}/>}
            </div>
            <div style={{display:'flex',gap:8,fontSize:10,color:T.textMut,flexWrap:'wrap'}}>
              <span style={{color:T.green}}>{achieved} done</span>
              <span style={{color:T.sage}}>{onTrack} on-track</span>
              <span style={{color:T.amber}}>{atRisk} at-risk</span>
              {missed>0&&<span style={{color:T.red}}>{missed} missed</span>}
            </div>
            <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Next: {secMs.filter(m=>m.year>=2026&&m.status!=='achieved').sort((a,b)=>a.year-b.year)[0]?.name||'N/A'}</div>
          </div>;
        })}
      </div>
    </div>

    {/* upcoming milestones (next 5 years) */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Upcoming Milestones (2026\u20132032)</div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {allMs.filter(m=>m.year>=2026&&m.year<=2032&&m.status!=='achieved').sort((a,b)=>a.year-b.year).map(m=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',borderRadius:8,background:T.surfaceH}}>
            <span style={{fontSize:13,fontWeight:700,fontFamily:T.mono,color:T.navy,width:40}}>{m.year}</span>
            <span style={{...sBadge(SECTOR_COLORS_MAP[m.sector]||T.navy),fontSize:9}}>{m.sector}</span>
            <span style={{flex:1,fontSize:12,color:T.text,fontFamily:T.font}}>{m.name}</span>
            <Badge status={m.status}/>
            <span style={{fontSize:10,color:T.textMut}}>{COMPANIES.filter(c=>c.sector===m.sector).length} companies</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 4: PORTFOLIO PATHWAY
   ══════════════════════════════════════════════════ */
function PortfolioPathwayTab(){
  const initWeight=+(100/SECTORS.length).toFixed(1);
  const [sliders,setSliders]=useState(()=>{
    const s={};SECTORS.forEach(sec=>{s[sec]=initWeight;});return s;
  });
  const [showExport,setShowExport]=useState(false);

  const sectorStats=useMemo(()=>SECTORS.map(sec=>{
    const cos=COMPANIES.filter(c=>c.sector===sec);
    const avgAlign=+(cos.reduce((a,c)=>a+c.alignment,0)/cos.length).toFixed(1);
    const avgGap=+(cos.reduce((a,c)=>a+c.gap,0)/cos.length).toFixed(1);
    const avgCapex=+(cos.reduce((a,c)=>a+c.capexAlign,0)/cos.length).toFixed(0);
    return {sector:sec,avgAlign,avgGap,count:cos.length,avgCapex:+avgCapex,weight:sliders[sec]};
  }),[sliders]);

  const totalWeight=useMemo(()=>Object.values(sliders).reduce((a,b)=>a+b,0),[sliders]);

  const weightedAlignment=useMemo(()=>{
    if(totalWeight===0)return 0;
    return +(sectorStats.reduce((a,s)=>a+s.avgAlign*(sliders[s.sector]/totalWeight),0)).toFixed(1);
  },[sectorStats,sliders,totalWeight]);

  const baselineAlignment=useMemo(()=>{
    const eq=100/SECTORS.length;
    return +(sectorStats.reduce((a,s)=>a+s.avgAlign*(eq/100),0)).toFixed(1);
  },[sectorStats]);

  const topLaggards=useMemo(()=>[...COMPANIES].sort((a,b)=>a.alignment-b.alignment).slice(0,10),[]);
  const topLeaders=useMemo(()=>[...COMPANIES].sort((a,b)=>b.alignment-a.alignment).slice(0,5),[]);

  const handleSlider=(sec,val)=>setSliders(prev=>({...prev,[sec]:+val}));

  /* portfolio trajectory over time */
  const portfolioTrajectory=useMemo(()=>{
    const pts=[];
    for(let y=2020;y<=2050;y+=5){
      const t=(y-2020)/30;
      let portfolioVal=0;let pathwayVal=0;
      SECTORS.forEach(sec=>{
        const base=SECTOR_2020[sec];const tgt=SECTOR_2050_15[sec];
        const w=sliders[sec]/(totalWeight||1);
        const norm=base>0?((base-base*t*0.7)/base)*100:0;
        const pathNorm=base>0?((base-(base-tgt)*t)/base)*100:0;
        portfolioVal+=norm*w;
        pathwayVal+=pathNorm*w;
      });
      pts.push({year:y,portfolio:+portfolioVal.toFixed(1),pathway:+pathwayVal.toFixed(1)});
    }
    return pts;
  },[sliders,totalWeight]);

  const exportCSV=useCallback(()=>{
    const header='Company,Sector,CurrentIntensity,PathwayTarget,Gap%,AlignmentScore,Tier,CapExAlign%,SBTi,Region,Unit\n';
    const rows=COMPANIES.map(c=>`"${c.name}",${c.sector},${c.currentIntensity},${c.pathwayTarget},${c.gap},${c.alignment},${c.tier},${c.capexAlign},${c.sbtiStatus},${c.region},${c.unit}`).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='gfanz_alignment_report.csv';a.click();
    URL.revokeObjectURL(url);
    setShowExport(true);
    setTimeout(()=>setShowExport(false),3000);
  },[]);

  const improvement=+(weightedAlignment-baselineAlignment).toFixed(1);

  return <div>
    {/* KPI row */}
    <div style={{...sCard,display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:16}}>
      <KPI label="Portfolio Alignment" value={`${weightedAlignment}%`} sub={weightedAlignment>=60?'On Track':'Needs Improvement'}/>
      <KPI label="Baseline (Equal-Wt)" value={`${baselineAlignment}%`}/>
      <KPI label="Improvement" value={`${improvement>0?'+':''}${improvement}%`} sub="From reallocation"/>
      <KPI label="Companies" value={COMPANIES.length} sub={`${SECTORS.length} sectors`}/>
      <KPI label="Total Weight" value={`${totalWeight.toFixed(1)}%`} sub={totalWeight>100?'Over-allocated':''}/>
    </div>

    <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
      {/* sector alignment bar chart */}
      <div style={{...sCard,flex:1,minWidth:420}}>
        <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Sector Allocation vs Alignment</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorStats} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}} angle={-15} textAnchor="end" height={45}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}
              label={{value:'Avg Alignment %',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textMut}}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="avgAlign" name="Avg Alignment" radius={[6,6,0,0]}>
              {sectorStats.map((d,i)=><Cell key={i} fill={SECTOR_COLORS_MAP[d.sector]||T.navy}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* what-if sliders */}
      <div style={{...sCard,width:350,flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:4,fontFamily:T.font}}>What-If Reallocation</div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:14}}>Adjust sector weights to simulate alignment impact.</div>
        {SECTORS.map(sec=>{
          const stat=sectorStats.find(s=>s.sector===sec);
          return <div key={sec} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:2}}>
              <span style={{fontWeight:600}}>{sec}</span>
              <span style={{fontFamily:T.mono}}>{sliders[sec].toFixed(1)}%</span>
            </div>
            <input type="range" min={0} max={50} step={0.5} value={sliders[sec]}
              onChange={e=>handleSlider(sec,e.target.value)}
              style={{width:'100%',accentColor:SECTOR_COLORS_MAP[sec]||T.navy}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}>
              <span>Align: {stat?.avgAlign}%</span>
              <span>CapEx: {stat?.avgCapex}%</span>
              <span>{stat?.count} cos</span>
            </div>
          </div>;
        })}
        <div style={{marginTop:14,padding:12,borderRadius:8,background:improvement>=0?T.green+'10':T.red+'10',textAlign:'center'}}>
          <div style={{fontSize:11,color:T.textMut}}>Weighted Portfolio Alignment</div>
          <div style={{fontSize:24,fontWeight:700,color:improvement>=0?T.green:T.red,fontFamily:T.font}}>{weightedAlignment}%</div>
          <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{improvement>=0?'+':''}{improvement}% vs baseline</div>
        </div>
      </div>
    </div>

    {/* portfolio trajectory chart */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Portfolio Trajectory vs Pathway (Normalised Index)</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={portfolioTrajectory} margin={{top:5,right:20,left:10,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
          <YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,120]}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Line type="monotone" dataKey="pathway" stroke={T.navy} strokeWidth={2} strokeDasharray="6 3" dot={false} name="1.5\u00B0C Pathway"/>
          <Line type="monotone" dataKey="portfolio" stroke={T.gold} strokeWidth={2.5} dot={{r:3,fill:T.gold}} name="Your Portfolio"/>
          <Legend wrapperStyle={{fontSize:11}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* top leaders */}
    <div style={sCard}>
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10,fontFamily:T.font}}>Top 5 Aligned Leaders</div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        {topLeaders.map((c,i)=>(
          <div key={c.id} style={{padding:'10px 14px',borderRadius:10,background:T.green+'08',border:`1px solid ${T.green}30`,minWidth:140,flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{c.name}</div>
            <div style={{fontSize:11,color:T.textMut}}>{c.sector}</div>
            <div style={{fontSize:20,fontWeight:700,color:T.green,fontFamily:T.mono,marginTop:4}}>{c.alignment}%</div>
          </div>
        ))}
      </div>
    </div>

    {/* top laggards */}
    <div style={sCard}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:15,fontWeight:700,color:T.navy,fontFamily:T.font}}>Top 10 Laggards Dragging Portfolio Off-Track</div>
        <button onClick={exportCSV} style={sBtn(false)}>{showExport?'\u2713 Exported':'Export Alignment Report CSV'}</button>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['#','Company','Sector','Alignment','Gap %','Intensity','CapEx %','Tier'].map(h=><th key={h} style={sTh}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {topLaggards.map((c,i)=>(
              <tr key={c.id}>
                <td style={{...sTd,fontWeight:700,color:T.textMut,fontFamily:T.mono,width:30}}>{i+1}</td>
                <td style={{...sTd,fontWeight:600}}>{c.name}</td>
                <td style={sTd}><span style={sBadge(SECTOR_COLORS_MAP[c.sector]||T.navy)}>{c.sector}</span></td>
                <td style={{...sTd,fontFamily:T.mono,color:c.alignment<25?T.red:c.alignment<50?T.amber:T.text}}>{c.alignment}%</td>
                <td style={{...sTd,fontFamily:T.mono,color:T.red}}>{c.gap>0?'+':''}{c.gap}%</td>
                <td style={{...sTd,fontFamily:T.mono}}>{c.currentIntensity} <span style={{fontSize:10,color:T.textMut}}>{c.unit}</span></td>
                <td style={{...sTd,fontFamily:T.mono}}>{c.capexAlign}%</td>
                <td style={sTd}><TierBadge tier={c.tier}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* sector breakdown horizontal bars */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Sector Alignment Breakdown</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sectorStats} layout="vertical" margin={{top:5,right:20,left:90,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}
            label={{value:'Alignment Score',position:'insideBottom',offset:-2,style:{fontSize:10,fill:T.textMut}}}/>
          <YAxis type="category" dataKey="sector" tick={{fontSize:11,fill:T.textSec}} width={80}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="avgAlign" name="Avg Alignment %" radius={[0,6,6,0]}>
            {sectorStats.map((d,i)=><Cell key={i} fill={SECTOR_COLORS_MAP[d.sector]||T.navy}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* region breakdown */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>Regional Alignment Breakdown</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={(() => {
          const regions=['Europe','North America','Asia Pacific','Latin America','Middle East'];
          return regions.map(r=>{
            const cos=COMPANIES.filter(c=>c.region===r);
            const avg=cos.length?+(cos.reduce((a,c)=>a+c.alignment,0)/cos.length).toFixed(1):0;
            return {region:r,avgAlign:avg,count:cos.length};
          }).sort((a,b)=>b.avgAlign-a.avgAlign);
        })()} margin={{top:5,right:20,left:0,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="region" tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="avgAlign" name="Avg Alignment %" radius={[6,6,0,0]} fill={T.navyL}>
            {['Europe','North America','Asia Pacific','Latin America','Middle East'].map((_,i)=>(
              <Cell key={i} fill={[T.sage,T.navy,T.gold,T.amber,T.navyL][i]}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* SBTi status breakdown */}
    <div style={sCard}>
      <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>SBTi Commitment Status</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {['SBTi Validated','Targets Set','Committed','Not Committed'].map(status=>{
          const count=COMPANIES.filter(c=>c.sbtiStatus===status).length;
          const pct=((count/COMPANIES.length)*100).toFixed(0);
          const color=status==='SBTi Validated'?T.green:status==='Targets Set'?T.sage:status==='Committed'?T.amber:T.red;
          return <div key={status} style={{padding:14,borderRadius:10,background:color+'08',border:`1px solid ${color}30`,textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:700,color,fontFamily:T.mono}}>{count}</div>
            <div style={{fontSize:11,fontWeight:600,color:T.text,marginTop:2}}>{status}</div>
            <div style={{fontSize:10,color:T.textMut}}>{pct}% of portfolio</div>
          </div>;
        })}
      </div>
    </div>

    {/* methodology note */}
    <div style={{...sCard,background:T.surfaceH,borderLeft:`3px solid ${T.navy}`}}>
      <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.font}}>Methodology Note</div>
      <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
        Alignment scores are calculated using the Sectoral Decarbonisation Approach (SDA) methodology as recommended by the
        GFANZ Measuring Portfolio Alignment technical guidance. Company current intensities are benchmarked against
        IEA NZE 2050 sector-specific pathways. Gap percentages represent the deviation between a company&apos;s current
        emission intensity and its year-specific pathway target. CapEx alignment reflects the proportion of capital expenditure
        directed towards activities consistent with 1.5\u00B0C-aligned technologies. Portfolio-level alignment uses an ownership
        approach with AUM-weighted aggregation across all 8 tracked sectors. Data refreshed quarterly.
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   MAIN PAGE SHELL
   ══════════════════════════════════════════════════ */
const TABS=['Sector Pathways','Company Alignment','Milestone Monitor','Portfolio Pathway'];

export default function GfanzSectorPathwaysPage(){
  const [tab,setTab]=useState(0);

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      {/* header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:T.sage}}/>
          <span style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:1.2}}>EP-AL2</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0,fontFamily:T.font}}>GFANZ Sector Pathway Tracker</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0',maxWidth:660}}>
          Track corporate and portfolio alignment against GFANZ / IEA Net-Zero 2050 sector pathways across {SECTORS.length} high-emitting sectors and {COMPANIES.length} companies.
        </p>
      </div>

      {/* tab bar */}
      <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,
            color:tab===i?T.navy:T.textSec,background:'none',border:'none',
            borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',
            cursor:'pointer',fontFamily:T.font,transition:'all 0.15s',marginBottom:-2,
          }}>{t}</button>
        ))}
      </div>

      {/* tab content */}
      {tab===0 && <SectorPathwaysTab/>}
      {tab===1 && <CompanyAlignmentTab/>}
      {tab===2 && <MilestoneMonitorTab/>}
      {tab===3 && <PortfolioPathwayTab/>}

      {/* footer */}
      <div style={{marginTop:32,padding:'16px 0',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:T.textMut}}>
        <span>GFANZ Sector Pathway Tracker v1.0 \u2014 Data aligned to IEA Net Zero by 2050 Roadmap (2023 Update)</span>
        <span>Last updated: {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
      </div>
    </div>
  );
}
