import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, ReferenceLine,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e',
  teal: '#0e7490', purple: '#6d28d9', blue: '#1d4ed8', orange: '#c2410c',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── MODULE-LEVEL DATA ────────────────────────────────────────────────────────

const BEZERO_RATINGS = ['AAA','AA','A','BBB','BB','B','C','D'];
const BEZERO_COLOR = { AAA:'#065f46', AA:'#047857', A:'#059669', BBB:'#d97706', BB:'#b45309', B:'#991b1b', C:'#7f1d1d', D:'#450a0a' };
const BEZERO_PRICE_RANGE = { AAA:[18,35], AA:[14,25], A:[10,20], BBB:[7,15], BB:[4,10], B:[2,7], C:[1,4], D:[0.5,2] };

const METHODOLOGY_NAMES = ['REDD+','ARR','IFM','Cookstove','Renewable Energy','Biochar','DAC','Soil Carbon','Blue Carbon','Waste Gas','CCS','Mineralization'];

const REGISTRY_NAMES = ['Verra','Gold Standard','ACR','CAR','Puro.earth'];

const VERIFIER_NAMES = ['SCS Global','DNV','Bureau Veritas','EY Parthenon','Deloitte'];

const PROJECT_TYPES = ['Forest Conservation','Reforestation','Improved Forest Mgmt','Clean Cooking','Clean Energy','Soil Enhancement','Direct Air Capture','Blue Carbon','Waste Capture','CCS','Mineralization'];

const GEOGRAPHIES = ['Brazil','Indonesia','Kenya','India','USA','EU','Australia','China','Colombia','Peru','Norway','Mexico'];

// 40 credits with full field set
const CREDITS = Array.from({ length: 40 }, (_, i) => {
  const seed = i * 37 + 1000;
  const methIdx = Math.floor(sr(seed + 1) * METHODOLOGY_NAMES.length);
  const regIdx  = Math.floor(sr(seed + 2) * REGISTRY_NAMES.length);
  const verIdx  = Math.floor(sr(seed + 3) * VERIFIER_NAMES.length);
  const geoIdx  = Math.floor(sr(seed + 4) * GEOGRAPHIES.length);
  const ptIdx   = Math.floor(sr(seed + 5) * PROJECT_TYPES.length);
  const method  = METHODOLOGY_NAMES[methIdx];
  const registry = REGISTRY_NAMES[regIdx];
  const verifier = VERIFIER_NAMES[verIdx];

  // base price by method archetype
  const methodBase = {
    'REDD+': 11 + sr(seed+6)*6,
    'ARR': 13 + sr(seed+6)*8,
    'IFM': 9 + sr(seed+6)*5,
    'Cookstove': 6 + sr(seed+6)*6,
    'Renewable Energy': 2 + sr(seed+6)*4,
    'Biochar': 70 + sr(seed+6)*40,
    'DAC': 400 + sr(seed+6)*250,
    'Soil Carbon': 15 + sr(seed+6)*12,
    'Blue Carbon': 22 + sr(seed+6)*18,
    'Waste Gas': 4 + sr(seed+6)*5,
    'CCS': 100 + sr(seed+6)*60,
    'Mineralization': 80 + sr(seed+6)*50,
  }[method] || 10 + sr(seed+6)*10;

  const vintage    = 2010 + Math.floor(sr(seed+7) * 15);
  const permanence = method === 'Renewable Energy' || method === 'Cookstove' ? 100
    : method === 'DAC' || method === 'Mineralization' || method === 'CCS' ? 95 + Math.floor(sr(seed+8)*5)
    : method === 'REDD+' || method === 'IFM' ? 20 + Math.floor(sr(seed+8)*30)
    : method === 'ARR' ? 30 + Math.floor(sr(seed+8)*40)
    : method === 'Blue Carbon' ? 40 + Math.floor(sr(seed+8)*30)
    : method === 'Soil Carbon' ? 10 + Math.floor(sr(seed+8)*20)
    : method === 'Biochar' ? 90 + Math.floor(sr(seed+8)*8)
    : 20 + Math.floor(sr(seed+8)*50);

  const liquidity   = 0.05 + sr(seed+9) * 0.90;
  const additionality = 0.5 + sr(seed+10) * 0.5;
  const qualityScore  = Math.round(30 + sr(seed+11) * 70);
  const sylveraScore  = Math.round(20 + sr(seed+12) * 80);
  const bezeroRating  = BEZERO_RATINGS[Math.min(7, Math.floor((1 - qualityScore/100) * 8))];
  const bidAsk        = 0.02 + sr(seed+13) * 0.18;
  const dailyVolume   = Math.round(500 + sr(seed+14) * 50000);
  const bufferPct     = method === 'REDD+' || method === 'IFM' ? 10 + sr(seed+15)*15
    : method === 'ARR' || method === 'Blue Carbon' ? 8 + sr(seed+15)*12
    : 3 + sr(seed+15)*7;
  const corsiaEligible = ['REDD+','ARR','IFM','Renewable Energy','Cookstove'].includes(method) && qualityScore >= 50;
  const sbtiAccepted   = ['ARR','Blue Carbon','Biochar','DAC','Mineralization','CCS','Soil Carbon'].includes(method) && qualityScore >= 60;
  const cbamEligible   = ['DAC','CCS','Mineralization','Biochar'].includes(method);
  const sdgCount       = 2 + Math.floor(sr(seed+16) * 7);
  const cobenefits     = Array.from({ length: sdgCount }, (_, j) => 1 + Math.floor(sr(seed+17+j) * 17));
  const scope          = method === 'DAC' || method === 'CCS' || method === 'Mineralization' ? 'Removal' : 'Avoidance';

  // vintage premium/discount factor: newer = higher price, older = discount
  const vintageAdj  = 1 + (vintage - 2017) * 0.04;
  const permFactor  = 0.75 + (permanence / 100) * 0.50;
  const liqFactor   = 0.88 + liquidity * 0.24;
  const regPrem     = { 'Verra':1.0, 'Gold Standard':1.18, 'ACR':0.96, 'CAR':0.93, 'Puro.earth':1.22 }[registry] || 1;
  const verPrem     = { 'SCS Global':1.0, 'DNV':1.12, 'Bureau Veritas':1.08, 'EY Parthenon':1.15, 'Deloitte':1.10 }[verifier] || 1;
  const qualAdj     = 0.7 + (qualityScore / 100) * 0.6;
  const price       = Math.round(methodBase * vintageAdj * permFactor * liqFactor * regPrem * verPrem * qualAdj * 100) / 100;

  const names = [
    'Amazon Basin REDD+','Borneo Forest Shield','Congo Basin Conservation','Cerrado Reforestation',
    'Pacific ARR Initiative','Atlantic Reforestation Belt','Himalayan Watershed Restore','Sahel Agroforestry',
    'East Africa IFM','Canadian Boreal IFM','Patagonia Forest Guard','Nordic Carbon Sink',
    'Kenya Clean Cookstove','Bangladesh Efficient Stoves','India Biogas Programme','Ghana Rural Stoves',
    'Rajasthan Solar Farm','Gansu Wind Complex','Mekong Hydro Green','Caucasus Micro-Hydro',
    'Oregon Coast Biochar','Midwest Ag Biochar','Carpathian Biochar Hub','Nordic Biochar Scale',
    'Climeworks Orca DAC','Carbon Engineering DAC','Verdox DAC Array','CarbFix Iceland DAC',
    'Iowa Soil Sequestration','UK Regenerative Ag','Rhine Delta Soil','Pampas Soil Carbon',
    'Sundarbans Blue Carbon','Great Barrier Seagrass','Mississippi Delta Wetland','Mekong Mangrove',
    'Appalachian Landfill Gas','Texas Landfill Recovery','Northern Lights CCS','Sleipner CCS Legacy'
  ];

  return {
    id: i + 1,
    name: names[i] || `Credit #${i+1}`,
    method, registry, verifier, vintage, permanence, liquidity, additionality,
    qualityScore, sylveraScore, bezeroRating, bidAsk, dailyVolume, bufferPct,
    corsiaEligible, sbtiAccepted, cbamEligible, cobenefits, scope,
    geography: GEOGRAPHIES[geoIdx], projectType: PROJECT_TYPES[ptIdx],
    price: Math.max(1, price),
    basePrice: Math.round(methodBase * 100) / 100,
  };
});

