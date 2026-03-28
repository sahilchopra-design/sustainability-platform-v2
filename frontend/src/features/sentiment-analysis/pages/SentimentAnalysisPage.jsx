import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const TABS=['Sentiment Dashboard','Company Deep-Dive','Topic Analysis','Sentiment Alpha'];
const SECTORS=['Energy','Technology','Financials','Healthcare','Industrials','Materials','Consumer','Real Estate','Utilities','Telecom'];
const SOURCES=['Reuters','Bloomberg','FT','MSCI ESG','Sustainalytics','RepRisk','UNGC','NGO Reports','Regulatory','Social Media','Corporate Filings','Academic'];
const PIE_C=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0284c7','#db2777','#6b7280','#059669'];

const COMPANIES=Array.from({length:80},(_,i)=>{
  const names=['TotalEnergies','Shell plc','BP plc','Exxon Mobil','Chevron','HSBC Holdings','JPMorgan Chase','Goldman Sachs','Barclays','Deutsche Bank','BNP Paribas','UBS Group','Credit Suisse','Allianz SE','AXA Group','Unilever','Nestle','Procter & Gamble','Coca-Cola','PepsiCo','Apple Inc','Microsoft','Alphabet','Amazon','Meta Platforms','Tesla Inc','Volkswagen','BMW Group','Toyota Motor','Ford Motor','Rio Tinto','BHP Group','Glencore','ArcelorMittal','Vale SA','BASF SE','Dow Chemical','Bayer AG','Syngenta','Corteva','Novo Nordisk','Roche','Pfizer','Johnson & Johnson','AstraZeneca','Siemens','General Electric','Honeywell','ABB Ltd','Schneider Electric','BlackRock','Vanguard','State Street','Fidelity','T Rowe Price','Samsung','TSMC','Intel Corp','Nvidia','AMD','Berkshire Hathaway','Walmart','Costco','Home Depot','Nike Inc','Adidas','LVMH','Hermes','Kering','Danone','LOreal','Diageo','AB InBev','Heineken','SAP SE','Oracle','Salesforce','Adobe','Visa Inc','Mastercard'];
  const sec=SECTORS[i%10];
  const eScore=Math.round(20+sr(i*7)*60);
  const sScore=Math.round(20+sr(i*11)*60);
  const gScore=Math.round(30+sr(i*13)*60);
  const overall=Math.round((eScore+sScore+gScore)/3);
  const trend=sr(i*17)>0.5?'Improving':'Declining';
  const volume=Math.round(50+sr(i*19)*950);
  const controversies=Math.round(sr(i*23)*8);
  const priceCorr=Math.round(-40+sr(i*29)*80);
  return{id:i,name:names[i]||`Company ${i+1}`,sector:sec,eScore,sScore,gScore,overall,trend,volume,controversies,priceCorr,
    monthly:Array.from({length:12},(_,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],e:Math.round(eScore-15+sr(i*100+m*3)*30),s:Math.round(sScore-15+sr(i*100+m*7)*30),g:Math.round(gScore-15+sr(i*100+m*11)*30),overall:Math.round(overall-10+sr(i*100+m*17)*20),volume:Math.round(volume*0.5+sr(i*100+m*23)*volume*0.5)})),
    topTopics:['Carbon Emissions','Labor Practices','Board Diversity','Supply Chain','Water Usage','Biodiversity','Executive Pay','Tax Transparency','Data Privacy','Community Impact'].slice(0,3+Math.floor(sr(i*31)*4)).map((t,ti)=>({topic:t,sentiment:Math.round(20+sr(i*50+ti*7)*60),mentions:Math.round(5+sr(i*50+ti*11)*50)}))
  };
});

