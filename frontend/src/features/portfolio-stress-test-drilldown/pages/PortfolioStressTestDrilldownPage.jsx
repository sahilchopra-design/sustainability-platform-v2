import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SCENARIOS = [
  { id:'NZ2050', name:'Net Zero 2050', carbonPrice:250, gdpShock:-1.2, color:T.green },
  { id:'BELOW2', name:'Below 2C', carbonPrice:180, gdpShock:-2.5, color:T.blue },
  { id:'DIV', name:'Divergent Net Zero', carbonPrice:300, gdpShock:-3.8, color:T.amber },
  { id:'DEL', name:'Delayed Transition', carbonPrice:120, gdpShock:-5.2, color:T.orange },
  { id:'CPS', name:'Current Policies', carbonPrice:40, gdpShock:-8.5, color:T.red },
];

const HOLDINGS = Array.from({length:20}, (_,i) => {
  const sectors = ['Energy','Financials','Tech','Industrials','Utilities','Materials','Healthcare','Consumer','RE','Telecom'];
  const geos = ['US','EU','UK','JP','CN','AU','IN','BR','CA','KR'];
  const s = sectors[i%10];
  return {
    id:`H${i+1}`, name:`${s} Corp ${Math.floor(i/10)+1}`, sector:s, geo:geos[i%10],
    weight: Math.round(3+Math.sin(i*1.7)*2.5,1),
    baseScore: Math.round(45+Math.sin(i*2.3)*25),
    topicScores: { env:Math.round(50+Math.sin(i)*20), climate:Math.round(45+Math.cos(i)*22), gov:Math.round(60+Math.sin(i*0.8)*15), soc:Math.round(55+Math.cos(i*1.2)*18), bio:Math.round(35+Math.sin(i*1.5)*20), supply:Math.round(50+Math.cos(i*0.6)*15), human:Math.round(55+Math.sin(i*1.1)*14), innov:Math.round(60+Math.cos(i*0.9)*18) },
    scenarioImpact: { NZ2050:Math.round(-2+Math.sin(i)*6), BELOW2:Math.round(-4+Math.sin(i)*8), DIV:Math.round(-6+Math.sin(i)*10), DEL:Math.round(-8+Math.sin(i)*12), CPS:Math.round(-12+Math.sin(i)*15) }
  };
});

