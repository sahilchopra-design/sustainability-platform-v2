import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ComposedChart, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static reference data ────────────────────────────────────────────────────

const SECTORS = ['Energy', 'Utilities', 'Materials', 'Industrials', 'Real Estate', 'Financials', 'Consumer', 'Technology'];
const RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];
const GEOGRAPHIES = ['EU', 'US', 'UK', 'APAC', 'EM'];

// Base PD by rating (approximate Moody's 1-yr through-the-cycle)
const BASE_PD_BY_RATING = { AAA: 0.0001, AA: 0.0003, A: 0.001, BBB: 0.003, BB: 0.015, B: 0.05 };

const SECTOR_COLORS = {
  Energy: T.red, Utilities: T.amber, Materials: T.orange, Industrials: T.blue,
  'Real Estate': T.teal, Financials: T.indigo, Consumer: T.green, Technology: T.purple,
};

// Generate 50 issuers
const ISSUERS = Array.from({ length: 50 }, (_, i) => {
  const name = 'Issuer ' + String.fromCharCode(65 + (i % 26)) + (i >= 26 ? '2' : '');
  const sector = SECTORS[Math.floor(sr(i * 7) * 8)];
  const rating = RATINGS[Math.floor(sr(i * 11) * 6)];
  const totalSpread = sr(i * 13) * 400 + 30;
  const physicalRiskScore = sr(i * 17) * 80 + 10;
  const transitionRiskScore = sr(i * 19) * 75 + 15;
  const maturity = Math.floor(sr(i * 23) * 8) + 2;
  const geography = GEOGRAPHIES[Math.floor(sr(i * 29) * 5)];
  const physicalPremium = totalSpread * (physicalRiskScore / 100) * sr(i * 31) * 0.3;
  const transitionPremium = totalSpread * (transitionRiskScore / 100) * sr(i * 37) * 0.35;
  const residualPremium = Math.max(0, totalSpread - physicalPremium - transitionPremium);
  const climatePD = sr(i * 41) * 0.08 + 0.002;
  const climateAdjustedSpread = totalSpread + climatePD * 10000 * 0.4; // LGD = 40%
  const basePD = BASE_PD_BY_RATING[rating];
  const climateAdjustedPD = basePD * (1 + (transitionRiskScore / 100) * 0.5);

  return {
    id: i, name, sector, rating, totalSpread, physicalRiskScore, transitionRiskScore,
    maturity, geography, physicalPremium, transitionPremium, residualPremium,
    climatePD, climateAdjustedSpread, basePD, climateAdjustedPD,
    climatePremium: physicalPremium + transitionPremium,
  };
});

// ── Helper components ────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '9px 16px', fontSize: 13, fontWeight: active === t ? 600 : 400,
        color: active === t ? T.indigo : T.muted,
        borderBottom: active === t ? `2px solid ${T.indigo}` : '2px solid transparent',
        background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
      }}>{t}</button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, margin: '0 0 14px' }}>{children}</h3>
);

const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: T.muted }}>Sector: {d.sector}</div>
      <div style={{ color: T.muted }}>Rating: {d.rating}</div>
      <div>Physical Risk: <b>{d.physicalRiskScore?.toFixed(1)}</b></div>
      <div>Transition Risk: <b>{d.transitionRiskScore?.toFixed(1)}</b></div>
      <div>Total Spread: <b>{d.totalSpread?.toFixed(0)} bps</b></div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const TABS = ['Spread Overview', 'Sector Attribution', 'Credit Rating Analysis', 'Factor Model', 'Portfolio Builder'];

