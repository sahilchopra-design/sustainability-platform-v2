import React,{useState,useMemo,useCallback,useEffect,useRef} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TYPES=['Environmental spill','Governance fraud','Social labour','Data privacy','Supply chain','Greenwashing','Tax evasion','Product safety'];
const SECTORS=['Energy','Automotive','Technology','Finance','Mining','Pharmaceuticals','Consumer','Industrials','Telecom','Utilities','Chemicals','Real Estate'];
const PROVIDERS=['MSCI','Sustainalytics','S&P Global','ISS ESG','CDP','Refinitiv'];
const GEOS=['North America','Europe','Asia-Pacific','Latin America','Middle East & Africa','Global'];
const PILLARS=['Environmental','Social','Governance'];
const SEV_COLORS={1:T.green,2:'#65a30d',3:T.amber,4:'#ea580c',5:T.red};
const TYPE_COLORS={'Environmental spill':'#0ea5e9','Governance fraud':'#8b5cf6','Social labour':'#f59e0b','Data privacy':'#ef4444','Supply chain':'#10b981','Greenwashing':'#84cc16','Tax evasion':'#6366f1','Product safety':'#f97316'};

const COMPANIES=[
  'BP','Volkswagen','Meta','Wells Fargo','Vale','Wirecard','Boohoo','ExxonMobil','Equifax','Bayer',
  'Rio Tinto','H&M','Samsung','Toshiba','DWS Group','Nestle','Shell','Credit Suisse','Boeing','Johnson & Johnson',
  'Glencore','Adani','Amazon','Tesla','HSBC','Barclays','TotalEnergies','Chevron','Nike','Uber',
  'Goldman Sachs','JPMorgan','BHP','Anglo American','Novartis','Roche','Siemens','Deutsche Bank','Alibaba','Tencent',
  'Stellantis','Toyota','Renault','BASF','Dow Chemical','3M','Philips','AstraZeneca','Pfizer','Unilever',
  'Danone','Carrefour','Zara/Inditex','PG&E','Duke Energy','AT&T','Verizon','Barrick Gold','Freeport-McMoRan','ArcelorMittal'
];

const CONTROVERSY_DATA=Array.from({length:90},(_, i)=>{
  const s=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);const s4=sr(i*23+17);const s5=sr(i*31+5);
  const company=COMPANIES[Math.floor(s*COMPANIES.length)%COMPANIES.length];
  const type=TYPES[Math.floor(s2*TYPES.length)%TYPES.length];
  const sector=SECTORS[Math.floor(s3*SECTORS.length)%SECTORS.length];
  const sev=Math.min(5,Math.max(1,Math.floor(s4*5)+1));
  const subLevel=Math.floor(s5*10)/10;
  const geo=GEOS[Math.floor(sr(i*37+2)*GEOS.length)%GEOS.length];
  const year=2015+Math.floor(sr(i*41+9)*10);
  const month=Math.min(12,Math.max(1,Math.floor(sr(i*43+13)*12)+1));
  const day=Math.min(28,Math.max(1,Math.floor(sr(i*47+19)*28)+1));
  const pillar=PILLARS[Math.floor(sr(i*53+23)*3)%3];
  const descriptions=[
    `Major ${type.toLowerCase()} incident affecting operations in ${geo}`,
    `${company} faces regulatory scrutiny over ${type.toLowerCase()} allegations`,
    `Whistleblower reveals systematic ${type.toLowerCase()} practices at ${company}`,
    `${geo} regulators launch investigation into ${company} ${type.toLowerCase()}`,
    `Class-action lawsuit filed against ${company} for ${type.toLowerCase()}`,
    `${company} ${type.toLowerCase()} scandal impacts ${sector.toLowerCase()} sector confidence`,
    `NGO report exposes ${company} involvement in ${type.toLowerCase()}`,
    `${company} executives charged in connection with ${type.toLowerCase()} cover-up`,
    `Investor coalition demands ${company} accountability for ${type.toLowerCase()}`,
    `Media investigation uncovers ${company} ${type.toLowerCase()} spanning multiple years`
  ];
  const desc=descriptions[Math.floor(sr(i*59+29)*descriptions.length)%descriptions.length];
  const ratings=PROVIDERS.map((p,pi)=>{
    const base=50+Math.floor(sr(i*61+pi*7)*40);
    return Array.from({length:12},(_, q)=>{
      const qSeed=sr(i*67+pi*11+q*3);
      const impact=q<3?-(sev*(2+qSeed*3)):q<6?-(sev*(1+qSeed*2)*(1-q/12)):-(sev*qSeed*(1-q/10));
      return Math.max(0,Math.min(100,Math.round(base+impact)));
    });
  });
  const preRatings=PROVIDERS.map((p,pi)=>50+Math.floor(sr(i*71+pi*13)*40));
  const detectQ=PROVIDERS.map((p,pi)=>Math.max(0,Math.floor(sr(i*73+pi*17)*4)));
  const recoverQ=PROVIDERS.map((p,pi)=>Math.max(1,Math.floor(sr(i*79+pi*19)*12)));
  return {id:i,company,event:desc,type,sector,severity:sev,subLevel,date:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,geo,pillar,ratings,preRatings,detectQ,recoverQ,investigated:false,notes:''};
});

