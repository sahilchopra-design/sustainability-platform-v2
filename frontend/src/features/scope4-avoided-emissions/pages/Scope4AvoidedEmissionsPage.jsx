import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie, ScatterChart, Scatter } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11};

const SECTORS=['Renewable Energy','Electric Vehicles','Building Materials','Agriculture','Technology','Chemicals','Consumer Goods','Healthcare','Industrials','Utilities','Transportation','Waste Management','Water & Sanitation','Forestry','Financial Services'];
const CATEGORIES=['Renewable Energy','EVs','Plant-Based Food','Insulation','LED Lighting','Teleconferencing','Recycling Tech','Water Purification','Precision Agriculture','Carbon Capture'];
const METHODOLOGIES=['WRI/WBCSD Avoided Emissions','ICF Comparative Assessment','Project Frame Protocol','GHG Protocol Scope 4','ISO 14064-2 Project','Gold Standard Methodology','SBTi Beyond Value Chain','Custom Internal'];
const TIERS=['High','Medium','Low','Unverified'];
const CRITERIA=['Baseline Transparency','Additionality','Conservative Assumptions','Third-Party Verification','No Double-Counting','Temporal Boundaries','Geographic Scope','Rebound Adjustment'];
const QUARTERS=Array.from({length:12},(_,i)=>{const y=2022+Math.floor(i/4);const q=i%4+1;return `Q${q} ${y}`;});

const COMPANIES=Array.from({length:120},(_,i)=>{
  const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*31);const s5=sr(i*37);
  const names=['SolarEdge Global','WindForce Energy','TerraEV Motors','GreenBuild Corp','AgriSmart Tech','CleanChem Solutions','EcoConsumer Inc','MedGreen Health','IndustrialClean','UtilityGreen Power','TransitZero','WasteCircular','AquaPure Systems','ForestGuard','GreenFin Capital','SunPeak Solar','BreezeGen Wind','VoltDrive Auto','InsulMax Corp','FarmAI Solutions','PureReact Chem','NaturGoods','BioMed Green','EffiManufact','GridRenew','RailGreen','RecycleMax','WaterSave Tech','TimberPlus','ESG Advisors','PhotonEnergy','TurbineX','EVCharge Net','ThermoWall','CropOptima','GreenSynth','OrgaFoods','CleanMedica','LeanFactory','SolarGrid Co','HyperRail','CircularWaste','DesalTech','ReforestCo','ClimateVentures','LumiSolar','AeroWind','BatteryPlus','EcoInsulate','SmartFarm','CatalystChem','PlantMeals','HealthEco','PrecisionMfg','RenewUtil','CleanTransit','ZeroWaste','PureWater','TreeBond','GreenLend','Helios Energy','Zephyr Wind','NovaDrive','WallGuard','AgriDrone','BioProcess','VeganCo','PharmGreen','AutomateGreen','PowerShift','MetroEV','ReuseHub','H2OInnovate','SilvaCarbon','ImpactFund','RaySolar','GaleForce','ChargeFast','FoamGuard','YieldMax','EcoReact','GrainAlt','WellGreen','SmartOps','FlexGrid','UrbanEV','LoopRecycle','FilterPure','GrowForest','SustainBank','PrismSolar','VortexWind','SparkEV','CladEco','FieldSense','Catalytica','HarvestAlt','CareGreen','NanoMfg','TidalPower','SwiftRail','BioCycle','AquaFresh','CarbonSink','VentureESG','BeamSolar','MistWind','DrivePure','ShieldWall','SeedTech','FlowChem','RootFoods','HealGreen','OptiPlant','WaveEnergy','GlideTransit','EcoPack','StreamClean','OakReserve','PlanetFi'];
  const sector=SECTORS[Math.floor(s*SECTORS.length)];
  const category=CATEGORIES[Math.floor(s2*CATEGORIES.length)];
  const emitted=0.5+s3*12;
  const avoidedRaw=0.2+s4*18;
  const ratio=avoidedRaw/emitted;
  const tierIdx=s5<0.25?0:s5<0.55?1:s5<0.8?2:3;
  const criteriaScores=CRITERIA.map((_,ci)=>{const v=sr(i*41+ci*17);return v<0.15?0:v<0.4?1:v<0.7?2:3;});
  const quarterData=QUARTERS.map((_,qi)=>{const base=avoidedRaw*(0.6+sr(i*53+qi*11)*0.8);return parseFloat(base.toFixed(3));});
  return {
    id:i,name:names[i]||`Company ${i+1}`,sector,category,
    emitted:parseFloat(emitted.toFixed(3)),
    avoided:parseFloat(avoidedRaw.toFixed(3)),
    ratio:parseFloat(ratio.toFixed(2)),
    tier:TIERS[tierIdx],
    methodology:METHODOLOGIES[Math.floor(sr(i*59)*METHODOLOGIES.length)],
    product:['Solar panels','Wind turbines','Electric vehicles','Battery storage','Heat pumps','LED systems','Video platform','Recycling plant','Water filters','Drone monitoring','CO2 capture unit','Insulation boards','Plant protein','Precision sprayers','Smart grid tech'][Math.floor(sr(i*67)*15)],
    baselineEF:parseFloat((0.4+sr(i*71)*0.8).toFixed(3)),
    productEF:parseFloat((0.05+sr(i*73)*0.3).toFixed(3)),
    unitsSold:Math.floor(1000+sr(i*79)*500000),
    criteriaScores,quarterData,
    verified:s5<0.55,
    verifier:['DNV','Bureau Veritas','SGS','TUV SUD','ERM','Deloitte','PwC','None'][Math.floor(sr(i*83)*8)],
    country:['US','DE','CN','JP','UK','FR','IN','BR','CA','AU'][Math.floor(sr(i*89)*10)],
  };
});

