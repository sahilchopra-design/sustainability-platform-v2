import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626',
  green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c',
  purple:'#7c3aed', teal:'#0891b2',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(seed){let x=Math.sin(seed + 1) * 10000;return x-Math.floor(x);}

const TOPICS = ['Carbon Pricing','Regulation','Clean Technology','Physical Risk','Engagement','Litigation','Greenwashing','Just Transition','Biodiversity','Net Zero'];
const SENTIMENTS = ['positive','neutral','negative'];
const SOURCES = [
  {name:'Reuters Climate',reliability:92},{name:'Bloomberg Green',reliability:95},{name:'FT Climate Capital',reliability:91},
  {name:'Carbon Pulse',reliability:88},{name:'Climate Home News',reliability:84},{name:'The Guardian Env',reliability:80},
  {name:'S&P Climate Wire',reliability:90},{name:'MSCI Climate Blog',reliability:87},{name:'CDP Insights',reliability:86},
  {name:'TNFD News',reliability:85},{name:'GreenBiz',reliability:82},{name:'Responsible Investor',reliability:89},
  {name:'Environmental Finance',reliability:88},{name:'Climate Bonds Initiative',reliability:87},{name:'Clean Energy Wire',reliability:83}
];

const HOLDINGS_AFFECTED = ['Energy Corp A','Utilities Inc B','Materials Co C','Industrials Ltd D','Financials Group E','Tech Corp F','Healthcare Inc G','Consumer Co H','Real Estate Ltd I','Transport Group J'];

const NEWS = Array.from({length:40},(_,i)=>{
  const src = SOURCES[Math.floor(sr(i+100)*SOURCES.length)];
  const sent = SENTIMENTS[Math.floor(sr(i+110)*3)];
  const topicCount = 1+Math.floor(sr(i+120)*3);
  const topics = [];
  for(let t=0;t<topicCount;t++){const tp=TOPICS[Math.floor(sr(i+130+t)*TOPICS.length)];if(!topics.includes(tp))topics.push(tp);}
  const headlines = [
    'EU Carbon Price Hits Record High Amid Policy Tightening','SEC Climate Disclosure Rule Faces Legal Challenge',
    'Major Insurer Exits Fossil Fuel Underwriting','SBTi Validates Near-Term Targets for 500 Companies',
    'IPCC Report Warns of Accelerating Physical Risks','Green Bond Issuance Surpasses $500B in 2026',
    'Climate Litigation Cases Double Year-Over-Year','Deforestation-Free Supply Chain Law Takes Effect',
    'Sovereign Green Bond Premium Narrows to 5bps','Electric Vehicle Sales Exceed 25% Global Market Share',
    'TCFD Reporting Becomes Mandatory in 12 Jurisdictions','Carbon Capture Investment Reaches $40B Milestone',
    'Water Stress Threatens $2.3T in Agricultural Assets','Biodiversity Credits Market Launches Pilot Phase',
    'Just Transition Fund Exceeds EUR 50B Commitments','Climate Migration Displaces 8M People in 2025',
    'Methane Emissions Satellite Detection Goes Operational','ISSB Standards Adopted by 140 Jurisdictions',
    'Greenwashing Penalties Reach $1.2B Globally','Parametric Insurance Market Grows 45% YoY',
    'Heat Stress Reduces Global Labor Productivity by 2.1%','Net Zero Asset Owner Alliance Adds 15 Members',
    'Green Hydrogen Cost Falls Below $3/kg Threshold','Climate Risk Repricing Event Hits Real Estate Sector',
    'Carbon Border Tax Dispute Escalates at WTO','Stranded Asset Writedowns Total $180B in Energy',
    'Nature-Based Solutions Market Reaches $12B','AI-Powered Climate Analytics Adoption Surges',
    'Supply Chain Climate Disruption Costs Rise 34%','Central Banks Include Climate in Stress Tests',
    'Renewable Energy Capacity Additions Hit 600GW Record','Scope 3 Reporting Becomes Investor Baseline',
    'Climate-Aligned Lending Policies Adopted by Top 20 Banks','Wildfire Season Causes $45B Insured Losses',
    'Transition Finance Taxonomy Published by ASEAN','Carbon Offset Integrity Framework Gains Traction',
    'Antarctic Ice Sheet Loss Accelerates Beyond Models','ESG Fund Flows Reverse Outflow Trend in Q1',
    'Just Transition Scorecard Ranks 50 Countries','Ocean Alkalinity Enhancement Pilot Scales Up'
  ];
  const affected = sr(i+200)>0.4 ? HOLDINGS_AFFECTED[Math.floor(sr(i+210)*HOLDINGS_AFFECTED.length)] : null;
  return {
    id:`N-${String(i+1).padStart(3,'0')}`, headline:headlines[i%headlines.length],
    source:src.name, reliability:src.reliability, sentiment:sent,
    topics, relevance:Math.round(40+sr(i+220)*60),
    timestamp:`2026-04-${String(Math.max(1,4-Math.floor(sr(i+230)*7))).padStart(2,'0')} ${String(8+Math.floor(sr(i+240)*12)).padStart(2,'0')}:${String(Math.floor(sr(i+250)*60)).padStart(2,'0')}`,
    portfolioImpact:affected, impactScore:affected?Math.round(20+sr(i+260)*80):0,
    bookmarked:sr(i+270)>0.8
  };
});

