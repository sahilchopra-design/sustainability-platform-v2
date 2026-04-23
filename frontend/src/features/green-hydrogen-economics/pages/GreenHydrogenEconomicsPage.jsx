import React, { useState, useMemo } from 'react';
import CleanTechAdvancedAnalytics from '../../_shared/CleanTechAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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
const fmt1 = v => Number(v).toFixed(1);
const fmt2 = v => Number(v).toFixed(2);
const fmt0 = v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });

// Electrolysis technologies
const TECHNOLOGIES = [
  { id:'PEM',    name:'PEM Electrolysis',            capex:1200, opex:35, eff:0.70, maturity:'Commercial', color:'#3b82f6' },
  { id:'ALK',    name:'Alkaline Electrolysis',       capex:900,  opex:25, eff:0.66, maturity:'Mature',     color:T.navy },
  { id:'SOEC',   name:'Solid Oxide (SOEC)',          capex:2200, opex:55, eff:0.82, maturity:'Pilot',      color:T.gold },
  { id:'AEM',    name:'AEM Electrolysis',            capex:1500, opex:40, eff:0.68, maturity:'Demo',       color:T.sage },
  { id:'BLUE',   name:'Blue H₂ (SMR + CCS)',         capex:400,  opex:12, eff:0.75, maturity:'Mature',     color:T.teal },
  { id:'GREY',   name:'Grey H₂ (SMR)',               capex:300,  opex:8,  eff:0.76, maturity:'Mature',     color:T.textMut },
];

// Demand sectors
const DEMAND_SECTORS = [
  { sector:'Steel',        demandMt:54,  willingness:4.5, color:'#6b7280' },
  { sector:'Ammonia',      demandMt:31,  willingness:3.8, color:T.gold },
  { sector:'Refining',     demandMt:38,  willingness:3.2, color:T.amber },
  { sector:'HGV Transport',demandMt:12,  willingness:6.5, color:'#3b82f6' },
  { sector:'Shipping',     demandMt:28,  willingness:5.5, color:T.teal },
  { sector:'Aviation (SAF)',demandMt:8,   willingness:8.0, color:T.sage },
  { sector:'Power Grid',   demandMt:15,  willingness:4.0, color:T.navyL },
  { sector:'Buildings',    demandMt:6,   willingness:3.5, color:T.sageL },
];

