import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SUB_MODULES=[
  {id:'AT1',name:'Regenerative Agriculture',icon:'🌱',color:T.sage,desc:'Practice adoption, soil carbon MRV, economics & certification',route:'/agri/regenerative'},
  {id:'AT2',name:'Food Supply Chain Emissions',icon:'🍽️',color:T.red,desc:'Farm-to-fork emissions, protein transition, food waste, FLAG targets',route:'/agri/food-emissions'},
  {id:'AT3',name:'Water & Agriculture Risk',icon:'💧',color:T.navy,desc:'Water stress, crop water footprint, drought modelling, stewardship',route:'/agri/water-risk'},
  {id:'AT4',name:'Land Use & Carbon',icon:'🗺️',color:T.green,desc:'Land carbon inventory, LULUCF, nature-based solutions, credits',route:'/agri/land-carbon'},
  {id:'AT5',name:'Agricultural Biodiversity',icon:'🦋',color:T.gold,desc:'Biodiversity scorecard, pollinators, soil biology, biodiv credits',route:'/agri/biodiversity'},
];

const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];
const ENGAGEMENT_STAGES=['Identified','Contacted','In Discussion','Committed','Implementing','Verified'];
const ENGAGEMENT_TYPES=['Farmer Cooperative','Food Company','Input Supplier','Financial Institution','NGO Partner','Government Agency','Certification Body','Research Institute'];
const BOARD_SECTIONS=['Executive Summary','Regenerative Agriculture KPIs','Food System Emissions','Water Risk Assessment','Land Use & Carbon Stocks','Biodiversity Metrics','Engagement Pipeline','Recommendations'];
const AUDIENCE_MODES=['Board / C-Suite','Investment Committee','ESG / Sustainability','Operations / Supply Chain'];
const CROP_TYPES=['Wheat','Corn','Soybeans','Rice','Cotton','Coffee','Cocoa','Palm Oil','Sugarcane','Barley'];
const RISK_DIMENSIONS=['Climate Physical','Water Stress','Biodiversity Loss','Deforestation','Soil Degradation','Regulatory'];

const genAlerts=(n)=>Array.from({length:n},(_,i)=>{
  const types=['Critical','Warning','Info','Action Required'];
  const modules=['AT1','AT2','AT3','AT4','AT5'];
  const messages=[
    'Soil carbon verification overdue for 3 operations','FLAG target deadline approaching — 5 companies behind schedule','Water stress index exceeded threshold in Punjab region','Peatland parcel showing negative flux reversal','Pollinator health declining in Midwest operations','Neonicotinoid exposure above regulatory limit','Deforestation alert in supply chain tier-2 supplier','Carbon credit vintage expiring within 60 days','Drought scenario trigger activated for Murray-Darling','Engagement milestone missed — follow up required','MSA score dropped below 0.40 in 2 operations','Food waste rate increased 5% QoQ in retail segment','Certification renewal due for 8 operations','New FLAG guidance published — targets need update','Water stewardship audit scheduled next month','Regenerative practice adoption stalled at 45%','Supply chain traceability gap identified','Biodiversity credit pilot results available','Insurance trigger threshold approaching','Board report due in 14 days'];
  return{id:i,type:types[Math.floor(sr(i*17+1)*types.length)],module:modules[Math.floor(sr(i*23+3)*modules.length)],message:messages[i%messages.length],date:'2026-03-'+(10+Math.floor(sr(i*29+5)*18)),read:sr(i*31+7)>0.4};
});

const ALERTS=genAlerts(20);

