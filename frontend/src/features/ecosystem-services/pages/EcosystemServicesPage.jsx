import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899'];

/* ================================================================
   ENCORE ECOSYSTEM SERVICES — 21 services across 4 categories
   ================================================================ */
const ECOSYSTEM_SERVICES = {
  provisioning: [
    { id: 'ES01', name: 'Water supply', description: 'Freshwater for industrial, agricultural, domestic use', unit: 'megalitres/yr' },
    { id: 'ES02', name: 'Genetic resources', description: 'Genetic material for pharmaceuticals, agriculture', unit: 'qualitative' },
    { id: 'ES03', name: 'Raw materials', description: 'Timber, fibres, minerals, fuels', unit: 'tonnes/yr' },
    { id: 'ES04', name: 'Food provision', description: 'Wild-caught fish, game, plants', unit: 'tonnes/yr' },
    { id: 'ES05', name: 'Medicinal resources', description: 'Natural compounds for medicine', unit: 'qualitative' },
  ],
  regulating: [
    { id: 'ES06', name: 'Climate regulation', description: 'Carbon sequestration, temperature moderation', unit: 'tCO2e sequestered' },
    { id: 'ES07', name: 'Flood & storm protection', description: 'Wetlands, mangroves absorbing storm energy', unit: 'USD Mn avoided damage' },
    { id: 'ES08', name: 'Water purification', description: 'Natural filtration by wetlands, forests', unit: 'megalitres treated' },
    { id: 'ES09', name: 'Pollination', description: 'Insect/animal pollination of crops', unit: 'USD Mn crop value' },
    { id: 'ES10', name: 'Erosion control', description: 'Vegetation preventing soil loss', unit: 'hectares protected' },
    { id: 'ES11', name: 'Pest & disease control', description: 'Natural predators controlling pests', unit: 'qualitative' },
    { id: 'ES12', name: 'Air quality regulation', description: 'Vegetation filtering air pollutants', unit: 'tonnes filtered' },
  ],
  supporting: [
    { id: 'ES13', name: 'Soil formation', description: 'Biological/geological soil creation', unit: 'qualitative' },
    { id: 'ES14', name: 'Nutrient cycling', description: 'Decomposition, nitrogen fixation', unit: 'qualitative' },
    { id: 'ES15', name: 'Habitat provision', description: 'Ecosystems supporting species lifecycle', unit: 'hectares' },
    { id: 'ES16', name: 'Primary production', description: 'Photosynthesis creating biomass', unit: 'tonnes biomass' },
  ],
  cultural: [
    { id: 'ES17', name: 'Recreation & tourism', description: 'Nature-based tourism and recreation', unit: 'USD Mn revenue' },
    { id: 'ES18', name: 'Aesthetic values', description: 'Landscape beauty, property values', unit: 'USD Mn premium' },
    { id: 'ES19', name: 'Spiritual & religious', description: 'Sacred natural sites', unit: 'qualitative' },
    { id: 'ES20', name: 'Educational & scientific', description: 'Research value of ecosystems', unit: 'qualitative' },
    { id: 'ES21', name: 'Sense of place', description: 'Cultural identity tied to nature', unit: 'qualitative' },
  ],
};
const ALL_SERVICES = Object.values(ECOSYSTEM_SERVICES).flat();

/* ================================================================
   ENCORE DEPENDENCY MATRIX — 11 sectors x 21 services
   VH=Very High, H=High, M=Medium, L=Low, N=None
   ================================================================ */
const SECTORS_LIST = ['Energy', 'Materials', 'Industrials', 'Consumer Discretionary', 'Consumer Staples', 'Health Care', 'Financials', 'Information Technology', 'Communication Services', 'Utilities', 'Real Estate'];

