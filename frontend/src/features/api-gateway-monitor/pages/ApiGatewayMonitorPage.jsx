import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Endpoint Registry','Traffic Dashboard','Rate Limiting & Throttling','API Documentation'];

const API_DOMAINS=['ESG Strategy','Climate Risk','Regulatory Reporting','Portfolio Analytics','Supply Chain ESG',
  'Nature & Biodiversity','Governance Intelligence','Social & Just Transition','Decarbonisation & SBTi',
  'Private Markets ESG','Quantitative ESG','Financed Emissions','ESG Ratings Intelligence',
  'Transition Planning','Climate Finance','Physical Risk','Macro & Systemic Risk','Water Risk',
  'Circular Economy','Air Quality & Health','Land Use & Deforestation','Human Rights',
  'Executive Pay','Board Composition','Shareholder Activism','Anti-Corruption',
  'Proxy Voting','Diversity & Inclusion','Living Wage','Modern Slavery',
  'Community Impact','Workplace Health','CSRD/ESRS','SFDR','ISSB','UK SDR',
  'SEC Climate','CBAM Compliance','Green Taxonomy','Climate Sovereign Bonds',
  'Carbon Markets','Scenario Modelling','Contagion Analysis','Auth & Users',
  'Portfolios','Companies','Calculations','Audit','Health & Monitoring','Data Import','Webhooks','Admin'];

const METHODS=['GET','POST','PUT','DELETE'];
const METHOD_WEIGHTS=[0.5,0.3,0.12,0.08];
const ENDPOINT_PATTERNS=[
  '/list','/detail/{id}','/create','/update/{id}','/delete/{id}','/calculate','/export','/import',
  '/summary','/analytics','/compare','/history','/validate','/score','/benchmark','/trend',
  '/matrix','/breakdown','/forecast','/simulate','/report','/download','/upload','/config'];

const ENDPOINTS=Array.from({length:2302},(_,i)=>{
  const domainIdx=Math.floor(sr(i*3)*API_DOMAINS.length);
  const domain=API_DOMAINS[domainIdx];
  const domainSlug=domain.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const patternIdx=Math.floor(sr(i*7)*ENDPOINT_PATTERNS.length);
  const pattern=ENDPOINT_PATTERNS[patternIdx];
  const subResource=['','','/metrics','/config','/batch','/stream','/validate','/export'][Math.floor(sr(i*11)*8)];
  const path=`/api/v1/${domainSlug}${pattern}${subResource}`;
  const mRand=sr(i*13);
  const method=mRand<0.5?'GET':mRand<0.8?'POST':mRand<0.92?'PUT':'DELETE';
  const avgResp=Math.floor(sr(i*17)*800+20);
  const errorRate=+(sr(i*19)*5).toFixed(2);
  const calls24h=Math.floor(sr(i*23)*5000+10);
  const authRequired=sr(i*29)>0.05;
  const rateLimit=method==='GET'?[100,500,1000][Math.floor(sr(i*31)*3)]:[50,200,500][Math.floor(sr(i*37)*3)];
  const lastCalled=sr(i*41)>0.1?new Date(2026,2,29,Math.floor(sr(i*43)*24),Math.floor(sr(i*47)*60)).toISOString().replace('T',' ').slice(0,16):'Never';
  const health=errorRate>3?'red':errorRate>1?'amber':'green';
  return{
    id:i+1,path,method,domain,domainSlug,authRequired,rateLimit,
    avgResponseTime:avgResp,errorRate,calls24h,lastCalled,health,
    p50:Math.floor(avgResp*0.6),p95:Math.floor(avgResp*1.8),p99:Math.floor(avgResp*3.2),
    successRate:+(100-errorRate).toFixed(2),
    cacheable:method==='GET'&&sr(i*53)>0.4,
    deprecated:sr(i*59)>0.95,
    version:sr(i*61)>0.1?'v1':'v2-beta',
    payload:method!=='GET'?['application/json','multipart/form-data'][Math.floor(sr(i*67)*2)]:'N/A',
  };
});

const DOMAIN_GROUPS=(()=>{
  const groups={};
  API_DOMAINS.forEach(d=>{groups[d]=ENDPOINTS.filter(e=>e.domain===d);});
  return groups;
})();

const TRAFFIC_24H=Array.from({length:24},(_,h)=>({
  hour:`${String(h).padStart(2,'0')}:00`,
  requests:Math.floor(sr(h*100)*8000+1000),
  errors:Math.floor(sr(h*103)*200+10),
  latency:Math.floor(sr(h*107)*200+50),
  p95:Math.floor(sr(h*109)*400+100),
  unique:Math.floor(sr(h*111)*500+50),
}));

const TRAFFIC_7D=Array.from({length:7},(_,d)=>({
  day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d],
  requests:Math.floor(sr(d*200)*200000+50000),
  errors:Math.floor(sr(d*203)*5000+500),
}));

