import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
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

const ENTITY_COLORS = [T.navy, T.gold, T.teal, T.purple];

const ENTITIES = [
  { id:'E1', name:'JPMorgan Chase', type:'FI', sector:'Banking', scores:{env:72,soc:68,gov:81,climate:65,bio:42,supply:58,human:74,innovation:69}, history:[{q:'Q1-25',s:68},{q:'Q2-25',s:70},{q:'Q3-25',s:71},{q:'Q4-25',s:72},{q:'Q1-26',s:73}] },
  { id:'E2', name:'HSBC Holdings', type:'FI', sector:'Banking', scores:{env:67,soc:71,gov:78,climate:62,bio:38,supply:55,human:70,innovation:64}, history:[{q:'Q1-25',s:63},{q:'Q2-25',s:65},{q:'Q3-25',s:66},{q:'Q4-25',s:67},{q:'Q1-26',s:68}] },
  { id:'E3', name:'Allianz SE', type:'FI', sector:'Insurance', scores:{env:74,soc:72,gov:83,climate:70,bio:45,supply:52,human:76,innovation:67}, history:[{q:'Q1-25',s:70},{q:'Q2-25',s:71},{q:'Q3-25',s:72},{q:'Q4-25',s:73},{q:'Q1-26',s:74}] },
  { id:'E4', name:'BlackRock', type:'FI', sector:'Asset Mgmt', scores:{env:69,soc:65,gov:85,climate:68,bio:40,supply:48,human:72,innovation:78}, history:[{q:'Q1-25',s:66},{q:'Q2-25',s:67},{q:'Q3-25',s:68},{q:'Q4-25',s:69},{q:'Q1-26',s:71}] },
  { id:'E5', name:'Shell plc', type:'Energy', sector:'Oil & Gas', scores:{env:45,soc:58,gov:72,climate:38,bio:30,supply:65,human:62,innovation:55}, history:[{q:'Q1-25',s:40},{q:'Q2-25',s:42},{q:'Q3-25',s:43},{q:'Q4-25',s:44},{q:'Q1-26',s:46}] },
  { id:'E6', name:'TotalEnergies', type:'Energy', sector:'Oil & Gas', scores:{env:48,soc:60,gov:70,climate:42,bio:33,supply:62,human:64,innovation:58}, history:[{q:'Q1-25',s:43},{q:'Q2-25',s:45},{q:'Q3-25',s:46},{q:'Q4-25',s:47},{q:'Q1-26',s:49}] },
  { id:'E7', name:'Enel SpA', type:'Energy', sector:'Utilities', scores:{env:68,soc:66,gov:75,climate:72,bio:52,supply:60,human:68,innovation:74}, history:[{q:'Q1-25',s:64},{q:'Q2-25',s:65},{q:'Q3-25',s:67},{q:'Q4-25',s:68},{q:'Q1-26',s:70}] },
  { id:'E8', name:'NextEra Energy', type:'Energy', sector:'Renewables', scores:{env:82,soc:70,gov:78,climate:85,bio:58,supply:55,human:72,innovation:88}, history:[{q:'Q1-25',s:78},{q:'Q2-25',s:79},{q:'Q3-25',s:80},{q:'Q4-25',s:81},{q:'Q1-26',s:83}] },
  { id:'E9', name:'Microsoft', type:'Corporate', sector:'Technology', scores:{env:78,soc:82,gov:88,climate:75,bio:48,supply:70,human:85,innovation:92}, history:[{q:'Q1-25',s:76},{q:'Q2-25',s:77},{q:'Q3-25',s:78},{q:'Q4-25',s:79},{q:'Q1-26',s:80}] },
  { id:'E10', name:'Unilever', type:'Corporate', sector:'Consumer', scores:{env:76,soc:80,gov:82,climate:68,bio:65,supply:78,human:82,innovation:70}, history:[{q:'Q1-25',s:74},{q:'Q2-25',s:75},{q:'Q3-25',s:76},{q:'Q4-25',s:77},{q:'Q1-26',s:78}] },
  { id:'E11', name:'Siemens', type:'Corporate', sector:'Industrials', scores:{env:72,soc:74,gov:80,climate:70,bio:44,supply:72,human:78,innovation:82}, history:[{q:'Q1-25',s:69},{q:'Q2-25',s:70},{q:'Q3-25',s:71},{q:'Q4-25',s:72},{q:'Q1-26',s:73}] },
  { id:'E12', name:'Nestlé', type:'Corporate', sector:'Consumer', scores:{env:62,soc:68,gov:76,climate:55,bio:58,supply:72,human:70,innovation:60}, history:[{q:'Q1-25',s:59},{q:'Q2-25',s:60},{q:'Q3-25',s:61},{q:'Q4-25',s:62},{q:'Q1-26',s:63}] },
  { id:'E13', name:'BNP Paribas', type:'FI', sector:'Banking', scores:{env:70,soc:69,gov:79,climate:64,bio:41,supply:56,human:73,innovation:66}, history:[{q:'Q1-25',s:67},{q:'Q2-25',s:68},{q:'Q3-25',s:69},{q:'Q4-25',s:70},{q:'Q1-26',s:71}] },
  { id:'E14', name:'BP plc', type:'Energy', sector:'Oil & Gas', scores:{env:42,soc:55,gov:68,climate:35,bio:28,supply:60,human:58,innovation:50}, history:[{q:'Q1-25',s:38},{q:'Q2-25',s:39},{q:'Q3-25',s:40},{q:'Q4-25',s:41},{q:'Q1-26',s:43}] },
  { id:'E15', name:'Tesla Inc', type:'Corporate', sector:'Automotive', scores:{env:85,soc:55,gov:60,climate:90,bio:35,supply:50,human:52,innovation:95}, history:[{q:'Q1-25',s:72},{q:'Q2-25',s:74},{q:'Q3-25',s:75},{q:'Q4-25',s:76},{q:'Q1-26',s:78}] },
];

