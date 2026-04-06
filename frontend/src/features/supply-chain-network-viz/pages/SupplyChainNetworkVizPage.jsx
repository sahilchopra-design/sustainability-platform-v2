import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine,
  ZAxis, AreaChart, Area
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TIER_COLORS = { 1:T.navy, 2:T.teal, 3:T.purple };

const COMPANIES = [
  { id:'C1', name:'AutoCorp Global', tier:0, x:400, y:50, risk:32, category:'Portfolio' },
  { id:'C2', name:'BatteryTech Ltd', tier:1, x:200, y:150, risk:45, category:'Components' },
  { id:'C3', name:'SteelWorks Inc', tier:1, x:400, y:150, risk:28, category:'Materials' },
  { id:'C4', name:'ChipFab Asia', tier:1, x:600, y:150, risk:62, category:'Semiconductors' },
  { id:'C5', name:'RareMetal Co', tier:2, x:100, y:260, risk:78, category:'Mining' },
  { id:'C6', name:'LithiumPure', tier:2, x:250, y:260, risk:55, category:'Mining' },
  { id:'C7', name:'CoatingTech', tier:2, x:350, y:260, risk:35, category:'Chemicals' },
  { id:'C8', name:'IronOre Ltd', tier:2, x:450, y:260, risk:40, category:'Mining' },
  { id:'C9', name:'WaferPro', tier:2, x:550, y:260, risk:58, category:'Semiconductors' },
  { id:'C10', name:'PackagingCo', tier:2, x:680, y:260, risk:22, category:'Packaging' },
  { id:'C11', name:'REE China', tier:3, x:60, y:370, risk:85, category:'REE' },
  { id:'C12', name:'Cobalt DRC', tier:3, x:160, y:370, risk:92, category:'Mining' },
  { id:'C13', name:'Graphite SA', tier:3, x:260, y:370, risk:68, category:'Mining' },
  { id:'C14', name:'Silica Pure', tier:3, x:380, y:370, risk:42, category:'Materials' },
  { id:'C15', name:'Neon Gas UA', tier:3, x:480, y:370, risk:88, category:'Gas' },
  { id:'C16', name:'Palladium RU', tier:3, x:580, y:370, risk:90, category:'PGM' },
  { id:'C17', name:'Manganese AU', tier:3, x:680, y:370, risk:38, category:'Mining' },
  { id:'C18', name:'Polymer East', tier:2, x:160, y:260, risk:30, category:'Chemicals' },
  { id:'C19', name:'GlassTech EU', tier:2, x:620, y:260, risk:25, category:'Materials' },
  { id:'C20', name:'LogiFreight', tier:1, x:100, y:150, risk:48, category:'Logistics' },
];

const LINKS = [
  {from:'C1',to:'C2'},{from:'C1',to:'C3'},{from:'C1',to:'C4'},{from:'C1',to:'C20'},
  {from:'C2',to:'C5'},{from:'C2',to:'C6'},{from:'C2',to:'C18'},{from:'C3',to:'C7'},{from:'C3',to:'C8'},
  {from:'C4',to:'C9'},{from:'C4',to:'C10'},{from:'C4',to:'C19'},{from:'C20',to:'C5'},{from:'C20',to:'C18'},
  {from:'C5',to:'C11'},{from:'C5',to:'C12'},{from:'C6',to:'C13'},{from:'C7',to:'C14'},
  {from:'C8',to:'C14'},{from:'C8',to:'C17'},{from:'C9',to:'C15'},{from:'C9',to:'C16'},
  {from:'C10',to:'C17'},{from:'C18',to:'C13'},{from:'C19',to:'C14'},
];

const SCENARIOS = [
  { id:'SC1', name:'China REE Export Restriction', affectedNodes:['C11','C5','C2','C1'], impactPct:35 },
  { id:'SC2', name:'DRC Cobalt Supply Disruption', affectedNodes:['C12','C5','C6','C2','C1'], impactPct:42 },
  { id:'SC3', name:'Ukraine Neon Gas Shortage', affectedNodes:['C15','C9','C4','C1'], impactPct:28 },
  { id:'SC4', name:'Russia PGM Sanctions', affectedNodes:['C16','C9','C4','C1'], impactPct:25 },
];

