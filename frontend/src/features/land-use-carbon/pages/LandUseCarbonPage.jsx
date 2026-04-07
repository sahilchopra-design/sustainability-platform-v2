import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,PieChart,Pie,LineChart,Line} from 'recharts';
import { EMISSION_FACTORS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const LAND_TYPES=['Cropland','Grassland','Forest','Wetland','Urban','Degraded','Peatland','Mangrove'];
const LAND_COLORS=[T.gold,T.sage,T.green,'#06b6d4',T.textMut,T.red,'#8b5cf6','#0e7490'];
const NBS_TYPES=['Afforestation','Reforestation','Wetland Restoration','Mangrove Restoration','Peatland Rewetting','Agroforestry','Silvopasture','Riparian Buffers'];
const IPCC_TIERS=['Tier 1 (Default)','Tier 2 (Country)','Tier 3 (Modelled)'];
const METHODOLOGIES=['VCS VM0007','VCS VM0042','Gold Standard AR','CDM AR-AM','Puro.earth Biochar','ACR Improved Forest','Plan Vivo','REDD+ Jurisdictional'];
const VINTAGES=[2020,2021,2022,2023,2024,2025,2026];
const COUNTRIES=['Brazil','Indonesia','Congo DRC','Peru','Colombia','Kenya','India','Myanmar','Mexico','Australia','Canada','Russia','USA','China','Malaysia','Tanzania','Madagascar','Cameroon','Papua NG','Costa Rica'];
const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];

const genParcels=(n)=>{
  const parcels=[];
  const names=['Amazon Block','Borneo Reserve','Congo Basin','Andes Corridor','Cerrado Edge','Sundarbans','Great Bear','Pantanal','Caatinga','Mekong Floodplain','Sierra Madre','Tundra Edge','Savanna Belt','Coastal Marsh','Delta Zone','Highland Terrace','Valley Floor','Plateau Ridge','Canyon Rim','Estuary Flats','Peat Dome','Tidal Flat','Montane Cloud','Riparian Strip','Karst Upland','Volcanic Slope','Alluvial Plain','Lake Shore','Island Atoll','Dune Coast','Glacial Moraine','Limestone Ridge','Sandstone Mesa','Basalt Plateau','Shale Basin','Granite Peak','Clay Bottom','Loess Hills','Laterite Shelf','Coral Cay'];
  for(let i=0;i<n;i++){
    const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5),s4=sr(i*17+7),s5=sr(i*19+9),s6=sr(i*23+11);
    const landType=LAND_TYPES[Math.floor(s1*LAND_TYPES.length)];
    const country=COUNTRIES[Math.floor(s2*COUNTRIES.length)];
    const area=Math.floor(50+s3*9950);
    const carbonStock=landType==='Forest'?Math.floor(150+s4*350):landType==='Peatland'?Math.floor(500+s4*1500):landType==='Mangrove'?Math.floor(300+s4*700):landType==='Wetland'?Math.floor(100+s4*400):landType==='Grassland'?Math.floor(30+s4*70):landType==='Cropland'?Math.floor(20+s4*60):landType==='Degraded'?Math.floor(5+s4*25):Math.floor(2+s4*15);
    const annualFlux=landType==='Forest'||landType==='Mangrove'||landType==='Wetland'?+(2+s5*8).toFixed(1):landType==='Peatland'?+(s5>0.4?3+s5*5:-2-s5*8).toFixed(1):landType==='Degraded'?+(-1-s5*5).toFixed(1):+(0.5+s5*3).toFixed(1);
    const priorLandUse=LAND_TYPES[Math.floor(sr(i*29+13)*LAND_TYPES.length)];
    const conversionYear=2000+Math.floor(sr(i*31+15)*25);
    const conversionEmissions=priorLandUse!==landType?Math.floor(50+sr(i*37+17)*500):0;
    const ipccTier=IPCC_TIERS[Math.floor(sr(i*41+19)*IPCC_TIERS.length)];
    const methodology=METHODOLOGIES[Math.floor(sr(i*43+21)*METHODOLOGIES.length)];
    const vintage=VINTAGES[Math.floor(sr(i*47+23)*VINTAGES.length)];
    const verified=sr(i*53+25)>0.35;
    const creditPrice=Math.floor(8+sr(i*59+27)*52);
    const eligibleArea=Math.floor(area*(0.3+sr(i*61+29)*0.6));
    const annualCredits=Math.floor(eligibleArea*annualFlux*0.7);
    const permanenceBuffer=Math.floor(10+sr(i*67+31)*20);
    const leakageDeduction=Math.floor(5+sr(i*71+33)*15);
    const projectedRevenue=Math.floor(annualCredits*creditPrice/1000);
    const soilCarbon=Math.floor(carbonStock*0.3+sr(i*73+35)*carbonStock*0.2);
    const biomassCarbon=carbonStock-soilCarbon;
    const yearlyStock=YEARS.map((_,yi)=>Math.floor(carbonStock+annualFlux*yi+sr(i*79+yi*13)*20));
    parcels.push({id:i,name:names[i%names.length],landType,country,area,carbonStock,annualFlux,priorLandUse,conversionYear,conversionEmissions,ipccTier,methodology,vintage,verified,creditPrice,eligibleArea,annualCredits:Math.abs(annualCredits),permanenceBuffer,leakageDeduction,projectedRevenue:Math.abs(projectedRevenue),soilCarbon,biomassCarbon,yearlyStock,
      netSink:annualFlux>0,
      stockPerHa:Math.floor(carbonStock),
      totalStock:Math.floor(carbonStock*area),
    });
  }
  return parcels;
};

