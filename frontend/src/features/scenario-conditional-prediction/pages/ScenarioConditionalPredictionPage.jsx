import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const NGFS = [
  { id:'NZ2050', name:'Net Zero 2050', carbonPrice:250, gdp:2.8, techCost:0.7, policy:90, color:T.green },
  { id:'BELOW2', name:'Below 2C', carbonPrice:180, gdp:2.2, techCost:0.8, policy:75, color:T.blue },
  { id:'DIV', name:'Divergent NZ', carbonPrice:300, gdp:1.5, techCost:0.6, policy:85, color:T.amber },
  { id:'DEL', name:'Delayed Trans.', carbonPrice:120, gdp:1.8, techCost:0.85, policy:55, color:T.orange },
  { id:'CPS', name:'Current Policies', carbonPrice:40, gdp:2.5, techCost:1.0, policy:30, color:T.red },
];

const ENTITIES = ['JPMorgan','Shell','Microsoft','HSBC','TotalEnergies','Unilever','Allianz','Enel','Siemens','BNP','BP','Nestle','BlackRock','NextEra','Tesla'];

const TABS = ['Scenario Builder','Conditional Predictions','Sensitivity Surface','Pathway Analysis','Scenario Comparison','Export'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function ScenarioConditionalPredictionPage() {
  const [tab, setTab] = useState(0);
  const [carbonPrice, setCarbonPrice] = useState(150);
  const [gdpGrowth, setGdpGrowth] = useState(2.0);
  const [techCost, setTechCost] = useState(0.8);
  const [policyStringency, setPolicyStringency] = useState(70);
  const [selEntity, setSelEntity] = useState('Shell');
  const [watchlist, setWatchlist] = useState([]);

  const predictions = useMemo(() => ENTITIES.map((e,i) => {
    const base = 55 + Math.sin(i*2.3)*18;
    const carbonEffect = (carbonPrice - 100) * 0.03;
    const gdpEffect = (gdpGrowth - 2) * 2;
    const techEffect = (1 - techCost) * 15;
    const policyEffect = (policyStringency - 50) * 0.1;
    const predicted = Math.round(Math.max(10, Math.min(95, base + carbonEffect + gdpEffect + techEffect + policyEffect)));
    return { entity:e, current:Math.round(base), predicted, delta:predicted-Math.round(base) };
  }), [carbonPrice, gdpGrowth, techCost, policyStringency]);

  const surfaceData = useMemo(() => {
    const rows = [];
    for(let cp=50; cp<=350; cp+=50) {
      for(let gd=-1; gd<=4; gd+=1) {
        const entityIdx = ENTITIES.indexOf(selEntity);
        const base = 55 + Math.sin(entityIdx*2.3)*18;
        const score = Math.round(Math.max(10, Math.min(95, base + (cp-100)*0.03 + (gd-2)*2 + (1-techCost)*15 + (policyStringency-50)*0.1)));
        rows.push({ carbonPrice:cp, gdp:gd, score });
      }
    }
    return rows;
  }, [selEntity, techCost, policyStringency]);

  const heatmapGrid = useMemo(() => {
    const cpValues = [50,100,150,200,250,300,350];
    const gdpValues = [-1,0,1,2,3,4];
    return { cpValues, gdpValues, data: cpValues.map(cp => {
      const row = { cp };
      gdpValues.forEach(gd => {
        const entityIdx = ENTITIES.indexOf(selEntity);
        const base = 55 + Math.sin(entityIdx*2.3)*18;
        row[`gdp_${gd}`] = Math.round(Math.max(10, Math.min(95, base + (cp-100)*0.03 + (gd-2)*2)));
      });
      return row;
    })};
  }, [selEntity]);

  const pathwayData = useMemo(() => ['2025','2026','2027','2028','2029','2030'].map((yr,yi) => {
    const row = { year: yr };
    NGFS.forEach(s => {
      const entityIdx = ENTITIES.indexOf(selEntity);
      const base = 55 + Math.sin(entityIdx*2.3)*18;
      const yearEffect = yi * ((s.carbonPrice-100)*0.005 + (s.gdp-2)*0.3);
      row[s.name] = Math.round(Math.max(10, Math.min(95, base + yearEffect)));
    });
    return row;
  }), [selEntity]);

  const comparisonData = useMemo(() => NGFS.map(s => {
    const entityIdx = ENTITIES.indexOf(selEntity);
    const base = 55 + Math.sin(entityIdx*2.3)*18;
    const predicted = Math.round(Math.max(10, Math.min(95, base + (s.carbonPrice-100)*0.03 + (s.gdp-2)*2 + (1-s.techCost)*15 + (s.policy-50)*0.1)));
    return { scenario:s.name, predicted, color:s.color, delta:predicted-Math.round(base) };
  }), [selEntity]);

  const scoreColor = (s) => s>=70?T.green:s>=50?T.amber:T.red;

  const renderScenarioBuilder = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:16}}>Custom Scenario Builder</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24}}>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Carbon Price ($/tCO2): <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>${carbonPrice}</span></label>
          <input type="range" min={20} max={500} step={10} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{width:'100%'}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>$20</span><span>$500</span></div>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>GDP Growth (%): <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{gdpGrowth.toFixed(1)}%</span></label>
          <input type="range" min={-2} max={5} step={0.1} value={gdpGrowth} onChange={e=>setGdpGrowth(+e.target.value)} style={{width:'100%'}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>-2%</span><span>5%</span></div>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Tech Cost Index: <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{techCost.toFixed(2)}</span></label>
          <input type="range" min={0.3} max={1.2} step={0.05} value={techCost} onChange={e=>setTechCost(+e.target.value)} style={{width:'100%'}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>0.3 (cheap)</span><span>1.2 (expensive)</span></div>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Policy Stringency: <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{policyStringency}%</span></label>
          <input type="range" min={10} max={100} value={policyStringency} onChange={e=>setPolicyStringency(+e.target.value)} style={{width:'100%'}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>10 (lax)</span><span>100 (strict)</span></div>
        </div>
      </div>
      <div style={{marginTop:20,display:'flex',gap:6,flexWrap:'wrap'}}>
        <div style={{fontSize:12,color:T.textSec,marginRight:8,lineHeight:'28px'}}>Presets:</div>
        {NGFS.map(s => (
          <button key={s.id} onClick={()=>{setCarbonPrice(s.carbonPrice);setGdpGrowth(s.gdp);setTechCost(s.techCost);setPolicyStringency(s.policy);}} style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${s.color}`,background:'transparent',fontSize:11,cursor:'pointer',color:s.color,fontWeight:500}}>{s.name}</button>
        ))}
      </div>
    </Card>
  );

  const renderConditional = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Conditional Predictions: If Carbon=${carbonPrice}/tCO2 & GDP={gdpGrowth.toFixed(1)}%</div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={predictions} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}} />
          <YAxis dataKey="entity" type="category" width={100} tick={{fontSize:10,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Bar dataKey="current" name="Current" fill={`${T.navy}40`} barSize={10} radius={[0,4,4,0]} />
          <Bar dataKey="predicted" name="Predicted" barSize={10} radius={[0,4,4,0]}>
            {predictions.map((d,i) => <Cell key={i} fill={d.delta>0?T.green:T.red} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderSurface = () => (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {ENTITIES.map(e => (
          <button key={e} onClick={()=>setSelEntity(e)} style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${selEntity===e?T.navy:T.border}`,background:selEntity===e?T.navy:'transparent',color:selEntity===e?'#fff':T.textSec,fontSize:11,cursor:'pointer'}}>{e}</button>
        ))}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Sensitivity Surface: {selEntity} Score vs (Carbon Price x GDP Growth)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',fontSize:11}}>
            <thead><tr>
              <th style={{padding:'6px 10px',color:T.textSec,fontWeight:600}}>$/tCO2 \ GDP%</th>
              {heatmapGrid.gdpValues.map(gd => <th key={gd} style={{padding:'6px 10px',color:T.textSec,fontWeight:600,textAlign:'center'}}>{gd}%</th>)}
            </tr></thead>
            <tbody>
              {heatmapGrid.data.map(row => (
                <tr key={row.cp}>
                  <td style={{padding:'6px 10px',fontFamily:T.mono,fontWeight:600,color:T.navy}}>${row.cp}</td>
                  {heatmapGrid.gdpValues.map(gd => {
                    const val = row[`gdp_${gd}`];
                    return <td key={gd} style={{padding:'6px 10px',textAlign:'center',background:`${scoreColor(val)}18`,fontFamily:T.mono,fontWeight:600,color:scoreColor(val)}}>{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderPathway = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Transition Pathway: {selEntity} Under 5 NGFS Scenarios (2025-2030)</div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={pathwayData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis domain={[20,90]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          {NGFS.map(s => <Line key={s.id} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{r:3}} />)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderComparison = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Scenario Comparison: {selEntity} Predictions</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="scenario" tick={{fontSize:10,fill:T.textSec}} />
          <YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Bar dataKey="predicted" name="Predicted Score" radius={[4,4,0,0]}>
            {comparisonData.map((d,i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginTop:16}}>
        {comparisonData.map(d => (
          <div key={d.scenario} style={{padding:10,border:`1px solid ${T.border}`,borderRadius:6,textAlign:'center',borderTop:`3px solid ${d.color}`}}>
            <div style={{fontSize:10,color:T.textMut}}>{d.scenario}</div>
            <div style={{fontFamily:T.mono,fontWeight:700,fontSize:18,color:d.color}}>{d.predicted}</div>
            <div style={{fontSize:10,fontFamily:T.mono,color:d.delta>0?T.green:T.red}}>{d.delta>0?'+':''}{d.delta}</div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderExport = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Export Scenario Analysis</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
        {['PDF Report','Excel Data Pack','PowerPoint Deck','API JSON'].map((fmt,i) => (
          <button key={i} style={{padding:16,border:`1px solid ${T.border}`,borderRadius:8,background:T.surface,cursor:'pointer',textAlign:'left'}}>
            <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{fmt}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Full scenario analysis with predictions</div>
          </button>
        ))}
      </div>
      <Card style={{marginTop:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Watchlist</div>
        {ENTITIES.slice(0,8).map(e => (
          <div key={e} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.textSec}}>{e}</span>
            <button onClick={()=>setWatchlist(w=>w.includes(e)?w.filter(x=>x!==e):[...w,e])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${watchlist.includes(e)?T.gold:T.border}`,background:watchlist.includes(e)?`${T.gold}15`:'transparent',fontSize:11,cursor:'pointer',color:watchlist.includes(e)?T.gold:T.textMut}}>{watchlist.includes(e)?'Watching':'Watch'}</button>
          </div>
        ))}
      </Card>
    </Card>
  );

  const panels = [renderScenarioBuilder, renderConditional, renderSurface, renderPathway, renderComparison, renderExport];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CX5" label="Scenario-Conditional Prediction" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Scenario-Conditional Prediction</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Build custom scenarios with 4 sliders; conditional predictions, sensitivity surface, pathway analysis</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Carbon" value={`$${carbonPrice}`} sub="/tCO2" />
            <KPI label="GDP" value={`${gdpGrowth.toFixed(1)}%`} sub="growth" color={T.gold} />
            <KPI label="Scenarios" value="5" sub="NGFS presets" color={T.teal} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Methodology</div>
          <div style={{fontSize:11,color:T.textSec}}>Conditional predictions use scenario-parameterized ensemble model (XGBoost + LightGBM + MLP). Carbon price, GDP growth, technology cost index, and policy stringency feed into the model as exogenous scenario variables. Sensitivity surface computed via grid evaluation (7x6 = 42 scenario combinations). NGFS Phase IV scenarios provide calibrated parameter sets for each named pathway.</div>
        </div>
      </div>
    </div>
  );
}
