import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const TABS=['Risk Dashboard','Portfolio Analysis','Copula Models','Stress Scenarios'];
const PAGE=12;

const STRATEGIES=['Long/Short Equity','Global Macro','Market Neutral','Risk Parity','Multi-Strategy','Event Driven','Statistical Arb','Vol Arb'];
const COPULAS=['Gaussian','Student-t','Clayton','Gumbel','Frank','Joe','BB1','BB7'];

const PORTFOLIOS=Array.from({length:50},(_,i)=>{const st=STRATEGIES[Math.floor(sr(i*3)*STRATEGIES.length)];return{id:i+1,name:'Portfolio '+(i+1)+' '+st.split('/')[0],strategy:st,
  aum:+(sr(i*11)*5000+100).toFixed(0),var95:+(sr(i*13)*8+1).toFixed(2),var99:+(sr(i*17)*12+2).toFixed(2),
  cvar95:+(sr(i*19)*12+2).toFixed(2),cvar99:+(sr(i*23)*18+3).toFixed(2),maxDD:+(sr(i*29)*30+5).toFixed(2),
  tailIndex:+(sr(i*31)*3+1).toFixed(2),copula:COPULAS[Math.floor(sr(i*37)*COPULAS.length)],
  corr:+(sr(i*41)*0.6+0.1).toFixed(3),tailDep:+(sr(i*43)*0.4+0.05).toFixed(3),
  skew:+(sr(i*47)*2-1).toFixed(3),kurt:+(sr(i*53)*8+3).toFixed(2),beta:+(sr(i*59)*1.5+0.3).toFixed(3),
  sharpe:+(sr(i*61)*2-0.2).toFixed(2),sortino:+(sr(i*67)*3-0.1).toFixed(2),
  returnYtd:+(sr(i*73)*30-10).toFixed(2),vol:+(sr(i*79)*20+5).toFixed(2),
  positions:Math.floor(sr(i*83)*200+20),leverage:+(sr(i*89)*3+0.5).toFixed(1),
  expectedShortfall:+(sr(i*97)*15+3).toFixed(2),marginalVaR:+(sr(i*101)*5+0.5).toFixed(2),
};});

const MONTHLY=Array.from({length:24},(_,i)=>{const d=new Date(2024,i%12,1);return{month:d.toLocaleString('default',{month:'short'})+' '+(2024+Math.floor(i/12)),
  var95:+(sr(i*103)*5+2).toFixed(2),cvar95:+(sr(i*107)*7+3).toFixed(2),tailEvents:Math.floor(sr(i*109)*5),
  corr:+(sr(i*113)*0.3+0.3).toFixed(2),vol:+(sr(i*117)*10+8).toFixed(2),dd:+(sr(i*121)*15+1).toFixed(2)};});

const STRESS=[{name:'2008 GFC',loss:22.5,prob:1.2,recovery:450},{name:'COVID-19',loss:18.3,prob:2.1,recovery:120},{name:'Taper Tantrum',loss:8.7,prob:5.4,recovery:90},{name:'Eurozone Crisis',loss:14.2,prob:2.8,recovery:280},{name:'China Deval',loss:9.1,prob:4.2,recovery:95},{name:'Brexit',loss:7.5,prob:6.1,recovery:60},{name:'Oil Crash 2014',loss:11.4,prob:3.5,recovery:200},{name:'Tech Bubble',loss:25.1,prob:0.8,recovery:600},{name:'Flash Crash',loss:6.2,prob:8.5,recovery:5},{name:'SVB Crisis',loss:8.9,prob:4.8,recovery:45},{name:'Yen Carry Unwind',loss:12.3,prob:3.1,recovery:75},{name:'EM Currency',loss:10.8,prob:3.9,recovery:150}].map((s,i)=>({...s,id:i+1,contagion:+(sr(i*127)*80+10).toFixed(1),severity:+(sr(i*131)*40+20).toFixed(1)}));