const STATUS_DIST=[
  {code:'200',count:Math.floor(sr(1000)*400000+200000),color:T.green},
  {code:'201',count:Math.floor(sr(1001)*50000+10000),color:T.sage},
  {code:'400',count:Math.floor(sr(1003)*10000+2000),color:T.amber},
  {code:'401',count:Math.floor(sr(1007)*5000+500),color:T.goldL},
  {code:'404',count:Math.floor(sr(1009)*8000+1000),color:T.red},
  {code:'500',count:Math.floor(sr(1013)*3000+200),color:'#8b5cf6'},
];

const TOP_ENDPOINTS=ENDPOINTS.sort((a,b)=>b.calls24h-a.calls24h).slice(0,20);

const GEO_DIST=[
  {region:'North America',pct:42,requests:'1.2M'},
  {region:'Europe',pct:31,requests:'890K'},
  {region:'Asia Pacific',pct:15,requests:'430K'},
  {region:'Latin America',pct:7,requests:'200K'},
  {region:'Middle East & Africa',pct:3,requests:'86K'},
  {region:'Other',pct:2,requests:'57K'},
];

const TIERS=[
  {name:'Tier 1 — Basic',reqPerMin:100,reqPerDay:10000,burst:150,clients:12,color:T.borderL},
  {name:'Tier 2 — Professional',reqPerMin:500,reqPerDay:100000,burst:750,clients:28,color:T.sage},
  {name:'Tier 3 — Enterprise',reqPerMin:2000,reqPerDay:500000,burst:3000,clients:8,color:T.gold},
  {name:'Tier 4 — Unlimited',reqPerMin:999999,reqPerDay:999999,burst:999999,clients:3,color:T.navy},
];

const THROTTLED_LOG=Array.from({length:40},(_,i)=>({
  id:i+1,
  timestamp:new Date(2026,2,29-Math.floor(sr(i*300)*7),Math.floor(sr(i*303)*24),Math.floor(sr(i*307)*60)).toISOString().replace('T',' ').slice(0,16),
  client:`client_${String(Math.floor(sr(i*309)*50+1)).padStart(3,'0')}`,
  tier:TIERS[Math.floor(sr(i*311)*3)].name.split(' — ')[1],
  endpoint:ENDPOINTS[Math.floor(sr(i*313)*200)].path.slice(0,50),
  limitHit:sr(i*317)>0.5?'Rate':'Burst',
  blocked:Math.floor(sr(i*319)*100+1),
}));

const RATE_LIMIT_HITS=Array.from({length:24},(_,h)=>({
  hour:`${String(h).padStart(2,'0')}:00`,
  tier1:Math.floor(sr(h*400)*50),
  tier2:Math.floor(sr(h*403)*20),
  tier3:Math.floor(sr(h*407)*5),
}));

const CLIENT_USAGE=Array.from({length:20},(_,i)=>({
  id:`client_${String(i+1).padStart(3,'0')}`,
  name:['ESG Portal','Risk Dashboard','Compliance Bot','Report Generator','Data Pipeline','Analytics Hub','External Feed','Webhook Service','Mobile App','Partner API','Audit Tool','Migration Service','Backup Agent','Test Suite','Monitoring','SDK Client','R Package','Python SDK','Excel Plugin','Power BI Connector'][i],
  tier:TIERS[Math.min(Math.floor(sr(i*420)*4),3)].name.split(' — ')[1],
  reqToday:Math.floor(sr(i*423)*50000+500),
  quotaUsed:+(sr(i*427)*80+10).toFixed(1),
  rateHits7d:Math.floor(sr(i*429)*50),
  avgLatency:Math.floor(sr(i*431)*300+30),
  lastRequest:new Date(2026,2,29,Math.floor(sr(i*433)*24),Math.floor(sr(i*437)*60)).toISOString().replace('T',' ').slice(0,16),
}));

const API_CHANGELOG=[
  {version:'v1.47.0',date:'2026-03-28',changes:['Added CSRD ESRS batch endpoint','Improved PCAF calculation performance','Fixed taxonomy alignment edge case']},
  {version:'v1.46.0',date:'2026-03-21',changes:['New transition planning endpoints','Added SBTi target validation','Rate limit headers now include retry-after']},
  {version:'v1.45.0',date:'2026-03-14',changes:['Green asset ratio bulk calculation','SSO token refresh optimization','Deprecated v0 emissions endpoints']},
  {version:'v1.44.0',date:'2026-03-07',changes:['Private markets ESG due diligence API','New webhook event types','Fixed rate limit counter race condition']},
  {version:'v1.43.0',date:'2026-02-28',changes:['Board composition analytics endpoints','Executive pay benchmarking API','Improved error messages for 422 responses']},
];

