import React, { useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  AreaChart, Area,
  ResponsiveContainer,
} from 'recharts';
import { GRID_INTENSITY_2022, GRID_INTENSITY_TREND, getGridIntensity, intensityTier } from '../../../data/gridIntensity';
import { ENERGY_FACTORS } from '../../../data/emissionFactors';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const COMPANIES = [
  { id:1,  name:'Apex Energy',       sector:'Utilities',    gwh:4820, renewPct:82, re100:true,  ev100:true,  ep100:true,  re100Year:2030, evPct:61, intensityRev:38.2, intensityEmp:28.4 },
  { id:2,  name:'BrightCore Mfg',    sector:'Industrials',  gwh:3150, renewPct:45, re100:true,  ev100:false, ep100:false, re100Year:2035, evPct:18, intensityRev:62.1, intensityEmp:41.7 },
  { id:3,  name:'ClearPath Retail',  sector:'Consumer',     gwh:1240, renewPct:98, re100:true,  ev100:true,  ep100:true,  re100Year:2030, evPct:78, intensityRev:12.4, intensityEmp:8.9  },
  { id:4,  name:'DuraSteel Corp',    sector:'Industrials',  gwh:7830, renewPct:22, re100:false, ev100:false, ep100:false, re100Year:2040, evPct:6,  intensityRev:94.5, intensityEmp:67.2 },
  { id:5,  name:'EcoLogix Tech',     sector:'Technology',   gwh:980,  renewPct:96, re100:true,  ev100:true,  ep100:true,  re100Year:2030, evPct:82, intensityRev:9.8,  intensityEmp:6.1  },
  { id:6,  name:'Frontier Foods',    sector:'Consumer',     gwh:2340, renewPct:38, re100:true,  ev100:false, ep100:false, re100Year:2035, evPct:24, intensityRev:28.7, intensityEmp:19.3 },
  { id:7,  name:'GreenVolt Pharma',  sector:'Healthcare',   gwh:1560, renewPct:71, re100:true,  ev100:true,  ep100:false, re100Year:2030, evPct:45, intensityRev:18.3, intensityEmp:13.6 },
  { id:8,  name:'HarborLink Ports',  sector:'Transport',    gwh:5420, renewPct:29, re100:false, ev100:false, ep100:false, re100Year:2040, evPct:11, intensityRev:71.8, intensityEmp:52.4 },
  { id:9,  name:'IndigoSky Hotels',  sector:'Real Estate',  gwh:890,  renewPct:63, re100:true,  ev100:false, ep100:true,  re100Year:2035, evPct:33, intensityRev:22.1, intensityEmp:14.8 },
  { id:10, name:'JetStream Air',     sector:'Transport',    gwh:9240, renewPct:12, re100:false, ev100:false, ep100:false, re100Year:2040, evPct:4,  intensityRev:112.3,intensityEmp:88.9 },
  { id:11, name:'KleanChem Ltd',     sector:'Chemicals',    gwh:6110, renewPct:34, re100:true,  ev100:false, ep100:false, re100Year:2035, evPct:15, intensityRev:83.2, intensityEmp:59.1 },
  { id:12, name:'LumiSolar Systems', sector:'Technology',   gwh:620,  renewPct:91, re100:true,  ev100:true,  ep100:true,  re100Year:2030, evPct:74, intensityRev:7.4,  intensityEmp:4.8  },
  { id:13, name:'MeridianBank FSG',  sector:'Finance',      gwh:740,  renewPct:84, re100:true,  ev100:true,  ep100:false, re100Year:2030, evPct:58, intensityRev:5.9,  intensityEmp:4.2  },
  { id:14, name:'NorthTide Mining',  sector:'Materials',    gwh:8960, renewPct:18, re100:false, ev100:false, ep100:false, re100Year:2040, evPct:7,  intensityRev:128.4,intensityEmp:97.3 },
  { id:15, name:'OmniDrive Autos',   sector:'Automotive',   gwh:4380, renewPct:56, re100:true,  ev100:true,  ep100:true,  re100Year:2030, evPct:49, intensityRev:44.6, intensityEmp:31.8 },
  { id:16, name:'PureWave Telecom',  sector:'Technology',   gwh:2180, renewPct:74, re100:true,  ev100:true,  ep100:false, re100Year:2030, evPct:62, intensityRev:16.7, intensityEmp:11.2 },
  { id:17, name:'QuantumGrid Util',  sector:'Utilities',    gwh:6340, renewPct:67, re100:true,  ev100:false, ep100:true,  re100Year:2035, evPct:28, intensityRev:52.3, intensityEmp:38.6 },
  { id:18, name:'RiverStone Chem',   sector:'Chemicals',    gwh:5870, renewPct:27, re100:false, ev100:false, ep100:false, re100Year:2040, evPct:9,  intensityRev:88.9, intensityEmp:63.4 },
];

