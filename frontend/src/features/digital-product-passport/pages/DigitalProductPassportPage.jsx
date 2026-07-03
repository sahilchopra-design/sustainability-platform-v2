import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, Legend,
  PieChart, Pie, ScatterChart, Scatter, AreaChart, Area,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── static lookups ────────────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  'Batteries & Accumulators', 'Electronics & ICT', 'Textiles & Apparel',
  'Furniture & Wood', 'Construction Materials', 'Vehicles & Transport',
  'Chemicals & Packaging', 'Appliances & HVAC', 'Solar Panels & Renewables',
  'Toys & Leisure',
];
const DPP_STATUSES = ['Issued', 'Draft', 'Not Started', 'In Review'];
const COUNTRIES_MFG = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Poland', 'China', 'US', 'Turkey', 'India', 'Vietnam', 'Bangladesh', 'Mexico', 'Brazil'];
const BATTERY_CHEM = ['Li-ion', 'NiMH', 'Lead-acid', 'Solid-state'];
const MANDATE_YEARS = [2026, 2027, 2028, 2030];

// ─── 250 PRODUCTS ──────────────────────────────────────────────────────────────
const PRODUCTS = Array.from({ length: 250 }, (_, i) => {
  const cat = PRODUCT_CATEGORIES[Math.floor(sr(i * 7) * PRODUCT_CATEGORIES.length)];
  const country = COUNTRIES_MFG[Math.floor(sr(i * 11) * COUNTRIES_MFG.length)];
  const isBattery = cat === 'Batteries & Accumulators' || (cat === 'Electronics & ICT' && sr(i * 3) > 0.6);
  const brandIdx = Math.floor(sr(i * 13) * 20);
  const brands = ['Bosch', 'Siemens', 'ABB', 'Schneider', 'Philips', 'LG', 'Samsung', 'Panasonic', 'Miele', 'Honeywell',
    'Grundfos', 'Danfoss', 'Legrand', 'Eaton', 'Flir', 'Thales', 'Vestas', 'Inditex', 'IKEA', 'Renault'];
  const espr = Math.round(sr(i * 17) * 55 + 35);
  const cf = Math.round(sr(i * 19) * 1800 + 80);
  return {
    id: `DPP-${String(i + 1).padStart(4, '0')}`,
    name: `Product ${i + 1} (${cat.split(' ')[0]})`,
    brand: brands[brandIdx],
    category: cat,
    sku: `SKU-${String(Math.floor(sr(i * 23) * 99999)).padStart(5, '0')}`,
    country,
    dppStatus: DPP_STATUSES[Math.floor(sr(i * 29) * DPP_STATUSES.length)],
    espr_score: espr,
    recycledContent: Math.round(sr(i * 31) * 65 + 5),
    repairabilityScore: Math.round(sr(i * 37) * 8 + 1),
    carbonFootprint: cf,
    scope1: Math.round(cf * (0.1 + sr(i * 41) * 0.15)),
    scope2: Math.round(cf * (0.15 + sr(i * 43) * 0.2)),
    scope3: Math.round(cf * (0.4 + sr(i * 47) * 0.3)),
    energyConsumption: Math.round(sr(i * 53) * 900 + 30),
    lifespan: Math.round(sr(i * 59) * 18 + 2),
    recyclability: Math.round(sr(i * 61) * 60 + 25),
    hazardousSubstances: sr(i * 67) > 0.6,
    batteryChemistry: isBattery ? BATTERY_CHEM[Math.floor(sr(i * 71) * BATTERY_CHEM.length)] : null,
    eprFee: Math.round(sr(i * 73) * 180 + 10),
    dppMandateYear: MANDATE_YEARS[Math.floor(sr(i * 79) * MANDATE_YEARS.length)],
    dataCompleteness: Math.round(sr(i * 83) * 60 + 30),
    circularityIndex: Math.round(sr(i * 89) * 65 + 20),
    waterFootprint: Math.round(sr(i * 97) * 8000 + 200),
    endOfLifeRecovery: Math.round(sr(i * 101) * 65 + 20),
  };
});

// ─── 25 EPR COUNTRIES ──────────────────────────────────────────────────────────
const EPR_COUNTRIES = [
  'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Poland', 'Belgium',
  'Austria', 'Denmark', 'Finland', 'Portugal', 'Czech Republic', 'Hungary', 'Romania',
  'Greece', 'Slovakia', 'Croatia', 'Bulgaria', 'Slovenia', 'Lithuania', 'Latvia', 'Estonia', 'Norway', 'Switzerland',
].map((country, i) => ({
  country,
  eprRate: Math.round(sr(i * 103) * 3.5 + 0.5 * 10) / 10,
  fee: Math.round(sr(i * 107) * 150 + 15),
  mandateYear: MANDATE_YEARS[Math.floor(sr(i * 109) * MANDATE_YEARS.length)],
  producerRegistry: sr(i * 113) > 0.25,
  compliance: Math.round(sr(i * 127) * 50 + 40),
}));

