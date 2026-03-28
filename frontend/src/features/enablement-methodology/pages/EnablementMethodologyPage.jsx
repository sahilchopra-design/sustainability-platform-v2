import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11};

const TABS=['Enablement Scorer','Portfolio Enablement','Additionality Assessment','Reporting & Disclosure'];

const TYPES=['Green Bond','Sustainability-Linked Loan','Climate Fund','Project Finance','Green Loan','Transition Bond','Social Bond','Blue Bond'];
const CATEGORIES=['Renewable Energy','Energy Efficiency','Clean Transport','Sustainable Agriculture','Waste Management','Water','Circular Economy','Nature-Based Solutions'];
const SECTORS=['Power Generation','Commercial Real Estate','Transportation','Agriculture','Manufacturing','Mining','Oil & Gas','Chemicals','Forestry','Water Utilities','Waste Services','Technology','Financial Services','Healthcare','Telecommunications'];
const ISSUERS=['GreenVest Capital','EcoFin Partners','Nordic Green Bank','Triodos Investments','Climate Bridge Finance','BlueSky Capital','Sustain Corp','TransitionCo','EarthFirst Fund','ClimateTech Ventures','Green Infrastructure Ltd','Renewable Holdings','Pacific Green Capital','Atlantic Sustain','Alpine Climate Fund'];

const PRODUCTS=Array.from({length:100},(_,i)=>{
  const s1=sr(i*3),s2=sr(i*7),s3=sr(i*11),s4=sr(i*13),s5=sr(i*17),s6=sr(i*19),s7=sr(i*23),s8=sr(i*29);
  const type=TYPES[Math.floor(s1*TYPES.length)];
  const cat=CATEGORIES[Math.floor(s2*CATEGORIES.length)];
  const sector=SECTORS[Math.floor(s3*SECTORS.length)];
  const issuer=ISSUERS[Math.floor(s4*ISSUERS.length)];
  const volume=Math.round(50+s5*950);
  const enabledReduction=Math.round(1000+s6*49000);
  const financedEmissions=Math.round(500+s7*25000);
  const ratio=parseFloat((enabledReduction/Math.max(financedEmissions,1)).toFixed(2));
  const additionality=Math.round(20+s8*80);
  const vintage=2020+Math.floor(sr(i*31)*6);
  const maturity=vintage+Math.floor(3+sr(i*37)*12);
  const coupon=parseFloat((1.5+sr(i*41)*4.5).toFixed(2));
  return {id:i+1,name:`${cat.split(' ')[0]} ${type} ${String(i+1).padStart(3,'0')}`,type,category:cat,sector,issuer,volume,enabledReduction,financedEmissions,ratio,additionality,vintage,maturity,coupon,
    baselineEmissions:Math.round(financedEmissions*1.4+sr(i*43)*5000),
    attributionFactor:parseFloat((0.3+sr(i*47)*0.6).toFixed(2)),
    peerRank:Math.round(1+sr(i*53)*99),
    projectCount:Math.round(1+sr(i*59)*8),
    currency:['USD','EUR','GBP','CHF','JPY'][Math.floor(sr(i*61)*5)],
    rating:['AAA','AA+','AA','A+','A','BBB+','BBB'][Math.floor(sr(i*67)*7)],
  };
});

const PROJECTS=Array.from({length:60},(_,i)=>{
  const s1=sr(i*5+200),s2=sr(i*7+200),s3=sr(i*11+200),s4=sr(i*13+200);
  const cat=CATEGORIES[Math.floor(s1*CATEGORIES.length)];
  const sector=SECTORS[Math.floor(s2*SECTORS.length)];
  return {id:i+1,name:`${cat.split(' ')[0]} Project ${String(i+1).padStart(2,'0')}`,category:cat,sector,
    country:['US','UK','DE','FR','BR','IN','CN','AU','JP','ZA','KE','CL'][Math.floor(sr(i*17+200)*12)],
    capacity:Math.round(10+sr(i*19+200)*490)+'MW',
    financialAdditionality:Math.round(15+s3*85),
    regulatoryAdditionality:Math.round(10+s4*90),
    technologyAdditionality:Math.round(5+sr(i*23+200)*95),
    marketTransformation:Math.round(10+sr(i*29+200)*90),
    totalAdditionality:0,
    enabledReduction:Math.round(2000+sr(i*31+200)*48000),
    withFI:parseFloat((sr(i*37+200)*60+40).toFixed(1)),
    withoutFI:parseFloat((sr(i*41+200)*30).toFixed(1)),
    status:['Operational','Under Construction','Committed','Pipeline'][Math.floor(sr(i*43+200)*4)],
    riskFlags:sr(i*47+200)>0.7?['Low additionality evidence']:sr(i*47+200)>0.5?['Regulatory baseline unclear']:[],
  };
});
PROJECTS.forEach(p=>{p.totalAdditionality=Math.round((p.financialAdditionality+p.regulatoryAdditionality+p.technologyAdditionality+p.marketTransformation)/4);});

