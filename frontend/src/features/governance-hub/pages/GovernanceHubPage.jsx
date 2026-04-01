import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const TABS=['Governance Overview','Company Screener','Board Analytics','Voting & Activism'];
const PAGE=12;

const SECTORS=['Technology','Financials','Healthcare','Industrials','Consumer','Energy','Materials','Utilities'];
const REGIONS=['North America','Europe','Asia-Pacific','Emerging Markets'];
const NAMES=['Apple','Microsoft','Amazon','Alphabet','Meta','Tesla','JPMorgan','Goldman Sachs','UnitedHealth','J&J','Pfizer','Lilly','Caterpillar','Honeywell','P&G','Coca-Cola','PepsiCo','ExxonMobil','Chevron','Shell','BP','BHP','Rio Tinto','Duke Energy','NextEra','Prologis','AT&T','Samsung','TSMC','Toyota','Nestle','LVMH','Roche','Novartis','AstraZeneca','Siemens','SAP','ASML','Unilever','L\'Oreal','TotalEnergies','Sanofi','Allianz','HSBC','Barclays','Deutsche Bank','BNP Paribas','Credit Suisse','UBS','Zurich Insurance','AXA','Prudential','Mitsubishi','Sony','Nintendo','Tencent','Alibaba','ICBC','Ping An','Reliance'];

const COMPANIES=Array.from({length:60},(_,i)=>({id:i+1,name:NAMES[i],sector:SECTORS[Math.floor(sr(i*3)*SECTORS.length)],region:REGIONS[Math.floor(sr(i*7)*REGIONS.length)],
  boardSize:Math.floor(sr(i*11)*8+7),indepPct:+(sr(i*13)*40+50).toFixed(1),womenPct:+(sr(i*17)*30+10).toFixed(1),
  avgTenure:+(sr(i*19)*8+2).toFixed(1),avgAge:Math.floor(sr(i*23)*15+50),payRatio:Math.floor(sr(i*29)*300+50),
  govScore:+(sr(i*31)*30+60).toFixed(1),sepChair:sr(i*37)>0.4,esgPay:sr(i*41)>0.3,
  clawback:sr(i*43)>0.25,proxyAccess:sr(i*47)>0.4,sayOnPay:+(sr(i*53)*30+60).toFixed(1),
  overboarded:Math.floor(sr(i*59)*3),antiTakeover:Math.floor(sr(i*61)*3),
  shareholderProps:Math.floor(sr(i*67)*5),controversies:Math.floor(sr(i*71)*5),
  riskScore:+(sr(i*73)*40+20).toFixed(1),votingPower:+(sr(i*79)*20+70).toFixed(1),
}));

const ANNUAL=Array.from({length:8},(_,i)=>({year:2018+i,avgBoard:+(sr(i*83)*2+9).toFixed(1),avgWomen:+(sr(i*89)*5+25).toFixed(1),avgIndep:+(sr(i*97)*5+60).toFixed(1),esgLinked:+(sr(i*101)*10+15).toFixed(1),sepChair:+(sr(i*103)*5+35).toFixed(1),avgPay:Math.floor(sr(i*107)*50+150)}));

const VOTES=Array.from({length:20},(_,i)=>{const types=['Say-on-Pay','Board Election','Share Buyback','ESG Proposal','Anti-Takeover','Proxy Access','Climate Resolution','Diversity Policy','Executive Comp','Audit Committee'];
  return{id:i+1,proposal:types[i%types.length]+' '+(i+1),company:NAMES[Math.floor(sr(i*109)*NAMES.length)],type:types[i%types.length],forPct:+(sr(i*113)*40+50).toFixed(1),againstPct:+(sr(i*117)*30+5).toFixed(1),abstainPct:+(sr(i*121)*10+1).toFixed(1),outcome:sr(i*127)>0.3?'Passed':'Failed',year:2023+Math.floor(sr(i*131)*3)};});