const CATEGORY_DATA=CATEGORIES.map((cat,ci)=>{
  const companies=COMPANIES.filter(c=>c.category===cat);
  const totalAvoided=companies.reduce((a,c)=>a+c.avoided,0);
  const avgPerUnit=parseFloat((sr(ci*97)*2.5+0.1).toFixed(3));
  const growth=Array.from({length:16},(_,yi)=>{
    const year=2020+yi;
    const base=totalAvoided*(0.3+yi*0.06+sr(ci*101+yi*7)*0.15);
    return {year,avoided:parseFloat(base.toFixed(2))};
  });
  const additionality=sr(ci*103)<0.3?'High':sr(ci*103)<0.6?'Medium':'Low';
  const doubleCounting=sr(ci*107)<0.25;
  return {name:cat,companies:companies.length,totalAvoided:parseFloat(totalAvoided.toFixed(2)),avgPerUnit,growth,additionality,doubleCounting,topCompanies:companies.sort((a,b)=>b.avoided-a.avoided).slice(0,10)};
});

const BASELINES=['Grid Average Electricity','Fossil Fuel Vehicle (ICE)','Conventional Building Materials','Traditional Agriculture','Air Travel Baseline','Landfill Disposal','Municipal Water Treatment','Coal-fired Power'];

const TABS=['Avoided Emissions Calculator','Product Category Analysis','Portfolio Avoided Emissions','Credibility & Verification'];

const tierColor=t=>t==='High'?T.green:t==='Medium'?T.gold:t==='Low'?T.amber:T.red;
const criteriaLabel=v=>v===3?'Strong':v===2?'Adequate':v===1?'Weak':'Missing';
const criteriaColor=v=>v===3?T.green:v===2?T.gold:v===1?T.amber:T.red;

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,...style}}>{children}</div>;
const Badge=({color,label})=><span style={{background:color+'18',color,fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,fontFamily:T.font}}>{label}</span>;
const Metric=({label,value,sub,color})=>(
  <div style={{textAlign:'center'}}>
    <div style={{fontSize:11,color:T.textMut,fontFamily:T.font,marginBottom:2}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:T.textSec,fontFamily:T.font}}>{sub}</div>}
  </div>
);

