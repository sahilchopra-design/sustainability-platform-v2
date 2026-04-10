import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, PieChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  ReferenceLine, Scatter, Pie
} from 'recharts';

/* ── theme ── */
const T = { surface:'#fafaf7', border:'#e2e0d8', navy:'#1b2a4a', gold:'#b8962e', text:'#1a1a2e', sub:'#64748b', card:'#ffffff', indigo:'#4f46e5', green:'#065f46', red:'#991b1b', amber:'#92400e' };

/* ── deterministic PRNG ── */
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

/* ── 16 offset types ── */
const OFFSET_TYPES = [
  { id:1,name:'ARR Tropical',category:'Nature',permanenceYrs:35,reversalDecade:0.12,bufferPoolPct:20,fireRisk:0.15,droughtRisk:0.08,floodRisk:0.04,policyRisk:0.06,insurable:true,insuranceCostPct:3.6,monitoringFreq:'quarterly',mrvComplexity:'high',technologyMaturity:'mature',historicalReversalRate:0.09 },
  { id:2,name:'ARR Temperate',category:'Nature',permanenceYrs:40,reversalDecade:0.08,bufferPoolPct:18,fireRisk:0.10,droughtRisk:0.05,floodRisk:0.03,policyRisk:0.04,insurable:true,insuranceCostPct:2.4,monitoringFreq:'semi-annual',mrvComplexity:'med',technologyMaturity:'mature',historicalReversalRate:0.06 },
  { id:3,name:'REDD+ Amazon',category:'Nature',permanenceYrs:30,reversalDecade:0.14,bufferPoolPct:25,fireRisk:0.12,droughtRisk:0.10,floodRisk:0.06,policyRisk:0.09,insurable:true,insuranceCostPct:4.2,monitoringFreq:'quarterly',mrvComplexity:'high',technologyMaturity:'mature',historicalReversalRate:0.11 },
  { id:4,name:'REDD+ SE Asia',category:'Nature',permanenceYrs:28,reversalDecade:0.14,bufferPoolPct:22,fireRisk:0.08,droughtRisk:0.06,floodRisk:0.09,policyRisk:0.08,insurable:true,insuranceCostPct:4.0,monitoringFreq:'quarterly',mrvComplexity:'high',technologyMaturity:'scaling',historicalReversalRate:0.10 },
  { id:5,name:'IFM Boreal',category:'Nature',permanenceYrs:45,reversalDecade:0.06,bufferPoolPct:15,fireRisk:0.08,droughtRisk:0.03,floodRisk:0.02,policyRisk:0.03,insurable:true,insuranceCostPct:1.8,monitoringFreq:'annual',mrvComplexity:'med',technologyMaturity:'mature',historicalReversalRate:0.04 },
  { id:6,name:'Peatland Restore',category:'Nature',permanenceYrs:50,reversalDecade:0.04,bufferPoolPct:12,fireRisk:0.03,droughtRisk:0.05,floodRisk:0.07,policyRisk:0.03,insurable:true,insuranceCostPct:1.5,monitoringFreq:'semi-annual',mrvComplexity:'med',technologyMaturity:'scaling',historicalReversalRate:0.03 },
  { id:7,name:'Mangrove Blue',category:'Blue Carbon',permanenceYrs:55,reversalDecade:0.05,bufferPoolPct:15,fireRisk:0.01,droughtRisk:0.02,floodRisk:0.12,policyRisk:0.04,insurable:true,insuranceCostPct:1.8,monitoringFreq:'semi-annual',mrvComplexity:'high',technologyMaturity:'scaling',historicalReversalRate:0.04 },
  { id:8,name:'Seagrass Restoration',category:'Blue Carbon',permanenceYrs:45,reversalDecade:0.06,bufferPoolPct:16,fireRisk:0.0,droughtRisk:0.01,floodRisk:0.14,policyRisk:0.05,insurable:false,insuranceCostPct:0,monitoringFreq:'quarterly',mrvComplexity:'high',technologyMaturity:'emerging',historicalReversalRate:0.05 },
  { id:9,name:'Soil Carbon Ag',category:'Soil',permanenceYrs:15,reversalDecade:0.18,bufferPoolPct:10,fireRisk:0.02,droughtRisk:0.12,floodRisk:0.05,policyRisk:0.07,insurable:false,insuranceCostPct:0,monitoringFreq:'annual',mrvComplexity:'high',technologyMaturity:'scaling',historicalReversalRate:0.15 },
  { id:10,name:'Rangeland Soil',category:'Soil',permanenceYrs:12,reversalDecade:0.20,bufferPoolPct:12,fireRisk:0.04,droughtRisk:0.15,floodRisk:0.03,policyRisk:0.06,insurable:false,insuranceCostPct:0,monitoringFreq:'annual',mrvComplexity:'med',technologyMaturity:'emerging',historicalReversalRate:0.17 },
  { id:11,name:'Biochar',category:'Engineered',permanenceYrs:500,reversalDecade:0.005,bufferPoolPct:5,fireRisk:0.0,droughtRisk:0.0,floodRisk:0.0,policyRisk:0.01,insurable:false,insuranceCostPct:0,monitoringFreq:'annual',mrvComplexity:'low',technologyMaturity:'scaling',historicalReversalRate:0.003 },
  { id:12,name:'DAC Geological',category:'Engineered',permanenceYrs:10000,reversalDecade:0.001,bufferPoolPct:2,fireRisk:0.0,droughtRisk:0.0,floodRisk:0.0,policyRisk:0.005,insurable:false,insuranceCostPct:0,monitoringFreq:'annual',mrvComplexity:'low',technologyMaturity:'emerging',historicalReversalRate:0.001 },
  { id:13,name:'CCS Industrial',category:'Engineered',permanenceYrs:5000,reversalDecade:0.002,bufferPoolPct:3,fireRisk:0.0,droughtRisk:0.0,floodRisk:0.0,policyRisk:0.008,insurable:false,insuranceCostPct:0,monitoringFreq:'semi-annual',mrvComplexity:'med',technologyMaturity:'scaling',historicalReversalRate:0.002 },
  { id:14,name:'Mineralization',category:'Engineered',permanenceYrs:100000,reversalDecade:0.0005,bufferPoolPct:1,fireRisk:0.0,droughtRisk:0.0,floodRisk:0.0,policyRisk:0.002,insurable:false,insuranceCostPct:0,monitoringFreq:'annual',mrvComplexity:'low',technologyMaturity:'emerging',historicalReversalRate:0.0004 },
  { id:15,name:'HFC Destruction',category:'Industrial',permanenceYrs:1000,reversalDecade:0.001,bufferPoolPct:3,fireRisk:0.0,droughtRisk:0.0,floodRisk:0.0,policyRisk:0.01,insurable:false,insuranceCostPct:0,monitoringFreq:'annual',mrvComplexity:'low',technologyMaturity:'mature',historicalReversalRate:0.001 },
  { id:16,name:'Methane Capture',category:'Industrial',permanenceYrs:800,reversalDecade:0.003,bufferPoolPct:4,fireRisk:0.01,droughtRisk:0.0,floodRisk:0.01,policyRisk:0.02,insurable:true,insuranceCostPct:0.9,monitoringFreq:'quarterly',mrvComplexity:'med',technologyMaturity:'mature',historicalReversalRate:0.002 },
];

/* ── Cost per tonne by type ── */
const COST_PER_TONNE = OFFSET_TYPES.map((o,i) => ({
  typeId:o.id, name:o.name, category:o.category,
  costLow: Math.round(3+sr(i*151)*15),
  costMid: Math.round(12+sr(i*157)*45),
  costHigh: Math.round(40+sr(i*163)*160),
  vintageDiscount: +(sr(i*167)*0.15).toFixed(3),
  creditRating: ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'][Math.floor(sr(i*173)*10)],
  registryStandard: ['Verra VCS','Gold Standard','ACR','CAR','Plan Vivo','Puro.earth'][Math.floor(sr(i*179)*6)]
}));

/* ── Regulatory frameworks ── */
const REGULATORY_FRAMEWORKS = [
  { id:1, name:'CORSIA', jurisdiction:'Global', permanenceReq:'min 100yr', bufferReq:'varies', accepted:['ARR','REDD+','IFM','DAC','CCS'], yearAdopted:2021 },
  { id:2, name:'EU ETS Art. 3a', jurisdiction:'EU', permanenceReq:'permanent', bufferReq:'N/A', accepted:['DAC Geological','CCS Industrial','Mineralization'], yearAdopted:2024 },
  { id:3, name:'California ARB', jurisdiction:'California', permanenceReq:'100yr', bufferReq:'min 15-20%', accepted:['ARR','IFM','Soil Carbon'], yearAdopted:2012 },
  { id:4, name:'Verra VCS', jurisdiction:'Global', permanenceReq:'min 40yr', bufferReq:'10-25%', accepted:['All Nature','Blue Carbon','Soil'], yearAdopted:2005 },
  { id:5, name:'Gold Standard', jurisdiction:'Global', permanenceReq:'min 30yr', bufferReq:'20%', accepted:['Nature','Blue Carbon','Biochar'], yearAdopted:2003 },
  { id:6, name:'SBTi FLAG', jurisdiction:'Global', permanenceReq:'matching claim', bufferReq:'per methodology', accepted:['Nature','Soil'], yearAdopted:2022 },
  { id:7, name:'Australia ACCU', jurisdiction:'Australia', permanenceReq:'25yr or 100yr', bufferReq:'5% (25yr) 20% (100yr)', accepted:['ARR','Soil Carbon','Rangeland'], yearAdopted:2011 },
  { id:8, name:'UK Woodland Carbon', jurisdiction:'UK', permanenceReq:'100yr', bufferReq:'20%', accepted:['ARR Temperate','IFM Boreal'], yearAdopted:2016 },
];

