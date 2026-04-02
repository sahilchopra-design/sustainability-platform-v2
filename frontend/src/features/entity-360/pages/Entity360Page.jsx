import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0e7490',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Automotive','Energy','Financial Services','Healthcare','Technology','Materials','Consumer Goods','Industrials','Real Estate','Utilities'];
const REGIONS=['North America','Europe','Asia Pacific','Middle East','Latin America','Africa'];
const ENTITY_NAMES=[
  'Apex Energy Holdings','Nordic Materials AG','Global Auto Group','Pacific Technology','Atlantic Financial','Summit Healthcare','Quantum Industrials','Meridian Consumer','Vertex Real Estate','Nova Utilities',
  'Trans-Atlantic Resources','Prime Logistics Corp','Stellar Chemicals plc','Pinnacle Foods SA','Horizon Renewables','Zenith Banking Group','Crest Infrastructure NV','Alpine Construction SE','Pacific Retailers','Nordic Shipping ASA',
];

const genEntities=(n)=>Array.from({length:n},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);const s4=sr(i*23+17);
  const sector=SECTORS[Math.floor(s*SECTORS.length)];
  const region=REGIONS[Math.floor(s2*REGIONS.length)];
  const esgScore=Math.floor(s3*65+25);
  const climateScore=Math.floor(sr(i*29+5)*70+20);
  const socialScore=Math.floor(sr(i*31+7)*70+20);
  const govScore=Math.floor(sr(i*37+9)*70+20);
  return{
    id:i,
    name:ENTITY_NAMES[i%ENTITY_NAMES.length]+` (${String.fromCharCode(65+Math.floor(s4*26))})`,
    ticker:[sector.slice(0,3).toUpperCase(),String(1000+i).slice(1)].join(''),
    sector,region,esgScore,climateScore,socialScore,govScore,
    marketCap:+(sr(i*41+5)*200+1).toFixed(1),
    revenue:+(sr(i*43+9)*50+0.5).toFixed(1),
    employees:Math.floor(sr(i*47+3)*80000+500),
    sbtiStatus:['Committed','Target Set','No Commitment','In Progress','Achieved'][Math.floor(sr(i*53+7)*5)],
    tcfdAligned:sr(i*59+11)>0.4,
    csrdScope:sr(i*61+5)>0.5,
    scope1:Math.floor(sr(i*67+3)*4000+100),
    scope2:Math.floor(sr(i*71+7)*2000+50),
    scope3:Math.floor(sr(i*73+11)*20000+500),
    controversies:Math.floor(sr(i*79+5)*8),
    redFlags:Math.floor(sr(i*83+9)*3),
    country:['USA','UK','Germany','France','Japan','Australia','Canada','Netherlands','Sweden','Denmark'][Math.floor(sr(i*89+3)*10)],
    lei:`LEI-${String(Math.floor(sr(i*97+7)*1e12)).slice(0,20)}`,
    isin:`${['US','GB','DE','FR','JP','AU'][Math.floor(sr(i*101+5)*6)]}${String(Math.floor(sr(i*103+9)*1e10)).slice(0,10)}`,
    rating:['AAA','AA','A','BBB','BB','B','CCC'][Math.floor(sr(i*107+3)*7)],
    temperature:+(sr(i*109+7)*2.5+1.5).toFixed(1),
    netZeroYear:sr(i*113+5)>0.3?[2040,2045,2050,2060][Math.floor(sr(i*113+5)*4)]:null,
  };
});

const ENTITIES=genEntities(20);
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25'];

const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});
const scoreColor=(s)=>s>=70?T.green:s>=45?T.amber:T.red;
const tempColor=(t)=>t<=1.5?T.green:t<=2?T.amber:t<=2.5?'#ea580c':T.red;

