import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, Scatter,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine
} from 'recharts';

/* ─── deterministic PRNG ─── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ─── Theme ─── */
const T = { surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e', text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5', green: '#065f46', red: '#991b1b', amber: '#92400e' };
const FONT = "'DM Sans','SF Pro Display',system-ui,sans-serif";
const MONO = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const PAL = [T.indigo, T.green, '#2563eb', T.gold, '#7c3aed', '#0891b2', T.red, T.amber, '#ea580c', '#059669', '#6366f1', '#dc2626', '#0284c7', '#a16207', '#9333ea', '#0d9488', '#be123c', '#4338ca', '#15803d', '#b45309'];

/* ─── MODULE-LEVEL DATA ─── */

const CREDIT_TYPES = [
  { id: 1, name: 'REDD+ Verra VCS', method: 'Avoided Deforestation', registry: 'Verra', qualityScore: 65, costPerTonne: 12, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 30, additionality: 0.72, cobenefits: [13, 15, 6], minOrder: 1000, maxAvailable: 500000, leadTime: 2, counterpartyRisk: 'low', geography: 'Brazil' },
  { id: 2, name: 'ARR Gold Standard', method: 'Afforestation/Reforestation', registry: 'Gold Standard', qualityScore: 78, costPerTonne: 18, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: true, cbamEligible: false, voluntaryOnly: false, permanenceYrs: 40, additionality: 0.85, cobenefits: [13, 15, 1, 8], minOrder: 500, maxAvailable: 200000, leadTime: 3, counterpartyRisk: 'low', geography: 'Kenya' },
  { id: 3, name: 'Cookstove GS', method: 'Clean Cooking', registry: 'Gold Standard', qualityScore: 72, costPerTonne: 9, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 10, additionality: 0.68, cobenefits: [3, 7, 13], minOrder: 2000, maxAvailable: 800000, leadTime: 1, counterpartyRisk: 'low', geography: 'India' },
  { id: 4, name: 'Solar CDM', method: 'Renewable Energy', registry: 'CDM', qualityScore: 40, costPerTonne: 3, corsiaEligible: false, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 25, additionality: 0.35, cobenefits: [7, 9, 13], minOrder: 5000, maxAvailable: 2000000, leadTime: 1, counterpartyRisk: 'med', geography: 'China' },
  { id: 5, name: 'Wind CDM', method: 'Renewable Energy', registry: 'CDM', qualityScore: 38, costPerTonne: 2.5, corsiaEligible: false, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 25, additionality: 0.30, cobenefits: [7, 9], minOrder: 5000, maxAvailable: 3000000, leadTime: 1, counterpartyRisk: 'med', geography: 'India' },
  { id: 6, name: 'DAC Puro.earth', method: 'Direct Air Capture', registry: 'Puro.earth', qualityScore: 95, costPerTonne: 450, corsiaEligible: true, euEtsEligible: true, sbtiAccepted: true, cbamEligible: true, voluntaryOnly: false, permanenceYrs: 10000, additionality: 0.99, cobenefits: [9, 13], minOrder: 100, maxAvailable: 5000, leadTime: 6, counterpartyRisk: 'med', geography: 'Iceland' },
  { id: 7, name: 'Biochar Puro', method: 'Biochar Sequestration', registry: 'Puro.earth', qualityScore: 88, costPerTonne: 85, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: true, cbamEligible: false, voluntaryOnly: false, permanenceYrs: 1000, additionality: 0.92, cobenefits: [2, 12, 15], minOrder: 200, maxAvailable: 30000, leadTime: 3, counterpartyRisk: 'low', geography: 'Finland' },
  { id: 8, name: 'CCS Industrial', method: 'Carbon Capture & Storage', registry: 'ACR', qualityScore: 92, costPerTonne: 120, corsiaEligible: true, euEtsEligible: true, sbtiAccepted: true, cbamEligible: true, voluntaryOnly: false, permanenceYrs: 10000, additionality: 0.95, cobenefits: [9, 13], minOrder: 500, maxAvailable: 50000, leadTime: 12, counterpartyRisk: 'high', geography: 'Norway' },
  { id: 9, name: 'Mangrove Verra', method: 'Blue Carbon', registry: 'Verra', qualityScore: 80, costPerTonne: 25, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: true, cbamEligible: false, voluntaryOnly: false, permanenceYrs: 50, additionality: 0.82, cobenefits: [14, 13, 6, 1], minOrder: 1000, maxAvailable: 100000, leadTime: 4, counterpartyRisk: 'low', geography: 'Indonesia' },
  { id: 10, name: 'Soil Carbon ACR', method: 'Soil Sequestration', registry: 'ACR', qualityScore: 55, costPerTonne: 18, corsiaEligible: false, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 10, additionality: 0.50, cobenefits: [2, 15, 12], minOrder: 2000, maxAvailable: 300000, leadTime: 2, counterpartyRisk: 'med', geography: 'US' },
  { id: 11, name: 'Landfill Gas CDM', method: 'Methane Avoidance', registry: 'CDM', qualityScore: 50, costPerTonne: 5, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 20, additionality: 0.60, cobenefits: [11, 3, 13], minOrder: 3000, maxAvailable: 1000000, leadTime: 1, counterpartyRisk: 'low', geography: 'Mexico' },
  { id: 12, name: 'Mineralization CarbonCure', method: 'Enhanced Weathering', registry: 'Puro.earth', qualityScore: 96, costPerTonne: 95, corsiaEligible: true, euEtsEligible: true, sbtiAccepted: true, cbamEligible: true, voluntaryOnly: false, permanenceYrs: 100000, additionality: 0.97, cobenefits: [9, 12, 13], minOrder: 200, maxAvailable: 20000, leadTime: 4, counterpartyRisk: 'low', geography: 'Canada' },
  { id: 13, name: 'IFM Verra', method: 'Improved Forest Mgmt', registry: 'Verra', qualityScore: 60, costPerTonne: 14, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 40, additionality: 0.55, cobenefits: [15, 13, 6], minOrder: 2000, maxAvailable: 400000, leadTime: 2, counterpartyRisk: 'med', geography: 'Peru' },
  { id: 14, name: 'Tidal Wetland GS', method: 'Blue Carbon', registry: 'Gold Standard', qualityScore: 82, costPerTonne: 30, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: true, cbamEligible: false, voluntaryOnly: false, permanenceYrs: 50, additionality: 0.84, cobenefits: [14, 6, 1, 13], minOrder: 500, maxAvailable: 60000, leadTime: 5, counterpartyRisk: 'low', geography: 'Bangladesh' },
  { id: 15, name: 'Enhanced Weathering', method: 'Enhanced Weathering', registry: 'Isometric', qualityScore: 90, costPerTonne: 110, corsiaEligible: true, euEtsEligible: true, sbtiAccepted: true, cbamEligible: true, voluntaryOnly: false, permanenceYrs: 100000, additionality: 0.94, cobenefits: [2, 12, 15], minOrder: 300, maxAvailable: 15000, leadTime: 3, counterpartyRisk: 'med', geography: 'UK' },
  { id: 16, name: 'Kelp Ocean CDR', method: 'Ocean-Based CDR', registry: 'Isometric', qualityScore: 75, costPerTonne: 200, corsiaEligible: false, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 100, additionality: 0.70, cobenefits: [14, 6, 13], minOrder: 100, maxAvailable: 8000, leadTime: 8, counterpartyRisk: 'high', geography: 'US' },
  { id: 17, name: 'Peatland Rewetting', method: 'Wetland Restoration', registry: 'Verra', qualityScore: 74, costPerTonne: 22, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: true, cbamEligible: false, voluntaryOnly: false, permanenceYrs: 60, additionality: 0.78, cobenefits: [6, 15, 13, 11], minOrder: 1000, maxAvailable: 150000, leadTime: 3, counterpartyRisk: 'low', geography: 'Germany' },
  { id: 18, name: 'Rice Paddy Methane', method: 'Methane Reduction', registry: 'Gold Standard', qualityScore: 68, costPerTonne: 16, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: false, cbamEligible: false, voluntaryOnly: true, permanenceYrs: 5, additionality: 0.65, cobenefits: [2, 1, 13], minOrder: 3000, maxAvailable: 600000, leadTime: 2, counterpartyRisk: 'med', geography: 'Vietnam' },
  { id: 19, name: 'BECCS Pilot', method: 'Bio-Energy CCS', registry: 'ACR', qualityScore: 93, costPerTonne: 180, corsiaEligible: true, euEtsEligible: true, sbtiAccepted: true, cbamEligible: true, voluntaryOnly: false, permanenceYrs: 10000, additionality: 0.96, cobenefits: [7, 9, 13], minOrder: 500, maxAvailable: 10000, leadTime: 12, counterpartyRisk: 'high', geography: 'Sweden' },
  { id: 20, name: 'Agroforestry GS', method: 'Agroforestry', registry: 'Gold Standard', qualityScore: 76, costPerTonne: 20, corsiaEligible: true, euEtsEligible: false, sbtiAccepted: true, cbamEligible: false, voluntaryOnly: false, permanenceYrs: 30, additionality: 0.80, cobenefits: [1, 2, 8, 15, 13], minOrder: 500, maxAvailable: 250000, leadTime: 3, counterpartyRisk: 'low', geography: 'Colombia' },
];

const CORPORATE_TARGETS = {
  scope1: 45000, scope2: 120000, scope3: 350000, totalEmissions: 515000,
  netZeroYear: 2050, interimTarget2030: 0.46, offsetBudgetAnnual: 15000000,
  qualityFloor: 60, corsiaRequired: true,
  preferredMethodologies: ['Direct Air Capture', 'Carbon Capture & Storage', 'Blue Carbon', 'Biochar Sequestration']
};

const PROCUREMENT_HISTORY = Array.from({ length: 24 }, (_, i) => {
  const m = i;
  const base = 3000 + m * 150;
  return {
    month: `${2023 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}`,
    tonnesBought: Math.round(base + sr(m * 13) * 1200),
    avgPrice: +(14 + sr(m * 17) * 8 + m * 0.3).toFixed(2),
    qualityAvg: Math.round(58 + sr(m * 23) * 20),
    spend: 0,
  };
});
PROCUREMENT_HISTORY.forEach(p => { p.spend = Math.round(p.tonnesBought * p.avgPrice); });