const REAL_EVENTS=[
  {id:0,company:'BP',event:'Deepwater Horizon oil spill in Gulf of Mexico causing massive ecological damage',type:'Environmental spill',sector:'Energy',severity:5,subLevel:0.9,date:'2010-04-20',geo:'North America',pillar:'Environmental'},
  {id:1,company:'Volkswagen',event:'Dieselgate emissions cheating scandal affecting 11 million vehicles globally',type:'Governance fraud',sector:'Automotive',severity:5,subLevel:0.8,date:'2015-09-18',geo:'Europe',pillar:'Governance'},
  {id:2,company:'Meta',event:'Cambridge Analytica data breach exposing 87 million user profiles',type:'Data privacy',sector:'Technology',severity:5,subLevel:0.7,date:'2018-03-17',geo:'North America',pillar:'Social'},
  {id:3,company:'Wells Fargo',event:'3.5 million unauthorized fake accounts created by employees',type:'Governance fraud',sector:'Finance',severity:5,subLevel:0.6,date:'2016-09-08',geo:'North America',pillar:'Governance'},
  {id:4,company:'Vale',event:'Brumadinho tailings dam collapse killing 270 people in Brazil',type:'Environmental spill',sector:'Mining',severity:5,subLevel:0.9,date:'2019-01-25',geo:'Latin America',pillar:'Environmental'},
  {id:5,company:'Wirecard',event:'EUR 1.9 billion accounting fraud leading to company insolvency',type:'Governance fraud',sector:'Finance',severity:5,subLevel:0.8,date:'2020-06-18',geo:'Europe',pillar:'Governance'},
  {id:6,company:'Boohoo',event:'Leicester sweatshop labour exploitation paying workers GBP 3.50/hour',type:'Social labour',sector:'Consumer',severity:4,subLevel:0.5,date:'2020-07-05',geo:'Europe',pillar:'Social'},
  {id:7,company:'ExxonMobil',event:'Decades-long climate change misinformation campaign exposed by internal documents',type:'Greenwashing',sector:'Energy',severity:4,subLevel:0.7,date:'2015-11-05',geo:'North America',pillar:'Environmental'},
  {id:8,company:'Equifax',event:'Data breach exposing personal data of 147 million consumers',type:'Data privacy',sector:'Technology',severity:5,subLevel:0.6,date:'2017-09-07',geo:'North America',pillar:'Social'},
  {id:9,company:'Bayer',event:'Roundup glyphosate herbicide linked to cancer in landmark court ruling',type:'Product safety',sector:'Pharmaceuticals',severity:4,subLevel:0.8,date:'2018-08-10',geo:'North America',pillar:'Social'},
  {id:10,company:'Rio Tinto',event:'Destruction of 46,000-year-old Juukan Gorge Aboriginal heritage caves',type:'Social labour',sector:'Mining',severity:4,subLevel:0.6,date:'2020-05-24',geo:'Asia-Pacific',pillar:'Social'},
  {id:11,company:'H&M',event:'Xinjiang forced labour cotton sourcing controversy and China boycott',type:'Supply chain',sector:'Consumer',severity:4,subLevel:0.4,date:'2021-03-24',geo:'Asia-Pacific',pillar:'Social'},
  {id:12,company:'Samsung',event:'Vice chairman Lee Jae-yong bribery and corruption conviction',type:'Governance fraud',sector:'Technology',severity:4,subLevel:0.5,date:'2017-02-17',geo:'Asia-Pacific',pillar:'Governance'},
  {id:13,company:'Toshiba',event:'USD 1.2 billion accounting fraud overstating profits over seven years',type:'Governance fraud',sector:'Technology',severity:5,subLevel:0.4,date:'2015-07-21',geo:'Asia-Pacific',pillar:'Governance'},
  {id:14,company:'DWS Group',event:'Deutsche Bank subsidiary overstated ESG fund credentials to investors',type:'Greenwashing',sector:'Finance',severity:3,subLevel:0.6,date:'2021-08-01',geo:'Europe',pillar:'Governance'},
  {id:15,company:'Nestle',event:'Child labour documented in West African cocoa supply chain',type:'Supply chain',sector:'Consumer',severity:4,subLevel:0.3,date:'2019-04-15',geo:'Global',pillar:'Social'},
  {id:16,company:'Shell',event:'Nigerian oil spill devastation and community displacement in Ogoniland',type:'Environmental spill',sector:'Energy',severity:5,subLevel:0.5,date:'2015-01-08',geo:'Middle East & Africa',pillar:'Environmental'},
  {id:17,company:'Credit Suisse',event:'Archegos Capital collapse causing USD 5.5 billion in losses',type:'Governance fraud',sector:'Finance',severity:5,subLevel:0.7,date:'2021-03-29',geo:'Europe',pillar:'Governance'},
  {id:18,company:'Boeing',event:'737 MAX crashes killing 346 people due to MCAS design flaws',type:'Product safety',sector:'Industrials',severity:5,subLevel:0.9,date:'2019-03-10',geo:'Global',pillar:'Social'},
  {id:19,company:'Johnson & Johnson',event:'Talcum powder asbestos contamination linked to ovarian cancer',type:'Product safety',sector:'Pharmaceuticals',severity:5,subLevel:0.7,date:'2018-07-12',geo:'North America',pillar:'Social'},
  {id:20,company:'Glencore',event:'USD 1.1 billion settlement for bribery across seven countries',type:'Tax evasion',sector:'Mining',severity:5,subLevel:0.6,date:'2022-05-24',geo:'Global',pillar:'Governance'},
  {id:21,company:'Adani',event:'Hindenburg Research fraud report alleging decades of stock manipulation',type:'Governance fraud',sector:'Energy',severity:5,subLevel:0.8,date:'2023-01-24',geo:'Asia-Pacific',pillar:'Governance'},
  {id:22,company:'Amazon',event:'Warehouse worker safety failures and anti-union retaliation',type:'Social labour',sector:'Technology',severity:3,subLevel:0.5,date:'2021-04-09',geo:'North America',pillar:'Social'},
  {id:23,company:'Tesla',event:'Racial discrimination and hostile work environment at Fremont factory',type:'Social labour',sector:'Automotive',severity:3,subLevel:0.7,date:'2022-02-10',geo:'North America',pillar:'Social'},
  {id:24,company:'HSBC',event:'Money laundering for drug cartels resulting in USD 1.9 billion fine',type:'Tax evasion',sector:'Finance',severity:5,subLevel:0.5,date:'2017-12-11',geo:'Global',pillar:'Governance'},
  {id:25,company:'Barclays',event:'LIBOR rate-rigging scandal with GBP 290 million fine',type:'Governance fraud',sector:'Finance',severity:4,subLevel:0.6,date:'2015-05-20',geo:'Europe',pillar:'Governance'},
  {id:26,company:'TotalEnergies',event:'Mozambique LNG project linked to human rights violations',type:'Social labour',sector:'Energy',severity:4,subLevel:0.4,date:'2021-06-28',geo:'Middle East & Africa',pillar:'Social'},
  {id:27,company:'Chevron',event:'Ecuador Lago Agrio oil contamination affecting indigenous communities',type:'Environmental spill',sector:'Energy',severity:4,subLevel:0.8,date:'2016-08-12',geo:'Latin America',pillar:'Environmental'},
  {id:28,company:'Nike',event:'Vietnam and Indonesia factory worker exploitation exposé',type:'Supply chain',sector:'Consumer',severity:3,subLevel:0.5,date:'2017-06-22',geo:'Asia-Pacific',pillar:'Social'},
  {id:29,company:'Uber',event:'Systematic sexual harassment cover-up and toxic corporate culture',type:'Social labour',sector:'Technology',severity:4,subLevel:0.6,date:'2017-02-19',geo:'North America',pillar:'Governance'},
];

const ALL_EVENTS=useMemoInit();
function useMemoInit(){
  const combined=[...REAL_EVENTS];
  for(let i=30;i<90;i++){
    const gen=CONTROVERSY_DATA[i];
    gen.ratings=PROVIDERS.map((p,pi)=>{
      const base=50+Math.floor(sr(i*61+pi*7)*40);
      return Array.from({length:12},(_,q)=>{
        const qSeed=sr(i*67+pi*11+q*3);
        const impact=q<3?-(gen.severity*(2+qSeed*3)):q<6?-(gen.severity*(1+qSeed*2)*(1-q/12)):-(gen.severity*qSeed*(1-q/10));
        return Math.max(0,Math.min(100,Math.round(base+impact)));
      });
    });
    gen.preRatings=PROVIDERS.map((p,pi)=>50+Math.floor(sr(i*71+pi*13)*40));
    gen.detectQ=PROVIDERS.map((p,pi)=>Math.max(0,Math.floor(sr(i*73+pi*17)*4)));
    gen.recoverQ=PROVIDERS.map((p,pi)=>Math.max(1,Math.floor(sr(i*79+pi*19)*12)));
    gen.investigated=false;gen.notes='';
    combined.push(gen);
  }
  for(let i=0;i<30;i++){
    combined[i].ratings=PROVIDERS.map((p,pi)=>{
      const base=55+Math.floor(sr(i*61+pi*7)*35);
      return Array.from({length:12},(_,q)=>{
        const qSeed=sr(i*67+pi*11+q*3);
        const sev=combined[i].severity;
        const impact=q<3?-(sev*(2.5+qSeed*3.5)):q<6?-(sev*(1.2+qSeed*2.2)*(1-q/12)):-(sev*qSeed*0.8*(1-q/10));
        return Math.max(0,Math.min(100,Math.round(base+impact)));
      });
    });
    combined[i].preRatings=PROVIDERS.map((p,pi)=>55+Math.floor(sr(i*71+pi*13)*35));
    combined[i].detectQ=PROVIDERS.map((p,pi)=>Math.max(0,Math.floor(sr(i*73+pi*17)*3)));
    combined[i].recoverQ=PROVIDERS.map((p,pi)=>Math.max(1,Math.floor(sr(i*79+pi*19)*10)));
    combined[i].investigated=false;combined[i].notes='';
  }
  return combined;
}

/* ── Shared Components ── */
const Pill=({label,color})=><span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font,whiteSpace:'nowrap'}}>{label}</span>;
const SevBadge=({sev,sub})=><span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:12,fontSize:12,fontWeight:700,background:SEV_COLORS[sev]+'20',color:SEV_COLORS[sev],fontFamily:T.mono}}>{sev}{sub!==undefined&&<span style={{fontSize:10,opacity:.7}}>.{Math.floor(sub*10)}</span>}</span>;
const Btn=({children,active,onClick,style:s,...props})=><button onClick={onClick} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:T.surface,color:active?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,transition:'all .15s',...s}} {...props}>{children}</button>;
const StatCard=({label,value,sub,color})=><div style={{flex:1,minWidth:140,background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'14px 16px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>;

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 14px',boxShadow:'0 4px 12px rgba(0,0,0,.08)',fontFamily:T.font}}>
    <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{fontSize:11,color:p.color||T.textSec,marginTop:2}}>{p.name}: <b>{typeof p.value==='number'?p.value.toFixed(1):p.value}</b></div>)}
  </div>;
};