export default function Entity360Page(){
  const [tab,setTab]=useState(0);
  const [selEntity,setSelEntity]=useState(ENTITIES[0]);
  const TABS=['Entity Profile','Risk Intelligence','Regulatory Exposure','Action Tracker'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AY3</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>CROSS-MODULE · UNIFIED INTELLIGENCE · ESG + CLIMATE + REGULATORY + SUPPLY CHAIN</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Entity 360° Intelligence</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Unified entity-level risk profile — climate, ESG, regulatory exposure, and action priorities in one view</p>
        </div>

        {/* Entity Selector Bar */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'14px 20px',marginBottom:20,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:600,color:T.textMut}}>ENTITY</span>
            <select value={selEntity.id} onChange={e=>setSelEntity(ENTITIES.find(en=>en.id===+e.target.value))} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:260}}>
              {ENTITIES.map(en=><option key={en.id} value={en.id}>{en.name}</option>)}
            </select>
          </div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[
              {label:'Ticker',value:selEntity.ticker,mono:true},
              {label:'Sector',value:selEntity.sector},
              {label:'Region',value:selEntity.region},
              {label:'Market Cap',value:`$${selEntity.marketCap}bn`,mono:true},
              {label:'Temperature',value:`${selEntity.temperature}°C`,color:tempColor(selEntity.temperature),mono:true},
              {label:'ESG Score',value:selEntity.esgScore,color:scoreColor(selEntity.esgScore),mono:true},
            ].map((f,i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:2}}>{f.label}</div>
                <div style={{fontSize:14,fontWeight:700,color:f.color||T.navy,fontFamily:f.mono?T.mono:T.font}}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<EntityProfile entity={selEntity}/>}
        {tab===1&&<RiskIntelligence entity={selEntity}/>}
        {tab===2&&<RegulatoryExposure entity={selEntity}/>}
        {tab===3&&<ActionTracker entity={selEntity}/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: ENTITY PROFILE ===== */
function EntityProfile({entity}){
  const qTrend=QUARTERS.map((q,i)=>({q,esg:Math.floor(sr(entity.id*31+i*7)*25+entity.esgScore-10),climate:Math.floor(sr(entity.id*37+i*9)*25+entity.climateScore-10)}));
  const peerData=ENTITIES.filter(e=>e.sector===entity.sector).slice(0,6).map(e=>({name:e.ticker,esg:e.esgScore,climate:e.climateScore}));
  const emissionsBreakdown=[
    {name:'Scope 1',value:entity.scope1,color:T.red},
    {name:'Scope 2',value:entity.scope2,color:T.amber},
    {name:'Scope 3',value:entity.scope3,color:T.purple},
  ];
  const totalEmissions=entity.scope1+entity.scope2+entity.scope3;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'ESG Score',value:entity.esgScore,sub:'Composite E+S+G',color:scoreColor(entity.esgScore)},
          {label:'Temperature Alignment',value:`${entity.temperature}°C`,sub:'Implied warming pathway',color:tempColor(entity.temperature)},
          {label:'Revenue',value:`$${entity.revenue}bn`,sub:`${entity.employees.toLocaleString()} employees`},
          {label:'Controversies',value:entity.controversies,sub:`${entity.redFlags} red flags`,color:entity.controversies>4?T.red:entity.controversies>1?T.amber:T.green},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 300px',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>ESG & Climate Score Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="q" style={{fontSize:10}}/>
              <YAxis domain={[0,100]} style={{fontSize:10}}/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="esg" name="ESG Score" stroke={T.navy} strokeWidth={2} dot={{r:2}}/>
              <Line type="monotone" dataKey="climate" name="Climate Score" stroke={T.teal} strokeWidth={2} dot={{r:2}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Peer Comparison — {entity.sector}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={peerData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" style={{fontSize:10}}/>
              <YAxis domain={[0,100]} style={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="esg" name="ESG" fill={T.navy} radius={[4,4,0,0]}>
                {peerData.map((e,i)=><Cell key={i} fill={e.name===entity.ticker?T.gold:T.navy}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>GHG Emissions (tCO₂e)</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={emissionsBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {emissionsBreakdown.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={v=>v.toLocaleString()+' tCO₂e'}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:8}}>
            {emissionsBreakdown.map((e,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                <span style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:e.color,display:'inline-block'}}/>{e.name}</span>
                <span style={{fontFamily:T.mono,fontWeight:700,color:e.color}}>{(e.value/1000).toFixed(1)}k</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${T.borderL}`,paddingTop:4,display:'flex',justifyContent:'space-between',fontSize:11,marginTop:2}}>
              <span style={{fontWeight:700}}>Total</span>
              <span style={{fontFamily:T.mono,fontWeight:700}}>{(totalEmissions/1000).toFixed(1)}k tCO₂e</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Entity Intelligence Card</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {group:'Identifiers',fields:[{label:'LEI',value:entity.lei},{label:'ISIN',value:entity.isin},{label:'Ticker',value:entity.ticker},{label:'Country',value:entity.country}]},
            {group:'ESG Ratings',fields:[{label:'ESG Score',value:entity.esgScore+'/100',color:scoreColor(entity.esgScore)},{label:'Climate Score',value:entity.climateScore+'/100',color:scoreColor(entity.climateScore)},{label:'Social Score',value:entity.socialScore+'/100',color:scoreColor(entity.socialScore)},{label:'Governance Score',value:entity.govScore+'/100',color:scoreColor(entity.govScore)}]},
            {group:'Climate Profile',fields:[{label:'Temperature',value:entity.temperature+'°C',color:tempColor(entity.temperature)},{label:'SBTi',value:entity.sbtiStatus},{label:'Net Zero Target',value:entity.netZeroYear?String(entity.netZeroYear):'None'},{label:'TCFD Aligned',value:entity.tcfdAligned?'Yes':'No',color:entity.tcfdAligned?T.green:T.amber}]},
            {group:'Regulatory',fields:[{label:'CSRD Scope',value:entity.csrdScope?'In Scope':'Out of Scope',color:entity.csrdScope?T.amber:T.green},{label:'Credit Rating',value:entity.rating},{label:'Controversies',value:entity.controversies,color:entity.controversies>4?T.red:T.amber},{label:'Red Flags',value:entity.redFlags,color:entity.redFlags>1?T.red:T.green}]},
          ].map((grp,gi)=>(
            <div key={gi} style={{background:T.surfaceH,borderRadius:10,padding:16,border:`1px solid ${T.borderL}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:10}}>{grp.group}</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {grp.fields.map((f,fi)=>(
                  <div key={fi} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:11,color:T.textSec}}>{f.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:f.color||T.navy,fontFamily:T.mono}}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: RISK INTELLIGENCE ===== */
function RiskIntelligence({entity}){
  const riskDimensions=[
    {subject:'Physical Climate',A:Math.floor(sr(entity.id*31+7)*60+20)},
    {subject:'Transition Risk',A:Math.floor(sr(entity.id*37+11)*60+20)},
    {subject:'ESG Controversy',A:Math.floor(sr(entity.id*41+5)*60+20)},
    {subject:'Regulatory',A:Math.floor(sr(entity.id*43+9)*60+20)},
    {subject:'Supply Chain',A:Math.floor(sr(entity.id*47+3)*60+20)},
    {subject:'Governance',A:Math.floor(sr(entity.id*53+7)*60+20)},
  ];

  const riskBreakdown=[
    {risk:'Physical Climate Hazards',score:Math.floor(sr(entity.id*61+5)*70+20),category:'Climate',detail:`Flood: ${Math.floor(sr(entity.id*67+3)*50+20)}% · Drought: ${Math.floor(sr(entity.id*71+7)*40+10)}% · Heat: ${Math.floor(sr(entity.id*73+11)*60+15)}%`},
    {risk:'Carbon Transition Exposure',score:Math.floor(sr(entity.id*79+5)*70+20),category:'Climate',detail:`Stranded asset risk · Carbon price sensitivity · Policy exposure`},
    {risk:'ESG Score Downgrade Risk',score:Math.floor(sr(entity.id*83+9)*60+20),category:'ESG',detail:`12m momentum: ${sr(entity.id*89+3)>0.5?'+':'-'}${Math.floor(sr(entity.id*89+3)*8+1)}pts · Peer divergence: ${Math.floor(sr(entity.id*97+5)*15+2)}%`},
    {risk:'Regulatory Non-Compliance',score:Math.floor(sr(entity.id*101+3)*70+20),category:'Regulatory',detail:`CSRD gap: ${Math.floor(sr(entity.id*103+7)*30+5)}% · SFDR PAI missing: ${Math.floor(sr(entity.id*107+11)*5+1)}`},
    {risk:'Supply Chain Disruption',score:Math.floor(sr(entity.id*109+5)*60+20),category:'Supply Chain',detail:`High-risk suppliers: ${Math.floor(sr(entity.id*113+3)*15+2)} · EUDR exposure: ${sr(entity.id*117+7)>0.5?'Yes':'No'}`},
    {risk:'Greenwashing / Disclosure Risk',score:Math.floor(sr(entity.id*119+9)*60+20),category:'ESG',detail:`Disclosure quality: ${['Low','Medium','High'][Math.floor(sr(entity.id*121+5)*3)]} · Assurance: ${sr(entity.id*123+11)>0.4?'Assured':'Unassured'}`},
    {risk:'Litigation / Liability Risk',score:Math.floor(sr(entity.id*127+3)*70+25),category:'Governance',detail:`Active cases: ${Math.floor(sr(entity.id*131+7)*5)} · Climate litigation: ${sr(entity.id*133+9)>0.5?'Exposed':'Low exposure'}`},
  ];

  const catColor=(c)=>c==='Climate'?T.teal:c==='ESG'?T.navy:c==='Regulatory'?T.purple:c==='Supply Chain'?T.amber:T.textSec;
  const overallRisk=Math.round(riskBreakdown.reduce((a,r)=>a+r.score,0)/riskBreakdown.length);

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Multi-Dimensional Risk Radar</div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>100 = highest risk</div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={riskDimensions}>
              <PolarGrid stroke={T.borderL}/>
              <PolarAngleAxis dataKey="subject" style={{fontSize:10}}/>
              <PolarRadiusAxis domain={[0,100]} style={{fontSize:9}}/>
              <Radar dataKey="A" stroke={T.red} fill={T.red} fillOpacity={0.2}/>
            </RadarChart>
          </ResponsiveContainer>
          <div style={{textAlign:'center',marginTop:8}}>
            <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>OVERALL RISK SCORE</div>
            <div style={{fontSize:28,fontWeight:700,color:scoreColor(100-overallRisk),fontFamily:T.mono}}>{overallRisk}/100</div>
          </div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Risk Dimension Breakdown</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {riskBreakdown.map((r,i)=>(
              <div key={i} style={{padding:'12px 16px',background:T.surfaceH,borderRadius:10,border:`1px solid ${T.borderL}`}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                  <span style={pill(catColor(r.category),r.category,true)}>{r.category}</span>
                  <span style={{fontSize:13,fontWeight:600,color:T.navy,flex:1}}>{r.risk}</span>
                  <span style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:scoreColor(100-r.score)}}>{r.score}</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{flex:1,height:5,background:T.borderL,borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:r.score+'%',height:'100%',background:r.score>70?T.red:r.score>40?T.amber:T.green,borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:11,color:T.textSec,flex:2}}>{r.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Peer Risk Comparison — {entity.sector}</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={ENTITIES.filter(e=>e.sector===entity.sector).slice(0,8).map(e=>({name:e.ticker,esg:e.esgScore,temp:+(e.temperature*20).toFixed(0),ctrs:e.controversies*10}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="name" style={{fontSize:11}}/>
            <YAxis style={{fontSize:11}}/>
            <Tooltip/>
            <Legend/>
            <Bar dataKey="esg" name="ESG Score" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar dataKey="temp" name="Temp Score (×20)" fill={T.red} radius={[4,4,0,0]}/>
            <Bar dataKey="ctrs" name="Controversies (×10)" fill={T.amber} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ===== TAB 3: REGULATORY EXPOSURE ===== */
function RegulatoryExposure({entity}){
  const frameworks=[
    {fw:'CSRD / ESRS',applies:entity.csrdScope,deadline:'Jan 2025 (large) / Jan 2026 (listed SME)',gap:Math.floor(sr(entity.id*31+7)*50+5),articles:'ESRS 2 · E1-E5 · S1-S4 · G1'},
    {fw:'SFDR',applies:sr(entity.id*37+11)>0.4,deadline:'Already applied (Mar 2021)',gap:Math.floor(sr(entity.id*41+5)*40+2),articles:'Art 6/8/9 · PAI 18 indicators · RTS'},
    {fw:'CSDDD',applies:entity.employees>1000&&entity.revenue>0.45,deadline:'Jul 2027–2029 (phased)',gap:Math.floor(sr(entity.id*43+9)*60+10),articles:'Art 6-11 · Art 22 · Art 25-26 · Art 29'},
    {fw:'EUDR',applies:['Materials','Consumer Goods','Automotive'].includes(entity.sector),deadline:'Dec 2025 (large) / Jun 2026 (SME)',gap:Math.floor(sr(entity.id*47+3)*70+5),articles:'Art 4-12 · Art 29 · Annex I'},
    {fw:'EU Taxonomy',applies:entity.csrdScope,deadline:'FY2024 disclosures (2025)',gap:Math.floor(sr(entity.id*53+7)*50+10),articles:'Art 3/9 criteria · DNSH · MSS · Aligned revenue'},
    {fw:'ISSB / IFRS S1-S2',applies:sr(entity.id*59+11)>0.35,deadline:'Jurisdiction dependent (2025+)',gap:Math.floor(sr(entity.id*61+5)*40+5),articles:'IFRS S1 (general) · IFRS S2 (climate)'},
    {fw:'SEC Climate Rule',applies:entity.region==='North America',deadline:'FY2025 (large accelerated filers)',gap:Math.floor(sr(entity.id*67+9)*60+10),articles:'Reg S-K Item 1500 · Reg S-X Art 14'},
    {fw:'UK SDR',applies:entity.region==='Europe'&&entity.country==='UK',deadline:'Jul 2024 (labels) / 2025 (disclosures)',gap:Math.floor(sr(entity.id*71+3)*50+5),articles:'FCA PS23/16 · 4 product labels · Anti-greenwash'},
  ];

  const inScope=frameworks.filter(f=>f.applies);
  const avgGap=inScope.length?Math.round(inScope.reduce((a,f)=>a+f.gap,0)/inScope.length):0;

  const exposureTimeline=frameworks.filter(f=>f.applies).map((f,i)=>({name:f.fw,gap:f.gap}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Frameworks In Scope',value:inScope.length,sub:`of ${frameworks.length} assessed`},
          {label:'Avg Compliance Gap',value:avgGap+'%',sub:'Across in-scope frameworks',color:avgGap>50?T.red:avgGap>25?T.amber:T.green},
          {label:'Nearest Deadline',value:inScope.length?inScope.sort((a,b)=>a.deadline.localeCompare(b.deadline))[0]?.deadline.split('(')[0].trim():'N/A',sub:'First compliance requirement'},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {exposureTimeline.length>0&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Compliance Gap by Framework (In-Scope Only)</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={exposureTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" style={{fontSize:10}} angle={-15} textAnchor="end" height={40}/>
              <YAxis domain={[0,100]} tickFormatter={v=>v+'%'} style={{fontSize:10}}/>
              <Tooltip formatter={v=>v+'%'}/>
              <Bar dataKey="gap" name="Gap %" radius={[4,4,0,0]}>
                {exposureTimeline.map((e,i)=><Cell key={i} fill={scoreColor(100-e.gap)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Regulatory Framework Assessment</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Framework','Status','Deadline','Compliance Gap','Key Articles','Action'].map(h=>(
                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {frameworks.map((f,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`,opacity:f.applies?1:0.5}}>
                <td style={{padding:'10px 12px',fontWeight:700,color:T.navy}}>{f.fw}</td>
                <td style={{padding:'10px 12px'}}>{f.applies?<span style={pill(T.red,'In Scope',true)}>In Scope</span>:<span style={pill(T.textMut,'Out of Scope',true)}>Out of Scope</span>}</td>
                <td style={{padding:'10px 12px',fontSize:11,color:T.textSec,fontFamily:T.mono}}>{f.deadline}</td>
                <td style={{padding:'10px 12px'}}>
                  {f.applies?(
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{width:80,height:5,background:T.borderL,borderRadius:3,overflow:'hidden'}}>
                        <div style={{width:f.gap+'%',height:'100%',background:scoreColor(100-f.gap),borderRadius:3}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:11,color:scoreColor(100-f.gap),fontWeight:700}}>{f.gap}%</span>
                    </div>
                  ):(<span style={{fontSize:11,color:T.textMut}}>N/A</span>)}
                </td>
                <td style={{padding:'10px 12px',fontSize:11,color:T.textSec}}>{f.articles}</td>
                <td style={{padding:'10px 12px'}}>{f.applies&&f.gap>30?<span style={pill(T.red,'Action Required',true)}>Action Required</span>:f.applies?<span style={pill(T.amber,'Monitor',true)}>Monitor</span>:<span style={pill(T.green,'N/A',true)}>N/A</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== TAB 4: ACTION TRACKER ===== */
function ActionTracker({entity}){
  const [statusFilter,setStatusFilter]=useState('All');

  const actions=useMemo(()=>[
    {id:1,title:`Complete CSRD ESRS E1 Climate Disclosure`,module:'CSRD / ESRS Automation',priority:'P0',status:sr(entity.id*31+7)>0.5?'Complete':'Open',dueDate:'2025-06-30',framework:'CSRD',type:'Disclosure'},
    {id:2,title:`Submit SBTi Near-Term Target`,module:'Corporate Decarbonisation',priority:'P0',status:sr(entity.id*37+11)>0.4?'Complete':'In Progress',dueDate:'2025-09-30',framework:'SBTi',type:'Climate'},
    {id:3,title:`Map Scope 3 Category 1-5 Suppliers`,module:'Supply Chain ESG',priority:'P1',status:sr(entity.id*41+5)>0.55?'Complete':'Open',dueDate:'2025-12-31',framework:'CSRD ESRS E1',type:'Emissions'},
    {id:4,title:`Publish Art 22 CSDDD Climate Transition Plan`,module:'CSDDD Engine',priority:'P1',status:sr(entity.id*43+9)>0.35?'In Progress':'Open',dueDate:'2027-07-26',framework:'CSDDD',type:'Compliance'},
    {id:5,title:`Implement EUDR Due Diligence Statements`,module:'EUDR Engine',priority:'P1',status:sr(entity.id*47+3)>0.45?'Complete':'Open',dueDate:'2025-12-30',framework:'EUDR',type:'Compliance'},
    {id:6,title:`Run Double Materiality Assessment`,module:'ESG Ratings',priority:'P1',status:sr(entity.id*53+7)>0.5?'In Progress':'Open',dueDate:'2025-06-30',framework:'CSRD ESRS 1',type:'ESG'},
    {id:7,title:`Align EU Taxonomy Revenue to CapEx`,module:'EU Taxonomy',priority:'P2',status:sr(entity.id*59+11)>0.4?'Complete':'Open',dueDate:'2025-03-31',framework:'EU Taxonomy',type:'Taxonomy'},
    {id:8,title:`Disclose SFDR PAI Indicators (18 mandatory)`,module:'SFDR v2 Reporting',priority:'P2',status:sr(entity.id*61+5)>0.6?'Complete':'In Progress',dueDate:'2025-06-30',framework:'SFDR',type:'Disclosure'},
    {id:9,title:`Establish Board-Level ESG Oversight`,module:'Corporate Governance',priority:'P2',status:sr(entity.id*67+9)>0.5?'Complete':'Open',dueDate:'2025-12-31',framework:'CSDDD Art 25',type:'Governance'},
    {id:10,title:`Issue Third-Party Verified ESG Report`,module:'Disclosure Hub',priority:'P2',status:sr(entity.id*71+3)>0.45?'Complete':'Open',dueDate:'2025-09-30',framework:'ISSB / GRI',type:'Disclosure'},
    {id:11,title:`Address Top 3 Physical Climate Hazards`,module:'Physical Risk',priority:'P1',status:sr(entity.id*73+7)>0.55?'In Progress':'Open',dueDate:'2025-12-31',framework:'TCFD',type:'Climate'},
    {id:12,title:`Set Interim 2030 Emission Reduction Target`,module:'Transition Planning',priority:'P0',status:entity.sbtiStatus==='Target Set'?'Complete':entity.sbtiStatus==='Committed'?'In Progress':'Open',dueDate:'2025-06-30',framework:'SBTi / GFANZ',type:'Climate'},
  ],[entity]);

  const filtered=statusFilter==='All'?actions:actions.filter(a=>a.status===statusFilter);
  const counts={Open:actions.filter(a=>a.status==='Open').length,'In Progress':actions.filter(a=>a.status==='In Progress').length,Complete:actions.filter(a=>a.status==='Complete').length};
  const completionRate=Math.round(counts.Complete/actions.length*100);

  const statusColor=(s)=>s==='Complete'?T.green:s==='In Progress'?T.amber:T.red;
  const prioColor=(p)=>p==='P0'?T.red:p==='P1'?T.amber:T.textSec;

  const byType=Object.entries(actions.reduce((acc,a)=>{acc[a.type]=(acc[a.type]||0)+1;return acc},{})).map(([k,v])=>({type:k,count:v}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Open Actions',value:counts.Open,color:T.red},
          {label:'In Progress',value:counts['In Progress'],color:T.amber},
          {label:'Completed',value:counts.Complete,color:T.green},
          {label:'Completion Rate',value:completionRate+'%',color:scoreColor(completionRate)},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:kpi.color,fontFamily:T.mono}}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginRight:8}}>Action Register</div>
            {['All','Open','In Progress','Complete'].map(s=>(
              <button key={s} onClick={()=>setStatusFilter(s)} style={{padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:statusFilter===s?700:500,background:statusFilter===s?T.navy:'transparent',color:statusFilter===s?'#fff':T.textSec}}>
                {s}{s!=='All'?` (${counts[s]||0})`:''}
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map(a=>(
              <div key={a.id} style={{padding:'12px 16px',background:T.surfaceH,borderRadius:10,border:`1px solid ${T.borderL}`,display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:prioColor(a.priority),background:prioColor(a.priority)+'15',padding:'2px 6px',borderRadius:4,flexShrink:0,marginTop:2}}>{a.priority}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:3}}>{a.title}</div>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,color:T.textMut}}>{a.module}</span>
                    <span style={{fontSize:11,color:T.textMut}}>·</span>
                    <span style={pill(T.purple,a.framework,true)}>{a.framework}</span>
                    <span style={pill(T.navy,a.type,true)}>{a.type}</span>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={pill(statusColor(a.status),a.status,true)}>{a.status}</div>
                  <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginTop:4}}>Due: {a.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Actions by Type</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byType} layout="vertical" margin={{left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" style={{fontSize:10}}/>
                <YAxis type="category" dataKey="type" width={80} style={{fontSize:10}}/>
                <Tooltip/>
                <Bar dataKey="count" fill={T.navy} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Priority Summary</div>
            {['P0','P1','P2'].map(p=>{
              const pActions=actions.filter(a=>a.priority===p);
              const pOpen=pActions.filter(a=>a.status==='Open').length;
              return(
                <div key={p} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:T.surfaceH,borderRadius:8,marginBottom:8,border:`1px solid ${T.borderL}`}}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:prioColor(p)}}>{p}</span>
                    <span style={{fontSize:12,color:T.textSec}}>{pActions.length} actions</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:pOpen>0?prioColor(p):T.green,fontFamily:T.mono}}>{pOpen} open</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
