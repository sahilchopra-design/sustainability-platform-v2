import React, { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts';

const API = 'http://localhost:8000';

// ── Theme ──────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',blue:'#2563eb',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

// ── PAI Category Definitions ───────────────────────────────────────────────
const PAI_CATEGORIES = [
  { key:'climate', label:'Climate & GHG', color:T.navy, indicators:[
    { id:1, name:'GHG Emissions (S1+S2+S3)', unit:'tCO2e', metric:'Scope 1+2+3 GHG emissions', rts:'Table 1 #1', pillar:'E', pcaf:'PCAF Standard Ch.5' },
    { id:2, name:'Carbon Footprint', unit:'tCO2e/EUR M invested', metric:'Carbon footprint per EUR M', rts:'Table 1 #2', pillar:'E', pcaf:'PCAF Standard Ch.5' },
    { id:3, name:'GHG Intensity (WACI)', unit:'tCO2e/EUR M revenue', metric:'Weighted avg carbon intensity', rts:'Table 1 #3', pillar:'E', pcaf:'PCAF Standard Ch.6' },
    { id:4, name:'Fossil Fuel Exposure', unit:'%', metric:'Share in fossil fuel sector', rts:'Table 1 #4', pillar:'E', pcaf:'N/A' },
  ]},
  { key:'energy', label:'Energy', color:T.amber, indicators:[
    { id:5, name:'Non-Renewable Energy Share', unit:'%', metric:'Non-renewable energy consumption & production share', rts:'Table 1 #5', pillar:'E', pcaf:'N/A' },
    { id:6, name:'Energy Consumption Intensity', unit:'GWh/EUR M revenue', metric:'Energy intensity per high impact climate sector', rts:'Table 1 #6', pillar:'E', pcaf:'N/A' },
  ]},
  { key:'biodiversity', label:'Biodiversity', color:T.green, indicators:[
    { id:7, name:'Biodiversity-Sensitive Areas', unit:'Share', metric:'Activities negatively affecting biodiversity-sensitive areas', rts:'Table 1 #7', pillar:'E', pcaf:'N/A' },
  ]},
  { key:'water', label:'Water', color:T.teal, indicators:[
    { id:8, name:'Water Emissions', unit:'tonnes', metric:'Emissions to water', rts:'Table 1 #8', pillar:'E', pcaf:'N/A' },
  ]},
  { key:'waste', label:'Waste', color:T.amber, indicators:[
    { id:9, name:'Hazardous Waste Ratio', unit:'tonnes', metric:'Hazardous waste & radioactive waste ratio', rts:'Table 1 #9', pillar:'E', pcaf:'N/A' },
  ]},
  { key:'social', label:'Social & Governance', color:T.indigo, indicators:[
    { id:10, name:'UNGC/OECD Violations', unit:'%', metric:'Violations of UNGC & OECD Guidelines', rts:'Table 1 #10', pillar:'S', pcaf:'N/A' },
    { id:11, name:'Lack of Compliance Mechanisms', unit:'%', metric:'Lack of processes & mechanisms for UNGC/OECD monitoring', rts:'Table 1 #11', pillar:'S', pcaf:'N/A' },
    { id:12, name:'Unadjusted Gender Pay Gap', unit:'%', metric:'Average unadjusted gender pay gap', rts:'Table 1 #12', pillar:'S', pcaf:'N/A' },
    { id:13, name:'Board Gender Diversity', unit:'%', metric:'Average ratio of female to male board members', rts:'Table 1 #13', pillar:'G', pcaf:'N/A' },
    { id:14, name:'Controversial Weapons', unit:'%', metric:'Involvement in controversial weapons', rts:'Table 1 #14', pillar:'S', pcaf:'N/A' },
  ]},
  { key:'sovereign', label:'Sovereign', color:T.sage, indicators:[
    { id:15, name:'GHG Intensity of Sovereign', unit:'tCO2e/EUR M GDP', metric:'GHG intensity of investee countries', rts:'Table 1 #15', pillar:'E', pcaf:'PCAF Sovereign' },
    { id:16, name:'Countries with Social Violations', unit:'count', metric:'Investee countries subject to social violations', rts:'Table 1 #16', pillar:'S', pcaf:'N/A' },
  ]},
];

const ALL_INDICATORS = PAI_CATEGORIES.flatMap(c => c.indicators.map(i => ({ ...i, category: c.key, catColor: c.color })));

import { isIndiaMode, adaptForSFDRPAI } from '../../../data/IndiaDataAdapter';

// ── Default portfolio ──────────────────────────────────────────────────────
const _DEFAULT_HOLDINGS = [
  { name:'Tata Consultancy Services', sector:'IT', marketValue:4200000, weight:28.0, scope1:18500, scope2:92000, scope3:310000, revenue:2200000, fossilExposure:0, nonRenewable:32, energyIntensity:0.12, biodiversity:0, waterEmissions:45, hazWaste:12, ungcViolation:0, complianceLack:0, genderPayGap:8.2, boardDiversity:33.3, controversialWeapons:0 },
  { name:'Reliance Industries', sector:'Energy', marketValue:3800000, weight:25.3, scope1:42000, scope2:18000, scope3:520000, revenue:7500000, fossilExposure:42, nonRenewable:68, energyIntensity:0.85, biodiversity:0.02, waterEmissions:890, hazWaste:4500, ungcViolation:0, complianceLack:0, genderPayGap:12.5, boardDiversity:16.7, controversialWeapons:0 },
  { name:'Tata Steel', sector:'Materials', marketValue:2800000, weight:18.7, scope1:68000, scope2:12000, scope3:180000, revenue:2400000, fossilExposure:15, nonRenewable:78, energyIntensity:1.42, biodiversity:0.05, waterEmissions:2200, hazWaste:8900, ungcViolation:0, complianceLack:5, genderPayGap:15.1, boardDiversity:25.0, controversialWeapons:0 },
  { name:'HDFC Bank', sector:'Financials', marketValue:2500000, weight:16.7, scope1:2400, scope2:45000, scope3:85000, revenue:1800000, fossilExposure:8, nonRenewable:22, energyIntensity:0.04, biodiversity:0, waterEmissions:8, hazWaste:3, ungcViolation:0, complianceLack:0, genderPayGap:18.3, boardDiversity:30.0, controversialWeapons:0 },
  { name:'Adani Green Energy', sector:'Utilities', marketValue:1700000, weight:11.3, scope1:850, scope2:3200, scope3:42000, revenue:950000, fossilExposure:0, nonRenewable:5, energyIntensity:0.02, biodiversity:0.08, waterEmissions:15, hazWaste:22, ungcViolation:0, complianceLack:0, genderPayGap:10.0, boardDiversity:20.0, controversialWeapons:0 },
];
// ── India Dataset Integration ──
const DEFAULT_HOLDINGS = isIndiaMode() ? adaptForSFDRPAI() : _DEFAULT_HOLDINGS;

// ── DNSH Objectives ────────────────────────────────────────────────────────
const DNSH_OBJECTIVES = [
  { id:'ccm', label:'Climate Change Mitigation', desc:'Activity does not lead to significant GHG emissions' },
  { id:'cca', label:'Climate Change Adaptation', desc:'Activity does not increase climate vulnerability' },
  { id:'wm', label:'Water & Marine Resources', desc:'Activity does not harm water bodies or marine ecosystems' },
  { id:'ce', label:'Circular Economy', desc:'Activity does not generate significant waste or inefficiency' },
  { id:'pp', label:'Pollution Prevention', desc:'Activity does not increase pollution to air, water, or soil' },
  { id:'bio', label:'Biodiversity & Ecosystems', desc:'Activity does not degrade ecosystems or biodiversity' },
];

// ── Mini Components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, color='navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : (color==='navy'?T.navy:color==='gold'?T.gold:color==='green'?T.green:color==='red'?T.red:color==='sage'?T.sage:color==='indigo'?T.indigo:T.blue),
    color:'#fff', border:'none', borderRadius:6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily:T.font, transition:'opacity .15s',
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
    padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.06)', ...style }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color, wide, trend, badge }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
    padding:'16px 20px', minWidth: wide ? 200 : 140, flex:1 }}>
    <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>
    <div style={{ display:'flex', alignItems:'baseline', gap:8, margin:'6px 0 2px' }}>
      <span style={{ fontSize:26, fontWeight:700, color:color||T.navy }}>{value}</span>
      {trend && <span style={{ fontSize:13, color: trend > 0 ? T.red : T.green }}>{trend > 0 ? '\u2191' : '\u2193'} {Math.abs(trend).toFixed(1)}%</span>}
    </div>
    {sub && <div style={{ fontSize:11, color:T.sub }}>{sub}</div>}
    {badge && <span style={{ display:'inline-block', marginTop:4, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12,
      background: badge==='above' ? '#fef2f2' : '#f0fdf4', color: badge==='above' ? T.red : T.green }}>
      {badge==='above' ? 'Above Peer Avg' : 'Below Peer Avg'}
    </span>}
  </div>
);