const L1_TOPICS = ['env','soc','gov','climate','bio','supply','human','innovation'];
const L1_LABELS = { env:'Environmental', soc:'Social', gov:'Governance', climate:'Climate', bio:'Biodiversity', supply:'Supply Chain', human:'Human Rights', innovation:'Innovation' };

const L2_DATA = {
  env: ['Emissions Mgmt','Waste & Circular','Water Stewardship','Pollution Prevention'],
  soc: ['Community Relations','Health & Safety','Labour Practices','Diversity & Inclusion'],
  gov: ['Board Structure','Ethics & Compliance','Risk Oversight','Transparency'],
  climate: ['Transition Plan','Physical Risk','Scenario Analysis','Net Zero Target'],
  bio: ['Land Use','Deforestation','Marine Impact','Species Protection'],
  supply: ['Supplier Screening','Audit Coverage','Remediation','Traceability'],
  human: ['Due Diligence','Grievance Mechanisms','Living Wage','Freedom of Association'],
  innovation: ['Green R&D','Clean Tech Patents','Circular Products','Digital Solutions']
};

const TABS = ['Side-by-Side','Taxonomy Comparison','Score Spider','Gap Analysis','Historical Comparison','Export'];

const Badge = ({code,label}) => (
  <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}>
    <span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span>
  </div>
);

const Card = ({children,style}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>
);

const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:'6px 16px',borderRadius:20,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.textSec,fontSize:12,fontFamily:T.font,cursor:'pointer',fontWeight:active?600:400}}>{label}</button>
);

const KPI = ({label,value,sub,color=T.navy}) => (
  <div style={{textAlign:'center'}}>
    <div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div>
    <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>
    {sub && <div style={{fontSize:10,color:T.textMut}}>{sub}</div>}
  </div>
);