// ─── 35 DPP FIELDS ─────────────────────────────────────────────────────────────
const DPP_FIELDS = [
  { field: 'Product Identifier (GTIN/UUID)', category: 'Identity', mandatory: true, format: 'string' },
  { field: 'Manufacturer Name', category: 'Identity', mandatory: true, format: 'string' },
  { field: 'Brand / Trademark', category: 'Identity', mandatory: false, format: 'string' },
  { field: 'Date of Production', category: 'Identity', mandatory: true, format: 'date' },
  { field: 'Country of Origin', category: 'Identity', mandatory: true, format: 'string' },
  { field: 'Product Category (HS Code)', category: 'Identity', mandatory: true, format: 'string' },
  { field: 'Carbon Footprint (kgCO₂e)', category: 'Carbon Footprint', mandatory: true, format: 'number' },
  { field: 'Scope 1 Emissions', category: 'Carbon Footprint', mandatory: false, format: 'number' },
  { field: 'Scope 2 Emissions', category: 'Carbon Footprint', mandatory: false, format: 'number' },
  { field: 'Scope 3 Upstream', category: 'Carbon Footprint', mandatory: true, format: 'number' },
  { field: 'LCA Methodology Reference', category: 'Carbon Footprint', mandatory: true, format: 'url' },
  { field: 'Carbon Verification Body', category: 'Carbon Footprint', mandatory: false, format: 'string' },
  { field: 'Material Composition List', category: 'Materials', mandatory: true, format: 'string' },
  { field: 'Recycled Content (%)', category: 'Materials', mandatory: true, format: 'number' },
  { field: 'Hazardous Substances (REACH)', category: 'Materials', mandatory: true, format: 'boolean' },
  { field: 'Critical Raw Materials', category: 'Materials', mandatory: true, format: 'string' },
  { field: 'Packaging Material Type', category: 'Materials', mandatory: false, format: 'string' },
  { field: 'Packaging Recyclability (%)', category: 'Materials', mandatory: false, format: 'number' },
  { field: 'Repairability Index (1–10)', category: 'Repairability', mandatory: true, format: 'number' },
  { field: 'Spare Parts Availability', category: 'Repairability', mandatory: true, format: 'boolean' },
  { field: 'Spare Parts Availability Period (yr)', category: 'Repairability', mandatory: true, format: 'number' },
  { field: 'Disassembly Instructions URL', category: 'Repairability', mandatory: false, format: 'url' },
  { field: 'Software Update Period (yr)', category: 'Repairability', mandatory: false, format: 'number' },
  { field: 'End-of-Life Instructions', category: 'End-of-Life', mandatory: true, format: 'string' },
  { field: 'Recyclability (%)', category: 'End-of-Life', mandatory: true, format: 'number' },
  { field: 'End-of-Life Recovery Rate (%)', category: 'End-of-Life', mandatory: false, format: 'number' },
  { field: 'Collection Point Information', category: 'End-of-Life', mandatory: false, format: 'string' },
  { field: 'Environmental Product Declaration (EPD)', category: 'Compliance', mandatory: true, format: 'url' },
  { field: 'ESPR Regulation Reference', category: 'Compliance', mandatory: true, format: 'string' },
  { field: 'EU Conformity Declaration', category: 'Compliance', mandatory: true, format: 'boolean' },
  { field: 'CE Marking Status', category: 'Compliance', mandatory: true, format: 'boolean' },
  { field: 'Supply Chain Certifications', category: 'Compliance', mandatory: false, format: 'string' },
  { field: 'Battery Chemistry (if applicable)', category: 'Compliance', mandatory: false, format: 'string' },
  { field: 'Battery State of Health (%)', category: 'Compliance', mandatory: false, format: 'number' },
  { field: 'DPP Digital Link (QR/RFID)', category: 'Compliance', mandatory: true, format: 'url' },
];
const FIELD_GROUPS = ['Identity', 'Carbon Footprint', 'Materials', 'Repairability', 'End-of-Life', 'Compliance'];

// ─── LIFECYCLE STAGES ──────────────────────────────────────────────────────────
const LIFECYCLE_STAGES = ['Raw Material Extraction', 'Manufacturing', 'Transport & Distribution', 'Use Phase', 'End of Life'];

// ─── 100 SUPPLY CHAIN NODES ───────────────────────────────────────────────────
const SC_COMPANIES = ['BASF', 'Glencore', 'Umicore', 'Covestro', 'Solvay', 'Lanxess', 'Evonik', 'Clariant', 'Victrex',
  'Arkema', 'Sabic', 'LyondellBasell', 'Celanese', 'Sumitomo', 'Mitsui', 'Toray', 'Teijin', 'Owens Corning',
  'Borealis', 'Trinseo'];
const SUPPLY_CHAIN_NODES = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  company: SC_COMPANIES[i % SC_COMPANIES.length] + (i >= SC_COMPANIES.length ? ` ${Math.floor(i / SC_COMPANIES.length) + 1}` : ''),
  tier: (Math.floor(sr(i * 131) * 3) + 1),
  country: COUNTRIES_MFG[Math.floor(sr(i * 137) * COUNTRIES_MFG.length)],
  category: PRODUCT_CATEGORIES[Math.floor(sr(i * 139) * PRODUCT_CATEGORIES.length)],
  riskScore: Math.round(sr(i * 149) * 85 + 10),
  verified: sr(i * 151) > 0.35,
}));

