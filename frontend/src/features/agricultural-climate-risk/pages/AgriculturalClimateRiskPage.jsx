import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const T = {
  bg:'#f8f6f0', surface:'#ffffff', surfaceH:'#f1ede4', border:'#e2ded5', borderL:'#ede9e0',
  navy:'#1e3a5f', gold:'#b8860b', sage:'#4d7c5f', teal:'#0f766e',
  text:'#1a1a2e', textSec:'#6b7280', textMut:'#9ca3af',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  font:'DM Sans, sans-serif', mono:'JetBrains Mono, monospace',
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt0 = v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });

const CROPS = ['Wheat','Maize','Rice','Soy','Cotton','Coffee','Cocoa','Barley','Sugar Cane','Palm Oil'];
const REGIONS = ['South Asia','Sub-Saharan Africa','Latin America','East Asia','Europe','North America','MENA','Oceania'];
const HAZARDS = ['Extreme Heat','Drought','Flooding','Soil Erosion','Frost Risk','Salinity'];
const SCENARIOS = ['RCP 2.6','RCP 4.5','RCP 6.0','RCP 8.5'];

const NAMES = [
  'Punjab India','Mato Grosso Brazil','Iowa USA','Henan China','Pampas Argentina',
  'Cerrado Brazil','Niger Delta Nigeria','Nile Delta Egypt','Mekong Vietnam','Ganges Plain Bangladesh',
  'Sahel Mali','Ethiopian Highlands','Andean Peru','Central Valley USA','Rhine Valley Germany',
  'Murray-Darling Australia','Great Plains Kansas','Danube Romania','Congo Basin DRC','Yangtze Delta China',
  'Karnataka India','Chiapas Mexico','Ivory Coast','Ghana Cocoa Belt','Sulawesi Indonesia',
  'Sumatra Indonesia','Mindanao Philippines','Queensland Australia','Kruger Lowveld SA','Limpopo SA',
  'Tamil Nadu India','Andhra Pradesh India','Rajasthan India','Uttar Pradesh India','Bihar India',
  'Kano Nigeria','Rift Valley Kenya','Northern Tanzania','Mpumalanga SA','Western Cape SA',
  'Harare Zimbabwe','Zambia Copperbelt','Malawi Shire','Mozambique Zambezi','Ukraine Kharkiv',
  'Russia Krasnodar','Kazakhstan Steppe','Poland Masovia',
];

const PORTFOLIO = Array.from({ length: 48 }, (_, i) => ({
  id: `AG${String(i+1).padStart(3,'0')}`,
  name: NAMES[i] || `Region ${i+1}`,
  crop: CROPS[i % CROPS.length],
  region: REGIONS[i % REGIONS.length],
  baselineYield: +(2.5 + sr(i*11)*8).toFixed(2),
  yieldChange26: +(-5 - sr(i*7)*12).toFixed(1),
  yieldChange45: +(-8 - sr(i*9)*18).toFixed(1),
  yieldChange85: +(-14 - sr(i*13)*22).toFixed(1),
  heatStressDays: Math.round(12 + sr(i*5)*72),
  precipChange: +(-22 + sr(i*17)*52).toFixed(1),
  droughtFreq: +(1 + sr(i*3)*7).toFixed(1),
  physRisk: Math.round(20 + sr(i*19)*72),
  transitionRisk: Math.round(15 + sr(i*23)*58),
  loanExposure: Math.round(5 + sr(i*29)*90),
  ltv: Math.round(40 + sr(i*31)*38),
}));

const CROP_SCI = {
  Wheat:        { heatThresh:35, co2Uplift:8,  waterNeed:450,  optTemp:22 },
  Maize:        { heatThresh:38, co2Uplift:4,  waterNeed:550,  optTemp:28 },
  Rice:         { heatThresh:36, co2Uplift:5,  waterNeed:1200, optTemp:30 },
  Soy:          { heatThresh:39, co2Uplift:10, waterNeed:500,  optTemp:27 },
  Cotton:       { heatThresh:42, co2Uplift:3,  waterNeed:700,  optTemp:32 },
  Coffee:       { heatThresh:30, co2Uplift:1,  waterNeed:1600, optTemp:20 },
  Cocoa:        { heatThresh:32, co2Uplift:2,  waterNeed:1800, optTemp:25 },
  Barley:       { heatThresh:33, co2Uplift:7,  waterNeed:380,  optTemp:19 },
  'Sugar Cane': { heatThresh:42, co2Uplift:5,  waterNeed:1500, optTemp:30 },
  'Palm Oil':   { heatThresh:40, co2Uplift:3,  waterNeed:1800, optTemp:28 },
};

