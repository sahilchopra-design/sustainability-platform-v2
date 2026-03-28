import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const PROVIDERS=[
  {id:'msci',name:'MSCI ESG',color:'#2563eb',eW:35,sW:35,gW:30},
  {id:'sp',name:'S&P Global',color:'#16a34a',eW:30,sW:35,gW:35},
  {id:'sust',name:'Sustainalytics',color:'#dc2626',eW:40,sW:30,gW:30},
  {id:'iss',name:'ISS ESG',color:'#9333ea',eW:33,sW:34,gW:33},
  {id:'cdp',name:'CDP / FTSE',color:'#0891b2',eW:45,sW:25,gW:30},
  {id:'bloom',name:'Bloomberg ESG',color:'#ea580c',eW:32,sW:38,gW:30}
];

const E_ISSUES=['GHG Emissions Scope 1','GHG Emissions Scope 2','GHG Emissions Scope 3','Energy Management','Water & Wastewater Mgmt','Waste & Hazardous Materials','Biodiversity & Land Use','Air Quality & Pollutants','Climate Risk Physical','Climate Risk Transition','Circular Economy Practices','Deforestation & Land Degradation','Chemical Safety','Packaging & Product Lifecycle','Supply Chain Env Impact'];
const S_ISSUES=['Labor Practices & Standards','Health & Safety Management','Human Capital Development','Diversity Equity & Inclusion','Community Relations & Impact','Data Privacy & Security','Product Safety & Quality','Supply Chain Labor Standards','Customer Welfare & Access','Indigenous & Human Rights','Living Wage & Fair Pay','Employee Engagement & Retention','Responsible Marketing','Digital Inclusion & Access','Conflict Minerals & Due Diligence'];
const G_ISSUES=['Board Composition & Independence','Executive Compensation Alignment','Shareholder Rights & Engagement','Business Ethics & Anti-Corruption','Audit & Risk Oversight','Tax Transparency & Strategy','Lobbying & Political Spending','Cybersecurity Governance','ESG Integration in Strategy','Regulatory Compliance Track Record','Whistleblower Protections','Related Party Transactions'];

const GICS_SECTORS=['Software & IT Services','Oil & Gas Exploration','Commercial Banking','Pharmaceuticals & Biotech','Electric Utilities','Real Estate Investment Trusts','Metals & Mining','Consumer Staples Retail','Automotive Manufacturing','Telecommunications Services','Insurance & Reinsurance','Semiconductor Equipment','Aerospace & Defense','Food & Beverage Processing','Transportation Infrastructure'];

const DATA_SOURCES=['Annual Reports','Sustainability Reports','CDP Questionnaires','Government Databases','Regulatory Filings','News & Media Sentiment','Satellite Imagery','IoT Sensor Data','NGO Reports','Proxy Statements','Patent Filings','Academic Research','Supply Chain Audits','Social Media Analysis','Employee Reviews','Industry Benchmarks','Water Risk Databases','Carbon Registries','Biodiversity Databases','Geospatial Climate Models'];

const DS_CATS={
  'Self-Reported':['Annual Reports','Sustainability Reports','Proxy Statements'],
  'Third-Party':['NGO Reports','Academic Research','Industry Benchmarks','Employee Reviews','Social Media Analysis','News & Media Sentiment'],
  'Regulatory':['Government Databases','Regulatory Filings','Carbon Registries','Patent Filings'],
  'Alternative':['Satellite Imagery','IoT Sensor Data','Water Risk Databases','Biodiversity Databases','Geospatial Climate Models','CDP Questionnaires','Supply Chain Audits']
};

const COMPANIES=Array.from({length:30},(_,i)=>{
  const names=['TechNova Corp','GreenField Energy','Pacific Mining Ltd','Apex Pharma Inc','Urban Realty Trust','AquaPure Systems','SolarEdge Holdings','Nordic Timber AB','MetalWorks Global','DataShield Inc','OceanFreight Logistics','BioHarvest Sciences','ClearSky Airlines','NexGen Semiconductors','Alpine Banking Group','MegaRetail Holdings','FreshFoods International','AutoDrive Motors','TeleConnect Services','EcoChemical Solutions','PolarEnergy Corp','SafeHarbor Insurance','SteelBridge Engineering','CloudPeak Software','Heritage Consumer Brands','RiverDelta Utilities','SpaceLink Communications','AgriGrowth Partners','MediCare Hospitals','QuantumCore Technologies'];
  return {id:i,name:names[i],sector:GICS_SECTORS[i%15],baseE:45+sr(i*31)*30,baseS:40+sr(i*37)*35,baseG:50+sr(i*43)*25};
});

