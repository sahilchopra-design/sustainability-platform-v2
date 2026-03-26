import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

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

/* ── Pathway definitions (SBTi glide paths) ──────────────────────────────────── */
const PATHWAYS = {
  '1.5': { label: '1.5°C', rate: 0.042, color: '#10b981', desc: 'Most ambitious — 4.2%/yr decline' },
  'WB2':  { label: 'Well-Below 2°C', rate: 0.025, color: '#3b82f6', desc: 'Moderate — 2.5%/yr decline' },
  '2.0':  { label: '2°C', rate: 0.014, color: '#8b5cf6', desc: 'Minimum Paris — 1.4%/yr decline' },
};

const SCOPE_MODES = {
  s1:  { label: 'Scope 1', desc: 'Direct emissions only' },
  s12: { label: 'Scope 1+2', desc: 'Direct + purchased energy' },
  s123:{ label: 'Scope 1+2+3 (est.)', desc: 'Full value chain (estimated)' },
};

/* ── Portfolio reader ────────────────────────────────────────────────────────── */
function readPortfolioData() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return { portfolios: {}, activePortfolio: null };
    const outer = JSON.parse(raw);
    if (outer && typeof outer === 'object' && outer.portfolios) {
      return { portfolios: outer.portfolios || {}, activePortfolio: outer.activePortfolio || null };
    }
    return { portfolios: {}, activePortfolio: null };
  } catch { return { portfolios: {}, activePortfolio: null }; }
}

/* ── Emission helpers ────────────────────────────────────────────────────────── */
function scopeEmissions(c, mode) {
  const s1 = c.scope1_mt || 0;
  const s2 = c.scope2_mt || 0;
  if (mode === 's1') return s1;
  if (mode === 's12') return s1 + s2;
  // s123: estimate scope 3 as 4× direct if not available
  const s3 = c.scope3_mt || (s1 + s2) * 4;
  return s1 + s2 + s3;
}

function holdingAttributedEmissions(h, mode) {
  const af = h.exposure_usd_mn / (h.company.evic_usd_mn || h.exposure_usd_mn * 3);
  return af * scopeEmissions(h.company, mode);
}

function calcTotalEmissions(holdings, mode) {
  return holdings.reduce((sum, h) => sum + holdingAttributedEmissions(h, mode), 0);
}

function calcNetZeroYear(holdings) {
  const t = holdings.filter(h => h.company.carbon_neutral_target_year && h.company.carbon_neutral_target_year > 0);
  if (!t.length) return null;
  const tw = t.reduce((s, h) => s + h.weight, 0);
  if (!tw) return null;
  return t.reduce((s, h) => s + (h.weight / tw) * h.company.carbon_neutral_target_year, 0);
}

function groupSectorEmissions(holdings, mode) {
  const map = {};
  holdings.forEach(h => {
    const sec = h.company.sector || 'Unknown';
    map[sec] = (map[sec] || 0) + holdingAttributedEmissions(h, mode);
  });
  return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(4) })).sort((a, b) => b.value - a.value);
}

