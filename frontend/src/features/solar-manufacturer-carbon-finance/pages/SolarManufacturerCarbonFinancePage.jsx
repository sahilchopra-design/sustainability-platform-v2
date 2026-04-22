import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Apr2026CarbonAnalytics from '../../_shared/Apr2026CarbonAnalytics';
import IndiaAdvancedAnalytics from '../../_shared/IndiaAdvancedAnalytics';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const MANUFACTURERS = [
  { name:'Waaree Energies', hq:'Surat, GJ', cap2024Gw:13.3, cap2030Gw:30, techFocus:'TOPCon/HJT', listedBSE:true, exportPct:62, pliTranche:1, pliSanctionedCr:1512, scope1KgW:18, scope2KgW:32, scope3KgW:700, carbonPaybackYr:1.1, cbamExposureEurMw:4200, rec100:false, cctsSector:'Manufacturing', isoEnergy:true },
  { name:'Adani Solar', hq:'Mundra, GJ', cap2024Gw:4, cap2030Gw:20, techFocus:'Mono-PERC/TOPCon', listedBSE:true, exportPct:18, pliTranche:1, pliSanctionedCr:890, scope1KgW:22, scope2KgW:38, scope3KgW:720, carbonPaybackYr:1.2, cbamExposureEurMw:3800, rec100:true, cctsSector:'Manufacturing', isoEnergy:false },
  { name:'Vikram Solar', hq:'Kolkata, WB', cap2024Gw:3.5, cap2030Gw:10, techFocus:'PERC/Bifacial', listedBSE:false, exportPct:55, pliTranche:2, pliSanctionedCr:450, scope1KgW:16, scope2KgW:28, scope3KgW:680, carbonPaybackYr:1.0, cbamExposureEurMw:3600, rec100:true, cctsSector:'Manufacturing', isoEnergy:true },
  { name:'Tata Power Solar', hq:'Pune, MH', cap2024Gw:1.5, cap2030Gw:5, techFocus:'PERC/HJT', listedBSE:true, exportPct:8, pliTranche:1, pliSanctionedCr:320, scope1KgW:20, scope2KgW:35, scope3KgW:710, carbonPaybackYr:1.15, cbamExposureEurMw:2900, rec100:true, cctsSector:'Manufacturing', isoEnergy:true },
  { name:'Saatvik Solar', hq:'Noida, UP', cap2024Gw:1.2, cap2030Gw:4, techFocus:'Mono-PERC', listedBSE:false, exportPct:42, pliTranche:2, pliSanctionedCr:180, scope1KgW:24, scope2KgW:42, scope3KgW:740, carbonPaybackYr:1.3, cbamExposureEurMw:3100, rec100:false, cctsSector:'Manufacturing', isoEnergy:false },
  { name:'RenewSys India', hq:'Mumbai, MH', cap2024Gw:0.8, cap2030Gw:3, techFocus:'PERC', listedBSE:false, exportPct:30, pliTranche:2, pliSanctionedCr:110, scope1KgW:19, scope2KgW:33, scope3KgW:690, carbonPaybackYr:1.05, cbamExposureEurMw:2500, rec100:false, cctsSector:'Manufacturing', isoEnergy:false },
];

const CARBON_INTENSITY_BENCHMARK = [
  { region:'India (coal grid)', gCO2eqPerW:750, year:2024 },
  { region:'India (RE grid mix)', gCO2eqPerW:480, year:2030 },
  { region:'China avg', gCO2eqPerW:510, year:2024 },
  { region:'EU avg', gCO2eqPerW:280, year:2024 },
  { region:'Malaysia', gCO2eqPerW:420, year:2024 },
  { region:'Vietnam', gCO2eqPerW:560, year:2024 },
  { region:'IEA Net Zero Target', gCO2eqPerW:120, year:2050 },
];

const CBAM_TIMELINE = [
  { year:2023, phase:'Transitional Reporting', cbamPct:0, freeAlloc:100 },
  { year:2024, phase:'Transitional Reporting', cbamPct:0, freeAlloc:100 },
  { year:2025, phase:'Transitional Reporting', cbamPct:0, freeAlloc:100 },
  { year:2026, phase:'Phase-in Begin', cbamPct:25, freeAlloc:93 },
  { year:2027, phase:'Phase-in', cbamPct:50, freeAlloc:81 },
  { year:2028, phase:'Phase-in', cbamPct:75, freeAlloc:69 },
  { year:2029, phase:'Phase-in', cbamPct:90, freeAlloc:50 },
  { year:2030, phase:'Full CBAM', cbamPct:100, freeAlloc:25 },
  { year:2034, phase:'Full CBAM + Full Phase-out', cbamPct:100, freeAlloc:0 },
];

const PLI_TRANCHES = [
  { tranche:1, focus:'High Efficiency (≥20% mono)', incentiveRsW:1.5, durationYr:5, totalCapGw:10, capexSupportPct:20 },
  { tranche:2, focus:'Integrated (wafer+cell+module)', incentiveRsW:2.0, durationYr:5, totalCapGw:10, capexSupportPct:25 },
  { tranche:'Additional', focus:'TOPCon/HJT (≥22.5%)', incentiveRsW:2.5, durationYr:5, totalCapGw:6, capexSupportPct:30 },
];

