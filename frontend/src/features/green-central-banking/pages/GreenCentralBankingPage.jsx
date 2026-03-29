import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0e7490';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Central Bank Profiles','Green QE & Reserves','Climate Mandates'];
const REGIONS=['All','Europe','Asia Pacific','North America','Latin America','Africa','Middle East'];
const NGFS_STATUS=['All','Member','Observer','Non-Member'];
const PAGE_SIZE=10;

const BANKS=(()=>{
  const names=['ECB','Federal Reserve','Bank of Japan','People\'s Bank of China','Bank of England','Swiss National Bank','Reserve Bank of Australia','Bank of Canada','Riksbank Sweden','Norges Bank','Deutsche Bundesbank','Banque de France','Banca d\'Italia','Banco de España','De Nederlandsche Bank','Reserve Bank of India','Bank Indonesia','Bank of Korea','Monetary Auth. Singapore','Bank Negara Malaysia','Central Bank of Brazil','Banco de México','Central Bank of Chile','Central Bank of Colombia','South African Reserve','Central Bank of Nigeria','Bank of Thailand','State Bank of Vietnam','Central Bank of Philippines','Central Bank of Egypt'];
  const regs=['Europe','North America','Asia Pacific','Asia Pacific','Europe','Europe','Asia Pacific','North America','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Asia Pacific','Asia Pacific','Asia Pacific','Asia Pacific','Asia Pacific','Latin America','Latin America','Latin America','Latin America','Africa','Africa','Asia Pacific','Asia Pacific','Asia Pacific','Africa'];
  return names.map((n,i)=>({id:i+1,name:n,region:regs[i],ngfsStatus:sr(i*7)<0.6?'Member':sr(i*7)<0.85?'Observer':'Non-Member',greenQE:sr(i*11)<0.35,climateMandateExplicit:sr(i*13)<0.4,greenBondHoldings:Math.round(sr(i*17)*80000),reserveESGIntegration:Math.round(10+sr(i*19)*80),climateStressTest:sr(i*23)<0.5?'Conducted':sr(i*23)<0.8?'Planned':'None',taxonomyAdopted:sr(i*29)<0.45?'Yes':'No',disclosureRequirement:sr(i*31)<0.55?'Mandatory':sr(i*31)<0.8?'Recommended':'None',collateralPolicy:sr(i*37)<0.35?'Green-Adjusted':'Standard',prudentialClimate:Math.round(15+sr(i*41)*80),researchOutput:Math.round(5+sr(i*43)*45),greenFinancePolicy:Math.round(10+sr(i*47)*85),supervisoryExpectation:sr(i*53)<0.4?'Published':sr(i*53)<0.7?'Drafting':'None',policyRate:+(0.5+sr(i*59)*8).toFixed(2),balanceSheet:Math.round(100+sr(i*61)*8000),greenAssetRatio:+(sr(i*67)*15).toFixed(1),carbonFootprint:Math.round(50+sr(i*71)*450),overallScore:Math.round(10+sr(i*73)*85)}));})();

const MANDATES=(()=>BANKS.map((b,i)=>({id:i+1,bank:b.name,region:b.region,priceStability:sr(i*7)<0.9,financialStability:sr(i*11)<0.7,climateRisk:sr(i*13)<0.45,greenTransition:sr(i*17)<0.35,biodiversity:sr(i*19)<0.15,socialObjective:sr(i*23)<0.25,mandateScore:Math.round(20+sr(i*29)*75),legalBasis:sr(i*31)<0.4?'Primary Legislation':sr(i*31)<0.7?'Secondary Mandate':'Interpretive',lastUpdated:`202${Math.floor(3+sr(i*37)*3)}`})))();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,greenBonds:Math.round(200+i*15+sr(i*7)*50),stressTests:Math.round(3+sr(i*11)*5),newPolicies:Math.round(1+sr(i*13)*4),ngfsMembers:Math.round(100+i*2+sr(i*17)*3)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

