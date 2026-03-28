import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Data Catalog','Quality Assessment','Coverage Gap Analyzer','Data Stack Builder'];
const CATEGORIES=['Satellite Imagery','Emissions Data','ESG Ratings','Geospatial Analytics','Physical Risk','Transition Risk','Nature & Biodiversity','Social & Governance','Supply Chain','Carbon Markets','Climate Finance','Alternative Signals'];
const QUALITY_DIMS=['Coverage','Accuracy','Timeliness','Completeness','Consistency','Granularity','Auditability','Methodology'];
const PRICING=['Free Tier','$10K-25K/yr','$25K-75K/yr','$75K-150K/yr','$150K-300K/yr','$300K+/yr'];
const USE_CASES=['Financed Emissions','Physical Risk','Nature & Biodiversity','Social Impact'];
const STRATEGIES=['ESG Integration','Impact Investing','Climate Transition','Physical Risk Mgmt','Net Zero Alignment','Regulatory Compliance'];
const FRESHNESS_LABELS=['Hourly','Daily','Weekly','Monthly','Quarterly','Semi-annual','Annual'];
const INTEGRATION_TYPES=['REST API','Bulk Download','SFTP','Streaming','SDK','Manual Export'];

const mkProviders=()=>{
  const names=[
    ['Planet Labs','Satellite Imagery','Global satellite imagery with 3m resolution daily revisit. PlanetScope, SkySat constellations for land-use change, deforestation, and infrastructure monitoring.','Daily'],
    ['Maxar Technologies','Satellite Imagery','Very high-resolution satellite imagery (30cm) and geospatial analytics. WorldView constellation for asset-level physical risk verification.','Daily'],
    ['Airbus Defence & Space','Satellite Imagery','Pleiades Neo & SPOT constellation data at 30cm-1.5m resolution. Tasking and archive access for environmental monitoring campaigns.','Daily'],
    ['BlackBridge (Planet)','Satellite Imagery','RapidEye 5-band multi-spectral archive for agricultural and vegetation health. Historical baselines from 2009-present.','Weekly'],
    ['Satellogic','Satellite Imagery','Sub-meter resolution hyperspectral imagery covering 70+ spectral bands. Ideal for methane plume detection and mineral mapping.','Daily'],
    ['Climate TRACE','Emissions Data','Independent, facility-level GHG emissions tracking for 352M+ assets globally. Uses satellite and AI to verify self-reported data.','Monthly'],
    ['GHGSat','Emissions Data','High-resolution satellite methane and CO2 monitoring. Facility-level detection at 25m resolution for oil/gas and industrial sites.','Weekly'],
    ['Kayrros','Emissions Data','Methane super-emitter detection and industrial activity monitoring from satellite. Covers upstream O&G and LNG infrastructure.','Weekly'],
    ['Carbon Tracker','Emissions Data','Asset-level emissions data for fossil fuel companies. Coal, oil, gas production economics and stranded asset risk analytics.','Quarterly'],
    ['Watershed','Emissions Data','Enterprise carbon accounting platform with Scope 1/2/3 measurement. Supplier engagement tools and reduction pathway modeling.','Monthly'],
    ['MSCI ESG','ESG Ratings','ESG ratings, climate metrics, and controversy flags for 8,500+ companies. Industry-adjusted scoring on 35 key issues.','Monthly'],
    ['Sustainalytics','ESG Ratings','ESG risk ratings covering 40,000+ companies. Unmanaged risk scores with controversy and product involvement research.','Monthly'],
    ['S&P Global ESG','ESG Ratings','Corporate Sustainability Assessment (CSA) scores for 13,000 companies. Sector-specific questionnaires with financial materiality weighting.','Monthly'],
    ['ISS ESG','ESG Ratings','Governance quality scores and ESG ratings. Proxy voting analytics and norm-based screening for responsible investment.','Monthly'],
    ['CDP','ESG Ratings','Environmental disclosure system for 23,000+ companies. Climate change, water security, and deforestation questionnaire scores.','Annual'],
    ['Orbital Insight','Geospatial Analytics','AI-powered geospatial analytics from satellite, IoT and cellular data. Economic activity indicators and supply chain monitoring.','Daily'],
    ['Descartes Labs','Geospatial Analytics','Cloud-native geospatial intelligence platform. Climate exposure analytics, crop forecasting, and natural resource monitoring at scale.','Daily'],
    ['RS Metrics','Geospatial Analytics','Satellite-based analytics for real estate, retail, and metals. Rooftop solar adoption, parking lot fill rates, commodity stockpiles.','Weekly'],
    ['Ursa Space Systems','Geospatial Analytics','Synthetic Aperture Radar (SAR) analytics platform. All-weather, day-night monitoring of oil storage, construction, and ground movement.','Daily'],
    ['Spire Global','Geospatial Analytics','Maritime AIS, aviation ADS-B, and weather data. Supply chain vessel tracking and climate-related weather pattern analytics.','Hourly'],
    ['Four Twenty Seven','Physical Risk','Physical climate risk scores for 2M+ assets. Flood, heat stress, hurricane, wildfire, sea level rise exposure at facility level.','Quarterly'],
    ['Jupiter Intelligence','Physical Risk','Hyper-local climate risk analytics and probabilistic predictions. Forward-looking peril models for flood, wind, heat, fire through 2100.','Monthly'],
    ['Cervest','Physical Risk','EarthScan platform for asset-level climate risk intelligence. Physical risk ratings for real estate, agriculture, infrastructure assets.','Monthly'],
    ['XDI','Physical Risk','Cross Dependency Initiative physical risk analytics. Infrastructure interdependency modeling and adaptation cost estimation.','Quarterly'],
    ['Moody\'s Climate','Physical Risk','Integrated physical and transition risk solutions. RMS catastrophe models combined with climate scenario pathways.','Monthly'],
    ['Carbon Delta','Transition Risk','Climate value-at-risk (CVaR) analytics for equities and fixed income. Scenario-based transition cost estimation by sector.','Quarterly'],
    ['Planetrics','Transition Risk','Scenario-based transition risk models aligned to NGFS. Company-level revenue impact from carbon pricing and technology shifts.','Quarterly'],
    ['Vivid Economics','Transition Risk','Transition pathway analytics and green taxonomy alignment. Sector decarbonization roadmaps and policy impact assessment.','Quarterly'],
    ['NGFS Scenarios','Transition Risk','Central bank network climate scenario data. Standardized macro-financial scenarios: orderly, disorderly, hothouse pathways.','Semi-annual'],
    ['Riskthinking.AI','Transition Risk','AI-driven climate risk scenarios integrating physical and transition factors. Portfolio stress testing and regulatory scenario analysis.','Monthly'],
    ['TNFD LEAP','Nature & Biodiversity','Nature-related risk framework data aligned to TNFD. Locate-Evaluate-Assess-Prepare methodology for biodiversity dependencies.','Quarterly'],
    ['ENCORE','Nature & Biodiversity','Natural capital dependencies and impact database. Maps sector dependencies on 21 ecosystem services with materiality ratings.','Semi-annual'],
    ['Global Forest Watch','Nature & Biodiversity','Near-real-time forest change monitoring from satellite data. Tree cover loss alerts, fire detection, and deforestation drivers.','Weekly'],
    ['Ocean Mind','Nature & Biodiversity','AI-powered illegal fishing detection and ocean monitoring. Vessel tracking analytics for sustainable seafood supply chain due diligence.','Daily'],
    ['NatureMetrics','Nature & Biodiversity','Environmental DNA (eDNA) biodiversity measurement. Species presence/absence data from water and soil samples at asset locations.','Quarterly'],
    ['Equileap','Social & Governance','Gender equality and diversity scoring for 4,000+ companies. 19-criteria framework covering pay equity, leadership, and policies.','Annual'],
    ['RepRisk','Social & Governance','Daily ESG risk incident monitoring from 100K+ public sources. AI-curated controversy alerts with severity and reach scoring.','Daily'],
    ['Refinitiv ESG','Social & Governance','ESG data and controversy alerts for 12,000+ companies. 630+ data points covering environmental, social, governance pillars.','Weekly'],
    ['Glassdoor ESG','Social & Governance','Employee sentiment analytics and workplace culture data. CEO approval, benefits ratings, and diversity perception from 70M+ reviews.','Monthly'],
    ['Arabesque S-Ray','Social & Governance','AI-driven ESG performance scoring using big data and machine learning. GC Score for UN Global Compact compliance assessment.','Monthly'],
    ['Sourcemap','Supply Chain','Supply chain mapping and transparency platform. Multi-tier supplier visualization with carbon footprint and risk assessment tools.','Monthly'],
    ['Altana AI','Supply Chain','Global supply chain intelligence from trade, shipping, and corporate data. Forced labor risk screening and origin verification.','Weekly'],
    ['TrusTrace','Supply Chain','Product traceability platform for fashion and consumer goods. Material origin verification and chemical compliance tracking.','Monthly'],
    ['EcoVadis','Supply Chain','Sustainability ratings platform for 100,000+ suppliers. Scorecards covering environment, labor, ethics, and procurement practices.','Quarterly'],
    ['Sedex','Supply Chain','Ethical supply chain audit data from 85,000+ sites globally. SMETA audit results, corrective action tracking, risk mapping.','Quarterly'],
    ['Xpansiv CBL','Carbon Markets','Carbon credit pricing, volume, and registry data. Real-time spot and forward pricing for nature-based and tech removal credits.','Daily'],
    ['ICE Endex','Carbon Markets','EU ETS allowance and carbon futures data. EUA, CER pricing with full order book depth and historical volatility analytics.','Hourly'],
    ['Verra Registry','Carbon Markets','Verified Carbon Standard (VCS) project registry data. Issuance, retirement, and buffer pool statistics for 2,000+ projects.','Weekly'],
    ['Gold Standard','Carbon Markets','Gold Standard carbon credit certification data. Project pipeline, methodology approvals, and SDG impact quantification.','Weekly'],
    ['Puro.earth','Carbon Markets','Carbon removal marketplace data for biochar, BECCS, enhanced weathering. Removal credit pricing and supplier quality ratings.','Weekly'],
    ['Climate Bonds Init.','Climate Finance','Green bond certification database and market analytics. Taxonomy alignment assessment for 30+ sector eligibility criteria.','Monthly'],
    ['Bloomberg NEF','Climate Finance','New energy finance data covering $1.8T+ annual investment. Clean energy, transport, industry decarbonization deal and project tracking.','Daily'],
    ['IEA Data','Climate Finance','International Energy Agency statistics. World Energy Outlook scenarios, energy balances, and technology cost trajectories.','Monthly'],
    ['IRENA','Climate Finance','Renewable energy capacity, generation, and cost statistics. Global and country-level deployment data for solar, wind, hydro, biomass.','Quarterly'],
    ['Green Finance Inst.','Climate Finance','UK green finance marketplace data and coalition analytics. Green mortgage, retrofit financing, and nature-based investment tracking.','Quarterly'],
    ['Quandl Alt Data','Alternative Signals','Alternative financial datasets including satellite, web, sentiment. ESG-relevant signals from non-traditional sources for quant strategies.','Daily'],
    ['Preqin ESG','Alternative Signals','Private markets ESG data for PE, VC, infrastructure, real estate. Fund-level ESG policies, SFDR classification, and impact metrics.','Monthly'],
    ['Truvalue Labs','Alternative Signals','AI-driven ESG event signals from unstructured data. Real-time materiality-mapped signals across 26 SASB categories.','Daily'],
    ['Clarity AI','Alternative Signals','Sustainability impact analytics for 70,000+ companies. PAI calculations, EU Taxonomy alignment, and SDG contribution scores.','Weekly'],
    ['SatelliteVu','Alternative Signals','Thermal infrared satellite emissions data at building level. Energy waste detection and Scope 1/2 verification from space.','Daily'],
  ];
  return names.map((n,i)=>{
    const qs=QUALITY_DIMS.map((_,d)=>Math.round(55+sr(i*8+d)*40));
    const avg=Math.round(qs.reduce((a,b)=>a+b,0)/qs.length);
    const intTypes=INTEGRATION_TYPES.filter((_,t)=>sr(i*31+t)>0.45);
    return{
      id:i,name:n[0],category:n[1],desc:n[2],freshness:n[3],
      quality:qs,qualityAvg:avg,
      pricing:PRICING[Math.floor(sr(i*3)*5)+1],
      apiAvail:sr(i*7)>0.3,
      coverage:['Global','Regional','National','Asset-level'][Math.floor(sr(i*5)*4)],
      records:Math.round(1e4+sr(i*11)*5e6),
      useCases:USE_CASES.filter((_,u)=>sr(i*13+u)>0.4),
      sampleFields:['entity_id','timestamp','value','unit','confidence','source','methodology','lat','lon','sector_code'].filter((_,f)=>sr(i*17+f)>0.3),
      trend:[Math.round(60+sr(i*19)*25),Math.round(63+sr(i*21)*27),Math.round(66+sr(i*23)*28),Math.round(68+sr(i*25)*30)],
      integrationTypes:intTypes.length>0?intTypes:['REST API'],
      sla:['99.5%','99.9%','99.0%','99.95%'][Math.floor(sr(i*37)*4)],
      latency:['<1s','<5s','<30s','<1min','Batch'][Math.floor(sr(i*41)*5)],
      historyYears:Math.round(2+sr(i*43)*18),
      customers:Math.round(50+sr(i*47)*950),
      lastUpdated:['2026-03-15','2026-03-10','2026-02-28','2026-03-20','2026-01-31'][Math.floor(sr(i*53)*5)],
      certifications:['ISO 27001','SOC 2','GDPR','PCAF','TCFD Aligned','GRI Standard'].filter((_,c)=>sr(i*59+c)>0.55),
    };
  });
};
const PROVIDERS=mkProviders();