const PARCELS=genParcels(40);

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Pill=({active,onClick,children})=><button onClick={onClick} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${active?T.gold:T.border}`,background:active?T.gold+'18':T.surface,color:active?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:active?600:400,cursor:'pointer',transition:'all 0.2s'}}>{children}</button>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',flex:1,minWidth:150}}><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:color||T.navy}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:(color||T.sage)+'18',color:color||T.sage,marginRight:4}}>{children}</span>;

const TABS=['Land Carbon Inventory','LULUCF Accounting','Nature-Based Solutions','Carbon Credit Potential'];
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899'];

export default function LandUseCarbonPage(){
  const [tab,setTab]=useState(0);
  const [landFilter,setLandFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [sortField,setSortField]=useState('carbonStock');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedParcel,setSelectedParcel]=useState(null);
  const [methFilter,setMethFilter]=useState('All');
  const [nbsType,setNbsType]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [page,setPage]=useState(0);

  const filtered=useMemo(()=>{
    let f=PARCELS;
    if(landFilter!=='All')f=f.filter(p=>p.landType===landFilter);
    if(countryFilter!=='All')f=f.filter(p=>p.country===countryFilter);
    if(methFilter!=='All')f=f.filter(p=>p.methodology===methFilter);
    if(searchTerm)f=f.filter(p=>p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir=sortDir==='asc'?1:-1;
    return [...f].sort((a,b)=>(a[sortField]>b[sortField]?dir:-dir));
  },[landFilter,countryFilter,methFilter,sortField,sortDir,searchTerm]);

  const stats=useMemo(()=>{
    const totalArea=filtered.reduce((a,p)=>a+p.area,0);
    const totalStock=filtered.reduce((a,p)=>a+p.totalStock,0);
    const avgStock=filtered.length?Math.floor(filtered.reduce((a,p)=>a+p.carbonStock,0)/filtered.length):0;
    const netFlux=+(filtered.reduce((a,p)=>a+p.annualFlux*p.area,0)/1000).toFixed(0);
    const sinkPct=filtered.length?Math.floor(filtered.filter(p=>p.netSink).length/filtered.length*100):0;
    const verifiedPct=filtered.length?Math.floor(filtered.filter(p=>p.verified).length/filtered.length*100):0;
    const totalCredits=filtered.reduce((a,p)=>a+p.annualCredits,0);
    const totalRevenue=filtered.reduce((a,p)=>a+p.projectedRevenue,0);
    return{totalArea,totalStock,avgStock,netFlux,sinkPct,verifiedPct,totalCredits,totalRevenue};
  },[filtered]);

  const landTypeBreakdown=useMemo(()=>LAND_TYPES.map((lt,lti)=>{const ps=filtered.filter(p=>p.landType===lt);return{name:lt,count:ps.length,totalArea:ps.reduce((a,p)=>a+p.area,0),avgStock:ps.length?Math.floor(ps.reduce((a,p)=>a+p.carbonStock,0)/ps.length):0,color:LAND_COLORS[lti]};}).filter(l=>l.count>0),[filtered]);

  const yearTrend=useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),totalStockMt:Math.floor(filtered.reduce((a,p)=>a+p.yearlyStock[yi]*p.area,0)/1000000)})),[filtered]);

  const handleSort=useCallback((f)=>{if(sortField===f)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortField(f);setSortDir('desc');}},[sortField]);
  const PAGE_SIZE=10;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const renderInventory=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search parcels..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13,width:200}}/>
        <select value={landFilter} onChange={e=>{setLandFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Land Types</option>{LAND_TYPES.map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        <select value={countryFilter} onChange={e=>{setCountryFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{filtered.length} parcels</span>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Total Area" value={(stats.totalArea/1000).toFixed(0)+'k ha'} sub="under management" color={T.navy}/>
        <KPI label="Total Carbon Stock" value={(stats.totalStock/1000000).toFixed(1)+'M tCO2e'} sub="all pools" color={T.green}/>
        <KPI label="Avg Stock/ha" value={stats.avgStock+' tCO2e'} sub="per hectare" color={T.sage}/>
        <KPI label="Net Annual Flux" value={(stats.netFlux>0?'+':'')+stats.netFlux+'k tCO2e'} sub={stats.netFlux>0?'net sink':'net source'} color={stats.netFlux>0?T.green:T.red}/>
        <KPI label="Sink %"value={stats.sinkPct+'%'} sub="net carbon sinks" color={T.sage}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Carbon Stock by Land Type (avg tCO2e/ha)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={landTypeBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="avgStock" name="Avg tCO2e/ha" radius={[4,4,0,0]}>{landTypeBreakdown.map((e,i)=><Cell key={i} fill={e.color||COLORS[i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Land Type Distribution (Area)</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={landTypeBreakdown} cx="50%" cy="50%" outerRadius={105} innerRadius={45} dataKey="totalArea" nameKey="name" label={({name,totalArea})=>`${name}: ${(totalArea/1000).toFixed(0)}k`} labelLine={false}>
                {landTypeBreakdown.map((e,i)=><Cell key={i} fill={e.color||COLORS[i]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Portfolio Carbon Stock Trend (Mt CO2e)</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={yearTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
            <Area type="monotone" dataKey="totalStockMt" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Total Stock Mt"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Parcel Registry</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
            <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {[{k:'name',l:'Parcel'},{k:'landType',l:'Type'},{k:'country',l:'Country'},{k:'area',l:'Area (ha)'},{k:'carbonStock',l:'Stock tCO2e/ha'},{k:'annualFlux',l:'Flux'},{k:'verified',l:'Verified'}].map(({k,l})=>(
                <th key={k} onClick={()=>handleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:sortField===k?T.navy:T.textSec,fontWeight:sortField===k?700:500,whiteSpace:'nowrap'}}>{l}{sortField===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
              ))}
            </tr></thead>
            <tbody>{paged.map(p=>(
              <tr key={p.id} onClick={()=>setSelectedParcel(p.id===selectedParcel?null:p.id)} style={{borderBottom:`1px solid ${T.borderL}`,background:p.id===selectedParcel?T.surfaceH:'transparent',cursor:'pointer'}}>
                <td style={{padding:'6px',fontWeight:500}}>{p.name}</td>
                <td style={{padding:'6px'}}><Badge color={LAND_COLORS[LAND_TYPES.indexOf(p.landType)]}>{p.landType}</Badge></td>
                <td style={{padding:'6px'}}>{p.country}</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{p.area.toLocaleString()}</td>
                <td style={{padding:'6px',fontFamily:T.mono,fontWeight:600}}>{p.carbonStock}</td>
                <td style={{padding:'6px',fontFamily:T.mono,color:p.annualFlux>0?T.green:T.red}}>{p.annualFlux>0?'+':''}{p.annualFlux}</td>
                <td style={{padding:'6px'}}>{p.verified?<Badge color={T.green}>Yes</Badge>:<Badge color={T.textMut}>No</Badge>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {totalPages>1&&<div style={{display:'flex',gap:8,marginTop:12,justifyContent:'center'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,fontFamily:T.font,fontSize:12,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>Prev</button>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>{page+1}/{totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,fontFamily:T.font,fontSize:12,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1}}>Next</button>
        </div>}
      </Card>

      {selectedParcel!==null&&(()=>{const p=PARCELS.find(x=>x.id===selectedParcel);if(!p)return null;return(
        <Card style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:16,color:T.navy}}>{p.name} — {p.landType}</div>
            <button onClick={()=>setSelectedParcel(null)} style={{background:'none',border:'none',color:T.textMut,cursor:'pointer',fontSize:18}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[{l:'Area',v:p.area.toLocaleString()+' ha'},{l:'Country',v:p.country},{l:'Carbon Stock',v:p.carbonStock+' tCO2e/ha'},{l:'Annual Flux',v:(p.annualFlux>0?'+':'')+p.annualFlux+' tCO2e/ha/yr'},{l:'Soil Carbon',v:p.soilCarbon+' tCO2e/ha'},{l:'Biomass Carbon',v:p.biomassCarbon+' tCO2e/ha'},{l:'Prior Land Use',v:p.priorLandUse},{l:'Conversion Year',v:p.conversionYear}].map(({l,v},i)=>(
              <div key={i}><span style={{color:T.textMut,fontSize:11}}>{l}</span><div style={{fontWeight:600,fontSize:13}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={YEARS.map((y,yi)=>({year:y.toString(),stock:p.yearlyStock[yi]}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/><Line type="monotone" dataKey="stock" stroke={T.green} strokeWidth={2} dot={{r:3}} name="tCO2e/ha"/>
              </LineChart>
            </ResponsiveContainer>
            <div>
              <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Carbon Pool Split</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={[{name:'Soil',value:p.soilCarbon},{name:'Biomass',value:p.biomassCarbon}]} cx="50%" cy="50%" outerRadius={70} innerRadius={30} dataKey="value"><Cell fill={T.gold}/><Cell fill={T.green}/></Pie><Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/><Legend/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      );})()}
    </div>
  );

  const renderLULUCF=()=>{
    const lulucfFlows=LAND_TYPES.map((lt,lti)=>{const ps=filtered.filter(p=>p.landType===lt);const netFlux=ps.reduce((a,p)=>a+p.annualFlux*p.area,0);return{name:lt,netFlux:Math.floor(netFlux/1000),emissions:ps.filter(p=>p.annualFlux<0).reduce((a,p)=>a+Math.abs(p.annualFlux)*p.area,0)/1000,removals:ps.filter(p=>p.annualFlux>0).reduce((a,p)=>a+p.annualFlux*p.area,0)/1000,color:LAND_COLORS[lti]};}).filter(l=>filtered.some(p=>p.landType===l.name));
    const conversionMatrix=LAND_TYPES.map(from=>({from,conversions:LAND_TYPES.map(to=>filtered.filter(p=>p.priorLandUse===from&&p.landType===to).length)}));
    const tierBreakdown=IPCC_TIERS.map(t=>({tier:t,count:filtered.filter(p=>p.ipccTier===t).length}));

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Net LULUCF Flux" value={(stats.netFlux>0?'+':'')+stats.netFlux+'k tCO2e'} sub="land sector balance" color={stats.netFlux>0?T.green:T.red}/>
          <KPI label="Conversion Events" value={filtered.filter(p=>p.priorLandUse!==p.landType).length} sub="land use changes" color={T.amber}/>
          <KPI label="Conversion Emissions" value={Math.floor(filtered.reduce((a,p)=>a+p.conversionEmissions,0)/1000)+'k tCO2e'} sub="from LUC" color={T.red}/>
          <KPI label="Tier 3 Coverage" value={Math.floor(filtered.filter(p=>p.ipccTier==='Tier 3 (Modelled)').length/filtered.length*100)+'%'} sub="highest accuracy" color={T.navy}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Net Emissions/Removals by Land Type (kt CO2e)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lulucfFlows}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="netFlux" name="Net kt CO2e" radius={[4,4,0,0]}>{lulucfFlows.map((e,i)=><Cell key={i} fill={e.netFlux>0?T.green:T.red}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>IPCC Tier Coverage</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={tierBreakdown} cx="50%" cy="50%" outerRadius={100} innerRadius={40} dataKey="count" nameKey="tier" label={({tier,count})=>`${tier.split(' ')[0]} ${tier.split(' ')[1]}: ${count}`} labelLine={false}>
                  {tierBreakdown.map((e,i)=><Cell key={i} fill={[T.textMut,T.amber,T.green][i]}/>)}
                </Pie>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/><Legend/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card style={{marginBottom:20}}>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Emissions vs Removals by Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={lulucfFlows}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Bar dataKey="removals" fill={T.green} name="Removals (kt)" radius={[4,4,0,0]}/>
              <Bar dataKey="emissions" fill={T.red} name="Emissions (kt)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Land Use Change Matrix (# parcels)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.mono,fontSize:11}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'6px',textAlign:'left',color:T.textSec,fontFamily:T.font}}>From \ To</th>
                {LAND_TYPES.map(t=><th key={t} style={{padding:'6px',textAlign:'center',color:T.textSec,fontFamily:T.font,fontSize:10}}>{t.slice(0,5)}</th>)}
              </tr></thead>
              <tbody>{conversionMatrix.filter(r=>r.conversions.some(v=>v>0)).map((r,ri)=>(
                <tr key={ri} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'4px 6px',fontFamily:T.font,fontWeight:500,fontSize:11}}>{r.from}</td>
                  {r.conversions.map((v,ci)=><td key={ci} style={{padding:'4px 6px',textAlign:'center',background:v>0?T.amber+'15':'transparent',color:v>0?T.navy:T.textMut,fontWeight:v>0?600:400}}>{v||'-'}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderNBS=()=>{
    const nbsData=NBS_TYPES.map((n,ni)=>({name:n.length>16?n.slice(0,16)+'...':n,fullName:n,seqRate:+(2+sr(ni*17+1)*12).toFixed(1),costPerHa:Math.floor(500+sr(ni*23+3)*4500),costPerTCO2:Math.floor(5+sr(ni*29+5)*35),cobenefits:Math.floor(3+sr(ni*31+7)*7),permanence:Math.floor(20+sr(ni*37+9)*80),scalability:['High','Medium','Low'][Math.floor(sr(ni*41+11)*3)],area:Math.floor(100+sr(ni*43+13)*5000)}));
    const costBenefitCurve=nbsData.map(n=>({name:n.name,abatement:n.seqRate,cost:n.costPerTCO2})).sort((a,b)=>a.cost-b.cost);

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Total NBS Potential" value={Math.floor(nbsData.reduce((a,n)=>a+n.seqRate*n.area,0)/1000)+'k tCO2e/yr'} sub="removal potential" color={T.green}/>
          <KPI label="Avg Cost" value={'$'+Math.floor(nbsData.reduce((a,n)=>a+n.costPerTCO2,0)/nbsData.length)+'/tCO2e'} sub="weighted average" color={T.navy}/>
          <KPI label="Highest Seq" value={nbsData.sort((a,b)=>b.seqRate-a.seqRate)[0].fullName} sub={nbsData.sort((a,b)=>b.seqRate-a.seqRate)[0].seqRate+' tCO2e/ha/yr'} color={T.sage}/>
          <KPI label="Co-benefits Score" value={Math.floor(nbsData.reduce((a,n)=>a+n.cobenefits,0)/nbsData.length)+'/10'} sub="biodiversity, water, livelihoods" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Sequestration Rate by NBS Type (tCO2e/ha/yr)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nbsData.sort((a,b)=>b.seqRate-a.seqRate)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="seqRate" fill={T.green} name="tCO2e/ha/yr" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Marginal Abatement Cost Curve ($/tCO2e)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBenefitCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="cost" fill={T.navy} name="$/tCO2e" radius={[4,4,0,0]}/>
                <Bar dataKey="abatement" fill={T.sage} name="tCO2e/ha/yr" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>NBS Comparison Matrix</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Solution','Seq Rate','Cost/ha','Cost/tCO2','Co-benefits','Permanence','Scalability','Area (ha)'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,whiteSpace:'nowrap'}}>{h}</th>)}
              </tr></thead>
              <tbody>{nbsData.map((n,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px',fontWeight:500}}>{n.fullName}</td>
                  <td style={{padding:'6px',fontFamily:T.mono,color:T.green}}>{n.seqRate}</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>${n.costPerHa.toLocaleString()}</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>${n.costPerTCO2}</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{n.cobenefits}/10</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{n.permanence}yr</td>
                  <td style={{padding:'6px'}}><Badge color={n.scalability==='High'?T.green:n.scalability==='Medium'?T.amber:T.red}>{n.scalability}</Badge></td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{n.area.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderCredits=()=>{
    const methBreakdown=METHODOLOGIES.map(m=>{const ps=filtered.filter(p=>p.methodology===m);return{name:m.length>18?m.slice(0,18)+'...':m,fullName:m,count:ps.length,totalCredits:ps.reduce((a,p)=>a+p.annualCredits,0),avgPrice:ps.length?Math.floor(ps.reduce((a,p)=>a+p.creditPrice,0)/ps.length):0};}).filter(m=>m.count>0).sort((a,b)=>b.totalCredits-a.totalCredits);
    const vintageBreakdown=VINTAGES.map(v=>({vintage:v.toString(),credits:filtered.filter(p=>p.vintage===v).reduce((a,p)=>a+p.annualCredits,0),avgPrice:Math.floor(15+VINTAGES.indexOf(v)*5+sr(v*17)*8)}));
    const creditPipeline=filtered.map(p=>({name:p.name.slice(0,14),eligible:p.eligibleArea,credits:p.annualCredits,revenue:p.projectedRevenue,verified:p.verified})).sort((a,b)=>b.credits-a.credits).slice(0,15);

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={methFilter} onChange={e=>setMethFilter(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All Methodologies</option>{METHODOLOGIES.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Total Annual Credits" value={(stats.totalCredits/1000).toFixed(0)+'k tCO2e'} sub="issuable credits" color={T.green}/>
          <KPI label="Projected Revenue" value={'$'+stats.totalRevenue.toLocaleString()+'k'} sub="annual" color={T.gold}/>
          <KPI label="Verified" value={stats.verifiedPct+'%'} sub="of parcels" color={T.sage}/>
          <KPI label="Avg Credit Price" value={'$'+(filtered.length?Math.floor(filtered.reduce((a,p)=>a+p.creditPrice,0)/filtered.length):0)} sub="per tCO2e" color={T.navy}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Credits by Methodology</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={methBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={120} tick={{fontSize:9,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="totalCredits" fill={T.sage} radius={[0,4,4,0]} name="Annual Credits tCO2e"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Vintage Year — Credits & Pricing</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vintageBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="vintage" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="credits" fill={T.green} name="Credits tCO2e" radius={[4,4,0,0]}/>
                <Bar dataKey="avgPrice" fill={T.gold} name="Avg $/tCO2e" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Credit Pipeline — Top 15 Parcels</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={creditPipeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Bar dataKey="credits" fill={T.green} name="Annual Credits" radius={[4,4,0,0]}/>
              <Bar dataKey="revenue" fill={T.gold} name="Revenue $k" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  return(
    <div style={{fontFamily:T.font,color:T.text,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:1}}>EP-AT4</span>
            <span style={{width:4,height:4,borderRadius:2,background:T.gold}}/>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FOOD SYSTEMS & AGRICULTURAL FINANCE</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Land Use & Carbon</h1>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Land carbon inventory, LULUCF accounting, nature-based solutions & carbon credit potential across {PARCELS.length} land parcels</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><Pill key={t} active={tab===i} onClick={()=>setTab(i)}>{t}</Pill>)}
        </div>

        {tab===0&&renderInventory()}
        {tab===1&&renderLULUCF()}
        {tab===2&&renderNBS()}
        {tab===3&&renderCredits()}
      </div>
    </div>
  );
}