export default function GreenCentralBankingPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[regionF,setRegionF]=useState('All');const[ngfsF,setNgfsF]=useState('All');const[sortCol,setSortCol]=useState('overallScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[qSearch,setQSearch]=useState('');const[qSort,setQSort]=useState('greenBondHoldings');const[qDir,setQDir]=useState('desc');const[qPage,setQPage]=useState(1);
  const[mSearch,setMSearch]=useState('');const[mSort,setMSort]=useState('mandateScore');const[mDir,setMDir]=useState('desc');const[mPage,setMPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...BANKS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(regionF!=='All')d=d.filter(r=>r.region===regionF);if(ngfsF!=='All')d=d.filter(r=>r.ngfsStatus===ngfsF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regionF,ngfsF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);

  const qData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,region:r.region,greenBondHoldings:r.greenBondHoldings,reserveESGIntegration:r.reserveESGIntegration,greenAssetRatio:r.greenAssetRatio,collateralPolicy:r.collateralPolicy,balanceSheet:r.balanceSheet}));if(qSearch)d=d.filter(r=>r.name.toLowerCase().includes(qSearch.toLowerCase()));d.sort((a,b)=>qDir==='asc'?(a[qSort]>b[qSort]?1:-1):(a[qSort]<b[qSort]?1:-1));return d;},[filtered,qSearch,qSort,qDir]);
  const qPaged=useMemo(()=>qData.slice((qPage-1)*PAGE_SIZE,qPage*PAGE_SIZE),[qData,qPage]);const qTP=Math.ceil(qData.length/PAGE_SIZE);

  const mData=useMemo(()=>{let d=[...MANDATES];if(mSearch)d=d.filter(r=>r.bank.toLowerCase().includes(mSearch.toLowerCase()));d.sort((a,b)=>mDir==='asc'?(a[mSort]>b[mSort]?1:-1):(a[mSort]<b[mSort]?1:-1));return d;},[mSearch,mSort,mDir]);
  const mPaged=useMemo(()=>mData.slice((mPage-1)*PAGE_SIZE,mPage*PAGE_SIZE),[mData,mPage]);const mTP=Math.ceil(mData.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doQSort=(col)=>{if(qSort===col)setQDir(d=>d==='asc'?'desc':'asc');else{setQSort(col);setQDir('desc');}setQPage(1);};
  const doMSort=(col)=>{if(mSort===col)setMDir(d=>d==='asc'?'desc':'asc');else{setMSort(col);setMDir('desc');}setMPage(1);};

  const stats=useMemo(()=>({total:filtered.length,ngfs:filtered.filter(r=>r.ngfsStatus==='Member').length,avgScore:(filtered.reduce((s,r)=>s+r.overallScore,0)/filtered.length||0).toFixed(1),stressTest:filtered.filter(r=>r.climateStressTest==='Conducted').length,greenQE:filtered.filter(r=>r.greenQE).length,totalGreen:filtered.reduce((s,r)=>s+r.greenBondHoldings,0)}),[filtered]);

  const ngfsDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.ngfsStatus]=(m[r.ngfsStatus]||0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[filtered]);
  const regionAvg=useMemo(()=>{const m={};filtered.forEach(r=>{if(!m[r.region])m[r.region]={s:0,c:0};m[r.region].s+=r.overallScore;m[r.region].c++;});return Object.entries(m).map(([k,v])=>({region:k,avg:+(v.s/v.c).toFixed(1)})).sort((a,b)=>b.avg-a.avg);},[filtered]);

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
      {[['NGFS Status',item.ngfsStatus],['Overall Score',item.overallScore],['Green QE',item.greenQE?'Yes':'No'],['Climate Mandate',item.climateMandateExplicit?'Explicit':'Implicit'],['Green Bonds','$'+item.greenBondHoldings+'M'],['ESG Integration',item.reserveESGIntegration+'%'],['Stress Test',item.climateStressTest],['Taxonomy',item.taxonomyAdopted],['Disclosure',item.disclosureRequirement],['Collateral',item.collateralPolicy],['Prudential',item.prudentialClimate],['Research Papers',item.researchOutput],['Green Finance',item.greenFinancePolicy],['Supervisory',item.supervisoryExpectation],['Policy Rate',item.policyRate+'%'],['Balance Sheet','$'+item.balanceSheet+'B']].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
    </div></div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>Green Central Banking</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>NGFS &middot; Green QE &middot; Climate Stress Testing &middot; {BANKS.length} Central Banks</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Central Banks',stats.total,T.navy],['NGFS Members',stats.ngfs,ACCENT],['Avg Score',stats.avgScore,T.green],['Stress Tests Done',stats.stressTest,T.gold],['Green QE Active',stats.greenQE,T.sage],['Total Green','$'+(stats.totalGreen/1000).toFixed(0)+'B',T.amber]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Green Finance Trend (24M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Area type="monotone" dataKey="greenBonds" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Green Bond Holdings ($B)"/><Area type="monotone" dataKey="ngfsMembers" stroke={T.sage} fill={T.sage} fillOpacity={0.1} name="NGFS Members"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>NGFS Status</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={ngfsDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>{ngfsDist.map((_,i)=>(<Cell key={i} fill={[T.green,T.gold,T.red][i%3]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Regional Scores</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={regionAvg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9}} domain={[0,100]}/><YAxis dataKey="region" type="category" tick={{fontSize:9}} width={85}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search banks..." style={inp}/>
        <select value={regionF} onChange={e=>{setRegionF(e.target.value);setPage(1);}} style={sel_}>{REGIONS.map(r=>(<option key={r}>{r}</option>))}</select>
        <select value={ngfsF} onChange={e=>{setNgfsF(e.target.value);setPage(1);}} style={sel_}>{NGFS_STATUS.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'central_banks.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length}</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Central Bank'],['region','Region'],['ngfsStatus','NGFS'],['overallScore','Score'],['climateStressTest','Stress Test'],['greenFinancePolicy','Green Policy'],['prudentialClimate','Prudential'],['disclosureRequirement','Disclosure'],['taxonomyAdopted','Taxonomy']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.region}</td>
          <td style={td_}><span style={{padding:'2px 6px',borderRadius:4,fontSize:10,background:r.ngfsStatus==='Member'?'rgba(22,163,74,0.12)':'rgba(217,119,6,0.12)',color:r.ngfsStatus==='Member'?T.green:T.amber}}>{r.ngfsStatus}</span></td>
          <td style={td_}><span style={badge(r.overallScore,[25,50,70])}>{r.overallScore}</span></td>
          <td style={td_}>{r.climateStressTest}</td><td style={td_}>{r.greenFinancePolicy}</td>
          <td style={td_}>{r.prudentialClimate}</td><td style={td_}>{r.disclosureRequirement}</td><td style={td_}>{r.taxonomyAdopted}</td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={qSearch} onChange={e=>{setQSearch(e.target.value);setQPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(qData,'green_qe.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{qData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Bank'],['region','Region'],['greenBondHoldings','Green Bonds $M'],['reserveESGIntegration','ESG Integ.%'],['greenAssetRatio','Green Asset%'],['collateralPolicy','Collateral'],['balanceSheet','Balance $B']].map(([k,l])=>(<th key={k} onClick={()=>doQSort(k)} style={th}>{l}{si(k,qSort,qDir)}</th>))}
        </tr></thead><tbody>{qPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.region}</td><td style={td_}>${r.greenBondHoldings}M</td><td style={td_}>{r.reserveESGIntegration}%</td><td style={td_}>{r.greenAssetRatio}%</td><td style={td_}>{r.collateralPolicy}</td><td style={td_}>${r.balanceSheet}B</td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={qPage<=1} onClick={()=>setQPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {qPage}/{qTP}</span><button disabled={qPage>=qTP} onClick={()=>setQPage(p=>p+1)} style={pb}>Next</button></div>
      <div style={{...card,marginTop:16}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Green Bond Holdings vs ESG Integration</div>
        <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Green Bonds $M" tick={{fontSize:9}}/><YAxis dataKey="y" name="ESG %" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={qData.map(r=>({name:r.name,x:r.greenBondHoldings,y:r.reserveESGIntegration}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={mSearch} onChange={e=>{setMSearch(e.target.value);setMPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(mData,'climate_mandates.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{mData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['bank','Bank'],['region','Region'],['mandateScore','Score'],['legalBasis','Legal Basis'],['lastUpdated','Updated']].map(([k,l])=>(<th key={k} onClick={()=>doMSort(k)} style={th}>{l}{si(k,mSort,mDir)}</th>))}
          {['Price Stability','Financial Stability','Climate Risk','Green Transition','Biodiversity','Social'].map(l=>(<th key={l} style={{...th,cursor:'default'}}>{l}</th>))}
        </tr></thead><tbody>{mPaged.map(r=>(<tr key={r.id}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.bank}</td><td style={td_}>{r.region}</td>
          <td style={td_}><span style={badge(r.mandateScore,[25,50,70])}>{r.mandateScore}</span></td>
          <td style={td_}>{r.legalBasis}</td><td style={td_}>{r.lastUpdated}</td>
          {[r.priceStability,r.financialStability,r.climateRisk,r.greenTransition,r.biodiversity,r.socialObjective].map((v,j)=>(<td key={j} style={td_}><span style={{color:v?T.green:T.textMut,fontWeight:600}}>{v?'Yes':'--'}</span></td>))}
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={mPage<=1} onClick={()=>setMPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {mPage}/{mTP}</span><button disabled={mPage>=mTP} onClick={()=>setMPage(p=>p+1)} style={pb}>Next</button></div>
    </div>)}

    </div>
  </div>);
}
