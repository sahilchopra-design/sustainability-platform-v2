import React, { useState, useMemo } from 'react';
import CleanTechAdvancedAnalytics from '../../_shared/CleanTechAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

// Storage technologies
const TECH = [
  { id:'LI',  name:'Li-ion (NMC)',     capexKwh:180, opexKwh:8,  rte:0.90, cycles:4000, calLife:15, cRate:0.5, color:'#3b82f6' },
  { id:'LFP', name:'Li-ion (LFP)',     capexKwh:160, opexKwh:6,  rte:0.92, cycles:6000, calLife:20, cRate:1.0, color:T.navyL },
  { id:'FLW', name:'Vanadium Flow',    capexKwh:350, opexKwh:12, rte:0.75, cycles:20000,calLife:25, cRate:0.25,color:T.teal },
  { id:'CAE', name:'CAES',             capexKwh:60,  opexKwh:3,  rte:0.65, cycles:50000,calLife:40, cRate:0.1, color:T.textMut },
  { id:'PHS', name:'Pumped Hydro',     capexKwh:80,  opexKwh:2,  rte:0.80, cycles:100000,calLife:60,cRate:0.1, color:T.navy },
  { id:'TES', name:'Thermal Storage',  capexKwh:25,  opexKwh:1,  rte:0.70, cycles:30000,calLife:30, cRate:0.2, color:T.gold },
  { id:'H2S', name:'H₂ Long-Duration', capexKwh:120, opexKwh:10, rte:0.40, cycles:10000,calLife:20, cRate:0.05,color:T.sage },
];

const SERVICES = ['Frequency Regulation','Capacity Market','Energy Arbitrage','Peak Shaving','Ancillary Services','Behind-the-Meter'];
const REGIONS   = ['GB','Germany','France','USA-CAISO','USA-PJM','Australia-NEM','Singapore'];

