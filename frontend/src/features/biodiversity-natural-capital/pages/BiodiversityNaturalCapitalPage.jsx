import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235',
  navy: '#1e3a5f', navyL: '#2a4f7c', gold: '#d4a843', goldL: '#e8c068', sage: '#2d6a4f',
  sageL: '#3a8a65', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050',
  red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace"
};

// TNFD LEAP framework steps
const TNFD_LEAP = [
  { step: 'L — Locate', desc: 'Locate interfaces with nature across business activities and value chains', subSteps: ['L1: Business footprint', 'L2: Value chain mapping', 'L3: Sector priority', 'L4: Location priority'] },
  { step: 'E — Evaluate', desc: 'Evaluate dependencies and impacts on nature', subSteps: ['E1: Identify impacts', 'E2: Identify dependencies', 'E3: Assess materiality', 'E4: Opportunity assessment'] },
  { step: 'A — Assess', desc: 'Assess material nature-related risks and opportunities', subSteps: ['A1: Physical risk', 'A2: Transition risk', 'A3: Systemic risk', 'A4: Opportunity scoring'] },
  { step: 'P — Prepare', desc: 'Prepare to respond and disclose to investors and other stakeholders', subSteps: ['P1: Strategy', 'P2: Targets & metrics', 'P3: Scenario analysis', 'P4: Disclosure'] },
];

// Biodiversity credit standards
const BIO_STANDARDS = [
  { name: 'UK BNG (Biodiversity Net Gain)', jurisdiction: 'UK', unitType: 'Biodiversity Unit', priceRange: '£15,000–60,000/unit', voluntary: false, regulated: true, methodBasis: 'Defra Biodiversity Metric 4.0', maturity: 'Operational 2024', demandDriver: 'TCPA 2023 mandatory 10% BNG' },
  { name: 'Australia BioCredit', jurisdiction: 'Australia', unitType: 'BCU (Biodiversity Credit Unit)', priceRange: 'A$500–5,000/unit', voluntary: true, regulated: true, methodBasis: 'BioBanking methodology', maturity: 'Mature', demandDriver: 'State planning offsets' },
  { name: 'EU Nature Restoration', jurisdiction: 'EU', unitType: 'Restoration Unit (emerging)', priceRange: '€20–200/ha equiv.', voluntary: false, regulated: false, methodBasis: 'NRL habitat area', maturity: 'Emerging 2026+', demandDriver: 'EU Nature Restoration Law 2024' },
  { name: 'Verra Biodiversity Standard', jurisdiction: 'Global', unitType: 'VCU with biodiversity co-benefit', priceRange: '$5–50/VCU prem.', voluntary: true, regulated: false, methodBasis: 'CCB v4 / VM0048', maturity: 'Active', demandDriver: 'TNFD disclosure, voluntary' },
  { name: 'Terrasos BioToken', jurisdiction: 'Colombia', unitType: 'HaB (Hectare of Biodiversity)', priceRange: '$150–400/HaB', voluntary: true, regulated: false, methodBasis: 'Habitats Bank framework', maturity: 'Pilot', demandDriver: 'Mining/infrastructure offsets' },
  { name: 'IBAT / ENCORE System', jurisdiction: 'Global (FIs)', unitType: 'Ecosystem dependency score', priceRange: 'N/A (analytics)', voluntary: true, regulated: false, methodBasis: 'IBAT polygon data', maturity: 'Operational', demandDriver: 'TNFD/TCFD risk disclosures' },
  { name: 'NCSA (Natural Capital Standard)', jurisdiction: 'Global', unitType: 'Natural Capital Account value $', priceRange: 'Valuation methodology', voluntary: true, regulated: false, methodBasis: 'SEEA-EA / TEEB', maturity: 'Adoption growing', demandDriver: 'Corporate NCA reporting (GRI, ISSB)' },
];

// Ecosystem service valuation categories
const ES_CATEGORIES = [
  { id: 'provisioning', label: 'Provisioning Services', icon: '🌾', items: ['Food/crop yield', 'Fresh water', 'Timber/fibre', 'Genetic resources', 'Medicinal plants'], valueUsdHaYr: 950, portion: 0.24 },
  { id: 'regulating', label: 'Regulating Services', icon: '🌡️', items: ['Carbon sequestration', 'Water purification', 'Flood control', 'Pollination', 'Disease regulation'], valueUsdHaYr: 2100, portion: 0.53 },
  { id: 'cultural', label: 'Cultural Services', icon: '🎨', items: ['Recreation/tourism', 'Spiritual value', 'Educational value', 'Aesthetic value', 'Cultural heritage'], valueUsdHaYr: 380, portion: 0.10 },
  { id: 'supporting', label: 'Supporting Services', icon: '🔄', items: ['Soil formation', 'Nutrient cycling', 'Habitat provision', 'Primary production', 'Water cycling'], valueUsdHaYr: 520, portion: 0.13 },
];

