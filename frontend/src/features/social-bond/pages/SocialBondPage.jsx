import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const TABS=['Market Overview','Bond Screener','Impact Analytics','Framework Assessment'];
const PAGE=12;

const CATEGORIES=['Affordable Housing','Healthcare','Education','Employment','Food Security','Socioeconomic Advancement','Financial Inclusion','Water & Sanitation'];
const ISSUERS=['World Bank','IFC','AfDB','ADB','EIB','CAF','IBRD','Societe Generale','BNP Paribas','HSBC','Morgan Stanley','Goldman Sachs','Citi','Barclays','Credit Agricole','NatWest','Lloyds','Santander','ING','Rabobank','KfW','NIB','NDB','Chile','France','South Korea','Japan','Mexico','Colombia','Peru','Philippines','Indonesia','Spain','Italy','Belgium','Netherlands','Ireland','Portugal','Austria','Sweden'];
const REGIONS=['Europe','North America','Asia-Pacific','Latin America','Africa','Middle East','Global'];

const BONDS=Array.from({length:60},(_,i)=>{
  const cat=CATEGORIES[Math.floor(sr(i*3)*CATEGORIES.length)];
  const issuer=ISSUERS[Math.floor(sr(i*7)*ISSUERS.length)];
  const reg=REGIONS[Math.floor(sr(i*11)*REGIONS.length)];
  return{id:i+1,name:`Social Bond ${issuer} ${(2020+Math.floor(sr(i*13)*6))}`,issuer,category:cat,region:reg,
    amount:+(sr(i*17)*3000+100).toFixed(0),currency:['USD','EUR','GBP','JPY','CHF'][Math.floor(sr(i*19)*5)],
    coupon:+(sr(i*23)*4+0.5).toFixed(2),tenor:Math.floor(sr(i*29)*20+3),maturity:2025+Math.floor(sr(i*31)*15),
    spread:+(sr(i*37)*150+20).toFixed(0),rating:['AAA','AA+','AA','AA-','A+','A','BBB+','BBB'][Math.floor(sr(i*41)*8)],
    beneficiaries:Math.floor(sr(i*43)*500000+10000),jobsCreated:Math.floor(sr(i*47)*5000+100),
    housingUnits:Math.floor(sr(i*53)*2000+50),healthcarePts:Math.floor(sr(i*59)*100000+5000),
    icmaAligned:sr(i*61)>0.15,externalReview:sr(i*67)>0.2,impactReport:sr(i*71)>0.25,
    sdgs:[1,2,3,4,5,6,8,10,11].filter((_,j)=>sr(i*73+j)>0.5),
    greenium:+(sr(i*79)*10-2).toFixed(1),demandRatio:+(sr(i*83)*4+1.5).toFixed(1),
    useOfProceeds:+(sr(i*89)*100).toFixed(0),reportingFreq:['Annual','Semi-annual','Quarterly'][Math.floor(sr(i*97)*3)],
    framework:['ICMA SBP','Own Framework','National Framework'][Math.floor(sr(i*101)*3)],
    verifier:['Sustainalytics','ISS ESG','Vigeo Eiris','CICERO','DNV','S&P SPO'][Math.floor(sr(i*103)*6)],
  };
});

const ANNUAL=Array.from({length:10},(_,i)=>({
  year:2016+i,issuance:+(sr(i*107)*200+50).toFixed(0),outstanding:+(sr(i*109)*800+100).toFixed(0),
  count:Math.floor(sr(i*113)*80+10),avgSize:+(sr(i*117)*500+100).toFixed(0),
  sovereign:+(sr(i*121)*100+20).toFixed(0),corporate:+(sr(i*127)*80+15).toFixed(0),
  supra:+(sr(i*131)*60+10).toFixed(0),avgCoupon:+(sr(i*137)*2+1).toFixed(2),
}));

const IMPACT_CATS=CATEGORIES.map((c,i)=>({
  name:c,totalFunding:+(sr(i*139)*5000+500).toFixed(0),projects:Math.floor(sr(i*143)*200+20),
  beneficiaries:Math.floor(sr(i*149)*2000000+50000),avgImpact:+(sr(i*151)*40+50).toFixed(1),
  dataQuality:['High','Medium','Low'][Math.floor(sr(i*157)*3)],
}));