const FEED=Array.from({length:30},(_,i)=>{
  const headlines=['TotalEnergies faces criticism over new oil field approval','Shell announces $5B green hydrogen investment','HSBC pledges net-zero financed emissions by 2050','Tesla criticized for labor conditions in Berlin Gigafactory','BlackRock votes against climate proposals at AGM','Nestle achieves 80% sustainable sourcing target','Microsoft reaches carbon negative milestone','Amazon warehouse workers demand better conditions','BHP faces lawsuit over dam collapse compensation','Apple supplier audit reveals labor violations','Unilever biodiversity commitment praised by NGOs','JPMorgan fossil fuel financing hits record $40B','Volkswagen EV transition ahead of schedule','Rio Tinto sacred site destruction compensation agreed','BASF circular economy initiative wins award','Pfizer drug pricing controversy escalates','Siemens wind turbine recycling program launched','Goldman Sachs ESG fund greenwashing allegations','Allianz climate risk insurance innovation','BP reduces Scope 3 targets amid criticism','Deutsche Bank linked to deforestation financing','AstraZeneca equitable vaccine access praised','Glencore coal phase-out timeline questioned','Samsung commits to 100% renewable energy by 2027','Meta data privacy fine in EU reaches $1.2B','Coca-Cola plastic waste reduction targets missed','Nike supply chain transparency report released','LVMH luxury sustainability charter launched','Visa green fintech partnership announced','Oracle cloud sustainability metrics questioned'];
  const sentiment=sr(i*7)>0.5?'Positive':'Negative';
  const pillar=['Environmental','Social','Governance'][Math.floor(sr(i*11)*3)];
  return{id:i,headline:headlines[i],company:COMPANIES[Math.floor(sr(i*13)*40)].name,sentiment,pillar,score:Math.round(sentiment==='Positive'?50+sr(i*17)*50:sr(i*19)*50),date:`2026-03-${String(28-i%28).padStart(2,'0')}`,source:SOURCES[Math.floor(sr(i*23)*12)]};
});

const TRENDING=['Carbon Emissions','Greenwashing','Biodiversity','Just Transition','Supply Chain Due Diligence','Board Diversity','Scope 3 Reporting','Water Stress','Deforestation','Net Zero Targets','Labor Rights','Data Privacy','Circular Economy','Climate Litigation','Green Hydrogen'];
const WORD_CLOUD=TRENDING.map((t,i)=>({text:t,weight:Math.round(20+sr(i*37)*80),sentiment:sr(i*41)>0.4?'Positive':'Negative'}));
const CONTROVERSY_ALERTS=COMPANIES.filter(c=>c.controversies>4).slice(0,12).map(c=>({company:c.name,sector:c.sector,controversies:c.controversies,severity:c.controversies>6?'Critical':'High',topics:c.topTopics.slice(0,2).map(t=>t.topic).join(', ')}));