// Sector-level nature dependency (ENCORE framework)
const SECTOR_DEPENDENCIES = [
  { sector: 'Agriculture & Food', depsScore: 92, impactScore: 88, waterDep: 95, soilDep: 90, pollinatorDep: 82, climateRegDep: 78, tnfdPriority: 'Critical' },
  { sector: 'Forestry & Paper', depsScore: 88, impactScore: 85, waterDep: 85, soilDep: 92, pollinatorDep: 65, climateRegDep: 88, tnfdPriority: 'Critical' },
  { sector: 'Mining & Metals', depsScore: 72, impactScore: 95, waterDep: 88, soilDep: 78, pollinatorDep: 20, climateRegDep: 60, tnfdPriority: 'High' },
  { sector: 'Real Estate', depsScore: 65, impactScore: 80, waterDep: 75, soilDep: 68, pollinatorDep: 40, climateRegDep: 72, tnfdPriority: 'High' },
  { sector: 'Pharma & Healthcare', depsScore: 70, impactScore: 45, waterDep: 65, soilDep: 55, pollinatorDep: 35, climateRegDep: 50, tnfdPriority: 'Medium' },
  { sector: 'Financial Services', depsScore: 40, impactScore: 55, waterDep: 42, soilDep: 38, pollinatorDep: 22, climateRegDep: 45, tnfdPriority: 'Medium' },
  { sector: 'Energy (Fossil Fuels)', depsScore: 68, impactScore: 92, waterDep: 80, soilDep: 70, pollinatorDep: 28, climateRegDep: 62, tnfdPriority: 'High' },
  { sector: 'Renewables', depsScore: 55, impactScore: 62, waterDep: 65, soilDep: 60, pollinatorDep: 48, climateRegDep: 55, tnfdPriority: 'Medium' },
];

// GBF (Global Biodiversity Framework) targets — Kunming-Montreal
const GBF_TARGETS = [
  { target: 'Target 2 (30×30)', desc: '30% of land & oceans effectively conserved by 2030', fiImplication: 'Portfolio companies in extractive sectors face land restriction risk', urgency: 'High', deadline: '2030' },
  { target: 'Target 3 (30×30)', desc: '30% of degraded ecosystems under effective restoration', fiImplication: 'NbS and restoration demand surge; biodiversity credit supply growth', urgency: 'High', deadline: '2030' },
  { target: 'Target 15 (Business disclosure)', desc: 'Large companies disclose biodiversity dependencies/impacts', fiImplication: 'TNFD adoption mandatory in multiple jurisdictions by 2026', urgency: 'Critical', deadline: '2030' },
  { target: 'Target 18 (Harmful subsidies)', desc: 'ID and eliminate $500B/yr harmful subsidies', fiImplication: 'Agricultural finance repricing; fertilizer/pesticide sector transition risk', urgency: 'Medium', deadline: '2030' },
  { target: 'Target 19 (Finance)', desc: '$200B/yr biodiversity finance by 2030 (incl. $20B external)', fiImplication: 'FI opportunity in labelled biodiversity instruments, blended finance', urgency: 'High', deadline: '2030' },
];

// FI biodiversity products
const FI_BIO_PRODUCTS = [
  { name: 'Biodiversity-Linked Loan (BLL)', type: 'Lending', rtnTarget: 'SOFR+180–300bps', minMusd: 50, kpiLink: 'BNG units, habitat score, species recovery', premium: '-5 to -25bps KPI step-down' },
  { name: 'Nature Performance Bond', type: 'Bond', rtnTarget: 'Fixed 4–6%', minMusd: 100, kpiLink: 'TNFD metrics, 30×30 area targets, BNG', premium: 'Step-up 25–50bps on miss' },
  { name: 'BNG Credit Forward', type: 'Commodity Forward', rtnTarget: 'Spread trading $/unit', minMusd: 5, kpiLink: 'UK BNG statutory market', premium: 'Bid-offer spread 8–15%' },
  { name: 'Natural Capital Fund', type: 'Alternatives', rtnTarget: 'IRR 8–14%', minMusd: 25, kpiLink: 'Ecosystem service value, biodiversity score', premium: 'Co-benefit premium 15–30%' },
  { name: 'Regenerative Agriculture Finance', type: 'Project Finance', rtnTarget: 'SOFR+250–400bps', minMusd: 10, kpiLink: 'Soil health, water quality, biodiversity', premium: 'USDA NRCS or ELMS subsidy' },
  { name: 'Biodiversity ABS (emerging)', type: 'Securitization', rtnTarget: 'SOFR+200–350bps', minMusd: 150, kpiLink: 'Pooled BNG/BCU cashflows', premium: 'Novel structure; limited precedent' },
];

