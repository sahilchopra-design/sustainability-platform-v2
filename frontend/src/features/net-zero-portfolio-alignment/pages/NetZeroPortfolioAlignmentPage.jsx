import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS_NZ = ['Energy','Utilities','Materials','Industrials','Financials','Technology','Healthcare','Consumer Disc.'];
const SBT_STATUS = ['Approved','Committed','None'];
const COUNTRIES_NZ = ['US','UK','DE','FR','JP','CN','CA','AU','NL','SE','BR','IN'];
const ENGAGEMENT_OUTCOMES = ['High','Medium','Low','None'];

const HOLDINGS = Array.from({ length: 120 }, (_, i) => {
  const sec = SECTORS_NZ[Math.floor(sr(i * 7 + 1) * SECTORS_NZ.length)];
  const s1 = sr(i * 11 + 2) * 500000 + 1000;
  const s2 = sr(i * 13 + 3) * 200000 + 500;
  const s3u = sr(i * 17 + 4) * 800000 + 2000;
  const s3d = sr(i * 19 + 5) * 600000 + 1500;
  const rev = sr(i * 23 + 6) * 5000 + 200; // $M
  const evic = rev * (sr(i * 29 + 7) * 3 + 0.5);
  const itr = sr(i * 31 + 8) * 3 + 1.5;
  const sbt = SBT_STATUS[Math.floor(sr(i * 37 + 9) * SBT_STATUS.length)];
  const eng = ENGAGEMENT_OUTCOMES[Math.floor(sr(i * 41 + 10) * ENGAGEMENT_OUTCOMES.length)];
  const rawW = sr(i * 43 + 11) * 0.02 + 0.001;
  return {
    id: i,
    name: `${sec.substring(0, 3).toUpperCase()}-H${String(i + 1).padStart(3, '0')}`,
    sector: sec,
    country: COUNTRIES_NZ[Math.floor(sr(i * 47 + 12) * COUNTRIES_NZ.length)],
    weight: rawW,
    scope1: s1,
    scope2: s2,
    scope3Upstream: s3u,
    scope3Downstream: s3d,
    revenueUSD: rev,
    evic,
    temperature: itr,
    sbtStatus: sbt,
    nzamaAligned: sr(i * 53 + 13) > 0.5,
    capexGreenPct: sr(i * 59 + 14) * 60,
    capexFossilPct: sr(i * 61 + 15) * 40,
    emissionReductionPledge: sr(i * 67 + 16) * 60,
    baselineYear: 2019,
    targetYear2030: -(sr(i * 71 + 17) * 50 + 10),
    targetYear2050: -(sr(i * 73 + 18) * 80 + 15),
    physicalRisk: sr(i * 79 + 19) * 100,
    transitionRisk: sr(i * 83 + 20) * 100,
    engagementOutcome: eng,
    lcoe: sec === 'Energy' ? sr(i * 89 + 21) * 80 + 20 : null,
  };
});

const totalW = HOLDINGS.reduce((s, x) => s + x.weight, 0);
const HOLDINGS_N = HOLDINGS.map(h => ({ ...h, weight: h.weight / totalW }));

// WACI = tCO2e / $M revenue
const computeWACI = (holdings, scope) => {
  if (!holdings.length) return 0;
  return holdings.reduce((s, h) => {
    const em = scope === '1' ? h.scope1 : scope === '2' ? h.scope2 : scope === '3' ? h.scope3Upstream + h.scope3Downstream : h.scope1 + h.scope2 + h.scope3Upstream;
    return s + h.weight * (h.revenueUSD > 0 ? em / h.revenueUSD : 0);
  }, 0);
};

