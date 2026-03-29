import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,ScatterChart,Scatter,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4','#f97316'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['ITMO Dashboard','Bilateral Agreements','Market Analytics','Methodology & Governance'];
const PAGE_SIZE=12;

const ITMOS=Array.from({length:60},(_,i)=>{
  const buyers=['Switzerland','Japan','South Korea','Singapore','Sweden','Norway','Germany','UK','Canada','Netherlands','Denmark','Finland','Austria','Belgium','France','Spain','Italy','Australia','New Zealand','Ireland'];
  const hosts=['Ghana','Peru','Thailand','Senegal','Rwanda','Morocco','Georgia','Dominican Republic','Malawi','Vanuatu','Bangladesh','Vietnam','Indonesia','Kenya','Colombia','Chile','Costa Rica','Nepal','Uganda','Ethiopia','Cambodia','Mongolia','Laos','Sri Lanka','Fiji','Papua New Guinea','Tanzania','Mozambique','Zambia','Madagascar'];
  const sectors=['Renewable Energy','Energy Efficiency','Forestry & REDD+','Transport','Waste Management','Methane Reduction','Agriculture','Blue Carbon','Industrial Decarb','Clean Cooking'];
  const statuses=['Active','Pipeline','Completed','Negotiating','Suspended'];
  return{
    id:i+1,buyer:buyers[i%20],host:hosts[i%30],
    sector:sectors[Math.floor(sr(i*7)*10)],
    status:statuses[Math.floor(sr(i*11)*5)],
    itmos:Math.round(sr(i*13)*5000+100),
    pricePerTon:+(sr(i*17)*25+5).toFixed(2),
    totalValue:+(sr(i*19)*80+2).toFixed(1),
    vintage:2021+Math.floor(sr(i*23)*5),
    methodology:['CDM','Gold Standard','Verra VCS','ART TREES','CORSIA'][Math.floor(sr(i*29)*5)],
    correspondingAdj:sr(i*31)>0.3?'Yes':'Pending',
    authorizationDate:2022+Math.floor(sr(i*37)*4),
    shareOfProceeds:+(sr(i*41)*5+2).toFixed(1),
    adaptationFund:+(sr(i*43)*2+0.5).toFixed(1),
    integrityScore:+(sr(i*47)*30+65).toFixed(0),
    additionality:sr(i*53)>0.4?'Demonstrated':'Under Review',
    ndcAlignment:sr(i*59)>0.5?'Aligned':'Partial',
  };
});

const BILATERAL=Array.from({length:40},(_,i)=>{
  const pairs=[['Switzerland','Ghana'],['Japan','Thailand'],['South Korea','Peru'],['Singapore','Vietnam'],['Sweden','Senegal'],['Norway','Rwanda'],['Germany','Morocco'],['UK','Indonesia'],['Canada','Colombia'],['Netherlands','Kenya'],['Denmark','Ethiopia'],['Finland','Nepal'],['Switzerland','Peru'],['Japan','Indonesia'],['South Korea','Vietnam'],['Singapore','Ghana'],['Sweden','Rwanda'],['Norway','Senegal'],['Germany','Kenya'],['UK','Colombia'],['Japan','Bangladesh'],['Switzerland','Vanuatu'],['Norway','Ethiopia'],['Germany','Ghana'],['UK','Vietnam'],['Canada','Kenya'],['Sweden','Thailand'],['Denmark','Peru'],['Finland','Indonesia'],['Netherlands','Senegal'],['Singapore','Cambodia'],['South Korea','Thailand'],['Japan','Mongolia'],['Switzerland','Dominican Rep.'],['Norway','Malawi'],['Sweden','Georgia'],['Germany','Thailand'],['UK','Rwanda'],['Canada','Senegal'],['Denmark','Ghana']];
  return{
    id:i+1,buyer:pairs[i][0],host:pairs[i][1],
    signedYear:2020+Math.floor(sr(i*61)*5),
    scope:['Energy','Forestry','Multi-sector','Transport','Waste'][Math.floor(sr(i*67)*5)],
    targetMtCO2:+(sr(i*71)*50+5).toFixed(1),
    deliveredMtCO2:+(sr(i*73)*30+1).toFixed(1),
    priceRange:`$${(5+sr(i*79)*15).toFixed(0)}-${(20+sr(i*83)*20).toFixed(0)}`,
    governanceBody:['Art 6.2 Authority','Joint Committee','Bilateral Commission'][Math.floor(sr(i*89)*3)],
    mrvSystem:sr(i*97)>0.5?'Digital MRV':'Traditional',
    registryLinked:sr(i*101)>0.4?'Yes':'No',
    adaptationShare:+(sr(i*103)*5+2).toFixed(1)+'%',
    status:['Operational','Framework Signed','Negotiating','Pilot Phase'][Math.floor(sr(i*107)*4)],
  };
});

