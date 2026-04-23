import React, { useState, useMemo } from 'react';
import CleanTechAdvancedAnalytics from '../../_shared/CleanTechAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, AreaChart, Area, Legend,
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
const fmt0 = v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });
const fmt1 = v => Number(v).toFixed(1);
const fmt2 = v => Number(v).toFixed(2);

const SECTORS = ['Solar PV', 'Wind', 'Battery Storage', 'Green Hydrogen', 'CCS/CCUS', 'EV & Mobility', 'Smart Grid', 'AgriTech', 'Water Tech', 'Circular Economy'];
const STAGES  = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'IPO'];
const GEOS    = ['North America', 'Europe', 'Asia-Pacific', 'UK', 'LatAm', 'MEA'];
const TRL_DESC = { 1:'Basic Research', 2:'Technology Concept', 3:'Proof of Concept', 4:'Lab Validation', 5:'Pilot Demonstration', 6:'Prototype', 7:'Pre-Commercial', 8:'First-of-Kind', 9:'Commercial' };

// Sector abatement cost benchmarks ($/tCO₂) and potential (MtCO₂/yr by 2035 globally)
const SECTOR_META = {
  'Solar PV':          { abatCost: 12, potential: 4800, color: '#f59e0b' },
  'Wind':              { abatCost: 18, potential: 3900, color: '#3b82f6' },
  'Battery Storage':   { abatCost: 35, potential: 1200, color: '#8b5cf6' },
  'Green Hydrogen':    { abatCost: 85, potential: 2800, color: '#06b6d4' },
  'CCS/CCUS':          { abatCost: 95, potential: 1500, color: T.navy },
  'EV & Mobility':     { abatCost: 28, potential: 3200, color: T.green },
  'Smart Grid':        { abatCost: 22, potential: 900,  color: T.gold },
  'AgriTech':          { abatCost: 55, potential: 1800, color: T.sage },
  'Water Tech':        { abatCost: 40, potential: 600,  color: '#0ea5e9' },
  'Circular Economy':  { abatCost: 48, potential: 2100, color: T.teal },
};

