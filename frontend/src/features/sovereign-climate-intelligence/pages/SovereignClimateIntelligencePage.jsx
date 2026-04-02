import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,ScatterChart,Scatter,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,LineChart,Line,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0e7490',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// Sovereign profiles — sourced from engine reference data
const SOVEREIGNS=[
  {iso:'US',name:'United States',region:'North America',physRisk:4.5,transReady:6.0,fiscRes:7.5,ndcAmb:5.0,ndGain:73.0,rating:'AA+',gdp:25462,debtGdp:123,color:'#1e3a5f'},
  {iso:'GB',name:'United Kingdom',region:'Europe',physRisk:3.5,transReady:7.5,fiscRes:7.0,ndcAmb:7.0,ndGain:75.0,rating:'AA',gdp:3070,debtGdp:101,color:'#1e3a8a'},
  {iso:'DE',name:'Germany',region:'Europe',physRisk:3.5,transReady:7.5,fiscRes:8.0,ndcAmb:7.5,ndGain:76.0,rating:'AAA',gdp:4082,debtGdp:66,color:'#1d4ed8'},
  {iso:'FR',name:'France',region:'Europe',physRisk:4.0,transReady:7.0,fiscRes:6.5,ndcAmb:7.0,ndGain:73.0,rating:'AA',gdp:2780,debtGdp:112,color:'#2563eb'},
  {iso:'JP',name:'Japan',region:'Asia Pacific',physRisk:6.0,transReady:6.5,fiscRes:5.5,ndcAmb:6.0,ndGain:72.0,rating:'A+',gdp:4231,debtGdp:260,color:'#dc2626'},
  {iso:'CA',name:'Canada',region:'North America',physRisk:4.0,transReady:6.5,fiscRes:7.5,ndcAmb:6.5,ndGain:76.0,rating:'AAA',gdp:2139,debtGdp:106,color:'#b91c1c'},
  {iso:'IT',name:'Italy',region:'Europe',physRisk:5.5,transReady:5.5,fiscRes:5.0,ndcAmb:6.5,ndGain:68.0,rating:'BBB',gdp:2010,debtGdp:144,color:'#16a34a'},
  {iso:'NL',name:'Netherlands',region:'Europe',physRisk:6.0,transReady:7.5,fiscRes:8.0,ndcAmb:7.5,ndGain:77.0,rating:'AAA',gdp:1009,debtGdp:50,color:'#15803d'},
  {iso:'ES',name:'Spain',region:'Europe',physRisk:6.0,transReady:6.0,fiscRes:5.5,ndcAmb:7.0,ndGain:69.0,rating:'A',gdp:1398,debtGdp:113,color:'#ca8a04'},
  {iso:'SE',name:'Sweden',region:'Europe',physRisk:2.5,transReady:9.0,fiscRes:8.5,ndcAmb:8.5,ndGain:80.0,rating:'AAA',gdp:585,debtGdp:33,color:'#0369a1'},
  {iso:'AU',name:'Australia',region:'Asia Pacific',physRisk:6.5,transReady:5.5,fiscRes:7.5,ndcAmb:5.5,ndGain:72.0,rating:'AAA',gdp:1693,debtGdp:53,color:'#7c3aed'},
  {iso:'CN',name:'China',region:'Asia Pacific',physRisk:6.5,transReady:5.0,fiscRes:6.0,ndcAmb:5.5,ndGain:56.0,rating:'A+',gdp:17963,debtGdp:77,color:'#be185d'},
  {iso:'IN',name:'India',region:'Asia Pacific',physRisk:7.5,transReady:4.0,fiscRes:4.5,ndcAmb:5.0,ndGain:52.0,rating:'BBB-',gdp:3730,debtGdp:81,color:'#ea580c'},
  {iso:'BR',name:'Brazil',region:'Latin America',physRisk:7.0,transReady:4.5,fiscRes:4.0,ndcAmb:5.5,ndGain:53.0,rating:'BB',gdp:2082,debtGdp:89,color:'#16a34a'},
  {iso:'ZA',name:'South Africa',region:'Africa',physRisk:8.0,transReady:3.5,fiscRes:3.5,ndcAmb:4.0,ndGain:45.0,rating:'BB-',gdp:405,debtGdp:73,color:'#b45309'},
  {iso:'SA',name:'Saudi Arabia',region:'Middle East',physRisk:8.5,transReady:3.0,fiscRes:6.5,ndcAmb:3.0,ndGain:44.0,rating:'A',gdp:1063,debtGdp:25,color:'#0e7490'},
  {iso:'NG',name:'Nigeria',region:'Africa',physRisk:9.0,transReady:2.5,fiscRes:2.5,ndcAmb:4.0,ndGain:36.0,rating:'B-',gdp:477,debtGdp:40,color:'#7c3aed'},
  {iso:'EG',name:'Egypt',region:'Middle East',physRisk:8.5,transReady:3.5,fiscRes:3.0,ndcAmb:4.5,ndGain:41.0,rating:'B+',gdp:476,debtGdp:87,color:'#92400e'},
  {iso:'PK',name:'Pakistan',region:'Asia Pacific',physRisk:9.0,transReady:2.0,fiscRes:2.0,ndcAmb:4.5,ndGain:37.0,rating:'CCC+',gdp:340,debtGdp:74,color:'#166534'},
  {iso:'MX',name:'Mexico',region:'Latin America',physRisk:7.0,transReady:4.5,fiscRes:5.0,ndcAmb:4.5,ndGain:55.0,rating:'BBB',gdp:1322,debtGdp:54,color:'#065f46'},
  {iso:'KR',name:'South Korea',region:'Asia Pacific',physRisk:5.0,transReady:7.0,fiscRes:7.0,ndcAmb:6.5,ndGain:71.0,rating:'AA',gdp:1722,debtGdp:54,color:'#1e40af'},
  {iso:'TR',name:'Turkey',region:'Europe',physRisk:7.5,transReady:3.5,fiscRes:4.0,ndcAmb:4.0,ndGain:49.0,rating:'B+',gdp:906,debtGdp:34,color:'#b91c1c'},
  {iso:'PL',name:'Poland',region:'Europe',physRisk:4.5,transReady:5.0,fiscRes:6.5,ndcAmb:5.0,ndGain:67.0,rating:'A-',gdp:748,debtGdp:49,color:'#dc2626'},
  {iso:'ID',name:'Indonesia',region:'Asia Pacific',physRisk:8.0,transReady:4.0,fiscRes:5.0,ndcAmb:4.5,ndGain:49.0,rating:'BBB',gdp:1319,debtGdp:39,color:'#dc2626'},
  {iso:'NO',name:'Norway',region:'Europe',physRisk:2.5,transReady:9.5,fiscRes:9.5,ndcAmb:8.5,ndGain:82.0,rating:'AAA',gdp:579,debtGdp:40,color:'#1d4ed8'},
];