export default function UniversalEntityComparatorPage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(['E1','E5','E9','E15']);
  const [drillTopic, setDrillTopic] = useState('env');
  const [watchlist, setWatchlist] = useState([]);
  const [filterType, setFilterType] = useState('All');

  const entities = useMemo(() => ENTITIES.filter(e => selected.includes(e.id)), [selected]);
  const filtered = filterType === 'All' ? ENTITIES : ENTITIES.filter(e => e.type === filterType);

  const radarData = useMemo(() => L1_TOPICS.map(t => {
    const row = { topic: L1_LABELS[t] };
    entities.forEach((e,i) => { row[e.name] = e.scores[t]; });
    return row;
  }), [entities]);

  const gapData = useMemo(() => {
    if (entities.length < 2) return [];
    return L1_TOPICS.map(t => ({
      topic: L1_LABELS[t],
      ...Object.fromEntries(entities.map((e,i) => [e.name, e.scores[t]])),
      gap: entities[0].scores[t] - entities[1].scores[t]
    }));
  }, [entities]);

  const histData = useMemo(() => {
    if (!entities.length) return [];
    return entities[0].history.map((h,qi) => {
      const row = { q: h.q };
      entities.forEach(e => { row[e.name] = e.history[qi]?.s || 0; });
      return row;
    });
  }, [entities]);

  const drillData = useMemo(() => {
    const subs = L2_DATA[drillTopic] || [];
    return subs.map((s,i) => {
      const row = { sub: s };
      entities.forEach(e => { row[e.name] = Math.round(e.scores[drillTopic] + (Math.sin(i*3+e.id.charCodeAt(1))*12)); });
      return row;
    });
  }, [entities, drillTopic]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : prev.length < 4 ? [...prev,id] : prev);
  };

  const renderSideBySide = () => (
    <div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {['All','FI','Energy','Corporate'].map(ft => <Pill key={ft} label={ft} active={filterType===ft} onClick={()=>setFilterType(ft)} />)}
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
        {filtered.map(e => (
          <button key={e.id} onClick={()=>toggleSelect(e.id)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontFamily:T.mono,border:`1px solid ${selected.includes(e.id)?ENTITY_COLORS[selected.indexOf(e.id)]||T.border:T.border}`,background:selected.includes(e.id)?`${ENTITY_COLORS[selected.indexOf(e.id)]||T.navy}15`:'transparent',color:selected.includes(e.id)?T.navy:T.textSec,cursor:'pointer'}}>
            {e.name} ({e.type})
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(entities.length,4)},1fr)`,gap:16}}>
        {entities.map((e,i) => (
          <Card key={e.id} style={{borderTop:`3px solid ${ENTITY_COLORS[i]}`}}>
            <div style={{fontWeight:700,fontSize:15,color:T.navy,marginBottom:4}}>{e.name}</div>
            <div style={{fontSize:11,color:T.textMut,marginBottom:12}}>{e.type} | {e.sector}</div>
            {L1_TOPICS.map(t => (
              <div key={t} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:12,color:T.textSec}}>{L1_LABELS[t]}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:80,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${e.scores[t]}%`,height:'100%',background:e.scores[t]>=70?T.green:e.scores[t]>=50?T.amber:T.red,borderRadius:3}} />
                  </div>
                  <span style={{fontSize:11,fontFamily:T.mono,fontWeight:600,color:T.navy,width:24,textAlign:'right'}}>{e.scores[t]}</span>
                </div>
              </div>
            ))}
            <div style={{marginTop:12,padding:'8px 0',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',fontSize:12}}>
              <span style={{color:T.textSec}}>Avg Score</span>
              <span style={{fontWeight:700,fontFamily:T.mono,color:T.navy}}>{Math.round(Object.values(e.scores).reduce((a,b)=>a+b,0)/8)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTaxonomy = () => (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
        {L1_TOPICS.map(t => <Pill key={t} label={L1_LABELS[t]} active={drillTopic===t} onClick={()=>setDrillTopic(t)} />)}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>L2/L3 Breakdown: {L1_LABELS[drillTopic]}</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={drillData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}} />
            <YAxis dataKey="sub" type="category" width={140} tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <Legend />
            {entities.map((e,i) => <Bar key={e.id} dataKey={e.name} fill={ENTITY_COLORS[i]} barSize={8} radius={[0,4,4,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{marginTop:16,padding:14,background:`${T.blue}08`,border:`1px solid ${T.blue}25`,borderRadius:8}}>
        <div style={{fontSize:12,fontWeight:600,color:T.blue,marginBottom:4}}>Taxonomy Reference</div>
        <div style={{fontSize:11,color:T.textSec}}>L1 Topic "{L1_LABELS[drillTopic]}" contains {(L2_DATA[drillTopic]||[]).length} L2 sub-topics. Each L2 further decomposes into 3-5 L3 indicator nodes. Scores aggregate bottom-up using weighted averages with data-quality adjustments.</div>
      </div>
    </div>
  );

  const renderSpider = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>8-Topic Radar Overlay (up to 4 entities)</div>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={T.border} />
          <PolarAngleAxis dataKey="topic" tick={{fontSize:11,fill:T.textSec}} />
          <PolarRadiusAxis domain={[0,100]} tick={{fontSize:10,fill:T.textMut}} />
          {entities.map((e,i) => <Radar key={e.id} name={e.name} dataKey={e.name} stroke={ENTITY_COLORS[i]} fill={ENTITY_COLORS[i]} fillOpacity={0.12} strokeWidth={2} />)}
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderGap = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:4}}>Gap Analysis: Where Entity A Outperforms Entity B</div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:16}}>Positive = {entities[0]?.name||'A'} leads | Negative = {entities[1]?.name||'B'} leads</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={gapData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="topic" tick={{fontSize:10,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <ReferenceLine y={0} stroke={T.navy} strokeDasharray="4 4" />
            <Bar dataKey="gap" radius={[4,4,0,0]}>
              {gapData.map((d,i) => <Cell key={i} fill={d.gap>=0?T.green:T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}}>
        {gapData.filter(d=>d.gap>0).slice(0,3).map((d,i) => (
          <Card key={i} style={{borderLeft:`3px solid ${T.green}`}}>
            <div style={{fontSize:12,fontWeight:600,color:T.green}}>+{d.gap} pts</div>
            <div style={{fontSize:11,color:T.textSec}}>{d.topic}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderHistorical = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Score Trajectory Over 5 Quarters</div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={histData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis domain={[30,100]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          {entities.map((e,i) => <Line key={e.id} type="monotone" dataKey={e.name} stroke={ENTITY_COLORS[i]} strokeWidth={2} dot={{r:4}} />)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderExport = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Export Comparison Report</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {['PDF Report','Excel Data Pack','PowerPoint Deck','API JSON'].map((fmt,i) => (
            <button key={i} style={{padding:16,border:`1px solid ${T.border}`,borderRadius:8,background:T.surface,cursor:'pointer',textAlign:'left'}}>
              <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{fmt}</div>
              <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Full comparison with charts</div>
            </button>
          ))}
        </div>
      </Card>
      <Card style={{marginTop:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Watchlist</div>
        {entities.map((e,i) => (
          <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.textSec}}>{e.name}</span>
            <button onClick={()=>setWatchlist(p=>p.includes(e.id)?p.filter(x=>x!==e.id):[...p,e.id])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${watchlist.includes(e.id)?T.gold:T.border}`,background:watchlist.includes(e.id)?`${T.gold}15`:'transparent',fontSize:11,cursor:'pointer',color:watchlist.includes(e.id)?T.gold:T.textMut}}>
              {watchlist.includes(e.id)?'Watching':'Watch'}
            </button>
          </div>
        ))}
      </Card>
    </div>
  );

  const panels = [renderSideBySide, renderTaxonomy, renderSpider, renderGap, renderHistorical, renderExport];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CW1" label="Universal Entity Comparator" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Universal Entity Comparator</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Compare up to 4 entities across FI, Energy & Corporate types with 8 L1 topic scores</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Entities" value={ENTITIES.length} sub="3 types" />
            <KPI label="Selected" value={entities.length} sub="of 4 max" color={T.gold} />
            <KPI label="Topics" value="8 L1" sub="32 L2" color={T.teal} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => (
            <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>
          ))}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Methodology Note</div>
          <div style={{fontSize:11,color:T.textSec}}>Entity scores are derived from a proprietary 316-node sustainability taxonomy. L1 scores aggregate 4 L2 sub-topics each, with data-quality-weighted averages. Cross-entity comparison normalizes for sector-specific materiality using SASB/GRI double-materiality mapping. Scores update quarterly with a 45-day data lag.</div>
        </div>
      </div>
    </div>
  );
}
