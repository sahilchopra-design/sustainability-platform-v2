import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,PieChart,Pie,LineChart,Line} from 'recharts';
import { EMISSION_FACTORS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const FOOD_CATEGORIES=['Beef & Cattle','Dairy','Poultry & Eggs','Pork','Seafood & Aquaculture','Grains & Cereals','Fruits & Vegetables','Nuts & Seeds','Sugar & Confectionery','Beverages','Palm Oil & Oils','Processed Foods','Frozen Foods','Bakery & Snacks','Spices & Condiments'];
const EMISSION_STAGES=['Farm/Agriculture','Processing','Transport','Packaging','Retail','Consumer/Waste'];
const STAGE_COLORS=[T.red,T.amber,T.navy,T.gold,T.sage,T.textMut];
const COUNTRIES=['USA','Brazil','EU','China','India','Australia','UK','Japan','Canada','Mexico','Thailand','Indonesia','Argentina','New Zealand','South Africa'];
const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];
const PROTEIN_SOURCES=['Beef','Lamb','Pork','Chicken','Eggs','Tofu','Tempeh','Seitan','Pea Protein','Mycoprotein','Cultured Meat','Insects'];
const FLAG_SECTORS=['Beef','Dairy','Rice','Palm Oil','Soy','Cocoa','Coffee','Rubber','Timber','Wheat'];
const WASTE_STAGES=['Farm','Post-Harvest','Processing','Distribution','Retail','Food Service','Household'];

const genCompanies=(n)=>{
  const names=['NutriGlobal','FreshCo','AgriFoods Inc','MeatPack Corp','DairyWorld','GreenHarvest','OceanBounty','CerealKing','SugarTrade','BevCo Intl','PalmOil Holdings','FrozenFresh','BakeMaster','SpiceTrade','ProFood Group','NaturalChoice','HarvestPrime','FoodChain Ltd','GlobalGrain','SeaFresh Corp','VeggieFirst','ProteinPlus','OrganicCo','FarmDirect','CropLink','MilkStream','EggNation','NutsWorld','CondimentCo','SnackVenture','TropicalFoods','GrainBelt','MeatFree Inc','AquaFarms','FieldToFork','PantryPrime','FoodTech Global','PurePlant','LivestockCo','RiceMasters','CocoaTrade','CoffeeBeans Ltd','SoilToSoul','BioFood Corp','NourishCo','PeakFresh','TasteFirst','FarmFutures','CleanProtein','AgriPrime Corp','GreenBite','PureFarms','EcoHarvest','SeedLink','PlantBase Inc','TerraFoods','Sustain Foods','NovaNutrition','ProHarvest','GlobeFoods'];
  const companies=[];
  for(let i=0;i<n;i++){
    const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5),s4=sr(i*17+7),s5=sr(i*19+9);
    const category=FOOD_CATEGORIES[Math.floor(s1*FOOD_CATEGORIES.length)];
    const country=COUNTRIES[Math.floor(s2*COUNTRIES.length)];
    const revenue=+(0.5+s3*25).toFixed(1);
    const totalEmissions=Math.floor(200+s4*9800);
    const intensity=+(0.5+s5*8.5).toFixed(2);
    const stageBreakdown=EMISSION_STAGES.map((_,si)=>{const raw=sr(i*23+si*11);return si===0?Math.floor(raw*40+30):Math.floor(raw*20+5);});
    const stageTotal=stageBreakdown.reduce((a,v)=>a+v,0);
    const stageNorm=stageBreakdown.map(v=>Math.floor(v/stageTotal*100));
    const yearlyEmissions=YEARS.map((_,yi)=>Math.floor(totalEmissions*(1-yi*0.02+sr(i*29+yi*13)*0.05)));
    const scope3Cat1=Math.floor(totalEmissions*0.6+sr(i*31)*totalEmissions*0.2);
    const flagTarget=sr(i*37+11)>0.4;
    const flagProgress=flagTarget?Math.floor(sr(i*41+13)*60+10):0;
    const deforestationFree=sr(i*43+15)>0.5;
    const proteinIntensity=+(2+sr(i*47+17)*18).toFixed(1);
    const wasteRate=+(5+sr(i*53+19)*25).toFixed(1);
    const sbtiStatus=['Committed','Target Set','No Target','In Progress'][Math.floor(sr(i*59+21)*4)];
    const waterIntensity=Math.floor(500+sr(i*61+23)*4500);
    const landUse=+(0.5+sr(i*67+25)*15).toFixed(1);
    const packagingRecycled=Math.floor(sr(i*71+27)*80);
    const supplierCount=Math.floor(50+sr(i*73+29)*950);
    const traceability=Math.floor(30+sr(i*79+31)*70);
    companies.push({id:i,name:names[i%names.length],category,country,revenue,totalEmissions,intensity,stageBreakdown:stageNorm,yearlyEmissions,scope3Cat1,flagTarget,flagProgress,deforestationFree,proteinIntensity,wasteRate,sbtiStatus,waterIntensity,landUse,packagingRecycled,supplierCount,traceability,
      riskLevel:intensity>5?'High':intensity>2.5?'Medium':'Low',
      reductionTarget:flagTarget?Math.floor(20+sr(i*83+33)*30):0,
      targetYear:flagTarget?2030+Math.floor(sr(i*89+35)*5):null,
    });
  }
  return companies;
};