const DEPRECATIONS=[
  {endpoint:'/api/v0/emissions/calculate',replacement:'/api/v1/decarbonisation-sbti/calculate',deadline:'2026-06-30',usage:Math.floor(sr(9000)*500)},
  {endpoint:'/api/v0/portfolio/score',replacement:'/api/v1/quantitative-esg/score',deadline:'2026-06-30',usage:Math.floor(sr(9003)*200)},
  {endpoint:'/api/v0/companies/esg',replacement:'/api/v1/esg-ratings-intelligence/detail/{id}',deadline:'2026-09-30',usage:Math.floor(sr(9007)*150)},
  {endpoint:'/api/v0/risk/physical',replacement:'/api/v1/physical-risk/analytics',deadline:'2026-09-30',usage:Math.floor(sr(9011)*80)},
];

const WEBHOOK_EVENTS=['calculation.completed','report.generated','portfolio.updated','company.scored','alert.triggered','data.imported','disclosure.submitted','user.action','system.health','api.rate_limited'];

export default function ApiGatewayMonitorPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[filterDomain,setFilterDomain]=useState('All');
  const[filterMethod,setFilterMethod]=useState('All');
  const[filterHealth,setFilterHealth]=useState('All');
  const[selectedEndpoint,setSelectedEndpoint]=useState(null);
  const[sortCol,setSortCol]=useState('calls24h');
  const[sortDir,setSortDir]=useState(-1);
  const[expandedDomain,setExpandedDomain]=useState(null);
  const[trafficRange,setTrafficRange]=useState('24h');
  const[rateTier,setRateTier]=useState('All');
  const[docDomain,setDocDomain]=useState('All');
  const[docSearch,setDocSearch]=useState('');
  const[showWebhookConfig,setShowWebhookConfig]=useState(false);
  const[showKeyGen,setShowKeyGen]=useState(false);
  const[page,setPage]=useState(0);
  const PAGE_SIZE=20;

  const filteredEndpoints=useMemo(()=>{
    let e=[...ENDPOINTS];
    if(search)e=e.filter(x=>x.path.toLowerCase().includes(search.toLowerCase())||x.domain.toLowerCase().includes(search.toLowerCase()));
    if(filterDomain!=='All')e=e.filter(x=>x.domain===filterDomain);
    if(filterMethod!=='All')e=e.filter(x=>x.method===filterMethod);
    if(filterHealth!=='All')e=e.filter(x=>x.health===filterHealth);
    e.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];return(typeof av==='string'?(av<bv?-1:av>bv?1:0):(av-bv))*sortDir;});
    return e;
  },[search,filterDomain,filterMethod,filterHealth,sortCol,sortDir]);

  const pagedEndpoints=useMemo(()=>filteredEndpoints.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filteredEndpoints,page]);
  const totalPages=Math.ceil(filteredEndpoints.length/PAGE_SIZE);

  const domainStats=useMemo(()=>API_DOMAINS.map(d=>{
    const eps=ENDPOINTS.filter(e=>e.domain===d);
    return{domain:d,count:eps.length,avgResp:Math.round(eps.reduce((a,e)=>a+e.avgResponseTime,0)/(eps.length||1)),avgError:+(eps.reduce((a,e)=>a+e.errorRate,0)/(eps.length||1)).toFixed(2),totalCalls:eps.reduce((a,e)=>a+e.calls24h,0)};
  }).sort((a,b)=>b.count-a.count),[]);

  const methodDist=useMemo(()=>METHODS.map(m=>({method:m,count:ENDPOINTS.filter(e=>e.method===m).length})),[]);
  const healthDist=useMemo(()=>['green','amber','red'].map(h=>({status:h,count:ENDPOINTS.filter(e=>e.health===h).length})),[]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>-d);else{setSortCol(col);setSortDir(-1);}};

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text,padding:24},
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16},
    tabBar:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:24},
    tabBtn:(a)=>({padding:'12px 24px',cursor:'pointer',border:'none',background:a?T.surface:'transparent',color:a?T.gold:T.textSec,fontWeight:a?700:500,fontSize:14,fontFamily:T.font,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',transition:'all 0.2s'}),
    input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface,outline:'none',minWidth:200},
    select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface},
    btn:(c=T.navy)=>({padding:'8px 18px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600}),
    btnOutline:{padding:'8px 18px',background:'transparent',color:T.navy,border:`1px solid ${T.navy}`,borderRadius:8,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600},
    badge:(c)=>({display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:c==='green'?'#dcfce7':c==='amber'?'#fef3c7':c==='red'?'#fee2e2':c==='GET'?'#dbeafe':c==='POST'?'#dcfce7':c==='PUT'?'#fef3c7':'#fee2e2',color:c==='green'?T.green:c==='amber'?T.amber:c==='red'?T.red:c==='GET'?T.navyL:c==='POST'?T.green:c==='PUT'?T.amber:T.red}),
    th:{padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:700,color:T.textSec,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px'},
    td:{padding:'10px 12px',fontSize:13,borderBottom:`1px solid ${T.borderL}`,verticalAlign:'middle'},
    metric:{textAlign:'center',padding:16},
    metricVal:{fontSize:28,fontWeight:800,fontFamily:T.mono,color:T.navy},
    metricLbl:{fontSize:11,color:T.textSec,marginTop:4,fontWeight:600,textTransform:'uppercase'},
    grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16},
    mono:{fontFamily:T.mono,fontSize:12},
    health:(h)=>({width:12,height:12,borderRadius:'50%',display:'inline-block',background:h==='green'?T.green:h==='amber'?T.amber:T.red}),
    panel:{position:'fixed',top:0,right:0,width:560,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.gold}`,zIndex:1000,overflowY:'auto',padding:24,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},
    overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:999},
  };

  const renderEndpointRegistry=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input style={ss.input} placeholder="Search endpoints..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
        <select style={ss.select} value={filterDomain} onChange={e=>{setFilterDomain(e.target.value);setPage(0);}}>
          <option value="All">All Domains ({API_DOMAINS.length})</option>{API_DOMAINS.map(d=><option key={d}>{d}</option>)}
        </select>
        <select style={ss.select} value={filterMethod} onChange={e=>{setFilterMethod(e.target.value);setPage(0);}}>
          <option value="All">All Methods</option>{METHODS.map(m=><option key={m}>{m}</option>)}
        </select>
        <select style={ss.select} value={filterHealth} onChange={e=>{setFilterHealth(e.target.value);setPage(0);}}>
          <option value="All">All Health</option><option value="green">Healthy</option><option value="amber">Degraded</option><option value="red">Error</option>
        </select>
        <span style={{...ss.mono,color:T.textMut}}>{filteredEndpoints.length} / {ENDPOINTS.length} endpoints</span>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(5,1fr)',marginBottom:24}}>
        {[{label:'Total Endpoints',value:'2,302',color:T.navy},{label:'Domains',value:API_DOMAINS.length,color:T.gold},{label:'Healthy',value:healthDist[0]?.count,color:T.green},{label:'Degraded',value:healthDist[1]?.count,color:T.amber},{label:'Error',value:healthDist[2]?.count,color:T.red}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color,fontSize:22}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Method Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={methodDist} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={60} label={({method,count})=>`${method} (${count})`}>
              <Cell fill={T.navyL}/><Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Endpoints by Domain (Top 12)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={domainStats.slice(0,12).map(d=>({name:d.domain.slice(0,10),count:d.count}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Endpoint Registry</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {[['health',''],['method','Method'],['path','Path'],['domain','Domain'],['avgResponseTime','Avg Resp'],['errorRate','Error %'],['calls24h','Calls 24h'],['authRequired','Auth'],['rateLimit','Rate Limit'],['lastCalled','Last Called']].map(([k,l])=>(
                <th key={k} style={ss.th} onClick={()=>handleSort(k)}>{l}{sortCol===k?(sortDir===1?' ASC':' DESC'):''}</th>
              ))}
            </tr></thead>
            <tbody>{pagedEndpoints.map(e=>(
              <tr key={e.id} style={{cursor:'pointer'}} onClick={()=>setSelectedEndpoint(e)}>
                <td style={ss.td}><span style={ss.health(e.health)}/></td>
                <td style={ss.td}><span style={ss.badge(e.method)}>{e.method}</span></td>
                <td style={{...ss.td,...ss.mono,fontSize:10,maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.path}</td>
                <td style={{...ss.td,fontSize:11}}>{e.domain}</td>
                <td style={{...ss.td,...ss.mono,color:e.avgResponseTime>500?T.red:e.avgResponseTime>200?T.amber:T.green}}>{e.avgResponseTime}ms</td>
                <td style={{...ss.td,...ss.mono,color:e.errorRate>3?T.red:e.errorRate>1?T.amber:T.green}}>{e.errorRate}%</td>
                <td style={{...ss.td,...ss.mono}}>{fmt(e.calls24h)}</td>
                <td style={ss.td}><span style={{color:e.authRequired?T.green:T.red,fontWeight:700,fontSize:11}}>{e.authRequired?'YES':'NO'}</span></td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.rateLimit}/min</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.lastCalled}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16}}>
          <span style={{fontSize:12,color:T.textSec}}>{filteredEndpoints.length} endpoints</span>
          <div style={{display:'flex',gap:4}}>
            {page>0&&<button onClick={()=>setPage(p=>p-1)} style={{...ss.btn(T.bg),color:T.text,padding:'4px 12px',fontSize:12}}>Prev</button>}
            <span style={{...ss.mono,padding:'4px 12px',fontSize:12}}>Page {page+1}/{totalPages}</span>
            {page<totalPages-1&&<button onClick={()=>setPage(p=>p+1)} style={{...ss.btn(T.bg),color:T.text,padding:'4px 12px',fontSize:12}}>Next</button>}
          </div>
        </div>
      </div>

      {selectedEndpoint&&<><div style={ss.overlay} onClick={()=>setSelectedEndpoint(null)}/><div style={ss.panel}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16}}>Endpoint Detail</h3>
          <button onClick={()=>setSelectedEndpoint(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <span style={ss.badge(selectedEndpoint.method)}>{selectedEndpoint.method}</span>
          <span style={ss.badge(selectedEndpoint.health)}>{selectedEndpoint.health}</span>
          {selectedEndpoint.deprecated&&<span style={{...ss.badge('red'),background:'#fee2e2'}}>DEPRECATED</span>}
        </div>
        <div style={{...ss.mono,fontSize:13,padding:12,background:T.surfaceH,borderRadius:8,marginBottom:16,wordBreak:'break-all'}}>{selectedEndpoint.path}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {[['Domain',selectedEndpoint.domain],['Version',selectedEndpoint.version],['Auth Required',selectedEndpoint.authRequired?'Yes':'No'],['Rate Limit',`${selectedEndpoint.rateLimit}/min`],['Avg Response',`${selectedEndpoint.avgResponseTime}ms`],['P50',`${selectedEndpoint.p50}ms`],['P95',`${selectedEndpoint.p95}ms`],['P99',`${selectedEndpoint.p99}ms`],['Error Rate',`${selectedEndpoint.errorRate}%`],['Calls (24h)',fmt(selectedEndpoint.calls24h)],['Cacheable',selectedEndpoint.cacheable?'Yes':'No'],['Payload',selectedEndpoint.payload]].map(([k,v],i)=>(
            <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:8}}>
              <div style={{fontSize:10,color:T.textMut,fontWeight:600,textTransform:'uppercase'}}>{k}</div>
              <div style={{fontSize:13,fontWeight:600,...ss.mono}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Example cURL</div>
        <div style={{...ss.mono,fontSize:10,padding:12,background:'#1b3a5c',color:'#e2e8f0',borderRadius:8,marginBottom:16,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
{`curl -X ${selectedEndpoint.method} \\
  https://api.sustainanalytics.io${selectedEndpoint.path} \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json"${selectedEndpoint.method!=='GET'?` \\
  -d '{"portfolio_id": "PF-001"}'`:''}`}
        </div>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Response Schema</div>
        <div style={{...ss.mono,fontSize:10,padding:12,background:T.surfaceH,borderRadius:8,marginBottom:16,whiteSpace:'pre-wrap'}}>
{`{
  "status": "success",
  "data": {
    "id": "string",
    "result": "number",
    "metadata": {
      "engine_version": "string",
      "calculated_at": "datetime",
      "data_quality": "number"
    }
  },
  "pagination": {
    "page": "integer",
    "per_page": "integer",
    "total": "integer"
  }
}`}
        </div>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Recent Errors (Last 24h)</div>
        <div style={{maxHeight:150,overflowY:'auto'}}>
          {Array.from({length:5},(_,i)=>({
            time:`${Math.floor(sr(selectedEndpoint.id*100+i)*24)}h ago`,
            status:[400,404,500,422,503][Math.floor(sr(selectedEndpoint.id*100+i+1)*5)],
            message:['Invalid parameters','Resource not found','Internal server error','Validation failed','Service unavailable'][Math.floor(sr(selectedEndpoint.id*100+i+1)*5)],
          })).map((e,i)=>(
            <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.borderL}`,display:'flex',justifyContent:'space-between',fontSize:11}}>
              <span><span style={{color:T.red,fontWeight:700,...ss.mono}}>{e.status}</span> {e.message}</span>
              <span style={{...ss.mono,color:T.textMut}}>{e.time}</span>
            </div>
          ))}
        </div>
      </div></>}
    </div>
  );

  const renderTrafficDashboard=()=>(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {['24h','7d','30d'].map(r=><button key={r} style={ss.btn(trafficRange===r?T.navy:T.bg)} onClick={()=>setTrafficRange(r)}>{r}</button>)}
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(5,1fr)',marginBottom:24}}>
        {[{label:'Total Requests (24h)',value:'2.86M',color:T.navy},{label:'Error Rate',value:'1.42%',color:T.red},{label:'Avg Latency',value:'127ms',color:T.gold},{label:'P95 Latency',value:'342ms',color:T.amber},{label:'P99 Latency',value:'891ms',color:'#8b5cf6'}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color,fontSize:22}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Requests Per Hour (24h)</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={TRAFFIC_24H}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="hour" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Legend/>
            <Area type="monotone" dataKey="requests" fill={T.navy} fillOpacity={0.15} stroke={T.navy} strokeWidth={2} name="Requests"/>
            <Area type="monotone" dataKey="errors" fill={T.red} fillOpacity={0.15} stroke={T.red} strokeWidth={2} name="Errors"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Top 20 Busiest Endpoints</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={TOP_ENDPOINTS.map(e=>({name:e.path.split('/').pop()||e.path.slice(-20),calls:e.calls24h}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="name" type="category" tick={{fontSize:8,fill:T.textSec}} width={100}/><Tooltip {...tip}/><Bar dataKey="calls" fill={T.gold} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>HTTP Status Code Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={STATUS_DIST} dataKey="count" nameKey="code" cx="50%" cy="50%" outerRadius={70} label={({code,count})=>`${code} (${fmt(count)})`}>
              {STATUS_DIST.map((s,i)=><Cell key={i} fill={s.color}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
          <div style={{marginTop:16,fontSize:13,fontWeight:700,marginBottom:12}}>Latency Percentiles (24h)</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={TRAFFIC_24H}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="hour" tick={{fontSize:9,fill:T.textSec}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Legend/>
              <Line type="monotone" dataKey="latency" stroke={T.sage} strokeWidth={2} dot={false} name="Avg"/>
              <Line type="monotone" dataKey="p95" stroke={T.amber} strokeWidth={2} dot={false} name="P95"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Geographic Distribution</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Region','Share','Requests'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{GEO_DIST.map((g,i)=>(
              <tr key={i}>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{g.region}</td>
                <td style={ss.td}><div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,height:6,background:T.borderL,borderRadius:3}}><div style={{height:'100%',width:`${g.pct}%`,background:COLORS[i%COLORS.length],borderRadius:3}}/></div>
                  <span style={{...ss.mono,fontSize:11}}>{g.pct}%</span>
                </div></td>
                <td style={{...ss.td,...ss.mono}}>{g.requests}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Throughput by Domain (Top 10)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={domainStats.sort((a,b)=>b.totalCalls-a.totalCalls).slice(0,10).map(d=>({name:d.domain.slice(0,12),calls:d.totalCalls}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}} tickFormatter={fmt}/><YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={90}/><Tooltip {...tip}/><Bar dataKey="calls" fill={T.sage} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderRateLimiting=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <select style={ss.select} value={rateTier} onChange={e=>setRateTier(e.target.value)}>
          <option value="All">All Tiers</option>{TIERS.map(t=><option key={t.name}>{t.name}</option>)}
        </select>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {TIERS.map((t,i)=>(
          <div key={i} style={{...ss.card,borderLeft:`4px solid ${t.color}`}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{t.name}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><div style={{fontSize:10,color:T.textMut}}>Rate</div><div style={{...ss.mono,fontWeight:700}}>{t.reqPerMin===999999?'Unlimited':`${fmt(t.reqPerMin)}/min`}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Daily</div><div style={{...ss.mono,fontWeight:700}}>{t.reqPerDay===999999?'Unlimited':fmt(t.reqPerDay)}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Burst</div><div style={{...ss.mono,fontWeight:700}}>{t.burst===999999?'Unlimited':fmt(t.burst)}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Clients</div><div style={{...ss.mono,fontWeight:700}}>{t.clients}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Rate Limit Hits by Tier (24h)</div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={RATE_LIMIT_HITS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="hour" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Legend/>
              <Area type="monotone" dataKey="tier1" fill={T.borderL} fillOpacity={0.3} stroke={T.borderL} strokeWidth={2} name="Tier 1"/>
              <Area type="monotone" dataKey="tier2" fill={T.sage} fillOpacity={0.2} stroke={T.sage} strokeWidth={2} name="Tier 2"/>
              <Area type="monotone" dataKey="tier3" fill={T.gold} fillOpacity={0.2} stroke={T.gold} strokeWidth={2} name="Tier 3"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Quota Usage by Client</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={CLIENT_USAGE.sort((a,b)=>b.quotaUsed-a.quotaUsed).slice(0,10).map(c=>({name:c.name.slice(0,12),usage:c.quotaUsed}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}} tickFormatter={v=>`${v}%`}/><Tooltip {...tip}/>
              <Bar dataKey="usage" radius={[4,4,0,0]}>{CLIENT_USAGE.sort((a,b)=>b.quotaUsed-a.quotaUsed).slice(0,10).map((c,i)=><Cell key={i} fill={c.quotaUsed>80?T.red:c.quotaUsed>60?T.amber:T.green}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Per-Client Rate Limit Status</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Client ID','Name','Tier','Requests Today','Quota Used','Rate Hits (7d)','Avg Latency','Last Request'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{CLIENT_USAGE.filter(c=>rateTier==='All'||c.tier===rateTier.split(' — ')[1]).map(c=>(
              <tr key={c.id}>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.id}</td>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{c.name}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',background:T.surfaceH,borderRadius:4,fontSize:10,fontWeight:600}}>{c.tier}</span></td>
                <td style={{...ss.td,...ss.mono}}>{fmt(c.reqToday)}</td>
                <td style={ss.td}><div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,height:6,background:T.borderL,borderRadius:3,maxWidth:80}}><div style={{height:'100%',width:`${c.quotaUsed}%`,background:c.quotaUsed>80?T.red:c.quotaUsed>60?T.amber:T.green,borderRadius:3}}/></div>
                  <span style={{...ss.mono,fontSize:11,color:c.quotaUsed>80?T.red:c.quotaUsed>60?T.amber:T.green}}>{c.quotaUsed}%</span>
                </div></td>
                <td style={{...ss.td,...ss.mono,color:c.rateHits7d>30?T.red:c.rateHits7d>10?T.amber:T.green}}>{c.rateHits7d}</td>
                <td style={{...ss.td,...ss.mono}}>{c.avgLatency}ms</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{c.lastRequest}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Throttled Request Log</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Time','Client','Tier','Endpoint','Limit Type','Blocked Requests'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{THROTTLED_LOG.slice(0,15).map(l=>(
              <tr key={l.id}>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{l.timestamp}</td>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{l.client}</td>
                <td style={ss.td}>{l.tier}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.endpoint}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:l.limitHit==='Burst'?'#fee2e2':'#fef3c7',color:l.limitHit==='Burst'?T.red:T.amber}}>{l.limitHit}</span></td>
                <td style={{...ss.td,...ss.mono,fontWeight:700,color:T.red}}>{l.blocked}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Rate Limit Configuration Editor</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {TIERS.map((t,i)=>(
            <div key={i} style={{padding:16,background:T.surfaceH,borderRadius:8,borderTop:`3px solid ${t.color}`}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>{t.name}</div>
              {[['Requests/min',t.reqPerMin===999999?'Unlimited':t.reqPerMin],['Requests/day',t.reqPerDay===999999?'Unlimited':fmt(t.reqPerDay)],['Burst limit',t.burst===999999?'Unlimited':t.burst]].map(([label,val],j)=>(
                <div key={j} style={{marginBottom:8}}>
                  <label style={{fontSize:10,color:T.textMut,display:'block'}}>{label}</label>
                  <input style={{...ss.input,width:'100%',padding:'4px 8px',fontSize:12}} value={val} readOnly/>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{marginTop:12,display:'flex',gap:8}}>
          <button style={ss.btn(T.gold)}>Save Configuration</button>
          <button style={ss.btnOutline}>Reset to Defaults</button>
        </div>
      </div>
    </div>
  );

  const renderApiDocs=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <input style={ss.input} placeholder="Search API docs..." value={docSearch} onChange={e=>setDocSearch(e.target.value)}/>
        <select style={ss.select} value={docDomain} onChange={e=>setDocDomain(e.target.value)}>
          <option value="All">All Domains</option>{API_DOMAINS.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'Total Endpoints',value:'2,302',color:T.navy},{label:'API Version',value:'v1.47.0',color:T.gold},{label:'Deprecated',value:ENDPOINTS.filter(e=>e.deprecated).length,color:T.red},{label:'SDK Languages',value:3,color:T.sage}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color,fontSize:22}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>OpenAPI Endpoint Explorer</div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Base URL: <span style={ss.mono}>https://api.sustainanalytics.io/api/v1</span> | Port: 8001 | Auth: Bearer Token</div>
        <div style={{maxHeight:500,overflowY:'auto'}}>
          {domainStats.filter(d=>docDomain==='All'||d.domain===docDomain).filter(d=>!docSearch||d.domain.toLowerCase().includes(docSearch.toLowerCase())).map((d,di)=>(
            <div key={di} style={{marginBottom:4}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:expandedDomain===d.domain?T.surfaceH:'transparent',borderRadius:8,cursor:'pointer',border:`1px solid ${expandedDomain===d.domain?T.gold:T.borderL}`}} onClick={()=>setExpandedDomain(expandedDomain===d.domain?null:d.domain)}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:14,fontWeight:700}}>{d.domain}</span>
                  <span style={{...ss.mono,fontSize:11,color:T.textMut}}>{d.count} endpoints</span>
                </div>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <span style={{fontSize:11,color:T.textSec}}>Avg: {d.avgResp}ms</span>
                  <span style={{fontSize:11,color:d.avgError>2?T.red:T.green}}>Err: {d.avgError}%</span>
                  <span style={{fontSize:16}}>{expandedDomain===d.domain?'−':'+'}</span>
                </div>
              </div>
              {expandedDomain===d.domain&&<div style={{padding:'8px 12px',background:T.surfaceH,borderRadius:'0 0 8px 8px',borderTop:'none'}}>
                {ENDPOINTS.filter(e=>e.domain===d.domain).slice(0,15).map((e,ei)=>(
                  <div key={ei} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.borderL}`}}>
                    <span style={ss.badge(e.method)}>{e.method}</span>
                    <span style={{...ss.mono,fontSize:11,flex:1}}>{e.path}</span>
                    <span style={ss.health(e.health)}/>
                    <span style={{...ss.mono,fontSize:10,color:T.textMut}}>{e.avgResponseTime}ms</span>
                  </div>
                ))}
                {ENDPOINTS.filter(e=>e.domain===d.domain).length>15&&<div style={{padding:'6px 0',fontSize:11,color:T.textMut,textAlign:'center'}}>... and {ENDPOINTS.filter(e=>e.domain===d.domain).length-15} more</div>}
              </div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Endpoint Count by Domain</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainStats.slice(0,15).map(d=>({name:d.domain.slice(0,14),count:d.count}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={110}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>API Changelog</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {API_CHANGELOG.map((c,i)=>(
              <div key={i} style={{padding:12,marginBottom:8,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${i===0?T.gold:T.borderL}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{...ss.mono,fontWeight:700,color:T.navy}}>{c.version}</span>
                  <span style={{...ss.mono,fontSize:10,color:T.textMut}}>{c.date}</span>
                </div>
                {c.changes.map((ch,j)=><div key={j} style={{fontSize:11,color:T.textSec,padding:'2px 0'}}>- {ch}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Deprecation Warnings</div>
          {DEPRECATIONS.map((d,i)=>(
            <div key={i} style={{padding:12,marginBottom:8,background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:8}}>
              <div style={{...ss.mono,fontSize:11,color:T.red,fontWeight:700,marginBottom:4}}>{d.endpoint}</div>
              <div style={{fontSize:11,color:T.textSec}}>Replace with: <span style={{...ss.mono,color:T.green}}>{d.replacement}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:10}}>
                <span style={{color:T.amber}}>Deadline: {d.deadline}</span>
                <span style={{color:T.red}}>{d.usage} calls/day still using this</span>
              </div>
            </div>
          ))}
        </div>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>SDK Downloads</div>
          {[{lang:'Python',pkg:'pip install sustainanalytics-sdk',version:'2.4.1',downloads:'12.3K'},
            {lang:'TypeScript',pkg:'npm install @sustainanalytics/sdk',version:'2.4.1',downloads:'8.7K'},
            {lang:'R',pkg:'install.packages("sustainanalytics")',version:'1.2.0',downloads:'3.2K'}].map((sdk,i)=>(
            <div key={i} style={{padding:12,marginBottom:8,background:T.surfaceH,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:13,fontWeight:700}}>{sdk.lang} SDK</div>
                <div style={{...ss.mono,fontSize:10,color:T.textMut,marginTop:2}}>{sdk.pkg}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{...ss.mono,fontSize:11,fontWeight:600}}>v{sdk.version}</div>
                <div style={{fontSize:10,color:T.textSec}}>{sdk.downloads} downloads</div>
              </div>
            </div>
          ))}

          <div style={{marginTop:16,fontSize:14,fontWeight:700,marginBottom:12}}>Webhook Configuration</div>
          <button style={ss.btn(T.gold)} onClick={()=>setShowWebhookConfig(!showWebhookConfig)}>{showWebhookConfig?'Hide Config':'Configure Webhooks'}</button>
          {showWebhookConfig&&<div style={{marginTop:12}}>
            <div style={{marginBottom:8}}>
              <label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>Webhook URL</label>
              <input style={{...ss.input,width:'100%'}} placeholder="https://your-server.com/webhook"/>
            </div>
            <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>Event Types</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {WEBHOOK_EVENTS.map(e=>(
                <label key={e} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,cursor:'pointer',padding:'3px 8px',background:T.surfaceH,borderRadius:4}}>
                  <input type="checkbox" defaultChecked={sr(WEBHOOK_EVENTS.indexOf(e))>0.5}/>{e}
                </label>
              ))}
            </div>
            <button style={{...ss.btn(T.sage),marginTop:12}}>Save Webhook</button>
          </div>}
        </div>
      </div>

      <div style={ss.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700}}>API Key Generator</div>
          <button style={ss.btn(T.gold)} onClick={()=>setShowKeyGen(!showKeyGen)}>{showKeyGen?'Cancel':'Generate New Key'}</button>
        </div>
        {showKeyGen&&<div style={{padding:16,background:T.surfaceH,borderRadius:8}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>Key Name</label>
              <input style={{...ss.input,width:'100%'}} placeholder="My API Key"/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>Expiry</label>
              <select style={{...ss.select,width:'100%'}}>
                <option>30 days</option><option>90 days</option><option>1 year</option><option>No expiry</option>
              </select>
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Scope Selector</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12}}>
            {['read:companies','read:portfolios','read:calculations','write:portfolios','write:calculations','read:reports','export:all','admin:users','admin:config'].map(s=>(
              <label key={s} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,cursor:'pointer'}}>
                <input type="checkbox" defaultChecked={s.startsWith('read')}/>{s}
              </label>
            ))}
          </div>
          <button style={ss.btn(T.navy)}>Generate Key</button>
        </div>}
        {!showKeyGen&&<div style={{fontSize:12,color:T.textSec}}>API keys provide programmatic access to the platform. Each key has configurable scopes and expiry dates. Keys should be rotated regularly and follow the principle of least privilege.</div>}
      </div>
    </div>
  );

  return(
    <div style={ss.wrap}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PLATFORM ADMINISTRATION / API GATEWAY MONITOR</div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>API Gateway Monitor</h1>
        <p style={{margin:'4px 0 0',fontSize:13,color:T.textSec}}>FastAPI backend monitoring -- {ENDPOINTS.length.toLocaleString()} endpoints across {API_DOMAINS.length} domains on port 8001</p>
      </div>
      <div style={ss.tabBar}>{TABS.map((t,i)=><button key={i} style={ss.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
      {tab===0&&renderEndpointRegistry()}
      {tab===1&&renderTrafficDashboard()}
      {tab===2&&renderRateLimiting()}
      {tab===3&&renderApiDocs()}
    </div>
  );
}