// ─── UI Components ─────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 0 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => {
  const map = {
    green: { bg: '#d1fae5', text: '#065f46' }, red: { bg: '#fee2e2', text: '#991b1b' },
    amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' },
    gray: { bg: '#f3f4f6', text: '#374151' }, teal: { bg: '#ccfbf1', text: '#134e4a' },
    indigo: { bg: '#e0e7ff', text: '#3730a3' }, purple: { bg: '#ede9fe', text: '#5b21b6' },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
};

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.teal}`, paddingBottom: 6, marginBottom: 14, letterSpacing: '0.02em' }}>
    {children}
  </div>
);

const TABS = [
  'Product Registry', 'ESPR Compliance', 'DPP Schema Analytics',
  'Lifecycle GHG & LCA', 'Circularity & Repairability',
  'Battery Regulation', 'EPR & Producer Responsibility', 'Supply Chain Traceability',
];

const PIE_COLORS = [T.teal, T.blue, T.amber, T.red, T.indigo, T.green, T.purple, T.orange, T.sage, T.navy];
const STATUS_COLOR = { Issued: 'teal', Draft: 'blue', 'Not Started': 'gray', 'In Review': 'amber' };

// ─── helpers ──────────────────────────────────────────────────────────────────
const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const fmt1 = n => Number(n).toFixed(1);

export default function DigitalProductPassportPage() {
  const [tab, setTab] = useState(0);
  const [catFilter, setCatFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mfgSlider, setMfgSlider] = useState(0);
  const [recycleSlider, setRecycleSlider] = useState(50);
  const [traceSlider, setTraceSlider] = useState(50);
  const [fieldSlider, setFieldSlider] = useState(70);
  const [scSearch, setScSearch] = useState('');

  // Field filled status (seeded)
  const fieldFilled = useMemo(() => DPP_FIELDS.map((_, i) => sr(i * 157 + 3) > 0.30), []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let arr = PRODUCTS;
    if (catFilter !== 'All') arr = arr.filter(p => p.category === catFilter);
    if (countryFilter !== 'All') arr = arr.filter(p => p.country === countryFilter);
    if (statusFilter !== 'All') arr = arr.filter(p => p.dppStatus === statusFilter);
    if (search.trim()) arr = arr.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
    return arr;
  }, [catFilter, countryFilter, statusFilter, search]);

  // KPIs
  const issuedCount = PRODUCTS.filter(p => p.dppStatus === 'Issued').length;
  const avgEspr = fmt1(avg(PRODUCTS.map(p => p.espr_score)));
  const avgCarbon = Math.round(avg(PRODUCTS.map(p => p.carbonFootprint)));

  // ESPR by category
  const esprByCategory = useMemo(() => PRODUCT_CATEGORIES.map(cat => {
    const cats = PRODUCTS.filter(p => p.category === cat);
    return { cat: cat.split(' ')[0], avg: Math.round(avg(cats.map(p => p.espr_score))), count: cats.length };
  }), []);

  // Mandate year counts
  const mandateCounts = useMemo(() => MANDATE_YEARS.map(y => ({
    year: y, count: PRODUCTS.filter(p => p.dppMandateYear === y).length,
  })), []);

  // Top/bottom 15 by ESPR
  const sortedByEspr = useMemo(() => [...PRODUCTS].sort((a, b) => b.espr_score - a.espr_score), []);
  const top15 = sortedByEspr.slice(0, 15);
  const bottom15 = sortedByEspr.slice(-15);

  // DPP Schema: field group stats
  const fieldGroupStats = useMemo(() => FIELD_GROUPS.map(grp => {
    const grpFields = DPP_FIELDS.filter(f => f.category === grp);
    const grpIdxs = grpFields.map(f => DPP_FIELDS.indexOf(f));
    const filled = grpIdxs.filter(i => fieldFilled[i]).length;
    const mandatory = grpFields.filter(f => f.mandatory).length;
    const mandatoryFilled = grpFields.filter((f, li) => f.mandatory && fieldFilled[grpIdxs[li]]).length;
    return { grp, total: grpFields.length, filled, mandatory, mandatoryFilled, pct: Math.round(grpFields.length ? filled / grpFields.length * 100 : 0) };
  }), [fieldFilled]);

  // What-if DPP readiness
  const dppReadiness = Math.min(100, Math.round((fieldSlider / 100) * 85 + 15));
  const filledCount = fieldFilled.filter(Boolean).length;
  const completeness = Math.round(filledCount / DPP_FIELDS.length * 100);

  // Lifecycle GHG seeded per stage
  const lifecycleData = useMemo(() => LIFECYCLE_STAGES.map((stage, i) => ({
    stage: stage.length > 22 ? stage.slice(0, 20) + '…' : stage,
    scope1: Math.round(sr(i * 163 + 1) * 40 + 10),
    scope2: Math.round(sr(i * 167 + 2) * 35 + 8),
    scope3: Math.round(sr(i * 173 + 3) * 80 + 20),
  })), []);
  const totalCF = lifecycleData.reduce((s, r) => s + r.scope1 + r.scope2 + r.scope3, 0);

  // Top 20 carbon products
  const top20Carbon = useMemo(() => [...PRODUCTS].sort((a, b) => b.carbonFootprint - a.carbonFootprint).slice(0, 20), []);

  // Category avg carbon
  const catAvgCarbon = useMemo(() => PRODUCT_CATEGORIES.map(cat => {
    const cats = PRODUCTS.filter(p => p.category === cat);
    return { cat: cat.split(' & ')[0].split(' ')[0], avg: Math.round(avg(cats.map(p => p.carbonFootprint))) };
  }), []);

  // What-if carbon reduction
  const baseCarbon = avgCarbon;
  const reducedCarbon = Math.round(baseCarbon * (1 - mfgSlider / 100 * 0.55));

  // Circularity scatter data
  const scatterData = useMemo(() => PRODUCTS.filter((_, i) => i % 5 === 0).map(p => ({
    x: p.recyclability, y: p.circularityIndex, z: p.recycledContent, name: p.name,
  })), []);

  // Repairability by category
  const repairByCategory = useMemo(() => PRODUCT_CATEGORIES.map(cat => {
    const cats = PRODUCTS.filter(p => p.category === cat);
    return { cat: cat.split(' ')[0], avg: fmt1(avg(cats.map(p => p.repairabilityScore))) };
  }), []);

  // End-of-life by country (first 12)
  const eolByCountry = useMemo(() => COUNTRIES_MFG.slice(0, 12).map(c => {
    const cs = PRODUCTS.filter(p => p.country === c);
    return { country: c.slice(0, 3), avg: Math.round(avg(cs.map(p => p.endOfLifeRecovery))) };
  }), []);

  // Circular savings what-if
  const annualTonnes = 50000;
  const circularSavings = Math.round(annualTonnes * recycleSlider / 100 * 0.42);

  // Battery products
  const batteryProducts = useMemo(() => PRODUCTS.filter(p => p.batteryChemistry !== null), []);
  const chemDist = useMemo(() => BATTERY_CHEM.map(ch => ({
    name: ch, value: batteryProducts.filter(p => p.batteryChemistry === ch).length,
  })), [batteryProducts]);
  const brandBatteryReadiness = useMemo(() => {
    const brands = [...new Set(batteryProducts.map(p => p.brand))].slice(0, 10);
    return brands.map(b => {
      const bp = batteryProducts.filter(p => p.brand === b);
      return { brand: b, readiness: Math.round(avg(bp.map(p => p.dataCompleteness))) };
    });
  }, [batteryProducts]);

  // EPR liability calculator
  const totalEprLiability = Math.round(PRODUCTS.length * avg(EPR_COUNTRIES.map(c => c.fee)));
  const eprComplBar = useMemo(() => [...EPR_COUNTRIES].sort((a, b) => b.compliance - a.compliance), []);

  // Supply chain
  const filteredSC = useMemo(() => {
    if (!scSearch.trim()) return SUPPLY_CHAIN_NODES;
    return SUPPLY_CHAIN_NODES.filter(n => n.company.toLowerCase().includes(scSearch.toLowerCase()) || n.country.toLowerCase().includes(scSearch.toLowerCase()));
  }, [scSearch]);
  const tierDist = useMemo(() => [1, 2, 3].map(t => ({
    name: `Tier ${t}`, value: SUPPLY_CHAIN_NODES.filter(n => n.tier === t).length,
  })), []);
  const highRiskByCat = useMemo(() => PRODUCT_CATEGORIES.map(cat => {
    const nodes = SUPPLY_CHAIN_NODES.filter(n => n.category === cat && n.riskScore >= 70);
    return { cat: cat.split(' ')[0], count: nodes.length };
  }), []);
  const traceRiskReduction = Math.round((traceSlider / 100) * 62);
  const countryRiskBar = useMemo(() => COUNTRIES_MFG.map(c => {
    const nodes = SUPPLY_CHAIN_NODES.filter(n => n.country === c);
    return { country: c.slice(0, 3), avg: Math.round(avg(nodes.map(n => n.riskScore))) };
  }), []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>MODULE E82 · EU ESPR / DPP ANALYTICS</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Digital Product Passport</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 3 }}>ESPR · EU Reg 2023/1542 (Batteries) · ISO 14044 / PEF · EPR · Circularity · Supply Chain</div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#64748b' }}>
            <div>250 Products · 25 EPR Countries</div>
            <div>100 Supply Chain Nodes · 35 DPP Fields</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '13px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: 'none', whiteSpace: 'nowrap',
            color: tab === i ? T.teal : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.teal}` : '2px solid transparent',
            transition: 'color 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── TAB 0: PRODUCT REGISTRY ─────────────────────────────────────────── */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Total Products" value="250" sub="Across 10 categories" />
              <KpiCard label="DPP Issued" value={`${issuedCount} (${Math.round(issuedCount / 250 * 100)}%)`} sub="Status: Issued" color={T.teal} />
              <KpiCard label="Avg ESPR Score" value={avgEspr} sub="Out of 100" color={Number(avgEspr) >= 60 ? T.green : T.amber} />
              <KpiCard label="Avg Carbon Footprint" value={`${avgCarbon.toLocaleString()} kgCO₂e`} sub="Per product, cradle-to-grave" />
            </div>

            {/* Filters */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Search Products</div>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, brand, SKU…"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                {[
                  { label: 'Category', val: catFilter, set: setCatFilter, opts: ['All', ...PRODUCT_CATEGORIES] },
                  { label: 'Country', val: countryFilter, set: setCountryFilter, opts: ['All', ...COUNTRIES_MFG] },
                  { label: 'DPP Status', val: statusFilter, set: setStatusFilter, opts: ['All', ...DPP_STATUSES] },
                ].map(({ label, val, set, opts }) => (
                  <div key={label}>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{label}</div>
                    <select value={val} onChange={e => set(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card }}>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.borderL}`, fontSize: 13, color: T.textSec }}>
                Showing {filteredProducts.length} of 250 products
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['ID', 'Product', 'Brand', 'Category', 'Country', 'DPP Status', 'ESPR', 'Carbon (kgCO₂e)', 'Recycled %', 'Circularity'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice(0, 60).map((p, i) => (
                      <tr key={p.id} onClick={() => setSelectedProduct(p)} style={{
                        borderBottom: `1px solid ${T.borderL}`, cursor: 'pointer',
                        background: selectedProduct?.id === p.id ? '#e0fdfa' : i % 2 === 0 ? T.card : T.sub,
                      }}>
                        <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>{p.id}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '9px 12px', color: T.textPri }}>{p.brand}</td>
                        <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 11 }}>{p.category.split(' & ')[0]}</td>
                        <td style={{ padding: '9px 12px', color: T.textSec }}>{p.country}</td>
                        <td style={{ padding: '9px 12px' }}><Badge label={p.dppStatus} color={STATUS_COLOR[p.dppStatus]} /></td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: p.espr_score >= 70 ? T.green : p.espr_score >= 50 ? T.amber : T.red }}>{p.espr_score}</td>
                        <td style={{ padding: '9px 12px', color: T.textPri }}>{p.carbonFootprint.toLocaleString()}</td>
                        <td style={{ padding: '9px 12px', color: T.textPri }}>{p.recycledContent}%</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: p.circularityIndex >= 60 ? T.teal : T.textSec }}>{p.circularityIndex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Detail Panel */}
            {selectedProduct && (
              <div style={{ background: T.card, border: `2px solid ${T.teal}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>{selectedProduct.id} · {selectedProduct.sku} · {selectedProduct.brand}</div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSec, fontSize: 18 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
                  {[
                    { label: 'DPP Status', value: <Badge label={selectedProduct.dppStatus} color={STATUS_COLOR[selectedProduct.dppStatus]} /> },
                    { label: 'ESPR Score', value: `${selectedProduct.espr_score}/100`, color: selectedProduct.espr_score >= 70 ? T.green : T.amber },
                    { label: 'Carbon Footprint', value: `${selectedProduct.carbonFootprint.toLocaleString()} kgCO₂e` },
                    { label: 'Recycled Content', value: `${selectedProduct.recycledContent}%` },
                    { label: 'Repairability', value: `${selectedProduct.repairabilityScore}/10` },
                    { label: 'Circularity Index', value: `${selectedProduct.circularityIndex}/100`, color: T.teal },
                    { label: 'Battery Chemistry', value: selectedProduct.batteryChemistry || 'N/A' },
                    { label: 'EPR Fee', value: `€${selectedProduct.eprFee}/unit` },
                    { label: 'DPP Mandate Year', value: selectedProduct.dppMandateYear },
                    { label: 'Data Completeness', value: `${selectedProduct.dataCompleteness}%` },
                    { label: 'Water Footprint', value: `${selectedProduct.waterFootprint.toLocaleString()} L` },
                    { label: 'EoL Recovery', value: `${selectedProduct.endOfLifeRecovery}%` },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: T.sub, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 1: ESPR COMPLIANCE ──────────────────────────────────────────── */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Avg ESPR Score" value={avgEspr} sub="All 250 products" color={T.teal} />
              <KpiCard label="ESPR Ready (≥80)" value={PRODUCTS.filter(p => p.espr_score >= 80).length} sub="Products above threshold" color={T.green} />
              <KpiCard label="At Risk (<50)" value={PRODUCTS.filter(p => p.espr_score < 50).length} sub="Products below threshold" color={T.red} />
              <KpiCard label="2026 Mandate Products" value={PRODUCTS.filter(p => p.dppMandateYear === 2026).length} sub="Immediate compliance required" color={T.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>ESPR Score by Product Category</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={esprByCategory} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v}/100`, 'Avg ESPR']} />
                    <Bar dataKey="avg" fill={T.teal} radius={[4, 4, 0, 0]} name="Avg ESPR Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>DPP Mandate Year Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mandateCounts} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [v, 'Products']} />
                    <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} name="Products" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Top 15 Products — ESPR Score</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={top15.map(p => ({ name: p.id, score: p.espr_score }))} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill={T.green} radius={[0, 4, 4, 0]} name="ESPR Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Bottom 15 Products — ESPR Score (Compliance Gap)</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={bottom15.map(p => ({ name: p.id, score: p.espr_score })).reverse()} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill={T.red} radius={[0, 4, 4, 0]} name="ESPR Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-product article compliance checklist for selected product */}
            {selectedProduct ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Article Compliance Checklist — {selectedProduct.name}</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {[
                    { req: 'Art. 4 — Unique product identifier', met: true },
                    { req: 'Art. 7(1)(a) — Carbon footprint declared', met: selectedProduct.carbonFootprint > 0 },
                    { req: 'Art. 7(1)(b) — Material composition', met: selectedProduct.recycledContent > 0 },
                    { req: 'Art. 7(1)(c) — Hazardous substances listed', met: !selectedProduct.hazardousSubstances },
                    { req: 'Art. 8 — Repairability score provided', met: selectedProduct.repairabilityScore >= 5 },
                    { req: 'Art. 9 — End-of-life recovery data', met: selectedProduct.endOfLifeRecovery > 30 },
                    { req: 'Art. 12 — EPR registration complete', met: selectedProduct.eprFee > 0 },
                    { req: 'Art. 14 — DPP digital link (QR/RFID)', met: selectedProduct.dppStatus === 'Issued' },
                    { req: 'Reg. 2023/1542 — Battery chemistry (if applicable)', met: !selectedProduct.batteryChemistry || selectedProduct.dataCompleteness > 50 },
                    { req: 'ESPR Delegated Act — Data completeness ≥80%', met: selectedProduct.dataCompleteness >= 80 },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 7, background: r.met ? '#f0fdf4' : '#fef2f2', border: `1px solid ${r.met ? '#bbf7d0' : '#fca5a5'}` }}>
                      <span style={{ color: r.met ? T.green : T.red, fontWeight: 700, fontSize: 15 }}>{r.met ? '✓' : '✗'}</span>
                      <span style={{ fontSize: 12, color: T.textPri }}>{r.req}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: T.sub, border: `1px dashed ${T.border}`, borderRadius: 10, padding: 24, textAlign: 'center', color: T.textSec, fontSize: 13 }}>
                Click a product row in the Product Registry tab to see its per-article compliance checklist here.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: DPP SCHEMA ANALYTICS ─────────────────────────────────────── */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Fields Filled" value={`${filledCount} / 35`} sub={`${completeness}% completeness`} color={T.teal} />
              <KpiCard label="Mandatory Fields Met" value={`${fieldFilled.filter((f, i) => f && DPP_FIELDS[i]?.mandatory).length} / ${DPP_FIELDS.filter(f => f.mandatory).length}`} sub="Regulatory minimum" color={T.green} />
              <KpiCard label="Critical Gaps" value={DPP_FIELDS.filter((f, i) => f.mandatory && !fieldFilled[i]).length} sub="Mandatory fields missing" color={T.red} />
              <KpiCard label="Schema Version" value="DPP v2.1" sub="ESPR Draft Implementing Act 2024" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Field group completeness */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Field Group Completeness (%)</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={fieldGroupStats} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="grp" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip />
                    <Bar dataKey="pct" fill={T.teal} radius={[4, 4, 0, 0]} name="Completeness %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Data quality radar */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Data Quality Score by Field Group</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={fieldGroupStats.map(g => ({ dim: g.grp.split(' ')[0], score: g.pct }))}>
                    <PolarGrid stroke={T.borderL} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Completeness" dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mandatory vs Optional fill rates */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>Mandatory vs Optional Field Fill Rates by Group</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fieldGroupStats} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="grp" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mandatoryFilled" fill={T.green} name="Mandatory Filled" stackId="a" />
                  <Bar dataKey="filled" fill={T.teal} name="Optional Filled" stackId="b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* What-if field completion slider */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>What-If: Field Completion → DPP Readiness Score</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10 }}>Target Data Completeness: <strong style={{ color: T.navy }}>{fieldSlider}%</strong></div>
                  <input type="range" min={30} max={100} value={fieldSlider} onChange={e => setFieldSlider(+e.target.value)}
                    style={{ width: '100%', accentColor: T.teal }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSec, marginTop: 2 }}>
                    <span>30%</span><span>100%</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <KpiCard label="Projected DPP Readiness" value={`${dppReadiness}%`} color={dppReadiness >= 80 ? T.green : dppReadiness >= 60 ? T.amber : T.red} sub="Estimated readiness score" />
                  <KpiCard label="Readiness Tier" value={dppReadiness >= 80 ? 'Ready' : dppReadiness >= 60 ? 'In Progress' : 'At Risk'} color={dppReadiness >= 80 ? T.green : dppReadiness >= 60 ? T.amber : T.red} sub="ESPR compliance tier" />
                </div>
              </div>
            </div>

            {/* Field gap priority matrix */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <SectionTitle>Field Gap Priority Matrix — Mandatory Fields Missing</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {DPP_FIELDS.filter((f, i) => f.mandatory && !fieldFilled[i]).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#fef2f2', borderRadius: 7, border: '1px solid #fca5a5' }}>
                    <span style={{ color: T.red, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>!</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{f.field}</div>
                      <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{f.category} · {f.format}</div>
                    </div>
                  </div>
                ))}
                {DPP_FIELDS.filter((f, i) => f.mandatory && !fieldFilled[i]).length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: T.green, fontWeight: 700 }}>All mandatory fields are populated.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: LIFECYCLE GHG & LCA ──────────────────────────────────────── */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Portfolio Avg Carbon" value={`${avgCarbon.toLocaleString()} kgCO₂e`} sub="Per product, cradle-to-grave" color={T.teal} />
              <KpiCard label="Highest Carbon Product" value={`${top20Carbon[0]?.carbonFootprint.toLocaleString()} kgCO₂e`} sub={top20Carbon[0]?.name} color={T.red} />
              <KpiCard label="Lowest Carbon Product" value={`${[...PRODUCTS].sort((a, b) => a.carbonFootprint - b.carbonFootprint)[0].carbonFootprint.toLocaleString()} kgCO₂e`} sub="Best-in-class" color={T.green} />
              <KpiCard label="Total Portfolio GHG" value={`${(PRODUCTS.reduce((s, p) => s + p.carbonFootprint, 0) / 1000).toFixed(0)} tCO₂e`} sub="Sum across 250 products" />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>Lifecycle Stage Breakdown — Scope 1 / 2 / 3 Stacked (kgCO₂e)</SectionTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={lifecycleData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} unit=" kg" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="scope1" stackId="a" fill={T.green} name="Scope 1" />
                  <Bar dataKey="scope2" stackId="a" fill={T.blue} name="Scope 2" />
                  <Bar dataKey="scope3" stackId="a" fill={T.amber} name="Scope 3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Top 20 Highest Carbon Products</SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top20Carbon.map(p => ({ id: p.id, cf: p.carbonFootprint }))} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="id" width={70} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={v => [`${v.toLocaleString()} kgCO₂e`, 'Carbon Footprint']} />
                    <Bar dataKey="cf" fill={T.red} radius={[0, 4, 4, 0]} name="Carbon (kgCO₂e)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Avg Carbon Footprint by Product Category</SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={catAvgCarbon} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit=" kg" />
                    <Tooltip formatter={v => [`${v} kgCO₂e`, 'Avg Carbon']} />
                    <Bar dataKey="avg" fill={T.indigo} radius={[4, 4, 0, 0]} name="Avg Carbon (kgCO₂e)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* What-if carbon reduction */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <SectionTitle>What-If: Manufacturing Efficiency Improvement → Carbon Reduction</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10 }}>Manufacturing Efficiency Gain: <strong style={{ color: T.navy }}>{mfgSlider}%</strong></div>
                  <input type="range" min={0} max={100} value={mfgSlider} onChange={e => setMfgSlider(+e.target.value)}
                    style={{ width: '100%', accentColor: T.teal }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSec, marginTop: 2 }}>
                    <span>0% (baseline)</span><span>100%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Applies manufacturing-stage efficiency gain (up to 55% of total product carbon) using PEF scope 1+2 reduction pathway.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <KpiCard label="Baseline Avg Carbon" value={`${baseCarbon.toLocaleString()} kgCO₂e`} sub="Current portfolio avg" />
                  <KpiCard label="Projected Avg Carbon" value={`${reducedCarbon.toLocaleString()} kgCO₂e`} color={T.green} sub={`-${Math.round((1 - reducedCarbon / baseCarbon) * 100)}% vs baseline`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: CIRCULARITY & REPAIRABILITY ─────────────────────────────── */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Avg Circularity Index" value={fmt1(avg(PRODUCTS.map(p => p.circularityIndex)))} sub="Portfolio average" color={T.teal} />
              <KpiCard label="Avg Recyclability" value={`${Math.round(avg(PRODUCTS.map(p => p.recyclability)))}%`} sub="Products portfolio avg" color={T.green} />
              <KpiCard label="Avg Recycled Content" value={`${Math.round(avg(PRODUCTS.map(p => p.recycledContent)))}%`} sub="Across 250 products" />
              <KpiCard label="Avg Repairability Score" value={fmt1(avg(PRODUCTS.map(p => p.repairabilityScore)))} sub="Scale 1–10" color={T.indigo} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Scatter: circularity vs recyclability */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Circularity Index vs Recyclability (bubble = Recycled Content %)</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Recyclability" unit="%" tick={{ fontSize: 10 }} label={{ value: 'Recyclability (%)', position: 'bottom', fontSize: 10 }} />
                    <YAxis dataKey="y" name="Circularity" tick={{ fontSize: 10 }} label={{ value: 'Circularity', angle: -90, position: 'left', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} />
                    <Scatter data={scatterData} fill={T.teal} fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {/* Repairability by category */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Avg Repairability Score by Category (1–10)</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={repairByCategory} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [v, 'Avg Repairability']} />
                    <Bar dataKey="avg" fill={T.indigo} radius={[4, 4, 0, 0]} name="Repairability (1–10)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>End-of-Life Recovery Rate by Manufacturing Country (%)</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eolByCountry} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'EoL Recovery']} />
                  <Bar dataKey="avg" fill={T.sage} radius={[4, 4, 0, 0]} name="EoL Recovery %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Circular economy savings calculator */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <SectionTitle>Circular Economy Savings Calculator — What-If: Recycling Rate Improvement</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10 }}>Target Recycling Rate: <strong style={{ color: T.navy }}>{recycleSlider}%</strong></div>
                  <input type="range" min={10} max={100} value={recycleSlider} onChange={e => setRecycleSlider(+e.target.value)}
                    style={{ width: '100%', accentColor: T.teal }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSec, marginTop: 2 }}>
                    <span>10%</span><span>100%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Assumes 50,000 annual units × recycling rate × 0.42 tCO₂e abatement factor (EU Circular Economy Action Plan).</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <KpiCard label="Annual GHG Savings" value={`${circularSavings.toLocaleString()} tCO₂e`} color={T.green} sub="From improved recycling" />
                  <KpiCard label="Recycling Rate Target" value={`${recycleSlider}%`} color={T.teal} sub="vs EU avg ~35%" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: BATTERY REGULATION ────────────────────────────────────────── */}
        {tab === 5 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Battery Products" value={batteryProducts.length} sub="Li-ion, NiMH, Lead-acid, Solid-state" color={T.teal} />
              <KpiCard label="Avg Data Completeness" value={`${Math.round(avg(batteryProducts.map(p => p.dataCompleteness)))}%`} sub="DPP fields populated" color={T.indigo} />
              <KpiCard label="Mandate Readiness (≥80%)" value={batteryProducts.filter(p => p.dataCompleteness >= 80).length} sub="Products EU Reg 2023/1542 ready" color={T.green} />
              <KpiCard label="Avg Battery Carbon" value={`${Math.round(avg(batteryProducts.map(p => p.carbonFootprint)))} kgCO₂e`} sub="Per battery product" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Chemistry distribution pie */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Battery Chemistry Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={chemDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {chemDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Carbon by chemistry */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Avg Carbon Footprint by Battery Chemistry</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={BATTERY_CHEM.map(ch => ({
                    chem: ch, avg: Math.round(avg(batteryProducts.filter(p => p.batteryChemistry === ch).map(p => p.carbonFootprint))),
                  }))} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="chem" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} unit=" kg" />
                    <Tooltip formatter={v => [`${v} kgCO₂e`, 'Avg Carbon']} />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]} name="Avg Carbon">
                      {BATTERY_CHEM.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2027 mandate readiness by brand */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>2027 Mandate Readiness by Brand (Data Completeness %)</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={brandBatteryReadiness} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="brand" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Data Completeness']} />
                  <Bar dataKey="readiness" radius={[4, 4, 0, 0]} name="Readiness %">
                    {brandBatteryReadiness.map((d, i) => <Cell key={i} fill={d.readiness >= 80 ? T.green : d.readiness >= 60 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* State of health / recycled content bar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <SectionTitle>State of Health & Recycled Content — Top 15 Battery Products</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={batteryProducts.slice(0, 15).map(p => ({ id: p.id, recycled: p.recycledContent, eol: p.endOfLifeRecovery }))} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="recycled" fill={T.teal} name="Recycled Content %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="eol" fill={T.green} name="EoL Recovery %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 6: EPR & PRODUCER RESPONSIBILITY ─────────────────────────────── */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="EPR Countries Covered" value="25" sub="EU+ producer responsibility" color={T.teal} />
              <KpiCard label="Avg EPR Fee" value={`€${Math.round(avg(EPR_COUNTRIES.map(c => c.fee)))}/unit`} sub="Across all 25 countries" />
              <KpiCard label="Total EPR Liability (est.)" value={`€${(totalEprLiability / 1000).toFixed(0)}k`} sub="250 products × avg fee" color={T.red} />
              <KpiCard label="Avg Compliance Score" value={`${Math.round(avg(EPR_COUNTRIES.map(c => c.compliance)))}%`} sub="Producer registry status" color={T.green} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>EPR Compliance Score by Country (%)</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={eprComplBar} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="country" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Compliance']} />
                  <Bar dataKey="compliance" radius={[4, 4, 0, 0]} name="Compliance %">
                    {eprComplBar.map((d, i) => <Cell key={i} fill={d.compliance >= 70 ? T.green : d.compliance >= 50 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>EPR Fee Comparison by Country (€/unit)</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...EPR_COUNTRIES].sort((a, b) => b.fee - a.fee)} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="country" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} unit="€" />
                    <Tooltip formatter={v => [`€${v}`, 'EPR Fee/unit']} />
                    <Bar dataKey="fee" fill={T.indigo} radius={[4, 4, 0, 0]} name="EPR Fee (€/unit)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Producer Registry Coverage</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={EPR_COUNTRIES.map(c => ({ country: c.country.slice(0, 3), coverage: c.producerRegistry ? 100 : 0 }))} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="country" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [v === 100 ? 'Registered' : 'Not Registered', 'Registry']} />
                    <Bar dataKey="coverage" radius={[4, 4, 0, 0]} name="Registry">
                      {EPR_COUNTRIES.map((c, i) => <Cell key={i} fill={c.producerRegistry ? T.green : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EPR liability table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.borderL}`, background: T.sub }}>
                <SectionTitle>EPR Country Detail — Fee, Mandate Year & Registry Status</SectionTitle>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Country', 'EPR Rate (%)', 'Fee (€/unit)', 'Mandate Year', 'Producer Registry', 'Compliance'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EPR_COUNTRIES.map((c, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: T.navy }}>{c.country}</td>
                        <td style={{ padding: '9px 14px', color: T.textPri }}>{c.eprRate}%</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: T.textPri }}>€{c.fee}</td>
                        <td style={{ padding: '9px 14px', color: c.mandateYear <= 2026 ? T.red : T.textPri, fontWeight: c.mandateYear <= 2026 ? 700 : 400 }}>{c.mandateYear}</td>
                        <td style={{ padding: '9px 14px' }}><Badge label={c.producerRegistry ? 'Registered' : 'Not Registered'} color={c.producerRegistry ? 'teal' : 'red'} /></td>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, background: T.borderL, borderRadius: 3, height: 6 }}>
                              <div style={{ width: `${c.compliance}%`, background: c.compliance >= 70 ? T.green : c.compliance >= 50 ? T.amber : T.red, height: 6, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.textPri, width: 32 }}>{c.compliance}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: SUPPLY CHAIN TRACEABILITY ────────────────────────────────── */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              <KpiCard label="Supply Chain Nodes" value="100" sub="Across 3 tiers & 15 countries" color={T.teal} />
              <KpiCard label="Verified Nodes" value={SUPPLY_CHAIN_NODES.filter(n => n.verified).length} sub={`${Math.round(SUPPLY_CHAIN_NODES.filter(n => n.verified).length / 100 * 100)}% verification rate`} color={T.green} />
              <KpiCard label="High-Risk Nodes (≥70)" value={SUPPLY_CHAIN_NODES.filter(n => n.riskScore >= 70).length} sub="Risk score above threshold" color={T.red} />
              <KpiCard label="Avg Risk Score" value={fmt1(avg(SUPPLY_CHAIN_NODES.map(n => n.riskScore)))} sub="Across all 100 nodes" color={T.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Tier distribution pie */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Supplier Tier Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={tierDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {tierDist.map((_, i) => <Cell key={i} fill={[T.teal, T.indigo, T.amber][i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Country risk bar */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Avg Risk Score by Country</SectionTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={countryRiskBar} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [v, 'Avg Risk Score']} />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]} name="Avg Risk Score">
                      {countryRiskBar.map((d, i) => <Cell key={i} fill={d.avg >= 70 ? T.red : d.avg >= 50 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Verified vs unverified by tier */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>Verified vs Unverified Suppliers by Tier</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[1, 2, 3].map(t => {
                    const nodes = SUPPLY_CHAIN_NODES.filter(n => n.tier === t);
                    return { tier: `Tier ${t}`, verified: nodes.filter(n => n.verified).length, unverified: nodes.filter(n => !n.verified).length };
                  })} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="verified" fill={T.green} stackId="a" name="Verified" />
                    <Bar dataKey="unverified" fill={T.red} stackId="a" name="Unverified" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* High-risk by category */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <SectionTitle>High-Risk Suppliers (Score ≥70) by Category</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={highRiskByCat} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [v, 'High-Risk Count']} />
                    <Bar dataKey="count" fill={T.red} radius={[4, 4, 0, 0]} name="High-Risk Nodes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Traceability what-if */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <SectionTitle>What-If: Traceability Depth → Risk Reduction</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10 }}>Traceability Coverage: <strong style={{ color: T.navy }}>{traceSlider}%</strong></div>
                  <input type="range" min={0} max={100} value={traceSlider} onChange={e => setTraceSlider(+e.target.value)}
                    style={{ width: '100%', accentColor: T.teal }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSec, marginTop: 2 }}>
                    <span>0%</span><span>100%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Full Tier 1–3 traceability (blockchain/GS1 EPCIS) reduces portfolio risk by up to 62% (CDP Supply Chain 2024 benchmark).</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <KpiCard label="Portfolio Risk Reduction" value={`-${traceRiskReduction}%`} color={T.green} sub="vs zero-traceability baseline" />
                  <KpiCard label="Nodes Traceable" value={Math.round(100 * traceSlider / 100)} color={T.teal} sub="of 100 supply chain nodes" />
                </div>
              </div>
            </div>

            {/* Supply chain nodes table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.borderL}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Supply Chain Nodes</div>
                <input value={scSearch} onChange={e => setScSearch(e.target.value)} placeholder="Search company or country…"
                  style={{ flex: 1, maxWidth: 260, padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }} />
                <span style={{ fontSize: 12, color: T.textSec }}>{filteredSC.length} nodes</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: T.sub, zIndex: 1 }}>
                    <tr>
                      {['#', 'Company', 'Tier', 'Country', 'Category', 'Risk Score', 'Verified'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSC.slice(0, 100).map((n, i) => (
                      <tr key={n.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '8px 12px', color: T.textSec, fontFamily: T.fontMono, fontSize: 11 }}>{n.id}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{n.company}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={`Tier ${n.tier}`} color={['teal', 'indigo', 'amber'][n.tier - 1]} /></td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{n.country}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{n.category.split(' & ')[0]}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: n.riskScore >= 70 ? T.red : n.riskScore >= 50 ? T.amber : T.green }}>{n.riskScore}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={n.verified ? 'Verified' : 'Unverified'} color={n.verified ? 'green' : 'gray'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