const Q_LABELS=['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];
const PORTFOLIO_TREND=Q_LABELS.map((q,i)=>({quarter:q,
  financedEmissions:Math.round(120000-i*2500+sr(i*3+500)*8000),
  enabledAvoided:Math.round(45000+i*4500+sr(i*7+500)*6000),
  ratio:parseFloat((0.35+i*0.04+sr(i*11+500)*0.08).toFixed(2)),
}));

const SECTOR_STACK=Q_LABELS.map((q,i)=>({quarter:q,
  'Renewable Energy':Math.round(18000+i*1800+sr(i*3+600)*3000),
  'Energy Efficiency':Math.round(8000+i*900+sr(i*7+600)*2000),
  'Clean Transport':Math.round(6000+i*700+sr(i*11+600)*1500),
  'Sustainable Agriculture':Math.round(3000+i*400+sr(i*13+600)*1000),
  'Waste Management':Math.round(2000+i*300+sr(i*17+600)*800),
  'Water':Math.round(2500+i*250+sr(i*19+600)*700),
  'Circular Economy':Math.round(1800+i*200+sr(i*23+600)*600),
  'Nature-Based Solutions':Math.round(3500+i*350+sr(i*29+600)*900),
}));

const CAT_COLORS=['#1b3a5c','#2c5a8c','#5a8a6a','#7ba67d','#c5a96a','#d4be8a','#d97706','#dc2626'];

const REGULATIONS=[
  {body:'PCAF',standard:'Part C - Facilitated Emissions',status:'Final',date:'2023-12',coverage:'Global',alignment:'Aligned',notes:'Full attribution methodology implemented'},
  {body:'GFANZ',standard:'Portfolio Alignment Methodology',status:'Final',date:'2024-06',coverage:'Global',alignment:'Partial',notes:'Net-zero alignment pending Scope 3'},
  {body:'SEC',standard:'Climate Disclosure Rule (S7-10-22)',status:'Adopted',date:'2024-03',coverage:'US',alignment:'Aligned',notes:'Avoided emissions optional disclosure'},
  {body:'ESMA',standard:'SFDR RTS on Avoided Emissions',status:'Draft',date:'2025-01',coverage:'EU',alignment:'Monitoring',notes:'Awaiting final technical standards'},
  {body:'FCA',standard:'SDR Anti-Greenwashing Rule',status:'Final',date:'2024-11',coverage:'UK',alignment:'Aligned',notes:'Claims substantiation framework'},
  {body:'ISSB',standard:'IFRS S2 - Climate Disclosures',status:'Final',date:'2024-01',coverage:'Global',alignment:'Aligned',notes:'Transition plan disclosures'},
  {body:'TCFD',standard:'Metrics & Targets Guidance',status:'Final',date:'2022-10',coverage:'Global',alignment:'Aligned',notes:'Portfolio-level metrics'},
  {body:'EU Taxonomy',standard:'Climate Mitigation Criteria',status:'Final',date:'2023-06',coverage:'EU',alignment:'Aligned',notes:'Substantial contribution thresholds'},
];

const REPORT_SECTIONS=['Executive Summary','Portfolio Enablement Overview','Product-Level Analysis','Additionality Assessment','PCAF Facilitated Emissions','GFANZ Alignment','Double-Counting Prevention','Sector Breakdown','Methodology Notes','Appendices'];

const fmt=n=>{if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(0)+'K';return String(n);};
const fmtPct=n=>n>=0?`+${n.toFixed(1)}%`:`${n.toFixed(1)}%`;

const Badge=({children,color=T.navy,bg:b})=>(
  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,color,background:b||T.surfaceH,fontFamily:T.font}}>{children}</span>
);

const Card=({children,style})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,...style}}>{children}</div>
);

const KPI=({label,value,sub,color})=>(
  <Card style={{textAlign:'center',flex:1,minWidth:160}}>
    <div style={{fontSize:11,color:T.textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.font}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:4}}>{sub}</div>}
  </Card>
);

