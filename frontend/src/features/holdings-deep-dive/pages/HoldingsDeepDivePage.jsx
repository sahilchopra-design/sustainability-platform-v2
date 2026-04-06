import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, AreaChart, Area, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CHART_COLORS = ['#1b3a5c', '#c5a96a', '#5a8a6a', '#3b82f6', '#f97316', '#ec4899'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n, dec = 2) {
  if (n === null || n === undefined || isNaN(n)) return '\u2014';
  return Number(n).toFixed(dec);
}

function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '\u2014';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function ghgIntensity(h) {
  const s1 = h.company?.scope1_mt || 0;
  const s2 = h.company?.scope2_mt || 0;
  const rev = h.company?.revenue_usd_mn || 0;
  if (rev === 0) return null;
  return ((s1 + s2) * 1e6) / rev;
}

function tempBucket(intensity) {
  if (intensity === null || intensity === undefined) return '\u2014';
  if (intensity < 50) return '< 1.5\u00B0C aligned';
  if (intensity < 150) return '1.5\u20132\u00B0C';
  if (intensity < 400) return '2\u20133\u00B0C';
  if (intensity < 800) return '3\u20134\u00B0C';
  return '4\u00B0C+';
}

function tempBucketColor(intensity) {
  if (intensity === null || intensity === undefined) return T.textMut;
  if (intensity < 50) return T.green;
  if (intensity < 150) return '#3b82f6';
  if (intensity < 400) return T.amber;
  if (intensity < 800) return T.red;
  return '#7f1d1d';
}

// ─── Enrich from master ──────────────────────────────────────────────────────
function enrichHolding(h) {
  const master = GLOBAL_COMPANY_MASTER.find(c => c.ticker === h.company?.ticker);
  if (!master) return h;
  return { ...h, company: { ...h.company, ...master, ...h.company } };
}

