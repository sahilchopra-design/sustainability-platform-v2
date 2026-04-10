import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, Treemap,
  ComposedChart, ReferenceLine
} from 'recharts';
import {
  NIFTY_50, INDIA_PROFILE, INDIA_CBAM_EXPOSURE, INDIA_CLIMATE_TARGETS,
  INDIA_REGULATORY, INDIA_EMISSIONS_BY_SECTOR, INDIA_SECTORS, runIndiaEngines
} from '../../../data/indiaDataset';

/* ── deterministic PRNG ─────────────────────────────────────────── */
const sr = (seed) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

/* ── theme ───────────────────────────────────────────────────────── */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e'
};

const PALETTE = ['#1b2a4a', '#b8962e', '#4f46e5', '#065f46', '#991b1b', '#92400e', '#0891b2', '#7c3aed', '#dc2626', '#059669'];
const SECTION_IDS = [
  'executive', 'nifty50', 'engines', 'cbam', 'climate-targets',
  'sectors', 'regulatory', 'emissions', 'risk-deep-dive', 'appendix'
];
const SECTION_LABELS = [
  'Executive Summary', 'Nifty 50 Portfolio', 'Engine Results', 'CBAM Exposure',
  'Climate Targets', 'Sector Analysis', 'Regulatory Landscape', 'Emission Factors',
  'Risk Deep-Dive', 'Appendix & Methodology'
];