const genKPIs=(pillar,seed)=>{
  const eKPIs=['Absolute GHG Emissions (tCO2e)','GHG Intensity per Revenue','Scope 3 Category Breakdown','Energy Consumption Total (GJ)','Renewable Energy Share (%)','Water Withdrawal Intensity','Water Recycling Rate (%)','Hazardous Waste Generated (t)','Waste Diversion Rate (%)','NOx SOx Particulate Emissions','Land Use Change (hectares)','Biodiversity Action Plans','Chemical Substances of Concern','Packaging Recyclability Rate','Env Supply Chain Incidents','Carbon Offset Credits Used','Science-Based Target Status','Climate VaR Exposure','Energy Efficiency Capex','Green Revenue Share (%)','Methane Emissions (tCH4)','Flaring & Venting Volume','Water Stress Area Operations','Freshwater Consumption','E-Waste Recovery Rate','Ozone Depleting Substances','Environmental Fines & Penalties','ISO 14001 Certification','Life Cycle Assessment Coverage','Env Management System Score','Fugitive Emissions Control','Deforestation-Free Commitment','Marine Ecosystem Impact','Noise Pollution Measures','Soil Contamination Status','Ecological Restoration Spend','Renewable Energy Certificates','Grid Emission Factor Used','Transport Emissions Intensity','Product Carbon Footprint','Biodiversity Net Gain Score','Persistent Organic Pollutants','Env Lobbying Expenditure','Thermal Discharge Volume','Ecosystem Service Valuation','Env Risk Insurance Coverage','Green Bond Issuance','Carbon Capture Investment','Env Litigation Reserves','Product Env Declarations','Scope 2 Market-Based','Scope 2 Location-Based','Fleet Electrification Rate','Env Training Hours/Employee','Air Quality Monitoring Sites','Upstream Env Screening Rate','Env Data Verification Level','Climate Scenario Analysis','Transition Plan Credibility','Env Board Oversight Score'];
  const sKPIs=['Total Recordable Injury Rate','Lost Time Injury Frequency','Employee Turnover Rate (%)','Gender Pay Gap Ratio','Women in Management (%)','Training Hours per Employee','Employee Satisfaction Score','Collective Bargaining Coverage','Living Wage Compliance (%)','Data Breach Incidents','Product Recall Count','Community Investment ($M)','Supplier Social Audit Rate','Customer Satisfaction Index','Accessibility Compliance Score','Human Rights Due Diligence','Forced Labor Risk Assessment','Child Labor Risk Assessment','Indigenous Consultation Rate','Conflict Mineral Sourcing (%)','Parental Leave Utilization','Mental Health Program Access','Temporary Worker Share (%)','Wage Theft Incidents','Freedom of Association Score','Disability Employment Rate','Volunteer Hours per Employee','Local Hiring Rate (%)','Product Liability Claims','Privacy Impact Assessments','Social Supply Chain Incidents','Grievance Mechanism Cases','Remedy & Remediation Rate','Digital Literacy Programs','Healthcare Coverage Rate (%)','Retirement Plan Participation','Workforce Diversity Index','Anti-Discrimination Training','Community Displacement Cases','Stakeholder Engagement Score','Social Bond Proceeds ($M)','Fair Trade Certification','Responsible AI Governance','Nutrition & Health Labeling','Affordable Housing Units','Customer Complaint Resolution','Modern Slavery Statements','Supplier Code of Conduct','S&H Expenditure per Employee','Emergency Preparedness Score','Philanthropy as % Revenue','Unionization Rate (%)','Employee Share Ownership','Cultural Heritage Protection','Social Impact Measurement','Responsible Marketing Score','Youth Employment Programs','Veteran Hiring Rate (%)','Migrant Worker Protections','Social Audit Non-Conformities'];
  const gKPIs=['Board Independence Ratio (%)','CEO-Median Pay Ratio','Say-on-Pay Approval Rate','Anti-Corruption Training (%)','Board Gender Diversity (%)','Board Meeting Attendance','Audit Committee Independence','Risk Committee Effectiveness','ESG-Linked Compensation (%)','Regulatory Sanctions Count','Whistleblower Cases Filed','Related Party Transactions ($)','Board Tenure Average (yrs)','Shareholder Proposal Response','Political Donation Disclosure','Tax Rate vs Statutory Rate','Board Cybersecurity Expertise','Sustainability Committee Score','Clawback Policy Enforcement','Dual Class Share Structure','Board Refreshment Rate','Director Overboarding Score','Board ESG Competency (%)','Executive Stock Ownership','Proxy Access Provisions','Cumulative Voting Rights','Poison Pill Status','Classified Board Structure','Independent Chair/Lead Dir','Stakeholder Advisory Panel','Govt Relations Transparency','Lobbying Expenditure ($M)','Board Racial Diversity (%)','Board Age Diversity Score','Board International Members','Succession Planning Score','Ethics Hotline Utilization','Bribery Risk Assessment','Beneficial Ownership Disclosure','Board Digital Competency','Executive Severance Policy','Share Buyback Governance','Dividend Policy Stability','Capital Allocation Framework','Board Skills Matrix Score','Compliance Program Rating','Internal Audit Independence','Data Governance Framework','Third-Party Due Diligence','Sanctions Screening Coverage','Anti-Money Laundering Score','Conflict of Interest Policy','Code of Conduct Coverage','Board Strategy Oversight','Cross-Directorships Count','Governance Framework Rating','Minority Shareholder Rights','Annual Report Transparency','Integrated Reporting Quality','Governance Innovation Score'];
  const pool=pillar==='E'?eKPIs:pillar==='S'?sKPIs:gKPIs;
  return Array.from({length:60},(_,i)=>{
    const covered=PROVIDERS.map((_p,pi)=>sr(seed+i*7+pi*13)>0.3);
    const weight=PROVIDERS.map((_p,pi)=>Math.round(sr(seed+i*11+pi*17)*5+1));
    return {id:i,name:pool[i]||`${pillar} KPI ${i+1}`,covered,weight,source:DATA_SOURCES[Math.floor(sr(seed+i*19)*DATA_SOURCES.length)],threshold:Math.round(sr(seed+i*23)*80+20),scoring:['Absolute','Relative to Peers','Best-in-Class','Binary','Graduated'][Math.floor(sr(seed+i*29)*5)]};
  });
};

const genMateriality=(sectorIdx,provIdx,seed)=>{
  const allIssues=[...E_ISSUES,...S_ISSUES,...G_ISSUES];
  return allIssues.map((issue,i)=>({issue,weight:Math.round((sr(seed+sectorIdx*7+provIdx*13+i*3)*8+2)*10)/10,pillar:i<15?'E':i<30?'S':'G'})).sort((a,b)=>b.weight-a.weight).slice(0,10);
};

const TABS=['Methodology Explorer','KPI Coverage Matrix','Materiality Matrix','Data Source Audit'];