/* ─── TAB 1: Enablement Scorer ─── */
function EnablementScorer(){
  const [filterType,setFilterType]=useState('All');
  const [filterCat,setFilterCat]=useState('All');
  const [ratioThreshold,setRatioThreshold]=useState(0);
  const [selected,setSelected]=useState(null);
  const [showWizard,setShowWizard]=useState(false);
  const [sortCol,setSortCol]=useState('ratio');
  const [sortDir,setSortDir]=useState('desc');
  const [wizardStep,setWizardStep]=useState(0);
  const [wizardData,setWizardData]=useState({name:'',type:TYPES[0],category:CATEGORIES[0],volume:'',enabledReduction:'',financedEmissions:''});

  const filtered=useMemo(()=>{
    let f=PRODUCTS;
    if(filterType!=='All')f=f.filter(p=>p.type===filterType);
    if(filterCat!=='All')f=f.filter(p=>p.category===filterCat);
    if(ratioThreshold>0)f=f.filter(p=>p.ratio>=ratioThreshold);
    f=[...f].sort((a,b)=>sortDir==='desc'?b[sortCol]-a[sortCol]:a[sortCol]-b[sortCol]);
    return f;
  },[filterType,filterCat,ratioThreshold,sortCol,sortDir]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortCol(col);setSortDir('desc');}};
  const SH=({col,label})=>(<th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,cursor:'pointer',borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none'}} onClick={()=>handleSort(col)}>{label}{sortCol===col?(sortDir==='desc'?' ▼':' ▲'):''}</th>);

  const ratioColor=r=>r>=2.0?T.green:r>=1.0?T.sage:r>=0.5?T.amber:T.red;
  const addColor=a=>a>=70?T.green:a>=40?T.amber:T.red;

  const peerData=selected?PRODUCTS.filter(p=>p.category===selected.category).sort((a,b)=>b.ratio-a.ratio).slice(0,10).map(p=>({name:p.name.slice(0,18),ratio:p.ratio,isCurrent:p.id===selected.id})):[];
  const compBar=selected?[{name:'Enabled Reduction',value:selected.enabledReduction},{name:'Financed Emissions',value:selected.financedEmissions},{name:'Baseline',value:selected.baselineEmissions}]:[];

  return (
    <div>
      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div>
          <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Type</label>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
            <option>All</option>{TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Category</label>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
            <option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Min Ratio</label>
          <input type="range" min={0} max={5} step={0.1} value={ratioThreshold} onChange={e=>setRatioThreshold(parseFloat(e.target.value))} style={{width:120}} />
          <span style={{fontSize:11,color:T.textSec,marginLeft:6}}>{ratioThreshold.toFixed(1)}x</span>
        </div>
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>{setShowWizard(true);setWizardStep(0);}} style={{padding:'8px 16px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>+ Score New Product</button>
        </div>
      </div>

      <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>{filtered.length} products matching filters</div>

      <div style={{display:'flex',gap:16}}>
        {/* Table */}
        <div style={{flex:selected?'0 0 58%':'1',overflowX:'auto'}}>
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:520,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>
                    <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`}}>#</th>
                    <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`,minWidth:140}}>Product</th>
                    <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`}}>Type</th>
                    <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`}}>Issuer</th>
                    <SH col="volume" label="Vol ($M)" />
                    <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`}}>Sector</th>
                    <th style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`}}>Category</th>
                    <SH col="enabledReduction" label="Enabled (tCO2e)" />
                    <SH col="ratio" label="Ratio" />
                    <SH col="additionality" label="Additionality" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0,50).map((p,idx)=>(
                    <tr key={p.id} onClick={()=>setSelected(p)} style={{cursor:'pointer',background:selected?.id===p.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background=selected?.id===p.id?T.surfaceH:'transparent'}>
                      <td style={{padding:'7px 10px',color:T.textMut,fontSize:11}}>{idx+1}</td>
                      <td style={{padding:'7px 10px',fontWeight:600,color:T.navy}}>{p.name}</td>
                      <td style={{padding:'7px 10px'}}><Badge bg={T.surfaceH}>{p.type}</Badge></td>
                      <td style={{padding:'7px 10px',color:T.textSec,fontSize:11}}>{p.issuer}</td>
                      <td style={{padding:'7px 10px',fontFamily:T.mono,fontSize:11}}>{p.volume}</td>
                      <td style={{padding:'7px 10px',fontSize:11}}>{p.sector}</td>
                      <td style={{padding:'7px 10px'}}><Badge color={T.teal} bg='#f0fdf4'>{p.category}</Badge></td>
                      <td style={{padding:'7px 10px',fontFamily:T.mono,fontSize:11}}>{fmt(p.enabledReduction)}</td>
                      <td style={{padding:'7px 10px'}}><span style={{fontWeight:700,color:ratioColor(p.ratio),fontFamily:T.mono}}>{p.ratio}x</span></td>
                      <td style={{padding:'7px 10px'}}><span style={{fontWeight:600,color:addColor(p.additionality),fontFamily:T.mono}}>{p.additionality}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        {selected&&(
          <div style={{flex:'0 0 40%',minWidth:340}}>
            <Card>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{selected.name}</div>
                  <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{selected.issuer} | {selected.type}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:T.textMut}}>x</button>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                <div style={{padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.textMut}}>Volume</div>
                  <div style={{fontSize:15,fontWeight:700,color:T.navy}}>${selected.volume}M</div>
                </div>
                <div style={{padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.textMut}}>Enablement Ratio</div>
                  <div style={{fontSize:15,fontWeight:700,color:ratioColor(selected.ratio)}}>{selected.ratio}x</div>
                </div>
                <div style={{padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.textMut}}>Additionality</div>
                  <div style={{fontSize:15,fontWeight:700,color:addColor(selected.additionality)}}>{selected.additionality}/100</div>
                </div>
                <div style={{padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.textMut}}>Peer Rank</div>
                  <div style={{fontSize:15,fontWeight:700,color:T.navy}}>#{selected.peerRank}</div>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Project Details</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:11}}>
                  <div><span style={{color:T.textMut}}>Sector:</span> {selected.sector}</div>
                  <div><span style={{color:T.textMut}}>Category:</span> {selected.category}</div>
                  <div><span style={{color:T.textMut}}>Vintage:</span> {selected.vintage}</div>
                  <div><span style={{color:T.textMut}}>Maturity:</span> {selected.maturity}</div>
                  <div><span style={{color:T.textMut}}>Rating:</span> {selected.rating}</div>
                  <div><span style={{color:T.textMut}}>Currency:</span> {selected.currency}</div>
                  <div><span style={{color:T.textMut}}>Coupon:</span> {selected.coupon}%</div>
                  <div><span style={{color:T.textMut}}>Projects:</span> {selected.projectCount}</div>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:4}}>Attribution Methodology</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>
                  Baseline emissions: <strong style={{fontFamily:T.mono}}>{fmt(selected.baselineEmissions)} tCO2e</strong><br/>
                  Attribution factor: <strong style={{fontFamily:T.mono}}>{selected.attributionFactor}</strong> (pro-rata by financing share)<br/>
                  Enabled reduction: <strong style={{fontFamily:T.mono}}>{fmt(selected.enabledReduction)} tCO2e/yr</strong>
                </div>
              </div>

              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Enabled vs Financed Comparison</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={compBar} layout="vertical" margin={{left:10,right:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmt} />
                  <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={100} />
                  <Tooltip contentStyle={tip} formatter={v=>[fmt(v),'tCO2e']} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {compBar.map((_,j)=><Cell key={j} fill={[T.green,T.red,T.amber][j]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8,marginTop:12}}>Peer Ranking ({selected.category})</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={peerData} margin={{left:0,right:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{fontSize:10,fill:T.textMut}} />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="ratio" radius={[4,4,0,0]}>
                    {peerData.map((d,j)=><Cell key={j} fill={d.isCurrent?T.gold:T.navyL} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowWizard(false)}>
          <div style={{background:T.surface,borderRadius:16,padding:28,width:480,maxHeight:'80vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>Score New Product</div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              {['Details','Emissions','Results'].map((s,i)=>(
                <div key={s} style={{flex:1,textAlign:'center',padding:'6px 0',borderRadius:6,fontSize:11,fontWeight:600,background:wizardStep===i?T.navy:'transparent',color:wizardStep===i?'#fff':T.textMut}}>{i+1}. {s}</div>
              ))}
            </div>
            {wizardStep===0&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div><label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Product Name</label><input value={wizardData.name} onChange={e=>setWizardData(d=>({...d,name:e.target.value}))} placeholder="e.g. Solar Green Bond 2025" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}} /></div>
                <div><label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Type</label><select value={wizardData.type} onChange={e=>setWizardData(d=>({...d,type:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Category</label><select value={wizardData.category} onChange={e=>setWizardData(d=>({...d,category:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Volume ($M)</label><input type="number" value={wizardData.volume} onChange={e=>setWizardData(d=>({...d,volume:e.target.value}))} placeholder="500" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}} /></div>
              </div>
            )}
            {wizardStep===1&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div><label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Enabled Emissions Reduction (tCO2e/yr)</label><input type="number" value={wizardData.enabledReduction} onChange={e=>setWizardData(d=>({...d,enabledReduction:e.target.value}))} placeholder="25000" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}} /></div>
                <div><label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Financed Emissions (tCO2e)</label><input type="number" value={wizardData.financedEmissions} onChange={e=>setWizardData(d=>({...d,financedEmissions:e.target.value}))} placeholder="10000" style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}} /></div>
                <div style={{padding:12,background:T.surfaceH,borderRadius:8,fontSize:11,color:T.textSec}}>
                  <strong>Methodology:</strong> Enablement ratio = Enabled avoided emissions / Financed emissions. A ratio &gt; 1.0x means the product enables more emission reductions than it finances. PCAF Part C attribution factors are applied based on instrument type and ownership share.
                </div>
              </div>
            )}
            {wizardStep===2&&(
              <div>
                {wizardData.enabledReduction&&wizardData.financedEmissions?(()=>{
                  const r=(parseFloat(wizardData.enabledReduction)/parseFloat(wizardData.financedEmissions)).toFixed(2);
                  return (
                    <div style={{textAlign:'center',padding:20}}>
                      <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Enablement Ratio</div>
                      <div style={{fontSize:42,fontWeight:700,color:ratioColor(parseFloat(r)),fontFamily:T.mono}}>{r}x</div>
                      <div style={{fontSize:12,color:T.textSec,marginTop:8}}>
                        {parseFloat(r)>=2.0?'Excellent enablement - strong climate solution':''}
                        {parseFloat(r)>=1.0&&parseFloat(r)<2.0?'Good enablement - net positive climate impact':''}
                        {parseFloat(r)>=0.5&&parseFloat(r)<1.0?'Moderate enablement - below breakeven':''}
                        {parseFloat(r)<0.5?'Low enablement - needs improvement':''}
                      </div>
                      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:11}}>
                        <div style={{padding:10,background:T.surfaceH,borderRadius:8}}><div style={{color:T.textMut}}>Enabled</div><div style={{fontWeight:700,color:T.green}}>{fmt(parseFloat(wizardData.enabledReduction))} tCO2e/yr</div></div>
                        <div style={{padding:10,background:T.surfaceH,borderRadius:8}}><div style={{color:T.textMut}}>Financed</div><div style={{fontWeight:700,color:T.red}}>{fmt(parseFloat(wizardData.financedEmissions))} tCO2e</div></div>
                      </div>
                    </div>
                  );
                })():<div style={{textAlign:'center',padding:20,color:T.textMut}}>Please fill in emissions data in Step 2.</div>}
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
              <button onClick={()=>wizardStep>0?setWizardStep(s=>s-1):setShowWizard(false)} style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.textSec,fontSize:12,cursor:'pointer',fontFamily:T.font}}>{wizardStep>0?'Back':'Cancel'}</button>
              {wizardStep<2?<button onClick={()=>setWizardStep(s=>s+1)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Next</button>
              :<button onClick={()=>setShowWizard(false)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:T.green,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Done</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TAB 2: Portfolio Enablement ─── */
function PortfolioEnablement(){
  const [allocationAdj,setAllocationAdj]=useState({re:30,ee:15,ct:12,sa:10,wm:8,wa:8,ce:7,nbs:10});
  const totalAlloc=Object.values(allocationAdj).reduce((a,b)=>a+b,0);

  const totalFinanced=PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].financedEmissions;
  const totalEnabled=PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].enabledAvoided;
  const netImpact=totalEnabled-totalFinanced;
  const currentRatio=PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].ratio;

  const adjRatio=useMemo(()=>{
    const catWeights={re:2.8,ee:2.1,ct:1.6,sa:1.2,wm:1.4,wa:1.3,ce:1.1,nbs:1.5};
    let weightedR=0;
    Object.entries(allocationAdj).forEach(([k,v])=>{weightedR+=v/100*(catWeights[k]||1);});
    return parseFloat(weightedR.toFixed(2));
  },[allocationAdj]);

  const topEnablers=PRODUCTS.sort((a,b)=>b.enabledReduction-a.enabledReduction).slice(0,8);
  const topEmitters=PRODUCTS.sort((a,b)=>b.financedEmissions-a.financedEmissions).slice(0,8);

  const pcafData=CATEGORIES.map((c,i)=>{
    const prods=PRODUCTS.filter(p=>p.category===c);
    const totalE=prods.reduce((a,p)=>a+p.enabledReduction,0);
    const totalF=prods.reduce((a,p)=>a+p.financedEmissions,0);
    return {category:c.length>14?c.slice(0,14)+'..':c,enabled:totalE,financed:totalF,ratio:totalF>0?parseFloat((totalE/totalF).toFixed(2)):0};
  });

  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Total Financed Emissions" value={fmt(totalFinanced)+' tCO2e'} sub="PCAF Scope 1+2" color={T.red} />
        <KPI label="Total Enabled Avoided" value={fmt(totalEnabled)+' tCO2e'} sub="Facilitated reduction" color={T.green} />
        <KPI label="Net Climate Impact" value={(netImpact>0?'+':'')+fmt(netImpact)+' tCO2e'} sub={netImpact>0?'Net positive':'Net negative'} color={netImpact>0?T.green:T.red} />
        <KPI label="Portfolio Enablement Ratio" value={currentRatio+'x'} sub="Avoided / Financed" color={currentRatio>=1?T.green:T.amber} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Enablement Ratio Trend (12Q)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={PORTFOLIO_TREND} margin={{left:0,right:10,top:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}} />
              <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,'auto']} />
              <Tooltip contentStyle={tip} />
              <Line type="monotone" dataKey="ratio" stroke={T.navy} strokeWidth={2.5} dot={{r:3,fill:T.navy}} name="Ratio" />
              {/*reference line at 1.0*/}
              <Line type="monotone" dataKey={()=>1} stroke={T.amber} strokeWidth={1} strokeDasharray="5 5" dot={false} name="Breakeven" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Contribution (Enabled tCO2e)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SECTOR_STACK} margin={{left:0,right:10,top:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}} />
              <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmt} />
              <Tooltip contentStyle={tip} formatter={v=>[fmt(v),'tCO2e']} />
              {CATEGORIES.map((c,i)=><Area key={c} type="monotone" dataKey={c} stackId="1" fill={CAT_COLORS[i]} stroke={CAT_COLORS[i]} fillOpacity={0.7} />)}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Top Enablers</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead><tr>{['Product','Enabled (tCO2e)','Ratio'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textMut,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{topEnablers.map(p=>(
              <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{p.name}</td>
                <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.green}}>{fmt(p.enabledReduction)}</td>
                <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600}}>{p.ratio}x</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Top Emitters</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead><tr>{['Product','Financed (tCO2e)','Ratio'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textMut,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{topEmitters.map(p=>(
              <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{p.name}</td>
                <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.red}}>{fmt(p.financedEmissions)}</td>
                <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600}}>{p.ratio}x</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>

      {/* PCAF Facilitated Emissions */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>PCAF Facilitated Emissions by Category</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pcafData} margin={{left:10,right:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="category" tick={{fontSize:9,fill:T.textMut}} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmt} />
            <Tooltip contentStyle={tip} formatter={v=>[fmt(v),'tCO2e']} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="enabled" name="Enabled Avoided" fill={T.green} radius={[4,4,0,0]} />
            <Bar dataKey="financed" name="Financed" fill={T.red} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* What-if Allocation */}
      <Card>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>What-If: Adjust Portfolio Allocation</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Adjust allocation percentages to see impact on enablement ratio. Total: {totalAlloc}%</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          {[['re','Renewable Energy'],['ee','Energy Efficiency'],['ct','Clean Transport'],['sa','Sust. Agriculture'],['wm','Waste Mgmt'],['wa','Water'],['ce','Circular Economy'],['nbs','Nature-Based']].map(([k,label])=>(
            <div key={k}>
              <div style={{fontSize:10,color:T.textMut,marginBottom:2}}>{label}</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <input type="range" min={0} max={50} value={allocationAdj[k]} onChange={e=>setAllocationAdj(d=>({...d,[k]:parseInt(e.target.value)}))} style={{flex:1}} />
                <span style={{fontSize:11,fontFamily:T.mono,color:T.navy,minWidth:28}}>{allocationAdj[k]}%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center',flex:1}}>
            <div style={{fontSize:10,color:T.textMut}}>Current Ratio</div>
            <div style={{fontSize:22,fontWeight:700,color:T.navy}}>{currentRatio}x</div>
          </div>
          <div style={{fontSize:20,color:T.textMut}}>→</div>
          <div style={{padding:12,background:adjRatio>currentRatio?'#f0fdf4':'#fef2f2',borderRadius:8,textAlign:'center',flex:1}}>
            <div style={{fontSize:10,color:T.textMut}}>Adjusted Ratio</div>
            <div style={{fontSize:22,fontWeight:700,color:adjRatio>currentRatio?T.green:T.red}}>{adjRatio}x</div>
          </div>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center',flex:1}}>
            <div style={{fontSize:10,color:T.textMut}}>Delta</div>
            <div style={{fontSize:22,fontWeight:700,color:adjRatio-currentRatio>=0?T.green:T.red}}>{(adjRatio-currentRatio>=0?'+':'')}{(adjRatio-currentRatio).toFixed(2)}x</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── TAB 3: Additionality Assessment ─── */
function AdditionalityAssessment(){
  const [selectedProj,setSelectedProj]=useState(null);
  const [filterCat,setFilterCat]=useState('All');
  const [sortBy,setSortBy]=useState('totalAdditionality');

  const filtered=useMemo(()=>{
    let f=PROJECTS;
    if(filterCat!=='All')f=f.filter(p=>p.category===filterCat);
    return [...f].sort((a,b)=>b[sortBy]-a[sortBy]);
  },[filterCat,sortBy]);

  const distData=[
    {range:'0-20',count:PROJECTS.filter(p=>p.totalAdditionality<=20).length},
    {range:'21-40',count:PROJECTS.filter(p=>p.totalAdditionality>20&&p.totalAdditionality<=40).length},
    {range:'41-60',count:PROJECTS.filter(p=>p.totalAdditionality>40&&p.totalAdditionality<=60).length},
    {range:'61-80',count:PROJECTS.filter(p=>p.totalAdditionality>60&&p.totalAdditionality<=80).length},
    {range:'81-100',count:PROJECTS.filter(p=>p.totalAdditionality>80).length},
  ];
  const distColors=[T.red,T.amber,'#d4be8a',T.sage,T.green];

  const withFIAvg=(PROJECTS.reduce((a,p)=>a+p.withFI,0)/PROJECTS.length).toFixed(1);
  const withoutFIAvg=(PROJECTS.reduce((a,p)=>a+p.withoutFI,0)/PROJECTS.length).toFixed(1);
  const flagCount=PROJECTS.filter(p=>p.riskFlags.length>0).length;

  const compData=[
    {label:'With FI Involvement',value:parseFloat(withFIAvg)},
    {label:'Without FI Involvement',value:parseFloat(withoutFIAvg)},
  ];

  const radarPoints=selectedProj?[
    {criterion:'Financial',score:selectedProj.financialAdditionality,angle:0},
    {criterion:'Regulatory',score:selectedProj.regulatoryAdditionality,angle:90},
    {criterion:'Technology',score:selectedProj.technologyAdditionality,angle:180},
    {criterion:'Market Trans.',score:selectedProj.marketTransformation,angle:270},
  ]:[];

  const renderRadar=(proj)=>{
    if(!proj)return null;
    const cx=100,cy=100,r=70;
    const criteria=[
      {label:'Financial',score:proj.financialAdditionality},
      {label:'Regulatory',score:proj.regulatoryAdditionality},
      {label:'Technology',score:proj.technologyAdditionality},
      {label:'Market',score:proj.marketTransformation},
    ];
    const points=criteria.map((c,i)=>{
      const angle=(i*90-90)*Math.PI/180;
      const dist=r*c.score/100;
      return {x:cx+dist*Math.cos(angle),y:cy+dist*Math.sin(angle),label:c.label,score:c.score};
    });
    const polygon=points.map(p=>`${p.x},${p.y}`).join(' ');
    return (
      <svg width={200} height={200} viewBox="0 0 200 200">
        {[20,40,60,80,100].map(pct=>{
          const pr=r*pct/100;
          return <polygon key={pct} points={[0,90,180,270].map(a=>{const ar=(a-90)*Math.PI/180;return `${cx+pr*Math.cos(ar)},${cy+pr*Math.sin(ar)}`;}).join(' ')} fill="none" stroke={T.border} strokeWidth={0.5} />;
        })}
        {[0,90,180,270].map(a=>{const ar=(a-90)*Math.PI/180;return <line key={a} x1={cx} y1={cy} x2={cx+r*Math.cos(ar)} y2={cy+r*Math.sin(ar)} stroke={T.border} strokeWidth={0.5} />;
        })}
        <polygon points={polygon} fill={T.sage} fillOpacity={0.25} stroke={T.sage} strokeWidth={2} />
        {points.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={T.sage} />
            <text x={cx+(r+18)*Math.cos((i*90-90)*Math.PI/180)} y={cy+(r+18)*Math.sin((i*90-90)*Math.PI/180)} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill={T.textSec} fontFamily={T.font}>{p.label}: {p.score}</text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Avg Additionality Score" value={(PROJECTS.reduce((a,p)=>a+p.totalAdditionality,0)/PROJECTS.length).toFixed(0)+'/100'} color={T.navy} />
        <KPI label="With FI Involvement" value={withFIAvg+'%'} sub="Avg project completion" color={T.green} />
        <KPI label="Without FI" value={withoutFIAvg+'%'} sub="Avg project completion" color={T.amber} />
        <KPI label="Red Flags" value={flagCount} sub="Low-additionality claims" color={T.red} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Additionality Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{fontSize:10,fill:T.textMut}} />
              <YAxis tick={{fontSize:10,fill:T.textMut}} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="count" name="Projects" radius={[4,4,0,0]}>
                {distData.map((_,i)=><Cell key={i} fill={distColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>FI Involvement Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={compData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textMut}} />
              <YAxis type="category" dataKey="label" tick={{fontSize:10,fill:T.textSec}} width={140} />
              <Tooltip contentStyle={tip} formatter={v=>[v+'%','Completion Rate']} />
              <Bar dataKey="value" radius={[0,4,4,0]}>
                <Cell fill={T.green} />
                <Cell fill={T.amber} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center'}}>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
          <option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text}}>
          <option value="totalAdditionality">Total Score</option>
          <option value="financialAdditionality">Financial</option>
          <option value="regulatoryAdditionality">Regulatory</option>
          <option value="technologyAdditionality">Technology</option>
          <option value="marketTransformation">Market Transformation</option>
        </select>
        <span style={{fontSize:12,color:T.textSec}}>{filtered.length} projects</span>
      </div>

      <div style={{display:'flex',gap:16}}>
        <div style={{flex:selectedProj?'0 0 60%':'1'}}>
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:420,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>
                    {['#','Project','Category','Country','Financial','Regulatory','Technology','Market','Total','Flags'].map(h=>(
                      <th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p,idx)=>{
                    const addColor2=s=>s>=70?T.green:s>=40?T.amber:T.red;
                    return (
                      <tr key={p.id} onClick={()=>setSelectedProj(p)} style={{cursor:'pointer',background:selectedProj?.id===p.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background=selectedProj?.id===p.id?T.surfaceH:'transparent'}>
                        <td style={{padding:'6px 8px',color:T.textMut}}>{idx+1}</td>
                        <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{p.name}</td>
                        <td style={{padding:'6px 8px'}}><Badge bg='#f0fdf4' color={T.teal}>{p.category.split(' ')[0]}</Badge></td>
                        <td style={{padding:'6px 8px',color:T.textSec}}>{p.country}</td>
                        <td style={{padding:'6px 8px',fontFamily:T.mono,color:addColor2(p.financialAdditionality)}}>{p.financialAdditionality}</td>
                        <td style={{padding:'6px 8px',fontFamily:T.mono,color:addColor2(p.regulatoryAdditionality)}}>{p.regulatoryAdditionality}</td>
                        <td style={{padding:'6px 8px',fontFamily:T.mono,color:addColor2(p.technologyAdditionality)}}>{p.technologyAdditionality}</td>
                        <td style={{padding:'6px 8px',fontFamily:T.mono,color:addColor2(p.marketTransformation)}}>{p.marketTransformation}</td>
                        <td style={{padding:'6px 8px',fontWeight:700,fontFamily:T.mono,color:addColor2(p.totalAdditionality)}}>{p.totalAdditionality}</td>
                        <td style={{padding:'6px 8px'}}>{p.riskFlags.length>0?<Badge color={T.red} bg='#fef2f2'>{p.riskFlags.length} flag</Badge>:<span style={{color:T.green}}>-</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {selectedProj&&(
          <div style={{flex:'0 0 38%',minWidth:300}}>
            <Card>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{selectedProj.name}</div>
                  <div style={{fontSize:11,color:T.textSec}}>{selectedProj.category} | {selectedProj.country} | {selectedProj.status}</div>
                </div>
                <button onClick={()=>setSelectedProj(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:T.textMut}}>x</button>
              </div>

              <div style={{textAlign:'center',marginBottom:12}}>
                {renderRadar(selectedProj)}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                <div style={{padding:10,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:10,color:T.textMut}}>Total Score</div>
                  <div style={{fontSize:20,fontWeight:700,color:selectedProj.totalAdditionality>=70?T.green:selectedProj.totalAdditionality>=40?T.amber:T.red}}>{selectedProj.totalAdditionality}/100</div>
                </div>
                <div style={{padding:10,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:10,color:T.textMut}}>Enabled Reduction</div>
                  <div style={{fontSize:20,fontWeight:700,color:T.green}}>{fmt(selectedProj.enabledReduction)}</div>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Criteria Breakdown</div>
                {[['Financial Additionality',selectedProj.financialAdditionality,'Would the project proceed without this financing?'],
                  ['Regulatory Additionality',selectedProj.regulatoryAdditionality,'Does the project go beyond regulatory requirements?'],
                  ['Technology Additionality',selectedProj.technologyAdditionality,'Does it deploy novel or underutilised technology?'],
                  ['Market Transformation',selectedProj.marketTransformation,'Does it contribute to systemic market change?']
                ].map(([label,score,desc])=>(
                  <div key={label} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                      <span style={{color:T.textSec}}>{label}</span>
                      <span style={{fontWeight:700,fontFamily:T.mono,color:score>=70?T.green:score>=40?T.amber:T.red}}>{score}/100</span>
                    </div>
                    <div style={{height:6,background:T.surfaceH,borderRadius:3}}>
                      <div style={{height:6,borderRadius:3,width:`${score}%`,background:score>=70?T.green:score>=40?T.amber:T.red,transition:'width 0.3s'}} />
                    </div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{desc}</div>
                  </div>
                ))}
              </div>

              {selectedProj.riskFlags.length>0&&(
                <div style={{padding:10,background:'#fef2f2',borderRadius:8,border:'1px solid #fecaca'}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.red,marginBottom:4}}>Red Flags</div>
                  {selectedProj.riskFlags.map((f,i)=><div key={i} style={{fontSize:11,color:T.red}}>- {f}</div>)}
                </div>
              )}

              <div style={{marginTop:12}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Project Completion</div>
                <div style={{display:'flex',gap:8}}>
                  <div style={{flex:1,padding:8,background:'#f0fdf4',borderRadius:6,textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.textMut}}>With FI</div>
                    <div style={{fontSize:14,fontWeight:700,color:T.green}}>{selectedProj.withFI}%</div>
                  </div>
                  <div style={{flex:1,padding:8,background:'#fffbeb',borderRadius:6,textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.textMut}}>Without FI</div>
                    <div style={{fontSize:14,fontWeight:700,color:T.amber}}>{selectedProj.withoutFI}%</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TAB 4: Reporting & Disclosure ─── */
function ReportingDisclosure(){
  const [selectedSections,setSelectedSections]=useState(REPORT_SECTIONS.map(()=>true));
  const [exportFormat,setExportFormat]=useState('PDF');

  const toggleSection=(i)=>{const n=[...selectedSections];n[i]=!n[i];setSelectedSections(n);};

  const dcfChecks=[
    {check:'Attribution factor applied per instrument',status:'Pass',detail:'Pro-rata financing share used consistently'},
    {check:'No double-counting across co-financiers',status:'Pass',detail:'Syndication shares reconciled across 15 co-lenders'},
    {check:'Scope 1/2/3 boundary separation',status:'Warning',detail:'3 products have overlapping Scope 3 claims'},
    {check:'Temporal alignment of baselines',status:'Pass',detail:'All baselines within 12-month vintage window'},
    {check:'Geographic attribution consistency',status:'Pass',detail:'Grid emission factors match project locations'},
    {check:'Avoided vs reduced distinction',status:'Fail',detail:'2 products conflate avoided and reduced emissions'},
  ];

  const totalProducts=PRODUCTS.length;
  const alignedCount=Math.round(totalProducts*0.72);
  const partialCount=Math.round(totalProducts*0.18);
  const gapCount=totalProducts-alignedCount-partialCount;

  const alignmentPie=[
    {name:'Fully Aligned',value:alignedCount,color:T.green},
    {name:'Partially Aligned',value:partialCount,color:T.amber},
    {name:'Gaps Identified',value:gapCount,color:T.red},
  ];

  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="PCAF Part C Aligned" value={alignedCount+'/'+totalProducts} sub="Facilitated emissions" color={T.green} />
        <KPI label="GFANZ Alignment" value="72%" sub="Portfolio alignment score" color={T.navy} />
        <KPI label="Double-Count Checks" value={dcfChecks.filter(c=>c.status==='Pass').length+'/'+dcfChecks.length} sub="Passed" color={dcfChecks.some(c=>c.status==='Fail')?T.amber:T.green} />
        <KPI label="Regulatory Frameworks" value={REGULATIONS.length} sub="Tracked" color={T.navy} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* PCAF & GFANZ */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>GFANZ Portfolio Alignment</div>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={alignmentPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {alignmentPie.map((d,i)=><Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              {alignmentPie.map(d=>(
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <div style={{width:10,height:10,borderRadius:3,background:d.color}} />
                  <span style={{fontSize:11,color:T.textSec}}>{d.name}: <strong style={{color:T.navy}}>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Double Counting Prevention */}
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Double-Counting Prevention</div>
          <div style={{maxHeight:220,overflowY:'auto'}}>
            {dcfChecks.map((c,i)=>(
              <div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:i<dcfChecks.length-1?`1px solid ${T.border}`:'none',alignItems:'flex-start'}}>
                <div style={{width:8,height:8,borderRadius:4,marginTop:3,background:c.status==='Pass'?T.green:c.status==='Warning'?T.amber:T.red,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{c.check}</div>
                  <div style={{fontSize:10,color:T.textMut}}>{c.detail}</div>
                </div>
                <Badge color={c.status==='Pass'?T.green:c.status==='Warning'?T.amber:T.red} bg={c.status==='Pass'?'#f0fdf4':c.status==='Warning'?'#fffbeb':'#fef2f2'}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regulatory Guidance Tracker */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Regulatory Guidance Tracker</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead>
              <tr>{['Body','Standard','Status','Date','Coverage','Alignment','Notes'].map(h=>(
                <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {REGULATIONS.map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'7px 10px',fontWeight:700,color:T.navy}}>{r.body}</td>
                  <td style={{padding:'7px 10px',color:T.text}}>{r.standard}</td>
                  <td style={{padding:'7px 10px'}}><Badge color={r.status==='Final'?T.green:r.status==='Adopted'?T.sage:T.amber} bg={r.status==='Final'?'#f0fdf4':r.status==='Adopted'?'#f0fdf4':'#fffbeb'}>{r.status}</Badge></td>
                  <td style={{padding:'7px 10px',fontFamily:T.mono,color:T.textSec}}>{r.date}</td>
                  <td style={{padding:'7px 10px'}}><Badge>{r.coverage}</Badge></td>
                  <td style={{padding:'7px 10px'}}><Badge color={r.alignment==='Aligned'?T.green:r.alignment==='Partial'?T.amber:T.textMut} bg={r.alignment==='Aligned'?'#f0fdf4':r.alignment==='Partial'?'#fffbeb':T.surfaceH}>{r.alignment}</Badge></td>
                  <td style={{padding:'7px 10px',color:T.textSec,fontSize:10}}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Avoided Emissions Disclosure Template */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Avoided Emissions Disclosure Template</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Standard disclosure fields aligned with PCAF Part C and GFANZ guidance.</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            ['Reporting Entity','Global Sustainable Finance Corp'],
            ['Reporting Period','FY 2025 (Jan-Dec)'],
            ['Methodology','PCAF Part C v1.0 + GFANZ 2024'],
            ['Boundary','Financed + Facilitated Emissions'],
            ['Total Financed Emissions',fmt(PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].financedEmissions)+' tCO2e'],
            ['Total Enabled Avoided',fmt(PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].enabledAvoided)+' tCO2e'],
            ['Net Climate Impact',(PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].enabledAvoided-PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].financedEmissions>0?'+':'')+fmt(PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].enabledAvoided-PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].financedEmissions)+' tCO2e'],
            ['Enablement Ratio',PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].ratio+'x'],
            ['Attribution Method','Pro-rata financing share'],
            ['Verification','Third-party limited assurance'],
            ['Double-Count Prevention','Syndication reconciliation applied'],
            ['Data Quality Score','PCAF Score 2.4 (weighted avg)'],
          ].map(([k,v])=>(
            <div key={k} style={{padding:10,background:T.surfaceH,borderRadius:8}}>
              <div style={{fontSize:10,color:T.textMut}}>{k}</div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Report Generator */}
      <Card>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Report Generator</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Select sections to include in your enablement methodology report.</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          {REPORT_SECTIONS.map((s,i)=>(
            <label key={s} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,background:selectedSections[i]?'#f0fdf4':T.surfaceH,border:`1px solid ${selectedSections[i]?T.sage:T.border}`,cursor:'pointer',fontSize:12,color:T.text,transition:'all 0.15s'}}>
              <input type="checkbox" checked={selectedSections[i]} onChange={()=>toggleSection(i)} style={{accentColor:T.sage}} />
              {s}
            </label>
          ))}
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface}}>
            <option>PDF</option><option>CSV</option><option>XLSX</option><option>JSON</option>
          </select>
          <button style={{padding:'8px 20px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Generate Report ({selectedSections.filter(Boolean).length} sections)</button>
          <button onClick={()=>{
            const rows=[['Product','Type','Issuer','Volume($M)','Category','Sector','EnabledReduction(tCO2e)','FinancedEmissions(tCO2e)','Ratio','Additionality']];
            PRODUCTS.forEach(p=>rows.push([p.name,p.type,p.issuer,p.volume,p.category,p.sector,p.enabledReduction,p.financedEmissions,p.ratio,p.additionality]));
            const csv=rows.map(r=>r.join(',')).join('\n');
            const blob=new Blob([csv],{type:'text/csv'});
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');a.href=url;a.download='enablement_methodology_export.csv';a.click();URL.revokeObjectURL(url);
          }} style={{padding:'8px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.navy,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Export CSV</button>
        </div>
      </Card>
    </div>
  );
}

/* ─── MAIN ─── */
export default function EnablementMethodologyPage(){
  const [tab,setTab]=useState(0);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:4,background:T.sage}} />
          <span style={{fontSize:11,fontWeight:600,color:T.sage,textTransform:'uppercase',letterSpacing:1}}>EP-AO3</span>
        </div>
        <h1 style={{fontSize:24,fontWeight:700,color:T.navy,margin:0}}>Climate Solution Enablement Methodology</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'6px 0 0',maxWidth:720}}>
          Assess how financial products enable climate solutions using PCAF facilitated emissions, GFANZ portfolio alignment, and enablement ratios across {PRODUCTS.length} products, {PROJECTS.length} projects, {SECTORS.length} sectors, and {CATEGORIES.length} enablement categories.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,
            color:tab===i?T.navy:T.textMut,background:'none',border:'none',
            borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',
            cursor:'pointer',fontFamily:T.font,marginBottom:-2,transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      {tab===0&&<EnablementScorer />}
      {tab===1&&<PortfolioEnablement />}
      {tab===2&&<AdditionalityAssessment />}
      {tab===3&&<ReportingDisclosure />}
    </div>
  );
}