/* ── helper components ───────────────────────────────────────────── */
const KpiCard = ({ label, value, unit, sub, accent }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: '20px 24px', minWidth: 180, flex: '1 1 200px',
    borderTop: `3px solid ${accent || T.navy}`
  }}>
    <div style={{ fontSize: 13, color: T.sub, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: T.navy, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>
      {value}<span style={{ fontSize: 14, color: T.sub, marginLeft: 4 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ id, number, title, subtitle }) => (
  <div id={id} style={{ scrollMarginTop: 80, marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
      <span style={{
        background: T.navy, color: '#fff', borderRadius: 8, padding: '4px 12px',
        fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600
      }}>{number}</span>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{title}</h2>
    </div>
    {subtitle && <p style={{ color: T.sub, fontSize: 14, margin: '4px 0 0 48px' }}>{subtitle}</p>}
  </div>
);

const DataTable = ({ columns, data, maxHeight }) => (
  <div style={{ overflowX: 'auto', overflowY: maxHeight ? 'auto' : 'visible', maxHeight: maxHeight || 'none', border: `1px solid ${T.border}`, borderRadius: 10 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
      <thead>
        <tr style={{ background: T.navy, color: '#fff', position: 'sticky', top: 0, zIndex: 2 }}>
          {columns.map((c, i) => (
            <th key={i} style={{ padding: '10px 14px', textAlign: c.align || 'left', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12, letterSpacing: 0.5 }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.surface, borderBottom: `1px solid ${T.border}` }}>
            {columns.map((c, ci) => (
              <td key={ci} style={{ padding: '8px 14px', textAlign: c.align || 'left', color: T.text, whiteSpace: 'nowrap' }}>
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{
    background: `${color}18`, color, borderRadius: 6, padding: '2px 10px',
    fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace'
  }}>{text}</span>
);

const Callout = ({ title, children, color }) => (
  <div style={{
    background: `${color || T.indigo}08`, border: `1px solid ${color || T.indigo}30`,
    borderRadius: 10, padding: '16px 20px', marginBottom: 16,
    borderLeft: `4px solid ${color || T.indigo}`
  }}>
    {title && <div style={{ fontWeight: 700, color: color || T.indigo, marginBottom: 6, fontSize: 14 }}>{title}</div>}
    <div style={{ color: T.text, fontSize: 13, lineHeight: 1.6 }}>{children}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function ClientPitchPage() {
  const [activeSection, setActiveSection] = useState('executive');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [showMethodology, setShowMethodology] = useState(false);

  /* ── engine results ────────────────────────────────────────────── */
  const engines = useMemo(() => runIndiaEngines(), []);

  /* ── derived data ──────────────────────────────────────────────── */
  const sectors = useMemo(() => {
    const unique = [...new Set(NIFTY_50.map(c => c.sector))];
    return ['All', ...unique.sort()];
  }, []);

  const filteredCompanies = useMemo(() => {
    if (sectorFilter === 'All') return NIFTY_50;
    return NIFTY_50.filter(c => c.sector === sectorFilter);
  }, [sectorFilter]);

  const portfolioKpis = useMemo(() => {
    const arr = filteredCompanies;
    const n = arr.length || 1;
    const totalMcap = arr.reduce((s, c) => s + (c.marketCap_usd_mn || 0), 0);
    const totalScope1 = arr.reduce((s, c) => s + (c.scope1_tco2e || 0), 0);
    const totalScope2 = arr.reduce((s, c) => s + (c.scope2_tco2e || 0), 0);
    const totalScope3 = arr.reduce((s, c) => s + (c.scope3_tco2e || 0), 0);
    const avgEsg = arr.reduce((s, c) => s + (c.esgScore || 0), 0) / n;
    const avgTemp = arr.reduce((s, c) => s + (c.temperatureAlignment_c || 0), 0) / n;
    const sbtiCount = arr.filter(c => c.sbtiStatus === 'Targets set').length;
    const cbamCount = arr.filter(c => c.cbamExposed).length;
    const avgTransition = arr.reduce((s, c) => s + (c.transitionScore || 0), 0) / n;
    const avgPhysical = arr.reduce((s, c) => s + (c.physicalRiskScore || 0), 0) / n;
    const avgWater = arr.reduce((s, c) => s + (c.waterStress || 0), 0) / n;
    const waci = totalMcap > 0 ? (totalScope1 + totalScope2) / totalMcap : 0;
    return { n: arr.length, totalMcap, totalScope1, totalScope2, totalScope3, avgEsg, avgTemp, sbtiCount, cbamCount, avgTransition, avgPhysical, avgWater, waci };
  }, [filteredCompanies]);

  const sectorEmissionsChart = useMemo(() => {
    return INDIA_SECTORS.map(s => ({
      sector: s.sector.length > 18 ? s.sector.slice(0, 16) + '..' : s.sector,
      fullSector: s.sector,
      avgEmissions: Math.round(s.avgEmissions),
      avgESG: +(s.avgESG).toFixed(1),
      sbtiCoverage: +(s.sbtiCoverage_pct).toFixed(0),
      companies: s.companies
    }));
  }, []);

  const cbamChart = useMemo(() => {
    const items = INDIA_CBAM_EXPOSURE?.byCommodity || [];
    return items.map(c => ({
      commodity: c.commodity,
      exports_bn: +(c.exports_kusd / 1e6).toFixed(2),
      emissions_mt: +(c.emissions_tco2 / 1e6).toFixed(2),
      direct_mt: +((c.directEmissions_tco2 || 0) / 1e6).toFixed(2),
      indirect_mt: +((c.indirectEmissions_tco2 || 0) / 1e6).toFixed(2)
    }));
  }, []);

  const trajectoryData = useMemo(() => {
    return (INDIA_CLIMATE_TARGETS?.co2Trajectory || []).map(d => ({
      year: d.year,
      co2_mt: Math.round(d.co2_mt),
      target_2c: Math.round(d.co2_mt * (1 - (d.year - 2020) * 0.018)),
      target_15c: Math.round(d.co2_mt * (1 - (d.year - 2020) * 0.028))
    }));
  }, []);

  const emissionFactors = useMemo(() => {
    return [...(INDIA_EMISSIONS_BY_SECTOR || [])].sort((a, b) => (b.ef_kgco2_usd || 0) - (a.ef_kgco2_usd || 0)).slice(0, 20);
  }, []);

  const scopeBreakdownChart = useMemo(() => {
    const sectorMap = {};
    filteredCompanies.forEach(c => {
      if (!sectorMap[c.sector]) sectorMap[c.sector] = { sector: c.sector, scope1: 0, scope2: 0, scope3: 0 };
      sectorMap[c.sector].scope1 += c.scope1_tco2e || 0;
      sectorMap[c.sector].scope2 += c.scope2_tco2e || 0;
      sectorMap[c.sector].scope3 += c.scope3_tco2e || 0;
    });
    return Object.values(sectorMap).map(s => ({
      sector: s.sector.length > 14 ? s.sector.slice(0, 12) + '..' : s.sector,
      'Scope 1': Math.round(s.scope1 / 1e3),
      'Scope 2': Math.round(s.scope2 / 1e3),
      'Scope 3': Math.round(s.scope3 / 1e3)
    }));
  }, [filteredCompanies]);

  const radarData = useMemo(() => {
    const p = portfolioKpis;
    return [
      { axis: 'ESG Score', value: Math.min(100, p.avgEsg), benchmark: 55 },
      { axis: 'Transition', value: Math.min(100, p.avgTransition), benchmark: 50 },
      { axis: 'Physical Risk', value: Math.min(100, 100 - p.avgPhysical), benchmark: 60 },
      { axis: 'Water Stress', value: Math.min(100, 100 - p.avgWater * 20), benchmark: 55 },
      { axis: 'SBTi Coverage', value: Math.min(100, (p.sbtiCount / Math.max(1, p.n)) * 100), benchmark: 30 },
      { axis: 'Temp Alignment', value: Math.min(100, Math.max(0, (3 - p.avgTemp) / 3 * 100)), benchmark: 40 }
    ];
  }, [portfolioKpis]);

  const scatterData = useMemo(() => {
    return filteredCompanies.map(c => ({
      name: c.ticker || c.name,
      x: c.transitionScore || 0,
      y: c.esgScore || 0,
      z: Math.max(50, (c.marketCap_usd_mn || 0) / 200),
      temp: (c.temperatureAlignment_c || 0).toFixed(1)
    }));
  }, [filteredCompanies]);

  const scenarioNames = ['NDC Current', 'Below 2 deg C', 'Net Zero 2050', 'Delayed Transition'];
  const scenarioMultipliers = [1.0, 0.85, 0.7, 1.15];
  const scenarioImpactData = useMemo(() => {
    const mult = scenarioMultipliers[scenarioIdx];
    return INDIA_SECTORS.map(s => ({
      sector: s.sector.length > 14 ? s.sector.slice(0, 12) + '..' : s.sector,
      fullSector: s.sector,
      baseline: Math.round(s.avgEmissions),
      scenario: Math.round(s.avgEmissions * mult),
      delta: Math.round(s.avgEmissions * (mult - 1))
    }));
  }, [scenarioIdx]);

  const topEmitters = useMemo(() => {
    return [...filteredCompanies]
      .sort((a, b) => ((b.scope1_tco2e || 0) + (b.scope2_tco2e || 0)) - ((a.scope1_tco2e || 0) + (a.scope2_tco2e || 0)))
      .slice(0, 10)
      .map(c => ({
        name: c.ticker || c.name,
        total_ktco2: +((( c.scope1_tco2e || 0) + (c.scope2_tco2e || 0)) / 1e3).toFixed(1),
        scope1_ktco2: +((c.scope1_tco2e || 0) / 1e3).toFixed(1),
        scope2_ktco2: +((c.scope2_tco2e || 0) / 1e3).toFixed(1),
        esgScore: c.esgScore,
        temp: c.temperatureAlignment_c
      }));
  }, [filteredCompanies]);

  const treemapData = useMemo(() => {
    const sectorMap = {};
    filteredCompanies.forEach(c => {
      if (!sectorMap[c.sector]) sectorMap[c.sector] = { name: c.sector, value: 0, count: 0 };
      sectorMap[c.sector].value += c.marketCap_usd_mn || 0;
      sectorMap[c.sector].count += 1;
    });
    return Object.values(sectorMap).sort((a, b) => b.value - a.value);
  }, [filteredCompanies]);

  const regulatoryTimeline = useMemo(() => {
    const reg = INDIA_REGULATORY || {};
    const items = [];
    if (reg.brsr) items.push({ year: 2023, label: 'BRSR Mandatory', desc: 'Top 1000 listed entities', color: T.indigo });
    if (reg.brsrCore) items.push({ year: 2024, label: 'BRSR Core Assurance', desc: 'Reasonable assurance required', color: T.green });
    if (reg.carbonMarket) items.push({ year: 2025, label: 'Indian Carbon Market', desc: 'Compliance market launch', color: T.navy });
    if (reg.performAchieveTrade) items.push({ year: 2026, label: 'PAT Cycle VII', desc: 'Expanded sector coverage', color: T.gold });
    items.push({ year: 2027, label: 'EU CBAM Full', desc: 'Full financial adjustment', color: T.red });
    items.push({ year: 2030, label: 'NDC Target', desc: INDIA_PROFILE?.ndc_target_2030 || '45% intensity reduction', color: T.amber });
    items.push({ year: 2070, label: 'Net Zero', desc: 'India net-zero commitment', color: T.green });
    return items;
  }, []);

  const handleNavClick = useCallback((id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ── engine result cards ───────────────────────────────────────── */
  const engineCards = useMemo(() => {
    if (!engines) return [];
    return [
      { key: 'WACI', val: engines.nifty50_waci?.value, unit: engines.nifty50_waci?.unit || 'tCO2e/$M', accent: T.navy },
      { key: 'Financed Emissions', val: engines.nifty50_financedEmissions?.value, unit: engines.nifty50_financedEmissions?.unit || 'MtCO2e', accent: T.red },
      { key: 'Portfolio Temp', val: engines.nifty50_temperature?.value, unit: engines.nifty50_temperature?.unit || 'deg C', accent: T.amber },
      { key: 'Climate VaR', val: engines.nifty50_climateVaR?.value, unit: engines.nifty50_climateVaR?.unit || '%', accent: T.red },
      { key: 'SFDR PAI-1', val: engines.nifty50_sfdrPai?.pai1_ghg, unit: 'tCO2e', accent: T.indigo },
      { key: 'SFDR PAI-2', val: engines.nifty50_sfdrPai?.pai2_footprint, unit: 'tCO2e/$M', accent: T.indigo },
      { key: 'EU Taxonomy', val: engines.nifty50_taxonomy?.value, unit: engines.nifty50_taxonomy?.unit || '%', accent: T.green },
      { key: 'Transition Score', val: engines.nifty50_transition?.value, unit: engines.nifty50_transition?.unit || '/100', accent: T.gold },
      { key: 'Physical Risk', val: engines.nifty50_physicalRisk?.value, unit: engines.nifty50_physicalRisk?.unit || '/100', accent: T.red },
      { key: 'Water Risk', val: engines.nifty50_water?.value, unit: engines.nifty50_water?.unit || '/100', accent: T.navy },
      { key: 'Biodiversity', val: engines.nifty50_biodiversity?.value, unit: engines.nifty50_biodiversity?.unit || '/100', accent: T.green },
      { key: 'SBTi Coverage', val: engines.nifty50_sbtiCoverage?.value, unit: engines.nifty50_sbtiCoverage?.unit || '%', accent: T.indigo },
      { key: 'CBAM Exposure', val: engines.nifty50_cbamExposure?.value, unit: engines.nifty50_cbamExposure?.unit || '%', accent: T.amber }
    ];
  }, [engines]);

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.surface, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>

      {/* ── sticky nav ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, background: T.navy,
        borderBottom: `3px solid ${T.gold}`, padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ color: T.gold, fontWeight: 700, fontSize: 15, fontFamily: 'JetBrains Mono, monospace', marginRight: 24, whiteSpace: 'nowrap', padding: '14px 0' }}>
          A2 INTELLIGENCE
        </div>
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            style={{
              background: activeSection === id ? T.gold : 'transparent',
              color: activeSection === id ? T.navy : '#ffffffcc',
              border: 'none', padding: '14px 16px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5,
              borderBottom: activeSection === id ? `2px solid ${T.gold}` : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {(i + 1).toString().padStart(2, '0')} {SECTION_LABELS[i]}
          </button>
        ))}
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 28px 80px' }}>

        {/* ════════════════════════════════════════════════════════════
           SECTION 1 — EXECUTIVE SUMMARY
           ════════════════════════════════════════════════════════════ */}
        <SectionHeader id="executive" number="01" title="Executive Summary"
          subtitle="India Climate Risk Intelligence -- Nifty 50 Portfolio Analysis" />

        <div style={{
          background: `linear-gradient(135deg, ${T.navy} 0%, #2d4a7a 100%)`,
          borderRadius: 16, padding: '36px 40px', marginBottom: 28, color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: '1 1 500px' }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', fontFamily: 'DM Sans, sans-serif' }}>
                India Climate Risk Assessment
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9, maxWidth: 600, margin: 0 }}>
                Comprehensive climate analytics across the Nifty 50 universe covering transition risk, physical risk, CBAM exposure, regulatory readiness, and Paris alignment. Powered by 12 proprietary engines with PCAF, TCFD, SFDR, and EU Taxonomy methodologies.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <Badge text={`${NIFTY_50.length} Companies`} color="#fff" />
                <Badge text="12 Engines" color={T.gold} />
                <Badge text="PCAF L3" color="#6ee7b7" />
                <Badge text="SFDR PAI" color="#93c5fd" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: '0 0 320px' }}>
              {[
                { label: 'GDP', value: `$${INDIA_PROFILE?.gdp_usd_tn || 3.35}T`, sub: 'FY2024' },
                { label: 'CO2 Emissions', value: `${(INDIA_PROFILE?.co2_mt || 3193).toLocaleString()} Mt`, sub: `${(INDIA_PROFILE?.share_global_co2 || 8.3).toFixed(1)}% global` },
                { label: 'Renewables', value: `${(INDIA_PROFILE?.renewables_share_pct || 9.1).toFixed(1)}%`, sub: `Target: ${INDIA_PROFILE?.re_target_gw || 500} GW` },
                { label: 'Net Zero', value: INDIA_PROFILE?.net_zero_target || 2070, sub: 'National target' }
              ].map((k, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Callout title="Key Findings" color={T.navy}>
          India's Nifty 50 portfolio exhibits a weighted average carbon intensity (WACI) requiring active transition management. With {portfolioKpis.sbtiCount} of {portfolioKpis.n} constituents having SBTi-validated targets and an average portfolio temperature of {portfolioKpis.avgTemp.toFixed(2)} deg C, significant decarbonization work remains. EU CBAM exposure affects {portfolioKpis.cbamCount} companies, creating material regulatory risk by 2027.
        </Callout>

        {/* ════════════════════════════════════════════════════════════
           SECTION 2 — NIFTY 50 PORTFOLIO
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="nifty50" number="02" title="Nifty 50 Portfolio Overview"
          subtitle="Full constituent analysis with climate metrics and risk scores" />

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.sub, fontFamily: 'JetBrains Mono, monospace' }}>SECTOR FILTER</label>
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: 'JetBrains Mono, monospace', background: T.card, color: T.text, cursor: 'pointer'
            }}
          >
            {sectors.map(s => <option key={s} value={s}>{s} {s !== 'All' ? `(${NIFTY_50.filter(c => c.sector === s).length})` : `(${NIFTY_50.length})`}</option>)}
          </select>
          <span style={{ fontSize: 12, color: T.sub }}>{filteredCompanies.length} companies selected</span>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Market Cap" value={`$${(portfolioKpis.totalMcap / 1e3).toFixed(0)}`} unit="Bn USD" accent={T.navy} />
          <KpiCard label="Avg ESG Score" value={portfolioKpis.avgEsg.toFixed(1)} unit="/100" accent={T.green} />
          <KpiCard label="Portfolio Temp" value={portfolioKpis.avgTemp.toFixed(2)} unit="deg C" accent={portfolioKpis.avgTemp > 2 ? T.red : T.green} />
          <KpiCard label="SBTi Coverage" value={`${portfolioKpis.sbtiCount}/${portfolioKpis.n}`} unit="companies" accent={T.indigo} />
          <KpiCard label="CBAM Exposed" value={portfolioKpis.cbamCount} unit="companies" accent={T.amber} />
        </div>

        {/* Portfolio treemap + scatter row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Market Cap by Sector ($M)</h4>
            <ResponsiveContainer width="100%" height={280}>
              <Treemap data={treemapData} dataKey="value" nameKey="name" stroke={T.border} animationDuration={400}>
                {treemapData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
                ))}
                <Tooltip formatter={(v) => `$${(v / 1e3).toFixed(1)}Bn`} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>ESG vs Transition Score (bubble = market cap)</h4>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Transition" type="number" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Transition Score', position: 'bottom', fontSize: 11 }} />
                <YAxis dataKey="y" name="ESG" type="number" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'ESG Score', angle: -90, position: 'left', fontSize: 11 }} />
                <ZAxis dataKey="z" range={[30, 400]} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.name}</div>
                      <div>Transition: {d.x} | ESG: {d.y} | Temp: {d.temp} deg C</div>
                    </div>
                  );
                }} />
                <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scope breakdown by sector */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>GHG Emissions by Sector (ktCO2e)</h4>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={scopeBreakdownChart} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Scope 1" stackId="a" fill={T.navy} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Scope 2" stackId="a" fill={T.gold} />
              <Bar dataKey="Scope 3" stackId="a" fill={T.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Full company table */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
            Full Constituent Table ({filteredCompanies.length} companies)
          </h4>
          <DataTable
            maxHeight={440}
            columns={[
              { label: '#', key: 'id', align: 'center', render: (r) => r.id },
              { label: 'Company', key: 'name', render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
              { label: 'Ticker', key: 'ticker' },
              { label: 'Sector', key: 'sector' },
              { label: 'MCap ($M)', key: 'marketCap_usd_mn', align: 'right', render: (r) => (r.marketCap_usd_mn || 0).toLocaleString() },
              { label: 'S1 (tCO2e)', key: 'scope1_tco2e', align: 'right', render: (r) => (r.scope1_tco2e || 0).toLocaleString() },
              { label: 'S2 (tCO2e)', key: 'scope2_tco2e', align: 'right', render: (r) => (r.scope2_tco2e || 0).toLocaleString() },
              { label: 'ESG', key: 'esgScore', align: 'center', render: (r) => <span style={{ fontWeight: 600, color: (r.esgScore || 0) >= 60 ? T.green : (r.esgScore || 0) >= 40 ? T.amber : T.red }}>{(r.esgScore || 0).toFixed(0)}</span> },
              { label: 'Temp (C)', key: 'temperatureAlignment_c', align: 'center', render: (r) => <span style={{ color: (r.temperatureAlignment_c || 0) <= 2 ? T.green : T.red }}>{(r.temperatureAlignment_c || 0).toFixed(1)}</span> },
              { label: 'SBTi', key: 'sbtiStatus', align: 'center', render: (r) => r.sbtiStatus === 'Targets set' ? <Badge text="SET" color={T.green} /> : <Badge text="NONE" color={T.sub} /> },
              { label: 'CBAM', key: 'cbamExposed', align: 'center', render: (r) => r.cbamExposed ? <Badge text="YES" color={T.red} /> : <span style={{ color: T.sub }}>--</span> }
            ]}
            data={filteredCompanies}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════
           SECTION 3 — ENGINE RESULTS
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="engines" number="03" title="Proprietary Engine Results"
          subtitle="12 climate analytics engines applied to the Nifty 50 universe" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {engineCards.map((e, i) => (
            <KpiCard key={i} label={e.key} value={e.val != null ? (typeof e.val === 'number' ? e.val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : e.val) : 'N/A'} unit={e.unit} accent={e.accent} />
          ))}
        </div>

        {/* Radar chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Portfolio Risk Radar</h4>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.text }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Portfolio" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                <Legend verticalAlign="bottom" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Top 10 Emitters (ktCO2e)</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topEmitters} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="scope1_ktco2" name="Scope 1" stackId="a" fill={T.navy} />
                <Bar dataKey="scope2_ktco2" name="Scope 2" stackId="a" fill={T.gold} radius={[0, 4, 4, 0]} />
                <Legend verticalAlign="top" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
           SECTION 4 — CBAM EXPOSURE
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="cbam" number="04" title="EU CBAM Exposure Analysis"
          subtitle="India's Carbon Border Adjustment Mechanism vulnerability by commodity" />

        <Callout title="CBAM Vulnerability Index" color={T.red}>
          India's aggregate CBAM vulnerability index stands at <strong>{(INDIA_CBAM_EXPOSURE?.byCommodity || []).length > 0 ? (INDIA_PROFILE?.cbam_vulnerability_index || 0.26).toFixed(4) : '0.0000'}</strong>. Full financial adjustments begin January 2026, with reporting already mandatory. Iron & Steel and Aluminium sectors face the highest absolute exposure.
        </Callout>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>CBAM Exports by Commodity ($Bn)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cbamChart} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="commodity" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="exports_bn" name="Exports ($Bn)" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Embedded Emissions (MtCO2e)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cbamChart} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="commodity" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar dataKey="direct_mt" name="Direct" stackId="a" fill={T.red} />
                <Bar dataKey="indirect_mt" name="Indirect" stackId="a" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DataTable
          columns={[
            { label: 'Commodity', key: 'commodity', render: (r) => <span style={{ fontWeight: 600 }}>{r.commodity}</span> },
            { label: 'Exports ($Bn)', key: 'exports_bn', align: 'right' },
            { label: 'Total Emissions (Mt)', key: 'emissions_mt', align: 'right' },
            { label: 'Direct (Mt)', key: 'direct_mt', align: 'right' },
            { label: 'Indirect (Mt)', key: 'indirect_mt', align: 'right' },
            { label: 'Intensity', key: 'intensity', align: 'right', render: (r) => r.exports_bn > 0 ? (r.emissions_mt / r.exports_bn).toFixed(2) : '0.00' }
          ]}
          data={cbamChart}
        />

        {/* ════════════════════════════════════════════════════════════
           SECTION 5 — CLIMATE TARGETS
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="climate-targets" number="05" title="India Climate Targets & Trajectory"
          subtitle="NDC commitments, CO2 trajectory, and Paris alignment pathways" />

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="CO2 Emissions" value={(INDIA_PROFILE?.co2_mt || 0).toLocaleString()} unit="Mt/yr" accent={T.red} />
          <KpiCard label="Per Capita" value={(INDIA_PROFILE?.co2_per_capita || 0).toFixed(2)} unit="tCO2e" accent={T.amber} sub="Global avg: ~4.7" />
          <KpiCard label="Coal Share" value={(INDIA_PROFILE?.coal_share_pct || 0).toFixed(1)} unit="%" accent={T.navy} />
          <KpiCard label="Renewables" value={(INDIA_PROFILE?.renewables_share_pct || 0).toFixed(1)} unit="%" accent={T.green} sub={`Target: ${INDIA_PROFILE?.re_target_gw || 500} GW`} />
        </div>

        {trajectoryData.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>CO2 Emission Trajectory vs Paris Pathways (MtCO2)</h4>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={trajectoryData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="co2_mt" name="Actual / Projected" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="target_2c" name="2 deg C Pathway" stroke={T.gold} fill="none" strokeWidth={2} strokeDasharray="6 3" />
                <Area type="monotone" dataKey="target_15c" name="1.5 deg C Pathway" stroke={T.green} fill="none" strokeWidth={2} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <Callout title="NDC Commitment" color={T.green}>
          {INDIA_CLIMATE_TARGETS?.ndc ? `India's updated NDC targets a ${INDIA_PROFILE?.ndc_target_2030 || '45% reduction in emissions intensity by 2030'} with a long-term net-zero goal of ${INDIA_PROFILE?.net_zero_target || 2070}.` : `India has committed to a 45% reduction in emissions intensity of GDP by 2030 (over 2005 levels) and net-zero by ${INDIA_PROFILE?.net_zero_target || 2070}.`}
        </Callout>

        {/* ════════════════════════════════════════════════════════════
           SECTION 6 — SECTOR ANALYSIS
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="sectors" number="06" title="Sector Analysis"
          subtitle="Comparative sector-level emissions, ESG performance, and SBTi adoption" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Avg Emissions by Sector</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorEmissionsChart} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.fullSector}</div>
                      <div>Avg Emissions: {d.avgEmissions.toLocaleString()} tCO2e</div>
                      <div>Avg ESG: {d.avgESG} | SBTi: {d.sbtiCoverage}%</div>
                    </div>
                  );
                }} />
                <Bar dataKey="avgEmissions" name="Avg Emissions (tCO2e)" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>ESG Score vs SBTi Coverage (%)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={sectorEmissionsChart} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar yAxisId="left" dataKey="avgESG" name="Avg ESG" fill={T.indigo} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="sbtiCoverage" name="SBTi %" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DataTable
          columns={[
            { label: 'Sector', key: 'fullSector', render: (r) => <span style={{ fontWeight: 600 }}>{r.fullSector}</span> },
            { label: 'Companies', key: 'companies', align: 'center' },
            { label: 'Avg Emissions (tCO2e)', key: 'avgEmissions', align: 'right', render: (r) => r.avgEmissions.toLocaleString() },
            { label: 'Avg ESG', key: 'avgESG', align: 'center', render: (r) => <span style={{ fontWeight: 600, color: r.avgESG >= 60 ? T.green : r.avgESG >= 40 ? T.amber : T.red }}>{r.avgESG}</span> },
            { label: 'SBTi Coverage', key: 'sbtiCoverage', align: 'center', render: (r) => `${r.sbtiCoverage}%` }
          ]}
          data={sectorEmissionsChart}
        />

        {/* ════════════════════════════════════════════════════════════
           SECTION 7 — REGULATORY LANDSCAPE
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="regulatory" number="07" title="Regulatory Landscape"
          subtitle="India's evolving climate disclosure and carbon pricing framework" />

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 24px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Regulatory Timeline</h4>
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            {regulatoryTimeline.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, marginBottom: i < regulatoryTimeline.length - 1 ? 28 : 0, position: 'relative' }}>
                {/* Timeline line */}
                {i < regulatoryTimeline.length - 1 && (
                  <div style={{ position: 'absolute', left: -20, top: 24, width: 2, height: 'calc(100% + 4px)', background: T.border }} />
                )}
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -26, top: 4, width: 14, height: 14, borderRadius: '50%',
                  background: item.color, border: `3px solid ${T.card}`, boxShadow: `0 0 0 2px ${item.color}40`
                }} />
                <div style={{ flex: '0 0 60px' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.year}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <Callout title="BRSR Framework" color={T.indigo}>
            SEBI's Business Responsibility and Sustainability Reporting (BRSR) is mandatory for top 1000 listed entities. BRSR Core assurance requirements began FY2024, with scope expanding annually. Covers 9 ESG principles with quantitative KPIs.
          </Callout>
          <Callout title="Indian Carbon Market" color={T.green}>
            The Bureau of Energy Efficiency (BEE) is operationalizing India's compliance carbon market under the Energy Conservation Act 2001 amendment. Initial sectors include thermal power, steel, cement, and aluminium.
          </Callout>
        </div>

        {/* ════════════════════════════════════════════════════════════
           SECTION 8 — EMISSION FACTORS
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="emissions" number="08" title="CEDA Emission Factors"
          subtitle="Top 20 India-specific sectoral emission intensities (kgCO2/$USD)" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Emission Intensity by Sector</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={emissionFactors} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v) => `${v.toFixed(3)} kgCO2/$`} />
                <Bar dataKey="ef_kgco2_usd" name="EF (kgCO2/$)" fill={T.navy} radius={[0, 4, 4, 0]}>
                  {emissionFactors.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <DataTable
              maxHeight={440}
              columns={[
                { label: 'CEDA Code', key: 'cedaCode' },
                { label: 'Sector', key: 'sector', render: (r) => <span style={{ fontWeight: 600 }}>{r.sector}</span> },
                { label: 'EF (kgCO2/$)', key: 'ef_kgco2_usd', align: 'right', render: (r) => (r.ef_kgco2_usd || 0).toFixed(4) }
              ]}
              data={emissionFactors}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
           SECTION 9 — RISK DEEP-DIVE
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="risk-deep-dive" number="09" title="Risk Deep-Dive & Scenario Analysis"
          subtitle="Transition scenario stress testing across sectors" />

        {/* Scenario selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.sub, fontFamily: 'JetBrains Mono, monospace' }}>SCENARIO</label>
          {scenarioNames.map((name, i) => (
            <button
              key={i}
              onClick={() => setScenarioIdx(i)}
              style={{
                padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                border: scenarioIdx === i ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                background: scenarioIdx === i ? T.navy : T.card,
                color: scenarioIdx === i ? '#fff' : T.text,
                fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                transition: 'all 0.2s'
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>
              Scenario Impact: {scenarioNames[scenarioIdx]}
            </h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scenarioImpactData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.fullSector}</div>
                      <div>Baseline: {d.baseline.toLocaleString()} tCO2e</div>
                      <div>Scenario: {d.scenario.toLocaleString()} tCO2e</div>
                      <div style={{ color: d.delta < 0 ? T.green : T.red }}>Delta: {d.delta > 0 ? '+' : ''}{d.delta.toLocaleString()} tCO2e</div>
                    </div>
                  );
                }} />
                <Legend verticalAlign="top" />
                <Bar dataKey="baseline" name="Baseline" fill={T.border} />
                <Bar dataKey="scenario" name="Scenario" fill={scenarioIdx <= 2 ? T.green : T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Delta from Baseline (tCO2e)</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scenarioImpactData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke={T.text} strokeWidth={1} />
                <Tooltip />
                <Bar dataKey="delta" name="Delta" radius={[4, 4, 4, 4]}>
                  {scenarioImpactData.map((d, i) => (
                    <Cell key={i} fill={d.delta < 0 ? T.green : d.delta > 0 ? T.red : T.sub} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk distribution table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Company Risk Distribution</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Low Risk (<2.0 deg C)', count: filteredCompanies.filter(c => (c.temperatureAlignment_c || 0) < 2.0).length, color: T.green },
              { label: 'Medium Risk (2.0-2.5 deg C)', count: filteredCompanies.filter(c => (c.temperatureAlignment_c || 0) >= 2.0 && (c.temperatureAlignment_c || 0) < 2.5).length, color: T.amber },
              { label: 'High Risk (2.5-3.0 deg C)', count: filteredCompanies.filter(c => (c.temperatureAlignment_c || 0) >= 2.5 && (c.temperatureAlignment_c || 0) < 3.0).length, color: T.red },
              { label: 'Critical (>3.0 deg C)', count: filteredCompanies.filter(c => (c.temperatureAlignment_c || 0) >= 3.0).length, color: '#7f1d1d' }
            ].map((bucket, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 16, background: `${bucket.color}08`, borderRadius: 10, border: `1px solid ${bucket.color}30` }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: bucket.color }}>{bucket.count}</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{bucket.label}</div>
                <div style={{
                  marginTop: 8, height: 6, borderRadius: 3, background: T.border, overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: bucket.color,
                    width: `${filteredCompanies.length > 0 ? (bucket.count / filteredCompanies.length) * 100 : 0}%`,
                    transition: 'width 0.5s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Callout title="Transition Risk Assessment" color={T.amber}>
          Under the {scenarioNames[scenarioIdx]} scenario, the portfolio shows a {scenarioMultipliers[scenarioIdx] < 1 ? 'reduction' : 'increase'} in aggregate emissions of {Math.abs(Math.round((scenarioMultipliers[scenarioIdx] - 1) * 100))}%. Sectors with high CBAM exposure face compounding regulatory and transition pressures. Active engagement with high-temperature-alignment companies is recommended.
        </Callout>

        {/* ════════════════════════════════════════════════════════════
           SECTION 10 — APPENDIX & METHODOLOGY
           ════════════════════════════════════════════════════════════ */}
        <div style={{ height: 48 }} />
        <SectionHeader id="appendix" number="10" title="Appendix & Methodology"
          subtitle="Data sources, calculation methodologies, and disclaimers" />

        <button
          onClick={() => setShowMethodology(prev => !prev)}
          style={{
            padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${T.navy}`, background: showMethodology ? T.navy : T.card,
            color: showMethodology ? '#fff' : T.navy, fontSize: 14, fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace', marginBottom: 20, transition: 'all 0.2s'
          }}
        >
          {showMethodology ? 'Hide Methodology Details' : 'Show Methodology Details'}
        </button>

        {showMethodology && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {[
              { title: 'PCAF Financed Emissions', items: ['PCAF Global Standard (2022)', 'Asset class: Listed equity & corporate bonds', 'Attribution: Enterprise Value Including Cash (EVIC)', 'Data quality score: 1-5 (weighted average reported)'] },
              { title: 'Temperature Alignment', items: ['SBTi portfolio temperature methodology', 'Scope 1+2 trajectory analysis', 'Company-level Implied Temperature Rise (ITR)', 'Budget approach with sector decarbonization pathways'] },
              { title: 'SFDR PAI Indicators', items: ['14 mandatory + 2 additional PAIs', 'PAI-1: GHG Emissions (Scope 1+2+3)', 'PAI-2: Carbon Footprint per EUR M invested', 'PAI-3: GHG intensity of investee companies'] },
              { title: 'EU Taxonomy Alignment', items: ['6 environmental objectives screening', 'Substantial contribution + DNSH criteria', 'Revenue-based alignment percentage', 'India-adapted activity classification'] },
              { title: 'CBAM Methodology', items: ['EU CBAM Regulation (EU) 2023/956', 'Direct + indirect emissions per tonne', 'India carbon price differential analysis', 'Commodity-level vulnerability scoring'] },
              { title: 'Physical Risk', items: ['NGFS climate scenarios (Phase IV)', 'Acute: flood, cyclone, extreme heat', 'Chronic: sea level rise, water stress', 'Asset-level geospatial risk mapping'] }
            ].map((card, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px' }}>
                <h5 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.navy }}>{card.title}</h5>
                <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
                  {card.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Data sources */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>Data Sources</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[
              { source: 'Nifty 50 Constituents', provider: 'NSE India', period: 'FY2024' },
              { source: 'GHG Emissions (Scope 1-3)', provider: 'CDP / Company disclosures', period: 'FY2023-24' },
              { source: 'ESG Scores', provider: 'MSCI / Sustainalytics', period: 'Latest available' },
              { source: 'SBTi Targets', provider: 'SBTi Public Database', period: 'As of Q1 2026' },
              { source: 'CBAM Exposure', provider: 'DGFT / Eurostat', period: 'CY2023' },
              { source: 'Emission Factors', provider: 'CEDA India (2025)', period: 'kgCO2e/USD' },
              { source: 'CO2 Trajectory', provider: 'OWID / IEA', period: '2000-2050' },
              { source: 'Regulatory Framework', provider: 'SEBI / MoEFCC / BEE', period: 'Current' }
            ].map((ds, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: T.surface, borderRadius: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ds.source}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{ds.provider} | {ds.period}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: `${T.amber}08`, border: `1px solid ${T.amber}30`, borderRadius: 12,
          padding: '20px 24px', borderLeft: `4px solid ${T.amber}`
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, color: T.amber, fontFamily: 'JetBrains Mono, monospace' }}>Disclaimer</h4>
          <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.7, margin: 0 }}>
            This report is generated by A2 Intelligence for informational and analytical purposes only. It does not constitute investment advice, financial guidance, or a recommendation to buy, sell, or hold any securities. All data is sourced from publicly available databases, company disclosures, and proprietary analytical models. While every effort has been made to ensure accuracy, A2 Intelligence makes no warranties regarding completeness or suitability for any particular purpose. Climate risk assessments involve inherent uncertainties in forward-looking projections. Users should conduct independent due diligence before making investment decisions. Past performance and current analytics are not indicative of future results. CBAM exposure estimates are based on current regulatory proposals and may change with final implementation rules.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 40, paddingTop: 24, borderTop: `2px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>A2 INTELLIGENCE</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>by AA Impact Inc.</div>
          </div>
          <div style={{ fontSize: 12, color: T.sub, textAlign: 'right' }}>
            <div>Report generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div style={{ marginTop: 2 }}>Nifty 50 Universe | {NIFTY_50.length} constituents | 12 engines</div>
          </div>
        </div>

      </div>
    </div>
  );
}
