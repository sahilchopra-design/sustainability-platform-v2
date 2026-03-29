import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,ZAxis,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0ea5e9';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Country Tracker','Carbon Pricing','Regulatory Timeline'];
const REGIONS=['All','Europe','Asia Pacific','North America','Latin America','Africa','Middle East'];
const NDC_STATUS=['All','On Track','Partially On Track','Off Track','Insufficient'];
const PAGE_SIZE=12;

const COUNTRIES=(()=>{
  const names=['United States','China','India','European Union','Japan','United Kingdom','Germany','France','Canada','Australia','Brazil','South Korea','Indonesia','Mexico','Russia','Saudi Arabia','South Africa','Turkey','Argentina','Colombia','Nigeria','Egypt','Thailand','Vietnam','Philippines','Bangladesh','Pakistan','Chile','Kenya','Morocco','Norway','Sweden','Denmark','Finland','Netherlands','Switzerland','New Zealand','Singapore','UAE','Israel','Poland','Czech Republic','Hungary','Romania','Greece','Portugal','Ireland','Austria','Belgium','Costa Rica'];
  const regs=['North America','Asia Pacific','Asia Pacific','Europe','Asia Pacific','Europe','Europe','Europe','North America','Asia Pacific','Latin America','Asia Pacific','Asia Pacific','Latin America','Europe','Middle East','Africa','Europe','Latin America','Latin America','Africa','Africa','Asia Pacific','Asia Pacific','Asia Pacific','Asia Pacific','Asia Pacific','Latin America','Africa','Africa','Europe','Europe','Europe','Europe','Europe','Europe','Asia Pacific','Asia Pacific','Middle East','Middle East','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Latin America'];
  return names.map((n,i)=>({id:i+1,country:n,region:regs[i],ndcTarget:Math.round(20+sr(i*7)*50),ndcProgress:Math.round(10+sr(i*11)*80),carbonPrice:Math.round(sr(i*13)*120),etsActive:sr(i*17)>0.45?'Yes':'No',carbonTax:sr(i*19)>0.55?'Yes':'No',netZeroTarget:2030+Math.floor(sr(i*23)*25),renewableTarget:Math.round(20+sr(i*29)*60),coalPhaseOut:sr(i*31)>0.4?'Committed':'No Plan',adaptationSpend:+(0.1+sr(i*37)*2.5).toFixed(1),climateFinance:Math.round(50+sr(i*41)*4950),policyStrength:Math.round(15+sr(i*43)*80),implementationGap:Math.round(5+sr(i*47)*45),ndcStatus:sr(i*7)<0.2?'On Track':sr(i*7)<0.45?'Partially On Track':sr(i*7)<0.75?'Off Track':'Insufficient',ghgEmissions:Math.round(50+sr(i*53)*15000),emissionsPerCapita:+(2+sr(i*59)*18).toFixed(1),fossilSubsidies:+(0.1+sr(i*61)*8).toFixed(1),deforestationRate:+(sr(i*67)*5).toFixed(2),greenBondIssued:Math.round(sr(i*71)*50000)}));})();

const CARBON_PRICING=(()=>{return['EU ETS','UK ETS','California CaT','RGGI','China ETS','Korea ETS','New Zealand ETS','Switzerland ETS','Canada Federal','Japan Carbon Tax','Sweden Carbon Tax','Finland Carbon Tax','Norway Carbon Tax','Denmark Carbon Tax','France Carbon Tax','Ireland Carbon Tax','Germany ETS','Mexico Carbon Tax','Colombia Carbon Tax','Chile Carbon Tax','Singapore Carbon Tax','South Africa Carbon Tax','Ukraine Carbon Tax','Estonia Carbon Tax','Latvia Carbon Tax','Portugal Carbon Tax','Spain Carbon Tax','Netherlands Carbon Tax','Poland Carbon Tax','Argentina Carbon Tax'].map((n,i)=>({id:i+1,scheme:n,type:n.includes('ETS')||n.includes('CaT')?'ETS':'Carbon Tax',price:Math.round(5+sr(i*7)*90),coverage:Math.round(20+sr(i*11)*60),revenue:Math.round(100+sr(i*13)*9900),yearStarted:2005+Math.floor(sr(i*17)*17),jurisdiction:n.split(' ')[0],emissionsCovered:Math.round(50+sr(i*19)*2000),allowanceVolume:Math.round(100+sr(i*23)*5000),auctionShare:Math.round(10+sr(i*29)*80),freeAllocation:Math.round(5+sr(i*31)*50),offsetsAllowed:sr(i*37)>0.5?'Yes':'Limited',priceFloor:Math.round(sr(i*41)*30),priceCeiling:sr(i*43)>0.6?Math.round(50+sr(i*47)*100):'None',leakageProtection:sr(i*53)>0.4?'Yes':'Partial'}));})();

