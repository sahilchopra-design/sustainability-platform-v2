import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { SDA_PATHWAYS, NGFS_PHASE4 } from '../../../services/climateRiskDataService';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d', teal:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};
const ACCENT = '#f97316';

/* ── Deterministic seed ─────────────────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

/* ── IPCC AR6 Carbon Budgets (Table SPM.2) ──────────────────────────────────── */
const IPCC_BUDGETS = [
  { temp:1.5, probability:50, remaining:500  },
  { temp:1.5, probability:67, remaining:400  },
  { temp:1.7, probability:67, remaining:700  },
  { temp:2.0, probability:67, remaining:1150 },
  { temp:2.0, probability:83, remaining:900  },
  { temp:2.5, probability:50, remaining:2300 },
];
const GLOBAL_EMISSIONS_RATE = 36.8; // GtCO2/yr (2023 IEA)

/* ── Portfolio Holdings ─────────────────────────────────────────────────────── */
const HOLDINGS = [
  { name:'Reliance Industries', sector:'chemicals', country:'IN', scope1:14.2,  scope2:8.4,  scope3:42.0,  revenue:88,  nzTarget:2070, sbti:false, weight:0.12 },
  { name:'Coal India',          sector:'mining',    country:'IN', scope1:98.4,  scope2:4.2,  scope3:180.0, revenue:14,  nzTarget:null, sbti:false, weight:0.08 },
  { name:'NTPC',                sector:'power',     country:'IN', scope1:82.1,  scope2:2.8,  scope3:12.0,  revenue:18,  nzTarget:2070, sbti:false, weight:0.10 },
  { name:'Adani Green Energy',  sector:'power',     country:'IN', scope1:0.2,   scope2:0.4,  scope3:1.2,   revenue:4,   nzTarget:2050, sbti:true,  weight:0.07 },
  { name:'JSW Steel',           sector:'steel',     country:'IN', scope1:42.8,  scope2:6.2,  scope3:18.0,  revenue:22,  nzTarget:2050, sbti:false, weight:0.09 },
  { name:'Rio Tinto',           sector:'mining',    country:'AU', scope1:28.4,  scope2:8.8,  scope3:420.0, revenue:55,  nzTarget:2050, sbti:true,  weight:0.10 },
  { name:'Shell plc',           sector:'chemicals', country:'GB', scope1:68.2,  scope2:12.4, scope3:680.0, revenue:380, nzTarget:2050, sbti:false, weight:0.12 },
  { name:'Siemens Energy',      sector:'power',     country:'DE', scope1:0.8,   scope2:1.2,  scope3:8.4,   revenue:32,  nzTarget:2040, sbti:true,  weight:0.06 },
  { name:'ArcelorMittal',       sector:'steel',     country:'BE', scope1:140.0, scope2:18.2, scope3:42.0,  revenue:79,  nzTarget:2050, sbti:true,  weight:0.08 },
  { name:'EDF Group',           sector:'power',     country:'FR', scope1:22.4,  scope2:4.2,  scope3:14.0,  revenue:84,  nzTarget:2050, sbti:true,  weight:0.06 },
  { name:'Tata Motors',         sector:'road',      country:'IN', scope1:4.2,   scope2:2.8,  scope3:84.0,  revenue:42,  nzTarget:2050, sbti:false, weight:0.04 },
  { name:'ArcelorMittal 2',     sector:'steel',     country:'BE', scope1:62.0,  scope2:8.4,  scope3:22.0,  revenue:35,  nzTarget:2050, sbti:false, weight:0.08 },
];