const exportCSV=(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const Kpi=({label,value,sub,accent=T.navy})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',borderLeft:`3px solid ${accent}`}}><div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:accent,marginTop:3}}>{sub}</div>}</div>;
const Row=({children,cols})=><div style={{display:'grid',gridTemplateColumns:cols||'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>;
const Badge=({children,bg,fg})=><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:bg||T.surfaceH,color:fg||T.text}}>{children}</span>;

export default function SentimentAnalysisPage(){
  const [tab,setTab]=useState(0);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [trendFilter,setTrendFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('overall');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCompany,setSelectedCompany]=useState(0);
  const [pillarFilter,setPillarFilter]=useState('All');
  const [topicSearch,setTopicSearch]=useState('');
  const [signalThreshold,setSignalThreshold]=useState(30);
  const [corrWindow,setCorrWindow]=useState('3m');
  const [selectedPanel,setSelectedPanel]=useState(null);

  const th={padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'left',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',userSelect:'none'};
  const td={padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};

  const filtered=useMemo(()=>{
    let c=[...COMPANIES];
    if(sectorFilter!=='All')c=c.filter(x=>x.sector===sectorFilter);
    if(trendFilter!=='All')c=c.filter(x=>x.trend===trendFilter);
    if(search)c=c.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
    c.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return c;
  },[sectorFilter,trendFilter,search,sortCol,sortDir]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const avgSent=Math.round(COMPANIES.reduce((a,c)=>a+c.overall,0)/COMPANIES.length);
  const improving=COMPANIES.filter(c=>c.trend==='Improving').length;
  const totalControversies=COMPANIES.reduce((a,c)=>a+c.controversies,0);

  const sectorAvg=useMemo(()=>SECTORS.map(s=>{const cs=COMPANIES.filter(c=>c.sector===s);return{sector:s,e:Math.round(cs.reduce((a,c)=>a+c.eScore,0)/(cs.length||1)),s:Math.round(cs.reduce((a,c)=>a+c.sScore,0)/(cs.length||1)),g:Math.round(cs.reduce((a,c)=>a+c.gScore,0)/(cs.length||1)),overall:Math.round(cs.reduce((a,c)=>a+c.overall,0)/(cs.length||1)),count:cs.length};}),[]);

  const renderDashboard=()=>{
    const recentFeed=FEED.slice(0,15);
    const sentDist=[{name:'Positive',value:FEED.filter(f=>f.sentiment==='Positive').length},{name:'Negative',value:FEED.filter(f=>f.sentiment==='Negative').length}];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Companies Tracked" value={COMPANIES.length} accent={T.navy}/><Kpi label="Avg Sentiment" value={avgSent} sub={avgSent>50?'Above neutral':'Below neutral'} accent={avgSent>50?T.green:T.red}/><Kpi label="Improving" value={`${improving}/${COMPANIES.length}`} sub={`${Math.round(improving/COMPANIES.length*100)}%`} accent={T.sage}/><Kpi label="Active Controversies" value={totalControversies} sub={`${CONTROVERSY_ALERTS.length} critical`} accent={T.red}/></Row>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Real-Time Sentiment Feed</div>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            {recentFeed.map(f=><div key={f.id} style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,cursor:'pointer'}} onClick={()=>setSelectedPanel(f)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:3}}>{f.headline}</div>
                  <div style={{display:'flex',gap:8,fontSize:11,color:T.textSec}}><span>{f.date}</span><span>{f.company}</span><Badge bg={f.sentiment==='Positive'?T.green+'20':T.red+'20'} fg={f.sentiment==='Positive'?T.green:T.red}>{f.sentiment} ({f.score})</Badge><span>{f.source}</span></div>
                </div>
              </div>
            </div>)}
          </div>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Trending Topics</div>
            {TRENDING.slice(0,10).map((t,i)=><div key={t} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{fontWeight:500}}>{i+1}. {t}</span><span style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>{Math.round(20+sr(i*37)*80)}</span></div>)}
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Sentiment Split</div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{flex:1,height:20,background:T.red+'30',borderRadius:4,position:'relative'}}><div style={{height:20,background:T.green,borderRadius:4,width:`${sentDist[0].value/(sentDist[0].value+sentDist[1].value)*100}%`}}/></div>
              <span style={{fontSize:11,fontFamily:T.mono}}>{sentDist[0].value}P / {sentDist[1].value}N</span>
            </div>
          </div>
        </div>
      </Row>
      {selectedPanel&&<div style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:10,padding:18,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{fontWeight:700,fontSize:14,color:T.text}}>{selectedPanel.headline}</div><button onClick={()=>setSelectedPanel(null)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.textMut}}>x</button></div>
        <Row cols="1fr 1fr 1fr 1fr"><div><span style={{fontSize:11,color:T.textSec}}>Company</span><div style={{fontWeight:600}}>{selectedPanel.company}</div></div><div><span style={{fontSize:11,color:T.textSec}}>Source</span><div>{selectedPanel.source}</div></div><div><span style={{fontSize:11,color:T.textSec}}>Pillar</span><div>{selectedPanel.pillar}</div></div><div><span style={{fontSize:11,color:T.textSec}}>Score</span><div style={{fontSize:18,fontWeight:700,color:selectedPanel.score>50?T.green:T.red,fontFamily:T.mono}}>{selectedPanel.score}/100</div></div></Row>
      </div>}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Sector Sentiment Breakdown</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={sectorAvg}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12,fontFamily:T.font}}/><Legend/><Bar dataKey="e" fill={T.sage} name="Environmental" radius={[3,3,0,0]}/><Bar dataKey="s" fill={T.gold} name="Social" radius={[3,3,0,0]}/><Bar dataKey="g" fill={T.navy} name="Governance" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </div>);
  };

  const renderDeepDive=()=>{
    const co=COMPANIES[selectedCompany];
    return(<div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <select value={selectedCompany} onChange={e=>setSelectedCompany(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:220}}>{COMPANIES.map((c,i)=><option key={i} value={i}>{c.name} ({c.sector})</option>)}</select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies..." style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 12px',fontSize:13,fontFamily:T.font,width:200,outline:'none'}}/>
        <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
        <button onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,E:c.eScore,S:c.sScore,G:c.gScore,Overall:c.overall,Trend:c.trend,Controversies:c.controversies})),'sentiment_companies.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export CSV</button>
      </div>
      <Row cols="1fr 1fr 1fr 1fr 1fr"><Kpi label="Overall Sentiment" value={co.overall} accent={co.overall>50?T.green:T.red}/><Kpi label="E Score" value={co.eScore} accent={T.sage}/><Kpi label="S Score" value={co.sScore} accent={T.gold}/><Kpi label="G Score" value={co.gScore} accent={T.navy}/><Kpi label="Controversies" value={co.controversies} accent={co.controversies>4?T.red:T.amber}/></Row>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.name} - 12-Month Sentiment Trend</div>
          <ResponsiveContainer width="100%" height={280}><AreaChart data={co.monthly}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:12,fontFamily:T.font}}/><Legend/><Area type="monotone" dataKey="e" fill={T.sage+'40'} stroke={T.sage} name="Environmental"/><Area type="monotone" dataKey="s" fill={T.gold+'40'} stroke={T.gold} name="Social"/><Area type="monotone" dataKey="g" fill={T.navy+'40'} stroke={T.navy} name="Governance"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Top Topics</div>
          {co.topTopics.map((t,i)=><div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,fontWeight:500}}>{t.topic}</span><span style={{fontSize:11,fontFamily:T.mono,color:t.sentiment>50?T.green:T.red}}>{t.sentiment}</span></div>
            <div style={{width:'100%',height:5,background:T.border,borderRadius:3}}><div style={{width:`${t.sentiment}%`,height:5,background:t.sentiment>50?T.green:T.red,borderRadius:3}}/></div>
            <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{t.mentions} mentions</div>
          </div>)}
          <div style={{marginTop:12,padding:10,background:T.surfaceH,borderRadius:6}}>
            <div style={{fontSize:11,color:T.textSec}}>Trend</div>
            <div style={{fontSize:14,fontWeight:700,color:co.trend==='Improving'?T.green:T.red}}>{co.trend}</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Media Volume: <span style={{fontWeight:600,fontFamily:T.mono}}>{co.volume}</span> articles/month</div>
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Media Volume Over Time</div>
        <ResponsiveContainer width="100%" height={200}><BarChart data={co.monthly}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Bar dataKey="volume" fill={T.navy} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{fontWeight:600,fontSize:13,color:T.text}}>Full Company Table</div></div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,zIndex:1}}><tr>{[{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'overall',l:'Overall'},{k:'eScore',l:'E'},{k:'sScore',l:'S'},{k:'gScore',l:'G'},{k:'trend',l:'Trend'},{k:'controversies',l:'Controv.'},{k:'volume',l:'Volume'}].map(c=><th key={c.k} style={th} onClick={()=>toggleSort(c.k)}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}</tr></thead>
            <tbody>{filtered.slice(0,40).map((c,i)=><tr key={c.id} style={{cursor:'pointer',background:selectedCompany===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedCompany(c.id)}>
              <td style={{...td,fontWeight:500}}>{c.name}</td><td style={td}>{c.sector}</td>
              <td style={{...td,fontWeight:700,color:c.overall>50?T.green:T.red,fontFamily:T.mono}}>{c.overall}</td>
              <td style={{...td,fontFamily:T.mono}}>{c.eScore}</td><td style={{...td,fontFamily:T.mono}}>{c.sScore}</td><td style={{...td,fontFamily:T.mono}}>{c.gScore}</td>
              <td style={td}><Badge bg={c.trend==='Improving'?T.green+'20':T.red+'20'} fg={c.trend==='Improving'?T.green:T.red}>{c.trend}</Badge></td>
              <td style={{...td,color:c.controversies>4?T.red:T.text}}>{c.controversies}</td><td style={{...td,fontFamily:T.mono}}>{c.volume}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  const renderTopicAnalysis=()=>{
    const pillarData=[{name:'Environmental',positive:FEED.filter(f=>f.pillar==='Environmental'&&f.sentiment==='Positive').length,negative:FEED.filter(f=>f.pillar==='Environmental'&&f.sentiment==='Negative').length},{name:'Social',positive:FEED.filter(f=>f.pillar==='Social'&&f.sentiment==='Positive').length,negative:FEED.filter(f=>f.pillar==='Social'&&f.sentiment==='Negative').length},{name:'Governance',positive:FEED.filter(f=>f.pillar==='Governance'&&f.sentiment==='Positive').length,negative:FEED.filter(f=>f.pillar==='Governance'&&f.sentiment==='Negative').length}];
    const filteredCloud=topicSearch?WORD_CLOUD.filter(w=>w.text.toLowerCase().includes(topicSearch.toLowerCase())):WORD_CLOUD;
    return(<div>
      <Row cols="1fr 1fr 1fr"><Kpi label="Unique Topics" value={TRENDING.length} accent={T.navy}/><Kpi label="Positive Sentiment %" value={`${Math.round(FEED.filter(f=>f.sentiment==='Positive').length/FEED.length*100)}%`} accent={T.green}/><Kpi label="Controversy Alerts" value={CONTROVERSY_ALERTS.length} sub="Companies with 5+ controversies" accent={T.red}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <input value={topicSearch} onChange={e=>setTopicSearch(e.target.value)} placeholder="Search topics..." style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 12px',fontSize:13,fontFamily:T.font,width:220,outline:'none'}}/>
        <select value={pillarFilter} onChange={e=>setPillarFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Pillars</option><option>Environmental</option><option>Social</option><option>Governance</option></select>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>E/S/G Pillar Sentiment</div>
          <ResponsiveContainer width="100%" height={240}><BarChart data={pillarData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="positive" fill={T.green} name="Positive" radius={[3,3,0,0]}/><Bar dataKey="negative" fill={T.red} name="Negative" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Topic Cloud (Weight = Mentions)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:10}}>
            {filteredCloud.map((w,i)=><span key={i} style={{fontSize:Math.max(11,Math.min(24,w.weight/4)),fontWeight:w.weight>50?700:500,color:w.sentiment==='Positive'?T.sage:T.red,padding:'3px 8px',background:w.sentiment==='Positive'?T.sage+'15':T.red+'15',borderRadius:4,cursor:'pointer'}} title={`${w.text}: weight ${w.weight}`}>{w.text}</span>)}
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Controversy Alerts</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Company','Sector','Controversies','Severity','Key Topics'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{CONTROVERSY_ALERTS.map((a,i)=><tr key={i}><td style={{...td,fontWeight:500}}>{a.company}</td><td style={td}>{a.sector}</td><td style={{...td,fontWeight:700,color:T.red,fontFamily:T.mono}}>{a.controversies}</td><td style={td}><Badge bg={a.severity==='Critical'?T.red+'20':T.amber+'20'} fg={a.severity==='Critical'?T.red:T.amber}>{a.severity}</Badge></td><td style={{...td,fontSize:11}}>{a.topics}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginTop:12}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Source Distribution</div>
        <ResponsiveContainer width="100%" height={220}><BarChart data={SOURCES.map(s=>({name:s,count:FEED.filter(f=>f.source===s).length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Bar dataKey="count" fill={T.gold} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </div>);
  };

  const renderAlpha=()=>{
    const scatterData=COMPANIES.slice(0,50).map(c=>({name:c.name,x:c.overall,y:c.priceCorr,z:c.volume}));
    const signalCompanies=COMPANIES.filter(c=>Math.abs(c.priceCorr)>=signalThreshold).sort((a,b)=>Math.abs(b.priceCorr)-Math.abs(a.priceCorr));
    const buckets=[{label:'Strong Positive (>30)',count:COMPANIES.filter(c=>c.priceCorr>30).length},{label:'Weak Positive (0-30)',count:COMPANIES.filter(c=>c.priceCorr>=0&&c.priceCorr<=30).length},{label:'Weak Negative (-30-0)',count:COMPANIES.filter(c=>c.priceCorr<0&&c.priceCorr>=-30).length},{label:'Strong Negative (<-30)',count:COMPANIES.filter(c=>c.priceCorr<-30).length}];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Avg Sentiment-Price Corr" value={`${Math.round(COMPANIES.reduce((a,c)=>a+c.priceCorr,0)/COMPANIES.length)}%`} accent={T.navy}/><Kpi label="Strong Signals" value={signalCompanies.length} sub={`Threshold: ${signalThreshold}%`} accent={T.gold}/><Kpi label="Positive Correlation" value={COMPANIES.filter(c=>c.priceCorr>0).length} accent={T.green}/><Kpi label="Negative Correlation" value={COMPANIES.filter(c=>c.priceCorr<0).length} accent={T.red}/></Row>
      <div style={{display:'flex',gap:12,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,color:T.textSec}}>Signal Threshold:</span><input type="range" min={10} max={60} value={signalThreshold} onChange={e=>setSignalThreshold(+e.target.value)} style={{width:150,accentColor:T.navy}}/><span style={{fontSize:12,fontWeight:700,fontFamily:T.mono,color:T.navy}}>{signalThreshold}%</span></div>
        <select value={corrWindow} onChange={e=>setCorrWindow(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="1m">1 Month</option><option value="3m">3 Months</option><option value="6m">6 Months</option><option value="12m">12 Months</option></select>
        <button onClick={()=>exportCSV(signalCompanies.map(c=>({Name:c.name,Sector:c.sector,Sentiment:c.overall,PriceCorrelation:c.priceCorr,Volume:c.volume,Trend:c.trend})),'sentiment_alpha.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export Signals</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Sentiment vs Price Correlation ({corrWindow})</div>
          <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" dataKey="x" name="Sentiment" tick={{fontSize:10,fill:T.textSec}} label={{value:'Sentiment Score',position:'bottom',fontSize:11}}/><YAxis type="number" dataKey="y" name="Price Corr" tick={{fontSize:10,fill:T.textSec}} label={{value:'Price Corr %',angle:-90,position:'insideLeft',fontSize:11}}/><Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload})=>{if(!payload||!payload.length)return null;const d=payload[0].payload;return<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:8,fontSize:11}}><div style={{fontWeight:600}}>{d.name}</div><div>Sentiment: {d.x}</div><div>Corr: {d.y}%</div><div>Volume: {d.z}</div></div>;}}/><Scatter data={scatterData} fill={T.navy} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Correlation Buckets</div>
          <ResponsiveContainer width="100%" height={200}><BarChart data={buckets}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="label" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Bar dataKey="count" radius={[3,3,0,0]}>{buckets.map((_,i)=><Cell key={i} fill={[T.green,T.sage,T.amber,T.red][i]}/>)}</Bar></BarChart></ResponsiveContainer>
          <div style={{marginTop:12}}>{buckets.map((b,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:[T.green,T.sage,T.amber,T.red][i],fontWeight:600}}>{b.label}</span><span style={{fontFamily:T.mono}}>{b.count}</span></div>)}</div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Signal Builder - Companies Above Threshold</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0}}><tr>{['Company','Sector','Sentiment','Price Corr %','Volume','Trend','Signal'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{signalCompanies.slice(0,30).map(c=>{const sig=c.priceCorr>0?'Long':'Short';return(<tr key={c.id}><td style={{...td,fontWeight:500}}>{c.name}</td><td style={td}>{c.sector}</td><td style={{...td,fontFamily:T.mono}}>{c.overall}</td>
              <td style={{...td,fontWeight:700,color:c.priceCorr>0?T.green:T.red,fontFamily:T.mono}}>{c.priceCorr>0?'+':''}{c.priceCorr}%</td>
              <td style={{...td,fontFamily:T.mono}}>{c.volume}</td><td style={td}><Badge bg={c.trend==='Improving'?T.green+'20':T.red+'20'} fg={c.trend==='Improving'?T.green:T.red}>{c.trend}</Badge></td>
              <td style={td}><Badge bg={sig==='Long'?T.green+'20':T.red+'20'} fg={sig==='Long'?T.green:T.red}>{sig}</Badge></td>
            </tr>)})}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 28px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0}}>ESG Sentiment Analysis</h1><p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Track ESG sentiment for 80 companies with real-time feeds, topic analysis, and alpha signals</p></div>
    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:tab===i?T.surface:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderDashboard()}
    {tab===1&&renderDeepDive()}
    {tab===2&&renderTopicAnalysis()}
    {tab===3&&renderAlpha()}
  </div>);
}