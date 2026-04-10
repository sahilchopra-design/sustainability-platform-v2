import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COMMODITIES=['Cattle','Cocoa','Coffee','Oil Palm','Rubber','Soya','Wood'];
const COMMODITY_COLORS=['#dc2626','#d97706','#16a34a','#0891b2','#7c3aed','#c5a96a','#5a8a6a'];
const COUNTRIES_HIGH=['Brazil','Indonesia','Malaysia','Democratic Republic of Congo','Ivory Coast','Bolivia','Paraguay','Cameroon'];
const COUNTRIES_STD=['Colombia','Peru','Ghana','Nigeria','Papua New Guinea','Vietnam','Laos','Mexico'];
const COUNTRIES_LOW=['Germany','France','Netherlands','United States','Australia','Canada','New Zealand','Japan'];
const TIERS=['High Risk','Standard Risk','Low Risk'];
const TIER_COLORS=['#dc2626','#d97706','#16a34a'];
const EVIDENCE_TYPES=['Geolocation Polygon','Satellite Imagery','Certification (FSC/RSPO/RFA)','Government Land Registry','Third-Party Audit Report','Supplier Declaration','Chain of Custody Certificate','GPS Track Record'];
const ARTICLES=['Art 4-5: Operator Obligations','Art 6: Information Requirements','Art 9: Geolocation Data','Art 10: Risk Assessment','Art 11: Risk Mitigation','Art 12: Simplified DD','Art 4(2): DDS Statement','Art 29: Benchmarking'];

const genSuppliers=(n)=>Array.from({length:n},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);const s4=sr(i*29+17);
  const commodity=COMMODITIES[Math.floor(s*COMMODITIES.length)];
  const allCountries=[...COUNTRIES_HIGH,...COUNTRIES_STD,...COUNTRIES_LOW];
  const country=allCountries[Math.floor(s2*allCountries.length)];
  const isHigh=COUNTRIES_HIGH.includes(country);const isLow=COUNTRIES_LOW.includes(country);
  const tier=isHigh?'High Risk':isLow?'Low Risk':'Standard Risk';
  const score=isHigh?Math.floor(sr(i*31+5)*30+10):isLow?Math.floor(sr(i*37+9)*20+75):Math.floor(sr(i*41+13)*30+40);
  const articles=ARTICLES.filter((_,ai)=>sr(i*43+ai*7)>0.35);
  return{id:i,name:`Supplier ${String.fromCharCode(65+Math.floor(s3*26))}${String.fromCharCode(65+Math.floor(s4*26))}-${(i+101)}`,commodity,country,tier,score,
    volume:Math.floor(sr(i*47+3)*9000+1000),
    geoVerified:sr(i*53+7)>0.4,
    certified:sr(i*59+11)>0.5,
    lastDDS:`2025-${String(Math.floor(sr(i*61+5)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(i*67+9)*28)+1).padStart(2,'0')}`,
    articles,
    gaps:Math.floor(sr(i*71+3)*5),
    evidenceCount:Math.floor(sr(i*73+7)*6+1),
  };
});

const SUPPLIERS=genSuppliers(80);

const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});
const tierColor=(t)=>t==='High Risk'?T.red:t==='Low Risk'?T.green:T.amber;
const scoreColor=(s)=>s>=70?T.green:s>=40?T.amber:T.red;

