import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const PROVIDERS=['MSCI','S&P Global','Sustainalytics','ISS ESG','CDP','Refinitiv'];
const PROV_COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL];
const QUARTERS=['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25','Q1-26','Q2-26','Q3-26','Q4-26'];
const RATINGS=['AAA','AA','A','BBB','BB','B','CCC'];
const SECTORS=['Technology','Healthcare','Financials','Energy','Industrials','Consumer Disc.','Consumer Staples','Utilities','Materials','Real Estate','Telecom','Aerospace','Automotive','Mining','Agriculture'];

const ESG_EVENTS=[
  {id:1,name:'EU CSRD Enforcement Wave',type:'Governance',quarter:'Q2-24',desc:'Mandatory CSRD reporting triggered mass re-ratings across EU-listed firms'},
  {id:2,name:'Texas Chemical Spill',type:'Environmental',quarter:'Q1-24',desc:'Major industrial accident impacting 12 downstream chemical companies'},
  {id:3,name:'Amazon Deforestation Report',type:'Environmental',quarter:'Q3-24',desc:'Satellite data revealed accelerated deforestation linked to agricultural supply chains'},
  {id:4,name:'Big Tech Labor Audit',type:'Social',quarter:'Q4-24',desc:'Whistleblower disclosures on contractor working conditions at 5 major tech firms'},
  {id:5,name:'SEC Climate Rule Final',type:'Governance',quarter:'Q1-25',desc:'SEC finalized climate disclosure requirements for US-listed companies'},
  {id:6,name:'Fukushima Water Release Phase 3',type:'Environmental',quarter:'Q2-25',desc:'Ongoing treated water discharge impacting seafood and shipping supply chains'},
  {id:7,name:'EU Taxonomy Update v3',type:'Governance',quarter:'Q3-25',desc:'Expanded taxonomy criteria changed green eligibility for 200+ firms'},
  {id:8,name:'Global Plastics Treaty',type:'Environmental',quarter:'Q4-25',desc:'UN plastics treaty signed, creating new obligations for packaging and materials sectors'},
  {id:9,name:'Indian Labor Rights Act',type:'Social',quarter:'Q1-26',desc:'Sweeping labor reforms in India impacting IT outsourcing and manufacturing firms'},
  {id:10,name:'Boeing Safety Crisis',type:'Governance',quarter:'Q2-24',desc:'Manufacturing defects and cover-up led to governance downgrades across aerospace'},
  {id:11,name:'PFAS Litigation Wave',type:'Environmental',quarter:'Q3-24',desc:'Forever chemicals lawsuits expanded to 50+ defendant companies across sectors'},
  {id:12,name:'AI Ethics Controversy',type:'Social',quarter:'Q2-25',desc:'Major AI firms downgraded on algorithmic bias, privacy, and job displacement concerns'},
  {id:13,name:'Mining Dam Collapse Brazil',type:'Environmental',quarter:'Q4-24',desc:'Catastrophic tailings dam failure killing 40+ and contaminating water supply'},
  {id:14,name:'Board Diversity Mandate EU',type:'Governance',quarter:'Q1-25',desc:'40% gender diversity requirement enforced with fines for non-compliance'},
  {id:15,name:'Greenwashing Crackdown',type:'Governance',quarter:'Q2-26',desc:'Regulators fined 30+ firms across EU and US for misleading ESG claims'},
];

const COMPANY_NAMES=['NextEra Energy','Microsoft','Apple','Alphabet','Tesla','JPMorgan Chase','Johnson & Johnson','Procter & Gamble','ExxonMobil','Chevron',
  'Bank of America','Pfizer','UnitedHealth','Walmart','Visa','Mastercard','Meta Platforms','Amazon','NVIDIA','Broadcom',
  'Costco','Home Depot','Abbott Labs','Thermo Fisher','Danaher','Linde','Honeywell','Caterpillar','Deere & Co','3M',
  'Boeing','Lockheed Martin','Raytheon','General Electric','Siemens','BASF','Bayer','SAP','ASML','LVMH',
  'Toyota','Samsung','TSMC','Shell','BP','TotalEnergies','Rio Tinto','BHP Group','Glencore','Nestle',
  'Unilever','Danone','Adidas','Nike','Starbucks','McDonalds','Coca-Cola','PepsiCo','Mondelez','Kraft Heinz',
  'Goldman Sachs','Morgan Stanley','Citigroup','HSBC','Barclays','Deutsche Bank','BNP Paribas','ING Group','Credit Agricole','Societe Generale',
  'AstraZeneca','Novartis','Roche','Merck','Eli Lilly','Amgen','Gilead Sciences','Bristol-Myers','Regeneron','Vertex Pharma',
  'Duke Energy','Southern Company','Dominion Energy','AES Corp','Enphase Energy','First Solar','SunPower','Vestas Wind','Orsted','Iberdrola',
  'Freeport-McMoRan','Newmont Mining','Alcoa','Nucor','CF Industries','Mosaic Co','Corteva','Archer Daniels','Bunge','Cargill',
  'AT&T','Verizon','T-Mobile','Comcast','Walt Disney','Netflix','Spotify','Airbnb','Uber','Lyft',
  'Salesforce','Adobe','Oracle','IBM','Cisco','Intel','AMD','Qualcomm','Texas Instruments','Micron',
  'American Tower','Prologis','Equinix','Crown Castle','Simon Property','Digital Realty','CBRE Group','Weyerhaeuser','Realty Income','Vornado',
  'Airbus','Northrop Grumman','BAE Systems','General Dynamics','L3Harris','Rolls-Royce','Safran','Leonardo DRS','Textron','RTX Corp',
  'Syngenta','Bayer CropScience','FMC Corp','AGCO Corp','Deere Agriculture','Trimble','Lindsay Corp','Valmont Industries','Adecoagro','SLC Agricola'];

const genCompanies=(count)=>COMPANY_NAMES.slice(0,count).map((name,i)=>({
  id:i,name,sector:SECTORS[Math.floor(sr(i*7)*SECTORS.length)],
  ratings:PROVIDERS.map((_p,pi)=>QUARTERS.map((_q,qi)=>{
    const base=Math.floor(sr(i*100+pi*13+qi*3)*5)+1;
    const drift=qi>0?(sr(i*200+pi*17+qi*11)>0.7?-1:sr(i*200+pi*17+qi*11)<0.15?1:0):0;
    return Math.max(0,Math.min(6,base+drift));
  })),
  marketCap:Math.round(sr(i*31)*900+10),
}));

const COMPANIES=genCompanies(150);
const rLabel=(idx)=>RATINGS[Math.max(0,Math.min(6,idx))]||'CCC';