const TIMELINE=Array.from({length:36},(_,i)=>({month:`${2024+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,newPolicies:Math.round(3+sr(i*7)*12),amendments:Math.round(2+sr(i*11)*8),carbonPriceAvg:Math.round(20+sr(i*13)*40+i*0.5),etsVolume:Math.round(500+sr(i*17)*300)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const color=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const statusBadge=(s)=>{const m={'On Track':{bg:'rgba(22,163,74,0.12)',c:T.green},'Partially On Track':{bg:'rgba(197,169,106,0.15)',c:T.gold},'Off Track':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Insufficient':{bg:'rgba(220,38,38,0.12)',c:T.red}};const v=m[s]||m.Insufficient;return{background:v.bg,color:v.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function ClimatePolicyIntelligencePage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[regionF,setRegionF]=useState('All');const[ndcF,setNdcF]=useState('All');const[sortCol,setSortCol]=useState('policyStrength');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[cpSearch,setCpSearch]=useState('');const[cpSort,setCpSort]=useState('price');const[cpDir,setCpDir]=useState('desc');const[cpPage,setCpPage]=useState(1);const[cpSelected,setCpSelected]=useState(null);

  const filtered=useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.country.toLowerCase().includes(search.toLowerCase()));if(regionF!=='All')d=d.filter(r=>r.region===regionF);if(ndcF!=='All')d=d.filter(r=>r.ndcStatus===ndcF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regionF,ndcF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  const cpFiltered=useMemo(()=>{let d=[...CARBON_PRICING];if(cpSearch)d=d.filter(r=>r.scheme.toLowerCase().includes(cpSearch.toLowerCase()));d.sort((a,b)=>cpDir==='asc'?(a[cpSort]>b[cpSort]?1:-1):(a[cpSort]<b[cpSort]?1:-1));return d;},[cpSearch,cpSort,cpDir]);
  const cpPaged=useMemo(()=>cpFiltered.slice((cpPage-1)*PAGE_SIZE,cpPage*PAGE_SIZE),[cpFiltered,cpPage]);
  const cpTotalPages=Math.ceil(cpFiltered.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doCpSort=(col)=>{if(cpSort===col)setCpDir(d=>d==='asc'?'desc':'asc');else{setCpSort(col);setCpDir('desc');}setCpPage(1);};

  const stats=useMemo(()=>{const d=filtered;return{total:d.length,avgPolicy:(d.reduce((s,r)=>s+r.policyStrength,0)/d.length||0).toFixed(1),onTrack:d.filter(r=>r.ndcStatus==='On Track').length,avgCarbon:(d.reduce((s,r)=>s+r.carbonPrice,0)/d.length||0).toFixed(0),etsCount:d.filter(r=>r.etsActive==='Yes').length,avgRenewable:(d.reduce((s,r)=>s+r.renewableTarget,0)/d.length||0).toFixed(0)};},[filtered]);

  const ndcDist=useMemo(()=>{const order=['On Track','Partially On Track','Off Track','Insufficient'];const m={};filtered.forEach(r=>{m[r.ndcStatus]=(m[r.ndcStatus]||0)+1;});return order.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);
  const regionAvg=useMemo(()=>{const m={};filtered.forEach(r=>{if(!m[r.region])m[r.region]={sum:0,cnt:0};m[r.region].sum+=r.policyStrength;m[r.region].cnt++;});return Object.entries(m).map(([k,v])=>({region:k,avg:+(v.sum/v.cnt).toFixed(1)})).sort((a,b)=>b.avg-a.avg);},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btn=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontWeight:a?600:400});
  const pb={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose,type})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{type==='country'?item.country:item.scheme}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}>
      {type==='country'&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {[['NDC Target',item.ndcTarget+'%'],['NDC Progress',item.ndcProgress+'%'],['Carbon Price','$'+item.carbonPrice],['ETS Active',item.etsActive],['Carbon Tax',item.carbonTax],['Net Zero Target',item.netZeroTarget],['Renewable Target',item.renewableTarget+'%'],['Coal Phase-Out',item.coalPhaseOut],['Adaptation Spend',item.adaptationSpend+'%GDP'],['Climate Finance','$'+item.climateFinance+'M'],['Policy Strength',item.policyStrength],['Implementation Gap',item.implementationGap+'%'],['GHG Emissions',item.ghgEmissions+'MtCO2'],['Per Capita',item.emissionsPerCapita+'tCO2'],['Fossil Subsidies','$'+item.fossilSubsidies+'B'],['Green Bonds','$'+item.greenBondIssued+'M']].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
      </div>)}
      {type==='carbon'&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {[['Type',item.type],['Price','$'+item.price+'/tCO2'],['Coverage',item.coverage+'%'],['Revenue','$'+item.revenue+'M'],['Started',item.yearStarted],['Emissions Covered',item.emissionsCovered+'Mt'],['Auction Share',item.auctionShare+'%'],['Free Allocation',item.freeAllocation+'%'],['Offsets',item.offsetsAllowed],['Price Floor','$'+item.priceFloor],['Price Ceiling',item.priceCeiling],['Leakage Protection',item.leakageProtection]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
      </div>)}
    </div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>Climate Policy Intelligence</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>NDC Tracker &middot; Carbon Pricing &middot; {COUNTRIES.length} Countries &middot; {CARBON_PRICING.length} Pricing Mechanisms</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);setCpSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Countries',stats.total,T.navy],['Avg Policy Score',stats.avgPolicy,ACCENT],['On Track NDCs',stats.onTrack,T.green],['Avg Carbon Price','$'+stats.avgCarbon,T.gold],['Active ETS',stats.etsCount,T.sage],['Avg Renewable',stats.avgRenewable+'%',T.amber]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Policy & Carbon Price Trend (36M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TIMELINE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="carbonPriceAvg" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Avg Carbon $/t"/><Area type="monotone" dataKey="newPolicies" stroke={T.green} fill={T.green} fillOpacity={0.1} name="New Policies"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>NDC Status</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={ndcDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>{ndcDist.map((_,i)=>(<Cell key={i} fill={[T.green,T.gold,T.amber,T.red][i%4]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Regional Policy Strength</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={regionAvg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><YAxis dataKey="region" type="category" tick={{fontSize:9,fill:T.textMut}} width={90}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Policy Strength vs Carbon Price</div>
        <ResponsiveContainer width="100%" height={240}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Policy Strength" tick={{fontSize:9}}/><YAxis dataKey="y" name="Carbon Price" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.country,x:r.policyStrength,y:r.carbonPrice}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search countries..." style={inp}/>
        <select value={regionF} onChange={e=>{setRegionF(e.target.value);setPage(1);}} style={sel}>{REGIONS.map(r=>(<option key={r}>{r}</option>))}</select>
        <select value={ndcF} onChange={e=>{setNdcF(e.target.value);setPage(1);}} style={sel}>{NDC_STATUS.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'climate_policy_countries.csv')} style={btn(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length} countries</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['country','Country'],['region','Region'],['policyStrength','Policy Score'],['ndcTarget','NDC Target%'],['ndcProgress','Progress%'],['carbonPrice','Carbon $/t'],['etsActive','ETS'],['netZeroTarget','Net Zero'],['renewableTarget','Renew.%'],['ndcStatus','Status']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td,fontWeight:600,color:T.navy}}>{r.country}</td><td style={td}>{r.region}</td>
          <td style={td}><span style={badge(r.policyStrength,[25,50,70])}>{r.policyStrength}</span></td>
          <td style={td}>{r.ndcTarget}%</td><td style={td}>{r.ndcProgress}%</td><td style={td}>${r.carbonPrice}</td>
          <td style={td}><span style={{color:r.etsActive==='Yes'?T.green:T.textMut}}>{r.etsActive}</span></td>
          <td style={td}>{r.netZeroTarget}</td><td style={td}>{r.renewableTarget}%</td>
          <td style={td}><span style={statusBadge(r.ndcStatus)}>{r.ndcStatus}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page} of {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button>
      </div>
      <Panel item={selected} onClose={()=>setSelected(null)} type="country"/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <input value={cpSearch} onChange={e=>{setCpSearch(e.target.value);setCpPage(1);}} placeholder="Search schemes..." style={inp}/>
        <button onClick={()=>exportCSV(cpFiltered,'carbon_pricing.csv')} style={btn(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{cpFiltered.length} schemes</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['scheme','Scheme'],['type','Type'],['price','Price $/t'],['coverage','Coverage%'],['revenue','Revenue $M'],['yearStarted','Started'],['auctionShare','Auction%'],['offsetsAllowed','Offsets'],['leakageProtection','Leakage Prot.']].map(([k,l])=>(<th key={k} onClick={()=>doCpSort(k)} style={th}>{l}{si(k,cpSort,cpDir)}</th>))}
        </tr></thead><tbody>{cpPaged.map(r=>(<tr key={r.id} onClick={()=>setCpSelected(r)} style={{cursor:'pointer',background:cpSelected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td,fontWeight:600,color:T.navy}}>{r.scheme}</td><td style={td}><span style={{padding:'2px 6px',borderRadius:4,fontSize:10,background:r.type==='ETS'?'rgba(14,165,233,0.12)':'rgba(197,169,106,0.15)',color:r.type==='ETS'?ACCENT:T.gold}}>{r.type}</span></td>
          <td style={td}><span style={{fontFamily:T.mono,fontWeight:700}}>${r.price}</span></td>
          <td style={td}>{r.coverage}%</td><td style={td}>${r.revenue}M</td><td style={td}>{r.yearStarted}</td>
          <td style={td}>{r.auctionShare}%</td><td style={td}>{r.offsetsAllowed}</td><td style={td}>{r.leakageProtection}</td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={cpPage<=1} onClick={()=>setCpPage(p=>p-1)} style={pb}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {cpPage} of {cpTotalPages}</span>
        <button disabled={cpPage>=cpTotalPages} onClick={()=>setCpPage(p=>p+1)} style={pb}>Next</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Carbon Prices by Scheme</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={[...cpFiltered].sort((a,b)=>b.price-a.price).slice(0,12)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="scheme" tick={{fontSize:7,fill:T.textMut}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="price" fill={ACCENT} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>ETS vs Carbon Tax Distribution</div>
          <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={[{name:'ETS',value:cpFiltered.filter(r=>r.type==='ETS').length},{name:'Carbon Tax',value:cpFiltered.filter(r=>r.type==='Carbon Tax').length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={35} label={({name,value})=>`${name}: ${value}`} style={{fontSize:10}}><Cell fill={ACCENT}/><Cell fill={T.gold}/></Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
      </div>
      <Panel item={cpSelected} onClose={()=>setCpSelected(null)} type="carbon"/>
    </div>)}

    {tab===3&&(<div>
      <div style={{...card,marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Regulatory Activity Timeline (36M)</div>
        <ResponsiveContainer width="100%" height={280}><AreaChart data={TIMELINE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="newPolicies" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} name="New Policies"/><Area type="monotone" dataKey="amendments" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Amendments"/></AreaChart></ResponsiveContainer>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Carbon Price Evolution</div>
          <ResponsiveContainer width="100%" height={260}><AreaChart data={TIMELINE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="carbonPriceAvg" stroke={T.green} fill={T.green} fillOpacity={0.15} name="Avg $/tCO2"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>ETS Volume Trend</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={TIMELINE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="etsVolume" fill={ACCENT} name="Volume (Mt)" opacity={0.7}/></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div style={{marginTop:16}}>
        <button onClick={()=>exportCSV(TIMELINE,'regulatory_timeline.csv')} style={btn(false)}>Export Timeline CSV</button>
      </div>
    </div>)}

    </div>
  </div>);
}