const DECARBONIZATION_PATHS = Array.from({ length: 26 }, (_, i) => {
  const yr = 2025 + i;
  const t = i / 25;
  return {
    year: yr,
    portfolio: 100 * Math.pow(0.6, t),
    sbt15: 100 * Math.pow(0.5, t * 1.1),
    gfanz: 100 * Math.pow(0.55, t),
    budget15: 100 * Math.pow(0.45, t * 1.2),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Alignment Dashboard','Holdings Analysis','Emissions Analytics','PAII Framework','Decarbonization Pathways','Engagement Impact','Summary & Export'];

export default function NetZeroPortfolioAlignmentPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sbtFilter, setSbtFilter] = useState('All');
  const [itrMin, setItrMin] = useState(1.5);
  const [itrMax, setItrMax] = useState(4.5);
  const [weightThreshold, setWeightThreshold] = useState(0);
  const [scopeSelect, setScopeSelect] = useState('1+2+3');
  const [engagementFilter, setEngagementFilter] = useState('All');
  const [engagementPct, setEngagementPct] = useState(30);

  const filtered = useMemo(() => {
    return HOLDINGS_N.filter(h =>
      (sectorFilter === 'All' || h.sector === sectorFilter) &&
      (sbtFilter === 'All' || h.sbtStatus === sbtFilter) &&
      h.temperature >= itrMin && h.temperature <= itrMax &&
      h.weight * 100 >= weightThreshold &&
      (engagementFilter === 'All' || h.engagementOutcome === engagementFilter)
    );
  }, [sectorFilter, sbtFilter, itrMin, itrMax, weightThreshold, engagementFilter]);

  const portfolioITR = useMemo(() => {
    if (!filtered.length) return 0;
    const tw = filtered.reduce((s, h) => s + h.weight, 0);
    return tw > 0 ? filtered.reduce((s, h) => s + (h.weight / tw) * h.temperature, 0) : 0;
  }, [filtered]);

  const waci = useMemo(() => {
    const scope = scopeSelect === '1+2+3' ? 'all' : scopeSelect === '1+2' ? '12' : scopeSelect;
    return computeWACI(filtered, scope === 'all' ? 'all' : scope);
  }, [filtered, scopeSelect]);

  const engagementITRImpact = useMemo(() => {
    const engagedPortion = engagementPct / 100;
    const improvement = engagedPortion * 0.1; // 0.1°C per engagement level
    return Math.max(0, portfolioITR - improvement).toFixed(2);
  }, [engagementPct, portfolioITR]);

  const sbtBreakdown = useMemo(() => {
    const map = { Approved: 0, Committed: 0, None: 0 };
    filtered.forEach(h => { map[h.sbtStatus] = (map[h.sbtStatus] || 0) + h.weight * 100; });
    return Object.entries(map).map(([status, weight]) => ({ status, weight: +weight.toFixed(2) }));
  }, [filtered]);

  const sectorEmissions = useMemo(() => {
    const map = {};
    filtered.forEach(h => {
      if (!map[h.sector]) map[h.sector] = { sector: h.sector, s1: 0, s2: 0, s3: 0 };
      const scale = h.revenueUSD > 0 ? h.weight / h.revenueUSD : 0;
      map[h.sector].s1 += h.scope1 * scale;
      map[h.sector].s2 += h.scope2 * scale;
      map[h.sector].s3 += (h.scope3Upstream + h.scope3Downstream) * scale;
    });
    return Object.values(map);
  }, [filtered]);

  const paiiIndicators = useMemo(() => {
    if (!filtered.length) return [];
    const tw = filtered.reduce((s, h) => s + h.weight, 0);
    return filtered.slice(0, 30).map(h => ({
      name: h.name,
      sector: h.sector,
      wt: (h.weight / tw * 100).toFixed(3),
      itr: h.temperature.toFixed(2),
      sbt: h.sbtStatus,
      nzama: h.nzamaAligned ? 'Yes' : 'No',
      capexGreen: h.capexGreenPct.toFixed(1) + '%',
      pledge: h.emissionReductionPledge.toFixed(1) + '%',
      engagement: h.engagementOutcome,
    }));
  }, [filtered]);

  const alignmentBands = useMemo(() => ({
    aligned15: filtered.filter(h => h.temperature <= 1.8).length,
    aligned20: filtered.filter(h => h.temperature > 1.8 && h.temperature <= 2.5).length,
    misaligned: filtered.filter(h => h.temperature > 2.5).length,
  }), [filtered]);

  const engagementMatrix = useMemo(() => {
    return ENGAGEMENT_OUTCOMES.map(eng => {
      const holdings = filtered.filter(h => h.engagementOutcome === eng);
      const avgITR = holdings.length ? holdings.reduce((s, h) => s + h.temperature, 0) / holdings.length : 0;
      const improvement = eng === 'High' ? 0.3 : eng === 'Medium' ? 0.15 : eng === 'Low' ? 0.05 : 0;
      return { engagement: eng, count: holdings.length, avgITR: +avgITR.toFixed(2), projectedITR: +(avgITR - improvement).toFixed(2), improvement };
    });
  }, [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CZ2 · NET ZERO PORTFOLIO ALIGNMENT</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Net Zero Portfolio Alignment</h1>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PAII/GFANZ methodology · 120 holdings · SBT tracking · engagement-adjusted ITR</div>
      </div>

      {/* Controls */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Sectors</option>
          {SECTORS_NZ.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sbtFilter} onChange={e => setSbtFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All SBT Status</option>
          {SBT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={engagementFilter} onChange={e => setEngagementFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Engagement</option>
          {ENGAGEMENT_OUTCOMES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={scopeSelect} onChange={e => setScopeSelect(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="1+2+3">Scope 1+2+3</option>
          <option value="1+2">Scope 1+2</option>
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>
        <label style={{ fontSize: 12, color: T.muted }}>ITR: {itrMin.toFixed(1)}–{itrMax.toFixed(1)}°C
          <input type="range" min={15} max={45} value={itrMin * 10} onChange={e => setItrMin(+e.target.value / 10)} style={{ marginLeft: 8, width: 70 }} />
          <input type="range" min={15} max={45} value={itrMax * 10} onChange={e => setItrMax(+e.target.value / 10)} style={{ marginLeft: 4, width: 70 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>Min weight: {weightThreshold.toFixed(2)}%
          <input type="range" min={0} max={2} step={0.1} value={weightThreshold} onChange={e => setWeightThreshold(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '12px 16px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.indigo : T.muted, background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* TAB 0: Alignment Dashboard */}
        {activeTab === 0 && (
          <div>
            {/* ITR Gauge */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ background: T.card, border: `3px solid ${portfolioITR <= 1.8 ? T.green : portfolioITR <= 2.5 ? T.amber : T.red}`, borderRadius: 12, padding: '20px 32px', textAlign: 'center', minWidth: 180 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: '0.08em' }}>PORTFOLIO ITR</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: portfolioITR <= 1.8 ? T.green : portfolioITR <= 2.5 ? T.amber : T.red, lineHeight: 1.1 }}>{portfolioITR.toFixed(2)}°C</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                  {portfolioITR <= 1.8 ? '✓ 1.5°C Aligned' : portfolioITR <= 2.5 ? '⚠ 2°C Range' : '✗ Misaligned'}
                </div>
              </div>
              <KpiCard label="WACI" value={waci.toFixed(1)} sub="tCO₂e/$M revenue" color={T.amber} />
              <KpiCard label="SBT Approved %" value={`${(filtered.filter(h => h.sbtStatus === 'Approved').length / (filtered.length || 1) * 100).toFixed(1)}%`} sub="of holdings" color={T.green} />
              <KpiCard label="NZAMA Aligned" value={`${(filtered.filter(h => h.nzamaAligned).length / (filtered.length || 1) * 100).toFixed(1)}%`} sub="by count" color={T.teal} />
              <KpiCard label="Avg Green Capex" value={`${filtered.length ? (filtered.reduce((s, h) => s + h.capexGreenPct, 0) / filtered.length).toFixed(1) : 0}%`} sub="of total capex" color={T.green} />
              <KpiCard label="Holdings" value={filtered.length} sub={`of 120`} />
            </div>

            {/* Alignment status barchart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ITR Alignment Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { label: '≤1.8°C Paris', count: alignmentBands.aligned15, pct: (alignmentBands.aligned15 / (filtered.length || 1) * 100).toFixed(1) },
                    { label: '1.8-2.5°C Range', count: alignmentBands.aligned20, pct: (alignmentBands.aligned20 / (filtered.length || 1) * 100).toFixed(1) },
                    { label: '>2.5°C Off-Track', count: alignmentBands.misaligned, pct: (alignmentBands.misaligned / (filtered.length || 1) * 100).toFixed(1) },
                  ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n, p) => [`${v} holdings (${p.payload.pct}%)`, 'Count']} />
                    <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>SBT Status Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sbtBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}%`, 'Portfolio Weight']} />
                    <Bar dataKey="weight" fill={T.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Holdings Analysis */}
        {activeTab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Holdings ITR Heatmap — {filtered.length} holdings</h3>
              <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub, position: 'sticky', top: 0 }}>
                      {['Name','Sector','Country','Weight %','ITR °C','SBT','NZAMA','Green Capex','2030 Target','2050 Target','Phys Risk','Trans Risk','Engagement'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a, b) => b.temperature - a.temperature).map((h, i) => (
                      <tr key={h.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{h.name}</td>
                        <td style={{ padding: '6px 10px', color: T.muted, fontSize: 10 }}>{h.sector}</td>
                        <td style={{ padding: '6px 10px' }}>{h.country}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{(h.weight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: h.temperature <= 1.8 ? T.green : h.temperature <= 2.5 ? T.amber : T.red, background: `${h.temperature <= 1.8 ? '#dcfce7' : h.temperature <= 2.5 ? '#fef9c3' : '#fee2e2'}40` }}>{h.temperature.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: h.sbtStatus === 'Approved' ? T.green : h.sbtStatus === 'Committed' ? T.amber : T.muted, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{h.sbtStatus}</span>
                        </td>
                        <td style={{ padding: '6px 10px', color: h.nzamaAligned ? T.green : T.red }}>{h.nzamaAligned ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '6px 10px' }}>{h.capexGreenPct.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{h.targetYear2030.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: T.teal }}>{h.targetYear2050.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: h.physicalRisk > 70 ? T.red : T.text }}>{h.physicalRisk.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: h.transitionRisk > 70 ? T.amber : T.text }}>{h.transitionRisk.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: h.engagementOutcome === 'High' ? T.green : h.engagementOutcome === 'Medium' ? T.amber : h.engagementOutcome === 'Low' ? T.orange : T.muted, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{h.engagementOutcome}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Emissions Analytics */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="WACI (S1+2+3)" value={`${computeWACI(filtered, 'all').toFixed(1)}`} sub="tCO₂e/$M" color={T.amber} />
              <KpiCard label="Portfolio Footprint" value={`${(filtered.reduce((s, h) => s + h.weight * (h.scope1 + h.scope2), 0) / 1000).toFixed(1)}K`} sub="tCO₂e (S1+S2)" color={T.red} />
              <KpiCard label="Scope 3 Share" value={`${(filtered.reduce((s, h) => s + h.weight * (h.scope3Upstream + h.scope3Downstream), 0) / (filtered.reduce((a, h) => a + h.weight * (h.scope1 + h.scope2 + h.scope3Upstream + h.scope3Downstream), 0) || 1) * 100).toFixed(1)}%`} sub="of total emissions" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Scope 1/2/3 by Sector (WACI)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorEmissions} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="s1" stackId="a" fill={T.red} name="Scope 1" />
                    <Bar dataKey="s2" stackId="a" fill={T.amber} name="Scope 2" />
                    <Bar dataKey="s3" stackId="a" fill={T.orange} name="Scope 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>WACI by Scope Selection</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={SECTORS_NZ.map(sec => {
                    const sh = filtered.filter(h => h.sector === sec);
                    const tw2 = sh.reduce((s, h) => s + h.weight, 0);
                    if (!tw2) return { sector: sec, waci: 0 };
                    const waci2 = sh.reduce((s, h) => s + (h.weight / tw2) * ((h.scope1 + h.scope2) / (h.revenueUSD || 1)), 0);
                    return { sector: sec.substring(0, 6), waci: +waci2.toFixed(1) };
                  })} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} tCO₂e/$M`, 'WACI']} />
                    <Bar dataKey="waci" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAII Framework */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { indicator: 'P1: Portfolio ITR', value: portfolioITR.toFixed(2) + '°C', target: '≤2.0°C', pass: portfolioITR <= 2 },
                { indicator: 'P2: WACI (S1+2)', value: computeWACI(filtered, '12').toFixed(1), target: '< 200 tCO₂e/$M', pass: computeWACI(filtered, '12') < 200 },
                { indicator: 'P3: SBT Coverage', value: (filtered.filter(h => h.sbtStatus !== 'None').length / (filtered.length || 1) * 100).toFixed(1) + '%', target: '>50%', pass: filtered.filter(h => h.sbtStatus !== 'None').length / (filtered.length || 1) > 0.5 },
                { indicator: 'P4: Green Capex', value: (filtered.length ? (filtered.reduce((s, h) => s + h.capexGreenPct, 0) / filtered.length).toFixed(1) : 0) + '%', target: '>20%', pass: filtered.length > 0 && filtered.reduce((s, h) => s + h.capexGreenPct, 0) / filtered.length > 20 },
                { indicator: 'P5: NZAMA Aligned', value: (filtered.filter(h => h.nzamaAligned).length / (filtered.length || 1) * 100).toFixed(1) + '%', target: '>40%', pass: filtered.filter(h => h.nzamaAligned).length / (filtered.length || 1) > 0.4 },
              ].map(p => (
                <div key={p.indicator} style={{ background: T.card, border: `2px solid ${p.pass ? T.green : T.red}`, borderRadius: 8, padding: '12px 16px', minWidth: 160 }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>{p.indicator}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: p.pass ? T.green : T.red }}>{p.value}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>Target: {p.target}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: p.pass ? T.green : T.red, marginTop: 2 }}>{p.pass ? 'PASS' : 'FAIL'}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>PAII Indicators — Top 30 Holdings</h3>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Name','Sector','Weight %','ITR','SBT','NZAMA','Green Capex','Pledge','Engagement'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paiiIndicators.map((h, i) => (
                      <tr key={h.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{h.name}</td>
                        <td style={{ padding: '6px 10px', color: T.muted, fontSize: 10 }}>{h.sector}</td>
                        <td style={{ padding: '6px 10px' }}>{h.wt}%</td>
                        <td style={{ padding: '6px 10px', color: +h.itr <= 2 ? T.green : T.amber, fontWeight: 600 }}>{h.itr}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: h.sbt === 'Approved' ? T.green : h.sbt === 'Committed' ? T.amber : T.muted, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{h.sbt}</span></td>
                        <td style={{ padding: '6px 10px', color: h.nzama === 'Yes' ? T.green : T.red }}>{h.nzama}</td>
                        <td style={{ padding: '6px 10px' }}>{h.capexGreen}</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{h.pledge}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: h.engagement === 'High' ? T.green : h.engagement === 'Medium' ? T.amber : T.muted, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{h.engagement}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Decarbonization Pathways */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Portfolio Emissions Trajectory 2025–2050 (Index 2025=100)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={DECARBONIZATION_PATHS} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 110]} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v.toFixed(1)}%`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="portfolio" stroke={T.navy} strokeWidth={2.5} name="Portfolio" dot={false} />
                  <Line type="monotone" dataKey="sbt15" stroke={T.green} strokeWidth={2} strokeDasharray="5 5" name="SBT 1.5°C Path" dot={false} />
                  <Line type="monotone" dataKey="gfanz" stroke={T.teal} strokeWidth={2} strokeDasharray="8 3" name="GFANZ NZE" dot={false} />
                  <Line type="monotone" dataKey="budget15" stroke={T.red} strokeWidth={1.5} strokeDasharray="3 3" name="1.5°C Budget" dot={false} />
                  <ReferenceLine x={2030} stroke={T.amber} strokeDasharray="4 4" label={{ value: '2030', fontSize: 10, fill: T.amber }} />
                  <ReferenceLine x={2050} stroke={T.purple} strokeDasharray="4 4" label={{ value: 'Net Zero', fontSize: 10, fill: T.purple }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>2030 Reduction Targets by Sector</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={SECTORS_NZ.map(sec => {
                  const sh = filtered.filter(h => h.sector === sec);
                  const avg30 = sh.length ? sh.reduce((s, h) => s + h.targetYear2030, 0) / sh.length : 0;
                  return { sector: sec.substring(0, 6), target30: +avg30.toFixed(1) };
                })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}%`, '2030 Pledge']} />
                  <ReferenceLine y={-45} stroke={T.green} strokeDasharray="5 5" label={{ value: 'SBT 1.5°C: -45%', fontSize: 10, fill: T.green }} />
                  <Bar dataKey="target30" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 5: Engagement Impact */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Engagement What-If Calculator</h3>
              <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13 }}>
                  Portfolio Engaged: <strong style={{ color: T.indigo, fontSize: 18 }}>{engagementPct}%</strong>
                  <input type="range" min={0} max={100} value={engagementPct} onChange={e => setEngagementPct(+e.target.value)} style={{ display: 'block', width: 200, marginTop: 8 }} />
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ background: T.sub, border: `2px solid ${T.navy}`, borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.muted }}>Current ITR</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: T.amber }}>{portfolioITR.toFixed(2)}°C</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: T.muted }}>→</div>
                  <div style={{ background: T.sub, border: `2px solid ${T.green}`, borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.muted }}>Projected ITR</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: T.green }}>{engagementITRImpact}°C</div>
                  </div>
                  <div style={{ background: T.sub, border: `2px solid ${T.teal}`, borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.muted }}>Improvement</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: T.teal }}>-{(portfolioITR - +engagementITRImpact).toFixed(2)}°C</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Engagement Outcomes Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={engagementMatrix} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="engagement" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} name="Holdings Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ITR Improvement by Engagement Level</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={engagementMatrix} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="engagement" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="avgITR" fill={T.amber} name="Current ITR" />
                    <Bar dataKey="projectedITR" fill={T.green} name="Post-Engagement ITR" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Net Zero Alignment Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Metric','Value','Target','Status','Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Portfolio ITR', `${portfolioITR.toFixed(2)}°C`, '≤2.0°C', portfolioITR <= 2 ? 'PASS' : 'FAIL'],
                    ['WACI (S1+2+3)', `${computeWACI(filtered, 'all').toFixed(1)} tCO₂e/$M`, '<150', computeWACI(filtered, 'all') < 150 ? 'PASS' : 'FAIL'],
                    ['SBT Coverage', `${(filtered.filter(h => h.sbtStatus !== 'None').length / (filtered.length || 1) * 100).toFixed(1)}%`, '>50%', filtered.filter(h => h.sbtStatus !== 'None').length / (filtered.length || 1) > 0.5 ? 'PASS' : 'FAIL'],
                    ['NZAMA Aligned', `${(filtered.filter(h => h.nzamaAligned).length / (filtered.length || 1) * 100).toFixed(1)}%`, '>40%', filtered.filter(h => h.nzamaAligned).length / (filtered.length || 1) > 0.4 ? 'PASS' : 'FAIL'],
                    ['Avg Green Capex', `${filtered.length ? (filtered.reduce((s, h) => s + h.capexGreenPct, 0) / filtered.length).toFixed(1) : 0}%`, '>20%', filtered.length > 0 && filtered.reduce((s, h) => s + h.capexGreenPct, 0) / filtered.length > 20 ? 'PASS' : 'FAIL'],
                    ['Avg 2030 Pledge', `${filtered.length ? (filtered.reduce((s, h) => s + h.targetYear2030, 0) / filtered.length).toFixed(1) : 0}%`, '<-45%', filtered.length > 0 && filtered.reduce((s, h) => s + h.targetYear2030, 0) / filtered.length < -45 ? 'PASS' : 'FAIL'],
                    ['Post-Engagement ITR', `${engagementITRImpact}°C`, '≤1.8°C', +engagementITRImpact <= 1.8 ? 'PASS' : 'FAIL'],
                    ['Active Holdings', filtered.length, '≥30', filtered.length >= 30 ? 'PASS' : 'FAIL'],
                  ].map(([m, v, t, s], i) => (
                    <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{v}</td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{t}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: s === 'PASS' ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{s}</span></td>
                      <td style={{ padding: '8px 12px', color: T.muted, fontSize: 11 }}>PAII/GFANZ framework</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>All Holdings Export ({filtered.length} holdings)</h3>
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Name','Sector','Weight %','ITR','SBT','NZAMA','GreenCapex%','2030 Pledge','2050 Pledge','Phys Risk','Trans Risk'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a, b) => b.weight - a.weight).map((h, i) => (
                      <tr key={h.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{h.name}</td>
                        <td style={{ padding: '5px 10px', color: T.muted, fontSize: 10 }}>{h.sector}</td>
                        <td style={{ padding: '5px 10px' }}>{(h.weight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '5px 10px', color: h.temperature <= 2 ? T.green : T.amber }}>{h.temperature.toFixed(2)}</td>
                        <td style={{ padding: '5px 10px' }}>{h.sbtStatus}</td>
                        <td style={{ padding: '5px 10px', color: h.nzamaAligned ? T.green : T.red }}>{h.nzamaAligned ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '5px 10px' }}>{h.capexGreenPct.toFixed(1)}</td>
                        <td style={{ padding: '5px 10px', color: T.green }}>{h.targetYear2030.toFixed(1)}%</td>
                        <td style={{ padding: '5px 10px', color: T.teal }}>{h.targetYear2050.toFixed(1)}%</td>
                        <td style={{ padding: '5px 10px' }}>{h.physicalRisk.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px' }}>{h.transitionRisk.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Sector-level NZ alignment */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector-Level Alignment Metrics</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Sector','# Holdings','Total Weight %','Avg ITR','SBT % (≠None)','Avg Green Capex','Avg 2030 Pledge','Avg Phys Risk','Avg Trans Risk','NZAMA %'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS_NZ.map((sec, i) => {
                    const sh = filtered.filter(h => h.sector === sec);
                    if (!sh.length) return null;
                    const tw2 = sh.reduce((s, h) => s + h.weight, 0);
                    const avgITR2 = sh.reduce((s, h) => s + h.temperature, 0) / sh.length;
                    const sbtCov = sh.filter(h => h.sbtStatus !== 'None').length / sh.length * 100;
                    const avgGC = sh.reduce((s, h) => s + h.capexGreenPct, 0) / sh.length;
                    const avg30 = sh.reduce((s, h) => s + h.targetYear2030, 0) / sh.length;
                    const avgPhys = sh.reduce((s, h) => s + h.physicalRisk, 0) / sh.length;
                    const avgTrans = sh.reduce((s, h) => s + h.transitionRisk, 0) / sh.length;
                    const nzamaPct = sh.filter(h => h.nzamaAligned).length / sh.length * 100;
                    return (
                      <tr key={sec} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec}</td>
                        <td style={{ padding: '6px 10px' }}>{sh.length}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{(tw2 * 100).toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: avgITR2 <= 2 ? T.green : T.amber, fontWeight: 600 }}>{avgITR2.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}>{sbtCov.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px' }}>{avgGC.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{avg30.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: avgPhys > 70 ? T.red : T.text }}>{avgPhys.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: avgTrans > 70 ? T.amber : T.text }}>{avgTrans.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: nzamaPct >= 50 ? T.green : T.muted }}>{nzamaPct.toFixed(1)}%</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
            {/* Country breakdown */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Country-Level NZ Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={COUNTRIES_NZ.map(cty => {
                  const ch = filtered.filter(h => h.country === cty);
                  const avgITR3 = ch.length ? ch.reduce((s, h) => s + h.temperature, 0) / ch.length : 0;
                  return { country: cty, count: ch.length, avgITR: +avgITR3.toFixed(2) };
                }).filter(x => x.count > 0)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="count" fill={T.indigo} name="Holdings" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgITR" stroke={T.amber} strokeWidth={2} name="Avg ITR" dot={{ fill: T.amber, r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Capex alignment scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Green vs Fossil Capex Allocation</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Green Capex %" tick={{ fontSize: 10 }} label={{ value: 'Green Capex %', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Fossil Capex %" tick={{ fontSize: 10 }} label={{ value: 'Fossil Capex %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [`${v.toFixed(1)}%`, n]} />
                  <Scatter data={filtered.slice(0, 60).map(h => ({ x: +h.capexGreenPct.toFixed(1), y: +h.capexFossilPct.toFixed(1) }))} fill={T.teal} opacity={0.6} name="Holdings" />
                  <ReferenceLine x={30} stroke={T.green} strokeDasharray="5 5" label={{ value: 'GFANZ Min', fontSize: 9, fill: T.green }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Engagement outcome by sector */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Engagement Outcome by Sector</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SECTORS_NZ.map(sec => {
                  const sh = filtered.filter(h => h.sector === sec);
                  return {
                    sector: sec.substring(0, 6),
                    High: sh.filter(h => h.engagementOutcome === 'High').length,
                    Medium: sh.filter(h => h.engagementOutcome === 'Medium').length,
                    Low: sh.filter(h => h.engagementOutcome === 'Low').length,
                    None: sh.filter(h => h.engagementOutcome === 'None').length,
                  };
                })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="High" stackId="a" fill={T.green} name="High" />
                  <Bar dataKey="Medium" stackId="a" fill={T.amber} name="Medium" />
                  <Bar dataKey="Low" stackId="a" fill={T.orange} name="Low" />
                  <Bar dataKey="None" stackId="a" fill={T.muted} name="None" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* ITR vs Phys Risk scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ITR vs Physical Risk — Double Exposure Analysis</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Physical Risk" tick={{ fontSize: 10 }} label={{ value: 'Physical Risk Score', position: 'insideBottom', offset: -5, fontSize: 10 }} domain={[0, 100]} />
                  <YAxis dataKey="y" name="ITR °C" tick={{ fontSize: 10 }} label={{ value: 'ITR °C', angle: -90, position: 'insideLeft', fontSize: 10 }} domain={[1.5, 4.5]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v.toFixed(2), n]} />
                  <ReferenceLine y={2} stroke={T.green} strokeDasharray="5 5" label={{ value: '2°C', fontSize: 9, fill: T.green }} />
                  <ReferenceLine x={70} stroke={T.red} strokeDasharray="5 5" label={{ value: 'High Phys', fontSize: 9, fill: T.red }} />
                  <Scatter data={filtered.slice(0, 60).map(h => ({ x: +h.physicalRisk.toFixed(0), y: +h.temperature.toFixed(2) }))} fill={T.purple} opacity={0.6} name="Holdings" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Always-visible bottom panel */}
        {activeTab !== 6 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Portfolio Alignment Summary</div>
              {[
                ['Portfolio ITR', `${portfolioITR.toFixed(2)}°C`, portfolioITR <= 2],
                ['WACI (S1+2+3)', `${computeWACI(filtered,'all').toFixed(1)} tCO₂e/$M`, computeWACI(filtered,'all') < 150],
                ['SBT Approved', `${(filtered.filter(h => h.sbtStatus === 'Approved').length / (filtered.length || 1) * 100).toFixed(1)}%`, true],
                ['NZAMA Aligned', `${(filtered.filter(h => h.nzamaAligned).length / (filtered.length || 1) * 100).toFixed(1)}%`, true],
                ['Green Capex', `${filtered.length ? (filtered.reduce((s, h) => s + h.capexGreenPct, 0) / filtered.length).toFixed(1) : 0}%`, true],
                ['Post-Eng ITR', `${engagementITRImpact}°C (${engagementPct}% eng.)`, +engagementITRImpact <= 2],
                ['Active Holdings', `${filtered.length}/120`, filtered.length >= 30],
              ].map(([label, val, ok]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{label}</span>
                  <span style={{ fontWeight: 600, color: ok ? T.text : T.red }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Active Filters</div>
              {[
                ['Sector', sectorFilter],
                ['SBT Status', sbtFilter],
                ['ITR Range', `${itrMin.toFixed(1)}–${itrMax.toFixed(1)}°C`],
                ['Min Weight', `${weightThreshold.toFixed(2)}%`],
                ['Scope', scopeSelect],
                ['Engagement', engagementFilter],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>SBT Distribution (Filtered)</div>
              {SBT_STATUS.map(sbt => {
                const count = filtered.filter(h => h.sbtStatus === sbt).length;
                const pct = filtered.length > 0 ? (count / filtered.length * 100).toFixed(1) : '0.0';
                return (
                  <div key={sbt} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: sbt === 'Approved' ? T.green : sbt === 'Committed' ? T.amber : T.muted }}>{sbt}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
                      <div style={{ background: sbt === 'Approved' ? T.green : sbt === 'Committed' ? T.amber : T.muted, borderRadius: 4, height: 6, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Decarbonization trajectory quick table */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Projected Emissions Trajectory — Key Milestones</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Year','Portfolio Index','SBT 1.5°C Path','GFANZ NZE','1.5°C Budget','Portfolio vs Budget','Status'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 5, 10, 15, 20, 25].map(offset => {
                  const pt = DECARBONIZATION_PATHS[offset];
                  const diff = pt.portfolio - pt.budget15;
                  return (
                    <tr key={pt.year} style={{ background: offset % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 12px', fontWeight: 700 }}>{pt.year}</td>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{pt.portfolio.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px', color: T.green }}>{pt.sbt15.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px', color: T.teal }}>{pt.gfanz.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px', color: T.red }}>{pt.budget15.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px', color: diff <= 0 ? T.green : T.red, fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ background: diff <= 0 ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{diff <= 0 ? 'On Track' : 'Lagging'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* WACI trajectory */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>WACI & Emissions Metrics — Scope Breakdown Table</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Scope','WACI (tCO₂e/$M)','Portfolio Footprint','% of Total','vs PAII Target','Status','Improvement Needed'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { scope: 'Scope 1', key: '1', target: 50 },
                  { scope: 'Scope 2', key: '2', target: 30 },
                  { scope: 'Scope 3 (Up)', key: '3u', target: 100 },
                  { scope: 'Scope 3 (Down)', key: '3d', target: 80 },
                  { scope: 'Total S1+2', key: '12', target: 80 },
                  { scope: 'Total S1+2+3', key: 'all', target: 150 },
                ].map((row, i) => {
                  let waciVal = 0;
                  if (row.key === '1') waciVal = computeWACI(filtered, '1');
                  else if (row.key === '2') waciVal = computeWACI(filtered, '2');
                  else if (row.key === '3u') waciVal = filtered.length ? filtered.reduce((s, h) => s + h.weight * (h.revenueUSD > 0 ? h.scope3Upstream / h.revenueUSD : 0), 0) : 0;
                  else if (row.key === '3d') waciVal = filtered.length ? filtered.reduce((s, h) => s + h.weight * (h.revenueUSD > 0 ? h.scope3Downstream / h.revenueUSD : 0), 0) : 0;
                  else if (row.key === '12') waciVal = computeWACI(filtered, '12');
                  else waciVal = computeWACI(filtered, 'all');
                  const footprint = waciVal * 1000;
                  const total = computeWACI(filtered, 'all') * 1000 || 1;
                  const pct = (footprint / total * 100).toFixed(1);
                  const ok = waciVal <= row.target;
                  const improvement = ok ? '–' : `${(waciVal - row.target).toFixed(1)} to reduce`;
                  return (
                    <tr key={row.scope} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.scope}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: ok ? T.green : T.amber }}>{waciVal.toFixed(1)}</td>
                      <td style={{ padding: '6px 10px' }}>{footprint.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px' }}>{pct}%</td>
                      <td style={{ padding: '6px 10px', color: T.muted }}>≤{row.target}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: ok ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{ok ? 'PASS' : 'FAIL'}</span></td>
                      <td style={{ padding: '6px 10px', color: ok ? T.muted : T.red }}>{improvement}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Physical vs transition risk by sector */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Physical vs Transition Risk by Sector — Double Materiality</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={SECTORS_NZ.map(sec => {
                const sh = filtered.filter(h => h.sector === sec);
                const n = sh.length || 1;
                return {
                  sector: sec.substring(0, 6),
                  physRisk: +(sh.reduce((s, h) => s + h.physicalRisk, 0) / n).toFixed(1),
                  transRisk: +(sh.reduce((s, h) => s + h.transitionRisk, 0) / n).toFixed(1),
                  count: sh.length,
                };
              })} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="physRisk" fill={T.red} name="Avg Phys Risk" opacity={0.7} />
                <Bar yAxisId="left" dataKey="transRisk" fill={T.amber} name="Avg Trans Risk" opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke={T.navy} strokeWidth={2} name="Holdings Count" dot={{ fill: T.navy, r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Engagement Programme — Outcome Tracker & Projected ITR Impact</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Holding', 'Sector', 'Current ITR', 'Engagement Stage', 'Commit Strength', 'Projected ITR', 'Delta', 'Portfolio Contrib'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.text, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 15).map((h, i) => {
                  const stages = ['Pre-engagement', 'Initial Contact', 'Dialogue', 'Commitment', 'Monitoring', 'Verified'];
                  const stage = stages[Math.floor(sr(i * 11 + 77) * stages.length)];
                  const commitStr = stage === 'Verified' ? 'High' : stage === 'Commitment' ? 'Medium' : stage === 'Monitoring' ? 'Medium' : 'Low';
                  const reduction = stage === 'Verified' ? 0.3 : stage === 'Commitment' ? 0.2 : stage === 'Dialogue' ? 0.1 : 0;
                  const projITR = Math.max(1.5, h.itr - reduction);
                  const delta = projITR - h.itr;
                  const portContrib = h.weight * delta;
                  return (
                    <tr key={h.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{h.name}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10, color: T.muted }}>{h.sector}</td>
                      <td style={{ padding: '6px 10px', color: h.itr > 2.5 ? T.red : h.itr > 1.8 ? T.amber : T.green, fontWeight: 600 }}>{h.itr.toFixed(2)}°C</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: stage === 'Verified' ? T.green : stage === 'Commitment' ? T.teal : stage === 'Dialogue' ? T.blue : T.muted, color: '#fff', padding: '2px 7px', borderRadius: 10, fontSize: 10 }}>{stage}</span></td>
                      <td style={{ padding: '6px 10px' }}><span style={{ color: commitStr === 'High' ? T.green : commitStr === 'Medium' ? T.amber : T.muted, fontWeight: 600 }}>{commitStr}</span></td>
                      <td style={{ padding: '6px 10px', color: T.teal, fontWeight: 600 }}>{projITR.toFixed(2)}°C</td>
                      <td style={{ padding: '6px 10px', color: delta < 0 ? T.green : T.muted }}>{delta.toFixed(2)}°C</td>
                      <td style={{ padding: '6px 10px', color: portContrib < 0 ? T.green : T.muted }}>{portContrib.toFixed(4)}°C</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
