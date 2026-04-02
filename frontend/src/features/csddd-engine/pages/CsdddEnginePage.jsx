import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SCOPE_GROUPS=['Group 1 (EU, >5000 emp, >€1.5bn)','Group 2 (EU, >3000 emp, >€900m)','Group 3 (EU, >1000 emp, >€450m)','Non-EU Group 1 (>€1.5bn EU rev)','Non-EU Group 2 (>€900m EU rev)','Non-EU Group 3 (>€450m EU rev)'];
const APPLY_DATES=['26 Jul 2027','26 Jul 2028','26 Jul 2029','26 Jul 2027','26 Jul 2028','26 Jul 2029'];
const IMPACT_CATS=['HR-01 Forced Labour','HR-02 Child Labour','HR-03 Safe Conditions','HR-04 Living Wage','HR-05 Freedom of Assoc.','HR-06 Non-Discrimination','HR-07 Privacy Rights','ENV-01 Climate Change','ENV-02 Air Pollution','ENV-03 Water Pollution','ENV-04 Soil Degradation','ENV-05 Biodiversity Loss','ENV-06 Deforestation','GOV-01 Bribery/Corruption','GOV-02 Misconduct'];
const CHAIN_TIERS=['Tier 1 — Direct Suppliers','Tier 2 — Tier 1 Suppliers','Tier 3+ — Upstream Chain','Own Operations'];
const SECTORS=['Automotive','Apparel','Electronics','Food & Beverage','Mining','Chemicals','Construction','Retail','Technology','Energy'];

const genCompanies=(n)=>Array.from({length:n},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);
  const sector=SECTORS[Math.floor(s*SECTORS.length)];
  const employees=Math.floor(s2*45000+1000);
  const turnover=+(s3*14+0.5).toFixed(1);
  const grp=employees>=5000&&turnover>=1.5?0:employees>=3000&&turnover>=0.9?1:2;
  const ddScore=Math.floor(sr(i*31+7)*60+35);
  return{id:i,name:`${['Global','Trans','Apex','Nova','Prime','Nordic','Meridian','Quantum'][Math.floor(sr(i*37+5)*8)]} ${sector} ${['Corp','AG','plc','SA','NV','SE'][Math.floor(sr(i*41+9)*6)]}`,sector,employees,turnover,grp,ddScore,
    impactsIdentified:Math.floor(sr(i*43+3)*12+1),
    impactsRemediated:Math.floor(sr(i*47+7)*8),
    grievances:Math.floor(sr(i*53+5)*20),
    climateTransition:sr(i*59+11)>0.5,
    sbtiStatus:['Committed','Target Set','No Commitment'][Math.floor(sr(i*61+3)*3)],
    country:['Germany','France','Netherlands','Spain','Italy','Sweden','Belgium','Austria','Denmark','Finland'][Math.floor(sr(i*67+7)*10)],
  };
});
const COMPANIES=genCompanies(60);

const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});
const scoreColor=(s)=>s>=70?T.green:s>=45?T.amber:T.red;