const ENERGY_MIX = [
  { name:'Grid Electricity', value:28, color:'#64748b' },
  { name:'Natural Gas',      value:14, color:'#f59e0b' },
  { name:'Diesel',           value:5,  color:'#dc2626' },
  { name:'On-site Solar',    value:12, color:'#eab308' },
  { name:'Wind PPA',         value:22, color:'#3b82f6' },
  { name:'RECs',             value:11, color:'#8b5cf6' },
  { name:'Hydrogen',         value:8,  color:'#06b6d4' },
];

const PPAS = [
  { id:1,  counterparty:'SunPower Renewables',  tech:'Solar',  mw:380, price:42.5, term:2034, remaining:8,  geography:'Texas, USA',       coverage:8.2  },
  { id:2,  counterparty:'WindCo Nordic',        tech:'Wind',   mw:520, price:38.2, term:2032, remaining:6,  geography:'Denmark / Sweden', coverage:11.4 },
  { id:3,  counterparty:'HydroQC Power',        tech:'Hydro',  mw:240, price:29.8, term:2038, remaining:12, geography:'Quebec, Canada',   coverage:5.1  },
  { id:4,  counterparty:'Clearway Energy',      tech:'Solar',  mw:460, price:44.1, term:2033, remaining:7,  geography:'California, USA',  coverage:9.8  },
  { id:5,  counterparty:'RWE Renewables',       tech:'Wind',   mw:380, price:36.7, term:2035, remaining:9,  geography:'Germany',          coverage:8.1  },
  { id:6,  counterparty:'Iberdrola Renovables', tech:'Wind',   mw:290, price:33.9, term:2036, remaining:10, geography:'Spain',            coverage:6.2  },
  { id:7,  counterparty:'Ørsted Offshore',      tech:'Wind',   mw:410, price:48.3, term:2031, remaining:5,  geography:'UK North Sea',     coverage:8.7  },
  { id:8,  counterparty:'First Solar PPAs',     tech:'Solar',  mw:160, price:40.6, term:2037, remaining:11, geography:'Arizona, USA',     coverage:3.4  },
];

const RE100_TRAJECTORY = [
  { year:2020, actual:32, target:32, plan:null },
  { year:2021, actual:38, target:38, plan:null },
  { year:2022, actual:44, target:44, plan:null },
  { year:2023, actual:51, target:51, plan:null },
  { year:2024, actual:55, target:55, plan:null },
  { year:2025, actual:58, target:58, plan:null },
  { year:2026, actual:null, target:64, plan:64 },
  { year:2027, actual:null, target:71, plan:71 },
  { year:2028, actual:null, target:79, plan:79 },
  { year:2029, actual:null, target:89, plan:89 },
  { year:2030, actual:null, target:100, plan:100 },
  { year:2031, actual:null, target:100, plan:100 },
  { year:2032, actual:null, target:100, plan:100 },
  { year:2033, actual:null, target:100, plan:100 },
  { year:2034, actual:null, target:100, plan:100 },
  { year:2035, actual:null, target:100, plan:100 },
];

const PROCUREMENT_OPTIONS = [
  { option:'New Wind PPAs',   costPerMwh:37, gwh:4800, totalCost:177.6 },
  { option:'New Solar PPAs',  costPerMwh:41, gwh:3200, totalCost:131.2 },
  { option:'RECs Only',       costPerMwh:8,  gwh:8000, totalCost:64.0  },
  { option:'On-site Solar',   costPerMwh:52, gwh:1400, totalCost:72.8  },
  { option:'Green Hydrogen',  costPerMwh:74, gwh:600,  totalCost:44.4  },
];