const VENDOR_QUOTES = [
  { vendor: 'SouthPole', creditType: 'REDD+ Verra VCS', price: 13.5, volume: 50000, delivery: 'Q2 2025', qualityGuarantee: 70, verifier: 'SCS Global' },
  { vendor: 'ClimatePartner', creditType: 'Cookstove GS', price: 10.2, volume: 100000, delivery: 'Q1 2025', qualityGuarantee: 68, verifier: 'TUV SUD' },
  { vendor: 'Pachama', creditType: 'ARR Gold Standard', price: 19.8, volume: 30000, delivery: 'Q3 2025', qualityGuarantee: 80, verifier: 'Aster Global' },
  { vendor: 'Climeworks', creditType: 'DAC Puro.earth', price: 480, volume: 2000, delivery: 'Q4 2025', qualityGuarantee: 96, verifier: 'DNV' },
  { vendor: 'CarbonCure', creditType: 'Mineralization CarbonCure', price: 98, volume: 10000, delivery: 'Q2 2025', qualityGuarantee: 95, verifier: 'Quantis' },
  { vendor: 'Carbon Direct', creditType: 'Biochar Puro', price: 88, volume: 15000, delivery: 'Q2 2025', qualityGuarantee: 90, verifier: 'Verra' },
  { vendor: 'NatCap Partners', creditType: 'Mangrove Verra', price: 27, volume: 40000, delivery: 'Q3 2025', qualityGuarantee: 78, verifier: 'SCS Global' },
  { vendor: 'EcoAct', creditType: 'IFM Verra', price: 15, volume: 80000, delivery: 'Q1 2025', qualityGuarantee: 62, verifier: 'Bureau Veritas' },
  { vendor: '3Degrees', creditType: 'Landfill Gas CDM', price: 5.5, volume: 200000, delivery: 'Q1 2025', qualityGuarantee: 52, verifier: 'SCS Global' },
  { vendor: 'Running Tide', creditType: 'Kelp Ocean CDR', price: 220, volume: 3000, delivery: 'Q4 2025', qualityGuarantee: 72, verifier: 'Isometric' },
  { vendor: 'Charm Industrial', creditType: 'BECCS Pilot', price: 190, volume: 5000, delivery: 'Q1 2026', qualityGuarantee: 94, verifier: 'Isometric' },
  { vendor: 'Undo Carbon', creditType: 'Enhanced Weathering', price: 115, volume: 8000, delivery: 'Q3 2025', qualityGuarantee: 88, verifier: 'Isometric' },
  { vendor: 'Soil Capital', creditType: 'Soil Carbon ACR', price: 19, volume: 60000, delivery: 'Q2 2025', qualityGuarantee: 56, verifier: 'ACR' },
  { vendor: 'Wetlands Intl', creditType: 'Peatland Rewetting', price: 24, volume: 35000, delivery: 'Q3 2025', qualityGuarantee: 76, verifier: 'Gold Standard' },
  { vendor: 'TerraCarbon', creditType: 'Agroforestry GS', price: 21, volume: 45000, delivery: 'Q2 2025', qualityGuarantee: 77, verifier: 'Gold Standard' },
];

const MULTI_YEAR_PLAN = [
  { year: 2024, emissionsForecast: 515000, reductionTarget: 0.05, offsetNeed: 25750, budgetAlloc: 800000, avgPriceForecast: 18 },
  { year: 2025, emissionsForecast: 490000, reductionTarget: 0.12, offsetNeed: 58800, budgetAlloc: 2500000, avgPriceForecast: 21 },
  { year: 2026, emissionsForecast: 462000, reductionTarget: 0.20, offsetNeed: 92400, budgetAlloc: 4800000, avgPriceForecast: 25 },
  { year: 2027, emissionsForecast: 430000, reductionTarget: 0.28, offsetNeed: 120400, budgetAlloc: 7200000, avgPriceForecast: 30 },
  { year: 2028, emissionsForecast: 395000, reductionTarget: 0.36, offsetNeed: 142200, budgetAlloc: 10000000, avgPriceForecast: 38 },
  { year: 2029, emissionsForecast: 358000, reductionTarget: 0.42, offsetNeed: 150360, budgetAlloc: 12000000, avgPriceForecast: 45 },
  { year: 2030, emissionsForecast: 320000, reductionTarget: 0.46, offsetNeed: 147200, budgetAlloc: 15000000, avgPriceForecast: 55 },
];

const BLEND_SCENARIOS = [
  { name: 'Min Cost', desc: 'Lowest total procurement cost', weights: { 4: 0.25, 5: 0.25, 11: 0.20, 3: 0.15, 10: 0.10, 13: 0.05 } },
  { name: 'Max Quality', desc: 'Highest quality-weighted score', weights: { 6: 0.20, 12: 0.20, 8: 0.15, 19: 0.15, 15: 0.15, 7: 0.10, 9: 0.05 } },
  { name: 'Balanced', desc: 'Cost-quality-compliance equilibrium', weights: { 2: 0.15, 7: 0.15, 9: 0.15, 17: 0.12, 20: 0.12, 14: 0.10, 12: 0.08, 3: 0.08, 1: 0.05 } },
  { name: 'CORSIA Only', desc: 'All CORSIA-eligible credits', weights: { 1: 0.15, 2: 0.15, 3: 0.12, 7: 0.12, 8: 0.10, 9: 0.10, 11: 0.08, 14: 0.08, 17: 0.05, 18: 0.05 } },
  { name: 'Nature-Based', desc: 'Nature-based solutions only', weights: { 1: 0.15, 2: 0.15, 9: 0.15, 14: 0.12, 17: 0.12, 20: 0.12, 13: 0.10, 10: 0.09 } },
];

const JURISDICTIONS = ['CORSIA', 'EU ETS', 'CBAM', 'SBTi', 'California', 'Voluntary'];
const SDG_LABELS = ['No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education', 'Gender Equality', 'Clean Water', 'Affordable Energy', 'Decent Work', 'Industry & Innovation', 'Reduced Inequalities', 'Sustainable Cities', 'Responsible Consumption', 'Climate Action', 'Life Below Water', 'Life on Land', 'Peace & Justice', 'Partnerships'];

const TABS = [
  'Procurement Dashboard', 'Quality-Cost Frontier', 'Blend Optimizer', 'Vintage Strategy',
  'Regulatory Acceptance', 'Vendor Analysis', 'Multi-Year Strategy', 'SBTi & Net-Zero',
  'SDG Co-Benefits', 'Scenario Stress Test'
];