const METHODOLOGIES = METHODOLOGY_NAMES.map((name, mi) => {
  const seed = mi * 53 + 2000;
  const credits = CREDITS.filter(c => c.method === name);
  const prices = credits.map(c => c.price);
  const avgPrice = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
  return {
    name,
    avgPrice: Math.round(avgPrice * 100)/100,
    priceMin: prices.length ? Math.round(Math.min(...prices)*100)/100 : 0,
    priceMax: prices.length ? Math.round(Math.max(...prices)*100)/100 : 0,
    additionality: Math.round((0.5 + sr(seed+1)*0.5)*100)/100,
    permanence: Math.round((0.3 + sr(seed+2)*0.7)*100)/100,
    cobenefits: Math.round((0.3 + sr(seed+3)*0.7)*100)/100,
    mrv: Math.round((0.4 + sr(seed+4)*0.6)*100)/100,
    scalability: Math.round((0.2 + sr(seed+5)*0.8)*100)/100,
    registries: REGISTRY_NAMES.filter((_,ri) => sr(seed+6+ri) > 0.4),
    count: credits.length,
  };
});

const REGISTRIES = REGISTRY_NAMES.map((name, ri) => {
  const seed = ri * 61 + 3000;
  const credits = CREDITS.filter(c => c.registry === name);
  const prices  = credits.map(c => c.price);
  const avgPrice = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
  return {
    name,
    avgPrice: Math.round(avgPrice*100)/100,
    totalIssuance: Math.round(50 + sr(seed+1)*450),   // Mt CO2
    totalRetirements: Math.round(20 + sr(seed+2)*200),
    marketShare: Math.round((0.05 + sr(seed+3)*0.45)*100)/100,
    verifiers: VERIFIER_NAMES.filter((_,vi) => sr(seed+4+vi) > 0.45),
    count: credits.length,
  };
});

// Vintage premiums by methodology for years 2010-2024
const VINTAGE_PREMIUMS = (() => {
  const result = {};
  for (let yr = 2010; yr <= 2024; yr++) {
    result[yr] = {};
    METHODOLOGY_NAMES.forEach((m, mi) => {
      const decay = (yr - 2010) / 14;      // 0→1 over range
      const halfLife = 3 + mi * 0.7;       // different half-lives by method
      result[yr][m] = Math.round((0.4 + decay * 0.8 - Math.exp(-(yr - 2010)/halfLife) * 0.3) * 100) / 100;
    });
  }
  return result;
})();

const FORWARD_CURVE = Array.from({ length: 7 }, (_, i) => {
  const yr = 2024 + i;
  const seed = i * 79 + 4000;
  return {
    year: yr,
    redd:  Math.round((12 + i*1.8 + sr(seed+1)*3)*100)/100,
    arr:   Math.round((14 + i*2.2 + sr(seed+2)*3)*100)/100,
    dac:   Math.round((420 + i*18 + sr(seed+3)*30)*100)/100,
    biochar: Math.round((78 + i*5 + sr(seed+4)*8)*100)/100,
    soil:  Math.round((16 + i*1.5 + sr(seed+5)*2)*100)/100,
    renewable: Math.round((2.8 + i*0.4 + sr(seed+6)*0.5)*100)/100,
  };
});

const BACKTEST_RETURNS = Array.from({ length: 24 }, (_, i) => {
  const seed = i * 83 + 5000;
  const spot    = 10 + i*0.6 + sr(seed+1)*4 - 2;
  const forward = spot + 0.5 + sr(seed+2)*2;
  return {
    month: `M-${24-i}`,
    spot:    Math.round(spot*100)/100,
    forward: Math.round(forward*100)/100,
    basis:   Math.round((forward-spot)*100)/100,
  };
}).reverse();

const CORSIA_PHASES = {
  'Phase 1 (2021-2023)': { eligible: ['REDD+','ARR','IFM','Renewable Energy','Cookstove','Waste Gas'], uplift: 0.08 },
  'Phase 2 (2024-2026)': { eligible: ['REDD+','ARR','IFM','Blue Carbon','Soil Carbon','Cookstove'], uplift: 0.12 },
  'Phase 3 (2027+)':     { eligible: ['REDD+','ARR','IFM','Blue Carbon','Soil Carbon','Biochar','CCS'], uplift: 0.18 },
};