// 40 regional H₂ projects
const PROJECTS = Array.from({ length: 40 }, (_, i) => {
  const tech  = TECHNOLOGIES[Math.floor(sr(i*7)*4)]; // green only (0-3)
  const region = ['Europe','North America','Asia-Pacific','Middle East','Australia','LatAm'][Math.floor(sr(i*11)*6)];
  const capacity = Math.round(50 + sr(i*13)*950); // MW electrolyser
  const elecCost = Math.round(20 + sr(i*17)*80);  // $/MWh
  const capFactor = 0.30 + sr(i*19)*0.50;          // CF

  // LCOH: (CAPEX×FCR)/(8760×CF) / efficiency + elecCost/1000/efficiency + OPEX/8760/CF/efficiency
  // Simplified: capex annualised + opex + electricity
  const fcr = 0.08; // fixed charge rate
  const annCapex = tech.capex * capFactor * 8760 / 1000; // $k/kg roughly — simplified per-kW
  // LCOH $/kg: (capex*fcr)/(8760*cf*eff) + elecCost/(1000*eff) * 33.3 + opex/(8760*cf*eff) * (1000/3.6)
  // 1 kg H2 ≈ 33.3 kWh LHV
  const lcoh = (tech.capex * fcr) / (8760 * capFactor * tech.eff) * 3.6
    + (elecCost * 33.3) / (1000 * tech.eff)
    + (tech.opex * 1000) / (8760 * capFactor * tech.eff);
  const lcohAdj = Math.max(1.5, Math.round(lcoh * 10 + sr(i*23)*15) / 10);

  const h2Output = capacity * 8760 * capFactor * tech.eff / 33.3 / 1000; // t/yr
  const capex = capacity * tech.capex / 1000; // $M
  const co2Avoided = h2Output * 9.3; // tCO₂/t H₂ vs grey

  return { id:i+1, name:`H₂-${String(i+1).padStart(3,'0')}`, tech:tech.id, techName:tech.name,
    region, capacity, elecCost, capFactor:Math.round(capFactor*100), lcoh:lcohAdj,
    h2Output:Math.round(h2Output), capex:Math.round(capex), co2Avoided:Math.round(co2Avoided),
    color:tech.color };
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

const TABS = ['Overview','LCOH Calculator','Demand Sectors','Project Portfolio','Supply Chain','Policy & Incentives','Market Outlook','Advanced Analytics'];

export default function GreenHydrogenEconomicsPage() {
  const [tab, setTab]       = useState('Overview');
  const [filterTech, setFilterTech]     = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  // LCOH calculator inputs
  const [calcCapex, setCalcCapex]     = useState(1200);  // $/kW
  const [calcOpex, setCalcOpex]       = useState(35);    // $/kW/yr
  const [calcElec, setCalcElec]       = useState(50);    // $/MWh
  const [calcCf, setCalcCf]           = useState(50);    // % CF
  const [calcEff, setCalcEff]         = useState(70);    // % efficiency
  const [policySupport, setPolicySupport] = useState(1.0); // $/kg subsidy

  const REGIONS = ['Europe','North America','Asia-Pacific','Middle East','Australia','LatAm'];

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (filterTech   === 'All' || p.tech   === filterTech) &&
    (filterRegion === 'All' || p.region === filterRegion)
  ), [filterTech, filterRegion]);

  // Live LCOH calc
  const calcLcoh = useMemo(() => {
    const fcr = 0.08;
    const cf  = calcCf / 100;
    const eff = calcEff / 100;
    const lcoh = (calcCapex * fcr) / (8760 * cf * eff) * 3.6
      + (calcElec * 33.3) / (1000 * eff)
      + (calcOpex * 1000) / (8760 * cf * eff);
    return Math.max(0, lcoh - policySupport);
  }, [calcCapex, calcOpex, calcElec, calcCf, calcEff, policySupport]);

  // LCOH breakdown
  const lcohBreakdown = useMemo(() => {
    const fcr = 0.08; const cf = calcCf/100; const eff = calcEff/100;
    return [
      { item:'Capital (CAPEX)', value: +((calcCapex*fcr)/(8760*cf*eff)*3.6).toFixed(2) },
      { item:'Electricity',     value: +((calcElec*33.3)/(1000*eff)).toFixed(2) },
      { item:'Operations',      value: +((calcOpex*1000)/(8760*cf*eff)).toFixed(2) },
      { item:'Policy Support',  value: -policySupport },
    ];
  }, [calcCapex, calcOpex, calcElec, calcCf, calcEff, policySupport]);

  // Technology comparison
  const techComparison = useMemo(() => TECHNOLOGIES.map(t => {
    const cf = calcCf/100; const elec = calcElec;
    const lcoh = (t.capex*0.08)/(8760*cf*t.eff)*3.6 + (elec*33.3)/(1000*t.eff) + (t.opex*1000)/(8760*cf*t.eff);
    return { ...t, lcoh: +lcoh.toFixed(2) };
  }), [calcCf, calcElec]);

  // LCOH learning curve 2025-2050
  const learningCurve = useMemo(() => Array.from({length:6},(_,i)=>({
    year: (2025+i*5).toString(),
    pem:  +(5.0 - i*0.5 + (calcElec-50)*0.02).toFixed(2),
    alk:  +(4.2 - i*0.4 + (calcElec-50)*0.02).toFixed(2),
    blue: +(2.5 - i*0.2).toFixed(2),
    grey: +(1.5 + i*0.05).toFixed(2), // fossil prices rise
  })), [calcElec]);

  const totals = useMemo(() => {
    const n = filtered.length||1;
    return {
      n: filtered.length,
      avgLcoh:    filtered.reduce((s,p)=>s+p.lcoh,0)/n,
      totalH2:    filtered.reduce((s,p)=>s+p.h2Output,0),
      totalCapex: filtered.reduce((s,p)=>s+p.capex,0),
      totalCo2:   filtered.reduce((s,p)=>s+p.co2Avoided,0),
      avgCapFactor: filtered.reduce((s,p)=>s+p.capFactor,0)/n,
    };
  }, [filtered]);

  const labelStyle = { fontSize:11, color:T.textSec, marginBottom:4, display:'block' };
  const selectStyle = { padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text };
  const sliderStyle = { width:'100%', accentColor:T.navy };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DF2 · Green Hydrogen Economics</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#ffffff', marginBottom:4 }}>Green Hydrogen Economics</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>LCOH modelling · Demand sectors · Technology comparison · Supply chain · Policy incentives</div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', alignItems:'flex-end' }}>
          <div><span style={labelStyle}>Technology</span>
            <select style={selectStyle} value={filterTech} onChange={e=>setFilterTech(e.target.value)}>
              <option>All</option>{TECHNOLOGIES.slice(0,4).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
          <div><span style={labelStyle}>Region</span>
            <select style={selectStyle} value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}>
              <option>All</option>{REGIONS.map(r=><option key={r}>{r}</option>)}
            </select></div>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{totals.n} projects</div>
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
              <KpiCard label="Avg Green H₂ LCOH" value={`$${fmt2(totals.avgLcoh)}/kg`} sub="Portfolio average" color={T.amber} />
              <KpiCard label="Total H₂ Output" value={`${fmt0(totals.totalH2)} t/yr`} sub="Green hydrogen" color={T.navy} />
              <KpiCard label="Total CAPEX" value={`$${fmt0(totals.totalCapex)}M`} sub="Portfolio investment" />
              <KpiCard label="CO₂ Avoided" value={`${fmt0(totals.totalCo2)} tCO₂/yr`} sub="vs Grey H₂ baseline" color={T.green} />
              <KpiCard label="Green H₂ vs Grey" value={`+$${fmt2(totals.avgLcoh-1.5)}/kg`} sub="Cost premium today" color={T.red} />
              <KpiCard label="Avg Capacity Factor" value={`${fmt1(totals.avgCapFactor)}%`} sub="Electrolyser utilisation" />
            </div>

            <Card title="Technology LCOH Comparison ($/kg H₂) — Current Electricity $50/MWh, CF 50%">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Technology','Maturity','CAPEX $/kW','OPEX $/kW/yr','Efficiency %','LCOH $/kg','CO₂ Status'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{techComparison.map((t,i)=>(
                    <tr key={t.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:t.color, marginRight:8 }} />{t.name}</td>
                      <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:t.maturity==='Mature'?'#dcfce7':t.maturity==='Commercial'?'#eff6ff':t.maturity==='Pilot'?'#fef3c7':'#fce7f3', color:t.maturity==='Mature'?T.green:t.maturity==='Commercial'?T.navyL:t.maturity==='Pilot'?T.amber:'#9d174d' }}>{t.maturity}</span></td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${fmt0(t.capex)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${t.opex}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{(t.eff*100).toFixed(0)}%</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, fontWeight:700, color:t.lcoh<3?T.green:t.lcoh<6?T.amber:T.red }}>${fmt2(t.lcoh)}</td>
                      <td style={{ padding:'8px 12px' }}>{['PEM','ALK','SOEC','AEM'].includes(t.id)?'🟢 Zero-carbon':'🔴 Fossil-based'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>

            <Card title="LCOH Learning Curve 2025–2050 ($/kg) vs Grey H₂">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={learningCurve} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kg" />
                  <Tooltip formatter={v=>[`$${fmt2(v)}/kg`]} />
                  <Legend />
                  <Line dataKey="pem"  name="PEM Electrolysis" stroke='#3b82f6' strokeWidth={2} dot={false} />
                  <Line dataKey="alk"  name="Alkaline"         stroke={T.navy}  strokeWidth={2} dot={false} />
                  <Line dataKey="blue" name="Blue H₂"          stroke={T.teal}  strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  <Line dataKey="grey" name="Grey H₂"          stroke={T.textMut} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── LCOH Calculator ── */}
        {tab==='LCOH Calculator' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Inputs — Electrolyser Parameters">
                {[
                  { label:`CAPEX: $${calcCapex}/kW`, min:300, max:3000, step:50, val:calcCapex, set:setCalcCapex },
                  { label:`OPEX: $${calcOpex}/kW/yr`, min:5, max:100, step:5, val:calcOpex, set:setCalcOpex },
                  { label:`Electricity: $${calcElec}/MWh`, min:5, max:150, step:5, val:calcElec, set:setCalcElec },
                  { label:`Capacity Factor: ${calcCf}%`, min:10, max:90, step:5, val:calcCf, set:setCalcCf },
                  { label:`System Efficiency: ${calcEff}%`, min:50, max:85, step:1, val:calcEff, set:setCalcEff },
                  { label:`Policy Support: $${policySupport}/kg`, min:0, max:5, step:0.25, val:policySupport, set:setPolicySupport },
                ].map(r=>(
                  <div key={r.label} style={{ marginBottom:16 }}>
                    <span style={labelStyle}>{r.label}</span>
                    <input type="range" min={r.min} max={r.max} step={r.step} value={r.val}
                      onChange={e=>r.set(+e.target.value)} style={sliderStyle} />
                  </div>
                ))}
              </Card>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ background:T.navy, borderRadius:12, padding:28, textAlign:'center' }}>
                  <div style={{ fontFamily:T.mono, fontSize:12, color:T.gold, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>Levelised Cost of Hydrogen</div>
                  <div style={{ fontSize:48, fontWeight:700, color:'#ffffff', fontFamily:T.mono }}>${fmt2(calcLcoh)}</div>
                  <div style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>per kg H₂</div>
                  <div style={{ marginTop:16, padding:'8px 16px', background:'rgba(255,255,255,0.1)', borderRadius:8 }}>
                    <div style={{ color:'#94a3b8', fontSize:11 }}>vs Grey H₂ target: $1.50/kg</div>
                    <div style={{ color: calcLcoh<=1.5?T.sageL:'#f87171', fontSize:14, fontWeight:600, marginTop:4 }}>
                      {calcLcoh<=1.5?'✓ Cost competitive':'$'+(calcLcoh-1.5).toFixed(2)+'/kg premium'}
                    </div>
                  </div>
                </div>
                <Card title="LCOH Cost Component Breakdown ($/kg)">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={lcohBreakdown} layout="vertical" margin={{ top:5, right:40, left:10, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kg" />
                      <YAxis dataKey="item" type="category" tick={{ fontSize:10 }} width={120} />
                      <Tooltip formatter={v=>[`$${fmt2(v)}/kg`]} />
                      <Bar dataKey="value" name="$/kg" radius={[0,4,4,0]}
                        fill={T.navy}
                        label={{ position:'right', fontSize:10, formatter:v=>v<0?`-$${Math.abs(v).toFixed(2)}`:`$${(+v).toFixed(2)}` }} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── Demand Sectors ── */}
        {tab==='Demand Sectors' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Addressable Demand" value={`${DEMAND_SECTORS.reduce((s,d)=>s+d.demandMt,0)} Mt/yr`} sub="Global by 2030 (IEA)" color={T.navy} />
              <KpiCard label="Avg Willingness to Pay" value={`$${fmt1(DEMAND_SECTORS.reduce((s,d)=>s+d.willingness,0)/DEMAND_SECTORS.length)}/kg`} sub="Cross-sector average" color={T.gold} />
              <KpiCard label="LCOH at Cost Parity" value="$2–4/kg" sub="Range by sector" color={T.green} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Demand by Sector (Mt H₂/yr by 2030)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={DEMAND_SECTORS} margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize:9, angle:-30, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit=" Mt" />
                    <Tooltip formatter={v=>[`${v} Mt/yr`]} />
                    <Bar dataKey="demandMt" name="Demand Mt/yr" radius={[4,4,0,0]} fill={T.teal} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Willingness to Pay by Sector ($/kg H₂)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={DEMAND_SECTORS} margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize:9, angle:-30, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kg" />
                    <Tooltip formatter={v=>[`$${v}/kg`]} />
                    <Bar dataKey="willingness" name="WTP $/kg" radius={[4,4,0,0]} fill={T.gold} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Sector Demand Detail">
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:T.surfaceH }}>
                  {['Sector','Demand 2030 (Mt/yr)','Willingness to Pay','Current LCOH Gap','Use Case','Priority'].map(h=>(
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{DEMAND_SECTORS.map((d,i)=>{
                  const gap = Math.max(0, calcLcoh - d.willingness);
                  const cases = { Steel:'DRI steelmaking', Ammonia:'Haber-Bosch replacement', Refining:'Desulphurisation', 'HGV Transport':'Fuel cell trucks', Shipping:'Ammonia / LOHC', 'Aviation (SAF)':'E-fuel synthesis', 'Power Grid':'Long-duration storage', Buildings:'Blending / boilers' };
                  return (
                    <tr key={d.sector} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{d.sector}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{d.demandMt}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${d.willingness}/kg</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:gap>0?T.red:T.green, fontWeight:600 }}>{gap>0?`+$${gap.toFixed(1)}/kg`:'At parity'}</td>
                      <td style={{ padding:'8px 12px', color:T.textSec }}>{cases[d.sector]}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                          background:d.demandMt>30?'#fee2e2':d.demandMt>15?'#fef3c7':'#f0fdf4',
                          color:d.demandMt>30?T.red:d.demandMt>15?T.amber:T.green }}>
                          {d.demandMt>30?'Critical':'Priority'}
                        </span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Project Portfolio ── */}
        {tab==='Project Portfolio' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Projects" value={totals.n} />
              <KpiCard label="Avg LCOH" value={`$${fmt2(totals.avgLcoh)}/kg`} color={T.amber} />
              <KpiCard label="Total Output" value={`${fmt0(totals.totalH2)} t/yr`} color={T.navy} />
              <KpiCard label="Total CO₂ Avoided" value={`${fmt0(totals.totalCo2)} tCO₂/yr`} color={T.green} />
              <KpiCard label="Total CAPEX" value={`$${fmt0(totals.totalCapex)}M`} />
            </div>
            <Card title="LCOH by Region ($/ kg)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={REGIONS.map(r=>{ const ps=filtered.filter(p=>p.region===r); return { region:r.split(' ')[0], avgLcoh: ps.length?+(ps.reduce((a,p)=>a+p.lcoh,0)/ps.length).toFixed(2):0 }; })}
                  margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kg" />
                  <Tooltip formatter={v=>[`$${fmt2(v)}/kg`]} />
                  <Bar dataKey="avgLcoh" name="Avg LCOH" fill={T.teal} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Project List">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Project','Technology','Region','Capacity MW','LCOH $/kg','H₂ t/yr','CAPEX $M','CF %','CO₂ Avoided t'].map(h=>(
                      <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b)=>a.lcoh-b.lcoh).map((p,i)=>(
                    <tr key={p.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.name}</td>
                      <td style={{ padding:'6px 10px' }}>{p.techName}</td>
                      <td style={{ padding:'6px 10px' }}>{p.region}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.capacity}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:700, color:p.lcoh<3?T.green:p.lcoh<6?T.amber:T.red }}>${p.lcoh}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(p.h2Output)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${fmt0(p.capex)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.capFactor}%</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.green }}>{fmt0(p.co2Avoided)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Supply Chain ── */}
        {tab==='Supply Chain' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Green Hydrogen Supply Chain — Key Components & Cost Drivers">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { stage:'Renewable Electricity', metric:'$/MWh', range:'$20–80', driver:'Solar/wind LCOE', risk:'Intermittency → LCOH sensitivity', color:T.gold },
                  { stage:'Electrolysis', metric:'$/kW (CAPEX)', range:'$300–2,200', driver:'Technology type + scale', risk:'Stack degradation; IrO₂ scarcity (PEM)', color:'#3b82f6' },
                  { stage:'Compression & Storage', metric:'$/kg H₂', range:'$0.30–1.20', driver:'Pressure level, storage duration', risk:'Hydrogen embrittlement', color:T.teal },
                  { stage:'Transport: Pipeline', metric:'$/kg per 1,000km', range:'$0.20–0.50', driver:'Repurposed vs new pipe', risk:'Blending limits; material specs', color:T.sage },
                  { stage:'Transport: Shipping', metric:'$/kg H₂ equiv.', range:'$1.50–3.00', driver:'Liquefaction vs LOHC vs NH₃', risk:'Boil-off; reconversion losses', color:T.navyL },
                  { stage:'End-use Interface', metric:'$/kg (reconversion)', range:'$0.10–0.80', driver:'Direct use vs carrier crack', risk:'Fuel cell stack cost; NH₃ toxicity', color:T.amber },
                ].map(s=>(
                  <div key={s.stage} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}`, borderLeft:`3px solid ${s.color}` }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginBottom:6 }}>{s.stage}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}><b>Metric:</b> {s.metric}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}><b>Range:</b> {s.range}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}><b>Driver:</b> {s.driver}</div>
                    <div style={{ fontSize:11, color:T.red }}><b>Risk:</b> {s.risk}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Carrier Comparison — Long-Distance H₂ Transport">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Carrier','Form','Energy Density','Transport Cost','Reconversion','TRL','Best Use'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[
                    { carrier:'Compressed H₂',  form:'GH₂',     density:'0.04 kg/L @700bar', cost:'High',   reconv:'Direct', trl:'9', use:'Short distance / on-site' },
                    { carrier:'Liquid H₂',       form:'LH₂',     density:'0.07 kg/L',          cost:'Very High', reconv:'Direct', trl:'7', use:'Maritime shipping' },
                    { carrier:'Ammonia (NH₃)',   form:'NH₃',     density:'0.12 kg H₂/L',       cost:'Medium',reconv:'Cracking $0.50–1/kg', trl:'9', use:'Bulk shipping, power' },
                    { carrier:'LOHC',            form:'Liquid',  density:'0.06 kg H₂/L',       cost:'Medium',reconv:'$1.0–1.5/kg', trl:'7', use:'Supply chain integration' },
                    { carrier:'Pipeline',        form:'Blend/pure', density:'N/A',              cost:'Low',   reconv:'None', trl:'9', use:'Continental grids' },
                  ].map((r,i)=>(
                    <tr key={r.carrier} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{r.carrier}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{r.form}</td>
                      <td style={{ padding:'8px 12px' }}>{r.density}</td>
                      <td style={{ padding:'8px 12px', color:r.cost==='Low'?T.green:r.cost==='Very High'?T.red:T.amber }}>{r.cost}</td>
                      <td style={{ padding:'8px 12px', color:T.textSec }}>{r.reconv}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{r.trl}</td>
                      <td style={{ padding:'8px 12px', color:T.textSec }}>{r.use}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Policy & Incentives ── */}
        {tab==='Policy & Incentives' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Global Hydrogen Policy Landscape">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {[
                  { region:'United States', policy:'IRA §45V Clean Hydrogen Tax Credit', value:'Up to $3/kg (Tier 1: <0.45 kgCO₂e/kg)', mechanism:'Production tax credit', horizon:'2024–2033' },
                  { region:'European Union', policy:'RFNBO Delegated Act + H₂ Bank', value:'€4–9/kg subsidy (auction)', mechanism:'Competitive auction + mandates', horizon:'2023–2030' },
                  { region:'United Kingdom', policy:'LCHA (Low-Carbon H₂ Agreement)', value:'Contracts for Difference style', mechanism:'Revenue support CfD-H₂', horizon:'2023 onwards' },
                  { region:'Germany', policy:'H₂-Global + National Strategy', value:'€9B national strategy', mechanism:'Procurement + import support', horizon:'2023–2030' },
                  { region:'Japan', policy:'GX Basic Policy — H₂ Strategy', value:'¥15T ($100B) over 15 years', mechanism:'Volume-based contracts', horizon:'2023–2040' },
                  { region:'Australia', policy:'National Hydrogen Strategy + ARENA', value:'A$2/kg incentive target', mechanism:'Hydrogen headstart grants', horizon:'2024–2035' },
                ].map(p=>(
                  <div key={p.region} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}` }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginBottom:4 }}>{p.region}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4 }}>{p.policy}</div>
                    <div style={{ fontSize:11, color:T.green, marginBottom:2 }}><b>Value:</b> {p.value}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:2 }}><b>Mechanism:</b> {p.mechanism}</div>
                    <div style={{ fontSize:10, fontFamily:T.mono, color:T.textMut }}>{p.horizon}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── Market Outlook ── */}
        {tab==='Market Outlook' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="IEA NZE H₂ Demand 2030" value="90 Mt/yr" sub="Clean H₂ target" color={T.navy} />
              <KpiCard label="Current Production" value="~1 Mt/yr" sub="Green hydrogen only" color={T.amber} />
              <KpiCard label="LCOH Target 2030" value="$1–2/kg" sub="Cost parity range" color={T.green} />
              <KpiCard label="Electrolyser Capacity" value="1,500 GW" sub="Required by 2030 (IEA)" color={T.teal} />
              <KpiCard label="Investment Needed" value="$130B/yr" sub="2030–2050 (IEA)" color={T.red} />
            </div>
            <Card title="Green H₂ Market Outlook — Production & Cost (2025–2050)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={[2025,2030,2035,2040,2050].map((yr,i)=>({
                    year:yr.toString(),
                    production: [1,30,120,350,800][i],
                    lcoh: [5.5,3.0,2.0,1.5,1.0][i],
                  }))}
                  margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis yAxisId="left" tick={{ fontSize:10, fontFamily:T.mono }} unit=" Mt" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fontFamily:T.mono }} unit=" $/kg" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left"  dataKey="production" name="Production Mt/yr" stroke={T.teal}  fill={T.teal}  fillOpacity={0.15} strokeWidth={2} />
                  <Line yAxisId="right" dataKey="lcoh"       name="LCOH $/kg"        stroke={T.amber} strokeWidth={2} dot />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <CleanTechAdvancedAnalytics T={T} moduleId="DF2" moduleName="Green Hydrogen Economics" />
        </div>
      )}

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DF2 · Green Hydrogen Economics · IEA GHO 2024 · IRENA · HyColor</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} projects · LCOH ${fmt2(calcLcoh)}/kg live</span>
      </div>
    </div>
  );
}