// 50 storage projects
const PROJECTS = Array.from({ length: 50 }, (_, i) => {
  const tech    = TECH[Math.floor(sr(i*7)*TECH.length)];
  const region  = REGIONS[Math.floor(sr(i*11)*REGIONS.length)];
  const service = SERVICES[Math.floor(sr(i*13)*SERVICES.length)];
  const powerMw = Math.round(5 + sr(i*17)*295);     // MW
  const durHrs  = Math.round(1 + sr(i*19)*11);       // hours
  const energyMwh = powerMw * durHrs;
  const dod     = 0.80 + sr(i*23)*0.15;              // depth of discharge
  const cf      = 0.15 + sr(i*29)*0.55;              // utilisation

  // LCOS ($/MWh): (capex + opex*life) / (cycles * dod * energy * life)
  const capex  = tech.capexKwh * energyMwh / 1000;  // $M
  const opexYr = tech.opexKwh  * energyMwh / 1000;  // $M/yr
  // cycles over life at given utilisation
  const annCycles  = cf * 365;
  const totalCycles = Math.min(tech.cycles, annCycles * tech.calLife);
  const totalMwh   = totalCycles * dod * energyMwh;
  const lcos       = (capex * 1e6 + opexYr * 1e6 * tech.calLife) / (totalMwh * 1000); // $/MWh
  const lcosAdj    = Math.max(20, Math.round(lcos * 10 + sr(i*31)*20) / 10);

  // Revenue stacking
  const freqRev    = service==='Frequency Regulation'  ? powerMw * 18000 / 1e6 : powerMw * sr(i*37)*8000/1e6;
  const capacityRev= service==='Capacity Market'        ? powerMw * 50000 / 1e6 : powerMw * sr(i*41)*20000/1e6;
  const arbitrage  = energyMwh * cf * 365 * 35 / 1e6;
  const totalRevYr = freqRev + capacityRev + arbitrage;

  const irr = Math.round(5 + (totalRevYr - opexYr) / capex * 70 + sr(i*43)*6);
  const elcc = Math.round(60 + sr(i*47)*35); // %

  return { id:i+1, name:`ESS-${String(i+1).padStart(3,'0')}`,
    techId:tech.id, techName:tech.name, region, service,
    powerMw, durHrs, energyMwh:Math.round(energyMwh), dod:Math.round(dod*100),
    capex:Math.round(capex*10)/10, opexYr:Math.round(opexYr*100)/100,
    lcos:lcosAdj, irr, totalRevYr:Math.round(totalRevYr*10)/10, elcc,
    rte:Math.round(tech.rte*100), cycles:tech.cycles, color:tech.color };
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

const TABS = ['Overview','Technology Comparison','Project Portfolio','LCOS Analysis','Revenue Stacking','Grid Integration','Investment Outlook','Advanced Analytics'];

export default function EnergyStorageAnalyticsPage() {
  const [tab, setTab]             = useState('Overview');
  const [filterTech, setFilterTech]   = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [elecPx, setElecPx]       = useState(60);  // $/MWh spread for arbitrage
  const [fcRevenue, setFcRevenue] = useState(18);  // k$/MW/yr frequency cap

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (filterTech   === 'All' || p.techId   === filterTech) &&
    (filterRegion === 'All' || p.region   === filterRegion)
  ), [filterTech, filterRegion]);

  const totals = useMemo(() => {
    const n = filtered.length||1;
    return {
      n: filtered.length,
      totalPower:  filtered.reduce((s,p)=>s+p.powerMw,0),
      totalEnergy: filtered.reduce((s,p)=>s+p.energyMwh,0),
      avgLcos:     filtered.reduce((s,p)=>s+p.lcos,0)/n,
      avgIrr:      filtered.reduce((s,p)=>s+p.irr,0)/n,
      avgDur:      filtered.reduce((s,p)=>s+p.durHrs,0)/n,
      totalCapex:  filtered.reduce((s,p)=>s+p.capex,0),
    };
  }, [filtered]);

  const techCompare = useMemo(() => TECH.map(t => {
    const ps = PROJECTS.filter(p=>p.techId===t.id);
    const n  = ps.length||1;
    return { ...t, count:ps.length, avgLcos:+(ps.reduce((a,p)=>a+p.lcos,0)/n).toFixed(1),
      avgIrr:+(ps.reduce((a,p)=>a+p.irr,0)/n).toFixed(1) };
  }), []);

  // LCOS learning curve
  const lcosTrajectory = useMemo(() => Array.from({length:6},(_,i)=>({
    year:(2025+i*5).toString(),
    liNmc:  Math.round(180-i*18),
    lfp:    Math.round(160-i*15),
    flow:   Math.round(350-i*25),
    phs:    Math.round(80-i*2),
  })), []);

  // Revenue by service type
  const revenueByService = useMemo(() => SERVICES.map(s=>({
    service: s.split(' ').slice(0,2).join(' '),
    count:  filtered.filter(p=>p.service===s).length,
    avgRev: +(filtered.filter(p=>p.service===s).reduce((a,p)=>a+p.totalRevYr,0)/(filtered.filter(p=>p.service===s).length||1)).toFixed(1),
  })), [filtered]);

  // Radar — tech profile
  const radarData = useMemo(() => [
    { metric:'RTE',      LFP:92, Flow:75, CAES:65, PHS:80 },
    { metric:'Cycle Life',LFP:70,Flow:95, CAES:98, PHS:100},
    { metric:'Flexibility',LFP:90,Flow:70,CAES:40,PHS:35 },
    { metric:'Scalability',LFP:85,Flow:80,CAES:50,PHS:30 },
    { metric:'Cost (inv)',LFP:80,Flow:50,CAES:90,PHS:85 },
    { metric:'Duration',  LFP:40,Flow:70,CAES:85,PHS:90 },
  ], []);

  const labelStyle = { fontSize:11, color:T.textSec, marginBottom:4, display:'block' };
  const selectStyle = { padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DF4 · Energy Storage Analytics</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#ffffff', marginBottom:4 }}>Energy Storage Analytics</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>50 projects · Li-ion · Flow battery · CAES · Pumped hydro · LCOS · Revenue stacking · Grid ELCC</div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', alignItems:'flex-end' }}>
          <div><span style={labelStyle}>Technology</span>
            <select style={selectStyle} value={filterTech} onChange={e=>setFilterTech(e.target.value)}>
              <option>All</option>{TECH.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
          <div><span style={labelStyle}>Region</span>
            <select style={selectStyle} value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}>
              <option>All</option>{REGIONS.map(r=><option key={r}>{r}</option>)}
            </select></div>
          <div style={{ flex:1, minWidth:180 }}>
            <span style={labelStyle}>Arbitrage Spread: ${elecPx}/MWh</span>
            <input type="range" min={10} max={120} step={5} value={elecPx} onChange={e=>setElecPx(+e.target.value)} style={{ width:'100%', accentColor:T.navy }} />
          </div>
          <div style={{ minWidth:180 }}>
            <span style={labelStyle}>Freq. Reg Revenue: ${fcRevenue}k/MW/yr</span>
            <input type="range" min={5} max={40} step={1} value={fcRevenue} onChange={e=>setFcRevenue(+e.target.value)} style={{ width:'100%', accentColor:T.navy }} />
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
              <KpiCard label="Total Portfolio Power" value={`${fmt0(totals.totalPower)} MW`} sub="Installed capacity" color={T.navy} />
              <KpiCard label="Total Energy Capacity" value={`${fmt0(totals.totalEnergy)} MWh`} sub="Storage capacity" />
              <KpiCard label="Avg Storage Duration" value={`${fmt1(totals.avgDur)} hrs`} sub="Portfolio average" />
              <KpiCard label="Avg LCOS" value={`$${fmt1(totals.avgLcos)}/MWh`} sub="Levelised cost" color={T.amber} />
              <KpiCard label="Avg Portfolio IRR" value={`${fmt1(totals.avgIrr)}%`} sub="Revenue stacking" color={totals.avgIrr>=10?T.green:T.text} />
              <KpiCard label="Total CAPEX" value={`$${fmt1(totals.totalCapex)}M`} sub="Portfolio investment" />
            </div>
            <Card title="Technology Profiles — Key Metrics">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Technology','Projects','CAPEX $/kWh','RTE %','Cycle Life','Cal. Life (yr)','C-Rate','Avg LCOS $/MWh','Avg IRR %'].map(h=>(
                      <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{techCompare.map((t,i)=>(
                    <tr key={t.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 10px', fontWeight:600 }}><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:t.color, marginRight:8 }} />{t.name}</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono }}>{t.count}</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono }}>${t.capexKwh}</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono }}>{Math.round(t.rte*100)}%</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono }}>{fmt0(t.cycles)}</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono }}>{t.calLife}</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono }}>{t.cRate}C</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono, color:t.avgLcos<100?T.green:t.avgLcos<200?T.amber:T.text }}>${t.avgLcos}</td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono, color:t.avgIrr>=10?T.green:T.text }}>{t.avgIrr}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Technology Comparison' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="CAPEX $/kWh by Technology">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={techCompare} layout="vertical" margin={{ top:5, right:60, left:120, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kWh" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize:10 }} width={120} />
                    <Tooltip formatter={v=>[`$${v}/kWh`]} />
                    <Bar dataKey="capexKwh" name="$/kWh" fill={T.navy} radius={[0,4,4,0]}
                      label={{ position:'right', fontSize:10, formatter:v=>`$${v}` }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Technology Capability Radar">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                    <PolarGrid stroke={T.borderL} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize:10 }} />
                    <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} />
                    <Radar dataKey="LFP"  name="Li-ion LFP" stroke={T.navyL} fill={T.navyL} fillOpacity={0.15} />
                    <Radar dataKey="Flow" name="Vanadium Flow" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
                    <Radar dataKey="PHS"  name="Pumped Hydro" stroke={T.sage} fill={T.sage}  fillOpacity={0.15} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {tab==='Project Portfolio' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="Project Portfolio — All Storage Assets">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Project','Technology','Region','Primary Service','Power MW','Duration hr','Energy MWh','LCOS $/MWh','RTE %','Annual Rev $M','IRR %'].map(h=>(
                      <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b)=>b.irr-a.irr).map((p,i)=>(
                    <tr key={p.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.name}</td>
                      <td style={{ padding:'6px 10px' }}>{p.techName}</td>
                      <td style={{ padding:'6px 10px' }}>{p.region}</td>
                      <td style={{ padding:'6px 10px', fontSize:11, color:T.textSec }}>{p.service}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.powerMw}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.durHrs}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(p.energyMwh)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:p.lcos<100?T.green:p.lcos<200?T.amber:T.text }}>${fmt1(p.lcos)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{p.rte}%</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>${p.totalRevYr}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:600, color:p.irr>=10?T.green:T.text }}>{p.irr}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='LCOS Analysis' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="Avg LCOS by Technology ($/MWh)">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={techCompare} margin={{ top:5, right:20, left:0, bottom:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize:9, angle:-35, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/MWh" />
                    <Tooltip formatter={v=>[`$${fmt1(v)}/MWh`]} />
                    <Bar dataKey="avgLcos" name="Avg LCOS" fill={T.amber} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="LCOS Learning Curve 2025–2050 ($/kWh installed)">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lcosTrajectory} margin={{ top:10, right:20, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kWh" />
                    <Tooltip formatter={v=>[`$${v}/kWh`]} />
                    <Legend />
                    <Line dataKey="liNmc" name="Li-ion NMC" stroke='#3b82f6' strokeWidth={2} dot={false} />
                    <Line dataKey="lfp"   name="Li-ion LFP" stroke={T.navyL}  strokeWidth={2} dot={false} />
                    <Line dataKey="flow"  name="Vanadium Flow" stroke={T.teal} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                    <Line dataKey="phs"   name="Pumped Hydro"  stroke={T.sage} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {tab==='Revenue Stacking' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Avg Annual Revenue" value={`$${fmt1(filtered.reduce((s,p)=>s+p.totalRevYr,0)/(filtered.length||1))}M`} sub="Per project" color={T.green} />
              <KpiCard label="Highest Revenue Service" value="Frequency Reg." sub="~$18k/MW/yr (GB)" color={T.gold} />
            </div>
            <Card title="Avg Annual Revenue by Primary Service ($M/project)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueByService} margin={{ top:5, right:20, left:0, bottom:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="service" tick={{ fontSize:9, angle:-25, textAnchor:'end' }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="M" />
                  <Tooltip formatter={v=>[`$${fmt1(v)}M/yr`]} />
                  <Bar dataKey="avgRev" name="Avg Revenue $M/yr" fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Revenue Stacking Architecture — Value Layers">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { service:'Frequency Regulation', value:`$${fcRevenue}k/MW/yr`, notes:'FFR (UK), PFR (EU), AGC (US)', stack:'Top layer — fastest response', color:T.gold },
                  { service:'Capacity Market', value:'$30–80k/MW/yr', notes:'T-4 auction (UK), RPM (PJM)', stack:'Guaranteed revenue floor', color:T.navy },
                  { service:'Energy Arbitrage', value:`$${elecPx}/MWh spread`, notes:'Buy cheap, sell peak', stack:'Volume-dependent; variable', color:T.teal },
                  { service:'Peak Shaving', value:'$20–60k/MW/yr', notes:'Demand charge reduction (C&I)', stack:'Behind-the-meter value', color:T.sage },
                  { service:'Ancillary Services', value:'$5–25k/MW/yr', notes:'Reactive power, voltage support', stack:'Grid service payments', color:T.amber },
                  { service:'Black Start', value:'$8–15k/MW/yr', notes:'Grid restoration capability', stack:'Long-term contract based', color:T.navyL },
                ].map(s=>(
                  <div key={s.service} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}`, borderTop:`3px solid ${s.color}` }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginBottom:4 }}>{s.service}</div>
                    <div style={{ fontSize:12, color:T.green, fontWeight:600, marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>{s.notes}</div>
                    <div style={{ fontSize:10, fontFamily:T.mono, color:T.textMut }}>{s.stack}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Grid Integration' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Avg ELCC" value={`${fmt1(filtered.reduce((s,p)=>s+p.elcc,0)/(filtered.length||1))}%`} sub="Effective load carrying capacity" color={T.navy} />
              <KpiCard label="Portfolio Capacity Value" value={`${fmt0(filtered.reduce((s,p)=>s+p.powerMw*p.elcc/100,0))} MW`} sub="ELCC-adjusted" color={T.green} />
            </div>
            <Card title="ELCC Distribution — Capacity Value by Duration">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Duration (hrs)" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'Duration (hrs)', position:'insideBottom', offset:-5, fontSize:10 }} />
                  <YAxis dataKey="y" name="ELCC %" tick={{ fontSize:10 }} label={{ value:'ELCC %', angle:-90, position:'insideLeft', fontSize:10 }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v,n)=>[n==='x'?`${v} hrs`:`${v}%`, n==='x'?'Duration':'ELCC']} />
                  <Scatter data={filtered.map(p=>({ x:p.durHrs, y:p.elcc }))} fill={T.navy} opacity={0.55} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Investment Outlook' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Global Storage Capacity 2024" value="~230 GW" sub="Operational (BNEF)" color={T.navy} />
              <KpiCard label="IEA NZE Target 2030" value="1,500 GW" sub="6.5× current capacity" color={T.red} />
              <KpiCard label="Annual Investment Needed" value="$200B/yr" sub="To 2030 (IEA)" color={T.amber} />
              <KpiCard label="Li-ion Price 2024" value="~$100/kWh" sub="Cell-level, -90% since 2010" color={T.green} />
            </div>
            <Card title="Global Storage Capacity Outlook (GW) — 2025–2050">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={[2025,2030,2035,2040,2050].map((yr,i)=>({ year:yr.toString(), liion:[280,900,1800,3000,5500][i], longDuration:[10,80,300,700,2000][i], phs:[185,220,280,340,420][i] }))}
                  margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit=" GW" />
                  <Tooltip formatter={v=>[`${fmt0(v)} GW`]} />
                  <Legend />
                  <Area dataKey="phs"          name="Pumped Hydro" stroke={T.sage} fill={T.sage} fillOpacity={0.2} strokeWidth={2} />
                  <Area dataKey="longDuration" name="Long Duration" stroke={T.gold} fill={T.gold} fillOpacity={0.2} strokeWidth={2} />
                  <Area dataKey="liion"        name="Li-ion BESS"  stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <CleanTechAdvancedAnalytics T={T} moduleId="DF4" moduleName="Energy Storage Analytics" />
        </div>
      )}

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DF4 · Energy Storage Analytics · IEA BESS Outlook 2024 · BNEF · Lazard LCOS</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} projects · Arb ${elecPx}/MWh · FC ${fcRevenue}k/MW/yr</span>
      </div>
    </div>
  );
}
