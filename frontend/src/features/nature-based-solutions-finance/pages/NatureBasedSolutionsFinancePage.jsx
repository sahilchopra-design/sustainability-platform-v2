import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235',
  navy: '#1e3a5f', navyL: '#2a4f7c', gold: '#d4a843', goldL: '#e8c068', sage: '#2d6a4f',
  sageL: '#3a8a65', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050',
  red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace"
};

// NbS project types and archetypes
const NBS_TYPES = [
  { id: 'redd', label: 'REDD+ (Avoided Deforestation)', icon: '🌳', biome: 'Tropical Forest',
    minHa: 5000, avgCostHa: 3.2, cobenefitScore: 92, permanenceRisk: 'Medium', additionality: 'High',
    vcuYield: 12, priceRange: [8, 18], sdgCount: 7, biodiversityScore: 88, waterBenefit: 'High',
    article6Eligible: true, corsia: true, verra: true, gs: false, desc: 'Reduces emissions from deforestation in high-deforestation risk areas. Largest NbS category by volume.' },
  { id: 'ar', label: 'Afforestation & Reforestation', icon: '🌱', biome: 'Degraded Land',
    minHa: 500, avgCostHa: 1200, cobenefitScore: 78, permanenceRisk: 'Low', additionality: 'High',
    vcuYield: 8, priceRange: [12, 28], sdgCount: 6, biodiversityScore: 65, waterBenefit: 'Medium',
    article6Eligible: true, corsia: true, verra: true, gs: true, desc: 'New forest creation on previously non-forested or degraded land with long-term removal credits.' },
  { id: 'ifm', label: 'Improved Forest Management', icon: '🌲', biome: 'Temperate/Boreal Forest',
    minHa: 1000, avgCostHa: 450, cobenefitScore: 71, permanenceRisk: 'Low', additionality: 'Medium',
    vcuYield: 5, priceRange: [10, 22], sdgCount: 5, biodiversityScore: 72, waterBenefit: 'High',
    article6Eligible: false, corsia: false, verra: true, gs: false, desc: 'Enhanced carbon storage through extended rotations, reduced-impact logging, and forest protection.' },
  { id: 'blue', label: 'Blue Carbon (Mangrove/Seagrass)', icon: '🌊', biome: 'Coastal Ecosystem',
    minHa: 200, avgCostHa: 2800, cobenefitScore: 96, permanenceRisk: 'Medium', additionality: 'Very High',
    vcuYield: 15, priceRange: [18, 45], sdgCount: 9, biodiversityScore: 95, waterBenefit: 'Very High',
    article6Eligible: true, corsia: false, verra: true, gs: true, desc: 'Mangrove restoration and conservation with highest co-benefit density; coastal protection and fisheries.' },
  { id: 'peatland', label: 'Peatland Restoration', icon: '🏞️', biome: 'Wetland',
    minHa: 500, avgCostHa: 1800, cobenefitScore: 85, permanenceRisk: 'Low', additionality: 'High',
    vcuYield: 18, priceRange: [14, 32], sdgCount: 6, biodiversityScore: 80, waterBenefit: 'Very High',
    article6Eligible: true, corsia: false, verra: true, gs: false, desc: 'Rewetting degraded peatlands — among highest carbon density per hectare of any ecosystem.' },
  { id: 'grassland', label: 'Grassland & Savanna Conservation', icon: '🌾', biome: 'Grassland',
    minHa: 2000, avgCostHa: 180, cobenefitScore: 68, permanenceRisk: 'Medium', additionality: 'Medium',
    vcuYield: 4, priceRange: [5, 14], sdgCount: 5, biodiversityScore: 74, waterBenefit: 'Medium',
    article6Eligible: false, corsia: false, verra: true, gs: false, desc: 'Avoided conversion of grasslands and savannas with soil carbon stocks and biodiversity benefits.' },
];

// Co-benefit categories for pricing premium
const COBENEFIT_CATEGORIES = [
  { id: 'biodiversity', label: 'Biodiversity & Ecosystem Services', weight: 0.30, premiumBps: 35, frameworks: 'TNFD, GBF Target 3, SBTN' },
  { id: 'water', label: 'Water Security & Watershed Protection', weight: 0.22, premiumBps: 22, frameworks: 'CDP Water, WRI Aqueduct' },
  { id: 'community', label: 'Community Livelihoods & Land Rights', weight: 0.25, premiumBps: 28, frameworks: 'CCB Standards, Gold Standard SDGs' },
  { id: 'food', label: 'Food Security & Agroforestry', weight: 0.13, premiumBps: 15, frameworks: 'FAO FOLU, TNFD' },
  { id: 'climate', label: 'Climate Resilience & Adaptation', weight: 0.10, premiumBps: 12, frameworks: 'UNFCCC NDCs, NAPs' },
];

// VCU market benchmarks by standard & type
const VCU_BENCHMARKS = [
  { standard: 'VCS', type: 'REDD+', avgPrice: 11.2, vol2023: 42, vol2024e: 38, trend: -10, qualityScore: 72 },
  { standard: 'VCS', type: 'IFM', avgPrice: 14.8, vol2023: 18, vol2024e: 21, trend: +17, qualityScore: 78 },
  { standard: 'VCS', type: 'A/R', avgPrice: 19.5, vol2023: 12, vol2024e: 16, trend: +33, qualityScore: 85 },
  { standard: 'Gold Standard', type: 'A/R + SDGs', avgPrice: 24.2, vol2023: 6, vol2024e: 9, trend: +50, qualityScore: 92 },
  { standard: 'Plan Vivo', type: 'Community Forestry', avgPrice: 28.6, vol2023: 2, vol2024e: 3, trend: +50, qualityScore: 94 },
  { standard: 'Art 6.4 (ITMOs)', type: 'REDD+ (sovereign)', avgPrice: 35.0, vol2023: 1, vol2024e: 5, trend: +400, qualityScore: 96 },
  { standard: 'VCS + CCB Gold', type: 'Blue Carbon', avgPrice: 38.4, vol2023: 3, vol2024e: 6, trend: +100, qualityScore: 97 },
  { standard: 'CORSIA (ICAO)', type: 'REDD+ eligible', avgPrice: 13.5, vol2023: 8, vol2024e: 14, trend: +75, qualityScore: 75 },
];