const ADAPT_MEASURES = [
  { measure:'Drought-Tolerant Varieties', capex:12, yieldRecovery:8,  roi:42 },
  { measure:'Precision Irrigation',       capex:28, yieldRecovery:12, roi:31 },
  { measure:'Crop Diversification',       capex:8,  yieldRecovery:6,  roi:55 },
  { measure:'Agroforestry Integration',   capex:35, yieldRecovery:10, roi:22 },
  { measure:'Soil Health Programme',      capex:18, yieldRecovery:9,  roi:38 },
  { measure:'Climate Insurance',          capex:6,  yieldRecovery:14, roi:68 },
  { measure:'Weather Derivatives',        capex:5,  yieldRecovery:11, roi:72 },
  { measure:'Carbon Soil Credits',        capex:10, yieldRecovery:7,  roi:45 },
];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background:T.surfaceH, border:`1px solid ${T.borderL}`, borderRadius:6, padding:'12px 16px', minWidth:140, flex:'1 1 140px' }}>
    <div style={{ fontSize:10, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, fontFamily:T.mono }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:3 }}>{sub}</div>}
  </div>
);

const Card = ({ title, children, style={} }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', ...style }}>
    {title && <div style={{ fontSize:11, fontFamily:T.mono, fontWeight:700, color:T.navy, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14, borderBottom:`1px solid ${T.borderL}`, paddingBottom:8 }}>{title}</div>}
    {children}
  </div>
);

const TABS = ['Overview','Yield Risk','Crop Science','Hazard Matrix','Portfolio Stress','TCFD Scenarios','Adaptation Finance'];
const SCEN_COLORS = { 'RCP 2.6':T.green, 'RCP 4.5':T.amber, 'RCP 6.0':'#f97316', 'RCP 8.5':T.red };

