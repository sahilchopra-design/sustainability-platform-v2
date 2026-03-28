import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,ScatterChart,Scatter,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Energy','Financials','Technology','Materials','Industrials','Consumer Staples','Healthcare','Utilities'];

const RED_FLAG_TYPES=[
  {id:'rf1',name:'Emissions target without roadmap',desc:'Company sets ambitious emissions targets but has no published transition plan or interim milestones.',severity:'high',remediation:'Require publication of a detailed transition roadmap with annual interim milestones and KPIs.'},
  {id:'rf2',name:'Net-zero claim but no SBTi',desc:'Claims net-zero alignment without Science Based Targets initiative validation.',severity:'high',remediation:'Mandate SBTi commitment letter within 6 months or remove net-zero claims from marketing materials.'},
  {id:'rf3',name:'Green bond but brown revenue >50%',desc:'Issues green-labelled bonds while majority of revenue comes from fossil fuel or high-emission activities.',severity:'critical',remediation:'Require independent verification that bond proceeds are ring-fenced for genuinely green projects.'},
  {id:'rf4',name:'Carbon neutral via cheap offsets',desc:'Achieves carbon neutrality claims primarily through low-quality carbon offset purchases rather than actual reductions.',severity:'medium',remediation:'Require minimum offset quality standards (Gold Standard or VCS) and cap offsets at 20% of reduction plan.'},
  {id:'rf5',name:'ESG report but no third-party assurance',desc:'Publishes sustainability reports without any independent external verification or assurance.',severity:'medium',remediation:'Require limited or reasonable assurance from accredited third-party auditor within next reporting cycle.'},
  {id:'rf6',name:'Scope 3 excluded from targets',desc:'Emission reduction targets conveniently exclude Scope 3 (value chain) emissions which often represent 80%+ of total footprint.',severity:'high',remediation:'Mandate Scope 3 screening assessment and inclusion of material categories in reduction targets.'},
  {id:'rf7',name:'Selective metric disclosure',desc:'Cherry-picks favorable ESG metrics while omitting poor-performing indicators from reports.',severity:'medium',remediation:'Align disclosure with GRI or SASB sector-specific standards to ensure comprehensive metric coverage.'},
  {id:'rf8',name:'Lobbying against climate policy',desc:'Publicly supports climate action while lobbying against climate regulations through industry associations.',severity:'critical',remediation:'Require disclosure of all trade association memberships and lobbying expenditures related to climate policy.'}
];

const DISCLOSURE_DIMS=['Data Completeness','Third-Party Assurance','Scope 3 Coverage','Target Specificity','Methodology Transparency','Historical Data','Forward-Looking Statements','KPI Quantification','External Verification','Regulatory Alignment'];

const REG_REQUIREMENTS=[
  {id:'r1',name:'ESG rating methodology disclosure',deadline:'2026-06-30',desc:'Full transparency of rating methodology and data sources',phase:'Phase 1'},
  {id:'r2',name:'Conflict of interest management',deadline:'2026-06-30',desc:'Documented policies to prevent and manage conflicts of interest',phase:'Phase 1'},
  {id:'r3',name:'Data source documentation',deadline:'2026-06-30',desc:'Clear documentation of all data sources used in ESG assessments',phase:'Phase 1'},
  {id:'r4',name:'Regular methodology review',deadline:'2026-12-31',desc:'Annual review and update of ESG rating methodologies',phase:'Phase 1'},
  {id:'r5',name:'Stakeholder engagement process',deadline:'2026-12-31',desc:'Formal process for incorporating stakeholder feedback',phase:'Phase 1'},
  {id:'r6',name:'Proportionality of coverage',deadline:'2027-06-30',desc:'Ensure coverage breadth is proportionate to market impact',phase:'Phase 2'},
  {id:'r7',name:'Double materiality assessment',deadline:'2027-06-30',desc:'Impact and financial materiality considered in all ratings',phase:'Phase 2'},
  {id:'r8',name:'Minimum data quality standards',deadline:'2027-06-30',desc:'Established thresholds for data quality and completeness',phase:'Phase 2'},
  {id:'r9',name:'Supervisory reporting',deadline:'2027-12-31',desc:'Regular reporting to ESMA on ratings activities',phase:'Phase 2'},
  {id:'r10',name:'Record keeping (5 years)',deadline:'2027-12-31',desc:'Maintain records of all rating decisions for minimum 5 years',phase:'Phase 2'},
  {id:'r11',name:'Complaints handling mechanism',deadline:'2028-06-30',desc:'Formal procedure for handling rating disputes and complaints',phase:'Phase 3'},
  {id:'r12',name:'Separation of business lines',deadline:'2028-06-30',desc:'Operational separation between rating and consulting activities',phase:'Phase 3'}
];

const COMPANY_NAMES=['Meridian Energy','Solaris Capital','TerraChem Corp','GreenVault Holdings','Nordic Clean Power','Atlas Minerals','Quantum Financials','BluePeak Utilities','Verdant Materials','Cascade Industrials','Helix Pharma','Pinnacle Tech','Ember Resources','Nova Consumer','Zenith Healthcare','OceanRidge Utilities','Boreal Forestry','Crimson Mining','Sapphire Banking','Granite Heavy Ind','Vortex Wind Energy','TrueNorth Finance','Coral Reef Bio','Ironclad Steel','Evergreen REIT','Silverline Transport','DataStream AI','PureFusion Labs','Redwood Timber','Cobalt Electronics','Neptune Shipping','Prairie AgriTech','Summit Insurance','Glacier Water Util','Phoenix Renewables','Starlight Media','Bedrock Construction','Crestview Holdings','Titan Aerospace','Opal Petrochemicals'];

const COUNTRIES=['United States','United Kingdom','Germany','France','Japan','Australia','Canada','Switzerland','Netherlands','Singapore'];
const RATINGS_PROVIDERS=['MSCI','Sustainalytics','S&P Global','ISS ESG','CDP','Refinitiv'];