const Inp = ({ label, value, onChange, type='text', placeholder, small, width }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, width }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <input value={value} onChange={e=>onChange(type==='number'?e.target.value:e.target.value)} type={type} placeholder={placeholder}
      style={{ border:`1px solid ${T.border}`, borderRadius:6, padding: small ? '5px 10px' : '8px 12px',
        fontSize: small ? 12 : 13, fontFamily:T.font, background:'#fafafa', color:T.text, outline:'none' }} />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
        fontSize:13, fontFamily:T.font, background:'#fafafa', color:T.text }}>
      {options.map(o => <option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}
    </select>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{ display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:12, background:color+'1a', color }}>{children}</span>
);

const SectionHeader = ({ color, label, count }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 12px' }}>
    <div style={{ width:4, height:24, borderRadius:2, background:color }} />
    <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{label}</span>
    {count != null && <Badge color={color}>{count} indicators</Badge>}
  </div>
);

const Table = ({ columns, data, compact }) => (
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize: compact ? 12 : 13, fontFamily:T.font }}>
      <thead>
        <tr>{columns.map(c => (
          <th key={c.key} style={{ textAlign:c.align||'left', padding: compact ? '6px 8px' : '10px 12px', borderBottom:`2px solid ${T.border}`,
            fontSize:11, fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:.5, whiteSpace:'nowrap' }}>{c.label}</th>
        ))}</tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ background: i%2===0 ? '#fafaf8' : T.card }}>
            {columns.map(c => (
              <td key={c.key} style={{ padding: compact ? '6px 8px' : '10px 12px', borderBottom:`1px solid ${T.border}`,
                textAlign:c.align||'left', color:T.text, whiteSpace: c.nowrap ? 'nowrap' : 'normal' }}>
                {c.render ? c.render(row[c.key], row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:0, borderBottom:`2px solid ${T.border}`, marginBottom:20 }}>
    {tabs.map(t => (
      <button key={t.key} onClick={()=>onChange(t.key)} style={{
        padding:'10px 20px', fontSize:13, fontWeight: active===t.key ? 700 : 500,
        color: active===t.key ? T.navy : T.sub, background:'none', border:'none',
        borderBottom: active===t.key ? `3px solid ${T.gold}` : '3px solid transparent',
        cursor:'pointer', fontFamily:T.font, transition:'all .15s',
      }}>{t.label}</button>
    ))}
  </div>
);

const Alert = ({ children, type='info' }) => {
  const colors = { info:{bg:'#eff6ff',border:'#93c5fd',text:'#1e40af'}, warn:{bg:'#fffbeb',border:'#fcd34d',text:'#92400e'}, ok:{bg:'#f0fdf4',border:'#86efac',text:'#166534'}, err:{bg:'#fef2f2',border:'#fca5a5',text:'#991b1b'} };
  const c = colors[type]||colors.info;
  return <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:'12px 16px', fontSize:13, color:c.text }}>{children}</div>;
};

