import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

function sr(seed) { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; }; }

const TABS = ['Alignment Dashboard', 'Decarbonization Pathway', 'Asset Alignment', 'ITR Analysis', 'PAII Framework'];

/* ---- Data Generation ---- */
const r = sr(20260405);
const rr = (lo, hi) => lo + r() * (hi - lo);
const ri = (lo, hi) => Math.round(rr(lo, hi));

const sectors = ['Energy','Materials','Industrials','Utilities','Tech','Healthcare','Financials','Consumer Disc','Consumer Staples','Real Estate'];
const names = ['NordicGreen Energy','Solaris Materials','TerraForge Industries','AquaPower Utilities',
  'QuantumLeap Tech','BioNova Health','Meridian Capital','LuxeRetail Group','HarvestPrime Foods',
  'UrbanCore REIT','CleanGrid Solutions','AlpineSteel Corp','PrecisionAero','HydroVolt Power',
  'CyberNest Systems','MediTrust Pharma','GlobalFin Partners','EcoStyle Brands','PureFarm Organic',
  'MetroLand Properties','SunPeak Solar','GreyCement Ltd','AeroJet Dynamics','WindRise Energy'];

const sbtiStatuses = ['Set','Committed','None'];
const alignCats = ['Aligned','Aligning','Not Aligned','Achieving'];
const alignColors = { Aligned: T.green, Aligning: T.blue, 'Not Aligned': T.red, Achieving: T.teal };

const holdings = names.map((name, i) => {
  const sect = sectors[i % sectors.length];
  const w = rr(1.5, 8.5);
  const waci = rr(20, 450);
  const sbti = sbtiStatuses[ri(0, 2)];
  const cat = alignCats[ri(0, 3)];
  const itr = rr(1.2, 3.8);
  const greenRev = rr(2, 65);
  return { name, sector: sect, weight: +w.toFixed(1), waci: +waci.toFixed(0), sbti, alignment: cat, itr: +itr.toFixed(1), greenRev: +greenRev.toFixed(1) };
});
const totalW = holdings.reduce((s, h) => s + h.weight, 0);
holdings.forEach(h => { h.weight = totalW ? +((h.weight / totalW) * 100).toFixed(1) : 0; });

const pathwayData = [];
for (let y = 2020; y <= 2050; y++) {
  const base = 185 - (y - 2020) * 2.8 + rr(-4, 4);
  const target15 = 185 * Math.exp(-0.07 * (y - 2020));
  const target20 = 185 * Math.exp(-0.04 * (y - 2020));
  pathwayData.push({ year: y, portfolio: +(y <= 2026 ? base : base - (y - 2026) * 3.2 + rr(-2, 2)).toFixed(1), target15: +target15.toFixed(1), target20: +target20.toFixed(1) });
}

const decarbTargets = [];
for (let y = 2024; y <= 2030; y++) {
  decarbTargets.push({ year: y, selfDecarb: ri(8, 22), rebalance: ri(3, 12), target: ri(12, 30), cumBudget: ri(800 - (y - 2024) * 90, 850 - (y - 2024) * 80) });
}

const sectorDecarb = sectors.slice(0, 7).map(s => ({ sector: s, contribution: +rr(-18, 5).toFixed(1) }));

const benchmarkData = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => ({
  year: y, portfolio: +(185 - (y - 2020) * 4.5 + rr(-3, 3)).toFixed(1),
  msci: +(200 - (y - 2020) * 2.1 + rr(-2, 2)).toFixed(1),
  pab: +(170 - (y - 2020) * 5.8 + rr(-2, 2)).toFixed(1),
}));

const itrQuarterly = [];
for (let q = 0; q < 16; q++) {
  const yr = 2022 + Math.floor(q / 4);
  const qn = (q % 4) + 1;
  itrQuarterly.push({ period: `${yr} Q${qn}`, itr: +(2.4 - q * 0.04 + rr(-0.08, 0.08)).toFixed(2) });
}

const sectorITR = sectors.slice(0, 8).map(s => ({ sector: s, itr: +rr(1.3, 3.6).toFixed(1) }));

const itrSensitivity = holdings.slice(0, 10).map(h => ({
  name: h.name.split(' ')[0], baseITR: 2.1, impact: +rr(-0.15, 0.25).toFixed(2),
}));

const alignDist = {};
holdings.forEach(h => { alignDist[h.alignment] = (alignDist[h.alignment] || 0) + h.weight; });
const pieData = Object.entries(alignDist).map(([k, v]) => ({ name: k, value: +v.toFixed(1) }));