const compositeScore=(s)=>+((10-s.physRisk)*0.3+s.transReady*0.25+s.fiscRes*0.2+s.ndcAmb*0.15+s.ndGain/10*0.1).toFixed(2);
const ratingColor=(r)=>{if(!r)return T.textMut;if(r.startsWith('AAA')||r==='AA+'||r==='AA')return T.green;if(r.startsWith('A'))return T.teal;if(r.startsWith('BBB'))return T.amber;if(r.startsWith('BB'))return T.gold;return T.red;};
const riskColor=(v,inverse)=>inverse?(v>=7?T.green:v>=5?T.amber:T.red):(v>=7?T.red:v>=5?T.amber:T.green);
const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});

const REGIONS=['All','Europe','Asia Pacific','North America','Latin America','Middle East','Africa'];
const NGFS_SCENARIOS=[
  {scenario:'Orderly — Net Zero 2050',physAdj:-0.3,transAdj:-0.5,spreadBps:12,color:T.green},
  {scenario:'Orderly — Below 2°C',physAdj:-0.1,transAdj:-0.3,spreadBps:22,color:T.teal},
  {scenario:'Disorderly — Divergent Net Zero',physAdj:-0.2,transAdj:-0.8,spreadBps:45,color:T.amber},
  {scenario:'Hot House World — >3°C',physAdj:1.5,transAdj:0.2,spreadBps:85,color:T.red},
];

