import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Methodology Explorer','Pillar Deep-Dive','Materiality Matrix','Data Source Audit'];
const PROVIDERS=['MSCI','Sustainalytics','ISS ESG','CDP','S&P Global','Bloomberg'];
const PIE_COLORS=[T.navy,T.sage,T.gold,T.navyL,T.goldL,T.sageL];
const PILLARS=['Environmental','Social','Governance'];
const GICS_SECTORS=['Energy','Materials','Industrials','Consumer Disc.','Consumer Staples','Healthcare','Financials','IT','Communication','Utilities'];

const PROVIDER_DATA={
  'MSCI':{
    desc:'MSCI ESG Ratings use a rules-based methodology to assess industry-specific ESG risks and how well companies manage them relative to peers. Scores range from AAA (leader) to CCC (laggard) across 35 key issues grouped into E, S, and G pillars.',
    pillarWeights:[40,30,30],
    keyIssues:{E:['Carbon Emissions','Water Stress','Toxic Waste','Biodiversity','Raw Material Sourcing','Electronic Waste','Packaging','Climate Vulnerability','Energy Efficiency','Green Building'],S:['Labor Management','Health & Safety','Human Capital','Privacy & Data','Product Safety','Community Relations','Supply Chain Labor','Controversial Sourcing','Access to Healthcare','Chemical Safety'],G:['Board Diversity','Executive Pay','Ownership Structure','Accounting Practices','Business Ethics','Tax Transparency','Anti-Corruption','Whistleblower Protection','Board Independence','Audit Quality']},
    dataSources:['Company Disclosures','Government Databases','NGO Data','Media Sources','Sector-Specific Datasets'],
    scoreRange:'AAA to CCC (7 levels)',method:'Relative to industry peers; weighted key-issue aggregation'
  },
  'Sustainalytics':{
    desc:'Sustainalytics ESG Risk Ratings measure a company\'s unmanaged ESG risk. The two-dimensional framework assesses corporate Exposure to material ESG issues and Management of those issues. Lower scores indicate less unmanaged risk.',
    pillarWeights:[35,35,30],
    keyIssues:{E:['GHG Emissions','Effluents & Waste','Land Use','Resource Use','Water Use','Environmental Supply Chain','Air Pollution','Ecological Impacts','Climate Strategy','Packaging Waste'],S:['Human Rights','Labor Standards','Health & Safety','Community Impact','Customer Relations','Data Privacy','Product Governance','Diversity & Inclusion','Stakeholder Engagement','Social Supply Chain'],G:['Corporate Governance','Business Ethics','ESG Integration','Bribery & Corruption','Tax Strategy','Board Effectiveness','Risk Management','Regulatory Compliance','Lobbying & Advocacy','Executive Remuneration']},
    dataSources:['Company Reports','Regulatory Filings','Controversy Monitoring','NGO Reports','News & Media'],
    scoreRange:'0-100 (lower = less risk)',method:'Exposure minus Management = Unmanaged Risk score'
  },
  'ISS ESG':{
    desc:'ISS ESG Corporate Rating evaluates companies on over 100 ESG indicators using a 1-10 decile scale within 4 pillars. The methodology emphasizes sector-specific material topics and forward-looking performance indicators.',
    pillarWeights:[30,25,25,20],
    keyIssues:{E:['Climate Strategy','Energy Management','Water Management','Pollution Prevention','Circular Economy','Biodiversity Protection','Environmental Reporting','Scope 3 Emissions','Green Products','Natural Capital'],S:['Workforce Diversity','Training & Development','Occupational Health','Living Wages','Freedom of Association','Customer Welfare','Community Investment','Indigenous Rights','Responsible Marketing','Digital Rights'],G:['Board Structure','Shareholder Rights','Remuneration Policy','Audit Independence','Risk Oversight','Stakeholder Governance','Anti-Money Laundering','Cybersecurity Governance','Supply Chain Governance','Political Contributions']},
    dataSources:['Direct Company Engagement','Public Filings','Industry Benchmarks','Controversial Weapons Screening','Norms-Based Research'],
    scoreRange:'1-10 decile scale',method:'4-pillar weighted aggregation with sector-specific materiality'
  },
  'CDP':{
    desc:'CDP scores companies on their environmental disclosure and performance across Climate Change, Water Security, and Forests programs. Scores range from A (leadership) to D- (disclosure), with F for non-disclosure.',
    pillarWeights:[50,30,20],
    keyIssues:{E:['Scope 1 Emissions','Scope 2 Emissions','Scope 3 Emissions','Science-Based Targets','Renewable Energy','Water Withdrawal','Water Recycling','Deforestation Policy','Forest Certification','Carbon Pricing'],S:['Just Transition','Community Water Access','Smallholder Engagement','Worker Health & Safety','Indigenous Land Rights','Food Security Impact','Biodiversity Co-Benefits','Stakeholder Engagement','Value Chain Responsibility','Consumer Awareness'],G:['Board-Level Oversight','Climate Governance','Water Governance','Forest Governance','Incentivized Management','Risk Assessment Process','Strategy Integration','Public Policy Engagement','Disclosure Completeness','Verification & Assurance']},
    dataSources:['CDP Questionnaire Responses','Company Self-Reporting','Verification Statements','Sector Benchmarks','Partnership Data'],
    scoreRange:'A to D- (with F for non-disclosure)',method:'Disclosure, Awareness, Management, Leadership scoring ladder'
  },
  'S&P Global':{
    desc:'S&P Global ESG Scores are derived from the Corporate Sustainability Assessment (CSA), the annual evaluation covering 61 industry-specific questionnaires. Scores are normalized to 0-100 and weighted by financially material criteria.',
    pillarWeights:[35,35,30],
    keyIssues:{E:['Climate Strategy','Operational Eco-Efficiency','Environmental Reporting','Environmental Policy','Product Stewardship','Water Risk','Biodiversity','Waste Management','Renewable Energy Sourcing','Environmental Innovation'],S:['Human Capital','Talent Attraction','Labor Practice Indicators','Social Reporting','Philanthropy','Human Rights','Stakeholder Engagement','Social Impact','Occupational Health','Supply Chain Social'],G:['Corporate Governance','Codes of Conduct','Risk & Crisis Management','Tax Strategy','Materiality Assessment','Policy Influence','Cybersecurity','Anti-Crime Policies','Brand Management','Innovation Management']},
    dataSources:['CSA Questionnaire','Public Documents','Media & Stakeholder Analysis','Industry Reports','Direct Company Engagement'],
    scoreRange:'0-100 percentile',method:'Industry-specific CSA with financial materiality weighting'
  },
  'Bloomberg':{
    desc:'Bloomberg ESG Disclosure Scores measure the extent of a company\'s ESG data disclosure. The scoring is based on data points collected across Environmental, Social, and Governance pillars, with higher scores indicating more comprehensive reporting.',
    pillarWeights:[33,33,34],
    keyIssues:{E:['GHG Emissions','Energy Consumption','Water Usage','Waste Generation','Environmental Fines','Green Revenue','Carbon Intensity','Environmental Mgmt Systems','Climate Risk Exposure','Pollution Incidents'],S:['Employee Turnover','Injury Rate','Training Hours','Gender Pay Gap','Diversity Statistics','Community Spending','Product Recalls','Customer Satisfaction','Health & Safety Fines','Human Rights Policy'],G:['Board Size','Board Independence','CEO-Chair Separation','Executive Compensation Ratio','Audit Committee Independence','Political Donations','ESG Reporting Framework','Anti-Corruption Training','Data Breaches','Whistleblower Mechanism']},
    dataSources:['Company Filings','Exchange Data','Government Registries','News Wire Services','Satellite Data'],
    scoreRange:'0-100 disclosure score',method:'Data availability weighted; disclosure breadth and depth'
  }
};

