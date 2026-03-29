import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = [T.red, '#ea580c', T.amber, T.gold, T.sage, T.green, T.navy, '#7c3aed', '#0d9488', '#ec4899'];

/* ================================================================
   WATER RISK BY COUNTRY — WRI Aqueduct-style 5-score system (1-5)
   ================================================================ */
const WATER_RISK_BY_COUNTRY = {
  IN: { overall: 4.2, physical: 4.5, regulatory: 3.8, reputational: 3.5, baseline_stress: 'Extremely High', flood_risk: 'High', drought_risk: 'Extremely High', water_quality: 'Poor', groundwater_depletion: 'Severe', seasonal_variability: 'High' },
  US: { overall: 2.8, physical: 3.0, regulatory: 2.5, reputational: 2.2, baseline_stress: 'Medium-High', flood_risk: 'Medium', drought_risk: 'High (West)', water_quality: 'Good', groundwater_depletion: 'Moderate', seasonal_variability: 'Medium' },
  CN: { overall: 3.8, physical: 4.0, regulatory: 3.5, reputational: 3.2, baseline_stress: 'High', flood_risk: 'High', drought_risk: 'High (North)', water_quality: 'Poor', groundwater_depletion: 'Severe (North)', seasonal_variability: 'High' },
  GB: { overall: 2.2, physical: 2.5, regulatory: 2.0, reputational: 1.8, baseline_stress: 'Low-Medium', flood_risk: 'Medium', drought_risk: 'Low', water_quality: 'Good', groundwater_depletion: 'Low', seasonal_variability: 'Low' },
  DE: { overall: 2.0, physical: 2.2, regulatory: 1.8, reputational: 1.5, baseline_stress: 'Low-Medium', flood_risk: 'Medium', drought_risk: 'Low-Medium', water_quality: 'Good', groundwater_depletion: 'Low', seasonal_variability: 'Low' },
  JP: { overall: 2.5, physical: 2.8, regulatory: 2.2, reputational: 2.0, baseline_stress: 'Medium', flood_risk: 'Very High', drought_risk: 'Low', water_quality: 'Good', groundwater_depletion: 'Low', seasonal_variability: 'Medium' },
  AU: { overall: 3.5, physical: 4.0, regulatory: 3.0, reputational: 2.8, baseline_stress: 'High', flood_risk: 'Medium', drought_risk: 'Very High', water_quality: 'Good', groundwater_depletion: 'High', seasonal_variability: 'Very High' },
  BR: { overall: 2.5, physical: 2.8, regulatory: 2.5, reputational: 2.8, baseline_stress: 'Medium', flood_risk: 'High', drought_risk: 'Medium', water_quality: 'Medium', groundwater_depletion: 'Low', seasonal_variability: 'Medium' },
  ZA: { overall: 3.8, physical: 4.2, regulatory: 3.5, reputational: 3.0, baseline_stress: 'Extremely High', flood_risk: 'Low', drought_risk: 'Very High', water_quality: 'Poor', groundwater_depletion: 'High', seasonal_variability: 'High' },
  SG: { overall: 3.0, physical: 3.5, regulatory: 2.0, reputational: 1.5, baseline_stress: 'High', flood_risk: 'Medium', drought_risk: 'High (import dependent)', water_quality: 'Good', groundwater_depletion: 'N/A', seasonal_variability: 'Low' },
  KR: { overall: 2.5, physical: 2.8, regulatory: 2.2, reputational: 2.0, baseline_stress: 'Medium', flood_risk: 'High', drought_risk: 'Medium', water_quality: 'Good', groundwater_depletion: 'Low', seasonal_variability: 'Medium' },
  FR: { overall: 2.2, physical: 2.5, regulatory: 1.8, reputational: 1.8, baseline_stress: 'Low-Medium', flood_risk: 'Medium', drought_risk: 'Medium (South)', water_quality: 'Good', groundwater_depletion: 'Low', seasonal_variability: 'Low' },
  CA: { overall: 1.8, physical: 1.5, regulatory: 2.0, reputational: 1.8, baseline_stress: 'Low', flood_risk: 'Medium', drought_risk: 'Low', water_quality: 'Good', groundwater_depletion: 'Low', seasonal_variability: 'Medium' },
  HK: { overall: 3.2, physical: 3.5, regulatory: 2.5, reputational: 2.0, baseline_stress: 'High', flood_risk: 'High', drought_risk: 'High (import)', water_quality: 'Medium', groundwater_depletion: 'N/A', seasonal_variability: 'Low' },
};
const COUNTRY_NAMES = { IN: 'India', US: 'United States', CN: 'China', GB: 'United Kingdom', DE: 'Germany', JP: 'Japan', AU: 'Australia', BR: 'Brazil', ZA: 'South Africa', SG: 'Singapore', KR: 'South Korea', FR: 'France', CA: 'Canada', HK: 'Hong Kong' };

