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

// Vehicle segments
const SEGMENTS = ['Passenger Car','Light Commercial (LCV)','Heavy Goods (HGV)','Bus & Coach','2-Wheeler','Van'];
const POWERTRAIN = ['BEV','PHEV','ICE'];
const CHARGER_TYPES = ['Level 2 (7kW)','DC Fast (50kW)','Ultra-Rapid (150kW)','HPC (350kW)'];
const GEOS = ['UK','Germany','France','USA','China','Norway','Netherlands','India'];

// TCO parameters (£k, 5-year) by segment
const TCO_BASE = {
  'Passenger Car':         { icePrice:28, bevPrice:38, phevPrice:35, fuelICE:9.5, fuelBEV:3.0, maintICE:5.0, maintBEV:3.0, residICE:0.45, residBEV:0.38 },
  'Light Commercial (LCV)':{ icePrice:38, bevPrice:52, phevPrice:46, fuelICE:14.0,fuelBEV:4.5, maintICE:7.0, maintBEV:4.5, residICE:0.40, residBEV:0.35 },
  'Heavy Goods (HGV)':     { icePrice:120,bevPrice:200,phevPrice:160,fuelICE:90.0,fuelBEV:28.0,maintICE:40.0,maintBEV:25.0,residICE:0.35,residBEV:0.30 },
  'Bus & Coach':           { icePrice:250,bevPrice:380,phevPrice:310,fuelICE:60.0,fuelBEV:18.0,maintICE:50.0,maintBEV:30.0,residICE:0.30,residBEV:0.28 },
  '2-Wheeler':             { icePrice:5,  bevPrice:8,  phevPrice:6,  fuelICE:1.5, fuelBEV:0.5, maintICE:1.0, maintBEV:0.5, residICE:0.50, residBEV:0.45 },
  'Van':                   { icePrice:45, bevPrice:62, phevPrice:54, fuelICE:16.0,fuelBEV:5.0, maintICE:8.0, maintBEV:5.0, residICE:0.40, residBEV:0.33 },
};

// 50 fleet operators
const FLEETS = Array.from({ length: 50 }, (_, i) => {
  const seg     = SEGMENTS[Math.floor(sr(i*7)*SEGMENTS.length)];
  const geo     = GEOS[Math.floor(sr(i*11)*GEOS.length)];
  const fleetSz = Math.round(50 + sr(i*13)*4950);
  const evPct   = Math.round(5 + sr(i*17)*80);
  const base    = TCO_BASE[seg];
  const iceUnits = Math.round(fleetSz*(1-evPct/100));
  const bevUnits = fleetSz - iceUnits;

  // TCO 5-year (£k per vehicle)
  const tcoBEV = base.bevPrice + (base.fuelBEV*5) + (base.maintBEV*5) - (base.bevPrice*base.residBEV);
  const tcoICE = base.icePrice + (base.fuelICE*5) + (base.maintICE*5) - (base.icePrice*base.residICE);
  const tcoParity = tcoBEV <= tcoICE;

  // Stranded asset value (ICE fleet at risk)
  const strandedValue = iceUnits * base.icePrice * (1 - evPct/100) * 0.25; // £k
  const zevMandateGap = Math.max(0, 80 - evPct); // % gap to 2035 mandate
  const capexNeeded   = bevUnits * (base.bevPrice - base.icePrice); // £k incremental capex

  const chargerInfra  = Math.round(bevUnits / 4); // charger count (1:4 ratio)

  return { id:i+1, name:`Fleet-${String(i+1).padStart(3,'0')}`,
    seg, geo, fleetSz, evPct, iceUnits, bevUnits,
    tcoBEV:Math.round(tcoBEV*10)/10, tcoICE:Math.round(tcoICE*10)/10,
    tcoParity, strandedValue:Math.round(strandedValue),
    zevMandateGap, capexNeeded:Math.round(capexNeeded),
    chargerInfra };
});

// Battery cost learning curve data
const BATTERY_CURVE = [
  {year:'2010',cost:1100},{year:'2015',cost:580},{year:'2018',cost:280},{year:'2020',cost:137},
  {year:'2022',cost:151},{year:'2023',cost:139},{year:'2024',cost:106},{year:'2025',cost:95},
  {year:'2027',cost:75},{year:'2030',cost:55},{year:'2035',cost:40},
];