// ─── Export helpers ──────────────────────────────────────────────────────────
function downloadCSV(filename, headers, rows) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.fill || p.color || p.stroke, fontSize: 12, marginBottom: 2 }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span> {typeof p.value === 'number' ? fmt(p.value, 1) : p.value}
        </div>
      ))}
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max = 100, color, note }) {
  const pct = Math.min(100, Math.max(0, ((value || 0) / max) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: color || T.navy, fontWeight: 700 }}>
          {value !== null && value !== undefined ? fmt(value, 0) : '\u2014'}{max === 100 ? '/100' : ''}
          {note && <span style={{ color: T.textMut, fontWeight: 400, marginLeft: 4 }}>{note}</span>}
        </span>
      </div>
      <div style={{ background: '#eef1f5', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ background: color || T.navy, width: `${pct}%`, height: '100%', borderRadius: 6, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ─── Engagement Tag ──────────────────────────────────────────────────────────
function EngagementTag({ color, text, priority }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 8, marginBottom: 8 }}>
      {priority && <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{priority}</span>}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
      <span style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{text}</span>
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

// ─── Data Completeness Field ─────────────────────────────────────────────────
function DataField({ label, value, available }) {
  const icon = available === true ? '\u2705' : available === false ? '\u274C' : '\u26A0\uFE0F';
  const color = available === true ? T.green : available === false ? T.red : T.amber;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: T.bg, borderRadius: 6, fontSize: 12 }}>
      <span>{icon}</span>
      <span style={{ color: T.textSec, fontWeight: 600, minWidth: 90 }}>{label}:</span>
      <span style={{ fontWeight: 700, color: available === false ? T.textMut : T.navy }}>{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
function HoldingsDeepDivePage() {
  const navigate = useNavigate();

  // ── Portfolio ────────────────────────────────────────────────────────────
  const holdings = useMemo(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      const { portfolios, activePortfolio } = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
      return (portfolios?.[activePortfolio]?.holdings || []).map(enrichHolding);
    } catch { return []; }
  }, []);

  // ── State ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortKey, setSortKey] = useState('weight');
  const [sortDir, setSortDir] = useState('desc');

  // ── Sector averages from master data ─────────────────────────────────────
  const sectorAverages = useMemo(() => {
    const map = {};
    GLOBAL_COMPANY_MASTER.forEach(c => {
      const sec = c.sector; if (!sec) return;
      if (!map[sec]) map[sec] = { ghgSum: 0, esgSum: 0, triskSum: 0, count: 0 };
      const gi = c.revenue_usd_mn > 0 ? ((c.scope1_mt || 0) + (c.scope2_mt || 0)) * 1e6 / c.revenue_usd_mn : 0;
      map[sec].ghgSum += gi;
      map[sec].esgSum += c.esg_score || 0;
      map[sec].triskSum += c.transition_risk_score || 0;
      map[sec].count += 1;
    });
    const result = {};
    Object.entries(map).forEach(([sec, v]) => {
      result[sec] = { ghg: v.count ? v.ghgSum / v.count : 0, esg: v.count ? v.esgSum / v.count : 0, trisk: v.count ? v.triskSum / v.count : 0 };
    });
    return result;
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = holdings.filter(h => !q || (h.company?.name || '').toLowerCase().includes(q) || (h.company?.ticker || '').toLowerCase().includes(q) || (h.company?.sector || '').toLowerCase().includes(q));
    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (sortKey) {
        case 'name': { const av = (a.company?.name || '').toLowerCase(), bv = (b.company?.name || '').toLowerCase(); return av < bv ? -dir : av > bv ? dir : 0; }
        case 'esg': return ((a.company?.esg_score || 0) - (b.company?.esg_score || 0)) * dir;
        case 'ghg': return ((ghgIntensity(a) || 0) - (ghgIntensity(b) || 0)) * dir;
        case 'trisk': return ((a.company?.transition_risk_score || 0) - (b.company?.transition_risk_score || 0)) * dir;
        case 'weight': default: return ((a.weight || 0) - (b.weight || 0)) * dir;
      }
    });
    return result;
  }, [holdings, search, sortKey, sortDir]);

  const selectedHoldings = useMemo(
    () => selectedIds.map(id => holdings.find(h => (h.id || h.company?.ticker) === id)).filter(Boolean),
    [selectedIds, holdings]
  );

  function toggleHolding(id) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [prev[1], prev[2], id];
      return [...prev, id];
    });
  }

  // ── Portfolio totals ────────────────────────────────────────────────────
  const portfolioTotalScope1 = useMemo(() => holdings.reduce((s, h) => s + (h.company?.scope1_mt || 0), 0), [holdings]);
  const portfolioTotalScope2 = useMemo(() => holdings.reduce((s, h) => s + (h.company?.scope2_mt || 0), 0), [holdings]);
  const portfolioTotalScope12 = portfolioTotalScope1 + portfolioTotalScope2;
  const portfolioWACI = useMemo(() => holdings.reduce((s, h) => { const gi = ghgIntensity(h); return s + (gi !== null ? (h.weight || 0) / 100 * gi : 0); }, 0), [holdings]);

  // ── Sort handler for left panel ──────────────────────────────────────────
  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  // ── Export functions ─────────────────────────────────────────────────────
  function exportHoldingCSV(h) {
    const c = h.company || {};
    const gi = ghgIntensity(h);
    const headers = ['Field', 'Value'];
    const rows = [
      ['Ticker', c.ticker], ['Name', c.name], ['Sector', c.sector], ['Exchange', c.exchange],
      ['Weight %', h.weight], ['Exposure USD Mn', h.exposure_usd_mn], ['ESG Score', c.esg_score],
      ['Scope 1 Mt', c.scope1_mt], ['Scope 2 Mt', c.scope2_mt], ['GHG Intensity', gi],
      ['Transition Risk', c.transition_risk_score], ['SBTi', c.sbti_committed ? 'Yes' : 'No'],
      ['Net Zero Year', c.carbon_neutral_target_year], ['Revenue USD Mn', c.revenue_usd_mn],
      ['Market Cap USD Mn', c.market_cap_usd_mn], ['EVIC USD Mn', c.evic_usd_mn],
    ];
    downloadCSV(`holding_${c.ticker || 'profile'}.csv`, headers, rows);
  }

  function exportComparisonCSV() {
    const headers = ['Ticker', 'Name', 'Sector', 'Weight%', 'ESG Score', 'GHG Intensity', 'T-Risk', 'SBTi', 'NZ Year', 'Scope1 Mt', 'Scope2 Mt'];
    const rows = selectedHoldings.map(h => {
      const c = h.company || {}; const gi = ghgIntensity(h);
      return [c.ticker, c.name, c.sector, h.weight, c.esg_score, gi !== null ? fmt(gi, 1) : '', c.transition_risk_score, c.sbti_committed ? 'Yes' : 'No', c.carbon_neutral_target_year, c.scope1_mt, c.scope2_mt];
    });
    downloadCSV('holdings_comparison.csv', headers, rows);
  }

  function exportAllHoldingsCSV() {
    const headers = ['Ticker', 'Name', 'Sector', 'Exchange', 'Weight%', 'Exposure USD Mn', 'ESG Score', 'GHG Intensity', 'T-Risk', 'SBTi', 'NZ Year'];
    const rows = holdings.map(h => {
      const c = h.company || {}; const gi = ghgIntensity(h);
      return [c.ticker, c.name, c.sector, c.exchange, h.weight, h.exposure_usd_mn, c.esg_score, gi !== null ? fmt(gi, 1) : '', c.transition_risk_score, c.sbti_committed ? 'Yes' : 'No', c.carbon_neutral_target_year];
    });
    downloadCSV('all_holdings_summary.csv', headers, rows);
  }

  // ── Engagement engine ────────────────────────────────────────────────────
  function getEngagementSuggestions(h) {
    const c = h.company || {};
    const gi = ghgIntensity(h);
    const dq = c.data_quality_score ?? 65;
    const suggestions = [];
    if (gi !== null && gi > 500 && !c.sbti_committed)
      suggestions.push({ priority: 'P1', color: T.red, text: 'URGENT: High emitter without science-based target \u2014 priority 1 engagement' });
    else if (gi !== null && gi > 500)
      suggestions.push({ priority: 'P2', color: T.amber, text: 'High carbon intensity \u2014 engage on decarbonisation pathway and interim targets' });
    if ((c.transition_risk_score || 0) > 70 && (c.sector === 'Energy' || c.sector === 'Utilities'))
      suggestions.push({ priority: 'P1', color: T.red, text: 'ESCALATE: High transition risk in carbon-intensive sector \u2014 board-level engagement' });
    else if ((c.transition_risk_score || 0) > 70)
      suggestions.push({ priority: 'P2', color: T.amber, text: 'High transition risk \u2014 assess exposure concentration and hedge strategy' });
    if ((c.esg_score || 100) < 40)
      suggestions.push({ priority: 'P2', color: T.amber, text: 'MONITOR: Below-threshold ESG score \u2014 quarterly review cycle recommended' });
    if (!c.carbon_neutral_target_year || c.carbon_neutral_target_year > 2055)
      suggestions.push({ priority: 'P2', color: T.amber, text: 'ENGAGE: Net zero target absent or beyond 2050 \u2014 request transition plan with milestones' });
    if (!c.sbti_committed && !(gi !== null && gi > 500))
      suggestions.push({ priority: 'P3', color: '#6366f1', text: 'No SBTi commitment \u2014 encourage science-based target setting' });
    if (dq < 40)
      suggestions.push({ priority: 'P3', color: '#6366f1', text: 'DATA GAP: Request enhanced ESG disclosure from issuer \u2014 low data quality score' });
    if (suggestions.length === 0)
      suggestions.push({ color: T.green, text: 'No critical engagement flags \u2014 continue monitoring' });
    return suggestions;
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
              <div style={{ background: T.gold, color: T.navy, borderRadius: 6, padding: '4px 12px', fontWeight: 800, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' }}>EP-G4</div>
              <span style={{ background: 'rgba(255,255,255,0.12)', color: '#a8bfce', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>Company-Level &middot; PCAF Attribution &middot; ESG Intelligence</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: -0.5 }}>
              Holdings Deep-Dive Analyzer
            </h1>
            <p style={{ margin: '6px 0 0', color: '#a8bfce', fontSize: 13 }}>
              Detailed per-holding ESG and climate analysis &middot; Compare up to 3 holdings
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <NavLink to="/scenario-stress-test">Run Stress Test &rarr;</NavLink>
              <NavLink to="/sector-benchmarking">Sector Benchmarking &rarr;</NavLink>
              <NavLink to="/controversies-monitor">Controversies &rarr;</NavLink>
              <NavLink to="/sentiment-tracker">Sentiment &rarr;</NavLink>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#a8bfce', fontSize: 12, marginBottom: 4 }}>Holdings</div>
            <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>{holdings.length}</div>
            {selectedHoldings.length > 0 && (
              <div style={{ color: T.gold, fontSize: 12, marginTop: 4 }}>{selectedHoldings.length} selected</div>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Btn onClick={exportAllHoldingsCSV} variant="gold" style={{ fontSize: 11, padding: '5px 10px' }}>Export All CSV</Btn>
              {selectedHoldings.length >= 2 && (
                <Btn onClick={exportComparisonCSV} variant="outline" style={{ fontSize: 11, padding: '5px 10px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Export Comparison</Btn>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {holdings.length === 0 && (
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '60px 40px', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>&#128269;</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
            <div style={{ color: T.textSec, fontSize: 14, marginBottom: 16 }}>Load a portfolio via the Portfolio Manager to analyse individual holdings.</div>
            <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
          </div>
        </div>
      )}

      {holdings.length > 0 && (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 160px)' }}>

          {/* ── LEFT PANEL: Search, Sort & List ── */}
          <div style={{ width: 310, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column' }}>
            {/* Search */}
            <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMut, fontSize: 14 }}>&#8981;</span>
                <input type="text" placeholder="Search holdings\u2026" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 28px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box', fontFamily: T.font }} />
              </div>
              {selectedHoldings.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selectedHoldings.map(h => (
                    <span key={h.id || h.company?.ticker} onClick={() => toggleHolding(h.id || h.company?.ticker)} style={{ background: T.navy, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      {h.company?.ticker} &times;
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sort + Count */}
            <div style={{ padding: '8px 16px', background: '#f8f7f4', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.textMut }}>{filtered.length} holding{filtered.length !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'weight', label: 'Wt' },
                  { key: 'name', label: 'Name' },
                  { key: 'esg', label: 'ESG' },
                  { key: 'ghg', label: 'GHG' },
                  { key: 'trisk', label: 'T-Risk' },
                ].map(s => (
                  <span key={s.key} onClick={() => handleSort(s.key)} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: sortKey === s.key ? 800 : 500, background: sortKey === s.key ? T.navy : 'transparent', color: sortKey === s.key ? '#fff' : T.textMut }}>
                    {s.label}{sortKey === s.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(h => {
                const hid = h.id || h.company?.ticker;
                const isSelected = selectedIds.includes(hid);
                const gi = ghgIntensity(h);
                return (
                  <div key={hid} onClick={() => toggleHolding(hid)} style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: isSelected ? '#f0f7ff' : T.surface, borderLeft: isSelected ? `3px solid ${T.navy}` : '3px solid transparent', transition: 'background 0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{h.company?.ticker || '\u2014'}</div>
                        <div style={{ fontSize: 12, color: T.textSec, marginTop: 2, lineHeight: 1.3 }}>{h.company?.name || '\u2014'}</div>
                        <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>{h.company?.sector || '\u2014'}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{fmt(h.weight, 1)}%</div>
                        {h.company?.esg_score && <div style={{ fontSize: 10, color: T.sage, marginTop: 2 }}>ESG {fmt(h.company.esg_score, 0)}</div>}
                        {gi !== null && <div style={{ fontSize: 10, color: tempBucketColor(gi), marginTop: 1, fontWeight: 600 }}>{tempBucket(gi)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT PANEL: Detail / Comparison ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

            {/* Nothing selected */}
            {selectedHoldings.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
                <div style={{ textAlign: 'center', color: T.textMut }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>&larr;</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.textSec, marginBottom: 6 }}>Select a holding to view details</div>
                  <div style={{ fontSize: 13 }}>Select up to 3 holdings for side-by-side comparison</div>
                </div>
              </div>
            )}

            {/* ── SINGLE HOLDING DETAIL ── */}
            {selectedHoldings.length === 1 && (() => {
              const h = selectedHoldings[0];
              const c = h.company || {};
              const gi = ghgIntensity(h);
              const af = c.evic_usd_mn ? (h.exposure_usd_mn || 0) / c.evic_usd_mn : null;
              const attrScope1 = af !== null ? af * (c.scope1_mt || 0) : null;
              const attrScope2 = af !== null ? af * (c.scope2_mt || 0) : null;
              const attrScope12 = af !== null ? af * ((c.scope1_mt || 0) + (c.scope2_mt || 0)) : null;
              const waciContrib = gi !== null ? (h.weight || 0) / 100 * gi : null;
              const pctScope12 = portfolioTotalScope12 > 0 ? (((c.scope1_mt || 0) + (c.scope2_mt || 0)) / portfolioTotalScope12) * 100 : null;
              const pctWACI = portfolioWACI > 0 && waciContrib !== null ? (waciContrib / portfolioWACI) * 100 : null;

              // ESG sub-scores (estimate if not available)
              const esgScore = c.esg_score || 50;
              const envScore = c.env_score ?? Math.round(esgScore * 0.9 + (sr(esgScore) * 2 - 1) * 5);
              const socScore = c.soc_score ?? Math.round(esgScore * 1.05 + (sr(esgScore + 500) * 2 - 1) * 3);
              const govScore = c.gov_score ?? Math.round(esgScore * 1.1 - (sr(esgScore * 5) * 2 - 1) * 4);
              const esgSubData = [
                { name: 'Environmental', score: Math.max(0, Math.min(100, envScore)), color: T.sage },
                { name: 'Social', score: Math.max(0, Math.min(100, socScore)), color: '#3b82f6' },
                { name: 'Governance', score: Math.max(0, Math.min(100, govScore)), color: T.gold },
              ];

              // Peer comparison data
              const sectorAvg = sectorAverages[c.sector] || { ghg: 0, esg: 0, trisk: 0 };
              const peerData = [
                { metric: 'GHG Intensity', holding: gi || 0, sectorAvg: sectorAvg.ghg },
                { metric: 'ESG Score', holding: c.esg_score || 0, sectorAvg: sectorAvg.esg },
                { metric: 'T-Risk Score', holding: c.transition_risk_score || 0, sectorAvg: sectorAvg.trisk },
              ];

              // PCAF attribution pie
              const pcafData = [];
              if (attrScope1 !== null && portfolioTotalScope1 > 0) pcafData.push({ name: 'Scope 1 Contrib', value: Math.round((attrScope1 / portfolioTotalScope1) * 10000) / 100 });
              if (attrScope2 !== null && portfolioTotalScope2 > 0) pcafData.push({ name: 'Scope 2 Contrib', value: Math.round((attrScope2 / portfolioTotalScope2) * 10000) / 100 });
              if (pctWACI !== null) pcafData.push({ name: 'WACI Contrib', value: Math.round(pctWACI * 100) / 100 });
              if (pcafData.length === 0) pcafData.push({ name: 'No Data', value: 100 });

              // ESG trend (simulated)
              const esgTrend = Array.from({ length: 12 }, (_, i) => ({
                month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
                score: Math.max(0, Math.min(100, (esgScore || 50) + ((sr(i * 5) * 2 - 1) * 3) + (i * 0.2))),
              }));

              const suggestions = getEngagementSuggestions(h);

              // Data completeness
              const dataFields = [
                { label: 'ESG Score', value: c.esg_score ? fmt(c.esg_score, 0) : 'N/A', available: c.esg_score != null },
                { label: 'Scope 1', value: c.scope1_mt ? `${fmt(c.scope1_mt, 3)} Mt` : 'N/A', available: c.scope1_mt != null },
                { label: 'Scope 2', value: c.scope2_mt ? `${fmt(c.scope2_mt, 3)} Mt` : 'N/A', available: c.scope2_mt != null },
                { label: 'Scope 3', value: c.scope3_mt ? `${fmt(c.scope3_mt, 3)} Mt` : 'N/A', available: c.scope3_mt != null ? true : false },
                { label: 'SBTi', value: c.sbti_committed ? 'Yes' : c.sbti_committed === false ? 'No' : 'N/A', available: c.sbti_committed != null },
                { label: 'T-Risk', value: c.transition_risk_score ? fmt(c.transition_risk_score, 0) : 'N/A', available: c.transition_risk_score != null },
                { label: 'Phys. Risk', value: c.physical_risk_score ? fmt(c.physical_risk_score, 0) : 'Estimated', available: c.physical_risk_score != null ? true : 'estimated' },
                { label: 'NZ Year', value: c.carbon_neutral_target_year ? String(c.carbon_neutral_target_year) : 'N/A', available: c.carbon_neutral_target_year != null },
              ];

              return (
                <div>
                  {/* ── Identity Card ── */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 20, borderTop: `3px solid ${T.navy}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ background: T.navy, color: '#fff', borderRadius: 6, padding: '3px 10px', fontWeight: 800, fontSize: 13 }}>{c.ticker || '\u2014'}</span>
                          <span style={{ background: '#eef2f7', color: T.textSec, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{c.exchange || '\u2014'}</span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.navy }}>{c.name || '\u2014'}</h2>
                        <div style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>{c.sector || '\u2014'}</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                          <NavLink to={`/sector-benchmarking`}>Sector Benchmarking &rarr;</NavLink>
                          <NavLink to="/scenario-stress-test">Stress Test &rarr;</NavLink>
                          <NavLink to="/controversies-monitor">Controversies &rarr;</NavLink>
                          <NavLink to="/sentiment-tracker">Sentiment &rarr;</NavLink>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Weight', value: `${fmt(h.weight, 2)}%` },
                          { label: 'Exposure', value: `USD ${fmt(h.exposure_usd_mn)} Mn` },
                          { label: 'PCAF AF', value: af !== null ? fmt(af, 4) : '\u2014' },
                        ].map(m => (
                          <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
                            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>{m.label}</div>
                            <div style={{ fontWeight: 800, color: T.navy, fontSize: 14 }}>{m.value}</div>
                          </div>
                        ))}
                        <Btn onClick={() => exportHoldingCSV(h)} variant="outline" style={{ alignSelf: 'center', fontSize: 11 }}>Export CSV</Btn>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* ── Climate Profile ── */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>Climate Profile</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Scope 1', value: `${fmt(c.scope1_mt, 3)} Mt CO\u2082e` },
                          { label: 'Scope 2', value: `${fmt(c.scope2_mt, 3)} Mt CO\u2082e` },
                          { label: 'GHG Intensity', value: gi !== null ? `${fmt(gi, 1)} tCO\u2082e/USD Mn` : '\u2014' },
                          { label: 'Attributed S1+2', value: attrScope12 !== null ? `${fmt(attrScope12, 4)} Mt` : '\u2014' },
                          { label: 'WACI Contribution', value: waciContrib !== null ? `${fmt(waciContrib, 2)} tCO\u2082e/Mn` : '\u2014' },
                          { label: 'Net Zero Year', value: c.carbon_neutral_target_year ? String(c.carbon_neutral_target_year) : '\u2014' },
                        ].map(m => (
                          <div key={m.label} style={{ background: T.bg, borderRadius: 7, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                            <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: T.textSec }}>SBTi:</span>
                        <span style={{ background: c.sbti_committed ? '#d1fae5' : '#fee2e2', color: c.sbti_committed ? '#065f46' : '#991b1b', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                          {c.sbti_committed ? 'Committed' : 'Not Committed'}
                        </span>
                      </div>
                    </div>

                    {/* ── ESG Scores ── */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>ESG Scores</h3>
                      <ProgressBar label="ESG Score" value={c.esg_score} max={100} color={T.sage} />
                      <ProgressBar label="Transition Risk" value={c.transition_risk_score} max={100} color={(c.transition_risk_score || 0) > 70 ? T.red : T.amber} note={(c.transition_risk_score || 0) > 70 ? 'High' : ''} />
                      <ProgressBar label="Data Quality" value={c.data_quality_score ?? 65} max={100} color={T.navy} />
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Implied Temperature</div>
                        <div style={{ display: 'inline-block', background: `${tempBucketColor(gi)}18`, border: `1px solid ${tempBucketColor(gi)}44`, color: tempBucketColor(gi), borderRadius: 20, padding: '4px 14px', fontWeight: 800, fontSize: 14 }}>
                          {tempBucket(gi)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── CHARTS ROW: ESG Sub-Scores + Peer Comparison + PCAF ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* ESG Sub-Score BarChart */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
                      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>ESG Sub-Scores</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={esgSubData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: T.textSec, fontSize: 10 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {esgSubData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Peer Comparison BarChart */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
                      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>vs Sector Avg</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={peerData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                          <XAxis dataKey="metric" tick={{ fill: T.textSec, fontSize: 9 }} />
                          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="holding" name={c.ticker || 'Holding'} fill={T.navy} radius={[3, 3, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="sectorAvg" name="Sector Avg" fill={T.goldL} radius={[3, 3, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* PCAF Attribution Pie */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
                      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>PCAF Attribution</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pcafData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${fmt(value, 1)}%`} labelLine={false} style={{ fontSize: 9 }}>
                            {pcafData.map((d, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* ── ESG Trend (12-month simulated) ── */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>ESG Score Trend (12-Month)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={esgTrend} margin={{ top: 4, right: 12, left: -10, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: T.textSec, fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: T.textSec, fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="score" name="ESG Score" stroke={T.sage} fill={`${T.sage}22`} strokeWidth={2} dot={{ r: 2, fill: T.sage }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 6, fontStyle: 'italic' }}>Simulated trend based on current ESG score baseline</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* ── Financial Metrics ── */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>Financial Metrics</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Revenue', value: `USD ${fmtNum(c.revenue_usd_mn)} Mn` },
                          { label: 'Market Cap', value: `USD ${fmtNum(c.market_cap_usd_mn)} Mn` },
                          { label: 'EVIC', value: `USD ${fmtNum(c.evic_usd_mn)} Mn` },
                        ].map(m => (
                          <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                            <div style={{ fontWeight: 800, color: T.navy, fontSize: 14 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Portfolio Contribution ── */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>Portfolio Contribution</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                          { label: '% Scope 1+2', value: pctScope12 !== null ? `${fmt(pctScope12, 1)}%` : '\u2014', color: (pctScope12 || 0) > 20 ? T.red : T.navy },
                          { label: '% WACI', value: pctWACI !== null ? `${fmt(pctWACI, 1)}%` : '\u2014', color: (pctWACI || 0) > 20 ? T.red : T.navy },
                          { label: 'Implied Temp', value: tempBucket(gi), color: tempBucketColor(gi) },
                        ].map(m => (
                          <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.label}</div>
                            <div style={{ fontWeight: 800, color: m.color, fontSize: 14 }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Data Completeness Panel ── */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>Data Completeness</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {dataFields.map(f => <DataField key={f.label} label={f.label} value={f.value} available={f.available} />)}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>
                      {dataFields.filter(f => f.available === true).length}/{dataFields.length} fields with confirmed data &middot; {dataFields.filter(f => f.available === false).length} missing &middot; {dataFields.filter(f => f.available === 'estimated').length} estimated
                    </div>
                  </div>

                  {/* ── Engagement Suggestions ── */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 }}>Engagement Recommendations</h3>
                    {suggestions.map((s, i) => <EngagementTag key={i} priority={s.priority} color={s.color} text={s.text} />)}
                  </div>
                </div>
              );
            })()}

            {/* ── COMPARISON MODE (2-3 holdings) ── */}
            {selectedHoldings.length >= 2 && (() => {
              const metricRows = [
                { key: 'ghg', label: 'GHG Intensity (tCO\u2082e / USD Mn)', fn: h => ghgIntensity(h), fmt: v => v !== null ? fmt(v, 1) : '\u2014', lowerBetter: true },
                { key: 'esg', label: 'ESG Score (/100)', fn: h => h.company?.esg_score ?? null, fmt: v => v !== null ? fmt(v, 0) : '\u2014', lowerBetter: false },
                { key: 'trisk', label: 'Transition Risk (/100)', fn: h => h.company?.transition_risk_score ?? null, fmt: v => v !== null ? fmt(v, 0) : '\u2014', lowerBetter: true },
                { key: 'sbti', label: 'SBTi Status', fn: h => h.company?.sbti_committed ? 1 : 0, fmt: v => v === 1 ? 'Committed' : 'Not Committed', lowerBetter: false },
                { key: 'nz', label: 'Net Zero Year', fn: h => h.company?.carbon_neutral_target_year || null, fmt: v => v !== null ? String(v) : '\u2014', lowerBetter: true },
                { key: 'waci', label: 'WACI Contribution', fn: h => { const g = ghgIntensity(h); return g !== null ? (h.weight || 0) / 100 * g : null; }, fmt: v => v !== null ? fmt(v, 2) : '\u2014', lowerBetter: true },
                { key: 'weight', label: 'Weight %', fn: h => h.weight ?? null, fmt: v => v !== null ? `${fmt(v, 2)}%` : '\u2014', lowerBetter: false },
                { key: 'attr', label: 'Attributed Emissions (Mt)', fn: h => { const c = h.company || {}; const af = c.evic_usd_mn ? (h.exposure_usd_mn || 0) / c.evic_usd_mn : null; return af !== null ? af * ((c.scope1_mt || 0) + (c.scope2_mt || 0)) : null; }, fmt: v => v !== null ? fmt(v, 4) : '\u2014', lowerBetter: true },
              ];

              // Grouped BarChart data for comparison
              const compChartData = [
                { metric: 'GHG Int.', ...Object.fromEntries(selectedHoldings.map(h => [h.company?.ticker || 'N/A', ghgIntensity(h) || 0])) },
                { metric: 'ESG', ...Object.fromEntries(selectedHoldings.map(h => [h.company?.ticker || 'N/A', h.company?.esg_score || 0])) },
                { metric: 'T-Risk', ...Object.fromEntries(selectedHoldings.map(h => [h.company?.ticker || 'N/A', h.company?.transition_risk_score || 0])) },
                { metric: 'SBTi', ...Object.fromEntries(selectedHoldings.map(h => [h.company?.ticker || 'N/A', h.company?.sbti_committed ? 100 : 0])) },
                { metric: 'Data Qual.', ...Object.fromEntries(selectedHoldings.map(h => [h.company?.ticker || 'N/A', h.company?.data_quality_score ?? 65])) },
              ];

              // Radar-style progress for each holding
              const radarMetrics = ['GHG Intensity', 'ESG Score', 'T-Risk', 'SBTi', 'Data Quality'];

              return (
                <div>
                  {/* Comparison table */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.navy }}>Side-by-Side Comparison</h2>
                      <Btn onClick={exportComparisonCSV} variant="outline" style={{ fontSize: 11 }}>Export Comparison CSV</Btn>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f8f7f4' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `2px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 200 }}>Metric</th>
                            {selectedHoldings.map(h => (
                              <th key={h.id || h.company?.ticker} style={{ padding: '10px 14px', textAlign: 'center', color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.border}`, fontSize: 13 }}>
                                <div>{h.company?.ticker || '\u2014'}</div>
                                <div style={{ fontWeight: 400, fontSize: 11, color: T.textSec, marginTop: 2 }}>{h.company?.name || '\u2014'}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metricRows.map((row, ri) => {
                            const values = selectedHoldings.map(row.fn);
                            const numeric = values.filter(v => v !== null && !isNaN(v));
                            const best = numeric.length ? (row.lowerBetter ? Math.min(...numeric) : Math.max(...numeric)) : null;
                            return (
                              <tr key={row.key} style={{ background: ri % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: '10px 14px', color: T.textSec, fontWeight: 600, fontSize: 12 }}>{row.label}</td>
                                {values.map((v, vi) => {
                                  const isBest = best !== null && v === best && numeric.length > 1;
                                  return (
                                    <td key={vi} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: isBest ? 800 : 500, background: isBest ? '#d1fae5' : 'transparent', color: isBest ? '#065f46' : T.text, borderRadius: isBest ? 6 : 0 }}>
                                      {row.fmt(v)}{isBest && <span style={{ marginLeft: 6, fontSize: 11 }}>&#9733;</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Grouped BarChart Comparison */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 20 }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.navy }}>Visual Comparison</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={compChartData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                        <XAxis dataKey="metric" tick={{ fill: T.textSec, fontSize: 11 }} />
                        <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {selectedHoldings.map((h, i) => (
                          <Bar key={h.company?.ticker} dataKey={h.company?.ticker || `H${i}`} name={h.company?.ticker || `Holding ${i + 1}`} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={36} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Radar-style progress bars per holding */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedHoldings.length}, 1fr)`, gap: 16, marginBottom: 20 }}>
                    {selectedHoldings.map((h, hi) => {
                      const c = h.company || {};
                      const gi = ghgIntensity(h);
                      const ghgNorm = gi !== null ? Math.max(0, Math.min(100, 100 - (gi / 10))) : 50;
                      const esgNorm = c.esg_score || 50;
                      const triskNorm = 100 - (c.transition_risk_score || 50);
                      const sbtiNorm = c.sbti_committed ? 100 : 0;
                      const physNorm = c.physical_risk_score ? (100 - c.physical_risk_score) : 50;
                      const metrics = [
                        { label: 'GHG (inv.)', value: ghgNorm, color: T.sage },
                        { label: 'ESG', value: esgNorm, color: '#3b82f6' },
                        { label: 'T-Risk (inv.)', value: triskNorm, color: T.amber },
                        { label: 'SBTi', value: sbtiNorm, color: T.green },
                        { label: 'Phys. (inv.)', value: physNorm, color: '#6366f1' },
                      ];
                      return (
                        <div key={h.id || c.ticker} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
                          <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>{c.ticker}</div>
                          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{c.name}</div>
                          {metrics.map(m => (
                            <div key={m.label} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 11, color: T.textSec }}>{m.label}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{fmt(m.value, 0)}/100</span>
                              </div>
                              <div style={{ background: '#eef1f5', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                <div style={{ background: m.color, width: `${m.value}%`, height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Engagement for each */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedHoldings.length}, 1fr)`, gap: 16 }}>
                    {selectedHoldings.map(h => {
                      const suggestions = getEngagementSuggestions(h);
                      return (
                        <div key={h.id || h.company?.ticker} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
                          <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>{h.company?.ticker} &mdash; Engagement</div>
                          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{h.company?.name}</div>
                          {suggestions.map((s, si) => <EngagementTag key={si} priority={s.priority} color={s.color} text={s.text} />)}
                          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <NavLink to="/sector-benchmarking">Benchmarking &rarr;</NavLink>
                            <NavLink to="/scenario-stress-test">Stress Test &rarr;</NavLink>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}

export default HoldingsDeepDivePage;