/* ── Tab 1: Controversy Feed ── */
function ControversyFeed({events,setEvents}){
  const [sevRange,setSevRange]=useState([1,5]);
  const [typeFilter,setTypeFilter]=useState(new Set(TYPES));
  const [sectorFilter,setSectorFilter]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [dateFrom,setDateFrom]=useState('');
  const [dateTo,setDateTo]=useState('');
  const [page,setPage]=useState(0);
  const [selectedId,setSelectedId]=useState(null);
  const [viewMode,setViewMode]=useState('cards');
  const [selected,setSelected]=useState(new Set());
  const PER_PAGE=15;

  const filtered=useMemo(()=>{
    return events.filter(e=>{
      if(e.severity<sevRange[0]||e.severity>sevRange[1])return false;
      if(!typeFilter.has(e.type))return false;
      if(sectorFilter!=='All'&&e.sector!==sectorFilter)return false;
      if(searchTerm&&!e.company.toLowerCase().includes(searchTerm.toLowerCase())&&!e.event.toLowerCase().includes(searchTerm.toLowerCase()))return false;
      if(dateFrom&&e.date<dateFrom)return false;
      if(dateTo&&e.date>dateTo)return false;
      return true;
    }).sort((a,b)=>b.date.localeCompare(a.date));
  },[events,sevRange,typeFilter,sectorFilter,searchTerm,dateFrom,dateTo]);

  const pageEvents=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const totalPages=Math.ceil(filtered.length/PER_PAGE);
  const selectedEvent=events.find(e=>e.id===selectedId);

  const avgSev=filtered.length?(filtered.reduce((a,e)=>a+e.severity,0)/filtered.length).toFixed(1):0;
  const sectorCounts={};filtered.forEach(e=>{sectorCounts[e.sector]=(sectorCounts[e.sector]||0)+1;});
  const topSector=Object.entries(sectorCounts).sort((a,b)=>b[1]-a[1])[0];
  const fastestProvider=PROVIDERS.reduce((best,p,pi)=>{
    const avgDetect=filtered.reduce((a,e)=>a+e.detectQ[pi],0)/(filtered.length||1);
    return avgDetect<best.v?{name:p,v:avgDetect}:best;
  },{name:'',v:99});

  const toggleType=(t)=>{const n=new Set(typeFilter);n.has(t)?n.delete(t):n.add(t);setTypeFilter(n);setPage(0);};
  const toggleSelect=(id)=>{const n=new Set(selected);n.has(id)?n.delete(id):n.add(id);setSelected(n);};
  const toggleInvestigated=(id)=>{setEvents(prev=>prev.map(e=>e.id===id?{...e,investigated:!e.investigated}:e));};
  const setNotes=(id,notes)=>{setEvents(prev=>prev.map(e=>e.id===id?{...e,notes}:e));};

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Filter Bar */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'flex-end'}}>
        <div style={{minWidth:180}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Severity Range</div>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            <select value={sevRange[0]} onChange={e=>{setSevRange([+e.target.value,sevRange[1]]);setPage(0);}} style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
              {[1,2,3,4,5].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <span style={{fontSize:11,color:T.textMut}}>to</span>
            <select value={sevRange[1]} onChange={e=>{setSevRange([sevRange[0],+e.target.value]);setPage(0);}} style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
              {[1,2,3,4,5].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={{minWidth:200}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Sector</div>
          <select value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPage(0);}} style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,width:'100%'}}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{minWidth:160}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Date From</div>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(0);}} style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
        </div>
        <div style={{minWidth:160}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Date To</div>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(0);}} style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
        </div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Search Company / Event</div>
          <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search..." style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,width:'100%'}}/>
        </div>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
        {TYPES.map(t=><Btn key={t} active={typeFilter.has(t)} onClick={()=>toggleType(t)} style={{padding:'3px 10px',fontSize:11}}>{t}</Btn>)}
      </div>
    </div>

    {/* Live Stats */}
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
      <StatCard label="Total Events" value={filtered.length} sub={`of ${events.length} total`}/>
      <StatCard label="Avg Severity" value={avgSev} color={avgSev>=4?T.red:avgSev>=3?T.amber:T.green}/>
      <StatCard label="Most Affected Sector" value={topSector?topSector[0]:'--'} sub={topSector?`${topSector[1]} events`:''}/>
      <StatCard label="Fastest Responder" value={fastestProvider.name||'--'} sub={`${fastestProvider.v.toFixed(1)}Q avg detect`} color={T.sage}/>
    </div>

    {/* View Toggle & Bulk Actions */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',gap:6}}>
        <Btn active={viewMode==='cards'} onClick={()=>setViewMode('cards')}>Card View</Btn>
        <Btn active={viewMode==='timeline'} onClick={()=>setViewMode('timeline')}>Timeline View</Btn>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        {selected.size>0&&<>
          <span style={{fontSize:12,color:T.textSec}}>{selected.size} selected</span>
          <Btn onClick={()=>setSelected(new Set())} style={{background:T.surfaceH}}>Clear</Btn>
          <Btn style={{background:T.navy,color:'#fff',border:'none'}}>Export Selected</Btn>
          <Btn style={{background:T.gold,color:'#fff',border:'none'}}>Generate Report</Btn>
        </>}
      </div>
    </div>

    {/* Event Cards / Timeline */}
    {viewMode==='cards'?(
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340,1fr))',gap:12}}>
        {pageEvents.map(e=>(
          <div key={e.id} onClick={()=>setSelectedId(e.id)} style={{background:T.surface,borderRadius:12,border:`1px solid ${selectedId===e.id?T.navy:T.border}`,padding:14,cursor:'pointer',transition:'all .15s',position:'relative'}}>
            <input type="checkbox" checked={selected.has(e.id)} onChange={ev=>{ev.stopPropagation();toggleSelect(e.id);}} onClick={ev=>ev.stopPropagation()} style={{position:'absolute',top:12,right:12}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <span style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.font}}>{e.company}</span>
              <SevBadge sev={e.severity} sub={e.subLevel}/>
            </div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:8,lineHeight:1.4}}>{e.event}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
              <Pill label={e.type} color={TYPE_COLORS[e.type]||T.navy}/>
              <Pill label={e.pillar} color={e.pillar==='Environmental'?'#0ea5e9':e.pillar==='Social'?'#f59e0b':'#8b5cf6'}/>
              <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{e.date}</span>
            </div>
            {e.investigated&&<div style={{marginTop:6,fontSize:10,color:T.sage,fontWeight:600}}>INVESTIGATED</div>}
          </div>
        ))}
      </div>
    ):(
      <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
        <div style={{position:'relative',paddingLeft:24}}>
          <div style={{position:'absolute',left:8,top:0,bottom:0,width:2,background:T.border}}/>
          {pageEvents.map(e=>(
            <div key={e.id} onClick={()=>setSelectedId(e.id)} style={{position:'relative',paddingLeft:20,paddingBottom:16,cursor:'pointer'}}>
              <div style={{position:'absolute',left:-4,top:4,width:12,height:12,borderRadius:'50%',background:SEV_COLORS[e.severity],border:`2px solid ${T.surface}`}}/>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{e.company}</span>
                <SevBadge sev={e.severity} sub={e.subLevel}/>
                <Pill label={e.type} color={TYPE_COLORS[e.type]||T.navy}/>
                <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{e.date}</span>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{e.event}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Pagination */}
    <div style={{display:'flex',justifyContent:'center',gap:6,alignItems:'center'}}>
      <Btn onClick={()=>setPage(Math.max(0,page-1))} style={{opacity:page===0?.4:1}}>Prev</Btn>
      <span style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Page {page+1} of {totalPages||1}</span>
      <Btn onClick={()=>setPage(Math.min(totalPages-1,page+1))} style={{opacity:page>=totalPages-1?.4:1}}>Next</Btn>
    </div>

    {/* Slide-Out Detail Panel */}
    {selectedEvent&&<div style={{position:'fixed',top:0,right:0,width:520,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-8px 0 32px rgba(0,0,0,.1)',zIndex:1000,overflowY:'auto',padding:24,fontFamily:T.font}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontSize:18,fontWeight:700,color:T.navy}}>{selectedEvent.company}</span>
        <button onClick={()=>setSelectedId(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
      </div>
      <div style={{fontSize:13,color:T.textSec,marginBottom:12,lineHeight:1.5}}>{selectedEvent.event}</div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <SevBadge sev={selectedEvent.severity} sub={selectedEvent.subLevel}/>
        <Pill label={selectedEvent.type} color={TYPE_COLORS[selectedEvent.type]||T.navy}/>
        <Pill label={selectedEvent.pillar} color={selectedEvent.pillar==='Environmental'?'#0ea5e9':selectedEvent.pillar==='Social'?'#f59e0b':'#8b5cf6'}/>
        <Pill label={selectedEvent.geo} color={T.navyL}/>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,alignSelf:'center'}}>{selectedEvent.date}</span>
      </div>

      {/* Pre/Post Ratings Bar Chart */}
      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Pre vs Post-Event Ratings</div>
      <div style={{height:200,marginBottom:16}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PROVIDERS.map((p,i)=>({name:p,pre:selectedEvent.preRatings[i],post:selectedEvent.ratings[i][3]}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="pre" fill={T.sage} name="Pre-Event" radius={[4,4,0,0]}/>
            <Bar dataKey="post" fill={T.red} name="Post-Event (+3Q)" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detection & Recovery */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div style={{background:T.bg,borderRadius:8,padding:12}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Quarters to Detect</div>
          {PROVIDERS.map((p,i)=><div key={p} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:2}}>
            <span style={{color:T.textSec}}>{p}</span>
            <span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{selectedEvent.detectQ[i]}Q</span>
          </div>)}
        </div>
        <div style={{background:T.bg,borderRadius:8,padding:12}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Quarters to Recover</div>
          {PROVIDERS.map((p,i)=><div key={p} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:2}}>
            <span style={{color:T.textSec}}>{p}</span>
            <span style={{fontWeight:600,color:selectedEvent.recoverQ[i]>8?T.red:T.navy,fontFamily:T.mono}}>{selectedEvent.recoverQ[i]}Q</span>
          </div>)}
        </div>
      </div>

      {/* Peer Impact */}
      <div style={{background:T.bg,borderRadius:8,padding:12,marginBottom:16}}>
        <div style={{fontSize:11,color:T.textMut,marginBottom:6}}>Peer Impact (same sector/type)</div>
        {events.filter(e=>e.id!==selectedEvent.id&&e.sector===selectedEvent.sector&&e.type===selectedEvent.type).slice(0,5).map(peer=>(
          <div key={peer.id} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:3}}>
            <span style={{color:T.textSec}}>{peer.company}</span>
            <span style={{fontWeight:600,color:T.navy}}>{peer.severity>=4?'Also downgraded':'Minimal impact'}</span>
          </div>
        ))}
        {events.filter(e=>e.id!==selectedEvent.id&&e.sector===selectedEvent.sector&&e.type===selectedEvent.type).length===0&&
          <div style={{fontSize:11,color:T.textMut}}>No peer events in this sector/type combination</div>}
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <Btn active={selectedEvent.investigated} onClick={()=>toggleInvestigated(selectedEvent.id)}>
          {selectedEvent.investigated?'Investigated':'Mark Investigated'}
        </Btn>
      </div>
      <div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Notes</div>
        <textarea value={selectedEvent.notes} onChange={e=>setNotes(selectedEvent.id,e.target.value)} rows={4} placeholder="Add investigation notes..." style={{width:'100%',padding:10,borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,resize:'vertical'}}/>
      </div>
    </div>}
  </div>;
}

/* ── Tab 2: Impact Propagation ── */
function ImpactPropagation({events}){
  const [selectedEventId,setSelectedEventId]=useState(0);
  const [highlightedScatter,setHighlightedScatter]=useState(null);
  const ev=events[selectedEventId]||events[0];

  const grouped=useMemo(()=>{
    const g={};events.forEach(e=>{if(!g[e.company])g[e.company]=[];g[e.company].push(e);});return g;
  },[events]);

  const lineData=useMemo(()=>{
    return Array.from({length:12},(_,q)=>{
      const d={quarter:`Q${q<6?'-'+(6-q):'+'+(q-5)}`};
      PROVIDERS.forEach((p,pi)=>{d[p]=ev.ratings[pi][q];});
      return d;
    });
  },[ev]);

  const waterfallData=useMemo(()=>{
    const stages=['Pre','Event','+1Q','+2Q','+3Q','+6Q','Current'];
    const qIndices=[0,2,3,4,5,8,11];
    return stages.map((stage,si)=>({
      stage,
      ...Object.fromEntries(PROVIDERS.map((p,pi)=>[p,ev.ratings[pi][qIndices[si]]]))
    }));
  },[ev]);

  const radarData=useMemo(()=>{
    return PILLARS.map(pillar=>{
      const row={pillar};
      PROVIDERS.forEach((p,pi)=>{
        const relevance=ev.pillar===pillar?ev.preRatings[pi]-ev.ratings[pi][3]:Math.floor(sr(ev.id*97+pi*7)*5);
        row[p]=Math.max(0,relevance);
      });
      return row;
    });
  },[ev]);

  const scatterData=useMemo(()=>{
    return events.map(e=>{
      const avgImpact=PROVIDERS.reduce((sum,_,pi)=>sum+(e.preRatings[pi]-e.ratings[pi][3]),0)/PROVIDERS.length;
      return {id:e.id,severity:e.severity+e.subLevel,impact:Math.max(0,avgImpact),type:e.type,company:e.company};
    });
  },[events]);

  const betaData=useMemo(()=>{
    return PROVIDERS.map((p,pi)=>{
      const points=events.map(e=>({x:e.severity,y:e.preRatings[pi]-e.ratings[pi][3]}));
      const n=points.length;const sumX=points.reduce((a,pt)=>a+pt.x,0);const sumY=points.reduce((a,pt)=>a+pt.y,0);
      const sumXY=points.reduce((a,pt)=>a+pt.x*pt.y,0);const sumX2=points.reduce((a,pt)=>a+pt.x*pt.x,0);
      const beta=(n*sumXY-sumX*sumY)/(n*sumX2-sumX*sumX||1);
      const residuals=points.map(pt=>pt.y-(beta*pt.x));
      const stdErr=Math.sqrt(residuals.reduce((a,r)=>a+r*r,0)/(n-2||1))/Math.sqrt(sumX2-sumX*sumX/n||1);
      return {provider:p,beta:beta.toFixed(2),ci95Low:(beta-1.96*stdErr).toFixed(2),ci95High:(beta+1.96*stdErr).toFixed(2),stdErr:stdErr.toFixed(3)};
    });
  },[events]);

  const PROV_COLORS=['#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#6366f1'];

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Event Selector */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Select Event (grouped by company)</div>
      <select value={selectedEventId} onChange={e=>setSelectedEventId(+e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
        {Object.entries(grouped).map(([co,evts])=>(
          <optgroup key={co} label={co}>
            {evts.map(e=><option key={e.id} value={e.id}>{e.date} - {e.type} (Sev {e.severity})</option>)}
          </optgroup>
        ))}
      </select>
    </div>

    {/* Multi-Line Rating Trajectory */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Provider Rating Trajectory</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Normalized ratings over 12 quarters centered on event: {ev.company} - {ev.type}</div>
      <div style={{height:280}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {PROVIDERS.map((p,i)=><Line key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[i]} strokeWidth={2} dot={{r:3}} name={p}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Waterfall Chart */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Impact Waterfall</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Rating progression: Pre-event through recovery stages</div>
      <div style={{height:260}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {PROVIDERS.map((p,i)=><Bar key={p} dataKey={p} fill={PROV_COLORS[i]} radius={[3,3,0,0]} name={p}/>)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Impact Fingerprint Radar (rendered as grouped bar) */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Impact Fingerprint by ESG Pillar</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Rating impact per provider across E, S, G pillars</div>
      <div style={{height:220}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={radarData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="pillar" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {PROVIDERS.map((p,i)=><Bar key={p} dataKey={p} fill={PROV_COLORS[i]} radius={[3,3,0,0]} name={p}/>)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Severity vs Impact Scatter */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Severity vs Rating Impact (All Events)</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Click any point to view event details. Color = controversy type</div>
      <div style={{height:300}}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="severity" name="Severity" tick={{fontSize:10,fill:T.textSec}} domain={[0.5,6]} label={{value:'Severity',position:'bottom',fontSize:10}}/>
            <YAxis dataKey="impact" name="Avg Rating Drop" tick={{fontSize:10,fill:T.textMut}} label={{value:'Avg Rating Drop',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip content={({active,payload})=>{
              if(!active||!payload?.length)return null;
              const d=payload[0].payload;
              return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 14px',boxShadow:'0 4px 12px rgba(0,0,0,.08)',fontFamily:T.font}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{d.company}</div>
                <div style={{fontSize:11,color:T.textSec}}>Type: {d.type}</div>
                <div style={{fontSize:11,color:T.textSec}}>Severity: {d.severity.toFixed(1)}</div>
                <div style={{fontSize:11,color:T.textSec}}>Avg Impact: {d.impact.toFixed(1)} pts</div>
              </div>;
            }}/>
            <Scatter data={scatterData} onClick={(d)=>{if(d&&d.id!==undefined){setSelectedEventId(d.id);setHighlightedScatter(d.id);}}}>
              {scatterData.map((entry,idx)=><Cell key={idx} fill={TYPE_COLORS[entry.type]||T.navy} opacity={highlightedScatter===entry.id?1:0.7} r={highlightedScatter===entry.id?8:5}/>)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {highlightedScatter!==null&&<div style={{marginTop:8,padding:10,background:T.bg,borderRadius:8,fontSize:12}}>
        <span style={{fontWeight:600,color:T.navy}}>Selected: </span>
        <span style={{color:T.textSec}}>{events[highlightedScatter]?.company} - {events[highlightedScatter]?.event}</span>
      </div>}
    </div>

    {/* Controversy Beta */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Controversy Beta per Provider</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Sensitivity coefficient: rating drop per unit severity increase, with 95% CI</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            <th style={{textAlign:'left',padding:'8px 12px',color:T.textMut,fontWeight:600}}>Provider</th>
            <th style={{textAlign:'right',padding:'8px 12px',color:T.textMut,fontWeight:600}}>Beta</th>
            <th style={{textAlign:'right',padding:'8px 12px',color:T.textMut,fontWeight:600}}>95% CI Low</th>
            <th style={{textAlign:'right',padding:'8px 12px',color:T.textMut,fontWeight:600}}>95% CI High</th>
            <th style={{textAlign:'right',padding:'8px 12px',color:T.textMut,fontWeight:600}}>Std Error</th>
          </tr></thead>
          <tbody>{betaData.map((r,i)=><tr key={r.provider} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?T.surface:T.bg}}>
            <td style={{padding:'8px 12px',fontWeight:600,color:PROV_COLORS[i]}}>{r.provider}</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{r.beta}</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontFamily:T.mono,color:T.textSec}}>{r.ci95Low}</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontFamily:T.mono,color:T.textSec}}>{r.ci95High}</td>
            <td style={{padding:'8px 12px',textAlign:'right',fontFamily:T.mono,color:T.textMut}}>{r.stdErr}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

/* ── Tab 3: Recovery Analytics ── */
function RecoveryAnalytics({events}){
  const [sevFilter,setSevFilter]=useState(0);
  const filtered=useMemo(()=>sevFilter===0?events:events.filter(e=>e.severity===sevFilter),[events,sevFilter]);

  const recoveryCurveData=useMemo(()=>{
    return Array.from({length:12},(_,q)=>{
      const row={quarter:`Q${q+1}`};
      PROVIDERS.forEach((p,pi)=>{
        const vals=filtered.map(e=>e.ratings[pi][q]-e.ratings[pi][0]);
        const mean=vals.length?vals.reduce((a,v)=>a+v,0)/vals.length:0;
        const std=vals.length>1?Math.sqrt(vals.reduce((a,v)=>a+(v-mean)**2,0)/(vals.length-1)):0;
        row[p]=parseFloat(mean.toFixed(1));
        row[p+'_upper']=parseFloat((mean+std).toFixed(1));
        row[p+'_lower']=parseFloat((mean-std).toFixed(1));
      });
      const allVals=filtered.flatMap(e=>PROVIDERS.map((_,pi)=>e.ratings[pi][q]-e.ratings[pi][0]));
      const avgAll=allVals.length?allVals.reduce((a,v)=>a+v,0)/allVals.length:0;
      const stdAll=allVals.length>1?Math.sqrt(allVals.reduce((a,v)=>a+(v-avgAll)**2,0)/(allVals.length-1)):0;
      row.avg=parseFloat(avgAll.toFixed(1));
      row.upper=parseFloat((avgAll+stdAll).toFixed(1));
      row.lower=parseFloat((avgAll-stdAll).toFixed(1));
      return row;
    });
  },[filtered]);

  const recoveryDistData=useMemo(()=>{
    const buckets={'1-2Q':0,'3-4Q':0,'5-6Q':0,'7-8Q':0,'9-10Q':0,'11-12Q':0,'Never':0};
    filtered.forEach(e=>{
      const avgRec=e.recoverQ.length?e.recoverQ.reduce((a,v)=>a+v,0)/e.recoverQ.length:0;
      if(avgRec<=2)buckets['1-2Q']++;
      else if(avgRec<=4)buckets['3-4Q']++;
      else if(avgRec<=6)buckets['5-6Q']++;
      else if(avgRec<=8)buckets['7-8Q']++;
      else if(avgRec<=10)buckets['9-10Q']++;
      else if(avgRec<=12)buckets['11-12Q']++;
      else buckets['Never']++;
    });
    return Object.entries(buckets).map(([bucket,count])=>({bucket,count}));
  },[filtered]);

  const neverRecovered=useMemo(()=>{
    return filtered.filter(e=>{
      const lastQ=PROVIDERS.map((_,pi)=>e.ratings[pi][11]);
      const preAvg=e.preRatings.length?e.preRatings.reduce((a,v)=>a+v,0)/e.preRatings.length:0;
      const lastAvg=lastQ.length?lastQ.reduce((a,v)=>a+v,0)/lastQ.length:0;
      return lastAvg<preAvg-2;
    }).map(e=>{
      const preAvg=e.preRatings.length?e.preRatings.reduce((a,v)=>a+v,0)/e.preRatings.length:0;
      const lastAvg=PROVIDERS.length?PROVIDERS.map((_,pi)=>e.ratings[pi][11]).reduce((a,v)=>a+v,0)/PROVIDERS.length:0;
      return {...e,preAvg:preAvg.toFixed(1),currentAvg:lastAvg.toFixed(1),deficit:(preAvg-lastAvg).toFixed(1)};
    }).sort((a,b)=>b.deficit-a.deficit);
  },[filtered]);

  const fullyRecovered=useMemo(()=>{
    return filtered.filter(e=>{
      const lastQ=PROVIDERS.map((_,pi)=>e.ratings[pi][11]);
      const preAvg=e.preRatings.length?e.preRatings.reduce((a,v)=>a+v,0)/e.preRatings.length:0;
      const lastAvg=lastQ.length?lastQ.reduce((a,v)=>a+v,0)/lastQ.length:0;
      return lastAvg>=preAvg-2;
    }).map(e=>{
      const preAvg=e.preRatings.length?e.preRatings.reduce((a,v)=>a+v,0)/e.preRatings.length:0;
      const lastAvg=PROVIDERS.length?PROVIDERS.map((_,pi)=>e.ratings[pi][11]).reduce((a,v)=>a+v,0)/PROVIDERS.length:0;
      const avgRecQ=e.recoverQ.length?e.recoverQ.reduce((a,v)=>a+v,0)/e.recoverQ.length:0;
      return {...e,preAvg:preAvg.toFixed(1),currentAvg:lastAvg.toFixed(1),recoveryQ:avgRecQ.toFixed(1)};
    });
  },[filtered]);

  const sectorRecovery=useMemo(()=>{
    const sectorMap={};
    filtered.forEach(e=>{
      if(!sectorMap[e.sector])sectorMap[e.sector]=[];
      const avgRec=e.recoverQ.length?e.recoverQ.reduce((a,v)=>a+v,0)/e.recoverQ.length:0;
      sectorMap[e.sector].push(avgRec);
    });
    return Object.entries(sectorMap).map(([sector,vals])=>({sector,avgRecovery:parseFloat((vals.reduce((a,v)=>a+v,0)/vals.length).toFixed(1)),count:vals.length})).sort((a,b)=>a.avgRecovery-b.avgRecovery);
  },[filtered]);

  const recoveryPredictors=useMemo(()=>{
    const factors=[
      {factor:'Severity (inverse)',key:'sev'},
      {factor:'Pre-event rating level',key:'pre'},
      {factor:'Environmental pillar',key:'env'},
      {factor:'Social pillar',key:'soc'},
      {factor:'Governance pillar',key:'gov'},
      {factor:'Company in Energy sector',key:'energy'},
      {factor:'North America geography',key:'na'},
      {factor:'Investigation speed',key:'detect'}
    ];
    return factors.map(f=>{
      const xs=filtered.map(e=>{
        const avgRec=e.recoverQ.length?e.recoverQ.reduce((a,v)=>a+v,0)/e.recoverQ.length:0;
        switch(f.key){
          case 'sev':return {x:6-e.severity,y:avgRec};
          case 'pre':return {x:e.preRatings.reduce((a,v)=>a+v,0)/e.preRatings.length,y:avgRec};
          case 'env':return {x:e.pillar==='Environmental'?1:0,y:avgRec};
          case 'soc':return {x:e.pillar==='Social'?1:0,y:avgRec};
          case 'gov':return {x:e.pillar==='Governance'?1:0,y:avgRec};
          case 'energy':return {x:e.sector==='Energy'?1:0,y:avgRec};
          case 'na':return {x:e.geo==='North America'?1:0,y:avgRec};
          case 'detect':return {x:e.detectQ.reduce((a,v)=>a+v,0)/e.detectQ.length,y:avgRec};
          default:return {x:0,y:avgRec};
        }
      });
      const n=xs.length;if(n<3)return {...f,corr:'N/A',direction:'--'};
      const mx=xs.reduce((a,p)=>a+p.x,0)/n;const my=xs.reduce((a,p)=>a+p.y,0)/n;
      const num=xs.reduce((a,p)=>a+(p.x-mx)*(p.y-my),0);
      const denX=Math.sqrt(xs.reduce((a,p)=>a+(p.x-mx)**2,0));
      const denY=Math.sqrt(xs.reduce((a,p)=>a+(p.y-my)**2,0));
      const corr=denX*denY===0?0:num/(denX*denY);
      return {...f,corr:corr.toFixed(3),direction:corr<-0.1?'Faster recovery':corr>0.1?'Slower recovery':'Neutral'};
    });
  },[filtered]);

  const PROV_COLORS=['#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#6366f1'];
  const [actionStates,setActionStates]=useState({});
  const setAction=(id,action)=>setActionStates(prev=>({...prev,[id]:action}));

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Severity Selector */}
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <span style={{fontSize:12,color:T.textSec}}>Filter by Severity:</span>
      <Btn active={sevFilter===0} onClick={()=>setSevFilter(0)}>All</Btn>
      {[1,2,3,4,5].map(s=><Btn key={s} active={sevFilter===s} onClick={()=>setSevFilter(s)} style={{background:sevFilter===s?SEV_COLORS[s]:T.surface,color:sevFilter===s?'#fff':T.text,borderColor:SEV_COLORS[s]}}>{s}</Btn>)}
      <span style={{fontSize:11,color:T.textMut,marginLeft:8}}>{filtered.length} events</span>
    </div>

    {/* Recovery Curve */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Recovery Curve (Rating Change from Pre-Event)</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Average recovery trajectory with +/- 1 standard deviation band</div>
      <div style={{height:280}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recoveryCurveData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="upper" stackId="band" stroke="none" fill={T.navy+'15'}/>
            <Area type="monotone" dataKey="lower" stackId="band" stroke="none" fill={T.surface}/>
            <Line type="monotone" dataKey="avg" stroke={T.navy} strokeWidth={3} dot={{r:3}} name="Average"/>
            {PROVIDERS.map((p,i)=><Line key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[i]} strokeWidth={1.5} dot={false} strokeDasharray="4 3" name={p}/>)}
            <Legend wrapperStyle={{fontSize:11}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Recovery Distribution */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Recovery Time Distribution</div>
      <div style={{height:200}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recoveryDistData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="bucket" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="count" name="Events" radius={[6,6,0,0]}>
              {recoveryDistData.map((entry,idx)=><Cell key={idx} fill={idx===recoveryDistData.length-1?T.red:T.sage}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Never Recovered & Fully Recovered */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.red,marginBottom:8}}>Never Recovered ({neverRecovered.length})</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>Still below pre-controversy ratings</div>
        <div style={{maxHeight:320,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              <th style={{textAlign:'left',padding:'6px 8px',color:T.textMut}}>Company</th>
              <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut}}>Pre</th>
              <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut}}>Now</th>
              <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut}}>Deficit</th>
              <th style={{textAlign:'center',padding:'6px 8px',color:T.textMut}}>Action</th>
            </tr></thead>
            <tbody>{neverRecovered.slice(0,20).map(e=><tr key={e.id} style={{borderBottom:`1px solid ${T.bg}`}}>
              <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{e.company}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{e.preAvg}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,color:T.red}}>{e.currentAvg}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontWeight:700,color:T.red}}>-{e.deficit}</td>
              <td style={{padding:'4px 8px',textAlign:'center'}}>
                <div style={{display:'flex',gap:3,justifyContent:'center'}}>
                  {['Engage','Monitor','Exclude'].map(a=><button key={a} onClick={()=>setAction(e.id,a)} style={{padding:'2px 6px',borderRadius:4,border:`1px solid ${actionStates[e.id]===a?T.navy:T.border}`,background:actionStates[e.id]===a?T.navy:T.surface,color:actionStates[e.id]===a?'#fff':T.textSec,fontSize:9,cursor:'pointer',fontFamily:T.font}}>{a}</button>)}
                </div>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>

      <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.green,marginBottom:8}}>Full Recovery ({fullyRecovered.length})</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>Back to or above pre-controversy level</div>
        <div style={{maxHeight:320,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              <th style={{textAlign:'left',padding:'6px 8px',color:T.textMut}}>Company</th>
              <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut}}>Pre</th>
              <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut}}>Now</th>
              <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut}}>Rec Q</th>
              <th style={{textAlign:'center',padding:'6px 8px',color:T.textMut}}>Action</th>
            </tr></thead>
            <tbody>{fullyRecovered.slice(0,20).map(e=><tr key={e.id} style={{borderBottom:`1px solid ${T.bg}`}}>
              <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{e.company}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{e.preAvg}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,color:T.green}}>{e.currentAvg}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{e.recoveryQ}Q</td>
              <td style={{padding:'4px 8px',textAlign:'center'}}>
                <div style={{display:'flex',gap:3,justifyContent:'center'}}>
                  {['Engage','Monitor','Exclude'].map(a=><button key={a} onClick={()=>setAction(e.id,a)} style={{padding:'2px 6px',borderRadius:4,border:`1px solid ${actionStates[e.id]===a?T.navy:T.border}`,background:actionStates[e.id]===a?T.navy:T.surface,color:actionStates[e.id]===a?'#fff':T.textSec,fontSize:9,cursor:'pointer',fontFamily:T.font}}>{a}</button>)}
                </div>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Sector Recovery Speed */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Recovery Speed</div>
      <div style={{height:Math.max(200,sectorRecovery.length*32)}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sectorRecovery} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textMut}} label={{value:'Avg Quarters to Recover',position:'bottom',fontSize:10}}/>
            <YAxis type="category" dataKey="sector" tick={{fontSize:10,fill:T.textSec}} width={100}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="avgRecovery" name="Avg Recovery (Q)" radius={[0,6,6,0]}>
              {sectorRecovery.map((entry,idx)=><Cell key={idx} fill={entry.avgRecovery>8?T.red:entry.avgRecovery>5?T.amber:T.sage}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Recovery Predictors */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Recovery Predictors</div>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Correlation between factors and recovery speed (negative = faster recovery)</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          <th style={{textAlign:'left',padding:'8px 12px',color:T.textMut,fontWeight:600}}>Factor</th>
          <th style={{textAlign:'right',padding:'8px 12px',color:T.textMut,fontWeight:600}}>Correlation</th>
          <th style={{textAlign:'right',padding:'8px 12px',color:T.textMut,fontWeight:600}}>Direction</th>
        </tr></thead>
        <tbody>{recoveryPredictors.map((r,i)=><tr key={r.factor} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?T.surface:T.bg}}>
          <td style={{padding:'8px 12px',color:T.navy}}>{r.factor}</td>
          <td style={{padding:'8px 12px',textAlign:'right',fontFamily:T.mono,fontWeight:700,color:parseFloat(r.corr)<-0.1?T.green:parseFloat(r.corr)>0.1?T.red:T.textMut}}>{r.corr}</td>
          <td style={{padding:'8px 12px',textAlign:'right',fontSize:11,color:r.direction==='Faster recovery'?T.green:r.direction==='Slower recovery'?T.red:T.textMut}}>{r.direction}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

/* ── Tab 4: Predictive Engine ── */
function PredictiveEngine({events}){
  const [inputs,setInputs]=useState({severity:3,type:TYPES[0],sector:SECTORS[0],geo:GEOS[0],companySize:'Large',pillar:PILLARS[0]});
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState(null);
  const [alertConfig,setAlertConfig]=useState({sevThreshold:4,types:new Set(TYPES),enabled:false});
  const timeoutRef=useRef(null);

  const runPrediction=useCallback(()=>{
    setLoading(true);setResults(null);
    if(timeoutRef.current)clearTimeout(timeoutRef.current);
    timeoutRef.current=setTimeout(()=>{
      const sev=inputs.severity;
      const typeIdx=TYPES.indexOf(inputs.type);
      const sectorIdx=SECTORS.indexOf(inputs.sector);
      const geoIdx=GEOS.indexOf(inputs.geo);
      const sizeMultiplier=inputs.companySize==='Small'?0.8:inputs.companySize==='Mid'?1.0:1.2;
      const pillarIdx=PILLARS.indexOf(inputs.pillar);

      const predicted=PROVIDERS.map((p,pi)=>{
        const base=sev*2.5*sizeMultiplier;
        const noise=sr(typeIdx*7+sectorIdx*11+geoIdx*3+pi*13+pillarIdx*5)*3;
        return Math.min(30,Math.max(1,parseFloat((base+noise).toFixed(1))));
      });

      const recoveryQ=PROVIDERS.map((p,pi)=>{
        const base=sev*1.5+sr(typeIdx*17+pi*19)*3;
        return Math.max(1,Math.min(12,Math.round(base)));
      });

      const portfolioImpact=-(sev*0.15*sizeMultiplier+sr(typeIdx*23)*0.1);

      const historicalSimilar=events.filter(e=>e.severity>=sev-1&&e.severity<=sev+1&&e.type===inputs.type);
      const actualImpacts=historicalSimilar.map(e=>PROVIDERS.map((_,pi)=>e.preRatings[pi]-e.ratings[pi][3]).reduce((a,v)=>a+v,0)/PROVIDERS.length);
      const mae=actualImpacts.length?actualImpacts.reduce((a,v)=>a+Math.abs(v-predicted.reduce((s,p)=>s+p,0)/predicted.length),0)/actualImpacts.length:2.1;
      const hitRate=actualImpacts.length?(actualImpacts.filter(a=>Math.abs(a-predicted.reduce((s,p)=>s+p,0)/predicted.length)<5).length/actualImpacts.length*100):72;

      const bucketAccuracy=[1,2,3,4,5].map(s=>{
        const bucket=events.filter(e=>e.severity===s);
        const avgPred=s*2.5;
        const hits=bucket.filter(e=>{
          const actual=PROVIDERS.map((_,pi)=>e.preRatings[pi]-e.ratings[pi][3]).reduce((a,v)=>a+v,0)/PROVIDERS.length;
          return Math.abs(actual-avgPred)<5;
        });
        return {severity:s,count:bucket.length,hitRate:bucket.length?(hits.length/bucket.length*100).toFixed(0):0};
      });

      const backtested=events.slice(0,30).map(e=>{
        const predImpact=e.severity*2.5*(e.sector==='Energy'?1.2:1.0)+sr(e.id*97)*3;
        const actualImpact=PROVIDERS.map((_,pi)=>e.preRatings[pi]-e.ratings[pi][3]).reduce((a,v)=>a+v,0)/PROVIDERS.length;
        return {company:e.company,predicted:parseFloat(predImpact.toFixed(1)),actual:parseFloat(actualImpact.toFixed(1)),severity:e.severity};
      });

      setResults({predicted,recoveryQ,portfolioImpact:parseFloat(portfolioImpact.toFixed(2)),mae:parseFloat(mae.toFixed(2)),hitRate:parseFloat(hitRate.toFixed(0)),bucketAccuracy,backtested,confidence:Math.max(40,Math.min(95,80-sev*3+historicalSimilar.length*2))});
      setLoading(false);
    },2000);
  },[inputs,events]);

  const matchingAlerts=useMemo(()=>{
    if(!alertConfig.enabled)return [];
    return events.filter(e=>e.severity>=alertConfig.sevThreshold&&alertConfig.types.has(e.type)).slice(0,20);
  },[events,alertConfig]);

  const PROV_COLORS=['#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#6366f1'];

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Simulator Inputs */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Controversy Impact Simulator</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180,1fr))',gap:12}}>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Severity ({inputs.severity})</div>
          <input type="range" min={1} max={5} step={0.5} value={inputs.severity} onChange={e=>setInputs(p=>({...p,severity:+e.target.value}))} style={{width:'100%'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.textMut}}><span>1 - Minor</span><span>5 - Critical</span></div>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Controversy Type</div>
          <select value={inputs.type} onChange={e=>setInputs(p=>({...p,type:e.target.value}))} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Sector</div>
          <select value={inputs.sector} onChange={e=>setInputs(p=>({...p,sector:e.target.value}))} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Geography</div>
          <select value={inputs.geo} onChange={e=>setInputs(p=>({...p,geo:e.target.value}))} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            {GEOS.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Company Size</div>
          <select value={inputs.companySize} onChange={e=>setInputs(p=>({...p,companySize:e.target.value}))} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            {['Small','Mid','Large'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>ESG Pillar</div>
          <select value={inputs.pillar} onChange={e=>setInputs(p=>({...p,pillar:e.target.value}))} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            {PILLARS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginTop:16,display:'flex',gap:12,alignItems:'center'}}>
        <button onClick={runPrediction} disabled={loading} style={{padding:'10px 28px',borderRadius:8,border:'none',background:loading?T.border:T.navy,color:'#fff',fontSize:13,fontWeight:700,cursor:loading?'default':'pointer',fontFamily:T.font,transition:'all .2s'}}>
          {loading?'Running Model...':'Run Prediction'}
        </button>
        {loading&&<div style={{display:'flex',gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:T.navy,opacity:0.3,animation:`pulse 1.2s ease-in-out ${i*0.4}s infinite`}}/>)}</div>}
      </div>
    </div>

    {/* Results */}
    {results&&<>
      {/* Predicted Impact Gauges */}
      <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Predicted Rating Impact per Provider</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Confidence: {results.confidence}%</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140,1fr))',gap:12}}>
          {PROVIDERS.map((p,i)=>{
            const pct=Math.min(100,results.predicted[i]/30*100);
            return <div key={p} style={{background:T.bg,borderRadius:10,padding:12,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:600,color:PROV_COLORS[i],marginBottom:6}}>{p}</div>
              <div style={{height:10,background:T.border,borderRadius:5,overflow:'hidden',marginBottom:6}}>
                <div style={{height:'100%',width:`${pct}%`,background:PROV_COLORS[i],borderRadius:5,transition:'width .5s ease'}}/>
              </div>
              <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.mono}}>-{results.predicted[i]}</div>
              <div style={{fontSize:10,color:T.textMut}}>pts drop</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>Recovery: ~{results.recoveryQ[i]}Q</div>
            </div>;
          })}
        </div>
        <div style={{marginTop:12,padding:10,background:T.bg,borderRadius:8,display:'flex',justifyContent:'space-around'}}>
          <div style={{textAlign:'center'}}><div style={{fontSize:10,color:T.textMut}}>Portfolio P&L Impact</div><div style={{fontSize:16,fontWeight:700,color:T.red,fontFamily:T.mono}}>{results.portfolioImpact}%</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:10,color:T.textMut}}>Model Confidence</div><div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{results.confidence}%</div></div>
        </div>
      </div>

      {/* Historical Accuracy */}
      <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Historical Accuracy Metrics</div>
        <div style={{display:'flex',gap:16,marginBottom:12}}>
          <StatCard label="Mean Absolute Error" value={results.mae} sub="rating points" color={results.mae<3?T.green:T.amber}/>
          <StatCard label="Hit Rate (within 5pts)" value={`${results.hitRate}%`} color={results.hitRate>70?T.green:T.amber}/>
        </div>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Accuracy by Severity Bucket</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            <th style={{textAlign:'left',padding:'6px 12px',color:T.textMut}}>Severity</th>
            <th style={{textAlign:'right',padding:'6px 12px',color:T.textMut}}>Events</th>
            <th style={{textAlign:'right',padding:'6px 12px',color:T.textMut}}>Hit Rate</th>
          </tr></thead>
          <tbody>{results.bucketAccuracy.map(r=><tr key={r.severity} style={{borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'6px 12px'}}><SevBadge sev={r.severity}/></td>
            <td style={{padding:'6px 12px',textAlign:'right',fontFamily:T.mono}}>{r.count}</td>
            <td style={{padding:'6px 12px',textAlign:'right',fontFamily:T.mono,fontWeight:700,color:r.hitRate>=70?T.green:T.amber}}>{r.hitRate}%</td>
          </tr>)}</tbody>
        </table>
      </div>

      {/* Backtested Scatter */}
      <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>Backtested: Predicted vs Actual Impact</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Each point = one historical event; diagonal = perfect prediction</div>
        <div style={{height:280}}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="predicted" name="Predicted" tick={{fontSize:10,fill:T.textSec}} label={{value:'Predicted Impact',position:'bottom',fontSize:10}}/>
              <YAxis dataKey="actual" name="Actual" tick={{fontSize:10,fill:T.textMut}} label={{value:'Actual Impact',angle:-90,position:'insideLeft',fontSize:10}}/>
              <Tooltip content={({active,payload})=>{
                if(!active||!payload?.length)return null;
                const d=payload[0].payload;
                return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 14px',boxShadow:'0 4px 12px rgba(0,0,0,.08)',fontFamily:T.font}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{d.company}</div>
                  <div style={{fontSize:11,color:T.textSec}}>Predicted: {d.predicted} | Actual: {d.actual}</div>
                  <div style={{fontSize:11,color:T.textSec}}>Severity: {d.severity}</div>
                </div>;
              }}/>
              <Scatter data={results.backtested} name="Events">
                {results.backtested.map((entry,idx)=><Cell key={idx} fill={SEV_COLORS[entry.severity]||T.navy}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>}

    {/* Alert Configurator */}
    <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Alert Configurator</div>
          <div style={{fontSize:11,color:T.textSec}}>Set thresholds to watch for controversy events in your portfolio</div>
        </div>
        <Btn active={alertConfig.enabled} onClick={()=>setAlertConfig(p=>({...p,enabled:!p.enabled}))}>
          {alertConfig.enabled?'Alerts ON':'Alerts OFF'}
        </Btn>
      </div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:12}}>
        <div style={{minWidth:160}}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Min Severity Threshold ({alertConfig.sevThreshold})</div>
          <input type="range" min={1} max={5} value={alertConfig.sevThreshold} onChange={e=>setAlertConfig(p=>({...p,sevThreshold:+e.target.value}))} style={{width:'100%'}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Types to Watch</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {TYPES.map(t=><Btn key={t} active={alertConfig.types.has(t)} onClick={()=>{
              const n=new Set(alertConfig.types);n.has(t)?n.delete(t):n.add(t);setAlertConfig(p=>({...p,types:n}));
            }} style={{padding:'2px 8px',fontSize:10}}>{t}</Btn>)}
          </div>
        </div>
      </div>
      {alertConfig.enabled&&matchingAlerts.length>0&&<div style={{background:T.bg,borderRadius:8,padding:12}}>
        <div style={{fontSize:12,fontWeight:600,color:T.amber,marginBottom:8}}>Matching Events ({matchingAlerts.length})</div>
        <div style={{maxHeight:200,overflowY:'auto'}}>
          {matchingAlerts.map(e=><div key={e.id} style={{display:'flex',gap:8,alignItems:'center',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
            <SevBadge sev={e.severity}/>
            <span style={{fontSize:11,fontWeight:600,color:T.navy}}>{e.company}</span>
            <Pill label={e.type} color={TYPE_COLORS[e.type]||T.navy}/>
            <span style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{e.date}</span>
          </div>)}
        </div>
      </div>}
      {alertConfig.enabled&&matchingAlerts.length===0&&<div style={{fontSize:12,color:T.textMut,padding:8}}>No events match current alert criteria</div>}
    </div>

    {/* Export */}
    <div style={{display:'flex',gap:12}}>
      <Btn style={{background:T.navy,color:'#fff',border:'none',padding:'10px 24px'}}>Export Prediction Report (CSV)</Btn>
      <Btn style={{padding:'10px 24px'}}>Save Alert Configuration</Btn>
    </div>
  </div>;
}

/* ── Main Page ── */
export default function ControversyRatingImpactPage(){
  const [tab,setTab]=useState(0);
  const [events,setEvents]=useState(()=>ALL_EVENTS);
  const tabs=['Controversy Feed','Impact Propagation','Recovery Analytics','Predictive Engine'];

  return <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    {/* Header */}
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
        <span style={{fontSize:22,fontWeight:800,color:T.navy}}>Controversy-to-Rating Impact</span>
        <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,background:T.red+'18',color:T.red}}>EP-AK4</span>
      </div>
      <div style={{fontSize:13,color:T.textSec}}>
        {events.length} controversy events across {new Set(events.map(e=>e.company)).size} companies | {TYPES.length} types | {PROVIDERS.length} ESG rating providers | 12-quarter tracking
      </div>
    </div>

    {/* Tab Bar */}
    <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
      {tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{
        padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,
        background:tab===i?T.surface:'transparent',border:tab===i?`1px solid ${T.border}`:'1px solid transparent',
        borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',
        borderRadius:'8px 8px 0 0',cursor:'pointer',fontFamily:T.font,transition:'all .15s',
        marginBottom:-2
      }}>{t}</button>)}
    </div>

    {/* Content */}
    {tab===0&&<ControversyFeed events={events} setEvents={setEvents}/>}
    {tab===1&&<ImpactPropagation events={events}/>}
    {tab===2&&<RecoveryAnalytics events={events}/>}
    {tab===3&&<PredictiveEngine events={events}/>}
  </div>;
}