const TABS = ['Scenario Selection','Portfolio Impact','Entity Contribution','Taxonomy Drill','Historical Comparison','Reverse Stress'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const Pill = ({label,active,onClick}) => <button onClick={onClick} style={{padding:'6px 16px',borderRadius:20,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.textSec,fontSize:12,fontFamily:T.font,cursor:'pointer',fontWeight:active?600:400}}>{label}</button>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function PortfolioStressTestDrilldownPage() {
  const [tab, setTab] = useState(0);
  const [selScenario, setSelScenario] = useState('NZ2050');
  const [drillTopic, setDrillTopic] = useState('climate');
  const [carbonSlider, setCarbonSlider] = useState(150);
  const [gdpSlider, setGdpSlider] = useState(-3);
  const [watchlist, setWatchlist] = useState([]);

  const scenario = SCENARIOS.find(s=>s.id===selScenario);

  const portfolioImpact = useMemo(() => SCENARIOS.map(s => ({
    name: s.name,
    totalLoss: Math.round(HOLDINGS.reduce((a,h)=>a+h.weight*h.scenarioImpact[s.id]/100,0)*100)/100,
    color: s.color
  })), []);

  const entityContrib = useMemo(() => HOLDINGS.map(h => ({
    name: h.name.replace(/ Corp \d/,''),
    impact: Math.round(h.weight * h.scenarioImpact[selScenario] / 100 * 100)/100,
    weight: h.weight
  })).sort((a,b)=>a.impact-b.impact), [selScenario]);

  const topicDrill = useMemo(() => {
    const topics = Object.keys(HOLDINGS[0].topicScores);
    return topics.map(t => ({
      topic: t.charAt(0).toUpperCase()+t.slice(1),
      contribution: Math.round(HOLDINGS.reduce((a,h) => a + (100-h.topicScores[t])*h.weight*0.01, 0)*10)/10
    })).sort((a,b)=>b.contribution-a.contribution);
  }, []);

  const histComparison = useMemo(() => ['2024-Q1','2024-Q2','2024-Q3','2024-Q4','2025-Q1'].map((q,qi) => {
    const row = { q };
    SCENARIOS.forEach(s => { row[s.name] = Math.round(portfolioImpact.find(p=>p.name===s.name).totalLoss * (0.8+qi*0.05) * 10)/10; });
    return row;
  }), [portfolioImpact]);

  const reverseStress = useMemo(() => {
    const threshold = -20;
    return SCENARIOS.map(s => {
      const baseImpact = portfolioImpact.find(p=>p.name===s.name)?.totalLoss || 0;
      const multiplier = baseImpact !== 0 ? threshold / baseImpact : 0;
      return { scenario:s.name, carbonNeeded:Math.round(s.carbonPrice*Math.abs(multiplier)), gdpNeeded:Math.round(s.gdpShock*Math.abs(multiplier)*10)/10, color:s.color };
    });
  }, [portfolioImpact]);

  const renderScenarioSelection = () => (
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
      {SCENARIOS.map(s => (
        <Card key={s.id} style={{borderTop:`3px solid ${s.color}`,cursor:'pointer',opacity:selScenario===s.id?1:0.7}} onClick={()=>setSelScenario(s.id)}>
          <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{s.name}</div>
          <div style={{marginTop:8,fontSize:11,color:T.textSec}}>Carbon: ${s.carbonPrice}/tCO2</div>
          <div style={{fontSize:11,color:T.textSec}}>GDP Shock: {s.gdpShock}%</div>
          <div style={{marginTop:8,fontSize:18,fontWeight:700,fontFamily:T.mono,color:s.color}}>
            {portfolioImpact.find(p=>p.name===s.name)?.totalLoss.toFixed(1)}%
          </div>
          <div style={{fontSize:10,color:T.textMut}}>portfolio impact</div>
        </Card>
      ))}
    </div>
  );

  const renderPortfolioImpact = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Portfolio-Level Impact Under Each Scenario</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={portfolioImpact}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} />
          <YAxis tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <ReferenceLine y={0} stroke={T.navy} />
          <Bar dataKey="totalLoss" name="Portfolio Impact %" radius={[4,4,0,0]}>
            {portfolioImpact.map((d,i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderEntityContribution = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Entity Contribution to Portfolio Risk ({scenario?.name})</div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={entityContrib} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis dataKey="name" type="category" width={90} tick={{fontSize:10,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <ReferenceLine x={0} stroke={T.navy} />
          <Bar dataKey="impact" name="Impact %" radius={[0,4,4,0]} barSize={12}>
            {entityContrib.map((d,i) => <Cell key={i} fill={d.impact<0?T.red:T.green} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderTaxonomyDrill = () => (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {Object.keys(HOLDINGS[0].topicScores).map(t => <Pill key={t} label={t} active={drillTopic===t} onClick={()=>setDrillTopic(t)} />)}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Taxonomy Topic Contribution to Stress Loss</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topicDrill}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="topic" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <Bar dataKey="contribution" name="Stress Contribution %" fill={T.navy} radius={[4,4,0,0]}>
              {topicDrill.map((d,i) => <Cell key={i} fill={i===0?T.red:i<3?T.amber:T.blue} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderHistorical = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Historical Stress Test Comparison (Rolling)</div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={histComparison}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          {SCENARIOS.map(s => <Line key={s.id} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{r:3}} />)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderReverseStress = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>Reverse Stress Test: What Causes &gt;20% Portfolio Loss?</div>
        <div style={{display:'flex',gap:24,marginBottom:16}}>
          <div style={{flex:1}}>
            <label style={{fontSize:11,color:T.textSec}}>Carbon Price ($/tCO2): {carbonSlider}</label>
            <input type="range" min={20} max={500} value={carbonSlider} onChange={e=>setCarbonSlider(+e.target.value)} style={{width:'100%'}} />
          </div>
          <div style={{flex:1}}>
            <label style={{fontSize:11,color:T.textSec}}>GDP Shock (%): {gdpSlider}</label>
            <input type="range" min={-15} max={0} step={0.5} value={gdpSlider} onChange={e=>setGdpSlider(+e.target.value)} style={{width:'100%'}} />
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Scenario','Carbon Price Needed','GDP Shock Needed'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {reverseStress.map(r => (
                <tr key={r.scenario} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'8px 12px',fontWeight:500,color:T.navy}}>{r.scenario}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.red}}>${r.carbonNeeded}/tCO2</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.red}}>{r.gdpNeeded}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card style={{marginTop:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Watchlist</div>
        {HOLDINGS.slice(0,8).map(h => (
          <div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.textSec}}>{h.name}</span>
            <button onClick={()=>setWatchlist(w=>w.includes(h.id)?w.filter(x=>x!==h.id):[...w,h.id])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${watchlist.includes(h.id)?T.gold:T.border}`,background:watchlist.includes(h.id)?`${T.gold}15`:'transparent',fontSize:11,cursor:'pointer',color:watchlist.includes(h.id)?T.gold:T.textMut}}>{watchlist.includes(h.id)?'Watching':'Watch'}</button>
          </div>
        ))}
      </Card>
    </div>
  );

  const panels = [renderScenarioSelection, renderPortfolioImpact, renderEntityContribution, renderTaxonomyDrill, renderHistorical, renderReverseStress];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CW4" label="Portfolio Stress Test Drilldown" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Portfolio Stress Test Drilldown</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>5 NGFS scenarios applied to 20 portfolio holdings with taxonomy drill and reverse stress</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Scenarios" value="5" sub="NGFS" />
            <KPI label="Holdings" value="20" sub="10 sectors" color={T.gold} />
            <KPI label="Max Loss" value={`${Math.min(...portfolioImpact.map(p=>p.totalLoss)).toFixed(1)}%`} sub="CPS scenario" color={T.red} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>NGFS Reference</div>
          <div style={{fontSize:11,color:T.textSec}}>Stress tests use NGFS Phase IV scenarios (June 2024) with REMIND-MAgPIE integrated assessment model. Carbon prices, GDP shocks, and energy mix transitions are scenario-specific. Reverse stress test solves for the parameter combination that triggers a user-defined portfolio loss threshold using Newton-Raphson iteration.</div>
        </div>
      </div>
    </div>
  );
}
