import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0c4a6e';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Factor Screening','Alpha Decomposition','Backtesting'];
const SECTORS=['All','Technology','Healthcare','Finance','Energy','Industrials','Consumer','Materials','Utilities','Real Estate','Telecom'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#8b5cf6','#0891b2','#be185d'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const COMPANIES=(()=>{const names=['Apple Inc','Microsoft Corp','Alphabet Inc','Amazon.com','Meta Platforms','NVIDIA Corp','Tesla Inc','JPMorgan Chase','Johnson & Johnson','UnitedHealth','Visa Inc','Procter & Gamble','Mastercard','Home Depot','Chevron Corp','AbbVie Inc','Merck & Co','PepsiCo Inc','Costco Wholesale','Coca-Cola Co','Thermo Fisher','McDonald Corp','Cisco Systems','Adobe Inc','Salesforce','Intel Corp','Texas Instruments','Honeywell','Amgen Inc','Caterpillar','Deere & Co','IBM Corp','General Electric','3M Company','Goldman Sachs','Morgan Stanley','BlackRock','S&P Global','Moody Corp','Charles Schwab','Citigroup','Wells Fargo','Bank of America','US Bancorp','Truist Financial','PNC Financial','Capital One','American Express','Discover Financial','Synchrony Fin','NextEra Energy','Duke Energy','Southern Co','Dominion Energy','Exelon Corp','AES Corp','Eversource','WEC Energy','CenterPoint','Entergy Corp','Prologis Inc','American Tower','Crown Castle','Equinix Inc','Digital Realty','Public Storage','Welltower Inc','Realty Income','Simon Property','VICI Properties','Exxon Mobil','ConocoPhillips','EOG Resources','Pioneer Natural','Devon Energy','Marathon Petro','Valero Energy','Phillips 66','Schlumberger','Halliburton','Linde plc','Air Products','Sherwin-Williams','Ecolab Inc','Nucor Corp','Freeport McMoRan','Newmont Corp','Corteva Inc','CF Industries','Mosaic Co','Eli Lilly','Pfizer Inc','Bristol-Myers','Regeneron','Vertex Pharma','Gilead Sciences','Danaher Corp','Becton Dickinson','Stryker Corp','Edwards Lifesci'];
const secs=['Technology','Technology','Technology','Technology','Technology','Technology','Technology','Finance','Healthcare','Healthcare','Finance','Consumer','Finance','Consumer','Energy','Healthcare','Healthcare','Consumer','Consumer','Consumer','Healthcare','Consumer','Technology','Technology','Technology','Technology','Technology','Industrials','Healthcare','Industrials','Industrials','Technology','Industrials','Industrials','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Finance','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Real Estate','Energy','Energy','Energy','Energy','Energy','Energy','Energy','Energy','Energy','Energy','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare'];
return names.map((n,i)=>({id:i+1,name:n,sector:secs[i],esgScore:Math.round(20+sr(i*7)*75),eReturn:+((sr(i*11)-0.3)*20).toFixed(2),sReturn:+((sr(i*13)-0.3)*15).toFixed(2),gReturn:+((sr(i*17)-0.3)*12).toFixed(2),totalAlpha:+((sr(i*19)-0.35)*25).toFixed(2),momentum:+((sr(i*23)-0.4)*18).toFixed(2),quality:Math.round(20+sr(i*29)*75),value:+((sr(i*31)-0.5)*10).toFixed(2),size:+((sr(i*37)-0.5)*8).toFixed(2),volatility:+(5+sr(i*41)*30).toFixed(2),sharpe:+((sr(i*43)-0.2)*3).toFixed(2),infoRatio:+((sr(i*47)-0.3)*2.5).toFixed(2),maxDrawdown:+(-(sr(i*53)*35+5)).toFixed(2),trackingError:+(1+sr(i*59)*8).toFixed(2),beta:+(0.5+sr(i*61)*1.2).toFixed(2),marketCap:Math.round(10+sr(i*67)*900)}));})();