function trackStatus(h) {
  const yr = h.company.carbon_neutral_target_year;
  if (!yr || yr > 2060) return { icon: '\u274C', label: 'No target', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  if (yr <= 2050) return { icon: '\u2705', label: `Net zero ${yr}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  return { icon: '\u26A0\uFE0F', label: `Net zero ${yr}`, color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
}

function netZeroReadinessScore(h) {
  const c = h.company;
  let score = 0;
  if (c.sbti_committed) score += 30;
  const nzY = c.carbon_neutral_target_year;
  if (nzY && nzY <= 2040) score += 25;
  else if (nzY && nzY <= 2050) score += 15;
  if ((c.esg_score || 0) > 60) score += 20;
  const intensity = (c.scope1_mt || 0) + (c.scope2_mt || 0);
  const rev = c.revenue_usd_mn || 1;
  if ((intensity / rev) * 1000 < 100) score += 25;
  return score;
}

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

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Reusable Components ─────────────────────────────────────────────────────── */
function KpiCard({ label, value, valueColor, sub, icon }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: valueColor || T.navy, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

const GlidePathTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color }} />
          <span style={{ color: T.textSec }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: T.navy }}>{p.value.toFixed(4)} Mt</span>
        </div>
      ))}
    </div>
  );
};

const SectorTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      <div style={{ color: T.textSec }}>Attributed emissions: <span style={{ fontWeight: 600, color: T.navy }}>{payload[0]?.value?.toFixed(4)} Mt CO\u2082e</span></div>
    </div>
  );
};

const IntensityTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      <div style={{ color: T.textSec }}>GHG Intensity: <span style={{ fontWeight: 600, color: T.navy }}>{payload[0]?.value?.toFixed(1)} t CO\u2082e / USD Mn</span></div>
    </div>
  );
};

/* ── Chip Toggle ─────────────────────────────────────────────────────────────── */
function ChipToggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {Object.entries(options).map(([key, opt]) => {
        const active = value === key;
        return (
          <button key={key} onClick={() => onChange(key)} style={{
            padding: '7px 16px', borderRadius: 20, border: `2px solid ${active ? T.navy : T.border}`,
            background: active ? T.navy : T.surface, color: active ? '#fff' : T.text,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {opt.label}
            {active && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>Active</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */
export default function CarbonBudgetPage() {
  const navigate = useNavigate();
  const [data] = useState(readPortfolioData);
  const [pathway, setPathway] = useState('1.5');
  const [scopeMode, setScopeMode] = useState('s12');
  const [sortCol, setSortCol] = useState('attributedEmissions');
  const [sortDir, setSortDir] = useState('desc');

  const { portfolios, activePortfolio } = data;
  const portfolio = activePortfolio ? portfolios[activePortfolio] : null;
  const holdings = portfolio?.holdings || [];

  const pw = PATHWAYS[pathway];

  /* ── Computed metrics ─────────────────────────────────────────────────────── */
  const totalEmissions = useMemo(() => calcTotalEmissions(holdings, scopeMode), [holdings, scopeMode]);
  const netZeroYear = useMemo(() => calcNetZeroYear(holdings), [holdings]);
  const sectorEmissions = useMemo(() => groupSectorEmissions(holdings, scopeMode), [holdings, scopeMode]);

  const budget2025Remaining = +(totalEmissions * 7.5).toFixed(3);

  const requiredReduction = useMemo(() => {
    const r = pw.rate;
    return ((1 - Math.pow(1 - r, 10)) * 100).toFixed(0);
  }, [pw]);

  /* ── Glide path data ──────────────────────────────────────────────────────── */
  const glidePathData = useMemo(() => {
    const years = Array.from({ length: 31 }, (_, i) => 2020 + i);
    const portfolioRate = 0.038; // assumed portfolio reduction
    return years.map(yr => ({
      year: yr,
      portfolio: +Math.max(0, totalEmissions * Math.pow(1 - portfolioRate, yr - 2020)).toFixed(5),
      budget: +Math.max(0, totalEmissions * Math.pow(1 - pw.rate, yr - 2020)).toFixed(5),
    }));
  }, [totalEmissions, pw]);

  const gap2030 = useMemo(() => {
    const row = glidePathData.find(d => d.year === 2030);
    return row ? Math.max(0, row.portfolio - row.budget) : 0;
  }, [glidePathData]);

  /* ── Annual reduction targets ─────────────────────────────────────────────── */
  const annualTargets = useMemo(() => {
    const rows = [];
    for (let yr = 2025; yr <= 2030; yr++) {
      const budgetMt = +(totalEmissions * Math.pow(1 - pw.rate, yr - 2020)).toFixed(5);
      const prevBudget = +(totalEmissions * Math.pow(1 - pw.rate, yr - 1 - 2020)).toFixed(5);
      const reduction = +(prevBudget - budgetMt).toFixed(5);
      const cumReduction = +((1 - Math.pow(1 - pw.rate, yr - 2020)) * 100).toFixed(1);
      rows.push({ year: yr, budget: budgetMt, reduction, cumReduction });
    }
    return rows;
  }, [totalEmissions, pw]);

  /* ── Holding rows with sort ───────────────────────────────────────────────── */
  const holdingRows = useMemo(() => {
    const rows = holdings.map(h => {
      const em = holdingAttributedEmissions(h, scopeMode);
      const pct = totalEmissions > 0 ? (em / totalEmissions) * 100 : 0;
      const c = h.company;
      const rev = c.revenue_usd_mn || 1;
      const intensity = (scopeEmissions(c, scopeMode) / rev) * 1000;
      const nzScore = netZeroReadinessScore(h);
      return { h, em, pct, intensity, nzScore, name: c.name || '', ticker: c.ticker || '' };
    });
    rows.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'attributedEmissions': av = a.em; bv = b.em; break;
        case 'intensity': av = a.intensity; bv = b.intensity; break;
        case 'nzScore': av = a.nzScore; bv = b.nzScore; break;
        case 'pct': av = a.pct; bv = b.pct; break;
        default: av = a.em; bv = b.em;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [holdings, totalEmissions, scopeMode, sortCol, sortDir]);

  /* ── Carbon intensity ranking ─────────────────────────────────────────────── */
  const intensityData = useMemo(() => {
    return holdings.map(h => {
      const c = h.company;
      const rev = c.revenue_usd_mn || 1;
      const intensity = (scopeEmissions(c, scopeMode) / rev) * 1000;
      return { name: c.ticker || c.name?.slice(0, 12) || '?', intensity: +intensity.toFixed(1), sector: c.sector || 'Unknown' };
    }).sort((a, b) => b.intensity - a.intensity).slice(0, 15);
  }, [holdings, scopeMode]);

  const avgIntensity = useMemo(() => {
    if (!intensityData.length) return 0;
    return +(intensityData.reduce((s, d) => s + d.intensity, 0) / intensityData.length).toFixed(1);
  }, [intensityData]);

  /* ── Sort handler ─────────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const sortArrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Export handlers ──────────────────────────────────────────────────────── */
  const exportCSV = () => {
    const rows = holdingRows.map(r => ({
      Company: r.h.company.name, Ticker: r.h.company.ticker, Sector: r.h.company.sector,
      'Attributed Emissions (Mt)': r.em.toFixed(6), 'Intensity (tCO2e/USDMn)': r.intensity.toFixed(1),
      'NZ Target Year': r.h.company.carbon_neutral_target_year || '', 'NZ Readiness Score': r.nzScore,
      'On Track': r.h.company.carbon_neutral_target_year && r.h.company.carbon_neutral_target_year <= 2050 ? 'Yes' : 'No',
      'Portfolio %': r.pct.toFixed(2),
    }));
    downloadCSV('carbon_budget_holdings.csv', rows);
  };

  const exportGlidePath = () => downloadJSON('glide_path_data.json', { pathway: pw.label, rate: pw.rate, scopeMode, data: glidePathData });

  /* ── Empty state ──────────────────────────────────────────────────────────── */
  const emptyState = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 56 }}>{'\uD83C\uDF21\uFE0F'}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>No Portfolio Loaded</div>
      <div style={{ fontSize: 14, color: T.textSec, maxWidth: 380 }}>Select or create a portfolio in the Portfolio Manager to track your carbon budget pathway.</div>
      <button onClick={() => navigate('/portfolio-manager')} style={{ marginTop: 8, padding: '12px 28px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Go to Portfolio Manager</button>
    </div>
  );

  /* ── Sortable header helper ───────────────────────────────────────────────── */
  const TH = ({ col, label, align }) => (
    <th onClick={() => handleSort(col)} style={{
      textAlign: align || 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700,
      color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em',
      borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none',
      background: sortCol === col ? T.surfaceH : 'transparent',
    }}>
      {label}{sortArrow(col)}
    </th>
  );

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                    */
  /* ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '32px 40px', fontFamily: T.font }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>EP-G3 · Carbon Budget & Pathway Tracker</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.navy }}>Carbon Budget & Pathway Tracker</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
          Portfolio emissions trajectory vs SBTi glide paths · 2020-2050
        </div>
        {activePortfolio && (
          <div style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 20, fontSize: 12, color: T.textSec, fontWeight: 600 }}>
            Portfolio: {activePortfolio}
          </div>
        )}
      </div>

      {!portfolio || holdings.length === 0 ? emptyState : (
        <>
          {/* ── Controls: Pathway + Scope + Exports ─────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, marginBottom: 24 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>SBTi Glide Path</div>
              <ChipToggle options={PATHWAYS} value={pathway} onChange={setPathway} />
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>{pw.desc}</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Emission Scope</div>
              <ChipToggle options={SCOPE_MODES} value={scopeMode} onChange={setScopeMode} />
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>{SCOPE_MODES[scopeMode].desc}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Export Carbon Budget CSV', fn: exportCSV },
                { label: 'Export Glide Path JSON', fn: exportGlidePath },
                { label: 'Print Carbon Budget', fn: () => window.print() },
              ].map(btn => (
                <button key={btn.label} onClick={btn.fn} style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.surface, color: T.navy, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{btn.label}</button>
              ))}
            </div>
          </div>

          {/* ── Cross-Module Navigation ─────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'View Scenario Stress Test \u2192', path: '/scenario-stress-test' },
              { label: 'Optimize Portfolio \u2192', path: '/portfolio-optimizer' },
            ].map(link => (
              <button key={link.path} onClick={() => navigate(link.path)} style={{
                padding: '8px 18px', borderRadius: 8, border: `1px solid ${T.gold}44`,
                background: `${T.gold}12`, color: T.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>{link.label}</button>
            ))}
          </div>

          {/* ── KPI Row ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            <KpiCard icon="\uD83C\uDFED" label="Current Portfolio Emissions" value={totalEmissions < 0.0001 ? '<0.0001' : totalEmissions.toFixed(4)} sub={`Mt CO\u2082e / yr (${SCOPE_MODES[scopeMode].label})`} />
            <KpiCard icon="\uD83D\uDCE6" label={`${pw.label} Budget Remaining`} value={`${budget2025Remaining.toFixed(3)} Mt`} valueColor={T.sage} sub="Portfolio share from 2025 (est.)" />
            <KpiCard icon="\uD83D\uDCC9" label="Required Reduction by 2030" value={`\u2212${requiredReduction}%`} valueColor="#d97706" sub={`${pw.label} pathway from 2020 baseline`} />
            <KpiCard icon="\uD83C\uDFAF" label="Net Zero Year" value={netZeroYear ? Math.round(netZeroYear).toString() : 'N/A'} valueColor={netZeroYear && netZeroYear <= 2050 ? T.sage : netZeroYear ? '#d97706' : '#dc2626'} sub={netZeroYear ? 'Weighted avg of holdings targets' : 'No net-zero targets set'} />
          </div>

          {/* ── Glide Path Chart ────────────────────────────────────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Emissions Glide Path — Portfolio vs {pw.label} Pathway</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 20 }}>
              Portfolio trajectory assumes 3.8%/yr reduction · {pw.label} budget path declines at {(pw.rate * 100).toFixed(1)}%/yr · Mt CO\u2082e · {SCOPE_MODES[scopeMode].label}
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={glidePathData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pw.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={pw.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(3)}Mt`} width={72} />
                <Tooltip content={<GlidePathTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="square" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                <Area type="monotone" dataKey="portfolio" name="Portfolio Trajectory" stroke="#f97316" strokeWidth={2.5} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
                <Area type="monotone" dataKey="budget" name={`${pw.label} Budget Path`} stroke={pw.color} strokeWidth={2.5} fill="url(#budgetGrad)" dot={false} activeDot={{ r: 4, fill: pw.color }} strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 12, color: '#9a3412' }}>
                <strong>2030 gap:</strong> {gap2030.toFixed(5)} Mt CO\u2082e above {pw.label} path
              </div>
              <div style={{ padding: '8px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#166534' }}>
                <strong>Net zero target:</strong> {netZeroYear ? Math.round(netZeroYear) : 'Not set'} (weighted portfolio avg)
              </div>
              <div style={{ padding: '8px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
                <strong>SBTi standard:</strong> {requiredReduction}% absolute reduction by 2030 vs 2020 baseline
              </div>
            </div>
          </div>

          {/* ── Holding-Level Carbon Budget Table (Sortable) ─────────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Holding-Level Carbon Budget</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>
              Attributed emissions, net-zero alignment & readiness per holding · click headers to sort
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                  <tr>
                    <TH col="name" label="Company" />
                    <TH col="attributedEmissions" label="Attributed Emissions (Mt)" align="right" />
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${T.border}` }}>Net Zero Target</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${T.border}` }}>Status</th>
                    <TH col="nzScore" label="NZ Readiness" align="center" />
                    <TH col="pct" label="% of Portfolio" align="right" />
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${T.border}` }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingRows.map(({ h, em, pct, nzScore }) => {
                    const status = trackStatus(h);
                    const scoreColor = nzScore >= 70 ? T.green : nzScore >= 40 ? T.amber : T.red;
                    return (
                      <tr key={h.id} style={{ background: T.surface }}>
                        <td style={{ padding: '10px 12px', borderLeft: `3px solid ${status.border}`, borderRadius: '6px 0 0 6px', fontSize: 13, fontWeight: 600, color: T.navy }}>
                          <div>{h.company.name}</div>
                          <div style={{ fontSize: 11, color: T.textMut, fontWeight: 400 }}>{h.company.ticker} · {h.company.sector || 'Unknown'}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: T.navy, textAlign: 'right' }}>
                          {em < 0.000001 ? '<0.000001' : em.toFixed(6)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: T.textSec }}>{h.company.carbon_neutral_target_year || '\u2014'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <div style={{ width: 60, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${nzScore}%`, height: '100%', background: scoreColor, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{nzScore}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 4, overflow: 'hidden', minWidth: 50, maxWidth: 80 }}>
                              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct > 30 ? '#dc2626' : pct > 15 ? '#d97706' : T.sage, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, minWidth: 36, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button onClick={() => navigate(`/holdings-deep-dive?ticker=${h.company.ticker}`)} style={{
                            padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
                            background: T.surface, color: T.navyL, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}>Deep-Dive \u2192</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Carbon Intensity Ranking (Horizontal BarChart) ──────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Carbon Intensity Ranking</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>
              GHG intensity (t CO\u2082e / USD Mn revenue) · Red line = portfolio average ({avgIntensity})
            </div>
            {intensityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(260, intensityData.length * 30)}>
                <BarChart data={intensityData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={80} />
                  <Tooltip content={<IntensityTooltip />} />
                  <ReferenceLine x={avgIntensity} stroke={T.red} strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Avg', position: 'top', fontSize: 10, fill: T.red }} />
                  <Bar dataKey="intensity" name="GHG Intensity" fill={T.navy} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No intensity data available</div>
            )}
          </div>

          {/* ── Annual Reduction Targets Table ──────────────────────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Annual Reduction Targets ({pw.label} Pathway)</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Year-by-year carbon budget and required reductions to stay on the {pw.label} path</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Year', 'Budget (Mt)', 'Required Reduction (Mt)', 'Cumulative Reduction %'].map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: col === 'Year' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {annualTargets.map((r, i) => (
                  <tr key={r.year} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : '#faf9f7' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.year}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.navy }}>{r.budget.toFixed(5)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.amber }}>\u2212{r.reduction.toFixed(5)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: r.cumReduction > 30 ? '#fef2f2' : '#f0fdf4',
                        color: r.cumReduction > 30 ? T.red : T.green,
                      }}>{r.cumReduction}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Sector Emissions Breakdown ──────────────────────────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Sector Emissions Breakdown</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Total attributed emissions by sector (Mt CO\u2082e) · {SCOPE_MODES[scopeMode].label}</div>
            {sectorEmissions.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorEmissions} margin={{ top: 4, right: 20, bottom: 24, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(4)}Mt`} width={72} />
                  <Tooltip content={<SectorTooltip />} />
                  <Bar dataKey="value" name="Emissions" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No sector data available</div>
            )}
          </div>

          {/* ── Carbon Offset Gap ──────────────────────────────────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Carbon Offset Gap Analysis — 2030</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 20 }}>How much of the portfolio trajectory excess vs the {pw.label} path could be bridged by carbon offsets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: '18px 20px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Portfolio Emissions 2030</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#c2410c' }}>{glidePathData.find(d => d.year === 2030)?.portfolio.toFixed(5)} Mt</div>
                <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>At assumed 3.8%/yr reduction rate</div>
              </div>
              <div style={{ padding: '18px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{pw.label} Path Budget 2030</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d' }}>{glidePathData.find(d => d.year === 2030)?.budget.toFixed(5)} Mt</div>
                <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>At SBTi {(pw.rate * 100).toFixed(1)}%/yr decline from 2020</div>
              </div>
              <div style={{ padding: '18px 20px', background: gap2030 > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${gap2030 > 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, color: gap2030 > 0 ? '#991b1b' : '#166534' }}>Offset Gap Required</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: gap2030 > 0 ? '#dc2626' : '#15803d' }}>
                  {gap2030 > 0 ? `${gap2030.toFixed(5)} Mt` : 'On Track \u2713'}
                </div>
                <div style={{ fontSize: 12, color: gap2030 > 0 ? '#991b1b' : '#166534', marginTop: 4 }}>
                  {gap2030 > 0 ? 'Carbon credits needed to bridge trajectory to path by 2030' : `Portfolio trajectory is within the ${pw.label} glide path`}
                </div>
              </div>
            </div>
            {gap2030 > 0 && (
              <div style={{ marginTop: 16, padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                <strong>Action required:</strong> The portfolio's 2030 emissions trajectory exceeds the {pw.label} budget path by <strong>{gap2030.toFixed(5)} Mt CO\u2082e</strong>. To close this gap, consider high-quality carbon removal credits (BECCS, DACS) or accelerated engagement with high-emitting holdings to strengthen decarbonisation commitments. Target holdings without SBTi commitments first for highest marginal impact.
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div style={{ marginTop: 24, padding: '12px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.textMut }}>AA Impact Risk Analytics Platform — EP-G3 Carbon Budget & Pathway Tracker</span>
            <span style={{ fontSize: 11, color: T.textMut }}>Pathway: {pw.label} · Scope: {SCOPE_MODES[scopeMode].label}</span>
          </div>
        </>
      )}
    </div>
  );
}
