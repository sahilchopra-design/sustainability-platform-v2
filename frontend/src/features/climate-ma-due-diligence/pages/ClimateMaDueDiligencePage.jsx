/* EP-DD3: Climate M&A Due Diligence — Sprint DD */
import React, { useState, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Utilities', 'Industrials', 'Materials', 'Real Estate', 'Consumer'];
const COUNTRIES = ['USA', 'UK', 'Germany', 'France', 'Australia', 'Canada', 'Japan', 'Brazil'];
const SBTI_STATUS = ['Committed', 'Targets Set', 'Not Committed', 'In Progress'];
const DEAL_STATUS = ['Active DD', 'Under Review', 'Term Sheet', 'Closed', 'Declined'];

const TARGETS = Array.from({ length: 45 }, (_, i) => {
  const sec = SECTORS[i % 6];
  const ev = 0.5 + sr(i * 7) * 24.5;
  const revenue = ev * (0.3 + sr(i * 11) * 0.7);
  const ebitda = revenue * (0.08 + sr(i * 13) * 0.22);
  const scope1 = sec === 'Energy' ? 500 + sr(i * 17) * 4500 : sec === 'Materials' ? 200 + sr(i * 17) * 1800 : 20 + sr(i * 17) * 480;
  const scope2 = scope1 * (0.1 + sr(i * 19) * 0.3);
  const scope3 = scope1 * (2 + sr(i * 23) * 8);
  const physicalRiskScore = sr(i * 29) * 85 + 10;
  const transitionRiskScore = sr(i * 31) * 80 + 15;
  const esgScore = 25 + sr(i * 37) * 65;
  const strandedAssetPct = sec === 'Energy' ? 15 + sr(i * 41) * 45 : sec === 'Materials' ? 5 + sr(i * 41) * 25 : sr(i * 41) * 8;
  const fossilRevenuePct = sec === 'Energy' ? 40 + sr(i * 43) * 55 : sec === 'Materials' ? 10 + sr(i * 43) * 30 : sr(i * 43) * 10;
  const greenRevenuePct = 100 - fossilRevenuePct - sr(i * 47) * (100 - fossilRevenuePct) * 0.5;
  const climateValAdj = -(physicalRiskScore * 0.05 + transitionRiskScore * 0.06 + strandedAssetPct * 0.04);
  return {
    id: i + 1,
    name: `${['Nexus', 'Apex', 'Horizon', 'Vertex', 'Summit', 'Crest', 'Pinnacle', 'Zenith', 'Peak'][i % 9]} ${sec} ${['Corp', 'Group', 'Holdings', 'Ltd', 'AG'][i % 5]}`,
    sector: sec,
    country: COUNTRIES[i % 8],
    ev: +ev.toFixed(1),
    revenue: +revenue.toFixed(1),
    ebitda: +ebitda.toFixed(2),
    scope1: +scope1.toFixed(0),
    scope2: +scope2.toFixed(0),
    scope3: +scope3.toFixed(0),
    carbonIntensity: +(scope1 / Math.max(0.01, revenue) / 10).toFixed(1),
    physicalRiskScore: +physicalRiskScore.toFixed(1),
    transitionRiskScore: +transitionRiskScore.toFixed(1),
    regulatoryRisk: +(sr(i * 53) * 80 + 10).toFixed(1),
    strandedAssetPct: +strandedAssetPct.toFixed(1),
    sbtiStatus: SBTI_STATUS[Math.floor(sr(i * 59) * 4)],
    nzCommitment: sr(i * 61) > 0.5,
    esgScore: +esgScore.toFixed(1),
    litigationRisk: +(sr(i * 67) * 70 + 5).toFixed(1),
    climateValAdj: +climateValAdj.toFixed(1),
    greenRevenuePct: +greenRevenuePct.toFixed(1),
    fossilRevenuePct: +fossilRevenuePct.toFixed(1),
    capexGreenPct: +(sr(i * 71) * 60 + 5).toFixed(1),
    dealStatus: DEAL_STATUS[Math.floor(sr(i * 73) * 5)],
  };
});

const TABS = ['Deal Screening', 'Physical Risk Assessment', 'Transition Risk', 'Stranded Asset Analysis', 'Regulatory Exposure', 'ESG Integration', 'Valuation Adjustment', 'Deal Scorecard'];
const SECTOR_COLORS = { Energy: '#dc2626', Utilities: '#2563eb', Industrials: '#d97706', Materials: '#7c3aed', 'Real Estate': '#0891b2', Consumer: '#059669' };

const CRITERIA_WEIGHTS = [
  { criterion: 'ESG Score', weight: 0.20 },
  { criterion: 'Physical Risk', weight: 0.18, inverse: true },
  { criterion: 'Transition Risk', weight: 0.15, inverse: true },
  { criterion: 'Stranded Asset %', weight: 0.15, inverse: true },
  { criterion: 'Green Revenue %', weight: 0.12 },
  { criterion: 'SBTi Status', weight: 0.10 },
  { criterion: 'Litigation Risk', weight: 0.10, inverse: true },
];

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
export default function ClimateMaDueDiligencePage() {

  const [tab, setTab] = useState(0);
  const [filterSector, setFilterSector] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(75);
  const [selectedTarget, setSelectedTarget] = useState(TARGETS[0]);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );

  const filtered = useMemo(() => TARGETS.filter(d =>
    (filterSector === 'All' || d.sector === filterSector) &&
    (filterStatus === 'All' || d.dealStatus === filterStatus)
  ), [filterSector, filterStatus]);

  const avgEv = filtered.length ? filtered.reduce((s, d) => s + d.ev, 0) / filtered.length : 0;
  const avgClimateAdj = filtered.length ? filtered.reduce((s, d) => s + d.climateValAdj, 0) / filtered.length : 0;
  const highRisk = filtered.filter(d => d.physicalRiskScore > 60 || d.transitionRiskScore > 60).length;
  const sbtiAligned = filtered.filter(d => d.sbtiStatus === 'Targets Set' || d.sbtiStatus === 'Committed').length;
  const avgStranded = filtered.length ? filtered.reduce((s, d) => s + d.strandedAssetPct, 0) / filtered.length : 0;

  const sectorRiskProfile = useMemo(() => SECTORS.map(s => {
    const arr = TARGETS.filter(d => d.sector === s);
    return {
      sector: s,
      physicalRisk: arr.length ? +(arr.reduce((sum, d) => sum + d.physicalRiskScore, 0) / arr.length).toFixed(1) : 0,
      transitionRisk: arr.length ? +(arr.reduce((sum, d) => sum + d.transitionRiskScore, 0) / arr.length).toFixed(1) : 0,
      strandedAsset: arr.length ? +(arr.reduce((sum, d) => sum + d.strandedAssetPct, 0) / arr.length).toFixed(1) : 0,
      esgScore: arr.length ? +(arr.reduce((sum, d) => sum + d.esgScore, 0) / arr.length).toFixed(1) : 0,
    };
  }), []);

  const carbonLiabilityNpv = useMemo(() => filtered.slice(0, 12).map(d => {
    const scope12 = d.scope1 + d.scope2;
    const lowNpv = scope12 * 30 / 1000000;
    const midNpv = scope12 * carbonPrice / 1000000;
    const highNpv = scope12 * 200 / 1000000;
    return {
      name: d.name.split(' ')[0],
      low: +lowNpv.toFixed(2),
      mid: +midNpv.toFixed(2),
      high: +highNpv.toFixed(2),
      haircut: +((midNpv / Math.max(0.01, d.ev)) * 100).toFixed(1),
    };
  }), [filtered, carbonPrice]);

  const regulatoryData = useMemo(() => filtered.slice(0, 10).map(d => ({
    name: d.name.split(' ')[0],
    fineExposure: +(d.regulatoryRisk * d.ev * 0.003).toFixed(2),
    carbonTax: +(d.scope1 * carbonPrice / 1000000).toFixed(2),
    litigationLiability: +(d.litigationRisk * d.ev * 0.002).toFixed(2),
    totalExposure: +(d.regulatoryRisk * d.ev * 0.003 + d.scope1 * carbonPrice / 1000000 + d.litigationRisk * d.ev * 0.002).toFixed(2),
  })), [filtered, carbonPrice]);

  const scorecardData = useMemo(() => {
    const d = selectedTarget;
    return [
      { criterion: 'ESG Score', score: d.esgScore, weight: 20, color: T.green },
      { criterion: 'Physical Risk', score: 100 - d.physicalRiskScore, weight: 18, color: T.blue },
      { criterion: 'Transition Risk', score: 100 - d.transitionRiskScore, weight: 15, color: T.indigo },
      { criterion: 'Stranded Assets', score: 100 - d.strandedAssetPct, weight: 15, color: T.amber },
      { criterion: 'Green Revenue', score: d.greenRevenuePct, weight: 12, color: T.teal },
      { criterion: 'SBTi Status', score: d.sbtiStatus === 'Targets Set' ? 90 : d.sbtiStatus === 'Committed' ? 70 : d.sbtiStatus === 'In Progress' ? 50 : 20, weight: 10, color: T.navy },
      { criterion: 'Litigation Risk', score: 100 - d.litigationRisk, weight: 10, color: T.red },
    ];
  }, [selectedTarget, T]);

  const compositeScore = useMemo(() => {
    const total = scorecardData.reduce((s, c) => s + c.score * c.weight / 100, 0);
    return +total.toFixed(1);
  }, [scorecardData]);

  const radarData = useMemo(() => scorecardData.map(c => ({
    criterion: c.criterion.substring(0, 12),
    score: +c.score.toFixed(0),
  })), [scorecardData]);

  const valuationAdj = useMemo(() => filtered.slice(0, 10).map(d => {
    const baseEv = d.ev;
    const physAdj = -(d.physicalRiskScore / 100 * 0.08 * baseEv);
    const transAdj = -(d.transitionRiskScore / 100 * 0.10 * baseEv);
    const strandedAdj = -(d.strandedAssetPct / 100 * 0.12 * baseEv);
    const esgUplift = (d.esgScore / 100 * 0.05 * baseEv);
    const adjustedEv = baseEv + physAdj + transAdj + strandedAdj + esgUplift;
    return {
      name: d.name.split(' ')[0],
      baseEv: +baseEv.toFixed(1),
      adjustedEv: +adjustedEv.toFixed(1),
      adjPct: +((adjustedEv - baseEv) / Math.max(0.01, baseEv) * 100).toFixed(1),
      physAdj: +physAdj.toFixed(2),
      transAdj: +transAdj.toFixed(2),
      strandedAdj: +strandedAdj.toFixed(2),
      esgUplift: +esgUplift.toFixed(2),
    };
  }), [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DD3 · CORPORATE FINANCE & CAPITAL MARKETS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Climate M&A Due Diligence</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>45 target companies · 6 sectors · Climate-adjusted valuation · Stranded asset haircut · Deal scorecard</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Statuses</option>
          {DEAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Carbon Price: ${carbonPrice}/tCO₂</span>
          <input type="range" min={30} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <select value={selectedTarget.id} onChange={e => setSelectedTarget(TARGETS.find(d => d.id === +e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          {TARGETS.map(d => <option key={d.id} value={d.id}>{d.name.split(' ')[0]} — {d.sector}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Target EV" value={`$${avgEv.toFixed(1)}Bn`} sub={`${filtered.length} companies`} color={T.navy} />
        <KpiCard label="Avg Climate Adj" value={`${avgClimateAdj.toFixed(1)}%`} sub="Valuation haircut" color={T.red} />
        <KpiCard label="High Climate Risk" value={`${highRisk}/${filtered.length}`} sub="Physical or transition" color={T.amber} />
        <KpiCard label="SBTi Aligned" value={`${sbtiAligned}/${filtered.length}`} sub="Committed or targets" color={T.green} />
        <KpiCard label="Avg Stranded Assets" value={`${avgStranded.toFixed(1)}%`} sub="Of total assets" color={T.orange} />
        <KpiCard label="Deal Scorecard" value={`${compositeScore}/100`} sub={selectedTarget.name.split(' ')[0]} color={compositeScore > 70 ? T.green : compositeScore > 50 ? T.amber : T.red} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Deal Screening */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Deal Pipeline by Status</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DEAL_STATUS.map(s => ({ status: s, count: TARGETS.filter(d => d.dealStatus === s).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="status" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Deals" fill={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EV vs ESG Score (bubble = stranded %)</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="ESG Score" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis dataKey="y" name="EV $Bn" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <ZAxis dataKey="z" range={[30, 300]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'EV $Bn' ? `$${v}Bn` : v, n]} />
                  {SECTORS.map(s => (
                    <Scatter key={s} name={s} data={filtered.filter(d => d.sector === s).map(d => ({ x: d.esgScore, y: d.ev, z: d.strandedAssetPct, name: d.name }))} fill={SECTOR_COLORS[s]} fillOpacity={0.7} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Target Company Registry</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Company', 'Sector', 'Country', 'EV $Bn', 'Climate Adj %', 'ESG', 'SBTi', 'Deal Status', 'Recommendation'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((d, i) => {
                    const rec = d.esgScore > 65 && d.strandedAssetPct < 15 ? 'Proceed' : d.esgScore > 45 && d.strandedAssetPct < 30 ? 'Conditional' : 'Decline';
                    return (
                      <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                        <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                        <td style={{ padding: '7px 12px' }}><span style={{ background: SECTOR_COLORS[d.sector] + '22', color: SECTOR_COLORS[d.sector], padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{d.sector}</span></td>
                        <td style={{ padding: '7px 12px', fontSize: 11 }}>{d.country}</td>
                        <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${d.ev}Bn</td>
                        <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.red }}>{d.climateValAdj.toFixed(1)}%</td>
                        <td style={{ padding: '7px 12px', color: d.esgScore > 65 ? T.green : d.esgScore > 45 ? T.amber : T.red }}>{d.esgScore.toFixed(0)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 10, color: d.sbtiStatus === 'Targets Set' ? T.green : T.textSec }}>{d.sbtiStatus}</td>
                        <td style={{ padding: '7px 12px', fontSize: 10 }}>{d.dealStatus}</td>
                        <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: rec === 'Proceed' ? T.green : rec === 'Conditional' ? T.amber : T.red }}>{rec}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Physical Risk Assessment */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Physical Risk by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorRiskProfile}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="physicalRisk" name="Physical Risk Score" fill={T.red} />
                  <Bar dataKey="transitionRisk" name="Transition Risk Score" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Physical vs Transition Risk Matrix</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Physical Risk" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} label={{ value: 'Physical Risk', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Transition Risk" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} label={{ value: 'Transition Risk', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <ZAxis dataKey="z" range={[40, 200]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v.toFixed(0), n]} />
                  {SECTORS.map(s => (
                    <Scatter key={s} name={s} data={filtered.filter(d => d.sector === s).map(d => ({ x: d.physicalRiskScore, y: d.transitionRiskScore, z: d.ev, name: d.name }))} fill={SECTOR_COLORS[s]} fillOpacity={0.75} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Company', 'Sector', 'Physical Risk', 'Transition Risk', 'Reg. Risk', 'Litigation Risk', 'Combined Climate Risk', 'Flag'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => (b.physicalRiskScore + b.transitionRiskScore) - (a.physicalRiskScore + a.transitionRiskScore)).slice(0, 12).map((d, i) => {
                  const combined = (d.physicalRiskScore + d.transitionRiskScore + d.regulatoryRisk) / 3;
                  return (
                    <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name.split(' ').slice(0, 2).join(' ')}</td>
                      <td style={{ padding: '7px 12px', fontSize: 10, color: SECTOR_COLORS[d.sector] }}>{d.sector}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.physicalRiskScore > 65 ? T.red : d.physicalRiskScore > 40 ? T.amber : T.green }}>{d.physicalRiskScore.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.transitionRiskScore > 65 ? T.red : d.transitionRiskScore > 40 ? T.amber : T.green }}>{d.transitionRiskScore.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.regulatoryRisk.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.litigationRisk.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: combined > 60 ? T.red : combined > 40 ? T.amber : T.green }}>{combined.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11, color: combined > 60 ? T.red : T.textSec }}>{combined > 60 ? '⚠ HIGH RISK' : combined > 40 ? 'Moderate' : '✓ Low'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Transition Risk */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Fossil vs Green Revenue Mix</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filtered.slice(0, 12).map(d => ({ name: d.name.split(' ')[0], fossil: d.fossilRevenuePct, green: d.greenRevenuePct }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  <Bar dataKey="fossil" name="Fossil Revenue %" stackId="a" fill={T.red} />
                  <Bar dataKey="green" name="Green Revenue %" stackId="a" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Green Capex % by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorRiskProfile.map(s => ({ ...s, capexGreen: +(TARGETS.filter(d => d.sector === s.sector).reduce((sum, d) => sum + d.capexGreenPct, 0) / Math.max(1, TARGETS.filter(d => d.sector === s.sector).length)).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="capexGreen" name="Green Capex %" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Stranded Asset Analysis */}
      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Carbon Liability NPV — Carbon Price: ${carbonPrice}/tCO₂</div>
            <input type="range" min={30} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: '100%', marginBottom: 16 }} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={carbonLiabilityNpv}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Bar dataKey="low" name="$30/t (Low)" fill={T.green} />
                <Bar dataKey="mid" name={`$${carbonPrice}/t (Mid)`} fill={T.amber} />
                <Bar dataKey="high" name="$200/t (High)" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Regulatory Exposure */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Total Regulatory Exposure ($Bn)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regulatoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Bar dataKey="fineExposure" name="Reg. Fine Exposure" stackId="a" fill={T.red} />
                <Bar dataKey="carbonTax" name="Carbon Tax Liability" stackId="a" fill={T.amber} />
                <Bar dataKey="litigationLiability" name="Litigation Liability" stackId="a" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: ESG Integration */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ESG Score Distribution by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorRiskProfile}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="esgScore" name="Avg ESG Score">
                    {sectorRiskProfile.map((e, i) => <Cell key={i} fill={SECTOR_COLORS[e.sector]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>SBTi Status Distribution</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {SBTI_STATUS.map(s => {
                  const count = filtered.filter(d => d.sbtiStatus === s).length;
                  const pct = filtered.length ? (count / filtered.length * 100) : 0;
                  const color = s === 'Targets Set' ? T.green : s === 'Committed' ? T.teal : s === 'In Progress' ? T.amber : T.red;
                  return (
                    <div key={s}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>{s}</span>
                        <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: 10, background: T.border, borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Valuation Adjustment */}
      {tab === 6 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate-Adjusted EV vs Base EV ($Bn)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valuationAdj}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Bar dataKey="baseEv" name="Base EV $Bn" fill={T.blue} />
                <Bar dataKey="adjustedEv" name="Climate-Adj EV $Bn" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Company', 'Base EV', 'Physical Adj', 'Transition Adj', 'Stranded Adj', 'ESG Uplift', 'Adj EV', 'Total Adj %'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {valuationAdj.map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${d.baseEv}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.red }}>{d.physAdj.toFixed(2)}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.amber }}>{d.transAdj.toFixed(2)}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.red }}>{d.strandedAdj.toFixed(2)}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>+{d.esgUplift.toFixed(2)}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>${d.adjustedEv}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.adjPct < 0 ? T.red : T.green }}>{d.adjPct > 0 ? '+' : ''}{d.adjPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Deal Scorecard */}
      {tab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Deal Scorecard — {selectedTarget.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>{selectedTarget.sector} · {selectedTarget.country} · EV: ${selectedTarget.ev}Bn</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: compositeScore > 70 ? T.green : compositeScore > 50 ? T.amber : T.red, marginBottom: 16, textAlign: 'center' }}>
                {compositeScore}/100
                <div style={{ fontSize: 13, fontWeight: 400, color: compositeScore > 70 ? T.green : compositeScore > 50 ? T.amber : T.red }}>{compositeScore > 70 ? 'PROCEED' : compositeScore > 50 ? 'CONDITIONAL' : 'DECLINE'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scorecardData.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11 }}>{c.criterion} <span style={{ color: T.textSec }}>({c.weight}%)</span></span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: c.score > 65 ? T.green : c.score > 40 ? T.amber : T.red }}>{c.score.toFixed(0)}/100</span>
                    </div>
                    <div style={{ height: 7, background: T.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${c.score}%`, background: c.color, borderRadius: 3, opacity: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate DD Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Score" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
