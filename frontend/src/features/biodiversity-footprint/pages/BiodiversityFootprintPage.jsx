import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6'];

/* ================================================================
   BIODIVERSITY IMPACT FACTORS per sector (MSA methodology)
   ================================================================ */
const BIODIVERSITY_FACTORS = {
  Energy:                     { msa_loss_per_mn: 0.85, land_use_ha_per_mn: 12.5, water_stress_score: 72, key_species_impact: ['Marine mammals', 'Migratory birds', 'Reef ecosystems'], deforestation_risk: 'Medium', pollinator_dependency: 'Low' },
  Materials:                  { msa_loss_per_mn: 1.20, land_use_ha_per_mn: 18.0, water_stress_score: 68, key_species_impact: ['Endemic species', 'Freshwater fish', 'Soil organisms'], deforestation_risk: 'Very High', pollinator_dependency: 'Low' },
  Industrials:                { msa_loss_per_mn: 0.45, land_use_ha_per_mn: 5.5, water_stress_score: 48, key_species_impact: ['Urban wildlife', 'Riparian species'], deforestation_risk: 'Low', pollinator_dependency: 'Low' },
  Utilities:                  { msa_loss_per_mn: 0.65, land_use_ha_per_mn: 8.0, water_stress_score: 82, key_species_impact: ['Aquatic ecosystems', 'Wetland species', 'Migratory fish'], deforestation_risk: 'Medium', pollinator_dependency: 'Low' },
  Financials:                 { msa_loss_per_mn: 0.08, land_use_ha_per_mn: 0.5, water_stress_score: 15, key_species_impact: ['Indirect via lending'], deforestation_risk: 'Low (indirect: High)', pollinator_dependency: 'Low' },
  'Information Technology':   { msa_loss_per_mn: 0.12, land_use_ha_per_mn: 1.0, water_stress_score: 35, key_species_impact: ['E-waste impact on soil organisms'], deforestation_risk: 'Low', pollinator_dependency: 'Low' },
  'Health Care':              { msa_loss_per_mn: 0.22, land_use_ha_per_mn: 2.0, water_stress_score: 40, key_species_impact: ['Pharmaceutical pollution in waterways'], deforestation_risk: 'Low', pollinator_dependency: 'Medium' },
  'Consumer Discretionary':   { msa_loss_per_mn: 0.35, land_use_ha_per_mn: 4.0, water_stress_score: 52, key_species_impact: ['Textile pollution', 'Microplastics in marine'], deforestation_risk: 'Medium', pollinator_dependency: 'Low' },
  'Consumer Staples':         { msa_loss_per_mn: 0.95, land_use_ha_per_mn: 22.0, water_stress_score: 75, key_species_impact: ['Pollinators', 'Soil biodiversity', 'Deforestation-linked species'], deforestation_risk: 'Very High', pollinator_dependency: 'Very High' },
  'Communication Services':   { msa_loss_per_mn: 0.05, land_use_ha_per_mn: 0.3, water_stress_score: 12, key_species_impact: ['Tower/cable impact on birds'], deforestation_risk: 'Low', pollinator_dependency: 'Low' },
  'Real Estate':              { msa_loss_per_mn: 0.55, land_use_ha_per_mn: 8.5, water_stress_score: 45, key_species_impact: ['Urban habitat fragmentation', 'Tree canopy loss'], deforestation_risk: 'Medium', pollinator_dependency: 'Low' },
};

const SECTOR_KEYS = Object.keys(BIODIVERSITY_FACTORS);

/* ================================================================
   SPECIES THREAT CATEGORIES (IUCN Red List alignment)
   ================================================================ */
const SPECIES_THREAT_CATEGORIES = [
  { category: 'Critically Endangered', abbrev: 'CR', count_affected: 8971, icon: '🔴', portfolio_sectors: ['Energy', 'Materials', 'Consumer Staples'], description: 'Facing extremely high risk of extinction in the wild' },
  { category: 'Endangered', abbrev: 'EN', count_affected: 16118, icon: '🟠', portfolio_sectors: ['Energy', 'Materials', 'Utilities', 'Consumer Staples', 'Real Estate'], description: 'Facing very high risk of extinction in the wild' },
  { category: 'Vulnerable', abbrev: 'VU', count_affected: 17038, icon: '🟡', portfolio_sectors: ['All sectors with land use > 5 ha/Mn'], description: 'Facing high risk of extinction in the wild' },
  { category: 'Near Threatened', abbrev: 'NT', count_affected: 8459, icon: '🟢', portfolio_sectors: ['Consumer Discretionary', 'Industrials'], description: 'Close to qualifying for a threatened category' },
];

/* ================================================================
   ECOSYSTEM INTEGRITY TREND (projected portfolio footprint)
   ================================================================ */
const INTEGRITY_TREND = [
  { year: 2020, portfolio_msa: 0.72, benchmark: 0.70, target: 0.72 },
  { year: 2021, portfolio_msa: 0.71, benchmark: 0.69, target: 0.73 },
  { year: 2022, portfolio_msa: 0.70, benchmark: 0.68, target: 0.74 },
  { year: 2023, portfolio_msa: 0.69, benchmark: 0.67, target: 0.76 },
  { year: 2024, portfolio_msa: 0.68, benchmark: 0.66, target: 0.78 },
  { year: 2025, portfolio_msa: 0.67, benchmark: 0.65, target: 0.80 },
  { year: 2026, portfolio_msa: 0.66, benchmark: 0.64, target: 0.82 },
  { year: 2027, portfolio_msa: 0.65, benchmark: 0.63, target: 0.84 },
  { year: 2028, portfolio_msa: 0.64, benchmark: 0.62, target: 0.86 },
  { year: 2029, portfolio_msa: 0.63, benchmark: 0.61, target: 0.88 },
  { year: 2030, portfolio_msa: 0.62, benchmark: 0.60, target: 0.90 },
];

/* ================================================================
   BIODIVERSITY PRESSURE DRIVERS
   ================================================================ */
const PRESSURE_DRIVERS = [
  { driver: 'Land use change', contribution_pct: 30, trend: 'Increasing', sectors: 'Materials, Consumer Staples, Real Estate', color: T.red },
  { driver: 'Overexploitation', contribution_pct: 23, trend: 'Stable', sectors: 'Consumer Staples, Energy', color: T.amber },
  { driver: 'Climate change', contribution_pct: 14, trend: 'Increasing', sectors: 'All sectors', color: T.navy },
  { driver: 'Pollution', contribution_pct: 14, trend: 'Increasing', sectors: 'Materials, Energy, Utilities, Consumer Discretionary', color: '#7c3aed' },
  { driver: 'Invasive species', contribution_pct: 11, trend: 'Stable', sectors: 'Consumer Staples, Real Estate', color: T.gold },
  { driver: 'Other', contribution_pct: 8, trend: 'Stable', sectors: 'Various', color: T.textMut },
];