// Article 6.4 mechanism pipeline
const ARTICLE6_PIPELINE = [
  { country: 'Brazil', type: 'REDD+', ha: 2400000, coDeveloper: 'MCTIC/IFC', status: 'ITMO authorized', priceUsd: 32, volume: 8.5, sdgSector: 'Amazon' },
  { country: 'Indonesia', type: 'REDD+ + Peatland', ha: 1850000, coDeveloper: 'ADB/GGGI', status: 'LoA signed', priceUsd: 28, volume: 6.2, sdgSector: 'Kalimantan' },
  { country: 'Kenya', type: 'A/R + Community', ha: 120000, coDeveloper: 'AfDB/GCF', status: 'Validation', priceUsd: 38, volume: 1.2, sdgSector: 'Rift Valley' },
  { country: 'Vietnam', type: 'IFM + Blue Carbon', ha: 95000, coDeveloper: 'JBIC/VCS', status: 'Methodology', priceUsd: 42, volume: 0.8, sdgSector: 'Mekong Delta' },
  { country: 'Colombia', type: 'REDD+ + A/R', ha: 680000, coDeveloper: 'NDF/World Bank', status: 'ITMO authorized', priceUsd: 30, volume: 3.5, sdgSector: 'Pacific Coast' },
  { country: 'Ghana', type: 'A/R + Cocoa Agroforestry', ha: 145000, coDeveloper: 'EIB/IDH', status: 'Registration', priceUsd: 36, volume: 1.4, sdgSector: 'Forest Belt' },
];

// FI financing structures for NbS
const FI_STRUCTURES = [
  { name: 'Green Bond (NbS Use of Proceeds)', minSizeMusd: 100, typicalTenor: '5–15y', coupon: 'SOFR+180–250bps',
    fitFor: 'Large sovereign/project REDD+, A/R portfolios', blended: false, returnTarget: '5–7%', liquidityScore: 85 },
  { name: 'Voluntary Carbon Fund (VCF)', minSizeMusd: 50, typicalTenor: '7–12y',  coupon: 'IRR 8–14%',
    fitFor: 'Portfolio of NbS projects, diversified biomes', blended: false, returnTarget: '8–14%', liquidityScore: 45 },
  { name: 'Blended Finance (DFI first-loss)', minSizeMusd: 30, typicalTenor: '8–15y', coupon: 'IRR 10–18%',
    fitFor: 'Frontier markets, new NbS types (blue carbon, peatland)', blended: true, returnTarget: '10–18%', liquidityScore: 30 },
  { name: 'Nature Performance Bond', minSizeMusd: 150, typicalTenor: '10y', coupon: 'SOFR+120bps → step-up',
    fitFor: 'Sovereign NbS with NDC targets & KPIs', blended: false, returnTarget: '4–6%', liquidityScore: 70 },
  { name: 'REDD+ ERPA (Results-Based Payment)', minSizeMusd: 10, typicalTenor: '5–10y', coupon: 'Fixed $/tCO2',
    fitFor: 'Government-to-government or ADB/World Bank', blended: false, returnTarget: '3–8%', liquidityScore: 20 },
  { name: 'Natural Capital Securitization (NCS-ABS)', minSizeMusd: 200, typicalTenor: '15–25y', coupon: 'SOFR+200–320bps',
    fitFor: 'Large portfolio of verified NbS credits, carbon flow ABS', blended: false, returnTarget: '6–10%', liquidityScore: 60 },
];

// --- Engine functions ---

function calcNbsFinancing({ projectHa, nbsType, vcuYield, vcuPrice, cobenefitPremPct, projectLifeYr, devCostHa, wacc, annOpexHa, permanenceBuffer }) {
  const totalDevCost = projectHa * devCostHa;
  const annVcus = projectHa * vcuYield;
  const annPermanenceBuffer = annVcus * (permanenceBuffer / 100);
  const netAnnVcus = annVcus - annPermanenceBuffer;
  const cobenPrem = vcuPrice * (cobenefitPremPct / 100);
  const effectivePrice = vcuPrice + cobenPrem;
  const annRevenue = netAnnVcus * effectivePrice;
  const annOpex = projectHa * annOpexHa;
  const annEbitda = annRevenue - annOpex;
  const annCapexAmort = totalDevCost / projectLifeYr;

  // NPV calculation
  const discFactor = wacc / 100;
  let npv = -totalDevCost;
  for (let y = 1; y <= projectLifeYr; y++) {
    npv += annEbitda / Math.pow(1 + discFactor, y);
  }

  // IRR (Newton-Raphson)
  const cashflows = [-totalDevCost, ...Array.from({ length: projectLifeYr }, () => annEbitda)];
  let irr = 0.12;
  for (let i = 0; i < 200; i++) {
    let f = 0, df = 0;
    cashflows.forEach((cf, t) => {
      f += cf / Math.pow(1 + irr, t);
      if (t > 0) df -= t * cf / Math.pow(1 + irr, t + 1);
    });
    if (Math.abs(df) < 1e-12) break;
    const step = f / df;
    irr -= step;
    if (Math.abs(step) < 1e-8) break;
  }

  const lcoc = totalDevCost > 0 ? (totalDevCost * (discFactor / (1 - Math.pow(1 + discFactor, -projectLifeYr))) + annOpex) / Math.max(1, netAnnVcus) : 0;

  return {
    totalDevCostM: totalDevCost / 1e6,
    annVcus: Math.round(annVcus),
    netAnnVcus: Math.round(netAnnVcus),
    annRevenue: annRevenue / 1e6,
    annEbitda: annEbitda / 1e6,
    npvM: npv / 1e6,
    irr: irr * 100,
    lcoc: lcoc,
    cobenPremUsd: cobenPrem,
    effectivePrice,
    breakEvenPriceUsd: annOpex > 0 ? (annOpex + annCapexAmort) / Math.max(1, netAnnVcus) : 0,
  };
}