// --- NCA valuation engine ---
function calcNcaValue({ landHa, ecosystemType, basalAreaFactor, waterQuality, carbonSeq, biodiversityIndex, discountRate, horizon }) {
  const es = ES_CATEGORIES;
  const totalEsHaYr = es.reduce((s, c) => s + c.valueUsdHaYr, 0);
  // Apply ecosystem multipliers
  const ecoMult = { forest: 1.4, wetland: 2.1, grassland: 0.7, marine: 1.6, agricultural: 0.5, urban: 0.4 };
  const mult = ecoMult[ecosystemType] || 1.0;
  const adjustedEsHaYr = totalEsHaYr * mult * (biodiversityIndex / 100) * (waterQuality / 100);
  const annValue = landHa * adjustedEsHaYr;

  // NPV of ecosystem services
  const disc = discountRate / 100;
  let npv = 0;
  for (let y = 1; y <= horizon; y++) {
    npv += annValue / Math.pow(1 + disc, y);
  }

  // Carbon value add-on
  const annCarbonValue = landHa * carbonSeq * 30; // $30/t default
  let carbonNpv = 0;
  for (let y = 1; y <= horizon; y++) {
    carbonNpv += annCarbonValue / Math.pow(1 + disc, y);
  }

  const totalNpv = npv + carbonNpv;
  const bioRichness = Math.round(biodiversityIndex * 0.85 + sr(landHa % 100) * 15);

  return {
    annEsValue: annValue / 1e6,
    annCarbonValue: annCarbonValue / 1e6,
    totalAnnValue: (annValue + annCarbonValue) / 1e6,
    npvM: totalNpv / 1e6,
    perHaValue: adjustedEsHaYr,
    bioRichness,
    carbonSeqAnn: landHa * carbonSeq / 1000, // tCO2 thousands
  };
}