const BACKTEST=Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,esgAlpha:+((sr(i*7)-0.4)*3).toFixed(2),eAlpha:+((sr(i*11)-0.35)*2.5).toFixed(2),sAlpha:+((sr(i*13)-0.4)*2).toFixed(2),gAlpha:+((sr(i*17)-0.45)*1.8).toFixed(2),cumulative:+(i*0.3+sr(i*19)*5-2).toFixed(2),benchmark:+(i*0.2+sr(i*23)*4-1).toFixed(2)}));
const FACTORS=[{factor:'ESG Quality',return3m:2.4,return12m:8.7,sharpe:1.2,ir:0.85},{factor:'E - Climate',return3m:1.8,return12m:6.2,sharpe:0.9,ir:0.65},{factor:'S - Workforce',return3m:1.1,return12m:4.8,sharpe:0.7,ir:0.52},{factor:'G - Board',return3m:2.1,return12m:7.1,sharpe:1.05,ir:0.78},{factor:'ESG Momentum',return3m:3.2,return12m:11.5,sharpe:1.45,ir:1.1},{factor:'Carbon Intensity',return3m:-0.8,return12m:3.1,sharpe:0.4,ir:0.25},{factor:'Green Revenue',return3m:1.5,return12m:5.8,sharpe:0.85,ir:0.6},{factor:'Controversy',return3m:-1.2,return12m:-2.4,sharpe:-0.3,ir:-0.2}];

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function EsgFactorAlphaPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[secF,setSecF]=useState('All');
  const[sortCol,setSortCol]=useState('totalAlpha');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(secF!=='All')d=d.filter(r=>r.sector===secF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,secF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>+(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length).toFixed(2);return{avgAlpha:avg('totalAlpha'),avgSharpe:avg('sharpe'),avgEsg:Math.round(COMPANIES.reduce((s,c)=>s+c.esgScore,0)/COMPANIES.length),positiveAlpha:COMPANIES.filter(c=>c.totalAlpha>0).length,avgIR:avg('infoRatio')};},[]);
  const sectorAlpha=useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,alpha:0,n:0};m[c.sector].alpha+=c.totalAlpha;m[c.sector].n++;});return Object.values(m).map(s=>({...s,alpha:+(s.alpha/s.n).toFixed(2)}));},[]);
  const alphaDistData=useMemo(()=>{const bins=[{range:'<-5%',count:0},{range:'-5 to 0%',count:0},{range:'0 to 5%',count:0},{range:'5 to 10%',count:0},{range:'>10%',count:0}];COMPANIES.forEach(c=>{if(c.totalAlpha<-5)bins[0].count++;else if(c.totalAlpha<0)bins[1].count++;else if(c.totalAlpha<5)bins[2].count++;else if(c.totalAlpha<10)bins[3].count++;else bins[4].count++;});return bins;},[]);
  const radarData=useMemo(()=>[{dim:'E Return',value:Math.abs(kpis.avgAlpha)*10+40},{dim:'S Return',value:Math.abs(kpis.avgSharpe)*20+30},{dim:'G Return',value:Math.abs(kpis.avgIR)*25+35},{dim:'Quality',value:50},{dim:'Momentum',value:45},{dim:'Sharpe',value:Math.abs(kpis.avgSharpe)*30+30}],[kpis]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(12,74,110,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const pnl=(v)=>({color:v>=0?T.green:T.red,fontFamily:T.mono,fontWeight:600,fontSize:12});

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Alpha" value={(kpis.avgAlpha>0?'+':'')+kpis.avgAlpha+'%'} sub="100 companies" color={kpis.avgAlpha>=0?T.green:T.red}/>
      <KPI label="Avg Sharpe" value={kpis.avgSharpe} sub="risk-adjusted" color={ACCENT}/><KPI label="Avg ESG Score" value={kpis.avgEsg} sub="/100" color={T.navy}/>
      <KPI label="Positive Alpha" value={kpis.positiveAlpha} sub="companies" color={T.green}/><KPI label="Info Ratio" value={kpis.avgIR} sub="avg" color={T.gold}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Alpha by Sector</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={sectorAlpha}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="alpha" fill={ACCENT} radius={[4,4,0,0]} name="Avg Alpha %">{sectorAlpha.map((e,i)=><Cell key={i} fill={e.alpha>=0?T.green:T.red}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Alpha Distribution</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={alphaDistData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="range" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]} name="Companies"/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Cumulative Returns</div>
        <ResponsiveContainer width="100%" height={240}><LineChart data={BACKTEST}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="cumulative" stroke={ACCENT} strokeWidth={2} name="ESG Strategy"/><Line type="monotone" dataKey="benchmark" stroke={T.textMut} strokeWidth={1.5} strokeDasharray="5 5" name="Benchmark"/></LineChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Factor Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Score" dataKey="value" stroke={ACCENT} fill="rgba(12,74,110,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={secF} onChange={e=>{setSecF(e.target.value);setPage(1);}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'esg_factor_alpha')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Company" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="sector" label="Sector" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="esgScore" label="ESG" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="totalAlpha" label="Alpha %" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="eReturn" label="E Return" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="sReturn" label="S Return" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="sharpe" label="Sharpe" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="volatility" label="Vol %" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}>{r.sector}</td>
        <td style={ss.td}><span style={badge(r.esgScore,[25,50,70])}>{r.esgScore}</span></td>
        <td style={pnl(r.totalAlpha)}>{r.totalAlpha>0?'+':''}{r.totalAlpha}%</td>
        <td style={pnl(r.eReturn)}>{r.eReturn>0?'+':''}{r.eReturn}%</td>
        <td style={pnl(r.sReturn)}>{r.sReturn>0?'+':''}{r.sReturn}%</td>
        <td style={{...ss.td,fontFamily:T.mono}}>{r.sharpe}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.volatility}%</td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['G Return',r.gReturn+'%'],['Momentum',r.momentum+'%'],['Quality',r.quality],['Value',r.value],['Size',r.size],['Info Ratio',r.infoRatio],['Max Drawdown',r.maxDrawdown+'%'],['Tracking Error',r.trackingError+'%'],['Beta',r.beta],['Market Cap ($B)',r.marketCap]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'E',v:50+r.eReturn*3},{d:'S',v:50+r.sReturn*3},{d:'G',v:50+r.gReturn*3},{d:'Quality',v:r.quality},{d:'Momentum',v:50+r.momentum*2},{d:'Sharpe',v:50+r.sharpe*15}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(12,74,110,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'E Alpha',v:r.eReturn},{n:'S Alpha',v:r.sReturn},{n:'G Alpha',v:r.gReturn},{n:'Total',v:r.totalAlpha}]}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="n" tick={{fontSize:9,fill:T.textMut}}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="v" radius={[4,4,0,0]} name="Return %">{[0,1,2,3].map(i=><Cell key={i} fill={[r.eReturn,r.sReturn,r.gReturn,r.totalAlpha][i]>=0?T.green:T.red}/>)}</Bar></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderDecomp=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>ESG Factor Alpha Decomposition</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={FACTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="factor" tick={{fontSize:9,fill:T.textMut}} angle={-20} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="return12m" fill={ACCENT} radius={[4,4,0,0]} name="12M Return %">{FACTORS.map((f,i)=><Cell key={i} fill={f.return12m>=0?T.green:T.red}/>)}</Bar></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><AreaChart data={BACKTEST}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="eAlpha" stroke={T.green} fill="rgba(22,163,74,0.08)" name="E Alpha"/><Area type="monotone" dataKey="sAlpha" stroke={ACCENT} fill="rgba(12,74,110,0.08)" name="S Alpha"/><Area type="monotone" dataKey="gAlpha" stroke={T.gold} fill="rgba(197,169,106,0.08)" name="G Alpha"/></AreaChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Factor</th><th style={ss.th('','','')}>3M Return</th><th style={ss.th('','','')}>12M Return</th><th style={ss.th('','','')}>Sharpe</th><th style={ss.th('','','')}>Info Ratio</th></tr></thead><tbody>
      {FACTORS.map((f,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{f.factor}</td><td style={pnl(f.return3m)}>{f.return3m>0?'+':''}{f.return3m}%</td><td style={pnl(f.return12m)}>{f.return12m>0?'+':''}{f.return12m}%</td><td style={{...ss.td,fontFamily:T.mono}}>{f.sharpe}</td><td style={{...ss.td,fontFamily:T.mono}}>{f.ir}</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(FACTORS,'factor_decomposition')}>Export CSV</button></div>
  </div>);

  const renderBacktest=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>ESG Strategy Backtesting (36 months)</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={300}><LineChart data={BACKTEST}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Line type="monotone" dataKey="cumulative" stroke={ACCENT} strokeWidth={2} name="ESG Strategy"/><Line type="monotone" dataKey="benchmark" stroke={T.textMut} strokeWidth={1.5} strokeDasharray="5 5" name="Benchmark"/></LineChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}><BarChart data={BACKTEST}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:8,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="esgAlpha" name="Monthly Alpha %">{BACKTEST.map((e,i)=><Cell key={i} fill={e.esgAlpha>=0?T.green:T.red}/>)}</Bar></BarChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Month</th><th style={ss.th('','','')}>ESG Alpha</th><th style={ss.th('','','')}>E Alpha</th><th style={ss.th('','','')}>S Alpha</th><th style={ss.th('','','')}>G Alpha</th><th style={ss.th('','','')}>Cumulative</th></tr></thead><tbody>
      {BACKTEST.map((r,i)=>(<tr key={i}><td style={{...ss.td,fontFamily:T.mono}}>{r.month}</td><td style={pnl(r.esgAlpha)}>{r.esgAlpha>0?'+':''}{r.esgAlpha}%</td><td style={pnl(r.eAlpha)}>{r.eAlpha>0?'+':''}{r.eAlpha}%</td><td style={pnl(r.sAlpha)}>{r.sAlpha>0?'+':''}{r.sAlpha}%</td><td style={pnl(r.gAlpha)}>{r.gAlpha>0?'+':''}{r.gAlpha}%</td><td style={pnl(r.cumulative)}>{r.cumulative>0?'+':''}{r.cumulative}%</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(BACKTEST,'backtest_results')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>ESG Factor Alpha Engine</div>
    <div style={ss.sub}>Factor return attribution, alpha decomposition, backtesting across 100 companies</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderDecomp()}{tab===3&&renderBacktest()}
  </div>);
}