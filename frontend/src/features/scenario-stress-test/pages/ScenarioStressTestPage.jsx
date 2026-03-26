import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, AreaChart, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

// ─── NGFS Scenarios (6 total) ────────────────────────────────────────────────
const NGFS_SCENARIOS = [
  {
    id: 'nz2050', name: 'Net Zero 2050', category: 'Orderly', color: '#10b981',
    description: 'Ambitious, early-action transition to net zero by 2050. Smooth policy trajectory.',
    carbon_price_2030: 250, carbon_price_2050: 800, temp_outcome: '1.5°C',
    sector_shocks: { Energy: -0.35, Materials: -0.22, Industrials: -0.15, Utilities: -0.28, Financials: -0.08, IT: +0.12, 'Health Care': +0.05, 'Consumer Discretionary': -0.10, 'Consumer Staples': -0.05, 'Real Estate': -0.18, 'Communication Services': +0.08 },
  },
  {
    id: 'delayed', name: 'Delayed Transition', category: 'Disorderly', color: '#f97316',
    description: 'Policy action delayed until 2030, then abrupt. High carbon price volatility.',
    carbon_price_2030: 120, carbon_price_2050: 1200, temp_outcome: '1.8°C',
    sector_shocks: { Energy: -0.55, Materials: -0.38, Industrials: -0.25, Utilities: -0.45, Financials: -0.12, IT: +0.08, 'Health Care': +0.03, 'Consumer Discretionary': -0.20, 'Consumer Staples': -0.10, 'Real Estate': -0.30, 'Communication Services': +0.05 },
  },
  {
    id: 'hhw', name: 'Hot House World', category: 'Hot House World', color: '#ef4444',
    description: 'Current policies only. High physical risk by 2100. Transition risk is low but stranded assets emerge.',
    carbon_price_2030: 30, carbon_price_2050: 80, temp_outcome: '3.5°C+',
    sector_shocks: { Energy: -0.05, Materials: -0.18, Industrials: -0.12, Utilities: -0.08, Financials: -0.20, IT: -0.05, 'Health Care': -0.08, 'Consumer Discretionary': -0.15, 'Consumer Staples': -0.22, 'Real Estate': -0.35, 'Communication Services': -0.03 },
  },
  {
    id: 'below2', name: 'Below 2°C', category: 'Orderly', color: '#3b82f6',
    description: 'Moderate transition meeting Paris Agreement 2°C goal. Balanced policy trajectory.',
    carbon_price_2030: 150, carbon_price_2050: 500, temp_outcome: '1.8°C',
    sector_shocks: { Energy: -0.20, Materials: -0.14, Industrials: -0.10, Utilities: -0.18, Financials: -0.05, IT: +0.10, 'Health Care': +0.04, 'Consumer Discretionary': -0.06, 'Consumer Staples': -0.03, 'Real Estate': -0.12, 'Communication Services': +0.06 },
  },
  {
    id: 'ndc', name: 'NDCs (Current Pledges)', category: 'Moderate', color: '#6366f1',
    description: 'Countries implement current NDC pledges only. Insufficient for Paris goals.',
    carbon_price_2030: 80, carbon_price_2050: 200, temp_outcome: '2.4°C',
    sector_shocks: { Energy: -0.12, Materials: -0.10, Industrials: -0.08, Utilities: -0.15, Financials: -0.04, IT: +0.06, 'Health Care': +0.02, 'Consumer Discretionary': -0.08, 'Consumer Staples': -0.04, 'Real Estate': -0.10, 'Communication Services': +0.04 },
  },
  {
    id: 'divergent', name: 'Divergent Net Zero', category: 'Disorderly', color: '#ec4899',
    description: 'Different sectors transition at different speeds. High uncertainty and policy fragmentation.',
    carbon_price_2030: 180, carbon_price_2050: 900, temp_outcome: '1.6°C',
    sector_shocks: { Energy: -0.45, Materials: -0.30, Industrials: -0.18, Utilities: -0.35, Financials: -0.10, IT: +0.15, 'Health Care': +0.06, 'Consumer Discretionary': -0.15, 'Consumer Staples': -0.08, 'Real Estate': -0.22, 'Communication Services': +0.10 },
  },
];