export default function Scope4AvoidedEmissionsPage(){
  const [tab,setTab]=useState(0);
  // Tab 1 state
  const [selCompany,setSelCompany]=useState(0);
  const [baselineIdx,setBaselineIdx]=useState(0);
  const [methodIdx,setMethodIdx]=useState(0);
  const [unitsSold,setUnitsSold]=useState(COMPANIES[0].unitsSold);
  const [baselineEF,setBaselineEF]=useState(COMPANIES[0].baselineEF);
  const [productEF,setProductEF]=useState(COMPANIES[0].productEF);
  const [attribution,setAttribution]=useState(80);
  const [rebound,setRebound]=useState(10);
  const [calcRunning,setCalcRunning]=useState(false);
  const [calcDone,setCalcDone]=useState(false);
  // Tab 2 state
  const [selCategory,setSelCategory]=useState(null);
  // Tab 3 state
  const [portSectorFilter,setPortSectorFilter]=useState('All');
  const [portTierFilter,setPortTierFilter]=useState('All');
  const [portRatioMin,setPortRatioMin]=useState(0);
  const [portSort,setPortSort]=useState('avoided');
  const [portSortDir,setPortSortDir]=useState(-1);
  const [portPage,setPortPage]=useState(0);
  const [portDetail,setPortDetail]=useState(null);
  // Tab 4 state
  const [verScanRunning,setVerScanRunning]=useState(false);
  const [verScanDone,setVerScanDone]=useState(false);
  const [verSortCrit,setVerSortCrit]=useState(null);

  const handleCompanyChange=useCallback((idx)=>{
    const c=COMPANIES[idx];
    setSelCompany(idx);
    setUnitsSold(c.unitsSold);
    setBaselineEF(c.baselineEF);
    setProductEF(c.productEF);
    setCalcDone(false);
  },[]);

  const grossAvoided=useMemo(()=>parseFloat(((unitsSold*(baselineEF-productEF))/1e6).toFixed(4)),[unitsSold,baselineEF,productEF]);
  const netAvoided=useMemo(()=>parseFloat((grossAvoided*(attribution/100)*(1-rebound/100)).toFixed(4)),[grossAvoided,attribution,rebound]);
  const avoidedToEmitted=useMemo(()=>{const e=COMPANIES[selCompany].emitted;return e>0?parseFloat((netAvoided/e).toFixed(2)):0;},[netAvoided,selCompany]);

  const runCalc=useCallback(()=>{
    setCalcRunning(true);
    setTimeout(()=>{setCalcRunning(false);setCalcDone(true);},1200);
  },[]);

  const filteredPortfolio=useMemo(()=>{
    let list=COMPANIES.filter(c=>{
      if(portSectorFilter!=='All'&&c.sector!==portSectorFilter)return false;
      if(portTierFilter!=='All'&&c.tier!==portTierFilter)return false;
      if(c.ratio<portRatioMin)return false;
      return true;
    });
    list.sort((a,b)=>{
      const va=a[portSort],vb=b[portSort];
      if(typeof va==='string')return portSortDir*va.localeCompare(vb);
      return portSortDir*(va-vb);
    });
    return list;
  },[portSectorFilter,portTierFilter,portRatioMin,portSort,portSortDir]);

  const portPageData=useMemo(()=>filteredPortfolio.slice(portPage*25,(portPage+1)*25),[filteredPortfolio,portPage]);
  const portTotalPages=Math.ceil(filteredPortfolio.length/25);

  const portTotalEmitted=useMemo(()=>filteredPortfolio.reduce((a,c)=>a+c.emitted,0),[filteredPortfolio]);
  const portTotalAvoided=useMemo(()=>filteredPortfolio.reduce((a,c)=>a+c.avoided,0),[filteredPortfolio]);

  const sectorDonut=useMemo(()=>{
    const map={};
    filteredPortfolio.forEach(c=>{map[c.sector]=(map[c.sector]||0)+c.avoided;});
    return Object.entries(map).map(([name,value])=>({name,value:parseFloat(value.toFixed(2))})).sort((a,b)=>b.value-a.value);
  },[filteredPortfolio]);

  const tierDist=useMemo(()=>TIERS.map(t=>({name:t,value:COMPANIES.filter(c=>c.tier===t).length})),[]);

  const doSort=(col)=>{
    if(portSort===col)setPortSortDir(d=>d*-1);
    else{setPortSort(col);setPortSortDir(-1);}
    setPortPage(0);
  };

  const redFlags=useMemo(()=>COMPANIES.filter(c=>c.tier==='Unverified'||c.criteriaScores.some(s=>s===0)).map(c=>({
    name:c.name,issues:CRITERIA.filter((_,ci)=>c.criteriaScores[ci]===0),tier:c.tier
  })).slice(0,15),[]);

  const runVerScan=useCallback(()=>{
    setVerScanRunning(true);
    setTimeout(()=>{setVerScanRunning(false);setVerScanDone(true);},1500);
  },[]);

  const exportCSV=useCallback(()=>{
    const header='Company,Sector,Tier,'+CRITERIA.join(',')+',Overall Score\n';
    const rows=COMPANIES.map(c=>{
      const total=c.criteriaScores.reduce((a,v)=>a+v,0);
      return `${c.name},${c.sector},${c.tier},${c.criteriaScores.join(',')},${total}`;
    }).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='credibility_report.csv';a.click();
    URL.revokeObjectURL(url);
  },[]);

  const DONUT_COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,'#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#6366f1','#14b8a6','#e11d48','#a855f7'];

  const headerS={fontFamily:T.font,color:T.navy,margin:0};
  const tabBtnS=(active)=>({padding:'10px 22px',border:'none',borderBottom:active?`3px solid ${T.navy}`:'3px solid transparent',background:'none',color:active?T.navy:T.textMut,fontWeight:active?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'});
  const selectS={padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'};
  const inputS={padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,color:T.text,background:T.surface,width:120};
  const btnS=(active)=>({padding:'10px 24px',borderRadius:8,border:'none',background:active?T.navy:T.border,color:active?'#fff':T.textMut,fontWeight:600,fontSize:13,cursor:active?'pointer':'default',fontFamily:T.font,transition:'all 0.3s'});
  const thS={padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:600,color:T.textMut,borderBottom:`1px solid ${T.border}`,fontFamily:T.font,cursor:'pointer',userSelect:'none'};
  const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.bg}`,fontFamily:T.font};

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{...headerS,fontSize:26,marginBottom:4}}>Scope 4 / Avoided Emissions Calculator</h1>
        <p style={{color:T.textSec,fontSize:13,margin:0}}>Quantify emissions avoided by products & services vs baseline alternatives -- WRI/WBCSD guidance, ICF methodology, Project Frame</p>
      </div>

      <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:24}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={tabBtnS(tab===i)}>{t}</button>)}
      </div>

      {/* ========== TAB 1: CALCULATOR ========== */}
      {tab===0&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <Card>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-end'}}>
              <div style={{flex:1,minWidth:220}}>
                <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Company</label>
                <select value={selCompany} onChange={e=>handleCompanyChange(Number(e.target.value))} style={{...selectS,width:'100%'}}>
                  {COMPANIES.map((c,i)=><option key={i} value={i}>{c.name} -- {c.sector}</option>)}
                </select>
              </div>
              <div style={{minWidth:200}}>
                <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Baseline Scenario</label>
                <select value={baselineIdx} onChange={e=>setBaselineIdx(Number(e.target.value))} style={{...selectS,width:'100%'}}>
                  {BASELINES.map((b,i)=><option key={i} value={i}>{b}</option>)}
                </select>
              </div>
              <div style={{minWidth:200}}>
                <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Methodology</label>
                <select value={methodIdx} onChange={e=>setMethodIdx(Number(e.target.value))} style={{...selectS,width:'100%'}}>
                  {METHODOLOGIES.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <Card>
              <h3 style={{...headerS,fontSize:15,marginBottom:16}}>Product / Service: {COMPANIES[selCompany].product}</h3>
              <p style={{fontSize:12,color:T.textSec,marginBottom:16}}>
                Category: <strong>{COMPANIES[selCompany].category}</strong> | Verified: {COMPANIES[selCompany].verified?'Yes':'No'} | Verifier: {COMPANIES[selCompany].verifier}
              </p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Units Sold</label>
                  <input type="number" value={unitsSold} onChange={e=>setUnitsSold(Number(e.target.value))} style={inputS}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Baseline EF (tCO2e/unit)</label>
                  <input type="number" step="0.001" value={baselineEF} onChange={e=>setBaselineEF(Number(e.target.value))} style={inputS}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Product EF (tCO2e/unit)</label>
                  <input type="number" step="0.001" value={productEF} onChange={e=>setProductEF(Number(e.target.value))} style={inputS}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Attribution Factor: {attribution}%</label>
                  <input type="range" min={0} max={100} value={attribution} onChange={e=>setAttribution(Number(e.target.value))} style={{width:'100%',accentColor:T.navy}}/>
                </div>
                <div style={{gridColumn:'1/3'}}>
                  <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Rebound Effect Adjustment: {rebound}%</label>
                  <input type="range" min={0} max={30} value={rebound} onChange={e=>setRebound(Number(e.target.value))} style={{width:'100%',accentColor:T.amber}}/>
                </div>
              </div>
            </Card>

            <Card>
              <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Calculation Formula</h3>
              <div style={{background:T.bg,borderRadius:8,padding:14,fontFamily:T.mono,fontSize:11,lineHeight:2,color:T.navy,marginBottom:14}}>
                <div>Gross Avoided = Units x (Baseline EF - Product EF)</div>
                <div style={{paddingLeft:16}}>= {unitsSold.toLocaleString()} x ({baselineEF} - {productEF})</div>
                <div style={{paddingLeft:16}}>= <strong>{grossAvoided.toFixed(4)} MtCO2e</strong></div>
                <div style={{marginTop:6}}>Net Avoided = Gross x Attribution x (1 - Rebound)</div>
                <div style={{paddingLeft:16}}>= {grossAvoided.toFixed(4)} x {attribution}% x {100-rebound}%</div>
                <div style={{paddingLeft:16}}>= <strong style={{color:T.green}}>{netAvoided.toFixed(4)} MtCO2e</strong></div>
              </div>
              <div style={{display:'flex',gap:20,marginBottom:14}}>
                <Metric label="Gross Avoided" value={`${grossAvoided.toFixed(3)} Mt`} color={T.sage}/>
                <Metric label="Net Avoided" value={`${netAvoided.toFixed(3)} Mt`} color={T.green}/>
                <Metric label="Avoided:Emitted" value={`${avoidedToEmitted}x`} color={avoidedToEmitted>=1?T.green:T.amber}/>
              </div>
              <button onClick={runCalc} disabled={calcRunning} style={{...btnS(!calcRunning),width:'100%'}}>
                {calcRunning?'Calculating...':'Run Calculation'}
              </button>
              {calcDone&&<div style={{marginTop:10,padding:10,background:T.green+'12',borderRadius:8,fontSize:12,color:T.green,fontWeight:600,textAlign:'center'}}>Calculation complete -- methodology: {METHODOLOGIES[methodIdx]}</div>}
            </Card>
          </div>

          <Card>
            <h3 style={{...headerS,fontSize:15,marginBottom:16}}>Emitted vs Avoided Emissions: {COMPANIES[selCompany].name}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[{name:'Emitted (Scope 1+2+3)',value:COMPANIES[selCompany].emitted,fill:T.red},{name:'Gross Avoided',value:grossAvoided,fill:T.sage},{name:'Net Avoided',value:netAvoided,fill:T.green}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'MtCO2e',angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textMut}}}/>
                <Tooltip contentStyle={tip}/>
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {[T.red,T.sage,T.green].map((c,i)=><Cell key={i} fill={c}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Quarterly Avoided Emissions Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={QUARTERS.map((q,qi)=>({quarter:q,avoided:COMPANIES[selCompany].quarterData[qi]}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={tip}/>
                <Area type="monotone" dataKey="avoided" stroke={T.sage} fill={T.sage+'30'} strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ========== TAB 2: PRODUCT CATEGORY ANALYSIS ========== */}
      {tab===1&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <Card>
            <h3 style={{...headerS,fontSize:15,marginBottom:16}}>Product Category Comparison</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={CATEGORY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} label={{value:'Total Avoided MtCO2e',position:'insideBottom',offset:-2,style:{fontSize:11,fill:T.textMut}}}/>
                <YAxis dataKey="name" type="category" width={130} tick={{fontSize:11,fill:T.text}}/>
                <Tooltip contentStyle={tip}/>
                <Bar dataKey="totalAvoided" fill={T.sage} radius={[0,6,6,0]} name="Total Avoided MtCO2e">
                  {CATEGORY_DATA.map((_,i)=><Cell key={i} fill={DONUT_COLORS[i%DONUT_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            {CATEGORY_DATA.map((cat,ci)=>(
              <Card key={ci} style={{cursor:'pointer',border:selCategory===ci?`2px solid ${T.navy}`:`1px solid ${T.border}`,padding:14}} onClick={()=>setSelCategory(selCategory===ci?null:ci)}>
                <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>{cat.name}</div>
                <div style={{fontSize:18,fontWeight:700,color:T.sage,fontFamily:T.mono}}>{cat.totalAvoided.toFixed(1)}</div>
                <div style={{fontSize:10,color:T.textMut}}>MtCO2e avoided</div>
                <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{cat.companies} companies</div>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  <Badge color={cat.additionality==='High'?T.green:cat.additionality==='Medium'?T.gold:T.amber} label={`Add: ${cat.additionality}`}/>
                  {cat.doubleCounting&&<Badge color={T.red} label="DC Risk"/>}
                </div>
              </Card>
            ))}
          </div>

          {selCategory!==null&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <Card>
                <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Growth Trajectory: {CATEGORY_DATA[selCategory].name}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={CATEGORY_DATA[selCategory].growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                    <Tooltip contentStyle={tip}/>
                    <Area type="monotone" dataKey="avoided" stroke={T.navy} fill={T.navy+'20'} strokeWidth={2} name="Avoided MtCO2e"/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h3 style={{...headerS,fontSize:15,marginBottom:8}}>Top Companies in {CATEGORY_DATA[selCategory].name}</h3>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr><th style={thS}>Company</th><th style={thS}>Avoided</th><th style={thS}>Tier</th></tr>
                  </thead>
                  <tbody>
                    {CATEGORY_DATA[selCategory].topCompanies.map((c,ri)=>(
                      <tr key={ri} style={{background:ri%2===0?'transparent':T.bg}}>
                        <td style={tdS}>{c.name}</td>
                        <td style={{...tdS,fontFamily:T.mono}}>{c.avoided.toFixed(3)}</td>
                        <td style={tdS}><Badge color={tierColor(c.tier)} label={c.tier}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card>
                <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Lifecycle Stage Breakdown</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {['Raw Materials','Manufacturing','Distribution','Use Phase','End-of-Life'].map((stage,si)=>{
                    const pct=parseFloat((sr(selCategory*113+si*17)*60+5).toFixed(1));
                    return(
                      <div key={si}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}>
                          <span>{stage}</span><span style={{fontFamily:T.mono}}>{pct}%</span>
                        </div>
                        <div style={{height:8,background:T.bg,borderRadius:4}}>
                          <div style={{height:8,background:DONUT_COLORS[si],borderRadius:4,width:`${pct}%`,transition:'width 0.4s'}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Sensitivity Analysis</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                    {['Baseline +20%','Baseline -20%','No Rebound'].map((sc,si)=>{
                      const delta=si===0?1.2:si===1?0.8:1.1;
                      const val=parseFloat((CATEGORY_DATA[selCategory].totalAvoided*delta).toFixed(2));
                      return <div key={si} style={{background:T.bg,borderRadius:8,padding:8,textAlign:'center'}}>
                        <div style={{fontSize:10,color:T.textMut}}>{sc}</div>
                        <div style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{val}</div>
                      </div>;
                    })}
                  </div>
                </div>
              </Card>
              <Card>
                <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Baseline Assumptions</h3>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {['Grid emission factor: national avg vs marginal','Technology vintage: current market avg vs BAT','Geographic scope: production country vs consumption','Temporal boundary: annual vs lifetime','Attribution: full claim vs proportional share'].map((a,ai)=>(
                    <div key={ai} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:6,height:6,borderRadius:3,background:DONUT_COLORS[ai],flexShrink:0}}/>
                      <span style={{fontSize:11,color:T.textSec}}>{a}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,padding:10,background:T.amber+'10',borderRadius:8,border:`1px solid ${T.amber}30`}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.amber,marginBottom:4}}>Additionality Assessment</div>
                  <div style={{fontSize:11,color:T.textSec}}>
                    {CATEGORY_DATA[selCategory].additionality==='High'?'Products clearly displace higher-emission alternatives with strong causal link.':
                     CATEGORY_DATA[selCategory].additionality==='Medium'?'Moderate evidence of displacement; some market overlap with alternatives.':
                     'Weak evidence of additionality; baseline alternatives may already be low-emission.'}
                  </div>
                </div>
                {CATEGORY_DATA[selCategory].doubleCounting&&(
                  <div style={{marginTop:10,padding:10,background:T.red+'10',borderRadius:8,border:`1px solid ${T.red}30`}}>
                    <div style={{fontSize:11,fontWeight:600,color:T.red}}>Double-Counting Risk Flag</div>
                    <div style={{fontSize:11,color:T.textSec}}>Multiple companies in this category may be claiming the same avoided emissions from shared supply chains.</div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB 3: PORTFOLIO AVOIDED EMISSIONS ========== */}
      {tab===2&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            <Metric label="Portfolio Emitted" value={`${portTotalEmitted.toFixed(1)} Mt`} color={T.red}/>
            <Metric label="Portfolio Avoided" value={`${portTotalAvoided.toFixed(1)} Mt`} color={T.green}/>
            <Metric label="Net Climate Impact" value={`${(portTotalEmitted-portTotalAvoided).toFixed(1)} Mt`} color={portTotalAvoided>portTotalEmitted?T.green:T.amber}/>
            <Metric label="Companies" value={filteredPortfolio.length}/>
            <Metric label="Avg Ratio" value={`${(filteredPortfolio.reduce((a,c)=>a+c.ratio,0)/Math.max(filteredPortfolio.length,1)).toFixed(2)}x`}/>
          </div>

          <Card style={{padding:14}}>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
              <div>
                <label style={{fontSize:10,color:T.textMut,display:'block',marginBottom:2}}>Sector</label>
                <select value={portSectorFilter} onChange={e=>{setPortSectorFilter(e.target.value);setPortPage(0);}} style={selectS}>
                  <option value="All">All Sectors</option>
                  {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,color:T.textMut,display:'block',marginBottom:2}}>Credibility Tier</label>
                <select value={portTierFilter} onChange={e=>{setPortTierFilter(e.target.value);setPortPage(0);}} style={selectS}>
                  <option value="All">All Tiers</option>
                  {TIERS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,color:T.textMut,display:'block',marginBottom:2}}>Min Ratio</label>
                <input type="number" step="0.1" value={portRatioMin} onChange={e=>{setPortRatioMin(Number(e.target.value));setPortPage(0);}} style={{...inputS,width:80}}/>
              </div>
              <div style={{marginLeft:'auto',fontSize:11,color:T.textMut}}>{filteredPortfolio.length} companies | Page {portPage+1}/{portTotalPages||1}</div>
            </div>
          </Card>

          <Card style={{padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.bg}}>
                  {[{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'emitted',l:'Emitted MtCO2e'},{k:'avoided',l:'Avoided MtCO2e'},{k:'ratio',l:'Ratio'},{k:'tier',l:'Credibility'}].map(col=>(
                    <th key={col.k} onClick={()=>doSort(col.k)} style={{...thS,background:portSort===col.k?T.surfaceH:'transparent'}}>
                      {col.l}{portSort===col.k?(portSortDir===-1?' \u25BC':' \u25B2'):''}
                    </th>
                  ))}
                  <th style={thS}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portPageData.map((c,ri)=>(
                  <tr key={c.id} style={{background:ri%2===0?T.surface:T.bg,cursor:'pointer'}} onClick={()=>setPortDetail(c)}>
                    <td style={{...tdS,fontWeight:600}}>{c.name}</td>
                    <td style={tdS}>{c.sector}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{c.emitted.toFixed(3)}</td>
                    <td style={{...tdS,fontFamily:T.mono,color:T.green}}>{c.avoided.toFixed(3)}</td>
                    <td style={{...tdS,fontFamily:T.mono}}>{c.ratio.toFixed(2)}x</td>
                    <td style={tdS}><Badge color={tierColor(c.tier)} label={c.tier}/></td>
                    <td style={tdS}><button onClick={e=>{e.stopPropagation();setPortDetail(c);}} style={{...btnS(true),padding:'4px 12px',fontSize:11}}>Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex',justifyContent:'center',gap:8,padding:12}}>
              <button onClick={()=>setPortPage(p=>Math.max(0,p-1))} disabled={portPage===0} style={{...btnS(portPage>0),padding:'4px 12px',fontSize:11}}>Prev</button>
              {Array.from({length:Math.min(portTotalPages,7)},(_,i)=>{
                const pg=portTotalPages<=7?i:portPage<3?i:portPage>portTotalPages-4?portTotalPages-7+i:portPage-3+i;
                return <button key={pg} onClick={()=>setPortPage(pg)} style={{...btnS(pg===portPage),padding:'4px 10px',fontSize:11,minWidth:32}}>{pg+1}</button>;
              })}
              <button onClick={()=>setPortPage(p=>Math.min(portTotalPages-1,p+1))} disabled={portPage>=portTotalPages-1} style={{...btnS(portPage<portTotalPages-1),padding:'4px 12px',fontSize:11}}>Next</button>
            </div>
          </Card>

          {portDetail&&(
            <Card style={{border:`2px solid ${T.navy}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                <div>
                  <h3 style={{...headerS,fontSize:17,marginBottom:4}}>{portDetail.name}</h3>
                  <div style={{fontSize:12,color:T.textSec}}>{portDetail.sector} | {portDetail.category} | {portDetail.country}</div>
                </div>
                <button onClick={()=>setPortDetail(null)} style={{background:'none',border:'none',fontSize:18,color:T.textMut,cursor:'pointer'}}>x</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
                <Metric label="Emitted" value={`${portDetail.emitted.toFixed(3)} Mt`} color={T.red}/>
                <Metric label="Avoided" value={`${portDetail.avoided.toFixed(3)} Mt`} color={T.green}/>
                <Metric label="Ratio" value={`${portDetail.ratio.toFixed(2)}x`} color={portDetail.ratio>=1?T.green:T.amber}/>
                <Metric label="Tier" value={portDetail.tier} color={tierColor(portDetail.tier)}/>
                <Metric label="Methodology" value={portDetail.methodology.split(' ')[0]} sub={portDetail.methodology}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Methodology Assessment</div>
                  {CRITERIA.map((cr,ci)=>(
                    <div key={ci} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:`1px solid ${T.bg}`}}>
                      <span style={{fontSize:11,color:T.textSec}}>{cr}</span>
                      <Badge color={criteriaColor(portDetail.criteriaScores[ci])} label={criteriaLabel(portDetail.criteriaScores[ci])}/>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Peer Comparison</div>
                  {COMPANIES.filter(c=>c.sector===portDetail.sector&&c.id!==portDetail.id).slice(0,5).map((peer,pi)=>(
                    <div key={pi} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.bg}`,fontSize:11}}>
                      <span style={{color:T.text}}>{peer.name}</span>
                      <span style={{color:T.green,fontFamily:T.mono}}>{peer.avoided.toFixed(3)} Mt</span>
                    </div>
                  ))}
                  <div style={{marginTop:12,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Verification Status</div>
                  <div style={{padding:10,background:portDetail.verified?T.green+'10':T.red+'10',borderRadius:8}}>
                    <div style={{fontSize:12,color:portDetail.verified?T.green:T.red,fontWeight:600}}>{portDetail.verified?'Verified':'Not Verified'}</div>
                    <div style={{fontSize:11,color:T.textSec}}>Verifier: {portDetail.verifier}</div>
                  </div>
                  <button style={{...btnS(true),marginTop:10,width:'100%',background:T.amber}}>Flag for Review</button>
                </div>
              </div>
            </Card>
          )}

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
            <Card>
              <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Emitted vs Avoided: Portfolio Stacked</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[{name:'Portfolio Total',emitted:portTotalEmitted,avoided:portTotalAvoided}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Tooltip contentStyle={tip}/>
                  <Legend/>
                  <Bar dataKey="emitted" stackId="a" fill={T.red} name="Emitted MtCO2e" radius={[0,0,0,0]}/>
                  <Bar dataKey="avoided" stackId="a" fill={T.green} name="Avoided MtCO2e" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Avoided by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sectorDonut.slice(0,8)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2}>
                    {sectorDonut.slice(0,8).map((_,i)=><Cell key={i} fill={DONUT_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={tip}/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ========== TAB 4: CREDIBILITY & VERIFICATION ========== */}
      {tab===3&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <button onClick={runVerScan} disabled={verScanRunning} style={{...btnS(!verScanRunning),padding:'10px 28px'}}>
              {verScanRunning?'Scanning...':'Run Verification Scan'}
            </button>
            <button onClick={exportCSV} style={{...btnS(true),background:T.sage}}>Export Credibility Report CSV</button>
            {verScanDone&&<span style={{fontSize:12,color:T.green,fontWeight:600}}>Scan complete -- 120 companies assessed</span>}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {CRITERIA.map((cr,ci)=>{
              const avg=COMPANIES.reduce((a,c)=>a+c.criteriaScores[ci],0)/COMPANIES.length;
              return(
                <Card key={ci} style={{padding:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>{cr}</div>
                  <div style={{fontSize:22,fontWeight:700,color:avg>=2?T.green:avg>=1.5?T.gold:T.red,fontFamily:T.mono}}>{avg.toFixed(2)}</div>
                  <div style={{fontSize:10,color:T.textMut}}>Avg score (0-3)</div>
                  <div style={{height:6,background:T.bg,borderRadius:3,marginTop:6}}>
                    <div style={{height:6,background:avg>=2?T.green:avg>=1.5?T.gold:T.red,borderRadius:3,width:`${(avg/3)*100}%`}}/>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Credibility Heatmap: Companies x Criteria</h3>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
                <thead>
                  <tr>
                    <th style={{...thS,position:'sticky',left:0,background:T.surface,zIndex:1}}>Company</th>
                    {CRITERIA.map((cr,ci)=>(
                      <th key={ci} onClick={()=>setVerSortCrit(verSortCrit===ci?null:ci)} style={{...thS,cursor:'pointer',fontSize:10,maxWidth:90,background:verSortCrit===ci?T.surfaceH:'transparent'}}>
                        {cr}{verSortCrit===ci?' \u25BC':''}
                      </th>
                    ))}
                    <th style={thS}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {useMemo(()=>{
                    let sorted=[...COMPANIES];
                    if(verSortCrit!==null)sorted.sort((a,b)=>b.criteriaScores[verSortCrit]-a.criteriaScores[verSortCrit]);
                    return sorted.slice(0,40);
                  },[verSortCrit]).map((c,ri)=>{
                    const total=c.criteriaScores.reduce((a,v)=>a+v,0);
                    return(
                      <tr key={c.id} style={{background:ri%2===0?T.surface:T.bg}}>
                        <td style={{...tdS,fontWeight:600,fontSize:11,position:'sticky',left:0,background:ri%2===0?T.surface:T.bg,zIndex:1}}>{c.name}</td>
                        {c.criteriaScores.map((sc,sci)=>(
                          <td key={sci} style={{...tdS,textAlign:'center',background:criteriaColor(sc)+'18'}}>
                            <span style={{fontSize:10,fontWeight:600,color:criteriaColor(sc)}}>{criteriaLabel(sc)}</span>
                          </td>
                        ))}
                        <td style={{...tdS,textAlign:'center',fontFamily:T.mono,fontWeight:700,color:total>=18?T.green:total>=12?T.gold:T.red}}>{total}/24</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{fontSize:10,color:T.textMut,marginTop:8}}>Showing top 40 companies (sorted by {verSortCrit!==null?CRITERIA[verSortCrit]:'order'}). Click column header to sort.</div>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <Card>
              <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Credibility Tier Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={tierDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}`}>
                    {tierDist.map((t,i)=><Cell key={i} fill={tierColor(t.name)}/>)}
                  </Pie>
                  <Tooltip contentStyle={tip}/>
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Red Flags Panel</h3>
              <div style={{maxHeight:280,overflowY:'auto'}}>
                {redFlags.map((rf,ri)=>(
                  <div key={ri} style={{padding:10,marginBottom:8,background:T.red+'08',borderRadius:8,border:`1px solid ${T.red}20`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{rf.name}</span>
                      <Badge color={tierColor(rf.tier)} label={rf.tier}/>
                    </div>
                    <div style={{fontSize:11,color:T.red}}>
                      Missing: {rf.issues.length>0?rf.issues.join(', '):'Unverified tier'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Best Practices Recommendations</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {title:'Baseline Documentation',desc:'Require all companies to document baseline scenario selection with supporting market data and technology benchmarks.',icon:'1'},
                {title:'Third-Party Verification',desc:'Mandate independent verification by accredited bodies (DNV, Bureau Veritas, SGS) for claims exceeding 100 ktCO2e.',icon:'2'},
                {title:'Conservative Methodology',desc:'Apply conservative emission factors and require sensitivity analysis showing +/-20% baseline variation impact.',icon:'3'},
                {title:'Double-Counting Prevention',desc:'Implement cross-portfolio checks and require companies to disclose all entities claiming the same avoided emissions.',icon:'4'},
                {title:'Temporal Alignment',desc:'Standardize temporal boundaries to annual reporting periods with lifetime avoided shown separately.',icon:'5'},
                {title:'Rebound Effect Accounting',desc:'Require explicit rebound effect quantification based on price elasticity and behavioural research.',icon:'6'},
              ].map((bp,bi)=>(
                <div key={bi} style={{background:T.bg,borderRadius:10,padding:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:24,height:24,borderRadius:12,background:T.navy,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{bp.icon}</div>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{bp.title}</div>
                  </div>
                  <div style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>{bp.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{...headerS,fontSize:15,marginBottom:12}}>Verification Coverage by Methodology</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={METHODOLOGIES.map((m,mi)=>{
                const cos=COMPANIES.filter(c=>c.methodology===m);
                const verified=cos.filter(c=>c.verified).length;
                return{name:m.length>25?m.slice(0,25)+'...':m,total:cos.length,verified,unverified:cos.length-verified};
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-20} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={tip}/>
                <Legend/>
                <Bar dataKey="verified" stackId="a" fill={T.green} name="Verified"/>
                <Bar dataKey="unverified" stackId="a" fill={T.red} name="Unverified" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