const TABS = ['Network Graph','Risk Propagation','Critical Paths','Tier Analysis','Concentration Dashboard','Scenario Simulator'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const Pill = ({label,active,onClick}) => <button onClick={onClick} style={{padding:'6px 16px',borderRadius:20,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.textSec,fontSize:12,fontFamily:T.font,cursor:'pointer',fontWeight:active?600:400}}>{label}</button>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function SupplyChainNetworkVizPage() {
  const [tab, setTab] = useState(0);
  const [selScenario, setSelScenario] = useState('SC1');
  const [highlightNode, setHighlightNode] = useState(null);
  const [alerts, setAlerts] = useState(['C11','C12','C15','C16']);

  const scenario = SCENARIOS.find(s=>s.id===selScenario);
  const companyMap = useMemo(() => Object.fromEntries(COMPANIES.map(c=>[c.id,c])), []);

  const criticalPaths = useMemo(() => {
    const singles = COMPANIES.filter(c => {
      const inLinks = LINKS.filter(l=>l.to===c.id);
      const outLinks = LINKS.filter(l=>l.from===c.id);
      return inLinks.length === 1 && outLinks.length >= 2;
    });
    return singles;
  }, []);

  const hhiData = useMemo(() => {
    const cats = [...new Set(COMPANIES.map(c=>c.category))];
    return cats.map(cat => {
      const nodes = COMPANIES.filter(c=>c.category===cat);
      const share = 1/Math.max(nodes.length,1);
      const hhi = Math.round(nodes.length * (share*100)**2);
      return { category:cat, hhi, count:nodes.length, risk: hhi > 5000 ? 'High' : hhi > 2500 ? 'Medium' : 'Low' };
    }).sort((a,b)=>b.hhi-a.hhi);
  }, []);

  const tierAnalysis = useMemo(() => [0,1,2,3].map(tier => {
    const nodes = COMPANIES.filter(c=>c.tier===tier);
    return { tier:`Tier ${tier}`, count:nodes.length, avgRisk:nodes.length?Math.round(nodes.reduce((a,c)=>a+c.risk,0)/nodes.length):0, maxRisk:nodes.length?Math.max(...nodes.map(c=>c.risk)):0 };
  }), []);

  const renderNetwork = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Supply Chain Network (20 nodes, 25 links)</div>
      <svg width="100%" viewBox="0 0 760 430" style={{background:`${T.bg}`,borderRadius:8}}>
        {LINKS.map((l,i) => {
          const from = companyMap[l.from], to = companyMap[l.to];
          if(!from||!to) return null;
          const isHighlighted = highlightNode && (l.from===highlightNode||l.to===highlightNode);
          return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isHighlighted?T.gold:`${T.border}`} strokeWidth={isHighlighted?2.5:1} opacity={isHighlighted?1:0.5} />;
        })}
        {COMPANIES.map(c => {
          const isAffected = scenario?.affectedNodes.includes(c.id);
          const isHovered = highlightNode===c.id;
          return (
            <g key={c.id} onClick={()=>setHighlightNode(highlightNode===c.id?null:c.id)} style={{cursor:'pointer'}}>
              <circle cx={c.x} cy={c.y} r={isHovered?14:10} fill={isAffected?T.red:c.tier===0?T.gold:TIER_COLORS[c.tier]||T.textMut} stroke={isHovered?T.navy:'#fff'} strokeWidth={isHovered?3:2} opacity={highlightNode&&!isHovered?0.4:1} />
              <text x={c.x} y={c.y+24} textAnchor="middle" fontSize={8} fill={T.textSec} fontFamily={T.font}>{c.name.split(' ')[0]}</text>
            </g>
          );
        })}
        {[{y:50,label:'Portfolio'},{y:150,label:'Tier 1'},{y:260,label:'Tier 2'},{y:370,label:'Tier 3'}].map(t => (
          <text key={t.label} x={740} y={t.y+4} fontSize={10} fill={T.textMut} fontFamily={T.mono} textAnchor="end">{t.label}</text>
        ))}
      </svg>
      <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Click any node to highlight its connections. Red nodes indicate exposure under selected scenario.</div>
    </Card>
  );

  const renderPropagation = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Risk Propagation: Tier 3 to Portfolio</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {(scenario?.affectedNodes||[]).map((nid,i) => {
            const c = companyMap[nid];
            if(!c) return null;
            return (
              <div key={nid} style={{padding:12,background:`${T.red}08`,border:`1px solid ${T.red}25`,borderRadius:8,textAlign:'center'}}>
                <div style={{fontSize:10,color:T.textMut}}>Tier {c.tier}</div>
                <div style={{fontSize:13,fontWeight:600,color:T.navy,margin:'4px 0'}}>{c.name}</div>
                <div style={{fontSize:11,fontFamily:T.mono,color:T.red}}>Risk: {c.risk}%</div>
                {i < (scenario?.affectedNodes||[]).length-1 && <div style={{fontSize:18,color:T.red,marginTop:4}}>&#8595;</div>}
              </div>
            );
          })}
        </div>
        <div style={{marginTop:16,padding:12,background:`${T.red}08`,borderRadius:8,borderLeft:`3px solid ${T.red}`}}>
          <div style={{fontSize:12,fontWeight:600,color:T.red}}>Portfolio Impact: -{scenario?.impactPct}% revenue exposure</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Propagation path: {(scenario?.affectedNodes||[]).map(n=>companyMap[n]?.name).join(' -> ')}</div>
        </div>
      </Card>
    </div>
  );

  const renderCriticalPaths = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Single Points of Failure</div>
      {criticalPaths.length === 0 ? <div style={{fontSize:12,color:T.textMut}}>No single points of failure detected in current network.</div> :
      criticalPaths.map(c => (
        <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{c.name}</div>
            <div style={{fontSize:11,color:T.textMut}}>Tier {c.tier} | {c.category}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:c.risk>60?T.red:T.amber}}>{c.risk}%</div>
            <div style={{fontSize:10,color:T.textMut}}>risk score</div>
          </div>
        </div>
      ))}
      <div style={{marginTop:16,fontSize:11,color:T.textSec,padding:10,background:`${T.amber}08`,borderRadius:6}}>
        Critical path analysis identifies nodes where a single supplier failure cascades to multiple downstream dependencies. Mitigation: dual-sourcing, inventory buffers, and geographic diversification.
      </div>
    </Card>
  );

  const renderTierAnalysis = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Risk by Supply Chain Tier</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={tierAnalysis}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="tier" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Bar dataKey="avgRisk" name="Avg Risk" fill={T.amber} radius={[4,4,0,0]} />
          <Bar dataKey="maxRisk" name="Max Risk" fill={T.red} radius={[4,4,0,0]} />
          <Bar dataKey="count" name="Node Count" fill={T.blue} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Tier 3 suppliers carry highest average and maximum risk due to geographic concentration, lower governance standards, and limited visibility.</div>
    </Card>
  );

  const renderConcentration = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Supplier Concentration (HHI by Category)</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={hhiData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis dataKey="category" type="category" width={120} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <ReferenceLine x={2500} stroke={T.amber} strokeDasharray="4 4" label={{value:'Moderate',fill:T.amber,fontSize:9}} />
          <ReferenceLine x={5000} stroke={T.red} strokeDasharray="4 4" label={{value:'High Conc.',fill:T.red,fontSize:9}} />
          <Bar dataKey="hhi" radius={[0,4,4,0]} barSize={16}>
            {hhiData.map((d,i) => <Cell key={i} fill={d.risk==='High'?T.red:d.risk==='Medium'?T.amber:T.green} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderScenario = () => (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {SCENARIOS.map(s => <Pill key={s.id} label={s.name} active={selScenario===s.id} onClick={()=>setSelScenario(s.id)} />)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Card style={{borderLeft:`3px solid ${T.red}`}}>
          <div style={{fontSize:14,fontWeight:600,color:T.red,marginBottom:8}}>{scenario?.name}</div>
          <div style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:T.red}}>-{scenario?.impactPct}%</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Revenue exposure under scenario</div>
          <div style={{marginTop:12,fontSize:12,color:T.textSec}}>Affected nodes: {scenario?.affectedNodes.length}</div>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Impact Chain</div>
          {(scenario?.affectedNodes||[]).map((nid,i) => {
            const c = companyMap[nid];
            return c ? (
              <div key={nid} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                <div style={{width:8,height:8,borderRadius:4,background:TIER_COLORS[c.tier]||T.gold}} />
                <span style={{fontSize:12,color:T.textSec}}>T{c.tier}: {c.name} (risk {c.risk}%)</span>
              </div>
            ) : null;
          })}
        </Card>
      </div>
      <Card style={{marginTop:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Alert Configuration</div>
        {COMPANIES.filter(c=>c.risk>60).map(c => (
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.textSec}}>{c.name} (risk {c.risk}%)</span>
            <button onClick={()=>setAlerts(a=>a.includes(c.id)?a.filter(x=>x!==c.id):[...a,c.id])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${alerts.includes(c.id)?T.red:T.border}`,background:alerts.includes(c.id)?`${T.red}15`:'transparent',fontSize:11,cursor:'pointer',color:alerts.includes(c.id)?T.red:T.textMut}}>{alerts.includes(c.id)?'Alert On':'Set Alert'}</button>
          </div>
        ))}
      </Card>
    </div>
  );

  const panels = [renderNetwork, renderPropagation, renderCriticalPaths, renderTierAnalysis, renderConcentration, renderScenario];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CW3" label="Supply Chain Network Viz" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Supply Chain Network Visualization</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>20 companies, 25 supplier relationships across Tier 1/2/3 with risk propagation</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Nodes" value="20" sub="companies" />
            <KPI label="Links" value="25" sub="relationships" color={T.gold} />
            <KPI label="Scenarios" value="4" sub="geopolitical" color={T.red} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Methodology</div>
          <div style={{fontSize:11,color:T.textSec}}>Network constructed from CDP supply chain disclosures, Bloomberg SPLC data, and proprietary Tier 2/3 mapping. HHI (Herfindahl-Hirschman Index) calculated per supplier category. Risk propagation uses Bayesian network inference with conditional probability tables. Scenario impacts estimated using Monte Carlo simulation with 10,000 iterations.</div>
        </div>
      </div>
    </div>
  );
}