/* ── Portfolio positions (simulated) ── */
const PORTFOLIO_POSITIONS = OFFSET_TYPES.map((o,i) => ({
  typeId:o.id, name:o.name, category:o.category,
  tonnesHeld: Math.round(5000+sr(i*191)*95000),
  avgVintage: 2018+Math.floor(sr(i*193)*7),
  avgPrice: +(5+sr(i*197)*120).toFixed(2),
  unrealizedPnL: +((sr(i*199)-0.4)*50000).toFixed(0),
  bufferContrib: +(sr(i*201)*15).toFixed(1)
}));

const CATEGORIES = ['Nature','Blue Carbon','Soil','Engineered','Industrial'];
const CAT_COLORS = { Nature:T.green, 'Blue Carbon':T.indigo, Soil:T.amber, Engineered:'#7c3aed', Industrial:'#0891b2' };

/* ── Climate Scenarios ── */
const RCP_LIST = ['RCP 2.6','RCP 4.5','RCP 6.0','RCP 8.5'];
const RCP_MULT = { 'RCP 2.6':1.0, 'RCP 4.5':1.25, 'RCP 6.0':1.55, 'RCP 8.5':2.1 };
const CLIMATE_SCENARIOS = OFFSET_TYPES.flatMap(o =>
  RCP_LIST.map(rcp => ({ typeId:o.id, typeName:o.name, category:o.category, rcp, reversalMult:RCP_MULT[rcp]*(1+o.fireRisk+o.droughtRisk) }))
);

/* ── Buffer Pool Data ── */
const BUFFER_POOL_DATA = OFFSET_TYPES.map((o,i) => ({
  typeId:o.id, name:o.name, requiredPct:o.bufferPoolPct, actualPct:+(o.bufferPoolPct*(0.9+sr(i*71)*0.25)).toFixed(1),
  drawdowns: Array.from({length:5},(_,y)=>+((sr(i*100+y*13)*o.reversalDecade*100*0.3)).toFixed(2)),
  adequacyScore:+(Math.max(0,Math.min(100,80+sr(i*37)*40-o.reversalDecade*100))).toFixed(1)
}));

/* ── 30 Reversal Events ── */
const CAUSES = ['fire','drought','pest','policy','fraud'];
const REGIONS = ['Amazon','SE Asia','Congo Basin','Boreal Canada','Australia','Central America','E Africa','W Africa','Siberia','Andes'];
const REVERSAL_EVENTS = Array.from({length:30},(_,i)=>({
  id:i+1, date:`${2010+Math.floor(sr(i*41)*14)}-${String(1+Math.floor(sr(i*43)*12)).padStart(2,'0')}`,
  projectType:OFFSET_TYPES[Math.floor(sr(i*53)*8)].name, tonnesReversed:Math.round(5000+sr(i*61)*495000),
  cause:CAUSES[Math.floor(sr(i*67)*5)], region:REGIONS[Math.floor(sr(i*73)*10)],
  recoveryTimeYrs:+(1+sr(i*79)*14).toFixed(1), bufferDrawn:+(sr(i*83)*40).toFixed(1)
}));

/* ── Insurance Products ── */
const INSURANCE_PRODUCTS = [
  { id:1,provider:'Swiss Re Carbon',coverageType:'Full Reversal',premiumRate:3.2,deductible:5,maxPayout:50,eligibleTypes:['Nature','Blue Carbon'],exclusions:'Fraud, War' },
  { id:2,provider:'Munich Re Green',coverageType:'Fire & Drought',premiumRate:2.1,deductible:10,maxPayout:30,eligibleTypes:['Nature'],exclusions:'Policy change' },
  { id:3,provider:'AXA Climate',coverageType:'Parametric Weather',premiumRate:1.8,deductible:0,maxPayout:20,eligibleTypes:['Nature','Soil'],exclusions:'Intentional reversal' },
  { id:4,provider:'Lloyd\'s Syndicate 2025',coverageType:'Buffer Pool Excess',premiumRate:4.5,deductible:15,maxPayout:100,eligibleTypes:['Nature','Blue Carbon','Soil'],exclusions:'Fraud' },
  { id:5,provider:'Nephila Climate',coverageType:'Catastrophe Bond',premiumRate:5.8,deductible:20,maxPayout:200,eligibleTypes:['Nature'],exclusions:'Non-natural causes' },
  { id:6,provider:'Tokio Marine Carbon',coverageType:'Pest & Disease',premiumRate:1.5,deductible:8,maxPayout:15,eligibleTypes:['Nature','Blue Carbon'],exclusions:'Pre-existing infestation' },
  { id:7,provider:'Allianz Permanence',coverageType:'Long-term Guarantee',premiumRate:6.2,deductible:5,maxPayout:500,eligibleTypes:['Engineered','Industrial'],exclusions:'Regulatory withdrawal' },
  { id:8,provider:'Zurich Carbon Shield',coverageType:'Multi-peril',premiumRate:3.8,deductible:7,maxPayout:75,eligibleTypes:['Nature','Blue Carbon','Soil','Engineered'],exclusions:'War, Sanctions' },
];

/* ── Permanence Decay Curves ── */
const PERMANENCE_DECAY_CURVES = OFFSET_TYPES.map((o,idx) => ({
  typeId:o.id, name:o.name, category:o.category,
  curve: Array.from({length:101},(_,yr)=>{
    const halfLife = o.permanenceYrs * 0.7;
    const remaining = halfLife > 0 ? Math.exp(-0.693*yr/halfLife)*100 : 100;
    return { year:yr, remaining:+(remaining*(1-sr(idx*200+yr)*0.02)).toFixed(2) };
  })
}));

/* ── Monitoring Costs ── */
const MONITORING_COSTS = OFFSET_TYPES.map((o,i) => ({
  typeId:o.id, name:o.name, annualCost:Math.round(5000+sr(i*97)*95000),
  verificationFreq:o.monitoringFreq, technology:['satellite','drone','ground','hybrid'][Math.floor(sr(i*101)*4)],
  complianceScore:+(60+sr(i*107)*40).toFixed(1)
}));

/* ── TABS ── */
const TABS = ['Permanence Dashboard','Reversal Probability Engine','Buffer Pool Stress Test','Climate-Driven Reversal',
  'Insurance & Hedging','Historical Reversal Analysis','Permanence Decay Modeling','Monitoring & MRV',
  'Nature vs Engineered Trade-off','Portfolio Permanence Optimizer'];

const card = { background:T.card, borderRadius:10, border:`1px solid ${T.border}`, padding:20, marginBottom:16 };
const lbl = { fontSize:10, color:T.sub, textTransform:'uppercase', letterSpacing:1, marginBottom:4 };
const kpiBox = { background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'14px 18px', textAlign:'center' };

