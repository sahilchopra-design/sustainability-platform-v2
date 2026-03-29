import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899'];

/* ══════════════════════════════════════════════════════════════
   NATURE SCENARIOS — NGFS-aligned
   ══════════════════════════════════════════════════════════════ */
const NATURE_SCENARIOS = [
  {
    id: 'business_as_usual', name: 'Business as Usual — Continued Degradation', color: '#dc2626',
    description: 'No additional policy action. Biodiversity loss continues at current rate. Ecosystem services degrade 25-40% by 2050.',
    sector_shocks: { Energy: -0.08, Materials: -0.15, Utilities: -0.12, 'Consumer Staples': -0.18, 'Consumer Discretionary': -0.08, 'Health Care': -0.06, Financials: -0.05, IT: -0.02, 'Communication Services': -0.01, Industrials: -0.06, 'Real Estate': -0.10 },
    ecosystem_degradation_pct: 35, species_loss_pct: 15, water_stress_increase_pct: 40, pollination_decline_pct: 30, food_price_increase_pct: 25,
  },
  {
    id: 'nature_recovery', name: 'Nature Recovery — GBF Targets Met', color: '#16a34a',
    description: 'Kunming-Montreal targets achieved: 30% protection, 30% restoration, harmful subsidies eliminated. Nature starts recovering by 2030.',
    sector_shocks: { Energy: -0.15, Materials: -0.20, Utilities: -0.08, 'Consumer Staples': -0.05, 'Consumer Discretionary': -0.03, 'Health Care': 0.05, Financials: -0.02, IT: 0.08, 'Communication Services': 0.04, Industrials: -0.10, 'Real Estate': -0.06 },
    ecosystem_degradation_pct: -15, species_loss_pct: -5, water_stress_increase_pct: -10, pollination_decline_pct: -15, food_price_increase_pct: 5,
  },
  {
    id: 'ecosystem_collapse', name: 'Ecosystem Collapse — Tipping Points Crossed', color: '#7c3aed',
    description: 'Multiple ecosystem tipping points triggered: Amazon dieback, coral reef collapse, pollinator crash. Cascading failures across food systems and supply chains.',
    sector_shocks: { Energy: -0.12, Materials: -0.25, Utilities: -0.20, 'Consumer Staples': -0.35, 'Consumer Discretionary': -0.15, 'Health Care': -0.10, Financials: -0.12, IT: -0.05, 'Communication Services': -0.03, Industrials: -0.18, 'Real Estate': -0.15 },
    ecosystem_degradation_pct: 60, species_loss_pct: 40, water_stress_increase_pct: 80, pollination_decline_pct: 65, food_price_increase_pct: 80,
  },
];

const SECTORS = ['Energy', 'Materials', 'Utilities', 'Consumer Staples', 'Consumer Discretionary', 'Health Care', 'Financials', 'IT', 'Communication Services', 'Industrials', 'Real Estate'];

/* ── Tipping-point cascade timeline data ── */
const TIPPING_TIMELINE = (() => {
  const rows = [];
  for (let y = 2025; y <= 2100; y += 5) {
    const t = (y - 2025) / 75;
    rows.push({
      year: y,
      amazon_dieback: Math.round(Math.min(100, t < 0.2 ? t * 80 : 16 + t * 60) * 10) / 10,
      coral_collapse: Math.round(Math.min(100, t < 0.15 ? t * 120 : 18 + t * 55) * 10) / 10,
      pollinator_crash: Math.round(Math.min(100, t < 0.3 ? t * 50 : 15 + t * 70) * 10) / 10,
      permafrost_thaw: Math.round(Math.min(100, t * 45 + t * t * 30) * 10) / 10,
      soil_degradation: Math.round(Math.min(100, t * 35 + t * t * 25) * 10) / 10,
      fisheries_collapse: Math.round(Math.min(100, t < 0.25 ? t * 60 : 15 + t * 65) * 10) / 10,
    });
  }
  return rows;
})();

