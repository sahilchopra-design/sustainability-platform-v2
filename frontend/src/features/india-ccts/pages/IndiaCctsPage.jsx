import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { NIFTY_50, INDIA_PROFILE, INDIA_CBAM_EXPOSURE } from '../../../data/indiaDataset';
import { INDIA_CONSTANTS, fmtInr, fmtDual, isIndiaMode } from '../../../data/indiaLocale';
import { CEA_NATIONAL_GRID_EF, PAT_SECTOR_BENCHMARKS } from '../../../data/ceaGridFactors';
import ReportExporter from '../../../components/ReportExporter';
import CurrencyToggle from '../../../components/CurrencyToggle';
import { DATA_CAPTURE_SCHEMAS, METHODOLOGY_ENGINES, TOOL_IMPLEMENTATIONS, validateInputs, generateAssuranceReport, runBatchCalculation, aggregateCCTSPortfolio } from '../../../data/cctsEngine';

/* ── theme ── */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e', blue: '#1e40af'
};
const CC = [T.navy, T.gold, T.indigo, T.green, T.red, T.amber, '#8b5cf6', '#0891b2', '#db2777', '#059669', '#7c3aed', '#d97706'];
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const guard = (n, d, fb = 0) => d > 0 ? n / d : fb;
const pct = (n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;
const fmtN = v => typeof v === 'number' ? (Math.abs(v) >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(1)) : v;
const tip = { contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }, labelStyle: { color: T.navy, fontWeight: 600 } };
const FX = 83.5;

/* ── styles ── */
const cardS = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 };
const kpiS = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' };
const kpiLabel = { fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" };
const kpiVal = { fontSize: 24, fontWeight: 700, color: T.navy, marginTop: 4 };
const kpiUnit = { fontSize: 11, color: T.sub, marginTop: 2 };
const secTitle = { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 };
const tabBar = { display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 20, overflowX: 'auto' };
const tabBtn = (a) => ({ padding: '10px 16px', fontSize: 12, fontWeight: a ? 700 : 500, color: a ? T.navy : T.sub, borderBottom: a ? `3px solid ${T.gold}` : '3px solid transparent', cursor: 'pointer', background: 'none', border: 'none', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" });
const gridRow = (cols = 2) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 20 });
const tblS = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const thS = { padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: "'JetBrains Mono', monospace" };
const tdS = { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 12 };
const badgeS = (bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color });
const selectS = { padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.navy, background: T.card };
const sliderS = { width: '100%', accentColor: T.gold };
const linkS = { color: T.indigo, textDecoration: 'none', fontSize: 12, fontWeight: 600 };

const TABS = [
  'CCTS Overview', 'Compliance Framework', 'Sector Deep-Dive',
  'Approved Methodologies', 'Approved Tools', 'Carbon Pricing & Market',
  'Financial Impact Simulator', 'CBAM Linkage', 'PAT-to-CCTS Transition',
  'Offset Mechanism', 'International Linkage', 'Entity Readiness',
  '🔢 Calculate & Validate', '📋 Assurance Report'
];

/* ═══════════════════════════════════════════════════════════════════════════
   STATIC DATA — Official BEE/MoP CCTS Documentation
   ═══════════════════════════════════════════════════════════════════════════ */

const METHODOLOGIES = [
  { code: 'BM-EN01.001', sector: 'Energy', title: 'Grid-connected renewable electricity generation', category: 'Renewable Energy', applicability: 'Solar PV, Wind, Small Hydro, Biomass power connected to national/state grid', baseline: 'CEA weighted average grid emission factor', crediting_period_yrs: 10, renewable: true, source: 'BEE CCTS Official' },
  { code: 'BM-EN01.002', sector: 'Energy', title: 'Renewable energy generation for captive consumption or third-party sale', category: 'Renewable Energy', applicability: 'Behind-the-meter solar, wind, biomass for industrial/commercial captive use', baseline: 'Grid + captive fossil fuel displacement', crediting_period_yrs: 10, renewable: true, source: 'BEE CCTS Official' },
  { code: 'BM-IN02.001', sector: 'Industry', title: 'Industrial energy efficiency improvement through fuel switching', category: 'Energy Efficiency', applicability: 'Coal to gas, oil to biomass, diesel to electric in industrial processes', baseline: 'Historical fuel consumption x emission factor', crediting_period_yrs: 7, renewable: false, source: 'BEE CCTS Official' },
  { code: 'BM-IN02.002', sector: 'Industry', title: 'Industrial process emissions reduction', category: 'Process Improvement', applicability: 'Clinker substitution in cement, scrap-based steelmaking, aluminium process optimization', baseline: 'Default process emission intensity x production volume', crediting_period_yrs: 7, renewable: false, source: 'BEE CCTS Official' },
  { code: 'BM-WA03.001', sector: 'Waste', title: 'Landfill methane recovery and utilization', category: 'Waste Management', applicability: 'Municipal/industrial landfill gas capture, flaring, or electricity generation', baseline: 'Uncontrolled methane release (IPCC Tier 2)', crediting_period_yrs: 10, renewable: false, source: 'BEE CCTS Official' },
  { code: 'BM-WA03.002', sector: 'Waste', title: 'Waste-to-energy through controlled combustion', category: 'Waste Management', applicability: 'MSW incineration with energy recovery, refuse-derived fuel', baseline: 'Landfill disposal + grid electricity displacement', crediting_period_yrs: 10, renewable: false, source: 'BEE CCTS Official' },
  { code: 'BM-AG04.001', sector: 'Agriculture', title: 'Methane avoidance from agricultural residue management', category: 'Agriculture', applicability: 'Paddy straw management, biogas from agricultural waste, composting', baseline: 'Open burning / anaerobic decomposition emission factors', crediting_period_yrs: 7, renewable: false, source: 'BEE CCTS Official' },
  { code: 'BM-FR05.001', sector: 'Forestry', title: 'Mangrove afforestation and reforestation', category: 'Blue Carbon / Forestry', applicability: 'Coastal mangrove restoration, mangrove plantation on degraded coastal land', baseline: 'Pre-project land carbon stock (typically degraded/barren)', crediting_period_yrs: 30, renewable: false, source: 'BEE CCTS Official' },
  { code: 'BM-FR05.002', sector: 'Forestry', title: 'Afforestation and reforestation of lands except wetlands', category: 'Forestry', applicability: 'Tree planting on degraded/barren non-wetland areas, agroforestry', baseline: 'Pre-project biomass carbon stock', crediting_period_yrs: 30, renewable: false, source: 'BEE CCTS Official' },
];

const TOOLS = [
  { code: 'BM-T-001', title: 'Tool for demonstrating and assessing additionality', category: 'Additionality', scope: 'All sectors' },
  { code: 'BM-T-002', title: 'Tool for calculating project or leakage emissions from fossil fuel combustion', category: 'Emissions Calculation', scope: 'Energy, Industry' },
  { code: 'BM-T-003', title: 'Tool for calculating emissions from electricity consumption', category: 'Emissions Calculation', scope: 'All sectors' },
  { code: 'BM-T-004', title: 'Tool for calculating baseline, project and leakage emissions from electricity generation', category: 'Baseline', scope: 'Energy' },
  { code: 'BM-T-005', title: 'Tool for calculating emission factor for electricity system', category: 'Grid EF', scope: 'Energy' },
  { code: 'BM-T-006', title: 'Tool for calculating project or leakage emissions from methane release', category: 'Emissions Calculation', scope: 'Waste, Agriculture' },
  { code: 'BM-T-008', title: 'Tool for testing significance of GHG emissions', category: 'Significance Testing', scope: 'All sectors' },
  { code: 'BM-T-010', title: 'Tool for identification of baseline scenario', category: 'Baseline', scope: 'All sectors' },
  { code: 'BM-T-011', title: 'Tool for assessment of common practice', category: 'Additionality', scope: 'All sectors' },
  { code: 'BM-T-013', title: 'Tool for calculating project or leakage emissions from transportation', category: 'Emissions Calculation', scope: 'Transport' },
  { code: 'BM-T-014', title: 'Tool for calculating emissions from solid waste disposal', category: 'Emissions Calculation', scope: 'Waste' },
  { code: 'BM-T-015', title: 'Tool for upstream leakage emissions from biomass use', category: 'Leakage', scope: 'Energy, Agriculture' },
  { code: 'BM-T-AR-0002', title: 'Tool for estimation of change in carbon stocks in above-ground biomass', category: 'Carbon Stock', scope: 'Forestry' },
  { code: 'BM-T-AR-0003', title: 'Tool for estimation of change in carbon stocks in below-ground biomass', category: 'Carbon Stock', scope: 'Forestry' },
  { code: 'BM-T-AR-0004', title: 'Tool for estimation of change in carbon stocks in soil organic matter', category: 'Carbon Stock', scope: 'Forestry' },
  { code: 'BM-T-AR-0005', title: 'Tool for estimation of change in carbon stocks in dead wood and litter', category: 'Carbon Stock', scope: 'Forestry' },
  { code: 'BM-T-AR-0006', title: 'Tool for project and leakage emissions from GHG sources in forestry', category: 'Emissions Calculation', scope: 'Forestry' },
];

/* tool-methodology dependency matrix */
const TOOL_METH_MAP = {
  'BM-EN01.001': ['BM-T-001','BM-T-003','BM-T-004','BM-T-005','BM-T-008','BM-T-010','BM-T-011'],
  'BM-EN01.002': ['BM-T-001','BM-T-002','BM-T-003','BM-T-005','BM-T-008','BM-T-010','BM-T-011'],
  'BM-IN02.001': ['BM-T-001','BM-T-002','BM-T-003','BM-T-008','BM-T-010','BM-T-011','BM-T-015'],
  'BM-IN02.002': ['BM-T-001','BM-T-002','BM-T-003','BM-T-008','BM-T-010','BM-T-011'],
  'BM-WA03.001': ['BM-T-001','BM-T-003','BM-T-006','BM-T-008','BM-T-010','BM-T-011'],
  'BM-WA03.002': ['BM-T-001','BM-T-003','BM-T-006','BM-T-008','BM-T-010','BM-T-014'],
  'BM-AG04.001': ['BM-T-001','BM-T-006','BM-T-008','BM-T-010','BM-T-011','BM-T-015'],
  'BM-FR05.001': ['BM-T-001','BM-T-008','BM-T-010','BM-T-AR-0002','BM-T-AR-0003','BM-T-AR-0004','BM-T-AR-0005','BM-T-AR-0006'],
  'BM-FR05.002': ['BM-T-001','BM-T-008','BM-T-010','BM-T-AR-0002','BM-T-AR-0003','BM-T-AR-0004','BM-T-AR-0005','BM-T-AR-0006'],
};

const COMPLIANCE = {
  legalBasis: 'Energy Conservation (Amendment) Act, 2022 (No. 19/2022)',
  gazetteNotification: 'S.O. 2825(E) dated 28 June 2023',
  administrator: 'Bureau of Energy Efficiency (BEE)',
  registry: 'Grid Controller of India (GCI)',
  tradingRegulator: 'CERC',
  exchanges: ['IEX (Indian Energy Exchange)', 'PXIL (Power Exchange India Limited)', 'HPOWERT (Hindustan Power Exchange)'],
  mrvStandard: 'ISO 14064 (entities) + ISO 14065 (ACVAs)',
  penalty: '2x average CCC market price for non-compliance',
  baselineYear: 'FY 2023-24',
  complianceCycles: [
    { year: 'FY 2025-26', phase: 'Phase 1', status: 'Active', sectors: 7 },
    { year: 'FY 2026-27', phase: 'Phase 2', status: 'Planned', sectors: 9 },
  ],
  portalLaunch: '21 March 2026',
  tradingExpected: 'October-November 2026',
};

const INSTITUTIONS = [
  { body: 'NSCICM', fullName: 'National Steering Committee for ICM', role: 'Apex policy direction and inter-ministerial coordination', chair: 'Secretary (MoP)' },
  { body: 'BEE', fullName: 'Bureau of Energy Efficiency', role: 'CCTS administrator: methodology approval, EIVA allocation, MRV oversight, penalty enforcement', chair: 'Director General' },
  { body: 'MoP', fullName: 'Ministry of Power', role: 'Notifying authority for CCTS rules, sector inclusion, compliance cycle parameters', chair: 'Minister of Power' },
  { body: 'MoEFCC', fullName: 'Ministry of Environment, Forest and Climate Change', role: 'NDC alignment, offset methodology oversight, UNFCCC reporting', chair: 'Minister of Environment' },
  { body: 'CPCB', fullName: 'Central Pollution Control Board', role: 'Industrial emission data validation, GHG inventory cross-check', chair: 'Chairman CPCB' },
  { body: 'CERC', fullName: 'Central Electricity Regulatory Commission', role: 'CCC trading regulation, exchange oversight, market surveillance', chair: 'Chairperson CERC' },
  { body: 'GCI', fullName: 'Grid Controller of India', role: 'CCC registry operation, issuance tracking, retirement/surrender recording', chair: 'Director (System Operation)' },
];

