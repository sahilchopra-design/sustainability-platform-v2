import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const seed = 120;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS = ['#059669','#f59e0b','#ef4444','#0284c7','#7c3aed','#6b7280'];
const SECTORS = ['Energy','Technology','Financials','Healthcare','Industrials','Materials','Consumer','Real Estate','Utilities','Agriculture'];
const SOURCES = ['Reuters','Bloomberg','FT','MSCI ESG','Sustainalytics','RepRisk','UNGC','NGO Reports','Regulatory Filings','Social Media'];
const TABS = ['Sentiment Overview','Source Analysis','Topic Decomposition','Trend Monitor','Alert Configuration'];

const tblStyle = {width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle = {border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle = {border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle = {marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

function Tab1({entityName,sector}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const dims = [{dim:'Environmental',score:Math.round(40+rng(1)*55)},{dim:'Social',score:Math.round(35+rng(2)*60)},{dim:'Governance',score:Math.round(45+rng(3)*50)},{dim:'Transition',score:Math.round(30+rng(4)*65)},{dim:'Regulatory',score:Math.round(40+rng(5)*55)}];
  const overall = Math.round(dims.reduce((s,d)=>s+d.score,0)/dims.length);
  const sentimentLabel = overall>=65?'Positive':overall>=45?'Neutral':'Negative';
  const sentimentColor = overall>=65?'green':overall>=45?'yellow':'red';
  const run = useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/sentiment-analysis/assess',{entity_name:entityName,sector}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[entityName,sector]);
  return (
    <div>
      <Section title="Run Sentiment Analysis">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Analysing…':'Analyse ESG Sentiment'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Overall Sentiment" value={`${overall}/100`} sub={`${sentimentLabel} — ${sector}`} />
        <KpiCard label="Articles Analysed" value={Math.round(200+rng(6)*800)} sub="Last 30 days" />
        <KpiCard label="Controversy Mentions" value={Math.round(5+rng(7)*30)} sub="Negative signal count" />
        <KpiCard label="Momentum" value={rng(8)>0.5?'Improving':'Declining'} sub="30-day vs 90-day" />
      </Row>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontSize:13,color:'#6b7280'}}>Sentiment Classification:</span>
        <Badge color={sentimentColor}>{sentimentLabel}</Badge>
      </div>
      <Section title="5-Dimension ESG Sentiment Radar">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={dims}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="dim" tick={{fontSize:11}} />
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
            <Radar name="Sentiment" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2() {
  const sourceData = SOURCES.map((s,i)=>({
    source: s,
    positive: Math.round(20+rng(i+10)*50),
    neutral: Math.round(15+rng(i+11)*30),
    negative: Math.round(5+rng(i+12)*25),
  }));
  const pieData = [{name:'Positive',value:Math.round(40+rng(20)*20)},{name:'Neutral',value:Math.round(20+rng(21)*15)},{name:'Negative',value:Math.round(10+rng(22)*15)}];
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Sentiment by Source">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sourceData} layout="vertical" margin={{left:120}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="source" tick={{fontSize:10}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill="#059669" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Overall Sentiment Split">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((_,i)=><Cell key={i} fill={['#059669','#f59e0b','#ef4444'][i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

function Tab3() {
  const topics = ['Climate Transition','Carbon Emissions','Biodiversity','Labour Rights','Board Diversity','Supply Chain','Greenwashing','Regulatory Compliance','Water Risk','Data Privacy'];
  const topicData = topics.map((t,i)=>({
    topic: t.length>16?t.substring(0,14)+'…':t,
    full: t,
    mentions: Math.round(10+rng(i+30)*100),
    sentiment: Math.round(20+rng(i+31)*75),
  }));
  return (
    <div>
      <Row>
        <KpiCard label="Top Topic" value={topicData.sort((a,b)=>b.mentions-a.mentions)[0].full} sub={`${topicData[0].mentions} mentions`} />
        <KpiCard label="Most Positive" value={topicData.sort((a,b)=>b.sentiment-a.sentiment)[0].full} sub={`Sentiment: ${topicData[0].sentiment}/100`} />
        <KpiCard label="Most Negative" value={topicData.sort((a,b)=>a.sentiment-b.sentiment)[0].full} sub={`Sentiment: ${topicData[0].sentiment}/100`} />
        <KpiCard label="Topics Tracked" value={topics.length} sub="ESG topic taxonomy" />
      </Row>
      <Section title="Topic Mention Volume & Sentiment Score">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topicData.sort((a,b)=>b.mentions-a.mentions)} layout="vertical" margin={{left:120}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="topic" tick={{fontSize:10}} />
            <Tooltip content={({payload})=>payload&&payload[0]?<div style={{background:'#fff',border:'1px solid #e5e7eb',padding:8,borderRadius:6,fontSize:12}}><div style={{fontWeight:600}}>{payload[0].payload.full}</div><div>Mentions: {payload[0].payload.mentions}</div><div>Sentiment: {payload[0].payload.sentiment}/100</div></div>:null} />
            <Bar dataKey="mentions" name="Mentions">
              {topicData.map((d,i)=><Cell key={i} fill={d.sentiment>=60?'#059669':d.sentiment>=40?'#f59e0b':'#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab4() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = months.map((m,i)=>({
    month: m,
    environmental: Math.round(40+rng(i+40)*30+Math.sin(i*0.8)*10),
    social: Math.round(45+rng(i+41)*25+Math.cos(i*0.6)*8),
    governance: Math.round(50+rng(i+42)*20+Math.sin(i*0.5)*6),
  }));
  return (
    <div>
      <Row>
        <KpiCard label="E Trend" value={trendData[11].environmental>trendData[0].environmental?'Improving':'Declining'} sub="12-month environmental sentiment" />
        <KpiCard label="S Trend" value={trendData[11].social>trendData[0].social?'Improving':'Declining'} sub="12-month social sentiment" />
        <KpiCard label="G Trend" value={trendData[11].governance>trendData[0].governance?'Improving':'Declining'} sub="12-month governance sentiment" />
        <KpiCard label="Volatility" value={`${Math.round(5+rng(50)*15)}%`} sub="Sentiment standard deviation" />
      </Row>
      <Section title="E / S / G Sentiment Trend (12 Months)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[20,80]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="environmental" stroke="#059669" strokeWidth={2} name="Environmental" />
            <Line type="monotone" dataKey="social" stroke="#0284c7" strokeWidth={2} name="Social" />
            <Line type="monotone" dataKey="governance" stroke="#7c3aed" strokeWidth={2} name="Governance" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab5() {
  const alerts = [
    {rule:'Sentiment drops below 30',threshold:'<30',channel:'Email + Slack',active:true},
    {rule:'Controversy spike (>5 in 24h)',threshold:'>5/day',channel:'Slack',active:true},
    {rule:'Negative media coverage >10 articles',threshold:'>10 articles',channel:'Email',active:rng(60)>0.3},
    {rule:'Regulatory action mentioned',threshold:'Any mention',channel:'Email + SMS',active:true},
    {rule:'Greenwashing allegation detected',threshold:'NLP trigger',channel:'Slack',active:rng(61)>0.4},
    {rule:'ESG rating downgrade signal',threshold:'Rating change',channel:'Email',active:rng(62)>0.5},
  ];
  return (
    <div>
      <Row>
        <KpiCard label="Active Alerts" value={alerts.filter(a=>a.active).length} sub={`Out of ${alerts.length} configured`} />
        <KpiCard label="Alerts Fired (30d)" value={Math.round(3+rng(63)*12)} sub="Triggered in last 30 days" />
        <KpiCard label="Channels" value="3" sub="Email · Slack · SMS" />
        <KpiCard label="Response SLA" value="<2h" sub="Average acknowledgement time" />
      </Row>
      <Section title="Alert Rules Configuration">
        <table style={tblStyle}>
          <thead><tr>{['Rule','Threshold','Channel','Status'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{alerts.map((a,i)=>(<tr key={i}>
            <td style={{...tdStyle,fontWeight:500}}>{a.rule}</td>
            <td style={{...tdStyle,fontFamily:'monospace'}}>{a.threshold}</td>
            <td style={{...tdStyle,fontSize:12,color:'#6b7280'}}>{a.channel}</td>
            <td style={tdStyle}><Badge color={a.active?'green':'gray'}>{a.active?'Active':'Inactive'}</Badge></td>
          </tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

export default function SentimentAnalysisPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [entityName,setEntityName]=useState('Global Energy Holdings');
  const [sector,setSector]=useState('Energy');
  const panels=[<Tab1 entityName={entityName} sector={sector}/>,<Tab2/>,<Tab3/>,<Tab4/>,<Tab5/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827',margin:0}}>ESG Sentiment Analysis Engine</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>NLP Sentiment · Multi-Source · Topic Decomposition · Trend Monitoring · Alert Configuration</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Inp label="Entity Name" value={entityName} onChange={e=>setEntityName(e.target.value)} />
            <Sel label="Sector" value={sector} onChange={e=>setSector(e.target.value)}>
              {SECTORS.map(o=><option key={o}>{o}</option>)}
            </Sel>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setActiveTab(i)} style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',color:activeTab===i?'#059669':'#6b7280',transition:'color 0.15s'}}>{t}</button>))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>{panels[activeTab]}</div>
      </div>
    </div>
  );
}