const MARKET_DATA=Array.from({length:24},(_,i)=>({
  quarter:`${2021+Math.floor(i/4)} Q${i%4+1}`,
  volume:Math.round(sr(i*109)*8000+500),
  avgPrice:+(sr(i*113)*18+5).toFixed(2),
  totalValue:+(sr(i*117)*120+10).toFixed(1),
  numTransactions:Math.round(sr(i*119)*40+5),
  art62:Math.round(sr(i*121)*5000+200),
  art64:Math.round(sr(i*123)*3000+100),
}));

const METHODOLOGIES=[
  {name:'CDM Transition',projects:342,itmos:28400,integrity:78,coverage:'Energy, Waste, Transport',authority:'UNFCCC SB',lastUpdate:2024},
  {name:'Gold Standard Art6',projects:156,itmos:12800,integrity:92,coverage:'Renewable Energy, Clean Cooking',authority:'GS Foundation',lastUpdate:2025},
  {name:'Verra VCS Art6',projects:234,itmos:19600,integrity:85,coverage:'Forestry, Energy, Agriculture',authority:'Verra',lastUpdate:2025},
  {name:'ART TREES',projects:28,itmos:8400,integrity:88,coverage:'Jurisdictional REDD+',authority:'ART Secretariat',lastUpdate:2024},
  {name:'CORSIA Eligible',projects:89,itmos:7200,integrity:82,coverage:'Aviation Offsets',authority:'ICAO',lastUpdate:2024},
  {name:'Swiss KliK',projects:45,itmos:3600,integrity:90,coverage:'Multi-sector',authority:'Swiss FOEN',lastUpdate:2025},
  {name:'JCM (Japan)',projects:218,itmos:15200,integrity:86,coverage:'Energy, Transport, Waste',authority:'Japan MoE',lastUpdate:2025},
  {name:'Korean ETS Link',projects:34,itmos:2800,integrity:80,coverage:'Industrial, Energy',authority:'Korean MoE',lastUpdate:2024},
];