/* ── Recovery investment data ── */
const RECOVERY_INVESTMENT = SECTORS.map((s, i) => {
  const base = [45, 68, 32, 55, 22, 18, 15, 12, 8, 42, 28][i];
  return { sector: s, investment_bn: base, roi_years: Math.round(5 + (i % 5) * 2.3), jobs_created_k: Math.round(base * 2.8), nature_positive_pct: Math.round(25 + (base / 68) * 55) };
});

/* ── Climate + Nature compound scenario ── */
const CLIMATE_NATURE_COMPOUND = SECTORS.map((s, i) => {
  const natureShock = NATURE_SCENARIOS[2].sector_shocks[s] || 0;
  const climateShock = [-0.10, -0.12, -0.15, -0.08, -0.06, -0.04, -0.07, -0.02, -0.01, -0.09, -0.11][i];
  const correlation = 0.35;
  const compound = natureShock + climateShock + (Math.abs(natureShock * climateShock) * correlation);
  return { sector: s, nature_shock: natureShock, climate_shock: climateShock, compound_shock: Math.round(compound * 1000) / 1000, correlation_add: Math.round(Math.abs(natureShock * climateShock) * correlation * 1000) / 1000 };
});

/* ── Seed helper ── */
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ── Nature dependency scoring ── */
const SECTOR_NATURE_DEPENDENCY = {
  Energy: 0.55, Materials: 0.72, Utilities: 0.68, 'Consumer Staples': 0.82, 'Consumer Discretionary': 0.45,
  'Health Care': 0.38, Financials: 0.25, IT: 0.15, 'Communication Services': 0.10, Industrials: 0.52, 'Real Estate': 0.60,
};

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
  </Card>
);
const Badge = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color ? `${color}18` : `${T.navy}15`, color: color || T.navy, fontFamily: T.font }}>{label}</span>
);
const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>
      {sub && <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>{sub}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, variant, style }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 8, border: variant === 'outline' ? `1px solid ${T.border}` : 'none', background: variant === 'outline' ? T.surface : T.navy, color: variant === 'outline' ? T.navy : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, ...style }}>{children}</button>
);