function buildCompanies(){
  return COMPANY_NAMES.map((name,i)=>{
    const s=i*7+3;
    const sector=SECTORS[Math.floor(sr(s)*SECTORS.length)];
    const country=COUNTRIES[Math.floor(sr(s+50)*COUNTRIES.length)];
    const selfScore=Math.floor(55+sr(s+1)*40);
    const gap=Math.floor(5+sr(s+2)*30);
    const thirdParty=Math.max(10,selfScore-gap);
    const discQuality=Math.floor(20+sr(s+3)*75);
    const integrity=Math.floor(thirdParty*0.4+discQuality*0.3+(100-gap)*0.3);
    const flagCount=Math.floor(sr(s+4)*5);
    const flags=[];
    for(let f=0;f<flagCount;f++){
      const fi=Math.floor(sr(s+10+f)*RED_FLAG_TYPES.length);
      if(!flags.includes(fi))flags.push(fi);
    }
    const disclosure=DISCLOSURE_DIMS.map((d,di)=>({dim:d,score:Math.floor(15+sr(s+20+di)*80)}));
    const regCompliance=REG_REQUIREMENTS.map((r,ri)=>{
      const v=sr(s+40+ri);
      return {reqId:r.id,status:v<0.35?'compliant':v<0.65?'partial':'non-compliant'};
    });
    const marketCap=Math.floor(500+sr(s+60)*49500);
    const esgRating=RATINGS_PROVIDERS[Math.floor(sr(s+70)*RATINGS_PROVIDERS.length)];
    const reportYear=2024+Math.floor(sr(s+80)*2);
    const envScore=Math.floor(20+sr(s+90)*75);
    const socScore=Math.floor(25+sr(s+91)*70);
    const govScore=Math.floor(30+sr(s+92)*65);
    const controversyLevel=sr(s+95)<0.3?'Low':sr(s+95)<0.65?'Medium':'High';
    const lastAudit=sr(s+96)<0.4?'2025-Q4':sr(s+96)<0.7?'2025-Q2':'Never';
    const carbonIntensity=Math.floor(50+sr(s+97)*450);
    const greenRevenuePct=Math.floor(sr(s+98)*60);
    const brownRevenuePct=Math.floor(sr(s+99)*40);
    return {id:i,name,sector,country,selfScore,thirdParty,gap,discQuality,integrity,flags,disclosure,regCompliance,marketCap,esgRating,reportYear,envScore,socScore,govScore,controversyLevel,lastAudit,carbonIntensity,greenRevenuePct,brownRevenuePct};
  });
}

const tierLabel=(q)=>q>=85?'Platinum':q>=70?'Gold':q>=50?'Silver':q>=30?'Bronze':'Unrated';
const tierColor=(q)=>q>=85?'#6366f1':q>=70?T.gold:q>=50?'#94a3b8':q>=30?'#b45309':'#9aa3ae';
const trafficLight=(v)=>v>=70?T.green:v>=45?T.amber:T.red;
const complianceColor=(s)=>s==='compliant'?T.green:s==='partial'?T.amber:T.red;
const severityColor=(s)=>s==='critical'?T.red:s==='high'?T.amber:T.gold;