const paiiComponents = [
  { name: 'Governance & Strategy', progress: ri(65, 92), items: ['Board climate oversight established','Net zero commitment published','Annual climate report','Executive compensation linked to targets'] },
  { name: 'Targets & Objectives', progress: ri(50, 85), items: ['Portfolio-level 2030 target set','Sector-specific pathways defined','Interim milestones established','Science-based methodology adopted'] },
  { name: 'Strategic Asset Allocation', progress: ri(40, 78), items: ['Climate-integrated SAA model','Green asset allocation targets','Fossil fuel phase-down schedule','Climate solutions allocation'] },
  { name: 'Policy Advocacy', progress: ri(30, 70), items: ['Climate policy engagement plan','Industry coalition membership','Regulatory consultation participation','Public policy positions disclosed'] },
  { name: 'Market Engagement', progress: ri(45, 82), items: ['Stewardship & voting policy','Company engagement tracker','Escalation framework active','Collaborative engagement initiatives'] },
];

/* ---- Style helpers ---- */
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 };
const kpiBox = { ...card, textAlign: 'center', flex: 1, minWidth: 150 };
const label = { fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };
const val = (color = T.navy) => ({ fontSize: 22, fontWeight: 700, color, fontFamily: T.font });
const badge = (bg, fg = '#fff') => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, fontFamily: T.mono, background: bg, color: fg });
const sectionTitle = { fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.font, marginBottom: 12, borderBottom: `2px solid ${T.gold}`, paddingBottom: 4, display: 'inline-block' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font };
const th = { padding: '8px 10px', borderBottom: `2px solid ${T.navy}`, textAlign: 'left', fontFamily: T.mono, fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' };
const td = { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.navy };

/* ---- Sub-components ---- */
function KPI({ title, value: v, unit, color = T.navy, statusLabel, statusColor }) {
  return (
    <div style={kpiBox}>
      <div style={label}>{title}</div>
      <div style={val(color)}>{v}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 3 }}>{unit}</span></div>
      {statusLabel && <div style={{ marginTop: 4 }}><span style={badge(statusColor)}>{statusLabel}</span></div>}
    </div>
  );
}