const PILLAR_KPIS={
  Environmental:['GHG Scope 1','GHG Scope 2','GHG Scope 3','Energy Intensity','Water Withdrawal','Waste Recycled','Biodiversity Impact','Air Pollutants','Environmental Fines','Renewable %','Green Revenue','Carbon Pricing','SBTi Alignment','Circular Economy','Land Use','Deforestation','Chemical Safety','Packaging Waste','Environmental Mgmt','Climate Adaptation'],
  Social:['Employee Turnover','Injury Rate','Training Hours','Gender Diversity','Pay Equity','Living Wage','Community Investment','Data Privacy','Product Safety','Customer Satisfaction','Supply Chain Audit','Freedom of Association','Child Labor','Human Rights Due Diligence','Stakeholder Engagement','Health & Safety Mgmt','Diversity Policy','Grievance Mechanism','Just Transition','Social Impact'],
  Governance:['Board Independence','CEO-Chair Split','Board Diversity','Executive Pay Ratio','Audit Committee','Risk Committee','ESG Oversight','Shareholder Rights','Anti-Corruption','Whistleblower','Tax Transparency','Political Donations','Lobbying Disclosure','Cybersecurity','Business Ethics','Bribery Policy','Related Party Transactions','Voting Rights','Board Tenure','Succession Planning']
};

const DATA_SOURCES=[
  {name:'Annual/Sustainability Reports',type:'Self-Reported',freshness:'Annual'},
  {name:'CDP Questionnaire Responses',type:'Self-Reported',freshness:'Annual'},
  {name:'Regulatory Filings (10-K, 20-F)',type:'Regulatory',freshness:'Quarterly'},
  {name:'Proxy Statements',type:'Regulatory',freshness:'Annual'},
  {name:'News & Media Monitoring',type:'Third-Party',freshness:'Real-Time'},
  {name:'Controversy/Incident Databases',type:'Third-Party',freshness:'Weekly'},
  {name:'NGO & Watchdog Reports',type:'Third-Party',freshness:'Periodic'},
  {name:'Satellite & Geospatial Data',type:'Third-Party',freshness:'Monthly'},
  {name:'Government & Census Data',type:'Regulatory',freshness:'Annual'},
  {name:'Patent & Innovation Data',type:'Third-Party',freshness:'Quarterly'},
  {name:'Employee Review Platforms',type:'Third-Party',freshness:'Real-Time'},
  {name:'Supply Chain Databases',type:'Third-Party',freshness:'Monthly'},
  {name:'Industry Benchmarks',type:'Third-Party',freshness:'Annual'},
  {name:'Direct Company Engagement',type:'Self-Reported',freshness:'Annual'},
  {name:'Verification & Audit Statements',type:'Verified',freshness:'Annual'}
];