const COMPANIES = Array.from({ length: 60 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const stage  = STAGES[Math.floor(sr(i * 11) * STAGES.length)];
  const geo    = GEOS[Math.floor(sr(i * 13) * GEOS.length)];
  const trl    = Math.floor(2 + sr(i * 17) * 7); // 2–8
  const meta   = SECTOR_META[sector];

  const valuation = Math.round(10 + sr(i * 19) * 990); // $M
  const revenue   = Math.round(valuation * (0.05 + sr(i * 23) * 0.40));
  const capexReq  = Math.round(5 + sr(i * 29) * 195); // $M funding need
  const irr       = Math.round(8 + sr(i * 31) * 32);  // %
  const payback   = Math.round(3 + sr(i * 37) * 12);  // years

  const capacity  = Math.round(10 + sr(i * 41) * 490); // MW or kt/yr
  const abatPot   = Math.round(capacity * (0.8 + sr(i * 43) * 1.2)); // ktCO₂/yr
  const abatCost  = Math.round(meta.abatCost * (0.7 + sr(i * 47) * 0.6)); // $/tCO₂

  const esgScore  = Math.round(50 + sr(i * 53) * 45);
  const patentCnt = Math.floor(sr(i * 59) * 80);
  const rdPct     = Math.round(5 + sr(i * 61) * 35); // % of revenue

  return {
    id: i + 1,
    name: `${sector.split(' ')[0]}-${String(i + 1).padStart(3, '0')}`,
    sector, stage, geo, trl,
    valuation, revenue, capexReq, irr, payback,
    capacity, abatPot, abatCost,
    esgScore, patentCnt, rdPct,
    topQuartile: irr >= 28,
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

const TABS = ['Overview','Portfolio','Abatement Analysis','Investment Pipeline','Return Analytics','Technology Readiness','Market Intelligence','Advanced Analytics'];

export default function CleanTechInvestmentPage() {
  const [tab, setTab]             = useState('Overview');
  const [filterSector, setFilterSector] = useState('All');
  const [filterStage, setFilterStage]   = useState('All');
  const [filterGeo, setFilterGeo]       = useState('All');
  const [hurdleRate, setHurdleRate]     = useState(15); // % IRR hurdle
  const [carbonPx, setCarbonPx]         = useState(80); // $/tCO₂

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (filterSector === 'All' || c.sector === filterSector) &&
    (filterStage  === 'All' || c.stage  === filterStage)  &&
    (filterGeo    === 'All' || c.geo    === filterGeo)
  ), [filterSector, filterStage, filterGeo]);

  const totals = useMemo(() => {
    const n = filtered.length || 1;
    return {
      n: filtered.length,
      totalValuation: filtered.reduce((s,c)=>s+c.valuation,0),
      totalCapex:     filtered.reduce((s,c)=>s+c.capexReq,0),
      avgIrr:         filtered.reduce((s,c)=>s+c.irr,0)/n,
      avgAbatCost:    filtered.reduce((s,c)=>s+c.abatCost,0)/n,
      totalAbatPot:   filtered.reduce((s,c)=>s+c.abatPot,0),
      pctAboveHurdle: filtered.filter(c=>c.irr>=hurdleRate).length/n*100,
      avgTrl:         filtered.reduce((s,c)=>s+c.trl,0)/n,
      totalCarbonVal: filtered.reduce((s,c)=>s+c.abatPot*carbonPx/1000,0), // $M/yr
    };
  }, [filtered, hurdleRate, carbonPx]);

  // Sector breakdown
  const sectorRows = useMemo(() => SECTORS.map(s => {
    const cos = filtered.filter(c=>c.sector===s);
    const n   = cos.length||1;
    const meta = SECTOR_META[s];
    return {
      sector:s, count:cos.length,
      avgIrr:    cos.reduce((a,c)=>a+c.irr,0)/n,
      avgAbat:   cos.reduce((a,c)=>a+c.abatCost,0)/n,
      totalAbat: cos.reduce((a,c)=>a+c.abatPot,0),
      totalCap:  cos.reduce((a,c)=>a+c.capexReq,0),
      color:     meta.color,
      marketPot: meta.potential,
    };
  }), [filtered]);

  // IRR vs abatement cost scatter
  const scatterData = useMemo(() => filtered.map(c=>({ x:c.abatCost, y:c.irr, name:c.name })), [filtered]);

  // Stage distribution
  const stageData = useMemo(() => STAGES.map(s=>({
    stage:s,
    count: filtered.filter(c=>c.stage===s).length,
    capex: filtered.filter(c=>c.stage===s).reduce((a,c)=>a+c.capexReq,0),
  })), [filtered]);

  // TRL-weighted abatement trajectory 2025-2040
  const trajectory = useMemo(() => {
    const avgAbat = totals.totalAbatPot;
    return Array.from({length:4},(_,i)=>({
      year:(2025+i*5).toString(),
      conservative: Math.round(avgAbat*(1+i*0.3)),
      base:         Math.round(avgAbat*(1+i*0.6)),
      optimistic:   Math.round(avgAbat*(1+i*1.0)),
    }));
  }, [totals]);

  const labelStyle = { fontSize:11, color:T.textSec, marginBottom:4, display:'block' };
  const selectStyle = { padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text, fontFamily:T.font };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DF1 · Clean Technology Investment Analytics</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#ffffff', marginBottom:4 }}>Clean Technology Investment Analytics</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>60 companies · IRR benchmarking · Abatement cost curves · TRL readiness · Portfolio construction</div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        {/* Filters */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', alignItems:'flex-end' }}>
          <div><span style={labelStyle}>Sector</span>
            <select style={selectStyle} value={filterSector} onChange={e=>setFilterSector(e.target.value)}>
              <option>All</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><span style={labelStyle}>Stage</span>
            <select style={selectStyle} value={filterStage} onChange={e=>setFilterStage(e.target.value)}>
              <option>All</option>{STAGES.map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><span style={labelStyle}>Geography</span>
            <select style={selectStyle} value={filterGeo} onChange={e=>setFilterGeo(e.target.value)}>
              <option>All</option>{GEOS.map(g=><option key={g}>{g}</option>)}
            </select></div>
          <div style={{ flex:1, minWidth:180 }}>
            <span style={labelStyle}>IRR Hurdle Rate: {hurdleRate}%</span>
            <input type="range" min={8} max={35} step={1} value={hurdleRate}
              onChange={e=>setHurdleRate(+e.target.value)} style={{ width:'100%', accentColor:T.navy }} />
          </div>
          <div style={{ minWidth:180 }}>
            <span style={labelStyle}>Carbon Price: ${carbonPx}/tCO₂</span>
            <input type="range" min={20} max={200} step={10} value={carbonPx}
              onChange={e=>setCarbonPx(+e.target.value)} style={{ width:'100%', accentColor:T.navy }} />
          </div>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{totals.n} companies</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===t?T.navy:T.border}`, background:tab===t?T.navy:T.surface, color:tab===t?'#fff':T.textSec, fontFamily:T.font, fontSize:12, fontWeight:tab===t?600:400, cursor:'pointer' }}>{t}</button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab==='Overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Portfolio Companies" value={totals.n} sub="Filtered universe" />
              <KpiCard label="Total Valuation" value={`$${fmt0(totals.totalValuation)}M`} sub="Aggregate portfolio" />
              <KpiCard label="Capital Required" value={`$${fmt0(totals.totalCapex)}M`} sub="Total funding need" color={T.amber} />
              <KpiCard label="Avg IRR" value={`${fmt1(totals.avgIrr)}%`} sub="Unlevered" color={totals.avgIrr>=hurdleRate?T.green:T.red} />
              <KpiCard label="Above Hurdle Rate" value={`${fmt1(totals.pctAboveHurdle)}%`} sub={`IRR ≥ ${hurdleRate}%`} color={T.green} />
              <KpiCard label="Avg Abatement Cost" value={`$${fmt1(totals.avgAbatCost)}/tCO₂`} sub="Portfolio average" />
              <KpiCard label="Total Abatement Pot." value={`${fmt0(totals.totalAbatPot)} ktCO₂/yr`} sub="At full deployment" color={T.sage} />
              <KpiCard label="Carbon Revenue Value" value={`$${fmt1(totals.totalCarbonVal)}M/yr`} sub={`@ $${carbonPx}/tCO₂`} color={T.teal} />
            </div>

            <Card title="Sector Performance Summary">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Sector','Companies','Avg IRR %','Avg Abat Cost $/t','Total Abat ktCO₂','Capital Req $M','Market Potential MtCO₂'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{sectorRows.map((r,i)=>(
                    <tr key={r.sector} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>
                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:r.color, marginRight:8 }} />
                        {r.sector}
                      </td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{r.count}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:r.avgIrr>=hurdleRate?T.green:T.text, fontWeight:600 }}>{fmt1(r.avgIrr)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${fmt1(r.avgAbat)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{fmt0(r.totalAbat)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${fmt0(r.totalCap)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{fmt0(r.marketPot)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>

            <Card title="Abatement Potential Trajectory (ktCO₂/yr) — Portfolio at Scale">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trajectory} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                  <Tooltip />
                  <Legend />
                  <Area dataKey="optimistic"   name="Optimistic"   stroke={T.green}  fill={T.green}  fillOpacity={0.12} strokeWidth={1.5} />
                  <Area dataKey="base"         name="Base Case"    stroke={T.navy}   fill={T.navy}   fillOpacity={0.15} strokeWidth={2} />
                  <Area dataKey="conservative" name="Conservative" stroke={T.amber}  fill={T.amber}  fillOpacity={0.10} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── Portfolio ── */}
        {tab==='Portfolio' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Capital Required by Stage ($M)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stageData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="stage" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="M" />
                    <Tooltip formatter={v=>[`$${fmt0(v)}M`]} />
                    <Bar dataKey="capex" name="Capital $M" fill={T.navy} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Avg IRR by Sector (%) vs Hurdle">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorRows.filter(r=>r.count>0)} layout="vertical" margin={{ top:5, right:20, left:60, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                    <YAxis dataKey="sector" type="category" tick={{ fontSize:10 }} width={90} />
                    <Tooltip formatter={v=>[`${fmt1(v)}%`]} />
                    <Bar dataKey="avgIrr" name="Avg IRR %" radius={[0,4,4,0]}
                      fill={T.sage} label={{ position:'right', fontSize:10, formatter:v=>fmt1(v)+'%' }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Company Portfolio — Full List">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Company','Sector','Stage','Geo','TRL','Val $M','Capex $M','IRR %','Payback yr','Abat kt','Cost $/t','ESG'].map(h=>(
                      <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b)=>b.irr-a.irr).map((c,i)=>(
                    <tr key={c.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11 }}>{c.name}</td>
                      <td style={{ padding:'6px 10px' }}>{c.sector}</td>
                      <td style={{ padding:'6px 10px' }}>{c.stage}</td>
                      <td style={{ padding:'6px 10px' }}>{c.geo}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{c.trl}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${fmt0(c.valuation)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${fmt0(c.capexReq)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:600, color:c.irr>=hurdleRate?T.green:T.text }}>{c.irr}%</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{c.payback}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(c.abatPot)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${c.abatCost}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:c.esgScore>=70?T.green:c.esgScore>=50?T.amber:T.red }}>{c.esgScore}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Abatement Analysis ── */}
        {tab==='Abatement Analysis' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Portfolio Abatement" value={`${fmt0(totals.totalAbatPot)} ktCO₂/yr`} sub="At full deployment" color={T.green} />
              <KpiCard label="Avg Abatement Cost" value={`$${fmt1(totals.avgAbatCost)}/tCO₂`} sub="Portfolio weighted" />
              <KpiCard label="Below $50/tCO₂" value={`${filtered.filter(c=>c.abatCost<50).length}`} sub="Companies in cost range" color={T.sage} />
              <KpiCard label="Carbon Revenue" value={`$${fmt1(totals.totalCarbonVal)}M/yr`} sub={`@ $${carbonPx}/tCO₂`} color={T.teal} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="IRR vs Abatement Cost Scatter ($/tCO₂)">
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Abat Cost $/t" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'$/tCO₂', position:'insideBottom', offset:-5, fontSize:10 }} />
                    <YAxis dataKey="y" name="IRR %" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'IRR %', angle:-90, position:'insideLeft', fontSize:10 }} />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v,n)=>[n==='x'?`$${v}/t`:`${v}%`, n==='x'?'Abat Cost':'IRR']} />
                    <Scatter data={scatterData} fill={T.navy} opacity={0.55} r={4} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Total Abatement Potential by Sector (ktCO₂/yr)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorRows} margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize:9, angle:-30, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip formatter={v=>[`${fmt0(v)} ktCO₂/yr`]} />
                    <Bar dataKey="totalAbat" name="Abatement ktCO₂" fill={T.sage} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Marginal Abatement Cost Curve — Portfolio Companies (sorted by $/tCO₂)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[...filtered].sort((a,b)=>a.abatCost-b.abatCost).slice(0,30).map(c=>({ name:c.name, cost:c.abatCost, abat:c.abatPot }))}
                  margin={{ top:5, right:20, left:0, bottom:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize:8, angle:-45, textAnchor:'end' }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/t" />
                  <Tooltip formatter={(v,n)=>[n==='cost'?`$${v}/tCO₂`:`${fmt0(v)} ktCO₂/yr`, n==='cost'?'Cost':'Potential']} />
                  <Legend />
                  <Bar dataKey="cost" name="$/tCO₂" fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── Investment Pipeline ── */}
        {tab==='Investment Pipeline' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Deal Pipeline by Stage">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stageData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="stage" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Companies" fill={T.gold} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Capital Deployment by Geography ($M)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={GEOS.map(g=>({ geo:g, cap: filtered.filter(c=>c.geo===g).reduce((a,c)=>a+c.capexReq,0) }))}
                    margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="geo" tick={{ fontSize:9, angle:-30, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="M" />
                    <Tooltip formatter={v=>[`$${fmt0(v)}M`]} />
                    <Bar dataKey="cap" name="Capital $M" fill={T.teal} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Investment Pipeline — Opportunities Above Hurdle Rate">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Company','Sector','Stage','Geography','TRL','IRR %','Capital $M','Valuation $M','Abatement kt','ESG Score'].map(h=>(
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].filter(c=>c.irr>=hurdleRate).sort((a,b)=>b.irr-a.irr).map((c,i)=>(
                    <tr key={c.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{c.name}</td>
                      <td style={{ padding:'7px 10px' }}>{c.sector}</td>
                      <td style={{ padding:'7px 10px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:'#eff6ff', color:'#1d4ed8' }}>{c.stage}</span></td>
                      <td style={{ padding:'7px 10px' }}>{c.geo}</td>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono }}>TRL {c.trl} — {TRL_DESC[c.trl]}</td>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono, fontWeight:700, color:T.green }}>{c.irr}%</td>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono }}>${fmt0(c.capexReq)}</td>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono }}>${fmt0(c.valuation)}</td>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{fmt0(c.abatPot)}</td>
                      <td style={{ padding:'7px 10px', fontFamily:T.mono, color:c.esgScore>=70?T.green:T.amber }}>{c.esgScore}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Return Analytics ── */}
        {tab==='Return Analytics' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Avg Portfolio IRR" value={`${fmt1(totals.avgIrr)}%`} sub="Unlevered" color={T.green} />
              <KpiCard label="Top-Quartile IRR" value={`${fmt1(filtered.filter(c=>c.topQuartile).reduce((s,c)=>s+c.irr,0)/(filtered.filter(c=>c.topQuartile).length||1))}%`} sub="IRR ≥ 28%" color={T.sage} />
              <KpiCard label="Avg Payback" value={`${fmt1(filtered.reduce((s,c)=>s+c.payback,0)/(filtered.length||1))} yrs`} sub="Simple payback" />
              <KpiCard label="Top-Quartile Companies" value={filtered.filter(c=>c.topQuartile).length} sub="IRR ≥ 28%" color={T.navy} />
            </div>
            <Card title="IRR Distribution — Portfolio Companies">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[8,12,16,20,24,28,32,36,40].map((lo,i,arr)=>({
                    range:`${lo}–${arr[i+1]||lo+4}%`,
                    count: filtered.filter(c=>c.irr>=lo&&c.irr<(arr[i+1]||lo+4)).length,
                  }))}
                  margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="range" tick={{ fontSize:10, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Companies" fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Return vs Payback Period Scatter">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Payback yr" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'Payback (yrs)', position:'insideBottom', offset:-5, fontSize:10 }} />
                  <YAxis dataKey="y" name="IRR %" tick={{ fontSize:10 }} label={{ value:'IRR %', angle:-90, position:'insideLeft', fontSize:10 }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v,n)=>[n==='x'?`${v} yrs`:`${v}%`, n==='x'?'Payback':'IRR']} />
                  <Scatter data={filtered.map(c=>({ x:c.payback, y:c.irr }))} fill={T.teal} opacity={0.6} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── Technology Readiness ── */}
        {tab==='Technology Readiness' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Avg TRL (Portfolio)" value={fmt1(totals.avgTrl)} sub="Technology Readiness Level" />
              <KpiCard label="Commercial Ready (TRL 7+)" value={filtered.filter(c=>c.trl>=7).length} sub="Pre-commercial to deployed" color={T.green} />
              <KpiCard label="Early Stage (TRL ≤ 4)" value={filtered.filter(c=>c.trl<=4).length} sub="Concept to lab" color={T.amber} />
              <KpiCard label="Portfolio Avg R&D Spend" value={`${fmt1(filtered.reduce((s,c)=>s+c.rdPct,0)/(filtered.length||1))}%`} sub="% of revenue" />
            </div>
            <Card title="TRL Distribution by Sector">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={SECTORS.map(s=>({
                    sector: s.split(' ')[0],
                    avgTrl: filtered.filter(c=>c.sector===s).reduce((a,c)=>a+c.trl,0)/(filtered.filter(c=>c.sector===s).length||1),
                  }))}
                  margin={{ top:5, right:20, left:0, bottom:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize:10, angle:-25, textAnchor:'end' }} />
                  <YAxis domain={[0,9]} tick={{ fontSize:10, fontFamily:T.mono }} />
                  <Tooltip formatter={v=>[fmt1(v)+' avg']} />
                  <Bar dataKey="avgTrl" name="Avg TRL" fill={T.navyL} radius={[4,4,0,0]} label={{ position:'top', fontSize:10, formatter:v=>fmt1(v) }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="TRL Scale Reference">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {Object.entries(TRL_DESC).map(([trl,desc])=>{
                  const cnt = filtered.filter(c=>c.trl===+trl).length;
                  return (
                    <div key={trl} style={{ background:T.surfaceH, borderRadius:8, padding:12, border:`1px solid ${T.borderL}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.navy }}>TRL {trl}</span>
                        <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{cnt} co.</span>
                      </div>
                      <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{desc}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ── Market Intelligence ── */}
        {tab==='Market Intelligence' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Market Potential" value="20.8 GtCO₂" sub="Addressable by 2035" color={T.navy} />
              <KpiCard label="Global CleanTech VC" value="$500B+" sub="Cumulative 2020–2025" color={T.gold} />
              <KpiCard label="IEA NZE Investment" value="$4.5T/yr" sub="Required by 2030" color={T.amber} />
              <KpiCard label="Current Annual Flow" value="$1.8T/yr" sub="2024 estimate" color={T.teal} />
            </div>
            <Card title="Global Market Potential by Sector (MtCO₂/yr by 2035)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={SECTORS.map(s=>({ sector:s.split(' ')[0], potential:SECTOR_META[s].potential, abatCost:SECTOR_META[s].abatCost }))}
                  margin={{ top:5, right:20, left:0, bottom:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize:9, angle:-30, textAnchor:'end' }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="Mt" />
                  <Tooltip formatter={v=>[`${fmt0(v)} MtCO₂/yr`]} />
                  <Bar dataKey="potential" name="Market Potential" fill={T.teal} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="IEA NZE Investment Gap — Required vs Current ($T/yr)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[2023,2025,2027,2030].map((yr,i)=>({
                    year:yr.toString(),
                    required: +(1.8+i*0.7).toFixed(1),
                    current:  +(1.8+i*0.25).toFixed(1),
                  }))}
                  margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="T" />
                  <Tooltip formatter={v=>[`$${v}T/yr`]} />
                  <Legend />
                  <Bar dataKey="required" name="IEA NZE Required" fill={T.red} radius={[4,4,0,0]} opacity={0.75} />
                  <Bar dataKey="current"  name="Current Flow"     fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <CleanTechAdvancedAnalytics T={T} moduleId="DF1" moduleName="CleanTech Investment Analytics" />
        </div>
      )}

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DF1 · CleanTech Investment Analytics · IEA NZE 2024 · IPCC AR6</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} companies · Hurdle {hurdleRate}% · C ${carbonPx}/t</span>
      </div>
    </div>
  );
}
