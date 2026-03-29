import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,ScatterChart,Scatter,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Finance Overview','Fund Tracker','Green Bonds & Instruments','Policy & Mobilization'];
const PAGE_SIZE=12;

const FUNDS=Array.from({length:50},(_,i)=>{
  const names=['Green Climate Fund','Adaptation Fund','GEF Climate','CIF Clean Tech','LDCF','SCCF','Amazon Fund','Norway Climate','UK ICF','Germany IKI','AIIB Green','NDB Climate','AfDB Climate','ADB Climate','EIB Climate','World Bank CPF','IFC Climate','EBRD Green','KfW Climate','JICA Green','Korea GCF','Swiss Climate','Danish DCIF','Swedish Sida','Finnish FLC','Dutch FMO','French AFD','Italian CDP','Spanish AECID','Belgian BIO','Irish Aid','Luxembourg LuxDev','EU Global Gateway','USAID Climate','Canadian DFATD','Australian DFAT','NZ MFAT','Japan JCM Fund','Korea KOICA','Singapore GIA','UAE IRENA','Saudi GI','Qatar NE','Oman GFI','Bahrain SFI','Kuwait FDI','Israel Green','Turkey Climate','India NICEF','Brazil Climate'];
  const types=['Multilateral','Multilateral','Multilateral','Multilateral','Multilateral','Multilateral','National','Bilateral','Bilateral','Bilateral','MDB','MDB','MDB','MDB','MDB','MDB','DFI','MDB','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','DFI','Bilateral','DFI','Bilateral','DFI','Bilateral','Bilateral','Multilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','Bilateral','National','National'];
  const focus=['Mitigation & Adaptation','Adaptation','Multi-focal','Clean Technology','Adaptation (LDCs)','Adaptation (SIDS)','REDD+','Multi-focal','Multi-focal','Multi-focal','Green Infra','Climate Infra','Adaptation','Multi-focal','Green Finance','Multi-focal','Private Sector','Green Transition','Multi-focal','Multi-focal','Multi-focal','Adaptation','Multi-focal','Multi-focal','Multi-focal','Green Finance','Multi-focal','Green Finance','Multi-focal','Green Finance','Adaptation','Multi-focal','Green Deal','Multi-focal','Multi-focal','Multi-focal','Multi-focal','JCM','Multi-focal','Green Finance','Renewables','Green Hydrogen','Clean Energy','Renewables','Renewables','Green Finance','Green Tech','Climate Resilience','Multi-focal','Multi-focal'];
  return{
    id:i+1,name:names[i],type:types[i],focus:focus[i],
    pledged:+(sr(i*7)*20+0.5).toFixed(1),
    deposited:+(sr(i*11)*15+0.3).toFixed(1),
    disbursed:+(sr(i*13)*10+0.1).toFixed(1),
    projects:Math.round(sr(i*17)*200+10),
    countries:Math.round(sr(i*19)*80+5),
    year:2005+Math.floor(sr(i*23)*18),
    grantPct:+(sr(i*29)*60+20).toFixed(0),
    loanPct:+(100-sr(i*29)*60-20).toFixed(0),
    leverageRatio:+(sr(i*31)*5+1.5).toFixed(1),
    gender:sr(i*37)>0.5?'Gender-responsive':'Gender-mainstreamed',
    status:sr(i*41)>0.2?'Active':'Under Review',
  };
});

const ANNUAL=Array.from({length:12},(_,i)=>({
  year:2013+i,
  public:+(sr(i*43)*40+30).toFixed(1),
  private:+(sr(i*47)*60+20).toFixed(1),
  total:+(sr(i*43)*40+30+sr(i*47)*60+20).toFixed(1),
  adaptation:+(sr(i*53)*20+8).toFixed(1),
  mitigation:+(sr(i*59)*50+25).toFixed(1),
  crossCutting:+(sr(i*61)*15+3).toFixed(1),
}));