const DS_PROVIDER_MAP={
  'MSCI':     [1,0,1,1,1,1,1,0,1,0,0,0,1,0,0],
  'Sustainalytics':[1,0,1,1,1,1,1,0,1,0,0,1,1,0,0],
  'ISS ESG':  [1,0,1,1,1,1,1,0,1,0,0,0,1,1,0],
  'CDP':      [1,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
  'S&P Global':[1,1,1,1,1,0,0,0,1,0,0,0,1,1,0],
  'Bloomberg': [1,0,1,1,1,0,0,1,1,1,1,0,0,0,0]
};

const QUALITY_TIERS=['Tier 1','Tier 2','Tier 1','Tier 1','Tier 2','Tier 3','Tier 3','Tier 2','Tier 1','Tier 2','Tier 3','Tier 2','Tier 2','Tier 1','Tier 1'];

const sty={
  card:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16},
  tab:(a)=>({padding:'10px 20px',cursor:'pointer',borderRadius:'8px 8px 0 0',fontWeight:a?700:500,color:a?T.navy:T.textSec,background:a?T.surface:T.surfaceH,border:a?`1px solid ${T.border}`:'1px solid transparent',borderBottom:a?`2px solid ${T.gold}`:'none',fontSize:14,transition:'all 0.2s',fontFamily:T.font}),
  select:{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.navy,fontFamily:T.font,fontSize:14,cursor:'pointer',minWidth:180},
  badge:(c)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,color:T.surface,background:c,marginRight:6}),
  pill:(a)=>({display:'inline-block',padding:'6px 16px',borderRadius:20,fontSize:13,fontWeight:a?700:500,cursor:'pointer',background:a?T.navy:T.surfaceH,color:a?'#fff':T.textSec,border:`1px solid ${a?T.navy:T.border}`,transition:'all 0.2s',fontFamily:T.font}),
  slider:{width:'100%',accentColor:T.gold,cursor:'pointer'},
  heatCell:(v)=>({width:40,height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,fontSize:11,fontWeight:600,color:v>0.6?'#fff':T.navy,background:v>0.8?T.navy:v>0.6?T.navyL:v>0.4?T.gold:v>0.2?T.goldL:T.surfaceH,transition:'all 0.2s',cursor:'pointer'}),
  check:{color:T.green,fontWeight:700,fontSize:16},
  cross:{color:T.red,fontWeight:700,fontSize:16},
  th:{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:12,color:T.textSec,borderBottom:`2px solid ${T.border}`,background:T.surfaceH,position:'sticky',top:0,fontFamily:T.font},
  td:{padding:'8px 12px',fontSize:13,borderBottom:`1px solid ${T.border}`,fontFamily:T.font,color:T.text}
};

function genKpiMap(pillar,pIdx){
  const kpis=PILLAR_KPIS[pillar];
  return PROVIDERS.map((prov,pi)=>kpis.map((k,ki)=>sr(pi*100+ki*10+pIdx*7)>0.35?1:0));
}

function genMateriality(si,pi){return sr(si*17+pi*31+3)*0.8+0.1;}

function computeDisagreement(si){
  const vals=PROVIDERS.map((_,pi)=>genMateriality(si,pi));
  const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
  const variance=vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length;
  return Math.sqrt(variance);
}

function genSampleScore(provIdx,eW,sW,gW){
  const baseE=sr(provIdx*11+1)*40+45;
  const baseS=sr(provIdx*11+2)*35+50;
  const baseG=sr(provIdx*11+3)*30+55;
  const total=(baseE*eW+baseS*sW+baseG*gW)/(eW+sW+gW);
  return Math.round(total*10)/10;
}

