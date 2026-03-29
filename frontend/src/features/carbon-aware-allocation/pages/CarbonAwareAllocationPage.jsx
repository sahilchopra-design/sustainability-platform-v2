import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, ZAxis,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

// ─── STATIC DATA ────────────────────────────────────────────────────────────

const TABS = [
  'Carbon Budget Overview',
  'Sector Carbon Weights',
  'NGFS Scenario Allocation',
  'Pathway Tracker',
  'Carbon Efficiency Frontier',
  'Rebalancing Tracker',
];

const BADGES = ['NGFS IV', 'Carbon Budget', 'Sector Tilt', 'Paris Pathway'];

// Tab 1 — Carbon Budget
const kpis1 = [
  { label:'Portfolio WACI', value:'175', unit:'tCO₂e/$M rev', delta:null, color:T.amber },
  { label:'Budget-Aligned WACI Target (2030)', value:'120', unit:'tCO₂e/$M rev', delta:'-31%', color:T.sage },
  { label:'Annual Reduction Required', value:'-8.5%', unit:'per year', delta:null, color:T.navyL },
  { label:'Budget Exhaustion Year', value:'2031', unit:'at current pace', delta:'+7 yrs early', color:T.red },
];

const carbonTrajectory = (() => {
  const base = 175;
  return Array.from({ length: 27 }, (_, i) => {
    const yr = 2024 + i;
    const portfolio = i === 0 ? base : base * Math.pow(1 - 0.02 - sr(i) * 0.01, i);
    const paris15  = base * Math.pow(1 - 0.085, i);
    const paris2   = base * Math.pow(1 - 0.055, i);
    return { year: yr, portfolio: +portfolio.toFixed(1), paris15: +paris15.toFixed(1), paris2: +paris2.toFixed(1) };
  });
})();

const financedEmissions = [
  { scope:'Scope 1+2', mt:4.2, color:T.red },
  { scope:'Scope 3 Financed', mt:11.8, color:T.amber },
  { scope:'Scope 3 Upstream', mt:3.1, color:T.gold },
];

// Tab 2 — Sector Carbon Weights
const SECTORS = ['Energy','Materials','Utilities','Industrials','Cons Disc','Cons Staples','Health Care','Financials','IT','Comm Svcs','Real Estate'];
const sectorData = [
  { sector:'Energy',       port:4.8, bench:2.7, waci:680, contrib:14.2, target:2.9 },
  { sector:'Materials',    port:6.1, bench:4.3, waci:410, contrib:11.4, target:4.8 },
  { sector:'Utilities',    port:2.4, bench:2.8, waci:520, contrib: 5.7, target:5.2 },
  { sector:'Industrials',  port:9.8, bench:10.1,waci:185, contrib: 8.2, target:9.9 },
  { sector:'Cons Disc',    port:11.2,bench:11.9,waci:95,  contrib: 4.8, target:11.5 },
  { sector:'Cons Staples', port:6.8, bench:7.1, waci:110, contrib: 3.4, target:7.0 },
  { sector:'Health Care',  port:13.1,bench:12.8,waci:42,  contrib: 2.5, target:13.2 },
  { sector:'Financials',   port:15.2,bench:15.8,waci:55,  contrib: 3.8, target:15.6 },
  { sector:'IT',           port:22.1,bench:23.4,waci:28,  contrib: 2.8, target:23.1 },
  { sector:'Comm Svcs',    port:5.8, bench:6.1, waci:65,  contrib: 1.7, target:6.0 },
  { sector:'Real Estate',  port:2.7, bench:3.0, waci:145, contrib: 1.5, target:3.0 },
];

// Tab 3 — NGFS Scenario Allocation
const ngfsData = SECTORS.map((s, i) => {
  const row = sectorData[i];
  const nz   = s==='Energy'?2.1:s==='Utilities'?9.2:+(row.bench*(0.85+sr(i*3)*0.3)).toFixed(1);
  const b2   = s==='Energy'?3.2:s==='Utilities'?6.8:+(row.bench*(0.9+sr(i*5)*0.25)).toFixed(1);
  const del  = s==='Energy'?4.1:s==='Utilities'?4.4:+(row.bench*(0.95+sr(i*7)*0.2)).toFixed(1);
  const cur  = +(row.bench*(1.0+sr(i*11)*0.1)).toFixed(1);
  return { sector:s, nz2050:nz, below2c:b2, delayed:del, current:cur };
});