const DAILY_VOLUME = Array.from({ length: 30 }, (_, i) => {
  const seed = i * 41 + 6000;
  return {
    day: `D-${30-i}`,
    redd:      Math.round(1000 + sr(seed+1)*8000),
    arr:       Math.round(500  + sr(seed+2)*4000),
    dac:       Math.round(100  + sr(seed+3)*1000),
    biochar:   Math.round(200  + sr(seed+4)*2000),
    soil:      Math.round(300  + sr(seed+5)*3000),
    renewable: Math.round(2000 + sr(seed+6)*10000),
  };
}).reverse();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const card  = { background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl   = { fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 };
const kpiBox = (col = T.navy) => ({
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px',
  borderTop: `3px solid ${col}`, minWidth: 130,
});

const fmtPrice = v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct   = v => `${(v*100).toFixed(1)}%`;

const TABS = [
  'Pricing Dashboard',
  'Vintage Premium Curve',
  'Methodology Matrix',
  'Registry & Verification',
  'Permanence & Buffer',
  'Market Liquidity',
  'BeZero / Sylvera Ratings',
  'Forward Curve & Derivatives',
  'CORSIA & Compliance',
  'Attribution Engine',
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CarbonCreditPricingPage() {
  // ── All hooks declared first, unconditionally ──
  const [tab, setTab]                   = useState(0);
  const [methodFilter, setMethodFilter] = useState([]);
  const [regFilter, setRegFilter]       = useState([]);
  const [investmentGrade, setInvestmentGrade] = useState(false);
  const [corsiaOnly, setCorsiaOnly]     = useState(false);
  const [qualityMin, setQualityMin]     = useState(0);
  const [permMin, setPermMin]           = useState(0);
  const [vintageRange, setVintageRange] = useState([2010, 2024]);
  const [scenarioPrice, setScenarioPrice] = useState(50);
  const [fwdHorizon, setFwdHorizon]     = useState(5);
  const [insuranceSlider, setInsuranceSlider] = useState(0.02);
  const [volumeSlider, setVolumeSlider] = useState(5000);

  // Attribution sliders (basis + premium components in $/tCO2)
  const [attrBase,        setAttrBase]        = useState(10);
  const [attrAdditionality, setAttrAdditionality] = useState(3);
  const [attrVintage,     setAttrVintage]     = useState(2);
  const [attrCobenefits,  setAttrCobenefits]  = useState(1.5);
  const [attrRegistry,    setAttrRegistry]    = useState(1);
  const [attrVerification,setAttrVerification]= useState(0.8);
  const [attrLiqDiscount, setAttrLiqDiscount] = useState(-0.5);
  const [attrPermanence,  setAttrPermanence]  = useState(2.5);

  // ── Derived / memoized ──
  const filtered = useMemo(() => {
    return CREDITS.filter(c => {
      if (methodFilter.length && !methodFilter.includes(c.method)) return false;
      if (regFilter.length && !regFilter.includes(c.registry)) return false;
      if (investmentGrade && !['AAA','AA','A','BBB'].includes(c.bezeroRating)) return false;
      if (corsiaOnly && !c.corsiaEligible) return false;
      if (c.qualityScore < qualityMin) return false;
      if (c.permanence < permMin) return false;
      if (c.vintage < vintageRange[0] || c.vintage > vintageRange[1]) return false;
      return true;
    });
  }, [methodFilter, regFilter, investmentGrade, corsiaOnly, qualityMin, permMin, vintageRange]);

  const avgPrice     = useMemo(() => filtered.length ? filtered.reduce((a,c)=>a+c.price,0)/filtered.length : 0, [filtered]);
  const weightedAvg  = useMemo(() => {
    const totalVol = filtered.reduce((a,c)=>a+c.dailyVolume,0);
    return totalVol ? filtered.reduce((a,c)=>a+c.price*c.dailyVolume,0)/totalVol : 0;
  }, [filtered]);
  const premiumSpread = useMemo(() => {
    if (!filtered.length) return 0;
    const hi = Math.max(...filtered.map(c=>c.price));
    const lo = Math.min(...filtered.map(c=>c.price));
    return hi - lo;
  }, [filtered]);
  const avgLiquidity  = useMemo(() => filtered.length ? filtered.reduce((a,c)=>a+c.liquidity,0)/filtered.length : 0, [filtered]);
  const avgBidAsk     = useMemo(() => filtered.length ? filtered.reduce((a,c)=>a+c.bidAsk,0)/filtered.length : 0, [filtered]);

  const top15ByPrice  = useMemo(() => [...filtered].sort((a,b)=>b.price-a.price).slice(0,15), [filtered]);

  const methodAvgs    = useMemo(() => METHODOLOGIES.map(m => {
    const mc = filtered.filter(c=>c.method===m.name);
    const prices = mc.map(c=>c.price);
    return {
      ...m,
      filteredAvg: prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length*100)/100 : 0,
      filteredCount: prices.length,
    };
  }).filter(m=>m.filteredCount>0), [filtered]);

  const registryStats = useMemo(() => REGISTRIES.map(r => {
    const rc = filtered.filter(c=>c.registry===r.name);
    const prices = rc.map(c=>c.price);
    return {
      ...r,
      filteredAvg: prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length*100)/100 : 0,
      filteredCount: prices.length,
    };
  }), [filtered]);

  const verifierStats = useMemo(() => VERIFIER_NAMES.map((v,vi) => {
    const vc = filtered.filter(c=>c.verifier===v);
    const prices = vc.map(c=>c.price);
    const avgP = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
    const verCost = 0.3 + sr(vi*47+100)*1.2;
    return {
      name: v,
      avgPrice: Math.round(avgP*100)/100,
      count: vc.length,
      marketShare: Math.round((0.1+sr(vi*47+101)*0.35)*100)/100,
      verifCost: Math.round(verCost*100)/100,
      costRatio: avgP > 0 ? Math.round(verCost/avgP*1000)/1000 : 0,
    };
  }), [filtered]);

  const vintageChartData = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const yr = 2010 + i;
      const yc = filtered.filter(c=>c.vintage===yr);
      const prices = yc.map(c=>c.price);
      const avgP = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
      const premiums = METHODOLOGY_NAMES.slice(0,5).reduce((acc,m) => {
        acc[m] = VINTAGE_PREMIUMS[yr][m];
        return acc;
      }, {});
      return { year: yr, avgPrice: Math.round(avgP*100)/100, count: yc.length, ...premiums };
    });
  }, [filtered]);

  const scatterData   = useMemo(() => filtered.map(c => ({
    x: c.qualityScore, y: c.price, z: c.dailyVolume/1000, name: c.name, method: c.method
  })), [filtered]);

  const ratingsData   = useMemo(() => filtered.map(c => ({
    x: c.sylveraScore, y: c.price, rating: c.bezeroRating, name: c.name
  })), [filtered]);

  const ratingMigration = useMemo(() => {
    const matrix = BEZERO_RATINGS.map(from => {
      const row = { from };
      BEZERO_RATINGS.forEach(to => {
        const seed = BEZERO_RATINGS.indexOf(from)*100 + BEZERO_RATINGS.indexOf(to)*10 + 7000;
        row[to] = from === to
          ? Math.round((0.6 + sr(seed)*0.3)*100)
          : Math.round(sr(seed)*8);
      });
      return row;
    });
    return matrix;
  }, []);

  const permanenceChart = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const perm = 5 + i*5;
    const base = 12;
    const premium = base * (0.6 + Math.log(perm+1)/Math.log(105)*0.7);
    const bufferCost = base * (perm < 30 ? 0.15 : perm < 60 ? 0.10 : 0.06);
    const insuranceCost = premium * insuranceSlider;
    return {
      permanence: perm,
      premium: Math.round(premium*100)/100,
      bufferCost: Math.round(bufferCost*100)/100,
      insuranceCost: Math.round(insuranceCost*100)/100,
      netPrice: Math.round((premium - bufferCost + insuranceCost)*100)/100,
    };
  }), [insuranceSlider]);

  const liquidityData = useMemo(() => filtered.map(c => ({
    name: c.name.substring(0,20),
    bidAsk: Math.round(c.bidAsk*100*100)/100,
    volume: c.dailyVolume,
    liquidity: Math.round(c.liquidity*100),
  })).sort((a,b)=>b.volume-a.volume).slice(0,15), [filtered]);

  const corsiaData = useMemo(() => filtered.map(c => {
    const phase1 = CORSIA_PHASES['Phase 1 (2021-2023)'].eligible.includes(c.method) && c.qualityScore >= 50;
    const phase2 = CORSIA_PHASES['Phase 2 (2024-2026)'].eligible.includes(c.method) && c.qualityScore >= 55;
    const phase3 = CORSIA_PHASES['Phase 3 (2027+)'].eligible.includes(c.method) && c.qualityScore >= 60;
    const uplift  = phase3 ? 0.18 : phase2 ? 0.12 : phase1 ? 0.08 : 0;
    return {
      ...c,
      phase1, phase2, phase3,
      compliancePrice: Math.round(c.price*(1+uplift)*100)/100,
      upliftPct: Math.round(uplift*100),
    };
  }), [filtered]);

  const fwdCurveSlice = useMemo(() => FORWARD_CURVE.slice(0, fwdHorizon), [fwdHorizon]);

  const attrTotal = attrBase + attrAdditionality + attrVintage + attrCobenefits + attrRegistry + attrVerification + attrLiqDiscount + attrPermanence;
  const attrWaterfall = [
    { name: 'Base Cost',           value: attrBase,           cum: attrBase, color: T.navy },
    { name: 'Additionality Prem',  value: attrAdditionality,  cum: attrBase + attrAdditionality, color: T.green },
    { name: 'Vintage Premium',     value: attrVintage,        cum: attrBase + attrAdditionality + attrVintage, color: T.teal },
    { name: 'Co-benefit Premium',  value: attrCobenefits,     cum: attrBase + attrAdditionality + attrVintage + attrCobenefits, color: T.indigo },
    { name: 'Registry Premium',    value: attrRegistry,       cum: attrBase + attrAdditionality + attrVintage + attrCobenefits + attrRegistry, color: T.purple },
    { name: 'Verification Prem',   value: attrVerification,   cum: attrBase + attrAdditionality + attrVintage + attrCobenefits + attrRegistry + attrVerification, color: T.amber },
    { name: 'Liquidity Discount',  value: attrLiqDiscount,    cum: attrBase + attrAdditionality + attrVintage + attrCobenefits + attrRegistry + attrVerification + attrLiqDiscount, color: T.red },
    { name: 'Permanence Prem',     value: attrPermanence,     cum: attrTotal, color: T.gold },
    { name: 'Total Price',         value: attrTotal,          cum: attrTotal, color: T.navy, total: true },
  ];

  const toggleMethod  = useCallback(m => setMethodFilter(prev => prev.includes(m) ? prev.filter(x=>x!==m) : [...prev,m]), []);
  const toggleReg     = useCallback(r => setRegFilter(prev => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev,r]), []);

  // ─── RENDER ──────────────────────────────────────────────────────────────

  const scenarioMultiplier = scenarioPrice / 50;

  return (
    <div style={{ fontFamily: T.font, background: T.surface, minHeight: '100vh', color: T.text }}>
      {/* ── Header ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>
              EP-CN1 · CARBON CREDIT PRICING ENGINE
            </div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Carbon Credit Pricing Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              40 Credits · 12 Methodologies · 5 Registries · BeZero / Sylvera · CORSIA · Forward Curve · Attribution
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Avg Price',     val: fmtPrice(avgPrice),    col: T.gold },
              { label: 'Wtd Avg',       val: fmtPrice(weightedAvg), col: '#60a5fa' },
              { label: 'Credits (filt)',val: filtered.length,       col: '#34d399' },
              { label: 'Avg Liquidity', val: fmtPct(avgLiquidity),  col: '#f59e0b' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 16, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 15px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 11,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            }}>{t2}</button>
          ))}
        </div>
      </div>

      {/* ── Global Filters ── */}
      <div style={{ background: '#f1f0ec', padding: '12px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Filters</span>
        {/* Methodology toggles */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {METHODOLOGY_NAMES.map(m => (
            <button key={m} onClick={() => toggleMethod(m)} style={{
              padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
              background: methodFilter.includes(m) ? T.navy : T.card,
              color: methodFilter.includes(m) ? '#fff' : T.sub,
              border: `1px solid ${methodFilter.includes(m) ? T.navy : T.border}`,
            }}>{m}</button>
          ))}
        </div>
        {/* Registry toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          {REGISTRY_NAMES.map(r => (
            <button key={r} onClick={() => toggleReg(r)} style={{
              padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
              background: regFilter.includes(r) ? T.indigo : T.card,
              color: regFilter.includes(r) ? '#fff' : T.sub,
              border: `1px solid ${regFilter.includes(r) ? T.indigo : T.border}`,
            }}>{r}</button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={investmentGrade} onChange={e=>setInvestmentGrade(e.target.checked)} />
          Investment Grade (BBB+)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={corsiaOnly} onChange={e=>setCorsiaOnly(e.target.checked)} />
          CORSIA Eligible
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          Quality &ge;
          <input type="range" min={0} max={90} value={qualityMin} onChange={e=>setQualityMin(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ fontFamily: T.mono, fontSize: 11 }}>{qualityMin}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          Perm &ge;
          <input type="range" min={0} max={95} step={5} value={permMin} onChange={e=>setPermMin(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ fontFamily: T.mono, fontSize: 11 }}>{permMin}yr</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          Vintage: <span style={{ fontFamily: T.mono }}>{vintageRange[0]}–{vintageRange[1]}</span>
          <input type="range" min={2010} max={vintageRange[1]} value={vintageRange[0]} onChange={e=>setVintageRange([Number(e.target.value),vintageRange[1]])} style={{ width: 70 }} />
          <input type="range" min={vintageRange[0]} max={2024} value={vintageRange[1]} onChange={e=>setVintageRange([vintageRange[0],Number(e.target.value)])} style={{ width: 70 }} />
        </div>
        {methodFilter.length > 0 || regFilter.length > 0 ? (
          <button onClick={() => { setMethodFilter([]); setRegFilter([]); }} style={{ padding: '3px 10px', fontSize: 10, borderRadius: 4, cursor: 'pointer', background: T.red, color: '#fff', border: 'none' }}>Clear All</button>
        ) : null}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: '24px 32px 48px' }}>

        {/* ── TAB 0: PRICING DASHBOARD ── */}
        {tab === 0 && (
          <div>
            {/* KPI Row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Avg Price ($/tCO2)',     val: fmtPrice(avgPrice),          col: T.navy },
                { label: 'Volume-Wtd Avg',          val: fmtPrice(weightedAvg),        col: T.indigo },
                { label: 'Premium Spread',          val: fmtPrice(premiumSpread),      col: T.gold },
                { label: 'Avg Liquidity Score',     val: fmtPct(avgLiquidity),         col: T.green },
                { label: 'Avg Bid-Ask Spread',      val: fmtPct(avgBidAsk),            col: T.amber },
              ].map(k => (
                <div key={k.label} style={kpiBox(k.col)}>
                  <div style={lbl}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color: k.col }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Scatter: Quality vs Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Quality Score vs. Price ($/tCO2)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="x" name="Quality Score" tick={{ fontSize: 10 }} label={{ value: 'Quality Score', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis dataKey="y" name="Price" tick={{ fontSize: 10 }} />
                    <ZAxis dataKey="z" range={[30, 300]} name="Daily Volume (000)" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 10, fontSize: 11, borderRadius: 6 }}>
                          <div style={{ fontWeight: 700 }}>{d.name}</div>
                          <div>Quality: {d.x} | Price: {fmtPrice(d.y)}</div>
                          <div style={{ color: T.sub }}>{d.method}</div>
                        </div>
                      );
                    }} />
                    <Scatter data={scatterData} name="Credits">
                      {scatterData.map((d, i) => (
                        <Cell key={i} fill={
                          d.method === 'DAC' ? T.purple :
                          d.method === 'CCS' ? T.indigo :
                          d.method === 'Biochar' ? T.amber :
                          d.method === 'Blue Carbon' ? T.teal :
                          d.method === 'REDD+' ? T.green :
                          T.navy
                        } />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Bar: Top 15 by price */}
              <div style={card}>
                <div style={lbl}>Top 15 Credits by Price ($/tCO2)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top15ByPrice} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 8 }} />
                    <Tooltip formatter={v => fmtPrice(v)} />
                    <Bar dataKey="price" name="Price" radius={[0,4,4,0]}>
                      {top15ByPrice.map((d, i) => (
                        <Cell key={i} fill={d.price > 200 ? T.purple : d.price > 50 ? T.indigo : d.price > 20 ? T.teal : d.price > 10 ? T.green : T.navy} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Full credit table */}
            <div style={card}>
              <div style={lbl}>All Credits — Full Pricing Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Name','Method','Registry','Vintage','Quality','BeZero','Price','Bid-Ask','Liquidity','CORSIA'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.sub, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0,20).map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px', fontWeight: 600, fontSize: 10 }}>{c.name}</td>
                        <td style={{ padding: '6px', fontSize: 10 }}>{c.method}</td>
                        <td style={{ padding: '6px', fontSize: 10 }}>{c.registry}</td>
                        <td style={{ padding: '6px', fontFamily: T.mono, fontSize: 10 }}>{c.vintage}</td>
                        <td style={{ padding: '6px' }}>
                          <div style={{ width: 40, height: 6, borderRadius: 3, background: '#e2e0d8' }}>
                            <div style={{ width: `${c.qualityScore}%`, height: '100%', borderRadius: 3, background: c.qualityScore > 70 ? T.green : c.qualityScore > 40 ? T.amber : T.red }} />
                          </div>
                          <span style={{ fontSize: 9, color: T.sub }}>{c.qualityScore}</span>
                        </td>
                        <td style={{ padding: '6px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: BEZERO_COLOR[c.bezeroRating] || T.sub }}>{c.bezeroRating}</span>
                        </td>
                        <td style={{ padding: '6px', fontFamily: T.mono, fontWeight: 700, color: c.price > 100 ? T.purple : c.price > 20 ? T.indigo : T.navy }}>{fmtPrice(c.price)}</td>
                        <td style={{ padding: '6px', fontFamily: T.mono, fontSize: 10 }}>{fmtPct(c.bidAsk)}</td>
                        <td style={{ padding: '6px', fontFamily: T.mono, fontSize: 10 }}>{Math.round(c.liquidity*100)}%</td>
                        <td style={{ padding: '6px' }}>
                          {c.corsiaEligible ? <span style={{ color: T.green, fontWeight: 700, fontSize: 10 }}>YES</span> : <span style={{ color: T.sub, fontSize: 10 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > 20 && <div style={{ fontSize: 11, color: T.sub, padding: '8px 0' }}>Showing 20 of {filtered.length} credits. Apply filters to narrow.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: VINTAGE PREMIUM CURVE ── */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Vintage Premium Curve — Average Price by Year</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={vintageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => typeof v === 'number' ? fmtPrice(v) : v} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="avgPrice" name="Avg Price" fill={T.navy+'22'} stroke={T.navy} strokeWidth={2} />
                    <ReferenceLine y={avgPrice} stroke={T.gold} strokeDasharray="4 2" label={{ value: 'Portfolio Avg', fontSize: 9, fill: T.gold }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Vintage Premium Multiplier by Methodology (5 Methods Shown)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={vintageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0,2.5]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => typeof v === 'number' ? `${v.toFixed(2)}x` : v} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {['REDD+','ARR','Biochar','Blue Carbon','DAC'].map((m, i) => (
                      <Line key={m} type="monotone" dataKey={m} dot={false} strokeWidth={1.5}
                        stroke={[T.green, T.teal, T.amber, T.indigo, T.purple][i]} />
                    ))}
                    <ReferenceLine y={1.0} stroke={T.border} strokeDasharray="3 3" label={{ value: 'Par', fontSize: 9 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Vintage Decay Model — Half-Life Analysis</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {METHODOLOGY_NAMES.map((m, mi) => {
                  const halfLife = 3 + mi * 0.7;
                  const premiums2024 = VINTAGE_PREMIUMS[2024][m];
                  const premiums2010 = VINTAGE_PREMIUMS[2010][m];
                  const decay = premiums2024 - premiums2010;
                  return (
                    <div key={m} style={{ minWidth: 150, padding: '10px 12px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{m}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>Half-life: <span style={{ fontFamily: T.mono, color: T.text }}>{halfLife.toFixed(1)}yr</span></div>
                      <div style={{ fontSize: 10, color: T.sub }}>2010 mult: <span style={{ fontFamily: T.mono, color: decay < 0 ? T.red : T.green }}>{premiums2010.toFixed(2)}x</span></div>
                      <div style={{ fontSize: 10, color: T.sub }}>2024 mult: <span style={{ fontFamily: T.mono, color: T.navy, fontWeight: 700 }}>{premiums2024.toFixed(2)}x</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Credit Count by Vintage Year (Filtered)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={vintageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Credits" fill={T.indigo} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 2: METHODOLOGY PRICE MATRIX ── */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Heatmap table */}
              <div style={card}>
                <div style={lbl}>Methodology × Registry Price Heatmap (Avg $/tCO2)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.sub }}>Method</th>
                        {REGISTRY_NAMES.map(r => (
                          <th key={r} style={{ padding: '6px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, color: T.sub }}>{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {METHODOLOGY_NAMES.map((m, mi) => (
                        <tr key={m} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px', fontWeight: 600 }}>{m}</td>
                          {REGISTRY_NAMES.map((r, ri) => {
                            const cell = CREDITS.filter(c => c.method===m && c.registry===r);
                            const avg  = cell.length ? cell.reduce((a,c)=>a+c.price,0)/cell.length : null;
                            const max  = Math.max(...CREDITS.filter(c=>c.method===m).map(c=>c.price), 1);
                            const intensity = avg ? avg/max : 0;
                            return (
                              <td key={r} style={{
                                padding: '6px', textAlign: 'center', fontFamily: T.mono,
                                background: avg ? `rgba(27,42,74,${0.08 + intensity*0.5})` : '#f5f5f5',
                                color: intensity > 0.6 ? '#fff' : T.text,
                                fontSize: 10,
                              }}>
                                {avg ? `$${avg.toFixed(0)}` : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Radar: methodology quality dimensions */}
              <div style={card}>
                <div style={lbl}>Methodology Quality Radar — Select Methodology</div>
                {methodAvgs.slice(0,4).map((m, mi) => (
                  <div key={m.name} style={{ marginBottom: mi < 3 ? 8 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart data={[
                        { subject: 'Additionality', value: Math.round(m.additionality*100) },
                        { subject: 'Permanence',    value: Math.round(m.permanence*100) },
                        { subject: 'Co-benefits',   value: Math.round(m.cobenefits*100) },
                        { subject: 'MRV',           value: Math.round(m.mrv*100) },
                        { subject: 'Scalability',   value: Math.round(m.scalability*100) },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis domain={[0,100]} tick={false} />
                        <Radar dataKey="value" fill={[T.navy,T.indigo,T.green,T.amber][mi]} fillOpacity={0.3} stroke={[T.navy,T.indigo,T.green,T.amber][mi]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>

            {/* Methodology bar comparison */}
            <div style={card}>
              <div style={lbl}>Average Price by Methodology ($/tCO2) — Filtered</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={methodAvgs.length ? methodAvgs : METHODOLOGIES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => fmtPrice(v)} />
                  <Bar dataKey="filteredAvg" name="Avg Price" radius={[0,4,4,0]}>
                    {(methodAvgs.length ? methodAvgs : METHODOLOGIES).map((_, i) => (
                      <Cell key={i} fill={[T.navy,T.indigo,T.green,T.teal,T.amber,T.purple,T.orange,T.red,T.gold,T.blue,'#0d9488','#be185d'][i % 12]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Methodology detail table */}
            <div style={card}>
              <div style={lbl}>Methodology Detail — Price Range & Quality Dimensions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Methodology','Credits','Min','Avg','Max','Additionality','Permanence','Co-benefits','MRV','Scalability'].map(h => (
                      <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METHODOLOGIES.map(m => (
                    <tr key={m.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: 6 }}>{m.count}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(m.priceMin)}</td>
                      <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700 }}>{fmtPrice(m.avgPrice)}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(m.priceMax)}</td>
                      {['additionality','permanence','cobenefits','mrv','scalability'].map(dim => (
                        <td key={dim} style={{ padding: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 32, height: 5, borderRadius: 2, background: T.border }}>
                              <div style={{ width: `${m[dim]*100}%`, height: '100%', borderRadius: 2, background: m[dim]>0.7?T.green:m[dim]>0.4?T.amber:T.red }} />
                            </div>
                            <span style={{ fontSize: 9, color: T.sub }}>{Math.round(m[dim]*100)}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: REGISTRY & VERIFICATION PREMIUM ── */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Average Price by Registry ($/tCO2)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={registryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => fmtPrice(v)} />
                    <Bar dataKey="filteredAvg" name="Avg Price" radius={[4,4,0,0]}>
                      {registryStats.map((_, i) => <Cell key={i} fill={[T.navy,T.indigo,T.teal,T.green,T.purple][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Verification Body Market Share</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={verifierStats} dataKey="marketShare" nameKey="name" outerRadius={100} label={({ name, value }) => `${name.split(' ')[0]} ${(value*100).toFixed(0)}%`} labelLine={false}>
                      {verifierStats.map((_, i) => <Cell key={i} fill={[T.navy,T.indigo,T.teal,T.green,T.amber][i]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtPct(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Registry Overview — Issuance, Retirements & Market Position</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Registry','Credits','Avg Price','Total Issuance (Mt)','Retirements (Mt)','Market Share','Accepted Verifiers'].map(h => (
                      <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: T.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGISTRIES.map(r => (
                    <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: 6 }}>{r.count}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(r.avgPrice)}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{r.totalIssuance}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{r.totalRetirements}</td>
                      <td style={{ padding: 6 }}>
                        <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${r.marketShare*100}%`, height: '100%', background: T.indigo, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 9, color: T.sub }}>{fmtPct(r.marketShare)}</span>
                      </td>
                      <td style={{ padding: 6, fontSize: 10, color: T.sub }}>{r.verifiers.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <div style={lbl}>Verification Cost vs. Credit Price — Cost-to-Value Ratio</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Verifier','Credits Verified','Avg Credit Price','Verification Cost ($/t)','Cost Ratio','Market Share'].map(h => (
                      <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: T.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {verifierStats.map(v => (
                    <tr key={v.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{v.name}</td>
                      <td style={{ padding: 6 }}>{v.count}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(v.avgPrice)}</td>
                      <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(v.verifCost)}</td>
                      <td style={{ padding: 6, fontFamily: T.mono, color: v.costRatio > 0.1 ? T.red : T.green }}>{(v.costRatio*100).toFixed(1)}%</td>
                      <td style={{ padding: 6 }}>{fmtPct(v.marketShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: PERMANENCE & BUFFER PRICING ── */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: T.sub }}>Insurance Cost Rate:</span>
              <input type="range" min={0.005} max={0.08} step={0.005} value={insuranceSlider} onChange={e=>setInsuranceSlider(Number(e.target.value))} style={{ width: 120 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{fmtPct(insuranceSlider)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Permanence vs. Price Premium (with Insurance Overlay)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={permanenceChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="permanence" tick={{ fontSize: 10 }} label={{ value: 'Permanence (years)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => fmtPrice(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="premium" name="Credit Premium" fill={T.navy+'20'} stroke={T.navy} strokeWidth={2} />
                    <Line type="monotone" dataKey="bufferCost" name="Buffer Pool Cost" stroke={T.red} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="insuranceCost" name="Insurance Cost" stroke={T.amber} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="netPrice" name="Net Price" stroke={T.green} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Buffer Pool Requirements by Methodology</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Method','Avg Buffer %','Min Buffer','Max Buffer','Avg Permanence'].map(h => (
                        <th key={h} style={{ padding: '6px', textAlign: 'left', color: T.sub }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METHODOLOGY_NAMES.map(m => {
                      const mc = filtered.filter(c=>c.method===m);
                      if (!mc.length) return null;
                      const buffers = mc.map(c=>c.bufferPct);
                      const avgBuf = buffers.reduce((a,b)=>a+b,0)/buffers.length;
                      const avgPerm = mc.reduce((a,c)=>a+c.permanence,0)/mc.length;
                      return (
                        <tr key={m} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: 6, fontWeight: 600 }}>{m}</td>
                          <td style={{ padding: 6, fontFamily: T.mono }}>{avgBuf.toFixed(1)}%</td>
                          <td style={{ padding: 6, fontFamily: T.mono }}>{Math.min(...buffers).toFixed(1)}%</td>
                          <td style={{ padding: 6, fontFamily: T.mono }}>{Math.max(...buffers).toFixed(1)}%</td>
                          <td style={{ padding: 6, fontFamily: T.mono }}>{Math.round(avgPerm)}yr</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Climate Reversal Risk Pricing Model</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 10, lineHeight: 1.6 }}>
                Reversal risk is priced as an expected loss: <code style={{ fontFamily: T.mono, fontSize: 10, background: '#f1f0ec', padding: '1px 4px', borderRadius: 3 }}>Reversal Premium = Buffer% × P(reversal) × Replacement Cost</code>. Higher permanence projects command lower reversal risk and hence lower buffer requirements relative to their price.
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="permanence" name="Permanence (yr)" tick={{ fontSize: 10 }} label={{ value: 'Permanence (yr)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="bufferPct" name="Buffer %" tick={{ fontSize: 10 }} label={{ value: 'Buffer %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [n==='permanence' ? `${v}yr` : `${v.toFixed(1)}%`, n]} />
                  <Scatter data={filtered.map(c=>({ permanence: c.permanence, bufferPct: Math.round(c.bufferPct*10)/10, name: c.name }))} fill={T.indigo} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 5: MARKET LIQUIDITY ENGINE ── */}
        {tab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.sub }}>Market Depth Threshold (daily vol 000s):</span>
              <input type="range" min={500} max={20000} step={500} value={volumeSlider} onChange={e=>setVolumeSlider(Number(e.target.value))} style={{ width: 140 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{(volumeSlider/1000).toFixed(1)}k tCO2</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Bid-Ask Spread by Credit Type (%)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={liquidityData.slice(0,12)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 8 }} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="bidAsk" name="Bid-Ask %" radius={[0,4,4,0]}>
                      {liquidityData.slice(0,12).map((d,i) => <Cell key={i} fill={d.bidAsk > 10 ? T.red : d.bidAsk > 6 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Daily Volume by Methodology — 30 Day View</div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={DAILY_VOLUME.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="renewable" stackId="1" fill={T.gold} stroke={T.gold} name="Renewable" />
                    <Area type="monotone" dataKey="redd"      stackId="1" fill={T.green} stroke={T.green} name="REDD+" />
                    <Area type="monotone" dataKey="arr"       stackId="1" fill={T.teal} stroke={T.teal} name="ARR" />
                    <Area type="monotone" dataKey="soil"      stackId="1" fill={T.indigo} stroke={T.indigo} name="Soil" />
                    <Area type="monotone" dataKey="biochar"   stackId="1" fill={T.amber} stroke={T.amber} name="Biochar" />
                    <Area type="monotone" dataKey="dac"       stackId="1" fill={T.purple} stroke={T.purple} name="DAC" />
                    <ReferenceLine y={volumeSlider} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Threshold', fontSize: 9, fill: T.red }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Liquidity Score Heatmap & Turnover Ratio by Registry</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {REGISTRY_NAMES.map(r => {
                  const rc = filtered.filter(c=>c.registry===r);
                  const avgLiq = rc.length ? rc.reduce((a,c)=>a+c.liquidity,0)/rc.length : 0;
                  const avgVol = rc.length ? rc.reduce((a,c)=>a+c.dailyVolume,0)/rc.length : 0;
                  const turnover = rc.length ? avgVol / (rc.reduce((a,c)=>a+c.price*c.dailyVolume,0)/rc.length || 1) : 0;
                  return (
                    <div key={r} style={{ flex: 1, minWidth: 120, padding: '12px', background: `rgba(27,42,74,${0.05+avgLiq*0.2})`, borderRadius: 8, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{r}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color: avgLiq > 0.6 ? T.green : avgLiq > 0.3 ? T.amber : T.red }}>{Math.round(avgLiq*100)}</div>
                      <div style={{ fontSize: 9, color: T.sub }}>Liquidity Score</div>
                      <div style={{ fontSize: 10, fontFamily: T.mono, marginTop: 4 }}>{Math.round(avgVol).toLocaleString()} tCO2/day</div>
                      <div style={{ fontSize: 9, color: T.sub }}>Turnover: {(turnover*100).toFixed(2)}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, padding: '10px', background: T.surface, borderRadius: 6 }}>
                Credits above the {(volumeSlider/1000).toFixed(1)}k tCO2/day threshold: <strong style={{ color: T.navy }}>{filtered.filter(c=>c.dailyVolume>=volumeSlider).length}</strong> of {filtered.length}. High liquidity credits trade with tighter bid-ask spreads and command a liquidity premium of 5–15% over illiquid equivalents.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: BEZERO / SYLVERA RATINGS ── */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Sylvera Score vs. Price — BeZero Rating Overlay</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="x" name="Sylvera Score" tick={{ fontSize: 10 }} label={{ value: 'Sylvera Score (0-100)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis dataKey="y" name="Price" tick={{ fontSize: 10 }} />
                    <Tooltip content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 10, fontSize: 11, borderRadius: 6 }}>
                          <div style={{ fontWeight: 700 }}>{d.name}</div>
                          <div>Sylvera: {d.x} | Price: {fmtPrice(d.y)}</div>
                          <div style={{ color: BEZERO_COLOR[d.rating] || T.sub, fontWeight: 700 }}>BeZero: {d.rating}</div>
                        </div>
                      );
                    }} />
                    <Scatter data={ratingsData} name="Credits">
                      {ratingsData.map((d, i) => <Cell key={i} fill={BEZERO_COLOR[d.rating] || T.navy} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>BeZero Rating Distribution & Average Price</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={BEZERO_RATINGS.map(r => {
                    const rc = filtered.filter(c=>c.bezeroRating===r);
                    const prices = rc.map(c=>c.price);
                    return {
                      rating: r,
                      count: rc.length,
                      avgPrice: prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length*100)/100 : 0,
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => typeof v === 'number' && v > 10 ? fmtPrice(v) : v} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar yAxisId="left" dataKey="count" name="# Credits" radius={[4,4,0,0]}>
                      {BEZERO_RATINGS.map((r,i) => <Cell key={i} fill={BEZERO_COLOR[r]} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="avgPrice" name="Avg Price" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>BeZero 12-Month Rating Migration Matrix (%)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px', color: T.sub, borderBottom: `2px solid ${T.border}` }}>From \\ To</th>
                      {BEZERO_RATINGS.map(r => (
                        <th key={r} style={{ padding: '6px', textAlign: 'center', color: BEZERO_COLOR[r], borderBottom: `2px solid ${T.border}` }}>{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ratingMigration.map(row => (
                      <tr key={row.from} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px', fontWeight: 700, color: BEZERO_COLOR[row.from] }}>{row.from}</td>
                        {BEZERO_RATINGS.map(to => (
                          <td key={to} style={{
                            padding: '6px', textAlign: 'center', fontFamily: T.mono,
                            background: row.from === to ? `${BEZERO_COLOR[row.from]}22` : 'transparent',
                            fontWeight: row.from === to ? 700 : 400,
                            color: row[to] > 50 ? T.text : T.sub,
                          }}>
                            {row[to]}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>Diagonal = same-rating retention. Source: BeZero Carbon 12-month cohort analysis model.</div>
            </div>
          </div>
        )}

        {/* ── TAB 7: FORWARD CURVE & DERIVATIVES ── */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                Horizon:
                {[1,3,5,7].map(h => (
                  <button key={h} onClick={() => setFwdHorizon(h)} style={{
                    padding: '4px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                    background: fwdHorizon === h ? T.navy : T.card,
                    color: fwdHorizon === h ? '#fff' : T.sub,
                    border: `1px solid ${fwdHorizon === h ? T.navy : T.border}`,
                  }}>{h}yr</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                Carbon Price Scenario:
                {[20, 50, 100, 200].map(p => (
                  <button key={p} onClick={() => setScenarioPrice(p)} style={{
                    padding: '4px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                    background: scenarioPrice === p ? T.gold : T.card,
                    color: scenarioPrice === p ? '#fff' : T.sub,
                    border: `1px solid ${scenarioPrice === p ? T.gold : T.border}`,
                  }}>${p}/t</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>Forward Price Curve 2024–2030 by Methodology</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={fwdCurveSlice}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => fmtPrice(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="redd"      name="REDD+"    stroke={T.green}  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="arr"       name="ARR"      stroke={T.teal}   strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="biochar"   name="Biochar"  stroke={T.amber}  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="soil"      name="Soil"     stroke={T.indigo} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="renewable" name="Renewable"stroke={T.gold}   strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Spot vs. Forward — Historical Basis (24 Months)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={BACKTEST_RETURNS}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => fmtPrice(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="spot"    name="Spot"    fill={T.navy+'15'} stroke={T.navy} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="forward" name="Forward" stroke={T.gold}  strokeWidth={2} dot={false} />
                    <Bar dataKey="basis" name="Basis" fill={T.teal} opacity={0.6} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <div style={lbl}>What-If Scenario: ${scenarioPrice}/tonne Carbon Price</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Methodology','Base Fwd 2026','Scenario Price','Delta','Delta %'].map(h => (
                        <th key={h} style={{ padding: '6px', textAlign: 'left', color: T.sub }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'REDD+',    base: FORWARD_CURVE[2].redd },
                      { name: 'ARR',      base: FORWARD_CURVE[2].arr },
                      { name: 'Biochar',  base: FORWARD_CURVE[2].biochar },
                      { name: 'Soil',     base: FORWARD_CURVE[2].soil },
                      { name: 'Renewable',base: FORWARD_CURVE[2].renewable },
                    ].map(row => {
                      const scenarioAdj = row.base * scenarioMultiplier;
                      const delta = scenarioAdj - row.base;
                      return (
                        <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: 6, fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(row.base)}</td>
                          <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700, color: T.indigo }}>{fmtPrice(scenarioAdj)}</td>
                          <td style={{ padding: 6, fontFamily: T.mono, color: delta >= 0 ? T.green : T.red }}>{delta >= 0 ? '+' : ''}{fmtPrice(delta)}</td>
                          <td style={{ padding: 6, fontFamily: T.mono, color: delta >= 0 ? T.green : T.red }}>{delta >= 0 ? '+' : ''}{((scenarioMultiplier-1)*100).toFixed(0)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={card}>
                <div style={lbl}>Carry Cost Calculator (Storage + Financing + Insurance)</div>
                {[
                  { label: 'Storage Cost', val: '0.5–2% p.a.', note: 'Registry fees + data management' },
                  { label: 'Financing Cost', val: '3–8% p.a.', note: 'Cost of capital / repo rate' },
                  { label: 'Insurance', val: '1–4% p.a.', note: 'Reversal, regulatory, counterparty' },
                  { label: 'Total Carry', val: '4.5–14% p.a.', note: 'Drives forward > spot contango structure', bold: true },
                  { label: 'Implied Contango (5yr)', val: `${((1.09**5-1)*100).toFixed(1)}%`, note: 'Mid-point carry rate compounded', bold: true, col: T.navy },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: row.bold ? 700 : 400 }}>{row.label}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{row.note}</div>
                    </div>
                    <div style={{ fontFamily: T.mono, fontWeight: 700, color: row.col || T.text }}>{row.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: CORSIA & COMPLIANCE ELIGIBILITY ── */}
        {tab === 8 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <div style={lbl}>CORSIA Phase Eligibility — Credit Count</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={Object.entries(CORSIA_PHASES).map(([phase, cfg]) => ({
                    phase: phase.replace(' (', '\n('),
                    eligible: CREDITS.filter(c => cfg.eligible.includes(c.method) && c.qualityScore >= 50).length,
                    notEligible: CREDITS.filter(c => !cfg.eligible.includes(c.method) || c.qualityScore < 50).length,
                    uplift: cfg.uplift * 100,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="phase" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="eligible"    name="Eligible"     fill={T.green}  radius={[4,4,0,0]} stackId="a" />
                    <Bar dataKey="notEligible" name="Not Eligible" fill={T.border} radius={[4,4,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Compliance Demand Uplift by Phase</div>
                {Object.entries(CORSIA_PHASES).map(([phase, cfg]) => (
                  <div key={phase} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{phase}</div>
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>Eligible methods: {cfg.eligible.slice(0,3).join(', ')}{cfg.eligible.length > 3 ? ` +${cfg.eligible.length-3}` : ''}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      <div style={{ fontSize: 12, fontFamily: T.mono, color: T.green, fontWeight: 700 }}>+{(cfg.uplift*100).toFixed(0)}% price uplift</div>
                      <div style={{ fontSize: 10, color: T.sub }}>vs. voluntary market</div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '10px 0', fontSize: 10, color: T.sub }}>CORSIA covers ~3.5 Gt CO2 of international aviation emissions by 2035. Compliance demand expected to exceed voluntary supply in Phase 3.</div>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Compliance Eligibility Matrix — All Filtered Credits</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Credit','Method','Registry','Quality','BeZero','Spot Price','CORSIA Ph1','CORSIA Ph2','CORSIA Ph3','EU CBAM','SBTi','Compliance Price'].map(h => (
                        <th key={h} style={{ padding: '6px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corsiaData.slice(0,20).map(c => {
                      const tick = flag => flag
                        ? <span style={{ color: T.green, fontWeight: 700 }}>YES</span>
                        : <span style={{ color: T.border }}>—</span>;
                      return (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: 6, fontWeight: 600, fontSize: 10 }}>{c.name.substring(0,22)}</td>
                          <td style={{ padding: 6, fontSize: 10 }}>{c.method}</td>
                          <td style={{ padding: 6, fontSize: 10 }}>{c.registry}</td>
                          <td style={{ padding: 6 }}>{c.qualityScore}</td>
                          <td style={{ padding: 6, fontWeight: 700, color: BEZERO_COLOR[c.bezeroRating] }}>{c.bezeroRating}</td>
                          <td style={{ padding: 6, fontFamily: T.mono }}>{fmtPrice(c.price)}</td>
                          <td style={{ padding: 6 }}>{tick(c.phase1)}</td>
                          <td style={{ padding: 6 }}>{tick(c.phase2)}</td>
                          <td style={{ padding: 6 }}>{tick(c.phase3)}</td>
                          <td style={{ padding: 6 }}>{tick(c.cbamEligible)}</td>
                          <td style={{ padding: 6 }}>{tick(c.sbtiAccepted)}</td>
                          <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700, color: c.compliancePrice > c.price ? T.green : T.sub }}>{fmtPrice(c.compliancePrice)} <span style={{ fontSize: 9, color: T.sub }}>+{c.upliftPct}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 9: PRICING ATTRIBUTION ENGINE ── */}
        {tab === 9 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Sliders */}
              <div style={card}>
                <div style={lbl}>Attribution Component Sliders</div>
                {[
                  { label: 'Base Cost ($/t)',           val: attrBase,          set: setAttrBase,          min: 1,   max: 500, step: 1,    color: T.navy },
                  { label: 'Additionality Premium',     val: attrAdditionality, set: setAttrAdditionality, min: 0,   max: 20,  step: 0.5,  color: T.green },
                  { label: 'Vintage Premium',           val: attrVintage,       set: setAttrVintage,       min: -5,  max: 15,  step: 0.5,  color: T.teal },
                  { label: 'Co-benefit Premium',        val: attrCobenefits,    set: setAttrCobenefits,    min: 0,   max: 10,  step: 0.25, color: T.indigo },
                  { label: 'Registry Premium',          val: attrRegistry,      set: setAttrRegistry,      min: 0,   max: 10,  step: 0.25, color: T.purple },
                  { label: 'Verification Premium',      val: attrVerification,  set: setAttrVerification,  min: 0,   max: 8,   step: 0.2,  color: T.amber },
                  { label: 'Liquidity Discount (neg)',  val: attrLiqDiscount,   set: setAttrLiqDiscount,   min: -10, max: 0,   step: 0.25, color: T.red },
                  { label: 'Permanence Premium',        val: attrPermanence,    set: setAttrPermanence,    min: 0,   max: 20,  step: 0.5,  color: T.gold },
                ].map(slider => (
                  <div key={slider.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 180, fontSize: 11, fontWeight: 500 }}>{slider.label}</div>
                    <input type="range" min={slider.min} max={slider.max} step={slider.step} value={slider.val}
                      onChange={e => slider.set(Number(e.target.value))} style={{ flex: 1, accentColor: slider.color }} />
                    <div style={{ width: 60, textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: slider.color }}>
                      {slider.val >= 0 ? '+' : ''}{fmtPrice(slider.val)}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 700, fontSize: 14 }}>
                  <span>Total Attributed Price</span>
                  <span style={{ fontFamily: T.mono, color: T.navy }}>{fmtPrice(attrTotal)}</span>
                </div>
              </div>

              {/* Waterfall chart (simulated with bar) */}
              <div style={card}>
                <div style={lbl}>Waterfall — Price Attribution Breakdown</div>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={attrWaterfall} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} domain={[Math.min(0, attrTotal - 5), attrTotal + 5]} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={v => fmtPrice(v)} />
                    <Bar dataKey="cum" name="Cumulative Price" radius={[0,4,4,0]}>
                      {attrWaterfall.map((d, i) => (
                        <Cell key={i} fill={d.total ? T.navy : d.color} opacity={d.total ? 1 : 0.82} />
                      ))}
                    </Bar>
                    <ReferenceLine x={0} stroke={T.border} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 8, lineHeight: 1.6 }}>
                  Bar length = cumulative price at each attribution layer. Total: <strong style={{ fontFamily: T.mono }}>{fmtPrice(attrTotal)}</strong>. Liquidity discount reduces final price; all other components are additive premiums.
                </div>
              </div>
            </div>

            {/* Attribution component breakdown table */}
            <div style={card}>
              <div style={lbl}>Attribution Analysis — Component Share & Benchmark</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Component','Value ($/t)','% of Total','Direction','Typical Range','Benchmark Mid'].map(h => (
                      <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: T.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Base Cost',          val: attrBase,          pct: attrTotal ? attrBase/attrTotal : 0,          dir: 'Positive', range: '$1–$500',   bench: '$12' },
                    { name: 'Additionality',      val: attrAdditionality, pct: attrTotal ? attrAdditionality/attrTotal : 0, dir: 'Positive', range: '$0–$20',   bench: '$3.5' },
                    { name: 'Vintage Premium',    val: attrVintage,       pct: attrTotal ? attrVintage/attrTotal : 0,       dir: 'Variable', range: '-$5–$15',  bench: '$2' },
                    { name: 'Co-benefits',        val: attrCobenefits,    pct: attrTotal ? attrCobenefits/attrTotal : 0,    dir: 'Positive', range: '$0–$10',   bench: '$1.5' },
                    { name: 'Registry Premium',   val: attrRegistry,      pct: attrTotal ? attrRegistry/attrTotal : 0,      dir: 'Positive', range: '$0–$10',   bench: '$1.2' },
                    { name: 'Verification',       val: attrVerification,  pct: attrTotal ? attrVerification/attrTotal : 0,  dir: 'Positive', range: '$0–$8',    bench: '$0.9' },
                    { name: 'Liquidity Discount', val: attrLiqDiscount,   pct: attrTotal ? attrLiqDiscount/attrTotal : 0,   dir: 'Negative', range: '-$10–$0',  bench: '-$0.5' },
                    { name: 'Permanence Premium', val: attrPermanence,    pct: attrTotal ? attrPermanence/attrTotal : 0,    dir: 'Positive', range: '$0–$20',   bench: '$2.5' },
                  ].map(row => (
                    <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700, color: row.val >= 0 ? T.navy : T.red }}>{row.val >= 0 ? '+' : ''}{fmtPrice(row.val)}</td>
                      <td style={{ padding: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 50, height: 5, background: T.border, borderRadius: 2 }}>
                            <div style={{ width: `${Math.abs(row.pct)*100}%`, height: '100%', background: row.val >= 0 ? T.navy : T.red, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 9, fontFamily: T.mono }}>{(row.pct*100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 6, color: row.dir === 'Negative' ? T.red : row.dir === 'Variable' ? T.amber : T.green, fontSize: 10 }}>{row.dir}</td>
                      <td style={{ padding: 6, fontFamily: T.mono, fontSize: 10, color: T.sub }}>{row.range}</td>
                      <td style={{ padding: 6, fontFamily: T.mono, fontSize: 10 }}>{row.bench}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `2px solid ${T.border}`, background: T.surface }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>Total Price</td>
                    <td style={{ padding: 8, fontFamily: T.mono, fontWeight: 700, fontSize: 14, color: T.navy }}>{fmtPrice(attrTotal)}</td>
                    <td style={{ padding: 8, fontFamily: T.mono, fontSize: 10 }}>100%</td>
                    <td colSpan={3} style={{ padding: 8, fontSize: 10, color: T.sub }}>Fully attributed · No residual</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