const migrationFor=(companies,provIdx,qFrom,qTo)=>{
  const mat=Array.from({length:7},()=>Array(7).fill(0));
  const details=Array.from({length:7},()=>Array.from({length:7},()=>[]));
  companies.forEach(c=>{
    const from=c.ratings[provIdx][qFrom];
    const to=c.ratings[provIdx][qTo];
    mat[from][to]++;
    details[from][to].push(c.name);
  });
  return {mat,details};
};

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  card:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'20px',marginBottom:16},
  cardT:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  tab:{padding:'10px 20px',border:'none',borderRadius:'8px 8px 0 0',cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.2s'},
  tabA:{background:T.surface,color:T.navy,borderBottom:`2px solid ${T.gold}`},
  tabI:{background:'transparent',color:T.textMut},
  inp:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text},
  btn:{padding:'6px 14px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.2s'},
  pill:(a)=>({padding:'4px 12px',borderRadius:20,border:`1px solid ${a?T.navy:T.border}`,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,cursor:'pointer',fontSize:12,fontWeight:500}),
  kpi:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:'14px 18px',textAlign:'center',minWidth:110},
  kpiV:{fontSize:22,fontWeight:700,fontFamily:T.mono},
  kpiL:{fontSize:11,color:T.textMut,marginTop:2},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:c+'18',color:c}),
  slider:{width:'100%',accentColor:T.navy},
  matrix:{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:2,fontSize:11,fontFamily:T.mono},
  matCell:(val,max)=>({padding:'6px 4px',textAlign:'center',borderRadius:4,cursor:val>0?'pointer':'default',background:val===0?T.surfaceH:`rgba(27,58,92,${Math.min(val/(max||1)*0.8+0.1,0.9)})`,color:val>(max*0.4)?'#fff':T.text,fontWeight:val>0?600:400,transition:'all 0.15s'}),
  tbl:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:600,color:T.textSec,fontSize:11,textTransform:'uppercase',letterSpacing:0.5},
  td:{padding:'8px 10px',borderBottom:`1px solid ${T.border}`},
  heatC:(val,mn,mx)=>{const n=(val-mn)/((mx-mn)||1);return{padding:'8px',textAlign:'center',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono,background:val>0?`rgba(22,163,74,${Math.min(n*0.8+0.15,0.9)})`:`rgba(220,38,38,${Math.min(Math.abs(n)*0.8+0.15,0.9)})`,color:'#fff',cursor:'pointer'};},
  overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',display:'flex',justifyContent:'flex-end',zIndex:1000},
  sideP:{width:500,background:T.surface,height:'100%',overflowY:'auto',padding:24,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},
};

const Spark=({data,color=T.navy,w=80,h=24})=>{
  if(!data||data.length<2)return null;
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-(((v-mn)/rng)*h)}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}/></svg>;
};

const KPI=({label,value,color})=><div style={sty.kpi}><div style={{...sty.kpiV,color:color||T.navy}}>{value}</div><div style={sty.kpiL}>{label}</div></div>;

export default function RatingsMigrationMomentumPage(){
  const [tab,setTab]=useState(0);
  const tabs=['Migration Tracker','Momentum Signals','Provider Lead-Lag','Alpha Signal Builder'];
  return(
    <div style={sty.page}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Ratings Migration & Momentum</h1>
        <p style={{color:T.textSec,fontSize:13,margin:'4px 0 0'}}>EP-AK3 | 150 companies | 6 providers | 12 quarters | Deep migration analytics & alpha signal construction</p>
      </div>
      <div style={{display:'flex',gap:4,borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
        {tabs.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{...sty.tab,...(tab===i?sty.tabA:sty.tabI)}}>{t}</button>)}
      </div>
      {tab===0&&<MigrationTracker/>}
      {tab===1&&<MomentumSignals/>}
      {tab===2&&<ProviderLeadLag/>}
      {tab===3&&<AlphaSignalBuilder/>}
    </div>
  );
}

/* ======================================================================
   TAB 1 — MIGRATION TRACKER
   ====================================================================== */