export default function EudrEnginePage(){
  const [tab,setTab]=useState(0);
  const TABS=['Due Diligence Assessment','Commodity Screener','Country Benchmarking','Traceability & Statements'];
  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AY1</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>REGULATION (EU) 2023/1115 · ENFORCEMENT: 30 DEC 2025</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>EUDR Due Diligence Engine</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>EU Deforestation Regulation compliance — supply chain traceability, country benchmarking & due diligence statements</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<DueDiligenceAssessment/>}
        {tab===1&&<CommodityScreener/>}
        {tab===2&&<CountryBenchmarking/>}
        {tab===3&&<TraceabilityStatements/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: DUE DILIGENCE ASSESSMENT ===== */
function DueDiligenceAssessment(){
  const [search,setSearch]=useState('');
  const [filterTier,setFilterTier]=useState('All');
  const [filterCommodity,setFilterCommodity]=useState('All');
  const [selected,setSelected]=useState(null);

  const filtered=useMemo(()=>SUPPLIERS.filter(s=>{
    if(filterTier!=='All'&&s.tier!==filterTier)return false;
    if(filterCommodity!=='All'&&s.commodity!==filterCommodity)return false;
    if(search&&!s.name.toLowerCase().includes(search.toLowerCase())&&!s.country.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }),[search,filterTier,filterCommodity]);

  const totals={high:SUPPLIERS.filter(s=>s.tier==='High Risk').length,std:SUPPLIERS.filter(s=>s.tier==='Standard Risk').length,low:SUPPLIERS.filter(s=>s.tier==='Low Risk').length};
  const avgScore=Math.round(SUPPLIERS.reduce((a,s)=>a+s.score,0)/ Math.max(1, SUPPLIERS.length));
  const compliant=SUPPLIERS.filter(s=>s.score>=70).length;

  const articleCoverage=ARTICLES.map((art,ai)=>({name:art.split(':')[0],covered:SUPPLIERS.filter(s=>s.articles.includes(art)).length,pct:Math.round(SUPPLIERS.filter(s=>s.articles.includes(art)).length/ Math.max(1, SUPPLIERS.length)*100)}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Suppliers',value:SUPPLIERS.length,sub:'Assessed under EUDR'},
          {label:'High Risk',value:totals.high,sub:'Country benchmark Tier 1',color:T.red},
          {label:'Standard Risk',value:totals.std,sub:'Country benchmark Tier 2',color:T.amber},
          {label:'Low Risk',value:totals.low,sub:'Country benchmark Tier 3',color:T.green},
          {label:'Avg DD Score',value:avgScore+'%',sub:`${compliant} compliant (≥70%)`,color:scoreColor(avgScore)},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Article Coverage Across Suppliers</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={articleCoverage} layout="vertical" margin={{left:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,100]} tickFormatter={v=>v+'%'} style={{fontSize:11}}/>
              <YAxis type="category" dataKey="name" width={80} style={{fontSize:10}}/>
              <Tooltip formatter={(v)=>v+'%'}/>
              <Bar dataKey="pct" fill={T.navy} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Supplier Tier Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{name:'High',value:totals.high},{name:'Standard',value:totals.std},{name:'Low',value:totals.low}]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {[T.red,T.amber,T.green].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search supplier / country…" style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,width:220,fontFamily:T.font}}/>
          <select value={filterTier} onChange={e=>setFilterTier(e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}>
            <option value="All">All Tiers</option>
            {TIERS.map(t=><option key={t}>{t}</option>)}
          </select>
          <select value={filterCommodity} onChange={e=>setFilterCommodity(e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}>
            <option value="All">All Commodities</option>
            {COMMODITIES.map(c=><option key={c}>{c}</option>)}
          </select>
          <span style={{marginLeft:'auto',fontSize:12,color:T.textMut,fontFamily:T.mono}}>{filtered.length} / {SUPPLIERS.length} suppliers</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Supplier','Commodity','Country','Tier','DD Score','Geo Verified','Certified','Gaps','Last DDS'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,20).map(s=>(
                <tr key={s.id} onClick={()=>setSelected(selected?.id===s.id?null:s)} style={{borderBottom:`1px solid ${T.borderL}`,cursor:'pointer',background:selected?.id===s.id?T.surfaceH:'transparent',transition:'background 0.15s'}}>
                  <td style={{padding:'10px 12px',fontWeight:600,color:T.navy,fontFamily:T.mono,fontSize:12}}>{s.name}</td>
                  <td style={{padding:'10px 12px'}}><span style={pill(COMMODITY_COLORS[COMMODITIES.indexOf(s.commodity)],s.commodity,true)}>{s.commodity}</span></td>
                  <td style={{padding:'10px 12px',color:T.textSec}}>{s.country}</td>
                  <td style={{padding:'10px 12px'}}><span style={pill(tierColor(s.tier),s.tier,true)}>{s.tier}</span></td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,fontWeight:700,color:scoreColor(s.score)}}>{s.score}%</td>
                  <td style={{padding:'10px 12px',textAlign:'center',fontSize:16}}>{s.geoVerified?'✓':'✗'}</td>
                  <td style={{padding:'10px 12px',textAlign:'center',fontSize:16}}>{s.certified?'✓':'✗'}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:s.gaps>2?T.red:s.gaps>0?T.amber:T.green}}>{s.gaps}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{s.lastDDS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected&&(
          <div style={{marginTop:20,padding:20,background:T.surfaceH,borderRadius:10,border:`1px solid ${T.border}`}}>
            <div style={{fontWeight:700,color:T.navy,marginBottom:12}}>{selected.name} — Article Coverage Detail</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {ARTICLES.map((art,ai)=>(
                <span key={ai} style={pill(selected.articles.includes(art)?T.green:T.red,art.split(':')[0],true)}>
                  {art.split(':')[0]}
                </span>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:16}}>
              {[
                {label:'Volume (tonnes/yr)',value:selected.volume.toLocaleString()},
                {label:'Evidence Documents',value:selected.evidenceCount},
                {label:'Articles Covered',value:`${selected.articles.length} / ${ARTICLES.length}`},
                {label:'Open Gaps',value:selected.gaps,color:selected.gaps>2?T.red:selected.gaps>0?T.amber:T.green},
              ].map((f,i)=>(
                <div key={i} style={{background:T.surface,borderRadius:8,padding:'12px 16px',border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:4}}>{f.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:f.color||T.navy,fontFamily:T.mono}}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== TAB 2: COMMODITY SCREENER ===== */
function CommodityScreener(){
  const [selCom,setSelCom]=useState('Cocoa');

  const comData=COMMODITIES.map((com,ci)=>{
    const sups=SUPPLIERS.filter(s=>s.commodity===com);
    const avgScore=sups.length?Math.round(sups.reduce((a,s)=>a+s.score,0)/sups.length):0;
    const highRisk=sups.filter(s=>s.tier==='High Risk').length;
    return{name:com,suppliers:sups.length,avgScore,highRisk,color:COMMODITY_COLORS[ci],volume:sups.reduce((a,s)=>a+s.volume,0)};
  });

  const HS_CODES={
    Cattle:['0102 — Live cattle','0201 — Fresh beef','0202 — Frozen beef','4101 — Bovine hides','4104 — Tanned bovine leather','4107 — Prepared leather'],
    Cocoa:['1801 — Cocoa beans','1802 — Cocoa shells','1803 — Cocoa paste','1804 — Cocoa butter','1805 — Cocoa powder','1806 — Chocolate preparations'],
    Coffee:['0901 — Coffee (raw/roasted)','2101 — Extracts & essences'],
    'Oil Palm':['1207 — Palm fruit','1511 — Palm oil','1513 — Kernel oil','3823 — Industrial fatty acids','3826 — Biodiesel'],
    Rubber:['4001 — Natural rubber','4005 — Compounded rubber','4011 — Pneumatic tyres','4012 — Retreaded tyres'],
    Soya:['1201 — Soybeans','1208 — Soy flour','1507 — Soybean oil','2304 — Soy meal'],
    Wood:['4403 — Wood in rough','4407 — Sawn timber','4412 — Plywood','9401 — Seats (wood)','9403 — Furniture (wood)'],
  };

  const certSchemes={
    Cattle:['GRS — Global Recycled Standard','GFSP — Global Food Safety Protocol','Rainforest Alliance'],
    Cocoa:['UTZ Certified','Rainforest Alliance','Fairtrade','RSPO (indirect)'],
    Coffee:['Rainforest Alliance','UTZ','Fairtrade','4C Association'],
    'Oil Palm':['RSPO — Roundtable on Sustainable Palm Oil','MSPO (Malaysia)','ISPO (Indonesia)','POIG'],
    Rubber:['FSC','GFTN','Proforest RSRA'],
    Soya:['RTRS — Round Table on Responsible Soy','ProTerra','FEFAC Soy Sourcing Guidelines'],
    Wood:['FSC — Forest Stewardship Council','PEFC','SFI (North America)'],
  };

  const selData=comData.find(c=>c.name===selCom);
  const qTrend=Array.from({length:8},(_,i)=>({q:`Q${(i%4)+1}-${2023+Math.floor(i/4)}`,score:Math.floor(sr(COMMODITIES.indexOf(selCom)*31+i*7)*30+55)}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:12,marginBottom:24}}>
        {COMMODITIES.map((com,ci)=>(
          <div key={com} onClick={()=>setSelCom(com)} style={{background:selCom===com?T.navy:T.surface,border:`2px solid ${selCom===com?T.gold:T.border}`,borderRadius:12,padding:'14px 12px',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}}>
            <div style={{width:12,height:12,borderRadius:'50%',background:COMMODITY_COLORS[ci],margin:'0 auto 8px'}}/>
            <div style={{fontSize:12,fontWeight:700,color:selCom===com?'#fff':T.navy}}>{com}</div>
            <div style={{fontSize:10,color:selCom===com?T.gold:T.textMut,marginTop:2}}>{comData[ci].suppliers} suppliers</div>
          </div>
        ))}
      </div>

      {selData&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
            {[
              {label:'Suppliers',value:selData.suppliers},
              {label:'Avg DD Score',value:selData.avgScore+'%',color:scoreColor(selData.avgScore)},
              {label:'High-Risk Tier',value:selData.highRisk,color:selData.highRisk>3?T.red:T.amber},
              {label:'Annual Volume (t)',value:(selData.volume/1000).toFixed(1)+'k'},
            ].map((k,i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px'}}>
                <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:k.color||T.navy,fontFamily:T.mono}}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>HS / CN Code Coverage — Annex I</div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:14}}>Regulation (EU) 2023/1115 Annex I scope verification</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {(HS_CODES[selCom]||[]).map((code,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:T.surfaceH,borderRadius:8}}>
                    <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,minWidth:52}}>{code.split(' ')[0]}</span>
                    <span style={{fontSize:12,color:T.textSec}}>{code.split('—')[1]?.trim()}</span>
                    <span style={{marginLeft:'auto',...pill(T.green,'In Scope',true)}}>In Scope</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Accepted Certification Schemes</div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:14}}>Art 10 risk mitigation — recognised certification bodies</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {(certSchemes[selCom]||[]).map((cert,i)=>(
                  <div key={i} style={{padding:'10px 14px',background:T.surfaceH,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:13,color:T.text,fontWeight:500}}>{cert}</span>
                    <span style={pill(sr(i*71+COMMODITIES.indexOf(selCom)*13)>0.3?T.green:T.amber,sr(i*71+COMMODITIES.indexOf(selCom)*13)>0.3?'Recognised':'Pending',true)}>{sr(i*71+COMMODITIES.indexOf(selCom)*13)>0.3?'Recognised':'Pending'}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,padding:'12px 14px',background:T.navy+'0a',borderRadius:8,borderLeft:`3px solid ${T.gold}`}}>
                <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:3}}>Deforestation Cut-off Date</div>
                <div style={{fontSize:13,fontFamily:T.mono,color:T.navy,fontWeight:700}}>31 December 2020</div>
                <div style={{fontSize:11,color:T.textSec}}>Production on land deforested after this date is non-compliant</div>
              </div>
            </div>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>DD Score Trend — {selCom} Suppliers</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={qTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="q" style={{fontSize:11}}/>
                <YAxis domain={[30,100]} tickFormatter={v=>v+'%'} style={{fontSize:11}}/>
                <Tooltip formatter={v=>v+'%'}/>
                <Area type="monotone" dataKey="score" stroke={T.navy} fill={T.gold+'30'} strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== TAB 3: COUNTRY BENCHMARKING ===== */
function CountryBenchmarking(){
  const countries=[
    ...COUNTRIES_HIGH.map((c,i)=>({name:c,tier:'High Risk',tierId:1,gdpForest:Math.floor(sr(i*31+7)*15+5),deforestRate:+(sr(i*37+11)*3+0.5).toFixed(2),govScore:Math.floor(sr(i*41+3)*30+20),complianceDeadline:'30 Jun 2026 (SME) / 30 Dec 2025 (Large)',simplifiedDD:false})),
    ...COUNTRIES_STD.map((c,i)=>({name:c,tier:'Standard Risk',tierId:2,gdpForest:Math.floor(sr(i*43+17)*10+3),deforestRate:+(sr(i*47+13)*1.5+0.2).toFixed(2),govScore:Math.floor(sr(i*53+7)*25+40),complianceDeadline:'30 Jun 2026 (SME) / 30 Dec 2025 (Large)',simplifiedDD:false})),
    ...COUNTRIES_LOW.map((c,i)=>({name:c,tier:'Low Risk',tierId:3,gdpForest:Math.floor(sr(i*59+19)*5+1),deforestRate:+(sr(i*61+5)*0.3+0.01).toFixed(2),govScore:Math.floor(sr(i*67+11)*20+70),complianceDeadline:'30 Jun 2026 (SME) / 30 Dec 2025 (Large)',simplifiedDD:true})),
  ];

  const radarData=TIERS.map((tier,ti)=>{
    const grp=countries.filter(c=>c.tier===tier);
    return{tier,deforestation:Math.floor(sr(ti*31+7)*60+20),governance:Math.floor(sr(ti*37+11)*60+20),supplyChain:Math.floor(sr(ti*41+5)*60+20),enforcement:Math.floor(sr(ti*43+9)*60+20),certCoverage:Math.floor(sr(ti*47+3)*60+20)};
  });

  const barData=countries.map(c=>({name:c.name,govScore:c.govScore,tier:c.tier,deforestRate:+(c.deforestRate*100).toFixed(1)}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {TIERS.map((tier,ti)=>(
          <div key={tier} style={{background:T.surface,border:`2px solid ${tierColor(tier)}30`,borderRadius:12,padding:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <span style={{width:14,height:14,borderRadius:'50%',background:tierColor(tier),display:'inline-block'}}/>
              <span style={{fontWeight:700,color:T.navy}}>{tier}</span>
              <span style={{marginLeft:'auto',fontFamily:T.mono,fontSize:13,color:T.textMut}}>Art 29 Tier {ti+1}</span>
            </div>
            <div style={{fontSize:26,fontWeight:700,color:tierColor(tier),fontFamily:T.mono,marginBottom:6}}>
              {tier==='High Risk'?COUNTRIES_HIGH.length:tier==='Low Risk'?COUNTRIES_LOW.length:COUNTRIES_STD.length} countries
            </div>
            <div style={{fontSize:12,color:T.textSec}}>
              {tier==='High Risk'?'Full due diligence + geolocation required':tier==='Low Risk'?'Simplified DD — Art 12 eligible':'Standard due diligence obligations'}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 420px',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Governance Score by Country (Art 29 Indicators)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical" margin={{left:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,100]} style={{fontSize:10}}/>
              <YAxis type="category" dataKey="name" width={100} style={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="govScore" radius={[0,4,4,0]}>
                {barData.map((entry,i)=><Cell key={i} fill={tierColor(entry.tier)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Risk Profile by Tier (Radar)</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={[
              {subject:'Deforestation',High:78,Standard:45,Low:12},
              {subject:'Governance',High:28,Standard:55,Low:82},
              {subject:'Supply Chain',High:72,Standard:50,Low:18},
              {subject:'Enforcement',High:32,Standard:58,Low:88},
              {subject:'Cert Coverage',High:25,Standard:48,Low:85},
            ]}>
              <PolarGrid stroke={T.borderL}/>
              <PolarAngleAxis dataKey="subject" style={{fontSize:11}}/>
              <PolarRadiusAxis domain={[0,100]} style={{fontSize:9}}/>
              <Radar name="High Risk" dataKey="High" stroke={T.red} fill={T.red} fillOpacity={0.2}/>
              <Radar name="Standard" dataKey="Standard" stroke={T.amber} fill={T.amber} fillOpacity={0.2}/>
              <Radar name="Low Risk" dataKey="Low" stroke={T.green} fill={T.green} fillOpacity={0.2}/>
              <Legend/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Country Benchmark Registry (Art 29 · Commission Implementing Reg. EU 2025/1093)</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Country','Tier','Deforest Rate','Gov Score','Simplified DD','Compliance Deadline'].map(h=>(
                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((c,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'9px 12px',fontWeight:600,color:T.navy}}>{c.name}</td>
                <td style={{padding:'9px 12px'}}><span style={pill(tierColor(c.tier),c.tier,true)}>{c.tier}</span></td>
                <td style={{padding:'9px 12px',fontFamily:T.mono,color:c.deforestRate>1?T.red:c.deforestRate>0.3?T.amber:T.green}}>{c.deforestRate}%/yr</td>
                <td style={{padding:'9px 12px',fontFamily:T.mono,fontWeight:700,color:scoreColor(c.govScore)}}>{c.govScore}</td>
                <td style={{padding:'9px 12px',textAlign:'center'}}>{c.simplifiedDD?<span style={pill(T.green,'Yes',true)}>Yes</span>:<span style={pill(T.red,'No',true)}>No</span>}</td>
                <td style={{padding:'9px 12px',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{c.complianceDeadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== TAB 4: TRACEABILITY & STATEMENTS ===== */
function TraceabilityStatements(){
  const [genDDS,setGenDDS]=useState(false);
  const [selSupplier,setSelSupplier]=useState(SUPPLIERS[0]);

  const geoPlots=Array.from({length:12},(_,i)=>({
    id:`GEO-${1000+i}`,
    supplier:SUPPLIERS[i].name,
    commodity:SUPPLIERS[i].commodity,
    country:SUPPLIERS[i].country,
    lat:+(sr(i*31+7)*40-20).toFixed(4),
    lng:+(sr(i*37+11)*60-30).toFixed(4),
    areaha:Math.floor(sr(i*41+5)*5000+100),
    verified:sr(i*43+9)>0.4,
    satellite:sr(i*47+3)>0.5,
    lastCheck:`2025-${String(Math.floor(sr(i*53+7)*12)+1).padStart(2,'0')}-15`,
  }));

  const evidenceItems=EVIDENCE_TYPES.map((et,i)=>({type:et,count:Math.floor(sr(i*61+13)*120+10),pct:Math.floor(sr(i*67+7)*80+10)}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Art 9 Geolocation — Plot Registry</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Polygon/point coordinates for all supplier land plots</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Plot ID','Commodity','Country','Area (ha)','Satellite','Verified'].map(h=>(
                  <th key={h} style={{padding:'6px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {geoPlots.map(p=>(
                <tr key={p.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{p.id}</td>
                  <td style={{padding:'8px 10px'}}><span style={pill(COMMODITY_COLORS[COMMODITIES.indexOf(p.commodity)],p.commodity,true)}>{p.commodity}</span></td>
                  <td style={{padding:'8px 10px',fontSize:11,color:T.textSec}}>{p.country}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:11}}>{p.areaha.toLocaleString()}</td>
                  <td style={{padding:'8px 10px',textAlign:'center'}}>{p.satellite?'🛰️':'—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',fontSize:14,color:p.verified?T.green:T.red}}>{p.verified?'✓':'✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Evidence Repository — Document Coverage</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={evidenceItems} layout="vertical" margin={{left:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,100]} tickFormatter={v=>v+'%'} style={{fontSize:10}}/>
              <YAxis type="category" dataKey="type" width={160} style={{fontSize:9}}/>
              <Tooltip formatter={v=>v+'%'}/>
              <Bar dataKey="pct" fill={T.gold} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:16,padding:'12px 14px',background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${T.navy}`}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:2}}>Art 4(2) — Due Diligence Statement</div>
            <div style={{fontSize:12,color:T.textSec}}>Required before placing/making available on EU market. Must reference all geolocation data, risk assessment, and mitigation measures.</div>
          </div>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Generate Due Diligence Statement (DDS)</div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Art 4(2) — automated DDS generation for selected supplier</div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={selSupplier.id} onChange={e=>setSelSupplier(SUPPLIERS.find(s=>s.id===+e.target.value))} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,width:260}}>
            {SUPPLIERS.slice(0,20).map(s=><option key={s.id} value={s.id}>{s.name} — {s.commodity}</option>)}
          </select>
          <button onClick={()=>setGenDDS(true)} style={{padding:'9px 22px',borderRadius:8,background:T.navy,color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700}}>Generate DDS</button>
          {genDDS&&<span style={pill(T.green,'DDS Generated',false)}>DDS Generated</span>}
        </div>

        {genDDS&&selSupplier&&(
          <div style={{background:T.surfaceH,borderRadius:10,padding:20,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:12}}>
            <div style={{fontWeight:700,color:T.navy,marginBottom:12,fontSize:14,fontFamily:T.font}}>DUE DILIGENCE STATEMENT — Art 4(2) EUDR</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {[
                {label:'Statement Reference',value:`DDS-${new Date().getFullYear()}-${String(selSupplier.id+1000).padStart(5,'0')}`},
                {label:'Operator',value:'[Company Name] — Registered EU Operator'},
                {label:'Commodity',value:selSupplier.commodity},
                {label:'Country of Production',value:selSupplier.country},
                {label:'Supplier',value:selSupplier.name},
                {label:'Country Risk Tier',value:selSupplier.tier},
                {label:'Regulation Reference',value:'Reg. (EU) 2023/1115'},
                {label:'Submission Date',value:new Date().toISOString().split('T')[0]},
                {label:'Geo Coordinates Attached',value:selSupplier.geoVerified?'Yes — polygon data on file':'No — pending verification'},
                {label:'Risk Assessment Outcome',value:selSupplier.score>=70?'No / Negligible Risk':'Risk Identified — Mitigation Applied'},
                {label:'Certifications',value:selSupplier.certified?'Yes — see Annex I':'None — enhanced DD applied'},
                {label:'DD Score',value:selSupplier.score+'% ('+( selSupplier.score>=70?'Compliant':'Action Required')+')'},
              ].map((f,i)=>(
                <div key={i} style={{padding:'8px 12px',background:T.surface,borderRadius:6,border:`1px solid ${T.borderL}`}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.textMut,marginBottom:2,letterSpacing:0.5,textTransform:'uppercase',fontFamily:T.font}}>{f.label}</div>
                  <div style={{color:T.text}}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,padding:'10px 14px',background:T.navy,borderRadius:8,color:'#fff',fontSize:11,fontFamily:T.font}}>
              This statement is generated in accordance with Art 4(2) of Regulation (EU) 2023/1115. The operator confirms that the relevant commodity/product is deforestation-free and has been produced in accordance with applicable legislation. Reference: Commission Implementing Regulation (EU) 2025/1093.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