const DEP_MATRIX = {
  Energy:                     ['VH','L','VH','N','N','H','M','H','N','M','N','M','L','L','M','L','L','L','N','L','N'],
  Materials:                  ['VH','M','VH','N','L','M','M','H','N','H','L','M','H','H','M','M','L','L','N','L','N'],
  Industrials:                ['H','L','H','N','N','M','H','M','N','M','N','M','M','L','L','L','L','L','N','L','N'],
  'Consumer Discretionary':   ['M','L','H','L','L','M','M','M','N','L','L','M','L','L','L','L','H','H','L','L','M'],
  'Consumer Staples':         ['VH','H','M','VH','H','H','H','VH','VH','H','VH','M','VH','VH','H','H','L','L','L','M','L'],
  'Health Care':              ['H','VH','M','L','VH','M','L','H','N','L','M','H','L','M','H','M','L','L','L','H','L'],
  Financials:                 ['L','L','L','N','N','M','M','L','L','L','L','L','L','L','L','L','L','L','N','L','N'],
  'Information Technology':   ['H','L','H','N','N','M','L','M','N','L','N','M','L','L','L','L','L','L','N','L','N'],
  'Communication Services':   ['M','N','M','N','N','L','L','L','N','L','N','L','N','N','N','N','M','M','L','M','M'],
  Utilities:                  ['VH','L','M','N','N','VH','VH','VH','N','H','N','H','M','M','H','H','L','L','N','L','N'],
  'Real Estate':              ['H','N','H','N','N','M','VH','M','N','H','N','H','M','L','M','L','VH','VH','M','L','VH'],
};

const RATING_SCORES = { VH: 5, H: 4, M: 3, L: 2, N: 0 };
const RATING_COLORS = { VH: '#dc2626', H: '#ea580c', M: '#d97706', L: '#16a34a', N: '#e5e0d8' };
const RATING_BG = { VH: '#dc262620', H: '#ea580c18', M: '#d9770615', L: '#16a34a12', N: '#f6f4f0' };
const RATING_TEXT_COLORS = { VH: '#dc2626', H: '#ea580c', M: '#d97706', L: '#16a34a', N: '#9aa3ae' };

/* ================================================================
   FINANCIAL VALUATION PROXIES — USD Mn replacement / at-risk per service
   ================================================================ */
const SERVICE_FINANCIAL = {
  ES01: { valueAtRisk: 420, replacementCost: 680 }, ES02: { valueAtRisk: 85, replacementCost: 320 },
  ES03: { valueAtRisk: 350, replacementCost: 520 }, ES04: { valueAtRisk: 280, replacementCost: 450 },
  ES05: { valueAtRisk: 120, replacementCost: 380 }, ES06: { valueAtRisk: 510, replacementCost: 950 },
  ES07: { valueAtRisk: 380, replacementCost: 720 }, ES08: { valueAtRisk: 290, replacementCost: 580 },
  ES09: { valueAtRisk: 240, replacementCost: 890 }, ES10: { valueAtRisk: 180, replacementCost: 340 },
  ES11: { valueAtRisk: 95, replacementCost: 260 }, ES12: { valueAtRisk: 210, replacementCost: 420 },
  ES13: { valueAtRisk: 70, replacementCost: 195 }, ES14: { valueAtRisk: 85, replacementCost: 220 },
  ES15: { valueAtRisk: 310, replacementCost: 750 }, ES16: { valueAtRisk: 190, replacementCost: 480 },
  ES17: { valueAtRisk: 260, replacementCost: 150 }, ES18: { valueAtRisk: 140, replacementCost: 95 },
  ES19: { valueAtRisk: 45, replacementCost: 30 }, ES20: { valueAtRisk: 90, replacementCost: 65 },
  ES21: { valueAtRisk: 55, replacementCost: 40 },
};

/* ================================================================
   SBTN (Science Based Targets for Nature) DATA
   ================================================================ */
const SBTN_STATUS_MAP = { committed: 'Committed', target_set: 'Target Set', in_progress: 'In Progress', none: 'None' };

/* ================================================================
   HELPER — deterministic pseudo-random
   ================================================================ */
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ================================================================
   SCORING
   ================================================================ */
