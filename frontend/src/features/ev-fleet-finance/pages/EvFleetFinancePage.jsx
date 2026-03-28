import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Fleet Transition Planner','TCO Calculator','Charging Infrastructure','Battery Economics'];
const FLEET_TYPES=['Logistics','Delivery','Ride-hail','Municipal','Corporate','Rental'];
const VEHICLE_TYPES=['Sedan','SUV','Van','Light Truck','Heavy Truck','Bus','2-Wheeler','3-Wheeler','Compact','Minibus','Cargo Van','Pickup'];
const COUNTRIES=['USA','China','Germany','UK','France','India','Japan','South Korea','Norway','Netherlands','Canada','Australia','Brazil','Mexico','Sweden','Denmark','Thailand','Indonesia','Singapore','UAE'];
const CHEMISTRIES=['NMC','LFP','Solid-State','Sodium-Ion'];
const CHARGER_TYPES=['L2 AC','DC Fast 50kW','DC Fast 150kW','Ultra-Fast 350kW'];

const FLEET_NAMES=['GreenFleet Logistics','SwiftDeliver Co','UrbanRide Systems','Metro Transit Auth','TechCorp Fleet','EasyRent Vehicles','FastFreight Inc','CityLink Delivery','RideNow Mobility','Municipal Works Dept','GlobalTech Motors','QuickRent Cars','EcoHaul Transport','ParcelDash Express','ZipRide Services','County Road Dept','SkyNet Corporate','ValueRent Fleet','PrimeLogistics Co','SpeedPost Delivery','GoCity Rides','Regional Transit','Apex Industries','BudgetCar Rental','MegaShip Logistics','LastMile Solutions','CabConnect Plus','City Sanitation','CorpShuttle Inc','AutoLease Group','TransGlobal Freight','FreshDrop Delivery','RideShare Elite','Public Works Fleet','DataDrive Corp','FlexiRent Auto','OceanRoute Cargo','InstantPack Express','MetroMove Transit','Highway Dept Fleet','NexGen Industries','EcoRent Solutions','AlphaLogistics','RouteMaster Delivery','PeakRide Mobility','Water Authority','CloudTech Fleet','DriveEasy Rental','HeavyHaul Freight','SnapDeliver Co','WheelShare City','Fire Dept Fleet','SmartCorp Motors','RentAll Vehicles','Atlas Shipping','MicroDelivery Co','UrbanCab Network','Parks & Rec Fleet','TeraByte Corporate','GreenWheel Lease','Continental Cargo','BoxRunner Express','CityRide Plus','School Bus Fleet','DigiCorp Shuttle','ValueDrive Rental','PacificFreight Co','NightOwl Delivery','EliteRide Hailing','Waste Mgmt Fleet','StartupHub Cars','PremiumLease Auto','Nordic Logistics','AirDrop Courier','MetroCab Services','Port Authority','QuantumCorp Fleet','AutoShare Group','TruckLine Haul','RapidPack Delivery','SmartCity Transit','Energy Dept Fleet','FutureTech Motors','BreezeRent Cars','SilkRoad Freight','HyperLocal Express','ZoomRide Services','Utility Dept Fleet','CloudServe Fleet','WheelDeal Rental'];

const genFleetOps=()=>Array.from({length:90},(_, i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+7);const s3=sr(i*13+19);const s4=sr(i*17+23);
  const type=FLEET_TYPES[Math.floor(s*6)];
  const country=COUNTRIES[Math.floor(s2*20)];
  const fleetSize=Math.floor(50+s3*4950);
  const evPct=Math.floor(5+s4*55);
  const targetPct=Math.min(100,Math.floor(evPct+20+sr(i*19+5)*40));
  const annualKm=Math.floor(15000+sr(i*23+11)*85000);
  const fuelCost=Math.floor(500000+sr(i*29+13)*4500000);
  const evCost=Math.floor(fuelCost*(0.35+sr(i*31+17)*0.3));
  const tcoSavings=fuelCost-evCost+Math.floor(sr(i*37+19)*500000);
  const ice=Math.floor((100-evPct)*(0.5+sr(i*41+3)*0.4));
  const hybrid=100-evPct-ice>0?100-evPct-ice:0;
  const bev=Math.floor(evPct*(0.7+sr(i*43+7)*0.25));
  const fcev=evPct-bev;
  return {id:i,name:FLEET_NAMES[i],type,country,fleetSize,evPct,targetPct,annualKm,fuelCost,evCost,tcoSavings,ice,hybrid,bev,fcev};
});

const genProjects=()=>Array.from({length:150},(_, i)=>{
  const s=sr(i*7+101);const s2=sr(i*11+103);const s3=sr(i*13+107);
  const vType=VEHICLE_TYPES[Math.floor(s*12)];
  const annualKm=Math.floor(10000+s2*90000);
  const bevCapex=Math.floor(25000+s3*75000);
  const iceCapex=Math.floor(bevCapex*(0.5+sr(i*17+109)*0.3));
  const bevFuel=Math.floor(annualKm*0.04*(0.08+sr(i*19+111)*0.12));
  const iceFuel=Math.floor(annualKm*0.08*(1.2+sr(i*23+113)*0.8));
  const bevMaint=Math.floor(annualKm*0.02*(0.03+sr(i*29+117)*0.04));
  const iceMaint=Math.floor(annualKm*0.02*(0.06+sr(i*31+119)*0.06));
  const incentive=Math.floor(sr(i*37+121)*15000);
  const breakeven=Math.max(1,Math.min(10,Math.round(1+(bevCapex-iceCapex-incentive)/(iceFuel-bevFuel+iceMaint-bevMaint+1))));
  const co2Saved=Math.floor(annualKm*0.15*(0.8+sr(i*41+123)*0.4));
  const abateCost=Math.floor((bevCapex-iceCapex-incentive)/(co2Saved/1000+1));
  return {id:i,vehicle:vType,annualKm,bevCapex,iceCapex,bevFuel,iceFuel,bevMaint,iceMaint,incentive,breakeven,co2Saved,abateCost,country:COUNTRIES[Math.floor(sr(i*43+127)*20)]};
});

const genChargingSites=()=>Array.from({length:40},(_, i)=>{
  const s=sr(i*7+201);const s2=sr(i*11+203);const s3=sr(i*13+207);
  const cType=CHARGER_TYPES[Math.floor(s*4)];
  const chargerCount=Math.floor(4+s2*46);
  const util=Math.floor(25+s3*60);
  const uptime=Math.floor(88+sr(i*17+209)*11);
  const revenue=Math.floor(chargerCount*util*365*(0.3+sr(i*19+211)*0.5));
  const capex=Math.floor(chargerCount*(15000+sr(i*23+213)*85000));
  const opex=Math.floor(capex*0.08*(0.8+sr(i*29+217)*0.4));
  const irr=Math.floor(5+sr(i*31+219)*20);
  const payback=Math.max(2,Math.min(12,Math.round(capex/(revenue-opex+1))));
  const peakLoad=Math.floor(chargerCount*(20+sr(i*37+221)*130));
  const v2gRev=Math.floor(revenue*(0.05+sr(i*41+223)*0.15));
  const region=['North America','Europe','Asia Pacific','Middle East','Latin America','Africa'][Math.floor(sr(i*43+227)*6)];
  return {id:i,name:`Site-${String(i+1).padStart(2,'0')} ${region}`,type:cType,chargerCount,utilization:util,uptime,revenue,capex,opex,irr,payback,peakLoad,v2gRev,region};
});