const BONDS=Array.from({length:40},(_,i)=>{
  const issuers=['World Bank','EIB','KfW','AfDB','ADB','AIIB','IFC','EBRD','NDB','CDB','NIB','IBRD','Apple','Toyota','Enel','Iberdrola','Engie','NextEra','Orsted','Vestas','Republic of Chile','Republic of Fiji','Germany','France','UK','Netherlands','Poland','Belgium','Ireland','Italy','Hong Kong','Singapore','Japan','South Korea','Indonesia','Egypt','Nigeria','Mexico','Colombia','Brazil'];
  return{
    id:i+1,issuer:issuers[i],
    type:['Green Bond','Sustainability Bond','Social Bond','Transition Bond','Blue Bond'][Math.floor(sr(i*67)*5)],
    amount:+(sr(i*71)*8+0.2).toFixed(1),
    currency:['USD','EUR','GBP','JPY','CHF'][Math.floor(sr(i*73)*5)],
    tenor:Math.round(sr(i*79)*20+3),
    coupon:+(sr(i*83)*3+0.5).toFixed(2),
    rating:['AAA','AA+','AA','AA-','A+','A','BBB+'][Math.floor(sr(i*89)*7)],
    framework:['ICMA GBP','CBI','EU GBS','National'][Math.floor(sr(i*97)*4)],
    verified:sr(i*101)>0.3?'Yes':'Pending',
    year:2018+Math.floor(sr(i*103)*7),
  };
});