/* ─── style helpers ─── */
const card = { background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };
const kpiBox = { background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', flex: '1 1 0', minWidth: 150 };
const kpiVal = { fontFamily: MONO, fontSize: 20, fontWeight: 700, color: T.navy };
const kpiLbl = { fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 };
const pill = (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: ok ? T.green + '18' : T.red + '18', color: ok ? T.green : T.red });
const thS = { textAlign: 'left', padding: '8px 6px', fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}` };
const tdS = { padding: '7px 6px', fontSize: 11, borderBottom: `1px solid ${T.border}` };

/* ─── COMPONENT ─── */
function CorporateOffsetOptimizerPage() {
  /* ── all state at top ── */
  const [tab, setTab] = useState(0);
  const [budget, setBudget] = useState(15);
  const [qualityFloor, setQualityFloor] = useState(50);
  const [corsiaReq, setCorsiaReq] = useState(false);
  const [methodFilter, setMethodFilter] = useState('All');
  const [customBlend, setCustomBlend] = useState({});
  const [jurisdictionToggles, setJurisdictionToggles] = useState({ CORSIA: true, 'EU ETS': true, CBAM: true, SBTi: true, California: true, Voluntary: true });
  const [vendorWeights, setVendorWeights] = useState({ price: 30, quality: 25, reliability: 20, risk: 15, volume: 10 });
  const [priceScenario, setPriceScenario] = useState('base');
  const [sdgPriorities, setSdgPriorities] = useState([13, 15, 6, 7, 14]);
  const [carbonShock, setCarbonShock] = useState(50);
  const [mcSeed, setMcSeed] = useState(42);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [frontierBudgetCap, setFrontierBudgetCap] = useState(200);

  /* ── unique methodologies ── */
  const allMethods = useMemo(() => ['All', ...[...new Set(CREDIT_TYPES.map(c => c.method))].sort()], []);

  /* ── filtered credits ── */
  const eligible = useMemo(() => {
    let d = CREDIT_TYPES.filter(c => c.qualityScore >= qualityFloor);
    if (corsiaReq) d = d.filter(c => c.corsiaEligible);
    if (methodFilter !== 'All') d = d.filter(c => c.method === methodFilter);
    return d;
  }, [qualityFloor, corsiaReq, methodFilter]);

  /* ── auto blend (greedy efficiency) ── */
  const autoBlend = useMemo(() => {
    const sorted = [...eligible].sort((a, b) => (b.qualityScore / Math.max(0.01, b.costPerTonne)) - (a.qualityScore / Math.max(0.01, a.costPerTonne)));
    const budgetM = budget * 1e6;
    const blend = [];
    let remaining = budgetM;
    for (const c of sorted) {
      const maxT = Math.min(remaining / Math.max(0.01, c.costPerTonne), c.maxAvailable);
      if (maxT > c.minOrder) {
        const tonnes = Math.round(maxT);
        blend.push({ ...c, tonnes, spend: Math.round(tonnes * c.costPerTonne) });
        remaining -= tonnes * c.costPerTonne;
      }
      if (remaining < 100) break;
    }
    return blend;
  }, [budget, eligible]);

  const totalTonnes = useMemo(() => autoBlend.reduce((a, b) => a + b.tonnes, 0), [autoBlend]);
  const totalSpend = useMemo(() => autoBlend.reduce((a, b) => a + b.spend, 0), [autoBlend]);
  const avgQuality = useMemo(() => totalTonnes > 0 ? Math.round(autoBlend.reduce((a, b) => a + b.qualityScore * b.tonnes, 0) / totalTonnes) : 0, [autoBlend, totalTonnes]);
  const corsiaPct = useMemo(() => {
    const ct = autoBlend.filter(b => b.corsiaEligible).reduce((a, b) => a + b.tonnes, 0);
    return totalTonnes > 0 ? Math.round(ct / totalTonnes * 100) : 0;
  }, [autoBlend, totalTonnes]);

  /* ── procurement pace ── */
  const procPace = useMemo(() => {
    const ytd = PROCUREMENT_HISTORY.slice(-6).reduce((a, b) => a + b.tonnesBought, 0);
    const annual = CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030;
    return annual > 0 ? Math.round(ytd / (annual / 2) * 100) : 0;
  }, []);

  /* ── spend by methodology ── */
  const spendByMethod = useMemo(() => {
    const map = {};
    autoBlend.forEach(b => { map[b.method] = (map[b.method] || 0) + b.spend; });
    return Object.entries(map).map(([method, spend]) => ({ method: method.length > 18 ? method.slice(0, 16) + '..' : method, spend: Math.round(spend / 1e6 * 100) / 100 })).sort((a, b) => b.spend - a.spend);
  }, [autoBlend]);

  /* ── custom blend calculation ── */
  const customBlendResult = useMemo(() => {
    const totalW = Object.values(customBlend).reduce((a, b) => a + b, 0);
    if (totalW === 0) return { items: [], cost: 0, quality: 0, corsia: 0, tonnes: 0 };
    const budgetM = budget * 1e6;
    let items = [];
    let totalT = 0;
    let wqSum = 0;
    let corsiaT = 0;
    Object.entries(customBlend).forEach(([idStr, w]) => {
      const cr = CREDIT_TYPES.find(c => c.id === Number(idStr));
      if (!cr || w <= 0) return;
      const alloc = (w / Math.max(1, totalW)) * budgetM;
      const t = Math.round(alloc / Math.max(0.01, cr.costPerTonne));
      items.push({ ...cr, tonnes: t, spend: Math.round(t * cr.costPerTonne), pct: Math.round(w / Math.max(1, totalW) * 100) });
      totalT += t;
      wqSum += cr.qualityScore * t;
      if (cr.corsiaEligible) corsiaT += t;
    });
    return { items, cost: items.reduce((a, b) => a + b.spend, 0), quality: totalT > 0 ? Math.round(wqSum / totalT) : 0, corsia: totalT > 0 ? Math.round(corsiaT / totalT * 100) : 0, tonnes: totalT };
  }, [customBlend, budget]);

  /* ── scenario blend evaluator ── */
  const evalScenario = useCallback((sc) => {
    const budgetM = budget * 1e6;
    let totalT = 0, wqSum = 0, corsiaT = 0, cost = 0;
    const sdgs = new Set();
    const totalW = Object.values(sc.weights).reduce((a, b) => a + b, 0);
    Object.entries(sc.weights).forEach(([idStr, w]) => {
      const cr = CREDIT_TYPES.find(c => c.id === Number(idStr));
      if (!cr) return;
      const alloc = (w / Math.max(0.01, totalW)) * budgetM;
      const t = Math.min(Math.round(alloc / Math.max(0.01, cr.costPerTonne)), cr.maxAvailable);
      totalT += t;
      wqSum += cr.qualityScore * t;
      cost += t * cr.costPerTonne;
      if (cr.corsiaEligible) corsiaT += t;
      cr.cobenefits.forEach(s => sdgs.add(s));
    });
    return { totalT, quality: totalT > 0 ? Math.round(wqSum / totalT) : 0, corsiaPct: totalT > 0 ? Math.round(corsiaT / totalT * 100) : 0, cost: Math.round(cost), sdgCount: sdgs.size, sdgs: [...sdgs] };
  }, [budget]);

  /* ── vintage data ── */
  const vintageData = useMemo(() => [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((v, i) => ({
    vintage: v, premiumPct: Math.round((2025 - v) < 2 ? (2 - (2025 - v)) * 8 : 0), discountPct: Math.round(Math.max(0, (2025 - v - 2)) * 6),
    freshness: Math.round(Math.max(0, 100 - (2025 - v) * 12)), costOfCarry: +(sr(i * 71) * 3 + (2025 - v) * 0.8).toFixed(1),
    optimalAlloc: Math.round(v >= 2023 ? 25 + sr(i * 41) * 15 : Math.max(0, 15 - (2023 - v) * 4 + sr(i * 53) * 5))
  })), []);

  /* ── regulatory acceptance matrix ── */
  const regMatrix = useMemo(() => CREDIT_TYPES.map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + '..' : c.name,
    CORSIA: c.corsiaEligible ? 1 : 0,
    'EU ETS': c.euEtsEligible ? 1 : 0,
    CBAM: c.cbamEligible ? 1 : 0,
    SBTi: c.sbtiAccepted ? 1 : 0,
    California: c.corsiaEligible && c.qualityScore >= 70 ? 1 : (c.qualityScore >= 50 ? 0.5 : 0),
    Voluntary: 1,
    total: (c.corsiaEligible ? 1 : 0) + (c.euEtsEligible ? 1 : 0) + (c.cbamEligible ? 1 : 0) + (c.sbtiAccepted ? 1 : 0) + (c.corsiaEligible && c.qualityScore >= 70 ? 1 : (c.qualityScore >= 50 ? 0.5 : 0)) + 1,
    id: c.id
  })), []);

  /* ── vendor scoring ── */
  const vendorRanked = useMemo(() => {
    const wTotal = vendorWeights.price + vendorWeights.quality + vendorWeights.reliability + vendorWeights.risk + vendorWeights.volume;
    return VENDOR_QUOTES.map((v, i) => {
      const priceScore = Math.max(0, 100 - (v.price / 5));
      const qualScore = v.qualityGuarantee;
      const reliab = 60 + sr(i * 37) * 35;
      const riskScore = 90 - sr(i * 51) * 40;
      const volScore = Math.min(100, v.volume / 2000);
      const wtd = wTotal > 0 ? (priceScore * vendorWeights.price + qualScore * vendorWeights.quality + reliab * vendorWeights.reliability + riskScore * vendorWeights.risk + volScore * vendorWeights.volume) / wTotal : 0;
      return { ...v, priceScore: Math.round(priceScore), qualScore, reliab: Math.round(reliab), riskScore: Math.round(riskScore), volScore: Math.round(volScore), score: Math.round(wtd) };
    }).sort((a, b) => b.score - a.score);
  }, [vendorWeights]);

  /* ── multi-year with scenario ── */
  const myPlan = useMemo(() => {
    const mult = priceScenario === 'bull' ? 1.4 : priceScenario === 'bear' ? 0.7 : 1.0;
    return MULTI_YEAR_PLAN.map(p => ({
      ...p,
      priceLow: Math.round(p.avgPriceForecast * 0.7),
      priceBase: p.avgPriceForecast,
      priceHigh: Math.round(p.avgPriceForecast * 1.4),
      costScenario: Math.round(p.offsetNeed * p.avgPriceForecast * mult),
      npv: Math.round(p.offsetNeed * p.avgPriceForecast * mult / Math.pow(1.08, p.year - 2024)),
    }));
  }, [priceScenario]);

  /* ── SBTi data ── */
  const sbtiWaterfall = useMemo(() => {
    const total = CORPORATE_TARGETS.totalEmissions;
    const s1Red = Math.round(CORPORATE_TARGETS.scope1 * 0.42);
    const s2Red = Math.round(CORPORATE_TARGETS.scope2 * 0.65);
    const s3Red = Math.round(CORPORATE_TARGETS.scope3 * 0.25);
    const residual = total - s1Red - s2Red - s3Red;
    const bvcm = Math.round(residual * 0.15);
    const neutralize = Math.round(residual * 0.60);
    const gap = residual - bvcm - neutralize;
    return [
      { name: 'Total Emissions', value: total, fill: T.navy },
      { name: 'S1 Reduction', value: -s1Red, fill: T.green },
      { name: 'S2 Reduction', value: -s2Red, fill: '#059669' },
      { name: 'S3 Reduction', value: -s3Red, fill: '#10b981' },
      { name: 'Residual', value: residual, fill: T.amber },
      { name: 'BVCM Offsets', value: -bvcm, fill: T.indigo },
      { name: 'Neutralization', value: -neutralize, fill: '#6366f1' },
      { name: 'Remaining Gap', value: gap, fill: T.red },
    ];
  }, []);

  /* ── SDG coverage ── */
  const sdgCoverage = useMemo(() => {
    const counts = {};
    SDG_LABELS.forEach((_, i) => { counts[i + 1] = 0; });
    autoBlend.forEach(b => { b.cobenefits.forEach(s => { counts[s] = (counts[s] || 0) + b.tonnes; }); });
    return SDG_LABELS.map((label, i) => ({ sdg: `SDG ${i + 1}`, label, tonnes: counts[i + 1] || 0, priority: sdgPriorities.includes(i + 1) }));
  }, [autoBlend, sdgPriorities]);

  /* ── Monte Carlo paths ── */
  const mcPaths = useMemo(() => {
    const paths = [];
    for (let p = 0; p < 200; p++) {
      let price = 20;
      const path = [];
      for (let y = 0; y < 7; y++) {
        const shock = (sr(mcSeed * 1000 + p * 7 + y) - 0.5) * 2;
        price = Math.max(5, price * (1 + 0.08 + shock * 0.15));
        path.push({ year: 2024 + y, price: Math.round(price * 100) / 100 });
      }
      paths.push(path);
    }
    return paths;
  }, [mcSeed]);

  const mcStats = useMemo(() => {
    const byYear = {};
    mcPaths.forEach(path => {
      path.forEach(pt => {
        if (!byYear[pt.year]) byYear[pt.year] = [];
        byYear[pt.year].push(pt.price);
      });
    });
    return Object.entries(byYear).map(([year, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b);
      const len = sorted.length;
      return {
        year: Number(year),
        p5: +(sorted[Math.floor(len * 0.05)] || 0).toFixed(1),
        p25: +(sorted[Math.floor(len * 0.25)] || 0).toFixed(1),
        median: +(sorted[Math.floor(len * 0.5)] || 0).toFixed(1),
        p75: +(sorted[Math.floor(len * 0.75)] || 0).toFixed(1),
        p95: +(sorted[Math.floor(len * 0.95)] || 0).toFixed(1),
      };
    }).sort((a, b) => a.year - b.year);
  }, [mcPaths]);

  /* ── stress scenarios ── */
  const stressScenarios = useMemo(() => {
    const shocks = [20, 50, 100, 200, 500];
    return shocks.map(shock => {
      const annual = CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030;
      const cost = annual * shock;
      const budgetImpact = cost / Math.max(1, CORPORATE_TARGETS.offsetBudgetAnnual) * 100;
      return { shock, annualCost: cost, budgetImpact: Math.round(budgetImpact), feasible: budgetImpact <= 150 };
    });
  }, []);

  /* ── Render helper: KPI ── */
  const Kpi = useCallback(({ label, value, sub: subText, color }) => (
    <div style={kpiBox}>
      <div style={{ ...kpiVal, color: color || T.navy }}>{value}</div>
      <div style={kpiLbl}>{label}</div>
      {subText && <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{subText}</div>}
    </div>
  ), []);

  /* ═══════════════════════════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <div style={{ fontFamily: FONT, background: T.surface, minHeight: '100vh', color: T.text }}>
      {/* ── HEADER ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: MONO, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN3 :: CORPORATE OFFSET OPTIMIZER</div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Corporate Offset Procurement Strategy Optimizer</h1>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>20 Credit Types | 15 Vendors | 7-Year Horizon | Quality-Cost Frontier | Blend Optimization | Regulatory Matrix</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { l: 'Budget', v: `$${budget}M`, c: T.gold },
              { l: 'Opt Tonnes', v: totalTonnes.toLocaleString(), c: '#0891b2' },
              { l: 'Avg Quality', v: avgQuality, c: avgQuality >= 70 ? T.green : T.amber },
              { l: 'CORSIA %', v: `${corsiaPct}%`, c: corsiaPct >= 80 ? T.green : T.amber },
            ].map(m => (
              <div key={m.l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', textAlign: 'right', minWidth: 80 }}>
                <div style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{m.l}</div>
                <div style={{ color: m.c, fontSize: 17, fontWeight: 700, fontFamily: MONO }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 11,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', fontFamily: FONT
            }}>{t2}</button>
          ))}
        </div>
      </div>

      {/* ── GLOBAL CONTROLS ── */}
      <div style={{ padding: '16px 32px 0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <div><span style={{ fontSize: 10, color: T.sub }}>Budget ($M): </span>
            <input type="range" min={1} max={50} value={budget} onChange={e => setBudget(Number(e.target.value))} style={{ width: 120 }} />
            <span style={{ fontFamily: MONO, fontSize: 11, marginLeft: 4 }}>${budget}M</span></div>
          <div><span style={{ fontSize: 10, color: T.sub }}>Quality Floor: </span>
            <input type="range" min={0} max={95} value={qualityFloor} onChange={e => setQualityFloor(Number(e.target.value))} style={{ width: 120 }} />
            <span style={{ fontFamily: MONO, fontSize: 11, marginLeft: 4 }}>{qualityFloor}</span></div>
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={corsiaReq} onChange={e => setCorsiaReq(e.target.checked)} /> CORSIA Required
          </label>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11 }}>
            {allMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* ══════════════ TAB 0: PROCUREMENT DASHBOARD ══════════════ */}
        {tab === 0 && (<div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Kpi label="Annual Offset Need" value={`${Math.round(CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030 / 1000)}k tCO2`} />
            <Kpi label="Budget Remaining" value={`$${Math.max(0, budget - totalSpend / 1e6).toFixed(1)}M`} color={totalSpend < budget * 1e6 ? T.green : T.red} />
            <Kpi label="Avg Cost/Tonne" value={`$${totalTonnes > 0 ? (totalSpend / totalTonnes).toFixed(1) : '0'}`} />
            <Kpi label="Quality-Wtd Avg" value={avgQuality} color={avgQuality >= 70 ? T.green : T.amber} />
            <Kpi label="CORSIA Coverage" value={`${corsiaPct}%`} color={corsiaPct >= 80 ? T.green : T.amber} />
            <Kpi label="Procurement Pace" value={`${procPace}%`} sub="vs annual plan" color={procPace >= 90 ? T.green : procPace >= 70 ? T.amber : T.red} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Spend by Methodology ($M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={spendByMethod} dataKey="spend" nameKey="method" cx="50%" cy="50%" outerRadius={100} label={({ method, spend }) => `${method}: $${spend}M`} labelLine={{ stroke: T.sub, strokeWidth: 0.5 }}>
                    {spendByMethod.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v}M`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Monthly Procurement (24-Mo History)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={PROCUREMENT_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 8 }} interval={2} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="tonnesBought" name="Tonnes Bought" fill={T.indigo + '30'} stroke={T.indigo} strokeWidth={2} />
                  <Area type="monotone" dataKey="qualityAvg" name="Quality Avg" fill={T.green + '20'} stroke={T.green} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Target vs Actual Procurement ({autoBlend.length} credits in blend)</div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={autoBlend.slice(0, 12).map(b => ({ name: b.name.length > 14 ? b.name.slice(0, 12) + '..' : b.name, tonnes: b.tonnes, quality: b.qualityScore, cost: b.costPerTonne }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={50} />
                <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="l" dataKey="tonnes" name="Tonnes" fill={T.indigo} />
                <Line yAxisId="r" type="monotone" dataKey="quality" name="Quality" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Corporate Targets Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, fontSize: 11 }}>
              {[{ l: 'Scope 1', v: `${(CORPORATE_TARGETS.scope1 / 1000).toFixed(0)}k tCO2`, c: T.navy },
                { l: 'Scope 2', v: `${(CORPORATE_TARGETS.scope2 / 1000).toFixed(0)}k tCO2`, c: T.indigo },
                { l: 'Scope 3', v: `${(CORPORATE_TARGETS.scope3 / 1000).toFixed(0)}k tCO2`, c: T.amber },
                { l: 'Interim 2030', v: `${(CORPORATE_TARGETS.interimTarget2030 * 100).toFixed(0)}%`, c: T.green },
                { l: 'Net-Zero Year', v: CORPORATE_TARGETS.netZeroYear, c: T.gold }
              ].map(t2 => (
                <div key={t2.l} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, background: t2.c + '08', border: `1px solid ${t2.c}15` }}>
                  <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: t2.c }}>{t2.v}</div>
                  <div style={{ fontSize: 9, color: T.sub }}>{t2.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Cost/Tonne Trend (24-Mo)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={PROCUREMENT_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 7 }} interval={3} />
                  <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgPrice" name="Avg $/tCO2" stroke={T.gold} strokeWidth={2} dot={{ r: 2 }} />
                  <ReferenceLine y={totalTonnes > 0 ? Math.round(totalSpend / totalTonnes * 10) / 10 : 0} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Current Avg', fontSize: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Monthly Spend ($)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={PROCUREMENT_HISTORY.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 7 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                  <Bar dataKey="spend" name="Spend" fill={T.indigo}>
                    {PROCUREMENT_HISTORY.slice(-12).map((_, i) => <Cell key={i} fill={i >= 10 ? T.gold : T.indigo} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Eligible Credit Summary ({eligible.length} credits pass filters)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Credit', 'Method', 'Registry', 'Quality', '$/t', 'CORSIA', 'SBTi', 'Permanence', 'Geography'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{eligible.slice(0, 12).map(c => (
                <tr key={c.id}><td style={{ ...tdS, fontWeight: 600, fontSize: 10 }}>{c.name.length > 18 ? c.name.slice(0, 16) + '..' : c.name}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{c.method.length > 16 ? c.method.slice(0, 14) + '..' : c.method}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{c.registry}</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: c.qualityScore >= 80 ? T.green : c.qualityScore >= 60 ? T.amber : T.red }}>{c.qualityScore}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${c.costPerTonne}</td>
                  <td style={tdS}><span style={pill(c.corsiaEligible)}>{c.corsiaEligible ? 'Y' : 'N'}</span></td>
                  <td style={tdS}><span style={pill(c.sbtiAccepted)}>{c.sbtiAccepted ? 'Y' : 'N'}</span></td>
                  <td style={{ ...tdS, fontFamily: MONO, fontSize: 10 }}>{c.permanenceYrs >= 1000 ? '1k+' : c.permanenceYrs}yr</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{c.geography}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {/* ══════════════ TAB 1: QUALITY-COST FRONTIER ══════════════ */}
        {tab === 1 && (<div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 10, color: T.sub }}>Frontier Budget Cap ($/t): </span>
              <input type="range" min={5} max={500} value={frontierBudgetCap} onChange={e => setFrontierBudgetCap(Number(e.target.value))} style={{ width: 160 }} />
              <span style={{ fontFamily: MONO, fontSize: 11, marginLeft: 4 }}>${frontierBudgetCap}</span></div>
          </div>
          <div style={card}>
            <div style={lbl}>Quality vs Cost per tCO2 — Efficient Frontier</div>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name="Cost ($/tCO2)" tick={{ fontSize: 9 }} label={{ value: 'Cost ($/tCO2)', position: 'bottom', fontSize: 10 }} domain={[0, frontierBudgetCap]} />
                <YAxis type="number" dataKey="y" name="Quality" domain={[0, 100]} tick={{ fontSize: 9 }} label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload[0]) return null;
                  const d = payload[0].payload;
                  return (<div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontSize: 11 }}>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    <div>Quality: {d.y} | Cost: ${d.x}/t</div>
                    <div>CORSIA: {d.corsia ? 'Yes' : 'No'} | Permanence: {d.perm}yr</div>
                    <div>Method: {d.method}</div>
                  </div>);
                }} />
                <ReferenceLine y={qualityFloor} stroke={T.amber} strokeDasharray="4 4" label={{ value: `Quality Floor: ${qualityFloor}`, fontSize: 9 }} />
                <Scatter data={CREDIT_TYPES.filter(c => c.costPerTonne <= frontierBudgetCap).map(c => ({
                  x: c.costPerTonne, y: c.qualityScore, name: c.name, corsia: c.corsiaEligible, perm: c.permanenceYrs, method: c.method,
                  pareto: !CREDIT_TYPES.some(o => o.qualityScore > c.qualityScore && o.costPerTonne < c.costPerTonne)
                }))} fill={T.indigo}>
                  {CREDIT_TYPES.filter(c => c.costPerTonne <= frontierBudgetCap).map((c, i) => {
                    const isPareto = !CREDIT_TYPES.some(o => o.qualityScore > c.qualityScore && o.costPerTonne < c.costPerTonne);
                    return <Cell key={i} fill={isPareto ? T.gold : T.indigo} r={isPareto ? 8 : 5} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 6 }}>Gold dots = Pareto-optimal (no credit has both higher quality AND lower cost)</div>
          </div>
          <div style={card}>
            <div style={lbl}>Frontier Credit Details</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Credit', 'Quality', '$/tCO2', 'Method', 'Permanence', 'CORSIA', 'Pareto'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{CREDIT_TYPES.filter(c => c.costPerTonne <= frontierBudgetCap && c.qualityScore >= qualityFloor).sort((a, b) => b.qualityScore - a.qualityScore).map(c => {
                const isP = !CREDIT_TYPES.some(o => o.qualityScore > c.qualityScore && o.costPerTonne < c.costPerTonne);
                return (<tr key={c.id} onClick={() => setSelectedCredit(c.id)} style={{ ...{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }, ...(selectedCredit === c.id ? { background: T.gold + '12' } : {}) }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: c.qualityScore >= 80 ? T.green : c.qualityScore >= 60 ? T.amber : T.red }}>{c.qualityScore}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${c.costPerTonne}</td>
                  <td style={tdS}>{c.method}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{c.permanenceYrs >= 1000 ? '1000+' : c.permanenceYrs} yr</td>
                  <td style={tdS}><span style={pill(c.corsiaEligible)}>{c.corsiaEligible ? 'Yes' : 'No'}</span></td>
                  <td style={tdS}>{isP ? <span style={{ color: T.gold, fontWeight: 700 }}>PARETO</span> : '-'}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        </div>)}

        {/* ══════════════ TAB 2: BLEND OPTIMIZER ══════════════ */}
        {tab === 2 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
            {BLEND_SCENARIOS.map((sc, si) => {
              const ev = evalScenario(sc);
              return (<div key={si} style={{ ...card, border: `1px solid ${T.border}`, marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: T.navy }}>{sc.name}</div>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 8 }}>{sc.desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
                  <div>Tonnes: <b style={{ fontFamily: MONO }}>{ev.totalT.toLocaleString()}</b></div>
                  <div>Cost: <b style={{ fontFamily: MONO }}>${(ev.cost / 1e6).toFixed(2)}M</b></div>
                  <div>Quality: <b style={{ fontFamily: MONO, color: ev.quality >= 70 ? T.green : T.amber }}>{ev.quality}</b></div>
                  <div>CORSIA: <b style={{ fontFamily: MONO }}>{ev.corsiaPct}%</b></div>
                  <div>SDGs: <b style={{ fontFamily: MONO }}>{ev.sdgCount}/17</b></div>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={Object.entries(sc.weights).map(([id, w]) => ({ name: (CREDIT_TYPES.find(c => c.id === Number(id)) || {}).name || id, value: w }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={20}>
                      {Object.entries(sc.weights).map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>);
            })}
          </div>
          <div style={card}>
            <div style={lbl}>Scenario Comparison Radar</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { axis: 'Cost Efficiency', ...Object.fromEntries(BLEND_SCENARIOS.map((sc, i) => [`s${i}`, Math.round(100 - evalScenario(sc).cost / Math.max(1, budget * 1e6) * 100)])) },
                { axis: 'Quality', ...Object.fromEntries(BLEND_SCENARIOS.map((sc, i) => [`s${i}`, evalScenario(sc).quality])) },
                { axis: 'CORSIA %', ...Object.fromEntries(BLEND_SCENARIOS.map((sc, i) => [`s${i}`, evalScenario(sc).corsiaPct])) },
                { axis: 'SDG Count', ...Object.fromEntries(BLEND_SCENARIOS.map((sc, i) => [`s${i}`, Math.round(evalScenario(sc).sdgCount / 17 * 100)])) },
                { axis: 'Volume', ...Object.fromEntries(BLEND_SCENARIOS.map((sc, i) => [`s${i}`, Math.min(100, Math.round(evalScenario(sc).totalT / 200000 * 100))])) },
                { axis: 'Permanence', ...Object.fromEntries(BLEND_SCENARIOS.map((sc, i) => { const ids = Object.keys(sc.weights).map(Number); const avg = ids.length > 0 ? ids.reduce((a, id) => { const cr = CREDIT_TYPES.find(c => c.id === id); return a + (cr ? Math.min(100, cr.permanenceYrs / 100) : 0); }, 0) / ids.length : 0; return [`s${i}`, Math.round(avg)]; })) },
              ]}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 7 }} domain={[0, 100]} />
                {BLEND_SCENARIOS.map((sc, i) => (
                  <Radar key={i} name={sc.name} dataKey={`s${i}`} stroke={PAL[i]} fill={PAL[i]} fillOpacity={0.1} />
                ))}
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Custom Blend Builder (drag sliders to allocate)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {CREDIT_TYPES.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <input type="range" min={0} max={100} value={customBlend[c.id] || 0} onChange={e => setCustomBlend(prev => ({ ...prev, [c.id]: Number(e.target.value) }))} style={{ flex: 1 }} />
                  <span style={{ fontFamily: MONO, fontSize: 10, width: 30, textAlign: 'right' }}>{customBlend[c.id] || 0}</span>
                </div>
              ))}
            </div>
            {customBlendResult.items.length > 0 && (
              <div style={{ background: T.surface, borderRadius: 8, padding: 14, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, marginBottom: 8 }}>
                  <span>Total Cost: <b style={{ fontFamily: MONO }}>${(customBlendResult.cost / 1e6).toFixed(2)}M</b></span>
                  <span>Tonnes: <b style={{ fontFamily: MONO }}>{customBlendResult.tonnes.toLocaleString()}</b></span>
                  <span>Quality: <b style={{ fontFamily: MONO, color: customBlendResult.quality >= 70 ? T.green : T.amber }}>{customBlendResult.quality}</b></span>
                  <span>CORSIA: <b style={{ fontFamily: MONO }}>{customBlendResult.corsia}%</b></span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Credit', 'Alloc %', 'Tonnes', 'Spend', 'Quality'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>{customBlendResult.items.map(b => (
                    <tr key={b.id}><td style={{ ...tdS, fontWeight: 600 }}>{b.name}</td>
                      <td style={{ ...tdS, fontFamily: MONO }}>{b.pct}%</td>
                      <td style={{ ...tdS, fontFamily: MONO }}>{b.tonnes.toLocaleString()}</td>
                      <td style={{ ...tdS, fontFamily: MONO }}>${(b.spend / 1e6).toFixed(2)}M</td>
                      <td style={{ ...tdS, fontFamily: MONO, color: b.qualityScore >= 80 ? T.green : T.amber }}>{b.qualityScore}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>)}

        {/* ══════════════ TAB 3: VINTAGE STRATEGY ══════════════ */}
        {tab === 3 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Vintage Premium/Discount Curve</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={vintageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vintage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="premiumPct" name="Freshness Premium %" fill={T.green} />
                  <Bar dataKey="discountPct" name="Age Discount %" fill={T.red} />
                  <Line type="monotone" dataKey="freshness" name="Freshness Score" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Optimal Vintage Allocation (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vintageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vintage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} domain={[0, 50]} />
                  <Tooltip />
                  <Bar dataKey="optimalAlloc" name="Optimal Allocation %" fill={T.indigo}>
                    {vintageData.map((v, i) => <Cell key={i} fill={v.vintage >= 2023 ? T.indigo : T.sub + '60'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Forward vs Spot Analysis</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={vintageData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="vintage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="costOfCarry" name="Cost of Carry ($/t)" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Recommended Vintage Allocation</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Vintage', 'Freshness', 'Premium %', 'Discount %', 'Carry $/t', 'Alloc %', 'Savings Est'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{vintageData.map(v => (
                <tr key={v.vintage}><td style={tdS}>{v.vintage}</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: v.freshness >= 70 ? T.green : v.freshness >= 40 ? T.amber : T.red }}>{v.freshness}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{v.premiumPct}%</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{v.discountPct}%</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${v.costOfCarry}</td>
                  <td style={{ ...tdS, fontFamily: MONO, fontWeight: 700 }}>{v.optimalAlloc}%</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: T.green }}>${Math.round(v.discountPct * budget * 1000 * v.optimalAlloc / Math.max(1, 100)).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={card}>
            <div style={lbl}>Vintage Strategy Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[{ l: 'Optimal Vintage', v: '2023-2025', c: T.indigo },
                { l: 'Avg Cost Savings', v: `$${Math.round(vintageData.reduce((a, v) => a + v.discountPct * v.optimalAlloc, 0) / Math.max(1, 100))}k`, c: T.green },
                { l: 'CORSIA Min Vintage', v: '2016', c: T.amber },
                { l: 'Forward Premium', v: `${vintageData[vintageData.length - 1].premiumPct}%`, c: T.gold }
              ].map(k => (
                <div key={k.l} style={{ background: k.c + '10', borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${k.c}20` }}>
                  <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: k.c }}>{k.v}</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{k.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ══════════════ TAB 4: REGULATORY ACCEPTANCE ══════════════ */}
        {tab === 4 && (<div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {JURISDICTIONS.map(j => (
              <label key={j} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={jurisdictionToggles[j]} onChange={() => setJurisdictionToggles(prev => ({ ...prev, [j]: !prev[j] }))} /> {j}
              </label>
            ))}
          </div>
          <div style={card}>
            <div style={lbl}>Regulatory Acceptance Heatmap (20 Credits x {Object.values(jurisdictionToggles).filter(Boolean).length} Jurisdictions)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thS}>Credit Type</th>{JURISDICTIONS.filter(j => jurisdictionToggles[j]).map(j => <th key={j} style={{ ...thS, textAlign: 'center' }}>{j}</th>)}<th style={{ ...thS, textAlign: 'center' }}>Score</th></tr></thead>
                <tbody>{[...regMatrix].sort((a, b) => b.total - a.total).map(r => (
                  <tr key={r.id}><td style={{ ...tdS, fontWeight: 600, fontSize: 10 }}>{r.name}</td>
                    {JURISDICTIONS.filter(j => jurisdictionToggles[j]).map(j => {
                      const v = r[j];
                      const bg = v >= 1 ? T.green + '25' : v >= 0.5 ? T.amber + '20' : T.red + '12';
                      const fg = v >= 1 ? T.green : v >= 0.5 ? T.amber : T.red;
                      return <td key={j} style={{ ...tdS, textAlign: 'center', background: bg, color: fg, fontWeight: 600, fontSize: 10 }}>{v >= 1 ? 'YES' : v >= 0.5 ? 'PARTIAL' : 'NO'}</td>;
                    })}
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: MONO, fontWeight: 700, color: r.total >= 4 ? T.green : r.total >= 2 ? T.amber : T.red }}>{r.total.toFixed(1)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Acceptance Score by Credit Type</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[...regMatrix].sort((a, b) => b.total - a.total)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 6]} tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 8 }} />
                <Tooltip />
                <Bar dataKey="total" name="Acceptance Score" fill={T.indigo}>
                  {regMatrix.map((r, i) => <Cell key={i} fill={r.total >= 4 ? T.green : r.total >= 2 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={lbl}>Jurisdiction Coverage Gap Analysis</div>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={JURISDICTIONS.filter(j => jurisdictionToggles[j]).map(j => {
                const accepted = regMatrix.filter(r => r[j] >= 1).length;
                const partial = regMatrix.filter(r => r[j] >= 0.5 && r[j] < 1).length;
                return { jurisdiction: j, accepted: Math.round(accepted / Math.max(1, CREDIT_TYPES.length) * 100), partial: Math.round(partial / Math.max(1, CREDIT_TYPES.length) * 100), gap: Math.round((CREDIT_TYPES.length - accepted - partial) / Math.max(1, CREDIT_TYPES.length) * 100) };
              })}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="jurisdiction" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                <Radar name="Accepted %" dataKey="accepted" stroke={T.green} fill={T.green} fillOpacity={0.2} />
                <Radar name="Partial %" dataKey="partial" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                <Radar name="Gap %" dataKey="gap" stroke={T.red} fill={T.red} fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Compliance Risk Score per Blend (Current Portfolio)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {JURISDICTIONS.filter(j => jurisdictionToggles[j]).map(j => {
                const blendAccepted = autoBlend.filter(b => {
                  const rm = regMatrix.find(r => r.id === b.id);
                  return rm && rm[j] >= 1;
                }).reduce((a, b) => a + b.tonnes, 0);
                const coverage = totalTonnes > 0 ? Math.round(blendAccepted / totalTonnes * 100) : 0;
                return (
                  <div key={j} style={{ background: coverage >= 80 ? T.green + '10' : coverage >= 50 ? T.amber + '10' : T.red + '10', borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${coverage >= 80 ? T.green : coverage >= 50 ? T.amber : T.red}20` }}>
                    <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: coverage >= 80 ? T.green : coverage >= 50 ? T.amber : T.red }}>{coverage}%</div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{j}</div>
                    <div style={{ fontSize: 9, color: T.sub }}>Blend compliance</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>)}

        {/* ══════════════ TAB 5: VENDOR ANALYSIS ══════════════ */}
        {tab === 5 && (<div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.entries(vendorWeights).map(([k, v]) => (
              <div key={k}><span style={{ fontSize: 10, color: T.sub, textTransform: 'capitalize' }}>{k} ({v}%): </span>
                <input type="range" min={0} max={100} value={v} onChange={e => setVendorWeights(prev => ({ ...prev, [k]: Number(e.target.value) }))} style={{ width: 80 }} />
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={lbl}>Vendor Ranking (Weighted Score)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Rank', 'Vendor', 'Credit', 'Price', 'Volume', 'Quality', 'Delivery', 'Score'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{vendorRanked.map((v, i) => (
                <tr key={i} style={{ background: i < 3 ? T.gold + '08' : 'transparent' }}>
                  <td style={{ ...tdS, fontFamily: MONO, fontWeight: 700, color: i < 3 ? T.gold : T.sub }}>#{i + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{v.vendor}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{v.creditType.length > 18 ? v.creditType.slice(0, 16) + '..' : v.creditType}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${v.price}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{v.volume.toLocaleString()}</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: v.qualityGuarantee >= 80 ? T.green : T.amber }}>{v.qualityGuarantee}</td>
                  <td style={tdS}>{v.delivery}</td>
                  <td style={{ ...tdS, fontFamily: MONO, fontWeight: 700, color: v.score >= 70 ? T.green : v.score >= 50 ? T.amber : T.red }}>{v.score}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Vendor Concentration (by Volume)</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={VENDOR_QUOTES.map(v => ({ name: v.vendor, value: v.volume }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40}>
                    {VENDOR_QUOTES.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v.toLocaleString()} t`} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Price Comparison by Vendor</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={vendorRanked.slice(0, 10).map(v => ({ name: v.vendor.length > 12 ? v.vendor.slice(0, 10) + '..' : v.vendor, price: v.price, quality: v.qualityGuarantee }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar yAxisId="l" dataKey="price" name="$/tCO2" fill={T.red} />
                  <Bar yAxisId="r" dataKey="quality" name="Quality" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Vendor Delivery Timeline</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorRanked.map(v => ({ name: v.vendor.length > 10 ? v.vendor.slice(0, 8) + '..' : v.vendor, volume: v.volume, delivery: v.delivery === 'Q1 2025' ? 1 : v.delivery === 'Q2 2025' ? 2 : v.delivery === 'Q3 2025' ? 3 : v.delivery === 'Q4 2025' ? 4 : 5 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={45} />
                <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 6]} tick={{ fontSize: 9 }} tickFormatter={v => `Q${v}`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar yAxisId="l" dataKey="volume" name="Volume (t)" fill={T.indigo} />
                <Line yAxisId="r" type="step" dataKey="delivery" name="Delivery Quarter" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Counterparty Risk Radar (Top 5 Vendors)</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={[{ axis: 'Price', ...Object.fromEntries(vendorRanked.slice(0, 5).map((v, i) => [`v${i}`, v.priceScore])) },
                { axis: 'Quality', ...Object.fromEntries(vendorRanked.slice(0, 5).map((v, i) => [`v${i}`, v.qualScore])) },
                { axis: 'Reliability', ...Object.fromEntries(vendorRanked.slice(0, 5).map((v, i) => [`v${i}`, v.reliab])) },
                { axis: 'Risk', ...Object.fromEntries(vendorRanked.slice(0, 5).map((v, i) => [`v${i}`, v.riskScore])) },
                { axis: 'Volume', ...Object.fromEntries(vendorRanked.slice(0, 5).map((v, i) => [`v${i}`, v.volScore])) }]}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                {vendorRanked.slice(0, 5).map((v, i) => (
                  <Radar key={i} name={v.vendor} dataKey={`v${i}`} stroke={PAL[i]} fill={PAL[i]} fillOpacity={0.15} />
                ))}
                <Legend wrapperStyle={{ fontSize: 9 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {/* ══════════════ TAB 6: MULTI-YEAR STRATEGY ══════════════ */}
        {tab === 6 && (<div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {['bear', 'base', 'bull'].map(s => (
              <button key={s} onClick={() => setPriceScenario(s)} style={{
                padding: '6px 16px', borderRadius: 6, border: `1px solid ${priceScenario === s ? T.indigo : T.border}`,
                background: priceScenario === s ? T.indigo + '15' : T.card, color: priceScenario === s ? T.indigo : T.sub,
                cursor: 'pointer', fontSize: 11, fontWeight: priceScenario === s ? 700 : 400, textTransform: 'capitalize', fontFamily: FONT
              }}>{s} ({s === 'bear' ? '0.7x' : s === 'bull' ? '1.4x' : '1.0x'})</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Emissions, Reduction & Offset Need (2024-2030)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={myPlan}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Area type="monotone" dataKey="emissionsForecast" name="Emissions Forecast" fill={T.red + '20'} stroke={T.red} />
                  <Area type="monotone" dataKey="offsetNeed" name="Offset Need" fill={T.indigo + '30'} stroke={T.indigo} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Price Forecast with Confidence Bands</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={myPlan}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Area type="monotone" dataKey="priceHigh" name="High (1.4x)" fill={T.red + '10'} stroke={T.red} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="priceBase" name="Base" fill={T.gold + '20'} stroke={T.gold} strokeWidth={2} />
                  <Area type="monotone" dataKey="priceLow" name="Low (0.7x)" fill={T.green + '10'} stroke={T.green} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>NPV of Multi-Year Procurement ({priceScenario} scenario, 8% discount)</div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={myPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => `$${(v / 1e6).toFixed(2)}M`} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar yAxisId="l" dataKey="costScenario" name="Total Cost" fill={T.amber}>
                  {myPlan.map((_, i) => <Cell key={i} fill={T.amber} />)}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="npv" name="NPV" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Lock-In vs Spot Trade-Off</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Year', 'Offset Need', 'Price (scenario)', 'Total Cost', 'NPV', 'Lock-In Savings', 'Recommendation'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{myPlan.map(p => {
                const lockSaving = Math.round(p.costScenario * 0.08);
                return (<tr key={p.year}><td style={tdS}>{p.year}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{p.offsetNeed.toLocaleString()}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${p[priceScenario === 'bull' ? 'priceHigh' : priceScenario === 'bear' ? 'priceLow' : 'priceBase']}/t</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${(p.costScenario / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${(p.npv / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: T.green }}>${(lockSaving / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdS, fontWeight: 600, color: p.year <= 2026 ? T.green : T.amber }}>{p.year <= 2026 ? 'Lock In' : 'Spot/Blend'}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Cumulative Procurement Summary (2024-2030)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { l: 'Total Offset Need', v: `${(myPlan.reduce((a, p) => a + p.offsetNeed, 0) / 1e6).toFixed(2)}M tCO2`, c: T.indigo },
                { l: 'Total Budget', v: `$${(myPlan.reduce((a, p) => a + p.budgetAlloc, 0) / 1e6).toFixed(0)}M`, c: T.gold },
                { l: 'Total Cost (scenario)', v: `$${(myPlan.reduce((a, p) => a + p.costScenario, 0) / 1e6).toFixed(1)}M`, c: priceScenario === 'bear' ? T.green : priceScenario === 'bull' ? T.red : T.amber },
                { l: 'Total NPV', v: `$${(myPlan.reduce((a, p) => a + p.npv, 0) / 1e6).toFixed(1)}M`, c: T.navy },
              ].map(k => (
                <div key={k.l} style={{ background: k.c + '10', borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${k.c}20` }}>
                  <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: k.c }}>{k.v}</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{k.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ══════════════ TAB 7: SBTi & NET-ZERO ══════════════ */}
        {tab === 7 && (<div>
          <div style={card}>
            <div style={lbl}>SBTi Mitigation Hierarchy: Avoid > Reduce > Offset</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[{ label: 'Avoid', pct: '42%', desc: 'Scope 1 decarbonization', color: T.green },
                { label: 'Reduce', pct: '65%', desc: 'Scope 2 renewable energy', color: '#059669' },
                { label: 'Compensate', pct: '25%', desc: 'Scope 3 value chain', color: '#10b981' },
                { label: 'Neutralize', pct: 'Residual', desc: 'High-quality removals', color: T.indigo }].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.color + '12', borderRadius: 8, padding: 14, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: MONO }}>{s.pct}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Residual Emissions Waterfall (tCO2e)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sbtiWaterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `${v.toLocaleString()} tCO2e`} />
                <Bar dataKey="value" name="tCO2e">
                  {sbtiWaterfall.map((s, i) => <Cell key={i} fill={s.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Offset Quality Requirements by SBTi Pathway</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Pathway', 'Min Quality', 'Permanence', 'Additionality', 'Eligible Types'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {[{ path: 'Near-Term (2030)', q: 70, perm: '20+ yr', add: '>0.80', types: 'Removal only' },
                    { path: 'Long-Term (2050)', q: 85, perm: '100+ yr', add: '>0.90', types: 'Permanent removal' },
                    { path: 'BVCM', q: 60, perm: '10+ yr', add: '>0.70', types: 'Removal + Avoidance' },
                    { path: 'Net-Zero', q: 90, perm: '1000+ yr', add: '>0.95', types: 'Engineered removal' }].map(r => (
                    <tr key={r.path}><td style={{ ...tdS, fontWeight: 600 }}>{r.path}</td>
                      <td style={{ ...tdS, fontFamily: MONO }}>{r.q}</td>
                      <td style={tdS}>{r.perm}</td>
                      <td style={{ ...tdS, fontFamily: MONO }}>{r.add}</td>
                      <td style={{ ...tdS, fontSize: 10 }}>{r.types}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <div style={lbl}>Net-Zero Gap Analysis</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { cat: 'S1 Target', achieved: 42, gap: 58 },
                  { cat: 'S2 Target', achieved: 65, gap: 35 },
                  { cat: 'S3 Target', achieved: 25, gap: 75 },
                  { cat: 'Offset Quality', achieved: avgQuality, gap: Math.max(0, 90 - avgQuality) },
                  { cat: 'BVCM Alloc', achieved: 15, gap: 85 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cat" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="achieved" name="Achieved %" stackId="a" fill={T.green} />
                  <Bar dataKey="gap" name="Gap %" stackId="a" fill={T.red + '40'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Eligible Credits by SBTi Pathway</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { pathway: 'Near-Term', count: CREDIT_TYPES.filter(c => c.qualityScore >= 70 && c.permanenceYrs >= 20 && c.additionality >= 0.80).length, avgCost: Math.round(CREDIT_TYPES.filter(c => c.qualityScore >= 70 && c.permanenceYrs >= 20 && c.additionality >= 0.80).reduce((a, c) => a + c.costPerTonne, 0) / Math.max(1, CREDIT_TYPES.filter(c => c.qualityScore >= 70 && c.permanenceYrs >= 20 && c.additionality >= 0.80).length)) },
                { pathway: 'Long-Term', count: CREDIT_TYPES.filter(c => c.qualityScore >= 85 && c.permanenceYrs >= 100 && c.additionality >= 0.90).length, avgCost: Math.round(CREDIT_TYPES.filter(c => c.qualityScore >= 85 && c.permanenceYrs >= 100 && c.additionality >= 0.90).reduce((a, c) => a + c.costPerTonne, 0) / Math.max(1, CREDIT_TYPES.filter(c => c.qualityScore >= 85 && c.permanenceYrs >= 100 && c.additionality >= 0.90).length)) },
                { pathway: 'BVCM', count: CREDIT_TYPES.filter(c => c.qualityScore >= 60 && c.permanenceYrs >= 10 && c.additionality >= 0.70).length, avgCost: Math.round(CREDIT_TYPES.filter(c => c.qualityScore >= 60 && c.permanenceYrs >= 10 && c.additionality >= 0.70).reduce((a, c) => a + c.costPerTonne, 0) / Math.max(1, CREDIT_TYPES.filter(c => c.qualityScore >= 60 && c.permanenceYrs >= 10 && c.additionality >= 0.70).length)) },
                { pathway: 'Net-Zero', count: CREDIT_TYPES.filter(c => c.qualityScore >= 90 && c.permanenceYrs >= 1000 && c.additionality >= 0.95).length, avgCost: Math.round(CREDIT_TYPES.filter(c => c.qualityScore >= 90 && c.permanenceYrs >= 1000 && c.additionality >= 0.95).reduce((a, c) => a + c.costPerTonne, 0) / Math.max(1, CREDIT_TYPES.filter(c => c.qualityScore >= 90 && c.permanenceYrs >= 1000 && c.additionality >= 0.95).length)) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="pathway" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar yAxisId="l" dataKey="count" name="# Eligible Credits" fill={T.indigo} />
                <Bar yAxisId="r" dataKey="avgCost" name="Avg $/tCO2" fill={T.amber} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Beyond-Value-Chain Mitigation (BVCM) Allocation</div>
            <div style={{ fontSize: 11, lineHeight: 1.8, color: T.sub }}>
              SBTi Corporate Net-Zero Standard requires companies to invest in mitigation beyond their value chain. BVCM should prioritize high-quality carbon removal credits (DAC, Biochar, Mineralization, Enhanced Weathering) with quality scores above 85 and permanence exceeding 100 years. Current portfolio BVCM allocation: <b style={{ color: T.indigo, fontFamily: MONO }}>{autoBlend.filter(b => b.qualityScore >= 85).reduce((a, b) => a + b.tonnes, 0).toLocaleString()} tCO2</b> ({totalTonnes > 0 ? Math.round(autoBlend.filter(b => b.qualityScore >= 85).reduce((a, b) => a + b.tonnes, 0) / totalTonnes * 100) : 0}% of portfolio).
            </div>
          </div>
        </div>)}

        {/* ══════════════ TAB 8: SDG CO-BENEFITS ══════════════ */}
        {tab === 8 && (<div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {SDG_LABELS.map((l, i) => (
              <label key={i} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 4, background: sdgPriorities.includes(i + 1) ? T.indigo + '15' : 'transparent', border: `1px solid ${sdgPriorities.includes(i + 1) ? T.indigo : T.border}` }}>
                <input type="checkbox" checked={sdgPriorities.includes(i + 1)} onChange={() => setSdgPriorities(prev => prev.includes(i + 1) ? prev.filter(s => s !== i + 1) : [...prev, i + 1])} style={{ width: 12, height: 12 }} />
                {i + 1}. {l.length > 14 ? l.slice(0, 12) + '..' : l}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>SDG Coverage Radar (Portfolio)</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={sdgCoverage.map(s => ({ ...s, norm: Math.min(100, totalTonnes > 0 ? s.tonnes / totalTonnes * 500 : 0) }))}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="sdg" tick={{ fontSize: 8 }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                  <Radar name="Coverage" dataKey="norm" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>SDG Contribution by Credit Type</div>
              <div style={{ overflowX: 'auto', maxHeight: 320 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
                  <thead><tr><th style={{ ...thS, position: 'sticky', left: 0, background: T.card, zIndex: 1 }}>Credit</th>{SDG_LABELS.map((_, i) => <th key={i} style={{ ...thS, textAlign: 'center', width: 30 }}>{i + 1}</th>)}</tr></thead>
                  <tbody>{CREDIT_TYPES.slice(0, 15).map(c => (
                    <tr key={c.id}><td style={{ ...tdS, fontWeight: 600, position: 'sticky', left: 0, background: T.card, zIndex: 1, whiteSpace: 'nowrap' }}>{c.name.length > 16 ? c.name.slice(0, 14) + '..' : c.name}</td>
                      {SDG_LABELS.map((_, i) => {
                        const has = c.cobenefits.includes(i + 1);
                        return <td key={i} style={{ ...tdS, textAlign: 'center', background: has ? (sdgPriorities.includes(i + 1) ? T.green + '30' : T.indigo + '15') : 'transparent', fontWeight: has ? 700 : 400, color: has ? T.green : T.border }}>{has ? 'X' : ''}</td>;
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Co-Benefit Premium Analysis</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="sdgCount" name="# SDG Co-Benefits" tick={{ fontSize: 9 }} label={{ value: 'SDG Count', position: 'bottom', fontSize: 10 }} />
                <YAxis type="number" dataKey="cost" name="Cost" tick={{ fontSize: 9 }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload[0]) return null;
                  const d = payload[0].payload;
                  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 10 }}><b>{d.name}</b><br />SDGs: {d.sdgCount} | ${d.cost}/t | Q: {d.quality}</div>;
                }} />
                <Scatter data={CREDIT_TYPES.map(c => ({ name: c.name, sdgCount: c.cobenefits.length, cost: c.costPerTonne, quality: c.qualityScore }))} fill={T.indigo}>
                  {CREDIT_TYPES.map((c, i) => <Cell key={i} fill={c.cobenefits.length >= 4 ? T.gold : c.cobenefits.length >= 2 ? T.indigo : T.sub} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Priority SDG Optimized Blend</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Credits ranked by overlap with your {sdgPriorities.length} priority SDGs (selected above)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Credit', 'Quality', '$/t', 'SDG Match', 'Priority Overlap', 'Recommendation'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{[...CREDIT_TYPES].sort((a, b) => {
                const aOverlap = a.cobenefits.filter(s => sdgPriorities.includes(s)).length;
                const bOverlap = b.cobenefits.filter(s => sdgPriorities.includes(s)).length;
                return bOverlap - aOverlap;
              }).slice(0, 10).map(c => {
                const overlap = c.cobenefits.filter(s => sdgPriorities.includes(s)).length;
                return (<tr key={c.id}><td style={{ ...tdS, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{c.qualityScore}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${c.costPerTonne}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>{c.cobenefits.length}/17</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: overlap >= 3 ? T.green : overlap >= 1 ? T.amber : T.red }}>{overlap}/{sdgPriorities.length}</td>
                  <td style={{ ...tdS, fontWeight: 600, color: overlap >= 3 && c.qualityScore >= 70 ? T.green : T.amber }}>{overlap >= 3 && c.qualityScore >= 70 ? 'Strong Buy' : overlap >= 1 ? 'Consider' : 'Low Fit'}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>SDG Coverage Summary</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[...sdgCoverage].filter(s => s.tonnes > 0).sort((a, b) => b.tonnes - a.tonnes)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sdg" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `${v.toLocaleString()} tCO2`} />
                <Bar dataKey="tonnes" name="Coverage (tCO2)">
                  {[...sdgCoverage].filter(s => s.tonnes > 0).sort((a, b) => b.tonnes - a.tonnes).map((s, i) => (
                    <Cell key={i} fill={s.priority ? T.gold : T.indigo} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Gold bars = priority SDGs selected above. Total SDGs covered: {sdgCoverage.filter(s => s.tonnes > 0).length}/17</div>
          </div>
        </div>)}

        {/* ══════════════ TAB 9: SCENARIO STRESS TEST ══════════════ */}
        {tab === 9 && (<div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 10, color: T.sub }}>Carbon Price Shock ($/t): </span>
              <select value={carbonShock} onChange={e => setCarbonShock(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11 }}>
                {[20, 50, 100, 200, 500].map(s => <option key={s} value={s}>${s}/tCO2</option>)}
              </select>
            </div>
            <div><span style={{ fontSize: 10, color: T.sub }}>Monte Carlo Seed: </span>
              <input type="number" value={mcSeed} onChange={e => setMcSeed(Number(e.target.value))} style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: MONO }} />
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Carbon Price Shock Scenarios — Budget Impact</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead><tr>{['Price ($/t)', 'Annual Cost', 'Budget Impact %', 'Feasibility'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{stressScenarios.map(s => (
                <tr key={s.shock} style={{ background: s.shock === carbonShock ? T.gold + '10' : 'transparent' }}>
                  <td style={{ ...tdS, fontFamily: MONO, fontWeight: 700 }}>${s.shock}</td>
                  <td style={{ ...tdS, fontFamily: MONO }}>${(s.annualCost / 1e6).toFixed(1)}M</td>
                  <td style={{ ...tdS, fontFamily: MONO, color: s.budgetImpact <= 100 ? T.green : s.budgetImpact <= 200 ? T.amber : T.red }}>{s.budgetImpact}%</td>
                  <td style={tdS}><span style={pill(s.feasible)}>{s.feasible ? 'Feasible' : 'At Risk'}</span></td>
                </tr>
              ))}</tbody>
            </table>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stressScenarios}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="shock" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `${v}%`} />
                <ReferenceLine y={100} stroke={T.red} strokeDasharray="4 4" label={{ value: '100% Budget', fontSize: 9 }} />
                <Bar dataKey="budgetImpact" name="Budget Impact %">
                  {stressScenarios.map((s, i) => <Cell key={i} fill={s.budgetImpact <= 100 ? T.green : s.budgetImpact <= 200 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Monte Carlo Price Distribution (200 paths, seed={mcSeed})</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mcStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Area type="monotone" dataKey="p95" name="P95" fill={T.red + '15'} stroke={T.red} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="p75" name="P75" fill={T.amber + '15'} stroke={T.amber} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="median" name="Median" fill={T.indigo + '25'} stroke={T.indigo} strokeWidth={2} />
                <Area type="monotone" dataKey="p25" name="P25" fill={T.green + '15'} stroke={T.green} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="p5" name="P5" fill={T.green + '08'} stroke={T.green + '60'} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Procurement Timing Sensitivity</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { strategy: 'Buy Now', cost: Math.round(CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030 * 20 / 1e6), risk: 15 },
                  { strategy: 'Defer 1yr', cost: Math.round(CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030 * 24 / 1e6), risk: 35 },
                  { strategy: 'Defer 2yr', cost: Math.round(CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030 * 30 / 1e6), risk: 55 },
                  { strategy: 'Defer 3yr', cost: Math.round(CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030 * 38 / 1e6), risk: 75 },
                  { strategy: 'Blend', cost: Math.round(CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030 * 26 / 1e6), risk: 30 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="strategy" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar yAxisId="l" dataKey="cost" name="Est. Cost ($M)" fill={T.indigo} />
                  <Line yAxisId="r" type="monotone" dataKey="risk" name="Price Risk %" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Regulatory Change Scenarios</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Scenario', 'Impact', 'Probability', 'Cost Delta'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>{[
                  { sc: 'CORSIA Phase 2 Tightening', impact: 'High', prob: '70%', delta: '+$2.1M/yr' },
                  { sc: 'CBAM Scope Expansion', impact: 'Med', prob: '55%', delta: '+$1.4M/yr' },
                  { sc: 'EU ETS Offset Ban', impact: 'Low', prob: '30%', delta: '+$0.3M/yr' },
                  { sc: 'SBTi Removal-Only', impact: 'High', prob: '60%', delta: '+$5.8M/yr' },
                  { sc: 'Art. 6.4 Mechanism Live', impact: 'Med', prob: '45%', delta: '-$1.2M/yr' },
                  { sc: 'US Federal Carbon Price', impact: 'High', prob: '25%', delta: '+$8.5M/yr' },
                ].map(r => (
                  <tr key={r.sc}><td style={{ ...tdS, fontWeight: 600 }}>{r.sc}</td>
                    <td style={tdS}><span style={pill(r.impact === 'Low')}>{r.impact}</span></td>
                    <td style={{ ...tdS, fontFamily: MONO }}>{r.prob}</td>
                    <td style={{ ...tdS, fontFamily: MONO, color: r.delta.startsWith('+') ? T.red : T.green }}>{r.delta}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Monte Carlo 2030 Price Distribution Histogram</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const prices2030 = mcPaths.map(p => p[6] ? p[6].price : 0);
                const min = Math.floor(Math.min(...prices2030) / 10) * 10;
                const max = Math.ceil(Math.max(...prices2030) / 10) * 10;
                const buckets = [];
                for (let b = min; b < max; b += 10) {
                  buckets.push({ range: `$${b}-${b + 10}`, count: prices2030.filter(p => p >= b && p < b + 10).length });
                }
                return buckets;
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="count" name="# Simulations" fill={T.indigo}>
                  {(() => {
                    const prices2030 = mcPaths.map(p => p[6] ? p[6].price : 0);
                    const med = [...prices2030].sort((a, b) => a - b)[Math.floor(prices2030.length / 2)];
                    const min2 = Math.floor(Math.min(...prices2030) / 10) * 10;
                    const buckets2 = [];
                    for (let b = min2; b < Math.ceil(Math.max(...prices2030) / 10) * 10; b += 10) {
                      const midB = b + 5;
                      buckets2.push(midB <= med ? T.green : midB <= med * 1.5 ? T.amber : T.red);
                    }
                    return buckets2.map((c, i) => <Cell key={i} fill={c} />);
                  })()}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Green = below median, Amber = below 1.5x median, Red = above 1.5x median. Seed: {mcSeed}</div>
          </div>
          <div style={card}>
            <div style={lbl}>Cumulative Budget Exposure (Selected Shock: ${carbonShock}/t)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MULTI_YEAR_PLAN.map(p => ({
                year: p.year,
                baseline: Math.round(p.offsetNeed * p.avgPriceForecast / 1e6 * 10) / 10,
                shocked: Math.round(p.offsetNeed * carbonShock / 1e6 * 10) / 10,
                budget: Math.round(p.budgetAlloc / 1e6 * 10) / 10,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `$${v}M`} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Area type="monotone" dataKey="budget" name="Budget ($M)" fill={T.green + '20'} stroke={T.green} strokeWidth={2} />
                <Area type="monotone" dataKey="baseline" name="Baseline Cost" fill={T.indigo + '20'} stroke={T.indigo} />
                <Area type="monotone" dataKey="shocked" name={`Shocked @ $${carbonShock}/t`} fill={T.red + '20'} stroke={T.red} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Quality Floor Sensitivity (Impact on Available Supply)</div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={[20, 30, 40, 50, 60, 70, 80, 90].map(qf => {
                const elig = CREDIT_TYPES.filter(c => c.qualityScore >= qf);
                const supply = elig.reduce((a, c) => a + c.maxAvailable, 0);
                const avgC = elig.length > 0 ? Math.round(elig.reduce((a, c) => a + c.costPerTonne, 0) / elig.length) : 0;
                return { qf, credits: elig.length, supply: Math.round(supply / 1000), avgCost: avgC };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="qf" tick={{ fontSize: 10 }} label={{ value: 'Quality Floor', position: 'bottom', fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar yAxisId="l" dataKey="credits" name="# Eligible Credits" fill={T.indigo} />
                <Line yAxisId="r" type="monotone" dataKey="avgCost" name="Avg $/tCO2" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>)}

      </div>
    </div>
  );
}

export default CorporateOffsetOptimizerPage;