export default function SocialBondPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('amount');
  const [sortDir,setSortDir]=useState('desc');
  const [page,setPage]=useState(0);
  const [expanded,setExpanded]=useState(null);
  const [filterCat,setFilterCat]=useState('All');
  const [filterReg,setFilterReg]=useState('All');
  const [impSearch,setImpSearch]=useState('');
  const [impSort,setImpSort]=useState('totalFunding');
  const [impDir,setImpDir]=useState('desc');
  const [impExpanded,setImpExpanded]=useState(null);

  const filtered=useMemo(()=>{
    let d=[...BONDS];
    if(search)d=d.filter(b=>b.name.toLowerCase().includes(search.toLowerCase())||b.issuer.toLowerCase().includes(search.toLowerCase()));
    if(filterCat!=='All')d=d.filter(b=>b.category===filterCat);
    if(filterReg!=='All')d=d.filter(b=>b.region===filterReg);
    d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));
    return d;
  },[search,sortCol,sortDir,filterCat,filterReg]);

  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);
  const totalPages=Math.ceil(filtered.length/PAGE);

  const impFiltered=useMemo(()=>{
    let d=[...IMPACT_CATS];
    if(impSearch)d=d.filter(c=>c.name.toLowerCase().includes(impSearch.toLowerCase()));
    d.sort((a,b)=>impDir==='asc'?((a[impSort]>b[impSort])?1:-1):((a[impSort]<b[impSort])?1:-1));
    return d;
  },[impSearch,impSort,impDir]);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const doImpSort=(col)=>{if(impSort===col)setImpDir(d=>d==='asc'?'desc':'asc');else{setImpSort(col);setImpDir('desc');}};

  const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const kpis=useMemo(()=>{
    const total=filtered.reduce((s,b)=>s+b.amount,0);
    const avgCoup=filtered.length?filtered.reduce((s,b)=>s+parseFloat(b.coupon),0)/filtered.length:0;
    const avgTenor=filtered.length?filtered.reduce((s,b)=>s+b.tenor,0)/filtered.length:0;
    const icma=filtered.filter(b=>b.icmaAligned).length;
    return{count:filtered.length,total,avgCoup,avgTenor,icma};
  },[filtered]);

  const catDist=useMemo(()=>{const m={};CATEGORIES.forEach(c=>m[c]=0);filtered.forEach(b=>m[b.category]++);return Object.entries(m).map(([name,value])=>({name:name.length>16?name.slice(0,16)+'..':name,value,full:name}));},[filtered]);
  const regDist=useMemo(()=>{const m={};REGIONS.forEach(r=>m[r]=0);filtered.forEach(b=>m[b.region]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);
  const ratingDist=useMemo(()=>{const m={};filtered.forEach(b=>{m[b.rating]=(m[b.rating]||0)+1;});return Object.entries(m).sort().map(([name,value])=>({name,value}));},[filtered]);

  const SortH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,letterSpacing:0.5,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const ImpSH=({col,label})=><th onClick={()=>doImpSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,userSelect:'none'}}>{label}{impSort===col?(impDir==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const Pg=({pg,setPg,tot})=>(
    <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}>
      <button onClick={()=>setPg(p=>Math.max(0,p-1))} disabled={pg===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg===0?'default':'pointer',opacity:pg===0?0.4:1,fontSize:12}}>Prev</button>
      {Array.from({length:Math.min(tot,7)},(_,i)=>{const p=tot<=7?i:pg<3?i:pg>tot-4?tot-7+i:pg-3+i;return <button key={p} onClick={()=>setPg(p)} style={{padding:'6px 12px',border:`1px solid ${pg===p?T.gold:T.border}`,borderRadius:6,background:pg===p?T.gold:'transparent',color:pg===p?'#fff':T.text,cursor:'pointer',fontWeight:pg===p?700:400,fontSize:12}}>{p+1}</button>;})}
      <button onClick={()=>setPg(p=>Math.min(tot-1,p+1))} disabled={pg>=tot-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg>=tot-1?'default':'pointer',opacity:pg>=tot-1?0.4:1,fontSize:12}}>Next</button>
    </div>
  );

  const renderOverview=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Total Bonds',v:kpis.count},{l:'Total Volume',v:'$'+fmt(kpis.total)+'M'},{l:'Avg Coupon',v:kpis.avgCoup.toFixed(2)+'%'},{l:'Avg Tenor',v:kpis.avgTenor.toFixed(1)+'yr'},{l:'ICMA Aligned',v:kpis.icma}].map((k,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div>
            <div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Annual Issuance by Issuer Type</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Area type="monotone" dataKey="sovereign" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Sovereign ($B)"/>
              <Area type="monotone" dataKey="corporate" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="Corporate ($B)"/>
              <Area type="monotone" dataKey="supra" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.3} name="Supranational ($B)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Social Category Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={catDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{catDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Region Breakdown</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regDist} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.sage} radius={[0,6,6,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Credit Rating Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ratingDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.navy} radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Market Size & Deal Count Trend</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Line yAxisId="l" type="monotone" dataKey="outstanding" stroke={T.navy} strokeWidth={2} name="Outstanding ($B)"/>
            <Line yAxisId="r" type="monotone" dataKey="count" stroke={T.gold} strokeWidth={2} name="Deal Count"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderScreener=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search bonds or issuers..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}/>
        <select value={filterCat} onChange={e=>{setFilterCat(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Categories</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <select value={filterReg} onChange={e=>{setFilterReg(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}</select>
        <button onClick={()=>exportCSV(filtered,'social_bonds.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>Showing {filtered.length} bonds | Page {page+1}/{totalPages}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH}}>
            <SortH col="name" label="Bond" w="180px"/><SortH col="issuer" label="Issuer"/><SortH col="category" label="Category"/>
            <SortH col="amount" label="Amount ($M)"/><SortH col="coupon" label="Coupon %"/><SortH col="tenor" label="Tenor"/>
            <SortH col="rating" label="Rating"/><SortH col="spread" label="Spread (bp)"/>
            <SortH col="beneficiaries" label="Beneficiaries"/><SortH col="greenium" label="Greenium"/>
          </tr></thead>
          <tbody>
            {paged.map(b=>(
              <React.Fragment key={b.id}>
                <tr onClick={()=>setExpanded(expanded===b.id?null:b.id)} style={{cursor:'pointer',background:expanded===b.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===b.id?'\u25BC':'\u25B6'} {b.name.slice(0,25)}</td>
                  <td style={{padding:'10px 8px',color:T.textSec}}>{b.issuer}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{b.category}</span></td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{fmt(b.amount)}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.coupon}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.tenor}yr</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:b.rating.startsWith('AA')?'#d1fae5':'#fef3c7',color:b.rating.startsWith('AA')?'#065f46':'#92400e'}}>{b.rating}</span></td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.spread}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{fmt(b.beneficiaries)}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(b.greenium)<0?T.green:T.red}}>{b.greenium}bp</td>
                </tr>
                {expanded===b.id&&(
                  <tr><td colSpan={10} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Bond Details</div>
                        {[['Currency',b.currency],['Maturity',b.maturity],['Region',b.region],['Framework',b.framework],['Verifier',b.verifier],['Reporting',b.reportingFreq],['Demand Ratio',b.demandRatio+'x']].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Social Impact</div>
                        {[['Jobs Created',fmt(b.jobsCreated)],['Housing Units',fmt(b.housingUnits)],['Healthcare Pts',fmt(b.healthcarePts)],['ICMA Aligned',b.icmaAligned?'Yes':'No'],['External Review',b.externalReview?'Yes':'No'],['Impact Report',b.impactReport?'Yes':'No'],['SDGs',b.sdgs.join(', ')]].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Use of Proceeds</div>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart><Pie data={[{name:'Deployed',value:parseFloat(b.useOfProceeds)},{name:'Unallocated',value:100-parseFloat(b.useOfProceeds)}]} dataKey="value" cx="50%" cy="50%" outerRadius={70} label><Cell fill={T.green}/><Cell fill={T.border}/></Pie><Tooltip {...tip}/></PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Pg pg={page} setPg={setPage} tot={totalPages}/>
    </div>
  );

  const renderImpact=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={impSearch} onChange={e=>setImpSearch(e.target.value)} placeholder="Search impact categories..." style={{flex:1,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <button onClick={()=>exportCSV(IMPACT_CATS,'social_impact.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto',marginBottom:20}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <ImpSH col="name" label="Category"/><ImpSH col="totalFunding" label="Total Funding ($M)"/>
            <ImpSH col="projects" label="Projects"/><ImpSH col="beneficiaries" label="Beneficiaries"/>
            <ImpSH col="avgImpact" label="Impact Score"/><ImpSH col="dataQuality" label="Data Quality"/>
          </tr></thead>
          <tbody>
            {impFiltered.map(c=>(
              <React.Fragment key={c.name}>
                <tr onClick={()=>setImpExpanded(impExpanded===c.name?null:c.name)} style={{cursor:'pointer',background:impExpanded===c.name?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{impExpanded===c.name?'\u25BC':'\u25B6'} {c.name}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>${fmt(parseFloat(c.totalFunding))}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.projects}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{fmt(c.beneficiaries)}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.avgImpact}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:c.dataQuality==='High'?'#d1fae5':c.dataQuality==='Medium'?'#fef3c7':'#fee2e2',color:c.dataQuality==='High'?'#065f46':c.dataQuality==='Medium'?'#92400e':'#991b1b'}}>{c.dataQuality}</span></td>
                </tr>
                {impExpanded===c.name&&(
                  <tr><td colSpan={6} style={{padding:16,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                        <p><strong>{c.name}</strong> encompasses social bond projects under ICMA Social Bond Principles.</p>
                        <p>Total ${fmt(parseFloat(c.totalFunding))}M across {c.projects} projects reaching {fmt(c.beneficiaries)} beneficiaries.</p>
                        <p>Impact score of {c.avgImpact}/100 with {c.dataQuality.toLowerCase()} data quality.</p>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <RadarChart data={[{m:'Funding',v:parseFloat(c.totalFunding)/50},{m:'Projects',v:c.projects/2},{m:'Beneficiaries',v:c.beneficiaries/20000},{m:'Impact',v:parseFloat(c.avgImpact)},{m:'Quality',v:c.dataQuality==='High'?90:c.dataQuality==='Medium'?60:30}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Funding by Category</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={IMPACT_CATS} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={120} tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="totalFunding" fill={T.navy} radius={[0,6,6,0]} name="Funding ($M)"/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Impact Score vs Beneficiaries</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Impact" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Beneficiaries" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[60,400]}/><Tooltip {...tip}/><Scatter data={IMPACT_CATS.map(c=>({name:c.name,x:parseFloat(c.avgImpact),y:c.beneficiaries,z:parseFloat(c.totalFunding)}))} fill={T.gold} fillOpacity={0.7}/></ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderFramework=()=>{
    const frameDist=[];const fMap={};filtered.forEach(b=>{fMap[b.framework]=(fMap[b.framework]||0)+1;});Object.entries(fMap).forEach(([name,value])=>frameDist.push({name,value}));
    const verDist=[];const vMap={};filtered.forEach(b=>{vMap[b.verifier]=(vMap[b.verifier]||0)+1;});Object.entries(vMap).forEach(([name,value])=>verDist.push({name,value}));
    return(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[{l:'ICMA Aligned',v:filtered.filter(b=>b.icmaAligned).length+'/'+filtered.length},{l:'External Review',v:filtered.filter(b=>b.externalReview).length},{l:'Impact Reports',v:filtered.filter(b=>b.impactReport).length},{l:'Avg Demand',v:filtered.length?(filtered.reduce((s,b)=>s+parseFloat(b.demandRatio),0)/filtered.length).toFixed(1)+'x':'0.0x'}].map((k,i)=>(
            <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}>
              <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase'}}>{k.l}</div>
              <div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Framework Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={frameDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{frameDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Verifier Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={verDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.sage} radius={[6,6,0,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Greenium Analysis</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered.slice(0,20).map(b=>({name:b.issuer.slice(0,12),greenium:parseFloat(b.greenium)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="greenium" fill={T.navy} radius={[4,4,0,0]} name="Greenium (bp)"/></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Reporting Frequency</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={['Annual','Semi-annual','Quarterly'].map(f=>({name:f,value:filtered.filter(b=>b.reportingFreq===f).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{[T.navy,T.gold,T.sage].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Fixed Income / Social</div>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>Social Bond Analytics</h1>
        <div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>
      {tab===0&&renderOverview()}
      {tab===1&&renderScreener()}
      {tab===2&&renderImpact()}
      {tab===3&&renderFramework()}
    </div>
  );
}