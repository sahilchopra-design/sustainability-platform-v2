import React, { useState, useMemo } from 'react';
import CleanTechAdvancedAnalytics from '../../_shared/CleanTechAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, Legend,
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

const TECH_TYPES = [
  { id:'POST', name:'Post-Combustion',  costRange:[50,100], trl:9, co2Purity:99, color:T.navy },
  { id:'PRE',  name:'Pre-Combustion',   costRange:[40,80],  trl:8, co2Purity:98, color:'#3b82f6' },
  { id:'OXY',  name:'Oxyfuel',          costRange:[55,90],  trl:7, co2Purity:99.5, color:T.teal },
  { id:'BECCS',name:'BECCS',            costRange:[80,150], trl:6, co2Purity:98, color:T.sage },
  { id:'DAC_S',name:'DAC (Solid Sorbent)',costRange:[200,400],trl:6,co2Purity:99.9,color:T.gold },
  { id:'DAC_L',name:'DAC (Liquid Solvent)',costRange:[300,600],trl:5,co2Purity:99.9,color:T.amber },
];

const STORAGE_TYPES = ['Saline Aquifer','Depleted Oil Field','Depleted Gas Field','Enhanced Oil Recovery (EOR)','Basalt Formation'];
const UTILISATION   = ['Concrete Mineralisation','Synthetic Fuels (e-fuels)','Urea/Chemicals','Enhanced Geothermal','Direct Air Utilisation'];
const REGIONS = ['North America','Europe','Asia-Pacific','Middle East','Australia','UK'];