const FLEET_DATA = [
  { category:'Passenger Cars', total:12400, ev:5890, evPct:47.5, targetPct:100 },
  { category:'Light Comm Veh', total:8200,  ev:2214, evPct:27.0, targetPct:100 },
  { category:'Heavy Goods Veh',total:3600,  ev:396,  evPct:11.0, targetPct:50  },
  { category:'Buses & Coaches',total:1800,  ev:612,  evPct:34.0, targetPct:80  },
  { category:'Forklifts',      total:4200,  ev:2478, evPct:59.0, targetPct:100 },
];

const TCO_DATA = [
  { scenario:'ICE (Current)',   fuel:4800, maintenance:2100, capex:3200, total:10100 },
  { scenario:'EV (Current)',    fuel:1400, maintenance:900,  capex:4800, total:7100  },
  { scenario:'ICE (2030e)',     fuel:7200, maintenance:2300, capex:3400, total:12900 },
  { scenario:'EV (2030e)',      fuel:800,  maintenance:700,  capex:3600, total:5100  },
];

const SECTOR_BENCH = {
  Utilities: 45, Industrials: 78, Consumer: 22, Technology: 12,
  Healthcare: 20, Transport: 95, 'Real Estate': 25, Finance: 8,
  Chemicals: 90, Automotive: 50, Materials: 115,
};

const TABS = ['Energy Dashboard','PPA Portfolio','RE100 Pathway','Energy Intensity','EV100 Fleet'];

const KpiCard = ({ label, value, sub, color, wide }) => (
  <div style={{
    background: T.surface, borderRadius: 10, padding: '16px 20px',
    boxShadow: T.card, border: `1px solid ${T.border}`,
    flex: wide ? '1 1 220px' : '1 1 160px', minWidth: 140,
  }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color, bg }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 20,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    color: color || T.navy, background: bg || T.surfaceH,
    border: `1px solid ${T.border}`,
  }}>{text}</span>
);

const RCOLOR = { Solar:'#eab308', Wind:'#3b82f6', Hydro:'#06b6d4' };