/* ================================================================
   SECTOR WATER INTENSITY
   ================================================================ */
const SECTOR_WATER_INTENSITY = {
  Energy:                     { withdrawal_ml_per_mn: 850, consumption_ml_per_mn: 320, water_dependent_revenue_pct: 85, key_use: 'Cooling, processing, dust suppression' },
  Materials:                  { withdrawal_ml_per_mn: 1200, consumption_ml_per_mn: 450, water_dependent_revenue_pct: 92, key_use: 'Processing, refining, washing' },
  Utilities:                  { withdrawal_ml_per_mn: 2500, consumption_ml_per_mn: 180, water_dependent_revenue_pct: 95, key_use: 'Cooling (thermal), hydroelectric' },
  'Consumer Staples':         { withdrawal_ml_per_mn: 600, consumption_ml_per_mn: 380, water_dependent_revenue_pct: 78, key_use: 'Agriculture, food processing, packaging' },
  'Consumer Discretionary':   { withdrawal_ml_per_mn: 280, consumption_ml_per_mn: 120, water_dependent_revenue_pct: 45, key_use: 'Manufacturing, textile dyeing' },
  'Health Care':              { withdrawal_ml_per_mn: 350, consumption_ml_per_mn: 150, water_dependent_revenue_pct: 55, key_use: 'Pharmaceutical mfg, sterilization' },
  Financials:                 { withdrawal_ml_per_mn: 25, consumption_ml_per_mn: 10, water_dependent_revenue_pct: 5, key_use: 'Office cooling, data centres' },
  'Information Technology':   { withdrawal_ml_per_mn: 180, consumption_ml_per_mn: 95, water_dependent_revenue_pct: 35, key_use: 'Semiconductor fab, data center cooling' },
  'Communication Services':   { withdrawal_ml_per_mn: 40, consumption_ml_per_mn: 15, water_dependent_revenue_pct: 8, key_use: 'Data center cooling' },
  Industrials:                { withdrawal_ml_per_mn: 520, consumption_ml_per_mn: 210, water_dependent_revenue_pct: 62, key_use: 'Manufacturing, heavy engineering' },
  'Real Estate':              { withdrawal_ml_per_mn: 80, consumption_ml_per_mn: 35, water_dependent_revenue_pct: 20, key_use: 'Building operations, landscaping' },
};

/* ================================================================
   WATER STRESS TREND PROJECTIONS — 2025-2050
   ================================================================ */
const WATER_STRESS_TREND = [
  { year: 2025, global: 2.8, india: 4.2, china: 3.8, us: 2.8, sa: 3.8, australia: 3.5 },
  { year: 2030, global: 3.0, india: 4.4, china: 4.0, us: 3.0, sa: 4.0, australia: 3.8 },
  { year: 2035, global: 3.2, india: 4.5, china: 4.1, us: 3.1, sa: 4.2, australia: 4.0 },
  { year: 2040, global: 3.4, india: 4.7, china: 4.3, us: 3.2, sa: 4.4, australia: 4.2 },
  { year: 2045, global: 3.6, india: 4.8, china: 4.4, us: 3.4, sa: 4.5, australia: 4.4 },
  { year: 2050, global: 3.8, india: 5.0, china: 4.6, us: 3.5, sa: 4.7, australia: 4.5 },
];

/* ================================================================
   CDP WATER SECURITY TIERS
   ================================================================ */