const scenarioReturns = [
  { scenario:'Net Zero 2050',     ret:9.8, risk:12.1, color:T.sage },
  { scenario:'Below 2°C',         ret:10.2, risk:13.4, color:T.navyL },
  { scenario:'Delayed Transition', ret:8.4, risk:16.8, color:T.amber },
  { scenario:'Current Policies',   ret:7.1, risk:19.2, color:T.red },
];

// Tab 4 — Pathway Tracker
const pathwayData = (() => {
  return Array.from({ length: 27 }, (_, i) => {
    const yr = 2024 + i;
    const actual = i <= 0 ? 175 : null;
    const forecast = i >= 0 ? +(175 * Math.pow(1 - 0.0485, i)).toFixed(1) : null;
    const sbti   = +(175 * Math.pow(1 - 0.085, i)).toFixed(1);
    const iea    = +(175 * Math.pow(1 - 0.09, i)).toFixed(1);
    const paris  = +(175 * Math.pow(1 - 0.095, i)).toFixed(1);
    return { year: yr, actual, forecast, sbti, iea, paris15: paris };
  });
})();

const decarbTable = [
  { year:2021, waci:210, reduction:null },
  { year:2022, waci:198, reduction:-5.7 },
  { year:2023, waci:185, reduction:-6.6 },
  { year:2024, waci:175, reduction:-5.4 },
];

// Tab 5 — Carbon Efficiency Frontier
const frontierPoints = Array.from({ length: 50 }, (_, i) => ({
  waci: +(50 + sr(i*13)*300).toFixed(1),
  ret:  +(8 + sr(i*17)*5).toFixed(2),
  size: 60,
}));

const altPortfolios = [
  { label:'Current Portfolio',    waci:175, ret:10.4, color:T.navy },
  { label:'Carbon-Optimised',     waci:95,  ret:10.1, color:T.sage },
  { label:'Paris-Aligned',        waci:75,  ret:9.6,  color:T.green },
  { label:'Unconstrained',        waci:285, ret:11.2, color:T.red },
];

const decileReturns = Array.from({ length: 10 }, (_, i) => ({
  decile: `D${i+1}`,
  alpha: +((2.1 - i*0.42) + sr(i*19)*0.3 - 0.15).toFixed(2),
  color: i < 3 ? T.sage : i > 6 ? T.red : T.amber,
}));

// Tab 6 — Rebalancing Tracker
const rebalTable = (() => {
  const months = ['Mar-24','Apr-24','May-24','Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24','Jan-25','Feb-25'];
  let waci = 224;
  return months.map((m, i) => {
    const waciEnd = +(waci - 4.2 - sr(i*23)*2.1).toFixed(1);
    const trades  = Math.round(3 + sr(i*31)*8);
    const turnover = +(0.4 + sr(i*37)*0.9).toFixed(2);
    const tcost   = +(1.1 + sr(i*41)*0.8).toFixed(1);
    const row = { month:m, waciStart:+waci.toFixed(1), waciEnd, trades, turnover, tcost };
    waci = waciEnd;
    return row;
  });
})();

const rebalKpis = [
  { label:'Cumulative WACI Reduction', value:'22%', color:T.sage },
  { label:'Annualised Turnover (Carbon Mgmt)', value:'8.3%', color:T.navyL },
  { label:'Transaction Cost Drag', value:'-14 bps/yr', color:T.amber },
];