export default function AgriculturalClimateRiskPage() {
  const [tab, setTab] = useState('Overview');
  const [selCrop, setSelCrop] = useState('All');
  const [selRegion, setSelRegion] = useState('All');
  const [selScen, setSelScen] = useState('RCP 4.5');

  const filtered = useMemo(() => PORTFOLIO.filter(a =>
    (selCrop === 'All' || a.crop === selCrop) &&
    (selRegion === 'All' || a.region === selRegion)
  ), [selCrop, selRegion]);

  const scenKey = selScen === 'RCP 2.6' ? 'yieldChange26' : selScen === 'RCP 8.5' ? 'yieldChange85' : 'yieldChange45';

  const totals = useMemo(() => {
    const n = filtered.length || 1;
    return {
      n: filtered.length,
      avgYield: +(filtered.reduce((s,a) => s+a[scenKey], 0) / n).toFixed(1),
      avgHeat: Math.round(filtered.reduce((s,a) => s+a.heatStressDays, 0) / n),
      avgRisk: Math.round(filtered.reduce((s,a) => s+a.physRisk, 0) / n),
      totalExposure: filtered.reduce((s,a) => s+a.loanExposure, 0),
      highRisk: filtered.filter(a => a.physRisk > 65).length,
    };
  }, [filtered, scenKey]);

  const yieldByScenario = useMemo(() => CROPS.map(crop => {
    const items = PORTFOLIO.filter(a => a.crop === crop);
    const n = items.length || 1;
    return {
      crop: crop.length > 9 ? crop.slice(0,9) : crop,
      'RCP 2.6': +(items.reduce((s,a) => s+a.yieldChange26, 0) / n).toFixed(1),
      'RCP 4.5': +(items.reduce((s,a) => s+a.yieldChange45, 0) / n).toFixed(1),
      'RCP 8.5': +(items.reduce((s,a) => s+a.yieldChange85, 0) / n).toFixed(1),
    };
  }), []);

  const yieldTrajectory = useMemo(() => [2025,2030,2040,2050,2060,2080].map((yr, i) => ({
    year: yr,
    'RCP 2.6': +(-3 - i*1.3 + sr(i*3)*0.8).toFixed(1),
    'RCP 4.5': +(-4 - i*2.3 + sr(i*5)*1.2).toFixed(1),
    'RCP 6.0': +(-5 - i*3.2 + sr(i*7)*1.2).toFixed(1),
    'RCP 8.5': +(-6 - i*4.8 + sr(i*11)*1.5).toFixed(1),
  })), []);

  const hazardMatrix = useMemo(() => REGIONS.map((reg, ri) => {
    const row = { region: reg };
    HAZARDS.forEach((h, hi) => { row[h] = Math.round(15 + sr(ri*7+hi*13)*78); });
    return row;
  }), []);

  const stressData = useMemo(() => SCENARIOS.map((sc, si) => ({
    scenario: sc,
    expectedLoss: +(2 + si*3.2 + sr(si*7)*1.5).toFixed(1),
    stressLoss: +(5 + si*6.8 + sr(si*11)*2.5).toFixed(1),
    nplRate: +(1.5 + si*1.6 + sr(si*13)*0.8).toFixed(1),
  })), []);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontSize:11, color:T.gold, fontFamily:T.mono, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DG1 · FOOD, AGRICULTURE & LAND USE</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>Agricultural Climate Risk Analytics</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>Crop yield projections · Physical hazard mapping · Portfolio stress testing · IPCC AR6 · FAO GAEZ v4 · CGIAR CCAFS</div>
      </div>

      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
        {[['CROP', CROPS, selCrop, setSelCrop], ['REGION', REGIONS, selRegion, setSelRegion], ['SCENARIO', SCENARIOS, selScen, setSelScen]].map(([lbl, opts, val, set]) => (
          <div key={lbl}>
            <span style={{ fontSize:11, color:T.textSec, fontFamily:T.mono, marginRight:8 }}>{lbl}</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontFamily:T.font, fontSize:12, padding:'4px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
              {lbl !== 'SCENARIO' && <option value="All">All</option>}
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontFamily:T.mono, fontSize:11, color:T.textMut }}>{totals.n} regions · {selScen}</div>
      </div>

      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'0 32px', display:'flex', gap:4 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'12px 16px', background:'transparent', border:'none', borderBottom:`2px solid ${tab===t?T.navy:'transparent'}`, color:tab===t?T.navy:T.textSec, fontFamily:T.font, fontSize:12, fontWeight:tab===t?700:400, cursor:'pointer' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:'24px 32px', display:'flex', flexDirection:'column', gap:24 }}>

        {tab==='Overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <Kpi label="Regions" value={totals.n} sub="Filtered universe" />
              <Kpi label={`Avg Yield Δ (${selScen})`} value={`${totals.avgYield}%`} sub="Vs 1990–2020 baseline" color={T.red} />
              <Kpi label="Avg Heat Stress Days" value={totals.avgHeat} sub="Days above crop threshold/yr" color={T.amber} />
              <Kpi label="High Physical Risk" value={totals.highRisk} sub="Score >65/100" color={T.red} />
              <Kpi label="Total Exposure" value={`$${fmt0(totals.totalExposure)}M`} sub="Agriculture portfolio" color={T.navy} />
            </div>

            <Card title="Yield Change by Crop & Scenario (%, vs 1990–2020 baseline)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yieldByScenario} margin={{ top:5, right:20, left:0, bottom:20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="crop" tick={{ fontSize:10, fontFamily:T.mono, angle:-25, textAnchor:'end' }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`]} />
                  <Legend />
                  <ReferenceLine y={0} stroke={T.border} />
                  <Bar dataKey="RCP 2.6" fill={T.green} radius={[3,3,0,0]} />
                  <Bar dataKey="RCP 4.5" fill={T.amber} radius={[3,3,0,0]} />
                  <Bar dataKey="RCP 8.5" fill={T.red} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Top Physical-Risk Agricultural Regions">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Region','Crop','Physical Risk','Yield Δ','Heat Days/yr','Precip Δ%','Exposure $M'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b) => b.physRisk-a.physRisk).slice(0,12).map((a,i) => (
                    <tr key={a.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'7px 12px', fontWeight:600 }}>{a.name}</td>
                      <td style={{ padding:'7px 12px' }}>{a.crop}</td>
                      <td style={{ padding:'7px 12px', fontFamily:T.mono, fontWeight:700, color:a.physRisk>65?T.red:a.physRisk>40?T.amber:T.green }}>{a.physRisk}</td>
                      <td style={{ padding:'7px 12px', fontFamily:T.mono, color:T.red }}>{a[scenKey]}%</td>
                      <td style={{ padding:'7px 12px', fontFamily:T.mono, color:a.heatStressDays>50?T.amber:T.text }}>{a.heatStressDays}</td>
                      <td style={{ padding:'7px 12px', fontFamily:T.mono, color:a.precipChange<-10?T.red:T.text }}>{a.precipChange>0?'+':''}{a.precipChange}%</td>
                      <td style={{ padding:'7px 12px', fontFamily:T.mono }}>${a.loanExposure}M</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Yield Risk' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {SCENARIOS.map(sc => {
                const key = sc==='RCP 2.6'?'yieldChange26':sc==='RCP 8.5'?'yieldChange85':'yieldChange45';
                const avg = +(PORTFOLIO.reduce((s,a) => s+a[key], 0)/PORTFOLIO.length).toFixed(1);
                return <Kpi key={sc} label={sc} value={`${avg}%`} sub="Global avg yield Δ" color={SCEN_COLORS[sc]} />;
              })}
            </div>

            <Card title="Yield Trajectory by Scenario — Global Average (%, 2025–2080)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={yieldTrajectory} margin={{ top:5, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                  <Tooltip formatter={(v,name) => [`${v}%`, name]} />
                  <Legend />
                  <ReferenceLine y={0} stroke={T.border} strokeDasharray="4 2" />
                  {SCENARIOS.map(sc => <Line key={sc} dataKey={sc} stroke={SCEN_COLORS[sc]} strokeWidth={2} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <Card title="Risk Score vs Yield Change (RCP 4.5) Scatter">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top:5, right:10, left:0, bottom:15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="physRisk" name="Physical Risk" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'Physical Risk Score', position:'insideBottom', offset:-10, fontSize:9, fill:T.textSec }} />
                    <YAxis dataKey="yieldChange45" name="Yield Δ%" tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => payload?.[0] ? (
                      <div style={{ background:T.surface, border:`1px solid ${T.border}`, padding:'6px 10px', fontSize:11 }}>
                        <div style={{ fontWeight:600 }}>{payload[0].payload.name}</div>
                        <div>Risk: {payload[0].payload.physRisk} · Δ: {payload[0].payload.yieldChange45}%</div>
                      </div>
                    ) : null} />
                    <Scatter data={filtered} fill={T.navy} opacity={0.65} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Yield Change Distribution — RCP 4.5">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[-40,-30,-20,-10,0].map((lo,i) => {
                    const hi = [-30,-20,-10,0,10][i];
                    return { range:`${lo} to ${hi}%`, count: PORTFOLIO.filter(a => a.yieldChange45 >= lo && a.yieldChange45 < hi).length };
                  })} margin={{ top:5, right:10, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="range" tick={{ fontSize:9, fontFamily:T.mono, angle:-20, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Regions" fill={T.amber} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {tab==='Crop Science' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="Crop Biophysical Parameters & Climate Sensitivity (IPCC AR6 / CGIAR CCAFS)">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Crop','Heat Thresh °C','Optimal Temp °C','CO₂ Uplift','Water Need mm/yr','Vulnerability'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{Object.entries(CROP_SCI).map(([crop, p], i) => {
                    const vuln = p.heatThresh < 33 ? 'VERY HIGH' : p.heatThresh < 37 ? 'HIGH' : 'MODERATE';
                    const vc = { 'VERY HIGH':T.red, 'HIGH':T.amber, 'MODERATE':T.green }[vuln];
                    return (
                      <tr key={crop} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                        <td style={{ padding:'7px 12px', fontWeight:600 }}>{crop}</td>
                        <td style={{ padding:'7px 12px', fontFamily:T.mono, color:T.red }}>{p.heatThresh}°C</td>
                        <td style={{ padding:'7px 12px', fontFamily:T.mono }}>{p.optTemp}°C</td>
                        <td style={{ padding:'7px 12px', fontFamily:T.mono, color:T.green }}>+{p.co2Uplift}%</td>
                        <td style={{ padding:'7px 12px', fontFamily:T.mono }}>{p.waterNeed} mm</td>
                        <td style={{ padding:'7px 12px' }}><span style={{ padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:600, background:`${vc}20`, color:vc }}>{vuln}</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </Card>

            <Card title="Heat Stress Threshold by Crop (°C)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(CROP_SCI).map(([crop, p]) => ({ crop: crop.length > 9 ? crop.slice(0,9) : crop, threshold: p.heatThresh, optimal: p.optTemp }))} margin={{ top:5, right:20, left:0, bottom:20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="crop" tick={{ fontSize:10, fontFamily:T.mono, angle:-25, textAnchor:'end' }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="°C" domain={[10,50]} />
                  <Tooltip formatter={v => [`${v}°C`]} />
                  <Legend />
                  <Bar dataKey="optimal" name="Optimal Temp °C" fill={T.sage} radius={[3,3,0,0]} />
                  <Bar dataKey="threshold" name="Heat Stress Thresh °C" fill={T.red} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Hazard Matrix' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="Multi-Hazard Risk Matrix — By Agricultural Region (score 0–100)">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    <th style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}`, minWidth:140 }}>Region</th>
                    {HAZARDS.map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{hazardMatrix.map((row, i) => (
                    <tr key={row.region} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'7px 12px', fontWeight:600 }}>{row.region}</td>
                      {HAZARDS.map(h => {
                        const v = row[h]; const c = v>65?T.red:v>40?T.amber:T.green;
                        return (
                          <td key={h} style={{ padding:'7px 12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:36, height:6, background:T.borderL, borderRadius:3 }}>
                                <div style={{ width:`${v}%`, height:6, background:c, borderRadius:3 }} />
                              </div>
                              <span style={{ fontFamily:T.mono, fontSize:10, color:c, fontWeight:600 }}>{v}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Portfolio Stress' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {stressData.map(sc => <Kpi key={sc.scenario} label={sc.scenario} value={`${sc.stressLoss}%`} sub="Stress loss rate" color={SCEN_COLORS[sc.scenario]||T.navy} />)}
            </div>

            <Card title="Portfolio Loss Rates by Climate Scenario">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stressData} margin={{ top:5, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="scenario" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`]} />
                  <Legend />
                  <Bar dataKey="expectedLoss" name="Expected Loss %" fill={T.navy} radius={[4,4,0,0]} />
                  <Bar dataKey="stressLoss" name="Stress Loss %" fill={T.red} radius={[4,4,0,0]} />
                  <Bar dataKey="nplRate" name="NPL Rate %" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Agricultural Loan Portfolio — Climate Risk Detail">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Region','Crop','Exposure $M','LTV %','Physical Risk','Yield Δ','Trans Risk','Band'].map(h => (
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b) => b.loanExposure-a.loanExposure).slice(0,14).map((a,i) => {
                    const comp = Math.round(a.physRisk*0.6 + a.transitionRisk*0.4);
                    const band = comp>65?'HIGH':comp>40?'MED':'LOW';
                    const bc = { HIGH:T.red, MED:T.amber, LOW:T.green }[band];
                    return (
                      <tr key={a.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                        <td style={{ padding:'6px 10px', fontWeight:600, fontSize:11 }}>{a.name}</td>
                        <td style={{ padding:'6px 10px' }}>{a.crop}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${a.loanExposure}M</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{a.ltv}%</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:700, color:a.physRisk>65?T.red:a.physRisk>40?T.amber:T.green }}>{a.physRisk}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.red }}>{a[scenKey]}%</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:a.transitionRisk>50?T.amber:T.text }}>{a.transitionRisk}</td>
                        <td style={{ padding:'6px 10px' }}><span style={{ padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:600, background:`${bc}20`, color:bc }}>{band}</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='TCFD Scenarios' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="TCFD Physical Risk Scenario Analysis — Agricultural Sector">
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { label:'Orderly Transition (NZ2050 + RCP 2.6)', physLoss:'4–8%', transCost:'Low', adaptCapex:'$12Bn/yr', foodShock:'+5–12%', color:T.green },
                  { label:'Disorderly Transition (Divergent + RCP 4.5)', physLoss:'8–16%', transCost:'High', adaptCapex:'$28Bn/yr', foodShock:'+15–25%', color:T.amber },
                  { label:'Hothouse World (No Action + RCP 8.5)', physLoss:'20–35%', transCost:'Very Low', adaptCapex:'$65Bn/yr', foodShock:'+35–60%', color:T.red },
                ].map((sc, i) => (
                  <div key={i} style={{ padding:'16px 20px', border:`1px solid ${sc.color}40`, borderLeft:`4px solid ${sc.color}`, borderRadius:6, background:T.surfaceH }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>{sc.label}</div>
                    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                      {[['Physical Loss',sc.physLoss],['Transition Cost',sc.transCost],['Adaptation Capex',sc.adaptCapex],['Food Price Shock',sc.foodShock]].map(([k,v]) => (
                        <div key={k} style={{ minWidth:130 }}>
                          <div style={{ fontSize:10, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', marginBottom:2 }}>{k}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:sc.color, fontFamily:T.mono }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Crop Production Volume — Scenario Trajectories (2025=100)">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2025,2030,2040,2050,2070].map((yr,i) => ({
                  year: yr,
                  'RCP 2.6': +(100-i*1.6+sr(i*3)*0.8).toFixed(1),
                  'RCP 4.5': +(100-i*2.8+sr(i*5)*1.0).toFixed(1),
                  'RCP 8.5': +(100-i*5.6+sr(i*7)*1.5).toFixed(1),
                }))} margin={{ top:5, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} domain={[55,105]} />
                  <Tooltip formatter={(v,name) => [`${v} (2025=100)`, name]} />
                  <Legend />
                  <Area dataKey="RCP 2.6" stroke={T.green} fill={`${T.green}20`} strokeWidth={2} />
                  <Area dataKey="RCP 4.5" stroke={T.amber} fill={`${T.amber}15`} strokeWidth={2} />
                  <Area dataKey="RCP 8.5" stroke={T.red} fill={`${T.red}10`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Adaptation Finance' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <Kpi label="Adaptation Finance Gap" value="$300Bn/yr" sub="UNEP 2023 estimate (agri)" color={T.red} />
              <Kpi label="Best ROI Measure" value="Weather Derivatives" sub="72% estimated ROI" color={T.green} />
              <Kpi label="GCF Agriculture" value="$4.2Bn" sub="Cumulative approvals" color={T.navy} />
            </div>

            <Card title="Adaptation Measures — Yield Recovery vs ROI">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ADAPT_MEASURES} layout="vertical" margin={{ top:5, right:80, left:195, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                  <YAxis type="category" dataKey="measure" tick={{ fontSize:10, fontFamily:T.mono }} width={190} />
                  <Tooltip formatter={(v,n) => [`${v}%`, n]} />
                  <Legend />
                  <Bar dataKey="yieldRecovery" name="Yield Recovery %" fill={T.sage} radius={[0,3,3,0]} />
                  <Bar dataKey="roi" name="Estimated ROI %" fill={T.teal} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Climate Adaptation Finance Instruments — Agriculture">
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { inst:'CGIAR Climate Adaptation Bonds', size:'$800M', rate:'LIBOR+85bps', use:'Drought-tolerant varieties, irrigation' },
                  { inst:'World Bank CRSA Facility', size:'$1.5Bn', rate:'Concessional 1.25%', use:'Climate-smart agriculture programmes' },
                  { inst:'ADB Agriculture Impact Fund', size:'$600M', rate:'Blended 2.5%', use:'Smallholder adaptation, rural resilience' },
                  { inst:'GCF Smallholder Resilience', size:'$450M', rate:'Grant/Loan Mix', use:'Subsistence farmer adaptation (Africa/Asia)' },
                  { inst:'IFC Agri Green Bond', size:'$300M', rate:'4.2% fixed', use:'Sustainable agriculture supply chains' },
                ].map((r,i) => (
                  <div key={i} style={{ display:'flex', gap:14, padding:'9px 14px', background:T.surfaceH, borderRadius:6, border:`1px solid ${T.borderL}`, flexWrap:'wrap' }}>
                    <div style={{ fontWeight:700, flex:'2 1 180px', fontSize:12 }}>{r.inst}</div>
                    <div style={{ fontFamily:T.mono, color:T.teal, fontWeight:700, minWidth:70 }}>{r.size}</div>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, minWidth:130 }}>{r.rate}</div>
                    <div style={{ fontSize:11, flex:'3 1 200px' }}>{r.use}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DG1 · Agricultural Climate Risk · IPCC AR6 · FAO GAEZ v4 · CGIAR CCAFS · GCF</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} regions · {selScen}</span>
      </div>
    </div>
  );
}