export default function Article6MarketsPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sortCol,setSortCol]=useState('itmos');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);
  const[selected,setSelected]=useState(null);
  const[statusFilter,setStatusFilter]=useState('All');
  const[sectorFilter,setSectorFilter]=useState('All');
  const[minPrice,setMinPrice]=useState(0);
  const[bilSearch,setBilSearch]=useState('');
  const[bilSort,setBilSort]=useState('targetMtCO2');
  const[bilDir,setBilDir]=useState('desc');
  const[bilPage,setBilPage]=useState(0);

  const doSort=(d,c,dir)=>[...d].sort((a,b)=>dir==='asc'?(a[c]>b[c]?1:-1):(a[c]<b[c]?1:-1));
  const toggleSort=(col,cur,setC,dir,setD)=>{if(cur===col)setD(dir==='asc'?'desc':'asc');else{setC(col);setD('desc');}};
  const SortHeader=({label,col,currentCol,dir,onClick})=>(
    <th onClick={()=>onClick(col)} style={{padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',background:T.surfaceH}}>{label}{currentCol===col?(dir==='asc'?' \u25B2':' \u25BC'):''}</th>
  );
  const kpi=(label,value,sub)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:170}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:T.navy,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);
  const csvExport=(data,fn)=>{const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const statuses=['All','Active','Pipeline','Completed','Negotiating','Suspended'];
  const sectors=['All',...[...new Set(ITMOS.map(i=>i.sector))]];

  const filteredITMOs=useMemo(()=>{
    let d=ITMOS.filter(x=>x.buyer.toLowerCase().includes(search.toLowerCase())||x.host.toLowerCase().includes(search.toLowerCase()));
    if(statusFilter!=='All')d=d.filter(x=>x.status===statusFilter);
    if(sectorFilter!=='All')d=d.filter(x=>x.sector===sectorFilter);
    d=d.filter(x=>x.pricePerTon>=minPrice);
    return doSort(d,sortCol,sortDir);
  },[search,statusFilter,sectorFilter,minPrice,sortCol,sortDir]);
  const pagedITMOs=filteredITMOs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const totalPages=Math.ceil(filteredITMOs.length/PAGE_SIZE);

  const filteredBil=useMemo(()=>{
    let d=BILATERAL.filter(x=>x.buyer.toLowerCase().includes(bilSearch.toLowerCase())||x.host.toLowerCase().includes(bilSearch.toLowerCase()));
    return doSort(d,bilSort,bilDir);
  },[bilSearch,bilSort,bilDir]);
  const pagedBil=filteredBil.slice(bilPage*PAGE_SIZE,(bilPage+1)*PAGE_SIZE);
  const totalBilPages=Math.ceil(filteredBil.length/PAGE_SIZE);

  const sectorBreakdown=useMemo(()=>{
    const m={};filteredITMOs.forEach(x=>{m[x.sector]=(m[x.sector]||0)+x.itmos;});
    return Object.entries(m).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value);
  },[filteredITMOs]);

  const renderDashboard=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpi('Total ITMOs',fmt(filteredITMOs.reduce((a,x)=>a+x.itmos,0)),'Internationally Transferred')}
        {kpi('Active Deals',filteredITMOs.filter(x=>x.status==='Active').length)}
        {kpi('Avg Price','$'+fmt(filteredITMOs.reduce((a,x)=>a+x.pricePerTon,0)/filteredITMOs.length||0)+'/tCO2')}
        {kpi('Total Value','$'+fmt(filteredITMOs.reduce((a,x)=>a+x.totalValue,0))+'M')}
        {kpi('CA Applied',filteredITMOs.filter(x=>x.correspondingAdj==='Yes').length+'/'+filteredITMOs.length)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search buyer/host..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
        <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
        <select value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>{sectors.map(s=><option key={s}>{s}</option>)}</select>
        <div style={{fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:8}}>Min $/t: ${minPrice}<input type="range" min={0} max={30} value={minPrice} onChange={e=>setMinPrice(+e.target.value)} style={{width:100}}/></div>
        <button onClick={()=>csvExport(filteredITMOs,'itmo_transactions.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>ITMOs by Sector</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={sectorBreakdown} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} style={{fontSize:10}}>{sectorBreakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Price vs Volume Scatter</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="itmos" name="ITMOs" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="pricePerTon" name="$/tCO2" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filteredITMOs} fill={T.navy} fillOpacity={0.6}/></ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead><tr>
            {[['Buyer','buyer'],['Host','host'],['Sector','sector'],['ITMOs','itmos'],['$/tCO2','pricePerTon'],['Value $M','totalValue'],['Status','status'],['CA','correspondingAdj'],['Integrity','integrityScore']].map(([l,c])=><SortHeader key={c} label={l} col={c} currentCol={sortCol} dir={sortDir} onClick={c2=>toggleSort(c2,sortCol,setSortCol,sortDir,setSortDir)}/>)}
          </tr></thead>
          <tbody>
            {pagedITMOs.map((x,i)=>(
              <React.Fragment key={x.id}>
                <tr onClick={()=>setSelected(selected===x.id?null:x.id)} style={{cursor:'pointer',background:selected===x.id?T.surfaceH:i%2===0?T.surface:'#fafaf8'}}>
                  <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{x.buyer}</td>
                  <td style={{padding:'10px 12px',color:T.textSec}}>{x.host}</td>
                  <td style={{padding:'10px 12px',fontSize:12}}>{x.sector}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{fmt(x.itmos)}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>${x.pricePerTon}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>${x.totalValue}M</td>
                  <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:x.status==='Active'?'#dcfce7':x.status==='Completed'?'#dbeafe':x.status==='Suspended'?'#fef2f2':'#fef9c3',color:x.status==='Active'?T.green:x.status==='Completed'?T.navy:x.status==='Suspended'?T.red:T.amber}}>{x.status}</span></td>
                  <td style={{padding:'10px 12px'}}><span style={{color:x.correspondingAdj==='Yes'?T.green:T.amber}}>{x.correspondingAdj}</span></td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{x.integrityScore}</td>
                </tr>
                {selected===x.id&&(
                  <tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderTop:`1px solid ${T.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Vintage</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{x.vintage}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Methodology</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{x.methodology}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Auth Date</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{x.authorizationDate}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>SoP %</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{x.shareOfProceeds}%</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Adapt Fund $M</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>${x.adaptationFund}M</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Additionality</span><div style={{fontSize:16,fontWeight:700,color:x.additionality==='Demonstrated'?T.green:T.amber}}>{x.additionality}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>NDC Alignment</span><div style={{fontSize:16,fontWeight:700,color:x.ndcAlignment==='Aligned'?T.green:T.amber}}>{x.ndcAlignment}</div></div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
        <span style={{fontSize:12,color:T.textMut}}>{filteredITMOs.length} transactions</span>
        <div style={{display:'flex',gap:6}}>
          <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontFamily:T.mono,fontSize:12}}>Prev</button>
          <span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{page+1}/{totalPages||1}</span>
          <button disabled={page>=totalPages-1} onClick={()=>setPage(page+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontFamily:T.mono,fontSize:12}}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderBilateral=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={bilSearch} onChange={e=>{setBilSearch(e.target.value);setBilPage(0);}} placeholder="Search agreements..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
        <button onClick={()=>csvExport(filteredBil,'bilateral_agreements.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Target vs Delivered MtCO2</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredBil.slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="host" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="targetMtCO2" fill={T.navy} name="Target"/><Bar dataKey="deliveredMtCO2" fill={T.gold} name="Delivered"/><Legend/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Agreement Status Distribution</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={['Operational','Framework Signed','Negotiating','Pilot Phase'].map(s=>({name:s,value:filteredBil.filter(b=>b.status===s).length}))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value})=>`${name}: ${value}`} style={{fontSize:10}}>{['Operational','Framework Signed','Negotiating','Pilot Phase'].map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead><tr>
            {[['Buyer','buyer'],['Host','host'],['Signed','signedYear'],['Scope','scope'],['Target Mt','targetMtCO2'],['Delivered Mt','deliveredMtCO2'],['Price Range','priceRange'],['MRV','mrvSystem'],['Status','status']].map(([l,c])=><SortHeader key={c} label={l} col={c} currentCol={bilSort} dir={bilDir} onClick={c2=>toggleSort(c2,bilSort,setBilSort,bilDir,setBilDir)}/>)}
          </tr></thead>
          <tbody>
            {pagedBil.map((b,i)=>(
              <tr key={b.id} style={{background:i%2===0?T.surface:'#fafaf8'}}>
                <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{b.buyer}</td>
                <td style={{padding:'10px 12px',color:T.textSec}}>{b.host}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.signedYear}</td>
                <td style={{padding:'10px 12px',fontSize:12}}>{b.scope}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.targetMtCO2}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.deliveredMtCO2}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono,fontSize:11}}>{b.priceRange}</td>
                <td style={{padding:'10px 12px',fontSize:12}}>{b.mrvSystem}</td>
                <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:b.status==='Operational'?'#dcfce7':'#fef9c3',color:b.status==='Operational'?T.green:T.amber}}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
        <span style={{fontSize:12,color:T.textMut}}>{filteredBil.length} agreements</span>
        <div style={{display:'flex',gap:6}}>
          <button disabled={bilPage===0} onClick={()=>setBilPage(bilPage-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:bilPage===0?'default':'pointer',opacity:bilPage===0?0.4:1}}>Prev</button>
          <span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{bilPage+1}/{totalBilPages||1}</span>
          <button disabled={bilPage>=totalBilPages-1} onClick={()=>setBilPage(bilPage+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:bilPage>=totalBilPages-1?'default':'pointer',opacity:bilPage>=totalBilPages-1?0.4:1}}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderMarketAnalytics=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpi('Total Volume',fmt(MARKET_DATA.reduce((a,m)=>a+m.volume,0))+' ITMOs')}
        {kpi('Avg Price','$'+fmt(MARKET_DATA.reduce((a,m)=>a+m.avgPrice,0)/MARKET_DATA.length)+'/t')}
        {kpi('Total Value','$'+fmt(MARKET_DATA.reduce((a,m)=>a+m.totalValue,0))+'M')}
        {kpi('Transactions',fmt(MARKET_DATA.reduce((a,m)=>a+m.numTransactions,0)))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Market Volume & Price Trend</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MARKET_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line yAxisId="l" type="monotone" dataKey="volume" stroke={T.navy} strokeWidth={2}/><Line yAxisId="r" type="monotone" dataKey="avgPrice" stroke={T.gold} strokeWidth={2}/><Legend/></LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Art 6.2 vs Art 6.4 Volume</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={MARKET_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="art62" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Art 6.2"/><Area type="monotone" dataKey="art64" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="Art 6.4"/><Legend/></AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Transaction Value Over Time</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={MARKET_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="totalValue" fill={T.sage} name="Value $M"/></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderMethodology=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Methodology Integrity Scores</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={METHODOLOGIES}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/><Radar dataKey="integrity" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Projects & ITMOs by Methodology</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={METHODOLOGIES}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-30} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="projects" fill={T.navy} name="Projects"/><Bar dataKey="itmos" fill={T.gold} name="ITMOs"/><Legend/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead><tr>
            {['Methodology','Projects','ITMOs','Integrity','Coverage','Authority','Updated'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {METHODOLOGIES.map((m,i)=>(
              <tr key={m.name} style={{background:i%2===0?T.surface:'#fafaf8'}}>
                <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{m.name}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{m.projects}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{fmt(m.itmos)}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono,color:m.integrity>=85?T.green:m.integrity>=75?T.amber:T.red}}>{m.integrity}/100</td>
                <td style={{padding:'10px 12px',fontSize:12}}>{m.coverage}</td>
                <td style={{padding:'10px 12px',fontSize:12}}>{m.authority}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{m.lastUpdate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase'}}>Paris Agreement Carbon Markets</div>
        <h1 style={{fontSize:28,fontWeight:700,color:T.navy,margin:'4px 0 0'}}>Article 6 Markets Intelligence</h1>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
      </div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderBilateral()}
      {tab===2&&renderMarketAnalytics()}
      {tab===3&&renderMethodology()}
    </div>
  );
}