export default function SovereignClimateIntelligencePage(){
  const [tab,setTab]=useState(0);
  const TABS=['Country Scorecard','Portfolio Exposure','NGFS Scenarios','Spread & Credit Impact'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-BA1</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>ND-GAIN · INFORM RISK · IMF · NGFS SOVEREIGN · WORLD BANK CCKP · 25 COUNTRIES</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Sovereign Climate Risk Intelligence</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Climate-adjusted sovereign creditworthiness — physical risk, transition readiness, fiscal resilience, NDC ambition & spread overlay</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<CountryScorecard/>}
        {tab===1&&<PortfolioExposure/>}
        {tab===2&&<NgfsScenarios/>}
        {tab===3&&<SpreadCreditImpact/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: COUNTRY SCORECARD ===== */
function CountryScorecard(){
  const [selRegion,setSelRegion]=useState('All');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const [sortBy,setSortBy]=useState('composite');

  const scored=SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));
  const filtered=useMemo(()=>scored.filter(s=>{
    if(selRegion!=='All'&&s.region!==selRegion)return false;
    if(search&&!s.name.toLowerCase().includes(search.toLowerCase())&&!s.iso.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>sortBy==='composite'?b.composite-a.composite:sortBy==='physRisk'?a.physRisk-b.physRisk:b[sortBy]-a[sortBy]),[selRegion,search,sortBy,scored]);

  const avgComposite=+(scored.reduce((a,s)=>a+s.composite,0)/scored.length).toFixed(2);
  const highRisk=scored.filter(s=>s.composite<5).length;
  const lowRisk=scored.filter(s=>s.composite>=7).length;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Countries Assessed',value:SOVEREIGNS.length,sub:'Composite climate risk scored'},
          {label:'High Risk (Score <5)',value:highRisk,sub:'Elevated sovereign spread overlay',color:T.red},
          {label:'Low Risk (Score ≥7)',value:lowRisk,sub:'Climate leader sovereign bonds',color:T.green},
          {label:'Avg Composite Score',value:avgComposite+'/10',sub:'Physical · Transition · Fiscal · NDC',color:avgComposite>=6?T.green:avgComposite>=4?T.amber:T.red},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country / ISO…" style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,width:180,fontFamily:T.font}}/>
            <select value={selRegion} onChange={e=>setSelRegion(e.target.value)} style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
              {REGIONS.map(r=><option key={r}>{r}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
              <option value="composite">Sort: Composite ↓</option>
              <option value="physRisk">Sort: Physical Risk ↑</option>
              <option value="transReady">Sort: Transition Readiness ↓</option>
              <option value="ndGain">Sort: ND-GAIN ↓</option>
            </select>
            <span style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} / {SOVEREIGNS.length}</span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['ISO','Country','Region','Composite','Phys Risk','Trans Ready','Fisc Res','NDC Amb','ND-GAIN','Rating','GDP ($bn)','Debt/GDP'].map(h=>(
                  <th key={h} style={{padding:'6px 8px',textAlign:'left',fontSize:9,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.iso} onClick={()=>setSelected(selected?.iso===s.iso?null:s)} style={{borderBottom:`1px solid ${T.borderL}`,cursor:'pointer',background:selected?.iso===s.iso?T.surfaceH:'transparent'}}>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:11}}>{s.iso}</td>
                  <td style={{padding:'8px 8px',fontWeight:600,color:T.text,fontSize:12}}>{s.name}</td>
                  <td style={{padding:'8px 8px',fontSize:11,color:T.textSec}}>{s.region}</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontWeight:700,fontSize:13,color:s.composite>=7?T.green:s.composite>=5?T.amber:T.red}}>{s.composite}</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:riskColor(s.physRisk,false)}}>{s.physRisk}</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:riskColor(s.transReady,true)}}>{s.transReady}</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:riskColor(s.fiscRes,true)}}>{s.fiscRes}</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:riskColor(s.ndcAmb,true)}}>{s.ndcAmb}</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:T.teal}}>{s.ndGain}</td>
                  <td style={{padding:'8px 8px'}}><span style={pill(ratingColor(s.rating),s.rating,true)}>{s.rating}</span></td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:T.navy}}>{(s.gdp/1000).toFixed(1)}T</td>
                  <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11,color:s.debtGdp>100?T.red:s.debtGdp>60?T.amber:T.green}}>{s.debtGdp}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {selected?(
            <div style={{background:T.surface,border:`2px solid ${T.gold}30`,borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <span style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:T.navy}}>{selected.iso}</span>
                <span style={{fontSize:15,fontWeight:700,color:T.text}}>{selected.name}</span>
                <span style={pill(ratingColor(selected.rating),selected.rating,false)}>{selected.rating}</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={[
                  {subject:'Phys Safety',A:10-selected.physRisk},
                  {subject:'Trans Ready',A:selected.transReady},
                  {subject:'Fisc Resil',A:selected.fiscRes},
                  {subject:'NDC Amb',A:selected.ndcAmb},
                  {subject:'ND-GAIN',A:selected.ndGain/10},
                ]}>
                  <PolarGrid stroke={T.borderL}/>
                  <PolarAngleAxis dataKey="subject" style={{fontSize:10}}/>
                  <PolarRadiusAxis domain={[0,10]} style={{fontSize:9}}/>
                  <Radar dataKey="A" stroke={selected.color} fill={selected.color} fillOpacity={0.25}/>
                </RadarChart>
              </ResponsiveContainer>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
                {[
                  {label:'Composite Score',value:selected.composite,color:selected.composite>=7?T.green:selected.composite>=5?T.amber:T.red},
                  {label:'GDP',value:`$${(selected.gdp/1000).toFixed(1)}T`},
                  {label:'Debt / GDP',value:`${selected.debtGdp}%`,color:selected.debtGdp>100?T.red:T.amber},
                  {label:'ND-GAIN Score',value:selected.ndGain,color:T.teal},
                ].map((f,i)=>(
                  <div key={i} style={{padding:'8px 10px',background:T.surfaceH,borderRadius:8}}>
                    <div style={{fontSize:10,color:T.textMut,marginBottom:2}}>{f.label}</div>
                    <div style={{fontFamily:T.mono,fontWeight:700,color:f.color||T.navy,fontSize:14}}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Score Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  {range:'<4',count:scored.filter(s=>s.composite<4).length,color:T.red},
                  {range:'4-5',count:scored.filter(s=>s.composite>=4&&s.composite<5).length,color:'#ea580c'},
                  {range:'5-6',count:scored.filter(s=>s.composite>=5&&s.composite<6).length,color:T.amber},
                  {range:'6-7',count:scored.filter(s=>s.composite>=6&&s.composite<7).length,color:T.gold},
                  {range:'7+',count:scored.filter(s=>s.composite>=7).length,color:T.green},
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="range" style={{fontSize:11}}/>
                  <YAxis style={{fontSize:11}}/>
                  <Tooltip/>
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {[T.red,'#ea580c',T.amber,T.gold,T.green].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:16,padding:'10px 12px',background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${T.gold}`,fontSize:12,color:T.textSec}}>
                Click any row to see the full country risk radar profile.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: PORTFOLIO EXPOSURE ===== */
function PortfolioExposure(){
  const scored=SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));

  const holdings=SOVEREIGNS.slice(0,12).map((s,i)=>({
    ...s,composite:compositeScore(s),
    weight:+(sr(i*31+7)*12+2).toFixed(1),
    notional:+(sr(i*37+11)*800+50).toFixed(0),
    spreadOverlay:Math.round((10-compositeScore(s))*8+sr(i*41+5)*15),
  }));

  const totalWeight=+holdings.reduce((a,h)=>a+h.weight,0).toFixed(1);
  const weightedScore=+(holdings.reduce((a,h)=>a+h.composite*h.weight,0)/totalWeight).toFixed(2);
  const weightedSpread=Math.round(holdings.reduce((a,h)=>a+h.spreadOverlay*h.weight,0)/totalWeight);
  const highRiskExposure=+holdings.filter(h=>h.composite<5).reduce((a,h)=>a+h.weight,0).toFixed(1);

  const regionBreakdown=['Europe','Asia Pacific','North America','Latin America','Middle East','Africa'].map(r=>({
    region:r,weight:+holdings.filter(h=>h.region===r).reduce((a,h)=>a+h.weight,0).toFixed(1),
    avgScore:holdings.filter(h=>h.region===r).length?+(holdings.filter(h=>h.region===r).reduce((a,h)=>a+h.composite,0)/holdings.filter(h=>h.region===r).length).toFixed(1):0,
  })).filter(r=>r.weight>0);

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Portfolio Countries',value:holdings.length,sub:`${totalWeight}% total weight`},
          {label:'Wtd Composite Score',value:weightedScore+'/10',sub:'Portfolio climate quality',color:weightedScore>=6?T.green:weightedScore>=4.5?T.amber:T.red},
          {label:'Wtd Spread Overlay',value:'+'+weightedSpread+'bps',sub:'Climate risk premium',color:T.amber},
          {label:'High-Risk Exposure',value:highRiskExposure+'%',sub:'Score <5 countries',color:highRiskExposure>20?T.red:T.amber},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Sovereign Bond Portfolio — Climate Overlay</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Country','Rating','Weight','Notional ($M)','Composite','Phys Risk','Spread Overlay','Action'].map(h=>(
                  <th key={h} style={{padding:'6px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.sort((a,b)=>b.spreadOverlay-a.spreadOverlay).map(h=>(
                <tr key={h.iso} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'9px 10px',fontWeight:600,color:T.navy}}>{h.name}</td>
                  <td style={{padding:'9px 10px'}}><span style={pill(ratingColor(h.rating),h.rating,true)}>{h.rating}</span></td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{h.weight}%</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11,color:T.textSec}}>${h.notional}M</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontWeight:700,color:h.composite>=7?T.green:h.composite>=5?T.amber:T.red}}>{h.composite}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11,color:riskColor(h.physRisk,false)}}>{h.physRisk}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontWeight:700,color:h.spreadOverlay>60?T.red:h.spreadOverlay>30?T.amber:T.green}}>+{h.spreadOverlay}bps</td>
                  <td style={{padding:'9px 10px'}}>
                    {h.spreadOverlay>60?<span style={pill(T.red,'Reduce',true)}>Reduce</span>:h.spreadOverlay>30?<span style={pill(T.amber,'Monitor',true)}>Monitor</span>:<span style={pill(T.green,'Hold',true)}>Hold</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Regional Allocation</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={regionBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="weight" nameKey="region" label={({region,weight})=>`${region.split(' ')[0]}: ${weight}%`} labelLine={false}>
                  {regionBreakdown.map((_,i)=><Cell key={i} fill={[T.navy,T.teal,T.red,T.green,T.amber,T.purple][i%6]}/>)}
                </Pie>
                <Tooltip formatter={v=>v+'%'}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Region Avg Score</div>
            {regionBreakdown.map((r,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:i%2===0?T.surfaceH:'transparent',borderRadius:6,marginBottom:2}}>
                <span style={{fontSize:12,color:T.text}}>{r.region}</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <div style={{width:50,height:4,background:T.borderL,borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:(r.avgScore/10*100)+'%',height:'100%',background:r.avgScore>=7?T.green:r.avgScore>=5?T.amber:T.red,borderRadius:2}}/>
                  </div>
                  <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:r.avgScore>=7?T.green:r.avgScore>=5?T.amber:T.red}}>{r.avgScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 3: NGFS SCENARIOS ===== */
function NgfsScenarios(){
  const [selScenario,setSelScenario]=useState(0);
  const scenario=NGFS_SCENARIOS[selScenario];
  const scored=SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));

  const scenarioScores=scored.map(s=>({
    ...s,
    adjustedScore:Math.max(0,Math.min(10,s.composite+scenario.physAdj*(s.physRisk/5)+scenario.transAdj*(1-s.transReady/10))).toFixed(2),
    adjustedSpread:Math.round((10-s.composite)*scenario.spreadBps/8+sr(s.iso.charCodeAt(0)*7+s.iso.charCodeAt(1)*11)*20),
  }));

  const years=[2024,2026,2028,2030,2035,2040,2050];
  const pathways=NGFS_SCENARIOS.map(sc=>({
    name:sc.scenario.split('—')[0].trim(),
    data:years.map((yr,i)=>({yr,spread:Math.round(sc.spreadBps*(1+i*0.15+sr(NGFS_SCENARIOS.indexOf(sc)*31+i*7)*0.1))})),
    color:sc.color,
  }));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {NGFS_SCENARIOS.map((sc,i)=>(
          <div key={i} onClick={()=>setSelScenario(i)} style={{background:T.surface,border:`2px solid ${selScenario===i?sc.color:T.border}`,borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'all 0.2s'}}>
            <div style={{fontWeight:700,color:T.navy,fontSize:12,marginBottom:4}}>{sc.scenario}</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>{sc.scenario.includes('Net Zero')?'1.5°C pathway':sc.scenario.includes('Below 2')?'<2°C pathway':sc.scenario.includes('Divergent')?'2°C disorderly':'>3°C no action'}</div>
            <div style={{fontFamily:T.mono,fontSize:20,fontWeight:700,color:sc.color}}>+{sc.spreadBps}bps</div>
            <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Avg sovereign spread overlay</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Sovereign Spread Pathway — All Scenarios</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Climate risk spread premium (bps) evolution to 2050 under NGFS Phase 4 scenarios</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="yr" type="number" domain={[2024,2050]} style={{fontSize:11}} allowDuplicatedCategory={false}/>
              <YAxis style={{fontSize:11}} tickFormatter={v=>'+'+v+'bps'}/>
              <Tooltip formatter={v=>'+'+v+'bps'}/>
              <Legend/>
              {pathways.map((pw,i)=>(
                <Line key={i} data={pw.data} type="monotone" dataKey="spread" name={pw.name} stroke={pw.color} strokeWidth={selScenario===i?3:1.5} strokeDasharray={i>1?'5 3':undefined} dot={false}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Scenario: {scenario.scenario}</div>
          <div style={{padding:'10px 14px',background:scenario.color+'0d',borderRadius:8,border:`1px solid ${scenario.color}30`,marginBottom:16}}>
            <div style={{fontSize:12,color:T.textSec}}>
              {selScenario===0?'Paris-aligned net zero by 2050. Early, predictable policy. Lowest physical risk.':selScenario===1?'<2°C with orderly transition. Some stranded assets. Moderate spread overlay.':selScenario===2?'Net zero eventually but via disorderly transition. High transition costs for laggards.':'No meaningful climate action. Severe physical risks by 2040. Highest sovereign spread impact.'}
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8}}>TOP 5 MOST EXPOSED UNDER THIS SCENARIO</div>
          {scenarioScores.sort((a,b)=>b.adjustedSpread-a.adjustedSpread).slice(0,5).map((s,i)=>(
            <div key={s.iso} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.surfaceH,borderRadius:7,marginBottom:6}}>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:12,minWidth:28}}>{s.iso}</span>
                <span style={{fontSize:12,color:T.text}}>{s.name}</span>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.red}}>+{s.adjustedSpread}bps</span>
                <span style={pill(ratingColor(s.rating),s.rating,true)}>{s.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 4: SPREAD & CREDIT IMPACT ===== */
function SpreadCreditImpact(){
  const scored=SOVEREIGNS.map(s=>({...s,composite:compositeScore(s),spreadAdj:Math.round((10-compositeScore(s))*9+sr(s.iso.charCodeAt(0)*7+3)*20)}));

  const notchMap={'AAA':0,'AA+':1,'AA':2,'AA-':3,'A+':4,'A':5,'A-':6,'BBB+':7,'BBB':8,'BBB-':9,'BB+':10,'BB':11,'BB-':12,'B+':13,'B':14,'B-':15,'CCC+':16};
  const ratingNotch=scored.map(s=>({...s,notch:notchMap[s.rating]||8,newNotch:Math.min(16,Math.max(0,(notchMap[s.rating]||8)+Math.round((10-s.composite)/3.5)))}));

  const spreadByRating=[
    {bucket:'AAA/AA',avg:Math.round(scored.filter(s=>s.rating.startsWith('AA')||s.rating==='AAA').reduce((a,s)=>a+s.spreadAdj,0)/Math.max(1,scored.filter(s=>s.rating.startsWith('AA')||s.rating==='AAA').length))},
    {bucket:'A',avg:Math.round(scored.filter(s=>s.rating.startsWith('A')&&!s.rating.startsWith('AA')).reduce((a,s)=>a+s.spreadAdj,0)/Math.max(1,scored.filter(s=>s.rating.startsWith('A')&&!s.rating.startsWith('AA')).length))},
    {bucket:'BBB',avg:Math.round(scored.filter(s=>s.rating.startsWith('BBB')).reduce((a,s)=>a+s.spreadAdj,0)/Math.max(1,scored.filter(s=>s.rating.startsWith('BBB')).length))},
    {bucket:'BB',avg:Math.round(scored.filter(s=>s.rating.startsWith('BB')).reduce((a,s)=>a+s.spreadAdj,0)/Math.max(1,scored.filter(s=>s.rating.startsWith('BB')).length))},
    {bucket:'B/CCC',avg:Math.round(scored.filter(s=>s.rating.startsWith('B')||s.rating.startsWith('CCC')).reduce((a,s)=>a+s.spreadAdj,0)/Math.max(1,scored.filter(s=>s.rating.startsWith('B')||s.rating.startsWith('CCC')).length))},
  ];

  const downgraded=ratingNotch.filter(s=>s.newNotch>s.notch);

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Avg Spread Overlay',value:'+'+Math.round(scored.reduce((a,s)=>a+s.spreadAdj,0)/scored.length)+'bps',sub:'Across 25 sovereigns',color:T.amber},
          {label:'Max Spread Overlay',value:'+'+Math.max(...scored.map(s=>s.spreadAdj))+'bps',sub:scored.sort((a,b)=>b.spreadAdj-a.spreadAdj)[0]?.name,color:T.red},
          {label:'Implied Downgrades',value:downgraded.length,sub:'Climate-adjusted notch reduction',color:T.red},
          {label:'Climate Leaders',value:scored.filter(s=>s.spreadAdj<20).length,sub:'Spread adj <20bps',color:T.green},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Climate Spread Overlay by Country</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...scored].sort((a,b)=>b.spreadAdj-a.spreadAdj)} layout="vertical" margin={{left:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tickFormatter={v=>'+'+v} style={{fontSize:9}}/>
              <YAxis type="category" dataKey="iso" width={28} style={{fontSize:10}}/>
              <Tooltip formatter={v=>'+'+v+'bps'}/>
              <Bar dataKey="spreadAdj" radius={[0,4,4,0]}>
                {[...scored].sort((a,b)=>b.spreadAdj-a.spreadAdj).map((s,i)=><Cell key={i} fill={s.spreadAdj>60?T.red:s.spreadAdj>30?T.amber:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Avg Spread Overlay by Rating Bucket</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={spreadByRating}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="bucket" style={{fontSize:11}}/>
                <YAxis tickFormatter={v=>'+'+v} style={{fontSize:11}}/>
                <Tooltip formatter={v=>'+'+v+'bps'}/>
                <Bar dataKey="avg" fill={T.navy} radius={[4,4,0,0]}>
                  {spreadByRating.map((_,i)=><Cell key={i} fill={[T.green,T.teal,T.amber,T.gold,T.red][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Implied Rating Notch Downgrades</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Climate-adjusted credit quality — notch reduction based on composite score</div>
            {ratingNotch.filter(s=>s.newNotch>s.notch).slice(0,6).map((s,i)=>(
              <div key={s.iso} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.surfaceH,borderRadius:7,marginBottom:6}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:12,minWidth:28}}>{s.iso}</span>
                  <span style={{fontSize:12,color:T.text}}>{s.name}</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={pill(ratingColor(s.rating),s.rating,true)}>{s.rating}</span>
                  <span style={{fontSize:12,color:T.textMut}}>→</span>
                  <span style={pill(T.red,Object.keys(notchMap)[s.newNotch]||'CCC',true)}>{Object.keys(notchMap)[s.newNotch]||'CCC'}</span>
                  <span style={{fontFamily:T.mono,fontSize:11,color:T.red}}>-{s.newNotch-s.notch} notch</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