const COMPANIES=genCompanies(60);

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Pill=({active,onClick,children})=><button onClick={onClick} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${active?T.gold:T.border}`,background:active?T.gold+'18':T.surface,color:active?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:active?600:400,cursor:'pointer',transition:'all 0.2s'}}>{children}</button>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',flex:1,minWidth:150}}><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:color||T.navy}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:(color||T.sage)+'18',color:color||T.sage,marginRight:4}}>{children}</span>;

const TABS=['Food System Emissions','Protein Transition','Food Loss & Waste','SBTi FLAG Targets'];
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#e879f9','#14b8a6'];

export default function FoodSupplyChainEmissionsPage(){
  const [tab,setTab]=useState(0);
  const [catFilter,setCatFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [sortField,setSortField]=useState('totalEmissions');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCo,setSelectedCo]=useState(null);
  const [proteinView,setProteinView]=useState('intensity');
  const [wasteStage,setWasteStage]=useState('All');
  const [flagSector,setFlagSector]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [page,setPage]=useState(0);

  const filtered=useMemo(()=>{
    let f=COMPANIES;
    if(catFilter!=='All')f=f.filter(c=>c.category===catFilter);
    if(countryFilter!=='All')f=f.filter(c=>c.country===countryFilter);
    if(searchTerm)f=f.filter(c=>c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir=sortDir==='asc'?1:-1;
    return [...f].sort((a,b)=>(a[sortField]>b[sortField]?dir:-dir));
  },[catFilter,countryFilter,sortField,sortDir,searchTerm]);

  const stats=useMemo(()=>{
    const totalE=filtered.reduce((a,c)=>a+c.totalEmissions,0);
    const avgIntensity=filtered.length?+(filtered.reduce((a,c)=>a+c.intensity,0)/filtered.length).toFixed(2):0;
    const flagPct=filtered.length?Math.floor(filtered.filter(c=>c.flagTarget).length/filtered.length*100):0;
    const avgWaste=filtered.length?+(filtered.reduce((a,c)=>a+c.wasteRate,0)/filtered.length).toFixed(1):0;
    const defFreePct=filtered.length?Math.floor(filtered.filter(c=>c.deforestationFree).length/filtered.length*100):0;
    const scope3Total=filtered.reduce((a,c)=>a+c.scope3Cat1,0);
    return{totalE,avgIntensity,flagPct,avgWaste,defFreePct,scope3Total};
  },[filtered]);

  const categoryBreakdown=useMemo(()=>FOOD_CATEGORIES.map(cat=>{const cos=filtered.filter(c=>c.category===cat);return{name:cat.length>18?cat.slice(0,18)+'...':cat,fullName:cat,count:cos.length,totalE:cos.reduce((a,c)=>a+c.totalEmissions,0),avgIntensity:cos.length?+(cos.reduce((a,c)=>a+c.intensity,0)/cos.length).toFixed(2):0};}).filter(c=>c.count>0).sort((a,b)=>b.totalE-a.totalE),[filtered]);

  const stageAvg=useMemo(()=>EMISSION_STAGES.map((s,si)=>({name:s,pct:filtered.length?Math.floor(filtered.reduce((a,c)=>a+c.stageBreakdown[si],0)/filtered.length):0})),[filtered]);

  const yearTrend=useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),totalKt:Math.floor(filtered.reduce((a,c)=>a+c.yearlyEmissions[yi],0)/1000),avgIntensity:filtered.length?+(filtered.reduce((a,c)=>a+(c.yearlyEmissions[yi]/c.totalEmissions*c.intensity),0)/filtered.length).toFixed(2):0})),[filtered]);

  const handleSort=useCallback((f)=>{if(sortField===f)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortField(f);setSortDir('desc');}},[sortField]);
  const PAGE_SIZE=12;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const renderEmissions=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search companies..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13,width:200}}/>
        <select value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Categories</option>{FOOD_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={countryFilter} onChange={e=>{setCountryFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{filtered.length} companies</span>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Total Emissions" value={(stats.totalE/1000).toFixed(0)+'k tCO2e'} sub="portfolio-wide" color={T.red}/>
        <KPI label="Avg Intensity" value={stats.avgIntensity+' tCO2e/$M'} sub="revenue-adjusted" color={T.amber}/>
        <KPI label="Scope 3 Cat 1" value={(stats.scope3Total/1000).toFixed(0)+'k tCO2e'} sub="purchased goods" color={T.navy}/>
        <KPI label="FLAG Targets" value={stats.flagPct+'%'} sub="companies with target" color={T.green}/>
        <KPI label="Deforestation-Free" value={stats.defFreePct+'%'} sub="committed" color={T.sage}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Emissions by Food Category</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" width={120} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Bar dataKey="totalE" fill={T.red} name="Total tCO2e" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Farm-to-Fork Stage Breakdown (avg %)</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stageAvg} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="pct" nameKey="name" label={({name,pct})=>`${name}: ${pct}%`} labelLine={false}>
                {stageAvg.map((e,i)=><Cell key={i} fill={STAGE_COLORS[i]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Emissions Trend (kt CO2e)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yearTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Area type="monotone" dataKey="totalKt" fill={T.red+'20'} stroke={T.red} strokeWidth={2} name="Total kt CO2e"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Intensity by Category (tCO2e/$M)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={70}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="avgIntensity" fill={T.amber} radius={[4,4,0,0]} name="Avg tCO2e/$M"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Company Emissions Registry</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
            <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {[{k:'name',l:'Company'},{k:'category',l:'Category'},{k:'country',l:'Country'},{k:'totalEmissions',l:'Total tCO2e'},{k:'intensity',l:'Intensity'},{k:'scope3Cat1',l:'Scope3 Cat1'},{k:'sbtiStatus',l:'SBTi'},{k:'wasteRate',l:'Waste %'}].map(({k,l})=>(
                <th key={k} onClick={()=>handleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:sortField===k?T.navy:T.textSec,fontWeight:sortField===k?700:500,whiteSpace:'nowrap'}}>{l}{sortField===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
              ))}
            </tr></thead>
            <tbody>{paged.map(c=>(
              <tr key={c.id} onClick={()=>setSelectedCo(c.id===selectedCo?null:c.id)} style={{borderBottom:`1px solid ${T.borderL}`,background:c.id===selectedCo?T.surfaceH:'transparent',cursor:'pointer'}}>
                <td style={{padding:'6px',fontWeight:500}}>{c.name}</td>
                <td style={{padding:'6px',fontSize:11}}>{c.category}</td>
                <td style={{padding:'6px'}}>{c.country}</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{c.totalEmissions.toLocaleString()}</td>
                <td style={{padding:'6px',fontFamily:T.mono,color:c.intensity>5?T.red:c.intensity>2.5?T.amber:T.green}}>{c.intensity}</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{c.scope3Cat1.toLocaleString()}</td>
                <td style={{padding:'6px'}}><Badge color={c.sbtiStatus==='Target Set'?T.green:c.sbtiStatus==='Committed'?T.sage:c.sbtiStatus==='In Progress'?T.amber:T.textMut}>{c.sbtiStatus}</Badge></td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{c.wasteRate}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {totalPages>1&&<div style={{display:'flex',gap:8,marginTop:12,justifyContent:'center',alignItems:'center'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontFamily:T.font,fontSize:12}}>Prev</button>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>Page {page+1}/{totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontFamily:T.font,fontSize:12}}>Next</button>
        </div>}
      </Card>

      {selectedCo!==null&&(()=>{const c=COMPANIES.find(x=>x.id===selectedCo);if(!c)return null;return(
        <Card style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:16,color:T.navy}}>{c.name}</div>
            <button onClick={()=>setSelectedCo(null)} style={{background:'none',border:'none',color:T.textMut,cursor:'pointer',fontSize:18}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
            <div><span style={{color:T.textMut,fontSize:11}}>Category</span><div style={{fontWeight:600,fontSize:12}}>{c.category}</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Revenue</span><div style={{fontWeight:600,fontFamily:T.mono}}>${c.revenue}B</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Suppliers</span><div style={{fontWeight:600,fontFamily:T.mono}}>{c.supplierCount.toLocaleString()}</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Traceability</span><div style={{fontWeight:600,fontFamily:T.mono}}>{c.traceability}%</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Water Intensity</span><div style={{fontWeight:600,fontFamily:T.mono}}>{c.waterIntensity} m³/$M</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Farm-to-Fork Split</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={EMISSION_STAGES.map((s,si)=>({stage:s,pct:c.stageBreakdown[si]}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="stage" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                  <Bar dataKey="pct" name="%">{EMISSION_STAGES.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Emissions Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={YEARS.map((y,yi)=>({year:y.toString(),emissions:c.yearlyEmissions[yi]}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                  <Line type="monotone" dataKey="emissions" stroke={T.red} strokeWidth={2} dot={{r:3}} name="tCO2e"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      );})()}
    </div>
  );

  const renderProtein=()=>{
    const proteinData=PROTEIN_SOURCES.map((p,pi)=>({name:p,co2PerKg:+(2+sr(pi*17+1)*58).toFixed(1),co2PerGProtein:+(0.5+sr(pi*23+3)*12).toFixed(2),waterPerKg:Math.floor(200+sr(pi*29+5)*14800),landPerKg:+(0.5+sr(pi*31+7)*30).toFixed(1),isAnimal:pi<5,marketGrowth:pi>=5?+(5+sr(pi*37+9)*35).toFixed(0):+(-2+sr(pi*41+11)*8).toFixed(0)}));
    const marketTrend=YEARS.map((y,yi)=>({year:y.toString(),animalProtein:Math.floor(280-yi*3+sr(yi*23)*5),plantProtein:Math.floor(35+yi*8+sr(yi*29)*4),cultivatedMeat:Math.floor(0.5+yi*1.5+sr(yi*31)*0.8)}));
    const companyProtein=filtered.filter(c=>['Beef & Cattle','Dairy','Poultry & Eggs','Pork','Seafood & Aquaculture'].includes(c.category)).slice(0,15).map(c=>({name:c.name.slice(0,14),intensity:c.proteinIntensity,category:c.category}));

    return(
      <div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {['intensity','market','company'].map(v=><Pill key={v} active={proteinView===v} onClick={()=>setProteinView(v)}>{v==='intensity'?'Emissions Intensity':v==='market'?'Market Trends':'Company Analysis'}</Pill>)}
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Animal Protein" value={+(proteinData.filter(p=>p.isAnimal).reduce((a,p)=>a+p.co2PerGProtein,0)/5).toFixed(1)+' kgCO2e/g'} sub="per gram protein" color={T.red}/>
          <KPI label="Avg Plant Protein" value={+(proteinData.filter(p=>!p.isAnimal).reduce((a,p)=>a+p.co2PerGProtein,0)/7).toFixed(1)+' kgCO2e/g'} sub="per gram protein" color={T.green}/>
          <KPI label="Ratio" value={Math.floor(proteinData.filter(p=>p.isAnimal).reduce((a,p)=>a+p.co2PerGProtein,0)/proteinData.filter(p=>!p.isAnimal).reduce((a,p)=>a+p.co2PerGProtein,0))+'x'} sub="animal vs plant" color={T.amber}/>
          <KPI label="Plant Market Growth" value={'+'+Math.floor(proteinData.filter(p=>!p.isAnimal).reduce((a,p)=>a+parseFloat(p.marketGrowth),0)/7)+'% CAGR'} sub="2019-2026" color={T.sage}/>
        </div>

        {proteinView==='intensity'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>CO2 per Gram of Protein</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...proteinData].sort((a,b)=>b.co2PerGProtein-a.co2PerGProtein)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="co2PerGProtein" name="kgCO2e/g protein" radius={[4,4,0,0]}>{proteinData.sort((a,b)=>b.co2PerGProtein-a.co2PerGProtein).map((e,i)=><Cell key={i} fill={e.isAnimal?T.red:T.green}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Water Footprint per kg</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...proteinData].sort((a,b)=>b.waterPerKg-a.waterPerKg)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="waterPerKg" name="Litres/kg" radius={[0,4,4,0]}>{proteinData.sort((a,b)=>b.waterPerKg-a.waterPerKg).map((e,i)=><Cell key={i} fill={e.isAnimal?T.navy:T.sage}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>}

        {proteinView==='market'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Protein Market Trend ($B)</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={marketTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Area type="monotone" dataKey="animalProtein" fill={T.red+'20'} stroke={T.red} strokeWidth={2} name="Animal Protein"/>
                <Area type="monotone" dataKey="plantProtein" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Plant Protein"/>
                <Area type="monotone" dataKey="cultivatedMeat" fill={T.gold+'20'} stroke={T.gold} strokeWidth={2} name="Cultivated Meat"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Market Growth Rate by Source (%)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={proteinData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="marketGrowth" name="CAGR %" radius={[4,4,0,0]}>{proteinData.map((e,i)=><Cell key={i} fill={parseFloat(e.marketGrowth)>0?T.green:T.red}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>}

        {proteinView==='company'&&<Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Animal Protein Companies — Intensity (gCO2e/g protein)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyProtein}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="intensity" name="gCO2e/g protein" radius={[4,4,0,0]}>{companyProtein.map((e,i)=><Cell key={i} fill={e.intensity>10?T.red:e.intensity>5?T.amber:T.green}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>}
      </div>
    );
  };

  const renderWaste=()=>{
    const wasteByStage=WASTE_STAGES.map((s,si)=>({stage:s,pctLost:Math.floor(3+sr(si*17+1)*12),emissionsKt:Math.floor(50+sr(si*23+3)*200),economicLoss:Math.floor(10+sr(si*29+5)*80)}));
    const totalWasteE=wasteByStage.reduce((a,w)=>a+w.emissionsKt,0);
    const circularSolutions=[{solution:'Anaerobic Digestion',potential:25,cost:12,readiness:'Mature'},{solution:'Composting',potential:18,cost:5,readiness:'Mature'},{solution:'Food Redistribution',potential:15,cost:3,readiness:'Scaling'},{solution:'Upcycled Ingredients',potential:10,cost:8,readiness:'Emerging'},{solution:'Animal Feed Conversion',potential:12,cost:6,readiness:'Mature'},{solution:'Insect Farming (BSF)',potential:8,cost:15,readiness:'Emerging'},{solution:'Smart Packaging',potential:6,cost:10,readiness:'Scaling'},{solution:'Cold Chain Optimisation',potential:9,cost:14,readiness:'Mature'}];
    const reductionTargets=[{target:'SDG 12.3 (50% by 2030)',current:18,gap:32},{target:'Champions 12.3',current:22,gap:28},{target:'EU Farm-to-Fork',current:15,gap:35},{target:'UNEP Food Waste Index',current:20,gap:30}];
    const companyWaste=filtered.slice(0,20).map(c=>({name:c.name.slice(0,14),waste:c.wasteRate,category:c.category}));

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Food Waste" value={stats.avgWaste+'%'} sub="across portfolio" color={T.red}/>
          <KPI label="Waste Emissions" value={totalWasteE+' kt CO2e'} sub="from food loss" color={T.amber}/>
          <KPI label="Economic Loss" value={'$'+wasteByStage.reduce((a,w)=>a+w.economicLoss,0)+'B'} sub="annual value lost" color={T.navy}/>
          <KPI label="Circular Potential" value={circularSolutions.reduce((a,s)=>a+s.potential,0)+'%'} sub="waste divertible" color={T.green}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Food Loss by Supply Chain Stage</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={wasteByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="stage" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="pctLost" fill={T.red} name="% Lost" radius={[4,4,0,0]}/>
                <Bar dataKey="emissionsKt" fill={T.amber} name="Emissions kt" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Circular Solutions — Diversion Potential vs Cost</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={circularSolutions}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="solution" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={70}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="potential" fill={T.green} name="Diversion %" radius={[4,4,0,0]}/>
                <Bar dataKey="cost" fill={T.navy} name="Cost $M" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Reduction Target Progress</div>
            {reductionTargets.map((t,i)=>(
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:T.textSec}}>{t.target}</span>
                  <span style={{fontFamily:T.mono,color:T.navy}}>{t.current}% / 50%</span>
                </div>
                <div style={{width:'100%',height:8,background:T.borderL,borderRadius:4}}>
                  <div style={{width:`${t.current*2}%`,height:8,background:t.current>=30?T.green:t.current>=20?T.amber:T.red,borderRadius:4,transition:'width 0.3s'}}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Company Waste Rates (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={companyWaste}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="waste" name="Waste %" radius={[4,4,0,0]}>{companyWaste.map((e,i)=><Cell key={i} fill={e.waste>20?T.red:e.waste>10?T.amber:T.green}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  const renderFLAG=()=>{
    const sectorPathways=FLAG_SECTORS.map((s,si)=>({sector:s,baselineIntensity:+(2+sr(si*17+1)*15).toFixed(1),targetIntensity:+(0.5+sr(si*23+3)*5).toFixed(1),reductionReq:Math.floor(30+sr(si*29+5)*40),companiesTracked:Math.floor(2+sr(si*31+7)*8)}));
    const flagCompanies=filtered.filter(c=>c.flagTarget).map(c=>({name:c.name.slice(0,16),progress:c.flagProgress,target:c.reductionTarget,year:c.targetYear,category:c.category}));
    const flagTimeline=YEARS.map((y,yi)=>({year:y.toString(),companiesWithTarget:Math.floor(5+yi*4+sr(yi*23)*3),avgProgress:Math.floor(5+yi*8+sr(yi*29)*5)}));
    const methodComparison=[{method:'FLAG v1 (2022)',approach:'Sector-specific',landUse:'Included',removals:'Excluded',coverage:'6 commodities'},{method:'FLAG v2 (2024)',approach:'Enhanced sector',landUse:'Expanded',removals:'Optional',coverage:'8 commodities'},{method:'SBTi Net-Zero',approach:'Full value chain',landUse:'Required',removals:'Required',coverage:'All FLAG sectors'}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={flagSector} onChange={e=>setFlagSector(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All FLAG Sectors</option>{FLAG_SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="FLAG Target Set" value={flagCompanies.length} sub={'of '+filtered.length+' companies'} color={T.green}/>
          <KPI label="Avg Progress" value={flagCompanies.length?Math.floor(flagCompanies.reduce((a,c)=>a+c.progress,0)/flagCompanies.length)+'%':'N/A'} sub="toward FLAG target" color={T.sage}/>
          <KPI label="Avg Reduction" value={flagCompanies.length?Math.floor(flagCompanies.reduce((a,c)=>a+c.target,0)/flagCompanies.length)+'%':'N/A'} sub="target reduction" color={T.navy}/>
          <KPI label="Deforestation-Free" value={stats.defFreePct+'%'} sub="supply chain committed" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>FLAG Sector Pathways — Required Reduction %</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorPathways}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="sector" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="baselineIntensity" fill={T.red} name="Baseline" radius={[4,4,0,0]}/>
                <Bar dataKey="targetIntensity" fill={T.green} name="Target 2030" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>FLAG Target Adoption Trend</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={flagTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Area type="monotone" dataKey="companiesWithTarget" fill={T.sage+'20'} stroke={T.sage} strokeWidth={2} name="Companies w/ Target"/>
                <Area type="monotone" dataKey="avgProgress" fill={T.gold+'20'} stroke={T.gold} strokeWidth={2} name="Avg Progress %"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card style={{marginBottom:20}}>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Company FLAG Target Progress</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={flagCompanies.slice(0,20)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Bar dataKey="target" fill={T.navy+'50'} name="Target %" radius={[4,4,0,0]}/>
              <Bar dataKey="progress" fill={T.green} name="Progress %" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>FLAG Methodology Comparison</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Method','Approach','Land Use','Removals','Coverage'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',color:T.textSec}}>{h}</th>)}
              </tr></thead>
              <tbody>{methodComparison.map((m,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px 10px',fontWeight:600}}>{m.method}</td>
                  <td style={{padding:'6px 10px'}}>{m.approach}</td>
                  <td style={{padding:'6px 10px'}}><Badge color={m.landUse==='Required'?T.green:T.amber}>{m.landUse}</Badge></td>
                  <td style={{padding:'6px 10px'}}><Badge color={m.removals==='Required'?T.green:m.removals==='Optional'?T.amber:T.red}>{m.removals}</Badge></td>
                  <td style={{padding:'6px 10px'}}>{m.coverage}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  return(
    <div style={{fontFamily:T.font,color:T.text,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:1}}>EP-AT2</span>
            <span style={{width:4,height:4,borderRadius:2,background:T.gold}}/>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FOOD SYSTEMS & AGRICULTURAL FINANCE</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Food Supply Chain Emissions</h1>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Farm-to-fork emissions analysis, protein transition tracking, food waste & SBTi FLAG targets across {COMPANIES.length} companies</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><Pill key={t} active={tab===i} onClick={()=>setTab(i)}>{t}</Pill>)}
        </div>

        {tab===0&&renderEmissions()}
        {tab===1&&renderProtein()}
        {tab===2&&renderWaste()}
        {tab===3&&renderFLAG()}
      </div>
    </div>
  );
}