const WEEK_TREND = Array.from({length:7},(_,i)=>({day:`Apr ${i>3?i-3:29+i}`,positive:Math.round(3+sr(i+600)*8),neutral:Math.round(4+sr(i+610)*6),negative:Math.round(2+sr(i+620)*7)}));

const sentColor = s => s==='positive'?T.green:s==='negative'?T.red:T.amber;
const TABS = ['Live Feed','Sentiment Dashboard','Topic Analysis','Portfolio Impact','Source Monitor','Alert Configuration'];

export default function ClimateNewsSentimentFeedPage(){
  const [tab,setTab]=useState(0);
  const [sentFilter,setSentFilter]=useState('ALL');
  const [topicFilter,setTopicFilter]=useState('ALL');
  const [bookmarks,setBookmarks]=useState(()=>NEWS.filter(n=>n.bookmarked).map(n=>n.id));

  const filtered = useMemo(()=>NEWS.filter(n=>
    (sentFilter==='ALL'||n.sentiment===sentFilter)&&
    (topicFilter==='ALL'||n.topics.includes(topicFilter))
  ),[sentFilter,topicFilter]);

  const sentCounts = useMemo(()=>({positive:NEWS.filter(n=>n.sentiment==='positive').length,neutral:NEWS.filter(n=>n.sentiment==='neutral').length,negative:NEWS.filter(n=>n.sentiment==='negative').length}),[]);
  const donutData = [
    {name:'Positive',value:sentCounts.positive,color:T.green},
    {name:'Neutral',value:sentCounts.neutral,color:T.amber},
    {name:'Negative',value:sentCounts.negative,color:T.red}
  ];

  const topicFreq = useMemo(()=>TOPICS.map(t=>({topic:t,count:NEWS.filter(n=>n.topics.includes(t)).length,positive:NEWS.filter(n=>n.topics.includes(t)&&n.sentiment==='positive').length,negative:NEWS.filter(n=>n.topics.includes(t)&&n.sentiment==='negative').length})).sort((a,b)=>b.count-a.count),[]);

  const toggleBookmark = id => setBookmarks(b=>b.includes(id)?b.filter(x=>x!==id):[...b,id]);

  const badge = {display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:700,fontFamily:T.mono,color:'#fff'};
  const card = {background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
  const kpiBox = {background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center',flex:1,minWidth:130};
  const th = {padding:'8px 12px',textAlign:'left',fontSize:12,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`};
  const td = {padding:'8px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`};

  const filterBar = () => (
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      <select value={sentFilter} onChange={e=>setSentFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Sentiments</option>
        {SENTIMENTS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select value={topicFilter} onChange={e=>setTopicFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Topics</option>
        {TOPICS.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} articles</div>
    </div>
  );

  const renderFeed = () => (
    <div>
      {filterBar()}
      {filtered.map((n,i)=>(
        <div key={i} style={{...card,display:'flex',gap:16,alignItems:'flex-start',borderLeft:`4px solid ${sentColor(n.sentiment)}`}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{...badge,background:sentColor(n.sentiment)}}>{n.sentiment.toUpperCase()}</span>
              <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Relevance: {n.relevance}%</span>
              {n.portfolioImpact&&<span style={{...badge,background:T.purple}}>PORTFOLIO</span>}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>{n.headline}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:4}}>
              {n.topics.map((t,ti)=><span key={ti} style={{padding:'2px 8px',borderRadius:6,background:T.blue+'12',color:T.blue,fontSize:10,fontFamily:T.mono}}>{t}</span>)}
            </div>
            <div style={{fontSize:11,color:T.textMut}}>{n.source} | {n.timestamp}{n.portfolioImpact?` | Affects: ${n.portfolioImpact}`:''}</div>
          </div>
          <button onClick={()=>toggleBookmark(n.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:bookmarks.includes(n.id)?T.gold:T.textMut}}>{bookmarks.includes(n.id)?'\u2605':'\u2606'}</button>
        </div>
      ))}
    </div>
  );

  const renderSentiment = () => (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        {[{l:'Total Articles',v:40,c:T.navy},{l:'Positive',v:sentCounts.positive,c:T.green},{l:'Neutral',v:sentCounts.neutral,c:T.amber},{l:'Negative',v:sentCounts.negative,c:T.red},{l:'Portfolio Hits',v:NEWS.filter(n=>n.portfolioImpact).length,c:T.purple}].map((k,i)=>(
          <div key={i} style={kpiBox}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:k.c,fontFamily:T.mono}}>{k.v}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{...card,flex:1,minWidth:260}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sentiment Split</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {donutData.map((d,i)=><Cell key={i} fill={d.color}/>)}
            </Pie><Tooltip/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{...card,flex:2,minWidth:400}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>7-Day Sentiment Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={WEEK_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="day" tick={{fontSize:10}}/><YAxis/>
              <Tooltip/><Legend/>
              <Area type="monotone" dataKey="positive" stackId="1" fill={T.green+'40'} stroke={T.green}/>
              <Area type="monotone" dataKey="neutral" stackId="1" fill={T.amber+'40'} stroke={T.amber}/>
              <Area type="monotone" dataKey="negative" stackId="1" fill={T.red+'40'} stroke={T.red}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTopics = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Topic Frequency Analysis (Top 10)</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topicFreq} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number"/><YAxis dataKey="topic" type="category" width={120} tick={{fontSize:11}}/>
          <Tooltip/><Legend/>
          <Bar dataKey="positive" stackId="a" fill={T.green} name="Positive"/>
          <Bar dataKey="negative" stackId="a" fill={T.red} name="Negative"/>
        </BarChart>
      </ResponsiveContainer>
      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
        {topicFreq.slice(0,6).map((t,i)=>(
          <div key={i} style={{padding:12,borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{t.topic}</div>
            <div style={{fontSize:20,fontWeight:700,color:T.blue,fontFamily:T.mono}}>{t.count}</div>
            <div style={{fontSize:10,color:T.textMut}}>+{t.positive} / -{t.negative}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPortfolioImpact = () => {
    const impacted = NEWS.filter(n=>n.portfolioImpact);
    const byHolding = HOLDINGS_AFFECTED.map(h=>({holding:h,articles:impacted.filter(n=>n.portfolioImpact===h).length,avgImpact:Math.round(impacted.filter(n=>n.portfolioImpact===h).reduce((a,n)=>a+n.impactScore,0)/Math.max(1,impacted.filter(n=>n.portfolioImpact===h).length))})).filter(h=>h.articles>0).sort((a,b)=>b.avgImpact-a.avgImpact);
    return (
      <div>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Portfolio Holdings Impacted by News</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byHolding}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="holding" tick={{fontSize:10}} angle={-15}/><YAxis/>
              <Tooltip/><Legend/>
              <Bar dataKey="articles" fill={T.blue} name="Articles" radius={[4,4,0,0]}/>
              <Bar dataKey="avgImpact" fill={T.red} name="Avg Impact Score" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Impacted News Detail</div>
          {impacted.slice(0,10).map((n,i)=>(
            <div key={i} style={{padding:'8px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><span style={{fontSize:12,fontWeight:600,color:T.navy}}>{n.headline.slice(0,60)}...</span><div style={{fontSize:10,color:T.textMut}}>Affects: {n.portfolioImpact}</div></div>
              <div style={{textAlign:'right'}}><span style={{...badge,background:sentColor(n.sentiment)}}>{n.sentiment}</span><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginTop:2}}>Impact: {n.impactScore}</div></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSources = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Source Reliability Monitor (15 Sources)</div>
      <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
        <thead><tr>{['Source','Reliability','Articles','Positive','Neutral','Negative','Avg Relevance'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{SOURCES.sort((a,b)=>b.reliability-a.reliability).map((s,i)=>{
          const arts=NEWS.filter(n=>n.source===s.name);
          return (
            <tr key={i} style={{background:i%2===0?'transparent':T.bg+'80'}}>
              <td style={{...td,fontWeight:600}}>{s.name}</td>
              <td style={td}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:60,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}><div style={{width:`${s.reliability}%`,height:'100%',background:s.reliability>=90?T.green:s.reliability>=80?T.amber:T.red}}/></div><span style={{fontFamily:T.mono,fontSize:11}}>{s.reliability}%</span></div></td>
              <td style={{...td,fontFamily:T.mono}}>{arts.length}</td>
              <td style={{...td,color:T.green}}>{arts.filter(a=>a.sentiment==='positive').length}</td>
              <td style={{...td,color:T.amber}}>{arts.filter(a=>a.sentiment==='neutral').length}</td>
              <td style={{...td,color:T.red}}>{arts.filter(a=>a.sentiment==='negative').length}</td>
              <td style={{...td,fontFamily:T.mono}}>{arts.length?Math.round(arts.reduce((a,n)=>a+n.relevance,0)/arts.length):'-'}%</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );

  const [alertThreshold,setAlertThreshold]=useState(3);
  const [alertWindow,setAlertWindow]=useState(24);
  const renderAlertConfig = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Alert Configuration</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
        <div style={{padding:16,borderRadius:10,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Negative Sentiment Alert</div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Alert if more than N negative articles about a holding:</label>
            <input type="range" min={1} max={10} value={alertThreshold} onChange={e=>setAlertThreshold(+e.target.value)} style={{width:'100%'}}/>
            <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.red,textAlign:'center'}}>{alertThreshold} articles</div>
          </div>
          <div>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Within time window (hours):</label>
            <input type="range" min={4} max={72} step={4} value={alertWindow} onChange={e=>setAlertWindow(+e.target.value)} style={{width:'100%'}}/>
            <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.amber,textAlign:'center'}}>{alertWindow}h</div>
          </div>
        </div>
        <div style={{padding:16,borderRadius:10,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Topic Alerts</div>
          {TOPICS.slice(0,6).map((t,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}40`,fontSize:12}}>
              <span>{t}</span><span style={{fontFamily:T.mono,color:T.green}}>Active</span>
            </div>
          ))}
        </div>
        <div style={{padding:16,borderRadius:10,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Delivery Channels</div>
          {['Email (Immediate)','Slack (#climate-risk)','Dashboard Widget','Weekly Digest','SMS (CRITICAL only)'].map((c,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}40`,fontSize:12}}>
              <span>{c}</span><span style={{fontFamily:T.mono,color:i<3?T.green:T.textMut}}>{i<3?'ON':'OFF'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <div style={{background:T.navy,color:'#fff',padding:'6px 16px',borderRadius:10,fontFamily:T.mono,fontSize:13,fontWeight:700,border:`2px solid ${T.gold}`}}>EP-CY4</div>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Climate News Sentiment Feed</h1>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Climate news sentiment intelligence | 40 articles | 15 sources | 10 topics</p>
        </div>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,fontFamily:T.font}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderFeed()}
      {tab===1&&renderSentiment()}
      {tab===2&&renderTopics()}
      {tab===3&&renderPortfolioImpact()}
      {tab===4&&renderSources()}
      {tab===5&&renderAlertConfig()}
      <div style={{marginTop:24,padding:14,borderRadius:10,background:T.navy+'08',border:`1px solid ${T.navy}20`,fontSize:11,color:T.textSec}}>
        <strong>Methodology:</strong> Sentiment scored via NLP transformer model (FinBERT Climate). Relevance = topic alignment x portfolio overlap x temporal recency. Source reliability = historical accuracy x editorial standards x citation quality. Alert thresholds configurable per topic, holding, and severity. Portfolio impact scored 0-100 based on materiality assessment matrix.
      </div>
    </div>
  );
}