const nextRebal = {
  trim:  [{ sector:'Energy', pct:-1.9 }, { sector:'Materials', pct:-1.4 }],
  add:   [{ sector:'Clean Utilities', pct:+2.1 }, { sector:'IT', pct:+1.2 }],
  calendar: [
    { date:'Apr 2025', action:'Quarterly reweight — trim high-carbon positions' },
    { date:'May 2025', action:'ESG factor tilt — add low-WACI IT & Healthcare' },
    { date:'Jun 2025', action:'Mid-year pathway review vs SBTi milestone' },
  ],
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

const KpiCard = ({ label, value, unit, delta, color }) => (
  <div style={{
    background: T.surface, borderRadius: 10, padding: '18px 22px',
    boxShadow: T.card, border: `1px solid ${T.border}`, flex: 1, minWidth: 180,
  }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{unit}</div>
    {delta && <div style={{ fontSize: 11, color: T.green, marginTop: 6, fontWeight: 600 }}>{delta}</div>}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{children}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Panel = ({ children, style }) => (
  <div style={{
    background: T.surface, borderRadius: 12, padding: '20px 22px',
    boxShadow: T.card, border: `1px solid ${T.border}`, ...style,
  }}>
    {children}
  </div>
);

const AlertBanner = ({ text, level }) => {
  const bg = level === 'warn' ? '#fff7ed' : level === 'danger' ? '#fef2f2' : '#f0fdf4';
  const border = level === 'warn' ? T.amber : level === 'danger' ? T.red : T.green;
  const icon = level === 'warn' ? '⚠' : level === 'danger' ? '✕' : '✓';
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderLeft: `4px solid ${border}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 13, color: T.text,
      display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16,
    }}>
      <span style={{ color: border, fontWeight: 700, marginTop: 1 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
};

// ─── TAB 1 ───────────────────────────────────────────────────────────────────

const Tab1 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
    <div style={{ display:'flex', gap: 14, flexWrap:'wrap' }}>
      {kpis1.map(k => <KpiCard key={k.label} {...k} />)}
    </div>

    <Panel>
      <SectionTitle sub="Portfolio carbon trajectory vs Paris-aligned pathways (2024–2050)">
        Portfolio Carbon Trajectory
      </SectionTitle>
      <div style={{ fontSize:12, color:T.textSec, marginBottom:10 }}>
        WACI (tCO₂e per $M revenue) — portfolio exhausts 1.5°C budget by <strong>2031</strong> at current pace.
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={carbonTrajectory} margin={{ top:5, right:20, bottom:5, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} interval={4} />
          <YAxis tick={{ fontSize:11, fill:T.textMut }} unit="" />
          <Tooltip contentStyle={{ fontSize:12 }} formatter={(v,n) => [v+' tCO₂e/$M', n]} />
          <Legend wrapperStyle={{ fontSize:12 }} />
          <ReferenceLine x={2031} stroke={T.red} strokeDasharray="4 2" label={{ value:'Budget Exhaustion', fill:T.red, fontSize:10 }} />
          <ReferenceLine x={2043} stroke={T.amber} strokeDasharray="4 2" label={{ value:'2°C Exhaustion', fill:T.amber, fontSize:10 }} />
          <Line type="monotone" dataKey="portfolio" stroke={T.navy} strokeWidth={2.5} name="Portfolio" dot={false} />
          <Line type="monotone" dataKey="paris15"   stroke={T.sage} strokeWidth={2} strokeDasharray="6 3" name="Paris 1.5°C" dot={false} />
          <Line type="monotone" dataKey="paris2"    stroke={T.gold} strokeWidth={2} strokeDasharray="6 3" name="Paris 2°C" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Panel>

    <Panel>
      <SectionTitle sub="Absolute financed emissions by scope (Mt CO₂e)">Financed Emissions Breakdown</SectionTitle>
      <div style={{ display:'flex', gap: 20, flexWrap:'wrap', marginTop: 8 }}>
        {financedEmissions.map(f => (
          <div key={f.scope} style={{
            background: T.bg, borderRadius: 8, padding:'14px 20px',
            border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:14, flex:1,
          }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:f.color, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>{f.scope}</div>
              <div style={{ fontSize:22, fontWeight:700, color:f.color }}>{f.mt}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Mt CO₂e (financed)</div>
            </div>
          </div>
        ))}
        <div style={{
          background:'#fef2f2', borderRadius:8, padding:'14px 20px',
          border:`1px solid ${T.red}20`, flex:1,
        }}>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Total Financed Emissions</div>
          <div style={{ fontSize:22, fontWeight:700, color:T.red }}>19.1</div>
          <div style={{ fontSize:11, color:T.textSec }}>Mt CO₂e (all scopes)</div>
        </div>
      </div>
    </Panel>
  </div>
);

// ─── TAB 2 ───────────────────────────────────────────────────────────────────

const Tab2 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
    <AlertBanner
      level="warn"
      text="Portfolio is overweight high-carbon sectors: Energy (+2.1% vs benchmark), Materials (+1.8% vs benchmark). These two sectors contribute 25.6% of portfolio WACI despite being 10.9% of weight."
    />

    <Panel>
      <SectionTitle sub="Current weight vs MSCI ACWI benchmark by GICS sector">
        Sector Weight vs Benchmark
      </SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sectorData} margin={{ top:5, right:20, bottom:30, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="sector" tick={{ fontSize:10, fill:T.textMut }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize:11, fill:T.textMut }} unit="%" />
          <Tooltip contentStyle={{ fontSize:12 }} formatter={(v,n) => [v+'%', n]} />
          <Legend wrapperStyle={{ fontSize:12 }} />
          <Bar dataKey="port"  name="Portfolio" radius={[3,3,0,0]}>
            {sectorData.map((d, i) => (
              <Cell key={i} fill={
                (d.sector==='Energy'||d.sector==='Materials') && d.port > d.bench ? T.red :
                d.port < d.bench ? T.sage : T.navyL
              } />
            ))}
          </Bar>
          <Bar dataKey="bench" name="Benchmark (ACWI)" fill={T.border} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>

    <Panel>
      <SectionTitle sub="Sector detail: WACI, active weight, carbon contribution, carbon-efficient target">
        Sector Carbon Detail
      </SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.bg }}>
              {['Sector','Port Wt%','Bench Wt%','Active Wt%','WACI','Carbon Contrib%','Target Wt%'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectorData.map((d, i) => {
              const active = +(d.port - d.bench).toFixed(1);
              const isHigh = d.sector==='Energy'||d.sector==='Materials';
              return (
                <tr key={i} style={{ background: i%2===0?T.surface:T.bg }}>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:T.text }}>{d.sector}</td>
                  <td style={{ padding:'7px 10px', color:T.text }}>{d.port}%</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{d.bench}%</td>
                  <td style={{ padding:'7px 10px', color: active>0?T.red:T.sage, fontWeight:600 }}>{active>0?'+':''}{active}%</td>
                  <td style={{ padding:'7px 10px', color: d.waci>300?T.red:d.waci>150?T.amber:T.sage, fontWeight:600 }}>{d.waci}</td>
                  <td style={{ padding:'7px 10px', color: isHigh?T.red:T.text }}>{d.contrib}%</td>
                  <td style={{ padding:'7px 10px', color:T.navyL, fontWeight:600 }}>{d.target}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, padding:'10px 14px', background:'#f0fdf4', borderRadius:8, fontSize:12, color:T.text, border:`1px solid ${T.sage}30` }}>
        Carbon-efficient reweight achieves <strong>30% WACI reduction</strong> (175→122 tCO₂e/$M) with estimated <strong>tracking error of 1.8%</strong> vs MSCI ACWI.
      </div>
    </Panel>
  </div>
);

// ─── TAB 3 ───────────────────────────────────────────────────────────────────

const Tab3 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
    <Panel>
      <SectionTitle sub="Optimal sector allocation under NGFS Phase IV scenarios">
        NGFS Phase IV Scenario — Optimal Sector Weights
      </SectionTitle>
      <div style={{ fontSize:12, color:T.textSec, marginBottom:10 }}>
        Under <strong>Net Zero 2050</strong>: Energy drops to 2.1% (from 4.8% benchmark); Clean Utilities rises to 9.2% (from 3.1%). Derived from scenario-specific carbon prices and stranded asset timelines.
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={ngfsData} margin={{ top:5, right:20, bottom:30, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="sector" tick={{ fontSize:10, fill:T.textMut }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize:11, fill:T.textMut }} unit="%" />
          <Tooltip contentStyle={{ fontSize:12 }} formatter={(v,n) => [v+'%', n]} />
          <Legend wrapperStyle={{ fontSize:12 }} />
          <Bar dataKey="nz2050"  name="Net Zero 2050"    fill={T.sage}   radius={[2,2,0,0]} />
          <Bar dataKey="below2c" name="Below 2°C"        fill={T.navyL}  radius={[2,2,0,0]} />
          <Bar dataKey="delayed" name="Delayed Transition" fill={T.amber} radius={[2,2,0,0]} />
          <Bar dataKey="current" name="Current Policies" fill={T.red}    radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>

    <Panel>
      <SectionTitle sub="Expected portfolio return and risk by NGFS scenario">
        Portfolio Expected Return by Scenario
      </SectionTitle>
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        {scenarioReturns.map(s => (
          <div key={s.scenario} style={{
            flex:1, minWidth:160, background:T.bg, borderRadius:10,
            padding:'16px 18px', border:`1px solid ${T.border}`,
          }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>{s.scenario}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.ret}%</div>
            <div style={{ fontSize:11, color:T.textSec }}>Expected Return (ann.)</div>
            <div style={{ fontSize:12, color:T.textMut, marginTop:6 }}>Volatility: {s.risk}%</div>
            <div style={{ marginTop:8, height:4, borderRadius:2, background:`${s.color}30` }}>
              <div style={{ height:'100%', width:`${s.ret*8}%`, background:s.color, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  </div>
);

// ─── TAB 4 ───────────────────────────────────────────────────────────────────

const Tab4 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
    <AlertBanner
      level="danger"
      text="Portfolio is 28% above the 2030 SBTi milestone — requires an additional 3.2% annual reduction to achieve 50%-by-2030 target (vs 2020 base of 224 tCO₂e/$M)."
    />

    <Panel>
      <SectionTitle sub="Portfolio decarbonisation trajectory vs SBTi, IEA NZE, and Paris 1.5°C pathway (2024–2050)">
        Decarbonisation Pathway Tracker
      </SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={pathwayData} margin={{ top:5, right:20, bottom:5, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} interval={4} />
          <YAxis tick={{ fontSize:11, fill:T.textMut }} />
          <Tooltip contentStyle={{ fontSize:12 }} formatter={(v,n) => [v?v+' tCO₂e/$M':'—', n]} />
          <Legend wrapperStyle={{ fontSize:12 }} />
          <ReferenceLine x={2030} stroke={T.navyL} strokeDasharray="4 2" label={{ value:'2030 Milestone', fill:T.navyL, fontSize:10 }} />
          <ReferenceLine x={2050} stroke={T.sage}  strokeDasharray="4 2" label={{ value:'Net Zero', fill:T.sage, fontSize:10 }} />
          <Line type="monotone" dataKey="actual"   stroke={T.navy}  strokeWidth={3} name="Actual (2024)" dot={{ r:5, fill:T.navy }} connectNulls={false} />
          <Line type="monotone" dataKey="forecast" stroke={T.navy}  strokeWidth={2} strokeDasharray="6 3" name="Portfolio Forecast" dot={false} connectNulls />
          <Line type="monotone" dataKey="sbti"     stroke={T.red}   strokeWidth={2} name="SBTi Pathway" dot={false} />
          <Line type="monotone" dataKey="iea"      stroke={T.amber} strokeWidth={2} name="IEA NZE" dot={false} />
          <Line type="monotone" dataKey="paris15"  stroke={T.sage}  strokeWidth={2} name="Paris 1.5°C" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Panel>

    <Panel>
      <SectionTitle sub="Annual decarbonisation rate — historical track record">
        Annual Decarbonisation Rate (2021–2024)
      </SectionTitle>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:T.bg }}>
            {['Year','Portfolio WACI','YoY Reduction','vs SBTi -8.5%/yr Target','Status'].map(h => (
              <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {decarbTable.map((d, i) => {
            const vsTarget = d.reduction ? +(d.reduction - (-8.5)).toFixed(1) : null;
            const ok = vsTarget !== null && vsTarget >= 0;
            return (
              <tr key={i} style={{ background: i%2===0?T.surface:T.bg }}>
                <td style={{ padding:'8px 12px', fontWeight:600, color:T.text }}>{d.year}</td>
                <td style={{ padding:'8px 12px', color:T.text }}>{d.waci} tCO₂e/$M</td>
                <td style={{ padding:'8px 12px', color:d.reduction?T.sage:T.textMut, fontWeight:600 }}>
                  {d.reduction ? d.reduction+'%' : '—'}
                </td>
                <td style={{ padding:'8px 12px', color:vsTarget!==null?(ok?T.green:T.red):T.textMut }}>
                  {vsTarget !== null ? (vsTarget >= 0 ? `+${vsTarget}% ahead` : `${vsTarget}% behind`) : '—'}
                </td>
                <td style={{ padding:'8px 12px' }}>
                  {d.reduction ? (
                    <span style={{ background: ok?'#f0fdf4':'#fef2f2', color:ok?T.green:T.red, padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600 }}>
                      {ok ? 'On Track' : 'Off Track'}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  </div>
);

// ─── TAB 5 ───────────────────────────────────────────────────────────────────

const Tab5 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
    <Panel>
      <SectionTitle sub="Return vs carbon intensity tradeoff across 50 portfolio constructions — MSCI 2024 low-carbon factor research">
        Carbon Efficiency Frontier
      </SectionTitle>
      <div style={{ display:'flex', gap:10, marginBottom:10, fontSize:11 }}>
        {[
          { label:'Paris-Aligned (WACI <120)', color:T.sage },
          { label:'Transition Zone (120–200)', color:T.amber },
          { label:'High Carbon (>200)', color:T.red },
        ].map(r => (
          <div key={r.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:r.color, opacity:0.5 }} />
            <span style={{ color:T.textSec }}>{r.label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top:10, right:20, bottom:20, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" dataKey="waci" name="WACI" domain={[30,380]} tick={{ fontSize:11, fill:T.textMut }} label={{ value:'WACI (tCO₂e/$M revenue)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
          <YAxis type="number" dataKey="ret"  name="Return" domain={[7,14]} tick={{ fontSize:11, fill:T.textMut }} label={{ value:'Expected Return (%)', angle:-90, position:'insideLeft', offset:10, fontSize:11, fill:T.textSec }} />
          <ZAxis range={[50, 50]} />
          <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:12 }} formatter={(v, n) => [n==='waci'?v+' tCO₂e/$M':v+'%', n==='waci'?'WACI':'Return']} />
          <Scatter data={frontierPoints} name="Portfolio Combinations">
            {frontierPoints.map((d, i) => (
              <Cell key={i} fill={d.waci<120?T.sage:d.waci<200?T.amber:T.red} fillOpacity={0.55} />
            ))}
          </Scatter>
          {altPortfolios.map(p => (
            <Scatter key={p.label} data={[{ waci:p.waci, ret:p.ret, size:120 }]} name={p.label} fill={p.color} shape="diamond">
              <Cell fill={p.color} />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
        {altPortfolios.map(p => (
          <div key={p.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:p.color }} />
            <span style={{ color:T.text, fontWeight:600 }}>{p.label}</span>
            <span style={{ color:T.textSec }}>WACI: {p.waci} | Ret: {p.ret}%</span>
          </div>
        ))}
      </div>
    </Panel>

    <Panel>
      <SectionTitle sub="Alpha by carbon intensity decile — Decile 1 = lowest carbon, Decile 10 = highest (MSCI 2024)">
        Carbon Intensity Decile Returns
      </SectionTitle>
      <div style={{ fontSize:12, color:T.textSec, marginBottom:10 }}>
        Low-carbon companies (Decile 1) generate <strong>+2.1% alpha annually</strong> vs high-carbon (Decile 10) — consistent with MSCI 2024 low-carbon factor research.
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={decileReturns} margin={{ top:5, right:20, bottom:5, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="decile" tick={{ fontSize:11, fill:T.textMut }} />
          <YAxis tick={{ fontSize:11, fill:T.textMut }} unit="%" />
          <Tooltip contentStyle={{ fontSize:12 }} formatter={(v) => [v+'%', 'Annual Alpha']} />
          <ReferenceLine y={0} stroke={T.border} />
          <Bar dataKey="alpha" name="Annual Alpha %" radius={[3,3,0,0]}>
            {decileReturns.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  </div>
);

// ─── TAB 6 ───────────────────────────────────────────────────────────────────

const Tab6 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
      {rebalKpis.map(k => (
        <div key={k.label} style={{
          flex:1, minWidth:180, background:T.surface, borderRadius:10,
          padding:'16px 20px', boxShadow:T.card, border:`1px solid ${T.border}`,
        }}>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>{k.label}</div>
          <div style={{ fontSize:24, fontWeight:700, color:k.color }}>{k.value}</div>
        </div>
      ))}
    </div>

    <Panel>
      <SectionTitle sub="Monthly rebalancing actions — Mar 2024 to Feb 2025">
        Rebalancing History (12 months)
      </SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.bg }}>
              {['Month','WACI Start','WACI End','WACI Change','Trades','Turnover %','Transaction Cost (bps)'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rebalTable.map((r, i) => {
              const delta = +(r.waciEnd - r.waciStart).toFixed(1);
              return (
                <tr key={i} style={{ background: i%2===0?T.surface:T.bg }}>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:T.text }}>{r.month}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{r.waciStart}</td>
                  <td style={{ padding:'7px 10px', color:T.text }}>{r.waciEnd}</td>
                  <td style={{ padding:'7px 10px', color:delta<0?T.green:T.red, fontWeight:600 }}>{delta>0?'+':''}{delta}</td>
                  <td style={{ padding:'7px 10px', color:T.text }}>{r.trades}</td>
                  <td style={{ padding:'7px 10px', color:T.text }}>{r.turnover}%</td>
                  <td style={{ padding:'7px 10px', color:T.amber }}>{r.tcost}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>

    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Panel style={{ flex:1, minWidth:260 }}>
        <SectionTitle sub="Next rebalancing recommendation">Recommended Trades</SectionTitle>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:T.red, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Trim (High Carbon)</div>
          {nextRebal.trim.map(t => (
            <div key={t.sector} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
              <span style={{ color:T.text, fontWeight:600 }}>{t.sector}</span>
              <span style={{ color:T.red, fontWeight:700 }}>{t.pct}%</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize:11, color:T.green, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Add (Low Carbon)</div>
          {nextRebal.add.map(t => (
            <div key={t.sector} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
              <span style={{ color:T.text, fontWeight:600 }}>{t.sector}</span>
              <span style={{ color:T.green, fontWeight:700 }}>+{t.pct}%</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel style={{ flex:1, minWidth:260 }}>
        <SectionTitle sub="Q2 2025 implementation schedule">Implementation Calendar</SectionTitle>
        {nextRebal.calendar.map((c, i) => (
          <div key={i} style={{
            display:'flex', gap:12, padding:'10px 0',
            borderBottom: i < nextRebal.calendar.length-1 ? `1px solid ${T.border}` : 'none',
          }}>
            <div style={{
              background: T.navyL, color:'#fff', borderRadius:6,
              padding:'4px 10px', fontSize:11, fontWeight:700, whiteSpace:'nowrap', alignSelf:'flex-start',
            }}>{c.date}</div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.5 }}>{c.action}</div>
          </div>
        ))}
        <div style={{ marginTop:12, padding:'10px 12px', background:'#f0fdf4', borderRadius:8, fontSize:12, color:T.text, border:`1px solid ${T.sage}30` }}>
          Target WACI post Q2 rebalance: <strong>158 tCO₂e/$M</strong> (−9.7% from current 175).
        </div>
      </Panel>
    </div>
  </div>
);

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

const TAB_COMPONENTS = [Tab1, Tab2, Tab3, Tab4, Tab5, Tab6];

export default function CarbonAwareAllocationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight:'100vh', color: T.text }}>
      {/* Header */}
      <div style={{
        background: T.navy,
        padding: '24px 32px 20px',
        borderBottom: `3px solid ${T.gold}`,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.gold, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>EP-AF2</span>
              <span style={{ width:1, height:12, background:T.navyL }} />
              <span style={{ fontSize:11, color:T.textMut }}>Carbon Finance</span>
            </div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
              Carbon-Aware Asset Allocation
            </h1>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'rgba(255,255,255,0.6)' }}>
              WACI optimisation · Carbon budget tracking · NGFS IV scenario allocation · Paris pathway compliance
            </p>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignSelf:'flex-end' }}>
            {BADGES.map(b => (
              <span key={b} style={{
                background:'rgba(197,169,106,0.18)', border:`1px solid ${T.gold}60`,
                color: T.gold, borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:600,
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        background: T.surface, borderBottom:`1px solid ${T.border}`,
        padding:'0 32px', display:'flex', gap:0, overflowX:'auto',
      }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              background:'none', border:'none', cursor:'pointer',
              padding:'14px 18px', fontSize:13, fontWeight: activeTab===i ? 700 : 500,
              color: activeTab===i ? T.navy : T.textSec,
              borderBottom: activeTab===i ? `2.5px solid ${T.navy}` : '2.5px solid transparent',
              whiteSpace:'nowrap', transition:'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'24px 32px 48px' }}>
        <ActiveComponent />
      </div>

      {/* Footer */}
      <div style={{
        borderTop:`1px solid ${T.border}`, padding:'12px 32px',
        background:T.surface, display:'flex', justifyContent:'space-between',
        flexWrap:'wrap', gap:8, fontSize:11, color:T.textMut,
      }}>
        <span>EP-AF2 · Carbon-Aware Asset Allocation · AA Impact Risk Analytics Platform</span>
        <span>Data: MSCI 2024 Low-Carbon Factor Research · NGFS Phase IV · SBTi Corporate Net Zero Standard · IEA NZE 2050</span>
      </div>
    </div>
  );
}