/* ================================================================
   NATURE-POSITIVE TRANSITION PATHWAYS
   ================================================================ */
const TRANSITION_PATHWAYS = [
  { sector: 'Consumer Staples', action: 'Regenerative agriculture transition', msa_reduction: '35-45%', timeline: '3-7 years', investment: '$2-5M per major supplier', feasibility: 'High' },
  { sector: 'Materials', action: 'Mine rehabilitation and circular extraction', msa_reduction: '20-30%', timeline: '5-10 years', investment: '$10-50M per site', feasibility: 'Medium' },
  { sector: 'Energy', action: 'Renewable transition with biodiversity co-benefits', msa_reduction: '25-40%', timeline: '5-15 years', investment: 'Varies by asset', feasibility: 'High' },
  { sector: 'Real Estate', action: 'Biodiversity net gain in all developments', msa_reduction: '15-25%', timeline: '2-5 years', investment: '1-3% of project cost', feasibility: 'High' },
  { sector: 'Utilities', action: 'Watershed protection and environmental flows', msa_reduction: '20-35%', timeline: '3-8 years', investment: '$5-20M per watershed', feasibility: 'Medium' },
  { sector: 'Financials', action: 'Nature-positive lending criteria and exclusions', msa_reduction: '10-20% (indirect)', timeline: '1-3 years', investment: 'Operational cost only', feasibility: 'Very High' },
  { sector: 'Health Care', action: 'Green chemistry and effluent treatment', msa_reduction: '15-25%', timeline: '2-5 years', investment: '$1-10M per facility', feasibility: 'High' },
  { sector: 'Consumer Discretionary', action: 'Sustainable materials and microplastic reduction', msa_reduction: '10-20%', timeline: '3-7 years', investment: '$5-15M industry-wide', feasibility: 'Medium' },
];

/* ================================================================
   CBD/KUNMING-MONTREAL TARGETS (Global Biodiversity Framework)
   ================================================================ */
const GBF_TARGETS = [
  { id: 'T1', target: '30x30 — Protect 30% of land and ocean by 2030', status: 'In Progress', current: '17% land, 8% ocean', pctDone: 42 },
  { id: 'T2', target: 'Restore 30% of degraded ecosystems', status: 'Behind', current: '~8% restoration initiated', pctDone: 27 },
  { id: 'T3', target: 'Halt species extinction by 2030', status: 'Behind', current: '~1M species threatened (IUCN)', pctDone: 15 },
  { id: 'T7', target: 'Reduce pollution risk to levels not harmful to biodiversity', status: 'Behind', current: 'Chemical pollution volumes rising 3%/yr', pctDone: 18 },
  { id: 'T15', target: 'Large companies disclose nature dependencies and impacts', status: 'Emerging', current: 'TNFD adopted by ~320 companies globally', pctDone: 35 },
  { id: 'T18', target: 'Eliminate harmful subsidies ($500B+/yr)', status: 'Behind', current: 'Fossil fuel subsidies $7T in 2022 (IMF)', pctDone: 8 },
  { id: 'T19', target: 'Mobilize $200B/yr for biodiversity by 2030', status: 'Behind', current: 'Currently ~$130B/yr (OECD est.)', pctDone: 65 },
];

/* ================================================================
   COUNTRY BIODIVERSITY HOTSPOT DATA
   ================================================================ */
const COUNTRY_HOTSPOTS = [
  { code: 'BR', name: 'Brazil', bii: 0.73, threatened_species: 1892, protected_area_pct: 30.4, biome: 'Amazon, Cerrado, Atlantic Forest' },
  { code: 'ID', name: 'Indonesia', bii: 0.62, threatened_species: 1568, protected_area_pct: 14.2, biome: 'Sundaland, Wallacea, Coral Triangle' },
  { code: 'IN', name: 'India', bii: 0.56, threatened_species: 1203, protected_area_pct: 8.5, biome: 'Western Ghats, Himalaya, Sundarbans' },
  { code: 'CN', name: 'China', bii: 0.52, threatened_species: 1082, protected_area_pct: 18.0, biome: 'Mountains of SW China, Indo-Burma' },
  { code: 'AU', name: 'Australia', bii: 0.82, threatened_species: 976, protected_area_pct: 21.8, biome: 'SW Australia, Great Barrier Reef' },
  { code: 'MX', name: 'Mexico', bii: 0.68, threatened_species: 1120, protected_area_pct: 15.4, biome: 'Mesoamerica, Madrean Pine-Oak' },
  { code: 'CG', name: 'DR Congo', bii: 0.81, threatened_species: 584, protected_area_pct: 12.4, biome: 'Congo Basin Tropical Forest' },
  { code: 'CO', name: 'Colombia', bii: 0.71, threatened_species: 1302, protected_area_pct: 16.8, biome: 'Tropical Andes, Choco-Darien' },
  { code: 'US', name: 'United States', bii: 0.78, threatened_species: 1662, protected_area_pct: 13.5, biome: 'California Floristic, Appalachian' },
  { code: 'ZA', name: 'South Africa', bii: 0.74, threatened_species: 612, protected_area_pct: 14.7, biome: 'Cape Floristic, Succulent Karoo' },
  { code: 'PG', name: 'Papua New Guinea', bii: 0.85, threatened_species: 398, protected_area_pct: 4.2, biome: 'East Melanesian, New Guinea' },
  { code: 'MY', name: 'Malaysia', bii: 0.60, threatened_species: 745, protected_area_pct: 18.5, biome: 'Sundaland, Heart of Borneo' },
];

/* ================================================================
   HELPERS
   ================================================================ */
const mapSector = s => {
  if (s === 'IT') return 'Information Technology';
  return s;
};
const getSectorFactor = s => BIODIVERSITY_FACTORS[mapSector(s)] || BIODIVERSITY_FACTORS['Financials'];
const sevClr = v => v === 'Very High' ? T.red : v === 'High' ? T.amber : v === 'Medium' ? T.gold : T.green;
const fmt = n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;

/* ================================================================
   STYLED COMPONENTS (inline)
   ================================================================ */
const Section = ({ title, sub, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20, ...style }}>
    <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: sub ? 2 : 12, fontFamily: T.font }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginBottom: 14 }}>{sub}</div>}
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 150, flex: '1 1 170px' }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontFamily: T.font }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, transition: 'all .15s', ...style }}>{children}</button>
);

const Badge = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, color, fontFamily: T.font }}>{text}</span>
);