function calcCobenefitPremium(selections) {
  // Weighted premium calculation from co-benefit categories selected
  let totalWeight = 0;
  let weightedPrem = 0;
  selections.forEach(id => {
    const cat = COBENEFIT_CATEGORIES.find(c => c.id === id);
    if (cat) { totalWeight += cat.weight; weightedPrem += cat.weight * cat.premiumBps; }
  });
  return totalWeight > 0 ? (weightedPrem / totalWeight / 100) * 100 : 0; // as percent
}

export default function NatureBasedSolutionsFinancePage() {
  const [activeTab, setActiveTab] = useState(0);

  // Project finance engine state
  const [projectHa, setProjectHa] = useState(50000);
  const [selNbsType, setSelNbsType] = useState('redd');
  const [vcuPriceInput, setVcuPriceInput] = useState(12);
  const [cobenPremPct, setCobenPremPct] = useState(20);
  const [projectLife, setProjectLife] = useState(30);
  const [wacc, setWacc] = useState(11);
  const [permanenceBuffer, setPermanenceBuffer] = useState(15);
  const [selCobenefits, setSelCobenefits] = useState(['biodiversity', 'water', 'community']);
  const [selStructure, setSelStructure] = useState(0);

  const nbsType = NBS_TYPES.find(t => t.id === selNbsType) || NBS_TYPES[0];

  const finResult = useMemo(() => calcNbsFinancing({
    projectHa, nbsType: selNbsType,
    vcuYield: nbsType.vcuYield,
    vcuPrice: vcuPriceInput,
    cobenefitPremPct: cobenPremPct,
    projectLifeYr: projectLife,
    devCostHa: nbsType.avgCostHa,
    wacc,
    annOpexHa: nbsType.avgCostHa * 0.04,
    permanenceBuffer,
  }), [projectHa, selNbsType, vcuPriceInput, cobenPremPct, projectLife, wacc, permanenceBuffer, nbsType]);

  const dynamicCobenPrem = useMemo(() => calcCobenefitPremium(selCobenefits), [selCobenefits]);

  // Sensitivity: VCU price range
  const priceSensData = useMemo(() => [6, 8, 10, 12, 15, 18, 22, 28, 35, 45].map(p => {
    const r = calcNbsFinancing({
      projectHa, nbsType: selNbsType, vcuYield: nbsType.vcuYield, vcuPrice: p,
      cobenefitPremPct: cobenPremPct, projectLifeYr: projectLife, devCostHa: nbsType.avgCostHa,
      wacc, annOpexHa: nbsType.avgCostHa * 0.04, permanenceBuffer,
    });
    return { price: p, npv: +r.npvM.toFixed(1), irr: +r.irr.toFixed(1), lcoc: +r.lcoc.toFixed(2) };
  }), [projectHa, selNbsType, vcuPriceInput, cobenPremPct, projectLife, wacc, permanenceBuffer, nbsType]);

  // VCU market trend data
  const vcuTrendData = useMemo(() => [
    { yr: 2019, redd: 4.2, ar: 9.1, blue: 12.5, ifm: 7.8 },
    { yr: 2020, redd: 5.1, ar: 10.8, blue: 15.2, ifm: 9.2 },
    { yr: 2021, redd: 7.8, ar: 14.5, blue: 22.1, ifm: 12.6 },
    { yr: 2022, redd: 13.5, ar: 19.8, blue: 31.4, ifm: 16.8 },
    { yr: 2023, redd: 10.2, ar: 21.3, blue: 38.2, ifm: 14.9 },
    { yr: 2024, redd: 11.5, ar: 24.1, blue: 41.8, ifm: 17.2 },
  ], []);

  // Co-benefit valuation by biome
  const cobenValData = useMemo(() => NBS_TYPES.map(t => ({
    label: t.label.split(' (')[0].substring(0, 18),
    biodiversity: Math.round(t.biodiversityScore * 0.8),
    water: t.waterBenefit === 'Very High' ? 85 : t.waterBenefit === 'High' ? 65 : 45,
    community: Math.round(t.cobenefitScore * 0.7),
    totalPremUsd: +(t.priceRange[0] * 0.22).toFixed(1),
  })), []);

  // Article 6 pipeline chart
  const art6Data = useMemo(() => ARTICLE6_PIPELINE.map(p => ({
    country: p.country, volumeMt: p.volume, priceUsd: p.priceUsd,
    valueM: +(p.volume * p.priceUsd).toFixed(1),
  })), []);

  const tabs = [
    'Overview', 'Project Finance Engine', 'VCU Market Intelligence',
    'Co-Benefit Valuation', 'Article 6.4 Pipeline', 'FI Structuring',
    'Risk Framework', 'Price Sensitivity', 'Portfolio Construction', 'Market Outlook'
  ];

  const fmt = (v, d = 1) => v == null ? '—' : isFinite(v) ? Number(v).toFixed(d) : '—';
  const fmtM = (v) => v == null ? '—' : `$${fmt(v)}M`;

  const kpi = (label, val, sub, col) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', minWidth: 140 }}>
      <div style={{ color: T.textMut, fontSize: 11, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
      <div style={{ color: col || T.gold, fontSize: 22, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
      {sub && <div style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.sage, color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 11, fontFamily: T.mono }}>EP-DX4</span>
          <span style={{ color: T.textMut, fontSize: 12, fontFamily: T.mono }}>NATURE-BASED SOLUTIONS FINANCE INTELLIGENCE</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Nature-Based Solutions Finance</h1>
        <p style={{ margin: '6px 0 0', color: T.textSec, fontSize: 14 }}>
          REDD+ · A/R · IFM · Blue Carbon · Peatland — VCU pricing, co-benefit valuation, Article 6.4, FI structuring
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ padding: '7px 14px', fontSize: 12, fontFamily: T.mono, cursor: 'pointer', borderRadius: 4,
              background: activeTab === i ? T.sage : T.surface,
              color: activeTab === i ? '#fff' : T.textSec,
              border: `1px solid ${activeTab === i ? T.sage : T.border}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Overview */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {kpi('VCM SIZE 2024E', '$2.1B', 'Voluntary carbon market', T.gold)}
            {kpi('NBS SHARE', '68%', 'of VCM by volume', T.green)}
            {kpi('REDD+ PRICE', '$11.2', 'VCS average $/tCO2e', T.gold)}
            {kpi('BLUE CARBON', '$38.4', 'Premium $/tCO2e', T.amber)}
            {kpi('ART.6.4 PIPELINE', '26.6 Mt', 'ITMOs under development', T.sageL)}
            {kpi('CO-BENEFIT PREM', '+22%', 'Avg. price uplift (CCB Gold)', T.green)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>NbS Project Archetypes</h3>
              {NBS_TYPES.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.icon} {t.label}</div>
                    <div style={{ color: T.textMut, fontSize: 11, marginTop: 2 }}>{t.biome} · {t.vcuYield} tCO2e/ha/yr</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 13 }}>${t.priceRange[0]}–${t.priceRange[1]}/t</div>
                    <div style={{ color: t.article6Eligible ? T.green : T.textMut, fontSize: 10, marginTop: 2 }}>
                      {t.article6Eligible ? '✓ Art.6.4' : 'No Art.6.4'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>VCU Price History by NbS Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vcuTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/tCO2e', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="redd" name="REDD+" stroke={T.gold} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ar" name="A/R" stroke={T.green} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="blue" name="Blue Carbon" stroke="#5dade2" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ifm" name="IFM" stroke={T.amber} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>FI Market Opportunity — NbS Finance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Green Bond Issuance (NbS PoU)', val: '$8.2B', sub: 'Outstanding 2024, +42% YoY', col: T.gold },
                { label: 'REDD+ ERPA Pipeline', val: '$4.6B', sub: 'Forward contracts in negotiation', col: T.green },
                { label: 'Article 6 ITMO Value (est.)', val: '$2.1B', sub: '2024–2030 horizon', col: T.amber },
                { label: 'Biodiversity Credit Market', val: '$0.9B', sub: 'Nascent, TNFD-driven', col: T.sageL },
                { label: 'NbS Fund AUM (PE/VC)', val: '$12.4B', sub: 'Committed capital globally', col: T.gold },
                { label: 'Blue Carbon Pipeline', val: '$1.8B', sub: 'Projects under development', col: '#5dade2' },
              ].map((m, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                  <div style={{ color: T.textMut, fontSize: 11, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ color: m.col, fontFamily: T.mono, fontSize: 18, fontWeight: 700 }}>{m.val}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Project Finance Engine */}
      {activeTab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 14, color: T.gold }}>NbS Project Finance Engine</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: T.textSec, fontSize: 12, marginBottom: 6 }}>Project Type</label>
              <select value={selNbsType} onChange={e => setSelNbsType(e.target.value)}
                style={{ width: '100%', background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text, padding: '8px 10px', borderRadius: 4, fontSize: 13 }}>
                {NBS_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>

            {[
              { label: `Project Area (ha): ${projectHa.toLocaleString()}`, val: projectHa, set: setProjectHa, min: 500, max: 500000, step: 500 },
              { label: `VCU Price ($/tCO2e): $${vcuPriceInput}`, val: vcuPriceInput, set: setVcuPriceInput, min: 3, max: 80, step: 1 },
              { label: `Co-Benefit Premium: ${cobenPremPct}%`, val: cobenPremPct, set: setCobenPremPct, min: 0, max: 60, step: 5 },
              { label: `Project Life (yrs): ${projectLife}`, val: projectLife, set: setProjectLife, min: 10, max: 50, step: 5 },
              { label: `WACC: ${wacc}%`, val: wacc, set: setWacc, min: 6, max: 20, step: 0.5 },
              { label: `Permanence Buffer: ${permanenceBuffer}%`, val: permanenceBuffer, set: setPermanenceBuffer, min: 5, max: 30, step: 5 },
            ].map(({ label, val, set, min, max, step }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 6 }}>{label}</div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                  style={{ width: '100%', accentColor: T.sage }} />
              </div>
            ))}

            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginTop: 8 }}>
              <div style={{ color: T.textMut, fontSize: 11, marginBottom: 6 }}>Selected type parameters</div>
              <div style={{ fontSize: 12, color: T.textSec }}>{nbsType.icon} {nbsType.desc}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>VCU Yield: <span style={{ color: T.gold }}>{nbsType.vcuYield} t/ha/yr</span></div>
                <div style={{ fontSize: 11, color: T.textMut }}>Permanence: <span style={{ color: T.amber }}>{nbsType.permanenceRisk}</span></div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {kpi('TOTAL DEV COST', fmtM(finResult.totalDevCostM), `$${fmt(nbsType.avgCostHa)}/ha × ${projectHa.toLocaleString()} ha`, T.amber)}
              {kpi('ANN VCUs (net)', `${(finResult.netAnnVcus / 1000).toFixed(0)}K tCO2e`, `After ${permanenceBuffer}% buffer`, T.gold)}
              {kpi('EFF. PRICE', `$${fmt(finResult.effectivePrice)}/t`, `Base $${vcuPriceInput} + $${fmt(finResult.cobenPremUsd)} co-ben`, T.green)}
              {kpi('ANN REVENUE', fmtM(finResult.annRevenue), 'Net VCU × effective price', T.gold)}
              {kpi('PROJECT NPV', fmtM(finResult.npvM), `${wacc}% WACC, ${projectLife}yr life`, finResult.npvM >= 0 ? T.green : T.red)}
              {kpi('PROJECT IRR', `${fmt(finResult.irr)}%`, `LCOC: $${fmt(finResult.lcoc)}/tCO2e`, finResult.irr >= wacc ? T.green : T.amber)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 13, color: T.gold }}>Annual Cash Flow Profile</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={[0, 5, 10, 15, 20, 25, 30].filter(y => y <= projectLife).map(y => {
                    const revY = y === 0 ? 0 : finResult.annRevenue;
                    const costY = y === 0 ? finResult.totalDevCostM : finResult.totalDevCostM / projectLife * 0.04 * projectHa / 1e6 * projectHa / 1e6;
                    return { year: `Y${y}`, revenue: +revY.toFixed(2), ebitda: +(revY - (nbsType.avgCostHa * 0.04 * projectHa / 1e6)).toFixed(2) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                    <YAxis stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                    <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue $M" stroke={T.gold} fill={T.gold} fillOpacity={0.2} strokeWidth={2} />
                    <Area type="monotone" dataKey="ebitda" name="EBITDA $M" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 13, color: T.gold }}>Break-Even Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {[
                    { label: 'Break-Even VCU Price', val: `$${fmt(finResult.breakEvenPriceUsd)}/t`, sub: `vs current $${vcuPriceInput}/t` },
                    { label: 'Annualised Dev Cost', val: `$${fmt(finResult.totalDevCostM / projectLife, 2)}M/yr`, sub: `${projectLife}yr amortization` },
                    { label: 'Annual OPEX', val: `$${fmt(nbsType.avgCostHa * 0.04 * projectHa / 1e6, 2)}M`, sub: `4% of capex × ${projectHa.toLocaleString()} ha` },
                    { label: 'EBITDA Margin', val: finResult.annRevenue > 0 ? `${fmt(finResult.annEbitda / finResult.annRevenue * 100)}%` : '—', sub: `$${fmt(finResult.annEbitda)}M EBITDA` },
                    { label: 'LCOC (Levelized Cost)', val: `$${fmt(finResult.lcoc)}/tCO2e`, sub: 'Full-cost carbon removal' },
                    { label: 'VCU Spread to LCOC', val: `$${fmt(finResult.effectivePrice - finResult.lcoc)}/t`, sub: finResult.effectivePrice > finResult.lcoc ? '▲ above cost' : '▼ below cost' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div>
                        <div style={{ fontSize: 12, color: T.text }}>{row.label}</div>
                        <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{row.sub}</div>
                      </div>
                      <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 14, fontWeight: 700 }}>{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: VCU Market Intelligence */}
      {activeTab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('VCM VOLUME 2023', '~92 MtCO2e', 'NbS + tech combined', T.gold)}
            {kpi('NBS SEGMENT', '68%', '~62 Mt NbS credits', T.green)}
            {kpi('AVG NBS PRICE', '$14.8', 'Blended all NbS types', T.amber)}
            {kpi('BLUE CARBON PREM', '3.4×', 'vs REDD+ baseline', '#5dade2')}
          </div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>VCU Benchmark Prices by Standard & Type</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Standard', 'Type', 'Avg Price $/t', 'Vol 2023 Mt', 'Vol 2024E Mt', 'Trend', 'Quality Score', 'CORSIA', 'Art.6.4'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VCU_BENCHMARKS.map((b, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 10px', fontWeight: 600 }}>{b.standard}</td>
                    <td style={{ padding: '9px 10px', color: T.textSec }}>{b.type}</td>
                    <td style={{ padding: '9px 10px', color: T.gold, fontFamily: T.mono }}>${b.avgPrice}</td>
                    <td style={{ padding: '9px 10px', fontFamily: T.mono }}>{b.vol2023}</td>
                    <td style={{ padding: '9px 10px', fontFamily: T.mono }}>{b.vol2024e}</td>
                    <td style={{ padding: '9px 10px', color: b.trend > 0 ? T.green : T.red, fontFamily: T.mono }}>{b.trend > 0 ? '+' : ''}{b.trend}%</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ background: T.surfaceH, borderRadius: 4, height: 8, width: '100%', position: 'relative' }}>
                        <div style={{ background: b.qualityScore >= 90 ? T.green : b.qualityScore >= 75 ? T.amber : T.red, width: `${b.qualityScore}%`, height: '100%', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T.textMut }}>{b.qualityScore}/100</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: b.type.includes('CORSIA') || b.standard === 'CORSIA (ICAO)' ? T.green : T.textMut, fontSize: 12 }}>
                      {b.type.includes('REDD+') ? '✓' : '—'}
                    </td>
                    <td style={{ padding: '9px 10px', color: b.standard.includes('Art') ? T.green : T.textMut, fontSize: 12 }}>
                      {b.standard.includes('Art') ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>VCU Volume 2024E by Standard (Mt CO2e)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={VCU_BENCHMARKS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="standard" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="vol2023" name="Vol 2023" fill={T.border} radius={[3, 3, 0, 0]} />
                <Bar dataKey="vol2024e" name="Vol 2024E" fill={T.sage} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Co-Benefit Valuation */}
      {activeTab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('SELECTED COBENEFITS', selCobenefits.length, 'categories active', T.gold)}
            {kpi('COBENEFIT PREMIUM', `+${fmt(dynamicCobenPrem)}%`, 'of base VCU price', T.green)}
            {kpi('MAX PREMIUM', '+60%', 'all 5 categories, Gold Standard', T.sageL)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>Co-Benefit Premium Calculator</h3>
              {COBENEFIT_CATEGORIES.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <input type="checkbox" checked={selCobenefits.includes(cat.id)}
                    onChange={e => setSelCobenefits(prev => e.target.checked ? [...prev, cat.id] : prev.filter(x => x !== cat.id))}
                    style={{ marginTop: 4, accentColor: T.sage }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{cat.label}</div>
                    <div style={{ color: T.textMut, fontSize: 11, marginTop: 3 }}>{cat.frameworks}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 13 }}>+{cat.premiumBps}bps</div>
                    <div style={{ color: T.textMut, fontSize: 10 }}>w={cat.weight}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginTop: 14 }}>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 4 }}>Composite Premium</div>
                <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 20, fontWeight: 700 }}>+{fmt(dynamicCobenPrem)}%</div>
                <div style={{ color: T.textMut, fontSize: 11, marginTop: 3 }}>On ${vcuPriceInput}/t base = ${fmt(vcuPriceInput * (1 + dynamicCobenPrem / 100))}/t effective</div>
              </div>
            </div>

            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Co-Benefit Profile by NbS Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cobenValData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="label" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} width={120} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="biodiversity" name="Biodiversity" stackId="a" fill={T.sage} />
                  <Bar dataKey="water" name="Water" stackId="a" fill="#5dade2" />
                  <Bar dataKey="community" name="Community" stackId="a" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Standard-by-Standard Co-Benefit Requirements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { std: 'VCS (Verra)', reqs: ['GHG accounting mandatory', 'CCB add-on optional', 'Social safeguards', 'No biodiversity scoring'], premium: '+0–15%' },
                { std: 'Gold Standard', reqs: ['SDG Impact Wheel', '3 SDGs mandatory', 'Stakeholder consultation', 'Gender lens option'], premium: '+15–30%' },
                { std: 'VCS + CCB Gold', reqs: ['All GS requirements', 'CCBA Gold or Climate Gold', 'Biodiversity additionality', 'Community net positive'], premium: '+25–50%' },
                { std: 'Plan Vivo', reqs: ['Smallholder ownership', 'PES design mandatory', 'Monitoring by communities', 'Full equity stake'], premium: '+40–80%' },
              ].map((s, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.std}</div>
                  {s.reqs.map((r, j) => <div key={j} style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>• {r}</div>)}
                  <div style={{ marginTop: 10, color: T.green, fontFamily: T.mono, fontSize: 13 }}>Prem: {s.premium}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Article 6.4 Pipeline */}
      {activeTab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('ITMO PIPELINE', '26.6 Mt', 'NbS projects under dev', T.gold)}
            {kpi('AVG ITMO PRICE', '$34.2', 'Authorised at host country', T.green)}
            {kpi('TOTAL ITMO VALUE', '$910M', 'Projected 2024–2030', T.amber)}
            {kpi('CORSIA ELIGIBLE', '22 Mt', 'Phase 1 (2024–2026)', T.sageL)}
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>Article 6.4 ITMO Pipeline — NbS Projects</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Country', 'NbS Type', 'Area (ha)', 'Co-Developer', 'Status', 'Price $/t', 'Volume Mt', 'Value $M', 'Region/Sector'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARTICLE6_PIPELINE.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 10px', fontWeight: 600 }}>{p.country}</td>
                    <td style={{ padding: '9px 10px', color: T.textSec, fontSize: 12 }}>{p.type}</td>
                    <td style={{ padding: '9px 10px', fontFamily: T.mono }}>{(p.ha / 1000).toFixed(0)}K</td>
                    <td style={{ padding: '9px 10px', color: T.textMut, fontSize: 12 }}>{p.coDeveloper}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ background: p.status === 'ITMO authorized' ? T.sage + '33' : T.amber + '22',
                        color: p.status === 'ITMO authorized' ? T.green : T.amber, borderRadius: 3, padding: '2px 7px', fontSize: 11 }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', color: T.gold, fontFamily: T.mono }}>${p.priceUsd}</td>
                    <td style={{ padding: '9px 10px', fontFamily: T.mono }}>{p.volume}</td>
                    <td style={{ padding: '9px 10px', color: T.gold, fontFamily: T.mono }}>${(p.volume * p.priceUsd).toFixed(1)}M</td>
                    <td style={{ padding: '9px 10px', color: T.textSec, fontSize: 12 }}>{p.sdgSector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>ITMO Volume by Country (Mt CO2e)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={art6Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="volumeMt" name="Volume Mt" fill={T.sage} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Article 6 Mechanics — FI Implications</h3>
              {[
                { label: 'Corresponding Adjustment (CA)', desc: 'Host country subtracts ITMOs from NDC — ensures no double counting. FIs must verify CA before ITMO purchase.' },
                { label: 'Authorized Entity Status', desc: 'FIs/funds can apply as Authorized Entities to participate in Art.6.4 registry directly. UNFCCC secretariat oversees.' },
                { label: 'Share of Proceeds (SoP)', desc: '5% of ITMO value flows to Adaptation Fund; 2% to Cancellation (for global ambition). Structures net price.' },
                { label: 'Transition CORSIA Eligible', desc: 'Art.6.4 credits qualify for CORSIA offsetting (Phase 1 2024–2026). Creates aviation sector demand floor.' },
                { label: 'ITMO vs. VCU Arbitrage', desc: 'Art.6.4 premium over VCU = sovereign risk premium + CA verification cost. Currently $18–25/t spread.' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ color: T.gold, fontSize: 12, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ color: T.textSec, fontSize: 12, marginTop: 4 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: FI Structuring */}
      {activeTab === 5 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {FI_STRUCTURES.map((s, i) => (
              <button key={i} onClick={() => setSelStructure(i)}
                style={{ padding: '8px 16px', fontSize: 12, fontFamily: T.mono, cursor: 'pointer', borderRadius: 4,
                  background: selStructure === i ? T.sage : T.surface,
                  color: selStructure === i ? '#fff' : T.textSec,
                  border: `1px solid ${selStructure === i ? T.sage : T.border}` }}>
                {s.name.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {(() => {
            const s = FI_STRUCTURES[selStructure];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>{s.name}</h3>
                  {[
                    { label: 'Minimum Size', val: `$${s.minSizeMusd}M` },
                    { label: 'Typical Tenor', val: s.typicalTenor },
                    { label: 'Coupon / Return', val: s.coupon },
                    { label: 'Target IRR', val: s.returnTarget },
                    { label: 'Blended Finance', val: s.blended ? 'Yes (first-loss tranche)' : 'No' },
                    { label: 'Liquidity Score', val: `${s.liquidityScore}/100` },
                    { label: 'Best Fit', val: s.fitFor },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ color: T.textSec, fontSize: 13 }}>{row.label}</span>
                      <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 13 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>FI Structure Comparison</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={FI_STRUCTURES.map(s => ({ name: s.name.split('(')[0].substring(0, 22), liquidity: s.liquidityScore, minSizeNorm: Math.min(100, s.minSizeMusd / 2) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 9, fill: T.textMut }} />
                      <YAxis stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                      <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="liquidity" name="Liquidity Score" fill={T.sage} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="minSizeNorm" name="Min Size ($M/2)" fill={T.amber} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 6: Risk Framework */}
      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { cat: 'Permanence Risk', icon: '🌡️', risks: [
                { name: 'Reversal (Buffer Pool)', sev: 'High', mit: 'REDD+ buffer account (15–30% VCU withheld)', std: 'VCS CAR' },
                { name: 'Forest Fire / Drought', sev: 'High', mit: 'Insurance, regional diversification', std: 'VCS/GS' },
                { name: 'Policy Change (sovereign)', sev: 'Medium', mit: 'Article 6 corresponding adjustment', std: 'UNFCCC' },
                { name: 'Land Tenure Dispute', sev: 'High', mit: 'FPIC documentation, title insurance', std: 'CCBA' },
              ]},
              { cat: 'Additionality Risk', icon: '📐', risks: [
                { name: 'Leakage (displacement)', sev: 'Medium', mit: 'Jurisdictional REDD+ (JNR), leakage belt', std: 'VCS JNR' },
                { name: 'Baseline Manipulation', sev: 'Medium', mit: 'Dynamic baselines, independent MRV', std: 'VCS v4' },
                { name: 'Common Practice', sev: 'Low', mit: 'Financial additionality test', std: 'All standards' },
                { name: 'Greenwashing Exposure', sev: 'High', mit: 'VCMI CCM compliance, Science-Based targets', std: 'VCMI' },
              ]},
              { cat: 'MRV & Verification', icon: '🔍', risks: [
                { name: 'Remote Sensing Accuracy', sev: 'Low', mit: 'Lidar + Sentinel-2 fusion, annual audits', std: 'VCS/GS' },
                { name: 'VVB Independence', sev: 'Medium', mit: 'Accredited VVBs only (VERRA registry)', std: 'VERRA' },
                { name: 'Methodology Updates', sev: 'Medium', mit: 'VM0015/VM0048 versioning, transition periods', std: 'VERRA' },
                { name: 'Social MRV Deficiency', sev: 'High', mit: 'CCB Social standard, annual PES audits', std: 'CCBA' },
              ]},
            ].map((cat, ci) => (
              <div key={ci} style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>{cat.icon} {cat.cat}</h3>
                {cat.risks.map((r, ri) => (
                  <div key={ri} style={{ padding: '9px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 3,
                        background: r.sev === 'High' ? T.red + '33' : r.sev === 'Medium' ? T.amber + '22' : T.green + '22',
                        color: r.sev === 'High' ? T.red : r.sev === 'Medium' ? T.amber : T.green }}>
                        {r.sev}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{r.mit}</div>
                    <div style={{ fontSize: 10, color: T.teal, marginTop: 2 }}>{r.std}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Price Sensitivity */}
      {activeTab === 7 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('BREAK-EVEN PRICE', `$${fmt(finResult.breakEvenPriceUsd)}/t`, `${selNbsType.toUpperCase()} project`, T.amber)}
            {kpi('CURRENT PRICE', `$${vcuPriceInput}/t`, 'Base assumption', T.gold)}
            {kpi('IRR AT CURRENT', `${fmt(finResult.irr)}%`, `vs ${wacc}% WACC`, finResult.irr >= wacc ? T.green : T.red)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>NPV vs VCU Price (${projectHa.toLocaleString()} ha)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={priceSensData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/tCO2e', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'NPV $M', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, 'NPV']} />
                  <Line type="monotone" dataKey="npv" name="NPV $M" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>IRR vs VCU Price</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={priceSensData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/tCO2e', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'IRR']} />
                  <Line type="monotone" dataKey="irr" name="IRR %" stroke={T.green} strokeWidth={2} dot={{ fill: T.green, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Sensitivity Table — NPV & IRR at Key Price Points</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['VCU Price $/t', 'Net Ann VCUs', 'Ann Revenue $M', 'NPV $M', 'IRR %', 'LCOC $/t', 'Verdict'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceSensData.filter((_, i) => i % 2 === 0).map((row, i) => {
                  const r2 = calcNbsFinancing({ projectHa, nbsType: selNbsType, vcuYield: nbsType.vcuYield, vcuPrice: row.price, cobenefitPremPct: cobenPremPct, projectLifeYr: projectLife, devCostHa: nbsType.avgCostHa, wacc, annOpexHa: nbsType.avgCostHa * 0.04, permanenceBuffer });
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '9px 12px', color: T.gold, fontFamily: T.mono }}>${row.price}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{(r2.netAnnVcus / 1000).toFixed(0)}K t</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{fmtM(r2.annRevenue)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, color: r2.npvM >= 0 ? T.green : T.red }}>{fmtM(r2.npvM)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, color: r2.irr >= wacc ? T.green : T.red }}>{fmt(r2.irr)}%</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono }}>${fmt(r2.lcoc)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 12 }}>
                        <span style={{ color: r2.irr >= wacc ? T.green : T.red }}>
                          {r2.irr >= wacc + 3 ? '✓ Attractive' : r2.irr >= wacc ? '~ Marginal' : '✗ Sub-threshold'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Portfolio Construction */}
      {activeTab === 8 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>Illustrative FI NbS Portfolio — $250M Fund</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['NbS Type', 'Allocation %', '$M', 'Ha', 'Ann VCUs Mt', 'IRR Est.', 'Risk', 'Standard'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { type: 'REDD+ (Brazil/Indonesia)', alloc: 35, m: 87.5, ha: 1200000, vcus: 14.4, irr: '9–12%', risk: 'Medium', std: 'VCS+CCB' },
                  { type: 'A/R (Kenya/Ghana)', alloc: 20, m: 50, ha: 85000, vcus: 0.68, irr: '11–15%', risk: 'Medium', std: 'GS' },
                  { type: 'Blue Carbon (S.E. Asia)', alloc: 15, m: 37.5, ha: 22000, vcus: 0.33, irr: '12–16%', risk: 'High', std: 'VCS+CCB Gold' },
                  { type: 'Peatland Restoration (EU)', alloc: 15, m: 37.5, ha: 45000, vcus: 0.81, irr: '8–11%', risk: 'Low', std: 'VCS' },
                  { type: 'IFM (North America)', alloc: 10, m: 25, ha: 120000, vcus: 0.6, irr: '7–10%', risk: 'Low', std: 'VCS CAR' },
                  { type: 'Art.6.4 ITMOs (Sovereign)', alloc: 5, m: 12.5, ha: 0, vcus: 0.36, irr: '5–8%', risk: 'High', std: 'Art.6.4' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 10px', fontWeight: 600 }}>{row.type}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ background: T.surfaceH, borderRadius: 3, height: 8, width: '100%', marginBottom: 2 }}>
                        <div style={{ background: T.sage, width: `${row.alloc * 2}%`, height: '100%', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: T.textSec, fontSize: 11 }}>{row.alloc}%</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: T.gold, fontFamily: T.mono }}>${row.m}M</td>
                    <td style={{ padding: '9px 10px', fontFamily: T.mono }}>{row.ha > 0 ? `${(row.ha / 1000).toFixed(0)}K` : '—'}</td>
                    <td style={{ padding: '9px 10px', fontFamily: T.mono }}>{row.vcus} Mt</td>
                    <td style={{ padding: '9px 10px', color: T.green, fontFamily: T.mono }}>{row.irr}</td>
                    <td style={{ padding: '9px 10px', color: row.risk === 'High' ? T.amber : row.risk === 'Medium' ? T.gold : T.green, fontSize: 12 }}>{row.risk}</td>
                    <td style={{ padding: '9px 10px', color: T.textMut, fontSize: 12 }}>{row.std}</td>
                  </tr>
                ))}
                <tr style={{ background: T.surfaceH, fontWeight: 700 }}>
                  <td style={{ padding: '10px 10px' }}>TOTAL</td>
                  <td style={{ padding: '10px 10px', color: T.gold }}>100%</td>
                  <td style={{ padding: '10px 10px', color: T.gold, fontFamily: T.mono }}>$250M</td>
                  <td style={{ padding: '10px 10px', fontFamily: T.mono }}>1.47M ha</td>
                  <td style={{ padding: '10px 10px', fontFamily: T.mono, color: T.green }}>17.2 Mt</td>
                  <td style={{ padding: '10px 10px', color: T.green, fontFamily: T.mono }}>9–13%</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 9: Market Outlook */}
      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>NbS Market Outlook 2025–2030</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { yr: '2024', market: 2.1, pipeline: 4.2 },
                  { yr: '2025E', market: 2.8, pipeline: 6.1 },
                  { yr: '2026E', market: 4.1, pipeline: 8.8 },
                  { yr: '2027E', market: 5.9, pipeline: 12.4 },
                  { yr: '2028E', market: 8.2, pipeline: 16.8 },
                  { yr: '2030E', market: 14.6, pipeline: 28.5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$B', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="market" name="Market Size $B" fill={T.sage} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pipeline" name="Pipeline $B" fill={T.border} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Key Market Catalysts</h3>
              {[
                { catalyst: 'VCMI Claims Code of Practice', impact: 'High', timeline: '2025', desc: 'Validation pathway for high-integrity claims driving corporate demand' },
                { catalyst: 'ICVCM CORE Carbon Principles', impact: 'High', timeline: '2024–25', desc: 'Quality threshold elevates REDD+ and A/R prices by 15–25%' },
                { catalyst: 'Article 6.4 Rulebook Finalized', impact: 'Very High', timeline: '2025', desc: 'Unlocks ITMO sovereign pipeline; CORSIA Phase 1 demand' },
                { catalyst: 'EU CRCF Regulation', impact: 'Medium', timeline: '2026', desc: 'EU carbon removal certification creates EU-based NbS demand' },
                { catalyst: 'TNFD v1.0 Adoption', impact: 'Medium', timeline: '2024–26', desc: 'Nature-related disclosures drive biodiversity co-benefit premium' },
                { catalyst: 'SBTi FLAG Land Use Targets', impact: 'High', timeline: '2025', desc: 'Food/land/agriculture sector targets mandate NbS procurement' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.catalyst}</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>{c.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 70 }}>
                    <div style={{ color: c.impact === 'Very High' ? T.green : c.impact === 'High' ? T.gold : T.amber, fontSize: 11 }}>{c.impact}</div>
                    <div style={{ color: T.textMut, fontSize: 10, marginTop: 2 }}>{c.timeline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