export default function GovernanceHubPage(){
  const [tab,setTab]=useState(0);const [search,setSearch]=useState('');const [sortCol,setSortCol]=useState('govScore');const [sortDir,setSortDir]=useState('desc');const [page,setPage]=useState(0);const [expanded,setExpanded]=useState(null);const [filterSect,setFilterSect]=useState('All');const [filterReg,setFilterReg]=useState('All');
  const [vSearch,setVSearch]=useState('');const [vSort,setVSort]=useState('forPct');const [vDir,setVDir]=useState('desc');const [vExp,setVExp]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));if(filterSect!=='All')d=d.filter(c=>c.sector===filterSect);if(filterReg!=='All')d=d.filter(c=>c.region===filterReg);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,filterSect,filterReg]);
  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);
  const votesF=useMemo(()=>{let d=[...VOTES];if(vSearch)d=d.filter(v=>v.proposal.toLowerCase().includes(vSearch.toLowerCase())||v.company.toLowerCase().includes(vSearch.toLowerCase()));d.sort((a,b)=>vDir==='asc'?((a[vSort]>b[vSort])?1:-1):((a[vSort]<b[vSort])?1:-1));return d;},[vSearch,vSort,vDir]);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const doVSort=(col)=>{if(vSort===col)setVDir(d=>d==='asc'?'desc':'asc');else{setVSort(col);setVDir('desc');}};
  const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const kpis=useMemo(()=>({count:filtered.length,avgGov:(filtered.reduce((s,c)=>s+parseFloat(c.govScore),0)/filtered.length).toFixed(1),avgWomen:(filtered.reduce((s,c)=>s+parseFloat(c.womenPct),0)/filtered.length).toFixed(1),avgIndep:(filtered.reduce((s,c)=>s+parseFloat(c.indepPct),0)/filtered.length).toFixed(1),sepChairs:filtered.filter(c=>c.sepChair).length}),[filtered]);

  const SH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const VH=({col,label})=><th onClick={()=>doVSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,userSelect:'none'}}>{label}{vSort===col?(vDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const Pg=({pg,setPg,tot})=><div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}><button onClick={()=>setPg(p=>Math.max(0,p-1))} disabled={pg===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg===0?'default':'pointer',opacity:pg===0?0.4:1,fontSize:12}}>Prev</button>{Array.from({length:Math.min(tot,7)},(_,i)=>{const p=tot<=7?i:pg<3?i:pg>tot-4?tot-7+i:pg-3+i;return <button key={p} onClick={()=>setPg(p)} style={{padding:'6px 12px',border:`1px solid ${pg===p?T.gold:T.border}`,borderRadius:6,background:pg===p?T.gold:'transparent',color:pg===p?'#fff':T.text,cursor:'pointer',fontWeight:pg===p?700:400,fontSize:12}}>{p+1}</button>;})}<button onClick={()=>setPg(p=>Math.min(tot-1,p+1))} disabled={pg>=tot-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg>=tot-1?'default':'pointer',opacity:pg>=tot-1?0.4:1,fontSize:12}}>Next</button></div>;

  const sectDist=useMemo(()=>{const m={};SECTORS.forEach(s=>m[s]=0);filtered.forEach(c=>m[c.sector]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);

  const renderOverview=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Companies',v:kpis.count},{l:'Avg Gov Score',v:kpis.avgGov},{l:'Avg Women %',v:kpis.avgWomen+'%'},{l:'Avg Independence',v:kpis.avgIndep+'%'},{l:'Separated Chairs',v:kpis.sepChairs}].map((k,i)=><div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Board Diversity Trend</div>
          <ResponsiveContainer width="100%" height={280}><LineChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Line type="monotone" dataKey="avgWomen" stroke={T.gold} strokeWidth={2} name="Women %"/>
            <Line type="monotone" dataKey="avgIndep" stroke={T.navy} strokeWidth={2} name="Independent %"/>
            <Line type="monotone" dataKey="esgLinked" stroke={T.green} strokeWidth={2} name="ESG-Linked Pay %"/>
          </LineChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Distribution</div>
          <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={sectDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{sectDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>CEO Pay Ratio Trend</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avgPay" fill={T.navy} radius={[6,6,0,0]} name="Avg Pay Ratio"/></BarChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Governance Score vs Risk</div>
          <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Gov Score" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Risk Score" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/>
            <Scatter data={filtered.map(c=>({name:c.name,x:parseFloat(c.govScore),y:parseFloat(c.riskScore)}))} fill={T.navy} fillOpacity={0.5}/>
          </ScatterChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  const renderScreener=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search companies..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <select value={filterSect} onChange={e=>{setFilterSect(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <select value={filterReg} onChange={e=>{setFilterReg(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}</select>
        <button onClick={()=>exportCSV(filtered,'governance.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>{filtered.length} companies | Page {page+1}/{totalPages}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <SH col="name" label="Company" w="130px"/><SH col="sector" label="Sector"/><SH col="govScore" label="Gov Score"/>
            <SH col="boardSize" label="Board"/><SH col="indepPct" label="Indep %"/><SH col="womenPct" label="Women %"/>
            <SH col="payRatio" label="Pay Ratio"/><SH col="sayOnPay" label="Say-on-Pay"/><SH col="riskScore" label="Risk"/>
          </tr></thead>
          <tbody>{paged.map(c=>(
            <React.Fragment key={c.id}>
              <tr onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{cursor:'pointer',background:expanded===c.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===c.id?'\u25BC':'\u25B6'} {c.name}</td>
                <td style={{padding:'10px 8px',color:T.textSec}}>{c.sector}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(c.govScore)>75?T.green:T.navy}}>{c.govScore}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.boardSize}</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.indepPct}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.womenPct}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.payRatio}:1</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.sayOnPay}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(c.riskScore)>40?T.red:T.green}}>{c.riskScore}</td>
              </tr>
              {expanded===c.id&&(
                <tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Governance Detail</div>
                      {[['Region',c.region],['Avg Tenure',c.avgTenure+' yrs'],['Avg Age',c.avgAge],['Separated Chair',c.sepChair?'Yes':'No'],['ESG-Linked Pay',c.esgPay?'Yes':'No'],['Clawback',c.clawback?'Yes':'No'],['Proxy Access',c.proxyAccess?'Yes':'No']].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>)}
                    </div>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Factors</div>
                      {[['Overboarded Dirs',c.overboarded],['Anti-Takeover',c.antiTakeover],['Controversies',c.controversies],['Shareholder Props',c.shareholderProps],['Voting Power',c.votingPower+'%']].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>)}
                    </div>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Governance Radar</div>
                      <ResponsiveContainer width="100%" height={200}><RadarChart data={[{m:'Score',v:parseFloat(c.govScore)},{m:'Independence',v:parseFloat(c.indepPct)},{m:'Diversity',v:parseFloat(c.womenPct)*2},{m:'Say-on-Pay',v:parseFloat(c.sayOnPay)},{m:'Voting Power',v:parseFloat(c.votingPower)},{m:'Low Risk',v:100-parseFloat(c.riskScore)}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart></ResponsiveContainer>
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

  const renderBoard=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Board Size Distribution</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={Array.from({length:9},(_,i)=>({size:i+6,count:filtered.filter(c=>c.boardSize===i+6).length})).filter(d=>d.count>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="size" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} radius={[6,6,0,0]} name="Companies"/></BarChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Gender Diversity by Sector</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={SECTORS.map(s=>{const cs=filtered.filter(c=>c.sector===s);return{name:s.slice(0,10),women:cs.length?(cs.reduce((sum,c)=>sum+parseFloat(c.womenPct),0)/cs.length).toFixed(1):0};}).filter(d=>d.women>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="women" fill={T.gold} radius={[6,6,0,0]} name="Avg Women %"/></BarChart></ResponsiveContainer></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Tenure Distribution</div>
          <ResponsiveContainer width="100%" height={260}><AreaChart data={filtered.sort((a,b)=>parseFloat(a.avgTenure)-parseFloat(b.avgTenure)).map(c=>({name:c.name.slice(0,6),tenure:parseFloat(c.avgTenure)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} interval={4}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="tenure" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="Avg Tenure (yrs)"/></AreaChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Independence vs Women %</div>
          <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Independence %" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Women %" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/>
            <Scatter data={filtered.map(c=>({name:c.name,x:parseFloat(c.indepPct),y:parseFloat(c.womenPct)}))} fill={T.gold} fillOpacity={0.6}/>
          </ScatterChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  const renderVoting=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={vSearch} onChange={e=>setVSearch(e.target.value)} placeholder="Search proposals..." style={{flex:1,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <button onClick={()=>exportCSV(VOTES,'voting_data.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto',marginBottom:20}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <VH col="proposal" label="Proposal"/><VH col="company" label="Company"/><VH col="type" label="Type"/>
            <VH col="forPct" label="For %"/><VH col="againstPct" label="Against %"/><VH col="outcome" label="Outcome"/>
          </tr></thead>
          <tbody>{votesF.map(v=>(
            <React.Fragment key={v.id}>
              <tr onClick={()=>setVExp(vExp===v.id?null:v.id)} style={{cursor:'pointer',background:vExp===v.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{vExp===v.id?'\u25BC':'\u25B6'} {v.proposal}</td>
                <td style={{padding:'10px 8px',color:T.textSec}}>{v.company}</td>
                <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{v.type}</span></td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:T.green}}>{v.forPct}%</td>
                <td style={{padding:'10px 8px',fontFamily:T.mono,color:T.red}}>{v.againstPct}%</td>
                <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:v.outcome==='Passed'?'#d1fae5':'#fee2e2',color:v.outcome==='Passed'?'#065f46':'#991b1b'}}>{v.outcome}</span></td>
              </tr>
              {vExp===v.id&&(
                <tr><td colSpan={6} style={{padding:16,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    <div>{[['Year',v.year],['Abstain %',v.abstainPct+'%']].map(([l,val])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,fontFamily:T.mono}}>{val}</span></div>)}</div>
                    <ResponsiveContainer width="100%" height={120}><PieChart><Pie data={[{name:'For',value:parseFloat(v.forPct)},{name:'Against',value:parseFloat(v.againstPct)},{name:'Abstain',value:parseFloat(v.abstainPct)}]} dataKey="value" cx="50%" cy="50%" outerRadius={45} label><Cell fill={T.green}/><Cell fill={T.red}/><Cell fill={T.border}/></Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}</tbody>
        </table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Vote Outcomes by Type</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={[...new Set(VOTES.map(v=>v.type))].map(t=>({name:t.slice(0,12),passed:VOTES.filter(v=>v.type===t&&v.outcome==='Passed').length,failed:VOTES.filter(v=>v.type===t&&v.outcome==='Failed').length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Bar dataKey="passed" fill={T.green} name="Passed" radius={[4,4,0,0]}/>
            <Bar dataKey="failed" fill={T.red} name="Failed" radius={[4,4,0,0]}/>
          </BarChart></ResponsiveContainer></div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Support Levels</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={VOTES.slice(0,10).map(v=>({name:v.proposal.slice(0,15),forPct:parseFloat(v.forPct),againstPct:parseFloat(v.againstPct)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
            <Bar dataKey="forPct" stackId="a" fill={T.green} name="For %"/>
            <Bar dataKey="againstPct" stackId="a" fill={T.red} name="Against %"/>
          </BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Corporate Governance</div><h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>Governance Analytics Hub</h1><div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/></div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}</div>
      {tab===0&&renderOverview()}{tab===1&&renderScreener()}{tab===2&&renderBoard()}{tab===3&&renderVoting()}
    </div>
  );
}