const btn=(active)=>({padding:'7px 16px',borderRadius:8,border:`1.5px solid ${active?T.navy:T.border}`,background:active?T.navy:T.surface,color:active?'#fff':T.text,fontFamily:T.font,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'});
const card={background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:18,marginBottom:12};
const input={padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface,outline:'none',width:'100%',boxSizing:'border-box'};
const statBox=(color)=>({textAlign:'center',padding:'10px 14px',borderRadius:8,background:color+'08',border:`1px solid ${color}20`});

const TABS=['Integrity Scanner','Red Flag Engine','Disclosure Quality','Regulatory Compliance'];

export default function GreenwashingDetectorPage(){
  const companies=useMemo(()=>buildCompanies(),[]);
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [sortBy,setSortBy]=useState('integrity');
  const [selectedCo,setSelectedCo]=useState(null);
  const [flagFilter,setFlagFilter]=useState('All');
  const [scanning,setScanning]=useState(false);
  const [scanComplete,setScanComplete]=useState(false);
  const [scanProgress,setScanProgress]=useState(0);
  const [customFlags,setCustomFlags]=useState([]);
  const [newFlagText,setNewFlagText]=useState('');
  const [newFlagThreshold,setNewFlagThreshold]=useState('50');
  const [radarCo,setRadarCo]=useState(0);
  const [regCoFilter,setRegCoFilter]=useState('All');
  const [regStatusFilter,setRegStatusFilter]=useState('All');
  const [showPanel,setShowPanel]=useState(false);
  const [integrityThreshold,setIntegrityThreshold]=useState(45);
  const [heatmapPage,setHeatmapPage]=useState(0);
  const [disclosureView,setDisclosureView]=useState('radar');
  const [regPhaseFilter,setRegPhaseFilter]=useState('All');
  const [expandedReq,setExpandedReq]=useState(null);
  const [flagSeverityFilter,setFlagSeverityFilter]=useState('All');
  const [comparisonCo,setComparisonCo]=useState(null);

  const filtered=useMemo(()=>{
    let list=[...companies];
    if(search)list=list.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
    if(sectorFilter!=='All')list=list.filter(c=>c.sector===sectorFilter);
    if(sortBy==='integrity')list.sort((a,b)=>a.integrity-b.integrity);
    else if(sortBy==='gap')list.sort((a,b)=>b.gap-a.gap);
    else if(sortBy==='disclosure')list.sort((a,b)=>a.discQuality-b.discQuality);
    else if(sortBy==='name')list.sort((a,b)=>a.name.localeCompare(b.name));
    else if(sortBy==='flags')list.sort((a,b)=>b.flags.length-a.flags.length);
    return list;
  },[companies,search,sectorFilter,sortBy]);

  const flagFiltered=useMemo(()=>{
    let list=[...companies];
    if(flagFilter!=='All'){
      const idx=RED_FLAG_TYPES.findIndex(f=>f.id===flagFilter);
      list=list.filter(c=>c.flags.includes(idx));
    }
    if(flagSeverityFilter!=='All'){
      list=list.filter(c=>c.flags.some(fi=>RED_FLAG_TYPES[fi]?.severity===flagSeverityFilter));
    }
    return list;
  },[companies,flagFilter,flagSeverityFilter]);

  const regFiltered=useMemo(()=>{
    let list=[...companies];
    if(regCoFilter!=='All')list=list.filter(c=>c.sector===regCoFilter);
    return list;
  },[companies,regCoFilter]);

  const portfolioCompliance=useMemo(()=>{
    let total=0,count=0;
    companies.forEach(c=>{c.regCompliance.forEach(r=>{count++;if(r.status==='compliant')total+=1;else if(r.status==='partial')total+=0.5;});});
    return count?Math.round(total/count*100):0;
  },[companies]);

  const summaryStats=useMemo(()=>{
    const avgIntegrity=Math.round(companies.reduce((s,c)=>s+c.integrity,0)/companies.length);
    const avgGap=Math.round(companies.reduce((s,c)=>s+c.gap,0)/companies.length);
    const totalFlags=companies.reduce((s,c)=>s+c.flags.length,0);
    const criticalCos=companies.filter(c=>c.integrity<integrityThreshold).length;
    const avgDisc=Math.round(companies.reduce((s,c)=>s+c.discQuality,0)/companies.length);
    return {avgIntegrity,avgGap,totalFlags,criticalCos,avgDisc};
  },[companies,integrityThreshold]);

  const runScan=()=>{
    setScanning(true);setScanComplete(false);setScanProgress(0);
    const interval=setInterval(()=>{setScanProgress(p=>{if(p>=100){clearInterval(interval);return 100;}return p+5;});},100);
    setTimeout(()=>{clearInterval(interval);setScanning(false);setScanComplete(true);setScanProgress(100);},2100);
  };

  const addCustomFlag=()=>{
    if(!newFlagText.trim())return;
    setCustomFlags(p=>[...p,{id:`cf${p.length}`,name:newFlagText.trim(),threshold:parseInt(newFlagThreshold)||50,desc:'Custom rule added by analyst',severity:'medium',remediation:'Apply custom monitoring threshold.'}]);
    setNewFlagText('');setNewFlagThreshold('50');
  };

  const sectorAvg=useMemo(()=>{
    const co=companies[radarCo];
    if(!co)return[];
    const sectorCos=companies.filter(c=>c.sector===co.sector);
    return DISCLOSURE_DIMS.map((d,di)=>{
      const avg=Math.round(sectorCos.reduce((s,c)=>s+c.disclosure[di].score,0)/sectorCos.length);
      const best=Math.max(...sectorCos.map(c=>c.disclosure[di].score));
      return {dim:d,company:co.disclosure[di].score,sectorAvg:avg,bestInClass:best};
    });
  },[companies,radarCo]);

  const comparisonData=useMemo(()=>{
    if(comparisonCo===null)return null;
    const co=companies[radarCo];
    const comp=companies[comparisonCo];
    if(!co||!comp)return null;
    return DISCLOSURE_DIMS.map((d,di)=>({dim:d,primary:co.disclosure[di].score,comparison:comp.disclosure[di].score}));
  },[companies,radarCo,comparisonCo]);

  const daysUntil=(d)=>{
    const now=new Date('2026-03-28');
    const target=new Date(d);
    return Math.max(0,Math.ceil((target-now)/(1000*60*60*24)));
  };

  /* ─── TAB 1: Integrity Scanner ─── */
  const renderIntegrity=()=>{
    const detail=selectedCo!==null?companies[selectedCo]:null;
    const sectorBreakdown=SECTORS.map(s=>{
      const cos=companies.filter(c=>c.sector===s);
      return {sector:s,avg:cos.length?Math.round(cos.reduce((a,c)=>a+c.integrity,0)/cos.length):0,count:cos.length};
    }).sort((a,b)=>a.avg-b.avg);

    return (<div style={{display:'flex',gap:20}}>
      <div style={{flex:showPanel?'0 0 58%':'1',transition:'flex 0.3s'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
          <div style={statBox(T.navy)}>
            <div style={{fontSize:22,fontWeight:800,color:T.navy,fontFamily:T.mono}}>{summaryStats.avgIntegrity}</div>
            <div style={{fontSize:10,color:T.textMut}}>Avg Integrity</div>
          </div>
          <div style={statBox(T.red)}>
            <div style={{fontSize:22,fontWeight:800,color:T.red,fontFamily:T.mono}}>{summaryStats.avgGap}</div>
            <div style={{fontSize:10,color:T.textMut}}>Avg Rating Gap</div>
          </div>
          <div style={statBox(T.amber)}>
            <div style={{fontSize:22,fontWeight:800,color:T.amber,fontFamily:T.mono}}>{summaryStats.totalFlags}</div>
            <div style={{fontSize:10,color:T.textMut}}>Total Red Flags</div>
          </div>
          <div style={statBox(T.red)}>
            <div style={{fontSize:22,fontWeight:800,color:T.red,fontFamily:T.mono}}>{summaryStats.criticalCos}</div>
            <div style={{fontSize:10,color:T.textMut}}>Below Threshold</div>
          </div>
          <div style={statBox(T.sage)}>
            <div style={{fontSize:22,fontWeight:800,color:T.sage,fontFamily:T.mono}}>{summaryStats.avgDisc}</div>
            <div style={{fontSize:10,color:T.textMut}}>Avg Disclosure</div>
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input style={{...input,maxWidth:200}} placeholder="Search companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <select style={{...input,maxWidth:150}} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select style={{...input,maxWidth:180}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="integrity">Sort: Integrity Score</option>
            <option value="gap">Sort: Gap Size</option>
            <option value="disclosure">Sort: Disclosure Quality</option>
            <option value="name">Sort: Name A-Z</option>
            <option value="flags">Sort: Red Flag Count</option>
          </select>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.textSec}}>
            <span>Threshold:</span>
            <input type="range" min={20} max={80} value={integrityThreshold} onChange={e=>setIntegrityThreshold(Number(e.target.value))} style={{width:80}}/>
            <span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{integrityThreshold}</span>
          </div>
          <span style={{fontSize:12,color:T.textMut,marginLeft:'auto'}}>{filtered.length} companies</span>
        </div>

        <div style={{...card,marginBottom:16,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Integrity by Sector</div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={sectorBreakdown} margin={{top:5,right:10,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textMut}}/>
              <YAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
              <Bar dataKey="avg" name="Avg Integrity" radius={[4,4,0,0]}>
                {sectorBreakdown.map((d,i)=><Cell key={i} fill={trafficLight(d.avg)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12,maxHeight:480,overflowY:'auto',paddingRight:4}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>{setSelectedCo(c.id);setShowPanel(true);}} style={{...card,cursor:'pointer',borderColor:selectedCo===c.id?T.navy:T.border,borderLeft:c.integrity<integrityThreshold?`3px solid ${T.red}`:`3px solid transparent`,transition:'all 0.2s',padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontWeight:700,fontSize:13,color:T.text,fontFamily:T.font}}>{c.name}</div>
                <div style={{width:11,height:11,borderRadius:'50%',background:trafficLight(c.integrity)}}/>
              </div>
              <div style={{fontSize:10,color:T.textMut,marginBottom:8}}>{c.sector} | {c.country} | {c.esgRating}</div>
              <div style={{display:'flex',gap:14,marginBottom:8}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:800,color:trafficLight(c.integrity),fontFamily:T.mono}}>{c.integrity}</div>
                  <div style={{fontSize:9,color:T.textMut}}>Integrity</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.red,fontFamily:T.mono}}>-{c.gap}</div>
                  <div style={{fontSize:9,color:T.textMut}}>Gap</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:14,fontWeight:700,color:tierColor(c.discQuality),fontFamily:T.mono}}>{c.discQuality}</div>
                  <div style={{fontSize:9,color:T.textMut}}>Disc.</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.red,fontFamily:T.mono}}>{c.flags.length}</div>
                  <div style={{fontSize:9,color:T.textMut}}>Flags</div>
                </div>
              </div>
              <div style={{height:36}}>
                <ResponsiveContainer width="100%" height={36}>
                  <BarChart data={[{self:c.selfScore,third:c.thirdParty}]} layout="vertical" margin={{top:0,right:5,left:0,bottom:0}}>
                    <XAxis type="number" domain={[0,100]} hide/>
                    <YAxis type="category" dataKey="name" hide/>
                    <Bar dataKey="self" fill={T.gold} barSize={8} radius={[0,4,4,0]} name="Self"/>
                    <Bar dataKey="third" fill={T.navyL} barSize={8} radius={[0,4,4,0]} name="Rated"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.textMut,marginTop:2}}>
                <span>Self: {c.selfScore}</span><span>Rated: {c.thirdParty}</span>
              </div>
              {c.flags.length>0&&<div style={{display:'flex',gap:3,marginTop:6,flexWrap:'wrap'}}>
                {c.flags.slice(0,2).map(fi=>(
                  <span key={fi} style={{fontSize:8,padding:'2px 5px',borderRadius:3,background:severityColor(RED_FLAG_TYPES[fi]?.severity)+'18',color:severityColor(RED_FLAG_TYPES[fi]?.severity),fontWeight:600}}>{RED_FLAG_TYPES[fi]?.name.slice(0,28)}</span>
                ))}
                {c.flags.length>2&&<span style={{fontSize:8,color:T.textMut}}>+{c.flags.length-2}</span>}
              </div>}
            </div>
          ))}
        </div>
      </div>

      {showPanel&&detail&&(
        <div style={{flex:'0 0 40%',background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,maxHeight:720,overflowY:'auto',position:'relative'}}>
          <button onClick={()=>{setShowPanel(false);setSelectedCo(null);}} style={{position:'absolute',top:12,right:12,background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.textMut}}>x</button>
          <h3 style={{margin:'0 0 4px',fontSize:17,color:T.navy,fontFamily:T.font}}>{detail.name}</h3>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>{detail.sector} | {detail.country} | Rated by {detail.esgRating}</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:14}}>Market Cap: ${detail.marketCap}M | Last Report: {detail.reportYear} | Last Audit: {detail.lastAudit} | Controversy: {detail.controversyLevel}</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
            {[{l:'Integrity',v:detail.integrity,c:trafficLight(detail.integrity)},{l:'Self-Reported',v:detail.selfScore,c:T.gold},{l:'Third-Party',v:detail.thirdParty,c:T.navyL},{l:'Gap',v:'-'+detail.gap,c:T.red}].map(m=>(
              <div key={m.l} style={{textAlign:'center',padding:8,borderRadius:8,background:T.bg}}>
                <div style={{fontSize:20,fontWeight:800,color:m.c,fontFamily:T.mono}}>{m.v}</div>
                <div style={{fontSize:9,color:T.textMut}}>{m.l}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
            {[{l:'Environmental',v:detail.envScore},{l:'Social',v:detail.socScore},{l:'Governance',v:detail.govScore}].map(m=>(
              <div key={m.l} style={{textAlign:'center',padding:6,borderRadius:6,background:T.bg}}>
                <div style={{fontSize:16,fontWeight:700,color:trafficLight(m.v),fontFamily:T.mono}}>{m.v}</div>
                <div style={{fontSize:9,color:T.textMut}}>{m.l}</div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Rating Gap Analysis</div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={[{name:'ESG',self:detail.selfScore,third:detail.thirdParty}]} margin={{top:5,right:10,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/>
                <YAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
                <Bar dataKey="self" fill={T.gold} name="Self-Reported" radius={[4,4,0,0]}/>
                <Bar dataKey="third" fill={T.navyL} name="Third-Party" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Revenue Mix</div>
            <div style={{display:'flex',gap:12}}>
              <div style={{flex:1,padding:8,borderRadius:6,background:T.green+'10',textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color:T.green,fontFamily:T.mono}}>{detail.greenRevenuePct}%</div>
                <div style={{fontSize:10,color:T.textMut}}>Green Revenue</div>
              </div>
              <div style={{flex:1,padding:8,borderRadius:6,background:T.red+'10',textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color:T.red,fontFamily:T.mono}}>{detail.brownRevenuePct}%</div>
                <div style={{fontSize:10,color:T.textMut}}>Brown Revenue</div>
              </div>
              <div style={{flex:1,padding:8,borderRadius:6,background:T.bg,textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color:T.textSec,fontFamily:T.mono}}>{detail.carbonIntensity}</div>
                <div style={{fontSize:10,color:T.textMut}}>tCO2e/M$</div>
              </div>
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Red Flags ({detail.flags.length})</div>
            {detail.flags.length===0?<div style={{fontSize:12,color:T.green,padding:8,background:'#16a34a10',borderRadius:8}}>No red flags detected</div>:
              detail.flags.map(fi=>(
                <div key={fi} style={{padding:10,borderRadius:8,border:`1px solid ${severityColor(RED_FLAG_TYPES[fi].severity)}30`,background:severityColor(RED_FLAG_TYPES[fi].severity)+'08',marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,fontWeight:600,color:T.text}}>{RED_FLAG_TYPES[fi].name}</span>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:4,background:severityColor(RED_FLAG_TYPES[fi].severity)+'20',color:severityColor(RED_FLAG_TYPES[fi].severity),fontWeight:600,textTransform:'uppercase'}}>{RED_FLAG_TYPES[fi].severity}</span>
                  </div>
                  <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{RED_FLAG_TYPES[fi].desc}</div>
                  <div style={{fontSize:10,color:T.navyL,marginTop:4,fontStyle:'italic'}}>Remediation: {RED_FLAG_TYPES[fi].remediation}</div>
                </div>
              ))
            }
          </div>

          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>AI Recommendations</div>
            {detail.gap>20&&<div style={{fontSize:11,color:T.text,padding:8,background:T.bg,borderRadius:8,marginBottom:4}}>Significant rating gap ({detail.gap} pts) - request independent third-party ESG audit</div>}
            {detail.discQuality<50&&<div style={{fontSize:11,color:T.text,padding:8,background:T.bg,borderRadius:8,marginBottom:4}}>Low disclosure quality ({detail.discQuality}/100) - enhance reporting transparency per ISSB standards</div>}
            {detail.flags.length>=3&&<div style={{fontSize:11,color:T.text,padding:8,background:T.bg,borderRadius:8,marginBottom:4}}>Multiple red flags ({detail.flags.length}) - escalate for enhanced due diligence review</div>}
            {detail.brownRevenuePct>30&&<div style={{fontSize:11,color:T.text,padding:8,background:T.amber+'10',borderRadius:8,marginBottom:4}}>High brown revenue ({detail.brownRevenuePct}%) - verify green bond use-of-proceeds alignment</div>}
            {detail.integrity<integrityThreshold&&<div style={{fontSize:11,color:T.red,padding:8,background:'#dc262610',borderRadius:8,marginBottom:4}}>Critical: Integrity score below threshold ({integrityThreshold}) - consider exclusion from portfolio</div>}
            {detail.lastAudit==='Never'&&<div style={{fontSize:11,color:T.amber,padding:8,background:T.amber+'10',borderRadius:8,marginBottom:4}}>No ESG audit on record - mandate third-party assurance engagement</div>}
            {detail.integrity>=70&&detail.flags.length===0&&<div style={{fontSize:11,color:T.green,padding:8,background:'#16a34a10',borderRadius:8}}>Strong integrity profile - suitable for ESG-focused portfolios</div>}
          </div>
        </div>
      )}
    </div>);
  };

  /* ─── TAB 2: Red Flag Engine ─── */
  const renderRedFlags=()=>{
    const allFlags=[...RED_FLAG_TYPES,...customFlags.map(cf=>({...cf,severity:cf.severity||'medium'}))];
    const cumulative=[...companies].sort((a,b)=>b.flags.length-a.flags.length).slice(0,15);
    const heatmapSize=20;
    const heatmapStart=heatmapPage*heatmapSize;
    const heatmapCos=flagFiltered.slice(heatmapStart,heatmapStart+heatmapSize);
    const totalHeatPages=Math.ceil(flagFiltered.length/heatmapSize);

    const severityCounts={critical:0,high:0,medium:0};
    companies.forEach(c=>c.flags.forEach(fi=>{const sev=RED_FLAG_TYPES[fi]?.severity;if(sev)severityCounts[sev]++;}));

    return (<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <div style={statBox(T.red)}>
          <div style={{fontSize:22,fontWeight:800,color:T.red,fontFamily:T.mono}}>{severityCounts.critical}</div>
          <div style={{fontSize:10,color:T.textMut}}>Critical Flags</div>
        </div>
        <div style={statBox(T.amber)}>
          <div style={{fontSize:22,fontWeight:800,color:T.amber,fontFamily:T.mono}}>{severityCounts.high}</div>
          <div style={{fontSize:10,color:T.textMut}}>High Flags</div>
        </div>
        <div style={statBox(T.gold)}>
          <div style={{fontSize:22,fontWeight:800,color:T.gold,fontFamily:T.mono}}>{severityCounts.medium}</div>
          <div style={{fontSize:10,color:T.textMut}}>Medium Flags</div>
        </div>
        <div style={statBox(T.sage)}>
          <div style={{fontSize:22,fontWeight:800,color:T.sage,fontFamily:T.mono}}>{companies.filter(c=>c.flags.length===0).length}</div>
          <div style={{fontSize:10,color:T.textMut}}>Clean Companies</div>
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <select style={{...input,maxWidth:250}} value={flagFilter} onChange={e=>setFlagFilter(e.target.value)}>
          <option value="All">All Red Flag Types</option>
          {RED_FLAG_TYPES.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select style={{...input,maxWidth:150}} value={flagSeverityFilter} onChange={e=>setFlagSeverityFilter(e.target.value)}>
          <option value="All">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        <button onClick={runScan} disabled={scanning} style={{...btn(true),opacity:scanning?0.6:1,minWidth:120}}>
          {scanning?'Scanning...':'Run Scan'}
        </button>
        {scanComplete&&<span style={{fontSize:12,color:T.green,fontWeight:600}}>Scan complete - {Math.floor(sr(42)*8)+3} new flags detected</span>}
        <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{flagFiltered.length} companies matched</span>
      </div>

      {scanning&&(
        <div style={{...card,textAlign:'center',padding:24}}>
          <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:10}}>AI Greenwashing Scanner Running...</div>
          <div style={{width:'100%',height:6,background:T.bg,borderRadius:3,overflow:'hidden',marginBottom:6}}>
            <div style={{width:`${scanProgress}%`,height:'100%',background:`linear-gradient(90deg,${T.navy},${T.sage})`,borderRadius:3,transition:'width 0.1s linear'}}/>
          </div>
          <div style={{fontSize:11,color:T.textMut}}>Analyzing {companies.length} companies across {RED_FLAG_TYPES.length} red flag categories... {scanProgress}%</div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Red Flag Types & Remediation</div>
          <div style={{maxHeight:360,overflowY:'auto'}}>
            {allFlags.map((f,i)=>(
              <div key={f.id} style={{padding:'8px 10px',borderRadius:8,background:i%2===0?T.bg:'transparent',marginBottom:2}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.text}}>{f.name}</div>
                  <span style={{fontSize:9,padding:'2px 7px',borderRadius:4,background:severityColor(f.severity)+'18',color:severityColor(f.severity),fontWeight:600,whiteSpace:'nowrap'}}>{f.severity}</span>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginBottom:2}}>{f.desc}</div>
                <div style={{fontSize:10,color:T.navyL,fontStyle:'italic'}}>{f.remediation}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Cumulative Red Flags (Top 15)</div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={cumulative} layout="vertical" margin={{top:5,right:20,left:90,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textMut}} width={85}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
              <Bar dataKey="flags" name="Red Flags" radius={[0,4,4,0]}>
                {cumulative.map((c,i)=><Cell key={i} fill={c.flags.length>=4?T.red:c.flags.length>=2?T.amber:T.sage}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Red Flag Heatmap</div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <button onClick={()=>setHeatmapPage(p=>Math.max(0,p-1))} disabled={heatmapPage===0} style={{...btn(false),padding:'4px 10px',fontSize:11,opacity:heatmapPage===0?0.4:1}}>Prev</button>
            <span style={{fontSize:11,color:T.textMut}}>Page {heatmapPage+1}/{totalHeatPages}</span>
            <button onClick={()=>setHeatmapPage(p=>Math.min(totalHeatPages-1,p+1))} disabled={heatmapPage>=totalHeatPages-1} style={{...btn(false),padding:'4px 10px',fontSize:11,opacity:heatmapPage>=totalHeatPages-1?0.4:1}}>Next</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.font}}>
            <thead>
              <tr>
                <th style={{textAlign:'left',padding:'6px 8px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontWeight:600,position:'sticky',left:0,background:T.surface,minWidth:130}}>Company</th>
                {RED_FLAG_TYPES.map(f=>(
                  <th key={f.id} style={{padding:'4px 3px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontWeight:500,fontSize:8,maxWidth:65,textAlign:'center',writingMode:'vertical-rl',height:95}}>{f.name}</th>
                ))}
                <th style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontWeight:600,textAlign:'center'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {heatmapCos.map(c=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${T.bg}`}}>
                  <td style={{padding:'5px 8px',fontWeight:600,color:T.text,position:'sticky',left:0,background:T.surface,fontSize:10}}>{c.name}</td>
                  {RED_FLAG_TYPES.map((f,fi)=>(
                    <td key={fi} style={{textAlign:'center',padding:3}}>
                      <div style={{width:15,height:15,borderRadius:3,margin:'0 auto',background:c.flags.includes(fi)?severityColor(f.severity)+'30':T.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {c.flags.includes(fi)&&<span style={{fontSize:9,color:severityColor(f.severity)}}>!</span>}
                      </div>
                    </td>
                  ))}
                  <td style={{textAlign:'center',fontWeight:700,color:c.flags.length>=3?T.red:c.flags.length>=1?T.amber:T.green,fontFamily:T.mono,fontSize:11}}>{c.flags.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Add Custom Red Flag Rule</div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input style={{...input,flex:1}} placeholder="Rule description (e.g. 'No water usage disclosure')" value={newFlagText} onChange={e=>setNewFlagText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustomFlag()}/>
          <input style={{...input,maxWidth:100}} type="number" placeholder="Threshold" value={newFlagThreshold} onChange={e=>setNewFlagThreshold(e.target.value)}/>
          <button onClick={addCustomFlag} style={btn(true)}>Add Rule</button>
        </div>
        {customFlags.length>0&&<div style={{marginTop:10}}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>{customFlags.length} custom rule(s)</div>
          {customFlags.map(cf=>(
            <div key={cf.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:T.bg,borderRadius:6,marginBottom:4}}>
              <span style={{fontSize:11,color:T.text}}>{cf.name}</span>
              <span style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>threshold: {cf.threshold}</span>
            </div>
          ))}
        </div>}
      </div>
    </div>);
  };

  /* ─── TAB 3: Disclosure Quality ─── */
  const renderDisclosure=()=>{
    const co=companies[radarCo];
    const qualityDist=[
      {tier:'Platinum',count:companies.filter(c=>c.discQuality>=85).length,color:'#6366f1'},
      {tier:'Gold',count:companies.filter(c=>c.discQuality>=70&&c.discQuality<85).length,color:T.gold},
      {tier:'Silver',count:companies.filter(c=>c.discQuality>=50&&c.discQuality<70).length,color:'#94a3b8'},
      {tier:'Bronze',count:companies.filter(c=>c.discQuality>=30&&c.discQuality<50).length,color:'#b45309'},
      {tier:'Unrated',count:companies.filter(c=>c.discQuality<30).length,color:'#9aa3ae'}
    ];

    const scatterData=companies.map(c=>({name:c.name,x:c.discQuality,y:c.integrity,sector:c.sector,gap:c.gap}));

    return (<div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Company Analysis</div>
            <div style={{display:'flex',gap:6}}>
              {['radar','compare'].map(v=>(
                <button key={v} onClick={()=>setDisclosureView(v)} style={{...btn(disclosureView===v),padding:'4px 12px',fontSize:11}}>{v==='radar'?'Radar':'Compare'}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            <select style={{...input,maxWidth:190}} value={radarCo} onChange={e=>setRadarCo(Number(e.target.value))}>
              {companies.map((c,i)=><option key={i} value={i}>{c.name}</option>)}
            </select>
            {disclosureView==='compare'&&(
              <select style={{...input,maxWidth:190}} value={comparisonCo||''} onChange={e=>setComparisonCo(e.target.value?Number(e.target.value):null)}>
                <option value="">Select comparison...</option>
                {companies.filter((c,i)=>i!==radarCo).map((c,i)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          {co&&(
            <>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:tierColor(co.discQuality)+'20',color:tierColor(co.discQuality),fontWeight:600}}>{tierLabel(co.discQuality)}</span>
                <span style={{fontSize:11,color:T.textMut}}>Score: {co.discQuality}/100</span>
                <span style={{fontSize:11,color:T.textMut}}>Sector: {co.sector}</span>
              </div>
              {disclosureView==='radar'?(
                <ResponsiveContainer width="100%" height={290}>
                  <RadarChart data={sectorAvg} cx="50%" cy="50%" outerRadius="65%">
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="dim" tick={{fontSize:7,fill:T.textMut}}/>
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:8,fill:T.textMut}}/>
                    <Radar name={co.name} dataKey="company" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
                    <Radar name="Sector Avg" dataKey="sectorAvg" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/>
                    <Radar name="Best in Class" dataKey="bestInClass" stroke={T.sage} fill={T.sage} fillOpacity={0.1}/>
                    <Legend wrapperStyle={{fontSize:10}}/>
                    <Tooltip contentStyle={{fontFamily:T.font,fontSize:10,borderRadius:8}}/>
                  </RadarChart>
                </ResponsiveContainer>
              ):(
                comparisonData?(
                  <ResponsiveContainer width="100%" height={290}>
                    <RadarChart data={comparisonData} cx="50%" cy="50%" outerRadius="65%">
                      <PolarGrid stroke={T.border}/>
                      <PolarAngleAxis dataKey="dim" tick={{fontSize:7,fill:T.textMut}}/>
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:8,fill:T.textMut}}/>
                      <Radar name={co.name} dataKey="primary" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
                      <Radar name={companies[comparisonCo]?.name} dataKey="comparison" stroke={T.red} fill={T.red} fillOpacity={0.15}/>
                      <Legend wrapperStyle={{fontSize:10}}/>
                      <Tooltip contentStyle={{fontFamily:T.font,fontSize:10,borderRadius:8}}/>
                    </RadarChart>
                  </ResponsiveContainer>
                ):<div style={{padding:40,textAlign:'center',color:T.textMut,fontSize:12}}>Select a company to compare against</div>
              )}
            </>
          )}
        </div>

        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Quality Tier Distribution</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={qualityDist} margin={{top:5,right:10,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="tier" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:9,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
              <Bar dataKey="count" name="Companies" radius={[4,4,0,0]}>
                {qualityDist.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:14,marginBottom:8}}>Disclosure vs Integrity Scatter</div>
          <ResponsiveContainer width="100%" height={190}>
            <ScatterChart margin={{top:5,right:10,left:10,bottom:15}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Disclosure" tick={{fontSize:9,fill:T.textMut}} label={{value:'Disclosure Quality',position:'bottom',fontSize:9,fill:T.textMut,offset:0}}/>
              <YAxis dataKey="y" name="Integrity" tick={{fontSize:9,fill:T.textMut}} label={{value:'Integrity',angle:-90,position:'left',fontSize:9,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:10,borderRadius:8}} formatter={(v,n)=>[v,n]}/>
              <Scatter name="Companies" data={scatterData} fill={T.navyL}>
                {scatterData.map((d,i)=><Cell key={i} fill={trafficLight(d.y)} opacity={0.7}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Dimension Scores - {co?.name||''}</div>
        {co&&<div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {co.disclosure.map((d,di)=>(
            <div key={di} style={{padding:10,borderRadius:8,background:T.bg,textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:d.score>=70?T.green:d.score>=45?T.amber:T.red,fontFamily:T.mono}}>{d.score}</div>
              <div style={{fontSize:8,color:T.textMut,marginTop:4,lineHeight:1.3}}>{d.dim}</div>
              <div style={{height:3,background:T.border,borderRadius:2,marginTop:6,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${d.score}%`,background:d.score>=70?T.green:d.score>=45?T.amber:T.red,borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>}
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Company Disclosure Rankings</div>
        <div style={{overflowX:'auto',maxHeight:300,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead>
              <tr style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                <th style={{textAlign:'left',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec}}>Rank</th>
                <th style={{textAlign:'left',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec}}>Company</th>
                <th style={{textAlign:'left',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec}}>Sector</th>
                <th style={{textAlign:'center',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec}}>Score</th>
                <th style={{textAlign:'center',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec}}>Tier</th>
                <th style={{textAlign:'center',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec}}>Gap</th>
              </tr>
            </thead>
            <tbody>
              {[...companies].sort((a,b)=>b.discQuality-a.discQuality).map((c,i)=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${T.bg}`,cursor:'pointer',background:radarCo===c.id?T.surfaceH:'transparent'}} onClick={()=>setRadarCo(c.id)}>
                  <td style={{padding:'5px 8px',fontWeight:600,color:T.textMut}}>#{i+1}</td>
                  <td style={{padding:'5px 8px',fontWeight:600,color:T.text}}>{c.name}</td>
                  <td style={{padding:'5px 8px',color:T.textSec}}>{c.sector}</td>
                  <td style={{padding:'5px 8px',textAlign:'center',fontWeight:700,color:trafficLight(c.discQuality),fontFamily:T.mono}}>{c.discQuality}</td>
                  <td style={{padding:'5px 8px',textAlign:'center'}}>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:4,background:tierColor(c.discQuality)+'20',color:tierColor(c.discQuality),fontWeight:600}}>{tierLabel(c.discQuality)}</span>
                  </td>
                  <td style={{padding:'5px 8px',textAlign:'center',color:T.red,fontFamily:T.mono,fontWeight:600}}>{c.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  /* ─── TAB 4: Regulatory Compliance ─── */
  const renderRegulatory=()=>{
    const complianceByReq=REG_REQUIREMENTS.map(r=>{
      const stats={compliant:0,partial:0,nonCompliant:0};
      regFiltered.forEach(c=>{const rc=c.regCompliance.find(x=>x.reqId===r.id);if(rc){if(rc.status==='compliant')stats.compliant++;else if(rc.status==='partial')stats.partial++;else stats.nonCompliant++;}});
      return {...r,...stats,total:regFiltered.length};
    });

    const phaseFiltered=regPhaseFilter==='All'?complianceByReq:complianceByReq.filter(r=>r.phase===regPhaseFilter);

    return (<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <select style={{...input,maxWidth:180}} value={regCoFilter} onChange={e=>setRegCoFilter(e.target.value)}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{...input,maxWidth:180}} value={regStatusFilter} onChange={e=>setRegStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="compliant">Compliant</option>
          <option value="partial">Partial</option>
          <option value="non-compliant">Non-Compliant</option>
        </select>
        <select style={{...input,maxWidth:150}} value={regPhaseFilter} onChange={e=>setRegPhaseFilter(e.target.value)}>
          <option value="All">All Phases</option>
          <option value="Phase 1">Phase 1</option>
          <option value="Phase 2">Phase 2</option>
          <option value="Phase 3">Phase 3</option>
        </select>
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:T.textMut}}>Portfolio Compliance</div>
            <div style={{fontSize:28,fontWeight:800,color:portfolioCompliance>=70?T.green:portfolioCompliance>=45?T.amber:T.red,fontFamily:T.mono}}>{portfolioCompliance}%</div>
          </div>
          <button onClick={()=>{}} style={btn(false)}>Export Report</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {['compliant','partial','non-compliant'].map(status=>{
          const count=companies.reduce((s,c)=>s+c.regCompliance.filter(r=>r.status===status).length,0);
          const total=companies.length*REG_REQUIREMENTS.length;
          const pct=Math.round(count/total*100);
          const color=status==='compliant'?T.green:status==='partial'?T.amber:T.red;
          const label=status==='non-compliant'?'Non-Compliant':status.charAt(0).toUpperCase()+status.slice(1);
          return (
            <div key={status} style={{padding:16,borderRadius:10,background:color+'08',border:`1px solid ${color}20`,textAlign:'center'}}>
              <div style={{fontSize:30,fontWeight:800,color,fontFamily:T.mono}}>{pct}%</div>
              <div style={{fontSize:13,fontWeight:600,color,marginBottom:4}}>{label}</div>
              <div style={{fontSize:10,color:T.textMut}}>{count} of {total} checks</div>
            </div>
          );
        })}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Requirement Compliance Breakdown</div>
          <div style={{maxHeight:380,overflowY:'auto'}}>
            {phaseFiltered.map((r,i)=>{
              const pct=r.total?Math.round(r.compliant/r.total*100):0;
              const isExpanded=expandedReq===r.id;
              return (
                <div key={r.id} onClick={()=>setExpandedReq(isExpanded?null:r.id)} style={{padding:10,borderRadius:8,background:i%2===0?T.bg:'transparent',marginBottom:2,cursor:'pointer'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div>
                      <span style={{fontSize:12,fontWeight:600,color:T.text}}>{r.name}</span>
                      <span style={{fontSize:9,color:T.navyL,marginLeft:6,padding:'1px 5px',borderRadius:3,background:T.navyL+'15'}}>{r.phase}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:pct>=70?T.green:pct>=40?T.amber:T.red,fontFamily:T.mono}}>{pct}%</span>
                  </div>
                  <div style={{height:4,background:T.surface,borderRadius:2,overflow:'hidden',marginBottom:4}}>
                    <div style={{height:'100%',width:`${pct}%`,background:pct>=70?T.green:pct>=40?T.amber:T.red,borderRadius:2,transition:'width 0.5s'}}/>
                  </div>
                  <div style={{display:'flex',gap:8,fontSize:10}}>
                    <span style={{color:T.green}}>{r.compliant} compliant</span>
                    <span style={{color:T.amber}}>{r.partial} partial</span>
                    <span style={{color:T.red}}>{r.nonCompliant} non-compliant</span>
                  </div>
                  {isExpanded&&(
                    <div style={{marginTop:8,padding:8,background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{r.desc}</div>
                      <div style={{fontSize:10,color:T.textMut}}>Deadline: {r.deadline} ({daysUntil(r.deadline)} days remaining)</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Regulation Timeline & Countdown</div>
          <div style={{maxHeight:380,overflowY:'auto'}}>
            {REG_REQUIREMENTS.map((r,i)=>{
              const days=daysUntil(r.deadline);
              const urgency=days<90?T.red:days<180?T.amber:T.green;
              const pct=Math.min(100,Math.max(0,100-Math.floor(days/730*100)));
              return (
                <div key={r.id} style={{padding:'8px 10px',borderRadius:8,background:i%2===0?T.bg:'transparent',marginBottom:3}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:urgency,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.text}}>{r.name}</div>
                    </div>
                    <span style={{fontSize:9,color:T.navyL,padding:'1px 5px',borderRadius:3,background:T.navyL+'15'}}>{r.phase}</span>
                    <div style={{fontSize:12,fontWeight:700,color:urgency,fontFamily:T.mono,whiteSpace:'nowrap',minWidth:36,textAlign:'right'}}>{days}d</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:3,background:T.surface,borderRadius:2,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:urgency,borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:9,color:T.textMut,minWidth:60}}>{r.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Per-Company Compliance Matrix</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.font}}>
            <thead>
              <tr style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                <th style={{textAlign:'left',padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,position:'sticky',left:0,background:T.surface,minWidth:120,zIndex:2}}>Company</th>
                {REG_REQUIREMENTS.map(r=>(
                  <th key={r.id} style={{padding:'4px 3px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:500,fontSize:7,maxWidth:55,textAlign:'center',writingMode:'vertical-rl',height:85}}>{r.name}</th>
                ))}
                <th style={{padding:'6px 8px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,textAlign:'center'}}>Score</th>
              </tr>
            </thead>
            <tbody>
              {regFiltered.filter(c=>{
                if(regStatusFilter==='All')return true;
                return c.regCompliance.some(rc=>rc.status===regStatusFilter);
              }).map(c=>{
                const score=Math.round(c.regCompliance.reduce((s,r)=>s+(r.status==='compliant'?1:r.status==='partial'?0.5:0),0)/c.regCompliance.length*100);
                return (
                  <tr key={c.id} style={{borderBottom:`1px solid ${T.bg}`}}>
                    <td style={{padding:'4px 8px',fontWeight:600,color:T.text,position:'sticky',left:0,background:T.surface,fontSize:10}}>{c.name}</td>
                    {c.regCompliance.map((rc,ri)=>(
                      <td key={ri} style={{textAlign:'center',padding:2}}>
                        <div style={{width:13,height:13,borderRadius:3,margin:'0 auto',background:complianceColor(rc.status)+'25',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:7,color:complianceColor(rc.status),fontWeight:700}}>{rc.status==='compliant'?'Y':rc.status==='partial'?'P':'N'}</span>
                        </div>
                      </td>
                    ))}
                    <td style={{textAlign:'center',fontWeight:700,color:score>=70?T.green:score>=40?T.amber:T.red,fontFamily:T.mono,fontSize:11}}>{score}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Key Compliance Gaps</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {complianceByReq.filter(r=>r.nonCompliant>r.total*0.25).sort((a,b)=>b.nonCompliant-a.nonCompliant).map(r=>(
            <div key={r.id} style={{padding:12,borderRadius:8,border:`1px solid ${T.red}20`,background:T.red+'05'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600,color:T.text}}>{r.name}</span>
                <span style={{fontSize:10,color:T.red,fontWeight:700}}>{r.nonCompliant}/{r.total}</span>
              </div>
              <div style={{fontSize:10,color:T.textSec}}>{r.desc}</div>
              <div style={{fontSize:10,color:T.amber,marginTop:4}}>Deadline: {r.deadline} ({daysUntil(r.deadline)} days)</div>
              <div style={{fontSize:10,color:T.navyL,marginTop:2,fontStyle:'italic'}}>Action: Prioritize remediation for {r.nonCompliant} non-compliant entities</div>
            </div>
          ))}
        </div>
      </div>
    </div>);
  };

  /* ─── MAIN RENDER ─── */
  return (
    <div style={{padding:24,fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
          <div>
            <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>Greenwashing & Rating Integrity Detector</h1>
            <p style={{margin:'4px 0 0',fontSize:13,color:T.textSec}}>EP-AK5 | AI-powered greenwashing detection comparing self-reported vs rated ESG data</p>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{textAlign:'center',padding:'6px 12px',borderRadius:8,background:T.surface,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:17,fontWeight:800,color:T.navy,fontFamily:T.mono}}>40</div>
              <div style={{fontSize:9,color:T.textMut}}>Companies</div>
            </div>
            <div style={{textAlign:'center',padding:'6px 12px',borderRadius:8,background:T.surface,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:17,fontWeight:800,color:T.red,fontFamily:T.mono}}>{summaryStats.totalFlags}</div>
              <div style={{fontSize:9,color:T.textMut}}>Red Flags</div>
            </div>
            <div style={{textAlign:'center',padding:'6px 12px',borderRadius:8,background:T.surface,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:17,fontWeight:800,color:trafficLight(summaryStats.avgIntegrity),fontFamily:T.mono}}>{summaryStats.avgIntegrity}</div>
              <div style={{fontSize:9,color:T.textMut}}>Avg Integrity</div>
            </div>
            <div style={{textAlign:'center',padding:'6px 12px',borderRadius:8,background:T.surface,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:17,fontWeight:800,color:portfolioCompliance>=70?T.green:T.amber,fontFamily:T.mono}}>{portfolioCompliance}%</div>
              <div style={{fontSize:9,color:T.textMut}}>Compliance</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{...btn(tab===i),borderRadius:'8px 8px 0 0',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent'}}>{t}</button>
        ))}
      </div>

      {tab===0&&renderIntegrity()}
      {tab===1&&renderRedFlags()}
      {tab===2&&renderDisclosure()}
      {tab===3&&renderRegulatory()}
    </div>
  );
}