// OEM EV share data
const OEM_DATA = [
  {oem:'BYD',        evShare:100, sales2024:3.0,  target2030:100},
  {oem:'Tesla',      evShare:100, sales2024:1.8,  target2030:100},
  {oem:'VW Group',   evShare:22,  sales2024:9.2,  target2030:55},
  {oem:'GM',         evShare:8,   sales2024:6.0,  target2030:40},
  {oem:'Ford',       evShare:7,   sales2024:4.4,  target2030:40},
  {oem:'Stellantis', evShare:14,  sales2024:5.5,  target2030:50},
  {oem:'Toyota',     evShare:3,   sales2024:10.8, target2030:30},
  {oem:'Hyundai/Kia',evShare:18,  sales2024:7.3,  target2030:45},
  {oem:'BMW Group',  evShare:20,  sales2024:2.5,  target2030:50},
  {oem:'Mercedes',   evShare:15,  sales2024:2.0,  target2030:50},
];

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

const TABS = ['Overview','TCO Analysis','Fleet Transition','Charging Infrastructure','Battery Economics','OEM Landscape','Policy & Regulation','Advanced Analytics'];

export default function EVTransitionFinancePage() {
  const [tab, setTab]           = useState('Overview');
  const [filterSeg, setFilterSeg]   = useState('All');
  const [filterGeo, setFilterGeo]   = useState('All');
  const [energyPx, setEnergyPx]     = useState(0.28);  // £/kWh electricity
  const [fuelPx, setFuelPx]         = useState(1.65);   // £/L diesel
  const [battCost, setBattCost]     = useState(95);     // $/kWh current

  const filtered = useMemo(() => FLEETS.filter(f =>
    (filterSeg === 'All' || f.seg === filterSeg) &&
    (filterGeo === 'All' || f.geo === filterGeo)
  ), [filterSeg, filterGeo]);

  const totals = useMemo(() => {
    const n = filtered.length||1;
    return {
      n: filtered.length,
      totalFleet:   filtered.reduce((s,f)=>s+f.fleetSz,0),
      totalBEV:     filtered.reduce((s,f)=>s+f.bevUnits,0),
      avgEvPct:     filtered.reduce((s,f)=>s+f.evPct,0)/n,
      totalStranded:filtered.reduce((s,f)=>s+f.strandedValue,0),
      avgZevGap:    filtered.reduce((s,f)=>s+f.zevMandateGap,0)/n,
      totalCapexNeeded: filtered.reduce((s,f)=>s+f.capexNeeded,0),
      totalChargers: filtered.reduce((s,f)=>s+f.chargerInfra,0),
    };
  }, [filtered]);

  // TCO comparison by segment
  const tcoBySegment = useMemo(() => SEGMENTS.map(seg => {
    const b = TCO_BASE[seg];
    const elecAdj = energyPx / 0.28; // scale by electricity price vs base
    const fuelAdj = fuelPx   / 1.65;
    return {
      seg: seg.split(' ')[0],
      bev: Math.round((b.bevPrice + b.fuelBEV*5*elecAdj + b.maintBEV*5 - b.bevPrice*b.residBEV)*10)/10,
      ice: Math.round((b.icePrice + b.fuelICE*5*fuelAdj  + b.maintICE*5 - b.icePrice*b.residICE)*10)/10,
    };
  }), [energyPx, fuelPx]);

  // Charger economics
  const chargerEcon = useMemo(() => [
    { type:'Level 2 (7kW)', capex:8,    opex:0.5, sessions:5,   revPerSess:2.5,  utilPct:20 },
    { type:'DC Fast (50kW)',capex:35,   opex:3.5, sessions:15,  revPerSess:8.0,  utilPct:35 },
    { type:'Ultra-Rapid (150kW)',capex:80,opex:8.0,sessions:20, revPerSess:15.0, utilPct:40 },
    { type:'HPC (350kW)',   capex:150,  opex:14,  sessions:25,  revPerSess:25.0, utilPct:45 },
  ].map(c=>{
    const annRev  = c.sessions * 365 * c.revPerSess / 1000; // £k/yr
    const annOpex = c.opex; // £k/yr
    const payback = (c.capex / (annRev - annOpex)).toFixed(1);
    return { ...c, annRev, payback };
  }), []);

  const labelStyle = { fontSize:11, color:T.textSec, marginBottom:4, display:'block' };
  const selectStyle = { padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text };
  const sliderStyle = { width:'100%', accentColor:T.navy };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>EP-DF5 · EV Transition Finance</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#ffffff', marginBottom:4 }}>EV Transition Finance</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>50 fleets · TCO BEV vs ICE · ZEV mandate gap · Charging economics · Battery learning curve · OEM landscape</div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', alignItems:'flex-end' }}>
          <div><span style={labelStyle}>Segment</span>
            <select style={selectStyle} value={filterSeg} onChange={e=>setFilterSeg(e.target.value)}>
              <option>All</option>{SEGMENTS.map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><span style={labelStyle}>Geography</span>
            <select style={selectStyle} value={filterGeo} onChange={e=>setFilterGeo(e.target.value)}>
              <option>All</option>{GEOS.map(g=><option key={g}>{g}</option>)}
            </select></div>
          <div style={{ flex:1, minWidth:180 }}>
            <span style={labelStyle}>Electricity: £{energyPx.toFixed(2)}/kWh</span>
            <input type="range" min={0.10} max={0.60} step={0.02} value={energyPx} onChange={e=>setEnergyPx(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ minWidth:180 }}>
            <span style={labelStyle}>Diesel: £{fuelPx.toFixed(2)}/L</span>
            <input type="range" min={1.00} max={2.50} step={0.05} value={fuelPx} onChange={e=>setFuelPx(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ minWidth:160 }}>
            <span style={labelStyle}>Battery: ${battCost}/kWh</span>
            <input type="range" min={50} max={200} step={5} value={battCost} onChange={e=>setBattCost(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{totals.n} fleets</div>
        </div>

        <div style={{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===t?T.navy:T.border}`, background:tab===t?T.navy:T.surface, color:tab===t?'#fff':T.textSec, fontFamily:T.font, fontSize:12, fontWeight:tab===t?600:400, cursor:'pointer' }}>{t}</button>
          ))}
        </div>

        {tab==='Overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Vehicles" value={fmt0(totals.totalFleet)} sub="Portfolio fleets" color={T.navy} />
              <KpiCard label="BEV Units" value={fmt0(totals.totalBEV)} sub={`${fmt1(totals.avgEvPct)}% avg EV share`} color={T.green} />
              <KpiCard label="Avg ZEV Mandate Gap" value={`${fmt1(totals.avgZevGap)}%`} sub="To 2035 80% mandate" color={T.red} />
              <KpiCard label="ICE Stranded Value" value={`£${fmt0(totals.totalStranded)}k`} sub="At-risk fleet book value" color={T.amber} />
              <KpiCard label="Incremental BEV Capex" value={`£${fmt0(totals.totalCapexNeeded)}k`} sub="vs ICE equivalents" />
              <KpiCard label="Charger Requirements" value={fmt0(totals.totalChargers)} sub="1:4 vehicle:charger ratio" color={T.teal} />
            </div>

            <Card title="5-Year TCO Comparison — BEV vs ICE by Segment (£k per vehicle)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tcoBySegment} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="seg" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="k" />
                  <Tooltip formatter={v=>[`£${fmt1(v)}k`]} />
                  <Legend />
                  <Bar dataKey="bev" name="BEV 5yr TCO" fill={T.green}  radius={[4,4,0,0]} />
                  <Bar dataKey="ice" name="ICE 5yr TCO" fill={T.navy}   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Fleet Portfolio — EV Transition Status">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Fleet','Segment','Geography','Fleet Size','EV %','ICE Units','Stranded £k','ZEV Gap %','Capex Needed £k','TCO BEV','TCO ICE','Parity'].map(h=>(
                      <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...filtered].sort((a,b)=>b.zevMandateGap-a.zevMandateGap).slice(0,25).map((f,i)=>(
                    <tr key={f.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{f.name}</td>
                      <td style={{ padding:'6px 10px' }}>{f.seg}</td>
                      <td style={{ padding:'6px 10px' }}>{f.geo}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(f.fleetSz)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:f.evPct>=50?T.green:f.evPct>=20?T.amber:T.red }}>{f.evPct}%</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(f.iceUnits)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, color:f.strandedValue>100?T.red:T.text }}>{fmt0(f.strandedValue)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:600, color:f.zevMandateGap>40?T.red:f.zevMandateGap>20?T.amber:T.green }}>{f.zevMandateGap}%</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{fmt0(f.capexNeeded)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{f.tcoBEV}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{f.tcoICE}</td>
                      <td style={{ padding:'6px 10px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:f.tcoParity?'#dcfce7':'#fee2e2', color:f.tcoParity?T.green:T.red }}>{f.tcoParity?'At parity':'Premium'}</span>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='TCO Analysis' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <Card title="BEV vs ICE TCO Parity Year by Segment">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={SEGMENTS.map(seg=>({
                      seg: seg.split(' ')[0],
                      parityYr: 2024 + Math.round((battCost-80)/20),
                    }))}
                    margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="seg" tick={{ fontSize:10 }} />
                    <YAxis domain={[2020,2035]} tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip />
                    <Bar dataKey="parityYr" name="TCO Parity Year" fill={T.teal} radius={[4,4,0,0]} label={{ position:'top', fontSize:9 }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="TCO Sensitivity: Electricity vs Diesel Prices">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={tcoBySegment} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="seg" tick={{ fontSize:10 }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip formatter={(v,n)=>[`£${fmt1(v)}k`, n]} />
                    <Legend />
                    <Bar dataKey="bev" name="BEV TCO" fill={T.green}  radius={[4,4,0,0]} />
                    <Bar dataKey="ice" name="ICE TCO" fill={T.red}    radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {tab==='Fleet Transition' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Stranded Value" value={`£${fmt0(totals.totalStranded)}k`} sub="ICE fleet at mandate risk" color={T.red} />
              <KpiCard label="Avg ZEV Gap" value={`${fmt1(totals.avgZevGap)}%`} sub="vs 2035 80% mandate" color={T.amber} />
              <KpiCard label="Total Capex Needed" value={`£${fmt0(totals.totalCapexNeeded)}k`} sub="Incremental BEV premium" />
            </div>
            <Card title="ZEV Mandate Gap Distribution (% of fleets)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[0,10,20,30,40,50,60,70].map((lo,i,a)=>({
                    range:`${lo}–${a[i+1]||lo+10}%`,
                    count: filtered.filter(f=>f.zevMandateGap>=lo&&f.zevMandateGap<(a[i+1]||lo+10)).length,
                  }))}
                  margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="range" tick={{ fontSize:10, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Fleets" fill={T.red} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Charging Infrastructure' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Total Chargers Required" value={fmt0(totals.totalChargers)} sub="1:4 vehicle ratio" color={T.navy} />
              <KpiCard label="UK Public Chargers 2024" value="~65,000" sub="Target: 300k by 2030" color={T.amber} />
            </div>
            <Card title="Charging Infrastructure Economics by Type">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Charger Type','CAPEX £k','OPEX £k/yr','Daily Sessions','Rev/Session £','Annual Rev £k','Simple Payback yr'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{chargerEcon.map((c,i)=>(
                    <tr key={c.type} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{c.type}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{c.capex}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{c.opex}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{c.sessions}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>£{c.revPerSess}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:c.annRev>c.opex?T.green:T.red }}>£{fmt1(c.annRev)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:+c.payback<=10?T.green:+c.payback<=20?T.amber:T.red }}>{c.payback}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Battery Economics' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <KpiCard label="Current Battery Cost" value={`$${battCost}/kWh`} sub="Cell-level estimate" color={T.amber} />
              <KpiCard label="Target Cost (BNEF 2030)" value="$55/kWh" sub="Cell-level projection" color={T.green} />
              <KpiCard label="Cost Reduction vs 2010" value="-90%+" sub="$1,100 → $100/kWh" color={T.navy} />
              <KpiCard label="EV Sticker Parity" value="~$80/kWh" sub="Pack-level threshold" color={T.teal} />
            </div>
            <Card title="Battery Cell Cost Learning Curve ($/kWh, 2010–2035)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={BATTERY_CURVE} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="$/kWh" />
                  <Tooltip formatter={v=>[`$${v}/kWh`]} />
                  <Line dataKey="cost" name="Battery Cost $/kWh" stroke={T.navy} strokeWidth={2.5} dot={{ r:3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='OEM Landscape' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="OEM EV Share (2024) vs 2030 Target (% of global sales)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={OEM_DATA} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="oem" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit="%" />
                  <Tooltip formatter={v=>[`${v}%`]} />
                  <Legend />
                  <Bar dataKey="evShare"    name="EV Share 2024"   fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar dataKey="target2030" name="Target 2030"     fill={T.green} radius={[4,4,0,0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="OEM EV Portfolio Detail">
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:T.surfaceH }}>
                  {['OEM','EV Share 2024 %','Total Sales M','2030 Target %','Gap %','Rating'].map(h=>(
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{OEM_DATA.map((o,i)=>{
                  const gap = o.target2030 - o.evShare;
                  const rating = o.evShare>=50?'Leader':o.evShare>=20?'Transition':o.evShare>=10?'Lagging':'At Risk';
                  return (
                    <tr key={o.oem} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{o.oem}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:o.evShare>=50?T.green:o.evShare>=20?T.amber:T.red }}>{o.evShare}%</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{o.sales2024}</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{o.target2030}%</td>
                      <td style={{ padding:'8px 12px', fontFamily:T.mono, color:gap>30?T.red:gap>10?T.amber:T.green }}>{gap}%</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background:rating==='Leader'?'#dcfce7':rating==='Transition'?'#eff6ff':rating==='Lagging'?'#fef3c7':'#fee2e2', color:rating==='Leader'?T.green:rating==='Transition'?T.navyL:rating==='Lagging'?T.amber:T.red }}>{rating}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </Card>
          </div>
        )}

        {tab==='Policy & Regulation' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="ZEV Mandate & EV Policy Landscape">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {[
                  { region:'United Kingdom', policy:'Zero Emission Vehicle Mandate', detail:'22% new cars ZEV 2024; 80% by 2030; 100% by 2035. Tradeable credits system.', deadline:'2035' },
                  { region:'European Union', policy:'CO₂ Regulation — 100% ZEV by 2035', detail:'Phase-out of new ICE passenger cars by 2035. E-fuel exemption carve-out under Article 9.', deadline:'2035' },
                  { region:'United States', policy:'IRA EV Tax Credits + EPA Phase 3', detail:'$7,500 clean vehicle tax credit (30D). EPA sets 67% EV share target 2032 (new cars).', deadline:'2032' },
                  { region:'China', policy:'NEV Dual Credit Policy', detail:'Mandatory NEV credit ratio (18% 2023, rising). Battery subsidies via MIIT.', deadline:'Ongoing' },
                  { region:'Norway', policy:'100% ZEV new cars — achieved 2023', detail:'First market to hit 100% new EV share. VAT exemption + road pricing discounts.', deadline:'Achieved' },
                  { region:'Global (IEA NZE)', policy:'2-Wheel EV Mandate', detail:'100% EV new 2-wheelers by 2030 in advanced economies (IEA Net Zero Scenario).', deadline:'2030' },
                ].map(p=>(
                  <div key={p.region} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.borderL}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:T.navy }}>{p.region}</div>
                      <span style={{ fontFamily:T.mono, fontSize:11, color:T.gold }}>{p.deadline}</span>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4 }}>{p.policy}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>{p.detail}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <CleanTechAdvancedAnalytics T={T} moduleId="DF5" moduleName="EV Transition Finance" />
        </div>
      )}

      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>EP-DF5 · EV Transition Finance · BNEF EV Outlook 2024 · IEA EV Tracker · ZEV Mandate</span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>{totals.n} fleets · Elec £{energyPx.toFixed(2)}/kWh · Diesel £{fuelPx.toFixed(2)}/L</span>
      </div>
    </div>
  );
}