const thS = { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, fontFamily: T.font, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const tdS = { padding: '8px 10px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: T.font };

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function NatureScenariosPage() {
  const navigate = useNavigate();

  /* ── Portfolio from localStorage ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      return raw.map(h => {
        const master = GLOBAL_COMPANY_MASTER.find(c => c.id === h.id || c.ticker === h.ticker);
        return master ? { ...master, weight: h.weight || 0 } : null;
      }).filter(Boolean);
    } catch { return []; }
  }, []);

  const holdings = portfolio.length > 0 ? portfolio : GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({ ...c, weight: Math.round((3 + seed(i) * 5) * 100) / 100 }));
  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);

  /* ── Scenario selection state (1 or 2) ── */
  const [selected, setSelected] = useState(['business_as_usual']);
  const toggleScenario = useCallback((id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter(x => x !== id) : prev;
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  /* ── Slider: ecosystem degradation sensitivity ── */
  const [sensitivity, setSensitivity] = useState(100);

  /* ── Sortable table state ── */
  const [sortBy, setSortBy] = useState('impact');
  const [sortDir, setSortDir] = useState('desc');
  const toggleSort = useCallback((col) => {
    setSortBy(prev => { if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; } setSortDir('desc'); return col; });
  }, []);

  /* ── Compute portfolio impact for a scenario ── */
  const computeImpact = useCallback((scenarioId) => {
    const sc = NATURE_SCENARIOS.find(s => s.id === scenarioId);
    if (!sc) return { total: 0, bySector: {}, holdings: [] };
    const bySector = {};
    let weightedImpact = 0;
    const holdingImpacts = holdings.map(h => {
      const shock = (sc.sector_shocks[h.sector] || -0.03) * (sensitivity / 100);
      const depScore = SECTOR_NATURE_DEPENDENCY[h.sector] || 0.3;
      const impact = shock * (h.weight / totalWeight);
      if (!bySector[h.sector]) bySector[h.sector] = 0;
      bySector[h.sector] += impact;
      weightedImpact += impact;
      const valueChange = h.market_cap_usd_mn ? Math.round(h.market_cap_usd_mn * shock) : null;
      return { ...h, shock: Math.round(shock * 10000) / 100, depScore: Math.round(depScore * 100), valueChange, riskLevel: Math.abs(shock) > 0.15 ? 'Critical' : Math.abs(shock) > 0.08 ? 'High' : 'Moderate' };
    });
    return { total: Math.round(weightedImpact * 10000) / 100, bySector, holdings: holdingImpacts };
  }, [holdings, totalWeight, sensitivity]);

  const primaryScenario = NATURE_SCENARIOS.find(s => s.id === selected[0]);
  const secondaryScenario = selected.length > 1 ? NATURE_SCENARIOS.find(s => s.id === selected[1]) : null;
  const primaryImpact = useMemo(() => computeImpact(selected[0]), [computeImpact, selected]);
  const secondaryImpact = useMemo(() => selected[1] ? computeImpact(selected[1]) : null, [computeImpact, selected]);

  /* ── Worst/Best sector ── */
  const sectorEntries = Object.entries(primaryImpact.bySector).sort((a, b) => a[1] - b[1]);
  const worstSector = sectorEntries.length > 0 ? sectorEntries[0] : ['N/A', 0];
  const bestSector = sectorEntries.length > 0 ? sectorEntries[sectorEntries.length - 1] : ['N/A', 0];

  /* ── Portfolio Resilience Score ── */
  const resilienceScore = useMemo(() => {
    const avgDep = holdings.reduce((s, h) => s + (SECTOR_NATURE_DEPENDENCY[h.sector] || 0.3), 0) / holdings.length;
    const diversification = new Set(holdings.map(h => h.sector)).size / 11;
    const lowImpactWeight = holdings.filter(h => Math.abs(primaryScenario.sector_shocks[h.sector] || 0) < 0.05).reduce((s, h) => s + h.weight, 0) / totalWeight;
    return Math.round((1 - avgDep * 0.4) * 30 + diversification * 35 + lowImpactWeight * 35);
  }, [holdings, totalWeight, primaryScenario]);

  /* ── Sorted holdings table ── */
  const sortedHoldings = useMemo(() => {
    const h = [...primaryImpact.holdings];
    h.sort((a, b) => {
      let va, vb;
      if (sortBy === 'impact') { va = a.shock; vb = b.shock; }
      else if (sortBy === 'name') { va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      else if (sortBy === 'sector') { va = (a.sector || '').toLowerCase(); vb = (b.sector || '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      else if (sortBy === 'dep') { va = a.depScore; vb = b.depScore; }
      else if (sortBy === 'value') { va = a.valueChange || 0; vb = b.valueChange || 0; }
      else { va = a.weight; vb = b.weight; }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return h;
  }, [primaryImpact.holdings, sortBy, sortDir]);

  /* ── Bar chart data ── */
  const barData = useMemo(() => SECTORS.map(s => {
    const obj = { sector: s.length > 14 ? s.slice(0, 12) + '..' : s };
    selected.forEach(sid => {
      const sc = NATURE_SCENARIOS.find(x => x.id === sid);
      if (sc) obj[sc.name.split(' ')[0]] = Math.round((sc.sector_shocks[s] || 0) * 100 * (sensitivity / 100));
    });
    return obj;
  }), [selected, sensitivity]);

  /* ── Sector Vulnerability Matrix ── */
  const vulnMatrix = SECTORS.map(s => {
    const row = { sector: s };
    NATURE_SCENARIOS.forEach(sc => { row[sc.id] = Math.round((sc.sector_shocks[s] || 0) * 100); });
    return row;
  });

  /* ── Export functions ── */
  const exportCSV = useCallback(() => {
    const header = ['Company', 'Sector', 'Weight%', 'Shock%', 'NatureDep%', 'ValueChangeUSDMn', 'Risk'];
    const rows = sortedHoldings.map(h => [h.name || h.ticker, h.sector, h.weight, h.shock, h.depScore, h.valueChange || '', h.riskLevel]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nature_scenario_${selected[0]}_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [sortedHoldings, selected]);

  const exportJSON = useCallback(() => {
    const data = { scenario: primaryScenario.name, portfolioImpact: primaryImpact.total, sensitivity, holdings: sortedHoldings.map(h => ({ name: h.name, sector: h.sector, shock: h.shock, depScore: h.depScore })), resilience: resilienceScore };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nature_scenario_analysis_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  }, [primaryScenario, primaryImpact, sensitivity, sortedHoldings, resilienceScore]);

  const exportMarkdown = useCallback(() => {
    let md = `# Nature Scenario Analysis — ${primaryScenario.name}\n\n`;
    md += `**Portfolio Impact:** ${primaryImpact.total}%\n**Resilience Score:** ${resilienceScore}/100\n**Sensitivity:** ${sensitivity}%\n\n`;
    md += `## Sector Shocks\n| Sector | Shock (%) |\n|---|---|\n`;
    SECTORS.forEach(s => { md += `| ${s} | ${Math.round((primaryScenario.sector_shocks[s] || 0) * 100 * (sensitivity / 100))}% |\n`; });
    md += `\n## Top 10 Most Impacted Holdings\n| Company | Sector | Shock% | Nature Dep |\n|---|---|---|---|\n`;
    sortedHoldings.slice(0, 10).forEach(h => { md += `| ${h.name || h.ticker} | ${h.sector} | ${h.shock}% | ${h.depScore}% |\n`; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nature_scenario_report_${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
  }, [primaryScenario, primaryImpact, sensitivity, sortedHoldings, resilienceScore]);

  /* ── Persist scenario selection ── */
  useEffect(() => { localStorage.setItem('ra_nature_scenario_selection', JSON.stringify(selected)); }, [selected]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 28px' }}>

        {/* ── 1. HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Nature-Related Scenario Analysis</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge label="3 Scenarios" color={T.navy} /> <Badge label="NGFS-aligned" color={T.sage} />
              <Badge label="Tipping Points" color={T.red} /> <Badge label="GBF" color={T.gold} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={exportCSV} variant="outline">Export CSV</Btn>
            <Btn onClick={exportJSON} variant="outline">Export JSON</Btn>
            <Btn onClick={exportMarkdown} variant="outline">Export MD</Btn>
          </div>
        </div>

        {/* ── 2. SCENARIO SELECTOR ── */}
        <Section title="Scenario Selection" sub="Select 1-2 scenarios for comparison">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {NATURE_SCENARIOS.map(sc => {
              const active = selected.includes(sc.id);
              return (
                <div key={sc.id} onClick={() => toggleScenario(sc.id)} style={{ background: active ? `${sc.color}10` : T.surface, border: `2px solid ${active ? sc.color : T.border}`, borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: sc.color }}>{sc.name.split(' \u2014 ')[0]}</div>
                    {active && <div style={{ width: 10, height: 10, borderRadius: 5, background: sc.color }} />}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 12 }}>{sc.description}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>Ecosystem: <b style={{ color: sc.color }}>{sc.ecosystem_degradation_pct > 0 ? '+' : ''}{sc.ecosystem_degradation_pct}%</b></div>
                    <div style={{ fontSize: 11, color: T.textMut }}>Species Loss: <b style={{ color: sc.color }}>{sc.species_loss_pct > 0 ? '+' : ''}{sc.species_loss_pct}%</b></div>
                    <div style={{ fontSize: 11, color: T.textMut }}>Water Stress: <b style={{ color: sc.color }}>{sc.water_stress_increase_pct > 0 ? '+' : ''}{sc.water_stress_increase_pct}%</b></div>
                    <div style={{ fontSize: 11, color: T.textMut }}>Food Prices: <b style={{ color: sc.color }}>+{sc.food_price_increase_pct}%</b></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Sensitivity Slider ── */}
        <Card style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, minWidth: 160 }}>Shock Sensitivity: {sensitivity}%</div>
          <input type="range" min={25} max={200} value={sensitivity} onChange={e => setSensitivity(+e.target.value)} style={{ flex: 1, accentColor: T.navy }} />
          <div style={{ fontSize: 11, color: T.textMut, minWidth: 80 }}>25% - 200%</div>
        </Card>

        {/* ── 3. KPIs (8 cards) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Portfolio Impact" value={`${primaryImpact.total > 0 ? '+' : ''}${primaryImpact.total}%`} sub={primaryScenario.name.split(' \u2014 ')[0]} color={primaryImpact.total < -5 ? T.red : primaryImpact.total < 0 ? T.amber : T.green} />
          <KpiCard label="Worst Sector" value={worstSector[0]} sub={`${Math.round(worstSector[1] * 10000) / 100}% impact`} color={T.red} />
          <KpiCard label="Best Positioned" value={bestSector[0]} sub={`${Math.round(bestSector[1] * 10000) / 100}% impact`} color={T.green} />
          <KpiCard label="Ecosystem Degradation" value={`${primaryScenario.ecosystem_degradation_pct > 0 ? '+' : ''}${primaryScenario.ecosystem_degradation_pct}%`} sub="By 2050 projection" color={primaryScenario.ecosystem_degradation_pct > 20 ? T.red : T.sage} />
          <KpiCard label="Species Loss" value={`${primaryScenario.species_loss_pct > 0 ? '+' : ''}${primaryScenario.species_loss_pct}%`} sub="Biodiversity intactness" color={primaryScenario.species_loss_pct > 10 ? T.red : T.sage} />
          <KpiCard label="Water Stress Change" value={`${primaryScenario.water_stress_increase_pct > 0 ? '+' : ''}${primaryScenario.water_stress_increase_pct}%`} sub="Global avg increase" color={primaryScenario.water_stress_increase_pct > 30 ? T.red : T.amber} />
          <KpiCard label="Food Price Impact" value={`+${primaryScenario.food_price_increase_pct}%`} sub="Real price increase 2050" color={primaryScenario.food_price_increase_pct > 40 ? T.red : T.amber} />
          <KpiCard label="Recovery Investment" value={`$${Math.round(RECOVERY_INVESTMENT.reduce((s, r) => s + r.investment_bn, 0))}B`} sub="Needed for Nature Recovery" color={T.sage} />
        </div>

        {/* ── 4. PORTFOLIO IMPACT BAR CHART ── */}
        <Section title="Portfolio Impact by Sector" sub={`Shock under ${selected.length > 1 ? '2 scenarios' : primaryScenario.name.split(' \u2014 ')[0]}`}>
          <Card>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={barData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: T.font }} formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {selected.map((sid, idx) => {
                  const sc = NATURE_SCENARIOS.find(x => x.id === sid);
                  return <Bar key={sid} dataKey={sc.name.split(' ')[0]} fill={sc.color} radius={[4, 4, 0, 0]} opacity={idx === 0 ? 0.9 : 0.6} />;
                })}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ── 5. SCENARIO COMPARISON TABLE ── */}
        {secondaryScenario && secondaryImpact && (
          <Section title="Scenario Comparison" sub={`${primaryScenario.name.split(' \u2014 ')[0]} vs ${secondaryScenario.name.split(' \u2014 ')[0]}`}>
            <Card>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th style={thS}>Metric</th><th style={{ ...thS, color: primaryScenario.color }}>{primaryScenario.name.split(' \u2014 ')[0]}</th><th style={{ ...thS, color: secondaryScenario.color }}>{secondaryScenario.name.split(' \u2014 ')[0]}</th><th style={thS}>Delta</th></tr>
                </thead>
                <tbody>
                  {[
                    { m: 'Portfolio Impact %', a: primaryImpact.total, b: secondaryImpact.total, fmt: v => `${v}%` },
                    { m: 'Ecosystem Degradation %', a: primaryScenario.ecosystem_degradation_pct, b: secondaryScenario.ecosystem_degradation_pct, fmt: v => `${v}%` },
                    { m: 'Species Loss %', a: primaryScenario.species_loss_pct, b: secondaryScenario.species_loss_pct, fmt: v => `${v}%` },
                    { m: 'Water Stress Change %', a: primaryScenario.water_stress_increase_pct, b: secondaryScenario.water_stress_increase_pct, fmt: v => `${v}%` },
                    { m: 'Pollination Decline %', a: primaryScenario.pollination_decline_pct, b: secondaryScenario.pollination_decline_pct, fmt: v => `${v}%` },
                    { m: 'Food Price Increase %', a: primaryScenario.food_price_increase_pct, b: secondaryScenario.food_price_increase_pct, fmt: v => `${v}%` },
                  ].map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{row.m}</td>
                      <td style={{ ...tdS, color: primaryScenario.color }}>{row.fmt(row.a)}</td>
                      <td style={{ ...tdS, color: secondaryScenario.color }}>{row.fmt(row.b)}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: (row.a - row.b) > 0 ? T.red : T.green }}>{row.fmt(Math.round((row.a - row.b) * 100) / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* ── 6. TIPPING POINT CASCADE AREA CHART ── */}
        <Section title="Tipping Point Cascade Timeline" sub="Ecosystem Collapse scenario 2025-2100 (% failure)">
          <Card>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={TIPPING_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: T.font }} formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="amazon_dieback" name="Amazon Dieback" stroke="#dc2626" fill="#dc262630" stackId="1" />
                <Area type="monotone" dataKey="coral_collapse" name="Coral Collapse" stroke="#0d9488" fill="#0d948830" stackId="1" />
                <Area type="monotone" dataKey="pollinator_crash" name="Pollinator Crash" stroke="#d97706" fill="#d9770630" stackId="1" />
                <Area type="monotone" dataKey="permafrost_thaw" name="Permafrost Thaw" stroke="#7c3aed" fill="#7c3aed30" stackId="1" />
                <Area type="monotone" dataKey="soil_degradation" name="Soil Degradation" stroke="#b45309" fill="#b4530930" stackId="1" />
                <Area type="monotone" dataKey="fisheries_collapse" name="Fisheries Collapse" stroke="#1b3a5c" fill="#1b3a5c30" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ── 7. SECTOR VULNERABILITY MATRIX ── */}
        <Section title="Sector Vulnerability Matrix" sub="All 11 GICS sectors across 3 scenarios (% shock)">
          <Card style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thS}>Sector</th>
                  {NATURE_SCENARIOS.map(sc => <th key={sc.id} style={{ ...thS, color: sc.color }}>{sc.name.split(' \u2014 ')[0]}</th>)}
                  <th style={thS}>Avg Shock</th>
                  <th style={thS}>Nature Dependency</th>
                </tr>
              </thead>
              <tbody>
                {vulnMatrix.map((row, ri) => {
                  const avg = Math.round((row.business_as_usual + row.nature_recovery + row.ecosystem_collapse) / 3);
                  const dep = Math.round((SECTOR_NATURE_DEPENDENCY[row.sector] || 0.3) * 100);
                  return (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{row.sector}</td>
                      {NATURE_SCENARIOS.map(sc => {
                        const val = row[sc.id];
                        const bg = val <= -20 ? '#dc262620' : val <= -10 ? '#d9770620' : val >= 0 ? '#16a34a15' : 'transparent';
                        return <td key={sc.id} style={{ ...tdS, background: bg, fontWeight: 600, color: val > 0 ? T.green : val < -15 ? T.red : T.text }}>{val > 0 ? '+' : ''}{val}%</td>;
                      })}
                      <td style={{ ...tdS, fontWeight: 700, color: avg < -10 ? T.red : T.amber }}>{avg}%</td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: T.borderL, borderRadius: 3 }}>
                            <div style={{ width: `${dep}%`, height: 6, borderRadius: 3, background: dep > 60 ? T.red : dep > 40 ? T.amber : T.sage }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>{dep}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ── 8. HOLDINGS IMPACT TABLE (sortable) ── */}
        <Section title="Holdings Impact Table" sub={`${sortedHoldings.length} holdings under ${primaryScenario.name.split(' \u2014 ')[0]}`}>
          <Card style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { key: 'name', label: 'Company' }, { key: 'sector', label: 'Sector' },
                    { key: 'weight', label: 'Weight %' }, { key: 'impact', label: 'Shock %' },
                    { key: 'dep', label: 'Nature Dep %' }, { key: 'value', label: 'Value Chg (USD M)' },
                    { key: 'risk', label: 'Risk Level' },
                  ].map(col => (
                    <th key={col.key} style={thS} onClick={() => toggleSort(col.key)}>
                      {col.label} {sortBy === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.slice(0, 40).map((h, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{h.name || h.ticker}</td>
                    <td style={tdS}>{h.sector}</td>
                    <td style={tdS}>{h.weight}%</td>
                    <td style={{ ...tdS, fontWeight: 700, color: h.shock > 0 ? T.green : h.shock < -10 ? T.red : T.amber }}>{h.shock > 0 ? '+' : ''}{h.shock}%</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: T.borderL, borderRadius: 3 }}>
                          <div style={{ width: `${h.depScore}%`, height: 5, borderRadius: 3, background: h.depScore > 60 ? T.red : h.depScore > 35 ? T.amber : T.sage }} />
                        </div>
                        {h.depScore}%
                      </div>
                    </td>
                    <td style={{ ...tdS, color: (h.valueChange || 0) < 0 ? T.red : T.green }}>{h.valueChange != null ? `${h.valueChange > 0 ? '+' : ''}${h.valueChange.toLocaleString()}` : 'N/A'}</td>
                    <td style={tdS}><Badge label={h.riskLevel} color={h.riskLevel === 'Critical' ? T.red : h.riskLevel === 'High' ? T.amber : T.sage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ── 9. NATURE + CLIMATE COMBINED SCENARIO ── */}
        <Section title="Nature + Climate Combined Scenario" sub="Compound impact: what if BOTH climate transition AND ecosystem collapse occur?">
          <Card>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16, lineHeight: 1.6 }}>
              Compound stress test combining NGFS climate transition shocks with Ecosystem Collapse nature shocks. Cross-correlation coefficient: <b>0.35</b> (nature-climate feedback loops amplify total impact).
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thS}>Sector</th><th style={thS}>Nature Shock</th><th style={thS}>Climate Shock</th><th style={thS}>Correlation Add</th><th style={thS}>Compound Total</th>
                </tr>
              </thead>
              <tbody>
                {CLIMATE_NATURE_COMPOUND.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{row.sector}</td>
                    <td style={{ ...tdS, color: T.red }}>{Math.round(row.nature_shock * 100)}%</td>
                    <td style={{ ...tdS, color: T.amber }}>{Math.round(row.climate_shock * 100)}%</td>
                    <td style={{ ...tdS, color: '#7c3aed' }}>{Math.round(row.correlation_add * 100 * 10) / 10}%</td>
                    <td style={{ ...tdS, fontWeight: 700, color: row.compound_shock < -0.20 ? T.red : T.amber }}>{Math.round(row.compound_shock * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, padding: 14, background: `${T.red}08`, borderRadius: 10, border: `1px solid ${T.red}25` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>Compound Portfolio Impact</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                Climate VaR: <b>{Math.round(CLIMATE_NATURE_COMPOUND.reduce((s, r) => s + Math.abs(r.climate_shock), 0) / SECTORS.length * 100)}%</b> +
                Nature VaR: <b>{Math.round(CLIMATE_NATURE_COMPOUND.reduce((s, r) => s + Math.abs(r.nature_shock), 0) / SECTORS.length * 100)}%</b> +
                Correlation: <b>{Math.round(CLIMATE_NATURE_COMPOUND.reduce((s, r) => s + r.correlation_add, 0) / SECTORS.length * 100 * 10) / 10}%</b> =
                <b style={{ color: T.red, fontSize: 15 }}> {Math.round(CLIMATE_NATURE_COMPOUND.reduce((s, r) => s + Math.abs(r.compound_shock), 0) / SECTORS.length * 100)}% combined</b>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── 10. RECOVERY INVESTMENT ANALYSIS ── */}
        <Section title="Recovery Investment Analysis" sub="Investment needed to achieve Nature Recovery scenario by sector">
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={RECOVERY_INVESTMENT} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="$B" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: T.font }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="investment_bn" name="Investment ($B)" fill={T.sage} radius={[4, 4, 0, 0]}>
                  {RECOVERY_INVESTMENT.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
              <div style={{ textAlign: 'center', padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.sage }}>${RECOVERY_INVESTMENT.reduce((s, r) => s + r.investment_bn, 0)}B</div>
                <div style={{ fontSize: 11, color: T.textMut }}>Total Investment</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{Math.round(RECOVERY_INVESTMENT.reduce((s, r) => s + r.roi_years, 0) / SECTORS.length)}yr</div>
                <div style={{ fontSize: 11, color: T.textMut }}>Avg ROI Period</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.gold }}>{Math.round(RECOVERY_INVESTMENT.reduce((s, r) => s + r.jobs_created_k, 0)).toLocaleString()}K</div>
                <div style={{ fontSize: 11, color: T.textMut }}>Jobs Created</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>{Math.round(RECOVERY_INVESTMENT.reduce((s, r) => s + r.nature_positive_pct, 0) / SECTORS.length)}%</div>
                <div style={{ fontSize: 11, color: T.textMut }}>Avg Nature Positive</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── 11. PORTFOLIO RESILIENCE SCORE ── */}
        <Section title="Portfolio Resilience Score" sub="Composite: diversification, low-dependency sectors, scenario sensitivity">
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', border: `8px solid ${resilienceScore >= 70 ? T.green : resilienceScore >= 45 ? T.amber : T.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: T.navy }}>{resilienceScore}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>/100</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: resilienceScore >= 70 ? T.green : resilienceScore >= 45 ? T.amber : T.red }}>
                  {resilienceScore >= 70 ? 'High Resilience' : resilienceScore >= 45 ? 'Moderate Resilience' : 'Low Resilience'}
                </div>
              </div>
              <div>
                {[
                  { label: 'Sector Diversification', score: Math.round((new Set(holdings.map(h => h.sector)).size / 11) * 100), desc: `${new Set(holdings.map(h => h.sector)).size}/11 GICS sectors represented` },
                  { label: 'Low Nature-Dependency Weight', score: Math.round(holdings.filter(h => (SECTOR_NATURE_DEPENDENCY[h.sector] || 0) < 0.4).reduce((s, h) => s + h.weight, 0) / totalWeight * 100), desc: 'Weight in sectors with <40% nature dependency' },
                  { label: 'Positive-Shock Potential', score: Math.round(holdings.filter(h => (primaryScenario.sector_shocks[h.sector] || 0) > 0).reduce((s, h) => s + h.weight, 0) / totalWeight * 100), desc: 'Weight in sectors that benefit from nature recovery' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.score > 60 ? T.green : item.score > 30 ? T.amber : T.red }}>{item.score}%</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: T.borderL, borderRadius: 4 }}>
                      <div style={{ width: `${item.score}%`, height: 8, borderRadius: 4, background: item.score > 60 ? T.green : item.score > 30 ? T.amber : T.red, transition: 'width .4s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── 12. CROSS-NAV ── */}
        <Section title="Cross-Module Navigation">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'TNFD LEAP Assessment', path: '/tnfd-leap' },
              { label: 'Biodiversity Footprint', path: '/biodiversity-footprint' },
              { label: 'Ecosystem Services', path: '/ecosystem-services' },
              { label: 'Water Stress Analytics', path: '/water-risk' },
              { label: 'Climate Scenarios (NGFS)', path: '/ngfs-scenarios' },
              { label: 'Nature Hub Dashboard', path: '/nature-hub' },
              { label: 'Deforestation Risk', path: '/deforestation-risk' },
              { label: 'Portfolio Suite', path: '/portfolio-suite' },
            ].map(nav => (
              <Btn key={nav.path} onClick={() => navigate(nav.path)} variant="outline" style={{ textAlign: 'center', width: '100%' }}>{nav.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: T.textMut }}>
          EP-M5 Nature-Related Scenario Analysis | NGFS-aligned | Kunming-Montreal GBF | Data: IPBES, ENCORE, WRI | Sprint M
        </div>
      </div>
    </div>
  );
}