const SECTORS = [
  { name: 'Iron & Steel', code: 'ISP', entities: 253, baselineEmissions_mt: 349.5, bauProjection2027_mt: 416.03, targetPostCCTS_mt: 393.06, avoidedEmissions_mt: 23.2, reduction_pct: 5.6, phaseNotification: 'Jan 2026', benchmarks: [{ type: 'BF-BOF', intensity: 2.90, unit: 'tCO2/tCS' }, { type: 'DRI-EAF(Sponge)', intensity: 2.58, unit: 'tCO2/tCS' }, { type: 'Ferro Alloys', intensity: 5.36, unit: 'tCO2/t' }, { type: 'Re-rolling', intensity: 0.45, unit: 'tCO2/t' }], topEntities: ['Tata Steel', 'JSW Steel', 'SAIL', 'Jindal Steel', 'RINL', 'AMNS India', 'Bhushan Power', 'Essar Steel'], cbamOverlap: true, techOptions: ['Electric Arc Furnace', 'Hydrogen DRI', 'CCUS', 'Scrap-based steelmaking', 'Waste heat recovery'] },
  { name: 'Cement', code: 'CEM', entities: 50, baselineEmissions_mt: 185, bauProjection2027_mt: 214.5, targetPostCCTS_mt: 198.1, avoidedEmissions_mt: 16.4, reduction_pct: 7.6, phaseNotification: 'Oct 2025', benchmarks: [{ type: 'OPC', intensity: 0.85, unit: 'tCO2/t clinker' }, { type: 'PPC', intensity: 0.72, unit: 'tCO2/t clinker' }, { type: 'PSC', intensity: 0.68, unit: 'tCO2/t clinker' }], topEntities: ['UltraTech', 'Ambuja', 'ACC', 'Dalmia Bharat', 'Shree Cement', 'Ramco', 'JK Cement', 'India Cements'], cbamOverlap: true, techOptions: ['Clinker substitution (fly ash/slag)', 'Alternative fuels (RDF/biomass)', 'Carbon capture', 'Low-carbon cement (LC3)', 'Waste heat recovery'] },
  { name: 'Aluminium', code: 'ALU', entities: 13, baselineEmissions_mt: 42, bauProjection2027_mt: 48.7, targetPostCCTS_mt: 45.3, avoidedEmissions_mt: 3.4, reduction_pct: 7.06, phaseNotification: 'Oct 2025', benchmarks: [{ type: 'Primary Smelting', intensity: 14.8, unit: 'tCO2/t Al' }, { type: 'Alumina Refining', intensity: 2.5, unit: 'tCO2/t Al' }], topEntities: ['Hindalco', 'Vedanta (BALCO)', 'NALCO'], cbamOverlap: true, techOptions: ['Inert anode technology', 'Renewable power smelting', 'Aluminium recycling', 'Process heat electrification'] },
  { name: 'Chlor-Alkali', code: 'CHL', entities: 30, baselineEmissions_mt: 8, bauProjection2027_mt: 9.2, targetPostCCTS_mt: 8.2, avoidedEmissions_mt: 1.0, reduction_pct: 11, phaseNotification: 'Oct 2025', benchmarks: [{ type: 'Membrane Cell', intensity: 2.6, unit: 'MWh/t caustic' }], topEntities: ['Gujarat Alkalies', 'DCM Shriram', 'Tata Chemicals', 'Grasim Chemicals'], cbamOverlap: false, techOptions: ['Membrane cell conversion', 'Oxygen depolarized cathode', 'RE power procurement'] },
  { name: 'Pulp & Paper', code: 'PAP', entities: 30, baselineEmissions_mt: 12, bauProjection2027_mt: 14.0, targetPostCCTS_mt: 11.9, avoidedEmissions_mt: 2.1, reduction_pct: 15, phaseNotification: 'Oct 2025', benchmarks: [{ type: 'Kraft Mill', intensity: 0.38, unit: 'tOE/t' }], topEntities: ['ITC (Paperboards)', 'JK Paper', 'Tamil Nadu Newsprint', 'West Coast Paper', 'Century Pulp'], cbamOverlap: false, techOptions: ['Black liquor gasification', 'Biomass CHP', 'Waste paper recycling', 'Solar thermal drying'] },
  { name: 'Petroleum Refining', code: 'REF', entities: 21, baselineEmissions_mt: 95, bauProjection2027_mt: 108.2, targetPostCCTS_mt: 103.9, avoidedEmissions_mt: 4.3, reduction_pct: 4, phaseNotification: 'Jan 2026', benchmarks: [{ type: 'Atmospheric Distillation', intensity: 64, unit: 'MBT/BBL' }, { type: 'Complex Refinery', intensity: 85, unit: 'MBT/BBL' }], topEntities: ['Indian Oil', 'BPCL', 'HPCL', 'MRPL', 'NRL', 'CPCL', 'Reliance Jamnagar'], cbamOverlap: false, techOptions: ['Process integration', 'Waste heat recovery', 'Flare gas recovery', 'Green hydrogen'] },
  { name: 'Petrochemicals', code: 'PET', entities: 39, baselineEmissions_mt: 28, bauProjection2027_mt: 32.3, targetPostCCTS_mt: 30.8, avoidedEmissions_mt: 1.5, reduction_pct: 4.5, phaseNotification: 'Jan 2026', benchmarks: [{ type: 'Ethylene Cracker', intensity: 0.55, unit: 'tOE/t' }, { type: 'Polymer', intensity: 0.35, unit: 'tOE/t' }], topEntities: ['Reliance Industries', 'GAIL', 'IOCL Panipat', 'Haldia Petrochemicals', 'ONGC Petro'], cbamOverlap: false, techOptions: ['Electric cracking', 'Bio-feedstock', 'Catalyst optimization', 'Process electrification'] },
  { name: 'Textiles', code: 'TEX', entities: 90, baselineEmissions_mt: 15, bauProjection2027_mt: 17.2, targetPostCCTS_mt: 16.3, avoidedEmissions_mt: 0.9, reduction_pct: 5, phaseNotification: 'Jan 2026', benchmarks: [{ type: 'Spinning', intensity: 0.034, unit: 'tOE/t' }, { type: 'Composite Mill', intensity: 0.05, unit: 'tOE/t' }], topEntities: ['Arvind Limited', 'Raymond', 'Welspun', 'Vardhman', 'Trident Group'], cbamOverlap: false, techOptions: ['Solar thermal processing', 'Biomass boilers', 'Energy-efficient motors', 'Heat recovery from dyeing'] },
  { name: 'Fertiliser', code: 'FER', entities: 29, baselineEmissions_mt: 45, bauProjection2027_mt: 51.0, targetPostCCTS_mt: 48.5, avoidedEmissions_mt: 2.6, reduction_pct: 5, phaseNotification: 'Jan 2026', benchmarks: [{ type: 'Urea', intensity: 5.5, unit: 'Gcal/t urea' }, { type: 'DAP', intensity: 3.2, unit: 'Gcal/t' }], topEntities: ['IFFCO', 'NFL', 'RCF', 'Coromandel', 'Chambal Fertilisers', 'Zuari Agro'], cbamOverlap: true, techOptions: ['Green ammonia', 'Waste heat recovery', 'Neem-coated urea', 'Solar-powered operations'] },
];

const PRICING = {
  estimated_initial_price_inr: 800,
  estimated_initial_price_usd: 10,
  price_range_2026: { min: 600, max: 1200 },
  price_range_2030: { min: 1500, max: 4000 },
  market_size_2030_usd_bn: 10,
  cbam_offset: true,
  penalty_multiplier: 2,
  annual_eiva_reduction_rate: 0.0168,
};

const INTL_CARBON_PRICES = [
  { market: 'EU ETS', price_usd: 65, currency: 'EUR', year: 2025 },
  { market: 'UK ETS', price_usd: 48, currency: 'GBP', year: 2025 },
  { market: 'California CaT', price_usd: 38, currency: 'USD', year: 2025 },
  { market: 'Korea K-ETS', price_usd: 8, currency: 'KRW', year: 2025 },
  { market: 'China ETS', price_usd: 11, currency: 'CNY', year: 2025 },
  { market: 'India CCTS (est.)', price_usd: 10, currency: 'INR', year: 2026 },
];

const PAT_HISTORY = [
  { cycle: 'PAT I', period: 'FY12-15', entities: 478, targetSaving_mtoe: 6.69, achievedSaving_mtoe: 8.67, escerts: 12735, pct: 130 },
  { cycle: 'PAT II', period: 'FY16-19', entities: 621, targetSaving_mtoe: 8.87, achievedSaving_mtoe: 13.28, escerts: 24962, pct: 150 },
  { cycle: 'PAT III', period: 'FY17-20', entities: 116, targetSaving_mtoe: 1.06, achievedSaving_mtoe: 1.41, escerts: 2540, pct: 133 },
  { cycle: 'PAT IV', period: 'FY18-21', entities: 109, targetSaving_mtoe: 0.6986, achievedSaving_mtoe: 0.97, escerts: 1820, pct: 139 },
  { cycle: 'PAT V', period: 'FY19-22', entities: 110, targetSaving_mtoe: 0.7, achievedSaving_mtoe: 0.91, escerts: 1650, pct: 130 },
  { cycle: 'PAT VI', period: 'FY20-23', entities: 958, targetSaving_mtoe: 12.74, achievedSaving_mtoe: 14.1, escerts: 18500, pct: 111 },
  { cycle: 'PAT VII', period: 'FY22-25', entities: 1073, targetSaving_mtoe: 15.71, achievedSaving_mtoe: null, escerts: null, pct: null },
];

const COMPLIANCE_STEPS = [
  { step: 1, title: 'EIVA Allocation', desc: 'BEE allocates Emission Intensity Value Allowances based on sector benchmark and historical intensity', duration: 'Q1 of compliance year' },
  { step: 2, title: 'Baseline Monitoring', desc: 'Obligated entities monitor production, fuel consumption, and GHG emissions per ISO 14064', duration: 'Throughout compliance year' },
  { step: 3, title: 'Third-party Verification', desc: 'Accredited Carbon Verification Agencies (ACVAs) audit entity-level data per ISO 14065', duration: 'Q4 of compliance year' },
  { step: 4, title: 'Performance Assessment', desc: 'BEE assesses actual vs allocated EIVA; surplus or deficit determined', duration: 'Q1 of next year' },
  { step: 5, title: 'CCC Issuance', desc: 'Surplus entities receive Carbon Credit Certificates (CCCs) via GCI registry', duration: 'Q2 of next year' },
  { step: 6, title: 'CCC Trading', desc: 'CCCs traded on IEX, PXIL, or HPOWERT under CERC regulation', duration: 'Q2-Q4 of next year' },
  { step: 7, title: 'Surrender / Penalty', desc: 'Deficit entities surrender CCCs or pay 2x average market price penalty', duration: 'End of Q4' },
];

const JCM_AGREEMENTS = [
  { partner: 'Japan', status: 'Signed', date: 'Aug 2025', scope: 'RE, EE, waste management', itmo_eligible: true },
  { partner: 'Singapore', status: 'Under Negotiation', date: 'Expected 2026', scope: 'Carbon capture, green hydrogen', itmo_eligible: true },
  { partner: 'Sweden', status: 'Under Negotiation', date: 'Expected 2026', scope: 'Industrial decarbonization', itmo_eligible: true },
  { partner: 'South Korea', status: 'Under Negotiation', date: 'Expected 2027', scope: 'Steel, cement technology transfer', itmo_eligible: true },
  { partner: 'Germany', status: 'MOU Signed', date: 'Jan 2026', scope: 'Green hydrogen corridors', itmo_eligible: false },
  { partner: 'UAE', status: 'MOU Signed', date: 'Nov 2025', scope: 'Solar, green ammonia', itmo_eligible: false },
];

/* ── derived data ── */
const TOTAL_ENTITIES = SECTORS.reduce((s, sec) => s + sec.entities, 0);
const TOTAL_BASELINE_MT = SECTORS.reduce((s, sec) => s + sec.baselineEmissions_mt, 0);
const TOTAL_AVOIDED_MT = SECTORS.reduce((s, sec) => s + sec.avoidedEmissions_mt, 0);
const CBAM_SECTORS = SECTORS.filter(s => s.cbamOverlap);
const NATIONAL_EMISSIONS_MT = INDIA_PROFILE.total_ghg_mt || 4262;
const COVERAGE_PCT = pct(TOTAL_BASELINE_MT, NATIONAL_EMISSIONS_MT);

/* generate company-level entities from NIFTY_50 */
const INDUSTRIAL_COMPANIES = NIFTY_50.filter(c => {
  const s = (c.sector || '').toLowerCase();
  return s.includes('metal') || s.includes('steel') || s.includes('cement') || s.includes('oil') || s.includes('energy') || s.includes('chemical') || s.includes('material') || s.includes('power') || s.includes('mining') || s.includes('alumin');
});

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER: CSV export
   ═══════════════════════════════════════════════════════════════════════════ */