export default function EnergyTransitionAnalyticsPage() {
  const [tab, setTab] = useState(0);

  const totalGwh = COMPANIES.reduce((a, c) => a + c.gwh, 0);
  const renewGwh  = COMPANIES.reduce((a, c) => a + c.gwh * c.renewPct / 100, 0);
  const portRenewPct = Math.round(renewGwh / totalGwh * 100);
  const totalPpaMw = PPAS.reduce((a, p) => a + p.mw, 0);
  const re100Count = COMPANIES.filter(c => c.re100).length;
  const ev100Count = COMPANIES.filter(c => c.ev100).length;

  const companyBarData = [...COMPANIES]
    .sort((a,b) => b.renewPct - a.renewPct)
    .map(c => ({ name: c.name.split(' ')[0], pct: c.renewPct, gwh: c.gwh }));

  const ppaExpiry = PPAS.map(p => ({ name: p.counterparty.split(' ')[0], remaining: p.remaining, mw: p.mw }));

  const intensityData = COMPANIES.map(c => ({
    name: c.name.split(' ')[0],
    intensity: c.intensityRev,
    benchmark: SECTOR_BENCH[c.sector] || 50,
    diff: +(c.intensityRev - (SECTOR_BENCH[c.sector] || 50)).toFixed(1),
  }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(197,169,106,0.12)',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ background: T.gold, color: T.navy, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>EP-AI4</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Energy Transition Analytics</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Energy Transition Analytics</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 560 }}>
              Corporate energy mix tracking, renewable procurement, RE100/EV100/EP100 commitment monitoring and energy intensity benchmarking across 18 portfolio companies.
            </p>
            {/* Data quality badges — real published sources */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {[
                { text: `\u2713 Grid intensity: Ember 2023 (CC BY 4.0) — ${GRID_INTENSITY_2022.length} countries` },
                { text: `\u2713 UK grid: ${ENERGY_FACTORS.ukGrid2023.factor} kgCO\u2082/kWh (DEFRA / National Grid ESO 2023)` },
                { text: '\u2713 Source: Ember Global Electricity Review 2023' },
              ].map((b, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(197,169,106,0.4)', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                  {b.text}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>Portfolio Renewable Electricity</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.gold, lineHeight: 1 }}>{portRenewPct}%</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>vs. RE100 target: 100% by 2030</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, marginTop: 20 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              background: tab === i ? T.surface : 'transparent',
              color: tab === i ? T.navy : 'rgba(255,255,255,0.65)',
              border: 'none', borderRadius: '8px 8px 0 0',
              padding: '10px 18px', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === i ? 700 : 500,
              fontFamily: T.font, transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px' }}>

        {/* ── TAB 0: Energy Dashboard ── */}
        {tab === 0 && (
          <div>
            {/* KPI row */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard label="Portfolio Renewable %" value={`${portRenewPct}%`} sub="RE100 target: 100% by 2030" color={T.sage} />
              <KpiCard label="Total PPA Capacity" value={`${totalPpaMw.toLocaleString()} MW`} sub="8 active contracts" color={T.navyL} />
              <KpiCard label="Annual Cost Saving" value="$48M" sub="Renewables vs. grid parity" color={T.green} />
              <KpiCard label="RE100 Committed" value={`${re100Count}/18`} sub="companies pledged" color={T.navy} />
              <KpiCard label="EV100 Committed" value={`${ev100Count}/18`} sub="fleet electrification pledge" color={T.amber} />
              <KpiCard label="Total Portfolio Energy" value={`${(totalGwh/1000).toFixed(1)}K GWh`} sub="annual consumption" color={T.textSec} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Energy Mix Pie */}
              <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Portfolio Energy Mix</div>
                <div style={{ color: T.textMut, fontSize: 12, marginBottom: 16 }}>Share of total consumption by source</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={ENERGY_MIX} dataKey="value" cx="50%" cy="50%" outerRadius={90} labelLine={false}
                      label={({ name, value }) => `${name.split(' ')[0]} ${value}%`}>
                      {ENERGY_MIX.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {ENERGY_MIX.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: e.color }} />
                      <span style={{ fontSize: 11, color: T.textSec }}>{e.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Renewable % by company */}
              <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Renewable % by Company</div>
                <div style={{ color: T.textMut, fontSize: 12, marginBottom: 12 }}>Ranked highest to lowest</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={companyBarData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Renewable']} />
                    <ReferenceLine x={58} stroke={T.amber} strokeDasharray="4 2" label={{ value:'Avg', position:'top', fontSize:9, fill:T.amber }} />
                    <Bar dataKey="pct" radius={[0,3,3,0]}>
                      {companyBarData.map((d, i) => (
                        <Cell key={i} fill={d.pct >= 80 ? T.green : d.pct >= 50 ? T.sage : d.pct >= 30 ? T.amber : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RE100 / EV100 / EP100 commitment table */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Commitment Status — RE100 / EV100 / EP100</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Corporate energy initiative pledge tracker across portfolio</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Company','Sector','RE100','EV100','EP100','RE100 Target','Current Renew %','EV Fleet %','Annual GWh'].map((h, i) => (
                        <th key={i} style={{ padding: '8px 12px', textAlign: i > 1 ? 'center' : 'left', color: T.textSec, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPANIES.map((c, i) => (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                        <td style={{ padding: '7px 12px', color: T.textSec }}>{c.sector}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}><Badge text={c.re100 ? 'YES' : 'NO'} color={c.re100 ? T.green : T.red} bg={c.re100 ? '#dcfce7' : '#fee2e2'} /></td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}><Badge text={c.ev100 ? 'YES' : 'NO'} color={c.ev100 ? T.green : T.red} bg={c.ev100 ? '#dcfce7' : '#fee2e2'} /></td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}><Badge text={c.ep100 ? 'YES' : 'NO'} color={c.ep100 ? T.navyL : T.textMut} bg={c.ep100 ? '#dbeafe' : '#f1f5f9'} /></td>
                        <td style={{ padding: '7px 12px', textAlign: 'center', color: T.textSec }}>{c.re100Year}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: c.renewPct >= 80 ? T.green : c.renewPct >= 50 ? T.amber : T.red }}>{c.renewPct}%</span>
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'center', color: T.textSec }}>{c.evPct}%</td>
                        <td style={{ padding: '7px 12px', textAlign: 'center', color: T.textSec }}>{c.gwh.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: PPA Portfolio ── */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard label="Total PPA Capacity" value={`${totalPpaMw.toLocaleString()} MW`} sub="8 active contracts" color={T.navyL} />
              <KpiCard label="Avg PPA Price" value={`$${(PPAS.reduce((a,p)=>a+p.price,0)/PPAS.length).toFixed(1)}/MWh`} sub="volume-weighted average" color={T.gold} />
              <KpiCard label="Weighted Avg Tenure" value={`${(PPAS.reduce((a,p)=>a+p.remaining,0)/PPAS.length).toFixed(1)} yrs`} sub="avg remaining duration" color={T.sage} />
              <KpiCard label="PPA Coverage" value="61%" sub="of total portfolio consumption" color={T.green} />
              <KpiCard label="Annual Cost Saving" value="$48M" sub="vs. market rate electricity" color={T.green} />
            </div>

            {/* PPA Table */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Active PPA Contracts</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Power purchase agreements — counterparty, technology, capacity and economics</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Counterparty','Technology','Capacity (MW)','Price ($/MWh)','Expiry','Remaining','Geography','Coverage (%)'].map((h, i) => (
                        <th key={i} style={{ padding: '8px 12px', textAlign: i > 1 ? 'center' : 'left', color: T.textSec, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PPAS.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{p.counterparty}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <Badge text={p.tech} color={RCOLOR[p.tech]} bg={p.tech === 'Solar' ? '#fef9c3' : p.tech === 'Wind' ? '#dbeafe' : '#cffafe'} />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: T.navy }}>{p.mw}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec }}>${p.price.toFixed(1)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec }}>{p.term}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: p.remaining <= 6 ? T.red : p.remaining <= 9 ? T.amber : T.green }}>{p.remaining} yrs</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{p.geography}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec }}>{p.coverage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PPA Expiry Timeline */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>PPA Remaining Term (Years)</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Years remaining on each active PPA contract — renew risk assessment</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ppaExpiry} margin={{ top: 8, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'Years', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut }} />
                  <Tooltip formatter={(v, n) => [n === 'remaining' ? `${v} yrs` : `${v} MW`, n === 'remaining' ? 'Remaining Term' : 'Capacity (MW)']} />
                  <Legend />
                  <Bar dataKey="remaining" name="Remaining Term (yrs)" radius={[4,4,0,0]}>
                    {ppaExpiry.map((d, i) => (
                      <Cell key={i} fill={d.remaining <= 6 ? T.red : d.remaining <= 9 ? T.amber : T.sage} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 2: RE100 Pathway ── */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard label="Current Renewable %" value="58%" sub="2025 actual" color={T.sage} />
              <KpiCard label="RE100 Gap (2030)" value="42%" sub="42 GWh per GWh total needed" color={T.red} />
              <KpiCard label="Annual Procurement Gap" value="~8.2K GWh" sub="additional renewables needed" color={T.amber} />
              <KpiCard label="Estimated Gap Cost" value="$338M" sub="to close via PPAs + RECs mix" color={T.navy} />
            </div>

            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>RE100 Trajectory 2020–2035</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Actual renewable % vs. RE100 pathway target and planned procurement schedule</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={RE100_TRAJECTORY} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.sage} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.sage} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gPlan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.navyL} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={T.navyL} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.gold} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={T.gold} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 110]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v, n) => v !== null ? [`${v}%`, n] : ['—', n]} />
                  <Legend />
                  <ReferenceLine y={100} stroke={T.red} strokeDasharray="6 3" label={{ value:'RE100 Goal', position:'right', fontSize:10, fill:T.red }} />
                  <Area type="monotone" dataKey="actual" name="Actual Renewable %" stroke={T.sage} fill="url(#gAct)" strokeWidth={2.5} connectNulls={false} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="plan" name="Planned Procurement" stroke={T.navyL} fill="url(#gPlan)" strokeWidth={2} strokeDasharray="5 3" connectNulls />
                  <Area type="monotone" dataKey="target" name="RE100 Target Path" stroke={T.gold} fill="url(#gTarget)" strokeWidth={1.5} strokeDasharray="3 3" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Procurement options */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Procurement Options Analysis — Closing the RE100 Gap</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Cost and volume comparison across renewable procurement instruments</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={PROCUREMENT_OPTIONS} margin={{ top: 8, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="option" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textMut }} />
                    <Tooltip formatter={(v) => [`$${v}/MWh`, 'Unit Cost']} />
                    <Bar dataKey="costPerMwh" name="Cost ($/MWh)" radius={[4,4,0,0]}>
                      {PROCUREMENT_OPTIONS.map((d, i) => (
                        <Cell key={i} fill={[T.navyL, T.sage, T.amber, T.gold, '#8b5cf6'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={PROCUREMENT_OPTIONS} margin={{ top: 8, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="option" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'Total $M', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textMut }} />
                    <Tooltip formatter={(v) => [`$${v}M`, 'Total Cost']} />
                    <Bar dataKey="totalCost" name="Total Cost ($M)" radius={[4,4,0,0]}>
                      {PROCUREMENT_OPTIONS.map((d, i) => (
                        <Cell key={i} fill={[T.navyL, T.sage, T.amber, T.gold, '#8b5cf6'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {PROCUREMENT_OPTIONS.map((o, i) => (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.border}`, flex: '1 1 140px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{o.option}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navyL }}>${o.costPerMwh}/MWh</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{o.gwh.toLocaleString()} GWh · ${o.totalCost}M total</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Energy Intensity ── */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard label="Portfolio Intensity" value="52.4 MWh/$M" sub="revenue-weighted average" color={T.navy} />
              <KpiCard label="YoY Improvement" value="-4.2%" sub="energy intensity reduction" color={T.green} />
              <KpiCard label="EP100 Leaders" value="6/18" sub="companies on track to double productivity" color={T.navyL} />
              <KpiCard label="Best Performer" value="9.8 MWh/$M" sub="EcoLogix Tech (Technology)" color={T.sage} />
              <KpiCard label="Intensity Laggard" value="128 MWh/$M" sub="NorthTide Mining (Materials)" color={T.red} />
            </div>

            {/* Intensity vs benchmark */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Energy Intensity vs. Sector Benchmark (MWh per $M Revenue)</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Company actual vs. sector median — negative gap indicates outperformance</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intensityData} margin={{ top: 8, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'MWh/$M Rev', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textMut }} />
                  <Tooltip formatter={(v, n) => [`${v} MWh/$M`, n]} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="intensity" name="Company Intensity" radius={[3,3,0,0]}>
                    {intensityData.map((d, i) => (
                      <Cell key={i} fill={d.intensity < d.benchmark ? T.sage : d.intensity < d.benchmark * 1.2 ? T.amber : T.red} />
                    ))}
                  </Bar>
                  <Bar dataKey="benchmark" name="Sector Benchmark" fill={T.navy} opacity={0.3} radius={[3,3,0,0]}>
                    {intensityData.map((d, i) => (
                      <Cell key={i} fill={T.navy} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* EP100 tracker */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>EP100 Energy Productivity Tracker</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Target: double energy productivity (halve intensity) by 2030. Baseline year: 2015.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {COMPANIES.map((c, i) => {
                  const baseline = c.intensityRev * (1 + sr(i * 3) * 0.4 + 0.1);
                  const target2030 = baseline / 2;
                  const progress = Math.min(100, Math.round((baseline - c.intensityRev) / (baseline - target2030) * 100));
                  return (
                    <div key={c.id} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{c.name}</div>
                        {c.ep100 && <Badge text="EP100" color={T.navyL} bg="#dbeafe" />}
                      </div>
                      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>
                        {c.intensityRev} MWh/$M → target {target2030.toFixed(1)}
                      </div>
                      <div style={{ background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${progress}%`,
                          background: progress >= 70 ? T.green : progress >= 40 ? T.amber : T.red,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{progress}% of EP100 journey</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: EV100 Fleet ── */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard label="Portfolio EV Penetration" value="34%" sub="EV100 committed companies" color={T.sage} />
              <KpiCard label="Total Fleet Size" value="30,200" sub="vehicles across all categories" color={T.navy} />
              <KpiCard label="EVs on Road" value="11,590" sub="electric vehicles deployed" color={T.green} />
              <KpiCard label="TCO Saving (EV vs ICE)" value="$3,000/yr" sub="per vehicle at current energy" color={T.navyL} />
              <KpiCard label="2030 TCO Advantage" value="$7,800/yr" sub="per vehicle at 2030 projections" color={T.green} />
            </div>

            {/* Fleet electrification by category */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Fleet Electrification by Vehicle Category</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Current EV penetration vs. EV100 target per vehicle segment</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FLEET_DATA} margin={{ top: 8, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 110]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  <Legend />
                  <Bar dataKey="evPct" name="Current EV %" radius={[4,4,0,0]}>
                    {FLEET_DATA.map((d, i) => (
                      <Cell key={i} fill={d.evPct >= 50 ? T.green : d.evPct >= 25 ? T.amber : T.navyL} />
                    ))}
                  </Bar>
                  <Bar dataKey="targetPct" name="EV100 Target %" fill={T.navy} opacity={0.25} radius={[4,4,0,0]}>
                    {FLEET_DATA.map((d, i) => (
                      <Cell key={i} fill={T.navy} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Fleet detail cards */}
              <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 14, fontSize: 14 }}>Fleet Segment Detail</div>
                {FLEET_DATA.map((d, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{d.category}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{d.ev.toLocaleString()} / {d.total.toLocaleString()} EVs</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, width: `${d.evPct}%`, background: d.evPct >= 50 ? T.green : d.evPct >= 25 ? T.amber : T.navyL }} />
                      </div>
                      <span style={{ fontSize: 11, color: T.textMut, minWidth: 36, textAlign: 'right' }}>{d.evPct}%</span>
                      <span style={{ fontSize: 10, color: T.textMut }}>/ {d.targetPct}%</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: '12px 14px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 2 }}>Charging Infrastructure Coverage</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>68%</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>of EV100 committed sites have Level 2+ charging installed</div>
                </div>
              </div>

              {/* TCO Comparison */}
              <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>Fleet TCO Comparison ($/vehicle/yr)</div>
                <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>ICE vs. EV total cost of ownership at current and 2030 projected energy prices</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={TCO_DATA} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v, n) => [`$${v.toLocaleString()}`, n]} />
                    <Legend />
                    <Bar dataKey="fuel" name="Fuel/Energy" stackId="a" fill={T.red} opacity={0.85}>
                      {TCO_DATA.map((d, i) => <Cell key={i} fill={T.red} />)}
                    </Bar>
                    <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={T.amber} opacity={0.85}>
                      {TCO_DATA.map((d, i) => <Cell key={i} fill={T.amber} />)}
                    </Bar>
                    <Bar dataKey="capex" name="Capex/Depreciation" stackId="a" fill={T.navyL} opacity={0.85} radius={[3,3,0,0]}>
                      {TCO_DATA.map((d, i) => <Cell key={i} fill={T.navyL} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                  {TCO_DATA.map((d, i) => (
                    <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 12px', border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 2 }}>{d.scenario}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: d.scenario.includes('ICE') ? T.red : T.green }}>
                        ${d.total.toLocaleString()}/yr
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* EV100 by company */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4, fontSize: 14 }}>EV Fleet % by Portfolio Company</div>
              <div style={{ color: T.textMut, fontSize: 12, marginBottom: 14 }}>Current electric vehicle penetration across all portfolio companies</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[...COMPANIES].sort((a, b) => b.evPct - a.evPct).map(c => ({ name: c.name.split(' ')[0], pct: c.evPct, ev100: c.ev100 }))}
                  margin={{ top: 8, right: 20, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, 'EV Fleet %']} />
                  <ReferenceLine y={34} stroke={T.amber} strokeDasharray="4 2" label={{ value:'Portfolio Avg', position:'right', fontSize:9, fill:T.amber }} />
                  <Bar dataKey="pct" name="EV Fleet %" radius={[3,3,0,0]}>
                    {[...COMPANIES].sort((a, b) => b.evPct - a.evPct).map((d, i) => (
                      <Cell key={i} fill={d.ev100 ? T.green : T.navyL} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: T.green }} /><span style={{ fontSize: 11, color: T.textSec }}>EV100 Committed</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: T.navyL }} /><span style={{ fontSize: 11, color: T.textSec }}>Not EV100 Committed</span></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ padding: '16px 32px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: T.textMut }}>EP-AI4 Energy Transition Analytics — RE100 / EV100 / EP100 Portfolio Intelligence</div>
        <div style={{ fontSize: 11, color: T.textMut }}>Data as of Q1 2026 · 18 portfolio companies · {totalPpaMw.toLocaleString()} MW PPA capacity</div>
      </div>
    </div>
  );
}