export default function CsdddEnginePage(){
  const [tab,setTab]=useState(0);
  const TABS=['Scope & Timeline','Adverse Impact Assessment','Value Chain Mapping','Climate Transition Plan'];
  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AY2</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>DIRECTIVE (EU) 2024/1760 · CSDDD · TRANSPOSITION DEADLINE: 26 JUL 2026</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>CSDDD Due Diligence Engine</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Corporate Sustainability Due Diligence — adverse impact identification, value chain mapping & climate transition plans</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<ScopeTimeline/>}
        {tab===1&&<AdverseImpactAssessment/>}
        {tab===2&&<ValueChainMapping/>}
        {tab===3&&<ClimateTransitionPlan/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: SCOPE & TIMELINE ===== */
function ScopeTimeline(){
  const [emp,setEmp]=useState(6000);
  const [rev,setRev]=useState(2.0);
  const [nonEU,setNonEU]=useState(false);
  const [euRev,setEuRev]=useState(1.8);

  const grp=useMemo(()=>{
    if(!nonEU){
      if(emp>=5000&&rev>=1.5)return{group:'Group 1',applies:'26 Jul 2027',art:'Art 2(1)(a)'};
      if(emp>=3000&&rev>=0.9)return{group:'Group 2',applies:'26 Jul 2028',art:'Art 2(1)(b)'};
      if(emp>=1000&&rev>=0.45)return{group:'Group 3',applies:'26 Jul 2029',art:'Art 2(1)(c)'};
      return null;
    }else{
      if(euRev>=1.5)return{group:'Non-EU Group 1',applies:'26 Jul 2027',art:'Art 2(2)(a)'};
      if(euRev>=0.9)return{group:'Non-EU Group 2',applies:'26 Jul 2028',art:'Art 2(2)(b)'};
      if(euRev>=0.45)return{group:'Non-EU Group 3',applies:'26 Jul 2029',art:'Art 2(2)(c)'};
      return null;
    }
  },[emp,rev,nonEU,euRev]);

  const timelineEvents=[
    {date:'13 Jul 2021',event:'EU Taxonomy Regulation fully effective',type:'related'},
    {date:'16 Jul 2024',event:'CSDDD published in Official Journal',type:'key'},
    {date:'26 Jul 2024',event:'Entry into force (20 days post-publication)',type:'key'},
    {date:'26 Jul 2026',event:'Member State transposition deadline',type:'key'},
    {date:'26 Jul 2027',event:'Group 1 companies must comply',type:'deadline'},
    {date:'26 Jul 2028',event:'Group 2 companies must comply',type:'deadline'},
    {date:'26 Jul 2029',event:'Group 3 companies + Non-EU must comply',type:'deadline'},
  ];

  const obligations=[
    {art:'Art 6',title:'Identify Actual & Potential Adverse Impacts',sub:'Own ops + subsidiaries + established business relationships'},
    {art:'Art 7',title:'Prevent Potential Adverse Impacts',sub:'Preventive action plans with suppliers — contractual cascading'},
    {art:'Art 8',title:'End Actual Adverse Impacts',sub:'Corrective action plans, monitoring, verification'},
    {art:'Art 9',title:'Remediation',sub:'Compensation, restitution, or equivalent measures'},
    {art:'Art 10',title:'Meaningful Stakeholder Engagement',sub:'Engagement with affected communities, employees, rights-holders'},
    {art:'Art 11',title:'Grievance Mechanism',sub:'Complaints procedure accessible to workers & 3rd parties'},
    {art:'Art 14',title:'Contractual Cascading',sub:'Due diligence clauses in supplier contracts'},
    {art:'Art 22',title:'Climate Transition Plan',sub:'Paris-aligned plan per Art 15 CSRD — required for Group 1+2'},
    {art:'Art 25',title:'Director Duty of Care',sub:'Board duty to consider DD obligations in strategy decisions'},
    {art:'Art 29',title:'Civil Liability',sub:'Liability for damages from failure to comply — 5yr limitation'},
    {art:'Art 30',title:'Supervisory Authority Penalties',sub:'Max 5% global net turnover — published in public register'},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'480px 1fr',gap:24,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Scope Calculator — Art 2</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:20}}>Determine if your company falls within CSDDD scope</div>
          <div style={{marginBottom:16}}>
            <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>
              <input type="checkbox" checked={nonEU} onChange={e=>setNonEU(e.target.checked)} style={{width:16,height:16}}/>
              Non-EU company
            </label>
          </div>
          {!nonEU?(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:'block',marginBottom:6}}>Number of Employees: <strong style={{color:T.navy,fontFamily:T.mono}}>{emp.toLocaleString()}</strong></label>
                <input type="range" min={500} max={50000} step={100} value={emp} onChange={e=>setEmp(+e.target.value)} style={{width:'100%'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>500</span><span>3,000</span><span>5,000</span><span>50,000</span></div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:'block',marginBottom:6}}>Net Turnover (€bn): <strong style={{color:T.navy,fontFamily:T.mono}}>€{rev}bn</strong></label>
                <input type="range" min={0.1} max={15} step={0.1} value={rev} onChange={e=>setRev(+e.target.value)} style={{width:'100%'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>€0.1bn</span><span>€0.45bn</span><span>€0.9bn</span><span>€1.5bn</span></div>
              </div>
            </div>
          ):(
            <div>
              <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:'block',marginBottom:6}}>EU-Generated Turnover (€bn): <strong style={{color:T.navy,fontFamily:T.mono}}>€{euRev}bn</strong></label>
              <input type="range" min={0.1} max={5} step={0.1} value={euRev} onChange={e=>setEuRev(+e.target.value)} style={{width:'100%'}}/>
            </div>
          )}
          <div style={{marginTop:24,padding:20,borderRadius:10,background:grp?T.navy+'0d':T.red+'0d',border:`2px solid ${grp?T.navy:T.red}30`}}>
            {grp?(
              <>
                <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:6}}>RESULT</div>
                <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{grp.group}</div>
                <div style={{fontSize:13,color:T.textSec,marginTop:4}}>Applies from: <strong style={{fontFamily:T.mono,color:T.navy}}>{grp.applies}</strong></div>
                <div style={{fontSize:12,color:T.textMut,marginTop:2}}>Legal basis: {grp.art}</div>
                <div style={{marginTop:12,...pill(T.green,'In Scope — CSDDD Obligations Apply',false)}}>In Scope — CSDDD Obligations Apply</div>
              </>
            ):(
              <>
                <div style={{fontSize:16,fontWeight:700,color:T.red}}>Out of Scope</div>
                <div style={{fontSize:13,color:T.textSec,marginTop:4}}>Company does not meet Art 2 thresholds. Monitor for future threshold reductions.</div>
              </>
            )}
          </div>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Implementation Timeline</div>
          <div style={{position:'relative',paddingLeft:24}}>
            {timelineEvents.map((ev,i)=>(
              <div key={i} style={{position:'relative',marginBottom:20,paddingLeft:20}}>
                <div style={{position:'absolute',left:-8,top:6,width:12,height:12,borderRadius:'50%',background:ev.type==='deadline'?T.red:ev.type==='key'?T.navy:T.textMut,border:`2px solid ${T.surface}`,zIndex:1}}/>
                {i<timelineEvents.length-1&&<div style={{position:'absolute',left:-3,top:18,width:2,height:28,background:T.borderL}}/>}
                <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,marginBottom:2}}>{ev.date}</div>
                <div style={{fontSize:13,fontWeight:ev.type==='deadline'?700:500,color:ev.type==='deadline'?T.red:T.text}}>{ev.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Core Obligations — Directive (EU) 2024/1760</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {obligations.map((o,i)=>(
            <div key={i} style={{padding:'14px 16px',background:T.surfaceH,borderRadius:10,border:`1px solid ${T.borderL}`}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:6}}>
                <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.gold,background:T.navy,padding:'2px 6px',borderRadius:4,flexShrink:0,marginTop:1}}>{o.art}</span>
                <span style={{fontSize:13,fontWeight:700,color:T.navy,lineHeight:1.3}}>{o.title}</span>
              </div>
              <div style={{fontSize:12,color:T.textSec}}>{o.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: ADVERSE IMPACT ASSESSMENT ===== */
function AdverseImpactAssessment(){
  const [selCat,setSelCat]=useState('All');
  const cats=['All','Human Rights','Environment','Governance'];

  const impacts=IMPACT_CATS.map((cat,ci)=>{
    const type=cat.startsWith('HR')?'Human Rights':cat.startsWith('ENV')?'Environment':'Governance';
    return{cat,type,identified:Math.floor(sr(ci*31+7)*150+10),potential:Math.floor(sr(ci*37+11)*100+5),remediated:Math.floor(sr(ci*41+5)*80+2),severity:['Low','Medium','High','Critical'][Math.floor(sr(ci*43+9)*4)],likelihood:+(sr(ci*47+3)*0.8+0.1).toFixed(2)};
  });

  const filtered=selCat==='All'?impacts:impacts.filter(i=>i.type===selCat);

  const pieData=[
    {name:'Human Rights',value:impacts.filter(i=>i.type==='Human Rights').reduce((a,i)=>a+i.identified,0)},
    {name:'Environment',value:impacts.filter(i=>i.type==='Environment').reduce((a,i)=>a+i.identified,0)},
    {name:'Governance',value:impacts.filter(i=>i.type==='Governance').reduce((a,i)=>a+i.identified,0)},
  ];

  const sevColor=(s)=>s==='Critical'?T.red:s==='High'?'#ea580c':s==='Medium'?T.amber:T.green;
  const totalIdentified=impacts.reduce((a,i)=>a+i.identified,0);
  const totalRemediated=impacts.reduce((a,i)=>a+i.remediated,0);
  const remRate=Math.round(totalRemediated/totalIdentified*100);

  const chainBreakdown=CHAIN_TIERS.map((tier,ti)=>({tier:tier.split('—')[0].trim(),actual:Math.floor(sr(ti*61+7)*200+50),potential:Math.floor(sr(ti*67+11)*150+30)}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Actual Impacts Identified',value:totalIdentified.toLocaleString(),sub:'Art 6 — in own ops & value chain',color:T.red},
          {label:'Potential Impacts',value:impacts.reduce((a,i)=>a+i.potential,0).toLocaleString(),sub:'Art 7 — preventive action required',color:T.amber},
          {label:'Remediated',value:totalRemediated.toLocaleString(),sub:'Art 8-9 completed',color:T.green},
          {label:'Remediation Rate',value:remRate+'%',sub:'Actual impacts closed out',color:scoreColor(remRate)},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Adverse Impacts by Chain Tier</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Art 6 — distribution of actual and potential impacts across value chain</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chainBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="tier" style={{fontSize:11}}/>
              <YAxis style={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="actual" name="Actual" fill={T.red} radius={[4,4,0,0]}/>
              <Bar dataKey="potential" name="Potential" fill={T.amber} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>By Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name})=>name.split(' ')[0]}>
                {[T.red,T.green,T.purple].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setSelCat(c)} style={{padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:selCat===c?700:500,background:selCat===c?T.navy:'transparent',color:selCat===c?'#fff':T.textSec}}>
              {c}
            </button>
          ))}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Impact Category','Type','Actual','Potential','Remediated','Severity','Likelihood','Status'].map(h=>(
                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((imp,i)=>{
              const remPct=Math.round(imp.remediated/imp.identified*100);
              return(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'10px 12px',fontWeight:600,color:T.navy,fontSize:12}}>{imp.cat}</td>
                  <td style={{padding:'10px 12px'}}><span style={pill(imp.type==='Human Rights'?T.red:imp.type==='Environment'?T.green:T.purple,imp.type,true)}>{imp.type.split(' ')[0]}</span></td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,fontWeight:700,color:T.red}}>{imp.identified}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:T.amber}}>{imp.potential}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:T.green}}>{imp.remediated}</td>
                  <td style={{padding:'10px 12px'}}><span style={pill(sevColor(imp.severity),imp.severity,true)}>{imp.severity}</span></td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:imp.likelihood>0.6?T.red:imp.likelihood>0.3?T.amber:T.green}}>{(imp.likelihood*100).toFixed(0)}%</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,fontSize:11,color:scoreColor(remPct)}}>{remPct}% closed</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== TAB 3: VALUE CHAIN MAPPING ===== */
