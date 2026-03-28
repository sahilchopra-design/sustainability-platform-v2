import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Migration Tracker','Momentum Signals','Provider Lead-Lag','Alpha Signal Builder'];
const QUARTERS=['2024Q1','2024Q2','2024Q3','2024Q4','2025Q1','2025Q2','2025Q3','2025Q4'];
const PROVIDERS=['MSCI','Sustainalytics','ISS','CDP','Moody\'s','S&P Global'];
const PROV_COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL];
const RATINGS=['AAA','AA','A','BBB','BB','B','CCC'];
const SECTORS=['Technology','Healthcare','Energy','Financials','Industrials','Consumer','Utilities','Materials'];
const RATING_NUM={AAA:7,AA:6,A:5,BBB:4,BB:3,B:2,CCC:1};
const NUM_RATING={7:'AAA',6:'AA',5:'A',4:'BBB',3:'BB',2:'B',1:'CCC'};

const ESG_EVENTS=[
  {id:0,name:'EU CSRD Enforcement',quarter:'2024Q1',type:'Regulatory',severity:'High'},
  {id:1,name:'Major Oil Spill Incident',quarter:'2024Q1',type:'Environmental',severity:'Critical'},
  {id:2,name:'ISSB Standards Adopted',quarter:'2024Q2',type:'Regulatory',severity:'High'},
  {id:3,name:'Tech Labor Controversy',quarter:'2024Q2',type:'Social',severity:'Medium'},
  {id:4,name:'Green Bond Market Surge',quarter:'2024Q3',type:'Market',severity:'Medium'},
  {id:5,name:'SEC Climate Rule Final',quarter:'2024Q3',type:'Regulatory',severity:'High'},
  {id:6,name:'Scope 3 Reporting Scandal',quarter:'2024Q4',type:'Environmental',severity:'Critical'},
  {id:7,name:'AI Ethics Framework Launch',quarter:'2025Q1',type:'Governance',severity:'Medium'},
  {id:8,name:'Biodiversity COP Accord',quarter:'2025Q2',type:'Environmental',severity:'High'},
  {id:9,name:'Carbon Tax Expansion EU',quarter:'2025Q3',type:'Regulatory',severity:'High'}
];

const COMPANY_NAMES=['NovaTech','GreenPulse','AquaGen','SolarVista','BioHarvest','CloudNine','EcoForge','DataStream','WindCraft','TerraCore',
  'QuantumLeap','PureWater','ElectraGrid','NanoSynth','AgriSmart','CyberShield','OceanWave','FusionPower','MediCore','UrbanGreen',
  'SkyBridge','DeepMine','CleanAir','RoboFarm','GeneVault','SpaceLink','HydroFlow','SilverPeak','IronClad','PixelForge',
  'ThunderBolt','CrystalNet','BluePlanet','SwiftLogic','GoldLeaf','PrimeFuel','AlphaGrid','BetaWorks','GammaLabs','DeltaChem',
  'EpsilonAI','ZetaEnergy','ThetaMed','IotaStar','KappaFin','LambdaTech','MuBuild','NuPharm','XiMaterials','OmicronOps'];

const COMPANIES=Array.from({length:50},(_,i)=>({
  id:i,name:COMPANY_NAMES[i],
  sector:SECTORS[Math.floor(sr(i*13+5)*SECTORS.length)],
  ticker:COMPANY_NAMES[i].substring(0,4).toUpperCase(),
  mcap:Math.round((sr(i*41+7)*90+10)*100)/100,
  region:['North America','Europe','Asia Pacific','Emerging Markets'][Math.floor(sr(i*23+11)*4)]
}));

function genRatings(){
  const data={};
  COMPANIES.forEach(c=>{
    data[c.id]={};
    PROVIDERS.forEach((p,pi)=>{
      const base=Math.floor(sr(c.id*17+pi*31)*4)+2;
      const hist=[];
      let cur=Math.min(7,Math.max(1,base));
      QUARTERS.forEach((q,qi)=>{
        const r=sr(c.id*113+pi*47+qi*29);
        if(r<0.15&&cur<7) cur++;
        else if(r<0.28&&cur>1) cur--;
        hist.push({quarter:q,rating:NUM_RATING[cur],num:cur});
      });
      data[c.id][p]=hist;
    });
  });
  return data;
}

/* ── shared styles ── */
const btn=(active)=>({padding:'7px 16px',borderRadius:8,border:`1.5px solid ${active?T.navy:T.border}`,background:active?T.navy:T.surface,color:active?'#fff':T.text,fontFamily:T.font,fontSize:13,fontWeight:active?600:500,cursor:'pointer',transition:'all 0.2s'});
const card={background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
const badge=(color)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font});
const inp={padding:'6px 12px',borderRadius:7,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,outline:'none'};
const thStyle={padding:'8px 12px',textAlign:'left',fontSize:12,fontWeight:600,color:T.textSec,borderBottom:`2px solid ${T.border}`,fontFamily:T.font,position:'sticky',top:0,background:T.surface,zIndex:1};
const tdStyle={padding:'7px 12px',fontSize:13,borderBottom:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};
const kpiCard=(color)=>({...card,textAlign:'center',padding:16,borderTop:`3px solid ${color}`});