/* ── IPCC Budget-based ITR ──────────────────────────────────────────────────── */
function computeITR(scope1, scope2, revenue, nzTarget) {
  const annualEmissions = scope1 + scope2;
  const yearsToNetZero = nzTarget ? nzTarget - 2024 : 76;
  const impliedCumulative = annualEmissions * yearsToNetZero * 0.5;
  if (impliedCumulative < 400000) return 1.5;
  if (impliedCumulative < 700000) return 1.5 + (impliedCumulative - 400000) / 600000 * 0.2;
  if (impliedCumulative < 1150000) return 1.7 + (impliedCumulative - 700000) / 900000 * 0.3;
  if (impliedCumulative < 2300000) return 2.0 + (impliedCumulative - 1150000) / 2300000 * 0.5;
  return Math.min(4.5, 2.5 + (impliedCumulative - 2300000) / 5000000);
}

/* ── Derived data ───────────────────────────────────────────────────────────── */
const holdingsWithITR = HOLDINGS.map(h => ({
  ...h,
  itr: +computeITR(h.scope1, h.scope2, h.revenue, h.nzTarget).toFixed(2),
  waci: +((h.scope1 + h.scope2) / h.revenue * 1000).toFixed(1),
  totalEmissions: h.scope1 + h.scope2 + h.scope3,
}));

const portfolioITR = holdingsWithITR.reduce((s, h) => s + h.weight * h.itr, 0);
const sbtiCount = HOLDINGS.filter(h => h.sbti).length;
const nz2050Count = HOLDINGS.filter(h => h.nzTarget && h.nzTarget <= 2050).length;
const portfolioWACI = holdingsWithITR.reduce((s, h) => s + h.weight * h.waci, 0);

const portfolioTotalAnnual = holdingsWithITR.reduce((s, h) => s + h.weight * (h.scope1 + h.scope2), 0);
const portfolioGlobalShare = portfolioTotalAnnual / (GLOBAL_EMISSIONS_RATE * 1000);
const portfolioBudgetShare = portfolioGlobalShare * 400 * 1000; // MtCO2
const yearsToExhaustion = portfolioTotalAnnual > 0 ? +(portfolioBudgetShare / portfolioTotalAnnual).toFixed(1) : 999;
const totalOvershoot = +holdingsWithITR.reduce((s, h) => {
  const annualE = (h.scope1 + h.scope2);
  const yearsNZ = h.nzTarget ? h.nzTarget - 2024 : 76;
  const cum = annualE * yearsNZ * 0.5;
  const budget15 = portfolioGlobalShare * 400000;
  return s + Math.max(0, cum - budget15);
}, 0).toFixed(0);

/* ── PARIS WACI benchmarks by sector ───────────────────────────────────────── */
const SECTOR_WACI_BENCH = { power:12, steel:580, chemicals:180, road:85, mining:95 };

/* ── SDA sector mapping ─────────────────────────────────────────────────────── */
const SECTOR_TO_SDA = { power:'power', steel:'steel', chemicals:'cement', road:'road', mining:'shipping' };