const CDP_WATER_TIERS = { A: 'Leadership', 'A-': 'Leadership', B: 'Management', 'B-': 'Management', C: 'Awareness', 'C-': 'Awareness', D: 'Disclosure', 'D-': 'Disclosure', F: 'Non-response' };

/* ================================================================
   HELPERS
   ================================================================ */
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

function scoreWaterRisk(company, idx) {
  const country = company.country || 'US';
  const cRisk = WATER_RISK_BY_COUNTRY[country] || WATER_RISK_BY_COUNTRY.US;
  const sInt = SECTOR_WATER_INTENSITY[company.sector] || SECTOR_WATER_INTENSITY.Financials;
  const s = seed(idx + 13);
  const intensityFactor = sInt.withdrawal_ml_per_mn / 2500;
  const waterRisk = Math.min(5, cRisk.overall * 0.6 + intensityFactor * 2 + s * 0.5);
  const waterIntensity = Math.round(sInt.withdrawal_ml_per_mn * (0.7 + s * 0.6));
  const revenueAtRisk = Math.round(sInt.water_dependent_revenue_pct * (company.weight || 0.01) * 100);
  const cdpOptions = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F', 'F', 'F'];
  const cdpScore = cdpOptions[Math.floor(s * cdpOptions.length)];
  const waterEfficiency = s > 0.7 ? 'Leader' : s > 0.4 ? 'Average' : 'Laggard';
  return {
    waterRisk: Math.round(waterRisk * 10) / 10,
    countryRisk: cRisk,
    sectorIntensity: sInt,
    waterIntensity,
    revenueAtRisk,
    cdpScore,
    cdpTier: CDP_WATER_TIERS[cdpScore] || 'N/A',
    waterEfficiency,
    baselineStress: cRisk.baseline_stress,
    droughtRisk: cRisk.drought_risk,
    floodRisk: cRisk.flood_risk,
  };
}

