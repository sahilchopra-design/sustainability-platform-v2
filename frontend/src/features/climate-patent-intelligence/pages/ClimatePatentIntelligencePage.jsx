import React, { useState, useMemo } from 'react';
import CleanTechAdvancedAnalytics from '../../_shared/CleanTechAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, Legend, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const T = {
  bg:'#f8f6f0', surface:'#ffffff', surfaceH:'#f1ede4',
  border:'#e2ded5', borderL:'#ede9e0',
  navy:'#1e3a5f', navyL:'#2d5282', gold:'#b8860b', goldL:'#d4a017',
  sage:'#4d7c5f', sageL:'#6aad84', teal:'#0f766e',
  text:'#1a1a2e', textSec:'#6b7280', textMut:'#9ca3af',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  font:'DM Sans, sans-serif', mono:'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt0 = v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });
const fmt1 = v => Number(v).toFixed(1);
const fmt2 = v => Number(v).toFixed(2);

const TECH_DOMAINS = [
  { id:'RE',   name:'Renewable Energy',    color:'#f59e0b', subfields:['Solar PV','Wind','Hydro','Geothermal'] },
  { id:'BESS', name:'Energy Storage',      color:'#3b82f6', subfields:['Li-ion','Flow Battery','Thermal','Hydrogen'] },
  { id:'CC',   name:'Carbon Capture',      color:T.navy,    subfields:['Post-combustion','DAC','BECCS','Mineralisation'] },
  { id:'EV',   name:'EV & Transport',      color:T.green,   subfields:['Battery','Fuel Cell','Charging','Motor'] },
  { id:'SG',   name:'Smart Grid',          color:T.teal,    subfields:['Demand Response','VPP','SCADA','Digital Twin'] },
  { id:'H2',   name:'Green Hydrogen',      color:'#06b6d4', subfields:['Electrolysis','Storage','Transport','Utilisation'] },
  { id:'AI',   name:'Climate AI & Data',   color:T.sage,    subfields:['Prediction','Optimisation','MRV','Risk Modelling'] },
  { id:'CE',   name:'Circular Economy',    color:T.gold,    subfields:['Recycling','Bio-materials','Waste-to-Energy','Design'] },
];

const ENTITY_TYPES = ['Corporation','University','Government Lab','StartUp','Research Institute'];
const GEOS = ['USA','China','Europe','Japan','South Korea','UK','India','Rest of World'];

// Growth rates per domain 2019-2024 (CAGR %)
const DOMAIN_GROWTH = { RE:8, BESS:28, CC:35, EV:42, SG:18, H2:55, AI:38, CE:12 };

// 60 entities
const ENTITIES = Array.from({ length: 60 }, (_, i) => {
  const domain  = TECH_DOMAINS[Math.floor(sr(i*7)*TECH_DOMAINS.length)];
  const type    = ENTITY_TYPES[Math.floor(sr(i*11)*ENTITY_TYPES.length)];
  const geo     = GEOS[Math.floor(sr(i*13)*GEOS.length)];

  const totalPatents  = Math.round(50 + sr(i*17)*2950);
  const grantsPerYr   = Math.round(totalPatents * (0.08 + sr(i*19)*0.15));
  const citationIdx   = Math.round(50 + sr(i*23)*200);    // relative to sector avg=100
  const familySize    = Math.round(2 + sr(i*29)*18);      // countries per patent family
  const fwdCitations  = Math.round(10 + sr(i*31)*290);    // avg forward citations
  const rdSpendPct    = Math.round(3 + sr(i*37)*25);      // % revenue
  const rdSpendAbsMn  = Math.round(10 + sr(i*41)*990);    // $M
  const collabIdx     = Math.round(20 + sr(i*43)*75);     // collaboration index 0-100
  const commercialTrl = Math.round(4 + sr(i*47)*5);       // TRL 4-9

  // Patent cliff risk: high if <20% growth + large portfolio
  const patentCliff   = grantsPerYr < totalPatents * 0.06 && totalPatents > 500;
  const innovScore    = Math.round((citationIdx/2 + fwdCitations/3 + rdSpendPct*2 + collabIdx*0.3)/4);

  // Geographic filing (sum to 100)
  const usShare  = Math.round(20 + sr(i*53)*40);
  const cnShare  = Math.round(15 + sr(i*59)*35);
  const epShare  = Math.round(10 + sr(i*61)*30);
  const jpShare  = Math.round(5  + sr(i*67)*15);
  const woShare  = Math.max(0, 100 - usShare - cnShare - epShare - jpShare);

  return { id:i+1, name:`${domain.name.split(' ')[0]}-Entity-${String(i+1).padStart(3,'0')}`,
    domainId:domain.id, domainName:domain.name, type, geo,
    totalPatents, grantsPerYr, citationIdx, familySize, fwdCitations,
    rdSpendPct, rdSpendAbsMn, collabIdx, commercialTrl,
    patentCliff, innovScore,
    geoUs:usShare, geoCn:cnShare, geoEp:epShare, geoJp:jpShare, geoWo:woShare,
    color:domain.color };
});

