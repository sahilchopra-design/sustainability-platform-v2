import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,LineChart,Line,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0c4a6e';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Factor Analysis','Alpha Decomposition','Backtesting'];
const SECTORS=['All','Technology','Finance','Healthcare','Energy','Industrials','Consumer','Utilities','Materials','Real Estate','Telecom'];
const PAGE_SIZE=15;

const COMPANIES=(()=>{
  const names=['Apple Inc','Microsoft Corp','Alphabet Inc','Amazon.com','NVIDIA Corp','Meta Platforms','Tesla Inc','Berkshire Hath.','JPMorgan Chase','Johnson & Johnson','Visa Inc','UnitedHealth','Procter & Gamble','Mastercard Inc','Home Depot','Chevron Corp','Merck & Co','AbbVie Inc','Costco Wholesale','Pfizer Inc','Coca-Cola Co','PepsiCo Inc','Bank of America','Thermo Fisher','Cisco Systems','Broadcom Inc','McDonald\'s Corp','Accenture plc','Abbott Labs','Linde plc','Danaher Corp','Texas Instruments','Philip Morris','Salesforce Inc','Honeywell Intl','Amgen Inc','S&P Global','NextEra Energy','Caterpillar Inc','Boeing Co','Morgan Stanley','Goldman Sachs','Deere & Co','Lockheed Martin','Starbucks Corp','BlackRock Inc','Prologis Inc','Fidelity NIS','American Tower','Crown Castle','Exxon Mobil','ConocoPhillips','EOG Resources','Pioneer Natural','Devon Energy','Duke Energy','Southern Co','Dominion Energy','AES Corp','Xcel Energy','Equinix Inc','Digital Realty','Alexandria RE','Ventas Inc','Welltower Inc','Nucor Corp','Freeport-McMoRan','Air Products','Linde plc','Ecolab Inc','Waste Management','Republic Serv.','AT&T Inc','Verizon Comm','T-Mobile US','Comcast Corp','Walt Disney','Netflix Inc','Warner Bros','Paramount Glob','Eli Lilly','Novo Nordisk','AstraZeneca','Roche Holding','Novartis AG','Sanofi SA','GSK plc','Bayer AG','Merck KGaA','Takeda Pharma','Toyota Motor','BMW AG','Volkswagen AG','Stellantis NV','Honda Motor','General Motors','Ford Motor','Rivian Auto','Lucid Group','NIO Inc'];
  const secs=['Technology','Technology','Technology','Technology','Technology','Technology','Technology','Finance','Finance','Healthcare','Finance','Healthcare','Consumer','Finance','Consumer','Energy','Healthcare','Healthcare','Consumer','Healthcare','Consumer','Consumer','Finance','Healthcare','Technology','Technology','Consumer','Technology','Healthcare','Materials','Healthcare','Technology','Consumer','Technology','Industrials','Healthcare','Finance','Utilities','Industrials','Industrials','Finance','Finance','Industrials','Industrials','Consumer','Finance','Real Estate','Finance','Real Estate','Real Estate','Energy','Energy','Energy','Energy','Energy','Utilities','Utilities','Utilities','Utilities','Utilities','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Materials','Materials','Materials','Materials','Materials','Industrials','Industrials','Telecom','Telecom','Telecom','Telecom','Consumer','Technology','Consumer','Consumer','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials'];
  return names.map((n,i)=>({id:i+1,name:n,sector:secs[i]||'Technology',esgScore:Math.round(20+sr(i*7)*70),envScore:Math.round(15+sr(i*11)*80),socScore:Math.round(20+sr(i*13)*75),govScore:Math.round(25+sr(i*17)*70),esgMomentum:+(-15+sr(i*19)*30).toFixed(1),alphaContrib:+(-3+sr(i*23)*6).toFixed(2),factorExposure:+(-2+sr(i*29)*4).toFixed(2),trackingError:+(1+sr(i*31)*5).toFixed(2),infoRatio:+(-0.5+sr(i*37)*2).toFixed(2),sharpeRatio:+(0.2+sr(i*41)*1.8).toFixed(2),maxDrawdown:+(-25+sr(i*43)*15).toFixed(1),beta:+(0.5+sr(i*47)*1).toFixed(2),annualReturn:+(-5+sr(i*53)*25).toFixed(1),volatility:+(8+sr(i*59)*20).toFixed(1),carbonIntensity:Math.round(10+sr(i*61)*500),controversyScore:Math.round(sr(i*67)*80)}));})();