const TH = ({ children, onClick, sorted, style }) => (
  <th onClick={onClick} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: `2px solid ${T.border}`, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: T.font, ...style }}>
    {children}{sorted ? (sorted === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: T.font, ...style }}>{children}</td>
);

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
const BiodiversityFootprintPage = () => {
  const navigate = useNavigate();

  /* ── Portfolio ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* ── State ── */
  const [sortCol, setSortCol] = useState('msa_loss');
  const [sortDir, setSortDir] = useState('desc');
  const [msaSliders, setMsaSliders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bio_msa_sliders_v1')) || {}; } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem('bio_msa_sliders_v1', JSON.stringify(msaSliders)); }, [msaSliders]);

  /* ── Scored holdings ── */
  const scoredHoldings = useMemo(() => {
    return portfolio.map(c => {
      const sector = mapSector(c.gics_sector || c.sector || 'Financials');
      const bf = getSectorFactor(sector);
      const revenue = c.revenue_usd_mn || c.revenue_inr_cr * 0.12 || 500;
      const sliderAdj = msaSliders[c.isin] != null ? msaSliders[c.isin] / 100 : 1;
      const msa_loss = +(bf.msa_loss_per_mn * (revenue / 1000) * sliderAdj).toFixed(3);
      const land_use = +(bf.land_use_ha_per_mn * (revenue / 1000) * sliderAdj).toFixed(1);
      const water_stress = bf.water_stress_score;
      const deforest = bf.deforestation_risk;
      const pollinator = bf.pollinator_dependency;
      const speciesImpact = bf.key_species_impact;
      const natureScore = Math.max(0, Math.min(100, 100 - (msa_loss * 80 + (water_stress > 60 ? 15 : 5) + (deforest === 'Very High' ? 20 : deforest === 'High' ? 10 : 0))));
      const status = natureScore >= 65 ? 'Nature Positive' : natureScore >= 35 ? 'Neutral' : 'Negative';
      return { ...c, sector, msa_loss, land_use, water_stress, deforest, pollinator, speciesImpact, natureScore: +natureScore.toFixed(1), status, revenue, msa_loss_per_mn: bf.msa_loss_per_mn };
    });
  }, [portfolio, msaSliders]);

  /* ── KPI metrics ── */
  const metrics = useMemo(() => {
    if (!scoredHoldings.length) return {};
    const totalMSA = scoredHoldings.reduce((s, h) => s + h.msa_loss, 0);
    const totalRevenue = scoredHoldings.reduce((s, h) => s + (h.revenue || 0), 0);
    const msaPerMn = totalRevenue > 0 ? totalMSA / (totalRevenue / 1000) : 0;
    const totalLand = scoredHoldings.reduce((s, h) => s + h.land_use, 0);
    const avgWater = scoredHoldings.reduce((s, h) => s + h.water_stress, 0) / scoredHoldings.length;
    const speciesSet = new Set(); scoredHoldings.forEach(h => h.speciesImpact.forEach(s => speciesSet.add(s)));
    const deforestHigh = scoredHoldings.filter(h => h.deforest === 'Very High' || h.deforest === 'High' || h.deforest === 'Medium').length;
    const pollinatorDep = scoredHoldings.filter(h => h.pollinator !== 'Low').length;
    const naturePos = scoredHoldings.filter(h => h.status === 'Nature Positive').length;
    const dataAvail = scoredHoldings.filter(h => h.revenue > 0).length;
    const cbdScore = GBF_TARGETS.reduce((s, t) => s + t.pctDone, 0) / GBF_TARGETS.length;
    return {
      totalMSA: totalMSA.toFixed(3), msaPerMn: msaPerMn.toFixed(3), totalLand: Math.round(totalLand),
      avgWater: avgWater.toFixed(0), speciesCount: speciesSet.size,
      deforestPct: ((deforestHigh / scoredHoldings.length) * 100).toFixed(0),
      pollinatorPct: ((pollinatorDep / scoredHoldings.length) * 100).toFixed(0),
      naturePosPct: ((naturePos / scoredHoldings.length) * 100).toFixed(0),
      cbdScore: cbdScore.toFixed(0),
      dataCoverage: ((dataAvail / scoredHoldings.length) * 100).toFixed(0),
    };
  }, [scoredHoldings]);

  /* ── Sector aggregation for BarChart ── */
  const sectorMSA = useMemo(() => {
    const map = {};
    scoredHoldings.forEach(h => {
      if (!map[h.sector]) map[h.sector] = { sector: h.sector.length > 15 ? h.sector.slice(0, 14) + '..' : h.sector, fullSector: h.sector, totalMSA: 0, totalLand: 0, count: 0 };
      map[h.sector].totalMSA += h.msa_loss;
      map[h.sector].totalLand += h.land_use;
      map[h.sector].count++;
    });
    return Object.values(map).sort((a, b) => b.totalMSA - a.totalMSA);
  }, [scoredHoldings]);

  /* ── Land use stacked area data ── */
  const landUseArea = useMemo(() => {
    const sectors = [...new Set(scoredHoldings.map(h => h.sector))];
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    return years.map(y => {
      const row = { year: y };
      sectors.forEach(s => {
        const holdings = scoredHoldings.filter(h => h.sector === s);
        const base = holdings.reduce((sum, h) => sum + h.land_use, 0);
        row[s] = +(base * (0.85 + (y - 2020) * 0.03)).toFixed(1);
      });
      return row;
    });
  }, [scoredHoldings]);

  const landSectors = useMemo(() => [...new Set(scoredHoldings.map(h => h.sector))], [scoredHoldings]);

  /* ── Species impact radar ── */
  const speciesRadar = useMemo(() => {
    const axes = ['Terrestrial Species', 'Marine Species', 'Freshwater Species', 'Pollinators', 'Soil Biodiversity', 'Migratory Species'];
    return axes.map(a => {
      let val = 0;
      scoredHoldings.forEach(h => {
        const factor = getSectorFactor(h.sector);
        if (a === 'Terrestrial Species') val += factor.land_use_ha_per_mn * 0.3;
        else if (a === 'Marine Species') val += (h.sector === 'Energy' || h.sector === 'Utilities') ? factor.msa_loss_per_mn * 20 : factor.msa_loss_per_mn * 5;
        else if (a === 'Freshwater Species') val += factor.water_stress_score * 0.2;
        else if (a === 'Pollinators') val += factor.pollinator_dependency === 'Very High' ? 30 : factor.pollinator_dependency === 'High' ? 20 : factor.pollinator_dependency === 'Medium' ? 10 : 2;
        else if (a === 'Soil Biodiversity') val += factor.land_use_ha_per_mn * 0.15;
        else if (a === 'Migratory Species') val += (h.sector === 'Energy' || h.sector === 'Utilities' || h.sector === 'Real Estate') ? 15 : 3;
      });
      return { species: a.length > 15 ? a.slice(0, 14) + '.' : a, fullName: a, value: +val.toFixed(1) };
    });
  }, [scoredHoldings]);

  /* ── Nature positive assessment ── */
  const natureAssessment = useMemo(() => {
    const pos = scoredHoldings.filter(h => h.status === 'Nature Positive').length;
    const neutral = scoredHoldings.filter(h => h.status === 'Neutral').length;
    const neg = scoredHoldings.filter(h => h.status === 'Negative').length;
    return [
      { name: 'Nature Positive', value: pos, color: T.green },
      { name: 'Neutral', value: neutral, color: T.gold },
      { name: 'Negative', value: neg, color: T.red },
    ];
  }, [scoredHoldings]);

  /* ── Scenario: 30% MSA reduction ── */
  const scenarioData = useMemo(() => {
    return sectorMSA.map(s => ({
      sector: s.sector,
      current: +s.totalMSA.toFixed(3),
      target: +(s.totalMSA * 0.7).toFixed(3),
      reduction: +(s.totalMSA * 0.3).toFixed(3),
    }));
  }, [sectorMSA]);

  /* ── Sort handler ── */
  const handleSort = useCallback(col => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const sortedHoldings = useMemo(() => {
    return [...scoredHoldings].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [scoredHoldings, sortCol, sortDir]);

  const sf = col => sortCol === col ? sortDir : null;

  /* ── MSA slider handler ── */
  const handleSlider = useCallback((isin, val) => {
    setMsaSliders(prev => ({ ...prev, [isin]: parseInt(val) }));
  }, []);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const headers = ['Company', 'ISIN', 'Sector', 'MSA Loss', 'Land Use (ha)', 'Water Stress', 'Deforestation Risk', 'Pollinator Dep', 'Species Impact', 'Nature Score', 'Status'];
    const rows = scoredHoldings.map(h => [h.company_name || h.name, h.isin, h.sector, h.msa_loss, h.land_use, h.water_stress, h.deforest, h.pollinator, h.speciesImpact.join('; '), h.natureScore, h.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `biodiversity_footprint_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }, [scoredHoldings]);

  const exportJSON = useCallback(() => {
    const data = { date: new Date().toISOString(), portfolio_metrics: metrics, holdings: scoredHoldings.map(h => ({ name: h.company_name || h.name, isin: h.isin, sector: h.sector, msa_loss: h.msa_loss, land_use: h.land_use, water_stress: h.water_stress, deforestation_risk: h.deforest, nature_score: h.natureScore, status: h.status })), gbf_targets: GBF_TARGETS, sector_factors: BIODIVERSITY_FACTORS };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `biodiversity_species_impact_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }, [scoredHoldings, metrics]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Empty state ── */
  if (!portfolio.length) {
    return (
      <div style={{ padding: 40, fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: T.surface, borderRadius: 16, padding: 48, textAlign: 'center', maxWidth: 480, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦋</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
          <div style={{ fontSize: 14, color: T.textSec, marginBottom: 24 }}>Build a portfolio in the Portfolio Manager to analyze your biodiversity footprint.</div>
          <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: '24px 32px 60px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${T.sage}, #3d7a52)`, borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-.3px' }}>Biodiversity Footprint Analyzer</h1>
            <div style={{ fontSize: 13, opacity: .7, marginTop: 4 }}>Mean Species Abundance Methodology | {portfolio.length} holdings</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['MSA', 'ENCORE', 'CBD/GBF', 'Species Impact'].map(b => (
              <span key={b} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,.18)', fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV} small style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>Export CSV</Btn>
          <Btn onClick={exportJSON} small style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>Export JSON</Btn>
          <Btn onClick={handlePrint} small style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>Print</Btn>
        </div>
      </div>

      {/* ── 10 KPI Cards ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Portfolio MSA Loss" value={metrics.totalMSA || '-'} sub="Total MSA loss units" color={T.red} />
        <KpiCard label="MSA Loss / $Mn Rev" value={metrics.msaPerMn || '-'} sub="Intensity metric" color={T.amber} />
        <KpiCard label="Land Use" value={`${fmt(metrics.totalLand)} ha`} sub="Total estimated hectares" color={T.navy} />
        <KpiCard label="Water Stress Score" value={metrics.avgWater || '-'} sub="Portfolio average (0-100)" color={T.navyL} />
        <KpiCard label="Species at Risk" value={metrics.speciesCount || 0} sub="Unique species groups" color={T.red} />
        <KpiCard label="Deforestation Exposed" value={`${metrics.deforestPct || 0}%`} sub="Holdings with med+ risk" color={T.amber} />
        <KpiCard label="Pollinator Dependency" value={`${metrics.pollinatorPct || 0}%`} sub="Holdings with dependency" color={T.gold} />
        <KpiCard label="Nature Positive" value={`${metrics.naturePosPct || 0}%`} sub="Holdings assessed positive" color={T.green} />
        <KpiCard label="CBD Target Alignment" value={`${metrics.cbdScore || 0}%`} sub="Avg GBF target progress" color={T.sage} />
        <KpiCard label="Data Coverage" value={`${metrics.dataCoverage || 0}%`} sub="Holdings with revenue data" color={T.textSec} />
      </div>

      {/* ── MSA Loss by Sector BarChart ── */}
      <Section title="MSA Loss by Sector" sub="Horizontal bars showing total MSA loss per sector in portfolio, color-coded by severity">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={sectorMSA} layout="vertical" margin={{ left: 130 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="sector" tick={{ fontSize: 11 }} width={125} />
            <Tooltip formatter={(v) => v.toFixed(4)} />
            <Bar dataKey="totalMSA" name="MSA Loss" radius={[0, 6, 6, 0]}>
              {sectorMSA.map((s, i) => <Cell key={i} fill={s.totalMSA > 0.5 ? T.red : s.totalMSA > 0.1 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Land Use Footprint AreaChart ── */}
      <Section title="Land Use Footprint Trend" sub="Portfolio total land use (hectares) by sector, stacked area 2020-2025">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={landUseArea}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {landSectors.slice(0, 6).map((s, i) => (
              <Area key={s} type="monotone" dataKey={s} stackId="1" name={s.length > 18 ? s.slice(0, 17) + '..' : s} stroke={PIE_COLORS[i % PIE_COLORS.length]} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.4} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Species Impact Radar ── */}
      <Section title="Species Impact Radar" sub="6-axis spider: Terrestrial, Marine, Freshwater, Pollinators, Soil Biodiversity, Migratory">
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={speciesRadar} outerRadius={120}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="species" tick={{ fontSize: 11, fill: T.textSec }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Radar name="Impact Score" dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.2} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── CBD/GBF Target Alignment ── */}
      <Section title="CBD/GBF Target Alignment" sub="Kunming-Montreal Global Biodiversity Framework — 7 key targets with portfolio contribution assessment">
        {GBF_TARGETS.map(t => (
          <div key={t.id} style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceH }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginRight: 8 }}>{t.id}</span>
                <span style={{ fontSize: 13, color: T.text }}>{t.target}</span>
              </div>
              <Badge text={t.status} color={t.status === 'In Progress' ? T.gold : t.status === 'Emerging' ? T.sage : T.red} />
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>Current: {t.current}</div>
            <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${t.pctDone}%`, background: t.pctDone > 50 ? T.green : t.pctDone > 25 ? T.amber : T.red, borderRadius: 4, transition: 'width .3s' }} />
            </div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 3, textAlign: 'right' }}>{t.pctDone}% progress</div>
          </div>
        ))}
      </Section>

      {/* ── Biodiversity Hotspot Exposure ── */}
      <Section title="Biodiversity Hotspot Exposure" sub="Countries where portfolio has potential operations — Biodiversity Intactness Index (BII)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH>Country</TH><TH>BII</TH><TH>Threatened Species</TH><TH>Protected Area %</TH><TH>Key Biome/Hotspot</TH><TH>Risk Level</TH>
            </tr></thead>
            <tbody>{COUNTRY_HOTSPOTS.map(c => (
              <tr key={c.code} style={{ background: c.bii < 0.6 ? `${T.red}08` : 'transparent' }}>
                <TD style={{ fontWeight: 600 }}>{c.name}</TD>
                <TD><span style={{ fontWeight: 700, color: c.bii < 0.6 ? T.red : c.bii < 0.7 ? T.amber : T.green }}>{c.bii.toFixed(2)}</span></TD>
                <TD>{c.threatened_species.toLocaleString()}</TD>
                <TD>{c.protected_area_pct}%</TD>
                <TD style={{ fontSize: 12 }}>{c.biome}</TD>
                <TD><Badge text={c.bii < 0.6 ? 'Critical' : c.bii < 0.7 ? 'High' : c.bii < 0.8 ? 'Medium' : 'Low'} color={c.bii < 0.6 ? T.red : c.bii < 0.7 ? T.amber : c.bii < 0.8 ? T.gold : T.green} /></TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {/* ── Pollinator Dependency Analysis ── */}
      <Section title="Pollinator Dependency Analysis" sub="Which portfolio sectors depend on pollination services? Consumer Staples and Healthcare highlighted">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {SECTOR_KEYS.map(s => {
            const bf = BIODIVERSITY_FACTORS[s];
            const isHighlight = bf.pollinator_dependency !== 'Low';
            return (
              <div key={s} style={{ border: `1px solid ${isHighlight ? T.amber : T.border}`, borderRadius: 10, padding: 14, background: isHighlight ? `${T.amber}08` : T.surface }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 4 }}>{s.length > 20 ? s.slice(0, 19) + '..' : s}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>Pollinator Dep</span>
                  <Badge text={bf.pollinator_dependency} color={bf.pollinator_dependency === 'Very High' ? T.red : bf.pollinator_dependency === 'High' ? T.amber : bf.pollinator_dependency === 'Medium' ? T.gold : T.green} />
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>MSA Loss/Mn: {bf.msa_loss_per_mn}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Land Use/Mn: {bf.land_use_ha_per_mn} ha</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Sector MSA Intensity Comparison ── */}
      <Section title="Sector MSA Intensity Comparison" sub="MSA loss per $Mn revenue — comparing portfolio sector allocation vs biodiversity impact intensity">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {sectorMSA.map((s, i) => {
            const bf = BIODIVERSITY_FACTORS[s.fullSector] || BIODIVERSITY_FACTORS['Financials'];
            const holdingsPct = ((s.count / scoredHoldings.length) * 100).toFixed(0);
            const impactShare = ((s.totalMSA / scoredHoldings.reduce((sum, h) => sum + h.msa_loss, 0)) * 100).toFixed(0);
            const disproportionate = parseFloat(impactShare) > parseFloat(holdingsPct) * 1.5;
            return (
              <div key={s.fullSector} style={{ border: `1px solid ${disproportionate ? T.red : T.border}`, borderRadius: 10, padding: 14, background: disproportionate ? `${T.red}05` : T.surface }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{s.sector}</span>
                  {disproportionate && <Badge text="Disproportionate" color={T.red} />}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: 8, borderRadius: 6, background: `${T.navy}08` }}>
                    <div style={{ fontSize: 10, color: T.textMut }}>Portfolio Share</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{holdingsPct}%</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 8, borderRadius: 6, background: `${T.red}08` }}>
                    <div style={{ fontSize: 10, color: T.textMut }}>Impact Share</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>{impactShare}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>MSA/Mn: {bf.msa_loss_per_mn} | Land: {bf.land_use_ha_per_mn} ha/Mn | Water: {bf.water_stress_score}/100</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Water Stress by Sector BarChart ── */}
      <Section title="Water Stress by Sector" sub="Average water stress score per sector (0-100) — higher values indicate greater water dependency risk">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SECTOR_KEYS.map(s => ({ sector: s.length > 15 ? s.slice(0, 14) + '..' : s, water_stress: BIODIVERSITY_FACTORS[s].water_stress_score, land_use: BIODIVERSITY_FACTORS[s].land_use_ha_per_mn }))} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={85} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="water_stress" name="Water Stress (0-100)" radius={[6, 6, 0, 0]}>
              {SECTOR_KEYS.map((s, i) => <Cell key={i} fill={BIODIVERSITY_FACTORS[s].water_stress_score > 60 ? T.red : BIODIVERSITY_FACTORS[s].water_stress_score > 40 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Data Input: Custom Impact Multipliers ── */}
      <Section title="Custom Impact Multipliers" sub="Override default MSA factors per sector for bespoke portfolio analysis. Values persist across sessions.">
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, padding: '8px 12px', background: `${T.gold}10`, borderRadius: 8, border: `1px solid ${T.gold}30` }}>
          Use the sliders in the MSA Calculator section below to adjust impact estimates per holding. Sector-level factors shown here are reference values from the ENCORE/GLOBIO methodology.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {SECTOR_KEYS.slice(0, 8).map(s => {
            const bf = BIODIVERSITY_FACTORS[s];
            return (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>{s.length > 20 ? s.slice(0, 19) + '..' : s}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>MSA: {bf.msa_loss_per_mn} | Land: {bf.land_use_ha_per_mn} ha</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 40, height: 8, borderRadius: 4, background: bf.msa_loss_per_mn > 0.7 ? T.red : bf.msa_loss_per_mn > 0.3 ? T.amber : T.sage }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: bf.msa_loss_per_mn > 0.7 ? T.red : T.sage }}>{(bf.msa_loss_per_mn * 100).toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Sortable Holdings Table ── */}
      <Section title="Holdings Biodiversity Footprint" sub="Click column headers to sort">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH onClick={() => handleSort('company_name')} sorted={sf('company_name')}>Company</TH>
              <TH onClick={() => handleSort('sector')} sorted={sf('sector')}>Sector</TH>
              <TH onClick={() => handleSort('msa_loss')} sorted={sf('msa_loss')}>MSA Loss</TH>
              <TH onClick={() => handleSort('land_use')} sorted={sf('land_use')}>Land Use (ha)</TH>
              <TH onClick={() => handleSort('water_stress')} sorted={sf('water_stress')}>Water Stress</TH>
              <TH>Deforestation</TH>
              <TH>Pollinator</TH>
              <TH>Species Impact</TH>
              <TH onClick={() => handleSort('natureScore')} sorted={sf('natureScore')}>Nature Score</TH>
            </tr></thead>
            <tbody>{sortedHoldings.map(h => (
              <tr key={h.isin || h.company_name} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <TD style={{ fontWeight: 600, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.name}</TD>
                <TD style={{ fontSize: 11 }}>{h.sector}</TD>
                <TD><span style={{ fontWeight: 700, color: h.msa_loss > 0.3 ? T.red : h.msa_loss > 0.05 ? T.amber : T.green }}>{h.msa_loss.toFixed(4)}</span></TD>
                <TD>{h.land_use.toFixed(1)}</TD>
                <TD><span style={{ fontWeight: 600, color: h.water_stress > 60 ? T.red : h.water_stress > 40 ? T.amber : T.green }}>{h.water_stress}</span></TD>
                <TD><Badge text={h.deforest} color={sevClr(h.deforest)} /></TD>
                <TD><Badge text={h.pollinator} color={h.pollinator === 'Very High' ? T.red : h.pollinator === 'Medium' ? T.gold : T.green} /></TD>
                <TD style={{ fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.speciesImpact.slice(0, 2).join(', ')}</TD>
                <TD><span style={{ fontWeight: 700, color: h.natureScore >= 65 ? T.green : h.natureScore >= 35 ? T.amber : T.red }}>{h.natureScore}</span></TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {/* ── Nature Positive Assessment (Pie) ── */}
      <Section title="Nature Positive Assessment" sub="Portfolio distribution: Nature Positive vs Neutral vs Negative">
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <ResponsiveContainer width={300} height={250}>
            <PieChart>
              <Pie data={natureAssessment} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {natureAssessment.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div>
            {natureAssessment.map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: a.color }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name}: {a.value} holdings</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Deforestation Risk Cross-Reference ── */}
      <Section title="Deforestation Risk Cross-Reference" sub="Links to EP-K4 Deforestation Risk Tracker for detailed commodity-level analysis">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {SECTOR_KEYS.filter(s => {
            const bf = BIODIVERSITY_FACTORS[s];
            return bf.deforestation_risk !== 'Low' && !bf.deforestation_risk.startsWith('Low');
          }).map(s => {
            const bf = BIODIVERSITY_FACTORS[s];
            return (
              <div key={s} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: `${sevClr(bf.deforestation_risk)}06` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>{s}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>Deforestation Risk</span>
                  <Badge text={bf.deforestation_risk} color={sevClr(bf.deforestation_risk)} />
                </div>
              </div>
            );
          })}
        </div>
        <Btn onClick={() => navigate('/deforestation-risk')} small>Open Deforestation Risk Tracker</Btn>
      </Section>

      {/* ── Sector Land Use Footprint Ranking ── */}
      <Section title="Sector Land Use Footprint Ranking" sub="Total estimated land use (hectares) attributable to portfolio per sector — key driver of MSA loss">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sectorMSA} layout="vertical" margin={{ left: 130 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="sector" tick={{ fontSize: 11 }} width={125} />
            <Tooltip formatter={(v) => `${v.toFixed(1)} ha`} />
            <Bar dataKey="totalLand" name="Land Use (ha)" radius={[0, 6, 6, 0]}>
              {sectorMSA.map((s, i) => <Cell key={i} fill={s.totalLand > 100 ? T.red : s.totalLand > 30 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Biodiversity Risk Hotspot Ranking ── */}
      <Section title="Biodiversity Risk Hotspot Analysis" sub="Top 10 holdings with the highest combined nature risk indicators">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH>Rank</TH><TH>Company</TH><TH>Sector</TH><TH>MSA Loss</TH><TH>Land Use</TH><TH>Water Stress</TH><TH>Deforest Risk</TH><TH>Combined Risk</TH>
            </tr></thead>
            <tbody>{[...scoredHoldings].sort((a, b) => {
              const aRisk = a.msa_loss * 100 + (a.water_stress / 10) + (a.deforest === 'Very High' ? 20 : a.deforest === 'High' ? 10 : a.deforest === 'Medium' ? 5 : 0);
              const bRisk = b.msa_loss * 100 + (b.water_stress / 10) + (b.deforest === 'Very High' ? 20 : b.deforest === 'High' ? 10 : b.deforest === 'Medium' ? 5 : 0);
              return bRisk - aRisk;
            }).slice(0, 10).map((h, i) => {
              const risk = (h.msa_loss * 100 + (h.water_stress / 10) + (h.deforest === 'Very High' ? 20 : h.deforest === 'High' ? 10 : h.deforest === 'Medium' ? 5 : 0)).toFixed(1);
              return (
                <tr key={h.isin || i} style={{ background: i < 3 ? `${T.red}05` : 'transparent' }}>
                  <TD style={{ fontWeight: 800, color: i < 3 ? T.red : T.text, fontSize: 14 }}>#{i + 1}</TD>
                  <TD style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.name}</TD>
                  <TD style={{ fontSize: 11 }}>{h.sector}</TD>
                  <TD><span style={{ fontWeight: 700, color: h.msa_loss > 0.3 ? T.red : T.amber }}>{h.msa_loss.toFixed(4)}</span></TD>
                  <TD>{h.land_use.toFixed(1)} ha</TD>
                  <TD><span style={{ fontWeight: 600, color: h.water_stress > 60 ? T.red : T.sage }}>{h.water_stress}</span></TD>
                  <TD><Badge text={h.deforest} color={sevClr(h.deforest)} /></TD>
                  <TD><span style={{ fontWeight: 800, fontSize: 14, color: parseFloat(risk) > 30 ? T.red : parseFloat(risk) > 10 ? T.amber : T.sage }}>{risk}</span></TD>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Section>

      {/* ── Scenario Analysis: 30% MSA Reduction ── */}
      <Section title="Scenario: GBF 30% MSA Reduction Target" sub="What if all holdings reduced MSA loss by 30% to align with Kunming-Montreal framework?">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={scenarioData} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => v.toFixed(4)} />
            <Legend />
            <Bar dataKey="current" name="Current MSA Loss" fill={T.red} radius={[6, 6, 0, 0]} />
            <Bar dataKey="target" name="30% Reduced" fill={T.sage} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: `${T.green}08`, border: `1px solid ${T.green}30` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.green, marginBottom: 4 }}>Scenario Impact</div>
          <div style={{ fontSize: 12, color: T.textSec }}>Achieving a 30% reduction in MSA loss across all holdings would bring the portfolio closer to CBD Target 2 (restore 30% of degraded ecosystems) and reduce nature-related financial risk by an estimated 15-25% based on current NGFS nature scenarios.</div>
        </div>
      </Section>

      {/* ── Interactive MSA Calculator (Sliders) ── */}
      <Section title="Interactive MSA Calculator" sub="Adjust estimated land use per holding (slider %) to model MSA impact changes. Changes persist in localStorage.">
        <div style={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}><tr>
              <TH>Company</TH><TH>Sector</TH><TH style={{ minWidth: 180 }}>Land Use Adjustment</TH><TH>Current MSA</TH><TH>Adjusted MSA</TH>
            </tr></thead>
            <tbody>{scoredHoldings.slice(0, 20).map(h => {
              const sliderVal = msaSliders[h.isin] != null ? msaSliders[h.isin] : 100;
              const baseMSA = (getSectorFactor(h.sector).msa_loss_per_mn * ((h.revenue || 500) / 1000)).toFixed(4);
              return (
                <tr key={h.isin || h.company_name}>
                  <TD style={{ fontWeight: 600, fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.name}</TD>
                  <TD style={{ fontSize: 11 }}>{h.sector}</TD>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="range" min={10} max={150} value={sliderVal} onChange={e => handleSlider(h.isin, e.target.value)} style={{ flex: 1, accentColor: T.sage }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: sliderVal < 100 ? T.green : sliderVal > 100 ? T.red : T.text, minWidth: 40, textAlign: 'right' }}>{sliderVal}%</span>
                    </div>
                  </TD>
                  <TD style={{ fontSize: 12, color: T.textMut }}>{baseMSA}</TD>
                  <TD><span style={{ fontWeight: 700, color: h.msa_loss > parseFloat(baseMSA) ? T.red : T.green }}>{h.msa_loss.toFixed(4)}</span></TD>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Section>

      {/* ── Species Threat Assessment ── */}
      <Section title="Species Threat Assessment (IUCN Red List)" sub="Portfolio exposure to IUCN-classified threatened species categories">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
          {SPECIES_THREAT_CATEGORIES.map(st => (
            <div key={st.abbrev} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{st.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{st.category}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 18, color: T.red }}>{st.count_affected.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>{st.description}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>Exposed sectors: {st.portfolio_sectors.join(', ')}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: `${T.red}06`, border: `1px solid ${T.red}20`, fontSize: 12, color: T.textSec }}>
          Portfolio holdings in {scoredHoldings.filter(h => h.msa_loss > 0.1).length} companies may contribute to species threat through land use, pollution, and resource extraction pathways. Sectors with highest species impact: Materials ({BIODIVERSITY_FACTORS.Materials.msa_loss_per_mn} MSA/Mn), Consumer Staples ({BIODIVERSITY_FACTORS['Consumer Staples'].msa_loss_per_mn} MSA/Mn), Energy ({BIODIVERSITY_FACTORS.Energy.msa_loss_per_mn} MSA/Mn).
        </div>
      </Section>

      {/* ── Ecosystem Integrity Trend ── */}
      <Section title="Portfolio Ecosystem Integrity Trend" sub="Projected Mean Species Abundance trend vs benchmark and GBF target pathway (2020-2030)">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={INTEGRITY_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0.55, 0.95]} />
            <Tooltip formatter={v => v.toFixed(3)} />
            <Legend />
            <Line type="monotone" dataKey="portfolio_msa" name="Portfolio MSA" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="benchmark" name="Market Benchmark" stroke={T.textMut} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="target" name="GBF Target Pathway" stroke={T.green} strokeWidth={2} strokeDasharray="8 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          <div style={{ padding: 12, borderRadius: 8, background: `${T.navy}08`, border: `1px solid ${T.navy}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Portfolio 2030 MSA</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>0.62</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: `${T.textMut}08`, border: `1px solid ${T.textMut}30`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Benchmark 2030</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.textMut }}>0.60</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}30`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>GBF Target 2030</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>0.90</div>
          </div>
        </div>
      </Section>

      {/* ── Biodiversity Pressure Drivers ── */}
      <Section title="Biodiversity Pressure Drivers" sub="IPBES framework — contribution of key drivers to global biodiversity loss, with portfolio sector mapping">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <ResponsiveContainer width={320} height={280}>
            <PieChart>
              <Pie data={PRESSURE_DRIVERS} dataKey="contribution_pct" nameKey="driver" cx="50%" cy="50%" outerRadius={100} label={({ driver, contribution_pct }) => `${driver.slice(0, 12)} ${contribution_pct}%`}>
                {PRESSURE_DRIVERS.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, minWidth: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <TH>Driver</TH><TH>Contribution</TH><TH>Trend</TH><TH>Key Sectors</TH>
              </tr></thead>
              <tbody>{PRESSURE_DRIVERS.map(d => (
                <tr key={d.driver}>
                  <TD style={{ fontWeight: 600 }}>{d.driver}</TD>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${d.contribution_pct * 3}%`, height: '100%', background: d.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{d.contribution_pct}%</span>
                    </div>
                  </TD>
                  <TD><Badge text={d.trend} color={d.trend === 'Increasing' ? T.red : T.gold} /></TD>
                  <TD style={{ fontSize: 11 }}>{d.sectors}</TD>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── Nature-Positive Transition Pathways ── */}
      <Section title="Nature-Positive Transition Pathways" sub="Sector-specific actions to reduce biodiversity footprint with estimated MSA reduction potential">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH>Sector</TH><TH>Transition Action</TH><TH>MSA Reduction</TH><TH>Timeline</TH><TH>Investment</TH><TH>Feasibility</TH>
            </tr></thead>
            <tbody>{TRANSITION_PATHWAYS.map((tp, i) => (
              <tr key={i} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <TD style={{ fontWeight: 600 }}>{tp.sector}</TD>
                <TD style={{ fontSize: 12 }}>{tp.action}</TD>
                <TD><span style={{ fontWeight: 700, color: T.green }}>{tp.msa_reduction}</span></TD>
                <TD style={{ fontSize: 12 }}>{tp.timeline}</TD>
                <TD style={{ fontSize: 12 }}>{tp.investment}</TD>
                <TD><Badge text={tp.feasibility} color={tp.feasibility === 'Very High' ? T.green : tp.feasibility === 'High' ? T.sage : T.gold} /></TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {/* ── Water-Biodiversity Nexus ── */}
      <Section title="Water-Biodiversity Nexus" sub="How water stress compounds biodiversity loss — portfolio sector analysis">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {SECTOR_KEYS.map(s => {
            const bf = BIODIVERSITY_FACTORS[s];
            const combined = (bf.water_stress_score * 0.4 + bf.msa_loss_per_mn * 50).toFixed(1);
            return (
              <div key={s} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, background: parseFloat(combined) > 40 ? `${T.red}06` : T.surface }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: T.navy, marginBottom: 8 }}>{s.length > 18 ? s.slice(0, 17) + '..' : s}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.textMut }}>Water Stress</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: bf.water_stress_score > 60 ? T.red : bf.water_stress_score > 40 ? T.amber : T.green }}>{bf.water_stress_score}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.textMut }}>MSA/Mn</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: bf.msa_loss_per_mn > 0.5 ? T.red : T.sage }}>{bf.msa_loss_per_mn}</span>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ width: `${Math.min(100, parseFloat(combined))}%`, height: '100%', background: parseFloat(combined) > 50 ? T.red : parseFloat(combined) > 30 ? T.amber : T.sage, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3, textAlign: 'right' }}>Combined: {combined}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Sector Impact Factor Reference ── */}
      <Section title="Biodiversity Impact Factor Reference" sub="Complete MSA methodology factors per GICS sector — used for portfolio footprint calculations">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH>Sector</TH><TH>MSA Loss / $Mn</TH><TH>Land Use ha / $Mn</TH><TH>Water Stress</TH><TH>Deforestation</TH><TH>Pollinator Dep</TH><TH>Key Species Impacted</TH>
            </tr></thead>
            <tbody>{SECTOR_KEYS.map(s => {
              const bf = BIODIVERSITY_FACTORS[s];
              return (
                <tr key={s}>
                  <TD style={{ fontWeight: 600, fontSize: 12 }}>{s}</TD>
                  <TD><span style={{ fontWeight: 700, color: bf.msa_loss_per_mn > 0.7 ? T.red : bf.msa_loss_per_mn > 0.3 ? T.amber : T.green }}>{bf.msa_loss_per_mn}</span></TD>
                  <TD>{bf.land_use_ha_per_mn}</TD>
                  <TD><span style={{ fontWeight: 600, color: bf.water_stress_score > 60 ? T.red : bf.water_stress_score > 40 ? T.amber : T.green }}>{bf.water_stress_score}</span></TD>
                  <TD><Badge text={bf.deforestation_risk} color={sevClr(bf.deforestation_risk)} /></TD>
                  <TD><Badge text={bf.pollinator_dependency} color={bf.pollinator_dependency === 'Very High' ? T.red : bf.pollinator_dependency === 'Medium' ? T.gold : T.green} /></TD>
                  <TD style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bf.key_species_impact.join(', ')}</TD>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Section>

      {/* ── Portfolio Biodiversity Summary Dashboard ── */}
      <Section title="Portfolio Biodiversity Summary" sub="High-level status indicators for nature-related performance">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'MSA Trajectory', value: 'Declining', detail: 'Portfolio MSA dropping 0.01/yr since 2020', color: T.red, bg: `${T.red}08` },
            { label: 'GBF Alignment Gap', value: '-28%', detail: 'Gap between portfolio MSA and 2030 GBF target', color: T.amber, bg: `${T.amber}08` },
            { label: 'Deforestation Exposure', value: `${metrics.deforestPct || 0}%`, detail: 'Holdings linked to medium+ deforestation risk', color: T.red, bg: `${T.red}08` },
            { label: 'Nature Positive Progress', value: `${metrics.naturePosPct || 0}%`, detail: 'Holdings assessed as nature positive', color: T.green, bg: `${T.green}08` },
            { label: 'Data Quality', value: `${metrics.dataCoverage || 0}%`, detail: 'Holdings with sufficient biodiversity data', color: T.navy, bg: `${T.navy}08` },
            { label: 'Engagement Priority', value: `${scoredHoldings.filter(h => h.msa_loss > 0.1).length}`, detail: 'Holdings requiring active engagement on nature', color: T.amber, bg: `${T.amber}08` },
          ].map((item, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 12, border: `1px solid ${T.border}`, background: item.bg }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.value}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Biodiversity Data Quality & Methodology ── */}
      <Section title="Data Quality & Methodology Notes" sub="Transparency on data sources, estimation methods, and limitations">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>MSA Methodology</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Mean Species Abundance (MSA) is derived from GLOBIO model outputs. Sector-level impact factors are sourced from ENCORE (Exploring Natural Capital Opportunities, Risks and Exposure) and peer-reviewed literature. Per-holding MSA is estimated by multiplying sector factors by revenue, providing a first-order approximation. Actual site-level data would improve accuracy significantly.
            </div>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>Land Use Estimation</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Land use footprint is estimated using sector-average hectares per $Mn revenue from FAO and UNEP-WCMC datasets. Actual footprints vary widely within sectors. Companies with site-level reporting (e.g., TNFD early adopters) may have more precise data. Land use change is the primary driver of terrestrial biodiversity loss globally.
            </div>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>Data Limitations</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Biodiversity data coverage remains limited. Only ~15% of companies report nature-related metrics directly. Estimates are based on sector averages and may not reflect company-specific practices. Species impact assessments use IUCN Red List data with sector-level proxies. Water stress scores from WRI Aqueduct. CBD/GBF progress from UNEP tracking.
            </div>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>Improvement Roadmap</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Future versions will integrate: (1) Site-level biodiversity data from TNFD early reporters, (2) Satellite-derived deforestation alerts (Global Forest Watch), (3) Supply chain commodity tracing for indirect impacts, (4) Science-based targets for nature (SBTN) alignment scoring. Use the MSA Calculator sliders to model company-specific adjustments in the meantime.
            </div>
          </div>
        </div>
      </Section>

      {/* ── Biodiversity Finance Gap ── */}
      <Section title="Biodiversity Finance Gap" sub="Global biodiversity funding vs what is needed to meet CBD/GBF targets">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'Current Annual Funding', value: '$130B', sub: 'OECD 2023 estimate', color: T.amber },
            { label: '2030 Target', value: '$200B', sub: 'CBD/GBF Target 19', color: T.sage },
            { label: 'Funding Gap', value: '$70B/yr', sub: 'Annual shortfall', color: T.red },
            { label: 'Private Sector Share', value: '~17%', sub: 'Of total biodiversity finance', color: T.navy },
            { label: 'Harmful Subsidies', value: '$7T', sub: 'IMF est. fossil fuel 2022', color: T.red },
            { label: 'Biodiversity Credits', value: '$2-4B', sub: 'Projected market by 2030', color: T.green },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 16, borderRadius: 12, border: `1px solid ${T.border}`, background: `${m.color}06` }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Cross-Navigation ── */}
      <Section title="Cross-Navigation" sub="Related modules in the Risk Analytics platform">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'TNFD LEAP Assessment', path: '/tnfd-leap' },
            { label: 'Water Risk', path: '/water-risk' },
            { label: 'Deforestation Risk', path: '/deforestation-risk' },
            { label: 'Physical Climate Risk', path: '/climate-physical-risk' },
            { label: 'Supply Chain Map', path: '/supply-chain-map' },
            { label: 'Portfolio Manager', path: '/portfolio-manager' },
          ].map(n => (
            <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default BiodiversityFootprintPage;