function scoreEcosystemDependency(company, idx) {
  const sector = company.sector || 'Financials';
  const row = DEP_MATRIX[sector] || DEP_MATRIX.Financials;
  const deps = row.map((r, i) => ({ service: ALL_SERVICES[i], rating: r, score: RATING_SCORES[r] || 0 }));
  const totalScore = deps.reduce((s, d) => s + d.score, 0);
  const vhCount = deps.filter(d => d.rating === 'VH').length;
  const hCount = deps.filter(d => d.rating === 'H').length;
  const topService = deps.sort((a, b) => b.score - a.score)[0]?.service?.name || 'N/A';
  const s = seed(idx + 7);
  const sbtnOptions = ['committed', 'target_set', 'in_progress', 'none', 'none', 'none'];
  const sbtnStatus = sbtnOptions[Math.floor(s * sbtnOptions.length)];
  const natureRisk = totalScore > 60 ? 'Very High' : totalScore > 45 ? 'High' : totalScore > 30 ? 'Medium' : 'Low';
  const valAtRisk = Math.round(totalScore * (company.weight || 0.01) * 42 + s * 50);
  return { deps, totalScore, vhCount, hCount, topService, sbtnStatus, natureRisk, valAtRisk };
}

/* ================================================================
   UI PRIMITIVES
   ================================================================ */
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
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{t}</button>
    ))}
  </div>
);
const SortHeader = ({ label, field, sortBy, sortDir, onSort }) => (
  <th onClick={() => onSort(field)} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, cursor: 'pointer', borderBottom: `2px solid ${T.border}`, fontFamily: T.font, whiteSpace: 'nowrap', userSelect: 'none' }}>
    {label} {sortBy === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, fontFamily: T.font }}>
    <div style={{ fontWeight: 700, marginBottom: 4, color: T.navy }}>{label}</div>
    {payload.map((p, i) => <div key={i} style={{ color: p.color || T.navy }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</div>)}
  </div>);
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function EcosystemServicesPage() {
  const navigate = useNavigate();

  /* -- Portfolio -- */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      return raw.map(h => {
        const master = GLOBAL_COMPANY_MASTER.find(c => c.id === h.id || c.ticker === h.ticker);
        return master ? { ...master, weight: h.weight || 0 } : null;
      }).filter(Boolean);
    } catch { return []; }
  }, []);

  /* -- UI state -- */
  const [tab, setTab] = useState('Overview');
  const [sortBy, setSortBy] = useState('totalScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCell, setSelectedCell] = useState(null);
  const [scenarioService, setScenarioService] = useState('ES01');
  const [scenarioDegradation, setScenarioDegradation] = useState(50);

  const doSort = useCallback((field) => {
    setSortBy(prev => { setSortDir(prev === field ? (d => d === 'asc' ? 'desc' : 'asc') : () => 'desc'); return field; });
  }, []);

  /* -- Score every holding -- */
  const scoredHoldings = useMemo(() => {
    return portfolio.map((c, i) => {
      const result = scoreEcosystemDependency(c, i);
      return { ...c, ...result };
    });
  }, [portfolio]);

  /* -- Sorted holdings -- */
  const sorted = useMemo(() => {
    return [...scoredHoldings].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [scoredHoldings, sortBy, sortDir]);

  /* -- KPI calculations -- */
  const metrics = useMemo(() => {
    const allDeps = scoredHoldings.flatMap(h => h.deps.filter(d => d.score > 0));
    const uniqueServices = new Set(allDeps.map(d => d.service.id));
    const vhTotal = scoredHoldings.reduce((s, h) => s + h.vhCount, 0);
    const avgScore = scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.totalScore, 0) / scoredHoldings.length) : 0;
    const topServiceCounts = {};
    allDeps.forEach(d => { topServiceCounts[d.service.name] = (topServiceCounts[d.service.name] || 0) + d.score; });
    const topService = Object.entries(topServiceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const sectorScores = {};
    scoredHoldings.forEach(h => { sectorScores[h.sector] = (sectorScores[h.sector] || 0) + h.totalScore; });
    const topSector = Object.entries(sectorScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const totalValAtRisk = scoredHoldings.reduce((s, h) => s + h.valAtRisk, 0);
    const totalReplacement = ALL_SERVICES.reduce((s, sv) => s + (SERVICE_FINANCIAL[sv.id]?.replacementCost || 0), 0);
    const dataCoverage = scoredHoldings.length > 0 ? Math.round((scoredHoldings.filter(h => h.totalScore > 0).length / scoredHoldings.length) * 100) : 0;
    return { uniqueServices: uniqueServices.size, vhTotal, avgScore, topService, topSector, totalValAtRisk, totalReplacement, dataCoverage };
  }, [scoredHoldings]);

  /* -- Radar data (top 8 services by portfolio-weighted dependency) -- */
  const radarData = useMemo(() => {
    const serviceScores = {};
    scoredHoldings.forEach(h => {
      h.deps.forEach(d => {
        serviceScores[d.service.name] = (serviceScores[d.service.name] || 0) + d.score * (h.weight || 0.01);
      });
    });
    return Object.entries(serviceScores).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, val]) => ({ service: name.length > 16 ? name.slice(0, 14) + '..' : name, value: Math.round(val * 100) / 100, fullName: name }));
  }, [scoredHoldings]);

  /* -- Service criticality ranking -- */
  const criticalityRanking = useMemo(() => {
    const serviceScores = {};
    scoredHoldings.forEach(h => {
      h.deps.forEach(d => { serviceScores[d.service.id] = (serviceScores[d.service.id] || 0) + d.score; });
    });
    return ALL_SERVICES.map(s => ({
      ...s, totalScore: serviceScores[s.id] || 0, ...SERVICE_FINANCIAL[s.id],
    })).sort((a, b) => b.totalScore - a.totalScore);
  }, [scoredHoldings]);

  /* -- Sector dependency cards data -- */
  const sectorCards = useMemo(() => {
    const represented = [...new Set(scoredHoldings.map(h => h.sector))];
    return represented.map(sector => {
      const row = DEP_MATRIX[sector] || [];
      const deps = row.map((r, i) => ({ service: ALL_SERVICES[i]?.name, rating: r, score: RATING_SCORES[r] })).sort((a, b) => b.score - a.score);
      const count = scoredHoldings.filter(h => h.sector === sector).length;
      return { sector, topDeps: deps.slice(0, 5), holdingsCount: count };
    }).sort((a, b) => b.topDeps[0]?.score - a.topDeps[0]?.score);
  }, [scoredHoldings]);

  /* -- Dependency vs Impact scatter -- */
  const scatterData = useMemo(() => {
    return SECTORS_LIST.map(sector => {
      const row = DEP_MATRIX[sector];
      const depScore = row.reduce((s, r) => s + (RATING_SCORES[r] || 0), 0);
      const s = seed(sector.length);
      const impactScore = Math.round(depScore * 0.7 + s * 20);
      return { sector: sector.length > 14 ? sector.slice(0, 12) + '..' : sector, dependency: depScore, impact: impactScore, fullName: sector };
    });
  }, []);

  /* -- Scenario analysis -- */
  const scenarioResult = useMemo(() => {
    const serviceIdx = ALL_SERVICES.findIndex(s => s.id === scenarioService);
    const affectedHoldings = scoredHoldings.filter(h => {
      const row = DEP_MATRIX[h.sector] || [];
      return RATING_SCORES[row[serviceIdx]] >= 3;
    });
    const lossMultiplier = scenarioDegradation / 100;
    const totalImpact = affectedHoldings.reduce((s, h) => s + h.valAtRisk * lossMultiplier, 0);
    return { affectedCount: affectedHoldings.length, totalImpact: Math.round(totalImpact), degradation: scenarioDegradation };
  }, [scoredHoldings, scenarioService, scenarioDegradation]);

  /* -- Exports -- */
  const exportCSV = useCallback(() => {
    const header = ['Sector', ...ALL_SERVICES.map(s => s.name)].join(',');
    const rows = SECTORS_LIST.map(sec => [sec, ...DEP_MATRIX[sec]].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'encore_dependency_matrix.csv'; a.click();
  }, []);
  const exportJSON = useCallback(() => {
    const data = { matrix: DEP_MATRIX, services: ALL_SERVICES, holdings: sorted.map(h => ({ name: h.name, sector: h.sector, totalScore: h.totalScore, natureRisk: h.natureRisk, valAtRisk: h.valAtRisk })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ecosystem_dependency_report.json'; a.click();
  }, [sorted]);
  const exportPrint = useCallback(() => window.print(), []);

  /* -- Render -- */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0, fontFamily: T.font }}>Ecosystem Services Dependency Mapper</h1>
              <Badge label="ENCORE" color={T.sage} />
              <Badge label="21 Services" color={T.gold} />
              <Badge label="11 Sectors" color={T.navy} />
              <Badge label="UNEP" color={T.amber} />
            </div>
            <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>UNEP-WCMC ENCORE methodology mapping portfolio dependencies on natural capital and ecosystem services</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outline" onClick={exportCSV}>Export CSV</Btn>
            <Btn variant="outline" onClick={exportJSON}>Export JSON</Btn>
            <Btn variant="outline" onClick={exportPrint}>Print</Btn>
          </div>
        </div>

        {/* ── TABS ── */}
        <TabBar tabs={['Overview', 'Heatmap', 'Holdings', 'Scenarios']} active={tab} onChange={setTab} />

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Services Depended On" value={metrics.uniqueServices} sub="of 21 ENCORE services" />
          <KpiCard label="Very High Dependencies" value={metrics.vhTotal} sub="across all holdings" color={T.red} />
          <KpiCard label="Portfolio Dependency Score" value={metrics.avgScore} sub="average (max 105)" color={T.amber} />
          <KpiCard label="Most Critical Service" value={metrics.topService} sub="highest weighted dependency" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <KpiCard label="Most Exposed Sector" value={metrics.topSector} sub="highest total dep score" color={T.red} />
          <KpiCard label="Financial Value at Risk" value={`$${(metrics.totalValAtRisk / 1000).toFixed(1)}B`} sub="if services degraded" color={T.amber} />
          <KpiCard label="Nature Replacement Cost" value={`$${(metrics.totalReplacement / 1000).toFixed(1)}B`} sub="engineered alternatives" color={T.sage} />
          <KpiCard label="Data Coverage" value={`${metrics.dataCoverage}%`} sub="holdings with dependency data" color={T.green} />
        </div>

        {/* ════════════════════════ OVERVIEW TAB ════════════════════════ */}
        {tab === 'Overview' && (<>
          {/* -- Radar Chart -- */}
          <Section title="Portfolio Dependency Profile" sub="Top 8 ecosystem services by portfolio-weighted dependency">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="service" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: T.textMut }} />
                  <Radar name="Dependency" dataKey="value" stroke={T.sage} fill={T.sage} fillOpacity={0.35} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Service Criticality Ranking -- */}
          <Section title="Service Criticality Ranking" sub="Which ecosystem services does the portfolio depend on most?">
            <Card>
              <ResponsiveContainer width="100%" height={Math.max(420, criticalityRanking.length * 22)}>
                <BarChart data={criticalityRanking.slice(0, 15)} layout="vertical" margin={{ left: 140, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textMut }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.text, fontFamily: T.font }} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalScore" name="Dependency Score" radius={[0, 4, 4, 0]}>
                    {criticalityRanking.slice(0, 15).map((e, i) => <Cell key={i} fill={i < 3 ? T.red : i < 7 ? T.amber : T.sage} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Sector Dependency Cards -- */}
          <Section title="Sector Dependency Cards" sub="Top 5 ecosystem service dependencies per represented sector">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {sectorCards.slice(0, 9).map(sc => (
                <Card key={sc.sector}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{sc.sector}</div>
                    <Badge label={`${sc.holdingsCount} holdings`} />
                  </div>
                  {sc.topDeps.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                      <span style={{ fontSize: 12, color: T.text, fontFamily: T.font }}>{d.service}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: RATING_BG[d.rating], color: RATING_TEXT_COLORS[d.rating] }}>{d.rating}</span>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </Section>

          {/* -- Financial Valuation of Dependencies -- */}
          <Section title="Financial Valuation of Dependencies" sub="Estimated revenue impact (USD Mn) if ecosystem service lost">
            <Card>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={criticalityRanking.slice(0, 12)} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.font }} angle={-35} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="valueAtRisk" name="Value at Risk (USD Mn)" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="replacementCost" name="Replacement Cost (USD Mn)" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Nature Replacement Cost -- */}
          <Section title="Nature Replacement Cost" sub="Cost to replace each ecosystem service with engineered alternatives">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {ALL_SERVICES.slice(0, 12).map(s => {
                  const fin = SERVICE_FINANCIAL[s.id];
                  return (
                    <div key={s.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceH }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{s.description}</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div><span style={{ fontSize: 10, color: T.textMut }}>At Risk: </span><span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>${fin?.valueAtRisk || 0}M</span></div>
                        <div><span style={{ fontSize: 10, color: T.textMut }}>Replace: </span><span style={{ fontSize: 13, fontWeight: 700, color: T.sage }}>${fin?.replacementCost || 0}M</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>

          {/* -- Dependency vs Impact Matrix -- */}
          <Section title="Dependency vs Impact Matrix" sub="2x2 quadrant: sectors by dependency on nature vs impact on nature">
            <Card>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{ left: 20, bottom: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" dataKey="dependency" name="Dependency" tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'Dependency on Nature', position: 'insideBottom', offset: -10, fontSize: 12, fill: T.textSec }} />
                    <YAxis type="number" dataKey="impact" name="Impact" tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'Impact on Nature', angle: -90, position: 'insideLeft', fontSize: 12, fill: T.textSec }} />
                    <ZAxis range={[80, 200]} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, fontFamily: T.font }}>
                        <div style={{ fontWeight: 700, color: T.navy }}>{d?.fullName}</div>
                        <div>Dependency: {d?.dependency}</div><div>Impact: {d?.impact}</div>
                      </div>);
                    }} />
                    <Scatter data={scatterData} fill={T.navy}>
                      {scatterData.map((e, i) => <Cell key={i} fill={e.dependency > 50 && e.impact > 45 ? T.red : e.dependency > 50 ? T.amber : T.sage} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                {/* Quadrant labels */}
                <div style={{ position: 'absolute', top: 10, right: 30, fontSize: 10, color: T.red, fontWeight: 700, opacity: 0.7 }}>PRIORITY 1: High Dep + High Impact</div>
                <div style={{ position: 'absolute', bottom: 40, left: 40, fontSize: 10, color: T.green, fontWeight: 700, opacity: 0.7 }}>LOW PRIORITY</div>
              </div>
            </Card>
          </Section>
        </>)}

        {/* ════════════════════════ HEATMAP TAB ════════════════════════ */}
        {tab === 'Heatmap' && (<>
          <Section title="ENCORE Dependency Heatmap" sub="11 GICS sectors x 21 ecosystem services | Click any cell for details">
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, position: 'sticky', left: 0, background: T.surface, zIndex: 2, minWidth: 140 }}>Sector</th>
                    {ALL_SERVICES.map(s => (
                      <th key={s.id} style={{ padding: '6px 4px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontWeight: 600, color: T.textSec, fontSize: 9, lineHeight: '1.2', minWidth: 54, maxWidth: 60, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 100 }}>{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS_LIST.map(sector => {
                    const row = DEP_MATRIX[sector];
                    return (
                      <tr key={sector}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}`, position: 'sticky', left: 0, background: T.surface, zIndex: 1 }}>{sector}</td>
                        {row.map((rating, i) => (
                          <td key={i}
                            onClick={() => setSelectedCell({ sector, service: ALL_SERVICES[i], rating })}
                            style={{ padding: 4, textAlign: 'center', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all .15s' }}>
                            <div style={{ background: RATING_BG[rating], color: RATING_TEXT_COLORS[rating], fontWeight: 700, fontSize: 10, borderRadius: 4, padding: '4px 2px', border: selectedCell?.sector === sector && selectedCell?.service?.id === ALL_SERVICES[i]?.id ? `2px solid ${T.navy}` : '2px solid transparent' }}>{rating}</div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                {['VH', 'H', 'M', 'L', 'N'].map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: RATING_BG[r], border: `1px solid ${RATING_COLORS[r]}40` }} />
                    <span style={{ fontSize: 11, color: T.textSec }}>{r === 'VH' ? 'Very High' : r === 'H' ? 'High' : r === 'M' ? 'Medium' : r === 'L' ? 'Low' : 'None'}</span>
                  </div>
                ))}
              </div>
            </Card>
            {/* Detail panel for selected cell */}
            {selectedCell && (
              <Card style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{selectedCell.sector} / {selectedCell.service.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{selectedCell.service.description}</div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div><span style={{ fontSize: 11, color: T.textMut }}>Dependency Rating: </span><Badge label={selectedCell.rating} color={RATING_COLORS[selectedCell.rating]} /></div>
                      <div><span style={{ fontSize: 11, color: T.textMut }}>Measurement Unit: </span><span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{selectedCell.service.unit}</span></div>
                      <div><span style={{ fontSize: 11, color: T.textMut }}>Value at Risk: </span><span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>${SERVICE_FINANCIAL[selectedCell.service.id]?.valueAtRisk || 0}M</span></div>
                    </div>
                  </div>
                  <Btn variant="outline" onClick={() => setSelectedCell(null)} style={{ fontSize: 11 }}>Close</Btn>
                </div>
              </Card>
            )}
          </Section>
        </>)}

        {/* ════════════════════════ HOLDINGS TAB ════════════════════════ */}
        {tab === 'Holdings' && (<>
          <Section title="Holdings Ecosystem Dependency Table" sub={`${sorted.length} companies | click column headers to sort`}>
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr>
                    <SortHeader label="Company" field="name" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Sector" field="sector" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Top Dependency" field="topService" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Score" field="totalScore" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="VH+H Count" field="vhCount" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Nature Risk" field="natureRisk" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Value at Risk" field="valAtRisk" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="SBTN Status" field="sbtnStatus" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((h, i) => {
                    const riskColor = h.natureRisk === 'Very High' ? T.red : h.natureRisk === 'High' ? T.amber : h.natureRisk === 'Medium' ? T.gold : T.green;
                    return (
                      <tr key={h.id || i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: T.navy }}>{h.name}</td>
                        <td style={{ padding: '10px 8px', color: T.textSec }}>{h.sector}</td>
                        <td style={{ padding: '10px 8px', color: T.text, fontSize: 11 }}>{h.topService}</td>
                        <td style={{ padding: '10px 8px', fontWeight: 700, color: h.totalScore > 60 ? T.red : h.totalScore > 40 ? T.amber : T.sage }}>{h.totalScore}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>{h.vhCount + h.hCount}</td>
                        <td style={{ padding: '10px 8px' }}><Badge label={h.natureRisk} color={riskColor} /></td>
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: T.navy }}>${h.valAtRisk.toLocaleString()}M</td>
                        <td style={{ padding: '10px 8px' }}><Badge label={SBTN_STATUS_MAP[h.sbtnStatus]} color={h.sbtnStatus === 'target_set' ? T.green : h.sbtnStatus === 'committed' ? T.sage : h.sbtnStatus === 'in_progress' ? T.amber : T.textMut} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sorted.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No portfolio loaded. Add holdings via Portfolio Manager.</div>}
            </Card>
          </Section>

          {/* -- SBTN Targets Integration -- */}
          <Section title="SBTN Targets Integration" sub="Science Based Targets for Nature: company commitment status">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {Object.entries(SBTN_STATUS_MAP).map(([key, label]) => {
                  const count = scoredHoldings.filter(h => h.sbtnStatus === key).length;
                  const pct = scoredHoldings.length ? Math.round((count / scoredHoldings.length) * 100) : 0;
                  const colors = { committed: T.sage, target_set: T.green, in_progress: T.amber, none: T.textMut };
                  return (
                    <div key={key} style={{ padding: 16, borderRadius: 8, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: colors[key] }}>{count}</div>
                      <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, marginTop: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{pct}% of portfolio</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>
        </>)}

        {/* ════════════════════════ SCENARIOS TAB ════════════════════════ */}
        {tab === 'Scenarios' && (<>
          {/* -- Scenario: Ecosystem Service Loss -- */}
          <Section title="Scenario: Ecosystem Service Loss" sub="What if a critical service degrades? Adjust service and degradation level.">
            <Card>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Ecosystem Service</label>
                  <select value={scenarioService} onChange={e => setScenarioService(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, minWidth: 220, color: T.navy }}>
                    {ALL_SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Degradation Level: {scenarioDegradation}%</label>
                  <input type="range" min={10} max={100} step={5} value={scenarioDegradation} onChange={e => setScenarioDegradation(Number(e.target.value))} style={{ width: '100%', accentColor: T.navy }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}><span>10%</span><span>50%</span><span>100%</span></div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 8, background: `${T.red}10`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Holdings Affected</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{scenarioResult.affectedCount}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>with Medium+ dependency</div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: `${T.amber}10`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Estimated Portfolio Impact</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>${scenarioResult.totalImpact.toLocaleString()}M</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>at {scenarioResult.degradation}% degradation</div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: `${T.sage}10`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Service Replacement Cost</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.sage }}>${SERVICE_FINANCIAL[scenarioService]?.replacementCost || 0}M</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>engineered alternative</div>
                </div>
              </div>
            </Card>
          </Section>

          {/* -- TNFD LEAP Cross-reference -- */}
          <Section title="Cross-reference to TNFD LEAP" sub="How dependency data feeds into the Taskforce on Nature-related Financial Disclosures assessment">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { phase: 'Locate', desc: 'Identify interface with nature at priority locations', status: 'Active', color: T.sage },
                  { phase: 'Evaluate', desc: 'Assess dependencies and impacts on ecosystem services', status: 'Active', color: T.gold },
                  { phase: 'Assess', desc: 'Material nature-related risks and opportunities', status: 'In Progress', color: T.amber },
                  { phase: 'Prepare', desc: 'Respond and report on material nature issues', status: 'Planned', color: T.textMut },
                ].map(p => (
                  <div key={p.phase} style={{ padding: 16, borderRadius: 8, border: `2px solid ${p.color}30`, background: `${p.color}08` }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.phase[0]}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{p.phase}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{p.desc}</div>
                    <Badge label={p.status} color={p.color} />
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* -- Portfolio Dependency PieChart -- */}
          <Section title="Portfolio Dependency by Category" sub="Distribution of dependencies across ENCORE service categories">
            <Card>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={[
                    { name: 'Provisioning', value: scoredHoldings.reduce((s, h) => s + h.deps.slice(0, 5).reduce((ss, d) => ss + d.score, 0), 0) },
                    { name: 'Regulating', value: scoredHoldings.reduce((s, h) => s + h.deps.slice(5, 12).reduce((ss, d) => ss + d.score, 0), 0) },
                    { name: 'Supporting', value: scoredHoldings.reduce((s, h) => s + h.deps.slice(12, 16).reduce((ss, d) => ss + d.score, 0), 0) },
                    { name: 'Cultural', value: scoredHoldings.reduce((s, h) => s + h.deps.slice(16, 21).reduce((ss, d) => ss + d.score, 0), 0) },
                  ]} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {PIE_COLORS.slice(0, 4).map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Engagement Recommendations -- */}
          <Section title="Engagement Recommendations" sub="Priority engagement actions for holdings with very high ecosystem dependencies">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { action: 'Request SBTN commitment from all holdings with VH dependencies', priority: 'P1', sector: 'All', color: T.red },
                  { action: 'Engage Consumer Staples on water supply and pollination dependency disclosure', priority: 'P1', sector: 'Consumer Staples', color: T.red },
                  { action: 'Utilities: assess flood protection and climate regulation alternatives', priority: 'P2', sector: 'Utilities', color: T.amber },
                  { action: 'Materials: soil formation and nutrient cycling risk mitigation plans', priority: 'P2', sector: 'Materials', color: T.amber },
                  { action: 'Real Estate: evaluate flood protection and aesthetic value dependencies', priority: 'P2', sector: 'Real Estate', color: T.gold },
                  { action: 'Health Care: genetic resources and habitat provision supply chain audit', priority: 'P3', sector: 'Health Care', color: T.sage },
                ].map((r, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Badge label={r.priority} color={r.color} />
                    <div>
                      <div style={{ fontSize: 12, color: T.navy, fontWeight: 600, marginBottom: 2 }}>{r.action}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>Sector: {r.sector}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </>)}

        {/* ── CROSS-NAVIGATION ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <Btn variant="outline" onClick={() => navigate('/tnfd-leap')}>TNFD LEAP Assessment</Btn>
          <Btn variant="outline" onClick={() => navigate('/biodiversity-credits')}>Biodiversity Credits</Btn>
          <Btn variant="outline" onClick={() => navigate('/water-stress')}>Water Stress & Risk</Btn>
          <Btn variant="outline" onClick={() => navigate('/deforestation-risk')}>Deforestation Risk</Btn>
          <Btn variant="outline" onClick={() => navigate('/climate-physical-risk')}>Physical Risk</Btn>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0 12px', fontSize: 11, color: T.textMut }}>
          Ecosystem Services Dependency Mapper | ENCORE Methodology (UNEP-WCMC / UNEP FI) | EP-M3
        </div>
      </div>
    </div>
  );
}