const COPULA_COMPARE=COPULAS.map((c,i)=>({name:c,logLik:+(sr(i*137)*50-100).toFixed(1),aic:+(sr(i*139)*100+200).toFixed(1),bic:+(sr(i*143)*100+210).toFixed(1),tailFit:+(sr(i*149)*40+50).toFixed(1),corr:+(sr(i*151)*0.5+0.2).toFixed(3)}));

export default function CopulaTailRiskPage(){
  const [tab,setTab]=useState(0);const [search,setSearch]=useState('');const [sortCol,setSortCol]=useState('var95');const [sortDir,setSortDir]=useState('desc');const [page,setPage]=useState(0);const [expanded,setExpanded]=useState(null);const [filterStrat,setFilterStrat]=useState('All');
  const [stressSearch,setStressSearch]=useState('');const [stressSort,setStressSort]=useState('loss');const [stressDir,setStressDir]=useState('desc');const [stressExp,setStressExp]=useState(null);

  const filtered=useMemo(()=>{let d=[...PORTFOLIOS];if(search)d=d.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));if(filterStrat!=='All')d=d.filter(p=>p.strategy===filterStrat);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,filterStrat]);
  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);
  const stressF=useMemo(()=>{let d=[...STRESS];if(stressSearch)d=d.filter(s=>s.name.toLowerCase().includes(stressSearch.toLowerCase()));d.sort((a,b)=>stressDir==='asc'?((a[stressSort]>b[stressSort])?1:-1):((a[stressSort]<b[stressSort])?1:-1));return d;},[stressSearch,stressSort,stressDir]);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const doSSort=(col)=>{if(stressSort===col)setStressDir(d=>d==='asc'?'desc':'asc');else{setStressSort(col);setStressDir('desc');}};
  const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const kpis=useMemo(()=>({count:filtered.length,avgVaR:(filtered.reduce((s,p)=>s+parseFloat(p.var95),0)/filtered.length).toFixed(2),avgCVaR:(filtered.reduce((s,p)=>s+parseFloat(p.cvar95),0)/filtered.length).toFixed(2),avgTail:(filtered.reduce((s,p)=>s+parseFloat(p.tailIndex),0)/filtered.length).toFixed(2),avgDD:(filtered.reduce((s,p)=>s+parseFloat(p.maxDD),0)/filtered.length).toFixed(2)}),[filtered]);

  const SH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const SSH=({col,label})=><th onClick={()=>doSSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,userSelect:'none'}}>{label}{stressSort===col?(stressDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const Pg=({pg,setPg,tot})=><div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}><button onClick={()=>setPg(p=>Math.max(0,p-1))} disabled={pg===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg===0?'default':'pointer',opacity:pg===0?0.4:1,fontSize:12}}>Prev</button>{Array.from({length:Math.min(tot,7)},(_,i)=>{const p=tot<=7?i:pg<3?i:pg>tot-4?tot-7+i:pg-3+i;return <button key={p} onClick={()=>setPg(p)} style={{padding:'6px 12px',border:`1px solid ${pg===p?T.gold:T.border}`,borderRadius:6,background:pg===p?T.gold:'transparent',color:pg===p?'#fff':T.text,cursor:'pointer',fontWeight:pg===p?700:400,fontSize:12}}>{p+1}</button>;})}<button onClick={()=>setPg(p=>Math.min(tot-1,p+1))} disabled={pg>=tot-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg>=tot-1?'default':'pointer',opacity:pg>=tot-1?0.4:1,fontSize:12}}>Next</button></div>;

  const renderDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Portfolios',v:kpis.count},{l:'Avg VaR 95%',v:kpis.avgVaR+'%'},{l:'Avg CVaR 95%',v:kpis.avgCVaR+'%'},{l:'Avg Tail Index',v:kpis.avgTail},{l:'Avg Max DD',v:kpis.avgDD+'%'}].map((k,i)=><div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>VaR & CVaR Trend</div>
          <ResponsiveContainer width="100%" height={280}><AreaChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Area type="monotone" dataKey="var95" stroke={T.red} fill={T.red} fillOpacity={0.15} name="VaR 95%"/>
            <Area type="monotone" dataKey="cvar95" stroke={T.navy} fill={T.navy} fillOpacity={0.1} name="CVaR 95%"/>
          </AreaChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Strategy Distribution</div>
          <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={STRATEGIES.map(s=>({name:s.length>14?s.slice(0,14)+'..':s,value:filtered.filter(p=>p.strategy===s).length})).filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{STRATEGIES.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Tail Events & Correlation</div>
          <ResponsiveContainer width="100%" height={260}><LineChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Line yAxisId="l" type="monotone" dataKey="tailEvents" stroke={T.red} strokeWidth={2} name="Tail Events"/>
            <Line yAxisId="r" type="monotone" dataKey="corr" stroke={T.navy} strokeWidth={2} name="Avg Correlation"/>
          </LineChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>VaR vs Return Scatter</div>
          <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="VaR 95%" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="YTD Return" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[40,400]}/><Tooltip {...tip}/>
            <Scatter data={filtered.map(p=>({name:p.name,x:parseFloat(p.var95),y:parseFloat(p.returnYtd),z:p.aum/10}))} fill={T.navy} fillOpacity={0.5}/>
          </ScatterChart></ResponsiveContainer></div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Drawdown & Volatility Trend</div>
        <ResponsiveContainer width="100%" height={250}><AreaChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
          <Area type="monotone" dataKey="dd" stroke={T.red} fill={T.red} fillOpacity={0.1} name="Drawdown %"/>
          <Area type="monotone" dataKey="vol" stroke={T.gold} fill={T.gold} fillOpacity={0.1} name="Volatility %"/>
        </AreaChart></ResponsiveContainer></div>
    </div>
  );

  const renderPortfolios=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search portfolios..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <select value={filterStrat} onChange={e=>{setFilterStrat(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Strategies</option>{STRATEGIES.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <button onClick={()=>exportCSV(filtered,'tail_risk.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>{filtered.length} portfolios | Page {page+1}/{totalPages}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <SH col="name" label="Portfolio" w="160px"/><SH col="strategy" label="Strategy"/><SH col="var95" label="VaR 95%"/>
            <SH col="cvar95" label="CVaR 95%"/><SH col="tailIndex" label="Tail Idx"/><SH col="copula" label="Copula"/>
            <SH col="sharpe" label="Sharpe"/><SH col="returnYtd" label="YTD %"/><SH col="vol" label="Vol %"/>
          </tr></thead>
          <tbody>{paged.map(p=>(
            <React.Fragment key={p.id}>
              <tr onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{cursor:'pointer',background:expanded===p.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===p.id?'\u25BC':'\u25B6'} {p.name}</td>
                <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{p.strategy}</span></td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(p.var95)>5?T.red:T.green}}>{p.var95}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.cvar95}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.tailIndex}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.copula}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.sharpe}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(p.returnYtd)>0?T.green:T.red}}>{p.returnYtd}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.vol}%</td>
              </tr>
              {expanded===p.id&&(
                <tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Metrics</div>
                      {[['VaR 99%',p.var99+'%'],['CVaR 99%',p.cvar99+'%'],['Max Drawdown',p.maxDD+'%'],['Expected Shortfall',p.expectedShortfall+'%'],['Marginal VaR',p.marginalVaR+'%'],['Correlation',p.corr],['Tail Dependence',p.tailDep]].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>)}
                    </div>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Portfolio Details</div>
                      {[['AUM ($M)',fmt(p.aum)],['Positions',p.positions],['Leverage',p.leverage+'x'],['Skewness',p.skew],['Kurtosis',p.kurt],['Beta',p.beta],['Sortino',p.sortino]].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>)}
                    </div>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Profile</div>
                      <ResponsiveContainer width="100%" height={200}><RadarChart data={[{m:'VaR',v:parseFloat(p.var95)*8},{m:'CVaR',v:parseFloat(p.cvar95)*5},{m:'Tail',v:parseFloat(p.tailIndex)*20},{m:'Vol',v:parseFloat(p.vol)*3},{m:'DD',v:parseFloat(p.maxDD)*2},{m:'Leverage',v:parseFloat(p.leverage)*15}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={T.red} fill={T.red} fillOpacity={0.2}/></RadarChart></ResponsiveContainer>
                    </div>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody>
        </table>
      </div>
      <Pg pg={page} setPg={setPage} tot={totalPages}/>
    </div>
  );

  const renderCopula=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Copula Fit Comparison (AIC)</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={COPULA_COMPARE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Bar dataKey="aic" fill={T.navy} name="AIC" radius={[4,4,0,0]}/>
            <Bar dataKey="bic" fill={T.gold} name="BIC" radius={[4,4,0,0]}/>
          </BarChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Tail Fit Quality</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={COPULA_COMPARE} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={80} tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="tailFit" fill={T.sage} radius={[0,6,6,0]} name="Tail Fit Score"/></BarChart></ResponsiveContainer></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Copula Usage in Portfolios</div>
          <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={COPULAS.map(c=>({name:c,value:PORTFOLIOS.filter(p=>p.copula===c).length})).filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{COPULAS.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Log-Likelihood by Copula</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={COPULA_COMPARE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="logLik" fill={T.navy} radius={[6,6,0,0]} name="Log-Likelihood"/></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  const renderStress=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={stressSearch} onChange={e=>setStressSearch(e.target.value)} placeholder="Search scenarios..." style={{flex:1,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <button onClick={()=>exportCSV(STRESS,'stress_scenarios.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto',marginBottom:20}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <SSH col="name" label="Scenario"/><SSH col="loss" label="Loss %"/><SSH col="prob" label="Prob %"/><SSH col="recovery" label="Recovery (days)"/><SSH col="contagion" label="Contagion"/><SSH col="severity" label="Severity"/>
          </tr></thead>
          <tbody>{stressF.map(s=>(
            <React.Fragment key={s.id}>
              <tr onClick={()=>setStressExp(stressExp===s.id?null:s.id)} style={{cursor:'pointer',background:stressExp===s.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{stressExp===s.id?'\u25BC':'\u25B6'} {s.name}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:T.red}}>{s.loss}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{s.prob}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{s.recovery}d</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{s.contagion}</td>
                <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:parseFloat(s.severity)>40?'#fee2e2':'#fef3c7',color:parseFloat(s.severity)>40?'#991b1b':'#92400e'}}>{s.severity}</span></td>
              </tr>
              {stressExp===s.id&&(
                <tr><td colSpan={6} style={{padding:16,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                      <p><strong>{s.name}</strong> stress scenario with estimated portfolio loss of {s.loss}% and {s.recovery}-day recovery period.</p>
                      <p>Tail probability of {s.prob}% with contagion score {s.contagion}/100.</p>
                    </div>
                    <ResponsiveContainer width="100%" height={160}><RadarChart data={[{m:'Loss',v:s.loss*3},{m:'Probability',v:s.prob*10},{m:'Recovery',v:s.recovery/6},{m:'Contagion',v:parseFloat(s.contagion)},{m:'Severity',v:parseFloat(s.severity)*1.5}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><Radar dataKey="v" stroke={T.red} fill={T.red} fillOpacity={0.2}/></RadarChart></ResponsiveContainer>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody>
        </table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Scenario Loss Comparison</div>
          <ResponsiveContainer width="100%" height={300}><BarChart data={STRESS} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={110} tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="loss" fill={T.red} radius={[0,6,6,0]} name="Loss %"/></BarChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Loss vs Recovery</div>
          <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Loss %" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Recovery (days)" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[60,400]}/><Tooltip {...tip}/>
            <Scatter data={STRESS.map(s=>({name:s.name,x:s.loss,y:s.recovery,z:parseFloat(s.contagion)*3}))} fill={T.navy} fillOpacity={0.6}/>
          </ScatterChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Quantitative Risk</div><h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>Copula Tail Risk Modelling</h1><div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/></div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}</div>
      {tab===0&&renderDash()}{tab===1&&renderPortfolios()}{tab===2&&renderCopula()}{tab===3&&renderStress()}
    </div>
  );
}