/* ── reusable mini components ── */
function MiniSparkline({data,width=100,height=24}){
  const min=Math.min(...data);const max=Math.max(...data);const range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*height}`).join(' ');
  const last=data[data.length-1];const first=data[0];
  const color=last>first?T.green:last<first?T.red:T.textMut;
  return <svg width={width} height={height} style={{display:'block'}}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}/></svg>;
}

function MultiCheck({options,selected,onChange,label}){
  return <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
    {label&&<span style={{fontSize:12,color:T.textSec,fontWeight:600,fontFamily:T.font,marginRight:4}}>{label}</span>}
    {options.map(o=>{const sel=selected.includes(o);return <button key={o} onClick={()=>onChange(sel?selected.filter(x=>x!==o):[...selected,o])} style={{...btn(sel),padding:'4px 12px',fontSize:12}}>{o}</button>;})}
  </div>;
}

function KPI({label,value,sub,color=T.navy}){
  return <div style={kpiCard(color)}>
    <div style={{fontSize:11,color:T.textSec,fontWeight:600,fontFamily:T.font,marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,color,fontFamily:T.mono}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2,fontFamily:T.font}}>{sub}</div>}
  </div>;
}

function ProgressBar({value,max,color=T.navy,height=6}){
  return <div style={{width:'100%',height,borderRadius:height/2,background:T.surfaceH,overflow:'hidden'}}>
    <div style={{width:`${Math.min(100,Math.max(5,(value/max)*100))}%`,height:'100%',borderRadius:height/2,background:color,transition:'width 0.4s ease'}}/>
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 1: Migration Tracker
   ══════════════════════════════════════════════════ */
function MigrationTrackerTab({ratings}){
  const[selQ,setSelQ]=useState(1);
  const[provFilter,setProvFilter]=useState([...PROVIDERS]);
  const[search,setSearch]=useState('');
  const[expanded,setExpanded]=useState(null);
  const[sortCol,setSortCol]=useState('name');
  const[sortDir,setSortDir]=useState(1);
  const[matrixHover,setMatrixHover]=useState(null);

  const fromQ=QUARTERS[selQ-1];const toQ=QUARTERS[selQ];

  const matrix=useMemo(()=>{
    const m={};
    RATINGS.forEach(from=>{m[from]={};RATINGS.forEach(to=>{m[from][to]=0;});});
    COMPANIES.forEach(c=>{
      provFilter.forEach(p=>{
        const hist=ratings[c.id][p];
        const fromR=hist[selQ-1].rating;const toR=hist[selQ].rating;
        m[fromR][toR]++;
      });
    });
    return m;
  },[selQ,provFilter,ratings]);

  const summary=useMemo(()=>{
    return provFilter.map(p=>{
      let up=0,down=0,same=0;
      COMPANIES.forEach(c=>{
        const hist=ratings[c.id][p];
        const diff=hist[selQ].num-hist[selQ-1].num;
        if(diff>0)up++;else if(diff<0)down++;else same++;
      });
      return{provider:p,up,down,same,net:up-down};
    });
  },[selQ,provFilter,ratings]);

  const periodStats=useMemo(()=>{
    let totalUp=0,totalDn=0,maxJump=0,maxJumpCo='';
    COMPANIES.forEach(c=>{
      provFilter.forEach(p=>{
        const h=ratings[c.id][p];
        const d=h[selQ].num-h[selQ-1].num;
        if(d>0)totalUp++;if(d<0)totalDn++;
        if(Math.abs(d)>maxJump){maxJump=Math.abs(d);maxJumpCo=c.name+' ('+p+')';}
      });
    });
    return{totalUp,totalDn,stability:Math.round((1-(totalUp+totalDn)/(COMPANIES.length*provFilter.length))*100),maxJump,maxJumpCo};
  },[selQ,provFilter,ratings]);

  const compList=useMemo(()=>{
    let list=COMPANIES.map(c=>{
      const changes=provFilter.map(p=>{
        const h=ratings[c.id][p];return h[selQ].num-h[selQ-1].num;
      });
      const avg=changes.reduce((a,b)=>a+b,0)/changes.length;
      const consensus=ratings[c.id][provFilter[0]]?ratings[c.id][provFilter[0]][selQ].rating:'N/A';
      const disagreement=provFilter.length>1?Math.max(...changes)-Math.min(...changes):0;
      return{...c,avgChange:avg,changes,consensus,disagreement};
    });
    if(search)list=list.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.ticker.toLowerCase().includes(search.toLowerCase())||c.sector.toLowerCase().includes(search.toLowerCase()));
    list.sort((a,b)=>sortCol==='name'?a.name.localeCompare(b.name)*sortDir:sortCol==='change'?(a.avgChange-b.avgChange)*sortDir:sortCol==='disagree'?(a.disagreement-b.disagreement)*sortDir:0);
    return list;
  },[selQ,provFilter,search,sortCol,sortDir,ratings]);

  const matrixMax=useMemo(()=>{let mx=0;RATINGS.forEach(f=>{RATINGS.forEach(t=>{if(matrix[f][t]>mx)mx=matrix[f][t];});});return mx||1;},[matrix]);

  return <div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec,fontFamily:T.font}}>Period:</span>
        <select value={selQ} onChange={e=>setSelQ(+e.target.value)} style={inp}>
          {QUARTERS.slice(1).map((q,i)=><option key={q} value={i+1}>{QUARTERS[i]} &rarr; {q}</option>)}
        </select>
      </div>
      <MultiCheck options={PROVIDERS} selected={provFilter} onChange={setProvFilter} label="Providers:"/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
      <KPI label="Upgrades" value={periodStats.totalUp} sub={`${fromQ} to ${toQ}`} color={T.green}/>
      <KPI label="Downgrades" value={periodStats.totalDn} sub={`${fromQ} to ${toQ}`} color={T.red}/>
      <KPI label="Stability" value={`${periodStats.stability}%`} sub="Companies unchanged" color={T.navy}/>
      <KPI label="Largest Jump" value={`${periodStats.maxJump} notch${periodStats.maxJump!==1?'es':''}`} sub={periodStats.maxJumpCo} color={T.amber}/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Migration Matrix: {fromQ} &rarr; {toQ}</h4>
        <p style={{fontSize:11,color:T.textMut,margin:'-4px 0 10px',fontFamily:T.font}}>Rows = origin rating, columns = destination. Darker cells = more migrations.</p>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',width:'100%',fontSize:12,fontFamily:T.mono}}>
            <thead><tr><th style={{...thStyle,fontSize:11}}>From \ To</th>{RATINGS.map(r=><th key={r} style={{...thStyle,textAlign:'center',fontSize:11}}>{r}</th>)}<th style={{...thStyle,textAlign:'center',fontSize:11}}>Total</th></tr></thead>
            <tbody>{RATINGS.map((from,fi)=>{
              const rowTotal=RATINGS.reduce((s,to)=>s+matrix[from][to],0);
              return <tr key={from}>
                <td style={{...tdStyle,fontWeight:700,color:T.navy}}>{from}</td>
                {RATINGS.map((to,ti)=>{const v=matrix[from][to];const intensity=v/matrixMax;
                  const isHover=matrixHover&&matrixHover.from===fi&&matrixHover.to===ti;
                  const isDiag=fi===ti;
                  const bg=isDiag?T.surfaceH:v>0?(ti<fi?`rgba(22,163,74,${0.1+intensity*0.4})`:`rgba(220,38,38,${0.1+intensity*0.4})`):'transparent';
                  return <td key={to} style={{...tdStyle,textAlign:'center',background:isHover?T.goldL:bg,fontWeight:v>0?600:400,color:v>0?T.navy:T.textMut,cursor:'pointer',transition:'all 0.15s',transform:isHover?'scale(1.05)':'none'}}
                    title={`${from} -> ${to}: ${v} migrations`}
                    onMouseEnter={()=>setMatrixHover({from:fi,to:ti})}
                    onMouseLeave={()=>setMatrixHover(null)}>{v||'-'}</td>;
                })}
                <td style={{...tdStyle,textAlign:'center',fontWeight:600,color:T.textSec,background:T.surfaceH}}>{rowTotal}</td>
              </tr>;})}
            </tbody>
          </table>
        </div>
        {matrixHover&&<div style={{marginTop:8,fontSize:11,color:T.textSec,fontFamily:T.font}}>
          {RATINGS[matrixHover.from]} &rarr; {RATINGS[matrixHover.to]}: {matrix[RATINGS[matrixHover.from]][RATINGS[matrixHover.to]]} migration(s) | {matrixHover.from===matrixHover.to?'No change':matrixHover.to<matrixHover.from?'Upgrade':'Downgrade'}
        </div>}
      </div>

      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Upgrade / Downgrade by Provider</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={summary} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:11,fill:T.textSec,fontFamily:T.font}}/>
            <YAxis dataKey="provider" type="category" width={95} tick={{fontSize:11,fill:T.text,fontFamily:T.font}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
            <Bar dataKey="up" name="Upgrades" fill={T.green} radius={[0,4,4,0]}/>
            <Bar dataKey="down" name="Downgrades" fill={T.red} radius={[0,4,4,0]}/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:T.font}}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{marginTop:8}}>
          {summary.map(s=><div key={s.provider} style={{display:'flex',alignItems:'center',gap:8,padding:'3px 0',fontSize:11,fontFamily:T.font}}>
            <span style={{width:85,fontWeight:600,color:T.navy}}>{s.provider}</span>
            <span style={{color:T.green,fontWeight:600,width:35}}>+{s.up}</span>
            <span style={{color:T.red,fontWeight:600,width:35}}>-{s.down}</span>
            <span style={{color:s.net>0?T.green:s.net<0?T.red:T.textMut,fontWeight:700}}>Net: {s.net>0?'+':''}{s.net}</span>
          </div>)}
        </div>
      </div>
    </div>

    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h4 style={{margin:0,fontSize:14,color:T.navy,fontFamily:T.font}}>Company Rating History ({compList.length} shown)</h4>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company, ticker, sector..." style={{...inp,width:220}}/>
          {['name','change','disagree'].map(s=><button key={s} onClick={()=>{setSortCol(s);setSortDir(d=>sortCol===s?-d:s==='change'?-1:1);}} style={btn(sortCol===s)}>{s==='name'?'Name':s==='change'?'Change':'Divergence'}</button>)}
        </div>
      </div>
      <div style={{maxHeight:440,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Region</th><th style={thStyle}>Avg Change</th>
            {provFilter.slice(0,4).map(p=><th key={p} style={{...thStyle,textAlign:'center'}}>{p.split(' ')[0]}</th>)}
            <th style={thStyle}>Divergence</th><th style={thStyle}>Sparkline</th>
          </tr></thead>
          <tbody>{compList.slice(0,35).map(c=>{
            const isExp=expanded===c.id;
            return <React.Fragment key={c.id}>
              <tr onClick={()=>setExpanded(isExp?null:c.id)} style={{cursor:'pointer',background:isExp?T.surfaceH:'transparent',transition:'background 0.15s'}}
                onMouseEnter={e=>{if(!isExp)e.currentTarget.style.background=T.surfaceH;}} onMouseLeave={e=>{if(!isExp)e.currentTarget.style.background='transparent';}}>
                <td style={{...tdStyle,fontWeight:600}}>{c.name}<span style={{color:T.textMut,fontWeight:400,marginLeft:6,fontSize:11}}>{c.ticker}</span></td>
                <td style={tdStyle}><span style={{fontSize:11}}>{c.sector}</span></td>
                <td style={tdStyle}><span style={{fontSize:11,color:T.textSec}}>{c.region}</span></td>
                <td style={tdStyle}><span style={badge(c.avgChange>0.1?T.green:c.avgChange<-0.1?T.red:T.textMut)}>{c.avgChange>0?'+':''}{c.avgChange.toFixed(2)}</span></td>
                {provFilter.slice(0,4).map(p=>{const h=ratings[c.id][p];const d=h[selQ].num-h[selQ-1].num;
                  return <td key={p} style={{...tdStyle,textAlign:'center'}}>
                    <span style={{color:d>0?T.green:d<0?T.red:T.textMut,fontWeight:600,fontSize:12}}>
                      {d>0?'\u2191':d<0?'\u2193':'\u2022'}{d!==0?` ${h[selQ].rating}`:''}
                    </span>
                  </td>;
                })}
                <td style={tdStyle}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <ProgressBar value={c.disagreement} max={4} color={c.disagreement>2?T.red:c.disagreement>1?T.amber:T.sage} height={5}/>
                    <span style={{fontSize:10,color:T.textMut,fontFamily:T.mono,minWidth:16}}>{c.disagreement}</span>
                  </div>
                </td>
                <td style={tdStyle}><MiniSparkline data={ratings[c.id][provFilter[0]]?.map(h=>h.num)||[4,4,4,4,4,4,4,4]}/></td>
              </tr>
              {isExp&&<tr><td colSpan={7+provFilter.slice(0,4).length} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.font}}>{c.name} &mdash; Full 8-Quarter History</div>
                  <div style={{fontSize:11,color:T.textMut,fontFamily:T.font}}>Market Cap: ${c.mcap}B | {c.sector} | {c.region}</div>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={QUARTERS.map((q,qi)=>{const row={quarter:q};PROVIDERS.forEach(p=>{row[p]=ratings[c.id][p][qi].num;});return row;})}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
                    <YAxis domain={[1,7]} ticks={[1,2,3,4,5,6,7]} tickFormatter={v=>NUM_RATING[v]||''} tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
                    <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}} formatter={(v)=>NUM_RATING[v]||v}/>
                    <Legend wrapperStyle={{fontSize:11,fontFamily:T.font}}/>
                    {PROVIDERS.map((p,pi)=><Line key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[pi]} strokeWidth={2} dot={{r:3}}/>)}
                  </LineChart>
                </ResponsiveContainer>
                <div style={{display:'flex',gap:12,marginTop:10,flexWrap:'wrap'}}>
                  {PROVIDERS.map((p,pi)=>{const h=ratings[c.id][p];const first=h[0].rating;const last=h[7].rating;const diff=h[7].num-h[0].num;
                    return <div key={p} style={{padding:'6px 12px',borderRadius:8,background:T.surface,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font}}>
                      <span style={{fontWeight:700,color:PROV_COLORS[pi]}}>{p}</span>: {first} &rarr; {last}
                      <span style={{marginLeft:6,color:diff>0?T.green:diff<0?T.red:T.textMut,fontWeight:700}}>({diff>0?'+':''}{diff})</span>
                    </div>;
                  })}
                </div>
              </td></tr>}
            </React.Fragment>;
          })}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 2: Momentum Signals
   ══════════════════════════════════════════════════ */
function MomentumSignalsTab({ratings}){
  const[dirFilter,setDirFilter]=useState('all');
  const[sortBy,setSortBy]=useState('score');
  const[sortDir,setSortDir]=useState(-1);
  const[selSector,setSelSector]=useState('all');
  const[selCompany,setSelCompany]=useState(null);

  const momentum=useMemo(()=>{
    return COMPANIES.map(c=>{
      let totalScore=0;let bestDir=0;let consec=0;let maxConsec=0;let leadProv='';let provScores={};
      PROVIDERS.forEach(p=>{
        const h=ratings[c.id][p];let cUp=0,cDn=0;
        for(let i=1;i<h.length;i++){
          const d=h[i].num-h[i-1].num;
          if(d>0){cUp++;cDn=0;} else if(d<0){cDn++;cUp=0;} else{cUp=0;cDn=0;}
        }
        const pScore=cUp>1?Math.min(cUp,3):cDn>1?-Math.min(cDn,3):0;
        provScores[p]=pScore;
        if(Math.abs(pScore)>Math.abs(bestDir)){bestDir=pScore;leadProv=p;maxConsec=Math.max(cUp,cDn);}
        totalScore+=pScore;
      });
      const score=Math.round((totalScore/PROVIDERS.length)*10)/10;
      const dir=score>0.5?'Positive':score<-0.5?'Negative':'Neutral';
      const volatility=Object.values(provScores).reduce((s,v)=>s+Math.abs(v),0)/PROVIDERS.length;
      return{...c,score,dir,consec:maxConsec,leadProvider:leadProv,bestDir,provScores,volatility:Math.round(volatility*100)/100};
    });
  },[ratings]);

  const filtered=useMemo(()=>{
    let list=[...momentum];
    if(dirFilter!=='all')list=list.filter(m=>m.dir===dirFilter);
    if(selSector!=='all')list=list.filter(m=>m.sector===selSector);
    list.sort((a,b)=>sortBy==='score'?(a.score-b.score)*sortDir:sortBy==='consec'?(a.consec-b.consec)*sortDir:sortBy==='vol'?(a.volatility-b.volatility)*sortDir:a.name.localeCompare(b.name)*sortDir);
    return list;
  },[momentum,dirFilter,selSector,sortBy,sortDir]);

  const portfolioIndex=useMemo(()=>{
    return QUARTERS.map((q,qi)=>{
      if(qi===0)return{quarter:q,index:0,positive:0,negative:0,breadth:0};
      let total=0,pos=0,neg=0;
      COMPANIES.forEach(c=>{
        let s=0;
        PROVIDERS.forEach(p=>{const d=ratings[c.id][p][qi].num-ratings[c.id][p][qi-1].num;s+=d;});
        total+=s;if(s>0)pos++;if(s<0)neg++;
      });
      return{quarter:q,index:Math.round(total/COMPANIES.length*100)/100,positive:pos,negative:neg,breadth:Math.round((pos-neg)/COMPANIES.length*100)};
    });
  },[ratings]);

  const sectorBreakdown=useMemo(()=>{
    const map={};
    SECTORS.forEach(s=>{map[s]={positive:0,negative:0,neutral:0,avgScore:0,count:0};});
    momentum.forEach(m=>{
      if(m.dir==='Positive')map[m.sector].positive++;
      else if(m.dir==='Negative')map[m.sector].negative++;
      else map[m.sector].neutral++;
      map[m.sector].avgScore+=m.score;map[m.sector].count++;
    });
    return SECTORS.map(s=>({sector:s,...map[s],net:map[s].positive-map[s].negative,avgScore:map[s].count?Math.round(map[s].avgScore/map[s].count*100)/100:0}));
  },[momentum]);

  const dirCounts=useMemo(()=>{
    const p=momentum.filter(m=>m.dir==='Positive').length;
    const n=momentum.filter(m=>m.dir==='Negative').length;
    return{positive:p,negative:n,neutral:momentum.length-p-n};
  },[momentum]);

  return <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
      <KPI label="Positive Momentum" value={dirCounts.positive} sub={`${Math.round(dirCounts.positive/50*100)}% of portfolio`} color={T.green}/>
      <KPI label="Negative Momentum" value={dirCounts.negative} sub={`${Math.round(dirCounts.negative/50*100)}% of portfolio`} color={T.red}/>
      <KPI label="Neutral / Stable" value={dirCounts.neutral} sub="No clear trend" color={T.textMut}/>
      <KPI label="Breadth Index" value={`${portfolioIndex[portfolioIndex.length-1]?.breadth||0}%`} sub="Latest quarter net direction" color={T.navy}/>
    </div>

    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <MultiCheck options={['all','Positive','Negative','Neutral']} selected={[dirFilter]} onChange={v=>setDirFilter(v[v.length-1]||'all')} label="Direction:"/>
      <select value={selSector} onChange={e=>setSelSector(e.target.value)} style={inp}>
        <option value="all">All Sectors</option>
        {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Portfolio Momentum Index</h4>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={portfolioIndex}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
            <Area type="monotone" dataKey="index" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="Momentum Index"/>
            <Area type="monotone" dataKey="breadth" stroke={T.gold} fill={T.gold} fillOpacity={0.08} strokeWidth={1.5} name="Breadth %"/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:T.font}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Sector Momentum Breakdown</h4>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={sectorBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,fontFamily:T.font}} angle={-25} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
            <Bar dataKey="positive" name="Positive" fill={T.green} radius={[3,3,0,0]} stackId="a"/>
            <Bar dataKey="negative" name="Negative" fill={T.red} radius={[3,3,0,0]} stackId="b"/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:T.font}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h4 style={{margin:0,fontSize:14,color:T.navy,fontFamily:T.font}}>Momentum Scores ({filtered.length} companies)</h4>
        <div style={{display:'flex',gap:6}}>
          {[{k:'score',l:'Score'},{k:'consec',l:'Consecutive'},{k:'vol',l:'Volatility'},{k:'name',l:'Name'}].map(s=>
            <button key={s.k} onClick={()=>{setSortBy(s.k);setSortDir(d=>sortBy===s.k?-d:-1);}} style={btn(sortBy===s.k)}>{s.l}</button>
          )}
        </div>
      </div>
      <div style={{maxHeight:400,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Score</th>
            <th style={thStyle}>Direction</th><th style={thStyle}>Consec. Qtrs</th><th style={thStyle}>Lead Provider</th>
            <th style={thStyle}>Volatility</th><th style={thStyle}>Trend</th>
          </tr></thead>
          <tbody>{filtered.map(m=><tr key={m.id} style={{cursor:'pointer',background:selCompany===m.id?T.surfaceH:'transparent',transition:'background 0.15s'}}
            onClick={()=>setSelCompany(selCompany===m.id?null:m.id)}
            onMouseEnter={e=>{if(selCompany!==m.id)e.currentTarget.style.background=T.surfaceH;}}
            onMouseLeave={e=>{if(selCompany!==m.id)e.currentTarget.style.background='transparent';}}>
            <td style={{...tdStyle,fontWeight:600}}>{m.name}<span style={{color:T.textMut,marginLeft:6,fontSize:11}}>{m.ticker}</span></td>
            <td style={tdStyle}><span style={{fontSize:11}}>{m.sector}</span></td>
            <td style={tdStyle}><span style={{...badge(m.score>0?T.green:m.score<0?T.red:T.textMut),minWidth:40,textAlign:'center'}}>{m.score>0?'+':''}{m.score.toFixed(1)}</span></td>
            <td style={tdStyle}><span style={{color:m.dir==='Positive'?T.green:m.dir==='Negative'?T.red:T.textMut,fontWeight:600,fontSize:12}}>{m.dir==='Positive'?'\u2191':m.dir==='Negative'?'\u2193':'\u2194'} {m.dir}</span></td>
            <td style={{...tdStyle,fontFamily:T.mono,fontSize:12}}>{m.consec}</td>
            <td style={tdStyle}><span style={{fontSize:12}}>{m.leadProvider}</span></td>
            <td style={tdStyle}><ProgressBar value={m.volatility} max={3} color={m.volatility>2?T.red:m.volatility>1?T.amber:T.sage} height={5}/></td>
            <td style={tdStyle}><MiniSparkline data={ratings[m.id][PROVIDERS[0]].map(h=>h.num)} width={70} height={20}/></td>
          </tr>)}</tbody>
        </table>
      </div>
      {selCompany!==null&&<div style={{marginTop:12,padding:16,background:T.surfaceH,borderRadius:10}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.font}}>Provider Momentum Breakdown: {COMPANIES[selCompany]?.name}</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {PROVIDERS.map((p,pi)=>{const sc=momentum.find(m=>m.id===selCompany)?.provScores[p]||0;
            return <div key={p} style={{padding:'8px 14px',borderRadius:8,background:T.surface,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,minWidth:120}}>
              <div style={{fontWeight:700,color:PROV_COLORS[pi],marginBottom:2}}>{p}</div>
              <div style={{fontSize:16,fontWeight:800,color:sc>0?T.green:sc<0?T.red:T.textMut,fontFamily:T.mono}}>{sc>0?'+':''}{sc}</div>
            </div>;
          })}
        </div>
      </div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 3: Provider Lead-Lag
   ══════════════════════════════════════════════════ */
function ProviderLeadLagTab({ratings}){
  const[selEvent,setSelEvent]=useState(null);
  const[lagView,setLagView]=useState('heatmap');

  const leadLag=useMemo(()=>{
    const matrix={};
    PROVIDERS.forEach(a=>{matrix[a]={};PROVIDERS.forEach(b=>{matrix[a][b]=null;});});
    PROVIDERS.forEach((a,ai)=>{
      PROVIDERS.forEach((b,bi)=>{
        if(ai===bi)return;
        let totalLag=0;let count=0;
        COMPANIES.forEach(c=>{
          const hA=ratings[c.id][a];const hB=ratings[c.id][b];
          for(let i=1;i<hA.length;i++){
            const dA=hA[i].num-hA[i-1].num;
            if(dA!==0){
              for(let j=i;j<Math.min(i+4,hB.length);j++){
                const dB=hB[j].num-(j>0?hB[j-1].num:hB[0].num);
                if((dA>0&&dB>0)||(dA<0&&dB<0)){totalLag+=j-i;count++;break;}
              }
            }
          }
        });
        matrix[a][b]=count>0?Math.round((totalLag/count)*100)/100:null;
      });
    });
    return matrix;
  },[ratings]);

  const firstMover=useMemo(()=>{
    return PROVIDERS.map(p=>{
      let avgLead=0;let ct=0;let leadsCount=0;
      PROVIDERS.forEach(other=>{
        if(other===p)return;
        const lag=leadLag[p][other];
        if(lag!==null){avgLead+=lag;ct++;if(lag<1.5)leadsCount++;}
      });
      return{provider:p,avgLead:ct>0?Math.round((avgLead/ct)*100)/100:0,leadsCount};
    }).sort((a,b)=>a.avgLead-b.avgLead);
  },[leadLag]);

  const lagChartData=useMemo(()=>{
    return PROVIDERS.map(p=>({provider:p,...PROVIDERS.reduce((acc,other)=>{if(other!==p)acc[other]=leadLag[p][other]||0;return acc;},{})}));
  },[leadLag]);

  const eventResponse=useMemo(()=>{
    return ESG_EVENTS.map(ev=>{
      const qi=QUARTERS.indexOf(ev.quarter);
      if(qi<0||qi>=QUARTERS.length-1)return{...ev,responses:[]};
      const resp=PROVIDERS.map((p,pi)=>{
        let changes=0;let direction=0;let avgLag=0;
        COMPANIES.forEach(c=>{
          for(let j=qi;j<Math.min(qi+3,QUARTERS.length-1);j++){
            const d=ratings[c.id][p][j+1].num-ratings[c.id][p][j].num;
            if(d!==0){changes++;direction+=d;avgLag+=j-qi;}
          }
        });
        const avgReaction=changes>0?Math.round(avgLag/changes*10)/10:0;
        return{provider:p,changes,direction:direction>0?'Upgrade':direction<0?'Downgrade':'Mixed',speed:changes>10?'Fast':changes>5?'Medium':'Slow',avgReaction,color:PROV_COLORS[pi]};
      });
      return{...ev,responses:resp};
    });
  },[ratings]);

  const lagMax=useMemo(()=>{
    let mx=0;
    PROVIDERS.forEach(a=>{PROVIDERS.forEach(b=>{const v=leadLag[a][b];if(v!==null&&v>mx)mx=v;});});
    return mx||1;
  },[leadLag]);

  return <div>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h4 style={{margin:0,fontSize:14,color:T.navy,fontFamily:T.font}}>Lead-Lag Analysis (avg quarters A leads B)</h4>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setLagView('heatmap')} style={btn(lagView==='heatmap')}>Heatmap</button>
            <button onClick={()=>setLagView('chart')} style={btn(lagView==='chart')}>Chart</button>
          </div>
        </div>
        {lagView==='heatmap'?<div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',width:'100%',fontSize:11,fontFamily:T.mono}}>
            <thead><tr><th style={{...thStyle,fontSize:10}}>A leads \ B follows</th>{PROVIDERS.map(p=><th key={p} style={{...thStyle,textAlign:'center',fontSize:10}}>{p.split(' ')[0]}</th>)}</tr></thead>
            <tbody>{PROVIDERS.map(a=><tr key={a}>
              <td style={{...tdStyle,fontWeight:700,color:T.navy,fontSize:11}}>{a}</td>
              {PROVIDERS.map(b=>{
                const v=leadLag[a][b];const isDiag=a===b;
                const bg=isDiag?T.surfaceH:v!==null?`rgba(27,58,92,${0.05+(1-v/lagMax)*0.35})`:'transparent';
                return <td key={b} style={{...tdStyle,textAlign:'center',background:bg,fontWeight:v!==null&&v<1?700:400,color:v!==null?(v<1?T.green:v<2?T.navy:T.red):T.textMut,fontSize:11}}
                  title={`${a} leads ${b} by ${v||'N/A'} quarters`}>
                  {isDiag?'\u2014':v!==null?v.toFixed(2):'N/A'}
                </td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>:
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={lagChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}} label={{value:'Avg Quarters Lag',position:'insideBottom',offset:-5,fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="provider" type="category" width={90} tick={{fontSize:10,fill:T.text,fontFamily:T.font}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
            {PROVIDERS.slice(0,4).map((p,i)=><Bar key={p} dataKey={p} fill={PROV_COLORS[i]} radius={[0,3,3,0]} name={`vs ${p}`}/>)}
            <Legend wrapperStyle={{fontSize:10,fontFamily:T.font}}/>
          </BarChart>
        </ResponsiveContainer>}
      </div>

      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>First Mover Ranking</h4>
        <p style={{fontSize:11,color:T.textMut,margin:'-4px 0 12px',fontFamily:T.font}}>Lower avg lag = faster to react to ESG changes</p>
        {firstMover.map((fm,i)=><div key={fm.provider} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<firstMover.length-1?`1px solid ${T.border}`:'none'}}>
          <span style={{width:28,height:28,borderRadius:14,background:i===0?T.gold:i===1?T.sage:i===2?T.navyL:T.surfaceH,color:i<3?'#fff':T.text,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,fontFamily:T.font,flexShrink:0}}>{i+1}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.font}}>{fm.provider}</div>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.font}}>Avg lag: {fm.avgLead.toFixed(2)}Q | Leads {fm.leadsCount} others</div>
          </div>
          <div style={{width:90}}>
            <ProgressBar value={3-fm.avgLead} max={3} color={i===0?T.gold:i===1?T.sage:T.navyL}/>
          </div>
        </div>)}
      </div>
    </div>

    <div style={card}>
      <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Event-Driven Rating Response Analysis</h4>
      <p style={{fontSize:11,color:T.textMut,margin:'-4px 0 12px',fontFamily:T.font}}>How did each provider respond to major ESG events? Select an event to see details.</p>
      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
        <div style={{maxHeight:420,overflowY:'auto'}}>
          {eventResponse.map((ev,i)=><div key={ev.id} onClick={()=>setSelEvent(i)} style={{padding:'10px 12px',borderRadius:8,cursor:'pointer',marginBottom:4,background:selEvent===i?T.navy:'transparent',color:selEvent===i?'#fff':T.text,transition:'all 0.15s',borderLeft:`3px solid ${ev.type==='Regulatory'?T.navyL:ev.type==='Environmental'?T.sage:ev.type==='Social'?T.gold:ev.type==='Governance'?T.teal:T.amber}`}}
            onMouseEnter={e=>{if(selEvent!==i)e.currentTarget.style.background=T.surfaceH;}}
            onMouseLeave={e=>{if(selEvent!==i)e.currentTarget.style.background='transparent';}}>
            <div style={{fontSize:12,fontWeight:600,fontFamily:T.font}}>{ev.name}</div>
            <div style={{fontSize:10,opacity:0.7,fontFamily:T.font,display:'flex',gap:8}}>
              <span>{ev.quarter}</span><span>|</span><span>{ev.type}</span>
              <span style={{...badge(ev.severity==='Critical'?T.red:ev.severity==='High'?T.amber:T.textMut),fontSize:9,padding:'1px 6px'}}>{ev.severity}</span>
            </div>
          </div>)}
        </div>
        <div>
          {selEvent!==null?<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:T.navy,fontFamily:T.font}}>{eventResponse[selEvent].name}</div>
                <div style={{fontSize:11,color:T.textMut,fontFamily:T.font}}>{eventResponse[selEvent].quarter} | {eventResponse[selEvent].type} | Severity: {eventResponse[selEvent].severity}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventResponse[selEvent].responses}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="provider" tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}}/>
                <Bar dataKey="changes" name="Rating Changes" radius={[4,4,0,0]}>
                  {eventResponse[selEvent].responses.map((entry,idx)=><Cell key={idx} fill={entry.direction==='Upgrade'?T.green:entry.direction==='Downgrade'?T.red:T.amber}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
              {eventResponse[selEvent].responses.map(r=><div key={r.provider} style={{padding:'8px 12px',borderRadius:8,background:T.surfaceH,fontSize:11,fontFamily:T.font}}>
                <div style={{fontWeight:700,color:T.navy,marginBottom:3}}>{r.provider}</div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:r.direction==='Upgrade'?T.green:r.direction==='Downgrade'?T.red:T.amber}}>{r.direction}</span>
                  <span style={badge(r.speed==='Fast'?T.green:r.speed==='Medium'?T.amber:T.textMut)}>{r.speed}</span>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Avg reaction: {r.avgReaction}Q</div>
              </div>)}
            </div>
          </div>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:260,color:T.textMut,fontSize:13,fontFamily:T.font,flexDirection:'column',gap:8}}>
            <div style={{fontSize:28,opacity:0.3}}>&#9670;</div>
            Select an event to view provider response analysis
          </div>}
        </div>
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   TAB 4: Alpha Signal Builder
   ══════════════════════════════════════════════════ */
function AlphaSignalTab({ratings}){
  const[threshold,setThreshold]=useState(1);
  const[holdPeriod,setHoldPeriod]=useState(2);
  const[showDetail,setShowDetail]=useState(false);
  const[signalSort,setSignalSort]=useState('return');
  const[signalDir,setSignalDir]=useState(-1);
  const[sectorFilter,setSectorFilter]=useState('all');

  const backtest=useMemo(()=>{
    const signals=[];
    const quarterlyReturns=QUARTERS.map(()=>0);
    const quarterlyCount=QUARTERS.map(()=>0);
    let equity=100;const equityCurve=[{quarter:QUARTERS[0],value:100,drawdown:0}];
    let wins=0;let total=0;let maxDD=0;let peak=100;
    let sectorReturns={};SECTORS.forEach(s=>{sectorReturns[s]={total:0,count:0,wins:0};});

    COMPANIES.forEach(c=>{
      for(let qi=2;qi<QUARTERS.length;qi++){
        let avgScore=0;
        PROVIDERS.forEach(p=>{
          const h=ratings[c.id][p];
          let consec=0;
          for(let j=qi;j>0;j--){
            const d=h[j].num-h[j-1].num;
            if(d>0)consec++;else break;
          }
          avgScore+=consec;
        });
        avgScore/=PROVIDERS.length;

        if(avgScore>=threshold){
          const entryQ=qi;const exitQ=Math.min(qi+holdPeriod,QUARTERS.length-1);
          const entryPrice=100+sr(c.id*200+entryQ*37)*20;
          const exitPrice=entryPrice*(1+(sr(c.id*300+exitQ*53)-0.42)*0.15);
          const ret=(exitPrice-entryPrice)/entryPrice;
          signals.push({company:c.name,sector:c.sector,ticker:c.ticker,entry:QUARTERS[entryQ],exit:QUARTERS[exitQ],score:avgScore.toFixed(1),returnPct:Math.round(ret*10000)/100,win:ret>0});
          quarterlyReturns[entryQ]+=ret;
          quarterlyCount[entryQ]++;
          sectorReturns[c.sector].total+=ret;sectorReturns[c.sector].count++;if(ret>0)sectorReturns[c.sector].wins++;
          total++;if(ret>0)wins++;
        }
      }
    });

    for(let qi=1;qi<QUARTERS.length;qi++){
      const pr=quarterlyCount[qi]>0?quarterlyReturns[qi]/quarterlyCount[qi]:0;
      equity*=(1+pr*0.5);
      if(equity>peak)peak=equity;
      const dd=(peak-equity)/peak;
      if(dd>maxDD)maxDD=dd;
      equityCurve.push({quarter:QUARTERS[qi],value:Math.round(equity*100)/100,drawdown:Math.round(-dd*10000)/100});
    }

    const returns=equityCurve.slice(1).map((e,i)=>(e.value-equityCurve[i].value)/equityCurve[i].value);
    const avgR=returns.length>0?returns.reduce((a,b)=>a+b,0)/returns.length:0;
    const stdR=returns.length>0?Math.sqrt(returns.reduce((a,b)=>a+(b-avgR)**2,0)/returns.length)||0.01:0.01;
    const sharpe=Math.round((avgR/stdR)*Math.sqrt(4)*100)/100;
    const hitRate=total>0?Math.round(wins/total*10000)/100:0;
    const totalReturn=Math.round((equity-100)*100)/100;
    const annReturn=Math.round(((equity/100)**(1/2)-1)*10000)/100;

    const sectorPerf=SECTORS.map(s=>({sector:s,avgReturn:sectorReturns[s].count>0?Math.round(sectorReturns[s].total/sectorReturns[s].count*10000)/100:0,signals:sectorReturns[s].count,hitRate:sectorReturns[s].count>0?Math.round(sectorReturns[s].wins/sectorReturns[s].count*100):0}));

    return{signals,equityCurve,sharpe,hitRate,maxDD:Math.round(maxDD*10000)/100,totalReturn,annReturn,total,sectorPerf};
  },[ratings,threshold,holdPeriod]);

  const filteredSignals=useMemo(()=>{
    let list=[...backtest.signals];
    if(sectorFilter!=='all')list=list.filter(s=>s.sector===sectorFilter);
    list.sort((a,b)=>signalSort==='return'?(a.returnPct-b.returnPct)*signalDir:signalSort==='score'?(parseFloat(a.score)-parseFloat(b.score))*signalDir:a.company.localeCompare(b.company)*signalDir);
    return list;
  },[backtest.signals,sectorFilter,signalSort,signalDir]);

  const exportCSV=useCallback(()=>{
    const header='Company,Ticker,Sector,Entry,Exit,Score,Return%,Win\n';
    const rows=backtest.signals.map(s=>`${s.company},${s.ticker},${s.sector},${s.entry},${s.exit},${s.score},${s.returnPct},${s.win}`).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='momentum_alpha_signals.csv';a.click();URL.revokeObjectURL(url);
  },[backtest.signals]);

  return <div>
    <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:16,alignItems:'center',padding:'12px 16px',background:T.surfaceH,borderRadius:10}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec,fontFamily:T.font}}>Momentum Threshold:</span>
        <input type="range" min={0.5} max={3} step={0.5} value={threshold} onChange={e=>setThreshold(+e.target.value)} style={{accentColor:T.navy,width:120}}/>
        <span style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.mono,minWidth:30,textAlign:'center'}}>{threshold}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec,fontFamily:T.font}}>Hold Period (Qtrs):</span>
        <input type="range" min={1} max={4} step={1} value={holdPeriod} onChange={e=>setHoldPeriod(+e.target.value)} style={{accentColor:T.navy,width:120}}/>
        <span style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.mono,minWidth:20,textAlign:'center'}}>{holdPeriod}</span>
      </div>
      <div style={{fontSize:11,color:T.textMut,fontFamily:T.font,padding:'4px 8px',background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
        Strategy: Buy on {threshold}+ momentum score, hold {holdPeriod}Q
      </div>
      <button onClick={exportCSV} style={{...btn(false),marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:14}}>&#8681;</span> Export CSV
      </button>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
      <KPI label="Sharpe Ratio" value={backtest.sharpe} sub="Risk-adjusted" color={backtest.sharpe>0.5?T.green:backtest.sharpe>0?T.amber:T.red}/>
      <KPI label="Hit Rate" value={`${backtest.hitRate}%`} sub={`${backtest.total} signals`} color={backtest.hitRate>55?T.green:backtest.hitRate>45?T.amber:T.red}/>
      <KPI label="Max Drawdown" value={`-${backtest.maxDD}%`} sub="Peak to trough" color={backtest.maxDD<10?T.green:backtest.maxDD<20?T.amber:T.red}/>
      <KPI label="Total Return" value={`${backtest.totalReturn>0?'+':''}${backtest.totalReturn}%`} sub="Cumulative" color={backtest.totalReturn>0?T.green:T.red}/>
      <KPI label="Ann. Return" value={`${backtest.annReturn>0?'+':''}${backtest.annReturn}%`} sub="Annualized" color={backtest.annReturn>0?T.green:T.red}/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Equity Curve</h4>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={backtest.equityCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}} domain={['auto','auto']}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}} formatter={(v,n)=>n==='value'?[`$${v}`,'Portfolio']:v}/>
            <Area type="monotone" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.12} strokeWidth={2.5} name="Portfolio Value"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Drawdown Profile</h4>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={backtest.equityCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}} formatter={v=>[`${v}%`,'Drawdown']}/>
            <Area type="monotone" dataKey="drawdown" stroke={T.red} fill={T.red} fillOpacity={0.12} strokeWidth={2} name="Drawdown %"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={card}>
      <h4 style={{margin:'0 0 12px',fontSize:14,color:T.navy,fontFamily:T.font}}>Sector Performance Attribution</h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={backtest.sectorPerf}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,fontFamily:T.font}} angle={-20} textAnchor="end" height={45}/>
          <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.font}} label={{value:'Avg Return %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
          <Tooltip contentStyle={{fontFamily:T.font,fontSize:11,borderRadius:8}} formatter={(v,n)=>n==='avgReturn'?[`${v}%`,'Avg Return']:[v,'Signals']}/>
          <Bar dataKey="avgReturn" name="Avg Return %">
            {backtest.sectorPerf.map((entry,idx)=><Cell key={idx} fill={entry.avgReturn>0?T.green:T.red} radius={[4,4,0,0]}/>)}
          </Bar>
          <Legend wrapperStyle={{fontSize:11,fontFamily:T.font}}/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h4 style={{margin:0,fontSize:14,color:T.navy,fontFamily:T.font}}>Signal List ({filteredSignals.length} of {backtest.total})</h4>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={inp}>
            <option value="all">All Sectors</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {['return','score','name'].map(s=><button key={s} onClick={()=>{setSignalSort(s);setSignalDir(d=>signalSort===s?-d:-1);}} style={btn(signalSort===s)}>{s==='return'?'Return':s==='score'?'Score':'Name'}</button>)}
          <button onClick={()=>setShowDetail(!showDetail)} style={btn(showDetail)}>{showDetail?'Collapse':'Expand'}</button>
        </div>
      </div>
      {showDetail&&<div style={{maxHeight:340,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Entry</th>
            <th style={thStyle}>Exit</th><th style={thStyle}>Score</th><th style={thStyle}>Return</th><th style={thStyle}>Win</th>
          </tr></thead>
          <tbody>{filteredSignals.slice(0,50).map((s,i)=><tr key={i} style={{transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <td style={{...tdStyle,fontWeight:600}}>{s.company}<span style={{color:T.textMut,marginLeft:6,fontSize:11}}>{s.ticker}</span></td>
            <td style={tdStyle}><span style={{fontSize:11}}>{s.sector}</span></td>
            <td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{s.entry}</td>
            <td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{s.exit}</td>
            <td style={tdStyle}><span style={badge(T.navy)}>{s.score}</span></td>
            <td style={tdStyle}><span style={{color:s.returnPct>0?T.green:T.red,fontWeight:700,fontFamily:T.mono,fontSize:12}}>{s.returnPct>0?'+':''}{s.returnPct}%</span></td>
            <td style={tdStyle}>{s.win?<span style={{color:T.green,fontWeight:700,fontSize:12}}>\u2713</span>:<span style={{color:T.red,fontWeight:700,fontSize:12}}>\u2717</span>}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      {!showDetail&&<div style={{padding:20,textAlign:'center',color:T.textMut,fontSize:12,fontFamily:T.font}}>Click "Expand" to view individual signal details</div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════
   MAIN PAGE SHELL
   ══════════════════════════════════════════════════ */
export default function RatingsMigrationMomentumPage(){
  const[tab,setTab]=useState(0);
  const ratings=useMemo(()=>genRatings(),[]);

  const totalUp=useMemo(()=>{
    let up=0,dn=0,total=0;
    COMPANIES.forEach(c=>{PROVIDERS.forEach(p=>{
      for(let i=1;i<QUARTERS.length;i++){
        const d=ratings[c.id][p][i].num-ratings[c.id][p][i-1].num;
        if(d>0)up++;if(d<0)dn++;total++;
      }
    });});
    return{up,dn,total,stability:Math.round((1-(up+dn)/total)*100)};
  },[ratings]);

  return <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
    <div style={{maxWidth:1380,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:4,background:T.gold}}/>
          <span style={{fontSize:11,fontWeight:600,color:T.textMut,letterSpacing:1.5,textTransform:'uppercase',fontFamily:T.font}}>EP-AK3</span>
          <span style={{fontSize:10,color:T.textMut,fontFamily:T.font}}>|</span>
          <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>{COMPANIES.length} companies &middot; {PROVIDERS.length} providers &middot; {QUARTERS.length} quarters</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:800,color:T.navy,margin:'0 0 6px',fontFamily:T.font,letterSpacing:-0.3}}>Ratings Migration & Momentum</h1>
        <p style={{fontSize:13,color:T.textSec,margin:0,fontFamily:T.font,maxWidth:800}}>
          Track ESG rating changes across providers, analyze migration patterns, identify momentum signals, and backtest alpha strategies.
          Observed: {totalUp.up} upgrades, {totalUp.dn} downgrades, {totalUp.stability}% stability rate across {totalUp.total} observations.
        </p>
      </div>

      <div style={{display:'flex',gap:2,marginBottom:20,background:T.surfaceH,borderRadius:10,padding:3}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?700:500,cursor:'pointer',transition:'all 0.2s',boxShadow:tab===i?'0 1px 4px rgba(0,0,0,0.08)':'none'}}>{t}</button>)}
      </div>

      {tab===0&&<MigrationTrackerTab ratings={ratings}/>}
      {tab===1&&<MomentumSignalsTab ratings={ratings}/>}
      {tab===2&&<ProviderLeadLagTab ratings={ratings}/>}
      {tab===3&&<AlphaSignalTab ratings={ratings}/>}

      {/* methodology footer */}
      <div style={{...card,marginTop:24,padding:16,background:T.surfaceH,border:`1px solid ${T.borderL}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:24}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.font}}>Methodology Notes</div>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.6,fontFamily:T.font}}>
              Migration matrices track rating transitions between consecutive quarters across selected providers.
              Momentum scores range from -3 (strong negative) to +3 (strong positive), calculated from consecutive
              upgrade/downgrade sequences. Lead-lag analysis measures the average quarter gap between one provider
              moving and another following in the same direction. Alpha signals use a long-only momentum strategy:
              enter when momentum score exceeds threshold, hold for the specified period.
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.font}}>Data Coverage</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:11,color:T.textSec,fontFamily:T.font}}>
              <span>Companies: {COMPANIES.length}</span>
              <span>Providers: {PROVIDERS.length}</span>
              <span>Quarters: {QUARTERS[0]} - {QUARTERS[QUARTERS.length-1]}</span>
              <span>Sectors: {SECTORS.length}</span>
              <span>Total observations: {totalUp.total}</span>
              <span>Rating scale: CCC to AAA (7 levels)</span>
              <span>ESG events tracked: {ESG_EVENTS.length}</span>
              <span>Regions: 4 macro regions</span>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.font}}>Provider Coverage</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {PROVIDERS.map((p,i)=><span key={p} style={{padding:'3px 10px',borderRadius:6,fontSize:10,fontWeight:600,background:PROV_COLORS[i]+'18',color:PROV_COLORS[i],fontFamily:T.font}}>{p}</span>)}
            </div>
            <div style={{fontSize:10,color:T.textMut,marginTop:8,fontFamily:T.font}}>
              Stability rate: {totalUp.stability}% | Upgrade ratio: {Math.round(totalUp.up/(totalUp.up+totalUp.dn)*100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