const fmt=v=>{if(v>=1e9)return `$${(v/1e9).toFixed(1)}B`;if(v>=1e6)return `$${(v/1e6).toFixed(1)}M`;if(v>=1e3)return `$${(v/1e3).toFixed(0)}K`;return `$${v}`;};
const fmtn=v=>{if(v>=1e6)return `${(v/1e6).toFixed(1)}M`;if(v>=1e3)return `${(v/1e3).toFixed(1)}K`;return `${v}`;};

const Card=({children,style})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,...style}}>{children}</div>;
const Badge=({children,color=T.sage})=><span style={{background:color+'18',color,fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,fontFamily:T.font}}>{children}</span>;
const Stat=({label,value,sub,color=T.navy})=><div style={{textAlign:'center'}}><div style={{fontSize:24,fontWeight:700,color,fontFamily:T.font}}>{value}</div><div style={{fontSize:11,color:T.textMut,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textSec,marginTop:1}}>{sub}</div>}</div>;

const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:8,fontSize:11,fontFamily:T.font}}>
    <div style={{fontWeight:600,color:T.navy,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.navy}}>{p.name}: {typeof p.value==='number'&&p.value>1000?fmtn(p.value):p.value}</div>)}
  </div>;
};

/* ======================== TAB 1: Fleet Transition Planner ======================== */
const FleetTransitionTab=({fleetOps})=>{
  const [filterType,setFilterType]=useState('All');
  const [filterCountry,setFilterCountry]=useState('All');
  const [sortCol,setSortCol]=useState('tcoSavings');
  const [sortDir,setSortDir]=useState(-1);
  const [selected,setSelected]=useState(null);
  const [compareIds,setCompareIds]=useState([]);
  const [showWizard,setShowWizard]=useState(false);
  const [wizStep,setWizStep]=useState(0);
  const [wizMix,setWizMix]=useState({bev:60,phev:20,fcev:20});
  const [wizTimeline,setWizTimeline]=useState(5);
  const [wizFinance,setWizFinance]=useState('Lease');

  const filtered=useMemo(()=>{
    let d=[...fleetOps];
    if(filterType!=='All')d=d.filter(r=>r.type===filterType);
    if(filterCountry!=='All')d=d.filter(r=>r.country===filterCountry);
    d.sort((a,b)=>(a[sortCol]>b[sortCol]?1:-1)*sortDir);
    return d;
  },[fleetOps,filterType,filterCountry,sortCol,sortDir]);

  const toggleCompare=(id)=>{
    setCompareIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length<3?[...prev,id]:prev);
  };

  const selOp=selected!==null?fleetOps.find(f=>f.id===selected):null;
  const timeline=selOp?Array.from({length:8},(_, y)=>{
    const yr=2024+y;const prog=Math.min(selOp.targetPct,selOp.evPct+((selOp.targetPct-selOp.evPct)/7)*y);
    return {year:yr,ICE:Math.max(0,100-prog-5),Hybrid:5,BEV:Math.floor(prog*0.75),FCEV:Math.ceil(prog*0.25)};
  }):[];

  const tcoWaterfall=selOp?[
    {name:'Fuel Savings',value:Math.floor(selOp.fuelCost-selOp.evCost)},
    {name:'Maintenance',value:Math.floor(selOp.fleetSize*800)},
    {name:'Residual Value',value:Math.floor(selOp.fleetSize*1200)},
    {name:'Capex Premium',value:-Math.floor(selOp.fleetSize*3500)},
    {name:'Incentives',value:Math.floor(selOp.fleetSize*sr(selOp.id*7)*2000)},
    {name:'Net TCO',value:selOp.tcoSavings}
  ]:[];

  const compOps=compareIds.map(id=>fleetOps.find(f=>f.id===id)).filter(Boolean);

  const colH={cursor:'pointer',userSelect:'none',padding:'8px 6px',fontSize:11,fontWeight:600,color:T.textSec,borderBottom:`2px solid ${T.border}`,textAlign:'left',whiteSpace:'nowrap'};
  const sortBy=(col)=>{if(sortCol===col)setSortDir(d=>d*-1);else{setSortCol(col);setSortDir(-1);}};

  return <div style={{display:'grid',gridTemplateColumns:selected!==null?'1fr 420px':'1fr',gap:16}}>
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
          <option value="All">All Types</option>{FLEET_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
          <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11,color:T.textMut}}>{filtered.length} operators</span>
        {compareIds.length>0&&<button onClick={()=>setCompareIds([])} style={{marginLeft:'auto',padding:'5px 12px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surfaceH,fontSize:11,fontFamily:T.font,color:T.navy,cursor:'pointer'}}>Clear Compare ({compareIds.length})</button>}
        <button onClick={()=>{setShowWizard(true);setWizStep(0);}} style={{padding:'5px 14px',borderRadius:6,border:'none',background:T.navy,color:'#fff',fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>Build Transition Plan</button>
      </div>

      {compareIds.length>=2&&<Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Operator Comparison</div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${compOps.length},1fr)`,gap:12}}>
          {compOps.map(op=><div key={op.id} style={{padding:10,borderRadius:8,background:T.surfaceH}}>
            <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{op.name}</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Fleet: {fmtn(op.fleetSize)} | EV: {op.evPct}% | Target: {op.targetPct}%</div>
            <div style={{fontSize:11,color:T.green,marginTop:2}}>TCO Savings: {fmt(op.tcoSavings)}</div>
          </div>)}
        </div>
        <div style={{height:180,marginTop:10}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compOps.map(o=>({name:o.name.slice(0,15),fuelCost:o.fuelCost,evCost:o.evCost,savings:o.tcoSavings}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} tickFormatter={v=>fmt(v)}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="fuelCost" name="Fuel Cost" fill={T.red} radius={[3,3,0,0]}/>
              <Bar dataKey="evCost" name="EV Cost" fill={T.green} radius={[3,3,0,0]}/>
              <Bar dataKey="savings" name="TCO Savings" fill={T.gold} radius={[3,3,0,0]}/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>}

      <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH}}>
            <th style={colH}></th>
            <th style={colH} onClick={()=>sortBy('name')}>Operator{sortCol==='name'?(sortDir===1?' ^':' v'):''}</th>
            <th style={colH}>Type</th>
            <th style={colH}>Country</th>
            <th style={{...colH,textAlign:'right'}} onClick={()=>sortBy('fleetSize')}>Fleet{sortCol==='fleetSize'?(sortDir===1?' ^':' v'):''}</th>
            <th style={{...colH,textAlign:'right'}} onClick={()=>sortBy('evPct')}>EV %{sortCol==='evPct'?(sortDir===1?' ^':' v'):''}</th>
            <th style={{...colH,textAlign:'right'}}>Target %</th>
            <th style={{...colH,textAlign:'right'}} onClick={()=>sortBy('annualKm')}>Annual km{sortCol==='annualKm'?(sortDir===1?' ^':' v'):''}</th>
            <th style={{...colH,textAlign:'right'}} onClick={()=>sortBy('fuelCost')}>Fuel Cost{sortCol==='fuelCost'?(sortDir===1?' ^':' v'):''}</th>
            <th style={{...colH,textAlign:'right'}}>EV Cost</th>
            <th style={{...colH,textAlign:'right'}} onClick={()=>sortBy('tcoSavings')}>TCO Savings{sortCol==='tcoSavings'?(sortDir===1?' ^':' v'):''}</th>
          </tr></thead>
          <tbody>{filtered.slice(0,50).map(r=><tr key={r.id} onClick={()=>setSelected(r.id===selected?null:r.id)} style={{cursor:'pointer',background:r.id===selected?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'6px',textAlign:'center'}}><input type="checkbox" checked={compareIds.includes(r.id)} onChange={e=>{e.stopPropagation();toggleCompare(r.id);}} style={{cursor:'pointer'}}/></td>
            <td style={{padding:'6px',fontWeight:600,color:T.navy,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td>
            <td style={{padding:'6px'}}><Badge color={r.type==='Logistics'?T.navyL:r.type==='Delivery'?T.sage:r.type==='Ride-hail'?T.gold:r.type==='Municipal'?T.teal:r.type==='Corporate'?'#7c3aed':T.amber}>{r.type}</Badge></td>
            <td style={{padding:'6px',color:T.textSec}}>{r.country}</td>
            <td style={{padding:'6px',textAlign:'right',fontFamily:T.mono}}>{fmtn(r.fleetSize)}</td>
            <td style={{padding:'6px',textAlign:'right'}}><span style={{color:r.evPct>30?T.green:r.evPct>15?T.amber:T.red,fontWeight:600}}>{r.evPct}%</span></td>
            <td style={{padding:'6px',textAlign:'right',fontFamily:T.mono}}>{r.targetPct}%</td>
            <td style={{padding:'6px',textAlign:'right',fontFamily:T.mono}}>{fmtn(r.annualKm)}</td>
            <td style={{padding:'6px',textAlign:'right',fontFamily:T.mono}}>{fmt(r.fuelCost)}</td>
            <td style={{padding:'6px',textAlign:'right',fontFamily:T.mono}}>{fmt(r.evCost)}</td>
            <td style={{padding:'6px',textAlign:'right',fontWeight:600,color:T.green}}>{fmt(r.tcoSavings)}</td>
          </tr>)}</tbody>
        </table>
      </div>

      {showWizard&&<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowWizard(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:12,padding:28,width:520,maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 40px rgba(0,0,0,0.15)'}}>
          <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:4}}>Build Transition Plan</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:16}}>Step {wizStep+1} of 3</div>
          <div style={{display:'flex',gap:4,marginBottom:18}}>{[0,1,2].map(s=><div key={s} style={{flex:1,height:3,borderRadius:2,background:s<=wizStep?T.navy:T.border}}/>)}</div>

          {wizStep===0&&<div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Fleet Mix Target</div>
            {['bev','phev','fcev'].map(k=><div key={k} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:4}}><span>{k.toUpperCase()}</span><span>{wizMix[k]}%</span></div>
              <input type="range" min={0} max={100} value={wizMix[k]} onChange={e=>{const v=Number(e.target.value);setWizMix(p=>{const o={...p,[k]:v};const rem=100-v;const others=Object.keys(o).filter(x=>x!==k);const total=others.reduce((s,x)=>s+o[x],0);if(total>0)others.forEach(x=>o[x]=Math.round(o[x]/total*rem));else others.forEach((x,i)=>o[x]=Math.round(rem/others.length));return o;});}} style={{width:'100%'}}/>
            </div>)}
          </div>}
          {wizStep===1&&<div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Transition Timeline</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:4}}><span>Years to Complete</span><span>{wizTimeline} years</span></div>
            <input type="range" min={2} max={10} value={wizTimeline} onChange={e=>setWizTimeline(Number(e.target.value))} style={{width:'100%'}}/>
            <div style={{marginTop:14,height:140}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({length:wizTimeline+1},(_, y)=>({year:2025+y,BEV:Math.round(wizMix.bev*(y/wizTimeline)),PHEV:Math.round(wizMix.phev*(y/wizTimeline)),FCEV:Math.round(wizMix.fcev*(y/wizTimeline)),ICE:Math.round(100-((wizMix.bev+wizMix.phev+wizMix.fcev)*(y/wizTimeline)))}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Area type="monotone" dataKey="ICE" stackId="1" stroke={T.textMut} fill={T.textMut+'40'}/>
                  <Area type="monotone" dataKey="PHEV" stackId="1" stroke={T.amber} fill={T.amber+'40'}/>
                  <Area type="monotone" dataKey="BEV" stackId="1" stroke={T.green} fill={T.green+'40'}/>
                  <Area type="monotone" dataKey="FCEV" stackId="1" stroke={T.navyL} fill={T.navyL+'40'}/>
                  <Tooltip content={<ChartTip/>}/><Legend wrapperStyle={{fontSize:10}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>}
          {wizStep===2&&<div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Financing Model</div>
            {['Lease','Loan','Cash Purchase','Green Bond'].map(f=><label key={f} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:6,border:`1px solid ${wizFinance===f?T.navy:T.border}`,background:wizFinance===f?T.navy+'0a':T.surface,marginBottom:6,cursor:'pointer',fontSize:12,color:T.navy}}>
              <input type="radio" name="finance" checked={wizFinance===f} onChange={()=>setWizFinance(f)}/>{f}
            </label>)}
            <Card style={{marginTop:12,background:T.surfaceH}}>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Plan Summary</div>
              <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>
                Mix: {wizMix.bev}% BEV / {wizMix.phev}% PHEV / {wizMix.fcev}% FCEV<br/>
                Timeline: {wizTimeline} years | Finance: {wizFinance}<br/>
                Est. Capex: {fmt(Math.floor(wizMix.bev*8500+wizMix.phev*5200+wizMix.fcev*12000)*100)}<br/>
                Est. Annual Savings: {fmt(Math.floor((wizMix.bev*2100+wizMix.phev*1100+wizMix.fcev*1800)*100/wizTimeline))}
              </div>
            </Card>
          </div>}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}>
            <button onClick={()=>wizStep>0?setWizStep(wizStep-1):setShowWizard(false)} style={{padding:'7px 18px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,fontSize:12,fontFamily:T.font,cursor:'pointer',color:T.textSec}}>{wizStep===0?'Cancel':'Back'}</button>
            <button onClick={()=>wizStep<2?setWizStep(wizStep+1):setShowWizard(false)} style={{padding:'7px 18px',borderRadius:6,border:'none',background:T.navy,color:'#fff',fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>{wizStep===2?'Generate Plan':'Next'}</button>
          </div>
        </div>
      </div>}
    </div>

    {selOp&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:12}}>
          <div><div style={{fontSize:14,fontWeight:700,color:T.navy}}>{selOp.name}</div><div style={{fontSize:11,color:T.textSec}}>{selOp.type} | {selOp.country}</div></div>
          <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <Stat label="Fleet Size" value={fmtn(selOp.fleetSize)}/>
          <Stat label="Current EV %" value={`${selOp.evPct}%`} color={selOp.evPct>30?T.green:T.amber}/>
          <Stat label="Target 2030" value={`${selOp.targetPct}%`} color={T.navyL}/>
          <Stat label="TCO Savings" value={fmt(selOp.tcoSavings)} color={T.green}/>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:10}}>Fleet Composition</div>
        <div style={{height:160}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={[{name:'ICE',value:selOp.ice},{name:'Hybrid',value:selOp.hybrid},{name:'BEV',value:selOp.bev},{name:'FCEV',value:selOp.fcev}]} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({name,value})=>`${name} ${value}%`} labelLine={false} style={{fontSize:10}}>
              <Cell fill={T.textMut}/><Cell fill={T.amber}/><Cell fill={T.green}/><Cell fill={T.navyL}/>
            </Pie><Legend wrapperStyle={{fontSize:10}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:10}}>Transition Timeline</div>
        <div style={{height:180}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Area type="monotone" dataKey="ICE" stackId="1" stroke={T.textMut} fill={T.textMut+'40'}/><Area type="monotone" dataKey="Hybrid" stackId="1" stroke={T.amber} fill={T.amber+'40'}/><Area type="monotone" dataKey="BEV" stackId="1" stroke={T.green} fill={T.green+'40'}/><Area type="monotone" dataKey="FCEV" stackId="1" stroke={T.navyL} fill={T.navyL+'40'}/>
              <Tooltip content={<ChartTip/>}/><Legend wrapperStyle={{fontSize:10}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:10}}>TCO Waterfall</div>
        <div style={{height:180}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tcoWaterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}} tickFormatter={v=>fmt(v)}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="value" radius={[3,3,0,0]}>{tcoWaterfall.map((e,i)=><Cell key={i} fill={e.value>=0?T.green:T.red}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Charging Infra Needs</div>
        <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>
          <div>L2 Chargers Required: <span style={{fontWeight:600,color:T.navy}}>{Math.floor(selOp.fleetSize*selOp.targetPct/100*0.3)}</span></div>
          <div>DC Fast Chargers: <span style={{fontWeight:600,color:T.navy}}>{Math.floor(selOp.fleetSize*selOp.targetPct/100*0.08)}</span></div>
          <div>Est. Infra Investment: <span style={{fontWeight:600,color:T.gold}}>{fmt(Math.floor(selOp.fleetSize*selOp.targetPct/100*0.3*8000+selOp.fleetSize*selOp.targetPct/100*0.08*65000))}</span></div>
          <div>Grid Upgrade Needed: <span style={{fontWeight:600,color:selOp.fleetSize>2000?T.red:T.green}}>{selOp.fleetSize>2000?'Yes - High Capacity':'Minimal'}</span></div>
        </div>
      </Card>
    </div>}
  </div>;
};

/* ======================== TAB 2: TCO Calculator ======================== */
const TcoCalculatorTab=({projects})=>{
  const [vType,setVType]=useState('Sedan');
  const [annualKm,setAnnualKm]=useState(25000);
  const [elecPrice,setElecPrice]=useState(0.12);
  const [fuelPrice,setFuelPrice]=useState(1.5);
  const [bevPrice,setBevPrice]=useState(42000);
  const [incentive,setIncentive]=useState(7500);
  const [degradation,setDegradation]=useState(2);
  const [maintBev,setMaintBev]=useState(0.04);
  const [maintIce,setMaintIce]=useState(0.09);
  const [insurance,setInsurance]=useState(1800);
  const [residualBev,setResidualBev]=useState(35);
  const [residualIce,setResidualIce]=useState(30);
  const [searchTerm,setSearchTerm]=useState('');

  const icePrice=Math.floor(bevPrice*0.65);
  const phevPrice=Math.floor(bevPrice*0.85);

  const tcoData=useMemo(()=>Array.from({length:10},(_, y)=>{
    const yr=y+1;
    const bevTotal=(bevPrice-incentive)+yr*(annualKm*elecPrice*0.18*(1+degradation*yr/100))+yr*(annualKm*maintBev)+yr*insurance-(bevPrice*(residualBev/100)*Math.pow(0.85,yr));
    const iceTotal=icePrice+yr*(annualKm*fuelPrice*0.08)+yr*(annualKm*maintIce)+yr*(insurance*1.05)-(icePrice*(residualIce/100)*Math.pow(0.82,yr));
    const phevTotal=phevPrice+yr*(annualKm*((elecPrice*0.12)+(fuelPrice*0.03)))+yr*(annualKm*(maintBev+maintIce)/2)+yr*insurance-(phevPrice*((residualBev+residualIce)/200)*Math.pow(0.83,yr));
    return {year:`Year ${yr}`,BEV:Math.round(bevTotal),ICE:Math.round(iceTotal),PHEV:Math.round(phevTotal)};
  }),[bevPrice,icePrice,phevPrice,incentive,annualKm,elecPrice,fuelPrice,degradation,maintBev,maintIce,insurance,residualBev,residualIce]);

  const breakeven=tcoData.findIndex(d=>d.ICE>d.BEV)+1||'10+';

  const tornadoData=useMemo(()=>{
    const base=tcoData[4]?.BEV||0;
    const params=[
      {name:'Electricity Price',low:base*0.85,high:base*1.18},
      {name:'Purchase Price',low:base*0.88,high:base*1.15},
      {name:'Annual km',low:base*0.82,high:base*1.2},
      {name:'Incentives',low:base*1.08,high:base*0.9},
      {name:'Battery Degrad.',low:base*0.95,high:base*1.1},
      {name:'Fuel Price',low:base*1.02,high:base*0.94},
      {name:'Maintenance',low:base*0.96,high:base*1.06},
      {name:'Residual Value',low:base*1.05,high:base*0.92}
    ];
    return params.map(p=>({name:p.name,low:Math.round(p.low-base),high:Math.round(p.high-base)})).sort((a,b)=>Math.abs(b.high-b.low)-Math.abs(a.high-a.low));
  },[tcoData]);

  const filteredProjects=useMemo(()=>{
    let d=projects;
    if(searchTerm)d=d.filter(p=>p.vehicle.toLowerCase().includes(searchTerm.toLowerCase())||p.country.toLowerCase().includes(searchTerm.toLowerCase()));
    return d.slice(0,30);
  },[projects,searchTerm]);

  const carbonData=VEHICLE_TYPES.slice(0,8).map((v,i)=>({name:v,abateCost:Math.floor(50+sr(i*31+301)*350),co2Saved:Math.floor(2+sr(i*37+303)*18)}));

  const Slider=({label,value,onChange,min,max,step=1,fmt:f})=><div style={{marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}><span>{label}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{f?f(value):value}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{width:'100%'}}/>
  </div>;

  return <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:16}}>
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>TCO Inputs</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:T.textSec,marginBottom:3}}>Vehicle Type</div>
          <select value={vType} onChange={e=>setVType(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
            {VEHICLE_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <Slider label="Annual km" value={annualKm} onChange={setAnnualKm} min={5000} max={100000} step={1000} fmt={v=>fmtn(v)+' km'}/>
        <Slider label="Electricity Price" value={elecPrice} onChange={setElecPrice} min={0.05} max={0.4} step={0.01} fmt={v=>`$${v.toFixed(2)}/kWh`}/>
        <Slider label="Fuel Price" value={fuelPrice} onChange={setFuelPrice} min={0.5} max={3.0} step={0.1} fmt={v=>`$${v.toFixed(1)}/L`}/>
        <Slider label="BEV Purchase Price" value={bevPrice} onChange={setBevPrice} min={20000} max={120000} step={1000} fmt={v=>fmt(v)}/>
        <Slider label="Incentives" value={incentive} onChange={setIncentive} min={0} max={25000} step={500} fmt={v=>fmt(v)}/>
        <Slider label="Battery Degradation" value={degradation} onChange={setDegradation} min={0.5} max={5} step={0.5} fmt={v=>`${v}%/yr`}/>
        <Slider label="BEV Maintenance" value={maintBev} onChange={setMaintBev} min={0.01} max={0.1} step={0.005} fmt={v=>`$${v.toFixed(3)}/km`}/>
        <Slider label="ICE Maintenance" value={maintIce} onChange={setMaintIce} min={0.03} max={0.15} step={0.005} fmt={v=>`$${v.toFixed(3)}/km`}/>
        <Slider label="Insurance" value={insurance} onChange={setInsurance} min={500} max={5000} step={100} fmt={v=>fmt(v)+'/yr'}/>
        <Slider label="BEV Residual %" value={residualBev} onChange={setResidualBev} min={10} max={60} step={1} fmt={v=>`${v}%`}/>
        <Slider label="ICE Residual %" value={residualIce} onChange={setResidualIce} min={10} max={50} step={1} fmt={v=>`${v}%`}/>
      </Card>
    </div>

    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <Card><Stat label="Breakeven Year" value={breakeven} color={typeof breakeven==='number'&&breakeven<=5?T.green:T.amber}/></Card>
        <Card><Stat label="5-Year BEV TCO" value={fmt(tcoData[4]?.BEV||0)} color={T.navy}/></Card>
        <Card><Stat label="5-Year ICE TCO" value={fmt(tcoData[4]?.ICE||0)} color={T.textSec}/></Card>
        <Card><Stat label="5-Year Savings" value={fmt(Math.max(0,(tcoData[4]?.ICE||0)-(tcoData[4]?.BEV||0)))} color={T.green}/></Card>
      </div>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>TCO Comparison (BEV vs ICE vs PHEV)</div>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tcoData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} tickFormatter={v=>fmt(v)}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="BEV" stroke={T.green} strokeWidth={2.5} dot={{r:3}}/>
              <Line type="monotone" dataKey="ICE" stroke={T.red} strokeWidth={2} dot={{r:3}} strokeDasharray="5 5"/>
              <Line type="monotone" dataKey="PHEV" stroke={T.amber} strokeWidth={2} dot={{r:3}} strokeDasharray="3 3"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Sensitivity Analysis (Tornado)</div>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tornadoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={100}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="low" name="Low Scenario" fill={T.green+'80'} stackId="a"/><Bar dataKey="high" name="High Scenario" fill={T.red+'80'} stackId="b"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Carbon Abatement Cost by Vehicle Type</div>
        <div style={{height:200}}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="co2Saved" name="CO2 Saved (t/yr)" tick={{fontSize:10,fill:T.textSec}} label={{value:'CO2 Saved (t/yr)',position:'bottom',fontSize:10,fill:T.textSec}}/><YAxis dataKey="abateCost" name="Abatement Cost" tick={{fontSize:10,fill:T.textSec}} label={{value:'$/tCO2',angle:-90,position:'left',fontSize:10,fill:T.textSec}}/>
              <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:8,fontSize:11,fontFamily:T.font}}><div style={{fontWeight:600}}>{payload[0]?.payload?.name}</div><div>CO2: {payload[0]?.payload?.co2Saved} t/yr</div><div>Cost: ${payload[0]?.payload?.abateCost}/tCO2</div></div>:null}/>
              <Scatter data={carbonData} fill={T.sage}>{carbonData.map((_,i)=><Cell key={i} fill={[T.navy,T.sage,T.gold,T.navyL,T.green,T.amber,T.teal,T.red][i%8]}/>)}</Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Pre-Calculated Projects (150)</div>
          <input placeholder="Search vehicle/country..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font,width:180}}/>
        </div>
        <div style={{overflowX:'auto',maxHeight:260}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.font}}>
            <thead><tr style={{background:T.surfaceH}}>
              {['Vehicle','Country','Annual km','BEV Capex','ICE Capex','Incentive','Breakeven','CO2 Saved','$/tCO2'].map(h=><th key={h} style={{padding:'6px 4px',fontSize:10,fontWeight:600,color:T.textSec,borderBottom:`1px solid ${T.border}`,textAlign:'right',whiteSpace:'nowrap'}}>{h}</th>)}
            </tr></thead>
            <tbody>{filteredProjects.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'4px',fontWeight:600,color:T.navy,textAlign:'left'}}>{p.vehicle}</td>
              <td style={{padding:'4px',color:T.textSec,textAlign:'right'}}>{p.country}</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmtn(p.annualKm)}</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmt(p.bevCapex)}</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmt(p.iceCapex)}</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmt(p.incentive)}</td>
              <td style={{padding:'4px',textAlign:'right',fontWeight:600,color:p.breakeven<=4?T.green:p.breakeven<=7?T.amber:T.red}}>{p.breakeven} yr</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmtn(p.co2Saved)} kg</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>${p.abateCost}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>;
};

/* ======================== TAB 3: Charging Infrastructure ======================== */
const ChargingInfraTab=({sites})=>{
  const [selSite,setSelSite]=useState(null);
  const [investCapex,setInvestCapex]=useState(500000);
  const [investUtil,setInvestUtil]=useState(45);
  const [investRate,setInvestRate]=useState(0.35);

  const regions=[...new Set(sites.map(s=>s.region))];
  const regionSummary=regions.map(r=>{
    const rs=sites.filter(s=>s.region===r);
    return {region:r,sites:rs.length,chargers:rs.reduce((s,x)=>s+x.chargerCount,0),avgUtil:Math.round(rs.reduce((s,x)=>s+x.utilization,0)/rs.length),gap:Math.floor(sr(regions.indexOf(r)*17+401)*40+10)};
  });

  const demandForecast=Array.from({length:8},(_, y)=>{
    const yr=2024+y;const growth=Math.pow(1.35,y);
    return {year:yr,demand:Math.round(100*growth),supply:Math.round(100*(1+y*0.25)),gap:Math.max(0,Math.round(100*growth-100*(1+y*0.25)))};
  });

  const investIrr=Math.round(investUtil*investRate*365*10/(investCapex+1)*100-25);
  const investPayback=Math.max(1,Math.round(investCapex/(investUtil*investRate*365*10+1)));
  const investNpv=Math.round(investUtil*investRate*365*10*7-investCapex);

  const site=selSite!==null?sites.find(s=>s.id===selSite):null;

  return <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
      <Card><Stat label="Total Sites" value={sites.length}/></Card>
      <Card><Stat label="Total Chargers" value={sites.reduce((s,x)=>s+x.chargerCount,0)}/></Card>
      <Card><Stat label="Avg Utilization" value={`${Math.round(sites.reduce((s,x)=>s+x.utilization,0)/sites.length)}%`} color={T.sage}/></Card>
      <Card><Stat label="Total Revenue" value={fmt(sites.reduce((s,x)=>s+x.revenue,0))} color={T.green}/></Card>
      <Card><Stat label="V2G Revenue" value={fmt(sites.reduce((s,x)=>s+x.v2gRev,0))} color={T.gold}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Charging Demand vs Supply Forecast</div>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demandForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="demand" name="Demand (GWh)" stroke={T.red} fill={T.red+'20'} strokeWidth={2}/>
              <Area type="monotone" dataKey="supply" name="Supply (GWh)" stroke={T.green} fill={T.green+'20'} strokeWidth={2}/>
              <Area type="monotone" dataKey="gap" name="Gap (GWh)" stroke={T.amber} fill={T.amber+'30'} strokeWidth={1.5} strokeDasharray="4 4"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Infrastructure Coverage by Region</div>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="region" tick={{fontSize:9,fill:T.textSec}} angle={-15} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="chargers" name="Chargers" fill={T.navy} radius={[3,3,0,0]}/>
              <Bar dataKey="gap" name="Gap %" fill={T.red+'80'} radius={[3,3,0,0]}/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Charging Sites (40)</div>
        <div style={{overflowX:'auto',maxHeight:320}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.font}}>
            <thead><tr style={{background:T.surfaceH}}>
              {['Site','Type','Chargers','Util %','Uptime','Revenue','Capex','IRR','Payback','Peak kW','V2G Rev'].map(h=><th key={h} style={{padding:'6px 4px',fontSize:10,fontWeight:600,color:T.textSec,borderBottom:`1px solid ${T.border}`,textAlign:'right',whiteSpace:'nowrap'}}>{h}</th>)}
            </tr></thead>
            <tbody>{sites.map(s=><tr key={s.id} onClick={()=>setSelSite(s.id===selSite?null:s.id)} style={{cursor:'pointer',background:s.id===selSite?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'4px',fontWeight:600,color:T.navy,textAlign:'left',whiteSpace:'nowrap'}}>{s.name}</td>
              <td style={{padding:'4px',textAlign:'right'}}><Badge color={s.type.includes('Ultra')?T.green:s.type.includes('150')?T.navyL:s.type.includes('50')?T.gold:T.textSec}>{s.type}</Badge></td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{s.chargerCount}</td>
              <td style={{padding:'4px',textAlign:'right',fontWeight:600,color:s.utilization>60?T.green:s.utilization>35?T.amber:T.red}}>{s.utilization}%</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{s.uptime}%</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmt(s.revenue)}</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmt(s.capex)}</td>
              <td style={{padding:'4px',textAlign:'right',fontWeight:600,color:s.irr>12?T.green:s.irr>8?T.amber:T.red}}>{s.irr}%</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{s.payback} yr</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono}}>{fmtn(s.peakLoad)}</td>
              <td style={{padding:'4px',textAlign:'right',fontFamily:T.mono,color:T.gold}}>{fmt(s.v2gRev)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </Card>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Investment Calculator</div>
          <div style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}><span>Capex</span><span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>{fmt(investCapex)}</span></div>
            <input type="range" min={100000} max={5000000} step={50000} value={investCapex} onChange={e=>setInvestCapex(Number(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}><span>Utilization %</span><span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>{investUtil}%</span></div>
            <input type="range" min={10} max={90} value={investUtil} onChange={e=>setInvestUtil(Number(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}><span>Rate $/kWh</span><span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>${investRate.toFixed(2)}</span></div>
            <input type="range" min={0.1} max={0.8} step={0.05} value={investRate} onChange={e=>setInvestRate(Number(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            <div style={{textAlign:'center',padding:8,borderRadius:6,background:T.surfaceH}}>
              <div style={{fontSize:16,fontWeight:700,color:investIrr>12?T.green:T.amber}}>{investIrr}%</div><div style={{fontSize:10,color:T.textMut}}>IRR</div>
            </div>
            <div style={{textAlign:'center',padding:8,borderRadius:6,background:T.surfaceH}}>
              <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{investPayback} yr</div><div style={{fontSize:10,color:T.textMut}}>Payback</div>
            </div>
            <div style={{textAlign:'center',padding:8,borderRadius:6,background:T.surfaceH}}>
              <div style={{fontSize:16,fontWeight:700,color:investNpv>0?T.green:T.red}}>{fmt(investNpv)}</div><div style={{fontSize:10,color:T.textMut}}>NPV</div>
            </div>
          </div>
        </Card>

        {site&&<Card>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>{site.name}</div>
          <div style={{fontSize:11,color:T.textSec,lineHeight:1.8}}>
            <div>Type: <span style={{fontWeight:600,color:T.navy}}>{site.type}</span></div>
            <div>Chargers: <span style={{fontWeight:600}}>{site.chargerCount}</span> | Uptime: <span style={{fontWeight:600}}>{site.uptime}%</span></div>
            <div>Peak Load: <span style={{fontWeight:600,color:T.amber}}>{fmtn(site.peakLoad)} kW</span></div>
            <div>Revenue: <span style={{fontWeight:600,color:T.green}}>{fmt(site.revenue)}</span></div>
            <div>V2G Potential: <span style={{fontWeight:600,color:T.gold}}>{fmt(site.v2gRev)}</span></div>
            <div>Grid Impact: <span style={{fontWeight:600,color:site.peakLoad>3000?T.red:T.green}}>{site.peakLoad>3000?'High':'Moderate'}</span></div>
          </div>
        </Card>}

        <Card>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Grid Impact Summary</div>
          <div style={{height:150}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sites.slice(0,10).map(s=>({name:s.name.slice(0,10),peak:s.peakLoad}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-30} textAnchor="end" height={45}/><YAxis tick={{fontSize:9,fill:T.textSec}}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="peak" name="Peak kW" radius={[3,3,0,0]}>{sites.slice(0,10).map((s,i)=><Cell key={i} fill={s.peakLoad>3000?T.red:s.peakLoad>1500?T.amber:T.green}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  </div>;
};

/* ======================== TAB 4: Battery Economics ======================== */
const BatteryEconomicsTab=()=>{
  const [selChem,setSelChem]=useState(null);
  const [secondLifeKwh,setSecondLifeKwh]=useState(60);
  const [secondLifeDegrad,setSecondLifeDegrad]=useState(25);

  const chemData=[
    {name:'NMC',energyDensity:85,costKwh:128,cycleLife:72,safety:60,tempRange:65,supplyRisk:70,desc:'Nickel Manganese Cobalt - high energy density, mainstream choice'},
    {name:'LFP',energyDensity:55,costKwh:95,cycleLife:90,safety:90,tempRange:55,supplyRisk:40,desc:'Lithium Iron Phosphate - safe, long cycle life, cost leader'},
    {name:'Solid-State',energyDensity:95,costKwh:180,cycleLife:95,safety:95,tempRange:85,supplyRisk:55,desc:'Next-gen solid electrolyte - high performance, pre-commercial'},
    {name:'Sodium-Ion',energyDensity:40,costKwh:65,cycleLife:65,safety:85,tempRange:80,supplyRisk:20,desc:'Sodium-ion - abundant materials, low cost, emerging tech'}
  ];

  const radarKeys=['energyDensity','costKwh','cycleLife','safety','tempRange','supplyRisk'];
  const radarLabels=['Energy Density','Cost/kWh','Cycle Life','Safety','Temp Range','Supply Risk'];

  const priceTrajectory=Array.from({length:16},(_, y)=>{
    const yr=2020+y;
    return {year:yr,NMC:Math.round(180*Math.pow(0.92,y)),LFP:Math.round(140*Math.pow(0.91,y)),SolidState:yr<2026?null:Math.round(350*Math.pow(0.88,y-6)),SodiumIon:yr<2023?null:Math.round(120*Math.pow(0.9,y-3))};
  });

  const minerals=[
    {name:'Lithium',exposure:85,price:Math.floor(15000+sr(501)*10000),trend:'Volatile',suppliers:'Australia, Chile, China'},
    {name:'Cobalt',exposure:72,price:Math.floor(30000+sr(503)*20000),trend:'Declining share',suppliers:'DRC, Indonesia, Australia'},
    {name:'Nickel',exposure:65,price:Math.floor(18000+sr(505)*8000),trend:'Growing demand',suppliers:'Indonesia, Philippines, Russia'},
    {name:'Manganese',exposure:35,price:Math.floor(1500+sr(507)*500),trend:'Stable',suppliers:'South Africa, Gabon, Australia'},
    {name:'Graphite',exposure:55,price:Math.floor(800+sr(509)*400),trend:'Tightening',suppliers:'China, Mozambique, Brazil'},
    {name:'Phosphate',exposure:40,price:Math.floor(200+sr(511)*100),trend:'Stable',suppliers:'China, Morocco, USA'}
  ];

  const recyclingEcon=[
    {name:'Collection',cost:15,revenue:0},{name:'Transport',cost:8,revenue:0},{name:'Disassembly',cost:25,revenue:5},
    {name:'Shredding',cost:12,revenue:0},{name:'Hydromet Processing',cost:35,revenue:0},{name:'Material Recovery',cost:10,revenue:65},
    {name:'Refining',cost:18,revenue:30},{name:'Net',cost:0,revenue:Math.max(0,100-123)}
  ];

  const secondLifeValue=Math.round(secondLifeKwh*(100-secondLifeDegrad)/100*85);
  const secondLifeRevenue=Math.round(secondLifeValue*0.6);
  const secondLifeYears=Math.round(8*(100-secondLifeDegrad)/100);

  const sel=selChem!==null?chemData.find(c=>c.name===selChem):null;

  const passportItems=[
    {req:'Carbon Footprint Declaration',status:'Mandatory Feb 2025',compliance:75},
    {req:'Recycled Content Targets',status:'Mandatory 2027',compliance:45},
    {req:'Due Diligence (Supply Chain)',status:'Mandatory 2025',compliance:60},
    {req:'Performance & Durability',status:'Mandatory 2026',compliance:55},
    {req:'Collection & Recycling Targets',status:'Mandatory 2027',compliance:40},
    {req:'Digital Battery Passport',status:'Mandatory Feb 2027',compliance:30},
    {req:'Hazardous Substance Limits',status:'Mandatory 2025',compliance:80},
    {req:'Second Life Requirements',status:'Mandatory 2027',compliance:35}
  ];

  const handleExport=useCallback(()=>{
    const header='Chemistry,Energy Density,Cost/kWh,Cycle Life,Safety,Temp Range,Supply Risk\n';
    const rows=chemData.map(c=>`${c.name},${c.energyDensity},${c.costKwh},${c.cycleLife},${c.safety},${c.tempRange},${c.supplyRisk}`).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='ev_fleet_battery_analysis.csv';a.click();URL.revokeObjectURL(url);
  },[]);

  return <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      {chemData.map(c=><Card key={c.name} style={{cursor:'pointer',border:`1px solid ${selChem===c.name?T.navy:T.border}`,background:selChem===c.name?T.navy+'08':T.surface}} onClick={()=>setSelChem(selChem===c.name?null:c.name)}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>{c.name}</div>
        <div style={{fontSize:10,color:T.textSec,marginBottom:8,lineHeight:1.4}}>{c.desc}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:10}}>
          <div>Cost: <span style={{fontWeight:600,color:T.green}}>${c.costKwh}/kWh</span></div>
          <div>Density: <span style={{fontWeight:600}}>{c.energyDensity}</span></div>
          <div>Cycles: <span style={{fontWeight:600}}>{c.cycleLife}</span></div>
          <div>Safety: <span style={{fontWeight:600,color:c.safety>80?T.green:T.amber}}>{c.safety}</span></div>
        </div>
      </Card>)}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Chemistry Comparison (Radar)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {chemData.map((c,ci)=>{
            const colors=[T.navy,T.sage,T.gold,T.navyL];
            return <div key={c.name} style={{display:'flex',flexDirection:'column',gap:3}}>
              <div style={{fontSize:11,fontWeight:600,color:colors[ci]}}>{c.name}</div>
              {radarLabels.map((l,li)=><div key={l} style={{fontSize:10,color:T.textSec}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>{l}</span><span style={{fontWeight:600}}>{c[radarKeys[li]]}</span></div>
                <div style={{height:3,borderRadius:2,background:T.border,marginTop:1}}>
                  <div style={{height:3,borderRadius:2,background:colors[ci],width:`${c[radarKeys[li]]}%`}}/>
                </div>
              </div>)}
            </div>;
          })}
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Battery Price Trajectory ($/kWh)</div>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,400]}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="NMC" stroke={T.navy} strokeWidth={2} dot={{r:2}} connectNulls/>
              <Line type="monotone" dataKey="LFP" stroke={T.sage} strokeWidth={2} dot={{r:2}} connectNulls/>
              <Line type="monotone" dataKey="SolidState" stroke={T.gold} strokeWidth={2} dot={{r:2}} strokeDasharray="5 5" connectNulls/>
              <Line type="monotone" dataKey="SodiumIon" stroke={T.navyL} strokeWidth={2} dot={{r:2}} strokeDasharray="3 3" connectNulls/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Second-Life Value Calculator</div>
        <div style={{marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}><span>Original Capacity</span><span style={{fontFamily:T.mono,fontWeight:600}}>{secondLifeKwh} kWh</span></div>
          <input type="range" min={20} max={120} value={secondLifeKwh} onChange={e=>setSecondLifeKwh(Number(e.target.value))} style={{width:'100%'}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}><span>Degradation</span><span style={{fontFamily:T.mono,fontWeight:600}}>{secondLifeDegrad}%</span></div>
          <input type="range" min={10} max={50} value={secondLifeDegrad} onChange={e=>setSecondLifeDegrad(Number(e.target.value))} style={{width:'100%'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,textAlign:'center'}}>
          <div style={{padding:8,borderRadius:6,background:T.surfaceH}}>
            <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{Math.round(secondLifeKwh*(100-secondLifeDegrad)/100)} kWh</div>
            <div style={{fontSize:9,color:T.textMut}}>Remaining</div>
          </div>
          <div style={{padding:8,borderRadius:6,background:T.surfaceH}}>
            <div style={{fontSize:16,fontWeight:700,color:T.green}}>${secondLifeRevenue}</div>
            <div style={{fontSize:9,color:T.textMut}}>2nd Life Value</div>
          </div>
          <div style={{padding:8,borderRadius:6,background:T.surfaceH}}>
            <div style={{fontSize:16,fontWeight:700,color:T.sage}}>{secondLifeYears} yr</div>
            <div style={{fontSize:9,color:T.textMut}}>2nd Life Span</div>
          </div>
        </div>
        <div style={{fontSize:10,color:T.textMut,marginTop:8}}>Applications: Grid storage, backup power, low-speed EVs</div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Critical Mineral Exposure</div>
        <div style={{overflowY:'auto',maxHeight:260}}>
          {minerals.map(m=><div key={m.name} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{m.name}</span>
              <span style={{fontSize:10,color:T.textSec}}>${fmtn(m.price)}/t</span>
            </div>
            <div style={{height:4,borderRadius:2,background:T.border,marginBottom:3}}>
              <div style={{height:4,borderRadius:2,background:m.exposure>70?T.red:m.exposure>50?T.amber:T.green,width:`${m.exposure}%`}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.textMut}}>
              <span>Exposure: {m.exposure}%</span><span>{m.trend}</span>
            </div>
            <div style={{fontSize:9,color:T.textSec,marginTop:1}}>{m.suppliers}</div>
          </div>)}
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Recycling Economics</div>
        <div style={{height:200}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recyclingEcon.slice(0,7)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="cost" name="Cost $/kWh" fill={T.red+'80'} radius={[3,3,0,0]}/>
              <Bar dataKey="revenue" name="Revenue $/kWh" fill={T.green+'80'} radius={[3,3,0,0]}/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{fontSize:10,color:T.textSec,marginTop:6}}>
          Total Cost: <span style={{fontWeight:600,color:T.red}}>$123/kWh</span> | Recovery: <span style={{fontWeight:600,color:T.green}}>$100/kWh</span> | Net: <span style={{fontWeight:600,color:T.red}}>-$23/kWh</span>
        </div>
      </Card>
    </div>

    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:T.navy}}>EU Battery Regulation - Battery Passport Compliance</div>
          <div style={{fontSize:11,color:T.textSec}}>Readiness assessment across key requirements</div>
        </div>
        <button onClick={handleExport} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer',color:T.navy}}>Export Fleet Analysis CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {passportItems.map(p=><div key={p.req} style={{padding:10,borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceH}}>
          <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>{p.req}</div>
          <div style={{fontSize:9,color:T.textMut,marginBottom:6}}>{p.status}</div>
          <div style={{height:5,borderRadius:3,background:T.border}}>
            <div style={{height:5,borderRadius:3,background:p.compliance>70?T.green:p.compliance>50?T.amber:T.red,width:`${p.compliance}%`,transition:'width 0.3s'}}/>
          </div>
          <div style={{fontSize:10,fontWeight:600,color:p.compliance>70?T.green:p.compliance>50?T.amber:T.red,textAlign:'right',marginTop:3}}>{p.compliance}%</div>
        </div>)}
      </div>
    </Card>
  </div>;
};

/* ======================== MAIN PAGE ======================== */
export default function EvFleetFinancePage(){
  const [tab,setTab]=useState(0);

  const fleetOps=useMemo(()=>genFleetOps(),[]);
  const projects=useMemo(()=>genProjects(),[]);
  const sites=useMemo(()=>genChargingSites(),[]);

  const totalFleet=fleetOps.reduce((s,f)=>s+f.fleetSize,0);
  const avgEv=Math.round(fleetOps.reduce((s,f)=>s+f.evPct,0)/fleetOps.length);
  const totalSavings=fleetOps.reduce((s,f)=>s+f.tcoSavings,0);
  const totalChargers=sites.reduce((s,x)=>s+x.chargerCount,0);

  return <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 28px',color:T.text}}>
    {/* Header */}
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
        <span style={{fontSize:20}}>&#9889;</span>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>EV Fleet Finance & Electrification Analytics</h1>
        <Badge color={T.sage}>EP-AN3</Badge>
      </div>
      <p style={{fontSize:12,color:T.textSec,margin:0,maxWidth:700}}>Electric vehicle fleet transition economics, charging infrastructure planning, battery lifecycle modelling, and fleet TCO optimisation across 90 operators and 20 countries.</p>
    </div>

    {/* KPI Strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
      <Card><Stat label="Fleet Operators" value="90"/></Card>
      <Card><Stat label="Total Fleet" value={fmtn(totalFleet)}/></Card>
      <Card><Stat label="Avg EV %" value={`${avgEv}%`} color={avgEv>25?T.green:T.amber}/></Card>
      <Card><Stat label="Total TCO Savings" value={fmt(totalSavings)} color={T.green}/></Card>
      <Card><Stat label="Charging Sites" value={`${sites.length}`} color={T.navyL}/></Card>
      <Card><Stat label="Total Chargers" value={fmtn(totalChargers)} color={T.gold}/></Card>
    </div>

    {/* Tabs */}
    <div style={{display:'flex',gap:0,marginBottom:18,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:12,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2,transition:'all 0.2s'}}>{t}</button>)}
    </div>

    {/* Tab Content */}
    {tab===0&&<FleetTransitionTab fleetOps={fleetOps}/>}
    {tab===1&&<TcoCalculatorTab projects={projects}/>}
    {tab===2&&<ChargingInfraTab sites={sites}/>}
    {tab===3&&<BatteryEconomicsTab/>}
  </div>;
}