function MigrationTracker(){
  const [qPair,setQPair]=useState(0);
  const [provFilter,setProvFilter]=useState(PROVIDERS.map(()=>true));
  const [sectorFilter,setSectorFilter]=useState('All');
  const [clickedCell,setClickedCell]=useState(null);
  const [search,setSearch]=useState('');
  const [expanded,setExpanded]=useState(null);
  const [page,setPage]=useState(0);
  const [watchlist,setWatchlist]=useState(new Set());
  const perPage=25;

  const filtered=useMemo(()=>{
    let c=[...COMPANIES];
    if(sectorFilter!=='All')c=c.filter(x=>x.sector===sectorFilter);
    if(search)c=c.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
    if(clickedCell){
      const {fromR,toR,provIdx}=clickedCell;
      c=c.filter(x=>x.ratings[provIdx][qPair]===fromR&&x.ratings[provIdx][qPair+1]===toR);
    }
    return c;
  },[sectorFilter,search,clickedCell,qPair]);

  const activeProviders=useMemo(()=>PROVIDERS.map((_p,i)=>provFilter[i]?i:null).filter(x=>x!==null),[provFilter]);

  const stats=useMemo(()=>{
    let ups=0,downs=0,stable=0,maxJump=0,maxJumpName='';
    COMPANIES.forEach(c=>{
      activeProviders.forEach(pi=>{
        const from=c.ratings[pi][qPair],to=c.ratings[pi][qPair+1];
        const diff=from-to;
        if(diff>0)ups++;else if(diff<0)downs++;else stable++;
        if(Math.abs(diff)>maxJump){maxJump=Math.abs(diff);maxJumpName=c.name;}
      });
    });
    const total=ups+downs+stable;
    return{ups,downs,net:ups-downs,stability:total?((stable/total)*100).toFixed(1):'0',maxJump,maxJumpName};
  },[qPair,activeProviders]);

  const upDownData=useMemo(()=>PROVIDERS.map((p,pi)=>{
    if(!provFilter[pi])return null;
    let ups=0,downs=0;
    (sectorFilter==='All'?COMPANIES:COMPANIES.filter(c=>c.sector===sectorFilter)).forEach(c=>{
      const diff=c.ratings[pi][qPair]-c.ratings[pi][qPair+1];
      if(diff>0)ups++;if(diff<0)downs++;
    });
    return{provider:p,upgrades:ups,downgrades:-downs};
  }).filter(Boolean),[qPair,provFilter,sectorFilter]);

  const maxMat=useMemo(()=>{
    let m=0;
    activeProviders.forEach(pi=>{
      const{mat}=migrationFor(filtered,pi,qPair,qPair+1);
      mat.forEach(r=>r.forEach(v=>{if(v>m)m=v;}));
    });
    return m;
  },[filtered,qPair,activeProviders]);

  const paged=filtered.slice(page*perPage,(page+1)*perPage);
  const totalPages=Math.ceil(filtered.length/perPage);

  return(
    <div>
      {/* Controls row */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Transition:</span>
          <select style={sty.inp} value={qPair} onChange={e=>{setQPair(+e.target.value);setClickedCell(null);setPage(0);}}>
            {QUARTERS.slice(0,-1).map((q,i)=><option key={i} value={i}>{q} &rarr; {QUARTERS[i+1]}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Sector:</span>
          <select style={sty.inp} value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPage(0);setClickedCell(null);}}>
            <option value="All">All Sectors (15)</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <input style={{...sty.inp,width:180}} placeholder="Search company..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
        {clickedCell&&<button style={{...sty.btn,background:T.red+'20',color:T.red}} onClick={()=>setClickedCell(null)}>Clear cell filter</button>}
      </div>

      {/* Provider checkboxes */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {PROVIDERS.map((p,i)=><label key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:T.textSec,cursor:'pointer'}}>
          <input type="checkbox" checked={provFilter[i]} onChange={()=>{const n=[...provFilter];n[i]=!n[i];setProvFilter(n);}}/>
          <span style={{width:8,height:8,borderRadius:'50%',background:PROV_COLORS[i],display:'inline-block'}}/>{p}
        </label>)}
      </div>

      {/* KPIs */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Upgrades" value={stats.ups} color={T.green}/>
        <KPI label="Downgrades" value={stats.downs} color={T.red}/>
        <KPI label="Net Migration" value={(stats.net>0?'+':'')+stats.net} color={stats.net>=0?T.green:T.red}/>
        <KPI label="Stability Rate" value={stats.stability+'%'} color={T.navy}/>
        <KPI label="Largest Single Jump" value={`${stats.maxJump} notch${stats.maxJump!==1?'es':''}`} color={T.amber}/>
      </div>

      {/* Migration matrices */}
      <div style={{display:'grid',gridTemplateColumns:activeProviders.length>3?'1fr 1fr':'repeat(3,1fr)',gap:16,marginBottom:20}}>
        {activeProviders.map(pi=>{
          const{mat}=migrationFor(filtered,pi,qPair,qPair+1);
          return(
            <div key={pi} style={sty.card}>
              <div style={sty.cardT}>{PROVIDERS[pi]} — {QUARTERS[qPair]} to {QUARTERS[qPair+1]}</div>
              <div style={sty.matrix}>
                <div style={{padding:4,fontWeight:700,fontSize:9,color:T.textMut}}>From\To</div>
                {RATINGS.map(r=><div key={r} style={{padding:4,fontWeight:600,fontSize:9,textAlign:'center',color:T.textSec}}>{r}</div>)}
                {RATINGS.map((fromR,fi)=><React.Fragment key={fi}>
                  <div style={{padding:4,fontWeight:600,fontSize:9,color:T.textSec}}>{fromR}</div>
                  {RATINGS.map((_toR,ti)=>{
                    const val=mat[fi][ti];
                    return(
                      <div key={ti} style={sty.matCell(val,maxMat)}
                        title={`${RATINGS[fi]} to ${RATINGS[ti]}: ${val} companies`}
                        onClick={()=>{if(val>0){setClickedCell({fromR:fi,toR:ti,provIdx:pi});setPage(0);}}}
                      >{val||''}</div>
                    );
                  })}
                </React.Fragment>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade/Downgrade bar chart */}
      <div style={{...sty.card,marginBottom:20}}>
        <div style={sty.cardT}>Upgrades vs Downgrades by Provider</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={upDownData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis type="category" dataKey="provider" width={110} tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
            <Bar dataKey="upgrades" fill={T.green} name="Upgrades" radius={[0,4,4,0]}/>
            <Bar dataKey="downgrades" fill={T.red} name="Downgrades" radius={[4,0,0,4]}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Company table with expansion */}
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={sty.cardT}>
            {clickedCell?`Filtered: ${rLabel(clickedCell.fromR)} \u2192 ${rLabel(clickedCell.toR)} (${PROVIDERS[clickedCell.provIdx]})`:'All Companies'} — {filtered.length} results
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <button style={{...sty.btn,background:T.surfaceH,color:T.textSec}} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <span style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>{page+1}/{totalPages||1}</span>
            <button style={{...sty.btn,background:T.surfaceH,color:T.textSec}} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
        <table style={sty.tbl}>
          <thead><tr>
            <th style={sty.th}>Company</th><th style={sty.th}>Sector</th><th style={sty.th}>Mkt Cap ($B)</th>
            {activeProviders.map(pi=><th key={pi} style={sty.th}>{PROVIDERS[pi]}</th>)}
            <th style={sty.th}>Avg Change</th><th style={sty.th}></th>
          </tr></thead>
          <tbody>
            {paged.map(c=>{
              const isExp=expanded===c.id;
              return(
                <React.Fragment key={c.id}>
                  <tr onClick={()=>setExpanded(isExp?null:c.id)} style={{background:isExp?T.surfaceH:'transparent',cursor:'pointer'}}>
                    <td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                    <td style={{...sty.td,fontSize:11}}>{c.sector}</td>
                    <td style={{...sty.td,fontFamily:T.mono}}>{c.marketCap}</td>
                    {activeProviders.map(pi=>{
                      const from=rLabel(c.ratings[pi][qPair]),to=rLabel(c.ratings[pi][qPair+1]);
                      const diff=c.ratings[pi][qPair]-c.ratings[pi][qPair+1];
                      return <td key={pi} style={sty.td}><span style={sty.badge(diff>0?T.green:diff<0?T.red:T.textMut)}>{from}\u2192{to}</span></td>;
                    })}
                    <td style={sty.td}>{(()=>{
                      const avg=activeProviders.reduce((s,pi)=>s+(c.ratings[pi][qPair]-c.ratings[pi][qPair+1]),0)/activeProviders.length;
                      return <span style={{color:avg>0?T.green:avg<0?T.red:T.textMut,fontWeight:600,fontFamily:T.mono}}>{avg>0?'+':''}{avg.toFixed(2)}</span>;
                    })()}</td>
                    <td style={sty.td}><span style={{fontSize:11,color:T.navyL}}>{isExp?'\u25B2':'\u25BC'}</span></td>
                  </tr>
                  {isExp&&<tr><td colSpan={4+activeProviders.length} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,marginBottom:8,color:T.navy}}>12-Quarter Rating Trajectory — {c.name}</div>
                        <ResponsiveContainer width="100%" height={170}>
                          <LineChart data={QUARTERS.map((q,qi)=>({q,...PROVIDERS.reduce((o,p,pi)=>({...o,[p]:7-c.ratings[pi][qi]}),{})}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                            <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}}/>
                            <YAxis domain={[1,7]} ticks={[1,2,3,4,5,6,7]} tickFormatter={v=>RATINGS[7-v]||''} tick={{fontSize:9,fill:T.textSec}}/>
                            <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={(v)=>rLabel(7-v)}/>
                            {PROVIDERS.map((p,pi)=>provFilter[pi]?<Line key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[pi]} strokeWidth={2} dot={{r:2}}/>:null)}
                            <Legend wrapperStyle={{fontSize:10}}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{paddingTop:8}}>
                        <button style={{...sty.btn,background:watchlist.has(c.id)?T.red+'20':T.gold+'30',color:watchlist.has(c.id)?T.red:T.gold}}
                          onClick={e=>{e.stopPropagation();setWatchlist(w=>{const n=new Set(w);n.has(c.id)?n.delete(c.id):n.add(c.id);return n;});}}>
                          {watchlist.has(c.id)?'Remove Watchlist':'+ Watchlist'}
                        </button>
                        <div style={{marginTop:8,fontSize:11,color:T.textMut}}>Watchlist: {watchlist.size}</div>
                      </div>
                    </div>
                  </td></tr>}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================================================================
   TAB 2 — MOMENTUM SIGNALS
   ====================================================================== */
function MomentumSignals(){
  const [dirFilter,setDirFilter]=useState('All');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [provFilter,setProvFilter]=useState('All');
  const [minConsec,setMinConsec]=useState(1);
  const [sortCol,setSortCol]=useState('momentum');
  const [sortDir,setSortDir]=useState(-1);
  const [selectedCompany,setSelectedCompany]=useState(null);

  const momentum=useMemo(()=>COMPANIES.map(c=>{
    const provScores=PROVIDERS.map((_p,pi)=>{
      let score=0,consec=0,streak=0;
      for(let qi=1;qi<QUARTERS.length;qi++){
        const diff=c.ratings[pi][qi-1]-c.ratings[pi][qi];
        if(diff>0){score+=1;streak++;consec=Math.max(consec,streak);}
        else if(diff<0){score-=1;streak=0;}
        else{streak=0;}
      }
      return{score:Math.max(-5,Math.min(5,score)),consec};
    });
    const avgMomentum=provScores.reduce((s,x)=>s+x.score,0)/PROVIDERS.length;
    const maxConsec=Math.max(...provScores.map(x=>x.consec));
    const sparkData=QUARTERS.map((_q,qi)=>PROVIDERS.reduce((s,_p,pi)=>s+(7-c.ratings[pi][qi]),0)/PROVIDERS.length);
    return{...c,momentum:+avgMomentum.toFixed(2),provScores,maxConsec,sparkData,direction:avgMomentum>0.3?'Positive':avgMomentum<-0.3?'Negative':'Neutral'};
  }),[]);

  const filtered=useMemo(()=>{
    let d=[...momentum];
    if(dirFilter!=='All')d=d.filter(x=>x.direction===dirFilter);
    if(sectorFilter!=='All')d=d.filter(x=>x.sector===sectorFilter);
    if(provFilter!=='All'){const pi=PROVIDERS.indexOf(provFilter);d=d.filter(x=>Math.abs(x.provScores[pi].score)>0);}
    d=d.filter(x=>x.maxConsec>=minConsec);
    d.sort((a,b)=>sortDir*(a[sortCol]>b[sortCol]?1:a[sortCol]<b[sortCol]?-1:0));
    return d;
  },[momentum,dirFilter,sectorFilter,provFilter,minConsec,sortCol,sortDir]);

  const portfolioIndex=useMemo(()=>QUARTERS.map((q,qi)=>{
    const avg=COMPANIES.reduce((s,c)=>s+PROVIDERS.reduce((ss,_p,pi)=>ss+(7-c.ratings[pi][qi]),0)/PROVIDERS.length,0)/COMPANIES.length;
    return{q,index:+avg.toFixed(2)};
  }),[]);

  const breadth=useMemo(()=>{
    const pos=momentum.filter(x=>x.direction==='Positive').length;
    const neg=momentum.filter(x=>x.direction==='Negative').length;
    const neu=momentum.filter(x=>x.direction==='Neutral').length;
    return{pos,neg,neu,total:momentum.length,posP:((pos/momentum.length)*100).toFixed(1),negP:((neg/momentum.length)*100).toFixed(1)};
  },[momentum]);

  const sectorHeatmap=useMemo(()=>SECTORS.map(sec=>{
    const inSec=momentum.filter(x=>x.sector===sec);
    if(!inSec.length)return null;
    const row={sector:sec,count:inSec.length};
    PROVIDERS.forEach((p,pi)=>{row[p]=+(inSec.reduce((s,x)=>s+x.provScores[pi].score,0)/inSec.length).toFixed(2);});
    return row;
  }).filter(Boolean),[momentum]);

  const heatVals=sectorHeatmap.flatMap(r=>PROVIDERS.map(p=>r[p]));
  const heatMin=Math.min(...heatVals),heatMax=Math.max(...heatVals);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d*-1);else{setSortCol(col);setSortDir(-1);}};

  return(
    <div>
      {/* Filters */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <div style={{display:'flex',gap:4}}>
          {['All','Positive','Negative','Neutral'].map(d=><button key={d} style={sty.pill(dirFilter===d)} onClick={()=>setDirFilter(d)}>{d}</button>)}
        </div>
        <select style={sty.inp} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
          <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={sty.inp} value={provFilter} onChange={e=>setProvFilter(e.target.value)}>
          <option value="All">All Providers</option>{PROVIDERS.map(p=><option key={p}>{p}</option>)}
        </select>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:12,color:T.textSec}}>Min Consecutive Q:</span>
          <input type="range" min={1} max={8} value={minConsec} onChange={e=>setMinConsec(+e.target.value)} style={{...sty.slider,width:100}}/>
          <span style={{fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{minConsec}</span>
        </div>
      </div>

      {/* Breadth KPIs */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Positive Momentum" value={`${breadth.pos} (${breadth.posP}%)`} color={T.green}/>
        <KPI label="Negative Momentum" value={`${breadth.neg} (${breadth.negP}%)`} color={T.red}/>
        <KPI label="Neutral" value={breadth.neu} color={T.textMut}/>
        <KPI label="Showing" value={filtered.length} color={T.navy}/>
      </div>

      {/* Portfolio index + Breadth charts */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={sty.card}>
          <div style={sty.cardT}>Portfolio Momentum Index (12Q)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={portfolioIndex}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} domain={['auto','auto']}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Area type="monotone" dataKey="index" stroke={T.navy} fill={T.navy+'20'} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardT}>Momentum Breadth Indicator</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{name:'Portfolio',positive:breadth.pos,negative:breadth.neg,neutral:breadth.neu}]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" width={60} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="positive" stackId="a" fill={T.green} name="Positive"/>
              <Bar dataKey="neutral" stackId="a" fill={T.textMut} name="Neutral"/>
              <Bar dataKey="negative" stackId="a" fill={T.red} name="Negative"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector x Provider heatmap */}
      <div style={{...sty.card,marginBottom:20}}>
        <div style={sty.cardT}>Sector x Provider Momentum Heatmap</div>
        <div style={{overflowX:'auto'}}>
          <table style={{...sty.tbl,minWidth:750}}>
            <thead><tr><th style={sty.th}>Sector</th><th style={{...sty.th,textAlign:'center',fontSize:10}}>N</th>{PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',fontSize:10}}>{p}</th>)}</tr></thead>
            <tbody>{sectorHeatmap.map(row=><tr key={row.sector}>
              <td style={{...sty.td,fontWeight:600,fontSize:11}}>{row.sector}</td>
              <td style={{...sty.td,textAlign:'center',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{row.count}</td>
              {PROVIDERS.map(p=>{
                const v=row[p];
                return <td key={p} style={{...sty.td,padding:0}}>
                  <div style={sty.heatC(v,heatMin,heatMax)}>{v>0?'+':''}{v}</div>
                </td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>
      </div>

      {/* Company momentum table */}
      <div style={sty.card}>
        <div style={sty.cardT}>Company Momentum Table ({filtered.length} companies)</div>
        <div style={{overflowX:'auto',maxHeight:600}}>
          <table style={sty.tbl}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort('name')}>Company {sortCol==='name'?(sortDir>0?'\u25B2':'\u25BC'):''}</th>
              <th style={sty.th}>Sector</th>
              <th style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort('momentum')}>Score {sortCol==='momentum'?(sortDir>0?'\u25B2':'\u25BC'):''}</th>
              <th style={sty.th}>Direction</th>
              <th style={sty.th}>Trend</th>
              <th style={sty.th}>Consec Q</th>
              {PROVIDERS.map(p=><th key={p} style={{...sty.th,fontSize:10}}>{p}</th>)}
            </tr></thead>
            <tbody>{filtered.slice(0,60).map(c=>(
              <tr key={c.id} onClick={()=>setSelectedCompany(c)} style={{cursor:'pointer',transition:'background 0.1s'}}>
                <td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                <td style={{...sty.td,fontSize:11}}>{c.sector}</td>
                <td style={{...sty.td,fontFamily:T.mono,fontWeight:700,color:c.momentum>0?T.green:c.momentum<0?T.red:T.textMut}}>{c.momentum>0?'+':''}{c.momentum}</td>
                <td style={sty.td}><span style={sty.badge(c.direction==='Positive'?T.green:c.direction==='Negative'?T.red:T.textMut)}>{c.direction}</span></td>
                <td style={sty.td}><Spark data={c.sparkData} color={c.momentum>=0?T.green:T.red}/></td>
                <td style={{...sty.td,fontFamily:T.mono,textAlign:'center'}}>{c.maxConsec}</td>
                {c.provScores.map((ps,pi)=><td key={pi} style={{...sty.td,fontFamily:T.mono,fontSize:11,color:ps.score>0?T.green:ps.score<0?T.red:T.textMut,textAlign:'center'}}>{ps.score>0?'+':''}{ps.score}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Side panel */}
      {selectedCompany&&<div style={sty.overlay} onClick={()=>setSelectedCompany(null)}>
        <div style={sty.sideP} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div>
              <h3 style={{margin:0,color:T.navy,fontSize:18}}>{selectedCompany.name}</h3>
              <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{selectedCompany.sector} | ${selectedCompany.marketCap}B</div>
            </div>
            <button style={{...sty.btn,background:T.surfaceH,color:T.textSec}} onClick={()=>setSelectedCompany(null)}>Close</button>
          </div>

          <div style={{display:'flex',gap:12,marginBottom:16}}>
            <KPI label="Momentum" value={(selectedCompany.momentum>0?'+':'')+selectedCompany.momentum} color={selectedCompany.momentum>0?T.green:T.red}/>
            <KPI label="Direction" value={selectedCompany.direction} color={selectedCompany.direction==='Positive'?T.green:selectedCompany.direction==='Negative'?T.red:T.textMut}/>
            <KPI label="Max Consec" value={selectedCompany.maxConsec+'Q'} color={T.navy}/>
          </div>

          <div style={{marginBottom:20}}>
            <div style={sty.cardT}>Provider Momentum Decomposition</div>
            {PROVIDERS.map((p,pi)=>{
              const ps=selectedCompany.provScores[pi];
              const pct=Math.abs(ps.score)/5*100;
              return <div key={p} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{width:100,fontSize:11,fontWeight:600,color:T.textSec}}>{p}</span>
                <div style={{flex:1,height:16,background:T.surfaceH,borderRadius:4,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',left:ps.score>=0?'50%':'auto',right:ps.score<0?'50%':'auto',width:`${pct/2}%`,height:'100%',background:ps.score>0?T.green:ps.score<0?T.red:T.textMut,borderRadius:4,transition:'all 0.3s'}}/>
                </div>
                <span style={{fontFamily:T.mono,fontSize:12,fontWeight:600,color:ps.score>0?T.green:ps.score<0?T.red:T.textMut,width:35,textAlign:'right'}}>{ps.score>0?'+':''}{ps.score}</span>
              </div>;
            })}
          </div>

          <div style={{marginBottom:20}}>
            <div style={sty.cardT}>12-Quarter Rating Trajectory</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={QUARTERS.map((q,qi)=>({q,...PROVIDERS.reduce((o,p,pi)=>({...o,[p]:7-selectedCompany.ratings[pi][qi]}),{})}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}}/>
                <YAxis domain={[1,7]} ticks={[1,2,3,4,5,6,7]} tickFormatter={v=>RATINGS[7-v]||''} tick={{fontSize:9}}/>
                <Tooltip formatter={v=>rLabel(7-v)} contentStyle={{fontSize:11,borderRadius:8}}/>
                {PROVIDERS.map((p,pi)=><Line key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[pi]} strokeWidth={2} dot={{r:2}}/>)}
                <Legend wrapperStyle={{fontSize:10}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{marginBottom:20}}>
            <div style={sty.cardT}>Trigger Events</div>
            {ESG_EVENTS.filter((_ev,i)=>sr(selectedCompany.id*50+i)>0.6).slice(0,4).map(ev=>(
              <div key={ev.id} style={{padding:10,borderRadius:6,background:T.surfaceH,marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{ev.name} <span style={sty.badge(ev.type==='Environmental'?T.green:ev.type==='Social'?T.amber:T.navyL)}>{ev.type}</span></div>
                <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{ev.quarter} | {ev.desc}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8}}>
            <button style={{...sty.btn,background:T.green+'20',color:T.green,flex:1,padding:'10px'}}>Engage</button>
            <button style={{...sty.btn,background:T.amber+'20',color:T.amber,flex:1,padding:'10px'}}>Monitor</button>
            <button style={{...sty.btn,background:T.red+'20',color:T.red,flex:1,padding:'10px'}}>Divest</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* ======================================================================
   TAB 3 — PROVIDER LEAD-LAG
   ====================================================================== */
function ProviderLeadLag(){
  const [viewMode,setViewMode]=useState('heatmap');
  const [cellClick,setCellClick]=useState(null);
  const [selectedEvent,setSelectedEvent]=useState(null);
  const [eventTypeFilter,setEventTypeFilter]=useState('All');

  const leadLag=useMemo(()=>{
    const mat=Array.from({length:6},()=>Array(6).fill(0));
    const counts=Array.from({length:6},()=>Array(6).fill(0));
    COMPANIES.forEach(c=>{
      for(let pi=0;pi<6;pi++){
        for(let pj=0;pj<6;pj++){
          if(pi===pj)continue;
          for(let qi=1;qi<QUARTERS.length;qi++){
            const diffI=c.ratings[pi][qi]-c.ratings[pi][qi-1];
            if(diffI===0)continue;
            for(let qj=qi+1;qj<Math.min(qi+4,QUARTERS.length);qj++){
              const diffJ=c.ratings[pj][qj]-c.ratings[pj][qj-1];
              if((diffI>0&&diffJ>0)||(diffI<0&&diffJ<0)){
                mat[pi][pj]+=(qj-qi);counts[pi][pj]++;break;
              }
            }
          }
        }
      }
    });
    return mat.map((row,i)=>row.map((v,j)=>i===j?0:counts[i][j]>0?+(v/counts[i][j]).toFixed(2):0));
  },[]);

  const firstMover=useMemo(()=>{
    const leads=Array(6).fill(0);
    const speeds=Array.from({length:6},()=>[]);
    COMPANIES.forEach(c=>{
      for(let qi=1;qi<QUARTERS.length;qi++){
        let first=-1;
        PROVIDERS.forEach((_p,pi)=>{
          const diff=Math.abs(c.ratings[pi][qi]-c.ratings[pi][qi-1]);
          if(diff>0&&first===-1)first=pi;
        });
        if(first>=0){leads[first]++;speeds[first].push(qi);}
      }
    });
    return PROVIDERS.map((p,i)=>({provider:p,leads:leads[i],avgSpeed:speeds[i].length?+(speeds[i].reduce((a,b)=>a+b,0)/speeds[i].length).toFixed(2):0})).sort((a,b)=>b.leads-a.leads);
  },[]);

  const eventReactions=useMemo(()=>ESG_EVENTS.map(ev=>{
    const qIdx=QUARTERS.indexOf(ev.quarter);
    if(qIdx<0||qIdx>=QUARTERS.length-1)return{...ev,reactions:PROVIDERS.map(()=>({lag:'-',speed:99})),fastestProvider:'N/A'};
    const reactions=PROVIDERS.map((_p,pi)=>{
      let reactQ=0,cnt=0;
      const affected=COMPANIES.filter(c=>sr(c.id*ev.id+pi*7)>0.5);
      affected.forEach(c=>{
        for(let q=qIdx;q<Math.min(qIdx+4,QUARTERS.length-1);q++){
          if(c.ratings[pi][q+1]!==c.ratings[pi][q]){reactQ+=q-qIdx+1;cnt++;break;}
        }
      });
      return{lag:cnt?+(reactQ/cnt).toFixed(1):'-',speed:cnt?reactQ/cnt:99};
    });
    const fastest=reactions.reduce((m,r,i)=>r.speed<m.speed?{idx:i,speed:r.speed}:m,{idx:0,speed:99});
    return{...ev,reactions,fastestProvider:PROVIDERS[fastest.idx]};
  }),[]);

  const filteredEvents=eventTypeFilter==='All'?eventReactions:eventReactions.filter(e=>e.type===eventTypeFilter);

  const speedDist=useMemo(()=>{
    const buckets=[0,0.5,1,1.5,2,2.5,3,3.5,4];
    return buckets.map(b=>{
      const row={bucket:`${b}-${b+0.5}Q`};
      PROVIDERS.forEach((p,pi)=>{
        let count=0;
        COMPANIES.forEach(c=>{
          for(let qi=1;qi<QUARTERS.length;qi++){
            if(c.ratings[pi][qi]!==c.ratings[pi][qi-1]){
              const speed=sr(c.id*101+pi*21+qi)*4;
              if(speed>=b&&speed<b+0.5)count++;
            }
          }
        });
        row[p]=count;
      });
      return row;
    });
  },[]);

  const cellCompanies=useMemo(()=>{
    if(!cellClick)return[];
    const{pi,pj}=cellClick;
    return COMPANIES.slice(0,10).map(c=>({
      name:c.name,
      data:QUARTERS.map((q,qi)=>({q,[PROVIDERS[pi]]:7-c.ratings[pi][qi],[PROVIDERS[pj]]:7-c.ratings[pj][qi]}))
    }));
  },[cellClick]);

  return(
    <div>
      {/* View toggle */}
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        <button style={sty.pill(viewMode==='heatmap')} onClick={()=>setViewMode('heatmap')}>Heatmap View</button>
        <button style={sty.pill(viewMode==='bar')} onClick={()=>setViewMode('bar')}>Bar Chart View</button>
        {cellClick&&<button style={{...sty.btn,background:T.red+'20',color:T.red,marginLeft:12}} onClick={()=>setCellClick(null)}>Clear selection</button>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:16,marginBottom:20}}>
        {/* Lead-Lag matrix/chart */}
        <div style={sty.card}>
          <div style={sty.cardT}>6x6 Provider Lead-Lag (Avg Quarters Provider A Leads Provider B)</div>
          {viewMode==='heatmap'?(
            <table style={{...sty.tbl,textAlign:'center'}}>
              <thead><tr><th style={sty.th}>Leader \ Follower</th>{PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',fontSize:10}}>{p}</th>)}</tr></thead>
              <tbody>{PROVIDERS.map((p,pi)=><tr key={p}>
                <td style={{...sty.td,fontWeight:600,fontSize:11}}>{p}</td>
                {PROVIDERS.map((_p2,pj)=><td key={pj} style={{...sty.td,padding:0}} onClick={()=>{if(pi!==pj)setCellClick({pi,pj});}}>
                  {pi===pj?<div style={{padding:8,background:T.surfaceH,color:T.textMut,fontSize:11}}>--</div>:
                  <div style={{padding:8,textAlign:'center',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono,
                    background:leadLag[pi][pj]>1.5?T.navy:leadLag[pi][pj]>0.8?T.navyL+'50':T.surfaceH,
                    color:leadLag[pi][pj]>1.5?'#fff':T.text,cursor:'pointer',
                    border:cellClick&&cellClick.pi===pi&&cellClick.pj===pj?`2px solid ${T.gold}`:'2px solid transparent'
                  }}>{leadLag[pi][pj]}Q</div>}
                </td>)}
              </tr>)}</tbody>
            </table>
          ):(
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={PROVIDERS.map((p,pi)=>({provider:p,avgLead:+(leadLag[pi].reduce((a,b)=>a+b,0)/(PROVIDERS.length-1)).toFixed(2)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="provider" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Avg Lead (Q)',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                <Bar dataKey="avgLead" fill={T.navy} radius={[4,4,0,0]} name="Avg Lead (Q)">
                  {PROVIDERS.map((_p,i)=><Cell key={i} fill={PROV_COLORS[i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* First Mover leaderboard */}
        <div style={sty.card}>
          <div style={sty.cardT}>First Mover Leaderboard</div>
          <table style={sty.tbl}>
            <thead><tr><th style={sty.th}>Rank</th><th style={sty.th}>Provider</th><th style={sty.th}>Lead Count</th><th style={sty.th}>Avg Speed</th></tr></thead>
            <tbody>{firstMover.map((fm,i)=><tr key={fm.provider}>
              <td style={{...sty.td,fontWeight:700,color:i===0?T.gold:i===1?T.textSec:T.textMut}}>#{i+1}</td>
              <td style={{...sty.td,fontWeight:600}}>{fm.provider}</td>
              <td style={{...sty.td,fontFamily:T.mono,fontWeight:600}}>{fm.leads}</td>
              <td style={{...sty.td,fontFamily:T.mono}}>{fm.avgSpeed}Q</td>
            </tr>)}</tbody>
          </table>
          <div style={{padding:12,background:T.surfaceH,borderRadius:8,marginTop:12}}>
            <div style={{fontSize:11,color:T.textSec}}>The First Mover leaderboard counts how often each provider changes a rating before any other provider follows suit within 3 quarters.</div>
          </div>
        </div>
      </div>

      {/* Cell click expansion: provider overlay */}
      {cellClick&&<div style={{...sty.card,marginBottom:20}}>
        <div style={sty.cardT}>Rating Overlay: {PROVIDERS[cellClick.pi]} (blue) vs {PROVIDERS[cellClick.pj]} (gold) — 10 Companies</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {cellCompanies.slice(0,6).map(cc=>(
            <div key={cc.name} style={{padding:10,borderRadius:8,background:T.surfaceH}}>
              <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:T.navy}}>{cc.name}</div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={cc.data}>
                  <XAxis dataKey="q" tick={{fontSize:7,fill:T.textSec}}/>
                  <YAxis domain={[1,7]} tick={{fontSize:7}} tickFormatter={v=>RATINGS[7-v]||''}/>
                  <Tooltip contentStyle={{fontSize:9,borderRadius:6}} formatter={v=>rLabel(7-v)}/>
                  <Line type="monotone" dataKey={PROVIDERS[cellClick.pi]} stroke={T.navy} strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey={PROVIDERS[cellClick.pj]} stroke={T.gold} strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>}

      {/* ESG Events timeline */}
      <div style={{...sty.card,marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={sty.cardT}>15 ESG Events — Provider Reaction Speed</div>
          <div style={{display:'flex',gap:4}}>
            {['All','Environmental','Social','Governance'].map(t=><button key={t} style={sty.pill(eventTypeFilter===t)} onClick={()=>setEventTypeFilter(t)}>{t}</button>)}
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={sty.tbl}>
            <thead><tr>
              <th style={sty.th}>Event</th><th style={sty.th}>Type</th><th style={sty.th}>Quarter</th>
              {PROVIDERS.map(p=><th key={p} style={{...sty.th,textAlign:'center',fontSize:10}}>{p}</th>)}
              <th style={sty.th}>Fastest</th>
            </tr></thead>
            <tbody>{filteredEvents.map(ev=>(
              <tr key={ev.id} onClick={()=>setSelectedEvent(selectedEvent?.id===ev.id?null:ev)} style={{cursor:'pointer',background:selectedEvent?.id===ev.id?T.surfaceH:'transparent'}}>
                <td style={{...sty.td,fontWeight:600,fontSize:11,maxWidth:180}}>{ev.name}</td>
                <td style={sty.td}><span style={sty.badge(ev.type==='Environmental'?T.green:ev.type==='Social'?T.amber:T.navyL)}>{ev.type}</span></td>
                <td style={{...sty.td,fontFamily:T.mono,fontSize:11}}>{ev.quarter}</td>
                {ev.reactions.map((r,i)=><td key={i} style={{...sty.td,textAlign:'center',fontFamily:T.mono,fontSize:11,fontWeight:600,color:r.lag==='-'?T.textMut:r.speed<1.5?T.green:r.speed<2.5?T.amber:T.red}}>{r.lag}{r.lag!=='-'?'Q':''}</td>)}
                <td style={{...sty.td,fontWeight:700,color:T.green,fontSize:11}}>{ev.fastestProvider}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {selectedEvent&&<div style={{marginTop:12,padding:14,background:T.surfaceH,borderRadius:8}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{selectedEvent.name}</div>
          <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{selectedEvent.desc}</div>
          <div style={{fontSize:11,color:T.textMut,marginTop:4}}>First reactor: <b style={{color:T.green}}>{selectedEvent.fastestProvider}</b> | Quarter: {selectedEvent.quarter} | Type: {selectedEvent.type}</div>
        </div>}
      </div>

      {/* Speed distribution histogram */}
      <div style={sty.card}>
        <div style={sty.cardT}>Reaction Speed Distribution by Provider (Histogram)</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={speedDist}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="bucket" tick={{fontSize:9,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Count',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            {PROVIDERS.map((p,i)=><Bar key={p} dataKey={p} fill={PROV_COLORS[i]} name={p}/>)}
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ======================================================================
   TAB 4 — ALPHA SIGNAL BUILDER
   ====================================================================== */
function AlphaSignalBuilder(){
  const [threshold,setThreshold]=useState(1.5);
  const [holdPeriod,setHoldPeriod]=useState(4);
  const [rebalFreq,setRebalFreq]=useState(1);
  const [longShort,setLongShort]=useState(false);
  const [signalSort,setSignalSort]=useState({col:'pnl',dir:-1});

  const signals=useMemo(()=>COMPANIES.map(c=>{
    let momentum=0;
    PROVIDERS.forEach((_p,pi)=>{
      for(let qi=1;qi<QUARTERS.length;qi++){
        const diff=c.ratings[pi][qi-1]-c.ratings[pi][qi];
        momentum+=diff;
      }
    });
    momentum=+(momentum/PROVIDERS.length).toFixed(2);
    const signal=Math.abs(momentum)>=threshold?(momentum>0?'Long':'Short'):'Neutral';
    const entryQ=QUARTERS[Math.max(0,Math.floor(sr(c.id*77)*6))];
    const pnl=signal==='Long'?+(sr(c.id*123)*30-5).toFixed(2):signal==='Short'?+(sr(c.id*456)*20-15).toFixed(2):0;
    return{...c,momentum,signal,entryQ,pnl};
  }),[threshold]);

  const activeSignals=useMemo(()=>signals.filter(s=>s.signal!=='Neutral'),[signals]);
  const longSignals=useMemo(()=>signals.filter(s=>s.signal==='Long'),[signals]);
  const shortSignals=useMemo(()=>signals.filter(s=>s.signal==='Short'),[signals]);

  const sortedSignals=useMemo(()=>{
    const arr=[...activeSignals];
    arr.sort((a,b)=>signalSort.dir*(a[signalSort.col]>b[signalSort.col]?1:a[signalSort.col]<b[signalSort.col]?-1:0));
    return arr;
  },[activeSignals,signalSort]);

  const backtest=useMemo(()=>{
    let equity=100;
    const curve=QUARTERS.map((q,qi)=>{
      const ret=activeSignals.reduce((s,c)=>{
        const avgChange=PROVIDERS.reduce((ss,_p,pi)=>ss+(c.ratings[pi][Math.min(qi,QUARTERS.length-1)]-c.ratings[pi][Math.max(0,qi-1)]),0)/PROVIDERS.length;
        return s+(c.signal==='Long'?avgChange*0.5:longShort?-avgChange*0.3:0);
      },0)/(activeSignals.length||1);
      equity*=(1+ret/100*(holdPeriod/4));
      return{q,equity:+equity.toFixed(2),return:+(ret*(holdPeriod/4)).toFixed(2)};
    });

    let peak=100;
    const drawdown=curve.map(c=>{peak=Math.max(peak,c.equity);return{q:c.q,dd:+((c.equity-peak)/peak*100).toFixed(2)};});

    const returns=curve.map(c=>c.return);
    const avgRet=returns.reduce((a,b)=>a+b,0)/returns.length;
    const stdDev=Math.sqrt(returns.reduce((s,r)=>s+(r-avgRet)**2,0)/returns.length)||1;
    const downDev=Math.sqrt(returns.filter(r=>r<0).reduce((s,r)=>s+r*r,0)/(returns.filter(r=>r<0).length||1))||1;
    const maxDD=Math.min(...drawdown.map(d=>d.dd));
    const totalRet=curve.length?curve[curve.length-1].equity-100:0;
    const wins=returns.filter(r=>r>0).length;
    const losses=returns.filter(r=>r<0).length;

    return{
      curve,drawdown,
      sharpe:+(avgRet/stdDev*Math.sqrt(4)).toFixed(2),
      sortino:+(avgRet/downDev*Math.sqrt(4)).toFixed(2),
      hitRate:returns.length?+((wins/returns.length)*100).toFixed(1):0,
      maxDD:maxDD.toFixed(2),
      totalReturn:totalRet.toFixed(2),
      annualized:+(totalRet/3).toFixed(2),
      calmar:maxDD!==0?+((totalRet/3)/Math.abs(maxDD)).toFixed(2):0,
      winLoss:losses?+(wins/losses).toFixed(2):wins,
    };
  },[activeSignals,holdPeriod,longShort]);

  const quarterlyReturns=useMemo(()=>QUARTERS.map((q,qi)=>({q,return:backtest.curve[qi]?.return||0})),[backtest]);

  const sectorAttrib=useMemo(()=>{
    const m={};
    activeSignals.forEach(c=>{
      if(!m[c.sector])m[c.sector]={sector:c.sector,pnl:0,count:0};
      m[c.sector].pnl+=c.pnl;m[c.sector].count++;
    });
    return Object.values(m).map(s=>({...s,avgPnl:+(s.pnl/s.count).toFixed(2)})).sort((a,b)=>b.avgPnl-a.avgPnl);
  },[activeSignals]);

  const factorExposures=useMemo(()=>{
    const factors=['Momentum','Value','Quality','Size','Volatility','ESG Score'];
    return factors.map((f,i)=>({factor:f,exposure:+(sr(i*777+threshold*100)*2-1).toFixed(2),contribution:+(sr(i*888+holdPeriod*50)*4-2).toFixed(2)}));
  },[threshold,holdPeriod]);

  const exportCSV=useCallback(()=>{
    const headers=['Company','Sector','Signal','Momentum','Entry Quarter','PnL (%)','Market Cap ($B)'];
    const rows=activeSignals.map(s=>[s.name,s.sector,s.signal,s.momentum,s.entryQ,s.pnl,s.marketCap]);
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='alpha_signals_export.csv';a.click();
    URL.revokeObjectURL(url);
  },[activeSignals]);

  const handleSignalSort=(col)=>{
    if(signalSort.col===col)setSignalSort(s=>({...s,dir:s.dir*-1}));
    else setSignalSort({col,dir:-1});
  };

  return(
    <div>
      {/* Strategy configuration */}
      <div style={{...sty.card,marginBottom:20}}>
        <div style={sty.cardT}>Strategy Configuration</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>Momentum Threshold</div>
            <input type="range" min={0.5} max={5} step={0.5} value={threshold} onChange={e=>setThreshold(+e.target.value)} style={sty.slider}/>
            <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono,textAlign:'center',marginTop:4}}>{threshold}</div>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>Holding Period</div>
            <input type="range" min={1} max={8} value={holdPeriod} onChange={e=>setHoldPeriod(+e.target.value)} style={sty.slider}/>
            <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono,textAlign:'center',marginTop:4}}>{holdPeriod}Q</div>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>Rebalance Frequency</div>
            <input type="range" min={1} max={4} value={rebalFreq} onChange={e=>setRebalFreq(+e.target.value)} style={sty.slider}/>
            <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono,textAlign:'center',marginTop:4}}>Every {rebalFreq}Q</div>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>Strategy Type</div>
            <button style={{...sty.pill(true),padding:'10px 20px',fontSize:13,width:'100%'}} onClick={()=>setLongShort(!longShort)}>
              {longShort?'Long-Short':'Long Only'}
            </button>
            <div style={{fontSize:10,color:T.textMut,textAlign:'center',marginTop:4}}>Click to toggle</div>
          </div>
        </div>
      </div>

      {/* 8 KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <KPI label="Sharpe Ratio" value={backtest.sharpe} color={backtest.sharpe>1?T.green:T.amber}/>
        <KPI label="Sortino Ratio" value={backtest.sortino} color={backtest.sortino>1?T.green:T.amber}/>
        <KPI label="Hit Rate" value={backtest.hitRate+'%'} color={backtest.hitRate>50?T.green:T.red}/>
        <KPI label="Max Drawdown" value={backtest.maxDD+'%'} color={T.red}/>
        <KPI label="Total Return" value={(backtest.totalReturn>0?'+':'')+backtest.totalReturn+'%'} color={backtest.totalReturn>0?T.green:T.red}/>
        <KPI label="Annualized" value={(backtest.annualized>0?'+':'')+backtest.annualized+'%'} color={backtest.annualized>0?T.green:T.red}/>
        <KPI label="Calmar Ratio" value={backtest.calmar} color={backtest.calmar>1?T.green:T.amber}/>
        <KPI label="Win/Loss Ratio" value={backtest.winLoss} color={backtest.winLoss>1?T.green:T.red}/>
      </div>

      {/* Equity curve + Drawdown */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={sty.card}>
          <div style={sty.cardT}>Equity Curve (Backtest)</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={backtest.curve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} domain={['auto','auto']}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v,'Equity']}/>
              <Area type="monotone" dataKey="equity" stroke={T.navy} fill={T.navy+'20'} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardT}>Drawdown Chart</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={backtest.drawdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v+'%','Drawdown']}/>
              <Area type="monotone" dataKey="dd" stroke={T.red} fill={T.red+'20'} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quarterly returns heatmap + Sector attribution */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={sty.card}>
          <div style={sty.cardT}>Quarterly Returns</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={quarterlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Return %',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v+'%','Return']}/>
              <Bar dataKey="return" name="Return (%)" radius={[4,4,0,0]}>
                {quarterlyReturns.map((d,i)=><Cell key={i} fill={d.return>=0?T.green:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardT}>Sector Attribution</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={sectorAttrib.slice(0,10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="sector" width={100} tick={{fontSize:9,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v+'%','Avg PnL']}/>
              <Bar dataKey="avgPnl" name="Avg PnL (%)" radius={[0,4,4,0]}>
                {sectorAttrib.slice(0,10).map((d,i)=><Cell key={i} fill={d.avgPnl>=0?T.green:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk decomposition: Factor exposures */}
      <div style={{...sty.card,marginBottom:20}}>
        <div style={sty.cardT}>Risk Decomposition: Factor Exposures</div>
        <table style={sty.tbl}>
          <thead><tr>
            <th style={sty.th}>Factor</th><th style={sty.th}>Exposure</th><th style={sty.th}>Contribution (%)</th><th style={sty.th}>Visual</th>
          </tr></thead>
          <tbody>{factorExposures.map(f=>(
            <tr key={f.factor}>
              <td style={{...sty.td,fontWeight:600}}>{f.factor}</td>
              <td style={{...sty.td,fontFamily:T.mono,fontWeight:600,color:f.exposure>0?T.green:f.exposure<0?T.red:T.textMut}}>{f.exposure>0?'+':''}{f.exposure}</td>
              <td style={{...sty.td,fontFamily:T.mono,color:f.contribution>0?T.green:f.contribution<0?T.red:T.textMut}}>{f.contribution>0?'+':''}{f.contribution}%</td>
              <td style={sty.td}>
                <div style={{width:140,height:14,background:T.surfaceH,borderRadius:4,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',left:f.exposure>=0?'50%':'auto',right:f.exposure<0?'50%':'auto',width:`${Math.abs(f.exposure)/2*50}%`,height:'100%',background:f.exposure>0?T.green:T.red,borderRadius:4,transition:'all 0.3s'}}/>
                  <div style={{position:'absolute',left:'50%',top:0,width:1,height:'100%',background:T.borderL}}/>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Signal table with export */}
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={sty.cardT}>Signal Table — {activeSignals.length} active signals / {signals.length} companies</div>
          <button style={{...sty.btn,background:T.navy,color:'#fff',padding:'8px 20px'}} onClick={exportCSV}>Export Signal List CSV</button>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <KPI label="Long Signals" value={longSignals.length} color={T.green}/>
          <KPI label="Short Signals" value={shortSignals.length} color={T.red}/>
          <KPI label="Threshold" value={threshold} color={T.navy}/>
          <KPI label="Avg Signal PnL" value={(activeSignals.reduce((s,c)=>s+c.pnl,0)/(activeSignals.length||1)).toFixed(2)+'%'} color={T.amber}/>
        </div>

        <div style={{overflowX:'auto',maxHeight:520}}>
          <table style={sty.tbl}>
            <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}><tr>
              <th style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSignalSort('name')}>Company</th>
              <th style={sty.th}>Sector</th>
              <th style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSignalSort('signal')}>Signal</th>
              <th style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSignalSort('momentum')}>Momentum</th>
              <th style={sty.th}>Entry Q</th>
              <th style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSignalSort('pnl')}>PnL (%)</th>
              <th style={sty.th}>Mkt Cap ($B)</th>
            </tr></thead>
            <tbody>{sortedSignals.slice(0,80).map(s=>(
              <tr key={s.id}>
                <td style={{...sty.td,fontWeight:600}}>{s.name}</td>
                <td style={{...sty.td,fontSize:11}}>{s.sector}</td>
                <td style={sty.td}><span style={sty.badge(s.signal==='Long'?T.green:T.red)}>{s.signal}</span></td>
                <td style={{...sty.td,fontFamily:T.mono,fontWeight:600,color:s.momentum>0?T.green:T.red}}>{s.momentum>0?'+':''}{s.momentum}</td>
                <td style={{...sty.td,fontFamily:T.mono,fontSize:11}}>{s.entryQ}</td>
                <td style={{...sty.td,fontFamily:T.mono,fontWeight:700,color:s.pnl>0?T.green:s.pnl<0?T.red:T.textMut}}>{s.pnl>0?'+':''}{s.pnl}%</td>
                <td style={{...sty.td,fontFamily:T.mono}}>${s.marketCap}B</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
