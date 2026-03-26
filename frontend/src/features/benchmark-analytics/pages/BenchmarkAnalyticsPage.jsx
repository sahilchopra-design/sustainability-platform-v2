import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER, EXCHANGES } from '../../../data/globalCompanyMaster';

/* ── Theme ───────────────────────────────────────────────────────────────────── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

/* ── Benchmark definitions ───────────────────────────────────────────────────── */
const BENCHMARKS = {
  'MSCI ACWI': {
    waci: 185, esg_score: 58, transition_risk: 48, sbti_pct: 22, scope12_intensity: 185, implied_temp: 2.7, carbon_efficiency: 42,
    sector_weights: { Energy: 4.8, Materials: 4.5, Industrials: 10.5, Financials: 16.2, IT: 23.1, 'Health Care': 11.4, 'Consumer Discretionary': 10.7, 'Consumer Staples': 6.8, Utilities: 2.8, 'Real Estate': 2.5, 'Communication Services': 8.4 },
  },
  'S&P 500': {
    waci: 145, esg_score: 63, transition_risk: 42, sbti_pct: 31, scope12_intensity: 145, implied_temp: 2.4, carbon_efficiency: 55,
    sector_weights: { Energy: 3.8, Materials: 2.6, Industrials: 8.9, Financials: 13.2, IT: 29.0, 'Health Care': 13.4, 'Consumer Discretionary': 10.4, 'Consumer Staples': 6.5, Utilities: 2.5, 'Real Estate': 2.5, 'Communication Services': 8.5 },
  },
  'MSCI EM': {
    waci: 285, esg_score: 48, transition_risk: 62, sbti_pct: 12, scope12_intensity: 285, implied_temp: 3.2, carbon_efficiency: 28,
    sector_weights: { Energy: 4.9, Materials: 7.8, Industrials: 6.5, Financials: 23.1, IT: 18.8, 'Health Care': 3.8, 'Consumer Discretionary': 12.4, 'Consumer Staples': 5.9, Utilities: 3.8, 'Real Estate': 2.8, 'Communication Services': 9.4 },
  },
  'Nifty 50': {
    waci: 320, esg_score: 45, transition_risk: 68, sbti_pct: 8, scope12_intensity: 320, implied_temp: 3.5, carbon_efficiency: 22,
    sector_weights: { Energy: 12.5, Materials: 9.8, Industrials: 3.5, Financials: 32.1, IT: 15.2, 'Health Care': 5.4, 'Consumer Discretionary': 4.8, 'Consumer Staples': 8.6, Utilities: 4.3, 'Real Estate': 1.5, 'Communication Services': 2.3 },
  },
};

const SECTOR_SHORT = {
  Energy: 'Energy', Materials: 'Materials', Industrials: 'Indust.', Financials: 'Finance', IT: 'IT',
  'Health Care': 'Health', 'Consumer Discretionary': 'Cons.Disc', 'Consumer Staples': 'Cons.Stap',
  Utilities: 'Utilities', 'Real Estate': 'Real Est.', 'Communication Services': 'Comms',
};
const ALL_SECTORS = Object.keys(SECTOR_SHORT);

function fmt1(n) { return typeof n === 'number' ? n.toFixed(1) : '\u2014'; }

