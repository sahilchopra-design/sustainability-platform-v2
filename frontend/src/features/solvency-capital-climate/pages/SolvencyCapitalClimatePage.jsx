import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ENTITY_TYPES = ['Life Insurer','Non-Life Insurer','Reinsurer','Composite','Captive'];
const FRAMEWORKS = ['Solvency II','NAIC RBC','APRA LAGIC','BMA BSCR','IAIS ICS'];
const JURISDICTIONS = ['EU','UK','US','Australia','Bermuda','Singapore','Japan','Canada','Switzerland','South Africa'];
const RISK_APPETITE = ['Conservative','Moderate','Aggressive'];
const NCPE_TIERS = ['Tier 1','Tier 2','Tier 3'];
const ORSA_SCENARIOS = [
  'Climate 1.5°C Orderly','Climate 3°C Hot House','Climate NZE Abrupt Transition',
  'NatCat 1-in-100yr','NatCat 1-in-250yr','Sovereign Debt Climate Crisis',
  'Stranded Asset Cascade','NatCat Mega-Event (250yr)','Pandemic-Climate Combined','Technology Revolution',
];
const SCR_MODULES = ['NatCat','Market Risk','Credit Risk','Operational','Life Underwriting','Health Underwriting','Non-Life Underwriting'];
const SCR_COLORS = ['#4f46e5','#dc2626','#0369a1','#d97706','#16a34a','#7c3aed','#0f766e'];
const ORSA_STRESS_MULTS = [1.05,1.25,1.18,1.20,1.45,1.30,1.35,1.55,1.40,0.85];

// 7×7 correlation matrix for SCR modules
const SCR_CORR = [
  [1.00, 0.25, 0.30, 0.10, 0.15, 0.10, 0.35],
  [0.25, 1.00, 0.40, 0.20, 0.20, 0.15, 0.25],
  [0.30, 0.40, 1.00, 0.15, 0.10, 0.10, 0.20],
  [0.10, 0.20, 0.15, 1.00, 0.05, 0.05, 0.10],
  [0.15, 0.20, 0.10, 0.05, 1.00, 0.35, 0.20],
  [0.10, 0.15, 0.10, 0.05, 0.35, 1.00, 0.15],
  [0.35, 0.25, 0.20, 0.10, 0.20, 0.15, 1.00],
];

const ENTITIES = Array.from({ length: 50 }, (_, i) => {
  const scrModules = SCR_MODULES.map((_, mi) => +(sr(i * 41 + mi + 1) * 400 + 80).toFixed(0));
  const natcatSCR = +scrModules[0];
  const climateLoading = +(sr(i * 41 + 8) * 0.4 + 0.05).toFixed(3);
  // BSCR = sqrt(sum_ij rho_ij * SCR_i * SCR_j)
  let bscrSquared = 0;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) bscrSquared += SCR_CORR[r][c] * scrModules[r] * scrModules[c];
  const bscr = +Math.sqrt(Math.max(0, bscrSquared)).toFixed(0);
  const lacDT = +(bscr * (sr(i * 41 + 10) * 0.10 + 0.02)).toFixed(0);
  const lacTP = +(bscr * (sr(i * 41 + 11) * 0.05 + 0.01)).toFixed(0);
  const adjustedSCR = Math.max(1, bscr - lacDT - lacTP);
  const ownFunds = +(adjustedSCR * (sr(i * 41 + 12) * 1.2 + 1.1)).toFixed(0);
  const divBenefit = +(bscr - adjustedSCR + lacDT + lacTP).toFixed(0);
  const framework = FRAMEWORKS[Math.floor(sr(i * 41 + 13) * 5)];
  const amcr = Math.round(sr(i * 41 + 14) * 3000 + 500);
  const bmcr = Math.round(adjustedSCR * 0.45);
  const mcr = Math.max(amcr, Math.min(bmcr, adjustedSCR * 0.45));
  return {
    id: i,
    name: `${['Apex','Meridian','Crestview','Northgate','Summit','Pacific','Atlantic','Alpine','Nordic','Iberian'][Math.floor(sr(i * 41 + 15) * 10)]} ${['Re','Insurance','Life','Capital','Assurance'][Math.floor(sr(i * 41 + 16) * 5)]} ${String.fromCharCode(65 + Math.floor(sr(i * 41 + 17) * 10))}`,
    type: ENTITY_TYPES[Math.floor(sr(i * 41 + 18) * 5)],
    jurisdiction: JURISDICTIONS[Math.floor(sr(i * 41 + 19) * 10)],
    framework,
    eligibleOwnFunds: +ownFunds,
    cet1: +(ownFunds * (sr(i * 41 + 20) * 0.3 + 0.6)).toFixed(0),
    tier2: +(ownFunds * (sr(i * 41 + 21) * 0.15 + 0.05)).toFixed(0),
    baseSCR: bscr,
    natcatSCR,
    climateLoading,
    lossAbsorbingCapacity: +lacDT + +lacTP,
    adjustedSCR: Math.round(adjustedSCR),
    solvencyRatio: +(ownFunds / adjustedSCR * 100).toFixed(1),
    scrModules,
    bscr,
    lacDT: +lacDT,
    lacTP: +lacTP,
    mcr: Math.round(mcr),
    mcrRatio: +(ownFunds / (mcr > 0 ? mcr : 1) * 100).toFixed(1),
    diversificationBenefit: +divBenefit,
    climateAdjSCR: Math.round(adjustedSCR * (1 + climateLoading)),
    climateAdjSolvencyRatio: +(ownFunds / Math.round(adjustedSCR * (1 + climateLoading)) * 100).toFixed(1),
    riskAppetite: RISK_APPETITE[Math.floor(sr(i * 41 + 22) * 3)],
    investmentPortfolioGreenPct: +(sr(i * 41 + 23) * 50 + 5).toFixed(1),
    climateStressBuffer: +(sr(i * 41 + 24) * 15 + 2).toFixed(1),
    ncpeTier: NCPE_TIERS[Math.floor(sr(i * 41 + 25) * 3)],
    ownFundsAboveMin: +(ownFunds - adjustedSCR * 1.0).toFixed(0),
  };
});