const ALL_SECTORS = ['Energy','Materials','Industrials','Utilities','Financials','IT','Health Care','Consumer Discretionary','Consumer Staples','Real Estate','Communication Services'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function categoryColor(cat) {
  if (cat === 'Orderly') return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' };
  if (cat === 'Disorderly') return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' };
  if (cat === 'Moderate') return { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' };
  return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
}

function fmt(n, dec = 2) {
  if (n === null || n === undefined || isNaN(n)) return '\u2014';
  return n.toFixed(dec);
}

function fmtPct(n) {
  if (n === null || n === undefined || isNaN(n)) return '\u2014';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(1)}%`;
}

function shockColor(shock) {
  if (shock >= 0) return T.green;
  if (shock < -0.30) return T.red;
  if (shock < -0.10) return T.amber;
  return T.textSec;
}

function shockBg(shock) {
  if (shock >= 0.05) return '#dcfce7';
  if (shock >= 0) return '#f0fdf4';
  if (shock > -0.10) return T.surface;
  if (shock > -0.20) return '#fff9f0';
  if (shock > -0.30) return '#fef3c7';
  return '#fee2e2';
}

// ─── Export Helpers ───────────────────────────────────────────────────────────
function downloadCSV(filename, headers, rows) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color || p.stroke, fontSize: 12, marginBottom: 2 }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span> {typeof p.value === 'number' ? (p.value >= 0 ? '+' : '') + fmt(p.value, 1) + (String(p.dataKey).includes('USD') ? '' : '%') : p.value}
        </div>
      ))}
    </div>
  );
}

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6, fontSize: 13 }}>Year {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.stroke || p.color, fontSize: 12, marginBottom: 2 }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span> USD {fmt(p.value)} Mn
        </div>
      ))}
    </div>
  );
}

// ─── Btn ─────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', style: sx }) {
  const base = { border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontFamily: T.font };
  const styles = variant === 'primary'
    ? { ...base, background: T.navy, color: '#fff' }
    : variant === 'gold'
      ? { ...base, background: T.gold, color: T.navy }
      : { ...base, background: 'transparent', color: T.navy, border: `1px solid ${T.border}` };
  return <button onClick={onClick} style={{ ...styles, ...sx }}>{children}</button>;
}

function NavLink({ to, children }) {
  const navigate = useNavigate();
  return (
    <span onClick={() => navigate(to)} style={{ color: T.navyL, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
      {children}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
function ScenarioStressTestPage() {
  const navigate = useNavigate();

  // ── Portfolio ────────────────────────────────────────────────────────────
  const { holdings } = useMemo(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      const { portfolios, activePortfolio } = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
      return { holdings: portfolios?.[activePortfolio]?.holdings || [] };
    } catch { return { holdings: [] }; }
  }, []);

  // ── Enrich holdings from master ─────────────────────────────────────────
  const enrichedHoldings = useMemo(() => {
    return holdings.map(h => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.ticker === h.company?.ticker);
      if (!master) return h;
      return { ...h, company: { ...master, ...h.company } };
    });
  }, [holdings]);

  const totalExposure = useMemo(() => enrichedHoldings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0), [enrichedHoldings]);

  // ── Data quality ─────────────────────────────────────────────────────────
  const dataQualityPct = useMemo(() => {
    if (enrichedHoldings.length === 0) return 0;
    const withSector = enrichedHoldings.filter(h => h.company?.sector && ALL_SECTORS.includes(h.company.sector)).length;
    return Math.round((withSector / enrichedHoldings.length) * 100);
  }, [enrichedHoldings]);

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortCol, setSortCol] = useState('valueAtRisk');
  const [sortDir, setSortDir] = useState('asc');

  const selectedScenarios = NGFS_SCENARIOS.filter(s => selectedIds.includes(s.id));

  function toggleScenario(id) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [prev[1], prev[2], id];
      return [...prev, id];
    });
  }

  // ── Sortable column click ────────────────────────────────────────────────
  function handleSort(col) {
    if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol(col); setSortDir('asc'); }
  }
  function sortArrow(col) { return sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''; }

  // ── Metrics calc ─────────────────────────────────────────────────────────
  function calcMetrics(scenario) {
    let totalValueChange = 0; let totalExp = 0; const sectorTotals = {};
    enrichedHoldings.forEach(h => {
      const sector = h.company?.sector || 'Unknown';
      const shock = scenario.sector_shocks[sector] ?? -0.10;
      const valueImpact = (h.exposure_usd_mn || 0) * shock;
      totalValueChange += valueImpact; totalExp += h.exposure_usd_mn || 0;
      if (!sectorTotals[sector]) sectorTotals[sector] = { impact: 0, exposure: 0 };
      sectorTotals[sector].impact += valueImpact; sectorTotals[sector].exposure += h.exposure_usd_mn || 0;
    });
    const pctImpact = totalExp > 0 ? totalValueChange / totalExp : 0;
    const sectors = Object.entries(sectorTotals);
    const worstSector = sectors.length ? sectors.reduce((a, b) => a[1].impact < b[1].impact ? a : b)[0] : '\u2014';
    const bestSector = sectors.length ? sectors.reduce((a, b) => a[1].impact > b[1].impact ? a : b)[0] : '\u2014';
    let carbonCost = 0;
    enrichedHoldings.forEach(h => { carbonCost += (h.company?.scope1_mt || 0) * ((h.weight || 0) / 100) * scenario.carbon_price_2030 / 1000; });
    const var95 = totalValueChange * 1.65;
    return { totalValueChange, pctImpact, worstSector, bestSector, carbonCost, var95, totalExp };
  }

  // ── Sector comparison chart ──────────────────────────────────────────────
  const comparisonChartData = useMemo(() => {
    if (selectedScenarios.length < 2) return [];
    const allSectors = [...new Set(enrichedHoldings.map(h => h.company?.sector).filter(Boolean))];
    return allSectors.map(sector => {
      const row = { sector };
      selectedScenarios.forEach(sc => { row[sc.name] = (sc.sector_shocks[sector] ?? -0.10) * 100; });
      return row;
    });
  }, [selectedScenarios, enrichedHoldings]);

  // ── Holding rows (sortable) ──────────────────────────────────────────────
  const primaryScenario = selectedScenarios[0] || null;

  const holdingRows = useMemo(() => {
    if (!primaryScenario) return [];
    const rows = enrichedHoldings.map(h => {
      const sector = h.company?.sector || 'Unknown';
      const shock = primaryScenario.sector_shocks[sector] ?? -0.10;
      const valueAtRisk = (h.exposure_usd_mn || 0) * shock;
      return { ...h, shock, valueAtRisk };
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'company': av = (a.company?.name || '').toLowerCase(); bv = (b.company?.name || '').toLowerCase(); return av < bv ? -dir : av > bv ? dir : 0;
        case 'sector': av = (a.company?.sector || ''); bv = (b.company?.sector || ''); return av < bv ? -dir : av > bv ? dir : 0;
        case 'weight': return ((a.weight || 0) - (b.weight || 0)) * dir;
        case 'exposure': return ((a.exposure_usd_mn || 0) - (b.exposure_usd_mn || 0)) * dir;
        case 'shock': return (a.shock - b.shock) * dir;
        case 'valueAtRisk': default: return (a.valueAtRisk - b.valueAtRisk) * dir;
      }
    });
    return rows;
  }, [primaryScenario, enrichedHoldings, sortCol, sortDir]);

  // ── Carbon rows ──────────────────────────────────────────────────────────
  const carbonRows = useMemo(() => {
    if (!primaryScenario) return [];
    return enrichedHoldings.map(h => {
      const s1 = h.company?.scope1_mt || 0; const s2 = h.company?.scope2_mt || 0; const w = h.weight || 0;
      const cost = (s1 + s2) * (w / 100) * primaryScenario.carbon_price_2030 * 1000;
      return { ...h, s1, s2, cost };
    }).sort((a, b) => b.cost - a.cost);
  }, [primaryScenario, enrichedHoldings]);

  const totalCarbonCost = carbonRows.reduce((s, r) => s + r.cost, 0);

  // ── Timeline data ────────────────────────────────────────────────────────
  const timelineData = useMemo(() => {
    if (selectedScenarios.length === 0 || totalExposure === 0) return [];
    return [2025, 2028, 2030, 2035, 2040, 2045, 2050].map(yr => {
      const point = { year: yr };
      selectedScenarios.forEach(s => {
        const m = calcMetrics(s);
        const yearFactor = (yr - 2025) / 25;
        point[s.id] = totalExposure * (1 + m.pctImpact * yearFactor);
      });
      return point;
    });
  }, [selectedScenarios, enrichedHoldings, totalExposure]);

  // ── Sector vulnerability matrix ──────────────────────────────────────────
  const sectorMatrix = useMemo(() => {
    return ALL_SECTORS.map(sector => {
      const row = { sector };
      NGFS_SCENARIOS.forEach(sc => { row[sc.id] = sc.sector_shocks[sector] ?? 0; });
      return row;
    });
  }, []);

  // ── Export functions ─────────────────────────────────────────────────────
  function exportScenarioCSV() {
    const headers = ['Company','Ticker','Sector','Exchange','Weight%','Exposure_USD_Mn','Scenario','Shock%','ValueAtRisk_USD_Mn'];
    const rows = [];
    enrichedHoldings.forEach(h => {
      selectedScenarios.forEach(sc => {
        const sector = h.company?.sector || 'Unknown';
        const shock = sc.sector_shocks[sector] ?? -0.10;
        rows.push([h.company?.name,h.company?.ticker,sector,h.company?.exchange,h.weight,h.exposure_usd_mn,sc.name,(shock*100).toFixed(1),((h.exposure_usd_mn||0)*shock).toFixed(2)]);
      });
    });
    downloadCSV('scenario_stress_report.csv', headers, rows);
  }

  function exportComparisonJSON() {
    const data = selectedScenarios.map(sc => {
      const m = calcMetrics(sc);
      return { scenario: sc.name, category: sc.category, temp_outcome: sc.temp_outcome, carbon_price_2030: sc.carbon_price_2030, carbon_price_2050: sc.carbon_price_2050, totalValueChange: m.totalValueChange, pctImpact: m.pctImpact, worstSector: m.worstSector, bestSector: m.bestSector, carbonCost: m.carbonCost, var95: m.var95, sector_shocks: sc.sector_shocks };
    });
    downloadJSON('scenario_comparison.json', data);
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* ── HEADER ── */}
      <div style={{ background: T.navy, padding: '32px 40px 28px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: T.gold, color: T.navy, borderRadius: 6, padding: '4px 12px', fontWeight: 800, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' }}>EP-G2</div>
              <span style={{ color: T.gold, fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>NGFS PHASE 3</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: -0.5 }}>
              Climate Scenario Stress Tester
            </h1>
            <p style={{ margin: '6px 0 0', color: '#a8bfce', fontSize: 13 }}>
              NGFS Phase 3 &middot; 6 Scenarios &middot; Portfolio Impact Analysis
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <NavLink to="/climate-physical-risk">View Physical Risk &rarr;</NavLink>
              <NavLink to="/climate-transition-risk">View Transition Risk &rarr;</NavLink>
              <NavLink to="/portfolio-optimizer">Optimize Portfolio &rarr;</NavLink>
              <NavLink to="/holdings-deep-dive">Holdings Deep-Dive &rarr;</NavLink>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#a8bfce', fontSize: 12, marginBottom: 4 }}>Portfolio Holdings</div>
            <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>{enrichedHoldings.length}</div>
            {selectedScenarios.length > 0 && (
              <div style={{ color: T.gold, fontSize: 12, marginTop: 4 }}>{selectedScenarios.length} scenario{selectedScenarios.length > 1 ? 's' : ''} selected</div>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {selectedScenarios.length > 0 && (
                <>
                  <Btn onClick={exportScenarioCSV} variant="gold" style={{ fontSize: 11, padding: '5px 10px' }}>Export CSV</Btn>
                  <Btn onClick={exportComparisonJSON} variant="outline" style={{ fontSize: 11, padding: '5px 10px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Export JSON</Btn>
                  <Btn onClick={() => window.print()} variant="outline" style={{ fontSize: 11, padding: '5px 10px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Print</Btn>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 40px', maxWidth: 1440, margin: '0 auto' }}>

        {/* ── EMPTY STATE ── */}
        {enrichedHoldings.length === 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '60px 40px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>&#128202;</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
            <div style={{ color: T.textSec, fontSize: 14, marginBottom: 16 }}>Load a portfolio via the Portfolio Manager to run climate scenario stress tests.</div>
            <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
          </div>
        )}

        {/* ── DATA QUALITY INDICATOR ── */}
        {enrichedHoldings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 18px' }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Data Quality</div>
            <div style={{ flex: 1, background: '#eef1f5', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div style={{ background: dataQualityPct >= 80 ? T.green : dataQualityPct >= 50 ? T.amber : T.red, width: `${dataQualityPct}%`, height: '100%', borderRadius: 6, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: dataQualityPct >= 80 ? T.green : dataQualityPct >= 50 ? T.amber : T.red }}>{dataQualityPct}%</div>
            <div style={{ fontSize: 11, color: T.textMut }}>{enrichedHoldings.filter(h => h.company?.sector && ALL_SECTORS.includes(h.company.sector)).length}/{enrichedHoldings.length} holdings with sector mapping</div>
          </div>
        )}

        {/* ── SCENARIO SELECTOR ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.navy }}>Select Scenario(s)</h2>
            <span style={{ background: '#eef2f7', color: T.textSec, borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>Select up to 3 for comparison</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {NGFS_SCENARIOS.map(sc => {
              const isSelected = selectedIds.includes(sc.id);
              const catStyle = categoryColor(sc.category);
              return (
                <div key={sc.id} onClick={() => toggleScenario(sc.id)} style={{ background: isSelected ? '#f0f7ff' : T.surface, border: isSelected ? `2px solid ${sc.color}` : `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', boxShadow: isSelected ? `0 0 0 3px ${sc.color}22` : 'none' }}>
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 10, right: 10, background: sc.color, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>&#10003;</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{sc.name}</span>
                    <span style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`, borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{sc.category}</span>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{sc.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <div><div style={{ fontSize: 10, color: T.textMut, marginBottom: 1 }}>Temp</div><div style={{ fontWeight: 700, color: sc.color }}>{sc.temp_outcome}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut, marginBottom: 1 }}>CO&#8322; 2030</div><div style={{ fontWeight: 700, color: T.navy }}>USD {sc.carbon_price_2030}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut, marginBottom: 1 }}>CO&#8322; 2050</div><div style={{ fontWeight: 700, color: T.navy }}>USD {sc.carbon_price_2050}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PORTFOLIO IMPACT SUMMARY ── */}
        {primaryScenario && enrichedHoldings.length > 0 && (() => {
          const m = calcMetrics(primaryScenario);
          return (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: T.navy }}>
                Portfolio Impact &mdash; <span style={{ color: primaryScenario.color }}>{primaryScenario.name}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                {[
                  { label: 'Portfolio Value Change', value: `${m.totalValueChange >= 0 ? '+' : ''}${fmt(m.totalValueChange)} USD Mn`, sub: 'Stress-tested loss/gain', accent: m.totalValueChange >= 0 ? T.green : T.red },
                  { label: 'Portfolio Impact %', value: fmtPct(m.pctImpact), sub: 'vs total exposure', accent: m.pctImpact >= 0 ? T.green : T.red },
                  { label: 'Worst Sector', value: m.worstSector, sub: 'Highest value at risk', accent: T.red },
                  { label: 'Best Positioned', value: m.bestSector, sub: 'Lowest / positive impact', accent: T.green },
                  { label: 'Carbon Price Impact', value: `${fmt(m.carbonCost)} USD Mn`, sub: `@ ${primaryScenario.carbon_price_2030} USD/tCO\u2082e (2030)`, accent: T.gold },
                ].map(card => (
                  <div key={card.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', borderTop: `3px solid ${card.accent}` }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>{card.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: card.accent, marginBottom: 4, lineHeight: 1.2 }}>{card.value}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{card.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── COMPARATIVE METRICS PANEL (2+ scenarios) ── */}
        {selectedScenarios.length >= 2 && enrichedHoldings.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: T.navy }}>Scenario Comparison Panel</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f7f4' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `2px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Metric</th>
                    {selectedScenarios.map(sc => (
                      <th key={sc.id} style={{ padding: '10px 14px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color }} />
                          <span style={{ fontWeight: 700, color: T.navy }}>{sc.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Total Impact (USD Mn)', 'Impact %', 'Worst Sector', 'Best Sector', 'Carbon Cost (USD Mn)', 'VaR 95% (USD Mn)'].map((metric, ri) => (
                    <tr key={metric} style={{ background: ri % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.textSec, fontSize: 12 }}>{metric}</td>
                      {selectedScenarios.map(sc => {
                        const m = calcMetrics(sc);
                        let val = '';
                        if (ri === 0) val = `${m.totalValueChange >= 0 ? '+' : ''}${fmt(m.totalValueChange)}`;
                        else if (ri === 1) val = fmtPct(m.pctImpact);
                        else if (ri === 2) val = m.worstSector;
                        else if (ri === 3) val = m.bestSector;
                        else if (ri === 4) val = fmt(m.carbonCost);
                        else val = fmt(m.var95);
                        return <td key={sc.id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: T.text }}>{val}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SCENARIO IMPACT TIMELINE (AreaChart) ── */}
        {timelineData.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: T.navy }}>Portfolio Value Trajectory (2025&ndash;2050)</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textSec }}>Projected portfolio value under each selected scenario</p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={timelineData} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 12 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} tickFormatter={v => `${(v / 1).toFixed(0)}`} label={{ value: 'USD Mn', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                <Tooltip content={<TimelineTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                {selectedScenarios.map(sc => (
                  <Area key={sc.id} type="monotone" dataKey={sc.id} name={sc.name} stroke={sc.color} fill={`${sc.color}22`} strokeWidth={2} dot={{ r: 3, fill: sc.color }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── SCENARIO COMPARISON CHART (BarChart) ── */}
        {selectedScenarios.length >= 2 && comparisonChartData.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: T.navy }}>Scenario Comparison &mdash; Sector Shocks</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textSec }}>Grouped by sector &middot; Shock % for each selected scenario</p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={comparisonChartData} margin={{ top: 8, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="sector" tick={{ fill: T.textSec, fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                {selectedScenarios.map(sc => (
                  <Bar key={sc.id} dataKey={sc.name} fill={sc.color} radius={[3, 3, 0, 0]} maxBarSize={32} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── SECTOR VULNERABILITY MATRIX ── */}
        {enrichedHoldings.length > 0 && selectedScenarios.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: T.navy }}>Sector Vulnerability Matrix</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textSec }}>All 11 GICS sectors vs all 6 NGFS scenarios &middot; Shock values color-coded</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8f7f4' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `2px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, position: 'sticky', left: 0, background: '#f8f7f4', zIndex: 1 }}>Sector</th>
                    {NGFS_SCENARIOS.map(sc => (
                      <th key={sc.id} style={{ padding: '8px 10px', textAlign: 'center', color: T.navy, fontWeight: 600, borderBottom: `2px solid ${T.border}`, fontSize: 11, minWidth: 80 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
                          <span>{sc.name.length > 14 ? sc.name.slice(0, 12) + '...' : sc.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sectorMatrix.map((row, ri) => (
                    <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontSize: 12, position: 'sticky', left: 0, background: ri % 2 === 0 ? T.surface : '#fafaf8', zIndex: 1 }}>{row.sector}</td>
                      {NGFS_SCENARIOS.map(sc => {
                        const v = row[sc.id];
                        return (
                          <td key={sc.id} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: shockColor(v), background: shockBg(v), fontSize: 12 }}>
                            {fmtPct(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HOLDING-LEVEL IMPACT TABLE (sortable) ── */}
        {primaryScenario && holdingRows.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: T.navy }}>Holding-Level Impact</h2>
                <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>Scenario: <strong>{primaryScenario.name}</strong> &middot; Click column headers to sort</p>
              </div>
              <Btn onClick={exportScenarioCSV} variant="outline" style={{ fontSize: 11 }}>Export Scenario Report CSV</Btn>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f7f4' }}>
                    {[
                      { key: 'company', label: 'Company', align: 'left' },
                      { key: 'sector', label: 'Sector', align: 'left' },
                      { key: 'weight', label: 'Weight %', align: 'right' },
                      { key: 'exposure', label: 'Exposure (USD Mn)', align: 'right' },
                      { key: 'shock', label: 'Scenario Shock', align: 'right' },
                      { key: 'valueAtRisk', label: 'Value at Risk (USD Mn)', align: 'right' },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '10px 14px', textAlign: col.align, color: sortCol === col.key ? T.navy : T.textSec, fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                        {col.label}{sortArrow(col.key)}
                      </th>
                    ))}
                    <th style={{ padding: '10px 14px', textAlign: 'center', color: T.textSec, fontWeight: 600, borderBottom: `2px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingRows.map((row, i) => {
                    const sc = shockColor(row.shock);
                    const rowBg = row.shock < -0.30 ? '#fff5f5' : row.shock < -0.10 ? '#fff9f0' : row.shock >= 0 ? '#f0fdf4' : T.surface;
                    return (
                      <tr key={row.id || i} style={{ background: rowBg, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: T.navy }}>{row.company?.name || '\u2014'}</div>
                          <div style={{ fontSize: 11, color: T.textMut }}>{row.company?.ticker}</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: T.textSec }}>{row.company?.sector || '\u2014'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.weight, 1)}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(row.exposure_usd_mn)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: sc }}>{fmtPct(row.shock)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: sc }}>{row.valueAtRisk >= 0 ? '+' : ''}{fmt(row.valueAtRisk)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span onClick={() => navigate('/holdings-deep-dive')} style={{ color: T.navyL, fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Deep-Dive &rarr;</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f7f4', borderTop: `2px solid ${T.border}` }}>
                    <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>Portfolio Total</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.navy }}>{fmt(holdingRows.reduce((s, r) => s + (r.exposure_usd_mn || 0), 0))}</td>
                    <td style={{ padding: '10px 14px' }} />
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: (() => { const t = holdingRows.reduce((s, r) => s + r.valueAtRisk, 0); return t >= 0 ? T.green : T.red; })() }}>
                      {(() => { const t = holdingRows.reduce((s, r) => s + r.valueAtRisk, 0); return `${t >= 0 ? '+' : ''}${fmt(t)}`; })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── CARBON COST CALCULATOR ── */}
        {primaryScenario && carbonRows.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: T.navy }}>Carbon Cost Calculator</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textSec }}>
              Implied carbon cost per holding at <strong>USD {primaryScenario.carbon_price_2030}/tCO&#8322;e</strong> (2030 price &middot; {primaryScenario.name})
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f7f4' }}>
                    {['Company','Sector','Weight %','Scope 1 (Mt)','Scope 2 (Mt)','Attributed Weight','Carbon Cost (USD)'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Company' || h === 'Sector' ? 'left' : 'right', color: T.textSec, fontWeight: 600, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {carbonRows.map((row, i) => (
                    <tr key={row.id || i} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: T.navy }}>{row.company?.name || '\u2014'}</div>
                        <div style={{ fontSize: 11, color: T.textMut }}>{row.company?.ticker}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: T.textSec }}>{row.company?.sector || '\u2014'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(row.weight, 1)}%</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(row.s1, 3)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(row.s2, 3)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: T.textSec }}>{fmt((row.weight || 0) / 100, 4)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: row.cost > 1e7 ? T.red : row.cost > 1e6 ? T.amber : T.sage }}>
                        {row.cost >= 1e6 ? `USD ${(row.cost / 1e6).toFixed(2)} Mn` : `USD ${row.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f7f4', borderTop: `2px solid ${T.border}` }}>
                    <td colSpan={6} style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>Total Portfolio Carbon Cost</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: T.navy }}>
                      {totalCarbonCost >= 1e6 ? `USD ${(totalCarbonCost / 1e6).toFixed(2)} Mn` : `USD ${totalCarbonCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── PROMPT: select scenario ── */}
        {enrichedHoldings.length > 0 && selectedScenarios.length === 0 && (
          <div style={{ background: T.surface, border: `1px dashed ${T.gold}`, borderRadius: 12, padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>&#9757;&#65039;</div>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 6 }}>Select a scenario above to run the stress test</div>
            <div style={{ color: T.textSec, fontSize: 13 }}>Select up to 3 scenarios to enable side-by-side comparison and timeline projections.</div>
          </div>
        )}

        {/* ── CROSS-MODULE NAVIGATION FOOTER ── */}
        {enrichedHoldings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 12 }}>
            {[
              { label: 'Physical Risk Analysis', desc: 'Assess physical climate hazards', path: '/climate-physical-risk' },
              { label: 'Transition Risk Engine', desc: 'Model policy & technology shifts', path: '/climate-transition-risk' },
              { label: 'Portfolio Optimizer', desc: 'Optimize for climate targets', path: '/portfolio-optimizer' },
              { label: 'Holdings Deep-Dive', desc: 'Per-holding ESG intelligence', path: '/holdings-deep-dive' },
            ].map(link => (
              <div key={link.path} onClick={() => navigate(link.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s', borderBottom: `3px solid ${T.gold}` }}>
                <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 4 }}>{link.label}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{link.desc}</div>
                <div style={{ color: T.navyL, fontSize: 11, fontWeight: 600, marginTop: 8 }}>Open &rarr;</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default ScenarioStressTestPage;