export default function RatingsMethodologyDecoderPage(){
  const [activeTab,setActiveTab]=useState(0);
  const [selProvider,setSelProvider]=useState('MSCI');
  const [compareProvider,setCompareProvider]=useState('');
  const [showCompare,setShowCompare]=useState(false);
  const [eWeight,setEWeight]=useState(40);
  const [sWeight,setSWeight]=useState(30);
  const [gWeight,setGWeight]=useState(30);
  const [selPillar,setSelPillar]=useState('Environmental');
  const [selSector,setSelSector]=useState(null);
  const [dsFilter,setDsFilter]=useState('All');
  const [dsSort,setDsSort]=useState('name');
  const [matSearch,setMatSearch]=useState('');
  const [pillarSearch,setPillarSearch]=useState('');

  const providerData=PROVIDER_DATA[selProvider];
  const provIdx=PROVIDERS.indexOf(selProvider);

  const pieData=useMemo(()=>{
    const w=providerData.pillarWeights;
    const labels=selProvider==='ISS ESG'?['Environment','Social','Governance','Cross-Cutting']:PILLARS;
    return labels.map((l,i)=>({name:l,value:w[i]||0}));
  },[selProvider,providerData]);

  const whatIfScore=useMemo(()=>genSampleScore(provIdx,eWeight,sWeight,gWeight),[provIdx,eWeight,sWeight,gWeight]);
  const defaultScore=useMemo(()=>{
    const w=providerData.pillarWeights;
    return genSampleScore(provIdx,w[0],w[1],w[2]);
  },[provIdx,providerData]);

  const pillarBarData=useMemo(()=>PROVIDERS.map((p,i)=>{
    const w=PROVIDER_DATA[p].pillarWeights;
    const pIdx=PILLARS.indexOf(selPillar);
    return{name:p,weight:w[pIdx]||0};
  }),[selPillar]);

  const pillarKpiMap=useMemo(()=>genKpiMap(selPillar,PILLARS.indexOf(selPillar)),[selPillar]);

  const filteredKpis=useMemo(()=>{
    const kpis=PILLAR_KPIS[selPillar];
    if(!pillarSearch)return kpis.map((k,i)=>({name:k,idx:i}));
    return kpis.map((k,i)=>({name:k,idx:i})).filter(k=>k.name.toLowerCase().includes(pillarSearch.toLowerCase()));
  },[selPillar,pillarSearch]);

  const materialityData=useMemo(()=>{
    return GICS_SECTORS.map((sec,si)=>{
      const row={sector:sec,disagreement:Math.round(computeDisagreement(si)*100)/100};
      PROVIDERS.forEach((p,pi)=>{row[p]=Math.round(genMateriality(si,pi)*100)/100;});
      return row;
    }).filter(r=>!matSearch||r.sector.toLowerCase().includes(matSearch.toLowerCase()));
  },[matSearch]);

  const sectorDetail=useMemo(()=>{
    if(selSector===null)return null;
    const si=selSector;
    const issues=['Carbon Intensity','Water Stress','Labor Rights','Data Privacy','Board Quality','Supply Chain','Biodiversity','Innovation','Community Impact','Tax Ethics'];
    return issues.map((iss,ii)=>{
      const row={issue:iss};
      PROVIDERS.forEach((p,pi)=>{row[p]=Math.round(sr(si*31+pi*17+ii*7)*100)/100;});
      return row;
    });
  },[selSector]);

  const radarData=useMemo(()=>{
    if(!showCompare||!compareProvider)return[];
    const dims=['Transparency','Timeliness','Coverage','Granularity','Methodology','Reliability'];
    return dims.map((d,i)=>({
      dim:d,
      [selProvider]:Math.round(sr(provIdx*13+i*7)*60+40),
      [compareProvider]:Math.round(sr(PROVIDERS.indexOf(compareProvider)*13+i*7)*60+40)
    }));
  },[showCompare,compareProvider,selProvider,provIdx]);

  const filteredDS=useMemo(()=>{
    let ds=DATA_SOURCES.map((d,i)=>({...d,idx:i}));
    if(dsFilter!=='All')ds=ds.filter(d=>d.type===dsFilter);
    ds.sort((a,b)=>dsSort==='name'?a.name.localeCompare(b.name):a.type.localeCompare(b.type));
    return ds;
  },[dsFilter,dsSort]);

  const compareData=useMemo(()=>{
    if(!showCompare||!compareProvider)return null;
    return PROVIDER_DATA[compareProvider];
  },[showCompare,compareProvider]);

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text,padding:24}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <span style={{fontSize:28}}>EP-AK2</span>
          <span style={sty.badge(T.navy)}>Ratings Intelligence</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:800,margin:0,color:T.navy}}>Ratings Methodology Decoder</h1>
        <p style={{color:T.textSec,margin:'6px 0 0',fontSize:14}}>Deep-dive into how each ESG ratings provider constructs their scores, weights pillars, and selects material issues.</p>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
        {[{label:'Providers Tracked',value:'6',sub:'Major ESG raters'},{label:'Key Issues',value:'35+',sub:'Per provider avg'},{label:'GICS Sectors',value:'10',sub:'Materiality mapped'},{label:'Data Sources',value:'15',sub:'Types audited'},{label:'KPIs Per Pillar',value:'20',sub:'Cross-provider'}].map((s,i)=>(
          <div key={i} style={{...sty.card,textAlign:'center',padding:16}}>
            <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{s.value}</div>
            <div style={{fontSize:13,fontWeight:600,color:T.textSec}}>{s.label}</div>
            <div style={{fontSize:11,color:T.textMut}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
        {TABS.map((t,i)=>(
          <button key={i} style={sty.tab(activeTab===i)} onClick={()=>setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {/* TAB 0: Methodology Explorer */}
      {activeTab===0&&(
        <div>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
            <label style={{fontWeight:600,fontSize:14}}>Select Provider:</label>
            <select value={selProvider} onChange={e=>{setSelProvider(e.target.value);setShowCompare(false);setEWeight(PROVIDER_DATA[e.target.value].pillarWeights[0]);setSWeight(PROVIDER_DATA[e.target.value].pillarWeights[1]);setGWeight(PROVIDER_DATA[e.target.value].pillarWeights[2]);}} style={sty.select}>
              {PROVIDERS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={()=>setShowCompare(!showCompare)} style={{...sty.pill(showCompare),marginLeft:8}}>
              {showCompare?'Hide Compare':'Compare Providers'}
            </button>
            {showCompare&&(
              <select value={compareProvider} onChange={e=>setCompareProvider(e.target.value)} style={sty.select}>
                <option value="">Select 2nd provider...</option>
                {PROVIDERS.filter(p=>p!==selProvider).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:showCompare&&compareData?'1fr 1fr':'1fr',gap:16}}>
            {/* Primary provider card */}
            <div style={sty.card}>
              <h3 style={{margin:'0 0 8px',fontSize:18,color:T.navy}}>{selProvider}</h3>
              <p style={{fontSize:13,color:T.textSec,lineHeight:1.6,margin:'0 0 16px'}}>{providerData.desc}</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                <span style={sty.badge(T.sage)}>{providerData.scoreRange}</span>
                <span style={sty.badge(T.gold)}>{providerData.method.split(';')[0]}</span>
              </div>

              {/* Pie Chart */}
              <h4 style={{fontSize:14,color:T.textSec,margin:'16px 0 8px'}}>Pillar Weight Distribution</h4>
              <div style={{height:220}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name} ${value}%`} labelLine={false}>
                      {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v)=>`${v}%`}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Key Issues */}
              <h4 style={{fontSize:14,color:T.textSec,margin:'16px 0 8px'}}>Key Issues by Pillar</h4>
              {Object.entries(providerData.keyIssues).map(([pillar,issues])=>(
                <div key={pillar} style={{marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:4}}>{pillar==='E'?'Environmental':pillar==='S'?'Social':'Governance'} ({issues.length})</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {issues.map((iss,i)=>(
                      <span key={i} style={{fontSize:11,padding:'3px 8px',borderRadius:8,background:T.surfaceH,color:T.textSec,border:`1px solid ${T.border}`}}>{iss}</span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Data Sources */}
              <h4 style={{fontSize:14,color:T.textSec,margin:'16px 0 8px'}}>Primary Data Sources</h4>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {providerData.dataSources.map((ds,i)=>(
                  <span key={i} style={sty.badge(T.navyL)}>{ds}</span>
                ))}
              </div>
            </div>

            {/* Compare provider card */}
            {showCompare&&compareData&&(
              <div style={sty.card}>
                <h3 style={{margin:'0 0 8px',fontSize:18,color:T.navy}}>{compareProvider}</h3>
                <p style={{fontSize:13,color:T.textSec,lineHeight:1.6,margin:'0 0 16px'}}>{compareData.desc}</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                  <span style={sty.badge(T.sage)}>{compareData.scoreRange}</span>
                  <span style={sty.badge(T.gold)}>{compareData.method.split(';')[0]}</span>
                </div>
                <h4 style={{fontSize:14,color:T.textSec,margin:'16px 0 8px'}}>Pillar Weight Distribution</h4>
                <div style={{height:220}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={(()=>{const w=compareData.pillarWeights;const labels=compareProvider==='ISS ESG'?['Environment','Social','Governance','Cross-Cutting']:PILLARS;return labels.map((l,i)=>({name:l,value:w[i]||0}));})()}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name} ${value}%`} labelLine={false}>
                        {compareData.pillarWeights.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v)=>`${v}%`}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {Object.entries(compareData.keyIssues).map(([pillar,issues])=>(
                  <div key={pillar} style={{marginBottom:12}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:4}}>{pillar==='E'?'Environmental':pillar==='S'?'Social':'Governance'} ({issues.length})</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {issues.map((iss,i)=>(
                        <span key={i} style={{fontSize:11,padding:'3px 8px',borderRadius:8,background:T.surfaceH,color:T.textSec,border:`1px solid ${T.border}`}}>{iss}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Radar comparison */}
          {showCompare&&compareProvider&&radarData.length>0&&(
            <div style={{...sty.card,marginTop:16}}>
              <h4 style={{margin:'0 0 12px',fontSize:16,color:T.navy}}>Provider Comparison Radar</h4>
              <div style={{height:320}}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius={120}>
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="dim" tick={{fontSize:12,fill:T.textSec}}/>
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10}}/>
                    <Radar name={selProvider} dataKey={selProvider} stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                    <Radar name={compareProvider} dataKey={compareProvider} stroke={T.gold} fill={T.gold} fillOpacity={0.2}/>
                    <Tooltip/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:'flex',gap:20,justifyContent:'center',marginTop:8}}>
                <span style={{fontSize:12,color:T.navy}}><span style={{display:'inline-block',width:12,height:12,background:T.navy,borderRadius:2,marginRight:4,verticalAlign:'middle'}}/>{selProvider}</span>
                <span style={{fontSize:12,color:T.gold}}><span style={{display:'inline-block',width:12,height:12,background:T.gold,borderRadius:2,marginRight:4,verticalAlign:'middle'}}/>{compareProvider}</span>
              </div>
            </div>
          )}

          {/* What-If Weight Simulator */}
          <div style={{...sty.card,marginTop:16}}>
            <h4 style={{margin:'0 0 4px',fontSize:16,color:T.navy}}>What-If Weight Simulator</h4>
            <p style={{fontSize:12,color:T.textMut,margin:'0 0 16px'}}>Adjust E/S/G pillar weights to see how a sample company's score changes for {selProvider}.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginBottom:16}}>
              {[{label:'Environmental',val:eWeight,set:setEWeight,col:T.sage},{label:'Social',val:sWeight,set:setSWeight,col:T.gold},{label:'Governance',val:gWeight,set:setGWeight,col:T.navy}].map((s,i)=>(
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:s.col}}>{s.label}</span>
                    <span style={{fontSize:13,fontWeight:700,color:s.col}}>{s.val}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={s.val} onChange={e=>s.set(Number(e.target.value))} style={sty.slider}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:24,alignItems:'center',padding:16,background:T.surfaceH,borderRadius:10}}>
              <div>
                <div style={{fontSize:12,color:T.textMut}}>Default Score ({selProvider} weights)</div>
                <div style={{fontSize:28,fontWeight:800,color:T.navy}}>{defaultScore}</div>
              </div>
              <div style={{fontSize:24,color:T.textMut}}>vs</div>
              <div>
                <div style={{fontSize:12,color:T.textMut}}>Your Custom Weights</div>
                <div style={{fontSize:28,fontWeight:800,color:whatIfScore>defaultScore?T.green:whatIfScore<defaultScore?T.red:T.navy}}>{whatIfScore}</div>
              </div>
              <div style={{marginLeft:'auto',textAlign:'right'}}>
                <div style={{fontSize:12,color:T.textMut}}>Delta</div>
                <div style={{fontSize:20,fontWeight:700,color:whatIfScore-defaultScore>0?T.green:whatIfScore-defaultScore<0?T.red:T.textMut}}>
                  {whatIfScore-defaultScore>0?'+':''}{Math.round((whatIfScore-defaultScore)*10)/10}
                </div>
              </div>
            </div>
            <button onClick={()=>{setEWeight(providerData.pillarWeights[0]);setSWeight(providerData.pillarWeights[1]);setGWeight(providerData.pillarWeights[2]);}} style={{...sty.pill(false),marginTop:12,fontSize:12}}>Reset to Provider Defaults</button>
          </div>
        </div>
      )}

      {/* TAB 1: Pillar Deep-Dive */}
      {activeTab===1&&(
        <div>
          <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
            <label style={{fontWeight:600,fontSize:14,marginRight:8}}>Select Pillar:</label>
            {PILLARS.map(p=>(
              <button key={p} onClick={()=>setSelPillar(p)} style={sty.pill(selPillar===p)}>{p}</button>
            ))}
          </div>

          {/* Weight comparison bar chart */}
          <div style={sty.card}>
            <h4 style={{margin:'0 0 12px',fontSize:16,color:T.navy}}>Provider Weight for {selPillar} Pillar (%)</h4>
            <div style={{height:260}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" domain={[0,60]} tick={{fontSize:12,fill:T.textSec}}/>
                  <YAxis type="category" dataKey="name" width={110} tick={{fontSize:12,fill:T.textSec}}/>
                  <Tooltip formatter={v=>`${v}%`}/>
                  <Bar dataKey="weight" fill={selPillar==='Environmental'?T.sage:selPillar==='Social'?T.gold:T.navy} radius={[0,6,6,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub-issue comparison table */}
          <div style={{...sty.card,marginTop:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
              <h4 style={{margin:0,fontSize:16,color:T.navy}}>KPI Coverage: {selPillar} ({PILLAR_KPIS[selPillar].length} indicators)</h4>
              <input
                type="text"
                placeholder="Search KPIs..."
                value={pillarSearch}
                onChange={e=>setPillarSearch(e.target.value)}
                style={{...sty.select,minWidth:200}}
              />
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr>
                    <th style={{...sty.th,minWidth:180}}>KPI / Indicator</th>
                    {PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',minWidth:90}}>{p}</th>)}
                    <th style={{...sty.th,textAlign:'center',minWidth:80}}>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKpis.map((kpi)=>{
                    const coverage=PROVIDERS.reduce((s,_,pi)=>s+pillarKpiMap[pi][kpi.idx],0);
                    return(
                      <tr key={kpi.idx} style={{background:kpi.idx%2===0?T.surface:T.surfaceH}}>
                        <td style={sty.td}>{kpi.name}</td>
                        {PROVIDERS.map((p,pi)=>(
                          <td key={pi} style={{...sty.td,textAlign:'center'}}>
                            {pillarKpiMap[pi][kpi.idx]?<span style={sty.check}>&#10003;</span>:<span style={sty.cross}>&#10007;</span>}
                          </td>
                        ))}
                        <td style={{...sty.td,textAlign:'center'}}>
                          <span style={sty.badge(coverage>=5?T.green:coverage>=3?T.amber:T.red)}>{coverage}/6</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:12,fontSize:12,color:T.textMut}}>
              Coverage summary: {PILLAR_KPIS[selPillar].filter((_,ki)=>PROVIDERS.every((__,pi)=>pillarKpiMap[pi][ki])).length} universally covered | {PILLAR_KPIS[selPillar].filter((_,ki)=>PROVIDERS.filter((__,pi)=>pillarKpiMap[pi][ki]).length<=2).length} sparsely covered (&le;2 providers)
            </div>
          </div>

          {/* Provider approach descriptions */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:12,marginTop:16}}>
            {PROVIDERS.map((p,pi)=>{
              const pData=PROVIDER_DATA[p];
              const pillarKey=selPillar==='Environmental'?'E':selPillar==='Social'?'S':'G';
              const issues=pData.keyIssues[pillarKey]||[];
              return(
                <div key={p} style={{...sty.card,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <h5 style={{margin:0,fontSize:14,color:T.navy}}>{p}</h5>
                    <span style={sty.badge(PIE_COLORS[pi%PIE_COLORS.length])}>{pData.pillarWeights[PILLARS.indexOf(selPillar)]||'N/A'}%</span>
                  </div>
                  <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Score Range: {pData.scoreRange}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {issues.slice(0,6).map((iss,i)=>(
                      <span key={i} style={{fontSize:10,padding:'2px 6px',borderRadius:6,background:T.surfaceH,color:T.textSec}}>{iss}</span>
                    ))}
                    {issues.length>6&&<span style={{fontSize:10,color:T.textMut}}>+{issues.length-6} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Materiality Matrix */}
      {activeTab===2&&(
        <div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
            <h3 style={{margin:0,fontSize:18,color:T.navy}}>Materiality Map: GICS Sectors x Providers</h3>
            <input
              type="text"
              placeholder="Filter sectors..."
              value={matSearch}
              onChange={e=>setMatSearch(e.target.value)}
              style={{...sty.select,minWidth:200,marginLeft:'auto'}}
            />
          </div>

          {/* Heatmap */}
          <div style={sty.card}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{...sty.th,minWidth:140}}>Sector</th>
                    {PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',minWidth:90}}>{p}</th>)}
                    <th style={{...sty.th,textAlign:'center',minWidth:100}}>Disagreement</th>
                  </tr>
                </thead>
                <tbody>
                  {materialityData.map((row,ri)=>{
                    const sectorIdx=GICS_SECTORS.indexOf(row.sector);
                    return(
                      <tr key={ri} style={{cursor:'pointer',background:selSector===sectorIdx?T.surfaceH:T.surface,transition:'background 0.2s'}} onClick={()=>setSelSector(selSector===sectorIdx?null:sectorIdx)}>
                        <td style={{...sty.td,fontWeight:600}}>{row.sector}</td>
                        {PROVIDERS.map(p=>(
                          <td key={p} style={{...sty.td,textAlign:'center'}}>
                            <div style={sty.heatCell(row[p])}>{(row[p]*100).toFixed(0)}</div>
                          </td>
                        ))}
                        <td style={{...sty.td,textAlign:'center'}}>
                          <span style={sty.badge(row.disagreement>0.2?T.red:row.disagreement>0.12?T.amber:T.green)}>
                            {row.disagreement.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:12,display:'flex',gap:16,fontSize:11,color:T.textMut,alignItems:'center'}}>
              <span>Materiality weight (0-100):</span>
              <div style={{display:'flex',gap:4,alignItems:'center'}}>
                {[0.1,0.3,0.5,0.7,0.9].map(v=>(
                  <div key={v} style={{...sty.heatCell(v),width:28,height:24,fontSize:9}}>{(v*100).toFixed(0)}</div>
                ))}
              </div>
              <span style={{marginLeft:16}}>Click a sector row to see detailed breakdown.</span>
            </div>
          </div>

          {/* Sector detail */}
          {selSector!==null&&sectorDetail&&(
            <div style={{...sty.card,marginTop:16}}>
              <h4 style={{margin:'0 0 12px',fontSize:16,color:T.navy}}>Detailed Breakdown: {GICS_SECTORS[selSector]}</h4>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr>
                      <th style={{...sty.th,minWidth:160}}>Issue</th>
                      {PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',minWidth:80}}>{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sectorDetail.map((row,ri)=>(
                      <tr key={ri} style={{background:ri%2===0?T.surface:T.surfaceH}}>
                        <td style={{...sty.td,fontWeight:600}}>{row.issue}</td>
                        {PROVIDERS.map(p=>(
                          <td key={p} style={{...sty.td,textAlign:'center'}}>
                            <div style={sty.heatCell(row[p])}>{(row[p]*100).toFixed(0)}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={()=>setSelSector(null)} style={{...sty.pill(false),marginTop:12,fontSize:12}}>Close Detail</button>
            </div>
          )}

          {/* Disagreement bar chart */}
          <div style={{...sty.card,marginTop:16}}>
            <h4 style={{margin:'0 0 12px',fontSize:16,color:T.navy}}>Provider Disagreement by Sector</h4>
            <p style={{fontSize:12,color:T.textMut,margin:'0 0 12px'}}>Higher disagreement indicates more divergent materiality assessments across providers.</p>
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GICS_SECTORS.map((s,i)=>({sector:s,disagreement:Math.round(computeDisagreement(i)*100)/100}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
                  <YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,0.4]}/>
                  <Tooltip formatter={v=>v.toFixed(3)}/>
                  <Bar dataKey="disagreement" fill={T.navyL} radius={[4,4,0,0]}>
                    {GICS_SECTORS.map((_,i)=>{
                      const d=computeDisagreement(i);
                      return <Cell key={i} fill={d>0.2?T.red:d>0.12?T.amber:T.sage}/>;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Data Source Audit */}
      {activeTab===3&&(
        <div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
            <h3 style={{margin:0,fontSize:18,color:T.navy}}>Data Source Audit</h3>
            <div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
              <label style={{fontSize:12,fontWeight:600,color:T.textSec,alignSelf:'center'}}>Filter:</label>
              {['All','Self-Reported','Third-Party','Regulatory','Verified'].map(f=>(
                <button key={f} onClick={()=>setDsFilter(f)} style={sty.pill(dsFilter===f)}>{f}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <label style={{fontSize:12,fontWeight:600,color:T.textSec}}>Sort:</label>
              <select value={dsSort} onChange={e=>setDsSort(e.target.value)} style={{...sty.select,minWidth:120}}>
                <option value="name">By Name</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>

          <div style={sty.card}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={{...sty.th,minWidth:220}}>Data Source</th>
                    <th style={{...sty.th,minWidth:100}}>Type</th>
                    <th style={{...sty.th,minWidth:90}}>Freshness</th>
                    <th style={{...sty.th,minWidth:80}}>Quality Tier</th>
                    {PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',minWidth:80}}>{p}</th>)}
                    <th style={{...sty.th,textAlign:'center',minWidth:80}}>Adoption</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDS.map((ds)=>{
                    const adoption=PROVIDERS.reduce((s,p)=>s+DS_PROVIDER_MAP[p][ds.idx],0);
                    const typeColor=ds.type==='Self-Reported'?T.gold:ds.type==='Third-Party'?T.navyL:ds.type==='Regulatory'?T.sage:T.green;
                    const freshnessColor=ds.freshness==='Real-Time'?T.green:ds.freshness==='Weekly'?T.sage:ds.freshness==='Monthly'?T.amber:ds.freshness==='Quarterly'?T.gold:T.textMut;
                    return(
                      <tr key={ds.idx} style={{background:ds.idx%2===0?T.surface:T.surfaceH}}>
                        <td style={{...sty.td,fontWeight:600}}>{ds.name}</td>
                        <td style={sty.td}><span style={sty.badge(typeColor)}>{ds.type}</span></td>
                        <td style={sty.td}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:freshnessColor,display:'inline-block'}}/>
                            <span style={{fontSize:12}}>{ds.freshness}</span>
                          </span>
                        </td>
                        <td style={sty.td}>
                          <span style={{fontSize:12,fontWeight:600,color:QUALITY_TIERS[ds.idx]==='Tier 1'?T.green:QUALITY_TIERS[ds.idx]==='Tier 2'?T.amber:T.red}}>
                            {QUALITY_TIERS[ds.idx]}
                          </span>
                        </td>
                        {PROVIDERS.map(p=>(
                          <td key={p} style={{...sty.td,textAlign:'center'}}>
                            {DS_PROVIDER_MAP[p][ds.idx]?<span style={sty.check}>&#10003;</span>:<span style={sty.cross}>&#10007;</span>}
                          </td>
                        ))}
                        <td style={{...sty.td,textAlign:'center'}}>
                          <span style={sty.badge(adoption>=5?T.green:adoption>=3?T.amber:T.red)}>{adoption}/6</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:16}}>
            {PROVIDERS.map((p,pi)=>{
              const totalUsed=DS_PROVIDER_MAP[p].reduce((s,v)=>s+v,0);
              const selfReport=DATA_SOURCES.filter((d,i)=>d.type==='Self-Reported'&&DS_PROVIDER_MAP[p][i]).length;
              const thirdParty=DATA_SOURCES.filter((d,i)=>d.type==='Third-Party'&&DS_PROVIDER_MAP[p][i]).length;
              const regulatory=DATA_SOURCES.filter((d,i)=>d.type==='Regulatory'&&DS_PROVIDER_MAP[p][i]).length;
              const verified=DATA_SOURCES.filter((d,i)=>d.type==='Verified'&&DS_PROVIDER_MAP[p][i]).length;
              return(
                <div key={p} style={{...sty.card,padding:16}}>
                  <h5 style={{margin:'0 0 8px',fontSize:14,color:T.navy}}>{p}</h5>
                  <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{totalUsed}<span style={{fontSize:12,fontWeight:400,color:T.textMut}}>/{DATA_SOURCES.length} sources</span></div>
                  <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                      <span style={{color:T.textSec}}>Self-Reported</span>
                      <span style={{fontWeight:700,color:T.gold}}>{selfReport}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                      <span style={{color:T.textSec}}>Third-Party</span>
                      <span style={{fontWeight:700,color:T.navyL}}>{thirdParty}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                      <span style={{color:T.textSec}}>Regulatory</span>
                      <span style={{fontWeight:700,color:T.sage}}>{regulatory}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                      <span style={{color:T.textSec}}>Verified</span>
                      <span style={{fontWeight:700,color:T.green}}>{verified}</span>
                    </div>
                  </div>
                  {/* Mini coverage bar */}
                  <div style={{marginTop:8,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(totalUsed/DATA_SOURCES.length)*100}%`,background:T.navy,borderRadius:3,transition:'width 0.3s'}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data source coverage chart */}
          <div style={{...sty.card,marginTop:16}}>
            <h4 style={{margin:'0 0 12px',fontSize:16,color:T.navy}}>Data Source Adoption Across Providers</h4>
            <div style={{height:300}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA_SOURCES.map((ds,i)=>({name:ds.name.length>20?ds.name.slice(0,18)+'...':ds.name,adoption:PROVIDERS.reduce((s,p)=>s+DS_PROVIDER_MAP[p][i],0)}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={80}/>
                  <YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,6]}/>
                  <Tooltip/>
                  <Bar dataKey="adoption" fill={T.navyL} radius={[4,4,0,0]}>
                    {DATA_SOURCES.map((_,i)=>{
                      const a=PROVIDERS.reduce((s,p)=>s+DS_PROVIDER_MAP[p][i],0);
                      return <Cell key={i} fill={a>=5?T.sage:a>=3?T.gold:T.red}/>;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Freshness legend & quality tier guide */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}}>
            <div style={sty.card}>
              <h5 style={{margin:'0 0 8px',fontSize:14,color:T.navy}}>Freshness Indicator Guide</h5>
              {['Real-Time','Weekly','Monthly','Quarterly','Annual'].map((f,i)=>{
                const colors=[T.green,T.sage,T.amber,T.gold,T.textMut];
                return(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:colors[i],display:'inline-block'}}/>
                    <span style={{fontSize:12,color:T.textSec}}>{f}</span>
                    <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>
                      {['<1 min lag','Updated weekly','Updated monthly','Updated quarterly','Updated yearly'][i]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={sty.card}>
              <h5 style={{margin:'0 0 8px',fontSize:14,color:T.navy}}>Quality Tier Assessment</h5>
              {[{tier:'Tier 1',desc:'Verified by independent third party or regulator',col:T.green},{tier:'Tier 2',desc:'Reported by company with some external validation',col:T.amber},{tier:'Tier 3',desc:'Self-reported or aggregated without independent verification',col:T.red}].map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:t.col,minWidth:50}}>{t.tier}</span>
                  <span style={{fontSize:12,color:T.textSec}}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{marginTop:32,padding:'16px 0',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut}}>
        <span>EP-AK2 Ratings Methodology Decoder | 6 providers | 4 analysis dimensions</span>
        <span>Data: Deterministic seed-based | No live API dependency</span>
      </div>
    </div>
  );
}