// ── API Helpers ─────────────────────────────────────────────────────────────
const api = async (path, body) => {
  try {
    const r = body !== undefined
      ? await fetch(`${API}/api/v1/sfdr-pai${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      : await fetch(`${API}/api/v1/sfdr-pai${path}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch(e) {
    console.error(`SFDR-PAI API ${path}:`, e);
    return null;
  }
};

// ── Mock result generators (used as fallback when API unavailable) ─────────
const mockCalculateAll = (holdings) => {
  const totalAUM = holdings.reduce((s,h) => s + h.marketValue, 0);
  const safeTotalAUM = totalAUM || 1; // guard: prevents Infinity/NaN when all holdings removed
  const wSum = (field) => holdings.reduce((s,h) => s + h[field] * (h.marketValue/safeTotalAUM), 0);
  const totalGHG = holdings.reduce((s,h) => s + h.scope1+h.scope2+h.scope3, 0);
  return {
    indicators: [
      { id:1, name:'GHG Emissions (S1+S2+S3)', value: totalGHG, unit:'tCO2e', trend:3.2, benchmark:'above' },
      { id:2, name:'Carbon Footprint', value: (totalGHG/(safeTotalAUM/1e6)).toFixed(1), unit:'tCO2e/EUR M', trend:-2.1, benchmark:'below' },
      { id:3, name:'GHG Intensity (WACI)', value: wSum('scope1')+(wSum('scope2')), unit:'tCO2e/EUR M rev', trend:1.8, benchmark:'above' },
      { id:4, name:'Fossil Fuel Exposure', value: wSum('fossilExposure').toFixed(1), unit:'%', trend:0, benchmark:'below' },
      { id:5, name:'Non-Renewable Energy', value: wSum('nonRenewable').toFixed(1), unit:'%', trend:-4.5, benchmark:'below' },
      { id:6, name:'Energy Intensity', value: wSum('energyIntensity').toFixed(3), unit:'GWh/EUR M rev', trend:2.0, benchmark:'above' },
      { id:7, name:'Biodiversity Impact', value: wSum('biodiversity').toFixed(3), unit:'share', trend:0, benchmark:'below' },
      { id:8, name:'Water Emissions', value: wSum('waterEmissions').toFixed(0), unit:'tonnes', trend:-1.2, benchmark:'below' },
      { id:9, name:'Hazardous Waste', value: wSum('hazWaste').toFixed(0), unit:'tonnes', trend:5.3, benchmark:'above' },
      { id:10, name:'UNGC/OECD Violations', value: wSum('ungcViolation').toFixed(1), unit:'%', trend:0, benchmark:'below' },
      { id:11, name:'Compliance Mechanism Gaps', value: wSum('complianceLack').toFixed(1), unit:'%', trend:0, benchmark:'below' },
      { id:12, name:'Gender Pay Gap', value: wSum('genderPayGap').toFixed(1), unit:'%', trend:-0.5, benchmark:'above' },
      { id:13, name:'Board Gender Diversity', value: wSum('boardDiversity').toFixed(1), unit:'%', trend:2.3, benchmark:'below' },
      { id:14, name:'Controversial Weapons', value: wSum('controversialWeapons').toFixed(1), unit:'%', trend:0, benchmark:'below' },
    ],
    portfolio_aum: totalAUM,
    reporting_period:'2025-01-01 to 2025-12-31',
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: PAI Calculator
// ═══════════════════════════════════════════════════════════════════════════
const TabCalculator = () => {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS.map(h=>({...h})));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateHolding = (idx, field, val) => {
    const next = [...holdings];
    next[idx] = { ...next[idx], [field]: field==='name'||field==='sector' ? val : Number(val)||0 };
    setNext(next);
  };
  const setNext = (arr) => {
    const total = arr.reduce((s,h) => s + h.marketValue, 0);
    setHoldings(arr.map(h => ({ ...h, weight: total > 0 ? ((h.marketValue/total)*100) : 0 })));
  };

  const addHolding = () => {
    setNext([...holdings, { name:'', sector:'', marketValue:0, weight:0, scope1:0, scope2:0, scope3:0, revenue:0,
      fossilExposure:0, nonRenewable:0, energyIntensity:0, biodiversity:0, waterEmissions:0, hazWaste:0,
      ungcViolation:0, complianceLack:0, genderPayGap:0, boardDiversity:0, controversialWeapons:0 }]);
  };

  const removeHolding = (idx) => { const n = holdings.filter((_,i)=>i!==idx); setNext(n); };

  const calculate = async () => {
    setLoading(true);
    const body = {
      portfolio: { holdings: holdings.map(h => ({ entity_name:h.name, sector:h.sector, market_value:h.marketValue, ...h })),
        total_aum: holdings.reduce((s,h)=>s+h.marketValue,0), reporting_period:'2025' },
    };
    const res = await api('/calculate-all', body);
    setResults(res || mockCalculateAll(holdings));
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Alert type="info">Configure your portfolio holdings below. Each PAI indicator is calculated based on weighted entity-level data mapped to the 14 mandatory SFDR indicators (SFDR RTS Annex I, Table 1).</Alert>

      {/* ── Holdings Table ─────────────────────────────────── */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontSize:15, fontWeight:700, color:T.navy }}>Portfolio Holdings</span>
          <Btn sm onClick={addHolding} color="sage">+ Add Holding</Btn>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Entity','Sector','MktVal (EUR)','Wt %','S1 tCO2e','S2 tCO2e','S3 tCO2e','Revenue EUR','Fossil %','NonRenew %','EnergyInt','BiodivImpact','WaterEm','HazWaste','UNGC %','CompGap %','PayGap %','BoardDiv %','ContWeap %',''].map(h => (
                  <th key={h} style={{ padding:'6px 4px', fontSize:10, fontWeight:700, color:T.sub, textTransform:'uppercase', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={i} style={{ background: i%2===0 ? '#fafaf8' : T.card }}>
                  <td style={{ padding:'4px' }}><input value={h.name} onChange={e=>updateHolding(i,'name',e.target.value)} style={{ width:140, fontSize:11, padding:'4px 6px', border:`1px solid ${T.border}`, borderRadius:4, fontFamily:T.font }} /></td>
                  <td style={{ padding:'4px' }}><input value={h.sector} onChange={e=>updateHolding(i,'sector',e.target.value)} style={{ width:80, fontSize:11, padding:'4px 6px', border:`1px solid ${T.border}`, borderRadius:4, fontFamily:T.font }} /></td>
                  {['marketValue','weight','scope1','scope2','scope3','revenue','fossilExposure','nonRenewable','energyIntensity','biodiversity','waterEmissions','hazWaste','ungcViolation','complianceLack','genderPayGap','boardDiversity','controversialWeapons'].map(f => (
                    <td key={f} style={{ padding:'4px' }}>
                      <input value={h[f]} onChange={e=>updateHolding(i,f,e.target.value)} type="number" style={{ width: f==='weight' ? 50 : 70, fontSize:11, padding:'4px 6px', border:`1px solid ${T.border}`, borderRadius:4, fontFamily:T.font, textAlign:'right' }}
                        readOnly={f==='weight'} />
                    </td>
                  ))}
                  <td style={{ padding:'4px' }}><button onClick={()=>removeHolding(i)} style={{ background:'none', border:'none', color:T.red, cursor:'pointer', fontSize:14, fontWeight:700 }}>&times;</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Category Grouped Inputs ─────────────────────── */}
      {PAI_CATEGORIES.map(cat => (
        <Card key={cat.key} style={{ borderLeft:`4px solid ${cat.color}` }}>
          <SectionHeader color={cat.color} label={cat.label} count={cat.indicators.length} />
          <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            {cat.indicators.map(ind => (
              <div key={ind.id} style={{ background:'#fafaf8', borderRadius:8, padding:12, minWidth:220, flex:'1 1 220px', border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:cat.color }}>PAI {ind.id}</div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, margin:'4px 0 2px' }}>{ind.name}</div>
                <div style={{ fontSize:11, color:T.sub }}>{ind.metric}</div>
                <div style={{ fontSize:10, color:T.sub, marginTop:4 }}>Unit: {ind.unit} | RTS: {ind.rts}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* ── Calculate Button ──────────────────────────────── */}
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <Btn onClick={calculate} disabled={loading || holdings.length===0} color="navy">
          {loading ? 'Calculating...' : '\u25B6 Calculate All PAI'}
        </Btn>
        <span style={{ fontSize:12, color:T.sub }}>{holdings.length} holdings | AUM: EUR {(holdings.reduce((s,h)=>s+h.marketValue,0)/1e6).toFixed(1)}M</span>
      </div>

      {/* ── Results Grid ─────────────────────────────────── */}
      {results && (
        <Card style={{ borderTop:`3px solid ${T.gold}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:4 }}>PAI Indicator Results</div>
          <div style={{ fontSize:12, color:T.sub, marginBottom:16 }}>Reporting period: {results.reporting_period} | AUM: EUR {(results.portfolio_aum/1e6).toFixed(1)}M</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
            {(results.indicators||[]).map(ind => (
              <KpiCard key={ind.id} label={`PAI ${ind.id}: ${ind.name}`}
                value={typeof ind.value==='number' ? ind.value.toLocaleString() : ind.value}
                sub={ind.unit} color={ALL_INDICATORS.find(a=>a.id===ind.id)?.catColor || T.navy}
                trend={ind.trend} badge={ind.benchmark} />
            ))}
          </div>

          {/* ── Bar chart summary ──────────────────────────── */}
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>PAI Indicator Overview</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(results.indicators||[]).map(i => ({ name:`PAI ${i.id}`, value: parseFloat(i.value)||0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize:12, fontFamily:T.font }} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {(results.indicators||[]).map((ind, idx) => (
                    <Cell key={idx} fill={ALL_INDICATORS.find(a=>a.id===ind.id)?.catColor || T.navy} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: DNSH Assessment
// ═══════════════════════════════════════════════════════════════════════════
const TabDnsh = () => {
  const [checks, setChecks] = useState(DNSH_OBJECTIVES.map(o => ({ ...o, pass:null, evidence:'' })));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = (idx, val) => { const n=[...checks]; n[idx]={...n[idx], pass:val}; setChecks(n); };
  const setEvidence = (idx, val) => { const n=[...checks]; n[idx]={...n[idx], evidence:val}; setChecks(n); };

  const runDnsh = async () => {
    setLoading(true);
    const body = { objectives: checks.map(c => ({ objective_id:c.id, label:c.label, pass:c.pass, evidence:c.evidence })) };
    const res = await api('/dnsh', body);
    if (res) { setResult(res); } else {
      const passed = checks.filter(c=>c.pass===true).length;
      const failed = checks.filter(c=>c.pass===false).length;
      const pending = checks.filter(c=>c.pass===null).length;
      setResult({
        summary: { total:6, passed, failed, pending, compliant: failed===0 && pending===0 },
        gaps: checks.filter(c=>c.pass===false).map(c=>({ objective:c.label, status:'FAIL', recommendation:`Address ${c.label} — provide evidence of compliance or mitigation measures.` })),
        matrix: checks.map(c=>({ objective:c.label, status: c.pass===true ? 'PASS' : c.pass===false ? 'FAIL' : 'PENDING', evidence:c.evidence })),
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Alert type="info">Assess compliance with the six EU Taxonomy environmental objectives under the Do No Significant Harm (DNSH) principle. Each objective requires a pass/fail assessment with supporting evidence.</Alert>

      <Card>
        <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:16 }}>DNSH Objective Assessment</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {checks.map((c, i) => (
            <div key={c.id} style={{ background:'#fafaf8', borderRadius:8, padding:16, border:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{i+1}. {c.label}</div>
                  <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{c.desc}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button onClick={()=>toggle(i, true)} style={{ padding:'6px 16px', borderRadius:6, border: c.pass===true ? `2px solid ${T.green}` : `1px solid ${T.border}`,
                    background: c.pass===true ? '#f0fdf4' : '#fff', color: c.pass===true ? T.green : T.sub,
                    fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:T.font }}>Pass</button>
                  <button onClick={()=>toggle(i, false)} style={{ padding:'6px 16px', borderRadius:6, border: c.pass===false ? `2px solid ${T.red}` : `1px solid ${T.border}`,
                    background: c.pass===false ? '#fef2f2' : '#fff', color: c.pass===false ? T.red : T.sub,
                    fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:T.font }}>Fail</button>
                </div>
              </div>
              <textarea value={c.evidence} onChange={e=>setEvidence(i, e.target.value)} placeholder="Evidence notes..."
                style={{ width:'100%', marginTop:10, border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
                  fontSize:12, fontFamily:T.font, background:'#fff', color:T.text, minHeight:48, resize:'vertical', outline:'none' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop:16 }}>
          <Btn onClick={runDnsh} disabled={loading} color="navy">{loading ? 'Assessing...' : '\u25B6 Run DNSH Assessment'}</Btn>
        </div>
      </Card>

      {result && (
        <>
          <Card style={{ borderTop:`3px solid ${result.summary.compliant ? T.green : T.red}` }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 }}>
              <KpiCard label="Objectives Assessed" value={result.summary.total} color={T.navy} />
              <KpiCard label="Passed" value={result.summary.passed} color={T.green} />
              <KpiCard label="Failed" value={result.summary.failed} color={T.red} />
              <KpiCard label="Pending" value={result.summary.pending} color={T.amber} />
              <KpiCard label="DNSH Compliant" value={result.summary.compliant ? 'YES' : 'NO'} color={result.summary.compliant ? T.green : T.red} />
            </div>
          </Card>

          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Compliance Matrix</div>
            <Table compact columns={[
              { key:'objective', label:'Objective' },
              { key:'status', label:'Status', render:(v)=><Badge color={v==='PASS'?T.green:v==='FAIL'?T.red:T.amber}>{v}</Badge> },
              { key:'evidence', label:'Evidence' },
            ]} data={result.matrix||[]} />
          </Card>

          {(result.gaps||[]).length > 0 && (
            <Card style={{ borderLeft:`4px solid ${T.red}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.red, marginBottom:12 }}>Gap Analysis</div>
              {result.gaps.map((g,i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom: i < result.gaps.length-1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{g.objective}</div>
                  <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{g.recommendation}</div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: PAI Statement Generator
// ═══════════════════════════════════════════════════════════════════════════
const TabStatement = () => {
  const [entity, setEntity] = useState('India ESG Equity Fund');
  const [period, setPeriod] = useState('2025-01-01 to 2025-12-31');
  const [aum, setAum] = useState('15000000');
  const [classification, setClassification] = useState('article_8');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const body = { entity_name:entity, reporting_period:period, aum:Number(aum), classification };
    const res = await api('/pai-statement', body);
    if (res) { setStatement(res); } else {
      setStatement({
        statement: `PRINCIPAL ADVERSE IMPACT STATEMENT\n\nFinancial market participant: ${entity}\nReporting period: ${period}\nTotal AUM: EUR ${(Number(aum)/1e6).toFixed(1)}M\nProduct classification: ${classification.replace('_',' ').toUpperCase()}\n\n` +
          `This statement is the consolidated principal adverse sustainability impacts statement of ${entity} for the reference period ${period}.\n\n` +
          `SECTION I: DESCRIPTION OF PAI POLICIES\n${entity} considers the principal adverse impacts of its investment decisions on sustainability factors. This statement describes those impacts using the indicators set out in Tables 1, 2 and 3 of the SFDR Delegated Regulation (RTS).\n\n` +
          `SECTION II: DESCRIPTION OF PAI INDICATORS\nThe following mandatory indicators were assessed across the portfolio:\n- GHG Emissions (Scope 1+2+3)\n- Carbon Footprint\n- GHG Intensity of Investee Companies (WACI)\n- Exposure to Fossil Fuel Sector\n- Non-Renewable Energy Share\n- Energy Consumption Intensity\n- Activities Negatively Affecting Biodiversity\n- Emissions to Water\n- Hazardous & Radioactive Waste Ratio\n- Violations of UNGC/OECD Guidelines\n- Lack of Compliance Processes\n- Unadjusted Gender Pay Gap\n- Board Gender Diversity\n- Exposure to Controversial Weapons\n\n` +
          `SECTION III: ACTIONS TAKEN & PLANNED\nEngagement activities were conducted with investee companies showing adverse performance on PAI indicators. Voting rights were exercised in favor of resolutions promoting sustainability improvements.\n\n` +
          `SECTION IV: ADHERENCE TO INTERNATIONAL STANDARDS\nThe investment process adheres to the OECD Guidelines for Multinational Enterprises, UN Guiding Principles on Business and Human Rights, and the principles of the UN Global Compact.\n\n` +
          `This disclosure is prepared in accordance with Articles 4 and 7 of the SFDR Regulation (EU) 2019/2088 and the associated RTS under Commission Delegated Regulation (EU) 2022/1288.`,
        generated_at: new Date().toISOString(),
        format:'SFDR RTS Annex I Template',
      });
    }
    setLoading(false);
  };

  const download = () => {
    if (!statement) return;
    const blob = new Blob([statement.statement], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `PAI_Statement_${entity.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Alert type="info">Generate a regulatory-compliant PAI disclosure statement per SFDR RTS Annex I. The statement follows the mandatory four-section format required for Art. 4 and Art. 7 disclosures.</Alert>

      <Card>
        <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:16 }}>Statement Configuration</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          <Inp label="Reporting Entity Name" value={entity} onChange={setEntity} placeholder="Fund / FMP name" />
          <Inp label="Reporting Period" value={period} onChange={setPeriod} placeholder="YYYY-MM-DD to YYYY-MM-DD" />
          <Inp label="Total AUM (EUR)" value={aum} onChange={setAum} type="number" placeholder="15000000" />
          <Sel label="Product Classification" value={classification} onChange={setClassification}
            options={[{value:'article_6',label:'Article 6'},{value:'article_8',label:'Article 8'},{value:'article_9',label:'Article 9'}]} />
        </div>
        <div style={{ marginTop:16 }}>
          <Btn onClick={generate} disabled={loading} color="navy">{loading ? 'Generating...' : '\u25B6 Generate PAI Statement'}</Btn>
        </div>
      </Card>

      {statement && (
        <Card style={{ borderTop:`3px solid ${T.gold}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>PAI Disclosure Statement</div>
              <div style={{ fontSize:11, color:T.sub }}>Format: {statement.format} | Generated: {new Date(statement.generated_at).toLocaleString()}</div>
            </div>
            <Btn sm onClick={download} color="sage">Download .txt</Btn>
          </div>
          <pre style={{ background:'#fafaf8', border:`1px solid ${T.border}`, borderRadius:8, padding:20,
            fontSize:12.5, lineHeight:1.7, fontFamily:T.font, whiteSpace:'pre-wrap', color:T.text, overflowX:'auto', maxHeight:600, overflow:'auto' }}>
            {statement.statement}
          </pre>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4: Period Comparison
// ═══════════════════════════════════════════════════════════════════════════
const TabComparison = () => {
  const [p1Label, setP1Label] = useState('2024');
  const [p2Label, setP2Label] = useState('2025');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const MOCK_P1 = [
    { id:1, name:'GHG Emissions', value:1180000, unit:'tCO2e' },
    { id:2, name:'Carbon Footprint', value:78.5, unit:'tCO2e/EUR M' },
    { id:3, name:'WACI', value:42100, unit:'tCO2e/EUR M rev' },
    { id:4, name:'Fossil Fuel Exposure', value:16.2, unit:'%' },
    { id:5, name:'Non-Renewable Energy', value:48.3, unit:'%' },
    { id:6, name:'Energy Intensity', value:0.58, unit:'GWh/EUR M rev' },
    { id:7, name:'Biodiversity Impact', value:0.028, unit:'share' },
    { id:8, name:'Water Emissions', value:720, unit:'tonnes' },
    { id:9, name:'Hazardous Waste', value:3100, unit:'tonnes' },
    { id:10, name:'UNGC Violations', value:0, unit:'%' },
    { id:11, name:'Compliance Gaps', value:1.2, unit:'%' },
    { id:12, name:'Gender Pay Gap', value:14.8, unit:'%' },
    { id:13, name:'Board Diversity', value:22.5, unit:'%' },
    { id:14, name:'Controversial Weapons', value:0, unit:'%' },
  ];
  const MOCK_P2 = [
    { id:1, name:'GHG Emissions', value:1145000, unit:'tCO2e' },
    { id:2, name:'Carbon Footprint', value:76.2, unit:'tCO2e/EUR M' },
    { id:3, name:'WACI', value:40800, unit:'tCO2e/EUR M rev' },
    { id:4, name:'Fossil Fuel Exposure', value:14.8, unit:'%' },
    { id:5, name:'Non-Renewable Energy', value:44.1, unit:'%' },
    { id:6, name:'Energy Intensity', value:0.55, unit:'GWh/EUR M rev' },
    { id:7, name:'Biodiversity Impact', value:0.025, unit:'share' },
    { id:8, name:'Water Emissions', value:680, unit:'tonnes' },
    { id:9, name:'Hazardous Waste', value:3350, unit:'tonnes' },
    { id:10, name:'UNGC Violations', value:0, unit:'%' },
    { id:11, name:'Compliance Gaps', value:0.9, unit:'%' },
    { id:12, name:'Gender Pay Gap', value:13.2, unit:'%' },
    { id:13, name:'Board Diversity', value:25.1, unit:'%' },
    { id:14, name:'Controversial Weapons', value:0, unit:'%' },
  ];

  const compare = async () => {
    setLoading(true);
    const body = { period_1: { label:p1Label, indicators:MOCK_P1 }, period_2: { label:p2Label, indicators:MOCK_P2 } };
    const res = await api('/compare-periods', body);
    if (res) { setResult(res); } else {
      const rows = MOCK_P1.map((p1, i) => {
        const p2 = MOCK_P2[i];
        const change = p1.value !== 0 ? ((p2.value - p1.value)/p1.value*100) : (p2.value > 0 ? 100 : 0);
        // For most indicators, decrease = improvement; for board diversity, increase = improvement
        const inverted = [13];
        const improved = inverted.includes(p1.id) ? change > 0 : change < 0;
        return { id:p1.id, name:p1.name, unit:p1.unit, p1_value:p1.value, p2_value:p2.value,
          change: change.toFixed(1), status: Math.abs(change) < 0.1 ? 'unchanged' : improved ? 'improved' : 'deteriorated' };
      });
      setResult({ comparison: rows, period_1: p1Label, period_2: p2Label,
        summary: { improved: rows.filter(r=>r.status==='improved').length, deteriorated: rows.filter(r=>r.status==='deteriorated').length, unchanged: rows.filter(r=>r.status==='unchanged').length }
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Alert type="info">Compare PAI indicator values across two reporting periods. Improvements and deteriorations are flagged per indicator, accounting for directionality (lower is better for most indicators; higher is better for Board Diversity).</Alert>

      <Card>
        <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:16 }}>Period Configuration</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
          <Inp label="Period 1 Label" value={p1Label} onChange={setP1Label} placeholder="2024" width="180px" />
          <Inp label="Period 2 Label" value={p2Label} onChange={setP2Label} placeholder="2025" width="180px" />
          <Btn onClick={compare} disabled={loading} color="navy">{loading ? 'Comparing...' : '\u25B6 Compare Periods'}</Btn>
        </div>
        <div style={{ fontSize:11, color:T.sub, marginTop:8 }}>Using sample data for demonstration. Connect to API for live portfolio data.</div>
      </Card>

      {result && (
        <>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <KpiCard label="Improved" value={result.summary.improved} color={T.green} sub="indicators" />
            <KpiCard label="Deteriorated" value={result.summary.deteriorated} color={T.red} sub="indicators" />
            <KpiCard label="Unchanged" value={result.summary.unchanged} color={T.sub} sub="indicators" />
          </div>

          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>YoY Comparison — {result.period_1} vs {result.period_2}</div>
            <Table columns={[
              { key:'id', label:'#', align:'center' },
              { key:'name', label:'Indicator' },
              { key:'p1_value', label:result.period_1, align:'right', render:(v)=>typeof v==='number' ? v.toLocaleString() : v },
              { key:'p2_value', label:result.period_2, align:'right', render:(v)=>typeof v==='number' ? v.toLocaleString() : v },
              { key:'unit', label:'Unit' },
              { key:'change', label:'Change %', align:'right', render:(v)=> <span style={{ color: parseFloat(v)>0?T.red:parseFloat(v)<0?T.green:T.sub, fontWeight:700 }}>{parseFloat(v)>0?'+':''}{v}%</span> },
              { key:'status', label:'Status', render:(v)=><Badge color={v==='improved'?T.green:v==='deteriorated'?T.red:T.sub}>{v.toUpperCase()}</Badge> },
            ]} data={result.comparison||[]} />
          </Card>

          {/* ── Waterfall Chart ────────────────────────────── */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Change Waterfall (% YoY)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={(result.comparison||[]).map(r => ({ name:`PAI ${r.id}`, change:parseFloat(r.change), status:r.status }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={v=>`${v}%`} />
                <Tooltip contentStyle={{ fontSize:12, fontFamily:T.font }} formatter={v=>`${v}%`} />
                <Bar dataKey="change" radius={[4,4,0,0]}>
                  {(result.comparison||[]).map((r, idx) => (
                    <Cell key={idx} fill={r.status==='improved' ? T.green : r.status==='deteriorated' ? T.red : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5: Reference
// ═══════════════════════════════════════════════════════════════════════════
const TabReference = () => {
  const [sub, setSub] = useState('mandatory');
  const subs = [
    { key:'mandatory', label:'14 Mandatory PAI' },
    { key:'additional', label:'Additional Indicators' },
    { key:'classification', label:'Art 6/8/9 Classification' },
    { key:'disclosure', label:'RTS Disclosure Format' },
    { key:'methods', label:'Calculation Methods' },
  ];

  const ADDITIONAL_INDICATORS = [
    { id:'A1', name:'Investments in companies without carbon emission reduction initiatives', cat:'Climate', unit:'%', rts:'Table 2 #4' },
    { id:'A2', name:'Breakdown of energy consumption by type of non-renewable sources', cat:'Climate', unit:'GWh', rts:'Table 2 #5' },
    { id:'A3', name:'Water usage and recycling', cat:'Climate', unit:'m\u00B3', rts:'Table 2 #6' },
    { id:'A4', name:'Investment in companies without water management policies', cat:'Climate', unit:'%', rts:'Table 2 #7' },
    { id:'A5', name:'Investments in companies producing chemicals', cat:'Climate', unit:'%', rts:'Table 2 #9' },
    { id:'A6', name:'Land degradation, desertification, soil sealing', cat:'Climate', unit:'share', rts:'Table 2 #10' },
    { id:'S1', name:'Investments in companies without workplace accident prevention', cat:'Social', unit:'%', rts:'Table 3 #1' },
    { id:'S2', name:'Rate of accidents', cat:'Social', unit:'rate', rts:'Table 3 #2' },
    { id:'S3', name:'Number of days lost to injuries, accidents, fatalities, illness', cat:'Social', unit:'days', rts:'Table 3 #3' },
    { id:'S4', name:'Lack of a supplier code of conduct', cat:'Social', unit:'%', rts:'Table 3 #4' },
    { id:'S5', name:'Lack of grievance/complaints handling mechanism', cat:'Social', unit:'%', rts:'Table 3 #5' },
    { id:'S6', name:'Insufficient whistleblower protection', cat:'Social', unit:'%', rts:'Table 3 #6' },
    { id:'S7', name:'Incidents of discrimination', cat:'Social', unit:'count', rts:'Table 3 #7' },
    { id:'S8', name:'Excessive CEO pay ratio', cat:'Social', unit:'ratio', rts:'Table 3 #8' },
  ];

  const ART_CLASSIFICATIONS = [
    { article:'Article 6', scope:'All financial products', paiReq:'No mandatory PAI disclosure, but must explain how sustainability risks are integrated', examples:'Standard mutual funds, ETFs without ESG mandate', color:T.sub },
    { article:'Article 8', scope:'Products promoting E/S characteristics', paiReq:'Must disclose how PAI indicators are considered; must publish pre-contractual SFDR Annex II', examples:'ESG-screened funds, best-in-class ESG funds, thematic ESG', color:T.blue },
    { article:'Article 9', scope:'Products with sustainable investment objective', paiReq:'Full PAI disclosure mandatory; must demonstrate all 14 mandatory indicators + selected additional; must show DNSH for each investment', examples:'Impact funds, green bond funds, climate-transition aligned', color:T.green },
  ];

  const DISCLOSURE_SECTIONS = [
    { section:'Section I', title:'Description of PAI Policies', content:'Description of the policies for identifying and prioritising principal adverse sustainability impacts. Due diligence policies. Adherence to responsible business conduct codes and standards.' },
    { section:'Section II', title:'Description of PAI Indicators', content:'All 14 mandatory indicators from Table 1 with quantified values. At least one additional E indicator from Table 2 and one additional S indicator from Table 3. Comparison with previous period. Explanation of methodologies.' },
    { section:'Section III', title:'Actions Taken & Planned', content:'Description of actions taken to address PAI in the reference period. Description of engagement policies. Actions planned or targets set for the next reference period.' },
    { section:'Section IV', title:'Adherence to International Standards', content:'Description of adherence to OECD Guidelines for Multinational Enterprises, UN Guiding Principles on Business and Human Rights, and Labour Organisation conventions.' },
  ];

  const CALC_METHODS = [
    { id:1, name:'GHG Emissions', formula:'Sum of (Scope1_i + Scope2_i + Scope3_i) for all investees, attribution = (Value_invested_i / Enterprise_Value_i)', source:'PCAF / GHG Protocol' },
    { id:2, name:'Carbon Footprint', formula:'Total_attributed_emissions / Current_value_of_all_investments (EUR M)', source:'PCAF Standard' },
    { id:3, name:'WACI', formula:'Sum of (Weight_i * (Scope1_i + Scope2_i) / Revenue_i)', source:'TCFD / PCAF' },
    { id:4, name:'Fossil Fuel Exposure', formula:'Sum(MV_i where NACE in fossil codes) / Total_AUM', source:'EU Taxonomy' },
    { id:5, name:'Non-Renewable Energy Share', formula:'Sum(Weight_i * NonRenewable_Energy_i / Total_Energy_i)', source:'Company reporting' },
    { id:6, name:'Energy Intensity', formula:'Sum(Weight_i * Energy_Consumption_i / Revenue_i) per high impact sector', source:'NACE high-impact' },
    { id:7, name:'Biodiversity Impact', formula:'Sum(Weight_i * Boolean(activity in biodiversity-sensitive area_i))', source:'IBAT / Natura 2000' },
    { id:8, name:'Water Emissions', formula:'Sum(Weight_i * Emissions_to_water_i)', source:'E-PRTR' },
    { id:9, name:'Hazardous Waste', formula:'Sum(Weight_i * (Hazardous_waste_i + Radioactive_waste_i))', source:'EU Waste Directive' },
    { id:10, name:'UNGC/OECD Violations', formula:'Sum(MV_i where violation=True) / Total_AUM', source:'UNGC / OECD' },
    { id:11, name:'Compliance Gaps', formula:'Sum(MV_i where no_compliance_mechanism=True) / Total_AUM', source:'UNGC reporting' },
    { id:12, name:'Gender Pay Gap', formula:'Sum(Weight_i * GenderPayGap_i)', source:'Company disclosures' },
    { id:13, name:'Board Diversity', formula:'Sum(Weight_i * Female_board_members_i / Total_board_members_i)', source:'Company filings' },
    { id:14, name:'Controversial Weapons', formula:'Sum(MV_i where involvement_controversial_weapons=True) / Total_AUM', source:'Ottawa Treaty / CCM' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {subs.map(s => (
          <button key={s.key} onClick={()=>setSub(s.key)} style={{
            padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight: sub===s.key ? 700 : 500,
            background: sub===s.key ? T.navy : '#fff', color: sub===s.key ? '#fff' : T.text,
            border:`1px solid ${sub===s.key ? T.navy : T.border}`, cursor:'pointer', fontFamily:T.font,
          }}>{s.label}</button>
        ))}
      </div>

      {/* ── Mandatory PAI ──────────────────────────────── */}
      {sub === 'mandatory' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>14 Mandatory PAI Indicators (SFDR RTS Table 1)</div>
          <Table columns={[
            { key:'id', label:'#', align:'center', nowrap:true },
            { key:'name', label:'Indicator Name' },
            { key:'metric', label:'Metric' },
            { key:'unit', label:'Unit', nowrap:true },
            { key:'rts', label:'RTS Ref', nowrap:true },
            { key:'pillar', label:'E/S/G', align:'center', render:(v)=><Badge color={v==='E'?T.green:v==='S'?T.indigo:T.amber}>{v}</Badge> },
            { key:'pcaf', label:'PCAF Cross-Ref' },
          ]} data={ALL_INDICATORS} />
        </Card>
      )}

      {/* ── Additional Indicators ──────────────────────── */}
      {sub === 'additional' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:4 }}>Additional PAI Indicators</div>
          <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>At least one from Table 2 (Climate) and one from Table 3 (Social) must be disclosed alongside the 14 mandatory indicators.</div>
          <Table columns={[
            { key:'id', label:'ID', nowrap:true },
            { key:'name', label:'Indicator' },
            { key:'cat', label:'Category', render:(v)=><Badge color={v==='Climate'?T.green:T.indigo}>{v}</Badge> },
            { key:'unit', label:'Unit', nowrap:true },
            { key:'rts', label:'RTS Ref', nowrap:true },
          ]} data={ADDITIONAL_INDICATORS} />
        </Card>
      )}

      {/* ── Art 6/8/9 Classification ───────────────────── */}
      {sub === 'classification' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>SFDR Article 6 / 8 / 9 Classification</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {ART_CLASSIFICATIONS.map(a => (
              <div key={a.article} style={{ background:'#fafaf8', borderRadius:8, padding:16, border:`1px solid ${T.border}`, borderLeft:`4px solid ${a.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:16, fontWeight:700, color:a.color }}>{a.article}</span>
                  <Badge color={a.color}>{a.scope}</Badge>
                </div>
                <div style={{ fontSize:13, color:T.text, marginBottom:6 }}><strong>PAI Requirements:</strong> {a.paiReq}</div>
                <div style={{ fontSize:12, color:T.sub }}><strong>Examples:</strong> {a.examples}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── RTS Disclosure Format ──────────────────────── */}
      {sub === 'disclosure' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:4 }}>RTS Disclosure Format — PAI Statement Template</div>
          <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>Mandatory structure per Commission Delegated Regulation (EU) 2022/1288, Annex I.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {DISCLOSURE_SECTIONS.map((s, i) => (
              <div key={s.section} style={{ background:'#fafaf8', borderRadius:8, padding:16, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:'50%', background:T.navy, color:'#fff', fontSize:13, fontWeight:700 }}>{i+1}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:T.navy }}>{s.section}: {s.title}</span>
                </div>
                <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{s.content}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Calculation Methods ────────────────────────── */}
      {sub === 'methods' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>PAI Calculation Methodologies</div>
          <Table columns={[
            { key:'id', label:'#', align:'center' },
            { key:'name', label:'Indicator' },
            { key:'formula', label:'Formula / Method' },
            { key:'source', label:'Reference Source', nowrap:true },
          ]} data={CALC_METHODS} />
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
const TABS = [
  { key:'calculator', label:'PAI Calculator' },
  { key:'dnsh', label:'DNSH Assessment' },
  { key:'statement', label:'PAI Statement' },
  { key:'comparison', label:'Period Comparison' },
  { key:'reference', label:'Reference' },
];

export default function SfdrPaiPage() {
  const [tab, setTab] = useState('calculator');

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.text }}>
      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ background:T.navy, padding:'28px 32px 20px' }}>
        <div style={{ maxWidth:1320, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:'uppercase' }}>E151</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>|</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>SFDR Principal Adverse Impact</span>
          </div>
          <h1 style={{ color:'#fff', fontSize:26, fontWeight:700, margin:0 }}>SFDR PAI Module</h1>
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, margin:'6px 0 0', maxWidth:720 }}>
            Calculate, assess, and disclose the 14 mandatory Principal Adverse Impact indicators per EU Regulation 2019/2088 (SFDR) and Delegated Regulation 2022/1288 (RTS).
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div style={{ maxWidth:1320, margin:'0 auto', padding:'24px 32px 48px' }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'calculator' && <TabCalculator />}
        {tab === 'dnsh' && <TabDnsh />}
        {tab === 'statement' && <TabStatement />}
        {tab === 'comparison' && <TabComparison />}
        {tab === 'reference' && <TabReference />}
      </div>
    </div>
  );
}