const mkGapMatrix=()=>{
  return USE_CASES.map((uc,ui)=>{
    const reqs=[
      'Scope 1 Emissions','Scope 2 Emissions','Scope 3 Emissions','Physical Asset Coordinates',
      'Supply Chain Mapping','Geolocation & Proximity','Financial Exposure Data','Sector/NACE Classification',
      'Biodiversity Impact Scores','Water Stress Indicators','Social Impact Metrics','Governance Quality Scores'
    ];
    return{useCase:uc,requirements:reqs.map((r,ri)=>{
      const v=sr(ui*12+ri);
      const providers=PROVIDERS.filter((_,pi)=>sr(ui*60+ri*5+pi)>0.7).slice(0,4).map(p=>p.name);
      return{
        name:r,
        status:v>0.6?'covered':v>0.3?'partial':'gap',
        providers,
        costToFill:v<0.3?Math.round(20+sr(ui*99+ri)*80)+'K':null,
        priority:v<0.3?'High':v<0.6?'Medium':'Low',
        dataPoints:Math.round(100+sr(ui*77+ri)*900)+'K',
        confidence:Math.round(40+v*55)
      };
    })};
  });
};
const GAP_MATRIX=mkGapMatrix();

const mkStackRecommendations=()=>{
  return STRATEGIES.map((s,si)=>{
    const rec=PROVIDERS.filter((_,pi)=>sr(si*60+pi)>0.55).slice(0,10);
    return{
      strategy:s,
      providers:rec.map(p=>({
        ...p,
        priority:sr(si*100+p.id)>0.5?'Core':'Optional',
        integrationDays:Math.round(5+sr(si*200+p.id)*25),
        annualCost:Math.round(10+sr(p.id*7+si)*60)
      })),
      totalCost:Math.round(80+sr(si*300)*320)+'K',
      complexity:['Low','Medium','High'][Math.floor(sr(si*400)*3)],
      description:[
        'Integrate ESG data across equity and fixed income portfolios with comprehensive ratings coverage.',
        'Build impact measurement stack with outcome-oriented data for SDG-aligned investing strategies.',
        'Focus on transition pathway data with scenario analysis and carbon pricing exposure metrics.',
        'Prioritize physical risk data with asset-level geospatial analytics and catastrophe modeling.',
        'Comprehensive emissions and target tracking data for portfolio net zero alignment and reporting.',
        'Regulatory-focused data stack covering CSRD, SFDR, SEC Climate, and TCFD disclosure requirements.'
      ][si]
    };
  });
};
const STACK_RECS=mkStackRecommendations();