const genEngagements=(n)=>Array.from({length:n},(_,i)=>{
  const names=['Green Valley Coop','NutriGlobal Corp','FreshHarvest Ltd','AgriTech Partners','WaterWise Foundation','Regional Farm Bureau','CarbonSoil Cert','CGIAR Alliance','Farmers United','BioFoods Inc','Sustainable Coffee Co','Dairy Futures Ltd','AquaCulture Group','GrainBelt Assoc','Palm Oil Reform','Cocoa Alliance','Prairie Partners','Delta Agriculture','River Basin Council','Highland Ranchers','Forest Steward Co','Soil Health Institute','Pollinator Project','Fair Trade Network','Climate Smart Ag','Regenerative Fund','Blue Carbon Trust','Seed Innovation Lab','Livestock Welfare Co','Agri Insurance Pool','Green Bond Issuer','Impact Investors Ltd','Supply Chain Audit','Traceability Tech','Farm Finance Co','Micro-Irrigation Co','Biochar Ventures','Cover Crop Seeds','Compost Network','Rural Development Bank'];
  const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5),s4=sr(i*17+7);
  return{id:i,name:names[i%names.length],type:ENGAGEMENT_TYPES[Math.floor(s1*ENGAGEMENT_TYPES.length)],stage:ENGAGEMENT_STAGES[Math.floor(s2*ENGAGEMENT_STAGES.length)],priority:s3>0.6?'High':s3>0.3?'Medium':'Low',module:SUB_MODULES[Math.floor(s4*SUB_MODULES.length)].id,startDate:'2025-'+(1+Math.floor(sr(i*19+9)*12)).toString().padStart(2,'0')+'-'+(1+Math.floor(sr(i*23+11)*28)).toString().padStart(2,'0'),nextAction:['Schedule call','Send proposal','Site visit','Review data','Sign MoU','Verify outcomes','Renew agreement','Escalate to leadership'][Math.floor(sr(i*29+13)*8)],value:Math.floor(50+sr(i*31+15)*950),notes:'Engagement notes for '+names[i%names.length]};
});

const ENGAGEMENTS=genEngagements(40);

const genHoldings=(n)=>Array.from({length:n},(_,i)=>{
  const names=['AgriCo Holdings','FarmFirst REIT','Green Pastures Fund','CropLink Portfolio','Sustainable Ag ETF','Food Chain Capital','Water-Smart Fund','Bio-Ag Partners','Carbon Ag Credit','Precision Farm Co','Livestock Holdings','Dairy Basin Fund','Grain Corridor Trust','Tropical Ag Fund','Arid Zone Invest'];
  const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5);
  const crop=CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];
  return{id:i,name:names[i%names.length],crop,value:Math.floor(10+s2*190),riskScore:Math.floor(15+s3*80),waterRisk:Math.floor(10+sr(i*17+7)*85),biodivRisk:Math.floor(10+sr(i*19+9)*80),deforestRisk:Math.floor(5+sr(i*23+11)*70),soilRisk:Math.floor(10+sr(i*29+13)*60),emissionsIntensity:+(0.5+sr(i*31+15)*8).toFixed(1),regenAdoption:Math.floor(sr(i*37+17)*80)};
});