const PEER_INSURERS = ['AXA','Allianz','Zurich','Munich Re','Swiss Re','Berkshire Re','Lloyd\'s','AIG','Chubb','Generali'];
const PEER_DOMAIN_SCORES = PEER_INSURERS.map((n, i) =>
  SCR_MODULES.map((_, mi) => +(sr(i * 71 + mi + 1) * 40 + 55).toFixed(1))
);

const REG_FRAMEWORKS = [
  { name: 'Solvency II SCR', threshold: '100%', jurisdiction: 'EU', type: 'Minimum Capital' },
  { name: 'Solvency II MCR', threshold: '133%', jurisdiction: 'EU', type: 'Enhanced Capital' },
  { name: 'NAIC RBC Company Action', threshold: '200%', jurisdiction: 'US', type: 'Action Level' },
  { name: 'NAIC RBC Authorized Control', threshold: '150%', jurisdiction: 'US', type: 'Control Level' },
  { name: 'APRA PCR', threshold: '100%', jurisdiction: 'Australia', type: 'Prescribed Capital' },
  { name: 'APRA MCR', threshold: '50%', jurisdiction: 'Australia', type: 'Minimum Capital' },
  { name: 'BMA ECR', threshold: '100%', jurisdiction: 'Bermuda', type: 'Enhanced Capital' },
  { name: 'IAIS ICS Level 1', threshold: '100%', jurisdiction: 'International', type: 'Basic Capital' },
  { name: 'ICS Level 2', threshold: '115%', jurisdiction: 'International', type: 'Insurance Capital' },
  { name: 'MAS RBC Singapore', threshold: '120%', jurisdiction: 'Singapore', type: 'Fund Solvency' },
];

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{unit}</span></div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 12 }}>{label}</button>
);

export default function SolvencyCapitalClimatePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [jurisFilter, setJurisFilter] = useState('All');
  const [frameworkFilter, setFrameworkFilter] = useState('All');
  const [orsaScenIdx, setOrsaScenIdx] = useState(0);
  const [scrModuleFilter, setScrModuleFilter] = useState('All');
  const [solvencyMin, setSolvencyMin] = useState(0);
  const [greenMin, setGreenMin] = useState(0);
  const [search, setSearch] = useState('');
  const [drillEntity, setDrillEntity] = useState(0);
  const [sortCol, setSortCol] = useState('solvencyRatio');
  const [sortAsc, setSortAsc] = useState(false);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);

  const filtered = useMemo(() => {
    let d = ENTITIES;
    if (typeFilter !== 'All') d = d.filter(e => e.type === typeFilter);
    if (jurisFilter !== 'All') d = d.filter(e => e.jurisdiction === jurisFilter);
    if (frameworkFilter !== 'All') d = d.filter(e => e.framework === frameworkFilter);
    if (scrModuleFilter !== 'All') {
      const mi = SCR_MODULES.indexOf(scrModuleFilter);
      if (mi >= 0) d = d.filter(e => e.scrModules[mi] > 100);
    }
    d = d.filter(e => e.solvencyRatio >= solvencyMin && e.investmentPortfolioGreenPct >= greenMin);
    if (search) d = d.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [typeFilter, jurisFilter, frameworkFilter, scrModuleFilter, solvencyMin, greenMin, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [filtered, sortCol, sortAsc]);

  const globalKpis = useMemo(() => {
    if (!filtered.length) return { avgSolvency: 0, avgClimateAdj: 0, avgDiv: 0, belowSCR: 0 };
    const avgSolvency = filtered.reduce((s, e) => s + e.solvencyRatio, 0) / filtered.length;
    const avgClimateAdj = filtered.reduce((s, e) => s + e.climateAdjSolvencyRatio, 0) / filtered.length;
    const avgDiv = filtered.reduce((s, e) => s + e.diversificationBenefit, 0) / filtered.length;
    const belowSCR = filtered.filter(e => e.solvencyRatio < 100).length;
    return { avgSolvency: +avgSolvency.toFixed(1), avgClimateAdj: +avgClimateAdj.toFixed(1), avgDiv: Math.round(avgDiv), belowSCR };
  }, [filtered]);

  const drillE = ENTITIES[drillEntity];

  const orsaData = useMemo(() => {
    return ORSA_SCENARIOS.map((sc, si) => ({
      scenario: sc.slice(0, 20),
      solvencyRatio: +(drillE.solvencyRatio / ORSA_STRESS_MULTS[si]).toFixed(1),
      climateAdjRatio: +(drillE.climateAdjSolvencyRatio / ORSA_STRESS_MULTS[si]).toFixed(1),
      bufferNeeded: Math.max(0, +(drillE.adjustedSCR * ORSA_STRESS_MULTS[si] - drillE.eligibleOwnFunds).toFixed(0)),
    }));
  }, [drillEntity]);

  const bscrModuleData = useMemo(() => SCR_MODULES.map((mod, mi) => ({
    module: mod.slice(0, 14),
    value: drillE.scrModules[mi],
    color: SCR_COLORS[mi],
  })), [drillEntity]);

  const capitalEffData = useMemo(() => filtered.map(e => ({
    name: e.name,
    solvencyRatio: e.solvencyRatio,
    capitalEfficiency: e.diversificationBenefit > 0 ? +(e.diversificationBenefit / e.bscr * 100).toFixed(1) : 0,
    type: e.type,
  })), [filtered]);

  const jurisDistData = useMemo(() => {
    const map = {};
    JURISDICTIONS.forEach(j => { map[j] = 0; });
    filtered.forEach(e => { map[e.jurisdiction] = (map[e.jurisdiction] || 0) + 1; });
    return JURISDICTIONS.map(j => ({ jurisdiction: j, count: map[j] })).filter(d => d.count > 0);
  }, [filtered]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol]);

  const TABS = ['SCR Dashboard','Entity Database','Standard Formula','ORSA Stress Analysis','Capital Efficiency','Regulatory Comparison','Summary & Export'];
  const thS = (col) => ({ padding: '7px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, whiteSpace: 'nowrap', textAlign: 'left' });
  const tdS = { padding: '5px 8px', fontSize: 11 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>EP-DC4 · Sprint DC · Climate-Integrated Actuarial Intelligence Suite</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Solvency Capital Climate Engine</h1>
        <div style={{ fontSize: 12, color: T.muted }}>50 entities · 7-module BSCR standard formula · 10 ORSA scenarios · correlation-adjusted diversification · regulatory comparison</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={jurisFilter} onChange={e => setJurisFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
        </select>
        <select value={frameworkFilter} onChange={e => setFrameworkFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{FRAMEWORKS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select value={orsaScenIdx} onChange={e => setOrsaScenIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {ORSA_SCENARIOS.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </select>
        <select value={scrModuleFilter} onChange={e => setScrModuleFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{SCR_MODULES.map(m => <option key={m}>{m}</option>)}
        </select>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          SCR Ratio≥ <input type="range" min={0} max={300} value={solvencyMin} onChange={e => setSolvencyMin(+e.target.value)} style={{ width: 80 }} /> {solvencyMin}%
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Green%≥ <input type="range" min={0} max={50} value={greenMin} onChange={e => setGreenMin(+e.target.value)} style={{ width: 80 }} /> {greenMin}%
        </label>
        <input placeholder="Search entity…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 140 }} />
        <span style={{ fontSize: 11, color: T.muted }}>{filtered.length} / 50</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: T.card, padding: 8, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => <TabBtn key={t} label={t} active={tab === i} onClick={() => setTab(i)} />)}
      </div>

      {/* TAB 0: SCR Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Avg SCR Ratio" value={globalKpis.avgSolvency} unit="%" color={globalKpis.avgSolvency < 130 ? T.red : T.green} />
            <KpiCard label="Avg Climate-Adj SCR" value={globalKpis.avgClimateAdj} unit="%" color={globalKpis.avgClimateAdj < 120 ? T.red : T.green} />
            <KpiCard label="Avg Diversification Benefit" value={globalKpis.avgDiv.toLocaleString()} unit="$M" color={T.blue} />
            <KpiCard label="Entities Below SCR" value={globalKpis.belowSCR} unit="" color={globalKpis.belowSCR > 0 ? T.red : T.green} />
            <KpiCard label="Total Entities" value={filtered.length} unit="/ 50" color={T.navy} />
            <KpiCard label="ORSA Scenario" value={ORSA_SCENARIOS[orsaScenIdx].split(' ').slice(0,2).join(' ')} unit="" color={T.indigo} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>SCR Ratio by Entity — Base vs Climate-Adjusted (sorted by Base)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[...filtered].sort((a,b) => a.solvencyRatio - b.solvencyRatio).map(e => ({ name: e.name.slice(0,12), base: e.solvencyRatio, climAdj: e.climateAdjSolvencyRatio }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={false} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="base" name="Base SCR Ratio %" fill={T.indigo} />
                <Bar dataKey="climAdj" name="Climate-Adj Ratio %" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>10-ORSA Scenario Capital Impact — {drillE.name}</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <label style={{ fontSize: 12 }}>Entity: <select value={drillEntity} onChange={e => setDrillEntity(+e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
              </select></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {ORSA_SCENARIOS.map((sc, si) => {
                const stressed = +(drillE.solvencyRatio / ORSA_STRESS_MULTS[si]).toFixed(1);
                const ok = stressed >= 100;
                return (
                  <div key={sc} style={{ background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{sc.slice(0, 22)}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: ok ? T.green : T.red }}>{stressed}%</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Stress ×{ORSA_STRESS_MULTS[si]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Entity Database */}
      {tab === 1 && (
        <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Entity Database — {sortedFiltered.length} / 50</span>
            <span style={{ fontSize: 11, color: T.muted }}>Click row to set drill-down entity</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {[['name','Entity'],['type','Type'],['jurisdiction','Jurisdiction'],['framework','Framework'],['eligibleOwnFunds','Own Funds $M'],['adjustedSCR','Adj SCR $M'],['solvencyRatio','SCR Ratio %'],['climateAdjSolvencyRatio','Climate SCR %'],['climateLoading','Climate Loading'],['diversificationBenefit','Div Benefit $M'],['riskAppetite','Risk Appetite'],['investmentPortfolioGreenPct','Green %'],['ncpeTier','NCPE Tier'],['mcrRatio','MCR Ratio %']].map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)} style={thS(col)}>{label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>
                ))}
              </tr></thead>
              <tbody>{sortedFiltered.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, cursor: 'pointer' }} onClick={() => setDrillEntity(e.id)}>
                  <td style={{ ...tdS, fontWeight: 600, maxWidth: 120, overflow: 'hidden', whiteSpace: 'nowrap' }}>{e.name}</td>
                  <td style={tdS}>{e.type}</td>
                  <td style={tdS}>{e.jurisdiction}</td>
                  <td style={tdS}>{e.framework}</td>
                  <td style={tdS}>${e.eligibleOwnFunds.toLocaleString()}</td>
                  <td style={tdS}>${e.adjustedSCR.toLocaleString()}</td>
                  <td style={{ ...tdS, color: e.solvencyRatio < 130 ? T.red : T.green, fontWeight: 600 }}>{e.solvencyRatio}%</td>
                  <td style={{ ...tdS, color: e.climateAdjSolvencyRatio < 120 ? T.red : T.amber }}>{e.climateAdjSolvencyRatio}%</td>
                  <td style={tdS}>{(e.climateLoading * 100).toFixed(1)}%</td>
                  <td style={tdS}>${e.diversificationBenefit.toLocaleString()}</td>
                  <td style={tdS}>{e.riskAppetite}</td>
                  <td style={tdS}>{e.investmentPortfolioGreenPct}%</td>
                  <td style={tdS}>{e.ncpeTier}</td>
                  <td style={{ ...tdS, color: e.mcrRatio < 150 ? T.red : T.green }}>{e.mcrRatio}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Standard Formula Modules */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>Entity for detail: <select value={drillEntity} onChange={e => setDrillEntity(+e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
            </select></label>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>7-Module SCR Breakdown (Stacked) — All Entities</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].slice(0,20).map(e => {
                const obj = { name: e.name.slice(0,10) };
                SCR_MODULES.forEach((mod, mi) => { obj[mod.slice(0,8)] = e.scrModules[mi]; });
                return obj;
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {SCR_MODULES.map((mod, mi) => <Bar key={mod} dataKey={mod.slice(0,8)} name={mod} fill={SCR_COLORS[mi]} stackId="a" />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>BSCR Decomposition — {drillE.name}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bscrModuleData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="module" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="SCR $M" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 10, fontSize: 12, padding: 10, background: T.sub, borderRadius: 6 }}>
                <div>BSCR: <strong>${drillE.bscr.toLocaleString()}</strong> | LAC(DT): <strong>-${drillE.lacDT.toLocaleString()}</strong> | LAC(TP): <strong>-${drillE.lacTP.toLocaleString()}</strong></div>
                <div>Adjusted SCR: <strong>${drillE.adjustedSCR.toLocaleString()}</strong> | Div Benefit: <strong>${drillE.diversificationBenefit.toLocaleString()}</strong></div>
                <div>Climate Loading: <strong>{(drillE.climateLoading * 100).toFixed(1)}%</strong> | Climate SCR: <strong>${drillE.climateAdjSCR.toLocaleString()}</strong></div>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>SCR Correlation Matrix (7×7)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(8, auto)`, gap: 1, fontSize: 9 }}>
                <div></div>
                {SCR_MODULES.map((m, i) => <div key={i} style={{ padding: '2px 3px', fontWeight: 700, color: T.muted, textAlign: 'center', overflow: 'hidden', maxWidth: 28 }}>{m.slice(0,3)}</div>)}
                {SCR_MODULES.map((mod, ri) => [
                  <div key={`r${ri}`} style={{ padding: '2px 3px', fontWeight: 700, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 35, fontSize: 9 }}>{mod.slice(0,4)}</div>,
                  ...SCR_MODULES.map((_, ci) => (
                    <div key={`${ri}-${ci}`} style={{ padding: '3px 3px', textAlign: 'center', background: ri === ci ? T.navy : `rgba(79,70,229,${SCR_CORR[ri][ci] * 0.8})`, color: ri === ci ? '#fff' : SCR_CORR[ri][ci] > 0.4 ? '#fff' : T.text, fontSize: 8 }}>
                      {SCR_CORR[ri][ci].toFixed(2)}
                    </div>
                  ))
                ])}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORSA Stress Analysis */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>Entity: <select value={drillEntity} onChange={e => setDrillEntity(+e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
            </select></label>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>10-Scenario ORSA Impact — {drillE.name} (Base SCR: {drillE.solvencyRatio}%)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orsaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="solvencyRatio" name="Stressed SCR Ratio %" fill={T.indigo} />
                <Bar dataKey="climateAdjRatio" name="Climate-Adj Stressed %" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>ORSA Stress Detail Table</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['ORSA Scenario','Stress Mult','Stressed SCR Ratio %','Climate-Adj Stressed %','Capital Buffer Needed $M','Breach?'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>{orsaData.map((r, i) => (
                <tr key={r.scenario} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r.scenario}</td>
                  <td style={tdS}>×{ORSA_STRESS_MULTS[i]}</td>
                  <td style={{ ...tdS, color: r.solvencyRatio < 100 ? T.red : T.green, fontWeight: 600 }}>{r.solvencyRatio}%</td>
                  <td style={{ ...tdS, color: r.climateAdjRatio < 100 ? T.red : T.amber }}>{r.climateAdjRatio}%</td>
                  <td style={{ ...tdS, color: r.bufferNeeded > 0 ? T.red : T.green }}>{r.bufferNeeded > 0 ? '$' + r.bufferNeeded.toLocaleString() : '—'}</td>
                  <td style={tdS}><span style={{ background: r.solvencyRatio < 100 ? '#fee2e2' : '#dcfce7', color: r.solvencyRatio < 100 ? T.red : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>{r.solvencyRatio < 100 ? 'BREACH' : 'Pass'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Capital Efficiency */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Capital Efficiency vs SCR Ratio (Scatter)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="solvencyRatio" name="SCR Ratio %" tick={{ fontSize: 10 }} label={{ value: 'SCR Ratio %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="capitalEfficiency" name="Cap Efficiency %" tick={{ fontSize: 10 }} />
                <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name?.slice(0,20)}</b><br/>SCR: {payload[0]?.payload?.solvencyRatio}%<br/>Div Eff: {payload[0]?.payload?.capitalEfficiency}%</div> : null} />
                <Scatter data={capitalEffData} fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Tier 1/2 Quality Analysis</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...filtered].slice(0,15).map(e => ({ name: e.name.slice(0,10), cet1: e.cet1, tier2: e.tier2 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cet1" name="CET1 / Tier 1 $M" fill={T.green} stackId="a" />
                  <Bar dataKey="tier2" name="Tier 2 $M" fill={T.amber} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Optimal Capital Structure — Top 10 by Efficiency</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Entity','SCR Ratio','Div Eff %','Own Funds','Adj SCR','Climate Adj','NCPE'].map(h => <th key={h} style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>{[...filtered].sort((a,b) => (b.diversificationBenefit/b.bscr) - (a.diversificationBenefit/a.bscr)).slice(0,10).map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600, maxWidth: 90, overflow: 'hidden', whiteSpace: 'nowrap' }}>{e.name.slice(0,12)}</td>
                    <td style={{ ...tdS, color: e.solvencyRatio < 130 ? T.red : T.green }}>{e.solvencyRatio}%</td>
                    <td style={tdS}>{e.bscr > 0 ? (e.diversificationBenefit / e.bscr * 100).toFixed(1) : 0}%</td>
                    <td style={tdS}>${e.eligibleOwnFunds.toLocaleString()}</td>
                    <td style={tdS}>${e.adjustedSCR.toLocaleString()}</td>
                    <td style={tdS}>${e.climateAdjSCR.toLocaleString()}</td>
                    <td style={tdS}>{e.ncpeTier}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Regulatory Comparison */}
      {tab === 5 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Entity by Jurisdiction</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={jurisDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="jurisdiction" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Entities" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Framework Threshold Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Framework','Threshold','Jurisdiction','Type','Entities Meeting?'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>{REG_FRAMEWORKS.map((f, i) => {
                const threshold = parseFloat(f.threshold);
                const meeting = filtered.filter(e => e.solvencyRatio >= threshold).length;
                return (
                  <tr key={f.name} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{f.name}</td>
                    <td style={{ ...tdS, color: T.indigo, fontWeight: 600 }}>{f.threshold}</td>
                    <td style={tdS}>{f.jurisdiction}</td>
                    <td style={tdS}>{f.type}</td>
                    <td style={tdS}>{meeting} / {filtered.length} ({filtered.length > 0 ? (meeting / filtered.length * 100).toFixed(0) : 0}%)</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Benchmark Rankings by Framework</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FRAMEWORKS.map(f => {
                const ents = filtered.filter(e => e.framework === f);
                const avgSCR = ents.length ? +(ents.reduce((s, e) => s + e.solvencyRatio, 0) / ents.length).toFixed(1) : 0;
                return { framework: f.split(' ')[0], avgSCR, count: ents.length };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="framework" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="avgSCR" name="Avg SCR Ratio %" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 6: Summary & Export */}
      {tab === 6 && (
        <div>
          {/* ORSA Stress Landscape */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Portfolio ORSA Stress Landscape — All 10 Scenarios (Avg SCR Ratio)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ORSA_SCENARIOS.map((sc, si) => ({
                scenario: sc.slice(0, 18),
                avgSCR: filtered.length ? +(filtered.reduce((s, e) => s + e.solvencyRatio / ORSA_STRESS_MULTS[si], 0) / filtered.length).toFixed(1) : 0,
                breaches: filtered.filter(e => e.solvencyRatio / ORSA_STRESS_MULTS[si] < 100).length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={70} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgSCR" name="Avg Stressed SCR %" fill={T.indigo} />
                <Bar yAxisId="right" dataKey="breaches" name="SCR Breaches" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Entity type distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>SCR Ratio by Entity Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ENTITY_TYPES.map(type => {
                  const ents = filtered.filter(e => e.type === type);
                  return { type: type.split(' ')[0], avgSCR: ents.length ? +(ents.reduce((s,e) => s + e.solvencyRatio, 0) / ents.length).toFixed(1) : 0, count: ents.length };
                }).filter(d => d.count > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="avgSCR" name="Avg SCR Ratio %" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Climate Loading vs Solvency Ratio (Scatter)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="loading" name="Climate Loading %" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="scr" name="SCR Ratio %" tick={{ fontSize: 10 }} />
                  <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name?.slice(0,18)}</b><br/>Loading: {payload[0]?.payload?.loading?.toFixed(1)}%<br/>SCR: {payload[0]?.payload?.scr}%</div> : null} />
                  <Scatter data={filtered.map(e => ({ name: e.name, loading: e.climateLoading * 100, scr: e.solvencyRatio }))} fill={T.purple} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Capital adequacy tiers */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Capital Adequacy Tier Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'SCR Ratio <100% (Non-Compliant)', value: filtered.filter(e => e.solvencyRatio < 100).length, color: T.red },
                { label: 'SCR 100-130% (Minimum)', value: filtered.filter(e => e.solvencyRatio >= 100 && e.solvencyRatio < 130).length, color: T.amber },
                { label: 'SCR 130-200% (Adequate)', value: filtered.filter(e => e.solvencyRatio >= 130 && e.solvencyRatio < 200).length, color: T.green },
                { label: 'SCR ≥200% (Strong)', value: filtered.filter(e => e.solvencyRatio >= 200).length, color: T.teal },
                { label: 'Climate-Adj Breach Risk', value: filtered.filter(e => e.climateAdjSolvencyRatio < 100).length, color: T.red },
                { label: 'Avg Green Portfolio %', value: filtered.length ? (filtered.reduce((s,e) => s + e.investmentPortfolioGreenPct, 0) / filtered.length).toFixed(1) + '%' : '0%', color: T.green },
                { label: 'NCPE Tier 1 Count', value: filtered.filter(e => e.ncpeTier === 'Tier 1').length, color: T.indigo },
                { label: 'Avg Climate Stress Buffer', value: filtered.length ? (filtered.reduce((s,e) => s + e.climateStressBuffer, 0) / filtered.length).toFixed(1) + '%' : '0%', color: T.orange },
              ].map(item => (
                <div key={item.label} style={{ background: T.sub, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* SCR module breakdown across portfolio */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Average SCR Module Contribution Across Portfolio</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SCR_MODULES.map((mod, mi) => ({
                module: mod.slice(0, 12),
                avgSCR: filtered.length ? Math.round(filtered.reduce((s, e) => s + e.scrModules[mi], 0) / filtered.length) : 0,
                maxSCR: filtered.length ? Math.max(...filtered.map(e => e.scrModules[mi])) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="module" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgSCR" name="Avg SCR $M" fill={T.indigo} />
                <Bar dataKey="maxSCR" name="Max SCR $M" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Entities" value={filtered.length} unit="/ 50" color={T.indigo} />
            <KpiCard label="Avg SCR Ratio" value={globalKpis.avgSolvency} unit="%" color={globalKpis.avgSolvency < 130 ? T.red : T.green} />
            <KpiCard label="Avg Climate-Adj" value={globalKpis.avgClimateAdj} unit="%" color={globalKpis.avgClimateAdj < 120 ? T.red : T.amber} />
            <KpiCard label="Below SCR" value={globalKpis.belowSCR} unit="entities" color={globalKpis.belowSCR > 0 ? T.red : T.green} />
            <KpiCard label="Avg Div Benefit" value={globalKpis.avgDiv.toLocaleString()} unit="$M" color={T.blue} />
            <KpiCard label="ORSA Scenario" value={ORSA_SCENARIOS[orsaScenIdx].split(' ').slice(0,2).join(' ')} unit="" color={T.navy} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full KPI Export — {filtered.length} Entities</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Entity','Type','Juris','Framework','Own Funds','Adj SCR','SCR Ratio %','Climate SCR %','BSCR','Div Benefit','LAC(DT)','MCR Ratio %','Climate Loading','Green %','NCPE Tier','Risk Appetite'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{sortedFiltered.map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600, maxWidth: 100, overflow: 'hidden', whiteSpace: 'nowrap' }}>{e.name.slice(0,14)}</td>
                    <td style={tdS}>{e.type.split(' ')[0]}</td>
                    <td style={tdS}>{e.jurisdiction}</td>
                    <td style={tdS}>{e.framework.split(' ')[0]}</td>
                    <td style={tdS}>${e.eligibleOwnFunds.toLocaleString()}</td>
                    <td style={tdS}>${e.adjustedSCR.toLocaleString()}</td>
                    <td style={{ ...tdS, color: e.solvencyRatio < 130 ? T.red : T.green, fontWeight: 600 }}>{e.solvencyRatio}%</td>
                    <td style={{ ...tdS, color: e.climateAdjSolvencyRatio < 120 ? T.red : T.amber }}>{e.climateAdjSolvencyRatio}%</td>
                    <td style={tdS}>${e.bscr.toLocaleString()}</td>
                    <td style={tdS}>${e.diversificationBenefit.toLocaleString()}</td>
                    <td style={tdS}>${e.lacDT.toLocaleString()}</td>
                    <td style={{ ...tdS, color: e.mcrRatio < 150 ? T.red : T.green }}>{e.mcrRatio}%</td>
                    <td style={tdS}>{(e.climateLoading * 100).toFixed(1)}%</td>
                    <td style={tdS}>{e.investmentPortfolioGreenPct}%</td>
                    <td style={tdS}>{e.ncpeTier}</td>
                    <td style={tdS}>{e.riskAppetite}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {/* ORSA × Entity stress table */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>ORSA Stress Scenario Matrix — All 10 Scenarios (Filtered Entities Summary)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>ORSA Scenario</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Stress Mult</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Avg Stressed SCR %</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>SCR Breaches</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Avg Capital Buffer $M</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Total Capital Need $M</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left' }}>Risk Level</th>
                </tr></thead>
                <tbody>{ORSA_SCENARIOS.map((sc, si) => {
                  const stressedRatios = filtered.map(e => e.solvencyRatio / ORSA_STRESS_MULTS[si]);
                  const avgStressed = filtered.length ? +(stressedRatios.reduce((s, r) => s + r, 0) / filtered.length).toFixed(1) : 0;
                  const breaches = stressedRatios.filter(r => r < 100).length;
                  const buffers = filtered.map(e => Math.max(0, e.adjustedSCR * ORSA_STRESS_MULTS[si] - e.eligibleOwnFunds));
                  const avgBuf = buffers.length ? Math.round(buffers.reduce((s,b) => s+b,0) / buffers.length) : 0;
                  const totalNeed = Math.round(buffers.reduce((s,b) => s+b,0));
                  const riskLevel = breaches > filtered.length * 0.3 ? 'Severe' : breaches > filtered.length * 0.1 ? 'High' : breaches > 0 ? 'Moderate' : 'Low';
                  return (
                    <tr key={sc} style={{ background: si % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{sc.slice(0,28)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>×{ORSA_STRESS_MULTS[si]}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: avgStressed < 130 ? T.red : T.green, fontWeight: 600 }}>{avgStressed}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: breaches > 0 ? T.red : T.green, fontWeight: 600 }}>{breaches}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{avgBuf > 0 ? '$' + avgBuf.toLocaleString() : '—'}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: totalNeed > 0 ? T.red : T.green }}>{totalNeed > 0 ? '$' + totalNeed.toLocaleString() : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ background: riskLevel === 'Severe' ? '#fee2e2' : riskLevel === 'High' ? '#fef3c7' : riskLevel === 'Moderate' ? '#dbeafe' : '#dcfce7', color: riskLevel === 'Severe' ? T.red : riskLevel === 'High' ? T.amber : riskLevel === 'Moderate' ? T.blue : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{riskLevel}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Green portfolio analysis */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Green Portfolio Investment Analysis</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="green" name="Green Portfolio %" tick={{ fontSize: 10 }} label={{ value: 'Green Portfolio %', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="scr" name="SCR Ratio %" tick={{ fontSize: 10 }} />
                <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name?.slice(0,18)}</b><br/>Green: {payload[0]?.payload?.green}%<br/>SCR: {payload[0]?.payload?.scr}%<br/>Climate Loading: {payload[0]?.payload?.loading?.toFixed(1)}%</div> : null} />
                <Scatter data={filtered.map(e => ({ name: e.name, green: e.investmentPortfolioGreenPct, scr: e.solvencyRatio, loading: e.climateLoading * 100 }))} fill={T.green} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Jurisdiction-level summary */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Jurisdiction Summary — Capital Adequacy by Regulator</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Jurisdiction','Entities','Avg SCR Ratio %','Avg Climate-Adj %','Avg Own Funds $M','Avg Div Benefit $M','Below 130% SCR','Avg Green %'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{JURISDICTIONS.map((j, ji) => {
                const ents = filtered.filter(e => e.jurisdiction === j);
                if (!ents.length) return null;
                const avgSCR = +(ents.reduce((s,e) => s + e.solvencyRatio, 0) / ents.length).toFixed(1);
                const avgClim = +(ents.reduce((s,e) => s + e.climateAdjSolvencyRatio, 0) / ents.length).toFixed(1);
                const avgOF = Math.round(ents.reduce((s,e) => s + e.eligibleOwnFunds, 0) / ents.length);
                const avgDiv = Math.round(ents.reduce((s,e) => s + e.diversificationBenefit, 0) / ents.length);
                const below130 = ents.filter(e => e.solvencyRatio < 130).length;
                const avgGreen = +(ents.reduce((s,e) => s + e.investmentPortfolioGreenPct, 0) / ents.length).toFixed(1);
                return (
                  <tr key={j} style={{ background: ji % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{j}</td>
                    <td style={{ padding: '5px 8px' }}>{ents.length}</td>
                    <td style={{ padding: '5px 8px', color: avgSCR < 130 ? T.red : T.green, fontWeight: 600 }}>{avgSCR}%</td>
                    <td style={{ padding: '5px 8px', color: avgClim < 120 ? T.red : T.amber }}>{avgClim}%</td>
                    <td style={{ padding: '5px 8px' }}>${avgOF.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px' }}>${avgDiv.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: below130 > 0 ? T.red : T.green }}>{below130}</td>
                    <td style={{ padding: '5px 8px' }}>{avgGreen}%</td>
                  </tr>
                );
              }).filter(Boolean)}</tbody>
            </table>
          </div>
          {/* SCR Module Decomposition by Entity Type */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>SCR Module Decomposition — Portfolio Avg by Entity Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={['Life','P&C','Health','Reinsurer','Composite'].map(type => {
                const ents = ENTITIES.filter(e => e.entityType === type);
                if (!ents.length) return null;
                const obj = { name: type };
                SCR_MODULES.forEach((mod, mi) => {
                  obj[mod.slice(0, 8)] = +(ents.reduce((s, e) => s + (e.scrModules?.[mi] || 0), 0) / ents.length).toFixed(0);
                });
                return obj;
              }).filter(Boolean)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {SCR_MODULES.map((mod, mi) => (
                  <Bar key={mod} dataKey={mod.slice(0, 8)} stackId="a" fill={[T.indigo, T.blue, T.teal, T.green, T.amber, T.orange, T.red][mi]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* SCR Portfolio Summary Metrics */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>SCR Portfolio Summary Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Entities Monitored', value: ENTITIES.length, color: T.indigo },
                { label: 'Avg Solvency Ratio', value: (ENTITIES.reduce((s, e) => s + e.solvencyRatio, 0) / ENTITIES.length).toFixed(0) + '%', color: T.green },
                { label: 'Entities Below 130%', value: ENTITIES.filter(e => e.solvencyRatio < 130).length, color: T.red },
                { label: 'Entities Below 100%', value: ENTITIES.filter(e => e.solvencyRatio < 100).length, color: T.red },
                { label: 'Avg BSCR $M', value: '$' + (ENTITIES.reduce((s, e) => s + e.bscr, 0) / ENTITIES.length).toFixed(0) + 'M', color: T.blue },
                { label: 'Total Own Funds $B', value: '$' + (ENTITIES.reduce((s, e) => s + e.eligibleOwnFunds, 0) / 1000).toFixed(1) + 'B', color: T.navy },
                { label: 'Avg Climate Loading', value: (ENTITIES.reduce((s, e) => s + e.climateLoading * 100, 0) / ENTITIES.length).toFixed(1) + '%', color: T.amber },
                { label: 'ORSA Scenarios', value: ORSA_SCENARIOS.length, color: T.teal },
                { label: 'SCR Risk Modules', value: SCR_MODULES.length, color: T.purple },
                { label: 'Avg MCR $M', value: '$' + (ENTITIES.reduce((s, e) => s + e.mcr, 0) / ENTITIES.length).toFixed(0) + 'M', color: T.orange },
                { label: 'Total LAC-DT $M', value: '$' + ENTITIES.reduce((s, e) => s + e.lacDT, 0).toFixed(0) + 'M', color: T.gold },
                { label: 'Avg Green Portfolio', value: (ENTITIES.reduce((s, e) => s + e.greenPortfolioPct, 0) / ENTITIES.length).toFixed(1) + '%', color: T.green },
              ].map(m => (
                <div key={m.label} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Solvency Alert Banner */}
          <div style={{ background: '#fff8f0', border: `1px solid ${T.amber}`, borderRadius: 8, padding: '12px 16px', marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.amber, marginBottom: 4 }}>Capital Adequacy Alert — Portfolio-Level SCR Status</div>
              <div style={{ fontSize: 11, color: T.text }}>
                {ENTITIES.filter(e => e.solvencyRatio < 130).length} entities below 130% SCR threshold.
                {ENTITIES.filter(e => e.solvencyRatio < 100).length > 0 ? ` ${ENTITIES.filter(e => e.solvencyRatio < 100).length} entities BELOW 100% — immediate supervisory action required.` : ' All entities above 100% minimum capital requirement.'}
                Average climate loading: {(ENTITIES.reduce((s, e) => s + e.climateLoading * 100, 0) / ENTITIES.length).toFixed(1)}% above standard SCR.
              </div>
            </div>
          </div>
          {/* Capital Adequacy Distribution */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Solvency Ratio Distribution — Entity Portfolio</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { range: '<100%', count: ENTITIES.filter(e => e.solvencyRatio < 100).length, color: T.red },
                { range: '100–130%', count: ENTITIES.filter(e => e.solvencyRatio >= 100 && e.solvencyRatio < 130).length, color: T.orange },
                { range: '130–150%', count: ENTITIES.filter(e => e.solvencyRatio >= 130 && e.solvencyRatio < 150).length, color: T.amber },
                { range: '150–200%', count: ENTITIES.filter(e => e.solvencyRatio >= 150 && e.solvencyRatio < 200).length, color: T.teal },
                { range: '>200%', count: ENTITIES.filter(e => e.solvencyRatio >= 200).length, color: T.green },
              ]} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [v + ' entities', 'Count']} />
                <Bar dataKey="count" name="Entity Count">
                  {[T.red, T.orange, T.amber, T.teal, T.green].map((color, i) => (
                    <rect key={i} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Entity Capital Quality Analysis */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Capital Quality — Tier 1 vs Tier 2/3 Breakdown by Entity Type</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={['Life','P&C','Health','Reinsurer','Composite'].map(type => {
                const ents = ENTITIES.filter(e => e.entityType === type);
                if (!ents.length) return null;
                const avgT1 = (ents.reduce((s, e) => s + e.tier1Pct, 0) / ents.length).toFixed(1);
                const avgT2 = (ents.reduce((s, e) => s + (e.tier2Pct || 0), 0) / ents.length).toFixed(1);
                const avgT3 = +(100 - +avgT1 - +avgT2).toFixed(1);
                return { name: type, tier1: +avgT1, tier2: +avgT2, tier3: Math.max(0, avgT3) };
              }).filter(Boolean)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => [v + '%', '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="tier1" name="Tier 1 %" fill={T.green} stackId="a" />
                <Bar dataKey="tier2" name="Tier 2 %" fill={T.amber} stackId="a" />
                <Bar dataKey="tier3" name="Tier 3 %" fill={T.red} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* ORSA Scenario Full Impact Table */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>ORSA Scenario Impact — Portfolio Average Solvency Ratio by Scenario</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['ORSA Scenario', 'Category', 'Severity', 'Avg Solvency Ratio', 'Entities <130%', 'Entities <100%', 'Avg SCR Adj $M', 'SCR Δ% vs Base'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{ORSA_SCENARIOS.map((s, si) => {
                  const mult = ORSA_STRESS_MULTS[si];
                  const avgSR = ENTITIES.length ? ENTITIES.reduce((sum, e) => {
                    const stressedSCR = e.adjustedSCR * mult;
                    return sum + (stressedSCR > 0 ? e.eligibleOwnFunds / stressedSCR * 100 : 200);
                  }, 0) / ENTITIES.length : 0;
                  const below130 = ENTITIES.filter(e => {
                    const stressed = e.adjustedSCR * mult;
                    return stressed > 0 && e.eligibleOwnFunds / stressed * 100 < 130;
                  }).length;
                  const below100 = ENTITIES.filter(e => {
                    const stressed = e.adjustedSCR * mult;
                    return stressed > 0 && e.eligibleOwnFunds / stressed * 100 < 100;
                  }).length;
                  const avgSCR = ENTITIES.length ? ENTITIES.reduce((sum, e) => sum + e.adjustedSCR * mult, 0) / ENTITIES.length : 0;
                  const baseSCR = ENTITIES.length ? ENTITIES.reduce((sum, e) => sum + e.adjustedSCR, 0) / ENTITIES.length : 1;
                  const scrDelta = baseSCR > 0 ? ((avgSCR - baseSCR) / baseSCR * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={s.name} style={{ background: si % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600, fontSize: 11 }}>{s.name.slice(0, 22)}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10, color: T.muted }}>{s.category}</td>
                      <td style={{ padding: '5px 8px' }}><span style={{ background: s.severity === 'Extreme' ? '#fee2e2' : s.severity === 'Severe' ? '#fef3c7' : '#dbeafe', color: s.severity === 'Extreme' ? T.red : s.severity === 'Severe' ? T.amber : T.blue, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{s.severity}</span></td>
                      <td style={{ padding: '5px 8px', fontWeight: 700, color: avgSR < 130 ? T.red : T.green }}>{avgSR.toFixed(0)}%</td>
                      <td style={{ padding: '5px 8px', color: below130 > 5 ? T.red : T.amber }}>{below130}</td>
                      <td style={{ padding: '5px 8px', color: below100 > 0 ? T.red : T.text, fontWeight: below100 > 0 ? 700 : 400 }}>{below100}</td>
                      <td style={{ padding: '5px 8px' }}>${avgSCR.toFixed(0)}M</td>
                      <td style={{ padding: '5px 8px', color: +scrDelta > 0 ? T.red : T.green }}>+{scrDelta}%</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