/* ---- Shared Components ---- */
const Card=({children,style,...p})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}} {...p}>{children}</div>
);

const Badge=({children,color=T.navy,bg})=>(
  <span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,color,background:bg||T.surfaceH,fontFamily:T.font}}>{children}</span>
);

const Btn=({children,active,onClick,style})=>(
  <button onClick={onClick} style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.text,fontFamily:T.font,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s',...style}}>{children}</button>
);

const StatusDot=({status})=>{
  const c=status==='covered'?T.green:status==='partial'?T.amber:T.red;
  return <span style={{display:'inline-block',width:10,height:10,borderRadius:5,background:c,marginRight:6}}/>;
};

const MetricBox=({label,value,color,sub})=>(
  <div style={{textAlign:'center'}}>
    <div style={{fontSize:24,fontWeight:800,color:color||T.navy,fontFamily:T.font}}>{value}</div>
    <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:T.textMut,marginTop:1}}>{sub}</div>}
  </div>
);

const ProgressBar=({value,max=100,color=T.navy,height=6})=>(
  <div style={{height,borderRadius:height/2,background:T.surfaceH,overflow:'hidden'}}>
    <div style={{height:'100%',borderRadius:height/2,background:color,width:`${Math.min(100,value/max*100)}%`,transition:'width 0.3s'}}/>
  </div>
);

/* ---- TAB 1: Data Catalog ---- */
const DataCatalog=({onSelect,selectedProvider})=>{
  const[search,setSearch]=useState('');
  const[catFilter,setCatFilter]=useState('All');
  const[qualThreshold,setQualThreshold]=useState(0);
  const[sortBy,setSortBy]=useState('name');
  const[viewMode,setViewMode]=useState('grid');

  const filtered=useMemo(()=>{
    let list=PROVIDERS.filter(p=>{
      if(search&&!p.name.toLowerCase().includes(search.toLowerCase())&&!p.desc.toLowerCase().includes(search.toLowerCase())&&!p.category.toLowerCase().includes(search.toLowerCase()))return false;
      if(catFilter!=='All'&&p.category!==catFilter)return false;
      if(p.qualityAvg<qualThreshold)return false;
      return true;
    });
    if(sortBy==='quality')list=[...list].sort((a,b)=>b.qualityAvg-a.qualityAvg);
    else if(sortBy==='name')list=[...list].sort((a,b)=>a.name.localeCompare(b.name));
    else if(sortBy==='category')list=[...list].sort((a,b)=>a.category.localeCompare(b.category));
    return list;
  },[search,catFilter,qualThreshold,sortBy]);

  const catCounts=useMemo(()=>{
    const m={};PROVIDERS.forEach(p=>{m[p.category]=(m[p.category]||0)+1;});return m;
  },[]);

  const catDistribution=useMemo(()=>CATEGORIES.map(c=>({
    name:c.length>14?c.slice(0,14)+'...':c,fullName:c,count:catCounts[c]||0
  })),[catCounts]);

  return <div style={{display:'flex',gap:20,minHeight:600}}>
    <div style={{flex:1}}>
      {/* Filters Row */}
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search providers, categories, descriptions..."
          style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:13,width:260,outline:'none'}}/>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:13,background:T.surface,outline:'none'}}>
          <option value="All">All Categories ({PROVIDERS.length})</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c} ({catCounts[c]||0})</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:13,background:T.surface,outline:'none'}}>
          <option value="name">Sort: Name</option>
          <option value="quality">Sort: Quality</option>
          <option value="category">Sort: Category</option>
        </select>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:T.textSec}}>Min Quality: {qualThreshold}</span>
          <input type="range" min={0} max={95} value={qualThreshold} onChange={e=>setQualThreshold(+e.target.value)} style={{width:100}}/>
        </div>
        <div style={{display:'flex',gap:2}}>
          <button onClick={()=>setViewMode('grid')} style={{padding:'6px 10px',borderRadius:'6px 0 0 6px',border:`1px solid ${T.border}`,background:viewMode==='grid'?T.navy:'transparent',color:viewMode==='grid'?'#fff':T.textMut,fontSize:11,cursor:'pointer',fontFamily:T.font}}>Grid</button>
          <button onClick={()=>setViewMode('list')} style={{padding:'6px 10px',borderRadius:'0 6px 6px 0',border:`1px solid ${T.border}`,borderLeft:'none',background:viewMode==='list'?T.navy:'transparent',color:viewMode==='list'?'#fff':T.textMut,fontSize:11,cursor:'pointer',fontFamily:T.font}}>List</button>
        </div>
        <Badge bg={T.surfaceH} color={T.textSec}>{filtered.length} providers</Badge>
      </div>

      {/* Category distribution mini-bar */}
      <Card style={{padding:'10px 16px',marginBottom:16}}>
        <div style={{display:'flex',gap:2,height:24,borderRadius:4,overflow:'hidden'}}>
          {catDistribution.map((c,i)=><div key={c.fullName} title={`${c.fullName}: ${c.count}`}
            style={{flex:c.count,background:[T.navy,T.gold,T.sage,T.navyL,T.amber,T.teal,'#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'][i%12],
              cursor:'pointer',transition:'opacity 0.2s',opacity:catFilter==='All'||catFilter===c.fullName?1:0.3}}
            onClick={()=>setCatFilter(catFilter===c.fullName?'All':c.fullName)}/>)}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:10,color:T.textMut}}>
          <span>Category distribution (click to filter)</span>
          <span>{CATEGORIES.length} categories</span>
        </div>
      </Card>

      {/* Provider Cards */}
      {viewMode==='grid'?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:14}}>
          {filtered.map(p=><Card key={p.id} style={{cursor:'pointer',border:`1px solid ${selectedProvider?.id===p.id?T.navy:T.border}`,transition:'all 0.2s'}} onClick={()=>onSelect(p)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:14,color:T.navy,fontFamily:T.font,flex:1}}>{p.name}</div>
              <div style={{background:p.qualityAvg>=80?'#dcfce7':p.qualityAvg>=65?'#fef9c3':'#fee2e2',color:p.qualityAvg>=80?T.green:p.qualityAvg>=65?T.amber:T.red,padding:'2px 8px',borderRadius:8,fontSize:11,fontWeight:700,marginLeft:8}}>{p.qualityAvg}</div>
            </div>
            <Badge color={T.navyL}>{p.category}</Badge>
            <p style={{fontSize:12,color:T.textSec,margin:'8px 0 6px',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.desc}</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:11,color:T.textMut,marginBottom:6}}>
              <span>{p.coverage}</span><span>|</span><span>{p.freshness}</span><span>|</span><span>{p.pricing}</span>
            </div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {p.apiAvail&&<Badge color={T.sage} bg="#dcfce7">API</Badge>}
              {p.certifications.slice(0,2).map(c=><Badge key={c} color={T.textMut} bg={T.surfaceH}>{c}</Badge>)}
            </div>
            <ProgressBar value={p.qualityAvg} color={p.qualityAvg>=80?T.green:p.qualityAvg>=65?T.amber:T.red} height={3}/>
          </Card>)}
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {filtered.map(p=><Card key={p.id} style={{cursor:'pointer',padding:'12px 16px',border:`1px solid ${selectedProvider?.id===p.id?T.navy:T.border}`}} onClick={()=>onSelect(p)}>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{flex:'0 0 200px',fontWeight:700,fontSize:13,color:T.navy}}>{p.name}</div>
              <Badge color={T.navyL}>{p.category}</Badge>
              <div style={{flex:1,fontSize:12,color:T.textSec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.desc}</div>
              <span style={{fontSize:11,color:T.textMut,flex:'0 0 80px'}}>{p.coverage}</span>
              <span style={{fontSize:11,color:T.textMut,flex:'0 0 60px'}}>{p.freshness}</span>
              <span style={{fontSize:11,color:T.textMut,flex:'0 0 90px'}}>{p.pricing}</span>
              <div style={{background:p.qualityAvg>=80?'#dcfce7':p.qualityAvg>=65?'#fef9c3':'#fee2e2',color:p.qualityAvg>=80?T.green:p.qualityAvg>=65?T.amber:T.red,padding:'2px 8px',borderRadius:8,fontSize:11,fontWeight:700,flex:'0 0 36px',textAlign:'center'}}>{p.qualityAvg}</div>
            </div>
          </Card>)}
        </div>
      )}
    </div>

    {/* Detail Panel */}
    {selectedProvider&&<div style={{width:380,position:'sticky',top:20,alignSelf:'flex-start'}}>
      <Card style={{borderColor:T.navy}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0,fontSize:16,color:T.navy,fontFamily:T.font}}>{selectedProvider.name}</h3>
          <button onClick={()=>onSelect(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:T.textMut}}>x</button>
        </div>
        <Badge>{selectedProvider.category}</Badge>
        <p style={{fontSize:12,color:T.textSec,margin:'10px 0',lineHeight:1.5}}>{selectedProvider.desc}</p>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Data Dictionary</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {selectedProvider.sampleFields.map(f=><span key={f} style={{padding:'2px 8px',borderRadius:6,background:T.surfaceH,fontSize:11,fontFamily:T.mono,color:T.textSec}}>{f}</span>)}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Coverage & Freshness</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
            <div><span style={{color:T.textMut}}>Scope:</span> {selectedProvider.coverage}</div>
            <div><span style={{color:T.textMut}}>Update:</span> {selectedProvider.freshness}</div>
            <div><span style={{color:T.textMut}}>Records:</span> {(selectedProvider.records/1e3).toFixed(0)}K+</div>
            <div><span style={{color:T.textMut}}>API:</span> {selectedProvider.apiAvail?'Yes':'No'}</div>
            <div><span style={{color:T.textMut}}>SLA:</span> {selectedProvider.sla}</div>
            <div><span style={{color:T.textMut}}>Latency:</span> {selectedProvider.latency}</div>
            <div><span style={{color:T.textMut}}>History:</span> {selectedProvider.historyYears}yr</div>
            <div><span style={{color:T.textMut}}>Clients:</span> {selectedProvider.customers}+</div>
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Integration Methods</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {selectedProvider.integrationTypes.map(t=><Badge key={t} color={T.navyL} bg="rgba(44,90,140,0.08)">{t}</Badge>)}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Quality Radar</div>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={QUALITY_DIMS.map((d,i)=>({dim:d,score:selectedProvider.quality[i]}))}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
                <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
                <Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Use Cases</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {selectedProvider.useCases.map(u=><Badge key={u} color={T.sage} bg="#dcfce7">{u}</Badge>)}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Certifications</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {selectedProvider.certifications.length>0?selectedProvider.certifications.map(c=><Badge key={c} color={T.gold} bg="rgba(197,169,106,0.12)">{c}</Badge>)
            :<span style={{fontSize:11,color:T.textMut}}>No certifications listed</span>}
          </div>
        </div>

        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.navy}}>Pricing</div>
            <div style={{fontSize:15,fontWeight:700,color:T.gold}}>{selectedProvider.pricing}</div>
          </div>
          <div style={{fontSize:10,color:T.textMut}}>Updated: {selectedProvider.lastUpdated}</div>
        </div>
      </Card>
    </div>}
  </div>;
};