function exportCSV(data, fn) {
  if (!data.length) return;
  const h = Object.keys(data[0]);
  const csv = [h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const b = new Blob([csv], { type: 'text/csv' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = fn; a.click();
  URL.revokeObjectURL(u);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function IndiaCctsPage() {
  /* ── all hooks at top ── */
  const [tab, setTab] = useState(0);
  const [selSector, setSelSector] = useState(SECTORS[0].code);
  const [methFilter, setMethFilter] = useState('All');
  const [toolSearch, setToolSearch] = useState('');
  const [cccPrice, setCccPrice] = useState(PRICING.estimated_initial_price_inr);
  const [selCompany, setSelCompany] = useState(INDUSTRIAL_COMPANIES[0]?.name || '');
  const [euCbamPrice, setEuCbamPrice] = useState(65);
  const [indiaCccPriceCbam, setIndiaCccPriceCbam] = useState(10);
  const [readinessSector, setReadinessSector] = useState(SECTORS[0].code);
  const [penaltyEmissions, setPenaltyEmissions] = useState(50000);
  const [techInvestment, setTechInvestment] = useState(500);
  const [projectionYears, setProjectionYears] = useState(10);
  // Calculator & Assurance tab state
  const [calcMethodology, setCalcMethodology] = useState('BM-EN01.001');
  const [calcInputs, setCalcInputs] = useState({});
  const [calcResult, setCalcResult] = useState(null);
  const [calcValidation, setCalcValidation] = useState(null);
  const [assuranceReport, setAssuranceReport] = useState(null);

  /* ── sector lookup ── */
  const selectedSector = useMemo(() => SECTORS.find(s => s.code === selSector) || SECTORS[0], [selSector]);
  const readinessSectorData = useMemo(() => SECTORS.find(s => s.code === readinessSector) || SECTORS[0], [readinessSector]);

  /* ── filtered methodologies ── */
  const filteredMethods = useMemo(() => {
    if (methFilter === 'All') return METHODOLOGIES;
    return METHODOLOGIES.filter(m => m.sector === methFilter || m.category === methFilter);
  }, [methFilter]);

  /* ── filtered tools ── */
  const filteredTools = useMemo(() => {
    if (!toolSearch) return TOOLS;
    const q = toolSearch.toLowerCase();
    return TOOLS.filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [toolSearch]);

  /* ── price trajectory ── */
  const priceTrajectory = useMemo(() => {
    const pts = [];
    for (let y = 2026; y <= 2035; y++) {
      const t = y - 2026;
      const base = PRICING.estimated_initial_price_inr;
      const growth = 1 + 0.15 * t + 0.02 * t * t;
      const low = Math.round(base * growth * 0.7);
      const mid = Math.round(base * growth);
      const high = Math.round(base * growth * 1.4);
      pts.push({ year: y, low, mid, high, usd_mid: Math.round(mid / FX) });
    }
    return pts;
  }, []);

  /* ── revenue by sector at selected price ── */
  const sectorRevenue = useMemo(() => {
    return SECTORS.map(sec => {
      const surplus_mt = sec.avoidedEmissions_mt;
      const revInr = surplus_mt * 1e6 * cccPrice;
      return { name: sec.name, code: sec.code, surplusMt: surplus_mt, revenueCr: +(revInr / 1e7).toFixed(0), revenueUsd: +(revInr / FX).toFixed(0) };
    });
  }, [cccPrice]);

  /* ── company financial impact ── */
  const companyImpact = useMemo(() => {
    const comp = INDUSTRIAL_COMPANIES.find(c => c.name === selCompany) || INDUSTRIAL_COMPANIES[0];
    if (!comp) return null;
    const scope1 = comp.scope1_tco2e || 0;
    const scope2 = comp.scope2_tco2e || 0;
    const totalEmissions = scope1 + scope2;
    const complianceCostInr = totalEmissions * cccPrice;
    const revCr = comp.revenue_inr_cr || 1;
    const marginImpact = pct(complianceCostInr / 1e7, revCr);
    const techReductionPct = Math.min(0.4, techInvestment * 0.0004);
    const reducedEmissions = Math.round(totalEmissions * (1 - techReductionPct));
    const surplusCCC = Math.max(0, Math.round(totalEmissions * 0.85 - reducedEmissions));
    const surplusRevenue = surplusCCC * cccPrice;
    const penaltyCost = totalEmissions * cccPrice * 2;
    const npvInvestment = techInvestment * 1e7;
    const npvSavings = surplusRevenue * ((1 - Math.pow(1.1, -projectionYears)) / 0.1);
    return {
      name: comp.name, ticker: comp.ticker, sector: comp.sector,
      scope1, scope2, totalEmissions, complianceCostInr, complianceCostCr: +(complianceCostInr / 1e7).toFixed(1),
      revCr, marginImpact, techReductionPct: +(techReductionPct * 100).toFixed(1),
      reducedEmissions, surplusCCC, surplusRevenue: +(surplusRevenue / 1e7).toFixed(1),
      penaltyCost: +(penaltyCost / 1e7).toFixed(1), npvInvestment: +(npvInvestment / 1e7).toFixed(1),
      npvSavings: +(npvSavings / 1e7).toFixed(1), npvNet: +((npvSavings - npvInvestment) / 1e7).toFixed(1),
    };
  }, [selCompany, cccPrice, techInvestment, projectionYears]);

  /* ── CBAM offset calculation ── */
  const cbamCalc = useMemo(() => {
    const cbamItems = (INDIA_CBAM_EXPOSURE.byCommodity || []).filter(c => c.emissions_tco2 > 0);
    return cbamItems.map(item => {
      const cbamLiability = item.emissions_tco2 * euCbamPrice;
      const domesticPayment = item.emissions_tco2 * indiaCccPriceCbam;
      const netCbamCost = Math.max(0, cbamLiability - domesticPayment);
      const savings = cbamLiability - netCbamCost;
      return { ...item, cbamLiability, domesticPayment, netCbamCost, savings, savingsPct: pct(savings, cbamLiability) };
    });
  }, [euCbamPrice, indiaCccPriceCbam]);

  /* ── readiness radar data ── */
  const readinessRadar = useMemo(() => {
    const sec = readinessSectorData;
    const si = SECTORS.indexOf(sec);
    const seed = si * 71 + 13;
    return [
      { dim: 'MRV Capability', score: Math.round(35 + sr(seed) * 50) },
      { dim: 'Data Infrastructure', score: Math.round(25 + sr(seed + 1) * 55) },
      { dim: 'ACVA Engagement', score: Math.round(20 + sr(seed + 2) * 60) },
      { dim: 'Trading Setup', score: Math.round(15 + sr(seed + 3) * 45) },
      { dim: 'Internal Carbon Price', score: Math.round(10 + sr(seed + 4) * 50) },
      { dim: 'Board Governance', score: Math.round(30 + sr(seed + 5) * 55) },
    ];
  }, [readinessSectorData]);

  /* ── offset projects sample ── */
  const offsetProjects = useMemo(() => {
    return METHODOLOGIES.map((m, mi) => {
      const seed = mi * 47 + 31;
      const capacity = m.sector === 'Forestry' ? Math.round(500 + sr(seed) * 4500) : Math.round(5000 + sr(seed) * 50000);
      const annualCredits = m.sector === 'Forestry' ? Math.round(capacity * (3 + sr(seed + 1) * 7)) : Math.round(capacity * (0.5 + sr(seed + 1) * 2));
      return {
        methodology: m.code, title: m.title, sector: m.sector,
        sampleProject: m.sector === 'Energy' ? `${Math.round(10 + sr(seed + 2) * 90)} MW Solar PV` : m.sector === 'Waste' ? 'Municipal Landfill Gas Recovery' : m.sector === 'Agriculture' ? 'Paddy Straw Biogas Cluster' : m.sector === 'Forestry' ? `${Math.round(200 + sr(seed + 2) * 1800)} ha Restoration` : 'Industrial Process Optimization',
        capacity, unit: m.sector === 'Forestry' ? 'hectares' : 'tCO2e/yr capacity',
        annualCredits, creditingPeriod: m.crediting_period_yrs,
        totalCredits: annualCredits * m.crediting_period_yrs,
        registrationStatus: ['Registered', 'Under Validation', 'Concept Note'][Math.floor(sr(seed + 3) * 3)],
      };
    });
  }, []);

  /* ── methodology radar comparison ── */
  const methRadarData = useCallback((m) => {
    const si = METHODOLOGIES.indexOf(m);
    const seed = si * 59 + 23;
    return [
      { dim: 'Scope', val: Math.round(40 + sr(seed) * 50) },
      { dim: 'Complexity', val: Math.round(30 + sr(seed + 1) * 60) },
      { dim: 'MRV Burden', val: Math.round(20 + sr(seed + 2) * 70) },
      { dim: 'Credit Potential', val: Math.round(35 + sr(seed + 3) * 55) },
      { dim: 'Additionality Rigor', val: Math.round(50 + sr(seed + 4) * 45) },
    ];
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER HELPERS
     ═══════════════════════════════════════════════════════════════════════════ */
  const KPI = ({ label, value, unit: u, color }) => (
    <div style={kpiS}>
      <div style={kpiLabel}>{label}</div>
      <div style={{ ...kpiVal, color: color || T.navy }}>{value}</div>
      {u && <div style={kpiUnit}>{u}</div>}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 0 — CCTS Overview
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderOverview = () => {
    const sectorPie = SECTORS.map(s => ({ name: s.name, value: s.entities }));
    const emissionsBar = SECTORS.map(s => ({ name: s.name.length > 12 ? s.name.slice(0, 12) + '..' : s.name, baseline: s.baselineEmissions_mt, avoided: s.avoidedEmissions_mt, bau: (s.bauProjection2027_mt || 0) }));
    return (
      <div>
        <div style={gridRow(4)}>
          <KPI label="Total Entities" value={TOTAL_ENTITIES.toLocaleString()} unit="obligated under CCTS" />
          <KPI label="Covered Sectors" value="9" unit="Phase 1 + Phase 2" />
          <KPI label="Emissions Covered" value={`${TOTAL_BASELINE_MT.toFixed(0)} Mt`} unit={`${COVERAGE_PCT}% of national GHG`} />
          <KPI label="National GHG" value={`${NATIONAL_EMISSIONS_MT.toFixed(0)} Mt`} unit="CO2e (OWID 2023)" />
        </div>
        <div style={gridRow(4)}>
          <KPI label="Est. CCC Price" value={`INR ${PRICING.estimated_initial_price_inr}`} unit={`~$${PRICING.estimated_initial_price_usd}/tCO2e`} color={T.gold} />
          <KPI label="Market Size 2030" value={`$${PRICING.market_size_2030_usd_bn}B`} unit="estimated carbon market" color={T.indigo} />
          <KPI label="Penalty Multiplier" value={`${PRICING.penalty_multiplier}x`} unit="avg CCC market price" color={T.red} />
          <KPI label="Annual EIVA Reduction" value={`${(PRICING.annual_eiva_reduction_rate * 100).toFixed(2)}%`} unit="per year across sectors" color={T.green} />
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Entity Distribution by Sector</div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sectorPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: T.sub }}>
                  {sectorPie.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Emissions Coverage by Sector (Mt CO2e)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emissionsBar} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="baseline" name="Baseline (Mt)" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar dataKey="avoided" name="Avoided (Mt)" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector reduction targets scatter */}
        <div style={cardS}>
          <div style={secTitle}>Sector Reduction Target vs Entity Count</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="entities" name="Entities" tick={{ fontSize: 10 }} label={{ value: 'Entities', position: 'insideBottom', offset: -2, style: { fontSize: 10 } }} />
              <YAxis type="number" dataKey="reduction" name="Reduction %" tick={{ fontSize: 10 }} label={{ value: '% Reduction', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Sectors" data={SECTORS.map(s => ({ entities: s.entities, reduction: s.reduction_pct, name: s.name, emissions: s.baselineEmissions_mt }))} fill={T.indigo}>
                {SECTORS.map((s, i) => <Cell key={i} fill={s.cbamOverlap ? T.red : CC[i % CC.length]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Red dots indicate CBAM-overlapping sectors</div>
        </div>

        {/* Timeline milestones */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>CCTS Implementation Timeline</div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {[
              { date: 'Jun 2023', event: 'Energy Conservation Amendment Act gazette notification', status: 'Done' },
              { date: 'Oct 2025', event: 'Phase 1 sector notifications (5 sectors)', status: 'Done' },
              { date: 'Jan 2026', event: 'Phase 2 sector notifications (4 sectors)', status: 'Done' },
              { date: 'Mar 2026', event: 'BEE CCTS portal launch', status: 'Done' },
              { date: 'FY 2025-26', event: 'Phase 1 baseline year', status: 'Active' },
              { date: 'Oct 2026', event: 'CCC trading expected to commence', status: 'Planned' },
              { date: 'FY 2026-27', event: 'Phase 2 compliance cycle begins', status: 'Planned' },
              { date: '2030', event: 'Target: $10B carbon market + NDC achievement', status: 'Target' },
            ].map((m, i) => (
              <div key={i} style={{ minWidth: 140, padding: '10px 12px', borderRight: i < 7 ? `2px solid ${T.gold}` : 'none', background: m.status === 'Done' ? '#f0fdf4' : m.status === 'Active' ? '#fffbeb' : T.card }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: m.status === 'Done' ? T.green : m.status === 'Active' ? T.gold : T.navy }}>{m.date}</div>
                <div style={{ fontSize: 11, color: T.text, marginTop: 4, lineHeight: 1.3 }}>{m.event}</div>
                <span style={badgeS(m.status === 'Done' ? '#d1fae5' : m.status === 'Active' ? '#fef3c7' : '#e0e7ff', m.status === 'Done' ? T.green : m.status === 'Active' ? T.amber : T.indigo)}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Legal & Regulatory Framework</div>
          <table style={tblS}>
            <tbody>
              {[
                ['Legal Basis', COMPLIANCE.legalBasis],
                ['Gazette Notification', COMPLIANCE.gazetteNotification],
                ['Administrator', COMPLIANCE.administrator],
                ['Registry Operator', COMPLIANCE.registry],
                ['Trading Regulator', COMPLIANCE.tradingRegulator],
                ['Exchanges', COMPLIANCE.exchanges.join(', ')],
                ['MRV Standard', COMPLIANCE.mrvStandard],
                ['Penalty', COMPLIANCE.penalty],
                ['Baseline Year', COMPLIANCE.baselineYear],
                ['Portal Launch', COMPLIANCE.portalLaunch],
                ['Trading Expected', COMPLIANCE.tradingExpected],
              ].map(([k, v], i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, width: 220, color: T.navy }}>{k}</td>
                  <td style={tdS}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 1 — Compliance Framework
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderComplianceFramework = () => {
    const penaltyCost = penaltyEmissions * cccPrice * PRICING.penalty_multiplier;
    return (
      <div>
        <div style={cardS}>
          <div style={secTitle}>Institutional Architecture</div>
          <table style={tblS}>
            <thead><tr>{['Body', 'Full Name', 'Role', 'Chair'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {INSTITUTIONS.map((inst, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.indigo }}>{inst.body}</td>
                  <td style={tdS}>{inst.fullName}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{inst.role}</td>
                  <td style={{ ...tdS, fontSize: 11, color: T.sub }}>{inst.chair}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Compliance Cycle Timeline</div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 10 }}>
            {COMPLIANCE_STEPS.map((step, i) => (
              <div key={i} style={{ minWidth: 160, padding: '12px 14px', borderRight: i < COMPLIANCE_STEPS.length - 1 ? `2px solid ${T.gold}` : 'none', background: i % 2 === 0 ? '#f8f7f2' : T.card }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.gold, marginBottom: 4 }}>{step.step}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.4 }}>{step.desc}</div>
                <div style={{ fontSize: 10, color: T.amber, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{step.duration}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={gridRow(2)}>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Compliance Cycles</div>
            <table style={tblS}>
              <thead><tr>{['Year', 'Phase', 'Status', 'Sectors'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {COMPLIANCE.complianceCycles.map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700 }}>{c.year}</td>
                    <td style={tdS}>{c.phase}</td>
                    <td style={tdS}><span style={badgeS(c.status === 'Active' ? '#d1fae5' : '#fef3c7', c.status === 'Active' ? T.green : T.amber)}>{c.status}</span></td>
                    <td style={tdS}>{c.sectors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Penalty Calculator</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>Estimate non-compliance cost for a deficit entity</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: T.sub }}>Emission Deficit (tCO2e)</label>
                <input type="number" value={penaltyEmissions} onChange={e => setPenaltyEmissions(+e.target.value || 0)} style={{ ...selectS, display: 'block', marginTop: 4, width: 140 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.sub }}>CCC Price (INR/tCO2e)</label>
                <input type="number" value={cccPrice} onChange={e => setCccPrice(+e.target.value || 0)} style={{ ...selectS, display: 'block', marginTop: 4, width: 140 }} />
              </div>
            </div>
            <div style={{ background: '#fef2f2', border: `1px solid #fecaca`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.sub }}>Penalty = Deficit x Avg CCC Price x 2</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.red, marginTop: 6 }}>INR {(penaltyCost / 1e7).toFixed(2)} Cr</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>(${(penaltyCost / FX).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} USD)</div>
            </div>
          </div>
        </div>

        {/* Institutional architecture diagram */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Governance Hierarchy Flow</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[
              { body: 'NSCICM', role: 'Apex Policy Direction', bg: '#1e293b', color: '#fff' },
              { body: 'MoP + MoEFCC', role: 'Notification & NDC Alignment', bg: T.navy, color: '#fff' },
              { body: 'BEE (Administrator)', role: 'EIVA Allocation, MRV, Penalty', bg: T.indigo, color: '#fff' },
              { body: 'CERC + GCI + CPCB', role: 'Trading Regulation, Registry, Emission Validation', bg: T.gold, color: '#fff' },
              { body: '740 Obligated Entities', role: 'Compliance, Monitoring, Reporting', bg: '#f1f5f9', color: T.navy },
              { body: 'ACVAs (Accredited Verifiers)', role: 'Third-party Verification (ISO 14065)', bg: '#f0fdf4', color: T.green },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ padding: '10px 24px', background: item.bg, color: item.color, borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center', minWidth: 300 }}>
                  <div>{item.body}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>{item.role}</div>
                </div>
                {i < 5 && <div style={{ width: 2, height: 16, background: T.gold }} />}
              </div>
            ))}
          </div>
        </div>

        {/* EIVA allocation methodology */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>EIVA Allocation Methodology</div>
          <table style={tblS}>
            <thead><tr>{['Parameter', 'Description', 'Formula'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Sector Benchmark', 'BEE-determined emission intensity benchmark per unit of production', 'tCO2e per unit output'],
                ['Production Volume', 'Actual output in compliance year', 'tonnes, MWh, or sector-specific unit'],
                ['EIVA Allocation', 'Benchmark x Production Volume x Annual Reduction Factor', 'EIVA = B x P x (1 - r)^t'],
                ['Annual Reduction Rate', 'Tightening factor applied each year', `r = ${(PRICING.annual_eiva_reduction_rate * 100).toFixed(2)}% avg`],
                ['Surplus / Deficit', 'Actual emissions vs allocated EIVA', 'Surplus = EIVA - Actual (if positive)'],
                ['CCC Issuance', '1 CCC = 1 tCO2e surplus', 'CCCs = Max(0, EIVA - Actual)'],
                ['Deficit Penalty', '2x average CCC market price per tCO2e deficit', 'Penalty = 2 x P_avg x Deficit'],
              ].map(([param, desc, formula], i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{param}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{desc}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.indigo }}>{formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>MRV Requirements</div>
          <table style={tblS}>
            <thead><tr>{['Requirement', 'Standard', 'Applicability', 'Frequency'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Entity-level GHG Reporting', 'ISO 14064-1', 'All 740 obligated entities', 'Annual'],
                ['Third-party Verification', 'ISO 14065 + ISO 14066', 'Mandatory for CCC issuance', 'Annual'],
                ['Offset Project Validation', 'ISO 14064-2', 'Offset project developers', 'At registration + periodic'],
                ['Registry Reconciliation', 'GCI Registry Protocol', 'All CCC holders', 'Continuous'],
                ['Sector Benchmark Review', 'BEE Technical Guidelines', 'BEE + sector associations', 'Every 3 years'],
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r[0]}</td>
                  <td style={{ ...tdS, color: T.indigo, fontFamily: "'JetBrains Mono', monospace" }}>{r[1]}</td>
                  <td style={tdS}>{r[2]}</td>
                  <td style={tdS}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 2 — Sector Deep-Dive
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderSectorDeepDive = () => {
    const sec = selectedSector;
    const emChart = [
      { label: 'Baseline', value: sec.baselineEmissions_mt, fill: T.navy },
      { label: 'BAU 2027', value: sec.bauProjection2027_mt || 0, fill: T.amber },
      { label: 'CCTS Target', value: sec.targetPostCCTS_mt || 0, fill: T.green },
    ];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginRight: 8 }}>Select Sector:</label>
          <select value={selSector} onChange={e => setSelSector(e.target.value)} style={selectS}>
            {SECTORS.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
          </select>
        </div>

        <div style={gridRow(4)}>
          <KPI label="Entities" value={sec.entities} unit={`Sector: ${sec.code}`} />
          <KPI label="Baseline Emissions" value={`${sec.baselineEmissions_mt} Mt`} unit="CO2e" />
          <KPI label="Reduction Target" value={`${sec.reduction_pct}%`} unit="intensity reduction" color={T.green} />
          <KPI label="Avoided Emissions" value={`${sec.avoidedEmissions_mt} Mt`} unit="CO2e/year" color={T.green} />
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Emissions Trajectory</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={emChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Bar dataKey="value" name="Mt CO2e" radius={[4, 4, 0, 0]}>
                  {emChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Sector Benchmarks</div>
            <table style={tblS}>
              <thead><tr>{['Sub-Category', 'Intensity', 'Unit'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {(sec.benchmarks || []).map((b, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{b.type}</td>
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", color: T.indigo }}>{b.intensity}</td>
                    <td style={{ ...tdS, color: T.sub }}>{b.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Top Obligated Entities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(sec.topEntities || []).map((e, i) => (
                <span key={i} style={badgeS('#eef2ff', T.indigo)}>{e}</span>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 11, color: T.sub }}>Phase notification: </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{sec.phaseNotification}</span>
              <span style={{ marginLeft: 16, fontSize: 11, color: T.sub }}>CBAM Overlap: </span>
              <span style={badgeS(sec.cbamOverlap ? '#fef2f2' : '#d1fae5', sec.cbamOverlap ? T.red : T.green)}>
                {sec.cbamOverlap ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Transition Technology Options</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 2, color: T.text }}>
              {(sec.techOptions || []).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>

        {/* All sectors comparison table */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>All Sectors Comparison</div>
          <table style={tblS}>
            <thead><tr>{['Sector', 'Code', 'Entities', 'Baseline (Mt)', 'BAU 2027 (Mt)', 'Target (Mt)', 'Avoided (Mt)', 'Reduction %', 'CBAM', 'Phase'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {SECTORS.map((s, i) => (
                <tr key={i} style={{ background: s.code === selSector ? '#eef2ff' : (i % 2 === 0 ? T.card : '#f8f7f2') }}>
                  <td style={{ ...tdS, fontWeight: 700, color: s.code === selSector ? T.indigo : T.navy }}>{s.name}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{s.code}</td>
                  <td style={{ ...tdS, textAlign: 'right' }}>{s.entities}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{s.baselineEmissions_mt}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{(s.bauProjection2027_mt || 0).toFixed(1)}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{(s.targetPostCCTS_mt || 0).toFixed(1)}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: T.green }}>{s.avoidedEmissions_mt}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: T.green }}>{s.reduction_pct}%</td>
                  <td style={{ ...tdS, textAlign: 'center' }}><span style={badgeS(s.cbamOverlap ? '#fef2f2' : '#f0fdf4', s.cbamOverlap ? T.red : T.green)}>{s.cbamOverlap ? 'Yes' : 'No'}</span></td>
                  <td style={{ ...tdS, fontSize: 11 }}>{s.phaseNotification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reduction % comparison bar chart */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Emission Reduction Targets by Sector (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SECTORS.map(s => ({ name: s.name.length > 12 ? s.name.slice(0, 12) + '..' : s.name, reduction: s.reduction_pct, entities: s.entities }))} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} label={{ value: '% Reduction', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <Bar dataKey="reduction" name="Reduction Target %" fill={T.green} radius={[4, 4, 0, 0]}>
                {SECTORS.map((s, i) => <Cell key={i} fill={s.cbamOverlap ? T.red : T.green} />)}
              </Bar>
              <ReferenceLine y={PRICING.annual_eiva_reduction_rate * 100} stroke={T.gold} strokeDasharray="5 5" label={{ value: `Avg ${(PRICING.annual_eiva_reduction_rate * 100).toFixed(2)}%`, fill: T.gold, fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Baseline vs BAU vs Target scatter */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Emissions Trajectory: Baseline vs BAU vs CCTS Target (All Sectors)</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={SECTORS.map(s => ({ name: s.name.length > 10 ? s.name.slice(0, 10) + '..' : s.name, baseline: s.baselineEmissions_mt, bau: s.bauProjection2027_mt || 0, target: s.targetPostCCTS_mt || 0 }))} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="baseline" name="Baseline" fill={T.navy} opacity={0.6} />
              <Bar dataKey="bau" name="BAU 2027" fill={T.amber} opacity={0.6} />
              <Bar dataKey="target" name="CCTS Target" fill={T.green} opacity={0.8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 3 — Approved Methodologies
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderMethodologies = () => {
    const methSectors = ['All', ...new Set(METHODOLOGIES.map(m => m.sector))];
    const selMethForRadar = filteredMethods[0];
    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>Filter:</label>
          {methSectors.map(s => (
            <button key={s} onClick={() => setMethFilter(s)} style={{ ...tabBtn(methFilter === s), padding: '6px 12px', borderBottom: methFilter === s ? `2px solid ${T.gold}` : '2px solid transparent' }}>{s}</button>
          ))}
        </div>

        <div style={gridRow(4)}>
          <KPI label="Total Methodologies" value={METHODOLOGIES.length} unit="BEE approved" />
          <KPI label="Energy Sector" value={METHODOLOGIES.filter(m => m.sector === 'Energy').length} unit="methodologies" />
          <KPI label="Forestry" value={METHODOLOGIES.filter(m => m.sector === 'Forestry').length} unit="30-year crediting" color={T.green} />
          <KPI label="Showing" value={filteredMethods.length} unit={`of ${METHODOLOGIES.length}`} />
        </div>

        {filteredMethods.map((m, mi) => (
          <div key={mi} style={{ ...cardS, marginBottom: 12, borderLeft: `4px solid ${CC[mi % CC.length]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: T.indigo }}>{m.code}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginTop: 4 }}>{m.title}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={badgeS(m.renewable ? '#d1fae5' : '#eef2ff', m.renewable ? T.green : T.indigo)}>{m.category}</span>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{m.crediting_period_yrs} yr crediting</div>
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>Applicability</div>
                <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{m.applicability}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>Baseline Approach</div>
                <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{m.baseline}</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: T.sub }}>Required Tools: {(TOOL_METH_MAP[m.code] || []).join(', ')}</div>
          </div>
        ))}

        {selMethForRadar && (
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Methodology Comparison Radar: {selMethForRadar.code}</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={methRadarData(selMethForRadar)}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name={selMethForRadar.code} dataKey="val" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                <Tooltip {...tip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={gridRow(2)}>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Crediting Period Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={METHODOLOGIES.map(m => ({ code: m.code, years: m.crediting_period_yrs, sector: m.sector }))} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="code" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Years', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Bar dataKey="years" name="Crediting Period (yrs)" radius={[4, 4, 0, 0]}>
                  {METHODOLOGIES.map((m, i) => <Cell key={i} fill={m.renewable ? T.green : m.sector === 'Forestry' ? '#065f46' : T.navy} />)}
                </Bar>
                <ReferenceLine y={10} stroke={T.gold} strokeDasharray="5 5" label={{ value: 'Standard (10yr)', fill: T.gold, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Methodology by Sector Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={[...new Set(METHODOLOGIES.map(m => m.sector))].map(s => ({ name: s, value: METHODOLOGIES.filter(m => m.sector === s).length }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {[...new Set(METHODOLOGIES.map(m => m.sector))].map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Methodology Applicability Matrix by CCTS Sector</div>
          <table style={tblS}>
            <thead>
              <tr>
                <th style={thS}>Methodology</th>
                {SECTORS.map(s => <th key={s.code} style={{ ...thS, fontSize: 9, textAlign: 'center' }}>{s.code}</th>)}
              </tr>
            </thead>
            <tbody>
              {METHODOLOGIES.map((m, mi) => (
                <tr key={mi}>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600 }}>{m.code}</td>
                  {SECTORS.map(s => {
                    const applicable = (m.sector === 'Energy' && ['ISP','CEM','ALU','CHL','PAP','REF','PET','TEX','FER'].includes(s.code)) ||
                      (m.sector === 'Industry' && ['ISP','CEM','ALU','CHL','REF','PET'].includes(s.code)) ||
                      (m.sector === 'Waste' && ['CEM','PAP','TEX'].includes(s.code)) ||
                      (m.sector === 'Agriculture' && s.code === 'FER') ||
                      (m.sector === 'Forestry');
                    return <td key={s.code} style={{ ...tdS, textAlign: 'center', background: applicable ? '#d1fae5' : T.card, fontSize: 11 }}>{applicable ? '\u2713' : ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 4 — Approved Tools
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderTools = () => {
    const categories = [...new Set(TOOLS.map(t => t.category))];
    const generalTools = filteredTools.filter(t => !t.code.includes('AR'));
    const forestryTools = filteredTools.filter(t => t.code.includes('AR'));
    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input value={toolSearch} onChange={e => setToolSearch(e.target.value)} placeholder="Search tools by code, name, or category..." style={{ ...selectS, width: 400 }} />
          <span style={{ fontSize: 11, color: T.sub }}>{filteredTools.length} of {TOOLS.length} tools</span>
        </div>

        <div style={gridRow(3)}>
          <KPI label="General Tools" value={13} unit="cross-sector" />
          <KPI label="Forestry Tools" value={5} unit="carbon stock estimation" />
          <KPI label="Tool Categories" value={categories.length} unit="distinct categories" />
        </div>

        <div style={cardS}>
          <div style={secTitle}>General Tools (13)</div>
          <table style={tblS}>
            <thead><tr>{['Code', 'Title', 'Category', 'Scope'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {generalTools.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.card : '#f8f7f2' }}>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.indigo, fontSize: 11 }}>{t.code}</td>
                  <td style={tdS}>{t.title}</td>
                  <td style={tdS}><span style={badgeS('#eef2ff', T.indigo)}>{t.category}</span></td>
                  <td style={{ ...tdS, color: T.sub, fontSize: 11 }}>{t.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Forestry-Specific Tools (5)</div>
          <table style={tblS}>
            <thead><tr>{['Code', 'Title', 'Category', 'Scope'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {forestryTools.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.card : '#f8f7f2' }}>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.green, fontSize: 11 }}>{t.code}</td>
                  <td style={tdS}>{t.title}</td>
                  <td style={tdS}><span style={badgeS('#d1fae5', T.green)}>{t.category}</span></td>
                  <td style={{ ...tdS, color: T.sub, fontSize: 11 }}>{t.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Tool-Methodology Dependency Matrix</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tblS}>
              <thead>
                <tr>
                  <th style={thS}>Methodology</th>
                  {TOOLS.slice(0, 12).map(t => <th key={t.code} style={{ ...thS, fontSize: 9, writingMode: 'vertical-rl', textOrientation: 'mixed', height: 100, padding: 4 }}>{t.code}</th>)}
                </tr>
              </thead>
              <tbody>
                {METHODOLOGIES.map((m, mi) => (
                  <tr key={mi}>
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{m.code}</td>
                    {TOOLS.slice(0, 12).map(t => {
                      const required = (TOOL_METH_MAP[m.code] || []).includes(t.code);
                      return <td key={t.code} style={{ ...tdS, textAlign: 'center', background: required ? '#d1fae5' : T.card }}>{required ? '\u2713' : ''}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 5 — Carbon Pricing & Market
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderPricing = () => {
    return (
      <div>
        <div style={{ ...cardS, marginBottom: 16 }}>
          <div style={secTitle}>CCC Price Slider</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input type="range" min={500} max={5000} step={50} value={cccPrice} onChange={e => setCccPrice(+e.target.value)} style={sliderS} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, color: T.gold }}>INR {cccPrice.toLocaleString()}/tCO2e</span>
            <span style={{ fontSize: 12, color: T.sub }}>(${(cccPrice / FX).toFixed(1)} USD)</span>
          </div>
        </div>

        <div style={gridRow(3)}>
          <KPI label="Selected Price" value={`INR ${cccPrice}`} unit="per tCO2e" color={T.gold} />
          <KPI label="Total Market Revenue" value={`INR ${(TOTAL_AVOIDED_MT * 1e6 * cccPrice / 1e9).toFixed(1)}B`} unit={`at ${TOTAL_AVOIDED_MT.toFixed(1)} Mt avoided`} />
          <KPI label="2030 Projection" value={`INR ${PRICING.price_range_2030.min}-${PRICING.price_range_2030.max}`} unit="per tCO2e range" />
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Revenue by Sector at Selected Price</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sectorRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'INR Cr', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Bar dataKey="revenueCr" name="Revenue (INR Cr)" fill={T.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>CCC Price Trajectory 2026-2035</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={priceTrajectory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'INR/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="high" name="High" stroke={T.red} fill={T.red} fillOpacity={0.1} />
                <Area type="monotone" dataKey="mid" name="Mid" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
                <Area type="monotone" dataKey="low" name="Low" stroke={T.green} fill={T.green} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>International Carbon Price Comparison (USD/tCO2e)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={INTL_CARBON_PRICES} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: 'USD/tCO2e', position: 'insideBottom', offset: -2, style: { fontSize: 10 } }} />
                <YAxis type="category" dataKey="market" tick={{ fontSize: 11 }} width={100} />
                <Tooltip {...tip} />
                <Bar dataKey="price_usd" name="Price (USD)" radius={[0, 4, 4, 0]}>
                  {INTL_CARBON_PRICES.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Exchange Overview</div>
            <table style={tblS}>
              <thead><tr>{['Exchange', 'Status', 'Type'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {COMPLIANCE.exchanges.map((ex, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{ex}</td>
                    <td style={tdS}><span style={badgeS('#fef3c7', T.amber)}>Awaiting CERC Rules</span></td>
                    <td style={{ ...tdS, color: T.sub }}>Power Exchange</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: `1px solid #bae6fd` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>Market Size Projection</div>
              <div style={{ fontSize: 11, color: T.text, marginTop: 4 }}>India carbon market projected at <strong>${PRICING.market_size_2030_usd_bn}B</strong> by 2030, making it one of the largest compliance carbon markets globally.</div>
            </div>
          </div>
        </div>

        {/* Demand-supply balance */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Projected CCC Demand-Supply Balance (2026-2035)</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={Array.from({ length: 10 }, (_, t) => {
              const yr = 2026 + t;
              const baseSupply = TOTAL_AVOIDED_MT * (1 + t * 0.05);
              const demand = TOTAL_BASELINE_MT * PRICING.annual_eiva_reduction_rate * (1 + t * 0.08);
              const offsetSupply = METHODOLOGIES.length * (2000 + t * 500) / 1e6;
              return { year: yr, demand: +demand.toFixed(1), compliance_supply: +baseSupply.toFixed(1), offset_supply: +offsetSupply.toFixed(2), balance: +(baseSupply + offsetSupply - demand).toFixed(1) };
            })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="demand" name="CCC Demand" fill={T.red} opacity={0.6} />
              <Bar dataKey="compliance_supply" name="Compliance Supply" fill={T.green} opacity={0.6} />
              <Bar dataKey="offset_supply" name="Offset Supply" fill={T.gold} opacity={0.6} />
              <Line type="monotone" dataKey="balance" name="Net Balance" stroke={T.navy} strokeWidth={2} dot />
              <ReferenceLine y={0} stroke={T.red} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Price driver analysis */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>CCC Price Driver Analysis</div>
          <table style={tblS}>
            <thead><tr>{['Factor', 'Direction', 'Magnitude', 'Expected Timeline'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['EIVA tightening rate increase', 'Upward', 'High', '2028+ as targets ratchet'],
                ['Additional sector inclusion', 'Upward', 'Medium', 'Phase 3 (2029+): transport, buildings'],
                ['Technology cost reduction', 'Downward', 'Medium', 'Gradual; solar/wind LCOE declining 5-8%/yr'],
                ['Banking of CCCs', 'Upward (short-term)', 'Low', 'If entities hoard surplus for future compliance'],
                ['Offset supply growth', 'Downward', 'Medium', 'As forestry + RE offset projects mature'],
                ['CBAM price linkage', 'Upward', 'High', '2026+ as CBAM fully phases in'],
                ['Economic growth', 'Upward', 'Medium', 'Higher production = higher demand for CCCs'],
                ['Green hydrogen penetration', 'Downward', 'High', '2030+ in steel, fertiliser, refining'],
              ].map(([factor, dir, mag, timeline], i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{factor}</td>
                  <td style={tdS}><span style={badgeS(dir.includes('Up') ? '#fef2f2' : '#d1fae5', dir.includes('Up') ? T.red : T.green)}>{dir}</span></td>
                  <td style={tdS}><span style={badgeS(mag === 'High' ? '#fef3c7' : mag === 'Medium' ? '#e0e7ff' : '#f1f5f9', mag === 'High' ? T.amber : mag === 'Medium' ? T.indigo : T.sub)}>{mag}</span></td>
                  <td style={{ ...tdS, fontSize: 11, color: T.sub }}>{timeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 6 — Financial Impact Simulator
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderFinancialImpact = () => {
    const ci = companyImpact;
    if (!ci) return <div style={cardS}>No industrial companies found in NIFTY 50 dataset.</div>;
    const scenarioData = [
      { scenario: 'No Action', cost: ci.complianceCostCr, penalty: ci.penaltyCost, surplus: 0 },
      { scenario: 'Tech Investment', cost: +(ci.complianceCostCr * (1 - ci.techReductionPct / 100)).toFixed(1), penalty: 0, surplus: ci.surplusRevenue },
      { scenario: 'Full Penalty', cost: 0, penalty: ci.penaltyCost, surplus: 0 },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 11, color: T.sub }}>Company</label>
            <select value={selCompany} onChange={e => setSelCompany(e.target.value)} style={{ ...selectS, display: 'block', marginTop: 4 }}>
              {INDUSTRIAL_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.ticker})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.sub }}>CCC Price (INR)</label>
            <input type="number" value={cccPrice} onChange={e => setCccPrice(+e.target.value || 0)} style={{ ...selectS, display: 'block', marginTop: 4, width: 120 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.sub }}>Tech Investment (INR Cr)</label>
            <input type="number" value={techInvestment} onChange={e => setTechInvestment(+e.target.value || 0)} style={{ ...selectS, display: 'block', marginTop: 4, width: 120 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.sub }}>Projection Years</label>
            <input type="number" value={projectionYears} min={1} max={20} onChange={e => setProjectionYears(+e.target.value || 1)} style={{ ...selectS, display: 'block', marginTop: 4, width: 80 }} />
          </div>
        </div>

        <div style={gridRow(4)}>
          <KPI label={ci.name} value={ci.ticker} unit={ci.sector} />
          <KPI label="Total Emissions" value={`${fmtN(ci.totalEmissions)} t`} unit={`S1: ${fmtN(ci.scope1)} / S2: ${fmtN(ci.scope2)}`} />
          <KPI label="Compliance Cost" value={`INR ${ci.complianceCostCr} Cr`} unit={`${ci.marginImpact}% of revenue`} color={T.red} />
          <KPI label="Penalty Risk" value={`INR ${ci.penaltyCost} Cr`} unit="2x CCC market price" color={T.red} />
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Scenario Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scenarioData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'INR Cr', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cost" name="Compliance Cost" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar dataKey="penalty" name="Penalty" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="surplus" name="CCC Surplus Revenue" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Technology Investment NPV Analysis</div>
            <table style={tblS}>
              <tbody>
                {[
                  ['Technology Investment', `INR ${ci.npvInvestment} Cr`, T.navy],
                  ['Emission Reduction', `${ci.techReductionPct}%`, T.green],
                  ['Reduced Emissions', `${fmtN(ci.reducedEmissions)} tCO2e`, T.text],
                  ['CCC Surplus Generated', `${fmtN(ci.surplusCCC)} CCCs/yr`, T.green],
                  ['Surplus Revenue', `INR ${ci.surplusRevenue} Cr/yr`, T.gold],
                  ['NPV of Savings', `INR ${ci.npvSavings} Cr`, T.green],
                  ['Net NPV', `INR ${ci.npvNet} Cr`, ci.npvNet >= 0 ? T.green : T.red],
                ].map(([label, val, color], i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, width: 200 }}>{label}</td>
                    <td style={{ ...tdS, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: 10, background: ci.npvNet >= 0 ? '#d1fae5' : '#fef2f2', borderRadius: 8, fontSize: 12, fontWeight: 700, color: ci.npvNet >= 0 ? T.green : T.red }}>
              {ci.npvNet >= 0 ? `Positive NPV: Technology investment pays back within projection period` : `Negative NPV: Consider increasing projection period or higher CCC price scenario`}
            </div>
          </div>
        </div>

        {/* Cost pass-through analysis */}
        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Cost Pass-Through Analysis</div>
            <table style={tblS}>
              <thead><tr>{['Metric', 'Value'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  ['Compliance Cost', `INR ${ci.complianceCostCr} Cr`],
                  ['Revenue', `INR ${ci.revCr.toLocaleString()} Cr`],
                  ['Cost as % of Revenue', `${ci.marginImpact}%`],
                  ['Assumed Pass-Through Rate', '40%'],
                  ['Consumer-Borne Cost', `INR ${(ci.complianceCostCr * 0.4).toFixed(1)} Cr`],
                  ['Company-Absorbed Cost', `INR ${(ci.complianceCostCr * 0.6).toFixed(1)} Cr`],
                  ['EBITDA Margin Impact (est.)', `${(ci.marginImpact * 0.6).toFixed(2)}% reduction`],
                  ['Price Increase to Consumer', `${(ci.marginImpact * 0.4).toFixed(2)}% avg product price`],
                ].map(([k, v], i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{k}</td>
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Compliance Cost Sensitivity (INR Cr)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={[500, 800, 1000, 1500, 2000, 3000, 4000, 5000].map(p => ({
                price: p,
                cost: +(ci.totalEmissions * p / 1e7).toFixed(1),
                withTech: +(ci.reducedEmissions * p / 1e7).toFixed(1),
                penalty: +(ci.totalEmissions * p * 2 / 1e7).toFixed(1),
              }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="price" tick={{ fontSize: 10 }} label={{ value: 'CCC Price (INR)', position: 'insideBottom', offset: -2, style: { fontSize: 10 } }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'INR Cr', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cost" name="No Action" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="withTech" name="With Tech Investment" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="penalty" name="Penalty (2x)" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <ReferenceLine x={cccPrice} stroke={T.gold} strokeDasharray="3 3" label={{ value: 'Current', fill: T.gold, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-company comparison */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>CCTS Cost Exposure: All Industrial NIFTY 50 Companies</div>
          <table style={tblS}>
            <thead><tr>{['Company', 'Ticker', 'Sector', 'Scope 1+2 (tCO2e)', 'Cost @ INR ' + cccPrice, 'Revenue (Cr)', 'Margin Impact %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {INDUSTRIAL_COMPANIES.slice(0, 15).map((c, i) => {
                const em = (c.scope1_tco2e || 0) + (c.scope2_tco2e || 0);
                const cost = em * cccPrice;
                const mi = pct(cost / 1e7, c.revenue_inr_cr || 1);
                return (
                  <tr key={i} style={{ background: c.name === selCompany ? '#eef2ff' : (i % 2 === 0 ? T.card : '#f8f7f2') }}>
                    <td style={{ ...tdS, fontWeight: 700, color: c.name === selCompany ? T.indigo : T.navy }}>{c.name}</td>
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.ticker}</td>
                    <td style={{ ...tdS, fontSize: 11 }}>{c.sector}</td>
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>{em.toLocaleString()}</td>
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>{(cost / 1e7).toFixed(1)} Cr</td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{(c.revenue_inr_cr || 0).toLocaleString()}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: mi > 2 ? T.red : mi > 1 ? T.amber : T.green }}>{mi}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 7 — CBAM Linkage
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderCbamLinkage = () => {
    const totalCbamLiability = cbamCalc.reduce((s, c) => s + c.cbamLiability, 0);
    const totalDomesticOffset = cbamCalc.reduce((s, c) => s + c.domesticPayment, 0);
    const totalNetCost = cbamCalc.reduce((s, c) => s + c.netCbamCost, 0);
    return (
      <div>
        <div style={{ ...cardS, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 11, color: T.sub }}>EU CBAM Price ($/tCO2e)</label>
              <input type="range" min={20} max={150} value={euCbamPrice} onChange={e => setEuCbamPrice(+e.target.value)} style={{ ...sliderS, width: 200, display: 'block' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>${euCbamPrice}</span>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.sub }}>India CCC Price ($/tCO2e)</label>
              <input type="range" min={2} max={50} value={indiaCccPriceCbam} onChange={e => setIndiaCccPriceCbam(+e.target.value)} style={{ ...sliderS, width: 200, display: 'block' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>${indiaCccPriceCbam}</span>
            </div>
          </div>
        </div>

        <div style={gridRow(4)}>
          <KPI label="CBAM Overlap Sectors" value={CBAM_SECTORS.length} unit={CBAM_SECTORS.map(s => s.code).join(', ')} />
          <KPI label="CBAM Liability" value={`$${(totalCbamLiability / 1e6).toFixed(1)}M`} unit="at EU border" color={T.red} />
          <KPI label="Domestic Offset" value={`$${(totalDomesticOffset / 1e6).toFixed(1)}M`} unit="India CCC payment" color={T.green} />
          <KPI label="Net CBAM Cost" value={`$${(totalNetCost / 1e6).toFixed(1)}M`} unit="after offset" color={T.amber} />
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>CBAM Offset by Commodity</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cbamCalc} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="commodity" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'USD', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cbamLiability" name="CBAM Liability" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="domesticPayment" name="Domestic CCC Offset" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="netCbamCost" name="Net CBAM Cost" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Export Value at Risk</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cbamCalc.filter(c => c.exports_kusd > 0)} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="commodity" tick={{ fontSize: 11 }} width={80} />
                <Tooltip {...tip} />
                <Bar dataKey="exports_kusd" name="Exports (kUSD)" fill={T.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CBAM sectors detail */}
        <div style={cardS}>
          <div style={secTitle}>CBAM-Overlapping Sectors Detail</div>
          <table style={tblS}>
            <thead><tr>{['Sector', 'Entities', 'Baseline (Mt)', 'Key EU Export Products', 'CBAM Phase-In Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {CBAM_SECTORS.map((s, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{s.name} ({s.code})</td>
                  <td style={tdS}>{s.entities}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace" }}>{s.baselineEmissions_mt}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{
                    s.code === 'ISP' ? 'Hot-rolled coil, wire rod, ferro alloys' :
                    s.code === 'CEM' ? 'Clinker, Portland cement, blended cement' :
                    s.code === 'ALU' ? 'Unwrought aluminium, aluminium oxide' :
                    s.code === 'FER' ? 'Urea, DAP, complex fertilisers' : 'Various'
                  }</td>
                  <td style={tdS}><span style={badgeS('#fef3c7', T.amber)}>Transitional (2023-25) + Full (2026+)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Strategic Analysis: Internalize vs Border Payment</div>
          <table style={tblS}>
            <thead><tr>{['Commodity', 'Emissions (tCO2)', 'CBAM @ $' + euCbamPrice, 'Domestic @ $' + indiaCccPriceCbam, 'Net Cost', 'Savings %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {cbamCalc.map((c, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700 }}>{c.commodity}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace" }}>{c.emissions_tco2.toLocaleString()}</td>
                  <td style={{ ...tdS, color: T.red }}>${(c.cbamLiability / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdS, color: T.green }}>${(c.domesticPayment / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdS, color: T.amber, fontWeight: 700 }}>${(c.netCbamCost / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdS, color: T.green, fontWeight: 700 }}>{c.savingsPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 8 — PAT-to-CCTS Transition
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderPatTransition = () => {
    const patOnlySectors = ['Thermal Power (TPP)', 'Railways (RLY)', 'DISCOMs (DIS)', 'Ports'];
    const cctsSectorCodes = SECTORS.map(s => s.code);
    const patToCcts = PAT_SECTOR_BENCHMARKS.filter(p => cctsSectorCodes.includes(p.secCode));
    const patOnly = PAT_SECTOR_BENCHMARKS.filter(p => !cctsSectorCodes.includes(p.secCode));
    const savingsArea = PAT_HISTORY.filter(p => p.achievedSaving_mtoe !== null).map(p => ({
      cycle: p.cycle, target: p.targetSaving_mtoe, achieved: p.achievedSaving_mtoe,
    }));
    return (
      <div>
        <div style={gridRow(3)}>
          <KPI label="PAT Cycles" value="7" unit="FY 2012-2025" />
          <KPI label="Sectors Transitioning" value={patToCcts.length} unit="PAT to CCTS" />
          <KPI label="PAT-Only Sectors" value={patOnly.length} unit="remain under PAT" />
        </div>

        <div style={cardS}>
          <div style={secTitle}>PAT Scheme History (7 Cycles)</div>
          <table style={tblS}>
            <thead><tr>{['Cycle', 'Period', 'Entities', 'Target (MTOE)', 'Achieved (MTOE)', 'ESCerts', 'Achievement %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {PAT_HISTORY.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{p.cycle}</td>
                  <td style={tdS}>{p.period}</td>
                  <td style={tdS}>{p.entities}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace" }}>{p.targetSaving_mtoe}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace" }}>{p.achievedSaving_mtoe ?? 'In Progress'}</td>
                  <td style={tdS}>{p.escerts ? p.escerts.toLocaleString() : 'TBD'}</td>
                  <td style={{ ...tdS, color: p.pct ? (p.pct >= 100 ? T.green : T.amber) : T.sub, fontWeight: 700 }}>{p.pct ? `${p.pct}%` : 'TBD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={gridRow(2)}>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Energy Savings Trajectory</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={savingsArea} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'MTOE', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="target" name="Target" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                <Area type="monotone" dataKey="achieved" name="Achieved" stroke={T.green} fill={T.green} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Transition Mapping</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo, marginBottom: 8 }}>Transitioning to CCTS ({patToCcts.length} sectors)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {patToCcts.map((p, i) => <span key={i} style={badgeS('#eef2ff', T.indigo)}>{p.sector} ({p.secCode})</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 8 }}>Remaining under PAT ({patOnly.length} sectors)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {patOnly.map((p, i) => <span key={i} style={badgeS('#fef3c7', T.amber)}>{p.sector} ({p.secCode})</span>)}
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: `1px solid #bae6fd`, fontSize: 12, color: T.text }}>
              <strong>ESCert-to-CCC Conversion:</strong> BEE is developing a framework to allow residual ESCerts from PAT cycles to be converted into CCCs at a defined exchange ratio, expected to be announced alongside trading rules.
            </div>
          </div>
        </div>

        {/* ESCert generation and trading history chart */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>ESCert Generation Across PAT Cycles</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={PAT_HISTORY.filter(p => p.escerts !== null)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'ESCerts', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="escerts" name="ESCerts Generated" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PAT vs CCTS comparison table */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>PAT vs CCTS: Key Differences</div>
          <table style={tblS}>
            <thead><tr>{['Parameter', 'PAT Scheme', 'CCTS'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Metric', 'Energy intensity (SEC)', 'Emission intensity (tCO2e/unit)'],
                ['Target Type', 'Energy savings (MTOE)', 'GHG emission reduction'],
                ['Certificate', 'ESCert', 'Carbon Credit Certificate (CCC)'],
                ['Trading', 'IEX (bilateral)', 'IEX, PXIL, HPOWERT (exchange-traded)'],
                ['Penalty', 'ESCert price (at hearing)', '2x average CCC market price'],
                ['Verification', 'DEAs + BEE', 'ACVAs (ISO 14065)'],
                ['Registry', 'PAT Exchange', 'GCI Registry'],
                ['Scope', 'Designated consumers (energy use)', 'Obligated entities (GHG emissions)'],
                ['International Linkage', 'None', 'Article 6.2, CBAM offset, CORSIA (future)'],
                ['Offset Mechanism', 'None', '9 approved methodologies + 18 tools'],
                ['Crediting Period', '3-year compliance cycle', '7-30 years (methodology-specific)'],
              ].map(([param, pat, ccts], i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{param}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{pat}</td>
                  <td style={{ ...tdS, fontSize: 11, color: T.indigo }}>{ccts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Achievement rate trend */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>PAT Achievement Rate Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={PAT_HISTORY.filter(p => p.pct !== null)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[100, 160]} label={{ value: '% Achievement', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <ReferenceLine y={100} stroke={T.red} strokeDasharray="3 3" label={{ value: '100% target', fill: T.red, fontSize: 10 }} />
              <Line type="monotone" dataKey="pct" name="Achievement %" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>All PAT cycles have exceeded 100% target, demonstrating strong energy efficiency gains across Indian industry. This track record supports the viability of more ambitious CCTS emission intensity targets.</div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 9 — Offset Mechanism
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderOffsetMechanism = () => {
    const regSteps = [
      { step: 1, title: 'Concept Note', desc: 'Project developer submits concept to BEE' },
      { step: 2, title: 'Methodology Selection', desc: 'Select from 9 approved BM methodologies' },
      { step: 3, title: 'Project Design Document', desc: 'Prepare PDD with baseline, monitoring plan' },
      { step: 4, title: 'ACVA Validation', desc: 'Third-party validation per ISO 14064-2' },
      { step: 5, title: 'BEE Registration', desc: 'BEE reviews and registers on GCI registry' },
      { step: 6, title: 'Monitoring & Verification', desc: 'Annual monitoring + periodic ACVA verification' },
      { step: 7, title: 'CCC Issuance', desc: 'Verified reductions issued as CCCs' },
    ];
    return (
      <div>
        <div style={gridRow(3)}>
          <KPI label="Offset Methodologies" value={METHODOLOGIES.length} unit="BEE approved" />
          <KPI label="Max Offset Share" value="10%" unit="of compliance obligation (est.)" />
          <KPI label="Registration Steps" value="7" unit="concept to issuance" />
        </div>

        <div style={cardS}>
          <div style={secTitle}>Project Registration Process</div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 10 }}>
            {regSteps.map((step, i) => (
              <div key={i} style={{ minWidth: 150, padding: '12px 14px', borderRight: i < regSteps.length - 1 ? `2px solid ${T.green}` : 'none', background: i % 2 === 0 ? '#f0fdf4' : T.card }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{step.step}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginTop: 4 }}>{step.title}</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Sample Offset Projects by Methodology</div>
          <table style={tblS}>
            <thead><tr>{['Methodology', 'Sector', 'Sample Project', 'Annual Credits', 'Crediting Period', 'Total Credits', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {offsetProjects.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: T.indigo }}>{p.methodology}</td>
                  <td style={tdS}>{p.sector}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{p.sampleProject}</td>
                  <td style={{ ...tdS, fontFamily: "'JetBrains Mono', monospace" }}>{p.annualCredits.toLocaleString()}</td>
                  <td style={tdS}>{p.creditingPeriod} yrs</td>
                  <td style={{ ...tdS, fontWeight: 700, color: T.green }}>{p.totalCredits.toLocaleString()}</td>
                  <td style={tdS}><span style={badgeS(p.registrationStatus === 'Registered' ? '#d1fae5' : p.registrationStatus === 'Under Validation' ? '#fef3c7' : '#e0e7ff', p.registrationStatus === 'Registered' ? T.green : p.registrationStatus === 'Under Validation' ? T.amber : T.indigo)}>{p.registrationStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>CCC Generation Estimate by Project Type</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={offsetProjects} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="methodology" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Annual Credits', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <Bar dataKey="annualCredits" name="Annual Credits" fill={T.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Offset share limits */}
        <div style={gridRow(2)}>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Offset Share Limits for Compliance</div>
            <table style={tblS}>
              <tbody>
                {[
                  ['Maximum Offset Share', '10% of compliance obligation (estimated)', 'Prevents over-reliance on offsets'],
                  ['Eligible Project Types', 'All 9 BEE-approved methodologies', 'Must be registered on GCI registry'],
                  ['Geographic Scope', 'Within India only (for compliance)', 'International offsets not eligible for CCTS'],
                  ['Vintage Restriction', 'Projects registered after CCTS notification', 'Pre-existing VCM credits not eligible'],
                  ['Buffer Pool', '5% of forestry credits held in buffer', 'Permanence risk mitigation for removals'],
                  ['Additionality', 'Mandatory BM-T-001 assessment', 'Must demonstrate project would not occur without CCC revenue'],
                ].map(([k, v, note], i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700, color: T.navy, width: 180 }}>{k}</td>
                    <td style={tdS}>{v}</td>
                    <td style={{ ...tdS, fontSize: 11, color: T.sub }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Voluntary vs Compliance Market Interaction</div>
            <table style={tblS}>
              <tbody>
                {[
                  ['VCM Credits', 'Existing Verra/Gold Standard credits from India projects are NOT eligible for CCTS compliance'],
                  ['CCTS Offsets', 'CCCs issued under BEE methodologies are compliance-grade; may also be retired voluntarily'],
                  ['Fungibility', 'One-way: compliance credits can be used voluntarily, but voluntary credits cannot be used for CCTS compliance'],
                  ['Price Differential', 'CCTS CCCs expected to trade at premium over VCM credits due to compliance value'],
                  ['Registry Interop', 'GCI registry designed to be interoperable with Verra, Gold Standard registries in future phases'],
                  ['Transition Path', 'VCM project developers can apply for BEE methodology approval to transition to compliance market'],
                ].map(([k, v], i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700, color: T.navy, width: 160 }}>{k}</td>
                    <td style={{ ...tdS, fontSize: 11 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total credits by crediting period */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Lifetime Credit Generation by Methodology (Total over Crediting Period)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={offsetProjects} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: 'Total Credits', position: 'insideBottom', offset: -2, style: { fontSize: 10 } }} />
              <YAxis type="category" dataKey="methodology" tick={{ fontSize: 10 }} width={120} />
              <Tooltip {...tip} />
              <Bar dataKey="totalCredits" name="Total Lifetime Credits" radius={[0, 4, 4, 0]}>
                {offsetProjects.map((p, i) => <Cell key={i} fill={p.sector === 'Forestry' ? T.green : p.sector === 'Energy' ? T.gold : CC[i % CC.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 10 — International Linkage
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderInternational = () => {
    return (
      <div>
        <div style={gridRow(3)}>
          <KPI label="Bilateral Agreements" value={JCM_AGREEMENTS.length} unit="JCM / MOU partners" />
          <KPI label="ITMO-Eligible" value={JCM_AGREEMENTS.filter(j => j.itmo_eligible).length} unit="Article 6.2 transfers" />
          <KPI label="India NDC Target" value="45%" unit="intensity reduction vs 2005" />
        </div>

        <div style={cardS}>
          <div style={secTitle}>Article 6.2 Bilateral Agreements</div>
          <table style={tblS}>
            <thead><tr>{['Partner', 'Status', 'Date', 'Scope', 'ITMO Eligible'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {JCM_AGREEMENTS.map((j, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{j.partner}</td>
                  <td style={tdS}><span style={badgeS(j.status === 'Signed' ? '#d1fae5' : j.status === 'MOU Signed' ? '#e0e7ff' : '#fef3c7', j.status === 'Signed' ? T.green : j.status === 'MOU Signed' ? T.indigo : T.amber)}>{j.status}</span></td>
                  <td style={tdS}>{j.date}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{j.scope}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: j.itmo_eligible ? T.green : T.sub }}>{j.itmo_eligible ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={gridRow(2)}>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>ITMO Pricing vs Domestic CCC</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { type: 'India CCC (est.)', price: 10, fill: T.gold },
                { type: 'JCM Credits (Japan)', price: 18, fill: T.indigo },
                { type: 'Article 6.4 CER', price: 8, fill: T.green },
                { type: 'VCM (Verra/Gold Std)', price: 6, fill: T.amber },
                { type: 'CORSIA CEU', price: 12, fill: T.navy },
              ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip {...tip} />
                <Bar dataKey="price" name="Price (USD/tCO2e)" radius={[4, 4, 0, 0]}>
                  {[T.gold, T.indigo, T.green, T.amber, T.navy].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>NDC Accounting & Double-Counting Prevention</div>
            <table style={tblS}>
              <tbody>
                {[
                  ['NDC Target', '45% emission intensity reduction by 2030 vs 2005 GDP'],
                  ['Net Zero Target', '2070 (Panchamrit commitment, COP26)'],
                  ['Corresponding Adjustment', 'Required for all Article 6.2 ITMO transfers'],
                  ['Authorization', 'MoEFCC must authorize each ITMO transfer'],
                  ['CORSIA Eligibility', 'India CCCs not yet CORSIA-eligible; under review'],
                  ['Domestic Retention', 'CCTS compliance CCCs cannot be exported as ITMOs'],
                  ['Offset CCCs', 'Offset CCCs may be eligible for export with authorization'],
                ].map(([k, v], i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700, width: 200, color: T.navy }}>{k}</td>
                    <td style={tdS}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CORSIA eligibility analysis */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>CORSIA Eligibility Analysis</div>
          <table style={tblS}>
            <thead><tr>{['Criterion', 'CORSIA Requirement', 'India CCTS Status', 'Gap'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Registry', 'Approved registry with unique serial numbers', 'GCI registry operational', 'Under ICAO review'],
                ['MRV', 'ISO 14064 compliant monitoring', 'ISO 14064/14065 mandated', 'Aligned'],
                ['Additionality', 'Demonstrated additionality (BM-T-001)', 'All methodologies require additionality tool', 'Aligned'],
                ['Permanence', 'Risk of reversal assessment for removals', 'Forestry methodologies include permanence buffers', 'Partial'],
                ['Double Counting', 'No double claiming with NDC', 'Corresponding adjustment framework under development', 'Gap'],
                ['Sustainable Dev.', 'No net harm assessment', 'EIA clearance required for offset projects', 'Aligned'],
                ['Vintage', 'Credits from 2021 onwards for Phase 1', 'First CCCs expected 2027', 'Eligible by vintage'],
              ].map(([criterion, req, status, gap], i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{criterion}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{req}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{status}</td>
                  <td style={tdS}><span style={badgeS(gap === 'Aligned' ? '#d1fae5' : gap === 'Partial' ? '#fef3c7' : '#fef2f2', gap === 'Aligned' ? T.green : gap === 'Partial' ? T.amber : T.red)}>{gap}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* International comparison line chart */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Carbon Price Convergence Trajectory (2026-2035, USD/tCO2e)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={Array.from({ length: 10 }, (_, t) => ({
              year: 2026 + t,
              India: Math.round(10 + t * 3.5 + t * t * 0.3),
              EU_ETS: Math.round(65 + t * 5),
              Korea: Math.round(8 + t * 2),
              China: Math.round(11 + t * 4),
            }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'USD/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="India" stroke={T.gold} strokeWidth={3} dot />
              <Line type="monotone" dataKey="EU_ETS" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Korea" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="China" stroke={T.red} strokeWidth={2} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 11 — Entity Readiness Assessment
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderReadiness = () => {
    const avgReadiness = readinessRadar.length > 0 ? Math.round(readinessRadar.reduce((s, r) => s + r.score, 0) / readinessRadar.length) : 0;
    const readinessHeatmap = SECTORS.map((sec, si) => {
      const seed = si * 71 + 13;
      return {
        name: sec.name, code: sec.code,
        mrv: Math.round(35 + sr(seed) * 50),
        data: Math.round(25 + sr(seed + 1) * 55),
        acva: Math.round(20 + sr(seed + 2) * 60),
        trading: Math.round(15 + sr(seed + 3) * 45),
        icp: Math.round(10 + sr(seed + 4) * 50),
        governance: Math.round(30 + sr(seed + 5) * 55),
      };
    });
    const investmentNeeds = SECTORS.map((sec, si) => {
      const seed = si * 83 + 41;
      return { name: sec.name.length > 10 ? sec.name.slice(0, 10) + '..' : sec.name, mrvInfra: Math.round(50 + sr(seed) * 200), techUpgrade: Math.round(200 + sr(seed + 1) * 800), capacity: Math.round(20 + sr(seed + 2) * 80) };
    });
    const heatColor = (v) => v >= 70 ? T.green : v >= 50 ? T.gold : v >= 30 ? T.amber : T.red;
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginRight: 8 }}>Sector:</label>
          <select value={readinessSector} onChange={e => setReadinessSector(e.target.value)} style={selectS}>
            {SECTORS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>

        <div style={gridRow(3)}>
          <KPI label="Avg Readiness Score" value={`${avgReadiness}/100`} unit={readinessSectorData.name} color={avgReadiness >= 50 ? T.green : T.amber} />
          <KPI label="Entities" value={readinessSectorData.entities} unit="obligated" />
          <KPI label="Est. Time to First CCC" value={`${Math.round(12 + (100 - avgReadiness) * 0.2)} months`} unit="from baseline year" />
        </div>

        <div style={gridRow(2)}>
          <div style={cardS}>
            <div style={secTitle}>Readiness Radar: {readinessSectorData.name}</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={readinessRadar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Readiness" dataKey="score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                <Tooltip {...tip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Investment Needs by Sector (INR Cr)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={investmentNeeds} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="mrvInfra" name="MRV Infrastructure" stackId="a" fill={T.indigo} />
                <Bar dataKey="techUpgrade" name="Technology Upgrade" stackId="a" fill={T.gold} />
                <Bar dataKey="capacity" name="Capacity Building" stackId="a" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Sector-wise Readiness Heatmap</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tblS}>
              <thead>
                <tr>
                  <th style={thS}>Sector</th>
                  {['MRV', 'Data Infra', 'ACVA', 'Trading', 'ICP', 'Governance'].map(h => <th key={h} style={{ ...thS, textAlign: 'center' }}>{h}</th>)}
                  <th style={{ ...thS, textAlign: 'center' }}>Average</th>
                </tr>
              </thead>
              <tbody>
                {readinessHeatmap.map((r, i) => {
                  const avg = Math.round((r.mrv + r.data + r.acva + r.trading + r.icp + r.governance) / 6);
                  return (
                    <tr key={i}>
                      <td style={{ ...tdS, fontWeight: 700 }}>{r.name}</td>
                      {[r.mrv, r.data, r.acva, r.trading, r.icp, r.governance].map((v, j) => (
                        <td key={j} style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: heatColor(v), fontFamily: "'JetBrains Mono', monospace" }}>{v}</td>
                      ))}
                      <td style={{ ...tdS, textAlign: 'center', fontWeight: 800, color: heatColor(avg), fontFamily: "'JetBrains Mono', monospace" }}>{avg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Capacity Building Recommendations</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 2, color: T.text }}>
            <li><strong>MRV Systems:</strong> Deploy continuous emissions monitoring (CEMS) at major point sources; integrate with BEE portal via API</li>
            <li><strong>ACVA Ecosystem:</strong> Train and accredit 200+ verification professionals by FY 2026-27; establish regional ACVA hubs</li>
            <li><strong>Data Infrastructure:</strong> Implement ERP-integrated GHG accounting; standardize fuel consumption metering across facilities</li>
            <li><strong>Trading Readiness:</strong> Register on GCI registry; establish internal compliance teams; open exchange trading accounts</li>
            <li><strong>Internal Carbon Pricing:</strong> Adopt shadow carbon price aligned with CCC trajectory; integrate into CAPEX decision-making</li>
            <li><strong>Board Governance:</strong> Establish board-level climate committee; link executive compensation to emission intensity targets</li>
          </ul>
        </div>

        {/* Timeline to first CCC per sector */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Estimated Timeline to First CCC Issuance by Sector</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={SECTORS.map((sec, si) => {
              const seed = si * 71 + 13;
              const avgScore = Math.round([35 + sr(seed) * 50, 25 + sr(seed + 1) * 55, 20 + sr(seed + 2) * 60, 15 + sr(seed + 3) * 45, 10 + sr(seed + 4) * 50, 30 + sr(seed + 5) * 55].reduce((s, v) => s + v, 0) / 6);
              return { name: sec.name.length > 10 ? sec.name.slice(0, 10) + '..' : sec.name, months: Math.round(12 + (100 - avgScore) * 0.2), readiness: avgScore };
            })} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: 'Months from Baseline Year', position: 'insideBottom', offset: -2, style: { fontSize: 10 } }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip {...tip} />
              <Bar dataKey="months" name="Months to First CCC" radius={[0, 4, 4, 0]}>
                {SECTORS.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key risks and mitigants */}
        <div style={{ ...cardS, marginTop: 16 }}>
          <div style={secTitle}>Key Readiness Risks and Mitigants</div>
          <table style={tblS}>
            <thead><tr>{['Risk', 'Impact', 'Likelihood', 'Mitigant'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Delayed ACVA accreditation', 'High', 'Medium', 'BEE fast-track accreditation for existing ISO 14065 auditors'],
                ['Incomplete fuel metering at SMEs', 'High', 'High', 'Phased metering mandate + estimation protocols for SMEs'],
                ['Low trading liquidity in Year 1', 'Medium', 'High', 'Allow banking of CCCs + voluntary market participation'],
                ['Data quality issues in baseline', 'High', 'Medium', 'Mandatory third-party data validation before EIVA allocation'],
                ['Insufficient internal expertise', 'Medium', 'High', 'BEE + sector associations capacity building programs'],
                ['Technology lock-in for heavy industry', 'High', 'Low', 'Multi-year compliance cycles + technology flexibility provisions'],
              ].map(([risk, impact, likelihood, mitigant], i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{risk}</td>
                  <td style={tdS}><span style={badgeS(impact === 'High' ? '#fef2f2' : '#fef3c7', impact === 'High' ? T.red : T.amber)}>{impact}</span></td>
                  <td style={tdS}><span style={badgeS(likelihood === 'High' ? '#fef2f2' : likelihood === 'Medium' ? '#fef3c7' : '#d1fae5', likelihood === 'High' ? T.red : likelihood === 'Medium' ? T.amber : T.green)}>{likelihood}</span></td>
                  <td style={{ ...tdS, fontSize: 11 }}>{mitigant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     CONNECTED MODULES
     ═══════════════════════════════════════════════════════════════════════════ */
  const CONNECTED_MODULES = [
    { path: '/cbam-compliance', label: 'CBAM Compliance', desc: 'CBAM cost offset analysis using domestic CCC payments' },
    { path: '/pcaf-financed-emissions', label: 'PCAF Financed Emissions', desc: 'Bank exposure to CCTS-obligated entities' },
    { path: '/climate-capital-adequacy', label: 'Climate Capital Adequacy', desc: 'Capital impact of CCTS compliance costs' },
    { path: '/scope3-engine', label: 'Scope 3 Engine', desc: 'Scope 1 emissions reduction from CCTS compliance' },
    { path: '/internal-carbon-price', label: 'Internal Carbon Price', desc: 'Shadow carbon price alignment with CCC price' },
    { path: '/carbon-credit-pricing', label: 'Carbon Credit Pricing', desc: 'CCC pricing vs international credit markets' },
    { path: '/carbon-market-intelligence', label: 'Carbon Market Intelligence', desc: 'India carbon market vs global markets' },
    { path: '/enterprise-climate-risk', label: 'Enterprise Climate Risk', desc: 'Enterprise-level CCTS cost exposure' },
    { path: '/rbi-climate-risk', label: 'RBI Climate Risk', desc: 'RBI climate risk from CCTS-exposed lending book' },
    { path: '/transition-risk-dashboard', label: 'Transition Risk Dashboard', desc: 'Transition pathway for CCTS sectors' },
  ];

  /* ═══════════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, background: T.surface, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>India Carbon Credit Trading Scheme (CCTS)</h1>
          <p style={{ fontSize: 12, color: T.sub, margin: '4px 0 0' }}>BEE / Ministry of Power | Energy Conservation (Amendment) Act, 2022 | {TOTAL_ENTITIES} entities across {SECTORS.length} sectors</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <CurrencyToggle />
          <ReportExporter title="India CCTS Analysis" />
        </div>
      </div>

      {/* tab bar */}
      <div style={tabBar}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={tabBtn(tab === i)}>{t}</button>
        ))}
      </div>

      {/* tab content */}
      {tab === 0 && renderOverview()}
      {tab === 1 && renderComplianceFramework()}
      {tab === 2 && renderSectorDeepDive()}
      {tab === 3 && renderMethodologies()}
      {tab === 4 && renderTools()}
      {tab === 5 && renderPricing()}
      {tab === 6 && renderFinancialImpact()}
      {tab === 7 && renderCbamLinkage()}
      {tab === 8 && renderPatTransition()}
      {tab === 9 && renderOffsetMechanism()}
      {tab === 10 && renderInternational()}
      {tab === 11 && renderReadiness()}

      {/* ═══ TAB 12: CALCULATE & VALIDATE ═══ */}
      {tab === 12 && (<div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: Input Form */}
          <div style={cardS}>
            <div style={secTitle}>🔢 CCC Calculation Engine</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: T.sub, display: 'block', marginBottom: 4 }}>Select Methodology</label>
              <select value={calcMethodology} onChange={e => { setCalcMethodology(e.target.value); setCalcInputs({}); setCalcResult(null); setCalcValidation(null); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                {Object.keys(DATA_CAPTURE_SCHEMAS).map(k => (
                  <option key={k} value={k}>{k} — {DATA_CAPTURE_SCHEMAS[k].title}</option>
                ))}
              </select>
            </div>
            {DATA_CAPTURE_SCHEMAS[calcMethodology] && (<div>
              <div style={{ fontSize: 11, color: T.indigo, fontWeight: 600, marginBottom: 8 }}>
                {DATA_CAPTURE_SCHEMAS[calcMethodology].title} | Crediting: {DATA_CAPTURE_SCHEMAS[calcMethodology].crediting_period_yrs} yrs
              </div>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 8, padding: 8, background: '#f8f7f2', borderRadius: 6 }}>
                <strong>Formula:</strong> {DATA_CAPTURE_SCHEMAS[calcMethodology].formula}<br/>
                <strong>Tools required:</strong> {(DATA_CAPTURE_SCHEMAS[calcMethodology].tools_required || []).join(', ')}
              </div>
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {DATA_CAPTURE_SCHEMAS[calcMethodology].inputs.map((field, fi) => (
                  <div key={fi} style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: field.required ? T.navy : T.sub, fontWeight: field.required ? 600 : 400, display: 'block', marginBottom: 2 }}>
                      {field.field.replace(/_/g, ' ')} {field.unit ? `(${field.unit})` : ''} {field.required ? '*' : ''}
                    </label>
                    {field.type === 'select' ? (
                      <select value={calcInputs[field.field] || ''} onChange={e => setCalcInputs(p => ({ ...p, [field.field]: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11 }}>
                        <option value="">-- select --</option>
                        {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'date' ? (
                      <input type="date" value={calcInputs[field.field] || ''} onChange={e => setCalcInputs(p => ({ ...p, [field.field]: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11 }} />
                    ) : (
                      <input type={field.type === 'number' ? 'number' : 'text'} value={calcInputs[field.field] || ''} onChange={e => setCalcInputs(p => ({ ...p, [field.field]: field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value }))} placeholder={field.help || ''} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${calcValidation && calcValidation.errors.some(err => err.field === field.field) ? T.red : T.border}`, fontSize: 11 }} />
                    )}
                    {field.help && <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>{field.help}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => {
                  const v = validateInputs(calcMethodology, calcInputs);
                  setCalcValidation(v);
                  if (v.valid) {
                    const engine = METHODOLOGY_ENGINES[calcMethodology];
                    if (engine) {
                      const result = engine.calculate(calcInputs);
                      setCalcResult(result);
                      setAssuranceReport(generateAssuranceReport(result));
                    }
                  } else { setCalcResult(null); setAssuranceReport(null); }
                }} style={{ flex: 1, padding: '10px 16px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  ▶ Calculate & Validate
                </button>
                <button onClick={() => { setCalcInputs({}); setCalcResult(null); setCalcValidation(null); setAssuranceReport(null); }} style={{ padding: '10px 16px', background: T.surface, color: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            </div>)}
          </div>

          {/* Right: Results */}
          <div>
            {/* Validation Results */}
            {calcValidation && !calcValidation.valid && (
              <div style={{ ...cardS, borderLeft: `4px solid ${T.red}`, marginBottom: 16 }}>
                <div style={{ ...secTitle, color: T.red }}>⚠ Validation Errors ({calcValidation.errors.length})</div>
                {calcValidation.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.red, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                    <strong>{e.field.replace(/_/g, ' ')}:</strong> {e.message}
                  </div>
                ))}
                <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
                  Completeness: {calcValidation.completeness_pct !== undefined ? calcValidation.completeness_pct + '%' : 'N/A'}
                </div>
              </div>
            )}

            {/* Calculation Results */}
            {calcResult && !calcResult.error && (
              <div style={cardS}>
                <div style={{ ...secTitle, color: T.green }}>✅ Calculation Results — {calcMethodology}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { l: 'Baseline Emissions', v: (calcResult.baselineEmissions_tco2e || 0).toLocaleString() + ' tCO2e', c: T.amber },
                    { l: 'Project Emissions', v: (calcResult.projectEmissions_tco2e || 0).toLocaleString() + ' tCO2e', c: T.sub },
                    { l: 'Leakage', v: (calcResult.leakage_tco2e || 0).toLocaleString() + ' tCO2e', c: T.sub },
                    { l: 'Net Reduction', v: (calcResult.netReduction_tco2e || 0).toLocaleString() + ' tCO2e', c: T.green },
                    { l: 'CCCs Issued', v: (calcResult.cccIssued || 0).toLocaleString(), c: T.gold },
                    { l: 'Value (INR)', v: '₹' + ((calcResult.cccValue_inr || 0) / 1e5).toFixed(2) + ' L', c: T.indigo },
                    { l: 'Value (USD)', v: '$' + ((calcResult.cccValue_usd || 0) / 1e3).toFixed(1) + 'K', c: T.navy },
                    { l: 'Data Quality', v: calcResult.dataQuality || 'N/A', c: calcResult.assuranceReady ? T.green : T.amber },
                  ].map((k, i) => (
                    <div key={i} style={{ background: k.c + '08', border: `1px solid ${k.c}25`, borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: T.sub }}>{k.l}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: k.c, fontFamily: "'JetBrains Mono', monospace" }}>{k.v}</div>
                    </div>
                  ))}
                </div>

                {/* Audit Trail */}
                {calcResult.auditTrail && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>📊 Calculation Audit Trail</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                      <thead><tr style={{ background: T.navy + '08' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.navy, fontWeight: 700 }}>Step</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.navy, fontWeight: 700 }}>Description</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.navy, fontWeight: 700 }}>Formula</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.navy, fontWeight: 700 }}>Result</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.navy, fontWeight: 700 }}>Reference</th>
                      </tr></thead>
                      <tbody>{(calcResult.auditTrail.intermediateSteps || []).map((s, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: T.indigo }}>{s.step}</td>
                          <td style={{ padding: '6px 8px' }}>{s.description}</td>
                          <td style={{ padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.green }}>{s.formula || '—'}</td>
                          <td style={{ padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{s.result}</td>
                          <td style={{ padding: '6px 8px', fontSize: 9, color: T.sub }}>{s.reference}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}

                {/* Assurance Checklist */}
                {calcResult.auditTrail && calcResult.auditTrail.assuranceChecklist && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>✓ Assurance Checklist (ISO 14064/14065)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {calcResult.auditTrail.assuranceChecklist.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: c.status === 'PASS' ? T.green + '08' : T.red + '08', borderRadius: 6, border: `1px solid ${c.status === 'PASS' ? T.green : T.red}20` }}>
                          <span style={{ fontSize: 14 }}>{c.status === 'PASS' ? '✅' : '❌'}</span>
                          <span style={{ fontSize: 11, color: c.status === 'PASS' ? T.green : T.red }}>{c.item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, padding: '8px 12px', background: calcResult.assuranceReady ? T.green + '10' : T.amber + '10', borderRadius: 6, border: `1px solid ${calcResult.assuranceReady ? T.green : T.amber}30` }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: calcResult.assuranceReady ? T.green : T.amber }}>
                        {calcResult.assuranceReady ? '✅ ASSURANCE READY — All checks passed' : '⚠ REVIEW REQUIRED — Some checks need attention'}
                      </span>
                    </div>
                  </div>
                )}

                {/* MRV Compliance */}
                {calcResult.auditTrail && calcResult.auditTrail.mrvCompliance && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>🔗 MRV Compliance</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {Object.entries(calcResult.auditTrail.mrvCompliance).map(([k, v]) => (
                        <div key={k} style={{ padding: '6px 12px', background: v ? T.green + '10' : T.red + '10', borderRadius: 16, fontSize: 10, color: v ? T.green : T.red, fontWeight: 600 }}>
                          {v ? '✓' : '✗'} {k.replace(/_/g, ' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!calcResult && !calcValidation && (
              <div style={{ ...cardS, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔢</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>CCTS Calculation Engine</div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
                  Select a methodology, fill in the required fields, and click "Calculate & Validate" to compute Carbon Credit Certificates (CCCs) with a full audit trail and assurance checklist.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>)}

      {/* ═══ TAB 13: ASSURANCE REPORT ═══ */}
      {tab === 13 && (<div>
        {assuranceReport ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={secTitle}>📋 {assuranceReport.title}</div>
              <ReportExporter title={assuranceReport.title} subtitle={assuranceReport.standard} framework="India CCTS" sections={(assuranceReport.sections || []).map(s => ({ title: s.title, type: 'table', data: s.data ? Object.entries(typeof s.data === 'object' && !Array.isArray(s.data) ? s.data : {}).map(([k, v]) => ({ field: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) })) : [] }))} metadata={assuranceReport.metadata || {}} />
            </div>
            <div style={{ ...cardS, borderTop: `4px solid ${T.gold}`, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.sub, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>FRAMEWORK</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{assuranceReport.framework}</div>
                </div>
                <div style={{ padding: '4px 12px', background: T.gold + '15', borderRadius: 6, fontSize: 11, fontWeight: 700, color: T.gold }}>{assuranceReport.standard}</div>
              </div>
            </div>
            {(assuranceReport.sections || []).map((section, si) => (
              <div key={si} style={{ ...cardS, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{section.title}</div>
                {section.data && typeof section.data === 'object' && !Array.isArray(section.data) && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <tbody>{Object.entries(section.data).map(([k, v], ri) => (
                      <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy, width: '35%' }}>{k.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace" }}>
                          {typeof v === 'boolean' ? (v ? '✅ Yes' : '❌ No') : typeof v === 'object' ? JSON.stringify(v, null, 1) : String(v)}
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
                {Array.isArray(section.data) && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ background: T.navy + '08' }}>
                      {Object.keys(section.data[0] || {}).map(k => <th key={k} style={{ padding: '6px 8px', textAlign: 'left', color: T.navy, fontWeight: 700 }}>{k.replace(/_/g, ' ')}</th>)}
                    </tr></thead>
                    <tbody>{section.data.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                        {Object.values(row).map((v, vi) => (
                          <td key={vi} style={{ padding: '6px 8px', color: v === 'PASS' ? T.green : v === 'FAIL' ? T.red : T.text }}>
                            {v === 'PASS' ? '✅ PASS' : v === 'FAIL' ? '❌ FAIL' : typeof v === 'boolean' ? (v ? '✅' : '❌') : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 12, background: '#f8f7f2', borderRadius: 8, fontSize: 10, color: T.sub, textAlign: 'center' }}>
              {assuranceReport.metadata?.disclaimer || 'Generated by A² Intelligence CCTS Engine v1.0'}
            </div>
          </div>
        ) : (
          <div style={{ ...cardS, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Assurance Report Generated</div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
              Go to the "🔢 Calculate & Validate" tab, select a methodology, enter your project data, and run the calculation. The assurance report will be generated automatically with audit trail, ISO 14064/14065 compliance checks, and CCC issuance recommendation.
            </div>
            <button onClick={() => setTab(12)} style={{ marginTop: 16, padding: '10px 24px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              Go to Calculator →
            </button>
          </div>
        )}
      </div>)}

      {/* connected modules */}
      <div style={{ ...cardS, marginTop: 24 }}>
        <div style={secTitle}>Connected Modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {CONNECTED_MODULES.map((m, i) => (
            <a key={i} href={m.path} style={{ ...linkS, display: 'block', padding: '10px 12px', background: '#f8f7f2', borderRadius: 8, border: `1px solid ${T.border}`, textDecoration: 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{m.label}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{m.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* data source attribution */}
      <div style={{ marginTop: 16, fontSize: 10, color: T.sub, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
        Sources: BEE CCTS Official Documentation | Energy Conservation (Amendment) Act 2022 | S.O. 2825(E) | CEA Grid EF v19 | OWID CO2/Energy | CBAM Vulnerability Index | PAT Scheme Reports (BEE)
      </div>
    </div>
  );
}