const PROJECTS = Array.from({ length: 40 }, (_, i) => {
  const tech    = TECH_TYPES[Math.floor(sr(i*7)*TECH_TYPES.length)];
  const region  = REGIONS[Math.floor(sr(i*11)*REGIONS.length)];
  const storage = STORAGE_TYPES[Math.floor(sr(i*13)*STORAGE_TYPES.length)];
  const util    = sr(i*17) > 0.6 ? UTILISATION[Math.floor(sr(i*19)*UTILISATION.length)] : null;

  const captureRate   = Math.round(50 + sr(i*23)*950);      // ktCO₂/yr
  const captureCost   = Math.round(tech.costRange[0] + sr(i*29)*(tech.costRange[1]-tech.costRange[0])); // $/tCO₂
  const capex         = Math.round(captureRate * captureCost * 0.12 + sr(i*31)*50); // $M
  const opex          = Math.round(captureRate * captureCost * 0.04 + sr(i*37)*5);  // $M/yr

  const carbonPx      = 80; // baseline
  const creditRevenue = captureRate * carbonPx / 1000;    // $M/yr
  const eorPremium    = storage === 'Enhanced Oil Recovery (EOR)' ? captureRate * 30 / 1000 : 0;
  const q45Credit     = region === 'North America' ? captureRate * 85 / 1000 : 0; // 45Q $85/t
  const totalRevenue  = creditRevenue + eorPremium + q45Credit;

  const annualNetRevenue = totalRevenue - opex;
  const irr = annualNetRevenue > 0
    ? Math.round(8 + (annualNetRevenue / capex) * 80 + sr(i*41)*8)
    : Math.round(2 + sr(i*41)*6);
  const payback = annualNetRevenue > 0 ? Math.round(capex / annualNetRevenue) : 99;
  const breakEvenCx = Math.round(captureCost * 1.1 + sr(i*43)*20);
  const npv20 = Math.round((annualNetRevenue * 12 - capex) + sr(i*47)*10); // simplified 20yr

  return {
    id:i+1, name:`CCS-${String(i+1).padStart(3,'0')}`,
    techId:tech.id, techName:tech.name, region, storage, util,
    captureRate, captureCost, capex, opex, totalRevenue,
    irr, payback, breakEvenCx, npv20, q45Credit, eorPremium,
    color:tech.color, trl:tech.trl,
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

const TABS = ['Overview','Project Portfolio','Capture Technology','Storage & Utilisation','Financial Modelling','Policy Incentives','Market Outlook','Advanced Analytics'];

export default function CarbonCaptureFinancePage() {
  const [tab, setTab]             = useState('Overview');
  const [filterTech, setFilterTech]   = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [carbonPx, setCarbonPx]   = useState(80);   // $/tCO₂
  const [q45Rate, setQ45Rate]     = useState(85);   // $/t 45Q credit
  const [discRate, setDiscRate]   = useState(8);    // % discount rate

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (filterTech   === 'All' || p.techId === filterTech) &&
    (filterRegion === 'All' || p.region === filterRegion)
  ), [filterTech, filterRegion]);

  const totals = useMemo(() => {
    const n = filtered.length||1;
    const revenue = filtered.reduce((s,p)=>s+p.captureRate*carbonPx/1000+(p.region==='North America'?p.captureRate*q45Rate/1000:0),0);
    return {
      n: filtered.length,
      totalCapture: filtered.reduce((s,p)=>s+p.captureRate,0),
      totalCapex:   filtered.reduce((s,p)=>s+p.capex,0),
      avgCost:      filtered.reduce((s,p)=>s+p.captureCost,0)/n,
      avgIrr:       filtered.reduce((s,p)=>s+p.irr,0)/n,
      totalRevenue: revenue,
      avgBreakEven: filtered.reduce((s,p)=>s+p.breakEvenCx,0)/n,
    };
  }, [filtered, carbonPx, q45Rate]);

  // Tech breakdown
  const techRows = useMemo(() => TECH_TYPES.map(t => {
    const ps = filtered.filter(p=>p.techId===t.id);
    const n  = ps.length||1;
    return { ...t, count:ps.length, avgCost:ps.reduce((a,p)=>a+p.captureCost,0)/n,
      totalCapture:ps.reduce((a,p)=>a+p.captureRate,0), avgIrr:ps.reduce((a,p)=>a+p.irr,0)/n };
  }), [filtered]);

  // Cost reduction trajectory
  const costTrajectory = useMemo(() => Array.from({length:6},(_,i)=>({
    year:(2025+i*5).toString(),
    postCombustion: Math.round(75-i*5),
    beccs:          Math.round(115-i*8),
    dacSolid:       Math.round(300-i*35),
    dacLiquid:      Math.round(450-i*55),
  })), []);

  // Carbon price sensitivity on portfolio NPV
  const npvSensitivity = useMemo(() => [40,60,80,100,130,160,200].map(px=>{
    const totalNpv = filtered.reduce((s,p)=>{
      const rev = p.captureRate*px/1000 + (p.region==='North America'?p.captureRate*q45Rate/1000:0);
      const annNet = rev - p.opex;
      const npv = annNet * (1-Math.pow(1+discRate/100,-20))/(discRate/100) - p.capex;
      return s+npv;
    },0);
    return { price:`$${px}`, npv: Math.round(totalNpv) };
  }), [filtered, q45Rate, discRate]);

  const labelStyle = { fontSize:11, color:T.textSec, marginBottom:4, display:'block' };
  const selectStyle = { padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text };
  const sliderStyle = { width:'100%', accentColor:T.navy };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DF3 · Carbon Capture, Utilisation & Storage Finance</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#ffffff', marginBottom:4 }}>CCUS Finance Analytics</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>40 projects · Post-combustion · Pre-combustion · BECCS · DAC · 45Q · Break-even carbon price</div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', alignItems:'flex-end' }}>
          <div><span style={labelStyle}>Technology</span>
            <select style={selectStyle} value={filterTech} onChange={e=>setFilterTech(e.target.value)}>
              <option>All</option>{TECH_TYPES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
          <div><span style={labelStyle}>Region</span>
            <select style={selectStyle} value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}>
              <option>All</option>{REGIONS.map(r=><option key={r}>{r}</option>)}
            </select></div>
          <div style={{ flex:1, minWidth:180 }}>
            <span style={labelStyle}>Carbon Price: ${carbonPx}/tCO₂</span>
            <input type="range" min={20} max={250} step={10} value={carbonPx} onChange={e=>setCarbonPx(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ minWidth:160 }}>
            <span style={labelStyle}>45Q Credit: ${q45Rate}/t</span>
            <input type="range" min={0} max={180} step={5} value={q45Rate} onChange={e=>setQ45Rate(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ minWidth:160 }}>
            <span style={labelStyle}>Discount Rate: {discRate}%</span>
            <input type="range" min={4} max={18} step={1} value={discRate} onChange={e=>setDiscRate(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{totals.n} projects</div>
        </div>

        <div style={{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===t?T.navy:T.border}`, background:tab===t?T.navy:T.surface, color:tab===t?'#fff':T.textSec, fontFamily:T.font, fontSize:12, fontWeight:tab===t?600:400, cursor:'pointer' }}>{t}</button>
          ))}
        </div>

        {tab==='Overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total CO₂ Capture" value={`${fmt0(totals.totalCapture)} ktCO₂/yr`} sub="Portfolio capacity" color={T.navy} />
              <KpiCard label="Avg Capture Cost" value={`$${fmt1(totals.avgCost)}/tCO₂`} sub="Weighted average" color={T.amber} />
              <KpiCard label="Total CAPEX" value={`$${fmt0(totals.totalCapex)}M`} sub="Portfolio investment" />
              <KpiCard label="Portfolio Revenue" value={`$${fmt1(totals.totalRevenue)}M/yr`} sub={`@ $${carbonPx}/t + 45Q`} color={T.green} />
              <KpiCard label="Avg Portfolio IRR" value={`${fmt1(totals.avgIrr)}%`} sub="Project-level average" color={totals.avgIrr>=10?T.green:T.red} />
              <KpiCard label="Avg Break-Even Price" value={`$${fmt1(totals.avgBreakEven)}/tCO₂`} sub="To achieve positive NPV" color={T.red} />
            </div>

            <Card title="Technology Comparison Summary">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Technology','TRL','Projects','Cost Range $/t','Avg Cost','Total ktCO₂/yr','Avg IRR %','CO₂ Purity'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{techRows.filter(r=>r.count>0).map((r,i)=>(
                    <tr key={r.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:r.color, marginRight:8 }} />{r.name}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{r.trl}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{r.count}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>${r.costRange[0]}–${r.costRange[1]}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:r.avgCost<100?T.text:r.avgCost<250?T.amber:T.red }}>${fmt1(r.avgCost)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{fmt0(r.totalCapture)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:r.avgIrr>=10?T.green:T.text }}>{fmt1(r.avgIrr)}%</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{r.co2Purity}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>

            <Card title="Capture Cost Reduction Trajectory by Technology ($/tCO₂, 2025–2050)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={costTrajectory} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/t" />
                  <Tooltip formatter={v=>[`$${v}/tCO₂`]} />
                  <Legend />
                  <Line dataKey="postCombustion" name="Post-Combustion" stroke={T.navy}  strokeWidth={2} dot={false} />
                  <Line dataKey="beccs"           name="BECCS"           stroke={T.sage}  strokeWidth={2} dot={false} />
                  <Line dataKey="dacSolid"        name="DAC Solid"       stroke={T.gold}  strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  <Line dataKey="dacLiquid"       name="DAC Liquid"      stroke={T.amber} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Project Portfolio' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Project Portfolio — All CCS/CCUS/DAC Projects">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Project','Technology','Region','Storage','Capture kt/yr','Cost $/t','CAPEX $M','OPEX $M/yr','Revenue $M/yr','IRR %','Break-Even $/t'].map(h=>(
                      <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b)=>b.irr-a.irr).map((p,i)=>{
                    const adjRevenue = p.captureRate*carbonPx/1000+(p.region==='North America'?p.captureRate*q45Rate/1000:0)+p.eorPremium;
                    return (
                      <tr key={p.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.name}</td>
                        <td style={{ padding:'6px 10px' }}>{p.techName}</td>
                        <td style={{ padding:'6px 10px' }}>{p.region}</td>
                        <td style={{ padding:'6px 10px', fontSize:11, color:T.textSec }}>{p.storage.slice(0,20)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(p.captureRate)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:p.captureCost<100?T.text:p.captureCost<250?T.amber:T.red }}>${p.captureCost}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${fmt0(p.capex)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${fmt0(p.opex)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:adjRevenue>p.opex?T.green:T.red }}>${fmt1(adjRevenue)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:600, color:p.irr>=10?T.green:T.text }}>{p.irr}%</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${p.breakEvenCx}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Capture Technology' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Avg Capture Cost by Technology ($/tCO₂)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={techRows.filter(r=>r.count>0)} margin={{ top:5, right:20, left:0, bottom:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize:9, angle:-35, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/t" />
                    <Tooltip formatter={v=>[`$${fmt1(v)}/tCO₂`]} />
                    <Bar dataKey="avgCost" name="Avg Cost $/t" fill={T.navy} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Total Capture Capacity by Technology (ktCO₂/yr)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={techRows.filter(r=>r.count>0)} margin={{ top:5, right:20, left:0, bottom:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize:9, angle:-35, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip formatter={v=>[`${fmt0(v)} ktCO₂/yr`]} />
                    <Bar dataKey="totalCapture" name="ktCO₂/yr" fill={T.teal} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Technology Profiles">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {TECH_TYPES.map(t=>(
                  <div key={t.id} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}`, borderLeft:`3px solid ${t.color}` }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginBottom:6 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:3 }}>Cost range: ${t.costRange[0]}–${t.costRange[1]}/tCO₂</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:3 }}>TRL: {t.trl}/9</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:3 }}>CO₂ purity: {t.co2Purity}%</div>
                    <div style={{ marginTop:8 }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:t.trl>=8?'#dcfce7':t.trl>=6?'#fef3c7':'#fce7f3', color:t.trl>=8?T.green:t.trl>=6?T.amber:'#9d174d' }}>TRL {t.trl}</span></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Storage & Utilisation' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Storage Type Distribution">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={STORAGE_TYPES.map(s=>({ storage:s.split(' ').slice(0,2).join(' '), count:filtered.filter(p=>p.storage===s).length }))}
                    layout="vertical" margin={{ top:5, right:20, left:120, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10 }} />
                    <YAxis dataKey="storage" type="category" tick={{ fontSize:10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" name="Projects" fill={T.navy} radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Utilisation Pathway Distribution">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={['None (Storage only)',...UTILISATION].map(u=>({
                      util: u.split('(')[0].trim().slice(0,20),
                      count: u==='None (Storage only)'?filtered.filter(p=>!p.util).length:filtered.filter(p=>p.util===u).length,
                    }))}
                    layout="vertical" margin={{ top:5, right:20, left:140, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10 }} />
                    <YAxis dataKey="util" type="category" tick={{ fontSize:10 }} width={140} />
                    <Tooltip />
                    <Bar dataKey="count" name="Projects" fill={T.teal} radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {tab==='Financial Modelling' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title={`Portfolio NPV Sensitivity to Carbon Price (20-yr, ${discRate}% discount rate)`}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={npvSensitivity} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="price" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="M" />
                  <Tooltip formatter={v=>[`$${fmt0(v)}M`]} />
                  <Bar dataKey="npv" name="Portfolio NPV $M" radius={[4,4,0,0]}
                    fill={T.navy}
                    label={{ position:'top', fontSize:9, formatter:v=>v>0?`+$${fmt0(v)}M`:`-$${fmt0(Math.abs(v))}M` }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="IRR vs Capture Cost Scatter">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Cost $/t" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'$/tCO₂', position:'insideBottom', offset:-5, fontSize:10 }} />
                  <YAxis dataKey="y" name="IRR %" tick={{ fontSize:10 }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v,n)=>[n==='x'?`$${v}/t`:`${v}%`, n==='x'?'Cost':'IRR']} />
                  <Scatter data={filtered.map(p=>({ x:p.captureCost, y:p.irr }))} fill={T.navy} opacity={0.55} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Policy Incentives' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Carbon Capture Policy & Incentive Landscape">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {[
                  { name:'US 45Q Tax Credit', region:'USA', value:'$85/t geological storage; $60/t utilisation', mechanism:'Federal tax credit per tCO₂ captured', notes:'10-yr credit period from commissioning; Direct Pay for non-taxable entities' },
                  { name:'EU Innovation Fund', region:'Europe', value:'€10B+ (NER300 successor)', mechanism:'Capital grants + operating support', notes:'CCUS + renewables + industrial decarbonisation; auction-based' },
                  { name:'UK CCS Infrastructure Fund', region:'UK', value:'£1B capital + CfD revenue support', mechanism:'Industrial CCS clusters (HyNet, East Coast)', notes:'Track 1 & 2 cluster programme; contracts for difference' },
                  { name:'Canada CCUS ITC', region:'Canada', value:'50% CCUS project capex credit (direct)', mechanism:'Investment Tax Credit', notes:'Direct capture: 50%; transport/storage: 37.5%; 2022–2040' },
                  { name:'Norway CLIMIT/Longship', region:'Norway', value:'NOK 16.8B (~$1.5B)', mechanism:'State-funded full-chain CCS (Northern Lights)', notes:'Tie-in to EU BECCS; offshore CO₂ storage' },
                  { name:'IEA CCUS Roadmap', region:'Global', value:'1.6 Gt/yr by 2030 (NZE)', mechanism:'Policy coordination target', notes:'Only ~0.05 Gt/yr today; ~32× scale-up needed' },
                ].map(p=>(
                  <div key={p.name} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}` }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>📍 {p.region}</div>
                    <div style={{ fontSize:12, color:T.green, fontWeight:600, marginBottom:4 }}>{p.value}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>{p.mechanism}</div>
                    <div style={{ fontSize:11, color:T.textMut }}>{p.notes}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Market Outlook' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Current Global CCS Capacity" value="~50 MtCO₂/yr" sub="2024 operational" color={T.navy} />
              <KpiCard label="IEA NZE Target 2030" value="1,600 MtCO₂/yr" sub="32× scale-up needed" color={T.red} />
              <KpiCard label="DAC Cost Target" value="$100/tCO₂" sub="By 2030 (advanced DAC)" color={T.amber} />
              <KpiCard label="Storage Capacity (global)" value=">8,000 Gt" sub="Geological potential" color={T.green} />
            </div>
            <Card title="Global CCS Capacity Outlook (MtCO₂/yr) — NZE Scenario">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={[2025,2030,2035,2040,2050].map((yr,i)=>({ year:yr.toString(), point_source:[50,360,800,1200,1600][i], dac:[0.01,5,35,150,450][i] }))}
                  margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit=" Mt" />
                  <Tooltip formatter={v=>[`${fmt0(v)} MtCO₂/yr`]} />
                  <Legend />
                  <Area dataKey="point_source" name="Point Source CCS" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
                  <Area dataKey="dac"          name="Direct Air Capture" stroke={T.gold} fill={T.gold} fillOpacity={0.20} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <CleanTechAdvancedAnalytics T={T} moduleId="DF3" moduleName="Carbon Capture Finance" />
        </div>
      )}

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DF3 · CCUS Finance · IEA CCUS Roadmap 2024 · IRS 45Q · IPCC AR6</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} projects · C ${carbonPx}/t · 45Q ${q45Rate}/t</span>
      </div>
    </div>
  );
}