export default function RatingsMethodologyDecoderPage(){
  const[activeTab,setActiveTab]=useState(0);
  const[selProvider,setSelProvider]=useState(0);
  const[cmpProvider,setCmpProvider]=useState(1);
  const[compareMode,setCompareMode]=useState(false);
  const[expandedIssue,setExpandedIssue]=useState(null);
  const[issuePillar,setIssuePillar]=useState('E');
  const[eSlider,setESlider]=useState(PROVIDERS[0].eW);
  const[sSlider,setSSlider]=useState(PROVIDERS[0].sW);
  const[gSlider,setGSlider]=useState(PROVIDERS[0].gW);
  const[selCompany,setSelCompany]=useState(0);
  const[kpiPillar,setKpiPillar]=useState('E');
  const[kpiSearch,setKpiSearch]=useState('');
  const[selKpi,setSelKpi]=useState(null);
  const[matSector,setMatSector]=useState(null);
  const[matProvider,setMatProvider]=useState(null);
  const[matSearch,setMatSearch]=useState('');
  const[matSort,setMatSort]=useState('disagreement');
  const[customWeights,setCustomWeights]=useState({});
  const[dsFilter,setDsFilter]=useState('All');
  const[dsQualityProv,setDsQualityProv]=useState(0);
  const[matYearView,setMatYearView]=useState(0);

  const prov=PROVIDERS[selProvider];
  const cmpProv=PROVIDERS[cmpProvider];

  const pillarWeightData=useMemo(()=>[
    {name:'Environmental',value:prov.eW,color:T.sage},
    {name:'Social',value:prov.sW,color:T.navyL},
    {name:'Governance',value:prov.gW,color:T.gold}
  ],[selProvider]);

  const issues=useMemo(()=>{
    const pool=issuePillar==='E'?E_ISSUES:issuePillar==='S'?S_ISSUES:G_ISSUES;
    return pool.map((name,i)=>({
      id:i,name,
      weight:Math.round(sr(selProvider*100+i*7+(issuePillar==='E'?0:issuePillar==='S'?200:400))*15+1),
      description:`${name} evaluates corporate performance on key metrics related to ${name.toLowerCase()}. ${prov.name} assesses this through a combination of quantitative indicators and qualitative disclosure analysis, benchmarked against sector peers.`,
      dataSource:DATA_SOURCES[Math.floor(sr(selProvider*50+i*11)*DATA_SOURCES.length)],
      scoring:['Absolute Threshold','Peer Relative','Best-in-Class Benchmark','Trend-Based','Binary Disclosure'][Math.floor(sr(selProvider*70+i*13)*5)],
      criteria:`Score 0-10 based on: disclosure quality (30%), performance vs peers (40%), improvement trend (30%). Minimum threshold: ${Math.round(sr(selProvider*90+i*17)*50+20)}th percentile.`
    }));
  },[selProvider,issuePillar]);

  const whatIfScore=useMemo(()=>{
    const c=COMPANIES[selCompany];
    const total=eSlider+sSlider+gSlider;
    if(total===0)return 0;
    const eN=eSlider/total,sN=sSlider/total,gN=gSlider/total;
    return Math.round((c.baseE*eN+c.baseS*sN+c.baseG*gN)*10)/10;
  },[eSlider,sSlider,gSlider,selCompany]);

  const providerScores=useMemo(()=>PROVIDERS.map((p,pi)=>{
    const c=COMPANIES[selCompany];
    const eAdj=c.baseE+sr(pi*31+selCompany*13)*10-5;
    const sAdj=c.baseS+sr(pi*37+selCompany*17)*10-5;
    const gAdj=c.baseG+sr(pi*43+selCompany*19)*10-5;
    return{provider:p.name,score:Math.round((eAdj*p.eW/100+sAdj*p.sW/100+gAdj*p.gW/100)*10)/10,E:Math.round(eAdj*10)/10,S:Math.round(sAdj*10)/10,G:Math.round(gAdj*10)/10};
  }),[selCompany]);

  const radarData=useMemo(()=>{
    if(!compareMode)return[];
    const dims=['Env Weight','Soc Weight','Gov Weight','Data Breadth','Timeliness','Transparency'];
    return dims.map((d,i)=>({
      dim:d,
      [prov.name]:Math.round(sr(selProvider*50+i*7)*60+40),
      [cmpProv.name]:Math.round(sr(cmpProvider*50+i*7)*60+40)
    }));
  },[compareMode,selProvider,cmpProvider]);

  const deltaTable=useMemo(()=>{
    if(!compareMode)return[];
    const allI=[...E_ISSUES.slice(0,5),...S_ISSUES.slice(0,5),...G_ISSUES.slice(0,4)];
    return allI.map((issue,i)=>{
      const w1=Math.round(sr(selProvider*100+i*7)*15+1);
      const w2=Math.round(sr(cmpProvider*100+i*7)*15+1);
      return{issue,w1,w2,delta:w1-w2};
    });
  },[compareMode,selProvider,cmpProvider]);

  const kpis=useMemo(()=>{
    const all=genKPIs(kpiPillar,kpiPillar==='E'?100:kpiPillar==='S'?200:300);
    if(!kpiSearch)return all;
    const q=kpiSearch.toLowerCase();
    return all.filter(k=>k.name.toLowerCase().includes(q));
  },[kpiPillar,kpiSearch]);

  const coverageScores=useMemo(()=>PROVIDERS.map((p,pi)=>{
    const total=kpis.length;
    const covered=kpis.filter(k=>k.covered[pi]).length;
    return{provider:p.name,covered,total,pct:total>0?Math.round(covered/total*100):0,color:p.color};
  }),[kpis]);

  const criticalGaps=useMemo(()=>kpis.filter(k=>{
    const covCount=k.covered.filter(Boolean).length;
    return covCount<3;
  }),[kpis]);

  const matHeatData=useMemo(()=>{
    const filtered=matSearch?GICS_SECTORS.filter(s=>s.toLowerCase().includes(matSearch.toLowerCase())):GICS_SECTORS;
    return filtered.map((sector)=>{
      const origIdx=GICS_SECTORS.indexOf(sector);
      const scores=PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*31+pi*17+matYearView*100)*8+2));
      const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
      const disagreement=Math.round(Math.sqrt(scores.reduce((a,s)=>a+(s-avg)**2,0)/scores.length)*100)/100;
      return{sector,origIdx,scores,disagreement};
    });
  },[matSearch,matYearView]);

  const sortedMatData=useMemo(()=>{
    const d=[...matHeatData];
    if(matSort==='disagreement')d.sort((a,b)=>b.disagreement-a.disagreement);
    else if(matSort==='name')d.sort((a,b)=>a.sector.localeCompare(b.sector));
    return d;
  },[matHeatData,matSort]);

  const matDrift=useMemo(()=>GICS_SECTORS.map((sector,si)=>{
    const y0=PROVIDERS.map((_,pi)=>sr(si*31+pi*17)*8+2);
    const y2=PROVIDERS.map((_,pi)=>sr(si*31+pi*17+200)*8+2);
    const drift=y0.reduce((a,v,i)=>a+Math.abs(v-y2[i]),0)/y0.length;
    return{sector,drift:Math.round(drift*100)/100};
  }).sort((a,b)=>b.drift-a.drift).slice(0,10),[]);

  const dsGrid=useMemo(()=>{
    let filtered=DATA_SOURCES;
    if(dsFilter!=='All'){
      filtered=DS_CATS[dsFilter]||DATA_SOURCES;
    }
    return filtered.map((src)=>{
      const origIdx=DATA_SOURCES.indexOf(src);
      const usage=PROVIDERS.map((_,pi)=>sr(origIdx*13+pi*19)>0.35);
      const freshness=PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*17+pi*23)*24+1));
      const quality=PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*29+pi*31)*4+1));
      const cat=Object.entries(DS_CATS).find(([,v])=>v.includes(src));
      return{source:src,category:cat?cat[0]:'Other',usage,freshness,quality};
    });
  },[dsFilter]);

  const dsRadar=useMemo(()=>{
    const dims=['Breadth','Timeliness','Verification','Alternative Data','Regulatory Coverage','Transparency'];
    return dims.map((d,i)=>({
      dim:d,...Object.fromEntries(PROVIDERS.map((p,pi)=>[p.name,Math.round(sr(dsQualityProv*50+pi*7+i*11)*40+60)]))
    }));
  },[dsQualityProv]);

  const dsBlindSpots=useMemo(()=>DATA_SOURCES.filter((_src,si)=>{
    return PROVIDERS.every((_,pi)=>sr(si*13+pi*19)<=0.35);
  }),[]);

  const dsFreshness=useMemo(()=>PROVIDERS.map((p,pi)=>{
    const avg=DATA_SOURCES.reduce((a,_,si)=>a+Math.round(sr(si*17+pi*23)*24+1),0)/DATA_SOURCES.length;
    return{provider:p.name,avgMonths:Math.round(avg*10)/10,color:p.color};
  }),[]);

  const handleProviderSwitch=useCallback((idx)=>{
    setSelProvider(idx);
    setESlider(PROVIDERS[idx].eW);
    setSSlider(PROVIDERS[idx].sW);
    setGSlider(PROVIDERS[idx].gW);
    setExpandedIssue(null);
  },[]);

  const st={
    page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
    h1:{fontSize:'26px',fontWeight:700,color:T.navy,margin:'0 0 4px'},
    sub:{fontSize:'14px',color:T.textSec,margin:'0 0 20px'},
    tabs:{display:'flex',gap:'4px',background:T.surface,borderRadius:'10px',padding:'4px',border:`1px solid ${T.border}`,marginBottom:'24px'},
    tab:(a)=>({padding:'10px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:a?600:500,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,transition:'all 0.2s',fontFamily:T.font}),
    card:{background:T.surface,borderRadius:'12px',border:`1px solid ${T.border}`,padding:'20px',marginBottom:'16px'},
    cardTitle:{fontSize:'15px',fontWeight:700,color:T.navy,margin:'0 0 12px'},
    provCard:(a)=>({padding:'14px 18px',borderRadius:'10px',border:`2px solid ${a?T.gold:T.border}`,background:a?T.surfaceH:T.surface,cursor:'pointer',textAlign:'center',transition:'all 0.2s',minWidth:'130px'}),
    btn:(active)=>({padding:'7px 16px',borderRadius:'6px',border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.text,cursor:'pointer',fontSize:'12px',fontWeight:600,fontFamily:T.font}),
    input:{padding:'8px 12px',borderRadius:'6px',border:`1px solid ${T.border}`,fontSize:'13px',fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:'220px'},
    grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'},
    grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'},
    badge:(color)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:600,background:color+'18',color}),
    slider:{width:'100%',accentColor:T.navy},
    progressBar:{height:'8px',borderRadius:'4px',background:T.surfaceH,position:'relative',overflow:'hidden'},
    progressFill:(pct,color)=>({position:'absolute',top:0,left:0,height:'100%',width:`${pct}%`,borderRadius:'4px',background:color,transition:'width 0.5s ease'}),
    heatCell:(val)=>{
      const intensity=val/10;
      const r=Math.round(220-intensity*180);
      const g=Math.round(220-intensity*80);
      const b=Math.round(220-intensity*160);
      return{width:'60px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,cursor:'pointer',borderRadius:'4px',background:`rgb(${r},${g},${b})`,color:intensity>0.6?'#fff':T.text,transition:'transform 0.15s',border:`1px solid ${T.borderL}`};
    },
    mono:{fontFamily:T.mono,fontSize:'12px'}
  };

  /* ========== TAB 1: Methodology Explorer ========== */
  const renderMethodologyExplorer=()=>(
    <div>
      {/* Provider Selector Cards */}
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'20px'}}>
        {PROVIDERS.map((p,i)=>(
          <div key={p.id} style={st.provCard(i===selProvider)} onClick={()=>handleProviderSwitch(i)}>
            <div style={{fontSize:'14px',fontWeight:700,color:i===selProvider?T.navy:T.textSec}}>{p.name}</div>
            <div style={{fontSize:'11px',color:T.textMut,marginTop:'4px'}}>E:{p.eW}% S:{p.sW}% G:{p.gW}%</div>
          </div>
        ))}
      </div>

      {/* Compare Toggle */}
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
        <label style={{fontSize:'13px',fontWeight:600}}>Compare Mode</label>
        <button style={st.btn(compareMode)} onClick={()=>setCompareMode(!compareMode)}>
          {compareMode?'On':'Off'}
        </button>
        {compareMode&&(
          <select value={cmpProvider} onChange={e=>setCmpProvider(+e.target.value)} style={st.input}>
            {PROVIDERS.map((p,i)=>i!==selProvider?<option key={p.id} value={i}>{p.name}</option>:null)}
          </select>
        )}
      </div>

      <div style={st.grid2}>
        {/* Pillar Weight Pie */}
        <div style={st.card}>
          <div style={st.cardTitle}>Pillar Weights: {prov.name}</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pillarWeightData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" animationDuration={600} label={({name,value})=>`${name} ${value}%`}>
                {pillarWeightData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`${v}%`}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* What-If Simulator */}
        <div style={st.card}>
          <div style={st.cardTitle}>What-If Weight Simulator</div>
          <div style={{marginBottom:'10px'}}>
            <select value={selCompany} onChange={e=>setSelCompany(+e.target.value)} style={{...st.input,width:'100%',marginBottom:'10px'}}>
              {COMPANIES.map((c,i)=><option key={i} value={i}>{c.name} ({c.sector})</option>)}
            </select>
          </div>
          {[['Environmental',eSlider,setESlider],['Social',sSlider,setSSlider],['Governance',gSlider,setGSlider]].map(([label,val,setter])=>(
            <div key={label} style={{marginBottom:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',fontWeight:600}}>
                <span>{label}</span><span>{val}%</span>
              </div>
              <input type="range" min={0} max={100} value={val} onChange={e=>setter(+e.target.value)} style={st.slider}/>
            </div>
          ))}
          <div style={{marginTop:'12px',padding:'12px',background:T.surfaceH,borderRadius:'8px',textAlign:'center'}}>
            <div style={{fontSize:'12px',color:T.textSec}}>Simulated Composite Score</div>
            <div style={{fontSize:'28px',fontWeight:800,color:whatIfScore>65?T.green:whatIfScore>45?T.amber:T.red}}>{whatIfScore}</div>
            <div style={{fontSize:'11px',color:T.textMut}}>Sum: {eSlider+sSlider+gSlider}% {eSlider+sSlider+gSlider!==100&&<span style={{color:T.red}}>(not 100%)</span>}</div>
          </div>
        </div>
      </div>

      {/* Compare Radar + Delta */}
      {compareMode&&(
        <div style={st.grid2}>
          <div style={st.card}>
            <div style={st.cardTitle}>{prov.name} vs {cmpProv.name} Radar</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:11,fill:T.textSec}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10}}/>
                <Radar name={prov.name} dataKey={prov.name} stroke={prov.color} fill={prov.color} fillOpacity={0.2}/>
                <Radar name={cmpProv.name} dataKey={cmpProv.name} stroke={cmpProv.color} fill={cmpProv.color} fillOpacity={0.2}/>
                <Legend/>
                <Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={st.card}>
            <div style={st.cardTitle}>Weight Deltas (Top Issues)</div>
            <div style={{maxHeight:'280px',overflowY:'auto'}}>
              <table style={{width:'100%',fontSize:'12px',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:`2px solid ${T.border}`}}>
                    <th style={{textAlign:'left',padding:'6px',color:T.textSec}}>Issue</th>
                    <th style={{textAlign:'center',padding:'6px',color:prov.color}}>{prov.name.split(' ')[0]}</th>
                    <th style={{textAlign:'center',padding:'6px',color:cmpProv.color}}>{cmpProv.name.split(' ')[0]}</th>
                    <th style={{textAlign:'center',padding:'6px'}}>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {deltaTable.map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                      <td style={{padding:'5px 6px',fontSize:'11px'}}>{r.issue}</td>
                      <td style={{textAlign:'center',padding:'5px'}}>{r.w1}%</td>
                      <td style={{textAlign:'center',padding:'5px'}}>{r.w2}%</td>
                      <td style={{textAlign:'center',padding:'5px',color:r.delta>0?T.green:r.delta<0?T.red:T.textMut,fontWeight:600}}>
                        {r.delta>0?'+':''}{r.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* "Why Do They Disagree?" */}
      {compareMode&&(
        <div style={{...st.card,background:'linear-gradient(135deg,#f0ede7,#e8e4dc)'}}>
          <div style={st.cardTitle}>Why Do {prov.name} and {cmpProv.name} Disagree on {COMPANIES[selCompany].name}?</div>
          <div style={st.grid3}>
            {[
              {title:'Weight Divergence',color:T.sage,text:`${prov.name} weights Environmental at ${prov.eW}% vs ${cmpProv.name} at ${cmpProv.eW}%. This ${Math.abs(prov.eW-cmpProv.eW)}pp gap drives ${Math.abs(prov.eW-cmpProv.eW)>8?'significant':'moderate'} score divergence for carbon-intensive sectors.`},
              {title:'Data Source Differences',color:T.navyL,text:`${prov.name} relies more on ${DATA_SOURCES[selProvider%DATA_SOURCES.length]} while ${cmpProv.name} emphasizes ${DATA_SOURCES[cmpProvider%DATA_SOURCES.length]}. Different data freshness windows (3-18 months) affect timeliness of assessments.`},
              {title:'Scoring Methodology',color:T.gold,text:`${prov.name} uses ${selProvider%2===0?'absolute thresholds':'peer-relative scoring'} while ${cmpProv.name} applies ${cmpProvider%2===0?'absolute thresholds':'best-in-class benchmarks'}. This structural difference explains ~${Math.round(sr(selProvider*cmpProvider+selCompany)*15+5)}% of the rating gap.`}
            ].map((panel,i)=>(
              <div key={i} style={{padding:'12px',background:T.surface,borderRadius:'8px'}}>
                <div style={{fontSize:'12px',fontWeight:700,color:panel.color,marginBottom:'4px'}}>{panel.title}</div>
                <div style={{fontSize:'12px',color:T.textSec}}>{panel.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Issues Accordion */}
      <div style={st.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={st.cardTitle}>Key Issues: {prov.name}</div>
          <div style={{display:'flex',gap:'4px'}}>
            {['E','S','G'].map(p=>(
              <button key={p} style={st.btn(issuePillar===p)} onClick={()=>{setIssuePillar(p);setExpandedIssue(null);}}>
                {p==='E'?'Environmental':p==='S'?'Social':'Governance'} ({p==='E'?15:p==='S'?15:12})
              </button>
            ))}
          </div>
        </div>
        <div style={{maxHeight:'420px',overflowY:'auto'}}>
          {issues.map((iss,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${T.borderL}`,padding:'8px 0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',padding:'4px 0'}} onClick={()=>setExpandedIssue(expandedIssue===i?null:i)}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'16px',color:T.textMut,transition:'transform 0.2s',transform:expandedIssue===i?'rotate(90deg)':'rotate(0deg)',display:'inline-block'}}>&#9654;</span>
                  <span style={{fontSize:'13px',fontWeight:600}}>{iss.name}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span style={st.badge(T.sage)}>Weight: {iss.weight}%</span>
                  <span style={st.badge(T.navyL)}>{iss.scoring}</span>
                </div>
              </div>
              {expandedIssue===i&&(
                <div style={{padding:'12px 24px',background:T.surfaceH,borderRadius:'8px',marginTop:'6px',fontSize:'12px',lineHeight:1.7}}>
                  <p style={{margin:'0 0 8px',color:T.textSec}}>{iss.description}</p>
                  <div style={st.grid3}>
                    <div><span style={{fontWeight:700,color:T.navy}}>Data Source:</span> {iss.dataSource}</div>
                    <div><span style={{fontWeight:700,color:T.navy}}>Scoring:</span> {iss.scoring}</div>
                    <div><span style={{fontWeight:700,color:T.navy}}>Criteria:</span> {iss.criteria}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Provider Scores Bar */}
      <div style={st.card}>
        <div style={st.cardTitle}>All Provider Scores: {COMPANIES[selCompany].name}</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={providerScores} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:11}}/>
            <YAxis type="category" dataKey="provider" width={120} tick={{fontSize:11}}/>
            <Tooltip formatter={v=>`${v}/100`}/>
            <Bar dataKey="score" radius={[0,4,4,0]}>
              {providerScores.map((_,i)=><Cell key={i} fill={PROVIDERS[i].color}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ========== TAB 2: KPI Coverage Matrix ========== */
  const renderKPICoverage=()=>(
    <div>
      {/* Pillar Selector + Search */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <div style={{display:'flex',gap:'4px'}}>
          {['E','S','G'].map(p=>(
            <button key={p} style={st.btn(kpiPillar===p)} onClick={()=>{setKpiPillar(p);setSelKpi(null);setKpiSearch('');}}>
              {p==='E'?'Environmental':p==='S'?'Social':'Governance'}
            </button>
          ))}
        </div>
        <input value={kpiSearch} onChange={e=>setKpiSearch(e.target.value)} placeholder="Search KPIs..." style={st.input}/>
      </div>

      {/* Coverage Scores */}
      <div style={{...st.card,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px'}}>
        {coverageScores.map((cs,i)=>(
          <div key={i}>
            <div style={{fontSize:'12px',fontWeight:700,marginBottom:'4px'}}>{cs.provider}</div>
            <div style={st.progressBar}>
              <div style={st.progressFill(cs.pct,cs.color)}/>
            </div>
            <div style={{fontSize:'11px',color:T.textSec,marginTop:'2px'}}>{cs.covered}/{cs.total} ({cs.pct}%)</div>
          </div>
        ))}
      </div>

      {/* KPI x Provider Matrix */}
      <div style={{...st.card,overflowX:'auto'}}>
        <div style={st.cardTitle}>{kpiPillar==='E'?'Environmental':kpiPillar==='S'?'Social':'Governance'} KPI Coverage ({kpis.length} KPIs x 6 Providers)</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              <th style={{textAlign:'left',padding:'8px',width:'40px',color:T.textSec,fontWeight:600}}>#</th>
              <th style={{textAlign:'left',padding:'8px',minWidth:'240px',color:T.textSec,fontWeight:600}}>KPI Name</th>
              {PROVIDERS.map(p=>(
                <th key={p.id} style={{textAlign:'center',padding:'8px',color:p.color,fontWeight:600,minWidth:'80px'}}>{p.name.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpis.slice(0,60).map((k,ki)=>(
              <tr key={ki} style={{borderBottom:`1px solid ${T.borderL}`,background:selKpi===ki?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelKpi(selKpi===ki?null:ki)}>
                <td style={{padding:'6px 8px',color:T.textMut,...st.mono}}>{ki+1}</td>
                <td style={{padding:'6px 8px',fontWeight:500}}>{k.name}</td>
                {PROVIDERS.map((p,pi)=>(
                  <td key={pi} style={{textAlign:'center',padding:'6px'}}>
                    {k.covered[pi]?(
                      <span style={{color:T.green,fontWeight:700}}>&#10003; <span style={{fontSize:'10px',color:T.textMut}}>w{k.weight[pi]}</span></span>
                    ):(
                      <span style={{color:T.red}}>&#10007;</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KPI Detail Panel */}
      {selKpi!==null&&kpis[selKpi]&&(
        <div style={{...st.card,background:T.surfaceH}}>
          <div style={st.cardTitle}>KPI Detail: {kpis[selKpi].name}</div>
          <div style={st.grid3}>
            {PROVIDERS.map((p,pi)=>(
              <div key={pi} style={{padding:'12px',background:T.surface,borderRadius:'8px',border:`1px solid ${kpis[selKpi].covered[pi]?T.green+'40':T.red+'40'}`}}>
                <div style={{fontWeight:700,fontSize:'13px',color:p.color,marginBottom:'6px'}}>{p.name}</div>
                {kpis[selKpi].covered[pi]?(
                  <div style={{fontSize:'12px',lineHeight:1.7,color:T.textSec}}>
                    <div><strong>Weight:</strong> {kpis[selKpi].weight[pi]}/6</div>
                    <div><strong>Scoring:</strong> {kpis[selKpi].scoring}</div>
                    <div><strong>Data Source:</strong> {kpis[selKpi].source}</div>
                    <div><strong>Threshold:</strong> {kpis[selKpi].threshold}th percentile</div>
                  </div>
                ):(
                  <div style={{fontSize:'12px',color:T.red}}>Not covered by this provider</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={st.grid2}>
        {/* Critical Gaps */}
        <div style={st.card}>
          <div style={st.cardTitle}>Critical Gaps (covered by &lt;3 providers)</div>
          <div style={{maxHeight:'260px',overflowY:'auto'}}>
            {criticalGaps.length===0?(
              <div style={{fontSize:'13px',color:T.textMut,padding:'12px'}}>No critical gaps found for this pillar.</div>
            ):criticalGaps.map((k,i)=>(
              <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.borderL}`,fontSize:'12px',display:'flex',justifyContent:'space-between'}}>
                <span>{k.name}</span>
                <span style={st.badge(T.red)}>{k.covered.filter(Boolean).length} providers</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Overlap Summary */}
        <div style={st.card}>
          <div style={st.cardTitle}>Provider KPI Overlap Summary</div>
          <div style={{fontSize:'12px',lineHeight:2}}>
            {PROVIDERS.map((p1,i)=>PROVIDERS.slice(i+1).map((p2,j)=>{
              const idx2=i+j+1;
              const overlap=kpis.filter(k=>k.covered[i]&&k.covered[idx2]).length;
              const pct=kpis.length>0?Math.round(overlap/kpis.length*100):0;
              return(
                <div key={`${i}-${idx2}`} style={{display:'flex',justifyContent:'space-between',borderBottom:`1px solid ${T.borderL}`,padding:'2px 0'}}>
                  <span>{p1.name.split(' ')[0]} + {p2.name.split(' ')[0]}</span>
                  <span style={{fontWeight:600,color:pct>60?T.green:pct>40?T.amber:T.red}}>{overlap} ({pct}%)</span>
                </div>
              );
            })).flat().slice(0,15)}
          </div>
        </div>
      </div>
    </div>
  );

  /* ========== TAB 3: Materiality Matrix ========== */
  const renderMateriality=()=>(
    <div>
      {/* Controls */}
      <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'16px',flexWrap:'wrap'}}>
        <input value={matSearch} onChange={e=>setMatSearch(e.target.value)} placeholder="Search sectors..." style={st.input}/>
        <select value={matSort} onChange={e=>setMatSort(e.target.value)} style={{...st.input,width:'180px'}}>
          <option value="disagreement">Sort by Disagreement</option>
          <option value="name">Sort by Name</option>
        </select>
        <div style={{display:'flex',gap:'4px'}}>
          {['Current','1Y Ago','2Y Ago'].map((yr,i)=>(
            <button key={i} style={st.btn(matYearView===i)} onClick={()=>setMatYearView(i)}>{yr}</button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{...st.card,overflowX:'auto'}}>
        <div style={st.cardTitle}>Materiality Heatmap: 15 Sub-Industries x 6 Providers</div>
        <table style={{borderCollapse:'collapse',fontSize:'12px'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left',padding:'8px',minWidth:'200px',color:T.textSec}}>Sector</th>
              {PROVIDERS.map(p=><th key={p.id} style={{textAlign:'center',padding:'8px',color:p.color,fontWeight:600}}>{p.name.split(' ')[0]}</th>)}
              <th style={{textAlign:'center',padding:'8px',color:T.textSec}}>Disagree.</th>
            </tr>
          </thead>
          <tbody>
            {sortedMatData.map((row,ri)=>(
              <tr key={ri}>
                <td style={{padding:'6px 8px',fontWeight:500}}>{row.sector}</td>
                {row.scores.map((s,ci)=>(
                  <td key={ci} style={{padding:'4px'}}>
                    <div style={st.heatCell(s)} onClick={()=>{setMatSector(row.origIdx);setMatProvider(ci);}}>
                      {s.toFixed(1)}
                    </div>
                  </td>
                ))}
                <td style={{textAlign:'center',padding:'6px',fontWeight:700,color:row.disagreement>2?T.red:row.disagreement>1.2?T.amber:T.green,...st.mono}}>
                  {row.disagreement.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cell Detail */}
      {matSector!==null&&matProvider!==null&&(
        <div style={{...st.card,background:T.surfaceH}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div style={st.cardTitle}>Top 10 Material Issues: {GICS_SECTORS[matSector]} x {PROVIDERS[matProvider].name}</div>
            <button style={st.btn(false)} onClick={()=>{setMatSector(null);setMatProvider(null);}}>Close</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{textAlign:'left',padding:'6px'}}>Issue</th>
                <th style={{textAlign:'center',padding:'6px'}}>Pillar</th>
                <th style={{textAlign:'center',padding:'6px'}}>Weight</th>
                <th style={{textAlign:'left',padding:'6px',width:'140px'}}>Bar</th>
              </tr>
            </thead>
            <tbody>
              {genMateriality(matSector,matProvider,42).map((m,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'5px 6px'}}>{m.issue}</td>
                  <td style={{textAlign:'center'}}><span style={st.badge(m.pillar==='E'?T.sage:m.pillar==='S'?T.navyL:T.gold)}>{m.pillar}</span></td>
                  <td style={{textAlign:'center',fontWeight:600,...st.mono}}>{m.weight}</td>
                  <td style={{padding:'5px 6px'}}>
                    <div style={st.progressBar}>
                      <div style={st.progressFill(m.weight*10,m.pillar==='E'?T.sage:m.pillar==='S'?T.navyL:T.gold)}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={st.grid2}>
        {/* Disagreement Bar Chart */}
        <div style={st.card}>
          <div style={st.cardTitle}>Sector Disagreement Scores</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedMatData.slice(0,10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:11}}/>
              <YAxis type="category" dataKey="sector" width={160} tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="disagreement" radius={[0,4,4,0]}>
                {sortedMatData.slice(0,10).map((d,i)=><Cell key={i} fill={d.disagreement>2?T.red:d.disagreement>1.2?T.amber:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Materiality Drift */}
        <div style={st.card}>
          <div style={st.cardTitle}>Materiality Drift: Top 10 Sectors (3-Year Change)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matDrift} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:11}}/>
              <YAxis type="category" dataKey="sector" width={160} tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="drift" fill={T.navyL} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Custom Sector Weights for Portfolio */}
      <div style={st.card}>
        <div style={st.cardTitle}>Portfolio Materiality: Add Custom Sector Weights</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'12px'}}>
          {GICS_SECTORS.map((s,i)=>(
            <div key={i} style={{fontSize:'11px'}}>
              <div style={{fontWeight:500,marginBottom:'2px'}}>{s.split(' ').slice(0,2).join(' ')}</div>
              <input type="number" min={0} max={100} value={customWeights[i]||0} onChange={e=>setCustomWeights({...customWeights,[i]:+e.target.value})} style={{...st.input,width:'60px',padding:'4px 6px',fontSize:'11px'}}/>
              <span style={{fontSize:'10px',color:T.textMut}}>%</span>
            </div>
          ))}
        </div>
        {Object.values(customWeights).some(v=>v>0)&&(
          <div style={{padding:'12px',background:T.surfaceH,borderRadius:'8px'}}>
            <div style={{fontSize:'13px',fontWeight:700,marginBottom:'6px'}}>Weighted Portfolio Materiality Score</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'8px'}}>
              {PROVIDERS.map((p,pi)=>{
                const totalW=Object.entries(customWeights).reduce((a,[,v])=>a+v,0);
                if(totalW===0)return null;
                const score=Object.entries(customWeights).reduce((a,[k,v])=>{
                  if(v===0)return a;
                  return a+(sr(+k*31+pi*17+matYearView*100)*8+2)*v;
                },0)/totalW;
                return(
                  <div key={pi} style={{textAlign:'center'}}>
                    <div style={{fontSize:'11px',color:p.color,fontWeight:600}}>{p.name.split(' ')[0]}</div>
                    <div style={{fontSize:'20px',fontWeight:800,color:T.navy}}>{score.toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ========== TAB 4: Data Source Audit ========== */
  const renderDataSourceAudit=()=>(
    <div>
      {/* Source Type Filter */}
      <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'16px',flexWrap:'wrap'}}>
        {['All','Self-Reported','Third-Party','Regulatory','Alternative'].map(f=>(
          <button key={f} style={st.btn(dsFilter===f)} onClick={()=>setDsFilter(f)}>{f}</button>
        ))}
        <div style={{marginLeft:'auto',fontSize:'12px',color:T.textSec}}>
          {dsGrid.length} data sources shown
        </div>
      </div>

      {/* Data Source x Provider Grid */}
      <div style={{...st.card,overflowX:'auto'}}>
        <div style={st.cardTitle}>Data Source Usage Matrix ({dsGrid.length} Sources x 6 Providers)</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              <th style={{textAlign:'left',padding:'6px',minWidth:'180px',color:T.textSec}}>Data Source</th>
              <th style={{textAlign:'left',padding:'6px',minWidth:'90px',color:T.textSec}}>Category</th>
              {PROVIDERS.map(p=>(
                <th key={p.id} style={{textAlign:'center',padding:'6px',color:p.color,fontWeight:600}}>{p.name.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dsGrid.map((ds,di)=>(
              <tr key={di} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'5px 6px',fontWeight:500}}>{ds.source}</td>
                <td style={{padding:'5px 6px'}}>
                  <span style={st.badge(ds.category==='Self-Reported'?T.navyL:ds.category==='Third-Party'?T.sage:ds.category==='Regulatory'?T.gold:T.amber)}>
                    {ds.category}
                  </span>
                </td>
                {ds.usage.map((u,pi)=>(
                  <td key={pi} style={{textAlign:'center',padding:'5px'}}>
                    {u?(
                      <span>
                        <span style={{color:T.green}}>&#10003;</span>
                        <span style={{fontSize:'9px',color:T.textMut,marginLeft:'2px'}}>Q{ds.quality[pi]}</span>
                        <span style={{fontSize:'9px',color:T.textMut,marginLeft:'2px'}}>{ds.freshness[pi]}m</span>
                      </span>
                    ):(
                      <span style={{color:T.red}}>&#10007;</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={st.grid2}>
        {/* Data Quality Radar */}
        <div style={st.card}>
          <div style={st.cardTitle}>Data Quality Scorecard (All Providers)</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={dsRadar}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:11,fill:T.textSec}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10}}/>
              {PROVIDERS.map((p,pi)=>(
                <Radar key={p.id} name={p.name} dataKey={p.name} stroke={p.color} fill={p.color} fillOpacity={pi===selProvider?0.2:0.05} strokeWidth={pi===selProvider?2:1}/>
              ))}
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              <Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Freshness Bar */}
        <div style={st.card}>
          <div style={st.cardTitle}>Average Data Freshness by Provider (months)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dsFreshness}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="provider" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:11}} label={{value:'Months',angle:-90,position:'insideLeft',fontSize:11}}/>
              <Tooltip formatter={v=>`${v} months`}/>
              <Bar dataKey="avgMonths" radius={[4,4,0,0]}>
                {dsFreshness.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Blind Spots */}
      <div style={st.card}>
        <div style={st.cardTitle}>Blind Spots: Data Sources No Provider Uses</div>
        {dsBlindSpots.length===0?(
          <div style={{fontSize:'13px',color:T.green,padding:'8px'}}>All data sources are used by at least one provider.</div>
        ):(
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {dsBlindSpots.map((src,i)=>(
              <span key={i} style={{...st.badge(T.red),fontSize:'12px',padding:'6px 12px'}}>{src}</span>
            ))}
          </div>
        )}
      </div>

      {/* Quality Improvement Recommendations */}
      <div style={st.card}>
        <div style={st.cardTitle}>Quality Improvement Recommendations</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
          {PROVIDERS.map((p,pi)=>{
            const usedSources=dsGrid.filter(ds=>ds.usage[pi]);
            const unused=dsGrid.filter(ds=>!ds.usage[pi]).length;
            const avgQ=usedSources.length>0?usedSources.reduce((a,ds)=>a+ds.quality[pi],0)/usedSources.length:0;
            const avgF=usedSources.length>0?usedSources.reduce((a,ds)=>a+ds.freshness[pi],0)/usedSources.length:0;
            return(
              <div key={pi} style={{padding:'12px',background:T.surfaceH,borderRadius:'8px'}}>
                <div style={{fontWeight:700,color:p.color,fontSize:'13px',marginBottom:'6px'}}>{p.name}</div>
                <div style={{fontSize:'12px',lineHeight:1.8,color:T.textSec}}>
                  <div>Unused sources: <strong style={{color:unused>5?T.red:T.green}}>{unused}</strong></div>
                  <div>Avg quality: <strong>{avgQ.toFixed(1)}/5</strong></div>
                  <div>Avg freshness: <strong>{avgF.toFixed(0)} months</strong></div>
                  <div style={{marginTop:'6px',fontSize:'11px',fontStyle:'italic',color:T.textMut}}>
                    {unused>8?'Consider expanding to alternative data sources.':
                     avgQ<3?'Focus on improving verification processes.':
                     avgF>15?'Data timeliness needs improvement.':'Strong data foundation overall.'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Audit Summary CSV */}
      <div style={{textAlign:'right',marginTop:'8px'}}>
        <button style={{...st.btn(true),padding:'10px 24px'}} onClick={()=>{
          const rows=[['Data Source','Category',...PROVIDERS.map(p=>p.name+' (Use|Quality|Freshness)')].join(',')];
          dsGrid.forEach(ds=>{
            rows.push([`"${ds.source}"`,ds.category,...ds.usage.map((u,pi)=>u?`Yes|Q${ds.quality[pi]}|${ds.freshness[pi]}m`:'No')].join(','));
          });
          const blob=new Blob([rows.join('\n')],{type:'text/csv'});
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');
          a.href=url;a.download='data_source_audit.csv';a.click();
          URL.revokeObjectURL(url);
        }}>
          Export Audit Summary CSV
        </button>
      </div>
    </div>
  );

  /* ========== MAIN RENDER ========== */
  return(
    <div style={st.page}>
      <div style={{marginBottom:'20px'}}>
        <h1 style={st.h1}>Ratings Methodology Decoder</h1>
        <p style={st.sub}>EP-AK2 | Deep-dive into ESG rating methodologies across 6 providers, 42 sub-issues, 180 KPIs, 15 GICS sectors, and 20 data sources</p>
      </div>

      {/* Summary Stat Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'}}>
        {[
          {label:'Providers',value:'6',sub:'Rating Agencies'},
          {label:'E Sub-Issues',value:'15',sub:'Environmental'},
          {label:'S Sub-Issues',value:'15',sub:'Social'},
          {label:'G Sub-Issues',value:'12',sub:'Governance'},
          {label:'KPIs per Pillar',value:'60',sub:'Coverage Tracked'},
          {label:'Data Sources',value:'20',sub:'Audit Categories'}
        ].map((m,i)=>(
          <div key={i} style={{...st.card,textAlign:'center',padding:'14px'}}>
            <div style={{fontSize:'22px',fontWeight:800,color:T.navy}}>{m.value}</div>
            <div style={{fontSize:'12px',fontWeight:600,color:T.textSec}}>{m.label}</div>
            <div style={{fontSize:'10px',color:T.textMut}}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={st.tabs}>
        {TABS.map((t,i)=>(
          <button key={i} style={st.tab(activeTab===i)} onClick={()=>setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab===0&&renderMethodologyExplorer()}
      {activeTab===1&&renderKPICoverage()}
      {activeTab===2&&renderMateriality()}
      {activeTab===3&&renderDataSourceAudit()}
    </div>
  );
}