const SCOPE_BREAKDOWN = [
  { category:'Scope 1 — Factory direct', kgCO2eqPerKw:20, pct:2.6 },
  { category:'Scope 2 — Grid electricity', kgCO2eqPerKw:35, pct:4.5 },
  { category:'Scope 3 — Polysilicon/Wafer', kgCO2eqPerKw:410, pct:53.2 },
  { category:'Scope 3 — Cell processing', kgCO2eqPerKw:180, pct:23.4 },
  { category:'Scope 3 — Module assembly', kgCO2eqPerKw:55, pct:7.1 },
  { category:'Scope 3 — Logistics', kgCO2eqPerKw:71, pct:9.2 },
];

const GRID_EF_ROADMAP = [
  { year:2024, ef:0.82, re_pct:23 },
  { year:2025, ef:0.76, re_pct:28 },
  { year:2026, ef:0.70, re_pct:33 },
  { year:2027, ef:0.64, re_pct:39 },
  { year:2028, ef:0.58, re_pct:45 },
  { year:2029, ef:0.53, re_pct:51 },
  { year:2030, ef:0.47, re_pct:58 },
];

const CCTS_SECTORS = [
  { sector:'Aluminium', baseline:2.7, unit:'tCO₂/t', ccertEligible:true },
  { sector:'Iron & Steel', baseline:1.8, unit:'tCO₂/t', ccertEligible:true },
  { sector:'Cement', baseline:0.65, unit:'tCO₂/t', ccertEligible:true },
  { sector:'Chlor-Alkali', baseline:3.2, unit:'tCO₂/t Cl₂', ccertEligible:true },
  { sector:'Petrochemical', baseline:1.4, unit:'tCO₂/t', ccertEligible:true },
  { sector:'Paper', baseline:0.9, unit:'tCO₂/t', ccertEligible:true },
  { sector:'Solar Manufacturing', baseline:0.75, unit:'kgCO₂/W (Scope1+2)', ccertEligible:false, note:'PAT only — offset credits not yet eligible' },
  { sector:'Data Centres', baseline:0.3, unit:'tCO₂/MWh', ccertEligible:false, note:'Under consultation' },
];

const EXPORT_MARKETS = [
  { market:'USA', tariff2024Pct:14.5, cbamRisk:'None', pricePremiuumUsdW:0.02, antidumpingRisk:'Medium' },
  { market:'EU', tariff2024Pct:0, cbamRisk:'High (2026+)', pricePremiuumUsdW:0.04, antidumpingRisk:'Low' },
  { market:'UK', tariff2024Pct:0, cbamRisk:'Developing', pricePremiuumUsdW:0.03, antidumpingRisk:'Low' },
  { market:'Japan', tariff2024Pct:0, cbamRisk:'None', pricePremiuumUsdW:0.05, antidumpingRisk:'Low' },
  { market:'Australia', tariff2024Pct:0, cbamRisk:'None', pricePremiuumUsdW:0.02, antidumpingRisk:'Low' },
  { market:'Middle East', tariff2024Pct:5, cbamRisk:'None', pricePremiuumUsdW:0.01, antidumpingRisk:'Low' },
];

const EPD_STANDARDS = [
  { standard:'ISO 14025', scope:'LCA environmental declaration', mandatory:'Voluntary', region:'Global', carbonLabel:true },
  { standard:'EN 15804+A2', scope:'Construction products EPD', mandatory:'EU (2024+)', region:'EU', carbonLabel:true },
  { standard:'IEC 63274', scope:'PV module LCA', mandatory:'Voluntary', region:'Global', carbonLabel:true },
  { standard:'PAS 2060', scope:'Carbon neutrality claim', mandatory:'Voluntary', region:'UK/Global', carbonLabel:true },
  { standard:'BIS IS 14286', scope:'India PV module standard', mandatory:'Mandatory India', region:'India', carbonLabel:false },
];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', minWidth:160 }}>
    <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
    <div style={{ color:color||T.gold, fontSize:24, fontWeight:700, fontFamily:T.mono, margin:'6px 0 2px' }}>{value}</div>
    {sub && <div style={{ color:T.textSec, fontSize:11 }}>{sub}</div>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 16px', background:active?T.navy:'transparent', color:active?T.gold:T.textSec, border:`1px solid ${active?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12, whiteSpace:'nowrap' }}>{label}</button>
);

const SectionTitle = ({ children }) => (
  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginBottom:16 }}>{children}</div>
);

const calcCbamCost = ({ carbonIntensityKgW, euEtsPrice, mwExport, cbamPct }) => {
  const tco2PerMw = carbonIntensityKgW * 1000 / 1000;
  const gross = tco2PerMw * euEtsPrice * mwExport * (cbamPct/100);
  return { tco2PerMw, gross };
};

const calcPliIncentive = ({ capGwAnnual, incentiveRsW, tenure }) => {
  const incentiveCr = capGwAnnual * 1e6 * incentiveRsW / 1e7;
  const total = incentiveCr * tenure;
  return { incentiveCr, total };
};

const calcCarbonPayback = ({ systemKwp, gridEf, annGenMwh, moduleCI }) => {
  const systemTco2Embed = systemKwp * moduleCI / 1e6;
  const annDisplacedTco2 = annGenMwh * gridEf;
  return annDisplacedTco2 > 0 ? (systemTco2Embed / annDisplacedTco2).toFixed(2) : 'N/A';
};

export default function SolarManufacturerCarbonFinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selMfr, setSelMfr] = useState(0);
  const [cbamYear, setCbamYear] = useState(2028);
  const [euEtsPrice, setEuEtsPrice] = useState(68);
  const [exportMw, setExportMw] = useState(500);
  const [pliTrancheIdx, setPliTrancheIdx] = useState(0);
  const [annCapGw, setAnnCapGw] = useState(1);
  const [gridEfScenario, setGridEfScenario] = useState('current');

  const mfr = MANUFACTURERS[selMfr];
  const cbamRow = CBAM_TIMELINE.find(r => r.year === cbamYear) || CBAM_TIMELINE[4];
  const cbamCalc = useMemo(() => calcCbamCost({ carbonIntensityKgW: mfr.scope1KgW + mfr.scope2KgW, euEtsPrice, mwExport: exportMw, cbamPct: cbamRow.cbamPct }), [mfr, euEtsPrice, exportMw, cbamRow]);
  const pliRow = PLI_TRANCHES[pliTrancheIdx];
  const pliCalc = useMemo(() => calcPliIncentive({ capGwAnnual: annCapGw, incentiveRsW: pliRow.incentiveRsW, tenure: pliRow.durationYr }), [annCapGw, pliRow]);
  const gridEfNow = gridEfScenario === 'current' ? 0.82 : 0.47;
  const payback = calcCarbonPayback({ systemKwp: 1, gridEf: gridEfNow, annGenMwh: 1.6, moduleCI: (mfr.scope1KgW + mfr.scope2KgW + mfr.scope3KgW) });

  const tabs = ['Overview','Manufacturer Dashboard','CBAM Exposure','PLI Carbon Nexus','Carbon Intensity','Scope 1-2-3 Breakdown','EPD & Standards','CCTS Compliance','Export Markets','Carbon Payback','Advanced Analytics'];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      {/* Header */}
      <div style={{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, letterSpacing:2, textTransform:'uppercase' }}>EP-EA3 · India Solar Carbon Finance</div>
            <h1 style={{ margin:'4px 0 8px', fontSize:28, fontWeight:700, color:T.text }}>Solar Panel Manufacturer Carbon Finance</h1>
            <div style={{ color:T.textSec, fontSize:13 }}>PLI scheme · EU CBAM exposure · Scope 1-2-3 benchmarking · EPD standards · CCTS compliance</div>
          </div>
          <div style={{ textAlign:'right', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
            <div>India PV Capacity 2024</div>
            <div style={{ color:T.gold, fontSize:20, fontWeight:700 }}>24.1 GW</div>
            <div>PLI Tranche I+II Approved</div>
            <div style={{ color:T.amber, fontSize:16, fontWeight:700 }}>₹24,000 Cr</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <Kpi label="India Carbon Intensity" value="750 gCO₂/W" sub="vs China 510g · EU 280g" color={T.amber} />
        <Kpi label="CBAM Full Phase-in" value="2030" sub="100% EUA cost on embedded carbon" color={T.red} />
        <Kpi label="PLI Incentive" value="₹1.5–2.5/W" sub="Tranche I–II + TOPCon premium" color={T.green} />
        <Kpi label="Carbon Payback (India grid)" value="1.0–1.3 yr" sub="vs fossil: 25–30 yr payback avoided" color={T.teal} />
        <Kpi label="India Mfg Capacity 2030E" value="100 GW" sub="PLI target incl. integrated cells+modules" color={T.gold} />
        <Kpi label="Scope 3 Share" value="~93%" sub="Polysilicon/wafer/cell dominate LCA" color={T.textSec} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {tabs.map((t,i) => <Tab key={i} label={t} active={activeTab===i} onClick={()=>setActiveTab(i)} />)}
      </div>

      {/* Tab 0: Overview */}
      {activeTab===0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>India Solar Manufacturing Landscape 2024</SectionTitle>
            <div style={{ color:T.textSec, fontSize:13, lineHeight:1.8 }}>
              India has emerged as the world's third-largest solar manufacturing hub, with <span style={{ color:T.gold }}>~24.1 GW</span> of module capacity in FY2024, targeting <span style={{ color:T.gold }}>100+ GW</span> by 2030 under PLI Scheme 2.0. Six major domestic manufacturers — Waaree, Adani Solar, Vikram, Tata Power Solar, Saatvik, and RenewSys — collectively represent 24 GW of existing capacity, with expansion plans underpinned by ₹24,000 Cr of sanctioned PLI incentives.
              <br/><br/>
              <span style={{ color:T.amber }}>Carbon Finance Dual Pressure:</span> Indian manufacturers face simultaneous pressure from the EU's Carbon Border Adjustment Mechanism (CBAM) — which will apply to embedded carbon in modules exported to the EU from 2026 — and domestic CCTS compliance requirements under the Energy Conservation Amendment Act 2022. While solar modules are not yet in the CCTS "obligated" list, PAT (Perform Achieve Trade) cycles cover large manufacturing facilities, with CCert trading expected to cover solar manufacturing by 2027.
              <br/><br/>
              <span style={{ color:T.teal }}>PLI-Carbon Nexus:</span> PLI Tranche 1 incentivises high-efficiency modules (≥20%) at ₹1.5/W, with Tranche 2 supporting integrated manufacturing at ₹2.0/W. TOPCon/HJT technologies qualify for additional ₹2.5/W incentives — precisely the technologies with lower Scope 1+2 intensity, creating a natural alignment between PLI incentives and carbon reduction.
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Intensity Benchmark (2024)</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CARBON_INTENSITY_BENCHMARK} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fill:T.textSec, fontSize:11 }} label={{ value:'gCO₂eq/W', position:'insideBottomRight', fill:T.textMut, fontSize:10 }} />
                <YAxis type="category" dataKey="region" tick={{ fill:T.textSec, fontSize:10 }} width={130} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Bar dataKey="gCO2eqPerW" fill={T.amber} radius={[0,3,3,0]} name="gCO₂eq/W" />
                <ReferenceLine x={120} stroke={T.green} strokeDasharray="4 2" label={{ value:'IEA NZ 2050', fill:T.green, fontSize:10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, gridColumn:'1/-1' }}>
            <SectionTitle>Key Carbon Finance Mechanisms for India Solar Manufacturers</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { title:'EU CBAM', color:T.red, desc:'Embedded carbon tariff on EU exports from 2026. Full cost pass-through by 2034. EUA-price-linked. Scope 1+2 only initially, Scope 3 under review.' },
                { title:'India PAT Cycle', color:T.amber, desc:'Energy intensity targets for large manufacturers (>1 GW). ESCerts traded on IEX. PAT Cycle VI covers FY2024-26. Manufacturing ≥10 MW capex obligated.' },
                { title:'PLI Scheme', color:T.green, desc:'₹1.5-2.5/W production incentive for 5yr tenure. Efficiency threshold creates implicit carbon incentive. ₹24,000 Cr total committed.' },
                { title:'EPD / LCA', color:T.teal, desc:'ISO 14025 / IEC 63274 environmental declarations increasingly required by EU buyers. Carbon payback period <2yr is key procurement criterion for RE100 corporates.' },
              ].map((m,i) => (
                <div key={i} style={{ background:T.surfaceH, border:`1px solid ${m.color}22`, borderRadius:6, padding:14 }}>
                  <div style={{ color:m.color, fontWeight:700, fontFamily:T.mono, fontSize:13, marginBottom:6 }}>{m.title}</div>
                  <div style={{ color:T.textSec, fontSize:12, lineHeight:1.6 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Manufacturer Dashboard */}
      {activeTab===1 && (
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {MANUFACTURERS.map((m,i) => <button key={i} onClick={()=>setSelMfr(i)} style={{ padding:'6px 14px', background:selMfr===i?T.navy:'transparent', color:selMfr===i?T.gold:T.textSec, border:`1px solid ${selMfr===i?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12 }}>{m.name}</button>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
            <Kpi label="Current Capacity" value={`${mfr.cap2024Gw} GW`} sub={`2030 target: ${mfr.cap2030Gw} GW`} color={T.gold} />
            <Kpi label="Export Share" value={`${mfr.exportPct}%`} sub={`PLI Tranche ${mfr.pliTranche}`} color={T.teal} />
            <Kpi label="PLI Sanctioned" value={`₹${mfr.pliSanctionedCr} Cr`} sub={mfr.isoEnergy ? 'ISO 50001 certified' : 'Energy cert pending'} color={T.green} />
            <Kpi label="Scope 1+2" value={`${mfr.scope1KgW + mfr.scope2KgW} kg/kW`} sub={`Scope 3: ${mfr.scope3KgW} kg/kW`} color={T.amber} />
            <Kpi label="Carbon Payback" value={`${mfr.carbonPaybackYr} yr`} sub="India grid 0.82 tCO₂/MWh" color={T.teal} />
            <Kpi label="RE100 Committed" value={mfr.rec100?'Yes':'No'} sub="Renewable electricity procurement" color={mfr.rec100?T.green:T.red} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <SectionTitle>Manufacturer Capacity Roadmap</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MANUFACTURERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                  <Legend />
                  <Bar dataKey="cap2024Gw" fill={T.navy} name="2024 GW" />
                  <Bar dataKey="cap2030Gw" fill={T.gold} name="2030 Target GW" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <SectionTitle>Carbon Intensity Comparison (Scope 1+2, kg/kW)</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MANUFACTURERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v,n)=>[`${v} kg/kW`,n]} />
                  <Bar dataKey="scope1KgW" fill={T.red} name="Scope 1" stackId="a" />
                  <Bar dataKey="scope2KgW" fill={T.amber} name="Scope 2" stackId="a" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CBAM Exposure */}
      {activeTab===2 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>CBAM Calculator</SectionTitle>
            <div style={{ display:'grid', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Manufacturer</label>
                <select value={selMfr} onChange={e=>setSelMfr(+e.target.value)} style={{ width:'100%', background:T.surfaceH, color:T.text, border:`1px solid ${T.border}`, borderRadius:4, padding:'6px 10px', fontFamily:T.mono, fontSize:12 }}>
                  {MANUFACTURERS.map((m,i) => <option key={i} value={i}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>EU Export Volume (MW/yr): {exportMw} MW</label>
                <input type="range" min={50} max={2000} step={50} value={exportMw} onChange={e=>setExportMw(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>EU ETS Price (€/tCO₂): €{euEtsPrice}</label>
                <input type="range" min={40} max={150} step={5} value={euEtsPrice} onChange={e=>setEuEtsPrice(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>CBAM Phase Year: {cbamYear}</label>
                <input type="range" min={2026} max={2034} step={1} value={cbamYear} onChange={e=>setCbamYear(+e.target.value)} style={{ width:'100%' }} />
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, marginBottom:8 }}>CBAM COST ESTIMATE — {mfr.name}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><span style={{ color:T.textSec, fontSize:12 }}>Scope 1+2 Intensity: </span><span style={{ color:T.gold, fontFamily:T.mono }}>{mfr.scope1KgW + mfr.scope2KgW} kg/kW</span></div>
                <div><span style={{ color:T.textSec, fontSize:12 }}>tCO₂ per MW: </span><span style={{ color:T.gold, fontFamily:T.mono }}>{cbamCalc.tco2PerMw.toFixed(1)} t</span></div>
                <div><span style={{ color:T.textSec, fontSize:12 }}>CBAM Phase-in: </span><span style={{ color:T.amber, fontFamily:T.mono }}>{cbamRow.cbamPct}%</span></div>
                <div><span style={{ color:T.textSec, fontSize:12 }}>Gross CBAM Cost: </span><span style={{ color:T.red, fontFamily:T.mono, fontSize:18, fontWeight:700 }}>€{(cbamCalc.gross/1e6).toFixed(2)}M</span></div>
              </div>
              <div style={{ marginTop:10, padding:10, background:`${T.red}11`, border:`1px solid ${T.red}33`, borderRadius:4, color:T.textSec, fontSize:12 }}>
                Full CBAM (2030): <span style={{ color:T.red, fontWeight:700 }}>€{((mfr.scope1KgW + mfr.scope2KgW)*exportMw*euEtsPrice/1e6).toFixed(2)}M/yr</span> exposure. Reducing Scope 2 via RE100 procurement is highest-ROI mitigation.
              </div>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>CBAM Phase-in Timeline</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={CBAM_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Legend />
                <Line type="monotone" dataKey="cbamPct" stroke={T.red} strokeWidth={2} name="CBAM Coverage %" dot={{ r:3 }} />
                <Line type="monotone" dataKey="freeAlloc" stroke={T.green} strokeWidth={2} name="Free Allocation %" dot={{ r:3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop:16 }}>
              <SectionTitle>Manufacturer CBAM Exposure (2030, 500 MW export)</SectionTitle>
              <div style={{ display:'grid', gap:6 }}>
                {MANUFACTURERS.map((m,i) => {
                  const exp = m.cbamExposureEurMw * 500 / 1e6;
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:T.surfaceH, borderRadius:4 }}>
                      <span style={{ color:T.textSec, fontSize:12 }}>{m.name}</span>
                      <span style={{ color:T.red, fontFamily:T.mono, fontSize:12 }}>€{exp.toFixed(1)}M</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: PLI Carbon Nexus */}
      {activeTab===3 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>PLI Tranche Structure</SectionTitle>
            <div style={{ display:'grid', gap:10, marginBottom:16 }}>
              {PLI_TRANCHES.map((p,i) => (
                <div key={i} onClick={()=>setPliTrancheIdx(i)} style={{ padding:14, background:pliTrancheIdx===i?T.navy:T.surfaceH, border:`1px solid ${pliTrancheIdx===i?T.gold:T.border}`, borderRadius:6, cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ color:T.gold, fontFamily:T.mono, fontSize:13, fontWeight:700 }}>Tranche {p.tranche}</span>
                    <span style={{ color:T.green, fontFamily:T.mono, fontSize:13 }}>₹{p.incentiveRsW}/W</span>
                  </div>
                  <div style={{ color:T.textSec, fontSize:12 }}>{p.focus}</div>
                  <div style={{ color:T.textMut, fontSize:11, marginTop:4 }}>{p.totalCapGw} GW target · {p.durationYr}yr tenure · {p.capexSupportPct}% capex support</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>PLI Incentive Calculator</SectionTitle>
            <div style={{ display:'grid', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Annual Capacity Addition (GW): {annCapGw} GW</label>
                <input type="range" min={0.1} max={5} step={0.1} value={annCapGw} onChange={e=>setAnnCapGw(+e.target.value)} style={{ width:'100%' }} />
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ display:'grid', gap:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.textSec, fontSize:12 }}>Annual Incentive</span>
                  <span style={{ color:T.green, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>₹{pliCalc.incentiveCr.toFixed(0)} Cr</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.textSec, fontSize:12 }}>Tenure Total ({pliRow.durationYr}yr)</span>
                  <span style={{ color:T.gold, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>₹{pliCalc.total.toFixed(0)} Cr</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.textSec, fontSize:12 }}>PLI-to-CBAM Hedge Ratio</span>
                  <span style={{ color:T.teal, fontFamily:T.mono }}>{((pliCalc.incentiveCr*11.5) / (exportMw*mfr.cbamExposureEurMw/1e6*1e7)).toFixed(1)}×</span>
                </div>
              </div>
              <div style={{ marginTop:10, color:T.textSec, fontSize:12, lineHeight:1.6 }}>
                PLI incentive at {pliRow.incentiveRsW} Rs/W offsets {(((pliCalc.incentiveCr*11.5e5) / (exportMw*(mfr.scope1KgW+mfr.scope2KgW)*euEtsPrice))*100).toFixed(0)}% of CBAM cost at current EUA price — demonstrating the government's implicit carbon finance through industrial policy.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Carbon Intensity */}
      {activeTab===4 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Grid EF Impact on Module Carbon Intensity</SectionTitle>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {['current','2030'].map(s => <button key={s} onClick={()=>setGridEfScenario(s)} style={{ padding:'5px 12px', background:gridEfScenario===s?T.navy:'transparent', color:gridEfScenario===s?T.gold:T.textSec, border:`1px solid ${gridEfScenario===s?T.gold:T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.mono, fontSize:11 }}>{s==='current'?'Current 2024':'2030 RE Grid'}</button>)}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={GRID_EF_ROADMAP}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis yAxisId="left" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="ef" stroke={T.amber} strokeWidth={2} name="Grid EF (tCO₂/MWh)" dot={{ r:3 }} />
                <Line yAxisId="right" type="monotone" dataKey="re_pct" stroke={T.green} strokeWidth={2} name="RE Share %" dot={{ r:3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>All-in Carbon Intensity (Scope 1+2+3, kg/kW)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MANUFACTURERS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v,n)=>[`${v} kg/kW`,n]} />
                <Bar dataKey="scope1KgW" fill={T.red} name="Scope 1" stackId="a" />
                <Bar dataKey="scope2KgW" fill={T.amber} name="Scope 2" stackId="a" />
                <Bar dataKey="scope3KgW" fill={T.teal} name="Scope 3" stackId="a" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Scope 1-2-3 Breakdown */}
      {activeTab===5 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Scope 1-2-3 Breakdown (Industry Average)</SectionTitle>
            <div style={{ display:'grid', gap:8 }}>
              {SCOPE_BREAKDOWN.map((s,i) => (
                <div key={i} style={{ padding:10, background:T.surfaceH, borderRadius:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ color:T.text, fontSize:12 }}>{s.category}</span>
                    <span style={{ color:T.gold, fontFamily:T.mono, fontSize:12 }}>{s.kgCO2eqPerKw} kg/kW</span>
                  </div>
                  <div style={{ height:4, background:T.border, borderRadius:2 }}>
                    <div style={{ height:4, width:`${s.pct}%`, background:i<2?T.amber:T.teal, borderRadius:2 }} />
                  </div>
                  <div style={{ color:T.textMut, fontSize:10, marginTop:2 }}>{s.pct}% of total LCA</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Key Reduction Levers</SectionTitle>
            {[
              { lever:'RE100 Electricity Procurement', scope:'Scope 2', reduction:'30–45 kg/kW', cost:'₹0.5–1.0/W premium', roi:'High' },
              { lever:'Domestic Polysilicon Sourcing', scope:'Scope 3', reduction:'80–120 kg/kW', cost:'Supply chain dev', roi:'Medium' },
              { lever:'TOPCon/HJT Efficiency Gain', scope:'Scope 3', reduction:'50–80 kg/kW/unit', cost:'₹0.8/W capex', roi:'High (PLI supported)' },
              { lever:'ISO 50001 Energy Mgmt', scope:'Scope 1+2', reduction:'10–20 kg/kW', cost:'₹15–25 Cr', roi:'Medium' },
              { lever:'JCM Green Procurement (Japan cells)', scope:'Scope 3', reduction:'60–90 kg/kW', cost:'JCM corridor setup', roi:'Low–Medium' },
            ].map((l,i) => (
              <div key={i} style={{ padding:10, background:T.surfaceH, borderRadius:6, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.text, fontSize:12, fontWeight:600 }}>{l.lever}</span>
                  <span style={{ color:l.roi==='High'?T.green:l.roi==='Medium'?T.amber:T.textSec, fontFamily:T.mono, fontSize:11 }}>{l.roi}</span>
                </div>
                <div style={{ color:T.textSec, fontSize:11, marginTop:4 }}>{l.scope} · Saves {l.reduction} · Cost: {l.cost}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: EPD & Standards */}
      {activeTab===6 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Environmental Product Declaration (EPD) Standards for Solar PV</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Standard','Scope','Mandatory?','Region','Carbon Label'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {EPD_STANDARDS.map((e,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.gold, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.standard}</td>
                  <td style={{ padding:'8px 12px', color:T.text, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.scope}</td>
                  <td style={{ padding:'8px 12px', color:e.mandatory.includes('Mandatory')?T.red:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.mandatory}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.region}</td>
                  <td style={{ padding:'8px 12px', color:e.carbonLabel?T.green:T.textMut, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.carbonLabel?'Yes':'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>Carbon Payback Period by Technology</div>
              {[
                { tech:'Mono-PERC (India grid)', payback:1.3 },
                { tech:'TOPCon (India grid)', payback:1.1 },
                { tech:'HJT (India grid)', payback:1.0 },
                { tech:'Mono-PERC (India 2030 RE grid)', payback:0.8 },
                { tech:'Mono-PERC (EU grid)', payback:0.7 },
              ].map((t,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.textSec, fontSize:12 }}>{t.tech}</span>
                  <span style={{ color:T.green, fontFamily:T.mono, fontSize:12 }}>{t.payback} yr</span>
                </div>
              ))}
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>RE100 Supply Chain Implications</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
                RE100 corporate buyers (Apple, Amazon, Google) increasingly mandate <span style={{ color:T.gold }}>EPD carbon scores &lt;350 gCO₂eq/W</span> for module procurement. Indian manufacturers currently range 480–750g, requiring either:<br/><br/>
                1. <span style={{ color:T.green }}>RE100 self-generation</span> (rooftop + captive wind)<br/>
                2. <span style={{ color:T.teal }}>REC procurement</span> (Solar REC ₹3.5–6/kWh on IEX)<br/>
                3. <span style={{ color:T.amber }}>Green tariff agreements</span> with DISCOMs under ISTS waiver policy
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: CCTS Compliance */}
      {activeTab===7 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>India CCTS Sector Coverage & Manufacturing Compliance</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Sector','Baseline Intensity','Unit','CCert Eligible','Note'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {CCTS_SECTORS.map((s,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:i===6?T.amber:T.text, fontSize:12, fontWeight:i===6?700:400, borderBottom:`1px solid ${T.borderL}` }}>{s.sector}</td>
                  <td style={{ padding:'8px 12px', color:T.gold, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{s.baseline}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{s.unit}</td>
                  <td style={{ padding:'8px 12px', color:s.ccertEligible?T.green:T.red, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{s.ccertEligible?'Yes':'No'}</td>
                  <td style={{ padding:'8px 12px', color:T.textMut, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{s.note||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.amber, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>PAT Cycle VI (FY2024-26)</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.7 }}>Large solar manufacturers (plant energy consumption &gt;5,000 tOE/yr) are designated consumers under PAT Cycle VI. ESCert trading on IEX covers overcompliance. PAT baseline: 0.75 kgCO₂/W Scope 1+2.</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.teal, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>CCTS Offset Integration (2027E)</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.7 }}>BEE consultation underway to include solar and electronics manufacturing in CCTS obligated list from FY2027. CCert issuance expected at 1 CCert = 1 tCO₂ intensity reduction vs baseline. Scope 1 only initially.</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.green, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>REC / ESCert Arbitrage</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.7 }}>Manufacturers can reduce Scope 2 via Solar RECs (₹3.5–6/kWh) traded on IEX. ESCerts and RECs cannot be double-counted toward both PAT and CCTS compliance — BEE issued clarification circular in Q3 2024.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Export Markets */}
      {activeTab===8 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Export Market Carbon Risk Matrix</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Market','Import Tariff','CBAM Risk','Green Premium ($/W)','Anti-Dumping Risk'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {EXPORT_MARKETS.map((m,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.text, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{m.market}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.tariff2024Pct}%</td>
                  <td style={{ padding:'8px 12px', color:m.cbamRisk==='High (2026+)'?T.red:m.cbamRisk.includes('Developing')?T.amber:T.green, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.cbamRisk}</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>+${m.pricePremiuumUsdW}/W</td>
                  <td style={{ padding:'8px 12px', color:m.antidumpingRisk==='Medium'?T.amber:T.green, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.antidumpingRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
            <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>Strategic Carbon Finance Positioning for Export</div>
            <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
              Japan offers the highest green premium (+$0.05/W) and zero tariff/CBAM risk, making it the optimal carbon-premium market for Indian manufacturers with JCM-certified supply chains. EU is the highest-risk market due to CBAM but also the largest volume opportunity — manufacturers with &lt;300 gCO₂eq/W (achievable by 2028 with RE100 + TOPCon) can command EPD-certified premiums that offset CBAM costs. USA carries anti-dumping risk but no CBAM — suitable for lower-efficiency bulk volume.
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Carbon Payback */}
      {activeTab===9 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Payback Calculator</SectionTitle>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['current','2030'].map(s => <button key={s} onClick={()=>setGridEfScenario(s)} style={{ padding:'6px 14px', background:gridEfScenario===s?T.navy:'transparent', color:gridEfScenario===s?T.gold:T.textSec, border:`1px solid ${gridEfScenario===s?T.gold:T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.mono, fontSize:12 }}>{s==='current'?'India Grid 2024 (0.82 tCO₂/MWh)':'India Grid 2030 (0.47 tCO₂/MWh)'}</button>)}
            </div>
            <div style={{ display:'grid', gap:8, marginBottom:16 }}>
              {MANUFACTURERS.map((m,i) => {
                const pb = calcCarbonPayback({ systemKwp:1, gridEf:gridEfNow, annGenMwh:1.6, moduleCI:(m.scope1KgW+m.scope2KgW+m.scope3KgW) });
                return (
                  <div key={i} style={{ padding:'10px 14px', background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:T.text, fontSize:12, fontWeight:600 }}>{m.name}</div>
                      <div style={{ color:T.textMut, fontSize:11 }}>LCA: {m.scope1KgW+m.scope2KgW+m.scope3KgW} kgCO₂/kW · PLF 18%</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:T.green, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>{pb} yr</div>
                      <div style={{ color:T.textSec, fontSize:10 }}>payback</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Finance Value Chain — Solar Manufacturing</SectionTitle>
            {[
              { stage:'Polysilicon / Wafer', mechanism:'Supply chain decarbonization', carbon:'53% LCA share', value:'Scope 3 reduction → CBAM saving' },
              { stage:'Cell / Module Mfg', mechanism:'RE100 + ISO 50001', carbon:'32% LCA share', value:'Scope 1+2 → CBAM & EPD' },
              { stage:'PLI Incentive', mechanism:'Efficiency threshold bonus', carbon:'Implicit carbon price', value:'₹1.5–2.5/W over 5yr' },
              { stage:'EPD Certification', mechanism:'IEC 63274 / ISO 14025', carbon:'LCA declaration', value:'Green premium +$0.03–0.05/W' },
              { stage:'CBAM Compliance', mechanism:'EU ETS certificate purchase', carbon:'Scope 1+2 embedded', value:'Cost or competitive moat' },
              { stage:'PAT/CCTS', mechanism:'ESCert / CCert trading', carbon:'Intensity vs baseline', value:'Revenue or penalty avoidance' },
              { stage:'REC Procurement', mechanism:'Solar REC on IEX', carbon:'Scope 2 neutralisation', value:'RE100 claim + Scope 2 credit' },
            ].map((s,i) => (
              <div key={i} style={{ padding:'10px 14px', background:i%2===0?T.surfaceH:T.surface, borderRadius:6, marginBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ color:T.gold, fontFamily:T.mono, fontSize:12 }}>{s.stage}</span>
                  <span style={{ color:T.amber, fontSize:11 }}>{s.carbon}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.textSec, fontSize:11 }}>{s.mechanism}</span>
                  <span style={{ color:T.green, fontSize:11 }}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:20, padding:'10px 16px', background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
        <span>EP-EA3 · Solar Panel Manufacturer Carbon Finance · India Focus</span>
        <span>PLI + CBAM + CCTS + EPD · 6 Manufacturers · 10 Tabs</span>
      </div>

      {activeTab === 10 && (
        <IndiaAdvancedAnalytics
          T={T}
          moduleCode="EP-EA3"
          title="Manufacturer Carbon Risk — CBAM MC, PLI Tornado & NGFS Scenario Suite"
          mcModel={{
            title: `MC CBAM Cost ($M) · ${mfr.name} @ ${exportMw} MW export`,
            unit: 'M',
            fmt: (n) => n.toFixed(2),
            vars: {
              intensity: { min: (mfr.scope1KgW + mfr.scope2KgW) * 0.7, mode: mfr.scope1KgW + mfr.scope2KgW, max: (mfr.scope1KgW + mfr.scope2KgW) * 1.4 },
              eua:       { min: euEtsPrice * 0.7, mode: euEtsPrice, max: euEtsPrice * 1.6 },
              mw:        { min: exportMw * 0.6,   mode: exportMw,   max: exportMw * 1.4 },
              cbamPct:   { min: 0.5,              mode: cbamRow.cbamPct, max: 1.0 },
            },
            compute: (v) => {
              const tco2 = (v.intensity / 1000) * v.mw * 1e6;
              return (tco2 * v.eua * v.cbamPct) / 1e6;
            },
          }}
          tornadoModel={{
            title: `CBAM cost exposure ($M) — ${mfr.name}`,
            fmt: (n) => '$' + n.toFixed(2) + 'M',
            inputs: { intensity: mfr.scope1KgW + mfr.scope2KgW, eua: euEtsPrice, mw: exportMw, cbamPct: cbamRow.cbamPct },
            compute: (v) => ((v.intensity / 1000) * v.mw * 1e6 * v.eua * v.cbamPct) / 1e6,
          }}
          scenarioImpact={(priceUSDt) => {
            const tco2 = ((mfr.scope1KgW + mfr.scope2KgW) / 1000) * exportMw * 1e6;
            return (tco2 * priceUSDt * cbamRow.cbamPct) / 1e6;
          }}
          scenarioFmt={(n) => '$' + n.toFixed(1) + 'M'}
          scenarioTitle="CBAM cost exposure $M — EUA equivalent × horizon"
          peers={{
            cols: [
              { k: 'name', label: 'Manufacturer' },
              { k: 'cap',  label: 'Cap GW', align: 'right', mono: true },
              { k: 's12',  label: 'S1+S2 kg/W', align: 'right', mono: true },
              { k: 's3',   label: 'S3 kg/W', align: 'right', mono: true },
              { k: 'pli',  label: 'PLI ₹Cr', align: 'right', mono: true },
              { k: 'exp',  label: 'EU export %', align: 'right', mono: true },
            ],
            rows: [
              { name: 'Waaree Energies',     cap: 13.3, s12: '0.18', s3: '2.05', pli: '1960', exp: 22 },
              { name: 'Adani Solar',         cap: 4.0,  s12: '0.16', s3: '1.95', pli: '1400', exp: 18 },
              { name: 'Vikram Solar',        cap: 3.5,  s12: '0.19', s3: '2.10', pli: '820',  exp: 35 },
              { name: 'Tata Power Solar',    cap: 4.3,  s12: '0.17', s3: '2.00', pli: '1100', exp: 15 },
              { name: 'Saatvik Green',       cap: 3.8,  s12: '0.20', s3: '2.15', pli: '780',  exp: 28 },
              { name: 'RenewSys',            cap: 2.0,  s12: '0.18', s3: '2.05', pli: '620',  exp: 30 },
            ],
          }}
          defaultCovered={['gov1', 'str1', 'str3', 'rsk1', 'met1', 'met2', 'met3', 'tgt1']}
        />
      )}

      <Apr2026CarbonAnalytics moduleCode="EP-EA3" moduleTitle="Solar Manufacturer Carbon Finance" flavor="manufacturer" basePrice={68} T={T} />
    </div>
  );
}