const HOLDINGS=genHoldings(30);

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Pill=({active,onClick,children})=><button onClick={onClick} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${active?T.gold:T.border}`,background:active?T.gold+'18':T.surface,color:active?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:active?600:400,cursor:'pointer',transition:'all 0.2s'}}>{children}</button>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',flex:1,minWidth:140}}><div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:color||T.navy}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:(color||T.sage)+'18',color:color||T.sage,marginRight:4,marginBottom:2}}>{children}</span>;

const TABS=['Executive Dashboard','Portfolio Agri Exposure','Engagement Pipeline','Board Report'];
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899'];

export default function AgriFinanceHubPage(){
  const [tab,setTab]=useState(0);
  const [audience,setAudience]=useState('Board / C-Suite');
  const [engStage,setEngStage]=useState('All');
  const [engType,setEngType]=useState('All');
  const [engModule,setEngModule]=useState('All');
  const [sortField,setSortField]=useState('value');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedEng,setSelectedEng]=useState(null);
  const [showAlerts,setShowAlerts]=useState(true);
  const [searchTerm,setSearchTerm]=useState('');
  const [page,setPage]=useState(0);
  const [exportFormat,setExportFormat]=useState('summary');

  const filteredEng=useMemo(()=>{
    let f=ENGAGEMENTS;
    if(engStage!=='All')f=f.filter(e=>e.stage===engStage);
    if(engType!=='All')f=f.filter(e=>e.type===engType);
    if(engModule!=='All')f=f.filter(e=>e.module===engModule);
    if(searchTerm)f=f.filter(e=>e.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir=sortDir==='asc'?1:-1;
    return [...f].sort((a,b)=>(a[sortField]>b[sortField]?dir:-dir));
  },[engStage,engType,engModule,sortField,sortDir,searchTerm]);

  const kpis=useMemo(()=>({
    regenOps:80,regenHectares:'184k',avgSoilSeq:'1.82 tCO2e/ha',foodCompanies:60,avgEmissionsIntensity:'3.24 tCO2e/$M',flagTargetPct:'42%',waterRegions:50,highWaterRisk:'38%',avgIrrigEfficiency:'58%',landParcels:40,totalCarbonStock:'2.4M tCO2e',netSink:'+62k tCO2e',biodivOps:60,avgMSA:'0.52',pollinatorRisk:'28% high',engagements:ENGAGEMENTS.length,activeEng:ENGAGEMENTS.filter(e=>['In Discussion','Committed','Implementing'].includes(e.stage)).length,alerts:ALERTS.filter(a=>!a.read).length,
  }),[]);

  const emissionsTrend=useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),foodSystem:Math.floor(850-yi*15+sr(yi*23)*20),landUse:Math.floor(120-yi*10+sr(yi*29)*15),water:Math.floor(45+yi*2+sr(yi*31)*5)})),[]);

  const riskProfile=useMemo(()=>RISK_DIMENSIONS.map((d,di)=>({dimension:d,score:Math.floor(25+sr(di*17+1)*55)})),[]);

  const moduleHealth=useMemo(()=>SUB_MODULES.map((m,mi)=>({name:m.id,fullName:m.name,score:Math.floor(55+sr(mi*23+3)*40),alerts:ALERTS.filter(a=>a.module===m.id).length,engagements:ENGAGEMENTS.filter(e=>e.module===m.id).length})),[]);

  const handleSort=useCallback((f)=>{if(sortField===f)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortField(f);setSortDir('desc');}},[sortField]);
  const PAGE_SIZE=10;

  const renderDashboard=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Regen Operations" value={kpis.regenOps} sub={kpis.regenHectares+' hectares'} color={T.sage}/>
        <KPI label="Food Companies" value={kpis.foodCompanies} sub={'intensity: '+kpis.avgEmissionsIntensity} color={T.red}/>
        <KPI label="Water Regions" value={kpis.waterRegions} sub={kpis.highWaterRisk+' high risk'} color={T.navy}/>
        <KPI label="Land Parcels" value={kpis.landParcels} sub={kpis.totalCarbonStock+' stock'} color={T.green}/>
        <KPI label="Biodiv Operations" value={kpis.biodivOps} sub={'avg MSA: '+kpis.avgMSA} color={T.gold}/>
        <KPI label="Active Engagements" value={kpis.activeEng+'/'+kpis.engagements} sub={kpis.alerts+' unread alerts'} color={T.amber}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Food System Emissions Trend (kt CO2e)</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={emissionsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Area type="monotone" dataKey="foodSystem" fill={T.red+'20'} stroke={T.red} strokeWidth={2} name="Food System"/>
              <Area type="monotone" dataKey="landUse" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Land Use"/>
              <Area type="monotone" dataKey="water" fill={T.navy+'20'} stroke={T.navy} strokeWidth={2} name="Water-Related"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Agri Risk Profile</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={riskProfile}>
              <PolarGrid stroke={T.borderL}/>
              <PolarAngleAxis dataKey="dimension" tick={{fontSize:10,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}} domain={[0,100]}/>
              <Radar dataKey="score" stroke={T.navy} fill={T.navy+'25'} strokeWidth={2}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Sub-Module Health</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={moduleHealth}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="score" name="Health Score" radius={[4,4,0,0]}>{moduleHealth.map((e,i)=><Cell key={i} fill={e.score>=70?T.green:e.score>=50?T.amber:T.red}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Engagement Stage Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={ENGAGEMENT_STAGES.map(s=>({name:s,value:ENGAGEMENTS.filter(e=>e.stage===s).length}))} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" nameKey="name" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {ENGAGEMENT_STAGES.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/><Legend/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {SUB_MODULES.map(m=>(
          <Card key={m.id} style={{cursor:'pointer',borderLeft:`3px solid ${m.color}`,transition:'background 0.15s'}}>
            <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
            <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>{m.id}</div>
            <div style={{fontWeight:600,fontSize:13,color:T.navy,marginBottom:4}}>{m.name}</div>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.4}}>{m.desc}</div>
            <div style={{marginTop:8,display:'flex',gap:8}}>
              <Badge color={m.color}>{moduleHealth.find(h=>h.name===m.id)?.score||0}% health</Badge>
              <Badge color={T.textMut}>{moduleHealth.find(h=>h.name===m.id)?.alerts||0} alerts</Badge>
            </div>
          </Card>
        ))}
      </div>

      {showAlerts&&<Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontWeight:600,fontSize:14,color:T.navy}}>Recent Alerts ({ALERTS.filter(a=>!a.read).length} unread)</div>
          <button onClick={()=>setShowAlerts(false)} style={{background:'none',border:'none',color:T.textMut,cursor:'pointer',fontSize:12}}>Hide</button>
        </div>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          {ALERTS.slice(0,12).map(a=>(
            <div key={a.id} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:`1px solid ${T.borderL}`,opacity:a.read?0.6:1}}>
              <Badge color={a.type==='Critical'?T.red:a.type==='Warning'?T.amber:a.type==='Action Required'?T.navy:T.textMut}>{a.type}</Badge>
              <Badge color={SUB_MODULES.find(m=>m.id===a.module)?.color||T.textMut}>{a.module}</Badge>
              <span style={{flex:1,fontSize:12,color:T.text}}>{a.message}</span>
              <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>{a.date}</span>
            </div>
          ))}
        </div>
      </Card>}
    </div>
  );

  const renderPortfolio=()=>{
    const cropExposure=CROP_TYPES.map(c=>{const h=HOLDINGS.filter(x=>x.crop===c);return{name:c,count:h.length,totalValue:h.reduce((a,x)=>a+x.value,0),avgRisk:h.length?Math.floor(h.reduce((a,x)=>a+x.riskScore,0)/h.length):0};}).filter(c=>c.count>0).sort((a,b)=>b.totalValue-a.totalValue);
    const riskOverlay=HOLDINGS.map(h=>({name:h.name.slice(0,12),water:h.waterRisk,biodiv:h.biodivRisk,deforest:h.deforestRisk,soil:h.soilRisk})).slice(0,15);

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Total Holdings" value={HOLDINGS.length} sub="agri-exposed" color={T.navy}/>
          <KPI label="Total Value" value={'$'+HOLDINGS.reduce((a,h)=>a+h.value,0)+'M'} sub="portfolio AUM" color={T.gold}/>
          <KPI label="Avg Risk Score" value={Math.floor(HOLDINGS.reduce((a,h)=>a+h.riskScore,0)/HOLDINGS.length)+'/100'} sub="composite" color={T.amber}/>
          <KPI label="Regen Adoption" value={Math.floor(HOLDINGS.reduce((a,h)=>a+h.regenAdoption,0)/HOLDINGS.length)+'%'} sub="avg across holdings" color={T.sage}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Crop Exposure ($M)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cropExposure}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="totalValue" fill={T.gold} name="Value $M" radius={[4,4,0,0]}/>
                <Bar dataKey="avgRisk" fill={T.red} name="Avg Risk" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Cross-Module Risk Overlay (Top 15)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskOverlay} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/>
                <YAxis type="category" dataKey="name" width={80} tick={{fontSize:9,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="water" stackId="a" fill={T.navy} name="Water"/>
                <Bar dataKey="biodiv" stackId="a" fill={T.sage} name="Biodiv"/>
                <Bar dataKey="deforest" stackId="a" fill={T.red} name="Deforest"/>
                <Bar dataKey="soil" stackId="a" fill={T.gold} name="Soil"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Holdings Detail</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Holding','Crop','Value $M','Risk Score','Water','Biodiv','Deforest','Regen %','Intensity'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,whiteSpace:'nowrap'}}>{h}</th>)}
              </tr></thead>
              <tbody>{HOLDINGS.map(h=>(
                <tr key={h.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px',fontWeight:500}}>{h.name}</td>
                  <td style={{padding:'6px'}}>{h.crop}</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>${h.value}M</td>
                  <td style={{padding:'6px'}}><div style={{width:50,height:6,background:T.borderL,borderRadius:3}}><div style={{width:`${h.riskScore}%`,height:6,background:h.riskScore>60?T.red:h.riskScore>35?T.amber:T.green,borderRadius:3}}/></div></td>
                  <td style={{padding:'6px',fontFamily:T.mono,color:h.waterRisk>60?T.red:T.textSec,fontSize:11}}>{h.waterRisk}</td>
                  <td style={{padding:'6px',fontFamily:T.mono,color:h.biodivRisk>60?T.red:T.textSec,fontSize:11}}>{h.biodivRisk}</td>
                  <td style={{padding:'6px',fontFamily:T.mono,color:h.deforestRisk>50?T.red:T.textSec,fontSize:11}}>{h.deforestRisk}</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{h.regenAdoption}%</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{h.emissionsIntensity}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderEngagement=()=>{
    const stageFlow=ENGAGEMENT_STAGES.map(s=>({stage:s,count:filteredEng.filter(e=>e.stage===s).length,value:filteredEng.filter(e=>e.stage===s).reduce((a,e)=>a+e.value,0)}));
    const typeBreakdown=ENGAGEMENT_TYPES.map(t=>({type:t.length>16?t.slice(0,16)+'...':t,count:filteredEng.filter(e=>e.type===t).length})).filter(t=>t.count>0);
    const engPage=Math.ceil(filteredEng.length/PAGE_SIZE);const pagedEng=filteredEng.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search engagements..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13,width:200}}/>
          <select value={engStage} onChange={e=>{setEngStage(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All Stages</option>{ENGAGEMENT_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={engType} onChange={e=>{setEngType(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All Types</option>{ENGAGEMENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select value={engModule} onChange={e=>{setEngModule(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All Modules</option>{SUB_MODULES.map(m=><option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
          </select>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{filteredEng.length} engagements</span>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Total Engagements" value={filteredEng.length} sub="filtered" color={T.navy}/>
          <KPI label="Active" value={filteredEng.filter(e=>['In Discussion','Committed','Implementing'].includes(e.stage)).length} sub="in progress" color={T.green}/>
          <KPI label="High Priority" value={filteredEng.filter(e=>e.priority==='High').length} sub="need attention" color={T.red}/>
          <KPI label="Total Value" value={'$'+filteredEng.reduce((a,e)=>a+e.value,0).toLocaleString()+'k'} sub="pipeline value" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Stage Progression</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stageFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}} angle={-20} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="count" fill={T.navy} name="Count" radius={[4,4,0,0]}/>
                <Bar dataKey="value" fill={T.gold} name="Value $k" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>By Engagement Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="type" width={110} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="count" fill={T.sage} radius={[0,4,4,0]} name="Engagements"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Engagement CRM</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {[{k:'name',l:'Entity'},{k:'type',l:'Type'},{k:'stage',l:'Stage'},{k:'priority',l:'Priority'},{k:'module',l:'Module'},{k:'value',l:'Value $k'},{k:'nextAction',l:'Next Action'}].map(({k,l})=>(
                  <th key={k} onClick={()=>handleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:sortField===k?T.navy:T.textSec,fontWeight:sortField===k?700:500,whiteSpace:'nowrap'}}>{l}{sortField===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
                ))}
              </tr></thead>
              <tbody>{pagedEng.map(e=>(
                <tr key={e.id} onClick={()=>setSelectedEng(e.id===selectedEng?null:e.id)} style={{borderBottom:`1px solid ${T.borderL}`,background:e.id===selectedEng?T.surfaceH:'transparent',cursor:'pointer'}}>
                  <td style={{padding:'6px',fontWeight:500}}>{e.name}</td>
                  <td style={{padding:'6px',fontSize:11}}>{e.type}</td>
                  <td style={{padding:'6px'}}><Badge color={['Implementing','Verified'].includes(e.stage)?T.green:['Committed','In Discussion'].includes(e.stage)?T.amber:T.textMut}>{e.stage}</Badge></td>
                  <td style={{padding:'6px'}}><Badge color={e.priority==='High'?T.red:e.priority==='Medium'?T.amber:T.textMut}>{e.priority}</Badge></td>
                  <td style={{padding:'6px'}}><Badge color={SUB_MODULES.find(m=>m.id===e.module)?.color}>{e.module}</Badge></td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{e.value}</td>
                  <td style={{padding:'6px',fontSize:11}}>{e.nextAction}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {engPage>1&&<div style={{display:'flex',gap:8,marginTop:12,justifyContent:'center'}}>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,fontFamily:T.font,fontSize:12,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>Prev</button>
            <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>{page+1}/{engPage}</span>
            <button onClick={()=>setPage(p=>Math.min(engPage-1,p+1))} disabled={page>=engPage-1} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,fontFamily:T.font,fontSize:12,cursor:page>=engPage-1?'default':'pointer',opacity:page>=engPage-1?0.4:1}}>Next</button>
          </div>}
        </Card>
      </div>
    );
  };

  const renderBoardReport=()=>{
    const flagProgress=[{target:'Beef sector -30%',progress:22,deadline:'2030'},{target:'Dairy sector -25%',progress:18,deadline:'2030'},{target:'Rice methane -40%',progress:12,deadline:'2035'},{target:'Palm oil deforestation-free',progress:65,deadline:'2025'},{target:'Soy conversion halt',progress:48,deadline:'2025'},{target:'Cocoa living income',progress:35,deadline:'2028'}];
    const sectionReady=BOARD_SECTIONS.map((s,si)=>({section:s,status:sr(si*17+1)>0.3?'Ready':'Draft',pages:Math.floor(1+sr(si*23+3)*4),lastUpdated:'2026-03-'+(15+Math.floor(sr(si*29+5)*13))}));

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
          <label style={{fontSize:12,color:T.textSec}}>Audience:</label>
          {AUDIENCE_MODES.map(a=><Pill key={a} active={audience===a} onClick={()=>setAudience(a)}>{a}</Pill>)}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:12}}>
              <option value="summary">Summary PDF</option><option value="detailed">Detailed PDF</option><option value="csv">Data CSV</option><option value="pptx">Board Slides</option>
            </select>
            <button style={{padding:'6px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontFamily:T.font,fontSize:12,cursor:'pointer'}}>Export</button>
          </div>
        </div>

        <Card style={{marginBottom:20,borderLeft:`3px solid ${T.gold}`}}>
          <div style={{fontWeight:700,fontSize:16,color:T.navy,marginBottom:8}}>Board Report — Food Systems & Agricultural Finance</div>
          <div style={{fontSize:13,color:T.textSec,marginBottom:12}}>Audience: {audience} | Generated: 2026-03-28 | Sprint AT Module Suite</div>
          <div style={{fontSize:13,color:T.text,lineHeight:1.7}}>
            {audience==='Board / C-Suite'&&<>Portfolio exposure spans {kpis.regenOps} regenerative operations across {kpis.regenHectares} hectares, {kpis.foodCompanies} food companies, {kpis.waterRegions} water-stressed regions, {kpis.landParcels} land parcels holding {kpis.totalCarbonStock} carbon stock, and {kpis.biodivOps} biodiversity-monitored operations. Net annual sequestration is {kpis.netSink}. FLAG target adoption at {kpis.flagTargetPct}. {kpis.alerts} items require board attention.</>}
            {audience==='Investment Committee'&&<>Agricultural finance exposure totals ${HOLDINGS.reduce((a,h)=>a+h.value,0)}M across {HOLDINGS.length} holdings. Average composite risk score: {Math.floor(HOLDINGS.reduce((a,h)=>a+h.riskScore,0)/HOLDINGS.length)}/100. Water risk is the primary driver at {kpis.highWaterRisk} of regions rated high-risk. Carbon credit revenue potential: projected annual. Engagement pipeline: {kpis.activeEng} active engagements valued at ${ENGAGEMENTS.reduce((a,e)=>a+e.value,0).toLocaleString()}k.</>}
            {audience==='ESG / Sustainability'&&<>Sustainability metrics across 5 sub-modules: avg soil sequestration {kpis.avgSoilSeq}, food system emissions intensity {kpis.avgEmissionsIntensity}, irrigation efficiency {kpis.avgIrrigEfficiency}, average MSA score {kpis.avgMSA}, and {kpis.pollinatorRisk} operations at high pollinator risk. FLAG targets set by {kpis.flagTargetPct} of tracked companies. Regenerative practice adoption continues trending upward.</>}
            {audience==='Operations / Supply Chain'&&<>Operational dashboard: {kpis.regenOps} farming operations tracked, {kpis.foodCompanies} supply chain companies monitored. Traceability coverage varies. Engagement pipeline has {filteredEng.length} active relationships across farmer cooperatives, food companies, input suppliers and financial institutions. {ALERTS.filter(a=>a.type==='Action Required').length} action items pending.</>}
          </div>
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>FLAG Target Progress</div>
            {flagProgress.map((f,i)=>(
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:T.textSec}}>{f.target}</span>
                  <span style={{fontFamily:T.mono,color:T.navy}}>{f.progress}% (by {f.deadline})</span>
                </div>
                <div style={{width:'100%',height:8,background:T.borderL,borderRadius:4}}>
                  <div style={{width:`${f.progress}%`,height:8,background:f.progress>=50?T.green:f.progress>=25?T.amber:T.red,borderRadius:4}}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Report Section Status</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
                <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                  <th style={{padding:'6px',textAlign:'left',color:T.textSec}}>Section</th>
                  <th style={{padding:'6px',textAlign:'center',color:T.textSec}}>Status</th>
                  <th style={{padding:'6px',textAlign:'center',color:T.textSec}}>Pages</th>
                  <th style={{padding:'6px',textAlign:'right',color:T.textSec}}>Updated</th>
                </tr></thead>
                <tbody>{sectionReady.map((s,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                    <td style={{padding:'6px',fontWeight:500}}>{s.section}</td>
                    <td style={{padding:'6px',textAlign:'center'}}><Badge color={s.status==='Ready'?T.green:T.amber}>{s.status}</Badge></td>
                    <td style={{padding:'6px',textAlign:'center',fontFamily:T.mono}}>{s.pages}</td>
                    <td style={{padding:'6px',textAlign:'right',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{s.lastUpdated}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>12 Key KPIs — Food Systems & Agricultural Finance</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {l:'Regen Operations',v:kpis.regenOps,c:T.sage},{l:'Hectares Under Mgmt',v:kpis.regenHectares,c:T.sage},{l:'Avg Soil Seq',v:kpis.avgSoilSeq,c:T.green},
              {l:'Food Companies',v:kpis.foodCompanies,c:T.red},{l:'Emissions Intensity',v:kpis.avgEmissionsIntensity,c:T.red},{l:'FLAG Targets',v:kpis.flagTargetPct,c:T.green},
              {l:'Water Regions',v:kpis.waterRegions,c:T.navy},{l:'High Water Risk',v:kpis.highWaterRisk,c:T.amber},{l:'Total Carbon Stock',v:kpis.totalCarbonStock,c:T.green},
              {l:'Biodiv Ops',v:kpis.biodivOps,c:T.gold},{l:'Avg MSA',v:kpis.avgMSA,c:T.gold},{l:'Active Engagements',v:kpis.activeEng+'/'+kpis.engagements,c:T.navy},
            ].map((k,i)=>(
              <div key={i} style={{textAlign:'center',padding:12,background:k.c+'08',borderRadius:6,border:`1px solid ${k.c}20`}}>
                <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{k.l}</div>
              </div>
            ))}
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
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:1}}>EP-AT6</span>
            <span style={{width:4,height:4,borderRadius:2,background:T.gold}}/>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FOOD SYSTEMS & AGRICULTURAL FINANCE</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Agri-Finance Hub</h1>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Executive dashboard aggregating 5 sub-modules: regenerative agriculture, food emissions, water risk, land carbon & biodiversity</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><Pill key={t} active={tab===i} onClick={()=>setTab(i)}>{t}</Pill>)}
        </div>

        {tab===0&&renderDashboard()}
        {tab===1&&renderPortfolio()}
        {tab===2&&renderEngagement()}
        {tab===3&&renderBoardReport()}
      </div>
    </div>
  );
}