/* ── Export helpers ───────────────────────────────────────────────────────────── */
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Reusable components ─────────────────────────────────────────────────────── */
function DeltaBadge({ delta, lowerBetter }) {
  if (delta === null || isNaN(delta)) return null;
  const positive = lowerBetter ? delta < 0 : delta > 0;
  const color = positive ? T.green : T.red;
  const arrow = delta > 0 ? '\u25B2' : '\u25BC';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {arrow} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

function KPICard({ label, portfolioVal, benchmarkVal, unit, lowerBetter, delta }) {
  const positive = lowerBetter ? delta < 0 : delta > 0;
  const borderColor = delta !== null && !isNaN(delta) ? (positive ? T.green : T.red) : T.border;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${borderColor}`, borderRadius: 10, padding: '16px 18px', flex: '1 1 180px', minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: T.navy, lineHeight: 1, marginBottom: 6 }}>
        {portfolioVal !== null && portfolioVal !== undefined ? fmt1(portfolioVal) : '\u2014'}
        {unit && <span style={{ fontSize: 13, fontWeight: 500, color: T.textSec, marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 12, color: T.textMut }}>vs {fmt1(benchmarkVal)}</span>
        {delta !== null && !isNaN(delta) && <DeltaBadge delta={delta} lowerBetter={lowerBetter} />}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          <span style={{ color: T.textSec }}>{p.name}: </span><strong>{fmt1(p.value)}%</strong>
        </div>
      ))}
    </div>
  );
};

const ClimateTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          <span style={{ color: T.textSec }}>{p.name}: </span><strong>{fmt1(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */
export default function BenchmarkAnalyticsPage() {
  const navigate = useNavigate();
  const [benchmarks, setBenchmarks] = useState(['MSCI ACWI']);
  const [sectorSortCol, setSectorSortCol] = useState('Portfolio');
  const [sectorSortDir, setSectorSortDir] = useState('desc');
  const [holdingSortCol, setHoldingSortCol] = useState('overweight');
  const [holdingSortDir, setHoldingSortDir] = useState('desc');

  const activeBenchmark = benchmarks[0] || 'MSCI ACWI';
  const benchmark = BENCHMARKS[activeBenchmark];
  const benchmark2 = benchmarks[1] ? BENCHMARKS[benchmarks[1]] : null;

  const toggleBenchmark = (bm) => {
    setBenchmarks(prev => {
      if (prev.includes(bm)) return prev.filter(b => b !== bm);
      if (prev.length >= 2) return [bm];
      return [...prev, bm];
    });
  };

  /* ── Load portfolio ───────────────────────────────────────────────────────── */
  const { holdings, portfolioName } = useMemo(() => {
    try {
      const raw = localStorage.getItem('ra_portfolio_v1');
      if (!raw) return { holdings: [], portfolioName: 'My Portfolio' };
      const outer = JSON.parse(raw);
      if (outer && typeof outer === 'object' && outer.portfolios) {
        const h = outer.portfolios?.[outer.activePortfolio]?.holdings || [];
        return { holdings: h, portfolioName: outer.activePortfolio || 'My Portfolio' };
      }
      return { holdings: [], portfolioName: 'My Portfolio' };
    } catch { return { holdings: [], portfolioName: 'My Portfolio' }; }
  }, []);

  /* ── Portfolio metrics ────────────────────────────────────────────────────── */
  const portfolioMetrics = useMemo(() => {
    if (!holdings.length) return null;
    const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0);
    if (totalExp === 0) return null;
    let waci = 0, esgSum = 0, esgCount = 0, trSum = 0, trCount = 0, sbtiCount = 0;
    for (const h of holdings) {
      const w = (h.exposure_usd_mn || 0) / totalExp;
      const c = h.company || {};
      waci += w * (((c.scope1_mt || 0) + (c.scope2_mt || 0)) / (c.revenue_usd_mn || 1)) * 1000;
      if (c.esg_score != null) { esgSum += w * c.esg_score; esgCount++; }
      if (c.transition_risk_score != null) { trSum += w * c.transition_risk_score; trCount++; }
      if (c.sbti_committed) sbtiCount++;
    }
    const esgScore = esgCount > 0 ? esgSum : 52;
    const transitionRisk = trCount > 0 ? trSum : 55;
    const sbtiPct = (sbtiCount / holdings.length) * 100;
    const sectorExp = {};
    for (const h of holdings) { const sec = h.company?.sector || 'Other'; sectorExp[sec] = (sectorExp[sec] || 0) + (h.exposure_usd_mn || 0); }
    const sectorWeights = {};
    for (const sec in sectorExp) sectorWeights[sec] = (sectorExp[sec] / totalExp) * 100;
    let activeShareSum = 0;
    for (const sec of ALL_SECTORS) activeShareSum += Math.abs((sectorWeights[sec] || 0) - (benchmark.sector_weights[sec] || 0));
    return { waci: isFinite(waci) && waci > 0 ? waci : 210, esgScore, transitionRisk, sbtiPct, scope12Intensity: isFinite(waci) && waci > 0 ? waci : 210, activeShare: activeShareSum / 2, sectorWeights };
  }, [holdings, benchmark]);

  const pm = portfolioMetrics || {
    waci: 210, esgScore: 52, transitionRisk: 55, sbtiPct: 18, scope12Intensity: 210, activeShare: 24.3,
    sectorWeights: { Energy: 8.2, Materials: 6.1, Industrials: 7.4, Financials: 22.3, IT: 18.5, 'Health Care': 4.2, 'Consumer Discretionary': 6.8, 'Consumer Staples': 7.9, Utilities: 5.6, 'Real Estate': 3.1, 'Communication Services': 9.9 },
  };

  /* ── Tracking Error ───────────────────────────────────────────────────────── */
  const trackingError = useMemo(() => {
    return Math.sqrt(
      Object.entries(pm.sectorWeights).reduce((sum, [sec, pw]) => {
        const bw = benchmark.sector_weights[sec] || 0;
        return sum + Math.pow(pw - bw, 2);
      }, 0)
    ) * 0.8;
  }, [pm, benchmark]);

  /* ── Sector tilt data ─────────────────────────────────────────────────────── */
  const sectorTiltData = useMemo(() => {
    const rows = ALL_SECTORS.map(sec => {
      const row = { sector: SECTOR_SHORT[sec], fullSector: sec, Portfolio: +((pm.sectorWeights[sec] || 0).toFixed(2)), [activeBenchmark]: +((benchmark.sector_weights[sec] || 0).toFixed(2)) };
      if (benchmark2 && benchmarks[1]) row[benchmarks[1]] = +((benchmark2.sector_weights[sec] || 0).toFixed(2));
      return row;
    });
    rows.sort((a, b) => {
      const av = a[sectorSortCol] ?? 0, bv = b[sectorSortCol] ?? 0;
      if (typeof av === 'string') return sectorSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sectorSortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [pm, benchmark, benchmark2, benchmarks, activeBenchmark, sectorSortCol, sectorSortDir]);

  /* ── Climate metrics comparison (3-group BarChart) ─────────────────────── */
  const climateCompData = useMemo(() => {
    const metrics = [
      { metric: 'WACI', Portfolio: pm.waci, [activeBenchmark]: benchmark.waci },
      { metric: 'SBTi %', Portfolio: pm.sbtiPct, [activeBenchmark]: benchmark.sbti_pct },
      { metric: 'Impl. Temp', Portfolio: 2.6, [activeBenchmark]: benchmark.implied_temp || 2.7 },
      { metric: 'Carbon Eff.', Portfolio: 45, [activeBenchmark]: benchmark.carbon_efficiency || 42 },
    ];
    if (benchmark2 && benchmarks[1]) {
      metrics.forEach(m => {
        if (m.metric === 'WACI') m[benchmarks[1]] = benchmark2.waci;
        if (m.metric === 'SBTi %') m[benchmarks[1]] = benchmark2.sbti_pct;
        if (m.metric === 'Impl. Temp') m[benchmarks[1]] = benchmark2.implied_temp || 2.7;
        if (m.metric === 'Carbon Eff.') m[benchmarks[1]] = benchmark2.carbon_efficiency || 42;
      });
    }
    return metrics;
  }, [pm, benchmark, benchmark2, benchmarks, activeBenchmark]);

  /* ── Attribution waterfall ─────────────────────────────────────────────── */
  const waterfallData = useMemo(() => {
    const totalBenchReturn = 8.5; // illustrative total benchmark return
    return ALL_SECTORS.map(sec => {
      const wp = (pm.sectorWeights[sec] || 0) / 100;
      const wb = (benchmark.sector_weights[sec] || 0) / 100;
      const rb = (benchmark.sector_weights[sec] || 5) * 0.6; // proxy sector return
      const allocationEffect = +((wp - wb) * (rb - totalBenchReturn)).toFixed(2);
      return { sector: SECTOR_SHORT[sec], allocation: allocationEffect };
    }).filter(d => Math.abs(d.allocation) > 0.01);
  }, [pm, benchmark]);

  /* ── Top overweight holdings ──────────────────────────────────────────── */
  const overweightRows = useMemo(() => {
    if (!holdings.length) {
      return [
        { name: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Energy', portfolioWeight: 8.2, benchAvg: 4.8, overweight: 3.4, esg: 52 },
        { name: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Financials', portfolioWeight: 10.5, benchAvg: 8.0, overweight: 2.5, esg: 61 },
        { name: 'Infosys', ticker: 'INFY', sector: 'IT', portfolioWeight: 7.8, benchAvg: 5.8, overweight: 2.0, esg: 72 },
        { name: 'TCS', ticker: 'TCS', sector: 'IT', portfolioWeight: 6.9, benchAvg: 5.1, overweight: 1.8, esg: 68 },
        { name: 'NTPC', ticker: 'NTPC', sector: 'Utilities', portfolioWeight: 4.2, benchAvg: 2.8, overweight: 1.4, esg: 38 },
      ];
    }
    const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0);
    return holdings.map(h => {
      const w = totalExp > 0 ? ((h.exposure_usd_mn || 0) / totalExp) * 100 : 0;
      const sec = h.company?.sector || 'Other';
      const secCount = Math.max(holdings.filter(x => (x.company?.sector || 'Other') === sec).length, 1);
      const benchAvg = (benchmark.sector_weights[sec] || 0) / secCount;
      return { name: h.company?.name || 'Unknown', ticker: h.company?.ticker || '\u2014', sector: sec, portfolioWeight: w, benchAvg, overweight: w - benchAvg, esg: h.company?.esg_score || 0 };
    }).sort((a, b) => {
      const av = a[holdingSortCol] ?? 0, bv = b[holdingSortCol] ?? 0;
      if (typeof av === 'string') return holdingSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return holdingSortDir === 'asc' ? av - bv : bv - av;
    }).slice(0, 10);
  }, [holdings, benchmark, holdingSortCol, holdingSortDir]);

  /* ── ESG improvement potential ─────────────────────────────────────────── */
  const esgImprovements = useMemo(() => {
    const benchAvgESG = benchmark.esg_score;
    return overweightRows.filter(r => r.esg < benchAvgESG && r.esg > 0).map(r => ({
      name: r.name, ticker: r.ticker, esg: r.esg, benchAvg: benchAvgESG, gap: +(benchAvgESG - r.esg).toFixed(1),
    })).sort((a, b) => b.gap - a.gap);
  }, [overweightRows, benchmark]);

  /* ── Tilts & alpha ─────────────────────────────────────────────────────── */
  const esgTilt = ((pm.esgScore - benchmark.esg_score) / benchmark.esg_score) * 100;
  const carbonTilt = ((pm.waci - benchmark.waci) / benchmark.waci) * 100;

  /* ── Sort handlers ─────────────────────────────────────────────────────── */
  const handleSectorSort = useCallback((col) => {
    if (sectorSortCol === col) setSectorSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSectorSortCol(col); setSectorSortDir('desc'); }
  }, [sectorSortCol]);

  const handleHoldingSort = useCallback((col) => {
    if (holdingSortCol === col) setHoldingSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setHoldingSortCol(col); setHoldingSortDir('desc'); }
  }, [holdingSortCol]);

  const sortArrow = (currentCol, col, dir) => currentCol === col ? (dir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Export handlers ───────────────────────────────────────────────────── */
  const exportBenchmarkCSV = () => {
    const rows = sectorTiltData.map(r => {
      const row = { Sector: r.fullSector, 'Portfolio %': r.Portfolio, [`${activeBenchmark} %`]: r[activeBenchmark] };
      if (benchmarks[1]) row[`${benchmarks[1]} %`] = r[benchmarks[1]];
      return row;
    });
    downloadCSV('benchmark_comparison.csv', rows);
  };

  const exportSectorTiltsCSV = () => {
    const rows = sectorTiltData.map(r => ({
      Sector: r.fullSector, 'Portfolio %': r.Portfolio, 'Benchmark %': r[activeBenchmark],
      'Tilt (pp)': +(r.Portfolio - r[activeBenchmark]).toFixed(2),
    }));
    downloadCSV('sector_tilts.csv', rows);
  };

  const isEmpty = holdings.length === 0;

  /* ── Sortable TH ───────────────────────────────────────────────────────── */
  const SortTH = ({ col, label, align, onSort, currentCol, currentDir }) => (
    <th onClick={() => onSort(col)} style={{
      padding: '8px 12px', textAlign: align || 'left', fontSize: 11, fontWeight: 700, color: T.textMut,
      textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', userSelect: 'none',
      background: currentCol === col ? T.surfaceH : 'transparent', borderBottom: `2px solid ${T.border}`,
    }}>
      {label}{sortArrow(currentCol, col, currentDir)}
    </th>
  );

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                    */
  /* ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: '28px 32px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, background: T.gold, borderRadius: 2 }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Benchmark Analytics</h1>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, background: '#c5a96a18', border: '1px solid #c5a96a44', borderRadius: 4, padding: '2px 8px' }}>EP-G5</span>
          </div>
          <p style={{ margin: 0, marginLeft: 14, fontSize: 13, color: T.textSec }}>
            Compare <strong>{portfolioName}</strong> against major index benchmarks on ESG, climate & financial metrics
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isEmpty && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#92400e' }}>No portfolio loaded \u2014 showing demo data</div>
          )}
        </div>
      </div>

      {/* ── Multi-Benchmark Selector (chip toggle, max 2) ──────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
          Select Benchmarks (up to 2 for 3-way comparison)
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.keys(BENCHMARKS).map(bm => {
            const active = benchmarks.includes(bm);
            const idx = benchmarks.indexOf(bm);
            return (
              <button key={bm} onClick={() => toggleBenchmark(bm)} style={{
                padding: '9px 20px', borderRadius: 8, border: '2px solid',
                borderColor: active ? (idx === 0 ? T.navy : T.gold) : T.border,
                background: active ? (idx === 0 ? T.navy : T.gold) : T.surface,
                color: active ? '#ffffff' : T.text,
                fontFamily: T.font, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
                {bm}
                {active && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>{idx === 0 ? 'Primary' : 'Secondary'}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 12, color: T.textSec }}>
          <span>WACI: <strong style={{ color: T.navy }}>{benchmark.waci}</strong></span>
          <span>ESG: <strong style={{ color: T.navy }}>{benchmark.esg_score}</strong></span>
          <span>SBTi: <strong style={{ color: T.navy }}>{benchmark.sbti_pct}%</strong></span>
          {benchmark2 && benchmarks[1] && <span style={{ color: T.gold, fontWeight: 700 }}>| {benchmarks[1]}: WACI {benchmark2.waci}, ESG {benchmark2.esg_score}</span>}
        </div>
      </div>

      {/* ── Cross-Module Navigation + Exports ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Optimize to Benchmark \u2192', path: '/portfolio-optimizer' },
            { label: 'View Risk Attribution \u2192', path: '/risk-attribution' },
          ].map(link => (
            <button key={link.path} onClick={() => navigate(link.path)} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${T.gold}44`, background: `${T.gold}12`, color: T.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{link.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Export Benchmark CSV', fn: exportBenchmarkCSV },
            { label: 'Export Sector Tilts CSV', fn: exportSectorTiltsCSV },
            { label: 'Print Benchmark Report', fn: () => window.print() },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{btn.label}</button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid (with Tracking Error) ─────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Portfolio vs Benchmark \u2014 Key Metrics</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KPICard label="WACI" portfolioVal={pm.waci} benchmarkVal={benchmark.waci} unit="t CO\u2082e/USD Mn" lowerBetter={true} delta={pm.waci - benchmark.waci} />
          <KPICard label="ESG Score" portfolioVal={pm.esgScore} benchmarkVal={benchmark.esg_score} unit="" lowerBetter={false} delta={pm.esgScore - benchmark.esg_score} />
          <KPICard label="Transition Risk" portfolioVal={pm.transitionRisk} benchmarkVal={benchmark.transition_risk} unit="" lowerBetter={true} delta={pm.transitionRisk - benchmark.transition_risk} />
          <KPICard label="SBTi Coverage" portfolioVal={pm.sbtiPct} benchmarkVal={benchmark.sbti_pct} unit="%" lowerBetter={false} delta={pm.sbtiPct - benchmark.sbti_pct} />
          <KPICard label="Tracking Error" portfolioVal={trackingError} benchmarkVal={0} unit="% (est.)" lowerBetter={null} delta={null} />
          <KPICard label="Active Share" portfolioVal={pm.activeShare} benchmarkVal={0} unit="%" lowerBetter={null} delta={null} />
        </div>
      </div>

      {/* ── Charts row: Sector Tilt + Climate Metrics Comparison ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 22 }}>
        {/* Sector Tilt */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Sector Tilt vs {benchmarks.join(' & ')}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Portfolio vs benchmark(s) sector weights (%)</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorTiltData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" interval={0} height={65} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="Portfolio" fill={T.navy} radius={[3, 3, 0, 0]} />
              <Bar dataKey={activeBenchmark} fill={T.gold} radius={[3, 3, 0, 0]} />
              {benchmark2 && benchmarks[1] && <Bar dataKey={benchmarks[1]} fill={T.sage} radius={[3, 3, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Climate Metrics Comparison (3-group) */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Climate Metrics Comparison</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>WACI, SBTi%, Implied Temp, Carbon Efficiency</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={climateCompData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis dataKey="metric" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={88} />
              <Tooltip content={<ClimateTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Portfolio" fill={T.navy} radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey={activeBenchmark} fill={T.gold} radius={[0, 4, 4, 0]} barSize={12} />
              {benchmark2 && benchmarks[1] && <Bar dataKey={benchmarks[1]} fill={T.sage} radius={[0, 4, 4, 0]} barSize={12} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Attribution Waterfall ─────────────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 22 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Allocation Effect Waterfall vs {activeBenchmark}</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Allocation effect per sector = (W_p - W_b) x (R_b_sector - R_b_total)</div>
        </div>
        {waterfallData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waterfallData} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip />
              <ReferenceLine y={0} stroke={T.navy} strokeWidth={1.5} />
              <Bar dataKey="allocation" name="Allocation Effect" radius={[3, 3, 0, 0]}>
                {waterfallData.map((d, i) => (
                  <Cell key={i} fill={d.allocation >= 0 ? T.green : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No allocation data to display</div>
        )}
      </div>

      {/* ── Active Share & Climate Tilts ──────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Active Share & Climate Tilts vs {activeBenchmark}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Active Share', value: `${pm.activeShare.toFixed(1)}%`, sub: 'Sector deviation from benchmark', color: pm.activeShare > 30 ? T.amber : T.sage, badge: pm.activeShare > 50 ? 'High Active' : pm.activeShare > 25 ? 'Moderate' : 'Low Active' },
            { label: 'ESG Tilt Score', value: `${esgTilt >= 0 ? '+' : ''}${esgTilt.toFixed(1)}%`, sub: 'Portfolio ESG vs benchmark', color: esgTilt >= 0 ? T.sage : T.red, badge: esgTilt >= 5 ? 'ESG Positive' : esgTilt <= -5 ? 'ESG Negative' : 'Neutral' },
            { label: 'Carbon Tilt', value: `${carbonTilt >= 0 ? '+' : ''}${carbonTilt.toFixed(1)}%`, sub: 'WACI vs benchmark WACI', color: carbonTilt <= 0 ? T.sage : T.red, badge: carbonTilt <= -10 ? 'Carbon Leader' : carbonTilt >= 10 ? 'Carbon Laggard' : 'Neutral' },
            { label: 'Tracking Error', value: `${trackingError.toFixed(2)}%`, sub: 'Estimated annualised TE', color: trackingError > 5 ? T.amber : T.sage, badge: trackingError > 8 ? 'High TE' : trackingError > 4 ? 'Moderate TE' : 'Low TE' },
          ].map((item, i) => (
            <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${item.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.value}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{item.sub}</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: `${item.color}15`, border: `1px solid ${item.color}30`, borderRadius: 4, padding: '2px 7px' }}>{item.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Overweight Holdings (Sortable) ───────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 22 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Top Overweight Holdings vs {activeBenchmark}</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Click headers to sort \u00B7 click Deep-Dive for holding detail</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <SortTH col="name" label="Company" align="left" onSort={handleHoldingSort} currentCol={holdingSortCol} currentDir={holdingSortDir} />
              <SortTH col="sector" label="Sector" align="left" onSort={handleHoldingSort} currentCol={holdingSortCol} currentDir={holdingSortDir} />
              <SortTH col="portfolioWeight" label="Port Wt %" align="right" onSort={handleHoldingSort} currentCol={holdingSortCol} currentDir={holdingSortDir} />
              <SortTH col="benchAvg" label="Bench Avg %" align="right" onSort={handleHoldingSort} currentCol={holdingSortCol} currentDir={holdingSortDir} />
              <SortTH col="overweight" label="Overweight" align="right" onSort={handleHoldingSort} currentCol={holdingSortCol} currentDir={holdingSortDir} />
              <SortTH col="esg" label="ESG" align="right" onSort={handleHoldingSort} currentCol={holdingSortCol} currentDir={holdingSortDir} />
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {overweightRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : '#faf9f7' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{row.name}<div style={{ fontSize: 11, color: T.textMut }}>{row.ticker}</div></td>
                <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 11, fontWeight: 600, color: T.textSec, background: `${T.navy}10`, border: `1px solid ${T.navy}20`, borderRadius: 4, padding: '2px 7px' }}>{row.sector}</span></td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: T.navy }}>{fmt1(row.portfolioWeight)}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>{fmt1(row.benchAvg)}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: row.overweight > 0 ? T.sage : T.red, background: row.overweight > 0 ? '#16a34a12' : '#dc262612', border: `1px solid ${row.overweight > 0 ? '#16a34a30' : '#dc262630'}`, borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>
                    {row.overweight > 0 ? '+' : ''}{fmt1(row.overweight)}%
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: row.esg >= 60 ? T.green : row.esg >= 40 ? T.amber : T.red }}>{row.esg || '\u2014'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button onClick={() => navigate(`/holdings-deep-dive?ticker=${row.ticker}`)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.navyL, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Deep-Dive \u2192</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── ESG Improvement Potential ─────────────────────────────────────── */}
      {esgImprovements.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 22 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>ESG Improvement Potential</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Holdings below benchmark ESG score ({benchmark.esg_score}) \u2014 improving or replacing these would boost portfolio ESG</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Company', 'Current ESG', `Benchmark Avg (${activeBenchmark})`, 'Gap', 'Action'].map(col => (
                  <th key={col} style={{ padding: '8px 12px', textAlign: col === 'Company' || col === 'Action' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {esgImprovements.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{row.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: T.red }}>{row.esg}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>{row.benchAvg}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#fef2f2', color: T.red }}>\u2212{row.gap}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>Engage or replace with higher-ESG alternative</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sector Tilt Table (Sortable) ──────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 22 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Sector Weight Detail</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Click headers to sort</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <SortTH col="fullSector" label="Sector" align="left" onSort={handleSectorSort} currentCol={sectorSortCol} currentDir={sectorSortDir} />
              <SortTH col="Portfolio" label="Portfolio %" align="right" onSort={handleSectorSort} currentCol={sectorSortCol} currentDir={sectorSortDir} />
              <SortTH col={activeBenchmark} label={`${activeBenchmark} %`} align="right" onSort={handleSectorSort} currentCol={sectorSortCol} currentDir={sectorSortDir} />
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>Tilt (pp)</th>
              {benchmark2 && benchmarks[1] && <SortTH col={benchmarks[1]} label={`${benchmarks[1]} %`} align="right" onSort={handleSectorSort} currentCol={sectorSortCol} currentDir={sectorSortDir} />}
            </tr>
          </thead>
          <tbody>
            {sectorTiltData.map((row, i) => {
              const tilt = row.Portfolio - row[activeBenchmark];
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : '#faf9f7' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{row.fullSector}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: T.navy }}>{row.Portfolio}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>{row[activeBenchmark]}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: tilt > 0 ? T.sage : tilt < 0 ? T.red : T.textMut }}>
                      {tilt > 0 ? '+' : ''}{tilt.toFixed(1)}pp
                    </span>
                  </td>
                  {benchmark2 && benchmarks[1] && <td style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>{row[benchmarks[1]]}%</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, padding: '12px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: T.textMut }}>AA Impact Risk Analytics Platform \u2014 EP-G5 Benchmark Analytics</span>
        <span style={{ fontSize: 11, color: T.textMut }}>Benchmarks: {benchmarks.join(', ')} \u00B7 Tracking Error: {trackingError.toFixed(2)}%</span>
      </div>
    </div>
  );
}