/* ── Shared Styles ──────────────────────────────────────────────────────────── */
const card = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px' };
const statCard = (color) => ({ ...card, borderLeft:`3px solid ${color}`, flex:1, minWidth:140 });
const tableCell = { padding:'8px 12px', borderBottom:`1px solid ${T.border}`, color:T.text, fontSize:12 };
const tableHead = { padding:'8px 12px', color:T.textSec, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${T.border}` };

const itrColor = v => v <= 1.7 ? T.green : v <= 3.0 ? T.amber : T.red;
const waciColor = v => v > 2000 ? T.red : v > 500 ? T.amber : T.green;

/* ── Tab labels ─────────────────────────────────────────────────────────────── */
const TABS = [
  'Portfolio Dashboard',
  'IPCC Budget Breakdown',
  'WACI & Financed Emissions',
  'SDA Sector Pathways',
  'SBTi & Net Zero Tracker',
  'Engagement Priorities',
];

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 1 — Portfolio Temperature Dashboard
══════════════════════════════════════════════════════════════════════════════ */
function Tab1() {
  const barData = holdingsWithITR.map(h => ({ name: h.name.split(' ')[0], itr: h.itr, color: itrColor(h.itr) }));
  const exhaustYear = 2024 + Math.round(yearsToExhaustion);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <div style={statCard(ACCENT)}>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Portfolio ITR</div>
          <div style={{ fontSize:26, fontWeight:700, color:ACCENT }}>{portfolioITR.toFixed(2)}°C</div>
          <div style={{ fontSize:11, color:T.textMut }}>Implied Temperature Rise</div>
        </div>
        <div style={statCard(T.teal)}>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>SBTi Aligned</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.teal }}>{sbtiCount}/12</div>
          <div style={{ fontSize:11, color:T.textMut }}>Holdings with validated targets</div>
        </div>
        <div style={statCard(T.green)}>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Net Zero by 2050</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.green }}>{nz2050Count}/12</div>
          <div style={{ fontSize:11, color:T.textMut }}>Holdings committed ≤ 2050</div>
        </div>
        <div style={statCard(T.red)}>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Carbon Budget Overshoot</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.red }}>{(totalOvershoot/1000).toFixed(0)} GtCO2</div>
          <div style={{ fontSize:11, color:T.textMut }}>Above portfolio 1.5°C share</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Implied Temperature Rise per Holding (IPCC AR6 Budget Method)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top:4, right:16, left:0, bottom:48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} domain={[0, 5]} tickFormatter={v => `${v}°C`} />
            <Tooltip formatter={v => [`${v}°C`, 'ITR']} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Bar dataKey="itr" radius={[3,3,0,0]}>
              {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:T.textSec }}>
          <span style={{ color:T.green }}>● ≤1.7°C Aligned</span>
          <span style={{ color:T.amber }}>● 1.7–3.0°C Transition Risk</span>
          <span style={{ color:T.red }}>● >3.0°C High Risk</span>
        </div>
      </div>

      <div style={{ ...card, borderLeft:`3px solid ${T.red}` }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>
          IPCC 1.5°C Carbon Budget Depletion (Portfolio Share)
        </div>
        <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, color:T.textSec }}>Portfolio Global Emissions Share</div>
            <div style={{ fontSize:18, fontWeight:700, color:ACCENT }}>{(portfolioGlobalShare * 100).toFixed(4)}%</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:T.textSec }}>Portfolio Budget Allocation</div>
            <div style={{ fontSize:18, fontWeight:700, color:T.amber }}>{(portfolioBudgetShare/1000).toFixed(3)} GtCO2</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:T.textSec }}>Budget Exhausted By</div>
            <div style={{ fontSize:18, fontWeight:700, color:T.red }}>{exhaustYear}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:T.textSec }}>Years Remaining</div>
            <div style={{ fontSize:18, fontWeight:700, color:T.red }}>{yearsToExhaustion} yrs</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>
          Based on IPCC AR6 WG1 Table SPM.2 — 67% probability 1.5°C budget of 400 GtCO2 from Jan 2020.
          Portfolio's proportional share computed from Scope 1+2 annual emissions vs global 36.8 GtCO2/yr.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 2 — IPCC Carbon Budget Breakdown
══════════════════════════════════════════════════════════════════════════════ */
function Tab2() {
  const portfolioAnnualGt = portfolioTotalAnnual / 1000;
  const budgetBarData = IPCC_BUDGETS.map(b => ({
    label: `${b.temp}°C/${b.probability}%`,
    remaining: b.remaining,
    years: +(b.remaining / GLOBAL_EMISSIONS_RATE).toFixed(1),
    peakYear: Math.round(2024 + b.remaining / GLOBAL_EMISSIONS_RATE * 0.7),
    portfolioShare: +((portfolioAnnualGt / GLOBAL_EMISSIONS_RATE) * b.remaining).toFixed(2),
    color: b.temp <= 1.5 ? T.green : b.temp <= 1.7 ? T.teal : b.temp <= 2.0 ? T.amber : T.red,
  }));

  const years = Array.from({ length: 16 }, (_, i) => 2024 + i * 5);
  const drawdownData = years.map(yr => {
    const elapsed = yr - 2024;
    return {
      year: yr,
      b15_67: Math.max(0, +(400 - GLOBAL_EMISSIONS_RATE * elapsed).toFixed(0)),
      b20_67: Math.max(0, +(1150 - GLOBAL_EMISSIONS_RATE * elapsed).toFixed(0)),
    };
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          IPCC AR6 Remaining Carbon Budgets (from Jan 2020, GtCO2)
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Temp Threshold','Probability','Remaining (GtCO2)','Yrs at Current Rate','Implied Peak Year','Portfolio Share (GtCO2)'].map(h => (
                <th key={h} style={{ ...tableHead, textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budgetBarData.map((b, i) => (
              <tr key={i} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={tableCell}><span style={{ color:b.color, fontWeight:600 }}>{b.label.split('/')[0]}</span></td>
                <td style={tableCell}>{b.label.split('/')[1]}</td>
                <td style={{ ...tableCell, fontWeight:600, color:b.color }}>{b.remaining.toLocaleString()}</td>
                <td style={tableCell}>{b.years} yrs</td>
                <td style={tableCell}>{b.peakYear}</td>
                <td style={{ ...tableCell, color:T.amber }}>{b.portfolioShare}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Remaining Budget by Temperature Threshold (GtCO2)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={budgetBarData} margin={{ top:4, right:16, left:0, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="label" tick={{ fill:T.textSec, fontSize:10 }} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} tickFormatter={v => `${v} Gt`} />
            <Tooltip formatter={v => [`${v} GtCO2`, 'Remaining Budget']} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Bar dataKey="remaining" radius={[3,3,0,0]}>
              {budgetBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Budget Drawdown Trajectory 2024–2100 (at 36.8 GtCO2/yr)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={drawdownData} margin={{ top:4, right:16, left:0, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:10 }} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} tickFormatter={v => `${v} Gt`} />
            <Tooltip contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Legend wrapperStyle={{ fontSize:11, color:T.textSec }} />
            <Line type="monotone" dataKey="b15_67" name="1.5°C / 67%" stroke={T.green} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="b20_67" name="2.0°C / 67%" stroke={T.amber} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 3 — WACI & Financed Emissions
══════════════════════════════════════════════════════════════════════════════ */
function Tab3() {
  const waciBarData = holdingsWithITR.map(h => ({
    name: h.name.split(' ')[0],
    waci: h.waci,
    bench: SECTOR_WACI_BENCH[h.sector] || 200,
    color: waciColor(h.waci),
  }));

  const top5 = [...holdingsWithITR].sort((a,b) => b.totalEmissions - a.totalEmissions).slice(0, 5).map(h => ({
    name: h.name.split(' ')[0],
    scope1: h.scope1,
    scope2: h.scope2,
    scope3: h.scope3,
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12 }}>
        <div style={statCard(T.teal)}>
          <div style={{ fontSize:11, color:T.textSec }}>Portfolio WACI</div>
          <div style={{ fontSize:24, fontWeight:700, color:T.teal }}>{portfolioWACI.toFixed(0)}</div>
          <div style={{ fontSize:11, color:T.textMut }}>tCO2/$M revenue (weighted avg)</div>
        </div>
        <div style={statCard(T.amber)}>
          <div style={{ fontSize:11, color:T.textSec }}>Holdings Above Sector Bench</div>
          <div style={{ fontSize:24, fontWeight:700, color:T.amber }}>
            {holdingsWithITR.filter(h => h.waci > (SECTOR_WACI_BENCH[h.sector]||200)).length}/12
          </div>
          <div style={{ fontSize:11, color:T.textMut }}>Exceed IEA NZE WACI target</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          WACI per Holding vs Paris Benchmark (tCO2/$M revenue)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={waciBarData} margin={{ top:4, right:16, left:0, bottom:48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} />
            <Tooltip formatter={(v,n) => [v.toLocaleString(), n]} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Bar dataKey="waci" name="WACI" radius={[3,3,0,0]}>
              {waciBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
            <Bar dataKey="bench" name="Sector Bench" radius={[3,3,0,0]} fill={T.teal} opacity={0.4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Scope 1 + 2 + 3 Emissions — Top 5 Holdings (MtCO2/yr)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={top5} margin={{ top:4, right:16, left:0, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} tickFormatter={v => `${v} Mt`} />
            <Tooltip formatter={v => [`${v} MtCO2`, '']} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Legend wrapperStyle={{ fontSize:11, color:T.textSec }} />
            <Bar dataKey="scope1" name="Scope 1" stackId="s" fill={T.red} />
            <Bar dataKey="scope2" name="Scope 2" stackId="s" fill={T.amber} />
            <Bar dataKey="scope3" name="Scope 3" stackId="s" fill={T.teal} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          WACI Alignment Gap vs IEA NZE Sector Benchmark
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Holding','Sector','WACI','Bench','Gap','Status'].map(h => (
                <th key={h} style={{ ...tableHead, textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdingsWithITR.map((h, i) => {
              const bench = SECTOR_WACI_BENCH[h.sector] || 200;
              const gap = h.waci - bench;
              const aligned = gap <= 0;
              return (
                <tr key={i} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ ...tableCell, fontWeight:500 }}>{h.name}</td>
                  <td style={tableCell}>{h.sector}</td>
                  <td style={{ ...tableCell, color:waciColor(h.waci), fontWeight:600 }}>{h.waci.toFixed(0)}</td>
                  <td style={tableCell}>{bench}</td>
                  <td style={{ ...tableCell, color: aligned ? T.green : T.red }}>
                    {aligned ? '—' : `+${gap.toFixed(0)}`}
                  </td>
                  <td style={{ ...tableCell, color: aligned ? T.green : T.red }}>
                    {aligned ? 'Aligned' : 'Off-track'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 4 — SDA Sector Pathways
══════════════════════════════════════════════════════════════════════════════ */
const ON_TRACK = new Set(['Adani Green Energy','Siemens Energy','EDF Group','ArcelorMittal']);

function Tab4() {
  const [selectedSDA, setSelectedSDA] = useState('power');
  const pathway = SDA_PATHWAYS.find(p => p.sector === selectedSDA) || SDA_PATHWAYS[0];

  const sdaGapData = holdingsWithITR.map(h => {
    const sdaSector = SECTOR_TO_SDA[h.sector] || 'road';
    const sdaPath = SDA_PATHWAYS.find(p => p.sector === sdaSector);
    const bench = sdaPath ? sdaPath.target2030 : 1;
    const currentIntensity = sdaPath ? sdaPath.current : 1;
    const overshoot = +((currentIntensity / bench - 1) * 100).toFixed(1);
    return {
      name: h.name.split(' ')[0],
      overshoot: Math.max(0, overshoot),
      onTrack: ON_TRACK.has(h.name),
      color: ON_TRACK.has(h.name) ? T.green : overshoot > 50 ? T.red : T.amber,
    };
  });

  const sectorLineData = [
    { year: 2020, value: pathway.baseline2020, target: pathway.baseline2020 },
    { year: 2030, value: pathway.current,      target: pathway.target2030 },
    { year: 2040, value: pathway.current * 0.6, target: pathway.target2040 },
    { year: 2050, value: pathway.current * 0.2, target: pathway.target2050 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12 }}>
        <div style={statCard(T.green)}>
          <div style={{ fontSize:11, color:T.textSec }}>On SDA Track</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.green }}>4/12</div>
          <div style={{ fontSize:11, color:T.textMut }}>Adani Green, Siemens, EDF, ArcelorMittal</div>
        </div>
        <div style={statCard(T.red)}>
          <div style={{ fontSize:11, color:T.textSec }}>Off SDA Track</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.red }}>8/12</div>
          <div style={{ fontSize:11, color:T.textMut }}>Require intensity reduction plan</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          SDA 2030 Pathway Overshoot % per Holding
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sdaGapData} margin={{ top:4, right:16, left:0, bottom:48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={v => [`${v}%`, 'SDA Overshoot']} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Bar dataKey="overshoot" name="Overshoot %" radius={[3,3,0,0]}>
              {sdaGapData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>
            Sector Decarbonization Pathway — {pathway.label} ({pathway.unit})
          </div>
          <select
            value={selectedSDA}
            onChange={e => setSelectedSDA(e.target.value)}
            style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.text, borderRadius:4, padding:'4px 8px', fontSize:12 }}
          >
            {SDA_PATHWAYS.map(p => <option key={p.sector} value={p.sector}>{p.label}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sectorLineData} margin={{ top:4, right:16, left:0, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:10 }} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} />
            <Tooltip contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Legend wrapperStyle={{ fontSize:11, color:T.textSec }} />
            <Line type="monotone" dataKey="target" name="SDA Target" stroke={T.green} strokeWidth={2} strokeDasharray="6 3" dot={{ r:4 }} />
            <Line type="monotone" dataKey="value" name="Global Avg Trajectory" stroke={T.amber} strokeWidth={2} dot={{ r:4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 5 — SBTi & Net Zero Target Tracker
══════════════════════════════════════════════════════════════════════════════ */
const SBTI_STATUS = {
  'Adani Green Energy':'Validated', 'Rio Tinto':'Validated', 'Siemens Energy':'Validated',
  'ArcelorMittal':'Validated', 'EDF Group':'Validated',
  'Reliance Industries':'Not Committed', 'Coal India':'Not Committed',
  'NTPC':'Not Committed', 'JSW Steel':'Committed', 'Shell plc':'Committed',
  'Tata Motors':'Committed', 'ArcelorMittal 2':'Not Committed',
};
const INTERIM_2030 = { power:55, steel:30, chemicals:25, mining:28, road:20 };

function Tab5() {
  const nzBarData = holdingsWithITR.map(h => ({
    name: h.name.split(' ')[0],
    years: h.nzTarget ? h.nzTarget - 2024 : 100,
    color: !h.nzTarget ? T.red : h.nzTarget <= 2050 ? T.green : h.nzTarget <= 2060 ? T.amber : T.red,
    label: h.nzTarget ? `${h.nzTarget}` : 'No Target',
  }));

  const validated = Object.values(SBTI_STATUS).filter(s => s==='Validated').length;
  const committed = Object.values(SBTI_STATUS).filter(s => s==='Committed').length;
  const notCommitted = Object.values(SBTI_STATUS).filter(s => s==='Not Committed').length;

  const sbtiCriteria = [
    { criterion:'Scope 1+2 Near-term Target',  coverage:58 },
    { criterion:'Scope 3 Near-term Target',    coverage:33 },
    { criterion:'Long-term Absolute Target',   coverage:50 },
    { criterion:'Base Year Established',       coverage:75 },
    { criterion:'Boundary Coverage >95%',      coverage:67 },
    { criterion:'Third-party Verification',    coverage:42 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <div style={statCard(T.green)}>
          <div style={{ fontSize:11, color:T.textSec }}>SBTi Validated</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.green }}>{validated}</div>
        </div>
        <div style={statCard(T.amber)}>
          <div style={{ fontSize:11, color:T.textSec }}>SBTi Committed</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.amber }}>{committed}</div>
        </div>
        <div style={statCard(T.red)}>
          <div style={{ fontSize:11, color:T.textSec }}>No Target</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.red }}>{notCommitted}</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Years to Net Zero per Holding (from 2024)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={nzBarData} margin={{ top:4, right:16, left:0, bottom:48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} domain={[0, 110]} tickFormatter={v => `${v} yrs`} />
            <Tooltip formatter={(v,n,p) => [`${p.payload.label}`, 'NZ Target Year']} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Bar dataKey="years" name="Years to Net Zero" radius={[3,3,0,0]}>
              {nzBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          SBTi Criteria — Portfolio Coverage
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {sbtiCriteria.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:'0 0 220px', fontSize:12, color:T.textSec }}>{c.criterion}</div>
              <div style={{ flex:1, background:T.bg, borderRadius:4, height:8, overflow:'hidden' }}>
                <div style={{ width:`${c.coverage}%`, height:'100%', background: c.coverage>=67 ? T.green : c.coverage>=40 ? T.amber : T.red, borderRadius:4 }} />
              </div>
              <div style={{ fontSize:12, fontWeight:600, color: c.coverage>=67 ? T.green : c.coverage>=40 ? T.amber : T.red, width:36, textAlign:'right' }}>{c.coverage}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Holding-level SBTi & Net Zero Summary
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Holding','SBTi Status','NZ Target','2030 Reduction','ITR'].map(h => (
                <th key={h} style={{ ...tableHead, textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdingsWithITR.map((h, i) => {
              const status = SBTI_STATUS[h.name] || 'Not Committed';
              const statusColor = status==='Validated' ? T.green : status==='Committed' ? T.amber : T.red;
              const red2030 = INTERIM_2030[h.sector] || 25;
              return (
                <tr key={i} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ ...tableCell, fontWeight:500 }}>{h.name}</td>
                  <td style={{ ...tableCell, color:statusColor, fontWeight:600 }}>{status}</td>
                  <td style={{ ...tableCell, color: h.nzTarget ? (h.nzTarget<=2050?T.green:T.amber) : T.red }}>
                    {h.nzTarget || 'None'}
                  </td>
                  <td style={{ ...tableCell, color:T.teal }}>{red2030}%</td>
                  <td style={{ ...tableCell, color:itrColor(h.itr), fontWeight:600 }}>{h.itr}°C</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 6 — Engagement Priorities
══════════════════════════════════════════════════════════════════════════════ */
const ENGAGE_ASKS = {
  'Coal India':          { ask:'Publish net-zero roadmap & commit to SBTi by 2026',     timeline:'12 months', impact:'−0.8°C ITR if adopted' },
  'NTPC':                { ask:'Accelerate renewable capacity to 60 GW by 2032',         timeline:'18 months', impact:'−0.5°C ITR' },
  'Shell plc':           { ask:'Strengthen Scope 3 absolute reduction target to −40%',   timeline:'6 months',  impact:'−0.3°C ITR' },
  'ArcelorMittal 2':     { ask:'Align to SBTi and publish interim 2030 steel intensity', timeline:'12 months', impact:'−0.4°C ITR' },
  'Reliance Industries': { ask:'Set SBTi-aligned net-zero target with Scope 3 pathway',  timeline:'12 months', impact:'−0.3°C ITR' },
};

function Tab6() {
  const engageData = holdingsWithITR.map(h => {
    const sdaSector = SECTOR_TO_SDA[h.sector] || 'road';
    const sdaPath = SDA_PATHWAYS.find(p => p.sector === sdaSector);
    const sdaGap = sdaPath ? Math.max(0, (sdaPath.current / sdaPath.target2030 - 1) * 100) : 50;
    const score = +( h.itr * h.weight * (h.sbti ? 0.5 : 1.5) * sdaGap / 100 ).toFixed(4);
    return { ...h, engageScore: score, sdaGap, color: score > 0.3 ? T.red : score > 0.15 ? T.amber : T.green };
  }).sort((a,b) => b.engageScore - a.engageScore);

  const top5 = engageData.slice(0, 5);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Engagement Priority Score = ITR × Weight × (SBTi?0.5:1.5) × SDA Gap/100
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={engageData.map(h => ({ name: h.name.split(' ')[0], score: h.engageScore, color: h.color }))}
            margin={{ top:4, right:16, left:0, bottom:48 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textSec, fontSize:10 }} tickFormatter={v => v.toFixed(2)} />
            <Tooltip formatter={v => [v.toFixed(4), 'Priority Score']} contentStyle={{ background:T.surface, border:`1px solid ${T.border}` }} labelStyle={{ color:T.text }} />
            <Bar dataKey="score" name="Priority Score" radius={[3,3,0,0]}>
              {engageData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:T.textSec }}>
          <span style={{ color:T.red }}>● >0.30 High Priority</span>
          <span style={{ color:T.amber }}>● 0.15–0.30 Medium</span>
          <span style={{ color:T.green }}>● ≤0.15 Monitoring</span>
        </div>
      </div>

      <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Top 5 Engagement Actions</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {top5.map((h, i) => {
          const action = ENGAGE_ASKS[h.name] || {
            ask: 'Commit to SBTi near-term target and disclose Scope 3 emissions',
            timeline: '12 months',
            impact: `−${(h.itr * 0.1).toFixed(1)}°C ITR if adopted`,
          };
          return (
            <div key={i} style={{ ...card, borderLeft:`3px solid ${h.color}`, display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ flex:'0 0 24px', width:24, height:24, borderRadius:'50%', background:h.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#000', flexShrink:0 }}>
                {i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:T.text, fontSize:13, marginBottom:4 }}>{h.name}</div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:6 }}>{action.ask}</div>
                <div style={{ display:'flex', gap:20, fontSize:11, flexWrap:'wrap' }}>
                  <span style={{ color:T.amber }}>Timeline: {action.timeline}</span>
                  <span style={{ color:T.green }}>Impact: {action.impact}</span>
                  <span style={{ color:T.textMut }}>ITR: {h.itr}°C</span>
                  <span style={{ color:T.textMut }}>Weight: {(h.weight*100).toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ fontSize:18, fontWeight:700, color:h.color }}>{h.engageScore.toFixed(3)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ ...card, background:'rgba(249,115,22,0.08)', borderColor:ACCENT, borderLeft:`3px solid ${ACCENT}` }}>
        <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>Cross-module Analysis</div>
        <div style={{ fontSize:13, color:T.text }}>
          See Portfolio Climate VaR →{' '}
          <a href="/portfolio-climate-var" style={{ color:ACCENT, textDecoration:'none' }}>/portfolio-climate-var</a>
          {'  |  '}
          Implied Temp Regression →{' '}
          <a href="/implied-temp-regression" style={{ color:ACCENT, textDecoration:'none' }}>/implied-temp-regression</a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function TemperatureAlignmentPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [<Tab1 />, <Tab2 />, <Tab3 />, <Tab4 />, <Tab5 />, <Tab6 />];

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px', color:T.text }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ width:4, height:24, background:ACCENT, borderRadius:2 }} />
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:T.text }}>Temperature Alignment</h1>
          <span style={{ fontSize:11, background:'rgba(249,115,22,0.15)', color:ACCENT, padding:'2px 8px', borderRadius:4, fontWeight:600 }}>
            IPCC AR6 · SDA · SBTi
          </span>
        </div>
        <p style={{ margin:0, fontSize:12, color:T.textSec }}>
          Portfolio ITR computed from IPCC AR6 WG1 Table SPM.2 carbon budgets · Science-Based Decarbonization pathways · 12 holdings
        </p>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap', borderBottom:`1px solid ${T.border}` }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding:'8px 14px', fontSize:12, fontWeight:500, border:'none', cursor:'pointer', borderRadius:'4px 4px 0 0',
              background: activeTab===i ? T.surface : 'transparent',
              color: activeTab===i ? T.text : T.textMut,
              borderBottom: activeTab===i ? `2px solid ${ACCENT}` : '2px solid transparent',
              transition:'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>{tabContent[activeTab]}</div>
    </div>
  );
}