export default function ClimateFinanceHubPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('pledged');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(0);const[selected,setSelected]=useState(null);const[typeFilter,setTypeFilter]=useState('All');const[bondSearch,setBondSearch]=useState('');const[bondSort,setBondSort]=useState('amount');const[bondDir,setBondDir]=useState('desc');const[bondPage,setBondPage]=useState(0);

  const doSort=(d,c,dir)=>[...d].sort((a,b)=>dir==='asc'?(a[c]>b[c]?1:-1):(a[c]<b[c]?1:-1));
  const tog=(col,cur,setC,dir,setD)=>{if(cur===col)setD(dir==='asc'?'desc':'asc');else{setC(col);setD('desc');}};
  const SH=({label,col,cc,dir,onClick})=>(<th onClick={()=>onClick(col)} style={{padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',background:T.surfaceH}}>{label}{cc===col?(dir==='asc'?' \u25B2':' \u25BC'):''}</th>);
  const kpi=(l,v,s)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:170}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:T.navy,marginTop:4}}>{v}</div>{s&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{s}</div>}</div>);
  const csv=(data,fn)=>{const h=Object.keys(data[0]);const c=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([c],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
  const types=['All','Multilateral','Bilateral','MDB','DFI','National'];

  const filtered=useMemo(()=>{let d=FUNDS.filter(f=>f.name.toLowerCase().includes(search.toLowerCase()));if(typeFilter!=='All')d=d.filter(f=>f.type===typeFilter);return doSort(d,sortCol,sortDir);},[search,typeFilter,sortCol,sortDir]);
  const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const tp=Math.ceil(filtered.length/PAGE_SIZE);
  const fBonds=useMemo(()=>{let d=BONDS.filter(b=>b.issuer.toLowerCase().includes(bondSearch.toLowerCase()));return doSort(d,bondSort,bondDir);},[bondSearch,bondSort,bondDir]);
  const pBonds=fBonds.slice(bondPage*PAGE_SIZE,(bondPage+1)*PAGE_SIZE);const tBP=Math.ceil(fBonds.length/PAGE_SIZE);

  const renderOverview=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Total Pledged','$'+fmt(filtered.reduce((a,f)=>a+f.pledged,0))+'B')}
      {kpi('Total Disbursed','$'+fmt(filtered.reduce((a,f)=>a+f.disbursed,0))+'B')}
      {kpi('Active Funds',filtered.filter(f=>f.status==='Active').length)}
      {kpi('Total Projects',fmt(filtered.reduce((a,f)=>a+f.projects,0)))}
      {kpi('Avg Leverage',fmt(filtered.reduce((a,f)=>a+parseFloat(f.leverageRatio),0)/filtered.length||0)+'x')}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search funds..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
      <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>{types.map(t=><option key={t}>{t}</option>)}</select>
      <button onClick={()=>csv(filtered,'climate_funds.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Pledged vs Disbursed ($B)</div><ResponsiveContainer width="100%" height={300}><BarChart data={filtered.slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-45} textAnchor="end" height={100}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="pledged" fill={T.navy} name="Pledged"/><Bar dataKey="disbursed" fill={T.gold} name="Disbursed"/><Legend/></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fund Type Distribution</div><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={types.filter(t=>t!=='All').map(t=>({name:t,value:filtered.filter(f=>f.type===t).length}))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value})=>`${name}: ${value}`} style={{fontSize:10}}>{types.filter(t=>t!=='All').map((_,i)=><Cell key={i} fill={CC[i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}><thead><tr>
        {[['Fund','name'],['Type','type'],['Pledged $B','pledged'],['Disbursed $B','disbursed'],['Projects','projects'],['Countries','countries'],['Leverage','leverageRatio'],['Status','status']].map(([l,c])=><SH key={c} label={l} col={c} cc={sortCol} dir={sortDir} onClick={c2=>tog(c2,sortCol,setSortCol,sortDir,setSortDir)}/>)}
      </tr></thead><tbody>
        {paged.map((f,i)=>(<React.Fragment key={f.id}>
          <tr onClick={()=>setSelected(selected===f.id?null:f.id)} style={{cursor:'pointer',background:selected===f.id?T.surfaceH:i%2===0?T.surface:'#fafaf8'}}>
            <td style={{padding:'10px 12px',fontWeight:600,color:T.navy,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</td>
            <td style={{padding:'10px 12px',fontSize:12,color:T.textSec}}>{f.type}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>${f.pledged}B</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>${f.disbursed}B</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.projects}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.countries}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.leverageRatio}x</td>
            <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:f.status==='Active'?'#dcfce7':'#fef9c3',color:f.status==='Active'?T.green:T.amber}}>{f.status}</span></td>
          </tr>
          {selected===f.id&&(<tr><td colSpan={8} style={{padding:20,background:T.surfaceH,borderTop:`1px solid ${T.border}`}}><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Focus</span><div style={{fontSize:14,fontWeight:600,color:T.navy}}>{f.focus}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Deposited</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>${f.deposited}B</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Grant %</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{f.grantPct}%</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Gender</span><div style={{fontSize:14,fontWeight:600,color:T.navy}}>{f.gender}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Est. Year</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{f.year}</div></div>
          </div></td></tr>)}
        </React.Fragment>))}
      </tbody></table>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><span style={{fontSize:12,color:T.textMut}}>{filtered.length} funds</span><div style={{display:'flex',gap:6}}><button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>Prev</button><span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{page+1}/{tp||1}</span><button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:page>=tp-1?'default':'pointer',opacity:page>=tp-1?0.4:1}}>Next</button></div></div>
  </div>);

  const renderFundTracker=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Annual Climate Finance Flow ($B)</div><ResponsiveContainer width="100%" height={300}><AreaChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="public" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Public"/><Area type="monotone" dataKey="private" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="Private"/><Legend/></AreaChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Adaptation vs Mitigation ($B)</div><ResponsiveContainer width="100%" height={300}><LineChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="adaptation" stroke={T.sage} strokeWidth={2} name="Adaptation"/><Line type="monotone" dataKey="mitigation" stroke={T.navy} strokeWidth={2} name="Mitigation"/><Line type="monotone" dataKey="crossCutting" stroke={T.gold} strokeWidth={2} name="Cross-cutting"/><Legend/></LineChart></ResponsiveContainer></div>
    </div>
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Total Climate Finance by Year</div><ResponsiveContainer width="100%" height={250}><BarChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="total" fill={T.navy} name="Total $B"/></BarChart></ResponsiveContainer></div>
  </div>);

  const renderBonds=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
      <input value={bondSearch} onChange={e=>{setBondSearch(e.target.value);setBondPage(0);}} placeholder="Search issuers..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
      <button onClick={()=>csv(fBonds,'green_bonds.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Bond Type Distribution</div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={['Green Bond','Sustainability Bond','Social Bond','Transition Bond','Blue Bond'].map(t=>({name:t,value:fBonds.filter(b=>b.type===t).length}))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} style={{fontSize:9}}>{[0,1,2,3,4].map(i=><Cell key={i} fill={CC[i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Issuance by Amount ($B)</div><ResponsiveContainer width="100%" height={280}><BarChart data={fBonds.slice(0,12)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="issuer" tick={{fontSize:8,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="amount" fill={T.sage} name="Amount $B"/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}><thead><tr>
        {[['Issuer','issuer'],['Type','type'],['Amount $B','amount'],['Currency','currency'],['Tenor','tenor'],['Coupon','coupon'],['Rating','rating'],['Framework','framework'],['Verified','verified']].map(([l,c])=><SH key={c} label={l} col={c} cc={bondSort} dir={bondDir} onClick={c2=>tog(c2,bondSort,setBondSort,bondDir,setBondDir)}/>)}
      </tr></thead><tbody>
        {pBonds.map((b,i)=>(<tr key={b.id} style={{background:i%2===0?T.surface:'#fafaf8'}}>
          <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{b.issuer}</td>
          <td style={{padding:'10px 12px',fontSize:12}}>{b.type}</td>
          <td style={{padding:'10px 12px',fontFamily:T.mono}}>${b.amount}B</td>
          <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.currency}</td>
          <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.tenor}y</td>
          <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.coupon}%</td>
          <td style={{padding:'10px 12px',fontFamily:T.mono}}>{b.rating}</td>
          <td style={{padding:'10px 12px',fontSize:12}}>{b.framework}</td>
          <td style={{padding:'10px 12px'}}><span style={{color:b.verified==='Yes'?T.green:T.amber}}>{b.verified}</span></td>
        </tr>))}
      </tbody></table>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><span style={{fontSize:12,color:T.textMut}}>{fBonds.length} bonds</span><div style={{display:'flex',gap:6}}><button disabled={bondPage===0} onClick={()=>setBondPage(bondPage-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:bondPage===0?'default':'pointer',opacity:bondPage===0?0.4:1}}>Prev</button><span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{bondPage+1}/{tBP||1}</span><button disabled={bondPage>=tBP-1} onClick={()=>setBondPage(bondPage+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:bondPage>=tBP-1?'default':'pointer',opacity:bondPage>=tBP-1?0.4:1}}>Next</button></div></div>
  </div>);

  const renderPolicy=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('$100B Goal','$83.3B/yr','2020 target missed')}
      {kpi('NCQG Target','$300B/yr','by 2035')}
      {kpi('Private Mobilized','$'+fmt(ANNUAL[ANNUAL.length-1].private)+'B','Latest year')}
      {kpi('Adaptation Share',(ANNUAL[ANNUAL.length-1].adaptation/(parseFloat(ANNUAL[ANNUAL.length-1].total)||1)*100).toFixed(0)+'%','Target: 50%')}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Public vs Private Mobilization</div><ResponsiveContainer width="100%" height={300}><BarChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="public" stackId="a" fill={T.navy} name="Public"/><Bar dataKey="private" stackId="a" fill={T.gold} name="Private"/><Legend/></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Leverage Ratios by Fund Type</div><ResponsiveContainer width="100%" height={300}><BarChart data={types.filter(t=>t!=='All').map(t=>{const fs=FUNDS.filter(f=>f.type===t);return{type:t,avgLeverage:+(fs.reduce((a,f)=>a+parseFloat(f.leverageRatio),0)/(fs.length||1)).toFixed(1)};})}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="avgLeverage" fill={T.sage} name="Avg Leverage"/></BarChart></ResponsiveContainer></div>
    </div>
  </div>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
    <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase'}}>Climate Finance Architecture</div><h1 style={{fontSize:28,fontWeight:700,color:T.navy,margin:'4px 0 0'}}>Climate Finance Hub</h1></div>
    <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,cursor:'pointer',marginBottom:-2}}>{t}</button>)}</div>
    {tab===0&&renderOverview()}{tab===1&&renderFundTracker()}{tab===2&&renderBonds()}{tab===3&&renderPolicy()}
  </div>);
}