function ValueChainMapping(){
  const [selSector,setSelSector]=useState('All');
  const [search,setSearch]=useState('');

  const filtered=useMemo(()=>COMPANIES.filter(c=>{
    if(selSector!=='All'&&c.sector!==selSector)return false;
    if(search&&!c.name.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }),[selSector,search]);

  const estabRelTypes=['Direct Suppliers','Franchisees','Joint Venture Partners','Sub-contractors','Licensed Producers','Distributors'];
  const relData=estabRelTypes.map((rt,i)=>({type:rt,count:Math.floor(sr(i*31+7)*500+50),mapped:Math.floor(sr(i*37+11)*80+15)}));

  const sectorRisk=SECTORS.map((sec,i)=>({sector:sec,riskScore:Math.floor(sr(i*41+5)*70+20),impactDensity:+(sr(i*43+9)*3+0.5).toFixed(1),suppliers:Math.floor(sr(i*47+3)*200+20)}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Established Business Relationships — Art 3(g)</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Entities with whom company has direct/indirect relationships in its business operations or value chain</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Relationship Type','Count','Mapped %'].map(h=>(
                  <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relData.map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'9px 10px',fontWeight:500,color:T.text,fontSize:12}}>{r.type}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{r.count.toLocaleString()}</td>
                  <td style={{padding:'9px 10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:6,background:T.borderL,borderRadius:3,overflow:'hidden'}}>
                        <div style={{width:r.mapped+'%',height:'100%',background:scoreColor(r.mapped),borderRadius:3}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:11,color:scoreColor(r.mapped),minWidth:28}}>{r.mapped}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Sector Risk Profile</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorRisk} layout="vertical" margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,100]} style={{fontSize:10}}/>
              <YAxis type="category" dataKey="sector" width={90} style={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="riskScore" name="Risk Score" radius={[0,4,4,0]}>
                {sectorRisk.map((e,i)=><Cell key={i} fill={scoreColor(100-e.riskScore)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginRight:4}}>In-Scope Company Portfolio</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company…" style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,width:200,fontFamily:T.font}}/>
          <select value={selSector} onChange={e=>setSelSector(e.target.value)} style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s=><option key={s}>{s}</option>)}
          </select>
          <span style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Company','Sector','Country','Group','Applies','Employees','Turnover','DD Score','Impacts','Grievances','Climate Plan'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,20).map(c=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'9px 10px',fontWeight:600,color:T.navy}}>{c.name}</td>
                  <td style={{padding:'9px 10px',color:T.textSec,fontSize:11}}>{c.sector}</td>
                  <td style={{padding:'9px 10px',color:T.textSec,fontSize:11}}>{c.country}</td>
                  <td style={{padding:'9px 10px'}}><span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:T.gold,background:T.navy,padding:'1px 6px',borderRadius:4}}>G{c.grp+1}</span></td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{APPLY_DATES[c.grp]}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11}}>{c.employees.toLocaleString()}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11}}>€{c.turnover}bn</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontWeight:700,color:scoreColor(c.ddScore)}}>{c.ddScore}%</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,color:T.red}}>{c.impactsIdentified}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,color:T.amber}}>{c.grievances}</td>
                  <td style={{padding:'9px 10px',textAlign:'center',fontSize:13}}>{c.climateTransition?<span style={pill(T.green,'✓ Yes',true)}>✓</span>:<span style={pill(T.red,'✗ No',true)}>✗</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 4: CLIMATE TRANSITION PLAN ===== */
function ClimateTransitionPlan(){
  const [selCompany,setSelCompany]=useState(COMPANIES[0]);
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({target:'2050',interim:'50',pathway:'IEA NZE 2050',capex:'2.5',scope:'Scope 1+2+3'});

  const roadmapYears=[2025,2027,2029,2031,2033,2035,2040,2045,2050];
  const pathwayData=roadmapYears.map((yr,i)=>({year:String(yr),baseline:100,target:Math.round(100*(1-Math.pow((yr-2024)/26,0.7))),company:Math.round(100*(1-sr(selCompany.id*31+i*7)*Math.pow((yr-2024)/26,0.6)))}));

  const art22Elements=[
    {title:'Paris-Aligned Target',desc:'1.5°C consistent net-zero by 2050 with interim milestones',required:true,completed:selCompany.climateTransition},
    {title:'Scope 1, 2 & 3 Coverage',desc:'All GHG emissions including material value chain',required:true,completed:sr(selCompany.id*37+5)>0.4},
    {title:'CapEx Alignment Plan',desc:'Forward-looking CapEx consistent with transition pathway',required:true,completed:sr(selCompany.id*41+9)>0.5},
    {title:'Decarbonisation Actions',desc:'Specific measures per sector, geography, and time horizon',required:true,completed:sr(selCompany.id*43+11)>0.45},
    {title:'Board Oversight',desc:'Director accountability for climate plan (Art 25)',required:true,completed:sr(selCompany.id*47+3)>0.55},
    {title:'Annual Review',desc:'Update plan at least every 12 months — CSRD ESRS E1 alignment',required:true,completed:sr(selCompany.id*53+7)>0.5},
    {title:'SBTi Validation',desc:'Science-based targets institute validation (recommended)',required:false,completed:selCompany.sbtiStatus==='Target Set'},
    {title:'GFANZ Sector Pathway',desc:'Alignment with GFANZ sector-specific decarbonisation pathways',required:false,completed:sr(selCompany.id*59+13)>0.6},
  ];

  const completedRequired=art22Elements.filter(e=>e.required&&e.completed).length;
  const totalRequired=art22Elements.filter(e=>e.required).length;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Select Company</div>
          <select value={selCompany.id} onChange={e=>setSelCompany(COMPANIES.find(c=>c.id===+e.target.value))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,marginBottom:16}}>
            {COMPANIES.slice(0,30).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {label:'Sector',value:selCompany.sector},
              {label:'Group',value:`Group ${selCompany.grp+1}`},
              {label:'Applies',value:APPLY_DATES[selCompany.grp]},
              {label:'Employees',value:selCompany.employees.toLocaleString()},
              {label:'Turnover',value:`€${selCompany.turnover}bn`},
              {label:'SBTi Status',value:selCompany.sbtiStatus},
              {label:'Art 22 Completion',value:`${completedRequired}/${totalRequired} required`,color:scoreColor(completedRequired/totalRequired*100)},
            ].map((f,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',background:T.surfaceH,borderRadius:6}}>
                <span style={{fontSize:11,color:T.textMut,fontWeight:600}}>{f.label}</span>
                <span style={{fontSize:12,fontWeight:700,color:f.color||T.navy,fontFamily:T.mono}}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Emission Reduction Pathway (vs Baseline)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pathwayData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" style={{fontSize:11}}/>
                <YAxis tickFormatter={v=>v+'%'} style={{fontSize:11}}/>
                <Tooltip formatter={v=>v+'%'}/>
                <Legend/>
                <Line type="monotone" dataKey="target" name="IEA NZE Target" stroke={T.green} strokeDasharray="4 4" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="company" name="Company Plan" stroke={T.navy} strokeWidth={2} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Art 22 — Climate Plan Checklist</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Required elements for Paris-aligned transition plan</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {art22Elements.map((el,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 14px',background:el.completed?T.green+'08':T.red+'08',borderRadius:8,border:`1px solid ${el.completed?T.green:T.red}20`}}>
                  <span style={{fontSize:16,color:el.completed?T.green:T.red,flexShrink:0}}>{el.completed?'✓':'✗'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{el.title}</div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{el.desc}</div>
                  </div>
                  <span style={pill(el.required?T.navy:T.textMut,el.required?'Required':'Optional',true)}>{el.required?'Required':'Optional'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