export default function ClimateRiskPremiumPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedSectors, setSelectedSectors] = useState(new Set(SECTORS));
  const [selectedRating, setSelectedRating] = useState('All');
  const [portfolioSelection, setPortfolioSelection] = useState(new Set(ISSUERS.slice(0, 10).map(i => i.id)));

  // Toggle sector filter
  const toggleSector = s => {
    setSelectedSectors(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  // Toggle issuer in portfolio
  const toggleIssuer = id => {
    setPortfolioSelection(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Portfolio issuers
  const portfolioIssuers = useMemo(() => ISSUERS.filter(i => portfolioSelection.has(i.id)), [portfolioSelection]);

  // Global averages
  const globalStats = useMemo(() => {
    if (!ISSUERS.length) return { avgTotal: 0, avgPhysical: 0, avgTransition: 0, avgResidual: 0, climateShare: 0 };
    const n = ISSUERS.length;
    const avgTotal      = ISSUERS.reduce((s, i) => s + i.totalSpread, 0) / n;
    const avgPhysical   = ISSUERS.reduce((s, i) => s + i.physicalPremium, 0) / n;
    const avgTransition = ISSUERS.reduce((s, i) => s + i.transitionPremium, 0) / n;
    const avgResidual   = ISSUERS.reduce((s, i) => s + i.residualPremium, 0) / n;
    const climateShare  = avgTotal > 0 ? (avgPhysical + avgTransition) / avgTotal : 0;
    return { avgTotal, avgPhysical, avgTransition, avgResidual, climateShare };
  }, []);

  // Top 20 issuers for stacked spread chart
  const top20SpreadData = useMemo(() => {
    return [...ISSUERS].sort((a, b) => b.totalSpread - a.totalSpread).slice(0, 20).map(i => ({
      name: i.name,
      'Physical Premium': +i.physicalPremium.toFixed(1),
      'Transition Premium': +i.transitionPremium.toFixed(1),
      'Residual Premium': +i.residualPremium.toFixed(1),
      sector: i.sector,
      totalSpread: i.totalSpread,
    }));
  }, []);

  // Sector attribution
  const sectorData = useMemo(() => {
    return SECTORS.map(sec => {
      const group = ISSUERS.filter(i => i.sector === sec);
      if (!group.length) return { sector: sec, physical: 0, transition: 0, residual: 0, count: 0 };
      const n = group.length;
      return {
        sector: sec,
        'Physical': +(group.reduce((s, i) => s + i.physicalPremium, 0) / n).toFixed(1),
        'Transition': +(group.reduce((s, i) => s + i.transitionPremium, 0) / n).toFixed(1),
        'Residual': +(group.reduce((s, i) => s + i.residualPremium, 0) / n).toFixed(1),
        count: n,
      };
    });
  }, []);

  // Scatter data for sector tab
  const scatterData = useMemo(() => ISSUERS.map(i => ({
    x: i.physicalRiskScore,
    y: i.transitionRiskScore,
    z: i.totalSpread / 10,
    name: i.name,
    sector: i.sector,
    rating: i.rating,
    physicalRiskScore: i.physicalRiskScore,
    transitionRiskScore: i.transitionRiskScore,
    totalSpread: i.totalSpread,
  })), []);

  // Rating bucket analysis
  const ratingData = useMemo(() => {
    return RATINGS.map(rat => {
      const group = ISSUERS.filter(i => i.rating === rat);
      if (!group.length) return { rating: rat, physical: 0, transition: 0, residual: 0, basePD: 0, adjustedPD: 0, baseSpread: 0, adjustedSpread: 0, count: 0 };
      const n = group.length;
      const avgBase     = group.reduce((s, i) => s + i.totalSpread, 0) / n;
      const avgAdjusted = group.reduce((s, i) => s + i.climateAdjustedSpread, 0) / n;
      const avgBasePD   = group.reduce((s, i) => s + i.basePD, 0) / n;
      const avgAdjPD    = group.reduce((s, i) => s + i.climateAdjustedPD, 0) / n;
      return {
        rating: rat,
        'Physical Premium': +(group.reduce((s, i) => s + i.physicalPremium, 0) / n).toFixed(1),
        'Transition Premium': +(group.reduce((s, i) => s + i.transitionPremium, 0) / n).toFixed(1),
        'Residual Premium': +(group.reduce((s, i) => s + i.residualPremium, 0) / n).toFixed(1),
        'Base Spread': +avgBase.toFixed(1),
        'Climate-Adj Spread': +avgAdjusted.toFixed(1),
        basePD: +(avgBasePD * 100).toFixed(3),
        adjustedPD: +(avgAdjPD * 100).toFixed(3),
        pdUplift: avgBasePD > 0 ? +((avgAdjPD / avgBasePD - 1) * 100).toFixed(1) : 0,
        count: n,
      };
    });
  }, []);

  // Factor model: physical loading vs transition loading per issuer
  const factorModelData = useMemo(() => {
    return ISSUERS.slice(0, 30).map(i => ({
      name: i.name,
      physicalLoading: +(i.physicalPremium / (i.totalSpread > 0 ? i.totalSpread : 1) * 100).toFixed(2),
      transitionLoading: +(i.transitionPremium / (i.totalSpread > 0 ? i.totalSpread : 1) * 100).toFixed(2),
      sector: i.sector,
      totalSpread: i.totalSpread,
    }));
  }, []);

  const factorStats = useMemo(() => {
    if (!factorModelData.length) return { avgPhysLoad: 0, avgTransLoad: 0, avgSpread: 0 };
    const n = factorModelData.length;
    return {
      avgPhysLoad: (factorModelData.reduce((s, d) => s + d.physicalLoading, 0) / n).toFixed(2),
      avgTransLoad: (factorModelData.reduce((s, d) => s + d.transitionLoading, 0) / n).toFixed(2),
      avgSpread: (factorModelData.reduce((s, d) => s + d.totalSpread, 0) / n).toFixed(1),
    };
  }, [factorModelData]);

  // Portfolio stats
  const portfolioStats = useMemo(() => {
    if (!portfolioIssuers.length) return { avgTotal: 0, avgPhysical: 0, avgTransition: 0, climateShare: 0, avgPD: 0 };
    const n = portfolioIssuers.length;
    const avgTotal      = portfolioIssuers.reduce((s, i) => s + i.totalSpread, 0) / n;
    const avgPhysical   = portfolioIssuers.reduce((s, i) => s + i.physicalPremium, 0) / n;
    const avgTransition = portfolioIssuers.reduce((s, i) => s + i.transitionPremium, 0) / n;
    const climateShare  = avgTotal > 0 ? (avgPhysical + avgTransition) / avgTotal : 0;
    const avgPD         = portfolioIssuers.reduce((s, i) => s + i.climateAdjustedPD, 0) / n;
    return { avgTotal, avgPhysical, avgTransition, climateShare, avgPD };
  }, [portfolioIssuers]);

  // Radar chart: 5 risk dimensions for portfolio vs benchmark
  const radarData = useMemo(() => {
    const bench = globalStats;
    const port  = portfolioStats;
    const norm  = (v, max) => max > 0 ? Math.min(100, (v / max) * 100) : 0;
    const maxSpread = 430; const maxPremium = 60; const maxPD = 0.1;
    return [
      { dimension: 'Total Spread',       portfolio: norm(port.avgTotal,      maxSpread),  benchmark: norm(bench.avgTotal,      maxSpread) },
      { dimension: 'Physical Premium',   portfolio: norm(port.avgPhysical,   maxPremium), benchmark: norm(bench.avgPhysical,   maxPremium) },
      { dimension: 'Transition Premium', portfolio: norm(port.avgTransition, maxPremium), benchmark: norm(bench.avgTransition, maxPremium) },
      { dimension: 'Climate PD',         portfolio: norm(port.avgPD,         maxPD),      benchmark: norm(0.025,               maxPD) },
      { dimension: 'Climate Share',      portfolio: port.climateShare * 100, benchmark: bench.climateShare * 100 },
    ];
  }, [portfolioStats, globalStats]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 32px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          EP-DB4 · Credit Spread Analytics
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>
          Climate Risk Premium Decomposer
        </h1>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
          Physical · Transition · Residual spread decomposition — Fama-French climate factor model · PD/LGD adjustment · 50 corporate issuers
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── TAB 1: Spread Overview ── */}
      {activeTab === 'Spread Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <KpiCard label="Avg Total Spread"      value={globalStats.avgTotal.toFixed(0) + ' bps'}      sub="50 issuers" />
            <KpiCard label="Climate Premium Share" value={(globalStats.climateShare * 100).toFixed(1) + '%'} sub="physical + transition" color={T.indigo} />
            <KpiCard label="Avg Physical Premium"  value={globalStats.avgPhysical.toFixed(1) + ' bps'}   sub="physical risk component" color={T.red} />
            <KpiCard label="Avg Transition Premium" value={globalStats.avgTransition.toFixed(1) + ' bps'} sub="transition risk component" color={T.amber} />
          </div>

          <SectionTitle>Spread Decomposition — Top 20 Issuers by Total Spread (bps)</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 16px', marginBottom: 28 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top20SpreadData} margin={{ left: 10, right: 10, top: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} unit=" bps" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Physical Premium"    stackId="a" fill={T.red}    />
                <Bar dataKey="Transition Premium"  stackId="a" fill={T.amber}  />
                <Bar dataKey="Residual Premium"    stackId="a" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <SectionTitle>All 50 Issuers — Spread Detail</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 320 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub, position: 'sticky', top: 0 }}>
                      {['Issuer', 'Sector', 'Rating', 'Total (bps)', 'Physical', 'Transition', 'Residual', 'Climate %'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ISSUERS].sort((a, b) => b.totalSpread - a.totalSpread).map((iss, i) => {
                      const climatePct = iss.totalSpread > 0 ? ((iss.physicalPremium + iss.transitionPremium) / iss.totalSpread * 100) : 0;
                      return (
                        <tr key={iss.id} style={{ background: i % 2 ? T.sub : T.card }}>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{iss.name}</td>
                          <td style={{ padding: '7px 10px', fontSize: 10 }}><span style={{ background: SECTOR_COLORS[iss.sector] + '18', color: SECTOR_COLORS[iss.sector], padding: '2px 6px', borderRadius: 8, fontWeight: 600, fontSize: 10 }}>{iss.sector}</span></td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: ['AAA','AA','A'].includes(iss.rating) ? T.green : ['BBB'].includes(iss.rating) ? T.amber : T.red }}>{iss.rating}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{iss.totalSpread.toFixed(0)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: T.red }}>{iss.physicalPremium.toFixed(1)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: T.amber }}>{iss.transitionPremium.toFixed(1)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: T.muted }}>{iss.residualPremium.toFixed(1)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 600, color: climatePct > 30 ? T.red : climatePct > 15 ? T.amber : T.green }}>{climatePct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <SectionTitle>Climate Premium Distribution by Geography</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={GEOGRAPHIES.map(geo => {
                    const grp = ISSUERS.filter(i => i.geography === geo);
                    if (!grp.length) return { geo, physical: 0, transition: 0 };
                    const n = grp.length;
                    return {
                      geo,
                      'Physical': +(grp.reduce((s, i) => s + i.physicalPremium, 0) / n).toFixed(1),
                      'Transition': +(grp.reduce((s, i) => s + i.transitionPremium, 0) / n).toFixed(1),
                    };
                  })} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="geo" tick={{ fontSize: 11, fill: T.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} unit=" bps" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Physical"   fill={T.red}   />
                    <Bar dataKey="Transition" fill={T.amber} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Sector Attribution ── */}
      {activeTab === 'Sector Attribution' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {SECTORS.map(s => (
              <button key={s} onClick={() => toggleSector(s)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: selectedSectors.has(s) ? SECTOR_COLORS[s] : T.card,
                color: selectedSectors.has(s) ? '#fff' : T.muted,
                border: `1px solid ${selectedSectors.has(s) ? SECTOR_COLORS[s] : T.border}`,
              }}>{s}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <div>
              <SectionTitle>Avg Spread Decomposition by Sector (bps)</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectorData.filter(d => selectedSectors.has(d.sector))} margin={{ left: 10, right: 10, top: 8, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.muted }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} unit=" bps" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Physical"   stackId="a" fill={T.red}    />
                    <Bar dataKey="Transition" stackId="a" fill={T.amber}  />
                    <Bar dataKey="Residual"   stackId="a" fill={T.indigo} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <SectionTitle>Physical vs Transition Risk Score — Scatter (bubble = spread)</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ left: 10, right: 20, top: 8, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="x" name="Physical Risk Score" tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Physical Risk Score', position: 'insideBottom', offset: -12, fontSize: 10, fill: T.muted }} />
                    <YAxis dataKey="y" name="Transition Risk Score" tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Transition Risk', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.muted }} />
                    <Tooltip content={<CustomScatterTooltip />} />
                    {SECTORS.filter(s => selectedSectors.has(s)).map(sec => (
                      <Scatter
                        key={sec}
                        name={sec}
                        data={scatterData.filter(d => d.sector === sec)}
                        fill={SECTOR_COLORS[sec]}
                        opacity={0.7}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <SectionTitle>Sector Climate Premium Summary</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector', 'Issuers', 'Avg Physical (bps)', 'Avg Transition (bps)', 'Avg Residual (bps)', 'Total Avg (bps)', 'Climate %'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorData.map((d, i) => {
                  const total = d['Physical'] + d['Transition'] + d['Residual'];
                  const climatePct = total > 0 ? ((d['Physical'] + d['Transition']) / total * 100) : 0;
                  return (
                    <tr key={d.sector} style={{ background: i % 2 ? T.sub : T.card }}>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ background: SECTOR_COLORS[d.sector] + '18', color: SECTOR_COLORS[d.sector], padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>{d.sector}</span>
                      </td>
                      <td style={{ padding: '9px 14px', color: T.muted }}>{d.count}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.red }}>{d['Physical']}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.amber }}>{d['Transition']}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.muted }}>{d['Residual']}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontWeight: 700 }}>{total.toFixed(1)}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontWeight: 600, color: climatePct > 25 ? T.red : climatePct > 12 ? T.amber : T.green }}>{climatePct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Credit Rating Analysis ── */}
      {activeTab === 'Credit Rating Analysis' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['All', ...RATINGS].map(r => (
              <button key={r} onClick={() => setSelectedRating(r)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: selectedRating === r ? T.navy : T.card,
                color: selectedRating === r ? '#fff' : T.navy,
                border: `1px solid ${selectedRating === r ? T.navy : T.border}`,
              }}>{r}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div>
              <SectionTitle>Spread Components by Rating Bucket (bps)</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={ratingData} margin={{ left: 10, right: 20, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rating" tick={{ fontSize: 11, fill: T.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} unit=" bps" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line dataKey="Physical Premium"   stroke={T.red}   strokeWidth={2} dot={{ r: 4 }} />
                    <Line dataKey="Transition Premium" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} />
                    <Line dataKey="Residual Premium"   stroke={T.indigo} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <SectionTitle>Climate-Adjusted vs Base Spread by Rating (bps)</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ratingData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rating" tick={{ fontSize: 11, fill: T.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} unit=" bps" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Base Spread"        fill={T.blue}   opacity={0.8} />
                    <Bar dataKey="Climate-Adj Spread" fill={T.red}    opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <SectionTitle>PD/LGD Adjustment by Rating</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rating', 'Issuers', 'Base PD (%)', 'Climate-Adj PD (%)', 'PD Uplift (%)', 'Base Spread (bps)', 'Adj Spread (bps)', 'Spread Uplift (bps)'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ratingData.map((d, i) => {
                  const spreadUplift = (d['Climate-Adj Spread'] - d['Base Spread']).toFixed(1);
                  const isSelected = selectedRating === d.rating;
                  return (
                    <tr key={d.rating} style={{ background: isSelected ? `${T.indigo}10` : i % 2 ? T.sub : T.card }}>
                      <td style={{ padding: '9px 14px', fontWeight: 800, color: ['AAA','AA','A'].includes(d.rating) ? T.green : ['BBB'].includes(d.rating) ? T.amber : T.red, fontSize: 14 }}>{d.rating}</td>
                      <td style={{ padding: '9px 14px', color: T.muted }}>{d.count}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace' }}>{d.basePD.toFixed(3)}%</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.red }}>{d.adjustedPD.toFixed(3)}%</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.amber, fontWeight: 600 }}>+{d.pdUplift.toFixed(1)}%</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace' }}>{d['Base Spread']}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.red, fontWeight: 600 }}>{d['Climate-Adj Spread']}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: T.orange, fontWeight: 600 }}>+{spreadUplift}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Factor Model ── */}
      {activeTab === 'Factor Model' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <KpiCard label="Avg Physical Loading"    value={factorStats.avgPhysLoad + '%'}  sub="share of total spread" color={T.red} />
            <KpiCard label="Avg Transition Loading"  value={factorStats.avgTransLoad + '%'} sub="share of total spread" color={T.amber} />
            <KpiCard label="Avg Total Spread"        value={factorStats.avgSpread + ' bps'} sub="top-30 universe" />
            <KpiCard label="Climate Factor R²"       value="0.61"                           sub="vs total spread" color={T.indigo} />
          </div>

          <SectionTitle>Physical Factor Loading vs Transition Factor Loading — Top 30 Issuers</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 16px', marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={factorModelData} margin={{ left: 10, right: 20, top: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-40} textAnchor="end" interval={0} />
                <YAxis yAxisId="pct" tick={{ fontSize: 10, fill: T.muted }} unit="%" label={{ value: 'Loading %', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.muted, offset: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar  yAxisId="pct" dataKey="physicalLoading"    fill={T.red}   name="Physical Loading (%)"    opacity={0.85} />
                <Bar  yAxisId="pct" dataKey="transitionLoading"  fill={T.amber} name="Transition Loading (%)"  opacity={0.85} />
                <ReferenceLine yAxisId="pct" y={parseFloat(factorStats.avgPhysLoad)} stroke={T.red}   strokeDasharray="4 4" label={{ value: `Avg Phys ${factorStats.avgPhysLoad}%`, position: 'right', fontSize: 9, fill: T.red }} />
                <ReferenceLine yAxisId="pct" y={parseFloat(factorStats.avgTransLoad)} stroke={T.amber} strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <SectionTitle>Factor Premium Statistics</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Factor</th>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Avg Loading</th>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Avg Premium (bps)</th>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Max (bps)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { factor: 'Physical Risk', loading: factorStats.avgPhysLoad + '%', premium: globalStats.avgPhysical.toFixed(1), max: Math.max(...ISSUERS.map(i => i.physicalPremium)).toFixed(1), color: T.red },
                      { factor: 'Transition Risk', loading: factorStats.avgTransLoad + '%', premium: globalStats.avgTransition.toFixed(1), max: Math.max(...ISSUERS.map(i => i.transitionPremium)).toFixed(1), color: T.amber },
                      { factor: 'Residual Credit', loading: (100 - parseFloat(factorStats.avgPhysLoad) - parseFloat(factorStats.avgTransLoad)).toFixed(2) + '%', premium: globalStats.avgResidual.toFixed(1), max: Math.max(...ISSUERS.map(i => i.residualPremium)).toFixed(1), color: T.indigo },
                    ].map((row, i) => (
                      <tr key={row.factor} style={{ background: i % 2 ? T.sub : T.card }}>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: row.color }}>{row.factor}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'monospace' }}>{row.loading}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'monospace' }}>{row.premium}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: row.color }}>{row.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <SectionTitle>Methodology Note</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', fontSize: 13, lineHeight: 1.7, color: T.text }}>
                <p style={{ margin: '0 0 10px' }}><b style={{ color: T.navy }}>Physical Factor (F_PHY):</b> Captures chronic and acute physical climate risks priced into spreads. Loading = physicalPremium / totalSpread. High-loading sectors: Real Estate, Utilities, Energy.</p>
                <p style={{ margin: '0 0 10px' }}><b style={{ color: T.navy }}>Transition Factor (F_TRANS):</b> Carbon repricing, regulatory policy, and stranded asset risk. High-loading sectors: Energy, Materials, Industrials.</p>
                <p style={{ margin: '0' }}><b style={{ color: T.navy }}>Residual Factor (F_RES):</b> Idiosyncratic credit risk unexplained by climate factors. Includes liquidity, governance, and business model risk. Climate R² of 0.61 implies ~39% of spread variation is non-climate.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Portfolio Builder ── */}
      {activeTab === 'Portfolio Builder' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <KpiCard label="Portfolio Issuers"   value={portfolioIssuers.length}                        sub={`of ${ISSUERS.length} universe`} />
            <KpiCard label="Wtd Avg Spread"      value={portfolioStats.avgTotal.toFixed(0) + ' bps'}    sub="portfolio weighted" color={T.navy} />
            <KpiCard label="Climate Premium Shr" value={(portfolioStats.climateShare * 100).toFixed(1) + '%'} sub="phys + trans / total" color={T.indigo} />
            <KpiCard label="Avg Climate PD"      value={(portfolioStats.avgPD * 100).toFixed(2) + '%'}  sub="climate-adjusted PD" color={T.red} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
            <div>
              <SectionTitle>Issuer Selection</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 420 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub, position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>In</th>
                      {['Issuer', 'Sector', 'Rating', 'Total (bps)', 'Climate %'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ISSUERS.map((iss, i) => {
                      const inPortfolio = portfolioSelection.has(iss.id);
                      const climatePct = iss.totalSpread > 0 ? ((iss.physicalPremium + iss.transitionPremium) / iss.totalSpread * 100) : 0;
                      return (
                        <tr key={iss.id} onClick={() => toggleIssuer(iss.id)} style={{
                          background: inPortfolio ? `${T.indigo}10` : i % 2 ? T.sub : T.card,
                          cursor: 'pointer', transition: 'background 0.1s',
                        }}>
                          <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                            <input type="checkbox" checked={inPortfolio} onChange={() => toggleIssuer(iss.id)} style={{ cursor: 'pointer' }} onClick={e => e.stopPropagation()} />
                          </td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: inPortfolio ? T.indigo : T.navy }}>{iss.name}</td>
                          <td style={{ padding: '7px 10px', fontSize: 10 }}><span style={{ background: SECTOR_COLORS[iss.sector] + '18', color: SECTOR_COLORS[iss.sector], padding: '1px 5px', borderRadius: 6, fontWeight: 600 }}>{iss.sector.slice(0, 5)}</span></td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: ['AAA','AA','A'].includes(iss.rating) ? T.green : ['BBB'].includes(iss.rating) ? T.amber : T.red }}>{iss.rating}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{iss.totalSpread.toFixed(0)}</td>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: climatePct > 25 ? T.red : climatePct > 12 ? T.amber : T.green }}>{climatePct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <SectionTitle>Portfolio vs Benchmark — Risk Radar</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: T.muted }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: T.muted }} />
                    <Radar name="Portfolio"  dataKey="portfolio"  stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Benchmark" dataKey="benchmark"  stroke={T.teal}   fill={T.teal}   fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px' }}>
                <SectionTitle>Portfolio vs Benchmark Summary</SectionTitle>
                {[
                  { label: 'Total Spread',       port: portfolioStats.avgTotal.toFixed(0) + ' bps',  bench: globalStats.avgTotal.toFixed(0) + ' bps' },
                  { label: 'Physical Premium',   port: portfolioStats.avgPhysical.toFixed(1) + ' bps', bench: globalStats.avgPhysical.toFixed(1) + ' bps' },
                  { label: 'Transition Premium', port: portfolioStats.avgTransition.toFixed(1) + ' bps', bench: globalStats.avgTransition.toFixed(1) + ' bps' },
                  { label: 'Climate Share',      port: (portfolioStats.climateShare * 100).toFixed(1) + '%', bench: (globalStats.climateShare * 100).toFixed(1) + '%' },
                  { label: 'Avg Climate PD',     port: (portfolioStats.avgPD * 100).toFixed(2) + '%', bench: '2.50%' },
                ].map(row => {
                  const portVal = parseFloat(row.port);
                  const benchVal = parseFloat(row.bench);
                  const higher = portVal > benchVal;
                  return (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: T.muted }}>{row.label}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: higher ? T.red : T.green }}>{row.port}</span>
                        <span style={{ fontFamily: 'monospace', color: T.muted }}>{row.bench}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