function riskColor(score) {
  if (score >= 4.0) return T.red;
  if (score >= 3.0) return T.amber;
  if (score >= 2.0) return T.gold;
  return T.green;
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
export default function WaterStressPage() {
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
  const [sortBy, setSortBy] = useState('waterRisk');
  const [sortDir, setSortDir] = useState('desc');
  const [pricingIncrease, setPricingIncrease] = useState(50);

  const doSort = useCallback((field) => {
    setSortBy(prev => { setSortDir(prev === field ? (d => d === 'asc' ? 'desc' : 'asc') : () => 'desc'); return field; });
  }, []);

  /* -- Score every holding -- */
  const scoredHoldings = useMemo(() => {
    return portfolio.map((c, i) => ({ ...c, ...scoreWaterRisk(c, i) }));
  }, [portfolio]);

  /* -- Sorted -- */
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
    const avgRisk = scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.waterRisk, 0) / scoredHoldings.length * 10) / 10 : 0;
    const highStress = scoredHoldings.filter(h => h.waterRisk >= 3.5).length;
    const highStressPct = scoredHoldings.length ? Math.round((highStress / scoredHoldings.length) * 100) : 0;
    const totalWithdrawal = scoredHoldings.reduce((s, h) => s + h.waterIntensity, 0);
    const avgIntensity = scoredHoldings.length ? Math.round(totalWithdrawal / scoredHoldings.length) : 0;
    const extremeCountries = [...new Set(scoredHoldings.filter(h => h.countryRisk?.overall >= 3.8).map(h => h.country))].length;
    const droughtExposed = scoredHoldings.filter(h => ['Extremely High', 'Very High', 'High', 'High (West)', 'High (North)'].includes(h.droughtRisk)).length;
    const droughtPct = scoredHoldings.length ? Math.round((droughtExposed / scoredHoldings.length) * 100) : 0;
    const floodExposed = scoredHoldings.filter(h => ['Very High', 'High'].includes(h.floodRisk)).length;
    const floodPct = scoredHoldings.length ? Math.round((floodExposed / scoredHoldings.length) * 100) : 0;
    const avgWaterDepRev = scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.sectorIntensity.water_dependent_revenue_pct, 0) / scoredHoldings.length) : 0;
    return { avgRisk, highStressPct, totalWithdrawal, avgIntensity, extremeCountries, droughtPct, floodPct, avgWaterDepRev };
  }, [scoredHoldings]);

  /* -- Country heatmap data -- */
  const countryData = useMemo(() => {
    return Object.entries(WATER_RISK_BY_COUNTRY).map(([code, risk]) => ({
      code, name: COUNTRY_NAMES[code], ...risk,
      holdingsCount: scoredHoldings.filter(h => h.country === code).length,
    })).sort((a, b) => b.overall - a.overall);
  }, [scoredHoldings]);

  /* -- Stress category distribution -- */
  const stressDistribution = useMemo(() => {
    const cats = { 'Extremely High': 0, 'High': 0, 'Medium-High': 0, 'Medium': 0, 'Low-Medium': 0, 'Low': 0 };
    scoredHoldings.forEach(h => {
      const stress = h.baselineStress;
      if (stress in cats) cats[stress]++;
      else if (stress?.includes('Extremely')) cats['Extremely High']++;
      else if (stress?.includes('High')) cats['High']++;
      else cats['Medium']++;
    });
    return Object.entries(cats).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [scoredHoldings]);

  /* -- Sector intensity chart data -- */
  const sectorIntensityData = useMemo(() => {
    return Object.entries(SECTOR_WATER_INTENSITY).map(([sector, data]) => ({
      sector: sector.length > 14 ? sector.slice(0, 12) + '..' : sector,
      fullSector: sector,
      withdrawal: data.withdrawal_ml_per_mn,
      consumption: data.consumption_ml_per_mn,
    })).sort((a, b) => b.withdrawal - a.withdrawal);
  }, []);

  /* -- Water pricing scenario -- */
  const pricingScenario = useMemo(() => {
    const multiplier = pricingIncrease / 100;
    return scoredHoldings.filter(h => h.waterRisk >= 3.0).map(h => {
      const costIncrease = Math.round(h.waterIntensity * multiplier * 0.15);
      const revImpactPct = Math.round((costIncrease / (h.revenueAtRisk + 1)) * 100 * 10) / 10;
      return { ...h, costIncrease, revImpactPct };
    }).sort((a, b) => b.costIncrease - a.costIncrease);
  }, [scoredHoldings, pricingIncrease]);

  /* -- Scatter data for Physical vs Regulatory -- */
  const physRegScatter = useMemo(() => {
    return countryData.map(c => ({
      name: c.name, physical: c.physical, regulatory: c.regulatory, holdings: c.holdingsCount, code: c.code,
    }));
  }, [countryData]);

  /* -- Exports -- */
  const exportCSV = useCallback(() => {
    const header = ['Company', 'Country', 'Sector', 'Water Risk', 'Baseline Stress', 'Drought Risk', 'Flood Risk', 'Water Intensity (ML)', 'CDP Score', 'Revenue at Risk %'].join(',');
    const rows = sorted.map(h => [h.name, h.country, h.sector, h.waterRisk, h.baselineStress, h.droughtRisk, h.floodRisk, h.waterIntensity, h.cdpScore, h.revenueAtRisk].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'water_stress_analysis.csv'; a.click();
  }, [sorted]);
  const exportJSON = useCallback(() => {
    const data = { countryRisks: WATER_RISK_BY_COUNTRY, sectorIntensity: SECTOR_WATER_INTENSITY, holdings: sorted.map(h => ({ name: h.name, country: h.country, sector: h.sector, waterRisk: h.waterRisk, cdpScore: h.cdpScore })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'water_risk_report.json'; a.click();
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
              <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0, fontFamily: T.font }}>Water Stress & Risk Analyzer</h1>
              <Badge label="WRI Aqueduct" color={T.sage} />
              <Badge label="14 Countries" color={T.gold} />
              <Badge label="Sector Intensity" color={T.navy} />
              <Badge label="5 Risk Types" color={T.amber} />
            </div>
            <div style={{ fontSize: 13, color: T.textSec }}>WRI Aqueduct Water Risk Atlas methodology assessing physical, regulatory and reputational water risk exposure</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outline" onClick={exportCSV}>Export CSV</Btn>
            <Btn variant="outline" onClick={exportJSON}>Export JSON</Btn>
            <Btn variant="outline" onClick={exportPrint}>Print</Btn>
          </div>
        </div>

        {/* ── TABS ── */}
        <TabBar tabs={['Overview', 'Holdings', 'Scenarios', 'Engagement']} active={tab} onChange={setTab} />

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Portfolio Water Risk Score" value={metrics.avgRisk} sub="1 (low) to 5 (extremely high)" color={riskColor(metrics.avgRisk)} />
          <KpiCard label="High-Stress Holdings" value={`${metrics.highStressPct}%`} sub="risk score >= 3.5" color={T.red} />
          <KpiCard label="Total Water Withdrawal" value={`${(metrics.totalWithdrawal / 1000).toFixed(1)}K ML`} sub="megalitres across portfolio" />
          <KpiCard label="Avg Water Intensity" value={`${metrics.avgIntensity} ML`} sub="ML per USD Mn revenue" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <KpiCard label="Extreme-Stress Countries" value={metrics.extremeCountries} sub="countries with overall >= 3.8" color={T.red} />
          <KpiCard label="Drought Exposure" value={`${metrics.droughtPct}%`} sub="holdings in high drought zones" color={T.amber} />
          <KpiCard label="Flood Exposure" value={`${metrics.floodPct}%`} sub="holdings in high flood zones" color={T.navy} />
          <KpiCard label="Water-Dependent Revenue" value={`${metrics.avgWaterDepRev}%`} sub="average across portfolio" color={T.sage} />
        </div>

        {/* ════════════════════════ OVERVIEW TAB ════════════════════════ */}
        {tab === 'Overview' && (<>
          {/* -- Country Water Risk Heatmap -- */}
          <Section title="Country Water Risk Heatmap" sub="5 risk sub-scores per country (1-5 scale) | color-coded by severity">
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr>
                    {['Country', 'Overall', 'Physical', 'Regulatory', 'Reputational', 'Baseline Stress', 'Flood Risk', 'Drought Risk', 'Water Quality', 'Groundwater', 'Holdings'].map(h => (
                      <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {countryData.map((c, i) => (
                    <tr key={c.code} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                      {[c.overall, c.physical, c.regulatory, c.reputational].map((v, j) => (
                        <td key={j} style={{ padding: '10px 8px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontWeight: 700, fontSize: 12, background: `${riskColor(v)}15`, color: riskColor(v) }}>{v.toFixed(1)}</span>
                        </td>
                      ))}
                      <td style={{ padding: '10px 8px', fontSize: 11, color: T.text }}>{c.baseline_stress}</td>
                      <td style={{ padding: '10px 8px', fontSize: 11, color: T.text }}>{c.flood_risk}</td>
                      <td style={{ padding: '10px 8px', fontSize: 11, color: T.text }}>{c.drought_risk}</td>
                      <td style={{ padding: '10px 8px', fontSize: 11, color: T.text }}>{c.water_quality}</td>
                      <td style={{ padding: '10px 8px', fontSize: 11, color: T.text }}>{c.groundwater_depletion}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: T.navy }}>{c.holdingsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          {/* -- Portfolio Water Exposure Pie -- */}
          <Section title="Portfolio Water Exposure" sub="Distribution of holdings across water stress categories">
            <Card>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={stressDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {stressDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Sector Water Intensity -- */}
          <Section title="Sector Water Intensity" sub="Water withdrawal and consumption (ML per USD Mn revenue) by sector">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={sectorIntensityData} margin={{ left: 10, right: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.font }} angle={-35} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="withdrawal" name="Withdrawal (ML/Mn)" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consumption" name="Consumption (ML/Mn)" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Water Risk Trend 2025-2050 -- */}
          <Section title="Water Risk Trend 2025-2050" sub="Projected water stress under climate change (RCP 4.5 scenario)">
            <Card>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={WATER_STRESS_TREND} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textMut }} />
                  <YAxis domain={[1.5, 5.2]} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'Risk Score (1-5)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="india" name="India" stroke={T.red} fill={`${T.red}20`} strokeWidth={2} />
                  <Area type="monotone" dataKey="sa" name="South Africa" stroke={T.amber} fill={`${T.amber}15`} strokeWidth={2} />
                  <Area type="monotone" dataKey="china" name="China" stroke="#ea580c" fill="#ea580c15" strokeWidth={2} />
                  <Area type="monotone" dataKey="australia" name="Australia" stroke={T.gold} fill={`${T.gold}15`} strokeWidth={2} />
                  <Area type="monotone" dataKey="global" name="Global Avg" stroke={T.navy} fill={`${T.navy}10`} strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </>)}

        {/* ════════════════════════ HOLDINGS TAB ════════════════════════ */}
        {tab === 'Holdings' && (<>
          <Section title="Holdings Water Risk Table" sub={`${sorted.length} companies | click column headers to sort`}>
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr>
                    <SortHeader label="Company" field="name" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Country" field="country" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Water Risk" field="waterRisk" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Baseline Stress" field="baselineStress" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Drought" field="droughtRisk" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Flood" field="floodRisk" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Intensity (ML)" field="waterIntensity" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="CDP Water" field="cdpScore" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                    <SortHeader label="Rev at Risk" field="revenueAtRisk" sortBy={sortBy} sortDir={sortDir} onSort={doSort} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((h, i) => (
                    <tr key={h.id || i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: T.navy }}>{h.name}</td>
                      <td style={{ padding: '10px 8px', color: T.textSec }}>{COUNTRY_NAMES[h.country] || h.country}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 8, fontWeight: 700, fontSize: 12, background: `${riskColor(h.waterRisk)}15`, color: riskColor(h.waterRisk) }}>{h.waterRisk}</span>
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: 11 }}>{h.baselineStress}</td>
                      <td style={{ padding: '10px 8px', fontSize: 11 }}>{h.droughtRisk}</td>
                      <td style={{ padding: '10px 8px', fontSize: 11 }}>{h.floodRisk}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{h.waterIntensity.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px' }}><Badge label={h.cdpScore} color={h.cdpScore.startsWith('A') ? T.green : h.cdpScore.startsWith('B') ? T.sage : h.cdpScore.startsWith('C') ? T.amber : T.red} /></td>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: T.navy }}>{h.revenueAtRisk}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No portfolio loaded. Add holdings via Portfolio Manager.</div>}
            </Card>
          </Section>

          {/* -- CDP Water Security Integration -- */}
          <Section title="CDP Water Security Integration" sub="Companies reporting to CDP Water Security by tier">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {['A / A-', 'B / B-', 'C / C-', 'D / D-', 'F'].map((tier, idx) => {
                  const labels = tier.split(' / ').map(t => t.trim());
                  const count = scoredHoldings.filter(h => labels.some(l => h.cdpScore === l) || (tier === 'F' && h.cdpScore === 'F')).length;
                  const tierNames = ['Leadership', 'Management', 'Awareness', 'Disclosure', 'Non-response'];
                  const colors = [T.green, T.sage, T.amber, T.gold, T.red];
                  return (
                    <div key={tier} style={{ padding: 16, borderRadius: 8, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: colors[idx] }}>{count}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginTop: 2 }}>{tier}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{tierNames[idx]}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>
        </>)}

        {/* ════════════════════════ SCENARIOS TAB ════════════════════════ */}
        {tab === 'Scenarios' && (<>
          {/* -- Water Pricing Scenario -- */}
          <Section title="Water Pricing Scenario" sub="Impact of water price increase in high-stress regions">
            <Card>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Water Price Increase: {pricingIncrease}%</label>
                  <input type="range" min={10} max={200} step={10} value={pricingIncrease} onChange={e => setPricingIncrease(Number(e.target.value))} style={{ width: '100%', accentColor: T.navy }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}><span>10%</span><span>100%</span><span>200%</span></div>
                </div>
                <div style={{ padding: 14, borderRadius: 8, background: `${T.red}10`, textAlign: 'center', minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>Companies Affected</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{pricingScenario.length}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>in high-stress regions</div>
                </div>
                <div style={{ padding: 14, borderRadius: 8, background: `${T.amber}10`, textAlign: 'center', minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>Total Cost Increase</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>${(pricingScenario.reduce((s, h) => s + h.costIncrease, 0) / 1000).toFixed(1)}M</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>additional annual cost</div>
                </div>
              </div>
              {pricingScenario.length > 0 && (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                    <thead>
                      <tr>
                        {['Company', 'Country', 'Water Risk', 'Cost Increase (USD K)', 'Revenue Impact %'].map(h => (
                          <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pricingScenario.slice(0, 20).map((h, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{h.name}</td>
                          <td style={{ padding: '8px', color: T.textSec }}>{COUNTRY_NAMES[h.country] || h.country}</td>
                          <td style={{ padding: '8px' }}><span style={{ color: riskColor(h.waterRisk), fontWeight: 700 }}>{h.waterRisk}</span></td>
                          <td style={{ padding: '8px', fontWeight: 600, color: T.red }}>${h.costIncrease.toLocaleString()}</td>
                          <td style={{ padding: '8px', fontWeight: 600, color: T.amber }}>{h.revImpactPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </Section>

          {/* -- Physical vs Regulatory Water Risk -- */}
          <Section title="Physical vs Regulatory Water Risk" sub="Country positioning by physical and regulatory risk dimensions">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ left: 20, bottom: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" dataKey="physical" name="Physical Risk" domain={[1, 5]} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'Physical Water Risk', position: 'insideBottom', offset: -10, fontSize: 12, fill: T.textSec }} />
                  <YAxis type="number" dataKey="regulatory" name="Regulatory Risk" domain={[1, 5]} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'Regulatory Risk', angle: -90, position: 'insideLeft', fontSize: 12, fill: T.textSec }} />
                  <ZAxis dataKey="holdings" range={[40, 250]} name="Holdings" />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, fontFamily: T.font }}>
                      <div style={{ fontWeight: 700, color: T.navy }}>{d?.name}</div>
                      <div>Physical: {d?.physical}</div><div>Regulatory: {d?.regulatory}</div><div>Holdings: {d?.holdings}</div>
                    </div>);
                  }} />
                  <Scatter data={physRegScatter} fill={T.navy}>
                    {physRegScatter.map((e, i) => <Cell key={i} fill={e.physical > 3.5 && e.regulatory > 3 ? T.red : e.physical > 3 ? T.amber : T.sage} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* -- Cross-reference to Physical Risk -- */}
          <Section title="Cross-reference to Physical Risk" sub="Link to EP-H7 drought and flood hazard analysis">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { hazard: 'Drought', desc: 'Prolonged water scarcity affecting operations', link: '/climate-physical-risk', color: T.amber, metric: `${metrics.droughtPct}% exposed` },
                  { hazard: 'Flood', desc: 'Acute flood events damaging infrastructure', link: '/climate-physical-risk', color: T.navy, metric: `${metrics.floodPct}% exposed` },
                  { hazard: 'Water Quality', desc: 'Degradation affecting input water usability', link: '/ecosystem-services', color: T.sage, metric: `${scoredHoldings.filter(h => h.countryRisk?.water_quality === 'Poor').length} holdings in poor areas` },
                ].map(h => (
                  <div key={h.hazard} style={{ padding: 16, borderRadius: 8, border: `2px solid ${h.color}30`, background: `${h.color}08`, cursor: 'pointer' }} onClick={() => navigate(h.link)}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: h.color, marginBottom: 4 }}>{h.hazard}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{h.desc}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{h.metric}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </>)}

        {/* ════════════════════════ ENGAGEMENT TAB ════════════════════════ */}
        {tab === 'Engagement' && (<>
          {/* -- Water Efficiency Best Practices -- */}
          <Section title="Water Efficiency Best Practices" sub="Per sector: what leaders are doing to reduce water use">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { sector: 'Utilities', practices: ['Closed-loop cooling systems', 'Dry cooling technology', 'Water recycling for 90%+ of operations'], savings: '40-60%' },
                  { sector: 'Materials', practices: ['Zero liquid discharge (ZLD) plants', 'Rainwater harvesting', 'Process water recycling'], savings: '30-50%' },
                  { sector: 'Energy', practices: ['Air-cooled condensers', 'Produced water treatment and reuse', 'Solar desalination'], savings: '35-55%' },
                  { sector: 'Consumer Staples', practices: ['Drip irrigation', 'Water footprint certification', 'Supplier water audits'], savings: '25-40%' },
                  { sector: 'Information Technology', practices: ['Free cooling data centers', 'Water-positive commitments', 'Onsite water treatment'], savings: '50-70%' },
                  { sector: 'Industrials', practices: ['Industrial symbiosis (water sharing)', 'Smart metering', 'Cascade water use'], savings: '20-35%' },
                ].map(bp => (
                  <div key={bp.sector} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{bp.sector}</div>
                      <Badge label={`${bp.savings} reduction`} color={T.green} />
                    </div>
                    {bp.practices.map((p, i) => (
                      <div key={i} style={{ fontSize: 12, color: T.text, padding: '3px 0', paddingLeft: 12, borderLeft: `2px solid ${T.sage}40` }}>{p}</div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* -- Engagement Recommendations -- */}
          <Section title="Engagement Recommendations" sub="Priority actions for companies in extremely high-stress regions">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {[
                  { priority: 'P1', action: 'Request CDP Water Security disclosure from all non-responding holdings', target: 'F-rated companies', color: T.red },
                  { priority: 'P1', action: 'Engage holdings in India and South Africa on water efficiency targets and groundwater dependency', target: 'Extremely High stress countries', color: T.red },
                  { priority: 'P1', action: 'Require water stress risk assessment in capital expenditure decisions for new facilities', target: 'All high water-intensity sectors', color: T.red },
                  { priority: 'P2', action: 'Request adoption of context-based water targets (e.g., Alliance for Water Stewardship)', target: 'Materials, Utilities, Energy', color: T.amber },
                  { priority: 'P2', action: 'Advocate for water pricing that reflects true scarcity value in policy engagement', target: 'All sectors', color: T.amber },
                  { priority: 'P3', action: 'Encourage nature-based solutions for water management (constructed wetlands, watershed restoration)', target: 'Real Estate, Consumer Staples', color: T.sage },
                  { priority: 'P3', action: 'Request science-based water targets aligned with SBTN freshwater methodology', target: 'All holdings', color: T.sage },
                ].map((r, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Badge label={r.priority} color={r.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: T.navy, fontWeight: 600, marginBottom: 2 }}>{r.action}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>Target: {r.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* -- CDP Water Security detail table -- */}
          <Section title="CDP Water Security Detailed View" sub="Holdings grouped by CDP Water Security response tier">
            <Card>
              {['Leadership', 'Management', 'Awareness', 'Non-response'].map(tier => {
                const holdings = scoredHoldings.filter(h => h.cdpTier === tier);
                if (holdings.length === 0) return null;
                const tierColor = tier === 'Leadership' ? T.green : tier === 'Management' ? T.sage : tier === 'Awareness' ? T.amber : T.red;
                return (
                  <div key={tier} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <Badge label={tier} color={tierColor} />
                      <span style={{ fontSize: 12, color: T.textMut }}>{holdings.length} companies</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {holdings.slice(0, 12).map((h, i) => (
                        <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: T.surfaceH, color: T.navy, border: `1px solid ${T.border}` }}>{h.name}</span>
                      ))}
                      {holdings.length > 12 && <span style={{ padding: '4px 10px', fontSize: 11, color: T.textMut }}>+{holdings.length - 12} more</span>}
                    </div>
                  </div>
                );
              })}
            </Card>
          </Section>
        </>)}

        {/* ── CROSS-NAVIGATION ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <Btn variant="outline" onClick={() => navigate('/tnfd-leap')}>TNFD LEAP Assessment</Btn>
          <Btn variant="outline" onClick={() => navigate('/biodiversity-credits')}>Biodiversity Credits</Btn>
          <Btn variant="outline" onClick={() => navigate('/ecosystem-services')}>Ecosystem Services</Btn>
          <Btn variant="outline" onClick={() => navigate('/climate-physical-risk')}>Physical Risk</Btn>
          <Btn variant="outline" onClick={() => navigate('/deforestation-risk')}>Deforestation Risk</Btn>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0 12px', fontSize: 11, color: T.textMut }}>
          Water Stress & Risk Analyzer | WRI Aqueduct Methodology | EP-M4
        </div>
      </div>
    </div>
  );
}