/* ---- TAB 2: Quality Assessment ---- */
const QualityAssessment=()=>{
  const[selectedIds,setSelectedIds]=useState([0,10,15]);
  const[benchCat,setBenchCat]=useState('All');
  const[searchProv,setSearchProv]=useState('');

  const toggleProvider=useCallback((id)=>{
    setSelectedIds(prev=>{
      if(prev.includes(id))return prev.filter(x=>x!==id);
      if(prev.length>=3)return prev;
      return[...prev,id];
    });
  },[]);

  const compProviders=selectedIds.map(id=>PROVIDERS[id]);
  const radarColors=[T.navy,T.gold,T.sage];

  const filteredForSelection=useMemo(()=>{
    if(!searchProv)return PROVIDERS;
    return PROVIDERS.filter(p=>p.name.toLowerCase().includes(searchProv.toLowerCase()));
  },[searchProv]);

  const catBenchmarks=useMemo(()=>{
    const cats=benchCat==='All'?CATEGORIES:[benchCat];
    return QUALITY_DIMS.map((d,di)=>{
      const vals=PROVIDERS.filter(p=>cats.includes(p.category)).map(p=>p.quality[di]);
      return{dim:d,avg:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0,max:vals.length?Math.max(...vals):0,min:vals.length?Math.min(...vals):0};
    });
  },[benchCat]);

  const trendData=useMemo(()=>['Q1 2025','Q2 2025','Q3 2025','Q4 2025'].map((q,qi)=>({
    quarter:q,...Object.fromEntries(compProviders.map(p=>[p.name,p.trend[qi]]))
  })),[compProviders]);

  const bestInClass=useMemo(()=>{
    const cases=[
      {uc:'Portfolio Monitoring',dims:[0,2,3],desc:'Real-time coverage with high completeness for ongoing portfolio surveillance.'},
      {uc:'Regulatory Reporting',dims:[4,6,7],desc:'Consistent, auditable data with robust methodology for disclosure compliance.'},
      {uc:'Engagement Strategy',dims:[1,3,5],desc:'Accurate, granular data for targeted company engagement and stewardship.'}
    ];
    return cases.map(c=>{
      const scored=PROVIDERS.map(p=>({name:p.name,category:p.category,score:Math.round(c.dims.reduce((a,d)=>a+p.quality[d],0)/c.dims.length)}));
      scored.sort((a,b)=>b.score-a.score);
      return{useCase:c.uc,desc:c.desc,top3:scored.slice(0,3)};
    });
  },[]);

  const freshnessHeatmap=useMemo(()=>{
    return CATEGORIES.map(cat=>{
      const catProviders=PROVIDERS.filter(p=>p.category===cat);
      return{
        category:cat.length>16?cat.slice(0,16)+'...':cat,
        fullCat:cat,
        count:catProviders.length,
        avgQuality:catProviders.length?Math.round(catProviders.reduce((a,p)=>a+p.qualityAvg,0)/catProviders.length):0,
        dailyPct:Math.round(catProviders.filter(p=>p.freshness==='Daily'||p.freshness==='Hourly').length/Math.max(1,catProviders.length)*100),
        weeklyPct:Math.round(catProviders.filter(p=>p.freshness==='Weekly').length/Math.max(1,catProviders.length)*100),
        monthlyPct:Math.round(catProviders.filter(p=>p.freshness==='Monthly').length/Math.max(1,catProviders.length)*100),
        apiPct:Math.round(catProviders.filter(p=>p.apiAvail).length/Math.max(1,catProviders.length)*100),
      };
    });
  },[]);

  const qualityDistribution=useMemo(()=>{
    const bins=[{label:'90-100',min:90,max:100},{label:'80-89',min:80,max:89},{label:'70-79',min:70,max:79},{label:'60-69',min:60,max:69},{label:'<60',min:0,max:59}];
    return bins.map(b=>({...b,count:PROVIDERS.filter(p=>p.qualityAvg>=b.min&&p.qualityAvg<=b.max).length}));
  },[]);

  return <div>
    {/* Provider Selection */}
    <Card style={{marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Compare Providers (select up to 3)</div>
        <input value={searchProv} onChange={e=>setSearchProv(e.target.value)} placeholder="Search..."
          style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,width:180,outline:'none'}}/>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,maxHeight:100,overflowY:'auto'}}>
        {filteredForSelection.map(p=><button key={p.id} onClick={()=>toggleProvider(p.id)}
          style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${selectedIds.includes(p.id)?radarColors[selectedIds.indexOf(p.id)]||T.navy:T.border}`,
            background:selectedIds.includes(p.id)?radarColors[selectedIds.indexOf(p.id)]||T.navy:'transparent',
            color:selectedIds.includes(p.id)?'#fff':T.textSec,fontSize:11,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s'}}>
          {p.name} ({p.qualityAvg})
        </button>)}
      </div>
      <div style={{display:'flex',gap:12,marginTop:10}}>
        {compProviders.map((p,i)=><div key={p.id} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:6,background:`${radarColors[i]}10`,border:`1px solid ${radarColors[i]}30`}}>
          <span style={{width:8,height:8,borderRadius:4,background:radarColors[i]}}/>
          <span style={{fontSize:12,fontWeight:600,color:radarColors[i]}}>{p.name}</span>
          <span style={{fontSize:11,color:T.textMut}}>Avg: {p.qualityAvg}</span>
        </div>)}
      </div>
    </Card>

    {/* Radar + Trend */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>8-Dimension Quality Radar</div>
        <div style={{height:320}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={QUALITY_DIMS.map((d,i)=>({dim:d,...Object.fromEntries(compProviders.map(p=>[p.name,p.quality[i]]))}))}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
              {compProviders.map((p,i)=><Radar key={p.id} name={p.name} dataKey={p.name} stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.08}/>)}
              <Legend wrapperStyle={{fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Quality Trend (4 Quarters)</div>
        <div style={{height:320}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis domain={[50,100]} tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              {compProviders.map((p,i)=><Bar key={p.id} dataKey={p.name} fill={radarColors[i]} radius={[4,4,0,0]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>

    {/* Benchmarks + Score Table + Distribution */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 280px',gap:20,marginBottom:20}}>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Category Benchmarks</div>
          <select value={benchCat} onChange={e=>setBenchCat(e.target.value)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catBenchmarks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="dim" type="category" tick={{fontSize:10,fill:T.textSec}} width={80}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="avg" fill={T.navy} radius={[0,4,4,0]} name="Average"/>
              <Bar dataKey="max" fill={T.sage} radius={[0,4,4,0]} name="Best"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Dimension Score Comparison</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,fontWeight:600}}>Dimension</th>
                {compProviders.map((p,i)=><th key={p.id} style={{textAlign:'center',padding:'6px 8px',color:radarColors[i],fontWeight:700}}>{p.name.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {QUALITY_DIMS.map((d,di)=><tr key={d} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                <td style={{padding:'6px 8px',color:T.textSec}}>{d}</td>
                {compProviders.map(p=>{
                  const v=p.quality[di];
                  return <td key={p.id} style={{textAlign:'center',padding:'6px 8px',fontWeight:700,color:v>=80?T.green:v>=65?T.amber:T.red}}>{v}</td>;
                })}
              </tr>)}
              <tr style={{borderTop:`2px solid ${T.border}`,fontWeight:700}}>
                <td style={{padding:'6px 8px',color:T.navy}}>Average</td>
                {compProviders.map((p,i)=><td key={p.id} style={{textAlign:'center',padding:'6px 8px',color:radarColors[i],fontWeight:800}}>{p.qualityAvg}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Quality Distribution</div>
        <div style={{height:200}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qualityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="label" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]}>
                {qualityDistribution.map((d,i)=><Cell key={i} fill={i===0?T.green:i===1?T.sage:i===2?T.gold:i===3?T.amber:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{fontSize:11,color:T.textMut,textAlign:'center',marginTop:4}}>Provider count by quality score range</div>
      </Card>
    </div>

    {/* Category Freshness & API Heatmap */}
    <Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Data Freshness & API Coverage by Category</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              <th style={{textAlign:'left',padding:'8px',color:T.textSec,fontWeight:600}}>Category</th>
              <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600}}>Providers</th>
              <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600}}>Avg Quality</th>
              <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600}}>Daily/Hourly %</th>
              <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600}}>Weekly %</th>
              <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600}}>Monthly+ %</th>
              <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600}}>API Coverage</th>
            </tr>
          </thead>
          <tbody>
            {freshnessHeatmap.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
              <td style={{padding:'8px',fontWeight:600,color:T.navy}}>{r.fullCat}</td>
              <td style={{textAlign:'center',padding:'8px'}}>{r.count}</td>
              <td style={{textAlign:'center',padding:'8px'}}>
                <span style={{fontWeight:700,color:r.avgQuality>=80?T.green:r.avgQuality>=65?T.amber:T.red}}>{r.avgQuality}</span>
              </td>
              <td style={{textAlign:'center',padding:'8px'}}>
                <div style={{display:'inline-block',padding:'2px 8px',borderRadius:4,background:r.dailyPct>=60?'#dcfce7':r.dailyPct>=30?'#fef9c3':'#fee2e2',
                  color:r.dailyPct>=60?T.green:r.dailyPct>=30?T.amber:T.red,fontWeight:600,fontSize:11}}>{r.dailyPct}%</div>
              </td>
              <td style={{textAlign:'center',padding:'8px'}}>
                <div style={{display:'inline-block',padding:'2px 8px',borderRadius:4,background:T.surfaceH,fontSize:11,fontWeight:600,color:T.textSec}}>{r.weeklyPct}%</div>
              </td>
              <td style={{textAlign:'center',padding:'8px'}}>
                <div style={{display:'inline-block',padding:'2px 8px',borderRadius:4,background:T.surfaceH,fontSize:11,fontWeight:600,color:T.textSec}}>{r.monthlyPct}%</div>
              </td>
              <td style={{textAlign:'center',padding:'8px'}}>
                <ProgressBar value={r.apiPct} max={100} color={r.apiPct>=70?T.green:r.apiPct>=40?T.amber:T.red} height={5}/>
                <span style={{fontSize:10,color:T.textMut}}>{r.apiPct}%</span>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Best-in-Class */}
    <Card>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Best-in-Class Recommendations by Use Case</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {bestInClass.map(b=><div key={b.useCase} style={{border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>{b.useCase}</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:10,lineHeight:1.4}}>{b.desc}</div>
          {b.top3.map((t,i)=><div key={t.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<2?`1px solid ${T.surfaceH}`:'none'}}>
            <div>
              <span style={{fontSize:12,fontWeight:600,color:i===0?T.gold:T.text}}>{i===0?'#1 ':i===1?'#2 ':'#3 '}{t.name}</span>
              <div style={{fontSize:10,color:T.textMut}}>{t.category}</div>
            </div>
            <Badge color={t.score>=80?T.green:T.amber} bg={t.score>=80?'#dcfce7':'#fef9c3'}>{t.score}</Badge>
          </div>)}
        </div>)}
      </div>
    </Card>
  </div>;
};

/* ---- TAB 3: Coverage Gap Analyzer ---- */
const CoverageGapAnalyzer=()=>{
  const[selectedUC,setSelectedUC]=useState(0);
  const gap=GAP_MATRIX[selectedUC];

  const summary=useMemo(()=>{
    const reqs=gap.requirements;
    return{
      covered:reqs.filter(r=>r.status==='covered').length,
      partial:reqs.filter(r=>r.status==='partial').length,
      gap:reqs.filter(r=>r.status==='gap').length,
      totalCost:reqs.filter(r=>r.costToFill).reduce((a,r)=>a+parseInt(r.costToFill),0)
    };
  },[gap]);

  const pieData=[
    {name:'Covered',value:summary.covered,color:T.green},
    {name:'Partial',value:summary.partial,color:T.amber},
    {name:'Gap',value:summary.gap,color:T.red}
  ];

  const gapProviderRecs=useMemo(()=>{
    return gap.requirements.filter(r=>r.status==='gap').map(r=>({
      requirement:r.name,providers:r.providers,cost:r.costToFill,priority:r.priority,dataPoints:r.dataPoints
    }));
  },[gap]);

  const coverageByUseCase=useMemo(()=>GAP_MATRIX.map(g=>{
    const reqs=g.requirements;
    return{
      useCase:g.useCase,
      covered:reqs.filter(r=>r.status==='covered').length,
      partial:reqs.filter(r=>r.status==='partial').length,
      gap:reqs.filter(r=>r.status==='gap').length,
      score:Math.round((reqs.filter(r=>r.status==='covered').length+reqs.filter(r=>r.status==='partial').length*0.5)/reqs.length*100)
    };
  }),[]);

  return <div>
    <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
      {USE_CASES.map((uc,i)=><Btn key={uc} active={selectedUC===i} onClick={()=>setSelectedUC(i)}>{uc}</Btn>)}
    </div>

    {/* Summary cards */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
      <Card style={{padding:'14px 18px',borderLeft:`3px solid ${T.green}`}}>
        <MetricBox label="Requirements Covered" value={summary.covered} color={T.green}/>
      </Card>
      <Card style={{padding:'14px 18px',borderLeft:`3px solid ${T.amber}`}}>
        <MetricBox label="Partially Covered" value={summary.partial} color={T.amber}/>
      </Card>
      <Card style={{padding:'14px 18px',borderLeft:`3px solid ${T.red}`}}>
        <MetricBox label="Data Gaps" value={summary.gap} color={T.red}/>
      </Card>
      <Card style={{padding:'14px 18px',borderLeft:`3px solid ${T.navy}`}}>
        <MetricBox label="Coverage Score" value={`${Math.round((summary.covered+summary.partial*0.5)/gap.requirements.length*100)}%`} color={T.navy}/>
      </Card>
    </div>

    {/* Main matrix + sidebar */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20,marginBottom:20}}>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Data Requirements Matrix: {USE_CASES[selectedUC]}</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{textAlign:'left',padding:'8px',color:T.textSec,fontWeight:600}}>Requirement</th>
                <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600,width:90}}>Status</th>
                <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600,width:60}}>Priority</th>
                <th style={{textAlign:'left',padding:'8px',color:T.textSec,fontWeight:600}}>Available Providers</th>
                <th style={{textAlign:'center',padding:'8px',color:T.textSec,fontWeight:600,width:70}}>Confidence</th>
                <th style={{textAlign:'right',padding:'8px',color:T.textSec,fontWeight:600,width:80}}>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {gap.requirements.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`,background:r.status==='gap'?'#fef2f2':r.status==='partial'?'#fffbeb':'transparent'}}>
                <td style={{padding:'8px',fontWeight:600,color:T.navy}}>{r.name}</td>
                <td style={{textAlign:'center',padding:'8px'}}>
                  <StatusDot status={r.status}/>
                  <span style={{fontSize:11,color:r.status==='covered'?T.green:r.status==='partial'?T.amber:T.red,fontWeight:600,textTransform:'capitalize'}}>{r.status}</span>
                </td>
                <td style={{textAlign:'center',padding:'8px'}}>
                  <Badge color={r.priority==='High'?T.red:r.priority==='Medium'?T.amber:T.textMut} bg={r.priority==='High'?'#fee2e2':r.priority==='Medium'?'#fef9c3':T.surfaceH}>{r.priority}</Badge>
                </td>
                <td style={{padding:'8px'}}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {r.providers.map(p=><span key={p} style={{padding:'1px 6px',borderRadius:4,background:T.surfaceH,fontSize:10,color:T.textSec}}>{p}</span>)}
                  </div>
                </td>
                <td style={{textAlign:'center',padding:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}>
                    <ProgressBar value={r.confidence} max={100} color={r.confidence>=70?T.green:r.confidence>=50?T.amber:T.red} height={4}/>
                    <span style={{fontSize:10,color:T.textMut,minWidth:24}}>{r.confidence}%</span>
                  </div>
                </td>
                <td style={{textAlign:'right',padding:'8px',fontWeight:600,color:r.costToFill?T.red:T.textMut}}>{r.costToFill?`$${r.costToFill}`:'-'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Coverage Breakdown</div>
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                  {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Gap Fill Budget</div>
          <div style={{fontSize:28,fontWeight:800,color:T.red,fontFamily:T.font}}>${summary.totalCost}K</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>Estimated annual cost to fill all gaps</div>
          <div style={{fontSize:11,color:T.textSec}}>
            {summary.gap} gaps identified across {gap.requirements.length} requirements for {USE_CASES[selectedUC].toLowerCase()} analytics.
          </div>
        </Card>
      </div>
    </div>

    {/* Gap recommendations */}
    {gapProviderRecs.length>0&&<Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Recommendations to Fill Data Gaps</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
        {gapProviderRecs.map((g,i)=><div key={i} style={{border:`1px solid ${T.border}`,borderRadius:8,padding:14,borderLeft:`3px solid ${T.red}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:4}}>
            <StatusDot status="gap"/>{g.requirement}
          </div>
          <div style={{display:'flex',gap:12,fontSize:11,color:T.textMut,marginBottom:8}}>
            <span>Est. cost: ${g.cost}/yr</span>
            <span>Priority: {g.priority}</span>
            <span>Data: {g.dataPoints} pts</span>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Recommended Providers:</div>
          {g.providers.length>0?g.providers.map(p=><div key={p} style={{padding:'4px 8px',borderRadius:6,background:T.surfaceH,fontSize:11,color:T.textSec,marginBottom:4}}>{p}</div>)
          :<div style={{fontSize:11,color:T.textMut,fontStyle:'italic'}}>Custom data collection required - consider satellite tasking or direct engagement</div>}
        </div>)}
      </div>
    </Card>}

    {/* Cross use-case comparison */}
    <Card>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Cross Use-Case Coverage Comparison</div>
      <div style={{height:280}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={coverageByUseCase}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="useCase" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="covered" stackId="a" fill={T.green} name="Covered"/>
            <Bar dataKey="partial" stackId="a" fill={T.amber} name="Partial"/>
            <Bar dataKey="gap" stackId="a" fill={T.red} name="Gap" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:'flex',gap:20,marginTop:12,justifyContent:'center'}}>
        {coverageByUseCase.map(c=><div key={c.useCase} style={{textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:800,color:c.score>=70?T.green:c.score>=50?T.amber:T.red}}>{c.score}%</div>
          <div style={{fontSize:10,color:T.textMut}}>{c.useCase}</div>
        </div>)}
      </div>
    </Card>
  </div>;
};

/* ---- TAB 4: Data Stack Builder ---- */
const DataStackBuilder=()=>{
  const[selectedStrategy,setSelectedStrategy]=useState(0);
  const[budget,setBudget]=useState(250);
  const[customStack,setCustomStack]=useState(null);
  const[showExport,setShowExport]=useState(false);
  const[addSearch,setAddSearch]=useState('');

  const rec=STACK_RECS[selectedStrategy];

  const stack=useMemo(()=>{
    if(customStack)return customStack;
    return rec.providers;
  },[customStack,rec]);

  const filteredByBudget=useMemo(()=>{
    let total=0;
    const costs=stack.map(p=>{
      const c=p.annualCost||Math.round(10+sr(p.id*7+selectedStrategy)*60);
      return{...p,annualCost:c};
    });
    costs.sort((a,b)=>(a.priority==='Core'?0:1)-(b.priority==='Core'?0:1)||b.qualityAvg-a.qualityAvg);
    const included=[];
    for(const c of costs){
      if(total+c.annualCost<=budget){included.push(c);total+=c.annualCost;}
    }
    return{providers:included,totalCost:total};
  },[stack,budget,selectedStrategy]);

  const complexityScore=useMemo(()=>{
    const days=filteredByBudget.providers.reduce((a,p)=>a+p.integrationDays,0);
    return{days,score:days<60?'Low':days<120?'Medium':'High',color:days<60?T.green:days<120?T.amber:T.red};
  },[filteredByBudget]);

  const categoryBreakdown=useMemo(()=>{
    const m={};
    filteredByBudget.providers.forEach(p=>{m[p.category]=(m[p.category]||0)+1;});
    return Object.entries(m).map(([k,v])=>({category:k,count:v}));
  },[filteredByBudget]);

  const addableProviders=useMemo(()=>{
    let list=PROVIDERS.filter(p=>!stack.find(s=>s.id===p.id));
    if(addSearch)list=list.filter(p=>p.name.toLowerCase().includes(addSearch.toLowerCase())||p.category.toLowerCase().includes(addSearch.toLowerCase()));
    return list.slice(0,15);
  },[stack,addSearch]);

  const removeFromStack=useCallback((id)=>{
    setCustomStack(prev=>(prev||stack).filter(p=>p.id!==id));
  },[stack]);

  const addToStack=useCallback((provider)=>{
    setCustomStack(prev=>{
      const current=prev||stack;
      if(current.find(p=>p.id===provider.id))return current;
      return[...current,{...provider,priority:'Optional',integrationDays:Math.round(5+sr(provider.id*200)*25),annualCost:Math.round(10+sr(provider.id*7+selectedStrategy)*60)}];
    });
  },[stack,selectedStrategy]);

  const resetStack=useCallback(()=>{setCustomStack(null);setAddSearch('');},[]);

  const exportCSV=useCallback(()=>{
    const headers='Provider,Category,Priority,Quality Score,Annual Cost ($K),Integration Days,Coverage,Freshness,API Available,SLA\n';
    const rows=filteredByBudget.providers.map(p=>`"${p.name}","${p.category}","${p.priority}",${p.qualityAvg},${p.annualCost},${p.integrationDays},"${p.coverage}","${p.freshness}",${p.apiAvail?"Yes":"No"},"${p.sla}"`).join('\n');
    const blob=new Blob([headers+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='data_procurement_plan.csv';a.click();URL.revokeObjectURL(url);
    setShowExport(true);
    setTimeout(()=>setShowExport(false),3000);
  },[filteredByBudget]);

  const strategyColors=[T.navy,T.gold,T.sage,T.amber,T.navyL,T.teal];

  return <div>
    {/* Strategy selector */}
    <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      {STRATEGIES.map((s,i)=><Btn key={s} active={selectedStrategy===i} onClick={()=>{setSelectedStrategy(i);setCustomStack(null);setAddSearch('');}}>{s}</Btn>)}
    </div>

    {/* Strategy description */}
    <Card style={{padding:'12px 18px',marginBottom:16,borderLeft:`3px solid ${strategyColors[selectedStrategy]}`}}>
      <div style={{fontSize:13,color:T.textSec,lineHeight:1.5}}>{rec.description}</div>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,marginBottom:20}}>
      {/* Stack builder main area */}
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Recommended Data Stack</div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={resetStack} style={{fontSize:11,padding:'4px 12px'}}>Reset</Btn>
            <Btn onClick={exportCSV} active style={{fontSize:11,padding:'4px 12px'}}>Export CSV</Btn>
          </div>
        </div>
        {showExport&&<div style={{padding:8,background:'#dcfce7',borderRadius:6,marginBottom:12,fontSize:12,color:T.green,fontWeight:600}}>Procurement plan exported as data_procurement_plan.csv</div>}

        {/* Budget slider */}
        <div style={{marginBottom:14,padding:'10px 14px',background:T.surfaceH,borderRadius:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:12,color:T.textSec,fontWeight:600}}>Annual Budget Constraint</span>
            <span style={{fontSize:14,fontFamily:T.mono,color:T.navy,fontWeight:700}}>${budget}K/yr</span>
          </div>
          <input type="range" min={50} max={500} step={10} value={budget} onChange={e=>setBudget(+e.target.value)} style={{width:'100%'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}>
            <span>$50K</span><span>$150K</span><span>$250K</span><span>$350K</span><span>$500K</span>
          </div>
        </div>

        {/* Provider list */}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
          {filteredByBudget.providers.map((p,i)=><div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:8,border:`1px solid ${p.priority==='Core'?T.navy:T.border}`,background:p.priority==='Core'?'rgba(27,58,92,0.03)':'transparent'}}>
            <div style={{width:24,height:24,borderRadius:12,background:p.priority==='Core'?T.navy:T.surfaceH,color:p.priority==='Core'?'#fff':T.textMut,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{i+1}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{p.name}</div>
              <div style={{fontSize:11,color:T.textMut}}>{p.category} | {p.coverage} | {p.freshness}</div>
            </div>
            <Badge color={p.priority==='Core'?T.navy:T.textMut} bg={p.priority==='Core'?'rgba(27,58,92,0.1)':T.surfaceH}>{p.priority}</Badge>
            <div style={{textAlign:'right',minWidth:55}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy}}>${p.annualCost}K</div>
              <div style={{fontSize:10,color:T.textMut}}>{p.integrationDays}d setup</div>
            </div>
            <div style={{width:40,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:700,color:p.qualityAvg>=80?T.green:p.qualityAvg>=65?T.amber:T.red}}>{p.qualityAvg}</div>
            </div>
            <button onClick={()=>removeFromStack(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:T.textMut,fontSize:16}}>x</button>
          </div>)}
          {filteredByBudget.providers.length===0&&<div style={{padding:20,textAlign:'center',color:T.textMut,fontSize:13}}>No providers fit within the current budget. Increase the budget slider above.</div>}
        </div>

        {/* Add provider */}
        <div style={{padding:12,borderRadius:8,background:T.surfaceH}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:T.textSec}}>Add Provider to Stack</div>
            <input value={addSearch} onChange={e=>setAddSearch(e.target.value)} placeholder="Filter..."
              style={{padding:'3px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font,width:140,outline:'none'}}/>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {addableProviders.map(p=><button key={p.id} onClick={()=>addToStack(p)} style={{padding:'3px 8px',borderRadius:4,border:`1px solid ${T.border}`,background:T.surface,fontSize:10,fontFamily:T.font,cursor:'pointer',color:T.textSec}}>+ {p.name}</button>)}
          </div>
        </div>
      </Card>

      {/* Right sidebar */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Stack Summary</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <MetricBox label="Providers" value={filteredByBudget.providers.length} color={T.navy}/>
            <MetricBox label="Annual Cost" value={`$${filteredByBudget.totalCost}K`} color={T.gold}/>
            <MetricBox label="Setup Time" value={`${complexityScore.days}d`} color={complexityScore.color}/>
            <MetricBox label="Complexity" value={complexityScore.score} color={complexityScore.color}/>
          </div>
          <div style={{marginTop:14}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut,marginBottom:4}}>
              <span>Budget utilization</span>
              <span>{Math.round(filteredByBudget.totalCost/budget*100)}%</span>
            </div>
            <ProgressBar value={filteredByBudget.totalCost} max={budget} color={filteredByBudget.totalCost/budget>0.9?T.red:filteredByBudget.totalCost/budget>0.7?T.amber:T.green}/>
          </div>
          <div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontSize:11}}>
            <span style={{color:T.textMut}}>Core providers</span>
            <span style={{fontWeight:700,color:T.navy}}>{filteredByBudget.providers.filter(p=>p.priority==='Core').length}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
            <span style={{color:T.textMut}}>Optional providers</span>
            <span style={{fontWeight:600,color:T.textSec}}>{filteredByBudget.providers.filter(p=>p.priority==='Optional').length}</span>
          </div>
        </Card>

        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Category Coverage</div>
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={65} dataKey="count" label={({count})=>`${count}`}>
                  {categoryBreakdown.map((d,i)=><Cell key={i} fill={[T.navy,T.gold,T.sage,T.navyL,T.amber,T.teal][i%6]}/>)}
                </Pie>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {categoryBreakdown.map((c,i)=><div key={c.category} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0',color:T.textSec}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:8,height:8,borderRadius:4,background:[T.navy,T.gold,T.sage,T.navyL,T.amber,T.teal][i%6],display:'inline-block'}}/>
              {c.category}
            </span>
            <span style={{fontWeight:600}}>{c.count}</span>
          </div>)}
        </Card>

        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>AI Optimal Stack Recommendation</div>
          <div style={{fontSize:12,color:T.textSec,lineHeight:1.5,marginBottom:10}}>
            For <strong>{STRATEGIES[selectedStrategy]}</strong> at <strong>${budget}K/yr</strong>, the optimal stack includes {filteredByBudget.providers.filter(p=>p.priority==='Core').length} core and {filteredByBudget.providers.filter(p=>p.priority==='Optional').length} optional providers covering {categoryBreakdown.length} data categories with {complexityScore.days} days total integration time.
          </div>
          <div style={{padding:8,background:'#eff6ff',borderRadius:6,fontSize:11,color:T.navyL,lineHeight:1.5}}>
            {filteredByBudget.totalCost<budget*0.6
              ?'Significant budget headroom available. Consider adding satellite imagery or supply chain data for enhanced coverage and alpha generation.'
              :filteredByBudget.totalCost<budget*0.85
              ?'Good budget utilization with room for one or two targeted additions. Evaluate nature/biodiversity data for emerging regulatory requirements.'
              :'Near budget capacity. Prioritize core providers and consider phased integration for optional datasets to manage cash flow.'}
          </div>
        </Card>
      </div>
    </div>

    {/* Integration timeline */}
    <Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Integration Timeline & Phasing</div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filteredByBudget.providers.sort((a,b)=>(a.priority==='Core'?0:1)-(b.priority==='Core'?0:1)).map((p,i)=>{
          const startDay=filteredByBudget.providers.slice(0,i).filter(x=>x.priority===p.priority).reduce((a,x)=>a+Math.ceil(x.integrationDays*0.6),0);
          const barWidth=Math.max(5,p.integrationDays/Math.max(1,complexityScore.days)*100);
          const barLeft=startDay/Math.max(1,complexityScore.days+20)*100;
          return <div key={p.id} style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:130,fontSize:11,fontWeight:600,color:T.navy,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
            <div style={{flex:1,height:20,background:T.surfaceH,borderRadius:4,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:`${Math.min(barLeft,85)}%`,width:`${Math.min(barWidth,100-Math.min(barLeft,85))}%`,height:'100%',
                background:p.priority==='Core'?T.navy:T.gold,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:9,color:'#fff',fontWeight:700}}>{p.integrationDays}d</span>
              </div>
            </div>
            <Badge color={p.priority==='Core'?T.navy:T.textMut} bg={p.priority==='Core'?'rgba(27,58,92,0.1)':T.surfaceH}>{p.priority}</Badge>
          </div>;
        })}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut,marginTop:8,paddingLeft:140}}>
        <span>Week 1</span><span>Week {Math.ceil(complexityScore.days/10)}</span><span>Week {Math.ceil(complexityScore.days/5)}</span>
      </div>
    </Card>

    {/* Strategy comparison chart */}
    <Card>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:14}}>Strategy Comparison Overview</div>
      <div style={{height:280}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={STACK_RECS.map(s=>({
            strategy:s.strategy.length>16?s.strategy.slice(0,16)+'...':s.strategy,
            providers:s.providers.length,
            cost:parseInt(s.totalCost),
            complexity:s.complexity==='Low'?30:s.complexity==='Medium'?60:90
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="strategy" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar yAxisId="left" dataKey="providers" fill={T.navy} name="# Providers" radius={[4,4,0,0]}/>
            <Bar yAxisId="right" dataKey="cost" fill={T.gold} name="Est. Cost ($K)" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>;
};

/* ---- MAIN PAGE COMPONENT ---- */
export default function ClimateDataMarketplacePage(){
  const[tab,setTab]=useState(0);
  const[selectedProvider,setSelectedProvider]=useState(null);

  const apiCount=useMemo(()=>PROVIDERS.filter(p=>p.apiAvail).length,[]);
  const avgQuality=useMemo(()=>Math.round(PROVIDERS.reduce((a,p)=>a+p.qualityAvg,0)/PROVIDERS.length),[]);
  const totalRecords=useMemo(()=>{
    const t=PROVIDERS.reduce((a,p)=>a+p.records,0);
    return t>1e9?(t/1e9).toFixed(1)+'B':(t/1e6).toFixed(0)+'M';
  },[]);

  return <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
    <div style={{maxWidth:1360,margin:'0 auto'}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:T.navy,margin:'0 0 4px'}}>Climate Data Marketplace & Alternative Data</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>
              Curated marketplace of {PROVIDERS.length} climate/ESG alternative data providers for investment analytics across {CATEGORIES.length} categories
            </p>
          </div>
          <Badge color={T.gold} bg="rgba(197,169,106,0.12)">EP-AM4</Badge>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,width:'fit-content'}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'8px 20px',borderRadius:8,border:'none',background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,fontFamily:T.font,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>{t}</button>)}
      </div>

      {/* KPI Strip */}
      <div style={{display:'flex',gap:14,marginBottom:20,flexWrap:'wrap'}}>
        <Card style={{padding:'12px 20px',flex:'1 1 180px'}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Total Providers</div>
          <div style={{fontSize:22,fontWeight:800,color:T.navy}}>{PROVIDERS.length}</div>
        </Card>
        <Card style={{padding:'12px 20px',flex:'1 1 180px'}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Data Categories</div>
          <div style={{fontSize:22,fontWeight:800,color:T.gold}}>{CATEGORIES.length}</div>
        </Card>
        <Card style={{padding:'12px 20px',flex:'1 1 180px'}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Avg Quality</div>
          <div style={{fontSize:22,fontWeight:800,color:T.sage}}>{avgQuality}</div>
        </Card>
        <Card style={{padding:'12px 20px',flex:'1 1 180px'}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>API-Enabled</div>
          <div style={{fontSize:22,fontWeight:800,color:T.navyL}}>{apiCount}</div>
        </Card>
        <Card style={{padding:'12px 20px',flex:'1 1 180px'}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Total Records</div>
          <div style={{fontSize:22,fontWeight:800,color:T.text}}>{totalRecords}</div>
        </Card>
        <Card style={{padding:'12px 20px',flex:'1 1 180px'}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Quality Dims</div>
          <div style={{fontSize:22,fontWeight:800,color:T.amber}}>{QUALITY_DIMS.length}</div>
        </Card>
      </div>

      {/* Tab Content */}
      {tab===0&&<DataCatalog onSelect={setSelectedProvider} selectedProvider={selectedProvider}/>}
      {tab===1&&<QualityAssessment/>}
      {tab===2&&<CoverageGapAnalyzer/>}
      {tab===3&&<DataStackBuilder/>}
    </div>
  </div>;
}