export default function BiodiversityNaturalCapitalPage() {
  const [activeTab, setActiveTab] = useState(0);

  // NCA engine state
  const [landHa, setLandHa] = useState(10000);
  const [ecosystemType, setEcosystemType] = useState('forest');
  const [waterQuality, setWaterQuality] = useState(75);
  const [carbonSeqTHaYr, setCarbonSeqTHaYr] = useState(3.2);
  const [biodiversityIdx, setBiodiversityIdx] = useState(72);
  const [discountRate, setDiscountRate] = useState(5);
  const [horizon, setHorizon] = useState(30);

  // Sector selected for ENCORE radar
  const [selSector, setSelSector] = useState(0);

  const ncaResult = useMemo(() => calcNcaValue({
    landHa, ecosystemType, basalAreaFactor: 1, waterQuality,
    carbonSeq: carbonSeqTHaYr, biodiversityIndex: biodiversityIdx,
    discountRate, horizon,
  }), [landHa, ecosystemType, waterQuality, carbonSeqTHaYr, biodiversityIdx, discountRate, horizon]);

  // Ecosystem service breakdown for pie-like bar
  const esBreakdown = useMemo(() => {
    const ecoMult = { forest: 1.4, wetland: 2.1, grassland: 0.7, marine: 1.6, agricultural: 0.5, urban: 0.4 };
    const mult = ecoMult[ecosystemType] || 1.0;
    return ES_CATEGORIES.map(c => ({
      label: c.label.split(' ')[0],
      value: +(c.valueUsdHaYr * mult * landHa / 1e6 * biodiversityIdx / 100 * waterQuality / 100).toFixed(2),
    }));
  }, [landHa, ecosystemType, biodiversityIdx, waterQuality]);

  // ENCORE radar for selected sector
  const radarData = useMemo(() => {
    const s = SECTOR_DEPENDENCIES[selSector];
    return [
      { subject: 'Water', value: s.waterDep },
      { subject: 'Soil', value: s.soilDep },
      { subject: 'Pollinator', value: s.pollinatorDep },
      { subject: 'Climate Reg', value: s.climateRegDep },
      { subject: 'Overall Dep', value: s.depsScore },
      { subject: 'Impact', value: s.impactScore },
    ];
  }, [selSector]);

  // BNG market growth chart
  const bngGrowthData = useMemo(() => [
    { yr: '2021', uk: 0.2, aus: 1.2, global: 0.3 },
    { yr: '2022', uk: 0.5, aus: 1.6, global: 0.8 },
    { yr: '2023', uk: 1.2, aus: 2.1, global: 1.8 },
    { yr: '2024', uk: 4.5, aus: 2.8, global: 4.2 },
    { yr: '2025E', uk: 12.0, aus: 3.5, global: 9.5 },
    { yr: '2027E', uk: 28.0, aus: 5.0, global: 22.0 },
    { yr: '2030E', uk: 65.0, aus: 8.5, global: 58.0 },
  ], []);

  const tabs = [
    'Overview', 'NCA Valuation Engine', 'TNFD LEAP Framework', 'Sector Dependencies',
    'Biodiversity Credits', 'GBF Targets', 'FI Products', 'Portfolio Alignment', 'Market Outlook', 'Disclosure Standards'
  ];

  const fmt = (v, d = 1) => v == null ? '—' : isFinite(v) ? Number(v).toFixed(d) : '—';
  const fmtM = (v) => `$${fmt(v)}M`;

  const kpi = (label, val, sub, col) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', minWidth: 130 }}>
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
          <span style={{ background: T.sage, color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 11, fontFamily: T.mono }}>EP-DX6</span>
          <span style={{ color: T.textMut, fontSize: 12, fontFamily: T.mono }}>BIODIVERSITY & NATURAL CAPITAL FINANCE INTELLIGENCE</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Biodiversity & Natural Capital Finance</h1>
        <p style={{ margin: '6px 0 0', color: T.textSec, fontSize: 14 }}>
          TNFD LEAP · Natural Capital Accounting · Biodiversity Credits (BNG/BCU) · GBF Target 19 · FI Portfolio Alignment
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
            {kpi('NATURE FINANCE GAP', '$700B/yr', 'Annual funding shortfall', T.red)}
            {kpi('GBF TARGET 19', '$200B/yr', 'By 2030 from all sources', T.amber)}
            {kpi('BNG UK MARKET', '$4.5B', 'Est. 2024 after mandation', T.gold)}
            {kpi('NCA GLOBAL VALUE', '$44T', 'Total ecosystem service value', T.green)}
            {kpi('TNFD ADOPTERS', '400+', 'Companies as of Q1 2024', T.sageL)}
            {kpi('GBF 30×30', '2030', 'Target year for all nations', T.amber)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Ecosystem Service Value by Category (Global)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ES_CATEGORIES.map(c => ({ label: c.label.split(' ')[0], value: c.valueUsdHaYr, portion: Math.round(c.portion * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="label" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/ha/yr', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="value" name="$/ha/yr avg" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Biodiversity Credit Market Growth ($B)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={bngGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="uk" name="UK BNG" stroke={T.gold} fill={T.gold} fillOpacity={0.4} strokeWidth={2} />
                  <Area type="monotone" dataKey="aus" name="Australia BCU" stroke={T.amber} fill={T.amber} fillOpacity={0.3} strokeWidth={2} />
                  <Area type="monotone" dataKey="global" name="Global Bio Credits" stroke={T.sageL} fill={T.sageL} fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {ES_CATEGORIES.map(c => (
              <div key={c.id} style={{ background: T.surface, borderRadius: 8, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{c.label}</div>
                <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 18, marginBottom: 4 }}>${c.valueUsdHaYr.toLocaleString()}</div>
                <div style={{ color: T.textMut, fontSize: 11, marginBottom: 8 }}>avg $/ha/yr · {Math.round(c.portion * 100)}% of total</div>
                {c.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ color: T.textSec, fontSize: 11, marginBottom: 3 }}>• {item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: NCA Valuation Engine */}
      {activeTab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 14, color: T.gold }}>Natural Capital Valuation Engine</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: T.textSec, fontSize: 12, marginBottom: 6 }}>Ecosystem Type</label>
              <select value={ecosystemType} onChange={e => setEcosystemType(e.target.value)}
                style={{ width: '100%', background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text, padding: '8px 10px', borderRadius: 4, fontSize: 13 }}>
                {['forest', 'wetland', 'grassland', 'marine', 'agricultural', 'urban'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            {[
              { label: `Area (ha): ${landHa.toLocaleString()}`, val: landHa, set: setLandHa, min: 500, max: 500000, step: 500 },
              { label: `Biodiversity Index: ${biodiversityIdx}/100`, val: biodiversityIdx, set: setBiodiversityIdx, min: 10, max: 100, step: 5 },
              { label: `Water Quality Score: ${waterQuality}/100`, val: waterQuality, set: setWaterQuality, min: 10, max: 100, step: 5 },
              { label: `Carbon Seq (t/ha/yr): ${carbonSeqTHaYr}`, val: carbonSeqTHaYr, set: setCarbonSeqTHaYr, min: 0.5, max: 20, step: 0.5 },
              { label: `Discount Rate: ${discountRate}%`, val: discountRate, set: setDiscountRate, min: 2, max: 10, step: 0.5 },
              { label: `Horizon (yrs): ${horizon}`, val: horizon, set: setHorizon, min: 10, max: 100, step: 10 },
            ].map(({ label, val, set, min, max, step }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 5 }}>{label}</div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                  style={{ width: '100%', accentColor: T.sage }} />
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {kpi('ANN ES VALUE', fmtM(ncaResult.annEsValue), 'Ecosystem service $/yr', T.gold)}
              {kpi('ANN CARBON VALUE', fmtM(ncaResult.annCarbonValue), `${fmt(ncaResult.carbonSeqAnn, 0)}K tCO2 × $30/t`, T.green)}
              {kpi('TOTAL ANN VALUE', fmtM(ncaResult.totalAnnValue), 'ES + carbon combined', T.gold)}
              {kpi('NCA NPV', fmtM(ncaResult.npvM), `${discountRate}% disc, ${horizon}yr`, T.sageL)}
              {kpi('VALUE PER HA', `$${fmt(ncaResult.perHaValue, 0)}`, '/ha/yr ecosystem services', T.amber)}
              {kpi('BIO RICHNESS IDX', `${ncaResult.bioRichness}/100`, 'Composite biodiversity', T.green)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 13, color: T.gold }}>ES Value Breakdown ($M/yr)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={esBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                    <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                    <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, '']} />
                    <Bar dataKey="value" fill={T.sage} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 13, color: T.gold }}>NCA Valuation Summary</h3>
                {[
                  { label: 'SEEA-EA Method', val: 'Asset account (stock × flow)' },
                  { label: 'TEEB Basis', val: 'Total Economic Value (TEV)' },
                  { label: 'IPBES Aligned', val: 'Nature contributions to people' },
                  { label: 'GRI LEAP Integration', val: 'Material ecosystem services' },
                  { label: 'Discount Rate Applied', val: `${discountRate}% (Ramsey rule)` },
                  { label: 'Ecosystem Multiplier', val: (() => { const m = { forest: 1.4, wetland: 2.1, grassland: 0.7, marine: 1.6, agricultural: 0.5, urban: 0.4 }; return `${m[ecosystemType] || 1.0}× (${ecosystemType})`; })() },
                  { label: 'Carbon Seq Value', val: `$30/t × ${carbonSeqTHaYr} t/ha/yr` },
                  { label: 'NCA per Share (if listed)', val: `$${fmt(ncaResult.npvM / 100, 1)}M per 1M shares` },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec, fontSize: 12 }}>{row.label}</span>
                    <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 12 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: TNFD LEAP */}
      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
            {TNFD_LEAP.map((step, si) => (
              <div key={si} style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ color: T.gold, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{step.step}</div>
                <div style={{ color: T.textSec, fontSize: 13, marginBottom: 14 }}>{step.desc}</div>
                {step.subSteps.map((sub, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.sage + '33', color: T.sageL, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ color: T.text, fontSize: 13 }}>{sub}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>TNFD Disclosure Metrics — Core Set (v1.0)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { cat: 'Exposure', metrics: ['Location of ops in sensitive areas (km²)', 'Share of revenue from nature-dependent sectors (%)', 'Proportion of assets in high-risk biomes'] },
                { cat: 'Dependencies', metrics: ['Water consumption vs. local availability (m³/year)', 'Land use intensity (m²/unit revenue)', 'Pollination service dependency index'] },
                { cat: 'Impacts', metrics: ['Net land conversion (ha/year)', 'Total freshwater consumption (m³)', 'Scope 3 land-use emissions (tCO2e)'] },
                { cat: 'Risks', metrics: ['Financial exposure to nature-related physical risk ($)', 'Transition risk from biodiversity policy (%revenue)', 'ESG rating biodiversity component'] },
                { cat: 'Opportunities', metrics: ['Nature-positive investment pipeline ($)', 'Ecosystem service restoration value ($)', 'Biodiversity credit revenue ($)'] },
                { cat: 'Targets & Strategy', metrics: ['30×30 commitment area (ha)', 'BNG units delivered', 'NCA baseline vs. target ($)'] },
              ].map((c, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{c.cat}</div>
                  {c.metrics.map((m, j) => <div key={j} style={{ color: T.textSec, fontSize: 11, marginBottom: 5 }}>• {m}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sector Dependencies */}
      {activeTab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {SECTOR_DEPENDENCIES.map((s, i) => (
              <button key={i} onClick={() => setSelSector(i)}
                style={{ padding: '6px 14px', fontSize: 12, fontFamily: T.mono, cursor: 'pointer', borderRadius: 4,
                  background: selSector === i ? T.sage : T.surface, color: selSector === i ? '#fff' : T.textSec,
                  border: `1px solid ${selSector === i ? T.sage : T.border}` }}>
                {s.sector}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>ENCORE Dependency Radar — {SECTOR_DEPENDENCIES[selSector].sector}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: T.textMut, fontSize: 9 }} />
                  <Radar name={SECTOR_DEPENDENCIES[selSector].sector} dataKey="value" stroke={T.sage} fill={T.sage} fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Sector Dependency & Impact Overview</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Sector', 'Dep. Score', 'Impact Score', 'TNFD Priority'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTOR_DEPENDENCIES.map((s, i) => (
                    <tr key={i} onClick={() => setSelSector(i)} style={{ cursor: 'pointer', borderBottom: `1px solid ${T.borderL}`, background: selSector === i ? T.surfaceH : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontWeight: selSector === i ? 700 : 400 }}>{s.sector}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ background: T.borderL, borderRadius: 3, height: 7, width: '80%', marginBottom: 2 }}>
                          <div style={{ background: s.depsScore > 80 ? T.red : s.depsScore > 60 ? T.amber : T.green, width: `${s.depsScore}%`, height: '100%', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: T.textMut }}>{s.depsScore}</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ background: T.borderL, borderRadius: 3, height: 7, width: '80%', marginBottom: 2 }}>
                          <div style={{ background: s.impactScore > 80 ? T.red : s.impactScore > 60 ? T.amber : T.green, width: `${s.impactScore}%`, height: '100%', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: T.textMut }}>{s.impactScore}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: s.tnfdPriority === 'Critical' ? T.red : s.tnfdPriority === 'High' ? T.amber : T.gold, fontSize: 12 }}>{s.tnfdPriority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Biodiversity Credits */}
      {activeTab === 4 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>Biodiversity Credit Standards & Markets</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Standard', 'Jurisdiction', 'Unit Type', 'Price Range', 'Voluntary', 'Regulated', 'Maturity', 'Demand Driver'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BIO_STANDARDS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 10px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '9px 10px', color: T.textSec }}>{s.jurisdiction}</td>
                    <td style={{ padding: '9px 10px', color: T.textMut, fontSize: 12 }}>{s.unitType}</td>
                    <td style={{ padding: '9px 10px', color: T.gold, fontFamily: T.mono, fontSize: 12 }}>{s.priceRange}</td>
                    <td style={{ padding: '9px 10px', color: s.voluntary ? T.green : T.textMut, fontSize: 12 }}>{s.voluntary ? '✓' : '—'}</td>
                    <td style={{ padding: '9px 10px', color: s.regulated ? T.amber : T.textMut, fontSize: 12 }}>{s.regulated ? '✓' : '—'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12 }}>
                      <span style={{ background: s.maturity.includes('Operational') || s.maturity === 'Mature' ? T.green + '22' : T.amber + '22',
                        color: s.maturity.includes('Operational') || s.maturity === 'Mature' ? T.green : T.amber,
                        padding: '2px 7px', borderRadius: 3, fontSize: 10 }}>{s.maturity}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: T.textMut, fontSize: 11 }}>{s.demandDriver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: GBF Targets */}
      {activeTab === 5 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('KUNMING-MONTREAL', '23 Targets', 'GBF adopted Dec 2022', T.gold)}
            {kpi('30×30 DEADLINE', '2030', 'Land + ocean conservation', T.amber)}
            {kpi('$200B FINANCE', 'Target 19', 'Biodiversity finance gap', T.green)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {GBF_TARGETS.map((t, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, display: 'flex', gap: 20 }}>
                <div style={{ minWidth: 140 }}>
                  <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 14, fontWeight: 700 }}>{t.target}</div>
                  <div style={{ color: T.textMut, fontSize: 11, marginTop: 4 }}>Deadline: {t.deadline}</div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ background: t.urgency === 'Critical' ? T.red + '33' : t.urgency === 'High' ? T.amber + '22' : T.gold + '22',
                      color: t.urgency === 'Critical' ? T.red : t.urgency === 'High' ? T.amber : T.gold,
                      padding: '2px 8px', borderRadius: 3, fontSize: 11 }}>{t.urgency}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{t.desc}</div>
                  <div style={{ color: T.textSec, fontSize: 13 }}>FI Implication: {t.fiImplication}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: FI Products */}
      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {FI_BIO_PRODUCTS.map((p, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 8, padding: 18, border: `1px solid ${T.border}` }}>
                <div style={{ background: T.sage + '22', color: T.sageL, borderRadius: 3, padding: '2px 8px', fontSize: 10, marginBottom: 10, display: 'inline-block' }}>{p.type}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: T.textMut, fontSize: 11 }}>Return Target</span>
                  <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 12 }}>{p.rtnTarget}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: T.textMut, fontSize: 11 }}>Min Size</span>
                  <span style={{ color: T.textSec, fontFamily: T.mono, fontSize: 12 }}>${p.minMusd}M+</span>
                </div>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: T.textMut }}>KPI Link: </span>{p.kpiLink}
                </div>
                <div style={{ color: T.amber, fontSize: 12 }}>
                  <span style={{ color: T.textMut }}>Incentive: </span>{p.premium}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Portfolio Alignment */}
      {activeTab === 7 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>FI Portfolio Nature Alignment Framework</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { step: '1. Map', desc: 'Use ENCORE/IBAT to map portfolio company locations against biodiversity-sensitive areas (KBAs, IBA, Ramsar sites)', tool: 'ENCORE, IBAT, InVEST' },
                { step: '2. Score', desc: 'Score portfolio by sector nature dependency (TNFD ENCORE taxonomy) and impact intensity', tool: 'TNFD LEAP, SBTN' },
                { step: '3. Assess', desc: 'Calculate portfolio-level biodiversity footprint using MSA (Mean Species Abundance) or BII metric', tool: 'GLOBIO, BII model' },
                { step: '4. Set Targets', desc: 'Set nature-positive targets aligned with GBF Target 15 and SBTN corporate science-based targets', tool: 'SBTN, GBF, TNFD' },
                { step: '5. Engage', desc: 'Engage portfolio companies on TNFD disclosure and nature transition plans (GFNZ framework)', tool: 'GFNZ, PRI', },
                { step: '6. Finance', desc: 'Develop BLL/BNB instruments and labelled biodiversity funds aligned with EU Taxonomy Article 9', tool: 'EU Taxonomy, ICMA' },
                { step: '7. Disclose', desc: 'Disclose using TNFD v1.0 template aligned with ISSB S2 and ESRS E4 (Biodiversity)', tool: 'TNFD, ESRS E4, ISSB' },
                { step: '8. Monitor', desc: 'Track portfolio biodiversity score vs. baseline; report on BNG units, MSA, ecosystem service restoration', tool: 'SEEA, GRI 304' },
              ].map((s, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{s.step}</div>
                  <div style={{ color: T.textSec, fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>{s.desc}</div>
                  <div style={{ color: T.teal, fontSize: 10 }}>Tools: {s.tool}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Nature Alignment Score by Sector (Illustrative Portfolio)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SECTOR_DEPENDENCIES.map(s => ({ sector: s.sector.split(' ')[0], alignment: Math.round(100 - s.impactScore * 0.7 - s.depsScore * 0.3 + sr(s.impactScore) * 30) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Bar dataKey="alignment" name="Alignment Score /100" fill={T.sage} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 8: Market Outlook */}
      {activeTab === 8 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Biodiversity Finance Market 2024–2030 ($B)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={[
                  { yr: '2024', bng: 4.5, nca: 1.2, bioBonds: 8.2, blended: 3.1 },
                  { yr: '2025E', bng: 12, nca: 2.8, bioBonds: 14.5, blended: 6.8 },
                  { yr: '2026E', bng: 24, nca: 5.5, bioBonds: 22, blended: 12 },
                  { yr: '2027E', bng: 42, nca: 9.2, bioBonds: 35, blended: 18 },
                  { yr: '2028E', bng: 68, nca: 15, bioBonds: 52, blended: 28 },
                  { yr: '2030E', bng: 145, nca: 32, bioBonds: 95, blended: 55 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="bioBonds" name="Bio-Labelled Bonds" stackId="a" stroke={T.navy} fill={T.navy} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="bng" name="Biodiversity Credits" stackId="a" stroke={T.sage} fill={T.sage} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="blended" name="Blended Finance" stackId="a" stroke={T.amber} fill={T.amber} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="nca" name="NCA Instruments" stackId="a" stroke={T.gold} fill={T.gold} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Key 2024–2030 Catalysts</h3>
              {[
                { catalyst: 'TNFD v1.0 — Mandatory Adoption', timeline: '2025–2026', impact: 'Very High', desc: 'EU CSRD (ESRS E4) + Singapore MAS + Australia ASRS — TNFD disclosure mandatory' },
                { catalyst: 'UK BNG Mandatory (TCPA 2023)', timeline: 'Enacted Feb 2024', impact: 'High', desc: 'All major UK developments require 10% BNG — immediate statutory market' },
                { catalyst: 'GBF National Biodiversity Strategy', timeline: '2024–2025', impact: 'High', desc: 'All 195 countries submit NBSAPs aligned with GBF — regulatory demand driver' },
                { catalyst: 'ISSB S2 + ESRS E4', timeline: '2025–2026', impact: 'High', desc: 'Biodiversity disclosure mandatory in consolidated sustainability reporting' },
                { catalyst: 'SBTN Corporate SBTs Launch', timeline: '2024', impact: 'Medium', desc: 'Science-Based Targets for Nature — drives corporate biodiversity commitments' },
                { catalyst: 'EU Nature Restoration Law', timeline: '2026', impact: 'Medium', desc: '30% degraded ecosystems restored — procurement and offset demand creation' },
              ].map((c, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{c.catalyst}</span>
                    <span style={{ color: c.impact === 'Very High' ? T.green : c.impact === 'High' ? T.gold : T.amber, fontSize: 11 }}>{c.impact}</span>
                  </div>
                  <div style={{ color: T.textMut, fontSize: 11, marginBottom: 3 }}>{c.timeline}</div>
                  <div style={{ color: T.textSec, fontSize: 12 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Disclosure Standards */}
      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { std: 'TNFD v1.0', status: 'Active 2023', scope: 'Nature-related financial disclosures', pillars: ['Governance', 'Strategy', 'Risk & Impact Mgmt', 'Metrics & Targets'], jurisdictions: 'UK, Singapore, Japan, Australia, EU CSRD-aligned', reportingFreq: 'Annual', crossRef: 'ISSB S1/S2, GRI 304, ESRS E3/E4' },
              { std: 'ESRS E4 (Biodiversity)', status: 'EU Mandatory 2025', scope: 'Biodiversity & ecosystems under CSRD', pillars: ['Policies', 'Actions & resources', 'Targets', 'Metrics (GRI-linked)'], jurisdictions: 'EU (large companies first, SMEs by 2026)', reportingFreq: 'Annual', crossRef: 'TNFD LEAP, GRI 304, SBTN' },
              { std: 'GRI 304 (Biodiversity)', status: 'GRI Universal', scope: 'Operational biodiversity impacts', pillars: ['Sites in/near protected areas', 'Significant impacts', 'Habitats protected/restored', 'IUCN Red List'], jurisdictions: 'Global voluntary (mandatory in some jurisdictions)', reportingFreq: 'Annual', crossRef: 'TNFD, ESRS E4, ISSB S2' },
              { std: 'SBTN (Science-Based Targets)', status: 'Beta 2024', scope: 'Corporate nature-positive commitments', pillars: ['Step 1: Assess', 'Step 2: Interpret', 'Step 3: Measure', 'Step 4: Set targets'], jurisdictions: 'Global voluntary — growing mandatory alignment', reportingFreq: 'Annual (target review 5yr)', crossRef: 'TNFD, GBF Target 15' },
              { std: 'SEEA-EA (Natural Capital Accounting)', status: 'UN Statistical Standard', scope: 'National & corporate ecosystem accounts', pillars: ['Extent accounts', 'Condition accounts', 'Ecosystem service accounts', 'Monetary accounts'], jurisdictions: 'Used by 90+ countries for national accounts', reportingFreq: 'Annual', crossRef: 'TEEB, IPBES, CBD' },
              { std: 'ENCORE (Natural Capital Finance)', status: 'WWF/UNEP FI', scope: 'Financial sector nature risk tool', pillars: ['Production processes', 'Ecosystem services', 'Natural assets', 'Pressure mapping'], jurisdictions: 'Banks, insurers, asset managers globally', reportingFreq: 'Portfolio-level screening', crossRef: 'TNFD, IBAT, Portfolio Earth' },
            ].map((s, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 8, padding: 18, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{s.std}</span>
                  <span style={{ background: T.sage + '33', color: T.sageL, borderRadius: 3, padding: '2px 7px', fontSize: 10 }}>{s.status}</span>
                </div>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 10 }}>{s.scope}</div>
                <div style={{ marginBottom: 10 }}>
                  {s.pillars.map((p, j) => <div key={j} style={{ color: T.text, fontSize: 11, marginBottom: 3 }}>• {p}</div>)}
                </div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 3 }}>{s.jurisdictions}</div>
                <div style={{ fontSize: 10, color: T.teal }}>Cross-ref: {s.crossRef}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