function AlignmentDashboard() {
  const portfolioWACI = ri(128, 155);
  const decarbRate = +rr(5.2, 8.8).toFixed(1);
  const budgetRemaining = ri(420, 580);
  const aumAligned = +rr(38, 52).toFixed(1);
  const portfolioITR = +rr(1.9, 2.3).toFixed(1);
  const statusLabel = portfolioITR <= 2.0 ? 'On Track' : portfolioITR <= 2.5 ? 'Behind' : 'Critical';
  const statusColor = portfolioITR <= 2.0 ? T.green : portfolioITR <= 2.5 ? T.amber : T.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPI title="Portfolio WACI" value={portfolioWACI} unit="tCO2/$M" />
        <KPI title="YoY Decarb Rate" value={decarbRate} unit="%" color={T.green} />
        <KPI title="1.5C Budget Left" value={budgetRemaining} unit="MtCO2" color={T.amber} />
        <KPI title="AUM Aligned" value={aumAligned} unit="%" color={T.blue} />
        <KPI title="Portfolio ITR" value={portfolioITR} unit="C" color={statusColor} statusLabel={statusLabel} statusColor={statusColor} />
      </div>

      <div style={card}>
        <div style={sectionTitle}>Portfolio Emissions vs 1.5C Pathway (2020-2050)</div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={pathwayData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="budgetFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.15} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'tCO2e/$M Rev', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, border: `1px solid ${T.border}` }} />
            <Area type="monotone" dataKey="target15" stroke={T.green} fill="url(#budgetFill)" strokeWidth={2} strokeDasharray="6 3" name="1.5C Pathway" />
            <Area type="monotone" dataKey="target20" stroke={T.amber} fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="2.0C Pathway" />
            <Area type="monotone" dataKey="portfolio" stroke={T.navy} fill="none" strokeWidth={2.5} name="Portfolio" dot={false} />
            <ReferenceLine x={2026} stroke={T.textMut} strokeDasharray="3 3" label={{ value: 'Now', position: 'top', fill: T.textMut, fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DecarbonizationPathway() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 400 }}>
          <div style={sectionTitle}>Self-Decarbonization vs Rebalancing Attribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={decarbTargets} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'tCO2e Reduction', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="selfDecarb" stackId="a" fill={T.navy} name="Self-Decarbonization" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rebalance" stackId="a" fill={T.gold} name="Portfolio Rebalancing" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 350 }}>
          <div style={sectionTitle}>Sector Contribution to Decarbonization</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorDecarb} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis dataKey="sector" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={75} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="contribution" name="tCO2e Impact">
                {sectorDecarb.map((e, i) => <Cell key={i} fill={e.contribution < 0 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 2, minWidth: 400 }}>
          <div style={sectionTitle}>Benchmark Comparison (WACI Trend)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={benchmarkData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Line type="monotone" dataKey="portfolio" stroke={T.navy} strokeWidth={2.5} name="Portfolio" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="msci" stroke={T.textMut} strokeWidth={1.5} strokeDasharray="4 4" name="MSCI ACWI" dot={false} />
              <Line type="monotone" dataKey="pab" stroke={T.green} strokeWidth={1.5} strokeDasharray="6 3" name="Paris-Aligned BMK" dot={false} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 220 }}>
          <div style={sectionTitle}>Annual Carbon Reduction Targets</div>
          <table style={tableStyle}>
            <thead><tr>{['Year','Self','Rebal','Target','Budget'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {decarbTargets.map(r => (
                <tr key={r.year}>
                  <td style={{ ...td, fontFamily: T.mono, fontWeight: 600 }}>{r.year}</td>
                  <td style={td}>{r.selfDecarb}%</td>
                  <td style={td}>{r.rebalance}%</td>
                  <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.target}%</td>
                  <td style={{ ...td, fontFamily: T.mono }}>{r.cumBudget} Mt</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssetAlignment() {
  const rowBg = (cat) => {
    const m = { Aligned: 'rgba(22,163,74,0.06)', Aligning: 'rgba(37,99,235,0.06)', 'Not Aligned': 'rgba(220,38,38,0.06)', Achieving: 'rgba(8,145,178,0.06)' };
    return m[cat] || 'transparent';
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 3, minWidth: 500, overflowX: 'auto' }}>
          <div style={sectionTitle}>Holdings Alignment Analysis ({holdings.length} Assets)</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Name','Sector','Wt%','WACI','SBTi','Alignment','ITR (C)','Green Rev%'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={i} style={{ background: rowBg(h.alignment) }}>
                  <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                  <td style={{ ...td, fontSize: 11 }}>{h.sector}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>{h.weight}</td>
                  <td style={{ ...td, fontFamily: T.mono, color: h.waci > 250 ? T.red : h.waci > 120 ? T.amber : T.green }}>{h.waci}</td>
                  <td style={td}><span style={badge(h.sbti === 'Set' ? T.green : h.sbti === 'Committed' ? T.blue : T.textMut)}>{h.sbti}</span></td>
                  <td style={td}><span style={badge(alignColors[h.alignment])}>{h.alignment}</span></td>
                  <td style={{ ...td, fontFamily: T.mono, fontWeight: 600, color: h.itr <= 1.8 ? T.green : h.itr <= 2.5 ? T.amber : T.red }}>{h.itr}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>{h.greenRev}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 260 }}>
          <div style={sectionTitle}>AUM by Alignment Category</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" label={({ name, value }) => `${name} ${value.toFixed(0)}%`} labelLine={{ stroke: T.textMut }} style={{ fontSize: 10, fontFamily: T.mono }}>
                {pieData.map((e, i) => <Cell key={i} fill={alignColors[e.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => `${v.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: T.mono }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: alignColors[d.name], display: 'inline-block' }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ITRAnalysis() {
  const portfolioITR = 2.1;
  const gaugeAngle = ((portfolioITR - 1.0) / 3.0) * 100;
  const gaugeData = [{ name: 'ITR', value: gaugeAngle, fill: portfolioITR <= 1.8 ? T.green : portfolioITR <= 2.5 ? T.amber : T.red }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 280, textAlign: 'center' }}>
          <div style={sectionTitle}>Portfolio Implied Temperature Rise</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} barSize={18} data={gaugeData}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: T.border }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: -40, position: 'relative' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.amber, fontFamily: T.font }}>{portfolioITR}C</div>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>WACI-based ITR Aggregation</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 30px 0', fontSize: 10, fontFamily: T.mono, color: T.textMut }}>
              <span>1.0C</span><span>1.5C</span><span>2.0C</span><span>3.0C</span><span>4.0C</span>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(217,119,6,0.08)', borderRadius: 4, fontSize: 11, color: T.amber, fontFamily: T.mono }}>
            ITR = Baseline + (Projected Overshoot / Carbon Budget) x Sensitivity
          </div>
        </div>

        <div style={{ ...card, flex: 2, minWidth: 400 }}>
          <div style={sectionTitle}>Sector-Level ITR Decomposition</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorITR} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 4]} label={{ value: 'ITR (C)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
              <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="6 3" label={{ value: '1.5C', position: 'right', fill: T.green, fontSize: 10 }} />
              <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="4 4" label={{ value: '2.0C', position: 'right', fill: T.amber, fontSize: 10 }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="itr" name="Sector ITR" radius={[3, 3, 0, 0]}>
                {sectorITR.map((e, i) => <Cell key={i} fill={e.itr <= 1.8 ? T.green : e.itr <= 2.5 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 400 }}>
          <div style={sectionTitle}>Historical ITR Trend (Quarterly)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={itrQuarterly} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[1.5, 3.0]} />
              <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="6 3" />
              <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="4 4" />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Line type="monotone" dataKey="itr" stroke={T.navy} strokeWidth={2.5} name="Portfolio ITR" dot={{ r: 3, fill: T.navy }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...card, flex: 1, minWidth: 350 }}>
          <div style={sectionTitle}>ITR Sensitivity to Top 10 Holdings</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={itrSensitivity} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} domain={[-0.2, 0.3]} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={75} />
              <ReferenceLine x={0} stroke={T.navy} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => `${v > 0 ? '+' : ''}${v}C`} />
              <Bar dataKey="impact" name="ITR Impact (C)">
                {itrSensitivity.map((e, i) => <Cell key={i} fill={e.impact > 0 ? T.red : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PAIIFramework() {
  const overallProgress = Math.round(paiiComponents.reduce((s, c) => s + c.progress, 0) / paiiComponents.length);
  const checkItems = [
    { text: 'Net zero commitment with 2050 target date', done: true },
    { text: 'Interim 2030 portfolio decarbonization targets', done: true },
    { text: 'PCAF-aligned financed emissions measurement', done: true },
    { text: 'Science-based sectoral pathways adopted', done: true },
    { text: 'Climate stewardship & engagement policy', done: true },
    { text: 'Fossil fuel exclusion/phase-down policy', done: false },
    { text: 'Climate scenario analysis integrated in SAA', done: false },
    { text: 'Annual TCFD-aligned progress reporting', done: true },
    { text: 'Just transition considerations documented', done: false },
    { text: 'Climate solutions allocation target (>10% AUM)', done: false },
    { text: 'Real economy emissions reduction verification', done: false },
    { text: 'Policy advocacy positions publicly disclosed', done: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <div style={label}>PAII NZIF OVERALL ALIGNMENT</div>
          <div style={val(overallProgress >= 70 ? T.green : T.amber)}>{overallProgress}%</div>
        </div>
        <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 14, overflow: 'hidden' }}>
          <div style={{ width: `${overallProgress}%`, height: '100%', background: `linear-gradient(90deg, ${T.gold}, ${T.green})`, borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{checkItems.filter(c => c.done).length}/{checkItems.length} checks passed</div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {paiiComponents.map((comp, ci) => (
          <div key={ci} style={{ ...card, flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{comp.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${comp.progress}%`, height: '100%', background: comp.progress >= 75 ? T.green : comp.progress >= 50 ? T.amber : T.red, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: comp.progress >= 75 ? T.green : comp.progress >= 50 ? T.amber : T.red }}>{comp.progress}%</span>
            </div>
            {comp.items.map((item, j) => {
              const done = r() > 0.35;
              return (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: done ? T.green : T.textMut }}>
                  <span style={{ fontFamily: T.mono, fontSize: 13 }}>{done ? '\u2713' : '\u25CB'}</span>
                  <span style={{ textDecoration: done ? 'none' : 'none' }}>{item}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={sectionTitle}>NZIF Alignment Checklist</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
          {checkItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: item.done ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.04)', borderRadius: 4, border: `1px solid ${item.done ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.12)'}` }}>
              <span style={{ fontSize: 15, fontFamily: T.mono, color: item.done ? T.green : T.red }}>{item.done ? '\u2713' : '\u2717'}</span>
              <span style={{ fontSize: 12, color: T.navy }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Main Page ---- */
export default function NetZeroPortfolioAlignmentPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '18px 28px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Net Zero Portfolio Alignment</div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, marginTop: 2 }}>EP-CZ2 | PAII NZIF Framework | Science-Based Decarbonization</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={badge('rgba(22,163,74,0.2)', T.green)}>LIVE</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: T.mono }}>2026-04-05 | 14:32 UTC</span>
          </div>
        </div>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 18px', fontSize: 12, fontFamily: T.mono, fontWeight: tab === i ? 700 : 400,
              color: tab === i ? T.gold : 'rgba(255,255,255,0.55)', background: tab === i ? 'rgba(197,169,106,0.12)' : 'transparent',
              border: 'none', borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 28px', maxWidth: 1440, margin: '0 auto' }}>
        {tab === 0 && <AlignmentDashboard />}
        {tab === 1 && <DecarbonizationPathway />}
        {tab === 2 && <AssetAlignment />}
        {tab === 3 && <ITRAnalysis />}
        {tab === 4 && <PAIIFramework />}
      </div>

      {/* Footer status bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.navy, padding: '4px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.gold}`, zIndex: 100 }}>
        <span style={{ fontSize: 10, color: T.gold, fontFamily: T.mono }}>NET-ZERO-ALIGNMENT v2.1.0</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: T.mono }}>PAII NZIF | {holdings.length} holdings | 10 sectors | Methodology: WACI + SBTi + ITR</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: T.mono }}>Data as of 2026-04-05</span>
      </div>
    </div>
  );
}