const FACTORS=[
  {name:'ESG Quality',annReturn:8.2,sharpe:0.92,maxDD:-12.4,alpha:2.1,tStat:2.8,turnover:28},{name:'ESG Momentum',annReturn:11.4,sharpe:1.15,maxDD:-15.2,alpha:3.8,tStat:3.4,turnover:45},
  {name:'Low Carbon',annReturn:7.8,sharpe:0.88,maxDD:-11.8,alpha:1.6,tStat:2.1,turnover:22},{name:'Green Revenue',annReturn:9.6,sharpe:1.02,maxDD:-14.1,alpha:2.9,tStat:2.9,turnover:35},
  {name:'Governance',annReturn:6.9,sharpe:0.78,maxDD:-10.2,alpha:1.2,tStat:1.8,turnover:18},{name:'Social Impact',annReturn:7.4,sharpe:0.85,maxDD:-13.5,alpha:1.5,tStat:2.0,turnover:25},
  {name:'Controversy Avoid',annReturn:8.8,sharpe:0.95,maxDD:-9.8,alpha:2.4,tStat:3.1,turnover:32},{name:'Water Stress',annReturn:6.2,sharpe:0.71,maxDD:-16.8,alpha:0.8,tStat:1.4,turnover:20},
];

const BACKTEST=Array.from({length:60},(_,i)=>({month:`${2020+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,esgPortfolio:100*(1+0.008*i+sr(i*7)*3-1.5)/100*100,benchmark:100*(1+0.006*i+sr(i*11)*2.5-1.25)/100*100,esgMomentum:100*(1+0.01*i+sr(i*13)*4-2)/100*100,lowCarbon:100*(1+0.007*i+sr(i*17)*3-1.5)/100*100}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

export default function EsgFactorAlphaPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sectorF,setSectorF]=useState('All');const[sortCol,setSortCol]=useState('esgScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[fSort,setFSort]=useState('annReturn');const[fDir,setFDir]=useState('desc');
  const[aSearch,setASearch]=useState('');const[aSort,setASort]=useState('alphaContrib');const[aDir,setADir]=useState('desc');const[aPage,setAPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);

  const factorsSorted=useMemo(()=>[...FACTORS].sort((a,b)=>fDir==='asc'?(a[fSort]>b[fSort]?1:-1):(a[fSort]<b[fSort]?1:-1)),[fSort,fDir]);

  const alphaData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,sector:r.sector,esgScore:r.esgScore,alphaContrib:r.alphaContrib,factorExposure:r.factorExposure,infoRatio:r.infoRatio,sharpeRatio:r.sharpeRatio,annualReturn:r.annualReturn}));if(aSearch)d=d.filter(r=>r.name.toLowerCase().includes(aSearch.toLowerCase()));d.sort((a,b)=>aDir==='asc'?(a[aSort]>b[aSort]?1:-1):(a[aSort]<b[aSort]?1:-1));return d;},[filtered,aSearch,aSort,aDir]);
  const aPaged=useMemo(()=>alphaData.slice((aPage-1)*PAGE_SIZE,aPage*PAGE_SIZE),[alphaData,aPage]);const aTP=Math.ceil(alphaData.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doFSort=(col)=>{if(fSort===col)setFDir(d=>d==='asc'?'desc':'asc');else{setFSort(col);setFDir('desc');}};
  const doASort=(col)=>{if(aSort===col)setADir(d=>d==='asc'?'desc':'asc');else{setASort(col);setADir('desc');}setAPage(1);};

  const stats=useMemo(()=>({total:filtered.length,avgESG:(filtered.reduce((s,r)=>s+r.esgScore,0)/filtered.length||0).toFixed(1),avgAlpha:(filtered.reduce((s,r)=>s+r.alphaContrib,0)/filtered.length||0).toFixed(2),avgSharpe:(filtered.reduce((s,r)=>s+r.sharpeRatio,0)/filtered.length||0).toFixed(2),positiveAlpha:filtered.filter(r=>r.alphaContrib>0).length,avgReturn:(filtered.reduce((s,r)=>s+r.annualReturn,0)/filtered.length||0).toFixed(1)}),[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td_={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel_={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
  const pb={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      {[['ESG Score',item.esgScore],['E Score',item.envScore],['S Score',item.socScore],['G Score',item.govScore],['ESG Momentum',item.esgMomentum],['Alpha Contrib',item.alphaContrib+'%'],['Factor Exposure',item.factorExposure],['Tracking Error',item.trackingError+'%'],['Info Ratio',item.infoRatio],['Sharpe Ratio',item.sharpeRatio],['Max Drawdown',item.maxDrawdown+'%'],['Beta',item.beta],['Annual Return',item.annualReturn+'%'],['Volatility',item.volatility+'%'],['Carbon Intensity',item.carbonIntensity],['Controversy',item.controversyScore]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
    </div></div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>ESG Factor Alpha</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>Factor Returns &middot; Alpha Decomposition &middot; {COMPANIES.length} Companies &middot; {FACTORS.length} Factors</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Universe',stats.total,T.navy],['Avg ESG',stats.avgESG,ACCENT],['Avg Alpha',stats.avgAlpha+'%',T.green],['Avg Sharpe',stats.avgSharpe,T.gold],['Positive Alpha',stats.positiveAlpha,T.sage],['Avg Return',stats.avgReturn+'%',T.amber]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Factor Returns Comparison</div>
          <ResponsiveContainer width="100%" height={250}><BarChart data={FACTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Bar dataKey="annReturn" fill={ACCENT} name="Ann.Return%" radius={[4,4,0,0]}/><Bar dataKey="alpha" fill={T.green} name="Alpha%" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>ESG Score vs Alpha</div>
          <ResponsiveContainer width="100%" height={250}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="ESG Score" tick={{fontSize:9}}/><YAxis dataKey="y" name="Alpha%" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.esgScore,y:r.alphaContrib}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search companies..." style={inp}/>
        <select value={sectorF} onChange={e=>{setSectorF(e.target.value);setPage(1);}} style={sel_}>{SECTORS.map(s=>(<option key={s}>{s}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'esg_factor_alpha.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length}</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['esgScore','ESG'],['envScore','E'],['socScore','S'],['govScore','G'],['esgMomentum','Momentum'],['alphaContrib','Alpha%'],['sharpeRatio','Sharpe'],['annualReturn','Return%']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td>
          <td style={td_}><span style={badge(r.esgScore,[25,50,70])}>{r.esgScore}</span></td>
          <td style={td_}>{r.envScore}</td><td style={td_}>{r.socScore}</td><td style={td_}>{r.govScore}</td>
          <td style={td_}><span style={{color:r.esgMomentum>0?T.green:T.red,fontWeight:600}}>{r.esgMomentum>0?'+':''}{r.esgMomentum}</span></td>
          <td style={td_}><span style={{color:r.alphaContrib>0?T.green:T.red,fontWeight:700}}>{r.alphaContrib>0?'+':''}{r.alphaContrib}%</span></td>
          <td style={td_}>{r.sharpeRatio}</td><td style={td_}><span style={{color:r.annualReturn>0?T.green:T.red}}>{r.annualReturn}%</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={aSearch} onChange={e=>{setASearch(e.target.value);setAPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(alphaData,'alpha_decomp.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{alphaData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['esgScore','ESG'],['alphaContrib','Alpha%'],['factorExposure','Factor Exp.'],['infoRatio','Info Ratio'],['sharpeRatio','Sharpe'],['annualReturn','Return%']].map(([k,l])=>(<th key={k} onClick={()=>doASort(k)} style={th}>{l}{si(k,aSort,aDir)}</th>))}
        </tr></thead><tbody>{aPaged.map((r,i)=>(<tr key={i}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td><td style={td_}>{r.esgScore}</td>
          <td style={td_}><span style={{color:r.alphaContrib>0?T.green:T.red,fontWeight:700}}>{r.alphaContrib>0?'+':''}{r.alphaContrib}%</span></td>
          <td style={td_}>{r.factorExposure}</td><td style={td_}>{r.infoRatio}</td><td style={td_}>{r.sharpeRatio}</td>
          <td style={td_}><span style={{color:r.annualReturn>0?T.green:T.red}}>{r.annualReturn}%</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={aPage<=1} onClick={()=>setAPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {aPage}/{aTP}</span><button disabled={aPage>=aTP} onClick={()=>setAPage(p=>p+1)} style={pb}>Next</button></div>
      <div style={{marginTop:16}}>
        <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:12,fontWeight:600,padding:'12px 16px'}}>ESG Factor Performance</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {[['name','Factor'],['annReturn','Ann.Ret%'],['sharpe','Sharpe'],['maxDD','Max DD%'],['alpha','Alpha%'],['tStat','t-Stat'],['turnover','Turnover%']].map(([k,l])=>(<th key={k} onClick={()=>doFSort(k)} style={th}>{l}{si(k,fSort,fDir)}</th>))}
          </tr></thead><tbody>{factorsSorted.map((r,i)=>(<tr key={i}>
            <td style={{...td_,fontWeight:600,color:ACCENT}}>{r.name}</td>
            <td style={td_}><span style={{color:T.green,fontWeight:600}}>{r.annReturn}%</span></td>
            <td style={td_}>{r.sharpe}</td><td style={td_}><span style={{color:T.red}}>{r.maxDD}%</span></td>
            <td style={td_}><span style={{color:T.green,fontWeight:600}}>{r.alpha}%</span></td>
            <td style={td_}>{r.tStat}</td><td style={td_}>{r.turnover}%</td>
          </tr>))}</tbody></table>
        </div>
      </div>
    </div>)}

    {tab===3&&(<div>
      <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Portfolio Backtest (60 Months)</div>
        <ResponsiveContainer width="100%" height={320}><LineChart data={BACKTEST}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={8}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="esgPortfolio" stroke={ACCENT} name="ESG Portfolio" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="benchmark" stroke={T.textMut} name="Benchmark" dot={false} strokeDasharray="5 5"/><Line type="monotone" dataKey="esgMomentum" stroke={T.green} name="ESG Momentum" dot={false}/><Line type="monotone" dataKey="lowCarbon" stroke={T.gold} name="Low Carbon" dot={false}/></LineChart></ResponsiveContainer>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Factor Sharpe Ratios</div>
          <ResponsiveContainer width="100%" height={250}><BarChart data={FACTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Bar dataKey="sharpe" fill={T.gold} name="Sharpe" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Max Drawdowns</div>
          <ResponsiveContainer width="100%" height={250}><BarChart data={FACTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Bar dataKey="maxDD" fill={T.red} name="Max DD%" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div style={{marginTop:12}}><button onClick={()=>exportCSV(BACKTEST,'backtest_data.csv')} style={btnS(false)}>Export Backtest CSV</button></div>
    </div>)}

    </div>
  </div>);
}