// Patent activity time series 2019-2024
const TIME_SERIES = TECH_DOMAINS.map(d => {
  const base = 1000 + Math.floor(sr(TECH_DOMAINS.indexOf(d)*100)*5000);
  const cagr = DOMAIN_GROWTH[d.id] / 100;
  return {
    domain: d.name,
    id: d.id,
    color: d.color,
    data: Array.from({length:6},(_,i)=>({ year:(2019+i).toString(), grants: Math.round(base*Math.pow(1+cagr,i)) })),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'14px 18px', minWidth:160 }}>
    <div style={{ fontSize:11, color:T.textMut, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, fontFamily:T.mono }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:3 }}>{sub}</div>}
  </div>
);
const Card = ({ title, children, style }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, ...style }}>
    {title && <div style={{ fontSize:13, fontWeight:700, color:T.navy, fontFamily:T.mono, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.05em' }}>{title}</div>}
    {children}
  </div>
);

const TABS = ['Overview','Patent Portfolio','Technology Domains','Innovation Pipeline','Geographic Analysis','Competitive Intelligence','Investment Signals','Advanced Analytics'];

export default function ClimatePatentIntelligencePage() {
  const [tab, setTab]              = useState('Overview');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterType, setFilterType]     = useState('All');
  const [filterGeo, setFilterGeo]       = useState('All');

  const filtered = useMemo(() => ENTITIES.filter(e =>
    (filterDomain === 'All' || e.domainId === filterDomain) &&
    (filterType   === 'All' || e.type     === filterType) &&
    (filterGeo    === 'All' || e.geo      === filterGeo)
  ), [filterDomain, filterType, filterGeo]);

  const totals = useMemo(() => {
    const n = filtered.length||1;
    return {
      n: filtered.length,
      totalPatents:  filtered.reduce((s,e)=>s+e.totalPatents,0),
      totalGrants:   filtered.reduce((s,e)=>s+e.grantsPerYr,0),
      avgCitation:   filtered.reduce((s,e)=>s+e.citationIdx,0)/n,
      avgInnovScore: filtered.reduce((s,e)=>s+e.innovScore,0)/n,
      totalRd:       filtered.reduce((s,e)=>s+e.rdSpendAbsMn,0),
      patentCliffRisk: filtered.filter(e=>e.patentCliff).length,
      avgFamilySize: filtered.reduce((s,e)=>s+e.familySize,0)/n,
    };
  }, [filtered]);

  // Domain summary
  const domainRows = useMemo(() => TECH_DOMAINS.map(d => {
    const es = filtered.filter(e=>e.domainId===d.id);
    const n  = es.length||1;
    return { ...d, count:es.length,
      totalPatents: es.reduce((a,e)=>a+e.totalPatents,0),
      avgGrants:    Math.round(es.reduce((a,e)=>a+e.grantsPerYr,0)/n),
      avgCitation:  Math.round(es.reduce((a,e)=>a+e.citationIdx,0)/n),
      avgRd:        Math.round(es.reduce((a,e)=>a+e.rdSpendAbsMn,0)/n),
      cagr:         DOMAIN_GROWTH[d.id],
    };
  }), [filtered]);

  // Patent activity chart (all domains, 2019-2024)
  const patentTrendData = useMemo(() => ['2019','2020','2021','2022','2023','2024'].map((yr,i)=>({
    year: yr,
    ...Object.fromEntries(TECH_DOMAINS.map(d=>[d.id, TIME_SERIES.find(t=>t.id===d.id).data[i].grants])),
  })), []);

  // Top 20 by total patents
  const topEntities = useMemo(() => [...filtered].sort((a,b)=>b.totalPatents-a.totalPatents).slice(0,20), [filtered]);

  // Geographic concentration (portfolio-level)
  const geoDistrib = useMemo(() => {
    const n = filtered.length||1;
    return [
      { geo:'US', pct: Math.round(filtered.reduce((s,e)=>s+e.geoUs,0)/n) },
      { geo:'CN', pct: Math.round(filtered.reduce((s,e)=>s+e.geoCn,0)/n) },
      { geo:'EP', pct: Math.round(filtered.reduce((s,e)=>s+e.geoEp,0)/n) },
      { geo:'JP', pct: Math.round(filtered.reduce((s,e)=>s+e.geoJp,0)/n) },
      { geo:'WO', pct: Math.round(filtered.reduce((s,e)=>s+e.geoWo,0)/n) },
    ];
  }, [filtered]);

  // Innovation radar by domain
  const radarData = useMemo(() => [
    { metric:'Grant Volume',     RE:72, BESS:68, CC:45, EV:88, H2:55 },
    { metric:'Citation Impact',  RE:65, BESS:75, CC:80, EV:82, H2:70 },
    { metric:'Family Breadth',   RE:78, BESS:62, CC:55, EV:90, H2:48 },
    { metric:'R&D Intensity',    RE:60, BESS:80, CC:70, EV:85, H2:75 },
    { metric:'Collaboration',    RE:55, BESS:70, CC:90, EV:65, H2:80 },
    { metric:'Commercialisation',RE:85, BESS:72, CC:40, EV:92, H2:45 },
  ], []);

  // Investment signal score
  const investSignals = useMemo(() => domainRows.map(d=>({
    domain: d.name.split(' ')[0],
    signal: Math.round(d.cagr*0.5 + d.avgCitation*0.2 + (d.avgRd/50)*0.3),
    cagr:   d.cagr,
  })), [domainRows]);

  const labelStyle = { fontSize:11, color:T.textSec, marginBottom:4, display:'block' };
  const selectStyle = { padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DF6 · Climate Patent Intelligence</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#ffffff', marginBottom:4 }}>Climate Patent Intelligence</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>60 entities · 8 technology domains · Citation analysis · Geographic filing · Innovation pipeline · Investment signals</div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', alignItems:'flex-end' }}>
          <div><span style={labelStyle}>Technology Domain</span>
            <select style={selectStyle} value={filterDomain} onChange={e=>setFilterDomain(e.target.value)}>
              <option>All</option>{TECH_DOMAINS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div><span style={labelStyle}>Entity Type</span>
            <select style={selectStyle} value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option>All</option>{ENTITY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><span style={labelStyle}>Geography</span>
            <select style={selectStyle} value={filterGeo} onChange={e=>setFilterGeo(e.target.value)}>
              <option>All</option>{GEOS.map(g=><option key={g}>{g}</option>)}
            </select></div>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{totals.n} entities</div>
        </div>

        <div style={{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===t?T.navy:T.border}`, background:tab===t?T.navy:T.surface, color:tab===t?'#fff':T.textSec, fontFamily:T.font, fontSize:12, fontWeight:tab===t?600:400, cursor:'pointer' }}>{t}</button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab==='Overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Patents" value={fmt0(totals.totalPatents)} sub="Portfolio scope" color={T.navy} />
              <KpiCard label="Annual Grants" value={fmt0(totals.totalGrants)} sub="New grants/yr" color={T.teal} />
              <KpiCard label="Avg Citation Index" value={fmt1(totals.avgCitation)} sub="vs sector avg 100" color={totals.avgCitation>=100?T.green:T.amber} />
              <KpiCard label="Avg Innovation Score" value={fmt1(totals.avgInnovScore)} sub="Composite 0–100" color={T.gold} />
              <KpiCard label="Total R&D Spend" value={`$${fmt0(totals.totalRd)}M`} sub="Annual portfolio" />
              <KpiCard label="Patent Cliff Risk" value={totals.patentCliffRisk} sub="Entities at risk" color={T.red} />
              <KpiCard label="Avg Family Size" value={fmt1(totals.avgFamilySize)} sub="Countries per patent" />
            </div>

            <Card title="Domain Summary — Patent Activity & Innovation Metrics">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Domain','CAGR 2019-24','Entities','Total Patents','Avg Grants/yr','Avg Citation','Avg R&D $M','Subfields'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{domainRows.map((d,i)=>(
                    <tr key={d.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:d.color, marginRight:8 }} />{d.name}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:d.cagr>=30?T.green:d.cagr>=15?T.amber:T.text, fontWeight:600 }}>{d.cagr}%</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{d.count}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{fmt0(d.totalPatents)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{fmt0(d.avgGrants)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:d.avgCitation>=100?T.green:T.amber }}>{d.avgCitation}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${fmt0(d.avgRd)}</td>
                      <td style={{ padding:'8px 12px', fontSize:11, color:T.textSec }}>{d.subfields.join(' · ')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>

            <Card title="Climate Patent Grant Volume by Domain (2019–2024)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={patentTrendData} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                  <Tooltip />
                  <Legend />
                  {TECH_DOMAINS.filter(d=>['EV','H2','BESS','AI'].includes(d.id)).map(d=>(
                    <Area key={d.id} dataKey={d.id} name={d.name} stroke={d.color} fill={d.color} fillOpacity={0.10} strokeWidth={1.5} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── Patent Portfolio ── */}
        {tab==='Patent Portfolio' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Top 20 Entities by Patent Portfolio Size">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Entity','Type','Domain','Geography','Total Patents','Grants/yr','Citation Idx','Fwd Citations','Family Size','R&D $M','Innov Score','Cliff Risk'].map(h=>(
                      <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{topEntities.map((e,i)=>(
                    <tr key={e.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11 }}>{e.name}</td>
                      <td style={{ padding:'6px 10px', fontSize:11 }}>{e.type}</td>
                      <td style={{ padding:'6px 10px' }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:e.color, marginRight:6 }} />{e.domainName}</td>
                      <td style={{ padding:'6px 10px' }}>{e.geo}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:600 }}>{fmt0(e.totalPatents)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(e.grantsPerYr)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:e.citationIdx>=100?T.green:T.amber }}>{e.citationIdx}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{e.fwdCitations}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{e.familySize}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${fmt0(e.rdSpendAbsMn)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:e.innovScore>=70?T.green:e.innovScore>=50?T.amber:T.text }}>{e.innovScore}</td>
                      <td style={{ padding:'6px 10px' }}>{e.patentCliff?<span style={{ color:T.red, fontWeight:600, fontSize:11 }}>⚠ YES</span>:<span style={{ color:T.green, fontSize:11 }}>Clear</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Technology Domains ── */}
        {tab==='Technology Domains' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Patent CAGR 2019–2024 by Domain (%)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[...domainRows].sort((a,b)=>b.cagr-a.cagr)}
                    layout="vertical" margin={{ top:5, right:60, left:120, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize:10 }} width={120} />
                    <Tooltip formatter={v=>[`${v}% CAGR`]} />
                    <Bar dataKey="cagr" name="CAGR %" radius={[0,4,4,0]}
                      fill={T.green}
                      label={{ position:'right', fontSize:10, formatter:v=>`${v}%` }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Total Patents by Domain">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={domainRows} margin={{ top:5, right:20, left:0, bottom:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize:9, angle:-35, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip formatter={v=>[`${fmt0(v)} patents`]} />
                    <Bar dataKey="totalPatents" name="Total Patents" fill={T.navy} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Domain Subfield Landscape">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {TECH_DOMAINS.map(d=>(
                  <div key={d.id} style={{ background:T.surfaceH, borderRadius:8, padding:12, border:`1px solid ${T.borderL}`, borderLeft:`3px solid ${d.color}` }}>
                    <div style={{ fontWeight:700, fontSize:12, color:T.navy, marginBottom:8 }}>{d.name}</div>
                    {d.subfields.map(sf=>(
                      <div key={sf} style={{ fontSize:11, color:T.textSec, padding:'2px 0', borderBottom:`1px solid ${T.borderL}` }}>{sf}</div>
                    ))}
                    <div style={{ marginTop:8, fontFamily:T.mono, fontSize:11, color:T.green, fontWeight:600 }}>{DOMAIN_GROWTH[d.id]}% CAGR</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── Innovation Pipeline ── */}
        {tab==='Innovation Pipeline' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Portfolio R&D" value={`$${fmt0(totals.totalRd)}M`} sub="Annual aggregate" color={T.navy} />
              <KpiCard label="Avg Innov Score" value={fmt1(totals.avgInnovScore)} sub="0–100 composite" color={T.gold} />
              <KpiCard label="High Innovation (≥70)" value={filtered.filter(e=>e.innovScore>=70).length} sub="Top performers" color={T.green} />
              <KpiCard label="Avg Collaboration Idx" value={fmt1(filtered.reduce((s,e)=>s+e.collabIdx,0)/(filtered.length||1))} sub="Cross-entity linkages" color={T.teal} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Innovation Score vs R&D Intensity (% Revenue)">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="R&D %" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'R&D %', position:'insideBottom', offset:-5, fontSize:10 }} />
                    <YAxis dataKey="y" name="Innov Score" tick={{ fontSize:10 }} label={{ value:'Innov Score', angle:-90, position:'insideLeft', fontSize:10 }} />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v,n)=>[n==='x'?`${v}%`:`${v}`, n==='x'?'R&D %':'Innov Score']} />
                    <Scatter data={filtered.map(e=>({ x:e.rdSpendPct, y:e.innovScore }))} fill={T.navy} opacity={0.55} r={4} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Innovation Score Distribution">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[20,30,40,50,60,70,80,90].map((lo,i,a)=>({ range:`${lo}–${a[i+1]||lo+10}`, count:filtered.filter(e=>e.innovScore>=lo&&e.innovScore<(a[i+1]||lo+10)).length }))}
                    margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="range" tick={{ fontSize:10 }} />
                    <YAxis tick={{ fontSize:10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.gold} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Innovation Radar — Top Domains (relative scores)">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize:10 }} />
                  <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} />
                  <Radar dataKey="EV"   name="EV & Transport"  stroke={T.green} fill={T.green} fillOpacity={0.15} />
                  <Radar dataKey="H2"   name="Green Hydrogen"  stroke='#06b6d4' fill='#06b6d4' fillOpacity={0.15} />
                  <Radar dataKey="CC"   name="Carbon Capture"  stroke={T.navy}  fill={T.navy}  fillOpacity={0.10} />
                  <Radar dataKey="BESS" name="Energy Storage"  stroke='#3b82f6' fill='#3b82f6' fillOpacity={0.10} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── Geographic Analysis ── */}
        {tab==='Geographic Analysis' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Portfolio Avg US Filing" value={`${Math.round(filtered.reduce((s,e)=>s+e.geoUs,0)/(filtered.length||1))}%`} sub="Share of families" />
              <KpiCard label="Portfolio Avg CN Filing" value={`${Math.round(filtered.reduce((s,e)=>s+e.geoCn,0)/(filtered.length||1))}%`} sub="Share of families" color={T.red} />
              <KpiCard label="Portfolio Avg EP Filing" value={`${Math.round(filtered.reduce((s,e)=>s+e.geoEp,0)/(filtered.length||1))}%`} sub="Share of families" color={T.teal} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Avg Geographic Filing Share (portfolio %)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={geoDistrib} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="geo" tick={{ fontSize:12, fontFamily:T.mono, fontWeight:600 }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                    <Tooltip formatter={v=>[`${v}%`]} />
                    <Bar dataKey="pct" name="Filing Share %" fill={T.navy} radius={[4,4,0,0]}
                      label={{ position:'top', fontSize:11, fontFamily:T.mono, formatter:v=>`${v}%` }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Entity Count by Filing Geography (home country)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={GEOS.map(g=>({ geo:g.split(' ')[0], count:filtered.filter(e=>e.geo===g).length }))}
                    margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="geo" tick={{ fontSize:10, angle:-25, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.teal} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* ── Competitive Intelligence ── */}
        {tab==='Competitive Intelligence' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Full Entity Competitive Landscape">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Entity','Type','Domain','Geo','Patents','Grants/yr','Cite Idx','Fwd Cit','Family','R&D $M','Collab','TRL','Score'].map(h=>(
                      <th key={h} style={{ padding:'6px 9px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b)=>b.innovScore-a.innovScore).map((e,i)=>(
                    <tr key={e.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono, fontSize:10 }}>{e.name}</td>
                      <td style={{ padding:'6px 9px', fontSize:10 }}>{e.type}</td>
                      <td style={{ padding:'6px 9px' }}><span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:e.color, marginRight:5 }} />{e.domainName.split(' ')[0]}</td>
                      <td style={{ padding:'6px 9px', fontSize:10 }}>{e.geo}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>{fmt0(e.totalPatents)}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>{fmt0(e.grantsPerYr)}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono, color:e.citationIdx>=100?T.green:T.amber }}>{e.citationIdx}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>{e.fwdCitations}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>{e.familySize}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>${fmt0(e.rdSpendAbsMn)}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>{e.collabIdx}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono }}>{e.commercialTrl}</td>
                      <td style={{ padding:'6px 9px', fontFamily:T.mono, fontWeight:600, color:e.innovScore>=70?T.green:e.innovScore>=50?T.amber:T.text }}>{e.innovScore}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Investment Signals ── */}
        {tab==='Investment Signals' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Highest CAGR Domain" value="Green H₂" sub="55% CAGR 2019–2024" color={T.green} />
              <KpiCard label="Highest Volume" value="EV & Transport" sub="Most grants/yr" color={T.navy} />
              <KpiCard label="Best Citation Impact" value="Carbon Capture" sub="Avg idx >130" color={T.teal} />
              <KpiCard label="Highest R&D Intensity" value="Climate AI" sub="~20% revenue avg" color={T.gold} />
            </div>
            <Card title="Investment Signal Score by Domain (patent growth + citation + R&D composite)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...investSignals].sort((a,b)=>b.signal-a.signal)} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="domain" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                  <Tooltip formatter={v=>[`${v} signal score`]} />
                  <Bar dataKey="signal" name="Signal Score" fill={T.gold} radius={[4,4,0,0]}
                    label={{ position:'top', fontSize:10, formatter:v=>Math.round(v) }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Patent Intelligence — Key Investment Themes">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {[
                  { theme:'Green Hydrogen Surge', signal:'BUY', detail:'55% CAGR patent filings 2019-2024. Electrolysis & storage subfields dominating. China filing surge warrants monitoring.', risk:'Commercialisation TRL still 4-6 for most entities' },
                  { theme:'EV Battery Innovation', signal:'BUY', detail:'42% CAGR; solid-state battery subfield accelerating. Chinese OEM/battery patent family breadth reaching parity with US/JP.', risk:'Concentration in 5-7 dominant entities creates cliff risk' },
                  { theme:'Carbon Capture & DAC', signal:'HOLD', detail:'35% CAGR from low base. DAC cost innovation ongoing but TRL gap remains. 45Q driving US filing surge.', risk:'Highly capital-intensive; long payback cycles' },
                  { theme:'Climate AI & MRV', signal:'BUY', detail:'38% CAGR. Satellite-based MRV, climate risk modelling, grid optimisation all accelerating rapidly.', risk:'Software patents weaker protection; open-source competition' },
                  { theme:'Renewable Energy', signal:'HOLD', detail:'8% CAGR — mature technology. Incremental innovation in perovskite, bifacial PV, floating offshore. Patent cliff for early movers.', risk:'Commoditisation compresses IP premium' },
                  { theme:'Smart Grid & VPP', signal:'BUY', detail:'18% CAGR. Demand response, virtual power plant, grid digitalisation all growing. Utility + startup collaboration rising.', risk:'Regulatory fragmentation by market slows deployment' },
                ].map(t=>(
                  <div key={t.theme} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:T.navy }}>{t.theme}</div>
                      <span style={{ padding:'2px 10px', borderRadius:4, fontSize:11, fontWeight:700, background:t.signal==='BUY'?'#dcfce7':'#fef3c7', color:t.signal==='BUY'?T.green:T.amber }}>{t.signal}</span>
                    </div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{t.detail}</div>
                    <div style={{ fontSize:11, color:T.red }}><b>Risk:</b> {t.risk}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <CleanTechAdvancedAnalytics T={T} moduleId="DF6" moduleName="Climate Patent Intelligence" />
        </div>
      )}

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DF6 · Climate Patent Intelligence · EPO / USPTO / CNIPA data · OECD Green Patents</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} entities · {fmt0(totals.totalPatents)} patents · {fmt0(totals.totalGrants)} grants/yr</span>
      </div>
    </div>
  );
}