function OffsetPermanenceRiskPage() {
  /* ── ALL hooks at top ── */
  const [tab, setTab] = useState(0);
  const [catFilter, setCatFilter] = useState('All');
  const [timeHorizon, setTimeHorizon] = useState(50);
  const [rcpScenario, setRcpScenario] = useState('RCP 4.5');
  const [bufferRelease, setBufferRelease] = useState(0);
  const [stressMult, setStressMult] = useState(2);
  const [insurBudget, setInsurBudget] = useState(50);
  const [selectedDecayTypes, setSelectedDecayTypes] = useState([1,3,7,11]);
  const [natureRatio, setNatureRatio] = useState(60);
  const [targetPermanence, setTargetPermanence] = useState(50);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [minBuffer, setMinBuffer] = useState(15);

  const filtered = useMemo(() => catFilter === 'All' ? OFFSET_TYPES : OFFSET_TYPES.filter(o => o.category === catFilter), [catFilter]);

  /* Tab 0 KPIs */
  const dashKpis = useMemo(() => {
    const n = filtered.length;
    const wtdPerm = n > 0 ? filtered.reduce((a,o) => a + o.permanenceYrs, 0) / n : 0;
    const avgRev = n > 0 ? filtered.reduce((a,o) => a + o.reversalDecade, 0) / n : 0;
    const bufAdq = BUFFER_POOL_DATA.length > 0 ? BUFFER_POOL_DATA.reduce((a,b) => a + b.adequacyScore, 0) / BUFFER_POOL_DATA.length : 0;
    const insured = n > 0 ? (filtered.filter(o => o.insurable).length / n * 100) : 0;
    const monComp = MONITORING_COSTS.length > 0 ? MONITORING_COSTS.reduce((a,m) => a + m.complianceScore, 0) / MONITORING_COSTS.length : 0;
    const expLoss95 = n > 0 ? filtered.reduce((a,o) => a + o.reversalDecade * 1.65 * 100, 0) / n : 0;
    return { wtdPerm:wtdPerm.toFixed(0), avgRev:(avgRev*100).toFixed(2), bufAdq:bufAdq.toFixed(1), insured:insured.toFixed(0), monComp:monComp.toFixed(1), expLoss95:expLoss95.toFixed(2) };
  }, [filtered]);

  /* Tab 1 — reversal by decade band */
  const reversalByBand = useMemo(() => filtered.map(o => {
    const base = o.reversalDecade;
    return {
      name:o.name, '0-10yr':+(base*100).toFixed(2), '10-20yr':+(base*120).toFixed(2),
      '20-50yr':+(base*150).toFixed(2), '50-100yr':+(base*200*Math.min(timeHorizon/50,2)).toFixed(2)
    };
  }), [filtered, timeHorizon]);

  const cumReversalLine = useMemo(() => {
    const years = [1,5,10,15,20,25,30,40,50,75,100].filter(y => y <= timeHorizon);
    return years.map(yr => {
      const avg = filtered.length > 0 ? filtered.reduce((a,o) => a + (1 - Math.pow(1-o.reversalDecade, yr/10))*100, 0) / filtered.length : 0;
      return { year:yr, cumProb:+avg.toFixed(2) };
    });
  }, [filtered, timeHorizon]);

  /* Tab 2 — buffer stress */
  const bufferStress = useMemo(() => BUFFER_POOL_DATA.map(b => {
    const released = b.actualPct * (bufferRelease / 100);
    const effective = b.actualPct - released;
    const stressedDraw = b.drawdowns.length > 0 ? (b.drawdowns.reduce((a,d) => a+d,0) / b.drawdowns.length) * stressMult : 0;
    return { name:b.name, required:b.requiredPct, actual:b.actualPct, effective:+effective.toFixed(1), stressedDraw:+stressedDraw.toFixed(2), surplus:+(effective - stressedDraw).toFixed(2), adequacy:b.adequacyScore };
  }), [bufferRelease, stressMult]);

  /* Tab 3 — climate driven */
  const climateData = useMemo(() => {
    const scen = CLIMATE_SCENARIOS.filter(c => c.rcp === rcpScenario);
    return scen.map(c => ({ name:c.typeName, category:c.category, mult:+c.reversalMult.toFixed(2) }));
  }, [rcpScenario]);

  const compoundRisk = useMemo(() => filtered.map(o => ({
    name:o.name, fire:+(o.fireRisk*RCP_MULT[rcpScenario]*100).toFixed(1), drought:+(o.droughtRisk*RCP_MULT[rcpScenario]*100).toFixed(1),
    flood:+(o.floodRisk*RCP_MULT[rcpScenario]*100).toFixed(1), policy:+(o.policyRisk*100).toFixed(1)
  })), [filtered, rcpScenario]);

  /* Tab 4 — insurance */
  const insurAlloc = useMemo(() => {
    const eligible = INSURANCE_PRODUCTS.filter(p => p.premiumRate <= insurBudget / 10);
    return eligible.map(p => ({ ...p, allocated:+(insurBudget / Math.max(1, eligible.length)).toFixed(1) }));
  }, [insurBudget]);

  /* Tab 5 — historical */
  const eventsByYear = useMemo(() => {
    const map = {};
    REVERSAL_EVENTS.forEach(e => { const yr = e.date.slice(0,4); map[yr] = (map[yr]||0) + e.tonnesReversed; });
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([yr,t])=>({ year:yr, tonnes:t }));
  }, []);

  const causeBreakdown = useMemo(() => {
    const map = {};
    REVERSAL_EVENTS.forEach(e => { map[e.cause] = (map[e.cause]||0) + 1; });
    return Object.entries(map).map(([c,n])=>({ cause:c, count:n }));
  }, []);

  /* Tab 6 — decay */
  const decayCurves = useMemo(() => {
    const sel = PERMANENCE_DECAY_CURVES.filter(c => selectedDecayTypes.includes(c.typeId));
    if (sel.length === 0) return [];
    return sel[0].curve.map((_,yr) => {
      const pt = { year:yr };
      sel.forEach(c => { pt[c.name] = c.curve[yr] ? c.curve[yr].remaining : 0; });
      return pt;
    });
  }, [selectedDecayTypes]);

  /* Tab 8 — nature vs engineered */
  const tradeoffScatter = useMemo(() => filtered.map(o => ({
    name:o.name, permanence:Math.min(o.permanenceYrs,1000), cost:Math.round(5+sr(o.id*131)*195),
    volume:Math.round(1000+sr(o.id*137)*99000), category:o.category
  })), [filtered]);

  /* Tab 9 — Monte Carlo */
  const monteCarloResults = useMemo(() => {
    const paths = 500;
    const yrs = 20;
    const losses = [];
    for (let p = 0; p < paths; p++) {
      let totalLoss = 0;
      filtered.forEach((o, oi) => {
        for (let y = 0; y < yrs; y++) {
          const rand = sr(p * 1000 + oi * 100 + y);
          if (rand < o.reversalDecade) totalLoss += (1000 + sr(p * 500 + oi) * 9000) * rand;
        }
      });
      losses.push(totalLoss);
    }
    const sorted = [...losses].sort((a,b) => a - b);
    const n = sorted.length;
    const var95 = n > 0 ? sorted[Math.floor(n * 0.95)] : 0;
    const var99 = n > 0 ? sorted[Math.floor(n * 0.99)] : 0;
    const cvar95 = n > 0 ? sorted.slice(Math.floor(n*0.95)).reduce((a,v)=>a+v,0) / Math.max(1, sorted.slice(Math.floor(n*0.95)).length) : 0;
    const cvar99 = n > 0 ? sorted.slice(Math.floor(n*0.99)).reduce((a,v)=>a+v,0) / Math.max(1, sorted.slice(Math.floor(n*0.99)).length) : 0;
    const pathData = Array.from({length:20},(_,yr) => {
      const obj = { year:yr+1 };
      for (let p = 0; p < Math.min(50, paths); p++) {
        let cum = 0;
        filtered.forEach((o, oi) => {
          for (let y2 = 0; y2 <= yr; y2++) {
            const r = sr(p*1000+oi*100+y2);
            if (r < o.reversalDecade) cum += (1000+sr(p*500+oi)*9000)*r;
          }
        });
        obj[`p${p}`] = +cum.toFixed(0);
      }
      return obj;
    });
    return { var95:+var95.toFixed(0), var99:+var99.toFixed(0), cvar95:+cvar95.toFixed(0), cvar99:+cvar99.toFixed(0), pathData, losses:sorted };
  }, [filtered]);

  const toggleDecayType = useCallback((id) => {
    setSelectedDecayTypes(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  }, []);

  /* ── category distribution for dashboard pie ── */
  const catDist = useMemo(() => CATEGORIES.map(c => {
    const items = filtered.filter(o => o.category === c);
    return { cat:c, count:items.length, avgRev: items.length > 0 ? +(items.reduce((a,o)=>a+o.reversalDecade,0)/items.length*100).toFixed(2) : 0 };
  }).filter(c => c.count > 0), [filtered]);

  const riskReturnScatter = useMemo(() => filtered.map(o => ({
    name:o.name, permanence:Math.min(o.permanenceYrs,500), reversalPct:+(o.reversalDecade*100).toFixed(2), category:o.category
  })), [filtered]);

  /* ── portfolio optimizer allocations ── */
  const optimalAlloc = useMemo(() => {
    const scored = filtered.map(o => {
      const permScore = Math.min(o.permanenceYrs, 1000) / 1000;
      const riskPenalty = o.reversalDecade * 10;
      const bufBonus = o.bufferPoolPct > minBuffer ? 0.1 : -0.1;
      return { name:o.name, category:o.category, score:+(permScore - riskPenalty + bufBonus).toFixed(3), permanenceYrs:o.permanenceYrs, reversalDecade:o.reversalDecade };
    });
    const totalScore = scored.reduce((a,s) => a + Math.max(0, s.score), 0);
    return scored.map(s => ({ ...s, allocPct: totalScore > 0 ? +((Math.max(0, s.score) / totalScore) * 100).toFixed(1) : 0 }));
  }, [filtered, minBuffer]);

  /* ── render ── */
  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:T.surface, minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ background:T.navy, padding:'24px 32px 0', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ color:T.gold, fontFamily:"'JetBrains Mono',monospace", fontSize:11, letterSpacing:2, marginBottom:4 }}>EP-CN2 -- OFFSET PERMANENCE RISK</div>
            <h1 style={{ color:'#fff', fontSize:24, fontWeight:700, margin:0 }}>Offset Permanence Risk Modelling</h1>
            <p style={{ color:'#94a3b8', fontSize:13, margin:'4px 0 0' }}>16 Offset Types -- 5 Categories -- Reversal Engine -- Buffer Stress -- Climate Scenarios -- Insurance -- Decay Modelling -- Monte Carlo VaR</p>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {[
              { label:'Types', val:OFFSET_TYPES.length, col:T.gold },
              { label:'Avg Perm', val:`${dashKpis.wtdPerm}yr`, col:T.green },
              { label:'Insured', val:`${dashKpis.insured}%`, col:T.indigo },
            ].map(m => (
              <div key={m.label} style={{ background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 16px', textAlign:'right' }}>
                <div style={{ color:'#94a3b8', fontSize:10, textTransform:'uppercase', letterSpacing:1 }}>{m.label}</div>
                <div style={{ color:m.col, fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding:'10px 14px', border:'none', background:'transparent', cursor:'pointer', whiteSpace:'nowrap',
              color:tab === i ? T.gold : '#94a3b8', fontWeight:tab === i ? 700 : 400, fontSize:11,
              borderBottom:tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 32px 32px' }}>
        {/* Global filters */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:T.sub }}>Category:</span>
          {['All',...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              padding:'4px 12px', borderRadius:20, border:`1px solid ${catFilter===c?T.gold:T.border}`,
              background:catFilter===c?T.gold+'22':'transparent', color:catFilter===c?T.navy:T.sub, cursor:'pointer', fontSize:11
            }}>{c}</button>
          ))}
          <span style={{ fontSize:11, color:T.sub, marginLeft:16 }}>RCP:</span>
          <select value={rcpScenario} onChange={e=>setRcpScenario(e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:11 }}>
            {RCP_LIST.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* ═══════ TAB 0: Permanence Dashboard ═══════ */}
        {tab === 0 && (<div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Wtd Permanence', val:`${dashKpis.wtdPerm} yr`, col:T.navy },
              { label:'Avg Reversal/Dec', val:`${dashKpis.avgRev}%`, col:T.red },
              { label:'Buffer Adequacy', val:`${dashKpis.bufAdq}`, col:T.amber },
              { label:'Insured %', val:`${dashKpis.insured}%`, col:T.indigo },
              { label:'Monitor Compliance', val:`${dashKpis.monComp}%`, col:T.green },
              { label:'Exp Loss 95th', val:`${dashKpis.expLoss95}%`, col:T.red },
            ].map(k => (
              <div key={k.label} style={kpiBox}>
                <div style={lbl}>{k.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:k.col, fontFamily:"'JetBrains Mono',monospace" }}>{k.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Permanence by Type (years, capped at 500)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={[...filtered].sort((a,b)=>Math.min(b.permanenceYrs,500)-Math.min(a.permanenceYrs,500))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0,500]} tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                  <Tooltip formatter={v=>`${v} yrs`} />
                  <Bar dataKey={o=>Math.min(o.permanenceYrs,500)} name="Permanence (yrs)" radius={[0,4,4,0]}>
                    {filtered.map((o,i)=><Cell key={i} fill={CAT_COLORS[o.category]||T.sub} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Category Distribution</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={catDist} dataKey="count" nameKey="cat" cx="50%" cy="50%" outerRadius={60} label={({cat,count})=>`${cat}: ${count}`}>
                      {catDist.map((c,i) => <Cell key={i} fill={CAT_COLORS[c.cat]||T.sub} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Risk-Return Scatter</div>
                <ResponsiveContainer width="100%" height={160}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="permanence" name="Permanence" tick={{ fontSize:9 }} />
                    <YAxis dataKey="reversalPct" name="Reversal%" tick={{ fontSize:9 }} />
                    <Tooltip formatter={(v,n)=>[`${v}`,n]} />
                    <Scatter data={riskReturnScatter} fill={T.indigo}>
                      {riskReturnScatter.map((d,i) => <Cell key={i} fill={CAT_COLORS[d.category]||T.sub} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={lbl}>Portfolio Positions Summary</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Type','Category','Tonnes Held','Avg Vintage','Avg Price','Unrealized P&L','Buffer Contrib','Registry'].map(h=>
                  <th key={h} style={{ textAlign:'left', padding:'6px', color:T.sub, fontSize:9 }}>{h}</th>
                )}
              </tr></thead>
              <tbody>{PORTFOLIO_POSITIONS.map(p => {
                const cost = COST_PER_TONNE.find(c=>c.typeId===p.typeId);
                return (
                  <tr key={p.typeId} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:5, fontWeight:600, fontSize:11 }}>{p.name}</td>
                    <td style={{ padding:5 }}><span style={{ padding:'2px 6px', borderRadius:8, fontSize:9, background:CAT_COLORS[p.category]+'22', color:CAT_COLORS[p.category] }}>{p.category}</span></td>
                    <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace" }}>{(p.tonnesHeld/1000).toFixed(0)}k</td>
                    <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace" }}>{p.avgVintage}</td>
                    <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace" }}>${p.avgPrice}</td>
                    <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace", color:p.unrealizedPnL>=0?T.green:T.red }}>{p.unrealizedPnL>=0?'+':''}${(p.unrealizedPnL/1000).toFixed(1)}k</td>
                    <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace" }}>{p.bufferContrib}%</td>
                    <td style={{ padding:5, fontSize:10 }}>{cost?cost.registryStandard:'--'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Credit Rating Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(() => {
                  const m = {};
                  COST_PER_TONNE.forEach(c => { m[c.creditRating]=(m[c.creditRating]||0)+1; });
                  return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)).map(([r,n])=>({ rating:r, count:n }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Types" fill={T.indigo} radius={[4,4,0,0]}>
                    {COST_PER_TONNE.map((_,i)=><Cell key={i} fill={i<3?T.green:i<6?T.amber:T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Cost Range by Category ($/tCO2e)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CATEGORIES.map(c => {
                  const items = COST_PER_TONNE.filter(ct => {
                    const ot = OFFSET_TYPES.find(o=>o.id===ct.typeId);
                    return ot && ot.category === c;
                  });
                  const n = items.length;
                  return { category:c, low:n>0?Math.min(...items.map(x=>x.costLow)):0, mid:n>0?Math.round(items.reduce((a,x)=>a+x.costMid,0)/n):0, high:n>0?Math.max(...items.map(x=>x.costHigh)):0 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize:9 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="low" name="Low" fill={T.green} />
                  <Bar dataKey="mid" name="Mid" fill={T.amber} />
                  <Bar dataKey="high" name="High" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {/* ═══════ TAB 1: Reversal Probability Engine ═══════ */}
        {tab === 1 && (<div>
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontSize:11, color:T.sub }}>Time Horizon:</span>
            <input type="range" min={10} max={100} step={5} value={timeHorizon} onChange={e=>setTimeHorizon(Number(e.target.value))} style={{ width:200 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>{timeHorizon} yr</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Reversal Probability by Decade Band (%)</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={reversalByBand}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:8 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize:10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="0-10yr" stackId="a" fill={T.green} />
                  <Bar dataKey="10-20yr" stackId="a" fill={T.amber} />
                  <Bar dataKey="20-50yr" stackId="a" fill="#ea580c" />
                  <Bar dataKey="50-100yr" stackId="a" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Cumulative Reversal Probability Over Time</div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={cumReversalLine}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:10 }} label={{ value:'Year', position:'bottom', fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} domain={[0,100]} />
                  <Tooltip formatter={v=>`${v}%`} /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Line type="monotone" dataKey="cumProb" name="Avg Cumulative %" stroke={T.red} strokeWidth={2} dot={{ r:3 }} />
                  <ReferenceLine y={50} stroke={T.amber} strokeDasharray="5 5" label={{ value:'50%', fontSize:10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Worst-Case Reversal Risk (sorted by total reversal probability at {timeHorizon}yr)</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Type','Category','Rev/Decade','Cum @ '+timeHorizon+'yr','Fire','Drought','Flood','Policy'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 6px', color:T.sub, fontSize:10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{[...filtered].sort((a,b)=>(1-Math.pow(1-b.reversalDecade,timeHorizon/10))-(1-Math.pow(1-a.reversalDecade,timeHorizon/10))).map(o=>(
                <tr key={o.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:6, fontWeight:600 }}>{o.name}</td>
                  <td style={{ padding:6 }}><span style={{ padding:'2px 8px', borderRadius:10, fontSize:9, background:CAT_COLORS[o.category]+'22', color:CAT_COLORS[o.category] }}>{o.category}</span></td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{(o.reversalDecade*100).toFixed(1)}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace", color:T.red }}>{((1-Math.pow(1-o.reversalDecade,timeHorizon/10))*100).toFixed(1)}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{(o.fireRisk*100).toFixed(0)}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{(o.droughtRisk*100).toFixed(0)}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{(o.floodRisk*100).toFixed(0)}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{(o.policyRisk*100).toFixed(0)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {/* ═══════ TAB 2: Buffer Pool Stress Test ═══════ */}
        {tab === 2 && (<div>
          <div style={{ display:'flex', gap:24, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:11, color:T.sub, marginRight:8 }}>Buffer Release %:</span>
              <input type="range" min={0} max={50} value={bufferRelease} onChange={e=>setBufferRelease(Number(e.target.value))} style={{ width:160 }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginLeft:8 }}>{bufferRelease}%</span>
            </div>
            <div>
              <span style={{ fontSize:11, color:T.sub, marginRight:8 }}>Stress Multiplier:</span>
              {[1,2,3,5].map(m => (
                <button key={m} onClick={()=>setStressMult(m)} style={{
                  padding:'4px 12px', borderRadius:20, marginRight:6,
                  border:`1px solid ${stressMult===m?T.gold:T.border}`, background:stressMult===m?T.gold+'22':'transparent',
                  cursor:'pointer', fontSize:11, color:stressMult===m?T.navy:T.sub
                }}>{m}x</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Buffer Adequacy Under {stressMult}x Stress (Surplus/Deficit %)</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={bufferStress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <ReferenceLine x={0} stroke={T.red} strokeWidth={2} />
                  <Bar dataKey="surplus" name="Surplus/Deficit %" radius={[0,4,4,0]}>
                    {bufferStress.map((d,i) => <Cell key={i} fill={d.surplus >= 0 ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Required vs Actual vs Effective Buffer</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={bufferStress}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:8 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize:10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="required" name="Required %" fill={T.red} />
                  <Bar dataKey="actual" name="Actual %" fill={T.indigo} />
                  <Bar dataKey="effective" name="Effective %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Buffer Pool Historical Drawdowns (last 5 years)</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={BUFFER_POOL_DATA.slice(0,10)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:8 }} angle={-20} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize:10 }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                <Bar yAxisId="left" dataKey="requiredPct" name="Required Buffer %" fill={T.amber} />
                <Line yAxisId="right" type="monotone" dataKey="adequacyScore" name="Adequacy Score" stroke={T.indigo} strokeWidth={2} dot={{ r:3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {/* ═══════ TAB 3: Climate-Driven Reversal ═══════ */}
        {tab === 3 && (<div>
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:T.sub }}>RCP Scenario:</span>
            {RCP_LIST.map(r => (
              <button key={r} onClick={()=>setRcpScenario(r)} style={{
                padding:'4px 12px', borderRadius:20, border:`1px solid ${rcpScenario===r?T.gold:T.border}`,
                background:rcpScenario===r?T.gold+'22':'transparent', cursor:'pointer', fontSize:11, color:rcpScenario===r?T.navy:T.sub
              }}>{r}</button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Reversal Multiplier by Type ({rcpScenario})</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={climateData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                  <Tooltip formatter={v=>`${v}x`} />
                  <ReferenceLine x={1} stroke={T.sub} strokeDasharray="5 5" />
                  <Bar dataKey="mult" name="Reversal Multiplier" radius={[0,4,4,0]}>
                    {climateData.map((d,i)=><Cell key={i} fill={d.mult>1.5?T.red:d.mult>1.2?T.amber:T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Compound Risk Matrix: Fire + Drought + Flood + Policy</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={compoundRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:8 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize:10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="fire" stackId="a" name="Fire %" fill={T.red} />
                  <Bar dataKey="drought" stackId="a" name="Drought %" fill={T.amber} />
                  <Bar dataKey="flood" stackId="a" name="Flood %" fill={T.indigo} />
                  <Bar dataKey="policy" stackId="a" name="Policy %" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Temperature Anomaly vs Reversal Rate</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tempAnomaly" name="Temp Anomaly" tick={{ fontSize:10 }} />
                  <YAxis dataKey="reversalRate" name="Reversal %" tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Scatter data={[1.5,2.0,2.5,3.0,4.0,5.0].map((t,i) => ({ tempAnomaly:t, reversalRate:+(5+t*t*1.2+sr(i*29)*3).toFixed(1) }))} fill={T.red} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...card, background:T.navy+'08', border:`1px solid ${T.gold}33` }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:8 }}>Circular Feedback Warning</div>
              <div style={{ fontSize:11, color:T.sub, lineHeight:1.7 }}>
                Higher warming increases wildfire frequency, which destroys forest offsets, reducing emission reductions and contributing to further warming. Under {rcpScenario}, nature-based reversals increase by {((RCP_MULT[rcpScenario]-1)*100).toFixed(0)}% above baseline. This circular feedback makes NbS offsets less reliable precisely when most needed.
              </div>
              <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[{l:'Wildfire Risk',v:`+${((RCP_MULT[rcpScenario]-1)*60).toFixed(0)}%`},{l:'Drought Risk',v:`+${((RCP_MULT[rcpScenario]-1)*45).toFixed(0)}%`},{l:'Pest Outbreak',v:`+${((RCP_MULT[rcpScenario]-1)*30).toFixed(0)}%`},{l:'Policy Stability',v:'Unchanged'}].map(x=>(
                  <div key={x.l} style={{ padding:8, background:T.card, borderRadius:6, border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:9, color:T.sub }}>{x.l}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:x.v==='Unchanged'?T.green:T.red, fontFamily:"'JetBrains Mono',monospace" }}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>)}

        {/* ═══════ TAB 4: Insurance & Hedging ═══════ */}
        {tab === 4 && (<div>
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontSize:11, color:T.sub }}>Insurance Budget ($M):</span>
            <input type="range" min={10} max={200} step={5} value={insurBudget} onChange={e=>setInsurBudget(Number(e.target.value))} style={{ width:200 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>${insurBudget}M</span>
          </div>
          <div style={card}>
            <div style={lbl}>Insurance Products Comparison</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Provider','Coverage','Premium %','Deductible %','Max Payout $M','Eligible Types','Exclusions'].map(h=>
                  <th key={h} style={{ textAlign:'left', padding:'8px 6px', color:T.sub, fontSize:10 }}>{h}</th>
                )}
              </tr></thead>
              <tbody>{INSURANCE_PRODUCTS.map(p=>(
                <tr key={p.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:6, fontWeight:600 }}>{p.provider}</td>
                  <td style={{ padding:6 }}>{p.coverageType}</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{p.premiumRate}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{p.deductible}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>${p.maxPayout}M</td>
                  <td style={{ padding:6, fontSize:10 }}>{p.eligibleTypes.join(', ')}</td>
                  <td style={{ padding:6, fontSize:10, color:T.sub }}>{p.exclusions}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Premium Rate vs Expected Loss</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="premiumRate" name="Premium %" tick={{ fontSize:10 }} />
                  <YAxis dataKey="maxPayout" name="Max Payout $M" tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Scatter data={INSURANCE_PRODUCTS} fill={T.indigo}>
                    {INSURANCE_PRODUCTS.map((_,i)=><Cell key={i} fill={[T.green,T.indigo,T.amber,T.red,'#7c3aed','#0891b2',T.navy,T.gold][i]} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Coverage Gap Analysis (Insured vs Uninsured Types)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CATEGORIES.map(c => {
                  const items = OFFSET_TYPES.filter(o=>o.category===c);
                  const insN = items.filter(o=>o.insurable).length;
                  return { category:c, insured:insN, uninsured:items.length - insN };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="insured" name="Insured" fill={T.green} stackId="a" />
                  <Bar dataKey="uninsured" name="Uninsured" fill={T.red} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Insured vs Uninsured Portfolio VaR Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { metric:'VaR 95%', uninsured:monteCarloResults.var95, insured:Math.round(monteCarloResults.var95*0.6) },
                { metric:'VaR 99%', uninsured:monteCarloResults.var99, insured:Math.round(monteCarloResults.var99*0.55) },
                { metric:'CVaR 95%', uninsured:monteCarloResults.cvar95, insured:Math.round(monteCarloResults.cvar95*0.5) },
                { metric:'CVaR 99%', uninsured:monteCarloResults.cvar99, insured:Math.round(monteCarloResults.cvar99*0.45) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="metric" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                <Tooltip formatter={v=>`$${v.toLocaleString()}`} /><Legend wrapperStyle={{ fontSize:10 }} />
                <Bar dataKey="uninsured" name="Uninsured" fill={T.red} />
                <Bar dataKey="insured" name="Insured" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Cost-Benefit Analysis: Premium Cost vs Risk Reduction</div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={INSURANCE_PRODUCTS.map(p => ({
                provider:p.provider.split(' ')[0], premium:p.premiumRate, riskReduction:+(p.maxPayout/(p.premiumRate+0.01)*2).toFixed(1),
                roi:+((p.maxPayout - p.premiumRate*10) / Math.max(1, p.premiumRate*10) * 100).toFixed(0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="provider" tick={{ fontSize:9 }} angle={-15} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fontSize:10 }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                <Bar yAxisId="left" dataKey="premium" name="Premium %" fill={T.amber} />
                <Line yAxisId="right" type="monotone" dataKey="roi" name="ROI %" stroke={T.green} strokeWidth={2} dot={{ r:3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Optimal Insurance Allocation (Budget: ${insurBudget}M) -- {insurAlloc.length} eligible products</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={insurAlloc}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="provider" tick={{ fontSize:9 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:10 }} /><Tooltip formatter={v=>`$${v}M`} />
                <Bar dataKey="allocated" name="Allocated $M" fill={T.indigo} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {/* ═══════ TAB 5: Historical Reversal Analysis ═══════ */}
        {tab === 5 && (<div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:16 }}>
            {[
              { l:'Total Events', v:REVERSAL_EVENTS.length, c:T.navy },
              { l:'Total Reversed', v:`${(REVERSAL_EVENTS.reduce((a,e)=>a+e.tonnesReversed,0)/1e6).toFixed(1)}M t`, c:T.red },
              { l:'Avg Recovery', v:`${(REVERSAL_EVENTS.length>0?REVERSAL_EVENTS.reduce((a,e)=>a+e.recoveryTimeYrs,0)/REVERSAL_EVENTS.length:0).toFixed(1)} yr`, c:T.amber },
              { l:'Top Cause', v:(() => { const m={}; REVERSAL_EVENTS.forEach(e=>{m[e.cause]=(m[e.cause]||0)+1}); const s=Object.entries(m).sort(([,a],[,b])=>b-a); return s.length>0?s[0][0]:'--'; })(), c:T.indigo },
              { l:'Avg Buffer Draw', v:`${(REVERSAL_EVENTS.length>0?REVERSAL_EVENTS.reduce((a,e)=>a+parseFloat(e.bufferDrawn),0)/REVERSAL_EVENTS.length:0).toFixed(1)}%`, c:T.green },
            ].map(k => (
              <div key={k.l} style={kpiBox}>
                <div style={lbl}>{k.l}</div>
                <div style={{ fontSize:18, fontWeight:700, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Tonnes Reversed by Year</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={eventsByYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip formatter={v=>`${(v/1000).toFixed(0)}k tCO2e`} />
                  <Area type="monotone" dataKey="tonnes" name="Tonnes Reversed" fill={T.red+'44'} stroke={T.red} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Cause Breakdown</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={causeBreakdown} dataKey="count" nameKey="cause" cx="50%" cy="50%" outerRadius={90} label={({cause,count})=>`${cause}: ${count}`}>
                    {causeBreakdown.map((_,i)=><Cell key={i} fill={[T.red,T.amber,'#7c3aed',T.indigo,T.navy][i%5]} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Recovery Time Distribution (years)</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { range:'0-2yr', count:REVERSAL_EVENTS.filter(e=>e.recoveryTimeYrs<=2).length },
                  { range:'2-5yr', count:REVERSAL_EVENTS.filter(e=>e.recoveryTimeYrs>2&&e.recoveryTimeYrs<=5).length },
                  { range:'5-10yr', count:REVERSAL_EVENTS.filter(e=>e.recoveryTimeYrs>5&&e.recoveryTimeYrs<=10).length },
                  { range:'10+yr', count:REVERSAL_EVENTS.filter(e=>e.recoveryTimeYrs>10).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip /><Bar dataKey="count" name="Events" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Regional Concentration</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={(() => {
                  const map = {};
                  REVERSAL_EVENTS.forEach(e => { map[e.region] = (map[e.region]||0)+e.tonnesReversed; });
                  return Object.entries(map).sort(([,a],[,b])=>b-a).map(([r,t])=>({ region:r, tonnes:t }));
                })()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="region" width={100} tick={{ fontSize:9 }} />
                  <Tooltip formatter={v=>`${(v/1000).toFixed(0)}k tCO2e`} />
                  <Bar dataKey="tonnes" name="Tonnes" fill={T.indigo} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Top 5 Reversal Events</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
              {[...REVERSAL_EVENTS].sort((a,b)=>b.tonnesReversed-a.tonnesReversed).slice(0,5).map(e=>(
                <div key={e.id} style={{ padding:12, background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:10, color:T.sub }}>{e.date}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, margin:'4px 0' }}>{(e.tonnesReversed/1000).toFixed(0)}k tCO2e</div>
                  <div style={{ fontSize:10, color:T.sub }}>{e.projectType}</div>
                  <div style={{ fontSize:10 }}><span style={{ padding:'2px 6px', borderRadius:8, background:T.red+'22', color:T.red, fontSize:9 }}>{e.cause}</span> {e.region}</div>
                  <div style={{ fontSize:10, color:T.sub, marginTop:4 }}>Recovery: {e.recoveryTimeYrs}yr | Buffer: {e.bufferDrawn}%</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={lbl}>Full Reversal Events Timeline (30 events)</div>
            <div style={{ maxHeight:320, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead><tr style={{ borderBottom:`2px solid ${T.border}`, position:'sticky', top:0, background:T.card }}>
                  {['#','Date','Project Type','Tonnes','Cause','Region','Recovery (yr)','Buffer %'].map(h=><th key={h} style={{ textAlign:'left', padding:'6px', color:T.sub, fontSize:9 }}>{h}</th>)}
                </tr></thead>
                <tbody>{[...REVERSAL_EVENTS].sort((a,b)=>b.tonnesReversed-a.tonnesReversed).map(e=>(
                  <tr key={e.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>{e.id}</td>
                    <td style={{ padding:4 }}>{e.date}</td>
                    <td style={{ padding:4, fontWeight:600 }}>{e.projectType}</td>
                    <td style={{ padding:4, fontFamily:"'JetBrains Mono',monospace", color:e.tonnesReversed>200000?T.red:T.amber }}>{(e.tonnesReversed/1000).toFixed(0)}k</td>
                    <td style={{ padding:4 }}><span style={{ padding:'2px 6px', borderRadius:8, fontSize:9, background:{fire:T.red+'22',drought:T.amber+'22',pest:'#7c3aed22',policy:T.indigo+'22',fraud:T.navy+'22'}[e.cause]||T.sub+'22', color:{fire:T.red,drought:T.amber,pest:'#7c3aed',policy:T.indigo,fraud:T.navy}[e.cause]||T.sub }}>{e.cause}</span></td>
                    <td style={{ padding:4, fontSize:10 }}>{e.region}</td>
                    <td style={{ padding:4, fontFamily:"'JetBrains Mono',monospace" }}>{e.recoveryTimeYrs}</td>
                    <td style={{ padding:4, fontFamily:"'JetBrains Mono',monospace" }}>{e.bufferDrawn}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>)}

        {/* ═══════ TAB 6: Permanence Decay Modeling ═══════ */}
        {tab === 6 && (<div>
          <div style={{ marginBottom:16 }}>
            <span style={{ fontSize:11, color:T.sub, marginRight:8 }}>Select types to overlay:</span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
              {OFFSET_TYPES.map(o => (
                <button key={o.id} onClick={()=>toggleDecayType(o.id)} style={{
                  padding:'3px 10px', borderRadius:16, fontSize:10, cursor:'pointer',
                  border:`1px solid ${selectedDecayTypes.includes(o.id)?CAT_COLORS[o.category]:T.border}`,
                  background:selectedDecayTypes.includes(o.id)?CAT_COLORS[o.category]+'22':'transparent',
                  color:selectedDecayTypes.includes(o.id)?CAT_COLORS[o.category]:T.sub
                }}>{o.name}</button>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Permanence Decay Curves (% remaining over 100 years)</div>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={decayCurves}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:10 }} label={{ value:'Year', position:'bottom', fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} domain={[0,105]} />
                <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                {OFFSET_TYPES.filter(o=>selectedDecayTypes.includes(o.id)).map((o,i) => (
                  <Line key={o.id} type="monotone" dataKey={o.name} stroke={[T.green,T.indigo,T.amber,T.red,'#7c3aed','#0891b2',T.navy,T.gold][i%8]} strokeWidth={2} dot={false} />
                ))}
                <ReferenceLine y={50} stroke={T.sub} strokeDasharray="5 5" label={{ value:'Half-life', fontSize:10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Half-life Comparison (years)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={OFFSET_TYPES.map(o=>({ name:o.name, halfLife:Math.round(o.permanenceYrs*0.7), category:o.category })).sort((a,b)=>b.halfLife-a.halfLife)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0,1000]} tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                  <Tooltip formatter={v=>`${v} yr`} />
                  <Bar dataKey="halfLife" name="Half-life (yr)" radius={[0,4,4,0]}>
                    {OFFSET_TYPES.map((o,i)=><Cell key={i} fill={CAT_COLORS[o.category]||T.sub} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Expected Remaining at Year 25 / 50 / 100</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Type','@ 25yr','@ 50yr','@ 100yr','Discount Factor'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 6px', color:T.sub, fontSize:10 }}>{h}</th>)}
                </tr></thead>
                <tbody>{PERMANENCE_DECAY_CURVES.map(c => {
                  const r25 = c.curve[25] ? c.curve[25].remaining : 0;
                  const r50 = c.curve[50] ? c.curve[50].remaining : 0;
                  const r100 = c.curve[100] ? c.curve[100].remaining : 0;
                  const discount = r50 > 0 ? +(r50/100).toFixed(3) : 0;
                  return (
                    <tr key={c.typeId} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:6, fontWeight:600 }}>{c.name}</td>
                      <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace", color:r25>80?T.green:r25>50?T.amber:T.red }}>{r25.toFixed(1)}%</td>
                      <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace", color:r50>80?T.green:r50>50?T.amber:T.red }}>{r50.toFixed(1)}%</td>
                      <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace", color:r100>80?T.green:r100>50?T.amber:T.red }}>{r100.toFixed(1)}%</td>
                      <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{discount}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>

          <div style={card}>
            <div style={lbl}>NPV of Permanence Stream (discount rate 5%, price $25/tCO2e per year of permanence)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PERMANENCE_DECAY_CURVES.map(c => {
                const price = 25;
                const rate = 0.05;
                let npv = 0;
                for (let y = 1; y <= 100; y++) {
                  const rem = c.curve[y] ? c.curve[y].remaining / 100 : 0;
                  npv += (price * rem) / Math.pow(1+rate, y);
                }
                return { name:c.name, npv:+npv.toFixed(0), category:c.category };
              }).sort((a,b)=>b.npv-a.npv)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                <Tooltip formatter={v=>`$${v.toLocaleString()}`} />
                <Bar dataKey="npv" name="NPV ($)" radius={[0,4,4,0]}>
                  {PERMANENCE_DECAY_CURVES.map((c,i) => <Cell key={i} fill={CAT_COLORS[c.category]||T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {/* ═══════ TAB 7: Monitoring & MRV ═══════ */}
        {tab === 7 && (<div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Annual Monitoring Cost by Type ($)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={[...MONITORING_COSTS].sort((a,b)=>b.annualCost-a.annualCost)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                  <Tooltip formatter={v=>`$${v.toLocaleString()}`} />
                  <Bar dataKey="annualCost" name="Annual Cost $" fill={T.indigo} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>MRV Technology Readiness (Compliance Score)</div>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={MONITORING_COSTS.slice(0,8).map(m => ({
                  name:m.name.length > 12 ? m.name.slice(0,12)+'..' : m.name,
                  compliance:m.complianceScore, cost:Math.min(100, m.annualCost/1000)
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize:8 }} />
                  <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} />
                  <Radar name="Compliance" dataKey="compliance" stroke={T.green} fill={T.green} fillOpacity={0.3} />
                  <Radar name="Cost Index" dataKey="cost" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize:10 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Verification & Monitoring Details</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Type','Annual Cost','Frequency','Technology','MRV Complexity','Maturity','Compliance'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 6px', color:T.sub, fontSize:10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{MONITORING_COSTS.map((m,i)=>{
                const ot = OFFSET_TYPES.find(o=>o.id===m.typeId);
                return (
                  <tr key={m.typeId} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:6, fontWeight:600 }}>{m.name}</td>
                    <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>${m.annualCost.toLocaleString()}</td>
                    <td style={{ padding:6 }}>{m.verificationFreq}</td>
                    <td style={{ padding:6 }}><span style={{ padding:'2px 8px', borderRadius:10, fontSize:9, background:T.indigo+'22', color:T.indigo }}>{m.technology}</span></td>
                    <td style={{ padding:6 }}><span style={{ padding:'2px 8px', borderRadius:10, fontSize:9, background:ot&&ot.mrvComplexity==='high'?T.red+'22':ot&&ot.mrvComplexity==='med'?T.amber+'22':T.green+'22', color:ot&&ot.mrvComplexity==='high'?T.red:ot&&ot.mrvComplexity==='med'?T.amber:T.green }}>{ot?ot.mrvComplexity:'--'}</span></td>
                    <td style={{ padding:6, fontSize:10 }}>{ot?ot.technologyMaturity:'--'}</td>
                    <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace", color:m.complianceScore>80?T.green:m.complianceScore>60?T.amber:T.red }}>{m.complianceScore}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Annual Monitoring Spend by Technology</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={(() => {
                const map = {};
                MONITORING_COSTS.forEach(m => { map[m.technology] = (map[m.technology]||0)+m.annualCost; });
                return Object.entries(map).map(([t,c])=>({ technology:t, totalCost:c }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="technology" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                <Tooltip formatter={v=>`$${v.toLocaleString()}`} />
                <Bar dataKey="totalCost" name="Total Annual $" fill={T.amber} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={lbl}>Regulatory Framework Requirements</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Framework','Jurisdiction','Permanence Req','Buffer Req','Accepted Types','Year'].map(h=>
                  <th key={h} style={{ textAlign:'left', padding:'6px', color:T.sub, fontSize:10 }}>{h}</th>
                )}
              </tr></thead>
              <tbody>{REGULATORY_FRAMEWORKS.map(r=>(
                <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:5, fontWeight:600 }}>{r.name}</td>
                  <td style={{ padding:5 }}><span style={{ padding:'2px 8px', borderRadius:10, fontSize:9, background:T.indigo+'22', color:T.indigo }}>{r.jurisdiction}</span></td>
                  <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>{r.permanenceReq}</td>
                  <td style={{ padding:5, fontSize:10 }}>{r.bufferReq}</td>
                  <td style={{ padding:5, fontSize:10, maxWidth:200 }}>{r.accepted.join(', ')}</td>
                  <td style={{ padding:5, fontFamily:"'JetBrains Mono',monospace" }}>{r.yearAdopted}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Monitoring Technology Coverage</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={(() => {
                    const m = {};
                    MONITORING_COSTS.forEach(mc => { m[mc.technology]=(m[mc.technology]||0)+1; });
                    return Object.entries(m).map(([t,n])=>({ tech:t, count:n }));
                  })()} dataKey="count" nameKey="tech" cx="50%" cy="50%" outerRadius={70} label={({tech,count})=>`${tech}: ${count}`}>
                    {[T.green,T.indigo,T.amber,'#7c3aed'].map((c,i)=><Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>MRV Complexity Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={['low','med','high'].map(lvl => ({
                  level:lvl, count:OFFSET_TYPES.filter(o=>o.mrvComplexity===lvl).length,
                  avgCost: (() => { const items = MONITORING_COSTS.filter((_,i)=>OFFSET_TYPES[i]&&OFFSET_TYPES[i].mrvComplexity===lvl); return items.length>0?Math.round(items.reduce((a,m)=>a+m.annualCost,0)/items.length):0; })()
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="level" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="count" name="Types" fill={T.indigo} />
                  <Bar dataKey="avgCost" name="Avg Cost $" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {/* ═══════ TAB 8: Nature vs Engineered Trade-off ═══════ */}
        {tab === 8 && (<div>
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontSize:11, color:T.sub }}>Nature:Engineered Ratio:</span>
            <input type="range" min={0} max={100} value={natureRatio} onChange={e=>setNatureRatio(Number(e.target.value))} style={{ width:200 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>{natureRatio}:{100-natureRatio}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Permanence vs Cost (sized by volume, colored by category)</div>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="permanence" name="Permanence (yr)" tick={{ fontSize:10 }} />
                  <YAxis dataKey="cost" name="Cost ($/tCO2e)" tick={{ fontSize:10 }} />
                  <Tooltip formatter={(v,n)=>[v,n]} />
                  <Scatter data={tradeoffScatter} fill={T.indigo}>
                    {tradeoffScatter.map((d,i) => <Cell key={i} fill={CAT_COLORS[d.category]||T.sub} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Risk-Adjusted Return by Category</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={CATEGORIES.map(c => {
                  const items = OFFSET_TYPES.filter(o=>o.category===c);
                  const n = items.length;
                  const avgPerm = n > 0 ? items.reduce((a,o)=>a+Math.min(o.permanenceYrs,500),0)/n : 0;
                  const avgRisk = n > 0 ? items.reduce((a,o)=>a+o.reversalDecade*100,0)/n : 0;
                  return { category:c, riskAdjReturn:avgRisk > 0 ? +(avgPerm/avgRisk).toFixed(1) : 0, avgPerm:+avgPerm.toFixed(0) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                  <Bar dataKey="riskAdjReturn" name="Risk-Adj Return" fill={T.green} radius={[4,4,0,0]}>
                    {CATEGORIES.map((c,i) => <Cell key={i} fill={CAT_COLORS[c]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Efficient Frontier: Permanence vs Cost at Various Nature:Engineered Ratios</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={Array.from({length:11},(_,i)=>{
                const natR = i*10;
                const natureT = OFFSET_TYPES.filter(o=>['Nature','Blue Carbon','Soil'].includes(o.category));
                const engT = OFFSET_TYPES.filter(o=>['Engineered','Industrial'].includes(o.category));
                const nN=natureT.length; const nE=engT.length;
                const natP = nN>0 ? natureT.reduce((a,o)=>a+o.permanenceYrs,0)/nN : 0;
                const engP = nE>0 ? engT.reduce((a,o)=>a+Math.min(o.permanenceYrs,1000),0)/nE : 0;
                const perm = natP*natR/100 + engP*(100-natR)/100;
                const cost = 20*natR/100 + 150*(100-natR)/100;
                return { ratio:`${natR}:${100-natR}`, permanence:+perm.toFixed(0), cost:+cost.toFixed(0) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ratio" tick={{ fontSize:10 }} label={{ value:'Nature:Engineered', position:'bottom', fontSize:9 }} />
                <YAxis yAxisId="left" tick={{ fontSize:10 }} label={{ value:'Perm (yr)', angle:-90, position:'insideLeft', fontSize:9 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} label={{ value:'Cost ($/t)', angle:90, position:'insideRight', fontSize:9 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                <Line yAxisId="left" type="monotone" dataKey="permanence" name="Permanence (yr)" stroke={T.green} strokeWidth={2} dot={{ r:3 }} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($/tCO2e)" stroke={T.red} strokeWidth={2} dot={{ r:3 }} />
                <ReferenceLine yAxisId="left" x={`${natureRatio}:${100-natureRatio}`} stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" label={{ value:'Current', fontSize:10, fill:T.gold }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Total Cost of Permanence by Type ($/tCO2e per permanence-year)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={OFFSET_TYPES.map((o,i)=>{
                const cost = COST_PER_TONNE.find(c=>c.typeId===o.id);
                const midCost = cost ? cost.costMid : 30;
                const permYrs = Math.min(o.permanenceYrs, 1000);
                const costPerPermYr = permYrs > 0 ? +(midCost / permYrs).toFixed(4) : 0;
                return { name:o.name, costPerPermYr, category:o.category };
              }).sort((a,b)=>a.costPerPermYr-b.costPerPermYr)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:9 }} />
                <Tooltip formatter={v=>`$${v}/perm-yr`} />
                <Bar dataKey="costPerPermYr" name="$/Permanence-Year" radius={[0,4,4,0]}>
                  {OFFSET_TYPES.map((o,i)=><Cell key={i} fill={CAT_COLORS[o.category]||T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Blended Portfolio Analysis -- Nature {natureRatio}% : Non-Nature {100-natureRatio}%</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:12 }}>
              {(() => {
                const natureTypes = OFFSET_TYPES.filter(o=>['Nature','Blue Carbon','Soil'].includes(o.category));
                const engTypes = OFFSET_TYPES.filter(o=>['Engineered','Industrial'].includes(o.category));
                const nN = natureTypes.length; const nE = engTypes.length;
                const natPerm = nN > 0 ? natureTypes.reduce((a,o)=>a+o.permanenceYrs,0)/nN : 0;
                const engPerm = nE > 0 ? engTypes.reduce((a,o)=>a+Math.min(o.permanenceYrs,1000),0)/nE : 0;
                const natRev = nN > 0 ? natureTypes.reduce((a,o)=>a+o.reversalDecade,0)/nN*100 : 0;
                const engRev = nE > 0 ? engTypes.reduce((a,o)=>a+o.reversalDecade,0)/nE*100 : 0;
                const blendPerm = (natPerm*natureRatio/100 + engPerm*(100-natureRatio)/100);
                const blendRev = (natRev*natureRatio/100 + engRev*(100-natureRatio)/100);
                const blendCost = (25*natureRatio/100 + 150*(100-natureRatio)/100);
                const totalCostPerm = blendPerm > 0 ? +(blendCost / (blendPerm/100)).toFixed(2) : 0;
                return [
                  { l:'Blended Permanence', v:`${blendPerm.toFixed(0)} yr`, c:T.navy },
                  { l:'Blended Reversal', v:`${blendRev.toFixed(2)}%/dec`, c:T.red },
                  { l:'Blended Cost', v:`$${blendCost.toFixed(0)}/t`, c:T.amber },
                  { l:'Cost per Perm-Year', v:`$${totalCostPerm}`, c:T.indigo },
                ].map(k => (
                  <div key={k.l} style={kpiBox}>
                    <div style={lbl}>{k.l}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>)}

        {/* ═══════ TAB 9: Portfolio Permanence Optimizer ═══════ */}
        {tab === 9 && (<div>
          <div style={{ display:'flex', gap:24, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:11, color:T.sub, marginRight:8 }}>Target Permanence (yr):</span>
              <input type="range" min={10} max={200} step={5} value={targetPermanence} onChange={e=>setTargetPermanence(Number(e.target.value))} style={{ width:160 }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginLeft:8 }}>{targetPermanence} yr</span>
            </div>
            <div>
              <span style={{ fontSize:11, color:T.sub, marginRight:8 }}>Min Buffer %:</span>
              <input type="range" min={5} max={30} value={minBuffer} onChange={e=>setMinBuffer(Number(e.target.value))} style={{ width:120 }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginLeft:8 }}>{minBuffer}%</span>
            </div>
            <div>
              <span style={{ fontSize:11, color:T.sub, marginRight:8 }}>Confidence:</span>
              {[95,99].map(c => (
                <button key={c} onClick={()=>setConfidenceLevel(c)} style={{
                  padding:'4px 12px', borderRadius:20, marginRight:6,
                  border:`1px solid ${confidenceLevel===c?T.gold:T.border}`, background:confidenceLevel===c?T.gold+'22':'transparent',
                  cursor:'pointer', fontSize:11, color:confidenceLevel===c?T.navy:T.sub
                }}>{c}%</button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {[
              { l:`VaR ${confidenceLevel}%`, v:`$${(confidenceLevel===95?monteCarloResults.var95:monteCarloResults.var99).toLocaleString()}`, c:T.red },
              { l:`CVaR ${confidenceLevel}%`, v:`$${(confidenceLevel===95?monteCarloResults.cvar95:monteCarloResults.cvar99).toLocaleString()}`, c:T.red },
              { l:'Portfolio Score', v:`${(filtered.length > 0 ? filtered.reduce((a,o)=>a+Math.min(o.permanenceYrs,200),0)/filtered.length : 0).toFixed(0)}`, c:T.navy },
              { l:'Target Met', v:filtered.length > 0 && (filtered.reduce((a,o)=>a+o.permanenceYrs,0)/filtered.length) >= targetPermanence ? 'YES' : 'NO', c:filtered.length > 0 && (filtered.reduce((a,o)=>a+o.permanenceYrs,0)/filtered.length)>=targetPermanence?T.green:T.red },
            ].map(k => (
              <div key={k.l} style={kpiBox}>
                <div style={lbl}>{k.l}</div>
                <div style={{ fontSize:20, fontWeight:700, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Monte Carlo Simulation -- 500 Paths, 20yr Horizon (showing 50)</div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={monteCarloResults.pathData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  {Array.from({length:Math.min(50,500)},(_,p)=>(
                    <Line key={p} type="monotone" dataKey={`p${p}`} stroke={T.red+'33'} strokeWidth={0.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Loss Distribution (500 simulations)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={(() => {
                  const losses = monteCarloResults.losses;
                  if (losses.length === 0) return [];
                  const mx = losses[losses.length-1] || 1;
                  const bins = 15;
                  const bw = mx / bins;
                  return Array.from({length:bins},(_,b)=>({
                    range:`${(b*bw/1000).toFixed(0)}k`,
                    count:losses.filter(l=>l>=b*bw&&l<(b+1)*bw).length
                  }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize:9 }} /><YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <ReferenceLine x={`${(((confidenceLevel===95?monteCarloResults.var95:monteCarloResults.var99)/1000)).toFixed(0)}k`} stroke={T.red} strokeWidth={2} label={{ value:`VaR ${confidenceLevel}%`, fontSize:10, fill:T.red }} />
                  <Bar dataKey="count" name="Frequency" fill={T.indigo} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <div style={lbl}>Optimal Allocation (Target: {targetPermanence}yr, Min Buffer: {minBuffer}%)</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Type','Category','Permanence','Reversal/Dec','Score','Allocation %'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 6px', color:T.sub, fontSize:10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{[...optimalAlloc].sort((a,b)=>b.allocPct-a.allocPct).map(a=>(
                <tr key={a.name} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:6, fontWeight:600 }}>{a.name}</td>
                  <td style={{ padding:6 }}><span style={{ padding:'2px 8px', borderRadius:10, fontSize:9, background:CAT_COLORS[a.category]+'22', color:CAT_COLORS[a.category] }}>{a.category}</span></td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{Math.min(a.permanenceYrs,1000)} yr</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{(a.reversalDecade*100).toFixed(2)}%</td>
                  <td style={{ padding:6, fontFamily:"'JetBrains Mono',monospace" }}>{a.score}</td>
                  <td style={{ padding:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:80, height:8, background:T.border, borderRadius:4 }}>
                        <div style={{ width:`${Math.min(a.allocPct,100)}%`, height:8, background:CAT_COLORS[a.category]||T.indigo, borderRadius:4 }} />
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>{a.allocPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={card}>
              <div style={lbl}>Allocation by Category (Optimized)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={(() => {
                    const m = {};
                    optimalAlloc.forEach(a => { m[a.category] = (m[a.category]||0)+a.allocPct; });
                    return Object.entries(m).map(([c,p])=>({ category:c, pct:+p.toFixed(1) }));
                  })()} dataKey="pct" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({category,pct})=>`${category}: ${pct}%`}>
                    {CATEGORIES.map((c,i)=><Cell key={i} fill={CAT_COLORS[c]} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize:10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Permanence Score Sensitivity</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[10,20,30,50,75,100,150,200].map(tgt => {
                  const meetsTarget = filtered.filter(o=>o.permanenceYrs>=tgt).length;
                  const pct = filtered.length > 0 ? (meetsTarget/filtered.length*100) : 0;
                  return { target:tgt, pctMeeting:+pct.toFixed(1) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="target" tick={{ fontSize:10 }} label={{ value:'Target Permanence (yr)', position:'bottom', fontSize:9 }} />
                  <YAxis tick={{ fontSize:10 }} domain={[0,100]} />
                  <Tooltip formatter={v=>`${v}%`} />
                  <Line type="monotone" dataKey="pctMeeting" name="% Meeting Target" stroke={T.indigo} strokeWidth={2} dot={{ r:3 }} />
                  <ReferenceLine x={targetPermanence} stroke={T.gold} strokeDasharray="5 5" label={{ value:'Current', fontSize:9, fill:T.gold }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <div style={lbl}>Portfolio Risk Summary</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginTop:8 }}>
              {[
                { l:'Total Tonnes', v:`${(PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.tonnesHeld,0)/1e6).toFixed(2)}M`, c:T.navy },
                { l:'Avg Vintage', v:`${(PORTFOLIO_POSITIONS.length>0?Math.round(PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.avgVintage,0)/PORTFOLIO_POSITIONS.length):0)}`, c:T.sub },
                { l:'Total Value', v:`$${(PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.tonnesHeld*p.avgPrice,0)/1e6).toFixed(1)}M`, c:T.indigo },
                { l:'Unrealized P&L', v:`$${(PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.unrealizedPnL,0)/1e3).toFixed(0)}k`, c:PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.unrealizedPnL,0)>=0?T.green:T.red },
                { l:'Nature Exposure', v:`${(PORTFOLIO_POSITIONS.filter(p=>['Nature','Blue Carbon','Soil'].includes(p.category)).reduce((a,p)=>a+p.tonnesHeld,0)/Math.max(1,PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.tonnesHeld,0))*100).toFixed(0)}%`, c:T.green },
                { l:'Eng. Exposure', v:`${(PORTFOLIO_POSITIONS.filter(p=>['Engineered','Industrial'].includes(p.category)).reduce((a,p)=>a+p.tonnesHeld,0)/Math.max(1,PORTFOLIO_POSITIONS.reduce((a,p)=>a+p.tonnesHeld,0))*100).toFixed(0)}%`, c:'#7c3aed' },
              ].map(k => (
                <div key={k.l} style={kpiBox}>
                  <div style={{ ...lbl, fontSize:9 }}>{k.l}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, background:T.navy+'06', border:`1px solid ${T.gold}22` }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:8 }}>Portfolio Optimization Notes</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, fontSize:11, color:T.sub, lineHeight:1.7 }}>
              <div>
                <div style={{ fontWeight:600, color:T.navy, marginBottom:4 }}>Methodology</div>
                The optimizer scores each credit type on a permanence-to-risk ratio, penalizing high reversal probability and rewarding buffer pool adequacy above the minimum threshold ({minBuffer}%). Allocation weights are proportional to positive scores, ensuring zero allocation to negative-scoring types. Monte Carlo VaR uses {500} paths with deterministic seeded randomness for reproducibility.
              </div>
              <div>
                <div style={{ fontWeight:600, color:T.navy, marginBottom:4 }}>Key Assumptions</div>
                Reversal events are modeled as independent Bernoulli trials per decade-type pair. Loss magnitudes follow a uniform distribution seeded per path-type combination. The {confidenceLevel}% VaR represents the loss threshold exceeded by only {100-confidenceLevel}% of simulated scenarios. CVaR captures the expected shortfall beyond VaR, providing a tail-risk measure critical for portfolio permanence guarantees.
              </div>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}

export default OffsetPermanenceRiskPage;
